/**
 * useValidation composable单元测试
 * 测试验证逻辑和错误处理
 */

import { describe, it, expect } from 'vitest'
import { useCalculatorValidation, validationRules, businessRules } from '../useValidation'

describe('useValidation', () => {
  describe('validationRules', () => {
    it('required规则应该正确验证', () => {
      const rule = validationRules.required()
      
      expect(rule.validator('')).toBe(false)
      expect(rule.validator('  ')).toBe(false)
      expect(rule.validator(null)).toBe(false)
      expect(rule.validator(undefined)).toBe(false)
      expect(rule.validator('valid')).toBe(true)
      expect(rule.validator(123)).toBe(true)
    })

    it('min规则应该正确验证', () => {
      const rule = validationRules.min(10)
      
      expect(rule.validator(5)).toBe(false)
      expect(rule.validator(10)).toBe(true)
      expect(rule.validator(15)).toBe(true)
      expect(rule.validator(NaN)).toBe(false)
    })

    it('max规则应该正确验证', () => {
      const rule = validationRules.max(100)
      
      expect(rule.validator(50)).toBe(true)
      expect(rule.validator(100)).toBe(true)
      expect(rule.validator(150)).toBe(false)
      expect(rule.validator(NaN)).toBe(false)
    })

    it('range规则应该正确验证', () => {
      const rule = validationRules.range(10, 100)
      
      expect(rule.validator(5)).toBe(false)
      expect(rule.validator(10)).toBe(true)
      expect(rule.validator(50)).toBe(true)
      expect(rule.validator(100)).toBe(true)
      expect(rule.validator(150)).toBe(false)
    })

    it('positive规则应该正确验证', () => {
      const rule = validationRules.positive()
      
      expect(rule.validator(-1)).toBe(false)
      expect(rule.validator(0)).toBe(false)
      expect(rule.validator(1)).toBe(true)
      expect(rule.validator(100)).toBe(true)
    })

    it('percentage规则应该正确验证', () => {
      const rule = validationRules.percentage()
      
      expect(rule.validator(-1)).toBe(false)
      expect(rule.validator(0)).toBe(true)
      expect(rule.validator(50)).toBe(true)
      expect(rule.validator(100)).toBe(true)
      expect(rule.validator(101)).toBe(false)
    })

    it('currency规则应该正确验证', () => {
      const rule = validationRules.currency()
      
      expect(rule.validator(-1)).toBe(false)
      expect(rule.validator(0)).toBe(true)
      expect(rule.validator(100.50)).toBe(true)
      expect(rule.validator(Infinity)).toBe(false)
      expect(rule.validator(NaN)).toBe(false)
    })

    it('integer规则应该正确验证', () => {
      const rule = validationRules.integer()
      
      expect(rule.validator(10)).toBe(true)
      expect(rule.validator(10.5)).toBe(false)
      expect(rule.validator(0)).toBe(true)
      expect(rule.validator(-5)).toBe(true)
    })
  })

  describe('businessRules', () => {
    it('应该包含所有必需的业务规则', () => {
      expect(businessRules.principal).toBeDefined()
      expect(businessRules.monthlyPayment).toBeDefined()
      expect(businessRules.annualRate).toBeDefined()
      expect(businessRules.years).toBeDefined()
    })

    it('principal规则应该验证正确范围', () => {
      const rules = businessRules.principal
      const validation = useCalculatorValidation()
      
      // 测试有效值
      const validErrors = validation.validateField('principal', 10000, rules)
      expect(validErrors).toHaveLength(0)
      
      // 测试无效值 - 太小
      const tooSmallErrors = validation.validateField('principal', 0, rules)
      expect(tooSmallErrors.length).toBeGreaterThan(0)
      
      // 测试无效值 - 太大
      const tooBigErrors = validation.validateField('principal', 20000000, rules)
      expect(tooBigErrors.length).toBeGreaterThan(0)
    })

    it('monthlyPayment规则应该允许零值', () => {
      const rules = businessRules.monthlyPayment
      const validation = useCalculatorValidation()
      
      const zeroErrors = validation.validateField('monthlyPayment', 0, rules)
      expect(zeroErrors).toHaveLength(0)
      
      const validErrors = validation.validateField('monthlyPayment', 500, rules)
      expect(validErrors).toHaveLength(0)
    })

    it('annualRate规则应该验证利率范围', () => {
      const rules = businessRules.annualRate
      const validation = useCalculatorValidation()
      
      const validErrors = validation.validateField('annualRate', 4.5, rules)
      expect(validErrors).toHaveLength(0)
      
      const negativeErrors = validation.validateField('annualRate', -1, rules)
      expect(negativeErrors.length).toBeGreaterThan(0)
      
      const tooHighErrors = validation.validateField('annualRate', 25, rules)
      expect(tooHighErrors.length).toBeGreaterThan(0)
    })

    it('years规则应该验证年限范围', () => {
      const rules = businessRules.years
      const validation = useCalculatorValidation()
      
      const validErrors = validation.validateField('years', 10, rules)
      expect(validErrors).toHaveLength(0)
      
      const tooSmallErrors = validation.validateField('years', 0, rules)
      expect(tooSmallErrors.length).toBeGreaterThan(0)
      
      const tooBigErrors = validation.validateField('years', 100, rules)
      expect(tooBigErrors.length).toBeGreaterThan(0)
    })
  })

  describe('useCalculatorValidation', () => {
    it('应该验证有效的计算器表单', () => {
      const validation = useCalculatorValidation()
      const validForm = {
        principal: 10000,
        monthlyPayment: 500,
        annualRate: 4.0,
        years: 10
      }
      
      const result = validation.validateCalculatorForm(validForm)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测无效的计算器表单', () => {
      const validation = useCalculatorValidation()
      const invalidForm = {
        principal: -1000, // 无效
        monthlyPayment: 500,
        annualRate: 4.0,
        years: 10
      }
      
      const result = validation.validateCalculatorForm(invalidForm)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('应该进行业务逻辑验证', () => {
      const validation = useCalculatorValidation()
      
      // 正常情况 - 无警告
      const normalForm = {
        principal: 10000,
        monthlyPayment: 500,
        annualRate: 5.0,
        years: 10
      }
      const normalWarnings = validation.validateBusinessLogic(normalForm)
      expect(normalWarnings).toHaveLength(0)
      
      // 月供过高 - 应该有警告
      const highPaymentForm = {
        principal: 1000,
        monthlyPayment: 500, // 月供是本金的50%
        annualRate: 5.0,
        years: 10
      }
      const highPaymentWarnings = validation.validateBusinessLogic(highPaymentForm)
      expect(highPaymentWarnings.length).toBeGreaterThan(0)
      
      // 期限过长 - 应该有警告
      const longTermForm = {
        principal: 10000,
        monthlyPayment: 100,
        annualRate: 5.0,
        years: 45 // 超过40年
      }
      const longTermWarnings = validation.validateBusinessLogic(longTermForm)
      expect(longTermWarnings.length).toBeGreaterThan(0)
      
      // 利率过高 - 应该有警告
      const highRateForm = {
        principal: 10000,
        monthlyPayment: 100,
        annualRate: 18.0, // 超过15%
        years: 10
      }
      const highRateWarnings = validation.validateBusinessLogic(highRateForm)
      expect(highRateWarnings.length).toBeGreaterThan(0)
    })

    it('应该正确管理错误状态', () => {
      const validation = useCalculatorValidation()
      
      // 添加错误
      const testError = {
        field: 'principal',
        message: 'Test error',
        code: 'TEST_ERROR'
      }
      validation.addError(testError)
      expect(validation.errors.value).toContain(testError)
      
      // 获取字段错误
      const fieldError = validation.getFieldError('principal')
      expect(fieldError).toBe('Test error')
      
      // 清除字段错误
      validation.clearFieldError('principal')
      expect(validation.getFieldError('principal')).toBeUndefined()
      
      // 清除所有错误
      validation.addError(testError)
      validation.clearAllErrors()
      expect(validation.errors.value).toHaveLength(0)
    })

    it('应该防止重复错误', () => {
      const validation = useCalculatorValidation()
      
      const testError = {
        field: 'principal',
        message: 'Test error',
        code: 'TEST_ERROR'
      }
      
      validation.addError(testError)
      validation.addError(testError) // 重复添加
      
      expect(validation.errors.value).toHaveLength(1)
    })
  })

  describe('德语错误消息', () => {
    it('应该包含德语错误消息', () => {
      const rule = validationRules.required()
      expect(rule.message).toContain('erforderlich')
      
      const minRule = validationRules.min(10)
      expect(minRule.message).toContain('mindestens')
      
      const maxRule = validationRules.max(100)
      expect(maxRule.message).toContain('höchstens')
    })

    it('业务规则应该有德语消息', () => {
      const validation = useCalculatorValidation()
      const invalidForm = {
        principal: -1000,
        monthlyPayment: 500,
        annualRate: 4.0,
        years: 10
      }
      
      const result = validation.validateCalculatorForm(invalidForm)
      const errorMessage = result.errors[0]?.message || ''
      
      // 检查是否包含德语关键词
      const germanKeywords = ['muss', 'zwischen', 'betragen', 'Euro', 'Jahr']
      const hasGermanKeyword = germanKeywords.some(keyword => 
        errorMessage.toLowerCase().includes(keyword.toLowerCase())
      )
      
      expect(hasGermanKeyword).toBe(true)
    })
  })
})
