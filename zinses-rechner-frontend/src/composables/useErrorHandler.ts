/**
 * 错误处理系统
 * 统一管理应用中的错误处理和用户反馈
 */

import { ref, computed } from 'vue'

export interface AppError {
  id: string
  type: 'validation' | 'network' | 'calculation' | 'system' | 'user'
  code: string
  title: string
  message: string
  details?: string
  timestamp: Date
  retryable: boolean
  actions?: ErrorAction[]
}

export interface ErrorAction {
  label: string
  action: () => void | Promise<void>
  primary?: boolean
}

export interface ValidationError {
  field: string
  code: string
  message: string
  value?: any
}

// 德语错误消息映射
const errorMessages = {
  // 验证错误
  INVALID_PRINCIPAL: {
    title: 'Ungültiges Startkapital',
    message: 'Das Startkapital muss zwischen 1€ und 10.000.000€ liegen.',
    details: 'Bitte geben Sie einen realistischen Betrag für Ihr Startkapital ein.'
  },
  INVALID_RATE: {
    title: 'Ungültiger Zinssatz',
    message: 'Der Zinssatz muss zwischen 0% und 20% liegen.',
    details: 'Sehr hohe Zinssätze sind unrealistisch. Prüfen Sie Ihre Eingabe.'
  },
  INVALID_YEARS: {
    title: 'Ungültige Laufzeit',
    message: 'Die Laufzeit muss zwischen 1 und 50 Jahren liegen.',
    details: 'Wählen Sie eine realistische Anlagedauer für Ihre Berechnung.'
  },
  INVALID_MONTHLY_PAYMENT: {
    title: 'Ungültige Sparrate',
    message: 'Die monatliche Sparrate muss zwischen 0€ und 50.000€ liegen.',
    details: 'Geben Sie eine realistische monatliche Sparrate ein.'
  },
  REQUIRED_FIELD: {
    title: 'Pflichtfeld fehlt',
    message: 'Dieses Feld ist erforderlich.',
    details: 'Bitte füllen Sie alle Pflichtfelder aus.'
  },

  // Netzwerk-Fehler
  NETWORK_ERROR: {
    title: 'Verbindungsfehler',
    message: 'Keine Internetverbindung verfügbar.',
    details: 'Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.'
  },
  SERVER_ERROR: {
    title: 'Server-Fehler',
    message: 'Der Server ist vorübergehend nicht verfügbar.',
    details: 'Bitte versuchen Sie es in wenigen Minuten erneut.'
  },
  TIMEOUT_ERROR: {
    title: 'Zeitüberschreitung',
    message: 'Die Anfrage dauerte zu lange.',
    details: 'Der Server antwortet nicht. Versuchen Sie es später erneut.'
  },

  // Berechnungsfehler
  CALCULATION_ERROR: {
    title: 'Berechnungsfehler',
    message: 'Fehler bei der Zinseszins-Berechnung.',
    details: 'Überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.'
  },
  OVERFLOW_ERROR: {
    title: 'Wert zu groß',
    message: 'Die Berechnung führt zu einem zu großen Ergebnis.',
    details: 'Reduzieren Sie Startkapital, Zinssatz oder Laufzeit.'
  },
  PRECISION_ERROR: {
    title: 'Genauigkeitsfehler',
    message: 'Die Berechnung ist nicht präzise genug.',
    details: 'Verwenden Sie kleinere Werte für eine genauere Berechnung.'
  },

  // System-Fehler
  BROWSER_NOT_SUPPORTED: {
    title: 'Browser nicht unterstützt',
    message: 'Ihr Browser wird nicht vollständig unterstützt.',
    details: 'Verwenden Sie einen modernen Browser wie Chrome, Firefox oder Safari.'
  },
  JAVASCRIPT_DISABLED: {
    title: 'JavaScript deaktiviert',
    message: 'JavaScript ist in Ihrem Browser deaktiviert.',
    details: 'Aktivieren Sie JavaScript, um den Rechner zu verwenden.'
  },
  STORAGE_ERROR: {
    title: 'Speicher-Fehler',
    message: 'Daten können nicht gespeichert werden.',
    details: 'Überprüfen Sie Ihre Browser-Einstellungen für lokalen Speicher.'
  },

  // Benutzer-Fehler
  INVALID_INPUT_FORMAT: {
    title: 'Ungültiges Format',
    message: 'Die Eingabe hat ein ungültiges Format.',
    details: 'Verwenden Sie nur Zahlen und das Komma als Dezimaltrennzeichen.'
  },
  VALUE_OUT_OF_RANGE: {
    title: 'Wert außerhalb des Bereichs',
    message: 'Der eingegebene Wert liegt außerhalb des erlaubten Bereichs.',
    details: 'Überprüfen Sie die Mindest- und Höchstwerte für dieses Feld.'
  }
}

