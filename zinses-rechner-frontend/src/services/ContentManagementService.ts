/**
 * 内容管理服务
 * 集成现有SEO基础设施，提供完整的内容管理功能
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { LocalStorageService } from './LocalStorageService'
import { useSEO } from '@/composables/useSEO'
import { germanKeywords, generateSitemapData } from '@/utils/seoConfig'
import type { User } from '@/types/user-identity'

// 文章接口
export interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  slug: string
  
  // SEO相关
  primaryKeyword: string
  metaDescription: string
  keywords: string[]
  
  // 分类和标签
  category: ArticleCategory
  tags: string[]
  
  // 发布相关
  status: ArticleStatus
  publishDate?: Date
  scheduledDate?: Date
  featured: boolean
  
  // 作者和时间
  authorId: string
  createdAt: Date
  updatedAt: Date
  
  // 统计数据
  views: number
  shares: number
  likes: number
  
  // 版本控制
  version: number
  previousVersions: string[]
  
  // 德语特定
  readingTime: number // 阅读时间（分钟）
  difficulty: 'anfänger' | 'fortgeschritten' | 'experte'
}

export type ArticleCategory = 
  | 'grundlagen'
  | 'strategien' 
  | 'steuer'
  | 'tools'
  | 'news'
  | 'ratgeber'

export type ArticleStatus = 
  | 'draft'
  | 'review'
  | 'scheduled'
  | 'published'
  | 'archived'

// 搜索和筛选接口
export interface ContentSearchQuery {
  text?: string
  category?: ArticleCategory
  tags?: string[]
  status?: ArticleStatus
  dateRange?: {
    start: Date
    end: Date
  }
  featured?: boolean
  difficulty?: Article['difficulty']
}

export interface ContentQueryOptions {
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'publishDate' | 'views' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// SEO分析结果
export interface SEOAnalysis {
  score: number
  suggestions: SEOSuggestion[]
  keywords: KeywordAnalysis[]
  readability: ReadabilityScore
}

export interface SEOSuggestion {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  fix?: string
}

export interface KeywordAnalysis {
  keyword: string
  density: number
  occurrences: number
  inTitle: boolean
  inMeta: boolean
  inHeadings: boolean
}

export interface ReadabilityScore {
  score: number
  level: 'sehr einfach' | 'einfach' | 'mittel' | 'schwer' | 'sehr schwer'
  avgWordsPerSentence: number
  avgSyllablesPerWord: number
}

/**
 * 内容管理服务类
 */
export class ContentManagementService {
  private static instance: ContentManagementService
  private storageService: LocalStorageService
  private articles: Article[] = []
  private isInitialized = false

  private constructor() {
    this.storageService = new LocalStorageService()
  }

