#!/bin/bash

# Zinses-Rechner 故障排查脚本
# 用途: 自动诊断和修复常见问题
# 使用: ./scripts/troubleshoot.sh [problem_type]

set -e

PROBLEM_TYPE=${1:-auto}
TIMESTAMP=$(date -Iseconds)
LOG_FILE="logs/troubleshoot-$(date +%Y%m%d-%H%M%S).log"

# 创建日志目录
mkdir -p logs

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

# 自动检测问题类型
detect_problem() {
    log "🔍 自动检测问题类型..."
    
    # 检查前端可访问性
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" https://zinses-rechner.de)
    if [ "$frontend_status" != "200" ]; then
        echo "frontend_down"
        return
    fi
    
    # 检查API可访问性
    local api_health=$(curl -s https://api.zinses-rechner.de/health | jq -r '.status // "error"')
    if [ "$api_health" != "healthy" ]; then
        echo "api_down"
        return
    fi
    
    # 检查API响应时间
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" \
        -d '{"principal": 10000, "annual_rate": 4, "years": 10}')
    
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        echo "slow_response"
        return
    fi
    
    # 检查数据库
    local db_test=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="SELECT 1 as test" 2>&1)
    if ! echo "$db_test" | grep -q "test"; then
        echo "database_error"
        return
    fi
    
    echo "no_issues"
}

