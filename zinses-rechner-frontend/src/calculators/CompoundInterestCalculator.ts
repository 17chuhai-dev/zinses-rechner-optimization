/**
 * 复利计算器插件
 * 将现有复利计算器重构为新的插件架构
 */

import type {
  BaseCalculator,
  FormSchema,
  ValidationResult,
  CalculationResult,
  ResultDisplayConfig,
  ExportConfig
} from '@/types/calculator'
import { calculatorAPI } from '@/services/api'
import { validateRange } from '@/utils/formatters'

export class CompoundInterestCalculator implements BaseCalculator {
  readonly id = 'compound-interest'
  readonly name = 'Zinseszins-Rechner'
  readonly description = 'Berechnen Sie die Entwicklung Ihres Kapitals mit Zinseszins-Effekt'
  readonly category = 'compound-interest' as const
  readonly version = '1.0.0'
  readonly icon = 'trending-up'

  readonly formSchema: FormSchema = {
    fields: [
      {
        key: 'principal',
        name: 'principal',
        type: 'currency',
        label: 'Startkapital (€)',
        placeholder: '10.000',
        helpText: 'Das Geld, das Sie zu Beginn anlegen. Mindestens 1€, maximal 10 Millionen €.',
        required: true,
        min: 1,
        max: 10000000,
        defaultValue: 10000,
        icon: 'currency-euro',
        validation: [
          {
            type: 'required',
            message: 'Startkapital ist erforderlich'
          },
          {
            type: 'min',
            value: 1,
            message: 'Startkapital muss mindestens 1€ betragen'
          },
          {
            type: 'max',
            value: 10000000,
            message: 'Startkapital darf maximal 10 Millionen € betragen'
          }
        ]
      },
      {
        key: 'monthlyPayment',
        name: 'monthlyPayment',
        type: 'currency',
        label: 'Monatliche Sparrate (€)',
        placeholder: '500',
        helpText: 'Optional: Regelmäßige monatliche Einzahlungen',
        required: false,
        min: 0,
        max: 50000,
        defaultValue: 500,
        icon: 'currency-euro',
        validation: [
          {
            type: 'min',
            value: 0,
            message: 'Monatliche Sparrate darf nicht negativ sein'
          },
          {
            type: 'max',
            value: 50000,
            message: 'Monatliche Sparrate darf maximal 50.000€ betragen'
          }
        ]
      },
      {
        key: 'annualRate',
        name: 'annualRate',
        type: 'percentage',
        label: 'Zinssatz (%)',
        placeholder: '4,0',
        helpText: 'Erwarteter jährlicher Zinssatz',
        required: true,
        min: 0,
        max: 20,
        step: 0.1,
        defaultValue: 4.0,
        icon: 'percentage',
        validation: [
          {
            type: 'required',
            message: 'Zinssatz ist erforderlich'
          },
          {
            type: 'range',
            value: [0, 20],
            message: 'Zinssatz muss zwischen 0% und 20% liegen'
          }
        ]
      },
      {
        key: 'years',
        name: 'years',
        type: 'slider',
        label: 'Laufzeit (Jahre)',
        helpText: 'Anlagedauer in Jahren',
        required: true,
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 10,
        validation: [
          {
            type: 'required',
            message: 'Laufzeit ist erforderlich'
          },
          {
            type: 'range',
            value: [1, 50],
            message: 'Laufzeit muss zwischen 1 und 50 Jahren liegen'
          }
        ]
      },
      {
        key: 'compoundFrequency',
        name: 'compoundFrequency',
        type: 'select',
        label: 'Zinszahlung',
        helpText: 'Wie oft werden Zinsen gutgeschrieben?',
        required: true,
        defaultValue: 'monthly',
        options: [
          { value: 'monthly', label: 'Monatlich' },
          { value: 'quarterly', label: 'Vierteljährlich' },
          { value: 'yearly', label: 'Jährlich' }
        ],
        validation: [
          {
            type: 'required',
            message: 'Zinszahlung ist erforderlich'
          }
        ]
      }
    ],
    sections: [
      {
        title: 'Grunddaten',
        description: 'Geben Sie Ihre Anlagedetails ein',
        fields: ['principal', 'monthlyPayment'],
        defaultExpanded: true
      },
      {
        title: 'Rendite-Parameter',
        description: 'Konfigurieren Sie Zinssatz und Laufzeit',
        fields: ['annualRate', 'years', 'compoundFrequency'],
        defaultExpanded: true
      }
    ]
  }

