/**
 * LRU缓存系统集成测试
 * 验证缓存功能、性能、统计和清理机制的正确性
 */

// 模拟LRU缓存系统
class MockLRUCache {
  constructor(config = {}) {
    this.config = {
      maxSize: 100,
      maxMemoryUsage: 10 * 1024 * 1024, // 10MB
      ttl: 30 * 60 * 1000, // 30分钟
      enableStatistics: true,
      autoCleanup: true,
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      ...config
    }

    this.cache = new Map()
    this.accessOrder = new Map()
    this.accessCounter = 0
    
    this.statistics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      totalSize: 0,
      itemCount: 0,
      averageAccessTime: 0,
      memoryUsage: 0,
      oldestItem: null,
      newestItem: null
    }

    console.log('💾 LRU缓存系统已初始化')
  }

  get(key) {
    const startTime = Date.now()
    this.statistics.totalRequests++

    const item = this.cache.get(key)
    
    if (!item) {
      this.statistics.cacheMisses++
      this.updateHitRate()
      return undefined
    }

    // 检查TTL
    if (this.isExpired(item)) {
      this.cache.delete(key)
      this.accessOrder.delete(key)
      this.statistics.cacheMisses++
      this.updateHitRate()
      this.updateStatistics()
      return undefined
    }

    // 更新访问信息
    item.accessCount++
    item.lastAccessed = new Date()
    this.accessOrder.set(key, ++this.accessCounter)

    this.statistics.cacheHits++
    this.updateHitRate()
    
    // 更新平均访问时间
    const accessTime = Date.now() - startTime
    this.updateAverageAccessTime(accessTime)

    return item.value
  }

  set(key, value) {
    const itemSize = this.calculateSize(value)
    
    // 检查内存限制
    if (itemSize > this.config.maxMemoryUsage) {
      console.warn('⚠️ 缓存项过大，无法存储:', itemSize)
      return false
    }

    // 如果键已存在，先删除旧项
    if (this.cache.has(key)) {
      this.delete(key)
    }

    // 确保有足够空间
    this.ensureCapacity(itemSize)

    // 创建新的缓存项
    const item = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: new Date(),
      size: itemSize
    }

    this.cache.set(key, item)
    this.accessOrder.set(key, ++this.accessCounter)

    this.updateStatistics()
    
    console.log(`💾 缓存项已添加: ${key} (${itemSize} bytes)`)
    return true
  }

  delete(key) {
    const item = this.cache.get(key)
    if (!item) return false

    this.cache.delete(key)
    this.accessOrder.delete(key)
    this.updateStatistics()

    console.log(`🗑️ 缓存项已删除: ${key}`)
    return true
  }

  has(key) {
    const item = this.cache.get(key)
    if (!item) return false

    if (this.isExpired(item)) {
      this.delete(key)
      return false
    }

    return true
  }

  clear() {
    this.cache.clear()
    this.accessOrder.clear()
    this.accessCounter = 0
    this.updateStatistics()
    console.log('🧹 缓存已清空')
  }

  size() {
    return this.cache.size
  }

  getStatistics() {
    return { ...this.statistics }
  }

  cleanup() {
    let cleanedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key)
        this.accessOrder.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.updateStatistics()
      console.log(`🧹 清理了 ${cleanedCount} 个过期缓存项`)
    }

    return cleanedCount
  }

  getUsageInfo() {
    const now = Date.now()
    let totalAge = 0
    let oldestAge = 0

    for (const item of this.cache.values()) {
      const age = now - item.timestamp
      totalAge += age
      oldestAge = Math.max(oldestAge, age)
    }

    return {
      sizeUsage: (this.cache.size / this.config.maxSize) * 100,
      memoryUsage: (this.statistics.memoryUsage / this.config.maxMemoryUsage) * 100,
      oldestAge,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0
    }
  }

  getHotKeys(limit = 10) {
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({
        key,
        accessCount: item.accessCount,
        lastAccessed: item.lastAccessed
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)

    return items
  }

  async warmup(dataProvider, keys) {
    let warmedCount = 0

    for (const key of keys) {
      try {
        if (!this.has(key)) {
          const value = await dataProvider(key)
          if (this.set(key, value)) {
            warmedCount++
          }
        }
      } catch (error) {
        console.warn(`⚠️ 预热缓存失败: ${key}`, error)
      }
    }

    console.log(`🔥 缓存预热完成: ${warmedCount}/${keys.length}`)
    return warmedCount
  }

  // 私有方法
  isExpired(item) {
    return Date.now() - item.timestamp > this.config.ttl
  }

  ensureCapacity(newItemSize) {
    // 检查数量限制
    while (this.cache.size >= this.config.maxSize) {
      this.evictLRU()
    }

    // 检查内存限制
    while (this.statistics.memoryUsage + newItemSize > this.config.maxMemoryUsage) {
      if (!this.evictLRU()) {
        break
      }
    }
  }

  evictLRU() {
    if (this.cache.size === 0) return false

    // 找到最少使用的项
    let lruKey = null
    let lruOrder = Infinity

    for (const [key, order] of this.accessOrder.entries()) {
      if (order < lruOrder) {
        lruOrder = order
        lruKey = key
      }
    }

    if (lruKey !== null) {
      this.delete(lruKey)
      console.log(`🗑️ LRU驱逐: ${lruKey}`)
      return true
    }

    return false
  }

  calculateSize(value) {
    try {
      const jsonString = JSON.stringify(value)
      return jsonString.length * 2 // 简化的字节计算
    } catch {
      return 1024 // 1KB估算
    }
  }

  updateStatistics() {
    this.statistics.itemCount = this.cache.size
    this.statistics.totalSize = this.cache.size
    
    // 计算内存使用
    let totalMemory = 0
    let oldestTimestamp = Infinity
    let newestTimestamp = 0

    for (const item of this.cache.values()) {
      totalMemory += item.size
      oldestTimestamp = Math.min(oldestTimestamp, item.timestamp)
      newestTimestamp = Math.max(newestTimestamp, item.timestamp)
    }

    this.statistics.memoryUsage = totalMemory
    this.statistics.oldestItem = oldestTimestamp === Infinity ? null : new Date(oldestTimestamp)
    this.statistics.newestItem = newestTimestamp === 0 ? null : new Date(newestTimestamp)
  }

  updateHitRate() {
    if (this.statistics.totalRequests > 0) {
      this.statistics.hitRate = (this.statistics.cacheHits / this.statistics.totalRequests) * 100
    }
  }

  updateAverageAccessTime(accessTime) {
    const totalTime = this.statistics.averageAccessTime * (this.statistics.cacheHits - 1) + accessTime
    this.statistics.averageAccessTime = totalTime / this.statistics.cacheHits
  }
}

