/**
 * 安全服务 - Cloudflare Workers版本
 * 实现请求验证、速率限制和安全头配置
 */

import { Env } from '../index'

export interface SecurityCheckResult {
  valid: boolean
  message?: string
  code?: string
}

export interface RateLimitResult {
  allowed: boolean
  retryAfter: number
  remaining: number
}

export class SecurityService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  /**
   * 验证请求安全性
   */
  async validateRequest(request: Request, env: Env): Promise<SecurityCheckResult> {
    try {
      // 检查请求方法
      if (!['GET', 'POST', 'OPTIONS'].includes(request.method)) {
        return {
          valid: false,
          message: 'Ungültige HTTP-Methode',
          code: 'INVALID_METHOD'
        }
      }

      // 检查Content-Type（对于POST请求）
      if (request.method === 'POST') {
        const contentType = request.headers.get('Content-Type')
        if (!contentType || !contentType.includes('application/json')) {
          return {
            valid: false,
            message: 'Content-Type muss application/json sein',
            code: 'INVALID_CONTENT_TYPE'
          }
        }
      }

      // 检查User-Agent（防止机器人）
      const userAgent = request.headers.get('User-Agent')
      if (!userAgent || this.isSuspiciousUserAgent(userAgent)) {
        return {
          valid: false,
          message: 'Verdächtiger User-Agent erkannt',
          code: 'SUSPICIOUS_USER_AGENT'
        }
      }

      // 检查Referer（防止直接API调用）
      if (env.ENVIRONMENT === 'production') {
        const referer = request.headers.get('Referer')
        const origin = request.headers.get('Origin')
        
        if (!referer && !origin) {
          // 允许直接API调用，但记录
          console.warn('Direct API call detected (no referer/origin)')
        } else if (referer && !this.isValidReferer(referer, env.CORS_ORIGIN)) {
          return {
            valid: false,
            message: 'Ungültiger Referer',
            code: 'INVALID_REFERER'
          }
        }
      }

      // 检查请求大小
      const contentLength = request.headers.get('Content-Length')
      if (contentLength && parseInt(contentLength) > 10240) { // 10KB限制
        return {
          valid: false,
          message: 'Anfrage zu groß',
          code: 'REQUEST_TOO_LARGE'
        }
      }

      return { valid: true }

    } catch (error) {
      console.error('Security validation error:', error)
      return {
        valid: false,
        message: 'Sicherheitsprüfung fehlgeschlagen',
        code: 'SECURITY_CHECK_FAILED'
      }
    }
  }

  /**
   * 速率限制检查
   */
  async checkRateLimit(request: Request, env: Env): Promise<RateLimitResult> {
    try {
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
      const rateLimitKey = `rate_limit:${clientIP}`
      
      const maxRequests = parseInt(env.RATE_LIMIT_REQUESTS)
      const windowSeconds = parseInt(env.RATE_LIMIT_WINDOW)
      
      // 获取当前计数
      const currentCount = await this.getRateLimitCount(rateLimitKey, windowSeconds)
      
      if (currentCount >= maxRequests) {
        return {
          allowed: false,
          retryAfter: windowSeconds,
          remaining: 0
        }
      }

      // 增加计数
      await this.incrementRateLimitCount(rateLimitKey, windowSeconds)

      return {
        allowed: true,
        retryAfter: 0,
        remaining: maxRequests - currentCount - 1
      }

    } catch (error) {
      console.error('Rate limit check error:', error)
      // 错误时允许请求（fail open）
      return {
        allowed: true,
        retryAfter: 0,
        remaining: 100
      }
    }
  }

  /**
   * 获取CORS头
   */
  getCorsHeaders(allowedOrigin: string): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'false'
    }
  }

  /**
   * 获取安全头
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': this.getCSPHeader(),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  }

  /**
   * 生成CSP头
   */
  private getCSPHeader(): string {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.zinses-rechner.de",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ]
    
    return csp.join('; ')
  }

  /**
   * 检查可疑User-Agent
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http/i
    ]

    // 允许的机器人
    const allowedBots = [
      /googlebot/i,
      /bingbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i
    ]

    // 检查是否是允许的机器人
    if (allowedBots.some(pattern => pattern.test(userAgent))) {
      return false
    }

    // 检查是否是可疑的User-Agent
    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * 验证Referer
   */
  private isValidReferer(referer: string, allowedOrigin: string): boolean {
    try {
      const refererUrl = new URL(referer)
      const allowedUrl = new URL(allowedOrigin)
      
      return refererUrl.hostname === allowedUrl.hostname
    } catch {
      return false
    }
  }

  /**
   * 获取速率限制计数
   */
  private async getRateLimitCount(key: string, windowSeconds: number): Promise<number> {
    try {
      const data = await env.CACHE.get(key, 'json') as any
      
      if (!data) {
        return 0
      }

      // 检查时间窗口
      const now = Date.now()
      const windowStart = now - (windowSeconds * 1000)
      
      if (data.timestamp < windowStart) {
        // 时间窗口过期，重置计数
        await env.CACHE.delete(key)
        return 0
      }

      return data.count || 0
      
    } catch (error) {
      console.error('Failed to get rate limit count:', error)
      return 0
    }
  }

  /**
   * 增加速率限制计数
   */
  private async incrementRateLimitCount(key: string, windowSeconds: number): Promise<void> {
    try {
      const now = Date.now()
      const data = await env.CACHE.get(key, 'json') as any || { count: 0, timestamp: now }
      
      data.count += 1
      data.timestamp = now
      
      await env.CACHE.put(key, JSON.stringify(data), {
        expirationTtl: windowSeconds
      })
      
    } catch (error) {
      console.error('Failed to increment rate limit count:', error)
    }
  }

  /**
   * 生成安全的会话ID
   */
  generateSessionId(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 验证请求签名（可选的高级安全功能）
   */
  async validateRequestSignature(request: Request, secret: string): Promise<boolean> {
    try {
      const signature = request.headers.get('X-Signature')
      if (!signature) {
        return false
      }

      const body = await request.text()
      const expectedSignature = await this.generateSignature(body, secret)
      
      return signature === expectedSignature
      
    } catch (error) {
      console.error('Signature validation error:', error)
      return false
    }
  }

  /**
   * 生成请求签名
   */
  private async generateSignature(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}
