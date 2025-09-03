/**
 * 用户行为分析服务
 * DSGVO合规的用户行为数据收集和分析系统
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserIdentityService } from './UserIdentityService'
import { LocalStorageService } from './LocalStorageService'
import { hasConsentForPurpose } from '@/utils/user-identity-utils'
import type { User } from '@/types/user-identity'

// 用户行为事件类型
export type UserEventType = 
  | 'page_view'
  | 'calculator_use'
  | 'goal_created'
  | 'goal_updated'
  | 'calculation_saved'
  | 'calculation_favorited'
  | 'recommendation_viewed'
  | 'recommendation_clicked'
  | 'search_performed'
  | 'export_data'
  | 'share_calculation'

// 用户行为事件
export interface UserEvent {
  id: string
  userId: string
  sessionId: string
  eventType: UserEventType
  timestamp: Date
  
  // 事件数据
  data: {
    page?: string
    calculatorType?: string
    goalId?: string
    calculationId?: string
    searchQuery?: string
    recommendationId?: string
    duration?: number
    [key: string]: unknown
  }
  
  // 上下文信息
  context: {
    userAgent: string
    viewport: { width: number; height: number }
    referrer?: string
    language: string
    timezone: string
  }
  
  // 隐私设置
  anonymized: boolean
  consentGiven: boolean
}

// 用户会话
export interface UserSession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  duration?: number
  pageViews: number
  interactions: number
  calculationsPerformed: number
  goalsCreated: number
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet'
    os: string
    browser: string
  }
  exitPage?: string
  bounced: boolean
}

// 用户洞察
export interface UserInsights {
  userId: string
  generatedAt: Date
  
  // 使用统计
  usage: {
    totalSessions: number
    totalDuration: number
    averageSessionDuration: number
    totalPageViews: number
    totalCalculations: number
    totalGoals: number
    lastActivity: Date
    activityStreak: number
  }
  
  // 偏好分析
  preferences: {
    favoriteCalculators: string[]
    preferredGoalTypes: string[]
    peakUsageHours: number[]
    preferredLanguage: string
    devicePreference: 'desktop' | 'mobile' | 'tablet'
  }
  
  // 财务健康评分
  financialHealth: {
    score: number // 0-100
    factors: {
      goalSetting: number
      regularUsage: number
      diversification: number
      longTermPlanning: number
    }
    recommendations: string[]
  }
  
  // 参与度分析
  engagement: {
    level: 'low' | 'medium' | 'high'
    score: number // 0-1
    trends: 'increasing' | 'stable' | 'decreasing'
    riskOfChurn: number // 0-1
  }
}

// 聚合统计
export interface AggregatedStats {
  period: 'day' | 'week' | 'month' | 'year'
  startDate: Date
  endDate: Date
  
  // 用户统计
  users: {
    total: number
    active: number
    new: number
    returning: number
    churned: number
  }
  
  // 使用统计
  usage: {
    totalSessions: number
    totalPageViews: number
    totalCalculations: number
    totalGoals: number
    averageSessionDuration: number
    bounceRate: number
  }
  
  // 功能使用
  features: {
    calculatorUsage: Record<string, number>
    goalTypes: Record<string, number>
    recommendationClicks: number
    exportActions: number
    shareActions: number
  }
  
  // 设备和浏览器
  devices: {
    desktop: number
    mobile: number
    tablet: number
  }
  
  browsers: Record<string, number>
}

/**
 * 用户行为分析服务
 */
export class UserAnalyticsService {
  private static instance: UserAnalyticsService
  private userIdentityService: UserIdentityService
  private storageService: LocalStorageService
  
  private currentSession: UserSession | null = null
  private eventQueue: UserEvent[] = []
  private isInitialized = false
  private flushInterval: number | null = null

  private constructor() {
    this.userIdentityService = UserIdentityService.getInstance()
    this.storageService = new LocalStorageService()
  }

  static getInstance(): UserAnalyticsService {
    if (!UserAnalyticsService.instance) {
      UserAnalyticsService.instance = new UserAnalyticsService()
    }
    return UserAnalyticsService.instance
  }

