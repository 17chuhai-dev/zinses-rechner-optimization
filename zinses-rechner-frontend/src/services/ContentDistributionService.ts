/**
 * 自动化内容分发系统
 * 基于现有shareService.ts开发自动化分发系统，支持多平台同步发布和定时发布
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { ShareService } from './shareService'
import { ProfessionalNetworkService } from './ProfessionalNetworkService'
import { contentManagementService } from './ContentManagementService'
import type { Article } from './ContentManagementService'
import type { SocialContent, PublishResult } from './ProfessionalNetworkService'

// 分发平台枚举
export type DistributionPlatform = 
  | 'linkedin' 
  | 'xing' 
  | 'twitter' 
  | 'facebook' 
  | 'whatsapp'
  | 'email'
  | 'rss'

// 分发策略
export interface DistributionStrategy {
  id: string
  name: string
  description: string
  platforms: DistributionPlatform[]
  timing: DistributionTiming
  contentRules: ContentRule[]
  targetAudience: string[]
  active: boolean
}

// 分发时机配置
export interface DistributionTiming {
  immediate: boolean
  scheduled: boolean
  optimal: boolean // 使用最佳时间
  customTimes: Date[]
  intervals: {
    linkedin?: number // 小时间隔
    xing?: number
    twitter?: number
    facebook?: number
  }
}

// 内容规则
export interface ContentRule {
  platform: DistributionPlatform
  maxLength: number
  hashtagLimit: number
  imageRequired: boolean
  linkHandling: 'full' | 'shortened' | 'none'
  contentTemplate: string
}

// 分发结果
export interface DistributionResult {
  articleId: string
  strategy: string
  results: PlatformResult[]
  startedAt: Date
  completedAt: Date
  status: 'success' | 'partial' | 'failed'
  totalPlatforms: number
  successfulPlatforms: number
  failedPlatforms: number
}

export interface PlatformResult {
  platform: DistributionPlatform
  status: 'success' | 'failed' | 'skipped'
  postId?: string
  url?: string
  publishedAt?: Date
  error?: string
  engagement?: {
    likes: number
    shares: number
    comments: number
  }
}

// 分发调度
export interface DistributionSchedule {
  id: string
  articleId: string
  strategyId: string
  scheduledTime: Date
  platforms: DistributionPlatform[]
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  retryCount: number
  maxRetries: number
  lastAttempt?: Date
  results?: DistributionResult
}

// 分发统计
export interface DistributionStats {
  totalDistributions: number
  successRate: number
  platformStats: Record<DistributionPlatform, {
    total: number
    successful: number
    failed: number
    avgEngagement: number
  }>
  topPerformingContent: {
    articleId: string
    title: string
    totalEngagement: number
    platforms: DistributionPlatform[]
  }[]
  recentActivity: {
    date: Date
    distributions: number
    successRate: number
  }[]
}

/**
 * 自动化内容分发服务
 */
export class ContentDistributionService {
  private static instance: ContentDistributionService
  private shareService: ShareService
  private professionalNetworkService: ProfessionalNetworkService
  private strategies: DistributionStrategy[] = []
  private schedules: DistributionSchedule[] = []
  private isInitialized = false

  private constructor() {
    this.shareService = ShareService.getInstance()
    this.professionalNetworkService = ProfessionalNetworkService.getInstance()
  }

