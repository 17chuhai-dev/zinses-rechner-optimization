/**
 * 税收帮助信息服务
 * 提供德国税收法规的帮助文档、上下文相关的帮助提示和智能引导系统
 */

import { TaxSettings, ETFType, ChurchTaxType, GermanState } from '@/types/GermanTaxTypes'

// 帮助内容类型
export interface HelpContent {
  id: string
  title: string
  content: string
  category: HelpCategory
  tags: string[]
  lastUpdated: Date
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  readingTime: number // 分钟
}

// 帮助类别
export enum HelpCategory {
  BASICS = 'basics',                    // 基础概念
  ABGELTUNGSSTEUER = 'abgeltungssteuer', // 资本利得税
  FREISTELLUNGSAUFTRAG = 'freistellungsauftrag', // 免税额度
  ETF_TEILFREISTELLUNG = 'etf_teilfreistellung', // ETF部分免税
  CHURCH_TAX = 'church_tax',            // 教会税
  CALCULATIONS = 'calculations',         // 计算方法
  EXAMPLES = 'examples',                // 实例说明
  FAQ = 'faq',                         // 常见问题
  REGULATIONS = 'regulations'           // 法规更新
}

// 上下文帮助
export interface ContextualHelp {
  context: string
  title: string
  content: string
  actions?: HelpAction[]
}

// 帮助操作
export interface HelpAction {
  label: string
  action: 'navigate' | 'calculate' | 'external' | 'modal'
  target: string
  data?: any
}

// 计算示例
export interface CalculationExample {
  id: string
  title: string
  description: string
  scenario: string
  inputs: Record<string, any>
  steps: CalculationStep[]
  result: any
  explanation: string
  tips: string[]
}

// 计算步骤
export interface CalculationStep {
  step: number
  description: string
  formula: string
  calculation: string
  result: number
  explanation: string
}

// FAQ项目
export interface FAQItem {
  id: string
  question: string
  answer: string
  category: HelpCategory
  popularity: number
  relatedTopics: string[]
}

/**
 * 税收帮助服务类
 */
export class TaxHelpService {
  private static instance: TaxHelpService
  private helpContent: Map<string, HelpContent> = new Map()
  private contextualHelp: Map<string, ContextualHelp> = new Map()
  private calculationExamples: Map<string, CalculationExample> = new Map()
  private faqItems: Map<string, FAQItem> = new Map()
  private contentUpdateListeners: Map<string, (content: HelpContent) => void> = new Map()
  private initialized: boolean = false

