#!/bin/bash

# 性能和负载测试执行脚本
# 全面测试系统性能指标和并发能力

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
API_BASE_URL="${API_BASE_URL:-https://api.zinses-rechner.de}"
FRONTEND_URL="${FRONTEND_URL:-https://zinses-rechner.de}"
REPORTS_DIR="reports/performance"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 性能目标
TARGET_API_RESPONSE_TIME=500
TARGET_RPS=1000
TARGET_MEMORY_USAGE=80
TARGET_CPU_USAGE=80
TARGET_CACHE_HIT_RATE=85

# 检查依赖
check_dependencies() {
    log_info "检查性能测试依赖..."
    
    # 检查Artillery
    if ! command -v artillery &> /dev/null; then
        log_error "Artillery未安装"
        log_info "安装命令: npm install -g artillery"
        exit 1
    fi
    
    # 检查Lighthouse
    if ! command -v lighthouse &> /dev/null; then
        log_error "Lighthouse未安装"
        log_info "安装命令: npm install -g lighthouse"
        exit 1
    fi
    
    # 检查curl
    if ! command -v curl &> /dev/null; then
        log_error "curl未安装"
        exit 1
    fi
    
    # 检查jq
    if ! command -v jq &> /dev/null; then
        log_warning "jq未安装，JSON解析功能受限"
    fi
    
    log_success "依赖检查通过"
}

# 创建报告目录
setup_reports_directory() {
    log_info "设置报告目录..."
    
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$REPORTS_DIR/artillery"
    mkdir -p "$REPORTS_DIR/lighthouse"
    mkdir -p "$REPORTS_DIR/custom"
    
    log_success "报告目录创建完成"
}

# 预热测试环境
warmup_environment() {
    log_info "预热测试环境..."
    
    # 预热API端点
    log_info "预热API端点..."
    for i in {1..5}; do
        curl -s -o /dev/null "$API_BASE_URL/health" || true
        sleep 1
    done
    
    # 预热前端页面
    log_info "预热前端页面..."
    curl -s -o /dev/null "$FRONTEND_URL" || true
    
    # 预热计算端点
    log_info "预热计算端点..."
    curl -s -X POST "$API_BASE_URL/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d '{"principal": 10000, "annual_rate": 4.0, "years": 10, "monthly_payment": 0, "compound_frequency": "monthly"}' \
        -o /dev/null || true
    
    log_success "环境预热完成"
}

# 运行API负载测试
run_api_load_tests() {
    log_info "🚀 运行API负载测试..."
    
    local config_file="tests/performance/artillery-load-test.yml"
    local report_file="$REPORTS_DIR/artillery/load-test-$TIMESTAMP.json"
    local html_report="$REPORTS_DIR/artillery/load-test-$TIMESTAMP.html"
    
    # 运行Artillery负载测试
    artillery run "$config_file" \
        --output "$report_file" \
        --config target="$API_BASE_URL"
    
    # 生成HTML报告
    artillery report "$report_file" --output "$html_report"
    
    # 解析测试结果
    if command -v jq &> /dev/null && [ -f "$report_file" ]; then
        local avg_response_time
        local p95_response_time
        local error_rate
        local rps
        
        avg_response_time=$(jq -r '.aggregate.latency.mean' "$report_file" 2>/dev/null || echo "0")
        p95_response_time=$(jq -r '.aggregate.latency.p95' "$report_file" 2>/dev/null || echo "0")
        error_rate=$(jq -r '.aggregate.counters["errors.ECONNREFUSED"] // 0' "$report_file" 2>/dev/null || echo "0")
        rps=$(jq -r '.aggregate.rates.http_request_rate' "$report_file" 2>/dev/null || echo "0")
        
        log_info "📊 API负载测试结果:"
        echo "  平均响应时间: ${avg_response_time}ms"
        echo "  P95响应时间: ${p95_response_time}ms"
        echo "  错误率: ${error_rate}"
        echo "  请求速率: ${rps} RPS"
        
        # 验证性能目标
        if (( $(echo "$p95_response_time < $TARGET_API_RESPONSE_TIME" | bc -l 2>/dev/null || echo "0") )); then
            log_success "✅ API响应时间达标"
        else
            log_warning "⚠️ API响应时间超标 (目标: ${TARGET_API_RESPONSE_TIME}ms)"
        fi
        
        if (( $(echo "$rps > $TARGET_RPS" | bc -l 2>/dev/null || echo "0") )); then
            log_success "✅ 并发处理能力达标"
        else
            log_warning "⚠️ 并发处理能力不足 (目标: ${TARGET_RPS} RPS)"
        fi
    fi
    
    log_success "API负载测试完成"
}

