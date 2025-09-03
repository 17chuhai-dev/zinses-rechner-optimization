/**
 * AI驱动的智能财务顾问服务
 * 提供个性化投资建议、风险评估、市场预测等AI驱动的财务服务
 */

import { auditLogService } from './AuditLogService'
import { globalMarketService } from './GlobalMarketService'

// AI财务顾问相关类型定义
export interface AIAdvisorProfile {
  id: string
  userId: string
  personalInfo: PersonalFinancialInfo
  riskProfile: RiskProfile
  investmentGoals: InvestmentGoal[]
  preferences: AdvisorPreferences
  aiModel: AIModelConfig
  createdAt: Date
  lastUpdated: Date
}

export interface PersonalFinancialInfo {
  age: number
  income: number
  expenses: number
  assets: Asset[]
  liabilities: Liability[]
  dependents: number
  employmentStatus: EmploymentStatus
  retirementAge?: number
  currency: string
  region: string
}

export type EmploymentStatus = 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student'

export interface Asset {
  id: string
  type: AssetType
  name: string
  value: number
  currency: string
  allocation: number // percentage
  riskLevel: RiskLevel
  liquidity: LiquidityLevel
  lastUpdated: Date
}

export type AssetType = 
  | 'cash'
  | 'savings_account'
  | 'checking_account'
  | 'stocks'
  | 'bonds'
  | 'mutual_funds'
  | 'etf'
  | 'real_estate'
  | 'commodities'
  | 'cryptocurrency'
  | 'pension'
  | 'insurance'
  | 'other'

export interface Liability {
  id: string
  type: LiabilityType
  name: string
  balance: number
  interestRate: number
  monthlyPayment: number
  maturityDate?: Date
  currency: string
}

export type LiabilityType = 'mortgage' | 'personal_loan' | 'credit_card' | 'student_loan' | 'business_loan' | 'other'

export interface RiskProfile {
  score: number // 1-10, 1 = very conservative, 10 = very aggressive
  category: RiskCategory
  tolerance: RiskTolerance
  capacity: RiskCapacity
  timeHorizon: TimeHorizon
  volatilityComfort: number // 1-10
  lossThreshold: number // maximum acceptable loss percentage
  assessmentDate: Date
  questionnaire: RiskQuestionnaireResult
}

export type RiskCategory = 'conservative' | 'moderate_conservative' | 'moderate' | 'moderate_aggressive' | 'aggressive'
export type RiskTolerance = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
export type RiskCapacity = 'limited' | 'moderate' | 'substantial' | 'high'
export type TimeHorizon = 'short' | 'medium' | 'long' | 'very_long' // <2, 2-5, 5-10, >10 years
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
export type LiquidityLevel = 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'illiquid'

export interface RiskQuestionnaireResult {
  answers: Record<string, any>
  score: number
  interpretation: string
  recommendations: string[]
  completedAt: Date
}

export interface InvestmentGoal {
  id: string
  name: string
  type: GoalType
  targetAmount: number
  currentAmount: number
  targetDate: Date
  priority: GoalPriority
  riskTolerance: RiskTolerance
  currency: string
  isActive: boolean
  progress: number // 0-100%
  monthlyContribution?: number
  strategy: InvestmentStrategy
}

export type GoalType = 
  | 'retirement'
  | 'emergency_fund'
  | 'house_purchase'
  | 'education'
  | 'vacation'
  | 'debt_payoff'
  | 'wealth_building'
  | 'income_generation'
  | 'tax_optimization'
  | 'other'

export type GoalPriority = 'low' | 'medium' | 'high' | 'critical'

export interface InvestmentStrategy {
  id: string
  name: string
  description: string
  assetAllocation: AssetAllocation
  rebalancingFrequency: RebalancingFrequency
  expectedReturn: number
  expectedVolatility: number
  fees: number
  taxEfficiency: number
}

export interface AssetAllocation {
  stocks: number
  bonds: number
  cash: number
  alternatives: number
  international: number
  domestic: number
}

export type RebalancingFrequency = 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'threshold_based'

