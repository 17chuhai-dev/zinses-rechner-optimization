/**
 * 安全增强配置和工具
 * 增强现有安全措施的严格性和覆盖范围
 */

export interface SecurityConfig {
  csp: ContentSecurityPolicyConfig
  rateLimit: RateLimitConfig
  inputValidation: InputValidationConfig
  encryption: EncryptionConfig
  monitoring: SecurityMonitoringConfig
}

export interface ContentSecurityPolicyConfig {
  defaultSrc: string[]
  scriptSrc: string[]
  styleSrc: string[]
  imgSrc: string[]
  fontSrc: string[]
  connectSrc: string[]
  frameSrc: string[]
  objectSrc: string[]
  mediaSrc: string[]
  reportUri?: string
  reportOnly: boolean
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
  keyGenerator: string
  onLimitReached: string
}

export interface InputValidationConfig {
  maxStringLength: number
  allowedCharacters: RegExp
  sanitizeHtml: boolean
  validateNumbers: boolean
  validateEmails: boolean
  customValidators: string[]
}

export interface EncryptionConfig {
  algorithm: string
  keyLength: number
  saltLength: number
  iterations: number
  hashAlgorithm: string
}

export interface SecurityMonitoringConfig {
  logSecurityEvents: boolean
  alertOnSuspiciousActivity: boolean
  trackFailedAttempts: boolean
  monitorRateLimits: boolean
  auditDataAccess: boolean
}

/**
 * 增强的内容安全策略配置
 */
export function createEnhancedCSP(): ContentSecurityPolicyConfig {
  return {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // 仅在开发环境，生产环境应移除
      "https://cdn.jsdelivr.net",
      "https://unpkg.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https:",
      "blob:"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.jsdelivr.net"
    ],
    connectSrc: [
      "'self'",
      "https://api.zinses-rechner.de",
      "https://cloudflare-analytics.com"
    ],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    reportUri: "/api/v1/security/csp-report",
    reportOnly: false
  }
}

/**
 * 增强的API限流配置
 */
export function createEnhancedRateLimit(): RateLimitConfig {
  return {
    windowMs: 15 * 60 * 1000, // 15分钟窗口
    maxRequests: 100, // 每IP每15分钟最多100次请求
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: 'ip-and-user-agent', // 基于IP和User-Agent
    onLimitReached: 'log-and-block' // 记录并阻止
  }
}

/**
 * 增强的输入验证配置
 */
export function createEnhancedInputValidation(): InputValidationConfig {
  return {
    maxStringLength: 1000,
    allowedCharacters: /^[a-zA-Z0-9\s\-.,!?äöüÄÖÜß]*$/, // 德语字符支持
    sanitizeHtml: true,
    validateNumbers: true,
    validateEmails: true,
    customValidators: [
      'validateGermanPostalCode',
      'validateEuropeanPhoneNumber',
      'validateIBAN'
    ]
  }
}

/**
 * 安全事件监控器
 */
export class SecurityEventMonitor {
  private suspiciousActivityThreshold = 10
  private failedAttemptsWindow = 5 * 60 * 1000 // 5分钟
  private failedAttempts: Map<string, number[]> = new Map()

  /**
   * 记录安全事件
   */
  logSecurityEvent(event: {
    type: 'sql_injection_attempt' | 'xss_attempt' | 'csrf_violation' | 'rate_limit_exceeded' | 'invalid_input'
    ip: string
    userAgent: string
    payload?: any
    timestamp: Date
    severity: 'low' | 'medium' | 'high' | 'critical'
  }): void {
    // 记录到安全日志
    console.log(`[SECURITY] ${event.type}: ${event.ip} - ${event.severity}`, {
      userAgent: event.userAgent,
      payload: event.payload,
      timestamp: event.timestamp
    })

    // 检查是否为可疑活动
    this.checkSuspiciousActivity(event.ip, event.type)

    // 高危事件立即告警
    if (event.severity === 'critical' || event.severity === 'high') {
      this.sendSecurityAlert(event)
    }
  }

  /**
   * 检查可疑活动模式
   */
  private checkSuspiciousActivity(ip: string, eventType: string): void {
    const now = Date.now()
    const attempts = this.failedAttempts.get(ip) || []
    
    // 清理过期记录
    const recentAttempts = attempts.filter(time => now - time < this.failedAttemptsWindow)
    recentAttempts.push(now)
    
    this.failedAttempts.set(ip, recentAttempts)

    // 检查是否超过可疑活动阈值
    if (recentAttempts.length >= this.suspiciousActivityThreshold) {
      this.handleSuspiciousActivity(ip, eventType, recentAttempts.length)
    }
  }

