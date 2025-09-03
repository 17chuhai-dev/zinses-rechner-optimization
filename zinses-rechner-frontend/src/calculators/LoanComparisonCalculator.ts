/**
 * 贷款比较计算器
 * 比较多个贷款方案，帮助用户选择最优贷款产品
 */

import type {
  BaseCalculator,
  FormSchema,
  ValidationResult,
  CalculationResult,
  ResultDisplayConfig,
  ExportConfig
} from '@/types/calculator'

interface LoanOption {
  name: string
  loanAmount: number // 贷款金额
  interestRate: number // 年利率 (%)
  termYears: number // 贷款期限（年）
  processingFee: number // 手续费
  monthlyFee: number // 月管理费
  earlyRepaymentPenalty: number // 提前还款违约金 (%)
  loanType: 'fixed' | 'variable' | 'mixed' // 利率类型
}

interface LoanComparisonInput {
  loanOptions: LoanOption[]
  monthlyIncomeAfterTax: number // 税后月收入
  existingMonthlyDebt: number // 现有月债务
  downPayment?: number // 首付款（房贷情况）
  propertyValue?: number // 房产价值（房贷情况）
}

interface LoanComparisonResult extends CalculationResult {
  loanComparison: {
    bestOption: string // 最优方案名称
    worstOption: string // 最差方案名称
    savings: number // 选择最优方案的节省金额
  }
  loanDetails: Array<{
    name: string
    monthlyPayment: number // 月供
    totalPayment: number // 总还款额
    totalInterest: number // 总利息
    effectiveRate: number // 实际年利率
    debtToIncomeRatio: number // 债务收入比
    affordabilityScore: number // 负担能力评分 (0-100)
    paymentSchedule: Array<{
      month: number
      payment: number
      principal: number
      interest: number
      balance: number
    }>
    pros: string[] // 优点
    cons: string[] // 缺点
  }>
  affordabilityAnalysis: {
    recommendedMaxLoan: number // 推荐最大贷款额
    maxAffordablePayment: number // 最大可承受月供
    riskLevel: 'low' | 'medium' | 'high' // 风险等级
    recommendations: string[] // 建议
  }
  sensitivityAnalysis: {
    rateIncrease: Array<{
      rateChange: number // 利率变化 (%)
      newPayment: number // 新月供
      additionalCost: number // 额外成本
    }>
  }
}

export class LoanComparisonCalculator implements BaseCalculator {
  readonly id = 'loan-comparison'
  readonly name = 'Kredit-Vergleich'
  readonly description = 'Vergleichen Sie verschiedene Kreditangebote und finden Sie die beste Option'
  readonly category = 'loan' as const
  readonly version = '1.0.0'
  readonly icon = 'scale'

  readonly formSchema: FormSchema = {
    fields: [
      {
        key: 'monthlyIncomeAfterTax',
        name: 'monthlyIncomeAfterTax',
        type: 'currency',
        label: 'Netto-Monatseinkommen (€)',
        placeholder: '3.500',
        helpText: 'Ihr monatliches Einkommen nach Steuern',
        required: true,
        min: 500,
        max: 50000,
        defaultValue: 3500,
        validation: [
          {
            type: 'required',
            message: 'Monatseinkommen ist erforderlich'
          },
          {
            type: 'min',
            value: 500,
            message: 'Monatseinkommen muss mindestens 500€ betragen'
          }
        ]
      },
      {
        key: 'existingMonthlyDebt',
        name: 'existingMonthlyDebt',
        type: 'currency',
        label: 'Bestehende monatliche Schulden (€)',
        placeholder: '500',
        helpText: 'Ihre aktuellen monatlichen Kreditverpflichtungen',
        required: false,
        min: 0,
        max: 10000,
        defaultValue: 0
      },
      {
        key: 'downPayment',
        name: 'downPayment',
        type: 'currency',
        label: 'Eigenkapital (€)',
        placeholder: '50.000',
        helpText: 'Verfügbares Eigenkapital (bei Immobilienfinanzierung)',
        required: false,
        min: 0,
        max: 2000000,
        defaultValue: 0
      },
      {
        key: 'propertyValue',
        name: 'propertyValue',
        type: 'currency',
        label: 'Immobilienwert (€)',
        placeholder: '300.000',
        helpText: 'Wert der zu finanzierenden Immobilie',
        required: false,
        min: 0,
        max: 5000000,
        defaultValue: 0
      }
    ],
    sections: [
      {
        title: 'Finanzielle Situation',
        description: 'Geben Sie Ihre finanzielle Situation an',
        fields: ['monthlyIncomeAfterTax', 'existingMonthlyDebt'],
        defaultExpanded: true
      },
      {
        title: 'Immobilienfinanzierung (optional)',
        description: 'Nur bei Immobilienkrediten ausfüllen',
        fields: ['downPayment', 'propertyValue'],
        defaultExpanded: false
      }
    ]
  }

