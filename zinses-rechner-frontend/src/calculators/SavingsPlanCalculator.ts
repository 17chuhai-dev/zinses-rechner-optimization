/**
 * 德国储蓄计划计算器 (Sparplan-Rechner)
 * 符合德国银行储蓄产品和税收法规
 */

import type { BaseCalculator, CalculationInput, CalculationResult, ValidationResult } from '@/types/calculator'

// 储蓄计划输入接口
export interface SavingsPlanInput extends CalculationInput {
  initialAmount: number // 初始金额
  monthlyContribution: number // 月储蓄金额
  interestRate: number // 年利率
  savingsPeriod: number // 储蓄期限（年）
  compoundingFrequency: 'monthly' | 'quarterly' | 'annually' // 复利频率

  // 德国特定参数
  savingsType: 'sparbuch' | 'festgeld' | 'tagesgeld' | 'bausparvertrag' // 储蓄类型
  bankType: 'sparkasse' | 'volksbank' | 'privatbank' | 'direktbank' // 银行类型
  depositInsurance: boolean // 存款保险

  // 税收相关
  freistellungsauftrag: number // 免税额度
  taxRate: number // 个人所得税率
  solidaritySurcharge: boolean // 团结附加税
  churchTax: boolean // 教会税

  // 通胀调整
  inflationRate: number // 通胀率
  adjustForInflation: boolean // 是否调整通胀

  // 灵活性选项
  allowEarlyWithdrawal: boolean // 允许提前支取
  penaltyRate: number // 提前支取罚金率
}

// 储蓄计划结果接口
export interface SavingsPlanResult extends CalculationResult {
  // 基本结果
  finalAmount: number // 最终金额
  totalContributions: number // 总存款
  totalInterest: number // 总利息
  effectiveInterestRate: number // 实际利率

  // 税后结果
  finalAmountAfterTax: number // 税后最终金额
  totalTaxPaid: number // 总税款
  netInterest: number // 净利息收入

  // 通胀调整结果
  realValue: number // 实际价值（考虑通胀）
  purchasingPowerLoss: number // 购买力损失

  // 年度明细
  yearlyBreakdown: Array<{
    year: number
    startBalance: number
    contributions: number
    interestEarned: number
    taxPaid: number
    endBalance: number
    realValue: number
  }>

  // 德国特定信息
  depositInsuranceCoverage: number // 存款保险覆盖额
  bankingRegulation: string // 银行监管信息

  // 风险评估
  riskLevel: 'sehr_niedrig' | 'niedrig' | 'mittel' | 'hoch'
  liquidityRating: 'sehr_hoch' | 'hoch' | 'mittel' | 'niedrig'

  // 建议
  recommendations: string[]
  alternativeProducts: Array<{
    name: string
    expectedReturn: number
    riskLevel: string
    description: string
  }>
}

/**
 * 储蓄计划计算器实现
 */
export class SavingsPlanCalculator implements BaseCalculator {
  id = 'savings-plan'
  name = 'Sparplan-Rechner'
  description = 'Berechnen Sie Ihre Sparplan-Entwicklung mit deutschen Bankprodukten'
  category = 'compound-interest' as const
  version = '1.0.0'

  // 德国存款保险限额
  private readonly DEPOSIT_INSURANCE_LIMIT = 100000 // €100,000

  // 德国税率常数
  private readonly ABGELTUNGSSTEUER_RATE = 0.25 // 25% 资本利得税
  private readonly SOLIDARITY_SURCHARGE_RATE = 0.055 // 5.5% 团结附加税
  private readonly CHURCH_TAX_RATE = 0.08 // 8% 教会税（平均）

  // 免税额度
  private readonly SPARERPAUSCHBETRAG = 1000 // €1,000 单身免税额
  private readonly SPARERPAUSCHBETRAG_MARRIED = 2000 // €2,000 夫妻免税额

