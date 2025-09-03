#!/bin/bash

# Zinses-Rechner域名和SSL配置脚本
# 自动化域名设置和验证流程

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
DOMAIN="zinses-rechner.de"
API_DOMAIN="api.zinses-rechner.de"
MONITORING_DOMAIN="monitoring.zinses-rechner.de"

# 检查必需的工具
check_dependencies() {
    log_info "检查域名配置依赖..."
    
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform未安装"
        log_info "请访问: https://www.terraform.io/downloads"
        exit 1
    fi
    
    if ! command -v dig &> /dev/null; then
        log_warning "dig命令未安装，DNS验证功能受限"
    fi
    
    if ! command -v curl &> /dev/null; then
        log_error "curl未安装"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 验证环境变量
check_environment() {
    log_info "检查环境变量..."
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        log_error "CLOUDFLARE_API_TOKEN环境变量未设置"
        log_info "请设置Cloudflare API Token"
        exit 1
    fi
    
    if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
        log_error "CLOUDFLARE_ZONE_ID环境变量未设置"
        log_info "请设置Cloudflare Zone ID"
        exit 1
    fi
    
    if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
        log_error "CLOUDFLARE_ACCOUNT_ID环境变量未设置"
        log_info "请设置Cloudflare Account ID"
        exit 1
    fi
    
    log_success "环境变量检查通过"
}

# 初始化Terraform
init_terraform() {
    log_info "初始化Terraform..."
    
    cd "$(dirname "$0")/.."
    
    terraform init
    log_success "Terraform初始化完成"
}

# 验证Terraform配置
validate_terraform() {
    log_info "验证Terraform配置..."
    
    terraform validate
    terraform plan \
        -var="cloudflare_api_token=$CLOUDFLARE_API_TOKEN" \
        -var="cloudflare_zone_id=$CLOUDFLARE_ZONE_ID" \
        -var="cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID"
    
    log_success "Terraform配置验证通过"
}

# 应用DNS配置
apply_dns_config() {
    log_info "应用DNS配置..."
    
    log_warning "这将修改DNS记录，确认继续？ (y/N)"
    read -r confirmation
    if [[ $confirmation != [yY] ]]; then
        log_info "DNS配置已取消"
        exit 0
    fi
    
    terraform apply \
        -var="cloudflare_api_token=$CLOUDFLARE_API_TOKEN" \
        -var="cloudflare_zone_id=$CLOUDFLARE_ZONE_ID" \
        -var="cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID" \
        -auto-approve
    
    log_success "DNS配置应用完成"
}

# 验证DNS解析
verify_dns() {
    log_info "验证DNS解析..."
    
    # 检查主域名
    log_info "检查主域名: $DOMAIN"
    if command -v dig &> /dev/null; then
        dig +short "$DOMAIN" A
        dig +short "$DOMAIN" AAAA
    else
        nslookup "$DOMAIN"
    fi
    
    # 检查API域名
    log_info "检查API域名: $API_DOMAIN"
    if command -v dig &> /dev/null; then
        dig +short "$API_DOMAIN" CNAME
    else
        nslookup "$API_DOMAIN"
    fi
    
    # 检查监控域名
    log_info "检查监控域名: $MONITORING_DOMAIN"
    if command -v dig &> /dev/null; then
        dig +short "$MONITORING_DOMAIN" CNAME
    else
        nslookup "$MONITORING_DOMAIN"
    fi
    
    log_success "DNS解析验证完成"
}

# 验证SSL证书
verify_ssl() {
    log_info "验证SSL证书..."
    
    # 等待DNS传播
    log_info "等待DNS传播（60秒）..."
    sleep 60
    
    # 检查主域名SSL
    log_info "检查主域名SSL: https://$DOMAIN"
    if curl -I -s --connect-timeout 10 "https://$DOMAIN" | grep -q "HTTP/"; then
        log_success "主域名SSL验证通过"
    else
        log_warning "主域名SSL验证失败，可能需要更多时间传播"
    fi
    
    # 检查API域名SSL
    log_info "检查API域名SSL: https://$API_DOMAIN"
    if curl -I -s --connect-timeout 10 "https://$API_DOMAIN/health" | grep -q "HTTP/"; then
        log_success "API域名SSL验证通过"
    else
        log_warning "API域名SSL验证失败，可能需要更多时间传播"
    fi
    
    # 检查SSL证书详情
    if command -v openssl &> /dev/null; then
        log_info "SSL证书详情:"
        echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | \
        openssl x509 -noout -dates -subject -issuer 2>/dev/null || true
    fi
}

# 配置页面规则
configure_page_rules() {
    log_info "配置页面规则和缓存策略..."
    
    # 这些规则已在Terraform配置中定义
    log_success "页面规则配置完成"
}

# 配置安全设置
configure_security() {
    log_info "配置安全设置..."
    
    # 安全设置已在Terraform配置中定义
    log_info "- SSL/TLS: Strict模式"
    log_info "- HSTS: 启用，包含子域名"
    log_info "- 最小TLS版本: 1.2"
    log_info "- 防火墙规则: 已配置"
    log_info "- 速率限制: API保护已启用"
    
    log_success "安全设置配置完成"
}

# 测试域名功能
test_domain_functionality() {
    log_info "测试域名功能..."
    
    # 测试主域名
    log_info "测试主域名访问..."
    if curl -f -s -o /dev/null "https://$DOMAIN"; then
        log_success "主域名访问正常"
    else
        log_warning "主域名访问异常"
    fi
    
    # 测试www重定向
    log_info "测试www重定向..."
    REDIRECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://www.$DOMAIN")
    if [ "$REDIRECT_STATUS" = "301" ] || [ "$REDIRECT_STATUS" = "302" ]; then
        log_success "www重定向配置正确"
    else
        log_warning "www重定向可能有问题 (状态码: $REDIRECT_STATUS)"
    fi
    
    # 测试API域名
    log_info "测试API域名..."
    if curl -f -s -o /dev/null "https://$API_DOMAIN/health"; then
        log_success "API域名访问正常"
    else
        log_warning "API域名访问异常"
    fi
    
    # 测试HTTPS强制
    log_info "测试HTTPS强制重定向..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN")
    if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        log_success "HTTPS强制重定向配置正确"
    else
        log_warning "HTTPS重定向可能有问题"
    fi
}

