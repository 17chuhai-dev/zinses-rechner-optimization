/**
 * 用户行为数据收集和分析引擎
 * 实现DSGVO合规的用户行为数据收集、处理和分析，支持实时和批量分析，集成现有用户身份和数据管理系统
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { AnonymousUserService } from './AnonymousUserService'
import { OptionalRegistrationService } from './OptionalRegistrationService'
import { EnterpriseLocalStorageService } from './EnterpriseLocalStorageService'
import { CalculationHistoryService } from './CalculationHistoryService'
import { FavoritesService } from './FavoritesService'
import { EnhancedFinancialGoalService } from './EnhancedFinancialGoalService'

// 用户行为事件类型
export type UserActionType = 
  | 'page_view' 
  | 'calculation' 
  | 'goal_interaction' 
  | 'favorite_action' 
  | 'search' 
  | 'recommendation_interaction'
  | 'export'
  | 'share'

// 用户行为事件
export interface UserAction {
  id: string
  userId: string
  type: UserActionType
  timestamp: Date
  
  // 事件数据
  data: ActionData
  
  // 上下文信息
  context: ActionContext
  
  // 会话信息
  sessionId: string
  
  // 设备信息
  deviceInfo: DeviceInfo
  
  // 隐私设置
  privacyLevel: 'minimal' | 'standard' | 'detailed'
}

// 行为数据
export interface ActionData {
  element?: string
  value?: any
  duration?: number
  result?: any
  metadata?: Record<string, any>
}

// 行为上下文
export interface ActionContext {
  page: string
  referrer?: string
  userAgent: string
  screenResolution: string
  language: string
  timezone: string
}

// 设备信息
export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile'
  os: string
  browser: string
  version: string
}

// 页面访问事件
export interface PageViewEvent {
  page: string
  title: string
  url: string
  referrer?: string
  timestamp: Date
  duration?: number
  scrollDepth?: number
  exitPage?: boolean
}

// 计算事件
export interface CalculationEvent {
  calculatorType: string
  inputData: any
  outputData: any
  calculationTime: number
  complexity: 'simple' | 'moderate' | 'complex'
  success: boolean
  errors?: string[]
}

// 目标交互事件
export interface GoalInteractionEvent {
  goalId: string
  interactionType: 'create' | 'update' | 'delete' | 'view' | 'progress_update'
  goalType: string
  changes?: any
  result?: any
}

// 用户行为模式
export interface BehaviorPatterns {
  userId: string
  analysisDate: Date
  
  // 使用模式
  usagePatterns: UsagePattern[]
  
  // 偏好分析
  preferences: UserPreferences
  
  // 行为趋势
  trends: BehaviorTrend[]
  
  // 异常检测
  anomalies: BehaviorAnomaly[]
}

// 使用模式
export interface UsagePattern {
  pattern: string
  frequency: number
  confidence: number
  description: string
  examples: string[]
}

// 用户偏好
export interface UserPreferences {
  preferredCalculators: string[]
  preferredTimeOfDay: number[]
  preferredDayOfWeek: number[]
  sessionDuration: number
  interactionStyle: 'explorer' | 'focused' | 'casual'
}

// 行为趋势
export interface BehaviorTrend {
  metric: string
  direction: 'increasing' | 'decreasing' | 'stable'
  magnitude: number
  confidence: number
  timeframe: string
}

// 行为异常
export interface BehaviorAnomaly {
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  timestamp: Date
  context: any
}

// 用户细分
export interface UserSegment {
  segmentId: string
  segmentName: string
  description: string
  characteristics: string[]
  size: number
  confidence: number
}

// 参与度评分
export interface EngagementScore {
  userId: string
  score: number // 0-100
  level: 'low' | 'medium' | 'high'
  factors: EngagementFactor[]
  trend: 'improving' | 'declining' | 'stable'
  lastCalculated: Date
}

// 参与度因素
export interface EngagementFactor {
  factor: string
  weight: number
  contribution: number
  description: string
}

// 流失预测
export interface ChurnPrediction {
  userId: string
  churnProbability: number // 0-1
  riskLevel: 'low' | 'medium' | 'high'
  predictedChurnDate?: Date
  riskFactors: ChurnRiskFactor[]
  preventionSuggestions: string[]
}

// 流失风险因素
export interface ChurnRiskFactor {
  factor: string
  impact: number
  description: string
  mitigation: string
}

// 财务行为分析
export interface FinancialBehaviorAnalysis {
  userId: string
  analysisDate: Date
  
  // 计算行为
  calculationBehavior: CalculationBehaviorAnalysis
  
  // 目标行为
  goalBehavior: GoalBehaviorAnalysis
  
  // 学习行为
  learningBehavior: LearningBehaviorAnalysis
  
  // 风险行为
  riskBehavior: RiskBehaviorAnalysis
}

// 计算行为分析
export interface CalculationBehaviorAnalysis {
  totalCalculations: number
  averagePerWeek: number
  mostUsedCalculators: string[]
  complexityPreference: 'simple' | 'moderate' | 'complex'
  accuracyRate: number
  learningCurve: number
}

// 目标行为分析
export interface GoalBehaviorAnalysis {
  totalGoals: number
  activeGoals: number
  completionRate: number
  averageGoalDuration: number
  goalTypes: string[]
  progressConsistency: number
}

// 学习行为分析
export interface LearningBehaviorAnalysis {
  contentEngagement: number
  recommendationAcceptance: number
  knowledgeProgression: number
  helpUsage: number
  errorRecovery: number
}

// 风险行为分析
export interface RiskBehaviorAnalysis {
  riskTolerance: 'low' | 'medium' | 'high'
  decisionSpeed: number
  informationSeeking: number
  cautionLevel: number
  experimentalBehavior: number
}

/**
 * 用户行为数据收集和分析引擎
 */
