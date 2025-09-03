/**
 * 核心实时计算引擎测试
 * 验证实时计算引擎的基本功能
 */

// 模拟Vue的ref函数
function ref(value) {
  return {
    value,
    _isRef: true
  }
}

// 模拟lodash的debounce函数
function debounce(func, wait) {
  let timeout
  const debounced = function(...args) {
    const later = () => {
      clearTimeout(timeout)
      func.apply(this, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
  
  debounced.cancel = function() {
    clearTimeout(timeout)
  }
  
  return debounced
}

// 模拟计算器注册系统
const mockCalculatorRegistry = {
  getAllCalculators() {
    return [
      {
        id: 'compound-interest',
        name: 'Zinseszins-Rechner',
        category: 'compound-interest',
        validate: (input) => {
          const errors = []
          if (!input.principal || input.principal <= 0) {
            errors.push({ field: 'principal', message: 'Startkapital muss größer als 0 sein' })
          }
          if (!input.annualRate || input.annualRate <= 0) {
            errors.push({ field: 'annualRate', message: 'Zinssatz muss größer als 0 sein' })
          }
          if (!input.years || input.years <= 0) {
            errors.push({ field: 'years', message: 'Anlagedauer muss größer als 0 sein' })
          }
          return { isValid: errors.length === 0, errors }
        },
        calculate: async (input) => {
          // 模拟计算延迟
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const { principal, monthlyPayment = 0, annualRate, years } = input
          const monthlyRate = annualRate / 100 / 12
          const totalMonths = years * 12
          
          // 简化的复利计算
          const principalGrowth = principal * Math.pow(1 + monthlyRate, totalMonths)
          const monthlyGrowth = monthlyPayment > 0 
            ? monthlyPayment * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
            : 0
          
          const finalAmount = principalGrowth + monthlyGrowth
          const totalContributions = principal + (monthlyPayment * totalMonths)
          const totalInterest = finalAmount - totalContributions
          
          return {
            finalAmount,
            totalInterest,
            totalContributions,
            effectiveRate: annualRate
          }
        }
      },
      {
        id: 'savings-plan',
        name: 'Sparplan-Rechner',
        category: 'savings-plan',
        validate: (input) => ({ isValid: true, errors: [] }),
        calculate: async (input) => {
          await new Promise(resolve => setTimeout(resolve, 150))
          return {
            finalAmount: input.monthlyPayment * input.years * 12 * 1.05,
            totalInterest: input.monthlyPayment * input.years * 12 * 0.05,
            totalContributions: input.monthlyPayment * input.years * 12,
            effectiveRate: 5
          }
        }
      }
    ]
  }
}

// 防抖策略配置
const DEBOUNCE_STRATEGIES = {
  'compound-interest': { delay: 500, priority: 'high' },
  'savings-plan': { delay: 500, priority: 'high' },
  'loan': { delay: 600, priority: 'medium' },
  'mortgage': { delay: 700, priority: 'medium' },
  'retirement': { delay: 800, priority: 'low' },
  'portfolio': { delay: 900, priority: 'low' },
  'tax-optimization': { delay: 1000, priority: 'low' },
  'etf-savings-plan': { delay: 600, priority: 'medium' }
}

// LRU缓存实现
class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return undefined
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  has(key) {
    return this.cache.has(key)
  }

  clear() {
    this.cache.clear()
  }

  get size() {
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

// 核心实时计算引擎（简化版）
class RealtimeCalculationEngine {
  constructor() {
    this.calculators = new Map()
    this.cache = new LRUCache(100)
    this.debouncedCalculations = new Map()
    
    this.state = ref({
      isCalculating: false,
      activeRequests: 0,
      lastCalculated: null,
      calculationCount: 0,
      errorCount: 0,
      cacheHitCount: 0
    })

    this.initializeCalculators()
  }

  initializeCalculators() {
    const allCalculators = mockCalculatorRegistry.getAllCalculators()
    allCalculators.forEach(calculator => {
      this.calculators.set(calculator.id, calculator)
      
      const strategy = DEBOUNCE_STRATEGIES[calculator.id]
      if (strategy) {
        const debouncedFn = debounce(
          (data) => this.executeCalculation(calculator.id, data),
          strategy.delay
        )
        this.debouncedCalculations.set(calculator.id, debouncedFn)
      }
    })

    console.log(`✅ 实时计算引擎已初始化 ${this.calculators.size} 个计算器`)
  }

  generateCacheKey(calculatorId, data) {
    const sortedKeys = Object.keys(data).sort()
    const normalizedData = sortedKeys.reduce((acc, key) => {
      acc[key] = typeof data[key] === 'number' 
        ? Math.round(data[key] * 100) / 100
        : data[key]
      return acc
    }, {})
    
    return `${calculatorId}:${JSON.stringify(normalizedData)}`
  }

  validateInput(calculatorId, data) {
    const calculator = this.calculators.get(calculatorId)
    if (!calculator) {
      return {
        isValid: false,
        errors: [{ field: 'calculator', message: `计算器 ${calculatorId} 不存在` }]
      }
    }

    if (calculator.validate) {
      return calculator.validate(data)
    }

    return { isValid: true, errors: [] }
  }

  async executeCalculation(calculatorId, data) {
    const startTime = Date.now()
    
    try {
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
        const cachedResult = this.cache.get(cacheKey)
        console.log(`🎯 缓存命中: ${calculatorId}`)
        return cachedResult
      }

      // 执行计算
      const calculator = this.calculators.get(calculatorId)
      const result = await calculator.calculate(data)

      // 缓存结果
      this.cache.set(cacheKey, result)

      // 更新统计
      this.state.value.calculationCount++
      this.state.value.lastCalculated = new Date()

      console.log(`✅ 计算完成: ${calculatorId} (${Date.now() - startTime}ms)`)
      return result

    } catch (error) {
      this.state.value.errorCount++
      console.error(`❌ 计算失败: ${calculatorId}`, error)
      throw error
    } finally {
      this.state.value.activeRequests--
      if (this.state.value.activeRequests === 0) {
        this.state.value.isCalculating = false
      }
    }
  }

  async calculateImmediate(calculatorId, data) {
    return this.executeCalculation(calculatorId, data)
  }

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
      supportedCalculators: this.calculators.size
    }
  }

  clearCache() {
    this.cache.clear()
    console.log('🗑️ 计算缓存已清除')
  }
}

// 测试函数
async function runRealtimeEngineTests() {
  console.log('🧪 开始核心实时计算引擎测试...\n')
  
  const engine = new RealtimeCalculationEngine()
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
  
  // 测试1: 引擎初始化
  console.log('📋 测试引擎初始化:')
  test('引擎应该初始化2个计算器', engine.calculators.size === 2)
  test('缓存应该为空', engine.cache.size === 0)
  test('初始状态正确', !engine.state.value.isCalculating && engine.state.value.calculationCount === 0)
  
  // 测试2: 基本计算功能
  console.log('\n💼 测试基本计算功能:')
  
  const testData = {
    principal: 10000,
    monthlyPayment: 500,
    annualRate: 5,
    years: 10
  }
  
  try {
    const result = await engine.calculateImmediate('compound-interest', testData)
    test('复利计算应该成功', result && result.finalAmount > 0)
    test('结果应该包含必要字段', 
      result.finalAmount && result.totalInterest && result.totalContributions)
    test('计算统计应该更新', engine.state.value.calculationCount === 1)
  } catch (error) {
    test('复利计算应该成功', false)
    console.log('   错误:', error.message)
  }
  
  // 测试3: 缓存功能
  console.log('\n🎯 测试缓存功能:')
  
  try {
    // 第二次相同计算应该命中缓存
    const result2 = await engine.calculateImmediate('compound-interest', testData)
    test('第二次计算应该命中缓存', engine.state.value.cacheHitCount === 1)
    test('缓存大小应该为1', engine.cache.size === 1)
    
    // 不同数据应该产生新的计算
    const differentData = { ...testData, principal: 20000 }
    const result3 = await engine.calculateImmediate('compound-interest', differentData)
    test('不同数据应该产生新计算', engine.state.value.calculationCount === 2)
    test('缓存大小应该为2', engine.cache.size === 2)
  } catch (error) {
    test('缓存测试失败', false)
    console.log('   错误:', error.message)
  }
  
  // 测试4: 验证功能
  console.log('\n🔍 测试输入验证:')
  
  try {
    await engine.calculateImmediate('compound-interest', { principal: -1000 })
    test('负数本金应该被拒绝', false)
  } catch (error) {
    test('负数本金应该被拒绝', error.message.includes('验证失败'))
  }
  
  try {
    await engine.calculateImmediate('nonexistent-calculator', testData)
    test('不存在的计算器应该被拒绝', false)
  } catch (error) {
    test('不存在的计算器应该被拒绝', error.message.includes('不存在'))
  }
  
  // 测试5: 性能统计
  console.log('\n📊 测试性能统计:')
  
  const stats = engine.getPerformanceStats()
  test('统计数据应该正确', stats.totalCalculations >= 2)
  test('缓存命中率应该计算正确', stats.cacheHitRate > 0)
  test('支持的计算器数量正确', stats.supportedCalculators === 2)
  
  console.log('\n📈 性能统计详情:')
  console.log(`   总计算次数: ${stats.totalCalculations}`)
  console.log(`   错误次数: ${stats.errorCount}`)
  console.log(`   缓存命中率: ${stats.cacheHitRate}%`)
  console.log(`   缓存使用率: ${stats.cacheStats.usage.toFixed(1)}%`)
  console.log(`   支持的计算器: ${stats.supportedCalculators}`)
  
  // 测试6: 缓存清理
  console.log('\n🗑️ 测试缓存清理:')
  
  engine.clearCache()
  test('缓存清理后应该为空', engine.cache.size === 0)
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 所有核心实时计算引擎测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查引擎实现。')
    return false
  }
}

// 运行测试
runRealtimeEngineTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
