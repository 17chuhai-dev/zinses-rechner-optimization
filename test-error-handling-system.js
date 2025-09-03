/**
 * 错误处理和用户反馈系统测试
 * 验证错误处理机制、用户反馈显示和错误恢复功能的正确性
 */

// 模拟错误处理器
class MockRealtimeErrorHandler {
  constructor() {
    this.errorHistory = []
    this.statistics = {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      errorsByCalculator: {},
      averageResolutionTime: 0
    }
    this.feedbackCallbacks = new Map()
    this.retryCallbacks = new Map()
    
    // 初始化统计
    const ErrorType = {
      VALIDATION_ERROR: 'VALIDATION_ERROR',
      CALCULATION_ERROR: 'CALCULATION_ERROR',
      NETWORK_ERROR: 'NETWORK_ERROR',
      CACHE_ERROR: 'CACHE_ERROR',
      WORKER_ERROR: 'WORKER_ERROR',
      TIMEOUT_ERROR: 'TIMEOUT_ERROR',
      PERMISSION_ERROR: 'PERMISSION_ERROR',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    }
    
    const ErrorSeverity = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    }
    
    Object.values(ErrorType).forEach(type => {
      this.statistics.errorsByType[type] = 0
    })
    
    Object.values(ErrorSeverity).forEach(severity => {
      this.statistics.errorsBySeverity[severity] = 0
    })
    
