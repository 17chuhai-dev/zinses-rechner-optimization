/**
 * 银行API集成服务
 * 提供与各大银行API的集成，支持账户信息、交易记录、余额查询等功能
 */

import { openAPIService } from './OpenAPIService'
import type { ThirdPartyIntegration, SyncResult } from './OpenAPIService'

// 银行集成相关类型定义
export interface BankAccount {
  id: string
  bankId: string
  accountNumber: string
  accountType: AccountType
  currency: string
  balance: number
  availableBalance: number
  accountName: string
  iban?: string
  bic?: string
  isActive: boolean
  lastUpdated: Date
  metadata: AccountMetadata
}

export type AccountType = 
  | 'checking'      // 支票账户
  | 'savings'       // 储蓄账户
  | 'credit'        // 信用账户
  | 'investment'    // 投资账户
  | 'loan'          // 贷款账户
  | 'mortgage'      // 抵押贷款账户

export interface AccountMetadata {
  openDate: Date
  interestRate?: number
  creditLimit?: number
  minimumBalance?: number
  monthlyFee?: number
  overdraftLimit?: number
  maturityDate?: Date
}

export interface BankTransaction {
  id: string
  accountId: string
  amount: number
  currency: string
  description: string
  category: TransactionCategory
  type: TransactionType
  status: TransactionStatus
  date: Date
  valueDate: Date
  counterparty?: Counterparty
  reference?: string
  balance?: number
  fees?: TransactionFee[]
  metadata: TransactionMetadata
}

export type TransactionCategory = 
  | 'income'
  | 'expense'
  | 'transfer'
  | 'investment'
  | 'loan_payment'
  | 'fee'
  | 'interest'
  | 'dividend'
  | 'other'

export type TransactionType = 'debit' | 'credit'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface Counterparty {
  name: string
  accountNumber?: string
  iban?: string
  bic?: string
  address?: string
}

export interface TransactionFee {
  type: string
  amount: number
  currency: string
  description: string
}

export interface TransactionMetadata {
  merchantCategory?: string
  location?: string
  paymentMethod?: string
  originalAmount?: number
  originalCurrency?: string
  exchangeRate?: number
  tags?: string[]
}

export interface BankProvider {
  id: string
  name: string
  country: string
  logo: string
  supportedFeatures: BankFeature[]
  apiVersion: string
  authMethod: 'oauth2' | 'api_key' | 'psd2'
  endpoints: BankEndpoint[]
  rateLimit: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  isActive: boolean
}

export type BankFeature = 
  | 'accounts'
  | 'transactions'
  | 'balances'
  | 'payments'
  | 'standing_orders'
  | 'direct_debits'
  | 'cards'
  | 'loans'
  | 'investments'

export interface BankEndpoint {
  name: string
  path: string
  method: string
  description: string
  requiredScopes: string[]
}

export interface BankConnection {
  id: string
  organizationId: string
  providerId: string
  connectionName: string
  status: ConnectionStatus
  credentials: BankCredentials
  accounts: BankAccount[]
  lastSync: Date
  syncFrequency: 'manual' | 'hourly' | 'daily' | 'weekly'
  isActive: boolean
  errorCount: number
  createdAt: Date
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'expired' | 'pending'

export interface BankCredentials {
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
  scopes: string[]
  consentId?: string
  institutionId?: string
}

export interface PaymentInstruction {
  id: string
  fromAccountId: string
  toAccount: PaymentRecipient
  amount: number
  currency: string
  description: string
  executionDate?: Date
  urgency: 'normal' | 'urgent'
  status: PaymentStatus
  fees?: TransactionFee[]
  createdAt: Date
}

export interface PaymentRecipient {
  name: string
  iban: string
  bic?: string
  address?: string
}

export type PaymentStatus = 'pending' | 'authorized' | 'executed' | 'rejected' | 'cancelled'

export interface StandingOrder {
  id: string
  accountId: string
  recipient: PaymentRecipient
  amount: number
  currency: string
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate: Date
  endDate?: Date
  nextExecution: Date
  description: string
  isActive: boolean
}

export interface DirectDebit {
  id: string
  accountId: string
  creditor: Counterparty
  mandateId: string
  amount?: number
  frequency: 'once' | 'recurring'
  lastExecution?: Date
  nextExecution?: Date
  isActive: boolean
}

export class BankingIntegrationService {
  private static instance: BankingIntegrationService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'

  private constructor() {}

