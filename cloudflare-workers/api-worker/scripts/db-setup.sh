#!/bin/bash

# Cloudflare D1数据库设置和管理脚本
# 自动化数据库创建、迁移和管理

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

# 检查Wrangler CLI
check_wrangler() {
    log_info "检查Wrangler CLI..."
    
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler CLI未安装"
        log_info "请运行: npm install -g wrangler"
        exit 1
    fi
    
    # 检查登录状态
    if ! wrangler whoami &> /dev/null; then
        log_error "未登录Cloudflare账户"
        log_info "请运行: wrangler login"
        exit 1
    fi
    
    log_success "Wrangler CLI检查通过"
}

# 创建数据库
create_database() {
    local env=${1:-"development"}
    local db_name="zinses-rechner-${env}"
    
    log_info "创建D1数据库: $db_name"
    
    # 检查数据库是否已存在
    if wrangler d1 list | grep -q "$db_name"; then
        log_warning "数据库 $db_name 已存在"
        return 0
    fi
    
    # 创建新数据库
    wrangler d1 create "$db_name"
    log_success "数据库 $db_name 创建完成"
    
    # 获取数据库ID
    DB_ID=$(wrangler d1 list | grep "$db_name" | awk '{print $2}')
    log_info "数据库ID: $DB_ID"
    
    # 更新wrangler.toml配置
    update_wrangler_config "$env" "$db_name" "$DB_ID"
}

# 更新wrangler.toml配置
update_wrangler_config() {
    local env=$1
    local db_name=$2
    local db_id=$3
    
    log_info "更新wrangler.toml配置..."
    
    # 备份原配置
    cp wrangler.toml wrangler.toml.backup
    
    # 更新数据库ID
    sed -i.tmp "s/database_id = \"your-database-id\"/database_id = \"$db_id\"/" wrangler.toml
    sed -i.tmp "s/database_name = \"zinses-rechner-prod\"/database_name = \"$db_name\"/" wrangler.toml
    
    # 清理临时文件
    rm -f wrangler.toml.tmp
    
    log_success "wrangler.toml配置已更新"
}

# 运行数据库迁移
run_migrations() {
    local env=${1:-"development"}
    local db_name="zinses-rechner-${env}"
    
    log_info "运行数据库迁移: $db_name"
    
    # 检查迁移文件
    if [ ! -f "migrations/001_initial_schema.sql" ]; then
        log_error "迁移文件不存在: migrations/001_initial_schema.sql"
        exit 1
    fi
    
    # 执行迁移
    wrangler d1 execute "$db_name" --file=migrations/001_initial_schema.sql
    log_success "数据库迁移完成"
}

# 插入种子数据
seed_database() {
    local env=${1:-"development"}
    local db_name="zinses-rechner-${env}"
    
    log_info "插入种子数据: $db_name"
    
    # 创建种子数据SQL
    cat > temp_seed.sql << EOF
-- 插入系统配置种子数据
INSERT OR IGNORE INTO system_config (config_key, config_value, config_type, description) VALUES
('app_version', '1.0.0', 'string', '应用版本号'),
('maintenance_mode', 'false', 'boolean', '维护模式开关'),
('feature_tax_calculation', 'true', 'boolean', '税务计算功能'),
('feature_export_pdf', 'true', 'boolean', 'PDF导出功能'),
('max_calculation_years', '50', 'number', '最大计算年限'),
('max_principal_amount', '10000000', 'number', '最大本金金额'),
('default_tax_rate', '0.25', 'number', '默认税率'),
('cache_ttl_seconds', '300', 'number', '缓存过期时间'),
('rate_limit_requests', '100', 'number', '速率限制请求数'),
('rate_limit_window_seconds', '900', 'number', '速率限制时间窗口');

-- 插入初始缓存统计
INSERT OR IGNORE INTO cache_stats (date_key, hit_count, miss_count, total_requests, hit_rate_percent) VALUES
(date('now'), 0, 0, 0, 0.0);

-- 插入测试计算历史（仅开发环境）
EOF

    if [ "$env" = "development" ]; then
        cat >> temp_seed.sql << EOF
INSERT OR IGNORE INTO calculation_history 
(session_id, principal, annual_rate, years, monthly_payment, final_amount, total_contributions, total_interest, annual_return, created_at) VALUES
('test-session-1', 10000, 4.0, 10, 500, 75624.32, 70000, 5624.32, 4.2, datetime('now', '-1 day')),
('test-session-2', 25000, 3.5, 15, 300, 89456.78, 79000, 10456.78, 3.8, datetime('now', '-2 hours')),
('test-session-3', 5000, 5.0, 5, 200, 18394.56, 17000, 1394.56, 5.2, datetime('now', '-30 minutes'));
EOF
    fi
    
    # 执行种子数据插入
    wrangler d1 execute "$db_name" --file=temp_seed.sql
    
    # 清理临时文件
    rm -f temp_seed.sql
    
    log_success "种子数据插入完成"
}