# 运行前端性能测试
run_frontend_performance_tests() {
    log_info "⚡ 运行前端性能测试..."
    
    local lighthouse_report="$REPORTS_DIR/lighthouse/performance-$TIMESTAMP.json"
    local lighthouse_html="$REPORTS_DIR/lighthouse/performance-$TIMESTAMP.html"
    
    # 运行Lighthouse性能测试
    lighthouse "$FRONTEND_URL" \
        --output=json \
        --output=html \
        --output-path="$REPORTS_DIR/lighthouse/performance-$TIMESTAMP" \
        --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" \
        --preset=desktop \
        --throttling-method=devtools \
        --quiet
    
    # 解析Lighthouse结果
    if [ -f "$lighthouse_report" ]; then
        local performance_score
        local lcp fid cls ttfb
        
        performance_score=$(jq -r '.categories.performance.score * 100' "$lighthouse_report" 2>/dev/null || echo "0")
        lcp=$(jq -r '.audits["largest-contentful-paint"].numericValue' "$lighthouse_report" 2>/dev/null || echo "0")
        fid=$(jq -r '.audits["max-potential-fid"].numericValue' "$lighthouse_report" 2>/dev/null || echo "0")
        cls=$(jq -r '.audits["cumulative-layout-shift"].numericValue' "$lighthouse_report" 2>/dev/null || echo "0")
        ttfb=$(jq -r '.audits["server-response-time"].numericValue' "$lighthouse_report" 2>/dev/null || echo "0")
        
        log_info "📊 前端性能测试结果:"
        echo "  性能评分: ${performance_score}/100"
        echo "  LCP (最大内容绘制): ${lcp}ms"
        echo "  FID (首次输入延迟): ${fid}ms"
        echo "  CLS (累积布局偏移): ${cls}"
        echo "  TTFB (首字节时间): ${ttfb}ms"
        
        # 验证Core Web Vitals
        if (( $(echo "$lcp < 2500" | bc -l 2>/dev/null || echo "0") )); then
            log_success "✅ LCP达标"
        else
            log_warning "⚠️ LCP超标 (目标: <2.5s)"
        fi
        
        if (( $(echo "$fid < 100" | bc -l 2>/dev/null || echo "0") )); then
            log_success "✅ FID达标"
        else
            log_warning "⚠️ FID超标 (目标: <100ms)"
        fi
        
        if (( $(echo "$cls < 0.1" | bc -l 2>/dev/null || echo "0") )); then
            log_success "✅ CLS达标"
        else
            log_warning "⚠️ CLS超标 (目标: <0.1)"
        fi
    fi
    
    log_success "前端性能测试完成"
}

