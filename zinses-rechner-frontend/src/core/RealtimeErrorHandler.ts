/**
 * 实时计算错误处理和用户反馈系统
 * 实现完整的错误处理机制，包括计算失败提示、参数验证错误和网络错误处理
 */

// 错误类型枚举
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  WORKER_ERROR = 'WORKER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 用户反馈类型
export enum FeedbackType {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

// 用户反馈动作
export enum FeedbackAction {
  NONE = 'none',
  HIGHLIGHT_FIELD = 'highlight-field',
  SHOW_HELP = 'show-help',
  RETRY_BUTTON = 'retry-button',
  CONTACT_SUPPORT = 'contact-support',
  RELOAD_PAGE = 'reload-page'
}

// 计算错误接口
export interface CalculationError {
  type: ErrorType
  code: string
  message: string
  field?: string
  value?: any
  calculatorId?: string
  timestamp: Date
  severity: ErrorSeverity
  context?: Record<string, any>
  stack?: string
}

// 用户反馈接口
export interface UserFeedback {
  type: FeedbackType
  title: string
  message: string
  action: FeedbackAction
  actionData?: Record<string, any>
  duration?: number
  dismissible: boolean
  persistent: boolean
}

// 错误统计接口
export interface ErrorStatistics {
  totalErrors: number
  errorsByType: Record<ErrorType, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  errorsByCalculator: Record<string, number>
  averageResolutionTime: number
  lastError?: CalculationError
}

/**
 * 实时错误处理器类
 */
export class RealtimeErrorHandler {
  private static instance: RealtimeErrorHandler
  private errorHistory: CalculationError[] = []
  private statistics: ErrorStatistics
  private feedbackCallbacks = new Map<string, (feedback: UserFeedback) => void>()
  private retryCallbacks = new Map<string, () => Promise<void>>()

  constructor() {
    this.statistics = {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByCalculator: {},
      averageResolutionTime: 0
    }

    // 初始化错误统计
    Object.values(ErrorType).forEach(type => {
      this.statistics.errorsByType[type] = 0
    })

    Object.values(ErrorSeverity).forEach(severity => {
      this.statistics.errorsBySeverity[severity] = 0
    })

    console.log('🛡️ 实时错误处理器已初始化')
  }

  static getInstance(): RealtimeErrorHandler {
    if (!RealtimeErrorHandler.instance) {
      RealtimeErrorHandler.instance = new RealtimeErrorHandler()
    }
    return RealtimeErrorHandler.instance
  }

  /**
   * 处理计算错误
   */
  handleCalculationError(error: CalculationError): UserFeedback {
    // 记录错误
    this.recordError(error)

    // 生成用户反馈
    const feedback = this.generateUserFeedback(error)

    // 触发反馈回调
    this.triggerFeedbackCallbacks(feedback)

    console.error('❌ 计算错误:', error)
    return feedback
  }

