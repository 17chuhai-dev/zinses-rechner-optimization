/**
 * 内容分类和标签管理服务
 * 扩展现有SEO关键词系统，提供智能分类和标签管理
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { germanKeywords } from '@/utils/seoConfig'
import type { Article, ArticleCategory } from './ContentManagementService'

// 分类定义
export interface Category {
  id: ArticleCategory
  name: string
  description: string
  icon: string
  color: string
  keywords: string[]
  parentCategory?: ArticleCategory
  seoTitle: string
  seoDescription: string
  slug: string
}

// 标签定义
export interface Tag {
  id: string
  name: string
  description?: string
  category?: ArticleCategory
  usage: number
  relatedTags: string[]
  keywords: string[]
  color?: string
}

// 相关文章推荐
export interface RelatedArticle {
  article: Article
  relevanceScore: number
  matchingFactors: string[]
}

// 分类统计
export interface CategoryStats {
  category: ArticleCategory
  articleCount: number
  publishedCount: number
  draftCount: number
  totalViews: number
  avgRating: number
  topTags: string[]
}

/**
 * 内容分类和标签管理服务
 */
export class ContentCategoryService {
  private static instance: ContentCategoryService
  private categories: Category[] = []
  private tags: Tag[] = []
  private isInitialized = false

  private constructor() {}

