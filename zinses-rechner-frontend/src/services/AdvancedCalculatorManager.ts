/**
 * 高级计算器管理器
 * 实现投资组合分析、贷款比较、退休规划等高级金融计算功能
 */

import { ref, reactive } from 'vue'
import BigNumber from 'bignumber.js'

// 投资组合分析接口
export interface PortfolioAnalysis {
  assets: Array<{
    name: string
    symbol: string
    allocation: number // 百分比
    expectedReturn: number // 年化收益率
    risk: number // 风险系数
    correlation: number // 与其他资产的相关性
  }>
  totalValue: number
  expectedReturn: number
  totalRisk: number
  sharpeRatio: number
  diversificationBenefit: number
}

// 贷款比较接口
export interface LoanComparison {
  loans: Array<{
    id: string
    name: string
    principal: number
    interestRate: number
    term: number // 年数
    type: 'fixed' | 'variable' | 'interest-only'
    fees: {
      origination: number
      monthly: number
      prepayment: number
    }
    monthlyPayment: number
    totalInterest: number
    totalCost: number
    apr: number // 年化百分率
  }>
  bestOption: string
  savings: number
}

// 退休规划接口
export interface RetirementPlan {
  currentAge: number
  retirementAge: number
  currentSavings: number
  monthlyContribution: number
  expectedReturn: number
  inflationRate: number
  desiredIncome: number
  projectedSavings: number
  monthlyIncomeAtRetirement: number
  shortfall: number
  recommendedContribution: number
  scenarios: Array<{
    name: string
    projectedValue: number
    monthlyIncome: number
    probability: number
  }>
}

// 投资策略接口
export interface InvestmentStrategy {
  name: string
  description: string
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  expectedReturn: number
  volatility: number
  allocation: {
    stocks: number
    bonds: number
    cash: number
    alternatives: number
  }
  suitableFor: string[]
  pros: string[]
  cons: string[]
}

// 税务优化接口
export interface TaxOptimization {
  currentTaxBracket: number
  taxableIncome: number
  deductions: {
    standard: number
    itemized: number
    retirement: number
    charitable: number
  }
  optimizedTax: number
  savings: number
  recommendations: Array<{
    strategy: string
    potentialSavings: number
    description: string
  }>
}

/**
 * 高级计算器管理器类
 */
export class AdvancedCalculatorManager {
  private static instance: AdvancedCalculatorManager

  // 计算历史
  private calculationHistory = reactive<Array<{
    id: string
    type: string
    timestamp: Date
    inputs: any
    results: any
  }>>([])

  // 投资策略库
  private investmentStrategies: InvestmentStrategy[] = [
    {
      name: 'Konservative Strategie',
      description: 'Niedrige Risiko, stabile Renditen',
      riskLevel: 'conservative',
      expectedReturn: 4.5,
      volatility: 8,
      allocation: { stocks: 30, bonds: 60, cash: 10, alternatives: 0 },
      suitableFor: ['Rentner', 'Risikoaverse Anleger', 'Kurzfristige Ziele'],
      pros: ['Geringes Risiko', 'Stabile Erträge', 'Kapitalerhalt'],
      cons: ['Niedrige Renditen', 'Inflationsrisiko', 'Begrenzte Wachstumschancen']
    },
    {
      name: 'Ausgewogene Strategie',
      description: 'Ausgewogenes Verhältnis von Risiko und Rendite',
      riskLevel: 'moderate',
      expectedReturn: 7,
      volatility: 12,
      allocation: { stocks: 60, bonds: 30, cash: 5, alternatives: 5 },
      suitableFor: ['Mittelfristige Ziele', 'Durchschnittliche Risikobereitschaft'],
      pros: ['Ausgewogenes Risiko-Rendite-Verhältnis', 'Diversifikation', 'Flexibilität'],
      cons: ['Moderate Volatilität', 'Kompromiss bei Renditen']
    },
    {
      name: 'Wachstumsstrategie',
      description: 'Hohe Renditen bei höherem Risiko',
      riskLevel: 'aggressive',
      expectedReturn: 9.5,
      volatility: 18,
      allocation: { stocks: 80, bonds: 10, cash: 0, alternatives: 10 },
      suitableFor: ['Junge Anleger', 'Langfristige Ziele', 'Hohe Risikobereitschaft'],
      pros: ['Hohe Renditen', 'Langfristiges Wachstum', 'Inflationsschutz'],
      cons: ['Hohe Volatilität', 'Verlustrisiko', 'Emotionale Belastung']
    }
  ]

  // 状态
  public readonly isCalculating = ref(false)
  public readonly lastCalculation = ref<Date | null>(null)

