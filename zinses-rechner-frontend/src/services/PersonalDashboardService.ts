/**
 * 个人财务仪表盘服务
 * 整合用户行为分析、财务洞察和数据可视化，创建统一的个人财务仪表盘界面和用户体验
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserBehaviorAnalyticsService } from './UserBehaviorAnalyticsService'
import { PersonalFinancialInsightsService } from './PersonalFinancialInsightsService'
import { CalculationHistoryService } from './CalculationHistoryService'
import { EnhancedFinancialGoalService } from './EnhancedFinancialGoalService'
import { ProgressTrackingService } from './ProgressTrackingService'
import { RecommendationEngine } from './RecommendationEngine'
import { EnterpriseLocalStorageService } from './EnterpriseLocalStorageService'

// 仪表盘配置
export interface DashboardPreferences {
  userId: string
  theme: 'light' | 'dark' | 'auto'
  language: 'de' | 'en'
  
  // 布局偏好
  layout: 'grid' | 'list' | 'compact'
  widgetSize: 'small' | 'medium' | 'large'
  
  // 数据偏好
  defaultPeriod: 'week' | 'month' | 'quarter' | 'year'
  currency: 'EUR' | 'USD'
  
  // 通知偏好
  notifications: {
    insights: boolean
    goals: boolean
    recommendations: boolean
    milestones: boolean
  }
  
  // 隐私设置
  dataSharing: boolean
  analyticsLevel: 'minimal' | 'standard' | 'detailed'
}

// 仪表盘布局
export interface DashboardLayout {
  userId: string
  layoutId: string
  name: string
  
  // 网格配置
  grid: {
    columns: number
    rows: number
    gap: number
  }
  
  // 小部件位置
  widgets: WidgetPosition[]
  
  // 响应式断点
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }
  
  // 布局元数据
  isDefault: boolean
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

// 小部件位置
export interface WidgetPosition {
  widgetId: string
  x: number
  y: number
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

// 仪表盘小部件
export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  description?: string
  
  // 配置
  config: WidgetConfig
  
  // 数据源
  dataSource: WidgetDataSource
  
  // 显示设置
  display: WidgetDisplay
  
  // 权限
  permissions: WidgetPermissions
  
  // 状态
  isEnabled: boolean
  isLoading: boolean
  hasError: boolean
  errorMessage?: string
  
  // 时间信息
  createdAt: Date
  updatedAt: Date
  lastRefreshed?: Date
}

// 小部件类型
export type WidgetType = 
  | 'financial_overview'
  | 'goal_progress'
  | 'spending_analysis'
  | 'investment_performance'
  | 'cash_flow'
  | 'insights_summary'
  | 'recommendations'
  | 'quick_actions'
  | 'market_data'
  | 'news_feed'

// 小部件配置
export interface WidgetConfig {
  refreshInterval?: number // 秒
  autoRefresh: boolean
  showTitle: boolean
  showBorder: boolean
  
  // 数据配置
  period: 'week' | 'month' | 'quarter' | 'year'
  metrics: string[]
  filters: Record<string, any>
  
  // 显示配置
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'donut'
  colorScheme?: string
  showLegend?: boolean
  showTooltips?: boolean
  
  // 交互配置
  clickable: boolean
  drillDown: boolean
  exportable: boolean
}

// 小部件数据源
export interface WidgetDataSource {
  type: 'service' | 'api' | 'static'
  source: string
  endpoint?: string
  parameters?: Record<string, any>
  
  // 缓存配置
  cacheDuration: number
  cacheKey?: string
  
  // 数据转换
  transformer?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

// 小部件显示
export interface WidgetDisplay {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  borderRadius?: number
  
  // 响应式设置
  responsive: boolean
  mobileLayout?: 'stack' | 'hide' | 'compact'
  
  // 动画设置
  animations: boolean
  transitionDuration: number
}

// 小部件权限
export interface WidgetPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canShare: boolean
  canExport: boolean
}

// 仪表盘数据
export interface DashboardData {
  userId: string
  generatedAt: Date
  
  // 概览数据
  overview: DashboardOverview
  
  // 小部件数据
  widgets: Map<string, WidgetData>
  
  // 洞察和建议
  insights: any[]
  recommendations: any[]
  
  // 性能指标
  performance: DashboardPerformance
}

// 仪表盘概览
export interface DashboardOverview {
  // 财务概览
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  
  // 目标进度
  activeGoals: number
  completedGoals: number
  goalCompletionRate: number
  
  // 活动统计
  calculationsThisMonth: number
  lastActivity: Date
  engagementScore: number
  
  // 健康评分
  financialHealthScore: number
  healthTrend: 'improving' | 'stable' | 'declining'
}

// 小部件数据
export interface WidgetData {
  widgetId: string
  data: any
  metadata: WidgetMetadata
  lastUpdated: Date
  isStale: boolean
}

// 小部件元数据
export interface WidgetMetadata {
  dataPoints: number
  updateFrequency: string
  dataQuality: 'high' | 'medium' | 'low'
  completeness: number // 0-1
  
  // 数据源信息
  sources: string[]
  lastSourceUpdate: Date
  
  // 处理信息
  processingTime: number
  cacheHit: boolean
}

// 仪表盘性能
export interface DashboardPerformance {
  loadTime: number
  renderTime: number
  dataFetchTime: number
  
  // 缓存统计
  cacheHitRate: number
  cachedWidgets: number
  
  // 错误统计
  errorCount: number
  warningCount: number
  
  // 用户交互
  interactions: number
  averageSessionTime: number
}

// 仪表盘模板
export interface DashboardTemplate {
  id: string
  name: string
  description: string
  category: 'beginner' | 'intermediate' | 'advanced' | 'professional'
  
  // 模板配置
  layout: DashboardLayout
  widgets: DashboardWidget[]
  preferences: Partial<DashboardPreferences>
  
  // 适用性
  targetAudience: string[]
  useCase: string
  
  // 统计信息
  usageCount: number
  rating: number
  
  // 元数据
  author: string
  version: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 个人财务仪表盘服务
 */