  public static getInstance(): BankingIntegrationService {
    if (!BankingIntegrationService.instance) {
      BankingIntegrationService.instance = new BankingIntegrationService()
    }
    return BankingIntegrationService.instance
  }

  /**
   * 获取支持的银行提供商
   */
  public async getSupportedBanks(country?: string): Promise<BankProvider[]> {
    try {
      const params = new URLSearchParams()
      if (country) params.append('country', country)

      const response = await fetch(
        `${this.baseUrl}/api/banking/providers?${params.toString()}`
      )

      if (response.ok) {
        const data = await response.json()
        return data.providers || []
      }

      return []
    } catch (error) {
      console.error('获取银行提供商失败:', error)
      return []
    }
  }

  /**
   * 创建银行连接
   */
  public async createBankConnection(data: {
    organizationId: string
    providerId: string
    connectionName: string
    redirectUrl: string
  }): Promise<{ authUrl: string; connectionId: string } | null> {
    try {
      const integration = await openAPIService.createIntegration({
        name: data.connectionName,
        type: 'banking',
        provider: data.providerId,
        configuration: {
          baseUrl: '',
          timeout: 30000,
          retryAttempts: 3,
          retryDelay: 1000,
          dataMapping: [],
        },
        credentials: {
          type: 'oauth2',
          scopes: ['accounts', 'transactions', 'balances']
        }
      })

      if (integration) {
        // 返回OAuth授权URL
        return {
          authUrl: `${this.baseUrl}/api/banking/auth/${integration.id}?redirect_uri=${encodeURIComponent(data.redirectUrl)}`,
          connectionId: integration.id
        }
      }

      return null
    } catch (error) {
      console.error('创建银行连接失败:', error)
      return null
    }
  }

  /**
   * 完成OAuth授权
   */
  public async completeAuthorization(
    connectionId: string,
    authCode: string
  ): Promise<BankConnection | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/banking/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId,
          authCode
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.connection
      }

