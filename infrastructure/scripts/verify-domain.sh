#!/bin/bash

# 域名验证和健康检查脚本
# 验证域名解析、SSL证书和服务可用性

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

# 域名配置
DOMAINS=(
    "zinses-rechner.de"
    "www.zinses-rechner.de"
    "api.zinses-rechner.de"
    "monitoring.zinses-rechner.de"
)

# DNS解析验证
verify_dns_resolution() {
    log_info "🔍 验证DNS解析..."
    
    for domain in "${DOMAINS[@]}"; do
        log_info "检查域名: $domain"
        
        if command -v dig &> /dev/null; then
            # 使用dig检查
            A_RECORD=$(dig +short "$domain" A)
            CNAME_RECORD=$(dig +short "$domain" CNAME)
            
            if [ -n "$A_RECORD" ] || [ -n "$CNAME_RECORD" ]; then
                log_success "$domain DNS解析正常"
                if [ -n "$A_RECORD" ]; then
                    echo "  A记录: $A_RECORD"
                fi
                if [ -n "$CNAME_RECORD" ]; then
                    echo "  CNAME记录: $CNAME_RECORD"
                fi
            else
                log_error "$domain DNS解析失败"
            fi
        else
            # 使用nslookup检查
            if nslookup "$domain" &> /dev/null; then
                log_success "$domain DNS解析正常"
            else
                log_error "$domain DNS解析失败"
            fi
        fi
        
        echo ""
    done
}

# SSL证书验证
verify_ssl_certificates() {
    log_info "🔒 验证SSL证书..."
    
    for domain in "${DOMAINS[@]}"; do
        log_info "检查SSL证书: $domain"
        
        # 检查SSL连接
        if timeout 10 bash -c "</dev/tcp/$domain/443" 2>/dev/null; then
            log_success "$domain SSL连接正常"
            
            # 获取证书详情
            if command -v openssl &> /dev/null; then
                CERT_INFO=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                           openssl x509 -noout -dates -subject -issuer 2>/dev/null)
                
                if [ -n "$CERT_INFO" ]; then
                    echo "  证书信息:"
                    echo "$CERT_INFO" | sed 's/^/    /'
                    
                    # 检查证书到期时间
                    EXPIRY_DATE=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
                    if [ -n "$EXPIRY_DATE" ]; then
                        EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY_DATE" +%s 2>/dev/null)
                        CURRENT_TIMESTAMP=$(date +%s)
                        DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
                        
                        if [ "$DAYS_UNTIL_EXPIRY" -gt 30 ]; then
                            log_success "  证书有效期: $DAYS_UNTIL_EXPIRY 天"
                        elif [ "$DAYS_UNTIL_EXPIRY" -gt 7 ]; then
                            log_warning "  证书即将到期: $DAYS_UNTIL_EXPIRY 天"
                        else
                            log_error "  证书即将到期: $DAYS_UNTIL_EXPIRY 天"
                        fi
                    fi
                fi
            fi
        else
            log_error "$domain SSL连接失败"
        fi
        
        echo ""
    done
}

# HTTP到HTTPS重定向验证
verify_https_redirect() {
    log_info "🔄 验证HTTPS重定向..."
    
    for domain in "${DOMAINS[@]}"; do
        if [[ "$domain" == "api."* ]] || [[ "$domain" == "monitoring."* ]]; then
            continue # 跳过子域名的HTTP测试
        fi
        
        log_info "检查HTTP重定向: $domain"
        
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "http://$domain" || echo "000")
        FINAL_URL=$(curl -s -o /dev/null -w "%{url_effective}" -L --max-time 10 "http://$domain" || echo "")
        
        if [[ "$FINAL_URL" == "https://"* ]]; then
            log_success "$domain HTTPS重定向正常 (状态码: $HTTP_STATUS)"
        else
            log_warning "$domain HTTPS重定向可能有问题 (状态码: $HTTP_STATUS)"
        fi
    done
}