  readonly resultConfig: ResultDisplayConfig = {
    primaryMetrics: [
      {
        key: 'finalAmount',
        label: 'Endkapital',
        format: 'currency',
        highlight: true,
        description: 'Ihr Kapital nach der Laufzeit',
        icon: 'trending-up'
      },
      {
        key: 'totalContributions',
        label: 'Eingezahlt',
        format: 'currency',
        description: 'Gesamte Einzahlungen',
        icon: 'arrow-down'
      },
      {
        key: 'totalInterest',
        label: 'Zinserträge',
        format: 'currency',
        description: 'Verdiente Zinsen',
        icon: 'star'
      }
    ],
    secondaryMetrics: [
      {
        key: 'annualReturn',
        label: 'Jährliche Rendite',
        format: 'percentage',
        description: 'Durchschnittliche jährliche Rendite'
      }
    ],
    charts: [
      {
        type: 'area',
        title: 'Kapitalentwicklung',
        dataKey: 'yearlyBreakdown'
      }
    ],
    tables: [
      {
        title: 'Jährliche Entwicklung',
        dataKey: 'yearlyBreakdown',
        columns: [
          { key: 'year', label: 'Jahr', sortable: true },
          { key: 'startAmount', label: 'Startkapital', format: 'currency' },
          { key: 'contributions', label: 'Einzahlungen', format: 'currency' },
          { key: 'interest', label: 'Zinsen', format: 'currency' },
          { key: 'endAmount', label: 'Endkapital', format: 'currency' }
        ],
        exportable: true
      }
    ]
  }

  readonly exportConfig: ExportConfig = {
    formats: ['csv', 'excel', 'pdf'],
    templates: [
      {
        name: 'Detailbericht',
        format: 'pdf',
        template: 'compound-interest-detail',
        variables: ['finalAmount', 'totalContributions', 'totalInterest', 'yearlyBreakdown']
      },
      {
        name: 'Jahresübersicht',
        format: 'excel',
        template: 'compound-interest-yearly',
        variables: ['yearlyBreakdown']
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
      if (!validateRange(input.principal, 1, 10000000)) {
        errors.push({
          field: 'principal',
          message: 'Startkapital muss zwischen 1€ und 10.000.000€ liegen',
          code: 'OUT_OF_RANGE'
        })
      }
    }

    if (input.monthlyPayment !== undefined) {
      if (!validateRange(input.monthlyPayment, 0, 50000)) {
        errors.push({
          field: 'monthlyPayment',
          message: 'Monatliche Sparrate muss zwischen 0€ und 50.000€ liegen',
          code: 'OUT_OF_RANGE'
        })
      }
    }

    if (input.annualRate !== undefined) {
      if (!validateRange(input.annualRate, 0, 20)) {
        errors.push({
          field: 'annualRate',
          message: 'Zinssatz muss zwischen 0% und 20% liegen',
          code: 'OUT_OF_RANGE'
        })
      }
    }

    if (input.years !== undefined) {
      if (!validateRange(input.years, 1, 50)) {
        errors.push({
          field: 'years',
          message: 'Laufzeit muss zwischen 1 und 50 Jahren liegen',
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
   * 执行复利计算
   */
  async calculate(input: Record<string, any>): Promise<CalculationResult> {
    // 首先验证输入
    const validation = this.validate(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    try {
      // 使用本地计算
      const { calculateCompoundInterest } = await import('@/utils/localCalculations')
      const localResult = calculateCompoundInterest({
        principal: input.principal,
        monthlyPayment: input.monthlyPayment || 0,
        annualRate: input.annualRate,
        years: input.years,
        compoundFrequency: input.compoundFrequency || 'monthly'
      })

      // 转换为期望的结果格式
      return {
        finalAmount: localResult.totalAmount,
        totalInterest: localResult.totalInterest,
        totalContributions: localResult.totalContributions,
        yearlyBreakdown: localResult.yearlyBreakdown,
        effectiveRate: localResult.effectiveRate
      }
    } catch (error) {
      console.error('复利计算错误:', error)
      throw new Error('计算失败，请检查输入参数并重试')
    }
  }
}

// 创建并导出实例
export const compoundInterestCalculator = new CompoundInterestCalculator()
