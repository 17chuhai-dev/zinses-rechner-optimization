/**
 * 表单验证系统
 * 专为德国复利计算器设计的验证逻辑
 * 增强版：支持实时验证、错误处理、数据修正建议
 */

import { ref, computed, reactive, watch, type Ref } from 'vue'
import { ValidationEngine, ValidationResult as EngineValidationResult, FieldConfig } from '../utils/validation/ValidationEngine'
// import { CalculatorValidationRules } from '@/utils/validation/CalculatorValidationRules' // 暂时保持注释

// 验证规则类型
export interface ValidationRule {
  validator: (value: any) => boolean
  message: string
  code?: string
}

// 验证错误类型
export interface ValidationError {
  field: string
  message: string
  code: string
}

// 验证结果类型
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// 德语验证消息
export const VALIDATION_MESSAGES = {
  required: 'Dieses Feld ist erforderlich',
  min: 'Der Wert muss mindestens {min} betragen',
  max: 'Der Wert darf höchstens {max} betragen',
  range: 'Der Wert muss zwischen {min} und {max} liegen',
  positive: 'Der Wert muss positiv sein',
  percentage: 'Bitte geben Sie einen gültigen Prozentsatz ein',
  currency: 'Bitte geben Sie einen gültigen Betrag in Euro ein',
  integer: 'Bitte geben Sie eine ganze Zahl ein',

  // 业务逻辑验证
  principal: {
    min: 'Das Startkapital muss mindestens 1€ betragen',
    max: 'Das Startkapital darf höchstens 10.000.000€ betragen',
    invalid: 'Bitte geben Sie ein gültiges Startkapital ein'
  },
  monthlyPayment: {
    max: 'Die monatliche Sparrate darf höchstens 50.000€ betragen',
    invalid: 'Bitte geben Sie eine gültige monatliche Sparrate ein'
  },
  annualRate: {
    min: 'Der Zinssatz muss mindestens 0% betragen',
    max: 'Der Zinssatz darf höchstens 20% betragen',
    invalid: 'Bitte geben Sie einen gültigen Zinssatz ein'
  },
  years: {
    min: 'Die Laufzeit muss mindestens 1 Jahr betragen',
    max: 'Die Laufzeit darf höchstens 50 Jahre betragen',
    invalid: 'Bitte geben Sie eine gültige Laufzeit ein'
  }
}

// 基础验证规则
export const validationRules = {
  required: (message = VALIDATION_MESSAGES.required): ValidationRule => ({
    validator: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (typeof value === 'number') return !isNaN(value)
      return value != null && value !== undefined
    },
    message,
    code: 'REQUIRED'
  }),

  min: (minValue: number, message?: string): ValidationRule => ({
    validator: (value: number) => !isNaN(value) && value >= minValue,
    message: message || VALIDATION_MESSAGES.min.replace('{min}', minValue.toString()),
    code: 'MIN_VALUE'
  }),

  max: (maxValue: number, message?: string): ValidationRule => ({
    validator: (value: number) => !isNaN(value) && value <= maxValue,
    message: message || VALIDATION_MESSAGES.max.replace('{max}', maxValue.toString()),
    code: 'MAX_VALUE'
  }),

  range: (minValue: number, maxValue: number, message?: string): ValidationRule => ({
    validator: (value: number) => !isNaN(value) && value >= minValue && value <= maxValue,
    message: message || VALIDATION_MESSAGES.range
      .replace('{min}', minValue.toString())
      .replace('{max}', maxValue.toString()),
    code: 'RANGE'
  }),

  positive: (message = VALIDATION_MESSAGES.positive): ValidationRule => ({
    validator: (value: number) => !isNaN(value) && value > 0,
    message,
    code: 'POSITIVE'
  }),

  percentage: (message = VALIDATION_MESSAGES.percentage): ValidationRule => ({
    validator: (value: number) => !isNaN(value) && value >= 0 && value <= 100,
    message,
    code: 'PERCENTAGE'
  }),

  currency: (message = VALIDATION_MESSAGES.currency): ValidationRule => ({
    validator: (value: number) => !isNaN(value) && value >= 0 && Number.isFinite(value),
    message,
    code: 'CURRENCY'
  }),

  integer: (message = VALIDATION_MESSAGES.integer): ValidationRule => ({
    validator: (value: number) => !isNaN(value) && Number.isInteger(value),
    message,
    code: 'INTEGER'
  })
}

// 业务逻辑验证规则
export const businessRules = {
  principal: [
    validationRules.required(),
    validationRules.currency(),
    validationRules.range(1, 10000000, VALIDATION_MESSAGES.principal.min)
  ],

  monthlyPayment: [
    validationRules.currency(),
    validationRules.max(50000, VALIDATION_MESSAGES.monthlyPayment.max)
  ],

  annualRate: [
    validationRules.required(),
    validationRules.range(0, 20, VALIDATION_MESSAGES.annualRate.invalid)
  ],

  years: [
    validationRules.required(),
    validationRules.integer(),
    validationRules.range(1, 50, VALIDATION_MESSAGES.years.invalid)
  ]
}

