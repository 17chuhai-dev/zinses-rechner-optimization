#!/bin/sh
# 健康检查脚本
# 德国利息计算器容器健康状态检查

set -e

# 配置
HEALTH_CHECK_URL="http://localhost/health"
TIMEOUT=10
MAX_RETRIES=3
RETRY_DELAY=2

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >&2
}

log_success() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}SUCCESS${NC}: $1" >&2
}

log_warning() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}WARNING${NC}: $1" >&2
}

log_error() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}ERROR${NC}: $1" >&2
}

# 检查HTTP响应
check_http_response() {
    local url=$1
    local expected_status=${2:-200}
    
    log_info "检查HTTP响应: $url"
    
    # 使用curl检查HTTP状态
    if command -v curl >/dev/null 2>&1; then
        local response
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null)
        
        if [ "$response" = "$expected_status" ]; then
            log_success "HTTP响应正常 ($response)"
            return 0
        else
            log_error "HTTP响应异常: $response (期望: $expected_status)"
            return 1
        fi
    else
        log_warning "curl命令不可用，跳过HTTP检查"
        return 0
    fi
}

# 检查nginx进程
check_nginx_process() {
    log_info "检查Nginx进程状态"
    
    if pgrep nginx >/dev/null 2>&1; then
        local nginx_count
        nginx_count=$(pgrep nginx | wc -l)
        log_success "Nginx进程运行正常 ($nginx_count 个进程)"
        return 0
    else
        log_error "Nginx进程未运行"
        return 1
    fi
}

# 检查端口监听
check_port_listening() {
    local port=${1:-80}
    
    log_info "检查端口监听状态: $port"
    
    if command -v netstat >/dev/null 2>&1; then
        if netstat -ln 2>/dev/null | grep -q ":$port "; then
            log_success "端口 $port 监听正常"
            return 0
        else
            log_error "端口 $port 未监听"
            return 1
        fi
    elif command -v ss >/dev/null 2>&1; then
        if ss -ln 2>/dev/null | grep -q ":$port "; then
            log_success "端口 $port 监听正常"
            return 0
        else
            log_error "端口 $port 未监听"
            return 1
        fi
    else
        log_warning "netstat/ss命令不可用，跳过端口检查"
        return 0
    fi
}

# 检查磁盘空间
check_disk_space() {
    log_info "检查磁盘空间"
    
    local usage
    usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 90 ]; then
        log_success "磁盘空间充足 (使用率: ${usage}%)"
        return 0
    elif [ "$usage" -lt 95 ]; then
        log_warning "磁盘空间不足 (使用率: ${usage}%)"
        return 0
    else
        log_error "磁盘空间严重不足 (使用率: ${usage}%)"
        return 1
    fi
}

# 检查内存使用
check_memory_usage() {
    log_info "检查内存使用情况"
    
    if [ -f /proc/meminfo ]; then
        local total_mem available_mem usage_percent
        total_mem=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        available_mem=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        
        if [ "$total_mem" -gt 0 ] && [ "$available_mem" -gt 0 ]; then
            usage_percent=$(( (total_mem - available_mem) * 100 / total_mem ))
            
            if [ "$usage_percent" -lt 90 ]; then
                log_success "内存使用正常 (使用率: ${usage_percent}%)"
                return 0
            else
                log_warning "内存使用率较高 (使用率: ${usage_percent}%)"
                return 0
            fi
        fi
    fi
    
    log_warning "无法获取内存信息"
    return 0
}

# 检查应用文件
check_application_files() {
    log_info "检查应用文件完整性"
    
    # 检查关键文件
    local critical_files="/usr/share/nginx/html/index.html"
    
    for file in $critical_files; do
        if [ -f "$file" ]; then
            log_success "关键文件存在: $file"
        else
            log_error "关键文件缺失: $file"
            return 1
        fi
    done
    
    # 检查文件权限
    if [ -r "/usr/share/nginx/html/index.html" ]; then
        log_success "应用文件权限正常"
        return 0
    else
        log_error "应用文件权限异常"
        return 1
    fi
}

# 检查nginx配置
check_nginx_config() {
    log_info "检查Nginx配置"
    
    if nginx -t >/dev/null 2>&1; then
        log_success "Nginx配置语法正确"
        return 0
    else
        log_error "Nginx配置语法错误"
        return 1
    fi
}

# 执行完整健康检查
perform_health_check() {
    local checks_passed=0
    local total_checks=0
    
    log_info "开始健康检查..."
    
    # 基础检查（必须通过）
    local critical_checks="check_nginx_process check_port_listening check_application_files check_nginx_config"
    
    for check in $critical_checks; do
        total_checks=$((total_checks + 1))
        if $check; then
            checks_passed=$((checks_passed + 1))
        else
            log_error "关键检查失败: $check"
            return 1
        fi
    done
    
    # HTTP检查（带重试）
    total_checks=$((total_checks + 1))
    local retry_count=0
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if check_http_response "$HEALTH_CHECK_URL"; then
            checks_passed=$((checks_passed + 1))
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $MAX_RETRIES ]; then
                log_warning "HTTP检查失败，${RETRY_DELAY}秒后重试 ($retry_count/$MAX_RETRIES)"
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    if [ $retry_count -eq $MAX_RETRIES ]; then
        log_error "HTTP检查最终失败"
        return 1
    fi
    
    # 可选检查（不影响整体结果）
    local optional_checks="check_disk_space check_memory_usage"
    
    for check in $optional_checks; do
        $check || log_warning "可选检查失败: $check"
    done
    
    log_success "健康检查完成: $checks_passed/$total_checks 关键检查通过"
    return 0
}

# 主函数
main() {
    # 设置超时
    if command -v timeout >/dev/null 2>&1; then
        timeout $((TIMEOUT + 5)) perform_health_check
    else
        perform_health_check
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "healthy"
        exit 0
    else
        echo "unhealthy"
        exit 1
    fi
}

# 执行主函数
main "$@"