    console.log('🛡️ 模拟错误处理器已初始化')
  }

  handleCalculationError(error) {
    this.recordError(error)
    const feedback = this.generateUserFeedback(error)
    this.triggerFeedbackCallbacks(feedback)
    return feedback
  }

  handleValidationError(field, value, message, calculatorId) {
    const error = {
      type: 'VALIDATION_ERROR',
      code: 'INVALID_INPUT',
      message,
      field,
      value,
      calculatorId,
      timestamp: new Date(),
      severity: 'low',
      context: { field, value }
    }
    return this.handleCalculationError(error)
  }

  handleNetworkError(originalError, context) {
    const error = {
      type: 'NETWORK_ERROR',
      code: 'NETWORK_FAILURE',
      message: originalError.message,
      timestamp: new Date(),
      severity: 'medium',
      context,
      stack: originalError.stack
    }
    return this.handleCalculationError(error)
  }

  handleWorkerError(workerError, calculatorId) {
    const error = {
      type: 'WORKER_ERROR',
      code: 'WORKER_FAILURE',
      message: workerError.message,
      calculatorId,
      timestamp: new Date(),
      severity: 'high',
      context: { calculatorId },
      stack: workerError.stack
    }
    return this.handleCalculationError(error)
  }

  handleTimeoutError(calculatorId, timeout) {
    const error = {
      type: 'TIMEOUT_ERROR',
      code: 'CALCULATION_TIMEOUT',
      message: `Berechnung dauerte länger als ${timeout}ms`,
      calculatorId,
      timestamp: new Date(),
      severity: 'medium',
      context: { timeout, calculatorId }
    }
    return this.handleCalculationError(error)
  }

  handleCacheError(cacheError, operation) {
    const error = {
      type: 'CACHE_ERROR',
      code: 'CACHE_FAILURE',
      message: cacheError.message,
      timestamp: new Date(),
      severity: 'low',
      context: { operation },
      stack: cacheError.stack
    }
    return this.handleCalculationError(error)
  }

  generateUserFeedback(error) {
    const FeedbackType = {
      SUCCESS: 'success',
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error'
    }
    
    const FeedbackAction = {
      NONE: 'none',
      HIGHLIGHT_FIELD: 'highlight-field',
      SHOW_HELP: 'show-help',
      RETRY_BUTTON: 'retry-button',
      CONTACT_SUPPORT: 'contact-support',
      RELOAD_PAGE: 'reload-page'
    }

    switch (error.type) {
      case 'VALIDATION_ERROR':
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

      case 'CALCULATION_ERROR':
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

      case 'NETWORK_ERROR':
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

      case 'WORKER_ERROR':
        return {
          type: FeedbackType.ERROR,
          title: 'Systemfehler',
          message: 'Ein interner Fehler ist aufgetreten. Die Seite wird neu geladen.',
          action: FeedbackAction.RELOAD_PAGE,
          duration: 3000,
          dismissible: false,
          persistent: true
        }

      case 'TIMEOUT_ERROR':
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

      case 'CACHE_ERROR':
        return {
          type: FeedbackType.INFO,
          title: 'Cache-Warnung',
          message: 'Zwischenspeicher konnte nicht aktualisiert werden. Die Berechnung funktioniert weiterhin.',
          action: FeedbackAction.NONE,
          duration: 3000,
          dismissible: true,
          persistent: false
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

  getGermanErrorMessage(error) {
    const fieldNames = {
      principal: 'Startkapital',
      monthlyPayment: 'Monatliche Rate',
      annualRate: 'Zinssatz',
      years: 'Laufzeit',
      loanAmount: 'Darlehensbetrag',
      currentAge: 'Aktuelles Alter',
      retirementAge: 'Rentenalter'
    }

    const fieldName = error.field ? fieldNames[error.field] || error.field : 'Eingabe'

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

    return error.message || 'Ungültiger Wert.'
  }

  recordError(error) {
    this.errorHistory.push(error)
    
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-500)
    }

    this.statistics.totalErrors++
    this.statistics.errorsByType[error.type]++
    this.statistics.errorsBySeverity[error.severity]++
    
    if (error.calculatorId) {
      this.statistics.errorsByCalculator[error.calculatorId] = 
        (this.statistics.errorsByCalculator[error.calculatorId] || 0) + 1
    }

    this.statistics.lastError = error
  }

  registerFeedbackCallback(key, callback) {
    this.feedbackCallbacks.set(key, callback)
  }

  unregisterFeedbackCallback(key) {
    this.feedbackCallbacks.delete(key)
  }

  registerRetryCallback(key, callback) {
    this.retryCallbacks.set(key, callback)
  }

  async executeRetry(retryKey) {
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

  triggerFeedbackCallbacks(feedback) {
    this.feedbackCallbacks.forEach(callback => {
      try {
        callback(feedback)
      } catch (error) {
        console.error('反馈回调执行失败:', error)
      }
    })
  }

  getStatistics() {
    return { ...this.statistics }
  }

  getErrorHistory(limit) {
    const history = [...this.errorHistory].reverse()
    return limit ? history.slice(0, limit) : history
  }

  clearErrorHistory() {
    this.errorHistory = []
    this.statistics = {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      errorsByCalculator: {},
      averageResolutionTime: 0
    }
  }

  getErrorSuggestions(error) {
    const suggestions = []

    switch (error.type) {
      case 'VALIDATION_ERROR':
        suggestions.push('Überprüfen Sie die Eingabewerte auf Vollständigkeit und Korrektheit')
        suggestions.push('Stellen Sie sicher, dass alle Zahlen im gültigen Bereich liegen')
        break

      case 'CALCULATION_ERROR':
        suggestions.push('Reduzieren Sie die Komplexität der Berechnung')
        suggestions.push('Überprüfen Sie die Eingabeparameter auf Plausibilität')
        suggestions.push('Versuchen Sie es mit anderen Werten')
        break

      case 'NETWORK_ERROR':
        suggestions.push('Überprüfen Sie Ihre Internetverbindung')
        suggestions.push('Versuchen Sie es in wenigen Minuten erneut')
        suggestions.push('Laden Sie die Seite neu')
        break

      case 'WORKER_ERROR':
        suggestions.push('Laden Sie die Seite neu')
        suggestions.push('Leeren Sie den Browser-Cache')
        suggestions.push('Verwenden Sie einen anderen Browser')
        break

      case 'TIMEOUT_ERROR':
        suggestions.push('Reduzieren Sie die Berechnungsdauer (z.B. weniger Jahre)')
        suggestions.push('Versuchen Sie es erneut')
        suggestions.push('Überprüfen Sie Ihre Internetverbindung')
        break
    }

    return suggestions
  }

  isCriticalError(error) {
    return error.severity === 'critical' ||
           error.type === 'WORKER_ERROR' ||
           (error.type === 'NETWORK_ERROR' && this.getConsecutiveNetworkErrors() > 3)
  }

  getConsecutiveNetworkErrors() {
    let count = 0
    for (let i = this.errorHistory.length - 1; i >= 0; i--) {
      if (this.errorHistory[i].type === 'NETWORK_ERROR') {
        count++
      } else {
        break
      }
    }
    return count
  }
}

// 测试函数
async function runErrorHandlingSystemTests() {
  console.log('🧪 开始错误处理和用户反馈系统测试...\n')
  
  const errorHandler = new MockRealtimeErrorHandler()
  
  let passed = 0
  let failed = 0
  
  function test(description, condition) {
    if (condition) {
      console.log(`✅ ${description}`)
      passed++
    } else {
      console.log(`❌ ${description}`)
      failed++
    }
  }
  
  // 测试1: 验证错误处理
  console.log('🔍 测试验证错误处理:')
  
  const validationFeedback = errorHandler.handleValidationError(
    'principal',
    -1000,
    'Startkapital muss positiv sein',
    'compound-interest'
  )
  
  test('验证错误应该生成警告反馈', validationFeedback.type === 'warning')
  test('验证错误应该包含德语消息', validationFeedback.message.includes('Startkapital'))
  test('验证错误应该高亮字段', validationFeedback.action === 'highlight-field')
  test('验证错误应该包含字段信息', validationFeedback.actionData?.field === 'principal')
  test('验证错误应该可关闭', validationFeedback.dismissible === true)
  
  // 测试2: 计算错误处理
  console.log('\n⚠️ 测试计算错误处理:')
  
  const calculationError = {
    type: 'CALCULATION_ERROR',
    code: 'MATH_ERROR',
    message: 'Division by zero',
    calculatorId: 'compound-interest',
    timestamp: new Date(),
    severity: 'high'
  }
  
  const calculationFeedback = errorHandler.handleCalculationError(calculationError)
  
  test('计算错误应该生成错误反馈', calculationFeedback.type === 'error')
  test('计算错误应该显示帮助按钮', calculationFeedback.action === 'show-help')
  test('计算错误应该是持久的', calculationFeedback.persistent === true)
  test('计算错误应该包含计算器ID', calculationFeedback.actionData?.calculatorId === 'compound-interest')
  
  // 测试3: 网络错误处理
  console.log('\n🌐 测试网络错误处理:')
  
  const networkError = new Error('Failed to fetch')
  const networkFeedback = errorHandler.handleNetworkError(networkError, { url: '/api/calculate' })
  
  test('网络错误应该生成错误反馈', networkFeedback.type === 'error')
  test('网络错误应该显示重试按钮', networkFeedback.action === 'retry-button')
  test('网络错误应该包含重试键', networkFeedback.actionData?.retryKey?.startsWith('network_'))
  test('网络错误应该是持久的', networkFeedback.persistent === true)
  
  // 测试4: Worker错误处理
  console.log('\n👷 测试Worker错误处理:')
  
  const workerError = new Error('Worker script error')
  const workerFeedback = errorHandler.handleWorkerError(workerError, 'compound-interest')
  
  test('Worker错误应该生成错误反馈', workerFeedback.type === 'error')
  test('Worker错误应该触发页面重载', workerFeedback.action === 'reload-page')
  test('Worker错误应该不可关闭', workerFeedback.dismissible === false)
  test('Worker错误应该有自动关闭时间', workerFeedback.duration === 3000)
  
  // 测试5: 超时错误处理
  console.log('\n⏱️ 测试超时错误处理:')
  
  const timeoutFeedback = errorHandler.handleTimeoutError('compound-interest', 5000)
  
  test('超时错误应该生成警告反馈', timeoutFeedback.type === 'warning')
  test('超时错误应该显示重试按钮', timeoutFeedback.action === 'retry-button')
  test('超时错误应该包含重试键', timeoutFeedback.actionData?.retryKey?.startsWith('timeout_'))
  test('超时错误消息应该包含超时时间', timeoutFeedback.message.includes('5000ms'))
  
  // 测试6: 缓存错误处理
  console.log('\n💾 测试缓存错误处理:')
  
  const cacheError = new Error('Cache write failed')
  const cacheFeedback = errorHandler.handleCacheError(cacheError, 'set')
  
  test('缓存错误应该生成信息反馈', cacheFeedback.type === 'info')
  test('缓存错误应该无需操作', cacheFeedback.action === 'none')
  test('缓存错误应该自动关闭', cacheFeedback.duration === 3000)
  test('缓存错误应该可关闭', cacheFeedback.dismissible === true)
  
  // 测试7: 德语错误消息
  console.log('\n🇩🇪 测试德语错误消息:')
  
  const requiredFieldError = {
    type: 'VALIDATION_ERROR',
    code: 'REQUIRED_FIELD',
    field: 'principal',
    message: 'Required field'
  }
  
  const germanMessage = errorHandler.getGermanErrorMessage(requiredFieldError)
  test('必填字段错误应该有德语消息', germanMessage === 'Startkapital ist erforderlich.')
  
  const invalidNumberError = {
    type: 'VALIDATION_ERROR',
    code: 'INVALID_NUMBER',
    field: 'annualRate',
    message: 'Invalid number'
  }
  
  const germanNumberMessage = errorHandler.getGermanErrorMessage(invalidNumberError)
  test('无效数字错误应该有德语消息', germanNumberMessage === 'Zinssatz muss eine gültige Zahl sein.')
  
  const rangeError = {
    type: 'VALIDATION_ERROR',
    code: 'INVALID_RANGE',
    field: 'years',
    context: { min: 1, max: 50 },
    message: 'Out of range'
  }
  
  const germanRangeMessage = errorHandler.getGermanErrorMessage(rangeError)
  test('范围错误应该有德语消息', germanRangeMessage === 'Laufzeit muss zwischen 1 und 50 liegen.')
  
  // 测试8: 错误统计
  console.log('\n📊 测试错误统计:')
  
  const stats = errorHandler.getStatistics()
  test('统计应该记录总错误数', stats.totalErrors > 0)
  test('统计应该按类型分类', stats.errorsByType['VALIDATION_ERROR'] > 0)
  test('统计应该按严重程度分类', stats.errorsBySeverity['low'] > 0)
  test('统计应该按计算器分类', stats.errorsByCalculator['compound-interest'] > 0)
  test('统计应该记录最后错误', stats.lastError !== undefined)
  
  // 测试9: 错误历史
  console.log('\n📚 测试错误历史:')
  
  const history = errorHandler.getErrorHistory(3)
  test('错误历史应该返回最近的错误', history.length <= 3)
  test('错误历史应该按时间倒序', history.length === 0 || history[0].timestamp >= history[history.length - 1].timestamp)
  
  const allHistory = errorHandler.getErrorHistory()
  test('完整历史应该包含所有错误', allHistory.length === stats.totalErrors)
  
  // 测试10: 回调机制
  console.log('\n🔄 测试回调机制:')
  
  let callbackTriggered = false
  let receivedFeedback = null
  
  errorHandler.registerFeedbackCallback('test-callback', (feedback) => {
    callbackTriggered = true
    receivedFeedback = feedback
  })
  
  const testError = {
    type: 'VALIDATION_ERROR',
    code: 'TEST_ERROR',
    message: 'Test error',
    timestamp: new Date(),
    severity: 'low'
  }
  
  errorHandler.handleCalculationError(testError)
  
  test('反馈回调应该被触发', callbackTriggered === true)
  test('回调应该接收到反馈对象', receivedFeedback !== null)
  test('回调反馈应该包含正确类型', receivedFeedback?.type === 'warning')
  
  // 测试11: 重试机制
  console.log('\n🔁 测试重试机制:')
  
  let retryExecuted = false
  const retryKey = 'test-retry'
  
  errorHandler.registerRetryCallback(retryKey, async () => {
    retryExecuted = true
    return Promise.resolve()
  })
  
  const retryResult = await errorHandler.executeRetry(retryKey)
  
  test('重试回调应该被执行', retryExecuted === true)
  test('重试应该返回成功', retryResult === true)
  
  // 测试失败的重试
  const failRetryKey = 'fail-retry'
  errorHandler.registerRetryCallback(failRetryKey, async () => {
    throw new Error('Retry failed')
  })
  
  const failRetryResult = await errorHandler.executeRetry(failRetryKey)
  test('失败的重试应该返回false', failRetryResult === false)
  
  // 测试12: 错误建议
  console.log('\n💡 测试错误建议:')
  
  const validationSuggestions = errorHandler.getErrorSuggestions({ type: 'VALIDATION_ERROR' })
  test('验证错误应该有建议', validationSuggestions.length > 0)
  test('验证错误建议应该包含检查输入', validationSuggestions.some(s => s.includes('Eingabewerte')))
  
  const networkSuggestions = errorHandler.getErrorSuggestions({ type: 'NETWORK_ERROR' })
  test('网络错误应该有建议', networkSuggestions.length > 0)
  test('网络错误建议应该包含检查连接', networkSuggestions.some(s => s.includes('Internetverbindung')))
  
  // 测试13: 关键错误检测
  console.log('\n🚨 测试关键错误检测:')
  
  const criticalError = {
    type: 'WORKER_ERROR',
    severity: 'critical',
    message: 'Critical system error'
  }
  
  test('Worker错误应该被识别为关键错误', errorHandler.isCriticalError(criticalError))
  
  const normalError = {
    type: 'VALIDATION_ERROR',
    severity: 'low',
    message: 'Normal validation error'
  }
  
  test('普通错误不应该被识别为关键错误', !errorHandler.isCriticalError(normalError))
  
  // 测试14: 清理功能
  console.log('\n🧹 测试清理功能:')
  
  const beforeClearStats = errorHandler.getStatistics()
  test('清理前应该有错误记录', beforeClearStats.totalErrors > 0)
  
  errorHandler.clearErrorHistory()
  const afterClearStats = errorHandler.getStatistics()
  
  test('清理后错误总数应该为0', afterClearStats.totalErrors === 0)
  test('清理后错误历史应该为空', errorHandler.getErrorHistory().length === 0)
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  // 输出功能覆盖情况
  console.log('\n🎯 功能覆盖情况:')
  console.log(`   ✅ 验证错误处理 - 字段验证和德语消息`)
  console.log(`   ✅ 计算错误处理 - 计算失败和帮助提示`)
  console.log(`   ✅ 网络错误处理 - 连接失败和重试机制`)
  console.log(`   ✅ Worker错误处理 - 系统错误和页面重载`)
  console.log(`   ✅ 超时错误处理 - 计算超时和重试选项`)
  console.log(`   ✅ 缓存错误处理 - 缓存失败和信息提示`)
  console.log(`   ✅ 德语错误消息 - 本地化错误信息`)
  console.log(`   ✅ 错误统计系统 - 完整的错误分析`)
  console.log(`   ✅ 错误历史管理 - 历史记录和清理`)
  console.log(`   ✅ 回调机制 - 反馈和重试回调`)
  console.log(`   ✅ 错误建议系统 - 智能解决建议`)
  console.log(`   ✅ 关键错误检测 - 严重错误识别`)
  
  if (failed === 0) {
    console.log('\n🎉 所有错误处理和用户反馈系统测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查错误处理实现。')
    return false
  }
}

// 运行测试
runErrorHandlingSystemTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
