/**
 * 计算缓存管理器
 * 提供智能缓存机制，避免重复计算，提升系统性能
 */

// 缓存项接口
export interface CacheItem<T = any> {
  key: string
  value: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  computationTime: number
  size: number
  dependencies?: string[]
  priority: number
}

// 缓存配置接口
export interface CacheConfig {
  maxSize: number // 最大缓存大小（字节）
  maxItems: number // 最大缓存项数
  ttl: number // 生存时间（毫秒）
  cleanupInterval: number // 清理间隔（毫秒）
  enableCompression: boolean // 是否启用压缩
  enableMetrics: boolean // 是否启用性能指标
}

// 缓存统计接口
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalItems: number
  totalSize: number
  averageComputationTime: number
  memoryUsage: number
  cleanupCount: number
}

// 缓存策略枚举
export enum CacheStrategy {
  LRU = 'lru', // 最近最少使用
  LFU = 'lfu', // 最少使用频率
  FIFO = 'fifo', // 先进先出
  PRIORITY = 'priority' // 优先级
}

/**
 * 计算缓存管理器类
 */
export class CalculationCache {
  private cache = new Map<string, CacheItem>()
  private config: CacheConfig
  private stats: CacheStats
  private cleanupTimer?: NodeJS.Timeout
  private strategy: CacheStrategy

  constructor(config: Partial<CacheConfig> = {}, strategy: CacheStrategy = CacheStrategy.LRU) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxItems: 1000,
      ttl: 30 * 60 * 1000, // 30分钟
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      enableCompression: false,
      enableMetrics: true,
      ...config
    }

    this.strategy = strategy
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalItems: 0,
      totalSize: 0,
      averageComputationTime: 0,
      memoryUsage: 0,
      cleanupCount: 0
    }

    this.startCleanupTimer()
  }

  /**
   * 生成缓存键
   */
  generateKey(input: any): string {
    // 创建稳定的键，忽略对象属性顺序
    const sortedInput = this.sortObject(input)
    return this.hashObject(sortedInput)
  }

  /**
   * 获取缓存值
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // 检查是否过期
    if (this.isExpired(item)) {
      this.cache.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // 更新访问信息
    item.accessCount++
    item.lastAccessed = Date.now()
    
    this.stats.hits++
    this.updateHitRate()
    
    return item.value as T
  }

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, computationTime: number = 0, dependencies?: string[], priority: number = 1): void {
    const now = Date.now()
    const size = this.calculateSize(value)

    const item: CacheItem<T> = {
      key,
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      computationTime,
      size,
      dependencies,
      priority
    }

    // 检查是否需要清理空间
    if (this.needsCleanup(size)) {
      this.cleanup(size)
    }

    this.cache.set(key, item)
    this.updateStats()
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.updateStats()
    }
    return deleted
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.updateStats()
  }

  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    return item !== undefined && !this.isExpired(item)
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 使缓存项失效
   */
  invalidate(pattern?: string | RegExp): number {
    let count = 0
    
    if (!pattern) {
      count = this.cache.size
      this.cache.clear()
    } else {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
      
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key)
          count++
        }
      }
    }
    
    this.updateStats()
    return count
  }

  /**
   * 使依赖项失效
   */
  invalidateDependencies(dependency: string): number {
    let count = 0
    
    for (const [key, item] of this.cache) {
      if (item.dependencies?.includes(dependency)) {
        this.cache.delete(key)
        count++
      }
    }
    
    this.updateStats()
    return count
  }

  /**
   * 预热缓存
   */
  async warmup<T>(keys: string[], calculator: (key: string) => Promise<T>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        const startTime = performance.now()
        const value = await calculator(key)
        const computationTime = performance.now() - startTime
        this.set(key, value, computationTime)
      }
    })
    
    await Promise.all(promises)
  }

  /**
   * 销毁缓存
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
    this.cache.clear()
  }

  /**
   * 私有方法：排序对象
   */
  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item))
    }
    
    const sorted: any = {}
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.sortObject(obj[key])
    })
    
    return sorted
  }

  /**
   * 私有方法：哈希对象
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj)
    let hash = 0
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    return hash.toString(36)
  }

  /**
   * 私有方法：检查是否过期
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > this.config.ttl
  }

  /**
   * 私有方法：计算大小
   */
  private calculateSize(value: any): number {
    const str = JSON.stringify(value)
    return str.length * 2 // 假设每个字符占2字节
  }

  /**
   * 私有方法：检查是否需要清理
   */
  private needsCleanup(newItemSize: number): boolean {
    return (
      this.cache.size >= this.config.maxItems ||
      this.stats.totalSize + newItemSize > this.config.maxSize
    )
  }

  /**
   * 私有方法：清理缓存
   */
  private cleanup(requiredSpace: number = 0): void {
    const items = Array.from(this.cache.entries())
    
    // 根据策略排序
    items.sort(([, a], [, b]) => {
      switch (this.strategy) {
        case CacheStrategy.LRU:
          return a.lastAccessed - b.lastAccessed
        case CacheStrategy.LFU:
          return a.accessCount - b.accessCount
        case CacheStrategy.FIFO:
          return a.timestamp - b.timestamp
        case CacheStrategy.PRIORITY:
          return a.priority - b.priority
        default:
          return a.lastAccessed - b.lastAccessed
      }
    })

    let freedSpace = 0
    let removedCount = 0
    
    // 移除项目直到满足空间要求
    for (const [key, item] of items) {
      if (freedSpace >= requiredSpace && this.cache.size < this.config.maxItems * 0.8) {
        break
      }
      
      this.cache.delete(key)
      freedSpace += item.size
      removedCount++
    }
    
    this.stats.cleanupCount++
    this.updateStats()
  }

  /**
   * 私有方法：更新统计信息
   */
  private updateStats(): void {
    this.stats.totalItems = this.cache.size
    this.stats.totalSize = Array.from(this.cache.values()).reduce((sum, item) => sum + item.size, 0)
    
    if (this.cache.size > 0) {
      this.stats.averageComputationTime = Array.from(this.cache.values())
        .reduce((sum, item) => sum + item.computationTime, 0) / this.cache.size
    }
    
    this.stats.memoryUsage = this.stats.totalSize
  }

  /**
   * 私有方法：更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  /**
   * 私有方法：启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired()
    }, this.config.cleanupInterval)
  }

  /**
   * 私有方法：清理过期项
   */
  private cleanupExpired(): void {
    const now = Date.now()
    let removedCount = 0
    
    for (const [key, item] of this.cache) {
      if (now - item.timestamp > this.config.ttl) {
        this.cache.delete(key)
        removedCount++
      }
    }
    
    if (removedCount > 0) {
      this.updateStats()
    }
  }
}

// 创建默认缓存实例
export const defaultCalculationCache = new CalculationCache({
  maxSize: 20 * 1024 * 1024, // 20MB
  maxItems: 500,
  ttl: 15 * 60 * 1000, // 15分钟
  cleanupInterval: 2 * 60 * 1000, // 2分钟
  enableMetrics: true
}, CacheStrategy.LRU)
