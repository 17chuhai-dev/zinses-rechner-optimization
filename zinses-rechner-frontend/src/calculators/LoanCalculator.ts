/**
 * 德国贷款计算器（Darlehensrechner）
 * 支持等额本息和等额本金两种还款方式，符合德国金融标准
 */

import type {
  BaseCalculator,
  FormSchema,
  ValidationResult,
  CalculationResult,
  ResultDisplayConfig,
  ExportConfig
} from '@/types/calculator'
import { validateRange } from '@/utils/formatters'

// 德国贷款计算器特定类型
interface LoanCalculatorInput {
  principal: number // 贷款本金
  annualRate: number // 年利率
  termYears: number // 贷款期限（年）
  paymentType: 'annuity' | 'linear' // 还款方式：等额本息 | 等额本金
  specialPayments?: SpecialPayment[] // 特殊还款
  rateFixedPeriod?: number // 利率锁定期
}

interface SpecialPayment {
  year: number
  amount: number
  type: 'once' | 'annual' // 一次性 | 每年
}

interface LoanCalculatorResult extends CalculationResult {
  monthlyPayment: number // 月供
  totalInterest: number // 总利息
  totalPayment: number // 总还款额
  amortizationSchedule: PaymentSchedule[] // 还款计划表
  remainingDebt: number // 剩余债务
  effectiveRate: number // 实际利率
  interestSavings?: number // 特殊还款节省的利息
}

interface PaymentSchedule {
  year: number
  month: number
  startBalance: number // 期初余额
  payment: number // 还款额
  principal: number // 本金
  interest: number // 利息
  endBalance: number // 期末余额
  specialPayment?: number // 特殊还款
}

export class LoanCalculator implements BaseCalculator {
  readonly id = 'loan'
  readonly name = 'Darlehensrechner'
  readonly description = 'Berechnen Sie Ihre Kreditraten und Tilgungspläne nach deutschen Standards'
  readonly category = 'loan' as const
  readonly version = '1.0.0'
  readonly icon = 'banknotes'

  readonly formSchema: FormSchema = {
    fields: [
      {
        key: 'principal',
        name: 'principal',
        type: 'currency',
        label: 'Darlehenssumme (€)',
        placeholder: '200.000',
        helpText: 'Der Betrag, den Sie leihen möchten. Zwischen 1.000€ und 2 Millionen €.',
        required: true,
        min: 1000,
        max: 2000000,
        defaultValue: 200000,
        icon: 'currency-euro',
        validation: [
          {
            type: 'required',
            message: 'Darlehenssumme ist erforderlich'
          },
          {
            type: 'min',
            value: 1000,
            message: 'Darlehenssumme muss mindestens 1.000€ betragen'
          },
          {
            type: 'max',
            value: 2000000,
            message: 'Darlehenssumme darf maximal 2 Millionen € betragen'
          }
        ]
      },
      {
        key: 'annualRate',
        name: 'annualRate',
        type: 'percentage',
        label: 'Sollzins p.a. (%)',
        placeholder: '3,5',
        helpText: 'Nominaler Jahreszins des Darlehens',
        required: true,
        min: 0.1,
        max: 15,
        step: 0.01,
        defaultValue: 3.5,
        icon: 'percentage',
        validation: [
          {
            type: 'required',
            message: 'Sollzins ist erforderlich'
          },
          {
            type: 'range',
            value: [0.1, 15],
            message: 'Sollzins muss zwischen 0,1% und 15% liegen'
          }
        ]
      },
      {
        key: 'termYears',
        name: 'termYears',
        type: 'slider',
        label: 'Laufzeit (Jahre)',
        helpText: 'Gesamtlaufzeit des Darlehens',
        required: true,
        min: 1,
        max: 40,
        step: 1,
        defaultValue: 20,
        validation: [
          {
            type: 'required',
            message: 'Laufzeit ist erforderlich'
          },
          {
            type: 'range',
            value: [1, 40],
            message: 'Laufzeit muss zwischen 1 und 40 Jahren liegen'
          }
        ]
      },
      {
        key: 'paymentType',
        name: 'paymentType',
        type: 'select',
        label: 'Tilgungsart',
        helpText: 'Art der Rückzahlung des Darlehens',
        required: true,
        defaultValue: 'annuity',
        options: [
          { value: 'annuity', label: 'Annuitätendarlehen (gleichbleibende Rate)' },
          { value: 'linear', label: 'Tilgungsdarlehen (gleichbleibende Tilgung)' }
        ],
        validation: [
          {
            type: 'required',
            message: 'Tilgungsart ist erforderlich'
          }
        ]
      },
      {
        key: 'rateFixedPeriod',
        name: 'rateFixedPeriod',
        type: 'select',
        label: 'Zinsbindung (Jahre)',
        helpText: 'Zeitraum der Zinsfestschreibung',
        required: false,
        defaultValue: 10,
        options: [
          { value: 5, label: '5 Jahre' },
          { value: 10, label: '10 Jahre' },
          { value: 15, label: '15 Jahre' },
          { value: 20, label: '20 Jahre' },
          { value: 25, label: '25 Jahre' },
          { value: 30, label: '30 Jahre' }
        ]
      }
    ],
    sections: [
      {
        title: 'Darlehensdetails',
        description: 'Grundlegende Informationen zu Ihrem Darlehen',
        fields: ['principal', 'annualRate'],
        defaultExpanded: true
      },
      {
        title: 'Laufzeit und Tilgung',
        description: 'Konfiguration der Rückzahlung',
        fields: ['termYears', 'paymentType', 'rateFixedPeriod'],
        defaultExpanded: true
      }
    ]
  }

