/**
 * 德国退休规划计算器
 * 符合德国养老保险制度和税收法规
 */

import type { BaseCalculator, CalculationInput, CalculationResult } from '@/types/calculator'

// 退休计算输入接口
export interface RetirementInput extends CalculationInput {
  currentAge: number
  retirementAge: number
  currentSalary: number
  salaryGrowthRate: number
  currentSavings: number
  monthlyContribution: number
  contributionGrowthRate: number
  expectedReturn: number
  inflationRate: number

  // 德国特定字段
  pensionPoints: number // 当前养老保险积分
  expectedPensionValue: number // 预期养老金价值
  riesterContribution: number // Riester养老金月供
  betrieblicheAV: number // 企业年金月供
  employerMatch: number // 雇主匹配比例

  // 税收相关
  taxRate: number // 预期退休后税率
  healthInsuranceRate: number // 健康保险费率

  // 生活成本
  desiredReplacementRatio: number // 期望收入替代率
  additionalExpenses: number // 额外退休支出
}

// 退休计算结果接口
export interface RetirementResult extends CalculationResult {
  // 基本预测
  totalSavingsAtRetirement: number
  monthlyPensionIncome: number
  totalMonthlyIncome: number
  incomeShortfall: number

  // 德国养老金系统
  gesetzlicheRente: number // 法定养老金
  riesterRente: number // Riester养老金
  betrieblicheRente: number // 企业年金
  privateVorsorge: number // 私人养老保险

  // 税后收入
  grossMonthlyIncome: number
  netMonthlyIncome: number
  monthlyTaxes: number
  monthlyHealthInsurance: number

  // 生活成本分析
  requiredMonthlyIncome: number
  incomeAdequacy: 'sufficient' | 'adequate' | 'insufficient'

  // 优化建议
  recommendedAdditionalSavings: number
  recommendedRetirementAge: number

  // 详细预测
  yearlyProjections: Array<{
    age: number
    year: number
    totalSavings: number
    annualContribution: number
    pensionPoints: number
    projectedPension: number
  }>

  // 风险分析
  riskAnalysis: {
    inflationImpact: number
    marketVolatilityImpact: number
    longevityRisk: number
    healthcareInflation: number
  }
}

/**
 * 德国退休规划计算器实现
 */
export class RetirementCalculator implements BaseCalculator {
  id = 'retirement'
  name = 'Altersvorsorge-Rechner'
  description = 'Planen Sie Ihre Altersvorsorge nach deutschem Recht'
  category = 'retirement' as const
  icon = 'user-group'

  // 德国养老金系统常数
  private readonly PENSION_VALUE_2024 = 37.60 // 当前养老金价值（欧元/积分）
  private readonly MAX_PENSION_POINTS_PER_YEAR = 2.0
  private readonly AVERAGE_SALARY_2024 = 43142 // 德国平均工资
  private readonly RIESTER_MAX_CONTRIBUTION = 2100 // Riester最大年供
  private readonly HEALTH_INSURANCE_RATE = 0.146 // 健康保险费率