export interface AdvisorPreferences {
  communicationStyle: CommunicationStyle
  updateFrequency: UpdateFrequency
  notificationTypes: NotificationType[]
  language: string
  timezone: string
  advisorPersonality: AdvisorPersonality
  explanationLevel: ExplanationLevel
}

export type CommunicationStyle = 'formal' | 'casual' | 'technical' | 'simplified'
export type UpdateFrequency = 'real_time' | 'daily' | 'weekly' | 'monthly' | 'on_demand'
export type NotificationType = 'market_alerts' | 'rebalancing' | 'goal_progress' | 'risk_changes' | 'opportunities'
export type AdvisorPersonality = 'conservative' | 'balanced' | 'growth_focused' | 'opportunistic'
export type ExplanationLevel = 'basic' | 'intermediate' | 'advanced' | 'expert'

export interface AIModelConfig {
  modelType: AIModelType
  version: string
  parameters: AIModelParameters
  trainingData: TrainingDataInfo
  performance: ModelPerformance
  lastUpdated: Date
}

export type AIModelType = 'gpt' | 'claude' | 'custom_financial' | 'ensemble'

export interface AIModelParameters {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  customParameters: Record<string, any>
}

export interface TrainingDataInfo {
  sources: string[]
  lastUpdate: Date
  dataQuality: number // 0-100%
  coverage: string[]
}

export interface ModelPerformance {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  userSatisfaction: number
  lastEvaluation: Date
}

export interface AIRecommendation {
  id: string
  type: RecommendationType
  title: string
  description: string
  rationale: string
  confidence: number // 0-100%
  priority: RecommendationPriority
  category: RecommendationCategory
  actionItems: ActionItem[]
  expectedOutcome: ExpectedOutcome
  risks: Risk[]
  alternatives: Alternative[]
  timeframe: string
  cost?: number
  effort?: EffortLevel
  createdAt: Date
  expiresAt?: Date
  status: RecommendationStatus
  userFeedback?: UserFeedback
}

export type RecommendationType = 
  | 'asset_allocation'
  | 'investment_selection'
  | 'rebalancing'
  | 'tax_optimization'
  | 'risk_management'
  | 'goal_adjustment'
  | 'cost_reduction'
  | 'opportunity'
  | 'warning'

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent'
export type RecommendationCategory = 'portfolio' | 'planning' | 'tax' | 'risk' | 'opportunity' | 'education'
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'implemented' | 'expired'
export type EffortLevel = 'minimal' | 'low' | 'medium' | 'high' | 'significant'

export interface ActionItem {
  id: string
  description: string
  type: ActionType
  priority: number
  estimatedTime: number // minutes
  dependencies: string[]
  isCompleted: boolean
}

export type ActionType = 'research' | 'purchase' | 'sell' | 'rebalance' | 'review' | 'contact' | 'document'

export interface ExpectedOutcome {
  description: string
  metrics: OutcomeMetric[]
  timeframe: string
  probability: number // 0-100%
}

export interface OutcomeMetric {
  name: string
  currentValue: number
  expectedValue: number
  unit: string
  improvement: number // percentage
}

export interface Risk {
  type: RiskType
  description: string
  probability: number // 0-100%
  impact: RiskImpact
  mitigation: string[]
}

export type RiskType = 'market' | 'credit' | 'liquidity' | 'operational' | 'regulatory' | 'inflation' | 'currency'
export type RiskImpact = 'negligible' | 'minor' | 'moderate' | 'major' | 'severe'

export interface Alternative {
  id: string
  name: string
  description: string
  pros: string[]
  cons: string[]
  suitability: number // 0-100%
}

export interface UserFeedback {
  rating: number // 1-5
  comment?: string
  implemented: boolean
  outcome?: string
  submittedAt: Date
}

export interface MarketInsight {
  id: string
  type: InsightType
  title: string
  summary: string
  content: string
  relevance: number // 0-100%
  impact: MarketImpact
  timeframe: string
  sources: string[]
  confidence: number
  createdAt: Date
  tags: string[]
}

export type InsightType = 'trend' | 'opportunity' | 'risk' | 'analysis' | 'forecast' | 'news'
export type MarketImpact = 'positive' | 'negative' | 'neutral' | 'mixed'

