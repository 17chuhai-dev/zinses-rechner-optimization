/**
 * 德国税务优化计算器
 * 符合德国税法和优化策略
 */

import type { BaseCalculator, CalculationInput, CalculationResult } from '@/types/calculator'

// 税务优化输入
export interface TaxOptimizationInput extends CalculationInput {
  // 基本收入信息
  grossAnnualIncome: number
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
  taxClass: 1 | 2 | 3 | 4 | 5 | 6
  children: number
  churchTaxPayer: boolean

  // 投资和储蓄
  capitalGains: number
  dividendIncome: number
  rentalIncome: number
  savingsInterest: number

  // 可扣除项目
  workRelatedExpenses: number // 工作相关费用
  specialExpenses: number // 特殊支出
  extraordinaryExpenses: number // 特别支出
  donationsAmount: number // 捐款

  // 养老保险贡献
  pensionContributions: number
  riesterContributions: number
  ruerupContributions: number // Rürup养老金

  // 其他扣除
  healthInsurancePremiums: number
  lifeInsurancePremiums: number
  disabilityInsurancePremiums: number

  // 房产相关
  homeOwnership: boolean
  mortgageInterest: number
  propertyTax: number
  maintenanceCosts: number

  // 优化目标
  optimizationGoal: 'minimize_tax' | 'maximize_net_income' | 'optimize_retirement' | 'balance_all'
}

// 税务优化结果
export interface TaxOptimizationResult extends CalculationResult {
  // 当前税务状况
  currentTaxBurden: {
    incomeTax: number
    solidaritySurcharge: number
    churchTax: number
    totalTax: number
    effectiveTaxRate: number
    marginalTaxRate: number
  }

  // 资本利得税
  capitalGainsTax: {
    abgeltungssteuer: number
    sparerpauschbetrag: number // 储蓄免税额
    optimizedTax: number
    savings: number
  }

  // 净收入分析
  netIncome: {
    fromEmployment: number
    fromCapitalGains: number
    fromRental: number
    total: number
    monthlyNet: number
  }

  // 优化建议
  optimizations: Array<{
    category: 'deductions' | 'investments' | 'timing' | 'structure'
    title: string
    description: string
    potentialSavings: number
    implementation: string
    priority: 'high' | 'medium' | 'low'
    germanSpecific: boolean
  }>

  // 德国特定分析
  germanTaxBenefits: {
    riesterBonus: number // Riester国家补贴
    childBenefit: number // 儿童津贴
    kindergeld: number // 儿童金
    wohnungsbauprämie: number // 住房建设奖金
    arbeitnehmerSparzulage: number // 员工储蓄补贴
  }

  // 年度税务规划
  annualTaxPlanning: {
    q1Recommendations: string[]
    q2Recommendations: string[]
    q3Recommendations: string[]
    q4Recommendations: string[]
  }

  // 长期税务策略
  longTermStrategy: {
    retirementTaxOptimization: string
    estateplanningAdvice: string
    investmentStructuring: string
  }
}

/**
 * 德国税务优化计算器实现
 */
export class TaxOptimizationCalculator implements BaseCalculator {
  id = 'tax-optimization'
  name = 'Steueroptimierungs-Rechner'
  description = 'Optimieren Sie Ihre Steuerlast nach deutschem Recht'
  category = 'tax' as const
  icon = 'document-text'

  // 德国税务常数 (2024年)
  private readonly TAX_BRACKETS_2024 = [
    { min: 0, max: 11604, rate: 0 }, // 基本免税额
    { min: 11605, max: 17005, rate: 0.14 }, // 入门税率
    { min: 17006, max: 66760, rate: 0.24 }, // 线性递增
    { min: 66761, max: 277825, rate: 0.42 }, // 高税率
    { min: 277826, max: Infinity, rate: 0.45 } // 最高税率
  ]

  private readonly SOLIDARITY_SURCHARGE_RATE = 0.055
  private readonly CHURCH_TAX_RATE = 0.08 // 平均教会税率
  private readonly SPARERPAUSCHBETRAG_2024 = 1000 // 储蓄免税额
  private readonly KINDERGELD_2024 = 250 // 每月儿童金
  private readonly RIESTER_BASIC_BONUS = 175 // Riester基本奖金
  private readonly RIESTER_CHILD_BONUS = 300 // Riester儿童奖金