  readonly resultConfig: ResultDisplayConfig = {
    primaryMetrics: [
      {
        key: 'bestOption',
        label: 'Beste Option',
        format: 'text',
        highlight: true,
        description: 'Empfohlene Kreditoption'
      },
      {
        key: 'savings',
        label: 'Ersparnis',
        format: 'currency',
        highlight: true,
        description: 'Ersparnis gegenüber der teuersten Option'
      },
      {
        key: 'riskLevel',
        label: 'Risikobewertung',
        format: 'text',
        description: 'Bewertung Ihrer finanziellen Belastung'
      }
    ],
    charts: [
      {
        type: 'bar',
        title: 'Monatliche Raten im Vergleich',
        dataKey: 'monthlyPayments'
      },
      {
        type: 'bar',
        title: 'Gesamtkosten im Vergleich',
        dataKey: 'totalCosts'
      },
      {
        type: 'line',
        title: 'Tilgungsverlauf',
        dataKey: 'paymentSchedule'
      }
    ],
    tables: [
      {
        title: 'Detaillierter Kreditvergleich',
        dataKey: 'loanDetails',
        columns: [
          { key: 'name', label: 'Kreditoption', sortable: true },
          { key: 'monthlyPayment', label: 'Monatsrate', format: 'currency', sortable: true },
          { key: 'totalInterest', label: 'Gesamtzinsen', format: 'currency', sortable: true },
          { key: 'effectiveRate', label: 'Effektivzins', format: 'percentage', sortable: true },
          { key: 'affordabilityScore', label: 'Bewertung', format: 'number', sortable: true }
        ],
        exportable: true
      }
    ]
  }

  readonly exportConfig: ExportConfig = {
    formats: ['pdf', 'excel', 'csv'],
    templates: [
      {
        name: 'Kreditvergleich Bericht',
        format: 'pdf',
        template: 'loan-comparison-report',
        variables: ['loanComparison', 'loanDetails', 'affordabilityAnalysis']
      }
    ]
  }

  validate(input: Record<string, any>): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = []

    // 基础收入验证
    if (!input.monthlyIncomeAfterTax || input.monthlyIncomeAfterTax < 500) {
      errors.push({
        field: 'monthlyIncomeAfterTax',
        message: 'Monatseinkommen muss mindestens 500€ betragen',
        code: 'MIN_INCOME'
      })
    }

    // 贷款选项验证
    if (!input.loanOptions || !Array.isArray(input.loanOptions) || input.loanOptions.length === 0) {
      errors.push({
        field: 'loanOptions',
        message: 'Mindestens eine Kreditoption ist erforderlich',
        code: 'NO_LOAN_OPTIONS'
      })
    } else {
      input.loanOptions.forEach((loan: LoanOption, index: number) => {
        if (!loan.name || loan.name.trim() === '') {
          errors.push({
            field: `loanOptions.${index}.name`,
            message: `Name für Kreditoption ${index + 1} ist erforderlich`,
            code: 'MISSING_LOAN_NAME'
          })
        }

        if (!loan.loanAmount || loan.loanAmount <= 0) {
          errors.push({
            field: `loanOptions.${index}.loanAmount`,
            message: `Kreditbetrag für Option ${index + 1} muss größer als 0 sein`,
            code: 'INVALID_LOAN_AMOUNT'
          })
        }

        if (loan.interestRate < 0 || loan.interestRate > 50) {
          errors.push({
            field: `loanOptions.${index}.interestRate`,
            message: `Zinssatz für Option ${index + 1} muss zwischen 0% und 50% liegen`,
            code: 'INVALID_INTEREST_RATE'
          })
        }

        if (!loan.termYears || loan.termYears <= 0 || loan.termYears > 50) {
          errors.push({
            field: `loanOptions.${index}.termYears`,
            message: `Laufzeit für Option ${index + 1} muss zwischen 1 und 50 Jahren liegen`,
            code: 'INVALID_TERM'
          })
        }
      })
    }