# 运行内存和CPU监控测试
run_resource_monitoring() {
    log_info "💾 运行资源监控测试..."
    
    local monitoring_duration=300  # 5分钟监控
    local monitoring_interval=5    # 5秒间隔
    local monitoring_file="$REPORTS_DIR/custom/resource-monitoring-$TIMESTAMP.json"
    
    echo "[" > "$monitoring_file"
    
    log_info "开始${monitoring_duration}秒的资源监控..."
    
    for ((i=0; i<monitoring_duration; i+=monitoring_interval)); do
        # 获取系统资源使用情况
        local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
        local memory_usage cpu_usage
        
        # 获取内存使用率
        if command -v free &> /dev/null; then
            memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
        else
            memory_usage="0"
        fi
        
        # 获取CPU使用率
        if command -v top &> /dev/null; then
            cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' || echo "0")
        else
            cpu_usage="0"
        fi
        
        # 测试API响应时间
        local api_response_time
        api_response_time=$(curl -o /dev/null -s -w '%{time_total}' "$API_BASE_URL/health" 2>/dev/null || echo "0")
        api_response_time=$(echo "$api_response_time * 1000" | bc 2>/dev/null || echo "0")
        
        # 记录数据点
        cat >> "$monitoring_file" << EOF
{
  "timestamp": "$timestamp",
  "memory_usage_percent": $memory_usage,
  "cpu_usage_percent": $cpu_usage,
  "api_response_time_ms": $api_response_time,
  "elapsed_seconds": $i
}$([ $((i + monitoring_interval)) -lt $monitoring_duration ] && echo "," || echo "")
EOF
        
        # 显示实时状态
        printf "\r监控进度: %d/%d秒 | 内存: %s%% | CPU: %s%% | API: %sms" \
            "$i" "$monitoring_duration" "$memory_usage" "$cpu_usage" "$api_response_time"
        
        sleep $monitoring_interval
    done
    
    echo "]" >> "$monitoring_file"
    echo ""  # 换行
    
    # 分析监控结果
    if command -v jq &> /dev/null; then
        local avg_memory avg_cpu max_memory max_cpu
        
        avg_memory=$(jq '[.[].memory_usage_percent] | add / length' "$monitoring_file" 2>/dev/null || echo "0")
        avg_cpu=$(jq '[.[].cpu_usage_percent] | add / length' "$monitoring_file" 2>/dev/null || echo "0")
        max_memory=$(jq '[.[].memory_usage_percent] | max' "$monitoring_file" 2>/dev/null || echo "0")
        max_cpu=$(jq '[.[].cpu_usage_percent] | max' "$monitoring_file" 2>/dev/null || echo "0")
        
        log_info "📊 资源使用监控结果:"
        echo "  平均内存使用: ${avg_memory}%"
        echo "  峰值内存使用: ${max_memory}%"
        echo "  平均CPU使用: ${avg_cpu}%"
        echo "  峰值CPU使用: ${max_cpu}%"
        
        # 验证资源使用目标
        if (( $(echo "$max_memory < $TARGET_MEMORY_USAGE" | bc -l 2>/dev/null || echo "0") )); then
            log_success "✅ 内存使用率达标"
        else
            log_warning "⚠️ 内存使用率超标 (目标: <${TARGET_MEMORY_USAGE}%)"
        fi
        
        if (( $(echo "$max_cpu < $TARGET_CPU_USAGE" | bc -l 2>/dev/null || echo "0") )); then
            log_success "✅ CPU使用率达标"
        else
            log_warning "⚠️ CPU使用率超标 (目标: <${TARGET_CPU_USAGE}%)"
        fi
    fi
    
    log_success "资源监控测试完成"
}

