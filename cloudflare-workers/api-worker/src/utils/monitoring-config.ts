/**
 * 监控配置管理器
 * 动态配置监控规则和告警阈值
 */

export interface MonitoringConfig {
  enabled: boolean
  collection_interval: number
  retention_days: number
  health_checks: HealthCheckConfig
  metrics: MetricsConfig
  alerts: AlertsConfig
  notifications: NotificationsConfig
  dashboard: DashboardConfig
}

export interface HealthCheckConfig {
  api: {
    enabled: boolean
    timeout: number
    interval: number
    endpoint: string
  }
  database: {
    enabled: boolean
    timeout: number
    interval: number
  }
  cache: {
    enabled: boolean
    timeout: number
    interval: number
    min_hit_rate: number
  }
  system: {
    enabled: boolean
    interval: number
    thresholds: {
      cpu_warning: number
      cpu_critical: number
      memory_warning: number
      memory_critical: number
    }
  }
}

export interface MetricsConfig {
  system_metrics: {
    enabled: boolean
    interval: number
    include: string[]
  }
  api_metrics: {
    enabled: boolean
    interval: number
    include: string[]
  }
  business_metrics: {
    enabled: boolean
    interval: number
    include: string[]
  }
}

export interface AlertsConfig {
  enabled: boolean
  rules: AlertRuleConfig[]
}

export interface AlertRuleConfig {
  name: string
  metric: string
  threshold: number
  comparison: string
  severity: string
  duration_minutes: number
  channels: string[]
  description: string
}

export interface NotificationsConfig {
  enabled: boolean
  email: {
    enabled: boolean
    smtp_server: string
    smtp_port: number
    recipients: {
      default: string[]
      critical: string[]
      escalation: string[]
    }
  }
  slack: {
    enabled: boolean
    webhook_url: string
    channel: string
    username: string
  }
  webhook: {
    enabled: boolean
    urls: string[]
    timeout: number
  }
}

export interface DashboardConfig {
  enabled: boolean
  refresh_interval: number
  display: {
    max_alerts_shown: number
    max_metrics_history: number
    chart_time_range: number
  }
  targets: {
    api_response_time: number
    cache_hit_rate: number
    error_rate: number
    availability: number
    cpu_usage: number
    memory_usage: number
  }
}

export class MonitoringConfigManager {
  private config: MonitoringConfig
  private configCache: Map<string, any> = new Map()
  private lastUpdate: number = 0
  private cacheTimeout: number = 300000 // 5分钟

  constructor(private env: Env, private db?: D1Database) {
    this.config = this.getDefaultConfig()
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): MonitoringConfig {
    return {
      enabled: true,
      collection_interval: 30,
      retention_days: 30,
      
      health_checks: {
        api: {
          enabled: true,
          timeout: 5,
          interval: 30,
          endpoint: '/health'
        },
        database: {
          enabled: true,
          timeout: 3,
          interval: 60
        },
        cache: {
          enabled: true,
          timeout: 2,
          interval: 30,
          min_hit_rate: 80
        },
        system: {
          enabled: true,
          interval: 30,
          thresholds: {
            cpu_warning: 70,
            cpu_critical: 90,
            memory_warning: 70,
            memory_critical: 90
          }
        }
      },

      metrics: {
        system_metrics: {
          enabled: true,
          interval: 30,
          include: ['cpu_usage', 'memory_usage', 'response_time']
        },
        api_metrics: {
          enabled: true,
          interval: 60,
          include: ['response_time', 'request_count', 'error_rate', 'cache_hit_rate']
        },
        business_metrics: {
          enabled: true,
          interval: 300,
          include: ['calculations_per_hour', 'unique_visitors', 'conversion_rate']
        }
      },

      alerts: {
        enabled: true,
        rules: [
          {
            name: 'API响应时间过高',
            metric: 'api.response_time',
            threshold: 2000,
            comparison: 'greater_than',
            severity: 'warning',
            duration_minutes: 5,
            channels: ['log', 'email'],
            description: 'API平均响应时间超过2秒'
          },
          {
            name: '错误率过高',
            metric: 'api.error_rate',
            threshold: 5.0,
            comparison: 'greater_than',
            severity: 'error',
            duration_minutes: 3,
            channels: ['log', 'email', 'slack'],
            description: 'API错误率超过5%'
          },
          {
            name: '缓存命中率过低',
            metric: 'cache.hit_rate',
            threshold: 70.0,
            comparison: 'less_than',
            severity: 'warning',
            duration_minutes: 10,
            channels: ['log'],
            description: '缓存命中率低于70%'
          }
        ]
      },

      notifications: {
        enabled: true,
        email: {
          enabled: false,
          smtp_server: 'smtp.gmail.com',
          smtp_port: 587,
          recipients: {
            default: ['admin@zinses-rechner.de'],
            critical: ['admin@zinses-rechner.de', 'oncall@zinses-rechner.de'],
            escalation: ['cto@zinses-rechner.de']
          }
        },
        slack: {
          enabled: !!this.env.SLACK_WEBHOOK_URL,
          webhook_url: this.env.SLACK_WEBHOOK_URL || '',
          channel: '#alerts',
          username: 'Zinses-Rechner Monitor'
        },
        webhook: {
          enabled: false,
          urls: [],
          timeout: 10
        }
      },

      dashboard: {
        enabled: true,
        refresh_interval: 30,
        display: {
          max_alerts_shown: 10,
          max_metrics_history: 100,
          chart_time_range: 24
        },
        targets: {
          api_response_time: 500,
          cache_hit_rate: 85,
          error_rate: 0.1,
          availability: 99.9,
          cpu_usage: 80,
          memory_usage: 80
        }
      }
    }
  }