  formSchema = {
    title: 'Sparplan-Rechner',
    description: 'Planen Sie Ihre Geldanlage mit deutschen Sparprodukten',
    fields: [
      {
        name: 'initialAmount',
        label: 'Startkapital (€)',
        type: 'currency',
        required: true,
        min: 0,
        max: 10000000,
        defaultValue: 1000
      },
      {
        name: 'monthlyContribution',
        label: 'Monatliche Sparrate (€)',
        type: 'currency',
        required: true,
        min: 1,
        max: 50000,
        defaultValue: 100
      },
      {
        name: 'interestRate',
        label: 'Zinssatz pro Jahr (%)',
        type: 'percentage',
        required: true,
        min: 0,
        max: 15,
        step: 0.1,
        defaultValue: 2.5
      },
      {
        name: 'savingsPeriod',
        label: 'Spardauer (Jahre)',
        type: 'number',
        required: true,
        min: 1,
        max: 50,
        defaultValue: 10
      },
      {
        name: 'savingsType',
        label: 'Sparprodukt',
        type: 'select',
        required: true,
        options: [
          { value: 'sparbuch', label: 'Sparbuch' },
          { value: 'festgeld', label: 'Festgeld' },
          { value: 'tagesgeld', label: 'Tagesgeld' },
          { value: 'bausparvertrag', label: 'Bausparvertrag' }
        ],
        defaultValue: 'tagesgeld'
      },
      {
        name: 'compoundingFrequency',
        label: 'Zinsgutschrift',
        type: 'select',
        required: true,
        options: [
          { value: 'monthly', label: 'Monatlich' },
          { value: 'quarterly', label: 'Vierteljährlich' },
          { value: 'annually', label: 'Jährlich' }
        ],
        defaultValue: 'annually'
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
      }
    ]
  }

  resultConfig = {
    primaryMetrics: [
      {
        key: 'finalAmount',
        label: 'Endkapital',
        format: 'currency',
        highlight: true
      },
      {
        key: 'totalInterest',
        label: 'Zinserträge',
        format: 'currency'
      },
      {
        key: 'finalAmountAfterTax',
        label: 'Nach Steuern',
        format: 'currency'
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
        title: 'Kapitalentwicklung',
        dataKeys: ['startBalance', 'endBalance', 'realValue']
      },
      {
        type: 'pie',
        title: 'Zusammensetzung',
        dataKeys: ['totalContributions', 'netInterest']
      }
    ],
    breakdown: {
      title: 'Jährliche Entwicklung',
      columns: [
        { key: 'year', label: 'Jahr' },
        { key: 'contributions', label: 'Einzahlungen', format: 'currency' },
        { key: 'interestEarned', label: 'Zinsen', format: 'currency' },
        { key: 'taxPaid', label: 'Steuern', format: 'currency' },
        { key: 'endBalance', label: 'Saldo', format: 'currency' },
        { key: 'realValue', label: 'Kaufkraft', format: 'currency' }
      ]
    }
  }

