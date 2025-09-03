/**
 * 德国房贷计算器（Baufinanzierungsrechner）
 * 专业的德国房产融资计算器，集成购房成本和融资方案分析
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

// 德国房贷计算器特定类型
interface MortgageCalculatorInput {
  purchasePrice: number // 房价
  downPayment: number // 首付
  annualRate: number // 年利率
  termYears: number // 贷款期限
  notaryRate: number // 公证费率
  landTransferTaxRate: number // 土地转让税率
  realEstateAgentRate: number // 中介费率
  renovationCosts?: number // 装修费用
  monthlyIncome: number // 月收入
  monthlyExpenses: number // 月支出
}

interface PropertyCosts {
  purchasePrice: number // 房价
  notaryFees: number // 公证费 (1-1.5%)
  landTransferTax: number // 土地转让税 (3.5-6.5%)
  realEstateAgentFee: number // 中介费 (3-7%)
  landRegistryFee: number // 土地登记费
  renovationCosts: number // 装修费用
  totalCosts: number // 总成本
}

interface MortgageCalculatorResult extends CalculationResult {
  loanAmount: number // 贷款金额
  monthlyPayment: number // 月供
  totalInterest: number // 总利息
  totalPayment: number // 总还款额
  propertyCosts: PropertyCosts // 购房成本分解
  requiredEquity: number // 所需自有资金
  affordabilityRatio: number // 负担能力比率
  maxAffordablePrice: number // 最大可负担房价
  monthlyDisposableIncome: number // 月度可支配收入
}

export class MortgageCalculator implements BaseCalculator {
  readonly id = 'mortgage'
  readonly name = 'Baufinanzierungsrechner'
  readonly description = 'Berechnen Sie Ihre Baufinanzierung und Kaufnebenkosten nach deutschen Standards'
  readonly category = 'mortgage' as const
  readonly version = '1.0.0'
  readonly icon = 'home'

  readonly formSchema: FormSchema = {
    fields: [
      {
        key: 'purchasePrice',
        name: 'purchasePrice',
        type: 'currency',
        label: 'Kaufpreis (€)',
        placeholder: '400.000',
        helpText: 'Der Kaufpreis der Immobilie ohne Nebenkosten',
        required: true,
        min: 50000,
        max: 5000000,
        defaultValue: 400000,
        icon: 'home',
        validation: [
          {
            type: 'required',
            message: 'Kaufpreis ist erforderlich'
          },
          {
            type: 'min',
            value: 50000,
            message: 'Kaufpreis muss mindestens 50.000€ betragen'
          },
          {
            type: 'max',
            value: 5000000,
            message: 'Kaufpreis darf maximal 5 Millionen € betragen'
          }
        ]
      },
      {
        key: 'downPayment',
        name: 'downPayment',
        type: 'currency',
        label: 'Eigenkapital (€)',
        placeholder: '80.000',
        helpText: 'Ihr verfügbares Eigenkapital für den Immobilienkauf',
        required: true,
        min: 0,
        max: 2000000,
        defaultValue: 80000,
        icon: 'banknotes',
        validation: [
          {
            type: 'required',
            message: 'Eigenkapital ist erforderlich'
          },
          {
            type: 'min',
            value: 0,
            message: 'Eigenkapital darf nicht negativ sein'
          }
        ]
      },
      {
        key: 'annualRate',
        name: 'annualRate',
        type: 'percentage',
        label: 'Sollzins p.a. (%)',
        placeholder: '3,8',
        helpText: 'Nominaler Jahreszins für die Baufinanzierung',
        required: true,
        min: 0.5,
        max: 10,
        step: 0.01,
        defaultValue: 3.8,
        icon: 'percentage',
        validation: [
          {
            type: 'required',
            message: 'Sollzins ist erforderlich'
          },
          {
            type: 'range',
            value: [0.5, 10],
            message: 'Sollzins muss zwischen 0,5% und 10% liegen'
          }
        ]
      },
      {
        key: 'termYears',
        name: 'termYears',
        type: 'slider',
        label: 'Laufzeit (Jahre)',
        helpText: 'Laufzeit der Baufinanzierung',
        required: true,
        min: 5,
        max: 40,
        step: 1,
        defaultValue: 25,
        validation: [
          {
            type: 'required',
            message: 'Laufzeit ist erforderlich'
          },
          {
            type: 'range',
            value: [5, 40],
            message: 'Laufzeit muss zwischen 5 und 40 Jahren liegen'
          }
        ]
      },
      {
        key: 'landTransferTaxRate',
        name: 'landTransferTaxRate',
        type: 'percentage',
        label: 'Grunderwerbsteuer (%)',
        helpText: 'Grunderwerbsteuersatz je nach Bundesland (3,5% - 6,5%)',
        required: true,
        min: 3.5,
        max: 6.5,
        step: 0.5,
        defaultValue: 5.0,
        validation: [
          {
            type: 'required',
            message: 'Grunderwerbsteuer ist erforderlich'
          }
        ]
      },
      {
        key: 'notaryRate',
        name: 'notaryRate',
        type: 'percentage',
        label: 'Notar- und Grundbuchkosten (%)',
        helpText: 'Notar- und Grundbuchgebühren (ca. 1,5% - 2%)',
        required: true,
        min: 1.0,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.5,
        validation: [
          {
            type: 'required',
            message: 'Notar- und Grundbuchkosten sind erforderlich'
          }
        ]
      },
      {
        key: 'realEstateAgentRate',
        name: 'realEstateAgentRate',
        type: 'percentage',
        label: 'Maklerprovision (%)',
        helpText: 'Maklergebühr (0% - 7,14%, je nach Region)',
        required: false,
        min: 0,
        max: 7.14,
        step: 0.1,
        defaultValue: 3.57
      },
      {
        key: 'monthlyIncome',
        name: 'monthlyIncome',
        type: 'currency',
        label: 'Nettoeinkommen/Monat (€)',
        helpText: 'Ihr monatliches Nettoeinkommen',
        required: true,
        min: 1000,
        max: 50000,
        defaultValue: 4000,
        validation: [
          {
            type: 'required',
            message: 'Nettoeinkommen ist erforderlich'
          }
        ]
      },
      {
        key: 'monthlyExpenses',
        name: 'monthlyExpenses',
        type: 'currency',
        label: 'Lebenshaltungskosten/Monat (€)',
        helpText: 'Ihre monatlichen Ausgaben (ohne Miete)',
        required: true,
        min: 500,
        max: 20000,
        defaultValue: 1500,
        validation: [
          {
            type: 'required',
            message: 'Lebenshaltungskosten sind erforderlich'
          }
        ]
      }
    ],
    sections: [
      {
        title: 'Immobilie und Finanzierung',
        description: 'Grunddaten zur Immobilie und Finanzierung',
        fields: ['purchasePrice', 'downPayment', 'annualRate', 'termYears'],
        defaultExpanded: true
      },
      {
        title: 'Kaufnebenkosten',
        description: 'Nebenkosten beim Immobilienkauf',
        fields: ['landTransferTaxRate', 'notaryRate', 'realEstateAgentRate'],
        defaultExpanded: true
      },
      {
        title: 'Finanzielle Situation',
        description: 'Ihre Einkommens- und Ausgabensituation',
        fields: ['monthlyIncome', 'monthlyExpenses'],
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
        key: 'propertyCosts.totalCosts',
        label: 'Gesamtkosten',
        format: 'currency',
        description: 'Kaufpreis + Nebenkosten',
        icon: 'calculator'
      },
      {
        key: 'requiredEquity',
        label: 'Benötigtes Eigenkapital',
        format: 'currency',
        description: 'Mindest-Eigenkapital',
        icon: 'banknotes'
      }
    ],
    secondaryMetrics: [
      {
        key: 'affordabilityRatio',
        label: 'Belastungsquote',
        format: 'percentage',
        description: 'Rate im Verhältnis zum Einkommen'
      },
      {
        key: 'maxAffordablePrice',
        label: 'Max. Kaufpreis',
        format: 'currency',
        description: 'Maximaler Kaufpreis bei 40% Belastung'
      }
    ],
    charts: [
      {
        type: 'pie',
        title: 'Kaufkostenverteilung',
        dataKey: 'propertyCosts'
      }
    ],
    tables: [
      {
        title: 'Kaufkostenaufstellung',
        dataKey: 'costBreakdown',
        columns: [
          { key: 'category', label: 'Kostenart' },
          { key: 'rate', label: 'Satz', format: 'percentage' },
          { key: 'amount', label: 'Betrag', format: 'currency' }
        ],
        exportable: true
      }
    ]
  }

  readonly exportConfig: ExportConfig = {
    formats: ['csv', 'excel', 'pdf'],
    templates: [
      {
        name: 'Finanzierungsübersicht',
        format: 'pdf',
        template: 'mortgage-overview',
        variables: ['monthlyPayment', 'propertyCosts', 'affordabilityRatio']
      }
    ]
  }

  /**
   * 验证输入数据
   */
  validate(input: Record<string, any>): ValidationResult {
    const errors: any[] = []

    // 基础验证
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

    // 业务逻辑验证
    if (input.downPayment && input.purchasePrice) {
      if (input.downPayment > input.purchasePrice) {
        errors.push({
          field: 'downPayment',
          message: 'Eigenkapital kann nicht höher als der Kaufpreis sein',
          code: 'INVALID_RATIO'
        })
      }
    }

    if (input.monthlyExpenses && input.monthlyIncome) {
      if (input.monthlyExpenses >= input.monthlyIncome) {
        errors.push({
          field: 'monthlyExpenses',
          message: 'Lebenshaltungskosten müssen geringer als das Einkommen sein',
          code: 'INVALID_RATIO'
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 执行房贷计算
   */
  async calculate(input: Record<string, any>): Promise<MortgageCalculatorResult> {
    const validation = this.validate(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    const params = input as MortgageCalculatorInput

    try {
      return this.calculateMortgage(params)
    } catch (error) {
      console.error('房贷计算错误:', error)
      throw new Error('计算失败，请检查输入参数并重试')
    }
  }

  /**
   * 德国房贷计算逻辑
   */
  private calculateMortgage(params: MortgageCalculatorInput): MortgageCalculatorResult {
    const {
      purchasePrice,
      downPayment,
      annualRate,
      termYears,
      notaryRate,
      landTransferTaxRate,
      realEstateAgentRate = 0,
      monthlyIncome,
      monthlyExpenses
    } = params

    // 计算购房成本
    const propertyCosts = this.calculatePropertyCosts(
      purchasePrice,
      notaryRate,
      landTransferTaxRate,
      realEstateAgentRate
    )

    // 计算所需自有资金（购房成本 - 贷款额度）
    const maxLoanAmount = purchasePrice * 0.8 // 最大80%贷款
    const actualLoanAmount = Math.min(
      purchasePrice + propertyCosts.notaryFees + propertyCosts.landTransferTax + propertyCosts.realEstateAgentFee - downPayment,
      maxLoanAmount
    )

    const requiredEquity = propertyCosts.totalCosts - actualLoanAmount

    // 计算月供
    const monthlyRate = annualRate / 100 / 12
    const totalMonths = termYears * 12
    const monthlyPayment = this.calculateMonthlyPayment(actualLoanAmount, monthlyRate, totalMonths)

    // 计算总利息和总还款额
    const totalPayment = monthlyPayment * totalMonths
    const totalInterest = totalPayment - actualLoanAmount

    // 计算负担能力
    const monthlyDisposableIncome = monthlyIncome - monthlyExpenses
    const affordabilityRatio = monthlyPayment / monthlyIncome
    const maxAffordablePayment = monthlyIncome * 0.4 // 40%规则
    const maxAffordablePrice = this.calculateMaxAffordablePrice(
      maxAffordablePayment,
      monthlyRate,
      totalMonths,
      downPayment,
      propertyCosts
    )

    return {
      loanAmount: actualLoanAmount,
      monthlyPayment,
      totalInterest,
      totalPayment,
      propertyCosts,
      requiredEquity,
      affordabilityRatio,
      maxAffordablePrice,
      monthlyDisposableIncome,
      // 添加基础接口要求的属性以保持兼容性
      final_amount: totalPayment,
      total_contributions: actualLoanAmount,
      total_interest: totalInterest,
      annual_return: annualRate,
      yearly_breakdown: [],
      calculation_time: new Date().toISOString()
    }
  }

  /**
   * 计算购房成本分解
   */
  private calculatePropertyCosts(
    purchasePrice: number,
    notaryRate: number,
    landTransferTaxRate: number,
    realEstateAgentRate: number
  ): PropertyCosts {
    const notaryFees = purchasePrice * (notaryRate / 100)
    const landTransferTax = purchasePrice * (landTransferTaxRate / 100)
    const realEstateAgentFee = purchasePrice * (realEstateAgentRate / 100)
    const landRegistryFee = purchasePrice * 0.005 // 约0.5%
    const renovationCosts = 0 // 可选

    const totalCosts = purchasePrice + notaryFees + landTransferTax + realEstateAgentFee + landRegistryFee + renovationCosts

    return {
      purchasePrice,
      notaryFees,
      landTransferTax,
      realEstateAgentFee,
      landRegistryFee,
      renovationCosts,
      totalCosts
    }
  }

  /**
   * 计算月供
   */
  private calculateMonthlyPayment(principal: number, monthlyRate: number, totalMonths: number): number {
    if (monthlyRate === 0) {
      return principal / totalMonths
    }

    return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
           (Math.pow(1 + monthlyRate, totalMonths) - 1)
  }

  /**
   * 计算最大可负担房价
   */
  private calculateMaxAffordablePrice(
    maxPayment: number,
    monthlyRate: number,
    totalMonths: number,
    downPayment: number,
    baseCosts: PropertyCosts
  ): number {
    // 简化计算：基于最大月供反推可负担的贷款额
    let maxLoanAmount: number

    if (monthlyRate === 0) {
      maxLoanAmount = maxPayment * totalMonths
    } else {
      maxLoanAmount = maxPayment * (Math.pow(1 + monthlyRate, totalMonths) - 1) /
                     (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))
    }

    // 考虑首付和购房成本，反推最大房价
    const estimatedMaxPrice = (maxLoanAmount + downPayment) / 1.1 // 假设总成本为房价的110%

    return Math.max(0, estimatedMaxPrice)
  }
}

// 创建并导出实例
export const mortgageCalculator = new MortgageCalculator()
