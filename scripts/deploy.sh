#!/bin/bash

# Cloudflare Pages部署脚本
# 德国复利计算器自动化部署

set -e  # 遇到错误立即退出

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

# 检查必要工具
check_dependencies() {
    log_info "检查部署依赖..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    if ! command -v wrangler &> /dev/null; then
        log_warning "Wrangler CLI 未安装，正在安装..."
        npm install -g wrangler
    fi
    
    log_success "依赖检查完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端应用..."
    
    cd zinses-rechner-frontend
    
    # 安装依赖
    log_info "安装前端依赖..."
    npm ci
    
    # 运行类型检查
    log_info "运行TypeScript类型检查..."
    npm run type-check || log_warning "类型检查有警告，继续构建..."
    
    # 运行代码检查
    log_info "运行ESLint检查..."
    npm run lint || log_warning "代码检查有警告，继续构建..."
    
    # 构建生产版本
    log_info "构建生产版本..."
    npm run build
    
    # 检查构建结果
    if [ ! -d "dist" ]; then
        log_error "构建失败：dist目录不存在"
        exit 1
    fi
    
    log_success "前端构建完成"
    cd ..
}

# 构建后端
build_backend() {
    log_info "准备后端部署..."
    
    cd backend
    
    # 检查Python环境
    if [ ! -d "venv" ]; then
        log_info "创建Python虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境并安装依赖
    source venv/bin/activate
    pip install -r requirements.txt
    
    log_success "后端准备完成"
    cd ..
}

# 部署到Cloudflare Pages
deploy_to_cloudflare() {
    local environment=${1:-production}
    
    log_info "部署到Cloudflare Pages (${environment})..."
    
    # 设置环境变量
    if [ "$environment" = "production" ]; then
        export VITE_API_BASE_URL="https://api.zinses-rechner.de"
    else
        export VITE_API_BASE_URL="https://api-staging.zinses-rechner.de"
    fi
    
    # 部署前端
    cd zinses-rechner-frontend
    wrangler pages deploy dist --project-name zinses-rechner-${environment}
    cd ..
    
    log_success "Cloudflare Pages部署完成"
}

# 运行性能测试
run_performance_tests() {
    log_info "运行性能测试..."
    
    # 使用Lighthouse CI进行性能测试
    if command -v lhci &> /dev/null; then
        lhci autorun
    else
        log_warning "Lighthouse CI 未安装，跳过性能测试"
    fi
}

# 主函数
main() {
    local environment=${1:-production}
    
    log_info "开始部署德国复利计算器 (${environment})"
    
    # 检查依赖
    check_dependencies
    
    # 构建应用
    build_frontend
    build_backend
    
    # 部署到Cloudflare
    deploy_to_cloudflare $environment
    
    # 运行测试
    run_performance_tests
    
    log_success "部署完成！"
    log_info "前端地址: https://zinses-rechner.de"
    log_info "API地址: https://api.zinses-rechner.de"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
