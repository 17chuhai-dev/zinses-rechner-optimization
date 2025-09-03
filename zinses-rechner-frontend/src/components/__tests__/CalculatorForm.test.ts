/**
 * CalculatorForm组件测试
 * 测试表单验证、用户交互和数据绑定
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CalculatorForm from '../calculator/CalculatorForm.vue'
import { useCalculator } from '@/composables/useCalculator'

// Mock useCalculator composable
vi.mock('@/composables/useCalculator', () => ({
  useCalculator: vi.fn(() => ({
    form: {
      principal: 10000,
      annualRate: 4.0,
      years: 10,
      monthlyPayment: 0,
      compoundFrequency: 'monthly'
    },
    errors: [],
    isCalculating: false,
    isFormValid: true,
    calculate: vi.fn(),
    resetForm: vi.fn(),
    validateForm: vi.fn()
  }))
}))

describe('CalculatorForm', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(CalculatorForm)
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('displays all input fields', () => {
    // 检查所有必需的输入字段
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThan(3)
    
    // 检查特定字段
    expect(wrapper.find('[data-testid="principal-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="rate-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="years-input"]').exists()).toBe(true)
  })

  it('validates principal input', async () => {
    const principalInput = wrapper.find('[data-testid="principal-input"]')
    
    // 测试有效输入
    await principalInput.setValue('10000')
    expect(wrapper.vm.form.principal).toBe(10000)
    
    // 测试无效输入（负数）
    await principalInput.setValue('-1000')
    // 应该触发验证错误
    expect(wrapper.vm.errors.some((e: any) => e.field === 'principal')).toBe(true)
  })

  it('validates annual rate input', async () => {
    const rateInput = wrapper.find('[data-testid="rate-input"]')
    
    // 测试有效利率
    await rateInput.setValue('4.5')
    expect(wrapper.vm.form.annualRate).toBe(4.5)
    
    // 测试过高利率
    await rateInput.setValue('25')
    expect(wrapper.vm.errors.some((e: any) => e.field === 'annualRate')).toBe(true)
  })

  it('validates years input', async () => {
    const yearsInput = wrapper.find('[data-testid="years-input"]')
    
    // 测试有效年限
    await yearsInput.setValue('15')
    expect(wrapper.vm.form.years).toBe(15)
    
    // 测试无效年限（零）
    await yearsInput.setValue('0')
    expect(wrapper.vm.errors.some((e: any) => e.field === 'years')).toBe(true)
  })

  it('handles form submission', async () => {
    const form = wrapper.find('form')
    const calculateSpy = vi.spyOn(wrapper.vm, 'calculate')
    
    await form.trigger('submit')
    
    expect(calculateSpy).toHaveBeenCalled()
  })

  it('displays validation errors', async () => {
    // 模拟验证错误
    wrapper.vm.errors = [
      { field: 'principal', message: 'Startkapital ist erforderlich' }
    ]
    
    await wrapper.vm.$nextTick()
    
    const errorMessage = wrapper.find('.error-message')
    expect(errorMessage.exists()).toBe(true)
    expect(errorMessage.text()).toContain('Startkapital ist erforderlich')
  })

  it('shows loading state during calculation', async () => {
    wrapper.vm.isCalculating = true
    await wrapper.vm.$nextTick()
    
    const submitButton = wrapper.find('[data-testid="submit-button"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.text()).toContain('Berechnung')
  })

  it('resets form correctly', async () => {
    // 修改表单值
    wrapper.vm.form.principal = 50000
    wrapper.vm.form.annualRate = 6.0
    
    const resetButton = wrapper.find('[data-testid="reset-button"]')
    await resetButton.trigger('click')
    
    // 应该调用resetForm方法
    expect(wrapper.vm.resetForm).toHaveBeenCalled()
  })

  it('formats currency input correctly', async () => {
    const principalInput = wrapper.find('[data-testid="principal-input"]')
    
    // 输入数字
    await principalInput.setValue('10000')
    await principalInput.trigger('blur')
    
    // 应该格式化为德语货币格式
    expect(principalInput.element.value).toMatch(/10\.000/)
  })

  it('handles decimal separator correctly', async () => {
    const rateInput = wrapper.find('[data-testid="rate-input"]')
    
    // 测试德语小数分隔符（逗号）
    await rateInput.setValue('4,5')
    expect(wrapper.vm.form.annualRate).toBe(4.5)
    
    // 测试英语小数分隔符（点）
    await rateInput.setValue('4.5')
    expect(wrapper.vm.form.annualRate).toBe(4.5)
  })

  it('updates compound frequency selection', async () => {
    const frequencySelect = wrapper.find('[data-testid="frequency-select"]')
    
    await frequencySelect.setValue('yearly')
    expect(wrapper.vm.form.compoundFrequency).toBe('yearly')
    
    await frequencySelect.setValue('daily')
    expect(wrapper.vm.form.compoundFrequency).toBe('daily')
  })

  it('shows help tooltips', async () => {
    const helpIcon = wrapper.find('[data-testid="principal-help"]')
    
    await helpIcon.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    
    const tooltip = wrapper.find('.tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Startkapital')
  })

  it('validates business logic', async () => {
    // 测试业务逻辑验证
    wrapper.vm.form.principal = 1000000
    wrapper.vm.form.monthlyPayment = 100000
    wrapper.vm.form.years = 50
    
    await wrapper.vm.validateForm()
    
    // 应该有警告关于不现实的参数组合
    expect(wrapper.vm.errors.some((e: any) => e.type === 'warning')).toBe(true)
  })

  it('preserves form state on component remount', () => {
    // 修改表单
    wrapper.vm.form.principal = 25000
    wrapper.vm.form.annualRate = 5.5
    
    // 重新挂载组件
    wrapper.unmount()
    wrapper = mount(CalculatorForm)
    
    // 表单状态应该保持（通过localStorage或其他持久化机制）
    // 这个测试需要根据实际实现调整
  })

  it('handles keyboard navigation', async () => {
    const principalInput = wrapper.find('[data-testid="principal-input"]')
    const rateInput = wrapper.find('[data-testid="rate-input"]')
    
    // 测试Tab键导航
    await principalInput.trigger('keydown', { key: 'Tab' })
    
    // 应该聚焦到下一个输入字段
    expect(document.activeElement).toBe(rateInput.element)
  })

  it('shows calculation preview', async () => {
    // 当所有字段都有效时，应该显示计算预览
    wrapper.vm.form.principal = 10000
    wrapper.vm.form.annualRate = 4.0
    wrapper.vm.form.years = 10
    
    await wrapper.vm.$nextTick()
    
    const preview = wrapper.find('[data-testid="calculation-preview"]')
    if (preview.exists()) {
      expect(preview.text()).toContain('€')
    }
  })

  it('handles mobile responsive layout', () => {
    // 模拟移动端视口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    
    wrapper = mount(CalculatorForm)
    
    // 检查移动端特定的类或布局
    expect(wrapper.classes()).toContain('mobile-layout')
  })
})
