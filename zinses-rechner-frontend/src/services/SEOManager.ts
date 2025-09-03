/**
 * SEO管理器
 * 实现完整的SEO优化功能，包括结构化数据、元标签优化、站点地图生成等
 */

import { ref, reactive } from 'vue'

// SEO配置接口
export interface SEOConfig {
  siteName: string
  siteDescription: string
  siteUrl: string
  defaultTitle: string
  titleTemplate: string
  defaultImage: string
  twitterHandle: string
  facebookAppId: string
  enableStructuredData: boolean
  enableOpenGraph: boolean
  enableTwitterCards: boolean
  enableSitemap: boolean
  enableRobotsTxt: boolean
  language: string
  region: string
}

// 页面SEO数据接口
export interface PageSEOData {
  title: string
  description: string
  keywords: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product' | 'calculator'
  publishedTime?: Date
  modifiedTime?: Date
  author?: string
  section?: string
  tags?: string[]
  breadcrumbs?: Array<{ name: string; url: string }>
  calculatorData?: {
    inputParameters: string[]
    outputResults: string[]
    calculationType: string
    complexity: 'simple' | 'intermediate' | 'advanced'
  }
}

// 结构化数据类型
export interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: any
}

// SEO统计接口
export interface SEOStats {
  totalPages: number
  optimizedPages: number
  missingTitles: number
  missingDescriptions: number
  duplicateTitles: number
  duplicateDescriptions: number
  averageTitleLength: number
  averageDescriptionLength: number
  structuredDataPages: number
  sitemapEntries: number
}

/**
 * SEO管理器类
 */
export class SEOManager {
  private static instance: SEOManager

  // SEO配置
  private config: SEOConfig = {
    siteName: 'Zinses Rechner',
    siteDescription: 'Professioneller Zinsrechner für präzise Finanzberechnungen. Berechnen Sie Zinsen, Zinseszinsen und Renditen mit unserem benutzerfreundlichen Online-Tool.',
    siteUrl: 'https://zinses-rechner.de',
    defaultTitle: 'Zinses Rechner - Professioneller Online Zinsrechner',
    titleTemplate: '%s | Zinses Rechner',
    defaultImage: '/images/og-default.jpg',
    twitterHandle: '@ZinsesRechner',
    facebookAppId: '',
    enableStructuredData: true,
    enableOpenGraph: true,
    enableTwitterCards: true,
    enableSitemap: true,
    enableRobotsTxt: true,
    language: 'de',
    region: 'DE'
  }

  // 页面SEO数据缓存
  private pageDataCache = new Map<string, PageSEOData>()

  // SEO统计
  public readonly stats = reactive<SEOStats>({
    totalPages: 0,
    optimizedPages: 0,
    missingTitles: 0,
    missingDescriptions: 0,
    duplicateTitles: 0,
    duplicateDescriptions: 0,
    averageTitleLength: 0,
    averageDescriptionLength: 0,
    structuredDataPages: 0,
    sitemapEntries: 0
  })

  // 状态
  public readonly isEnabled = ref(true)
  public readonly lastUpdate = ref<Date>(new Date())

