/**
 * 风险管理服务
 * 提供实时风险监控、风险度量、风险控制等功能
 */

import { auditLogService } from './AuditLogService'

// 风险管理相关类型定义
export interface RiskProfile {
  id: string
  name: string
  description: string
  riskLimits: RiskLimit[]
  alertThresholds: AlertThreshold[]
  riskMetrics: RiskMetric[]
  stressScenarios: StressScenario[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RiskLimit {
  id: string
  name: string
  type: RiskLimitType
  metric: string
  threshold: number
  action: RiskAction
  severity: RiskSeverity
  isActive: boolean
  breachCount: number
  lastBreach?: Date
}

export type RiskLimitType = 
  | 'position_limit'      // 持仓限制
  | 'concentration_limit' // 集中度限制
  | 'var_limit'          // VaR限制
  | 'drawdown_limit'     // 回撤限制
  | 'leverage_limit'     // 杠杆限制
  | 'sector_limit'       // 行业限制
  | 'country_limit'      // 国家限制
  | 'currency_limit'     // 货币限制

export type RiskAction = 
  | 'alert'              // 仅告警
  | 'reduce_position'    // 减仓
  | 'close_position'     // 平仓
  | 'stop_trading'       // 停止交易
  | 'hedge'              // 对冲
  | 'rebalance'          // 再平衡

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AlertThreshold {
  id: string
  metric: string
  warningLevel: number
  criticalLevel: number
  notificationChannels: NotificationChannel[]
  isActive: boolean
}

export type NotificationChannel = 'email' | 'sms' | 'slack' | 'webhook' | 'dashboard'

export interface RiskMetric {
  name: string
  category: RiskCategory
  calculation: MetricCalculation
  frequency: CalculationFrequency
  historicalPeriod: number // days
  isActive: boolean
}

export type RiskCategory = 
  | 'market_risk'        // 市场风险
  | 'credit_risk'        // 信用风险
  | 'liquidity_risk'     // 流动性风险
  | 'operational_risk'   // 操作风险
  | 'concentration_risk' // 集中度风险
  | 'model_risk'         // 模型风险

export type CalculationFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly'

export interface MetricCalculation {
  formula: string
  inputs: string[]
  parameters: Record<string, number>
  confidence: number // for VaR calculations
  timeHorizon: number // days
}

export interface StressScenario {
  id: string
  name: string
  description: string
  type: ScenarioType
  shocks: MarketShock[]
  expectedImpact: number
  probability: number
  isActive: boolean
}

export type ScenarioType = 'historical' | 'hypothetical' | 'monte_carlo' | 'regulatory'

export interface MarketShock {
  asset: string
  shockType: 'absolute' | 'relative'
  magnitude: number
  correlation?: number
}

export interface RiskReport {
  id: string
  portfolioId: string
  timestamp: Date
  riskMetrics: CalculatedRiskMetric[]
  limitBreaches: LimitBreach[]
  stressTestResults: StressTestResult[]
  recommendations: RiskRecommendation[]
  summary: RiskSummary
}

export interface CalculatedRiskMetric {
  name: string
  value: number
  unit: string
  confidence?: number
  timeHorizon?: number
  benchmark?: number
  percentile?: number
  trend: 'increasing' | 'decreasing' | 'stable'
  lastCalculated: Date
}

export interface LimitBreach {
  limitId: string
  limitName: string
  currentValue: number
  threshold: number
  severity: RiskSeverity
  breachTime: Date
  duration: number // minutes
  actionTaken: RiskAction
  status: 'active' | 'resolved' | 'acknowledged'
}

export interface StressTestResult {
  scenarioId: string
  scenarioName: string
  portfolioImpact: number
  worstCaseDrawdown: number
  recoveryTime: number // days
  survivability: number // 0-100%
  keyRisks: string[]
}

export interface RiskRecommendation {
  id: string
  type: RecommendationType
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  action: string
  expectedBenefit: number
  implementationCost: number
  timeframe: string
  confidence: number
}

export type RecommendationType = 
  | 'position_adjustment'
  | 'hedging'
  | 'diversification'
  | 'limit_adjustment'
  | 'strategy_modification'
  | 'risk_monitoring'

export interface RiskSummary {
  overallRiskScore: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  keyRisks: string[]
  riskTrend: 'improving' | 'stable' | 'deteriorating'
  complianceStatus: 'compliant' | 'warning' | 'breach'
  lastUpdated: Date
}

export interface RiskAlert {
  id: string
  type: AlertType
  severity: RiskSeverity
  title: string
  message: string
  portfolioId: string
  metricName: string
  currentValue: number
  threshold: number
  timestamp: Date
  status: AlertStatus
  acknowledgedBy?: string
  acknowledgedAt?: Date
  resolvedAt?: Date
}

export type AlertType = 'limit_breach' | 'threshold_warning' | 'stress_test_failure' | 'model_deviation' | 'data_quality'

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'false_positive'

export interface RiskDashboard {
  portfolioId: string
  timestamp: Date
  riskMetrics: DashboardMetric[]
  alerts: RiskAlert[]
  charts: RiskChart[]
  heatmaps: RiskHeatmap[]
  trends: RiskTrend[]
}

export interface DashboardMetric {
  name: string
  value: number
  unit: string
  change: number
  changePercent: number
  status: 'normal' | 'warning' | 'critical'
  sparkline: number[]
}

export interface RiskChart {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap'
  title: string
  data: ChartDataPoint[]
  config: ChartConfig
}

export interface ChartDataPoint {
  x: number | string | Date
  y: number
  label?: string
  color?: string
}

export interface ChartConfig {
  xAxis: AxisConfig
  yAxis: AxisConfig
  colors: string[]
  annotations?: Annotation[]
}

export interface AxisConfig {
  label: string
  type: 'linear' | 'log' | 'time' | 'category'
  min?: number
  max?: number
  format?: string
}

export interface Annotation {
  type: 'line' | 'band' | 'point'
  value: number | Date
  label: string
  color: string
}

export interface RiskHeatmap {
  title: string
  data: HeatmapCell[]
  config: HeatmapConfig
}

export interface HeatmapCell {
  row: string
  column: string
  value: number
  color: string
  tooltip: string
}

export interface HeatmapConfig {
  colorScale: ColorScale
  cellSize: number
  showValues: boolean
}

export interface ColorScale {
  min: string
  max: string
  steps: number
}

export interface RiskTrend {
  metric: string
  period: string
  trend: 'up' | 'down' | 'stable'
  magnitude: number
  significance: number
  forecast: TrendForecast[]
}

export interface TrendForecast {
  date: Date
  value: number
  confidence: number
}

export class RiskManagementService {
  private static instance: RiskManagementService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private riskProfiles: Map<string, RiskProfile> = new Map()
  private activeAlerts: Map<string, RiskAlert> = new Map()
  private alertListeners: Set<(alert: RiskAlert) => void> = new Set()
  private monitoringInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startRiskMonitoring()
  }

  public static getInstance(): RiskManagementService {
    if (!RiskManagementService.instance) {
      RiskManagementService.instance = new RiskManagementService()
    }
    return RiskManagementService.instance
  }

  /**
   * 创建风险配置文件
   */
  public async createRiskProfile(
    profile: Omit<RiskProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RiskProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/risk/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        const data = await response.json()
        const createdProfile = data.profile
        
        // 更新缓存
        this.riskProfiles.set(createdProfile.id, createdProfile)
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'security',
          'risk_profile_created',
          'risk_profile',
          {
            description: `Risk profile created: ${profile.name}`,
            newValue: { name: profile.name, limitsCount: profile.riskLimits.length }
          },
          { resourceId: createdProfile.id, severity: 'medium', immediate: true }
        )

        return createdProfile
      }

