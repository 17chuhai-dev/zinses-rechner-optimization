/**
 * 高级缓存管理器
 * 实现智能预加载、缓存失效、缓存优化等高级缓存策略
 */

import { ref, reactive } from 'vue'

// 缓存策略类型
export type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'ttl' | 'adaptive'

// 缓存项接口
export interface CacheItem<T = any> {
  key: string
  value: T
  timestamp: number
  lastAccessed: number
  accessCount: number
  size: number
  ttl?: number
  priority: number
  tags: string[]
  metadata: {
    source: string
    version: string
    dependencies: string[]
    computationTime?: number
  }
}

// 缓存配置接口
export interface CacheConfig {
  maxSize: number // 最大缓存大小 (MB)
  maxItems: number // 最大缓存项数
  defaultTTL: number // 默认TTL (毫秒)
  strategy: CacheStrategy
  enablePreloading: boolean
  enableCompression: boolean
  enablePersistence: boolean
  cleanupInterval: number // 清理间隔 (毫秒)
  preloadThreshold: number // 预加载阈值
}

// 缓存统计接口
export interface CacheStats {
  totalItems: number
  totalSize: number
  hitCount: number
  missCount: number
  hitRate: number
  evictionCount: number
  preloadCount: number
  compressionRatio: number
  averageAccessTime: number
  memoryUsage: number
}

// 预加载规则接口
export interface PreloadRule {
  id: string
  pattern: string | RegExp
  priority: number
  condition: (context: any) => boolean
  loader: (key: string) => Promise<any>
  dependencies: string[]
  enabled: boolean
}

/**
 * 高级缓存管理器类
 */
export class AdvancedCacheManager {
  private static instance: AdvancedCacheManager

  // 缓存存储
  private cache = new Map<string, CacheItem>()
  private persistentCache = new Map<string, CacheItem>()

  // 缓存配置
  private config: CacheConfig = {
    maxSize: 50, // 50MB
    maxItems: 1000,
    defaultTTL: 30 * 60 * 1000, // 30分钟
    strategy: 'adaptive',
    enablePreloading: true,
    enableCompression: true,
    enablePersistence: true,
    cleanupInterval: 5 * 60 * 1000, // 5分钟
    preloadThreshold: 0.8
  }

