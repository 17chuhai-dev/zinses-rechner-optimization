/**
 * 专业网络服务 - LinkedIn/XING德国专业网络集成
 * 扩展现有社交分享功能，实现专业内容自动发布和网络扩展
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { ShareService } from './shareService'
import type { Article } from './ContentManagementService'

// 社交内容接口
export interface SocialContent {
  title: string
  content: string
  url: string
  imageUrl?: string
  hashtags: string[]
  category: 'financial_tip' | 'calculator_result' | 'educational_content' | 'market_insight'
  targetAudience: 'professionals' | 'general' | 'students' | 'retirees'
  language: 'de' | 'en'
}

// 发布结果接口
export interface PublishResult {
  platform: 'linkedin' | 'xing'
  postId: string
  url: string
  publishedAt: Date
  status: 'published' | 'scheduled' | 'failed'
  engagement?: EngagementMetrics
  error?: string
}

// 参与度指标
export interface EngagementMetrics {
  likes: number
  comments: number
  shares: number
  views: number
  clickThroughRate: number
  engagementRate: number
  lastUpdated: Date
}

// 发布调度
export interface PublishSchedule {
  id: string
  content: SocialContent
  platforms: ('linkedin' | 'xing')[]
  scheduledTime: Date
  timezone: string
  status: 'pending' | 'published' | 'failed' | 'cancelled'
  retryCount: number
  lastAttempt?: Date
}

// LinkedIn API配置
export interface LinkedInConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
}

// XING API配置
export interface XINGConfig {
  consumerKey: string
  consumerSecret: string
  accessToken?: string
  accessTokenSecret?: string
}

// 平台特定内容格式
export interface PlatformContent {
  linkedin: {
    text: string
    title?: string
    description?: string
    shareMediaCategory: 'NONE' | 'ARTICLE' | 'IMAGE'
    media?: {
      status: 'READY'
      description: {
        text: string
      }
      media: string
      title: {
        text: string
      }
    }
  }
  xing: {
    text: string
    url?: string
    image?: string
  }
}

/**
 * 专业网络服务类
 */
export class ProfessionalNetworkService {
  private static instance: ProfessionalNetworkService
  private shareService: ShareService
  private schedules: PublishSchedule[] = []
  private isInitialized = false

  // API配置
  private linkedinConfig: LinkedInConfig = {
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET || '',
    redirectUri: `${window.location.origin}/auth/linkedin/callback`,
    scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social']
  }

  private xingConfig: XINGConfig = {
    consumerKey: import.meta.env.VITE_XING_CONSUMER_KEY || '',
    consumerSecret: import.meta.env.VITE_XING_CONSUMER_SECRET || ''
  }

  private constructor() {
    this.shareService = ShareService.getInstance()
  }

