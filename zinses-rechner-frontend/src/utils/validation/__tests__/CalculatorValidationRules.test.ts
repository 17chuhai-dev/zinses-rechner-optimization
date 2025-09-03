/**
 * CalculatorValidationRules 单元测试
 * 测试计算器专用验证规则的功能
 */

import { describe, it, expect } from 'vitest'
import { CalculatorValidationRules } from '../CalculatorValidationRules'

describe('CalculatorValidationRules', () => {
  describe('初始金额验证规则', () => {
    const rule = CalculatorValidationRules.createInitialAmountRule()

    it('应该接受有效的初始金额', () => {
      const result = rule.validator(10000)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝负数初始金额', () => {
      const result = rule.validator(-1000)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('NEGATIVE_INITIAL_AMOUNT')
    })

    it('应该对非常高的初始金额给出警告', () => {
      const result = rule.validator(15000000) // 1500万欧元

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('VERY_HIGH_INITIAL_AMOUNT')
    })

    it('应该对小额初始金额提供建议', () => {
      const result = rule.validator(50)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].type).toBe('optimization')
    })

    it('应该对零初始金额提供推荐金额', () => {
      const result = rule.validator(0)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].type).toBe('alternative')
      expect(result.suggestions[0].suggestedValue).toBe(10000)
    })
  })

  describe('月度投入验证规则', () => {
    const rule = CalculatorValidationRules.createMonthlyAmountRule()

    it('应该接受有效的月度投入', () => {
      const result = rule.validator(500)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝负数月度投入', () => {
      const result = rule.validator(-100)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('NEGATIVE_MONTHLY_AMOUNT')
    })

    it('应该对非常高的月度投入给出警告', () => {
      const result = rule.validator(60000) // 6万欧元/月

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('VERY_HIGH_MONTHLY_AMOUNT')
    })

    it('应该检查月度投入与初始金额的比例', () => {
      const context = {
        allFields: {
          initialAmount: 1000
        }
      }

      const result = rule.validator(3000, context) // 月度投入是初始金额的3倍

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0].code).toBe('HIGH_MONTHLY_VS_INITIAL')
    })

    it('应该对小额月度投入提供建议', () => {
      const result = rule.validator(20)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].type).toBe('optimization')
    })
  })

  describe('年利率验证规则', () => {
    const rule = CalculatorValidationRules.createAnnualRateRule()

    it('应该接受合理的年利率', () => {
      const result = rule.validator(5.5)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该对负利率给出警告', () => {
      const result = rule.validator(-0.5)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('NEGATIVE_INTEREST_RATE')
    })

    it('应该对非常高的利率给出警告', () => {
      const result = rule.validator(30)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('VERY_HIGH_INTEREST_RATE')
    })

    it('应该对非常低的利率提供建议', () => {
      const result = rule.validator(0.3)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].type).toBe('optimization')
    })

    it('应该对保守型投资利率提供建议', () => {
      const result = rule.validator(1.5)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('保守型投资')
    })

    it('应该对中等风险投资利率提供建议', () => {
      const result = rule.validator(6)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('中等风险投资')
    })

    it('应该对高风险投资利率提供建议', () => {
      const result = rule.validator(12)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('较高风险投资')
    })
  })

  describe('投资年限验证规则', () => {
    const rule = CalculatorValidationRules.createInvestmentYearsRule()

    it('应该接受有效的投资年限', () => {
      const result = rule.validator(10)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝零或负数年限', () => {
      const result = rule.validator(0)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_INVESTMENT_YEARS')
    })

    it('应该对非整数年限给出警告', () => {
      const result = rule.validator(5.5)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('NON_INTEGER_YEARS')
    })

    it('应该对非整数年限提供修正建议', () => {
      const result = rule.validator(7.3)

      expect(result.suggestions.length).toBeGreaterThan(0)
      const correctionSuggestion = result.suggestions.find(s => s.type === 'correction')
      expect(correctionSuggestion).toBeDefined()
      expect(correctionSuggestion?.suggestedValue).toBe(7)
    })

    it('应该对非常长的投资期限给出警告', () => {
      const result = rule.validator(150)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('VERY_LONG_INVESTMENT_PERIOD')
    })

    it('应该对短期投资提供建议', () => {
      const result = rule.validator(3)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('短期投资')
    })

    it('应该对中期投资提供建议', () => {
      const result = rule.validator(10)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('中期投资')
    })

    it('应该对长期投资提供建议', () => {
      const result = rule.validator(25)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('长期投资')
    })
  })

  describe('税率验证规则', () => {
    const rule = CalculatorValidationRules.createTaxRateRule()

    it('应该接受有效的税率', () => {
      const result = rule.validator(25)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝超出范围的税率', () => {
      const result = rule.validator(150)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_TAX_RATE_RANGE')
    })

    it('应该拒绝负税率', () => {
      const result = rule.validator(-5)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_TAX_RATE_RANGE')
    })

    it('应该识别德国标准资本利得税率', () => {
      const result = rule.validator(26.375)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('德国标准资本利得税率')
    })

    it('应该识别基础资本利得税率', () => {
      const result = rule.validator(25)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('德国基础资本利得税率')
    })

    it('应该对非常高的税率给出警告', () => {
      const result = rule.validator(60)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('VERY_HIGH_TAX_RATE')
    })
  })

  describe('通胀率验证规则', () => {
    const rule = CalculatorValidationRules.createInflationRateRule()

    it('应该接受合理的通胀率', () => {
      const result = rule.validator(2.5)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该对异常通胀率给出警告', () => {
      const result = rule.validator(25)

      expect(result.warnings.length).toBeGreaterThan(0)
      const unusualInflationWarning = result.warnings.find(w => w.code === 'UNUSUAL_INFLATION_RATE')
      expect(unusualInflationWarning).toBeDefined()
    })

    it('应该对欧洲央行目标通胀率提供建议', () => {
      const result = rule.validator(2)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('欧洲央行的目标范围')
    })

    it('应该对高通胀率给出警告', () => {
      const result = rule.validator(8)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('HIGH_INFLATION_RATE')
    })

    it('应该对负通胀率提供建议', () => {
      const result = rule.validator(-1)

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].message).toContain('负通胀')
    })
  })

  describe('字段配置获取', () => {
    it('应该返回所有计算器字段配置', () => {
      const configs = CalculatorValidationRules.getFieldConfigs()

      expect(configs).toHaveProperty('initialAmount')
      expect(configs).toHaveProperty('monthlyAmount')
      expect(configs).toHaveProperty('annualRate')
      expect(configs).toHaveProperty('investmentYears')
      expect(configs).toHaveProperty('taxRate')
      expect(configs).toHaveProperty('inflationRate')
    })

    it('应该正确配置初始金额字段', () => {
      const configs = CalculatorValidationRules.getFieldConfigs()
      const initialAmountConfig = configs.initialAmount

      expect(initialAmountConfig.name).toBe('initialAmount')
      expect(initialAmountConfig.type).toBe('currency')
      expect(initialAmountConfig.required).toBe(false)
      expect(initialAmountConfig.min).toBe(0)
      expect(initialAmountConfig.max).toBe(100000000)
    })

    it('应该正确配置年利率字段', () => {
      const configs = CalculatorValidationRules.getFieldConfigs()
      const annualRateConfig = configs.annualRate

      expect(annualRateConfig.name).toBe('annualRate')
      expect(annualRateConfig.type).toBe('percentage')
      expect(annualRateConfig.required).toBe(true)
      expect(annualRateConfig.min).toBe(-10)
      expect(annualRateConfig.max).toBe(50)
    })

    it('应该正确配置投资年限字段', () => {
      const configs = CalculatorValidationRules.getFieldConfigs()
      const investmentYearsConfig = configs.investmentYears

      expect(investmentYearsConfig.name).toBe('investmentYears')
      expect(investmentYearsConfig.type).toBe('integer')
      expect(investmentYearsConfig.required).toBe(true)
      expect(investmentYearsConfig.min).toBe(1)
      expect(investmentYearsConfig.max).toBe(100)
    })
  })

  describe('验证规则获取', () => {
    it('应该返回所有计算器验证规则', () => {
      const rules = CalculatorValidationRules.getAllRules()

      expect(rules).toHaveProperty('initialAmount')
      expect(rules).toHaveProperty('monthlyAmount')
      expect(rules).toHaveProperty('annualRate')
      expect(rules).toHaveProperty('investmentYears')
      expect(rules).toHaveProperty('taxRate')
      expect(rules).toHaveProperty('inflationRate')
    })

    it('应该为每个字段返回验证规则数组', () => {
      const rules = CalculatorValidationRules.getAllRules()

      Object.values(rules).forEach(fieldRules => {
        expect(Array.isArray(fieldRules)).toBe(true)
        expect(fieldRules.length).toBeGreaterThan(0)

        fieldRules.forEach(rule => {
          expect(rule).toHaveProperty('name')
          expect(rule).toHaveProperty('priority')
          expect(rule).toHaveProperty('validator')
          expect(typeof rule.validator).toBe('function')
        })
      })
    })
  })
})
