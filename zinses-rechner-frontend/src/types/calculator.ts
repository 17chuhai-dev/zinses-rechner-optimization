// 通用计算器架构类型定义

import type { FormValidation, ExplanationConfig } from './global'
import type { ExportFormat } from './global'

// 抽象计算器接口
export interface BaseCalculator {
  id: string
  name: string
  description: string
  category: CalculatorCategory
  version?: string
  icon?: string

  // 表单配置
  formSchema?: FormSchema

  // 计算方法
  calculate(input: Record<string, any>): Promise<any>
  validate?(input: Record<string, any>): ValidationResult

  // 结果配置
  resultConfig?: ResultDisplayConfig

  // 导出配置
  exportConfig?: ExportConfig

  // 获取表单配置的方法（可选）
  getFormSchema?(): any
}

// 计算器分类
export type CalculatorCategory =
  | 'compound-interest'
  | 'loan'
  | 'mortgage'
  | 'retirement'
  | 'investment'
  | 'tax'
  | 'insurance'
  | 'comparison'
  | 'analysis'

// 表单字段类型
export type FormFieldType =
  | 'currency'
  | 'percentage'
  | 'number'
  | 'select'
  | 'slider'
  | 'date'
  | 'boolean'

// 表单字段定义
export interface FormField {
  key: string
  name: string
  type: FormFieldType
  label: string
  placeholder?: string
  helpText?: string
  required?: boolean
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: any; label: string }>
  validation?: ValidationRule[]
  defaultValue?: any
  icon?: string
}

// 表单模式定义
export interface FormSchema {
  fields: FormField[]
  sections?: FormSection[]
  validation?: FormValidation[]
}

export interface FormSection {
  title: string
  description?: string
  fields: string[] // field keys
  collapsible?: boolean
  defaultExpanded?: boolean
}

// 验证规则
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'range' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

// 结果显示配置
export interface ResultDisplayConfig {
  primaryMetrics: ResultMetric[]
  secondaryMetrics?: ResultMetric[]
  charts?: ChartConfig[]
  tables?: TableConfig[]
  explanations?: ExplanationConfig[]
}

export interface ResultMetric {
  key: string
  label: string
  format: 'currency' | 'percentage' | 'number' | 'date'
  highlight?: boolean
  description?: string
  icon?: string
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area'
  title: string
  dataKey: string
  options?: Record<string, any>
}

export interface TableConfig {
  title: string
  dataKey: string
  columns: TableColumn[]
  pagination?: boolean
  exportable?: boolean
}

export interface TableColumn {
  key: string
  label: string
  format?: 'currency' | 'percentage' | 'number' | 'date'
  sortable?: boolean
}

// 导出配置
export interface ExportConfig {
  formats: ExportFormat[]
  templates?: ExportTemplate[]
}



export interface ExportTemplate {
  name: string
  format: ExportFormat
  template: string
  variables: string[]
}

// 通用计算器输入接口
export interface CalculationInput {
  [key: string]: any
}

// 复利计算器特定类型（向后兼容）
export interface CalculatorForm {
  principal: number // 本金 (€)
  monthlyPayment: number // 月供 (€)
  annualRate: number // 年利率 (%)
  years: number // 投资年限
  compoundFrequency: CompoundFrequency // 复利频率
}

export type CompoundFrequency = 'monthly' | 'quarterly' | 'yearly'

export interface CalculationResult {
  final_amount: number // 最终金额
  total_contributions: number // 总投入
  total_interest: number // 总利息
  annual_return: number // 年化收益率
  yearly_breakdown: YearlyData[] // 年度明细
  calculation_time: string // 计算时间

  // 兼容性属性 - 支持camelCase访问
  finalAmount?: number
  totalContributions?: number
  totalInterest?: number
  annualReturn?: number
  yearlyBreakdown?: YearlyData[]
}

export interface YearlyData {
  year: number // 年份
  start_amount: number // 年初金额
  contributions: number // 年度投入
  interest: number // 年度利息
  end_amount: number // 年末金额
  growth_rate: number // 增长率 (%)
}

export interface TaxCalculation {
  grossInterest: number // 毛利息
  taxFreeAmount: number // 免税额度
  taxableInterest: number // 应税利息
  abgeltungssteuer: number // 资本利得税
  solidaritaetszuschlag: number // 团结税
  kirchensteuer?: number // 教会税
  netInterest: number // 税后利息
}

export interface ChartDataPoint {
  year: number
  totalAmount: number
  contributions: number
  interest: number
  yearlyGain: number
}

// ValidationError已在上面定义，移除重复定义

export interface ApiError {
  message: string
  code: string
  details?: Record<string, unknown>
}
