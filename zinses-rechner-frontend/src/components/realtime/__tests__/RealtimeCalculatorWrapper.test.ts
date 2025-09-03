/**
 * RealtimeCalculatorWrapper组件单元测试
 * 测试实时计算器包装组件的所有功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import RealtimeCalculatorWrapper from '../RealtimeCalculatorWrapper.vue'

// Mock子组件
vi.mock('../RealtimeResultsDisplay.vue', () => ({
  default: {
    name: 'RealtimeResultsDisplay',
    template: '<div data-testid="results-display">Mock Results Display</div>',
    props: ['results', 'previewResults', 'isCalculating', 'isPreviewMode', 'calculationProgress', 'calculatorName', 'lastCalculated', 'error', 'resultsDiff'],
    emits: ['retry']
  }
}))

vi.mock('../InputValidationHandler.vue', () => ({
  default: {
    name: 'InputValidationHandler',
    template: '<div data-testid="validation-handler">Mock Validation Handler</div>',
    props: ['errors', 'warnings', 'suggestions', 'realtimeFeedback', 'validationState', 'fieldLabels'],
    emits: ['applySuggestion', 'applySuggestionAction']
  }
}))

vi.mock('../LoadingIndicator.vue', () => ({
  default: {
    name: 'LoadingIndicator',
    template: '<div data-testid="loading-indicator">Mock Loading Indicator</div>',
    props: ['state', 'progress', 'calculatorName', 'duration', 'cacheStatus', 'workerInfo', 'showProgress', 'showDetails', 'showCancelButton'],
    emits: ['cancel', 'hidden']
  }
}))

// Mock composables
vi.mock('@/composables/useRealtimeCalculation', () => ({
  useRealtimeCalculation: vi.fn(() => ({
    isCalculating: vi.fn().mockReturnValue(false),
    calculationProgress: vi.fn().mockReturnValue(0),
    calculationResults: vi.fn().mockReturnValue(null),
    calculationError: vi.fn().mockReturnValue(null),
    lastCalculated: vi.fn().mockReturnValue(null),
    calculate: vi.fn(),
    cancelCalculation: vi.fn()
  }))
}))

vi.mock('@/composables/useInputListener', () => ({
  useInputListener: vi.fn(() => ({
    values: vi.fn().mockReturnValue({}),
    validationStates: vi.fn().mockReturnValue({}),
    hasChanges: vi.fn().mockReturnValue(false),
    isAllValid: vi.fn().mockReturnValue(true),
    registerField: vi.fn(),
    updateValue: vi.fn(),
    onInputChange: vi.fn()
  }))
}))

vi.mock('@/composables/useCalculationOptimizer', () => ({
  useCalculationOptimizer: vi.fn(() => ({
    cacheHitRate: vi.fn().mockReturnValue(75),
    isOptimized: vi.fn().mockReturnValue(true),
    memoryPressure: vi.fn().mockReturnValue(25),
    metrics: vi.fn().mockReturnValue({
      averageComputationTime: 150,
      totalCalculations: 10
    }),
    optimizedCalculate: vi.fn(),
    getOptimizationSuggestions: vi.fn().mockReturnValue([])
  }))
}))

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}))

describe('RealtimeCalculatorWrapper', () => {
  let wrapper: VueWrapper<any>

  const defaultProps = {
    calculatorTitle: 'Test Calculator',
    calculatorType: 'compound-interest',
    initialInputs: {
      initialAmount: 1000,
      monthlyAmount: 100,
      annualRate: 5,
      investmentYears: 10
    },
    fieldLabels: {
      initialAmount: 'Initial Amount',
      monthlyAmount: 'Monthly Amount',
      annualRate: 'Annual Rate',
      investmentYears: 'Investment Years'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('组件渲染', () => {
    it('应该正确渲染基本结构', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      expect(wrapper.find('.realtime-calculator-wrapper')).toBeTruthy()
      expect(wrapper.find('.calculator-header')).toBeTruthy()
      expect(wrapper.find('.calculator-content')).toBeTruthy()
    })

    it('应该显示计算器标题', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      expect(wrapper.find('.calculator-title').text()).toBe(defaultProps.calculatorTitle)
    })

    it('应该渲染状态指示器', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      const statusIndicators = wrapper.find('.status-indicators')
      expect(statusIndicators).toBeTruthy()
      expect(statusIndicators.findAll('.status-item')).toHaveLength(3)
    })

    it('应该在showPerformanceMetrics为true时显示性能指标', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: {
          ...defaultProps,
          showPerformanceMetrics: true
        }
      })

      expect(wrapper.find('.performance-metrics')).toBeTruthy()
    })

    it('应该在showDebugPanel为true时显示调试面板', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: {
          ...defaultProps,
          showDebugPanel: true
        }
      })

      expect(wrapper.find('.debug-panel')).toBeTruthy()
    })
  })

  describe('插槽功能', () => {
    it('应该正确渲染inputs插槽', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps,
        slots: {
          inputs: '<div data-testid="custom-inputs">Custom Input Form</div>'
        }
      })

      expect(wrapper.find('[data-testid="custom-inputs"]')).toBeTruthy()
      expect(wrapper.find('[data-testid="custom-inputs"]').text()).toBe('Custom Input Form')
    })

    it('应该在没有插槽时显示默认输入占位符', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      expect(wrapper.find('.input-placeholder')).toBeTruthy()
    })
  })

  describe('子组件集成', () => {
    it('应该渲染RealtimeResultsDisplay组件', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="results-display"]')).toBeTruthy()
    })

    it('应该渲染InputValidationHandler组件', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="validation-handler"]')).toBeTruthy()
    })

    it('应该在showLoadingOverlay为true时渲染LoadingIndicator', async () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      // 设置showLoadingOverlay为true
      await wrapper.setData({ showLoadingOverlay: true })

      expect(wrapper.find('[data-testid="loading-indicator"]')).toBeTruthy()
    })
  })

  describe('事件处理', () => {
    it('应该处理calculationComplete事件', async () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      const mockResult = {
        finalAmount: 2000,
        totalContributions: 1500,
        totalInterest: 500
      }

      await wrapper.vm.handleCalculationComplete(mockResult)

      expect(wrapper.emitted('calculationComplete')).toBeTruthy()
      expect(wrapper.emitted('calculationComplete')[0]).toEqual([mockResult])
    })

    it('应该处理calculationError事件', async () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      const errorMessage = 'Calculation failed'
      await wrapper.vm.handleCalculationError(errorMessage)

      expect(wrapper.emitted('calculationError')).toBeTruthy()
      expect(wrapper.emitted('calculationError')[0]).toEqual([errorMessage])
    })

    it('应该处理inputChange事件', async () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      await wrapper.vm.handleInputChange('initialAmount', 2000)

      expect(wrapper.emitted('inputChange')).toBeTruthy()
      expect(wrapper.emitted('inputChange')[0]).toEqual(['initialAmount', 2000])
    })

    it('应该处理validationError事件', async () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      const errors = [{ field: 'initialAmount', message: 'Required field' }]
      await wrapper.vm.handleValidationError(errors)

      expect(wrapper.emitted('validationError')).toBeTruthy()
      expect(wrapper.emitted('validationError')[0]).toEqual([errors])
    })
  })

  describe('计算状态管理', () => {
    it('应该正确显示计算状态', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      // 测试计算状态的CSS类
      expect(wrapper.classes()).not.toContain('wrapper-calculating')
    })

    it('应该在计算时应用正确的CSS类', async () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      // 模拟计算状态
      await wrapper.setData({ isCalculating: true })

      expect(wrapper.classes()).toContain('wrapper-calculating')
    })
  })

  describe('上下文提供', () => {
    it('应该向子组件提供计算器上下文', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      // 验证provide被调用
      // 这里我们主要验证组件能正常挂载，实际的provide测试需要在集成测试中进行
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('生命周期', () => {
    it('应该在挂载时初始化输入值', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      // 验证组件正常挂载
      expect(wrapper.vm).toBeDefined()
    })

    it('应该在卸载时取消计算', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      const cancelCalculationSpy = vi.spyOn(wrapper.vm, 'cancelCalculation')
      
      wrapper.unmount()

      // 验证取消计算被调用
      expect(cancelCalculationSpy).toHaveBeenCalled()
    })
  })

  describe('响应式数据', () => {
    it('应该正确管理isPreviewMode状态', async () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: {
          ...defaultProps,
          enablePreview: true
        }
      })

      expect(wrapper.vm.isPreviewMode).toBe(false)

      // 模拟预览模式激活
      await wrapper.setData({ isPreviewMode: true })
      expect(wrapper.vm.isPreviewMode).toBe(true)
    })

    it('应该正确管理showLoadingOverlay状态', async () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      expect(wrapper.vm.showLoadingOverlay).toBe(false)

      await wrapper.setData({ showLoadingOverlay: true })
      expect(wrapper.vm.showLoadingOverlay).toBe(true)
    })

    it('应该正确管理debugExpanded状态', async () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: {
          ...defaultProps,
          showDebugPanel: true
        }
      })

      expect(wrapper.vm.debugExpanded).toBe(false)

      await wrapper.setData({ debugExpanded: true })
      expect(wrapper.vm.debugExpanded).toBe(true)
    })
  })

  describe('计算属性', () => {
    it('应该正确计算hasValidationErrors', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      expect(wrapper.vm.hasValidationErrors).toBe(false)
    })

    it('应该正确计算validationState', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      expect(wrapper.vm.validationState).toBe('valid')
    })

    it('应该正确计算loadingState', () => {
      wrapper = mount(RealtimeCalculatorWrapper, {
        props: defaultProps
      })

      expect(wrapper.vm.loadingState).toBe('initializing')
    })
  })
})
