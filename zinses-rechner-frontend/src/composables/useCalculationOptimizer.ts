/**
 * 计算性能优化器
 * 提供智能缓存、增量计算、计算优先级管理等性能优化功能
 */

import { ref, computed, watch, nextTick } from 'vue'
import { debounce, throttle } from 'lodash-es'

// 缓存条目类型
export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  computationTime: number
  dependencies: string[]
  size: number
}

// 计算任务类型
export interface CalculationTask {
  id: string
  type: string
  priority: number
  inputs: Record<string, any>
  dependencies: string[]
  estimatedTime: number
  retryCount: number
  maxRetries: number
  createdAt: number
}

// 性能指标类型
export interface PerformanceMetrics {
  totalCalculations: number
  cacheHits: number
  cacheMisses: number
  averageComputationTime: number
  totalComputationTime: number
  memoryUsage: number
  queueLength: number
}

// 优化器选项
export interface OptimizerOptions {
  maxCacheSize?: number
  maxCacheAge?: number
  enableIncrementalCalculation?: boolean
  enablePriorityQueue?: boolean
  enableWorkerPool?: boolean
  workerPoolSize?: number
  debounceMs?: number
  throttleMs?: number
}

export function useCalculationOptimizer(options: OptimizerOptions = {}) {
  const {
    maxCacheSize = 100,
    maxCacheAge = 5 * 60 * 1000, // 5分钟
    enableIncrementalCalculation = true,
    enablePriorityQueue = true,
    enableWorkerPool = false,
    workerPoolSize = 2,
    debounceMs = 300,
    throttleMs = 100
  } = options

  // 状态管理
  const cache = ref<Map<string, CacheEntry>>(new Map())
  const taskQueue = ref<CalculationTask[]>([])
  const runningTasks = ref<Set<string>>(new Set())
  const metrics = ref<PerformanceMetrics>({
    totalCalculations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageComputationTime: 0,
    totalComputationTime: 0,
    memoryUsage: 0,
    queueLength: 0
  })

  // Worker池管理
  const workers = ref<Worker[]>([])
  const availableWorkers = ref<Worker[]>([])

  // 计算属性
  const cacheHitRate = computed(() => {
    const total = metrics.value.cacheHits + metrics.value.cacheMisses
    return total > 0 ? (metrics.value.cacheHits / total) * 100 : 0
  })

  const isOptimized = computed(() => {
    return cacheHitRate.value > 50 && metrics.value.averageComputationTime < 100
  })

  const memoryPressure = computed(() => {
    const maxMemory = maxCacheSize * 1024 // 假设每个条目平均1KB
    return (metrics.value.memoryUsage / maxMemory) * 100
  })

  // 缓存管理
  const generateCacheKey = (type: string, inputs: Record<string, any>): string => {
    const sortedInputs = Object.keys(inputs)
      .sort()
      .reduce((result, key) => {
        result[key] = inputs[key]
        return result
      }, {} as Record<string, any>)
    
    return `${type}:${JSON.stringify(sortedInputs)}`
  }

  const getCachedResult = <T>(key: string): T | null => {
    const entry = cache.value.get(key)
    if (!entry) {
      metrics.value.cacheMisses++
      return null
    }

    // 检查缓存是否过期
    if (Date.now() - entry.timestamp > maxCacheAge) {
      cache.value.delete(key)
      metrics.value.cacheMisses++
      return null
    }

    // 更新访问统计
    entry.accessCount++
    entry.lastAccessed = Date.now()
    metrics.value.cacheHits++

    return entry.value as T
  }

  const setCachedResult = <T>(
    key: string, 
    value: T, 
    computationTime: number, 
    dependencies: string[] = []
  ): void => {
    // 检查缓存大小限制
    if (cache.value.size >= maxCacheSize) {
      evictLeastRecentlyUsed()
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      computationTime,
      dependencies,
      size: estimateSize(value)
    }

    cache.value.set(key, entry)
    updateMemoryUsage()
  }

  const evictLeastRecentlyUsed = (): void => {
    let oldestEntry: [string, CacheEntry] | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of cache.value.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestEntry = [key, entry]
      }
    }

    if (oldestEntry) {
      cache.value.delete(oldestEntry[0])
      updateMemoryUsage()
    }
  }

  const invalidateCache = (pattern?: string): void => {
    if (!pattern) {
      cache.value.clear()
    } else {
      const regex = new RegExp(pattern)
      for (const [key] of cache.value.entries()) {
        if (regex.test(key)) {
          cache.value.delete(key)
        }
      }
    }
    updateMemoryUsage()
  }

  const invalidateDependentCache = (dependency: string): void => {
    for (const [key, entry] of cache.value.entries()) {
      if (entry.dependencies.includes(dependency)) {
        cache.value.delete(key)
      }
    }
    updateMemoryUsage()
  }

  // 增量计算
  const calculateIncremental = <T>(
    type: string,
    currentInputs: Record<string, any>,
    previousInputs: Record<string, any>,
    previousResult: T,
    calculator: (inputs: Record<string, any>, previous?: T) => T
  ): T => {
    if (!enableIncrementalCalculation) {
      return calculator(currentInputs)
    }

    // 检查哪些输入发生了变化
    const changedInputs: Record<string, any> = {}
    let hasChanges = false

    for (const [key, value] of Object.entries(currentInputs)) {
      if (previousInputs[key] !== value) {
        changedInputs[key] = value
        hasChanges = true
      }
    }

    if (!hasChanges) {
      return previousResult
    }

    // 如果变化较小，尝试增量计算
    const changeRatio = Object.keys(changedInputs).length / Object.keys(currentInputs).length
    if (changeRatio < 0.3) {
      try {
        return calculator(changedInputs, previousResult)
      } catch (error) {
        // 增量计算失败，回退到完整计算
        console.warn('增量计算失败，回退到完整计算:', error)
        return calculator(currentInputs)
      }
    }

    return calculator(currentInputs)
  }

  // 任务队列管理
  const addTask = (task: Omit<CalculationTask, 'id' | 'createdAt'>): string => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullTask: CalculationTask = {
      ...task,
      id: taskId,
      createdAt: Date.now()
    }

    if (enablePriorityQueue) {
      // 按优先级插入任务
      const insertIndex = taskQueue.value.findIndex(t => t.priority < task.priority)
      if (insertIndex === -1) {
        taskQueue.value.push(fullTask)
      } else {
        taskQueue.value.splice(insertIndex, 0, fullTask)
      }
    } else {
      taskQueue.value.push(fullTask)
    }

    metrics.value.queueLength = taskQueue.value.length
    return taskId
  }

  const removeTask = (taskId: string): boolean => {
    const index = taskQueue.value.findIndex(task => task.id === taskId)
    if (index !== -1) {
      taskQueue.value.splice(index, 1)
      metrics.value.queueLength = taskQueue.value.length
      return true
    }
    return false
  }

  const getNextTask = (): CalculationTask | null => {
    const task = taskQueue.value.shift()
    if (task) {
      metrics.value.queueLength = taskQueue.value.length
      runningTasks.value.add(task.id)
    }
    return task || null
  }

  const completeTask = (taskId: string): void => {
    runningTasks.value.delete(taskId)
  }

  // 性能监控
  const updateMemoryUsage = (): void => {
    let totalSize = 0
    for (const entry of cache.value.values()) {
      totalSize += entry.size
    }
    metrics.value.memoryUsage = totalSize
  }

  const recordCalculation = (computationTime: number): void => {
    metrics.value.totalCalculations++
    metrics.value.totalComputationTime += computationTime
    metrics.value.averageComputationTime = 
      metrics.value.totalComputationTime / metrics.value.totalCalculations
  }

  const estimateSize = (value: any): number => {
    try {
      return JSON.stringify(value).length * 2 // 粗略估算
    } catch {
      return 1024 // 默认1KB
    }
  }

  // Worker池管理
  const initializeWorkerPool = (): void => {
    if (!enableWorkerPool || typeof Worker === 'undefined') return

    for (let i = 0; i < workerPoolSize; i++) {
      try {
        const worker = new Worker('/workers/calculation-worker.js')
        workers.value.push(worker)
        availableWorkers.value.push(worker)
      } catch (error) {
        console.warn('无法创建Worker:', error)
      }
    }
  }

  const getAvailableWorker = (): Worker | null => {
    return availableWorkers.value.pop() || null
  }

  const releaseWorker = (worker: Worker): void => {
    if (!availableWorkers.value.includes(worker)) {
      availableWorkers.value.push(worker)
    }
  }

  // 优化建议
  const getOptimizationSuggestions = (): string[] => {
    const suggestions: string[] = []

    if (cacheHitRate.value < 30) {
      suggestions.push('缓存命中率较低，考虑调整缓存策略')
    }

    if (metrics.value.averageComputationTime > 500) {
      suggestions.push('平均计算时间较长，考虑启用Worker池')
    }

    if (memoryPressure.value > 80) {
      suggestions.push('内存使用率较高，考虑减少缓存大小或增加清理频率')
    }

    if (taskQueue.value.length > 10) {
      suggestions.push('任务队列较长，考虑优化计算逻辑或增加并发处理')
    }

    return suggestions
  }

  // 防抖和节流的优化计算函数
  const optimizedCalculate = debounce(async <T>(
    type: string,
    inputs: Record<string, any>,
    calculator: (inputs: Record<string, any>) => Promise<T> | T,
    options: {
      useCache?: boolean
      dependencies?: string[]
      priority?: number
    } = {}
  ): Promise<T> => {
    const { useCache = true, dependencies = [], priority = 1 } = options
    const startTime = Date.now()

    // 检查缓存
    if (useCache) {
      const cacheKey = generateCacheKey(type, inputs)
      const cachedResult = getCachedResult<T>(cacheKey)
      if (cachedResult !== null) {
        return cachedResult
      }
    }

    try {
      // 执行计算
      const result = await calculator(inputs)
      const computationTime = Date.now() - startTime

      // 缓存结果
      if (useCache) {
        const cacheKey = generateCacheKey(type, inputs)
        setCachedResult(cacheKey, result, computationTime, dependencies)
      }

      // 记录性能指标
      recordCalculation(computationTime)

      return result
    } catch (error) {
      console.error('计算失败:', error)
      throw error
    }
  }, debounceMs)

  // 清理函数
  const cleanup = (): void => {
    cache.value.clear()
    taskQueue.value = []
    runningTasks.value.clear()
    
    // 清理Workers
    workers.value.forEach(worker => worker.terminate())
    workers.value = []
    availableWorkers.value = []
  }

  // 初始化
  initializeWorkerPool()

  return {
    // 状态
    cache: readonly(cache),
    taskQueue: readonly(taskQueue),
    runningTasks: readonly(runningTasks),
    metrics: readonly(metrics),

    // 计算属性
    cacheHitRate,
    isOptimized,
    memoryPressure,

    // 缓存方法
    getCachedResult,
    setCachedResult,
    invalidateCache,
    invalidateDependentCache,

    // 增量计算
    calculateIncremental,

    // 任务管理
    addTask,
    removeTask,
    getNextTask,
    completeTask,

    // 优化计算
    optimizedCalculate,

    // Worker管理
    getAvailableWorker,
    releaseWorker,

    // 工具方法
    getOptimizationSuggestions,
    cleanup
  }
}
