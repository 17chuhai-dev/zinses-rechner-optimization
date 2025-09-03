/**
 * AI财务顾问服务
 * 提供智能投资建议、风险评估和财务规划建议
 */

import type { CalculationResult } from '@/types/calculator'

// AI建议类型定义
export interface AIRecommendation {
  id: string
  type: 'investment' | 'risk' | 'planning' | 'optimization' | 'warning'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  reasoning: string
  actionItems: string[]
  expectedImpact: {
    financial: number // 预期财务影响（欧元）
    risk: 'decrease' | 'neutral' | 'increase'
    timeframe: string // 时间框架
  }
  confidence: number // 置信度 (0-100)
  tags: string[]
  relatedCalculators?: string[]
}

export interface UserProfile {
  age: number
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  investmentExperience: 'beginner' | 'intermediate' | 'advanced'
  financialGoals: string[]
  timeHorizon: number // 投资期限（年）
  monthlyIncome: number
  monthlyExpenses: number
  currentAssets: number
  currentDebt: number
  dependents: number
}

export interface MarketContext {
  currentInterestRates: {
    ecb: number // 欧洲央行利率
    government10y: number // 10年期国债收益率
    mortgage: number // 房贷利率
  }
  marketConditions: {
    volatilityIndex: number // 波动率指数
    marketTrend: 'bullish' | 'bearish' | 'neutral'
    economicIndicators: {
      inflation: number
      unemployment: number
      gdpGrowth: number
    }
  }
  sectorPerformance: Record<string, number>
}

export class AIAdvisorService {
  private static instance: AIAdvisorService
  private knowledgeBase: Map<string, any> = new Map()
  private userProfiles: Map<string, UserProfile> = new Map()

  private constructor() {
    this.initializeKnowledgeBase()
  }

  public static getInstance(): AIAdvisorService {
    if (!AIAdvisorService.instance) {
      AIAdvisorService.instance = new AIAdvisorService()
    }
    return AIAdvisorService.instance
  }

  /**
   * 初始化知识库
   */
  private initializeKnowledgeBase() {
    // 投资规则库
    this.knowledgeBase.set('investment_rules', {
      age_based_allocation: {
        conservative: (age: number) => Math.max(20, 100 - age), // 股票配置比例
        moderate: (age: number) => Math.max(30, 110 - age),
        aggressive: (age: number) => Math.max(40, 120 - age)
      },
      emergency_fund: {
        minimum_months: 3,
        recommended_months: 6,
        conservative_months: 12
      },
      debt_priorities: [
        { type: 'credit_card', priority: 1, threshold: 15 },
        { type: 'personal_loan', priority: 2, threshold: 8 },
        { type: 'mortgage', priority: 3, threshold: 4 }
      ]
    })

    // 风险评估规则
    this.knowledgeBase.set('risk_rules', {
      debt_to_income_thresholds: {
        low: 0.2,
        medium: 0.36,
        high: 0.5
      },
      liquidity_ratios: {
        minimum: 0.1,
        recommended: 0.2,
        conservative: 0.3
      },
      concentration_limits: {
        single_stock: 0.05,
        single_sector: 0.15,
        single_country: 0.3
      }
    })

    // 市场洞察规则
    this.knowledgeBase.set('market_insights', {
      interest_rate_impact: {
        rising: {
          bonds: 'negative',
          stocks: 'mixed',
          real_estate: 'negative',
          cash: 'positive'
        },
        falling: {
          bonds: 'positive',
          stocks: 'positive',
          real_estate: 'positive',
          cash: 'negative'
        }
      },
      inflation_hedges: ['real_estate', 'commodities', 'inflation_bonds', 'stocks'],
      recession_indicators: ['inverted_yield_curve', 'high_unemployment', 'declining_gdp']
    })
  }

  /**
   * 生成综合财务建议
   */
  public async generateRecommendations(
    calculationResult: CalculationResult,
    userProfile: UserProfile,
    marketContext?: MarketContext
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []

    try {
      // 1. 投资组合建议
      const portfolioRecommendations = await this.analyzePortfolio(calculationResult, userProfile, marketContext)
      recommendations.push(...portfolioRecommendations)

      // 2. 风险评估建议
      const riskRecommendations = await this.assessRisk(calculationResult, userProfile)
      recommendations.push(...riskRecommendations)

      // 3. 财务规划建议
      const planningRecommendations = await this.generatePlanningAdvice(calculationResult, userProfile)
      recommendations.push(...planningRecommendations)

      // 4. 优化建议
      const optimizationRecommendations = await this.findOptimizations(calculationResult, userProfile)
      recommendations.push(...optimizationRecommendations)

      // 5. 市场时机建议
      if (marketContext) {
        const timingRecommendations = await this.analyzeMarketTiming(userProfile, marketContext)
        recommendations.push(...timingRecommendations)
      }

      // 按优先级排序
      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

    } catch (error) {
      console.error('AI建议生成失败:', error)
      return this.getFallbackRecommendations(userProfile)
    }
  }

