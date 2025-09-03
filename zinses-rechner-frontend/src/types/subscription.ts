/**
 * 订阅计划和定价策略类型定义
 * 支持多层级订阅模式和灵活的定价策略
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

// 订阅计划类型
export type SubscriptionPlanType = 'free' | 'basic' | 'premium' | 'enterprise'

// 订阅状态
export type SubscriptionStatus = 
  | 'active' 
  | 'inactive' 
  | 'cancelled' 
  | 'expired' 
  | 'trial' 
  | 'past_due' 
  | 'unpaid'

// 计费周期
export type BillingCycle = 'monthly' | 'quarterly' | 'annually' | 'lifetime'

// 货币类型
export type Currency = 'EUR' | 'USD' | 'GBP'

// 功能限制类型
export interface FeatureLimits {
  calculationsPerMonth: number | 'unlimited'
  historyRetentionDays: number | 'unlimited'
  exportFormats: string[] // ['csv', 'pdf', 'excel']
  apiCallsPerMonth: number | 'unlimited'
  customReports: boolean
  prioritySupport: boolean
  whiteLabel: boolean
  teamMembers: number | 'unlimited'
  dataStorage: 'local' | 'cloud' | 'both'
  advancedAnalytics: boolean
  customIntegrations: boolean
  slaGuarantee: boolean
}

// 定价信息
export interface PricingInfo {
  basePrice: number
  currency: Currency
  billingCycle: BillingCycle
  setupFee?: number
  discount?: {
    percentage: number
    validUntil?: Date
    code?: string
  }
  taxes?: {
    vatRate: number
    taxIncluded: boolean
  }
}

// 订阅计划
export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  description: string
  type: SubscriptionPlanType
  pricing: Record<BillingCycle, PricingInfo>
  features: string[]
  limits: FeatureLimits
  popular: boolean
  recommended: boolean
  available: boolean
  trialDays?: number
  metadata: {
    color: string
    icon: string
    badge?: string
    targetAudience: string
    useCases: string[]
  }
}

// 用户订阅
export interface UserSubscription {
  id: string
  userId: string
  planId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  billingCycle: BillingCycle
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialStart?: Date
  trialEnd?: Date
  cancelledAt?: Date
  cancelAtPeriodEnd: boolean
  autoRenew: boolean
  paymentMethodId?: string
  lastPaymentDate?: Date
  nextPaymentDate?: Date
  totalPaid: number
  currency: Currency
  usage: SubscriptionUsage
  addOns: SubscriptionAddOn[]
  discounts: SubscriptionDiscount[]
  createdAt: Date
  updatedAt: Date
}

// 订阅使用情况
export interface SubscriptionUsage {
  calculationsUsed: number
  apiCallsUsed: number
  storageUsed: number // MB
  teamMembersUsed: number
  lastResetDate: Date
  overageCharges: number
}

// 订阅附加服务
export interface SubscriptionAddOn {
  id: string
  name: string
  description: string
  price: number
  currency: Currency
  billingCycle: BillingCycle
  quantity: number
  addedAt: Date
}

// 订阅折扣
export interface SubscriptionDiscount {
  id: string
  code: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  appliedAt: Date
  validUntil?: Date
  maxUses?: number
  usedCount: number
}

// 支付方法
export interface PaymentMethod {
  id: string
  userId: string
  type: 'card' | 'sepa' | 'paypal' | 'bank_transfer'
  provider: string // 'stripe', 'klarna', 'paypal'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  holderName?: string
  isDefault: boolean
  isValid: boolean
  createdAt: Date
  updatedAt: Date
}

// 发票
export interface Invoice {
  id: string
  subscriptionId: string
  userId: string
  invoiceNumber: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  currency: Currency
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  amountPaid: number
  amountDue: number
  dueDate: Date
  paidAt?: Date
  items: InvoiceItem[]
  paymentAttempts: PaymentAttempt[]
  downloadUrl?: string
  createdAt: Date
  updatedAt: Date
}

// 发票项目
export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  taxRate: number
  period?: {
    start: Date
    end: Date
  }
}

// 支付尝试
export interface PaymentAttempt {
  id: string
  amount: number
  currency: Currency
  status: 'pending' | 'succeeded' | 'failed'
  paymentMethodId: string
  failureReason?: string
  attemptedAt: Date
  succeededAt?: Date
}

// 订阅变更
export interface SubscriptionChange {
  id: string
  subscriptionId: string
  type: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate' | 'pause'
  fromPlanId: string
  toPlanId?: string
  effectiveDate: Date
  prorationAmount?: number
  reason?: string
  requestedBy: string
  processedAt?: Date
  createdAt: Date
}

// 使用量警报
export interface UsageAlert {
  id: string
  subscriptionId: string
  type: 'calculations' | 'api_calls' | 'storage' | 'team_members'
  threshold: number // 百分比
  currentUsage: number
  limit: number
  triggered: boolean
  notificationSent: boolean
  createdAt: Date
}

// 订阅分析
export interface SubscriptionAnalytics {
  subscriptionId: string
  period: {
    start: Date
    end: Date
  }
  metrics: {
    calculationsPerformed: number
    apiCallsMade: number
    averageSessionDuration: number
    featuresUsed: string[]
    mostUsedCalculator: string
    exportCount: number
    supportTickets: number
  }
  trends: {
    usageGrowth: number // 百分比
    engagementScore: number // 0-100
    churnRisk: 'low' | 'medium' | 'high'
    satisfactionScore?: number // 1-5
  }
}

// 订阅推荐
export interface SubscriptionRecommendation {
  userId: string
  currentPlanId: string
  recommendedPlanId: string
  reason: string
  potentialSavings?: number
  additionalFeatures: string[]
  confidence: number // 0-1
  validUntil: Date
  createdAt: Date
}

// 企业订阅配置
export interface EnterpriseSubscriptionConfig {
  subscriptionId: string
  customLimits: Partial<FeatureLimits>
  customPricing: {
    basePrice: number
    volumeDiscounts: Array<{
      threshold: number
      discountPercentage: number
    }>
    customFeaturePricing: Record<string, number>
  }
  contractTerms: {
    minimumCommitment: number // 月数
    autoRenewal: boolean
    terminationNotice: number // 天数
    slaLevel: string
  }
  billingContact: {
    name: string
    email: string
    phone?: string
    address: {
      street: string
      city: string
      postalCode: string
      country: string
    }
  }
  technicalContact: {
    name: string
    email: string
    phone?: string
  }
}

// 订阅事件
export interface SubscriptionEvent {
  id: string
  subscriptionId: string
  type: 
    | 'created'
    | 'activated'
    | 'cancelled'
    | 'renewed'
    | 'upgraded'
    | 'downgraded'
    | 'payment_succeeded'
    | 'payment_failed'
    | 'trial_started'
    | 'trial_ended'
    | 'usage_limit_reached'
  data: Record<string, any>
  timestamp: Date
  processedAt?: Date
  webhookSent: boolean
}

// 订阅配置
export interface SubscriptionConfig {
  allowTrials: boolean
  trialDurationDays: number
  gracePeriodDays: number
  maxFailedPayments: number
  prorationEnabled: boolean
  immediateUpgrades: boolean
  downgradePolicyDays: number
  cancellationPolicy: 'immediate' | 'end_of_period'
  refundPolicy: {
    enabled: boolean
    periodDays: number
    proRated: boolean
  }
  taxSettings: {
    vatEnabled: boolean
    defaultVatRate: number
    taxInclusivePricing: boolean
  }
}

// 德国特定的税务信息
export interface GermanTaxInfo {
  vatNumber?: string // 德国增值税号
  taxId?: string // 税务识别号
  businessType: 'individual' | 'business' | 'non_profit'
  vatExempt: boolean
  reverseCharge: boolean // 反向征收
  smallBusinessRegulation: boolean // 小企业规定
}

// 订阅迁移
export interface SubscriptionMigration {
  id: string
  fromSubscriptionId: string
  toSubscriptionId: string
  migrationDate: Date
  dataTransferred: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  rollbackPlan?: {
    enabled: boolean
    rollbackDate?: Date
  }
  createdAt: Date
  completedAt?: Date
}
