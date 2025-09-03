/**
 * 表格数据处理器
 * 处理年度明细数据的转换、计算和格式化
 */

import { formatGermanCurrency, formatGermanNumber } from '@/utils/germanFormatters'

// 年度数据接口
export interface YearlyData {
  year: number
  startBalance: number
  contributions: number
  interest: number
  endBalance: number
  cumulativeContributions?: number
  cumulativeInterest?: number
  effectiveRate?: number
  monthlyBreakdown?: MonthlyData[]
}

// 月度数据接口
export interface MonthlyData {
  month: number
  startBalance: number
  contribution: number
  interest: number
  endBalance: number
}

// 计算结果接口
export interface CalculationResult {
  finalAmount: number
  totalInterest: number
  totalContributions: number
  effectiveRate: number
  yearlyBreakdown: YearlyData[]
}

// 数据处理配置
export interface ProcessorConfig {
  precision: number
  includeCumulative: boolean
  includeEffectiveRate: boolean
  includeMonthlyBreakdown: boolean
  roundingMode: 'round' | 'floor' | 'ceil'
}

/**
 * 表格数据处理器类
 */
export class TableDataProcessor {
  private config: ProcessorConfig

  constructor(config: Partial<ProcessorConfig> = {}) {
    this.config = {
      precision: 2,
      includeCumulative: true,
      includeEffectiveRate: true,
      includeMonthlyBreakdown: false,
      roundingMode: 'round',
      ...config
    }
  }

  /**
   * 处理复利计算数据
   */
  processCompoundInterestData(
    principal: number,
    annualRate: number,
    years: number,
    monthlyPayment: number = 0
  ): YearlyData[] {
    const yearlyData: YearlyData[] = []
    let currentBalance = principal
    let totalContributions = principal
    let totalInterest = 0

    for (let year = 1; year <= years; year++) {
      const startBalance = currentBalance
      const yearlyContributions = monthlyPayment * 12
      
      // 月度复利计算
      const monthlyRate = annualRate / 100 / 12
      let yearInterest = 0
      
      for (let month = 1; month <= 12; month++) {
        const monthInterest = currentBalance * monthlyRate
        yearInterest += monthInterest
        currentBalance += monthInterest + monthlyPayment
      }
      
      totalContributions += yearlyContributions
      totalInterest += yearInterest
      
      const effectiveRate = startBalance > 0 
        ? (yearInterest / startBalance) * 100 
        : 0

      yearlyData.push({
        year,
        startBalance: this.roundValue(startBalance),
        contributions: this.roundValue(yearlyContributions),
        interest: this.roundValue(yearInterest),
        endBalance: this.roundValue(currentBalance),
        cumulativeContributions: this.config.includeCumulative 
          ? this.roundValue(totalContributions) 
          : undefined,
        cumulativeInterest: this.config.includeCumulative 
          ? this.roundValue(totalInterest) 
          : undefined,
        effectiveRate: this.config.includeEffectiveRate 
          ? this.roundValue(effectiveRate) 
          : undefined
      })
    }

    return yearlyData
  }

  /**
   * 处理储蓄计划数据
   */
  processSavingsPlanData(
    monthlyPayment: number,
    annualRate: number,
    years: number,
    initialAmount: number = 0
  ): YearlyData[] {
    return this.processCompoundInterestData(initialAmount, annualRate, years, monthlyPayment)
  }

  /**
   * 处理贷款数据
   */
  processLoanData(
    loanAmount: number,
    annualRate: number,
    years: number
  ): YearlyData[] {
    const yearlyData: YearlyData[] = []
    const monthlyRate = annualRate / 100 / 12
    const totalMonths = years * 12
    
    // 计算月供
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
    
    let remainingBalance = loanAmount
    let totalInterestPaid = 0

    for (let year = 1; year <= years; year++) {
      const startBalance = remainingBalance
      let yearlyInterest = 0
      let yearlyPrincipal = 0

      for (let month = 1; month <= 12; month++) {
        const monthInterest = remainingBalance * monthlyRate
        const monthPrincipal = monthlyPayment - monthInterest
        
        yearlyInterest += monthInterest
        yearlyPrincipal += monthPrincipal
        remainingBalance -= monthPrincipal
        
        if (remainingBalance < 0.01) {
          remainingBalance = 0
          break
        }
      }

      totalInterestPaid += yearlyInterest

      yearlyData.push({
        year,
        startBalance: this.roundValue(startBalance),
        contributions: this.roundValue(-yearlyPrincipal), // 负值表示还款
        interest: this.roundValue(-yearlyInterest), // 负值表示支付的利息
        endBalance: this.roundValue(remainingBalance),
        cumulativeContributions: this.config.includeCumulative 
          ? this.roundValue(loanAmount - remainingBalance) 
          : undefined,
        cumulativeInterest: this.config.includeCumulative 
          ? this.roundValue(totalInterestPaid) 
          : undefined,
        effectiveRate: this.config.includeEffectiveRate 
          ? this.roundValue(annualRate) 
          : undefined
      })

      if (remainingBalance === 0) break
    }

    return yearlyData
  }

