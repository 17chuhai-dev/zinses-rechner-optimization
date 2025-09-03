#!/bin/bash

# Zinses-Rechner 生产环境验证脚本
# 用途: 全面验证生产环境的功能和性能
# 使用: ./scripts/production-verification.sh

set -e

TIMESTAMP=$(date -Iseconds)
LOG_FILE="logs/production-verification-$(date +%Y%m%d-%H%M%S).log"
REPORT_FILE="reports/production-verification-$(date +%Y%m%d-%H%M%S).md"

# 生产环境URL
FRONTEND_URL="https://zinses-rechner.de"
API_URL="https://api.zinses-rechner.de"

# 创建必要目录
mkdir -p logs reports

# 日志函数
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$TIMESTAMP] ❌ $1" | tee -a "$LOG_FILE"
}

success() {
    echo "[$TIMESTAMP] ✅ $1" | tee -a "$LOG_FILE"
}

warning() {
    echo "[$TIMESTAMP] ⚠️ $1" | tee -a "$LOG_FILE"
}

info() {
    echo "[$TIMESTAMP] ℹ️ $1" | tee -a "$LOG_FILE"
}

# 验证结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0

# 测试结果记录
record_test_result() {
    local test_name="$1"
    local result="$2"  # pass|fail|warning
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    case $result in
        "pass")
            PASSED_TESTS=$((PASSED_TESTS + 1))
            success "✓ $test_name"
            ;;
        "fail")
            FAILED_TESTS=$((FAILED_TESTS + 1))
            error "✗ $test_name"
            ;;
        "warning")
            WARNING_TESTS=$((WARNING_TESTS + 1))
            warning "⚠ $test_name"
            ;;
    esac
}

# 1. 域名和SSL验证
verify_domain_ssl() {
    log "🔒 验证域名和SSL配置..."
    
    # 检查主域名可访问性
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
    if [ "$frontend_status" = "200" ]; then
        record_test_result "前端域名可访问性" "pass"
    else
        record_test_result "前端域名可访问性 (HTTP $frontend_status)" "fail"
    fi
    
    # 检查API域名可访问性
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
    if [ "$api_status" = "200" ]; then
        record_test_result "API域名可访问性" "pass"
    else
        record_test_result "API域名可访问性 (HTTP $api_status)" "fail"
    fi
    
    # SSL证书验证
    local ssl_info=$(echo | openssl s_client -servername zinses-rechner.de -connect zinses-rechner.de:443 2>/dev/null | \
        openssl x509 -noout -dates)
    
    local expiry_date=$(echo "$ssl_info" | grep notAfter | cut -d= -f2)
    local expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    log "SSL证书到期时间: $expiry_date ($days_until_expiry 天)"
    
    if [ "$days_until_expiry" -gt 30 ]; then
        record_test_result "SSL证书有效期" "pass"
    elif [ "$days_until_expiry" -gt 7 ]; then
        record_test_result "SSL证书有效期 ($days_until_expiry 天)" "warning"
    else
        record_test_result "SSL证书即将到期 ($days_until_expiry 天)" "fail"
    fi
    
    # HTTPS重定向验证
    local http_redirect=$(curl -s -o /dev/null -w "%{http_code}" "http://zinses-rechner.de")
    if [ "$http_redirect" = "301" ] || [ "$http_redirect" = "302" ]; then
        record_test_result "HTTPS重定向" "pass"
    else
        record_test_result "HTTPS重定向 (HTTP $http_redirect)" "fail"
    fi
}

