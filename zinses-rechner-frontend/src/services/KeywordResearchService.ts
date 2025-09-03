/**
 * 德语关键词研究工具
 * 扩展现有德语关键词数据库，提供智能关键词分析和建议
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { germanKeywords, generateKeywordVariants } from '@/utils/seoConfig'

// 关键词建议接口
export interface KeywordSuggestion {
  keyword: string
  searchVolume: number
  competition: 'low' | 'medium' | 'high'
  difficulty: number // 1-100
  relevanceScore: number // 0-1
  category: KeywordCategory
  intent: SearchIntent
  trends: KeywordTrend[]
  relatedKeywords: string[]
}

export type KeywordCategory = 
  | 'primary'
  | 'secondary' 
  | 'longTail'
  | 'local'
  | 'seasonal'
  | 'competitor'
  | 'question'

export type SearchIntent = 
  | 'informational'
  | 'navigational'
  | 'transactional'
  | 'commercial'

export interface KeywordTrend {
  month: string
  volume: number
  interest: number // 0-100
}

export interface KeywordMetrics {
  keyword: string
  avgMonthlySearches: number
  competition: number
  suggestedBid: number
  impressionShare: number
  clickThroughRate: number
}

export interface KeywordCluster {
  mainKeyword: string
  relatedKeywords: string[]
  totalVolume: number
  avgDifficulty: number
  contentGaps: string[]
}

export interface CompetitorKeyword {
  keyword: string
  competitor: string
  position: number
  volume: number
  difficulty: number
  opportunity: 'high' | 'medium' | 'low'
}

// 德语财务关键词扩展数据库
const EXTENDED_GERMAN_KEYWORDS = {
  // 计算器相关
  calculator: [
    'zinsrechner online',
    'compound interest rechner',
    'sparplan simulator',
    'investment calculator deutsch',
    'finanzrechner kostenlos',
    'kapitalwachstum rechner',
    'rendite calculator',
    'zinssatz calculator'
  ],

  // 投资策略
  investment: [
    'geld anlegen strategien',
    'langfristig investieren',
    'portfolio diversifikation',
    'etf sparplan',
    'aktien langzeit',
    'vermögensaufbau plan',
    'investment tipps deutschland',
    'geldanlage vergleich'
  ],

  // 德国税务
  tax: [
    'abgeltungssteuer berechnen',
    'kapitalertragsteuer deutschland',
    'freibetrag kapitalerträge',
    'steueroptimierung geldanlage',
    'kirchensteuer kapitalerträge',
    'freistellungsauftrag',
    'deutsche steuer investment',
    'steuern sparen geldanlage'
  ],

  // 长尾问题关键词
  questions: [
    'wie funktioniert zinseszins',
    'was ist compound interest',
    'wie berechne ich zinsen',
    'welche geldanlage ist sicher',
    'wie viel geld sparen monatlich',
    'ab wann lohnt sich sparen',
    'wie lange geld anlegen',
    'was bringt zinseszins wirklich'
  ],

  // 本地化关键词
  localGerman: [
    'geld anlegen deutschland 2025',
    'deutsche bank zinsen',
    'sparkasse zinssatz',
    'bundesanleihen zinsen',
    'deutsche geldanlage',
    'inflation deutschland auswirkung',
    'ezb zinspolitik auswirkung',
    'deutsche sparer tipps'
  ],

  // 季节性关键词
  seasonal: [
    'jahresendsparen',
    'steuererklaerung kapitalertraege',
    'weihnachtsgeld anlegen',
    'bonus investieren',
    'urlaubsgeld sparen',
    '13. gehalt anlegen',
    'steuernachzahlung vermeiden',
    'jahreswechsel geldanlage'
  ]
}

/**
 * 德语关键词研究服务
 */
export class KeywordResearchService {
  private static instance: KeywordResearchService
  private keywordDatabase: Map<string, KeywordSuggestion> = new Map()
  private isInitialized = false

  private constructor() {}