# 验证数据库
verify_database() {
    local env=${1:-"development"}
    local db_name="zinses-rechner-${env}"
    
    log_info "验证数据库: $db_name"
    
    # 检查表结构
    log_info "检查表结构..."
    wrangler d1 execute "$db_name" --command="SELECT name FROM sqlite_master WHERE type='table';"
    
    # 检查系统配置
    log_info "检查系统配置..."
    wrangler d1 execute "$db_name" --command="SELECT COUNT(*) as config_count FROM system_config;"
    
    # 检查缓存统计
    log_info "检查缓存统计..."
    wrangler d1 execute "$db_name" --command="SELECT COUNT(*) as cache_stats_count FROM cache_stats;"
    
    if [ "$env" = "development" ]; then
        # 检查测试数据
        log_info "检查测试数据..."
        wrangler d1 execute "$db_name" --command="SELECT COUNT(*) as test_calculations FROM calculation_history;"
    fi
    
    log_success "数据库验证完成"
}

# 备份数据库
backup_database() {
    local env=${1:-"development"}
    local db_name="zinses-rechner-${env}"
    local backup_file="backup_${db_name}_$(date +%Y%m%d_%H%M%S).sql"
    
    log_info "备份数据库: $db_name"
    
    # 导出数据库
    wrangler d1 export "$db_name" --output="$backup_file"
    
    log_success "数据库备份完成: $backup_file"
}

# 恢复数据库
restore_database() {
    local env=${1:-"development"}
    local backup_file=$2
    local db_name="zinses-rechner-${env}"
    
    if [ -z "$backup_file" ]; then
        log_error "请指定备份文件"
        log_info "使用方法: $0 restore <environment> <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log_warning "恢复数据库将覆盖现有数据，确认继续？ (y/N)"
    read -r confirmation
    if [[ $confirmation != [yY] ]]; then
        log_info "恢复操作已取消"
        exit 0
    fi
    
    log_info "恢复数据库: $db_name"
    
    # 执行恢复
    wrangler d1 execute "$db_name" --file="$backup_file"
    
    log_success "数据库恢复完成"
}

# 清理数据库
cleanup_database() {
    local env=${1:-"development"}
    local db_name="zinses-rechner-${env}"
    
    log_warning "清理数据库将删除所有数据，确认继续？ (y/N)"
    read -r confirmation
    if [[ $confirmation != [yY] ]]; then
        log_info "清理操作已取消"
        exit 0
    fi
    
    log_info "清理数据库: $db_name"
    
    # 删除所有表数据
    wrangler d1 execute "$db_name" --command="DELETE FROM calculation_history;"
    wrangler d1 execute "$db_name" --command="DELETE FROM monitoring_metrics;"
    wrangler d1 execute "$db_name" --command="DELETE FROM alert_history;"
    wrangler d1 execute "$db_name" --command="DELETE FROM error_logs;"
    wrangler d1 execute "$db_name" --command="DELETE FROM api_usage_stats;"
    wrangler d1 execute "$db_name" --command="DELETE FROM user_sessions;"
    
    # 重置缓存统计
    wrangler d1 execute "$db_name" --command="UPDATE cache_stats SET hit_count=0, miss_count=0, total_requests=0, hit_rate_percent=0.0;"
    
    log_success "数据库清理完成"
}

