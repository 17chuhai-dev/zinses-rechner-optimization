#!/bin/bash

# Zinses-Rechner 健康检查脚本
# 用途: 检查所有系统组件的健康状态
# 使用: ./scripts/health-check.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date -Iseconds)
LOG_FILE="logs/health-check-$(date +%Y%m%d).log"

# 创建日志目录
mkdir -p logs

# 日志函数
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$TIMESTAMP] ❌ ERROR: $1" | tee -a "$LOG_FILE"
}

success() {
    echo "[$TIMESTAMP] ✅ SUCCESS: $1" | tee -a "$LOG_FILE"
}

warning() {
    echo "[$TIMESTAMP] ⚠️ WARNING: $1" | tee -a "$LOG_FILE"
}

# 检查必要工具
check_dependencies() {
    log "检查必要工具..."
    
    if ! command -v curl &> /dev/null; then
        error "curl 未安装"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        error "jq 未安装"
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        error "npx 未安装"
        exit 1
    fi
    
    success "所有必要工具已安装"
}

# 检查前端服务
check_frontend() {
    log "检查前端服务..."
    
    local url="https://zinses-rechner.de"
    if [ "$ENVIRONMENT" = "staging" ]; then
        url="https://staging.zinses-rechner.de"
    fi
    
    # 检查HTTP状态
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$status_code" = "200" ]; then
        success "前端服务正常 (HTTP $status_code)"
    else
        error "前端服务异常 (HTTP $status_code)"
        return 1
    fi
    
    # 检查响应时间
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null "$url")
    if (( $(echo "$response_time < 3.0" | bc -l) )); then
        success "前端响应时间正常: ${response_time}s"
    else
        warning "前端响应时间较慢: ${response_time}s"
    fi
    
    # 检查关键内容
    local content=$(curl -s "$url")
    if echo "$content" | grep -q "Zinseszins-Rechner"; then
        success "前端内容正常"
    else
        error "前端内容异常"
        return 1
    fi
}