  /**
   * 验证输入数据
   */
  validate(input: SavingsPlanInput): ValidationResult {
    const errors: string[] = []

    if (input.initialAmount < 0) {
      errors.push('Startkapital muss positiv sein')
    }

    if (input.monthlyContribution <= 0) {
      errors.push('Monatliche Sparrate muss größer als 0 sein')
    }

    if (input.interestRate < 0 || input.interestRate > 15) {
      errors.push('Zinssatz muss zwischen 0% und 15% liegen')
    }

    if (input.savingsPeriod < 1 || input.savingsPeriod > 50) {
      errors.push('Spardauer muss zwischen 1 und 50 Jahren liegen')
    }

    if (input.freistellungsauftrag > 2000) {
      errors.push('Freistellungsauftrag kann maximal €2.000 betragen')
    }

    // 检查存款保险覆盖
    const totalAmount = input.initialAmount + (input.monthlyContribution * 12 * input.savingsPeriod)
    if (totalAmount > this.DEPOSIT_INSURANCE_LIMIT) {
      errors.push(`Warnung: Gesamtbetrag übersteigt die Einlagensicherung von €${this.DEPOSIT_INSURANCE_LIMIT.toLocaleString()}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 执行储蓄计划计算
   */
  async calculate(input: SavingsPlanInput): Promise<SavingsPlanResult> {
    // 验证输入
    const validation = this.validate(input)
    if (!validation.isValid) {
      throw new Error(`输入验证失败: ${validation.errors.join(', ')}`)
    }

    // 计算复利频率
    const compoundingPerYear = this.getCompoundingFrequency(input.compoundingFrequency)
    const monthlyRate = input.interestRate / 100 / 12
    const totalMonths = input.savingsPeriod * 12

    // 年度明细计算
    const yearlyBreakdown = this.calculateYearlyBreakdown(input, monthlyRate, totalMonths)

    // 汇总结果
    const lastYear = yearlyBreakdown[yearlyBreakdown.length - 1]
    const finalAmount = lastYear.endBalance
    const totalContributions = input.initialAmount + (input.monthlyContribution * totalMonths)
    const totalInterest = finalAmount - totalContributions

    // 税收计算
    const taxCalculation = this.calculateTaxes(totalInterest, input)
    const finalAmountAfterTax = finalAmount - taxCalculation.totalTaxPaid

    // 通胀调整
    const inflationAdjustment = this.calculateInflationImpact(finalAmountAfterTax, input)

    // 风险和流动性评估
    const riskAssessment = this.assessRisk(input)
    const recommendations = this.generateRecommendations(input, finalAmountAfterTax)

    return {
      finalAmount,
      totalContributions,
      totalInterest,
      effectiveInterestRate: this.calculateEffectiveRate(totalInterest, totalContributions, input.savingsPeriod),

      finalAmountAfterTax,
      totalTaxPaid: taxCalculation.totalTaxPaid,
      netInterest: totalInterest - taxCalculation.totalTaxPaid,

      realValue: inflationAdjustment.realValue,
      purchasingPowerLoss: inflationAdjustment.purchasingPowerLoss,

      yearlyBreakdown,

      depositInsuranceCoverage: Math.min(finalAmount, this.DEPOSIT_INSURANCE_LIMIT),
      bankingRegulation: 'Reguliert durch BaFin (Bundesanstalt für Finanzdienstleistungsaufsicht)',

      riskLevel: riskAssessment.riskLevel,
      liquidityRating: riskAssessment.liquidityRating,

      recommendations,
      alternativeProducts: this.getAlternativeProducts(input)
    }
  }

  /**
   * 获取复利频率
   */
  private getCompoundingFrequency(frequency: string): number {
    switch (frequency) {
      case 'monthly': return 12
      case 'quarterly': return 4
      case 'annually': return 1
      default: return 1
    }
  }

  /**
   * 计算年度明细
   */
  private calculateYearlyBreakdown(
    input: SavingsPlanInput,
    monthlyRate: number,
    totalMonths: number
  ): Array<{
    year: number
    startBalance: number
    contributions: number
    interestEarned: number
    taxPaid: number
    endBalance: number
    realValue: number
  }> {
    const breakdown = []
    let currentBalance = input.initialAmount

    for (let year = 1; year <= input.savingsPeriod; year++) {
      const startBalance = currentBalance
      const yearlyContributions = input.monthlyContribution * 12

      // 计算年度利息（月复利）
      let yearlyInterest = 0
      let tempBalance = startBalance

      for (let month = 1; month <= 12; month++) {
        const monthlyInterest = tempBalance * monthlyRate
        yearlyInterest += monthlyInterest
        tempBalance += monthlyInterest + input.monthlyContribution
      }

      currentBalance = tempBalance

      // 计算税收
      const taxableInterest = Math.max(0, yearlyInterest - (input.freistellungsauftrag / input.savingsPeriod))
      const yearlyTax = this.calculateYearlyTax(taxableInterest, input)

      // 通胀调整
      const inflationFactor = Math.pow(1 + input.inflationRate / 100, year)
      const realValue = currentBalance / inflationFactor

      breakdown.push({
        year,
        startBalance,
        contributions: yearlyContributions,
        interestEarned: yearlyInterest,
        taxPaid: yearlyTax,
        endBalance: currentBalance,
        realValue
      })
    }

    return breakdown
  }

  /**
   * 计算税收
   */
  private calculateTaxes(totalInterest: number, input: SavingsPlanInput) {
    const taxableInterest = Math.max(0, totalInterest - input.freistellungsauftrag)

    let totalTaxPaid = 0

    if (taxableInterest > 0) {
      // 资本利得税 25%
      const abgeltungssteuer = taxableInterest * this.ABGELTUNGSSTEUER_RATE
      totalTaxPaid += abgeltungssteuer

      // 团结附加税 5.5%
      if (input.solidaritySurcharge) {
        totalTaxPaid += abgeltungssteuer * this.SOLIDARITY_SURCHARGE_RATE
      }

      // 教会税 8%
      if (input.churchTax) {
        totalTaxPaid += abgeltungssteuer * this.CHURCH_TAX_RATE
      }
    }

    return { totalTaxPaid, taxableInterest }
  }

  /**
   * 计算年度税收
   */
  private calculateYearlyTax(taxableInterest: number, input: SavingsPlanInput): number {
    if (taxableInterest <= 0) return 0

    let yearlyTax = taxableInterest * this.ABGELTUNGSSTEUER_RATE

    if (input.solidaritySurcharge) {
      yearlyTax += yearlyTax * this.SOLIDARITY_SURCHARGE_RATE
    }

    if (input.churchTax) {
      yearlyTax += yearlyTax * this.CHURCH_TAX_RATE
    }

    return yearlyTax
  }

  /**
   * 计算通胀影响
   */
  private calculateInflationImpact(finalAmount: number, input: SavingsPlanInput) {
    if (!input.adjustForInflation) {
      return {
        realValue: finalAmount,
        purchasingPowerLoss: 0
      }
    }

    const inflationFactor = Math.pow(1 + input.inflationRate / 100, input.savingsPeriod)
    const realValue = finalAmount / inflationFactor
    const purchasingPowerLoss = finalAmount - realValue

    return { realValue, purchasingPowerLoss }
  }

  /**
   * 计算实际利率
   */
  private calculateEffectiveRate(totalInterest: number, totalContributions: number, years: number): number {
    if (totalContributions === 0 || years === 0) return 0
    return (Math.pow(totalInterest / totalContributions + 1, 1 / years) - 1) * 100
  }

  /**
   * 风险评估
   */
  private assessRisk(input: SavingsPlanInput) {
    let riskLevel: 'sehr_niedrig' | 'niedrig' | 'mittel' | 'hoch' = 'sehr_niedrig'
    let liquidityRating: 'sehr_hoch' | 'hoch' | 'mittel' | 'niedrig' = 'sehr_hoch'

    // 根据储蓄类型评估风险
    switch (input.savingsType) {
      case 'sparbuch':
        riskLevel = 'sehr_niedrig'
        liquidityRating = 'sehr_hoch'
        break
      case 'tagesgeld':
        riskLevel = 'sehr_niedrig'
        liquidityRating = 'sehr_hoch'
        break
      case 'festgeld':
        riskLevel = 'sehr_niedrig'
        liquidityRating = 'niedrig'
        break
      case 'bausparvertrag':
        riskLevel = 'niedrig'
        liquidityRating = 'mittel'
        break
    }

    return { riskLevel, liquidityRating }
  }

  /**
   * 生成建议
   */
  private generateRecommendations(input: SavingsPlanInput, finalAmount: number): string[] {
    const recommendations = []

    // 存款保险建议
    if (finalAmount > this.DEPOSIT_INSURANCE_LIMIT) {
      recommendations.push('Erwägen Sie eine Aufteilung auf mehrere Banken für vollständige Einlagensicherung')
    }

    // 利率建议
    if (input.interestRate < 1) {
      recommendations.push('Bei niedrigen Zinsen sollten Sie alternative Anlageformen wie ETFs prüfen')
    }

    // 通胀建议
    if (input.inflationRate > input.interestRate) {
      recommendations.push('Die Inflation übersteigt den Zinssatz - Ihr Geld verliert real an Wert')
    }

    // 免税额建议
    if (input.freistellungsauftrag < 1000) {
      recommendations.push('Nutzen Sie den vollen Sparerpauschbetrag von €1.000 (€2.000 für Verheiratete)')
    }

    // 储蓄类型建议
    if (input.savingsType === 'sparbuch' && input.savingsPeriod > 5) {
      recommendations.push('Für längere Anlagezeiträume bieten Festgeld oder ETFs oft bessere Renditen')
    }

    return recommendations
  }

  /**
   * 获取替代产品
   */
  private getAlternativeProducts(input: SavingsPlanInput) {
    const alternatives = []

    // 根据当前选择推荐替代方案
    if (input.savingsType !== 'festgeld') {
      alternatives.push({
        name: 'Festgeld',
        expectedReturn: input.interestRate + 0.5,
        riskLevel: 'Sehr niedrig',
        description: 'Höhere Zinsen bei fester Laufzeit'
      })
    }

    if (input.savingsPeriod > 10) {
      alternatives.push({
        name: 'ETF-Sparplan',
        expectedReturn: 6.0,
        riskLevel: 'Mittel',
        description: 'Langfristig höhere Renditen bei moderatem Risiko'
      })
    }

    if (input.savingsType !== 'bausparvertrag') {
      alternatives.push({
        name: 'Bausparvertrag',
        expectedReturn: input.interestRate + 0.3,
        riskLevel: 'Niedrig',
        description: 'Staatliche Förderung und Darlehensanspruch'
      })
    }

    return alternatives
  }
}

// 导出计算器实例
export const savingsPlanCalculator = new SavingsPlanCalculator()
