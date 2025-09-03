/**
 * 智能推荐引擎
 * 基于用户行为、财务数据和德国金融最佳实践提供个性化建议
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserIdentityService } from './UserIdentityService'
import { CalculationHistoryService } from './CalculationHistoryService'
import { EnhancedFinancialGoalService } from './EnhancedFinancialGoalService'
import type { User } from '@/types/user-identity'
import type { CalculationHistory } from './CalculationHistoryService'
import type { EnhancedFinancialGoal, GoalRecommendation } from './EnhancedFinancialGoalService'

// 推荐类型
export type RecommendationType = 
  | 'calculator_suggestion'
  | 'goal_creation'
  | 'goal_optimization'
  | 'financial_education'
  | 'tax_optimization'
  | 'investment_strategy'
  | 'risk_management'

// 推荐引擎配置
export interface RecommendationConfig {
  maxRecommendations: number
  minConfidenceThreshold: number
  personalizedWeight: number
  popularityWeight: number
  recencyWeight: number
  germanRulesWeight: number
}

// 用户行为分析
export interface UserBehaviorProfile {
  userId: string
  calculatorUsage: CalculatorUsagePattern[]
  goalPatterns: GoalPattern[]
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  financialKnowledge: 'beginner' | 'intermediate' | 'advanced'
  lifeStage: 'student' | 'young_professional' | 'family' | 'pre_retirement' | 'retirement'
  interests: string[]
  lastActivity: Date
  engagementScore: number
}

export interface CalculatorUsagePattern {
  calculatorType: string
  frequency: number
  averageSessionDuration: number
  lastUsed: Date
  complexity: 'basic' | 'intermediate' | 'advanced'
}

export interface GoalPattern {
  goalType: string
  averageAmount: number
  averageTimeframe: number
  completionRate: number
  priority: string
}

// 推荐结果
export interface Recommendation {
  id: string
  type: RecommendationType
  title: string
  description: string
  actionText: string
  priority: 'high' | 'medium' | 'low'
  confidence: number
  personalizedScore: number
  category: string
  tags: string[]
  
  // 德国特定信息
  germanRelevance: {
    taxImplications?: string
    legalConsiderations?: string
    localResources?: string[]
  }
  
  // 行动信息
  actionData: {
    calculatorType?: string
    goalTemplate?: string
    educationContent?: string
    externalLink?: string
  }
  
  // 元数据
  createdAt: Date
  expiresAt?: Date
  viewCount: number
  clickCount: number
  dismissed: boolean
}

// 德国金融规则引擎
export interface GermanFinancialRule {
  id: string
  name: string
  description: string
  category: 'tax' | 'investment' | 'retirement' | 'insurance' | 'banking'
  applicableAge?: { min: number; max: number }
  applicableIncome?: { min: number; max: number }
  priority: number
  recommendation: string
  legalReference?: string
}

/**
 * 智能推荐引擎核心类
 */
export class RecommendationEngine {
  private static instance: RecommendationEngine
  private userIdentityService: UserIdentityService
  private calculationHistoryService: CalculationHistoryService
  private goalService: EnhancedFinancialGoalService
  
  private config: RecommendationConfig = {
    maxRecommendations: 10,
    minConfidenceThreshold: 0.3,
    personalizedWeight: 0.4,
    popularityWeight: 0.2,
    recencyWeight: 0.2,
    germanRulesWeight: 0.2
  }
  
  private germanRules: GermanFinancialRule[] = []
  private userProfiles: Map<string, UserBehaviorProfile> = new Map()
  private isInitialized = false

  private constructor() {
    this.userIdentityService = UserIdentityService.getInstance()
    this.calculationHistoryService = CalculationHistoryService.getInstance()
    this.goalService = EnhancedFinancialGoalService.getInstance()
  }