export class UserBehaviorAnalyticsService {
  private static instance: UserBehaviorAnalyticsService
  private anonymousUserService: AnonymousUserService
  private registrationService: OptionalRegistrationService
  private storageService: EnterpriseLocalStorageService
  private historyService: CalculationHistoryService
  private favoritesService: FavoritesService
  private goalService: EnhancedFinancialGoalService
  
  // 行为数据存储
  private userActions: Map<string, UserAction[]> = new Map()
  private behaviorPatterns: Map<string, BehaviorPatterns> = new Map()
  private userSegments: Map<string, UserSegment> = new Map()
  private engagementScores: Map<string, EngagementScore> = new Map()
  
  // 分析配置
  private analysisConfig = {
    batchSize: 1000,
    analysisInterval: 60 * 60 * 1000, // 1小时
    retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90天
    privacyMode: true
  }
  
  private isInitialized = false

  private constructor() {
    this.anonymousUserService = AnonymousUserService.getInstance()
    this.registrationService = OptionalRegistrationService.getInstance()
    this.storageService = EnterpriseLocalStorageService.getInstance()
    this.historyService = CalculationHistoryService.getInstance()
    this.favoritesService = FavoritesService.getInstance()
    this.goalService = EnhancedFinancialGoalService.getInstance()
  }

