/**
 * 税收集成服务
 * 将德国税收计算集成到各种计算器中
 */

import { GermanTaxEngine } from '@/utils/tax/GermanTaxEngine'
import type { 
  GermanTaxConfiguration, 
  TaxCalculationResult,
  CalculatorTaxResult,
  InvestmentScenario
} from '@/types/GermanTaxTypes'
import type { CompoundInterestResult } from '@/types/CalculatorTypes'

/**
 * 税收集成服务类
 */
export class TaxIntegrationService {
  private taxEngine: GermanTaxEngine
  private defaultConfig: GermanTaxConfiguration

  constructor(config?: GermanTaxConfiguration) {
    this.defaultConfig = config || this.getDefaultTaxConfiguration()
    this.taxEngine = new GermanTaxEngine(this.defaultConfig)
  }

  /**
   * 获取默认税收配置
   */
  private getDefaultTaxConfiguration(): GermanTaxConfiguration {
    return {
      abgeltungssteuer: {
        enabled: true,
        rate: 0.25
      },
      solidaritaetszuschlag: {
        enabled: true,
        rate: 0.055
      },
      churchTax: {
        enabled: false,
        state: 'Nordrhein-Westfalen',
        rate: 0.09
      },
      freistellungsauftrag: {
        enabled: true,
        isMarried: false,
        totalAmount: 1000,
        usedAmount: 0,
        allocations: []
      },
      etfTeilfreistellung: {
        enabled: false,
        etfType: 'EQUITY_ETF'
      }
    }
  }

