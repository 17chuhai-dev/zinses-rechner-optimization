/**
 * 保险需求计算器
 * 计算生命保险、残疾保险和其他保险的需求量
 */

import type {
  BaseCalculator,
  FormSchema,
  ValidationResult,
  CalculationResult,
  ResultDisplayConfig,
  ExportConfig
} from '@/types/calculator'

interface InsuranceInput {
  // 个人信息
  age: number
  gender: 'male' | 'female'
  smokingStatus: 'non-smoker' | 'smoker' | 'former-smoker'
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor'
  
  // 财务信息
  annualIncome: number // 年收入
  monthlyExpenses: number // 月支出
  existingDebt: number // 现有债务
  existingAssets: number // 现有资产
  
  // 家庭情况
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
  numberOfChildren: number
  spouseIncome?: number // 配偶收入
  childrenAges?: number[] // 子女年龄
  
  // 保险偏好
  coveragePeriod: number // 保障期限（年）
  inflationRate: number // 通胀率预期
  investmentReturn: number // 投资回报率预期
  
  // 特殊需求
  mortgageBalance?: number // 房贷余额
  educationFund?: number // 教育基金需求
  emergencyFund?: number // 应急基金需求
}

interface InsuranceResult extends CalculationResult {
  lifeInsurance: {
    recommendedCoverage: number // 推荐保额
    minimumCoverage: number // 最低保额
    maximumCoverage: number // 最高保额
    annualPremium: number // 年保费
    coverageBreakdown: {
      incomeReplacement: number // 收入替代
      debtCoverage: number // 债务覆盖
      childEducation: number // 子女教育
      emergencyFund: number // 应急基金
      finalExpenses: number // 最终费用
    }
  }
  disabilityInsurance: {
    recommendedBenefit: number // 推荐月给付
    waitingPeriod: number // 等待期（天）
    benefitPeriod: string // 给付期
    annualPremium: number // 年保费
  }
  healthInsurance: {
    recommendedDeductible: number // 推荐免赔额
    estimatedAnnualCost: number // 预估年费用
    coverageRecommendations: string[] // 保障建议
  }
  totalInsuranceBudget: {
    recommendedAnnualPremium: number // 推荐年保费总额
    percentageOfIncome: number // 占收入比例
    monthlyBudget: number // 月度预算
  }
  riskAnalysis: {
    riskProfile: 'low' | 'medium' | 'high' // 风险档案
    keyRisks: string[] // 主要风险
    recommendations: string[] // 建议
  }
  scenarioAnalysis: {
    scenarios: Array<{
      name: string
      description: string
      financialImpact: number
      recommendedCoverage: number
    }>
  }
}

export class InsuranceCalculator implements BaseCalculator {
  readonly id = 'insurance-calculator'
  readonly name = 'Versicherungsbedarfs-Rechner'
  readonly description = 'Berechnen Sie Ihren optimalen Versicherungsschutz für verschiedene Lebensrisiken'
  readonly category = 'insurance' as const
  readonly version = '1.0.0'
  readonly icon = 'shield-check'

