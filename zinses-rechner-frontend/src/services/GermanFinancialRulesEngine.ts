/**
 * 德国金融规则引擎
 * 集成德国金融最佳实践、税务规则、法律合规要求，提供符合德国法律的专业财务建议
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { EnterpriseLocalStorageService } from './EnterpriseLocalStorageService'

// 德国税务规则
export interface GermanTaxRule {
  id: string
  name: string
  description: string
  applicableYear: number
  category: 'income_tax' | 'capital_gains' | 'inheritance' | 'property' | 'business'
  
  // 税率信息
  taxRates: TaxBracket[]
  deductions: TaxDeduction[]
  exemptions: TaxExemption[]
  
  // 适用条件
  conditions: TaxCondition[]
  
  // 优化建议
  optimizationStrategies: OptimizationStrategy[]
}

// 税率档次
export interface TaxBracket {
  minIncome: number
  maxIncome: number
  rate: number
  description: string
}

// 税务减免
export interface TaxDeduction {
  id: string
  name: string
  description: string
  maxAmount: number
  conditions: string[]
  category: 'work_related' | 'education' | 'health' | 'charity' | 'other'
}

// 税务豁免
export interface TaxExemption {
  id: string
  name: string
  description: string
  exemptionAmount: number
  applicableIncome: 'all' | 'investment' | 'salary' | 'business'
  conditions: string[]
}

// 税务条件
export interface TaxCondition {
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'between'
  value: any
  description: string
}

// 优化策略
export interface OptimizationStrategy {
  id: string
  name: string
  description: string
  potentialSavings: number
  complexity: 'low' | 'medium' | 'high'
  timeframe: 'immediate' | 'short_term' | 'long_term'
  requirements: string[]
  risks: string[]
}

// 德国投资规则
export interface GermanInvestmentRule {
  id: string
  name: string
  description: string
  category: 'etf' | 'stocks' | 'bonds' | 'real_estate' | 'pension' | 'insurance'
  
  // 监管信息
  regulator: 'BaFin' | 'Bundesbank' | 'EU' | 'Other'
  regulatoryFramework: string
  
  // 税务影响
  taxTreatment: InvestmentTaxTreatment
  
  // 风险评级
  riskLevel: 'low' | 'medium' | 'high'
  
  // 适合的投资者类型
  suitableFor: InvestorProfile[]
  
  // 最低投资要求
  minimumInvestment?: number
  
  // 费用结构
  fees: InvestmentFee[]
}

// 投资税务处理
export interface InvestmentTaxTreatment {
  capitalGainsTax: number
  dividendTax: number
  withholdingTax: number
  taxFreeAllowance: number
  taxOptimizationOptions: string[]
}

// 投资者档案
export interface InvestorProfile {
  type: 'conservative' | 'balanced' | 'growth' | 'aggressive'
  minAge?: number
  maxAge?: number
  minIncome?: number
  investmentHorizon: 'short' | 'medium' | 'long'
  riskTolerance: 'low' | 'medium' | 'high'
}

// 投资费用
export interface InvestmentFee {
  type: 'management' | 'transaction' | 'performance' | 'exit'
  amount: number
  frequency: 'one_time' | 'annual' | 'per_transaction'
  description: string
}

// 德国保险规则
export interface GermanInsuranceRule {
  id: string
  name: string
  description: string
  category: 'health' | 'life' | 'disability' | 'liability' | 'property'
  
  // 法律要求
  mandatory: boolean
  legalBasis: string
  
  // 覆盖范围
  coverage: InsuranceCoverage
  
  // 保费信息
  premiumStructure: PremiumStructure
  
  // 税务优势
  taxBenefits: InsuranceTaxBenefit[]
  
  // 推荐条件
  recommendedFor: InsuranceRecommendation[]
}

// 保险覆盖
export interface InsuranceCoverage {
  maxCoverage: number
  deductible: number
  exclusions: string[]
  waitingPeriod?: number
  coverageArea: 'germany' | 'eu' | 'worldwide'
}

// 保费结构
export interface PremiumStructure {
  basePremium: number
  factors: PremiumFactor[]
  discounts: PremiumDiscount[]
  paymentFrequency: 'monthly' | 'quarterly' | 'annually'
}

// 保费因素
export interface PremiumFactor {
  factor: string
  impact: 'increase' | 'decrease'
  percentage: number
  description: string
}

// 保费折扣
export interface PremiumDiscount {
  condition: string
  discount: number
  description: string
}

// 保险税务优势
export interface InsuranceTaxBenefit {
  type: 'deduction' | 'exemption' | 'credit'
  maxAmount: number
  conditions: string[]
  description: string
}

// 保险推荐
export interface InsuranceRecommendation {
  lifeStage: string
  income: 'low' | 'medium' | 'high'
  familyStatus: 'single' | 'married' | 'family'
  priority: 'essential' | 'recommended' | 'optional'
  reasoning: string
}

// 合规检查结果
export interface ComplianceCheck {
  compliant: boolean
  issues: ComplianceIssue[]
  recommendations: ComplianceRecommendation[]
  riskLevel: 'low' | 'medium' | 'high'
  lastChecked: Date
}

// 合规问题
export interface ComplianceIssue {
  severity: 'info' | 'warning' | 'error'
  category: string
  description: string
  legalReference: string
  resolution: string
}

// 合规建议
export interface ComplianceRecommendation {
  priority: 'low' | 'medium' | 'high'
  action: string
  description: string
  deadline?: Date
  cost?: number
}

/**
 * 德国金融规则引擎
 */
