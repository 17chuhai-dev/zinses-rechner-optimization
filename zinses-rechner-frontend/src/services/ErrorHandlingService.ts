/**
 * 错误处理服务
 * 提供全局错误捕获、错误报告、错误恢复等功能
 */

import { ref, reactive } from 'vue'

// 错误类型枚举
export enum ErrorType {
  JAVASCRIPT_ERROR = 'javascript_error',
  PROMISE_REJECTION = 'promise_rejection',
  NETWORK_ERROR = 'network_error',
  CALCULATION_ERROR = 'calculation_error',
  VALIDATION_ERROR = 'validation_error',
  COMPONENT_ERROR = 'component_error',
  RESOURCE_ERROR = 'resource_error',
  PERMISSION_ERROR = 'permission_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 错误信息接口
export interface ErrorInfo {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  stack?: string
  timestamp: Date
  url?: string
  userAgent?: string
  userId?: string
  sessionId: string
  context?: Record<string, any>
  componentStack?: string
  props?: Record<string, any>
  recovered: boolean
  retryCount: number
  maxRetries: number
}

// 错误恢复策略
export interface RecoveryStrategy {
  type: 'reload' | 'retry' | 'fallback' | 'ignore' | 'redirect'
  maxAttempts: number
  delay?: number
  fallbackComponent?: string
  redirectUrl?: string
  customHandler?: (error: ErrorInfo) => Promise<boolean>
}

// 错误报告配置
export interface ErrorReportingConfig {
  enabled: boolean
  endpoint?: string
  apiKey?: string
  includeUserData: boolean
  includeSystemInfo: boolean
  batchSize: number
  flushInterval: number
  retryAttempts: number
}

// 错误统计
export interface ErrorStatistics {
  totalErrors: number
  errorsByType: Record<ErrorType, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  recoveredErrors: number
  unrecoveredErrors: number
  averageRecoveryTime: number
  topErrors: Array<{
    message: string
    count: number
    lastOccurred: Date
  }>
}

/**
 * 错误处理服务类
 */
export class ErrorHandlingService {
  private static instance: ErrorHandlingService

  // 服务状态
  public readonly state = reactive({
    errors: [] as ErrorInfo[],
    isReporting: false,
    lastError: null as ErrorInfo | null,
    statistics: {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoveredErrors: 0,
      unrecoveredErrors: 0,
      averageRecoveryTime: 0,
      topErrors: []
    } as ErrorStatistics
  })

  // 配置
  private config = ref<ErrorReportingConfig>({
    enabled: true,
    includeUserData: false,
    includeSystemInfo: true,
    batchSize: 10,
    flushInterval: 30000, // 30秒
    retryAttempts: 3
  })

  // 恢复策略映射
  private recoveryStrategies = new Map<ErrorType, RecoveryStrategy>()
  
  // 错误队列
  private errorQueue: ErrorInfo[] = []
  private reportingTimer?: number