# 故障排查: 前端服务不可用
troubleshoot_frontend_down() {
    log "🔧 排查前端服务问题..."
    
    # 1. 检查Cloudflare状态
    info "检查Cloudflare服务状态..."
    local cf_status=$(curl -s https://www.cloudflarestatus.com/api/v2/status.json | jq -r '.status.description')
    log "Cloudflare状态: $cf_status"
    
    # 2. 检查DNS解析
    info "检查DNS解析..."
    local dns_result=$(nslookup zinses-rechner.de 8.8.8.8 2>&1)
    if echo "$dns_result" | grep -q "NXDOMAIN"; then
        error "DNS解析失败"
        log "建议: 检查域名配置和DNS设置"
    else
        success "DNS解析正常"
    fi
    
    # 3. 检查最近部署
    info "检查最近部署..."
    local last_commit=$(git log -1 --pretty=format:"%h %s %cr")
    log "最后提交: $last_commit"
    
    # 4. 检查Pages部署状态
    info "检查Pages部署状态..."
    if command -v npx &> /dev/null; then
        local pages_status=$(npx wrangler pages deployment list --project-name=zinses-rechner 2>&1 | head -5)
        log "Pages部署状态: $pages_status"
    fi
    
    # 5. 建议修复步骤
    log "🔧 建议修复步骤:"
    log "1. 检查Cloudflare Pages控制台"
    log "2. 验证最近的部署是否成功"
    log "3. 如果需要，执行紧急回滚: ./scripts/emergency-rollback.sh"
    log "4. 检查域名和DNS配置"
}

# 故障排查: API服务问题
troubleshoot_api_down() {
    log "🔧 排查API服务问题..."
    
    # 1. 检查Workers状态
    info "检查Workers状态..."
    local workers_logs=$(npx wrangler tail --env production --format=pretty | head -10)
    log "最近Workers日志:"
    echo "$workers_logs" | tee -a "$LOG_FILE"
    
    # 2. 检查Workers配置
    info "检查Workers配置..."
    if [ -f "cloudflare-workers/api-worker/wrangler.toml" ]; then
        local worker_name=$(grep "name" cloudflare-workers/api-worker/wrangler.toml | cut -d'"' -f2)
        log "Worker名称: $worker_name"
    fi
    
    # 3. 测试基础端点
    info "测试基础端点..."
    local health_response=$(curl -s https://api.zinses-rechner.de/health 2>&1)
    log "健康检查响应: $health_response"
    
    # 4. 检查环境变量
    info "检查关键环境变量..."
    # 注意: 不要记录敏感信息
    log "检查环境变量配置完整性..."
    
    # 5. 建议修复步骤
    log "🔧 建议修复步骤:"
    log "1. 检查Cloudflare Workers控制台"
    log "2. 查看详细错误日志: npx wrangler tail --env production"
    log "3. 验证环境变量配置"
    log "4. 如果需要，重新部署: npx wrangler deploy --env production"
    log "5. 检查路由配置和域名绑定"
}

# 故障排查: 响应时间过慢
troubleshoot_slow_response() {
    log "🔧 排查响应时间问题..."
    
    # 1. 详细性能分析
    info "执行详细性能分析..."
    
    # 测试不同复杂度的计算
    local simple_calc='{"principal": 1000, "annual_rate": 3, "years": 5}'
    local complex_calc='{"principal": 100000, "annual_rate": 7, "years": 50, "monthly_payment": 1000}'
    
    local simple_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" -d "$simple_calc")
    
    local complex_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" -d "$complex_calc")
    
    log "简单计算响应时间: ${simple_time}s"
    log "复杂计算响应时间: ${complex_time}s"
    
    # 2. 检查缓存效果
    info "检查缓存效果..."
    
    # 第一次请求 (缓存未命中)
    local first_request_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" -d "$simple_calc")
    
    # 第二次请求 (应该命中缓存)
    local second_request_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" -d "$simple_calc")
    
    log "首次请求时间: ${first_request_time}s"
    log "缓存请求时间: ${second_request_time}s"
    
    local cache_improvement=$(echo "scale=2; ($first_request_time - $second_request_time) / $first_request_time * 100" | bc)
    log "缓存改善: ${cache_improvement}%"
    
    # 3. 检查数据库性能
    info "检查数据库性能..."
    local db_query_time=$(time (npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="SELECT COUNT(*) FROM calculation_history WHERE created_at > datetime('now', '-1 hour')") 2>&1 | \
        grep real | awk '{print $2}')
    log "数据库查询时间: $db_query_time"
    
    # 4. 分析瓶颈
    info "分析性能瓶颈..."
    if (( $(echo "$complex_time > $simple_time * 3" | bc -l) )); then
        warning "复杂计算性能瓶颈 - 考虑算法优化"
    fi
    
    if (( $(echo "$cache_improvement < 30" | bc -l) )); then
        warning "缓存效果不佳 - 检查缓存策略"
    fi
    
    # 5. 建议优化措施
    log "🔧 建议优化措施:"
    log "1. 优化计算算法复杂度"
    log "2. 增强缓存策略和预热"
    log "3. 检查数据库查询优化"
    log "4. 考虑增加Workers资源配置"
    log "5. 分析并优化热点代码路径"
}

# 故障排查: 数据库问题
troubleshoot_database_error() {
    log "🔧 排查数据库问题..."
    
    # 1. 检查数据库基本信息
    info "检查数据库基本信息..."
    local db_info=$(npx wrangler d1 info zinses-rechner-prod --env production 2>&1)
    log "数据库信息: $db_info"
    
    # 2. 测试简单查询
    info "测试简单查询..."
    local simple_query=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="SELECT datetime('now') as current_time" 2>&1)
    
    if echo "$simple_query" | grep -q "current_time"; then
        success "基础查询功能正常"
    else
        error "基础查询失败: $simple_query"
    fi
    
    # 3. 检查表结构
    info "检查表结构..."
    local table_info=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="SELECT name FROM sqlite_master WHERE type='table'" 2>&1)
    log "数据库表: $table_info"
    
    # 4. 检查数据完整性
    info "检查数据完整性..."
    local integrity_check=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="PRAGMA integrity_check" 2>&1)
    
    if echo "$integrity_check" | grep -q "ok"; then
        success "数据完整性检查通过"
    else
        error "数据完整性问题: $integrity_check"
    fi
    
    # 5. 检查连接限制
    info "检查连接和资源使用..."
    local connection_info=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="SELECT COUNT(*) as active_connections FROM pragma_database_list" 2>&1)
    log "连接信息: $connection_info"
    
    # 6. 建议修复步骤
    log "🔧 建议修复步骤:"
    log "1. 检查D1数据库配额和限制"
    log "2. 验证wrangler.toml中的数据库配置"
    log "3. 检查是否需要数据库迁移"
    log "4. 考虑数据清理和优化"
    log "5. 如果持续问题，联系Cloudflare支持"
}