  /**
   * 分析投资组合
   */
  private async analyzePortfolio(
    result: CalculationResult,
    profile: UserProfile,
    marketContext?: MarketContext
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []
    const rules = this.knowledgeBase.get('investment_rules')

    // 年龄基础资产配置建议
    const recommendedStockAllocation = rules.age_based_allocation[profile.riskTolerance](profile.age)
    
    recommendations.push({
      id: `portfolio_allocation_${Date.now()}`,
      type: 'investment',
      priority: 'high',
      title: 'Optimale Asset-Allokation',
      description: `Basierend auf Ihrem Alter (${profile.age}) und Risikoprofil (${profile.riskTolerance}) empfehlen wir eine Aktienquote von ${recommendedStockAllocation}%.`,
      reasoning: 'Die Asset-Allokation sollte Ihr Alter, Ihre Risikotoleranz und Ihren Anlagehorizont berücksichtigen. Jüngere Anleger können mehr Risiko eingehen.',
      actionItems: [
        `Aktienanteil auf ${recommendedStockAllocation}% anpassen`,
        `Anleihenanteil auf ${100 - recommendedStockAllocation}% setzen`,
        'Diversifikation über verschiedene Regionen und Sektoren'
      ],
      expectedImpact: {
        financial: result.totalInterest * 0.15, // 15% Verbesserung geschätzt
        risk: profile.riskTolerance === 'conservative' ? 'decrease' : 'neutral',
        timeframe: `${profile.timeHorizon} Jahre`
      },
      confidence: 85,
      tags: ['asset-allocation', 'diversification', 'age-appropriate'],
      relatedCalculators: ['portfolio-analysis']
    })

    // Notfallfonds-Empfehlung
    const emergencyFundNeeded = profile.monthlyExpenses * rules.emergency_fund.recommended_months
    const currentLiquidity = result.totalContributions * 0.1 // Annahme: 10% liquide

    if (currentLiquidity < emergencyFundNeeded) {
      recommendations.push({
        id: `emergency_fund_${Date.now()}`,
        type: 'planning',
        priority: 'high',
        title: 'Notfallfonds aufbauen',
        description: `Ihr Notfallfonds sollte ${emergencyFundNeeded.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} betragen (6 Monatsausgaben).`,
        reasoning: 'Ein ausreichender Notfallfonds schützt vor unvorhergesehenen Ausgaben und verhindert, dass Sie Investitionen vorzeitig auflösen müssen.',
        actionItems: [
          `Zusätzlich ${(emergencyFundNeeded - currentLiquidity).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} ansparen`,
          'Notfallfonds auf separatem Tagesgeldkonto anlegen',
          'Automatischen Sparplan für Notfallfonds einrichten'
        ],
        expectedImpact: {
          financial: 0, // Kein direkter finanzieller Gewinn, aber Risikoreduktion
          risk: 'decrease',
          timeframe: '6-12 Monate'
        },
        confidence: 95,
        tags: ['emergency-fund', 'liquidity', 'risk-management']
      })
    }

    return recommendations
  }

  /**
   * 风险评估
   */
  private async assessRisk(
    result: CalculationResult,
    profile: UserProfile
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []
    const riskRules = this.knowledgeBase.get('risk_rules')

    // 债务收入比分析
    const debtToIncomeRatio = profile.currentDebt / (profile.monthlyIncome * 12)
    
    if (debtToIncomeRatio > riskRules.debt_to_income_thresholds.medium) {
      const priority = debtToIncomeRatio > riskRules.debt_to_income_thresholds.high ? 'critical' : 'high'
      
      recommendations.push({
        id: `debt_risk_${Date.now()}`,
        type: 'risk',
        priority,
        title: 'Hohe Verschuldung reduzieren',
        description: `Ihr Verschuldungsgrad von ${(debtToIncomeRatio * 100).toFixed(1)}% ist zu hoch. Empfohlen sind maximal 36%.`,
        reasoning: 'Eine hohe Verschuldung erhöht Ihr finanzielles Risiko und reduziert Ihre Flexibilität bei Investitionen.',
        actionItems: [
          'Schulden mit höchsten Zinsen zuerst tilgen',
          'Zusätzliche Tilgungen leisten',
          'Umschuldung zu günstigeren Konditionen prüfen',
          'Ausgaben reduzieren und Sparrate erhöhen'
        ],
        expectedImpact: {
          financial: profile.currentDebt * 0.05, // 5% Zinsersparnis geschätzt
          risk: 'decrease',
          timeframe: '2-5 Jahre'
        },
        confidence: 90,
        tags: ['debt-management', 'risk-reduction', 'financial-health']
      })
    }

    // Liquiditätsrisiko bewerten
    const liquidityRatio = (profile.currentAssets * 0.2) / (profile.monthlyExpenses * 12) // Annahme: 20% der Assets sind liquide
    
    if (liquidityRatio < riskRules.liquidity_ratios.minimum) {
      recommendations.push({
        id: `liquidity_risk_${Date.now()}`,
        type: 'risk',
        priority: 'medium',
        title: 'Liquidität verbessern',
        description: 'Ihre Liquiditätsreserven sind zu gering für unvorhergesehene Ausgaben.',
        reasoning: 'Ausreichende Liquidität ist wichtig, um finanzielle Schocks abzufedern ohne Investitionen verkaufen zu müssen.',
        actionItems: [
          'Liquiditätsreserven auf mindestens 10% der Jahresausgaben erhöhen',
          'Tagesgeld- oder Festgeldkonto für Notfälle einrichten',
          'Kreditlinie als zusätzliche Sicherheit vereinbaren'
        ],
        expectedImpact: {
          financial: 0,
          risk: 'decrease',
          timeframe: '3-6 Monate'
        },
        confidence: 80,
        tags: ['liquidity', 'emergency-planning', 'risk-management']
      })
    }

    return recommendations
  }