// 验证组合函数
export function useValidation() {
  const errors = ref<ValidationError[]>([])
  const isValidating = ref(false)

  // 验证单个字段
  const validateField = (
    fieldName: string,
    value: any,
    rules: ValidationRule[]
  ): ValidationError[] => {
    const fieldErrors: ValidationError[] = []

    for (const rule of rules) {
      if (!rule.validator(value)) {
        fieldErrors.push({
          field: fieldName,
          message: rule.message,
          code: rule.code || 'VALIDATION_ERROR'
        })
        break // 只显示第一个错误
      }
    }

    return fieldErrors
  }

  // 验证整个表单
  const validateForm = (
    formData: Record<string, any>,
    fieldRules: Record<string, ValidationRule[]>
  ): ValidationResult => {
    const allErrors: ValidationError[] = []

    for (const [fieldName, rules] of Object.entries(fieldRules)) {
      const fieldValue = formData[fieldName]
      const fieldErrors = validateField(fieldName, fieldValue, rules)
      allErrors.push(...fieldErrors)
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    }
  }

  // 实时验证
  const validateFieldRealtime = (
    fieldName: string,
    value: any,
    rules: ValidationRule[],
    debounceMs = 300
  ) => {
    const fieldRef = ref(value)
    const fieldErrors = ref<ValidationError[]>([])
    const isFieldValid = computed(() => fieldErrors.value.length === 0)

    let debounceTimer: NodeJS.Timeout

    const validate = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        fieldErrors.value = validateField(fieldName, fieldRef.value, rules)
      }, debounceMs)
    }

    return {
      value: fieldRef,
      errors: fieldErrors,
      isValid: isFieldValid,
      validate
    }
  }

  // 获取字段错误
  const getFieldError = (fieldName: string): string | undefined => {
    const error = errors.value.find(e => e.field === fieldName)
    return error?.message
  }

  // 清除字段错误
  const clearFieldError = (fieldName: string) => {
    errors.value = errors.value.filter(e => e.field !== fieldName)
  }

  // 清除所有错误
  const clearAllErrors = () => {
    errors.value = []
  }

  // 设置错误
  const setErrors = (newErrors: ValidationError[]) => {
    errors.value = newErrors
  }

  // 添加错误
  const addError = (error: ValidationError) => {
    // 避免重复错误
    const existingError = errors.value.find(
      e => e.field === error.field && e.code === error.code
    )
    if (!existingError) {
      errors.value.push(error)
    }
  }

  return {
    errors,
    isValidating,
    validateField,
    validateForm,
    validateFieldRealtime,
    getFieldError,
    clearFieldError,
    clearAllErrors,
    setErrors,
    addError
  }
}

// 增强的实时验证组合
export function useEnhancedValidation() {
  const validation = useValidation()
  const validationState = ref<Record<string, {
    isValid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
    lastValidated: Date
  }>>({})

  // 实时字段验证
  const validateFieldRealtime = async (
    fieldName: string,
    value: any,
    rules: ValidationRule[],
    debounceMs = 300
  ) => {
    return new Promise<void>((resolve) => {
      const timeoutId = setTimeout(async () => {
        const fieldErrors = validation.validateField(fieldName, value, rules)
        const warnings = generateWarnings(fieldName, value)
        const suggestions = generateSuggestions(fieldName, value)

        validationState.value[fieldName] = {
          isValid: fieldErrors.length === 0,
          errors: fieldErrors.map(e => e.message),
          warnings,
          suggestions,
          lastValidated: new Date()
        }

        resolve()
      }, debounceMs)

      // 清除之前的超时
      if (validationState.value[fieldName]?.timeoutId) {
        clearTimeout(validationState.value[fieldName].timeoutId)
      }
      validationState.value[fieldName] = {
        ...validationState.value[fieldName],
        timeoutId
      }
    })
  }

  // 生成警告信息
  const generateWarnings = (fieldName: string, value: any): string[] => {
    const warnings: string[] = []

    if (fieldName === 'principal' && typeof value === 'number') {
      if (value > 0 && value < 1000) {
        warnings.push('Ein höheres Startkapital führt zu besseren Ergebnissen')
      }
      if (value > 500000) {
        warnings.push('Bei hohen Beträgen sollten Sie eine professionelle Beratung in Anspruch nehmen')
      }
    }

    if (fieldName === 'annualRate' && typeof value === 'number') {
      if (value > 10) {
        warnings.push('Sehr hohe Renditen sind oft mit höheren Risiken verbunden')
      }
      if (value < 2) {
        warnings.push('Niedrige Zinssätze können die Inflation nicht ausgleichen')
      }
    }

    if (fieldName === 'years' && typeof value === 'number') {
      if (value < 5) {
        warnings.push('Langfristige Anlagen haben oft bessere Renditen')
      }
      if (value > 30) {
        warnings.push('Sehr lange Anlagezeiträume erhöhen das Unsicherheitsrisiko')
      }
    }

    return warnings
  }

  // 生成建议信息
  const generateSuggestions = (fieldName: string, value: any): string[] => {
    const suggestions: string[] = []

    if (fieldName === 'monthlyPayment' && typeof value === 'number') {
      if (value === 0) {
        suggestions.push('Regelmäßige Sparbeiträge verstärken den Zinseszinseffekt erheblich')
      }
      if (value > 0 && value < 100) {
        suggestions.push('Bereits kleine Erhöhungen der Sparrate haben große Auswirkungen')
      }
    }

    if (fieldName === 'principal' && typeof value === 'number') {
      if (value === 0) {
        suggestions.push('Ein Startkapital beschleunigt den Vermögensaufbau')
      }
    }

    return suggestions
  }

  // 获取字段状态
  const getFieldState = (fieldName: string) => {
    return validationState.value[fieldName] || {
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: [],
      lastValidated: null
    }
  }

  // 清除字段状态
  const clearFieldState = (fieldName: string) => {
    delete validationState.value[fieldName]
  }

  return {
    ...validation,
    validationState,
    validateFieldRealtime,
    generateWarnings,
    generateSuggestions,
    getFieldState,
    clearFieldState
  }
}