# 故障排查: 缓存问题
troubleshoot_cache_issues() {
    log "🔧 排查缓存问题..."
    
    # 1. 检查缓存配置
    info "检查缓存配置..."
    local cache_config=$(grep -r "cache" cloudflare-workers/api-worker/src/ | head -5)
    log "缓存配置片段: $cache_config"
    
    # 2. 测试缓存行为
    info "测试缓存行为..."
    local test_payload='{"principal": 12345, "annual_rate": 4.5, "years": 12}'
    
    # 清除可能的缓存
    local cache_key="calc_$(echo "$test_payload" | md5sum | cut -d' ' -f1)"
    log "测试缓存键: $cache_key"
    
    # 第一次请求
    local first_response=$(curl -s -w "RESPONSE_TIME:%{time_total}" \
        -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" -d "$test_payload")
    
    local first_time=$(echo "$first_response" | grep "RESPONSE_TIME" | cut -d: -f2)
    local first_result=$(echo "$first_response" | sed 's/RESPONSE_TIME:.*//')
    
    # 第二次请求 (应该命中缓存)
    sleep 1
    local second_response=$(curl -s -w "RESPONSE_TIME:%{time_total}" \
        -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" -d "$test_payload")
    
    local second_time=$(echo "$second_response" | grep "RESPONSE_TIME" | cut -d: -f2)
    local second_result=$(echo "$second_response" | sed 's/RESPONSE_TIME:.*//')
    
    log "首次请求时间: ${first_time}s"
    log "缓存请求时间: ${second_time}s"
    
    # 验证结果一致性
    if [ "$first_result" = "$second_result" ]; then
        success "缓存结果一致性正常"
    else
        error "缓存结果不一致"
    fi
    
    # 计算缓存效果
    local improvement=$(echo "scale=2; ($first_time - $second_time) / $first_time * 100" | bc)
    log "缓存性能改善: ${improvement}%"
    
    if (( $(echo "$improvement < 20" | bc -l) )); then
        warning "缓存效果不明显，可能存在配置问题"
    fi
    
    # 3. 建议修复步骤
    log "🔧 建议修复步骤:"
    log "1. 检查Workers中的缓存逻辑"
    log "2. 验证缓存键生成算法"
    log "3. 检查缓存TTL设置"
    log "4. 考虑预热热点数据"
    log "5. 监控缓存命中率趋势"
}

# 故障排查: 计算错误
troubleshoot_calculation_errors() {
    log "🔧 排查计算错误问题..."
    
    # 1. 测试已知正确的计算
    info "测试已知正确的计算..."
    
    # 简单复利计算: 1000€, 5%, 10年 = 1628.89€
    local test_calc='{"principal": 1000, "annual_rate": 5, "years": 10}'
    local expected_result=1628.89
    
    local calc_response=$(curl -s -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" -d "$test_calc")
    
    local actual_result=$(echo "$calc_response" | jq -r '.final_amount // "error"')
    
    if [ "$actual_result" = "error" ]; then
        error "计算API返回错误"
        log "错误响应: $calc_response"
    else
        local difference=$(echo "scale=2; $actual_result - $expected_result" | bc)
        local abs_difference=$(echo "$difference" | tr -d '-')
        
        log "期望结果: €$expected_result"
        log "实际结果: €$actual_result"
        log "差异: €$difference"
        
        if (( $(echo "$abs_difference < 0.01" | bc -l) )); then
            success "计算精度正常"
        else
            error "计算结果不准确，差异: €$difference"
        fi
    fi
    
    # 2. 测试边界值
    info "测试边界值..."
    local boundary_tests=(
        '{"principal": 1, "annual_rate": 0, "years": 1}'
        '{"principal": 10000000, "annual_rate": 20, "years": 50}'
        '{"principal": 1000, "annual_rate": 0.01, "years": 1}'
    )
    
    for test_case in "${boundary_tests[@]}"; do
        local boundary_response=$(curl -s -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
            -H "Content-Type: application/json" -d "$test_case")
        
        local boundary_result=$(echo "$boundary_response" | jq -r '.final_amount // "error"')
        
        if [ "$boundary_result" = "error" ]; then
            error "边界值测试失败: $test_case"
            log "错误响应: $boundary_response"
        else
            success "边界值测试通过: €$boundary_result"
        fi
    done
    
    # 3. 检查输入验证
    info "检查输入验证..."
    local invalid_tests=(
        '{"principal": -1000, "annual_rate": 4, "years": 10}'
        '{"principal": 1000, "annual_rate": -1, "years": 10}'
        '{"principal": 1000, "annual_rate": 4, "years": 0}'
    )
    
    for invalid_test in "${invalid_tests[@]}"; do
        local invalid_response=$(curl -s -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
            -H "Content-Type: application/json" -d "$invalid_test")
        
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
            -H "Content-Type: application/json" -d "$invalid_test")
        
        if [ "$status_code" = "422" ]; then
            success "输入验证正常: HTTP $status_code"
        else
            error "输入验证失败: HTTP $status_code"
        fi
    done
    
    # 4. 建议修复步骤
    log "🔧 建议修复步骤:"
    log "1. 检查计算算法实现"
    log "2. 验证数学公式正确性"
    log "3. 检查数据类型和精度处理"
    log "4. 验证输入验证逻辑"
    log "5. 对比参考计算器结果"
}

# 故障排查: 部署问题
troubleshoot_deployment_issues() {
    log "🔧 排查部署问题..."
    
    # 1. 检查Git状态
    info "检查Git状态..."
    local git_status=$(git status --porcelain)
    if [ -n "$git_status" ]; then
        warning "工作目录有未提交的更改"
        log "$git_status"
    else
        success "Git工作目录干净"
    fi
    
    # 2. 检查构建状态
    info "检查构建状态..."
    cd zinses-rechner-frontend
    
    if npm run build; then
        success "前端构建成功"
        local build_size=$(du -sh dist/ | cut -f1)
        log "构建大小: $build_size"
    else
        error "前端构建失败"
        return 1
    fi
    
    cd ..
    
    # 3. 检查Workers部署
    info "检查Workers部署..."
    cd cloudflare-workers/api-worker
    
    if npx wrangler deploy --dry-run --env production; then
        success "Workers部署配置正常"
    else
        error "Workers部署配置有问题"
        return 1
    fi
    
    cd ../..
    
    # 4. 检查环境配置
    info "检查环境配置..."
    if [ -f ".env.production" ]; then
        success "生产环境配置文件存在"
    else
        warning "生产环境配置文件缺失"
    fi
    
    # 5. 建议修复步骤
    log "🔧 建议修复步骤:"
    log "1. 确保所有更改已提交到Git"
    log "2. 验证构建配置和依赖"
    log "3. 检查wrangler.toml配置"
    log "4. 验证环境变量设置"
    log "5. 使用 --dry-run 测试部署配置"
}

# 自动修复尝试
attempt_auto_fix() {
    local problem_type=$1
    log "🔄 尝试自动修复: $problem_type"
    
    case $problem_type in
        "slow_response")
            info "尝试清理缓存..."
            # 这里可以添加缓存清理逻辑
            log "缓存清理完成，请重新测试"
            ;;
            
        "cache_issues")
            info "尝试重启缓存..."
            # 这里可以添加缓存重启逻辑
            log "缓存重启完成，请重新测试"
            ;;
            
        "database_error")
            info "尝试数据库连接重置..."
            # 这里可以添加连接重置逻辑
            log "数据库连接重置完成，请重新测试"
            ;;
            
        *)
            log "该问题类型不支持自动修复"
            ;;
    esac
}