  constructor() {
    // 构造函数中不立即初始化，等待显式调用initialize
    console.log('📚 税收帮助服务已创建')
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.initializeHelpContent()
      this.initializeContextualHelp()
      this.initializeCalculationExamples()
      this.initializeFAQ()
      this.initialized = true
      console.log('📚 税收帮助服务已初始化')
    } catch (error) {
      console.error('税收帮助服务初始化失败:', error)
      throw error
    }
  }

  static getInstance(): TaxHelpService {
    if (!TaxHelpService.instance) {
      TaxHelpService.instance = new TaxHelpService()
    }
    return TaxHelpService.instance
  }

  /**
   * 获取帮助内容
   */
  getHelpContent(id: string): HelpContent | null {
    return this.helpContent.get(id) || null
  }

  /**
   * 按类别获取帮助内容
   */
  getHelpByCategory(category: HelpCategory): HelpContent[] {
    return Array.from(this.helpContent.values())
      .filter(content => content.category === category)
      .sort((a, b) => a.title.localeCompare(b.title, 'de'))
  }

  /**
   * 搜索帮助内容
   */
  searchHelp(query: string): HelpContent[] {
    const searchTerm = query.toLowerCase()
    return Array.from(this.helpContent.values())
      .filter(content =>
        content.title.toLowerCase().includes(searchTerm) ||
        content.content.toLowerCase().includes(searchTerm) ||
        content.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => {
        // 标题匹配优先
        const aTitle = a.title.toLowerCase().includes(searchTerm)
        const bTitle = b.title.toLowerCase().includes(searchTerm)
        if (aTitle && !bTitle) return -1
        if (!aTitle && bTitle) return 1
        return a.title.localeCompare(b.title, 'de')
      })
  }

  /**
   * 获取上下文相关帮助
   */
  getContextualHelp(context: string): ContextualHelp | null {
    return this.contextualHelp.get(context) || null
  }

  /**
   * 注册帮助内容更新监听器
   */
  onHelpContentUpdate(componentId: string, callback: (content: HelpContent) => void): () => void {
    this.contentUpdateListeners.set(componentId, callback)

    // 返回取消订阅函数
    return () => {
      this.contentUpdateListeners.delete(componentId)
    }
  }

  /**
   * 触发帮助内容更新事件
   */
  private notifyContentUpdate(content: HelpContent): void {
    this.contentUpdateListeners.forEach(callback => {
      try {
        callback(content)
      } catch (error) {
        console.error('帮助内容更新回调执行失败:', error)
      }
    })
  }

  /**
   * 获取计算示例
   */
  getCalculationExample(id: string): CalculationExample | null {
    return this.calculationExamples.get(id) || null
  }

  /**
   * 获取所有计算示例
   */
  getAllCalculationExamples(): CalculationExample[] {
    return Array.from(this.calculationExamples.values())
  }

  /**
   * 获取FAQ项目
   */
  getFAQItem(id: string): FAQItem | null {
    return this.faqItems.get(id) || null
  }

  /**
   * 按类别获取FAQ
   */
  getFAQByCategory(category: HelpCategory): FAQItem[] {
    return Array.from(this.faqItems.values())
      .filter(item => item.category === category)
      .sort((a, b) => b.popularity - a.popularity)
  }

  /**
   * 获取热门FAQ
   */
  getPopularFAQ(limit = 10): FAQItem[] {
    return Array.from(this.faqItems.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
  }

  /**
   * 根据用户设置获取个性化帮助
   */
  getPersonalizedHelp(settings: TaxSettings): HelpContent[] {
    const recommendations: HelpContent[] = []

    // 基于用户配置推荐相关帮助
    if (settings.abgeltungssteuer.enabled) {
      const abgeltungssteuerHelp = this.getHelpByCategory(HelpCategory.ABGELTUNGSSTEUER)
      recommendations.push(...abgeltungssteuerHelp.slice(0, 2))
    }

    if (settings.freistellungsauftrag.enabled) {
      const freistellungsauftragHelp = this.getHelpByCategory(HelpCategory.FREISTELLUNGSAUFTRAG)
      recommendations.push(...freistellungsauftragHelp.slice(0, 2))
    }

    if (settings.etfTeilfreistellung.enabled) {
      const etfHelp = this.getHelpByCategory(HelpCategory.ETF_TEILFREISTELLUNG)
      recommendations.push(...etfHelp.slice(0, 2))
    }

    if (settings.userInfo.churchTaxType !== ChurchTaxType.NONE) {
      const churchTaxHelp = this.getHelpByCategory(HelpCategory.CHURCH_TAX)
      recommendations.push(...churchTaxHelp.slice(0, 1))
    }

    return recommendations.slice(0, 6) // 限制推荐数量
  }

  /**
   * 获取智能提示
   */
  getSmartTips(context: string, userInput?: any): string[] {
    const tips: string[] = []

    switch (context) {
      case 'abgeltungssteuer-rate':
        tips.push('Die Abgeltungssteuer beträgt einheitlich 25% auf alle Kapitalerträge.')
        tips.push('Zusätzlich fallen 5,5% Solidaritätszuschlag auf die Abgeltungssteuer an.')
        break

      case 'freistellungsauftrag-amount':
        tips.push('Der jährliche Freibetrag beträgt seit 2023 801€ pro Person.')
        tips.push('Verheiratete können den Freibetrag auf 1.602€ verdoppeln.')
        if (userInput && userInput > 801) {
          tips.push('⚠️ Der eingegebene Betrag überschreitet den maximalen Freibetrag.')
        }
        break

      case 'church-tax-rate':
        tips.push('Die Kirchensteuer beträgt 8% in Bayern und Baden-Württemberg, 9% in allen anderen Bundesländern.')
        tips.push('Die Kirchensteuer wird auf die Abgeltungssteuer erhoben, nicht auf die Kapitalerträge direkt.')
        break

      case 'etf-selection':
        tips.push('Aktien-ETFs haben eine Teilfreistellung von 30%.')
        tips.push('Immobilien-ETFs haben die höchste Teilfreistellung von 60%.')
        tips.push('Renten-ETFs haben keine Teilfreistellung (0%).')
        break
    }

    return tips
  }

  /**
   * 初始化帮助内容
   */
  private initializeHelpContent(): void {
    // 基础概念
    this.helpContent.set('basics-overview', {
      id: 'basics-overview',
      title: 'Grundlagen der Kapitalertragsbesteuerung',
      content: `
        <h3>Was sind Kapitalerträge?</h3>
        <p>Kapitalerträge sind Einkünfte aus Kapitalvermögen, wie Zinsen, Dividenden und Kursgewinne aus dem Verkauf von Wertpapieren.</p>

        <h3>Wie werden Kapitalerträge besteuert?</h3>
        <p>In Deutschland unterliegen Kapitalerträge der Abgeltungssteuer in Höhe von 25%. Zusätzlich fallen 5,5% Solidaritätszuschlag und gegebenenfalls Kirchensteuer an.</p>

        <h3>Was ist der Freibetrag?</h3>
        <p>Jeder Steuerpflichtige hat einen jährlichen Freibetrag von 801€ (seit 2023). Bis zu diesem Betrag bleiben Kapitalerträge steuerfrei.</p>
      `,
      category: HelpCategory.BASICS,
      tags: ['grundlagen', 'kapitalerträge', 'besteuerung'],
      lastUpdated: new Date(),
      difficulty: 'beginner',
      readingTime: 3
    })

    // 资本利得税
    this.helpContent.set('abgeltungssteuer-details', {
      id: 'abgeltungssteuer-details',
      title: 'Abgeltungssteuer im Detail',
      content: `
        <h3>Was ist die Abgeltungssteuer?</h3>
        <p>Die Abgeltungssteuer ist eine Quellensteuer auf Kapitalerträge. Sie beträgt einheitlich 25% und gilt seit 2009.</p>

        <h3>Berechnung der Gesamtsteuer:</h3>
        <ul>
          <li>Abgeltungssteuer: 25%</li>
          <li>Solidaritätszuschlag: 5,5% der Abgeltungssteuer = 1,375%</li>
          <li>Kirchensteuer: 8-9% der Abgeltungssteuer = 2-2,25%</li>
          <li><strong>Gesamtbelastung: 28,375% - 28,625%</strong></li>
        </ul>

        <h3>Beispielrechnung:</h3>
        <p>Bei 1.000€ Kapitalertrag und Kirchensteuerpflicht (9%):</p>
        <ul>
          <li>Abgeltungssteuer: 250€</li>
          <li>Solidaritätszuschlag: 13,75€</li>
          <li>Kirchensteuer: 22,50€</li>
          <li><strong>Gesamtsteuer: 286,25€</strong></li>
        </ul>
      `,
      category: HelpCategory.ABGELTUNGSSTEUER,
      tags: ['abgeltungssteuer', '25%', 'berechnung'],
      lastUpdated: new Date(),
      difficulty: 'intermediate',
      readingTime: 5
    })

    // 免税额度
    this.helpContent.set('freistellungsauftrag-guide', {
      id: 'freistellungsauftrag-guide',
      title: 'Freistellungsauftrag optimal nutzen',
      content: `
        <h3>Was ist ein Freistellungsauftrag?</h3>
        <p>Mit einem Freistellungsauftrag können Sie Ihre Bank anweisen, Kapitalerträge bis zum Freibetrag nicht zu versteuern.</p>

        <h3>Freibeträge 2023:</h3>
        <ul>
          <li>Einzelpersonen: 801€ pro Jahr</li>
          <li>Verheiratete: 1.602€ pro Jahr (gemeinsam veranlagt)</li>
        </ul>

        <h3>Optimale Verteilung:</h3>
        <p>Verteilen Sie Ihren Freibetrag auf die Depots mit den höchsten erwarteten Erträgen:</p>
        <ol>
          <li>Depot mit höchsten Dividendenerträgen</li>
          <li>Depot mit häufigen Verkäufen</li>
          <li>Tagesgeld-/Festgeldkonten</li>
        </ol>

        <h3>Wichtige Hinweise:</h3>
        <ul>
          <li>Der Freibetrag gilt kalenderjährlich</li>
          <li>Nicht genutzte Beträge verfallen zum Jahresende</li>
          <li>Änderungen sind jederzeit möglich</li>
        </ul>
      `,
      category: HelpCategory.FREISTELLUNGSAUFTRAG,
      tags: ['freistellungsauftrag', 'freibetrag', '801€'],
      lastUpdated: new Date(),
      difficulty: 'beginner',
      readingTime: 4
    })

    // ETF部分免税
    this.helpContent.set('etf-teilfreistellung-explained', {
      id: 'etf-teilfreistellung-explained',
      title: 'ETF Teilfreistellung verstehen',
      content: `
        <h3>Was ist die Teilfreistellung?</h3>
        <p>Die Teilfreistellung reduziert die steuerpflichtigen Erträge von Investmentfonds und ETFs um einen bestimmten Prozentsatz.</p>

        <h3>Teilfreistellungssätze:</h3>
        <table>
          <tr><th>Fondstyp</th><th>Teilfreistellung</th></tr>
          <tr><td>Aktienfonds (≥51% Aktien)</td><td>30%</td></tr>
          <tr><td>Mischfonds (≥25% Aktien)</td><td>15%</td></tr>
          <tr><td>Immobilienfonds</td><td>60%</td></tr>
          <tr><td>Rentenfonds</td><td>0%</td></tr>
        </table>

        <h3>Beispielrechnung:</h3>
        <p>1.000€ Gewinn aus Aktien-ETF:</p>
        <ul>
          <li>Teilfreistellung: 30% = 300€</li>
          <li>Steuerpflichtiger Gewinn: 700€</li>
          <li>Steuer (28,625%): 200,38€</li>
          <li><strong>Ersparnis durch Teilfreistellung: 85,88€</strong></li>
        </ul>

        <h3>Steueroptimierung:</h3>
        <ul>
          <li>Bevorzugen Sie Aktien-ETFs für bessere Steuereffizienz</li>
          <li>Immobilien-ETFs haben die höchste Teilfreistellung</li>
          <li>Vermeiden Sie reine Renten-ETFs in steuerpflichtigen Depots</li>
        </ul>
      `,
      category: HelpCategory.ETF_TEILFREISTELLUNG,
      tags: ['etf', 'teilfreistellung', 'steueroptimierung'],
      lastUpdated: new Date(),
      difficulty: 'intermediate',
      readingTime: 6
    })
  }

  /**
   * 初始化上下文帮助
   */
  private initializeContextualHelp(): void {
    this.contextualHelp.set('tax-rate-input', {
      context: 'tax-rate-input',
      title: 'Steuersatz eingeben',
      content: 'Die Abgeltungssteuer beträgt einheitlich 25%. Zusätzlich fallen Solidaritätszuschlag (5,5%) und ggf. Kirchensteuer (8-9%) an.',
      actions: [
        {
          label: 'Mehr über Abgeltungssteuer',
          action: 'modal',
          target: 'abgeltungssteuer-details'
        }
      ]
    })

    this.contextualHelp.set('allowance-input', {
      context: 'allowance-input',
      title: 'Freibetrag nutzen',
      content: 'Seit 2023 beträgt der jährliche Freibetrag 801€ pro Person. Verheiratete können gemeinsam 1.602€ geltend machen.',
      actions: [
        {
          label: 'Freistellungsauftrag Guide',
          action: 'modal',
          target: 'freistellungsauftrag-guide'
        },
        {
          label: 'Freibetrag berechnen',
          action: 'calculate',
          target: 'allowance-calculator'
        }
      ]
    })

    this.contextualHelp.set('etf-type-selection', {
      context: 'etf-type-selection',
      title: 'ETF-Typ wählen',
      content: 'Verschiedene ETF-Typen haben unterschiedliche Teilfreistellungssätze. Aktien-ETFs (30%) und Immobilien-ETFs (60%) sind steuerlich vorteilhaft.',
      actions: [
        {
          label: 'ETF Teilfreistellung erklärt',
          action: 'modal',
          target: 'etf-teilfreistellung-explained'
        }
      ]
    })
  }

  /**
   * 初始化计算示例
   */
  private initializeCalculationExamples(): void {
    this.calculationExamples.set('basic-tax-calculation', {
      id: 'basic-tax-calculation',
      title: 'Grundlegende Steuerberechnung',
      description: 'Berechnung der Abgeltungssteuer auf Kapitalerträge',
      scenario: 'Sie haben 2.000€ Kapitalerträge und sind kirchensteuerpflichtig (9%)',
      inputs: {
        capitalGains: 2000,
        allowanceUsed: 801,
        churchTaxRate: 0.09,
        includeSolidarityTax: true,
        includeChurchTax: true
      },
      steps: [
        {
          step: 1,
          description: 'Freibetrag abziehen',
          formula: 'Kapitalertrag - Freibetrag',
          calculation: '2.000€ - 801€',
          result: 1199,
          explanation: 'Der Freibetrag von 801€ wird von den Kapitalerträgen abgezogen'
        },
        {
          step: 2,
          description: 'Abgeltungssteuer berechnen',
          formula: 'Steuerpflichtiger Betrag × 25%',
          calculation: '1.199€ × 0,25',
          result: 299.75,
          explanation: 'Auf den steuerpflichtigen Betrag wird die Abgeltungssteuer von 25% erhoben'
        },
        {
          step: 3,
          description: 'Solidaritätszuschlag berechnen',
          formula: 'Abgeltungssteuer × 5,5%',
          calculation: '299,75€ × 0,055',
          result: 16.49,
          explanation: 'Der Solidaritätszuschlag wird auf die Abgeltungssteuer erhoben'
        },
        {
          step: 4,
          description: 'Kirchensteuer berechnen',
          formula: 'Abgeltungssteuer × 9%',
          calculation: '299,75€ × 0,09',
          result: 26.98,
          explanation: 'Die Kirchensteuer wird ebenfalls auf die Abgeltungssteuer erhoben'
        }
      ],
      result: {
        totalTax: 343.22,
        netIncome: 1656.78,
        effectiveTaxRate: 17.16
      },
      explanation: 'Die Gesamtsteuerbelastung beträgt 343,22€, was einer effektiven Steuerrate von 17,16% entspricht.',
      tips: [
        'Nutzen Sie Ihren Freibetrag optimal aus',
        'Bei hohen Erträgen kann ein Kirchenaustritt steuerlich vorteilhaft sein',
        'Verteilen Sie Verkäufe über mehrere Jahre, um den Freibetrag mehrfach zu nutzen'
      ]
    })
  }

  /**
   * 初始化FAQ
   */
  private initializeFAQ(): void {
    this.faqItems.set('faq-1', {
      id: 'faq-1',
      question: 'Wie hoch ist die Abgeltungssteuer?',
      answer: 'Die Abgeltungssteuer beträgt einheitlich 25% auf alle Kapitalerträge. Zusätzlich fallen 5,5% Solidaritätszuschlag und gegebenenfalls 8-9% Kirchensteuer an.',
      category: HelpCategory.ABGELTUNGSSTEUER,
      popularity: 95,
      relatedTopics: ['abgeltungssteuer', 'steuersatz', 'kirchensteuer']
    })

    this.faqItems.set('faq-2', {
      id: 'faq-2',
      question: 'Wie hoch ist der Freibetrag für Kapitalerträge?',
      answer: 'Der jährliche Freibetrag beträgt seit 2023 801€ pro Person. Verheiratete können bei gemeinsamer Veranlagung 1.602€ geltend machen.',
      category: HelpCategory.FREISTELLUNGSAUFTRAG,
      popularity: 88,
      relatedTopics: ['freibetrag', 'freistellungsauftrag', '801€']
    })

    this.faqItems.set('faq-3', {
      id: 'faq-3',
      question: 'Was ist die ETF Teilfreistellung?',
      answer: 'Die Teilfreistellung reduziert die steuerpflichtigen Erträge von ETFs. Aktien-ETFs haben 30%, Immobilien-ETFs 60% und Renten-ETFs 0% Teilfreistellung.',
      category: HelpCategory.ETF_TEILFREISTELLUNG,
      popularity: 76,
      relatedTopics: ['etf', 'teilfreistellung', 'steueroptimierung']
    })
  }
}

// 导出单例实例
export const taxHelpService = TaxHelpService.getInstance()
