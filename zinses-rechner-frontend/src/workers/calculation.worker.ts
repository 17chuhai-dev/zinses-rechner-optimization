/**
 * 通用计算Worker
 * 为所有计算器类型提供后台计算服务，避免UI阻塞
 */

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

// 计算器模块缓存
const calculatorCache = new Map<string, any>()

// 活动计算请求
const activeCalculations = new Map<string, boolean>()

// Worker状态
const workerStatus = {
  isReady: false,
  loadedCalculators: new Set<string>(),
  totalCalculations: 0,
  errorCount: 0,
  averageCalculationTime: 0
}

/**
 * 动态导入计算器模块
 */
async function loadCalculator(calculatorId: string): Promise<any> {
  if (calculatorCache.has(calculatorId)) {
    return calculatorCache.get(calculatorId)
  }

  try {
    let calculatorModule

    // 根据计算器ID动态导入对应的计算器
    switch (calculatorId) {
      case 'compound-interest':
        calculatorModule = await import('../calculators/CompoundInterestCalculator')
        break
      case 'savings-plan':
        calculatorModule = await import('../calculators/SavingsPlanCalculator')
        break
      case 'loan':
        calculatorModule = await import('../calculators/LoanCalculator')
        break
      case 'mortgage':
        calculatorModule = await import('../calculators/MortgageCalculator')
        break
      case 'retirement':
        calculatorModule = await import('../calculators/RetirementCalculator')
        break
      case 'portfolio':
        calculatorModule = await import('../calculators/PortfolioCalculator')
        break
      case 'tax-optimization':
        calculatorModule = await import('../calculators/TaxOptimizationCalculator')
        break
      case 'etf-savings-plan':
        calculatorModule = await import('../calculators/ETFSavingsPlanCalculator')
        break
      default:
        throw new Error(`未知的计算器类型: ${calculatorId}`)
    }

    // 缓存计算器模块
    calculatorCache.set(calculatorId, calculatorModule)
    workerStatus.loadedCalculators.add(calculatorId)
    
    console.log(`✅ Worker已加载计算器: ${calculatorId}`)
    return calculatorModule

  } catch (error) {
    console.error(`❌ Worker加载计算器失败: ${calculatorId}`, error)
    throw new Error(`计算器加载失败: ${calculatorId} - ${error.message}`)
  }
}

/**
 * 执行计算
 */
async function performCalculation(requestId: string, calculatorId: string, data: any): Promise<WorkerResponse> {
  const startTime = Date.now()
  
  try {
    // 标记计算开始
    activeCalculations.set(requestId, true)

    // 加载计算器
    const calculatorModule = await loadCalculator(calculatorId)
    
    // 获取计算器实例或计算函数
    let calculator
    if (calculatorModule.default) {
      // 如果是默认导出的类
      calculator = new calculatorModule.default()
    } else if (calculatorModule[`${calculatorId}Calculator`]) {
      // 如果是命名导出的类
      const CalculatorClass = calculatorModule[`${calculatorId}Calculator`]
      calculator = new CalculatorClass()
    } else if (calculatorModule.calculate) {
      // 如果是直接导出的计算函数
      calculator = calculatorModule
    } else {
      throw new Error(`计算器 ${calculatorId} 没有有效的计算方法`)
    }

    // 执行计算
    let result
    if (calculator.calculate) {
      result = await calculator.calculate(data)
    } else if (typeof calculator === 'function') {
      result = await calculator(data)
    } else {
      throw new Error(`计算器 ${calculatorId} 的计算方法不可调用`)
    }

    const duration = Date.now() - startTime
    
    // 更新统计
    workerStatus.totalCalculations++
    workerStatus.averageCalculationTime = 
      (workerStatus.averageCalculationTime * (workerStatus.totalCalculations - 1) + duration) / 
      workerStatus.totalCalculations

    console.log(`✅ Worker计算完成: ${calculatorId} (${duration}ms)`)

    return {
      id: requestId,
      type: 'RESULT',
      success: true,
      result,
      duration,
      calculatorId,
      timestamp: Date.now()
    }

  } catch (error) {
    const duration = Date.now() - startTime
    workerStatus.errorCount++
    
    console.error(`❌ Worker计算失败: ${calculatorId}`, error)

    return {
      id: requestId,
      type: 'ERROR',
      success: false,
      error: error.message || '计算过程中发生未知错误',
      duration,
      calculatorId,
      timestamp: Date.now()
    }
  } finally {
    // 清除活动计算标记
    activeCalculations.delete(requestId)
  }
}

/**
 * 取消计算
 */
function cancelCalculation(requestId: string): void {
  if (activeCalculations.has(requestId)) {
    activeCalculations.delete(requestId)
    console.log(`🚫 Worker取消计算: ${requestId}`)
  }
}

/**
 * 获取Worker状态
 */
function getWorkerStatus(): any {
  return {
    ...workerStatus,
    activeCalculations: activeCalculations.size,
    loadedCalculators: Array.from(workerStatus.loadedCalculators),
    cacheSize: calculatorCache.size
  }
}

/**
 * 初始化Worker
 */
function initializeWorker(): void {
  workerStatus.isReady = true
  console.log('🚀 计算Worker已初始化')
  
  // 发送就绪状态
  self.postMessage({
    id: 'init',
    type: 'READY',
    success: true,
    result: getWorkerStatus(),
    duration: 0,
    calculatorId: 'system',
    timestamp: Date.now()
  })
}

/**
 * 主消息处理器
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, calculatorId, data, timestamp } = event.data

  try {
    switch (type) {
      case 'INIT':
        initializeWorker()
        break

      case 'CALCULATE':
        if (!workerStatus.isReady) {
          throw new Error('Worker尚未初始化')
        }
        
        if (!calculatorId) {
          throw new Error('缺少计算器ID')
        }

        const response = await performCalculation(id, calculatorId, data)
        self.postMessage(response)
        break

      case 'CANCEL':
        cancelCalculation(id)
        self.postMessage({
          id,
          type: 'STATUS',
          success: true,
          result: { cancelled: true },
          duration: 0,
          calculatorId: calculatorId || 'unknown',
          timestamp: Date.now()
        })
        break

      case 'STATUS':
        self.postMessage({
          id,
          type: 'STATUS',
          success: true,
          result: getWorkerStatus(),
          duration: 0,
          calculatorId: 'system',
          timestamp: Date.now()
        })
        break

      default:
        throw new Error(`未知的消息类型: ${type}`)
    }

  } catch (error) {
    // 发送错误响应
    self.postMessage({
      id,
      type: 'ERROR',
      success: false,
      error: error.message || '处理消息时发生未知错误',
      duration: 0,
      calculatorId: calculatorId || 'unknown',
      timestamp: Date.now()
    })
  }
}

/**
 * 错误处理
 */
self.onerror = (error) => {
  console.error('❌ Worker发生错误:', error)
  workerStatus.errorCount++
}

/**
 * 未处理的Promise拒绝
 */
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Worker未处理的Promise拒绝:', event.reason)
  workerStatus.errorCount++
  event.preventDefault()
})

// 自动初始化
initializeWorker()