  static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine()
    }
    return RecommendationEngine.instance
  }

  /**
   * 初始化推荐引擎
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.loadGermanFinancialRules()
      this.isInitialized = true
      console.log('🤖 RecommendationEngine initialized')
    } catch (error) {
      console.error('❌ Failed to initialize RecommendationEngine:', error)
      throw error
    }
  }

  /**
   * 获取用户个性化推荐
   */
  async getPersonalizedRecommendations(userId?: string): Promise<Recommendation[]> {
    if (!this.isInitialized) await this.initialize()

    const currentUser = userId ? { id: userId } : await this.userIdentityService.getCurrentUser()
    if (!currentUser) {
      return await this.getGeneralRecommendations()
    }

    // 分析用户行为
    const userProfile = await this.analyzeUserBehavior(currentUser.id)
    
    // 生成多种类型的推荐
    const recommendations: Recommendation[] = []
    
    // 1. 基于使用模式的计算器推荐
    recommendations.push(...await this.generateCalculatorRecommendations(userProfile))
    
    // 2. 基于目标的推荐
    recommendations.push(...await this.generateGoalRecommendations(userProfile))
    
    // 3. 德国金融规则推荐
    recommendations.push(...await this.generateGermanRuleRecommendations(userProfile))
    
    // 4. 教育内容推荐
    recommendations.push(...await this.generateEducationRecommendations(userProfile))
    
    // 5. 优化建议
    recommendations.push(...await this.generateOptimizationRecommendations(userProfile))

    // 排序和过滤
    return this.rankAndFilterRecommendations(recommendations, userProfile)
  }

  /**
   * 获取通用推荐（未登录用户）
   */
  async getGeneralRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [
      {
        id: 'general-compound-interest',
        type: 'calculator_suggestion',
        title: 'Zinseszins-Rechner ausprobieren',
        description: 'Entdecken Sie die Macht des Zinseszinses für Ihre Geldanlage',
        actionText: 'Jetzt berechnen',
        priority: 'high',
        confidence: 0.9,
        personalizedScore: 0.8,
        category: 'Geldanlage',
        tags: ['Zinseszins', 'Sparen', 'Investieren'],
        germanRelevance: {
          taxImplications: 'Kapitalerträge unterliegen der Abgeltungssteuer',
          legalConsiderations: 'Freibetrag von 1.000€ pro Person beachten'
        },
        actionData: {
          calculatorType: 'compound-interest'
        },
        createdAt: new Date(),
        viewCount: 0,
        clickCount: 0,
        dismissed: false
      },
      {
        id: 'general-retirement',
        type: 'goal_creation',
        title: 'Altersvorsorge planen',
        description: 'Starten Sie frühzeitig mit Ihrer privaten Altersvorsorge',
        actionText: 'Ziel erstellen',
        priority: 'high',
        confidence: 0.85,
        personalizedScore: 0.7,
        category: 'Altersvorsorge',
        tags: ['Rente', 'Vorsorge', 'Riester'],
        germanRelevance: {
          taxImplications: 'Steuervorteile durch Riester- und Rürup-Rente',
          legalConsiderations: 'Gesetzliche Rente reicht oft nicht aus'
        },
        actionData: {
          goalTemplate: 'retirement-template'
        },
        createdAt: new Date(),
        viewCount: 0,
        clickCount: 0,
        dismissed: false
      }
    ]

    return recommendations
  }

  /**
   * 分析用户行为模式
   */
  async analyzeUserBehavior(userId: string): Promise<UserBehaviorProfile> {
    // 检查缓存
    if (this.userProfiles.has(userId)) {
      const profile = this.userProfiles.get(userId)!
      // 如果分析结果不超过1小时，直接返回
      if (Date.now() - profile.lastActivity.getTime() < 60 * 60 * 1000) {
        return profile
      }
    }

    // 获取用户数据
    const calculations = await this.calculationHistoryService.findByUserId(userId)
    const goals = await this.goalService.getUserGoals(userId)

    // 分析计算器使用模式
    const calculatorUsage = this.analyzeCalculatorUsage(calculations)
    
    // 分析目标模式
    const goalPatterns = this.analyzeGoalPatterns(goals)
    
    // 评估风险承受能力
    const riskTolerance = this.assessRiskTolerance(calculations, goals)
    
    // 评估金融知识水平
    const financialKnowledge = this.assessFinancialKnowledge(calculations)
    
    // 确定生活阶段
    const lifeStage = this.determineLifeStage(goals, calculations)
    
    // 计算参与度分数
    const engagementScore = this.calculateEngagementScore(calculations, goals)

    const profile: UserBehaviorProfile = {
      userId,
      calculatorUsage,
      goalPatterns,
      riskTolerance,
      financialKnowledge,
      lifeStage,
      interests: this.extractInterests(calculations, goals),
      lastActivity: new Date(),
      engagementScore
    }

    // 缓存结果
    this.userProfiles.set(userId, profile)
    
    return profile
  }

  /**
   * 生成计算器推荐
   */
  private async generateCalculatorRecommendations(profile: UserBehaviorProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // 基于使用历史推荐相关计算器
    const usedCalculators = profile.calculatorUsage.map(u => u.calculatorType)
    
    if (usedCalculators.includes('compound-interest') && !usedCalculators.includes('loan')) {
      recommendations.push({
        id: `calc-loan-${profile.userId}`,
        type: 'calculator_suggestion',
        title: 'Kredit-Rechner entdecken',
        description: 'Da Sie sich für Zinsen interessieren, könnte der Kredit-Rechner hilfreich sein',
        actionText: 'Kredit berechnen',
        priority: 'medium',
        confidence: 0.7,
        personalizedScore: 0.8,
        category: 'Finanzierung',
        tags: ['Kredit', 'Zinsen', 'Finanzierung'],
        germanRelevance: {
          taxImplications: 'Sollzinsen sind nicht steuerlich absetzbar',
          legalConsiderations: 'Widerrufsrecht bei Verbraucherdarlehen beachten'
        },
        actionData: {
          calculatorType: 'loan'
        },
        createdAt: new Date(),
        viewCount: 0,
        clickCount: 0,
        dismissed: false
      })
    }

    return recommendations
  }

  /**
   * 生成目标推荐
   */
  private async generateGoalRecommendations(profile: UserBehaviorProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // 基于生活阶段推荐目标
    if (profile.lifeStage === 'young_professional' && profile.goalPatterns.length === 0) {
      recommendations.push({
        id: `goal-emergency-${profile.userId}`,
        type: 'goal_creation',
        title: 'Notgroschen aufbauen',
        description: 'Als Berufseinsteiger sollten Sie einen Notgroschen für unvorhergesehene Ausgaben aufbauen',
        actionText: 'Notgroschen-Ziel erstellen',
        priority: 'high',
        confidence: 0.9,
        personalizedScore: 0.9,
        category: 'Notfallvorsorge',
        tags: ['Notgroschen', 'Sicherheit', 'Liquidität'],
        germanRelevance: {
          legalConsiderations: 'Empfehlung: 3-6 Monatsausgaben als Reserve'
        },
        actionData: {
          goalTemplate: 'emergency-template'
        },
        createdAt: new Date(),
        viewCount: 0,
        clickCount: 0,
        dismissed: false
      })
    }

    return recommendations
  }

  /**
   * 生成德国金融规则推荐
   */
  private async generateGermanRuleRecommendations(profile: UserBehaviorProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // 基于用户资料应用德国金融规则
    for (const rule of this.germanRules) {
      if (this.isRuleApplicable(rule, profile)) {
        recommendations.push({
          id: `rule-${rule.id}-${profile.userId}`,
          type: 'tax_optimization',
          title: rule.name,
          description: rule.description,
          actionText: 'Mehr erfahren',
          priority: rule.priority > 7 ? 'high' : rule.priority > 4 ? 'medium' : 'low',
          confidence: 0.8,
          personalizedScore: rule.priority / 10,
          category: rule.category,
          tags: [rule.category, 'Deutschland', 'Steuer'],
          germanRelevance: {
            legalConsiderations: rule.legalReference,
            localResources: ['Bundesfinanzministerium', 'Stiftung Warentest']
          },
          actionData: {
            educationContent: rule.recommendation
          },
          createdAt: new Date(),
          viewCount: 0,
          clickCount: 0,
          dismissed: false
        })
      }
    }

    return recommendations
  }

  /**
   * 生成教育内容推荐
   */
  private async generateEducationRecommendations(profile: UserBehaviorProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    if (profile.financialKnowledge === 'beginner') {
      recommendations.push({
        id: `edu-basics-${profile.userId}`,
        type: 'financial_education',
        title: 'Grundlagen der Geldanlage lernen',
        description: 'Erweitern Sie Ihr Finanzwissen mit unseren Grundlagen-Artikeln',
        actionText: 'Lernen starten',
        priority: 'medium',
        confidence: 0.8,
        personalizedScore: 0.7,
        category: 'Bildung',
        tags: ['Grundlagen', 'Lernen', 'Finanzwissen'],
        germanRelevance: {
          localResources: ['BaFin Verbraucherportal', 'Deutsche Bundesbank']
        },
        actionData: {
          educationContent: 'financial-basics'
        },
        createdAt: new Date(),
        viewCount: 0,
        clickCount: 0,
        dismissed: false
      })
    }

    return recommendations
  }

  /**
   * 生成优化建议
   */
  private async generateOptimizationRecommendations(profile: UserBehaviorProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // 基于目标模式生成优化建议
    for (const pattern of profile.goalPatterns) {
      if (pattern.completionRate < 0.5) {
        recommendations.push({
          id: `opt-goal-${pattern.goalType}-${profile.userId}`,
          type: 'goal_optimization',
          title: `${pattern.goalType}-Ziele optimieren`,
          description: 'Ihre Zielerreichungsrate könnte verbessert werden',
          actionText: 'Ziele überprüfen',
          priority: 'medium',
          confidence: 0.6,
          personalizedScore: 0.6,
          category: 'Optimierung',
          tags: ['Optimierung', pattern.goalType],
          germanRelevance: {},
          actionData: {},
          createdAt: new Date(),
          viewCount: 0,
          clickCount: 0,
          dismissed: false
        })
      }
    }

    return recommendations
  }

  /**
   * 排序和过滤推荐
   */
  private rankAndFilterRecommendations(
    recommendations: Recommendation[], 
    profile: UserBehaviorProfile
  ): Recommendation[] {
    // 计算综合评分
    const scoredRecommendations = recommendations.map(rec => ({
      ...rec,
      finalScore: this.calculateFinalScore(rec, profile)
    }))

    // 按评分排序
    scoredRecommendations.sort((a, b) => b.finalScore - a.finalScore)

    // 过滤低置信度推荐
    const filtered = scoredRecommendations.filter(rec => 
      rec.confidence >= this.config.minConfidenceThreshold
    )

    // 限制数量
    return filtered.slice(0, this.config.maxRecommendations)
  }

  /**
   * 计算最终评分
   */
  private calculateFinalScore(recommendation: Recommendation, profile: UserBehaviorProfile): number {
    const personalizedScore = recommendation.personalizedScore * this.config.personalizedWeight
    const confidenceScore = recommendation.confidence * this.config.popularityWeight
    const recencyScore = this.calculateRecencyScore(recommendation) * this.config.recencyWeight
    const germanScore = this.calculateGermanRelevanceScore(recommendation) * this.config.germanRulesWeight

    return personalizedScore + confidenceScore + recencyScore + germanScore
  }

  // 私有辅助方法
  private async loadGermanFinancialRules(): Promise<void> {
    this.germanRules = [
      {
        id: 'sparerpauschbetrag',
        name: 'Sparerpauschbetrag nutzen',
        description: 'Nutzen Sie den Sparerpauschbetrag von 1.000€ optimal aus',
        category: 'tax',
        priority: 8,
        recommendation: 'Stellen Sie einen Freistellungsauftrag bei Ihrer Bank',
        legalReference: '§ 20 EStG'
      },
      {
        id: 'riester-rente',
        name: 'Riester-Rente prüfen',
        description: 'Prüfen Sie, ob die Riester-Rente für Sie vorteilhaft ist',
        category: 'retirement',
        applicableAge: { min: 18, max: 65 },
        priority: 7,
        recommendation: 'Besonders vorteilhaft für Familien mit Kindern',
        legalReference: 'AltZertG'
      }
    ]
  }

  private analyzeCalculatorUsage(calculations: CalculationHistory[]): CalculatorUsagePattern[] {
    const usage = new Map<string, CalculatorUsagePattern>()
    
    calculations.forEach(calc => {
      const type = calc.calculatorType
      if (!usage.has(type)) {
        usage.set(type, {
          calculatorType: type,
          frequency: 0,
          averageSessionDuration: 0,
          lastUsed: calc.timestamp,
          complexity: 'basic'
        })
      }
      
      const pattern = usage.get(type)!
      pattern.frequency++
      pattern.lastUsed = calc.timestamp > pattern.lastUsed ? calc.timestamp : pattern.lastUsed
    })
    
    return Array.from(usage.values())
  }

  private analyzeGoalPatterns(goals: EnhancedFinancialGoal[]): GoalPattern[] {
    const patterns = new Map<string, GoalPattern>()
    
    goals.forEach(goal => {
      const type = goal.type
      if (!patterns.has(type)) {
        patterns.set(type, {
          goalType: type,
          averageAmount: 0,
          averageTimeframe: 0,
          completionRate: 0,
          priority: goal.priority
        })
      }
      
      const pattern = patterns.get(type)!
      pattern.averageAmount = (pattern.averageAmount + goal.targetAmount) / 2
      // 简化实现
    })
    
    return Array.from(patterns.values())
  }

  private assessRiskTolerance(calculations: CalculationHistory[], goals: EnhancedFinancialGoal[]): 'conservative' | 'moderate' | 'aggressive' {
    // 简化的风险评估
    return 'moderate'
  }

  private assessFinancialKnowledge(calculations: CalculationHistory[]): 'beginner' | 'intermediate' | 'advanced' {
    // 基于计算器使用复杂度评估
    if (calculations.length < 5) return 'beginner'
    if (calculations.length < 20) return 'intermediate'
    return 'advanced'
  }

  private determineLifeStage(goals: EnhancedFinancialGoal[], calculations: CalculationHistory[]): UserBehaviorProfile['lifeStage'] {
    // 基于目标类型确定生活阶段
    const hasRetirementGoals = goals.some(g => g.type === 'retirement')
    const hasHouseGoals = goals.some(g => g.type === 'house')
    
    if (hasRetirementGoals && hasHouseGoals) return 'family'
    if (hasRetirementGoals) return 'pre_retirement'
    return 'young_professional'
  }

  private calculateEngagementScore(calculations: CalculationHistory[], goals: EnhancedFinancialGoal[]): number {
    // 简化的参与度计算
    return Math.min(1, (calculations.length * 0.1 + goals.length * 0.2))
  }

  private extractInterests(calculations: CalculationHistory[], goals: EnhancedFinancialGoal[]): string[] {
    const interests = new Set<string>()
    
    calculations.forEach(calc => {
      interests.add(calc.calculatorType)
    })
    
    goals.forEach(goal => {
      interests.add(goal.type)
    })
    
    return Array.from(interests)
  }

  private isRuleApplicable(rule: GermanFinancialRule, profile: UserBehaviorProfile): boolean {
    // 简化的规则适用性检查
    return true
  }

  private calculateRecencyScore(recommendation: Recommendation): number {
    const daysSinceCreated = (Date.now() - recommendation.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, 1 - daysSinceCreated / 30) // 30天内的推荐得分更高
  }

  private calculateGermanRelevanceScore(recommendation: Recommendation): number {
    const hasGermanContent = recommendation.germanRelevance.taxImplications || 
                           recommendation.germanRelevance.legalConsiderations ||
                           recommendation.germanRelevance.localResources?.length
    return hasGermanContent ? 1 : 0.5
  }
}

// 导出单例实例
export const recommendationEngine = RecommendationEngine.getInstance()
