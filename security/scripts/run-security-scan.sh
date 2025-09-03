#!/bin/bash

# 综合安全扫描执行脚本
# 运行OWASP ZAP、npm audit、Snyk等安全扫描工具

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

# 配置变量
TARGET_URL="${TARGET_URL:-https://zinses-rechner.de}"
API_URL="${API_URL:-https://api.zinses-rechner.de}"
REPORTS_DIR="security/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 安全扫描类型
SCAN_TYPE="${1:-full}"  # baseline, full, api-only, frontend-only

# 创建报告目录
setup_reports_directory() {
    log_info "设置安全报告目录..."
    
    mkdir -p "$REPORTS_DIR/zap"
    mkdir -p "$REPORTS_DIR/npm-audit"
    mkdir -p "$REPORTS_DIR/snyk"
    mkdir -p "$REPORTS_DIR/summary"
    
    log_success "报告目录创建完成"
}

# 检查依赖工具
check_security_tools() {
    log_info "检查安全扫描工具..."
    
    local missing_tools=()
    
    # 检查Docker（用于OWASP ZAP）
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    # 检查npm（用于npm audit）
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    # 检查Snyk
    if ! command -v snyk &> /dev/null; then
        log_warning "Snyk未安装，将跳过Snyk扫描"
        log_info "安装命令: npm install -g snyk"
    fi
    
    # 检查jq（用于JSON处理）
    if ! command -v jq &> /dev/null; then
        log_warning "jq未安装，JSON解析功能受限"
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "缺少必需工具: ${missing_tools[*]}"
        exit 1
    fi
    
    log_success "安全工具检查通过"
}

# 运行OWASP ZAP扫描
run_zap_scan() {
    log_info "🕷️ 运行OWASP ZAP安全扫描..."
    
    local scan_type="$1"
    local target_url="$2"
    local report_prefix="$3"
    
    local zap_report_html="$REPORTS_DIR/zap/${report_prefix}-zap-report-$TIMESTAMP.html"
    local zap_report_json="$REPORTS_DIR/zap/${report_prefix}-zap-report-$TIMESTAMP.json"
    local zap_report_xml="$REPORTS_DIR/zap/${report_prefix}-zap-report-$TIMESTAMP.xml"
    
    case "$scan_type" in
        "baseline")
            log_info "执行基线扫描: $target_url"
            docker run -t --rm \
                -v "$(pwd)/$REPORTS_DIR/zap:/zap/wrk/:rw" \
                owasp/zap2docker-stable \
                zap-baseline.py \
                -t "$target_url" \
                -g gen.conf \
                -r "${report_prefix}-baseline-$TIMESTAMP.html" \
                -J "${report_prefix}-baseline-$TIMESTAMP.json" \
                -x "${report_prefix}-baseline-$TIMESTAMP.xml"
            ;;
            
        "full")
            log_info "执行全面扫描: $target_url"
            docker run -t --rm \
                -v "$(pwd)/$REPORTS_DIR/zap:/zap/wrk/:rw" \
                owasp/zap2docker-stable \
                zap-full-scan.py \
                -t "$target_url" \
                -g gen.conf \
                -r "${report_prefix}-full-$TIMESTAMP.html" \
                -J "${report_prefix}-full-$TIMESTAMP.json" \
                -x "${report_prefix}-full-$TIMESTAMP.xml"
            ;;
            
        "api")
            log_info "执行API扫描: $target_url"
            
            # 创建API扫描配置
            cat > "/tmp/zap-api-scan.yaml" << EOF
openapi: "3.0.0"
info:
  title: "Zinses-Rechner API"
  version: "1.0.0"
servers:
  - url: "$target_url"
paths:
  /health:
    get:
      summary: "Health check"
  /api/v1/calculate/compound-interest:
    post:
      summary: "Calculate compound interest"
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                principal:
                  type: number
                annual_rate:
                  type: number
                years:
                  type: integer
                monthly_payment:
                  type: number