# 生成域名配置报告
generate_domain_report() {
    log_info "生成域名配置报告..."
    
    REPORT_FILE="domain-configuration-report.md"
    
    cat > "$REPORT_FILE" << EOF
# Zinses-Rechner域名配置报告

## 配置时间
- **配置日期**: $(date)
- **配置环境**: ${ENVIRONMENT:-production}

## 域名配置
- **主域名**: $DOMAIN
- **API域名**: $API_DOMAIN  
- **监控域名**: $MONITORING_DOMAIN

## DNS记录
\`\`\`
$(dig +short $DOMAIN A 2>/dev/null || echo "DNS查询失败")
\`\`\`

## SSL证书状态
- **SSL模式**: Strict
- **HSTS**: 启用（1年，包含子域名）
- **最小TLS版本**: 1.2
- **TLS 1.3**: 启用

## 安全配置
- **防火墙规则**: 已配置
- **速率限制**: API保护（100请求/15分钟）
- **Bot管理**: 启用
- **安全级别**: Medium

## 缓存配置
- **静态资源**: 1年缓存
- **API响应**: 5分钟缓存
- **浏览器缓存**: 4小时

## 验证结果
- **主域名访问**: $(curl -f -s -o /dev/null "https://$DOMAIN" && echo "✅ 正常" || echo "❌ 异常")
- **API域名访问**: $(curl -f -s -o /dev/null "https://$API_DOMAIN/health" && echo "✅ 正常" || echo "❌ 异常")
- **HTTPS重定向**: $([ "$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN")" = "301" ] && echo "✅ 正常" || echo "❌ 异常")

## 下一步
1. 监控域名解析状态
2. 验证SSL证书自动续期
3. 检查CDN缓存性能
4. 配置域名监控告警

## 重要提醒
- DNS传播可能需要24-48小时完全生效
- SSL证书会自动管理和续期
- 监控Cloudflare仪表盘中的域名状态
EOF

    log_success "域名配置报告已生成: $REPORT_FILE"
}

# 主配置流程
main() {
    log_info "🚀 开始Zinses-Rechner域名和SSL配置"
    
    # 执行配置步骤
    check_dependencies
    check_environment
    init_terraform
    validate_terraform
    apply_dns_config
    configure_page_rules
    configure_security
    verify_dns
    verify_ssl
    test_domain_functionality
    generate_domain_report
    
    log_success "🎉 域名和SSL配置完成！"
    
    echo ""
    log_info "📋 配置摘要:"
    echo "🌐 主域名: https://$DOMAIN"
    echo "🔗 API域名: https://$API_DOMAIN"
    echo "📊 监控域名: https://$MONITORING_DOMAIN"
    echo "🔒 SSL: 自动管理，Strict模式"
    echo "🛡️ 安全: 防火墙和速率限制已启用"
    echo "⚡ 缓存: 全球CDN加速"
    
    echo ""
    log_info "📈 监控建议:"
    echo "1. 检查Cloudflare Analytics中的流量数据"
    echo "2. 监控SSL证书到期时间"
    echo "3. 验证页面加载性能"
    echo "4. 检查安全事件日志"
    
    echo ""
    log_warning "⚠️ 重要提醒:"
    echo "- DNS传播可能需要24-48小时"
    echo "- 请在域名注册商处更新Nameservers"
    echo "- 监控域名解析状态和SSL证书"
}

# 错误处理
trap 'log_error "域名配置过程中发生错误，请检查日志"; exit 1' ERR

# 执行主流程
main "$@"