  /**
   * 加载配置
   */
  async loadConfig(): Promise<MonitoringConfig> {
    // 检查缓存
    if (this.isCacheValid()) {
      return this.config
    }

    try {
      // 从数据库加载配置
      if (this.db) {
        const dbConfig = await this.loadConfigFromDatabase()
        if (dbConfig) {
          this.config = { ...this.config, ...dbConfig }
        }
      }

      // 从环境变量覆盖配置
      this.applyEnvironmentOverrides()

      // 更新缓存时间戳
      this.lastUpdate = Date.now()

      return this.config

    } catch (error) {
      console.error('Failed to load monitoring config:', error)
      return this.config
    }
  }

  /**
   * 从数据库加载配置
   */
  private async loadConfigFromDatabase(): Promise<Partial<MonitoringConfig> | null> {
    if (!this.db) return null

    try {
      const stmt = this.db.prepare(`
        SELECT config_key, config_value, config_type 
        FROM system_config 
        WHERE config_key LIKE 'monitoring_%' OR config_key LIKE 'alert_%'
      `)

      const results = await stmt.all()
      const dbConfig: any = {}

      for (const row of results.results) {
        const key = (row as any).config_key.replace('monitoring_', '').replace('alert_', 'alerts.')
        let value = (row as any).config_value

        // 类型转换
        switch ((row as any).config_type) {
          case 'number':
            value = parseFloat(value)
            break
          case 'boolean':
            value = value === 'true'
            break
          case 'json':
            try {
              value = JSON.parse(value)
            } catch {
              // 保持原值
            }
            break
        }

        // 设置嵌套属性
        this.setNestedProperty(dbConfig, key, value)
      }

      return dbConfig

    } catch (error) {
      console.error('Failed to load config from database:', error)
      return null
    }
  }

  /**
   * 应用环境变量覆盖
   */
  private applyEnvironmentOverrides(): void {
    // Slack配置
    if (this.env.SLACK_WEBHOOK_URL) {
      this.config.notifications.slack.enabled = true
      this.config.notifications.slack.webhook_url = this.env.SLACK_WEBHOOK_URL
    }

    // 邮件配置
    if (this.env.SMTP_PASSWORD) {
      this.config.notifications.email.enabled = true
    }

    // 调试模式
    if (this.env.DEBUG === 'true') {
      this.config.collection_interval = 10 // 更频繁的收集
      this.config.dashboard.refresh_interval = 10
    }

    // 生产环境特殊配置
    if (this.env.ENVIRONMENT === 'production') {
      this.config.retention_days = 90
      this.config.alerts.rules.forEach(rule => {
        if (rule.severity === 'critical') {
          rule.channels.push('slack')
        }
      })
    }
  }

  /**
   * 保存配置到数据库
   */
  async saveConfig(config: Partial<MonitoringConfig>): Promise<void> {
    if (!this.db) return

    try {
      // 将配置扁平化并保存到数据库
      const flatConfig = this.flattenConfig(config)

      for (const [key, value] of Object.entries(flatConfig)) {
        const configKey = `monitoring_${key}`
        const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
        const configType = typeof value === 'number' ? 'number' : 
                          typeof value === 'boolean' ? 'boolean' :
                          typeof value === 'object' ? 'json' : 'string'

        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO system_config 
          (config_key, config_value, config_type, updated_at)
          VALUES (?, ?, ?, ?)
        `)

        await stmt.bind(
          configKey,
          configValue,
          configType,
          new Date().toISOString()
        ).run()
      }

      // 更新内存配置
      this.config = { ...this.config, ...config }
      this.lastUpdate = Date.now()

    } catch (error) {
      console.error('Failed to save monitoring config:', error)
      throw error
    }
  }

  /**
   * 获取特定配置项
   */
  async getConfigValue<T>(path: string, defaultValue?: T): Promise<T> {
    const config = await this.loadConfig()
    return this.getNestedProperty(config, path) ?? defaultValue
  }

  /**
   * 更新特定配置项
   */
  async updateConfigValue(path: string, value: any): Promise<void> {
    const config = await this.loadConfig()
    this.setNestedProperty(config, path, value)
    await this.saveConfig(config)
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastUpdate < this.cacheTimeout
  }

  /**
   * 扁平化配置对象
   */
  private flattenConfig(obj: any, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenConfig(value, newKey))
      } else {
        flattened[newKey] = value
      }
    }

    return flattened
  }

  /**
   * 获取嵌套属性
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 设置嵌套属性
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {}
      }
      return current[key]
    }, obj)

    target[lastKey] = value
  }

  /**
   * 重置为默认配置
   */
  async resetToDefaults(): Promise<void> {
    this.config = this.getDefaultConfig()
    await this.saveConfig(this.config)
  }

  /**
   * 验证配置
   */
  validateConfig(config: Partial<MonitoringConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 验证基本配置
    if (config.collection_interval && config.collection_interval < 10) {
      errors.push('收集间隔不能少于10秒')
    }

    if (config.retention_days && config.retention_days < 1) {
      errors.push('数据保留天数不能少于1天')
    }

    // 验证告警规则
    if (config.alerts?.rules) {
      config.alerts.rules.forEach((rule, index) => {
        if (!rule.name || !rule.metric) {
          errors.push(`告警规则 ${index + 1}: 名称和指标不能为空`)
        }
        if (rule.threshold === undefined || rule.threshold < 0) {
          errors.push(`告警规则 ${index + 1}: 阈值必须为非负数`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