  async calculate(input: RetirementInput): Promise<RetirementResult> {
    // 验证输入
    this.validateInput(input)

    // 计算基本参数
    const yearsToRetirement = input.retirementAge - input.currentAge
    const monthsToRetirement = yearsToRetirement * 12

    // 计算各种养老金收入
    const gesetzlicheRente = this.calculateGesetzlicheRente(input)
    const riesterRente = this.calculateRiesterRente(input)
    const betrieblicheRente = this.calculateBetrieblicheRente(input)
    const privateVorsorge = this.calculatePrivateVorsorge(input)

    // 计算总储蓄
    const totalSavingsAtRetirement = this.calculateTotalSavings(input)

    // 计算月度收入
    const grossMonthlyIncome = gesetzlicheRente + riesterRente + betrieblicheRente + privateVorsorge
    const monthlyTaxes = grossMonthlyIncome * input.taxRate
    const monthlyHealthInsurance = grossMonthlyIncome * this.HEALTH_INSURANCE_RATE
    const netMonthlyIncome = grossMonthlyIncome - monthlyTaxes - monthlyHealthInsurance

    // 计算所需收入
    const requiredMonthlyIncome = (input.currentSalary * input.desiredReplacementRatio / 12) + input.additionalExpenses
    const incomeShortfall = Math.max(0, requiredMonthlyIncome - netMonthlyIncome)

    // 收入充足性评估
    const incomeAdequacy = this.assessIncomeAdequacy(netMonthlyIncome, requiredMonthlyIncome)

    // 生成年度预测
    const yearlyProjections = this.generateYearlyProjections(input)

    // 风险分析
    const riskAnalysis = this.calculateRiskAnalysis(input, netMonthlyIncome)

    // 优化建议
    const recommendedAdditionalSavings = this.calculateRecommendedSavings(incomeShortfall, yearsToRetirement)
    const recommendedRetirementAge = this.calculateOptimalRetirementAge(input)

    return {
      // 基础CalculationResult属性
      final_amount: totalSavingsAtRetirement,
      total_contributions: input.currentSavings + (input.monthlyContribution * monthsToRetirement),
      total_interest: totalSavingsAtRetirement - (input.currentSavings + (input.monthlyContribution * monthsToRetirement)),
      annual_return: input.expectedReturn / 100,
      yearly_breakdown: yearlyProjections.map(p => ({
        year: p.year,
        start_amount: p.totalSavings - p.annualContribution,
        contributions: p.annualContribution,
        end_amount: p.totalSavings,
        interest: p.totalSavings * (input.expectedReturn / 100),
        growth_rate: input.expectedReturn / 100
      })),
      calculation_time: new Date().toISOString(),

      // 基本预测
      totalSavingsAtRetirement,
      monthlyPensionIncome: privateVorsorge,
      totalMonthlyIncome: grossMonthlyIncome,
      incomeShortfall,

      // 德国养老金系统
      gesetzlicheRente,
      riesterRente,
      betrieblicheRente,
      privateVorsorge,

      // 税后收入
      grossMonthlyIncome,
      netMonthlyIncome,
      monthlyTaxes,
      monthlyHealthInsurance,

      // 生活成本分析
      requiredMonthlyIncome,
      incomeAdequacy,

      // 优化建议
      recommendedAdditionalSavings,
      recommendedRetirementAge,

      // 详细预测
      yearlyProjections,

      // 风险分析
      riskAnalysis
    }
  }

  /**
   * 验证输入参数
   */
  private validateInput(input: RetirementInput): void {
    if (input.currentAge < 18 || input.currentAge > 67) {
      throw new Error('Aktuelles Alter muss zwischen 18 und 67 Jahren liegen')
    }

    if (input.retirementAge <= input.currentAge || input.retirementAge > 70) {
      throw new Error('Rentenalter muss zwischen aktuellem Alter und 70 Jahren liegen')
    }

    if (input.currentSalary < 0) {
      throw new Error('Aktuelles Gehalt darf nicht negativ sein')
    }

    if (input.expectedReturn < 0 || input.expectedReturn > 15) {
      throw new Error('Erwartete Rendite muss zwischen 0% und 15% liegen')
    }
  }

  /**
   * 计算法定养老金
   */
  private calculateGesetzlicheRente(input: RetirementInput): number {
    const yearsToRetirement = input.retirementAge - input.currentAge
    const currentPoints = input.pensionPoints

    // 计算未来积分（基于当前工资和平均工资的比例）
    const salaryRatio = input.currentSalary / this.AVERAGE_SALARY_2024
    const annualPointsGain = Math.min(salaryRatio, this.MAX_PENSION_POINTS_PER_YEAR)
    const futurePoints = currentPoints + (annualPointsGain * yearsToRetirement)

    // 考虑养老金价值的通胀调整
    const futureValue = this.PENSION_VALUE_2024 * Math.pow(1 + input.inflationRate / 100, yearsToRetirement)

    return futurePoints * futureValue
  }

  /**
   * 计算Riester养老金
   */
  private calculateRiesterRente(input: RetirementInput): number {
    if (input.riesterContribution === 0) return 0

    const yearsToRetirement = input.retirementAge - input.currentAge
    const annualContribution = input.riesterContribution * 12

    // Riester享受4%的保证收益率
    const guaranteedReturn = 0.04

    // 计算Riester储蓄总额
    const totalRiesterSavings = annualContribution *
      ((Math.pow(1 + guaranteedReturn, yearsToRetirement) - 1) / guaranteedReturn)

    // 转换为月度养老金（假设25年支付期）
    const payoutYears = 25
    const monthlyPayout = totalRiesterSavings / (payoutYears * 12)

    return monthlyPayout
  }

  /**
   * 计算企业年金
   */
  private calculateBetrieblicheRente(input: RetirementInput): number {
    if (input.betrieblicheAV === 0) return 0

    const yearsToRetirement = input.retirementAge - input.currentAge
    const totalContribution = input.betrieblicheAV * 12 * yearsToRetirement

    // 考虑雇主匹配
    const employerContribution = totalContribution * (input.employerMatch / 100)
    const totalWithMatch = totalContribution + employerContribution

    // 企业年金通常有较好的投资回报
    const futureValue = totalWithMatch * Math.pow(1 + input.expectedReturn / 100, yearsToRetirement)

    // 转换为月度养老金
    const payoutYears = 20
    return futureValue / (payoutYears * 12)
  }