  static getInstance(): KeywordResearchService {
    if (!KeywordResearchService.instance) {
      KeywordResearchService.instance = new KeywordResearchService()
    }
    return KeywordResearchService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.buildKeywordDatabase()
      this.isInitialized = true
      console.log('✅ KeywordResearchService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize KeywordResearchService:', error)
      throw error
    }
  }

  /**
   * 分析内容并建议关键词
   */
  async analyzeContent(content: string, title: string): Promise<KeywordSuggestion[]> {
    if (!this.isInitialized) await this.initialize()

    const suggestions: KeywordSuggestion[] = []
    const contentLower = `${title} ${content}`.toLowerCase()

    // 分析现有关键词匹配
    for (const [keyword, suggestion] of this.keywordDatabase) {
      const relevanceScore = this.calculateRelevanceScore(keyword, contentLower)
      
      if (relevanceScore > 0.3) {
        suggestions.push({
          ...suggestion,
          relevanceScore
        })
      }
    }

    // 生成新的关键词建议
    const extractedKeywords = this.extractKeywordsFromContent(contentLower)
    for (const keyword of extractedKeywords) {
      if (!this.keywordDatabase.has(keyword)) {
        const suggestion = await this.generateKeywordSuggestion(keyword, contentLower)
        suggestions.push(suggestion)
      }
    }

    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20)
  }

  /**
   * 获取关键词建议
   */
  async getKeywordSuggestions(seedKeyword: string, limit = 50): Promise<KeywordSuggestion[]> {
    if (!this.isInitialized) await this.initialize()

    const suggestions: KeywordSuggestion[] = []
    const seedLower = seedKeyword.toLowerCase()

    // 查找相关关键词
    for (const [keyword, suggestion] of this.keywordDatabase) {
      if (keyword.includes(seedLower) || seedLower.includes(keyword)) {
        suggestions.push(suggestion)
      }
    }

    // 生成变体
    const variants = generateKeywordVariants(seedKeyword)
    for (const variant of variants) {
      if (!this.keywordDatabase.has(variant)) {
        const suggestion = await this.generateKeywordSuggestion(variant, seedKeyword)
        suggestions.push(suggestion)
      }
    }

    return suggestions
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, limit)
  }

  /**
   * 分析关键词难度
   */
  async analyzeKeywordDifficulty(keyword: string): Promise<number> {
    // 基于关键词长度、竞争度等因素计算难度
    const keywordLower = keyword.toLowerCase()
    let difficulty = 50 // 基础难度

    // 长尾关键词难度较低
    if (keyword.split(' ').length >= 3) {
      difficulty -= 20
    }

    // 包含品牌词难度较高
    if (keywordLower.includes('google') || keywordLower.includes('amazon')) {
      difficulty += 30
    }

    // 德语本地化关键词难度适中
    if (keywordLower.includes('deutschland') || keywordLower.includes('deutsch')) {
      difficulty += 10
    }

    // 财务相关关键词竞争激烈
    if (keywordLower.includes('geld') || keywordLower.includes('invest') || keywordLower.includes('steuer')) {
      difficulty += 15
    }

    return Math.max(1, Math.min(100, difficulty))
  }

  /**
   * 获取关键词集群
   */
  async getKeywordClusters(keywords: string[]): Promise<KeywordCluster[]> {
    if (!this.isInitialized) await this.initialize()

    const clusters: KeywordCluster[] = []
    const processed = new Set<string>()

    for (const keyword of keywords) {
      if (processed.has(keyword)) continue

      const relatedKeywords = await this.findRelatedKeywords(keyword)
      const cluster: KeywordCluster = {
        mainKeyword: keyword,
        relatedKeywords: relatedKeywords.slice(0, 10),
        totalVolume: await this.calculateClusterVolume([keyword, ...relatedKeywords]),
        avgDifficulty: await this.calculateAverageDifficulty([keyword, ...relatedKeywords]),
        contentGaps: await this.identifyContentGaps(keyword, relatedKeywords)
      }

      clusters.push(cluster)
      processed.add(keyword)
      relatedKeywords.forEach(k => processed.add(k))
    }

    return clusters.sort((a, b) => b.totalVolume - a.totalVolume)
  }

  /**
   * 分析竞争对手关键词
   */
  async analyzeCompetitorKeywords(competitors: string[]): Promise<CompetitorKeyword[]> {
    // 模拟竞争对手关键词分析
    const competitorKeywords: CompetitorKeyword[] = []

    const commonFinanceKeywords = [
      'zinsrechner',
      'geld anlegen',
      'investment rechner',
      'sparplan',
      'finanzrechner',
      'rendite berechnen'
    ]

    for (const competitor of competitors) {
      for (const keyword of commonFinanceKeywords) {
        competitorKeywords.push({
          keyword,
          competitor,
          position: Math.floor(Math.random() * 10) + 1,
          volume: Math.floor(Math.random() * 10000) + 1000,
          difficulty: Math.floor(Math.random() * 100) + 1,
          opportunity: this.calculateOpportunity(keyword)
        })
      }
    }

    return competitorKeywords.sort((a, b) => a.position - b.position)
  }

  /**
   * 获取搜索趋势
   */
  async getSearchTrends(keyword: string, months = 12): Promise<KeywordTrend[]> {
    const trends: KeywordTrend[] = []
    const currentDate = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
      
      // 模拟趋势数据，实际应该从Google Trends API获取
      const baseVolume = 1000
      const seasonalFactor = this.getSeasonalFactor(keyword, date.getMonth())
      const randomFactor = 0.8 + Math.random() * 0.4 // 0.8-1.2

      trends.push({
        month: monthName,
        volume: Math.floor(baseVolume * seasonalFactor * randomFactor),
        interest: Math.floor(50 + Math.random() * 50) // 50-100
      })
    }

    return trends
  }

  // 私有方法
  private async buildKeywordDatabase(): Promise<void> {
    // 构建扩展的关键词数据库
    const allKeywords = [
      ...germanKeywords.primary,
      ...germanKeywords.secondary,
      ...germanKeywords.longTail,
      ...germanKeywords.local,
      ...EXTENDED_GERMAN_KEYWORDS.calculator,
      ...EXTENDED_GERMAN_KEYWORDS.investment,
      ...EXTENDED_GERMAN_KEYWORDS.tax,
      ...EXTENDED_GERMAN_KEYWORDS.questions,
      ...EXTENDED_GERMAN_KEYWORDS.localGerman,
      ...EXTENDED_GERMAN_KEYWORDS.seasonal
    ]

    for (const keyword of allKeywords) {
      const suggestion = await this.generateKeywordSuggestion(keyword)
      this.keywordDatabase.set(keyword, suggestion)
    }

    console.log(`📊 Built keyword database with ${this.keywordDatabase.size} keywords`)
  }

  private async generateKeywordSuggestion(
    keyword: string, 
    context?: string
  ): Promise<KeywordSuggestion> {
    return {
      keyword,
      searchVolume: this.estimateSearchVolume(keyword),
      competition: this.estimateCompetition(keyword),
      difficulty: await this.analyzeKeywordDifficulty(keyword),
      relevanceScore: context ? this.calculateRelevanceScore(keyword, context) : 0.5,
      category: this.categorizeKeyword(keyword),
      intent: this.determineSearchIntent(keyword),
      trends: await this.getSearchTrends(keyword, 6),
      relatedKeywords: await this.findRelatedKeywords(keyword)
    }
  }

  private calculateRelevanceScore(keyword: string, content: string): number {
    const keywordLower = keyword.toLowerCase()
    const contentLower = content.toLowerCase()

    let score = 0

    // 直接匹配
    if (contentLower.includes(keywordLower)) {
      score += 0.5
    }

    // 词汇匹配
    const keywordWords = keywordLower.split(' ')
    const matchedWords = keywordWords.filter(word => contentLower.includes(word))
    score += (matchedWords.length / keywordWords.length) * 0.3

    // 语义相关性（简化版）
    const relatedTerms = this.getRelatedTerms(keywordLower)
    const relatedMatches = relatedTerms.filter(term => contentLower.includes(term))
    score += (relatedMatches.length / relatedTerms.length) * 0.2

    return Math.min(1, score)
  }

  private extractKeywordsFromContent(content: string): string[] {
    // 简化的关键词提取
    const words = content.split(/\s+/)
    const keywords: string[] = []

    // 提取2-4词的短语
    for (let i = 0; i < words.length - 1; i++) {
      for (let len = 2; len <= Math.min(4, words.length - i); len++) {
        const phrase = words.slice(i, i + len).join(' ')
        if (phrase.length > 5 && this.isRelevantPhrase(phrase)) {
          keywords.push(phrase)
        }
      }
    }

    return [...new Set(keywords)]
  }

  private isRelevantPhrase(phrase: string): boolean {
    const financialTerms = ['geld', 'zins', 'invest', 'spar', 'rechner', 'berechnen', 'anlage', 'kapital']
    return financialTerms.some(term => phrase.includes(term))
  }

  private estimateSearchVolume(keyword: string): number {
    // 基于关键词特征估算搜索量
    let volume = 1000

    if (germanKeywords.primary.includes(keyword)) volume = 5000
    else if (germanKeywords.secondary.includes(keyword)) volume = 2000
    else if (germanKeywords.longTail.includes(keyword)) volume = 500
    else if (keyword.split(' ').length >= 3) volume = 300

    return volume + Math.floor(Math.random() * volume * 0.5)
  }

  private estimateCompetition(keyword: string): 'low' | 'medium' | 'high' {
    if (keyword.split(' ').length >= 4) return 'low'
    if (keyword.includes('rechner') || keyword.includes('calculator')) return 'medium'
    if (keyword.includes('geld') || keyword.includes('invest')) return 'high'
    return 'medium'
  }

  private categorizeKeyword(keyword: string): KeywordCategory {
    if (germanKeywords.primary.includes(keyword)) return 'primary'
    if (germanKeywords.secondary.includes(keyword)) return 'secondary'
    if (germanKeywords.longTail.includes(keyword)) return 'longTail'
    if (germanKeywords.local.includes(keyword)) return 'local'
    if (keyword.includes('?') || keyword.startsWith('wie') || keyword.startsWith('was')) return 'question'
    if (keyword.split(' ').length >= 3) return 'longTail'
    return 'secondary'
  }

  private determineSearchIntent(keyword: string): SearchIntent {
    if (keyword.includes('rechner') || keyword.includes('berechnen')) return 'transactional'
    if (keyword.includes('wie') || keyword.includes('was') || keyword.includes('?')) return 'informational'
    if (keyword.includes('vergleich') || keyword.includes('test')) return 'commercial'
    if (keyword.includes('login') || keyword.includes('anmelden')) return 'navigational'
    return 'informational'
  }

  private async findRelatedKeywords(keyword: string): Promise<string[]> {
    const related: string[] = []
    const keywordLower = keyword.toLowerCase()

    // 查找包含相同词根的关键词
    for (const [dbKeyword] of this.keywordDatabase) {
      if (dbKeyword !== keyword) {
        const commonWords = this.getCommonWords(keywordLower, dbKeyword.toLowerCase())
        if (commonWords.length > 0) {
          related.push(dbKeyword)
        }
      }
    }

    return related.slice(0, 10)
  }

  private getCommonWords(str1: string, str2: string): string[] {
    const words1 = str1.split(' ')
    const words2 = str2.split(' ')
    return words1.filter(word => words2.includes(word) && word.length > 2)
  }

  private getRelatedTerms(keyword: string): string[] {
    const termMap: Record<string, string[]> = {
      'zins': ['zinsen', 'zinssatz', 'verzinsung'],
      'geld': ['kapital', 'vermögen', 'investment'],
      'rechner': ['calculator', 'berechnen', 'tool'],
      'sparen': ['sparplan', 'anlegen', 'investieren']
    }

    const related: string[] = []
    for (const [key, terms] of Object.entries(termMap)) {
      if (keyword.includes(key)) {
        related.push(...terms)
      }
    }

    return related
  }

  private async calculateClusterVolume(keywords: string[]): Promise<number> {
    let totalVolume = 0
    for (const keyword of keywords) {
      totalVolume += this.estimateSearchVolume(keyword)
    }
    return totalVolume
  }

  private async calculateAverageDifficulty(keywords: string[]): Promise<number> {
    let totalDifficulty = 0
    for (const keyword of keywords) {
      totalDifficulty += await this.analyzeKeywordDifficulty(keyword)
    }
    return Math.round(totalDifficulty / keywords.length)
  }

  private async identifyContentGaps(mainKeyword: string, relatedKeywords: string[]): Promise<string[]> {
    // 识别内容空白，实际应该分析现有内容覆盖情况
    const gaps = [
      `${mainKeyword} tutorial`,
      `${mainKeyword} beispiele`,
      `${mainKeyword} vergleich`,
      `${mainKeyword} tipps`
    ]

    return gaps.slice(0, 3)
  }

  private calculateOpportunity(keyword: string): 'high' | 'medium' | 'low' {
    const difficulty = Math.floor(Math.random() * 100)
    const volume = this.estimateSearchVolume(keyword)

    if (difficulty < 30 && volume > 1000) return 'high'
    if (difficulty < 60 && volume > 500) return 'medium'
    return 'low'
  }

  private getSeasonalFactor(keyword: string, month: number): number {
    // 季节性因子，12月和1月财务规划搜索较多
    if (keyword.includes('steuer') && (month === 2 || month === 3)) return 1.5
    if (keyword.includes('sparen') && (month === 11 || month === 0)) return 1.3
    return 1.0
  }
}

// Export singleton instance
export const keywordResearchService = KeywordResearchService.getInstance()
