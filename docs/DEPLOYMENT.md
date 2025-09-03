# Zinses-Rechner 部署指南

## 🎯 部署概览

本指南详细说明如何将 Zinses-Rechner 部署到生产环境，包括 Cloudflare Pages (前端) 和 Cloudflare Workers (API)。

## 🔧 部署前准备

### 必需工具

```bash
# 安装 Cloudflare CLI
npm install -g wrangler

# 验证安装
wrangler --version
```

### 环境变量配置

创建 `.env.production` 文件：

```bash
# Cloudflare 配置
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# 应用配置
VITE_API_BASE_URL=https://api.zinses-rechner.de
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true

# 监控配置
SLACK_WEBHOOK_URL=your_slack_webhook
EMAIL_SMTP_SERVER=your_smtp_server

# 安全配置
SECURITY_KEY=your_security_key
RATE_LIMIT_REDIS_URL=your_redis_url
```

### Cloudflare 账户设置

1. **创建 Cloudflare 账户**: https://dash.cloudflare.com
2. **添加域名**: zinses-rechner.de
3. **配置 DNS**: 指向 Cloudflare 名称服务器
4. **获取 API Token**: 具有 Zone:Edit 和 Workers:Edit 权限

## 🚀 前端部署 (Cloudflare Pages)

### 1. 构建前端应用

```bash
cd zinses-rechner-frontend

# 安装依赖
npm ci

# 生产构建
npm run build

# 验证构建产物
ls -la dist/
```

### 2. 部署到 Cloudflare Pages

#### 方法 A: 使用 Wrangler CLI

```bash
# 初始化 Pages 项目
npx wrangler pages project create zinses-rechner

# 部署构建产物
npx wrangler pages deploy dist --project-name=zinses-rechner

# 配置自定义域名
npx wrangler pages domain add zinses-rechner.de --project-name=zinses-rechner
```

#### 方法 B: 使用 GitHub Actions

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend to Cloudflare Pages