  readonly resultConfig: ResultDisplayConfig = {
    primaryMetrics: [
      {
        key: 'monthlyPayment',
        label: 'Monatliche Rate',
        format: 'currency',
        highlight: true,
        description: 'Ihre monatliche Belastung',
        icon: 'calendar'
      },
      {
        key: 'totalPayment',
        label: 'Gesamtkosten',
        format: 'currency',
        description: 'Gesamte Rückzahlung',
        icon: 'calculator'
      },
      {
        key: 'totalInterest',
        label: 'Zinskosten',
        format: 'currency',
        description: 'Gesamte Zinszahlungen',
        icon: 'trending-up'
      }
    ],
    secondaryMetrics: [
      {
        key: 'effectiveRate',
        label: 'Effektivzins',
        format: 'percentage',
        description: 'Effektiver Jahreszins'
      },
      {
        key: 'remainingDebt',
        label: 'Restschuld nach Zinsbindung',
        format: 'currency',
        description: 'Verbleibende Schuld'
      }
    ],
    charts: [
      {
        type: 'area',
        title: 'Tilgungsverlauf',
        dataKey: 'amortizationSchedule'
      }
    ],
    tables: [
      {
        title: 'Tilgungsplan',
        dataKey: 'amortizationSchedule',
        columns: [
          { key: 'year', label: 'Jahr', sortable: true },
          { key: 'startBalance', label: 'Restschuld Anfang', format: 'currency' },
          { key: 'payment', label: 'Rate', format: 'currency' },
          { key: 'interest', label: 'Zinsen', format: 'currency' },
          { key: 'principal', label: 'Tilgung', format: 'currency' },
          { key: 'endBalance', label: 'Restschuld Ende', format: 'currency' }
        ],
        exportable: true,
        pagination: true
      }
    ]
  }

  readonly exportConfig: ExportConfig = {
    formats: ['csv', 'excel', 'pdf'],
    templates: [
      {
        name: 'Tilgungsplan',
        format: 'pdf',
        template: 'loan-amortization',
        variables: ['monthlyPayment', 'totalInterest', 'amortizationSchedule']
      },
      {
        name: 'Kreditübersicht',
        format: 'excel',
        template: 'loan-summary',
        variables: ['monthlyPayment', 'totalPayment', 'totalInterest', 'amortizationSchedule']
      }
    ]
  }