  public static getInstance(): AdvancedCalculatorManager {
    if (!AdvancedCalculatorManager.instance) {
      AdvancedCalculatorManager.instance = new AdvancedCalculatorManager()
    }
    return AdvancedCalculatorManager.instance
  }

  constructor() {
    console.log('🧮 Advanced calculator manager initialized')
  }

  /**
   * 投资组合分析
   */
  public analyzePortfolio(assets: PortfolioAnalysis['assets'], totalValue: number): PortfolioAnalysis {
    this.isCalculating.value = true

    try {
      // 验证资产配置总和为100%
      const totalAllocation = assets.reduce((sum, asset) => sum + asset.allocation, 0)
      if (Math.abs(totalAllocation - 100) > 0.01) {
        throw new Error('Asset allocation must sum to 100%')
      }

      // 计算预期收益率
      const expectedReturn = assets.reduce((sum, asset) => 
        sum + (asset.allocation / 100) * asset.expectedReturn, 0
      )

      // 计算投资组合风险（简化的方差计算）
      const portfolioVariance = assets.reduce((sum, asset) => {
        const weight = asset.allocation / 100
        return sum + Math.pow(weight * asset.risk, 2)
      }, 0)

      // 考虑相关性的风险调整（简化）
      const correlationAdjustment = this.calculateCorrelationAdjustment(assets)
      const totalRisk = Math.sqrt(portfolioVariance * correlationAdjustment)

      // 计算夏普比率（假设无风险利率为2%）
      const riskFreeRate = 2
      const sharpeRatio = (expectedReturn - riskFreeRate) / totalRisk

      // 计算多样化收益
      const diversificationBenefit = this.calculateDiversificationBenefit(assets)

      const result: PortfolioAnalysis = {
        assets,
        totalValue,
        expectedReturn,
        totalRisk,
        sharpeRatio,
        diversificationBenefit
      }

      this.saveCalculation('portfolio-analysis', { assets, totalValue }, result)
      return result

    } finally {
      this.isCalculating.value = false
      this.lastCalculation.value = new Date()
    }
  }

