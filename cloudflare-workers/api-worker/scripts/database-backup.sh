#!/bin/bash

# Zinses-Rechner 数据库备份脚本
# 用途: 自动化数据库备份和恢复操作
# 使用: ./scripts/database-backup.sh [backup|restore|migrate] [environment]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_DIR/backups/database"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 日志函数
log() {
    echo "[$(date -Iseconds)] $1"
}

error() {
    echo "[$(date -Iseconds)] ❌ $1" >&2
}

success() {
    echo "[$(date -Iseconds)] ✅ $1"
}

# 显示使用帮助
show_help() {
    cat << EOF
Zinses-Rechner 数据库管理脚本

用法:
    $0 backup [environment]     - 备份数据库
    $0 restore [backup_file]    - 恢复数据库
    $0 migrate [environment]    - 执行数据库迁移
    $0 cleanup [days]           - 清理旧备份文件
    $0 status [environment]     - 检查数据库状态

环境:
    development    - 开发环境
    preview        - 预览环境  
    production     - 生产环境

示例:
    $0 backup production
    $0 restore backups/database/backup_20240115_143022.sql
    $0 migrate development
    $0 cleanup 30
    $0 status production

EOF
}

# 备份数据库
backup_database() {
    local env=${1:-development}
    local backup_file="$BACKUP_DIR/backup_${env}_${TIMESTAMP}.sql"
    
    log "开始备份数据库 (环境: $env)"
    
    # 检查wrangler配置
    if [ ! -f "$PROJECT_DIR/wrangler.toml" ]; then
        error "未找到wrangler.toml配置文件"
        exit 1
    fi
    
    # 获取数据库名称
    local db_name=$(grep -A 10 "\[env\.$env\]" "$PROJECT_DIR/wrangler.toml" | grep -E "database_name|name" | head -1 | cut -d'"' -f2)
    
    if [ -z "$db_name" ]; then
        error "无法从wrangler.toml获取数据库名称"
        exit 1
    fi
    
    log "数据库名称: $db_name"
    
    # 导出数据库结构和数据
    log "导出数据库结构..."
    
    # 创建备份SQL文件
    cat > "$backup_file" << EOF
-- Zinses-Rechner 数据库备份
-- 环境: $env
-- 时间: $(date -Iseconds)
-- 数据库: $db_name

-- 禁用外键约束检查
PRAGMA foreign_keys = OFF;

EOF
    
    # 导出表结构
    log "导出表结构..."
    npx wrangler d1 execute "$db_name" --env="$env" --command=".schema" >> "$backup_file" 2>/dev/null || {
        error "导出表结构失败"
        exit 1
    }
    
    # 导出数据
    log "导出数据..."
    local tables=("calculation_history" "monitoring_metrics" "system_config" "cache_stats" "user_sessions" "error_logs" "api_usage_stats" "alert_history")
    
    for table in "${tables[@]}"; do
        log "导出表: $table"
        echo "" >> "$backup_file"
        echo "-- 表数据: $table" >> "$backup_file"
        npx wrangler d1 execute "$db_name" --env="$env" --command=".dump $table" >> "$backup_file" 2>/dev/null || {
            log "警告: 表 $table 导出失败，可能不存在"
        }
    done
    
    # 重新启用外键约束检查
    cat >> "$backup_file" << EOF

-- 重新启用外键约束检查
PRAGMA foreign_keys = ON;

-- 备份完成时间: $(date -Iseconds)
EOF
    
    # 压缩备份文件
    log "压缩备份文件..."
    gzip "$backup_file"
    backup_file="${backup_file}.gz"
    
    local file_size=$(du -h "$backup_file" | cut -f1)
    success "数据库备份完成: $backup_file (大小: $file_size)"
    
    # 验证备份文件
    if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
        success "备份文件验证通过"
    else
        error "备份文件验证失败"
        exit 1
    fi
    
    # 清理旧备份（保留最近10个）
    log "清理旧备份文件..."
    ls -t "$BACKUP_DIR"/backup_${env}_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    
    success "数据库备份流程完成"
}

