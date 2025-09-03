#!/bin/bash

# Docker开发环境管理脚本
# 德国复利计算器开发环境快速启动

set -e

# 颜色输出
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

# 检查Docker和Docker Compose
check_docker() {
    log_info "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker守护进程未运行，请启动Docker"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
    
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动开发环境服务..."
    
    # 启动核心服务
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d frontend backend redis
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    check_services
    
    log_success "开发环境启动完成"
    log_info "前端地址: http://localhost:5173"
    log_info "后端API: http://localhost:8000"
    log_info "API文档: http://localhost:8000/docs"
    log_info "Redis: localhost:6379"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    # 检查前端
    if curl -f http://localhost:5173 &> /dev/null; then
        log_success "前端服务正常"
    else
        log_warning "前端服务可能未完全启动"
    fi
    
    # 检查后端
    if curl -f http://localhost:8000/health &> /dev/null; then
        log_success "后端服务正常"
    else
        log_warning "后端服务可能未完全启动"
    fi
    
    # 检查Redis
    if docker-compose exec redis redis-cli ping &> /dev/null; then
        log_success "Redis服务正常"
    else
        log_warning "Redis服务可能未完全启动"
    fi
}

# 停止服务
stop_services() {
    log_info "停止开发环境服务..."
    
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启开发环境服务..."
    
    stop_services
    start_services
}

# 查看日志
show_logs() {
    local service=${1:-}
    
    if [ -z "$service" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "$service"
    fi
}

# 清理环境
clean_environment() {
    log_info "清理Docker环境..."
    
    # 停止并删除容器
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
    
    # 删除镜像
    docker image prune -f
    
    # 删除未使用的卷
    docker volume prune -f
    
    log_success "环境清理完成"
}

# 显示帮助信息
show_help() {
    echo "Docker开发环境管理脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动开发环境"
    echo "  stop      停止开发环境"
    echo "  restart   重启开发环境"
    echo "  build     构建镜像"
    echo "  logs      查看日志 [服务名]"
    echo "  status    检查服务状态"
    echo "  clean     清理环境"
    echo "  help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start              # 启动开发环境"
    echo "  $0 logs backend       # 查看后端日志"
    echo "  $0 clean              # 清理环境"
}

# 主函数
main() {
    local command=${1:-start}
    
    case $command in
        start)
            check_docker
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            check_docker
            restart_services
            ;;
        build)
            check_docker
            build_images
            ;;
        logs)
            show_logs $2
            ;;
        status)
            check_services
            ;;
        clean)
            clean_environment
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