export class GermanFinancialRulesEngine {
  private static instance: GermanFinancialRulesEngine
  private storageService: EnterpriseLocalStorageService
  
  // 规则数据库
  private taxRules: Map<string, GermanTaxRule> = new Map()
  private investmentRules: Map<string, GermanInvestmentRule> = new Map()
  private insuranceRules: Map<string, GermanInsuranceRule> = new Map()
  
  // 当前税年
  private currentTaxYear = new Date().getFullYear()
  
  private isInitialized = false

  private constructor() {
    this.storageService = EnterpriseLocalStorageService.getInstance()
  }

  static getInstance(): GermanFinancialRulesEngine {
    if (!GermanFinancialRulesEngine.instance) {
      GermanFinancialRulesEngine.instance = new GermanFinancialRulesEngine()
    }
    return GermanFinancialRulesEngine.instance
  }

  /**
   * 初始化规则引擎
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.storageService.initialize()
      await this.loadTaxRules()
      await this.loadInvestmentRules()
      await this.loadInsuranceRules()
      this.isInitialized = true
      console.log('✅ GermanFinancialRulesEngine initialized')
    } catch (error) {
      console.error('❌ Failed to initialize GermanFinancialRulesEngine:', error)
      throw error
    }
  }

  /**
   * 计算税务优化建议
   */
  async calculateTaxOptimization(income: number, deductions: TaxDeduction[]): Promise<any> {
    if (!this.isInitialized) await this.initialize()

    try {
      // 计算当前税负
      const currentTax = this.calculateIncomeTax(income, deductions)
      
      // 获取适用的优化策略
      const strategies = await this.getApplicableOptimizationStrategies(income, deductions)
      
      // 计算每个策略的潜在节税
      const optimizations = []
      for (const strategy of strategies) {
        const potentialSavings = await this.calculateStrategySavings(strategy, income, deductions)
        optimizations.push({
          strategy,
          currentTax,
          potentialSavings,
          newTax: currentTax - potentialSavings,
          savingsPercentage: (potentialSavings / currentTax) * 100
        })
      }

      // 按节税金额排序
      optimizations.sort((a, b) => b.potentialSavings - a.potentialSavings)

      return {
        currentIncome: income,
        currentTax,
        optimizations: optimizations.slice(0, 5), // 前5个最佳策略
        totalPotentialSavings: optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0)
      }

    } catch (error) {
      console.error('Failed to calculate tax optimization:', error)
      throw error
    }
  }

  /**
   * 获取德国投资建议
   */
  async getGermanInvestmentRecommendations(riskProfile: InvestorProfile): Promise<any[]> {
    if (!this.isInitialized) await this.initialize()

    try {
      const recommendations = []
      
      for (const [id, rule] of this.investmentRules) {
        // 检查是否适合投资者档案
        if (this.isInvestmentSuitable(rule, riskProfile)) {
          const recommendation = {
            id,
            name: rule.name,
            description: rule.description,
            category: rule.category,
            riskLevel: rule.riskLevel,
            taxTreatment: rule.taxTreatment,
            fees: rule.fees,
            suitabilityScore: this.calculateSuitabilityScore(rule, riskProfile),
            germanAdvantages: this.getGermanSpecificAdvantages(rule),
            regulatoryInfo: {
              regulator: rule.regulator,
              framework: rule.regulatoryFramework
            }
          }
          recommendations.push(recommendation)
        }
      }

      // 按适合度排序
      recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore)

      return recommendations.slice(0, 10) // 前10个推荐

    } catch (error) {
      console.error('Failed to get investment recommendations:', error)
      return []
    }
  }

  /**
   * 分析ETF税务影响
   */
  async getETFTaxImplications(etf: any): Promise<any> {
    if (!this.isInitialized) await this.initialize()

    try {
      // 获取ETF相关的税务规则
      const etfTaxRule = this.investmentRules.get('etf_taxation')
      
      if (!etfTaxRule) {
        throw new Error('ETF tax rules not found')
      }

      const analysis = {
        etfName: etf.name,
        isin: etf.isin,
        
        // 税务处理
        taxTreatment: etfTaxRule.taxTreatment,
        
        // 年度税务影响
        annualTaxImpact: {
          dividendTax: this.calculateDividendTax(etf.expectedDividend || 0),
          capitalGainsTax: 0, // 只有在卖出时才产生
          withholdingTax: this.calculateWithholdingTax(etf.domicile, etf.expectedDividend || 0)
        },
        
        // 税务优化建议
        optimizationTips: [
          '利用年度免税额度 (Sparerpauschbetrag)',
          '考虑在不同年份实现收益以优化税负',
          '选择累积型ETF以延迟税务影响'
        ],
        
        // 德国特定考虑
        germanConsiderations: [
          'Vorabpauschale (预付税) 可能适用',
          '选择德国或欧盟注册的ETF以获得更好的税务待遇',
          '考虑使用ETF储蓄计划 (ETF-Sparplan) 的税务优势'
        ]
      }

      return analysis

    } catch (error) {
      console.error('Failed to analyze ETF tax implications:', error)
      throw error
    }
  }

  /**
   * 获取保险建议
   */
  async getInsuranceRecommendations(personalSituation: any): Promise<any[]> {
    if (!this.isInitialized) await this.initialize()

    try {
      const recommendations = []
      
      for (const [id, rule] of this.insuranceRules) {
        // 检查是否推荐给当前用户
        const isRecommended = this.isInsuranceRecommended(rule, personalSituation)
        
        if (isRecommended) {
          const recommendation = {
            id,
            name: rule.name,
            description: rule.description,
            category: rule.category,
            mandatory: rule.mandatory,
            priority: this.getInsurancePriority(rule, personalSituation),
            coverage: rule.coverage,
            estimatedPremium: this.estimateInsurancePremium(rule, personalSituation),
            taxBenefits: rule.taxBenefits,
            reasoning: this.getInsuranceReasoning(rule, personalSituation)
          }
          recommendations.push(recommendation)
        }
      }

      // 按优先级排序
      const priorityOrder = { 'essential': 3, 'recommended': 2, 'optional': 1 }
      recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

      return recommendations

    } catch (error) {
      console.error('Failed to get insurance recommendations:', error)
      return []
    }
  }

  /**
   * 验证金融建议的合规性
   */
  async validateFinancialAdvice(advice: any): Promise<ComplianceCheck> {
    if (!this.isInitialized) await this.initialize()

    try {
      const issues: ComplianceIssue[] = []
      const recommendations: ComplianceRecommendation[] = []

      // 检查投资建议合规性
      if (advice.type === 'investment') {
        const investmentIssues = await this.checkInvestmentCompliance(advice)
        issues.push(...investmentIssues)
      }

      // 检查税务建议合规性
      if (advice.type === 'tax') {
        const taxIssues = await this.checkTaxAdviceCompliance(advice)
        issues.push(...taxIssues)
      }

      // 检查保险建议合规性
      if (advice.type === 'insurance') {
        const insuranceIssues = await this.checkInsuranceCompliance(advice)
        issues.push(...insuranceIssues)
      }

      // 生成合规建议
      for (const issue of issues) {
        if (issue.severity === 'error') {
          recommendations.push({
            priority: 'high',
            action: 'immediate_correction',
            description: `修正合规问题: ${issue.description}`,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天内
          })
        }
      }

      const result: ComplianceCheck = {
        compliant: issues.filter(i => i.severity === 'error').length === 0,
        issues,
        recommendations,
        riskLevel: this.assessComplianceRisk(issues),
        lastChecked: new Date()
      }

      return result

    } catch (error) {
      console.error('Failed to validate financial advice:', error)
      throw error
    }
  }

  // 私有方法
  private async loadTaxRules(): Promise<void> {
    // 加载2024年德国税务规则
    const incomeTaxRule: GermanTaxRule = {
      id: 'income_tax_2024',
      name: 'Einkommensteuer 2024',
      description: '2024年德国个人所得税规则',
      applicableYear: 2024,
      category: 'income_tax',
      taxRates: [
        { minIncome: 0, maxIncome: 10908, rate: 0, description: 'Grundfreibetrag' },
        { minIncome: 10909, maxIncome: 15999, rate: 0.14, description: 'Eingangssteuersatz' },
        { minIncome: 16000, maxIncome: 62809, rate: 0.24, description: 'Progressionszone 1' },
        { minIncome: 62810, maxIncome: 277825, rate: 0.42, description: 'Spitzensteuersatz' },
        { minIncome: 277826, maxIncome: Infinity, rate: 0.45, description: 'Reichensteuer' }
      ],
      deductions: [
        {
          id: 'werbungskosten',
          name: 'Werbungskosten',
          description: '工作相关费用',
          maxAmount: 1230,
          conditions: ['employment_income'],
          category: 'work_related'
        }
      ],
      exemptions: [
        {
          id: 'grundfreibetrag',
          name: 'Grundfreibetrag',
          description: '基本免税额',
          exemptionAmount: 10908,
          applicableIncome: 'all',
          conditions: []
        }
      ],
      conditions: [],
      optimizationStrategies: []
    }

    this.taxRules.set(incomeTaxRule.id, incomeTaxRule)
  }

  private async loadInvestmentRules(): Promise<void> {
    // 加载德国投资规则
    const etfRule: GermanInvestmentRule = {
      id: 'etf_investment',
      name: 'ETF Investment',
      description: 'Exchange Traded Funds in Deutschland',
      category: 'etf',
      regulator: 'BaFin',
      regulatoryFramework: 'UCITS',
      taxTreatment: {
        capitalGainsTax: 0.26375, // 26.375% (25% + 5.5% Soli)
        dividendTax: 0.26375,
        withholdingTax: 0.05,
        taxFreeAllowance: 1000, // Sparerpauschbetrag 2024
        taxOptimizationOptions: [
          'Nutzung des Sparerpauschbetrags',
          'Verlusttöpfe nutzen',
          'Thesaurierende ETFs bevorzugen'
        ]
      },
      riskLevel: 'medium',
      suitableFor: [
        {
          type: 'balanced',
          investmentHorizon: 'long',
          riskTolerance: 'medium'
        }
      ],
      minimumInvestment: 25,
      fees: [
        {
          type: 'management',
          amount: 0.002, // 0.2% TER
          frequency: 'annual',
          description: 'Total Expense Ratio'
        }
      ]
    }

    this.investmentRules.set(etfRule.id, etfRule)
  }

  private async loadInsuranceRules(): Promise<void> {
    // 加载德国保险规则
    const healthInsuranceRule: GermanInsuranceRule = {
      id: 'health_insurance',
      name: 'Krankenversicherung',
      description: '德国健康保险',
      category: 'health',
      mandatory: true,
      legalBasis: 'SGB V',
      coverage: {
        maxCoverage: Infinity,
        deductible: 0,
        exclusions: ['cosmetic_surgery'],
        coverageArea: 'germany'
      },
      premiumStructure: {
        basePremium: 0.146, // 14.6% of income
        factors: [],
        discounts: [],
        paymentFrequency: 'monthly'
      },
      taxBenefits: [],
      recommendedFor: [
        {
          lifeStage: 'all',
          income: 'all',
          familyStatus: 'all',
          priority: 'essential',
          reasoning: 'Gesetzlich vorgeschrieben'
        }
      ]
    }

    this.insuranceRules.set(healthInsuranceRule.id, healthInsuranceRule)
  }

  private calculateIncomeTax(income: number, deductions: TaxDeduction[]): number {
    const taxRule = this.taxRules.get('income_tax_2024')
    if (!taxRule) return 0

    // 计算应税收入
    const totalDeductions = deductions.reduce((sum, d) => sum + d.maxAmount, 0)
    const taxableIncome = Math.max(0, income - totalDeductions - 10908) // 减去基本免税额

    // 计算税额
    let tax = 0
    for (const bracket of taxRule.taxRates) {
      if (taxableIncome > bracket.minIncome) {
        const taxableInBracket = Math.min(taxableIncome, bracket.maxIncome) - bracket.minIncome
        tax += taxableInBracket * bracket.rate
      }
    }

    return tax
  }

  private async getApplicableOptimizationStrategies(income: number, deductions: TaxDeduction[]): Promise<OptimizationStrategy[]> {
    // 简化实现：返回常见的税务优化策略
    return [
      {
        id: 'pension_contribution',
        name: 'Altersvorsorge erhöhen',
        description: '通过增加养老保险缴费来减税',
        potentialSavings: income * 0.02, // 估算2%的节税
        complexity: 'low',
        timeframe: 'immediate',
        requirements: ['有稳定收入'],
        risks: ['资金流动性降低']
      }
    ]
  }

  private async calculateStrategySavings(strategy: OptimizationStrategy, income: number, deductions: TaxDeduction[]): Promise<number> {
    // 简化实现：返回策略的潜在节税金额
    return strategy.potentialSavings
  }

  private isInvestmentSuitable(rule: GermanInvestmentRule, profile: InvestorProfile): boolean {
    return rule.suitableFor.some(suitable => 
      suitable.type === profile.type &&
      suitable.investmentHorizon === profile.investmentHorizon &&
      suitable.riskTolerance === profile.riskTolerance
    )
  }

  private calculateSuitabilityScore(rule: GermanInvestmentRule, profile: InvestorProfile): number {
    // 简化的适合度评分
    let score = 0.5

    const suitable = rule.suitableFor.find(s => s.type === profile.type)
    if (suitable) {
      score += 0.3
      if (suitable.investmentHorizon === profile.investmentHorizon) score += 0.2
      if (suitable.riskTolerance === profile.riskTolerance) score += 0.2
    }

    return Math.min(1, score)
  }

  private getGermanSpecificAdvantages(rule: GermanInvestmentRule): string[] {
    const advantages = []
    
    if (rule.regulator === 'BaFin') {
      advantages.push('BaFin监管，安全可靠')
    }
    
    if (rule.taxTreatment.taxFreeAllowance > 0) {
      advantages.push(`年度免税额度: €${rule.taxTreatment.taxFreeAllowance}`)
    }
    
    return advantages
  }

  private calculateDividendTax(dividend: number): number {
    const taxFreeAllowance = 1000 // 2024年免税额
    const taxableDividend = Math.max(0, dividend - taxFreeAllowance)
    return taxableDividend * 0.26375 // 26.375%
  }

  private calculateWithholdingTax(domicile: string, dividend: number): number {
    // 简化实现：根据基金注册地计算预扣税
    const withholdingRates: Record<string, number> = {
      'germany': 0,
      'ireland': 0,
      'luxembourg': 0,
      'usa': 0.15,
      'other': 0.15
    }
    
    return dividend * (withholdingRates[domicile.toLowerCase()] || 0.15)
  }

  private isInsuranceRecommended(rule: GermanInsuranceRule, situation: any): boolean {
    return rule.recommendedFor.some(rec => 
      (rec.lifeStage === 'all' || rec.lifeStage === situation.lifeStage) &&
      (rec.income === 'all' || rec.income === situation.incomeLevel) &&
      (rec.familyStatus === 'all' || rec.familyStatus === situation.familyStatus)
    )
  }

  private getInsurancePriority(rule: GermanInsuranceRule, situation: any): string {
    const recommendation = rule.recommendedFor.find(rec => 
      (rec.lifeStage === 'all' || rec.lifeStage === situation.lifeStage)
    )
    return recommendation?.priority || 'optional'
  }

  private estimateInsurancePremium(rule: GermanInsuranceRule, situation: any): number {
    // 简化的保费估算
    if (rule.category === 'health') {
      return (situation.income || 50000) * rule.premiumStructure.basePremium
    }
    return 500 // 默认年保费
  }

  private getInsuranceReasoning(rule: GermanInsuranceRule, situation: any): string {
    const recommendation = rule.recommendedFor.find(rec => 
      (rec.lifeStage === 'all' || rec.lifeStage === situation.lifeStage)
    )
    return recommendation?.reasoning || '根据您的情况推荐'
  }

  private async checkInvestmentCompliance(advice: any): Promise<ComplianceIssue[]> {
    // 简化的投资合规检查
    return []
  }

  private async checkTaxAdviceCompliance(advice: any): Promise<ComplianceIssue[]> {
    // 简化的税务建议合规检查
    return []
  }

  private async checkInsuranceCompliance(advice: any): Promise<ComplianceIssue[]> {
    // 简化的保险合规检查
    return []
  }

  private assessComplianceRisk(issues: ComplianceIssue[]): 'low' | 'medium' | 'high' {
    const errorCount = issues.filter(i => i.severity === 'error').length
    const warningCount = issues.filter(i => i.severity === 'warning').length
    
    if (errorCount > 0) return 'high'
    if (warningCount > 2) return 'medium'
    return 'low'
  }
}

// Export singleton instance
export const germanFinancialRulesEngine = GermanFinancialRulesEngine.getInstance()