  /**
   * 计算私人养老保险
   */
  private calculatePrivateVorsorge(input: RetirementInput): number {
    const yearsToRetirement = input.retirementAge - input.currentAge
    const monthlyReturn = input.expectedReturn / 100 / 12

    // 计算现有储蓄的未来价值
    const currentSavingsFV = input.currentSavings *
      Math.pow(1 + input.expectedReturn / 100, yearsToRetirement)

    // 计算月供的未来价值
    const monthlyContributionFV = input.monthlyContribution *
      ((Math.pow(1 + monthlyReturn, yearsToRetirement * 12) - 1) / monthlyReturn)

    const totalPrivateSavings = currentSavingsFV + monthlyContributionFV

    // 4%提取规则（德国常用）
    return totalPrivateSavings * 0.04 / 12
  }

  /**
   * 计算总储蓄
   */
  private calculateTotalSavings(input: RetirementInput): number {
    const yearsToRetirement = input.retirementAge - input.currentAge
    const monthlyReturn = input.expectedReturn / 100 / 12

    // 现有储蓄复利增长
    const currentSavingsFV = input.currentSavings *
      Math.pow(1 + input.expectedReturn / 100, yearsToRetirement)

    // 月供复利增长
    const monthlyContributionFV = input.monthlyContribution *
      ((Math.pow(1 + monthlyReturn, yearsToRetirement * 12) - 1) / monthlyReturn)

    return currentSavingsFV + monthlyContributionFV
  }

  /**
   * 评估收入充足性
   */
  private assessIncomeAdequacy(netIncome: number, requiredIncome: number): 'sufficient' | 'adequate' | 'insufficient' {
    const ratio = netIncome / requiredIncome

    if (ratio >= 1.2) return 'sufficient'
    if (ratio >= 0.8) return 'adequate'
    return 'insufficient'
  }

  /**
   * 生成年度预测
   */
  private generateYearlyProjections(input: RetirementInput): Array<{
    age: number
    year: number
    totalSavings: number
    annualContribution: number
    pensionPoints: number
    projectedPension: number
  }> {
    const projections = []
    const currentYear = new Date().getFullYear()
    const yearsToRetirement = input.retirementAge - input.currentAge

    for (let i = 0; i <= yearsToRetirement; i++) {
      const age = input.currentAge + i
      const year = currentYear + i

      // 计算该年的储蓄总额
      const monthlyReturn = input.expectedReturn / 100 / 12
      const monthsElapsed = i * 12

      const currentSavingsFV = input.currentSavings * Math.pow(1 + input.expectedReturn / 100, i)
      const contributionFV = monthsElapsed > 0 ?
        input.monthlyContribution * ((Math.pow(1 + monthlyReturn, monthsElapsed) - 1) / monthlyReturn) : 0

      const totalSavings = currentSavingsFV + contributionFV

      // 计算年度贡献（考虑增长）
      const annualContribution = input.monthlyContribution * 12 *
        Math.pow(1 + input.contributionGrowthRate / 100, i)

      // 计算养老保险积分
      const salaryThisYear = input.currentSalary * Math.pow(1 + input.salaryGrowthRate / 100, i)
      const salaryRatio = salaryThisYear / this.AVERAGE_SALARY_2024
      const pointsThisYear = Math.min(salaryRatio, this.MAX_PENSION_POINTS_PER_YEAR)
      const totalPensionPoints = input.pensionPoints + (pointsThisYear * i)

      // 预测养老金
      const projectedPension = totalPensionPoints * this.PENSION_VALUE_2024 *
        Math.pow(1 + input.inflationRate / 100, i)

      projections.push({
        age,
        year,
        totalSavings,
        annualContribution,
        pensionPoints: totalPensionPoints,
        projectedPension
      })
    }

    return projections
  }

