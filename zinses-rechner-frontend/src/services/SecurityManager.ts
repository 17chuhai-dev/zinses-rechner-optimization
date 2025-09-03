/**
 * 安全管理器
 * 实现应用安全增强功能，包括CSP策略、XSS防护、输入验证等
 */

import { ref, reactive } from 'vue'

// 安全策略配置接口
export interface SecurityConfig {
  enableCSP: boolean
  enableXSSProtection: boolean
  enableInputValidation: boolean
  enableContentFiltering: boolean
  enableSecureHeaders: boolean
  enableRateLimiting: boolean
  maxRequestsPerMinute: number
  blockedDomains: string[]
  allowedFileTypes: string[]
  maxFileSize: number // MB
}

// 安全事件接口
export interface SecurityEvent {
  id: string
  type: 'xss_attempt' | 'invalid_input' | 'rate_limit' | 'blocked_domain' | 'file_upload' | 'csp_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: any
  userAgent?: string
  ipAddress?: string
  timestamp: Date
  blocked: boolean
}

// 输入验证规则接口
export interface ValidationRule {
  name: string
  pattern: RegExp
  message: string
  severity: 'warning' | 'error'
  enabled: boolean
}

// 安全统计接口
export interface SecurityStats {
  totalEvents: number
  blockedEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  recentEvents: SecurityEvent[]
  riskScore: number
}

/**
 * 安全管理器类
 */
export class SecurityManager {
  private static instance: SecurityManager

  // 安全配置
  private config: SecurityConfig = {
    enableCSP: true,
    enableXSSProtection: true,
    enableInputValidation: true,
    enableContentFiltering: true,
    enableSecureHeaders: true,
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
    blockedDomains: [
      'malicious-site.com',
      'phishing-domain.net',
      'suspicious-tracker.org'
    ],
    allowedFileTypes: [
      'image/png',
      'image/jpeg',
      'image/svg+xml',
      'application/pdf',
      'text/csv',
      'application/json'
    ],
    maxFileSize: 10 // 10MB
  }

  // 安全事件记录
  private events: SecurityEvent[] = []

  // 安全统计
  public readonly stats = reactive<SecurityStats>({
    totalEvents: 0,
    blockedEvents: 0,
    eventsByType: {},
    eventsBySeverity: {},
    recentEvents: [],
    riskScore: 0
  })

  // 输入验证规则
  private validationRules: ValidationRule[] = [
    {
      name: 'script_tag',
      pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      message: 'Script-Tags sind nicht erlaubt',
      severity: 'error',
      enabled: true
    },
    {
      name: 'javascript_protocol',
      pattern: /javascript:/gi,
      message: 'JavaScript-Protokoll ist nicht erlaubt',
      severity: 'error',
      enabled: true
    },
    {
      name: 'on_event_handlers',
      pattern: /\bon\w+\s*=/gi,
      message: 'Event-Handler sind nicht erlaubt',
      severity: 'error',
      enabled: true
    },
    {
      name: 'iframe_tag',
      pattern: /<iframe\b[^>]*>/gi,
      message: 'IFrame-Tags sind nicht erlaubt',
      severity: 'warning',
      enabled: true
    },
    {
      name: 'object_embed',
      pattern: /<(object|embed)\b[^>]*>/gi,
      message: 'Object/Embed-Tags sind nicht erlaubt',
      severity: 'warning',
      enabled: true
    },
    {
      name: 'sql_injection',
      pattern: /(union|select|insert|update|delete|drop|create|alter)\s+/gi,
      message: 'SQL-Befehle sind nicht erlaubt',
      severity: 'error',
      enabled: true
    }
  ]

  // 请求限制跟踪
  private requestCounts = new Map<string, { count: number; resetTime: number }>()

  // 状态
  public readonly isEnabled = ref(true)
  public readonly lastSecurityCheck = ref<Date>(new Date())

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  constructor() {
    this.initializeSecurity()
  }

  /**
   * 初始化安全系统
   */
  private initializeSecurity(): void {
    // 设置CSP策略
    if (this.config.enableCSP) {
      this.setupCSP()
    }

    // 设置安全头
    if (this.config.enableSecureHeaders) {
      this.setupSecureHeaders()
    }

    // 监听CSP违规
    this.setupCSPViolationListener()

    // 启动定期清理
    this.startPeriodicCleanup()

    console.log('🔒 Security manager initialized')
  }

