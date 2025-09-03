#!/bin/bash

# Zinses-Rechner 告警通知脚本
# 用途: 发送各种类型的告警通知
# 使用: ./scripts/send-alert.sh "标题" "消息" [严重程度] [渠道]

set -e

ALERT_TITLE="${1:-未知告警}"
ALERT_MESSAGE="${2:-无详细信息}"
SEVERITY="${3:-warning}"
CHANNELS="${4:-slack,email}"

TIMESTAMP=$(date -Iseconds)
LOG_FILE="logs/alerts.log"

# 创建日志目录
mkdir -p logs

# 日志函数
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# 加载配置
load_config() {
    # 从环境变量或配置文件加载
    if [ -f ".env.production" ]; then
        source .env.production
    fi
    
    # 设置默认值
    SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
    EMAIL_SMTP_SERVER=${EMAIL_SMTP_SERVER:-""}
    EMAIL_FROM=${EMAIL_FROM:-"alerts@zinses-rechner.de"}
    EMAIL_TO=${EMAIL_TO:-"ops@zinses-rechner.de"}
    PAGERDUTY_INTEGRATION_KEY=${PAGERDUTY_INTEGRATION_KEY:-""}
}

# 发送Slack通知
send_slack_alert() {
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        log "Slack Webhook URL未配置，跳过Slack通知"
        return 0
    fi
    
    log "发送Slack告警..."
    
    # 根据严重程度设置颜色和图标
    local color="good"
    local icon="ℹ️"
    
    case $SEVERITY in
        "critical")
            color="danger"
            icon="🚨"
            ;;
        "warning")
            color="warning"
            icon="⚠️"
            ;;
        "info")
            color="good"
            icon="ℹ️"
            ;;
    esac
    
    # 构建Slack消息
    local slack_payload=$(cat << EOF
{
    "text": "$icon Zinses-Rechner Alert: $ALERT_TITLE",
    "attachments": [
        {
            "color": "$color",
            "fields": [
                {
                    "title": "严重程度",
                    "value": "$SEVERITY",
                    "short": true
                },
                {
                    "title": "时间",
                    "value": "$TIMESTAMP",
                    "short": true
                },
                {
                    "title": "环境",
                    "value": "Production",
                    "short": true
                },
                {
                    "title": "服务",
                    "value": "Zinses-Rechner",
                    "short": true
                },
                {
                    "title": "详细信息",
                    "value": "$ALERT_MESSAGE",
                    "short": false
                }
            ],
            "actions": [
                {
                    "type": "button",
                    "text": "查看仪表盘",
                    "url": "https://dash.cloudflare.com"
                },
                {
                    "type": "button",
                    "text": "查看日志",
                    "url": "https://github.com/your-org/zinses-rechner/actions"
                },
                {
                    "type": "button",
                    "text": "故障排查",
                    "url": "https://github.com/your-org/zinses-rechner/blob/main/docs/TROUBLESHOOTING.md"
                }
            ],
            "footer": "Zinses-Rechner Monitoring",
            "footer_icon": "https://zinses-rechner.de/favicon.ico",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    # 发送到Slack
    local response=$(curl -s -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "$slack_payload")
    
    if [ "$response" = "ok" ]; then
        log "✅ Slack通知发送成功"
    else
        log "❌ Slack通知发送失败: $response"
    fi
}

# 发送邮件通知
send_email_alert() {
    if [ -z "$EMAIL_SMTP_SERVER" ]; then
        log "邮件SMTP服务器未配置，跳过邮件通知"
        return 0
    fi
    
    log "发送邮件告警..."
    
    # 构建邮件内容
    local email_subject="[Zinses-Rechner] $SEVERITY: $ALERT_TITLE"
    local email_body=$(cat << EOF
Zinses-Rechner 系统告警

告警标题: $ALERT_TITLE
严重程度: $SEVERITY
发生时间: $TIMESTAMP
环境: Production

详细信息:
$ALERT_MESSAGE

系统状态:
- 前端: https://zinses-rechner.de
- API: https://api.zinses-rechner.de/health
- 监控: https://dash.cloudflare.com

建议行动:
$(case $SEVERITY in
    "critical")
        echo "1. 立即检查系统状态"
        echo "2. 执行紧急响应流程"
        echo "3. 考虑服务降级或回滚"
        echo "4. 通知所有相关人员"
        ;;
    "warning")
        echo "1. 监控问题发展"
        echo "2. 计划修复措施"
        echo "3. 更新相关文档"
        ;;
    *)
        echo "1. 记录问题详情"
        echo "2. 继续监控"
        ;;
esac)

故障排查指南: https://github.com/your-org/zinses-rechner/blob/main/docs/TROUBLESHOOTING.md

---
此邮件由 Zinses-Rechner 监控系统自动发送
如有问题请联系: ops@zinses-rechner.de
EOF
)
    
    # 使用sendmail或配置的SMTP发送邮件
    if command -v sendmail &> /dev/null; then
        echo -e "To: $EMAIL_TO\nSubject: $email_subject\n\n$email_body" | sendmail "$EMAIL_TO"
        log "✅ 邮件通知发送成功"
    else
        log "❌ sendmail未安装，无法发送邮件"
    fi
}

