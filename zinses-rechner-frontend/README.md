# Zinses Rechner - 德国利息计算器

[![Build Status](https://github.com/your-org/zinses-rechner/workflows/CI/badge.svg)](https://github.com/your-org/zinses-rechner/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)

专业的德国金融计算器，提供复利、贷款、投资和退休规划等多种计算功能。

## ✨ 特性

- 🧮 **多种计算器**: 复利、贷款、投资、退休规划
- 📊 **数据可视化**: 交互式图表和3D可视化
- 🌐 **实时数据**: 集成欧洲央行、德国央行等权威数据源
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🔒 **安全可靠**: 符合GDPR法规，数据加密保护
- ⚡ **高性能**: 优化的构建配置，快速加载
- 🌙 **暗色模式**: 支持明暗主题切换
- 📄 **导出功能**: 支持PDF、Excel等格式导出
- 🔄 **PWA支持**: 可安装的渐进式Web应用
- 🌍 **德语本地化**: 完全德语界面和文档

## 项目概述

这是一个专为德国用户设计的专业金融计算器，提供透明、快速、本地化的财务计算体验。应用集成了多个权威金融数据源，提供实时准确的计算结果。

## 🛠️ 技术栈

### 核心技术
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速的构建工具
- **Pinia** - Vue状态管理
- **Vue Router** - 官方路由管理器

### UI和样式
- **Tailwind CSS** - 实用优先的CSS框架
- **Headless UI** - 无样式的可访问组件
- **Heroicons** - 精美的SVG图标

### 数据可视化
- **Chart.js** - 灵活的图表库
- **Vue Chart.js** - Vue的Chart.js包装器
- **Three.js** - 3D图形库

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Vitest** - 单元测试框架
- **Playwright** - E2E测试框架

## 🧮 计算器功能

### 复利计算器 (Zinseszins-Rechner)
- 本金、利率、期限计算
- 定期存款计算
- 复利效应可视化

### 贷款计算器 (Kredit-Rechner)
- 月供计算
- 提前还款分析
- 利息总额计算

### 投资计算器 (Investment-Rechner)
- 投资回报率计算
- 风险评估
- 投资组合分析

### 退休计算器 (Renten-Rechner)
- 退休金需求计算
- 储蓄目标规划
- 通胀影响分析

## 🚀 快速开始

### 前置要求

- Node.js 18.0.0 或更高版本
- npm 9.0.0 或更高版本

### 安装

```bash
# 克隆项目
git clone https://github.com/your-org/zinses-rechner.git
cd zinses-rechner/zinses-rechner-frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 查看应用。

### Docker 快速启动

```bash
# 使用Docker运行
docker run -d -p 80:80 zinses-rechner/frontend:latest

# 或使用Docker Compose
docker-compose up -d
```

## 🔧 开发命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览构建结果

# 测试
npm run test             # 运行单元测试
npm run test:e2e         # 运行E2E测试
npm run test:coverage    # 生成测试覆盖率报告

# 代码质量
npm run lint             # ESLint检查
npm run lint:fix         # 自动修复ESLint问题
npm run type-check       # TypeScript类型检查

# 分析和优化
npm run build:analyze    # 构建分析
npm run lighthouse       # Lighthouse性能审计
npm run security:scan    # 安全扫描
```

## 📖 文档

- [安装指南](./docs/INSTALLATION.md) - 详细的安装说明
- [配置指南](./docs/CONFIGURATION.md) - 环境变量和配置选项
- [部署指南](./docs/DEPLOYMENT.md) - 生产环境部署
- [开发指南](./docs/DEVELOPMENT.md) - 开发环境设置和贡献指南
- [故障排除](./docs/TROUBLESHOOTING.md) - 常见问题解决方案

## 🌍 环境变量

创建 `.env.local` 文件并配置以下变量：

```bash
# 应用配置
VITE_APP_TITLE="Zinses Rechner"
VITE_APP_URL="http://localhost:5173"
VITE_API_BASE_URL="http://localhost:3000/api"

# 第三方API
VITE_ECB_API_KEY="your-ecb-api-key"
VITE_BUNDESBANK_API_KEY="your-bundesbank-api-key"
VITE_FIXER_API_KEY="your-fixer-api-key"

# 监控和分析
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_SENTRY_DSN="your-sentry-dsn"
```

查看 [.env.example](./.env.example) 了解所有可用的环境变量。

## 🚀 部署

### 传统部署

```bash
# 构建应用
npm run build

# 部署到服务器
scp -r dist/* user@server:/var/www/html/
```

### Docker部署

```bash
# 构建镜像
docker build -t zinses-rechner .

# 运行容器
docker run -d -p 80:80 zinses-rechner
```

### 云平台部署

支持一键部署到：
- Vercel
- Netlify
- AWS S3 + CloudFront
- Google Cloud Platform
- Azure Static Web Apps

详细部署说明请参考 [部署指南](./docs/DEPLOYMENT.md)。

## 🔒 安全

- **HTTPS强制**: 生产环境强制使用HTTPS
- **CSP保护**: 内容安全策略防止XSS攻击
- **GDPR合规**: 符合欧盟数据保护法规
- **数据加密**: 敏感数据本地加密存储
- **安全头**: 完整的HTTP安全头配置
- **依赖扫描**: 定期扫描依赖漏洞

## 📈 性能

- **代码分割**: 按需加载减少初始包大小
- **懒加载**: 图片和组件懒加载
- **缓存策略**: 智能的资源缓存
- **压缩优化**: Gzip/Brotli压缩
- **CDN支持**: 静态资源CDN加速
- **PWA优化**: Service Worker缓存

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

## 📞 联系我们

- **网站**: https://zinses-rechner.de
- **邮箱**: contact@zinses-rechner.de
- **GitHub**: https://github.com/your-org/zinses-rechner
- **问题报告**: https://github.com/your-org/zinses-rechner/issues

---

<div align="center">
  <p>用 ❤️ 在德国制作</p>
  <p>© 2024 Zinses Rechner Team. All rights reserved.</p>
</div>
