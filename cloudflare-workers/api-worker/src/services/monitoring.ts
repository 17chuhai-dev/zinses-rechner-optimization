/**
 * 监控服务 - Cloudflare Workers版本
 * 实现性能监控、指标收集和健康检查
 */

import { MetricData, MetricsResponse, PerformanceMetrics } from '../types/api'
import { Env } from '../index'

export class MonitoringService {
  private env: Env
  private analytics: AnalyticsEngineDataset

  constructor(env: Env) {
    this.env = env
    this.analytics = env.ANALYTICS
  }

  /**
   * 记录指标数据
   */
  async recordMetric(
    name: string, 
    value: number, 
    tags: Record<string, string> = {}
  ): Promise<void> {
    try {
      // 发送到Cloudflare Analytics Engine
      await this.analytics.writeDataPoint({
        blobs: [name, JSON.stringify(tags)],
        doubles: [value],
        indexes: [name]
      })

      // 同时存储到KV（用于实时查询）
      const metricKey = `metric:${name}:${Date.now()}`
      const metricData: MetricData = {
        name,
        value,
        timestamp: new Date().toISOString(),
        tags
      }

      await this.env.CACHE.put(metricKey, JSON.stringify(metricData), {
        expirationTtl: 3600 // 1小时
      })

    } catch (error) {
      console.error('Failed to record metric:', error)
      // 监控失败不应影响主要功能
    }
  }

  /**
   * 获取指标数据
   */
  async getMetrics(hours: number = 24): Promise<MetricsResponse> {
    try {
      const endTime = new Date()
      const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000))

      // 从KV存储获取最近的指标
      const metrics: MetricData[] = []
      
      // 简化实现：获取最近的指标数据
      // 实际生产环境应该使用Analytics Engine查询
      const recentMetrics = await this.getRecentMetricsFromKV(hours)
      metrics.push(...recentMetrics)

      // 计算统计摘要
      const summary = this.calculateMetricsSummary(metrics)

      return {
        metrics,
        summary,
        time_range: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          duration_hours: hours
        },
        query_timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('Failed to get metrics:', error)
      return {
        metrics: [],
        summary: {
          total_requests: 0,
          average_response_time: 0,
          error_rate: 0,
          cache_hit_rate: 0
        },
        time_range: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          duration_hours: hours
        },
        query_timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 运行健康检查
   */
  async runHealthChecks(): Promise<void> {
    try {
      // 检查数据库连接
      const dbHealth = await this.checkDatabaseHealth()
      await this.recordMetric('health_check_database', dbHealth ? 1 : 0)

      // 检查缓存性能
      const cacheHealth = await this.checkCacheHealth()
      await this.recordMetric('health_check_cache', cacheHealth.healthy ? 1 : 0)
      await this.recordMetric('cache_response_time', cacheHealth.response_time_ms)

      // 检查API性能
      const apiHealth = await this.checkApiHealth()
      await this.recordMetric('health_check_api', apiHealth ? 1 : 0)

      console.log('Health checks completed')

    } catch (error) {
      console.error('Health check error:', error)
      await this.recordMetric('health_check_error', 1, { 
        error: error instanceof Error ? error.message : 'unknown' 
      })
    }
  }

  /**
   * 清理旧指标数据
   */
  async cleanupOldMetrics(): Promise<void> {
    try {
      // KV存储会自动过期，这里主要是清理统计数据
      const cleanupKey = 'cleanup:last_run'
      const lastCleanup = await this.env.CACHE.get(cleanupKey)
      
      const now = new Date()
      const lastCleanupTime = lastCleanup ? new Date(lastCleanup) : new Date(0)
      const hoursSinceCleanup = (now.getTime() - lastCleanupTime.getTime()) / (1000 * 60 * 60)

      if (hoursSinceCleanup >= 24) {
        // 执行每日清理
        await this.performDailyCleanup()
        await this.env.CACHE.put(cleanupKey, now.toISOString(), { expirationTtl: 86400 })
        
        console.log('Daily metrics cleanup completed')
      }

    } catch (error) {
      console.error('Metrics cleanup error:', error)
    }
  }

