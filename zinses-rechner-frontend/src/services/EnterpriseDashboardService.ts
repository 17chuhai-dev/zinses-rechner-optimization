/**
 * 企业级数据仪表盘服务
 * 整合所有分析系统，提供统一的数据聚合层和可视化仪表盘管理
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserAnalyticsService } from './UserAnalyticsService'
import { ContentPerformanceService } from './ContentPerformanceService'
import { ConversionFunnelService } from './ConversionFunnelService'
import { SocialMediaAnalyticsService } from './SocialMediaAnalyticsService'
import { RoleBasedAccessControlService } from './RoleBasedAccessControlService'
import { EnterpriseAccountService } from './EnterpriseAccountService'
import type { AggregatedStats, UserInsights } from './UserAnalyticsService'
import type { ContentPerformanceAnalysis } from './ContentPerformanceService'
import type { ConversionFunnel } from './ConversionFunnelService'
import type { SocialMediaAnalytics } from './SocialMediaAnalyticsService'

// 日期范围
export interface DateRange {
  start: Date
  end: Date
}

// 数据过滤器
export interface DataFilters {
  dateRange: DateRange
  accountId?: string
  teamId?: string
  userId?: string
  contentCategory?: string[]
  platform?: string[]
  deviceType?: string[]
  userSegment?: string[]
}

// 企业级仪表盘数据
export interface EnterpriseDashboardData {
  overview: DashboardOverview
  userAnalytics: UserAnalyticsSummary
  contentPerformance: ContentPerformanceSummary
  conversionMetrics: ConversionMetricsSummary
  socialMediaMetrics: SocialMediaMetricsSummary
  businessMetrics: BusinessMetricsSummary
  insights: DashboardInsight[]
  alerts: DashboardAlert[]
  lastUpdated: Date
}

// 仪表盘概览
export interface DashboardOverview {
  period: DateRange
  kpis: KPIMetric[]
  trends: TrendMetric[]
  comparisons: ComparisonMetric[]
}

export interface KPIMetric {
  id: string
  name: string
  value: number
  unit: string
  change: number // 变化百分比
  changeDirection: 'up' | 'down' | 'stable'
  target?: number
  status: 'good' | 'warning' | 'critical'
}

export interface TrendMetric {
  id: string
  name: string
  data: { date: Date; value: number }[]
  trend: 'increasing' | 'decreasing' | 'stable'
  forecast?: { date: Date; value: number }[]
}

export interface ComparisonMetric {
  id: string
  name: string
  current: number
  previous: number
  change: number
  changeType: 'absolute' | 'percentage'
}

// 用户分析摘要
export interface UserAnalyticsSummary {
  totalUsers: number
  activeUsers: number
  newUsers: number
  userGrowthRate: number
  averageSessionDuration: number
  bounceRate: number
  topUserSegments: UserSegment[]
  userJourney: UserJourneyStep[]
  retentionMetrics: RetentionMetric[]
}

export interface UserSegment {
  id: string
  name: string
  userCount: number
  percentage: number
  characteristics: string[]
  conversionRate: number
}

export interface UserJourneyStep {
  step: number
  name: string
  users: number
  dropOffRate: number
  averageTime: number
}

export interface RetentionMetric {
  period: string
  cohortSize: number
  retentionRate: number
  churnRate: number
}

// 内容表现摘要
export interface ContentPerformanceSummary {
  totalContent: number
  totalViews: number
  averageEngagement: number
  topPerformingContent: ContentSummary[]
  contentByCategory: CategorySummary[]
  contentTrends: ContentTrend[]
}

export interface ContentSummary {
  id: string
  title: string
  category: string
  views: number
  engagement: number
  conversionRate: number
  score: number
}

export interface CategorySummary {
  category: string
  contentCount: number
  totalViews: number
  averageEngagement: number
  trend: 'up' | 'down' | 'stable'
}

export interface ContentTrend {
  date: Date
  views: number
  engagement: number
  newContent: number
}

// 转化指标摘要
export interface ConversionMetricsSummary {
  overallConversionRate: number
  totalConversions: number
  conversionValue: number
  funnelStages: FunnelStageSummary[]
  topConversionPaths: ConversionPathSummary[]
  attributionAnalysis: AttributionSummary[]
}

export interface FunnelStageSummary {
  stage: string
  users: number
  conversionRate: number
  dropOffRate: number
}

export interface ConversionPathSummary {
  path: string
  users: number
  conversionRate: number
  averageDuration: number
}

export interface AttributionSummary {
  channel: string
  conversions: number
  value: number
  attribution: number
}

// 社交媒体指标摘要
export interface SocialMediaMetricsSummary {
  totalFollowers: number
  totalEngagement: number
  reachGrowth: number
  topPlatforms: PlatformSummary[]
  contentPerformance: SocialContentSummary[]
  audienceInsights: AudienceInsightSummary
}

export interface PlatformSummary {
  platform: string
  followers: number
  engagement: number
  reach: number
  growth: number
}

export interface SocialContentSummary {
  id: string
  title: string
  platform: string
  engagement: number
  reach: number
  clicks: number
}

export interface AudienceInsightSummary {
  demographics: Record<string, number>
  interests: string[]
  activeHours: number[]
  growthRate: number
}

// 业务指标摘要
export interface BusinessMetricsSummary {
  revenue: number
  revenueGrowth: number
  customerAcquisitionCost: number
  customerLifetimeValue: number
  monthlyRecurringRevenue: number
  churnRate: number
  netPromoterScore: number
}

// 仪表盘洞察
export interface DashboardInsight {
  id: string
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  dataSource: string[]
  actionable: boolean
  recommendations: string[]
  createdAt: Date
}

// 仪表盘警报
export interface DashboardAlert {
  id: string
  type: 'performance' | 'security' | 'business' | 'technical'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  metric: string
  threshold: number
  currentValue: number
  triggeredAt: Date
  acknowledged: boolean
  actions: string[]
}

// 仪表盘配置
export interface DashboardConfig {
  id: string
  name: string
  description?: string
  accountId: string
  createdBy: string
  
  // 布局配置
  layout: DashboardLayout
  
  // 组件配置
  widgets: DashboardWidget[]
  
  // 权限配置
  permissions: DashboardPermission[]
  
  // 刷新配置
  refreshInterval: number // 秒
  autoRefresh: boolean
  
  // 共享配置
  isShared: boolean
  sharedWith: string[] // 用户ID或团队ID
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  lastViewedAt?: Date
  viewCount: number
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom'
  columns: number
  rows: number
  gaps: { x: number; y: number }
  responsive: boolean
}

export interface DashboardWidget {
  id: string
  type: 'kpi' | 'chart' | 'table' | 'text' | 'image' | 'iframe'
  title: string
  position: { x: number; y: number; width: number; height: number }
  
  // 数据配置
  dataSource: string
  dataQuery: any
  filters: DataFilters
  
  // 显示配置
  visualization: VisualizationConfig
  
  // 交互配置
  interactions: InteractionConfig[]
  
  // 权限
  requiredPermissions: string[]
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap'
  colors: string[]
  showLegend: boolean
  showGrid: boolean
  showTooltip: boolean
  animations: boolean
  customOptions: Record<string, any>
}

export interface InteractionConfig {
  type: 'click' | 'hover' | 'drill-down' | 'filter'
  action: string
  target?: string
  parameters: Record<string, any>
}

export interface DashboardPermission {
  userId?: string
  teamId?: string
  roleId?: string
  permissions: ('view' | 'edit' | 'share' | 'delete')[]
}

/**
 * 企业级数据仪表盘服务
 */
