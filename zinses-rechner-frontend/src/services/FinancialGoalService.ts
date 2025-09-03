/**
 * 个人财务目标管理服务
 * 实现财务目标设定、跟踪和预测功能
 */

import { localStorageService } from './LocalStorageService'

// 财务目标类型
export type GoalType = 'retirement' | 'house' | 'education' | 'emergency' | 'vacation' | 'investment' | 'debt_payoff' | 'custom'

// 目标优先级
export type GoalPriority = 'high' | 'medium' | 'low'

// 目标状态
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'

// 财务目标接口
export interface FinancialGoal {
  id: string
  name: string
  type: GoalType
  description?: string
  targetAmount: number
  currentAmount: number
  targetDate: Date
  startDate: Date
  monthlyContribution: number
  priority: GoalPriority
  status: GoalStatus
  tags: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
  
  // 德国特定字段
  taxAdvantaged?: boolean // 是否享受税收优惠
  employerMatch?: number // 雇主匹配金额（退休金）
  inflationAdjusted?: boolean // 是否考虑通胀
}

// 目标进度接口
export interface GoalProgress {
  goalId: string
  progress: number // 0-1之间的进度百分比
  monthsRemaining: number
  requiredMonthlyContribution: number
  projectedCompletionDate: Date
  onTrack: boolean
  shortfall: number // 缺口金额
  surplus: number // 超额金额
  
  // 预测数据
  projectedFinalAmount: number
  totalContributions: number
  totalInterest: number
  
  // 里程碑
  nextMilestone?: GoalMilestone
  completedMilestones: GoalMilestone[]
}

// 目标里程碑
export interface GoalMilestone {
  id: string
  goalId: string
  name: string
  targetAmount: number
  targetDate: Date
  completed: boolean
  completedDate?: Date
  reward?: string
}

// 目标建议
export interface GoalRecommendation {
  type: 'increase_contribution' | 'extend_timeline' | 'reduce_target' | 'optimize_strategy'
  title: string
  description: string
  impact: {
    monthlyContribution?: number
    timelineChange?: number
    targetAmountChange?: number
  }
  priority: number
}

// 目标统计
export interface GoalStatistics {
  totalGoals: number
  activeGoals: number
  completedGoals: number
  totalTargetAmount: number
  totalCurrentAmount: number
  totalMonthlyContributions: number
  averageProgress: number
  onTrackGoals: number
  
  // 按类型分组
  goalsByType: Record<GoalType, number>
  goalsByPriority: Record<GoalPriority, number>
  goalsByStatus: Record<GoalStatus, number>
}

/**
 * 财务目标服务类
 */
export class FinancialGoalService {
  private goals: FinancialGoal[] = []
  private milestones: GoalMilestone[] = []
  private isInitialized = false

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await localStorageService.initialize()
      await this.loadGoals()
      await this.loadMilestones()
      
