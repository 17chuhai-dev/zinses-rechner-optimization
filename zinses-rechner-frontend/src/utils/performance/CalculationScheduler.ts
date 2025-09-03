/**
 * 计算调度器
 * 管理计算任务的优先级、调度和执行，确保系统响应性
 */

// 任务优先级枚举
export enum TaskPriority {
  IMMEDIATE = 0,    // 立即执行
  HIGH = 1,         // 高优先级
  NORMAL = 2,       // 正常优先级
  LOW = 3,          // 低优先级
  BACKGROUND = 4    // 后台任务
}

// 任务状态枚举
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 计算任务接口
export interface CalculationTask<T = any, R = any> {
  id: string
  priority: TaskPriority
  status: TaskStatus
  input: T
  calculator: (input: T) => Promise<R>
  resolve?: (result: R) => void
  reject?: (error: Error) => void
  createdAt: number
  startedAt?: number
  completedAt?: number
  timeout?: number
  retryCount: number
  maxRetries: number
  dependencies?: string[]
  tags?: string[]
  estimatedDuration?: number
  actualDuration?: number
}

// 调度器配置接口
export interface SchedulerConfig {
  maxConcurrentTasks: number
  defaultTimeout: number
  maxRetries: number
  enableProfiling: boolean
  priorityWeights: Record<TaskPriority, number>
  adaptiveScheduling: boolean
}

// 调度器统计接口
export interface SchedulerStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  cancelledTasks: number
  averageExecutionTime: number
  queueLength: number
  runningTasks: number
  throughput: number // 每秒完成的任务数
  successRate: number
}

/**
 * 计算调度器类
 */