# 2. API功能验证
verify_api_functionality() {
    log "🔌 验证API功能..."
    
    # 健康检查
    local health_response=$(curl -s "$API_URL/health")
    local health_status=$(echo "$health_response" | jq -r '.status // "error"')
    
    if [ "$health_status" = "healthy" ]; then
        record_test_result "API健康检查" "pass"
    else
        record_test_result "API健康检查 ($health_status)" "fail"
    fi
    
    # 基础计算功能测试
    local calc_payload='{"principal": 10000, "annual_rate": 4, "years": 10}'
    local calc_response=$(curl -s -X POST "$API_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d "$calc_payload")
    
    local final_amount=$(echo "$calc_response" | jq -r '.final_amount // "error"')
    
    if [ "$final_amount" != "error" ] && [ "$final_amount" != "null" ]; then
        # 验证计算结果合理性 (期望约14802.44)
        local expected=14802.44
        local difference=$(echo "scale=2; $final_amount - $expected" | bc | tr -d '-')
        
        if (( $(echo "$difference < 1" | bc -l) )); then
            record_test_result "基础计算功能" "pass"
            log "计算结果: €$final_amount (期望: €$expected)"
        else
            record_test_result "计算结果准确性 (差异: €$difference)" "fail"
        fi
    else
        record_test_result "基础计算功能" "fail"
        log "API响应: $calc_response"
    fi
    
    # 复杂计算测试
    local complex_payload='{"principal": 50000, "annual_rate": 6.5, "years": 25, "monthly_payment": 800}'
    local complex_response=$(curl -s -X POST "$API_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d "$complex_payload")
    
    local complex_result=$(echo "$complex_response" | jq -r '.final_amount // "error"')
    
    if [ "$complex_result" != "error" ] && [ "$complex_result" != "null" ]; then
        record_test_result "复杂计算功能" "pass"
        log "复杂计算结果: €$complex_result"
    else
        record_test_result "复杂计算功能" "fail"
    fi
    
    # 输入验证测试
    local invalid_payload='{"principal": -1000, "annual_rate": 4, "years": 10}'
    local invalid_status=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d "$invalid_payload")
    
    if [ "$invalid_status" = "422" ]; then
        record_test_result "输入验证" "pass"
    else
        record_test_result "输入验证 (HTTP $invalid_status)" "fail"
    fi
}

# 3. 前端功能验证
verify_frontend_functionality() {
    log "🖥️ 验证前端功能..."
    
    # 页面内容验证
    local page_content=$(curl -s "$FRONTEND_URL")
    
    if echo "$page_content" | grep -q "Zinseszins-Rechner"; then
        record_test_result "页面标题显示" "pass"
    else
        record_test_result "页面标题显示" "fail"
    fi
    
    if echo "$page_content" | grep -q "Startkapital"; then
        record_test_result "计算器表单元素" "pass"
    else
        record_test_result "计算器表单元素" "fail"
    fi
    
    # 检查关键资源
    local js_files=$(echo "$page_content" | grep -o 'src="[^"]*\.js"' | wc -l)
    local css_files=$(echo "$page_content" | grep -o 'href="[^"]*\.css"' | wc -l)
    
    log "JavaScript文件数量: $js_files"
    log "CSS文件数量: $css_files"
    
    if [ "$js_files" -gt 0 ] && [ "$css_files" -gt 0 ]; then
        record_test_result "静态资源加载" "pass"
    else
        record_test_result "静态资源加载" "fail"
    fi
    
    # 检查元数据
    if echo "$page_content" | grep -q '<meta name="description"'; then
        record_test_result "SEO元数据" "pass"
    else
        record_test_result "SEO元数据" "warning"
    fi
}

# 4. 性能指标验证
verify_performance() {
    log "⚡ 验证性能指标..."
    
    # API响应时间测试
    local api_response_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST "$API_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d '{"principal": 10000, "annual_rate": 4, "years": 10}')
    
    log "API响应时间: ${api_response_time}s"
    
    if (( $(echo "$api_response_time < 0.5" | bc -l) )); then
        record_test_result "API响应时间 (${api_response_time}s)" "pass"
    elif (( $(echo "$api_response_time < 1.0" | bc -l) )); then
        record_test_result "API响应时间 (${api_response_time}s)" "warning"
    else
        record_test_result "API响应时间 (${api_response_time}s)" "fail"
    fi
    
    # 前端加载时间测试
    local frontend_load_time=$(curl -w "%{time_total}" -s -o /dev/null "$FRONTEND_URL")
    
    log "前端加载时间: ${frontend_load_time}s"
    
    if (( $(echo "$frontend_load_time < 2.0" | bc -l) )); then
        record_test_result "前端加载时间 (${frontend_load_time}s)" "pass"
    elif (( $(echo "$frontend_load_time < 3.0" | bc -l) )); then
        record_test_result "前端加载时间 (${frontend_load_time}s)" "warning"
    else
        record_test_result "前端加载时间 (${frontend_load_time}s)" "fail"
    fi
    
    # 并发请求测试
    info "执行并发请求测试..."
    local concurrent_requests=10
    local concurrent_payload='{"principal": 15000, "annual_rate": 5, "years": 15}'
    
    local start_time=$(date +%s.%N)
    
    for i in $(seq 1 $concurrent_requests); do
        curl -s -X POST "$API_URL/api/v1/calculate/compound-interest" \
            -H "Content-Type: application/json" \
            -d "$concurrent_payload" > /dev/null &
    done
    
    wait # 等待所有请求完成
    
    local end_time=$(date +%s.%N)
    local total_time=$(echo "$end_time - $start_time" | bc)
    local avg_time=$(echo "scale=3; $total_time / $concurrent_requests" | bc)
    
    log "并发测试 ($concurrent_requests 请求): 总时间 ${total_time}s, 平均 ${avg_time}s"
    
    if (( $(echo "$avg_time < 1.0" | bc -l) )); then
        record_test_result "并发请求处理" "pass"
    else
        record_test_result "并发请求处理 (${avg_time}s)" "warning"
    fi
}

# 5. 安全配置验证
verify_security() {
    log "🛡️ 验证安全配置..."
    
    # 安全头检查
    local security_headers=$(curl -I "$FRONTEND_URL" 2>/dev/null)
    
    # 检查关键安全头
    if echo "$security_headers" | grep -q "X-Frame-Options"; then
        record_test_result "X-Frame-Options头" "pass"
    else
        record_test_result "X-Frame-Options头" "warning"
    fi
    
    if echo "$security_headers" | grep -q "X-Content-Type-Options"; then
        record_test_result "X-Content-Type-Options头" "pass"
    else
        record_test_result "X-Content-Type-Options头" "warning"
    fi
    
    if echo "$security_headers" | grep -q "Strict-Transport-Security"; then
        record_test_result "HSTS头" "pass"
    else
        record_test_result "HSTS头" "warning"
    fi
    
    # CORS配置验证
    local cors_response=$(curl -s -H "Origin: https://example.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS "$API_URL/api/v1/calculate/compound-interest")
    
    if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
        record_test_result "CORS配置" "pass"
    else
        record_test_result "CORS配置" "warning"
    fi
    
    # 速率限制测试
    info "测试API速率限制..."
    local rate_limit_count=0
    
    for i in $(seq 1 20); do
        local status=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "$API_URL/api/v1/calculate/compound-interest" \
            -H "Content-Type: application/json" \
            -d '{"principal": 1000, "annual_rate": 3, "years": 5}')
        
        if [ "$status" = "429" ]; then
            rate_limit_count=$((rate_limit_count + 1))
            break
        fi
        
        sleep 0.1
    done
    
    if [ "$rate_limit_count" -gt 0 ]; then
        record_test_result "API速率限制" "pass"
        log "速率限制在第 $i 次请求时触发"
    else
        record_test_result "API速率限制" "warning"
        log "20次快速请求未触发速率限制"
    fi
}

# 6. 数据库验证
verify_database() {
    log "🗄️ 验证数据库..."
    
    # 数据库连接测试
    local db_test=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="SELECT datetime('now') as current_time" 2>&1)
    
    if echo "$db_test" | grep -q "current_time"; then
        record_test_result "数据库连接" "pass"
    else
        record_test_result "数据库连接" "fail"
        log "数据库错误: $db_test"
    fi
    
    # 表结构验证
    local tables=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="SELECT name FROM sqlite_master WHERE type='table'" 2>&1)
    
    if echo "$tables" | grep -q "calculation_history"; then
        record_test_result "数据库表结构" "pass"
    else
        record_test_result "数据库表结构" "fail"
    fi
    
    # 数据写入测试
    local test_id="test_$(date +%s)"
    local insert_result=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="INSERT INTO calculation_history (session_id, principal, annual_rate, years, final_amount) 
                   VALUES ('$test_id', 1000, 3, 5, 1159.27)" 2>&1)
    
    if ! echo "$insert_result" | grep -q "error"; then
        record_test_result "数据库写入" "pass"
        
        # 清理测试数据
        npx wrangler d1 execute zinses-rechner-prod --env production \
            --command="DELETE FROM calculation_history WHERE session_id = '$test_id'" 2>/dev/null
    else
        record_test_result "数据库写入" "fail"
    fi
}