  readonly formSchema: FormSchema = {
    fields: [
      {
        key: 'age',
        name: 'age',
        type: 'number',
        label: 'Alter',
        placeholder: '35',
        helpText: 'Ihr aktuelles Alter',
        required: true,
        min: 18,
        max: 80,
        defaultValue: 35,
        validation: [
          {
            type: 'required',
            message: 'Alter ist erforderlich'
          },
          {
            type: 'range',
            value: [18, 80],
            message: 'Alter muss zwischen 18 und 80 Jahren liegen'
          }
        ]
      },
      {
        key: 'gender',
        name: 'gender',
        type: 'select',
        label: 'Geschlecht',
        required: true,
        defaultValue: 'male',
        options: [
          { value: 'male', label: 'Männlich' },
          { value: 'female', label: 'Weiblich' }
        ]
      },
      {
        key: 'smokingStatus',
        name: 'smokingStatus',
        type: 'select',
        label: 'Raucherstatus',
        helpText: 'Ihr Rauchverhalten beeinflusst die Prämien erheblich',
        required: true,
        defaultValue: 'non-smoker',
        options: [
          { value: 'non-smoker', label: 'Nichtraucher' },
          { value: 'former-smoker', label: 'Ex-Raucher (>2 Jahre)' },
          { value: 'smoker', label: 'Raucher' }
        ]
      },
      {
        key: 'healthStatus',
        name: 'healthStatus',
        type: 'select',
        label: 'Gesundheitszustand',
        required: true,
        defaultValue: 'good',
        options: [
          { value: 'excellent', label: 'Ausgezeichnet' },
          { value: 'good', label: 'Gut' },
          { value: 'fair', label: 'Durchschnittlich' },
          { value: 'poor', label: 'Schlecht' }
        ]
      },
      {
        key: 'annualIncome',
        name: 'annualIncome',
        type: 'currency',
        label: 'Brutto-Jahreseinkommen (€)',
        placeholder: '60.000',
        helpText: 'Ihr aktuelles Brutto-Jahreseinkommen',
        required: true,
        min: 10000,
        max: 1000000,
        defaultValue: 60000,
        validation: [
          {
            type: 'required',
            message: 'Jahreseinkommen ist erforderlich'
          }
        ]
      },
      {
        key: 'monthlyExpenses',
        name: 'monthlyExpenses',
        type: 'currency',
        label: 'Monatliche Ausgaben (€)',
        placeholder: '3.000',
        helpText: 'Ihre gesamten monatlichen Lebenshaltungskosten',
        required: true,
        min: 500,
        max: 50000,
        defaultValue: 3000
      },
      {
        key: 'existingDebt',
        name: 'existingDebt',
        type: 'currency',
        label: 'Bestehende Schulden (€)',
        placeholder: '150.000',
        helpText: 'Hypotheken, Kredite und andere Schulden',
        required: false,
        min: 0,
        max: 5000000,
        defaultValue: 0
      },
      {
        key: 'existingAssets',
        name: 'existingAssets',
        type: 'currency',
        label: 'Vorhandene Vermögenswerte (€)',
        placeholder: '50.000',
        helpText: 'Ersparnisse, Investitionen und andere Vermögenswerte',
        required: false,
        min: 0,
        max: 10000000,
        defaultValue: 0
      },
      {
        key: 'maritalStatus',
        name: 'maritalStatus',
        type: 'select',
        label: 'Familienstand',
        required: true,
        defaultValue: 'married',
        options: [
          { value: 'single', label: 'Ledig' },
          { value: 'married', label: 'Verheiratet' },
          { value: 'divorced', label: 'Geschieden' },
          { value: 'widowed', label: 'Verwitwet' }
        ]
      },
      {
        key: 'numberOfChildren',
        name: 'numberOfChildren',
        type: 'number',
        label: 'Anzahl Kinder',
        helpText: 'Anzahl der unterhaltsberechtigten Kinder',
        required: false,
        min: 0,
        max: 10,
        defaultValue: 0
      },
      {
        key: 'spouseIncome',
        name: 'spouseIncome',
        type: 'currency',
        label: 'Einkommen des Partners (€)',
        placeholder: '40.000',
        helpText: 'Brutto-Jahreseinkommen Ihres Partners',
        required: false,
        min: 0,
        max: 1000000,
        defaultValue: 0
      },
      {
        key: 'coveragePeriod',
        name: 'coveragePeriod',
        type: 'slider',
        label: 'Gewünschte Versicherungsdauer (Jahre)',
        helpText: 'Wie lange benötigen Sie Versicherungsschutz?',
        required: true,
        min: 5,
        max: 40,
        step: 5,
        defaultValue: 20
      },
      {
        key: 'inflationRate',
        name: 'inflationRate',
        type: 'percentage',
        label: 'Erwartete Inflationsrate (%)',
        placeholder: '2,5',
        helpText: 'Erwartete jährliche Inflationsrate',
        required: false,
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 2.5
      }
    ],
    sections: [
      {
        title: 'Persönliche Angaben',
        description: 'Grundlegende Informationen zu Ihrer Person',
        fields: ['age', 'gender', 'smokingStatus', 'healthStatus'],
        defaultExpanded: true
      },
      {
        title: 'Finanzielle Situation',
        description: 'Ihre aktuelle finanzielle Lage',
        fields: ['annualIncome', 'monthlyExpenses', 'existingDebt', 'existingAssets'],
        defaultExpanded: true
      },
      {
        title: 'Familie und Abhängige',
        description: 'Informationen zu Ihrer Familie',
        fields: ['maritalStatus', 'numberOfChildren', 'spouseIncome'],
        defaultExpanded: true
      },
      {
        title: 'Versicherungsparameter',
        description: 'Konfiguration der Versicherungsberechnung',
        fields: ['coveragePeriod', 'inflationRate'],
        defaultExpanded: false
      }
    ]
  }