  /**
   * 处理验证错误
   */
  handleValidationError(field: string, value: any, message: string, calculatorId?: string): UserFeedback {
    const error: CalculationError = {
      type: ErrorType.VALIDATION_ERROR,
      code: 'INVALID_INPUT',
      message,
      field,
      value,
      calculatorId,
      timestamp: new Date(),
      severity: ErrorSeverity.LOW,
      context: { field, value }
    }

    return this.handleCalculationError(error)
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(originalError: Error, context?: Record<string, any>): UserFeedback {
    const error: CalculationError = {
      type: ErrorType.NETWORK_ERROR,
      code: 'NETWORK_FAILURE',
      message: originalError.message,
      timestamp: new Date(),
      severity: ErrorSeverity.MEDIUM,
      context,
      stack: originalError.stack
    }

    return this.handleCalculationError(error)
  }

  /**
   * 处理Worker错误
   */
  handleWorkerError(workerError: Error, calculatorId: string): UserFeedback {
    const error: CalculationError = {
      type: ErrorType.WORKER_ERROR,
      code: 'WORKER_FAILURE',
      message: workerError.message,
      calculatorId,
      timestamp: new Date(),
      severity: ErrorSeverity.HIGH,
      context: { calculatorId },
      stack: workerError.stack
    }

    return this.handleCalculationError(error)
  }

  /**
   * 处理超时错误
   */
  handleTimeoutError(calculatorId: string, timeout: number): UserFeedback {
    const error: CalculationError = {
      type: ErrorType.TIMEOUT_ERROR,
      code: 'CALCULATION_TIMEOUT',
      message: `Berechnung dauerte länger als ${timeout}ms`,
      calculatorId,
      timestamp: new Date(),
      severity: ErrorSeverity.MEDIUM,
      context: { timeout, calculatorId }
    }

    return this.handleCalculationError(error)
  }

  /**
   * 处理缓存错误
   */
  handleCacheError(cacheError: Error, operation: string): UserFeedback {
    const error: CalculationError = {
      type: ErrorType.CACHE_ERROR,
      code: 'CACHE_FAILURE',
      message: cacheError.message,
      timestamp: new Date(),
      severity: ErrorSeverity.LOW,
      context: { operation },
      stack: cacheError.stack
    }

    return this.handleCalculationError(error)
  }

  /**
   * 生成用户反馈
   */
  private generateUserFeedback(error: CalculationError): UserFeedback {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return {
          type: FeedbackType.WARNING,
          title: 'Eingabefehler',
          message: this.getGermanErrorMessage(error),
          action: FeedbackAction.HIGHLIGHT_FIELD,
          actionData: { field: error.field },
          duration: 5000,
          dismissible: true,
          persistent: false
        }

      case ErrorType.CALCULATION_ERROR:
        return {
          type: FeedbackType.ERROR,
          title: 'Berechnungsfehler',
          message: 'Die Berechnung konnte nicht durchgeführt werden. Bitte überprüfen Sie Ihre Eingaben.',
          action: FeedbackAction.SHOW_HELP,
          actionData: { calculatorId: error.calculatorId },
          duration: 0,
          dismissible: true,
          persistent: true
        }

      case ErrorType.NETWORK_ERROR:
        return {
          type: FeedbackType.ERROR,
          title: 'Verbindungsfehler',
          message: 'Keine Internetverbindung. Bitte überprüfen Sie Ihre Netzwerkeinstellungen.',
          action: FeedbackAction.RETRY_BUTTON,
          actionData: { retryKey: `network_${Date.now()}` },
          duration: 0,
          dismissible: true,
          persistent: true
        }

      case ErrorType.WORKER_ERROR:
        return {
          type: FeedbackType.ERROR,
          title: 'Systemfehler',
          message: 'Ein interner Fehler ist aufgetreten. Die Seite wird neu geladen.',
          action: FeedbackAction.RELOAD_PAGE,
          duration: 3000,
          dismissible: false,
          persistent: true
        }

      case ErrorType.TIMEOUT_ERROR:
        return {
          type: FeedbackType.WARNING,
          title: 'Zeitüberschreitung',
          message: error.message || 'Die Berechnung dauert länger als erwartet. Möchten Sie es erneut versuchen?',
          action: FeedbackAction.RETRY_BUTTON,
          actionData: { retryKey: `timeout_${error.calculatorId}` },
          duration: 0,
          dismissible: true,
          persistent: true
        }

      case ErrorType.CACHE_ERROR:
        return {
          type: FeedbackType.INFO,
          title: 'Cache-Warnung',
          message: 'Zwischenspeicher konnte nicht aktualisiert werden. Die Berechnung funktioniert weiterhin.',
          action: FeedbackAction.NONE,
          duration: 3000,
          dismissible: true,
          persistent: false
        }

      case ErrorType.PERMISSION_ERROR:
        return {
          type: FeedbackType.ERROR,
          title: 'Berechtigungsfehler',
          message: 'Sie haben keine Berechtigung für diese Aktion.',
          action: FeedbackAction.CONTACT_SUPPORT,
          duration: 0,
          dismissible: true,
          persistent: true
        }

      default:
        return {
          type: FeedbackType.ERROR,
          title: 'Unbekannter Fehler',
          message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte kontaktieren Sie den Support.',
          action: FeedbackAction.CONTACT_SUPPORT,
          duration: 0,
          dismissible: true,
          persistent: true
        }
    }
  }

  /**
   * 获取德语错误消息
   */
  private getGermanErrorMessage(error: CalculationError): string {
    const fieldNames: Record<string, string> = {
      principal: 'Startkapital',
      monthlyPayment: 'Monatliche Rate',
      annualRate: 'Zinssatz',
      years: 'Laufzeit',
      loanAmount: 'Darlehensbetrag',
      currentAge: 'Aktuelles Alter',
      retirementAge: 'Rentenalter'
    }

    const fieldName = error.field ? fieldNames[error.field] || error.field : 'Eingabe'

    // 常见验证错误消息
    if (error.code === 'REQUIRED_FIELD') {
      return `${fieldName} ist erforderlich.`
    }

    if (error.code === 'INVALID_NUMBER') {
      return `${fieldName} muss eine gültige Zahl sein.`
    }

    if (error.code === 'MIN_VALUE') {
      return `${fieldName} muss mindestens ${error.context?.min} betragen.`
    }

    if (error.code === 'MAX_VALUE') {
      return `${fieldName} darf höchstens ${error.context?.max} betragen.`
    }

    if (error.code === 'INVALID_RANGE') {
      return `${fieldName} muss zwischen ${error.context?.min} und ${error.context?.max} liegen.`
    }

    if (error.code === 'INVALID_FORMAT') {
      return `${fieldName} hat ein ungültiges Format.`
    }

    return error.message || 'Ungültiger Wert.'
  }

