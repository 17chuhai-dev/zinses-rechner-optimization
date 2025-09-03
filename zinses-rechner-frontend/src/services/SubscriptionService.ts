/**
 * 订阅管理核心服务
 * 支持订阅计划管理、用户订阅状态跟踪、升级降级、试用期管理和自动续费功能
 * 包含德国市场特定的定价策略和税务处理
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserIdentityService } from './UserIdentityService'
import { DashboardPermissionController } from './DashboardPermissionController'
import { generateAnonymousId } from '@/utils/encryption'

// 订阅计划
export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  description: string

  // 定价信息
  pricing: {
    currency: 'EUR'
    amount: number // 分为单位
    interval: 'month' | 'year'
    intervalCount: number
    trialDays?: number
  }

  // 功能限制
  features: PlanFeature[]
  limits: PlanLimits

  // 目标用户
  targetAudience: 'individual' | 'business' | 'enterprise'

  // 状态和可见性
  status: 'active' | 'inactive' | 'deprecated'
  isPublic: boolean
  isPopular: boolean

  // 元数据
  createdAt: Date
  updatedAt: Date
}

export interface PlanFeature {
  key: string
  name: string
  description: string
  included: boolean
  limit?: number
  unit?: string
}

export interface PlanLimits {
  // 用户和账户限制
  maxUsers: number
  maxAccounts: number
  maxTeams: number

  // 数据和分析限制
  maxDashboards: number
  maxReports: number
  maxDataExports: number
  dataRetentionDays: number

  // API限制
  apiCallsPerMonth: number
  maxAPIKeys: number

  // 存储限制
  storageGB: number
  maxFileSize: number

  // 支持级别
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated'
  slaUptime?: number
}

// 用户订阅
export interface Subscription {
  id: string
  userId: string
  planId: string

  // 订阅状态
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused'

  // 时间信息
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialStart?: Date
  trialEnd?: Date
  canceledAt?: Date
  endedAt?: Date

  // 计费信息
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: Date
  amount: number
  currency: 'EUR'

  // 支付方式
  paymentMethodId?: string

  // 使用量跟踪
  usage: SubscriptionUsage

  // 折扣和促销
  discounts: AppliedDiscount[]
  promoCode?: string

  // 元数据
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionUsage {
  // 当前计费周期使用量
  currentPeriod: {
    dashboards: number
    reports: number
    dataExports: number
    apiCalls: number
    storageUsed: number
  }

  // 历史使用量
  history: UsageHistory[]

  // 配额状态
  quotaStatus: {
    [feature: string]: {
      used: number
      limit: number
      percentage: number
      exceeded: boolean
    }
  }
}

export interface UsageHistory {
  period: string // YYYY-MM
  usage: Record<string, number>
  cost: number
}

export interface AppliedDiscount {
  id: string
  type: 'percentage' | 'fixed_amount' | 'free_trial'
  value: number
  description: string
  validUntil?: Date
}

// 订阅更新
export interface SubscriptionUpdate {
  planId?: string
  paymentMethodId?: string
  billingCycle?: 'monthly' | 'yearly'
  metadata?: Record<string, any>
}

// 促销结果
export interface PromoResult {
  success: boolean
  discount?: AppliedDiscount
  error?: string
  message: string
}

// 使用量限制检查
export interface UsageLimitCheck {
  feature: string
  allowed: boolean
  current: number
  limit: number
  remaining: number
  resetDate: Date
  upgradeRequired: boolean
  recommendedPlan?: string
}

// 试用信息
export interface TrialInfo {
  isTrialing: boolean
  trialStart?: Date
  trialEnd?: Date
  daysRemaining?: number
  planId?: string
  canExtend: boolean
}

/**
 * 订阅管理核心服务
 */
export class SubscriptionService {
  private static instance: SubscriptionService
  private userService: UserIdentityService
  private permissionController: DashboardPermissionController

