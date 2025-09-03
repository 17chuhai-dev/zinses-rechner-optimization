# Zinses Rechner - 安装指南

本指南将帮助您在不同环境中安装和配置德国利息计算器（Zinses Rechner）。

## 目录

- [快速开始](#快速开始)
- [系统要求](#系统要求)
- [安装方式](#安装方式)
- [配置说明](#配置说明)
- [验证安装](#验证安装)
- [常见问题](#常见问题)

## 快速开始

### 一键安装脚本

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/your-org/zinses-rechner/main/install.sh | bash
```

### 手动安装

```bash
# 1. 克隆项目
git clone https://github.com/your-org/zinses-rechner.git
cd zinses-rechner/zinses-rechner-frontend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local

# 4. 启动开发服务器
npm run dev
```

## 系统要求

### 基础要求

| 组件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Node.js | 18.0.0 | 20.x LTS | JavaScript运行时 |
| npm | 9.0.0 | 10.x | 包管理器 |
| Git | 2.20.0 | 最新版本 | 版本控制 |

### 操作系统支持

- **Linux**: Ubuntu 20.04+, CentOS 8+, Debian 11+
- **macOS**: 10.15+ (Catalina)
- **Windows**: 10+ (推荐使用WSL2)

### 硬件要求

#### 开发环境
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 10GB 可用空间
- **网络**: 宽带连接

#### 生产环境
- **CPU**: 4核心+
- **内存**: 8GB RAM+
- **存储**: 50GB SSD
- **网络**: 高速稳定连接

## 安装方式

### 方式一：npm/yarn 安装

```bash
# 使用npm
npm create vue@latest zinses-rechner
cd zinses-rechner
git remote add origin https://github.com/your-org/zinses-rechner.git
git pull origin main
npm install

# 使用yarn
yarn create vue zinses-rechner
cd zinses-rechner
git remote add origin https://github.com/your-org/zinses-rechner.git
git pull origin main
yarn install

# 使用pnpm
pnpm create vue zinses-rechner
cd zinses-rechner
git remote add origin https://github.com/your-org/zinses-rechner.git
git pull origin main
pnpm install
```

### 方式二：Docker 安装

#### 开发环境

```bash
# 拉取开发镜像
docker pull zinses-rechner/frontend:dev

# 运行开发容器
docker run -it --rm \
  -p 5173:5173 \
  -v $(pwd):/app \
  -w /app \
  zinses-rechner/frontend:dev \
  npm run dev
```

#### 生产环境

```bash
# 拉取生产镜像
docker pull zinses-rechner/frontend:latest

# 运行生产容器
docker run -d \
  --name zinses-rechner \
  -p 80:80 \
  -p 443:443 \
  zinses-rechner/frontend:latest
```

### 方式三：源码编译安装

```bash
# 1. 下载源码
wget https://github.com/your-org/zinses-rechner/archive/main.zip
unzip main.zip
cd zinses-rechner-main/zinses-rechner-frontend

# 2. 安装构建工具
npm install -g @vitejs/plugin-vue typescript

# 3. 安装依赖
npm ci

# 4. 构建应用
npm run build

# 5. 部署到服务器
cp -r dist/* /var/www/html/
```

## 配置说明

### 环境变量配置

#### 基础配置

```bash
# .env.local
VITE_APP_TITLE="Zinses Rechner"
VITE_APP_DESCRIPTION="Professional German Financial Calculator"
VITE_APP_VERSION="1.0.0"
VITE_APP_URL="http://localhost:5173"
VITE_API_BASE_URL="http://localhost:3000/api"
```

#### 开发环境配置

```bash
# .env.development
VITE_NODE_ENV=development
VITE_DEBUG_MODE=true
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_PERFORMANCE_PANEL=true
VITE_LOG_LEVEL=debug
```

#### 生产环境配置

```bash
# .env.production
VITE_NODE_ENV=production
VITE_DEBUG_MODE=false
VITE_ENABLE_DEVTOOLS=false
VITE_GENERATE_SOURCEMAP=false
VITE_LOG_LEVEL=error
```

### API配置

```bash
# 第三方API配置
VITE_ECB_API_URL="https://api.ecb.europa.eu/v1"
VITE_ECB_API_KEY="your-ecb-api-key"
VITE_BUNDESBANK_API_URL="https://api.bundesbank.de/bbk"
VITE_BUNDESBANK_API_KEY="your-bundesbank-api-key"
VITE_YAHOO_FINANCE_API_URL="https://query1.finance.yahoo.com/v8/finance"
VITE_FIXER_API_URL="https://api.fixer.io/v1"
VITE_FIXER_API_KEY="your-fixer-api-key"
```

### 安全配置

```bash
# 安全相关配置
VITE_CSP_NONCE="generated-nonce"
VITE_ENCRYPTION_SALT="your-encryption-salt"
VITE_STORAGE_ENCRYPTION_KEY="your-storage-key"
```

### 监控配置

```bash
# 监控和分析
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_SENTRY_DSN="https://your-sentry-dsn"
VITE_SENTRY_ENVIRONMENT="production"
```

## 验证安装

### 1. 基础功能测试

```bash
# 启动应用
npm run dev

# 在浏览器中访问
open http://localhost:5173
```

检查以下功能：
- [ ] 页面正常加载
- [ ] 计算器功能正常
- [ ] 图表显示正确
- [ ] 导出功能可用
- [ ] 响应式设计正常

### 2. 自动化测试

```bash
# 运行单元测试
npm run test

# 运行组件测试
npm run test:component

# 运行E2E测试
npm run test:e2e

# 生成测试报告
npm run test:coverage
```

### 3. 性能测试

```bash
# 构建生产版本
npm run build

# 启动预览服务器
npm run preview

# 运行Lighthouse审计
npm run lighthouse

# 检查包大小
npm run analyze
```

### 4. 安全测试

```bash
# 依赖漏洞扫描
npm audit

# 安全扫描
npm run security:scan

# 检查安全头
npm run security:headers
```

## 常见问题

### Q1: Node.js版本不兼容

**问题**: `Error: Unsupported Node.js version`

**解决方案**:
```bash
# 使用nvm管理Node.js版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### Q2: 依赖安装失败

**问题**: `npm ERR! peer dep missing`

**解决方案**:
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json

# 重新安装
npm install --legacy-peer-deps
```

### Q3: 端口被占用

**问题**: `Error: listen EADDRINUSE: address already in use :::5173`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -ti:5173

# 终止进程
kill -9 $(lsof -ti:5173)

# 或使用不同端口
npm run dev -- --port 3000
```

### Q4: 权限问题

**问题**: `EACCES: permission denied`

**解决方案**:
```bash
# 修复npm权限
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# 或使用nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Q5: 构建失败

**问题**: `Build failed with errors`

**解决方案**:
```bash
# 检查TypeScript错误
npm run type-check

# 检查ESLint错误
npm run lint

# 清理并重新构建
npm run clean
npm run build
```

### Q6: 环境变量不生效

**问题**: 环境变量在应用中未定义

**解决方案**:
```bash
# 确保变量以VITE_开头
VITE_MY_VARIABLE=value

# 重启开发服务器
npm run dev
```

### Q7: API请求失败

**问题**: `CORS error` 或 `Network error`

**解决方案**:
```bash
# 检查API配置
echo $VITE_API_BASE_URL

# 配置代理（vite.config.ts）
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

### Q8: Docker构建问题

**问题**: Docker镜像构建失败

**解决方案**:
```bash
# 清理Docker缓存
docker system prune -a

# 重新构建镜像
docker build --no-cache -t zinses-rechner .

# 检查Dockerfile语法
docker build --dry-run .
```

## 高级安装选项

### 自定义构建配置

```bash
# 创建自定义配置文件
cp vite.config.ts vite.config.custom.ts

# 使用自定义配置构建
npx vite build --config vite.config.custom.ts
```

### 多环境部署

```bash
# 创建多个环境配置
.env.development
.env.staging
.env.production

# 指定环境构建
npm run build -- --mode staging
```

### 插件扩展

```bash
# 安装额外插件
npm install --save-dev vite-plugin-pwa
npm install --save-dev @vitejs/plugin-legacy

# 在vite.config.ts中配置
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'
```

## 获取帮助

如果遇到安装问题，可以通过以下方式获取帮助：

1. **查看文档**: [完整文档](https://docs.zinses-rechner.de)
2. **GitHub Issues**: [问题报告](https://github.com/your-org/zinses-rechner/issues)
3. **社区论坛**: [讨论区](https://community.zinses-rechner.de)
4. **技术支持**: tech-support@zinses-rechner.de

## 下一步

安装完成后，建议阅读以下文档：

- [配置指南](./CONFIGURATION.md)
- [开发指南](./DEVELOPMENT.md)
- [部署指南](./DEPLOYMENT.md)
- [故障排除](./TROUBLESHOOTING.md)

---

**注意**: 请确保在生产环境中使用最新的稳定版本，并定期更新依赖包以获得最新的安全补丁。