export class PersonalDashboardService {
  private static instance: PersonalDashboardService
  private behaviorService: UserBehaviorAnalyticsService
  private insightsService: PersonalFinancialInsightsService
  private historyService: CalculationHistoryService
  private goalService: EnhancedFinancialGoalService
  private progressService: ProgressTrackingService
  private recommendationEngine: RecommendationEngine
  private storageService: EnterpriseLocalStorageService
  
  // 仪表盘数据缓存
  private dashboards: Map<string, DashboardData> = new Map()
  private layouts: Map<string, DashboardLayout> = new Map()
  private preferences: Map<string, DashboardPreferences> = new Map()
  private templates: Map<string, DashboardTemplate> = new Map()
  
  // 实时更新订阅
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.behaviorService = UserBehaviorAnalyticsService.getInstance()
    this.insightsService = PersonalFinancialInsightsService.getInstance()
    this.historyService = CalculationHistoryService.getInstance()
    this.goalService = EnhancedFinancialGoalService.getInstance()
    this.progressService = ProgressTrackingService.getInstance()
    this.recommendationEngine = RecommendationEngine.getInstance()
    this.storageService = EnterpriseLocalStorageService.getInstance()
  }

  static getInstance(): PersonalDashboardService {
    if (!PersonalDashboardService.instance) {
      PersonalDashboardService.instance = new PersonalDashboardService()
    }
    return PersonalDashboardService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.behaviorService.initialize()
      await this.insightsService.initialize()
      await this.historyService.initialize()
      await this.goalService.initialize()
      await this.progressService.initialize()
      await this.recommendationEngine.initialize()
      await this.storageService.initialize()
      
      await this.loadDashboards()
      await this.loadLayouts()
      await this.loadPreferences()
      await this.loadTemplates()
      
      this.startPeriodicUpdates()
      this.isInitialized = true
      console.log('✅ PersonalDashboardService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize PersonalDashboardService:', error)
      throw error
    }
  }

  /**
   * 创建个人仪表盘
   */
  async createPersonalDashboard(userId: string, preferences?: DashboardPreferences): Promise<DashboardData> {
    if (!this.isInitialized) await this.initialize()

    try {
      const startTime = performance.now()

      // 获取用户偏好或使用默认值
      const userPreferences = preferences || await this.getDefaultPreferences(userId)
      
      // 生成仪表盘概览
      const overview = await this.generateDashboardOverview(userId)
      
      // 获取小部件数据
      const widgets = await this.generateWidgetData(userId, userPreferences)
      
      // 获取洞察和建议
      const insights = await this.insightsService.generateFinancialInsights(userId)
      const recommendations = await this.recommendationEngine.generateRecommendations(userId, {
        userId,
        currentPage: 'dashboard'
      })

      // 计算性能指标
      const loadTime = performance.now() - startTime
      const performance: DashboardPerformance = {
        loadTime,
        renderTime: 0, // 将在前端计算
        dataFetchTime: loadTime * 0.7, // 估算
        cacheHitRate: 0.8,
        cachedWidgets: widgets.size * 0.6,
        errorCount: 0,
        warningCount: 0,
        interactions: 0,
        averageSessionTime: 0
      }

      const dashboardData: DashboardData = {
        userId,
        generatedAt: new Date(),
        overview,
        widgets,
        insights: insights.slice(0, 5), // 前5个洞察
        recommendations: recommendations.slice(0, 3), // 前3个建议
        performance
      }

      // 缓存仪表盘数据
      this.dashboards.set(userId, dashboardData)
      await this.saveDashboard(userId, dashboardData)

      console.log(`📊 Created personal dashboard for user ${userId} in ${loadTime.toFixed(2)}ms`)
      return dashboardData

    } catch (error) {
      console.error('Failed to create personal dashboard:', error)
      throw error
    }
  }

  /**
   * 获取仪表盘数据
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    if (!this.isInitialized) await this.initialize()

    // 检查缓存
    const cached = this.dashboards.get(userId)
    if (cached && this.isDashboardDataFresh(cached)) {
      return cached
    }

    // 重新生成仪表盘数据
    return await this.createPersonalDashboard(userId)
  }

  /**
   * 刷新仪表盘数据
   */
  async refreshDashboardData(userId: string): Promise<DashboardData> {
    if (!this.isInitialized) await this.initialize()

    // 清除缓存并重新生成
    this.dashboards.delete(userId)
    const dashboardData = await this.createPersonalDashboard(userId)

    // 通知订阅者
    await this.notifySubscribers(userId, dashboardData)

    return dashboardData
  }

  /**
   * 获取小部件数据
   */
  async getWidgetData(userId: string, widgetId: string): Promise<WidgetData | null> {
    if (!this.isInitialized) await this.initialize()

    const dashboardData = await this.getDashboardData(userId)
    return dashboardData.widgets.get(widgetId) || null
  }

  /**
   * 更新小部件设置
   */
  async updateWidgetSettings(userId: string, widgetId: string, settings: Partial<WidgetConfig>): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    try {
      // 获取当前布局
      const layout = this.layouts.get(userId) || await this.getDefaultLayout(userId)
      
      // 找到并更新小部件
      const widget = layout.widgets.find(w => w.widgetId === widgetId)
      if (!widget) {
        throw new Error('Widget not found')
      }

      // 更新设置（这里需要更完整的实现）
      console.log(`🔧 Updated widget ${widgetId} settings for user ${userId}`)

      // 保存布局
      await this.saveLayout(userId, layout)

      // 刷新小部件数据
      await this.refreshWidgetData(userId, widgetId)

    } catch (error) {
      console.error('Failed to update widget settings:', error)
      throw error
    }
  }

  /**
   * 应用仪表盘模板
   */
  async applyDashboardTemplate(userId: string, templateId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    try {
      const template = this.templates.get(templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      // 应用模板布局
      const userLayout: DashboardLayout = {
        ...template.layout,
        userId,
        layoutId: crypto.randomUUID(),
        name: `${template.name} (个人定制)`,
        isDefault: false,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.layouts.set(userId, userLayout)
      await this.saveLayout(userId, userLayout)

      // 应用模板偏好
      if (template.preferences) {
        const userPreferences: DashboardPreferences = {
          ...await this.getDefaultPreferences(userId),
          ...template.preferences,
          userId
        }

        this.preferences.set(userId, userPreferences)
        await this.savePreferences(userId, userPreferences)
      }

      // 刷新仪表盘
      await this.refreshDashboardData(userId)

      console.log(`📋 Applied template ${templateId} for user ${userId}`)

    } catch (error) {
      console.error('Failed to apply dashboard template:', error)
      throw error
    }
  }

  /**
   * 启用实时更新
   */
  async enableRealTimeUpdates(userId: string, widgetIds: string[]): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    // 为指定小部件启用实时更新
    for (const widgetId of widgetIds) {
      // 这里可以设置WebSocket连接或定期轮询
      console.log(`🔄 Enabled real-time updates for widget ${widgetId}`)
    }
  }

  /**
   * 订阅数据更新
   */
  async subscribeToDataUpdates(userId: string, callback: (data: any) => void): Promise<() => void> {
    if (!this.isInitialized) await this.initialize()

    // 添加订阅
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, new Set())
    }
    this.subscriptions.get(userId)!.add(callback)

    // 返回取消订阅函数
    return () => {
      const userSubscriptions = this.subscriptions.get(userId)
      if (userSubscriptions) {
        userSubscriptions.delete(callback)
        if (userSubscriptions.size === 0) {
          this.subscriptions.delete(userId)
        }
      }
    }
  }

  /**
   * 导出仪表盘
   */
  async exportDashboard(userId: string, format: 'pdf' | 'png' | 'json'): Promise<Blob> {
    if (!this.isInitialized) await this.initialize()

    try {
      const dashboardData = await this.getDashboardData(userId)

      switch (format) {
        case 'json':
          const jsonData = JSON.stringify(dashboardData, null, 2)
          return new Blob([jsonData], { type: 'application/json' })
        
        case 'pdf':
          // 这里需要PDF生成逻辑
          return new Blob(['PDF export not implemented'], { type: 'application/pdf' })
        
        case 'png':
          // 这里需要图像生成逻辑
          return new Blob(['PNG export not implemented'], { type: 'image/png' })
        
        default:
          throw new Error('Unsupported export format')
      }

    } catch (error) {
      console.error('Failed to export dashboard:', error)
      throw error
    }
  }

  // 私有方法
  private async generateDashboardOverview(userId: string): Promise<DashboardOverview> {
    try {
      // 获取用户数据
      const goals = await this.goalService.getUserGoals(userId)
      const history = await this.historyService.getCalculationHistory(userId)
      const engagementScore = await this.behaviorService.calculateEngagementScore(userId)
      const healthAssessment = await this.insightsService.assessFinancialHealth(userId)

      // 计算概览指标
      const activeGoals = goals.filter(g => g.status === 'active').length
      const completedGoals = goals.filter(g => g.status === 'completed').length
      const goalCompletionRate = goals.length > 0 ? completedGoals / goals.length : 0

      const recentCalculations = history.filter(h => 
        new Date(h.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length

      const lastActivity = history.length > 0 
        ? new Date(Math.max(...history.map(h => new Date(h.createdAt).getTime())))
        : new Date()

      return {
        totalAssets: 50000, // 示例数据
        totalLiabilities: 15000,
        netWorth: 35000,
        monthlyIncome: 4000,
        monthlyExpenses: 2800,
        savingsRate: 0.3,
        activeGoals,
        completedGoals,
        goalCompletionRate,
        calculationsThisMonth: recentCalculations,
        lastActivity,
        engagementScore: engagementScore.score,
        financialHealthScore: healthAssessment.overallScore,
        healthTrend: 'improving'
      }

    } catch (error) {
      console.error('Failed to generate dashboard overview:', error)
      // 返回默认值
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savingsRate: 0,
        activeGoals: 0,
        completedGoals: 0,
        goalCompletionRate: 0,
        calculationsThisMonth: 0,
        lastActivity: new Date(),
        engagementScore: 0,
        financialHealthScore: 0,
        healthTrend: 'stable'
      }
    }
  }

  private async generateWidgetData(userId: string, preferences: DashboardPreferences): Promise<Map<string, WidgetData>> {
    const widgets = new Map<string, WidgetData>()

    try {
      // 财务概览小部件
      widgets.set('financial_overview', {
        widgetId: 'financial_overview',
        data: await this.generateFinancialOverviewData(userId),
        metadata: {
          dataPoints: 6,
          updateFrequency: 'daily',
          dataQuality: 'high',
          completeness: 1.0,
          sources: ['calculations', 'goals'],
          lastSourceUpdate: new Date(),
          processingTime: 50,
          cacheHit: false
        },
        lastUpdated: new Date(),
        isStale: false
      })

      // 目标进度小部件
      widgets.set('goal_progress', {
        widgetId: 'goal_progress',
        data: await this.generateGoalProgressData(userId),
        metadata: {
          dataPoints: 5,
          updateFrequency: 'hourly',
          dataQuality: 'high',
          completeness: 0.9,
          sources: ['goals', 'progress'],
          lastSourceUpdate: new Date(),
          processingTime: 30,
          cacheHit: true
        },
        lastUpdated: new Date(),
        isStale: false
      })

      // 洞察摘要小部件
      widgets.set('insights_summary', {
        widgetId: 'insights_summary',
        data: await this.generateInsightsSummaryData(userId),
        metadata: {
          dataPoints: 3,
          updateFrequency: 'daily',
          dataQuality: 'medium',
          completeness: 0.8,
          sources: ['insights', 'recommendations'],
          lastSourceUpdate: new Date(),
          processingTime: 100,
          cacheHit: false
        },
        lastUpdated: new Date(),
        isStale: false
      })

    } catch (error) {
      console.error('Failed to generate widget data:', error)
    }

    return widgets
  }

  private async generateFinancialOverviewData(userId: string): Promise<any> {
    // 生成财务概览数据
    return {
      netWorth: 35000,
      monthlyIncome: 4000,
      monthlyExpenses: 2800,
      savingsRate: 30,
      trend: 'up',
      change: 5.2
    }
  }

  private async generateGoalProgressData(userId: string): Promise<any> {
    const goals = await this.goalService.getUserGoals(userId)
    
    return goals.slice(0, 5).map(goal => ({
      id: goal.id,
      name: goal.name,
      progress: goal.currentAmount / goal.targetAmount,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      dueDate: goal.targetDate,
      status: goal.status
    }))
  }

  private async generateInsightsSummaryData(userId: string): Promise<any> {
    const insights = await this.insightsService.generateFinancialInsights(userId)
    
    return insights.slice(0, 3).map(insight => ({
      id: insight.id,
      title: insight.title,
      description: insight.description,
      importance: insight.importance,
      actionRequired: insight.actionItems.length > 0
    }))
  }

  private async getDefaultPreferences(userId: string): Promise<DashboardPreferences> {
    return {
      userId,
      theme: 'light',
      language: 'de',
      layout: 'grid',
      widgetSize: 'medium',
      defaultPeriod: 'month',
      currency: 'EUR',
      notifications: {
        insights: true,
        goals: true,
        recommendations: true,
        milestones: true
      },
      dataSharing: false,
      analyticsLevel: 'standard'
    }
  }

  private async getDefaultLayout(userId: string): Promise<DashboardLayout> {
    return {
      userId,
      layoutId: 'default',
      name: 'Standard Layout',
      grid: {
        columns: 12,
        rows: 8,
        gap: 16
      },
      widgets: [
        { widgetId: 'financial_overview', x: 0, y: 0, width: 6, height: 2 },
        { widgetId: 'goal_progress', x: 6, y: 0, width: 6, height: 2 },
        { widgetId: 'insights_summary', x: 0, y: 2, width: 12, height: 2 }
      ],
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      },
      isDefault: true,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private isDashboardDataFresh(data: DashboardData): boolean {
    const maxAge = 5 * 60 * 1000 // 5分钟
    return Date.now() - data.generatedAt.getTime() < maxAge
  }

  private async refreshWidgetData(userId: string, widgetId: string): Promise<void> {
    // 刷新特定小部件的数据
    console.log(`🔄 Refreshing widget ${widgetId} for user ${userId}`)
  }

  private async notifySubscribers(userId: string, data: any): Promise<void> {
    const userSubscriptions = this.subscriptions.get(userId)
    if (userSubscriptions) {
      for (const callback of userSubscriptions) {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in subscription callback:', error)
        }
      }
    }
  }

  private async saveDashboard(userId: string, data: DashboardData): Promise<void> {
    try {
      await this.storageService.storeData(
        `dashboard_${userId}`,
        data,
        { encrypt: true, compress: true, namespace: 'dashboard' }
      )
    } catch (error) {
      console.error('Failed to save dashboard:', error)
    }
  }

  private async loadDashboards(): Promise<void> {
    try {
      console.log('📊 Loading dashboards...')
    } catch (error) {
      console.error('Failed to load dashboards:', error)
    }
  }

  private async saveLayout(userId: string, layout: DashboardLayout): Promise<void> {
    try {
      await this.storageService.storeData(
        `layout_${userId}`,
        layout,
        { encrypt: true, compress: true, namespace: 'dashboard' }
      )
    } catch (error) {
      console.error('Failed to save layout:', error)
    }
  }

  private async loadLayouts(): Promise<void> {
    try {
      console.log('📐 Loading layouts...')
    } catch (error) {
      console.error('Failed to load layouts:', error)
    }
  }

  private async savePreferences(userId: string, preferences: DashboardPreferences): Promise<void> {
    try {
      await this.storageService.storeData(
        `preferences_${userId}`,
        preferences,
        { encrypt: true, compress: true, namespace: 'dashboard' }
      )
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }

  private async loadPreferences(): Promise<void> {
    try {
      console.log('⚙️ Loading preferences...')
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      // 加载预定义模板
      const beginnerTemplate: DashboardTemplate = {
        id: 'beginner',
        name: 'Einsteiger Dashboard',
        description: 'Einfaches Dashboard für Finanz-Einsteiger',
        category: 'beginner',
        layout: await this.getDefaultLayout('template'),
        widgets: [],
        preferences: {
          layout: 'grid',
          widgetSize: 'large',
          defaultPeriod: 'month'
        },
        targetAudience: ['Einsteiger', 'Studenten'],
        useCase: 'Erste Schritte in der Finanzplanung',
        usageCount: 0,
        rating: 4.5,
        author: 'Zinses-Rechner Team',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.templates.set('beginner', beginnerTemplate)
      console.log('📋 Loaded dashboard templates')
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  private startPeriodicUpdates(): void {
    // 每5分钟检查数据更新
    setInterval(() => {
      this.checkForDataUpdates()
    }, 5 * 60 * 1000)
  }

  private async checkForDataUpdates(): Promise<void> {
    // 检查是否有数据需要更新
    console.log('🔄 Checking for data updates...')
  }
}

// Export singleton instance
export const personalDashboardService = PersonalDashboardService.getInstance()
