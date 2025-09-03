# 🚀 Zinses Rechner - Vollständige Deployment-Anleitung

Umfassende Anleitung zur Bereitstellung der Zinses Rechner Anwendung in verschiedenen Umgebungen.

## 📋 Inhaltsverzeichnis

- [Systemanforderungen](#systemanforderungen)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Cloudflare Pages Deployment](#cloudflare-pages-deployment)
- [Produktionsumgebung](#produktionsumgebung)
- [Docker Deployment](#docker-deployment)
- [Monitoring & Wartung](#monitoring--wartung)
- [Troubleshooting](#troubleshooting)

## 🖥️ Systemanforderungen

### Mindestanforderungen

#### Backend (FastAPI)
- **Python**: 3.9+ (empfohlen: 3.11)
- **RAM**: 512MB (empfohlen: 2GB)
- **CPU**: 1 Core (empfohlen: 2+ Cores)
- **Speicher**: 1GB verfügbar

#### Frontend (Vue.js)
- **Node.js**: 18+ (empfohlen: 20 LTS)
- **npm**: 9+ oder **pnpm**: 8+
- **RAM**: 1GB während Build (empfohlen: 4GB)
- **Speicher**: 500MB für Build-Artefakte

### Unterstützte Betriebssysteme

- ✅ **Linux**: Ubuntu 20.04+, CentOS 8+, Debian 11+
- ✅ **macOS**: 12.0+ (Monterey)
- ✅ **Windows**: 10/11 mit WSL2
- ✅ **Docker**: Alle Docker-kompatiblen Systeme

## 🛠️ Lokale Entwicklung

### Schnellstart

```bash
# Repository klonen
git clone https://github.com/your-org/zinses-rechner.git
cd zinses-rechner

# Backend starten
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend starten (neues Terminal)
cd ../zinses-rechner-frontend
npm install
npm run dev
```

### Umgebungsvariablen

#### Backend (.env)

```env
# Anwendungseinstellungen
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# API Konfiguration
API_V1_STR=/api/v1
PROJECT_NAME="Zinses Rechner API"
VERSION=1.0.0

# CORS Einstellungen
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
ALLOWED_HOSTS=["localhost", "127.0.0.1"]

# Deutsche Lokalisierung
DEFAULT_LOCALE=de_DE
DEFAULT_CURRENCY=EUR
DEFAULT_TIMEZONE=Europe/Berlin
```

#### Frontend (.env)

```env
# API Endpoints
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1

# Anwendungseinstellungen
VITE_APP_TITLE="Zinses Rechner"
VITE_APP_DESCRIPTION="Kostenloser Online Zinseszins-Rechner"

# Deutsche Einstellungen
VITE_DEFAULT_LOCALE=de-DE
VITE_DEFAULT_CURRENCY=EUR
```

## ☁️ Cloudflare Pages Deployment

### Übersicht

Das Projekt nutzt Cloudflare Pages für Frontend-Deployment mit globaler CDN-Beschleunigung, automatischem HTTPS und exzellenter Performance.

### Voraussetzungen

- Node.js 18+
- npm oder pnpm
- Cloudflare-Account
- Wrangler CLI (optional)

### Schnelle Bereitstellung

#### 1. Über Cloudflare Dashboard

1. Bei [Cloudflare Dashboard](https://dash.cloudflare.com) anmelden
2. **Pages** Bereich aufrufen
3. **Create a project** klicken
4. Git-Repository verbinden
5. Build-Einstellungen konfigurieren:
   ```
   Framework preset: Vue
   Build command: cd zinses-rechner-frontend && npm run build
   Build output directory: zinses-rechner-frontend/dist
   Root directory: /
   Node.js version: 18
   ```

#### 2. Umgebungsvariablen

In den Cloudflare Pages Projekteinstellungen folgende Variablen hinzufügen:

```bash
# Produktionsumgebung
VITE_API_BASE_URL=https://api.zinses-rechner.de
VITE_APP_TITLE=Zinseszins-Rechner
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true

# Deutsche Lokalisierung
VITE_DEFAULT_LOCALE=de-DE
VITE_DEFAULT_CURRENCY=EUR

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_MATOMO_URL=https://analytics.your-domain.com
VITE_MATOMO_SITE_ID=1
```

#### 3. Custom Domain Setup

1. In Cloudflare Pages Projekt zu **Custom domains** navigieren
2. 添加域名：`zinses-rechner.de`
3. 配置DNS记录（如果域名在Cloudflare管理）
4. 等待SSL证书自动配置

## 手动部署

### 使用部署脚本

```bash
# 赋予执行权限
chmod +x scripts/deploy.sh

# 部署到生产环境
./scripts/deploy.sh production

# 部署到测试环境
./scripts/deploy.sh staging
```

### 使用Wrangler CLI

```bash
# 安装Wrangler
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 构建项目
cd zinses-rechner-frontend
npm run build

# 部署到Pages
wrangler pages deploy dist --project-name zinses-rechner
```

## 性能优化配置

### 1. 缓存策略

项目已配置优化的缓存规则：

- **静态资源** (JS/CSS/字体): 1年缓存
- **HTML文件**: 1小时缓存
- **图片资源**: 1年缓存

### 2. 压缩和优化

- Gzip/Brotli压缩自动启用
- 代码分割和懒加载
- Tree-shaking移除未使用代码
- 图片优化和WebP支持

### 3. CDN配置

Cloudflare自动提供：
- 全球200+数据中心
- 智能路由优化
- DDoS防护
- Web应用防火墙

## 安全配置

### 1. 安全头设置

项目配置了以下安全头：

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: 严格的CSP策略
```

### 2. HTTPS强制

- 自动HTTPS重定向
- HSTS头配置
- 现代TLS配置

## 监控和分析

### 1. Core Web Vitals

监控关键性能指标：
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### 2. 错误监控

可选集成：
- Sentry错误追踪
- Google Analytics
- Hotjar用户行为分析

## 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 检查Node.js版本
   node --version  # 需要18+
   
   # 清理缓存
   npm ci
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **环境变量未生效**
   - 确保变量名以`VITE_`开头
   - 重新部署项目
   - 检查Cloudflare Pages设置

3. **API连接问题**
   - 检查CORS配置
   - 验证API端点可访问性
   - 确认SSL证书有效

### 日志查看

```bash
# Cloudflare Pages部署日志
wrangler pages deployment list --project-name zinses-rechner

# 实时日志
wrangler pages deployment tail --project-name zinses-rechner
```

## 回滚策略

### 快速回滚

1. 在Cloudflare Dashboard中进入项目
2. 选择 **Deployments** 标签
3. 找到上一个稳定版本
4. 点击 **Rollback to this deployment**

### Git回滚

```bash
# 回滚到上一个提交
git revert HEAD
git push origin main

# Cloudflare Pages会自动重新部署
```

## 性能基准

### 目标指标

- **首屏加载时间**: < 2.5秒
- **Time to Interactive**: < 3.5秒
- **Lighthouse分数**: > 90分
- **可用性**: 99.9%

### 优化建议

1. **图片优化**: 使用WebP格式
2. **字体优化**: 预加载关键字体
3. **代码分割**: 按路由分割代码
4. **缓存策略**: 合理设置缓存时间

## 联系支持

如遇到部署问题：

1. 检查 [Cloudflare Status](https://www.cloudflarestatus.com/)
2. 查看项目Issues
3. 联系技术支持

---

**注意**: 本文档假设您已经有Cloudflare账户和基本的Git知识。如需详细的Cloudflare Pages教程，请参考[官方文档](https://developers.cloudflare.com/pages/)。
