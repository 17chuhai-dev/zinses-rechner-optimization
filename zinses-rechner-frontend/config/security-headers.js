/**
 * 安全头配置
 * 为生产环境配置各种安全HTTP头
 */

// 内容安全策略配置
const cspConfig = {
  // 开发环境CSP - 较宽松
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // 开发环境允许内联脚本
      "'unsafe-eval'", // 开发环境允许eval
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // 允许内联样式
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http://localhost:*'
    ],
    'connect-src': [
      "'self'",
      'ws://localhost:*',
      'wss://localhost:*',
      'http://localhost:*',
      'https://api.ecb.europa.eu',
      'https://api.bundesbank.de',
      'https://query1.finance.yahoo.com',
      'https://api.fixer.io'
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },

  // 生产环境CSP - 严格
  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // 使用nonce而不是unsafe-inline
      "'nonce-{{CSP_NONCE}}'",
      'https://cdn.jsdelivr.net'
    ],
    'style-src': [
      "'self'",
      "'nonce-{{CSP_NONCE}}'",
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:'
    ],
    'connect-src': [
      "'self'",
      'https://api.ecb.europa.eu',
      'https://api.bundesbank.de',
      'https://query1.finance.yahoo.com',
      'https://api.fixer.io',
      'https://sentry.io' // 错误报告
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': [],
    'report-uri': ['/api/csp-report']
  }
}

// 权限策略配置
const permissionsPolicyConfig = {
  // 禁用不需要的浏览器功能
  'accelerometer': [],
  'ambient-light-sensor': [],
  'autoplay': [],
  'battery': [],
  'camera': [],
  'cross-origin-isolated': [],
  'display-capture': [],
  'document-domain': [],
  'encrypted-media': [],
  'execution-while-not-rendered': [],
  'execution-while-out-of-viewport': [],
  'fullscreen': ['self'],
  'geolocation': [],
  'gyroscope': [],
  'keyboard-map': [],
  'magnetometer': [],
  'microphone': [],
  'midi': [],
  'navigation-override': [],
  'payment': [],
  'picture-in-picture': [],
  'publickey-credentials-get': ['self'],
  'screen-wake-lock': [],
  'sync-xhr': [],
  'usb': [],
  'web-share': ['self'],
  'xr-spatial-tracking': []
}

// 生成CSP字符串
const generateCSP = (environment = 'production', nonce = null) => {
  const config = cspConfig[environment] || cspConfig.production
  
  return Object.entries(config)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive
      }
      
      let sourceList = sources.join(' ')
      
      // 替换nonce占位符
      if (nonce && sourceList.includes('{{CSP_NONCE}}')) {
        sourceList = sourceList.replace(/{{CSP_NONCE}}/g, nonce)
      }
      
      return `${directive} ${sourceList}`
    })
    .join('; ')
}

// 生成权限策略字符串
const generatePermissionsPolicy = () => {
  return Object.entries(permissionsPolicyConfig)
    .map(([directive, allowlist]) => {
      if (allowlist.length === 0) {
        return `${directive}=()`
      }
      return `${directive}=(${allowlist.map(origin => origin === 'self' ? 'self' : `"${origin}"`).join(' ')})`
    })
    .join(', ')
}

// 安全头配置
const securityHeaders = {
  // 基础安全头
  basic: {
    // 防止MIME类型嗅探
    'X-Content-Type-Options': 'nosniff',
    
    // 防止点击劫持
    'X-Frame-Options': 'DENY',
    
    // XSS保护
    'X-XSS-Protection': '1; mode=block',
    
    // 引用策略
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // 禁用DNS预取
    'X-DNS-Prefetch-Control': 'off',
    
    // 禁用下载选项
    'X-Download-Options': 'noopen',
    
    // 禁用内容类型选项
    'X-Permitted-Cross-Domain-Policies': 'none'
  },

  // HTTPS相关头
  https: {
    // HTTP严格传输安全
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // 期望CT
    'Expect-CT': 'max-age=86400, enforce, report-uri="/api/ct-report"'
  },

  // 动态头（需要运行时生成）
  dynamic: (environment = 'production', nonce = null) => ({
    // 内容安全策略
    'Content-Security-Policy': generateCSP(environment, nonce),
    
    // 权限策略
    'Permissions-Policy': generatePermissionsPolicy(),
    
    // 跨域嵌入策略
    'Cross-Origin-Embedder-Policy': 'require-corp',
    
    // 跨域开启策略
    'Cross-Origin-Opener-Policy': 'same-origin',
    
    // 跨域资源策略
    'Cross-Origin-Resource-Policy': 'same-origin'
  })
}