  /**
   * 验证输入数据
   */
  validate(input: Record<string, any>): ValidationResult {
    const errors: any[] = []

    // 验证必填字段
    const requiredFields = this.formSchema.fields.filter(f => f.required)
    for (const field of requiredFields) {
      if (input[field.key] === undefined || input[field.key] === null || input[field.key] === '') {
        errors.push({
          field: field.key,
          message: `${field.label} ist erforderlich`,
          code: 'REQUIRED'
        })
      }
    }

    // 验证数值范围
    if (input.principal !== undefined) {
      if (!validateRange(input.principal, 1000, 2000000)) {
        errors.push({
          field: 'principal',
          message: 'Darlehenssumme muss zwischen 1.000€ und 2.000.000€ liegen',
          code: 'OUT_OF_RANGE'
        })
      }
    }

    if (input.annualRate !== undefined) {
      if (!validateRange(input.annualRate, 0.1, 15)) {
        errors.push({
          field: 'annualRate',
          message: 'Sollzins muss zwischen 0,1% und 15% liegen',
          code: 'OUT_OF_RANGE'
        })
      }
    }

    if (input.termYears !== undefined) {
      if (!validateRange(input.termYears, 1, 40)) {
        errors.push({
          field: 'termYears',
          message: 'Laufzeit muss zwischen 1 und 40 Jahren liegen',
          code: 'OUT_OF_RANGE'
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 执行贷款计算
   */
  async calculate(input: Record<string, any>): Promise<LoanCalculatorResult> {
    // 首先验证输入
    const validation = this.validate(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    const {
      principal,
      annualRate,
      termYears,
      paymentType,
      rateFixedPeriod = termYears
    } = input as LoanCalculatorInput

    try {
      // 执行德国标准贷款计算
      const result = this.calculateLoan({
        principal,
        annualRate,
        termYears,
        paymentType,
        rateFixedPeriod
      })

      return result
    } catch (error) {
      console.error('贷款计算错误:', error)
      throw new Error('计算失败，请检查输入参数并重试')
    }
  }

  /**
   * 德国标准贷款计算逻辑
   */
  private calculateLoan(params: LoanCalculatorInput): LoanCalculatorResult {
    const { principal, annualRate, termYears, paymentType, rateFixedPeriod } = params
    const monthlyRate = annualRate / 100 / 12
    const totalMonths = termYears * 12
    const fixedPeriodMonths = (rateFixedPeriod || termYears) * 12

    let monthlyPayment: number
    let amortizationSchedule: PaymentSchedule[] = []
    let totalInterest = 0
    let totalPayment = 0

    if (paymentType === 'annuity') {
      // 等额本息计算
      monthlyPayment = this.calculateAnnuityPayment(principal, monthlyRate, totalMonths)
      amortizationSchedule = this.generateAnnuitySchedule(principal, monthlyRate, totalMonths, monthlyPayment)
    } else {
      // 等额本金计算
      const monthlyPrincipal = principal / totalMonths
      amortizationSchedule = this.generateLinearSchedule(principal, monthlyRate, totalMonths, monthlyPrincipal)
      monthlyPayment = amortizationSchedule[0]?.payment || 0
    }

    // 计算总利息和总还款额
    totalInterest = amortizationSchedule.reduce((sum, payment) => sum + payment.interest, 0)
    totalPayment = principal + totalInterest

    // 计算利率锁定期后的剩余债务
    const remainingDebt = fixedPeriodMonths < totalMonths
      ? amortizationSchedule[fixedPeriodMonths - 1]?.endBalance || 0
      : 0

    // 计算实际利率（简化版）
    const effectiveRate = annualRate // 在实际应用中需要考虑费用等因素

    return {
      monthlyPayment,
      totalInterest,
      totalPayment,
      amortizationSchedule,
      remainingDebt,
      effectiveRate,
      // 添加基础接口要求的属性以保持兼容性
      final_amount: totalPayment,
      total_contributions: principal,
      total_interest: totalInterest,
      annual_return: effectiveRate,
      yearly_breakdown: this.generateYearlyBreakdown(amortizationSchedule),
      calculation_time: new Date().toISOString()
    }
  }

  /**
   * 计算等额本息月供
   */
  private calculateAnnuityPayment(principal: number, monthlyRate: number, totalMonths: number): number {
    if (monthlyRate === 0) {
      return principal / totalMonths
    }

    return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
           (Math.pow(1 + monthlyRate, totalMonths) - 1)
  }

  /**
   * 生成等额本息还款计划
   */
  private generateAnnuitySchedule(
    principal: number,
    monthlyRate: number,
    totalMonths: number,
    monthlyPayment: number
  ): PaymentSchedule[] {
    const schedule: PaymentSchedule[] = []
    let remainingBalance = principal

    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = remainingBalance * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      const endBalance = Math.max(0, remainingBalance - principalPayment)

      schedule.push({
        year: Math.ceil(month / 12),
        month: ((month - 1) % 12) + 1,
        startBalance: remainingBalance,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        endBalance: endBalance
      })

      remainingBalance = endBalance
      if (remainingBalance <= 0.01) break // 避免浮点数精度问题
    }

    return schedule
  }

  /**
   * 生成等额本金还款计划
   */
  private generateLinearSchedule(
    principal: number,
    monthlyRate: number,
    totalMonths: number,
    monthlyPrincipal: number
  ): PaymentSchedule[] {
    const schedule: PaymentSchedule[] = []
    let remainingBalance = principal

    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = remainingBalance * monthlyRate
      const payment = monthlyPrincipal + interestPayment
      const endBalance = Math.max(0, remainingBalance - monthlyPrincipal)

      schedule.push({
        year: Math.ceil(month / 12),
        month: ((month - 1) % 12) + 1,
        startBalance: remainingBalance,
        payment: payment,
        principal: monthlyPrincipal,
        interest: interestPayment,
        endBalance: endBalance
      })

      remainingBalance = endBalance
      if (remainingBalance <= 0.01) break
    }

    return schedule
  }

  /**
   * 生成年度汇总数据
   */
  private generateYearlyBreakdown(schedule: PaymentSchedule[]): any[] {
    const yearlyData: Record<number, any> = {}

    schedule.forEach(payment => {
      if (!yearlyData[payment.year]) {
        yearlyData[payment.year] = {
          year: payment.year,
          startAmount: payment.startBalance,
          contributions: 0,
          interest: 0,
          endAmount: payment.endBalance
        }
      }

      yearlyData[payment.year].contributions += payment.principal
      yearlyData[payment.year].interest += payment.interest
      yearlyData[payment.year].endAmount = payment.endBalance
    })

    return Object.values(yearlyData)
  }
}

// 创建并导出实例
export const loanCalculator = new LoanCalculator()
