/**
 * 智能防抖算法实现
 * 支持基于计算器类型和用户行为的动态防抖时间调整
 */

import { debounceStrategyManager, type AdaptiveParams } from './DebounceStrategyManager'

// 防抖任务接口
interface DebounceTask {
  id: string
  calculatorId: string
  fn: Function
  args: any[]
  timestamp: number
  priority: 'high' | 'medium' | 'low'
  timeout?: NodeJS.Timeout
  resolve?: (value: any) => void
  reject?: (error: Error) => void
}

// 用户行为跟踪
interface UserBehaviorTracker {
  lastInputTime: number
  inputCount: number
  pauseStart: number
  totalPauseTime: number
  calculatorUsage: Map<string, number>
}

/**
 * 智能防抖器类
 */
export class SmartDebouncer {
  private static instance: SmartDebouncer
  
  // 防抖任务队列
  private tasks = new Map<string, DebounceTask>()
  private priorityQueues = {
    high: [] as DebounceTask[],
    medium: [] as DebounceTask[],
    low: [] as DebounceTask[]
  }
  
  // 用户行为跟踪
  private behaviorTracker: UserBehaviorTracker = {
    lastInputTime: 0,
    inputCount: 0,
    pauseStart: 0,
    totalPauseTime: 0,
    calculatorUsage: new Map()
  }
  
  // 性能统计
  private stats = {
    totalDebounces: 0,
    totalExecutions: 0,
    totalCancellations: 0,
    averageDelay: 0,
    adaptiveAdjustments: 0
  }

  private constructor() {
    this.startBehaviorTracking()
    console.log('🧠 智能防抖器已初始化')
  }

  static getInstance(): SmartDebouncer {
    if (!SmartDebouncer.instance) {
      SmartDebouncer.instance = new SmartDebouncer()
    }
    return SmartDebouncer.instance
  }

  /**
   * 开始用户行为跟踪
   */
  private startBehaviorTracking(): void {
    // 每秒更新一次行为分析
    setInterval(() => {
      this.updateBehaviorAnalysis()
    }, 1000)
  }

