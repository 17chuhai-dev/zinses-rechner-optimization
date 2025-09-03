/**
 * Web Worker集成测试
 * 验证Worker管理器和实时计算引擎的集成功能
 */

// 模拟Worker环境
class MockWorker {
  constructor(url, options) {
    this.url = url
    this.options = options
    this.onmessage = null
    this.onerror = null
    this.messageQueue = []
    this.isReady = false
    
    // 模拟异步初始化
    setTimeout(() => {
      this.isReady = true
      if (this.onmessage) {
        this.onmessage({
          data: {
            id: 'init',
            type: 'READY',
            success: true,
            result: { loadedCalculators: ['compound-interest', 'savings-plan'] },
            duration: 0,
            calculatorId: 'system',
            timestamp: Date.now()
          }
        })
      }
    }, 100)
  }

  postMessage(message) {
    if (!this.isReady) {
      this.messageQueue.push(message)
      return
    }

    // 模拟计算处理
    setTimeout(() => {
      if (message.type === 'CALCULATE') {
        this.simulateCalculation(message)
      } else if (message.type === 'CANCEL') {
        this.simulateCancel(message)
      } else if (message.type === 'STATUS') {
        this.simulateStatus(message)
      }
    }, 50 + Math.random() * 100) // 模拟计算延迟
  }

  simulateCalculation(message) {
    const { id, calculatorId, data } = message

    try {
      // 检查计算器是否存在
      if (!['compound-interest', 'savings-plan'].includes(calculatorId)) {
        throw new Error(`未知的计算器类型: ${calculatorId}`)
      }

      // 模拟计算逻辑
      let result
      if (calculatorId === 'compound-interest') {
        const { principal, monthlyPayment = 0, annualRate, years } = data
        const monthlyRate = annualRate / 100 / 12
        const totalMonths = years * 12
        
        const principalGrowth = principal * Math.pow(1 + monthlyRate, totalMonths)
        const monthlyGrowth = monthlyPayment > 0 
          ? monthlyPayment * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
          : 0
        
        const finalAmount = principalGrowth + monthlyGrowth
        const totalContributions = principal + (monthlyPayment * totalMonths)
        const totalInterest = finalAmount - totalContributions
        
        result = {
          finalAmount,
          totalInterest,
          totalContributions,
          effectiveRate: annualRate
        }
      } else {
        result = {
          finalAmount: 10000,
          totalInterest: 1000,
          totalContributions: 9000,
          effectiveRate: 5
        }
      }

      if (this.onmessage) {
        this.onmessage({
          data: {
            id,
            type: 'RESULT',
            success: true,
            result,
            duration: 100,
            calculatorId,
            timestamp: Date.now()
          }
        })
      }
    } catch (error) {
      if (this.onmessage) {
        this.onmessage({
          data: {
            id,
            type: 'ERROR',
            success: false,
            error: error.message,
            duration: 100,
            calculatorId,
            timestamp: Date.now()
          }
        })
      }
    }
  }

  simulateCancel(message) {
    if (this.onmessage) {
      this.onmessage({
        data: {
          id: message.id,
          type: 'STATUS',
          success: true,
          result: { cancelled: true },
          duration: 0,
          calculatorId: message.calculatorId || 'unknown',
          timestamp: Date.now()
        }
      })
    }
  }

  simulateStatus(message) {
    if (this.onmessage) {
      this.onmessage({
        data: {
          id: message.id,
          type: 'STATUS',
          success: true,
          result: {
            isReady: true,
            loadedCalculators: ['compound-interest', 'savings-plan'],
            totalCalculations: 10,
            errorCount: 0,
            averageCalculationTime: 100
          },
          duration: 0,
          calculatorId: 'system',
          timestamp: Date.now()
        }
      })
    }
  }

  terminate() {
    this.isReady = false
    this.onmessage = null
    this.onerror = null
  }
}

// 模拟全局Worker
global.Worker = MockWorker

// 模拟import.meta.url
global.importMeta = { url: 'file:///test.js' }

// 简化的Worker管理器（用于测试）
class TestWorkerManager {
  constructor() {
    this.workers = new Map()
    this.requestQueue = new Map()
    this.maxWorkers = 2
    this.requestTimeout = 5000
    
    this.state = {
      totalWorkers: 0,
      activeWorkers: 0,
      totalRequests: 0,
      completedRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0
    }
    
    this.initializeWorkerPool()
  }

  initializeWorkerPool() {
    for (let i = 0; i < 2; i++) {
      this.createWorker()
    }
  }