  /**
   * 处理退休规划数据
   */
  processRetirementData(
    currentAge: number,
    retirementAge: number,
    monthlyContribution: number,
    expectedReturn: number,
    currentSavings: number = 0
  ): YearlyData[] {
    const years = retirementAge - currentAge
    return this.processCompoundInterestData(currentSavings, expectedReturn, years, monthlyContribution)
  }

  /**
   * 处理投资组合数据
   */
  processPortfolioData(
    investments: { name: string; amount: number; expectedReturn: number }[],
    years: number
  ): YearlyData[] {
    const yearlyData: YearlyData[] = []
    
    // 计算加权平均收益率
    const totalAmount = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const weightedReturn = investments.reduce((sum, inv) => 
      sum + (inv.amount / totalAmount) * inv.expectedReturn, 0
    )

    return this.processCompoundInterestData(totalAmount, weightedReturn, years, 0)
  }

  /**
   * 处理ETF储蓄计划数据
   */
  processETFSavingsPlanData(
    monthlyInvestment: number,
    expectedReturn: number,
    years: number,
    managementFee: number = 0.2
  ): YearlyData[] {
    // 扣除管理费后的净收益率
    const netReturn = expectedReturn - managementFee
    return this.processSavingsPlanData(monthlyInvestment, netReturn, years, 0)
  }

  /**
   * 生成月度明细
   */
  generateMonthlyBreakdown(
    yearData: YearlyData,
    annualRate: number,
    monthlyPayment: number = 0
  ): MonthlyData[] {
    if (!this.config.includeMonthlyBreakdown) return []

    const monthlyData: MonthlyData[] = []
    const monthlyRate = annualRate / 100 / 12
    let currentBalance = yearData.startBalance

    for (let month = 1; month <= 12; month++) {
      const startBalance = currentBalance
      const monthInterest = currentBalance * monthlyRate
      const endBalance = currentBalance + monthInterest + monthlyPayment

      monthlyData.push({
        month,
        startBalance: this.roundValue(startBalance),
        contribution: this.roundValue(monthlyPayment),
        interest: this.roundValue(monthInterest),
        endBalance: this.roundValue(endBalance)
      })

      currentBalance = endBalance
    }

    return monthlyData
  }

  /**
   * 计算数据差异
   */
  calculateDataDifferences(
    currentData: YearlyData[],
    previousData: YearlyData[]
  ): { year: number; changes: Record<string, { old: number; new: number; diff: number }> }[] {
    const differences: any[] = []

    currentData.forEach(current => {
      const previous = previousData.find(p => p.year === current.year)
      if (!previous) return

      const changes: Record<string, any> = {}
      const fields = ['startBalance', 'contributions', 'interest', 'endBalance', 'effectiveRate']

      fields.forEach(field => {
        const currentValue = (current as any)[field]
        const previousValue = (previous as any)[field]

        if (currentValue !== undefined && previousValue !== undefined && currentValue !== previousValue) {
          changes[field] = {
            old: previousValue,
            new: currentValue,
            diff: currentValue - previousValue
          }
        }
      })

      if (Object.keys(changes).length > 0) {
        differences.push({ year: current.year, changes })
      }
    })

    return differences
  }

