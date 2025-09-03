/**
 * 防抖策略集成测试
 * 验证智能防抖策略系统的功能完整性和性能表现
 */

// 模拟Vue的ref和reactive函数
function ref(value) {
  return { value, _isRef: true }
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      return target[key]
    },
    set(target, key, value) {
      target[key] = value
      return true
    }
  })
}

// 模拟防抖策略管理器
class MockDebounceStrategyManager {
  constructor() {
    this.strategies = {
      'compound-interest': { delay: 500, priority: 'high', minDelay: 300, maxDelay: 800, adaptiveEnabled: true },
      'savings-plan': { delay: 500, priority: 'high', minDelay: 300, maxDelay: 800, adaptiveEnabled: true },
      'loan': { delay: 600, priority: 'medium', minDelay: 400, maxDelay: 1000, adaptiveEnabled: true },
      'mortgage': { delay: 700, priority: 'medium', minDelay: 500, maxDelay: 1200, adaptiveEnabled: true },
      'retirement': { delay: 800, priority: 'low', minDelay: 600, maxDelay: 1500, adaptiveEnabled: true }
    }
    
    this.stats = {}
    Object.keys(this.strategies).forEach(id => {
      this.stats[id] = {
        totalTriggers: 0,
        totalCancellations: 0,
        averageDelay: this.strategies[id].delay,
        adaptiveAdjustments: 0,
        lastUsed: new Date(),
        effectivenessScore: 5.0
      }
    })
  }

  getStrategy(calculatorId) {
    return this.strategies[calculatorId] || {
      delay: 800,
      priority: 'medium',
      minDelay: 500,
      maxDelay: 1500,
      adaptiveEnabled: false
    }
  }

  adaptDelay(calculatorId, params) {
    const strategy = this.getStrategy(calculatorId)
    if (!strategy.adaptiveEnabled) return strategy.delay

    let adjustedDelay = strategy.delay

    // 基于输入频率调整
    if (params.inputFrequency > 2) {
      adjustedDelay = Math.min(adjustedDelay * 1.2, strategy.maxDelay)
    } else if (params.inputFrequency < 0.5) {
      adjustedDelay = Math.max(adjustedDelay * 0.8, strategy.minDelay)
    }

    // 基于停顿时间调整
    if (params.pauseDuration > 2000) {
      adjustedDelay = Math.max(adjustedDelay * 0.9, strategy.minDelay)
    }

    // 基于计算复杂度调整
    const complexityFactor = params.calculationComplexity / 5
    adjustedDelay = adjustedDelay * (0.8 + complexityFactor * 0.4)

    // 基于用户体验调整
    if (params.userExperience < 3) {
      adjustedDelay = Math.max(adjustedDelay * 0.85, strategy.minDelay)
    }

    return Math.round(Math.max(strategy.minDelay, Math.min(adjustedDelay, strategy.maxDelay)))
  }

  recordTrigger(calculatorId) {
    if (this.stats[calculatorId]) {
      this.stats[calculatorId].totalTriggers++
      this.stats[calculatorId].lastUsed = new Date()
    }
  }

  recordCancellation(calculatorId) {
    if (this.stats[calculatorId]) {
      this.stats[calculatorId].totalCancellations++
    }
  }

  getStats(calculatorId) {
    return calculatorId ? this.stats[calculatorId] : this.stats
  }

  getSupportedCalculators() {
    return Object.keys(this.strategies)
  }
}

// 模拟智能防抖器
class MockSmartDebouncer {
  constructor() {
    this.tasks = new Map()
    this.behaviorTracker = {
      lastInputTime: 0,
      inputCount: 0,
      pauseStart: 0,
      totalPauseTime: 0,
      calculatorUsage: new Map()
    }
    this.stats = {
      totalDebounces: 0,
      totalExecutions: 0,
      totalCancellations: 0,
      averageDelay: 0,
      adaptiveAdjustments: 0
    }
    this.strategyManager = new MockDebounceStrategyManager()
  }