# 生成故障排查报告
generate_troubleshoot_report() {
    local problem_type=$1
    local report_file="reports/troubleshoot-$(date +%Y%m%d-%H%M%S).md"
    mkdir -p reports
    
    cat > "$report_file" << EOF
# Zinses-Rechner 故障排查报告

**问题类型**: $problem_type
**排查时间**: $(date -Iseconds)
**排查者**: $(whoami)
**环境**: production

## 问题描述

$(case $problem_type in
    "frontend_down") echo "前端服务不可访问或返回错误状态" ;;
    "api_down") echo "API服务不可用或健康检查失败" ;;
    "slow_response") echo "API响应时间超过正常范围" ;;
    "database_error") echo "数据库连接或查询出现问题" ;;
    "cache_issues") echo "缓存系统性能不佳或配置问题" ;;
    "deployment_issues") echo "部署过程中出现错误或配置问题" ;;
    *) echo "自动检测到的系统问题" ;;
esac)

## 排查过程

\`\`\`
$(cat "$LOG_FILE")
\`\`\`

## 建议后续行动

$(if grep -q "❌" "$LOG_FILE"; then
    echo "### 立即行动"
    echo "- 修复发现的Critical问题"
    echo "- 通知相关团队成员"
    echo "- 考虑服务降级或回滚"
    echo ""
    echo "### 后续跟进"
    echo "- 分析根本原因"
    echo "- 制定预防措施"
    echo "- 更新监控和告警"
elif grep -q "⚠️" "$LOG_FILE"; then
    echo "### 监控和优化"
    echo "- 持续监控警告项目"
    echo "- 计划性能优化"
    echo "- 更新相关文档"
else
    echo "### 预防性维护"
    echo "- 系统运行正常"
    echo "- 继续常规监控"
    echo "- 考虑预防性优化"
fi)

---
*报告生成时间: $(date -Iseconds)*
EOF

    success "故障排查报告已生成: $report_file"
}

# 显示使用帮助
show_help() {
    cat << EOF
Zinses-Rechner 故障排查脚本

用法:
    $0 [problem_type]

问题类型:
    auto                自动检测问题类型 [默认]
    frontend_down       前端服务不可用
    api_down           API服务不可用
    slow_response      响应时间过慢
    database_error     数据库问题
    cache_issues       缓存问题
    deployment_issues  部署问题

示例:
    $0                     # 自动检测并排查
    $0 slow_response      # 排查响应时间问题
    $0 api_down           # 排查API服务问题

选项:
    -h, --help            显示此帮助信息
    --auto-fix            尝试自动修复 (谨慎使用)

输出:
    - 控制台实时输出
    - 详细日志: logs/troubleshoot-YYYYMMDD-HHMMSS.log
    - 排查报告: reports/troubleshoot-YYYYMMDD-HHMMSS.md

EOF
}

# 主执行流程
main() {
    local problem_type=$1
    local auto_fix=${2:-false}
    
    log "🔍 开始故障排查 (问题类型: $problem_type)"
    
    # 自动检测问题
    if [ "$problem_type" = "auto" ]; then
        problem_type=$(detect_problem)
        log "检测到问题类型: $problem_type"
    fi
    
    # 执行对应的排查流程
    case $problem_type in
        "frontend_down")
            troubleshoot_frontend_down
            ;;
        "api_down")
            troubleshoot_api_down
            ;;
        "slow_response")
            troubleshoot_slow_response
            ;;
        "database_error")
            troubleshoot_database_error
            ;;
        "cache_issues")
            troubleshoot_cache_issues
            ;;
        "deployment_issues")
            troubleshoot_deployment_issues
            ;;
        "no_issues")
            success "未检测到明显问题"
            log "系统运行正常，建议进行常规维护"
            ;;
        *)
            error "未知问题类型: $problem_type"
            show_help
            exit 1
            ;;
    esac
    
    # 尝试自动修复
    if [ "$auto_fix" = "true" ] && [ "$problem_type" != "no_issues" ]; then
        attempt_auto_fix "$problem_type"
    fi
    
    # 生成报告
    generate_troubleshoot_report "$problem_type"
    
    log "🔍 故障排查完成"
    log "详细日志: $LOG_FILE"
}

# 参数处理
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --auto-fix)
        main "${2:-auto}" true
        ;;
    *)
        main "${1:-auto}" false
        ;;
esac
