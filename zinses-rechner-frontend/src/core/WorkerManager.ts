/**
 * Worker管理器
 * 管理多个计算Worker实例，提供负载均衡和故障恢复
 */

import { ref, computed } from 'vue'

// Worker消息接口
interface WorkerMessage {
  id: string
  type: 'CALCULATE' | 'CANCEL' | 'STATUS' | 'INIT'
  calculatorId: string
  data?: any
  timestamp: number
}

// Worker响应接口
interface WorkerResponse {
  id: string
  type: 'RESULT' | 'ERROR' | 'STATUS' | 'READY'
  success: boolean
  result?: any
  error?: string
  duration: number
  calculatorId: string
  timestamp: number
}

// Worker实例信息
interface WorkerInstance {
  id: string
  worker: Worker
  isReady: boolean
  activeRequests: number
  totalCalculations: number
  errorCount: number
  averageResponseTime: number
  lastUsed: Date
  calculatorTypes: Set<string>
}

// 计算请求信息
interface CalculationRequest {
  id: string
  calculatorId: string
  data: any
  timestamp: number
  resolve: (result: any) => void
  reject: (error: Error) => void
  timeout?: NodeJS.Timeout
}

/**
 * Worker管理器类
 */
export class WorkerManager {
  private static instance: WorkerManager
  
  // Worker池
  private workers = new Map<string, WorkerInstance>()
  private requestQueue = new Map<string, CalculationRequest>()
  
  // 配置
  private readonly maxWorkers = 4 // 最大Worker数量
  private readonly requestTimeout = 10000 // 请求超时时间(ms)
  private readonly workerIdleTimeout = 300000 // Worker空闲超时时间(ms)
  
  // 状态管理
  private state = ref({
    totalWorkers: 0,
    activeWorkers: 0,
    totalRequests: 0,
    completedRequests: 0,
    errorRequests: 0,
    averageResponseTime: 0
  })

  private constructor() {
    this.initializeWorkerPool()
    this.startCleanupTimer()
  }

