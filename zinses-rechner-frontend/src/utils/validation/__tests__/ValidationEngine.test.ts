/**
 * ValidationEngine 单元测试
 * 测试验证引擎的核心功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ValidationEngine, FieldConfig, ValidationRule } from '../ValidationEngine'

describe('ValidationEngine', () => {
  let engine: ValidationEngine

  beforeEach(() => {
    engine = new ValidationEngine('de-DE', false)
  })

  describe('基础功能', () => {
    it('应该正确创建验证引擎实例', () => {
      expect(engine).toBeInstanceOf(ValidationEngine)
    })

    it('应该支持注册字段配置', () => {
      const config: FieldConfig = {
        name: 'testField',
        type: 'number',
        required: true,
        min: 0,
        max: 100
      }

      expect(() => engine.registerField(config)).not.toThrow()
    })
  })

  describe('数字验证', () => {
    beforeEach(() => {
      const config: FieldConfig = {
        name: 'numberField',
        type: 'number',
        required: true,
        min: 0,
        max: 1000
      }
      engine.registerField(config)
    })

    it('应该验证有效的数字', () => {
      const result = engine.validateField('numberField', 100)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝无效的数字格式', () => {
      const result = engine.validateField('numberField', 'abc')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_NUMBER_FORMAT')
    })

    it('应该处理德语数字格式', () => {
      const result = engine.validateField('numberField', '1.234,56')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该对负数给出警告', () => {
      const result = engine.validateField('numberField', -50)
      
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('NEGATIVE_NUMBER')
    })

    it('应该提供数字格式修正建议', () => {
      const result = engine.validateField('numberField', '1,234.56')
      
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].type).toBe('correction')
    })
  })

  describe('百分比验证', () => {
    beforeEach(() => {
      const config: FieldConfig = {
        name: 'percentageField',
        type: 'percentage',
        required: true,
        min: 0,
        max: 100
      }
      engine.registerField(config)
    })

    it('应该验证有效的百分比', () => {
      const result = engine.validateField('percentageField', 25.5)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该对超出范围的百分比给出警告', () => {
      const result = engine.validateField('percentageField', 150)
      
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('PERCENTAGE_OUT_OF_RANGE')
    })

    it('应该对高利率提供建议', () => {
      const config: FieldConfig = {
        name: 'interestRate',
        type: 'percentage',
        required: true
      }
      engine.registerField(config)

      const result = engine.validateField('interestRate', 25, {
        fieldConfig: { interestRate: config }
      })
      
      expect(result.suggestions.length).toBeGreaterThan(0)
    })
  })

  describe('整数验证', () => {
    beforeEach(() => {
      const config: FieldConfig = {
        name: 'integerField',
        type: 'integer',
        required: true
      }
      engine.registerField(config)
    })

    it('应该验证有效的整数', () => {
      const result = engine.validateField('integerField', 42)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝非整数', () => {
      const result = engine.validateField('integerField', 42.5)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('NOT_INTEGER')
    })

    it('应该提供整数修正建议', () => {
      const result = engine.validateField('integerField', 42.7)
      
      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0].type).toBe('correction')
      expect(result.suggestions[0].suggestedValue).toBe(43)
    })
  })

  describe('邮箱验证', () => {
    beforeEach(() => {
      const config: FieldConfig = {
        name: 'emailField',
        type: 'email',
        required: true
      }
      engine.registerField(config)
    })

    it('应该验证有效的邮箱地址', () => {
      const result = engine.validateField('emailField', 'test@example.com')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝无效的邮箱格式', () => {
      const result = engine.validateField('emailField', 'invalid-email')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_EMAIL')
    })
  })

  describe('字符串验证', () => {
    beforeEach(() => {
      const config: FieldConfig = {
        name: 'stringField',
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 50
      }
      engine.registerField(config)
    })

    it('应该验证有效的字符串', () => {
      const result = engine.validateField('stringField', 'Hello World')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝非字符串类型', () => {
      const result = engine.validateField('stringField', 123)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('NOT_STRING')
    })
  })

  describe('多字段验证', () => {
    beforeEach(() => {
      const configs: FieldConfig[] = [
        {
          name: 'field1',
          type: 'number',
          required: true
        },
        {
          name: 'field2',
          type: 'string',
          required: true,
          dependsOn: ['field1']
        }
      ]
      
      configs.forEach(config => engine.registerField(config))
    })

    it('应该验证多个字段', () => {
      const fields = {
        field1: 100,
        field2: 'test'
      }
      
      const results = engine.validateFields(fields)
      
      expect(Object.keys(results)).toHaveLength(2)
      expect(results.field1.isValid).toBe(true)
      expect(results.field2.isValid).toBe(true)
    })

    it('应该处理字段依赖关系', () => {
      const fields = {
        field1: 100,
        field2: 'test'
      }
      
      const results = engine.validateFields(fields)
      
      // 独立字段应该先验证
      expect(results.field1).toBeDefined()
      // 依赖字段应该后验证
      expect(results.field2).toBeDefined()
    })
  })

  describe('自定义验证规则', () => {
    it('应该支持自定义验证规则', () => {
      const customRule: ValidationRule = {
        name: 'custom-rule',
        priority: 1,
        validator: (value: any) => {
          if (value === 'forbidden') {
            return {
              isValid: false,
              errors: [{
                field: 'testField',
                code: 'FORBIDDEN_VALUE',
                message: '禁止使用此值',
                severity: 'error' as const
              }],
              warnings: [],
              suggestions: []
            }
          }
          return {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: []
          }
        }
      }

      const config: FieldConfig = {
        name: 'testField',
        type: 'string',
        customRules: [customRule]
      }

      engine.registerField(config)
      
      const result = engine.validateField('testField', 'forbidden')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('FORBIDDEN_VALUE')
    })
  })

  describe('错误处理', () => {
    it('应该处理未配置的字段', () => {
      const result = engine.validateField('unknownField', 'test')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('FIELD_NOT_CONFIGURED')
    })

    it('应该处理验证规则执行错误', () => {
      const faultyRule: ValidationRule = {
        name: 'faulty-rule',
        priority: 1,
        validator: () => {
          throw new Error('验证规则执行失败')
        }
      }

      const config: FieldConfig = {
        name: 'testField',
        type: 'string',
        customRules: [faultyRule]
      }

      engine.registerField(config)
      
      const result = engine.validateField('testField', 'test')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('VALIDATION_ERROR')
    })
  })

  describe('空值处理', () => {
    beforeEach(() => {
      const config: FieldConfig = {
        name: 'optionalField',
        type: 'number',
        required: false
      }
      engine.registerField(config)
    })

    it('应该正确处理null值', () => {
      const result = engine.validateField('optionalField', null)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该正确处理undefined值', () => {
      const result = engine.validateField('optionalField', undefined)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该正确处理空字符串', () => {
      const result = engine.validateField('optionalField', '')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