on:
  push:
    branches: [main]
    paths: ['zinses-rechner-frontend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: zinses-rechner-frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: zinses-rechner-frontend
        run: npm ci
      
      - name: Build application
        working-directory: zinses-rechner-frontend
        run: npm run build
        env:
          VITE_API_BASE_URL: https://api.zinses-rechner.de
          VITE_ENVIRONMENT: production
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: zinses-rechner
          directory: zinses-rechner-frontend/dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### 3. 配置 Pages 设置

```bash
# 设置环境变量
npx wrangler pages secret put VITE_API_BASE_URL --project-name=zinses-rechner
# 输入: https://api.zinses-rechner.de

npx wrangler pages secret put VITE_ENVIRONMENT --project-name=zinses-rechner
# 输入: production

# 配置重定向规则
echo "/*    /index.html   200" > zinses-rechner-frontend/dist/_redirects

# 配置安全头
cat > zinses-rechner-frontend/dist/_headers << EOF
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  
/*.js
  Cache-Control: public, max-age=31536000, immutable
  
/*.css
  Cache-Control: public, max-age=31536000, immutable
  
/*.png
  Cache-Control: public, max-age=31536000, immutable
  
/*.jpg
  Cache-Control: public, max-age=31536000, immutable
EOF
```

## ⚡ API 部署 (Cloudflare Workers)

### 1. 配置 Workers 项目

```bash
cd cloudflare-workers/api-worker

# 登录 Cloudflare
npx wrangler login

# 初始化项目
npx wrangler init --from-dash
```

### 2. 配置 wrangler.toml

```toml
name = "zinses-rechner-api"
compatibility_date = "2024-01-15"
main = "src/index.ts"

# 生产环境配置
[env.production]
route = "api.zinses-rechner.de/*"

[[env.production.d1_databases]]
binding = "DB"
database_name = "zinses-rechner-prod"
database_id = "your-database-id"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[env.production.vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://zinses-rechner.de"
LOG_LEVEL = "info"

# 测试环境配置
[env.staging]
route = "staging-api.zinses-rechner.de/*"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "zinses-rechner-staging"
database_id = "your-staging-database-id"

[env.staging.vars]
ENVIRONMENT = "staging"
CORS_ORIGIN = "https://staging.zinses-rechner.de"
LOG_LEVEL = "debug"
```

### 3. 数据库设置

```bash
# 创建生产数据库
npx wrangler d1 create zinses-rechner-prod

# 创建测试数据库
npx wrangler d1 create zinses-rechner-staging

# 运行数据库迁移
npx wrangler d1 migrations apply zinses-rechner-prod --env production
npx wrangler d1 migrations apply zinses-rechner-staging --env staging
```

### 4. 部署 Workers

```bash
# 部署到测试环境
npx wrangler deploy --env staging

# 验证测试环境
curl https://staging-api.zinses-rechner.de/health

# 部署到生产环境
npx wrangler deploy --env production

# 验证生产环境
curl https://api.zinses-rechner.de/health
```

## 🌐 DNS 和域名配置

### 1. DNS 记录配置

```bash
# 主域名 (A记录或CNAME)
zinses-rechner.de.           300    IN    A       192.0.2.1
www.zinses-rechner.de.       300    IN    CNAME   zinses-rechner.de

# API 子域名
api.zinses-rechner.de.       300    IN    CNAME   api.zinses-rechner.de.workers.dev

# 监控子域名
monitoring.zinses-rechner.de. 300   IN    CNAME   monitoring.zinses-rechner.de.pages.dev

# 邮件记录 (可选)
@                            300    IN    MX      10 mail.zinses-rechner.de
```

### 2. SSL/TLS 配置

```bash
# 启用 Universal SSL
# 在 Cloudflare Dashboard > SSL/TLS > Overview
# 设置为 "Full (strict)"

# 配置 HSTS
# SSL/TLS > Edge Certificates > HTTP Strict Transport Security (HSTS)
# 启用 HSTS，设置 max-age=31536000，包含子域名
```

### 3. 安全设置

```bash
# 在 Cloudflare Dashboard 配置:

# Security > WAF
# 启用 OWASP Core Ruleset
# 添加自定义规则阻止恶意请求

# Security > DDoS
# 启用 DDoS 防护

# Security > Bot Management
# 配置机器人检测和缓解
```

## 📊 监控和告警设置

### 1. Cloudflare Analytics 配置

```bash
# 启用 Web Analytics
# Dashboard > Analytics > Web Analytics
# 添加 zinses-rechner.de

# 配置自定义事件跟踪
# 在前端代码中添加:
```

```typescript
// 自定义事件跟踪
declare global {
  interface Window {
    cloudflareAnalytics?: {
      track: (eventName: string, properties?: Record<string, any>) => void
    }
  }
}

// 跟踪计算事件
window.cloudflareAnalytics?.track('calculation_completed', {
  principal_range: getPrincipalRange(form.principal),
  rate_range: getRateRange(form.annual_rate),
  years: form.years
})
```

### 2. 告警规则配置

```bash
# 使用 Cloudflare API 配置告警
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/alerting/policies" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Response Time Alert",
    "description": "Alert when API response time exceeds 1 second",
    "enabled": true,
    "alert_type": "http_alert_origin_error",
    "mechanisms": {
      "email": [{"id": "admin@zinses-rechner.de"}],
      "webhooks": [{"id": "slack-webhook-id"}]
    },
    "filters": {
      "zones": ["zinses-rechner.de"],
      "services": ["workers"]
    }
  }'
```

## 🔄 CI/CD 管道设置

### 1. GitHub Secrets 配置

在 GitHub Repository > Settings > Secrets 中添加：

```bash
# Cloudflare 认证
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# 通知配置
SLACK_WEBHOOK_URL=your_slack_webhook
EMAIL_SMTP_PASSWORD=your_smtp_password

# 安全扫描
SNYK_TOKEN=your_snyk_token
```

### 2. 完整部署工作流

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'production'
        type: choice
        options: ['staging', 'production']

jobs:
  # 构建和测试
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd zinses-rechner-frontend && npm ci
          cd ../cloudflare-workers/api-worker && npm ci
      
      - name: Run tests
        run: |
          cd zinses-rechner-frontend
          npm run test
          npm run type-check
          npm run lint
      
      - name: Build frontend
        working-directory: zinses-rechner-frontend
        run: npm run build
        env:
          VITE_API_BASE_URL: https://api.zinses-rechner.de
          VITE_ENVIRONMENT: ${{ github.event.inputs.environment || 'production' }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: zinses-rechner-frontend/dist

  # 安全扫描
  security-scan:
    runs-on: ubuntu-latest
    needs: build-and-test
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security scans
        run: ./security/scripts/run-security-scan.sh baseline
        env:
          TARGET_URL: https://zinses-rechner.de
          API_URL: https://api.zinses-rechner.de

  # 部署到 Staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build-and-test, security-scan]
    if: github.event.inputs.environment == 'staging' || github.ref == 'refs/heads/main'
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: zinses-rechner-frontend/dist
      
      - name: Deploy API to Staging
        working-directory: cloudflare-workers/api-worker
        run: npx wrangler deploy --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      - name: Deploy Frontend to Staging
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: zinses-rechner-staging
          directory: zinses-rechner-frontend/dist
      
      - name: Run staging verification
        run: ./scripts/verify-deployment.sh staging

  # 部署到 Production
  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.event.inputs.environment == 'production' || (github.ref == 'refs/heads/main' && needs.deploy-staging.result == 'success')
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: zinses-rechner-frontend/dist
      
      - name: Deploy API to Production
        working-directory: cloudflare-workers/api-worker
        run: npx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      - name: Deploy Frontend to Production
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: zinses-rechner
          directory: zinses-rechner-frontend/dist
      
      - name: Run production verification
        run: ./scripts/verify-deployment.sh production
      
      - name: Send deployment notification
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-type: application/json' \
            -d '{
              "text": "🚀 Zinses-Rechner successfully deployed to production!",
              "attachments": [{
                "color": "good",
                "fields": [
                  {"title": "Environment", "value": "Production", "short": true},
                  {"title": "Version", "value": "${{ github.sha }}", "short": true},
                  {"title": "Deployed by", "value": "${{ github.actor }}", "short": true}
                ]
              }]
            }'
```

## 🗄️ 数据库部署

### 1. 创建 D1 数据库

```bash
# 创建生产数据库
npx wrangler d1 create zinses-rechner-prod

# 创建测试数据库  
npx wrangler d1 create zinses-rechner-staging

# 记录数据库 ID 并更新 wrangler.toml
```

### 2. 数据库迁移

```bash
# 创建迁移文件
npx wrangler d1 migrations create initial-schema

# 编辑迁移文件
cat > migrations/0001_initial-schema.sql << EOF
-- 计算历史表
CREATE TABLE calculation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  principal REAL NOT NULL,
  annual_rate REAL NOT NULL,
  years INTEGER NOT NULL,
  monthly_payment REAL DEFAULT 0,
  compound_frequency TEXT DEFAULT 'monthly',
  final_amount REAL NOT NULL,
  total_interest REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT,
  user_agent_hash TEXT
);

-- 系统指标表
CREATE TABLE system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT,
  environment TEXT DEFAULT 'production'
);

