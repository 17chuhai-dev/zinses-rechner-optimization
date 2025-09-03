/**
 * 德国税收计算工具单元测试
 * 验证所有税收计算函数的准确性，包括资本利得税计算、免税额度应用、ETF部分免税计算、教会税计算等
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateAbgeltungssteuer,
  calculateFreistellungsauftragUsage,
  calculateETFTeilfreistellung,
  calculateChurchTax,
  calculateTotalTaxBurden,
  optimizeFreistellungsauftragAllocation,
  validateTaxSettings,
  formatCurrency,
  formatPercentage,
  roundToDecimalPlaces
} from '../germanTaxCalculations'
import {
  TaxSettings,
  TaxCalculationParams,
  TaxCalculationResult,
  GermanState,
  ChurchTaxType,
  ETFType,
  DEFAULT_TAX_SETTINGS
} from '@/types/GermanTaxTypes'

describe('germanTaxCalculations - 基础计算函数测试', () => {
  let defaultSettings: TaxSettings
  let basicParams: TaxCalculationParams

  beforeEach(() => {
    defaultSettings = JSON.parse(JSON.stringify(DEFAULT_TAX_SETTINGS))
    basicParams = {
      income: 1000,
      incomeType: 'capital_gains',
      etfType: ETFType.EQUITY_FOREIGN,
      jointFiling: false,
      deductions: 0,
      taxYear: 2024
    }
  })

  describe('calculateAbgeltungssteuer 函数', () => {
    it('应该正确计算基础资本利得税（25%）', () => {
      const basicParamsWithoutETF = { ...basicParams }
      delete basicParamsWithoutETF.etfType
      const result = calculateAbgeltungssteuer(basicParamsWithoutETF, defaultSettings)

      expect(result).toBeDefined()
      expect(result.baseTax).toBe(49.75) // (1000 - 801) * 0.25 = 49.75
      expect(result.taxableIncome).toBe(199) // 1000 - 801 = 199
      expect(result.exemptAmount).toBe(801) // 免税额度
    })

    it('应该正确应用免税额度', () => {
      const smallIncomeParams = { ...basicParams, income: 500 }
      delete smallIncomeParams.etfType
      const result = calculateAbgeltungssteuer(smallIncomeParams, defaultSettings)

      expect(result.baseTax).toBe(0) // 收入小于免税额度，无需缴税
      expect(result.totalTax).toBe(0)
      expect(result.exemptAmount).toBe(500) // 使用的免税额度
      expect(result.taxableIncome).toBe(0)
    })

    it('应该正确计算团结税（5.5%）', () => {
      const result = calculateAbgeltungssteuer(basicParams, defaultSettings)

      const expectedSolidarityTax = result.baseTax * 0.055
      expect(result.solidarityTax).toBeCloseTo(expectedSolidarityTax, 2)
    })

    it('应该在禁用团结税时不计算团结税', () => {
      const settingsWithoutSoli = { ...defaultSettings }
      settingsWithoutSoli.abgeltungssteuer.calculation.includeSolidarityTax = false

      const result = calculateAbgeltungssteuer(basicParams, settingsWithoutSoli)
      expect(result.solidarityTax).toBe(0)
    })

    it('应该正确计算教会税', () => {
      const settingsWithChurchTax = { ...defaultSettings }
      settingsWithChurchTax.userInfo.churchTaxType = ChurchTaxType.CATHOLIC
      settingsWithChurchTax.userInfo.state = GermanState.NORDRHEIN_WESTFALEN
      settingsWithChurchTax.abgeltungssteuer.churchTax.rate = 0.09
      settingsWithChurchTax.abgeltungssteuer.calculation.includeChurchTax = true

      const result = calculateAbgeltungssteuer(basicParams, settingsWithChurchTax)

      const expectedChurchTax = result.baseTax * 0.09
      expect(result.churchTax).toBeCloseTo(expectedChurchTax, 2)
    })

    it('应该在无教会税时不计算教会税', () => {
      const result = calculateAbgeltungssteuer(basicParams, defaultSettings)
      expect(result.churchTax).toBe(0)
    })

    it('应该正确计算总税额', () => {
      const settingsWithAllTaxes = { ...defaultSettings }
      settingsWithAllTaxes.userInfo.churchTaxType = ChurchTaxType.CATHOLIC
      settingsWithAllTaxes.abgeltungssteuer.churchTax.rate = 0.09
      settingsWithAllTaxes.abgeltungssteuer.calculation.includeChurchTax = true

      const result = calculateAbgeltungssteuer(basicParams, settingsWithAllTaxes)

      const expectedTotal = result.baseTax + result.solidarityTax + result.churchTax
      expect(result.totalTax).toBeCloseTo(expectedTotal, 2)
    })

    it('应该正确计算税后收入', () => {
      const result = calculateAbgeltungssteuer(basicParams, defaultSettings)

      const expectedNetIncome = basicParams.income - result.totalTax
      expect(result.netIncome).toBeCloseTo(expectedNetIncome, 2)
    })

    it('应该正确计算有效税率', () => {
      const result = calculateAbgeltungssteuer(basicParams, defaultSettings)

      const expectedEffectiveRate = result.totalTax / basicParams.income
      expect(result.effectiveTaxRate).toBeCloseTo(expectedEffectiveRate, 4)
    })
  })

  describe('calculateETFTeilfreistellung 函数', () => {
    it('应该正确计算股票ETF的30%免税', () => {
      const etfParams = { ...basicParams, etfType: ETFType.EQUITY_FOREIGN }
      const result = calculateETFTeilfreistellung(etfParams, defaultSettings)

      // 应税收入 = 1000 - 801 = 199
      // ETF免税 = 199 * 0.30 = 59.7
      expect(result.exemptAmount).toBeCloseTo(300, 1) // 1000 * 0.30
      expect(result.exemptionRate).toBe(0.30)
    })

    it('应该正确计算房地产ETF的60%免税', () => {
      const etfParams = { ...basicParams, etfType: ETFType.REAL_ESTATE }
      const result = calculateETFTeilfreistellung(etfParams, defaultSettings)

      expect(result.exemptionRate).toBe(0.60)
      expect(result.exemptAmount).toBeCloseTo(600, 1) // 1000 * 0.60
    })

    it('应该正确处理债券基金的0%免税', () => {
      const etfParams = { ...basicParams, etfType: ETFType.BOND_FUND }
      const result = calculateETFTeilfreistellung(etfParams, defaultSettings)

      expect(result.exemptionRate).toBe(0.00)
      expect(result.exemptAmount).toBe(0)
    })

    it('应该在ETF部分免税禁用时返回0', () => {
      const settingsWithoutETF = { ...defaultSettings }
      settingsWithoutETF.etfTeilfreistellung.enabled = false

      const etfParams = { ...basicParams, etfType: ETFType.EQUITY_FOREIGN }
      const result = calculateETFTeilfreistellung(etfParams, settingsWithoutETF)

      expect(result.exemptAmount).toBe(0)
      expect(result.exemptionRate).toBe(0)
    })

    it('应该在没有ETF类型时返回0', () => {
      const paramsWithoutETF = { ...basicParams }
      delete paramsWithoutETF.etfType

      const result = calculateETFTeilfreistellung(paramsWithoutETF, defaultSettings)

      expect(result.exemptAmount).toBe(0)
      expect(result.exemptionRate).toBe(0)
    })
  })

  describe('calculateChurchTax 函数', () => {
    it('应该正确计算北威州的9%教会税', () => {
      const result = calculateChurchTax(100, GermanState.NORDRHEIN_WESTFALEN, ChurchTaxType.CATHOLIC)

      expect(result.rate).toBe(0.09)
      expect(result.amount).toBe(9) // 100 * 0.09
      expect(result.state).toBe(GermanState.NORDRHEIN_WESTFALEN)
    })

    it('应该正确计算巴伐利亚州的8%教会税', () => {
      const result = calculateChurchTax(100, GermanState.BAYERN, ChurchTaxType.CATHOLIC)

      expect(result.rate).toBe(0.08)
      expect(result.amount).toBe(8) // 100 * 0.08
    })

    it('应该在无教会税时返回0', () => {
      const result = calculateChurchTax(100, GermanState.NORDRHEIN_WESTFALEN, ChurchTaxType.NONE)

      expect(result.rate).toBe(0)
      expect(result.amount).toBe(0)
    })

    it('应该处理所有德国联邦州', () => {
      const states = Object.values(GermanState)

      states.forEach(state => {
        const result = calculateChurchTax(100, state, ChurchTaxType.CATHOLIC)

        expect(result.rate).toBeGreaterThanOrEqual(0.08)
        expect(result.rate).toBeLessThanOrEqual(0.09)
        expect(result.amount).toBeGreaterThanOrEqual(8)
        expect(result.amount).toBeLessThanOrEqual(9)
      })
    })
  })

  describe('calculateFreistellungsauftragUsage 函数', () => {
    it('应该正确计算免税额度使用情况', () => {
      const result = calculateFreistellungsauftragUsage(1500, defaultSettings)

      expect(result.totalAllowance).toBe(801)
      expect(result.usedAllowance).toBe(801) // 使用全部免税额度
      expect(result.remainingAllowance).toBe(0)
      expect(result.taxableAmount).toBe(699) // 1500 - 801
    })

    it('应该在收入小于免税额度时正确处理', () => {
      const result = calculateFreistellungsauftragUsage(500, defaultSettings)

      expect(result.usedAllowance).toBe(500)
      expect(result.remainingAllowance).toBe(301) // 801 - 500
      expect(result.taxableAmount).toBe(0)
    })

    it('应该在免税额度禁用时不应用免税', () => {
      const settingsWithoutAllowance = { ...defaultSettings }
      settingsWithoutAllowance.freistellungsauftrag.enabled = false

      const result = calculateFreistellungsauftragUsage(1500, settingsWithoutAllowance)

      expect(result.usedAllowance).toBe(0)
      expect(result.taxableAmount).toBe(1500)
    })

    it('应该考虑已使用的免税额度', () => {
      const settingsWithUsedAllowance = { ...defaultSettings }
      settingsWithUsedAllowance.freistellungsauftrag = {
        ...defaultSettings.freistellungsauftrag,
        usedAllowance: 300,
        remainingAllowance: 501
      }

      const result = calculateFreistellungsauftragUsage(1000, settingsWithUsedAllowance)

      expect(result.usedAllowance).toBe(501) // 使用剩余的501€
      expect(result.taxableAmount).toBe(499) // 1000 - 501
    })
  })

  describe('工具函数测试', () => {
    describe('formatCurrency 函数', () => {
      it('应该正确格式化货币', () => {
        expect(formatCurrency(1234.56)).toBe('1.234,56 €')
        expect(formatCurrency(0)).toBe('0,00 €')
        expect(formatCurrency(1000000)).toBe('1.000.000,00 €')
      })

      it('应该处理负数', () => {
        expect(formatCurrency(-1234.56)).toBe('-1.234,56 €')
      })
    })

    describe('formatPercentage 函数', () => {
      it('应该正确格式化百分比', () => {
        expect(formatPercentage(0.2637)).toBe('26,37 %')
        expect(formatPercentage(0)).toBe('0,00 %')
        expect(formatPercentage(1)).toBe('100,00 %')
      })

      it('应该支持自定义小数位数', () => {
        expect(formatPercentage(0.2637, 1)).toBe('26,4 %')
        expect(formatPercentage(0.2637, 3)).toBe('26,370 %')
      })
    })

    describe('roundToDecimalPlaces 函数', () => {
      it('应该正确四舍五入', () => {
        expect(roundToDecimalPlaces(1.235, 2)).toBe(1.24)
        expect(roundToDecimalPlaces(1.234, 2)).toBe(1.23)
        expect(roundToDecimalPlaces(1.236, 2)).toBe(1.24)
      })

      it('应该处理整数', () => {
        expect(roundToDecimalPlaces(5, 2)).toBe(5)
        expect(roundToDecimalPlaces(5.0, 2)).toBe(5)
      })
    })

    describe('validateTaxSettings 函数', () => {
      it('应该验证有效的税收设置', () => {
        const result = validateTaxSettings(DEFAULT_TAX_SETTINGS)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('应该检测无效的税率', () => {
        const invalidSettings = { ...DEFAULT_TAX_SETTINGS }
        invalidSettings.abgeltungssteuer.baseTaxRate = 1.5 // 150%，无效

        const result = validateTaxSettings(invalidSettings)

        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('应该检测无效的免税额度', () => {
        const invalidSettings = { ...DEFAULT_TAX_SETTINGS }
        invalidSettings.freistellungsauftrag.usedAllowance = 1000 // 超过年度额度

        const result = validateTaxSettings(invalidSettings)

        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.includes('Freibetrag'))).toBe(true)
      })
    })
  })

  describe('边界条件测试', () => {
    it('应该正确处理零收入', () => {
      const zeroIncomeParams: TaxCalculationParams = {
        income: 0,
        incomeType: 'capital_gains',
        jointFiling: false,
        deductions: 0,
        taxYear: 2024
      }

      const result = calculateAbgeltungssteuer(zeroIncomeParams, defaultSettings)

      expect(result.totalTax).toBe(0)
      expect(result.netIncome).toBe(0)
      expect(result.effectiveTaxRate).toBe(0)
    })

    it('应该正确处理负收入', () => {
      const negativeIncomeParams: TaxCalculationParams = {
        income: -1000,
        incomeType: 'capital_gains',
        jointFiling: false,
        deductions: 0,
        taxYear: 2024
      }

      const result = calculateAbgeltungssteuer(negativeIncomeParams, defaultSettings)

      expect(result.totalTax).toBe(0)
      expect(result.netIncome).toBe(-1000)
    })

    it('应该正确处理刚好等于免税额度的收入', () => {
      const exactAllowanceParams: TaxCalculationParams = {
        income: 801,
        incomeType: 'capital_gains',
        jointFiling: false,
        deductions: 0,
        taxYear: 2024
      }

      const result = calculateAbgeltungssteuer(exactAllowanceParams, defaultSettings)

      expect(result.totalTax).toBe(0)
      expect(result.taxableIncome).toBe(0)
      expect(result.exemptAmount).toBe(801)
    })
  })
})
