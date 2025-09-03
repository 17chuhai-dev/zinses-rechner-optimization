# Zinses Rechner - 配置指南

本文档详细说明了德国利息计算器的各种配置选项和最佳实践。

## 目录

- [环境变量配置](#环境变量配置)
- [构建配置](#构建配置)
- [服务器配置](#服务器配置)
- [安全配置](#安全配置)
- [性能配置](#性能配置)
- [监控配置](#监控配置)
- [第三方集成](#第三方集成)

## 环境变量配置

### 基础应用配置

```bash
# 应用基本信息
VITE_APP_TITLE="Zinses Rechner"                    # 应用标题
VITE_APP_DESCRIPTION="Professional German Financial Calculator"  # 应用描述
VITE_APP_VERSION="1.0.0"                          # 应用版本
VITE_APP_AUTHOR="Zinses Rechner Team"             # 开发团队

# 环境设置
VITE_NODE_ENV="production"                         # 运行环境
VITE_APP_ENV="production"                          # 应用环境

# URL配置
VITE_APP_URL="https://zinses-rechner.de"          # 应用URL
VITE_API_BASE_URL="https://api.zinses-rechner.de" # API基础URL
VITE_CDN_URL="https://cdn.zinses-rechner.de"      # CDN URL
```

### 安全配置

```bash
# 内容安全策略
VITE_CSP_NONCE=""                                  # CSP随机数
VITE_CSP_REPORT_URI="/api/csp-report"             # CSP报告端点

# 加密配置
VITE_ENCRYPTION_SALT="your-unique-salt-here"      # 加密盐值
VITE_STORAGE_ENCRYPTION_KEY="your-storage-key"    # 存储加密密钥

# JWT配置（仅用于客户端验证）
VITE_JWT_PUBLIC_KEY=""                             # JWT公钥
```

### 第三方API配置

```bash
# 欧洲央行API
VITE_ECB_API_URL="https://api.ecb.europa.eu/v1"
VITE_ECB_API_KEY=""                                # API密钥

# 德国央行API
VITE_BUNDESBANK_API_URL="https://api.bundesbank.de/bbk"
VITE_BUNDESBANK_API_KEY=""                         # API密钥

# Yahoo Finance API
VITE_YAHOO_FINANCE_API_URL="https://query1.finance.yahoo.com/v8/finance"
VITE_YAHOO_FINANCE_API_KEY=""                      # API密钥

# Fixer.io汇率API
VITE_FIXER_API_URL="https://api.fixer.io/v1"
VITE_FIXER_API_KEY=""                              # API密钥
```

### 监控和分析配置

```bash
# Google Analytics
VITE_GA_MEASUREMENT_ID=""                          # GA测量ID

# Sentry错误监控
VITE_SENTRY_DSN=""                                 # Sentry DSN
VITE_SENTRY_ENVIRONMENT="production"               # 环境标识
VITE_SENTRY_RELEASE=""                             # 发布版本

# 性能监控
VITE_PERFORMANCE_MONITORING_ENDPOINT=""            # 性能监控端点
VITE_PERFORMANCE_MONITORING_API_KEY=""             # API密钥
```

### 功能开关配置

```bash
# 实验性功能
VITE_ENABLE_EXPERIMENTAL_FEATURES="false"         # 实验性功能开关
VITE_ENABLE_AB_TESTING="false"                    # A/B测试开关

# 维护模式
VITE_MAINTENANCE_MODE="false"                     # 维护模式开关

# 用户功能
VITE_ENABLE_USER_REGISTRATION="true"              # 用户注册开关
VITE_ENABLE_SOCIAL_LOGIN="false"                  # 社交登录开关

# PWA功能
VITE_ENABLE_SERVICE_WORKER="true"                 # Service Worker开关
VITE_ENABLE_PUSH_NOTIFICATIONS="true"             # 推送通知开关
```

## 构建配置

### Vite配置 (vite.config.ts)

```typescript
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
        }
      })
    ],
    
    build: {
      target: 'es2020',
      minify: isProduction ? 'terser' : false,
      sourcemap: isProduction ? 'hidden' : true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-ui': ['@headlessui/vue', '@heroicons/vue'],
            'vendor-charts': ['chart.js', 'vue-chartjs'],
            'vendor-utils': ['date-fns', 'lodash-es']
          }
        }
      }
    },
    
    server: {
      port: parseInt(env.VITE_DEV_SERVER_PORT) || 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
```

### TypeScript配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@views/*": ["./src/views/*"],
      "@services/*": ["./src/services/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Tailwind CSS配置 (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## 服务器配置

### Nginx配置

```nginx
# /etc/nginx/sites-available/zinses-rechner
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
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    include /etc/nginx/conf.d/security-headers.conf;

    # 根目录
    root /var/www/zinses-rechner/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }

    # HTML文件不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name zinses-rechner.de www.zinses-rechner.de;
    return 301 https://$server_name$request_uri;
}
```

### 安全头配置 (/etc/nginx/conf.d/security-headers.conf)

```nginx
# 安全头配置
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.ecb.europa.eu https://api.bundesbank.de; frame-ancestors 'none'; base-uri 'self'; object-src 'none';" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" always;
```

## 安全配置

### 内容安全策略 (CSP)

```javascript
// 在index.html中配置CSP
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "https://api.ecb.europa.eu", "https://api.bundesbank.de"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"]
}
```

### 环境变量安全

```bash
# 生产环境变量文件权限
chmod 600 .env.production

# 使用系统环境变量
export VITE_ECB_API_KEY="$(cat /etc/secrets/ecb-api-key)"
export VITE_SENTRY_DSN="$(cat /etc/secrets/sentry-dsn)"
```

## 性能配置

### 缓存策略

```javascript
// Service Worker缓存配置
const cacheConfig = {
  // 静态资源缓存
  staticAssets: {
    strategy: 'CacheFirst',
    maxAge: 365 * 24 * 60 * 60, // 1年
    maxEntries: 100
  },
  
  // API响应缓存
  apiResponses: {
    strategy: 'NetworkFirst',
    maxAge: 5 * 60, // 5分钟
    maxEntries: 50
  },
  
  // 图片缓存
  images: {
    strategy: 'CacheFirst',
    maxAge: 30 * 24 * 60 * 60, // 30天
    maxEntries: 60
  }
}
```

### 代码分割配置

```javascript
// vite.config.ts中的代码分割配置
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 核心框架
          if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
            return 'vendor-core'
          }
          
          // UI组件
          if (id.includes('@headlessui') || id.includes('@heroicons')) {
            return 'vendor-ui'
          }
          
          // 图表库
          if (id.includes('chart.js') || id.includes('vue-chartjs')) {
            return 'vendor-charts'
          }
          
          // 工具库
          if (id.includes('date-fns') || id.includes('lodash')) {
            return 'vendor-utils'
          }
          
          // 第三方库
          if (id.includes('node_modules')) {
            return 'vendor-libs'
          }
        }
      }
    }
  }
})
```

## 监控配置

### Sentry配置

```javascript
// src/main.ts
import * as Sentry from "@sentry/vue"

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay()
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}
```

### Google Analytics配置

```javascript
// src/plugins/analytics.ts
import { gtag } from 'ga-gtag'

export const initAnalytics = () => {
  if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
    gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href
    })
  }
}
```

## 第三方集成

### API客户端配置

```typescript
// src/services/ApiClient.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证头
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 处理认证失败
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### PWA配置

```javascript
// vite.config.ts中的PWA配置
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 // 24小时
          }
        }
      }
    ]
  },
  manifest: {
    name: 'Zinses Rechner',
    short_name: 'ZinsesRechner',
    description: 'Professional German Financial Calculator',
    theme_color: '#2563eb',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
})
```

## 配置验证

### 环境变量验证脚本

```bash
#!/bin/bash
# scripts/validate-config.sh

echo "🔍 验证配置..."

# 检查必需的环境变量
required_vars=(
  "VITE_APP_TITLE"
  "VITE_APP_URL"
  "VITE_API_BASE_URL"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ 缺少必需的环境变量: $var"
    exit 1
  else
    echo "✅ $var: ${!var}"
  fi
done

echo "🎉 配置验证通过！"
```

### 配置测试

```typescript
// tests/config.test.ts
import { describe, it, expect } from 'vitest'

describe('Configuration', () => {
  it('should have required environment variables', () => {
    expect(import.meta.env.VITE_APP_TITLE).toBeDefined()
    expect(import.meta.env.VITE_APP_URL).toBeDefined()
    expect(import.meta.env.VITE_API_BASE_URL).toBeDefined()
  })

  it('should have valid API URLs', () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL
    expect(apiUrl).toMatch(/^https?:\/\//)
  })
})
```

---

**注意**: 请根据实际部署环境调整配置参数，并确保敏感信息的安全性。定期审查和更新配置以保持最佳性能和安全性。