-- 创建索引
CREATE INDEX idx_calculation_history_created_at ON calculation_history(created_at);
CREATE INDEX idx_calculation_history_session_id ON calculation_history(session_id);
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
EOF

# 应用迁移
npx wrangler d1 migrations apply zinses-rechner-prod --env production
npx wrangler d1 migrations apply zinses-rechner-staging --env staging
```

### 3. 数据库备份策略

```bash
# 创建备份脚本
cat > scripts/backup-database.sh << 'EOF'
#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/database"

mkdir -p "$BACKUP_DIR"

# 导出生产数据库
npx wrangler d1 export zinses-rechner-prod --env production \
  --output "$BACKUP_DIR/zinses-rechner-prod-$TIMESTAMP.sql"

echo "数据库备份完成: $BACKUP_DIR/zinses-rechner-prod-$TIMESTAMP.sql"
EOF

chmod +x scripts/backup-database.sh

# 设置定期备份 (crontab)
# 0 2 * * * /path/to/zinses-rechner/scripts/backup-database.sh
```

## 🔍 部署验证

### 1. 自动化验证脚本

```bash
# 创建部署验证脚本
cat > scripts/verify-deployment.sh << 'EOF'
#!/bin/bash

ENVIRONMENT=${1:-production}

if [ "$ENVIRONMENT" = "production" ]; then
  FRONTEND_URL="https://zinses-rechner.de"
  API_URL="https://api.zinses-rechner.de"
else
  FRONTEND_URL="https://staging.zinses-rechner.de"
  API_URL="https://staging-api.zinses-rechner.de"
fi

echo "🔍 验证 $ENVIRONMENT 环境部署..."

# 验证前端
echo "验证前端服务..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ 前端服务正常"
else
  echo "❌ 前端服务异常: HTTP $FRONTEND_STATUS"
  exit 1