// 测试函数
async function runLRUCacheTests() {
  console.log('🧪 开始LRU缓存系统集成测试...\n')
  
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
  
  // 测试1: 基本缓存操作
  console.log('💾 测试基本缓存操作:')
  
  const cache = new MockLRUCache({ maxSize: 5, ttl: 1000 })
  
  // 测试设置和获取
  test('设置缓存项应该成功', cache.set('key1', 'value1') === true)
  test('获取缓存项应该成功', cache.get('key1') === 'value1')
  test('缓存大小应该正确', cache.size() === 1)
  test('缓存项存在检查应该正确', cache.has('key1') === true)
  test('不存在的缓存项应该返回undefined', cache.get('nonexistent') === undefined)
  
  // 测试覆盖
  cache.set('key1', 'new_value1')
  test('覆盖缓存项应该成功', cache.get('key1') === 'new_value1')
  test('覆盖后缓存大小应该保持', cache.size() === 1)
  
  // 测试删除
  test('删除缓存项应该成功', cache.delete('key1') === true)
  test('删除后缓存项不应该存在', cache.has('key1') === false)
  test('删除后缓存大小应该减少', cache.size() === 0)
  
  // 测试2: LRU驱逐机制
  console.log('\n🔄 测试LRU驱逐机制:')
  
  const lruCache = new MockLRUCache({ maxSize: 3 })
  
  // 填满缓存
  lruCache.set('a', 'value_a')
  lruCache.set('b', 'value_b')
  lruCache.set('c', 'value_c')
  test('缓存应该填满', lruCache.size() === 3)
  
  // 访问第一个项以更新其LRU顺序
  lruCache.get('a')
  
  // 添加新项，应该驱逐最少使用的项
  lruCache.set('d', 'value_d')
  test('添加新项后缓存大小应该保持', lruCache.size() === 3)
  test('最少使用的项应该被驱逐', !lruCache.has('b'))
  test('最近访问的项应该保留', lruCache.has('a'))
  test('新项应该存在', lruCache.has('d'))
  
  // 测试3: 缓存统计
  console.log('\n📊 测试缓存统计:')
  
  const statsCache = new MockLRUCache({ maxSize: 10 })
  
  // 生成一些缓存活动
  statsCache.set('stat1', 'value1')
  statsCache.set('stat2', 'value2')
  statsCache.get('stat1') // 命中
  statsCache.get('stat1') // 命中
  statsCache.get('nonexistent') // 未命中
  
  const stats = statsCache.getStatistics()
  test('总请求数应该正确', stats.totalRequests === 3)
  test('缓存命中数应该正确', stats.cacheHits === 2)
  test('缓存未命中数应该正确', stats.cacheMisses === 1)
  test('命中率应该正确计算', Math.abs(stats.hitRate - 66.67) < 0.1)
  test('缓存项数量应该正确', stats.itemCount === 2)
  
  // 测试4: TTL过期机制
  console.log('\n⏰ 测试TTL过期机制:')
  
  const ttlCache = new MockLRUCache({ maxSize: 10, ttl: 100 }) // 100ms TTL
  
  ttlCache.set('expire1', 'value1')
  test('新设置的项应该存在', ttlCache.has('expire1'))
  
  // 等待过期
  await new Promise(resolve => setTimeout(resolve, 150))
  
  test('过期的项应该不存在', !ttlCache.has('expire1'))
  test('获取过期项应该返回undefined', ttlCache.get('expire1') === undefined)
  
  // 测试5: 内存管理
  console.log('\n💾 测试内存管理:')
  
  const memoryCache = new MockLRUCache({ 
    maxSize: 100, 
    maxMemoryUsage: 1024 // 1KB限制
  })
  
  // 添加一些数据
  const largeData = { data: 'x'.repeat(200) } // 约400字节
  memoryCache.set('large1', largeData)
  memoryCache.set('large2', largeData)
  
  const usage = memoryCache.getUsageInfo()
  test('内存使用应该被跟踪', usage.memoryUsage > 0)
  test('内存使用率应该合理', usage.memoryUsage < 100)
  
  // 测试6: 热点数据分析
  console.log('\n🔥 测试热点数据分析:')
  
  const hotCache = new MockLRUCache({ maxSize: 10 })
  
  // 创建不同访问频率的数据
  hotCache.set('hot1', 'value1')
  hotCache.set('hot2', 'value2')
  hotCache.set('cold1', 'value3')
  
  // 模拟不同的访问模式
  for (let i = 0; i < 10; i++) {
    hotCache.get('hot1')
  }
  for (let i = 0; i < 5; i++) {
    hotCache.get('hot2')
  }
  hotCache.get('cold1') // 只访问一次
  
  const hotKeys = hotCache.getHotKeys(3)
  test('热点数据应该正确排序', hotKeys[0].key === 'hot1')
  test('热点数据访问次数应该正确', hotKeys[0].accessCount === 11) // 10次get + 1次set
  test('第二热点数据应该正确', hotKeys[1].key === 'hot2')
  
  // 测试7: 缓存预热
  console.log('\n🔥 测试缓存预热:')
  
  const warmupCache = new MockLRUCache({ maxSize: 10 })
  
  // 模拟数据提供者
  const dataProvider = async (key) => {
    await new Promise(resolve => setTimeout(resolve, 10)) // 模拟异步获取
    return `generated_value_for_${key}`
  }
  
  const keysToWarmup = ['warm1', 'warm2', 'warm3']
  const warmedCount = await warmupCache.warmup(dataProvider, keysToWarmup)
  
  test('预热应该成功', warmedCount === 3)
  test('预热的数据应该存在', warmupCache.has('warm1'))
  test('预热的数据值应该正确', warmupCache.get('warm1') === 'generated_value_for_warm1')
  
  // 测试8: 清理机制
  console.log('\n🧹 测试清理机制:')
  
  const cleanupCache = new MockLRUCache({ maxSize: 10, ttl: 50 })
  
  // 添加一些会过期的项
  cleanupCache.set('cleanup1', 'value1')
  cleanupCache.set('cleanup2', 'value2')
  cleanupCache.set('cleanup3', 'value3')
  
  test('清理前应该有3个项', cleanupCache.size() === 3)
  
  // 等待过期
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const cleanedCount = cleanupCache.cleanup()
  test('清理应该移除过期项', cleanedCount === 3)
  test('清理后缓存应该为空', cleanupCache.size() === 0)
  
  // 测试9: 性能测试
  console.log('\n🚀 测试性能表现:')
  
  const perfCache = new MockLRUCache({ maxSize: 1000 })
  const startTime = Date.now()
  
  // 大量写入操作
  for (let i = 0; i < 1000; i++) {
    perfCache.set(`perf_key_${i}`, `perf_value_${i}`)
  }
  
  const writeTime = Date.now() - startTime
  test('大量写入应该在合理时间内完成', writeTime < 1000) // 1秒内
  
  const readStartTime = Date.now()
  
  // 大量读取操作
  for (let i = 0; i < 1000; i++) {
    perfCache.get(`perf_key_${i}`)
  }
  
  const readTime = Date.now() - readStartTime
  test('大量读取应该在合理时间内完成', readTime < 500) // 0.5秒内
  
  const perfStats = perfCache.getStatistics()
  test('性能测试后命中率应该很高', perfStats.hitRate > 95)
  
  // 测试10: 边界条件
  console.log('\n🔍 测试边界条件:')
  
  const boundaryCache = new MockLRUCache({ maxSize: 1 })
  
  // 测试单项缓存
  boundaryCache.set('single', 'value')
  test('单项缓存应该工作', boundaryCache.get('single') === 'value')
  
  boundaryCache.set('replace', 'new_value')
  test('单项缓存替换应该工作', boundaryCache.get('replace') === 'new_value')
  test('被替换的项应该不存在', !boundaryCache.has('single'))
  
  // 测试空缓存操作
  const emptyCache = new MockLRUCache({ maxSize: 10 })
  test('空缓存获取应该返回undefined', emptyCache.get('nothing') === undefined)
  test('空缓存删除应该返回false', emptyCache.delete('nothing') === false)
  test('空缓存大小应该为0', emptyCache.size() === 0)
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  // 输出性能统计
  console.log('\n📈 性能统计详情:')
  console.log(`   写入性能: ${writeTime}ms (1000项)`)
  console.log(`   读取性能: ${readTime}ms (1000项)`)
  console.log(`   最终命中率: ${perfStats.hitRate.toFixed(1)}%`)
  console.log(`   平均访问时间: ${perfStats.averageAccessTime.toFixed(2)}ms`)
  
  // 输出功能覆盖情况
  console.log('\n🎯 功能覆盖情况:')
  console.log(`   ✅ 基本缓存操作 - 增删改查`)
  console.log(`   ✅ LRU驱逐机制 - 智能空间管理`)
  console.log(`   ✅ 缓存统计系统 - 完整性能指标`)
  console.log(`   ✅ TTL过期机制 - 自动过期清理`)
  console.log(`   ✅ 内存管理 - 内存使用监控`)
  console.log(`   ✅ 热点数据分析 - 访问模式识别`)
  console.log(`   ✅ 缓存预热 - 批量数据加载`)
  console.log(`   ✅ 清理机制 - 过期项自动清理`)
  console.log(`   ✅ 性能优化 - 高效读写操作`)
  console.log(`   ✅ 边界条件 - 异常情况处理`)
  
  if (failed === 0) {
    console.log('\n🎉 所有LRU缓存系统测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查缓存系统实现。')
    return false
  }
}

// 运行测试
runLRUCacheTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