  /**
   * 处理可疑活动
   */
  private handleSuspiciousActivity(ip: string, eventType: string, attemptCount: number): void {
    console.warn(`[SECURITY ALERT] Suspicious activity detected: ${ip} - ${eventType} (${attemptCount} attempts)`)

    // 临时封禁IP（在实际实现中应该调用防火墙API）
    this.temporaryBanIP(ip, 60 * 60 * 1000) // 1小时封禁

    // 发送告警
    this.sendSecurityAlert({
      type: 'rate_limit_exceeded',
      ip,
      userAgent: 'unknown',
      timestamp: new Date(),
      severity: 'high',
      payload: { attemptCount, eventType }
    })
  }

  /**
   * 临时封禁IP
   */
  private temporaryBanIP(ip: string, durationMs: number): void {
    // 在实际实现中，这里应该调用Cloudflare API或其他防火墙服务
    console.log(`[SECURITY] Temporarily banning IP: ${ip} for ${durationMs}ms`)
    
    // 记录封禁事件
    setTimeout(() => {
      console.log(`[SECURITY] IP ban expired: ${ip}`)
      this.failedAttempts.delete(ip)
    }, durationMs)
  }

  /**
   * 发送安全告警
   */
  private async sendSecurityAlert(event: any): Promise<void> {
    const alertPayload = {
      text: `🚨 安全告警: ${event.type}`,
      attachments: [
        {
          color: event.severity === 'critical' ? 'danger' : 'warning',
          fields: [
            {
              title: 'IP地址',
              value: event.ip,
              short: true
            },
            {
              title: '事件类型',
              value: event.type,
              short: true
            },
            {
              title: '严重程度',
              value: event.severity,
              short: true
            },
            {
              title: '时间',
              value: event.timestamp.toISOString(),
              short: true
            }
          ],
          footer: 'Zinses-Rechner 安全监控',
          ts: Math.floor(event.timestamp.getTime() / 1000)
        }
      ]
    }

    // 发送到配置的通知渠道
    if (process.env.SLACK_SECURITY_WEBHOOK) {
      try {
        await fetch(process.env.SLACK_SECURITY_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertPayload)
        })
      } catch (error) {
        console.error('Failed to send security alert:', error)
      }
    }
  }
}

/**
 * 输入净化工具
 */
export class InputSanitizer {
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR|ONCLICK)\b)/i
  ]

  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
  ]

  /**
   * 检测SQL注入尝试
   */
  static detectSQLInjection(input: string): boolean {
    return this.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))
  }

  /**
   * 检测XSS尝试
   */
  static detectXSS(input: string): boolean {
    return this.XSS_PATTERNS.some(pattern => pattern.test(input))
  }

  /**
   * 净化用户输入
   */
  static sanitizeInput(input: string, options: {
    allowHtml?: boolean
    maxLength?: number
    allowedChars?: RegExp
  } = {}): string {
    let sanitized = input

    // 长度限制
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength)
    }

    // 字符过滤
    if (options.allowedChars) {
      sanitized = sanitized.replace(options.allowedChars, '')
    }

    // HTML净化
    if (!options.allowHtml) {
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    }

    return sanitized.trim()
  }

  /**
   * 验证数值输入
   */
  static validateNumericInput(input: any, options: {
    min?: number
    max?: number
    allowDecimals?: boolean
    allowNegative?: boolean
  } = {}): { valid: boolean; sanitized?: number; error?: string } {
    const num = parseFloat(input)

    if (isNaN(num)) {
      return { valid: false, error: 'Ungültige Zahl' }
    }

    if (!options.allowNegative && num < 0) {
      return { valid: false, error: 'Negative Zahlen sind nicht erlaubt' }
    }

    if (!options.allowDecimals && num % 1 !== 0) {
      return { valid: false, error: 'Dezimalzahlen sind nicht erlaubt' }
    }

    if (options.min !== undefined && num < options.min) {
      return { valid: false, error: `Wert muss mindestens ${options.min} sein` }
    }

    if (options.max !== undefined && num > options.max) {
      return { valid: false, error: `Wert darf höchstens ${options.max} sein` }
    }

    return { valid: true, sanitized: num }
  }
}

/**
 * 安全中间件增强
 */
export class SecurityMiddleware {
  private monitor: SecurityEventMonitor
  private sanitizer: typeof InputSanitizer

  constructor() {
    this.monitor = new SecurityEventMonitor()
    this.sanitizer = InputSanitizer
  }

