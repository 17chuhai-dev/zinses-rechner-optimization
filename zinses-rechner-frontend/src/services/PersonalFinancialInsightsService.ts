/**
 * 个人财务洞察生成引擎
 * 基于用户数据生成个性化财务洞察、建议和预测，集成德国金融规则和最佳实践
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserBehaviorAnalyticsService } from './UserBehaviorAnalyticsService'
import { CalculationHistoryService } from './CalculationHistoryService'
import { EnhancedFinancialGoalService } from './EnhancedFinancialGoalService'
import { GermanFinancialRulesEngine } from './GermanFinancialRulesEngine'
import { EnterpriseLocalStorageService } from './EnterpriseLocalStorageService'

// 财务洞察类型
export type InsightType = 
  | 'spending' 
  | 'savings' 
  | 'investment' 
  | 'goal_progress' 
  | 'tax_optimization' 
  | 'risk_management'
  | 'retirement_planning'

// 财务洞察
export interface FinancialInsight {
  id: string
  userId: string
  type: InsightType
  title: string
  description: string
  
  // 洞察内容
  insight: string
  recommendation: string
  
  // 重要性和紧急性
  importance: 'low' | 'medium' | 'high'
  urgency: 'low' | 'medium' | 'high'
  
  // 数据支持
  dataPoints: DataPoint[]
  confidence: number // 0-1
  
  // 行动建议
  actionItems: ActionItem[]
  
  // 预期影响
  expectedImpact: ExpectedImpact
  
  // 时间信息
  generatedAt: Date
  validUntil?: Date
  
  // 用户反馈
  userFeedback?: InsightFeedback
}

// 数据点
export interface DataPoint {
  metric: string
  value: number
  unit: string
  trend?: 'up' | 'down' | 'stable'
  comparison?: {
    baseline: number
    period: string
  }
}

// 行动项
export interface ActionItem {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  timeframe: 'immediate' | 'short_term' | 'long_term'
  category: string
  estimatedImpact: number
}

// 预期影响
export interface ExpectedImpact {
  financial: {
    amount: number
    timeframe: string
    probability: number
  }
  behavioral: {
    description: string
    likelihood: number
  }
  educational: {
    knowledgeGain: string
    skillImprovement: string
  }
}

// 洞察反馈
export interface InsightFeedback {
  rating: number // 1-5
  helpful: boolean
  implemented: boolean
  comment?: string
  timestamp: Date
}

// 财务健康评估
export interface FinancialHealthAssessment {
  userId: string
  assessmentDate: Date
  overallScore: number // 0-100
  
  // 各维度评分
  dimensions: HealthDimension[]
  
  // 关键指标
  keyMetrics: HealthMetric[]
  
  // 风险评估
  risks: FinancialRisk[]
  
  // 改进建议
  improvements: ImprovementSuggestion[]
  
  // 基准比较
  benchmarks: BenchmarkComparison[]
}

// 健康维度
export interface HealthDimension {
  dimension: 'liquidity' | 'debt' | 'savings' | 'investment' | 'protection' | 'planning'
  score: number // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor'
  description: string
  factors: HealthFactor[]
}

// 健康因素
export interface HealthFactor {
  factor: string
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
  description: string
}

// 健康指标
export interface HealthMetric {
  metric: string
  value: number
  unit: string
  target: number
  status: 'on_track' | 'needs_attention' | 'critical'
  trend: 'improving' | 'stable' | 'declining'
}

// 财务风险
export interface FinancialRisk {
  id: string
  type: 'liquidity' | 'market' | 'credit' | 'inflation' | 'longevity' | 'disability'
  severity: 'low' | 'medium' | 'high' | 'critical'
  probability: number // 0-1
  impact: number // 0-1
  description: string
  mitigation: string[]
  timeframe: string
}

// 改进建议
export interface ImprovementSuggestion {
  id: string
  category: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  difficulty: 'easy' | 'moderate' | 'challenging'
  timeToImplement: string
  expectedBenefit: string
  steps: string[]
}

// 基准比较
export interface BenchmarkComparison {
  category: string
  userValue: number
  benchmarkValue: number
  percentile: number
  comparison: 'above' | 'at' | 'below'
  description: string
}

// 财务预测
export interface FinancialProjection {
  userId: string
  projectionDate: Date
  timeHorizon: number // years
  
  // 预测场景
  scenarios: ProjectionScenario[]
  
  // 关键假设
  assumptions: ProjectionAssumption[]
  
  // 敏感性分析
  sensitivity: SensitivityAnalysis[]
  
  // 里程碑预测
  milestones: ProjectedMilestone[]
}

// 预测场景
export interface ProjectionScenario {
  name: 'optimistic' | 'realistic' | 'pessimistic'
  probability: number
  
  // 财务指标预测
  netWorth: TimeSeriesProjection
  income: TimeSeriesProjection
  expenses: TimeSeriesProjection
  savings: TimeSeriesProjection
  investments: TimeSeriesProjection
  
  // 目标达成预测
  goalAchievement: GoalAchievementProjection[]
}

// 时间序列预测
export interface TimeSeriesProjection {
  metric: string
  unit: string
  dataPoints: Array<{
    date: Date
    value: number
    confidence: number
  }>
}

// 目标达成预测
export interface GoalAchievementProjection {
  goalId: string
  goalName: string
  currentProgress: number
  projectedCompletion: Date
  probability: number
  requiredActions: string[]
}

// 预测假设
export interface ProjectionAssumption {
  category: string
  assumption: string
  value: number
  unit: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
}

// 敏感性分析
export interface SensitivityAnalysis {
  variable: string
  baseValue: number
  scenarios: Array<{
    change: number // percentage
    impact: number // on final outcome
  }>
}

// 预测里程碑
export interface ProjectedMilestone {
  name: string
  description: string
  targetDate: Date
  probability: number
  dependencies: string[]
  significance: 'minor' | 'major' | 'critical'
}

// 个性化建议
export interface ActionableRecommendation {
  id: string
  userId: string
  category: string
  title: string
  description: string
  
  // 建议详情
  rationale: string
  benefits: string[]
  risks: string[]
  
  // 实施信息
  steps: RecommendationStep[]
  resources: RecommendationResource[]
  
  // 优先级和时间
  priority: number // 1-10
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
  effort: 'minimal' | 'moderate' | 'significant'
  
  // 预期结果
  expectedOutcome: ExpectedOutcome
  
  // 跟踪信息
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  createdAt: Date
  updatedAt: Date
}

// 建议步骤
export interface RecommendationStep {
  stepNumber: number
  title: string
  description: string
  estimatedTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  dependencies?: string[]
}

// 建议资源
export interface RecommendationResource {
  type: 'article' | 'calculator' | 'tool' | 'service' | 'contact'
  title: string
  description: string
  url?: string
  cost?: number
}

// 预期结果
export interface ExpectedOutcome {
  financialImpact: {
    amount: number
    timeframe: string
    confidence: number
  }
  nonFinancialBenefits: string[]
  riskReduction: string[]
  knowledgeGain: string[]
}

/**
 * 个人财务洞察生成引擎
 */