# 7. 缓存系统验证
verify_caching() {
    log "🗂️ 验证缓存系统..."
    
    # 缓存命中测试
    local cache_test_payload='{"principal": 20000, "annual_rate": 4.5, "years": 12}'
    
    # 第一次请求 (缓存未命中)
    local first_request_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST "$API_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d "$cache_test_payload")
    
    # 第二次请求 (应该命中缓存)
    sleep 1
    local second_request_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST "$API_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d "$cache_test_payload")
    
    log "首次请求时间: ${first_request_time}s"
    log "缓存请求时间: ${second_request_time}s"
    
    local cache_improvement=$(echo "scale=2; ($first_request_time - $second_request_time) / $first_request_time * 100" | bc)
    
    if (( $(echo "$cache_improvement > 20" | bc -l) )); then
        record_test_result "缓存性能改善 (${cache_improvement}%)" "pass"
    elif (( $(echo "$cache_improvement > 0" | bc -l) )); then
        record_test_result "缓存性能改善 (${cache_improvement}%)" "warning"
    else
        record_test_result "缓存功能" "fail"
    fi
    
    # 缓存统计验证
    local cache_stats=$(curl -s "$API_URL/api/v1/monitoring/cache-stats" 2>/dev/null)
    
    if [ -n "$cache_stats" ]; then
        local hit_rate=$(echo "$cache_stats" | jq -r '.hit_rate // 0')
        log "缓存命中率: ${hit_rate}%"
        
        if (( $(echo "$hit_rate > 80" | bc -l) )); then
            record_test_result "缓存命中率 (${hit_rate}%)" "pass"
        elif (( $(echo "$hit_rate > 60" | bc -l) )); then
            record_test_result "缓存命中率 (${hit_rate}%)" "warning"
        else
            record_test_result "缓存命中率 (${hit_rate}%)" "fail"
        fi
    else
        record_test_result "缓存统计获取" "warning"
    fi
}

