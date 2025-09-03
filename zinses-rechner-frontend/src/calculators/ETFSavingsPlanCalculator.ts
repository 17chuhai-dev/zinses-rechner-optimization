/**
 * 德国ETF定投计划计算器 (ETF-Sparplan-Rechner)
 * 符合德国ETF投资和税收法规
 */

import type { BaseCalculator, CalculationInput, CalculationResult, ValidationResult } from '@/types/calculator'

// ETF定投输入接口
export interface ETFSavingsPlanInput extends CalculationInput {
  monthlyInvestment: number // 月投资金额
  investmentPeriod: number // 投资期限（年）
  expectedAnnualReturn: number // 预期年收益率
  volatility: number // 波动率

  // ETF特定参数
  etfType: 'world' | 'europe' | 'emerging' | 'sector' | 'bond' // ETF类型
  ter: number // 总费用率 (Total Expense Ratio)
  distributionType: 'accumulating' | 'distributing' // 分配类型

  // 德国税收参数
  teilfreistellung: number // 部分免税比例
  freistellungsauftrag: number // 免税额度
  taxRate: number // 个人所得税率
  solidaritySurcharge: boolean // 团结附加税
  churchTax: boolean // 教会税

  // 投资策略
  rebalancingStrategy: 'none' | 'monthly' | 'quarterly' | 'annually'
  costAveraging: boolean // 成本平均法

  // 风险管理
  stopLossThreshold: number // 止损阈值
  takeProfitThreshold: number // 止盈阈值

  // 通胀调整
  inflationRate: number
  adjustForInflation: boolean
}

// ETF定投结果接口
export interface ETFSavingsPlanResult extends CalculationResult {
  // 基本预测
  finalValue: number // 最终价值
  totalInvestment: number // 总投资额
  totalReturn: number // 总收益
  annualizedReturn: number // 年化收益率

  // 费用分析
  totalFees: number // 总费用
  feeImpact: number // 费用对收益的影响

  // 税收分析
  totalTaxPaid: number // 总税款
  netFinalValue: number // 税后最终价值
  netReturn: number // 净收益

  // 风险分析
  volatilityImpact: number // 波动性影响
  worstCaseScenario: number // 最坏情况
  bestCaseScenario: number // 最好情况

  // 通胀调整
  realValue: number // 实际价值
  purchasingPowerGain: number // 购买力增长

  // 年度明细
  yearlyBreakdown: Array<{
    year: number
    investment: number
    marketValue: number
    fees: number
    taxes: number
    netValue: number
    realValue: number
    cumulativeReturn: number
  }>

  // 德国特定信息
  taxOptimization: {
    teilfreistellungBenefit: number
    freistellungsauftragUsed: number
    recommendations: string[]
  }

  // 风险评估
  riskLevel: 'niedrig' | 'mittel' | 'hoch' | 'sehr_hoch'
  diversificationScore: number

  // 建议和替代方案
  recommendations: string[]
  alternativeETFs: Array<{
    name: string
    ter: number
    expectedReturn: number
    riskLevel: string
    description: string
  }>
}

/**
 * ETF定投计算器实现
 */
export class ETFSavingsPlanCalculator implements BaseCalculator {
  id = 'etf-savings-plan'
  name = 'ETF-Sparplan-Rechner'
  description = 'Berechnen Sie Ihre ETF-Sparplan-Entwicklung mit deutschen Steueraspekten'
  category = 'investment' as const
  version = '1.0.0'

  // 德国税率常数
  private readonly ABGELTUNGSSTEUER_RATE = 0.25 // 25% 资本利得税
  private readonly SOLIDARITY_SURCHARGE_RATE = 0.055 // 5.5% 团结附加税
  private readonly CHURCH_TAX_RATE = 0.08 // 8% 教会税

  // 部分免税比例
  private readonly TEILFREISTELLUNG_RATES = {
    world: 0.30, // 30% 股票ETF
    europe: 0.30, // 30% 股票ETF
    emerging: 0.30, // 30% 股票ETF
    sector: 0.30, // 30% 股票ETF
    bond: 0.15 // 15% 债券ETF
  }