  async calculate(input: TaxOptimizationInput): Promise<TaxOptimizationResult> {
    // 验证输入
    this.validateInput(input)

    // 计算当前税务负担
    const currentTaxBurden = this.calculateCurrentTaxBurden(input)

    // 计算资本利得税
    const capitalGainsTax = this.calculateCapitalGainsTax(input)

    // 计算净收入
    const netIncome = this.calculateNetIncome(input, currentTaxBurden, capitalGainsTax)

    // 计算德国特定税收优惠
    const germanTaxBenefits = this.calculateGermanTaxBenefits(input)

    // 生成优化建议
    const optimizations = this.generateOptimizations(input, currentTaxBurden)

    // 年度税务规划
    const annualTaxPlanning = this.generateAnnualTaxPlanning(input)

    // 长期税务策略
    const longTermStrategy = this.generateLongTermStrategy(input)

    return {
      // 基础CalculationResult属性
      final_amount: netIncome.total,
      total_contributions: input.grossAnnualIncome,
      total_interest: netIncome.total - input.grossAnnualIncome,
      annual_return: 0,
      yearly_breakdown: [{
        year: new Date().getFullYear(),
        start_amount: input.grossAnnualIncome,
        contributions: 0,
        end_amount: netIncome.total,
        interest: netIncome.total - input.grossAnnualIncome,
        growth_rate: 0
      }],
      calculation_time: new Date().toISOString(),

      currentTaxBurden,
      capitalGainsTax,
      netIncome,
      optimizations,
      germanTaxBenefits,
      annualTaxPlanning,
      longTermStrategy
    }
  }

  /**
   * 验证输入参数
   */
  private validateInput(input: TaxOptimizationInput): void {
    if (input.grossAnnualIncome < 0) {
      throw new Error('Bruttojahreseinkommen darf nicht negativ sein')
    }

    if (input.children < 0 || input.children > 20) {
      throw new Error('Anzahl der Kinder muss zwischen 0 und 20 liegen')
    }

    if (![1, 2, 3, 4, 5, 6].includes(input.taxClass)) {
      throw new Error('Steuerklasse muss zwischen 1 und 6 liegen')
    }
  }

  /**
   * 计算当前税务负担
   */
  private calculateCurrentTaxBurden(input: TaxOptimizationInput): {
    incomeTax: number
    solidaritySurcharge: number
    churchTax: number
    totalTax: number
    effectiveTaxRate: number
    marginalTaxRate: number
  } {
    // 计算应税收入
    const taxableIncome = this.calculateTaxableIncome(input)

    // 计算所得税
    const incomeTax = this.calculateIncomeTax(taxableIncome, input.taxClass)

    // 计算团结附加税
    const solidaritySurcharge = incomeTax > 972 ? // 免征额
      Math.max(0, (incomeTax - 972) * this.SOLIDARITY_SURCHARGE_RATE) : 0

    // 计算教会税
    const churchTax = input.churchTaxPayer ? incomeTax * this.CHURCH_TAX_RATE : 0

    const totalTax = incomeTax + solidaritySurcharge + churchTax
    const effectiveTaxRate = input.grossAnnualIncome > 0 ? totalTax / input.grossAnnualIncome : 0

    // 计算边际税率
    const marginalTaxRate = this.calculateMarginalTaxRate(taxableIncome)

    return {
      incomeTax,
      solidaritySurcharge,
      churchTax,
      totalTax,
      effectiveTaxRate,
      marginalTaxRate
    }
  }

  /**
   * 计算应税收入
   */
  private calculateTaxableIncome(input: TaxOptimizationInput): number {
    let taxableIncome = input.grossAnnualIncome

    // 扣除工作相关费用
    taxableIncome -= Math.max(input.workRelatedExpenses, 1230) // 最低工作费用扣除

    // 扣除特殊支出
    taxableIncome -= input.specialExpenses

    // 扣除特别支出
    taxableIncome -= input.extraordinaryExpenses

    // 扣除养老保险贡献
    taxableIncome -= input.pensionContributions
    taxableIncome -= input.riesterContributions
    taxableIncome -= Math.min(input.ruerupContributions, 27565) // Rürup最大扣除额

    // 扣除保险费
    const maxInsuranceDeduction = 1900 // 单身最大保险扣除额
    const totalInsurance = input.healthInsurancePremiums + input.lifeInsurancePremiums + input.disabilityInsurancePremiums
    taxableIncome -= Math.min(totalInsurance, maxInsuranceDeduction)

    return Math.max(0, taxableIncome)
  }