  static getInstance(): ProfessionalNetworkService {
    if (!ProfessionalNetworkService.instance) {
      ProfessionalNetworkService.instance = new ProfessionalNetworkService()
    }
    return ProfessionalNetworkService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.loadStoredTokens()
      this.startScheduleProcessor()
      this.isInitialized = true
      console.log('✅ ProfessionalNetworkService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ProfessionalNetworkService:', error)
      throw error
    }
  }

  /**
   * LinkedIn OAuth认证
   */
  async authenticateLinkedIn(): Promise<string> {
    const state = crypto.randomUUID()
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')

    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', this.linkedinConfig.clientId)
    authUrl.searchParams.set('redirect_uri', this.linkedinConfig.redirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('scope', this.linkedinConfig.scope.join(' '))

    // 存储state用于验证
    localStorage.setItem('linkedin_oauth_state', state)

    return authUrl.toString()
  }

  /**
   * 处理LinkedIn OAuth回调
   */
  async handleLinkedInCallback(code: string, state: string): Promise<void> {
    const storedState = localStorage.getItem('linkedin_oauth_state')
    if (state !== storedState) {
      throw new Error('Invalid OAuth state')
    }

    try {
      const tokenResponse = await this.exchangeLinkedInCode(code)
      this.linkedinConfig.accessToken = tokenResponse.access_token
      this.linkedinConfig.expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

      await this.storeTokens()
      localStorage.removeItem('linkedin_oauth_state')

      console.log('✅ LinkedIn authentication successful')
    } catch (error) {
      console.error('❌ LinkedIn authentication failed:', error)
      throw error
    }
  }

  /**
   * 发布到LinkedIn
   */
  async publishToLinkedIn(content: SocialContent): Promise<PublishResult> {
    if (!this.isInitialized) await this.initialize()

    if (!this.linkedinConfig.accessToken) {
      throw new Error('LinkedIn not authenticated')
    }

    try {
      const platformContent = this.formatContentForLinkedIn(content)
      const response = await this.makeLinkedInAPICall('/v2/ugcPosts', 'POST', platformContent)

      return {
        platform: 'linkedin',
        postId: response.id,
        url: `https://www.linkedin.com/feed/update/${response.id}`,
        publishedAt: new Date(),
        status: 'published'
      }
    } catch (error) {
      console.error('❌ LinkedIn publish failed:', error)
      return {
        platform: 'linkedin',
        postId: '',
        url: '',
        publishedAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 发布到XING
   */
  async publishToXING(content: SocialContent): Promise<PublishResult> {
    if (!this.isInitialized) await this.initialize()

    // XING API集成（简化实现）
    try {
      const platformContent = this.formatContentForXING(content)

      // 模拟XING API调用
      const mockResponse = {
        id: `xing_${Date.now()}`,
        url: `https://www.xing.com/news/posts/${Date.now()}`
      }

      return {
        platform: 'xing',
        postId: mockResponse.id,
        url: mockResponse.url,
        publishedAt: new Date(),
        status: 'published'
      }
    } catch (error) {
      console.error('❌ XING publish failed:', error)
      return {
        platform: 'xing',
        postId: '',
        url: '',
        publishedAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 计划发布
   */
  async schedulePost(
    content: SocialContent,
    platforms: ('linkedin' | 'xing')[],
    scheduledTime: Date
  ): Promise<PublishSchedule> {
    if (!this.isInitialized) await this.initialize()

    const schedule: PublishSchedule = {
      id: crypto.randomUUID(),
      content,
      platforms,
      scheduledTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: 'pending',
      retryCount: 0
    }

    this.schedules.push(schedule)
    await this.saveSchedules()

    console.log(`⏰ Post scheduled for ${scheduledTime.toLocaleString('de-DE')}`)
    return schedule
  }

  /**
   * 跟踪参与度
   */
  async trackEngagement(postId: string, platform: 'linkedin' | 'xing'): Promise<EngagementMetrics> {
    if (!this.isInitialized) await this.initialize()

    try {
      if (platform === 'linkedin') {
        return await this.getLinkedInEngagement(postId)
      } else {
        return await this.getXINGEngagement(postId)
      }
    } catch (error) {
      console.error(`❌ Failed to track engagement for ${platform}:`, error)

      // 返回默认指标
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        clickThroughRate: 0,
        engagementRate: 0,
        lastUpdated: new Date()
      }
    }
  }

  /**
   * 从文章生成社交内容
   */
  generateSocialContentFromArticle(article: Article): SocialContent {
    // 根据文章类别确定内容类型
    let category: SocialContent['category'] = 'educational_content'
    if (article.category === 'tools') category = 'calculator_result'
    else if (article.category === 'news') category = 'market_insight'
    else if (article.category === 'ratgeber') category = 'financial_tip'

    // 根据难度确定目标受众
    let targetAudience: SocialContent['targetAudience'] = 'general'
    if (article.difficulty === 'experte') targetAudience = 'professionals'
    else if (article.difficulty === 'anfänger') targetAudience = 'students'

    // 生成专业化的社交内容
    const content = this.createProfessionalContent(article)

    return {
      title: article.title,
      content,
      url: `https://zinses-rechner.de/artikel/${article.slug}`,
      hashtags: this.generateProfessionalHashtags(article),
      category,
      targetAudience,
      language: 'de'
    }
  }

  /**
   * 获取最佳发布时间建议
   */
  getBestPublishingTimes(): { linkedin: Date[]; xing: Date[] } {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // LinkedIn最佳发布时间（德国时间）
    const linkedinTimes = [
      new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00
      new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00
      new Date(today.getTime() + 17 * 60 * 60 * 1000), // 17:00
    ]

    // XING最佳发布时间（德国时间）
    const xingTimes = [
      new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00
      new Date(today.getTime() + 13 * 60 * 60 * 1000), // 13:00
      new Date(today.getTime() + 18 * 60 * 60 * 1000), // 18:00
    ]

    return { linkedin: linkedinTimes, xing: xingTimes }
  }

  // 私有方法
  private async loadStoredTokens(): Promise<void> {
    try {
      const linkedinToken = localStorage.getItem('linkedin_access_token')
      const linkedinExpiry = localStorage.getItem('linkedin_token_expiry')

      if (linkedinToken && linkedinExpiry) {
        const expiryDate = new Date(linkedinExpiry)
        if (expiryDate > new Date()) {
          this.linkedinConfig.accessToken = linkedinToken
          this.linkedinConfig.expiresAt = expiryDate
        }
      }
    } catch (error) {
      console.error('Failed to load stored tokens:', error)
    }
  }

  private async storeTokens(): Promise<void> {
    try {
      if (this.linkedinConfig.accessToken && this.linkedinConfig.expiresAt) {
        localStorage.setItem('linkedin_access_token', this.linkedinConfig.accessToken)
        localStorage.setItem('linkedin_token_expiry', this.linkedinConfig.expiresAt.toISOString())
      }
    } catch (error) {
      console.error('Failed to store tokens:', error)
    }
  }

  private async exchangeLinkedInCode(code: string): Promise<any> {
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken'
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.linkedinConfig.redirectUri,
      client_id: this.linkedinConfig.clientId,
      client_secret: this.linkedinConfig.clientSecret
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    if (!response.ok) {
      throw new Error(`LinkedIn token exchange failed: ${response.statusText}`)
    }

    return response.json()
  }

  private formatContentForLinkedIn(content: SocialContent): any {
    return {
      author: 'urn:li:person:PERSON_ID', // 需要实际的LinkedIn Person ID
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `${content.content}\n\n${content.hashtags.map(tag => `#${tag}`).join(' ')}`
          },
          shareMediaCategory: content.imageUrl ? 'IMAGE' : 'NONE',
          media: content.imageUrl ? [{
            status: 'READY',
            description: {
              text: content.title
            },
            media: content.imageUrl,
            title: {
              text: content.title
            }
          }] : undefined
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }
  }

  private formatContentForXING(content: SocialContent): any {
    return {
      text: `${content.content}\n\n${content.url}\n\n${content.hashtags.map(tag => `#${tag}`).join(' ')}`,
      url: content.url,
      image: content.imageUrl
    }
  }

  private async makeLinkedInAPICall(endpoint: string, method: string, data?: any): Promise<any> {
    const response = await fetch(`https://api.linkedin.com${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.linkedinConfig.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: data ? JSON.stringify(data) : undefined
    })

    if (!response.ok) {
      throw new Error(`LinkedIn API call failed: ${response.statusText}`)
    }

    return response.json()
  }

  private async getLinkedInEngagement(postId: string): Promise<EngagementMetrics> {
    // 模拟LinkedIn参与度数据
    return {
      likes: Math.floor(Math.random() * 100) + 10,
      comments: Math.floor(Math.random() * 20) + 2,
      shares: Math.floor(Math.random() * 10) + 1,
      views: Math.floor(Math.random() * 1000) + 100,
      clickThroughRate: Math.random() * 0.05 + 0.01, // 1-6%
      engagementRate: Math.random() * 0.1 + 0.02, // 2-12%
      lastUpdated: new Date()
    }
  }

  private async getXINGEngagement(postId: string): Promise<EngagementMetrics> {
    // 模拟XING参与度数据
    return {
      likes: Math.floor(Math.random() * 50) + 5,
      comments: Math.floor(Math.random() * 10) + 1,
      shares: Math.floor(Math.random() * 5) + 1,
      views: Math.floor(Math.random() * 500) + 50,
      clickThroughRate: Math.random() * 0.04 + 0.01, // 1-5%
      engagementRate: Math.random() * 0.08 + 0.02, // 2-10%
      lastUpdated: new Date()
    }
  }

  private createProfessionalContent(article: Article): string {
    const templates = {
      financial_tip: `💡 Finanztipp: ${article.title}\n\n${article.excerpt}\n\nErfahren Sie mehr über bewährte Strategien für Ihre finanzielle Zukunft.`,
      educational_content: `📚 Finanzwissen: ${article.title}\n\n${article.excerpt}\n\nVertiefen Sie Ihr Verständnis für wichtige Finanzkonzepte.`,
      calculator_result: `🧮 Neue Berechnung: ${article.title}\n\n${article.excerpt}\n\nNutzen Sie unsere kostenlosen Finanzrechner für Ihre Planung.`,
      market_insight: `📈 Markteinblick: ${article.title}\n\n${article.excerpt}\n\nBleiben Sie über aktuelle Entwicklungen informiert.`
    }

    const category = article.category === 'tools' ? 'calculator_result' :
                    article.category === 'news' ? 'market_insight' :
                    article.category === 'ratgeber' ? 'financial_tip' : 'educational_content'

    return templates[category]
  }

  private generateProfessionalHashtags(article: Article): string[] {
    const baseHashtags = ['Finanzen', 'Geldanlage', 'Deutschland']
    const categoryHashtags = {
      grundlagen: ['Finanzgrundlagen', 'Finanzbildung'],
      strategien: ['Anlagestrategie', 'Vermögensaufbau'],
      steuer: ['Steuern', 'Abgeltungssteuer'],
      tools: ['Finanzrechner', 'FinTech'],
      news: ['Finanznews', 'Marktanalyse'],
      ratgeber: ['Finanztipps', 'Finanzberatung']
    }

    return [
      ...baseHashtags,
      ...categoryHashtags[article.category] || [],
      ...article.tags.slice(0, 2)
    ].slice(0, 8) // LinkedIn建议最多8个hashtag
  }

  private startScheduleProcessor(): void {
    // 每分钟检查计划发布
    setInterval(async () => {
      await this.processScheduledPosts()
    }, 60000)
  }

  private async processScheduledPosts(): Promise<void> {
    const now = new Date()
    const pendingSchedules = this.schedules.filter(s =>
      s.status === 'pending' && s.scheduledTime <= now
    )

    for (const schedule of pendingSchedules) {
      try {
        const results: PublishResult[] = []

        for (const platform of schedule.platforms) {
          if (platform === 'linkedin') {
            const result = await this.publishToLinkedIn(schedule.content)
            results.push(result)
          } else if (platform === 'xing') {
            const result = await this.publishToXING(schedule.content)
            results.push(result)
          }
        }

        const allSuccessful = results.every(r => r.status === 'published')
        schedule.status = allSuccessful ? 'published' : 'failed'

        console.log(`✅ Scheduled post processed: ${schedule.id}`)
      } catch (error) {
        schedule.status = 'failed'
        schedule.retryCount++
        schedule.lastAttempt = now

        console.error(`❌ Scheduled post failed: ${schedule.id}`, error)
      }
    }

    if (pendingSchedules.length > 0) {
      await this.saveSchedules()
    }
  }

  private async saveSchedules(): Promise<void> {
    try {
      localStorage.setItem('professional_network_schedules', JSON.stringify(this.schedules))
    } catch (error) {
      console.error('Failed to save schedules:', error)
    }
  }
}

// Export singleton instance
export const professionalNetworkService = ProfessionalNetworkService.getInstance()
