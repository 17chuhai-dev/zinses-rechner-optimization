/**
 * LRU缓存系统实现
 * 实现高效的LRU缓存系统，支持50-100个计算结果的缓存，包含缓存统计和清理机制
 */

// 缓存项接口
export interface CacheItem<V> {
  value: V
  timestamp: number
  accessCount: number
  lastAccessed: Date
  size: number
}

// 缓存统计接口
export interface CacheStatistics {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  hitRate: number
  totalSize: number
  itemCount: number
  averageAccessTime: number
  memoryUsage: number
  oldestItem: Date | null
  newestItem: Date | null
}

// 缓存配置接口
export interface CacheConfig {
  maxSize: number
  maxMemoryUsage: number // bytes
  ttl: number // time to live in milliseconds
  enableStatistics: boolean
  autoCleanup: boolean
  cleanupInterval: number // milliseconds
}

/**
 * LRU缓存类
 */
export class LRUCache<K, V> {
  private cache = new Map<K, CacheItem<V>>()
  private accessOrder = new Map<K, number>() // 访问顺序跟踪
  private config: CacheConfig
  private statistics: CacheStatistics
  private accessCounter = 0
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100,
      maxMemoryUsage: 10 * 1024 * 1024, // 10MB
      ttl: 30 * 60 * 1000, // 30分钟
      enableStatistics: true,
      autoCleanup: true,
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      ...config
    }

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

    if (this.config.autoCleanup) {
      this.startAutoCleanup()
    }

    console.log('💾 LRU缓存系统已初始化', {
      maxSize: this.config.maxSize,
      maxMemoryUsage: this.config.maxMemoryUsage,
      ttl: this.config.ttl
    })
  }

  /**
   * 获取缓存项
   */
  get(key: K): V | undefined {
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

  /**
   * 设置缓存项
   */
  set(key: K, value: V): boolean {
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
    const item: CacheItem<V> = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: new Date(),
      size: itemSize
    }

    this.cache.set(key, item)
    this.accessOrder.set(key, ++this.accessCounter)

    this.updateStatistics()
    
    console.log(`💾 缓存项已添加: ${String(key)} (${itemSize} bytes)`)
    return true
  }

  /**
   * 删除缓存项
   */
  delete(key: K): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    this.cache.delete(key)
    this.accessOrder.delete(key)
    this.updateStatistics()

    console.log(`🗑️ 缓存项已删除: ${String(key)}`)
    return true
  }

  /**
   * 检查缓存项是否存在
   */
  has(key: K): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (this.isExpired(item)) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.accessCounter = 0
    this.updateStatistics()
    console.log('🧹 缓存已清空')
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 获取所有键
   */
  keys(): K[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取所有值
   */
  values(): V[] {
    return Array.from(this.cache.values()).map(item => item.value)
  }

  /**
   * 获取缓存统计
   */
  getStatistics(): CacheStatistics {
    return { ...this.statistics }
  }

  /**
   * 重置统计
   */
  resetStatistics(): void {
    this.statistics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      totalSize: this.statistics.totalSize,
      itemCount: this.statistics.itemCount,
      averageAccessTime: 0,
      memoryUsage: this.statistics.memoryUsage,
      oldestItem: this.statistics.oldestItem,
      newestItem: this.statistics.newestItem
    }
    console.log('📊 缓存统计已重置')
  }

  /**
   * 手动清理过期项
   */
  cleanup(): number {
    let cleanedCount = 0
    const now = Date.now()

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

  /**
   * 获取缓存使用情况
   */
  getUsageInfo(): {
    sizeUsage: number
    memoryUsage: number
    oldestAge: number
    averageAge: number
  } {
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

  /**
   * 获取热点数据
   */
  getHotKeys(limit: number = 10): Array<{ key: K; accessCount: number; lastAccessed: Date }> {
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

  /**
   * 预热缓存
   */
  async warmup(dataProvider: (key: K) => Promise<V>, keys: K[]): Promise<number> {
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
        console.warn(`⚠️ 预热缓存失败: ${String(key)}`, error)
      }
    }

    console.log(`🔥 缓存预热完成: ${warmedCount}/${keys.length}`)
    return warmedCount
  }

  /**
   * 检查项是否过期
   */
  private isExpired(item: CacheItem<V>): boolean {
    return Date.now() - item.timestamp > this.config.ttl
  }

  /**
   * 确保缓存容量
   */
  private ensureCapacity(newItemSize: number): void {
    // 检查数量限制
    while (this.cache.size >= this.config.maxSize) {
      this.evictLRU()
    }

    // 检查内存限制
    while (this.statistics.memoryUsage + newItemSize > this.config.maxMemoryUsage) {
      if (!this.evictLRU()) {
        break // 无法释放更多空间
      }
    }
  }

  /**
   * 驱逐最少使用的项
   */
  private evictLRU(): boolean {
    if (this.cache.size === 0) return false

    // 找到最少使用的项
    let lruKey: K | null = null
    let lruOrder = Infinity

    for (const [key, order] of this.accessOrder.entries()) {
      if (order < lruOrder) {
        lruOrder = order
        lruKey = key
      }
    }

    if (lruKey !== null) {
      this.delete(lruKey)
      console.log(`🗑️ LRU驱逐: ${String(lruKey)}`)
      return true
    }

    return false
  }

  /**
   * 计算值的大小
   */
  private calculateSize(value: V): number {
    try {
      const jsonString = JSON.stringify(value)
      return new Blob([jsonString]).size
    } catch {
      // 如果无法序列化，使用估算值
      return 1024 // 1KB估算
    }
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(): void {
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

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    if (this.statistics.totalRequests > 0) {
      this.statistics.hitRate = (this.statistics.cacheHits / this.statistics.totalRequests) * 100
    }
  }

  /**
   * 更新平均访问时间
   */
  private updateAverageAccessTime(accessTime: number): void {
    const totalTime = this.statistics.averageAccessTime * (this.statistics.cacheHits - 1) + accessTime
    this.statistics.averageAccessTime = totalTime / this.statistics.cacheHits
  }

  /**
   * 开始自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 停止自动清理
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 销毁缓存
   */
  destroy(): void {
    this.stopAutoCleanup()
    this.clear()
    console.log('🗑️ LRU缓存系统已销毁')
  }
}

// 导出工厂函数
export function createLRUCache<K, V>(config?: Partial<CacheConfig>): LRUCache<K, V> {
  return new LRUCache<K, V>(config)
}

// 导出默认实例
export const defaultCache = new LRUCache<string, any>({
  maxSize: 100,
  maxMemoryUsage: 10 * 1024 * 1024, // 10MB
  ttl: 30 * 60 * 1000, // 30分钟
  enableStatistics: true,
  autoCleanup: true
})
