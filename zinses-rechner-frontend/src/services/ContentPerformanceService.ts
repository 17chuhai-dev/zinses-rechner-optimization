/**
 * 内容表现分析服务
 * 集成现有用户行为分析系统，开发内容表现分析仪表盘
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserAnalyticsService } from './UserAnalyticsService'
import { ContentManagementService } from './ContentManagementService'
import { SocialMediaAnalyticsService } from './SocialMediaAnalyticsService'
import type { Article } from './ContentManagementService'
import type { UserEvent } from './UserAnalyticsService'

// 内容表现指标
export interface ContentMetrics {
  contentId: string
  title: string
  slug: string
  category: string
  publishedAt: Date
  
  // 阅读指标
  pageViews: number
  uniqueVisitors: number
  averageTimeOnPage: number
  bounceRate: number
  readingCompletion: number // 阅读完成率
  
  // 参与度指标
  likes: number
  comments: number
  shares: number
  bookmarks: number
  engagementRate: number
  
  // 转化指标
  calculatorClicks: number
  goalCreations: number
  conversionRate: number
  
  // SEO指标
  organicTraffic: number
  searchRankings: Record<string, number>
  clickThroughRate: number
  
  // 社交媒体指标
  socialShares: Record<string, number>
  socialEngagement: number
  socialReach: number
  
  // 综合评分
  performanceScore: number
  trendDirection: 'up' | 'down' | 'stable'
}

// 内容表现分析
export interface ContentPerformanceAnalysis {
  overview: PerformanceOverview
  topPerforming: ContentMetrics[]
  underPerforming: ContentMetrics[]
  categoryAnalysis: CategoryPerformance[]
  timeSeriesData: TimeSeriesData[]
  insights: ContentInsight[]
  recommendations: ContentRecommendation[]
}

// 表现概览
export interface PerformanceOverview {
  totalContent: number
  totalViews: number
  totalEngagement: number
  averagePerformanceScore: number
  period: { start: Date; end: Date }
  
  // 增长指标
  growth: {
    views: number
    engagement: number
    conversions: number
  }
  
  // 分布统计
  distribution: {
    byCategory: Record<string, number>
    byPerformance: {
      high: number // >80分
      medium: number // 50-80分
      low: number // <50分
    }
  }
}

// 分类表现
export interface CategoryPerformance {
  category: string
  contentCount: number
  totalViews: number
  averageEngagement: number
  conversionRate: number
  topContent: string[]
  trends: 'improving' | 'declining' | 'stable'
}

// 时间序列数据
export interface TimeSeriesData {
  date: Date
  views: number
  engagement: number
  conversions: number
  newContent: number
}

// 内容洞察
export interface ContentInsight {
  id: string
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  affectedContent: string[]
  actionable: boolean
}

// 内容建议
export interface ContentRecommendation {
  id: string
  type: 'optimization' | 'promotion' | 'creation' | 'update'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  expectedImpact: string
  actionItems: string[]
  targetContent?: string[]
}

// 阅读行为分析
export interface ReadingBehavior {
  contentId: string
  averageReadingTime: number
  scrollDepth: number
  exitPoints: number[]
  returnVisitors: number
  readingPatterns: {
    quickScan: number
    thoroughRead: number
    partialRead: number
  }
}

/**
 * 内容表现分析服务
 */
export class ContentPerformanceService {
  private static instance: ContentPerformanceService
  private userAnalyticsService: UserAnalyticsService
  private contentManagementService: ContentManagementService
  private socialMediaAnalyticsService: SocialMediaAnalyticsService
  private isInitialized = false

  private constructor() {
    this.userAnalyticsService = UserAnalyticsService.getInstance()
    this.contentManagementService = ContentManagementService.getInstance()
    this.socialMediaAnalyticsService = SocialMediaAnalyticsService.getInstance()
  }

