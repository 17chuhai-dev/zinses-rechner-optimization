/**
 * 全球市场扩展服务
 * 支持多地区、多货币、多法规的全球化财务计算
 */

import { auditLogService } from './AuditLogService'

// 全球市场相关类型定义
export interface MarketRegion {
  id: string
  name: string
  code: string // ISO 3166-1 alpha-2
  currency: Currency
  languages: Language[]
  regulations: FinancialRegulation[]
  taxSystem: TaxSystem
  bankingSystem: BankingSystem
  isActive: boolean
  supportLevel: SupportLevel
  launchDate?: Date
}

export type SupportLevel = 'full' | 'partial' | 'beta' | 'planned'

export interface Currency {
  code: string // ISO 4217
  name: string
  symbol: string
  decimals: number
  exchangeRate: number // relative to EUR
  isBaseCurrency: boolean
  lastUpdated: Date
  volatility: number
  tradingHours: TradingHours
}

export interface Language {
  code: string // ISO 639-1
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  completeness: number // 0-100%
  isDefault: boolean
  translators: string[]
  lastUpdated: Date
}

export interface FinancialRegulation {
  id: string
  name: string
  type: RegulationType
  jurisdiction: string
  description: string
  requirements: RegulationRequirement[]
  complianceLevel: ComplianceLevel
  effectiveDate: Date
  lastReview: Date
}

export type RegulationType = 
  | 'banking'           // 银行监管
  | 'securities'        // 证券监管
  | 'insurance'         // 保险监管
  | 'consumer_protection' // 消费者保护
  | 'data_protection'   // 数据保护
  | 'tax_compliance'    // 税务合规
  | 'anti_money_laundering' // 反洗钱
  | 'market_conduct'    // 市场行为

export type ComplianceLevel = 'mandatory' | 'recommended' | 'optional' | 'not_applicable'

export interface RegulationRequirement {
  id: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  implementationStatus: 'implemented' | 'in_progress' | 'planned' | 'not_started'
  dueDate?: Date
  cost?: number
  effort?: number // hours
}

export interface TaxSystem {
  id: string
  name: string
  type: TaxSystemType
  rates: TaxRate[]
  deductions: TaxDeduction[]
  exemptions: TaxExemption[]
  filingRequirements: FilingRequirement[]
  calculationRules: TaxCalculationRule[]
}

export type TaxSystemType = 'progressive' | 'flat' | 'regressive' | 'hybrid'

export interface TaxRate {
  id: string
  name: string
  type: 'income' | 'capital_gains' | 'corporate' | 'vat' | 'property' | 'inheritance'
  rate: number
  threshold?: number
  maxAmount?: number
  applicableFrom: Date
  applicableTo?: Date
}

export interface TaxDeduction {
  id: string
  name: string
  type: string
  amount?: number
  percentage?: number
  conditions: string[]
  eligibility: string[]
}

export interface TaxExemption {
  id: string
  name: string
  type: string
  amount?: number
  conditions: string[]
  eligibility: string[]
}

export interface FilingRequirement {
  id: string
  name: string
  frequency: 'annual' | 'quarterly' | 'monthly' | 'as_needed'
  deadline: string
  forms: string[]
  penalties: Penalty[]
}

export interface Penalty {
  type: 'late_filing' | 'underpayment' | 'non_compliance'
  amount?: number
  percentage?: number
  description: string
}

export interface TaxCalculationRule {
  id: string
  name: string
  description: string
  formula: string
  conditions: string[]
  examples: CalculationExample[]
}

export interface CalculationExample {
  scenario: string
  inputs: Record<string, number>
  expectedOutput: number
  explanation: string
}

export interface BankingSystem {
  id: string
  name: string
  centralBank: string
  interestRateSystem: InterestRateSystem
  accountTypes: BankAccountType[]
  paymentMethods: PaymentMethod[]
  regulations: string[]
}

export interface InterestRateSystem {
  baseRate: number
  rateType: 'fixed' | 'variable' | 'hybrid'
  compoundingFrequency: 'daily' | 'monthly' | 'quarterly' | 'annually'
  benchmarkRates: BenchmarkRate[]
  lastUpdated: Date
}

export interface BenchmarkRate {
  name: string
  rate: number
  description: string
  lastUpdated: Date
}