  /**
   * 导出数据为CSV格式
   */
  exportToCSV(data: YearlyData[]): string {
    const headers = [
      'Jahr',
      'Anfangssaldo',
      'Einzahlungen',
      'Zinsen',
      'Endsaldo'
    ]

    if (this.config.includeCumulative) {
      headers.push('Gesamt Einzahlungen', 'Gesamt Zinsen')
    }

    if (this.config.includeEffectiveRate) {
      headers.push('Effektiver Zinssatz')
    }

    const csvRows = [headers.join(',')]

    data.forEach(row => {
      const values = [
        row.year.toString(),
        this.formatCurrency(row.startBalance),
        this.formatCurrency(row.contributions),
        this.formatCurrency(row.interest),
        this.formatCurrency(row.endBalance)
      ]

      if (this.config.includeCumulative) {
        values.push(
          this.formatCurrency(row.cumulativeContributions || 0),
          this.formatCurrency(row.cumulativeInterest || 0)
        )
      }

      if (this.config.includeEffectiveRate) {
        values.push(`${this.formatNumber(row.effectiveRate || 0)}%`)
      }

      csvRows.push(values.join(','))
    })

    return csvRows.join('\n')
  }

  /**
   * 导出数据为JSON格式
   */
  exportToJSON(data: YearlyData[]): string {
    return JSON.stringify(data, null, 2)
  }

  /**
   * 数据验证
   */
  validateData(data: YearlyData[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!Array.isArray(data) || data.length === 0) {
      errors.push('数据为空或格式不正确')
      return { isValid: false, errors }
    }

    data.forEach((row, index) => {
      if (typeof row.year !== 'number' || row.year <= 0) {
        errors.push(`第${index + 1}行：年份无效`)
      }

      if (typeof row.startBalance !== 'number' || isNaN(row.startBalance)) {
        errors.push(`第${index + 1}行：起始余额无效`)
      }

      if (typeof row.endBalance !== 'number' || isNaN(row.endBalance)) {
        errors.push(`第${index + 1}行：结束余额无效`)
      }

      if (typeof row.interest !== 'number' || isNaN(row.interest)) {
        errors.push(`第${index + 1}行：利息无效`)
      }
    })

    return { isValid: errors.length === 0, errors }
  }

  /**
   * 数值舍入
   */
  private roundValue(value: number): number {
    const multiplier = Math.pow(10, this.config.precision)
    
    switch (this.config.roundingMode) {
      case 'floor':
        return Math.floor(value * multiplier) / multiplier
      case 'ceil':
        return Math.ceil(value * multiplier) / multiplier
      default:
        return Math.round(value * multiplier) / multiplier
    }
  }

  /**
   * 格式化货币
   */
  private formatCurrency(value: number): string {
    return formatGermanCurrency(value)
  }

  /**
   * 格式化数字
   */
  private formatNumber(value: number): string {
    return formatGermanNumber(value)
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ProcessorConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取配置
   */
  getConfig(): ProcessorConfig {
    return { ...this.config }
  }

  /**
   * 获取数据统计
   */
  getDataStatistics(data: YearlyData[]): {
    totalYears: number
    totalContributions: number
    totalInterest: number
    finalBalance: number
    averageAnnualReturn: number
  } {
    if (data.length === 0) {
      return {
        totalYears: 0,
        totalContributions: 0,
        totalInterest: 0,
        finalBalance: 0,
        averageAnnualReturn: 0
      }
    }

    const totalYears = data.length
    const totalContributions = data.reduce((sum, row) => sum + row.contributions, 0)
    const totalInterest = data.reduce((sum, row) => sum + row.interest, 0)
    const finalBalance = data[data.length - 1].endBalance
    const initialBalance = data[0].startBalance
    
    const averageAnnualReturn = initialBalance > 0 
      ? Math.pow(finalBalance / initialBalance, 1 / totalYears) - 1
      : 0

    return {
      totalYears,
      totalContributions: this.roundValue(totalContributions),
      totalInterest: this.roundValue(totalInterest),
      finalBalance: this.roundValue(finalBalance),
      averageAnnualReturn: this.roundValue(averageAnnualReturn * 100)
    }
  }
}

// 导出工厂函数
export function createTableDataProcessor(config?: Partial<ProcessorConfig>): TableDataProcessor {
  return new TableDataProcessor(config)
}

// 导出默认实例
export const tableDataProcessor = new TableDataProcessor()