// 计算器专用验证组合
export function useCalculatorValidation() {
  const validation = useValidation()

  // 验证计算器表单
  const validateCalculatorForm = (formData: {
    principal: number
    monthlyPayment: number
    annualRate: number
    years: number
  }): ValidationResult => {
    return validation.validateForm(formData, businessRules)
  }

  // 业务逻辑验证
  const validateBusinessLogic = (formData: {
    principal: number
    monthlyPayment: number
    annualRate: number
    years: number
  }): ValidationError[] => {
    const errors: ValidationError[] = []

    // 检查月供是否过高（相对于本金）
    if (formData.monthlyPayment > 0 && formData.principal > 0) {
      const monthlyToYearlyRatio = (formData.monthlyPayment * 12) / formData.principal
      if (monthlyToYearlyRatio > 2) {
        errors.push({
          field: 'monthlyPayment',
          message: 'Die monatliche Sparrate ist sehr hoch im Verhältnis zum Startkapital. Bitte überprüfen Sie Ihre Eingaben.',
          code: 'HIGH_MONTHLY_PAYMENT'
        })
      }
    }

    // 检查极端的投资期限
    if (formData.years > 40) {
      errors.push({
        field: 'years',
        message: 'Eine Laufzeit von über 40 Jahren ist sehr lang. Berücksichtigen Sie Inflation und Lebensumstände.',
        code: 'VERY_LONG_TERM'
      })
    }

    // 检查不现实的利率
    if (formData.annualRate > 15) {
      errors.push({
        field: 'annualRate',
        message: 'Ein Zinssatz über 15% ist sehr optimistisch. Bitte prüfen Sie realistische Markterwartungen.',
        code: 'UNREALISTIC_RATE'
      })
    }

    return errors
  }

  return {
    ...validation,
    validateCalculatorForm,
    validateBusinessLogic,
    businessRules
  }
}

// 增强验证状态接口
export interface EnhancedValidationState {
  isValid: boolean
  hasErrors: boolean
  hasWarnings: boolean
  hasSuggestions: boolean
  errorCount: number
  warningCount: number
  suggestionCount: number
  fieldResults: Record<string, EngineValidationResult>
}

// 增强验证配置接口
export interface EnhancedValidationConfig {
  validateOnInput?: boolean
  validateOnBlur?: boolean
  validateOnSubmit?: boolean
  debounceMs?: number
  strictMode?: boolean
  showSuggestions?: boolean
}

/**
 * 高级验证管理Composable
 * 提供完整的实时验证、错误处理、数据修正建议功能
 */