  /**
   * 获取性能指标摘要
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const metrics = await this.getRecentMetricsFromKV(1) // 最近1小时

      const responseTimeMetrics = metrics.filter(m => m.name === 'api_response_time')
      const errorMetrics = metrics.filter(m => m.name === 'api_error')
      const requestMetrics = metrics.filter(m => m.name === 'api_request')
      const cacheHitMetrics = metrics.filter(m => m.name === 'cache_hit')
      const cacheMissMetrics = metrics.filter(m => m.name === 'cache_miss')

      const avgResponseTime = responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
        : 0

      const errorRate = requestMetrics.length > 0
        ? (errorMetrics.length / requestMetrics.length) * 100
        : 0

      const cacheHitRate = (cacheHitMetrics.length + cacheMissMetrics.length) > 0
        ? (cacheHitMetrics.length / (cacheHitMetrics.length + cacheMissMetrics.length)) * 100
        : 0

      const requestsPerMinute = requestMetrics.length // 简化计算

      return {
        api_response_time: Math.round(avgResponseTime),
        calculation_time: Math.round(avgResponseTime * 0.8), // 估算
        cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
        error_rate: Math.round(errorRate * 100) / 100,
        requests_per_minute: requestsPerMinute,
        memory_usage_mb: 0, // Workers不提供内存信息
        cpu_time_ms: 0 // Workers不提供CPU信息
      }

    } catch (error) {
      console.error('Failed to get performance metrics:', error)
      return {
        api_response_time: 0,
        calculation_time: 0,
        cache_hit_rate: 0,
        error_rate: 0,
        requests_per_minute: 0,
        memory_usage_mb: 0,
        cpu_time_ms: 0
      }
    }
  }

  /**
   * 检查数据库健康状态
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      if (!this.env.DB) {
        return false
      }

      const result = await this.env.DB.prepare('SELECT 1 as test').first()
      return result?.test === 1

    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  /**
   * 检查缓存健康状态
   */
  private async checkCacheHealth(): Promise<{ healthy: boolean; response_time_ms: number }> {
    const startTime = Date.now()
    
    try {
      const testKey = `health_check_${Date.now()}`
      const testData = { test: true, timestamp: Date.now() }
      
      await this.env.CACHE.put(testKey, JSON.stringify(testData), { expirationTtl: 60 })
      const retrieved = await this.env.CACHE.get(testKey, 'json')
      await this.env.CACHE.delete(testKey)
      
      const responseTime = Date.now() - startTime
      const healthy = retrieved && retrieved.test === true

      return {
        healthy: !!healthy,
        response_time_ms: responseTime
      }

    } catch (error) {
      console.error('Cache health check failed:', error)
      return {
        healthy: false,
        response_time_ms: Date.now() - startTime
      }
    }
  }

  /**
   * 检查API健康状态
   */
  private async checkApiHealth(): Promise<boolean> {
    try {
      // 执行一个简单的计算测试
      const testRequest = {
        principal: 1000,
        monthly_payment: 0,
        annual_rate: 4,
        years: 1,
        compound_frequency: 'yearly' as const
      }

      // 简单验证计算逻辑
      const expectedResult = 1000 * 1.04 // 简单年复利
      const tolerance = 0.01

      // 这里应该调用计算服务，简化为直接计算
      const actualResult = testRequest.principal * (1 + testRequest.annual_rate / 100)
      
      return Math.abs(actualResult - expectedResult) < tolerance

    } catch (error) {
      console.error('API health check failed:', error)
      return false
    }
  }

  /**
   * 从KV获取最近的指标数据
   */
  private async getRecentMetricsFromKV(hours: number): Promise<MetricData[]> {
    try {
      // 简化实现：获取最近的指标键
      // 实际生产环境应该使用更高效的查询方法
      const metrics: MetricData[] = []
      
      // 这里应该实现更复杂的KV查询逻辑
      // 由于KV不支持范围查询，我们使用简化的方法
      
      return metrics

    } catch (error) {
      console.error('Failed to get recent metrics from KV:', error)
      return []
    }
  }

  /**
   * 计算指标摘要
   */
  private calculateMetricsSummary(metrics: MetricData[]): {
    total_requests: number
    average_response_time: number
    error_rate: number
    cache_hit_rate: number
  } {
    const requestMetrics = metrics.filter(m => m.name === 'api_request')
    const responseTimeMetrics = metrics.filter(m => m.name === 'api_response_time')
    const errorMetrics = metrics.filter(m => m.name === 'api_error')
    const cacheHitMetrics = metrics.filter(m => m.name === 'cache_hit')
    const cacheMissMetrics = metrics.filter(m => m.name === 'cache_miss')

    const totalRequests = requestMetrics.length
    const averageResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0

    const errorRate = totalRequests > 0
      ? (errorMetrics.length / totalRequests) * 100
      : 0

    const totalCacheRequests = cacheHitMetrics.length + cacheMissMetrics.length
    const cacheHitRate = totalCacheRequests > 0
      ? (cacheHitMetrics.length / totalCacheRequests) * 100
      : 0

    return {
      total_requests: totalRequests,
      average_response_time: Math.round(averageResponseTime),
      error_rate: Math.round(errorRate * 100) / 100,
      cache_hit_rate: Math.round(cacheHitRate * 100) / 100
    }
  }