export class CalculationScheduler {
  private taskQueue: CalculationTask[] = []
  private runningTasks = new Map<string, CalculationTask>()
  private completedTasks: CalculationTask[] = []
  private config: SchedulerConfig
  private stats: SchedulerStats
  private isRunning = false
  private schedulerTimer?: NodeJS.Timeout
  private performanceHistory: number[] = []

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      maxConcurrentTasks: 3,
      defaultTimeout: 30000, // 30秒
      maxRetries: 2,
      enableProfiling: true,
      priorityWeights: {
        [TaskPriority.IMMEDIATE]: 1000,
        [TaskPriority.HIGH]: 100,
        [TaskPriority.NORMAL]: 10,
        [TaskPriority.LOW]: 1,
        [TaskPriority.BACKGROUND]: 0.1
      },
      adaptiveScheduling: true,
      ...config
    }

    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      averageExecutionTime: 0,
      queueLength: 0,
      runningTasks: 0,
      throughput: 0,
      successRate: 0
    }

    this.start()
  }

  /**
   * 添加计算任务
   */
  async schedule<T, R>(
    calculator: (input: T) => Promise<R>,
    input: T,
    options: {
      priority?: TaskPriority
      timeout?: number
      maxRetries?: number
      dependencies?: string[]
      tags?: string[]
      estimatedDuration?: number
    } = {}
  ): Promise<R> {
    const taskId = this.generateTaskId()
    
    const task: CalculationTask<T, R> = {
      id: taskId,
      priority: options.priority || TaskPriority.NORMAL,
      status: TaskStatus.PENDING,
      input,
      calculator,
      createdAt: Date.now(),
      timeout: options.timeout || this.config.defaultTimeout,
      retryCount: 0,
      maxRetries: options.maxRetries || this.config.maxRetries,
      dependencies: options.dependencies,
      tags: options.tags,
      estimatedDuration: options.estimatedDuration
    }

    return new Promise<R>((resolve, reject) => {
      task.resolve = resolve
      task.reject = reject
      
      this.addToQueue(task)
      this.stats.totalTasks++
      this.updateStats()
    })
  }

  /**
   * 取消任务
   */
  cancel(taskId: string): boolean {
    // 从队列中移除
    const queueIndex = this.taskQueue.findIndex(task => task.id === taskId)
    if (queueIndex !== -1) {
      const task = this.taskQueue[queueIndex]
      task.status = TaskStatus.CANCELLED
      task.reject?.(new Error('Task cancelled'))
      this.taskQueue.splice(queueIndex, 1)
      this.stats.cancelledTasks++
      this.updateStats()
      return true
    }

    // 取消正在运行的任务
    const runningTask = this.runningTasks.get(taskId)
    if (runningTask) {
      runningTask.status = TaskStatus.CANCELLED
      runningTask.reject?.(new Error('Task cancelled'))
      this.runningTasks.delete(taskId)
      this.stats.cancelledTasks++
      this.updateStats()
      return true
    }

    return false
  }

  /**
   * 清空队列
   */
  clear(): void {
    // 取消所有待处理任务
    this.taskQueue.forEach(task => {
      task.status = TaskStatus.CANCELLED
      task.reject?.(new Error('Queue cleared'))
    })
    
    this.taskQueue = []
    this.stats.cancelledTasks += this.taskQueue.length
    this.updateStats()
  }

  /**
   * 获取统计信息
   */
  getStats(): SchedulerStats {
    return { ...this.stats }
  }

  /**
   * 获取队列状态
   */
  getQueueStatus() {
    return {
      pending: this.taskQueue.length,
      running: this.runningTasks.size,
      byPriority: this.getTasksByPriority()
    }
  }

  /**
   * 设置优先级权重
   */
  setPriorityWeights(weights: Partial<Record<TaskPriority, number>>): void {
    this.config.priorityWeights = { ...this.config.priorityWeights, ...weights }
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.schedulerTimer = setInterval(() => {
      this.processQueue()
    }, 10) // 每10ms检查一次队列
  }

  /**
   * 停止调度器
   */
  stop(): void {
    this.isRunning = false
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer)
      this.schedulerTimer = undefined
    }
  }

  /**
   * 销毁调度器
   */
  destroy(): void {
    this.stop()
    this.clear()
    
    // 取消所有正在运行的任务
    this.runningTasks.forEach(task => {
      task.status = TaskStatus.CANCELLED
      task.reject?.(new Error('Scheduler destroyed'))
    })
    
    this.runningTasks.clear()
  }

  /**
   * 私有方法：生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 私有方法：添加到队列
   */
  private addToQueue(task: CalculationTask): void {
    // 检查依赖关系
    if (task.dependencies && task.dependencies.length > 0) {
      const unmetDependencies = task.dependencies.filter(depId => 
        !this.completedTasks.some(completed => completed.id === depId)
      )
      
      if (unmetDependencies.length > 0) {
        // 依赖未满足，延迟添加
        setTimeout(() => this.addToQueue(task), 100)
        return
      }
    }

    // 根据优先级插入队列
    const insertIndex = this.findInsertPosition(task)
    this.taskQueue.splice(insertIndex, 0, task)
  }

  /**
   * 私有方法：找到插入位置
   */
  private findInsertPosition(newTask: CalculationTask): number {
    if (this.taskQueue.length === 0) return 0
    
    for (let i = 0; i < this.taskQueue.length; i++) {
      const existingTask = this.taskQueue[i]
      
      if (this.shouldInsertBefore(newTask, existingTask)) {
        return i
      }
    }
    
    return this.taskQueue.length
  }

  /**
   * 私有方法：判断是否应该插入在前面
   */
  private shouldInsertBefore(newTask: CalculationTask, existingTask: CalculationTask): boolean {
    const newWeight = this.config.priorityWeights[newTask.priority]
    const existingWeight = this.config.priorityWeights[existingTask.priority]
    
    if (newWeight !== existingWeight) {
      return newWeight > existingWeight
    }
    
    // 相同优先级，按创建时间排序
    return newTask.createdAt < existingTask.createdAt
  }

  /**
   * 私有方法：处理队列
   */
  private processQueue(): void {
    if (!this.isRunning) return
    
    // 清理已完成的任务
    this.cleanupCompletedTasks()
    
    // 检查是否可以启动新任务
    while (
      this.runningTasks.size < this.config.maxConcurrentTasks &&
      this.taskQueue.length > 0
    ) {
      const task = this.taskQueue.shift()!
      this.executeTask(task)
    }
    
    this.updateStats()
  }

  /**
   * 私有方法：执行任务
   */
  private async executeTask(task: CalculationTask): Promise<void> {
    task.status = TaskStatus.RUNNING
    task.startedAt = Date.now()
    this.runningTasks.set(task.id, task)

    try {
      // 设置超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), task.timeout)
      })

      // 执行计算
      const resultPromise = task.calculator(task.input)
      const result = await Promise.race([resultPromise, timeoutPromise])

      // 任务成功完成
      task.status = TaskStatus.COMPLETED
      task.completedAt = Date.now()
      task.actualDuration = task.completedAt - task.startedAt!
      
      this.runningTasks.delete(task.id)
      this.completedTasks.push(task)
      this.stats.completedTasks++
      
      // 记录性能数据
      if (this.config.enableProfiling) {
        this.recordPerformance(task.actualDuration)
      }
      
      task.resolve?.(result)
      
    } catch (error) {
      // 任务失败
      task.retryCount++
      
      if (task.retryCount <= task.maxRetries) {
        // 重试
        task.status = TaskStatus.PENDING
        this.runningTasks.delete(task.id)
        this.addToQueue(task)
      } else {
        // 最终失败
        task.status = TaskStatus.FAILED
        task.completedAt = Date.now()
        
        this.runningTasks.delete(task.id)
        this.stats.failedTasks++
        
        task.reject?.(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  /**
   * 私有方法：清理已完成的任务
   */
  private cleanupCompletedTasks(): void {
    const maxHistory = 100
    if (this.completedTasks.length > maxHistory) {
      this.completedTasks = this.completedTasks.slice(-maxHistory)
    }
  }

  /**
   * 私有方法：记录性能数据
   */
  private recordPerformance(duration: number): void {
    this.performanceHistory.push(duration)
    
    // 保持最近100个记录
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift()
    }
  }

  /**
   * 私有方法：更新统计信息
   */
  private updateStats(): void {
    this.stats.queueLength = this.taskQueue.length
    this.stats.runningTasks = this.runningTasks.size
    
    const totalCompleted = this.stats.completedTasks + this.stats.failedTasks
    this.stats.successRate = totalCompleted > 0 ? 
      (this.stats.completedTasks / totalCompleted) * 100 : 0
    
    if (this.performanceHistory.length > 0) {
      this.stats.averageExecutionTime = this.performanceHistory.reduce((a, b) => a + b, 0) / 
        this.performanceHistory.length
    }
    
    // 计算吞吐量（简化版）
    const recentTasks = this.completedTasks.filter(task => 
      task.completedAt && Date.now() - task.completedAt < 60000 // 最近1分钟
    )
    this.stats.throughput = recentTasks.length / 60 // 每秒任务数
  }

  /**
   * 私有方法：按优先级获取任务
   */
  private getTasksByPriority() {
    const byPriority: Record<string, number> = {}
    
    this.taskQueue.forEach(task => {
      const priority = TaskPriority[task.priority]
      byPriority[priority] = (byPriority[priority] || 0) + 1
    })
    
    return byPriority
  }
}

// 创建默认调度器实例
export const defaultCalculationScheduler = new CalculationScheduler({
  maxConcurrentTasks: 2,
  defaultTimeout: 15000, // 15秒
  maxRetries: 1,
  enableProfiling: true,
  adaptiveScheduling: true
})
