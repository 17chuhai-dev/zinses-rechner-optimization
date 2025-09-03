/**
 * 德国税务服务前端测试
 * 测试税务计算逻辑和边界情况
 */

import { describe, it, expect } from 'vitest'
import { GermanTaxService } from '../germanTaxService'
import type { TaxSettings } from '../germanTaxService'

describe('GermanTaxService', () => {
  const defaultSettings: TaxSettings = {
    hasKirchensteuer: false,
    kirchensteuerRate: 0.09,
    bundesland: '',
    isMarried: false
  }

  describe('calculateYearlyTax', () => {
    it('calculates tax correctly for single person', () => {
      const result = GermanTaxService.calculateYearlyTax(2000, defaultSettings, 2023)
      
      expect(result.grossInterest).toBe(2000)
      expect(result.taxFreeAmount).toBe(1000)
      expect(result.taxableInterest).toBe(1000)
      expect(result.abgeltungssteuer).toBe(250)
      expect(result.solidaritaetszuschlag).toBeCloseTo(13.75, 2)
      expect(result.kirchensteuer).toBe(0)
      expect(result.totalTax).toBeCloseTo(263.75, 2)
      expect(result.netInterest).toBeCloseTo(1736.25, 2)
    })

    it('calculates tax correctly for married couple', () => {
      const marriedSettings: TaxSettings = {
        ...defaultSettings,
        isMarried: true
      }
      
      const result = GermanTaxService.calculateYearlyTax(3000, marriedSettings, 2023)
      
      expect(result.taxFreeAmount).toBe(2000)
      expect(result.taxableInterest).toBe(1000)
      expect(result.abgeltungssteuer).toBe(250)
    })

    it('calculates Kirchensteuer correctly', () => {
      const kirchensteuerSettings: TaxSettings = {
        hasKirchensteuer: true,
        kirchensteuerRate: 0.09,
        bundesland: 'Berlin',
        isMarried: false
      }
      
      const result = GermanTaxService.calculateYearlyTax(2000, kirchensteuerSettings, 2023)
      
      expect(result.kirchensteuer).toBeCloseTo(22.5, 2) // 250 * 0.09
      expect(result.totalTax).toBeCloseTo(286.25, 2) // 250 + 13.75 + 22.5
    })

    it('handles income below tax-free amount', () => {
      const result = GermanTaxService.calculateYearlyTax(500, defaultSettings, 2023)
      
      expect(result.taxableInterest).toBe(0)
      expect(result.abgeltungssteuer).toBe(0)
      expect(result.solidaritaetszuschlag).toBe(0)
      expect(result.totalTax).toBe(0)
      expect(result.netInterest).toBe(500)
    })

    it('uses correct tax-free amount for different years', () => {
      // 2023年及以后
      const result2023 = GermanTaxService.calculateYearlyTax(1000, defaultSettings, 2023)
      expect(result2023.taxFreeAmount).toBe(1000)
      
      // 2022年及以前
      const result2022 = GermanTaxService.calculateYearlyTax(1000, defaultSettings, 2022)
      expect(result2022.taxFreeAmount).toBe(801)
    })
  })

  describe('calculateMultiYearTax', () => {
    it('calculates multi-year tax correctly', () => {
      const yearlyInterests = [1500, 1800, 2200]
      const result = GermanTaxService.calculateMultiYearTax(yearlyInterests, defaultSettings, 2023)
      
      expect(result).toHaveLength(3)
      
      // 检查累计税额递增
      expect(result[0].cumulativeTaxPaid).toBeLessThan(result[1].cumulativeTaxPaid)
      expect(result[1].cumulativeTaxPaid).toBeLessThan(result[2].cumulativeTaxPaid)
      
      // 检查每年的计算
      expect(result[0].taxCalculation.grossInterest).toBe(1500)
      expect(result[1].taxCalculation.grossInterest).toBe(1800)
      expect(result[2].taxCalculation.grossInterest).toBe(2200)
    })
  })

  describe('getKirchensteuerRate', () => {
    it('returns correct rates for different states', () => {
      expect(GermanTaxService.getKirchensteuerRate('Baden-Württemberg')).toBe(0.08)
      expect(GermanTaxService.getKirchensteuerRate('Bayern')).toBe(0.08)
      expect(GermanTaxService.getKirchensteuerRate('Berlin')).toBe(0.09)
      expect(GermanTaxService.getKirchensteuerRate('Hamburg')).toBe(0.09)
      expect(GermanTaxService.getKirchensteuerRate('Unknown State')).toBe(0.09)
    })
  })

  describe('getTaxOptimizationTips', () => {
    it('provides relevant tips for high income', () => {
      const tips = GermanTaxService.getTaxOptimizationTips(15000, defaultSettings)
      
      expect(tips).toContain(expect.stringContaining('Sparerpauschbetrag'))
      expect(tips).toContain(expect.stringContaining('Steuerberatung'))
    })

    it('provides marriage-specific tips', () => {
      const marriedSettings: TaxSettings = {
        ...defaultSettings,
        isMarried: true
      }
      
      const tips = GermanTaxService.getTaxOptimizationTips(3000, marriedSettings)
      
      expect(tips).toContain(expect.stringContaining('Ehepaar'))
      expect(tips).toContain(expect.stringContaining('2.000€'))
    })

    it('provides Kirchensteuer tips when applicable', () => {
      const kirchensteuerSettings: TaxSettings = {
        hasKirchensteuer: true,
        kirchensteuerRate: 0.09,
        bundesland: 'Berlin',
        isMarried: false
      }
      
      const tips = GermanTaxService.getTaxOptimizationTips(5000, kirchensteuerSettings)
      
      expect(tips).toContain(expect.stringContaining('Kirchensteuer'))
    })
  })

  describe('validateTaxSettings', () => {
    it('validates correct settings', () => {
      const validSettings: TaxSettings = {
        hasKirchensteuer: true,
        kirchensteuerRate: 0.09,
        bundesland: 'Berlin',
        isMarried: false
      }
      
      const errors = GermanTaxService.validateTaxSettings(validSettings)
      expect(errors).toHaveLength(0)
    })

    it('detects invalid Kirchensteuer rate', () => {
      const invalidSettings: TaxSettings = {
        hasKirchensteuer: true,
        kirchensteuerRate: 0.15, // 太高
        bundesland: 'Berlin',
        isMarried: false
      }
      
      const errors = GermanTaxService.validateTaxSettings(invalidSettings)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('Kirchensteuersatz')
    })

    it('requires Bundesland when Kirchensteuer is enabled', () => {
      const invalidSettings: TaxSettings = {
        hasKirchensteuer: true,
        kirchensteuerRate: 0.09,
        bundesland: '', // 缺少
        isMarried: false
      }
      
      const errors = GermanTaxService.validateTaxSettings(invalidSettings)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('Bundesland')
    })
  })

  describe('formatTaxInfo', () => {
    it('formats tax information in German locale', () => {
      const taxCalculation = {
        grossInterest: 2000,
        taxFreeAmount: 1000,
        taxableInterest: 1000,
        abgeltungssteuer: 250,
        solidaritaetszuschlag: 13.75,
        kirchensteuer: 0,
        totalTax: 263.75,
        netInterest: 1736.25,
        effectiveTaxRate: 13.19
      }
      
      const formatted = GermanTaxService.formatTaxInfo(taxCalculation)
      
      expect(formatted.grossInterest).toMatch(/2\.000,00\s*€/)
      expect(formatted.abgeltungssteuer).toMatch(/250,00\s*€/)
      expect(formatted.effectiveTaxRate).toMatch(/13,2\s*%/)
    })
  })

  describe('Edge Cases', () => {
    it('handles zero interest correctly', () => {
      const result = GermanTaxService.calculateYearlyTax(0, defaultSettings, 2023)
      
      expect(result.grossInterest).toBe(0)
      expect(result.taxableInterest).toBe(0)
      expect(result.totalTax).toBe(0)
      expect(result.netInterest).toBe(0)
      expect(result.effectiveTaxRate).toBe(0)
    })

    it('handles very small interest amounts', () => {
      const result = GermanTaxService.calculateYearlyTax(0.01, defaultSettings, 2023)
      
      expect(result.grossInterest).toBe(0.01)
      expect(result.taxableInterest).toBe(0)
      expect(result.totalTax).toBe(0)
      expect(result.netInterest).toBe(0.01)
    })

    it('handles very large interest amounts', () => {
      const result = GermanTaxService.calculateYearlyTax(1000000, defaultSettings, 2023)
      
      expect(result.taxableInterest).toBe(999000)
      expect(result.abgeltungssteuer).toBe(249750) // 999000 * 0.25
      expect(result.solidaritaetszuschlag).toBeCloseTo(13736.25, 2) // 249750 * 0.055
      expect(result.totalTax).toBeCloseTo(263486.25, 2)
    })

    it('calculates effective tax rate correctly', () => {
      const result = GermanTaxService.calculateYearlyTax(10000, defaultSettings, 2023)
      
      // 应税利息：9000€
      // 总税额：9000 * 0.25 * 1.055 = 2373.75€
      // 实际税率：2373.75 / 10000 = 23.74%
      expect(result.effectiveTaxRate).toBeCloseTo(23.74, 1)
    })
  })

  describe('Performance Tests', () => {
    it('calculates tax for large datasets efficiently', () => {
      const yearlyInterests = Array(50).fill(5000) // 50年，每年5000€
      
      const startTime = performance.now()
      const result = GermanTaxService.calculateMultiYearTax(yearlyInterests, defaultSettings, 2023)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100) // 应该在100ms内完成
      expect(result).toHaveLength(50)
    })
  })
})
