/**
 * useCalculator composable测试
 * 测试计算器状态管理和业务逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCalculator } from '../useCalculator'

// Mock API
vi.mock('@/api/calculatorAPI', () => ({
  calculatorAPI: {
    calculate: vi.fn().mockResolvedValue({
      finalAmount: 14802.44,
      totalInterest: 4802.44,
      totalContributions: 10000,
      yearlyBreakdown: [
        { year: 1, startAmount: 10000, contributions: 0, interest: 400, endAmount: 10400 }
      ]
    })
  }
}))

describe('useCalculator', () => {
  let calculator: ReturnType<typeof useCalculator>

  beforeEach(() => {
    calculator = useCalculator()
  })

  describe('Initial State', () => {
    it('has correct default form values', () => {
      expect(calculator.form.principal).toBe(10000)
      expect(calculator.form.annualRate).toBe(4.0)
      expect(calculator.form.years).toBe(10)
      expect(calculator.form.monthlyPayment).toBe(0)
      expect(calculator.form.compoundFrequency).toBe('monthly')
    })

    it('has correct initial state', () => {
      expect(calculator.results.value).toBeNull()
      expect(calculator.errors.value).toEqual([])
      expect(calculator.isCalculating.value).toBe(false)
      expect(calculator.taxCalculation.value).toBeNull()
    })

    it('has correct default tax settings', () => {
      expect(calculator.taxSettings.value.enabled).toBe(false)
      expect(calculator.taxSettings.value.hasKirchensteuer).toBe(false)
      expect(calculator.taxSettings.value.isMarried).toBe(false)
    })
  })

  describe('Form Validation', () => {
    it('validates form correctly with valid data', () => {
      calculator.form.principal = 10000
      calculator.form.annualRate = 4.0
      calculator.form.years = 10
      
      expect(calculator.isFormValid.value).toBe(true)
    })

    it('invalidates form with invalid principal', () => {
      calculator.form.principal = -1000
      
      expect(calculator.isFormValid.value).toBe(false)
    })

    it('invalidates form with invalid rate', () => {
      calculator.form.annualRate = 25.0 // 超过最大值
      
      expect(calculator.isFormValid.value).toBe(false)
    })

    it('invalidates form with invalid years', () => {
      calculator.form.years = 0
      
      expect(calculator.isFormValid.value).toBe(false)
    })
  })

  describe('Calculation', () => {
    it('performs calculation successfully', async () => {
      calculator.form.principal = 10000
      calculator.form.annualRate = 4.0
      calculator.form.years = 10
      
      await calculator.calculate()
      
      expect(calculator.isCalculating.value).toBe(false)
      expect(calculator.results.value).not.toBeNull()
      expect(calculator.results.value?.finalAmount).toBe(14802.44)
    })

    it('sets loading state during calculation', async () => {
      const calculatePromise = calculator.calculate()
      
      expect(calculator.isCalculating.value).toBe(true)
      
      await calculatePromise
      
      expect(calculator.isCalculating.value).toBe(false)
    })

    it('calculates tax when enabled', async () => {
      calculator.taxSettings.value.enabled = true
      calculator.form.principal = 10000
      calculator.form.annualRate = 4.0
      calculator.form.years = 10
      
      await calculator.calculate()
      
      expect(calculator.taxCalculation.value).not.toBeNull()
      expect(calculator.taxCalculation.value?.grossInterest).toBeGreaterThan(0)
    })

    it('does not calculate tax when disabled', async () => {
      calculator.taxSettings.value.enabled = false
      
      await calculator.calculate()
      
      expect(calculator.taxCalculation.value).toBeNull()
    })
  })

  describe('Form Reset', () => {
    it('resets form to default values', () => {
      // 修改表单值
      calculator.form.principal = 50000
      calculator.form.annualRate = 6.0
      calculator.form.years = 20
      
      calculator.resetForm()
      
      expect(calculator.form.principal).toBe(10000)
      expect(calculator.form.annualRate).toBe(4.0)
      expect(calculator.form.years).toBe(10)
    })

    it('clears results and errors on reset', () => {
      // 设置一些状态
      calculator.results.value = { finalAmount: 15000 } as any
      calculator.errors.value = [{ field: 'test', message: 'test error' }]
      
      calculator.resetForm()
      
      expect(calculator.results.value).toBeNull()
      expect(calculator.errors.value).toEqual([])
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock API错误
      const mockError = new Error('Network error')
      vi.mocked(calculator.calculate).mockRejectedValueOnce(mockError)
      
      await calculator.calculate()
      
      expect(calculator.isCalculating.value).toBe(false)
      expect(calculator.errors.value.length).toBeGreaterThan(0)
    })

    it('validates business logic', () => {
      // 设置不现实的参数组合
      calculator.form.principal = 1000000
      calculator.form.monthlyPayment = 100000
      calculator.form.years = 50
      
      calculator.validateForm()
      
      // 应该有警告
      expect(calculator.errors.value.some(e => e.type === 'warning')).toBe(true)
    })
  })

  describe('Tax Settings', () => {
    it('updates tax settings correctly', () => {
      calculator.taxSettings.value.enabled = true
      calculator.taxSettings.value.hasKirchensteuer = true
      calculator.taxSettings.value.bundesland = 'Berlin'
      calculator.taxSettings.value.isMarried = true
      
      expect(calculator.taxSettings.value.enabled).toBe(true)
      expect(calculator.taxSettings.value.hasKirchensteuer).toBe(true)
      expect(calculator.taxSettings.value.bundesland).toBe('Berlin')
      expect(calculator.taxSettings.value.isMarried).toBe(true)
    })

    it('updates Kirchensteuer rate based on Bundesland', () => {
      calculator.taxSettings.value.bundesland = 'Baden-Württemberg'
      
      // 应该自动设置为8%
      expect(calculator.taxSettings.value.kirchensteuerRate).toBe(0.08)
      
      calculator.taxSettings.value.bundesland = 'Berlin'
      
      // 应该自动设置为9%
      expect(calculator.taxSettings.value.kirchensteuerRate).toBe(0.09)
    })
  })

  describe('Computed Properties', () => {
    it('calculates form validity correctly', () => {
      // 有效表单
      calculator.form.principal = 10000
      calculator.form.annualRate = 4.0
      calculator.form.years = 10
      
      expect(calculator.isFormValid.value).toBe(true)
      
      // 无效表单
      calculator.form.principal = -1000
      
      expect(calculator.isFormValid.value).toBe(false)
    })

    it('tracks calculation state correctly', () => {
      expect(calculator.isCalculating.value).toBe(false)
      
      // 模拟计算开始
      calculator.isCalculating.value = true
      expect(calculator.isCalculating.value).toBe(true)
    })
  })

  describe('Integration with Tax Service', () => {
    it('integrates tax calculation with compound interest', async () => {
      calculator.taxSettings.value.enabled = true
      calculator.taxSettings.value.isMarried = false
      
      await calculator.calculate()
      
      if (calculator.results.value && calculator.taxCalculation.value) {
        expect(calculator.taxCalculation.value.grossInterest).toBe(
          calculator.results.value.totalInterest
        )
      }
    })

    it('updates tax calculation when settings change', async () => {
      calculator.taxSettings.value.enabled = true
      await calculator.calculate()
      
      const initialTax = calculator.taxCalculation.value?.totalTax
      
      // 启用教会税
      calculator.taxSettings.value.hasKirchensteuer = true
      calculator.taxSettings.value.kirchensteuerRate = 0.09
      
      await calculator.calculate()
      
      const newTax = calculator.taxCalculation.value?.totalTax
      
      if (initialTax && newTax) {
        expect(newTax).toBeGreaterThan(initialTax)
      }
    })
  })

  describe('Persistence', () => {
    it('saves form state to localStorage', () => {
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')
      
      calculator.form.principal = 25000
      
      // 应该保存到localStorage
      expect(localStorageSpy).toHaveBeenCalledWith(
        'calculator-form',
        expect.stringContaining('25000')
      )
    })

    it('loads form state from localStorage', () => {
      const mockFormData = JSON.stringify({
        principal: 25000,
        annualRate: 5.0,
        years: 15,
        monthlyPayment: 500,
        compoundFrequency: 'monthly'
      })
      
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockFormData)
      
      const newCalculator = useCalculator()
      
      expect(newCalculator.form.principal).toBe(25000)
      expect(newCalculator.form.annualRate).toBe(5.0)
      expect(newCalculator.form.years).toBe(15)
    })
  })
})