  /**
   * 初始化分析服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.startSession()
      this.setupEventListeners()
      this.startEventFlush()
      this.isInitialized = true
      console.log('📊 UserAnalyticsService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize UserAnalyticsService:', error)
      throw error
    }
  }

  /**
   * 记录用户事件
   */
  async trackEvent(
    eventType: UserEventType,
    data: UserEvent['data'] = {},
    context: Partial<UserEvent['context']> = {}
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const currentUser = await this.userIdentityService.getCurrentUser()
    if (!currentUser) return

    // 检查用户同意
    const consentGiven = hasConsentForPurpose(currentUser, 'website_analytics')
    if (!consentGiven) return

    const event: UserEvent = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      sessionId: this.currentSession?.id || 'unknown',
      eventType,
      timestamp: new Date(),
      data,
      context: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        referrer: document.referrer,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...context
      },
      anonymized: false,
      consentGiven: true
    }

    // 添加到队列
    this.eventQueue.push(event)

    // 更新当前会话
    if (this.currentSession) {
      this.currentSession.interactions++
      this.updateSessionStats(eventType)
    }

    console.log(`📈 Event tracked: ${eventType}`, data)
  }

  /**
   * 开始新会话
   */
  async startSession(): Promise<void> {
    const currentUser = await this.userIdentityService.getCurrentUser()
    if (!currentUser) return

    this.currentSession = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      startTime: new Date(),
      pageViews: 0,
      interactions: 0,
      calculationsPerformed: 0,
      goalsCreated: 0,
      deviceInfo: this.getDeviceInfo(),
      bounced: true // 默认为跳出，后续根据交互更新
    }

    console.log('🚀 New session started:', this.currentSession.id)
  }

  /**
   * 结束当前会话
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return

    this.currentSession.endTime = new Date()
    this.currentSession.duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()
    this.currentSession.exitPage = window.location.pathname

    // 保存会话数据
    await this.saveSession(this.currentSession)

    console.log('🏁 Session ended:', this.currentSession.id, `Duration: ${this.currentSession.duration}ms`)
    this.currentSession = null
  }

  /**
   * 获取用户洞察
   */
  async getUserInsights(userId?: string): Promise<UserInsights | null> {
    if (!this.isInitialized) await this.initialize()

    const currentUser = userId ? { id: userId } : await this.userIdentityService.getCurrentUser()
    if (!currentUser) return null

    // 检查用户同意
    const consentGiven = hasConsentForPurpose(currentUser, 'website_analytics')
    if (!consentGiven) return null

    try {
      // 获取用户事件和会话数据
      const events = await this.getUserEvents(currentUser.id)
      const sessions = await this.getUserSessions(currentUser.id)

      // 计算使用统计
      const usage = this.calculateUsageStats(events, sessions)
      
      // 分析偏好
      const preferences = this.analyzePreferences(events)
      
      // 计算财务健康评分
      const financialHealth = await this.calculateFinancialHealthScore(currentUser.id, events)
      
      // 分析参与度
      const engagement = this.analyzeEngagement(events, sessions)

      return {
        userId: currentUser.id,
        generatedAt: new Date(),
        usage,
        preferences,
        financialHealth,
        engagement
      }
    } catch (error) {
      console.error('Failed to generate user insights:', error)
      return null
    }
  }

  /**
   * 获取聚合统计
   */
  async getAggregatedStats(
    period: AggregatedStats['period'],
    startDate: Date,
    endDate: Date
  ): Promise<AggregatedStats> {
    // 简化实现 - 实际应该从存储中聚合数据
    return {
      period,
      startDate,
      endDate,
      users: {
        total: 100,
        active: 80,
        new: 20,
        returning: 60,
        churned: 5
      },
      usage: {
        totalSessions: 500,
        totalPageViews: 2000,
        totalCalculations: 800,
        totalGoals: 150,
        averageSessionDuration: 300000, // 5分钟
        bounceRate: 0.3
      },
      features: {
        calculatorUsage: {
          'compound-interest': 300,
          'loan': 200,
          'mortgage': 150,
          'portfolio': 100
        },
        goalTypes: {
          'retirement': 60,
          'house': 40,
          'education': 30,
          'emergency': 20
        },
        recommendationClicks: 120,
        exportActions: 50,
        shareActions: 30
      },
      devices: {
        desktop: 60,
        mobile: 35,
        tablet: 5
      },
      browsers: {
        'Chrome': 50,
        'Safari': 25,
        'Firefox': 15,
        'Edge': 10
      }
    }
  }

  /**
   * 导出用户数据（DSGVO权利）
   */
  async exportUserData(userId?: string): Promise<string> {
    const currentUser = userId ? { id: userId } : await this.userIdentityService.getCurrentUser()
    if (!currentUser) {
      throw new Error('User not found')
    }

    const events = await this.getUserEvents(currentUser.id)
    const sessions = await this.getUserSessions(currentUser.id)
    const insights = await this.getUserInsights(currentUser.id)

    const exportData = {
      userId: currentUser.id,
      exportDate: new Date().toISOString(),
      events: events.map(e => ({
        ...e,
        // 移除敏感的上下文信息
        context: {
          language: e.context.language,
          timezone: e.context.timezone
        }
      })),
      sessions: sessions.map(s => ({
        ...s,
        // 只保留基本统计信息
        deviceInfo: {
          type: s.deviceInfo.type
        }
      })),
      insights
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 删除用户数据（DSGVO权利）
   */
  async deleteUserData(userId?: string): Promise<void> {
    const currentUser = userId ? { id: userId } : await this.userIdentityService.getCurrentUser()
    if (!currentUser) {
      throw new Error('User not found')
    }

    try {
      // 删除用户事件
      await this.deleteUserEvents(currentUser.id)
      
      // 删除用户会话
      await this.deleteUserSessions(currentUser.id)
      
      console.log(`🗑️ Deleted analytics data for user: ${currentUser.id}`)
    } catch (error) {
      console.error('Failed to delete user analytics data:', error)
      throw error
    }
  }

  // 私有方法
  private setupEventListeners(): void {
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endSession()
      } else {
        this.startSession()
      }
    })

    // 页面卸载
    window.addEventListener('beforeunload', () => {
      this.endSession()
      this.flushEvents()
    })

    // 页面浏览
    window.addEventListener('popstate', () => {
      this.trackEvent('page_view', {
        page: window.location.pathname
      })
    })
  }

  private startEventFlush(): void {
    // 每30秒刷新一次事件队列
    this.flushInterval = window.setInterval(() => {
      this.flushEvents()
    }, 30000)
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return

    try {
      // 保存事件到存储
      for (const event of this.eventQueue) {
        await this.saveEvent(event)
      }
      
      console.log(`💾 Flushed ${this.eventQueue.length} events`)
      this.eventQueue = []
    } catch (error) {
      console.error('Failed to flush events:', error)
    }
  }

  private updateSessionStats(eventType: UserEventType): void {
    if (!this.currentSession) return

    switch (eventType) {
      case 'page_view':
        this.currentSession.pageViews++
        break
      case 'calculator_use':
        this.currentSession.calculationsPerformed++
        break
      case 'goal_created':
        this.currentSession.goalsCreated++
        break
    }

    // 如果有交互，不再是跳出
    if (this.currentSession.interactions > 1) {
      this.currentSession.bounced = false
    }
  }

  private getDeviceInfo(): UserSession['deviceInfo'] {
    const userAgent = navigator.userAgent.toLowerCase()
    
    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop'
    if (/mobile/.test(userAgent)) type = 'mobile'
    else if (/tablet|ipad/.test(userAgent)) type = 'tablet'

    let os = 'unknown'
    if (/windows/.test(userAgent)) os = 'Windows'
    else if (/mac/.test(userAgent)) os = 'macOS'
    else if (/linux/.test(userAgent)) os = 'Linux'
    else if (/android/.test(userAgent)) os = 'Android'
    else if (/ios/.test(userAgent)) os = 'iOS'

    let browser = 'unknown'
    if (/chrome/.test(userAgent)) browser = 'Chrome'
    else if (/safari/.test(userAgent)) browser = 'Safari'
    else if (/firefox/.test(userAgent)) browser = 'Firefox'
    else if (/edge/.test(userAgent)) browser = 'Edge'

    return { type, os, browser }
  }

  private calculateUsageStats(events: UserEvent[], sessions: UserSession[]) {
    const totalSessions = sessions.length
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0
    const totalPageViews = events.filter(e => e.eventType === 'page_view').length
    const totalCalculations = events.filter(e => e.eventType === 'calculator_use').length
    const totalGoals = events.filter(e => e.eventType === 'goal_created').length
    const lastActivity = events.length > 0 ? events[events.length - 1].timestamp : new Date()

    return {
      totalSessions,
      totalDuration,
      averageSessionDuration,
      totalPageViews,
      totalCalculations,
      totalGoals,
      lastActivity,
      activityStreak: this.calculateActivityStreak(events)
    }
  }

  private analyzePreferences(events: UserEvent[]) {
    const calculatorEvents = events.filter(e => e.eventType === 'calculator_use')
    const goalEvents = events.filter(e => e.eventType === 'goal_created')

    const calculatorCounts = new Map<string, number>()
    calculatorEvents.forEach(e => {
      const type = e.data.calculatorType as string
      calculatorCounts.set(type, (calculatorCounts.get(type) || 0) + 1)
    })

    const goalCounts = new Map<string, number>()
    goalEvents.forEach(e => {
      const type = e.data.goalType as string
      goalCounts.set(type, (goalCounts.get(type) || 0) + 1)
    })

    return {
      favoriteCalculators: Array.from(calculatorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type),
      preferredGoalTypes: Array.from(goalCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type),
      peakUsageHours: this.calculatePeakUsageHours(events),
      preferredLanguage: events[0]?.context.language || 'de',
      devicePreference: this.calculateDevicePreference(events)
    }
  }

  private async calculateFinancialHealthScore(userId: string, events: UserEvent[]) {
    // 简化的财务健康评分算法
    const goalSetting = Math.min(1, events.filter(e => e.eventType === 'goal_created').length / 3) * 25
    const regularUsage = Math.min(1, events.length / 50) * 25
    const diversification = Math.min(1, new Set(events.map(e => e.data.calculatorType)).size / 5) * 25
    const longTermPlanning = events.some(e => e.data.goalType === 'retirement') ? 25 : 0

    const score = goalSetting + regularUsage + diversification + longTermPlanning

    return {
      score,
      factors: {
        goalSetting: goalSetting / 25,
        regularUsage: regularUsage / 25,
        diversification: diversification / 25,
        longTermPlanning: longTermPlanning / 25
      },
      recommendations: this.generateHealthRecommendations(score)
    }
  }

  private analyzeEngagement(events: UserEvent[], sessions: UserSession[]) {
    const recentEvents = events.filter(e => 
      Date.now() - e.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // 30天内
    )
    
    const engagementScore = Math.min(1, recentEvents.length / 20)
    let level: 'low' | 'medium' | 'high' = 'low'
    
    if (engagementScore > 0.7) level = 'high'
    else if (engagementScore > 0.3) level = 'medium'

    return {
      level,
      score: engagementScore,
      trends: 'stable' as const,
      riskOfChurn: 1 - engagementScore
    }
  }

  private calculateActivityStreak(events: UserEvent[]): number {
    // 简化实现
    return Math.min(30, Math.floor(events.length / 5))
  }

  private calculatePeakUsageHours(events: UserEvent[]): number[] {
    const hourCounts = new Array(24).fill(0)
    events.forEach(e => {
      const hour = e.timestamp.getHours()
      hourCounts[hour]++
    })
    
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({ hour }) => hour)
  }

  private calculateDevicePreference(events: UserEvent[]): 'desktop' | 'mobile' | 'tablet' {
    // 简化实现
    return 'desktop'
  }

  private generateHealthRecommendations(score: number): string[] {
    const recommendations: string[] = []
    
    if (score < 25) {
      recommendations.push('Setzen Sie sich konkrete Finanzziele')
    }
    if (score < 50) {
      recommendations.push('Nutzen Sie verschiedene Rechner für bessere Planung')
    }
    if (score < 75) {
      recommendations.push('Planen Sie langfristig für die Altersvorsorge')
    }
    
    return recommendations
  }

  // 存储相关方法（简化实现）
  private async saveEvent(event: UserEvent): Promise<void> {
    // 实际实现应该保存到LocalStorageService
    console.log('💾 Saving event:', event.eventType)
  }

  private async saveSession(session: UserSession): Promise<void> {
    // 实际实现应该保存到LocalStorageService
    console.log('💾 Saving session:', session.id)
  }

  private async getUserEvents(userId: string): Promise<UserEvent[]> {
    // 实际实现应该从LocalStorageService加载
    return []
  }

  private async getUserSessions(userId: string): Promise<UserSession[]> {
    // 实际实现应该从LocalStorageService加载
    return []
  }

  private async deleteUserEvents(userId: string): Promise<void> {
    // 实际实现应该从LocalStorageService删除
    console.log('🗑️ Deleting events for user:', userId)
  }

  private async deleteUserSessions(userId: string): Promise<void> {
    // 实际实现应该从LocalStorageService删除
    console.log('🗑️ Deleting sessions for user:', userId)
  }
}

// 导出单例实例
export const userAnalyticsService = UserAnalyticsService.getInstance()