  /**
   * 验证输入内容
   */
  public validateInput(input: string, context: string = 'general'): {
    isValid: boolean
    violations: Array<{ rule: string; message: string; severity: string }>
    sanitized: string
  } {
    const violations: Array<{ rule: string; message: string; severity: string }> = []
    let sanitized = input

    if (!this.config.enableInputValidation) {
      return { isValid: true, violations: [], sanitized: input }
    }

    // 应用验证规则
    for (const rule of this.validationRules) {
      if (!rule.enabled) continue

      if (rule.pattern.test(input)) {
        violations.push({
          rule: rule.name,
          message: rule.message,
          severity: rule.severity
        })

        // 记录安全事件
        this.recordSecurityEvent({
          type: 'invalid_input',
          severity: rule.severity === 'error' ? 'high' : 'medium',
          message: `Input validation failed: ${rule.message}`,
          details: {
            rule: rule.name,
            context,
            input: input.substring(0, 100) // 只记录前100个字符
          },
          blocked: rule.severity === 'error'
        })

        // 如果是错误级别，清理输入
        if (rule.severity === 'error') {
          sanitized = sanitized.replace(rule.pattern, '')
        }
      }
    }

    const isValid = violations.filter(v => v.severity === 'error').length === 0

    return { isValid, violations, sanitized }
  }

  /**
   * 检查XSS攻击
   */
  public checkXSS(content: string): {
    isSafe: boolean
    threats: string[]
    sanitized: string
  } {
    if (!this.config.enableXSSProtection) {
      return { isSafe: true, threats: [], sanitized: content }
    }

    const threats: string[] = []
    let sanitized = content

    // XSS检测模式
    const xssPatterns = [
      {
        name: 'Script Injection',
        pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi
      },
      {
        name: 'Event Handler Injection',
        pattern: /\bon\w+\s*=\s*["'][^"']*["']/gi
      },
      {
        name: 'JavaScript URL',
        pattern: /javascript\s*:/gi
      },
      {
        name: 'Data URL with Script',
        pattern: /data\s*:\s*text\/html/gi
      },
      {
        name: 'SVG Script Injection',
        pattern: /<svg[\s\S]*?<script[\s\S]*?>[\s\S]*?<\/script>[\s\S]*?<\/svg>/gi
      }
    ]

    for (const pattern of xssPatterns) {
      if (pattern.pattern.test(content)) {
        threats.push(pattern.name)
        sanitized = sanitized.replace(pattern.pattern, '')

        // 记录XSS尝试
        this.recordSecurityEvent({
          type: 'xss_attempt',
          severity: 'high',
          message: `XSS attempt detected: ${pattern.name}`,
          details: {
            pattern: pattern.name,
            content: content.substring(0, 200)
          },
          blocked: true
        })
      }
    }

    return {
      isSafe: threats.length === 0,
      threats,
      sanitized
    }
  }

  /**
   * 检查请求频率限制
   */
  public checkRateLimit(identifier: string = 'default'): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    if (!this.config.enableRateLimiting) {
      return { allowed: true, remaining: this.config.maxRequestsPerMinute, resetTime: 0 }
    }

    const now = Date.now()
    const windowStart = Math.floor(now / 60000) * 60000 // 1分钟窗口
    
    let requestData = this.requestCounts.get(identifier)
    
    if (!requestData || requestData.resetTime !== windowStart) {
      requestData = { count: 0, resetTime: windowStart }
      this.requestCounts.set(identifier, requestData)
    }

    requestData.count++

    const allowed = requestData.count <= this.config.maxRequestsPerMinute
    const remaining = Math.max(0, this.config.maxRequestsPerMinute - requestData.count)
    const resetTime = windowStart + 60000