  public static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager()
    }
    return SEOManager.instance
  }

  constructor() {
    this.initializeSEO()
  }

  /**
   * 初始化SEO系统
   */
  private initializeSEO(): void {
    // 设置基础元标签
    this.setupBasicMetaTags()

    // 设置结构化数据
    if (this.config.enableStructuredData) {
      this.setupWebsiteStructuredData()
    }

    // 生成robots.txt
    if (this.config.enableRobotsTxt) {
      this.generateRobotsTxt()
    }

    console.log('🔍 SEO manager initialized')
  }

  /**
   * 设置页面SEO数据
   */
  public setPageSEO(path: string, data: PageSEOData): void {
    // 缓存页面数据
    this.pageDataCache.set(path, data)

    // 更新页面标题
    this.updatePageTitle(data.title)

    // 更新元标签
    this.updateMetaTags(data)

    // 更新Open Graph标签
    if (this.config.enableOpenGraph) {
      this.updateOpenGraphTags(data)
    }

    // 更新Twitter Cards
    if (this.config.enableTwitterCards) {
      this.updateTwitterCardTags(data)
    }

    // 更新结构化数据
    if (this.config.enableStructuredData) {
      this.updateStructuredData(data)
    }

    // 更新面包屑导航
    if (data.breadcrumbs) {
      this.updateBreadcrumbStructuredData(data.breadcrumbs)
    }

    this.updateStats()
    this.lastUpdate.value = new Date()

    console.log(`🔍 SEO updated for page: ${path}`)
  }

  /**
   * 获取页面SEO数据
   */
  public getPageSEO(path: string): PageSEOData | null {
    return this.pageDataCache.get(path) || null
  }

  /**
   * 生成站点地图
   */
  public generateSitemap(): string {
    const urls: string[] = []
    const baseUrl = this.config.siteUrl

    // 添加主要页面
    const mainPages = [
      { path: '/', priority: '1.0', changefreq: 'weekly' },
      { path: '/calculator', priority: '0.9', changefreq: 'monthly' },
      { path: '/about', priority: '0.7', changefreq: 'monthly' },
      { path: '/help', priority: '0.6', changefreq: 'monthly' },
      { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
      { path: '/terms', priority: '0.5', changefreq: 'yearly' }
    ]

    for (const page of mainPages) {
      urls.push(`
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
    }

    // 添加缓存的页面
    for (const [path, data] of this.pageDataCache.entries()) {
      if (path !== '/') {
        const lastmod = data.modifiedTime || new Date()
        urls.push(`
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
      }
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`

    this.stats.sitemapEntries = urls.length
    return sitemap
  }

  /**
   * 生成robots.txt
   */
  public generateRobotsTxt(): string {
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.config.siteUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow sensitive areas
Disallow: /admin/
Disallow: /api/
Disallow: /*.json$
Disallow: /*?*

# Allow important resources
Allow: /css/
Allow: /js/
Allow: /images/
Allow: /fonts/`

    return robotsTxt
  }

  /**
   * 验证SEO数据
   */
  public validateSEO(data: PageSEOData): {
    isValid: boolean
    warnings: string[]
    errors: string[]
    suggestions: string[]
  } {
    const warnings: string[] = []
    const errors: string[] = []
    const suggestions: string[] = []

    // 验证标题
    if (!data.title) {
      errors.push('Seitentitel fehlt')
    } else {
      if (data.title.length < 30) {
        warnings.push('Seitentitel ist zu kurz (< 30 Zeichen)')
      }
      if (data.title.length > 60) {
        warnings.push('Seitentitel ist zu lang (> 60 Zeichen)')
      }
    }

    // 验证描述
    if (!data.description) {
      errors.push('Meta-Beschreibung fehlt')
    } else {
      if (data.description.length < 120) {
        warnings.push('Meta-Beschreibung ist zu kurz (< 120 Zeichen)')
      }
      if (data.description.length > 160) {
        warnings.push('Meta-Beschreibung ist zu lang (> 160 Zeichen)')
      }
    }

    // 验证关键词
    if (!data.keywords || data.keywords.length === 0) {
      suggestions.push('Fügen Sie relevante Keywords hinzu')
    } else if (data.keywords.length > 10) {
      warnings.push('Zu viele Keywords (> 10)')
    }

    // 验证图片
    if (!data.image) {
      suggestions.push('Fügen Sie ein Open Graph Bild hinzu')
    }

    // 验证URL
    if (data.url && !this.isValidUrl(data.url)) {
      errors.push('Ungültige URL-Format')
    }

    const isValid = errors.length === 0

    return { isValid, warnings, errors, suggestions }
  }

  /**
   * 分析竞争对手SEO
   */
  public analyzeCompetitorSEO(competitorUrls: string[]): Promise<Array<{
    url: string
    title: string
    description: string
    keywords: string[]
    structuredData: boolean
    performance: number
  }>> {
    // 模拟竞争对手分析（实际应用中需要使用真实的爬虫或API）
    return Promise.resolve(competitorUrls.map(url => ({
      url,
      title: `Competitor Title for ${url}`,
      description: `Competitor description for ${url}`,
      keywords: ['zinsrechner', 'zinsen', 'berechnung', 'finanzen'],
      structuredData: Math.random() > 0.5,
      performance: Math.floor(Math.random() * 100)
    })))
  }

  /**
   * 生成SEO报告
   */
  public generateSEOReport(): {
    overview: SEOStats
    pages: Array<{
      path: string
      data: PageSEOData
      validation: ReturnType<typeof this.validateSEO>
    }>
    recommendations: string[]
    technicalSEO: {
      sitemap: boolean
      robotsTxt: boolean
      structuredData: boolean
      metaTags: boolean
      openGraph: boolean
    }
  } {
    const pages = Array.from(this.pageDataCache.entries()).map(([path, data]) => ({
      path,
      data,
      validation: this.validateSEO(data)
    }))

    const recommendations = this.generateSEORecommendations()

    return {
      overview: { ...this.stats },
      pages,
      recommendations,
      technicalSEO: {
        sitemap: this.config.enableSitemap,
        robotsTxt: this.config.enableRobotsTxt,
        structuredData: this.config.enableStructuredData,
        metaTags: true,
        openGraph: this.config.enableOpenGraph
      }
    }
  }

  /**
   * 更新SEO配置
   */
  public updateConfig(newConfig: Partial<SEOConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 重新初始化相关功能
    if (newConfig.enableStructuredData !== undefined) {
      if (newConfig.enableStructuredData) {
        this.setupWebsiteStructuredData()
      } else {
        this.removeStructuredData()
      }
    }

    console.log('🔍 SEO config updated')
  }

  /**
   * 获取SEO配置
   */
  public getConfig(): SEOConfig {
    return { ...this.config }
  }

  // 私有方法

  /**
   * 设置基础元标签
   */
  private setupBasicMetaTags(): void {
    this.setMetaTag('description', this.config.siteDescription)
    this.setMetaTag('keywords', 'zinsrechner, zinsen berechnen, zinseszins, finanzrechner, online rechner')
    this.setMetaTag('author', 'Zinses Rechner Team')
    this.setMetaTag('robots', 'index, follow')
    this.setMetaTag('language', this.config.language)
    this.setMetaTag('revisit-after', '7 days')

    // 设置语言和地区
    this.setMetaTag('http-equiv', 'content-language', this.config.language)
    this.setMetaTag('name', 'geo.region', this.config.region)
    this.setMetaTag('name', 'geo.country', this.config.region)

    // 设置移动端优化
    this.setMetaTag('name', 'viewport', 'width=device-width, initial-scale=1.0')
    this.setMetaTag('name', 'mobile-web-app-capable', 'yes')
    this.setMetaTag('name', 'apple-mobile-web-app-capable', 'yes')
  }

  /**
   * 更新页面标题
   */
  private updatePageTitle(title: string): void {
    const fullTitle = title === this.config.defaultTitle 
      ? title 
      : this.config.titleTemplate.replace('%s', title)
    
    document.title = fullTitle
  }

  /**
   * 更新元标签
   */
  private updateMetaTags(data: PageSEOData): void {
    this.setMetaTag('description', data.description)
    
    if (data.keywords && data.keywords.length > 0) {
      this.setMetaTag('keywords', data.keywords.join(', '))
    }

    if (data.author) {
      this.setMetaTag('author', data.author)
    }

    // 设置规范URL
    if (data.url) {
      this.setLinkTag('canonical', data.url)
    }
  }

  /**
   * 更新Open Graph标签
   */
  private updateOpenGraphTags(data: PageSEOData): void {
    this.setMetaTag('property', 'og:title', data.title)
    this.setMetaTag('property', 'og:description', data.description)
    this.setMetaTag('property', 'og:type', data.type || 'website')
    this.setMetaTag('property', 'og:site_name', this.config.siteName)
    this.setMetaTag('property', 'og:locale', this.config.language + '_' + this.config.region)

    if (data.url) {
      this.setMetaTag('property', 'og:url', data.url)
    }

    if (data.image) {
      this.setMetaTag('property', 'og:image', data.image)
      this.setMetaTag('property', 'og:image:alt', data.title)
    } else {
      this.setMetaTag('property', 'og:image', this.config.defaultImage)
    }

    if (data.publishedTime) {
      this.setMetaTag('property', 'article:published_time', data.publishedTime.toISOString())
    }

    if (data.modifiedTime) {
      this.setMetaTag('property', 'article:modified_time', data.modifiedTime.toISOString())
    }

    if (data.section) {
      this.setMetaTag('property', 'article:section', data.section)
    }

    if (data.tags) {
      data.tags.forEach(tag => {
        this.setMetaTag('property', 'article:tag', tag)
      })
    }

    if (this.config.facebookAppId) {
      this.setMetaTag('property', 'fb:app_id', this.config.facebookAppId)
    }
  }

  /**
   * 更新Twitter Card标签
   */
  private updateTwitterCardTags(data: PageSEOData): void {
    this.setMetaTag('name', 'twitter:card', 'summary_large_image')
    this.setMetaTag('name', 'twitter:title', data.title)
    this.setMetaTag('name', 'twitter:description', data.description)

    if (this.config.twitterHandle) {
      this.setMetaTag('name', 'twitter:site', this.config.twitterHandle)
      this.setMetaTag('name', 'twitter:creator', this.config.twitterHandle)
    }

    if (data.image) {
      this.setMetaTag('name', 'twitter:image', data.image)
      this.setMetaTag('name', 'twitter:image:alt', data.title)
    } else {
      this.setMetaTag('name', 'twitter:image', this.config.defaultImage)
    }
  }

  /**
   * 设置网站结构化数据
   */
  private setupWebsiteStructuredData(): void {
    const websiteData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': this.config.siteName,
      'description': this.config.siteDescription,
      'url': this.config.siteUrl,
      'inLanguage': this.config.language,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': this.config.siteUrl + '/search?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    }

    this.setStructuredData('website', websiteData)
  }

  /**
   * 更新结构化数据
   */
  private updateStructuredData(data: PageSEOData): void {
    if (data.calculatorData) {
      const calculatorData: StructuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': data.title,
        'description': data.description,
        'url': data.url || window.location.href,
        'applicationCategory': 'FinanceApplication',
        'operatingSystem': 'Web Browser',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'EUR'
        },
        'featureList': data.calculatorData.inputParameters,
        'softwareVersion': '1.0',
        'datePublished': data.publishedTime?.toISOString(),
        'dateModified': data.modifiedTime?.toISOString()
      }

      this.setStructuredData('calculator', calculatorData)
    }

    // 添加文章结构化数据（如果适用）
    if (data.type === 'article') {
      const articleData: StructuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': data.title,
        'description': data.description,
        'url': data.url || window.location.href,
        'datePublished': data.publishedTime?.toISOString(),
        'dateModified': data.modifiedTime?.toISOString(),
        'author': {
          '@type': 'Person',
          'name': data.author || 'Zinses Rechner Team'
        },
        'publisher': {
          '@type': 'Organization',
          'name': this.config.siteName,
          'url': this.config.siteUrl
        }
      }

      if (data.image) {
        articleData.image = data.image
      }

      this.setStructuredData('article', articleData)
    }
  }

  /**
   * 更新面包屑结构化数据
   */
  private updateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>): void {
    const breadcrumbData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': crumb.name,
        'item': crumb.url
      }))
    }

    this.setStructuredData('breadcrumb', breadcrumbData)
  }

  /**
   * 设置元标签
   */
  private setMetaTag(attribute: string, value: string): void
  private setMetaTag(attribute: string, attributeValue: string, content: string): void
  private setMetaTag(attribute: string, valueOrAttributeValue: string, content?: string): void {
    const isNameAttribute = content !== undefined
    const attributeValue = isNameAttribute ? valueOrAttributeValue : undefined
    const contentValue = isNameAttribute ? content : valueOrAttributeValue

    let meta = document.querySelector(
      isNameAttribute 
        ? `meta[${attribute}="${attributeValue}"]`
        : `meta[${attribute}]`
    ) as HTMLMetaElement

    if (!meta) {
      meta = document.createElement('meta')
      if (isNameAttribute) {
        meta.setAttribute(attribute, attributeValue!)
      }
      document.head.appendChild(meta)
    }

    if (isNameAttribute) {
      meta.content = contentValue!
    } else {
      meta.setAttribute(attribute, contentValue!)
    }
  }

  /**
   * 设置链接标签
   */
  private setLinkTag(rel: string, href: string): void {
    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement

    if (!link) {
      link = document.createElement('link')
      link.rel = rel
      document.head.appendChild(link)
    }

    link.href = href
  }

  /**
   * 设置结构化数据
   */
  private setStructuredData(id: string, data: StructuredData): void {
    let script = document.querySelector(`script[data-seo-id="${id}"]`) as HTMLScriptElement

    if (!script) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-seo-id', id)
      document.head.appendChild(script)
    }

    script.textContent = JSON.stringify(data, null, 2)
  }

  /**
   * 移除结构化数据
   */
  private removeStructuredData(): void {
    const scripts = document.querySelectorAll('script[data-seo-id]')
    scripts.forEach(script => script.remove())
  }

  /**
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const pages = Array.from(this.pageDataCache.values())
    
    this.stats.totalPages = pages.length
    this.stats.optimizedPages = pages.filter(page => 
      page.title && page.description && page.keywords && page.keywords.length > 0
    ).length
    
    this.stats.missingTitles = pages.filter(page => !page.title).length
    this.stats.missingDescriptions = pages.filter(page => !page.description).length
    
    // 计算平均长度
    const titlesWithLength = pages.filter(page => page.title)
    const descriptionsWithLength = pages.filter(page => page.description)
    
    this.stats.averageTitleLength = titlesWithLength.length > 0
      ? titlesWithLength.reduce((sum, page) => sum + page.title.length, 0) / titlesWithLength.length
      : 0
    
    this.stats.averageDescriptionLength = descriptionsWithLength.length > 0
      ? descriptionsWithLength.reduce((sum, page) => sum + page.description.length, 0) / descriptionsWithLength.length
      : 0

    this.stats.structuredDataPages = pages.filter(page => 
      page.calculatorData || page.type === 'article'
    ).length
  }

  /**
   * 生成SEO建议
   */
  private generateSEORecommendations(): string[] {
    const recommendations: string[] = []
    
    if (this.stats.missingTitles > 0) {
      recommendations.push(`${this.stats.missingTitles} Seiten haben keine Titel`)
    }
    
    if (this.stats.missingDescriptions > 0) {
      recommendations.push(`${this.stats.missingDescriptions} Seiten haben keine Meta-Beschreibungen`)
    }
    
    if (this.stats.averageTitleLength < 30) {
      recommendations.push('Titel sind im Durchschnitt zu kurz')
    }
    
    if (this.stats.averageTitleLength > 60) {
      recommendations.push('Titel sind im Durchschnitt zu lang')
    }
    
    if (this.stats.averageDescriptionLength < 120) {
      recommendations.push('Meta-Beschreibungen sind im Durchschnitt zu kurz')
    }
    
    if (this.stats.averageDescriptionLength > 160) {
      recommendations.push('Meta-Beschreibungen sind im Durchschnitt zu lang')
    }
    
    if (!this.config.enableStructuredData) {
      recommendations.push('Aktivieren Sie strukturierte Daten für bessere Suchmaschinenoptimierung')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('SEO-Status ist gut - keine Verbesserungen erforderlich')
    }
    
    return recommendations
  }
}

// 导出单例实例
export const seoManager = SEOManager.getInstance()

// 便捷的组合式API
export function useSEO() {
  const manager = SEOManager.getInstance()
  
  return {
    // 状态
    stats: manager.stats,
    isEnabled: manager.isEnabled,
    lastUpdate: manager.lastUpdate,
    
    // 方法
    setPageSEO: manager.setPageSEO.bind(manager),
    getPageSEO: manager.getPageSEO.bind(manager),
    generateSitemap: manager.generateSitemap.bind(manager),
    generateRobotsTxt: manager.generateRobotsTxt.bind(manager),
    validateSEO: manager.validateSEO.bind(manager),
    analyzeCompetitorSEO: manager.analyzeCompetitorSEO.bind(manager),
    generateSEOReport: manager.generateSEOReport.bind(manager),
    updateConfig: manager.updateConfig.bind(manager),
    getConfig: manager.getConfig.bind(manager)
  }
}
