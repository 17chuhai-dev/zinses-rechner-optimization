/**
 * 高级SEO优化服务
 * 升级现有SEO自动化系统，增加内链优化、图片SEO、页面速度优化
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { useSEO } from '@/composables/useSEO'
import { germanKeywords, structuredDataTemplates } from '@/utils/seoConfig'
import { keywordResearchService } from './KeywordResearchService'
import type { Article } from './ContentManagementService'

// 内链优化接口
export interface InternalLink {
  anchor: string
  url: string
  relevanceScore: number
  context: string
  position: number
}

export interface InternalLinkSuggestion {
  targetUrl: string
  anchorText: string
  contextBefore: string
  contextAfter: string
  relevanceScore: number
  seoValue: number
}

// 图片SEO接口
export interface ImageSEO {
  src: string
  alt: string
  title?: string
  caption?: string
  filename: string
  optimizedFilename: string
  compressionRatio: number
  dimensions: { width: number; height: number }
  fileSize: number
  format: 'webp' | 'jpg' | 'png' | 'svg'
}

// 页面性能接口
export interface PagePerformance {
  loadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  performanceScore: number
  suggestions: PerformanceSuggestion[]
}

export interface PerformanceSuggestion {
  type: 'critical' | 'warning' | 'info'
  category: 'loading' | 'interactivity' | 'visual-stability' | 'seo'
  message: string
  impact: 'high' | 'medium' | 'low'
  fix: string
}

// 结构化数据接口
export interface StructuredDataResult {
  type: string
  data: Record<string, any>
  validation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
}

/**
 * 高级SEO优化服务
 */
export class AdvancedSEOService {
  private static instance: AdvancedSEOService
  private isInitialized = false
  private internalLinksDatabase: Map<string, InternalLink[]> = new Map()

  private constructor() {}