  /**
   * 财务规划建议
   */
  private async generatePlanningAdvice(
    result: CalculationResult,
    profile: UserProfile
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []

    // Altersvorsorge-Lücke analysieren
    const retirementAge = 67
    const yearsToRetirement = retirementAge - profile.age
    const requiredRetirementCapital = profile.monthlyExpenses * 12 * 25 // 25x Jahresausgaben
    const projectedCapital = result.finalAmount

    if (projectedCapital < requiredRetirementCapital && yearsToRetirement > 0) {
      const shortfall = requiredRetirementCapital - projectedCapital
      const additionalMonthlySavings = shortfall / (yearsToRetirement * 12)

      recommendations.push({
        id: `retirement_gap_${Date.now()}`,
        type: 'planning',
        priority: 'high',
        title: 'Rentenlücke schließen',
        description: `Für eine ausreichende Altersvorsorge fehlen Ihnen voraussichtlich ${shortfall.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}.`,
        reasoning: 'Eine Rentenlücke bedeutet, dass Sie im Alter Ihren gewohnten Lebensstandard nicht halten können.',
        actionItems: [
          `Monatliche Sparrate um ${additionalMonthlySavings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} erhöhen`,
          'Riester- oder Rürup-Rente prüfen',
          'Betriebliche Altersvorsorge optimieren',
          'Immobilie als Altersvorsorge erwägen'
        ],
        expectedImpact: {
          financial: shortfall,
          risk: 'decrease',
          timeframe: `${yearsToRetirement} Jahre`
        },
        confidence: 85,
        tags: ['retirement-planning', 'savings-gap', 'long-term-planning']
      })
    }

    // Steueroptimierung
    if (profile.monthlyIncome * 12 > 50000) { // Höhere Einkommensklasse
      recommendations.push({
        id: `tax_optimization_${Date.now()}`,
        type: 'optimization',
        priority: 'medium',
        title: 'Steueroptimierung nutzen',
        description: 'Bei Ihrem Einkommen können Sie durch geschickte Steuerplanung erheblich sparen.',
        reasoning: 'Steueroptimierung kann Ihre Nettorendite erheblich verbessern, besonders bei höheren Einkommen.',
        actionItems: [
          'Riester-Rente für Steuervorteile nutzen',
          'Rürup-Rente bei Selbstständigkeit prüfen',
          'Verlustverrechnung bei Kapitalerträgen optimieren',
          'Steuerberater für individuelle Beratung konsultieren'
        ],
        expectedImpact: {
          financial: profile.monthlyIncome * 12 * 0.05, // 5% Steuerersparnis geschätzt
          risk: 'neutral',
          timeframe: '1 Jahr'
        },
        confidence: 75,
        tags: ['tax-optimization', 'net-return', 'financial-efficiency']
      })
    }

    return recommendations
  }

  /**
   * 优化建议
   */
  private async findOptimizations(
    result: CalculationResult,
    profile: UserProfile
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []

    // Kostenoptimierung
    const estimatedFees = result.totalContributions * 0.015 // Annahme: 1.5% jährliche Kosten
    
    recommendations.push({
      id: `cost_optimization_${Date.now()}`,
      type: 'optimization',
      priority: 'medium',
      title: 'Kosten reduzieren',
      description: `Durch Kostenoptimierung können Sie über die Laufzeit bis zu ${estimatedFees.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} sparen.`,
      reasoning: 'Hohe Gebühren reduzieren Ihre Nettorendite erheblich. Schon 1% weniger Kosten können über 20 Jahre einen großen Unterschied machen.',
      actionItems: [
        'ETFs statt aktive Fonds verwenden',
        'Direktbank statt Filialbank nutzen',
        'Depot-Gebühren vergleichen und wechseln',
        'Unnötige Versicherungen kündigen'
      ],
      expectedImpact: {
        financial: estimatedFees * 0.5, // 50% Kostenreduktion möglich
        risk: 'neutral',
        timeframe: `${profile.timeHorizon} Jahre`
      },
      confidence: 80,
      tags: ['cost-optimization', 'fees', 'efficiency']
    })

    return recommendations
  }