  /**
   * 更新税收配置
   */
  updateTaxConfiguration(config: Partial<GermanTaxConfiguration>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }
    this.taxEngine.updateConfiguration(this.defaultConfig)
  }

  /**
   * 计算复利投资的税收影响
   */
  calculateCompoundInterestTax(
    result: CompoundInterestResult,
    scenario?: InvestmentScenario
  ): CalculatorTaxResult {
    const capitalGains = result.totalInterest
    
    // 根据投资场景调整ETF数据
    let etfData: { gains: number; type: any } | undefined
    if (scenario?.isETF && scenario.etfType) {
      etfData = {
        gains: capitalGains,
        type: scenario.etfType
      }
    }

    // 计算税收
    const taxResult = this.taxEngine.calculateTaxes(
      capitalGains,
      etfData,
      scenario?.freistellungsauftragUsed || 0
    )

    // 计算税后结果
    const afterTaxFinalAmount = result.finalAmount - taxResult.summary.totalTaxes
    const afterTaxTotalInterest = result.totalInterest - taxResult.summary.totalTaxes

    return {
      originalResult: result,
      taxCalculation: taxResult,
      afterTaxResult: {
        finalAmount: afterTaxFinalAmount,
        totalContributions: result.totalContributions,
        totalInterest: afterTaxTotalInterest,
        effectiveRate: result.totalContributions > 0 
          ? ((afterTaxFinalAmount - result.totalContributions) / result.totalContributions) * 100 
          : 0,
        yearlyData: this.calculateYearlyAfterTaxData(result.yearlyData, taxResult)
      },
      taxImpact: {
        taxAmount: taxResult.summary.totalTaxes,
        taxRate: taxResult.summary.effectiveTaxRate,
        taxSavings: taxResult.summary.taxSavings,
        netReduction: (taxResult.summary.totalTaxes / result.finalAmount) * 100
      },
      scenario: scenario || null
    }
  }

  /**
   * 计算年度税后数据
   */
  private calculateYearlyAfterTaxData(
    yearlyData: Array<{
      year: number
      balance: number
      contribution: number
      interest: number
      totalContributions: number
      totalInterest: number
    }>,
    taxResult: TaxCalculationResult
  ) {
    return yearlyData.map((yearData, index) => {
      // 简化计算：假设税收在最后一年支付
      const isLastYear = index === yearlyData.length - 1
      const yearTax = isLastYear ? taxResult.summary.totalTaxes : 0
      
      return {
        ...yearData,
        tax: yearTax,
        afterTaxBalance: yearData.balance - yearTax,
        afterTaxInterest: yearData.totalInterest - (isLastYear ? taxResult.summary.totalTaxes : 0)
      }
    })
  }

  /**
   * 比较不同税收场景
   */
  compareTaxScenarios(
    result: CompoundInterestResult,
    scenarios: InvestmentScenario[]
  ): Array<{
    scenario: InvestmentScenario
    taxResult: CalculatorTaxResult
    ranking: number
  }> {
    const comparisons = scenarios.map(scenario => {
      const taxResult = this.calculateCompoundInterestTax(result, scenario)
      return {
        scenario,
        taxResult,
        ranking: 0 // 将在排序后设置
      }
    })

    // 按税后最终金额排序（降序）
    comparisons.sort((a, b) => 
      b.taxResult.afterTaxResult.finalAmount - a.taxResult.afterTaxResult.finalAmount
    )

    // 设置排名
    comparisons.forEach((comparison, index) => {
      comparison.ranking = index + 1
    })

    return comparisons
  }

  /**
   * 计算最优Freistellungsauftrag分配
   */
  optimizeFreistellungsauftragAllocation(
    investments: Array<{
      name: string
      expectedGains: number
      priority: number
    }>
  ): Array<{
    name: string
    expectedGains: number
    allocatedAmount: number
    taxSavings: number
  }> {
    const totalAvailable = this.taxEngine.getConfiguration().freistellungsauftrag.totalAmount
    let remainingAmount = totalAvailable

    // 按优先级排序
    const sortedInvestments = [...investments].sort((a, b) => a.priority - b.priority)
    
    return sortedInvestments.map(investment => {
      const allocatedAmount = Math.min(investment.expectedGains, remainingAmount)
      const taxSavings = allocatedAmount * 0.25 // 简化计算
      
      remainingAmount -= allocatedAmount
      
      return {
        name: investment.name,
        expectedGains: investment.expectedGains,
        allocatedAmount,
        taxSavings
      }
    })
  }

  /**
   * 计算ETF税收优势
   */
  calculateETFTaxAdvantage(
    gains: number,
    etfType: keyof typeof import('@/utils/tax/GermanTaxEngine').GERMAN_TAX_CONSTANTS.ETF_TEILFREISTELLUNG_RATES
  ): {
    withoutETF: TaxCalculationResult
    withETF: TaxCalculationResult
    advantage: {
      taxSavings: number
      percentageSavings: number
      additionalNetGains: number
    }
  } {
    // 计算无ETF优势的税收
    const withoutETF = this.taxEngine.calculateTaxes(gains)
    
    // 计算有ETF优势的税收
    const withETF = this.taxEngine.calculateTaxes(gains, { gains, type: etfType })
    
    const taxSavings = withoutETF.summary.totalTaxes - withETF.summary.totalTaxes
    const percentageSavings = withoutETF.summary.totalTaxes > 0 
      ? (taxSavings / withoutETF.summary.totalTaxes) * 100 
      : 0
    const additionalNetGains = withETF.summary.netGains - withoutETF.summary.netGains

    return {
      withoutETF,
      withETF,
      advantage: {
        taxSavings,
        percentageSavings,
        additionalNetGains
      }
    }
  }

  /**
   * 生成税收优化建议
   */
  generateTaxOptimizationSuggestions(
    result: CompoundInterestResult,
    currentScenario?: InvestmentScenario
  ): Array<{
    type: 'freistellungsauftrag' | 'etf' | 'churchTax' | 'timing'
    title: string
    description: string
    potentialSavings: number
    difficulty: 'easy' | 'medium' | 'hard'
    priority: number
  }> {
    const suggestions: Array<{
      type: 'freistellungsauftrag' | 'etf' | 'churchTax' | 'timing'
      title: string
      description: string
      potentialSavings: number
      difficulty: 'easy' | 'medium' | 'hard'
      priority: number
    }> = []

    const config = this.taxEngine.getConfiguration()
    const capitalGains = result.totalInterest

    // Freistellungsauftrag建议
    if (!config.freistellungsauftrag.enabled && capitalGains > 0) {
      const potentialSavings = Math.min(capitalGains, 1000) * 0.25
      suggestions.push({
        type: 'freistellungsauftrag',
        title: 'Freistellungsauftrag einrichten',
        description: 'Nutzen Sie Ihren jährlichen Freibetrag von 1.000€ für Kapitalerträge.',
        potentialSavings,
        difficulty: 'easy',
        priority: 1
      })
    }

    // ETF建议
    if (!config.etfTeilfreistellung.enabled && capitalGains > 1000) {
      const etfAdvantage = this.calculateETFTaxAdvantage(capitalGains, 'EQUITY_ETF')
      suggestions.push({
        type: 'etf',
        title: 'ETF-Teilfreistellung nutzen',
        description: 'Investieren Sie in ETFs um von der Teilfreistellung zu profitieren.',
        potentialSavings: etfAdvantage.advantage.taxSavings,
        difficulty: 'medium',
        priority: 2
      })
    }

    // 教会税建议
    if (config.churchTax.enabled) {
      const churchTaxSavings = capitalGains * 0.25 * 0.09 // 近似计算
      suggestions.push({
        type: 'churchTax',
        title: 'Kirchensteuer prüfen',
        description: 'Prüfen Sie, ob ein Kirchenaustritt steuerlich sinnvoll ist.',
        potentialSavings: churchTaxSavings,
        difficulty: 'hard',
        priority: 3
      })
    }

    // 按优先级和潜在节省排序
    suggestions.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return b.potentialSavings - a.potentialSavings
    })

    return suggestions
  }

  /**
   * 获取税收摘要
   */
  getTaxSummary(): ReturnType<GermanTaxEngine['getTaxSummary']> {
    return this.taxEngine.getTaxSummary()
  }

  /**
   * 验证税收配置
   */
  validateTaxConfiguration(): ReturnType<GermanTaxEngine['validateConfiguration']> {
    return this.taxEngine.validateConfiguration()
  }

  /**
   * 获取当前税收配置
   */
  getCurrentConfiguration(): GermanTaxConfiguration {
    return this.taxEngine.getConfiguration()
  }
}
