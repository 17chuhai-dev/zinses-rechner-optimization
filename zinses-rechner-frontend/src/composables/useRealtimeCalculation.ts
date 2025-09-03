/**
 * 实时计算反馈组合函数
 * 提供用户输入时的即时计算结果显示
 */

import { ref, computed, watch, nextTick } from 'vue'
import { debounce } from 'lodash-es'
// import { calculatorRegistry } from '@/core/CalculatorRegistry' // 改为异步导入
import type { BaseCalculator, CalculationResult } from '@/types/calculator'

interface RealtimeCalculationState {
  isCalculating: boolean
  results: CalculationResult | null
  error: string | null
  lastCalculated: Date | null
  calculationCount: number
}

interface RealtimeCalculationOptions {
  debounceMs?: number
  enablePreview?: boolean
  showProgress?: boolean
  cacheResults?: boolean
  maxCacheSize?: number
}

export function useRealtimeCalculation(
  calculatorId: string,
  options: RealtimeCalculationOptions = {}
) {
  const {
    debounceMs = 500,
    enablePreview = true,
    showProgress = true,
    cacheResults = true,
    maxCacheSize = 50
  } = options

  // 状态管理
  const state = ref<RealtimeCalculationState>({
    isCalculating: false,
    results: null,
    error: null,
    lastCalculated: null,
    calculationCount: 0
  })

  // 表单数据
  const formData = ref<Record<string, any>>({})

  // 预览结果（简化版）
  const previewResults = ref<Partial<CalculationResult> | null>(null)

  // 结果缓存
  const resultCache = ref<Map<string, CalculationResult>>(new Map())

  // 计算器实例 - 异步获取
  const calculator = ref<BaseCalculator | null>(null)

  // 异步初始化计算器
  const initCalculator = async () => {
    try {
      const { calculatorRegistry } = await import('@/core/CalculatorRegistry')
      calculator.value = calculatorRegistry.getCalculator(calculatorId)
    } catch (error) {
      console.error('Failed to load calculator:', error)
    }
  }

  // 立即初始化
  initCalculator()

  // 表单验证状态
  const isFormValid = computed(() => {
    if (!calculator.value) return false

    const validation = calculator.value.validate(formData.value)
    return validation.isValid
  })

  // 是否有足够数据进行预览计算
  const canPreview = computed(() => {
    if (!calculator.value || !enablePreview) return false

    // 检查必填字段
    const requiredFields = calculator.value.formSchema.fields
      .filter(field => field.required)
      .map(field => field.key)

    return requiredFields.every(key => {
      const value = formData.value[key]
      return value !== undefined && value !== null && value !== ''
    })
  })

  // 生成缓存键
  const generateCacheKey = (data: Record<string, any>): string => {
    const sortedKeys = Object.keys(data).sort()
    const keyValuePairs = sortedKeys.map(key => `${key}:${data[key]}`)
    return keyValuePairs.join('|')
  }

  // 快速预览计算（简化版）
  const calculatePreview = async (data: Record<string, any>) => {
    if (!calculator.value || !canPreview.value) return

    try {
      // 简化的预览计算，只计算关键指标
      if (calculatorId === 'compound-interest') {
        const principal = parseFloat(data.principal) || 0
        const monthlyPayment = parseFloat(data.monthlyPayment) || 0
        const annualRate = parseFloat(data.annualRate) || 0
        const years = parseInt(data.years) || 0

        if (principal > 0 && annualRate > 0 && years > 0) {
          // 简化的复利计算
          const monthlyRate = annualRate / 100 / 12
          const totalMonths = years * 12

          // 本金复利
          const principalGrowth = principal * Math.pow(1 + monthlyRate, totalMonths)

          // 月供复利（年金现值公式）
          const monthlyGrowth = monthlyPayment > 0
            ? monthlyPayment * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
            : 0

          const finalAmount = principalGrowth + monthlyGrowth
          const totalContributions = principal + (monthlyPayment * totalMonths)
          const totalInterest = finalAmount - totalContributions

          previewResults.value = {
            finalAmount,
            totalInterest,
            totalContributions,
            effectiveRate: annualRate
          }
        }
      }
    } catch (error) {
      console.warn('预览计算失败:', error)
      previewResults.value = null
    }
  }

  // 完整计算
  const calculateFull = async (data: Record<string, any>) => {
    if (!calculator.value) {
      state.value.error = 'Calculator not found'
      return
    }

    state.value.isCalculating = true
    state.value.error = null

    try {
      // 检查缓存
      const cacheKey = generateCacheKey(data)
      if (cacheResults && resultCache.value.has(cacheKey)) {
        state.value.results = resultCache.value.get(cacheKey)!
        state.value.lastCalculated = new Date()
        return
      }

      // 执行计算
      const results = await calculator.value.calculate(data)

      // 更新状态
      state.value.results = results
      state.value.lastCalculated = new Date()
      state.value.calculationCount++

      // 缓存结果
      if (cacheResults) {
        // 限制缓存大小
        if (resultCache.value.size >= maxCacheSize) {
          const firstKey = resultCache.value.keys().next().value
          resultCache.value.delete(firstKey)
        }
        resultCache.value.set(cacheKey, results)
      }

      // 清除预览结果
      previewResults.value = null

    } catch (error) {
      console.error('计算错误:', error)
      state.value.error = error instanceof Error ? error.message : '计算失败'
      state.value.results = null
    } finally {
      state.value.isCalculating = false
    }
  }

  // 防抖的预览计算
  const debouncedPreviewCalculation = debounce(calculatePreview, debounceMs / 2)

  // 防抖的完整计算
  const debouncedFullCalculation = debounce(calculateFull, debounceMs)

  // 监听表单数据变化
  watch(
    formData,
    async (newData) => {
      if (!calculator.value) return

      // 清除之前的错误
      state.value.error = null

      // 如果启用预览且数据足够，进行预览计算
      if (enablePreview && canPreview.value) {
        debouncedPreviewCalculation(newData)
      }

      // 如果表单有效，进行完整计算
      if (isFormValid.value) {
        debouncedFullCalculation(newData)
      } else {
        // 表单无效时清除结果
        state.value.results = null
        previewResults.value = null
      }
    },
    { deep: true, immediate: false }
  )

  // 手动触发计算
  const triggerCalculation = async (force = false) => {
    if (!calculator.value) return

    if (force || isFormValid.value) {
      await calculateFull(formData.value)
    }
  }

  // 清除结果
  const clearResults = () => {
    state.value.results = null
    previewResults.value = null
    state.value.error = null
  }

  // 重置状态
  const reset = () => {
    clearResults()
    state.value.calculationCount = 0
    state.value.lastCalculated = null
    resultCache.value.clear()
  }

  // 更新表单字段
  const updateField = (key: string, value: any) => {
    formData.value[key] = value
  }

  // 批量更新表单数据
  const updateFormData = (data: Record<string, any>) => {
    Object.assign(formData.value, data)
  }

  // 获取计算进度（模拟）
  const calculationProgress = computed(() => {
    if (!state.value.isCalculating) return 0

    // 简单的进度模拟
    const elapsed = Date.now() - (state.value.lastCalculated?.getTime() || Date.now())
    return Math.min(elapsed / debounceMs * 100, 90)
  })

  // 获取显示结果（优先显示完整结果，其次预览结果）
  const displayResults = computed(() => {
    return state.value.results || previewResults.value
  })

  // 是否显示预览标识
  const isPreviewMode = computed(() => {
    return !state.value.results && previewResults.value !== null
  })

  // 计算性能统计
  const performanceStats = computed(() => {
    return {
      totalCalculations: state.value.calculationCount,
      cacheHitRate: resultCache.value.size > 0 ?
        (state.value.calculationCount - resultCache.value.size) / state.value.calculationCount : 0,
      lastCalculated: state.value.lastCalculated,
      cacheSize: resultCache.value.size
    }
  })

  return {
    // 状态
    state: readonly(state),
    formData,
    displayResults,
    previewResults: readonly(previewResults),

    // 计算属性
    isFormValid,
    canPreview,
    isPreviewMode,
    calculationProgress,
    performanceStats,

    // 方法
    updateField,
    updateFormData,
    triggerCalculation,
    clearResults,
    reset,

    // 工具方法
    generateCacheKey
  }
}

// 实时计算结果显示组合函数
export function useRealtimeResultsDisplay() {
  const showAnimation = ref(false)
  const previousResults = ref<CalculationResult | null>(null)

  // 结果变化动画
  const animateResultChange = async (newResults: CalculationResult | null) => {
    if (!newResults || !previousResults.value) {
      previousResults.value = newResults
      return
    }

    showAnimation.value = true
    await nextTick()

    setTimeout(() => {
      showAnimation.value = false
      previousResults.value = newResults
    }, 300)
  }

  // 计算结果差异
  const resultsDiff = computed(() => {
    if (!previousResults.value || !displayResults.value) return null

    const current = displayResults.value as CalculationResult
    const previous = previousResults.value

    return {
      finalAmountDiff: (current.finalAmount || 0) - (previous.finalAmount || 0),
      totalInterestDiff: (current.totalInterest || 0) - (previous.totalInterest || 0),
      effectiveRateDiff: (current.effectiveRate || 0) - (previous.effectiveRate || 0)
    }
  })

  return {
    showAnimation: readonly(showAnimation),
    previousResults: readonly(previousResults),
    resultsDiff,
    animateResultChange
  }
}
