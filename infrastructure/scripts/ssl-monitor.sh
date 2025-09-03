#!/bin/bash

# SSL证书监控和自动续期脚本
# 监控SSL证书状态并发送到期提醒

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 域名列表
DOMAINS=(
    "zinses-rechner.de"
    "www.zinses-rechner.de"
    "api.zinses-rechner.de"
    "monitoring.zinses-rechner.de"
)

# 告警阈值（天）
WARNING_THRESHOLD=30
CRITICAL_THRESHOLD=7

# 检查单个域名的SSL证书
check_ssl_certificate() {
    local domain=$1
    local result_file=$2
    
    log_info "检查SSL证书: $domain"
    
    # 获取证书信息
    local cert_info
    cert_info=$(echo | timeout 10 openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                openssl x509 -noout -dates -subject -issuer -fingerprint 2>/dev/null)
    
    if [ $? -ne 0 ] || [ -z "$cert_info" ]; then
        log_error "$domain: 无法获取SSL证书信息"
        echo "{\"domain\": \"$domain\", \"status\": \"error\", \"error\": \"无法连接或获取证书\"}" >> "$result_file"
        return 1
    fi
    
    # 解析证书信息
    local not_before not_after subject issuer fingerprint
    not_before=$(echo "$cert_info" | grep "notBefore" | cut -d= -f2)
    not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
    subject=$(echo "$cert_info" | grep "subject" | cut -d= -f2-)
    issuer=$(echo "$cert_info" | grep "issuer" | cut -d= -f2-)
    fingerprint=$(echo "$cert_info" | grep "SHA1 Fingerprint" | cut -d= -f2)
    
    # 计算到期天数
    local expiry_timestamp current_timestamp days_until_expiry
    
    if command -v gdate &> /dev/null; then
        # macOS with GNU date
        expiry_timestamp=$(gdate -d "$not_after" +%s 2>/dev/null)
        current_timestamp=$(gdate +%s)
    else
        # Linux date
        expiry_timestamp=$(date -d "$not_after" +%s 2>/dev/null)
        current_timestamp=$(date +%s)
    fi
    
    if [ -n "$expiry_timestamp" ] && [ -n "$current_timestamp" ]; then
        days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    else
        days_until_expiry=-1
    fi
    
    # 确定状态
    local status="healthy"
    local alert_level="none"
    
    if [ "$days_until_expiry" -le "$CRITICAL_THRESHOLD" ]; then
        status="critical"
        alert_level="critical"
        log_error "$domain: 证书将在 $days_until_expiry 天后到期！"
    elif [ "$days_until_expiry" -le "$WARNING_THRESHOLD" ]; then
        status="warning"
        alert_level="warning"
        log_warning "$domain: 证书将在 $days_until_expiry 天后到期"
    else
        log_success "$domain: 证书有效，$days_until_expiry 天后到期"
    fi
    
    # 写入结果
    cat >> "$result_file" << EOF
{
  "domain": "$domain",
  "status": "$status",
  "alert_level": "$alert_level",
  "days_until_expiry": $days_until_expiry,
  "not_before": "$not_before",
  "not_after": "$not_after",
  "subject": "$subject",
  "issuer": "$issuer",
  "fingerprint": "$fingerprint",
  "checked_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
},
EOF
}

# 发送告警通知
send_alert_notification() {
    local domain=$1
    local days_until_expiry=$2
    local alert_level=$3
    
    local message="🚨 SSL证书告警: $domain 将在 $days_until_expiry 天后到期"
    
    # 发送到Slack（如果配置了）
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="warning"
        if [ "$alert_level" = "critical" ]; then
            color="danger"
        fi
        
        local payload=$(cat << EOF
{
  "channel": "#alerts",
  "username": "SSL Monitor",
  "icon_emoji": ":lock:",
  "text": "$message",
  "attachments": [
    {
      "color": "$color",
      "fields": [
        {
          "title": "域名",
          "value": "$domain",
          "short": true
        },
        {
          "title": "剩余天数",
          "value": "$days_until_expiry",
          "short": true
        },
        {
          "title": "告警级别",
          "value": "$alert_level",
          "short": true
        }
      ],
      "footer": "Zinses-Rechner SSL监控",
      "ts": $(date +%s)
    }
  ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK_URL" &>/dev/null || true
    fi
    
    # 记录到系统日志
    logger "SSL Certificate Alert: $domain expires in $days_until_expiry days"
}

# 主监控流程
main() {
    log_info "🔒 开始SSL证书监控"
    
    # 创建结果文件
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local result_file="ssl-check-results-$timestamp.json"
    
    echo "[" > "$result_file"
    
    local has_alerts=false
    local critical_count=0
    local warning_count=0
    
    # 检查所有域名
    for domain in "${DOMAINS[@]}"; do
        if check_ssl_certificate "$domain" "$result_file"; then
            # 检查是否需要发送告警
            local days_until_expiry
            days_until_expiry=$(tail -n 20 "$result_file" | grep -A 10 "\"domain\": \"$domain\"" | \
                               grep "days_until_expiry" | cut -d: -f2 | tr -d ' ,')
            
            if [ -n "$days_until_expiry" ]; then
                if [ "$days_until_expiry" -le "$CRITICAL_THRESHOLD" ]; then
                    send_alert_notification "$domain" "$days_until_expiry" "critical"
                    critical_count=$((critical_count + 1))
                    has_alerts=true
                elif [ "$days_until_expiry" -le "$WARNING_THRESHOLD" ]; then
                    send_alert_notification "$domain" "$days_until_expiry" "warning"
                    warning_count=$((warning_count + 1))
                    has_alerts=true
                fi
            fi
        fi
    done
    
    # 移除最后的逗号并关闭JSON
    sed -i.bak '$ s/,$//' "$result_file" && rm -f "$result_file.bak"
    echo "]" >> "$result_file"
    
    # 生成摘要
    log_info "📊 SSL监控摘要:"
    echo "- 检查域名数: ${#DOMAINS[@]}"
    echo "- 严重告警: $critical_count"
    echo "- 警告告警: $warning_count"
    echo "- 结果文件: $result_file"
    
    if [ "$has_alerts" = true ]; then
        log_warning "发现SSL证书告警，请及时处理"
        exit 1
    else
        log_success "所有SSL证书状态正常"
    fi
}

# 执行监控
main "$@"