      this.isInitialized = true
      console.log('✅ FinancialGoalService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize FinancialGoalService:', error)
      throw error
    }
  }

  /**
   * 创建新的财务目标
   */
  async createGoal(goalData: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialGoal> {
    const goal: FinancialGoal = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...goalData
    }

    this.goals.push(goal)
    await this.saveGoals()

    // 创建默认里程碑
    await this.createDefaultMilestones(goal)

    return goal
  }

  /**
   * 更新财务目标
   */
  async updateGoal(goalId: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const goalIndex = this.goals.findIndex(g => g.id === goalId)
    if (goalIndex === -1) {
      throw new Error(`Goal with id ${goalId} not found`)
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
   * 删除财务目标
   */
  async deleteGoal(goalId: string): Promise<void> {
    this.goals = this.goals.filter(g => g.id !== goalId)
    this.milestones = this.milestones.filter(m => m.goalId !== goalId)
    
    await this.saveGoals()
    await this.saveMilestones()
  }

  /**
   * 获取所有目标
   */
  async getAllGoals(): Promise<FinancialGoal[]> {
    if (!this.isInitialized) await this.initialize()
    return [...this.goals]
  }

  /**
   * 根据ID获取目标
   */
  async getGoalById(goalId: string): Promise<FinancialGoal | null> {
    if (!this.isInitialized) await this.initialize()
    return this.goals.find(g => g.id === goalId) || null
  }

  /**
   * 计算目标进度
   */
  async calculateGoalProgress(goalId: string): Promise<GoalProgress> {
    const goal = await this.getGoalById(goalId)
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`)
    }

    const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0
    const now = new Date()
    const monthsRemaining = this.getMonthsBetween(now, goal.targetDate)
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount)
    
    // 计算所需月供
    const requiredMonthlyContribution = monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0
    
    // 预测完成日期
    const projectedCompletionDate = this.calculateProjectedCompletionDate(goal)
    
    // 判断是否按计划进行
    const onTrack = goal.monthlyContribution >= requiredMonthlyContribution
    
    // 计算缺口或超额
    const shortfall = Math.max(0, requiredMonthlyContribution - goal.monthlyContribution)
    const surplus = Math.max(0, goal.monthlyContribution - requiredMonthlyContribution)
    
    // 预测最终金额（考虑复利）
    const projectedFinalAmount = this.calculateProjectedFinalAmount(goal)
    const totalContributions = goal.currentAmount + (goal.monthlyContribution * monthsRemaining)
    const totalInterest = projectedFinalAmount - totalContributions

    // 获取里程碑
    const goalMilestones = this.milestones.filter(m => m.goalId === goalId)
    const completedMilestones = goalMilestones.filter(m => m.completed)
    const nextMilestone = goalMilestones
      .filter(m => !m.completed)
      .sort((a, b) => a.targetAmount - b.targetAmount)[0]

    return {
      goalId,
      progress,
      monthsRemaining,
      requiredMonthlyContribution,
      projectedCompletionDate,
      onTrack,
      shortfall,
      surplus,
      projectedFinalAmount,
      totalContributions,
      totalInterest,
      nextMilestone,
      completedMilestones
    }
  }

  /**
   * 获取目标建议
   */
  async getGoalRecommendations(goalId: string): Promise<GoalRecommendation[]> {
    const goal = await this.getGoalById(goalId)
    const progress = await this.calculateGoalProgress(goalId)
    
    if (!goal) return []

    const recommendations: GoalRecommendation[] = []

    // 如果进度落后，建议增加月供
    if (!progress.onTrack && progress.shortfall > 0) {
      recommendations.push({
        type: 'increase_contribution',
        title: 'Monatliche Einzahlung erhöhen',
        description: `Erhöhen Sie Ihre monatliche Einzahlung um €${progress.shortfall.toFixed(2)}, um Ihr Ziel rechtzeitig zu erreichen.`,
        impact: {
          monthlyContribution: goal.monthlyContribution + progress.shortfall
        },
        priority: 1
      })
    }

    // 如果时间紧迫，建议延长时间线
    if (progress.monthsRemaining < 12 && progress.shortfall > 0) {
      const extendedMonths = Math.ceil(progress.shortfall / goal.monthlyContribution * 12)
      recommendations.push({
        type: 'extend_timeline',
        title: 'Zeitrahmen verlängern',
        description: `Verlängern Sie Ihr Ziel um ${extendedMonths} Monate, um den Druck zu reduzieren.`,
        impact: {
          timelineChange: extendedMonths
        },
        priority: 2
      })
    }

    // 如果目标过于雄心勃勃，建议调整目标
    if (progress.requiredMonthlyContribution > goal.monthlyContribution * 2) {
      const adjustedTarget = goal.currentAmount + (goal.monthlyContribution * progress.monthsRemaining)
      recommendations.push({
        type: 'reduce_target',
        title: 'Ziel anpassen',
        description: `Reduzieren Sie Ihr Ziel auf €${adjustedTarget.toFixed(2)}, um es realistischer zu gestalten.`,
        impact: {
          targetAmountChange: adjustedTarget - goal.targetAmount
        },
        priority: 3
      })
    }

    return recommendations.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 获取目标统计
   */
  async getGoalStatistics(): Promise<GoalStatistics> {
    if (!this.isInitialized) await this.initialize()

    const activeGoals = this.goals.filter(g => g.status === 'active')
    const completedGoals = this.goals.filter(g => g.status === 'completed')
    
    // 计算进度统计
    const progressData = await Promise.all(
      activeGoals.map(g => this.calculateGoalProgress(g.id))
    )
    
    const onTrackGoals = progressData.filter(p => p.onTrack).length
    const averageProgress = progressData.length > 0 
      ? progressData.reduce((sum, p) => sum + p.progress, 0) / progressData.length 
      : 0

    // 按类型分组
    const goalsByType = this.goals.reduce((acc, goal) => {
      acc[goal.type] = (acc[goal.type] || 0) + 1
      return acc
    }, {} as Record<GoalType, number>)

    // 按优先级分组
    const goalsByPriority = this.goals.reduce((acc, goal) => {
      acc[goal.priority] = (acc[goal.priority] || 0) + 1
      return acc
    }, {} as Record<GoalPriority, number>)

    // 按状态分组
    const goalsByStatus = this.goals.reduce((acc, goal) => {
      acc[goal.status] = (acc[goal.status] || 0) + 1
      return acc
    }, {} as Record<GoalStatus, number>)

    return {
      totalGoals: this.goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTargetAmount: this.goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalCurrentAmount: this.goals.reduce((sum, g) => sum + g.currentAmount, 0),
      totalMonthlyContributions: activeGoals.reduce((sum, g) => sum + g.monthlyContribution, 0),
      averageProgress,
      onTrackGoals,
      goalsByType,
      goalsByPriority,
      goalsByStatus
    }
  }

  /**
   * 创建目标里程碑
   */
  async createMilestone(milestoneData: Omit<GoalMilestone, 'id'>): Promise<GoalMilestone> {
    const milestone: GoalMilestone = {
      id: crypto.randomUUID(),
      ...milestoneData
    }

    this.milestones.push(milestone)
    await this.saveMilestones()

    return milestone
  }

  /**
   * 更新里程碑状态
   */
  async updateMilestone(milestoneId: string, updates: Partial<GoalMilestone>): Promise<GoalMilestone> {
    const milestoneIndex = this.milestones.findIndex(m => m.id === milestoneId)
    if (milestoneIndex === -1) {
      throw new Error(`Milestone with id ${milestoneId} not found`)
    }

    this.milestones[milestoneIndex] = {
      ...this.milestones[milestoneIndex],
      ...updates
    }

    await this.saveMilestones()
    return this.milestones[milestoneIndex]
  }

  /**
   * 私有方法：加载目标
   */
  private async loadGoals(): Promise<void> {
    try {
      // 这里应该从LocalStorageService加载目标数据
      // 由于当前LocalStorageService主要处理计算历史，我们需要扩展它
      this.goals = [] // 临时空数组，实际应该从存储加载
    } catch (error) {
      console.error('Failed to load goals:', error)
      this.goals = []
    }
  }

  /**
   * 私有方法：保存目标
   */
  private async saveGoals(): Promise<void> {
    try {
      // 这里应该保存到LocalStorageService
      // 临时实现，实际应该调用存储服务
      console.log('Saving goals:', this.goals.length)
    } catch (error) {
      console.error('Failed to save goals:', error)
    }
  }

  /**
   * 私有方法：加载里程碑
   */
  private async loadMilestones(): Promise<void> {
    try {
      this.milestones = [] // 临时空数组
    } catch (error) {
      console.error('Failed to load milestones:', error)
      this.milestones = []
    }
  }

  /**
   * 私有方法：保存里程碑
   */
  private async saveMilestones(): Promise<void> {
    try {
      console.log('Saving milestones:', this.milestones.length)
    } catch (error) {
      console.error('Failed to save milestones:', error)
    }
  }

  /**
   * 私有方法：创建默认里程碑
   */
  private async createDefaultMilestones(goal: FinancialGoal): Promise<void> {
    const milestonePercentages = [0.25, 0.5, 0.75, 1.0]
    const totalMonths = this.getMonthsBetween(goal.startDate, goal.targetDate)

    for (let i = 0; i < milestonePercentages.length; i++) {
      const percentage = milestonePercentages[i]
      const targetAmount = goal.targetAmount * percentage
      const monthsFromStart = Math.floor(totalMonths * percentage)
      const targetDate = new Date(goal.startDate)
      targetDate.setMonth(targetDate.getMonth() + monthsFromStart)

      await this.createMilestone({
        goalId: goal.id,
        name: `${(percentage * 100)}% Ziel erreicht`,
        targetAmount,
        targetDate,
        completed: false
      })
    }
  }

  /**
   * 私有方法：计算两个日期之间的月数
   */
  private getMonthsBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const yearDiff = end.getFullYear() - start.getFullYear()
    const monthDiff = end.getMonth() - start.getMonth()
    
    return Math.max(0, yearDiff * 12 + monthDiff)
  }

  /**
   * 私有方法：计算预测完成日期
   */
  private calculateProjectedCompletionDate(goal: FinancialGoal): Date {
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount)
    const monthsNeeded = goal.monthlyContribution > 0 
      ? Math.ceil(remainingAmount / goal.monthlyContribution)
      : Infinity

    const projectedDate = new Date()
    if (monthsNeeded !== Infinity) {
      projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded)
    }

    return projectedDate
  }

  /**
   * 私有方法：计算预测最终金额（考虑复利）
   */
  private calculateProjectedFinalAmount(goal: FinancialGoal): number {
    // 简化的复利计算，假设年利率4%
    const annualRate = 0.04
    const monthlyRate = annualRate / 12
    const now = new Date()
    const monthsRemaining = this.getMonthsBetween(now, goal.targetDate)
    
    let futureValue = goal.currentAmount
    
    // 计算现有金额的复利增长
    futureValue *= Math.pow(1 + monthlyRate, monthsRemaining)
    
    // 计算月供的复利增长
    if (goal.monthlyContribution > 0 && monthsRemaining > 0) {
      const monthlyFutureValue = goal.monthlyContribution * 
        ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate)
      futureValue += monthlyFutureValue
    }
    
    return futureValue
  }
}

// 导出单例实例
export const financialGoalService = new FinancialGoalService()
