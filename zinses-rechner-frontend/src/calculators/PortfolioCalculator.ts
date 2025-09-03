/**
 * 德国投资组合分析计算器
 * 符合德国税法和投资法规
 */

import type { BaseCalculator, CalculationInput, CalculationResult } from '@/types/calculator'

// 资产类别
export type AssetClass = 'stocks' | 'bonds' | 'real_estate' | 'commodities' | 'cash' | 'crypto'

// 投资组合资产
export interface PortfolioAsset {
  assetClass: AssetClass
  allocation: number // 百分比分配
  expectedReturn: number // 预期年回报率
  volatility: number // 波动率
  germanTaxTreatment: 'abgeltungssteuer' | 'teilfreistellung' | 'steuerbefreit'
}

// 投资组合输入
export interface PortfolioInput extends CalculationInput {
  totalInvestment: number
  investmentHorizon: number // 投资期限（年）
  monthlyContribution: number
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'

  // 投资组合配置
  assets: PortfolioAsset[]

  // 德国特定参数
  investorType: 'private' | 'institutional'
  taxRate: number // 个人所得税率
  solidaritySurcharge: boolean // 团结附加税
  churchTax: boolean // 教会税

  // 重平衡设置
  rebalanceFrequency: 'monthly' | 'quarterly' | 'annually' | 'never'
  rebalanceThreshold: number // 重平衡阈值百分比

  // 费用
  managementFee: number // 管理费率
  transactionCosts: number // 交易成本
}

// 投资组合结果
export interface PortfolioResult extends CalculationResult {
  // 基本预测
  expectedFinalValue: number
  totalContributions: number
  totalReturns: number
  annualizedReturn: number

  // 风险指标
  portfolioVolatility: number
  sharpeRatio: number
  maxDrawdown: number
  valueAtRisk: number // 95%置信度的VaR

  // 德国税务分析
  grossReturns: number
  taxableGains: number
  capitalGainsTax: number // 资本利得税
  netReturnsAfterTax: number
  taxEfficiency: number

  // 资产配置分析
  assetAllocation: Array<{
    assetClass: AssetClass
    allocation: number
    expectedValue: number
    contribution: number
    risk: number
  }>

  // 情景分析
  scenarios: {
    optimistic: { finalValue: number; probability: number }
    realistic: { finalValue: number; probability: number }
    pessimistic: { finalValue: number; probability: number }
  }

  // 重平衡分析
  rebalancingImpact: {
    withRebalancing: number
    withoutRebalancing: number
    benefit: number
    costs: number
  }

  // 德国投资建议
  recommendations: Array<{
    type: 'allocation' | 'tax_optimization' | 'cost_reduction' | 'risk_adjustment'
    title: string
    description: string
    impact: number
  }>
}

/**
 * 德国投资组合分析计算器实现
 */
export class PortfolioCalculator implements BaseCalculator {
  id = 'portfolio'
  name = 'Portfolio-Analyzer'
  description = 'Analysieren Sie Ihr Anlageportfolio nach deutschem Recht'
  category = 'investment' as const
  icon = 'chart-pie'

  // 德国税务常数
  private readonly ABGELTUNGSSTEUER_RATE = 0.25 // 资本利得税
  private readonly SOLIDARITY_SURCHARGE_RATE = 0.055 // 团结附加税
  private readonly CHURCH_TAX_RATE = 0.08 // 教会税（平均）
  private readonly TEILFREISTELLUNG_RATES = {
    stocks: 0.30, // 股票基金30%免税
    mixed: 0.15,  // 混合基金15%免税
    real_estate: 0.60 // 房地产基金60%免税
  }