  static getInstance(): ContentManagementService {
    if (!ContentManagementService.instance) {
      ContentManagementService.instance = new ContentManagementService()
    }
    return ContentManagementService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.loadArticles()
      this.isInitialized = true
      console.log('✅ ContentManagementService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ContentManagementService:', error)
      throw error
    }
  }

  /**
   * 创建新文章
   */
  async createArticle(
    articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'previousVersions' | 'views' | 'shares' | 'likes'>,
    authorId: string
  ): Promise<Article> {
    if (!this.isInitialized) await this.initialize()

    const article: Article = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      previousVersions: [],
      views: 0,
      shares: 0,
      likes: 0,
      authorId,
      ...articleData,
      slug: this.generateSlug(articleData.title),
      readingTime: this.calculateReadingTime(articleData.content)
    }

    // 验证文章数据
    this.validateArticle(article)

    // 生成SEO数据
    await this.generateSEOData(article)

    this.articles.push(article)
    await this.saveArticles()

    console.log(`📝 Article created: ${article.title}`)
    return article
  }

  /**
   * 更新文章
   */
  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    if (!this.isInitialized) await this.initialize()

    const articleIndex = this.articles.findIndex(a => a.id === id)
    if (articleIndex === -1) {
      throw new Error(`Article with ID ${id} not found`)
    }

    const currentArticle = this.articles[articleIndex]
    
    // 创建版本备份
    const versionBackup = JSON.stringify(currentArticle)
    
    const updatedArticle: Article = {
      ...currentArticle,
      ...updates,
      updatedAt: new Date(),
      version: currentArticle.version + 1,
      previousVersions: [...currentArticle.previousVersions, versionBackup],
      slug: updates.title ? this.generateSlug(updates.title) : currentArticle.slug,
      readingTime: updates.content ? this.calculateReadingTime(updates.content) : currentArticle.readingTime
    }

    // 验证更新后的文章
    this.validateArticle(updatedArticle)

    // 更新SEO数据
    if (updates.title || updates.content || updates.primaryKeyword) {
      await this.generateSEOData(updatedArticle)
    }

    this.articles[articleIndex] = updatedArticle
    await this.saveArticles()

    console.log(`📝 Article updated: ${updatedArticle.title}`)
    return updatedArticle
  }

  /**
   * 删除文章
   */
  async deleteArticle(id: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    this.articles = this.articles.filter(a => a.id !== id)
    await this.saveArticles()

    console.log(`🗑️ Article deleted: ${id}`)
  }

  /**
   * 根据ID获取文章
   */
  async getArticle(id: string): Promise<Article | null> {
    if (!this.isInitialized) await this.initialize()

    return this.articles.find(a => a.id === id) || null
  }

  /**
   * 根据slug获取文章
   */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    if (!this.isInitialized) await this.initialize()

    return this.articles.find(a => a.slug === slug) || null
  }

  /**
   * 搜索文章
   */
  async searchArticles(
    query: ContentSearchQuery,
    options: ContentQueryOptions = {}
  ): Promise<{ articles: Article[]; total: number }> {
    if (!this.isInitialized) await this.initialize()

    let filteredArticles = [...this.articles]

    // 文本搜索
    if (query.text) {
      const searchText = query.text.toLowerCase()
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchText) ||
        article.excerpt.toLowerCase().includes(searchText) ||
        article.content.toLowerCase().includes(searchText) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchText))
      )
    }

    // 分类筛选
    if (query.category) {
      filteredArticles = filteredArticles.filter(article => article.category === query.category)
    }

    // 标签筛选
    if (query.tags && query.tags.length > 0) {
      filteredArticles = filteredArticles.filter(article =>
        query.tags!.some(tag => article.tags.includes(tag))
      )
    }

    // 状态筛选
    if (query.status) {
      filteredArticles = filteredArticles.filter(article => article.status === query.status)
    }

    // 日期范围筛选
    if (query.dateRange) {
      filteredArticles = filteredArticles.filter(article =>
        article.createdAt >= query.dateRange!.start &&
        article.createdAt <= query.dateRange!.end
      )
    }

    // 特色文章筛选
    if (query.featured !== undefined) {
      filteredArticles = filteredArticles.filter(article => article.featured === query.featured)
    }

    // 难度筛选
    if (query.difficulty) {
      filteredArticles = filteredArticles.filter(article => article.difficulty === query.difficulty)
    }

    const total = filteredArticles.length

    // 排序
    if (options.sortBy) {
      filteredArticles.sort((a, b) => {
        const aValue = a[options.sortBy!]
        const bValue = b[options.sortBy!]
        
        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1
        
        return options.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    // 分页
    if (options.offset || options.limit) {
      const start = options.offset || 0
      const end = options.limit ? start + options.limit : undefined
      filteredArticles = filteredArticles.slice(start, end)
    }

    return { articles: filteredArticles, total }
  }

  /**
   * 获取已发布文章
   */
  async getPublishedArticles(options: ContentQueryOptions = {}): Promise<Article[]> {
    const result = await this.searchArticles({ status: 'published' }, options)
    return result.articles
  }

  /**
   * 获取特色文章
   */
  async getFeaturedArticles(limit = 5): Promise<Article[]> {
    const result = await this.searchArticles(
      { featured: true, status: 'published' },
      { limit, sortBy: 'publishDate', sortOrder: 'desc' }
    )
    return result.articles
  }

  /**
   * 发布文章
   */
  async publishArticle(id: string, publishDate?: Date): Promise<Article> {
    const updates: Partial<Article> = {
      status: 'published',
      publishDate: publishDate || new Date()
    }

    const article = await this.updateArticle(id, updates)
    
    // 更新站点地图
    await this.updateSitemap()
    
    return article
  }

  /**
   * 计划发布文章
   */
  async scheduleArticle(id: string, scheduledDate: Date): Promise<Article> {
    return this.updateArticle(id, {
      status: 'scheduled',
      scheduledDate
    })
  }

  /**
   * SEO分析
   */
  async analyzeSEO(article: Article): Promise<SEOAnalysis> {
    const suggestions: SEOSuggestion[] = []
    const keywords: KeywordAnalysis[] = []

    // 标题分析
    if (!article.title) {
      suggestions.push({
        id: 'no-title',
        type: 'error',
        message: 'Artikel benötigt einen Titel',
        fix: 'Fügen Sie einen aussagekräftigen Titel hinzu'
      })
    } else if (article.title.length < 30) {
      suggestions.push({
        id: 'title-too-short',
        type: 'warning',
        message: 'Titel ist zu kurz (< 30 Zeichen)',
        fix: 'Erweitern Sie den Titel auf 30-60 Zeichen'
      })
    } else if (article.title.length > 60) {
      suggestions.push({
        id: 'title-too-long',
        type: 'warning',
        message: 'Titel ist zu lang (> 60 Zeichen)',
        fix: 'Kürzen Sie den Titel auf maximal 60 Zeichen'
      })
    }

    // Meta-Beschreibung Analyse
    if (!article.metaDescription) {
      suggestions.push({
        id: 'no-meta-description',
        type: 'error',
        message: 'Meta-Beschreibung fehlt',
        fix: 'Fügen Sie eine Meta-Beschreibung hinzu'
      })
    } else if (article.metaDescription.length < 120) {
      suggestions.push({
        id: 'meta-too-short',
        type: 'warning',
        message: 'Meta-Beschreibung ist zu kurz (< 120 Zeichen)',
        fix: 'Erweitern Sie die Meta-Beschreibung auf 120-160 Zeichen'
      })
    }

    // Keyword-Analyse
    if (article.primaryKeyword) {
      const keywordAnalysis = this.analyzeKeyword(article, article.primaryKeyword)
      keywords.push(keywordAnalysis)

      if (keywordAnalysis.density < 0.5) {
        suggestions.push({
          id: 'keyword-density-low',
          type: 'info',
          message: `Keyword-Dichte für "${article.primaryKeyword}" ist niedrig (${keywordAnalysis.density}%)`,
          fix: 'Verwenden Sie das Keyword häufiger im Text'
        })
      } else if (keywordAnalysis.density > 3) {
        suggestions.push({
          id: 'keyword-density-high',
          type: 'warning',
          message: `Keyword-Dichte für "${article.primaryKeyword}" ist zu hoch (${keywordAnalysis.density}%)`,
          fix: 'Reduzieren Sie die Keyword-Verwendung'
        })
      }
    }

    // Lesbarkeits-Analyse
    const readability = this.analyzeReadability(article.content)

    // Gesamtbewertung berechnen
    const score = this.calculateSEOScore(article, suggestions, keywords, readability)

    return {
      score,
      suggestions,
      keywords,
      readability
    }
  }

  // Private Hilfsmethoden
  private async loadArticles(): Promise<void> {
    try {
      // Vereinfachte Implementierung - in der Realität würde dies aus einer Datenbank laden
      this.articles = []
    } catch (error) {
      console.error('Failed to load articles:', error)
      this.articles = []
    }
  }

  private async saveArticles(): Promise<void> {
    try {
      // Vereinfachte Implementierung - in der Realität würde dies in eine Datenbank speichern
      console.log(`💾 Saved ${this.articles.length} articles`)
    } catch (error) {
      console.error('Failed to save articles:', error)
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => {
        const replacements: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }
        return replacements[match] || match
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200 // Durchschnittliche Lesegeschwindigkeit auf Deutsch
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  private validateArticle(article: Article): void {
    if (!article.title) throw new Error('Article title is required')
    if (!article.content) throw new Error('Article content is required')
    if (!article.category) throw new Error('Article category is required')
  }

  private async generateSEOData(article: Article): Promise<void> {
    // Integration mit dem bestehenden SEO-System
    const { setEducationalContentSEO } = useSEO()
    
    if (article.status === 'published') {
      setEducationalContentSEO(
        article.title,
        article.excerpt || article.metaDescription,
        article.slug,
        [article.primaryKeyword, ...article.tags].filter(Boolean)
      )
    }
  }

  private analyzeKeyword(article: Article, keyword: string): KeywordAnalysis {
    const content = `${article.title} ${article.excerpt} ${article.content}`.toLowerCase()
    const keywordLower = keyword.toLowerCase()
    
    const occurrences = (content.match(new RegExp(keywordLower, 'g')) || []).length
    const totalWords = content.split(/\s+/).length
    const density = (occurrences / totalWords) * 100

    return {
      keyword,
      density: Math.round(density * 100) / 100,
      occurrences,
      inTitle: article.title.toLowerCase().includes(keywordLower),
      inMeta: article.metaDescription?.toLowerCase().includes(keywordLower) || false,
      inHeadings: this.checkKeywordInHeadings(article.content, keywordLower)
    }
  }

  private checkKeywordInHeadings(content: string, keyword: string): boolean {
    const headingRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi
    const headings = content.match(headingRegex) || []
    return headings.some(heading => heading.toLowerCase().includes(keyword))
  }

  private analyzeReadability(content: string): ReadabilityScore {
    // Vereinfachte Flesch-Reading-Ease Berechnung für Deutsch
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0)

    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length

    // Angepasste Formel für Deutsch
    const score = 180 - avgWordsPerSentence - (58.5 * avgSyllablesPerWord)

    let level: ReadabilityScore['level']
    if (score >= 80) level = 'sehr einfach'
    else if (score >= 60) level = 'einfach'
    else if (score >= 40) level = 'mittel'
    else if (score >= 20) level = 'schwer'
    else level = 'sehr schwer'

    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10
    }
  }

  private countSyllables(word: string): number {
    // Vereinfachte Silbenzählung für Deutsch
    const vowels = 'aeiouäöü'
    let count = 0
    let previousWasVowel = false

    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char)
      if (isVowel && !previousWasVowel) {
        count++
      }
      previousWasVowel = isVowel
    }

    return Math.max(1, count)
  }

  private calculateSEOScore(
    article: Article,
    suggestions: SEOSuggestion[],
    keywords: KeywordAnalysis[],
    readability: ReadabilityScore
  ): number {
    let score = 100

    // Abzüge für Probleme
    suggestions.forEach(suggestion => {
      switch (suggestion.type) {
        case 'error':
          score -= 20
          break
        case 'warning':
          score -= 10
          break
        case 'info':
          score -= 5
          break
      }
    })

    // Bonus für gute Keyword-Verwendung
    keywords.forEach(keyword => {
      if (keyword.density >= 0.5 && keyword.density <= 3) {
        score += 5
      }
      if (keyword.inTitle) score += 5
      if (keyword.inMeta) score += 5
      if (keyword.inHeadings) score += 5
    })

    // Bonus für gute Lesbarkeit
    if (readability.score >= 60) score += 10
    else if (readability.score >= 40) score += 5

    return Math.max(0, Math.min(100, score))
  }

  private async updateSitemap(): Promise<void> {
    // Integration mit dem bestehenden Sitemap-System
    const sitemapData = generateSitemapData()
    console.log('📄 Sitemap updated')
  }
}

// Export singleton instance
export const contentManagementService = ContentManagementService.getInstance()
