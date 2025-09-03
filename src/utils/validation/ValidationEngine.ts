/**
 * 简化版输入验证引擎
 * 用于E2E测试的基础版本
 */

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
}

// 验证错误接口
export interface ValidationError {
  field: string
  code: string
  message: string
  severity: 'error' | 'warning' | 'info'
  context?: Record<string, any>
}

// 验证警告接口
export interface ValidationWarning {
  field: string
  code: string
  message: string
  suggestion?: string
}

// 验证建议接口
export interface ValidationSuggestion {
  field: string
  type: 'correction' | 'optimization' | 'alternative'
  message: string
  value?: any
  confidence: number
}

// 验证规则接口
export interface ValidationRule {
  name: string
  validator: (value: any, context?: any) => ValidationResult
  priority: number
  async?: boolean
}

// 字段配置接口
export interface FieldConfig {
  name: string
  type: 'number' | 'string' | 'currency' | 'percentage' | 'date' | 'email' | 'phone'
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  rules?: ValidationRule[]
  customValidator?: (value: any) => ValidationResult
}

// 验证上下文接口
export interface ValidationContext {
  locale?: string
  strictMode?: boolean
  fieldConfigs?: Record<string, FieldConfig>
  customRules?: ValidationRule[]
}

// 简化的验证引擎类
export class ValidationEngine {
  private locale: string
  private strictMode: boolean
  private fieldConfigs: Map<string, FieldConfig> = new Map()
  private customRules: ValidationRule[] = []

  constructor(locale: string = 'de-DE', strictMode: boolean = false) {
    this.locale = locale
    this.strictMode = strictMode
  }

  // 验证单个字段
  validateField(fieldName: string, value: any, context?: ValidationContext): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    // 基础验证逻辑
    if (value === null || value === undefined || value === '') {
      result.isValid = false
      result.errors.push({
        field: fieldName,
        code: 'REQUIRED',
        message: 'Dieses Feld ist erforderlich',
        severity: 'error'
      })
    }

    return result
  }

  // 验证多个字段
  validateFields(fields: Record<string, any>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    for (const [fieldName, value] of Object.entries(fields)) {
      const fieldResult = this.validateField(fieldName, value)
      result.errors.push(...fieldResult.errors)
      result.warnings.push(...fieldResult.warnings)
      result.suggestions.push(...fieldResult.suggestions)
      
      if (!fieldResult.isValid) {
        result.isValid = false
      }
    }

    return result
  }

  // 注册字段配置
  registerField(config: FieldConfig): void {
    this.fieldConfigs.set(config.name, config)
  }

  // 添加自定义规则
  addRule(rule: ValidationRule): void {
    this.customRules.push(rule)
  }
}

// 默认验证引擎实例
export const defaultValidationEngine = new ValidationEngine('de-DE', false)

// 便捷函数
export const validateField = (fieldName: string, value: any, context?: ValidationContext) => {
  return defaultValidationEngine.validateField(fieldName, value, context)
}

export const validateFields = (fields: Record<string, any>) => {
  return defaultValidationEngine.validateFields(fields)
}

export const registerField = (config: FieldConfig) => {
  return defaultValidationEngine.registerField(config)
}