    // 房产价值和首付验证
    if (input.propertyValue && input.downPayment && input.downPayment > input.propertyValue) {
      errors.push({
        field: 'downPayment',
        message: 'Eigenkapital kann nicht höher als der Immobilienwert sein',
        code: 'DOWNPAYMENT_TOO_HIGH'
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  async calculate(input: Record<string, any>): Promise<LoanComparisonResult> {
    const validation = this.validate(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    try {
      const loanOptions: LoanOption[] = input.loanOptions || []
      const monthlyIncome = input.monthlyIncomeAfterTax
      const existingDebt = input.existingMonthlyDebt || 0

      // 计算每个贷款选项的详细信息
      const loanDetails = loanOptions.map(loan => this.calculateLoanDetails(loan, monthlyIncome, existingDebt))

      // 找出最优和最差选项
      const sortedByTotalCost = [...loanDetails].sort((a, b) => a.totalPayment - b.totalPayment)
      const bestOption = sortedByTotalCost[0]
      const worstOption = sortedByTotalCost[sortedByTotalCost.length - 1]
      const savings = worstOption.totalPayment - bestOption.totalPayment

      // 负担能力分析
      const affordabilityAnalysis = this.calculateAffordabilityAnalysis(monthlyIncome, existingDebt, input.propertyValue)

      // 敏感性分析
      const sensitivityAnalysis = this.calculateSensitivityAnalysis(bestOption, loanOptions[0])

      // 计算总体指标
      const totalContributions = bestOption.name ? loanOptions.find(l => l.name === bestOption.name)?.loanAmount || 0 : 0
      const totalInterest = bestOption.totalInterest
      const finalAmount = totalContributions + totalInterest

      return {
        finalAmount,
        totalContributions,
        totalInterest,
        yearlyBreakdown: this.generateYearlyBreakdown(bestOption),
        loanComparison: {
          bestOption: bestOption.name,
          worstOption: worstOption.name,
          savings
        },
        loanDetails,
        affordabilityAnalysis,
        sensitivityAnalysis
      }
    } catch (error) {
      console.error('Kreditvergleich Fehler:', error)
      throw new Error('Kreditvergleich fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.')
    }
  }

  private calculateLoanDetails(loan: LoanOption, monthlyIncome: number, existingDebt: number) {
    // 计算月供
    const monthlyRate = loan.interestRate / 100 / 12
    const totalPayments = loan.termYears * 12
    const monthlyPayment = loan.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1)

    // 计算总还款额和总利息
    const totalPayment = monthlyPayment * totalPayments + loan.processingFee + (loan.monthlyFee * totalPayments)
    const totalInterest = totalPayment - loan.loanAmount

    // 计算实际年利率（包含费用）
    const effectiveRate = this.calculateEffectiveRate(loan.loanAmount, monthlyPayment + loan.monthlyFee, totalPayments, loan.processingFee)

    // 债务收入比
    const debtToIncomeRatio = ((monthlyPayment + existingDebt) / monthlyIncome) * 100

    // 负担能力评分
    const affordabilityScore = this.calculateAffordabilityScore(debtToIncomeRatio, loan.interestRate, loan.loanType)

    // 生成还款计划
    const paymentSchedule = this.generatePaymentSchedule(loan.loanAmount, monthlyRate, totalPayments, monthlyPayment)

    // 优缺点分析
    const { pros, cons } = this.analyzeLoanOption(loan, debtToIncomeRatio, effectiveRate)

    return {
      name: loan.name,
      monthlyPayment,
      totalPayment,
      totalInterest,
      effectiveRate,
      debtToIncomeRatio,
      affordabilityScore,
      paymentSchedule,
      pros,
      cons
    }
  }

  private calculateEffectiveRate(loanAmount: number, monthlyPayment: number, totalPayments: number, processingFee: number): number {
    // 简化的实际年利率计算
    const totalPaid = monthlyPayment * totalPayments + processingFee
    const totalInterest = totalPaid - loanAmount
    return (totalInterest / loanAmount / (totalPayments / 12)) * 100
  }

  private calculateAffordabilityScore(debtToIncomeRatio: number, interestRate: number, loanType: string): number {
    let score = 100

    // 债务收入比影响
    if (debtToIncomeRatio > 40) score -= 30
    else if (debtToIncomeRatio > 30) score -= 15
    else if (debtToIncomeRatio > 20) score -= 5

    // 利率影响
    if (interestRate > 8) score -= 20
    else if (interestRate > 5) score -= 10
    else if (interestRate > 3) score -= 5

    // 贷款类型影响
    if (loanType === 'variable') score -= 10
    else if (loanType === 'mixed') score -= 5

    return Math.max(0, score)
  }

  private generatePaymentSchedule(loanAmount: number, monthlyRate: number, totalPayments: number, monthlyPayment: number) {
    const schedule = []
    let balance = loanAmount

    for (let month = 1; month <= Math.min(totalPayments, 60); month++) { // 限制为前5年
      const interestPayment = balance * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      balance -= principalPayment

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      })
    }

    return schedule
  }

  private analyzeLoanOption(loan: LoanOption, debtToIncomeRatio: number, effectiveRate: number) {
    const pros: string[] = []
    const cons: string[] = []

    // 利率分析
    if (loan.interestRate < 3) {
      pros.push('Sehr günstiger Zinssatz')
    } else if (loan.interestRate > 8) {
      cons.push('Hoher Zinssatz')
    }

    // 费用分析
    if (loan.processingFee === 0) {
      pros.push('Keine Bearbeitungsgebühr')
    } else if (loan.processingFee > loan.loanAmount * 0.02) {
      cons.push('Hohe Bearbeitungsgebühr')
    }

    // 债务收入比分析
    if (debtToIncomeRatio < 20) {
      pros.push('Niedrige Belastung des Einkommens')
    } else if (debtToIncomeRatio > 40) {
      cons.push('Hohe Belastung des Einkommens')
    }

    // 贷款类型分析
    if (loan.loanType === 'fixed') {
      pros.push('Fester Zinssatz - Planungssicherheit')
    } else if (loan.loanType === 'variable') {
      cons.push('Variabler Zinssatz - Zinsrisiko')
    }

    return { pros, cons }
  }

  private calculateAffordabilityAnalysis(monthlyIncome: number, existingDebt: number, propertyValue?: number) {
    const availableIncome = monthlyIncome - existingDebt
    const maxAffordablePayment = availableIncome * 0.35 // 35% Regel
    const recommendedMaxLoan = this.calculateMaxLoanAmount(maxAffordablePayment, 4.5, 25) // 4.5% Zinssatz, 25 Jahre

    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    const debtRatio = existingDebt / monthlyIncome

    if (debtRatio > 0.4) riskLevel = 'high'
    else if (debtRatio > 0.25) riskLevel = 'medium'

    const recommendations: string[] = []
    
    if (riskLevel === 'high') {
      recommendations.push('Reduzieren Sie zunächst bestehende Schulden')
      recommendations.push('Erwägen Sie eine längere Laufzeit für niedrigere Raten')
    } else if (riskLevel === 'medium') {
      recommendations.push('Achten Sie auf zusätzliche Kosten und Gebühren')
      recommendations.push('Bauen Sie einen Notfallfonds auf')
    } else {
      recommendations.push('Sie haben gute Voraussetzungen für einen Kredit')
      recommendations.push('Vergleichen Sie verschiedene Anbieter')
    }

    return {
      recommendedMaxLoan,
      maxAffordablePayment,
      riskLevel,
      recommendations
    }
  }

  private calculateMaxLoanAmount(monthlyPayment: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 100 / 12
    const totalPayments = years * 12
    
    return monthlyPayment * (Math.pow(1 + monthlyRate, totalPayments) - 1) / 
           (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))
  }

