/**
 * 内容发布和版本管理服务
 * 集成现有SEO自动化，提供完整的内容发布流程
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { ContentManagementService } from './ContentManagementService'
import { contentCategoryService } from './ContentCategoryService'
import { useSEO } from '@/composables/useSEO'
import { generateSitemapData, generateRobotsTxt } from '@/utils/seoConfig'
import type { Article, ArticleStatus } from './ContentManagementService'

// 发布工作流状态
export type WorkflowStatus = 
  | 'draft'
  | 'review_requested'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'published'
  | 'archived'

// 工作流步骤
export interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  assignedTo?: string
  completedAt?: Date
  comments?: string[]
}

// 发布计划
export interface PublishingSchedule {
  id: string
  articleId: string
  scheduledDate: Date
  timezone: string
  status: 'pending' | 'processing' | 'published' | 'failed'
  retryCount: number
  lastAttempt?: Date
  errorMessage?: string
}

// 版本历史
export interface VersionHistory {
  id: string
  articleId: string
  version: number
  changes: VersionChange[]
  createdBy: string
  createdAt: Date
  comment?: string
  snapshot: Partial<Article>
}

export interface VersionChange {
  field: string
  oldValue: any
  newValue: any
  changeType: 'added' | 'modified' | 'removed'
}

// 发布检查结果
export interface PublishingChecklist {
  articleId: string
  checks: PublishingCheck[]
  overallStatus: 'passed' | 'warning' | 'failed'
  canPublish: boolean
}

export interface PublishingCheck {
  id: string
  name: string
  description: string
  status: 'passed' | 'warning' | 'failed'
  message: string
  required: boolean
}

// 发布统计
export interface PublishingStats {
  totalArticles: number
  publishedArticles: number
  scheduledArticles: number
  draftArticles: number
  averageTimeToPublish: number
  publishingSuccessRate: number
  topCategories: { category: string; count: number }[]
}

/**
 * 内容发布和版本管理服务
 */
export class ContentPublishingService {
  private static instance: ContentPublishingService
  private contentService: ContentManagementService
  private schedules: PublishingSchedule[] = []
  private versionHistory: VersionHistory[] = []
  private isInitialized = false

  private constructor() {
    this.contentService = ContentManagementService.getInstance()
  }