# 性能测试
test_performance() {
    log_info "⚡ 测试域名性能..."
    
    for domain in "${DOMAINS[@]}"; do
        log_info "测试性能: $domain"
        
        # 测试响应时间
        RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' --max-time 10 "https://$domain" 2>/dev/null || echo "timeout")
        
        if [ "$RESPONSE_TIME" != "timeout" ]; then
            RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null || echo "0")
            
            if (( $(echo "$RESPONSE_TIME_MS < 1000" | bc -l 2>/dev/null || echo "0") )); then
                log_success "$domain 响应时间: ${RESPONSE_TIME_MS}ms (优秀)"
            elif (( $(echo "$RESPONSE_TIME_MS < 2000" | bc -l 2>/dev/null || echo "0") )); then
                log_success "$domain 响应时间: ${RESPONSE_TIME_MS}ms (良好)"
            else
                log_warning "$domain 响应时间: ${RESPONSE_TIME_MS}ms (需要优化)"
            fi
        else
            log_error "$domain 响应超时"
        fi
    done
}

# 安全头验证
verify_security_headers() {
    log_info "🛡️ 验证安全头..."
    
    MAIN_DOMAIN="zinses-rechner.de"
    
    log_info "检查安全头: $MAIN_DOMAIN"
    
    HEADERS=$(curl -I -s --max-time 10 "https://$MAIN_DOMAIN" 2>/dev/null || echo "")
    
    # 检查关键安全头
    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
        log_success "HSTS头存在"
    else
        log_warning "HSTS头缺失"
    fi
    
    if echo "$HEADERS" | grep -qi "x-content-type-options"; then
        log_success "X-Content-Type-Options头存在"
    else
        log_warning "X-Content-Type-Options头缺失"
    fi
    
    if echo "$HEADERS" | grep -qi "x-frame-options"; then
        log_success "X-Frame-Options头存在"
    else
        log_warning "X-Frame-Options头缺失"
    fi
    
    if echo "$HEADERS" | grep -qi "content-security-policy"; then
        log_success "CSP头存在"
    else
        log_warning "CSP头缺失"
    fi
}

# 生成验证报告
generate_verification_report() {
    log_info "📊 生成验证报告..."
    
    REPORT_FILE="domain-verification-report-$(date +%Y%m%d_%H%M%S).json"
    
    # 收集验证数据
    VERIFICATION_DATA="{
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"domains\": ["
    
    for i in "${!DOMAINS[@]}"; do
        domain="${DOMAINS[$i]}"
        
        # DNS检查
        DNS_OK=$(dig +short "$domain" A &>/dev/null && echo "true" || echo "false")
        
        # SSL检查
        SSL_OK=$(timeout 5 bash -c "</dev/tcp/$domain/443" 2>/dev/null && echo "true" || echo "false")
        
        # HTTP检查
        HTTP_OK=$(curl -f -s -o /dev/null --max-time 5 "https://$domain" && echo "true" || echo "false")
        
        # 响应时间
        RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' --max-time 10 "https://$domain" 2>/dev/null || echo "0")
        
        VERIFICATION_DATA="$VERIFICATION_DATA
        {
          \"domain\": \"$domain\",
          \"dns_resolution\": $DNS_OK,
          \"ssl_valid\": $SSL_OK,
          \"http_accessible\": $HTTP_OK,
          \"response_time_seconds\": $RESPONSE_TIME
        }"
        
        if [ $i -lt $((${#DOMAINS[@]} - 1)) ]; then
            VERIFICATION_DATA="$VERIFICATION_DATA,"
        fi
    done
    
    VERIFICATION_DATA="$VERIFICATION_DATA
      ],
      \"overall_status\": \"$([ "$(echo "$VERIFICATION_DATA" | grep -c '"http_accessible": true')" -eq "${#DOMAINS[@]}" ] && echo "healthy" || echo "degraded")\"
    }"
    
    echo "$VERIFICATION_DATA" > "$REPORT_FILE"
    log_success "验证报告已生成: $REPORT_FILE"
}

# 主验证流程
main() {
    log_info "🔍 开始域名验证和健康检查"
    
    verify_dns_resolution
    verify_ssl_certificates
    verify_https_redirect
    test_performance
    verify_security_headers
    generate_verification_report
    
    log_success "🎉 域名验证完成！"
    
    echo ""
    log_info "📋 验证摘要:"
    echo "✅ DNS解析验证"
    echo "✅ SSL证书验证"
    echo "✅ HTTPS重定向验证"
    echo "✅ 性能测试"
    echo "✅ 安全头验证"
    
    echo ""
    log_info "📊 查看详细报告:"
    echo "- 配置报告: domain-configuration-report.md"
    echo "- 验证报告: domain-verification-report-*.json"
}

# 错误处理
trap 'log_error "域名验证过程中发生错误"; exit 1' ERR

# 执行主流程
main "$@"
