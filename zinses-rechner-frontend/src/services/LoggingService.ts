/**
 * 结构化日志服务
 * 提供统一的日志记录、错误报告和性能监控功能
 */

import { ref, computed } from 'vue'

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// 日志条目接口
export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  category: string
  data?: Record<string, any>
  userId?: string
  sessionId: string
  userAgent: string
  url: string
  stack?: string
  fingerprint?: string
}

// 性能指标接口
export interface PerformanceMetric {
  id: string
  timestamp: Date
  name: string
  value: number
  unit: string
  category: string
  tags?: Record<string, string>
}

// 错误报告接口
export interface ErrorReport {
  id: string
  timestamp: Date
  message: string
  stack: string
  url: string
  lineNumber?: number
  columnNumber?: number
  userId?: string
  sessionId: string
  userAgent: string
  breadcrumbs: Breadcrumb[]
  context: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 面包屑接口
export interface Breadcrumb {
  timestamp: Date
  category: string
  message: string
  level: LogLevel
  data?: Record<string, any>
}

// 日志配置接口
export interface LoggingConfig {
  level: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  apiKey?: string
  bufferSize: number
  flushInterval: number
  enablePerformanceMonitoring: boolean
  enableErrorReporting: boolean
  enableBreadcrumbs: boolean
  maxBreadcrumbs: number
  enableUserTracking: boolean
  enableSessionTracking: boolean
  enableAutoFlush: boolean
  enableCompression: boolean
  enableRetry: boolean
  maxRetries: number
  retryDelay: number
}

class LoggingService {
  private static instance: LoggingService
  private config: LoggingConfig
  private logBuffer: LogEntry[] = []
  private performanceBuffer: PerformanceMetric[] = []
  private errorBuffer: ErrorReport[] = []
  private breadcrumbs: Breadcrumb[] = []
  private sessionId: string
  private userId = ref<string | null>(null)
  private flushTimer: number | null = null
  private isOnline = ref(true)
  private retryQueue: Array<() => Promise<void>> = []

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.config = this.getDefaultConfig()
    this.initialize()
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService()
    }
    return LoggingService.instance
  }

  private getDefaultConfig(): LoggingConfig {
    return {
      level: import.meta.env.PROD ? LogLevel.WARN : LogLevel.DEBUG,
      enableConsole: !import.meta.env.PROD,
      enableRemote: import.meta.env.PROD,
      remoteEndpoint: import.meta.env.VITE_LOGGING_ENDPOINT,
      apiKey: import.meta.env.VITE_LOGGING_API_KEY,
      bufferSize: 100,
      flushInterval: 30000, // 30秒
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
      enableBreadcrumbs: true,
      maxBreadcrumbs: 50,
      enableUserTracking: true,
      enableSessionTracking: true,
      enableAutoFlush: true,
      enableCompression: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000
    }
  }

  private initialize(): void {
    // 设置全局错误处理
    this.setupGlobalErrorHandling()
    
    // 设置性能监控
    this.setupPerformanceMonitoring()
    
    // 设置网络状态监控
    this.setupNetworkMonitoring()
    
    // 设置自动刷新
    if (this.config.enableAutoFlush) {
      this.startAutoFlush()
    }
    
    // 设置页面卸载时的清理
    this.setupPageUnloadHandling()
  }

  private setupGlobalErrorHandling(): void {
    // 捕获未处理的错误
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack || '',
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        severity: 'high'
      })
    })

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack || '',
        url: window.location.href,
        severity: 'medium'
      })
    })

    // Vue错误处理
    if (typeof window !== 'undefined' && (window as any).Vue) {
      (window as any).Vue.config.errorHandler = (err: Error, vm: any, info: string) => {
        this.reportError({
          message: `Vue Error: ${err.message}`,
          stack: err.stack || '',
          url: window.location.href,
          severity: 'high',
          context: { componentInfo: info }
        })
      }
    }
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) return

    // 监控页面加载性能
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation) {
            this.recordPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms', 'navigation')
            this.recordPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms', 'navigation')
            this.recordPerformance('first_byte', navigation.responseStart - navigation.fetchStart, 'ms', 'navigation')
          }
        }, 0)
      })
    }

    // 监控资源加载性能
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming
            this.recordPerformance(
              'resource_load_time',
              resource.responseEnd - resource.fetchStart,
              'ms',
              'resource',
              { name: resource.name, type: this.getResourceType(resource.name) }
            )
          }
        }
      })
      observer.observe({ entryTypes: ['resource'] })
    }
  }

  private setupNetworkMonitoring(): void {
    // 监控网络状态
    window.addEventListener('online', () => {
      this.isOnline.value = true
      this.log(LogLevel.INFO, 'Network connection restored', 'network')
      this.processRetryQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline.value = false
      this.log(LogLevel.WARN, 'Network connection lost', 'network')
    })
  }

  private setupPageUnloadHandling(): void {
    // 页面卸载时发送剩余日志
    window.addEventListener('beforeunload', () => {
      this.flush(true) // 同步发送
    })

    // 页面隐藏时发送日志
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush()
      }
    })
  }

  // 公共API方法
  public configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config }
    
    if (this.config.enableAutoFlush && !this.flushTimer) {
      this.startAutoFlush()
    } else if (!this.config.enableAutoFlush && this.flushTimer) {
      this.stopAutoFlush()
    }
  }

  public setUserId(userId: string): void {
    this.userId.value = userId
  }

  public log(level: LogLevel, message: string, category: string = 'general', data?: Record<string, any>): void {
    if (level < this.config.level) return

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      category,
      data,
      userId: this.userId.value || undefined,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // 添加到缓冲区
    this.logBuffer.push(entry)

    // 控制台输出
    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }

    // 添加面包屑
    if (this.config.enableBreadcrumbs) {
      this.addBreadcrumb({
        timestamp: entry.timestamp,
        category,
        message,
        level,
        data
      })
    }

    // 检查是否需要立即刷新
    if (level >= LogLevel.ERROR || this.logBuffer.length >= this.config.bufferSize) {
      this.flush()
    }
  }

  public debug(message: string, category?: string, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, category, data)
  }

  public info(message: string, category?: string, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, category, data)
  }

  public warn(message: string, category?: string, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, category, data)
  }

  public error(message: string, category?: string, data?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, category, data)
  }

  public fatal(message: string, category?: string, data?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, category, data)
  }

  public recordPerformance(
    name: string,
    value: number,
    unit: string = 'ms',
    category: string = 'performance',
    tags?: Record<string, string>
  ): void {
    if (!this.config.enablePerformanceMonitoring) return

    const metric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date(),
      name,
      value,
      unit,
      category,
      tags
    }

    this.performanceBuffer.push(metric)

    if (this.performanceBuffer.length >= this.config.bufferSize) {
      this.flush()
    }
  }

  public reportError(error: Partial<ErrorReport>): void {
    if (!this.config.enableErrorReporting) return

    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date(),
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      url: error.url || window.location.href,
      lineNumber: error.lineNumber,
      columnNumber: error.columnNumber,
      userId: this.userId.value || undefined,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      breadcrumbs: [...this.breadcrumbs],
      context: error.context || {},
      severity: error.severity || 'medium'
    }

    this.errorBuffer.push(report)
    
    // 错误立即发送
    this.flush()
  }

  public async flush(sync: boolean = false): Promise<void> {
    if (!this.config.enableRemote || !this.isOnline.value) {
      return
    }

    const logs = [...this.logBuffer]
    const metrics = [...this.performanceBuffer]
    const errors = [...this.errorBuffer]

    // 清空缓冲区
    this.logBuffer = []
    this.performanceBuffer = []
    this.errorBuffer = []

    if (logs.length === 0 && metrics.length === 0 && errors.length === 0) {
      return
    }

    const payload = {
      logs,
      metrics,
      errors,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    }

    try {
      if (sync) {
        // 同步发送（页面卸载时）
        navigator.sendBeacon(
          this.config.remoteEndpoint!,
          JSON.stringify(payload)
        )
      } else {
        // 异步发送
        await this.sendToRemote(payload)
      }
    } catch (error) {
      // 发送失败，重新加入缓冲区
      this.logBuffer.unshift(...logs)
      this.performanceBuffer.unshift(...metrics)
      this.errorBuffer.unshift(...errors)

      if (this.config.enableRetry) {
        this.addToRetryQueue(() => this.sendToRemote(payload))
      }
    }
  }

  // 私有辅助方法
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private logToConsole(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
    const levelColors = ['#888', '#007acc', '#ff8c00', '#dc143c', '#8b0000']
    
    const style = `color: ${levelColors[entry.level]}; font-weight: bold;`
    const timestamp = entry.timestamp.toISOString()
    
    console.log(
      `%c[${levelNames[entry.level]}]%c ${timestamp} [${entry.category}] ${entry.message}`,
      style,
      'color: inherit;',
      entry.data || ''
    )
  }

  private addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb)
    
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  private async sendToRemote(payload: any): Promise<void> {
    const response = await fetch(this.config.remoteEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Session-ID': this.sessionId
      },
      body: this.config.enableCompression 
        ? await this.compress(JSON.stringify(payload))
        : JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  private async compress(data: string): Promise<string> {
    // 简单的压缩实现，生产环境可以使用更好的压缩算法
    return data
  }

  private addToRetryQueue(operation: () => Promise<void>): void {
    this.retryQueue.push(operation)
  }

  private async processRetryQueue(): Promise<void> {
    const queue = [...this.retryQueue]
    this.retryQueue = []

    for (const operation of queue) {
      try {
        await operation()
      } catch (error) {
        // 重试失败，可以考虑重新加入队列或丢弃
        console.warn('Retry operation failed:', error)
      }
    }
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase()
    
    if (['js', 'ts'].includes(extension || '')) return 'script'
    if (['css'].includes(extension || '')) return 'stylesheet'
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension || '')) return 'image'
    if (['woff', 'woff2', 'ttf', 'eot'].includes(extension || '')) return 'font'
    
    return 'other'
  }

  private startAutoFlush(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  // 获取统计信息
  public getStats() {
    return {
      logBufferSize: this.logBuffer.length,
      performanceBufferSize: this.performanceBuffer.length,
      errorBufferSize: this.errorBuffer.length,
      breadcrumbsCount: this.breadcrumbs.length,
      sessionId: this.sessionId,
      isOnline: this.isOnline.value,
      retryQueueSize: this.retryQueue.length
    }
  }
}

// 导出单例实例
export const loggingService = LoggingService.getInstance()

// 导出便捷方法
export const logger = {
  debug: (message: string, category?: string, data?: Record<string, any>) => 
    loggingService.debug(message, category, data),
  info: (message: string, category?: string, data?: Record<string, any>) => 
    loggingService.info(message, category, data),
  warn: (message: string, category?: string, data?: Record<string, any>) => 
    loggingService.warn(message, category, data),
  error: (message: string, category?: string, data?: Record<string, any>) => 
    loggingService.error(message, category, data),
  fatal: (message: string, category?: string, data?: Record<string, any>) => 
    loggingService.fatal(message, category, data),
  performance: (name: string, value: number, unit?: string, category?: string, tags?: Record<string, string>) =>
    loggingService.recordPerformance(name, value, unit, category, tags),
  reportError: (error: Partial<ErrorReport>) => 
    loggingService.reportError(error)
}