  formSchema = {
    title: 'ETF-Sparplan-Rechner',
    description: 'Planen Sie Ihre ETF-Anlage mit deutschen Steuervorteilen',
    fields: [
      {
        name: 'monthlyInvestment',
        label: 'Monatliche Sparrate (€)',
        type: 'currency',
        required: true,
        min: 25,
        max: 10000,
        defaultValue: 500
      },
      {
        name: 'investmentPeriod',
        label: 'Anlagezeitraum (Jahre)',
        type: 'number',
        required: true,
        min: 1,
        max: 50,
        defaultValue: 15
      },
      {
        name: 'expectedAnnualReturn',
        label: 'Erwartete jährliche Rendite (%)',
        type: 'percentage',
        required: true,
        min: -10,
        max: 20,
        step: 0.1,
        defaultValue: 7.0
      },
      {
        name: 'volatility',
        label: 'Volatilität (%)',
        type: 'percentage',
        min: 5,
        max: 50,
        step: 0.1,
        defaultValue: 15.0,
        help: 'Schwankungsbreite der jährlichen Renditen'
      },
      {
        name: 'etfType',
        label: 'ETF-Typ',
        type: 'select',
        required: true,
        options: [
          { value: 'world', label: 'Welt-ETF (MSCI World)' },
          { value: 'europe', label: 'Europa-ETF (STOXX Europe 600)' },
          { value: 'emerging', label: 'Schwellenländer-ETF (MSCI EM)' },
          { value: 'sector', label: 'Sektor-ETF (Technologie, etc.)' },
          { value: 'bond', label: 'Anleihen-ETF' }
        ],
        defaultValue: 'world'
      },
      {
        name: 'ter',
        label: 'Gesamtkostenquote - TER (%)',
        type: 'percentage',
        min: 0.05,
        max: 2.0,
        step: 0.01,
        defaultValue: 0.20,
        help: 'Jährliche Verwaltungskosten des ETF'
      },
      {
        name: 'distributionType',
        label: 'Ausschüttungsart',
        type: 'select',
        required: true,
        options: [
          { value: 'accumulating', label: 'Thesaurierend (reinvestierend)' },
          { value: 'distributing', label: 'Ausschüttend' }
        ],
        defaultValue: 'accumulating'
      },
      {
        name: 'freistellungsauftrag',
        label: 'Freistellungsauftrag (€)',
        type: 'currency',
        min: 0,
        max: 2000,
        defaultValue: 1000,
        help: 'Bis zu €1.000 (Alleinstehende) oder €2.000 (Verheiratete) steuerfrei'
      },
      {
        name: 'inflationRate',
        label: 'Erwartete Inflation (%)',
        type: 'percentage',
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 2.0
      },
      {
        name: 'adjustForInflation',
        label: 'Inflation berücksichtigen',
        type: 'checkbox',
        defaultValue: true
      },
      {
        name: 'costAveraging',
        label: 'Cost-Average-Effekt nutzen',
        type: 'checkbox',
        defaultValue: true,
        help: 'Regelmäßige Käufe glätten Kursschwankungen'
      }
    ]
  }

  resultConfig = {
    primaryMetrics: [
      {
        key: 'finalValue',
        label: 'Endwert',
        format: 'currency',
        highlight: true
      },
      {
        key: 'totalReturn',
        label: 'Gesamtrendite',
        format: 'currency'
      },
      {
        key: 'netFinalValue',
        label: 'Nach Steuern',
        format: 'currency'
      },
      {
        key: 'annualizedReturn',
        label: 'Jährliche Rendite',
        format: 'percentage'
      },
      {
        key: 'realValue',
        label: 'Kaufkraft (inflationsbereinigt)',
        format: 'currency'
      }
    ],
    charts: [
      {
        type: 'line',
        title: 'Wertentwicklung',
        dataKeys: ['investment', 'marketValue', 'netValue', 'realValue']
      },
      {
        type: 'pie',
        title: 'Kostenaufschlüsselung',
        dataKeys: ['netReturn', 'totalFees', 'totalTaxPaid']
      }
    ],
    breakdown: {
      title: 'Jährliche Entwicklung',
      columns: [
        { key: 'year', label: 'Jahr' },
        { key: 'investment', label: 'Einzahlung', format: 'currency' },
        { key: 'marketValue', label: 'Marktwert', format: 'currency' },
        { key: 'fees', label: 'Kosten', format: 'currency' },
        { key: 'taxes', label: 'Steuern', format: 'currency' },
        { key: 'netValue', label: 'Nettowert', format: 'currency' },
        { key: 'cumulativeReturn', label: 'Rendite', format: 'percentage' }
      ]
    }
  }

