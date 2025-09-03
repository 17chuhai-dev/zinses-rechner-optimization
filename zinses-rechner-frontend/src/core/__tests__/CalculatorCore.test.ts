/**
 * 计算器核心功能单元测试
 * 测试各种财务计算的准确性和边界条件
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CalculatorCore } from '../CalculatorCore'
import type { CompoundInterestParams, LoanParams, InvestmentParams } from '../types'

describe('CalculatorCore', () => {
  let calculator: CalculatorCore

  beforeEach(() => {
    calculator = new CalculatorCore()
  })

  describe('复利计算 (Compound Interest)', () => {
    it('应该正确计算基本复利', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        rate: 5,
        time: 10,
        compoundingFrequency: 1
      }

      const result = calculator.calculateCompoundInterest(params)

      expect(result.finalAmount).toBeCloseTo(16288.95, 2)
      expect(result.totalInterest).toBeCloseTo(6288.95, 2)
      expect(result.effectiveRate).toBeCloseTo(5, 2)
    })

    it('应该正确处理月复利', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        rate: 5,
        time: 10,
        compoundingFrequency: 12
      }

      const result = calculator.calculateCompoundInterest(params)

      expect(result.finalAmount).toBeCloseTo(16470.09, 2)
      expect(result.totalInterest).toBeCloseTo(6470.09, 2)
      expect(result.effectiveRate).toBeCloseTo(5.116, 2)
    })

    it('应该正确处理连续复利', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        rate: 5,
        time: 10,
        compoundingFrequency: 'continuous'
      }

      const result = calculator.calculateCompoundInterest(params)

      expect(result.finalAmount).toBeCloseTo(16487.21, 2)
      expect(result.totalInterest).toBeCloseTo(6487.21, 2)
    })

    it('应该处理零利率情况', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        rate: 0,
        time: 10,
        compoundingFrequency: 1
      }

      const result = calculator.calculateCompoundInterest(params)

      expect(result.finalAmount).toBe(10000)
      expect(result.totalInterest).toBe(0)
      expect(result.effectiveRate).toBe(0)
    })

    it('应该处理负数输入并抛出错误', () => {
      const params: CompoundInterestParams = {
        principal: -1000,
        rate: 5,
        time: 10,
        compoundingFrequency: 1
      }

      expect(() => calculator.calculateCompoundInterest(params)).toThrow('本金必须为正数')
    })

    it('应该生成正确的年度明细', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        rate: 5,
        time: 3,
        compoundingFrequency: 1
      }

      const result = calculator.calculateCompoundInterest(params)

      expect(result.yearlyBreakdown).toHaveLength(3)
      expect(result.yearlyBreakdown[0].year).toBe(1)
      expect(result.yearlyBreakdown[0].startingBalance).toBe(10000)
      expect(result.yearlyBreakdown[0].endingBalance).toBeCloseTo(10500, 2)
      expect(result.yearlyBreakdown[0].interestEarned).toBeCloseTo(500, 2)
    })
  })

  describe('贷款计算 (Loan Calculation)', () => {
    it('应该正确计算等额本息还款', () => {
      const params: LoanParams = {
        principal: 200000,
        rate: 3.5,
        termYears: 30,
        paymentType: 'equal_payment'
      }

      const result = calculator.calculateLoan(params)

      expect(result.monthlyPayment).toBeCloseTo(898.09, 2)
      expect(result.totalPayment).toBeCloseTo(323312.18, 2)
      expect(result.totalInterest).toBeCloseTo(123312.18, 2)
    })

    it('应该正确计算等额本金还款', () => {
      const params: LoanParams = {
        principal: 200000,
        rate: 3.5,
        termYears: 30,
        paymentType: 'equal_principal'
      }

      const result = calculator.calculateLoan(params)

      expect(result.firstPayment).toBeCloseTo(1138.89, 2)
      expect(result.lastPayment).toBeCloseTo(572.22, 2)
      expect(result.totalInterest).toBeCloseTo(105291.67, 2)
    })

    it('应该生成正确的还款计划', () => {
      const params: LoanParams = {
        principal: 100000,
        rate: 4,
        termYears: 2,
        paymentType: 'equal_payment'
      }

      const result = calculator.calculateLoan(params)

      expect(result.amortizationSchedule).toHaveLength(24)
      
      const firstPayment = result.amortizationSchedule[0]
      expect(firstPayment.paymentNumber).toBe(1)
      expect(firstPayment.principalPayment).toBeGreaterThan(0)
      expect(firstPayment.interestPayment).toBeGreaterThan(0)
      expect(firstPayment.remainingBalance).toBeLessThan(100000)
    })

    it('应该处理德国特殊贷款条件', () => {
      const params: LoanParams = {
        principal: 300000,
        rate: 2.5,
        termYears: 25,
        paymentType: 'equal_payment',
        germanSpecific: {
          eigenkapital: 60000, // 自有资金
          nebenkosten: 30000,  // 附加费用
          tilgungssatz: 2       // 还款率
        }
      }

      const result = calculator.calculateLoan(params)

      expect(result.germanSpecific?.loanToValue).toBeCloseTo(81.08, 2)
      expect(result.germanSpecific?.effectiveRate).toBeGreaterThan(params.rate)
    })
  })

  describe('投资计算 (Investment Calculation)', () => {
    it('应该正确计算定期投资', () => {
      const params: InvestmentParams = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        expectedReturn: 7,
        timeHorizon: 20,
        inflationRate: 2
      }

      const result = calculator.calculateInvestment(params)

      expect(result.finalValue).toBeGreaterThan(params.initialInvestment)
      expect(result.totalContributions).toBe(10000 + (500 * 12 * 20))
      expect(result.totalGains).toBeGreaterThan(0)
      expect(result.realValue).toBeLessThan(result.finalValue)
    })

    it('应该计算投资组合风险', () => {
      const params: InvestmentParams = {
        initialInvestment: 50000,
        monthlyContribution: 1000,
        expectedReturn: 8,
        timeHorizon: 15,
        riskProfile: 'aggressive',
        assetAllocation: {
          stocks: 80,
          bonds: 15,
          cash: 5
        }
      }

      const result = calculator.calculateInvestment(params)

      expect(result.riskMetrics?.volatility).toBeGreaterThan(0)
      expect(result.riskMetrics?.sharpeRatio).toBeDefined()
      expect(result.riskMetrics?.maxDrawdown).toBeDefined()
    })

    it('应该生成年度投资明细', () => {
      const params: InvestmentParams = {
        initialInvestment: 10000,
        monthlyContribution: 200,
        expectedReturn: 6,
        timeHorizon: 5
      }

      const result = calculator.calculateInvestment(params)

      expect(result.yearlyBreakdown).toHaveLength(5)
      
      const firstYear = result.yearlyBreakdown[0]
      expect(firstYear.year).toBe(1)
      expect(firstYear.startingValue).toBe(10000)
      expect(firstYear.contributions).toBe(200 * 12)
      expect(firstYear.gains).toBeGreaterThan(0)
    })
  })

  describe('德国税务计算 (German Tax Calculations)', () => {
    it('应该正确计算资本利得税', () => {
      const gains = 5000
      const result = calculator.calculateGermanCapitalGainsTax(gains)

      // 德国资本利得税率为25% + 5.5%团结税
      expect(result.taxRate).toBeCloseTo(26.375, 3)
      expect(result.taxAmount).toBeCloseTo(1318.75, 2)
      expect(result.netGains).toBeCloseTo(3681.25, 2)
    })

    it('应该应用储蓄者免税额', () => {
      const gains = 500 // 低于801欧元免税额
      const result = calculator.calculateGermanCapitalGainsTax(gains)

      expect(result.taxAmount).toBe(0)
      expect(result.netGains).toBe(gains)
      expect(result.exemptionUsed).toBe(500)
    })

    it('应该计算教会税', () => {
      const gains = 10000
      const result = calculator.calculateGermanCapitalGainsTax(gains, {
        churchTax: true,
        churchTaxRate: 8 // 8% 教会税
      })

      expect(result.churchTax).toBeGreaterThan(0)
      expect(result.totalTaxRate).toBeGreaterThan(26.375)
    })
  })

  describe('退休规划计算 (Retirement Planning)', () => {
    it('应该计算德国法定养老金', () => {
      const params = {
        currentAge: 30,
        retirementAge: 67,
        currentSalary: 50000,
        salaryGrowthRate: 2,
        pensionPoints: 1.5
      }

      const result = calculator.calculateGermanPension(params)

      expect(result.estimatedPension).toBeGreaterThan(0)
      expect(result.pensionLevel).toBeLessThan(100) // 替代率应小于100%
      expect(result.totalPensionPoints).toBeGreaterThan(params.pensionPoints)
    })

    it('应该计算Riester养老金', () => {
      const params = {
        age: 35,
        salary: 60000,
        children: 2,
        monthlyContribution: 200
      }

      const result = calculator.calculateRiesterPension(params)

      expect(result.governmentSubsidy).toBeGreaterThan(0)
      expect(result.childBonus).toBe(2 * 300) // 每个孩子300欧元
      expect(result.taxBenefit).toBeGreaterThan(0)
    })
  })

  describe('边界条件和错误处理', () => {
    it('应该处理极大数值', () => {
      const params: CompoundInterestParams = {
        principal: 1000000000, // 10亿
        rate: 1,
        time: 100,
        compoundingFrequency: 1
      }

      expect(() => calculator.calculateCompoundInterest(params)).not.toThrow()
    })

    it('应该处理极小数值', () => {
      const params: CompoundInterestParams = {
        principal: 0.01,
        rate: 0.01,
        time: 1,
        compoundingFrequency: 1
      }

      const result = calculator.calculateCompoundInterest(params)
      expect(result.finalAmount).toBeGreaterThan(0.01)
    })

    it('应该验证输入参数', () => {
      expect(() => calculator.calculateCompoundInterest({
        principal: 0,
        rate: 5,
        time: 10,
        compoundingFrequency: 1
      })).toThrow('本金必须大于0')

      expect(() => calculator.calculateCompoundInterest({
        principal: 1000,
        rate: -1,
        time: 10,
        compoundingFrequency: 1
      })).toThrow('利率不能为负数')

      expect(() => calculator.calculateCompoundInterest({
        principal: 1000,
        rate: 5,
        time: 0,
        compoundingFrequency: 1
      })).toThrow('时间必须大于0')
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内完成复杂计算', () => {
      const startTime = performance.now()
      
      const params: CompoundInterestParams = {
        principal: 100000,
        rate: 5,
        time: 50,
        compoundingFrequency: 12
      }

      calculator.calculateCompoundInterest(params)
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(executionTime).toBeLessThan(100) // 应在100ms内完成
    })

    it('应该处理大量计算请求', () => {
      const calculations = Array.from({ length: 1000 }, (_, i) => ({
        principal: 1000 + i,
        rate: 5,
        time: 10,
        compoundingFrequency: 1
      }))

      const startTime = performance.now()
      
      calculations.forEach(params => {
        calculator.calculateCompoundInterest(params)
      })
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(executionTime).toBeLessThan(1000) // 1000次计算应在1秒内完成
    })
  })
})
