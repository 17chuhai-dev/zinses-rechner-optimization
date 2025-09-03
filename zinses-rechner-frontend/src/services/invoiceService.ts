/**
 * 德国税法合规的发票和税务管理系统
 * 符合德国增值税法(UStG)和会计准则(HGB)的发票生成和管理
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { generateAnonymousId } from '@/utils/encryption'

// 发票状态
export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'

// 税率类型
export type TaxRateType = 'standard' | 'reduced' | 'zero' | 'exempt'

// 发票类型
export type InvoiceType =
  | 'invoice'
  | 'credit_note'
  | 'proforma'
  | 'recurring'
  | 'final'

// 客户类型
export type CustomerType =
  | 'individual'
  | 'business_de'
  | 'business_eu'
  | 'business_non_eu'

// 德国税率配置
export const GERMAN_TAX_RATES = {
  standard: {
    rate: 0.19, // 19%
    name: 'Umsatzsteuer (19%)',
    code: 'DE_VAT_19'
  },
  reduced: {
    rate: 0.07, // 7%
    name: 'Ermäßigte Umsatzsteuer (7%)',
    code: 'DE_VAT_7'
  },
  zero: {
    rate: 0.00, // 0%
    name: 'Steuerfreie Lieferung',
    code: 'DE_VAT_0'
  },
  exempt: {
    rate: 0.00, // 0%
    name: 'Steuerbefreite Leistung',
    code: 'DE_VAT_EXEMPT'
  }
} as const

// 地址信息
export interface Address {
  name: string
  company?: string
  street: string
  streetNumber: string
  postalCode: string
  city: string
  state?: string
  country: string
  countryCode: string
}

// 客户信息
export interface Customer {
  id: string
  type: CustomerType

  // 基本信息
  firstName?: string
  lastName?: string
  companyName?: string
  email: string
  phone?: string

  // 地址
  billingAddress: Address
  shippingAddress?: Address

  // 税务信息
  taxId?: string // Steuernummer
  vatId?: string // USt-IdNr.
  taxExempt: boolean
  reverseCharge: boolean // 反向征收

  // 小企业规定 (§19 UStG)
  smallBusinessRegulation: boolean

  createdAt: Date
  updatedAt: Date
}

// 发票项目
export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number // 不含税单价
  discount?: {
    type: 'percentage' | 'fixed'
    value: number
  }

  // 税务信息
  taxRateType: TaxRateType
  taxRate: number
  taxAmount: number

  // 计算字段
  subtotal: number // 小计（不含税）
  total: number // 总计（含税）

  // 服务期间（用于订阅）
  servicePeriod?: {
    start: Date
    end: Date
  }

  // 元数据
  metadata?: Record<string, any>
}

// 发票
export interface Invoice {
  id: string
  invoiceNumber: string
  type: InvoiceType
  status: InvoiceStatus

  // 客户信息
  customerId: string
  customer: Customer

  // 发票日期
  issueDate: Date
  dueDate: Date
  servicePeriod?: {
    start: Date
    end: Date
  }

  // 发票项目
  items: InvoiceItem[]

  // 金额计算
  subtotal: number // 不含税总额
  totalTax: number // 税额总计
  total: number // 含税总额

  // 税务明细
  taxBreakdown: Array<{
    taxRateType: TaxRateType
    taxRate: number
    taxableAmount: number
    taxAmount: number
  }>

  // 付款信息
  paymentTerms: string
  paymentMethod?: string
  paidAt?: Date
  paidAmount?: number

  // 备注
  notes?: string
  internalNotes?: string

  // 文件
  pdfUrl?: string
  xmlUrl?: string // ZUGFeRD格式

  // 关联信息
  subscriptionId?: string
  originalInvoiceId?: string // 用于贷项通知单

  // 审计信息
  createdBy: string
  createdAt: Date
  updatedAt: Date
  sentAt?: Date

  // 德国特定字段
  germanSpecific: {
    // 发票必需信息（根据§14 UStG）
    supplierTaxId: string // 供应商税号
    supplierVatId?: string // 供应商增值税号

    // 小企业规定声明
    smallBusinessNote?: string

    // 反向征收声明
    reverseChargeNote?: string

    // 出口声明
    exportNote?: string

    // 存档要求
    retentionPeriod: number // 保存期限（年）
    archiveLocation?: string
  }
}

// 税务报告
export interface TaxReport {
  id: string
  period: {
    start: Date
    end: Date
    type: 'monthly' | 'quarterly' | 'annually'
  }

  // 销售税汇总
  salesTax: {
    standardRate: {
      taxableAmount: number
      taxAmount: number
    }
    reducedRate: {
      taxableAmount: number
      taxAmount: number
    }
    zeroRate: {
      taxableAmount: number
      taxAmount: number
    }
    exempt: {
      amount: number
    }
    reverseCharge: {
      amount: number
    }
    export: {
      amount: number
    }
  }

  // 进项税（如果适用）
  inputTax?: {
    amount: number
    deductible: number
  }

  // 应缴税额
  taxDue: number

  // 报告状态
  status: 'draft' | 'submitted' | 'accepted' | 'rejected'
  submittedAt?: Date

  createdAt: Date
  updatedAt: Date
}

class InvoiceService {
  private invoiceCounter: number = 1
  private currentYear: number = new Date().getFullYear()

  /**
   * 创建发票
   */
  async createInvoice(
    customerId: string,
    items: Omit<InvoiceItem, 'id' | 'taxAmount' | 'subtotal' | 'total'>[],
    options: {
      type?: InvoiceType
      dueDate?: Date
      servicePeriod?: { start: Date; end: Date }
      notes?: string
      subscriptionId?: string
    } = {}
  ): Promise<Invoice> {
    const customer = await this.getCustomer(customerId)
    if (!customer) {
      throw new Error('客户不存在')
    }

    const invoiceId = generateAnonymousId()
    const invoiceNumber = this.generateInvoiceNumber()
    const issueDate = new Date()
    const dueDate = options.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14天后

    // 计算发票项目
    const calculatedItems = items.map(item => this.calculateInvoiceItem(item, customer))

    // 计算总额
    const subtotal = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0)
    const totalTax = calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0)
    const total = subtotal + totalTax

    // 生成税务明细
    const taxBreakdown = this.generateTaxBreakdown(calculatedItems)

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      type: options.type || 'invoice',
      status: 'draft',
      customerId,
      customer,
      issueDate,
      dueDate,
      servicePeriod: options.servicePeriod,
      items: calculatedItems,
      subtotal,
      totalTax,
      total,
      taxBreakdown,
      paymentTerms: this.getPaymentTerms(customer),
      notes: options.notes,
      subscriptionId: options.subscriptionId,
      createdBy: 'system', // 在实际实现中会是当前用户ID
      createdAt: new Date(),
      updatedAt: new Date(),
      germanSpecific: {
        supplierTaxId: import.meta.env.VITE_COMPANY_TAX_ID || 'DE123456789',
        supplierVatId: import.meta.env.VITE_COMPANY_VAT_ID || 'DE123456789',
        smallBusinessNote: this.getSmallBusinessNote(customer),
        reverseChargeNote: this.getReverseChargeNote(customer),
        exportNote: this.getExportNote(customer),
        retentionPeriod: 10 // 德国法律要求保存10年
      }
    }

    // 保存发票
    await this.saveInvoice(invoice)

    return invoice
  }

  /**
   * 生成发票PDF
   */
  async generateInvoicePdf(invoiceId: string): Promise<string> {
    const invoice = await this.getInvoice(invoiceId)
    if (!invoice) {
      throw new Error('发票不存在')
    }

    // 生成PDF内容
    const pdfContent = this.generatePdfContent(invoice)

    // 保存PDF文件
    const pdfUrl = await this.savePdfFile(invoiceId, pdfContent)

    // 更新发票记录
    invoice.pdfUrl = pdfUrl
    invoice.updatedAt = new Date()
    await this.saveInvoice(invoice)

    return pdfUrl
  }

  /**
   * 生成ZUGFeRD格式发票
   */
  async generateZugferdInvoice(invoiceId: string): Promise<string> {
    const invoice = await this.getInvoice(invoiceId)
    if (!invoice) {
      throw new Error('发票不存在')
    }

    // 生成ZUGFeRD XML
    const xmlContent = this.generateZugferdXml(invoice)

    // 保存XML文件
    const xmlUrl = await this.saveXmlFile(invoiceId, xmlContent)

    // 更新发票记录
    invoice.xmlUrl = xmlUrl
    invoice.updatedAt = new Date()
    await this.saveInvoice(invoice)

    return xmlUrl
  }

  /**
   * 发送发票
   */
  async sendInvoice(invoiceId: string, options?: {
    email?: string
    subject?: string
    message?: string
  }): Promise<void> {
    const invoice = await this.getInvoice(invoiceId)
    if (!invoice) {
      throw new Error('发票不存在')
    }

    if (invoice.status !== 'draft') {
      throw new Error('只能发送草稿状态的发票')
    }

    // 生成PDF（如果还没有）
    if (!invoice.pdfUrl) {
      await this.generateInvoicePdf(invoiceId)
    }

    // 发送邮件
    await this.sendInvoiceEmail(invoice, options)

    // 更新状态
    invoice.status = 'sent'
    invoice.sentAt = new Date()
    invoice.updatedAt = new Date()
    await this.saveInvoice(invoice)
  }

  /**
   * 标记发票为已付款
   */
  async markInvoiceAsPaid(
    invoiceId: string,
    paidAmount: number,
    paidAt: Date = new Date(),
    paymentMethod?: string
  ): Promise<void> {
    const invoice = await this.getInvoice(invoiceId)
    if (!invoice) {
      throw new Error('发票不存在')
    }

    invoice.status = 'paid'
    invoice.paidAt = paidAt
    invoice.paidAmount = paidAmount
    invoice.paymentMethod = paymentMethod
    invoice.updatedAt = new Date()

    await this.saveInvoice(invoice)

    // 触发付款后续处理
    await this.handlePaymentReceived(invoice)
  }

  /**
   * 生成税务报告
   */
  async generateTaxReport(
    period: { start: Date; end: Date; type: 'monthly' | 'quarterly' | 'annually' }
  ): Promise<TaxReport> {
    const invoices = await this.getInvoicesForPeriod(period.start, period.end)

    const report: TaxReport = {
      id: generateAnonymousId(),
      period,
      salesTax: {
        standardRate: { taxableAmount: 0, taxAmount: 0 },
        reducedRate: { taxableAmount: 0, taxAmount: 0 },
        zeroRate: { taxableAmount: 0, taxAmount: 0 },
        exempt: { amount: 0 },
        reverseCharge: { amount: 0 },
        export: { amount: 0 }
      },
      taxDue: 0,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 计算税务汇总
    for (const invoice of invoices) {
      if (invoice.status === 'paid') {
        for (const taxItem of invoice.taxBreakdown) {
          switch (taxItem.taxRateType) {
            case 'standard':
              report.salesTax.standardRate.taxableAmount += taxItem.taxableAmount
              report.salesTax.standardRate.taxAmount += taxItem.taxAmount
              break
            case 'reduced':
              report.salesTax.reducedRate.taxableAmount += taxItem.taxableAmount
              report.salesTax.reducedRate.taxAmount += taxItem.taxAmount
              break
            case 'zero':
              report.salesTax.zeroRate.taxableAmount += taxItem.taxableAmount
              break
            case 'exempt':
              report.salesTax.exempt.amount += taxItem.taxableAmount
              break
          }
        }

        // 处理反向征收
        if (invoice.customer.reverseCharge) {
          report.salesTax.reverseCharge.amount += invoice.subtotal
        }

        // 处理出口
        if (invoice.customer.type === 'business_non_eu') {
          report.salesTax.export.amount += invoice.subtotal
        }
      }
    }

    // 计算应缴税额
    report.taxDue =
      report.salesTax.standardRate.taxAmount +
      report.salesTax.reducedRate.taxAmount

    await this.saveTaxReport(report)
    return report
  }

  // 私有方法

  /**
   * 生成发票号码
   */
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear()
    if (year !== this.currentYear) {
      this.currentYear = year
      this.invoiceCounter = 1
    }

    const number = this.invoiceCounter.toString().padStart(6, '0')
    this.invoiceCounter++

    return `${year}-${number}`
  }

  /**
   * 计算发票项目
   */
  private calculateInvoiceItem(
    item: Omit<InvoiceItem, 'id' | 'taxAmount' | 'subtotal' | 'total'>,
    customer: Customer
  ): InvoiceItem {
    const itemId = generateAnonymousId()

    // 计算折扣后单价
    let effectiveUnitPrice = item.unitPrice
    if (item.discount) {
      if (item.discount.type === 'percentage') {
        effectiveUnitPrice = item.unitPrice * (1 - item.discount.value / 100)
      } else {
        effectiveUnitPrice = Math.max(0, item.unitPrice - item.discount.value)
      }
    }

    // 计算小计（不含税）
    const subtotal = effectiveUnitPrice * item.quantity

    // 确定税率
    const taxRate = this.determineTaxRate(item.taxRateType, customer)

    // 计算税额
    const taxAmount = customer.reverseCharge ? 0 : subtotal * taxRate

    // 计算总计
    const total = subtotal + taxAmount

    return {
      id: itemId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRateType: item.taxRateType,
      taxRate,
      taxAmount,
      subtotal,
      total,
      servicePeriod: item.servicePeriod,
      metadata: item.metadata
    }
  }

  /**
   * 确定税率
   */
  private determineTaxRate(taxRateType: TaxRateType, customer: Customer): number {
    // 小企业规定
    if (customer.smallBusinessRegulation) {
      return 0
    }

    // 反向征收
    if (customer.reverseCharge) {
      return 0
    }

    // 出口到非欧盟国家
    if (customer.type === 'business_non_eu') {
      return 0
    }

    return GERMAN_TAX_RATES[taxRateType].rate
  }

  /**
   * 生成税务明细
   */
  private generateTaxBreakdown(items: InvoiceItem[]): Array<{
    taxRateType: TaxRateType
    taxRate: number
    taxableAmount: number
    taxAmount: number
  }> {
    const breakdown = new Map<string, {
      taxRateType: TaxRateType
      taxRate: number
      taxableAmount: number
      taxAmount: number
    }>()

    for (const item of items) {
      const key = `${item.taxRateType}_${item.taxRate}`

      if (breakdown.has(key)) {
        const existing = breakdown.get(key)!
        existing.taxableAmount += item.subtotal
        existing.taxAmount += item.taxAmount
      } else {
        breakdown.set(key, {
          taxRateType: item.taxRateType,
          taxRate: item.taxRate,
          taxableAmount: item.subtotal,
          taxAmount: item.taxAmount
        })
      }
    }

    return Array.from(breakdown.values())
  }

  /**
   * 获取付款条件
   */
  private getPaymentTerms(customer: Customer): string {
    switch (customer.type) {
      case 'individual':
        return 'Zahlbar innerhalb von 14 Tagen ohne Abzug.'
      case 'business_de':
        return 'Zahlbar innerhalb von 30 Tagen ohne Abzug.'
      default:
        return 'Zahlbar innerhalb von 14 Tagen ohne Abzug.'
    }
  }

  /**
   * 获取小企业规定声明
   */
  private getSmallBusinessNote(customer: Customer): string | undefined {
    if (customer.smallBusinessRegulation) {
      return 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'
    }
    return undefined
  }

  /**
   * 获取反向征收声明
   */
  private getReverseChargeNote(customer: Customer): string | undefined {
    if (customer.reverseCharge) {
      return 'Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge).'
    }
    return undefined
  }

  /**
   * 获取出口声明
   */
  private getExportNote(customer: Customer): string | undefined {
    if (customer.type === 'business_non_eu') {
      return 'Steuerfreie Ausfuhrlieferung gemäß § 4 Nr. 1a UStG.'
    }
    return undefined
  }

  /**
   * 生成PDF内容
   */
  private generatePdfContent(invoice: Invoice): Buffer {
    // 在实际实现中，这里会使用PDF生成库（如puppeteer、jsPDF等）
    // 生成符合德国发票格式要求的PDF
    return Buffer.from('PDF content placeholder')
  }

  /**
   * 生成ZUGFeRD XML
   */
  private generateZugferdXml(invoice: Invoice): string {
    // 在实际实现中，这里会生成符合ZUGFeRD标准的XML
    return `<?xml version="1.0" encoding="UTF-8"?>
    <!-- ZUGFeRD XML placeholder for invoice ${invoice.invoiceNumber} -->`
  }

  /**
   * 发送发票邮件
   */
  private async sendInvoiceEmail(
    invoice: Invoice,
    options?: {
      email?: string
      subject?: string
      message?: string
    }
  ): Promise<void> {
    const email = options?.email || invoice.customer.email
    const subject = options?.subject || `Rechnung ${invoice.invoiceNumber}`
    const message = options?.message || this.getDefaultEmailMessage(invoice)

    // 在实际实现中，这里会发送邮件
    console.log(`发送发票邮件到: ${email}`)
    console.log(`主题: ${subject}`)
    console.log(`内容: ${message}`)
  }

  /**
   * 获取默认邮件内容
   */
  private getDefaultEmailMessage(invoice: Invoice): string {
    return `
Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung ${invoice.invoiceNumber} vom ${invoice.issueDate.toLocaleDateString('de-DE')}.

Der Rechnungsbetrag von ${invoice.total.toFixed(2)} EUR ist bis zum ${invoice.dueDate.toLocaleDateString('de-DE')} zu begleichen.

Mit freundlichen Grüßen
Ihr Zinses-Rechner Team
    `.trim()
  }

  /**
   * 处理付款接收
   */
  private async handlePaymentReceived(invoice: Invoice): Promise<void> {
    // 激活订阅、发送确认邮件等
    console.log(`处理发票付款: ${invoice.invoiceNumber}`)
  }

  // 数据访问方法

  /**
   * 保存发票
   */
  private async saveInvoice(invoice: Invoice): Promise<void> {
    // 在实际实现中，这里会保存到数据库
    console.log('保存发票:', invoice.invoiceNumber)
  }

  /**
   * 获取发票
   */
  private async getInvoice(invoiceId: string): Promise<Invoice | null> {
    // 在实际实现中，这里会从数据库查询
    return null
  }

  /**
   * 获取客户
   */
  private async getCustomer(customerId: string): Promise<Customer | null> {
    // 在实际实现中，这里会从数据库查询
    return null
  }

  /**
   * 获取期间内的发票
   */
  private async getInvoicesForPeriod(start: Date, end: Date): Promise<Invoice[]> {
    // 在实际实现中，这里会从数据库查询
    return []
  }

  /**
   * 保存PDF文件
   */
  private async savePdfFile(invoiceId: string, content: Buffer): Promise<string> {
    // 在实际实现中，这里会保存到文件系统或云存储
    return `https://api.zinses-rechner.de/invoices/${invoiceId}.pdf`
  }

  /**
   * 保存XML文件
   */
  private async saveXmlFile(invoiceId: string, content: string): Promise<string> {
    // 在实际实现中，这里会保存到文件系统或云存储
    return `https://api.zinses-rechner.de/invoices/${invoiceId}.xml`
  }

  /**
   * 保存税务报告
   */
  private async saveTaxReport(report: TaxReport): Promise<void> {
    // 在实际实现中，这里会保存到数据库
    console.log('保存税务报告:', report.id)
  }
}

// 导出单例实例
export const invoiceService = new InvoiceService()

// 导出德国税率配置
export { GERMAN_TAX_RATES }

// 导出类型
export type {
  Invoice,
  InvoiceItem,
  Customer,
  TaxReport,
  InvoiceStatus,
  InvoiceType,
  CustomerType,
  TaxRateType
}