  /**
   * 市场时机分析
   */
  private async analyzeMarketTiming(
    profile: UserProfile,
    marketContext: MarketContext
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []
    const marketInsights = this.knowledgeBase.get('market_insights')

    // Zinsumfeld analysieren
    const currentRate = marketContext.currentInterestRates.ecb
    const isRisingRates = currentRate > 2 // Vereinfachte Annahme

    if (isRisingRates) {
      recommendations.push({
        id: `rising_rates_${Date.now()}`,
        type: 'investment',
        priority: 'medium',
        title: 'Steigende Zinsen nutzen',
        description: 'Das aktuelle Zinsumfeld bietet Chancen für konservative Anleger.',
        reasoning: 'Steigende Zinsen machen Anleihen und Festgeld wieder attraktiver, können aber Aktienkurse belasten.',
        actionItems: [
          'Anleihenanteil temporär erhöhen',
          'Festgeld für sichere Erträge nutzen',
          'Bei Aktien auf dividendenstarke Titel setzen',
          'Immobilienfinanzierung vor weiteren Zinsanstiegen abschließen'
        ],
        expectedImpact: {
          financial: profile.currentAssets * 0.02, // 2% zusätzliche Rendite möglich
          risk: 'decrease',
          timeframe: '1-2 Jahre'
        },
        confidence: 70,
        tags: ['interest-rates', 'market-timing', 'bonds']
      })
    }

    // Inflationsschutz
    if (marketContext.marketConditions.economicIndicators.inflation > 3) {
      recommendations.push({
        id: `inflation_hedge_${Date.now()}`,
        type: 'investment',
        priority: 'high',
        title: 'Inflationsschutz verstärken',
        description: `Bei einer Inflation von ${marketContext.marketConditions.economicIndicators.inflation}% sollten Sie Ihr Portfolio anpassen.`,
        reasoning: 'Hohe Inflation erodiert die Kaufkraft. Bestimmte Anlageklassen bieten besseren Inflationsschutz.',
        actionItems: [
          'Immobilien-ETFs oder REITs beimischen',
          'Rohstoff-ETFs für Diversifikation',
          'Inflationsgeschützte Anleihen erwägen',
          'Aktien von Unternehmen mit Preissetzungsmacht'
        ],
        expectedImpact: {
          financial: profile.currentAssets * 0.03, // 3% Inflationsschutz
          risk: 'neutral',
          timeframe: '2-5 Jahre'
        },
        confidence: 75,
        tags: ['inflation-hedge', 'real-assets', 'purchasing-power']
      })
    }

    return recommendations
  }

  /**
   * 备用建议（当AI分析失败时）
   */
  private getFallbackRecommendations(profile: UserProfile): AIRecommendation[] {
    return [
      {
        id: `fallback_diversification_${Date.now()}`,
        type: 'investment',
        priority: 'medium',
        title: 'Diversifikation verbessern',
        description: 'Eine breite Streuung Ihrer Investments reduziert das Risiko.',
        reasoning: 'Diversifikation ist eine der wichtigsten Regeln beim Investieren.',
        actionItems: [
          'Verschiedene Anlageklassen nutzen',
          'Geografisch diversifizieren',
          'Nicht alle Eier in einen Korb legen'
        ],
        expectedImpact: {
          financial: 0,
          risk: 'decrease',
          timeframe: 'Langfristig'
        },
        confidence: 90,
        tags: ['diversification', 'risk-management']
      }
    ]
  }

  /**
   * 用户画像更新
   */
  public updateUserProfile(userId: string, profile: UserProfile): void {
    this.userProfiles.set(userId, profile)
  }

  /**
   * 获取用户画像
   */
  public getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId)
  }

  /**
   * 获取个性化建议
   */
  public async getPersonalizedAdvice(
    userId: string,
    calculationResult: CalculationResult,
    marketContext?: MarketContext
  ): Promise<AIRecommendation[]> {
    const profile = this.getUserProfile(userId)
    if (!profile) {
      throw new Error('用户画像未找到，请先完成风险评估')
    }

    return this.generateRecommendations(calculationResult, profile, marketContext)
  }
}

// 导出单例实例
export const aiAdvisorService = AIAdvisorService.getInstance()