  // 缓存统计
  public readonly stats = reactive<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    hitRate: 0,
    evictionCount: 0,
    preloadCount: 0,
    compressionRatio: 0,
    averageAccessTime: 0,
    memoryUsage: 0
  })

  // 预加载规则
  private preloadRules = new Map<string, PreloadRule>()

  // 访问模式分析
  private accessPatterns = new Map<string, {
    frequency: number
    lastAccess: number
    predictedNext: number
    relatedKeys: Set<string>
  }>()

  // 定时器
  private cleanupTimer?: number
  private preloadTimer?: number

  // 状态
  public readonly isEnabled = ref(true)
  public readonly isPreloading = ref(false)

  public static getInstance(): AdvancedCacheManager {
    if (!AdvancedCacheManager.instance) {
      AdvancedCacheManager.instance = new AdvancedCacheManager()
    }
    return AdvancedCacheManager.instance
  }

  constructor() {
    this.initializeCache()
  }

  /**
   * 初始化缓存系统
   */
  private initializeCache(): void {
    // 加载持久化缓存
    this.loadPersistentCache()

    // 启动清理定时器
    this.startCleanupTimer()

    // 启动预加载定时器
    if (this.config.enablePreloading) {
      this.startPreloadTimer()
    }

    // 监听内存压力
    this.setupMemoryPressureHandling()

    console.log('🗄️ Advanced cache manager initialized')
  }

  /**
   * 获取缓存项
   */
  public async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now()

    try {
      // 检查内存缓存
      let item = this.cache.get(key)

      // 检查持久化缓存
      if (!item && this.config.enablePersistence) {
        item = this.persistentCache.get(key)
        if (item) {
          // 将持久化缓存项移到内存缓存
          this.cache.set(key, item)
        }
      }

      if (item) {
        // 检查TTL
        if (this.isExpired(item)) {
          this.delete(key)
          this.stats.missCount++
          return null
        }

        // 更新访问信息
        item.lastAccessed = Date.now()
        item.accessCount++

        // 更新访问模式
        this.updateAccessPattern(key)

        // 触发预加载
        if (this.config.enablePreloading) {
          this.triggerPreload(key)
        }

        this.stats.hitCount++
        this.updateStats()

        console.log(`📦 Cache hit: ${key}`)
        return item.value as T
      }

      this.stats.missCount++
      this.updateStats()

      console.log(`📦 Cache miss: ${key}`)
      return null

    } finally {
      const accessTime = performance.now() - startTime
      this.updateAverageAccessTime(accessTime)
    }
  }

  /**
   * 设置缓存项
   */
  public async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number
      priority?: number
      tags?: string[]
      source?: string
      dependencies?: string[]
      computationTime?: number
    } = {}
  ): Promise<void> {
    const size = this.calculateSize(value)
    const now = Date.now()

    const item: CacheItem<T> = {
      key,
      value,
      timestamp: now,
      lastAccessed: now,
      accessCount: 1,
      size,
      ttl: options.ttl || this.config.defaultTTL,
      priority: options.priority || 1,
      tags: options.tags || [],
      metadata: {
        source: options.source || 'unknown',
        version: '1.0.0',
        dependencies: options.dependencies || [],
        computationTime: options.computationTime
      }
    }

    // 压缩数据
    if (this.config.enableCompression && size > 1024) {
      item.value = await this.compressData(value) as T
      item.size = this.calculateSize(item.value)
    }

    // 检查缓存容量
    await this.ensureCapacity(item.size)

    // 存储到内存缓存
    this.cache.set(key, item)

    // 存储到持久化缓存
    if (this.config.enablePersistence && item.priority > 5) {
      this.persistentCache.set(key, { ...item })
      this.savePersistentCache()
    }

    // 更新访问模式
    this.updateAccessPattern(key)

    this.updateStats()

    console.log(`📦 Cache set: ${key} (${this.formatSize(size)})`)
  }

  /**
   * 删除缓存项
   */
  public delete(key: string): boolean {
    const memoryDeleted = this.cache.delete(key)
    const persistentDeleted = this.persistentCache.delete(key)

    if (memoryDeleted || persistentDeleted) {
      this.accessPatterns.delete(key)
      this.updateStats()
      console.log(`📦 Cache deleted: ${key}`)
      return true
    }

    return false
  }

  /**
   * 清空缓存
   */
  public clear(): void {
    this.cache.clear()
    this.persistentCache.clear()
    this.accessPatterns.clear()
    this.updateStats()
    
    if (this.config.enablePersistence) {
      this.savePersistentCache()
    }

    console.log('📦 Cache cleared')
  }

  /**
   * 批量获取
   */
  public async getMultiple<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>()
    
    await Promise.all(
      keys.map(async (key) => {
        const value = await this.get<T>(key)
        if (value !== null) {
          results.set(key, value)
        }
      })
    )

    return results
  }

  /**
   * 批量设置
   */
  public async setMultiple<T>(
    items: Array<{ key: string; value: T; options?: any }>
  ): Promise<void> {
    await Promise.all(
      items.map(({ key, value, options }) => this.set(key, value, options))
    )
  }

  /**
   * 按标签删除
   */
  public deleteByTag(tag: string): number {
    let deletedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (item.tags.includes(tag)) {
        this.delete(key)
        deletedCount++
      }
    }

    console.log(`📦 Deleted ${deletedCount} items with tag: ${tag}`)
    return deletedCount
  }

  /**
   * 按模式删除
   */
  public deleteByPattern(pattern: string | RegExp): number {
    let deletedCount = 0
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key)
        deletedCount++
      }
    }

    console.log(`📦 Deleted ${deletedCount} items matching pattern: ${pattern}`)
    return deletedCount
  }

  /**
   * 添加预加载规则
   */
  public addPreloadRule(rule: PreloadRule): void {
    this.preloadRules.set(rule.id, rule)
    console.log(`📦 Added preload rule: ${rule.id}`)
  }

  /**
   * 移除预加载规则
   */
  public removePreloadRule(ruleId: string): boolean {
    const removed = this.preloadRules.delete(ruleId)
    if (removed) {
      console.log(`📦 Removed preload rule: ${ruleId}`)
    }
    return removed
  }

  /**
   * 手动触发预加载
   */
  public async triggerPreload(contextKey?: string): Promise<void> {
    if (!this.config.enablePreloading || this.isPreloading.value) {
      return
    }

    this.isPreloading.value = true

    try {
      const preloadTasks: Promise<void>[] = []

      for (const rule of this.preloadRules.values()) {
        if (!rule.enabled) continue

        try {
          if (rule.condition({ contextKey, cache: this })) {
            const task = this.executePreloadRule(rule, contextKey)
            preloadTasks.push(task)
          }
        } catch (error) {
          console.error(`Error evaluating preload rule ${rule.id}:`, error)
        }
      }

      await Promise.allSettled(preloadTasks)
      console.log(`📦 Preload completed: ${preloadTasks.length} rules executed`)

    } finally {
      this.isPreloading.value = false
    }
  }

  /**
   * 获取缓存统计
   */
  public getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 重启定时器
    if (newConfig.cleanupInterval) {
      this.startCleanupTimer()
    }

    // 处理预加载设置变化
    if (newConfig.enablePreloading !== undefined) {
      if (newConfig.enablePreloading) {
        this.startPreloadTimer()
      } else {
        this.stopPreloadTimer()
      }
    }

    console.log('📦 Cache config updated')
  }

  /**
   * 导出缓存数据
   */
  public exportCache(): {
    config: CacheConfig
    stats: CacheStats
    items: Array<{ key: string; metadata: any }>
    patterns: Array<{ key: string; frequency: number }>
  } {
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      metadata: {
        size: item.size,
        accessCount: item.accessCount,
        lastAccessed: item.lastAccessed,
        tags: item.tags,
        source: item.metadata.source
      }
    }))

    const patterns = Array.from(this.accessPatterns.entries()).map(([key, pattern]) => ({
      key,
      frequency: pattern.frequency
    }))

    return {
      config: { ...this.config },
      stats: { ...this.stats },
      items,
      patterns
    }
  }

  // 私有方法

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem): boolean {
    if (!item.ttl) return false
    return Date.now() - item.timestamp > item.ttl
  }

  /**
   * 计算数据大小
   */
  private calculateSize(data: any): number {
    const jsonString = JSON.stringify(data)
    return new Blob([jsonString]).size
  }

  /**
   * 确保缓存容量
   */
  private async ensureCapacity(newItemSize: number): Promise<void> {
    const currentSize = this.getCurrentSize()
    const maxSizeBytes = this.config.maxSize * 1024 * 1024

    if (currentSize + newItemSize > maxSizeBytes || this.cache.size >= this.config.maxItems) {
      await this.evictItems(newItemSize)
    }
  }

  /**
   * 获取当前缓存大小
   */
  private getCurrentSize(): number {
    let totalSize = 0
    for (const item of this.cache.values()) {
      totalSize += item.size
    }
    return totalSize
  }

  /**
   * 驱逐缓存项
   */
  private async evictItems(requiredSpace: number): Promise<void> {
    const itemsToEvict: string[] = []
    let freedSpace = 0

    // 根据策略选择驱逐项
    const sortedItems = this.getSortedItemsForEviction()

    for (const [key, item] of sortedItems) {
      itemsToEvict.push(key)
      freedSpace += item.size
      
      if (freedSpace >= requiredSpace) {
        break
      }
    }

    // 执行驱逐
    for (const key of itemsToEvict) {
      this.cache.delete(key)
      this.stats.evictionCount++
    }

    console.log(`📦 Evicted ${itemsToEvict.length} items, freed ${this.formatSize(freedSpace)}`)
  }

  /**
   * 获取排序后的驱逐候选项
   */
  private getSortedItemsForEviction(): Array<[string, CacheItem]> {
    const items = Array.from(this.cache.entries())

    switch (this.config.strategy) {
      case 'lru':
        return items.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
      
      case 'lfu':
        return items.sort(([, a], [, b]) => a.accessCount - b.accessCount)
      
      case 'fifo':
        return items.sort(([, a], [, b]) => a.timestamp - b.timestamp)
      
      case 'ttl':
        return items.sort(([, a], [, b]) => {
          const aExpiry = a.timestamp + (a.ttl || 0)
          const bExpiry = b.timestamp + (b.ttl || 0)
          return aExpiry - bExpiry
        })
      
      case 'adaptive':
      default:
        return items.sort(([, a], [, b]) => {
          const aScore = this.calculateAdaptiveScore(a)
          const bScore = this.calculateAdaptiveScore(b)
          return aScore - bScore
        })
    }
  }

  /**
   * 计算自适应评分
   */
  private calculateAdaptiveScore(item: CacheItem): number {
    const now = Date.now()
    const age = now - item.timestamp
    const timeSinceAccess = now - item.lastAccessed
    
    // 综合考虑访问频率、最近访问时间、优先级、大小
    const frequencyScore = item.accessCount / Math.max(age / 1000, 1)
    const recencyScore = 1 / Math.max(timeSinceAccess / 1000, 1)
    const priorityScore = item.priority
    const sizeScore = 1 / Math.max(item.size / 1024, 1)
    
    return frequencyScore * 0.3 + recencyScore * 0.3 + priorityScore * 0.3 + sizeScore * 0.1
  }

  /**
   * 更新访问模式
   */
  private updateAccessPattern(key: string): void {
    const pattern = this.accessPatterns.get(key) || {
      frequency: 0,
      lastAccess: 0,
      predictedNext: 0,
      relatedKeys: new Set()
    }

    pattern.frequency++
    pattern.lastAccess = Date.now()
    
    // 预测下次访问时间
    if (pattern.frequency > 1) {
      const avgInterval = (Date.now() - pattern.lastAccess) / pattern.frequency
      pattern.predictedNext = Date.now() + avgInterval
    }

    this.accessPatterns.set(key, pattern)
  }

  /**
   * 执行预加载规则
   */
  private async executePreloadRule(rule: PreloadRule, contextKey?: string): Promise<void> {
    try {
      // 生成预加载键
      const keysToPreload = this.generatePreloadKeys(rule, contextKey)

      for (const key of keysToPreload) {
        // 检查是否已缓存
        if (this.cache.has(key)) continue

        // 执行加载
        const value = await rule.loader(key)
        if (value !== null && value !== undefined) {
          await this.set(key, value, {
            priority: rule.priority,
            tags: ['preloaded'],
            source: 'preload'
          })
          this.stats.preloadCount++
        }
      }

    } catch (error) {
      console.error(`Error executing preload rule ${rule.id}:`, error)
    }
  }

  /**
   * 生成预加载键
   */
  private generatePreloadKeys(rule: PreloadRule, contextKey?: string): string[] {
    // 基于规则模式和上下文生成预加载键
    const keys: string[] = []

    if (typeof rule.pattern === 'string') {
      // 简单字符串模式
      keys.push(rule.pattern)
    } else {
      // 正则表达式模式 - 基于现有键生成相关键
      for (const existingKey of this.cache.keys()) {
        if (rule.pattern.test(existingKey)) {
          // 生成相关键
          const relatedKeys = this.generateRelatedKeys(existingKey)
          keys.push(...relatedKeys)
        }
      }
    }

    return keys.slice(0, 10) // 限制预加载数量
  }

  /**
   * 生成相关键
   */
  private generateRelatedKeys(baseKey: string): string[] {
    // 基于基础键生成相关键的逻辑
    const keys: string[] = []
    
    // 示例：如果是计算结果，生成相关参数的键
    if (baseKey.includes('calculation:')) {
      const parts = baseKey.split(':')
      if (parts.length > 1) {
        keys.push(`${parts[0]}:history:${parts[1]}`)
        keys.push(`${parts[0]}:chart:${parts[1]}`)
      }
    }

    return keys
  }

  /**
   * 压缩数据
   */
  private async compressData(data: any): Promise<any> {
    // 简单的JSON压缩（实际应用中可以使用更高级的压缩算法）
    const jsonString = JSON.stringify(data)
    
    // 模拟压缩
    const compressed = {
      _compressed: true,
      data: jsonString,
      originalSize: jsonString.length
    }

    return compressed
  }

  /**
   * 解压数据
   */
  private async decompressData(compressedData: any): Promise<any> {
    if (compressedData._compressed) {
      return JSON.parse(compressedData.data)
    }
    return compressedData
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = window.setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 启动预加载定时器
   */
  private startPreloadTimer(): void {
    if (this.preloadTimer) {
      clearInterval(this.preloadTimer)
    }

    this.preloadTimer = window.setInterval(() => {
      this.triggerPreload()
    }, 60000) // 每分钟检查一次
  }

  /**
   * 停止预加载定时器
   */
  private stopPreloadTimer(): void {
    if (this.preloadTimer) {
      clearInterval(this.preloadTimer)
      this.preloadTimer = undefined
    }
  }

  /**
   * 执行清理
   */
  private performCleanup(): void {
    let cleanedCount = 0

    // 清理过期项
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    // 清理访问模式
    const cutoff = Date.now() - 24 * 60 * 60 * 1000 // 24小时前
    for (const [key, pattern] of this.accessPatterns.entries()) {
      if (pattern.lastAccess < cutoff) {
        this.accessPatterns.delete(key)
      }
    }

    if (cleanedCount > 0) {
      console.log(`📦 Cleanup completed: removed ${cleanedCount} expired items`)
      this.updateStats()
    }
  }

  /**
   * 设置内存压力处理
   */
  private setupMemoryPressureHandling(): void {
    // 监听内存压力事件（如果支持）
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
          console.warn('📦 High memory usage detected, triggering aggressive cleanup')
          this.performAggressiveCleanup()
        }
      }

      setInterval(checkMemory, 30000) // 每30秒检查一次
    }
  }

  /**
   * 执行激进清理
   */
  private performAggressiveCleanup(): void {
    const targetSize = this.config.maxSize * 0.5 * 1024 * 1024 // 清理到50%容量
    const currentSize = this.getCurrentSize()

    if (currentSize > targetSize) {
      this.evictItems(currentSize - targetSize)
    }
  }

  /**
   * 加载持久化缓存
   */
  private loadPersistentCache(): void {
    if (!this.config.enablePersistence) return

    try {
      const data = localStorage.getItem('advanced-cache-data')
      if (data) {
        const parsed = JSON.parse(data)
        for (const [key, item] of Object.entries(parsed)) {
          this.persistentCache.set(key, item as CacheItem)
        }
        console.log(`📦 Loaded ${this.persistentCache.size} items from persistent cache`)
      }
    } catch (error) {
      console.error('Failed to load persistent cache:', error)
    }
  }

  /**
   * 保存持久化缓存
   */
  private savePersistentCache(): void {
    if (!this.config.enablePersistence) return

    try {
      const data = Object.fromEntries(this.persistentCache.entries())
      localStorage.setItem('advanced-cache-data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save persistent cache:', error)
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalItems = this.cache.size
    this.stats.totalSize = this.getCurrentSize()
    this.stats.hitRate = this.stats.hitCount / Math.max(this.stats.hitCount + this.stats.missCount, 1) * 100
    this.stats.memoryUsage = this.stats.totalSize / (this.config.maxSize * 1024 * 1024) * 100
  }

  /**
   * 更新平均访问时间
   */
  private updateAverageAccessTime(accessTime: number): void {
    const totalAccess = this.stats.hitCount + this.stats.missCount
    this.stats.averageAccessTime = (this.stats.averageAccessTime * (totalAccess - 1) + accessTime) / totalAccess
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
}

// 导出单例实例
export const advancedCacheManager = AdvancedCacheManager.getInstance()

// 便捷的组合式API
export function useAdvancedCache() {
  const manager = AdvancedCacheManager.getInstance()
  
  return {
    // 状态
    stats: manager.stats,
    isEnabled: manager.isEnabled,
    isPreloading: manager.isPreloading,
    
    // 方法
    get: manager.get.bind(manager),
    set: manager.set.bind(manager),
    delete: manager.delete.bind(manager),
    clear: manager.clear.bind(manager),
    getMultiple: manager.getMultiple.bind(manager),
    setMultiple: manager.setMultiple.bind(manager),
    deleteByTag: manager.deleteByTag.bind(manager),
    deleteByPattern: manager.deleteByPattern.bind(manager),
    addPreloadRule: manager.addPreloadRule.bind(manager),
    removePreloadRule: manager.removePreloadRule.bind(manager),
    triggerPreload: manager.triggerPreload.bind(manager),
    getStats: manager.getStats.bind(manager),
    updateConfig: manager.updateConfig.bind(manager),
    exportCache: manager.exportCache.bind(manager)
  }
}