export function useAdvancedValidation(config: EnhancedValidationConfig = {}) {
  // 默认配置
  const defaultConfig: EnhancedValidationConfig = {
    validateOnInput: true,
    validateOnBlur: true,
    validateOnSubmit: true,
    debounceMs: 300,
    strictMode: false,
    showSuggestions: true
  }

  const finalConfig = { ...defaultConfig, ...config }

  // 创建验证引擎
  const validationEngine = new ValidationEngine('de-DE', finalConfig.strictMode)

  // 响应式状态
  const fieldResults = reactive<Record<string, EngineValidationResult>>({})
  const isValidating = ref(false)
  const lastValidationTime = ref<Date | null>(null)

  // 注册计算器字段配置
  const fieldConfigs = CalculatorValidationRules.getFieldConfigs()
  Object.values(fieldConfigs).forEach(config => {
    validationEngine.registerField(config)
  })

  // 计算属性
  const enhancedValidationState = computed<EnhancedValidationState>(() => {
    const results = Object.values(fieldResults)

    return {
      isValid: results.every(result => result.isValid),
      hasErrors: results.some(result => result.errors.length > 0),
      hasWarnings: results.some(result => result.warnings.length > 0),
      hasSuggestions: results.some(result => result.suggestions.length > 0),
      errorCount: results.reduce((count, result) => count + result.errors.length, 0),
      warningCount: results.reduce((count, result) => count + result.warnings.length, 0),
      suggestionCount: results.reduce((count, result) => count + result.suggestions.length, 0),
      fieldResults: { ...fieldResults }
    }
  })

  const allErrors = computed(() => {
    return Object.entries(fieldResults)
      .flatMap(([field, result]) =>
        result.errors.map(error => ({ ...error, field }))
      )
  })

  const allWarnings = computed(() => {
    return Object.entries(fieldResults)
      .flatMap(([field, result]) =>
        result.warnings.map(warning => ({ ...warning, field }))
      )
  })

  const allSuggestions = computed(() => {
    return Object.entries(fieldResults)
      .flatMap(([field, result]) =>
        result.suggestions.map(suggestion => ({ ...suggestion, field }))
      )
  })

  // 验证方法
  const validateField = async (fieldName: string, value: any, context?: any) => {
    isValidating.value = true

    try {
      const result = validationEngine.validateField(fieldName, value, context)
      fieldResults[fieldName] = result
      lastValidationTime.value = new Date()
      return result
    } finally {
      isValidating.value = false
    }
  }

  const validateFields = async (fields: Record<string, any>) => {
    isValidating.value = true

    try {
      const results = validationEngine.validateFields(fields)

      // 更新所有字段结果
      Object.entries(results).forEach(([fieldName, result]) => {
        fieldResults[fieldName] = result
      })

      lastValidationTime.value = new Date()
      return results
    } finally {
      isValidating.value = false
    }
  }

  const validateForm = async (formData: Record<string, any>) => {
    return await validateFields(formData)
  }

  // 清除验证结果
  const clearValidation = (fieldName?: string) => {
    if (fieldName) {
      delete fieldResults[fieldName]
    } else {
      Object.keys(fieldResults).forEach(key => {
        delete fieldResults[key]
      })
    }
  }

  // 重置验证状态
  const resetValidation = () => {
    clearValidation()
    isValidating.value = false
    lastValidationTime.value = null
  }

  // 获取字段验证结果
  const getFieldResult = (fieldName: string): EngineValidationResult | null => {
    return fieldResults[fieldName] || null
  }

  // 检查字段是否有效
  const isFieldValid = (fieldName: string): boolean => {
    const result = getFieldResult(fieldName)
    return result ? result.isValid : true
  }

  // 检查字段是否有错误
  const hasFieldErrors = (fieldName: string): boolean => {
    const result = getFieldResult(fieldName)
    return result ? result.errors.length > 0 : false
  }

  // 检查字段是否有警告
  const hasFieldWarnings = (fieldName: string): boolean => {
    const result = getFieldResult(fieldName)
    return result ? result.warnings.length > 0 : false
  }

  // 获取字段错误消息
  const getFieldErrors = (fieldName: string): string[] => {
    const result = getFieldResult(fieldName)
    return result ? result.errors.map(error => error.message) : []
  }

  // 获取字段警告消息
  const getFieldWarnings = (fieldName: string): string[] => {
    const result = getFieldResult(fieldName)
    return result ? result.warnings.map(warning => warning.message) : []
  }

  // 获取字段建议
  const getFieldSuggestions = (fieldName: string) => {
    const result = getFieldResult(fieldName)
    return result ? result.suggestions : []
  }

  return {
    // 状态
    enhancedValidationState,
    isValidating,
    lastValidationTime,
    fieldResults,

    // 计算属性
    allErrors,
    allWarnings,
    allSuggestions,

    // 验证方法
    validateField,
    validateFields,
    validateForm,

    // 状态管理
    clearValidation,
    resetValidation,

    // 字段查询
    getFieldResult,
    isFieldValid,
    hasFieldErrors,
    hasFieldWarnings,
    getFieldErrors,
    getFieldWarnings,
    getFieldSuggestions,

    // 验证引擎
    validationEngine,

    // 配置
    config: finalConfig
  }
}
