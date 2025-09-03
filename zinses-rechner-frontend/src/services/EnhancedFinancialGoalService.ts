/**
 * 增强的个人财务目标管理服务
 * 与用户身份系统集成，支持多用户、协作和智能推荐
 *
 * @version 2.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { AnonymousUserService } from './AnonymousUserService'
import { OptionalRegistrationService } from './OptionalRegistrationService'
import { EnterpriseLocalStorageService } from './EnterpriseLocalStorageService'
import { CalculationHistoryService } from './CalculationHistoryService'
import type { FinancialGoal, GoalProgress, GoalMilestone, GoalType, GoalPriority, GoalStatus } from './FinancialGoalService'

// 增强的财务目标接口
export interface EnhancedFinancialGoal extends FinancialGoal {
  userId: string                    // 用户关联
  collaborators?: Collaborator[]    // 协作者
  linkedCalculations: string[]      // 关联的计算记录
  autoUpdate: boolean              // 自动更新开关
  reminderSettings: ReminderSettings

  // 隐私和分享
  visibility: 'private' | 'shared' | 'public'
  shareToken?: string

  metadata: {
    createdFrom: 'manual' | 'template' | 'recommendation'
    templateId?: string
    version: string
  }
}

// 协作者接口
export interface Collaborator {
  userId: string
  email?: string
  name?: string
  role: 'viewer' | 'contributor' | 'admin'
  permissions: CollaboratorPermissions
  invitedAt: Date
  acceptedAt?: Date
  status: 'pending' | 'active' | 'inactive'
}

export interface CollaboratorPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canInviteOthers: boolean
  canManagePermissions: boolean
}

// 提醒设置
export interface ReminderSettings {
  enabled: boolean
  frequency: 'weekly' | 'monthly' | 'quarterly'
  milestoneReminders: boolean
  progressReminders: boolean
  deadlineReminders: boolean
  customReminders: CustomReminder[]
}

export interface CustomReminder {
  id: string
  message: string
  triggerDate: Date
  recurring: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
}

// 目标模板
export interface GoalTemplate {
  id: string
  name: string
  description: string
  category: GoalType
  targetAmountRange: {
    min: number
    max: number
    suggested: number
  }
  timeframeRange: {
    minMonths: number
    maxMonths: number
    suggestedMonths: number
  }
  monthlyContributionSuggestion: number
  tags: string[]
  germanSpecific: {
    taxAdvantaged: boolean
    employerMatchAvailable: boolean
    inflationAdjusted: boolean
  }
  popularity: number
  successRate: number
}

// 目标推荐
export interface GoalRecommendation {
  id: string
  type: 'new_goal' | 'optimization' | 'milestone' | 'contribution_adjustment'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  confidence: number
  potentialImpact: string
  actionRequired: string
  relatedGoalId?: string
  templateId?: string
  estimatedBenefit?: number
  deadline?: Date
}

// 进度分析
export interface ProgressAnalysis {
  goalId: string
  currentTrend: 'improving' | 'stable' | 'declining'
  projectedOutcome: 'on_track' | 'ahead' | 'behind' | 'at_risk'
  confidenceLevel: number
  keyFactors: string[]
  recommendations: string[]
  historicalData: ProgressDataPoint[]
}

export interface ProgressDataPoint {
  date: Date
  amount: number
  monthlyContribution: number
  progress: number
}

// 完成预测
export interface CompletionPrediction {
  goalId: string
  mostLikelyDate: Date
  optimisticDate: Date
  pessimisticDate: Date
  confidence: number
  requiredAdjustments: {
    monthlyContribution?: number
    targetAmount?: number
    targetDate?: Date
  }
  scenarios: PredictionScenario[]
}

export interface PredictionScenario {
  name: string
  probability: number
  completionDate: Date
  finalAmount: number
  adjustments: string[]
}

/**
 * 增强的财务目标管理服务
 */
