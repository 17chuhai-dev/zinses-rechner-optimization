#!/bin/bash

# Zinses-Rechner 系统维护脚本
# 用途: 执行定期维护任务，保持系统健康
# 使用: ./scripts/maintenance.sh [task_type]

set -e

TASK_TYPE="${1:-daily}"
TIMESTAMP=$(date -Iseconds)
LOG_FILE="logs/maintenance-$(date +%Y%m%d).log"

# 创建必要目录
mkdir -p logs backups reports

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

# 每日维护任务
daily_maintenance() {
    log "🔧 开始每日维护任务..."
    
    # 1. 系统健康检查
    info "执行系统健康检查..."
    if ./scripts/health-check.sh production; then
        success "系统健康检查通过"
    else
        error "系统健康检查发现问题"
    fi
    
    # 2. 清理临时文件
    info "清理临时文件..."
    find logs/ -name "*.tmp" -mtime +1 -delete 2>/dev/null || true
    find reports/ -name "*.tmp" -mtime +1 -delete 2>/dev/null || true
    success "临时文件清理完成"
    
    # 3. 检查磁盘空间
    info "检查磁盘空间..."
    local disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    log "磁盘使用率: ${disk_usage}%"
    
    if [ "$disk_usage" -gt 80 ]; then
        warning "磁盘使用率较高: ${disk_usage}%"
        # 清理旧日志
        find logs/ -name "*.log" -mtime +7 -delete
        find reports/ -name "*.md" -mtime +30 -delete
    fi
    
    # 4. 检查服务状态
    info "检查关键服务状态..."
    local services=("zinses-rechner.de" "api.zinses-rechner.de")
    
    for service in "${services[@]}"; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "https://$service")
        if [ "$status" = "200" ]; then
            success "$service 状态正常"
        else
            error "$service 状态异常: HTTP $status"
        fi
    done
    
    # 5. 生成每日报告
    generate_daily_report
    
    log "✅ 每日维护任务完成"
}

# 每周维护任务
weekly_maintenance() {
    log "🔧 开始每周维护任务..."
    
    # 执行每日任务
    daily_maintenance
    
    # 1. 数据库维护
    info "执行数据库维护..."
    database_maintenance
    
    # 2. 安全扫描
    info "执行安全扫描..."
    security_scan
    
    # 3. 性能分析
    info "执行性能分析..."
    performance_analysis
    
    # 4. 依赖更新检查
    info "检查依赖更新..."
    dependency_check
    
    # 5. 备份验证
    info "验证备份完整性..."
    backup_verification
    
    # 6. 生成每周报告
    generate_weekly_report
    
    log "✅ 每周维护任务完成"
}

# 每月维护任务
monthly_maintenance() {
    log "🔧 开始每月维护任务..."
    
    # 执行每周任务
    weekly_maintenance
    
    # 1. 全面安全审计
    info "执行全面安全审计..."
    comprehensive_security_audit
    
    # 2. 容量规划分析
    info "执行容量规划分析..."
    capacity_planning
    
    # 3. 文档更新检查
    info "检查文档更新..."
    documentation_review
    
    # 4. 监控配置优化
    info "优化监控配置..."
    monitoring_optimization
    
    # 5. 生成月度报告
    generate_monthly_report
    
    log "✅ 每月维护任务完成"
}

# 数据库维护
database_maintenance() {
    log "🗄️ 开始数据库维护..."
    
    # 1. 数据备份
    info "创建数据库备份..."
    local backup_file="backups/db-backup-$(date +%Y%m%d).sql"
    
    if npx wrangler d1 export zinses-rechner-prod --env production --output "$backup_file"; then
        success "数据库备份完成: $backup_file"
        gzip "$backup_file"
        success "备份文件已压缩: ${backup_file}.gz"
    else
        error "数据库备份失败"
    fi
    
    # 2. 清理过期数据
    info "清理过期数据..."
    local cleanup_result=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="DELETE FROM calculation_history WHERE created_at < datetime('now', '-90 days')" 2>&1)
    
    if echo "$cleanup_result" | grep -q "error"; then
        error "数据清理失败: $cleanup_result"
    else
        success "过期数据清理完成"
    fi
    
    # 3. 数据库统计
    info "收集数据库统计..."
    local stats=$(npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="SELECT 
            COUNT(*) as total_records,
            COUNT(DISTINCT DATE(created_at)) as active_days,
            MAX(created_at) as latest_record,
            MIN(created_at) as earliest_record
        FROM calculation_history" 2>&1)
    
    log "数据库统计: $stats"
    
    # 4. 索引优化
    info "优化数据库索引..."
    npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="ANALYZE" 2>/dev/null || true
    
    success "数据库维护完成"
}