export interface BankAccountType {
  id: string
  name: string
  type: 'checking' | 'savings' | 'investment' | 'retirement' | 'business'
  features: string[]
  restrictions: string[]
  fees: AccountFee[]
}

export interface AccountFee {
  type: string
  amount?: number
  percentage?: number
  frequency: string
  conditions: string[]
}

export interface PaymentMethod {
  id: string
  name: string
  type: 'bank_transfer' | 'credit_card' | 'debit_card' | 'digital_wallet' | 'cryptocurrency'
  fees: PaymentFee[]
  processingTime: string
  limits: PaymentLimit[]
  isActive: boolean
}

export interface PaymentFee {
  type: 'fixed' | 'percentage' | 'tiered'
  amount?: number
  percentage?: number
  tiers?: FeeTier[]
}

export interface FeeTier {
  minAmount: number
  maxAmount?: number
  fee: number
}

export interface PaymentLimit {
  type: 'daily' | 'weekly' | 'monthly' | 'per_transaction'
  amount: number
  currency: string
}

export interface TradingHours {
  timezone: string
  sessions: TradingSession[]
  holidays: string[]
}

export interface TradingSession {
  name: string
  start: string // HH:MM
  end: string   // HH:MM
  days: number[] // 0-6, Sunday = 0
}

export interface GlobalizationConfig {
  defaultRegion: string
  supportedRegions: string[]
  currencyUpdateInterval: number // minutes
  regulationCheckInterval: number // hours
  complianceReportingEnabled: boolean
  multiCurrencyCalculations: boolean
  crossBorderTransactions: boolean
  localizedContent: boolean
}

export interface MarketData {
  exchangeRates: ExchangeRate[]
  interestRates: InterestRateData[]
  inflationRates: InflationRate[]
  economicIndicators: EconomicIndicator[]
  lastUpdated: Date
}

export interface ExchangeRate {
  fromCurrency: string
  toCurrency: string
  rate: number
  bid: number
  ask: number
  change: number
  changePercent: number
  timestamp: Date
  source: string
}

export interface InterestRateData {
  country: string
  currency: string
  type: 'central_bank' | 'government_bond' | 'corporate_bond' | 'mortgage'
  term: string
  rate: number
  change: number
  lastUpdated: Date
}

export interface InflationRate {
  country: string
  rate: number
  period: string
  category: 'headline' | 'core' | 'food' | 'energy'
  lastUpdated: Date
}

export interface EconomicIndicator {
  country: string
  indicator: string
  value: number
  unit: string
  period: string
  lastUpdated: Date
}

export class GlobalMarketService {
  private static instance: GlobalMarketService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private regionsCache: Map<string, MarketRegion> = new Map()
  private marketDataCache: MarketData | null = null
  private updateInterval: NodeJS.Timeout | null = null
  private config: GlobalizationConfig = {
    defaultRegion: 'DE',
    supportedRegions: ['DE', 'US', 'GB', 'FR', 'IT', 'ES', 'NL', 'CH', 'AT'],
    currencyUpdateInterval: 15, // 15 minutes
    regulationCheckInterval: 24, // 24 hours
    complianceReportingEnabled: true,
    multiCurrencyCalculations: true,
    crossBorderTransactions: true,
    localizedContent: true
  }

  private constructor() {
    this.startMarketDataUpdates()
  }

  public static getInstance(): GlobalMarketService {
    if (!GlobalMarketService.instance) {
      GlobalMarketService.instance = new GlobalMarketService()
    }
    return GlobalMarketService.instance
  }

