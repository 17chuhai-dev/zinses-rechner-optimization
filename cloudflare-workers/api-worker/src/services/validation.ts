/**
 * 输入验证服务 - Cloudflare Workers版本
 * 实现全面的输入数据校验和德语错误消息
 */

import { CalculatorRequest } from '../types/api'
import { Env } from '../index'

export interface ValidationResult {
  valid: boolean
  message?: string
  errors?: string[]
}

export class ValidationService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  /**
   * 验证计算器请求数据
   */
  validateCalculatorRequest(request: CalculatorRequest): ValidationResult {
    const errors: string[] = []

    // 验证本金
    if (!this.isValidNumber(request.principal)) {
      errors.push('Das Startkapital muss eine gültige Zahl sein')
    } else if (request.principal <= 0) {
      errors.push('Das Startkapital muss größer als 0€ sein')
    } else if (request.principal > parseFloat(this.env.MAX_PRINCIPAL_AMOUNT)) {
      errors.push(`Das Startkapital darf nicht größer als ${this.formatCurrency(parseFloat(this.env.MAX_PRINCIPAL_AMOUNT))} sein`)
    }

    // 验证月供
    if (!this.isValidNumber(request.monthly_payment)) {
      errors.push('Die monatliche Sparrate muss eine gültige Zahl sein')
    } else if (request.monthly_payment < 0) {
      errors.push('Die monatliche Sparrate darf nicht negativ sein')
    } else if (request.monthly_payment > 50000) {
      errors.push('Die monatliche Sparrate darf nicht größer als 50.000€ sein')
    }

    // 验证年利率
    if (!this.isValidNumber(request.annual_rate)) {
      errors.push('Der Zinssatz muss eine gültige Zahl sein')
    } else if (request.annual_rate <= 0) {
      errors.push('Der Zinssatz muss größer als 0% sein')
    } else if (request.annual_rate > 20) {
      errors.push('Der Zinssatz darf nicht größer als 20% sein')
    }

    // 验证年限
    if (!Number.isInteger(request.years)) {
      errors.push('Die Laufzeit muss eine ganze Zahl sein')
    } else if (request.years < 1) {
      errors.push('Die Laufzeit muss mindestens 1 Jahr betragen')
    } else if (request.years > parseInt(this.env.MAX_CALCULATION_YEARS)) {
      errors.push(`Die Laufzeit darf nicht länger als ${this.env.MAX_CALCULATION_YEARS} Jahre sein`)
    }

    // 验证复利频率
    const validFrequencies = ['monthly', 'quarterly', 'yearly']
    if (!validFrequencies.includes(request.compound_frequency)) {
      errors.push('Die Zinseszins-Häufigkeit muss "monthly", "quarterly" oder "yearly" sein')
    }

    // 业务逻辑验证
    const businessWarnings = this.validateBusinessLogic(request)
    if (businessWarnings.length > 0) {
      // 业务警告不阻止计算，但会记录
      console.warn('Business logic warnings:', businessWarnings)
    }

    if (errors.length > 0) {
      return {
        valid: false,
        message: 'Eingabedaten sind ungültig',
        errors
      }
    }

    return { valid: true }
  }

  /**
   * 业务逻辑验证
   */
  private validateBusinessLogic(request: CalculatorRequest): string[] {
    const warnings: string[] = []

    // 检查不现实的高利率
    if (request.annual_rate > 15) {
      warnings.push(`Sehr hoher Zinssatz (${request.annual_rate}%). Bitte prüfen Sie die Realitätsnähe.`)
    }

    // 检查不现实的高月供
    if (request.monthly_payment > request.principal) {
      warnings.push('Die monatliche Sparrate ist höher als das Startkapital. Dies ist ungewöhnlich.')
    }

    // 检查极长的投资期限
    if (request.years > 40) {
      warnings.push(`Sehr lange Laufzeit (${request.years} Jahre). Berücksichtigen Sie Inflation und Lebensumstände.`)
    }

    // 检查极小的投资金额
    if (request.principal < 100 && request.monthly_payment < 25) {
      warnings.push('Sehr kleine Beträge können durch Gebühren stark beeinträchtigt werden.')
    }

    // 检查复利频率与月供的匹配
    if (request.monthly_payment > 0 && request.compound_frequency === 'yearly') {
      warnings.push('Bei monatlichen Sparraten ist eine monatliche Zinsgutschrift meist vorteilhafter.')
    }

    return warnings
  }

  /**
   * 验证数字有效性
   */
  private isValidNumber(value: any): boolean {
    return typeof value === 'number' && 
           !isNaN(value) && 
           isFinite(value)
  }

  /**
   * 格式化货币显示
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  /**
   * 高精度数学运算
   */
  private toDecimal(value: number): number {
    // 使用字符串转换避免浮点数精度问题
    return parseFloat(value.toFixed(10))
  }

  /**
   * 验证API使用限制
   */
  validateApiLimits(request: CalculatorRequest): ValidationResult {
    const errors: string[] = []

    // 检查计算复杂度
    const totalPeriods = this.calculateTotalPeriods(request)
    if (totalPeriods > 600) { // 50年 * 12月 = 600期
      errors.push('Die Berechnung ist zu komplex. Bitte reduzieren Sie die Laufzeit oder ändern Sie die Häufigkeit.')
    }

    // 检查内存使用预估
    const estimatedMemoryUsage = this.estimateMemoryUsage(request)
    if (estimatedMemoryUsage > 50) { // 50MB限制
      errors.push('Die Berechnung würde zu viel Speicher benötigen. Bitte reduzieren Sie die Parameter.')
    }

    if (errors.length > 0) {
      return {
        valid: false,
        message: 'API-Limits überschritten',
        errors
      }
    }

    return { valid: true }
  }

  /**
   * 计算总期数
   */
  private calculateTotalPeriods(request: CalculatorRequest): number {
    switch (request.compound_frequency) {
      case 'monthly': return request.years * 12
      case 'quarterly': return request.years * 4
      case 'yearly': return request.years
      default: return request.years
    }
  }

  /**
   * 估算内存使用量（MB）
   */
  private estimateMemoryUsage(request: CalculatorRequest): number {
    const totalPeriods = this.calculateTotalPeriods(request)
    const yearlyBreakdownSize = request.years * 0.001 // 每年约1KB
    const calculationOverhead = 0.1 // 100KB基础开销
    
    return yearlyBreakdownSize + calculationOverhead
  }

  /**
   * 验证请求格式
   */
  validateRequestFormat(data: any): ValidationResult {
    const requiredFields = ['principal', 'annual_rate', 'years']
    const optionalFields = ['monthly_payment', 'compound_frequency']
    const errors: string[] = []

    // 检查必需字段
    for (const field of requiredFields) {
      if (!(field in data)) {
        errors.push(`Pflichtfeld fehlt: ${field}`)
      }
    }

    // 检查数据类型
    if (typeof data.principal !== 'number') {
      errors.push('Startkapital muss eine Zahl sein')
    }
    if (typeof data.annual_rate !== 'number') {
      errors.push('Zinssatz muss eine Zahl sein')
    }
    if (typeof data.years !== 'number') {
      errors.push('Laufzeit muss eine Zahl sein')
    }

    // 检查可选字段类型
    if ('monthly_payment' in data && typeof data.monthly_payment !== 'number') {
      errors.push('Monatliche Sparrate muss eine Zahl sein')
    }
    if ('compound_frequency' in data && typeof data.compound_frequency !== 'string') {
      errors.push('Zinseszins-Häufigkeit muss ein Text sein')
    }

    // 检查未知字段
    const allValidFields = [...requiredFields, ...optionalFields]
    const unknownFields = Object.keys(data).filter(key => !allValidFields.includes(key))
    if (unknownFields.length > 0) {
      errors.push(`Unbekannte Felder: ${unknownFields.join(', ')}`)
    }

    if (errors.length > 0) {
      return {
        valid: false,
        message: 'Ungültiges Anfrage-Format',
        errors
      }
    }

    return { valid: true }
  }

  /**
   * 获取验证规则信息
   */
  getValidationRules() {
    return {
      principal: {
        type: 'number',
        required: true,
        min: 1,
        max: parseFloat(this.env.MAX_PRINCIPAL_AMOUNT),
        description: 'Startkapital in Euro'
      },
      monthly_payment: {
        type: 'number',
        required: false,
        min: 0,
        max: 50000,
        default: 0,
        description: 'Monatliche Sparrate in Euro'
      },
      annual_rate: {
        type: 'number',
        required: true,
        min: 0.01,
        max: 20,
        description: 'Jährlicher Zinssatz in Prozent'
      },
      years: {
        type: 'integer',
        required: true,
        min: 1,
        max: parseInt(this.env.MAX_CALCULATION_YEARS),
        description: 'Laufzeit in Jahren'
      },
      compound_frequency: {
        type: 'string',
        required: false,
        enum: ['monthly', 'quarterly', 'yearly'],
        default: 'monthly',
        description: 'Häufigkeit der Zinsgutschrift'
      }
    }
  }
}