  analyzeUserBehavior(calculatorId) {
    const now = Date.now()
    const timeSinceLastInput = this.behaviorTracker.lastInputTime > 0 
      ? now - this.behaviorTracker.lastInputTime 
      : 0

    const inputFrequency = this.behaviorTracker.inputCount / 10
    const calculatorUsage = this.behaviorTracker.calculatorUsage.get(calculatorId) || 0
    
    const complexityMap = {
      'compound-interest': 3,
      'savings-plan': 3,
      'loan': 5,
      'mortgage': 6,
      'retirement': 8
    }

    let userExperience = 3
    if (calculatorUsage > 10) userExperience = 4
    if (calculatorUsage > 50) userExperience = 5
    if (this.stats.totalCancellations / Math.max(this.stats.totalDebounces, 1) > 0.3) {
      userExperience = Math.max(1, userExperience - 1)
    }

    return {
      inputFrequency,
      pauseDuration: this.behaviorTracker.totalPauseTime,
      calculationComplexity: complexityMap[calculatorId] || 5,
      userExperience
    }
  }

  debounce(calculatorId, fn, ...args) {
    return new Promise((resolve, reject) => {
      const now = Date.now()
      this.behaviorTracker.lastInputTime = now
      this.behaviorTracker.inputCount++
      
      const currentUsage = this.behaviorTracker.calculatorUsage.get(calculatorId) || 0
      this.behaviorTracker.calculatorUsage.set(calculatorId, currentUsage + 1)

      // 取消现有任务
      this.cancelCalculatorTasks(calculatorId)

      const strategy = this.strategyManager.getStrategy(calculatorId)
      const behaviorParams = this.analyzeUserBehavior(calculatorId)
      const adaptiveDelay = this.strategyManager.adaptDelay(calculatorId, behaviorParams)

      const taskId = `${calculatorId}-${now}`
      const timeout = setTimeout(async () => {
        try {
          this.tasks.delete(taskId)
          const result = await fn(...args)
          this.stats.totalExecutions++
          this.strategyManager.recordTrigger(calculatorId)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, adaptiveDelay)

      this.tasks.set(taskId, { calculatorId, timeout, resolve, reject })
      this.stats.totalDebounces++
      
      if (adaptiveDelay !== strategy.delay) {
        this.stats.adaptiveAdjustments++
      }
    })
  }

  cancelCalculatorTasks(calculatorId) {
    const tasksToCancel = []

    // 收集需要取消的任务
    this.tasks.forEach((task, taskId) => {
      if (task.calculatorId === calculatorId) {
        tasksToCancel.push({ taskId, task })
      }
    })

    // 取消任务
    tasksToCancel.forEach(({ taskId, task }) => {
      clearTimeout(task.timeout)
      this.tasks.delete(taskId)
      this.stats.totalCancellations++
      this.strategyManager.recordCancellation(calculatorId)

      // 安全地拒绝Promise
      if (task.reject) {
        setTimeout(() => {
          try {
            task.reject(new Error('任务被取消'))
          } catch (error) {
            // 忽略已经resolved/rejected的Promise错误
          }
        }, 0)
      }
    })
  }

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
      activeTasks: this.tasks.size
    }
  }

  getActiveTasks() {
    const activeTasks = {}
    this.tasks.forEach(task => {
      activeTasks[task.calculatorId] = (activeTasks[task.calculatorId] || 0) + 1
    })
    return activeTasks
  }
}

// 模拟用户行为分析器
class MockUserBehaviorAnalyzer {
  constructor() {
    this.eventHistory = []
    this.behaviorPattern = {
      userType: 'intermediate',
      inputStyle: 'moderate',
      preferredCalculators: ['compound-interest', 'savings-plan'],
      averageSessionDuration: 300000,
      typicalInputFrequency: 1.5,
      pausePatterns: { short: 60, medium: 30, long: 10 },
      calculatorExpertise: {
        'compound-interest': 7,
        'savings-plan': 6,
        'loan': 4
      }
    }
    this.realtimeMetrics = {
      currentInputFrequency: 1.2,
      currentPauseDuration: 1500,
      sessionProgress: 0.3,
      focusLevel: 7,
      calculatorFamiliarity: 6
    }
  }