  createWorker() {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const worker = new MockWorker('test-worker.js', { type: 'module' })
    
    const workerInstance = {
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

    worker.onmessage = (event) => {
      this.handleWorkerMessage(workerId, event.data)
    }

    worker.onerror = (error) => {
      this.handleWorkerError(workerId, error)
    }

    this.workers.set(workerId, workerInstance)
    this.state.totalWorkers++

    return workerInstance
  }

  handleWorkerMessage(workerId, response) {
    const workerInstance = this.workers.get(workerId)
    if (!workerInstance) return

    switch (response.type) {
      case 'READY':
        workerInstance.isReady = true
        this.state.activeWorkers++
        break

      case 'RESULT':
      case 'ERROR':
        this.handleCalculationResponse(workerId, response)
        break
    }
  }

  handleCalculationResponse(workerId, response) {
    const workerInstance = this.workers.get(workerId)
    const request = this.requestQueue.get(response.id)
    
    if (!workerInstance || !request) return

    workerInstance.activeRequests--
    workerInstance.totalCalculations++
    workerInstance.lastUsed = new Date()
    
    if (response.success) {
      this.state.completedRequests++
      request.resolve(response.result)
    } else {
      workerInstance.errorCount++
      this.state.errorRequests++
      request.reject(new Error(response.error || '计算失败'))
    }

    if (request.timeout) {
      clearTimeout(request.timeout)
    }
    this.requestQueue.delete(response.id)
  }

  handleWorkerError(workerId, error) {
    const workerInstance = this.workers.get(workerId)
    if (workerInstance) {
      workerInstance.errorCount++
    }
  }

  selectBestWorker() {
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.isReady)
      .sort((a, b) => a.activeRequests - b.activeRequests)

    return availableWorkers[0] || null
  }

  async calculate(calculatorId, data) {
    return new Promise((resolve, reject) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const worker = this.selectBestWorker()
      if (!worker) {
        reject(new Error('没有可用的Worker'))
        return
      }

      const request = {
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

      this.requestQueue.set(requestId, request)
      worker.activeRequests++
      this.state.totalRequests++

      worker.worker.postMessage({
        id: requestId,
        type: 'CALCULATE',
        calculatorId,
        data,
        timestamp: Date.now()
      })
    })
  }

  getDetailedStats() {
    return {
      ...this.state,
      workers: Array.from(this.workers.values()).map(w => ({
        id: w.id,
        isReady: w.isReady,
        activeRequests: w.activeRequests,
        totalCalculations: w.totalCalculations,
        errorCount: w.errorCount
      })),
      queuedRequests: this.requestQueue.size
    }
  }
}

// 测试函数
async function runWorkerIntegrationTests() {
  console.log('🧪 开始Web Worker集成测试...\n')
  
  const workerManager = new TestWorkerManager()
  let passed = 0
  let failed = 0
  
  function test(description, condition) {
    if (condition) {
      console.log(`✅ ${description}`)
      passed++
    } else {
      console.log(`❌ ${description}`)
      failed++
    }
  }
  
  // 等待Worker初始化
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // 测试1: Worker池初始化
  console.log('📋 测试Worker池初始化:')
  test('应该创建2个Worker', workerManager.state.totalWorkers === 2)
  test('Worker应该就绪', workerManager.state.activeWorkers === 2)
  
  // 测试2: 基本计算功能
  console.log('\n💼 测试Worker计算功能:')
  
  const testData = {
    principal: 10000,
    monthlyPayment: 500,
    annualRate: 5,
    years: 10
  }
  
  try {
    const result = await workerManager.calculate('compound-interest', testData)
    test('Worker计算应该成功', result && result.finalAmount > 0)
    test('结果应该包含必要字段', 
      result.finalAmount && result.totalInterest && result.totalContributions)
    test('请求统计应该更新', workerManager.state.totalRequests === 1)
    test('完成统计应该更新', workerManager.state.completedRequests === 1)
  } catch (error) {
    test('Worker计算应该成功', false)
    console.log('   错误:', error.message)
  }
  
  // 测试3: 并发计算
  console.log('\n🔄 测试并发计算:')
  
  try {
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(workerManager.calculate('compound-interest', {
        ...testData,
        principal: testData.principal + i * 1000
      }))
    }
    
    const results = await Promise.all(promises)
    test('并发计算应该全部成功', results.length === 5)
    test('每个结果都应该有效', results.every(r => r && r.finalAmount > 0))
    test('总请求数应该正确', workerManager.state.totalRequests === 6) // 1 + 5
  } catch (error) {
    test('并发计算失败', false)
    console.log('   错误:', error.message)
  }
  
  // 测试4: 错误处理
  console.log('\n🔍 测试错误处理:')
  
  try {
    await workerManager.calculate('nonexistent-calculator', testData)
    test('不存在的计算器应该被拒绝', false)
  } catch (error) {
    test('不存在的计算器应该被拒绝', true)
  }
  
  // 测试5: 性能统计
  console.log('\n📊 测试性能统计:')
  
  const stats = workerManager.getDetailedStats()
  test('统计数据应该正确', stats.totalRequests >= 6)
  test('Worker统计应该可用', stats.workers.length === 2)
  test('所有Worker都应该就绪', stats.workers.every(w => w.isReady))
  
  console.log('\n📈 Worker性能统计详情:')
  console.log(`   总Worker数: ${stats.totalWorkers}`)
  console.log(`   活跃Worker数: ${stats.activeWorkers}`)
  console.log(`   总请求数: ${stats.totalRequests}`)
  console.log(`   完成请求数: ${stats.completedRequests}`)
  console.log(`   错误请求数: ${stats.errorRequests}`)
  console.log(`   队列中请求数: ${stats.queuedRequests}`)
  
  stats.workers.forEach((worker, index) => {
    console.log(`   Worker ${index + 1}: ${worker.totalCalculations} 次计算, ${worker.errorCount} 次错误`)
  })
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 所有Web Worker集成测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查Worker集成实现。')
    return false
  }
}

// 运行测试
runWorkerIntegrationTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
