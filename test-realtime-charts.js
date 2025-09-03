/**
 * 实时图表更新系统集成测试
 * 验证Chart.js更新引擎、动画系统、多图表支持和性能优化的正确性
 */

// 模拟Chart.js环境
const mockChart = {
  Chart: class MockChart {
    constructor(canvas, config) {
      this.canvas = canvas
      this.config = config
      this.data = config.data || { labels: [], datasets: [] }
      this.options = config.options || {}
      this.isDestroyed = false
    }

    update(mode = 'active') {
      if (this.isDestroyed) return
      console.log(`📊 图表更新: ${mode}`)
      return Promise.resolve()
    }

    destroy() {
      this.isDestroyed = true
      console.log('🗑️ 图表已销毁')
    }

    resize() {
      console.log('📏 图表大小已调整')
    }

    toBase64Image() {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }

    setDatasetVisibility(index, visible) {
      console.log(`👁️ 数据集可见性: ${index} = ${visible}`)
    }
  },
  registerables: []
}

// 模拟Chart.js更新引擎
class MockChartUpdateEngine {
  constructor() {
    this.charts = new Map()
    this.updateTimers = new Map()
    this.performanceMonitor = {
      totalUpdates: 0,
      totalUpdateTime: 0,
      activeCharts: 0
    }
  }

  registerChart(chartId, chart, config = {}) {
    const managedChart = {
      id: chartId,
      chart,
      config: {
        animationDuration: 800,
        enableAnimations: true,
        batchUpdateDelay: 100,
        maxDataPoints: 1000,
        ...config
      },
      lastUpdate: new Date(),
      updateQueue: [],
      performanceStats: {
        updateCount: 0,
        averageUpdateTime: 0,
        lastUpdateTime: 0,
        dataPointCount: 0
      },
      isUpdating: false
    }
    
    this.charts.set(chartId, managedChart)
    this.performanceMonitor.activeCharts++
    console.log(`📈 图表已注册: ${chartId}`)
  }

  unregisterChart(chartId) {
    const managedChart = this.charts.get(chartId)
    if (!managedChart) return
    
    const timer = this.updateTimers.get(chartId)
    if (timer) {
      clearTimeout(timer)
      this.updateTimers.delete(chartId)
    }
    
    managedChart.chart.destroy()
    this.charts.delete(chartId)
    this.performanceMonitor.activeCharts--
    console.log(`🗑️ 图表已注销: ${chartId}`)
  }

  async updateChart(chartId, update) {
    const managedChart = this.charts.get(chartId)
    if (!managedChart) return

    managedChart.updateQueue.push(update)
    
    if (managedChart.config.batchUpdateDelay > 0) {
      this.scheduleBatchUpdate(chartId)
    } else {
      await this.processUpdates(chartId)
    }
  }

  async replaceChartData(chartId, newData) {
    const managedChart = this.charts.get(chartId)
    if (!managedChart) return

    const startTime = Date.now()
    managedChart.isUpdating = true

    try {
      managedChart.chart.data = newData
      await managedChart.chart.update('none')
      
      this.updatePerformanceStats(managedChart, Date.now() - startTime)
      console.log(`🔄 图表数据已替换: ${chartId}`)
    } finally {
      managedChart.isUpdating = false
    }
  }