export function useErrorHandler() {
  const errors = ref<AppError[]>([])
  const isLoading = ref(false)
  const loadingMessage = ref('')

  /**
   * 创建错误对象
   */
  const createError = (
    type: AppError['type'],
    code: string,
    customMessage?: string,
    customTitle?: string,
    retryAction?: () => void | Promise<void>
  ): AppError => {
    const errorInfo = errorMessages[code as keyof typeof errorMessages]
    const actions: ErrorAction[] = []

    // 添加重试操作
    if (retryAction) {
      actions.push({
        label: 'Erneut versuchen',
        action: retryAction,
        primary: true
      })
    }

    // 添加重置操作
    actions.push({
      label: 'Zurücksetzen',
      action: () => clearErrors()
    })

    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      code,
      title: customTitle || errorInfo?.title || 'Unbekannter Fehler',
      message: customMessage || errorInfo?.message || 'Ein unbekannter Fehler ist aufgetreten.',
      details: errorInfo?.details,
      timestamp: new Date(),
      retryable: !!retryAction,
      actions
    }
  }

  /**
   * 添加错误
   */
  const addError = (error: AppError) => {
    // 避免重复错误
    const existingError = errors.value.find(e => e.code === error.code && e.type === error.type)
    if (existingError) {
      return existingError.id
    }

    errors.value.push(error)
    return error.id
  }

  /**
   * 移除错误
   */
  const removeError = (errorId: string) => {
    const index = errors.value.findIndex(e => e.id === errorId)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }

  /**
   * 清除所有错误
   */
  const clearErrors = () => {
    errors.value = []
  }

  /**
   * 处理验证错误
   */
  const handleValidationError = (field: string, code: string, value?: any) => {
    const error = createError('validation', code)
    return addError(error)
  }

  /**
   * 处理网络错误
   */
  const handleNetworkError = (error: Error, retryAction?: () => void | Promise<void>) => {
    let code = 'NETWORK_ERROR'
    
    if (error.message.includes('timeout')) {
      code = 'TIMEOUT_ERROR'
    } else if (error.message.includes('server')) {
      code = 'SERVER_ERROR'
    }

    const appError = createError('network', code, undefined, undefined, retryAction)
    return addError(appError)
  }

  /**
   * 处理计算错误
   */
  const handleCalculationError = (error: Error, retryAction?: () => void | Promise<void>) => {
    let code = 'CALCULATION_ERROR'
    
    if (error.message.includes('overflow') || error.message.includes('Infinity')) {
      code = 'OVERFLOW_ERROR'
    } else if (error.message.includes('precision')) {
      code = 'PRECISION_ERROR'
    }

    const appError = createError('calculation', code, undefined, undefined, retryAction)
    return addError(appError)
  }

  /**
   * 处理系统错误
   */
  const handleSystemError = (error: Error) => {
    let code = 'BROWSER_NOT_SUPPORTED'
    
    if (error.message.includes('JavaScript')) {
      code = 'JAVASCRIPT_DISABLED'
    } else if (error.message.includes('storage') || error.message.includes('localStorage')) {
      code = 'STORAGE_ERROR'
    }

    const appError = createError('system', code)
    return addError(appError)
  }

  /**
   * 设置加载状态
   */
  const setLoading = (loading: boolean, message?: string) => {
    isLoading.value = loading
    loadingMessage.value = message || ''
  }

  /**
   * 执行带错误处理的异步操作
   */
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    loadingMsg?: string,
    retryAction?: () => void | Promise<void>
  ): Promise<T | null> => {
    try {
      setLoading(true, loadingMsg)
      clearErrors()
      
      const result = await operation()
      return result
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ValidationError') {
          handleValidationError('', 'INVALID_INPUT_FORMAT')
        } else if (error.name === 'NetworkError') {
          handleNetworkError(error, retryAction)
        } else if (error.name === 'CalculationError') {
          handleCalculationError(error, retryAction)
        } else {
          handleSystemError(error)
        }
      } else {
        const unknownError = createError('system', 'BROWSER_NOT_SUPPORTED')
        addError(unknownError)
      }
      return null
    } finally {
      setLoading(false)
    }
  }

  // 计算属性
  const hasErrors = computed(() => errors.value.length > 0)
  const latestError = computed(() => errors.value[errors.value.length - 1])
  const validationErrors = computed(() => errors.value.filter(e => e.type === 'validation'))
  const networkErrors = computed(() => errors.value.filter(e => e.type === 'network'))
  const systemErrors = computed(() => errors.value.filter(e => e.type === 'system'))

  return {
    // 状态
    errors: computed(() => errors.value),
    hasErrors,
    latestError,
    validationErrors,
    networkErrors,
    systemErrors,
    isLoading: computed(() => isLoading.value),
    loadingMessage: computed(() => loadingMessage.value),

    // 方法
    createError,
    addError,
    removeError,
    clearErrors,
    handleValidationError,
    handleNetworkError,
    handleCalculationError,
    handleSystemError,
    setLoading,
    withErrorHandling
  }
}
