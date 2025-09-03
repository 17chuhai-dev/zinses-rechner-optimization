/**
 * 复利计算器组件单元测试
 * 测试用户交互、计算逻辑、数据展示
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CompoundInterestCalculator from '../calculators/CompoundInterestCalculator.vue'
import { createI18n } from 'vue-i18n'

// 创建测试用的i18n实例
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      calculator: {
        compoundInterest: 'Zinseszins Rechner',
        principal: 'Anfangskapital',
        rate: 'Zinssatz',
        time: 'Laufzeit',
        frequency: 'Zinszahlungsfrequenz',
        calculate: 'Berechnen',
        result: 'Ergebnis',
        finalAmount: 'Endkapital',
        totalInterest: 'Gesamtzinsen',
        effectiveRate: 'Effektiver Zinssatz'
      },
      common: {
        years: 'Jahre',
        percent: 'Prozent',
        currency: 'Euro'
      },
      validation: {
        required: 'Dieses Feld ist erforderlich',
        positive: 'Der Wert muss positiv sein',
        max: 'Der Wert ist zu groß'
      }
    }
  }
})

describe('CompoundInterestCalculator', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(CompoundInterestCalculator, {
      global: {
        plugins: [i18n]
      }
    })
  })

  describe('组件渲染', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('h2').text()).toContain('Zinseszins')
    })

    it('应该显示所有输入字段', () => {
      expect(wrapper.find('[data-testid="principal-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="rate-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="time-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="frequency-select"]').exists()).toBe(true)
    })

    it('应该显示计算按钮', () => {
      const calculateButton = wrapper.find('[data-testid="calculate-button"]')
      expect(calculateButton.exists()).toBe(true)
      expect(calculateButton.text()).toContain('Berechnen')
    })

    it('应该初始时隐藏结果区域', () => {
      expect(wrapper.find('[data-testid="results-section"]').exists()).toBe(false)
    })
  })

  describe('用户输入', () => {
    it('应该接受有效的数值输入', async () => {
      const principalInput = wrapper.find('[data-testid="principal-input"]')
      
      await principalInput.setValue('10000')
      expect(principalInput.element.value).toBe('10000')
    })

    it('应该格式化货币输入', async () => {
      const principalInput = wrapper.find('[data-testid="principal-input"]')
      
      await principalInput.setValue('10000')
      await principalInput.trigger('blur')
      
      // 应该格式化为德国货币格式
      expect(wrapper.vm.formattedPrincipal).toBe('10.000,00 €')
    })

    it('应该限制利率输入范围', async () => {
      const rateInput = wrapper.find('[data-testid="rate-input"]')
      
      await rateInput.setValue('150') // 超过最大值
      await rateInput.trigger('blur')
      
      expect(wrapper.vm.validationErrors.rate).toContain('Der Wert ist zu groß')
    })

    it('应该验证必填字段', async () => {
      const principalInput = wrapper.find('[data-testid="principal-input"]')
      
      await principalInput.setValue('')
      await principalInput.trigger('blur')
      
      expect(wrapper.vm.validationErrors.principal).toContain('erforderlich')
    })
  })

  describe('计算功能', () => {
    beforeEach(async () => {
      // 设置有效的输入值
      await wrapper.find('[data-testid="principal-input"]').setValue('10000')
      await wrapper.find('[data-testid="rate-input"]').setValue('5')
      await wrapper.find('[data-testid="time-input"]').setValue('10')
    })

    it('应该执行复利计算', async () => {
      const calculateButton = wrapper.find('[data-testid="calculate-button"]')
      
      await calculateButton.trigger('click')
      await nextTick()
      
      expect(wrapper.vm.calculationResult).toBeDefined()
      expect(wrapper.vm.calculationResult.finalAmount).toBeCloseTo(16288.95, 2)
    })

    it('应该显示计算结果', async () => {
      await wrapper.find('[data-testid="calculate-button"]').trigger('click')
      await nextTick()
      
      const resultsSection = wrapper.find('[data-testid="results-section"]')
      expect(resultsSection.exists()).toBe(true)
      
      const finalAmount = wrapper.find('[data-testid="final-amount"]')
      expect(finalAmount.text()).toContain('16.288,95')
    })

    it('应该计算总利息', async () => {
      await wrapper.find('[data-testid="calculate-button"]').trigger('click')
      await nextTick()
      
      const totalInterest = wrapper.find('[data-testid="total-interest"]')
      expect(totalInterest.text()).toContain('6.288,95')
    })

    it('应该计算有效利率', async () => {
      await wrapper.find('[data-testid="calculate-button"]').trigger('click')
      await nextTick()
      
      expect(wrapper.vm.calculationResult.effectiveRate).toBeCloseTo(5, 2)
    })

    it('应该处理不同的复利频率', async () => {
      // 设置月复利
      await wrapper.find('[data-testid="frequency-select"]').setValue('12')
      await wrapper.find('[data-testid="calculate-button"]').trigger('click')
      await nextTick()
      
      // 月复利应该产生更高的最终金额
      expect(wrapper.vm.calculationResult.finalAmount).toBeGreaterThan(16288.95)
    })
  })

  describe('数据可视化', () => {
    beforeEach(async () => {
      await wrapper.find('[data-testid="principal-input"]').setValue('10000')
      await wrapper.find('[data-testid="rate-input"]').setValue('5')
      await wrapper.find('[data-testid="time-input"]').setValue('10')
      await wrapper.find('[data-testid="calculate-button"]').trigger('click')
      await nextTick()
    })

    it('应该显示图表组件', () => {
      const chartComponent = wrapper.find('[data-testid="compound-interest-chart"]')
      expect(chartComponent.exists()).toBe(true)
    })

    it('应该生成年度明细表', () => {
      const yearlyTable = wrapper.find('[data-testid="yearly-breakdown-table"]')
      expect(yearlyTable.exists()).toBe(true)
      
      const rows = yearlyTable.findAll('tbody tr')
      expect(rows).toHaveLength(10) // 10年的数据
    })

    it('应该显示正确的年度数据', () => {
      const firstRow = wrapper.find('[data-testid="year-1-row"]')
      expect(firstRow.exists()).toBe(true)
      
      const endingBalance = firstRow.find('[data-testid="ending-balance"]')
      expect(endingBalance.text()).toContain('10.500,00')
    })
  })

  describe('导出功能', () => {
    beforeEach(async () => {
      await wrapper.find('[data-testid="principal-input"]').setValue('10000')
      await wrapper.find('[data-testid="rate-input"]').setValue('5')
      await wrapper.find('[data-testid="time-input"]').setValue('10')
      await wrapper.find('[data-testid="calculate-button"]').trigger('click')
      await nextTick()
    })

    it('应该显示导出按钮', () => {
      const exportButton = wrapper.find('[data-testid="export-button"]')
      expect(exportButton.exists()).toBe(true)
    })

    it('应该支持PDF导出', async () => {
      const exportPdfSpy = vi.spyOn(wrapper.vm, 'exportToPDF')
      
      const exportButton = wrapper.find('[data-testid="export-pdf"]')
      await exportButton.trigger('click')
      
      expect(exportPdfSpy).toHaveBeenCalled()
    })

    it('应该支持Excel导出', async () => {
      const exportExcelSpy = vi.spyOn(wrapper.vm, 'exportToExcel')
      
      const exportButton = wrapper.find('[data-testid="export-excel"]')
      await exportButton.trigger('click')
      
      expect(exportExcelSpy).toHaveBeenCalled()
    })
  })

  describe('实时数据集成', () => {
    it('应该显示当前利率信息', () => {
      const currentRateInfo = wrapper.find('[data-testid="current-rate-info"]')
      expect(currentRateInfo.exists()).toBe(true)
    })

    it('应该允许使用实时利率', async () => {
      const useCurrentRateButton = wrapper.find('[data-testid="use-current-rate"]')
      
      await useCurrentRateButton.trigger('click')
      
      const rateInput = wrapper.find('[data-testid="rate-input"]')
      expect(parseFloat(rateInput.element.value)).toBeGreaterThan(0)
    })
  })

  describe('响应式设计', () => {
    it('应该在移动设备上正确显示', async () => {
      // 模拟移动设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      window.dispatchEvent(new Event('resize'))
      await nextTick()
      
      expect(wrapper.classes()).toContain('mobile-layout')
    })

    it('应该在平板设备上调整布局', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      window.dispatchEvent(new Event('resize'))
      await nextTick()
      
      expect(wrapper.classes()).toContain('tablet-layout')
    })
  })

  describe('无障碍支持', () => {
    it('应该有正确的ARIA标签', () => {
      const form = wrapper.find('form')
      expect(form.attributes('aria-label')).toBeDefined()
      
      const inputs = wrapper.findAll('input')
      inputs.forEach(input => {
        expect(input.attributes('aria-label') || input.attributes('aria-labelledby')).toBeDefined()
      })
    })

    it('应该支持键盘导航', async () => {
      const principalInput = wrapper.find('[data-testid="principal-input"]')
      
      await principalInput.trigger('keydown', { key: 'Tab' })
      
      const rateInput = wrapper.find('[data-testid="rate-input"]')
      expect(document.activeElement).toBe(rateInput.element)
    })

    it('应该提供屏幕阅读器支持', () => {
      const resultsSection = wrapper.find('[data-testid="results-section"]')
      expect(resultsSection.attributes('aria-live')).toBe('polite')
    })
  })

  describe('错误处理', () => {
    it('应该显示计算错误', async () => {
      // 模拟计算错误
      vi.spyOn(wrapper.vm, 'calculateCompoundInterest').mockImplementation(() => {
        throw new Error('Calculation Error')
      })
      
      await wrapper.find('[data-testid="calculate-button"]').trigger('click')
      await nextTick()
      
      const errorMessage = wrapper.find('[data-testid="error-message"]')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('Fehler')
    })

    it('应该处理网络错误', async () => {
      // 模拟网络错误
      vi.spyOn(wrapper.vm, 'fetchCurrentRates').mockRejectedValue(new Error('Network Error'))
      
      await wrapper.vm.loadCurrentRates()
      await nextTick()
      
      expect(wrapper.vm.networkError).toBe(true)
    })
  })

  describe('性能优化', () => {
    it('应该防抖计算请求', async () => {
      const calculateSpy = vi.spyOn(wrapper.vm, 'calculateCompoundInterest')
      
      // 快速连续输入
      const principalInput = wrapper.find('[data-testid="principal-input"]')
      await principalInput.setValue('1000')
      await principalInput.setValue('2000')
      await principalInput.setValue('3000')
      
      // 等待防抖延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      expect(calculateSpy).toHaveBeenCalledTimes(1)
    })

    it('应该缓存计算结果', async () => {
      const calculateSpy = vi.spyOn(wrapper.vm, 'performCalculation')
      
      // 执行相同的计算两次
      await wrapper.find('[data-testid="calculate-button"]').trigger('click')
      await wrapper.find('[data-testid="calculate-button"]').trigger('click')
      
      expect(calculateSpy).toHaveBeenCalledTimes(1)
    })
  })
})