      return null
    } catch (error) {
      console.error('完成OAuth授权失败:', error)
      return null
    }
  }

  /**
   * 获取银行连接列表
   */
  public async getBankConnections(organizationId: string): Promise<BankConnection[]> {
    try {
      const integrations = await openAPIService.getIntegrations(organizationId, 'banking')
      
      // 转换为银行连接格式
      return integrations.map(integration => ({
        id: integration.id,
        organizationId: integration.id, // 这里应该从integration中获取
        providerId: integration.provider,
        connectionName: integration.name,
        status: this.mapIntegrationStatus(integration.status),
        credentials: {
          scopes: ['accounts', 'transactions', 'balances']
        },
        accounts: [],
        lastSync: integration.lastSync || new Date(),
        syncFrequency: 'daily',
        isActive: integration.isActive,
        errorCount: integration.errorCount,
        createdAt: new Date()
      })) as BankConnection[]
    } catch (error) {
      console.error('获取银行连接失败:', error)
      return []
    }
  }

  /**
   * 获取账户列表
   */
  public async getAccounts(connectionId: string): Promise<BankAccount[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/banking/connections/${connectionId}/accounts`)
      
      if (response.ok) {
        const data = await response.json()
        return data.accounts || []
      }

      return []
    } catch (error) {
      console.error('获取账户列表失败:', error)
      return []
    }
  }

  /**
   * 获取账户余额
   */
  public async getAccountBalance(accountId: string): Promise<{
    balance: number
    availableBalance: number
    currency: string
    lastUpdated: Date
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/banking/accounts/${accountId}/balance`)
      
      if (response.ok) {
        const data = await response.json()
        return data.balance
      }

      return null
    } catch (error) {
      console.error('获取账户余额失败:', error)
      return null
    }
  }

  /**
   * 获取交易记录
   */
  public async getTransactions(
    accountId: string,
    options?: {
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
      category?: TransactionCategory
    }
  ): Promise<{ transactions: BankTransaction[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (options?.startDate) params.append('startDate', options.startDate.toISOString())
      if (options?.endDate) params.append('endDate', options.endDate.toISOString())
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())
      if (options?.category) params.append('category', options.category)

      const response = await fetch(
        `${this.baseUrl}/api/banking/accounts/${accountId}/transactions?${params.toString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        return {
          transactions: data.transactions || [],
          total: data.total || 0
        }
      }

      return { transactions: [], total: 0 }
    } catch (error) {
      console.error('获取交易记录失败:', error)
      return { transactions: [], total: 0 }
    }
  }

  /**
   * 同步银行数据
   */
  public async syncBankData(
    connectionId: string,
    options?: {
      accounts?: boolean
      transactions?: boolean
      startDate?: Date
      endDate?: Date
    }
  ): Promise<SyncResult | null> {
    try {
      return await openAPIService.syncIntegration(connectionId, {
        fullSync: !options?.startDate && !options?.endDate,
        startDate: options?.startDate,
        endDate: options?.endDate
      })
    } catch (error) {
      console.error('同步银行数据失败:', error)
      return null
    }
  }

  /**
   * 创建支付指令
   */
  public async createPayment(data: {
    fromAccountId: string
    toAccount: PaymentRecipient
    amount: number
    currency: string
    description: string
    executionDate?: Date
    urgency?: 'normal' | 'urgent'
  }): Promise<PaymentInstruction | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/banking/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        return result.payment
      }

      return null
    } catch (error) {
      console.error('创建支付指令失败:', error)
      return null
    }
  }

  /**
   * 获取常设指令
   */
  public async getStandingOrders(accountId: string): Promise<StandingOrder[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/banking/accounts/${accountId}/standing-orders`)
      
      if (response.ok) {
        const data = await response.json()
        return data.standingOrders || []
      }

      return []
    } catch (error) {
      console.error('获取常设指令失败:', error)
      return []
    }
  }

  /**
   * 获取直接借记
   */
  public async getDirectDebits(accountId: string): Promise<DirectDebit[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/banking/accounts/${accountId}/direct-debits`)
      
      if (response.ok) {
        const data = await response.json()
        return data.directDebits || []
      }

      return []
    } catch (error) {
      console.error('获取直接借记失败:', error)
      return []
    }
  }

  /**
   * 分类交易
   */
  public async categorizeTransactions(
    transactions: BankTransaction[]
  ): Promise<BankTransaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/banking/transactions/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions })
      })

      if (response.ok) {
        const data = await response.json()
        return data.categorizedTransactions || transactions
      }

      return transactions
    } catch (error) {
      console.error('分类交易失败:', error)
      return transactions
    }
  }

  /**
   * 获取账户分析
   */
  public async getAccountAnalysis(
    accountId: string,
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    income: number
    expenses: number
    netFlow: number
    categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>
    trends: Array<{ date: Date; income: number; expenses: number }>
  } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/banking/accounts/${accountId}/analysis?period=${period}`
      )
      
      if (response.ok) {
        const data = await response.json()
        return data.analysis
      }

      return null
    } catch (error) {
      console.error('获取账户分析失败:', error)
      return null
    }
  }

  /**
   * 断开银行连接
   */
  public async disconnectBank(connectionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/banking/connections/${connectionId}`, {
        method: 'DELETE'
      })

      return response.ok
    } catch (error) {
      console.error('断开银行连接失败:', error)
      return false
    }
  }

  /**
   * 映射集成状态到银行连接状态
   */
  private mapIntegrationStatus(status: string): ConnectionStatus {
    const statusMap: Record<string, ConnectionStatus> = {
      'active': 'connected',
      'inactive': 'disconnected',
      'error': 'error',
      'pending': 'pending',
      'suspended': 'expired'
    }
    
    return statusMap[status] || 'disconnected'
  }

  /**
   * 验证IBAN
   */
  public validateIBAN(iban: string): boolean {
    // 简化的IBAN验证逻辑
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/
    return ibanRegex.test(iban.replace(/\s/g, ''))
  }

  /**
   * 格式化账户号码
   */
  public formatAccountNumber(accountNumber: string, type: 'iban' | 'account' = 'account'): string {
    if (type === 'iban') {
      return accountNumber.replace(/(.{4})/g, '$1 ').trim()
    }
    
    return accountNumber
  }

  /**
   * 获取交易类别标签
   */
  public getCategoryLabel(category: TransactionCategory): string {
    const labels: Record<TransactionCategory, string> = {
      income: 'Einkommen',
      expense: 'Ausgabe',
      transfer: 'Überweisung',
      investment: 'Investition',
      loan_payment: 'Kreditrückzahlung',
      fee: 'Gebühr',
      interest: 'Zinsen',
      dividend: 'Dividende',
      other: 'Sonstiges'
    }
    
    return labels[category] || category
  }
}

// 导出单例实例
export const bankingIntegrationService = BankingIntegrationService.getInstance()