  async calculate(input: PortfolioInput): Promise<PortfolioResult> {
    // 验证输入
    this.validateInput(input)

    // 计算基本投资预测
    const basicProjection = this.calculateBasicProjection(input)

    // 计算风险指标
    const riskMetrics = this.calculateRiskMetrics(input)

    // 计算德国税务影响
    const taxAnalysis = this.calculateGermanTaxes(input, basicProjection.grossReturns)

    // 分析资产配置
    const assetAllocation = this.analyzeAssetAllocation(input, basicProjection.expectedFinalValue)

    // 情景分析
    const scenarios = this.performScenarioAnalysis(input)

    // 重平衡分析
    const rebalancingImpact = this.analyzeRebalancing(input)

    // 生成投资建议
    const recommendations = this.generateRecommendations(input, riskMetrics, taxAnalysis)

    return {
      // 基础CalculationResult属性
      final_amount: basicProjection.expectedFinalValue,
      total_contributions: basicProjection.totalContributions,
      total_interest: basicProjection.grossReturns,
      annual_return: basicProjection.annualizedReturn,
      yearly_breakdown: this.generateYearlyBreakdown(input, basicProjection),
      calculation_time: new Date().toISOString(),

      // 基本预测
      expectedFinalValue: basicProjection.expectedFinalValue,
      totalContributions: basicProjection.totalContributions,
      totalReturns: basicProjection.grossReturns,
      annualizedReturn: basicProjection.annualizedReturn,

      // 风险指标
      portfolioVolatility: riskMetrics.volatility,
      sharpeRatio: riskMetrics.sharpeRatio,
      maxDrawdown: riskMetrics.maxDrawdown,
      valueAtRisk: riskMetrics.valueAtRisk,

      // 德国税务分析
      grossReturns: basicProjection.grossReturns,
      taxableGains: taxAnalysis.taxableGains,
      capitalGainsTax: taxAnalysis.capitalGainsTax,
      netReturnsAfterTax: taxAnalysis.netReturns,
      taxEfficiency: taxAnalysis.efficiency,

      // 资产配置分析
      assetAllocation,

      // 情景分析
      scenarios,

      // 重平衡分析
      rebalancingImpact,

      // 德国投资建议
      recommendations
    }
  }

  /**
   * 验证输入参数
   */
  private validateInput(input: PortfolioInput): void {
    if (input.totalInvestment < 0) {
      throw new Error('Gesamtinvestition darf nicht negativ sein')
    }

    if (input.investmentHorizon < 1 || input.investmentHorizon > 50) {
      throw new Error('Anlagehorizont muss zwischen 1 und 50 Jahren liegen')
    }

    // 验证资产配置总和为100%
    const totalAllocation = input.assets.reduce((sum, asset) => sum + asset.allocation, 0)
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Gesamtallokation muss 100% betragen')
    }