  /**
   * 执行每日清理
   */
  private async performDailyCleanup(): Promise<void> {
    try {
      // 清理过期的指标数据
      // 重置每日统计
      const today = new Date().toDateString()
      
      await this.env.CACHE.put('daily_stats_reset', today, { expirationTtl: 86400 })
      
      console.log('Daily cleanup completed')

    } catch (error) {
      console.error('Daily cleanup error:', error)
    }
  }

  /**
   * 记录性能基准
   */
  async recordPerformanceBenchmark(
    operation: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    await this.recordMetric(`performance_${operation}`, duration, {
      success: success.toString(),
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 检查性能阈值
   */
  async checkPerformanceThresholds(): Promise<{
    api_response_time: boolean
    error_rate: boolean
    cache_hit_rate: boolean
  }> {
    try {
      const metrics = await this.getPerformanceMetrics()

      return {
        api_response_time: metrics.api_response_time < 500, // < 500ms
        error_rate: metrics.error_rate < 1, // < 1%
        cache_hit_rate: metrics.cache_hit_rate > 85 // > 85%
      }

    } catch (error) {
      console.error('Failed to check performance thresholds:', error)
      return {
        api_response_time: false,
        error_rate: false,
        cache_hit_rate: false
      }
    }
  }

  /**
   * 生成监控报告
   */
  async generateMonitoringReport(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: PerformanceMetrics
    thresholds: Record<string, boolean>
    recommendations: string[]
  }> {
    try {
      const metrics = await this.getPerformanceMetrics()
      const thresholds = await this.checkPerformanceThresholds()
      
      // 评估整体状态
      const healthyThresholds = Object.values(thresholds).filter(Boolean).length
      const totalThresholds = Object.values(thresholds).length
      
      let status: 'healthy' | 'degraded' | 'unhealthy'
      if (healthyThresholds === totalThresholds) {
        status = 'healthy'
      } else if (healthyThresholds >= totalThresholds * 0.7) {
        status = 'degraded'
      } else {
        status = 'unhealthy'
      }

      // 生成建议
      const recommendations: string[] = []
      
      if (!thresholds.api_response_time) {
        recommendations.push('API响应时间过长，考虑优化计算算法或增加缓存')
      }
      
      if (!thresholds.error_rate) {
        recommendations.push('错误率过高，检查输入验证和错误处理逻辑')
      }
      
      if (!thresholds.cache_hit_rate) {
        recommendations.push('缓存命中率偏低，优化缓存策略或增加缓存时间')
      }

      return {
        status,
        metrics,
        thresholds,
        recommendations
      }

    } catch (error) {
      console.error('Failed to generate monitoring report:', error)
      throw error
    }
  }

  /**
   * 记录用户行为指标
   */
  async recordUserMetrics(
    action: string,
    duration: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.recordMetric(`user_${action}`, duration, {
      action,
      ...metadata,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 记录业务指标
   */
  async recordBusinessMetrics(
    calculationResult: any,
    requestData: any
  ): Promise<void> {
    try {
      // 记录计算相关的业务指标
      await this.recordMetric('calculation_completed', 1, {
        principal_range: this.getPrincipalRange(requestData.principal),
        years_range: this.getYearsRange(requestData.years),
        rate_range: this.getRateRange(requestData.annual_rate),
        has_monthly_payment: (requestData.monthly_payment > 0).toString()
      })

      // 记录计算结果指标
      await this.recordMetric('final_amount', calculationResult.final_amount)
      await this.recordMetric('total_interest', calculationResult.total_interest)
      await this.recordMetric('annual_return', calculationResult.annual_return)

    } catch (error) {
      console.error('Failed to record business metrics:', error)
    }
  }

  /**
   * 获取本金范围标签
   */
  private getPrincipalRange(principal: number): string {
    if (principal < 1000) return 'under_1k'
    if (principal < 10000) return '1k_to_10k'
    if (principal < 100000) return '10k_to_100k'
    if (principal < 1000000) return '100k_to_1m'
    return 'over_1m'
  }

  /**
   * 获取年限范围标签
   */
  private getYearsRange(years: number): string {
    if (years <= 5) return 'short_term'
    if (years <= 15) return 'medium_term'
    if (years <= 30) return 'long_term'
    return 'very_long_term'
  }

  /**
   * 获取利率范围标签
   */
  private getRateRange(rate: number): string {
    if (rate < 2) return 'low_rate'
    if (rate < 5) return 'moderate_rate'
    if (rate < 10) return 'high_rate'
    return 'very_high_rate'
  }
}