  static getInstance(): UserBehaviorAnalyticsService {
    if (!UserBehaviorAnalyticsService.instance) {
      UserBehaviorAnalyticsService.instance = new UserBehaviorAnalyticsService()
    }
    return UserBehaviorAnalyticsService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.anonymousUserService.initialize()
      await this.registrationService.initialize()
      await this.storageService.initialize()
      await this.historyService.initialize()
      await this.favoritesService.initialize()
      await this.goalService.initialize()
      
      await this.loadUserActions()
      await this.loadBehaviorPatterns()
      await this.loadUserSegments()
      await this.loadEngagementScores()
      
      this.startPeriodicAnalysis()
      this.isInitialized = true
      console.log('✅ UserBehaviorAnalyticsService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize UserBehaviorAnalyticsService:', error)
      throw error
    }
  }

  /**
   * 跟踪用户行为
   */
  async trackUserAction(userId: string, action: Omit<UserAction, 'id' | 'userId' | 'timestamp'>): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    try {
      // 检查用户同意
      const hasConsent = await this.checkDataProcessingConsent(userId)
      if (!hasConsent) {
        console.log(`⚠️ User ${userId} has not consented to behavior tracking`)
        return
      }

      const userAction: UserAction = {
        ...action,
        id: crypto.randomUUID(),
        userId,
        timestamp: new Date()
      }

      // 存储行为数据
      const userActionsList = this.userActions.get(userId) || []
      userActionsList.push(userAction)
      
      // 限制存储数量
      if (userActionsList.length > 10000) {
        userActionsList.splice(0, userActionsList.length - 10000)
      }
      
      this.userActions.set(userId, userActionsList)

      // 保存到持久存储
      await this.saveUserActions(userId, userActionsList)

      // 实时分析（如果需要）
      if (this.shouldTriggerRealTimeAnalysis(userAction)) {
        await this.performRealTimeAnalysis(userId, userAction)
      }

      console.log(`📊 Tracked action: ${action.type} for user ${userId}`)

    } catch (error) {
      console.error('Failed to track user action:', error)
    }
  }

  /**
   * 跟踪页面访问
   */
  async trackPageView(userId: string, pageView: PageViewEvent): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const action: Omit<UserAction, 'id' | 'userId' | 'timestamp'> = {
      type: 'page_view',
      data: {
        element: pageView.page,
        duration: pageView.duration,
        metadata: {
          title: pageView.title,
          url: pageView.url,
          scrollDepth: pageView.scrollDepth,
          exitPage: pageView.exitPage
        }
      },
      context: {
        page: pageView.page,
        referrer: pageView.referrer,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      sessionId: await this.getCurrentSessionId(userId),
      deviceInfo: this.getDeviceInfo(),
      privacyLevel: 'standard'
    }

    await this.trackUserAction(userId, action)
  }

  /**
   * 跟踪计算使用
   */
  async trackCalculationUsage(userId: string, calculation: CalculationEvent): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const action: Omit<UserAction, 'id' | 'userId' | 'timestamp'> = {
      type: 'calculation',
      data: {
        element: calculation.calculatorType,
        duration: calculation.calculationTime,
        result: calculation.success,
        metadata: {
          complexity: calculation.complexity,
          inputData: calculation.inputData,
          outputData: calculation.outputData,
          errors: calculation.errors
        }
      },
      context: {
        page: `/calculators/${calculation.calculatorType}`,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      sessionId: await this.getCurrentSessionId(userId),
      deviceInfo: this.getDeviceInfo(),
      privacyLevel: 'detailed'
    }

    await this.trackUserAction(userId, action)
  }

  /**
   * 分析用户行为模式
   */
  async analyzeUserBehaviorPatterns(userId: string, period: 'week' | 'month' | 'quarter'): Promise<BehaviorPatterns> {
    if (!this.isInitialized) await this.initialize()

    try {
      // 获取用户行为数据
      const userActionsList = this.userActions.get(userId) || []
      const periodStart = this.getPeriodStart(period)
      const relevantActions = userActionsList.filter(action => 
        action.timestamp >= periodStart
      )

      // 分析使用模式
      const usagePatterns = this.analyzeUsagePatterns(relevantActions)
      
      // 分析用户偏好
      const preferences = this.analyzeUserPreferences(relevantActions)
      
      // 分析行为趋势
      const trends = this.analyzeBehaviorTrends(relevantActions, period)
      
      // 检测异常行为
      const anomalies = this.detectBehaviorAnomalies(relevantActions)

      const patterns: BehaviorPatterns = {
        userId,
        analysisDate: new Date(),
        usagePatterns,
        preferences,
        trends,
        anomalies
      }

      // 缓存结果
      this.behaviorPatterns.set(userId, patterns)
      await this.saveBehaviorPatterns(userId, patterns)

      return patterns

    } catch (error) {
      console.error('Failed to analyze behavior patterns:', error)
      throw error
    }
  }

  /**
   * 计算参与度评分
   */
  async calculateEngagementScore(userId: string): Promise<EngagementScore> {
    if (!this.isInitialized) await this.initialize()

    try {
      const userActionsList = this.userActions.get(userId) || []
      const recentActions = userActionsList.filter(action => 
        action.timestamp >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
      )

      // 计算各种参与度因素
      const factors: EngagementFactor[] = [
        {
          factor: 'frequency',
          weight: 0.3,
          contribution: this.calculateFrequencyScore(recentActions),
          description: '使用频率'
        },
        {
          factor: 'diversity',
          weight: 0.2,
          contribution: this.calculateDiversityScore(recentActions),
          description: '功能使用多样性'
        },
        {
          factor: 'depth',
          weight: 0.25,
          contribution: this.calculateDepthScore(recentActions),
          description: '使用深度'
        },
        {
          factor: 'consistency',
          weight: 0.25,
          contribution: this.calculateConsistencyScore(recentActions),
          description: '使用一致性'
        }
      ]

      // 计算总分
      const score = factors.reduce((total, factor) => 
        total + (factor.contribution * factor.weight), 0
      ) * 100

      // 确定参与度等级
      let level: 'low' | 'medium' | 'high'
      if (score >= 70) level = 'high'
      else if (score >= 40) level = 'medium'
      else level = 'low'

      // 分析趋势
      const previousScore = this.engagementScores.get(userId)
      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      if (previousScore) {
        if (score > previousScore.score + 5) trend = 'improving'
        else if (score < previousScore.score - 5) trend = 'declining'
      }

      const engagementScore: EngagementScore = {
        userId,
        score: Math.round(score),
        level,
        factors,
        trend,
        lastCalculated: new Date()
      }

      // 缓存结果
      this.engagementScores.set(userId, engagementScore)
      await this.saveEngagementScore(userId, engagementScore)

      return engagementScore

    } catch (error) {
      console.error('Failed to calculate engagement score:', error)
      throw error
    }
  }

  /**
   * 预测用户流失
   */
  async predictUserChurn(userId: string): Promise<ChurnPrediction> {
    if (!this.isInitialized) await this.initialize()

    try {
      const userActionsList = this.userActions.get(userId) || []
      const engagementScore = await this.calculateEngagementScore(userId)
      
      // 分析流失风险因素
      const riskFactors: ChurnRiskFactor[] = []
      
      // 活跃度下降
      const recentActivity = this.calculateRecentActivity(userActionsList)
      if (recentActivity < 0.3) {
        riskFactors.push({
          factor: 'low_activity',
          impact: 0.4,
          description: '最近活跃度较低',
          mitigation: '发送个性化推荐和提醒'
        })
      }

      // 参与度下降
      if (engagementScore.level === 'low') {
        riskFactors.push({
          factor: 'low_engagement',
          impact: 0.3,
          description: '用户参与度较低',
          mitigation: '提供更多有价值的内容和功能'
        })
      }

      // 使用模式变化
      const usageChange = this.detectUsagePatternChange(userActionsList)
      if (usageChange > 0.5) {
        riskFactors.push({
          factor: 'usage_pattern_change',
          impact: 0.2,
          description: '使用模式发生显著变化',
          mitigation: '了解用户需求变化并调整服务'
        })
      }

      // 计算流失概率
      const churnProbability = Math.min(1, riskFactors.reduce((sum, factor) => sum + factor.impact, 0))
      
      // 确定风险等级
      let riskLevel: 'low' | 'medium' | 'high'
      if (churnProbability >= 0.7) riskLevel = 'high'
      else if (churnProbability >= 0.4) riskLevel = 'medium'
      else riskLevel = 'low'

      // 预测流失日期
      let predictedChurnDate: Date | undefined
      if (churnProbability > 0.5) {
        const daysUntilChurn = Math.round((1 - churnProbability) * 60) // 最多60天
        predictedChurnDate = new Date(Date.now() + daysUntilChurn * 24 * 60 * 60 * 1000)
      }

      // 生成预防建议
      const preventionSuggestions = this.generateChurnPreventionSuggestions(riskFactors)

      const churnPrediction: ChurnPrediction = {
        userId,
        churnProbability,
        riskLevel,
        predictedChurnDate,
        riskFactors,
        preventionSuggestions
      }

      return churnPrediction

    } catch (error) {
      console.error('Failed to predict user churn:', error)
      throw error
    }
  }

  // 私有方法
  private async checkDataProcessingConsent(userId: string): Promise<boolean> {
    // 检查用户是否同意数据处理
    // 简化实现：默认匿名用户同意基本分析
    return true
  }

  private shouldTriggerRealTimeAnalysis(action: UserAction): boolean {
    // 某些重要行为触发实时分析
    return ['calculation', 'goal_interaction'].includes(action.type)
  }

  private async performRealTimeAnalysis(userId: string, action: UserAction): Promise<void> {
    // 实时分析逻辑
    console.log(`🔄 Performing real-time analysis for user ${userId}`)
  }

  private async getCurrentSessionId(userId: string): Promise<string> {
    // 获取当前会话ID
    return `session_${userId}_${Date.now()}`
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent
    
    let type: 'desktop' | 'tablet' | 'mobile' = 'desktop'
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      type = /iPad/.test(userAgent) ? 'tablet' : 'mobile'
    }

    return {
      type,
      os: this.detectOS(userAgent),
      browser: this.detectBrowser(userAgent),
      version: this.detectBrowserVersion(userAgent)
    }
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private detectBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+\.\d+)/)
    return match ? match[1] : 'Unknown'
  }

  private getPeriodStart(period: 'week' | 'month' | 'quarter'): Date {
    const now = new Date()
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    }
  }

  private analyzeUsagePatterns(actions: UserAction[]): UsagePattern[] {
    const patterns: UsagePattern[] = []
    
    // 分析时间模式
    const hourlyUsage = new Map<number, number>()
    actions.forEach(action => {
      const hour = action.timestamp.getHours()
      hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + 1)
    })

    // 找出使用高峰时间
    const peakHours = Array.from(hourlyUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour)

    if (peakHours.length > 0) {
      patterns.push({
        pattern: 'peak_usage_hours',
        frequency: peakHours.length,
        confidence: 0.8,
        description: `主要在 ${peakHours.join(', ')} 点使用`,
        examples: peakHours.map(h => `${h}:00`)
      })
    }

    return patterns
  }

  private analyzeUserPreferences(actions: UserAction[]): UserPreferences {
    // 分析计算器偏好
    const calculatorUsage = new Map<string, number>()
    actions.filter(a => a.type === 'calculation').forEach(action => {
      const calculator = action.data.element || 'unknown'
      calculatorUsage.set(calculator, (calculatorUsage.get(calculator) || 0) + 1)
    })

    const preferredCalculators = Array.from(calculatorUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([calculator]) => calculator)

    // 分析时间偏好
    const hourlyUsage = new Map<number, number>()
    actions.forEach(action => {
      const hour = action.timestamp.getHours()
      hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + 1)
    })

    const preferredTimeOfDay = Array.from(hourlyUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour)

    // 分析星期偏好
    const dailyUsage = new Map<number, number>()
    actions.forEach(action => {
      const day = action.timestamp.getDay()
      dailyUsage.set(day, (dailyUsage.get(day) || 0) + 1)
    })

    const preferredDayOfWeek = Array.from(dailyUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day)

    // 计算平均会话时长
    const sessionDurations = actions
      .filter(a => a.data.duration)
      .map(a => a.data.duration || 0)
    
    const sessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length
      : 0

    // 确定交互风格
    let interactionStyle: 'explorer' | 'focused' | 'casual' = 'casual'
    const uniqueCalculators = new Set(actions.filter(a => a.type === 'calculation').map(a => a.data.element)).size
    const totalCalculations = actions.filter(a => a.type === 'calculation').length
    
    if (uniqueCalculators > 5 && totalCalculations > 20) {
      interactionStyle = 'explorer'
    } else if (totalCalculations > 10 && sessionDuration > 300) {
      interactionStyle = 'focused'
    }

    return {
      preferredCalculators,
      preferredTimeOfDay,
      preferredDayOfWeek,
      sessionDuration,
      interactionStyle
    }
  }

  private analyzeBehaviorTrends(actions: UserAction[], period: string): BehaviorTrend[] {
    // 简化的趋势分析
    const trends: BehaviorTrend[] = []
    
    // 分析使用频率趋势
    const recentActions = actions.filter(a => 
      a.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    const olderActions = actions.filter(a => 
      a.timestamp < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      a.timestamp >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    )

    const recentFreq = recentActions.length / 7
    const olderFreq = olderActions.length / 7
    
    if (recentFreq > olderFreq * 1.2) {
      trends.push({
        metric: 'usage_frequency',
        direction: 'increasing',
        magnitude: (recentFreq - olderFreq) / olderFreq,
        confidence: 0.7,
        timeframe: 'weekly'
      })
    } else if (recentFreq < olderFreq * 0.8) {
      trends.push({
        metric: 'usage_frequency',
        direction: 'decreasing',
        magnitude: (olderFreq - recentFreq) / olderFreq,
        confidence: 0.7,
        timeframe: 'weekly'
      })
    }

    return trends
  }

  private detectBehaviorAnomalies(actions: UserAction[]): BehaviorAnomaly[] {
    const anomalies: BehaviorAnomaly[] = []
    
    // 检测异常高频使用
    const dailyUsage = new Map<string, number>()
    actions.forEach(action => {
      const day = action.timestamp.toDateString()
      dailyUsage.set(day, (dailyUsage.get(day) || 0) + 1)
    })

    const averageDailyUsage = Array.from(dailyUsage.values()).reduce((sum, count) => sum + count, 0) / dailyUsage.size
    
    for (const [day, count] of dailyUsage.entries()) {
      if (count > averageDailyUsage * 3) {
        anomalies.push({
          type: 'high_frequency_usage',
          severity: 'medium',
          description: `异常高频使用: ${day} 使用了 ${count} 次`,
          timestamp: new Date(day),
          context: { count, average: averageDailyUsage }
        })
      }
    }

    return anomalies
  }

  private calculateFrequencyScore(actions: UserAction[]): number {
    // 基于最近30天的使用频率计算分数
    const daysWithActivity = new Set(actions.map(a => a.timestamp.toDateString())).size
    return Math.min(1, daysWithActivity / 30)
  }

  private calculateDiversityScore(actions: UserAction[]): number {
    // 基于使用的不同功能数量计算分数
    const uniqueActions = new Set(actions.map(a => a.type)).size
    const uniqueCalculators = new Set(actions.filter(a => a.type === 'calculation').map(a => a.data.element)).size
    return Math.min(1, (uniqueActions + uniqueCalculators) / 10)
  }

  private calculateDepthScore(actions: UserAction[]): number {
    // 基于会话深度和复杂操作计算分数
    const complexActions = actions.filter(a => 
      a.type === 'calculation' && a.data.metadata?.complexity === 'complex'
    ).length
    const totalActions = actions.length
    return totalActions > 0 ? Math.min(1, complexActions / totalActions * 2) : 0
  }

  private calculateConsistencyScore(actions: UserAction[]): number {
    // 基于使用一致性计算分数
    if (actions.length < 7) return 0
    
    const dailyUsage = new Map<string, number>()
    actions.forEach(action => {
      const day = action.timestamp.toDateString()
      dailyUsage.set(day, (dailyUsage.get(day) || 0) + 1)
    })

    const usageCounts = Array.from(dailyUsage.values())
    const average = usageCounts.reduce((sum, count) => sum + count, 0) / usageCounts.length
    const variance = usageCounts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / usageCounts.length
    const consistency = 1 / (1 + variance / average)
    
    return Math.min(1, consistency)
  }

  private calculateRecentActivity(actions: UserAction[]): number {
    const recentActions = actions.filter(a => 
      a.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    const olderActions = actions.filter(a => 
      a.timestamp < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      a.timestamp >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    )

    if (olderActions.length === 0) return recentActions.length > 0 ? 1 : 0
    return recentActions.length / olderActions.length
  }

  private detectUsagePatternChange(actions: UserAction[]): number {
    // 简化的使用模式变化检测
    const recentActions = actions.filter(a => 
      a.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    const olderActions = actions.filter(a => 
      a.timestamp < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      a.timestamp >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    )

    if (recentActions.length === 0 || olderActions.length === 0) return 0

    // 比较行为类型分布
    const recentTypes = new Set(recentActions.map(a => a.type))
    const olderTypes = new Set(olderActions.map(a => a.type))
    
    const intersection = new Set([...recentTypes].filter(x => olderTypes.has(x)))
    const union = new Set([...recentTypes, ...olderTypes])
    
    return 1 - (intersection.size / union.size)
  }

  private generateChurnPreventionSuggestions(riskFactors: ChurnRiskFactor[]): string[] {
    const suggestions = new Set<string>()
    
    riskFactors.forEach(factor => {
      suggestions.add(factor.mitigation)
    })

    // 添加通用建议
    suggestions.add('发送个性化的使用提醒')
    suggestions.add('提供新功能介绍和教程')
    suggestions.add('收集用户反馈以改进服务')

    return Array.from(suggestions)
  }

  private async saveUserActions(userId: string, actions: UserAction[]): Promise<void> {
    try {
      await this.storageService.storeData(
        `user_actions_${userId}`,
        actions,
        { encrypt: true, compress: true, namespace: 'analytics' }
      )
    } catch (error) {
      console.error('Failed to save user actions:', error)
    }
  }

  private async loadUserActions(): Promise<void> {
    try {
      // 从存储加载用户行为数据
      console.log('📊 Loading user actions...')
    } catch (error) {
      console.error('Failed to load user actions:', error)
    }
  }

  private async saveBehaviorPatterns(userId: string, patterns: BehaviorPatterns): Promise<void> {
    try {
      await this.storageService.storeData(
        `behavior_patterns_${userId}`,
        patterns,
        { encrypt: true, compress: true, namespace: 'analytics' }
      )
    } catch (error) {
      console.error('Failed to save behavior patterns:', error)
    }
  }

  private async loadBehaviorPatterns(): Promise<void> {
    try {
      console.log('🔍 Loading behavior patterns...')
    } catch (error) {
      console.error('Failed to load behavior patterns:', error)
    }
  }

  private async loadUserSegments(): Promise<void> {
    try {
      console.log('👥 Loading user segments...')
    } catch (error) {
      console.error('Failed to load user segments:', error)
    }
  }

  private async saveEngagementScore(userId: string, score: EngagementScore): Promise<void> {
    try {
      await this.storageService.storeData(
        `engagement_score_${userId}`,
        score,
        { encrypt: true, compress: true, namespace: 'analytics' }
      )
    } catch (error) {
      console.error('Failed to save engagement score:', error)
    }
  }

  private async loadEngagementScores(): Promise<void> {
    try {
      console.log('📈 Loading engagement scores...')
    } catch (error) {
      console.error('Failed to load engagement scores:', error)
    }
  }

  private startPeriodicAnalysis(): void {
    // 每小时进行批量分析
    setInterval(() => {
      this.performBatchAnalysis()
    }, this.analysisConfig.analysisInterval)

    // 每天清理过期数据
    setInterval(() => {
      this.cleanupExpiredData()
    }, 24 * 60 * 60 * 1000)
  }

  private async performBatchAnalysis(): Promise<void> {
    console.log('🔄 Performing batch analysis...')
    // 批量分析逻辑
  }

  private async cleanupExpiredData(): Promise<void> {
    console.log('🧹 Cleaning up expired data...')
    // 清理过期数据逻辑
  }
}

// Export singleton instance
export const userBehaviorAnalyticsService = UserBehaviorAnalyticsService.getInstance()