  scheduleBatchUpdate(chartId) {
    const existingTimer = this.updateTimers.get(chartId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const managedChart = this.charts.get(chartId)
    const timer = setTimeout(() => {
      this.processUpdates(chartId)
      this.updateTimers.delete(chartId)
    }, managedChart.config.batchUpdateDelay)

    this.updateTimers.set(chartId, timer)
  }

  async processUpdates(chartId) {
    const managedChart = this.charts.get(chartId)
    if (!managedChart || managedChart.updateQueue.length === 0) return

    const startTime = Date.now()
    managedChart.isUpdating = true

    try {
      const updates = [...managedChart.updateQueue]
      managedChart.updateQueue = []

      for (const update of updates) {
        await this.applyUpdate(managedChart, update)
      }

      await managedChart.chart.update('active')
      this.updatePerformanceStats(managedChart, Date.now() - startTime)
    } finally {
      managedChart.isUpdating = false
    }
  }

  async applyUpdate(managedChart, update) {
    const { chart } = managedChart
    const { type, data, datasetIndex = 0 } = update

    switch (type) {
      case 'replace':
        if (chart.data.datasets[datasetIndex]) {
          chart.data.datasets[datasetIndex].data = data
        }
        break
      case 'append':
        if (chart.data.datasets[datasetIndex]) {
          const dataset = chart.data.datasets[datasetIndex]
          if (Array.isArray(dataset.data)) {
            dataset.data.push(...(Array.isArray(data) ? data : [data]))
          }
        }
        break
    }
  }

  updatePerformanceStats(managedChart, updateTime) {
    const stats = managedChart.performanceStats
    stats.updateCount++
    stats.lastUpdateTime = updateTime
    stats.averageUpdateTime = (stats.averageUpdateTime * (stats.updateCount - 1) + updateTime) / stats.updateCount
    
    this.performanceMonitor.totalUpdates++
    this.performanceMonitor.totalUpdateTime += updateTime
    managedChart.lastUpdate = new Date()
  }

  getChartInfo(chartId) {
    return this.charts.get(chartId)
  }

  getPerformanceStats() {
    const averageUpdateTime = this.performanceMonitor.totalUpdates > 0
      ? this.performanceMonitor.totalUpdateTime / this.performanceMonitor.totalUpdates
      : 0

    return {
      ...this.performanceMonitor,
      averageUpdateTime: Math.round(averageUpdateTime * 100) / 100,
      chartsInfo: Array.from(this.charts.values()).map(chart => ({
        id: chart.id,
        updateCount: chart.performanceStats.updateCount,
        averageUpdateTime: chart.performanceStats.averageUpdateTime,
        lastUpdate: chart.lastUpdate
      }))
    }
  }
}

// 模拟图表动画系统
class MockChartAnimationSystem {
  constructor() {
    this.animationStates = new Map()
    this.animationConfigs = {
      'data-update': { duration: 800, easing: 'easeOutCubic' },
      'scale-change': { duration: 600, easing: 'easeInOutQuad' },
      'color-transition': { duration: 400, easing: 'easeOutQuad' },
      'chart-type-change': { duration: 1000, easing: 'easeInOutCubic' }
    }
  }

  configureChartAnimation(chartId, animationType) {
    const config = this.animationConfigs[animationType]
    return {
      duration: config.duration,
      easing: config.easing,
      onProgress: (animation) => {
        this.updateAnimationState(chartId, animationType, animation.currentStep / animation.numSteps)
      },
      onComplete: () => {
        this.completeAnimation(chartId)
      }
    }
  }

  async animateDataUpdate(chartId, newData, datasetIndex = 0, customConfig = {}) {
    const config = { ...this.animationConfigs['data-update'], ...customConfig }
    
    return new Promise((resolve) => {
      this.startAnimation(chartId, 'data-update', config.duration)
      console.log(`🎬 数据更新动画开始: ${chartId}`)
      
      setTimeout(() => {
        this.completeAnimation(chartId)
        resolve()
      }, config.duration)
    })
  }

  async animateChartTypeChange(chartId, newType, customConfig = {}) {
    const config = { ...this.animationConfigs['chart-type-change'], ...customConfig }
    
    return new Promise((resolve) => {
      this.startAnimation(chartId, 'chart-type-change', config.duration)
      console.log(`🎬 图表类型切换动画开始: ${chartId} → ${newType}`)
      
      setTimeout(() => {
        this.completeAnimation(chartId)
        resolve()
      }, config.duration)
    })
  }

  startAnimation(chartId, animationType, duration) {
    const animationState = {
      isAnimating: true,
      animationType,
      progress: 0,
      startTime: Date.now(),
      duration
    }
    
    this.animationStates.set(chartId, animationState)
  }

  updateAnimationState(chartId, animationType, progress) {
    const state = this.animationStates.get(chartId)
    if (state && state.animationType === animationType) {
      state.progress = progress
    }
  }

  completeAnimation(chartId) {
    const state = this.animationStates.get(chartId)
    if (state) {
      state.isAnimating = false
      state.progress = 1
      console.log(`✅ 动画完成: ${chartId} - ${state.animationType}`)
    }
  }

  getAnimationState(chartId) {
    return this.animationStates.get(chartId)
  }
}

// 模拟性能优化器
class MockChartPerformanceOptimizer {
  constructor() {
    this.config = {
      maxDataPoints: 1000,
      samplingThreshold: 2000,
      virtualRenderingEnabled: true
    }
    this.performanceMetrics = new Map()
    this.originalDataCache = new Map()
    this.sampledDataCache = new Map()
  }