fi

# 验证API
echo "验证API服务..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$API_STATUS" = "200" ]; then
  echo "✅ API服务正常"
else
  echo "❌ API服务异常: HTTP $API_STATUS"
  exit 1
fi

# 验证计算功能
echo "验证计算功能..."
CALC_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/calculate/compound-interest" \
  -H "Content-Type: application/json" \
  -d '{"principal": 1000, "annual_rate": 3, "years": 5}')

if echo "$CALC_RESPONSE" | jq -e '.final_amount' >/dev/null 2>&1; then
  echo "✅ 计算功能正常"
else
  echo "❌ 计算功能异常"
  exit 1
fi

echo "🎉 $ENVIRONMENT 环境验证通过！"
EOF

chmod +x scripts/verify-deployment.sh
```

### 2. 性能基准测试

```bash
# 创建性能测试脚本
cat > scripts/performance-benchmark.sh << 'EOF'
#!/bin/bash

ENVIRONMENT=${1:-production}
TARGET_URL="https://zinses-rechner.de"

if [ "$ENVIRONMENT" = "staging" ]; then
  TARGET_URL="https://staging.zinses-rechner.de"
fi

echo "⚡ 运行性能基准测试..."

# Lighthouse 测试
npx lighthouse "$TARGET_URL" \
  --output=json \
  --output-path="reports/lighthouse-$ENVIRONMENT.json" \
  --chrome-flags="--headless"

# 提取关键指标
PERFORMANCE_SCORE=$(jq -r '.categories.performance.score * 100' "reports/lighthouse-$ENVIRONMENT.json")
LCP=$(jq -r '.audits["largest-contentful-paint"].numericValue' "reports/lighthouse-$ENVIRONMENT.json")
FID=$(jq -r '.audits["max-potential-fid"].numericValue' "reports/lighthouse-$ENVIRONMENT.json")

echo "📊 性能指标:"
echo "  Performance Score: $PERFORMANCE_SCORE/100"
echo "  LCP: ${LCP}ms"
echo "  FID: ${FID}ms"

# 验证性能目标
if (( $(echo "$PERFORMANCE_SCORE >= 90" | bc -l) )); then
  echo "✅ 性能目标达成"
else
  echo "⚠️ 性能需要优化"
fi
EOF

chmod +x scripts/performance-benchmark.sh
```

## 🚨 回滚策略

### 1. 快速回滚

```bash
# API 回滚到上一个版本
npx wrangler rollback --env production

# 前端回滚 (通过 Git)
git revert HEAD
git push origin main
# GitHub Actions 会自动重新部署
```

### 2. 数据库回滚

```bash
# 如果需要数据库回滚
npx wrangler d1 migrations list zinses-rechner-prod --env production

# 回滚到特定迁移
npx wrangler d1 migrations apply zinses-rechner-prod --env production --to-migration=0001
```

## 📋 部署检查清单

### 部署前检查

- [ ] 所有测试通过
- [ ] 安全扫描无高危漏洞
- [ ] 性能测试达标
- [ ] 环境变量配置正确
- [ ] 数据库迁移准备就绪
- [ ] 监控告警配置完成

### 部署后验证

- [ ] 前端页面正常加载
- [ ] API 健康检查通过
- [ ] 计算功能正常工作
- [ ] 监控数据正常收集
- [ ] 告警规则正常触发
- [ ] 性能指标达标
- [ ] SSL 证书有效
- [ ] DNS 解析正确

### 生产环境监控

- [ ] 设置 24/7 监控告警
- [ ] 配置错误日志收集
- [ ] 建立事件响应流程
- [ ] 定期备份验证
- [ ] 性能趋势监控

## 🆘 紧急响应

### 服务中断处理

```bash
# 1. 快速诊断
curl -I https://zinses-rechner.de
curl -I https://api.zinses-rechner.de/health

# 2. 检查 Cloudflare 状态
curl https://www.cloudflarestatus.com/api/v2/status.json

# 3. 查看 Workers 日志
npx wrangler tail --env production

# 4. 如需紧急回滚
npx wrangler rollback --env production
```

### 联系信息

- **技术负责人**: tech@zinses-rechner.de
- **紧急联系**: +49-xxx-xxx-xxxx
- **Slack 频道**: #zinses-rechner-alerts

---

*部署指南版本: 1.0.0 | 最后更新: 2024-01-15*