export class EnterpriseDashboardService {
  private static instance: EnterpriseDashboardService
  private userAnalyticsService: UserAnalyticsService
  private contentPerformanceService: ContentPerformanceService
  private conversionFunnelService: ConversionFunnelService
  private socialMediaAnalyticsService: SocialMediaAnalyticsService
  private rbacService: RoleBasedAccessControlService
  private enterpriseAccountService: EnterpriseAccountService
  
  private dataCache: Map<string, { data: any; timestamp: Date; ttl: number }> = new Map()
  private isInitialized = false

  private constructor() {
    this.userAnalyticsService = UserAnalyticsService.getInstance()
    this.contentPerformanceService = ContentPerformanceService.getInstance()
    this.conversionFunnelService = ConversionFunnelService.getInstance()
    this.socialMediaAnalyticsService = SocialMediaAnalyticsService.getInstance()
    this.rbacService = RoleBasedAccessControlService.getInstance()
    this.enterpriseAccountService = EnterpriseAccountService.getInstance()
  }

  static getInstance(): EnterpriseDashboardService {
    if (!EnterpriseDashboardService.instance) {
      EnterpriseDashboardService.instance = new EnterpriseDashboardService()
    }
    return EnterpriseDashboardService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await Promise.all([
        this.userAnalyticsService.initialize(),
        this.contentPerformanceService.initialize(),
        this.conversionFunnelService.initialize(),
        this.socialMediaAnalyticsService.initialize(),
        this.rbacService.initialize(),
        this.enterpriseAccountService.initialize()
      ])
      
      this.startCacheCleanup()
      this.isInitialized = true
      console.log('✅ EnterpriseDashboardService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize EnterpriseDashboardService:', error)
      throw error
    }
  }

  /**
   * 获取企业级仪表盘数据
   */
  async getDashboardData(
    userId: string,
    accountId: string,
    filters: DataFilters
  ): Promise<EnterpriseDashboardData> {
    if (!this.isInitialized) await this.initialize()

    // 检查用户权限
    const hasPermission = await this.rbacService.checkPermission(
      userId,
      accountId,
      'analytics.view'
    )

    if (!hasPermission.granted) {
      throw new Error('Insufficient permissions to view dashboard data')
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey('dashboard', { userId, accountId, filters })
    
    // 检查缓存
    const cachedData = this.getCachedData(cacheKey)
    if (cachedData) {
      return cachedData
    }

    try {
      // 并行获取所有数据
      const [
        userAnalytics,
        contentPerformance,
        conversionMetrics,
        socialMediaMetrics,
        businessMetrics
      ] = await Promise.all([
        this.aggregateUserAnalytics(filters),
        this.aggregateContentPerformance(filters),
        this.aggregateConversionMetrics(filters),
        this.aggregateSocialMediaMetrics(filters),
        this.aggregateBusinessMetrics(filters)
      ])

      // 生成洞察和警报
      const insights = await this.generateDashboardInsights({
        userAnalytics,
        contentPerformance,
        conversionMetrics,
        socialMediaMetrics,
        businessMetrics
      })

      const alerts = await this.generateDashboardAlerts({
        userAnalytics,
        contentPerformance,
        conversionMetrics,
        socialMediaMetrics,
        businessMetrics
      })

      const dashboardData: EnterpriseDashboardData = {
        overview: this.generateDashboardOverview({
          userAnalytics,
          contentPerformance,
          conversionMetrics,
          socialMediaMetrics,
          businessMetrics
        }),
        userAnalytics,
        contentPerformance,
        conversionMetrics,
        socialMediaMetrics,
        businessMetrics,
        insights,
        alerts,
        lastUpdated: new Date()
      }

      // 缓存数据（5分钟TTL）
      this.setCachedData(cacheKey, dashboardData, 5 * 60 * 1000)

      return dashboardData
    } catch (error) {
      console.error('Failed to get dashboard data:', error)
      throw error
    }
  }

  /**
   * 创建仪表盘配置
   */
  async createDashboard(
    accountId: string,
    createdBy: string,
    config: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'accountId' | 'createdBy'>
  ): Promise<DashboardConfig> {
    if (!this.isInitialized) await this.initialize()

    const dashboard: DashboardConfig = {
      id: crypto.randomUUID(),
      accountId,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      ...config
    }

    await this.saveDashboardConfig(dashboard)

    console.log(`📊 Dashboard created: ${dashboard.name}`)
    return dashboard
  }

  /**
   * 获取用户可访问的仪表盘列表
   */
  async getUserDashboards(userId: string, accountId: string): Promise<DashboardConfig[]> {
    if (!this.isInitialized) await this.initialize()

    const allDashboards = await this.getAccountDashboards(accountId)
    const accessibleDashboards: DashboardConfig[] = []

    for (const dashboard of allDashboards) {
      const hasAccess = await this.checkDashboardAccess(userId, dashboard)
      if (hasAccess) {
        accessibleDashboards.push(dashboard)
      }
    }

    return accessibleDashboards.sort((a, b) => b.lastViewedAt?.getTime() || 0 - (a.lastViewedAt?.getTime() || 0))
  }

  // 私有方法
  private async aggregateUserAnalytics(filters: DataFilters): Promise<UserAnalyticsSummary> {
    const stats = await this.userAnalyticsService.getAggregatedStats(
      'month',
      filters.dateRange.start,
      filters.dateRange.end
    )

    return {
      totalUsers: stats.users.total,
      activeUsers: stats.users.active,
      newUsers: stats.users.new,
      userGrowthRate: 0.15, // 15% 增长
      averageSessionDuration: stats.usage.averageSessionDuration / 1000, // 转换为秒
      bounceRate: stats.usage.bounceRate,
      topUserSegments: [
        {
          id: 'high-value',
          name: '高价值用户',
          userCount: 50,
          percentage: 0.25,
          characteristics: ['长期使用', '高参与度', '多次转化'],
          conversionRate: 0.45
        }
      ],
      userJourney: [
        { step: 1, name: '首次访问', users: 1000, dropOffRate: 0.3, averageTime: 120 },
        { step: 2, name: '浏览内容', users: 700, dropOffRate: 0.4, averageTime: 300 },
        { step: 3, name: '使用计算器', users: 420, dropOffRate: 0.2, averageTime: 180 },
        { step: 4, name: '创建目标', users: 336, dropOffRate: 0.1, averageTime: 240 }
      ],
      retentionMetrics: [
        { period: '7天', cohortSize: 100, retentionRate: 0.65, churnRate: 0.35 },
        { period: '30天', cohortSize: 100, retentionRate: 0.45, churnRate: 0.55 }
      ]
    }
  }

  private async aggregateContentPerformance(filters: DataFilters): Promise<ContentPerformanceSummary> {
    const analysis = await this.contentPerformanceService.getContentPerformanceAnalysis(filters.dateRange)

    return {
      totalContent: analysis.overview.totalContent,
      totalViews: analysis.overview.totalViews,
      averageEngagement: analysis.overview.totalEngagement / analysis.overview.totalContent,
      topPerformingContent: analysis.topPerforming.slice(0, 5).map(content => ({
        id: content.contentId,
        title: content.title,
        category: content.category,
        views: content.pageViews,
        engagement: content.engagementRate,
        conversionRate: content.conversionRate,
        score: content.performanceScore
      })),
      contentByCategory: analysis.categoryAnalysis.map(cat => ({
        category: cat.category,
        contentCount: cat.contentCount,
        totalViews: cat.totalViews,
        averageEngagement: cat.averageEngagement,
        trend: cat.trends === 'improving' ? 'up' : cat.trends === 'declining' ? 'down' : 'stable'
      })),
      contentTrends: analysis.timeSeriesData.map(data => ({
        date: data.date,
        views: data.views,
        engagement: data.engagement,
        newContent: data.newContent
      }))
    }
  }

  private async aggregateConversionMetrics(filters: DataFilters): Promise<ConversionMetricsSummary> {
    const funnel = await this.conversionFunnelService.analyzeConversionFunnel(filters.dateRange)

    return {
      overallConversionRate: funnel.overallConversionRate,
      totalConversions: funnel.stages[funnel.stages.length - 1]?.users || 0,
      conversionValue: 50000, // 模拟转化价值
      funnelStages: funnel.stages.map(stage => ({
        stage: stage.name,
        users: stage.users,
        conversionRate: stage.conversionRate,
        dropOffRate: stage.dropOffRate
      })),
      topConversionPaths: [
        {
          path: '文章 → 计算器 → 目标创建',
          users: 150,
          conversionRate: 0.25,
          averageDuration: 1200
        }
      ],
      attributionAnalysis: [
        {
          channel: '有机搜索',
          conversions: 120,
          value: 24000,
          attribution: 0.4
        },
        {
          channel: '社交媒体',
          conversions: 80,
          value: 16000,
          attribution: 0.3
        }
      ]
    }
  }

  private async aggregateSocialMediaMetrics(filters: DataFilters): Promise<SocialMediaMetricsSummary> {
    const analytics = await this.socialMediaAnalyticsService.getComprehensiveAnalytics(filters.dateRange)

    return {
      totalFollowers: analytics.audienceInsights.totalAudience,
      totalEngagement: analytics.overview.totalEngagement,
      reachGrowth: analytics.audienceInsights.growth.growthRate,
      topPlatforms: analytics.platformAnalytics.map(platform => ({
        platform: platform.platform,
        followers: platform.followers,
        engagement: platform.engagement.total,
        reach: platform.reach,
        growth: platform.growth
      })),
      contentPerformance: analytics.contentPerformance.slice(0, 5).map(content => ({
        id: content.contentId,
        title: content.title,
        platform: content.platform,
        engagement: content.engagement.total,
        reach: content.reach,
        clicks: content.clicks
      })),
      audienceInsights: {
        demographics: analytics.audienceInsights.demographics.ageGroups,
        interests: analytics.audienceInsights.interests,
        activeHours: analytics.audienceInsights.behavior.activeHours,
        growthRate: analytics.audienceInsights.growth.growthRate
      }
    }
  }

  private async aggregateBusinessMetrics(filters: DataFilters): Promise<BusinessMetricsSummary> {
    // 模拟业务指标数据
    return {
      revenue: 125000,
      revenueGrowth: 0.18,
      customerAcquisitionCost: 45,
      customerLifetimeValue: 320,
      monthlyRecurringRevenue: 28000,
      churnRate: 0.05,
      netPromoterScore: 72
    }
  }

  private generateDashboardOverview(data: {
    userAnalytics: UserAnalyticsSummary
    contentPerformance: ContentPerformanceSummary
    conversionMetrics: ConversionMetricsSummary
    socialMediaMetrics: SocialMediaMetricsSummary
    businessMetrics: BusinessMetricsSummary
  }): DashboardOverview {
    return {
      period: { start: new Date(), end: new Date() },
      kpis: [
        {
          id: 'total-users',
          name: '总用户数',
          value: data.userAnalytics.totalUsers,
          unit: '人',
          change: data.userAnalytics.userGrowthRate,
          changeDirection: 'up',
          status: 'good'
        },
        {
          id: 'conversion-rate',
          name: '转化率',
          value: data.conversionMetrics.overallConversionRate * 100,
          unit: '%',
          change: 0.05,
          changeDirection: 'up',
          target: 10,
          status: 'good'
        },
        {
          id: 'revenue',
          name: '月收入',
          value: data.businessMetrics.monthlyRecurringRevenue,
          unit: '€',
          change: data.businessMetrics.revenueGrowth,
          changeDirection: 'up',
          status: 'good'
        }
      ],
      trends: [
        {
          id: 'user-growth',
          name: '用户增长趋势',
          data: this.generateTrendData(30, data.userAnalytics.totalUsers),
          trend: 'increasing'
        }
      ],
      comparisons: [
        {
          id: 'monthly-comparison',
          name: '月度对比',
          current: data.userAnalytics.activeUsers,
          previous: Math.floor(data.userAnalytics.activeUsers * 0.85),
          change: 0.15,
          changeType: 'percentage'
        }
      ]
    }
  }

  private async generateDashboardInsights(data: any): Promise<DashboardInsight[]> {
    return [
      {
        id: crypto.randomUUID(),
        type: 'opportunity',
        title: '移动端用户增长机会',
        description: '移动端用户转化率比桌面端低20%，优化移动端体验可提升整体转化',
        impact: 'high',
        confidence: 0.85,
        dataSource: ['user-analytics', 'conversion-metrics'],
        actionable: true,
        recommendations: [
          '优化移动端计算器界面',
          '简化移动端注册流程',
          '增加移动端专属功能'
        ],
        createdAt: new Date()
      }
    ]
  }

  private async generateDashboardAlerts(data: any): Promise<DashboardAlert[]> {
    return [
      {
        id: crypto.randomUUID(),
        type: 'performance',
        severity: 'warning',
        title: '页面加载时间异常',
        description: '平均页面加载时间超过3秒阈值',
        metric: 'page_load_time',
        threshold: 3000,
        currentValue: 3500,
        triggeredAt: new Date(),
        acknowledged: false,
        actions: [
          '检查服务器性能',
          '优化静态资源',
          '启用CDN加速'
        ]
      }
    ]
  }

  private generateTrendData(days: number, baseValue: number): { date: Date; value: number }[] {
    const data: { date: Date; value: number }[] = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const value = Math.floor(baseValue * (0.8 + Math.random() * 0.4))
      data.push({ date, value })
    }
    
    return data
  }

  private generateCacheKey(type: string, params: any): string {
    return `${type}_${JSON.stringify(params)}`
  }

  private getCachedData(key: string): any | null {
    const cached = this.dataCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp.getTime() > cached.ttl) {
      this.dataCache.delete(key)
      return null
    }
    
    return cached.data
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.dataCache.set(key, {
      data,
      timestamp: new Date(),
      ttl
    })
  }

  private async saveDashboardConfig(config: DashboardConfig): Promise<void> {
    try {
      const key = `dashboard_config_${config.id}`
      localStorage.setItem(key, JSON.stringify(config))
    } catch (error) {
      console.error('Failed to save dashboard config:', error)
      throw error
    }
  }

  private async getAccountDashboards(accountId: string): Promise<DashboardConfig[]> {
    const dashboards: DashboardConfig[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('dashboard_config_')) {
        try {
          const config = JSON.parse(localStorage.getItem(key) || '{}') as DashboardConfig
          if (config.accountId === accountId) {
            dashboards.push(config)
          }
        } catch (error) {
          continue
        }
      }
    }
    
    return dashboards
  }

  private async checkDashboardAccess(userId: string, dashboard: DashboardConfig): Promise<boolean> {
    // 创建者总是有访问权限
    if (dashboard.createdBy === userId) {
      return true
    }

    // 检查共享权限
    if (dashboard.isShared && dashboard.sharedWith.includes(userId)) {
      return true
    }

    // 检查基于角色的权限
    for (const permission of dashboard.permissions) {
      if (permission.userId === userId && permission.permissions.includes('view')) {
        return true
      }
    }

    return false
  }

  private startCacheCleanup(): void {
    // 每小时清理过期缓存
    setInterval(() => {
      const now = Date.now()
      for (const [key, cached] of this.dataCache) {
        if (now - cached.timestamp.getTime() > cached.ttl) {
          this.dataCache.delete(key)
        }
      }
    }, 60 * 60 * 1000) // 1小时
  }
}

// Export singleton instance
export const enterpriseDashboardService = EnterpriseDashboardService.getInstance()