export interface PortfolioAnalysis {
  id: string
  portfolioId: string
  analysisDate: Date
  performance: PerformanceMetrics
  riskMetrics: RiskMetrics
  allocation: AllocationAnalysis
  recommendations: AIRecommendation[]
  benchmarkComparison: BenchmarkComparison
  attribution: PerformanceAttribution
  outlook: MarketOutlook
}

export interface PerformanceMetrics {
  totalReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  calmarRatio: number
  informationRatio: number
  trackingError: number
  beta: number
  alpha: number
}

export interface RiskMetrics {
  valueAtRisk: number // VaR
  conditionalVaR: number // CVaR
  riskScore: number
  concentrationRisk: number
  correlationRisk: number
  liquidityRisk: number
  currencyRisk: number
}

export interface AllocationAnalysis {
  current: AssetAllocation
  target: AssetAllocation
  deviation: AssetAllocation
  rebalancingNeeded: boolean
  rebalancingCost: number
}

export interface BenchmarkComparison {
  benchmark: string
  outperformance: number
  trackingError: number
  informationRatio: number
  upCapture: number
  downCapture: number
}

export interface PerformanceAttribution {
  assetAllocation: number
  securitySelection: number
  interaction: number
  currency: number
  fees: number
  other: number
}

export interface MarketOutlook {
  timeframe: string
  expectedReturn: number
  expectedVolatility: number
  scenarios: MarketScenario[]
  keyRisks: string[]
  opportunities: string[]
}

export interface MarketScenario {
  name: string
  probability: number
  expectedReturn: number
  description: string
  impact: string
}

export class AIFinancialAdvisorService {
  private static instance: AIFinancialAdvisorService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private profileCache: Map<string, AIAdvisorProfile> = new Map()
  private recommendationsCache: Map<string, AIRecommendation[]> = new Map()

  private constructor() {}

  public static getInstance(): AIFinancialAdvisorService {
    if (!AIFinancialAdvisorService.instance) {
      AIFinancialAdvisorService.instance = new AIFinancialAdvisorService()
    }
    return AIFinancialAdvisorService.instance
  }

  /**
   * 创建AI顾问档案
   */
  public async createAdvisorProfile(
    userId: string,
    personalInfo: PersonalFinancialInfo,
    preferences: Partial<AdvisorPreferences> = {}
  ): Promise<AIAdvisorProfile | null> {
    try {
      const defaultPreferences: AdvisorPreferences = {
        communicationStyle: 'balanced',
        updateFrequency: 'weekly',
        notificationTypes: ['goal_progress', 'rebalancing', 'opportunities'],
        language: 'de',
        timezone: 'Europe/Berlin',
        advisorPersonality: 'balanced',
        explanationLevel: 'intermediate',
        ...preferences
      }

      const profile: Omit<AIAdvisorProfile, 'id' | 'createdAt' | 'lastUpdated'> = {
        userId,
        personalInfo,
        riskProfile: await this.assessRiskProfile(personalInfo),
        investmentGoals: [],
        preferences: defaultPreferences,
        aiModel: await this.getDefaultAIModel()
      }

      const response = await fetch(`${this.baseUrl}/api/ai-advisor/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        const data = await response.json()
        const createdProfile = data.profile
        
        // 更新缓存
        this.profileCache.set(userId, createdProfile)
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'user_management',
          'ai_advisor_profile_created',
          'ai_advisor_profile',
          {
            description: `AI advisor profile created for user ${userId}`,
            newValue: { userId, riskScore: createdProfile.riskProfile.score }
          },
          { resourceId: createdProfile.id, severity: 'medium', immediate: true }
        )

        return createdProfile
      }

      return null
    } catch (error) {
      console.error('创建AI顾问档案失败:', error)
      return null
    }
  }

  /**
   * 获取个性化投资建议
   */
  public async getPersonalizedRecommendations(
    userId: string,
    context?: {
      marketConditions?: string
      recentChanges?: string[]
      specificGoals?: string[]
    }
  ): Promise<AIRecommendation[]> {
    try {
      // 检查缓存
      if (this.recommendationsCache.has(userId)) {
        const cached = this.recommendationsCache.get(userId)!
        const cacheAge = Date.now() - cached[0]?.createdAt.getTime()
        if (cacheAge < 60 * 60 * 1000) { // 1小时缓存
          return cached
        }
      }

      const profile = await this.getAdvisorProfile(userId)
      if (!profile) {
        throw new Error('用户档案不存在')
      }

      const response = await fetch(`${this.baseUrl}/api/ai-advisor/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          context: {
            profile,
            marketData: await globalMarketService.getMarketData(),
            ...context
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const recommendations = data.recommendations
        
        // 更新缓存
        this.recommendationsCache.set(userId, recommendations)
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'ai_recommendations_generated',
          'ai_advisor',
          {
            description: `AI recommendations generated for user ${userId}`,
            customFields: { 
              userId, 
              recommendationCount: recommendations.length,
              highPriorityCount: recommendations.filter((r: AIRecommendation) => r.priority === 'high' || r.priority === 'urgent').length
            }
          },
          { resourceId: userId, severity: 'low' }
        )

        return recommendations
      }

      return []
    } catch (error) {
      console.error('获取个性化建议失败:', error)
      return []
    }
  }

