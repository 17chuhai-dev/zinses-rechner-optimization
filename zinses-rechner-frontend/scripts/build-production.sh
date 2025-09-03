#!/bin/bash

# Zinses-Rechner前端生产构建脚本
# 优化构建流程和性能验证

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

# 检查Node.js版本
check_node_version() {
    log_info "检查Node.js版本..."
    
    NODE_VERSION=$(node --version)
    REQUIRED_VERSION="v18"
    
    if [[ "$NODE_VERSION" < "$REQUIRED_VERSION" ]]; then
        log_error "Node.js版本过低: $NODE_VERSION (需要 >= $REQUIRED_VERSION)"
        exit 1
    fi
    
    log_success "Node.js版本检查通过: $NODE_VERSION"
}

# 清理构建目录
clean_build() {
    log_info "清理构建目录..."
    
    if [ -d "dist" ]; then
        rm -rf dist
        log_success "构建目录已清理"
    else
        log_info "构建目录不存在，跳过清理"
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ ! -f "package-lock.json" ]; then
        log_warning "package-lock.json不存在，使用npm install"
        npm install
    else
        npm ci
    fi
    
    log_success "依赖安装完成"
}

# 运行类型检查
type_check() {
    log_info "执行TypeScript类型检查..."
    npm run type-check
    log_success "类型检查通过"
}

# 运行代码检查
lint_check() {
    log_info "执行代码质量检查..."
    npm run lint
    log_success "代码质量检查通过"
}

# 运行测试
run_tests() {
    log_info "运行测试套件..."
    npm run test:run
    log_success "所有测试通过"
}

# 构建项目
build_project() {
    log_info "构建生产版本..."
    
    # 设置生产环境变量
    export NODE_ENV=production
    export VITE_APP_ENVIRONMENT=production
    
    # 执行构建
    npm run build:production
    
    log_success "项目构建完成"
}

# 分析构建产物
analyze_build() {
    log_info "分析构建产物..."
    
    # 检查构建目录大小
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    log_info "构建产物总大小: $BUILD_SIZE"
    
    # 检查主要文件大小
    log_info "主要文件大小分析:"
    find dist/ -name "*.js" -exec du -h {} \; | sort -hr | head -5
    find dist/ -name "*.css" -exec du -h {} \; | sort -hr | head -3
    
    # 检查Gzip压缩后大小
    if command -v gzip &> /dev/null; then
        log_info "Gzip压缩后大小分析:"
        find dist/ -name "*.js" -exec sh -c 'echo "$(gzip -c "$1" | wc -c) bytes (gzipped) - $1"' _ {} \; | sort -nr | head -5
    fi
    
    # 生成构建分析报告
    if [ "$ANALYZE" = "true" ]; then
        log_info "生成详细构建分析..."
        npm run build:analyze
        log_success "构建分析报告已生成: dist/stats.html"
    fi
}

# 验证构建产物
verify_build() {
    log_info "验证构建产物..."
    
    # 检查必需文件
    REQUIRED_FILES=(
        "dist/index.html"
        "dist/manifest.webmanifest"
        "dist/assets"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "必需文件缺失: $file"
            exit 1
        fi
    done
    
    # 检查HTML文件完整性
    if ! grep -q "<!DOCTYPE html>" dist/index.html; then
        log_error "index.html格式错误"
        exit 1
    fi
    
    # 检查PWA manifest
    if [ -f "dist/manifest.webmanifest" ]; then
        if ! grep -q "Zinses-Rechner" dist/manifest.webmanifest; then
            log_warning "PWA manifest可能有问题"
        else
            log_success "PWA manifest验证通过"
        fi
    fi
    
    log_success "构建产物验证通过"
}

# 运行本地预览测试
preview_test() {
    log_info "启动本地预览测试..."
    
    # 启动预览服务器
    npm run preview &
    PREVIEW_PID=$!
    
    # 等待服务器启动
    sleep 10
    
    # 测试主页
    if curl -f -s http://localhost:4173/ > /dev/null; then
        log_success "本地预览测试通过"
    else
        log_error "本地预览测试失败"
        kill $PREVIEW_PID 2>/dev/null || true
        exit 1
    fi
    
    # 关闭预览服务器
    kill $PREVIEW_PID 2>/dev/null || true
}

# 生成部署报告
generate_deployment_report() {
    log_info "生成部署报告..."
    
    REPORT_FILE="deployment-report.md"
    
    cat > "$REPORT_FILE" << EOF
# Zinses-Rechner Frontend部署报告

## 构建信息
- **构建时间**: $(date)
- **Node.js版本**: $(node --version)
- **npm版本**: $(npm --version)
- **构建环境**: production

## 构建产物分析
- **总大小**: $(du -sh dist/ | cut -f1)
- **文件数量**: $(find dist/ -type f | wc -l)

### 主要文件大小
\`\`\`
$(find dist/ -name "*.js" -exec du -h {} \; | sort -hr | head -5)
\`\`\`

### CSS文件大小
\`\`\`
$(find dist/ -name "*.css" -exec du -h {} \; | sort -hr | head -3)
\`\`\`

## 性能指标
- **构建时间**: 记录在CI/CD日志中
- **Bundle大小**: 优化完成
- **代码分割**: 已启用
- **Tree Shaking**: 已启用
- **压缩**: Terser + Gzip

## 部署配置
- **目标平台**: Cloudflare Pages
- **自定义域名**: zinses-rechner.de
- **CDN**: Cloudflare全球边缘网络
- **SSL**: 自动SSL证书

## 验证清单
- [x] TypeScript类型检查
- [x] ESLint代码质量检查
- [x] 单元测试通过
- [x] 构建产物验证
- [x] 本地预览测试
- [x] PWA配置验证

## 下一步
1. 部署到Cloudflare Pages
2. 配置自定义域名
3. 验证生产环境功能
4. 监控性能指标
EOF

    log_success "部署报告已生成: $REPORT_FILE"
}

# 主构建流程
main() {
    log_info "🚀 开始Zinses-Rechner前端生产构建"
    
    # 记录开始时间
    START_TIME=$(date +%s)
    
    # 执行构建步骤
    check_node_version
    clean_build
    install_dependencies
    type_check
    lint_check
    run_tests
    build_project
    analyze_build
    verify_build
    preview_test
    generate_deployment_report
    
    # 计算构建时间
    END_TIME=$(date +%s)
    BUILD_TIME=$((END_TIME - START_TIME))
    
    log_success "🎉 前端生产构建完成！"
    log_info "构建耗时: ${BUILD_TIME}秒"
    log_info "构建产物位置: ./dist/"
    log_info "部署报告: ./deployment-report.md"
    
    # 显示下一步操作
    echo ""
    log_info "📋 下一步操作:"
    echo "1. 部署到预览环境: npm run deploy:preview"
    echo "2. 部署到生产环境: npm run deploy:production"
    echo "3. 查看构建分析: npm run size-check"
    echo "4. 运行性能测试: npm run lighthouse"
}

# 错误处理
trap 'log_error "构建过程中发生错误，请检查日志"; exit 1' ERR

# 执行主流程
main "$@"
