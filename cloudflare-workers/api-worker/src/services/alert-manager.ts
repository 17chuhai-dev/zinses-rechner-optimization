/**
 * 告警管理服务
 * 实现智能告警规则引擎和通知系统
 */

export interface AlertRule {
  id: string
  name: string
  metric_name: string
  threshold: number
  comparison: 'greater_than' | 'less_than' | 'equals' | 'not_equals'
  severity: 'info' | 'warning' | 'error' | 'critical'
  duration_minutes: number
  enabled: boolean
  channels: string[]
  description?: string
  tags?: Record<string, string>
}

export interface Alert {
  id: string
  rule_id: string
  rule_name: string
  metric_name: string
  current_value: number
  threshold_value: number
  severity: string
  message: string
  triggered_at: string
  resolved_at?: string
  status: 'active' | 'resolved' | 'suppressed'
  notification_sent: boolean
  escalation_level: number
}

export interface NotificationChannel {
  id: string
  type: 'email' | 'slack' | 'webhook' | 'sms'
  name: string
  config: Record<string, any>
  enabled: boolean
}

export class AlertManager {
  private rules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private channels: Map<string, NotificationChannel> = new Map()
  private suppressions: Map<string, number> = new Map()

  constructor(private env: Env, private db?: D1Database) {
    this.initializeDefaultRules()
    this.initializeDefaultChannels()
  }