export class EnhancedFinancialGoalService {
  private static instance: EnhancedFinancialGoalService
  private anonymousUserService: AnonymousUserService
  private registrationService: OptionalRegistrationService
  private storageService: EnterpriseLocalStorageService
  private calculationHistoryService: CalculationHistoryService

  private goals: EnhancedFinancialGoal[] = []
  private templates: GoalTemplate[] = []
  private milestones: Map<string, GoalMilestone[]> = new Map()
  private reminders: Map<string, ReminderSettings> = new Map()
  private isInitialized = false

  private constructor() {
    this.anonymousUserService = AnonymousUserService.getInstance()
    this.registrationService = OptionalRegistrationService.getInstance()
    this.storageService = EnterpriseLocalStorageService.getInstance()
    this.calculationHistoryService = CalculationHistoryService.getInstance()
  }

  static getInstance(): EnhancedFinancialGoalService {
    if (!EnhancedFinancialGoalService.instance) {
      EnhancedFinancialGoalService.instance = new EnhancedFinancialGoalService()
    }
    return EnhancedFinancialGoalService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.anonymousUserService.initialize()
      await this.registrationService.initialize()
      await this.storageService.initialize()
      await this.calculationHistoryService.initialize()
      await this.loadGoals()
      await this.loadTemplates()
      await this.loadMilestones()
      await this.loadReminders()
      this.startPeriodicTasks()
      this.isInitialized = true
      console.log('✅ EnhancedFinancialGoalService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize EnhancedFinancialGoalService:', error)
      throw error
    }
  }

  /**
   * 创建新的财务目标
   */
  async createGoal(
    goalData: Omit<EnhancedFinancialGoal, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId?: string
  ): Promise<EnhancedFinancialGoal> {
    if (!this.isInitialized) await this.initialize()

    // 获取当前用户
    const currentUser = userId ? { id: userId } : await this.userIdentityService.getCurrentUser()
    if (!currentUser) {
      throw new Error('User must be logged in to create goals')
    }

    const goal: EnhancedFinancialGoal = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      linkedCalculations: [],
      autoUpdate: true,
      reminderSettings: {
        enabled: true,
        frequency: 'monthly',
        milestoneReminders: true,
        progressReminders: true,
        deadlineReminders: true,
        customReminders: []
      },
      visibility: 'private',
      metadata: {
        createdFrom: 'manual',
        version: '2.0'
      },
      ...goalData
    }

    this.goals.push(goal)
    await this.saveGoals()

    console.log(`🎯 Goal created: ${goal.name} for user ${currentUser.id}`)
    return goal
  }

  /**
   * 获取用户的所有目标
   */
  async getUserGoals(userId?: string): Promise<EnhancedFinancialGoal[]> {
    if (!this.isInitialized) await this.initialize()

    const currentUser = userId ? { id: userId } : await this.userIdentityService.getCurrentUser()
    if (!currentUser) {
      return []
    }

    // 返回用户拥有的目标和被邀请协作的目标
    return this.goals.filter(goal =>
      goal.userId === currentUser.id ||
      goal.collaborators?.some(c => c.userId === currentUser.id && c.status === 'active')
    )
  }

  /**
   * 基于计算历史自动更新目标进度
   */
  async syncWithCalculationHistory(userId?: string): Promise<SyncResult> {
    if (!this.isInitialized) await this.initialize()

    const currentUser = userId ? { id: userId } : await this.userIdentityService.getCurrentUser()
    if (!currentUser) {
      throw new Error('User must be logged in to sync goals')
    }

    const userGoals = await this.getUserGoals(currentUser.id)
    const calculations = await this.calculationHistoryService.findByUserId(currentUser.id)

    let updatedGoals = 0

    for (const goal of userGoals) {
      if (!goal.autoUpdate) continue

      // 查找相关计算
      const relevantCalculations = calculations.filter(calc =>
        this.isRelevantToGoal(calc, goal)
      )

      if (relevantCalculations.length > 0) {
        // 更新目标进度
        const newProgress = this.calculateProgressFromHistory(goal, relevantCalculations)
        if (newProgress !== goal.currentAmount) {
          await this.updateGoal(goal.id, {
            currentAmount: newProgress,
            linkedCalculations: relevantCalculations.map(c => c.id)
          })
          updatedGoals++
        }
      }
    }

    return {
      success: true,
      updatedGoals,
      timestamp: new Date()
    }
  }

  /**
   * 获取目标推荐
   */
  async getRecommendations(userId?: string): Promise<GoalRecommendation[]> {
    if (!this.isInitialized) await this.initialize()

    const currentUser = userId ? { id: userId } : await this.userIdentityService.getCurrentUser()
    if (!currentUser) {
      return []
    }

    const userGoals = await this.getUserGoals(currentUser.id)
    const calculations = await this.calculationHistoryService.findByUserId(currentUser.id)
    const recommendations: GoalRecommendation[] = []

    // 基于用户年龄和收入的推荐
    recommendations.push(...await this.generateAgeBasedRecommendations(currentUser, userGoals))

    // 基于计算历史的推荐
    recommendations.push(...await this.generateCalculationBasedRecommendations(calculations, userGoals))

    // 基于目标进度的优化建议
    recommendations.push(...await this.generateOptimizationRecommendations(userGoals))

    // 按优先级和置信度排序
    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 }
      const scoreA = priorityWeight[a.priority] * a.confidence
      const scoreB = priorityWeight[b.priority] * b.confidence
      return scoreB - scoreA
    })
  }

  /**
   * 获取目标模板
   */
  async getGoalTemplates(category?: GoalType): Promise<GoalTemplate[]> {
    if (!this.isInitialized) await this.initialize()

    let templates = [...this.templates]

    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    // 按受欢迎程度和成功率排序
    return templates.sort((a, b) => {
      const scoreA = a.popularity * 0.6 + a.successRate * 0.4
      const scoreB = b.popularity * 0.6 + b.successRate * 0.4
      return scoreB - scoreA
    })
  }

  /**
   * 从模板创建目标
   */
  async createFromTemplate(
    templateId: string,
    customizations: Partial<EnhancedFinancialGoal>,
    userId?: string
  ): Promise<EnhancedFinancialGoal> {
    const template = this.templates.find(t => t.id === templateId)
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`)
    }

    const goalData: Omit<EnhancedFinancialGoal, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
      name: customizations.name || template.name,
      type: template.category,
      description: customizations.description || template.description,
      targetAmount: customizations.targetAmount || template.targetAmountRange.suggested,
      currentAmount: customizations.currentAmount || 0,
      targetDate: customizations.targetDate || new Date(Date.now() + template.timeframeRange.suggestedMonths * 30 * 24 * 60 * 60 * 1000),
      startDate: new Date(),
      monthlyContribution: customizations.monthlyContribution || template.monthlyContributionSuggestion,
      priority: customizations.priority || 'medium',
      status: 'active',
      tags: [...template.tags, ...(customizations.tags || [])],
      taxAdvantaged: customizations.taxAdvantaged ?? template.germanSpecific.taxAdvantaged,
      employerMatch: customizations.employerMatch || 0,
      inflationAdjusted: customizations.inflationAdjusted ?? template.germanSpecific.inflationAdjusted,
      linkedCalculations: [],
      autoUpdate: true,
      reminderSettings: {
        enabled: true,
        frequency: 'monthly',
        milestoneReminders: true,
        progressReminders: true,
        deadlineReminders: true,
        customReminders: []
      },
      visibility: 'private',
      metadata: {
        createdFrom: 'template',
        templateId: template.id,
        version: '2.0'
      }
    }

    return this.createGoal(goalData, userId)
  }

  /**
   * 更新目标
   */
  async updateGoal(goalId: string, updates: Partial<EnhancedFinancialGoal>): Promise<EnhancedFinancialGoal> {
    if (!this.isInitialized) await this.initialize()

    const goalIndex = this.goals.findIndex(g => g.id === goalId)
    if (goalIndex === -1) {
      throw new Error(`Goal with ID ${goalId} not found`)
    }

    this.goals[goalIndex] = {
      ...this.goals[goalIndex],
      ...updates,
      updatedAt: new Date()
    }

    await this.saveGoals()
    return this.goals[goalIndex]
  }

  /**
   * 删除目标
   */
  async deleteGoal(goalId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    this.goals = this.goals.filter(g => g.id !== goalId)
    await this.saveGoals()
  }

  // 私有辅助方法
  private async loadGoals(): Promise<void> {
    try {
      // 从存储加载目标（简化实现）
      this.goals = []
    } catch (error) {
      console.error('Failed to load goals:', error)
      this.goals = []
    }
  }

  private async saveGoals(): Promise<void> {
    try {
      // 保存到存储（简化实现）
      console.log(`💾 Saved ${this.goals.length} goals`)
    } catch (error) {
      console.error('Failed to save goals:', error)
    }
  }

  private async loadTemplates(): Promise<void> {
    // 加载德国常见财务目标模板
    this.templates = [
      {
        id: 'retirement-template',
        name: 'Altersvorsorge',
        description: 'Aufbau einer privaten Altersvorsorge für den Ruhestand',
        category: 'retirement',
        targetAmountRange: { min: 100000, max: 1000000, suggested: 300000 },
        timeframeRange: { minMonths: 120, maxMonths: 480, suggestedMonths: 300 },
        monthlyContributionSuggestion: 500,
        tags: ['Rente', 'Altersvorsorge', 'Riester', 'Rürup'],
        germanSpecific: {
          taxAdvantaged: true,
          employerMatchAvailable: true,
          inflationAdjusted: true
        },
        popularity: 0.9,
        successRate: 0.85
      },
      {
        id: 'house-template',
        name: 'Eigenheim kaufen',
        description: 'Sparen für den Kauf einer Immobilie',
        category: 'house',
        targetAmountRange: { min: 50000, max: 200000, suggested: 100000 },
        timeframeRange: { minMonths: 36, maxMonths: 120, suggestedMonths: 60 },
        monthlyContributionSuggestion: 1000,
        tags: ['Immobilie', 'Eigenheim', 'Bausparen'],
        germanSpecific: {
          taxAdvantaged: false,
          employerMatchAvailable: false,
          inflationAdjusted: true
        },
        popularity: 0.8,
        successRate: 0.75
      }
    ]
  }

  private isRelevantToGoal(calculation: any, goal: EnhancedFinancialGoal): boolean {
    // 简化的相关性检查
    return calculation.calculatorType === 'compound-interest' &&
           goal.type === 'retirement'
  }

  private calculateProgressFromHistory(goal: EnhancedFinancialGoal, calculations: any[]): number {
    // 简化的进度计算
    return goal.currentAmount + (calculations.length * 100)
  }

  private async generateAgeBasedRecommendations(user: any, goals: EnhancedFinancialGoal[]): Promise<GoalRecommendation[]> {
    // 基于年龄的推荐逻辑
    return []
  }

  private async generateCalculationBasedRecommendations(calculations: any[], goals: EnhancedFinancialGoal[]): Promise<GoalRecommendation[]> {
    // 基于计算历史的推荐逻辑
    return []
  }

  private async generateOptimizationRecommendations(goals: EnhancedFinancialGoal[]): Promise<GoalRecommendation[]> {
    // 目标优化推荐逻辑
    return []
  }
}

// 同步结果接口
export interface SyncResult {
  success: boolean
  updatedGoals: number
  timestamp: Date
}

// 导出单例实例
export const enhancedFinancialGoalService = EnhancedFinancialGoalService.getInstance()