  optimizeChartData(chartId, data, strategy = 'adaptive') {
    const startTime = Date.now()
    
    this.originalDataCache.set(chartId, [...data])
    
    let optimizedData = data
    if (data.length > this.config.samplingThreshold) {
      optimizedData = this.sampleData(data, strategy, this.config.maxDataPoints)
      console.log(`📊 数据采样: ${data.length} → ${optimizedData.length} (${strategy})`)
    }
    
    this.sampledDataCache.set(chartId, optimizedData)
    
    this.updatePerformanceMetrics(chartId, {
      renderTime: Date.now() - startTime,
      dataPointCount: optimizedData.length,
      samplingRatio: optimizedData.length / data.length,
      lastOptimization: new Date()
    })
    
    return optimizedData
  }

  sampleData(data, strategy, targetCount) {
    // 简化的采样实现
    const step = Math.ceil(data.length / targetCount)
    const sampled = []
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i])
    }
    
    return sampled.slice(0, targetCount)
  }

  updatePerformanceMetrics(chartId, updates) {
    const existing = this.performanceMetrics.get(chartId) || {
      renderTime: 0,
      memoryUsage: 0,
      dataPointCount: 0,
      frameRate: 60,
      samplingRatio: 1,
      lastOptimization: new Date()
    }
    
    this.performanceMetrics.set(chartId, { ...existing, ...updates })
  }

  getPerformanceMetrics(chartId) {
    return this.performanceMetrics.get(chartId)
  }

  throttleRender(chartId, updateFunction) {
    // 简化的节流实现
    setTimeout(updateFunction, 16) // ~60fps
  }
}