# 测试缓存性能
test_cache_performance() {
    log_info "🗄️ 测试缓存性能..."
    
    local cache_test_file="$REPORTS_DIR/custom/cache-test-$TIMESTAMP.json"
    local test_endpoint="$API_BASE_URL/api/v1/calculate/compound-interest"
    
    # 测试数据
    local test_payload='{"principal": 10000, "annual_rate": 4.0, "years": 10, "monthly_payment": 500, "compound_frequency": "monthly"}'
    
    echo "[" > "$cache_test_file"
    
    local cache_hits=0
    local total_requests=100
    
    log_info "执行${total_requests}次相同请求测试缓存..."
    
    for ((i=1; i<=total_requests; i++)); do
        local start_time=$(date +%s%3N)
        
        local response
        response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
            -X POST "$test_endpoint" \
            -H "Content-Type: application/json" \
            -d "$test_payload" 2>/dev/null)
        
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        # 解析响应
        local http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        local curl_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
        local response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*$//')
        
        # 检查缓存头
        local cache_status="miss"
        if echo "$response_body" | grep -q "cache.*hit" 2>/dev/null; then
            cache_status="hit"
            cache_hits=$((cache_hits + 1))
        fi
        
        # 记录数据
        cat >> "$cache_test_file" << EOF
{
  "request_number": $i,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "http_status": $http_status,
  "response_time_ms": $response_time,
  "curl_time_seconds": $curl_time,
  "cache_status": "$cache_status"
}$([ $i -lt $total_requests ] && echo "," || echo "")
EOF
        
        # 显示进度
        printf "\r缓存测试进度: %d/%d | 缓存命中: %d | 响应时间: %dms" \
            "$i" "$total_requests" "$cache_hits" "$response_time"
        
        # 短暂延迟避免过快请求
        sleep 0.1
    done
    
    echo "]" >> "$cache_test_file"
    echo ""  # 换行
    
    # 计算缓存命中率
    local cache_hit_rate
    cache_hit_rate=$(echo "scale=2; $cache_hits * 100 / $total_requests" | bc 2>/dev/null || echo "0")
    
    log_info "📊 缓存性能测试结果:"
    echo "  总请求数: $total_requests"
    echo "  缓存命中数: $cache_hits"
    echo "  缓存命中率: ${cache_hit_rate}%"
    
    # 验证缓存目标
    if (( $(echo "$cache_hit_rate > $TARGET_CACHE_HIT_RATE" | bc -l 2>/dev/null || echo "0") )); then
        log_success "✅ 缓存命中率达标"
    else
        log_warning "⚠️ 缓存命中率不足 (目标: >${TARGET_CACHE_HIT_RATE}%)"
    fi
    
    log_success "缓存性能测试完成"
}

# 运行压力测试
run_stress_tests() {
    log_info "💪 运行压力测试..."
    
    local stress_config="tests/performance/artillery-stress-test.yml"
    local stress_report="$REPORTS_DIR/artillery/stress-test-$TIMESTAMP.json"
    
    # 创建压力测试配置
    cat > "$stress_config" << EOF
config:
  target: '$API_BASE_URL'
  phases:
    - duration: 60
      arrivalRate: 100
    - duration: 120
      arrivalRate: 500
    - duration: 180
      arrivalRate: 1000
    - duration: 120
      arrivalRate: 1500
    - duration: 60
      arrivalRate: 2000

scenarios:
  - name: "极限压力测试"
    flow:
      - post:
          url: "/api/v1/calculate/compound-interest"
          json:
            principal: "{{ \$randomInt(1000, 100000) }}"
            annual_rate: "{{ \$randomFloat(1.0, 10.0) }}"
            years: "{{ \$randomInt(1, 30) }}"
            monthly_payment: "{{ \$randomInt(0, 2000) }}"
            compound_frequency: "monthly"
EOF
    
    # 运行压力测试
    artillery run "$stress_config" --output "$stress_report"
    
    # 分析压力测试结果
    if command -v jq &> /dev/null && [ -f "$stress_report" ]; then
        local max_rps error_count
        
        max_rps=$(jq -r '.aggregate.rates.http_request_rate' "$stress_report" 2>/dev/null || echo "0")
        error_count=$(jq -r '.aggregate.counters.errors // 0' "$stress_report" 2>/dev/null || echo "0")
        
        log_info "📊 压力测试结果:"
        echo "  最大RPS: $max_rps"
        echo "  错误总数: $error_count"
        
        if (( $(echo "$max_rps > $TARGET_RPS" | bc -l 2>/dev/null || echo "0") )); then
            log_success "✅ 系统承受压力达标"
        else
            log_warning "⚠️ 系统承受压力不足"
        fi
    fi
    
    # 清理临时配置
    rm -f "$stress_config"
    
    log_success "压力测试完成"
}