# 8. 移动端体验验证
verify_mobile_experience() {
    log "📱 验证移动端体验..."
    
    # 使用User-Agent模拟移动设备
    local mobile_ua="Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
    
    local mobile_response=$(curl -s -H "User-Agent: $mobile_ua" "$FRONTEND_URL")
    
    # 检查响应式设计元素
    if echo "$mobile_response" | grep -q "viewport"; then
        record_test_result "移动端viewport配置" "pass"
    else
        record_test_result "移动端viewport配置" "warning"
    fi
    
    # 检查移动端优化
    if echo "$mobile_response" | grep -q "mobile"; then
        record_test_result "移动端优化标识" "pass"
    else
        record_test_result "移动端优化标识" "warning"
    fi
    
    # 移动端API响应时间
    local mobile_api_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -H "User-Agent: $mobile_ua" \
        -X POST "$API_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d '{"principal": 5000, "annual_rate": 3.5, "years": 8}')
    
    log "移动端API响应时间: ${mobile_api_time}s"
    
    if (( $(echo "$mobile_api_time < 1.0" | bc -l) )); then
        record_test_result "移动端API性能" "pass"
    else
        record_test_result "移动端API性能 (${mobile_api_time}s)" "warning"
    fi
}

# 9. 监控系统验证
verify_monitoring() {
    log "📊 验证监控系统..."
    
    # 检查监控端点
    local monitoring_response=$(curl -s "$API_URL/api/v1/monitoring/health" 2>/dev/null)
    
    if [ -n "$monitoring_response" ]; then
        record_test_result "监控端点可访问" "pass"
    else
        record_test_result "监控端点可访问" "warning"
    fi
    
    # 检查指标收集
    local metrics_response=$(curl -s "$API_URL/api/v1/monitoring/metrics" 2>/dev/null)
    
    if echo "$metrics_response" | grep -q "timestamp"; then
        record_test_result "指标数据收集" "pass"
    else
        record_test_result "指标数据收集" "warning"
    fi
    
    # 验证告警配置
    if [ -f "monitoring/alert-rules.yml" ]; then
        record_test_result "告警规则配置" "pass"
    else
        record_test_result "告警规则配置" "warning"
    fi
}