# 恢复数据库
restore_database() {
    local backup_file="$1"
    local env=${2:-development}
    
    if [ -z "$backup_file" ]; then
        error "请指定备份文件路径"
        show_help
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log "开始恢复数据库 (环境: $env, 备份文件: $backup_file)"
    
    # 获取数据库名称
    local db_name=$(grep -A 10 "\[env\.$env\]" "$PROJECT_DIR/wrangler.toml" | grep -E "database_name|name" | head -1 | cut -d'"' -f2)
    
    if [ -z "$db_name" ]; then
        error "无法从wrangler.toml获取数据库名称"
        exit 1
    fi
    
    # 确认操作
    echo "⚠️  警告: 此操作将覆盖现有数据库数据"
    echo "数据库: $db_name (环境: $env)"
    echo "备份文件: $backup_file"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "操作已取消"
        exit 0
    fi
    
    # 解压备份文件（如果需要）
    local sql_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        log "解压备份文件..."
        sql_file="${backup_file%.gz}"
        gunzip -c "$backup_file" > "$sql_file"
    fi
    
    # 执行恢复
    log "执行数据库恢复..."
    npx wrangler d1 execute "$db_name" --env="$env" --file="$sql_file" || {
        error "数据库恢复失败"
        exit 1
    }
    
    # 清理临时文件
    if [[ "$backup_file" == *.gz ]] && [ -f "$sql_file" ]; then
        rm -f "$sql_file"
    fi
    
    success "数据库恢复完成"
}

# 执行数据库迁移
migrate_database() {
    local env=${1:-development}
    
    log "开始执行数据库迁移 (环境: $env)"
    
    # 获取数据库名称
    local db_name=$(grep -A 10 "\[env\.$env\]" "$PROJECT_DIR/wrangler.toml" | grep -E "database_name|name" | head -1 | cut -d'"' -f2)
    
    if [ -z "$db_name" ]; then
        error "无法从wrangler.toml获取数据库名称"
        exit 1
    fi
    
    # 执行迁移文件
    local migration_dir="$PROJECT_DIR/migrations"
    
    if [ ! -d "$migration_dir" ]; then
        error "迁移目录不存在: $migration_dir"
        exit 1
    fi
    
    # 按顺序执行迁移文件
    for migration_file in "$migration_dir"/*.sql; do
        if [ -f "$migration_file" ]; then
            local filename=$(basename "$migration_file")
            log "执行迁移: $filename"
            
            npx wrangler d1 execute "$db_name" --env="$env" --file="$migration_file" || {
                error "迁移失败: $filename"
                exit 1
            }
            
            success "迁移完成: $filename"
        fi
    done
    
    success "所有数据库迁移执行完成"
}

# 清理旧备份文件
cleanup_backups() {
    local days=${1:-30}
    
    log "清理 $days 天前的备份文件..."
    
    local deleted_count=0
    
    # 查找并删除旧文件
    while IFS= read -r -d '' file; do
        rm -f "$file"
        deleted_count=$((deleted_count + 1))
        log "删除: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$days -print0 2>/dev/null)
    
    if [ $deleted_count -eq 0 ]; then
        log "没有找到需要清理的备份文件"
    else
        success "清理完成，删除了 $deleted_count 个备份文件"
    fi
}

# 检查数据库状态
check_database_status() {
    local env=${1:-development}
    
    log "检查数据库状态 (环境: $env)"
    
    # 获取数据库名称
    local db_name=$(grep -A 10 "\[env\.$env\]" "$PROJECT_DIR/wrangler.toml" | grep -E "database_name|name" | head -1 | cut -d'"' -f2)
    
    if [ -z "$db_name" ]; then
        error "无法从wrangler.toml获取数据库名称"
        exit 1
    fi
    
    log "数据库名称: $db_name"
    
    # 检查数据库连接
    log "测试数据库连接..."
    npx wrangler d1 execute "$db_name" --env="$env" --command="SELECT 1 as test;" > /dev/null 2>&1 && {
        success "数据库连接正常"
    } || {
        error "数据库连接失败"
        exit 1
    }
    
    # 获取表信息
    log "获取表信息..."
    npx wrangler d1 execute "$db_name" --env="$env" --command=".tables" 2>/dev/null || {
        error "获取表信息失败"
        exit 1
    }
    
    # 获取数据统计
    log "获取数据统计..."
    npx wrangler d1 execute "$db_name" --env="$env" --command="
        SELECT 
            'calculation_history' as table_name,
            COUNT(*) as record_count
        FROM calculation_history
        UNION ALL
        SELECT 
            'system_config' as table_name,
            COUNT(*) as record_count
        FROM system_config
        UNION ALL
        SELECT 
            'monitoring_metrics' as table_name,
            COUNT(*) as record_count
        FROM monitoring_metrics;
    " 2>/dev/null || {
        log "警告: 获取数据统计失败，可能是表不存在"
    }
    
    success "数据库状态检查完成"
}

# 主函数
main() {
    local command="$1"
    
    case "$command" in
        backup)
            backup_database "$2"
            ;;
        restore)
            restore_database "$2" "$3"
            ;;
        migrate)
            migrate_database "$2"
            ;;
        cleanup)
            cleanup_backups "$2"
            ;;
        status)
            check_database_status "$2"
            ;;
        -h|--help|help)
            show_help
            ;;
        *)
            error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