  /**
   * 验证输入数据
   */
  validate(input: ETFSavingsPlanInput): ValidationResult {
    const errors: string[] = []

    if (input.monthlyInvestment < 25) {
      errors.push('Monatliche Sparrate muss mindestens €25 betragen')
    }

    if (input.investmentPeriod < 1 || input.investmentPeriod > 50) {
      errors.push('Anlagezeitraum muss zwischen 1 und 50 Jahren liegen')
    }

    if (input.expectedAnnualReturn < -10 || input.expectedAnnualReturn > 20) {
      errors.push('Erwartete Rendite muss zwischen -10% und 20% liegen')
    }

    if (input.ter < 0.05 || input.ter > 2.0) {
      errors.push('TER muss zwischen 0.05% und 2.0% liegen')
    }

    if (input.volatility < 5 || input.volatility > 50) {
      errors.push('Volatilität muss zwischen 5% und 50% liegen')
    }

    if (input.freistellungsauftrag > 2000) {
      errors.push('Freistellungsauftrag kann maximal €2.000 betragen')
    }

    // 风险警告
    if (input.expectedAnnualReturn > 12) {
      errors.push('Warnung: Sehr hohe Renditeerwartungen sind unrealistisch')
    }

    if (input.volatility > 25 && input.investmentPeriod < 10) {
      errors.push('Warnung: Hohe Volatilität bei kurzer Anlagedauer erhöht das Risiko')
    }

    return {
      isValid: errors.filter(e => !e.startsWith('Warnung:')).length === 0,
      errors
    }
  }

  /**
   * 执行ETF定投计算
   */
  async calculate(input: ETFSavingsPlanInput): Promise<ETFSavingsPlanResult> {
    // 验证输入
    const validation = this.validate(input)
    if (!validation.isValid) {
      throw new Error(`输入验证失败: ${validation.errors.join(', ')}`)
    }

    // 获取部分免税比例
    const teilfreistellung = this.TEILFREISTELLUNG_RATES[input.etfType] || 0.30

    // 计算年度明细
    const yearlyBreakdown = this.calculateYearlyBreakdown(input, teilfreistellung)

    // 汇总结果
    const lastYear = yearlyBreakdown[yearlyBreakdown.length - 1]
    const finalValue = lastYear.marketValue
    const totalInvestment = input.monthlyInvestment * 12 * input.investmentPeriod
    const totalReturn = finalValue - totalInvestment
    const totalFees = yearlyBreakdown.reduce((sum, year) => sum + year.fees, 0)
    const totalTaxPaid = yearlyBreakdown.reduce((sum, year) => sum + year.taxes, 0)

    // 计算年化收益率
    const annualizedReturn = this.calculateAnnualizedReturn(finalValue, totalInvestment, input.investmentPeriod)

    // 风险分析
    const riskAnalysis = this.calculateRiskScenarios(input, finalValue)

    // 通胀调整
    const inflationAdjustment = this.calculateInflationImpact(lastYear.netValue, input)

    // 税务优化分析
    const taxOptimization = this.analyzeTaxOptimization(totalReturn, teilfreistellung, input)

    // 生成建议
    const recommendations = this.generateRecommendations(input, finalValue, totalFees)

    return {
      finalValue,
      totalInvestment,
      totalReturn,
      annualizedReturn,

      totalFees,
      feeImpact: (totalFees / finalValue) * 100,

      totalTaxPaid,
      netFinalValue: lastYear.netValue,
      netReturn: lastYear.netValue - totalInvestment,

      volatilityImpact: riskAnalysis.volatilityImpact,
      worstCaseScenario: riskAnalysis.worstCase,
      bestCaseScenario: riskAnalysis.bestCase,

      realValue: inflationAdjustment.realValue,
      purchasingPowerGain: inflationAdjustment.purchasingPowerGain,

      yearlyBreakdown,

      taxOptimization,

      riskLevel: this.assessRiskLevel(input),
      diversificationScore: this.calculateDiversificationScore(input.etfType),

      recommendations,
      alternativeETFs: this.getAlternativeETFs(input)
    }
  }