  static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager()
    }
    return WorkerManager.instance
  }

  /**
   * 初始化Worker池
   */
  private initializeWorkerPool(): void {
    // 创建初始Worker
    for (let i = 0; i < 2; i++) {
      this.createWorker()
    }
    console.log('🏊 Worker池已初始化')
  }

  /**
   * 创建新的Worker实例
   */
  private createWorker(): WorkerInstance {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 创建Worker
    const worker = new Worker(
      new URL('../workers/calculation.worker.ts', import.meta.url),
      { type: 'module' }
    )

    const workerInstance: WorkerInstance = {
      id: workerId,
      worker,
      isReady: false,
      activeRequests: 0,
      totalCalculations: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastUsed: new Date(),
      calculatorTypes: new Set()
    }

    // 设置消息处理器
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleWorkerMessage(workerId, event.data)
    }

    // 设置错误处理器
    worker.onerror = (error) => {
      console.error(`❌ Worker ${workerId} 发生错误:`, error)
      this.handleWorkerError(workerId, error)
    }

    // 初始化Worker
    worker.postMessage({
      id: 'init',
      type: 'INIT',
      calculatorId: 'system',
      timestamp: Date.now()
    })

    this.workers.set(workerId, workerInstance)
    this.state.value.totalWorkers++

    console.log(`✅ 创建Worker: ${workerId}`)
    return workerInstance
  }

  /**
   * 处理Worker消息
   */
  private handleWorkerMessage(workerId: string, response: WorkerResponse): void {
    const workerInstance = this.workers.get(workerId)
    if (!workerInstance) return

    switch (response.type) {
      case 'READY':
        workerInstance.isReady = true
        this.state.value.activeWorkers++
        console.log(`🚀 Worker ${workerId} 已就绪`)
        break

      case 'RESULT':
      case 'ERROR':
        this.handleCalculationResponse(workerId, response)
        break

      case 'STATUS':
        // 处理状态更新
        if (response.result?.loadedCalculators) {
          response.result.loadedCalculators.forEach((calc: string) => {
            workerInstance.calculatorTypes.add(calc)
          })
        }
        break
    }
  }

  /**
   * 处理计算响应
   */
  private handleCalculationResponse(workerId: string, response: WorkerResponse): void {
    const workerInstance = this.workers.get(workerId)
    const request = this.requestQueue.get(response.id)
    
    if (!workerInstance || !request) return

    // 更新Worker统计
    workerInstance.activeRequests--
    workerInstance.totalCalculations++
    workerInstance.lastUsed = new Date()
    
    if (response.success) {
      // 更新平均响应时间
      workerInstance.averageResponseTime = 
        (workerInstance.averageResponseTime * (workerInstance.totalCalculations - 1) + response.duration) / 
        workerInstance.totalCalculations
      
      // 更新全局统计
      this.state.value.completedRequests++
      this.updateAverageResponseTime(response.duration)
      
      // 解析请求
      request.resolve(response.result)
    } else {
      workerInstance.errorCount++
      this.state.value.errorRequests++
      
      // 拒绝请求
      request.reject(new Error(response.error || '计算失败'))
    }

    // 清理请求
    if (request.timeout) {
      clearTimeout(request.timeout)
    }
    this.requestQueue.delete(response.id)
  }

  /**
   * 处理Worker错误
   */
  private handleWorkerError(workerId: string, error: any): void {
    const workerInstance = this.workers.get(workerId)
    if (!workerInstance) return

    workerInstance.errorCount++
    
    // 如果错误过多，重启Worker
    if (workerInstance.errorCount > 5) {
      console.log(`🔄 重启错误过多的Worker: ${workerId}`)
      this.restartWorker(workerId)
    }
  }

  /**
   * 重启Worker
   */
  private restartWorker(workerId: string): void {
    const workerInstance = this.workers.get(workerId)
    if (!workerInstance) return

    // 终止旧Worker
    workerInstance.worker.terminate()
    this.workers.delete(workerId)
    this.state.value.totalWorkers--
    this.state.value.activeWorkers--

    // 创建新Worker
    this.createWorker()
  }

  /**
   * 选择最佳Worker
   */
  private selectBestWorker(calculatorId: string): WorkerInstance | null {
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.isReady)
      .sort((a, b) => {
        // 优先选择已加载该计算器类型的Worker
        const aHasCalculator = a.calculatorTypes.has(calculatorId) ? 1 : 0
        const bHasCalculator = b.calculatorTypes.has(calculatorId) ? 1 : 0
        
        if (aHasCalculator !== bHasCalculator) {
          return bHasCalculator - aHasCalculator
        }
        
        // 其次选择活动请求较少的Worker
        return a.activeRequests - b.activeRequests
      })

    return availableWorkers[0] || null
  }

  /**
   * 更新平均响应时间
   */
  private updateAverageResponseTime(duration: number): void {
    const total = this.state.value.completedRequests
    this.state.value.averageResponseTime = 
      (this.state.value.averageResponseTime * (total - 1) + duration) / total
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupIdleWorkers()
      this.cleanupTimeoutRequests()
    }, 60000) // 每分钟清理一次
  }

  /**
   * 清理空闲Worker
   */
  private cleanupIdleWorkers(): void {
    const now = new Date()
    const workersToRemove: string[] = []

    this.workers.forEach((worker, workerId) => {
      const idleTime = now.getTime() - worker.lastUsed.getTime()
      
      // 如果Worker空闲时间过长且不是最后一个Worker
      if (idleTime > this.workerIdleTimeout && 
          worker.activeRequests === 0 && 
          this.workers.size > 1) {
        workersToRemove.push(workerId)
      }
    })

    workersToRemove.forEach(workerId => {
      console.log(`🗑️ 清理空闲Worker: ${workerId}`)
      const worker = this.workers.get(workerId)
      if (worker) {
        worker.worker.terminate()
        this.workers.delete(workerId)
        this.state.value.totalWorkers--
        this.state.value.activeWorkers--
      }
    })
  }

  /**
   * 清理超时请求
   */
  private cleanupTimeoutRequests(): void {
    const now = Date.now()
    const timeoutRequests: string[] = []

    this.requestQueue.forEach((request, requestId) => {
      if (now - request.timestamp > this.requestTimeout) {
        timeoutRequests.push(requestId)
      }
    })

    timeoutRequests.forEach(requestId => {
      const request = this.requestQueue.get(requestId)
      if (request) {
        request.reject(new Error('计算请求超时'))
        if (request.timeout) {
          clearTimeout(request.timeout)
        }
        this.requestQueue.delete(requestId)
        this.state.value.errorRequests++
      }
    })
  }

  /**
   * 公共API: 执行计算
   */
  async calculate(calculatorId: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // 选择Worker
      let worker = this.selectBestWorker(calculatorId)
      
      // 如果没有可用Worker且未达到最大数量，创建新Worker
      if (!worker && this.workers.size < this.maxWorkers) {
        worker = this.createWorker()
      }
      
      if (!worker) {
        reject(new Error('没有可用的Worker'))
        return
      }

      // 创建请求
      const request: CalculationRequest = {
        id: requestId,
        calculatorId,
        data,
        timestamp: Date.now(),
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.requestQueue.delete(requestId)
          reject(new Error('计算请求超时'))
        }, this.requestTimeout)
      }

      // 添加到请求队列
      this.requestQueue.set(requestId, request)
      
      // 更新统计
      worker.activeRequests++
      this.state.value.totalRequests++

      // 发送计算请求
      worker.worker.postMessage({
        id: requestId,
        type: 'CALCULATE',
        calculatorId,
        data,
        timestamp: Date.now()
      })
    })
  }

  /**
   * 取消计算
   */
  cancelCalculation(requestId: string): void {
    const request = this.requestQueue.get(requestId)
    if (request) {
      // 通知Worker取消计算
      this.workers.forEach(worker => {
        worker.worker.postMessage({
          id: requestId,
          type: 'CANCEL',
          calculatorId: request.calculatorId,
          timestamp: Date.now()
        })
      })

      // 清理请求
      if (request.timeout) {
        clearTimeout(request.timeout)
      }
      this.requestQueue.delete(requestId)
      request.reject(new Error('计算已取消'))
    }
  }

  /**
   * 获取状态
   */
  getState() {
    return this.state
  }

  /**
   * 获取详细统计
   */
  getDetailedStats() {
    const workerStats = Array.from(this.workers.values()).map(worker => ({
      id: worker.id,
      isReady: worker.isReady,
      activeRequests: worker.activeRequests,
      totalCalculations: worker.totalCalculations,
      errorCount: worker.errorCount,
      averageResponseTime: worker.averageResponseTime,
      calculatorTypes: Array.from(worker.calculatorTypes)
    }))

    return {
      ...this.state.value,
      workers: workerStats,
      queuedRequests: this.requestQueue.size
    }
  }

  /**
   * 销毁所有Worker
   */
  destroy(): void {
    this.workers.forEach(worker => {
      worker.worker.terminate()
    })
    this.workers.clear()
    this.requestQueue.clear()
    
    this.state.value = {
      totalWorkers: 0,
      activeWorkers: 0,
      totalRequests: 0,
      completedRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0
    }
    
    console.log('🗑️ 所有Worker已销毁')
  }
}

// 导出单例实例
export const workerManager = WorkerManager.getInstance()
