#!/bin/sh
# Docker 启动脚本
# 德国利息计算器容器初始化脚本

set -e

# 颜色输出
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

# 检查必要的目录和文件
check_prerequisites() {
    log_info "检查容器环境..."
    
    # 检查nginx配置文件
    if [ ! -f /etc/nginx/nginx.conf ]; then
        log_error "Nginx配置文件不存在"
        exit 1
    fi
    
    # 检查应用文件
    if [ ! -d /usr/share/nginx/html ]; then
        log_error "应用文件目录不存在"
        exit 1
    fi
    
    # 检查index.html
    if [ ! -f /usr/share/nginx/html/index.html ]; then
        log_error "应用入口文件不存在"
        exit 1
    fi
    
    log_success "环境检查完成"
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    # 设置默认值
    export NGINX_WORKER_PROCESSES=${NGINX_WORKER_PROCESSES:-auto}
    export NGINX_WORKER_CONNECTIONS=${NGINX_WORKER_CONNECTIONS:-1024}
    export NGINX_KEEPALIVE_TIMEOUT=${NGINX_KEEPALIVE_TIMEOUT:-65}
    export NGINX_CLIENT_MAX_BODY_SIZE=${NGINX_CLIENT_MAX_BODY_SIZE:-10M}
    
    # SSL设置
    export SSL_ENABLED=${SSL_ENABLED:-false}
    export SSL_CERT_PATH=${SSL_CERT_PATH:-/etc/nginx/ssl/cert.pem}
    export SSL_KEY_PATH=${SSL_KEY_PATH:-/etc/nginx/ssl/key.pem}
    
    # 安全设置
    export SECURITY_HEADERS_ENABLED=${SECURITY_HEADERS_ENABLED:-true}
    export CSP_ENABLED=${CSP_ENABLED:-true}
    export HSTS_ENABLED=${HSTS_ENABLED:-true}
    
    # API代理设置
    export API_PROXY_ENABLED=${API_PROXY_ENABLED:-false}
    export API_BACKEND_URL=${API_BACKEND_URL:-http://api:3000}
    
    log_success "环境变量设置完成"
}

# 动态配置nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 备份原始配置
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # 替换环境变量
    envsubst '${NGINX_WORKER_PROCESSES} ${NGINX_WORKER_CONNECTIONS} ${NGINX_KEEPALIVE_TIMEOUT} ${NGINX_CLIENT_MAX_BODY_SIZE}' \
        < /etc/nginx/nginx.conf.backup > /etc/nginx/nginx.conf
    
    # SSL配置
    if [ "$SSL_ENABLED" = "true" ]; then
        log_info "启用SSL配置..."
        
        # 检查SSL证书
        if [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
            log_success "SSL证书找到，启用HTTPS"
        else
            log_warning "SSL证书未找到，生成自签名证书用于测试"
            mkdir -p /etc/nginx/ssl
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "$SSL_KEY_PATH" \
                -out "$SSL_CERT_PATH" \
                -subj "/C=DE/ST=Bavaria/L=Munich/O=Zinses Rechner/CN=localhost" \
                2>/dev/null || log_error "SSL证书生成失败"
        fi
    fi
    
    # 安全头配置
    if [ "$SECURITY_HEADERS_ENABLED" = "false" ]; then
        log_warning "安全头已禁用"
        # 移除安全头配置
        sed -i '/security-headers.conf/d' /etc/nginx/conf.d/default.conf
    fi
    
    log_success "Nginx配置完成"
}

# 设置应用配置
setup_application() {
    log_info "设置应用配置..."
    
    # 检查是否需要替换环境变量
    if [ -n "$VITE_API_BASE_URL" ] || [ -n "$VITE_APP_VERSION" ]; then
        log_info "更新应用配置..."
        
        # 在运行时替换环境变量（如果应用支持）
        if [ -f /usr/share/nginx/html/config.js ]; then
            envsubst < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js
        fi
    fi
    
    # 设置正确的文件权限
    find /usr/share/nginx/html -type f -exec chmod 644 {} \;
    find /usr/share/nginx/html -type d -exec chmod 755 {} \;
    
    log_success "应用配置完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查nginx配置语法
    if nginx -t 2>/dev/null; then
        log_success "Nginx配置语法正确"
    else
        log_error "Nginx配置语法错误"
        nginx -t
        exit 1
    fi
    
    # 检查端口监听
    if command -v netstat >/dev/null 2>&1; then
        if netstat -ln | grep -q ":80 "; then
            log_success "端口80监听正常"
        fi
    fi
    
    log_success "健康检查完成"
}

# 清理函数
cleanup() {
    log_info "执行清理操作..."
    
    # 清理临时文件
    rm -f /tmp/nginx-*.tmp
    
    # 清理日志文件（如果太大）
    find /var/log/nginx -name "*.log" -size +100M -exec truncate -s 0 {} \;
    
    log_success "清理完成"
}

# 信号处理
handle_signal() {
    log_info "接收到停止信号，正在优雅关闭..."
    
    # 停止nginx
    nginx -s quit
    
    # 等待进程结束
    wait
    
    log_success "容器已优雅关闭"
    exit 0
}

# 设置信号处理
trap 'handle_signal' TERM INT

# 主函数
main() {
    log_info "启动德国利息计算器容器..."
    log_info "版本: ${VITE_APP_VERSION:-unknown}"
    log_info "环境: ${NODE_ENV:-production}"
    
    # 执行初始化步骤
    check_prerequisites
    setup_environment
    configure_nginx
    setup_application
    health_check
    cleanup
    
    log_success "容器初始化完成"
    log_info "启动Nginx..."
    
    # 启动nginx（前台运行）
    exec "$@"
}

# 如果直接运行此脚本
if [ "${1#-}" != "$1" ] || [ "${1%.conf}" != "$1" ]; then
    set -- nginx -g "daemon off;" "$@"
fi

# 执行主函数
main "$@"