# 显示数据库统计
show_stats() {
    local env=${1:-"development"}
    local db_name="zinses-rechner-${env}"
    
    log_info "数据库统计: $db_name"
    
    echo ""
    echo "📊 表记录统计:"
    wrangler d1 execute "$db_name" --command="
        SELECT 
            'calculation_history' as table_name, 
            COUNT(*) as record_count 
        FROM calculation_history
        UNION ALL
        SELECT 
            'monitoring_metrics' as table_name, 
            COUNT(*) as record_count 
        FROM monitoring_metrics
        UNION ALL
        SELECT 
            'system_config' as table_name, 
            COUNT(*) as record_count 
        FROM system_config
        UNION ALL
        SELECT 
            'user_sessions' as table_name, 
            COUNT(*) as record_count 
        FROM user_sessions;
    "
    
    echo ""
    echo "📈 最近24小时统计:"
    wrangler d1 execute "$db_name" --command="
        SELECT 
            COUNT(*) as calculations_24h,
            AVG(final_amount) as avg_final_amount,
            MAX(final_amount) as max_final_amount
        FROM calculation_history 
        WHERE created_at >= datetime('now', '-1 day');
    "
}

# 主函数
main() {
    local command=${1:-"help"}
    local env=${2:-"development"}
    
    case $command in
        "setup")
            log_info "🚀 设置Cloudflare D1数据库"
            check_wrangler
            create_database "$env"
            run_migrations "$env"
            seed_database "$env"
            verify_database "$env"
            log_success "🎉 数据库设置完成！"
            ;;
        "migrate")
            log_info "🔄 运行数据库迁移"
            check_wrangler
            run_migrations "$env"
            verify_database "$env"
            ;;
        "seed")
            log_info "🌱 插入种子数据"
            check_wrangler
            seed_database "$env"
            ;;
        "verify")
            log_info "✅ 验证数据库"
            check_wrangler
            verify_database "$env"
            ;;
        "backup")
            log_info "💾 备份数据库"
            check_wrangler
            backup_database "$env"
            ;;
        "restore")
            log_info "🔄 恢复数据库"
            check_wrangler
            restore_database "$env" "$3"
            ;;
        "cleanup")
            log_info "🧹 清理数据库"
            check_wrangler
            cleanup_database "$env"
            ;;
        "stats")
            log_info "📊 数据库统计"
            check_wrangler
            show_stats "$env"
            ;;
        "help"|*)
            echo "Zinses-Rechner数据库管理工具"
            echo ""
            echo "使用方法:"
            echo "  $0 <command> [environment] [options]"
            echo ""
            echo "命令:"
            echo "  setup      - 完整设置数据库（创建、迁移、种子数据）"
            echo "  migrate    - 运行数据库迁移"
            echo "  seed       - 插入种子数据"
            echo "  verify     - 验证数据库结构和数据"
            echo "  backup     - 备份数据库"
            echo "  restore    - 恢复数据库 (需要备份文件路径)"
            echo "  cleanup    - 清理数据库数据"
            echo "  stats      - 显示数据库统计"
            echo "  help       - 显示此帮助信息"
            echo ""
            echo "环境:"
            echo "  development (默认)"
            echo "  preview"
            echo "  production"
            echo ""
            echo "示例:"
            echo "  $0 setup development"
            echo "  $0 migrate production"
            echo "  $0 backup production"
            echo "  $0 restore development backup_file.sql"
            ;;
    esac
}

# 错误处理
trap 'log_error "数据库操作过程中发生错误，请检查日志"; exit 1' ERR

# 执行主流程
main "$@"