  /**
   * 分析投资组合
   */
  public async analyzePortfolio(
    userId: string,
    portfolioData: {
      assets: Asset[]
      totalValue: number
      currency: string
    }
  ): Promise<PortfolioAnalysis | null> {
    try {
      const profile = await this.getAdvisorProfile(userId)
      if (!profile) {
        throw new Error('用户档案不存在')
      }

      const response = await fetch(`${this.baseUrl}/api/ai-advisor/portfolio-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          portfolioData,
          profile
        })
      })

      if (response.ok) {
        const data = await response.json()
        const analysis = data.analysis
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'portfolio_analysis_completed',
          'portfolio_analyzer',
          {
            description: `Portfolio analysis completed for user ${userId}`,
            customFields: { 
              userId, 
              portfolioValue: portfolioData.totalValue,
              riskScore: analysis.riskMetrics.riskScore,
              recommendationCount: analysis.recommendations.length
            }
          },
          { resourceId: userId, severity: 'low' }
        )

        return analysis
      }

      return null
    } catch (error) {
      console.error('投资组合分析失败:', error)
      return null
    }
  }

  /**
   * 获取市场洞察
   */
  public async getMarketInsights(
    userId: string,
    filters?: {
      types?: InsightType[]
      relevanceThreshold?: number
      timeframe?: string
    }
  ): Promise<MarketInsight[]> {
    try {
      const profile = await this.getAdvisorProfile(userId)
      const params = new URLSearchParams()
      
      if (filters?.types) params.append('types', filters.types.join(','))
      if (filters?.relevanceThreshold) params.append('relevanceThreshold', filters.relevanceThreshold.toString())
      if (filters?.timeframe) params.append('timeframe', filters.timeframe)
      if (profile) params.append('riskProfile', profile.riskProfile.category)

      const response = await fetch(`${this.baseUrl}/api/ai-advisor/market-insights?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        return data.insights || []
      }

      return []
    } catch (error) {
      console.error('获取市场洞察失败:', error)
      return []
    }
  }

  /**
   * 评估风险档案
   */
  private async assessRiskProfile(personalInfo: PersonalFinancialInfo): Promise<RiskProfile> {
    // 简化的风险评估逻辑
    let riskScore = 5 // 基础分数

    // 年龄因素
    if (personalInfo.age < 30) riskScore += 2
    else if (personalInfo.age < 40) riskScore += 1
    else if (personalInfo.age > 60) riskScore -= 2

    // 收入稳定性
    if (personalInfo.employmentStatus === 'employed') riskScore += 1
    else if (personalInfo.employmentStatus === 'self_employed') riskScore -= 1
    else if (personalInfo.employmentStatus === 'unemployed') riskScore -= 3

    // 财务状况
    const netWorth = personalInfo.assets.reduce((sum, asset) => sum + asset.value, 0) -
                    personalInfo.liabilities.reduce((sum, liability) => sum + liability.balance, 0)
    
    if (netWorth > personalInfo.income * 5) riskScore += 2
    else if (netWorth < personalInfo.income) riskScore -= 2

    // 限制在1-10范围内
    riskScore = Math.max(1, Math.min(10, riskScore))

    const category = this.getRiskCategory(riskScore)
    
    return {
      score: riskScore,
      category,
      tolerance: this.getRiskTolerance(riskScore),
      capacity: this.getRiskCapacity(personalInfo),
      timeHorizon: this.getTimeHorizon(personalInfo),
      volatilityComfort: riskScore,
      lossThreshold: this.getLossThreshold(riskScore),
      assessmentDate: new Date(),
      questionnaire: {
        answers: {},
        score: riskScore,
        interpretation: `基于提供的财务信息，您的风险档案为${category}`,
        recommendations: [],
        completedAt: new Date()
      }
    }
  }

