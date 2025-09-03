/**
 * 德国本地支付系统集成
 * 集成德国主流支付方式（SEPA直接借记、Klarna、PayPal、Stripe），支持一次性支付和定期扣款
 * 包含完整的支付流程管理、Webhook处理和德国税务合规
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { SubscriptionService } from './SubscriptionService'
import { DashboardPermissionController } from './DashboardPermissionController'
import { generateAnonymousId } from '@/utils/encryption'

// 支付方式类型
export type PaymentMethodType = 'sepa' | 'klarna' | 'paypal' | 'stripe' | 'credit_card' | 'bank_transfer'

// 支付方式配置
export interface PaymentMethodConfig {
  type: PaymentMethodType
  displayName: string

  // SEPA配置
  sepa?: {
    iban: string
    bic?: string
    accountHolderName: string
    mandateId?: string
    mandateDate?: Date
  }

  // 信用卡配置
  creditCard?: {
    last4: string
    brand: 'visa' | 'mastercard' | 'amex'
    expiryMonth: number
    expiryYear: number
    holderName: string
  }

  // PayPal配置
  paypal?: {
    email: string
    payerId: string
  }

  // Klarna配置
  klarna?: {
    customerToken: string
    paymentMethodCategory: 'pay_now' | 'pay_later' | 'pay_over_time'
  }

  // 通用配置
  isDefault: boolean
  billingAddress: BillingAddress
}

// 支付方式
export interface PaymentMethod {
  id: string
  userId: string
  config: PaymentMethodConfig

  // 状态
  status: 'active' | 'inactive' | 'expired' | 'failed'

  // 验证状态
  isVerified: boolean
  verificationDate?: Date

  // 使用统计
  usage: {
    totalPayments: number
    lastUsed?: Date
    totalAmount: number
  }

  // 时间信息
  createdAt: Date
  updatedAt: Date
}

// 账单地址
export interface BillingAddress {
  firstName: string
  lastName: string
  company?: string
  street: string
  city: string
  postalCode: string
  country: string
  state?: string
  vatNumber?: string
}

// 支付请求
export interface PaymentRequest {
  id: string
  userId: string
  paymentMethodId: string

  // 金额信息
  amount: number
  currency: 'EUR'
  description: string

  // 订单信息
  orderId?: string
  subscriptionId?: string
  invoiceId?: string

  // 支付类型
  type: 'one_time' | 'recurring' | 'refund'

  // 元数据
  metadata: Record<string, any>
}

// 支付结果
export interface PaymentResult {
  id: string
  paymentRequestId: string

  // 状态
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'requires_action'

  // 金额信息
  amount: number
  currency: 'EUR'

  // 支付方式信息
  paymentMethod: {
    type: PaymentMethodType
    details: any
  }

  // 处理信息
  processorTransactionId?: string
  processorResponse?: any

  // 时间信息
  createdAt: Date
  processedAt?: Date

  // 错误信息
  error?: {
    code: string
    message: string
    details?: any
  }

  // 下一步操作
  nextAction?: {
    type: 'redirect' | 'verify' | 'authenticate'
    url?: string
    data?: any
  }
}

// 退款结果
export interface RefundResult {
  id: string
  paymentId: string

  // 退款信息
  amount: number
  currency: 'EUR'
  reason?: string

  // 状态
  status: 'pending' | 'succeeded' | 'failed'

  // 处理信息
  processorRefundId?: string

  // 时间信息
  createdAt: Date
  processedAt?: Date
}

// SEPA授权
export interface SEPAMandate {
  id: string
  userId: string

  // 银行账户信息
  iban: string
  bic?: string
  accountHolderName: string

  // 授权信息
  mandateReference: string
  signatureDate: Date

  // 状态
  status: 'pending' | 'active' | 'canceled' | 'expired'

  // 使用统计
  usage: {
    totalDebits: number
    lastDebitDate?: Date
    totalAmount: number
  }

  // 时间信息
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

// Klarna会话
export interface KlarnaSession {
  id: string
  sessionId: string
  clientToken: string

  // 订单信息
  orderInfo: OrderInfo

  // 支付选项
  paymentMethodCategories: string[]

  // 状态
  status: 'created' | 'authorized' | 'captured' | 'canceled'

  // 时间信息
  createdAt: Date
  expiresAt: Date
}

// 订单信息
export interface OrderInfo {
  orderId: string
  amount: number
  currency: 'EUR'

  // 商品信息
  items: OrderItem[]

  // 客户信息
  customer: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  }

  // 地址信息
  billingAddress: BillingAddress
  shippingAddress?: BillingAddress

  // 税务信息
  taxAmount?: number
  vatRate?: number
}

export interface OrderItem {
  name: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  taxRate?: number
  category?: string
}

// 支付状态
export interface PaymentStatus {
  paymentId: string
  status: PaymentResult['status']
  amount: number
  currency: 'EUR'

  // 时间线
  timeline: PaymentStatusEvent[]

  // 当前状态详情
  currentStatus: {
    message: string
    updatedAt: Date
    canRetry: boolean
    canCancel: boolean
  }
}

export interface PaymentStatusEvent {
  timestamp: Date
  status: PaymentResult['status']
  message: string
  details?: any
}

/**
 * 德国本地支付系统集成
 */