  static getInstance(): ContentCategoryService {
    if (!ContentCategoryService.instance) {
      ContentCategoryService.instance = new ContentCategoryService()
    }
    return ContentCategoryService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.initializeCategories()
      await this.loadTags()
      this.isInitialized = true
      console.log('✅ ContentCategoryService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ContentCategoryService:', error)
      throw error
    }
  }

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<Category[]> {
    if (!this.isInitialized) await this.initialize()
    return [...this.categories]
  }

  /**
   * 根据ID获取分类
   */
  async getCategory(id: ArticleCategory): Promise<Category | null> {
    if (!this.isInitialized) await this.initialize()
    return this.categories.find(cat => cat.id === id) || null
  }

  /**
   * 获取所有标签
   */
  async getTags(): Promise<Tag[]> {
    if (!this.isInitialized) await this.initialize()
    return [...this.tags].sort((a, b) => b.usage - a.usage)
  }

  /**
   * 根据分类获取标签
   */
  async getTagsByCategory(category: ArticleCategory): Promise<Tag[]> {
    if (!this.isInitialized) await this.initialize()
    return this.tags.filter(tag => tag.category === category)
  }

  /**
   * 搜索标签
   */
  async searchTags(query: string, limit = 10): Promise<Tag[]> {
    if (!this.isInitialized) await this.initialize()
    
    const searchTerm = query.toLowerCase()
    return this.tags
      .filter(tag => 
        tag.name.toLowerCase().includes(searchTerm) ||
        tag.description?.toLowerCase().includes(searchTerm) ||
        tag.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit)
  }

  /**
   * 创建新标签
   */
  async createTag(tagData: Omit<Tag, 'id' | 'usage' | 'relatedTags'>): Promise<Tag> {
    if (!this.isInitialized) await this.initialize()

    const tag: Tag = {
      id: this.generateTagId(tagData.name),
      usage: 0,
      relatedTags: [],
      ...tagData
    }

    // 检查是否已存在
    const existingTag = this.tags.find(t => t.name.toLowerCase() === tag.name.toLowerCase())
    if (existingTag) {
      return existingTag
    }

    this.tags.push(tag)
    await this.saveTags()

    console.log(`🏷️ Tag created: ${tag.name}`)
    return tag
  }

  /**
   * 更新标签使用次数
   */
  async updateTagUsage(tagNames: string[]): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    for (const tagName of tagNames) {
      const tag = this.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
      if (tag) {
        tag.usage++
      } else {
        // 自动创建新标签
        await this.createTag({
          name: tagName,
          keywords: [tagName]
        })
      }
    }

    await this.saveTags()
  }

  /**
   * 智能标签建议
   */
  async suggestTags(content: string, title: string, category?: ArticleCategory): Promise<Tag[]> {
    if (!this.isInitialized) await this.initialize()

    const suggestions: { tag: Tag; score: number }[] = []
    const contentLower = `${title} ${content}`.toLowerCase()

    // 基于关键词匹配
    for (const tag of this.tags) {
      let score = 0

      // 检查标签名称匹配
      if (contentLower.includes(tag.name.toLowerCase())) {
        score += 10
      }

      // 检查关键词匹配
      for (const keyword of tag.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 5
        }
      }

      // 分类匹配加分
      if (category && tag.category === category) {
        score += 3
      }

      // 使用频率加分
      score += Math.min(tag.usage * 0.1, 5)

      if (score > 0) {
        suggestions.push({ tag, score })
      }
    }

    // 基于德语财务关键词的额外建议
    const germanFinanceKeywords = [
      ...germanKeywords.primary,
      ...germanKeywords.secondary,
      ...germanKeywords.local
    ]

    for (const keyword of germanFinanceKeywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        const existingTag = this.tags.find(t => 
          t.keywords.some(k => k.toLowerCase() === keyword.toLowerCase())
        )
        
        if (existingTag && !suggestions.find(s => s.tag.id === existingTag.id)) {
          suggestions.push({ tag: existingTag, score: 8 })
        }
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => s.tag)
  }

  /**
   * 自动分类建议
   */
  async suggestCategory(content: string, title: string): Promise<ArticleCategory | null> {
    if (!this.isInitialized) await this.initialize()

    const contentLower = `${title} ${content}`.toLowerCase()
    const categoryScores: Record<ArticleCategory, number> = {
      grundlagen: 0,
      strategien: 0,
      steuer: 0,
      tools: 0,
      news: 0,
      ratgeber: 0
    }

    // 基于关键词评分
    for (const category of this.categories) {
      for (const keyword of category.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          categoryScores[category.id] += 1
        }
      }
    }

    // 特定模式匹配
    if (contentLower.includes('rechner') || contentLower.includes('tool') || contentLower.includes('calculator')) {
      categoryScores.tools += 5
    }

    if (contentLower.includes('steuer') || contentLower.includes('abgeltung') || contentLower.includes('freibetrag')) {
      categoryScores.steuer += 5
    }

    if (contentLower.includes('strategie') || contentLower.includes('portfolio') || contentLower.includes('diversifikation')) {
      categoryScores.strategien += 5
    }

    if (contentLower.includes('grundlagen') || contentLower.includes('einführung') || contentLower.includes('basics')) {
      categoryScores.grundlagen += 5
    }

    // 找到最高分的分类
    const maxScore = Math.max(...Object.values(categoryScores))
    if (maxScore === 0) return null

    const suggestedCategory = Object.entries(categoryScores)
      .find(([_, score]) => score === maxScore)?.[0] as ArticleCategory

    return suggestedCategory || null
  }

  /**
   * 获取相关文章
   */
  async getRelatedArticles(article: Article, articles: Article[], limit = 5): Promise<RelatedArticle[]> {
    if (!this.isInitialized) await this.initialize()

    const relatedArticles: RelatedArticle[] = []

    for (const otherArticle of articles) {
      if (otherArticle.id === article.id || otherArticle.status !== 'published') {
        continue
      }

      const relevanceScore = this.calculateRelevanceScore(article, otherArticle)
      const matchingFactors = this.getMatchingFactors(article, otherArticle)

      if (relevanceScore > 0) {
        relatedArticles.push({
          article: otherArticle,
          relevanceScore,
          matchingFactors
        })
      }
    }

    return relatedArticles
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats(articles: Article[]): Promise<CategoryStats[]> {
    if (!this.isInitialized) await this.initialize()

    const stats: CategoryStats[] = []

    for (const category of this.categories) {
      const categoryArticles = articles.filter(a => a.category === category.id)
      const publishedArticles = categoryArticles.filter(a => a.status === 'published')
      const draftArticles = categoryArticles.filter(a => a.status === 'draft')

      // 收集所有标签
      const allTags = categoryArticles.flatMap(a => a.tags)
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag)

      stats.push({
        category: category.id,
        articleCount: categoryArticles.length,
        publishedCount: publishedArticles.length,
        draftCount: draftArticles.length,
        totalViews: categoryArticles.reduce((sum, a) => sum + a.views, 0),
        avgRating: 0, // 暂时设为0，后续可以添加评分系统
        topTags
      })
    }

    return stats
  }

  /**
   * 获取热门标签
   */
  async getTrendingTags(limit = 20): Promise<Tag[]> {
    if (!this.isInitialized) await this.initialize()

    return this.tags
      .filter(tag => tag.usage > 0)
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit)
  }

  // 私有方法
  private initializeCategories(): void {
    this.categories = [
      {
        id: 'grundlagen',
        name: 'Grundlagen',
        description: 'Grundlegende Konzepte der Finanzwelt',
        icon: '📚',
        color: 'blue',
        keywords: ['grundlagen', 'basics', 'einführung', 'definition', 'erklärung'],
        seoTitle: 'Finanz-Grundlagen | Zinseszins-Rechner',
        seoDescription: 'Lernen Sie die Grundlagen der Finanzwelt kennen',
        slug: 'grundlagen'
      },
      {
        id: 'strategien',
        name: 'Strategien',
        description: 'Anlagestrategien und Finanzplanung',
        icon: '📈',
        color: 'green',
        keywords: ['strategie', 'anlage', 'portfolio', 'diversifikation', 'risiko'],
        seoTitle: 'Anlagestrategien | Zinseszins-Rechner',
        seoDescription: 'Entdecken Sie bewährte Anlagestrategien',
        slug: 'strategien'
      },
      {
        id: 'steuer',
        name: 'Steuer & Recht',
        description: 'Steuerliche Aspekte und rechtliche Grundlagen',
        icon: '⚖️',
        color: 'red',
        keywords: ['steuer', 'abgeltung', 'freibetrag', 'recht', 'gesetz'],
        seoTitle: 'Steuer & Recht | Zinseszins-Rechner',
        seoDescription: 'Alles über Steuern und rechtliche Aspekte',
        slug: 'steuer-recht'
      },
      {
        id: 'tools',
        name: 'Tools & Rechner',
        description: 'Finanzrechner und nützliche Tools',
        icon: '🧮',
        color: 'purple',
        keywords: ['rechner', 'tool', 'calculator', 'berechnung', 'simulation'],
        seoTitle: 'Finanzrechner & Tools | Zinseszins-Rechner',
        seoDescription: 'Kostenlose Finanzrechner und Tools',
        slug: 'tools-rechner'
      },
      {
        id: 'news',
        name: 'Aktuelles',
        description: 'Aktuelle Entwicklungen und News',
        icon: '📰',
        color: 'orange',
        keywords: ['news', 'aktuell', 'entwicklung', 'markt', 'trend'],
        seoTitle: 'Finanz-News | Zinseszins-Rechner',
        seoDescription: 'Aktuelle Entwicklungen in der Finanzwelt',
        slug: 'aktuelles'
      },
      {
        id: 'ratgeber',
        name: 'Ratgeber',
        description: 'Praktische Tipps und Ratschläge',
        icon: '💡',
        color: 'yellow',
        keywords: ['ratgeber', 'tipps', 'hilfe', 'anleitung', 'howto'],
        seoTitle: 'Finanz-Ratgeber | Zinseszins-Rechner',
        seoDescription: 'Praktische Tipps für Ihre Finanzen',
        slug: 'ratgeber'
      }
    ]
  }

  private async loadTags(): Promise<void> {
    // 初始化一些基础标签
    this.tags = [
      {
        id: 'zinseszins',
        name: 'Zinseszins',
        description: 'Alles rund um den Zinseszinseffekt',
        category: 'grundlagen',
        usage: 50,
        relatedTags: ['zinsen', 'kapitalwachstum', 'rendite'],
        keywords: ['zinseszins', 'compound interest', 'zinsen']
      },
      {
        id: 'sparen',
        name: 'Sparen',
        description: 'Spartipps und Sparstrategien',
        category: 'strategien',
        usage: 45,
        relatedTags: ['geldanlage', 'budget', 'notgroschen'],
        keywords: ['sparen', 'sparplan', 'sparbuch']
      },
      {
        id: 'investieren',
        name: 'Investieren',
        description: 'Investmentstrategien und -tipps',
        category: 'strategien',
        usage: 40,
        relatedTags: ['aktien', 'etf', 'portfolio'],
        keywords: ['investieren', 'investment', 'anlage']
      },
      {
        id: 'abgeltungssteuer',
        name: 'Abgeltungssteuer',
        description: 'Steuer auf Kapitalerträge',
        category: 'steuer',
        usage: 35,
        relatedTags: ['steuer', 'freibetrag', 'kapitalerträge'],
        keywords: ['abgeltungssteuer', 'kapitalertragsteuer', 'steuer']
      }
    ]
  }

  private async saveTags(): Promise<void> {
    // Vereinfachte Implementierung
    console.log(`💾 Saved ${this.tags.length} tags`)
  }

  private generateTagId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => {
        const replacements: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }
        return replacements[match] || match
      })
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private calculateRelevanceScore(article1: Article, article2: Article): number {
    let score = 0

    // 相同分类
    if (article1.category === article2.category) {
      score += 10
    }

    // 共同标签
    const commonTags = article1.tags.filter(tag => article2.tags.includes(tag))
    score += commonTags.length * 5

    // 关键词匹配
    if (article1.primaryKeyword && article2.primaryKeyword) {
      if (article1.primaryKeyword === article2.primaryKeyword) {
        score += 15
      }
    }

    // 内容相似性（简化版）
    const content1Words = article1.content.toLowerCase().split(/\s+/)
    const content2Words = article2.content.toLowerCase().split(/\s+/)
    const commonWords = content1Words.filter(word => 
      word.length > 4 && content2Words.includes(word)
    )
    score += Math.min(commonWords.length * 0.5, 10)

    return score
  }

  private getMatchingFactors(article1: Article, article2: Article): string[] {
    const factors: string[] = []

    if (article1.category === article2.category) {
      factors.push('Gleiche Kategorie')
    }

    const commonTags = article1.tags.filter(tag => article2.tags.includes(tag))
    if (commonTags.length > 0) {
      factors.push(`Gemeinsame Tags: ${commonTags.join(', ')}`)
    }

    if (article1.primaryKeyword === article2.primaryKeyword) {
      factors.push('Gleiches Haupt-Keyword')
    }

    return factors
  }
}

// Export singleton instance
export const contentCategoryService = ContentCategoryService.getInstance()