EOF
            
            docker run -t --rm \
                -v "$(pwd)/$REPORTS_DIR/zap:/zap/wrk/:rw" \
                -v "/tmp/zap-api-scan.yaml:/zap/wrk/api-scan.yaml:ro" \
                owasp/zap2docker-stable \
                zap-api-scan.py \
                -t "/zap/wrk/api-scan.yaml" \
                -f openapi \
                -r "${report_prefix}-api-$TIMESTAMP.html" \
                -J "${report_prefix}-api-$TIMESTAMP.json" \
                -x "${report_prefix}-api-$TIMESTAMP.xml"
            ;;
    esac
    
    log_success "OWASP ZAP扫描完成"
}

# 运行npm audit扫描
run_npm_audit() {
    log_info "📦 运行npm audit依赖漏洞扫描..."
    
    local audit_report="$REPORTS_DIR/npm-audit/npm-audit-$TIMESTAMP.json"
    local audit_summary="$REPORTS_DIR/npm-audit/npm-audit-summary-$TIMESTAMP.txt"
    
    # 前端依赖扫描
    log_info "扫描前端依赖..."
    cd zinses-rechner-frontend
    
    # 生成详细报告
    npm audit --json > "../$audit_report" 2>/dev/null || true
    npm audit > "../$audit_summary" 2>/dev/null || true
    
    # 检查高危漏洞
    local high_vulns
    high_vulns=$(npm audit --audit-level=high --json 2>/dev/null | jq -r '.metadata.vulnerabilities.high // 0' 2>/dev/null || echo "0")
    
    if [ "$high_vulns" -gt 0 ]; then
        log_warning "发现 $high_vulns 个高危漏洞"
        echo "::warning::发现前端高危漏洞: $high_vulns 个"
    else
        log_success "前端依赖无高危漏洞"
    fi
    
    cd ..
    
    # 后端依赖扫描（如果有Python依赖检查工具）
    if command -v safety &> /dev/null; then
        log_info "扫描后端依赖..."
        cd backend
        safety check --json > "../$REPORTS_DIR/npm-audit/python-safety-$TIMESTAMP.json" 2>/dev/null || true
        cd ..
    fi
    
    log_success "npm audit扫描完成"
}

# 运行Snyk扫描
run_snyk_scan() {
    if ! command -v snyk &> /dev/null; then
        log_warning "Snyk未安装，跳过Snyk扫描"
        return
    fi
    
    log_info "🔍 运行Snyk安全扫描..."
    
    local snyk_report="$REPORTS_DIR/snyk/snyk-report-$TIMESTAMP.json"
    
    # 前端Snyk扫描
    log_info "Snyk扫描前端..."
    cd zinses-rechner-frontend
    
    # 认证Snyk（如果有token）
    if [ -n "$SNYK_TOKEN" ]; then
        snyk auth "$SNYK_TOKEN"
    fi
    
    # 运行扫描
    snyk test --json > "../$snyk_report" 2>/dev/null || true
    snyk test --severity-threshold=high || log_warning "Snyk发现高危漏洞"
    
    cd ..
    
    # 后端Snyk扫描
    if [ -f "backend/requirements.txt" ]; then
        log_info "Snyk扫描后端..."
        cd backend
        snyk test --file=requirements.txt --json > "../$REPORTS_DIR/snyk/snyk-python-$TIMESTAMP.json" 2>/dev/null || true
        cd ..
    fi
    
    log_success "Snyk扫描完成"
}

