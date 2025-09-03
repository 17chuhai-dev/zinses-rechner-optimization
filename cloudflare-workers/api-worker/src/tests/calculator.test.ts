import { describe, it, expect } from 'vitest'
import { CalculatorService } from '../services/calculator'

describe('CalculatorService', () => {
  const calculator = new CalculatorService()

  describe('复利计算验证', () => {
    it('基础复利计算准确性 - 10年4%年利率', async () => {
      const request = {
        principal: 10000,
        annual_rate: 4,
        years: 10,
        monthly_payment: 0,
        compound_frequency: 'yearly' as const
      }

      const result = await calculator.calculateCompoundInterest(request)
      
      // 验证最终金额 (10000 * 1.04^10 = 14802.44)
      expect(result.final_amount).toBeCloseTo(14802.44, 2)
      expect(result.total_contributions).toBe(10000)
      expect(result.total_interest).toBeCloseTo(4802.44, 2)
    })

    it('月供复利计算准确性 - 月供500€，5年5%年利率', async () => {
      const request = {
        principal: 0,
        annual_rate: 5,
        years: 5,
        monthly_payment: 500,
        compound_frequency: 'monthly' as const
      }

      const result = await calculator.calculateCompoundInterest(request)
      
      // 验证月供复利计算
      expect(result.total_contributions).toBe(30000) // 500 * 12 * 5
      expect(result.final_amount).toBeGreaterThan(30000)
      expect(result.total_interest).toBeGreaterThan(0)
    })

    it('混合投资计算 - 初始投资+月供', async () => {
      const request = {
        principal: 5000,
        annual_rate: 6,
        years: 3,
        monthly_payment: 200,
        compound_frequency: 'monthly' as const
      }

      const result = await calculator.calculateCompoundInterest(request)
      
      // 验证总投入 = 初始投资 + 月供总额
      const expectedContributions = 5000 + (200 * 12 * 3) // 5000 + 7200 = 12200
      expect(result.total_contributions).toBe(expectedContributions)
      expect(result.final_amount).toBeGreaterThan(expectedContributions)
    })

    it('年度明细数据完整性验证', async () => {
      const request = {
        principal: 1000,
        annual_rate: 3,
        years: 3,
        monthly_payment: 100,
        compound_frequency: 'monthly' as const
      }

      const result = await calculator.calculateCompoundInterest(request)
      
      // 验证年度明细
      expect(result.yearly_breakdown).toHaveLength(3)
      
      result.yearly_breakdown.forEach((year, index) => {
        expect(year.year).toBe(index + 1)
        expect(year.start_amount).toBeGreaterThanOrEqual(0)
        expect(year.contributions).toBeGreaterThan(0)
        expect(year.interest).toBeGreaterThanOrEqual(0)
        expect(year.end_amount).toBeGreaterThan(year.start_amount)
      })
    })

    it('边界值处理 - 零利率', async () => {
      const request = {
        principal: 1000,
        annual_rate: 0,
        years: 5,
        monthly_payment: 0,
        compound_frequency: 'yearly' as const
      }

      const result = await calculator.calculateCompoundInterest(request)
      
      // 零利率情况下，最终金额应该等于本金
      expect(result.final_amount).toBe(1000)
      expect(result.total_interest).toBe(0)
    })

    it('边界值处理 - 零本金', async () => {
      const request = {
        principal: 0,
        annual_rate: 5,
        years: 2,
        monthly_payment: 100,
        compound_frequency: 'monthly' as const
      }

      const result = await calculator.calculateCompoundInterest(request)
      
      // 验证只有月供的情况
      expect(result.total_contributions).toBe(2400) // 100 * 12 * 2
      expect(result.final_amount).toBeGreaterThan(2400)
    })
  })

  describe('德国税务计算验证', () => {
    it('基础税务计算 - 无教会税', () => {
      const grossInterest = 2000
      const taxResult = calculator.calculateGermanTax(grossInterest, false)
      
      // 验证税务计算
      expect(taxResult.grossInterest).toBe(2000)
      expect(taxResult.taxFreeAmount).toBe(1000) // Sparerpauschbetrag
      expect(taxResult.taxableInterest).toBe(1000) // 2000 - 1000
      expect(taxResult.abgeltungssteuer).toBe(250) // 1000 * 0.25
      expect(taxResult.solidaritaetszuschlag).toBeCloseTo(13.75, 2) // 250 * 0.055
      expect(taxResult.kirchensteuer).toBe(0)
      expect(taxResult.netInterest).toBeCloseTo(1736.25, 2) // 2000 - 250 - 13.75
    })

    it('税务计算 - 含教会税', () => {
      const grossInterest = 3000
      const taxResult = calculator.calculateGermanTax(grossInterest, true)
      
      // 验证含教会税的计算
      expect(taxResult.taxableInterest).toBe(2000) // 3000 - 1000
      expect(taxResult.abgeltungssteuer).toBe(500) // 2000 * 0.25
      expect(taxResult.solidaritaetszuschlag).toBeCloseTo(27.5, 2) // 500 * 0.055
      expect(taxResult.kirchensteuer).toBe(40) // 500 * 0.08
      expect(taxResult.netInterest).toBeCloseTo(2432.5, 2) // 3000 - 500 - 27.5 - 40
    })

    it('免税额度内收益 - 无税务影响', () => {
      const grossInterest = 800
      const taxResult = calculator.calculateGermanTax(grossInterest, false)
      
      // 免税额度内，无税务影响
      expect(taxResult.taxableInterest).toBe(0)
      expect(taxResult.abgeltungssteuer).toBe(0)
      expect(taxResult.solidaritaetszuschlag).toBe(0)
      expect(taxResult.kirchensteuer).toBe(0)
      expect(taxResult.netInterest).toBe(800)
    })
  })

  describe('输入验证', () => {
    it('应该验证负数输入', async () => {
      const request = {
        principal: -1000,
        annual_rate: 5,
        years: 10,
        monthly_payment: 0,
        compound_frequency: 'yearly' as const
      }

      await expect(calculator.calculateCompoundInterest(request))
        .rejects.toThrow('本金不能为负数')
    })

    it('应该验证过高的利率', async () => {
      const request = {
        principal: 1000,
        annual_rate: 150, // 150%年利率不现实
        years: 10,
        monthly_payment: 0,
        compound_frequency: 'yearly' as const
      }

      await expect(calculator.calculateCompoundInterest(request))
        .rejects.toThrow('年利率不能超过100%')
    })

    it('应该验证投资年限', async () => {
      const request = {
        principal: 1000,
        annual_rate: 5,
        years: 0,
        monthly_payment: 0,
        compound_frequency: 'yearly' as const
      }

      await expect(calculator.calculateCompoundInterest(request))
        .rejects.toThrow('投资年限必须大于0')
    })
  })

  describe('性能测试', () => {
    it('计算性能应该在500ms内完成', async () => {
      const request = {
        principal: 50000,
        annual_rate: 7,
        years: 30,
        monthly_payment: 1000,
        compound_frequency: 'monthly' as const
      }

      const startTime = Date.now()
      const result = await calculator.calculateCompoundInterest(request)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(500)
      expect(result.performance.calculation_time_ms).toBeLessThan(500)
    })

    it('大数值计算稳定性', async () => {
      const request = {
        principal: 1000000, // 100万欧元
        annual_rate: 8,
        years: 25,
        monthly_payment: 5000,
        compound_frequency: 'monthly' as const
      }

      const result = await calculator.calculateCompoundInterest(request)
      
      // 验证大数值计算不会溢出或产生NaN
      expect(result.final_amount).toBeGreaterThan(0)
      expect(result.final_amount).not.toBe(Infinity)
      expect(Number.isFinite(result.final_amount)).toBe(true)
    })
  })

  describe('数学精度验证', () => {
    it('应该避免浮点数精度问题', async () => {
      const request = {
        principal: 0.1,
        annual_rate: 0.1,
        years: 1,
        monthly_payment: 0.01,
        compound_frequency: 'monthly' as const
      }

      const result = await calculator.calculateCompoundInterest(request)
      
      // 验证小数计算精度
      expect(result.final_amount).toBeGreaterThan(0)
      expect(Number.isFinite(result.final_amount)).toBe(true)
      
      // 验证结果是合理的欧元金额（两位小数）
      const decimalPlaces = result.final_amount.toString().split('.')[1]?.length || 0
      expect(decimalPlaces).toBeLessThanOrEqual(2)
    })

    it('复利频率对比验证', async () => {
      const baseRequest = {
        principal: 10000,
        annual_rate: 6,
        years: 5,
        monthly_payment: 0
      }

      const yearlyResult = await calculator.calculateCompoundInterest({
        ...baseRequest,
        compound_frequency: 'yearly'
      })

      const monthlyResult = await calculator.calculateCompoundInterest({
        ...baseRequest,
        compound_frequency: 'monthly'
      })

      // 月复利应该比年复利产生更高的收益
      expect(monthlyResult.final_amount).toBeGreaterThan(yearlyResult.final_amount)
    })
  })
})