  /**
   * 计算年度明细
   */
  private calculateYearlyBreakdown(
    input: ETFSavingsPlanInput,
    teilfreistellung: number
  ): Array<{
    year: number
    investment: number
    marketValue: number
    fees: number
    taxes: number
    netValue: number
    realValue: number
    cumulativeReturn: number
  }> {
    const breakdown = []
    let cumulativeInvestment = 0
    let marketValue = 0
    let cumulativeFees = 0
    let cumulativeTaxes = 0

    for (let year = 1; year <= input.investmentPeriod; year++) {
      const yearlyInvestment = input.monthlyInvestment * 12
      cumulativeInvestment += yearlyInvestment

      // 模拟市场波动（简化版）
      const baseReturn = input.expectedAnnualReturn / 100
      const volatilityAdjustment = input.costAveraging ? 0.8 : 1.0 // Cost averaging reduces volatility impact
      const yearlyReturn = baseReturn * volatilityAdjustment

      // 计算市场价值（考虑新投资和收益）
      marketValue = (marketValue + yearlyInvestment) * (1 + yearlyReturn)

      // 计算年度费用
      const yearlyFees = marketValue * (input.ter / 100)
      marketValue -= yearlyFees
      cumulativeFees += yearlyFees

      // 计算税收（仅对收益部分）
      const yearlyGain = Math.max(0, marketValue - cumulativeInvestment)
      const taxableGain = yearlyGain * (1 - teilfreistellung)
      const yearlyTax = this.calculateYearlyTax(taxableGain, input, year)
      cumulativeTaxes += yearlyTax

      const netValue = marketValue - cumulativeTaxes

      // 通胀调整
      const inflationFactor = Math.pow(1 + input.inflationRate / 100, year)
      const realValue = netValue / inflationFactor

      // 累计收益率
      const cumulativeReturn = cumulativeInvestment > 0
        ? ((netValue - cumulativeInvestment) / cumulativeInvestment) * 100
        : 0

      breakdown.push({
        year,
        investment: cumulativeInvestment,
        marketValue,
        fees: cumulativeFees,
        taxes: cumulativeTaxes,
        netValue,
        realValue,
        cumulativeReturn
      })
    }

    return breakdown
  }

  /**
   * 计算年度税收
   */
  private calculateYearlyTax(taxableGain: number, input: ETFSavingsPlanInput, year: number): number {
    if (taxableGain <= 0) return 0

    // 分摊免税额度
    const yearlyFreibetrag = input.freistellungsauftrag / input.investmentPeriod
    const taxableAmount = Math.max(0, taxableGain - yearlyFreibetrag)

    if (taxableAmount <= 0) return 0

    // 计算资本利得税
    let tax = taxableAmount * this.ABGELTUNGSSTEUER_RATE

    // 团结附加税
    if (input.solidaritySurcharge) {
      tax += tax * this.SOLIDARITY_SURCHARGE_RATE
    }

    // 教会税
    if (input.churchTax) {
      tax += tax * this.CHURCH_TAX_RATE
    }

    return tax
  }

  /**
   * 计算年化收益率
   */
  private calculateAnnualizedReturn(finalValue: number, totalInvestment: number, years: number): number {
    if (totalInvestment === 0 || years === 0) return 0
    return (Math.pow(finalValue / totalInvestment, 1 / years) - 1) * 100
  }

  /**
   * 计算风险情景
   */
  private calculateRiskScenarios(input: ETFSavingsPlanInput, expectedValue: number) {
    const volatility = input.volatility / 100
    const years = input.investmentPeriod

    // 简化的风险计算（基于正态分布）
    const volatilityImpact = expectedValue * volatility * Math.sqrt(years)
    const worstCase = expectedValue - (2 * volatilityImpact) // 95% 置信区间
    const bestCase = expectedValue + (2 * volatilityImpact)

    return {
      volatilityImpact,
      worstCase: Math.max(0, worstCase),
      bestCase
    }
  }

  /**
   * 计算通胀影响
   */
  private calculateInflationImpact(netValue: number, input: ETFSavingsPlanInput) {
    if (!input.adjustForInflation) {
      return {
        realValue: netValue,
        purchasingPowerGain: netValue - (input.monthlyInvestment * 12 * input.investmentPeriod)
      }
    }

    const inflationFactor = Math.pow(1 + input.inflationRate / 100, input.investmentPeriod)
    const realValue = netValue / inflationFactor
    const realInvestment = (input.monthlyInvestment * 12 * input.investmentPeriod) / inflationFactor
    const purchasingPowerGain = realValue - realInvestment

    return { realValue, purchasingPowerGain }
  }