  readonly resultConfig: ResultDisplayConfig = {
    primaryMetrics: [
      {
        key: 'recommendedLifeCoverage',
        label: 'Empfohlene Lebensversicherung',
        format: 'currency',
        highlight: true,
        description: 'Optimale Lebensversicherungssumme'
      },
      {
        key: 'totalAnnualPremium',
        label: 'Gesamte Jahresprämie',
        format: 'currency',
        highlight: true,
        description: 'Geschätzte jährliche Versicherungskosten'
      },
      {
        key: 'percentageOfIncome',
        label: 'Anteil am Einkommen',
        format: 'percentage',
        description: 'Versicherungskosten als Prozentsatz des Einkommens'
      }
    ],
    charts: [
      {
        type: 'pie',
        title: 'Versicherungsbedarfs-Aufschlüsselung',
        dataKey: 'coverageBreakdown'
      },
      {
        type: 'bar',
        title: 'Versicherungskosten nach Typ',
        dataKey: 'premiumBreakdown'
      }
    ]
  }

  readonly exportConfig: ExportConfig = {
    formats: ['pdf', 'excel'],
    templates: [
      {
        name: 'Versicherungsbedarfs-Analyse',
        format: 'pdf',
        template: 'insurance-analysis-report',
        variables: ['lifeInsurance', 'disabilityInsurance', 'riskAnalysis']
      }
    ]
  }

  validate(input: Record<string, any>): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = []

    // 基础验证
    if (!input.age || input.age < 18 || input.age > 80) {
      errors.push({
        field: 'age',
        message: 'Alter muss zwischen 18 und 80 Jahren liegen',
        code: 'INVALID_AGE'
      })
    }

    if (!input.annualIncome || input.annualIncome < 10000) {
      errors.push({
        field: 'annualIncome',
        message: 'Jahreseinkommen muss mindestens 10.000€ betragen',
        code: 'MIN_INCOME'
      })
    }

    if (!input.monthlyExpenses || input.monthlyExpenses < 500) {
      errors.push({
        field: 'monthlyExpenses',
        message: 'Monatliche Ausgaben müssen mindestens 500€ betragen',
        code: 'MIN_EXPENSES'
      })
    }

    // 逻辑验证
    if (input.monthlyExpenses * 12 > input.annualIncome * 1.2) {
      errors.push({
        field: 'monthlyExpenses',
        message: 'Monatliche Ausgaben scheinen im Verhältnis zum Einkommen zu hoch',
        code: 'EXPENSES_TOO_HIGH'
      })
    }