  /**
   * 计算所得税
   */
  private calculateIncomeTax(taxableIncome: number, taxClass: number): number {
    let tax = 0

    for (const bracket of this.TAX_BRACKETS_2024) {
      const taxableInThisBracket = Math.min(
        Math.max(0, taxableIncome - bracket.min),
        bracket.max - bracket.min
      )

      if (taxableInThisBracket > 0) {
        tax += taxableInThisBracket * bracket.rate
      }

      if (taxableIncome <= bracket.max) break
    }

    // 税级调整（简化）
    const taxClassMultipliers: Record<number, number> = { 1: 1, 2: 1, 3: 0.5, 4: 1, 5: 1.4, 6: 1 }
    return tax * (taxClassMultipliers[taxClass] || 1)
  }

  /**
   * 计算边际税率
   */
  private calculateMarginalTaxRate(taxableIncome: number): number {
    for (const bracket of this.TAX_BRACKETS_2024) {
      if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
        return bracket.rate
      }
    }
    return 0.45 // 最高税率
  }

  /**
   * 计算资本利得税
   */
  private calculateCapitalGainsTax(input: TaxOptimizationInput): {
    abgeltungssteuer: number
    sparerpauschbetrag: number
    optimizedTax: number
    savings: number
  } {
    const totalCapitalGains = input.capitalGains + input.dividendIncome + input.savingsInterest

    // 应用储蓄免税额
    const taxableGains = Math.max(0, totalCapitalGains - this.SPARERPAUSCHBETRAG_2024)

    // 计算资本利得税
    const abgeltungssteuer = taxableGains * 0.25
    const solidarityOnCapitalGains = abgeltungssteuer * this.SOLIDARITY_SURCHARGE_RATE
    const churchTaxOnCapitalGains = input.churchTaxPayer ? abgeltungssteuer * this.CHURCH_TAX_RATE : 0

    const totalCapitalGainsTax = abgeltungssteuer + solidarityOnCapitalGains + churchTaxOnCapitalGains

    // 优化后的税务（通过策略优化）
    const optimizedTax = this.optimizeCapitalGainsTax(input, totalCapitalGainsTax)
    const savings = totalCapitalGainsTax - optimizedTax

    return {
      abgeltungssteuer: totalCapitalGainsTax,
      sparerpauschbetrag: Math.min(totalCapitalGains, this.SPARERPAUSCHBETRAG_2024),
      optimizedTax,
      savings
    }
  }

  /**
   * 计算净收入
   */
  private calculateNetIncome(
    input: TaxOptimizationInput,
    taxBurden: any,
    capitalGainsTax: any
  ): {
    fromEmployment: number
    fromCapitalGains: number
    fromRental: number
    total: number
    monthlyNet: number
  } {
    const fromEmployment = input.grossAnnualIncome - taxBurden.totalTax
    const fromCapitalGains = (input.capitalGains + input.dividendIncome + input.savingsInterest) - capitalGainsTax.optimizedTax

    // 租金收入税务处理
    const rentalTaxRate = taxBurden.marginalTaxRate
    const fromRental = input.rentalIncome * (1 - rentalTaxRate)

    const total = fromEmployment + fromCapitalGains + fromRental
    const monthlyNet = total / 12

    return {
      fromEmployment,
      fromCapitalGains,
      fromRental,
      total,
      monthlyNet
    }
  }

  /**
   * 计算德国特定税收优惠
   */
  private calculateGermanTaxBenefits(input: TaxOptimizationInput): {
    riesterBonus: number
    childBenefit: number
    kindergeld: number
    wohnungsbauprämie: number
    arbeitnehmerSparzulage: number
  } {
    // Riester奖金
    let riesterBonus = this.RIESTER_BASIC_BONUS
    riesterBonus += input.children * this.RIESTER_CHILD_BONUS

    // 儿童津贴
    const kindergeld = input.children * this.KINDERGELD_2024 * 12

    // 住房建设奖金（简化计算）
    const wohnungsbauprämie = input.homeOwnership ? 512 : 0 // 年度最大奖金

    // 员工储蓄补贴（简化）
    const arbeitnehmerSparzulage = input.grossAnnualIncome < 40000 ? 470 : 0

    return {
      riesterBonus,
      childBenefit: kindergeld,
      kindergeld,
      wohnungsbauprämie,
      arbeitnehmerSparzulage
    }
  }

  /**
   * 生成优化建议
   */
  private generateOptimizations(input: TaxOptimizationInput, taxBurden: any): Array<{
    category: 'deductions' | 'investments' | 'timing' | 'structure'
    title: string
    description: string
    potentialSavings: number
    implementation: string
    priority: 'high' | 'medium' | 'low'
    germanSpecific: boolean
  }> {
    const optimizations = []

    // 工作费用优化
    if (input.workRelatedExpenses < 1230) {
      optimizations.push({
        category: 'deductions' as const,
        title: 'Werbungskosten optimieren',
        description: 'Sammeln Sie alle berufsbedingten Ausgaben für höhere Steuerersparnis.',
        potentialSavings: (1230 - input.workRelatedExpenses) * taxBurden.marginalTaxRate,
        implementation: 'Führen Sie ein Fahrtenbuch, sammeln Sie Belege für Fortbildungen und Arbeitsmittel.',
        priority: 'high' as const,
        germanSpecific: true
      })
    }

    // Riester优化
    if (input.riesterContributions < 2100) {
      const additionalContribution = 2100 - input.riesterContributions
      optimizations.push({
        category: 'investments' as const,
        title: 'Riester-Rente ausschöpfen',
        description: 'Nutzen Sie die volle staatliche Förderung der Riester-Rente.',
        potentialSavings: this.RIESTER_BASIC_BONUS + (input.children * this.RIESTER_CHILD_BONUS),
        implementation: `Erhöhen Sie Ihren Riester-Beitrag um €${additionalContribution} jährlich.`,
        priority: 'high' as const,
        germanSpecific: true
      })
    }

    // 储蓄免税额优化
    const capitalGainsTotal = input.capitalGains + input.dividendIncome + input.savingsInterest
    if (capitalGainsTotal < this.SPARERPAUSCHBETRAG_2024) {
      optimizations.push({
        category: 'investments' as const,
        title: 'Sparerpauschbetrag nutzen',
        description: 'Nutzen Sie den vollen Sparerpauschbetrag von €1.000.',
        potentialSavings: (this.SPARERPAUSCHBETRAG_2024 - capitalGainsTotal) * 0.25,
        implementation: 'Investieren Sie in dividendenstarke ETFs oder Tagesgeld.',
        priority: 'medium' as const,
        germanSpecific: true
      })
    }

    // 捐款优化
    const maxDonationDeduction = input.grossAnnualIncome * 0.20 // 最大20%可扣除
    if (input.donationsAmount < maxDonationDeduction * 0.1) {
      optimizations.push({
        category: 'deductions' as const,
        title: 'Spenden steuerlich nutzen',
        description: 'Spenden können bis zu 20% des Einkommens steuerlich abgesetzt werden.',
        potentialSavings: input.grossAnnualIncome * 0.02 * taxBurden.marginalTaxRate,
        implementation: 'Planen Sie regelmäßige Spenden an gemeinnützige Organisationen.',
        priority: 'low' as const,
        germanSpecific: true
      })
    }

    // 时机优化
    if (input.capitalGains > 10000) {
      optimizations.push({
        category: 'timing' as const,
        title: 'Verlustverrechnung nutzen',
        description: 'Realisieren Sie Verluste zur Verrechnung mit Gewinnen.',
        potentialSavings: input.capitalGains * 0.05 * 0.25, // 5%的损失实现
        implementation: 'Verkaufen Sie verlustbringende Positionen vor Jahresende.',
        priority: 'medium' as const,
        germanSpecific: true
      })
    }

    return optimizations.sort((a, b) => b.potentialSavings - a.potentialSavings)
  }

  /**
   * 生成年度税务规划
   */
  private generateAnnualTaxPlanning(input: TaxOptimizationInput): {
    q1Recommendations: string[]
    q2Recommendations: string[]
    q3Recommendations: string[]
    q4Recommendations: string[]
  } {
    return {
      q1Recommendations: [
        'Steuererklärung für Vorjahr einreichen',
        'Riester-Beiträge für das Jahr planen',
        'Werbungskosten-Belege sammeln starten'
      ],
      q2Recommendations: [
        'Halbjahres-Portfolio-Review durchführen',
        'Spenden für erste Jahreshälfte dokumentieren',
        'Fortbildungskosten planen und buchen'
      ],
      q3Recommendations: [
        'Verlustverrechnung vorbereiten',
        'Sonderausgaben für Q4 planen',
        'Riester-Beiträge anpassen falls nötig'
      ],
      q4Recommendations: [
        'Verluste realisieren für Steueroptimierung',
        'Letzte Spenden tätigen',
        'Alle Belege für Steuererklärung sammeln',
        'Vorauszahlungen für nächstes Jahr anpassen'
      ]
    }
  }

  /**
   * 生成长期税务策略
   */
  private generateLongTermStrategy(input: TaxOptimizationInput): {
    retirementTaxOptimization: string
    estateplanningAdvice: string
    investmentStructuring: string
  } {
    return {
      retirementTaxOptimization: 'Nutzen Sie die drei Säulen der Altersvorsorge optimal: gesetzliche Rente, betriebliche Altersvorsorge und private Vorsorge.',
      estateplanningAdvice: 'Planen Sie Schenkungen und Erbschaften unter Nutzung der Freibeträge alle 10 Jahre.',
      investmentStructuring: 'Strukturieren Sie Investments steueroptimal: thesaurierende ETFs für langfristige Anlagen, ausschüttende für laufende Erträge.'
    }
  }

  /**
   * 优化资本利得税
   */
  private optimizeCapitalGainsTax(input: TaxOptimizationInput, currentTax: number): number {
    // 通过策略优化减少税负
    let optimizedTax = currentTax

    // 策略1：充分利用储蓄免税额
    const unusedAllowance = Math.max(0, this.SPARERPAUSCHBETRAG_2024 -
      (input.capitalGains + input.dividendIncome + input.savingsInterest))
    optimizedTax -= unusedAllowance * 0.25

    // 策略2：损失实现
    if (input.capitalGains > 5000) {
      const potentialLossRealization = input.capitalGains * 0.1 // 假设10%损失可实现
      optimizedTax -= potentialLossRealization * 0.25
    }

    return Math.max(0, optimizedTax)
  }

  /**
   * 获取表单配置
   */
  getFormSchema() {
    return {
      title: 'Steueroptimierungs-Rechner',
      description: 'Optimieren Sie Ihre Steuerlast nach deutschem Recht',
      sections: [
        {
          title: 'Grunddaten',
          fields: [
            { name: 'grossAnnualIncome', label: 'Bruttojahreseinkommen', type: 'currency', required: true },
            { name: 'maritalStatus', label: 'Familienstand', type: 'select', options: [
              { value: 'single', label: 'Ledig' },
              { value: 'married', label: 'Verheiratet' },
              { value: 'divorced', label: 'Geschieden' },
              { value: 'widowed', label: 'Verwitwet' }
            ], required: true },
            { name: 'taxClass', label: 'Steuerklasse', type: 'select', options: [
              { value: 1, label: 'Klasse I' },
              { value: 2, label: 'Klasse II' },
              { value: 3, label: 'Klasse III' },
              { value: 4, label: 'Klasse IV' },
              { value: 5, label: 'Klasse V' },
              { value: 6, label: 'Klasse VI' }
            ], required: true },
            { name: 'children', label: 'Anzahl Kinder', type: 'number', defaultValue: 0 }
          ]
        },
        {
          title: 'Kapitalerträge',
          fields: [
            { name: 'capitalGains', label: 'Kursgewinne', type: 'currency', defaultValue: 0 },
            { name: 'dividendIncome', label: 'Dividendenerträge', type: 'currency', defaultValue: 0 },
            { name: 'savingsInterest', label: 'Zinserträge', type: 'currency', defaultValue: 0 },
            { name: 'rentalIncome', label: 'Mieteinnahmen', type: 'currency', defaultValue: 0 }
          ]
        },
        {
          title: 'Abzugsfähige Ausgaben',
          fields: [
            { name: 'workRelatedExpenses', label: 'Werbungskosten', type: 'currency', defaultValue: 1230 },
            { name: 'specialExpenses', label: 'Sonderausgaben', type: 'currency', defaultValue: 0 },
            { name: 'donationsAmount', label: 'Spenden', type: 'currency', defaultValue: 0 },
            { name: 'pensionContributions', label: 'Rentenbeiträge', type: 'currency', defaultValue: 0 }
          ]
        }
      ]
    }
  }
}

// 导出计算器实例
export const taxOptimizationCalculator = new TaxOptimizationCalculator()