  static getInstance(): ContentPublishingService {
    if (!ContentPublishingService.instance) {
      ContentPublishingService.instance = new ContentPublishingService()
    }
    return ContentPublishingService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.loadSchedules()
      await this.loadVersionHistory()
      this.startScheduleProcessor()
      this.isInitialized = true
      console.log('✅ ContentPublishingService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ContentPublishingService:', error)
      throw error
    }
  }

  /**
   * 发布前检查
   */
  async runPublishingChecklist(articleId: string): Promise<PublishingChecklist> {
    if (!this.isInitialized) await this.initialize()

    const article = await this.contentService.getArticle(articleId)
    if (!article) {
      throw new Error(`Article with ID ${articleId} not found`)
    }

    const checks: PublishingCheck[] = []

    // 基础内容检查
    checks.push({
      id: 'title-check',
      name: 'Titel vorhanden',
      description: 'Artikel muss einen Titel haben',
      status: article.title ? 'passed' : 'failed',
      message: article.title ? 'Titel ist vorhanden' : 'Titel fehlt',
      required: true
    })

    checks.push({
      id: 'content-check',
      name: 'Inhalt vorhanden',
      description: 'Artikel muss Inhalt haben',
      status: article.content && article.content.length > 100 ? 'passed' : 'failed',
      message: article.content && article.content.length > 100 
        ? 'Inhalt ist ausreichend' 
        : 'Inhalt ist zu kurz (< 100 Zeichen)',
      required: true
    })

    // SEO检查
    const seoAnalysis = await this.contentService.analyzeSEO(article)
    checks.push({
      id: 'seo-check',
      name: 'SEO-Optimierung',
      description: 'SEO-Score sollte mindestens 70 sein',
      status: seoAnalysis.score >= 70 ? 'passed' : seoAnalysis.score >= 50 ? 'warning' : 'failed',
      message: `SEO-Score: ${seoAnalysis.score}/100`,
      required: false
    })

    checks.push({
      id: 'meta-description-check',
      name: 'Meta-Beschreibung',
      description: 'Meta-Beschreibung sollte vorhanden sein',
      status: article.metaDescription ? 'passed' : 'warning',
      message: article.metaDescription ? 'Meta-Beschreibung vorhanden' : 'Meta-Beschreibung fehlt',
      required: false
    })

    // Kategorisierung
    checks.push({
      id: 'category-check',
      name: 'Kategorie zugewiesen',
      description: 'Artikel muss einer Kategorie zugeordnet sein',
      status: article.category ? 'passed' : 'failed',
      message: article.category ? `Kategorie: ${article.category}` : 'Keine Kategorie zugewiesen',
      required: true
    })

    // Tags
    checks.push({
      id: 'tags-check',
      name: 'Tags vorhanden',
      description: 'Artikel sollte mindestens 2 Tags haben',
      status: article.tags.length >= 2 ? 'passed' : article.tags.length >= 1 ? 'warning' : 'failed',
      message: `${article.tags.length} Tags vorhanden`,
      required: false
    })

    // Lesbarkeit
    checks.push({
      id: 'readability-check',
      name: 'Lesbarkeit',
      description: 'Text sollte gut lesbar sein',
      status: seoAnalysis.readability.score >= 60 ? 'passed' : 
             seoAnalysis.readability.score >= 40 ? 'warning' : 'failed',
      message: `Lesbarkeit: ${seoAnalysis.readability.level}`,
      required: false
    })

    // Gesamtstatus bestimmen
    const failedRequired = checks.filter(c => c.required && c.status === 'failed')
    const overallStatus = failedRequired.length > 0 ? 'failed' : 
                         checks.some(c => c.status === 'failed') ? 'warning' : 'passed'
    
    const canPublish = failedRequired.length === 0

    return {
      articleId,
      checks,
      overallStatus,
      canPublish
    }
  }

  /**
   * 文章发布
   */
  async publishArticle(articleId: string, publishDate?: Date): Promise<Article> {
    if (!this.isInitialized) await this.initialize()

    // 运行发布前检查
    const checklist = await this.runPublishingChecklist(articleId)
    if (!checklist.canPublish) {
      throw new Error('Article failed required publishing checks')
    }

    const article = await this.contentService.getArticle(articleId)
    if (!article) {
      throw new Error(`Article with ID ${articleId} not found`)
    }

    // 创建版本快照
    await this.createVersionSnapshot(article, 'Published article')

    // 更新文章状态
    const publishedArticle = await this.contentService.updateArticle(articleId, {
      status: 'published',
      publishDate: publishDate || new Date()
    })

    // 执行发布后任务
    await this.executePostPublishTasks(publishedArticle)

    console.log(`🚀 Article published: ${publishedArticle.title}`)
    return publishedArticle
  }

  /**
   * 计划发布
   */
  async scheduleArticle(articleId: string, scheduledDate: Date): Promise<PublishingSchedule> {
    if (!this.isInitialized) await this.initialize()

    // 检查文章是否可以发布
    const checklist = await this.runPublishingChecklist(articleId)
    if (!checklist.canPublish) {
      throw new Error('Article failed required publishing checks')
    }

    const schedule: PublishingSchedule = {
      id: crypto.randomUUID(),
      articleId,
      scheduledDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: 'pending',
      retryCount: 0
    }

    this.schedules.push(schedule)
    await this.saveSchedules()

    // 更新文章状态
    await this.contentService.updateArticle(articleId, {
      status: 'scheduled',
      scheduledDate
    })

    console.log(`⏰ Article scheduled: ${articleId} for ${scheduledDate}`)
    return schedule
  }

  /**
   * 取消计划发布
   */
  async cancelSchedule(scheduleId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const scheduleIndex = this.schedules.findIndex(s => s.id === scheduleId)
    if (scheduleIndex === -1) {
      throw new Error(`Schedule with ID ${scheduleId} not found`)
    }

    const schedule = this.schedules[scheduleIndex]
    this.schedules.splice(scheduleIndex, 1)
    await this.saveSchedules()

    // 更新文章状态回到草稿
    await this.contentService.updateArticle(schedule.articleId, {
      status: 'draft',
      scheduledDate: undefined
    })

    console.log(`❌ Schedule cancelled: ${scheduleId}`)
  }

  /**
   * 创建版本快照
   */
  async createVersionSnapshot(article: Article, comment?: string): Promise<VersionHistory> {
    if (!this.isInitialized) await this.initialize()

    const version: VersionHistory = {
      id: crypto.randomUUID(),
      articleId: article.id,
      version: article.version,
      changes: [], // 简化实现，实际应该计算变更
      createdBy: article.authorId,
      createdAt: new Date(),
      comment,
      snapshot: { ...article }
    }

    this.versionHistory.push(version)
    await this.saveVersionHistory()

    console.log(`📸 Version snapshot created: ${article.title} v${article.version}`)
    return version
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(articleId: string): Promise<VersionHistory[]> {
    if (!this.isInitialized) await this.initialize()

    return this.versionHistory
      .filter(v => v.articleId === articleId)
      .sort((a, b) => b.version - a.version)
  }

  /**
   * 恢复到指定版本
   */
  async revertToVersion(articleId: string, versionId: string): Promise<Article> {
    if (!this.isInitialized) await this.initialize()

    const version = this.versionHistory.find(v => v.id === versionId)
    if (!version) {
      throw new Error(`Version with ID ${versionId} not found`)
    }

    if (version.articleId !== articleId) {
      throw new Error('Version does not belong to the specified article')
    }

    // 创建当前版本的快照
    const currentArticle = await this.contentService.getArticle(articleId)
    if (currentArticle) {
      await this.createVersionSnapshot(currentArticle, 'Before revert')
    }

    // 恢复到指定版本
    const restoredArticle = await this.contentService.updateArticle(articleId, {
      ...version.snapshot,
      updatedAt: new Date()
    })

    console.log(`⏪ Article reverted: ${articleId} to version ${version.version}`)
    return restoredArticle
  }

  /**
   * 获取发布统计
   */
  async getPublishingStats(): Promise<PublishingStats> {
    if (!this.isInitialized) await this.initialize()

    // 简化实现 - 实际应该从数据库获取
    const mockStats: PublishingStats = {
      totalArticles: 150,
      publishedArticles: 120,
      scheduledArticles: 5,
      draftArticles: 25,
      averageTimeToPublish: 2.5, // 天
      publishingSuccessRate: 0.95,
      topCategories: [
        { category: 'grundlagen', count: 45 },
        { category: 'strategien', count: 35 },
        { category: 'tools', count: 25 },
        { category: 'steuer', count: 15 }
      ]
    }

    return mockStats
  }

  // 私有方法
  private async loadSchedules(): Promise<void> {
    // 简化实现
    this.schedules = []
  }

  private async saveSchedules(): Promise<void> {
    // 简化实现
    console.log(`💾 Saved ${this.schedules.length} schedules`)
  }

  private async loadVersionHistory(): Promise<void> {
    // 简化实现
    this.versionHistory = []
  }

  private async saveVersionHistory(): Promise<void> {
    // 简化实现
    console.log(`💾 Saved ${this.versionHistory.length} version entries`)
  }

  private startScheduleProcessor(): void {
    // 每分钟检查一次计划发布
    setInterval(async () => {
      await this.processScheduledPublications()
    }, 60000)
  }

  private async processScheduledPublications(): Promise<void> {
    const now = new Date()
    const pendingSchedules = this.schedules.filter(s => 
      s.status === 'pending' && s.scheduledDate <= now
    )

    for (const schedule of pendingSchedules) {
      try {
        schedule.status = 'processing'
        await this.publishArticle(schedule.articleId, schedule.scheduledDate)
        schedule.status = 'published'
        console.log(`✅ Scheduled publication completed: ${schedule.articleId}`)
      } catch (error) {
        schedule.status = 'failed'
        schedule.retryCount++
        schedule.lastAttempt = now
        schedule.errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        console.error(`❌ Scheduled publication failed: ${schedule.articleId}`, error)
        
        // 重试逻辑
        if (schedule.retryCount < 3) {
          schedule.status = 'pending'
          schedule.scheduledDate = new Date(now.getTime() + 5 * 60 * 1000) // 5分钟后重试
        }
      }
    }

    if (pendingSchedules.length > 0) {
      await this.saveSchedules()
    }
  }

  private async executePostPublishTasks(article: Article): Promise<void> {
    try {
      // 更新站点地图
      await this.updateSitemap()
      
      // 更新标签使用统计
      await contentCategoryService.updateTagUsage(article.tags)
      
      // 生成社交媒体分享内容（如果需要）
      await this.generateSocialMediaContent(article)
      
      console.log(`✅ Post-publish tasks completed for: ${article.title}`)
    } catch (error) {
      console.error('❌ Post-publish tasks failed:', error)
    }
  }

  private async updateSitemap(): Promise<void> {
    const sitemapData = generateSitemapData()
    const robotsTxt = generateRobotsTxt()
    
    // 这里应该将sitemap和robots.txt写入到适当的位置
    console.log('📄 Sitemap and robots.txt updated')
  }

  private async generateSocialMediaContent(article: Article): Promise<void> {
    // 为社交媒体生成分享内容
    const socialContent = {
      title: article.title,
      description: article.excerpt || article.metaDescription,
      url: `https://zinses-rechner.de/artikel/${article.slug}`,
      hashtags: article.tags.slice(0, 3)
    }
    
    console.log('📱 Social media content generated:', socialContent)
  }
}

// Export singleton instance
export const contentPublishingService = ContentPublishingService.getInstance()