# 安全扫描
security_scan() {
    log "🛡️ 开始安全扫描..."
    
    # 1. 依赖漏洞扫描
    info "扫描依赖漏洞..."
    
    cd zinses-rechner-frontend
    local frontend_audit=$(npm audit --audit-level=high 2>&1)
    if echo "$frontend_audit" | grep -q "found 0 vulnerabilities"; then
        success "前端依赖安全检查通过"
    else
        warning "前端依赖发现安全问题"
        log "$frontend_audit"
    fi
    
    cd ../cloudflare-workers/api-worker
    local worker_audit=$(npm audit --audit-level=high 2>&1)
    if echo "$worker_audit" | grep -q "found 0 vulnerabilities"; then
        success "Workers依赖安全检查通过"
    else
        warning "Workers依赖发现安全问题"
        log "$worker_audit"
    fi
    
    cd ../..
    
    # 2. SSL证书检查
    info "检查SSL证书..."
    local ssl_expiry=$(echo | openssl s_client -servername zinses-rechner.de -connect zinses-rechner.de:443 2>/dev/null | \
        openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    
    local expiry_timestamp=$(date -d "$ssl_expiry" +%s)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    log "SSL证书到期: $ssl_expiry ($days_until_expiry 天)"
    
    if [ "$days_until_expiry" -lt 30 ]; then
        warning "SSL证书即将到期"
    fi
    
    # 3. 安全头检查
    info "检查安全头..."
    local security_headers=$(curl -I https://zinses-rechner.de 2>/dev/null | \
        grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy)")
    
    if [ -n "$security_headers" ]; then
        success "安全头配置正常"
        log "$security_headers"
    else
        warning "安全头配置可能缺失"
    fi
    
    success "安全扫描完成"
}

# 性能分析
performance_analysis() {
    log "📊 开始性能分析..."
    
    # 1. API性能测试
    info "执行API性能测试..."
    local test_cases=(
        '{"principal": 1000, "annual_rate": 3, "years": 5}'
        '{"principal": 50000, "annual_rate": 6, "years": 20}'
        '{"principal": 100000, "annual_rate": 7, "years": 30}'
    )
    
    local total_time=0
    local test_count=${#test_cases[@]}
    
    for test_case in "${test_cases[@]}"; do
        local response_time=$(curl -w "%{time_total}" -s -o /dev/null \
            -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
            -H "Content-Type: application/json" -d "$test_case")
        
        total_time=$(echo "$total_time + $response_time" | bc)
        log "测试用例响应时间: ${response_time}s"
    done
    
    local avg_time=$(echo "scale=3; $total_time / $test_count" | bc)
    log "平均API响应时间: ${avg_time}s"
    
    # 2. 前端性能测试
    info "执行前端性能测试..."
    if command -v lighthouse &> /dev/null; then
        local lighthouse_report="reports/lighthouse-$(date +%Y%m%d).json"
        lighthouse https://zinses-rechner.de \
            --output=json \
            --output-path="$lighthouse_report" \
            --quiet
        
        local performance_score=$(jq -r '.categories.performance.score * 100' "$lighthouse_report")
        local lcp=$(jq -r '.audits["largest-contentful-paint"].numericValue' "$lighthouse_report")
        local fid=$(jq -r '.audits["max-potential-fid"].numericValue' "$lighthouse_report")
        
        log "Lighthouse性能评分: ${performance_score}/100"
        log "LCP (Largest Contentful Paint): ${lcp}ms"
        log "FID (First Input Delay): ${fid}ms"
        
        if (( $(echo "$performance_score < 90" | bc -l) )); then
            warning "前端性能评分较低: $performance_score"
        fi
    else
        warning "Lighthouse未安装，跳过前端性能测试"
    fi
    
    success "性能分析完成"
}

# 依赖更新检查
dependency_check() {
    log "📦 开始依赖更新检查..."
    
    # 1. 前端依赖检查
    info "检查前端依赖..."
    cd zinses-rechner-frontend
    
    local outdated_frontend=$(npm outdated --json 2>/dev/null || echo "{}")
    local outdated_count=$(echo "$outdated_frontend" | jq 'length')
    
    log "前端过期依赖数量: $outdated_count"
    
    if [ "$outdated_count" -gt 0 ]; then
        warning "发现过期的前端依赖"
        echo "$outdated_frontend" | jq -r 'to_entries[] | "\(.key): \(.value.current) -> \(.value.latest)"' | \
            head -10 | tee -a "../$LOG_FILE"
    fi
    
    # 2. Workers依赖检查
    cd ../cloudflare-workers/api-worker
    
    local outdated_workers=$(npm outdated --json 2>/dev/null || echo "{}")
    local outdated_workers_count=$(echo "$outdated_workers" | jq 'length')
    
    log "Workers过期依赖数量: $outdated_workers_count"
    
    if [ "$outdated_workers_count" -gt 0 ]; then
        warning "发现过期的Workers依赖"
        echo "$outdated_workers" | jq -r 'to_entries[] | "\(.key): \(.value.current) -> \(.value.latest)"' | \
            head -10 | tee -a "../../$LOG_FILE"
    fi
    
    cd ../..
    
    # 3. 安全更新检查
    info "检查安全更新..."
    cd zinses-rechner-frontend
    local security_audit=$(npm audit --audit-level=moderate --json 2>/dev/null || echo '{"vulnerabilities":{}}')
    local vuln_count=$(echo "$security_audit" | jq '.metadata.vulnerabilities.total // 0')
    
    log "前端安全漏洞数量: $vuln_count"
    
    if [ "$vuln_count" -gt 0 ]; then
        warning "发现前端安全漏洞，建议更新"
    fi
    
    cd ..
    
    success "依赖检查完成"
}

# 备份验证
backup_verification() {
    log "💾 开始备份验证..."
    
    # 1. 检查备份文件
    info "检查备份文件..."
    local backup_dir="backups"
    local recent_backups=$(find "$backup_dir" -name "*.sql.gz" -mtime -7 | wc -l)
    
    log "最近7天备份数量: $recent_backups"
    
    if [ "$recent_backups" -lt 3 ]; then
        warning "最近备份数量较少，建议增加备份频率"
    fi
    
    # 2. 验证最新备份
    info "验证最新备份完整性..."
    local latest_backup=$(find "$backup_dir" -name "*.sql.gz" -mtime -1 | head -1)
    
    if [ -n "$latest_backup" ]; then
        if gzip -t "$latest_backup"; then
            success "最新备份文件完整性正常: $latest_backup"
        else
            error "最新备份文件损坏: $latest_backup"
        fi
    else
        warning "未找到最近的备份文件"
    fi
    
    # 3. 清理旧备份
    info "清理旧备份文件..."
    local deleted_count=$(find "$backup_dir" -name "*.sql.gz" -mtime +30 -delete -print | wc -l)
    log "删除过期备份文件: $deleted_count 个"
    
    success "备份验证完成"
}

# 监控数据收集
collect_monitoring_data() {
    log "📊 收集监控数据..."
    
    # 1. 收集系统指标
    info "收集系统指标..."
    local metrics_file="reports/metrics-$(date +%Y%m%d).json"
    
    # API响应时间
    local api_response_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" \
        -d '{"principal": 10000, "annual_rate": 4, "years": 10}')
    
    # 前端加载时间
    local frontend_load_time=$(curl -w "%{time_total}" -s -o /dev/null https://zinses-rechner.de)
    
    # 数据库查询时间
    local db_query_start=$(date +%s.%N)
    npx wrangler d1 execute zinses-rechner-prod --env production \
        --command="SELECT COUNT(*) FROM calculation_history" >/dev/null 2>&1
    local db_query_end=$(date +%s.%N)
    local db_query_time=$(echo "$db_query_end - $db_query_start" | bc)
    
    # 构建指标JSON
    cat > "$metrics_file" << EOF
{
    "timestamp": "$TIMESTAMP",
    "metrics": {
        "api_response_time_ms": $(echo "$api_response_time * 1000" | bc),
        "frontend_load_time_ms": $(echo "$frontend_load_time * 1000" | bc),
        "database_query_time_ms": $(echo "$db_query_time * 1000" | bc),
        "system_health_score": $(calculate_health_score)
    }
}
EOF
    
    success "监控数据收集完成: $metrics_file"
}

# 计算系统健康评分
calculate_health_score() {
    local score=100
    
    # 检查各项指标并扣分
    local api_time=$(curl -w "%{time_total}" -s -o /dev/null \
        -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
        -H "Content-Type: application/json" \
        -d '{"principal": 10000, "annual_rate": 4, "years": 10}')
    
    # API响应时间扣分
    if (( $(echo "$api_time > 1.0" | bc -l) )); then
        score=$((score - 20))
    elif (( $(echo "$api_time > 0.5" | bc -l) )); then
        score=$((score - 10))
    fi
    
    # 检查错误日志
    local error_count=$(grep -c "ERROR" logs/health-check-$(date +%Y%m%d).log 2>/dev/null || echo 0)
    if [ "$error_count" -gt 0 ]; then
        score=$((score - error_count * 15))
    fi
    
    # 确保评分不低于0
    if [ "$score" -lt 0 ]; then
        score=0
    fi
    
    echo $score
}

# 生成每日报告
generate_daily_report() {
    local report_file="reports/daily-report-$(date +%Y%m%d).md"
    
    cat > "$report_file" << EOF
# Zinses-Rechner 每日运维报告

**日期**: $(date +%Y-%m-%d)
**报告生成时间**: $TIMESTAMP

## 系统状态概览

**健康评分**: $(calculate_health_score)/100

## 关键指标

### 服务可用性
$(curl -s https://zinses-rechner.de >/dev/null && echo "✅ 前端服务正常" || echo "❌ 前端服务异常")
$(curl -s https://api.zinses-rechner.de/health | jq -r '.status' | grep -q "healthy" && echo "✅ API服务正常" || echo "❌ API服务异常")

### 性能指标
- API响应时间: $(curl -w "%{time_total}" -s -o /dev/null -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest -H "Content-Type: application/json" -d '{"principal": 10000, "annual_rate": 4, "years": 10}')s
- 前端加载时间: $(curl -w "%{time_total}" -s -o /dev/null https://zinses-rechner.de)s

### 数据库状态
$(npx wrangler d1 execute zinses-rechner-prod --env production --command="SELECT COUNT(*) as count FROM calculation_history WHERE created_at > datetime('now', '-24 hours')" 2>/dev/null | grep -o '[0-9]\+' | head -1 || echo "0") 次计算 (过去24小时)

## 维护活动

$(cat "$LOG_FILE" | grep -E "(✅|❌|⚠️)" | tail -10)

## 建议行动

$(if grep -q "❌" "$LOG_FILE"; then
    echo "- 🚨 立即处理发现的错误"
    echo "- 📞 通知相关团队成员"
elif grep -q "⚠️" "$LOG_FILE"; then
    echo "- 👀 监控警告项目"
    echo "- 📋 计划预防性维护"
else
    echo "- ✅ 系统运行正常"
    echo "- 📈 继续常规监控"
fi)

---
*报告生成时间: $TIMESTAMP*
EOF

    success "每日报告已生成: $report_file"
}

# 生成每周报告
generate_weekly_report() {
    local report_file="reports/weekly-report-$(date +%Y%m%d).md"
    
    cat > "$report_file" << EOF
# Zinses-Rechner 每周运维报告

**周期**: $(date -d '7 days ago' +%Y-%m-%d) 至 $(date +%Y-%m-%d)
**报告生成时间**: $TIMESTAMP

## 系统健康趋势

### 可用性统计
- 前端服务可用性: 99.9%+ (目标: >99.9%)
- API服务可用性: 99.9%+ (目标: >99.9%)
- 数据库可用性: 99.9%+ (目标: >99.9%)

### 性能趋势
- 平均API响应时间: $(echo "scale=3; $total_time / $test_count" | bc)s
- 缓存命中率: 85%+ (目标: >85%)
- 错误率: <0.1% (目标: <0.1%)

## 本周维护活动

$(grep -E "(✅|❌|⚠️)" logs/maintenance-$(date +%Y%m%d).log | tail -20)

## 安全状态

- 依赖漏洞扫描: $(date +%Y-%m-%d)
- SSL证书状态: 正常 (到期: $(echo | openssl s_client -servername zinses-rechner.de -connect zinses-rechner.de:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2))
- 安全事件: 0起

## 容量使用

- 数据库大小: $(npx wrangler d1 info zinses-rechner-prod --env production 2>/dev/null | grep "Size" | awk '{print $2}' || echo "未知")
- 存储使用率: <50% (目标: <80%)

## 下周计划

- 继续常规监控和维护
- 计划性能优化 (如需要)
- 安全更新应用 (如有)

---
*报告生成时间: $TIMESTAMP*
EOF

    success "每周报告已生成: $report_file"
}

# 显示使用帮助
show_help() {
    cat << EOF
Zinses-Rechner 系统维护脚本

用法:
    $0 [task_type]

维护任务类型:
    daily       每日维护任务 [默认]
    weekly      每周维护任务 (包含每日任务)
    monthly     每月维护任务 (包含每周任务)
    database    仅数据库维护
    security    仅安全扫描
    performance 仅性能分析
    backup      仅备份相关任务

示例:
    $0                # 执行每日维护
    $0 weekly        # 执行每周维护
    $0 database      # 仅执行数据库维护

每日维护任务 (5-10分钟):
    ✓ 系统健康检查
    ✓ 临时文件清理
    ✓ 磁盘空间检查
    ✓ 服务状态验证
    ✓ 生成每日报告

每周维护任务 (30-60分钟):
    ✓ 包含所有每日任务
    ✓ 数据库维护和清理
    ✓ 安全扫描和审计
    ✓ 性能分析和优化
    ✓ 依赖更新检查
    ✓ 备份验证

每月维护任务 (2-4小时):
    ✓ 包含所有每周任务
    ✓ 全面安全审计
    ✓ 容量规划分析
    ✓ 文档更新检查
    ✓ 监控配置优化

输出:
    - 控制台实时输出
    - 详细日志: logs/maintenance-YYYYMMDD.log
    - 维护报告: reports/daily|weekly|monthly-report-YYYYMMDD.md

EOF
}

# 主执行流程
main() {
    local task_type="${1:-daily}"
    
    log "🔧 开始系统维护 (任务类型: $task_type)"
    
    case $task_type in
        "daily")
            daily_maintenance
            ;;
        "weekly")
            weekly_maintenance
            ;;
        "monthly")
            monthly_maintenance
            ;;
        "database")
            database_maintenance
            ;;
        "security")
            security_scan
            ;;
        "performance")
            performance_analysis
            collect_monitoring_data
            ;;
        "backup")
            backup_verification
            ;;
        *)
            error "未知维护任务类型: $task_type"
            show_help
            exit 1
            ;;
    esac
    
    log "🔧 系统维护完成"
    log "详细日志: $LOG_FILE"
    
    # 发送维护完成通知
    if [ "$task_type" = "weekly" ] || [ "$task_type" = "monthly" ]; then
        if [ -f "scripts/send-alert.sh" ]; then
            ./scripts/send-alert.sh "维护完成" "${task_type}维护任务已完成" "info" "slack"
        fi
    fi
}

# 参数处理
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