  /**
   * 税务优化分析
   */
  private analyzeTaxOptimization(totalReturn: number, teilfreistellung: number, input: ETFSavingsPlanInput) {
    const teilfreistellungBenefit = totalReturn * teilfreistellung * this.ABGELTUNGSSTEUER_RATE
    const freistellungsauftragUsed = Math.min(input.freistellungsauftrag, totalReturn * (1 - teilfreistellung))

    const recommendations = []

    if (input.freistellungsauftrag < 1000) {
      recommendations.push('Nutzen Sie den vollen Sparerpauschbetrag von €1.000')
    }

    if (input.distributionType === 'distributing') {
      recommendations.push('Thesaurierende ETFs sind steuerlich effizienter')
    }

    if (teilfreistellung < 0.30) {
      recommendations.push('Aktien-ETFs bieten höhere Teilfreistellung (30% vs 15%)')
    }

    return {
      teilfreistellungBenefit,
      freistellungsauftragUsed,
      recommendations
    }
  }

  /**
   * 风险等级评估
   */
  private assessRiskLevel(input: ETFSavingsPlanInput): 'niedrig' | 'mittel' | 'hoch' | 'sehr_hoch' {
    let riskScore = 0

    // 基于ETF类型
    switch (input.etfType) {
      case 'bond': riskScore += 1; break
      case 'europe': riskScore += 2; break
      case 'world': riskScore += 3; break
      case 'emerging': riskScore += 4; break
      case 'sector': riskScore += 5; break
    }

    // 基于波动率
    if (input.volatility > 25) riskScore += 2
    else if (input.volatility > 15) riskScore += 1

    // 基于投资期限
    if (input.investmentPeriod < 5) riskScore += 2
    else if (input.investmentPeriod < 10) riskScore += 1

    if (riskScore <= 2) return 'niedrig'
    if (riskScore <= 4) return 'mittel'
    if (riskScore <= 6) return 'hoch'
    return 'sehr_hoch'
  }

  /**
   * 计算分散化评分
   */
  private calculateDiversificationScore(etfType: string): number {
    const scores = {
      world: 95,
      europe: 75,
      emerging: 60,
      sector: 30,
      bond: 50
    }
    return scores[etfType as keyof typeof scores] || 50
  }

  /**
   * 生成建议
   */
  private generateRecommendations(input: ETFSavingsPlanInput, finalValue: number, totalFees: number): string[] {
    const recommendations = []

    // 费用建议
    if (input.ter > 0.5) {
      recommendations.push('Erwägen Sie ETFs mit niedrigerer TER für höhere Nettorendite')
    }

    // 投资期限建议
    if (input.investmentPeriod < 10 && input.volatility > 20) {
      recommendations.push('Für kurze Anlagezeiträume sollten Sie weniger volatile ETFs wählen')
    }

    // 分散化建议
    if (input.etfType === 'sector') {
      recommendations.push('Sektor-ETFs sind weniger diversifiziert - erwägen Sie Welt-ETFs')
    }

    // 税务建议
    if (input.distributionType === 'distributing') {
      recommendations.push('Thesaurierende ETFs vermeiden jährliche Steuerzahlungen')
    }

    // 成本平均法建议
    if (!input.costAveraging) {
      recommendations.push('Cost-Average-Effekt reduziert das Timing-Risiko')
    }

    // 通胀建议
    if (input.inflationRate > input.expectedAnnualReturn) {
      recommendations.push('Ihre Renditeerwartung liegt unter der Inflation')
    }

    return recommendations
  }

  /**
   * 获取替代ETF建议
   */
  private getAlternativeETFs(input: ETFSavingsPlanInput) {
    const alternatives = []

    // 根据当前选择推荐替代方案
    if (input.etfType !== 'world') {
      alternatives.push({
        name: 'MSCI World ETF',
        ter: 0.20,
        expectedReturn: 7.0,
        riskLevel: 'Mittel',
        description: 'Breit diversifiziert über entwickelte Märkte'
      })
    }

    if (input.ter > 0.3) {
      alternatives.push({
        name: 'Low-Cost World ETF',
        ter: 0.12,
        expectedReturn: input.expectedAnnualReturn,
        riskLevel: 'Mittel',
        description: 'Gleiche Strategie mit niedrigeren Kosten'
      })
    }

    if (input.etfType === 'sector') {
      alternatives.push({
        name: 'STOXX Europe 600 ETF',
        ter: 0.20,
        expectedReturn: 6.5,
        riskLevel: 'Mittel',
        description: 'Europäische Diversifikation statt Sektor-Fokus'
      })
    }

    return alternatives
  }
}

// 导出计算器实例
export const etfSavingsPlanCalculator = new ETFSavingsPlanCalculator()