  /**
   * 获取支持的市场地区
   */
  public async getSupportedRegions(): Promise<MarketRegion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/global/regions`)
      
      if (response.ok) {
        const data = await response.json()
        const regions = data.regions || []
        
        // 更新缓存
        regions.forEach((region: MarketRegion) => {
          this.regionsCache.set(region.code, region)
        })
        
        return regions
      }
      
      return this.getDefaultRegions()
    } catch (error) {
      console.error('获取支持地区失败:', error)
      return this.getDefaultRegions()
    }
  }

  /**
   * 获取特定地区信息
   */
  public async getRegion(regionCode: string): Promise<MarketRegion | null> {
    // 先检查缓存
    if (this.regionsCache.has(regionCode)) {
      return this.regionsCache.get(regionCode)!
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/global/regions/${regionCode}`)
      
      if (response.ok) {
        const data = await response.json()
        const region = data.region
        
        // 更新缓存
        this.regionsCache.set(regionCode, region)
        
        return region
      }
      
      return null
    } catch (error) {
      console.error('获取地区信息失败:', error)
      return null
    }
  }

  /**
   * 获取实时市场数据
   */
  public async getMarketData(forceRefresh = false): Promise<MarketData> {
    if (!forceRefresh && this.marketDataCache) {
      const cacheAge = Date.now() - this.marketDataCache.lastUpdated.getTime()
      if (cacheAge < this.config.currencyUpdateInterval * 60 * 1000) {
        return this.marketDataCache
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/global/market-data`)
      
      if (response.ok) {
        const data = await response.json()
        this.marketDataCache = data.marketData
        
        // 记录审计日志
        await auditLogService.log(
          'system_event',
          'system',
          'market_data_updated',
          'market_data',
          {
            description: 'Market data updated successfully',
            customFields: { 
              exchangeRatesCount: data.marketData.exchangeRates.length,
              lastUpdated: data.marketData.lastUpdated
            }
          },
          { severity: 'low' }
        )
        
        return this.marketDataCache
      }
      
      return this.getDefaultMarketData()
    } catch (error) {
      console.error('获取市场数据失败:', error)
      return this.getDefaultMarketData()
    }
  }

  /**
   * 货币转换
   */
  public async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date
  ): Promise<{
    convertedAmount: number
    exchangeRate: number
    timestamp: Date
    fees?: number
  }> {
    try {
      const marketData = await this.getMarketData()
      const exchangeRate = marketData.exchangeRates.find(
        rate => rate.fromCurrency === fromCurrency && rate.toCurrency === toCurrency
      )

      if (!exchangeRate) {
        throw new Error(`汇率不可用: ${fromCurrency} -> ${toCurrency}`)
      }

      const convertedAmount = amount * exchangeRate.rate
      const fees = this.calculateConversionFees(amount, fromCurrency, toCurrency)

      // 记录审计日志
      await auditLogService.log(
        'user_action',
        'calculation',
        'currency_conversion',
        'currency_converter',
        {
          description: `Currency conversion: ${amount} ${fromCurrency} -> ${convertedAmount.toFixed(2)} ${toCurrency}`,
          customFields: { 
            amount, 
            fromCurrency, 
            toCurrency, 
            exchangeRate: exchangeRate.rate,
            fees
          }
        },
        { severity: 'low' }
      )

      return {
        convertedAmount,
        exchangeRate: exchangeRate.rate,
        timestamp: exchangeRate.timestamp,
        fees
      }
    } catch (error) {
      console.error('货币转换失败:', error)
      throw error
    }
  }

  /**
   * 获取地区特定的税务计算
   */
  public async calculateRegionalTax(
    regionCode: string,
    income: number,
    taxType: string,
    taxYear: number
  ): Promise<{
    totalTax: number
    effectiveRate: number
    marginalRate: number
    breakdown: TaxBreakdown[]
    deductions: number
    exemptions: number
  }> {
    try {
      const region = await this.getRegion(regionCode)
      if (!region) {
        throw new Error(`不支持的地区: ${regionCode}`)
      }

      const response = await fetch(`${this.baseUrl}/api/global/tax-calculation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          regionCode,
          income,
          taxType,
          taxYear
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'regional_tax_calculation',
          'tax_calculator',
          {
            description: `Regional tax calculation for ${regionCode}`,
            customFields: { regionCode, income, taxType, taxYear, totalTax: data.calculation.totalTax }
          },
          { severity: 'low' }
        )
        
        return data.calculation
      }
      
      throw new Error('税务计算失败')
    } catch (error) {
      console.error('地区税务计算失败:', error)
      throw error
    }
  }

  /**
   * 检查地区合规性
   */
  public async checkRegionalCompliance(
    regionCode: string,
    calculationType: string,
    parameters: Record<string, any>
  ): Promise<{
    isCompliant: boolean
    violations: ComplianceViolation[]
    recommendations: string[]
    requiredDisclosures: string[]
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/global/compliance-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          regionCode,
          calculationType,
          parameters
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // 记录审计日志
        await auditLogService.log(
          'compliance_event',
          'system',
          'regional_compliance_check',
          'compliance_system',
          {
            description: `Regional compliance check for ${regionCode}`,
            customFields: { 
              regionCode, 
              calculationType, 
              isCompliant: data.compliance.isCompliant,
              violationCount: data.compliance.violations.length
            }
          },
          { severity: data.compliance.isCompliant ? 'low' : 'high', immediate: true }
        )
        
        return data.compliance
      }
      
      throw new Error('合规性检查失败')
    } catch (error) {
      console.error('地区合规性检查失败:', error)
      throw error
    }
  }

  /**
   * 获取本地化内容
   */
  public async getLocalizedContent(
    regionCode: string,
    languageCode: string,
    contentType: string
  ): Promise<LocalizedContent> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/global/localized-content/${regionCode}/${languageCode}/${contentType}`
      )

      if (response.ok) {
        const data = await response.json()
        return data.content
      }
      
      return this.getDefaultLocalizedContent(contentType)
    } catch (error) {
      console.error('获取本地化内容失败:', error)
      return this.getDefaultLocalizedContent(contentType)
    }
  }

  /**
   * 启动市场数据更新
   */
  private startMarketDataUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.getMarketData(true)
      } catch (error) {
        console.error('市场数据更新失败:', error)
      }
    }, this.config.currencyUpdateInterval * 60 * 1000)
  }

  /**
   * 计算货币转换费用
   */
  private calculateConversionFees(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number {
    // 简化的费用计算逻辑
    const baseFee = 0.001 // 0.1%
    const crossBorderFee = fromCurrency !== toCurrency ? 0.002 : 0 // 0.2%
    const totalFeeRate = baseFee + crossBorderFee
    
    return amount * totalFeeRate
  }

  /**
   * 获取默认地区列表
   */
  private getDefaultRegions(): MarketRegion[] {
    return [
      {
        id: 'de',
        name: 'Deutschland',
        code: 'DE',
        currency: {
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          decimals: 2,
          exchangeRate: 1.0,
          isBaseCurrency: true,
          lastUpdated: new Date(),
          volatility: 0.02,
          tradingHours: {
            timezone: 'Europe/Berlin',
            sessions: [
              { name: 'Main', start: '09:00', end: '17:30', days: [1, 2, 3, 4, 5] }
            ],
            holidays: []
          }
        },
        languages: [
          {
            code: 'de',
            name: 'German',
            nativeName: 'Deutsch',
            direction: 'ltr',
            completeness: 100,
            isDefault: true,
            translators: [],
            lastUpdated: new Date()
          }
        ],
        regulations: [],
        taxSystem: {
          id: 'de-tax',
          name: 'German Tax System',
          type: 'progressive',
          rates: [],
          deductions: [],
          exemptions: [],
          filingRequirements: [],
          calculationRules: []
        },
        bankingSystem: {
          id: 'de-banking',
          name: 'German Banking System',
          centralBank: 'Deutsche Bundesbank',
          interestRateSystem: {
            baseRate: 0.0,
            rateType: 'variable',
            compoundingFrequency: 'annually',
            benchmarkRates: [],
            lastUpdated: new Date()
          },
          accountTypes: [],
          paymentMethods: [],
          regulations: []
        },
        isActive: true,
        supportLevel: 'full'
      }
    ]
  }

  /**
   * 获取默认市场数据
   */
  private getDefaultMarketData(): MarketData {
    return {
      exchangeRates: [
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.08,
          bid: 1.079,
          ask: 1.081,
          change: 0.002,
          changePercent: 0.18,
          timestamp: new Date(),
          source: 'ECB'
        }
      ],
      interestRates: [],
      inflationRates: [],
      economicIndicators: [],
      lastUpdated: new Date()
    }
  }

  /**
   * 获取默认本地化内容
   */
  private getDefaultLocalizedContent(contentType: string): LocalizedContent {
    return {
      type: contentType,
      content: {},
      lastUpdated: new Date(),
      version: '1.0'
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.regionsCache.clear()
    this.marketDataCache = null
  }
}

// 辅助类型定义
interface TaxBreakdown {
  category: string
  amount: number
  rate: number
  description: string
}

interface ComplianceViolation {
  code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  requirement: string
  remedy: string
}

interface LocalizedContent {
  type: string
  content: Record<string, any>
  lastUpdated: Date
  version: string
}

// 导出单例实例
export const globalMarketService = GlobalMarketService.getInstance()