  /**
   * 获取风险类别
   */
  private getRiskCategory(score: number): RiskCategory {
    if (score <= 2) return 'conservative'
    if (score <= 4) return 'moderate_conservative'
    if (score <= 6) return 'moderate'
    if (score <= 8) return 'moderate_aggressive'
    return 'aggressive'
  }

  /**
   * 获取风险承受能力
   */
  private getRiskTolerance(score: number): RiskTolerance {
    if (score <= 2) return 'very_low'
    if (score <= 4) return 'low'
    if (score <= 6) return 'medium'
    if (score <= 8) return 'high'
    return 'very_high'
  }

  /**
   * 获取风险承受能力
   */
  private getRiskCapacity(personalInfo: PersonalFinancialInfo): RiskCapacity {
    const netWorth = personalInfo.assets.reduce((sum, asset) => sum + asset.value, 0) -
                    personalInfo.liabilities.reduce((sum, liability) => sum + liability.balance, 0)
    
    if (netWorth < personalInfo.income) return 'limited'
    if (netWorth < personalInfo.income * 3) return 'moderate'
    if (netWorth < personalInfo.income * 10) return 'substantial'
    return 'high'
  }

  /**
   * 获取投资时间范围
   */
  private getTimeHorizon(personalInfo: PersonalFinancialInfo): TimeHorizon {
    const retirementAge = personalInfo.retirementAge || 65
    const yearsToRetirement = retirementAge - personalInfo.age
    
    if (yearsToRetirement < 2) return 'short'
    if (yearsToRetirement < 5) return 'medium'
    if (yearsToRetirement < 10) return 'long'
    return 'very_long'
  }

  /**
   * 获取损失阈值
   */
  private getLossThreshold(riskScore: number): number {
    // 基于风险分数返回最大可接受损失百分比
    return Math.min(50, riskScore * 5) // 5% to 50%
  }

  /**
   * 获取默认AI模型配置
   */
  private async getDefaultAIModel(): Promise<AIModelConfig> {
    return {
      modelType: 'custom_financial',
      version: '2.0',
      parameters: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1,
        customParameters: {}
      },
      trainingData: {
        sources: ['financial_markets', 'economic_data', 'investment_research'],
        lastUpdate: new Date(),
        dataQuality: 95,
        coverage: ['stocks', 'bonds', 'etfs', 'mutual_funds', 'alternatives']
      },
      performance: {
        accuracy: 0.87,
        precision: 0.85,
        recall: 0.89,
        f1Score: 0.87,
        userSatisfaction: 4.2,
        lastEvaluation: new Date()
      },
      lastUpdated: new Date()
    }
  }

  /**
   * 获取用户顾问档案
   */
  public async getAdvisorProfile(userId: string): Promise<AIAdvisorProfile | null> {
    // 先检查缓存
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/ai-advisor/profiles/${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        const profile = data.profile
        
        // 更新缓存
        this.profileCache.set(userId, profile)
        
        return profile
      }
      
      return null
    } catch (error) {
      console.error('获取顾问档案失败:', error)
      return null
    }
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.profileCache.clear()
    this.recommendationsCache.clear()
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.clearCache()
  }
}

// 导出单例实例
export const aiFinancialAdvisorService = AIFinancialAdvisorService.getInstance()