# 发送PagerDuty告警
send_pagerduty_alert() {
    if [ -z "$PAGERDUTY_INTEGRATION_KEY" ] || [ "$SEVERITY" != "critical" ]; then
        log "PagerDuty未配置或非Critical级别，跳过PagerDuty通知"
        return 0
    fi
    
    log "发送PagerDuty告警..."
    
    # 构建PagerDuty事件
    local pagerduty_payload=$(cat << EOF
{
    "routing_key": "$PAGERDUTY_INTEGRATION_KEY",
    "event_action": "trigger",
    "dedup_key": "zinses-rechner-$(echo "$ALERT_TITLE" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')",
    "payload": {
        "summary": "$ALERT_TITLE",
        "source": "zinses-rechner-monitoring",
        "severity": "$SEVERITY",
        "timestamp": "$TIMESTAMP",
        "component": "zinses-rechner",
        "group": "production",
        "class": "system-alert",
        "custom_details": {
            "message": "$ALERT_MESSAGE",
            "environment": "production",
            "service": "zinses-rechner",
            "dashboard_url": "https://dash.cloudflare.com",
            "runbook_url": "https://github.com/your-org/zinses-rechner/blob/main/docs/TROUBLESHOOTING.md"
        }
    }
}
EOF
)
    
    # 发送到PagerDuty
    local response=$(curl -s -X POST "https://events.pagerduty.com/v2/enqueue" \
        -H "Content-Type: application/json" \
        -d "$pagerduty_payload")
    
    local status=$(echo "$response" | jq -r '.status // "error"')
    
    if [ "$status" = "success" ]; then
        log "✅ PagerDuty告警发送成功"
    else
        log "❌ PagerDuty告警发送失败: $response"
    fi
}

# 记录告警历史
log_alert_history() {
    local alert_entry="$TIMESTAMP [$SEVERITY] $ALERT_TITLE: $ALERT_MESSAGE"
    echo "$alert_entry" >> "$LOG_FILE"
    
    # 保持日志文件大小合理 (最多1000行)
    if [ $(wc -l < "$LOG_FILE") -gt 1000 ]; then
        tail -n 500 "$LOG_FILE" > "$LOG_FILE.tmp"
        mv "$LOG_FILE.tmp" "$LOG_FILE"
    fi
}

# 检查告警频率限制
check_rate_limit() {
    local alert_key="$(echo "$ALERT_TITLE" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')"
    local rate_limit_file="logs/alert-rate-limit.log"
    local current_hour=$(date +%Y%m%d%H)
    
    # 检查当前小时内相同告警的数量
    local count=$(grep "$current_hour.*$alert_key" "$rate_limit_file" 2>/dev/null | wc -l)
    
    if [ "$count" -ge 5 ]; then
        log "⚠️ 告警频率限制: $alert_key 在当前小时内已发送 $count 次"
        return 1
    fi
    
    # 记录此次告警
    echo "$current_hour $alert_key" >> "$rate_limit_file"
    return 0
}

# 发送测试告警
send_test_alert() {
    log "发送测试告警..."
    
    ALERT_TITLE="测试告警"
    ALERT_MESSAGE="这是一个测试告警，用于验证通知系统是否正常工作。时间: $TIMESTAMP"
    SEVERITY="info"
    
    send_notifications
    
    log "✅ 测试告警发送完成"
}

# 发送所有配置的通知
send_notifications() {
    # 检查频率限制
    if ! check_rate_limit; then
        log "由于频率限制，跳过告警发送"
        return 0
    fi
    
    # 记录告警
    log_alert_history
    
    # 根据配置的渠道发送通知
    IFS=',' read -ra CHANNEL_ARRAY <<< "$CHANNELS"
    for channel in "${CHANNEL_ARRAY[@]}"; do
        case $channel in
            "slack")
                send_slack_alert
                ;;
            "email")
                send_email_alert
                ;;
            "pagerduty")
                send_pagerduty_alert
                ;;
            *)
                log "未知通知渠道: $channel"
                ;;
        esac
    done
}

# 显示使用帮助
show_help() {
    cat << EOF
Zinses-Rechner 告警通知脚本

用法:
    $0 "告警标题" "告警消息" [严重程度] [通知渠道]

参数:
    告警标题      简短的问题描述
    告警消息      详细的问题信息
    严重程度      critical|warning|info [默认: warning]
    通知渠道      slack,email,pagerduty [默认: slack,email]

严重程度说明:
    critical      严重问题，需要立即响应
    warning       警告问题，需要关注
    info          信息通知，无需立即行动

通知渠道说明:
    slack         发送到Slack频道
    email         发送邮件通知
    pagerduty     发送到PagerDuty (仅Critical级别)

示例:
    $0 "API服务异常" "健康检查失败" "critical" "slack,email,pagerduty"
    $0 "响应时间过慢" "API响应时间超过1秒" "warning" "slack"
    $0 "部署完成" "版本v1.2.3已成功部署" "info" "slack"

特殊命令:
    $0 --test                发送测试告警
    $0 --help               显示此帮助信息

配置要求:
    环境变量或.env.production文件中需要配置:
    - SLACK_WEBHOOK_URL      Slack Webhook地址
    - EMAIL_SMTP_SERVER      邮件SMTP服务器
    - EMAIL_FROM             发件人邮箱
    - EMAIL_TO               收件人邮箱
    - PAGERDUTY_INTEGRATION_KEY  PagerDuty集成密钥

频率限制:
    相同告警在1小时内最多发送5次，防止告警风暴

日志记录:
    所有告警都会记录到 logs/alerts.log

EOF
}

# 主执行流程
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    log "📢 开始发送告警通知..."
    log "标题: $ALERT_TITLE"
    log "消息: $ALERT_MESSAGE"
    log "严重程度: $SEVERITY"
    log "通知渠道: $CHANNELS"
    
    # 加载配置
    load_config
    
    # 发送通知
    send_notifications
    
    log "📢 告警通知处理完成"
}

# 参数处理
case "${1:-}" in
    --test)
        load_config
        send_test_alert
        exit 0
        ;;
    -h|--help)
        show_help
        exit 0
        ;;
    "")
        show_help
        exit 1
        ;;
    *)
        main "$@"
        ;;
esac
