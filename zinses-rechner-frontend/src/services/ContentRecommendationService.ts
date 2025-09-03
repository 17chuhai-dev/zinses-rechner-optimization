/**
 * 内容推荐算法服务
 * 基于用户行为和兴趣推荐相关内容，支持协同过滤、内容相似性分析和实时推荐更新
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserAnalyticsService } from './UserAnalyticsService'
import { ContentPerformanceService } from './ContentPerformanceService'
import { ContentCategoryService } from './ContentCategoryService'
import type { Article } from './ContentManagementService'
import type { UserProfile } from './UserAnalyticsService'

// 推荐内容
export interface RecommendedContent {
  contentId: string
  title: string
  slug: string
  excerpt: string
  category: string
  tags: string[]
  publishedAt: Date
  
  // 推荐相关
  score: number // 推荐分数 0-1
  reason: RecommendationReason
  confidence: number // 推荐置信度 0-1
  
  // 内容指标
  readingTime: number
  difficulty: string
  popularity: number
  engagement: number
}

// 推荐原因
export interface RecommendationReason {
  type: 'similar_content' | 'user_interest' | 'collaborative' | 'trending' | 'category_based' | 'completion_based'
  description: string
  factors: string[]
  weight: number
}

// 用户兴趣模型
export interface UserInterestProfile {
  userId: string
  interests: InterestCategory[]
  readingHistory: ReadingHistoryItem[]
  preferences: UserPreferences
  lastUpdated: Date
}

export interface InterestCategory {
  category: string
  score: number // 兴趣分数 0-1
  confidence: number
  recentActivity: number
  trendDirection: 'increasing' | 'stable' | 'decreasing'
}

export interface ReadingHistoryItem {
  contentId: string
  readAt: Date
  readingTime: number
  completion: number // 阅读完成度 0-1
  engagement: number // 参与度分数
  rating?: number // 用户评分 1-5
}

export interface UserPreferences {
  preferredCategories: string[]
  preferredDifficulty: string[]
  preferredLength: 'short' | 'medium' | 'long' | 'any'
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'any'
  avoidCategories: string[]
}

// 内容相似性
export interface ContentSimilarity {
  contentId1: string
  contentId2: string
  similarity: number
  factors: SimilarityFactor[]
}

export interface SimilarityFactor {
  type: 'category' | 'tags' | 'keywords' | 'topic' | 'difficulty' | 'length'
  score: number
  weight: number
}

// 推荐策略
export interface RecommendationStrategy {
  strategyId: string
  name: string
  description: string
  weight: number
  enabled: boolean
  
  // 策略参数
  parameters: Record<string, any>
  
  // 性能指标
  clickThroughRate: number
  conversionRate: number
  userSatisfaction: number
}

// 推荐结果
export interface RecommendationResult {
  userId: string
  recommendations: RecommendedContent[]
  strategies: RecommendationStrategy[]
  generatedAt: Date
  context: RecommendationContext
}

export interface RecommendationContext {
  currentContent?: string
  userSession: string
  deviceType: string
  timeOfDay: string
  location?: string
  referrer?: string
}

/**
 * 内容推荐算法服务
 */
export class ContentRecommendationService {
  private static instance: ContentRecommendationService
  private userAnalyticsService: UserAnalyticsService
  private contentPerformanceService: ContentPerformanceService
  private contentCategoryService: ContentCategoryService
  
  private userProfiles: Map<string, UserInterestProfile> = new Map()
  private contentSimilarities: Map<string, ContentSimilarity[]> = new Map()
  private strategies: RecommendationStrategy[] = []
  private isInitialized = false

  private constructor() {
    this.userAnalyticsService = UserAnalyticsService.getInstance()
    this.contentPerformanceService = ContentPerformanceService.getInstance()
    this.contentCategoryService = ContentCategoryService.getInstance()
  }

