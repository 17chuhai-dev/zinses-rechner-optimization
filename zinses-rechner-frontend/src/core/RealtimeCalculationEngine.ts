/**
 * 核心实时计算引擎
 * 支持所有8个计算器的实时计算，包括防抖策略、缓存机制和Web Worker集成
 */

import { ref } from 'vue'

// 简单的防抖函数实现
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced
}
// import { calculatorRegistry } from './CalculatorRegistry' // 改为异步导入
import { workerManager } from './WorkerManager'
import type { BaseCalculator, CalculationResult, ValidationResult } from '@/types/calculator'

// 计算请求接口
export interface CalculationRequest {
  id: string
  calculatorId: string
  data: Record<string, any>
  timestamp: number
  priority: 'high' | 'medium' | 'low'
}

// 计算响应接口
export interface CalculationResponse {
  requestId: string
  success: boolean
  result?: CalculationResult
  error?: string
  duration: number
  fromCache: boolean
}

// 实时计算状态
export interface RealtimeCalculationState {
  isCalculating: boolean
  activeRequests: number
  lastCalculated: Date | null
  calculationCount: number
  errorCount: number
  cacheHitCount: number
}

// 防抖策略配置
export const DEBOUNCE_STRATEGIES = {
  'compound-interest': { delay: 500, priority: 'high' as const },
  'savings-plan': { delay: 500, priority: 'high' as const },
  'loan': { delay: 600, priority: 'medium' as const },
  'mortgage': { delay: 700, priority: 'medium' as const },
  'retirement': { delay: 800, priority: 'low' as const },
  'portfolio': { delay: 900, priority: 'low' as const },
  'tax-optimization': { delay: 1000, priority: 'low' as const },
  'etf-savings-plan': { delay: 600, priority: 'medium' as const }
} as const

// LRU缓存实现
class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!
      // 移到最后（最近使用）
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return undefined
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // 删除最久未使用的项
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: (this.cache.size / this.maxSize) * 100
    }
  }
}

/**
 * 核心实时计算引擎类
 */
export class RealtimeCalculationEngine {
  private static instance: RealtimeCalculationEngine

  // 核心组件
  private calculators = new Map<string, BaseCalculator>()
  private cache = new LRUCache<string, CalculationResult>(100)
  private workers = new Map<string, Worker>()
  private debouncedCalculations = new Map<string, Function>()

  // 状态管理
  private state = ref<RealtimeCalculationState>({
    isCalculating: false,
    activeRequests: 0,
    lastCalculated: null,
    calculationCount: 0,
    errorCount: 0,
    cacheHitCount: 0
  })

  // 请求队列
  private requestQueue: CalculationRequest[] = []
  private activeRequests = new Map<string, CalculationRequest>()

  private constructor() {
    this.initializeWorkers()
    // 异步初始化计算器
    this.initializeCalculators().catch(error => {
      console.error('Failed to initialize calculators:', error)
    })
  }

  static getInstance(): RealtimeCalculationEngine {
    if (!RealtimeCalculationEngine.instance) {
      RealtimeCalculationEngine.instance = new RealtimeCalculationEngine()
    }
    return RealtimeCalculationEngine.instance
  }

  /**
   * 异步初始化计算器
   */
  private async initializeCalculators(): Promise<void> {
    try {
      const { calculatorRegistry } = await import('./CalculatorRegistry')
      const allCalculators = calculatorRegistry.getAllCalculators()
      allCalculators.forEach(calculator => {
        this.calculators.set(calculator.id, calculator)

        // 为每个计算器创建防抖函数
        const strategy = DEBOUNCE_STRATEGIES[calculator.id as keyof typeof DEBOUNCE_STRATEGIES]
        if (strategy) {
          const debouncedFn = debounce(
            (data: Record<string, any>) => this.executeCalculation(calculator.id, data),
            strategy.delay
          )
          this.debouncedCalculations.set(calculator.id, debouncedFn)
        }
      })

      console.log(`✅ 实时计算引擎已初始化 ${this.calculators.size} 个计算器`)
    } catch (error) {
      console.error('❌ 初始化计算器失败:', error)
      throw error
    }
  }