  /**
   * 贷款比较分析
   */
  public compareLoans(loanInputs: Array<{
    name: string
    principal: number
    interestRate: number
    term: number
    type: 'fixed' | 'variable' | 'interest-only'
    fees: { origination: number; monthly: number; prepayment: number }
  }>): LoanComparison {
    this.isCalculating.value = true

    try {
      const loans = loanInputs.map((input, index) => {
        const monthlyRate = input.interestRate / 100 / 12
        const numPayments = input.term * 12

        let monthlyPayment: number
        let totalInterest: number

        if (input.type === 'interest-only') {
          monthlyPayment = input.principal * monthlyRate
          totalInterest = monthlyPayment * numPayments
        } else {
          // 标准摊销贷款
          monthlyPayment = input.principal * 
            (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
            (Math.pow(1 + monthlyRate, numPayments) - 1)
          totalInterest = (monthlyPayment * numPayments) - input.principal
        }

        const totalFees = input.fees.origination + (input.fees.monthly * numPayments)
        const totalCost = input.principal + totalInterest + totalFees

        // 计算APR（年化百分率）
        const apr = this.calculateAPR(input.principal, monthlyPayment, numPayments, input.fees.origination)

        return {
          id: `loan-${index}`,
          name: input.name,
          principal: input.principal,
          interestRate: input.interestRate,
          term: input.term,
          type: input.type,
          fees: input.fees,
          monthlyPayment,
          totalInterest,
          totalCost,
          apr
        }
      })

      // 找到最佳选项（总成本最低）
      const bestLoan = loans.reduce((best, current) => 
        current.totalCost < best.totalCost ? current : best
      )

      const worstLoan = loans.reduce((worst, current) => 
        current.totalCost > worst.totalCost ? current : worst
      )

      const savings = worstLoan.totalCost - bestLoan.totalCost

      const result: LoanComparison = {
        loans,
        bestOption: bestLoan.id,
        savings
      }

      this.saveCalculation('loan-comparison', loanInputs, result)
      return result

    } finally {
      this.isCalculating.value = false
      this.lastCalculation.value = new Date()
    }
  }

  /**
   * 退休规划计算
   */
  public calculateRetirementPlan(inputs: {
    currentAge: number
    retirementAge: number
    currentSavings: number
    monthlyContribution: number
    expectedReturn: number
    inflationRate: number
    desiredIncome: number
  }): RetirementPlan {
    this.isCalculating.value = true

    try {
      const yearsToRetirement = inputs.retirementAge - inputs.currentAge
      const monthsToRetirement = yearsToRetirement * 12
      const monthlyReturn = inputs.expectedReturn / 100 / 12
      const monthlyInflation = inputs.inflationRate / 100 / 12

      // 计算退休时的储蓄总额
      const futureValueCurrentSavings = inputs.currentSavings * 
        Math.pow(1 + monthlyReturn, monthsToRetirement)

      const futureValueContributions = inputs.monthlyContribution * 
        ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn)

      const projectedSavings = futureValueCurrentSavings + futureValueContributions

      // 计算退休后的月收入（4%规则）
      const monthlyIncomeAtRetirement = projectedSavings * 0.04 / 12

      // 调整通胀后的期望收入
      const inflationAdjustedDesiredIncome = inputs.desiredIncome * 
        Math.pow(1 + inputs.inflationRate / 100, yearsToRetirement)

      const shortfall = Math.max(0, inflationAdjustedDesiredIncome - monthlyIncomeAtRetirement)

      // 计算推荐的月供款
      let recommendedContribution = inputs.monthlyContribution
      if (shortfall > 0) {
        const additionalSavingsNeeded = shortfall * 12 / 0.04
        const additionalMonthlyContribution = additionalSavingsNeeded / 
          ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn)
        recommendedContribution = inputs.monthlyContribution + additionalMonthlyContribution
      }

      // 生成不同场景
      const scenarios = [
        {
          name: 'Konservatives Szenario',
          projectedValue: projectedSavings * 0.8,
          monthlyIncome: monthlyIncomeAtRetirement * 0.8,
          probability: 90
        },
        {
          name: 'Erwartetes Szenario',
          projectedValue: projectedSavings,
          monthlyIncome: monthlyIncomeAtRetirement,
          probability: 50
        },
        {
          name: 'Optimistisches Szenario',
          projectedValue: projectedSavings * 1.3,
          monthlyIncome: monthlyIncomeAtRetirement * 1.3,
          probability: 10
        }
      ]

      const result: RetirementPlan = {
        currentAge: inputs.currentAge,
        retirementAge: inputs.retirementAge,
        currentSavings: inputs.currentSavings,
        monthlyContribution: inputs.monthlyContribution,
        expectedReturn: inputs.expectedReturn,
        inflationRate: inputs.inflationRate,
        desiredIncome: inputs.desiredIncome,
        projectedSavings,
        monthlyIncomeAtRetirement,
        shortfall,
        recommendedContribution,
        scenarios
      }

      this.saveCalculation('retirement-planning', inputs, result)
      return result

    } finally {
      this.isCalculating.value = false
      this.lastCalculation.value = new Date()
    }
  }

  /**
   * 税务优化计算
   */
  public optimizeTaxes(inputs: {
    income: number
    currentDeductions: number
    retirementContributions: number
    charitableGiving: number
    state: string
  }): TaxOptimization {
    this.isCalculating.value = true

    try {
      // 德国税率表（简化）
      const taxBrackets = [
        { min: 0, max: 9744, rate: 0 },
        { min: 9745, max: 57051, rate: 14 },
        { min: 57052, max: 270500, rate: 42 },
        { min: 270501, max: Infinity, rate: 45 }
      ]

      const currentTaxBracket = this.getTaxBracket(inputs.income, taxBrackets)
      const standardDeduction = 9744 // 德国基本免税额
      
      const deductions = {
        standard: standardDeduction,
        itemized: inputs.currentDeductions,
        retirement: inputs.retirementContributions,
        charitable: inputs.charitableGiving
      }

      const totalDeductions = Math.max(deductions.standard, 
        deductions.itemized + deductions.retirement + deductions.charitable)
      
      const taxableIncome = Math.max(0, inputs.income - totalDeductions)
      const currentTax = this.calculateTax(taxableIncome, taxBrackets)

      // 优化建议
      const recommendations = [
        {
          strategy: 'Erhöhung der Altersvorsorgebeiträge',
          potentialSavings: Math.min(inputs.income * 0.04, 25000) * currentTaxBracket / 100,
          description: 'Maximieren Sie Ihre steuerlich begünstigten Altersvorsorgebeiträge'
        },
        {
          strategy: 'Steueroptimierte Geldanlage',
          potentialSavings: inputs.income * 0.02 * currentTaxBracket / 100,
          description: 'Nutzen Sie steueroptimierte Anlageprodukte'
        },
        {
          strategy: 'Werbungskosten optimieren',
          potentialSavings: 2000 * currentTaxBracket / 100,
          description: 'Sammeln Sie alle berufsbedingten Ausgaben'
        }
      ]

      const optimizedTax = currentTax - recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0)
      const savings = currentTax - optimizedTax

      const result: TaxOptimization = {
        currentTaxBracket,
        taxableIncome,
        deductions,
        optimizedTax,
        savings,
        recommendations
      }

      this.saveCalculation('tax-optimization', inputs, result)
      return result

    } finally {
      this.isCalculating.value = false
      this.lastCalculation.value = new Date()
    }
  }

  /**
   * 获取投资策略建议
   */
  public getInvestmentStrategies(riskTolerance?: 'conservative' | 'moderate' | 'aggressive'): InvestmentStrategy[] {
    if (riskTolerance) {
      return this.investmentStrategies.filter(strategy => strategy.riskLevel === riskTolerance)
    }
    return [...this.investmentStrategies]
  }

  /**
   * 获取计算历史
   */
  public getCalculationHistory(): typeof this.calculationHistory {
    return this.calculationHistory
  }

  /**
   * 清除计算历史
   */
  public clearHistory(): void {
    this.calculationHistory.splice(0)
  }

  // 私有方法

  /**
   * 计算相关性调整
   */
  private calculateCorrelationAdjustment(assets: PortfolioAnalysis['assets']): number {
    // 简化的相关性计算
    const avgCorrelation = assets.reduce((sum, asset) => sum + asset.correlation, 0) / assets.length
    return 1 - (avgCorrelation * 0.3) // 相关性越高，风险降低效果越小
  }

  /**
   * 计算多样化收益
   */
  private calculateDiversificationBenefit(assets: PortfolioAnalysis['assets']): number {
    // 基于资产数量和配置均匀程度的多样化收益
    const numAssets = assets.length
    const allocationVariance = this.calculateAllocationVariance(assets)
    return (numAssets * 0.5) - (allocationVariance * 2)
  }

  /**
   * 计算配置方差
   */
  private calculateAllocationVariance(assets: PortfolioAnalysis['assets']): number {
    const avgAllocation = 100 / assets.length
    const variance = assets.reduce((sum, asset) => 
      sum + Math.pow(asset.allocation - avgAllocation, 2), 0
    ) / assets.length
    return variance / 100
  }

  /**
   * 计算APR
   */
  private calculateAPR(principal: number, monthlyPayment: number, numPayments: number, originationFee: number): number {
    // 简化的APR计算
    const totalInterest = (monthlyPayment * numPayments) - principal
    const totalCost = totalInterest + originationFee
    return (totalCost / principal / (numPayments / 12)) * 100
  }

  /**
   * 获取税率等级
   */
  private getTaxBracket(income: number, brackets: Array<{min: number, max: number, rate: number}>): number {
    for (const bracket of brackets) {
      if (income >= bracket.min && income <= bracket.max) {
        return bracket.rate
      }
    }
    return brackets[brackets.length - 1].rate
  }

  /**
   * 计算税额
   */
  private calculateTax(income: number, brackets: Array<{min: number, max: number, rate: number}>): number {
    let tax = 0
    let remainingIncome = income

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break

      const taxableInThisBracket = Math.min(remainingIncome, bracket.max - bracket.min + 1)
      tax += taxableInThisBracket * bracket.rate / 100
      remainingIncome -= taxableInThisBracket
    }

    return tax
  }

  /**
   * 保存计算结果
   */
  private saveCalculation(type: string, inputs: any, results: any): void {
    this.calculationHistory.unshift({
      id: `calc-${Date.now()}`,
      type,
      timestamp: new Date(),
      inputs,
      results
    })

    // 保持历史记录在合理范围内
    if (this.calculationHistory.length > 50) {
      this.calculationHistory.splice(50)
    }
  }
}

// 导出单例实例
export const advancedCalculatorManager = AdvancedCalculatorManager.getInstance()

// 便捷的组合式API
export function useAdvancedCalculator() {
  const manager = AdvancedCalculatorManager.getInstance()
  
  return {
    // 状态
    isCalculating: manager.isCalculating,
    lastCalculation: manager.lastCalculation,
    
    // 方法
    analyzePortfolio: manager.analyzePortfolio.bind(manager),
    compareLoans: manager.compareLoans.bind(manager),
    calculateRetirementPlan: manager.calculateRetirementPlan.bind(manager),
    optimizeTaxes: manager.optimizeTaxes.bind(manager),
    getInvestmentStrategies: manager.getInvestmentStrategies.bind(manager),
    getCalculationHistory: manager.getCalculationHistory.bind(manager),
    clearHistory: manager.clearHistory.bind(manager)
  }
}