  /**
   * 计算风险分析
   */
  private calculateRiskAnalysis(input: RetirementInput, baseIncome: number): {
    inflationImpact: number
    marketVolatilityImpact: number
    longevityRisk: number
    healthcareInflation: number
  } {
    // 通胀影响（购买力损失）
    const inflationImpact = baseIncome * (1 - Math.pow(1 + input.inflationRate / 100, -20))

    // 市场波动影响（假设±2%波动）
    const volatilityImpact = this.calculateTotalSavings(input) * 0.02

    // 长寿风险（额外5年生活费）
    const longevityRisk = baseIncome * 12 * 5

    // 医疗通胀影响（医疗费用通常比一般通胀高2%）
    const healthcareInflation = baseIncome * 0.1 *
      (Math.pow(1.04, 20) - Math.pow(1 + input.inflationRate / 100, 20))

    return {
      inflationImpact,
      marketVolatilityImpact: volatilityImpact,
      longevityRisk,
      healthcareInflation
    }
  }

  /**
   * 计算推荐额外储蓄
   */
  private calculateRecommendedSavings(shortfall: number, yearsToRetirement: number): number {
    if (shortfall <= 0 || yearsToRetirement <= 0) return 0

    // 考虑4%提取规则，需要25倍的年度缺口
    const requiredCapital = shortfall * 12 * 25

    // 计算所需月供（考虑投资回报）
    const monthlyReturn = 0.06 / 12 // 假设6%年回报
    const monthsToRetirement = yearsToRetirement * 12

    if (monthsToRetirement > 0) {
      return requiredCapital / ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn)
    }

    return 0
  }

  /**
   * 计算最优退休年龄
   */
  private calculateOptimalRetirementAge(input: RetirementInput): number {
    // 基于收入充足性找到最优退休年龄
    for (let age = input.currentAge + 1; age <= 70; age++) {
      const testInput = { ...input, retirementAge: age }
      const testResult = this.calculateQuickProjection(testInput)

      if (testResult.incomeAdequacy !== 'insufficient') {
        return age
      }
    }

    return 67 // 德国法定退休年龄
  }

  /**
   * 快速预测（用于优化计算）
   */
  private calculateQuickProjection(input: RetirementInput): { incomeAdequacy: 'sufficient' | 'adequate' | 'insufficient' } {
    const gesetzlicheRente = this.calculateGesetzlicheRente(input)
    const riesterRente = this.calculateRiesterRente(input)
    const betrieblicheRente = this.calculateBetrieblicheRente(input)
    const privateVorsorge = this.calculatePrivateVorsorge(input)

    const grossIncome = gesetzlicheRente + riesterRente + betrieblicheRente + privateVorsorge
    const netIncome = grossIncome * (1 - input.taxRate - this.HEALTH_INSURANCE_RATE)
    const requiredIncome = (input.currentSalary * input.desiredReplacementRatio / 12) + input.additionalExpenses

    return {
      incomeAdequacy: this.assessIncomeAdequacy(netIncome, requiredIncome)
    }
  }

  /**
   * 获取表单配置
   */
  getFormSchema() {
    return {
      title: 'Altersvorsorge-Rechner',
      description: 'Planen Sie Ihre Altersvorsorge nach deutschem Recht',
      sections: [
        {
          title: 'Persönliche Daten',
          fields: [
            { name: 'currentAge', label: 'Aktuelles Alter', type: 'number', required: true, min: 18, max: 67 },
            { name: 'retirementAge', label: 'Gewünschtes Rentenalter', type: 'number', required: true, min: 60, max: 70 },
            { name: 'currentSalary', label: 'Aktuelles Bruttojahresgehalt', type: 'currency', required: true },
            { name: 'salaryGrowthRate', label: 'Jährliche Gehaltssteigerung (%)', type: 'percentage', defaultValue: 2.5 }
          ]
        },
        {
          title: 'Aktuelle Vorsorge',
          fields: [
            { name: 'currentSavings', label: 'Bereits angespartes Vermögen', type: 'currency', defaultValue: 0 },
            { name: 'monthlyContribution', label: 'Monatliche Sparrate', type: 'currency', required: true },
            { name: 'pensionPoints', label: 'Aktuelle Rentenpunkte', type: 'number', defaultValue: 0 },
            { name: 'riesterContribution', label: 'Riester-Beitrag (monatlich)', type: 'currency', defaultValue: 0 }
          ]
        },
        {
          title: 'Anlageparameter',
          fields: [
            { name: 'expectedReturn', label: 'Erwartete jährliche Rendite (%)', type: 'percentage', defaultValue: 6 },
            { name: 'inflationRate', label: 'Erwartete Inflation (%)', type: 'percentage', defaultValue: 2 },
            { name: 'contributionGrowthRate', label: 'Jährliche Steigerung der Sparrate (%)', type: 'percentage', defaultValue: 2 }
          ]
        }
      ]
    }
  }
}

// 导出计算器实例
export const retirementCalculator = new RetirementCalculator()