// Nginx配置生成器
const generateNginxConfig = (environment = 'production') => {
  const allHeaders = {
    ...securityHeaders.basic,
    ...securityHeaders.https,
    ...securityHeaders.dynamic(environment)
  }

  const nginxHeaders = Object.entries(allHeaders)
    .map(([header, value]) => `    add_header ${header} "${value}" always;`)
    .join('\n')

  return `
# 安全头配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name zinses-rechner.de www.zinses-rechner.de;

    # SSL配置
    ssl_certificate /etc/ssl/certs/zinses-rechner.de.crt;
    ssl_certificate_key /etc/ssl/private/zinses-rechner.de.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # 安全头
${nginxHeaders}

    # 静态资源缓存
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }

    # 主应用
    location / {
        try_files $uri $uri/ /index.html;
        
        # 防止缓存HTML文件
        location ~* \\.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # API代理
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # CSP报告端点
    location /api/csp-report {
        proxy_pass http://backend:3000/api/csp-report;
        proxy_set_header Content-Type application/csp-report;
    }
}

# HTTP到HTTPS重定向
server {
    listen 80;
    listen [::]:80;
    server_name zinses-rechner.de www.zinses-rechner.de;
    return 301 https://$server_name$request_uri;
}
`
}

// Apache配置生成器
const generateApacheConfig = (environment = 'production') => {
  const allHeaders = {
    ...securityHeaders.basic,
    ...securityHeaders.https,
    ...securityHeaders.dynamic(environment)
  }

  const apacheHeaders = Object.entries(allHeaders)
    .map(([header, value]) => `    Header always set ${header} "${value}"`)
    .join('\n')

  return `
<VirtualHost *:443>
    ServerName zinses-rechner.de
    ServerAlias www.zinses-rechner.de
    DocumentRoot /var/www/zinses-rechner

    # SSL配置
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/zinses-rechner.de.crt
    SSLCertificateKeyFile /etc/ssl/private/zinses-rechner.de.key
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off

    # 安全头
${apacheHeaders}

    # 静态资源缓存
    <LocationMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header append Cache-Control "public, immutable"
    </LocationMatch>

    # 防止HTML缓存
    <LocationMatch "\\.html$">
        ExpiresActive On
        ExpiresDefault "access minus 1 seconds"
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </LocationMatch>

    # SPA路由支持
    <Directory "/var/www/zinses-rechner">
        Options -Indexes
        AllowOverride None
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>

# HTTP到HTTPS重定向
<VirtualHost *:80>
    ServerName zinses-rechner.de
    ServerAlias www.zinses-rechner.de
    Redirect permanent / https://zinses-rechner.de/
</VirtualHost>
`
}

// 导出配置
module.exports = {
  cspConfig,
  permissionsPolicyConfig,
  securityHeaders,
  generateCSP,
  generatePermissionsPolicy,
  generateNginxConfig,
  generateApacheConfig,
  
  // 便捷方法
  getAllHeaders: (environment = 'production', nonce = null) => ({
    ...securityHeaders.basic,
    ...securityHeaders.https,
    ...securityHeaders.dynamic(environment, nonce)
  }),
  
  // 生成随机nonce
  generateNonce: () => {
    const array = new Uint8Array(16)
    require('crypto').getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}
