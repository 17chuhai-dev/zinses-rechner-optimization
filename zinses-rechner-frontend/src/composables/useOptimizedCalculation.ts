/**
 * 性能优化的计算Composable
 * 集成缓存、增量计算、任务调度等性能优化功能
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { debounce } from 'lodash-es'
import { IncrementalCalculator, type CalculationInput, type CalculationResult } from '@/utils/performance/IncrementalCalculator'
import { CalculationScheduler, TaskPriority } from '@/utils/performance/CalculationScheduler'
import { CalculationCache } from '@/utils/performance/CalculationCache'

// 计算配置接口
export interface OptimizedCalculationConfig {
  enableCache: boolean
  enableIncremental: boolean
  enableScheduling: boolean
  debounceMs: number
  priority: TaskPriority
  maxRetries: number
  timeout: number
  preloadCommonScenarios: boolean
}

// 性能指标接口
export interface PerformanceMetrics {
  calculationTime: number
  cacheHitRate: number
  incrementalUpdates: number
  totalCalculations: number
  averageResponseTime: number
  queueLength: number
  memoryUsage: number
}

/**
 * 性能优化的计算Composable
 */
export function useOptimizedCalculation(config: Partial<OptimizedCalculationConfig> = {}) {
  // 默认配置
  const defaultConfig: OptimizedCalculationConfig = {
    enableCache: true,
    enableIncremental: true,
    enableScheduling: true,
    debounceMs: 300,
    priority: TaskPriority.NORMAL,
    maxRetries: 2,
    timeout: 10000,
    preloadCommonScenarios: false
  }

  const finalConfig = { ...defaultConfig, ...config }

  // 创建性能优化组件
  const cache = new CalculationCache()
  const incrementalCalculator = new IncrementalCalculator(cache)
  const scheduler = new CalculationScheduler({
    maxConcurrentTasks: 3,
    defaultTimeout: finalConfig.timeout,
    maxRetries: finalConfig.maxRetries
  })

  // 响应式状态
  const isCalculating = ref(false)
  const currentResult = ref<CalculationResult | null>(null)
  const error = ref<string | null>(null)
  const lastInput = ref<CalculationInput | null>(null)
  const calculationHistory = ref<CalculationResult[]>([])
  const performanceMetrics = ref<PerformanceMetrics>({
    calculationTime: 0,
    cacheHitRate: 0,
    incrementalUpdates: 0,
    totalCalculations: 0,
    averageResponseTime: 0,
    queueLength: 0,
    memoryUsage: 0
  })

  // 计算统计
  let totalCalculations = 0
  let incrementalUpdates = 0
  let totalResponseTime = 0

  /**
   * 执行优化计算
   */
  const calculate = async (input: CalculationInput, priority: TaskPriority = finalConfig.priority): Promise<CalculationResult | null> => {
    try {
      isCalculating.value = true
      error.value = null

      const startTime = performance.now()

      let result: CalculationResult

      if (finalConfig.enableScheduling) {
        // 使用任务调度器
        result = await scheduler.schedule(
          async (calcInput: CalculationInput) => {
            if (finalConfig.enableIncremental) {
              return await incrementalCalculator.calculate(calcInput)
            } else {
              // 直接计算（不使用增量计算）
              return await performDirectCalculation(calcInput)
            }
          },
          input,
          {
            priority,
            timeout: finalConfig.timeout,
            maxRetries: finalConfig.maxRetries,
            estimatedDuration: estimateCalculationTime(input)
          }
        )
      } else {
        // 直接使用增量计算器
        if (finalConfig.enableIncremental) {
          result = await incrementalCalculator.calculate(input)
        } else {
          result = await performDirectCalculation(input)
        }
      }

      // 更新状态
      currentResult.value = result
      lastInput.value = { ...input }
      
      // 添加到历史记录
      calculationHistory.value.push(result)
      if (calculationHistory.value.length > 50) {
        calculationHistory.value.shift()
      }

      // 更新性能指标
      const responseTime = performance.now() - startTime
      totalCalculations++
      totalResponseTime += responseTime
      
      if (result.metadata.incrementalUpdate) {
        incrementalUpdates++
      }

      updatePerformanceMetrics()

      return result

    } catch (err) {
      error.value = err instanceof Error ? err.message : '计算失败'
      console.error('计算错误:', err)
      return null
    } finally {
      isCalculating.value = false
    }
  }

  /**
   * 防抖计算
   */
  const debouncedCalculate = debounce(calculate, finalConfig.debounceMs)

  /**
   * 批量计算
   */
  const batchCalculate = async (inputs: CalculationInput[]): Promise<CalculationResult[]> => {
    const results: CalculationResult[] = []
    
    // 使用高优先级进行批量计算
    const promises = inputs.map(input => 
      calculate(input, TaskPriority.HIGH)
    )
    
    const batchResults = await Promise.allSettled(promises)
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value)
      }
    })
    
    return results
  }

  /**
   * 预加载常见场景
   */
  const preloadCommonScenarios = async (): Promise<void> => {
    if (!finalConfig.preloadCommonScenarios) return

    const commonScenarios: CalculationInput[] = [
      // 保守型投资
      { initialAmount: 10000, monthlyAmount: 500, annualRate: 3, investmentYears: 10 },
      { initialAmount: 5000, monthlyAmount: 300, annualRate: 3, investmentYears: 15 },
      
      // 中等风险投资
      { initialAmount: 10000, monthlyAmount: 500, annualRate: 6, investmentYears: 10 },
      { initialAmount: 20000, monthlyAmount: 800, annualRate: 6, investmentYears: 20 },
      
      // 积极型投资
      { initialAmount: 10000, monthlyAmount: 500, annualRate: 8, investmentYears: 10 },
      { initialAmount: 15000, monthlyAmount: 1000, annualRate: 8, investmentYears: 25 }
    ]

    // 使用后台优先级预加载
    await Promise.allSettled(
      commonScenarios.map(scenario => 
        calculate(scenario, TaskPriority.BACKGROUND)
      )
    )
  }

  /**
   * 清除缓存
   */
  const clearCache = (): void => {
    cache.clear()
    incrementalCalculator.clearCache()
    calculationHistory.value = []
    updatePerformanceMetrics()
  }

  /**
   * 获取缓存统计
   */
  const getCacheStats = () => {
    return cache.getStats()
  }

  /**
   * 获取调度器统计
   */
  const getSchedulerStats = () => {
    return scheduler.getStats()
  }

  /**
   * 优化内存使用
   */
  const optimizeMemory = (): void => {
    // 清理旧的历史记录
    if (calculationHistory.value.length > 20) {
      calculationHistory.value = calculationHistory.value.slice(-20)
    }

    // 触发缓存清理
    cache.invalidate(/^old_/)
    
    // 强制垃圾回收（如果可用）
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc()
    }
  }

  /**
   * 计算属性
   */
  const hasResult = computed(() => currentResult.value !== null)
  const hasError = computed(() => error.value !== null)
  const cacheHitRate = computed(() => {
    const stats = cache.getStats()
    return stats.hitRate
  })
  const queueLength = computed(() => {
    const stats = scheduler.getStats()
    return stats.queueLength
  })

  /**
   * 私有方法：直接计算
   */
  const performDirectCalculation = async (input: CalculationInput): Promise<CalculationResult> => {
    // 这里实现直接计算逻辑（不使用增量计算）
    const monthlyRate = input.annualRate / 100 / 12
    const totalMonths = input.investmentYears * 12
    
    let balance = input.initialAmount
    const yearlyBreakdown = []
    
    for (let year = 1; year <= input.investmentYears; year++) {
      const startBalance = balance
      
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + input.monthlyAmount
      }
      
      const contributions = input.monthlyAmount * 12
      const interest = balance - startBalance - contributions
      
      yearlyBreakdown.push({
        year,
        startAmount: startBalance,
        contributions,
        interest,
        endAmount: balance,
        growthRate: startBalance > 0 ? ((balance - startBalance) / startBalance) * 100 : 0
      })
    }

    const totalContributions = input.initialAmount + (input.monthlyAmount * totalMonths)
    const totalInterest = balance - totalContributions

    return {
      finalAmount: balance,
      totalContributions,
      totalInterest,
      effectiveRate: totalContributions > 0 ? (totalInterest / totalContributions) * 100 : 0,
      yearlyBreakdown,
      breakdown: {
        principal: input.initialAmount,
        monthlyContributions: input.monthlyAmount * totalMonths,
        compoundInterest: totalInterest,
        totalReturn: totalContributions > 0 ? ((balance / totalContributions) - 1) * 100 : 0
      },
      metadata: {
        calculationTime: 0,
        cacheHit: false,
        incrementalUpdate: false,
        affectedYears: []
      }
    }
  }

  /**
   * 私有方法：估算计算时间
   */
  const estimateCalculationTime = (input: CalculationInput): number => {
    // 基于投资年限估算计算时间（毫秒）
    const baseTime = 10 // 基础时间
    const yearMultiplier = 2 // 每年增加的时间
    return baseTime + (input.investmentYears * yearMultiplier)
  }

  /**
   * 私有方法：更新性能指标
   */
  const updatePerformanceMetrics = (): void => {
    const cacheStats = cache.getStats()
    const schedulerStats = scheduler.getStats()

    performanceMetrics.value = {
      calculationTime: totalCalculations > 0 ? totalResponseTime / totalCalculations : 0,
      cacheHitRate: cacheStats.hitRate,
      incrementalUpdates,
      totalCalculations,
      averageResponseTime: schedulerStats.averageExecutionTime,
      queueLength: schedulerStats.queueLength,
      memoryUsage: cacheStats.totalSize
    }
  }

  // 监听器
  watch(() => finalConfig.enableCache, (enabled) => {
    if (!enabled) {
      clearCache()
    }
  })

  // 生命周期
  onUnmounted(() => {
    scheduler.destroy()
    cache.destroy()
  })

  // 初始化
  if (finalConfig.preloadCommonScenarios) {
    preloadCommonScenarios()
  }

  return {
    // 状态
    isCalculating,
    currentResult,
    error,
    lastInput,
    calculationHistory,
    performanceMetrics,

    // 计算属性
    hasResult,
    hasError,
    cacheHitRate,
    queueLength,

    // 方法
    calculate,
    debouncedCalculate,
    batchCalculate,
    clearCache,
    optimizeMemory,
    preloadCommonScenarios,

    // 统计
    getCacheStats,
    getSchedulerStats
  }
}

// 导出类型
export type { OptimizedCalculationConfig, PerformanceMetrics }