  /**
   * 记录错误
   */
  private recordError(error: CalculationError): void {
    // 添加到历史记录
    this.errorHistory.push(error)

    // 限制历史记录大小
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-500)
    }

    // 更新统计
    this.statistics.totalErrors++
    this.statistics.errorsByType[error.type]++
    this.statistics.errorsBySeverity[error.severity]++

    if (error.calculatorId) {
      this.statistics.errorsByCalculator[error.calculatorId] =
        (this.statistics.errorsByCalculator[error.calculatorId] || 0) + 1
    }

    this.statistics.lastError = error
  }

  /**
   * 注册反馈回调
   */
  registerFeedbackCallback(key: string, callback: (feedback: UserFeedback) => void): void {
    this.feedbackCallbacks.set(key, callback)
  }

  /**
   * 注销反馈回调
   */
  unregisterFeedbackCallback(key: string): void {
    this.feedbackCallbacks.delete(key)
  }

  /**
   * 注册重试回调
   */
  registerRetryCallback(key: string, callback: () => Promise<void>): void {
    this.retryCallbacks.set(key, callback)
  }

  /**
   * 执行重试
   */
  async executeRetry(retryKey: string): Promise<boolean> {
    const callback = this.retryCallbacks.get(retryKey)
    if (callback) {
      try {
        await callback()
        this.retryCallbacks.delete(retryKey)
        return true
      } catch (error) {
        console.error('重试失败:', error)
        return false
      }
    }
    return false
  }

  /**
   * 触发反馈回调
   */
  private triggerFeedbackCallbacks(feedback: UserFeedback): void {
    this.feedbackCallbacks.forEach(callback => {
      try {
        callback(feedback)
      } catch (error) {
        console.error('反馈回调执行失败:', error)
      }
    })
  }

  /**
   * 获取错误统计
   */
  getStatistics(): ErrorStatistics {
    return { ...this.statistics }
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(limit?: number): CalculationError[] {
    const history = [...this.errorHistory].reverse()
    return limit ? history.slice(0, limit) : history
  }

  /**
   * 清除错误历史
   */
  clearErrorHistory(): void {
    this.errorHistory = []
    this.statistics = {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByCalculator: {},
      averageResolutionTime: 0
    }

    // 重新初始化统计
    Object.values(ErrorType).forEach(type => {
      this.statistics.errorsByType[type] = 0
    })

    Object.values(ErrorSeverity).forEach(severity => {
      this.statistics.errorsBySeverity[severity] = 0
    })

    console.log('🧹 错误历史已清除')
  }

  /**
   * 获取错误建议
   */
  getErrorSuggestions(error: CalculationError): string[] {
    const suggestions: string[] = []

    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        suggestions.push('Überprüfen Sie die Eingabewerte auf Vollständigkeit und Korrektheit')
        suggestions.push('Stellen Sie sicher, dass alle Zahlen im gültigen Bereich liegen')
        break

      case ErrorType.CALCULATION_ERROR:
        suggestions.push('Reduzieren Sie die Komplexität der Berechnung')
        suggestions.push('Überprüfen Sie die Eingabeparameter auf Plausibilität')
        suggestions.push('Versuchen Sie es mit anderen Werten')
        break

      case ErrorType.NETWORK_ERROR:
        suggestions.push('Überprüfen Sie Ihre Internetverbindung')
        suggestions.push('Versuchen Sie es in wenigen Minuten erneut')
        suggestions.push('Laden Sie die Seite neu')
        break

      case ErrorType.WORKER_ERROR:
        suggestions.push('Laden Sie die Seite neu')
        suggestions.push('Leeren Sie den Browser-Cache')
        suggestions.push('Verwenden Sie einen anderen Browser')
        break

      case ErrorType.TIMEOUT_ERROR:
        suggestions.push('Reduzieren Sie die Berechnungsdauer (z.B. weniger Jahre)')
        suggestions.push('Versuchen Sie es erneut')
        suggestions.push('Überprüfen Sie Ihre Internetverbindung')
        break
    }

    return suggestions
  }

  /**
   * 检查是否为关键错误
   */
  isCriticalError(error: CalculationError): boolean {
    return error.severity === ErrorSeverity.CRITICAL ||
           error.type === ErrorType.WORKER_ERROR ||
           (error.type === ErrorType.NETWORK_ERROR && this.getConsecutiveNetworkErrors() > 3)
  }

  /**
   * 获取连续网络错误数量
   */
  private getConsecutiveNetworkErrors(): number {
    let count = 0
    for (let i = this.errorHistory.length - 1; i >= 0; i--) {
      if (this.errorHistory[i].type === ErrorType.NETWORK_ERROR) {
        count++
      } else {
        break
      }
    }
    return count
  }
}

// 导出默认实例
export const realtimeErrorHandler = RealtimeErrorHandler.getInstance()