  /**
   * 更新用户行为分析
   */
  private updateBehaviorAnalysis(): void {
    const now = Date.now()
    
    // 检测用户是否停止输入
    if (this.behaviorTracker.lastInputTime > 0 && 
        now - this.behaviorTracker.lastInputTime > 2000) {
      
      if (this.behaviorTracker.pauseStart === 0) {
        this.behaviorTracker.pauseStart = this.behaviorTracker.lastInputTime
      }
      
      this.behaviorTracker.totalPauseTime = now - this.behaviorTracker.pauseStart
    } else {
      this.behaviorTracker.pauseStart = 0
      this.behaviorTracker.totalPauseTime = 0
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(calculatorId: string, args: any[]): string {
    const argsHash = JSON.stringify(args).slice(0, 50)
    return `${calculatorId}-${Date.now()}-${argsHash}`
  }

  /**
   * 分析用户行为参数
   */
  private analyzeUserBehavior(calculatorId: string): AdaptiveParams {
    const now = Date.now()
    const timeSinceLastInput = this.behaviorTracker.lastInputTime > 0 
      ? now - this.behaviorTracker.lastInputTime 
      : 0

    // 计算输入频率 (最近10秒内的输入次数)
    const inputFrequency = this.behaviorTracker.inputCount / 10

    // 获取计算器使用频率
    const calculatorUsage = this.behaviorTracker.calculatorUsage.get(calculatorId) || 0
    
    // 估算计算复杂度 (基于计算器类型)
    const complexityMap: Record<string, number> = {
      'compound-interest': 3,
      'savings-plan': 3,
      'loan': 5,
      'mortgage': 6,
      'retirement': 8,
      'portfolio': 9,
      'tax-optimization': 10,
      'etf-savings-plan': 5
    }

    // 基于使用频率估算用户体验
    let userExperience = 3 // 默认中等
    if (calculatorUsage > 10) userExperience = 4 // 熟练用户
    if (calculatorUsage > 50) userExperience = 5 // 专家用户
    if (this.stats.totalCancellations / Math.max(this.stats.totalDebounces, 1) > 0.3) {
      userExperience = Math.max(1, userExperience - 1) // 取消率高，体验差
    }

    return {
      inputFrequency,
      pauseDuration: this.behaviorTracker.totalPauseTime,
      calculationComplexity: complexityMap[calculatorId] || 5,
      userExperience
    }
  }

  /**
   * 智能防抖主方法
   */
  debounce<T extends (...args: any[]) => any>(
    calculatorId: string,
    fn: T,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      // 更新用户行为跟踪
      const now = Date.now()
      this.behaviorTracker.lastInputTime = now
      this.behaviorTracker.inputCount++
      
      const currentUsage = this.behaviorTracker.calculatorUsage.get(calculatorId) || 0
      this.behaviorTracker.calculatorUsage.set(calculatorId, currentUsage + 1)

      // 生成任务ID
      const taskId = this.generateTaskId(calculatorId, args)
      
      // 获取策略配置
      const strategy = debounceStrategyManager.getStrategy(calculatorId)
      
      // 分析用户行为并调整延迟
      const behaviorParams = this.analyzeUserBehavior(calculatorId)
      const adaptiveDelay = debounceStrategyManager.adaptDelay(calculatorId, behaviorParams)
      
      // 取消同一计算器的现有任务
      this.cancelCalculatorTasks(calculatorId)
      
      // 创建新任务
      const task: DebounceTask = {
        id: taskId,
        calculatorId,
        fn,
        args,
        timestamp: now,
        priority: strategy.priority,
        resolve,
        reject
      }

      // 设置防抖定时器
      task.timeout = setTimeout(async () => {
        try {
          // 从队列中移除任务
          this.tasks.delete(taskId)
          this.removeFromPriorityQueue(task)
          
          // 执行函数
          const result = await fn(...args)
          
          // 更新统计
          this.stats.totalExecutions++
          this.stats.averageDelay = (this.stats.averageDelay + adaptiveDelay) / 2
          
          // 记录策略管理器统计
          debounceStrategyManager.recordTrigger(calculatorId)
          
          resolve(result)
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      }, adaptiveDelay)

      // 添加到任务队列
      this.tasks.set(taskId, task)
      this.addToPriorityQueue(task)
      
      // 更新统计
      this.stats.totalDebounces++
      if (adaptiveDelay !== strategy.delay) {
        this.stats.adaptiveAdjustments++
      }

      console.log(`⏱️ 防抖任务创建: ${calculatorId} (${adaptiveDelay}ms)`)
    })
  }

  /**
   * 取消指定计算器的所有任务
   */
  private cancelCalculatorTasks(calculatorId: string): void {
    const tasksToCancel = Array.from(this.tasks.values())
      .filter(task => task.calculatorId === calculatorId)

    tasksToCancel.forEach(task => {
      if (task.timeout) {
        clearTimeout(task.timeout)
      }
      
      this.tasks.delete(task.id)
      this.removeFromPriorityQueue(task)
      
      // 记录取消统计
      this.stats.totalCancellations++
      debounceStrategyManager.recordCancellation(calculatorId)
      
      if (task.reject) {
        task.reject(new Error('任务被新的输入取消'))
      }
    })

    if (tasksToCancel.length > 0) {
      console.log(`🚫 取消 ${calculatorId} 的 ${tasksToCancel.length} 个防抖任务`)
    }
  }

  /**
   * 添加任务到优先级队列
   */
  private addToPriorityQueue(task: DebounceTask): void {
    this.priorityQueues[task.priority].push(task)
  }

  /**
   * 从优先级队列移除任务
   */
  private removeFromPriorityQueue(task: DebounceTask): void {
    const queue = this.priorityQueues[task.priority]
    const index = queue.findIndex(t => t.id === task.id)
    if (index !== -1) {
      queue.splice(index, 1)
    }
  }

  /**
   * 立即执行指定计算器的任务
   */
  async executeImmediate<T extends (...args: any[]) => any>(
    calculatorId: string,
    fn: T,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    // 取消现有任务
    this.cancelCalculatorTasks(calculatorId)
    
    try {
      const result = await fn(...args)
      this.stats.totalExecutions++
      debounceStrategyManager.recordTrigger(calculatorId)
      return result
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 取消指定计算器的所有防抖任务
   */
  cancel(calculatorId: string): void {
    this.cancelCalculatorTasks(calculatorId)
  }

  /**
   * 取消所有防抖任务
   */
  cancelAll(): void {
    this.tasks.forEach(task => {
      if (task.timeout) {
        clearTimeout(task.timeout)
      }
      if (task.reject) {
        task.reject(new Error('所有任务被取消'))
      }
    })

    this.tasks.clear()
    this.priorityQueues.high = []
    this.priorityQueues.medium = []
    this.priorityQueues.low = []
    
    console.log('🚫 所有防抖任务已取消')
  }

  /**
   * 获取当前活动任务信息
   */
  getActiveTasks(): { [calculatorId: string]: number } {
    const activeTasks: { [calculatorId: string]: number } = {}
    
    this.tasks.forEach(task => {
      activeTasks[task.calculatorId] = (activeTasks[task.calculatorId] || 0) + 1
    })
    
    return activeTasks
  }

  /**
   * 获取优先级队列状态
   */
  getPriorityQueueStatus(): { high: number, medium: number, low: number } {
    return {
      high: this.priorityQueues.high.length,
      medium: this.priorityQueues.medium.length,
      low: this.priorityQueues.low.length
    }
  }

  /**
   * 获取用户行为统计
   */
  getBehaviorStats(): UserBehaviorTracker & { inputFrequency: number } {
    const inputFrequency = this.behaviorTracker.inputCount / 10 // 最近10秒的频率
    
    return {
      ...this.behaviorTracker,
      inputFrequency
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const cancellationRate = this.stats.totalDebounces > 0 
      ? (this.stats.totalCancellations / this.stats.totalDebounces) * 100 
      : 0

    const executionRate = this.stats.totalDebounces > 0
      ? (this.stats.totalExecutions / this.stats.totalDebounces) * 100
      : 0

    return {
      ...this.stats,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      executionRate: Math.round(executionRate * 100) / 100,
      activeTasks: this.tasks.size,
      priorityQueues: this.getPriorityQueueStatus()
    }
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    this.stats = {
      totalDebounces: 0,
      totalExecutions: 0,
      totalCancellations: 0,
      averageDelay: 0,
      adaptiveAdjustments: 0
    }
    
    this.behaviorTracker = {
      lastInputTime: 0,
      inputCount: 0,
      pauseStart: 0,
      totalPauseTime: 0,
      calculatorUsage: new Map()
    }
    
    console.log('📊 智能防抖器统计数据已重置')
  }

  /**
   * 销毁防抖器
   */
  destroy(): void {
    this.cancelAll()
    this.resetStats()
    console.log('🗑️ 智能防抖器已销毁')
  }
}

// 导出单例实例
export const smartDebouncer = SmartDebouncer.getInstance()