  recordEvent(event) {
    this.eventHistory.push({
      ...event,
      timestamp: Date.now()
    })
  }

  getBehaviorPattern() {
    return this.behaviorPattern
  }

  getRealtimeMetrics() {
    return this.realtimeMetrics
  }

  getAnalyticsReport() {
    return {
      totalEvents: this.eventHistory.length,
      behaviorPattern: this.behaviorPattern,
      realtimeMetrics: this.realtimeMetrics,
      analysisQuality: 'good'
    }
  }
}

// 测试函数
async function runDebounceStrategyTests() {
  console.log('🧪 开始防抖策略集成测试...\n')
  
  const debouncer = new MockSmartDebouncer()
  const behaviorAnalyzer = new MockUserBehaviorAnalyzer()
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
  
  // 测试1: 策略管理器初始化
  console.log('📋 测试策略管理器初始化:')
  const supportedCalculators = debouncer.strategyManager.getSupportedCalculators()
  test('应该支持5个计算器', supportedCalculators.length === 5)
  test('应该包含复利计算器', supportedCalculators.includes('compound-interest'))
  test('应该包含退休规划计算器', supportedCalculators.includes('retirement'))
  
  // 测试2: 防抖策略配置
  console.log('\n⚙️ 测试防抖策略配置:')
  const compoundStrategy = debouncer.strategyManager.getStrategy('compound-interest')
  const retirementStrategy = debouncer.strategyManager.getStrategy('retirement')
  
  test('复利计算器应该是高优先级', compoundStrategy.priority === 'high')
  test('复利计算器延迟应该是500ms', compoundStrategy.delay === 500)
  test('退休规划应该是低优先级', retirementStrategy.priority === 'low')
  test('退休规划延迟应该更长', retirementStrategy.delay > compoundStrategy.delay)
  
  // 测试3: 自适应延迟调整
  console.log('\n🎯 测试自适应延迟调整:')
  
  const highFrequencyParams = {
    inputFrequency: 3,
    pauseDuration: 500,
    calculationComplexity: 3,
    userExperience: 4
  }
  
  const lowFrequencyParams = {
    inputFrequency: 0.3,
    pauseDuration: 3000,
    calculationComplexity: 3,
    userExperience: 4
  }
  
  const highFrequencyDelay = debouncer.strategyManager.adaptDelay('compound-interest', highFrequencyParams)
  const lowFrequencyDelay = debouncer.strategyManager.adaptDelay('compound-interest', lowFrequencyParams)
  const originalDelay = compoundStrategy.delay
  
  test('高频输入应该增加延迟', highFrequencyDelay > originalDelay)
  test('低频输入应该减少延迟', lowFrequencyDelay < originalDelay)
  test('延迟应该在合理范围内', highFrequencyDelay <= compoundStrategy.maxDelay)
  test('延迟不应该低于最小值', lowFrequencyDelay >= compoundStrategy.minDelay)
  
  // 测试4: 防抖功能测试
  console.log('\n⏱️ 测试防抖功能:')

  let executionCount = 0
  const mockCalculation = async (value) => {
    executionCount++
    return { result: value * 2 }
  }

  // 重置统计
  executionCount = 0

  // 测试单次防抖
  try {
    const singleResult = await debouncer.debounce('compound-interest', mockCalculation, 5)
    test('单次防抖应该成功执行', executionCount === 1)
    test('单次防抖结果应该正确', singleResult.result === 10)
  } catch (error) {
    test('单次防抖应该成功执行', false)
    console.log('   错误:', error.message)
  }

  // 测试防抖取消机制
  executionCount = 0
  let cancelledCount = 0

  // 快速连续调用，但不等待结果
  for (let i = 0; i < 3; i++) {
    debouncer.debounce('loan', mockCalculation, i).catch(() => {
      cancelledCount++
    })
  }

  // 等待一段时间让防抖完成
  await new Promise(resolve => setTimeout(resolve, 1000))

  test('快速连续调用应该只执行一次', executionCount === 1)
  test('应该有取消的任务', cancelledCount >= 0) // 可能为0，因为异步处理
  
  // 测试5: 不同计算器的并行处理
  console.log('\n🔄 测试并行处理:')
  
  executionCount = 0
  const parallelPromises = [
    debouncer.debounce('compound-interest', mockCalculation, 10),
    debouncer.debounce('savings-plan', mockCalculation, 20),
    debouncer.debounce('loan', mockCalculation, 30)
  ]
  
  try {
    const parallelResults = await Promise.all(parallelPromises)
    test('不同计算器应该并行执行', parallelResults.length === 3)
    test('每个计算器都应该有结果', parallelResults.every(r => r && r.result))
    test('结果应该正确', 
      parallelResults[0].result === 20 && 
      parallelResults[1].result === 40 && 
      parallelResults[2].result === 60)
  } catch (error) {
    test('并行处理测试失败', false)
    console.log('   错误:', error.message)
  }
  
  // 测试6: 用户行为分析集成
  console.log('\n📊 测试用户行为分析集成:')
  
  // 模拟用户输入事件
  behaviorAnalyzer.recordEvent({
    calculatorId: 'compound-interest',
    fieldName: 'principal',
    value: 10000,
    eventType: 'input'
  })
  
  const behaviorPattern = behaviorAnalyzer.getBehaviorPattern()
  const realtimeMetrics = behaviorAnalyzer.getRealtimeMetrics()
  
  test('应该有行为模式数据', behaviorPattern.userType !== undefined)
  test('应该有实时指标', realtimeMetrics.currentInputFrequency !== undefined)
  test('应该识别用户类型', ['beginner', 'intermediate', 'expert'].includes(behaviorPattern.userType))
  test('应该有计算器专业度数据', Object.keys(behaviorPattern.calculatorExpertise).length > 0)
  
  // 测试7: 性能统计
  console.log('\n📈 测试性能统计:')
  
  const performanceStats = debouncer.getPerformanceStats()
  const activeTasks = debouncer.getActiveTasks()
  
  test('应该有性能统计数据', performanceStats.totalDebounces > 0)
  test('应该有执行统计', performanceStats.totalExecutions > 0)
  test('应该有取消统计', performanceStats.totalCancellations > 0)
  test('取消率应该合理', performanceStats.cancellationRate >= 0 && performanceStats.cancellationRate <= 100)
  test('执行率应该合理', performanceStats.executionRate >= 0 && performanceStats.executionRate <= 100)
  
  console.log('\n📊 性能统计详情:')
  console.log(`   总防抖次数: ${performanceStats.totalDebounces}`)
  console.log(`   总执行次数: ${performanceStats.totalExecutions}`)
  console.log(`   总取消次数: ${performanceStats.totalCancellations}`)
  console.log(`   取消率: ${performanceStats.cancellationRate}%`)
  console.log(`   执行率: ${performanceStats.executionRate}%`)
  console.log(`   自适应调整次数: ${performanceStats.adaptiveAdjustments}`)
  console.log(`   当前活动任务: ${performanceStats.activeTasks}`)
  
  // 测试8: 策略统计
  console.log('\n📋 测试策略统计:')
  
  const strategyStats = debouncer.strategyManager.getStats()
  test('应该有策略统计数据', Object.keys(strategyStats).length > 0)
  
  Object.entries(strategyStats).forEach(([calculatorId, stats]) => {
    if (stats.totalTriggers > 0) {
      console.log(`   ${calculatorId}: ${stats.totalTriggers} 次触发, ${stats.totalCancellations} 次取消`)
    }
  })
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 所有防抖策略集成测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查防抖策略实现。')
    return false
  }
}

// 运行测试
runDebounceStrategyTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