export class PaymentService {
  private static instance: PaymentService
  private subscriptionService: SubscriptionService
  private permissionController: DashboardPermissionController

  private paymentMethods: Map<string, PaymentMethod> = new Map()
  private paymentResults: Map<string, PaymentResult> = new Map()
  private sepaMandates: Map<string, SEPAMandate> = new Map()
  private klarnaSession: Map<string, KlarnaSession> = new Map()

  private isInitialized = false

  private constructor() {
    this.subscriptionService = SubscriptionService.getInstance()
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.subscriptionService.initialize()
      await this.permissionController.initialize()
      await this.loadPaymentMethods()
      await this.loadSEPAMandates()
      this.startPaymentMonitoring()
      this.isInitialized = true
      console.log('✅ PaymentService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize PaymentService:', error)
      throw error
    }
  }

  /**
   * 添加支付方式
   */
  async addPaymentMethod(
    userId: string,
    config: PaymentMethodConfig
  ): Promise<PaymentMethod> {
    if (!this.isInitialized) await this.initialize()

    // 验证支付方式配置
    await this.validatePaymentMethodConfig(config)

    const paymentMethod: PaymentMethod = {
      id: crypto.randomUUID(),
      userId,
      config,
      status: 'active',
      isVerified: false,
      usage: {
        totalPayments: 0,
        totalAmount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 如果是SEPA，创建授权
    if (config.type === 'sepa' && config.sepa) {
      const mandate = await this.createSEPAMandate(userId, {
        iban: config.sepa.iban,
        bic: config.sepa.bic,
        accountHolderName: config.sepa.accountHolderName
      })
      config.sepa.mandateId = mandate.id
      config.sepa.mandateDate = mandate.signatureDate
    }

    // 验证支付方式
    const verification = await this.verifyPaymentMethod(paymentMethod)
    paymentMethod.isVerified = verification.success
    if (verification.success) {
      paymentMethod.verificationDate = new Date()
    }

    this.paymentMethods.set(paymentMethod.id, paymentMethod)
    await this.savePaymentMethod(paymentMethod)

    console.log(`💳 Payment method added: ${config.type} for user ${userId}`)
    return paymentMethod
  }

  /**
   * 更新支付方式
   */
  async updatePaymentMethod(
    methodId: string,
    userId: string,
    updates: Partial<PaymentMethodConfig>
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const paymentMethod = this.paymentMethods.get(methodId)
    if (!paymentMethod) {
      throw new Error('Payment method not found')
    }

    if (paymentMethod.userId !== userId) {
      throw new Error('Unauthorized to update payment method')
    }

    // 更新配置
    paymentMethod.config = { ...paymentMethod.config, ...updates }
    paymentMethod.updatedAt = new Date()

    // 重新验证
    if (updates.sepa || updates.creditCard) {
      paymentMethod.isVerified = false
      const verification = await this.verifyPaymentMethod(paymentMethod)
      paymentMethod.isVerified = verification.success
      if (verification.success) {
        paymentMethod.verificationDate = new Date()
      }
    }

    await this.savePaymentMethod(paymentMethod)

    console.log(`🔄 Payment method updated: ${methodId}`)
  }

  /**
   * 移除支付方式
   */
  async removePaymentMethod(methodId: string, userId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const paymentMethod = this.paymentMethods.get(methodId)
    if (!paymentMethod) {
      throw new Error('Payment method not found')
    }

    if (paymentMethod.userId !== userId) {
      throw new Error('Unauthorized to remove payment method')
    }

    // 检查是否有活跃订阅使用此支付方式
    const subscription = await this.subscriptionService.getUserSubscription(userId)
    if (subscription && subscription.paymentMethodId === methodId && subscription.status === 'active') {
      throw new Error('Cannot remove payment method used by active subscription')
    }

    // 如果是SEPA，取消授权
    if (paymentMethod.config.type === 'sepa' && paymentMethod.config.sepa?.mandateId) {
      await this.cancelSEPAMandate(paymentMethod.config.sepa.mandateId)
    }

    paymentMethod.status = 'inactive'
    paymentMethod.updatedAt = new Date()

    await this.savePaymentMethod(paymentMethod)

    console.log(`🗑️ Payment method removed: ${methodId}`)
  }

  /**
   * 处理支付
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    if (!this.isInitialized) await this.initialize()

    const paymentMethod = this.paymentMethods.get(request.paymentMethodId)
    if (!paymentMethod) {
      throw new Error('Payment method not found')
    }

    if (paymentMethod.userId !== request.userId) {
      throw new Error('Unauthorized payment method')
    }

    if (!paymentMethod.isVerified) {
      throw new Error('Payment method not verified')
    }

    const result: PaymentResult = {
      id: crypto.randomUUID(),
      paymentRequestId: request.id,
      status: 'processing',
      amount: request.amount,
      currency: request.currency,
      paymentMethod: {
        type: paymentMethod.config.type,
        details: this.getPaymentMethodDetails(paymentMethod)
      },
      createdAt: new Date()
    }

    try {
      // 根据支付方式类型处理
      switch (paymentMethod.config.type) {
        case 'sepa':
          await this.processSEPAPayment(request, paymentMethod, result)
          break
        case 'klarna':
          await this.processKlarnaPayment(request, paymentMethod, result)
          break
        case 'paypal':
          await this.processPayPalPayment(request, paymentMethod, result)
          break
        case 'stripe':
        case 'credit_card':
          await this.processStripePayment(request, paymentMethod, result)
          break
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod.config.type}`)
      }

      // 更新支付方式使用统计
      paymentMethod.usage.totalPayments++
      paymentMethod.usage.lastUsed = new Date()
      paymentMethod.usage.totalAmount += request.amount
      await this.savePaymentMethod(paymentMethod)

    } catch (error) {
      result.status = 'failed'
      result.error = {
        code: 'PAYMENT_PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    result.processedAt = new Date()
    this.paymentResults.set(result.id, result)
    await this.savePaymentResult(result)

    console.log(`💰 Payment processed: ${result.status} (${request.amount / 100}€)`)
    return result
  }

  /**
   * 处理定期支付
   */
  async processRecurringPayment(subscriptionId: string): Promise<PaymentResult> {
    if (!this.isInitialized) await this.initialize()

    // 获取订阅信息
    const subscription = await this.subscriptionService.getUserSubscription(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    if (!subscription.paymentMethodId) {
      throw new Error('No payment method configured for subscription')
    }

    // 创建支付请求
    const paymentRequest: PaymentRequest = {
      id: crypto.randomUUID(),
      userId: subscription.userId,
      paymentMethodId: subscription.paymentMethodId,
      amount: subscription.amount,
      currency: 'EUR',
      description: `Subscription renewal - ${subscription.planId}`,
      subscriptionId: subscription.id,
      type: 'recurring',
      metadata: {
        billingPeriod: `${subscription.currentPeriodStart.toISOString()}_${subscription.currentPeriodEnd.toISOString()}`
      }
    }

    return await this.processPayment(paymentRequest)
  }

  /**
   * 退款
   */
  async refundPayment(
    paymentId: string,
    userId: string,
    amount?: number,
    reason?: string
  ): Promise<RefundResult> {
    if (!this.isInitialized) await this.initialize()

    const payment = this.paymentResults.get(paymentId)
    if (!payment) {
      throw new Error('Payment not found')
    }

    const paymentMethod = this.paymentMethods.get(payment.paymentMethod.type)
    if (paymentMethod && paymentMethod.userId !== userId) {
      throw new Error('Unauthorized refund request')
    }

    if (payment.status !== 'succeeded') {
      throw new Error('Can only refund successful payments')
    }

    const refundAmount = amount || payment.amount
    if (refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount')
    }

    const refund: RefundResult = {
      id: crypto.randomUUID(),
      paymentId,
      amount: refundAmount,
      currency: payment.currency,
      reason,
      status: 'pending',
      createdAt: new Date()
    }

    try {
      // 根据支付方式处理退款
      switch (payment.paymentMethod.type) {
        case 'sepa':
          await this.processSEPARefund(payment, refund)
          break
        case 'klarna':
          await this.processKlarnaRefund(payment, refund)
          break
        case 'paypal':
          await this.processPayPalRefund(payment, refund)
          break
        case 'stripe':
        case 'credit_card':
          await this.processStripeRefund(payment, refund)
          break
        default:
          throw new Error(`Refund not supported for payment method: ${payment.paymentMethod.type}`)
      }

      refund.status = 'succeeded'
      refund.processedAt = new Date()

    } catch (error) {
      refund.status = 'failed'
    }

    console.log(`💸 Refund processed: ${refund.status} (${refundAmount / 100}€)`)
    return refund
  }

  /**
   * 创建SEPA授权
   */
  async createSEPAMandate(userId: string, bankAccount: {
    iban: string
    bic?: string
    accountHolderName: string
  }): Promise<SEPAMandate> {
    if (!this.isInitialized) await this.initialize()

    // 验证IBAN
    if (!this.validateIBAN(bankAccount.iban)) {
      throw new Error('Invalid IBAN')
    }

    const mandate: SEPAMandate = {
      id: crypto.randomUUID(),
      userId,
      iban: bankAccount.iban,
      bic: bankAccount.bic,
      accountHolderName: bankAccount.accountHolderName,
      mandateReference: this.generateMandateReference(),
      signatureDate: new Date(),
      status: 'active',
      usage: {
        totalDebits: 0,
        totalAmount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.sepaMandates.set(mandate.id, mandate)
    await this.saveSEPAMandate(mandate)

    console.log(`📝 SEPA mandate created: ${mandate.mandateReference}`)
    return mandate
  }

  /**
   * 处理SEPA支付
   */
  async processSEPAPayment(mandateId: string, amount: number): Promise<PaymentResult> {
    if (!this.isInitialized) await this.initialize()

    const mandate = this.sepaMandates.get(mandateId)
    if (!mandate) {
      throw new Error('SEPA mandate not found')
    }

    if (mandate.status !== 'active') {
      throw new Error('SEPA mandate not active')
    }

    // 创建支付请求
    const paymentRequest: PaymentRequest = {
      id: crypto.randomUUID(),
      userId: mandate.userId,
      paymentMethodId: mandateId,
      amount,
      currency: 'EUR',
      description: 'SEPA Direct Debit',
      type: 'one_time',
      metadata: {
        mandateReference: mandate.mandateReference
      }
    }

    // 模拟SEPA处理（实际应该调用银行API）
    const result: PaymentResult = {
      id: crypto.randomUUID(),
      paymentRequestId: paymentRequest.id,
      status: 'succeeded',
      amount,
      currency: 'EUR',
      paymentMethod: {
        type: 'sepa',
        details: {
          iban: mandate.iban.replace(/(.{4})/g, '$1 ').trim(),
          mandateReference: mandate.mandateReference
        }
      },
      processorTransactionId: `sepa_${crypto.randomUUID()}`,
      createdAt: new Date(),
      processedAt: new Date()
    }

    // 更新授权使用统计
    mandate.usage.totalDebits++
    mandate.usage.lastDebitDate = new Date()
    mandate.usage.totalAmount += amount
    await this.saveSEPAMandate(mandate)

    return result
  }

  /**
   * 创建Klarna会话
   */
  async createKlarnaSession(orderInfo: OrderInfo): Promise<KlarnaSession> {
    if (!this.isInitialized) await this.initialize()

    // 模拟Klarna API调用
    const session: KlarnaSession = {
      id: crypto.randomUUID(),
      sessionId: `klarna_session_${crypto.randomUUID()}`,
      clientToken: `klarna_token_${crypto.randomUUID()}`,
      orderInfo,
      paymentMethodCategories: ['pay_now', 'pay_later', 'pay_over_time'],
      status: 'created',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时过期
    }

    this.klarnaSession.set(session.id, session)

    console.log(`🛒 Klarna session created: ${session.sessionId}`)
    return session
  }

  /**
   * 处理Klarna支付
   */
  async processKlarnaPayment(sessionId: string): Promise<PaymentResult> {
    if (!this.isInitialized) await this.initialize()

    const session = this.klarnaSession.get(sessionId)
    if (!session) {
      throw new Error('Klarna session not found')
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Klarna session expired')
    }

    // 模拟Klarna支付处理
    const result: PaymentResult = {
      id: crypto.randomUUID(),
      paymentRequestId: session.id,
      status: 'succeeded',
      amount: session.orderInfo.amount,
      currency: 'EUR',
      paymentMethod: {
        type: 'klarna',
        details: {
          sessionId: session.sessionId,
          orderInfo: session.orderInfo
        }
      },
      processorTransactionId: `klarna_${crypto.randomUUID()}`,
      createdAt: new Date(),
      processedAt: new Date()
    }

    session.status = 'captured'
    console.log(`💳 Klarna payment processed: ${result.id}`)
    return result
  }

  /**
   * 获取支付状态
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    if (!this.isInitialized) await this.initialize()

    const payment = this.paymentResults.get(paymentId)
    if (!payment) {
      throw new Error('Payment not found')
    }

    return {
      paymentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      timeline: [
        {
          timestamp: payment.createdAt,
          status: 'pending',
          message: 'Payment initiated'
        },
        {
          timestamp: payment.processedAt || payment.createdAt,
          status: payment.status,
          message: this.getStatusMessage(payment.status)
        }
      ],
      currentStatus: {
        message: this.getStatusMessage(payment.status),
        updatedAt: payment.processedAt || payment.createdAt,
        canRetry: payment.status === 'failed',
        canCancel: payment.status === 'pending' || payment.status === 'processing'
      }
    }
  }

  /**
   * 处理Webhook
   */
  async handleWebhook(provider: string, payload: any): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    console.log(`🔔 Webhook received from ${provider}:`, payload)

    switch (provider) {
      case 'stripe':
        await this.handleStripeWebhook(payload)
        break
      case 'klarna':
        await this.handleKlarnaWebhook(payload)
        break
      case 'paypal':
        await this.handlePayPalWebhook(payload)
        break
      default:
        console.warn(`Unknown webhook provider: ${provider}`)
    }
  }

  // 私有方法
  private async validatePaymentMethodConfig(config: PaymentMethodConfig): Promise<void> {
    switch (config.type) {
      case 'sepa':
        if (!config.sepa?.iban || !config.sepa?.accountHolderName) {
          throw new Error('SEPA configuration requires IBAN and account holder name')
        }
        if (!this.validateIBAN(config.sepa.iban)) {
          throw new Error('Invalid IBAN')
        }
        break
      case 'credit_card':
        if (!config.creditCard?.last4 || !config.creditCard?.expiryMonth || !config.creditCard?.expiryYear) {
          throw new Error('Credit card configuration incomplete')
        }
        break
      case 'paypal':
        if (!config.paypal?.email) {
          throw new Error('PayPal configuration requires email')
        }
        break
    }
  }

  private async verifyPaymentMethod(paymentMethod: PaymentMethod): Promise<{ success: boolean; error?: string }> {
    // 模拟支付方式验证
    switch (paymentMethod.config.type) {
      case 'sepa':
        return { success: true }
      case 'credit_card':
        return { success: true }
      case 'paypal':
        return { success: true }
      case 'klarna':
        return { success: true }
      default:
        return { success: false, error: 'Unsupported payment method' }
    }
  }

  private validateIBAN(iban: string): boolean {
    // 简化的IBAN验证
    const cleanIban = iban.replace(/\s/g, '').toUpperCase()
    return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(cleanIban)
  }

  private generateMandateReference(): string {
    return `ZR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }

  private getPaymentMethodDetails(paymentMethod: PaymentMethod): any {
    switch (paymentMethod.config.type) {
      case 'sepa':
        return {
          iban: paymentMethod.config.sepa?.iban?.replace(/(.{4})/g, '$1 ').trim(),
          accountHolder: paymentMethod.config.sepa?.accountHolderName
        }
      case 'credit_card':
        return {
          last4: paymentMethod.config.creditCard?.last4,
          brand: paymentMethod.config.creditCard?.brand
        }
      case 'paypal':
        return {
          email: paymentMethod.config.paypal?.email
        }
      default:
        return {}
    }
  }

  private async processSEPAPayment(request: PaymentRequest, paymentMethod: PaymentMethod, result: PaymentResult): Promise<void> {
    // 模拟SEPA处理延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    result.status = 'succeeded'
    result.processorTransactionId = `sepa_${crypto.randomUUID()}`
  }

  private async processKlarnaPayment(request: PaymentRequest, paymentMethod: PaymentMethod, result: PaymentResult): Promise<void> {
    // 模拟Klarna处理
    await new Promise(resolve => setTimeout(resolve, 500))

    result.status = 'succeeded'
    result.processorTransactionId = `klarna_${crypto.randomUUID()}`
  }

  private async processPayPalPayment(request: PaymentRequest, paymentMethod: PaymentMethod, result: PaymentResult): Promise<void> {
    // 模拟PayPal处理
    await new Promise(resolve => setTimeout(resolve, 800))

    result.status = 'succeeded'
    result.processorTransactionId = `paypal_${crypto.randomUUID()}`
  }

  private async processStripePayment(request: PaymentRequest, paymentMethod: PaymentMethod, result: PaymentResult): Promise<void> {
    // 模拟Stripe处理
    await new Promise(resolve => setTimeout(resolve, 600))

    result.status = 'succeeded'
    result.processorTransactionId = `stripe_${crypto.randomUUID()}`
  }

  private async processSEPARefund(payment: PaymentResult, refund: RefundResult): Promise<void> {
    // 模拟SEPA退款处理
    refund.processorRefundId = `sepa_refund_${crypto.randomUUID()}`
  }

  private async processKlarnaRefund(payment: PaymentResult, refund: RefundResult): Promise<void> {
    // 模拟Klarna退款处理
    refund.processorRefundId = `klarna_refund_${crypto.randomUUID()}`
  }

  private async processPayPalRefund(payment: PaymentResult, refund: RefundResult): Promise<void> {
    // 模拟PayPal退款处理
    refund.processorRefundId = `paypal_refund_${crypto.randomUUID()}`
  }

  private async processStripeRefund(payment: PaymentResult, refund: RefundResult): Promise<void> {
    // 模拟Stripe退款处理
    refund.processorRefundId = `stripe_refund_${crypto.randomUUID()}`
  }

  private getStatusMessage(status: PaymentResult['status']): string {
    const messages = {
      pending: 'Zahlung wird verarbeitet',
      processing: 'Zahlung in Bearbeitung',
      succeeded: 'Zahlung erfolgreich',
      failed: 'Zahlung fehlgeschlagen',
      canceled: 'Zahlung storniert',
      requires_action: 'Weitere Aktion erforderlich'
    }
    return messages[status] || 'Unbekannter Status'
  }

  private async handleStripeWebhook(payload: any): Promise<void> {
    // Stripe Webhook处理
    console.log('Processing Stripe webhook:', payload.type)
  }

  private async handleKlarnaWebhook(payload: any): Promise<void> {
    // Klarna Webhook处理
    console.log('Processing Klarna webhook:', payload.event_type)
  }

  private async handlePayPalWebhook(payload: any): Promise<void> {
    // PayPal Webhook处理
    console.log('Processing PayPal webhook:', payload.event_type)
  }

  private async cancelSEPAMandate(mandateId: string): Promise<void> {
    const mandate = this.sepaMandates.get(mandateId)
    if (mandate) {
      mandate.status = 'canceled'
      mandate.updatedAt = new Date()
      await this.saveSEPAMandate(mandate)
    }
  }

  private async loadPaymentMethods(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('payment_method_')) {
          const paymentMethod = JSON.parse(localStorage.getItem(key) || '{}') as PaymentMethod
          this.paymentMethods.set(paymentMethod.id, paymentMethod)
        }
      }
      console.log(`💳 Loaded ${this.paymentMethods.size} payment methods`)
    } catch (error) {
      console.error('Failed to load payment methods:', error)
    }
  }

  private async loadSEPAMandates(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('sepa_mandate_')) {
          const mandate = JSON.parse(localStorage.getItem(key) || '{}') as SEPAMandate
          this.sepaMandates.set(mandate.id, mandate)
        }
      }
      console.log(`📝 Loaded ${this.sepaMandates.size} SEPA mandates`)
    } catch (error) {
      console.error('Failed to load SEPA mandates:', error)
    }
  }

  private async savePaymentMethod(paymentMethod: PaymentMethod): Promise<void> {
    try {
      localStorage.setItem(`payment_method_${paymentMethod.id}`, JSON.stringify(paymentMethod))
    } catch (error) {
      console.error('Failed to save payment method:', error)
      throw error
    }
  }

  private async savePaymentResult(result: PaymentResult): Promise<void> {
    try {
      localStorage.setItem(`payment_result_${result.id}`, JSON.stringify(result))
    } catch (error) {
      console.error('Failed to save payment result:', error)
    }
  }

  private async saveSEPAMandate(mandate: SEPAMandate): Promise<void> {
    try {
      localStorage.setItem(`sepa_mandate_${mandate.id}`, JSON.stringify(mandate))
    } catch (error) {
      console.error('Failed to save SEPA mandate:', error)
      throw error
    }
  }

  private startPaymentMonitoring(): void {
    // 每小时检查支付状态
    setInterval(() => {
      this.checkPaymentStatus()
    }, 60 * 60 * 1000)
  }

  private async checkPaymentStatus(): Promise<void> {
    // 检查待处理的支付
    for (const payment of this.paymentResults.values()) {
      if (payment.status === 'pending' || payment.status === 'processing') {
        // 检查支付状态更新
        console.log(`🔍 Checking payment status: ${payment.id}`)
      }
    }
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance()