# 分析扫描结果
analyze_scan_results() {
    log_info "📊 分析安全扫描结果..."
    
    local summary_file="$REPORTS_DIR/summary/security-scan-summary-$TIMESTAMP.md"
    
    cat > "$summary_file" << EOF
# Zinses-Rechner 安全扫描报告

## 扫描执行信息
- **扫描时间**: $(date)
- **扫描类型**: $SCAN_TYPE
- **目标URL**: $TARGET_URL
- **API URL**: $API_URL

## 扫描结果摘要

### OWASP ZAP扫描
EOF

    # 分析ZAP结果
    local zap_json_files=("$REPORTS_DIR"/zap/*-$TIMESTAMP.json)
    if [ -f "${zap_json_files[0]}" ]; then
        if command -v jq &> /dev/null; then
            local high_risk medium_risk low_risk
            high_risk=$(jq '[.site[].alerts[] | select(.riskdesc | contains("High"))] | length' "${zap_json_files[0]}" 2>/dev/null || echo "0")
            medium_risk=$(jq '[.site[].alerts[] | select(.riskdesc | contains("Medium"))] | length' "${zap_json_files[0]}" 2>/dev/null || echo "0")
            low_risk=$(jq '[.site[].alerts[] | select(.riskdesc | contains("Low"))] | length' "${zap_json_files[0]}" 2>/dev/null || echo "0")
            
            cat >> "$summary_file" << EOF
- **高风险漏洞**: $high_risk
- **中风险漏洞**: $medium_risk  
- **低风险漏洞**: $low_risk
- **状态**: $([ "$high_risk" -eq 0 ] && echo "✅ 通过" || echo "❌ 需要修复")

EOF
        fi
    else
        echo "- **状态**: ⚠️ ZAP扫描报告未找到" >> "$summary_file"
    fi

    # 分析npm audit结果
    cat >> "$summary_file" << EOF
### npm audit扫描
EOF

    local npm_audit_file="$REPORTS_DIR/npm-audit/npm-audit-$TIMESTAMP.json"
    if [ -f "$npm_audit_file" ]; then
        if command -v jq &> /dev/null; then
            local npm_high npm_moderate npm_low
            npm_high=$(jq -r '.metadata.vulnerabilities.high // 0' "$npm_audit_file" 2>/dev/null || echo "0")
            npm_moderate=$(jq -r '.metadata.vulnerabilities.moderate // 0' "$npm_audit_file" 2>/dev/null || echo "0")
            npm_low=$(jq -r '.metadata.vulnerabilities.low // 0' "$npm_audit_file" 2>/dev/null || echo "0")
            
            cat >> "$summary_file" << EOF
- **高危漏洞**: $npm_high
- **中危漏洞**: $npm_moderate
- **低危漏洞**: $npm_low
- **状态**: $([ "$npm_high" -eq 0 ] && echo "✅ 通过" || echo "❌ 需要修复")

EOF
        fi
    else
        echo "- **状态**: ⚠️ npm audit报告未找到" >> "$summary_file"
    fi

    # 分析Snyk结果
    cat >> "$summary_file" << EOF
### Snyk扫描
EOF

    local snyk_file="$REPORTS_DIR/snyk/snyk-report-$TIMESTAMP.json"
    if [ -f "$snyk_file" ]; then
        if command -v jq &> /dev/null; then
            local snyk_high snyk_medium snyk_low
            snyk_high=$(jq '[.vulnerabilities[] | select(.severity == "high")] | length' "$snyk_file" 2>/dev/null || echo "0")
            snyk_medium=$(jq '[.vulnerabilities[] | select(.severity == "medium")] | length' "$snyk_file" 2>/dev/null || echo "0")
            snyk_low=$(jq '[.vulnerabilities[] | select(.severity == "low")] | length' "$snyk_file" 2>/dev/null || echo "0")
            
            cat >> "$summary_file" << EOF
- **高危漏洞**: $snyk_high
- **中危漏洞**: $snyk_medium
- **低危漏洞**: $snyk_low
- **状态**: $([ "$snyk_high" -eq 0 ] && echo "✅ 通过" || echo "❌ 需要修复")

EOF
        fi
    else
        echo "- **状态**: ⚠️ Snyk扫描未执行或失败" >> "$summary_file"
    fi

    # 生成修复建议
    cat >> "$summary_file" << EOF
## 修复建议

### 立即修复（高优先级）
$([ -f "$npm_audit_file" ] && jq -r '.vulnerabilities | to_entries[] | select(.value.severity == "high") | "- " + .value.title + " (" + .key + ")"' "$npm_audit_file" 2>/dev/null || echo "- 无高危漏洞")

### 计划修复（中优先级）
$([ -f "$npm_audit_file" ] && jq -r '.vulnerabilities | to_entries[] | select(.value.severity == "moderate") | "- " + .value.title + " (" + .key + ")"' "$npm_audit_file" 2>/dev/null | head -5 || echo "- 无中危漏洞")

## 详细报告
- **OWASP ZAP**: $REPORTS_DIR/zap/
- **npm audit**: $REPORTS_DIR/npm-audit/
- **Snyk**: $REPORTS_DIR/snyk/

## 下一步行动
1. 修复所有高危漏洞
2. 更新依赖包到安全版本
3. 加强输入验证和输出编码
4. 定期运行安全扫描

---
*报告生成时间: $(date -u +%Y-%m-%dT%H:%M:%SZ)*
EOF

    log_success "安全扫描结果分析完成: $summary_file"
}

# 发送安全告警
send_security_alerts() {
    local summary_file="$1"
    
    # 检查是否有高危漏洞
    local has_high_risk=false
    
    # 检查各种扫描结果中的高危漏洞
    if grep -q "高危漏洞.*[1-9]" "$summary_file" 2>/dev/null; then
        has_high_risk=true
    fi
    
    if [ "$has_high_risk" = true ]; then
        log_warning "🚨 发现高危安全漏洞，发送告警..."
        
        # 发送Slack通知
        if [ -n "$SLACK_SECURITY_WEBHOOK" ]; then
            local alert_payload=$(cat << EOF
{
  "text": "🚨 Zinses-Rechner 安全扫描发现高危漏洞",
  "attachments": [
    {
      "color": "danger",
      "fields": [
        {
          "title": "扫描时间",
          "value": "$(date)",
          "short": true
        },
        {
          "title": "扫描类型",
          "value": "$SCAN_TYPE",
          "short": true
        },
        {
          "title": "目标",
          "value": "$TARGET_URL",
          "short": true
        }
      ],
      "footer": "安全扫描系统",
      "ts": $(date +%s)
    }
  ]
}
EOF
            )
            
            curl -X POST -H 'Content-type: application/json' \
                --data "$alert_payload" \
                "$SLACK_SECURITY_WEBHOOK" &>/dev/null || true
        fi
        
        # 记录到系统日志
        logger "SECURITY ALERT: High-risk vulnerabilities found in Zinses-Rechner"
        
    else
        log_success "✅ 未发现高危安全漏洞"
    fi
}

# 主扫描流程
main() {
    log_info "🛡️ 开始Zinses-Rechner安全扫描"
    
    # 显示扫描配置
    echo ""
    log_info "📋 扫描配置:"
    echo "  扫描类型: $SCAN_TYPE"
    echo "  目标URL: $TARGET_URL"
    echo "  API URL: $API_URL"
    echo "  报告目录: $REPORTS_DIR"
    echo ""
    
    # 执行扫描步骤
    setup_reports_directory
    check_security_tools
    
    case "$SCAN_TYPE" in
        "baseline")
            run_zap_scan "baseline" "$TARGET_URL" "frontend"
            run_zap_scan "baseline" "$API_URL" "api"
            run_npm_audit
            ;;
            
        "full")
            run_zap_scan "full" "$TARGET_URL" "frontend"
            run_zap_scan "api" "$API_URL" "api"
            run_npm_audit
            run_snyk_scan
            ;;
            
        "api-only")
            run_zap_scan "api" "$API_URL" "api"
            ;;
            
        "frontend-only")
            run_zap_scan "baseline" "$TARGET_URL" "frontend"
            run_npm_audit
            ;;
            
        *)
            log_error "未知的扫描类型: $SCAN_TYPE"
            log_info "支持的类型: baseline, full, api-only, frontend-only"
            exit 1
            ;;
    esac
    
    # 分析结果和生成报告
    analyze_scan_results
    
    # 发送告警（如果需要）
    send_security_alerts "$REPORTS_DIR/summary/security-scan-summary-$TIMESTAMP.md"
    
    log_success "🎉 安全扫描完成！"
    
    echo ""
    log_info "📊 扫描摘要:"
    echo "🕷️ OWASP ZAP: Web应用安全扫描"
    echo "📦 npm audit: 依赖漏洞检查"
    echo "🔍 Snyk: 代码安全分析"
    echo "📋 综合报告: $REPORTS_DIR/summary/"
    
    echo ""
    log_info "📁 查看详细报告:"
    echo "- 综合摘要: $REPORTS_DIR/summary/security-scan-summary-$TIMESTAMP.md"
    echo "- ZAP报告: $REPORTS_DIR/zap/"
    echo "- 依赖审计: $REPORTS_DIR/npm-audit/"
    echo "- Snyk报告: $REPORTS_DIR/snyk/"
}

# 错误处理
trap 'log_error "安全扫描过程中发生错误，请检查日志"; exit 1' ERR

# 执行主流程
main "$@"
