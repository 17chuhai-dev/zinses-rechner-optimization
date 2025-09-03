# Cloudflare DNS配置
# Zinses-Rechner域名和SSL设置

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Cloudflare提供商配置
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# 变量定义
variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for zinses-rechner.de"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

# 域名区域配置
data "cloudflare_zone" "main" {
  zone_id = var.cloudflare_zone_id
}

# 主域名DNS记录 - 指向Cloudflare Pages
resource "cloudflare_record" "root" {
  zone_id = data.cloudflare_zone.main.id
  name    = "@"
  value   = "zinses-rechner.pages.dev"
  type    = "CNAME"
  proxied = true
  comment = "主域名指向Cloudflare Pages"
}

# www子域名重定向到主域名
resource "cloudflare_record" "www" {
  zone_id = data.cloudflare_zone.main.id
  name    = "www"
  value   = "zinses-rechner.de"
  type    = "CNAME"
  proxied = true
  comment = "www重定向到主域名"
}

# API子域名 - 指向Cloudflare Workers
resource "cloudflare_record" "api" {
  zone_id = data.cloudflare_zone.main.id
  name    = "api"
  value   = "zinses-rechner-api.your-subdomain.workers.dev"
  type    = "CNAME"
  proxied = true
  comment = "API域名指向Cloudflare Workers"
}

# 监控子域名 - 指向监控仪表盘
resource "cloudflare_record" "monitoring" {
  zone_id = data.cloudflare_zone.main.id
  name    = "monitoring"
  value   = "zinses-rechner-monitoring.pages.dev"
  type    = "CNAME"
  proxied = true
  comment = "监控仪表盘域名"
}

# 邮件验证记录（用于SSL证书验证）
resource "cloudflare_record" "mx" {
  zone_id  = data.cloudflare_zone.main.id
  name     = "@"
  value    = "mail.zinses-rechner.de"
  type     = "MX"
  priority = 10
  proxied  = false
  comment  = "邮件服务器记录"
}

# SPF记录（邮件安全）
resource "cloudflare_record" "spf" {
  zone_id = data.cloudflare_zone.main.id
  name    = "@"
  value   = "v=spf1 include:_spf.google.com ~all"
  type    = "TXT"
  proxied = false
  comment = "SPF邮件验证记录"
}

# DMARC记录（邮件安全）
resource "cloudflare_record" "dmarc" {
  zone_id = data.cloudflare_zone.main.id
  name    = "_dmarc"
  value   = "v=DMARC1; p=quarantine; rua=mailto:dmarc@zinses-rechner.de"
  type    = "TXT"
  proxied = false
  comment = "DMARC邮件安全策略"
}

# SSL/TLS配置
resource "cloudflare_zone_settings_override" "ssl_settings" {
  zone_id = data.cloudflare_zone.main.id
  
  settings {
    # SSL/TLS加密模式
    ssl = "strict"
    
    # 始终使用HTTPS
    always_use_https = "on"
    
    # 自动HTTPS重写
    automatic_https_rewrites = "on"
    
    # 最小TLS版本
    min_tls_version = "1.2"
    
    # TLS 1.3支持
    tls_1_3 = "on"
    
    # HSTS配置
    security_header {
      enabled            = true
      max_age            = 31536000
      include_subdomains = true
      preload            = true
    }
    
    # 开发者模式（生产环境关闭）
    development_mode = "off"
    
    # 缓存级别
    cache_level = "aggressive"
    
    # 浏览器缓存TTL
    browser_cache_ttl = 14400 # 4小时
    
    # 挑战通过时间
    challenge_ttl = 1800
    
    # 安全级别
    security_level = "medium"
    
    # Bot管理
    bot_management = {
      enabled = true
    }
  }
}

# 页面规则 - 缓存和性能优化
resource "cloudflare_page_rule" "cache_static_assets" {
  zone_id  = data.cloudflare_zone.main.id
  target   = "zinses-rechner.de/assets/*"
  priority = 1
  status   = "active"

  actions {
    cache_level         = "cache_everything"
    edge_cache_ttl      = 31536000 # 1年
    browser_cache_ttl   = 31536000 # 1年
  }
}

resource "cloudflare_page_rule" "cache_api_responses" {
  zone_id  = data.cloudflare_zone.main.id
  target   = "api.zinses-rechner.de/api/v1/calculate/*"
  priority = 2
  status   = "active"

  actions {
    cache_level       = "cache_everything"
    edge_cache_ttl    = 300 # 5分钟
    browser_cache_ttl = 300 # 5分钟
  }
}

# 防火墙规则 - 安全防护
resource "cloudflare_filter" "block_malicious_requests" {
  zone_id     = data.cloudflare_zone.main.id
  description = "阻止恶意请求"
  expression  = "(cf.threat_score gt 14) or (http.request.uri.path contains \"wp-admin\") or (http.request.uri.path contains \".env\")"
}

resource "cloudflare_firewall_rule" "security_rule" {
  zone_id     = data.cloudflare_zone.main.id
  description = "基础安全防护规则"
  filter_id   = cloudflare_filter.block_malicious_requests.id
  action      = "block"
  priority    = 1
}

# 速率限制规则
resource "cloudflare_rate_limit" "api_rate_limit" {
  zone_id   = data.cloudflare_zone.main.id
  threshold = 100
  period    = 900 # 15分钟
  
  match {
    request {
      url_pattern = "api.zinses-rechner.de/api/v1/calculate/*"
      schemes     = ["HTTPS"]
      methods     = ["POST"]
    }
  }
  
  action {
    mode    = "ban"
    timeout = 3600 # 1小时
    
    response {
      content_type = "application/json"
      body         = jsonencode({
        error = "Rate limit exceeded"
        message = "Zu viele Anfragen. Bitte versuchen Sie es später erneut."
        retry_after = 3600
      })
    }
  }
  
  correlate {
    by = "cf.colo.id"
  }
  
  disabled = false
  description = "API请求速率限制"
}

# 输出配置
output "domain_status" {
  description = "域名配置状态"
  value = {
    main_domain    = "zinses-rechner.de"
    api_domain     = "api.zinses-rechner.de"
    monitoring_domain = "monitoring.zinses-rechner.de"
    ssl_status     = "active"
    nameservers    = data.cloudflare_zone.main.name_servers
  }
}

output "dns_records" {
  description = "DNS记录配置"
  value = {
    root_record = cloudflare_record.root.hostname
    api_record  = cloudflare_record.api.hostname
    monitoring_record = cloudflare_record.monitoring.hostname
  }
}