export class PersonalFinancialInsightsService {
  private static instance: PersonalFinancialInsightsService
  private behaviorService: UserBehaviorAnalyticsService
  private historyService: CalculationHistoryService
  private goalService: EnhancedFinancialGoalService
  private rulesEngine: GermanFinancialRulesEngine
  private storageService: EnterpriseLocalStorageService
  
  // 洞察缓存
  private insights: Map<string, FinancialInsight[]> = new Map()
  private healthAssessments: Map<string, FinancialHealthAssessment> = new Map()
  private projections: Map<string, FinancialProjection> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.behaviorService = UserBehaviorAnalyticsService.getInstance()
    this.historyService = CalculationHistoryService.getInstance()
    this.goalService = EnhancedFinancialGoalService.getInstance()
    this.rulesEngine = GermanFinancialRulesEngine.getInstance()
    this.storageService = EnterpriseLocalStorageService.getInstance()
  }

  static getInstance(): PersonalFinancialInsightsService {
    if (!PersonalFinancialInsightsService.instance) {
      PersonalFinancialInsightsService.instance = new PersonalFinancialInsightsService()
    }
    return PersonalFinancialInsightsService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.behaviorService.initialize()
      await this.historyService.initialize()
      await this.goalService.initialize()
      await this.rulesEngine.initialize()
      await this.storageService.initialize()
      
      await this.loadInsights()
      await this.loadHealthAssessments()
      await this.loadProjections()
      
      this.startPeriodicInsightGeneration()
      this.isInitialized = true
      console.log('✅ PersonalFinancialInsightsService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize PersonalFinancialInsightsService:', error)
      throw error
    }
  }

  /**
   * 生成财务洞察
   */
  async generateFinancialInsights(userId: string): Promise<FinancialInsight[]> {
    if (!this.isInitialized) await this.initialize()

    try {
      const insights: FinancialInsight[] = []

      // 获取用户数据
      const behaviorPatterns = await this.behaviorService.analyzeUserBehaviorPatterns(userId, 'month')
      const calculationHistory = await this.historyService.getCalculationHistory(userId)
      const userGoals = await this.goalService.getUserGoals(userId)
      const engagementScore = await this.behaviorService.calculateEngagementScore(userId)

      // 生成不同类型的洞察
      const spendingInsights = await this.generateSpendingInsights(userId, calculationHistory)
      const savingsInsights = await this.generateSavingsInsights(userId, calculationHistory, userGoals)
      const goalInsights = await this.generateGoalInsights(userId, userGoals)
      const investmentInsights = await this.generateInvestmentInsights(userId, calculationHistory)
      const taxInsights = await this.generateTaxOptimizationInsights(userId, calculationHistory)

      insights.push(...spendingInsights, ...savingsInsights, ...goalInsights, ...investmentInsights, ...taxInsights)

      // 按重要性和紧急性排序
      insights.sort((a, b) => {
        const priorityA = this.calculateInsightPriority(a)
        const priorityB = this.calculateInsightPriority(b)
        return priorityB - priorityA
      })

      // 缓存结果
      this.insights.set(userId, insights)
      await this.saveInsights(userId, insights)

      console.log(`💡 Generated ${insights.length} financial insights for user ${userId}`)
      return insights.slice(0, 10) // 返回前10个最重要的洞察

    } catch (error) {
      console.error('Failed to generate financial insights:', error)
      return []
    }
  }

  /**
   * 评估财务健康状况
   */
  async assessFinancialHealth(userId: string): Promise<FinancialHealthAssessment> {
    if (!this.isInitialized) await this.initialize()

    try {
      // 获取用户数据
      const calculationHistory = await this.historyService.getCalculationHistory(userId)
      const userGoals = await this.goalService.getUserGoals(userId)
      const behaviorPatterns = await this.behaviorService.analyzeUserBehaviorPatterns(userId, 'quarter')

      // 评估各个维度
      const dimensions: HealthDimension[] = [
        await this.assessLiquidityHealth(userId, calculationHistory),
        await this.assessDebtHealth(userId, calculationHistory),
        await this.assessSavingsHealth(userId, calculationHistory, userGoals),
        await this.assessInvestmentHealth(userId, calculationHistory),
        await this.assessProtectionHealth(userId, calculationHistory),
        await this.assessPlanningHealth(userId, userGoals, behaviorPatterns)
      ]

      // 计算总体评分
      const overallScore = dimensions.reduce((sum, dim) => sum + dim.score, 0) / dimensions.length

      // 识别关键指标
      const keyMetrics = await this.calculateKeyHealthMetrics(userId, calculationHistory, userGoals)

      // 评估风险
      const risks = await this.identifyFinancialRisks(userId, calculationHistory, userGoals)

      // 生成改进建议
      const improvements = await this.generateImprovementSuggestions(dimensions, risks)

      // 基准比较
      const benchmarks = await this.performBenchmarkComparison(userId, overallScore, dimensions)

      const assessment: FinancialHealthAssessment = {
        userId,
        assessmentDate: new Date(),
        overallScore: Math.round(overallScore),
        dimensions,
        keyMetrics,
        risks,
        improvements,
        benchmarks
      }

      // 缓存结果
      this.healthAssessments.set(userId, assessment)
      await this.saveHealthAssessment(userId, assessment)

      return assessment

    } catch (error) {
      console.error('Failed to assess financial health:', error)
      throw error
    }
  }

  /**
   * 预测财务未来
   */
  async predictFinancialFuture(userId: string, scenarios: string[]): Promise<FinancialProjection> {
    if (!this.isInitialized) await this.initialize()

    try {
      // 获取历史数据
      const calculationHistory = await this.historyService.getCalculationHistory(userId)
      const userGoals = await this.goalService.getUserGoals(userId)
      const behaviorPatterns = await this.behaviorService.analyzeUserBehaviorPatterns(userId, 'year')

      // 分析历史趋势
      const historicalTrends = this.analyzeHistoricalTrends(calculationHistory)

      // 生成预测场景
      const projectionScenarios: ProjectionScenario[] = []
      
      for (const scenarioName of ['optimistic', 'realistic', 'pessimistic'] as const) {
        const scenario = await this.generateProjectionScenario(
          userId, 
          scenarioName, 
          historicalTrends, 
          userGoals
        )
        projectionScenarios.push(scenario)
      }

      // 定义关键假设
      const assumptions = this.defineProjectionAssumptions(historicalTrends, behaviorPatterns)

      // 进行敏感性分析
      const sensitivity = this.performSensitivityAnalysis(projectionScenarios)

      // 预测里程碑
      const milestones = await this.predictMilestones(userId, userGoals, projectionScenarios)

      const projection: FinancialProjection = {
        userId,
        projectionDate: new Date(),
        timeHorizon: 10, // 10年预测
        scenarios: projectionScenarios,
        assumptions,
        sensitivity,
        milestones
      }

      // 缓存结果
      this.projections.set(userId, projection)
      await this.saveProjection(userId, projection)

      return projection

    } catch (error) {
      console.error('Failed to predict financial future:', error)
      throw error
    }
  }

  /**
   * 生成可执行建议
   */
  async generateActionableRecommendations(userId: string): Promise<ActionableRecommendation[]> {
    if (!this.isInitialized) await this.initialize()

    try {
      const recommendations: ActionableRecommendation[] = []

      // 获取财务洞察和健康评估
      const insights = await this.generateFinancialInsights(userId)
      const healthAssessment = await this.assessFinancialHealth(userId)

      // 基于洞察生成建议
      for (const insight of insights.slice(0, 5)) {
        const recommendation = await this.convertInsightToRecommendation(userId, insight)
        if (recommendation) {
          recommendations.push(recommendation)
        }
      }

      // 基于健康评估生成建议
      for (const improvement of healthAssessment.improvements.slice(0, 3)) {
        const recommendation = await this.convertImprovementToRecommendation(userId, improvement)
        if (recommendation) {
          recommendations.push(recommendation)
        }
      }

      // 基于德国金融规则生成建议
      const germanRecommendations = await this.generateGermanSpecificRecommendations(userId)
      recommendations.push(...germanRecommendations)

      // 按优先级排序
      recommendations.sort((a, b) => b.priority - a.priority)

      return recommendations.slice(0, 8) // 返回前8个建议

    } catch (error) {
      console.error('Failed to generate actionable recommendations:', error)
      return []
    }
  }

  // 私有方法
  private async generateSpendingInsights(userId: string, history: any[]): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = []

    // 分析支出模式
    const spendingCalculations = history.filter(h => 
      h.calculatorType === 'budget' || h.calculatorType === 'expense'
    )

    if (spendingCalculations.length > 0) {
      const totalSpending = spendingCalculations.reduce((sum, calc) => 
        sum + (calc.inputData.amount || 0), 0
      )

      const averageMonthlySpending = totalSpending / Math.max(1, spendingCalculations.length)

      insights.push({
        id: crypto.randomUUID(),
        userId,
        type: 'spending',
        title: 'Ausgabenanalyse',
        description: 'Analyse Ihrer monatlichen Ausgaben',
        insight: `Ihre durchschnittlichen monatlichen Ausgaben betragen €${averageMonthlySpending.toFixed(2)}`,
        recommendation: 'Überprüfen Sie Ihre größten Ausgabenposten auf Einsparpotential',
        importance: 'medium',
        urgency: 'low',
        dataPoints: [
          {
            metric: 'Durchschnittliche monatliche Ausgaben',
            value: averageMonthlySpending,
            unit: '€',
            trend: 'stable'
          }
        ],
        confidence: 0.8,
        actionItems: [
          {
            id: crypto.randomUUID(),
            title: 'Ausgaben kategorisieren',
            description: 'Teilen Sie Ihre Ausgaben in Kategorien ein',
            priority: 'medium',
            effort: 'low',
            timeframe: 'short_term',
            category: 'budgeting',
            estimatedImpact: 0.3
          }
        ],
        expectedImpact: {
          financial: {
            amount: averageMonthlySpending * 0.1,
            timeframe: '3 Monate',
            probability: 0.7
          },
          behavioral: {
            description: 'Bewusstere Ausgabenentscheidungen',
            likelihood: 0.8
          },
          educational: {
            knowledgeGain: 'Besseres Verständnis der Ausgabenstruktur',
            skillImprovement: 'Budgetplanung'
          }
        },
        generatedAt: new Date()
      })
    }

    return insights
  }

  private async generateSavingsInsights(userId: string, history: any[], goals: any[]): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = []

    // 分析储蓄行为
    const savingsCalculations = history.filter(h => 
      h.calculatorType === 'savings' || h.calculatorType === 'compound_interest'
    )

    if (savingsCalculations.length > 0) {
      const totalSavings = savingsCalculations.reduce((sum, calc) => 
        sum + (calc.outputData.finalAmount || 0), 0
      )

      const savingsGoals = goals.filter(g => g.type === 'savings')
      const hasActiveSavingsGoal = savingsGoals.some(g => g.status === 'active')

      if (!hasActiveSavingsGoal) {
        insights.push({
          id: crypto.randomUUID(),
          userId,
          type: 'savings',
          title: 'Sparziel empfohlen',
          description: 'Sie haben noch kein aktives Sparziel',
          insight: 'Basierend auf Ihren Berechnungen könnten Sie von einem strukturierten Sparziel profitieren',
          recommendation: 'Erstellen Sie ein konkretes Sparziel mit Zeitrahmen',
          importance: 'high',
          urgency: 'medium',
          dataPoints: [
            {
              metric: 'Berechnete Sparsumme',
              value: totalSavings,
              unit: '€'
            }
          ],
          confidence: 0.9,
          actionItems: [
            {
              id: crypto.randomUUID(),
              title: 'Sparziel erstellen',
              description: 'Definieren Sie ein konkretes Sparziel',
              priority: 'high',
              effort: 'low',
              timeframe: 'immediate',
              category: 'goal_setting',
              estimatedImpact: 0.8
            }
          ],
          expectedImpact: {
            financial: {
              amount: totalSavings * 0.2,
              timeframe: '1 Jahr',
              probability: 0.8
            },
            behavioral: {
              description: 'Strukturierteres Sparverhalten',
              likelihood: 0.9
            },
            educational: {
              knowledgeGain: 'Zielsetzung und Planung',
              skillImprovement: 'Finanzplanung'
            }
          },
          generatedAt: new Date()
        })
      }
    }

    return insights
  }

  private async generateGoalInsights(userId: string, goals: any[]): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = []

    if (goals.length === 0) {
      insights.push({
        id: crypto.randomUUID(),
        userId,
        type: 'goal_progress',
        title: 'Erste Finanzziele setzen',
        description: 'Sie haben noch keine Finanzziele definiert',
        insight: 'Finanzziele helfen dabei, fokussiert zu sparen und zu investieren',
        recommendation: 'Beginnen Sie mit einem einfachen Sparziel für den Notgroschen',
        importance: 'high',
        urgency: 'high',
        dataPoints: [],
        confidence: 1.0,
        actionItems: [
          {
            id: crypto.randomUUID(),
            title: 'Notgroschen-Ziel erstellen',
            description: 'Sparen Sie 3-6 Monatsausgaben als Notgroschen',
            priority: 'high',
            effort: 'medium',
            timeframe: 'short_term',
            category: 'emergency_fund',
            estimatedImpact: 0.9
          }
        ],
        expectedImpact: {
          financial: {
            amount: 5000,
            timeframe: '6 Monate',
            probability: 0.8
          },
          behavioral: {
            description: 'Strukturierte Finanzplanung',
            likelihood: 0.9
          },
          educational: {
            knowledgeGain: 'Bedeutung von Finanzzielen',
            skillImprovement: 'Zielsetzung'
          }
        },
        generatedAt: new Date()
      })
    }

    return insights
  }

  private async generateInvestmentInsights(userId: string, history: any[]): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = []

    const investmentCalculations = history.filter(h => 
      h.calculatorType === 'investment' || h.calculatorType === 'compound_interest'
    )

    if (investmentCalculations.length > 3) {
      insights.push({
        id: crypto.randomUUID(),
        userId,
        type: 'investment',
        title: 'ETF-Sparplan erwägen',
        description: 'Basierend auf Ihrem Interesse an Investitionen',
        insight: 'Sie beschäftigen sich häufig mit Investitionsberechnungen',
        recommendation: 'Erwägen Sie einen ETF-Sparplan für langfristigen Vermögensaufbau',
        importance: 'medium',
        urgency: 'low',
        dataPoints: [
          {
            metric: 'Investitionsberechnungen',
            value: investmentCalculations.length,
            unit: 'Anzahl'
          }
        ],
        confidence: 0.7,
        actionItems: [
          {
            id: crypto.randomUUID(),
            title: 'ETF-Sparplan informieren',
            description: 'Informieren Sie sich über ETF-Sparpläne',
            priority: 'medium',
            effort: 'medium',
            timeframe: 'medium_term',
            category: 'investment',
            estimatedImpact: 0.6
          }
        ],
        expectedImpact: {
          financial: {
            amount: 10000,
            timeframe: '5 Jahre',
            probability: 0.6
          },
          behavioral: {
            description: 'Langfristige Investitionsstrategie',
            likelihood: 0.7
          },
          educational: {
            knowledgeGain: 'ETF-Investitionen',
            skillImprovement: 'Portfoliomanagement'
          }
        },
        generatedAt: new Date()
      })
    }

    return insights
  }

  private async generateTaxOptimizationInsights(userId: string, history: any[]): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = []

    // 检查是否有税务相关的计算
    const taxCalculations = history.filter(h => 
      h.calculatorType === 'tax' || h.metadata?.category === 'tax'
    )

    if (taxCalculations.length === 0) {
      insights.push({
        id: crypto.randomUUID(),
        userId,
        type: 'tax_optimization',
        title: 'Steueroptimierung prüfen',
        description: 'Nutzen Sie alle verfügbaren Steuervorteile',
        insight: 'Sie haben noch keine Steueroptimierung durchgeführt',
        recommendation: 'Prüfen Sie Ihre Möglichkeiten zur Steueroptimierung für 2024',
        importance: 'medium',
        urgency: 'medium',
        dataPoints: [],
        confidence: 0.8,
        actionItems: [
          {
            id: crypto.randomUUID(),
            title: 'Steuerrechner verwenden',
            description: 'Nutzen Sie unseren Steuerrechner',
            priority: 'medium',
            effort: 'low',
            timeframe: 'short_term',
            category: 'tax_planning',
            estimatedImpact: 0.5
          }
        ],
        expectedImpact: {
          financial: {
            amount: 500,
            timeframe: '1 Jahr',
            probability: 0.7
          },
          behavioral: {
            description: 'Bewusste Steuerplanung',
            likelihood: 0.8
          },
          educational: {
            knowledgeGain: 'Deutsche Steuergesetze',
            skillImprovement: 'Steueroptimierung'
          }
        },
        generatedAt: new Date()
      })
    }

    return insights
  }

  private calculateInsightPriority(insight: FinancialInsight): number {
    const importanceWeight = { low: 1, medium: 2, high: 3 }
    const urgencyWeight = { low: 1, medium: 2, high: 3 }
    
    return (importanceWeight[insight.importance] * 2 + urgencyWeight[insight.urgency]) * insight.confidence
  }

  private async assessLiquidityHealth(userId: string, history: any[]): Promise<HealthDimension> {
    // 简化的流动性健康评估
    return {
      dimension: 'liquidity',
      score: 75,
      status: 'good',
      description: 'Ihre Liquiditätssituation ist solide',
      factors: [
        {
          factor: 'Notgroschen',
          impact: 'positive',
          weight: 0.6,
          description: 'Ausreichende Liquiditätsreserven'
        }
      ]
    }
  }

  private async assessDebtHealth(userId: string, history: any[]): Promise<HealthDimension> {
    // 简化的债务健康评估
    return {
      dimension: 'debt',
      score: 80,
      status: 'good',
      description: 'Ihre Verschuldung ist im gesunden Bereich',
      factors: []
    }
  }

  private async assessSavingsHealth(userId: string, history: any[], goals: any[]): Promise<HealthDimension> {
    // 简化的储蓄健康评估
    return {
      dimension: 'savings',
      score: 70,
      status: 'good',
      description: 'Ihr Sparverhalten ist positiv',
      factors: []
    }
  }

  private async assessInvestmentHealth(userId: string, history: any[]): Promise<HealthDimension> {
    // 简化的投资健康评估
    return {
      dimension: 'investment',
      score: 60,
      status: 'fair',
      description: 'Ihre Investitionsstrategie kann verbessert werden',
      factors: []
    }
  }

  private async assessProtectionHealth(userId: string, history: any[]): Promise<HealthDimension> {
    // 简化的保护健康评估
    return {
      dimension: 'protection',
      score: 65,
      status: 'fair',
      description: 'Ihr Versicherungsschutz sollte überprüft werden',
      factors: []
    }
  }

  private async assessPlanningHealth(userId: string, goals: any[], patterns: any): Promise<HealthDimension> {
    // 简化的规划健康评估
    return {
      dimension: 'planning',
      score: 85,
      status: 'excellent',
      description: 'Ihre Finanzplanung ist sehr gut strukturiert',
      factors: []
    }
  }

  private async calculateKeyHealthMetrics(userId: string, history: any[], goals: any[]): Promise<HealthMetric[]> {
    return [
      {
        metric: 'Sparquote',
        value: 15,
        unit: '%',
        target: 20,
        status: 'needs_attention',
        trend: 'improving'
      }
    ]
  }

  private async identifyFinancialRisks(userId: string, history: any[], goals: any[]): Promise<FinancialRisk[]> {
    return [
      {
        id: crypto.randomUUID(),
        type: 'inflation',
        severity: 'medium',
        probability: 0.7,
        impact: 0.5,
        description: 'Inflationsrisiko für langfristige Sparziele',
        mitigation: ['Inflationsgeschützte Anlagen erwägen', 'Diversifikation erhöhen'],
        timeframe: 'langfristig'
      }
    ]
  }

  private async generateImprovementSuggestions(dimensions: HealthDimension[], risks: FinancialRisk[]): Promise<ImprovementSuggestion[]> {
    return [
      {
        id: crypto.randomUUID(),
        category: 'savings',
        title: 'Sparquote erhöhen',
        description: 'Erhöhen Sie Ihre monatliche Sparquote',
        priority: 'medium',
        difficulty: 'moderate',
        timeToImplement: '1 Monat',
        expectedBenefit: 'Schnellerer Vermögensaufbau',
        steps: ['Budget analysieren', 'Ausgaben reduzieren', 'Automatischen Sparplan einrichten']
      }
    ]
  }

  private async performBenchmarkComparison(userId: string, score: number, dimensions: HealthDimension[]): Promise<BenchmarkComparison[]> {
    return [
      {
        category: 'Gesamtscore',
        userValue: score,
        benchmarkValue: 70,
        percentile: 75,
        comparison: 'above',
        description: 'Überdurchschnittliche Finanzgesundheit'
      }
    ]
  }

  private analyzeHistoricalTrends(history: any[]): any {
    // 简化的历史趋势分析
    return {
      savingsGrowth: 0.05,
      spendingGrowth: 0.03,
      investmentGrowth: 0.07
    }
  }

  private async generateProjectionScenario(
    userId: string, 
    scenarioName: 'optimistic' | 'realistic' | 'pessimistic',
    trends: any,
    goals: any[]
  ): Promise<ProjectionScenario> {
    // 简化的预测场景生成
    return {
      name: scenarioName,
      probability: scenarioName === 'realistic' ? 0.6 : 0.2,
      netWorth: {
        metric: 'Net Worth',
        unit: '€',
        dataPoints: []
      },
      income: {
        metric: 'Income',
        unit: '€',
        dataPoints: []
      },
      expenses: {
        metric: 'Expenses',
        unit: '€',
        dataPoints: []
      },
      savings: {
        metric: 'Savings',
        unit: '€',
        dataPoints: []
      },
      investments: {
        metric: 'Investments',
        unit: '€',
        dataPoints: []
      },
      goalAchievement: []
    }
  }

  private defineProjectionAssumptions(trends: any, patterns: any): ProjectionAssumption[] {
    return [
      {
        category: 'inflation',
        assumption: 'Jährliche Inflationsrate',
        value: 2.5,
        unit: '%',
        confidence: 0.7,
        impact: 'medium'
      }
    ]
  }

  private performSensitivityAnalysis(scenarios: ProjectionScenario[]): SensitivityAnalysis[] {
    return [
      {
        variable: 'Sparquote',
        baseValue: 15,
        scenarios: [
          { change: 10, impact: 0.15 },
          { change: -10, impact: -0.15 }
        ]
      }
    ]
  }

  private async predictMilestones(userId: string, goals: any[], scenarios: ProjectionScenario[]): Promise<ProjectedMilestone[]> {
    return [
      {
        name: 'Notgroschen vollständig',
        description: 'Notgroschen von 6 Monatsausgaben erreicht',
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        probability: 0.8,
        dependencies: ['Regelmäßiges Sparen'],
        significance: 'major'
      }
    ]
  }

  private async convertInsightToRecommendation(userId: string, insight: FinancialInsight): Promise<ActionableRecommendation | null> {
    // 简化的洞察转建议逻辑
    return {
      id: crypto.randomUUID(),
      userId,
      category: insight.type,
      title: insight.title,
      description: insight.recommendation,
      rationale: insight.insight,
      benefits: ['Verbesserte Finanzgesundheit'],
      risks: [],
      steps: insight.actionItems.map((item, index) => ({
        stepNumber: index + 1,
        title: item.title,
        description: item.description,
        estimatedTime: '30 Minuten',
        difficulty: 'easy'
      })),
      resources: [],
      priority: insight.importance === 'high' ? 8 : insight.importance === 'medium' ? 5 : 3,
      timeframe: 'short_term',
      effort: 'moderate',
      expectedOutcome: {
        financialImpact: insight.expectedImpact.financial,
        nonFinancialBenefits: [insight.expectedImpact.behavioral.description],
        riskReduction: [],
        knowledgeGain: [insight.expectedImpact.educational.knowledgeGain]
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private async convertImprovementToRecommendation(userId: string, improvement: ImprovementSuggestion): Promise<ActionableRecommendation | null> {
    // 简化的改进转建议逻辑
    return {
      id: crypto.randomUUID(),
      userId,
      category: improvement.category,
      title: improvement.title,
      description: improvement.description,
      rationale: improvement.expectedBenefit,
      benefits: [improvement.expectedBenefit],
      risks: [],
      steps: improvement.steps.map((step, index) => ({
        stepNumber: index + 1,
        title: step,
        description: step,
        estimatedTime: '1 Stunde',
        difficulty: improvement.difficulty === 'easy' ? 'easy' : 'medium'
      })),
      resources: [],
      priority: improvement.priority === 'high' ? 7 : improvement.priority === 'medium' ? 4 : 2,
      timeframe: 'medium_term',
      effort: improvement.difficulty === 'challenging' ? 'significant' : 'moderate',
      expectedOutcome: {
        financialImpact: {
          amount: 1000,
          timeframe: improvement.timeToImplement,
          confidence: 0.7
        },
        nonFinancialBenefits: [improvement.expectedBenefit],
        riskReduction: [],
        knowledgeGain: ['Verbesserte Finanzplanung']
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private async generateGermanSpecificRecommendations(userId: string): Promise<ActionableRecommendation[]> {
    // 基于德国金融规则的建议
    return [
      {
        id: crypto.randomUUID(),
        userId,
        category: 'tax_optimization',
        title: 'Riester-Rente prüfen',
        description: 'Prüfen Sie die Vorteile einer Riester-Rente',
        rationale: 'Staatliche Förderung und Steuervorteile nutzen',
        benefits: ['Staatliche Zulagen', 'Steuerliche Absetzbarkeit'],
        risks: ['Begrenzte Flexibilität'],
        steps: [
          {
            stepNumber: 1,
            title: 'Förderung berechnen',
            description: 'Berechnen Sie Ihre mögliche Riester-Förderung',
            estimatedTime: '20 Minuten',
            difficulty: 'easy'
          }
        ],
        resources: [],
        priority: 6,
        timeframe: 'medium_term',
        effort: 'moderate',
        expectedOutcome: {
          financialImpact: {
            amount: 2000,
            timeframe: '1 Jahr',
            confidence: 0.8
          },
          nonFinancialBenefits: ['Altersvorsorge-Sicherheit'],
          riskReduction: ['Altersarmut-Risiko'],
          knowledgeGain: ['Deutsche Altersvorsorge-Systeme']
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  private async saveInsights(userId: string, insights: FinancialInsight[]): Promise<void> {
    try {
      await this.storageService.storeData(
        `financial_insights_${userId}`,
        insights,
        { encrypt: true, compress: true, namespace: 'insights' }
      )
    } catch (error) {
      console.error('Failed to save insights:', error)
    }
  }

  private async loadInsights(): Promise<void> {
    try {
      console.log('💡 Loading financial insights...')
    } catch (error) {
      console.error('Failed to load insights:', error)
    }
  }

  private async saveHealthAssessment(userId: string, assessment: FinancialHealthAssessment): Promise<void> {
    try {
      await this.storageService.storeData(
        `health_assessment_${userId}`,
        assessment,
        { encrypt: true, compress: true, namespace: 'insights' }
      )
    } catch (error) {
      console.error('Failed to save health assessment:', error)
    }
  }

  private async loadHealthAssessments(): Promise<void> {
    try {
      console.log('🏥 Loading health assessments...')
    } catch (error) {
      console.error('Failed to load health assessments:', error)
    }
  }

  private async saveProjection(userId: string, projection: FinancialProjection): Promise<void> {
    try {
      await this.storageService.storeData(
        `financial_projection_${userId}`,
        projection,
        { encrypt: true, compress: true, namespace: 'insights' }
      )
    } catch (error) {
      console.error('Failed to save projection:', error)
    }
  }

  private async loadProjections(): Promise<void> {
    try {
      console.log('🔮 Loading financial projections...')
    } catch (error) {
      console.error('Failed to load projections:', error)
    }
  }

  private startPeriodicInsightGeneration(): void {
    // 每天生成新的洞察
    setInterval(() => {
      this.generatePeriodicInsights()
    }, 24 * 60 * 60 * 1000)
  }

  private async generatePeriodicInsights(): Promise<void> {
    console.log('🔄 Generating periodic insights...')
    // 定期洞察生成逻辑
  }
}

// Export singleton instance
export const personalFinancialInsightsService = PersonalFinancialInsightsService.getInstance()
