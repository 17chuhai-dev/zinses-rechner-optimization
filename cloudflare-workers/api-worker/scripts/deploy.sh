#!/bin/bash

# Zinses-Rechner API Worker部署脚本
# 自动化生产环境部署流程

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

# 检查必需的工具
check_dependencies() {
    log_info "检查部署依赖..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装"
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        log_error "npx未安装"
        exit 1
    fi
    
    log_success "所有依赖检查通过"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    npm ci
    log_success "依赖安装完成"
}

# 运行测试
run_tests() {
    log_info "运行测试套件..."
    npm run test
    log_success "所有测试通过"
}

# 类型检查
type_check() {
    log_info "执行TypeScript类型检查..."
    npm run type-check
    log_success "类型检查通过"
}

# 代码检查
lint_check() {
    log_info "执行代码质量检查..."
    npm run lint
    log_success "代码质量检查通过"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    npm run build
    log_success "项目构建完成"
}

# 部署到预览环境
deploy_preview() {
    log_info "部署到预览环境..."
    npx wrangler deploy --env preview
    log_success "预览环境部署完成"
    log_info "预览地址: https://zinses-rechner-api-preview.your-subdomain.workers.dev"
}

# 运行预览环境测试
test_preview() {
    log_info "测试预览环境..."
    
    # 等待部署生效
    sleep 10
    
    # 健康检查
    PREVIEW_URL="https://zinses-rechner-api-preview.your-subdomain.workers.dev"
    
    if curl -f -s "${PREVIEW_URL}/health" > /dev/null; then
        log_success "预览环境健康检查通过"
    else
        log_error "预览环境健康检查失败"
        exit 1
    fi
    
    # 测试计算API
    CALC_RESPONSE=$(curl -s -X POST "${PREVIEW_URL}/api/v1/calculate/compound-interest" \
        -H "Content-Type: application/json" \
        -d '{"principal": 1000, "monthly_payment": 0, "annual_rate": 4, "years": 1, "compound_frequency": "yearly"}')
    
    if echo "$CALC_RESPONSE" | grep -q "final_amount"; then
        log_success "预览环境API测试通过"
    else
        log_error "预览环境API测试失败"
        echo "响应: $CALC_RESPONSE"
        exit 1
    fi
}

# 部署到生产环境
deploy_production() {
    log_warning "准备部署到生产环境..."
    log_warning "这将影响实际用户，请确认继续？ (y/N)"
    
    read -r confirmation
    if [[ $confirmation != [yY] ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    log_info "部署到生产环境..."
    npx wrangler deploy --env production
    log_success "生产环境部署完成"
    log_info "生产地址: https://api.zinses-rechner.de"
}

# 验证生产环境
verify_production() {
    log_info "验证生产环境..."
    
    # 等待部署生效
    sleep 15
    
    PROD_URL="https://api.zinses-rechner.de"
    
    # 健康检查
    if curl -f -s "${PROD_URL}/health" > /dev/null; then
        log_success "生产环境健康检查通过"
    else
        log_error "生产环境健康检查失败"
        exit 1
    fi
    
    # 性能测试
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "${PROD_URL}/health")
    RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
    
    if (( $(echo "$RESPONSE_TIME_MS < 500" | bc -l) )); then
        log_success "生产环境性能测试通过 (${RESPONSE_TIME_MS}ms)"
    else
        log_warning "生产环境响应时间较慢 (${RESPONSE_TIME_MS}ms)"
    fi
}

# 部署后清理
cleanup() {
    log_info "清理临时文件..."
    rm -rf dist/temp
    log_success "清理完成"
}

# 主部署流程
main() {
    log_info "🚀 开始Zinses-Rechner API Worker部署流程"
    
    # 获取部署环境参数
    DEPLOY_ENV=${1:-"preview"}
    
    if [[ "$DEPLOY_ENV" != "preview" && "$DEPLOY_ENV" != "production" ]]; then
        log_error "无效的部署环境: $DEPLOY_ENV"
        log_info "使用方法: $0 [preview|production]"
        exit 1
    fi
    
    log_info "部署环境: $DEPLOY_ENV"
    
    # 执行部署步骤
    check_dependencies
    install_dependencies
    type_check
    lint_check
    run_tests
    build_project
    
    if [[ "$DEPLOY_ENV" == "preview" ]]; then
        deploy_preview
        test_preview
    elif [[ "$DEPLOY_ENV" == "production" ]]; then
        deploy_preview
        test_preview
        deploy_production
        verify_production
    fi
    
    cleanup
    
    log_success "🎉 部署完成！"
    
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        log_info "生产环境地址: https://api.zinses-rechner.de"
        log_info "监控仪表盘: https://dash.cloudflare.com"
        log_info "请监控系统状态并检查告警配置"
    fi
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主流程
main "$@"