# 检查API服务
check_api() {
    log "检查API服务..."
    
    local api_url="https://api.zinses-rechner.de"
    if [ "$ENVIRONMENT" = "staging" ]; then
        api_url="https://staging-api.zinses-rechner.de"
    fi
    
    # 健康检查端点
    local health_response=$(curl -s "$api_url/health")
    local health_status=$(echo "$health_response" | jq -r '.status // "error"')
    
    if [ "$health_status" = "healthy" ]; then
        success "API健康检查通过"
    else
        error "API健康检查失败: $health_status"
        return 1
    fi
    
    # 测试计算功能
    local calc_response=$(curl -s -X POST "$api_url/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d '{"principal": 10000, "annual_rate": 4, "years": 10}')
    
    local final_amount=$(echo "$calc_response" | jq -r '.final_amount // "error"')
    
    if [ "$final_amount" != "error" ] && [ "$final_amount" != "null" ]; then
        success "API计算功能正常 (结果: €$final_amount)"
    else
        error "API计算功能异常"
        echo "$calc_response" | tee -a "$LOG_FILE"
        return 1
    fi
    
    # 检查API响应时间
    local api_response_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST "$api_url/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d '{"principal": 10000, "annual_rate": 4, "years": 10}')
    
    if (( $(echo "$api_response_time < 1.0" | bc -l) )); then
        success "API响应时间正常: ${api_response_time}s"
    else
        warning "API响应时间较慢: ${api_response_time}s"
    fi
}

# 检查数据库
check_database() {
    log "检查数据库..."
    
    # 检查数据库连接
    local db_test=$(npx wrangler d1 execute zinses-rechner-prod --env "$ENVIRONMENT" \
        --command="SELECT 1 as test" 2>&1)
    
    if echo "$db_test" | grep -q "test"; then
        success "数据库连接正常"
    else
        error "数据库连接失败: $db_test"
        return 1
    fi
    
    # 检查数据库大小
    local db_info=$(npx wrangler d1 info zinses-rechner-prod --env "$ENVIRONMENT" 2>&1)
    if echo "$db_info" | grep -q "Size"; then
        local db_size=$(echo "$db_info" | grep "Size" | awk '{print $2}')
        log "数据库大小: $db_size"
        
        # 检查是否接近限制
        local size_mb=$(echo "$db_size" | sed 's/MB//')
        if [ "$size_mb" -gt 4000 ]; then
            warning "数据库大小接近限制: ${db_size}"
        fi
    fi
    
    # 检查最近的数据
    local recent_data=$(npx wrangler d1 execute zinses-rechner-prod --env "$ENVIRONMENT" \
        --command="SELECT COUNT(*) as count FROM calculation_history WHERE created_at > datetime('now', '-24 hours')" 2>&1)
    
    if echo "$recent_data" | grep -q "count"; then
        local count=$(echo "$recent_data" | grep -o '[0-9]\+')
        log "过去24小时计算记录: $count"
    fi
}

# 检查缓存系统
check_cache() {
    log "检查缓存系统..."
    
    local api_url="https://api.zinses-rechner.de"
    if [ "$ENVIRONMENT" = "staging" ]; then
        api_url="https://staging-api.zinses-rechner.de"
    fi
    
    # 检查缓存统计
    local cache_stats=$(curl -s "$api_url/api/v1/monitoring/cache-stats" 2>/dev/null)
    
    if [ -n "$cache_stats" ]; then
        local hit_rate=$(echo "$cache_stats" | jq -r '.hit_rate // 0')
        local total_requests=$(echo "$cache_stats" | jq -r '.total_requests // 0')
        
        log "缓存命中率: ${hit_rate}%"
        log "总请求数: $total_requests"
        
        if (( $(echo "$hit_rate < 80" | bc -l) )); then
            warning "缓存命中率较低: ${hit_rate}%"
        else
            success "缓存性能正常"
        fi
    else
        warning "无法获取缓存统计信息"
    fi
}

# 检查监控系统
check_monitoring() {
    log "检查监控系统..."
    
    # 检查告警规则
    if [ -f "monitoring/alert-rules.yml" ]; then
        success "告警规则配置存在"
    else
        warning "告警规则配置缺失"
    fi
    
    # 检查最近的告警
    if [ -f "logs/alerts.log" ]; then
        local recent_alerts=$(tail -n 10 logs/alerts.log | grep "$(date +%Y-%m-%d)" | wc -l)
        log "今日告警数量: $recent_alerts"
        
        if [ "$recent_alerts" -gt 5 ]; then
            warning "今日告警数量较多: $recent_alerts"
        fi
    fi
}

# 检查SSL证书
check_ssl() {
    log "检查SSL证书..."
    
    local domain="zinses-rechner.de"
    local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    
    local expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    log "SSL证书到期时间: $expiry_date"
    log "距离到期: $days_until_expiry 天"
    
    if [ "$days_until_expiry" -lt 30 ]; then
        warning "SSL证书即将到期: $days_until_expiry 天"
    else
        success "SSL证书有效期正常"
    fi
}

# 性能基准测试
performance_benchmark() {
    log "运行性能基准测试..."
    
    local api_url="https://api.zinses-rechner.de"
    if [ "$ENVIRONMENT" = "staging" ]; then
        api_url="https://staging-api.zinses-rechner.de"
    fi
    
    # 测试多个计算请求的平均响应时间
    local total_time=0
    local test_count=5
    
    for i in $(seq 1 $test_count); do
        local response_time=$(curl -w "%{time_total}" -s -o /dev/null \
            -X POST "$api_url/api/v1/calculate/compound-interest" \
            -H "Content-Type: application/json" \
            -d "{\"principal\": $((10000 + i * 1000)), \"annual_rate\": 4, \"years\": 10}")
        
        total_time=$(echo "$total_time + $response_time" | bc)
    done
    
    local avg_time=$(echo "scale=3; $total_time / $test_count" | bc)
    log "平均API响应时间: ${avg_time}s (基于${test_count}次测试)"
    
    if (( $(echo "$avg_time < 0.5" | bc -l) )); then
        success "API性能优秀"
    elif (( $(echo "$avg_time < 1.0" | bc -l) )); then
        success "API性能良好"
    else
        warning "API性能需要优化"
    fi
}

# 生成健康报告
generate_health_report() {
    log "生成健康检查报告..."
    
    local report_file="reports/health-report-$(date +%Y%m%d).md"
    mkdir -p reports
    
    cat > "$report_file" << EOF
# Zinses-Rechner 健康检查报告

**检查时间**: $(date -Iseconds)
**环境**: $ENVIRONMENT
**检查者**: $(whoami)

## 系统状态概览

$(if grep -q "❌" "$LOG_FILE"; then echo "🔴 **状态**: 发现问题"; else echo "🟢 **状态**: 系统健康"; fi)

## 详细检查结果

\`\`\`
$(cat "$LOG_FILE")
\`\`\`

## 建议行动

$(if grep -q "❌" "$LOG_FILE"; then
    echo "- 立即调查并修复发现的错误"
    echo "- 通知相关团队成员"
    echo "- 考虑是否需要紧急维护"
elif grep -q "⚠️" "$LOG_FILE"; then
    echo "- 监控警告项目的发展"
    echo "- 计划预防性维护"
    echo "- 更新监控阈值（如需要）"
else
    echo "- 系统运行正常，继续常规监控"
    echo "- 可以进行计划中的维护任务"
fi)

---
*报告生成时间: $(date -Iseconds)*
EOF

    success "健康检查报告已生成: $report_file"
}

# 发送告警通知
send_alerts_if_needed() {
    if grep -q "❌" "$LOG_FILE"; then
        log "发现Critical问题，发送告警..."
        if [ -f "scripts/send-alert.sh" ]; then
            ./scripts/send-alert.sh "健康检查失败" "发现Critical问题，请立即检查" "critical"
        fi
    elif grep -q "⚠️" "$LOG_FILE"; then
        log "发现Warning问题，发送通知..."
        if [ -f "scripts/send-alert.sh" ]; then
            ./scripts/send-alert.sh "健康检查警告" "发现Warning问题，需要关注" "warning"
        fi
    fi
}

# 主执行流程
main() {
    log "🔍 开始 Zinses-Rechner 健康检查 (环境: $ENVIRONMENT)"
    
    # 检查依赖
    check_dependencies
    
    # 系统组件检查
    local exit_code=0
    
    if ! check_frontend; then
        exit_code=1
    fi
    
    if ! check_api; then
        exit_code=1
    fi
    
    if ! check_database; then
        exit_code=1
    fi
    
    check_cache
    check_monitoring
    check_ssl
    
    # 性能测试
    performance_benchmark
    
    # 生成报告
    generate_health_report
    
    # 发送告警
    send_alerts_if_needed
    
    if [ $exit_code -eq 0 ]; then
        success "健康检查完成 - 系统状态良好"
    else
        error "健康检查完成 - 发现问题需要处理"
    fi
    
    log "检查日志保存在: $LOG_FILE"
    
    exit $exit_code
}

# 显示使用帮助
show_help() {
    cat << EOF
Zinses-Rechner 健康检查脚本

用法:
    $0 [environment]

参数:
    environment    目标环境 (production|staging) [默认: production]

示例:
    $0                    # 检查生产环境
    $0 staging           # 检查测试环境

选项:
    -h, --help          显示此帮助信息

检查项目:
    ✓ 前端服务可访问性和响应时间
    ✓ API服务健康状态和功能
    ✓ 数据库连接和性能
    ✓ 缓存系统状态
    ✓ 监控系统配置
    ✓ SSL证书有效期
    ✓ 性能基准测试

输出:
    - 控制台实时输出
    - 详细日志: logs/health-check-YYYYMMDD.log
    - 健康报告: reports/health-report-YYYYMMDD.md
    - 告警通知 (如有问题)

EOF
}

# 参数处理
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac
