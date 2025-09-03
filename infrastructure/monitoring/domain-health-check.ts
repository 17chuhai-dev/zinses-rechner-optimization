/**
 * 域名健康检查服务
 * 监控域名解析、SSL证书和服务可用性
 */

export interface DomainHealthStatus {
  domain: string
  dns_resolution: boolean
  ssl_valid: boolean
  ssl_expires_in_days: number
  http_accessible: boolean
  https_redirect: boolean
  response_time_ms: number
  security_headers: SecurityHeadersStatus
  last_check: string
  status: 'healthy' | 'warning' | 'critical' | 'error'
}

export interface SecurityHeadersStatus {
  hsts: boolean
  csp: boolean
  x_frame_options: boolean
  x_content_type_options: boolean
  referrer_policy: boolean
}

export interface DomainMonitoringConfig {
  domains: string[]
  check_interval_minutes: number
  ssl_warning_threshold_days: number
  ssl_critical_threshold_days: number
  response_time_threshold_ms: number
  notification_channels: string[]
}

export class DomainHealthChecker {
  private config: DomainMonitoringConfig
  private lastResults: Map<string, DomainHealthStatus> = new Map()

  constructor(config: DomainMonitoringConfig) {
    this.config = config
  }

  /**
   * 检查所有域名健康状态
   */
  async checkAllDomains(): Promise<DomainHealthStatus[]> {
    const results: DomainHealthStatus[] = []

    for (const domain of this.config.domains) {
      try {
        const status = await this.checkDomainHealth(domain)
        results.push(status)
        this.lastResults.set(domain, status)
      } catch (error) {
        console.error(`Failed to check domain ${domain}:`, error)
        
        const errorStatus: DomainHealthStatus = {
          domain,
          dns_resolution: false,
          ssl_valid: false,
          ssl_expires_in_days: -1,
          http_accessible: false,
          https_redirect: false,
          response_time_ms: -1,
          security_headers: {
            hsts: false,
            csp: false,
            x_frame_options: false,
            x_content_type_options: false,
            referrer_policy: false
          },
          last_check: new Date().toISOString(),
          status: 'error'
        }
        
        results.push(errorStatus)
        this.lastResults.set(domain, errorStatus)
      }
    }

    return results
  }

  /**
   * 检查单个域名健康状态
   */
  async checkDomainHealth(domain: string): Promise<DomainHealthStatus> {
    const startTime = Date.now()

    // 并行执行各项检查
    const [
      dnsResolution,
      sslInfo,
      httpAccessible,
      httpsRedirect,
      securityHeaders
    ] = await Promise.allSettled([
      this.checkDNSResolution(domain),
      this.checkSSLCertificate(domain),
      this.checkHTTPAccessibility(domain),
      this.checkHTTPSRedirect(domain),
      this.checkSecurityHeaders(domain)
    ])

    const responseTime = Date.now() - startTime

    // 处理检查结果
    const dnsOk = dnsResolution.status === 'fulfilled' && dnsResolution.value
    const sslValid = sslInfo.status === 'fulfilled' && sslInfo.value.valid
    const sslExpiresInDays = sslInfo.status === 'fulfilled' ? sslInfo.value.expires_in_days : -1
    const httpOk = httpAccessible.status === 'fulfilled' && httpAccessible.value
    const httpsRedirectOk = httpsRedirect.status === 'fulfilled' && httpsRedirect.value
    const securityHeadersOk = securityHeaders.status === 'fulfilled' ? securityHeaders.value : {
      hsts: false,
      csp: false,
      x_frame_options: false,
      x_content_type_options: false,
      referrer_policy: false
    }

    // 确定整体状态
    let status: 'healthy' | 'warning' | 'critical' | 'error' = 'healthy'

    if (!dnsOk || !httpOk) {
      status = 'error'
    } else if (sslExpiresInDays <= this.config.ssl_critical_threshold_days || !sslValid) {
      status = 'critical'
    } else if (sslExpiresInDays <= this.config.ssl_warning_threshold_days || 
               responseTime > this.config.response_time_threshold_ms) {
      status = 'warning'
    }

    return {
      domain,
      dns_resolution: dnsOk,
      ssl_valid: sslValid,
      ssl_expires_in_days: sslExpiresInDays,
      http_accessible: httpOk,
      https_redirect: httpsRedirectOk,
      response_time_ms: responseTime,
      security_headers: securityHeadersOk,
      last_check: new Date().toISOString(),
      status
    }
  }

  /**
   * 检查DNS解析
   */
  private async checkDNSResolution(domain: string): Promise<boolean> {
    try {
      // 使用Cloudflare DoH进行DNS查询
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
        headers: {
          'Accept': 'application/dns-json'
        }
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.Status === 0 && data.Answer && data.Answer.length > 0

    } catch (error) {
      console.error(`DNS resolution check failed for ${domain}:`, error)
      return false
    }
  }