    if (input.numberOfChildren > 0 && input.numberOfChildren > 10) {
      errors.push({
        field: 'numberOfChildren',
        message: 'Anzahl der Kinder muss realistisch sein',
        code: 'TOO_MANY_CHILDREN'
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  async calculate(input: Record<string, any>): Promise<InsuranceResult> {
    const validation = this.validate(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    try {
      // 计算生命保险需求
      const lifeInsurance = this.calculateLifeInsuranceNeeds(input)
      
      // 计算残疾保险需求
      const disabilityInsurance = this.calculateDisabilityInsuranceNeeds(input)
      
      // 计算健康保险建议
      const healthInsurance = this.calculateHealthInsuranceNeeds(input)
      
      // 计算总保险预算
      const totalInsuranceBudget = this.calculateTotalInsuranceBudget(lifeInsurance, disabilityInsurance, healthInsurance, input.annualIncome)
      
      // 风险分析
      const riskAnalysis = this.performRiskAnalysis(input)
      
      // 情景分析
      const scenarioAnalysis = this.performScenarioAnalysis(input, lifeInsurance.recommendedCoverage)

      return {
        finalAmount: lifeInsurance.recommendedCoverage,
        totalContributions: totalInsuranceBudget.recommendedAnnualPremium * input.coveragePeriod,
        totalInterest: 0,
        yearlyBreakdown: this.generateYearlyBreakdown(input.coveragePeriod, totalInsuranceBudget.recommendedAnnualPremium),
        lifeInsurance,
        disabilityInsurance,
        healthInsurance,
        totalInsuranceBudget,
        riskAnalysis,
        scenarioAnalysis
      }
    } catch (error) {
      console.error('Versicherungsberechnung Fehler:', error)
      throw new Error('Versicherungsberechnung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.')
    }
  }

  private calculateLifeInsuranceNeeds(input: InsuranceInput) {
    const annualExpenses = input.monthlyExpenses * 12
    const yearsOfSupport = Math.max(input.coveragePeriod, 10)
    
    // 收入替代需求
    const incomeReplacement = annualExpenses * yearsOfSupport * (1 - (input.spouseIncome || 0) / input.annualIncome)
    
    // 债务覆盖
    const debtCoverage = input.existingDebt || 0
    
    // 子女教育费用
    const childEducation = input.numberOfChildren * 50000 // 每个孩子5万欧元教育费用
    
    // 应急基金
    const emergencyFund = annualExpenses * 0.5 // 6个月支出
    
    // 最终费用（葬礼等）
    const finalExpenses = 15000
    
    // 总需求
    const totalNeed = incomeReplacement + debtCoverage + childEducation + emergencyFund + finalExpenses
    
    // 减去现有资产
    const recommendedCoverage = Math.max(0, totalNeed - (input.existingAssets || 0))
    
    // 计算保费（简化计算）
    const basePremiumRate = this.getBasePremiumRate(input.age, input.gender, input.smokingStatus, input.healthStatus)
    const annualPremium = recommendedCoverage * basePremiumRate / 1000

    return {
      recommendedCoverage,
      minimumCoverage: recommendedCoverage * 0.7,
      maximumCoverage: recommendedCoverage * 1.5,
      annualPremium,
      coverageBreakdown: {
        incomeReplacement,
        debtCoverage,
        childEducation,
        emergencyFund,
        finalExpenses
      }
    }
  }

  private calculateDisabilityInsuranceNeeds(input: InsuranceInput) {
    const monthlyIncome = input.annualIncome / 12
    const recommendedBenefit = monthlyIncome * 0.6 // 60% 收入替代
    
    // 等待期建议
    const waitingPeriod = input.existingAssets > monthlyIncome * 6 ? 180 : 90
    
    // 给付期
    const benefitPeriod = input.age < 50 ? 'Bis Rentenalter' : '10 Jahre'
    
    // 保费计算
    const disabilityPremiumRate = this.getDisabilityPremiumRate(input.age, input.gender, input.healthStatus)
    const annualPremium = recommendedBenefit * 12 * disabilityPremiumRate / 100

    return {
      recommendedBenefit,
      waitingPeriod,
      benefitPeriod,
      annualPremium
    }
  }

  private calculateHealthInsuranceNeeds(input: InsuranceInput) {
    const recommendedDeductible = Math.min(5000, input.annualIncome * 0.05)
    const estimatedAnnualCost = input.annualIncome * 0.08 // 8% des Einkommens
    
    const coverageRecommendations = [
      'Krankenversicherung mit angemessener Selbstbeteiligung',
      'Zahnzusatzversicherung',
      'Auslandsreisekrankenversicherung'
    ]

    if (input.age > 40) {
      coverageRecommendations.push('Pflegezusatzversicherung')
    }

    return {
      recommendedDeductible,
      estimatedAnnualCost,
      coverageRecommendations
    }
  }

  private calculateTotalInsuranceBudget(lifeInsurance: any, disabilityInsurance: any, healthInsurance: any, annualIncome: number) {
    const recommendedAnnualPremium = lifeInsurance.annualPremium + disabilityInsurance.annualPremium + healthInsurance.estimatedAnnualCost
    const percentageOfIncome = (recommendedAnnualPremium / annualIncome) * 100
    const monthlyBudget = recommendedAnnualPremium / 12

    return {
      recommendedAnnualPremium,
      percentageOfIncome,
      monthlyBudget
    }
  }

  private performRiskAnalysis(input: InsuranceInput) {
    let riskScore = 0
    const keyRisks: string[] = []
    const recommendations: string[] = []

    // 年龄风险
    if (input.age > 50) {
      riskScore += 2
      keyRisks.push('Erhöhtes Gesundheitsrisiko durch Alter')
    }

    // 吸烟风险
    if (input.smokingStatus === 'smoker') {
      riskScore += 3
      keyRisks.push('Erhöhtes Gesundheitsrisiko durch Rauchen')
      recommendations.push('Raucherentwöhnung zur Prämienreduzierung')
    }

    // 健康状况风险
    if (input.healthStatus === 'poor') {
      riskScore += 3
      keyRisks.push('Schlechter Gesundheitszustand')
    } else if (input.healthStatus === 'fair') {
      riskScore += 1
    }

    // 财务风险
    const debtToIncomeRatio = (input.existingDebt || 0) / input.annualIncome
    if (debtToIncomeRatio > 0.4) {
      riskScore += 2
      keyRisks.push('Hohe Verschuldung')
      recommendations.push('Schuldenabbau priorisieren')
    }

    // 家庭风险
    if (input.numberOfChildren > 0 && input.maritalStatus === 'single') {
      riskScore += 2
      keyRisks.push('Alleinerziehend mit Kindern')
      recommendations.push('Erhöhter Versicherungsschutz empfohlen')
    }

    let riskProfile: 'low' | 'medium' | 'high' = 'low'
    if (riskScore >= 6) riskProfile = 'high'
    else if (riskScore >= 3) riskProfile = 'medium'

    if (recommendations.length === 0) {
      recommendations.push('Regelmäßige Überprüfung des Versicherungsschutzes')
      recommendations.push('Gesunde Lebensweise zur Prämienoptimierung')
    }

    return {
      riskProfile,
      keyRisks,
      recommendations
    }
  }

  private performScenarioAnalysis(input: InsuranceInput, baseCoverage: number) {
    const scenarios = [
      {
        name: 'Plötzlicher Tod',
        description: 'Unerwarteter Tod des Hauptverdieners',
        financialImpact: input.annualIncome * 10,
        recommendedCoverage: baseCoverage
      },
      {
        name: 'Berufsunfähigkeit',
        description: 'Langfristige Arbeitsunfähigkeit',
        financialImpact: input.annualIncome * 0.6 * 10,
        recommendedCoverage: baseCoverage * 0.6
      },
      {
        name: 'Schwere Krankheit',
        description: 'Kritische Krankheit mit hohen Behandlungskosten',
        financialImpact: 100000,
        recommendedCoverage: 100000
      }
    ]

    return { scenarios }
  }

  private getBasePremiumRate(age: number, gender: string, smokingStatus: string, healthStatus: string): number {
    let baseRate = 2 // Basis: 2€ pro 1000€ Versicherungssumme

    // 年龄调整
    if (age > 50) baseRate += 2
    else if (age > 40) baseRate += 1
    else if (age < 30) baseRate -= 0.5

    // 性别调整
    if (gender === 'male') baseRate += 0.5

    // 吸烟调整
    if (smokingStatus === 'smoker') baseRate += 3
    else if (smokingStatus === 'former-smoker') baseRate += 1

    // 健康状况调整
    if (healthStatus === 'poor') baseRate += 4
    else if (healthStatus === 'fair') baseRate += 2
    else if (healthStatus === 'excellent') baseRate -= 0.5

    return Math.max(1, baseRate)
  }

  private getDisabilityPremiumRate(age: number, gender: string, healthStatus: string): number {
    let baseRate = 2.5 // Basis: 2.5% der Jahresleistung

    if (age > 50) baseRate += 1
    else if (age > 40) baseRate += 0.5

    if (gender === 'female') baseRate += 0.3 // Höheres BU-Risiko bei Frauen

    if (healthStatus === 'poor') baseRate += 2
    else if (healthStatus === 'fair') baseRate += 1

    return Math.max(1.5, baseRate)
  }

  private generateYearlyBreakdown(coveragePeriod: number, annualPremium: number) {
    const breakdown = []
    for (let year = 1; year <= Math.min(coveragePeriod, 10); year++) {
      breakdown.push({
        year,
        start_amount: 0,
        contributions: annualPremium,
        interest: 0,
        end_amount: 0,
        growth_rate: 0
      })
    }
    return breakdown
  }
}

// 创建并导出实例
export const insuranceCalculator = new InsuranceCalculator()