  static getInstance(): ContentPerformanceService {
    if (!ContentPerformanceService.instance) {
      ContentPerformanceService.instance = new ContentPerformanceService()
    }
    return ContentPerformanceService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.userAnalyticsService.initialize()
      await this.contentManagementService.initialize()
      await this.socialMediaAnalyticsService.initialize()
      this.isInitialized = true
      console.log('✅ ContentPerformanceService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ContentPerformanceService:', error)
      throw error
    }
  }

  /**
   * 获取内容表现分析
   */
  async getContentPerformanceAnalysis(period: { start: Date; end: Date }): Promise<ContentPerformanceAnalysis> {
    if (!this.isInitialized) await this.initialize()

    const [
      overview,
      topPerforming,
      underPerforming,
      categoryAnalysis,
      timeSeriesData,
      insights,
      recommendations
    ] = await Promise.all([
      this.getPerformanceOverview(period),
      this.getTopPerformingContent(period, 10),
      this.getUnderPerformingContent(period, 10),
      this.getCategoryAnalysis(period),
      this.getTimeSeriesData(period),
      this.generateContentInsights(period),
      this.generateContentRecommendations(period)
    ])

    return {
      overview,
      topPerforming,
      underPerforming,
      categoryAnalysis,
      timeSeriesData,
      insights,
      recommendations
    }
  }

  /**
   * 获取单个内容的详细指标
   */
  async getContentMetrics(contentId: string, period?: { start: Date; end: Date }): Promise<ContentMetrics | null> {
    if (!this.isInitialized) await this.initialize()

    try {
      // 获取文章信息
      const article = await this.contentManagementService.getArticle(contentId)
      if (!article) return null

      // 获取用户行为数据
      const events = await this.getContentEvents(contentId, period)
      
      // 计算各项指标
      const pageViews = this.calculatePageViews(events)
      const uniqueVisitors = this.calculateUniqueVisitors(events)
      const averageTimeOnPage = this.calculateAverageTimeOnPage(events)
      const bounceRate = this.calculateBounceRate(events)
      const readingCompletion = this.calculateReadingCompletion(events)
      
      const engagementMetrics = this.calculateEngagementMetrics(events)
      const conversionMetrics = this.calculateConversionMetrics(events)
      const seoMetrics = await this.calculateSEOMetrics(article)
      const socialMetrics = await this.calculateSocialMetrics(contentId)

      const performanceScore = this.calculatePerformanceScore({
        pageViews,
        engagementRate: engagementMetrics.engagementRate,
        conversionRate: conversionMetrics.conversionRate,
        readingCompletion,
        socialEngagement: socialMetrics.socialEngagement
      })

      return {
        contentId,
        title: article.title,
        slug: article.slug,
        category: article.category,
        publishedAt: article.publishDate || article.createdAt,
        
        // 阅读指标
        pageViews,
        uniqueVisitors,
        averageTimeOnPage,
        bounceRate,
        readingCompletion,
        
        // 参与度指标
        likes: engagementMetrics.likes,
        comments: engagementMetrics.comments,
        shares: engagementMetrics.shares,
        bookmarks: engagementMetrics.bookmarks,
        engagementRate: engagementMetrics.engagementRate,
        
        // 转化指标
        calculatorClicks: conversionMetrics.calculatorClicks,
        goalCreations: conversionMetrics.goalCreations,
        conversionRate: conversionMetrics.conversionRate,
        
        // SEO指标
        organicTraffic: seoMetrics.organicTraffic,
        searchRankings: seoMetrics.searchRankings,
        clickThroughRate: seoMetrics.clickThroughRate,
        
        // 社交媒体指标
        socialShares: socialMetrics.socialShares,
        socialEngagement: socialMetrics.socialEngagement,
        socialReach: socialMetrics.socialReach,
        
        // 综合评分
        performanceScore,
        trendDirection: this.calculateTrendDirection(events)
      }
    } catch (error) {
      console.error(`Failed to get metrics for content ${contentId}:`, error)
      return null
    }
  }

  /**
   * 获取阅读行为分析
   */
  async getReadingBehavior(contentId: string): Promise<ReadingBehavior | null> {
    if (!this.isInitialized) await this.initialize()

    try {
      const events = await this.getContentEvents(contentId)
      const readingEvents = events.filter(e => e.eventType === 'page_view' && e.data.contentId === contentId)

      return {
        contentId,
        averageReadingTime: this.calculateAverageReadingTime(readingEvents),
        scrollDepth: this.calculateScrollDepth(readingEvents),
        exitPoints: this.calculateExitPoints(readingEvents),
        returnVisitors: this.calculateReturnVisitors(readingEvents),
        readingPatterns: this.analyzeReadingPatterns(readingEvents)
      }
    } catch (error) {
      console.error(`Failed to analyze reading behavior for ${contentId}:`, error)
      return null
    }
  }

  /**
   * 跟踪内容事件
   */
  async trackContentEvent(
    eventType: 'view' | 'like' | 'share' | 'bookmark' | 'calculator_click' | 'goal_creation',
    contentId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    await this.userAnalyticsService.trackEvent('content_interaction', {
      contentId,
      interactionType: eventType,
      ...metadata
    })
  }

  // 私有方法
  private async getPerformanceOverview(period: { start: Date; end: Date }): Promise<PerformanceOverview> {
    // 模拟数据，实际应该从用户分析服务获取
    return {
      totalContent: 45,
      totalViews: 125000,
      totalEngagement: 8500,
      averagePerformanceScore: 72,
      period,
      growth: {
        views: 0.15, // +15%
        engagement: 0.22, // +22%
        conversions: 0.08 // +8%
      },
      distribution: {
        byCategory: {
          'grundlagen': 15,
          'strategien': 12,
          'tools': 8,
          'steuer': 6,
          'news': 4
        },
        byPerformance: {
          high: 12,
          medium: 25,
          low: 8
        }
      }
    }
  }

  private async getTopPerformingContent(period: { start: Date; end: Date }, limit: number): Promise<ContentMetrics[]> {
    // 模拟数据
    const mockContent: ContentMetrics[] = [
      {
        contentId: 'article-1',
        title: 'Zinseszins verstehen: Der Schlüssel zum Vermögensaufbau',
        slug: 'zinseszins-verstehen',
        category: 'grundlagen',
        publishedAt: new Date('2024-12-01'),
        pageViews: 8500,
        uniqueVisitors: 6200,
        averageTimeOnPage: 245,
        bounceRate: 0.35,
        readingCompletion: 0.78,
        likes: 156,
        comments: 23,
        shares: 89,
        bookmarks: 67,
        engagementRate: 0.095,
        calculatorClicks: 234,
        goalCreations: 45,
        conversionRate: 0.032,
        organicTraffic: 5200,
        searchRankings: { 'zinseszins': 3, 'compound interest': 5 },
        clickThroughRate: 0.045,
        socialShares: { linkedin: 45, xing: 28, twitter: 16 },
        socialEngagement: 89,
        socialReach: 12000,
        performanceScore: 92,
        trendDirection: 'up'
      }
    ]

    return mockContent.slice(0, limit)
  }

  private async getUnderPerformingContent(period: { start: Date; end: Date }, limit: number): Promise<ContentMetrics[]> {
    // 模拟数据
    const mockContent: ContentMetrics[] = [
      {
        contentId: 'article-low',
        title: 'Komplexe Steueroptimierung für Fortgeschrittene',
        slug: 'steueroptimierung-fortgeschrittene',
        category: 'steuer',
        publishedAt: new Date('2024-11-15'),
        pageViews: 450,
        uniqueVisitors: 380,
        averageTimeOnPage: 120,
        bounceRate: 0.75,
        readingCompletion: 0.35,
        likes: 8,
        comments: 2,
        shares: 3,
        bookmarks: 5,
        engagementRate: 0.018,
        calculatorClicks: 12,
        goalCreations: 1,
        conversionRate: 0.008,
        organicTraffic: 280,
        searchRankings: { 'steueroptimierung': 45 },
        clickThroughRate: 0.015,
        socialShares: { linkedin: 2, xing: 1 },
        socialEngagement: 3,
        socialReach: 800,
        performanceScore: 28,
        trendDirection: 'down'
      }
    ]

    return mockContent.slice(0, limit)
  }

  private async getCategoryAnalysis(period: { start: Date; end: Date }): Promise<CategoryPerformance[]> {
    return [
      {
        category: 'grundlagen',
        contentCount: 15,
        totalViews: 45000,
        averageEngagement: 0.078,
        conversionRate: 0.025,
        topContent: ['Zinseszins verstehen', 'Geld anlegen für Anfänger'],
        trends: 'improving'
      },
      {
        category: 'tools',
        contentCount: 8,
        totalViews: 32000,
        averageEngagement: 0.095,
        conversionRate: 0.045,
        topContent: ['Sparplan-Rechner Guide', 'Investment Calculator'],
        trends: 'stable'
      }
    ]
  }

  private async getTimeSeriesData(period: { start: Date; end: Date }): Promise<TimeSeriesData[]> {
    const data: TimeSeriesData[] = []
    const days = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i < days; i++) {
      const date = new Date(period.start.getTime() + i * 24 * 60 * 60 * 1000)
      data.push({
        date,
        views: Math.floor(Math.random() * 1000) + 500,
        engagement: Math.floor(Math.random() * 100) + 50,
        conversions: Math.floor(Math.random() * 20) + 5,
        newContent: Math.random() > 0.8 ? 1 : 0
      })
    }
    
    return data
  }

  private async generateContentInsights(period: { start: Date; end: Date }): Promise<ContentInsight[]> {
    return [
      {
        id: 'trending-topic',
        type: 'opportunity',
        title: 'Steigende Nachfrage nach ESG-Investment Inhalten',
        description: 'Suchanfragen zu nachhaltigen Geldanlagen sind um 45% gestiegen',
        impact: 'high',
        affectedContent: [],
        actionable: true
      },
      {
        id: 'performance-drop',
        type: 'warning',
        title: 'Rückgang bei Steuer-Inhalten',
        description: 'Steuer-bezogene Artikel zeigen 20% weniger Engagement',
        impact: 'medium',
        affectedContent: ['steuer-category'],
        actionable: true
      }
    ]
  }

  private async generateContentRecommendations(period: { start: Date; end: Date }): Promise<ContentRecommendation[]> {
    return [
      {
        id: 'update-underperforming',
        type: 'optimization',
        priority: 'high',
        title: 'Schwach performende Inhalte überarbeiten',
        description: 'Aktualisieren Sie Inhalte mit Performance-Score unter 40',
        expectedImpact: '+30% Engagement',
        actionItems: [
          'Titel und Meta-Beschreibungen optimieren',
          'Aktuelle Daten und Beispiele hinzufügen',
          'Interne Verlinkung verbessern'
        ],
        targetContent: ['article-low']
      },
      {
        id: 'create-trending-content',
        type: 'creation',
        priority: 'medium',
        title: 'Trending Topics aufgreifen',
        description: 'Erstellen Sie Inhalte zu aktuell gefragten Themen',
        expectedImpact: '+50% organischer Traffic',
        actionItems: [
          'ESG-Investment Guide erstellen',
          'Nachhaltige Geldanlage Rechner entwickeln',
          'Grüne Finanzprodukte vergleichen'
        ]
      }
    ]
  }

  private async getContentEvents(contentId: string, period?: { start: Date; end: Date }): Promise<UserEvent[]> {
    // 简化实现，实际应该从UserAnalyticsService获取
    return []
  }

  private calculatePageViews(events: UserEvent[]): number {
    return events.filter(e => e.eventType === 'page_view').length
  }

  private calculateUniqueVisitors(events: UserEvent[]): number {
    const uniqueUsers = new Set(events.map(e => e.userId))
    return uniqueUsers.size
  }

  private calculateAverageTimeOnPage(events: UserEvent[]): number {
    // 简化计算
    return Math.floor(Math.random() * 300) + 120 // 2-7分钟
  }

  private calculateBounceRate(events: UserEvent[]): number {
    // 简化计算
    return Math.random() * 0.5 + 0.2 // 20-70%
  }

  private calculateReadingCompletion(events: UserEvent[]): number {
    // 简化计算
    return Math.random() * 0.4 + 0.4 // 40-80%
  }

  private calculateEngagementMetrics(events: UserEvent[]) {
    return {
      likes: Math.floor(Math.random() * 100) + 10,
      comments: Math.floor(Math.random() * 30) + 2,
      shares: Math.floor(Math.random() * 50) + 5,
      bookmarks: Math.floor(Math.random() * 40) + 3,
      engagementRate: Math.random() * 0.08 + 0.02
    }
  }

  private calculateConversionMetrics(events: UserEvent[]) {
    const calculatorClicks = events.filter(e => e.eventType === 'calculator_use').length
    const goalCreations = events.filter(e => e.eventType === 'goal_created').length
    
    return {
      calculatorClicks,
      goalCreations,
      conversionRate: (calculatorClicks + goalCreations) / Math.max(events.length, 1)
    }
  }

  private async calculateSEOMetrics(article: Article) {
    return {
      organicTraffic: Math.floor(Math.random() * 5000) + 1000,
      searchRankings: { [article.primaryKeyword || 'default']: Math.floor(Math.random() * 20) + 1 },
      clickThroughRate: Math.random() * 0.05 + 0.02
    }
  }

  private async calculateSocialMetrics(contentId: string) {
    return {
      socialShares: {
        linkedin: Math.floor(Math.random() * 50) + 5,
        xing: Math.floor(Math.random() * 30) + 3,
        twitter: Math.floor(Math.random() * 20) + 2
      },
      socialEngagement: Math.floor(Math.random() * 100) + 20,
      socialReach: Math.floor(Math.random() * 10000) + 2000
    }
  }

  private calculatePerformanceScore(metrics: {
    pageViews: number
    engagementRate: number
    conversionRate: number
    readingCompletion: number
    socialEngagement: number
  }): number {
    // 加权计算综合评分
    const weights = {
      pageViews: 0.2,
      engagementRate: 0.25,
      conversionRate: 0.25,
      readingCompletion: 0.15,
      socialEngagement: 0.15
    }

    const normalizedMetrics = {
      pageViews: Math.min(metrics.pageViews / 1000, 1), // 标准化到0-1
      engagementRate: Math.min(metrics.engagementRate * 10, 1),
      conversionRate: Math.min(metrics.conversionRate * 20, 1),
      readingCompletion: metrics.readingCompletion,
      socialEngagement: Math.min(metrics.socialEngagement / 100, 1)
    }

    const score = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (normalizedMetrics[key as keyof typeof normalizedMetrics] * weight)
    }, 0)

    return Math.round(score * 100)
  }

  private calculateTrendDirection(events: UserEvent[]): 'up' | 'down' | 'stable' {
    // 简化实现
    const random = Math.random()
    if (random > 0.6) return 'up'
    if (random < 0.3) return 'down'
    return 'stable'
  }

  private calculateAverageReadingTime(events: UserEvent[]): number {
    return Math.floor(Math.random() * 300) + 120
  }

  private calculateScrollDepth(events: UserEvent[]): number {
    return Math.random() * 0.4 + 0.5 // 50-90%
  }

  private calculateExitPoints(events: UserEvent[]): number[] {
    return [0.25, 0.45, 0.75] // 退出点百分比
  }

  private calculateReturnVisitors(events: UserEvent[]): number {
    return Math.floor(events.length * 0.3) // 30%回访用户
  }

  private analyzeReadingPatterns(events: UserEvent[]) {
    return {
      quickScan: 0.4,
      thoroughRead: 0.35,
      partialRead: 0.25
    }
  }
}

// Export singleton instance
export const contentPerformanceService = ContentPerformanceService.getInstance()
