/**
 * 监控和告警系统测试
 * 验证监控指标收集、告警触发和通知功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AlertManager } from '../src/services/alert-manager'
import { MonitoringConfigManager } from '../src/utils/monitoring-config'

// 模拟环境
const mockEnv = {
  ENVIRONMENT: 'test',
  SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test',
  DEBUG: 'true'
} as any

// 模拟D1数据库
const createMockD1Database = () => ({
  prepare: vi.fn((sql: string) => ({
    bind: vi.fn((...params: any[]) => ({
      run: vi.fn(async () => ({ success: true })),
      first: vi.fn(async () => {
        if (sql.includes('system_config')) {
          return { config_value: 'test_value', config_type: 'string' }
        }
        return null
      }),
      all: vi.fn(async () => ({
        results: [
          { config_key: 'monitoring_enabled', config_value: 'true', config_type: 'boolean' },
          { config_key: 'alert_threshold', config_value: '100', config_type: 'number' }
        ]
      }))
    }))
  }))
}) as any

describe('AlertManager', () => {
  let alertManager: AlertManager
  let mockDb: any

  beforeEach(() => {
    mockDb = createMockD1Database()
    alertManager = new AlertManager(mockEnv, mockDb)
    
    // 清除所有定时器
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('告警规则管理', () => {
    it('应该正确初始化默认告警规则', () => {
      const rules = (alertManager as any).rules
      
      expect(rules.size).toBeGreaterThan(0)
      expect(rules.has('api_response_time_high')).toBe(true)
      expect(rules.has('error_rate_high')).toBe(true)
      expect(rules.has('cache_hit_rate_low')).toBe(true)
    })

    it('应该正确评估告警条件', () => {
      const evaluateCondition = (alertManager as any).evaluateCondition.bind(alertManager)
      
      // 大于条件
      expect(evaluateCondition(150, 100, 'greater_than')).toBe(true)
      expect(evaluateCondition(50, 100, 'greater_than')).toBe(false)
      
      // 小于条件
      expect(evaluateCondition(50, 100, 'less_than')).toBe(true)
      expect(evaluateCondition(150, 100, 'less_than')).toBe(false)
      
      // 等于条件
      expect(evaluateCondition(100, 100, 'equals')).toBe(true)
      expect(evaluateCondition(99.999, 100, 'equals')).toBe(true) // 浮点数精度
      expect(evaluateCondition(101, 100, 'equals')).toBe(false)
    })
  })

  describe('告警触发和解决', () => {
    it('应该正确触发告警', async () => {
      const metrics = [
        { name: 'api_response_time', value: 3000, timestamp: new Date().toISOString() }
      ]

      await alertManager.checkAlerts(metrics)

      const activeAlerts = alertManager.getActiveAlerts()
      expect(activeAlerts.length).toBe(1)
      expect(activeAlerts[0].rule_name).toBe('API响应时间过高')
      expect(activeAlerts[0].current_value).toBe(3000)
      expect(activeAlerts[0].status).toBe('active')
    })

    it('应该正确解决告警', async () => {
      // 先触发告警
      const highMetrics = [
        { name: 'api_response_time', value: 3000, timestamp: new Date().toISOString() }
      ]
      await alertManager.checkAlerts(highMetrics)
      
      expect(alertManager.getActiveAlerts().length).toBe(1)

      // 然后解决告警
      const normalMetrics = [
        { name: 'api_response_time', value: 500, timestamp: new Date().toISOString() }
      ]
      await alertManager.checkAlerts(normalMetrics)

      expect(alertManager.getActiveAlerts().length).toBe(0)
    })

    it('应该正确处理多个指标的告警', async () => {
      const metrics = [
        { name: 'api_response_time', value: 3000, timestamp: new Date().toISOString() },
        { name: 'api_error_rate', value: 8.0, timestamp: new Date().toISOString() },
        { name: 'cache_hit_rate', value: 50.0, timestamp: new Date().toISOString() }
      ]

      await alertManager.checkAlerts(metrics)

      const activeAlerts = alertManager.getActiveAlerts()
      expect(activeAlerts.length).toBe(3)
      
      const alertNames = activeAlerts.map(a => a.rule_name)
      expect(alertNames).toContain('API响应时间过高')
      expect(alertNames).toContain('错误率过高')
      expect(alertNames).toContain('缓存命中率过低')
    })
  })

  describe('告警抑制', () => {
    it('应该正确抑制告警', async () => {
      // 抑制告警规则
      alertManager.suppressAlert('api_response_time_high', 30)

      // 尝试触发被抑制的告警
      const metrics = [
        { name: 'api_response_time', value: 3000, timestamp: new Date().toISOString() }
      ]
      await alertManager.checkAlerts(metrics)

      // 应该没有活跃告警
      expect(alertManager.getActiveAlerts().length).toBe(0)
    })

    it('应该在抑制时间过后重新启用告警', async () => {
      // 抑制告警1分钟
      alertManager.suppressAlert('api_response_time_high', 1)

      // 立即检查 - 应该被抑制
      const metrics = [
        { name: 'api_response_time', value: 3000, timestamp: new Date().toISOString() }
      ]
      await alertManager.checkAlerts(metrics)
      expect(alertManager.getActiveAlerts().length).toBe(0)

      // 快进2分钟
      vi.advanceTimersByTime(2 * 60 * 1000)

      // 再次检查 - 应该触发告警
      await alertManager.checkAlerts(metrics)
      expect(alertManager.getActiveAlerts().length).toBe(1)
    })
  })

  describe('通知系统', () => {
    it('应该正确发送控制台通知', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const metrics = [
        { name: 'api_response_time', value: 3000, timestamp: new Date().toISOString() }
      ]
      await alertManager.checkAlerts(metrics)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨 ALERT: API响应时间过高')
      )

      consoleSpy.mockRestore()
    })

    it('应该正确处理Slack通知', async () => {
      // 模拟fetch
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response('ok', { status: 200 })
      )

      const metrics = [
        { name: 'api_error_rate', value: 8.0, timestamp: new Date().toISOString() }
      ]
      await alertManager.checkAlerts(metrics)

      expect(fetchSpy).toHaveBeenCalledWith(
        mockEnv.SLACK_WEBHOOK_URL,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )

      fetchSpy.mockRestore()
    })

    it('应该处理通知发送失败', async () => {
      // 模拟fetch失败
      const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(
        new Error('Network error')
      )
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const metrics = [
        { name: 'api_error_rate', value: 8.0, timestamp: new Date().toISOString() }
      ]
      await alertManager.checkAlerts(metrics)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send notification'),
        expect.any(Error)
      )

      fetchSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('告警统计', () => {
    it('应该正确计算告警统计', async () => {
      // 触发多个不同严重程度的告警
      const metrics = [
        { name: 'api_response_time', value: 3000, timestamp: new Date().toISOString() }, // warning
        { name: 'api_error_rate', value: 8.0, timestamp: new Date().toISOString() }, // error
        { name: 'service_availability', value: 95.0, timestamp: new Date().toISOString() } // critical
      ]
      await alertManager.checkAlerts(metrics)

      const stats = alertManager.getAlertStats()
      
      expect(stats.total_active).toBe(3)
      expect(stats.by_severity.warning).toBe(1)
      expect(stats.by_severity.error).toBe(1)
      expect(stats.by_severity.critical).toBe(1)
      expect(stats.by_metric.api_response_time).toBe(1)
      expect(stats.by_metric.api_error_rate).toBe(1)
      expect(stats.by_metric.service_availability).toBe(1)
    })
  })
})

describe('MonitoringConfigManager', () => {
  let configManager: MonitoringConfigManager
  let mockDb: any

  beforeEach(() => {
    mockDb = createMockD1Database()
    configManager = new MonitoringConfigManager(mockEnv, mockDb)
  })

  describe('配置加载', () => {
    it('应该正确加载默认配置', async () => {
      const config = await configManager.loadConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.collection_interval).toBe(30)
      expect(config.health_checks.api.enabled).toBe(true)
      expect(config.alerts.enabled).toBe(true)
      expect(config.notifications.slack.enabled).toBe(true) // 因为有SLACK_WEBHOOK_URL
    })

    it('应该正确应用环境变量覆盖', async () => {
      const config = await configManager.loadConfig()
      
      // 检查Slack配置是否被环境变量覆盖
      expect(config.notifications.slack.enabled).toBe(true)
      expect(config.notifications.slack.webhook_url).toBe(mockEnv.SLACK_WEBHOOK_URL)
      
      // 检查调试模式配置
      expect(config.collection_interval).toBe(10) // 调试模式下更频繁
      expect(config.dashboard.refresh_interval).toBe(10)
    })
  })

  describe('配置验证', () => {
    it('应该正确验证有效配置', () => {
      const validConfig = {
        collection_interval: 30,
        retention_days: 7,
        alerts: {
          rules: [
            {
              name: '测试规则',
              metric: 'test_metric',
              threshold: 100,
              comparison: 'greater_than',
              severity: 'warning',
              duration_minutes: 5,
              channels: ['log'],
              description: '测试告警规则'
            }
          ]
        }
      }

      const result = configManager.validateConfig(validConfig)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该正确识别无效配置', () => {
      const invalidConfig = {
        collection_interval: 5, // 太小
        retention_days: 0, // 太小
        alerts: {
          rules: [
            {
              name: '', // 空名称
              metric: '',
              threshold: -1, // 负数
              comparison: 'greater_than',
              severity: 'warning',
              duration_minutes: 5,
              channels: ['log'],
              description: ''
            }
          ]
        }
      }

      const result = configManager.validateConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContain('收集间隔不能少于10秒')
      expect(result.errors).toContain('数据保留天数不能少于1天')
    })
  })

  describe('配置持久化', () => {
    it('应该正确保存配置到数据库', async () => {
      const newConfig = {
        collection_interval: 60,
        alerts: {
          enabled: false
        }
      }

      await configManager.saveConfig(newConfig)

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO system_config')
      )
    })

    it('应该正确获取特定配置值', async () => {
      const value = await configManager.getConfigValue('health_checks.api.timeout', 10)
      expect(typeof value).toBe('number')
    })

    it('应该正确更新特定配置值', async () => {
      await configManager.updateConfigValue('collection_interval', 45)
      
      const updatedValue = await configManager.getConfigValue('collection_interval')
      expect(updatedValue).toBe(45)
    })
  })

  describe('配置缓存', () => {
    it('应该正确缓存配置', async () => {
      // 第一次加载
      await configManager.loadConfig()
      
      // 第二次加载应该使用缓存
      const config = await configManager.loadConfig()
      
      // 验证数据库只被调用一次（第一次加载时）
      expect(mockDb.prepare).toHaveBeenCalledTimes(1)
    })
  })
})