  /**
   * 初始化默认告警规则
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'api_response_time_high',
        name: 'API响应时间过高',
        metric_name: 'api_response_time',
        threshold: 2000,
        comparison: 'greater_than',
        severity: 'warning',
        duration_minutes: 5,
        enabled: true,
        channels: ['log', 'email'],
        description: 'API平均响应时间超过2秒'
      },
      {
        id: 'error_rate_high',
        name: '错误率过高',
        metric_name: 'api_error_rate',
        threshold: 5.0,
        comparison: 'greater_than',
        severity: 'error',
        duration_minutes: 3,
        enabled: true,
        channels: ['log', 'email', 'slack'],
        description: 'API错误率超过5%'
      },
      {
        id: 'calculation_failure_rate',
        name: '计算失败率异常',
        metric_name: 'calculation_failure_rate',
        threshold: 2.0,
        comparison: 'greater_than',
        severity: 'error',
        duration_minutes: 5,
        enabled: true,
        channels: ['log', 'email'],
        description: '计算失败率超过2%'
      },
      {
        id: 'cache_hit_rate_low',
        name: '缓存命中率过低',
        metric_name: 'cache_hit_rate',
        threshold: 70.0,
        comparison: 'less_than',
        severity: 'warning',
        duration_minutes: 10,
        enabled: true,
        channels: ['log'],
        description: '缓存命中率低于70%'
      },
      {
        id: 'database_response_time',
        name: '数据库响应时间过长',
        metric_name: 'database_response_time',
        threshold: 1000,
        comparison: 'greater_than',
        severity: 'warning',
        duration_minutes: 5,
        enabled: true,
        channels: ['log', 'email'],
        description: '数据库平均响应时间超过1秒'
      },
      {
        id: 'service_availability',
        name: '服务可用性告警',
        metric_name: 'service_availability',
        threshold: 99.0,
        comparison: 'less_than',
        severity: 'critical',
        duration_minutes: 1,
        enabled: true,
        channels: ['log', 'email', 'slack'],
        description: '服务可用性低于99%'
      }
    ]

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule)
    })
  }

  /**
   * 初始化默认通知渠道
   */
  private initializeDefaultChannels(): void {
    const defaultChannels: NotificationChannel[] = [
      {
        id: 'log',
        type: 'webhook',
        name: '日志记录',
        config: { console: true },
        enabled: true
      },
      {
        id: 'email',
        type: 'email',
        name: '邮件通知',
        config: {
          recipients: ['admin@zinses-rechner.de'],
          smtp_server: 'smtp.gmail.com',
          smtp_port: 587
        },
        enabled: false // 需要配置SMTP
      },
      {
        id: 'slack',
        type: 'slack',
        name: 'Slack通知',
        config: {
          webhook_url: this.env.SLACK_WEBHOOK_URL || '',
          channel: '#alerts',
          username: 'Zinses-Rechner Monitor'
        },
        enabled: !!this.env.SLACK_WEBHOOK_URL
      }
    ]

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel)
    })
  }

  /**
   * 检查告警规则
   */
  async checkAlerts(metrics: Array<{ name: string; value: number; timestamp: string }>): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue

      const relevantMetrics = metrics.filter(m => m.metric_name === rule.metric_name)
      if (relevantMetrics.length === 0) continue

      // 计算指标平均值
      const avgValue = relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length

      // 检查是否触发告警
      const shouldAlert = this.evaluateCondition(avgValue, rule.threshold, rule.comparison)

      if (shouldAlert) {
        await this.triggerAlert(rule, avgValue)
      } else {
        await this.resolveAlert(rule.id)
      }
    }
  }

  /**
   * 评估告警条件
   */
  private evaluateCondition(value: number, threshold: number, comparison: string): boolean {
    switch (comparison) {
      case 'greater_than':
        return value > threshold
      case 'less_than':
        return value < threshold
      case 'equals':
        return Math.abs(value - threshold) < 0.001
      case 'not_equals':
        return Math.abs(value - threshold) >= 0.001
      default:
        return false
    }
  }

  /**
   * 触发告警
   */
  private async triggerAlert(rule: AlertRule, currentValue: number): Promise<void> {
    const alertId = `${rule.id}_${Date.now()}`
    
    // 检查是否已有活跃告警
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.rule_id === rule.id && alert.status === 'active')

    if (existingAlert) {
      // 更新现有告警
      existingAlert.current_value = currentValue
      return
    }

    // 检查抑制规则
    if (this.isAlertSuppressed(rule.id)) {
      return
    }

    const alert: Alert = {
      id: alertId,
      rule_id: rule.id,
      rule_name: rule.name,
      metric_name: rule.metric_name,
      current_value: currentValue,
      threshold_value: rule.threshold,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, currentValue),
      triggered_at: new Date().toISOString(),
      status: 'active',
      notification_sent: false,
      escalation_level: 0
    }

    this.activeAlerts.set(alertId, alert)

    // 发送通知
    await this.sendNotifications(alert, rule.channels)

    // 保存到数据库
    if (this.db) {
      await this.saveAlertToDatabase(alert)
    }

    console.log(`Alert triggered: ${rule.name} - ${alert.message}`)
  }

  /**
   * 解决告警
   */
  private async resolveAlert(ruleId: string): Promise<void> {
    const activeAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.rule_id === ruleId && alert.status === 'active')

    if (activeAlert) {
      activeAlert.status = 'resolved'
      activeAlert.resolved_at = new Date().toISOString()

      // 发送解决通知
      const rule = this.rules.get(ruleId)
      if (rule) {
        await this.sendResolutionNotification(activeAlert, rule.channels)
      }

      // 从活跃告警中移除
      this.activeAlerts.delete(activeAlert.id)

      console.log(`Alert resolved: ${activeAlert.rule_name}`)
    }
  }

  /**
   * 生成告警消息
   */
  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const comparison = rule.comparison === 'greater_than' ? '超过' : 
                      rule.comparison === 'less_than' ? '低于' : '等于'
    
    return `${rule.description || rule.name}: 当前值 ${currentValue.toFixed(2)} ${comparison} 阈值 ${rule.threshold}`
  }

  /**
   * 发送通知
   */
  private async sendNotifications(alert: Alert, channelIds: string[]): Promise<void> {
    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId)
      if (!channel || !channel.enabled) continue

      try {
        await this.sendNotification(channel, alert)
        alert.notification_sent = true
      } catch (error) {
        console.error(`Failed to send notification via ${channelId}:`, error)
      }
    }
  }

  /**
   * 发送单个通知
   */
  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'webhook':
        if (channel.config.console) {
          console.warn(`🚨 ALERT: ${alert.message}`)
        }
        break

      case 'slack':
        if (channel.config.webhook_url) {
          await this.sendSlackNotification(channel.config, alert)
        }
        break

      case 'email':
        // 邮件通知实现（需要SMTP配置）
        console.log(`Email notification would be sent: ${alert.message}`)
        break

      default:
        console.log(`Unsupported notification type: ${channel.type}`)
    }
  }

  /**
   * 发送Slack通知
   */
  private async sendSlackNotification(config: any, alert: Alert): Promise<void> {
    const payload = {
      channel: config.channel,
      username: config.username,
      icon_emoji: this.getSeverityEmoji(alert.severity),
      text: `🚨 *${alert.rule_name}*`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            {
              title: '指标',
              value: alert.metric_name,
              short: true
            },
            {
              title: '当前值',
              value: alert.current_value.toFixed(2),
              short: true
            },
            {
              title: '阈值',
              value: alert.threshold_value.toString(),
              short: true
            },
            {
              title: '严重程度',
              value: alert.severity.toUpperCase(),
              short: true
            }
          ],
          footer: 'Zinses-Rechner监控系统',
          ts: Math.floor(new Date(alert.triggered_at).getTime() / 1000)
        }
      ]
    }

    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`)
    }
  }

  /**
   * 发送解决通知
   */
  private async sendResolutionNotification(alert: Alert, channelIds: string[]): Promise<void> {
    const resolutionMessage = `✅ 告警已解决: ${alert.rule_name}`
    
    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId)
      if (!channel || !channel.enabled) continue

      if (channel.type === 'webhook' && channel.config.console) {
        console.info(resolutionMessage)
      }
    }
  }

  /**
   * 检查告警是否被抑制
   */
  private isAlertSuppressed(ruleId: string): boolean {
    const suppressUntil = this.suppressions.get(ruleId)
    return suppressUntil ? Date.now() < suppressUntil : false
  }

  /**
   * 抑制告警
   */
  suppressAlert(ruleId: string, durationMinutes: number): void {
    const suppressUntil = Date.now() + (durationMinutes * 60 * 1000)
    this.suppressions.set(ruleId, suppressUntil)
  }

  /**
   * 获取严重程度颜色
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger'
      case 'error': return 'warning'
      case 'warning': return 'warning'
      case 'info': return 'good'
      default: return 'warning'
    }
  }

  /**
   * 获取严重程度表情符号
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return ':fire:'
      case 'error': return ':exclamation:'
      case 'warning': return ':warning:'
      case 'info': return ':information_source:'
      default: return ':question:'
    }
  }

  /**
   * 保存告警到数据库
   */
  private async saveAlertToDatabase(alert: Alert): Promise<void> {
    if (!this.db) return

    try {
      const stmt = this.db.prepare(`
        INSERT INTO alert_history 
        (alert_name, alert_severity, metric_name, current_value, threshold_value, 
         alert_message, triggered_at, notification_sent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      await stmt.bind(
        alert.rule_name,
        alert.severity,
        alert.metric_name,
        alert.current_value,
        alert.threshold_value,
        alert.message,
        alert.triggered_at,
        alert.notification_sent
      ).run()

    } catch (error) {
      console.error('Failed to save alert to database:', error)
    }
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'active')
  }

  /**
   * 获取告警统计
   */
  getAlertStats(): {
    total_active: number
    by_severity: Record<string, number>
    by_metric: Record<string, number>
  } {
    const activeAlerts = this.getActiveAlerts()
    
    const bySeverity: Record<string, number> = {}
    const byMetric: Record<string, number> = {}

    activeAlerts.forEach(alert => {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1
      byMetric[alert.metric_name] = (byMetric[alert.metric_name] || 0) + 1
    })

    return {
      total_active: activeAlerts.length,
      by_severity: bySeverity,
      by_metric: byMetric
    }
  }
}