  static getInstance(): ContentRecommendationService {
    if (!ContentRecommendationService.instance) {
      ContentRecommendationService.instance = new ContentRecommendationService()
    }
    return ContentRecommendationService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.userAnalyticsService.initialize()
      await this.contentPerformanceService.initialize()
      await this.contentCategoryService.initialize()
      
      await this.loadRecommendationStrategies()
      await this.buildContentSimilarityMatrix()
      this.startProfileUpdater()
      
      this.isInitialized = true
      console.log('✅ ContentRecommendationService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ContentRecommendationService:', error)
      throw error
    }
  }

  /**
   * 获取用户推荐内容
   */
  async getRecommendations(
    userId: string,
    context: Partial<RecommendationContext> = {},
    limit = 10
  ): Promise<RecommendationResult> {
    if (!this.isInitialized) await this.initialize()

    const userProfile = await this.getUserInterestProfile(userId)
    const fullContext: RecommendationContext = {
      userSession: crypto.randomUUID(),
      deviceType: 'desktop',
      timeOfDay: this.getTimeOfDay(),
      ...context
    }

    const recommendations: RecommendedContent[] = []

    // 应用各种推荐策略
    for (const strategy of this.strategies.filter(s => s.enabled)) {
      const strategyRecommendations = await this.applyStrategy(strategy, userProfile, fullContext)
      recommendations.push(...strategyRecommendations)
    }

    // 去重和排序
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations)
    const sortedRecommendations = this.sortRecommendations(uniqueRecommendations, userProfile)
    const finalRecommendations = sortedRecommendations.slice(0, limit)

    // 记录推荐事件
    await this.trackRecommendationEvent(userId, finalRecommendations, fullContext)

    return {
      userId,
      recommendations: finalRecommendations,
      strategies: this.strategies.filter(s => s.enabled),
      generatedAt: new Date(),
      context: fullContext
    }
  }

  /**
   * 获取相似内容推荐
   */
  async getSimilarContent(contentId: string, limit = 5): Promise<RecommendedContent[]> {
    if (!this.isInitialized) await this.initialize()

    const similarities = this.contentSimilarities.get(contentId) || []
    const sortedSimilarities = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    const recommendations: RecommendedContent[] = []

    for (const similarity of sortedSimilarities) {
      const relatedContentId = similarity.contentId2
      const content = await this.getContentById(relatedContentId)
      
      if (content) {
        recommendations.push({
          ...content,
          score: similarity.similarity,
          reason: {
            type: 'similar_content',
            description: 'Ähnlicher Inhalt basierend auf Themen und Kategorien',
            factors: similarity.factors.map(f => f.type),
            weight: 1.0
          },
          confidence: similarity.similarity
        })
      }
    }

    return recommendations
  }

  /**
   * 更新用户兴趣档案
   */
  async updateUserInterestProfile(userId: string, contentId: string, interaction: {
    readingTime: number
    completion: number
    engagement: number
    rating?: number
  }): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    let profile = this.userProfiles.get(userId)
    if (!profile) {
      profile = await this.createUserInterestProfile(userId)
    }

    // 添加阅读历史
    profile.readingHistory.push({
      contentId,
      readAt: new Date(),
      readingTime: interaction.readingTime,
      completion: interaction.completion,
      engagement: interaction.engagement,
      rating: interaction.rating
    })

    // 保持历史记录在合理范围内
    if (profile.readingHistory.length > 100) {
      profile.readingHistory = profile.readingHistory.slice(-100)
    }

    // 更新兴趣分数
    await this.updateInterestScores(profile, contentId, interaction)

    profile.lastUpdated = new Date()
    this.userProfiles.set(userId, profile)

    // 异步保存到持久存储
    this.saveUserProfile(profile)
  }

  /**
   * 获取热门内容推荐
   */
  async getTrendingContent(limit = 10): Promise<RecommendedContent[]> {
    if (!this.isInitialized) await this.initialize()

    // 模拟热门内容数据
    const trendingContent: RecommendedContent[] = [
      {
        contentId: 'trending-1',
        title: 'Zinseszins verstehen: Der Schlüssel zum Vermögensaufbau',
        slug: 'zinseszins-verstehen',
        excerpt: 'Erfahren Sie, wie der Zinseszinseffekt Ihr Vermögen exponentiell wachsen lassen kann.',
        category: 'grundlagen',
        tags: ['Zinseszins', 'Vermögensaufbau', 'Grundlagen'],
        publishedAt: new Date('2024-12-01'),
        score: 0.95,
        reason: {
          type: 'trending',
          description: 'Aktuell sehr beliebter Inhalt mit hoher Engagement-Rate',
          factors: ['hohe Klickrate', 'viele Shares', 'positive Bewertungen'],
          weight: 0.9
        },
        confidence: 0.92,
        readingTime: 8,
        difficulty: 'anfänger',
        popularity: 0.95,
        engagement: 0.88
      },
      {
        contentId: 'trending-2',
        title: 'ETF-Sparplan: Passiv investieren für Anfänger',
        slug: 'etf-sparplan-anfaenger',
        excerpt: 'Wie Sie mit ETF-Sparplänen langfristig und kostengünstig Vermögen aufbauen.',
        category: 'strategien',
        tags: ['ETF', 'Sparplan', 'Passiv investieren'],
        publishedAt: new Date('2024-11-28'),
        score: 0.89,
        reason: {
          type: 'trending',
          description: 'Steigendes Interesse an passiven Anlagestrategien',
          factors: ['wachsende Suchanfragen', 'hohe Verweildauer'],
          weight: 0.85
        },
        confidence: 0.87,
        readingTime: 12,
        difficulty: 'anfänger',
        popularity: 0.89,
        engagement: 0.82
      }
    ]

    return trendingContent.slice(0, limit)
  }

  /**
   * 跟踪推荐点击
   */
  async trackRecommendationClick(
    userId: string,
    contentId: string,
    recommendationReason: string,
    position: number
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    await this.userAnalyticsService.trackEvent('recommendation_click', {
      contentId,
      reason: recommendationReason,
      position,
      timestamp: new Date()
    })

    // 更新策略性能指标
    await this.updateStrategyPerformance(recommendationReason, 'click')
  }

  // 私有方法
  private async loadRecommendationStrategies(): Promise<void> {
    this.strategies = [
      {
        strategyId: 'collaborative-filtering',
        name: 'Kollaborative Filterung',
        description: 'Empfehlungen basierend auf ähnlichen Nutzern',
        weight: 0.3,
        enabled: true,
        parameters: {
          minSimilarUsers: 5,
          maxRecommendations: 5
        },
        clickThroughRate: 0.12,
        conversionRate: 0.08,
        userSatisfaction: 0.75
      },
      {
        strategyId: 'content-based',
        name: 'Inhaltsbasierte Filterung',
        description: 'Empfehlungen basierend auf Inhaltsähnlichkeit',
        weight: 0.25,
        enabled: true,
        parameters: {
          similarityThreshold: 0.6,
          maxRecommendations: 4
        },
        clickThroughRate: 0.15,
        conversionRate: 0.10,
        userSatisfaction: 0.78
      },
      {
        strategyId: 'popularity-based',
        name: 'Popularitätsbasiert',
        description: 'Empfehlungen basierend auf allgemeiner Beliebtheit',
        weight: 0.2,
        enabled: true,
        parameters: {
          timeWindow: 30, // Tage
          minViews: 100
        },
        clickThroughRate: 0.18,
        conversionRate: 0.06,
        userSatisfaction: 0.65
      },
      {
        strategyId: 'category-based',
        name: 'Kategoriebasiert',
        description: 'Empfehlungen basierend auf bevorzugten Kategorien',
        weight: 0.15,
        enabled: true,
        parameters: {
          maxCategoriesPerUser: 3,
          categoryBoost: 1.5
        },
        clickThroughRate: 0.14,
        conversionRate: 0.09,
        userSatisfaction: 0.72
      },
      {
        strategyId: 'trending',
        name: 'Trending Inhalte',
        description: 'Aktuell beliebte und diskutierte Inhalte',
        weight: 0.1,
        enabled: true,
        parameters: {
          trendingWindow: 7, // Tage
          minEngagement: 0.05
        },
        clickThroughRate: 0.22,
        conversionRate: 0.04,
        userSatisfaction: 0.68
      }
    ]
  }

  private async buildContentSimilarityMatrix(): Promise<void> {
    // 简化实现：构建内容相似性矩阵
    const mockSimilarities = new Map<string, ContentSimilarity[]>()
    
    // 模拟一些相似性数据
    mockSimilarities.set('article-1', [
      {
        contentId1: 'article-1',
        contentId2: 'article-2',
        similarity: 0.85,
        factors: [
          { type: 'category', score: 0.9, weight: 0.3 },
          { type: 'tags', score: 0.8, weight: 0.4 },
          { type: 'keywords', score: 0.85, weight: 0.3 }
        ]
      }
    ])

    this.contentSimilarities = mockSimilarities
  }

  private async getUserInterestProfile(userId: string): Promise<UserInterestProfile> {
    let profile = this.userProfiles.get(userId)
    
    if (!profile) {
      profile = await this.createUserInterestProfile(userId)
      this.userProfiles.set(userId, profile)
    }

    return profile
  }

  private async createUserInterestProfile(userId: string): Promise<UserInterestProfile> {
    return {
      userId,
      interests: [
        { category: 'grundlagen', score: 0.5, confidence: 0.3, recentActivity: 0.2, trendDirection: 'stable' },
        { category: 'strategien', score: 0.3, confidence: 0.2, recentActivity: 0.1, trendDirection: 'stable' }
      ],
      readingHistory: [],
      preferences: {
        preferredCategories: [],
        preferredDifficulty: ['anfänger'],
        preferredLength: 'medium',
        preferredTime: 'any',
        avoidCategories: []
      },
      lastUpdated: new Date()
    }
  }

  private async applyStrategy(
    strategy: RecommendationStrategy,
    userProfile: UserInterestProfile,
    context: RecommendationContext
  ): Promise<RecommendedContent[]> {
    const recommendations: RecommendedContent[] = []

    switch (strategy.strategyId) {
      case 'collaborative-filtering':
        recommendations.push(...await this.getCollaborativeRecommendations(userProfile, strategy))
        break
      case 'content-based':
        recommendations.push(...await this.getContentBasedRecommendations(userProfile, strategy))
        break
      case 'popularity-based':
        recommendations.push(...await this.getPopularityBasedRecommendations(strategy))
        break
      case 'category-based':
        recommendations.push(...await this.getCategoryBasedRecommendations(userProfile, strategy))
        break
      case 'trending':
        recommendations.push(...await this.getTrendingContent(strategy.parameters.maxRecommendations || 3))
        break
    }

    // 应用策略权重
    return recommendations.map(rec => ({
      ...rec,
      score: rec.score * strategy.weight,
      reason: {
        ...rec.reason,
        weight: strategy.weight
      }
    }))
  }

  private async getCollaborativeRecommendations(
    userProfile: UserInterestProfile,
    strategy: RecommendationStrategy
  ): Promise<RecommendedContent[]> {
    // 简化的协同过滤实现
    return []
  }

  private async getContentBasedRecommendations(
    userProfile: UserInterestProfile,
    strategy: RecommendationStrategy
  ): Promise<RecommendedContent[]> {
    const recommendations: RecommendedContent[] = []
    
    // 基于用户阅读历史推荐相似内容
    for (const historyItem of userProfile.readingHistory.slice(-5)) {
      const similarContent = await this.getSimilarContent(historyItem.contentId, 2)
      recommendations.push(...similarContent)
    }

    return recommendations
  }

  private async getPopularityBasedRecommendations(
    strategy: RecommendationStrategy
  ): Promise<RecommendedContent[]> {
    return await this.getTrendingContent(strategy.parameters.maxRecommendations || 3)
  }

  private async getCategoryBasedRecommendations(
    userProfile: UserInterestProfile,
    strategy: RecommendationStrategy
  ): Promise<RecommendedContent[]> {
    const recommendations: RecommendedContent[] = []
    
    // 基于用户兴趣分类推荐
    const topInterests = userProfile.interests
      .sort((a, b) => b.score - a.score)
      .slice(0, strategy.parameters.maxCategoriesPerUser || 3)

    for (const interest of topInterests) {
      // 模拟分类推荐
      recommendations.push({
        contentId: `category-${interest.category}-1`,
        title: `${interest.category} Empfehlung`,
        slug: `${interest.category}-empfehlung`,
        excerpt: `Empfohlener Inhalt aus der Kategorie ${interest.category}`,
        category: interest.category,
        tags: [interest.category],
        publishedAt: new Date(),
        score: interest.score * (strategy.parameters.categoryBoost || 1),
        reason: {
          type: 'category_based',
          description: `Basierend auf Ihrem Interesse an ${interest.category}`,
          factors: ['Nutzerinteresse', 'Kategorieaffinität'],
          weight: strategy.weight
        },
        confidence: interest.confidence,
        readingTime: 10,
        difficulty: 'mittel',
        popularity: 0.7,
        engagement: 0.6
      })
    }

    return recommendations
  }

  private deduplicateRecommendations(recommendations: RecommendedContent[]): RecommendedContent[] {
    const seen = new Set<string>()
    return recommendations.filter(rec => {
      if (seen.has(rec.contentId)) {
        return false
      }
      seen.add(rec.contentId)
      return true
    })
  }

  private sortRecommendations(
    recommendations: RecommendedContent[],
    userProfile: UserInterestProfile
  ): RecommendedContent[] {
    return recommendations.sort((a, b) => {
      // 综合评分：推荐分数 + 置信度 + 个性化调整
      const scoreA = a.score * 0.6 + a.confidence * 0.3 + this.getPersonalizationBoost(a, userProfile) * 0.1
      const scoreB = b.score * 0.6 + b.confidence * 0.3 + this.getPersonalizationBoost(b, userProfile) * 0.1
      
      return scoreB - scoreA
    })
  }

  private getPersonalizationBoost(content: RecommendedContent, userProfile: UserInterestProfile): number {
    // 基于用户偏好的个性化加分
    let boost = 0

    // 偏好分类加分
    if (userProfile.preferences.preferredCategories.includes(content.category)) {
      boost += 0.2
    }

    // 偏好难度加分
    if (userProfile.preferences.preferredDifficulty.includes(content.difficulty)) {
      boost += 0.1
    }

    // 避免分类减分
    if (userProfile.preferences.avoidCategories.includes(content.category)) {
      boost -= 0.3
    }

    return Math.max(0, Math.min(1, boost))
  }

  private async updateInterestScores(
    profile: UserInterestProfile,
    contentId: string,
    interaction: { readingTime: number; completion: number; engagement: number }
  ): Promise<void> {
    const content = await this.getContentById(contentId)
    if (!content) return

    // 找到或创建兴趣分类
    let interest = profile.interests.find(i => i.category === content.category)
    if (!interest) {
      interest = {
        category: content.category,
        score: 0,
        confidence: 0,
        recentActivity: 0,
        trendDirection: 'stable'
      }
      profile.interests.push(interest)
    }

    // 基于交互质量更新兴趣分数
    const interactionQuality = (interaction.completion * 0.4 + interaction.engagement * 0.6)
    const learningRate = 0.1
    
    interest.score = interest.score * (1 - learningRate) + interactionQuality * learningRate
    interest.confidence = Math.min(1, interest.confidence + 0.05)
    interest.recentActivity = Math.min(1, interest.recentActivity + 0.1)
  }

  private async getContentById(contentId: string): Promise<RecommendedContent | null> {
    // 简化实现：返回模拟内容
    return {
      contentId,
      title: 'Sample Content',
      slug: 'sample-content',
      excerpt: 'Sample excerpt',
      category: 'grundlagen',
      tags: ['sample'],
      publishedAt: new Date(),
      score: 0.5,
      reason: {
        type: 'similar_content',
        description: 'Sample reason',
        factors: [],
        weight: 1
      },
      confidence: 0.5,
      readingTime: 5,
      difficulty: 'anfänger',
      popularity: 0.5,
      engagement: 0.5
    }
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }

  private async trackRecommendationEvent(
    userId: string,
    recommendations: RecommendedContent[],
    context: RecommendationContext
  ): Promise<void> {
    await this.userAnalyticsService.trackEvent('recommendations_shown', {
      recommendationCount: recommendations.length,
      strategies: recommendations.map(r => r.reason.type),
      context
    })
  }

  private async updateStrategyPerformance(strategy: string, eventType: string): Promise<void> {
    // 更新策略性能指标
    const strategyObj = this.strategies.find(s => s.strategyId === strategy)
    if (strategyObj && eventType === 'click') {
      strategyObj.clickThroughRate += 0.001 // 简化更新
    }
  }

  private async saveUserProfile(profile: UserInterestProfile): Promise<void> {
    // 简化实现：保存到localStorage
    try {
      const profiles = JSON.parse(localStorage.getItem('user_profiles') || '{}')
      profiles[profile.userId] = profile
      localStorage.setItem('user_profiles', JSON.stringify(profiles))
    } catch (error) {
      console.error('Failed to save user profile:', error)
    }
  }

  private startProfileUpdater(): void {
    // 每小时更新用户档案
    setInterval(() => {
      for (const [userId, profile] of this.userProfiles) {
        // 衰减旧的活动分数
        profile.interests.forEach(interest => {
          interest.recentActivity *= 0.95
        })
      }
    }, 60 * 60 * 1000) // 1小时
  }
}

// Export singleton instance
export const contentRecommendationService = ContentRecommendationService.getInstance()