# 生成性能测试综合报告
generate_performance_report() {
    log_info "📋 生成性能测试综合报告..."
    
    local report_file="$REPORTS_DIR/performance-test-summary-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Zinses-Rechner 性能测试报告

## 测试执行信息
- **执行时间**: $(date)
- **测试环境**: ${NODE_ENV:-production}
- **API地址**: $API_BASE_URL
- **前端地址**: $FRONTEND_URL

## 性能目标 vs 实际结果

### API性能
| 指标 | 目标 | 实际结果 | 状态 |
|------|------|----------|------|
| 响应时间 (P95) | < ${TARGET_API_RESPONSE_TIME}ms | 查看详细报告 | 待验证 |
| 并发处理能力 | > ${TARGET_RPS} RPS | 查看详细报告 | 待验证 |
| 错误率 | < 1% | 查看详细报告 | 待验证 |

### 前端性能
| 指标 | 目标 | 实际结果 | 状态 |
|------|------|----------|------|
| LCP | < 2.5s | 查看Lighthouse报告 | 待验证 |
| FID | < 100ms | 查看Lighthouse报告 | 待验证 |
| CLS | < 0.1 | 查看Lighthouse报告 | 待验证 |

### 系统资源
| 指标 | 目标 | 实际结果 | 状态 |
|------|------|----------|------|
| 内存使用率 | < ${TARGET_MEMORY_USAGE}% | 查看监控报告 | 待验证 |
| CPU使用率 | < ${TARGET_CPU_USAGE}% | 查看监控报告 | 待验证 |
| 缓存命中率 | > ${TARGET_CACHE_HIT_RATE}% | 查看缓存报告 | 待验证 |

## 测试文件
- **Artillery负载测试**: artillery/load-test-$TIMESTAMP.html
- **Lighthouse性能报告**: lighthouse/performance-$TIMESTAMP.html
- **资源监控数据**: custom/resource-monitoring-$TIMESTAMP.json
- **缓存测试结果**: custom/cache-test-$TIMESTAMP.json

## 优化建议
1. 监控API响应时间趋势
2. 优化数据库查询性能
3. 调整缓存策略和TTL
4. 实施CDN预热机制
5. 优化前端资源加载

## 下一步行动
- [ ] 分析性能瓶颈点
- [ ] 实施性能优化措施
- [ ] 建立持续性能监控
- [ ] 设置性能告警阈值

---
*报告生成时间: $(date -u +%Y-%m-%dT%H:%M:%SZ)*
EOF

    log_success "性能测试报告已生成: $report_file"
}

# 主测试流程
main() {
    log_info "🚀 开始Zinses-Rechner性能和负载测试"
    
    # 执行测试步骤
    check_dependencies
    setup_reports_directory
    warmup_environment
    run_api_load_tests
    run_frontend_performance_tests
    run_resource_monitoring
    test_cache_performance
    run_stress_tests
    generate_performance_report
    
    log_success "🎉 性能和负载测试完成！"
    
    echo ""
    log_info "📊 测试摘要:"
    echo "🎯 API性能: 响应时间和并发能力测试"
    echo "⚡ 前端性能: Core Web Vitals和Lighthouse评分"
    echo "💾 资源监控: 内存和CPU使用率跟踪"
    echo "🗄️ 缓存性能: 命中率和响应时间优化"
    echo "💪 压力测试: 极限负载承受能力"
    
    echo ""
    log_info "📁 查看详细报告:"
    echo "- 综合报告: $REPORTS_DIR/performance-test-summary-$TIMESTAMP.md"
    echo "- Artillery报告: $REPORTS_DIR/artillery/"
    echo "- Lighthouse报告: $REPORTS_DIR/lighthouse/"
    echo "- 自定义监控: $REPORTS_DIR/custom/"
}

# 错误处理
trap 'log_error "性能测试过程中发生错误，请检查日志"; exit 1' ERR

# 执行主流程
main "$@"