    if (!allowed) {
      this.recordSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        message: `Rate limit exceeded for identifier: ${identifier}`,
        details: {
          identifier,
          count: requestData.count,
          limit: this.config.maxRequestsPerMinute
        },
        blocked: true
      })
    }

    return { allowed, remaining, resetTime }
  }

  /**
   * 验证文件上传
   */
  public validateFileUpload(file: File): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查文件类型
    if (!this.config.allowedFileTypes.includes(file.type)) {
      errors.push(`Dateityp ${file.type} ist nicht erlaubt`)
    }

    // 检查文件大小
    const maxSizeBytes = this.config.maxFileSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      errors.push(`Datei ist zu groß (${Math.round(file.size / 1024 / 1024)}MB > ${this.config.maxFileSize}MB)`)
    }

    // 检查文件名
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
    const fileName = file.name.toLowerCase()
    
    for (const ext of suspiciousExtensions) {
      if (fileName.endsWith(ext)) {
        errors.push(`Verdächtige Dateierweiterung: ${ext}`)
      }
    }

    // 检查双重扩展
    const extensionCount = (fileName.match(/\./g) || []).length
    if (extensionCount > 1) {
      warnings.push('Datei hat mehrere Erweiterungen')
    }

    const isValid = errors.length === 0

    if (!isValid || warnings.length > 0) {
      this.recordSecurityEvent({
        type: 'file_upload',
        severity: errors.length > 0 ? 'high' : 'low',
        message: `File upload validation: ${errors.length} errors, ${warnings.length} warnings`,
        details: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          errors,
          warnings
        },
        blocked: !isValid
      })
    }

    return { isValid, errors, warnings }
  }

  /**
   * 检查URL安全性
   */
  public checkURLSafety(url: string): {
    isSafe: boolean
    risks: string[]
    category: 'safe' | 'suspicious' | 'dangerous'
  } {
    const risks: string[] = []
    let category: 'safe' | 'suspicious' | 'dangerous' = 'safe'

    try {
      const urlObj = new URL(url)

      // 检查协议
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        risks.push(`Unsicheres Protokoll: ${urlObj.protocol}`)
        category = 'dangerous'
      }

      // 检查域名黑名单
      for (const blockedDomain of this.config.blockedDomains) {
        if (urlObj.hostname.includes(blockedDomain)) {
          risks.push(`Blockierte Domain: ${urlObj.hostname}`)
          category = 'dangerous'
        }
      }

      // 检查可疑模式
      const suspiciousPatterns = [
        { pattern: /\d+\.\d+\.\d+\.\d+/, risk: 'IP-Adresse statt Domain' },
        { pattern: /[а-я]/i, risk: 'Kyrillische Zeichen (möglicher Phishing)' },
        { pattern: /-{2,}/, risk: 'Mehrfache Bindestriche' },
        { pattern: /\.tk$|\.ml$|\.ga$|\.cf$/i, risk: 'Verdächtige TLD' }
      ]

      for (const { pattern, risk } of suspiciousPatterns) {
        if (pattern.test(urlObj.hostname)) {
          risks.push(risk)
          if (category === 'safe') category = 'suspicious'
        }
      }

      // 检查URL-Shortener
      const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly']
      if (shorteners.some(shortener => urlObj.hostname.includes(shortener))) {
        risks.push('URL-Shortener erkannt')
        if (category === 'safe') category = 'suspicious'
      }

    } catch (error) {
      risks.push('Ungültige URL-Format')
      category = 'dangerous'
    }

    const isSafe = category === 'safe'

    if (!isSafe) {
      this.recordSecurityEvent({
        type: 'blocked_domain',
        severity: category === 'dangerous' ? 'high' : 'medium',
        message: `Unsafe URL detected: ${url}`,
        details: {
          url,
          risks,
          category
        },
        blocked: category === 'dangerous'
      })
    }

    return { isSafe, risks, category }
  }

  /**
   * 获取安全统计
   */
  public getSecurityStats(): SecurityStats {
    this.updateStats()
    return { ...this.stats }
  }

  /**
   * 获取安全事件
   */
  public getSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * 清除安全事件
   */
  public clearSecurityEvents(): void {
    this.events = []
    this.updateStats()
    console.log('🔒 Security events cleared')
  }

  /**
   * 更新安全配置
   */
  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // 重新应用CSP策略
    if (newConfig.enableCSP !== undefined) {
      if (newConfig.enableCSP) {
        this.setupCSP()
      } else {
        this.removeCSP()
      }
    }

    console.log('🔒 Security config updated')
  }

  /**
   * 导出安全报告
   */
  public exportSecurityReport(): {
    config: SecurityConfig
    stats: SecurityStats
    events: SecurityEvent[]
    recommendations: string[]
    reportTime: Date
  } {
    const recommendations = this.generateSecurityRecommendations()

    return {
      config: { ...this.config },
      stats: this.getSecurityStats(),
      events: this.getSecurityEvents(100),
      recommendations,
      reportTime: new Date()
    }
  }

  // 私有方法

  /**
   * 记录安全事件
   */
  private recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'userAgent' | 'ipAddress'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ipAddress: 'client-side' // 客户端无法获取真实IP
    }

    this.events.push(securityEvent)

    // 限制事件数量
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500)
    }

    this.updateStats()
    this.lastSecurityCheck.value = new Date()

    console.warn(`🔒 Security event: ${event.type} - ${event.message}`)
  }

  /**
   * 设置CSP策略
   */
  private setupCSP(): void {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 开发环境可能需要
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "child-src 'none'",
      "worker-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'"
    ]

    const cspHeader = cspDirectives.join('; ')

    // 在开发环境中，我们只能通过meta标签设置CSP
    let metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute('http-equiv', 'Content-Security-Policy')
      document.head.appendChild(metaTag)
    }
    metaTag.setAttribute('content', cspHeader)

    console.log('🔒 CSP policy applied')
  }

  /**
   * 移除CSP策略
   */
  private removeCSP(): void {
    const metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (metaTag) {
      metaTag.remove()
      console.log('🔒 CSP policy removed')
    }
  }

  /**
   * 设置安全头
   */
  private setupSecureHeaders(): void {
    // 在客户端，我们只能通过meta标签设置一些安全头
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ]

    for (const header of securityHeaders) {
      let metaTag = document.querySelector(`meta[http-equiv="${header.name}"]`)
      if (!metaTag) {
        metaTag = document.createElement('meta')
        metaTag.setAttribute('http-equiv', header.name)
        document.head.appendChild(metaTag)
      }
      metaTag.setAttribute('content', header.content)
    }

    console.log('🔒 Security headers applied')
  }

  /**
   * 设置CSP违规监听
   */
  private setupCSPViolationListener(): void {
    document.addEventListener('securitypolicyviolation', (event) => {
      this.recordSecurityEvent({
        type: 'csp_violation',
        severity: 'high',
        message: `CSP violation: ${event.violatedDirective}`,
        details: {
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI,
          documentURI: event.documentURI,
          originalPolicy: event.originalPolicy
        },
        blocked: true
      })
    })
  }

  /**
   * 启动定期清理
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      // 清理过期的请求计数
      const now = Date.now()
      for (const [key, data] of this.requestCounts.entries()) {
        if (now > data.resetTime + 60000) {
          this.requestCounts.delete(key)
        }
      }

      // 清理旧的安全事件
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时前
      this.events = this.events.filter(event => event.timestamp >= cutoff)

      this.updateStats()
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalEvents = this.events.length
    this.stats.blockedEvents = this.events.filter(e => e.blocked).length

    // 按类型统计
    this.stats.eventsByType = {}
    this.stats.eventsBySeverity = {}

    for (const event of this.events) {
      this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1
      this.stats.eventsBySeverity[event.severity] = (this.stats.eventsBySeverity[event.severity] || 0) + 1
    }

    // 最近事件
    this.stats.recentEvents = this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    // 计算风险评分
    this.stats.riskScore = this.calculateRiskScore()
  }

  /**
   * 计算风险评分
   */
  private calculateRiskScore(): number {
    const recentEvents = this.events.filter(
      e => e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
    )

    let score = 0
    const severityWeights = { low: 1, medium: 3, high: 7, critical: 15 }

    for (const event of recentEvents) {
      score += severityWeights[event.severity]
    }

    // 归一化到0-100
    return Math.min(100, score)
  }

  /**
   * 生成安全建议
   */
  private generateSecurityRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getSecurityStats()

    if (stats.eventsByType.xss_attempt > 0) {
      recommendations.push('Verstärken Sie die XSS-Schutzmaßnahmen')
    }

    if (stats.eventsByType.invalid_input > 5) {
      recommendations.push('Überprüfen Sie die Eingabevalidierung')
    }

    if (stats.eventsByType.rate_limit > 0) {
      recommendations.push('Erwägen Sie strengere Rate-Limiting-Regeln')
    }

    if (stats.riskScore > 50) {
      recommendations.push('Erhöhte Sicherheitsüberwachung empfohlen')
    }

    if (!this.config.enableCSP) {
      recommendations.push('Aktivieren Sie Content Security Policy')
    }

    if (recommendations.length === 0) {
      recommendations.push('Sicherheitsstatus ist gut - keine Maßnahmen erforderlich')
    }

    return recommendations
  }
}

// 导出单例实例
export const securityManager = SecurityManager.getInstance()

// 便捷的组合式API
export function useSecurity() {
  const manager = SecurityManager.getInstance()
  
  return {
    // 状态
    stats: manager.stats,
    isEnabled: manager.isEnabled,
    lastSecurityCheck: manager.lastSecurityCheck,
    
    // 方法
    validateInput: manager.validateInput.bind(manager),
    checkXSS: manager.checkXSS.bind(manager),
    checkRateLimit: manager.checkRateLimit.bind(manager),
    validateFileUpload: manager.validateFileUpload.bind(manager),
    checkURLSafety: manager.checkURLSafety.bind(manager),
    getSecurityStats: manager.getSecurityStats.bind(manager),
    getSecurityEvents: manager.getSecurityEvents.bind(manager),
    clearSecurityEvents: manager.clearSecurityEvents.bind(manager),
    updateConfig: manager.updateConfig.bind(manager),
    exportSecurityReport: manager.exportSecurityReport.bind(manager)
  }
}