  /**
   * 请求安全检查中间件
   */
  securityCheck() {
    return async (request: any, response: any, next: any) => {
      const ip = this.getClientIP(request)
      const userAgent = request.headers['user-agent'] || 'unknown'

      try {
        // 检查请求体
        if (request.body) {
          await this.validateRequestBody(request.body, ip, userAgent)
        }

        // 检查查询参数
        if (request.query) {
          await this.validateQueryParams(request.query, ip, userAgent)
        }

        // 检查请求头
        await this.validateHeaders(request.headers, ip, userAgent)

        next()

      } catch (error) {
        this.monitor.logSecurityEvent({
          type: 'invalid_input',
          ip,
          userAgent,
          payload: { error: error.message, body: request.body },
          timestamp: new Date(),
          severity: 'medium'
        })

        response.status(400).json({
          error: 'Invalid request',
          message: 'Die Anfrage enthält ungültige Daten'
        })
      }
    }
  }

  /**
   * 验证请求体
   */
  private async validateRequestBody(body: any, ip: string, userAgent: string): Promise<void> {
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        // 检测SQL注入
        if (this.sanitizer.detectSQLInjection(value)) {
          this.monitor.logSecurityEvent({
            type: 'sql_injection_attempt',
            ip,
            userAgent,
            payload: { field: key, value },
            timestamp: new Date(),
            severity: 'critical'
          })
          throw new Error(`SQL injection attempt detected in field: ${key}`)
        }

        // 检测XSS
        if (this.sanitizer.detectXSS(value)) {
          this.monitor.logSecurityEvent({
            type: 'xss_attempt',
            ip,
            userAgent,
            payload: { field: key, value },
            timestamp: new Date(),
            severity: 'high'
          })
          throw new Error(`XSS attempt detected in field: ${key}`)
        }
      }
    }
  }

  /**
   * 验证查询参数
   */
  private async validateQueryParams(query: any, ip: string, userAgent: string): Promise<void> {
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string' && value.length > 1000) {
        throw new Error(`Query parameter too long: ${key}`)
      }
    }
  }

  /**
   * 验证请求头
   */
  private async validateHeaders(headers: any, ip: string, userAgent: string): Promise<void> {
    // 检查可疑的User-Agent
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /zap/i
    ]

    if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
      this.monitor.logSecurityEvent({
        type: 'sql_injection_attempt',
        ip,
        userAgent,
        payload: { suspiciousUserAgent: userAgent },
        timestamp: new Date(),
        severity: 'high'
      })
    }

    // 检查异常大的请求头
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string' && value.length > 8192) {
        throw new Error(`Request header too large: ${key}`)
      }
    }
  }

  /**
   * 获取客户端真实IP
   */
  private getClientIP(request: any): string {
    return request.headers['cf-connecting-ip'] || 
           request.headers['x-forwarded-for']?.split(',')[0] ||
           request.headers['x-real-ip'] ||
           request.connection?.remoteAddress ||
           request.socket?.remoteAddress ||
           'unknown'
  }
}

/**
 * 数据加密工具
 */
export class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16

  /**
   * 加密敏感数据
   */
  static encrypt(data: string, key: string): string {
    const crypto = require('crypto')
    
    const iv = crypto.randomBytes(this.IV_LENGTH)
    const cipher = crypto.createCipher(this.ALGORITHM, key, iv)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // 返回: iv + tag + encrypted
    return iv.toString('hex') + tag.toString('hex') + encrypted
  }

  /**
   * 解密敏感数据
   */
  static decrypt(encryptedData: string, key: string): string {
    const crypto = require('crypto')
    
    const iv = Buffer.from(encryptedData.slice(0, this.IV_LENGTH * 2), 'hex')
    const tag = Buffer.from(encryptedData.slice(this.IV_LENGTH * 2, (this.IV_LENGTH + this.TAG_LENGTH) * 2), 'hex')
    const encrypted = encryptedData.slice((this.IV_LENGTH + this.TAG_LENGTH) * 2)
    
    const decipher = crypto.createDecipher(this.ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  /**
   * 生成安全的随机密钥
   */
  static generateSecureKey(): string {
    const crypto = require('crypto')
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex')
  }

  /**
   * 哈希密码
   */
  static async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const crypto = require('crypto')
    
    if (!salt) {
      salt = crypto.randomBytes(16).toString('hex')
    }
    
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err: any, derivedKey: any) => {
        if (err) reject(err)
        resolve({
          hash: derivedKey.toString('hex'),
          salt
        })
      })
    })
  }
}

/**
 * 创建默认安全配置
 */
export function createDefaultSecurityConfig(): SecurityConfig {
  return {
    csp: createEnhancedCSP(),
    rateLimit: createEnhancedRateLimit(),
    inputValidation: createEnhancedInputValidation(),
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      saltLength: 16,
      iterations: 100000,
      hashAlgorithm: 'sha512'
    },
    monitoring: {
      logSecurityEvents: true,
      alertOnSuspiciousActivity: true,
      trackFailedAttempts: true,
      monitorRateLimits: true,
      auditDataAccess: true
    }
  }
}
