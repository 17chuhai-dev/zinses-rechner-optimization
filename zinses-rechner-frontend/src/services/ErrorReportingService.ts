/**
 * 错误报告服务
 * 统一的错误收集、分析和报告系统
 */

import { ref, reactive } from 'vue'
import { logger } from './LoggingService'

// 错误类型枚举
export enum ErrorType {
  JAVASCRIPT = 'javascript',
  NETWORK = 'network',
  RESOURCE = 'resource',
  PROMISE = 'promise',
  VUE = 'vue',
  CALCULATION = 'calculation',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  CUSTOM = 'custom'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 错误报告接口
export interface ErrorReport {
  id: string
  timestamp: Date
  type: ErrorType
  severity: ErrorSeverity
  message: string
  stack?: string
  url: string
  lineNumber?: number
  columnNumber?: number
  userAgent: string
  userId?: string
  sessionId: string
  context: ErrorContext
  breadcrumbs: ErrorBreadcrumb[]
  tags: Record<string, string>
  fingerprint: string
  count: number
  firstSeen: Date
  lastSeen: Date
}

// 错误上下文
export interface ErrorContext {
  component?: string
  action?: string
  route?: string
  props?: Record<string, any>
  state?: Record<string, any>
  network?: {
    online: boolean
    effectiveType: string
    downlink: number
  }
  device?: {
    type: string
    memory: number
    cores: number
  }
  browser?: {
    name: string
    version: string
    language: string
  }
  custom?: Record<string, any>
}

// 错误面包屑
export interface ErrorBreadcrumb {
  timestamp: Date
  category: string
  message: string
  level: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, any>
}

// 错误统计
export interface ErrorStats {
  totalErrors: number
  errorsByType: Record<ErrorType, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  errorRate: number
  topErrors: ErrorReport[]
  recentErrors: ErrorReport[]
}

class ErrorReportingService {
  private static instance: ErrorReportingService
  private isEnabled = ref(true)
  private errors = reactive<Map<string, ErrorReport>>(new Map())
  private breadcrumbs = reactive<ErrorBreadcrumb[]>([])
  private sessionId: string
  private userId = ref<string | null>(null)
  private maxBreadcrumbs = 50
  private maxErrors = 1000
  private reportingEndpoint: string | null = null
  private apiKey: string | null = null

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.reportingEndpoint = import.meta.env.VITE_ERROR_REPORTING_ENDPOINT
    this.apiKey = import.meta.env.VITE_ERROR_REPORTING_API_KEY
    this.initialize()
  }

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService()
    }
    return ErrorReportingService.instance
  }

  private initialize(): void {
    this.setupGlobalErrorHandlers()
    this.setupVueErrorHandler()
    this.setupNetworkErrorHandler()
    this.setupResourceErrorHandler()
  }

  private setupGlobalErrorHandlers(): void {
    // 捕获JavaScript错误
    window.addEventListener('error', (event) => {
      this.reportError({
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        context: {
          action: 'global_error_handler'
        }
      })
    })

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: ErrorType.PROMISE,
        severity: ErrorSeverity.MEDIUM,
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        context: {
          action: 'unhandled_promise_rejection',
          reason: event.reason
        }
      })
    })
  }

  private setupVueErrorHandler(): void {
    // Vue错误处理器将在应用初始化时设置
    if (typeof window !== 'undefined') {
      (window as any).__VUE_ERROR_HANDLER__ = (err: Error, instance: any, info: string) => {
        this.reportError({
          type: ErrorType.VUE,
          severity: ErrorSeverity.HIGH,
          message: err.message,
          stack: err.stack,
          url: window.location.href,
          context: {
            component: instance?.$options.name || instance?.$options.__name,
            action: 'vue_error_handler',
            info,
            props: instance?.$props,
            route: instance?.$route?.path
          }
        })
      }
    }
  }

  private setupNetworkErrorHandler(): void {
    // 拦截fetch请求错误
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        if (!response.ok) {
          this.reportError({
            type: ErrorType.NETWORK,
            severity: this.getNetworkErrorSeverity(response.status),
            message: `Network request failed: ${response.status} ${response.statusText}`,
            url: typeof args[0] === 'string' ? args[0] : args[0].url,
            context: {
              action: 'fetch_request',
              status: response.status,
              statusText: response.statusText,
              method: typeof args[1] === 'object' ? args[1]?.method : 'GET'
            }
          })
        }
        
        return response
      } catch (error) {
        this.reportError({
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.HIGH,
          message: `Network request failed: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
          url: typeof args[0] === 'string' ? args[0] : args[0].url,
          context: {
            action: 'fetch_request_exception',
            method: typeof args[1] === 'object' ? args[1]?.method : 'GET'
          }
        })
        throw error
      }
    }
  }

  private setupResourceErrorHandler(): void {
    // 监听资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement
        this.reportError({
          type: ErrorType.RESOURCE,
          severity: ErrorSeverity.MEDIUM,
          message: `Resource failed to load: ${target.tagName}`,
          url: (target as any).src || (target as any).href || window.location.href,
          context: {
            action: 'resource_load_error',
            tagName: target.tagName,
            src: (target as any).src,
            href: (target as any).href
          }
        })
      }
    }, true)
  }

  // 公共API方法
  public reportError(errorData: {
    type: ErrorType
    severity: ErrorSeverity
    message: string
    stack?: string
    url?: string
    lineNumber?: number
    columnNumber?: number
    context?: Partial<ErrorContext>
    tags?: Record<string, string>
  }): string {
    if (!this.isEnabled.value) return ''

    const fingerprint = this.generateFingerprint(errorData)
    const now = new Date()
    
    // 检查是否是重复错误
    const existingError = this.errors.get(fingerprint)
    if (existingError) {
      existingError.count++
      existingError.lastSeen = now
      this.sendToRemote(existingError)
      return existingError.id
    }

    // 创建新的错误报告
    const errorReport: ErrorReport = {
      id: this.generateId(),
      timestamp: now,
      type: errorData.type,
      severity: errorData.severity,
      message: errorData.message,
      stack: errorData.stack,
      url: errorData.url || window.location.href,
      lineNumber: errorData.lineNumber,
      columnNumber: errorData.columnNumber,
      userAgent: navigator.userAgent,
      userId: this.userId.value || undefined,
      sessionId: this.sessionId,
      context: this.enrichContext(errorData.context || {}),
      breadcrumbs: [...this.breadcrumbs],
      tags: errorData.tags || {},
      fingerprint,
      count: 1,
      firstSeen: now,
      lastSeen: now
    }

    // 存储错误
    this.errors.set(fingerprint, errorReport)

    // 限制错误数量
    if (this.errors.size > this.maxErrors) {
      const oldestKey = this.errors.keys().next().value
      this.errors.delete(oldestKey)
    }

    // 记录到日志
    logger.error(`${errorData.type}: ${errorData.message}`, 'error-reporting', {
      errorId: errorReport.id,
      fingerprint,
      severity: errorData.severity
    })

    // 发送到远程服务
    this.sendToRemote(errorReport)

    return errorReport.id
  }

  public addBreadcrumb(breadcrumb: Omit<ErrorBreadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date()
    })

    // 限制面包屑数量
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  public setUserId(userId: string): void {
    this.userId.value = userId
  }

  public setContext(key: string, value: any): void {
    // 为后续错误设置全局上下文
    if (!this.globalContext) {
      this.globalContext = {}
    }
    this.globalContext[key] = value
  }

  public clearErrors(): void {
    this.errors.clear()
  }

  public getErrorStats(): ErrorStats {
    const errors = Array.from(this.errors.values())
    
    const errorsByType = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = errors.filter(e => e.type === type).length
      return acc
    }, {} as Record<ErrorType, number>)

    const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = errors.filter(e => e.severity === severity).length
      return acc
    }, {} as Record<ErrorSeverity, number>)

    const topErrors = errors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const recentErrors = errors
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, 20)

    return {
      totalErrors: errors.length,
      errorsByType,
      errorsBySeverity,
      errorRate: this.calculateErrorRate(),
      topErrors,
      recentErrors
    }
  }

  public enable(): void {
    this.isEnabled.value = true
  }

  public disable(): void {
    this.isEnabled.value = false
  }

  // 私有辅助方法
  private globalContext: Record<string, any> = {}

  private generateId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFingerprint(errorData: {
    type: ErrorType
    message: string
    stack?: string
    url?: string
    lineNumber?: number
  }): string {
    const key = `${errorData.type}-${errorData.message}-${errorData.url}-${errorData.lineNumber}`
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 32)
  }

  private enrichContext(context: Partial<ErrorContext>): ErrorContext {
    const enriched: ErrorContext = {
      ...context,
      route: window.location.pathname,
      network: {
        online: navigator.onLine,
        effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
        downlink: (navigator as any).connection?.downlink || 0
      },
      device: {
        type: this.getDeviceType(),
        memory: (navigator as any).deviceMemory || 0,
        cores: navigator.hardwareConcurrency || 0
      },
      browser: {
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
        language: navigator.language
      },
      custom: this.globalContext
    }

    return enriched
  }

  private getNetworkErrorSeverity(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.HIGH
    if (status >= 400) return ErrorSeverity.MEDIUM
    return ErrorSeverity.LOW
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile'
    return 'desktop'
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent
    const match = userAgent.match(/(chrome|firefox|safari|edge)\/(\d+)/i)
    return match ? match[2] : 'Unknown'
  }

  private calculateErrorRate(): number {
    // 简单的错误率计算，可以根据需要改进
    const errors = Array.from(this.errors.values())
    const recentErrors = errors.filter(e => 
      Date.now() - e.lastSeen.getTime() < 24 * 60 * 60 * 1000 // 24小时内
    )
    return recentErrors.length
  }

  private async sendToRemote(errorReport: ErrorReport): Promise<void> {
    if (!this.reportingEndpoint || !this.apiKey) return

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify(errorReport)
      })
    } catch (error) {
      console.warn('Failed to send error report:', error)
    }
  }
}

// 导出单例实例
export const errorReporting = ErrorReportingService.getInstance()

// 导出便捷方法
export const reportError = (
  type: ErrorType,
  severity: ErrorSeverity,
  message: string,
  context?: Partial<ErrorContext>
) => {
  return errorReporting.reportError({ type, severity, message, context })
}

export const addBreadcrumb = (
  category: string,
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) => {
  errorReporting.addBreadcrumb({ category, message, level, data })
}