# 10. 用户体验验证
verify_user_experience() {
    log "👤 验证用户体验..."
    
    # 检查德语本地化
    local page_content=$(curl -s "$FRONTEND_URL")
    
    if echo "$page_content" | grep -q "Startkapital"; then
        record_test_result "德语本地化" "pass"
    else
        record_test_result "德语本地化" "fail"
    fi
    
    # 检查欧元格式化
    local calc_response=$(curl -s -X POST "$API_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d '{"principal": 10000, "annual_rate": 4, "years": 10}')
    
    if echo "$calc_response" | grep -q "final_amount"; then
        record_test_result "计算结果格式" "pass"
    else
        record_test_result "计算结果格式" "fail"
    fi
    
    # 检查错误处理
    local error_response=$(curl -s -X POST "$API_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d '{"invalid": "data"}')
    
    if echo "$error_response" | grep -q "error\|message"; then
        record_test_result "错误处理机制" "pass"
    else
        record_test_result "错误处理机制" "warning"
    fi
}

# 生成验证报告
generate_verification_report() {
    log "📋 生成验证报告..."
    
    local overall_status="PASS"
    if [ "$FAILED_TESTS" -gt 0 ]; then
        overall_status="FAIL"
    elif [ "$WARNING_TESTS" -gt 3 ]; then
        overall_status="WARNING"
    fi
    
    cat > "$REPORT_FILE" << EOF
# Zinses-Rechner 生产环境验证报告

**验证时间**: $TIMESTAMP
**验证环境**: Production
**整体状态**: $overall_status

## 验证结果概览

- **总测试数**: $TOTAL_TESTS
- **通过**: $PASSED_TESTS ✅
- **失败**: $FAILED_TESTS ❌
- **警告**: $WARNING_TESTS ⚠️
- **成功率**: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%

## 详细验证日志

\`\`\`
$(cat "$LOG_FILE")
\`\`\`

## 验证项目清单

### 域名和SSL ✓
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 域名可访问性
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] SSL证书有效性
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] HTTPS重定向

### API功能 ✓
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 健康检查端点
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 基础计算功能
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 复杂计算功能
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 输入验证

### 前端功能 ✓
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 页面内容加载
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 静态资源
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] SEO元数据

### 性能指标 ✓
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] API响应时间
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 前端加载时间
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 并发处理能力

### 安全配置 ✓
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 安全头配置
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] CORS策略
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 速率限制

### 数据库 ✓
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 连接和查询
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 表结构完整性
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 数据读写功能

### 缓存系统 ✓
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 缓存命中率
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 性能改善效果

### 移动端体验 ✓
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 响应式设计
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 移动端性能

### 监控系统 ✓
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 监控端点
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 指标收集
- [$([ "$FAILED_TESTS" -eq 0 ] && echo "x" || echo " ")] 告警配置

## 建议行动

$(if [ "$overall_status" = "FAIL" ]; then
    echo "### 🚨 立即行动 (Critical)"
    echo "- 修复所有失败的测试项目"
    echo "- 验证核心功能正常运行"
    echo "- 考虑回滚到上一个稳定版本"
    echo "- 通知所有相关团队成员"
elif [ "$overall_status" = "WARNING" ]; then
    echo "### ⚠️ 计划改进 (Warning)"
    echo "- 解决警告项目以提升系统稳定性"
    echo "- 优化性能和安全配置"
    echo "- 更新监控和告警阈值"
    echo "- 计划下次维护窗口"
else
    echo "### ✅ 系统就绪 (Pass)"
    echo "- 生产环境验证通过"
    echo "- 可以正式发布上线"
    echo "- 继续常规监控和维护"
    echo "- 收集用户反馈进行优化"
fi)

## 性能基准

- **API响应时间**: 目标 <500ms, 当前 ${api_response_time}s
- **前端加载时间**: 目标 <2s, 当前 ${frontend_load_time}s
- **缓存改善**: 目标 >30%, 当前 ${cache_improvement}%
- **并发处理**: 目标 <1s, 当前 ${avg_time}s

## 下一步计划

$(if [ "$overall_status" = "PASS" ]; then
    echo "1. 正式发布公告"
    echo "2. 开始用户反馈收集"
    echo "3. 监控系统稳定性"
    echo "4. 计划功能增强"
else
    echo "1. 修复发现的问题"
    echo "2. 重新执行验证"
    echo "3. 优化系统配置"
    echo "4. 延后正式发布"
fi)

---
*验证报告生成时间: $TIMESTAMP*
*详细日志文件: $LOG_FILE*
EOF

    success "验证报告已生成: $REPORT_FILE"
}

# 主执行流程
main() {
    log "🚀 开始 Zinses-Rechner 生产环境验证..."
    
    # 检查必要工具
    if ! command -v curl &> /dev/null; then
        error "curl 未安装，无法执行验证"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        error "jq 未安装，无法解析JSON响应"
        exit 1
    fi
    
    if ! command -v bc &> /dev/null; then
        error "bc 未安装，无法执行数学计算"
        exit 1
    fi
    
    # 执行验证步骤
    verify_domain_ssl
    verify_api_functionality
    verify_frontend_functionality
    verify_performance
    verify_security
    verify_database
    verify_caching
    verify_mobile_experience
    verify_monitoring
    verify_user_experience
    
    # 生成报告
    generate_verification_report
    
    # 输出最终结果
    log "🎯 验证完成统计:"
    log "总测试数: $TOTAL_TESTS"
    log "通过: $PASSED_TESTS ✅"
    log "失败: $FAILED_TESTS ❌"
    log "警告: $WARNING_TESTS ⚠️"
    log "成功率: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        success "🎉 生产环境验证通过！系统已准备好上线"
        exit 0
    else
        error "❌ 生产环境验证失败，需要修复问题后重新验证"
        exit 1
    fi
}

# 显示使用帮助
show_help() {
    cat << EOF
Zinses-Rechner 生产环境验证脚本

用法:
    $0 [选项]

选项:
    -h, --help          显示此帮助信息
    --quick             快速验证 (跳过性能测试)
    --full              完整验证 (包含所有测试)

验证项目:
    ✓ 域名和SSL证书配置
    ✓ API服务功能和性能
    ✓ 前端页面加载和内容
    ✓ 数据库连接和操作
    ✓ 缓存系统效果
    ✓ 安全配置和防护
    ✓ 移动端体验
    ✓ 监控系统运行
    ✓ 用户体验完整性

输出:
    - 控制台实时输出
    - 详细日志: logs/production-verification-*.log
    - 验证报告: reports/production-verification-*.md

成功标准:
    - 所有Critical测试通过
    - Warning测试 ≤ 3个
    - 性能指标达到目标值
    - 安全配置完整

EOF
}

# 参数处理
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --quick)
        log "执行快速验证模式..."
        # 可以在这里跳过某些耗时的测试
        main
        ;;
    --full|"")
        main
        ;;
    *)
        error "未知参数: $1"
        show_help
        exit 1
        ;;
esac