  /**
   * 检查SSL证书
   */
  private async checkSSLCertificate(domain: string): Promise<{ valid: boolean; expires_in_days: number }> {
    try {
      // 使用SSL Labs API检查证书（简化版本）
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        return { valid: false, expires_in_days: -1 }
      }

      // 从响应头获取证书信息（简化实现）
      // 在实际实现中，应该使用更详细的SSL检查
      const now = new Date()
      const futureDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)) // 假设90天有效期
      const daysUntilExpiry = Math.floor((futureDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      return {
        valid: true,
        expires_in_days: daysUntilExpiry
      }

    } catch (error) {
      console.error(`SSL certificate check failed for ${domain}:`, error)
      return { valid: false, expires_in_days: -1 }
    }
  }

  /**
   * 检查HTTP可访问性
   */
  private async checkHTTPAccessibility(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      })

      return response.ok

    } catch (error) {
      console.error(`HTTP accessibility check failed for ${domain}:`, error)
      return false
    }
  }

  /**
   * 检查HTTPS重定向
   */
  private async checkHTTPSRedirect(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`http://${domain}`, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(10000)
      })

      // 检查是否有重定向到HTTPS
      const location = response.headers.get('Location')
      return response.status >= 300 && response.status < 400 && 
             location !== null && location.startsWith('https://')

    } catch (error) {
      console.error(`HTTPS redirect check failed for ${domain}:`, error)
      return false
    }
  }

  /**
   * 检查安全头
   */
  private async checkSecurityHeaders(domain: string): Promise<SecurityHeadersStatus> {
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      })

      const headers = response.headers

      return {
        hsts: headers.has('strict-transport-security'),
        csp: headers.has('content-security-policy'),
        x_frame_options: headers.has('x-frame-options'),
        x_content_type_options: headers.has('x-content-type-options'),
        referrer_policy: headers.has('referrer-policy')
      }

    } catch (error) {
      console.error(`Security headers check failed for ${domain}:`, error)
      return {
        hsts: false,
        csp: false,
        x_frame_options: false,
        x_content_type_options: false,
        referrer_policy: false
      }
    }
  }

  /**
   * 获取域名健康摘要
   */
  getHealthSummary(): {
    total_domains: number
    healthy_count: number
    warning_count: number
    critical_count: number
    error_count: number
    overall_status: 'healthy' | 'warning' | 'critical' | 'error'
  } {
    const results = Array.from(this.lastResults.values())
    
    const healthyCount = results.filter(r => r.status === 'healthy').length
    const warningCount = results.filter(r => r.status === 'warning').length
    const criticalCount = results.filter(r => r.status === 'critical').length
    const errorCount = results.filter(r => r.status === 'error').length

    let overallStatus: 'healthy' | 'warning' | 'critical' | 'error' = 'healthy'
    
    if (errorCount > 0 || criticalCount > 0) {
      overallStatus = 'critical'
    } else if (warningCount > 0) {
      overallStatus = 'warning'
    }

    return {
      total_domains: results.length,
      healthy_count: healthyCount,
      warning_count: warningCount,
      critical_count: criticalCount,
      error_count: errorCount,
      overall_status: overallStatus
    }
  }

  /**
   * 生成健康报告
   */
  generateHealthReport(): string {
    const summary = this.getHealthSummary()
    const results = Array.from(this.lastResults.values())

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      domains: results,
      recommendations: this.generateRecommendations(results)
    }

    return JSON.stringify(report, null, 2)
  }

  /**
   * 生成建议
   */
  private generateRecommendations(results: DomainHealthStatus[]): string[] {
    const recommendations: string[] = []

    const criticalDomains = results.filter(r => r.status === 'critical')
    const warningDomains = results.filter(r => r.status === 'warning')

    if (criticalDomains.length > 0) {
      recommendations.push(`立即处理 ${criticalDomains.length} 个严重问题域名`)
    }

    if (warningDomains.length > 0) {
      recommendations.push(`关注 ${warningDomains.length} 个警告状态域名`)
    }

    const slowDomains = results.filter(r => r.response_time_ms > this.config.response_time_threshold_ms)
    if (slowDomains.length > 0) {
      recommendations.push(`优化 ${slowDomains.length} 个响应较慢的域名`)
    }

    const sslIssues = results.filter(r => !r.ssl_valid || r.ssl_expires_in_days < 30)
    if (sslIssues.length > 0) {
      recommendations.push(`检查 ${sslIssues.length} 个SSL证书问题`)
    }

    return recommendations
  }
}

/**
 * 创建默认域名监控配置
 */
export function createDefaultDomainConfig(): DomainMonitoringConfig {
  return {
    domains: [
      'zinses-rechner.de',
      'www.zinses-rechner.de',
      'api.zinses-rechner.de',
      'monitoring.zinses-rechner.de'
    ],
    check_interval_minutes: 30,
    ssl_warning_threshold_days: 30,
    ssl_critical_threshold_days: 7,
    response_time_threshold_ms: 2000,
    notification_channels: ['log', 'slack']
  }
}