      return null
    } catch (error) {
      console.error('创建风险配置文件失败:', error)
      return null
    }
  }

  /**
   * 计算投资组合风险指标
   */
  public async calculateRiskMetrics(
    portfolioId: string,
    metrics: string[] = ['var', 'cvar', 'max_drawdown', 'beta', 'correlation']
  ): Promise<CalculatedRiskMetric[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/risk/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          portfolioId,
          metrics
        })
      })

      if (response.ok) {
        const data = await response.json()
        const calculatedMetrics = data.metrics || []
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'risk_metrics_calculated',
          'risk_metrics',
          {
            description: `Risk metrics calculated for portfolio ${portfolioId}`,
            customFields: { 
              portfolioId, 
              metricsCount: calculatedMetrics.length,
              metrics: metrics.join(',')
            }
          },
          { resourceId: portfolioId, severity: 'low' }
        )

        return calculatedMetrics
      }

      return []
    } catch (error) {
      console.error('计算风险指标失败:', error)
      return []
    }
  }

  /**
   * 运行压力测试
   */
  public async runStressTest(
    portfolioId: string,
    scenarios: string[]
  ): Promise<StressTestResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/risk/stress-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          portfolioId,
          scenarios
        })
      })

      if (response.ok) {
        const data = await response.json()
        const results = data.results || []
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'stress_test_completed',
          'stress_test',
          {
            description: `Stress test completed for portfolio ${portfolioId}`,
            customFields: { 
              portfolioId, 
              scenarioCount: scenarios.length,
              worstCaseImpact: Math.min(...results.map((r: StressTestResult) => r.portfolioImpact))
            }
          },
          { resourceId: portfolioId, severity: 'medium' }
        )

        return results
      }

      return []
    } catch (error) {
      console.error('压力测试失败:', error)
      return []
    }
  }

  /**
   * 检查风险限制
   */
  public async checkRiskLimits(portfolioId: string): Promise<LimitBreach[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/risk/check-limits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ portfolioId })
      })

      if (response.ok) {
        const data = await response.json()
        const breaches = data.breaches || []
        
        // 处理新的违规
        breaches.forEach((breach: LimitBreach) => {
          if (breach.status === 'active') {
            this.handleLimitBreach(breach)
          }
        })
        
        return breaches
      }

      return []
    } catch (error) {
      console.error('检查风险限制失败:', error)
      return []
    }
  }

  /**
   * 生成风险报告
   */
  public async generateRiskReport(portfolioId: string): Promise<RiskReport | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/risk/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ portfolioId })
      })

      if (response.ok) {
        const data = await response.json()
        const report = data.report
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'risk_report_generated',
          'risk_report',
          {
            description: `Risk report generated for portfolio ${portfolioId}`,
            customFields: { 
              portfolioId,
              overallRiskScore: report.summary.overallRiskScore,
              breachCount: report.limitBreaches.length
            }
          },
          { resourceId: report.id, severity: 'low' }
        )

        return report
      }

      return null
    } catch (error) {
      console.error('生成风险报告失败:', error)
      return null
    }
  }

  /**
   * 获取风险仪表板数据
   */
  public async getRiskDashboard(portfolioId: string): Promise<RiskDashboard | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/risk/dashboard/${portfolioId}`)

      if (response.ok) {
        const data = await response.json()
        return data.dashboard
      }

      return null
    } catch (error) {
      console.error('获取风险仪表板失败:', error)
      return null
    }
  }

  /**
   * 处理风险限制违规
   */
  private async handleLimitBreach(breach: LimitBreach): Promise<void> {
    // 创建告警
    const alert: RiskAlert = {
      id: this.generateAlertId(),
      type: 'limit_breach',
      severity: breach.severity,
      title: `Risk Limit Breach: ${breach.limitName}`,
      message: `Current value ${breach.currentValue} exceeds threshold ${breach.threshold}`,
      portfolioId: '', // 需要从breach中获取
      metricName: breach.limitName,
      currentValue: breach.currentValue,
      threshold: breach.threshold,
      timestamp: breach.breachTime,
      status: 'active'
    }

    this.activeAlerts.set(alert.id, alert)
    this.notifyAlertListeners(alert)

    // 记录审计日志
    await auditLogService.logSecurityEvent(
      'risk_limit_breach',
      {
        description: `Risk limit breach detected: ${breach.limitName}`,
        customFields: { 
          limitName: breach.limitName,
          currentValue: breach.currentValue,
          threshold: breach.threshold,
          severity: breach.severity
        }
      },
      breach.severity === 'critical' ? 'critical' : 'high'
    )
  }

  /**
   * 启动风险监控
   */
  private startRiskMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        // 这里可以添加实时风险监控逻辑
        // 例如检查所有活跃投资组合的风险限制
      } catch (error) {
        console.error('风险监控失败:', error)
      }
    }, 60000) // 每分钟检查一次
  }

  /**
   * 添加告警监听器
   */
  public addAlertListener(listener: (alert: RiskAlert) => void): void {
    this.alertListeners.add(listener)
  }

  /**
   * 移除告警监听器
   */
  public removeAlertListener(listener: (alert: RiskAlert) => void): void {
    this.alertListeners.delete(listener)
  }

  /**
   * 通知告警监听器
   */
  private notifyAlertListeners(alert: RiskAlert): void {
    this.alertListeners.forEach(listener => {
      try {
        listener(alert)
      } catch (error) {
        console.error('告警监听器执行失败:', error)
      }
    })
  }

  /**
   * 生成告警ID
   */
  private generateAlertId(): string {
    return 'alert_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
  }

  /**
   * 获取活跃告警
   */
  public getActiveAlerts(): RiskAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'active')
  }

  /**
   * 确认告警
   */
  public async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) return false

    alert.status = 'acknowledged'
    alert.acknowledgedBy = userId
    alert.acknowledgedAt = new Date()

    return true
  }

  /**
   * 解决告警
   */
  public async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) return false

    alert.status = 'resolved'
    alert.resolvedAt = new Date()

    return true
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.riskProfiles.clear()
    this.activeAlerts.clear()
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.clearCache()
    this.alertListeners.clear()
  }
}

// 导出单例实例
export const riskManagementService = RiskManagementService.getInstance()