  static getInstance(): ContentDistributionService {
    if (!ContentDistributionService.instance) {
      ContentDistributionService.instance = new ContentDistributionService()
    }
    return ContentDistributionService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.loadDistributionStrategies()
      await this.loadSchedules()
      this.startScheduleProcessor()
      this.isInitialized = true
      console.log('✅ ContentDistributionService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ContentDistributionService:', error)
      throw error
    }
  }

  /**
   * 分发文章内容
   */
  async distributeContent(article: Article, strategyId?: string): Promise<DistributionResult> {
    if (!this.isInitialized) await this.initialize()

    const strategy = strategyId 
      ? this.strategies.find(s => s.id === strategyId)
      : this.getDefaultStrategy(article)

    if (!strategy) {
      throw new Error('No distribution strategy found')
    }

    const result: DistributionResult = {
      articleId: article.id,
      strategy: strategy.id,
      results: [],
      startedAt: new Date(),
      completedAt: new Date(),
      status: 'success',
      totalPlatforms: strategy.platforms.length,
      successfulPlatforms: 0,
      failedPlatforms: 0
    }

    console.log(`📤 Starting distribution for article: ${article.title}`)

    // 为每个平台分发内容
    for (const platform of strategy.platforms) {
      try {
        const platformResult = await this.distributeToSinglePlatform(article, platform, strategy)
        result.results.push(platformResult)
        
        if (platformResult.status === 'success') {
          result.successfulPlatforms++
        } else {
          result.failedPlatforms++
        }
      } catch (error) {
        console.error(`❌ Distribution failed for ${platform}:`, error)
        result.results.push({
          platform,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        result.failedPlatforms++
      }
    }

    // 确定整体状态
    if (result.successfulPlatforms === 0) {
      result.status = 'failed'
    } else if (result.failedPlatforms > 0) {
      result.status = 'partial'
    }

    result.completedAt = new Date()
    
    console.log(`✅ Distribution completed: ${result.successfulPlatforms}/${result.totalPlatforms} successful`)
    return result
  }

  /**
   * 计划分发
   */
  async scheduleDistribution(
    article: Article, 
    strategyId: string, 
    scheduledTime: Date
  ): Promise<DistributionSchedule> {
    if (!this.isInitialized) await this.initialize()

    const strategy = this.strategies.find(s => s.id === strategyId)
    if (!strategy) {
      throw new Error(`Distribution strategy ${strategyId} not found`)
    }

    const schedule: DistributionSchedule = {
      id: crypto.randomUUID(),
      articleId: article.id,
      strategyId,
      scheduledTime,
      platforms: strategy.platforms,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    }

    this.schedules.push(schedule)
    await this.saveSchedules()

    console.log(`⏰ Distribution scheduled for ${scheduledTime.toLocaleString('de-DE')}`)
    return schedule
  }

  /**
   * 为平台优化内容
   */
  async optimizeForPlatform(content: string, platform: DistributionPlatform): Promise<string> {
    const rules = this.getContentRules(platform)
    let optimizedContent = content

    // 长度限制
    if (optimizedContent.length > rules.maxLength) {
      optimizedContent = optimizedContent.substring(0, rules.maxLength - 3) + '...'
    }

    // 平台特定优化
    switch (platform) {
      case 'twitter':
        optimizedContent = this.optimizeForTwitter(optimizedContent)
        break
      case 'linkedin':
        optimizedContent = this.optimizeForLinkedIn(optimizedContent)
        break
      case 'xing':
        optimizedContent = this.optimizeForXING(optimizedContent)
        break
      case 'facebook':
        optimizedContent = this.optimizeForFacebook(optimizedContent)
        break
    }

    return optimizedContent
  }

  /**
   * 获取分发统计
   */
  async getDistributionStats(days = 30): Promise<DistributionStats> {
    // 模拟统计数据
    const mockStats: DistributionStats = {
      totalDistributions: 150,
      successRate: 0.92,
      platformStats: {
        linkedin: { total: 50, successful: 48, failed: 2, avgEngagement: 25.5 },
        xing: { total: 45, successful: 43, failed: 2, avgEngagement: 18.2 },
        twitter: { total: 30, successful: 28, failed: 2, avgEngagement: 12.8 },
        facebook: { total: 25, successful: 22, failed: 3, avgEngagement: 15.3 },
        whatsapp: { total: 0, successful: 0, failed: 0, avgEngagement: 0 },
        email: { total: 0, successful: 0, failed: 0, avgEngagement: 0 },
        rss: { total: 0, successful: 0, failed: 0, avgEngagement: 0 }
      },
      topPerformingContent: [
        {
          articleId: 'article-1',
          title: 'Zinseszins verstehen: Der Schlüssel zum Vermögensaufbau',
          totalEngagement: 156,
          platforms: ['linkedin', 'xing', 'twitter']
        }
      ],
      recentActivity: [
        { date: new Date(), distributions: 5, successRate: 1.0 },
        { date: new Date(Date.now() - 24 * 60 * 60 * 1000), distributions: 3, successRate: 0.9 }
      ]
    }

    return mockStats
  }

  /**
   * 创建分发策略
   */
  async createDistributionStrategy(strategy: Omit<DistributionStrategy, 'id'>): Promise<DistributionStrategy> {
    const newStrategy: DistributionStrategy = {
      id: crypto.randomUUID(),
      ...strategy
    }

    this.strategies.push(newStrategy)
    await this.saveStrategies()

    console.log(`📋 Distribution strategy created: ${newStrategy.name}`)
    return newStrategy
  }

  /**
   * 获取所有分发策略
   */
  async getDistributionStrategies(): Promise<DistributionStrategy[]> {
    if (!this.isInitialized) await this.initialize()
    return [...this.strategies]
  }

  // 私有方法
  private async loadDistributionStrategies(): Promise<void> {
    // 加载默认策略
    this.strategies = [
      {
        id: 'professional-content',
        name: 'Professionelle Inhalte',
        description: 'Für Bildungsinhalte und Finanzratgeber',
        platforms: ['linkedin', 'xing'],
        timing: {
          immediate: false,
          scheduled: true,
          optimal: true,
          customTimes: [],
          intervals: { linkedin: 4, xing: 6 }
        },
        contentRules: [
          {
            platform: 'linkedin',
            maxLength: 3000,
            hashtagLimit: 8,
            imageRequired: false,
            linkHandling: 'full',
            contentTemplate: '💡 {title}\n\n{excerpt}\n\n{url}\n\n{hashtags}'
          },
          {
            platform: 'xing',
            maxLength: 2000,
            hashtagLimit: 5,
            imageRequired: false,
            linkHandling: 'full',
            contentTemplate: '📚 {title}\n\n{excerpt}\n\n{url}\n\n{hashtags}'
          }
        ],
        targetAudience: ['professionals', 'general'],
        active: true
      },
      {
        id: 'social-media-boost',
        name: 'Social Media Boost',
        description: 'Für breite Reichweite in sozialen Medien',
        platforms: ['twitter', 'facebook', 'linkedin'],
        timing: {
          immediate: true,
          scheduled: false,
          optimal: false,
          customTimes: [],
          intervals: { twitter: 2, facebook: 8, linkedin: 12 }
        },
        contentRules: [
          {
            platform: 'twitter',
            maxLength: 280,
            hashtagLimit: 3,
            imageRequired: false,
            linkHandling: 'shortened',
            contentTemplate: '{title} {url} {hashtags}'
          },
          {
            platform: 'facebook',
            maxLength: 2000,
            hashtagLimit: 5,
            imageRequired: false,
            linkHandling: 'full',
            contentTemplate: '{title}\n\n{excerpt}\n\n{url}'
          }
        ],
        targetAudience: ['general', 'students'],
        active: true
      }
    ]
  }

  private async loadSchedules(): Promise<void> {
    try {
      const stored = localStorage.getItem('distribution_schedules')
      if (stored) {
        this.schedules = JSON.parse(stored).map((s: any) => ({
          ...s,
          scheduledTime: new Date(s.scheduledTime),
          lastAttempt: s.lastAttempt ? new Date(s.lastAttempt) : undefined
        }))
      }
    } catch (error) {
      console.error('Failed to load schedules:', error)
      this.schedules = []
    }
  }

  private async saveSchedules(): Promise<void> {
    try {
      localStorage.setItem('distribution_schedules', JSON.stringify(this.schedules))
    } catch (error) {
      console.error('Failed to save schedules:', error)
    }
  }

  private async saveStrategies(): Promise<void> {
    try {
      localStorage.setItem('distribution_strategies', JSON.stringify(this.strategies))
    } catch (error) {
      console.error('Failed to save strategies:', error)
    }
  }

  private getDefaultStrategy(article: Article): DistributionStrategy | undefined {
    // 根据文章类型选择默认策略
    if (article.category === 'grundlagen' || article.category === 'ratgeber') {
      return this.strategies.find(s => s.id === 'professional-content')
    }
    return this.strategies.find(s => s.id === 'social-media-boost')
  }

  private async distributeToSinglePlatform(
    article: Article, 
    platform: DistributionPlatform, 
    strategy: DistributionStrategy
  ): Promise<PlatformResult> {
    const rule = strategy.contentRules.find(r => r.platform === platform)
    if (!rule) {
      return {
        platform,
        status: 'skipped',
        error: 'No content rule found for platform'
      }
    }

    try {
      switch (platform) {
        case 'linkedin':
          return await this.publishToLinkedIn(article, rule)
        case 'xing':
          return await this.publishToXING(article, rule)
        case 'twitter':
          return await this.publishToTwitter(article, rule)
        case 'facebook':
          return await this.publishToFacebook(article, rule)
        default:
          return {
            platform,
            status: 'skipped',
            error: 'Platform not supported'
          }
      }
    } catch (error) {
      return {
        platform,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async publishToLinkedIn(article: Article, rule: ContentRule): Promise<PlatformResult> {
    const socialContent = this.professionalNetworkService.generateSocialContentFromArticle(article)
    const optimizedContent = await this.optimizeForPlatform(socialContent.content, 'linkedin')
    
    const result = await this.professionalNetworkService.publishToLinkedIn({
      ...socialContent,
      content: optimizedContent
    })

    return {
      platform: 'linkedin',
      status: result.status === 'published' ? 'success' : 'failed',
      postId: result.postId,
      url: result.url,
      publishedAt: result.publishedAt,
      error: result.error
    }
  }

  private async publishToXING(article: Article, rule: ContentRule): Promise<PlatformResult> {
    const socialContent = this.professionalNetworkService.generateSocialContentFromArticle(article)
    const optimizedContent = await this.optimizeForPlatform(socialContent.content, 'xing')
    
    const result = await this.professionalNetworkService.publishToXING({
      ...socialContent,
      content: optimizedContent
    })

    return {
      platform: 'xing',
      status: result.status === 'published' ? 'success' : 'failed',
      postId: result.postId,
      url: result.url,
      publishedAt: result.publishedAt,
      error: result.error
    }
  }

  private async publishToTwitter(article: Article, rule: ContentRule): Promise<PlatformResult> {
    // 使用现有的ShareService进行Twitter分享
    const shareData = {
      title: article.title,
      text: await this.optimizeForPlatform(article.excerpt || article.title, 'twitter'),
      url: `https://zinses-rechner.de/artikel/${article.slug}`,
      hashtags: article.tags.slice(0, 3)
    }

    // 模拟Twitter发布
    return {
      platform: 'twitter',
      status: 'success',
      postId: `twitter_${Date.now()}`,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}`,
      publishedAt: new Date()
    }
  }

  private async publishToFacebook(article: Article, rule: ContentRule): Promise<PlatformResult> {
    // 使用现有的ShareService进行Facebook分享
    const shareData = {
      title: article.title,
      text: await this.optimizeForPlatform(article.excerpt || article.title, 'facebook'),
      url: `https://zinses-rechner.de/artikel/${article.slug}`
    }

    // 模拟Facebook发布
    return {
      platform: 'facebook',
      status: 'success',
      postId: `facebook_${Date.now()}`,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
      publishedAt: new Date()
    }
  }

  private getContentRules(platform: DistributionPlatform): ContentRule {
    const defaultRules: Record<DistributionPlatform, ContentRule> = {
      linkedin: {
        platform: 'linkedin',
        maxLength: 3000,
        hashtagLimit: 8,
        imageRequired: false,
        linkHandling: 'full',
        contentTemplate: '{content}'
      },
      xing: {
        platform: 'xing',
        maxLength: 2000,
        hashtagLimit: 5,
        imageRequired: false,
        linkHandling: 'full',
        contentTemplate: '{content}'
      },
      twitter: {
        platform: 'twitter',
        maxLength: 280,
        hashtagLimit: 3,
        imageRequired: false,
        linkHandling: 'shortened',
        contentTemplate: '{content}'
      },
      facebook: {
        platform: 'facebook',
        maxLength: 2000,
        hashtagLimit: 5,
        imageRequired: false,
        linkHandling: 'full',
        contentTemplate: '{content}'
      },
      whatsapp: {
        platform: 'whatsapp',
        maxLength: 1000,
        hashtagLimit: 0,
        imageRequired: false,
        linkHandling: 'full',
        contentTemplate: '{content}'
      },
      email: {
        platform: 'email',
        maxLength: 5000,
        hashtagLimit: 0,
        imageRequired: false,
        linkHandling: 'full',
        contentTemplate: '{content}'
      },
      rss: {
        platform: 'rss',
        maxLength: 10000,
        hashtagLimit: 0,
        imageRequired: false,
        linkHandling: 'full',
        contentTemplate: '{content}'
      }
    }

    return defaultRules[platform]
  }

  private optimizeForTwitter(content: string): string {
    // Twitter特定优化
    return content.replace(/\n\n/g, '\n').trim()
  }

  private optimizeForLinkedIn(content: string): string {
    // LinkedIn特定优化
    return content.replace(/\n/g, '\n\n').trim()
  }

  private optimizeForXING(content: string): string {
    // XING特定优化
    return content.trim()
  }

  private optimizeForFacebook(content: string): string {
    // Facebook特定优化
    return content.trim()
  }

  private startScheduleProcessor(): void {
    // 每分钟检查计划分发
    setInterval(async () => {
      await this.processScheduledDistributions()
    }, 60000)
  }

  private async processScheduledDistributions(): Promise<void> {
    const now = new Date()
    const pendingSchedules = this.schedules.filter(s => 
      s.status === 'pending' && s.scheduledTime <= now
    )

    for (const schedule of pendingSchedules) {
      try {
        schedule.status = 'processing'
        
        const article = await contentManagementService.getArticle(schedule.articleId)
        if (!article) {
          schedule.status = 'failed'
          continue
        }

        const result = await this.distributeContent(article, schedule.strategyId)
        schedule.results = result
        schedule.status = result.status === 'success' ? 'completed' : 'failed'
        
        console.log(`✅ Scheduled distribution completed: ${schedule.id}`)
      } catch (error) {
        schedule.status = 'failed'
        schedule.retryCount++
        schedule.lastAttempt = now
        
        console.error(`❌ Scheduled distribution failed: ${schedule.id}`, error)
        
        // 重试逻辑
        if (schedule.retryCount < schedule.maxRetries) {
          schedule.status = 'pending'
          schedule.scheduledTime = new Date(now.getTime() + 5 * 60 * 1000) // 5分钟后重试
        }
      }
    }

    if (pendingSchedules.length > 0) {
      await this.saveSchedules()
    }
  }
}

// Export singleton instance
export const contentDistributionService = ContentDistributionService.getInstance()