  // 会话ID
  private sessionId = this.generateSessionId()

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService()
    }
    return ErrorHandlingService.instance
  }

  constructor() {
    this.initializeService()
  }

  /**
   * 初始化服务
   */
  private initializeService(): void {
    this.setupGlobalErrorHandlers()
    this.setupDefaultRecoveryStrategies()
    this.startReportingTimer()
    this.loadConfiguration()
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return

    // JavaScript错误处理
    window.addEventListener('error', (event) => {
      this.handleError({
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.HIGH,
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        context: {
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    // Promise拒绝处理
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: ErrorType.PROMISE_REJECTION,
        severity: ErrorSeverity.MEDIUM,
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        context: {
          reason: event.reason
        }
      })
    })

    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError({
          type: ErrorType.RESOURCE_ERROR,
          severity: ErrorSeverity.LOW,
          message: `Failed to load resource: ${(event.target as any)?.src || (event.target as any)?.href}`,
          context: {
            tagName: (event.target as any)?.tagName,
            src: (event.target as any)?.src,
            href: (event.target as any)?.href
          }
        })
      }
    }, true)
  }

  /**
   * 设置默认恢复策略
   */
  private setupDefaultRecoveryStrategies(): void {
    // JavaScript错误 - 重试
    this.recoveryStrategies.set(ErrorType.JAVASCRIPT_ERROR, {
      type: 'retry',
      maxAttempts: 2,
      delay: 1000
    })

    // 网络错误 - 重试
    this.recoveryStrategies.set(ErrorType.NETWORK_ERROR, {
      type: 'retry',
      maxAttempts: 3,
      delay: 2000
    })

    // 计算错误 - 回退
    this.recoveryStrategies.set(ErrorType.CALCULATION_ERROR, {
      type: 'fallback',
      maxAttempts: 1,
      fallbackComponent: 'ErrorFallback'
    })

    // 组件错误 - 回退
    this.recoveryStrategies.set(ErrorType.COMPONENT_ERROR, {
      type: 'fallback',
      maxAttempts: 1,
      fallbackComponent: 'ComponentErrorFallback'
    })

    // 验证错误 - 忽略
    this.recoveryStrategies.set(ErrorType.VALIDATION_ERROR, {
      type: 'ignore',
      maxAttempts: 0
    })

    // 资源错误 - 重试
    this.recoveryStrategies.set(ErrorType.RESOURCE_ERROR, {
      type: 'retry',
      maxAttempts: 2,
      delay: 1000
    })

    // 权限错误 - 重定向
    this.recoveryStrategies.set(ErrorType.PERMISSION_ERROR, {
      type: 'redirect',
      maxAttempts: 1,
      redirectUrl: '/login'
    })

    // 超时错误 - 重试
    this.recoveryStrategies.set(ErrorType.TIMEOUT_ERROR, {
      type: 'retry',
      maxAttempts: 2,
      delay: 3000
    })
  }

  /**
   * 处理错误
   */
  public handleError(errorData: Partial<ErrorInfo>): ErrorInfo {
    const error: ErrorInfo = {
      id: this.generateErrorId(),
      type: errorData.type || ErrorType.UNKNOWN_ERROR,
      severity: errorData.severity || ErrorSeverity.MEDIUM,
      message: errorData.message || 'Unknown error occurred',
      stack: errorData.stack,
      timestamp: new Date(),
      url: errorData.url || window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      context: errorData.context,
      componentStack: errorData.componentStack,
      props: errorData.props,
      recovered: false,
      retryCount: 0,
      maxRetries: this.getMaxRetries(errorData.type || ErrorType.UNKNOWN_ERROR)
    }

    // 添加到错误列表
    this.state.errors.push(error)
    this.state.lastError = error

    // 更新统计
    this.updateStatistics(error)

    // 尝试恢复
    this.attemptRecovery(error)

    // 添加到报告队列
    if (this.config.value.enabled) {
      this.errorQueue.push(error)
    }

    // 控制台输出
    console.error('Error handled by ErrorHandlingService:', error)

    return error
  }

  /**
   * 尝试错误恢复
   */
  private async attemptRecovery(error: ErrorInfo): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.type)
    if (!strategy || error.retryCount >= strategy.maxAttempts) {
      return false
    }

    error.retryCount++

    try {
      switch (strategy.type) {
        case 'retry':
          if (strategy.delay) {
            await this.delay(strategy.delay)
          }
          // 触发重试事件
          this.emitRecoveryEvent('retry', error)
          break

        case 'reload':
          window.location.reload()
          break

        case 'fallback':
          this.emitRecoveryEvent('fallback', error, strategy.fallbackComponent)
          break

        case 'redirect':
          if (strategy.redirectUrl) {
            window.location.href = strategy.redirectUrl
          }
          break

        case 'ignore':
          error.recovered = true
          this.state.statistics.recoveredErrors++
          break

        default:
          if (strategy.customHandler) {
            const recovered = await strategy.customHandler(error)
            if (recovered) {
              error.recovered = true
              this.state.statistics.recoveredErrors++
            }
          }
      }

      return error.recovered
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError)
      return false
    }
  }

  /**
   * 发出恢复事件
   */
  private emitRecoveryEvent(type: string, error: ErrorInfo, data?: any): void {
    const event = new CustomEvent('error-recovery', {
      detail: { type, error, data }
    })
    window.dispatchEvent(event)
  }

  /**
   * 报告错误到服务器
   */
  public async reportErrors(): Promise<void> {
    if (!this.config.value.enabled || this.errorQueue.length === 0 || this.state.isReporting) {
      return
    }

    this.state.isReporting = true

    try {
      const errors = this.errorQueue.splice(0, this.config.value.batchSize)
      const payload = {
        errors: errors.map(error => this.sanitizeError(error)),
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      if (this.config.value.endpoint) {
        await fetch(this.config.value.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.value.apiKey && {
              'Authorization': `Bearer ${this.config.value.apiKey}`
            })
          },
          body: JSON.stringify(payload)
        })
      }
    } catch (reportingError) {
      console.error('Failed to report errors:', reportingError)
      // 将错误重新加入队列
      this.errorQueue.unshift(...this.errorQueue)
    } finally {
      this.state.isReporting = false
    }
  }

  /**
   * 清理敏感信息
   */
  private sanitizeError(error: ErrorInfo): Partial<ErrorInfo> {
    const sanitized: Partial<ErrorInfo> = {
      id: error.id,
      type: error.type,
      severity: error.severity,
      message: error.message,
      timestamp: error.timestamp,
      url: error.url,
      recovered: error.recovered,
      retryCount: error.retryCount
    }

    if (this.config.value.includeSystemInfo) {
      sanitized.userAgent = error.userAgent
      sanitized.stack = error.stack
      sanitized.componentStack = error.componentStack
    }

    if (this.config.value.includeUserData) {
      sanitized.userId = error.userId
      sanitized.context = error.context
      sanitized.props = error.props
    }

    return sanitized
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(error: ErrorInfo): void {
    this.state.statistics.totalErrors++
    
    // 按类型统计
    this.state.statistics.errorsByType[error.type] = 
      (this.state.statistics.errorsByType[error.type] || 0) + 1
    
    // 按严重程度统计
    this.state.statistics.errorsBySeverity[error.severity] = 
      (this.state.statistics.errorsBySeverity[error.severity] || 0) + 1

    // 更新未恢复错误数
    if (!error.recovered) {
      this.state.statistics.unrecoveredErrors++
    }

    // 更新热门错误
    this.updateTopErrors(error)
  }

  /**
   * 更新热门错误
   */
  private updateTopErrors(error: ErrorInfo): void {
    const existing = this.state.statistics.topErrors.find(e => e.message === error.message)
    if (existing) {
      existing.count++
      existing.lastOccurred = error.timestamp
    } else {
      this.state.statistics.topErrors.push({
        message: error.message,
        count: 1,
        lastOccurred: error.timestamp
      })
    }

    // 保持前10个
    this.state.statistics.topErrors.sort((a, b) => b.count - a.count)
    this.state.statistics.topErrors = this.state.statistics.topErrors.slice(0, 10)
  }

  /**
   * 获取最大重试次数
   */
  private getMaxRetries(errorType: ErrorType): number {
    const strategy = this.recoveryStrategies.get(errorType)
    return strategy?.maxAttempts || 0
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 启动报告定时器
   */
  private startReportingTimer(): void {
    if (this.config.value.enabled && this.config.value.flushInterval > 0) {
      this.reportingTimer = window.setInterval(() => {
        this.reportErrors()
      }, this.config.value.flushInterval)
    }
  }

  /**
   * 停止报告定时器
   */
  private stopReportingTimer(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer)
      this.reportingTimer = undefined
    }
  }

  /**
   * 设置恢复策略
   */
  public setRecoveryStrategy(errorType: ErrorType, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy)
  }

  /**
   * 设置配置
   */
  public setConfig(newConfig: Partial<ErrorReportingConfig>): void {
    this.config.value = { ...this.config.value, ...newConfig }
    this.saveConfiguration()
    
    // 重启定时器
    this.stopReportingTimer()
    this.startReportingTimer()
  }

  /**
   * 获取错误统计
   */
  public getStatistics(): ErrorStatistics {
    return { ...this.state.statistics }
  }

  /**
   * 清除错误历史
   */
  public clearErrors(): void {
    this.state.errors = []
    this.state.lastError = null
    this.errorQueue = []
    this.state.statistics = {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      recoveredErrors: 0,
      unrecoveredErrors: 0,
      averageRecoveryTime: 0,
      topErrors: []
    }
  }

  /**
   * 加载配置
   */
  private loadConfiguration(): void {
    try {
      const saved = localStorage.getItem('error-handling-config')
      if (saved) {
        const config = JSON.parse(saved)
        this.config.value = { ...this.config.value, ...config }
      }
    } catch (error) {
      console.warn('Failed to load error handling config:', error)
    }
  }

  /**
   * 保存配置
   */
  private saveConfiguration(): void {
    try {
      localStorage.setItem('error-handling-config', JSON.stringify(this.config.value))
    } catch (error) {
      console.warn('Failed to save error handling config:', error)
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.stopReportingTimer()
    this.clearErrors()
    this.recoveryStrategies.clear()
  }
}

// 导出单例实例
export const errorHandlingService = ErrorHandlingService.getInstance()

// 便捷的组合式API
export function useErrorHandling() {
  const service = ErrorHandlingService.getInstance()
  
  return {
    // 状态
    errors: () => service.state.errors,
    lastError: () => service.state.lastError,
    statistics: () => service.state.statistics,
    isReporting: () => service.state.isReporting,
    
    // 方法
    handleError: service.handleError.bind(service),
    reportErrors: service.reportErrors.bind(service),
    setRecoveryStrategy: service.setRecoveryStrategy.bind(service),
    setConfig: service.setConfig.bind(service),
    getStatistics: service.getStatistics.bind(service),
    clearErrors: service.clearErrors.bind(service)
  }
}