  private calculateSensitivityAnalysis(bestLoan: any, sampleLoan: LoanOption) {
    const rateChanges = [0.5, 1.0, 1.5, 2.0]
    
    return {
      rateIncrease: rateChanges.map(change => {
        const newRate = sampleLoan.interestRate + change
        const newMonthlyRate = newRate / 100 / 12
        const totalPayments = sampleLoan.termYears * 12
        const newPayment = sampleLoan.loanAmount * (newMonthlyRate * Math.pow(1 + newMonthlyRate, totalPayments)) / 
                          (Math.pow(1 + newMonthlyRate, totalPayments) - 1)
        
        return {
          rateChange: change,
          newPayment,
          additionalCost: (newPayment - bestLoan.monthlyPayment) * totalPayments
        }
      })
    }
  }

  private generateYearlyBreakdown(bestLoan: any) {
    // 简化的年度分解
    return bestLoan.paymentSchedule
      .filter((_: any, index: number) => index % 12 === 11) // 每年最后一个月
      .map((payment: any, index: number) => ({
        year: index + 1,
        start_amount: 0,
        contributions: bestLoan.monthlyPayment * 12,
        interest: 0,
        end_amount: payment.balance,
        growth_rate: 0
      }))
  }
}

// 创建并导出实例
export const loanComparisonCalculator = new LoanComparisonCalculator()