    // 验证每个资产的参数
    for (const asset of input.assets) {
      if (asset.allocation < 0 || asset.allocation > 100) {
        throw new Error('Asset-Allokation muss zwischen 0% und 100% liegen')
      }

      if (asset.expectedReturn < -50 || asset.expectedReturn > 50) {
        throw new Error('Erwartete Rendite muss zwischen -50% und 50% liegen')
      }
    }
  }

  /**
   * 计算基本投资预测
   */
  private calculateBasicProjection(input: PortfolioInput): {
    expectedFinalValue: number
    totalContributions: number
    grossReturns: number
    annualizedReturn: number
  } {
    // 计算加权平均回报率
    const weightedReturn = input.assets.reduce((sum, asset) =>
      sum + (asset.expectedReturn / 100) * (asset.allocation / 100), 0
    )

    const monthlyReturn = weightedReturn / 12
    const months = input.investmentHorizon * 12

    // 计算初始投资的未来价值
    const initialInvestmentFV = input.totalInvestment * Math.pow(1 + weightedReturn, input.investmentHorizon)

    // 计算月供的未来价值
    const monthlyContributionFV = input.monthlyContribution > 0 ?
      input.monthlyContribution * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) : 0

    const expectedFinalValue = initialInvestmentFV + monthlyContributionFV
    const totalContributions = input.totalInvestment + (input.monthlyContribution * months)
    const grossReturns = expectedFinalValue - totalContributions

    // 年化回报率
    const annualizedReturn = totalContributions > 0 ?
      Math.pow(expectedFinalValue / totalContributions, 1 / input.investmentHorizon) - 1 : 0

    return {
      expectedFinalValue,
      totalContributions,
      grossReturns,
      annualizedReturn
    }
  }

  /**
   * 计算风险指标
   */
  private calculateRiskMetrics(input: PortfolioInput): {
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
    valueAtRisk: number
  } {
    // 计算投资组合波动率（简化的相关性假设）
    const weightedVolatility = input.assets.reduce((sum, asset) =>
      sum + Math.pow(asset.volatility / 100 * asset.allocation / 100, 2), 0
    )
    const portfolioVolatility = Math.sqrt(weightedVolatility) * 100

    // 计算夏普比率（假设无风险利率2%）
    const riskFreeRate = 0.02
    const weightedReturn = input.assets.reduce((sum, asset) =>
      sum + (asset.expectedReturn / 100) * (asset.allocation / 100), 0
    )
    const sharpeRatio = (weightedReturn - riskFreeRate) / (portfolioVolatility / 100)

    // 估算最大回撤（基于波动率）
    const maxDrawdown = portfolioVolatility * 2 // 简化估算

    // 计算VaR（95%置信度）
    const valueAtRisk = input.totalInvestment * portfolioVolatility / 100 * 1.645 // 95%置信度

    return {
      volatility: portfolioVolatility,
      sharpeRatio,
      maxDrawdown,
      valueAtRisk
    }
  }

  /**
   * 计算德国税务影响
   */
  private calculateGermanTaxes(input: PortfolioInput, grossReturns: number): {
    taxableGains: number
    capitalGainsTax: number
    netReturns: number
    efficiency: number
  } {
    const totalTax = 0
    let taxableGains = 0

    // 按资产类别计算税务
    for (const asset of input.assets) {
      const assetReturns = grossReturns * (asset.allocation / 100)
      let assetTaxableGains = assetReturns

      // 应用部分免税（Teilfreistellung）
      if (asset.germanTaxTreatment === 'teilfreistellung') {
        if (asset.assetClass === 'stocks') {
          assetTaxableGains *= (1 - this.TEILFREISTELLUNG_RATES.stocks)
        } else if (asset.assetClass === 'real_estate') {
          assetTaxableGains *= (1 - this.TEILFREISTELLUNG_RATES.real_estate)
        }
      } else if (asset.germanTaxTreatment === 'steuerbefreit') {
        assetTaxableGains = 0
      }

      taxableGains += assetTaxableGains
    }

    // 计算资本利得税
    let capitalGainsTax = taxableGains * this.ABGELTUNGSSTEUER_RATE

    // 添加团结附加税
    if (input.solidaritySurcharge) {
      capitalGainsTax += capitalGainsTax * this.SOLIDARITY_SURCHARGE_RATE
    }

    // 添加教会税
    if (input.churchTax) {
      capitalGainsTax += capitalGainsTax * this.CHURCH_TAX_RATE
    }

    const netReturns = grossReturns - capitalGainsTax
    const efficiency = grossReturns > 0 ? netReturns / grossReturns : 1

    return {
      taxableGains,
      capitalGainsTax,
      netReturns,
      efficiency
    }
  }

  /**
   * 分析资产配置
   */
  private analyzeAssetAllocation(input: PortfolioInput, totalValue: number): Array<{
    assetClass: AssetClass
    allocation: number
    expectedValue: number
    contribution: number
    risk: number
  }> {
    return input.assets.map(asset => ({
      assetClass: asset.assetClass,
      allocation: asset.allocation,
      expectedValue: totalValue * (asset.allocation / 100),
      contribution: (asset.expectedReturn / 100) * (asset.allocation / 100),
      risk: asset.volatility
    }))
  }

  /**
   * 情景分析
   */
  private performScenarioAnalysis(input: PortfolioInput): {
    optimistic: { finalValue: number; probability: number }
    realistic: { finalValue: number; probability: number }
    pessimistic: { finalValue: number; probability: number }
  } {
    const baseProjection = this.calculateBasicProjection(input)
    const baseValue = baseProjection.expectedFinalValue

    // 基于投资组合波动率的情景分析
    const portfolioVolatility = this.calculateRiskMetrics(input).volatility / 100
    const timeAdjustedVolatility = portfolioVolatility * Math.sqrt(input.investmentHorizon)

    return {
      optimistic: {
        finalValue: baseValue * (1 + timeAdjustedVolatility),
        probability: 0.15
      },
      realistic: {
        finalValue: baseValue,
        probability: 0.70
      },
      pessimistic: {
        finalValue: baseValue * (1 - timeAdjustedVolatility),
        probability: 0.15
      }
    }
  }

  /**
   * 重平衡分析
   */
  private analyzeRebalancing(input: PortfolioInput): {
    withRebalancing: number
    withoutRebalancing: number
    benefit: number
    costs: number
  } {
    const baseProjection = this.calculateBasicProjection(input)
    const withRebalancing = baseProjection.expectedFinalValue

    // 估算不重平衡的影响（通常降低5-15%的效率）
    const driftPenalty = input.rebalanceFrequency === 'never' ? 0.10 : 0.02
    const withoutRebalancing = withRebalancing * (1 - driftPenalty)

    const benefit = withRebalancing - withoutRebalancing

    // 计算重平衡成本
    const rebalanceFrequency = {
      monthly: 12,
      quarterly: 4,
      annually: 1,
      never: 0
    }[input.rebalanceFrequency]

    const totalRebalances = rebalanceFrequency * input.investmentHorizon
    const costs = totalRebalances * input.transactionCosts * input.totalInvestment

    return {
      withRebalancing,
      withoutRebalancing,
      benefit,
      costs
    }
  }

  /**
   * 生成投资建议
   */
  private generateRecommendations(
    input: PortfolioInput,
    riskMetrics: any,
    taxAnalysis: any
  ): Array<{
    type: 'allocation' | 'tax_optimization' | 'cost_reduction' | 'risk_adjustment'
    title: string
    description: string
    impact: number
  }> {
    const recommendations = []

    // 资产配置建议
    const stockAllocation = input.assets.find(a => a.assetClass === 'stocks')?.allocation || 0
    const ageBasedStockAllocation = 100 - input.investmentHorizon // 简化的年龄规则

    if (Math.abs(stockAllocation - ageBasedStockAllocation) > 20) {
      recommendations.push({
        type: 'allocation' as const,
        title: 'Aktienquote anpassen',
        description: `Für Ihren Anlagehorizont wird eine Aktienquote von ca. ${ageBasedStockAllocation}% empfohlen.`,
        impact: Math.abs(stockAllocation - ageBasedStockAllocation) * 100
      })
    }

    // 税务优化建议
    if (taxAnalysis.efficiency < 0.8) {
      recommendations.push({
        type: 'tax_optimization' as const,
        title: 'Steueroptimierung',
        description: 'Nutzen Sie thesaurierende ETFs und den Sparerpauschbetrag optimal.',
        impact: (1 - taxAnalysis.efficiency) * 1000
      })
    }

    // 成本优化建议
    if (input.managementFee > 0.5) {
      recommendations.push({
        type: 'cost_reduction' as const,
        title: 'Kosten reduzieren',
        description: 'Wechseln Sie zu kostengünstigeren ETFs (TER < 0,5%).',
        impact: input.managementFee * input.totalInvestment
      })
    }

    // 风险调整建议
    if (riskMetrics.volatility > 20 && input.riskTolerance === 'conservative') {
      recommendations.push({
        type: 'risk_adjustment' as const,
        title: 'Risiko reduzieren',
        description: 'Erhöhen Sie den Anleihenanteil für mehr Stabilität.',
        impact: riskMetrics.volatility * 50
      })
    }

    return recommendations.sort((a, b) => b.impact - a.impact).slice(0, 5)
  }

  /**
   * 生成年度分解数据
   */
  private generateYearlyBreakdown(input: PortfolioInput, projection: any): Array<{
    year: number
    start_amount: number
    contributions: number
    end_amount: number
    interest: number
    growth_rate: number
  }> {
    const breakdown = []
    const weightedReturn = input.assets.reduce((sum, asset) =>
      sum + (asset.expectedReturn / 100) * (asset.allocation / 100), 0
    )

    let currentValue = input.totalInvestment

    for (let year = 1; year <= input.investmentHorizon; year++) {
      const startAmount = currentValue
      const contributions = input.monthlyContribution * 12
      const interest = startAmount * weightedReturn
      const endAmount = startAmount + contributions + interest

      breakdown.push({
        year: new Date().getFullYear() + year,
        start_amount: startAmount,
        contributions,
        end_amount: endAmount,
        interest,
        growth_rate: weightedReturn
      })

      currentValue = endAmount
    }

    return breakdown
  }

  /**
   * 获取表单配置
   */
  getFormSchema() {
    return {
      title: 'Portfolio-Analyzer',
      description: 'Analysieren Sie Ihr Anlageportfolio nach deutschem Recht',
      sections: [
        {
          title: 'Grunddaten',
          fields: [
            { name: 'totalInvestment', label: 'Gesamtinvestition', type: 'currency', required: true },
            { name: 'investmentHorizon', label: 'Anlagehorizont (Jahre)', type: 'number', required: true, min: 1, max: 50 },
            { name: 'monthlyContribution', label: 'Monatliche Einzahlung', type: 'currency', defaultValue: 0 },
            { name: 'riskTolerance', label: 'Risikotoleranz', type: 'select', options: [
              { value: 'conservative', label: 'Konservativ' },
              { value: 'moderate', label: 'Moderat' },
              { value: 'aggressive', label: 'Aggressiv' }
            ], required: true }
          ]
        },
        {
          title: 'Asset-Allokation',
          fields: [
            { name: 'stockAllocation', label: 'Aktien (%)', type: 'percentage', defaultValue: 60 },
            { name: 'bondAllocation', label: 'Anleihen (%)', type: 'percentage', defaultValue: 30 },
            { name: 'realEstateAllocation', label: 'Immobilien (%)', type: 'percentage', defaultValue: 10 },
            { name: 'cashAllocation', label: 'Cash (%)', type: 'percentage', defaultValue: 0 }
          ]
        },
        {
          title: 'Deutsche Steueroptionen',
          fields: [
            { name: 'taxRate', label: 'Persönlicher Steuersatz (%)', type: 'percentage', defaultValue: 25 },
            { name: 'solidaritySurcharge', label: 'Solidaritätszuschlag', type: 'checkbox', defaultValue: true },
            { name: 'churchTax', label: 'Kirchensteuer', type: 'checkbox', defaultValue: false }
          ]
        }
      ]
    }
  }


}

// 导出计算器实例
export const portfolioCalculator = new PortfolioCalculator()
