# Zinses Rechner - 部署指南

这是德国利息计算器（Zinses Rechner）的完整部署指南，包含开发环境设置、生产部署和运维管理的详细说明。

## 目录

- [系统要求](#系统要求)
- [开发环境设置](#开发环境设置)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [云平台部署](#云平台部署)
- [环境变量配置](#环境变量配置)
- [SSL证书配置](#ssl证书配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)
- [维护和更新](#维护和更新)

## 系统要求

### 最低要求
- **Node.js**: 18.0.0 或更高版本
- **npm**: 9.0.0 或更高版本
- **内存**: 2GB RAM
- **存储**: 5GB 可用空间
- **操作系统**: Linux (Ubuntu 20.04+), macOS 10.15+, Windows 10+

### 推荐配置
- **Node.js**: 20.x LTS
- **npm**: 10.x
- **内存**: 4GB RAM
- **存储**: 10GB SSD
- **CPU**: 2核心或更多

### 生产环境要求
- **服务器**: Linux (Ubuntu 22.04 LTS 推荐)
- **反向代理**: Nginx 1.20+ 或 Apache 2.4+
- **SSL证书**: Let's Encrypt 或商业证书
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **CPU**: 4核心或更多

## 开发环境设置

### 1. 克隆项目

```bash
git clone https://github.com/your-org/zinses-rechner.git
cd zinses-rechner/zinses-rechner-frontend
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 3. 环境变量配置

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

必需的环境变量：
```env
VITE_APP_TITLE="Zinses Rechner"
VITE_APP_URL="http://localhost:5173"
VITE_API_BASE_URL="http://localhost:3000/api"
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

### 5. 运行测试

```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

## 生产环境部署

### 方法一：传统部署

#### 1. 构建应用

```bash
# 安装依赖
npm ci --only=production

# 构建生产版本
npm run build

# 验证构建
npm run preview
```

#### 2. 服务器配置

**Nginx配置示例** (`/etc/nginx/sites-available/zinses-rechner`):

```nginx
server {
    listen 80;
    server_name zinses-rechner.de www.zinses-rechner.de;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name zinses-rechner.de www.zinses-rechner.de;

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/zinses-rechner.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zinses-rechner.de/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 根目录
    root /var/www/zinses-rechner/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
        
        # 防止HTML缓存
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # API代理（如果需要）
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. 部署脚本

创建部署脚本 `deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 开始部署 Zinses Rechner..."

# 变量
DEPLOY_DIR="/var/www/zinses-rechner"
BACKUP_DIR="/var/backups/zinses-rechner"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建备份
echo "📦 创建备份..."
sudo mkdir -p $BACKUP_DIR
sudo cp -r $DEPLOY_DIR $BACKUP_DIR/backup_$TIMESTAMP

# 构建应用
echo "🔨 构建应用..."
npm ci --only=production
npm run build

# 部署文件
echo "📁 部署文件..."
sudo rm -rf $DEPLOY_DIR/dist
sudo cp -r dist $DEPLOY_DIR/

# 设置权限
sudo chown -R www-data:www-data $DEPLOY_DIR
sudo chmod -R 755 $DEPLOY_DIR

# 重启服务
echo "🔄 重启服务..."
sudo systemctl reload nginx

# 验证部署
echo "✅ 验证部署..."
curl -f https://zinses-rechner.de > /dev/null && echo "部署成功！" || echo "部署验证失败！"

echo "🎉 部署完成！"
```

### 方法二：PM2部署

```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'zinses-rechner',
    script: 'npx',
    args: 'serve -s dist -l 3000',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Docker部署

### 1. 使用预构建镜像

```bash
# 拉取镜像
docker pull zinses-rechner/frontend:latest

# 运行容器
docker run -d \
  --name zinses-rechner-frontend \
  -p 80:80 \
  -p 443:443 \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  zinses-rechner/frontend:latest
```

### 2. 使用Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    image: zinses-rechner/frontend:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 可选：添加后端服务
  # backend:
  #   image: zinses-rechner/backend:latest
  #   ports:
  #     - "3000:3000"
  #   environment:
  #     - NODE_ENV=production
  #   restart: unless-stopped
```

启动服务：

```bash
docker-compose up -d
```

### 3. 自定义构建

```bash
# 构建镜像
docker build -t zinses-rechner/frontend:latest .

# 运行容器
docker run -d \
  --name zinses-rechner \
  -p 80:80 \
  -e NODE_ENV=production \
  zinses-rechner/frontend:latest
```

## 云平台部署

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 配置构建设置：
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`

3. 设置环境变量：
   ```
   VITE_APP_TITLE=Zinses Rechner
   VITE_APP_URL=https://zinses-rechner.vercel.app
   ```

### Netlify部署

1. 连接GitHub仓库到Netlify
2. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`

3. 创建 `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### AWS S3 + CloudFront

```bash
# 安装AWS CLI
aws configure

# 同步到S3
aws s3 sync dist/ s3://zinses-rechner-bucket --delete

# 清除CloudFront缓存
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 环境变量配置

### 开发环境 (.env.local)
```env
VITE_NODE_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api
VITE_DEBUG_MODE=true
VITE_ENABLE_DEVTOOLS=true
```

### 生产环境 (.env.production)
```env
VITE_NODE_ENV=production
VITE_APP_URL=https://zinses-rechner.de
VITE_API_BASE_URL=https://api.zinses-rechner.de
VITE_DEBUG_MODE=false
VITE_ENABLE_DEVTOOLS=false
VITE_GENERATE_SOURCEMAP=false
```

### 敏感信息管理

使用环境变量管理敏感信息：

```bash
# 设置系统环境变量
export VITE_ECB_API_KEY="your-api-key"
export VITE_SENTRY_DSN="your-sentry-dsn"

# 或使用.env文件（不要提交到版本控制）
echo "VITE_ECB_API_KEY=your-api-key" >> .env.local
```

## SSL证书配置

### Let's Encrypt证书

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d zinses-rechner.de -d www.zinses-rechner.de

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 商业证书

1. 生成CSR：
```bash
openssl req -new -newkey rsa:2048 -nodes -keyout zinses-rechner.de.key -out zinses-rechner.de.csr
```

2. 购买并下载证书

3. 配置Nginx：
```nginx
ssl_certificate /path/to/zinses-rechner.de.crt;
ssl_certificate_key /path/to/zinses-rechner.de.key;
```

## 监控和日志

### 应用监控

1. **健康检查端点**：
   - URL: `/health`
   - 返回: `{"status": "ok", "timestamp": "..."}`

2. **性能监控**：
   - 集成Sentry进行错误监控
   - 使用Google Analytics进行用户行为分析

3. **服务器监控**：
```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 查看系统状态
htop
df -h
free -h
```

### 日志管理

1. **Nginx日志**：
```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

2. **应用日志**：
```bash
# PM2日志
pm2 logs zinses-rechner

# Docker日志
docker logs zinses-rechner-frontend
```

3. **日志轮转**：
```bash
# 配置logrotate
sudo nano /etc/logrotate.d/zinses-rechner
```

## 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存
npm run clean
rm -rf node_modules package-lock.json
npm install

# 检查Node.js版本
node --version
npm --version
```

#### 2. 部署后白屏
- 检查控制台错误
- 验证资源路径
- 检查环境变量配置
- 确认服务器配置正确

#### 3. SSL证书问题
```bash
# 检查证书状态
sudo certbot certificates

# 测试SSL配置
openssl s_client -connect zinses-rechner.de:443
```

#### 4. 性能问题
- 启用Gzip压缩
- 配置静态资源缓存
- 使用CDN
- 优化图片大小

### 调试工具

1. **浏览器开发者工具**
2. **Lighthouse性能审计**
3. **网络监控工具**
4. **服务器监控面板**

## 维护和更新

### 定期维护任务

1. **每周**：
   - 检查系统更新
   - 监控性能指标
   - 备份重要数据

2. **每月**：
   - 更新依赖包
   - 安全扫描
   - 性能优化

3. **每季度**：
   - 全面安全审计
   - 容量规划评估
   - 灾难恢复测试

### 更新流程

1. **准备阶段**：
```bash
# 创建备份
./scripts/backup.sh

# 检查依赖更新
npm outdated
```

2. **测试阶段**：
```bash
# 在测试环境部署
npm run build:staging
npm run test:e2e
```

3. **生产部署**：
```bash
# 执行部署脚本
./deploy.sh

# 验证部署
./scripts/health-check.sh
```

### 回滚计划

```bash
# 快速回滚脚本
#!/bin/bash
BACKUP_DIR="/var/backups/zinses-rechner"
LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -n1)
sudo cp -r $BACKUP_DIR/$LATEST_BACKUP /var/www/zinses-rechner
sudo systemctl reload nginx
```

## 支持和联系

- **技术支持**: tech-support@zinses-rechner.de
- **文档**: https://docs.zinses-rechner.de
- **问题报告**: https://github.com/your-org/zinses-rechner/issues
- **社区论坛**: https://community.zinses-rechner.de

---

**注意**: 本文档会定期更新。请确保使用最新版本的部署指南。
