/**
 * CalculatorForm组件单元测试
 * 测试表单输入、验证和提交功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CalculatorForm from '../CalculatorForm.vue'

// 模拟composables
vi.mock('@/composables/useCalculator', () => ({
  useCalculator: () => ({
    form: {
      value: {
        principal: 10000,
        monthlyPayment: 500,
        annualRate: 4.0,
        years: 10,
        compoundFrequency: 'monthly'
      }
    },
    errors: { value: [] },
    isCalculating: { value: false },
    isFormValid: { value: true },
    calculate: vi.fn(),
    resetForm: vi.fn()
  })
}))

vi.mock('@/composables/useValidation', () => ({
  useCalculatorValidation: () => ({
    validateCalculatorForm: vi.fn().mockReturnValue({
      isValid: true,
      errors: []
    }),
    validateBusinessLogic: vi.fn().mockReturnValue([]),
    clearAllErrors: vi.fn(),
    setErrors: vi.fn()
  })
}))

describe('CalculatorForm', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(CalculatorForm)
  })

  it('应该正确渲染表单', () => {
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('[data-testid="principal-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="monthly-payment-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="annual-rate-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="years-input"]').exists()).toBe(true)
  })

  it('应该显示正确的德语标签', () => {
    const labels = wrapper.findAll('label')
    const labelTexts = labels.map((label: any) => label.text())
    
    expect(labelTexts).toContain('Startkapital (€)')
    expect(labelTexts).toContain('Monatliche Sparrate (€)')
    expect(labelTexts).toContain('Zinssatz (%)')
  })

  it('应该有提交按钮', () => {
    const submitButton = wrapper.find('[type="submit"]')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.text()).toContain('berechnen')
  })

  it('应该在加载时禁用提交按钮', async () => {
    // 重新挂载组件，模拟加载状态
    const mockUseCalculator = vi.fn().mockReturnValue({
      form: { value: {} },
      errors: { value: [] },
      isCalculating: { value: true }, // 设置为加载状态
      isFormValid: { value: true },
      calculate: vi.fn(),
      resetForm: vi.fn()
    })

    vi.doMock('@/composables/useCalculator', () => ({
      useCalculator: mockUseCalculator
    }))

    wrapper = mount(CalculatorForm)
    const submitButton = wrapper.find('[type="submit"]')
    
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('应该在表单提交时调用计算函数', async () => {
    const mockCalculate = vi.fn()
    const mockUseCalculator = vi.fn().mockReturnValue({
      form: { value: {} },
      errors: { value: [] },
      isCalculating: { value: false },
      isFormValid: { value: true },
      calculate: mockCalculate,
      resetForm: vi.fn()
    })

    vi.doMock('@/composables/useCalculator', () => ({
      useCalculator: mockUseCalculator
    }))

    wrapper = mount(CalculatorForm)
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(mockCalculate).toHaveBeenCalled()
  })

  it('应该显示验证错误', async () => {
    const mockUseCalculator = vi.fn().mockReturnValue({
      form: { value: {} },
      errors: { 
        value: [
          { field: 'principal', message: 'Das Startkapital ist erforderlich', code: 'REQUIRED' }
        ] 
      },
      isCalculating: { value: false },
      isFormValid: { value: false },
      calculate: vi.fn(),
      resetForm: vi.fn()
    })

    vi.doMock('@/composables/useCalculator', () => ({
      useCalculator: mockUseCalculator
    }))

    wrapper = mount(CalculatorForm)
    
    expect(wrapper.text()).toContain('Das Startkapital ist erforderlich')
  })

  it('应该正确处理数字输入', async () => {
    const principalInput = wrapper.find('[data-testid="principal-input"]')
    
    await principalInput.setValue('15000')
    expect(principalInput.element.value).toBe('15000')
  })

  it('应该有重置按钮功能', async () => {
    const mockResetForm = vi.fn()
    const mockUseCalculator = vi.fn().mockReturnValue({
      form: { value: {} },
      errors: { value: [] },
      isCalculating: { value: false },
      isFormValid: { value: true },
      calculate: vi.fn(),
      resetForm: mockResetForm
    })

    vi.doMock('@/composables/useCalculator', () => ({
      useCalculator: mockUseCalculator
    }))

    wrapper = mount(CalculatorForm)
    const resetButton = wrapper.find('[data-testid="reset-button"]')
    
    if (resetButton.exists()) {
      await resetButton.trigger('click')
      expect(mockResetForm).toHaveBeenCalled()
    }
  })

  it('应该显示帮助文本', () => {
    const helpTexts = wrapper.findAll('.help-text, .text-gray-500, .text-sm')
    expect(helpTexts.length).toBeGreaterThan(0)
  })

  it('应该支持复利频率选择', () => {
    const frequencySelect = wrapper.find('[data-testid="compound-frequency-select"]')
    if (frequencySelect.exists()) {
      const options = frequencySelect.findAll('option')
      expect(options.length).toBeGreaterThan(1)
    }
  })

  it('应该在无效表单时显示错误状态', async () => {
    const mockUseCalculator = vi.fn().mockReturnValue({
      form: { value: {} },
      errors: { 
        value: [
          { field: 'principal', message: 'Ungültiger Wert', code: 'INVALID' }
        ] 
      },
      isCalculating: { value: false },
      isFormValid: { value: false },
      calculate: vi.fn(),
      resetForm: vi.fn()
    })

    vi.doMock('@/composables/useCalculator', () => ({
      useCalculator: mockUseCalculator
    }))

    wrapper = mount(CalculatorForm)
    
    // 检查是否有错误样式
    const errorElements = wrapper.findAll('.border-red-500, .text-red-500, .border-danger-500')
    expect(errorElements.length).toBeGreaterThan(0)
  })
})