  /**
   * 初始化Web Workers（占位符，将在任务2中实现）
   */
  private initializeWorkers(): void {
    // TODO: 在任务2中实现Web Worker初始化
    console.log('🔄 Web Workers将在任务2中实现')
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(calculatorId: string, data: Record<string, any>): string {
    const sortedKeys = Object.keys(data).sort()
    const normalizedData = sortedKeys.reduce((acc, key) => {
      // 对数字进行精度控制，避免浮点数精度问题
      acc[key] = typeof data[key] === 'number'
        ? Math.round(data[key] * 100) / 100
        : data[key]
      return acc
    }, {} as any)

    return `${calculatorId}:${JSON.stringify(normalizedData)}`
  }

  /**
   * 验证输入数据
   */
  private validateInput(calculatorId: string, data: Record<string, any>): ValidationResult {
    const calculator = this.calculators.get(calculatorId)
    if (!calculator) {
      return {
        isValid: false,
        errors: [{ field: 'calculator', message: `计算器 ${calculatorId} 不存在`, code: 'CALCULATOR_NOT_FOUND' }]
      }
    }

    if (calculator.validate) {
      return calculator.validate(data)
    }

    return { isValid: true, errors: [] }
  }

  /**
   * 执行计算（核心方法）- 使用Worker进行后台计算
   */
  private async executeCalculation(calculatorId: string, data: Record<string, any>): Promise<CalculationResult> {
    const startTime = Date.now()

    try {
      // 更新状态
      this.state.value.isCalculating = true
      this.state.value.activeRequests++

      // 验证输入
      const validation = this.validateInput(calculatorId, data)
      if (!validation.isValid) {
        throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // 检查缓存
      const cacheKey = this.generateCacheKey(calculatorId, data)
      if (this.cache.has(cacheKey)) {
        this.state.value.cacheHitCount++
        const cachedResult = this.cache.get(cacheKey)!
        console.log(`🎯 缓存命中: ${calculatorId}`)
        return cachedResult
      }

      // 使用Worker进行后台计算
      const result = await workerManager.calculate(calculatorId, data)

      // 缓存结果
      this.cache.set(cacheKey, result)

      // 更新统计
      this.state.value.calculationCount++
      this.state.value.lastCalculated = new Date()

      console.log(`✅ Worker计算完成: ${calculatorId} (${Date.now() - startTime}ms)`)
      return result

    } catch (error) {
      this.state.value.errorCount++
      console.error(`❌ Worker计算失败: ${calculatorId}`, error)

      // 如果Worker计算失败，尝试主线程计算作为后备
      try {
        console.log(`🔄 尝试主线程计算: ${calculatorId}`)
        const calculator = this.calculators.get(calculatorId)!
        const result = await calculator.calculate(data)

        // 缓存结果
        const cacheKey = this.generateCacheKey(calculatorId, data)
        this.cache.set(cacheKey, result)

        console.log(`✅ 主线程计算完成: ${calculatorId}`)
        return result
      } catch (fallbackError) {
        console.error(`❌ 主线程计算也失败: ${calculatorId}`, fallbackError)
        throw error // 抛出原始错误
      }
    } finally {
      this.state.value.activeRequests--
      if (this.state.value.activeRequests === 0) {
        this.state.value.isCalculating = false
      }
    }
  }

  /**
   * 公共API：实时计算
   */
  async calculate(calculatorId: string, data: Record<string, any>): Promise<CalculationResult> {
    const debouncedFn = this.debouncedCalculations.get(calculatorId)

    if (debouncedFn) {
      // 使用防抖计算
      return new Promise((resolve, reject) => {
        const originalFn = debouncedFn as any
        originalFn._originalCallback = async () => {
          try {
            const result = await this.executeCalculation(calculatorId, data)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }
        debouncedFn()
      })
    } else {
      // 直接计算（无防抖策略的计算器）
      return this.executeCalculation(calculatorId, data)
    }
  }

  /**
   * 立即计算（跳过防抖）
   */
  async calculateImmediate(calculatorId: string, data: Record<string, any>): Promise<CalculationResult> {
    return this.executeCalculation(calculatorId, data)
  }

  /**
   * 取消计算
   */
  cancelCalculation(calculatorId: string): void {
    const debouncedFn = this.debouncedCalculations.get(calculatorId)
    if (debouncedFn && typeof (debouncedFn as any).cancel === 'function') {
      (debouncedFn as any).cancel()
    }
  }

  /**
   * 获取计算器信息
   */
  getCalculator(calculatorId: string): BaseCalculator | undefined {
    return this.calculators.get(calculatorId)
  }

  /**
   * 获取所有支持的计算器ID
   */
  getSupportedCalculators(): string[] {
    return Array.from(this.calculators.keys())
  }

  /**
   * 获取实时状态
   */
  getState() {
    return this.state
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const cacheStats = this.cache.getStats()
    const cacheHitRate = this.state.value.calculationCount > 0
      ? (this.state.value.cacheHitCount / this.state.value.calculationCount) * 100
      : 0

    return {
      totalCalculations: this.state.value.calculationCount,
      errorCount: this.state.value.errorCount,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      cacheStats,
      activeRequests: this.state.value.activeRequests,
      lastCalculated: this.state.value.lastCalculated,
      supportedCalculators: this.getSupportedCalculators().length
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ 计算缓存已清除')
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.state.value.calculationCount = 0
    this.state.value.errorCount = 0
    this.state.value.cacheHitCount = 0
    this.state.value.lastCalculated = null
    console.log('📊 统计数据已重置')
  }
}

// 导出单例实例
export const realtimeCalculationEngine = RealtimeCalculationEngine.getInstance()