  private subscriptionPlans: Map<string, SubscriptionPlan> = new Map()
  private subscriptions: Map<string, Subscription> = new Map()
  private userSubscriptions: Map<string, string> = new Map() // userId -> subscriptionId

  private isInitialized = false

  private constructor() {
    this.userService = UserIdentityService.getInstance()
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService()
    }
    return SubscriptionService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.userService.initialize()
      await this.permissionController.initialize()
      await this.loadSubscriptionPlans()
      await this.loadSubscriptions()
      this.startSubscriptionMonitoring()
      this.isInitialized = true
      console.log('✅ SubscriptionService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize SubscriptionService:', error)
      throw error
    }
  }

  /**
   * 创建订阅
   */
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string,
    options: {
      billingCycle?: 'monthly' | 'yearly'
      promoCode?: string
      startTrial?: boolean
      trialDays?: number
    } = {}
  ): Promise<Subscription> {
    if (!this.isInitialized) await this.initialize()

    const plan = this.subscriptionPlans.get(planId)
    if (!plan || plan.status !== 'active') {
      throw new Error('Invalid or inactive subscription plan')
    }

    // 检查用户是否已有订阅
    const existingSubscriptionId = this.userSubscriptions.get(userId)
    if (existingSubscriptionId) {
      const existingSubscription = this.subscriptions.get(existingSubscriptionId)
      if (existingSubscription && existingSubscription.status === 'active') {
        throw new Error('User already has an active subscription')
      }
    }

    const now = new Date()
    const billingCycle = options.billingCycle || 'monthly'
    const intervalMonths = billingCycle === 'yearly' ? 12 : 1

    // 计算计费周期
    const currentPeriodStart = now
    const currentPeriodEnd = new Date(now.getTime() + intervalMonths * 30 * 24 * 60 * 60 * 1000)

    // 处理试用期
    let trialStart: Date | undefined
    let trialEnd: Date | undefined
    let status: Subscription['status'] = 'active'

    if (options.startTrial || plan.pricing.trialDays) {
      const trialDays = options.trialDays || plan.pricing.trialDays || 14
      trialStart = now
      trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
      status = 'trialing'
    }

    const subscription: Subscription = {
      id: crypto.randomUUID(),
      userId,
      planId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
      billingCycle,
      nextBillingDate: trialEnd || currentPeriodEnd,
      amount: plan.pricing.amount,
      currency: 'EUR',
      paymentMethodId,
      usage: {
        currentPeriod: {
          dashboards: 0,
          reports: 0,
          dataExports: 0,
          apiCalls: 0,
          storageUsed: 0
        },
        history: [],
        quotaStatus: this.initializeQuotaStatus(plan.limits)
      },
      discounts: [],
      promoCode: options.promoCode,
      metadata: {},
      createdAt: now,
      updatedAt: now
    }

    // 应用促销码
    if (options.promoCode) {
      const promoResult = await this.applyPromoCode(subscription.id, options.promoCode)
      if (promoResult.success && promoResult.discount) {
        subscription.discounts.push(promoResult.discount)
      }
    }

    // 保存订阅
    this.subscriptions.set(subscription.id, subscription)
    this.userSubscriptions.set(userId, subscription.id)
    await this.saveSubscription(subscription)

    console.log(`💳 Subscription created: ${plan.name} for user ${userId}`)
    return subscription
  }

  /**
   * 更新订阅
   */
  async updateSubscription(
    subscriptionId: string,
    userId: string,
    updates: SubscriptionUpdate
  ): Promise<Subscription> {
    if (!this.isInitialized) await this.initialize()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    if (subscription.userId !== userId) {
      throw new Error('Unauthorized to update subscription')
    }

    // 处理计划变更
    if (updates.planId && updates.planId !== subscription.planId) {
      const newPlan = this.subscriptionPlans.get(updates.planId)
      if (!newPlan || newPlan.status !== 'active') {
        throw new Error('Invalid new subscription plan')
      }

      // 更新计划相关信息
      subscription.planId = updates.planId
      subscription.amount = newPlan.pricing.amount
      subscription.usage.quotaStatus = this.initializeQuotaStatus(newPlan.limits)
    }

    // 更新其他字段
    if (updates.paymentMethodId) {
      subscription.paymentMethodId = updates.paymentMethodId
    }

    if (updates.billingCycle) {
      subscription.billingCycle = updates.billingCycle
      // 重新计算下次计费日期
      const intervalMonths = updates.billingCycle === 'yearly' ? 12 : 1
      subscription.nextBillingDate = new Date(
        subscription.currentPeriodStart.getTime() + intervalMonths * 30 * 24 * 60 * 60 * 1000
      )
    }

    if (updates.metadata) {
      subscription.metadata = { ...subscription.metadata, ...updates.metadata }
    }

    subscription.updatedAt = new Date()
    await this.saveSubscription(subscription)

    console.log(`🔄 Subscription updated: ${subscriptionId}`)
    return subscription
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(
    subscriptionId: string,
    userId: string,
    reason: string,
    immediate: boolean = false
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    if (subscription.userId !== userId) {
      throw new Error('Unauthorized to cancel subscription')
    }

    const now = new Date()

    if (immediate) {
      subscription.status = 'canceled'
      subscription.endedAt = now
      subscription.canceledAt = now
    } else {
      // 在当前计费周期结束时取消
      subscription.status = 'canceled'
      subscription.canceledAt = now
      subscription.endedAt = subscription.currentPeriodEnd
    }

    subscription.metadata.cancellationReason = reason
    subscription.updatedAt = now

    await this.saveSubscription(subscription)

    console.log(`❌ Subscription canceled: ${subscriptionId} (reason: ${reason})`)
  }

  /**
   * 获取可用计划
   */
  async getAvailablePlans(userType: 'individual' | 'business' = 'individual'): Promise<SubscriptionPlan[]> {
    if (!this.isInitialized) await this.initialize()

    const plans = Array.from(this.subscriptionPlans.values())
      .filter(plan =>
        plan.status === 'active' &&
        plan.isPublic &&
        (plan.targetAudience === userType || plan.targetAudience === 'individual')
      )
      .sort((a, b) => a.pricing.amount - b.pricing.amount)

    return plans
  }

  /**
   * 升级计划
   */
  async upgradePlan(
    subscriptionId: string,
    userId: string,
    newPlanId: string
  ): Promise<Subscription> {
    if (!this.isInitialized) await this.initialize()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    const currentPlan = this.subscriptionPlans.get(subscription.planId)
    const newPlan = this.subscriptionPlans.get(newPlanId)

    if (!currentPlan || !newPlan) {
      throw new Error('Invalid plan configuration')
    }

    if (newPlan.pricing.amount <= currentPlan.pricing.amount) {
      throw new Error('New plan must be higher tier than current plan')
    }

    // 计算按比例退款和新费用
    const prorationCredit = this.calculateProrationCredit(subscription)
    const newPlanCost = newPlan.pricing.amount

    // 更新订阅
    subscription.planId = newPlanId
    subscription.amount = newPlanCost
    subscription.usage.quotaStatus = this.initializeQuotaStatus(newPlan.limits)
    subscription.updatedAt = new Date()

    await this.saveSubscription(subscription)

    console.log(`⬆️ Plan upgraded: ${currentPlan.name} -> ${newPlan.name}`)
    return subscription
  }

  /**
   * 降级计划
   */
  async downgradePlan(
    subscriptionId: string,
    userId: string,
    newPlanId: string
  ): Promise<Subscription> {
    if (!this.isInitialized) await this.initialize()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    const currentPlan = this.subscriptionPlans.get(subscription.planId)
    const newPlan = this.subscriptionPlans.get(newPlanId)

    if (!currentPlan || !newPlan) {
      throw new Error('Invalid plan configuration')
    }

    if (newPlan.pricing.amount >= currentPlan.pricing.amount) {
      throw new Error('New plan must be lower tier than current plan')
    }

    // 检查当前使用量是否超过新计划限制
    const usageCheck = this.checkUsageAgainstLimits(subscription.usage, newPlan.limits)
    if (!usageCheck.compatible) {
      throw new Error(`Current usage exceeds new plan limits: ${usageCheck.violations.join(', ')}`)
    }

    // 降级在下个计费周期生效
    subscription.metadata.pendingPlanChange = {
      newPlanId,
      effectiveDate: subscription.currentPeriodEnd,
      reason: 'downgrade'
    }

    subscription.updatedAt = new Date()
    await this.saveSubscription(subscription)

    console.log(`⬇️ Plan downgrade scheduled: ${currentPlan.name} -> ${newPlan.name}`)
    return subscription
  }

  /**
   * 开始免费试用
   */
  async startFreeTrial(
    userId: string,
    planId: string,
    trialDays: number = 14
  ): Promise<Subscription> {
    if (!this.isInitialized) await this.initialize()

    // 检查用户是否已经试用过
    const existingSubscriptionId = this.userSubscriptions.get(userId)
    if (existingSubscriptionId) {
      const existingSubscription = this.subscriptions.get(existingSubscriptionId)
      if (existingSubscription?.trialStart) {
        throw new Error('User has already used free trial')
      }
    }

    return await this.createSubscription(userId, planId, '', {
      startTrial: true,
      trialDays
    })
  }

  /**
   * 应用促销码
   */
  async applyPromoCode(subscriptionId: string, promoCode: string): Promise<PromoResult> {
    if (!this.isInitialized) await this.initialize()

    // 简化实现：模拟促销码验证
    const validPromoCodes: Record<string, AppliedDiscount> = {
      'WELCOME20': {
        id: 'welcome20',
        type: 'percentage',
        value: 20,
        description: '20% Rabatt für neue Kunden',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      'STUDENT50': {
        id: 'student50',
        type: 'percentage',
        value: 50,
        description: '50% Studentenrabatt',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      'TRIAL30': {
        id: 'trial30',
        type: 'free_trial',
        value: 30,
        description: '30 Tage kostenlose Testversion'
      }
    }

    const discount = validPromoCodes[promoCode.toUpperCase()]
    if (!discount) {
      return {
        success: false,
        error: 'INVALID_PROMO_CODE',
        message: 'Ungültiger Promocode'
      }
    }

    if (discount.validUntil && discount.validUntil < new Date()) {
      return {
        success: false,
        error: 'EXPIRED_PROMO_CODE',
        message: 'Promocode ist abgelaufen'
      }
    }

    return {
      success: true,
      discount,
      message: `Promocode erfolgreich angewendet: ${discount.description}`
    }
  }

  /**
   * 跟踪使用量
   */
  async trackUsage(userId: string, feature: string, amount: number = 1): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const subscriptionId = this.userSubscriptions.get(userId)
    if (!subscriptionId) return

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    // 更新使用量
    switch (feature) {
      case 'dashboards':
        subscription.usage.currentPeriod.dashboards += amount
        break
      case 'reports':
        subscription.usage.currentPeriod.reports += amount
        break
      case 'dataExports':
        subscription.usage.currentPeriod.dataExports += amount
        break
      case 'apiCalls':
        subscription.usage.currentPeriod.apiCalls += amount
        break
      case 'storage':
        subscription.usage.currentPeriod.storageUsed += amount
        break
    }

    // 更新配额状态
    const plan = this.subscriptionPlans.get(subscription.planId)
    if (plan) {
      this.updateQuotaStatus(subscription, plan.limits)
    }

    await this.saveSubscription(subscription)
  }

  /**
   * 检查使用量限制
   */
  async checkUsageLimit(userId: string, feature: string): Promise<UsageLimitCheck> {
    if (!this.isInitialized) await this.initialize()

    const subscriptionId = this.userSubscriptions.get(userId)
    if (!subscriptionId) {
      return {
        feature,
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        resetDate: new Date(),
        upgradeRequired: true,
        recommendedPlan: 'premium'
      }
    }

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      return {
        feature,
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        resetDate: new Date(),
        upgradeRequired: true,
        recommendedPlan: 'premium'
      }
    }

    const quotaStatus = subscription.usage.quotaStatus[feature]
    if (!quotaStatus) {
      return {
        feature,
        allowed: true,
        current: 0,
        limit: -1, // 无限制
        remaining: -1,
        resetDate: subscription.currentPeriodEnd,
        upgradeRequired: false
      }
    }

    return {
      feature,
      allowed: !quotaStatus.exceeded,
      current: quotaStatus.used,
      limit: quotaStatus.limit,
      remaining: Math.max(0, quotaStatus.limit - quotaStatus.used),
      resetDate: subscription.currentPeriodEnd,
      upgradeRequired: quotaStatus.exceeded,
      recommendedPlan: this.getRecommendedPlan(subscription.planId)
    }
  }

  /**
   * 获取用户订阅
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    if (!this.isInitialized) await this.initialize()

    const subscriptionId = this.userSubscriptions.get(userId)
    if (!subscriptionId) return null

    return this.subscriptions.get(subscriptionId) || null
  }

  // 私有方法
  private async loadSubscriptionPlans(): Promise<void> {
    // 免费计划
    const freePlan: SubscriptionPlan = {
      id: 'free',
      name: 'free',
      displayName: 'Kostenlos',
      description: 'Perfekt für den Einstieg in die Zinsrechnung',
      pricing: {
        currency: 'EUR',
        amount: 0,
        interval: 'month',
        intervalCount: 1
      },
      features: [
        { key: 'basic_calculator', name: 'Basis Zinsrechner', description: 'Einfache Zinsberechnungen', included: true },
        { key: 'basic_reports', name: 'Basis Berichte', description: 'Einfache PDF-Berichte', included: true },
        { key: 'email_support', name: 'E-Mail Support', description: 'Community Support', included: true }
      ],
      limits: {
        maxUsers: 1,
        maxAccounts: 3,
        maxTeams: 0,
        maxDashboards: 2,
        maxReports: 5,
        maxDataExports: 10,
        dataRetentionDays: 30,
        apiCallsPerMonth: 100,
        maxAPIKeys: 1,
        storageGB: 0.1,
        maxFileSize: 1,
        supportLevel: 'community'
      },
      targetAudience: 'individual',
      status: 'active',
      isPublic: true,
      isPopular: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 高级计划
    const premiumPlan: SubscriptionPlan = {
      id: 'premium',
      name: 'premium',
      displayName: 'Premium',
      description: 'Erweiterte Funktionen für professionelle Anwender',
      pricing: {
        currency: 'EUR',
        amount: 1999, // 19.99 EUR
        interval: 'month',
        intervalCount: 1,
        trialDays: 14
      },
      features: [
        { key: 'advanced_calculator', name: 'Erweiterte Rechner', description: 'Alle Zinsrechner-Funktionen', included: true },
        { key: 'custom_reports', name: 'Benutzerdefinierte Berichte', description: 'Individuelle Berichte erstellen', included: true },
        { key: 'data_export', name: 'Datenexport', description: 'Excel, CSV, PDF Export', included: true },
        { key: 'api_access', name: 'API Zugang', description: 'RESTful API Zugang', included: true },
        { key: 'priority_support', name: 'Priority Support', description: 'E-Mail Support mit Priorität', included: true }
      ],
      limits: {
        maxUsers: 5,
        maxAccounts: 50,
        maxTeams: 3,
        maxDashboards: 20,
        maxReports: 100,
        maxDataExports: 500,
        dataRetentionDays: 365,
        apiCallsPerMonth: 10000,
        maxAPIKeys: 5,
        storageGB: 5,
        maxFileSize: 50,
        supportLevel: 'email'
      },
      targetAudience: 'individual',
      status: 'active',
      isPublic: true,
      isPopular: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 商业计划
    const businessPlan: SubscriptionPlan = {
      id: 'business',
      name: 'business',
      displayName: 'Business',
      description: 'Für kleine und mittlere Unternehmen',
      pricing: {
        currency: 'EUR',
        amount: 4999, // 49.99 EUR
        interval: 'month',
        intervalCount: 1,
        trialDays: 30
      },
      features: [
        { key: 'team_collaboration', name: 'Team Zusammenarbeit', description: 'Mehrere Benutzer und Teams', included: true },
        { key: 'advanced_analytics', name: 'Erweiterte Analysen', description: 'Detaillierte Geschäftsanalysen', included: true },
        { key: 'white_label', name: 'White Label', description: 'Eigenes Branding', included: true },
        { key: 'sso_integration', name: 'SSO Integration', description: 'Single Sign-On', included: true },
        { key: 'dedicated_support', name: 'Dedicated Support', description: 'Persönlicher Ansprechpartner', included: true }
      ],
      limits: {
        maxUsers: 25,
        maxAccounts: 500,
        maxTeams: 10,
        maxDashboards: 100,
        maxReports: 1000,
        maxDataExports: 5000,
        dataRetentionDays: 1095, // 3 Jahre
        apiCallsPerMonth: 100000,
        maxAPIKeys: 20,
        storageGB: 50,
        maxFileSize: 500,
        supportLevel: 'priority',
        slaUptime: 99.5
      },
      targetAudience: 'business',
      status: 'active',
      isPublic: true,
      isPopular: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.subscriptionPlans.set(freePlan.id, freePlan)
    this.subscriptionPlans.set(premiumPlan.id, premiumPlan)
    this.subscriptionPlans.set(businessPlan.id, businessPlan)

    console.log(`📋 Loaded ${this.subscriptionPlans.size} subscription plans`)
  }

  private async loadSubscriptions(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('subscription_')) {
          const subscription = JSON.parse(localStorage.getItem(key) || '{}') as Subscription
          this.subscriptions.set(subscription.id, subscription)
          this.userSubscriptions.set(subscription.userId, subscription.id)
        }
      }
      console.log(`💳 Loaded ${this.subscriptions.size} subscriptions`)
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
    }
  }

  private async saveSubscription(subscription: Subscription): Promise<void> {
    try {
      localStorage.setItem(`subscription_${subscription.id}`, JSON.stringify(subscription))
    } catch (error) {
      console.error('Failed to save subscription:', error)
      throw error
    }
  }

  private initializeQuotaStatus(limits: PlanLimits): Record<string, any> {
    return {
      dashboards: { used: 0, limit: limits.maxDashboards, percentage: 0, exceeded: false },
      reports: { used: 0, limit: limits.maxReports, percentage: 0, exceeded: false },
      dataExports: { used: 0, limit: limits.maxDataExports, percentage: 0, exceeded: false },
      apiCalls: { used: 0, limit: limits.apiCallsPerMonth, percentage: 0, exceeded: false },
      storage: { used: 0, limit: limits.storageGB * 1024 * 1024 * 1024, percentage: 0, exceeded: false }
    }
  }

  private updateQuotaStatus(subscription: Subscription, limits: PlanLimits): void {
    const usage = subscription.usage.currentPeriod
    const quotaStatus = subscription.usage.quotaStatus

    // 更新各项配额状态
    this.updateQuotaItem(quotaStatus.dashboards, usage.dashboards, limits.maxDashboards)
    this.updateQuotaItem(quotaStatus.reports, usage.reports, limits.maxReports)
    this.updateQuotaItem(quotaStatus.dataExports, usage.dataExports, limits.maxDataExports)
    this.updateQuotaItem(quotaStatus.apiCalls, usage.apiCalls, limits.apiCallsPerMonth)
    this.updateQuotaItem(quotaStatus.storage, usage.storageUsed, limits.storageGB * 1024 * 1024 * 1024)
  }

  private updateQuotaItem(quotaItem: any, used: number, limit: number): void {
    quotaItem.used = used
    quotaItem.limit = limit
    quotaItem.percentage = limit > 0 ? Math.round((used / limit) * 100) : 0
    quotaItem.exceeded = used > limit
  }

  private calculateProrationCredit(subscription: Subscription): number {
    const now = new Date()
    const periodStart = subscription.currentPeriodStart
    const periodEnd = subscription.currentPeriodEnd

    const totalPeriodMs = periodEnd.getTime() - periodStart.getTime()
    const remainingMs = periodEnd.getTime() - now.getTime()

    const remainingRatio = remainingMs / totalPeriodMs
    return Math.round(subscription.amount * remainingRatio)
  }

  private checkUsageAgainstLimits(usage: SubscriptionUsage, limits: PlanLimits): { compatible: boolean; violations: string[] } {
    const violations: string[] = []

    if (usage.currentPeriod.dashboards > limits.maxDashboards) {
      violations.push(`Dashboards: ${usage.currentPeriod.dashboards} > ${limits.maxDashboards}`)
    }

    if (usage.currentPeriod.reports > limits.maxReports) {
      violations.push(`Reports: ${usage.currentPeriod.reports} > ${limits.maxReports}`)
    }

    if (usage.currentPeriod.storageUsed > limits.storageGB * 1024 * 1024 * 1024) {
      violations.push(`Storage: ${usage.currentPeriod.storageUsed} > ${limits.storageGB}GB`)
    }

    return {
      compatible: violations.length === 0,
      violations
    }
  }

  private getRecommendedPlan(currentPlanId: string): string {
    const planHierarchy = ['free', 'premium', 'business', 'enterprise']
    const currentIndex = planHierarchy.indexOf(currentPlanId)

    if (currentIndex < planHierarchy.length - 1) {
      return planHierarchy[currentIndex + 1]
    }

    return 'enterprise'
  }

  private startSubscriptionMonitoring(): void {
    // 每小时检查订阅状态
    setInterval(() => {
      this.checkSubscriptionStatus()
    }, 60 * 60 * 1000)

    // 每天重置使用量计数器
    setInterval(() => {
      this.resetDailyUsage()
    }, 24 * 60 * 60 * 1000)
  }

  private async checkSubscriptionStatus(): Promise<void> {
    const now = new Date()

    for (const subscription of this.subscriptions.values()) {
      let updated = false

      // 检查试用期结束
      if (subscription.status === 'trialing' && subscription.trialEnd && subscription.trialEnd <= now) {
        subscription.status = 'active'
        updated = true
      }

      // 检查订阅过期
      if (subscription.status === 'active' && subscription.currentPeriodEnd <= now) {
        subscription.status = 'past_due'
        updated = true
      }

      // 处理待处理的计划变更
      if (subscription.metadata.pendingPlanChange &&
          new Date(subscription.metadata.pendingPlanChange.effectiveDate) <= now) {
        subscription.planId = subscription.metadata.pendingPlanChange.newPlanId
        const newPlan = this.subscriptionPlans.get(subscription.planId)
        if (newPlan) {
          subscription.amount = newPlan.pricing.amount
          subscription.usage.quotaStatus = this.initializeQuotaStatus(newPlan.limits)
        }
        delete subscription.metadata.pendingPlanChange
        updated = true
      }

      if (updated) {
        subscription.updatedAt = now
        await this.saveSubscription(subscription)
      }
    }
  }

  private async resetDailyUsage(): Promise<void> {
    // 重置每日API调用计数等
    console.log('🔄 Daily usage counters reset')
  }
}

// Export singleton instance
export const subscriptionService = SubscriptionService.getInstance()
