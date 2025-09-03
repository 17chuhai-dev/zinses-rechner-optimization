/**
 * 缓存服务 - Cloudflare Workers版本
 * 实现高效的计算结果缓存和性能优化
 */

import { CalculatorRequest, CalculatorResponse } from '../types/api'
import { Env } from '../index'

export class CacheService {
  private env: Env
  private cache: KVNamespace

  constructor(env: Env) {
    this.env = env
    this.cache = env.CACHE
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(request: CalculatorRequest): string {
    // 创建标准化的缓存键
    const keyData = {
      principal: request.principal,
      monthly_payment: request.monthly_payment,
      annual_rate: request.annual_rate,
      years: request.years,
      compound_frequency: request.compound_frequency
    }

    // 排序键以确保一致性
    const sortedKeys = Object.keys(keyData).sort()
    const keyString = sortedKeys
      .map(key => `${key}:${keyData[key as keyof typeof keyData]}`)
      .join('|')

    // 生成哈希
    return `calc:${this.hashString(keyString)}`
  }

  /**
   * 获取缓存数据
   */
  async get(key: string): Promise<CalculatorResponse | null> {
    try {
      const cached = await this.cache.get(key, 'json')
      
      if (cached) {
        // 记录缓存命中
        await this.recordCacheHit(key)
        return cached as CalculatorResponse
      }
      
      // 记录缓存未命中
      await this.recordCacheMiss(key)
      return null
      
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * 设置缓存数据
   */
  async set(key: string, data: CalculatorResponse, ttl: number): Promise<void> {
    try {
      // 添加缓存元数据
      const cacheData = {
        ...data,
        cached_at: new Date().toISOString(),
        cache_ttl: ttl,
        cache_key: key
      }

      await this.cache.put(key, JSON.stringify(cacheData), {
        expirationTtl: ttl
      })

      // 记录缓存设置
      await this.recordCacheSet(key, ttl)
      
    } catch (error) {
      console.error('Cache set error:', error)
      // 缓存失败不应影响主要功能
    }
  }

  /**
   * 删除缓存数据
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cache.delete(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<void> {
    try {
      // Cloudflare KV自动处理过期，这里主要清理统计数据
      const statsKey = 'cache:stats'
      const stats = await this.getCacheStats()
      
      // 重置每日统计（如果是新的一天）
      const today = new Date().toDateString()
      if (stats.last_reset !== today) {
        await this.resetDailyStats()
      }
      
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats(): Promise<{
    hit_count: number
    miss_count: number
    hit_rate_percent: number
    total_requests: number
    last_reset: string
  }> {
    try {
      const statsKey = 'cache:stats'
      const stats = await this.cache.get(statsKey, 'json') as any
      
      if (!stats) {
        return {
          hit_count: 0,
          miss_count: 0,
          hit_rate_percent: 0,
          total_requests: 0,
          last_reset: new Date().toDateString()
        }
      }

      const totalRequests = stats.hit_count + stats.miss_count
      const hitRatePercent = totalRequests > 0 
        ? (stats.hit_count / totalRequests) * 100 
        : 0

      return {
        ...stats,
        hit_rate_percent: Math.round(hitRatePercent * 100) / 100,
        total_requests: totalRequests
      }
      
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return {
        hit_count: 0,
        miss_count: 0,
        hit_rate_percent: 0,
        total_requests: 0,
        last_reset: new Date().toDateString()
      }
    }
  }

  /**
   * 记录缓存命中
   */
  private async recordCacheHit(key: string): Promise<void> {
    try {
      const statsKey = 'cache:stats'
      const stats = await this.cache.get(statsKey, 'json') as any || {
        hit_count: 0,
        miss_count: 0,
        last_reset: new Date().toDateString()
      }

      stats.hit_count += 1
      
      await this.cache.put(statsKey, JSON.stringify(stats), {
        expirationTtl: 86400 // 24小时
      })
      
    } catch (error) {
      console.error('Failed to record cache hit:', error)
    }
  }

  /**
   * 记录缓存未命中
   */
  private async recordCacheMiss(key: string): Promise<void> {
    try {
      const statsKey = 'cache:stats'
      const stats = await this.cache.get(statsKey, 'json') as any || {
        hit_count: 0,
        miss_count: 0,
        last_reset: new Date().toDateString()
      }

      stats.miss_count += 1
      
      await this.cache.put(statsKey, JSON.stringify(stats), {
        expirationTtl: 86400 // 24小时
      })
      
    } catch (error) {
      console.error('Failed to record cache miss:', error)
    }
  }

  /**
   * 记录缓存设置
   */
  private async recordCacheSet(key: string, ttl: number): Promise<void> {
    try {
      // 记录缓存设置统计
      const setStatsKey = 'cache:set_stats'
      const setStats = await this.cache.get(setStatsKey, 'json') as any || {
        set_count: 0,
        last_set: null
      }

      setStats.set_count += 1
      setStats.last_set = new Date().toISOString()
      
      await this.cache.put(setStatsKey, JSON.stringify(setStats), {
        expirationTtl: 86400
      })
      
    } catch (error) {
      console.error('Failed to record cache set:', error)
    }
  }

  /**
   * 重置每日统计
   */
  private async resetDailyStats(): Promise<void> {
    try {
      const today = new Date().toDateString()
      const resetStats = {
        hit_count: 0,
        miss_count: 0,
        last_reset: today
      }

      await this.cache.put('cache:stats', JSON.stringify(resetStats), {
        expirationTtl: 86400
      })
      
    } catch (error) {
      console.error('Failed to reset daily stats:', error)
    }
  }

  /**
   * 生成字符串哈希
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 预热缓存
   */
  async warmupCache(commonRequests: CalculatorRequest[]): Promise<void> {
    console.log(`Warming up cache with ${commonRequests.length} common requests`)
    
    for (const request of commonRequests) {
      try {
        const key = this.generateCacheKey(request)
        const existing = await this.get(key)
        
        if (!existing) {
          // 如果缓存中没有，可以预计算并缓存
          // 这里简化为记录需要预热的键
          console.log(`Cache warmup needed for key: ${key}`)
        }
      } catch (error) {
        console.error('Cache warmup error:', error)
      }
    }
  }

  /**
   * 获取缓存健康状态
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    hit_rate: number
    response_time_ms: number
    error_rate: number
  }> {
    try {
      const startTime = Date.now()
      
      // 测试缓存读写
      const testKey = `health:${Date.now()}`
      const testData = { test: true, timestamp: Date.now() }
      
      await this.cache.put(testKey, JSON.stringify(testData), { expirationTtl: 60 })
      const retrieved = await this.cache.get(testKey, 'json')
      await this.cache.delete(testKey)
      
      const responseTime = Date.now() - startTime
      const stats = await this.getCacheStats()
      
      // 评估健康状态
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      
      if (responseTime > 1000 || stats.hit_rate_percent < 50) {
        status = 'unhealthy'
      } else if (responseTime > 500 || stats.hit_rate_percent < 75) {
        status = 'degraded'
      }
      
      return {
        status,
        hit_rate: stats.hit_rate_percent,
        response_time_ms: responseTime,
        error_rate: 0 // 简化实现
      }
      
    } catch (error) {
      console.error('Cache health check failed:', error)
      return {
        status: 'unhealthy',
        hit_rate: 0,
        response_time_ms: 0,
        error_rate: 100
      }
    }
  }
}