  static getInstance(): AdvancedSEOService {
    if (!AdvancedSEOService.instance) {
      AdvancedSEOService.instance = new AdvancedSEOService()
    }
    return AdvancedSEOService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.buildInternalLinksDatabase()
      this.isInitialized = true
      console.log('✅ AdvancedSEOService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize AdvancedSEOService:', error)
      throw error
    }
  }

  /**
   * 优化内链结构
   */
  async optimizeInternalLinks(content: string, currentUrl: string): Promise<string> {
    if (!this.isInitialized) await this.initialize()

    let optimizedContent = content
    const suggestions = await this.getInternalLinkSuggestions(content, currentUrl)

    // 按相关性排序，选择最佳建议
    const topSuggestions = suggestions
      .sort((a, b) => b.seoValue - a.seoValue)
      .slice(0, 5) // 限制每页最多5个内链

    for (const suggestion of topSuggestions) {
      const linkHtml = this.createInternalLink(suggestion)
      const searchText = suggestion.anchorText
      
      // 只替换第一次出现，避免过度链接
      if (optimizedContent.includes(searchText) && !optimizedContent.includes(`href="${suggestion.targetUrl}"`)) {
        optimizedContent = optimizedContent.replace(
          searchText,
          linkHtml
        )
      }
    }

    return optimizedContent
  }

  /**
   * 优化图片SEO
   */
  async optimizeImages(content: string): Promise<string> {
    if (!this.isInitialized) await this.initialize()

    let optimizedContent = content
    const imageRegex = /<img[^>]+>/gi
    const images = content.match(imageRegex) || []

    for (const imgTag of images) {
      const optimizedImg = await this.optimizeImageTag(imgTag)
      optimizedContent = optimizedContent.replace(imgTag, optimizedImg)
    }

    return optimizedContent
  }

  /**
   * 生成结构化数据
   */
  async generateSchemaMarkup(article: Article): Promise<StructuredDataResult[]> {
    if (!this.isInitialized) await this.initialize()

    const results: StructuredDataResult[] = []

    // 文章结构化数据
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt || article.metaDescription,
      author: {
        '@type': 'Organization',
        name: 'Zinseszins-Rechner.de'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Zinseszins-Rechner.de',
        logo: {
          '@type': 'ImageObject',
          url: 'https://zinses-rechner.de/images/logo.png'
        }
      },
      datePublished: article.publishDate?.toISOString(),
      dateModified: article.updatedAt.toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://zinses-rechner.de/artikel/${article.slug}`
      },
      inLanguage: 'de-DE',
      keywords: article.tags.join(', ')
    }

    results.push({
      type: 'Article',
      data: articleSchema,
      validation: this.validateStructuredData(articleSchema)
    })

    // FAQ结构化数据（如果内容包含问答）
    const faqData = this.extractFAQFromContent(article.content)
    if (faqData.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqData
      }

      results.push({
        type: 'FAQPage',
        data: faqSchema,
        validation: this.validateStructuredData(faqSchema)
      })
    }

    // HowTo结构化数据（如果是教程内容）
    if (this.isHowToContent(article.content)) {
      const howToSchema = this.generateHowToSchema(article)
      results.push({
        type: 'HowTo',
        data: howToSchema,
        validation: this.validateStructuredData(howToSchema)
      })
    }

    return results
  }

  /**
   * 分析页面性能
   */
  async analyzePagePerformance(url: string): Promise<PagePerformance> {
    // 模拟性能分析，实际应该使用Lighthouse API
    const mockPerformance: PagePerformance = {
      loadTime: 2.3,
      firstContentfulPaint: 1.2,
      largestContentfulPaint: 2.1,
      cumulativeLayoutShift: 0.05,
      firstInputDelay: 45,
      performanceScore: 85,
      suggestions: [
        {
          type: 'warning',
          category: 'loading',
          message: 'Bilder könnten weiter optimiert werden',
          impact: 'medium',
          fix: 'Verwenden Sie WebP-Format und lazy loading'
        },
        {
          type: 'info',
          category: 'seo',
          message: 'Meta-Beschreibung könnte länger sein',
          impact: 'low',
          fix: 'Erweitern Sie die Meta-Beschreibung auf 150-160 Zeichen'
        }
      ]
    }

    return mockPerformance
  }

  /**
   * 生成完整的SEO报告
   */
  async generateSEOReport(article: Article): Promise<{
    overallScore: number
    sections: SEOReportSection[]
  }> {
    const sections: SEOReportSection[] = []

    // 内容分析
    const contentAnalysis = await this.analyzeContentSEO(article)
    sections.push({
      name: 'Inhalt & Keywords',
      score: contentAnalysis.score,
      items: contentAnalysis.items
    })

    // 技术SEO
    const technicalAnalysis = await this.analyzeTechnicalSEO(article)
    sections.push({
      name: 'Technisches SEO',
      score: technicalAnalysis.score,
      items: technicalAnalysis.items
    })

    // 用户体验
    const uxAnalysis = await this.analyzeUserExperience(article)
    sections.push({
      name: 'Benutzererfahrung',
      score: uxAnalysis.score,
      items: uxAnalysis.items
    })

    const overallScore = sections.reduce((sum, section) => sum + section.score, 0) / sections.length

    return { overallScore: Math.round(overallScore), sections }
  }

  // 私有方法
  private async buildInternalLinksDatabase(): Promise<void> {
    // 构建内链数据库，实际应该从现有页面抓取
    const commonPages = [
      { url: '/ratgeber/zinseszins-grundlagen', anchor: 'Zinseszins Grundlagen', keywords: ['zinseszins', 'grundlagen'] },
      { url: '/ratgeber/geld-anlegen-tipps', anchor: 'Geld anlegen Tipps', keywords: ['geld anlegen', 'tipps'] },
      { url: '/ratgeber/deutsche-steuern', anchor: 'Deutsche Steuern', keywords: ['steuer', 'abgeltungssteuer'] },
      { url: '/rechner/sparplan', anchor: 'Sparplan Rechner', keywords: ['sparplan', 'rechner'] },
      { url: '/rechner/investment', anchor: 'Investment Rechner', keywords: ['investment', 'rechner'] }
    ]

    for (const page of commonPages) {
      const links: InternalLink[] = page.keywords.map(keyword => ({
        anchor: page.anchor,
        url: page.url,
        relevanceScore: 0.8,
        context: keyword,
        position: 0
      }))

      this.internalLinksDatabase.set(page.url, links)
    }
  }

  private async getInternalLinkSuggestions(content: string, currentUrl: string): Promise<InternalLinkSuggestion[]> {
    const suggestions: InternalLinkSuggestion[] = []
    const contentLower = content.toLowerCase()

    for (const [url, links] of this.internalLinksDatabase) {
      if (url === currentUrl) continue // 不链接到自己

      for (const link of links) {
        if (contentLower.includes(link.context.toLowerCase())) {
          const contextIndex = contentLower.indexOf(link.context.toLowerCase())
          const contextBefore = content.substring(Math.max(0, contextIndex - 50), contextIndex)
          const contextAfter = content.substring(contextIndex + link.context.length, contextIndex + link.context.length + 50)

          suggestions.push({
            targetUrl: link.url,
            anchorText: link.context,
            contextBefore,
            contextAfter,
            relevanceScore: link.relevanceScore,
            seoValue: this.calculateSEOValue(link, content)
          })
        }
      }
    }

    return suggestions
  }

  private createInternalLink(suggestion: InternalLinkSuggestion): string {
    return `<a href="${suggestion.targetUrl}" title="Mehr über ${suggestion.anchorText}" class="internal-link">${suggestion.anchorText}</a>`
  }

  private async optimizeImageTag(imgTag: string): Promise<string> {
    // 提取图片属性
    const srcMatch = imgTag.match(/src="([^"]+)"/)
    const altMatch = imgTag.match(/alt="([^"]*)"/)
    
    if (!srcMatch) return imgTag

    const src = srcMatch[1]
    const currentAlt = altMatch ? altMatch[1] : ''

    // 生成优化的alt文本
    const optimizedAlt = currentAlt || this.generateAltText(src)
    
    // 添加loading="lazy"
    let optimizedTag = imgTag
    if (!imgTag.includes('loading=')) {
      optimizedTag = imgTag.replace('<img', '<img loading="lazy"')
    }

    // 更新或添加alt属性
    if (altMatch) {
      optimizedTag = optimizedTag.replace(/alt="[^"]*"/, `alt="${optimizedAlt}"`)
    } else {
      optimizedTag = optimizedTag.replace('<img', `<img alt="${optimizedAlt}"`)
    }

    return optimizedTag
  }

  private generateAltText(src: string): string {
    const filename = src.split('/').pop()?.split('.')[0] || ''
    
    // 基于文件名生成德语alt文本
    const altMap: Record<string, string> = {
      'zinseszins': 'Zinseszins Diagramm',
      'calculator': 'Finanzrechner Interface',
      'chart': 'Finanzdiagramm',
      'graph': 'Wachstumsgraph',
      'money': 'Geld und Finanzen',
      'investment': 'Investment Strategie'
    }

    for (const [key, value] of Object.entries(altMap)) {
      if (filename.toLowerCase().includes(key)) {
        return value
      }
    }

    return 'Finanz-Illustration'
  }

  private extractFAQFromContent(content: string): any[] {
    const faqItems: any[] = []
    
    // 简化的FAQ提取，寻找问答模式
    const questionPattern = /(?:^|\n)(?:Q:|Frage:|Was ist|Wie funktioniert|Warum)([^\n]+)\n(?:A:|Antwort:)?([^\n]+)/gi
    let match

    while ((match = questionPattern.exec(content)) !== null) {
      faqItems.push({
        '@type': 'Question',
        name: match[1].trim(),
        acceptedAnswer: {
          '@type': 'Answer',
          text: match[2].trim()
        }
      })
    }

    return faqItems
  }

  private isHowToContent(content: string): boolean {
    const howToIndicators = [
      'schritt für schritt',
      'anleitung',
      'so geht\'s',
      'tutorial',
      'wie man',
      'schritt 1',
      'zunächst',
      'danach',
      'abschließend'
    ]

    const contentLower = content.toLowerCase()
    return howToIndicators.some(indicator => contentLower.includes(indicator))
  }

  private generateHowToSchema(article: Article): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: article.title,
      description: article.excerpt || article.metaDescription,
      step: [
        {
          '@type': 'HowToStep',
          name: 'Schritt 1',
          text: 'Geben Sie Ihre Daten in den Rechner ein'
        },
        {
          '@type': 'HowToStep',
          name: 'Schritt 2',
          text: 'Überprüfen Sie die Berechnungsparameter'
        },
        {
          '@type': 'HowToStep',
          name: 'Schritt 3',
          text: 'Analysieren Sie die Ergebnisse'
        }
      ]
    }
  }

  private validateStructuredData(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Grundlegende Validierung
    if (!data['@context']) errors.push('Missing @context')
    if (!data['@type']) errors.push('Missing @type')

    // Spezifische Validierung basierend auf Typ
    if (data['@type'] === 'Article') {
      if (!data.headline) errors.push('Article missing headline')
      if (!data.author) warnings.push('Article missing author')
      if (!data.datePublished) warnings.push('Article missing datePublished')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private calculateSEOValue(link: InternalLink, content: string): number {
    let value = link.relevanceScore

    // 上下文相关性加分
    const contextWords = content.toLowerCase().split(' ')
    const linkWords = link.anchor.toLowerCase().split(' ')
    const commonWords = linkWords.filter(word => contextWords.includes(word))
    value += (commonWords.length / linkWords.length) * 0.3

    // 位置加分（内容前部的链接价值更高）
    const position = content.toLowerCase().indexOf(link.context.toLowerCase())
    const relativePosition = position / content.length
    if (relativePosition < 0.3) value += 0.2

    return Math.min(1, value)
  }

  private async analyzeContentSEO(article: Article): Promise<{ score: number; items: SEOReportItem[] }> {
    const items: SEOReportItem[] = []
    let score = 100

    // 标题分析
    if (!article.title) {
      items.push({ type: 'error', message: 'Titel fehlt', impact: -20 })
      score -= 20
    } else if (article.title.length < 30) {
      items.push({ type: 'warning', message: 'Titel zu kurz', impact: -10 })
      score -= 10
    }

    // 关键词分析
    if (!article.primaryKeyword) {
      items.push({ type: 'warning', message: 'Haupt-Keyword fehlt', impact: -15 })
      score -= 15
    }

    return { score: Math.max(0, score), items }
  }

  private async analyzeTechnicalSEO(article: Article): Promise<{ score: number; items: SEOReportItem[] }> {
    const items: SEOReportItem[] = []
    let score = 100

    // Meta-Beschreibung
    if (!article.metaDescription) {
      items.push({ type: 'error', message: 'Meta-Beschreibung fehlt', impact: -25 })
      score -= 25
    }

    // Slug-Optimierung
    if (article.slug.length > 60) {
      items.push({ type: 'warning', message: 'URL-Slug zu lang', impact: -10 })
      score -= 10
    }

    return { score: Math.max(0, score), items }
  }

  private async analyzeUserExperience(article: Article): Promise<{ score: number; items: SEOReportItem[] }> {
    const items: SEOReportItem[] = []
    let score = 100

    // Lesbarkeit
    if (article.readingTime > 10) {
      items.push({ type: 'info', message: 'Artikel sehr lang', impact: -5 })
      score -= 5
    }

    // Struktur
    const hasHeadings = article.content.includes('<h2>') || article.content.includes('<h3>')
    if (!hasHeadings) {
      items.push({ type: 'warning', message: 'Keine Zwischenüberschriften', impact: -15 })
      score -= 15
    }

    return { score: Math.max(0, score), items }
  }
}

interface SEOReportSection {
  name: string
  score: number
  items: SEOReportItem[]
}

interface SEOReportItem {
  type: 'error' | 'warning' | 'info'
  message: string
  impact: number
}

// Export singleton instance
export const advancedSEOService = AdvancedSEOService.getInstance()