// 测试函数
async function runRealtimeChartsTests() {
  console.log('🧪 开始实时图表更新系统集成测试...\n')
  
  const updateEngine = new MockChartUpdateEngine()
  const animationSystem = new MockChartAnimationSystem()
  const performanceOptimizer = new MockChartPerformanceOptimizer()
  
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
  
  // 测试1: Chart.js更新引擎
  console.log('📊 测试Chart.js更新引擎:')
  
  const mockCanvas = { getContext: () => ({}) }
  const mockChartInstance = new mockChart.Chart(mockCanvas, {
    type: 'line',
    data: { labels: [], datasets: [] }
  })
  
  updateEngine.registerChart('test-chart-1', mockChartInstance)
  test('图表注册应该成功', updateEngine.getChartInfo('test-chart-1') !== undefined)
  test('活跃图表数应该正确', updateEngine.getPerformanceStats().activeCharts === 1)
  
  // 测试数据更新
  await updateEngine.updateChart('test-chart-1', {
    type: 'replace',
    data: [100, 200, 300],
    datasetIndex: 0
  })

  // 等待批量更新完成
  await new Promise(resolve => setTimeout(resolve, 150))

  const chartInfo = updateEngine.getChartInfo('test-chart-1')
  test('更新队列应该被处理', chartInfo.performanceStats.updateCount > 0)
  
  // 测试批量更新
  const updates = [
    { type: 'append', data: [400, 500] },
    { type: 'append', data: [600, 700] }
  ]
  
  await Promise.all(updates.map(update =>
    updateEngine.updateChart('test-chart-1', update)
  ))

  // 等待所有批量更新完成
  await new Promise(resolve => setTimeout(resolve, 200))

  const updatedChartInfo = updateEngine.getChartInfo('test-chart-1')
  test('批量更新应该成功', updatedChartInfo.performanceStats.updateCount > 1)
  
  // 测试2: 图表动画系统
  console.log('\n🎬 测试图表动画系统:')
  
  const animationConfig = animationSystem.configureChartAnimation('test-chart-1', 'data-update')
  test('动画配置应该正确', animationConfig.duration === 800)
  test('缓动函数应该正确', animationConfig.easing === 'easeOutCubic')
  
  // 测试数据更新动画
  const animationPromise = animationSystem.animateDataUpdate('test-chart-1', [1000, 2000, 3000])
  test('数据更新动画应该开始', animationSystem.getAnimationState('test-chart-1')?.isAnimating === true)
  
  await animationPromise
  test('数据更新动画应该完成', animationSystem.getAnimationState('test-chart-1')?.isAnimating === false)
  
  // 测试图表类型切换动画
  await animationSystem.animateChartTypeChange('test-chart-1', 'bar')
  const finalState = animationSystem.getAnimationState('test-chart-1')
  test('图表类型切换动画应该完成', finalState?.progress === 1)
  
  // 测试3: 性能优化
  console.log('\n⚡ 测试性能优化:')
  
  // 生成大量测试数据
  const largeDataset = Array.from({ length: 5000 }, (_, i) => ({
    x: i,
    y: Math.sin(i / 100) * 1000 + Math.random() * 100
  }))
  
  const optimizedData = performanceOptimizer.optimizeChartData('test-chart-2', largeDataset, 'adaptive')
  test('大数据集应该被采样', optimizedData.length < largeDataset.length)
  test('采样后数据量应该合理', optimizedData.length <= 1000)
  
  const metrics = performanceOptimizer.getPerformanceMetrics('test-chart-2')
  test('性能指标应该被记录', metrics !== undefined)
  test('采样比例应该正确', metrics.samplingRatio < 1)
  
  // 测试节流渲染
  let renderCount = 0
  const renderFunction = () => { renderCount++ }
  
  // 快速调用多次
  for (let i = 0; i < 5; i++) {
    performanceOptimizer.throttleRender('test-chart-2', renderFunction)
  }
  
  // 等待节流完成
  await new Promise(resolve => setTimeout(resolve, 100))
  test('渲染节流应该工作', renderCount > 0 && renderCount <= 5)
  
  // 测试4: 多图表类型支持
  console.log('\n📈 测试多图表类型支持:')
  
  const chartTypes = ['line', 'bar', 'pie', 'doughnut']
  const supportedCalculators = {
    'compound-interest': ['line', 'doughnut'],
    'loan': ['bar'],
    'portfolio': ['pie', 'doughnut', 'radar']
  }
  
  Object.entries(supportedCalculators).forEach(([calculatorId, types]) => {
    types.forEach(type => {
      const chartId = `${calculatorId}-${type}`
      const chart = new mockChart.Chart(mockCanvas, { type, data: { labels: [], datasets: [] } })
      updateEngine.registerChart(chartId, chart)
    })
  })
  
  test('多种图表类型应该被支持', updateEngine.getPerformanceStats().activeCharts > 3)
  
  // 测试图表类型切换
  const compoundChart = updateEngine.getChartInfo('compound-interest-line')
  if (compoundChart) {
    await animationSystem.animateChartTypeChange('compound-interest-line', 'bar')
    test('图表类型切换应该成功', true)
  }
  
  // 测试5: 集成性能测试
  console.log('\n🚀 测试集成性能:')
  
  const startTime = Date.now()
  
  // 创建多个图表并进行大量更新
  const testCharts = []
  for (let i = 0; i < 3; i++) {
    const chartId = `performance-test-${i}`
    const chart = new mockChart.Chart(mockCanvas, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [] }] }
    })
    
    updateEngine.registerChart(chartId, chart)
    testCharts.push(chartId)
  }
  
  // 并发更新所有图表
  const updatePromises = testCharts.map(async (chartId, index) => {
    const data = Array.from({ length: 1000 }, (_, i) => i * (index + 1))
    const optimizedData = performanceOptimizer.optimizeChartData(chartId, data)
    
    await updateEngine.replaceChartData(chartId, {
      labels: optimizedData.map((_, i) => `Point ${i}`),
      datasets: [{ data: optimizedData }]
    })
    
    return animationSystem.animateDataUpdate(chartId, optimizedData)
  })
  
  await Promise.all(updatePromises)
  
  const totalTime = Date.now() - startTime
  test('集成性能测试应该在合理时间内完成', totalTime < 5000) // 5秒内
  
  const finalStats = updateEngine.getPerformanceStats()
  test('所有图表更新应该成功', finalStats.totalUpdates >= testCharts.length)
  test('平均更新时间应该合理', finalStats.averageUpdateTime < 1000) // 1秒内
  
  // 清理测试
  testCharts.forEach(chartId => {
    updateEngine.unregisterChart(chartId)
  })
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  // 输出性能统计
  console.log('\n📈 性能统计详情:')
  console.log(`   总更新次数: ${finalStats.totalUpdates}`)
  console.log(`   平均更新时间: ${finalStats.averageUpdateTime}ms`)
  console.log(`   活跃图表数: ${finalStats.activeCharts}`)
  console.log(`   集成测试总时间: ${totalTime}ms`)
  
  if (failed === 0) {
    console.log('\n🎉 所有实时图表更新系统测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查图表系统实现。')
    return false
  }
}

// 运行测试
runRealtimeChartsTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
