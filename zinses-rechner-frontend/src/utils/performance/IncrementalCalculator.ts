/**
 * 增量计算引擎
 * 实现智能的增量计算，只计算变化的部分，提升计算效率
 */

import { CalculationCache } from './CalculationCache'

// 计算输入接口
export interface CalculationInput {
  initialAmount: number
  monthlyAmount: number
  annualRate: number
  investmentYears: number
  taxRate?: number
  inflationRate?: number
  [key: string]: any
}

// 计算结果接口
export interface CalculationResult {
  finalAmount: number
  totalContributions: number
  totalInterest: number
  effectiveRate: number
  yearlyBreakdown: YearlyData[]
  breakdown: {
    principal: number
    monthlyContributions: number
    compoundInterest: number
    totalReturn: number
  }
  metadata: {
    calculationTime: number
    cacheHit: boolean
    incrementalUpdate: boolean
    affectedYears: number[]
  }
}

// 年度数据接口
export interface YearlyData {
  year: number
  startAmount: number
  contributions: number
  interest: number
  endAmount: number
  growthRate: number
}

// 变化检测结果接口
export interface ChangeDetection {
  hasChanges: boolean
  changedFields: string[]
  affectedYears: number[]
  impactLevel: 'low' | 'medium' | 'high'
  canUseIncremental: boolean
}

/**
 * 增量计算引擎类
 */
export class IncrementalCalculator {
  private cache: CalculationCache
  private lastInput: CalculationInput | null = null
  private lastResult: CalculationResult | null = null

  constructor(cache?: CalculationCache) {
    this.cache = cache || new CalculationCache()
  }

  /**
   * 执行计算（支持增量计算）
   */
  async calculate(input: CalculationInput): Promise<CalculationResult> {
    const startTime = performance.now()
    
    // 生成缓存键
    const cacheKey = this.cache.generateKey(input)
    
    // 尝试从缓存获取
    const cachedResult = this.cache.get<CalculationResult>(cacheKey)
    if (cachedResult) {
      return {
        ...cachedResult,
        metadata: {
          ...cachedResult.metadata,
          calculationTime: performance.now() - startTime,
          cacheHit: true,
          incrementalUpdate: false
        }
      }
    }

    // 检测变化
    const changeDetection = this.detectChanges(input)
    
    let result: CalculationResult

    if (changeDetection.canUseIncremental && this.lastResult) {
      // 使用增量计算
      result = await this.performIncrementalCalculation(input, changeDetection)
    } else {
      // 执行完整计算
      result = await this.performFullCalculation(input)
    }

    // 更新元数据
    result.metadata = {
      ...result.metadata,
      calculationTime: performance.now() - startTime,
      cacheHit: false,
      incrementalUpdate: changeDetection.canUseIncremental
    }

    // 缓存结果
    this.cache.set(cacheKey, result, result.metadata.calculationTime)
    
    // 更新最后的输入和结果
    this.lastInput = { ...input }
    this.lastResult = result

    return result
  }

  /**
   * 检测输入变化
   */
  private detectChanges(input: CalculationInput): ChangeDetection {
    if (!this.lastInput) {
      return {
        hasChanges: true,
        changedFields: Object.keys(input),
        affectedYears: [],
        impactLevel: 'high',
        canUseIncremental: false
      }
    }

    const changedFields: string[] = []
    const criticalFields = ['initialAmount', 'annualRate', 'investmentYears']
    const minorFields = ['taxRate', 'inflationRate']

    // 检测字段变化
    for (const [key, value] of Object.entries(input)) {
      if (this.lastInput[key] !== value) {
        changedFields.push(key)
      }
    }

    if (changedFields.length === 0) {
      return {
        hasChanges: false,
        changedFields: [],
        affectedYears: [],
        impactLevel: 'low',
        canUseIncremental: false
      }
    }

    // 评估影响级别
    const hasCriticalChanges = changedFields.some(field => criticalFields.includes(field))
    const hasOnlyMinorChanges = changedFields.every(field => minorFields.includes(field))
    const hasOnlyMonthlyAmountChange = changedFields.length === 1 && changedFields[0] === 'monthlyAmount'

    let impactLevel: 'low' | 'medium' | 'high'
    let canUseIncremental = false

    if (hasOnlyMinorChanges) {
      impactLevel = 'low'
      canUseIncremental = true
    } else if (hasOnlyMonthlyAmountChange) {
      impactLevel = 'medium'
      canUseIncremental = true
    } else if (hasCriticalChanges) {
      impactLevel = 'high'
      canUseIncremental = false
    } else {
      impactLevel = 'medium'
      canUseIncremental = true
    }

    // 计算受影响的年份
    const affectedYears = this.calculateAffectedYears(changedFields, input)

    return {
      hasChanges: true,
      changedFields,
      affectedYears,
      impactLevel,
      canUseIncremental
    }
  }

  /**
   * 执行增量计算
   */
  private async performIncrementalCalculation(
    input: CalculationInput, 
    changeDetection: ChangeDetection
  ): Promise<CalculationResult> {
    if (!this.lastResult) {
      return this.performFullCalculation(input)
    }

    const result = { ...this.lastResult }
    
    // 根据变化类型执行不同的增量更新
    if (changeDetection.changedFields.includes('monthlyAmount')) {
      result.yearlyBreakdown = this.updateMonthlyAmountIncremental(
        result.yearlyBreakdown,
        input,
        this.lastInput!
      )
    }

    if (changeDetection.changedFields.includes('taxRate')) {
      result.yearlyBreakdown = this.updateTaxRateIncremental(
        result.yearlyBreakdown,
        input,
        this.lastInput!
      )
    }

    if (changeDetection.changedFields.includes('inflationRate')) {
      result.yearlyBreakdown = this.updateInflationRateIncremental(
        result.yearlyBreakdown,
        input,
        this.lastInput!
      )
    }

    // 重新计算汇总数据
    result.finalAmount = result.yearlyBreakdown[result.yearlyBreakdown.length - 1]?.endAmount || 0
    result.totalContributions = input.initialAmount + (input.monthlyAmount * input.investmentYears * 12)
    result.totalInterest = result.finalAmount - result.totalContributions
    result.effectiveRate = (result.totalInterest / result.totalContributions) * 100

    result.breakdown = {
      principal: input.initialAmount,
      monthlyContributions: input.monthlyAmount * input.investmentYears * 12,
      compoundInterest: result.totalInterest,
      totalReturn: ((result.finalAmount / result.totalContributions) - 1) * 100
    }

    result.metadata = {
      calculationTime: 0,
      cacheHit: false,
      incrementalUpdate: true,
      affectedYears: changeDetection.affectedYears
    }

    return result
  }

  /**
   * 执行完整计算
   */
  private async performFullCalculation(input: CalculationInput): Promise<CalculationResult> {
    const monthlyRate = input.annualRate / 100 / 12
    const totalMonths = input.investmentYears * 12
    
    let balance = input.initialAmount
    const yearlyBreakdown: YearlyData[] = []
    
    // 逐年计算
    for (let year = 1; year <= input.investmentYears; year++) {
      const startBalance = balance
      
      // 每月投入和复利
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + input.monthlyAmount
      }
      
      const contributions = input.monthlyAmount * 12
      const interest = balance - startBalance - contributions
      const growthRate = startBalance > 0 ? ((balance - startBalance) / startBalance) * 100 : 0
      
      yearlyBreakdown.push({
        year,
        startAmount: startBalance,
        contributions,
        interest,
        endAmount: balance,
        growthRate
      })
    }

    const totalContributions = input.initialAmount + (input.monthlyAmount * totalMonths)
    const totalInterest = balance - totalContributions
    const effectiveRate = totalContributions > 0 ? (totalInterest / totalContributions) * 100 : 0

    return {
      finalAmount: balance,
      totalContributions,
      totalInterest,
      effectiveRate,
      yearlyBreakdown,
      breakdown: {
        principal: input.initialAmount,
        monthlyContributions: input.monthlyAmount * totalMonths,
        compoundInterest: totalInterest,
        totalReturn: totalContributions > 0 ? ((balance / totalContributions) - 1) * 100 : 0
      },
      metadata: {
        calculationTime: 0,
        cacheHit: false,
        incrementalUpdate: false,
        affectedYears: []
      }
    }
  }

  /**
   * 增量更新月度投入
   */
  private updateMonthlyAmountIncremental(
    yearlyBreakdown: YearlyData[],
    newInput: CalculationInput,
    oldInput: CalculationInput
  ): YearlyData[] {
    const monthlyDifference = newInput.monthlyAmount - oldInput.monthlyAmount
    const monthlyRate = newInput.annualRate / 100 / 12
    
    let cumulativeEffect = 0
    
    return yearlyBreakdown.map((yearData, index) => {
      // 计算当年的额外贡献
      const additionalContributions = monthlyDifference * 12
      
      // 计算复利效应
      let additionalInterest = 0
      for (let month = 1; month <= 12; month++) {
        additionalInterest += monthlyDifference * Math.pow(1 + monthlyRate, 12 - month)
      }
      
      // 累积之前年份的复利效应
      cumulativeEffect = cumulativeEffect * (1 + newInput.annualRate / 100) + additionalInterest
      
      const newEndAmount = yearData.endAmount + cumulativeEffect + additionalContributions
      
      return {
        ...yearData,
        contributions: yearData.contributions + additionalContributions,
        interest: yearData.interest + additionalInterest + (cumulativeEffect - additionalInterest),
        endAmount: newEndAmount,
        growthRate: yearData.startAmount > 0 ? 
          ((newEndAmount - yearData.startAmount) / yearData.startAmount) * 100 : 0
      }
    })
  }

  /**
   * 增量更新税率
   */
  private updateTaxRateIncremental(
    yearlyBreakdown: YearlyData[],
    newInput: CalculationInput,
    oldInput: CalculationInput
  ): YearlyData[] {
    const taxRateDifference = (newInput.taxRate || 0) - (oldInput.taxRate || 0)
    
    return yearlyBreakdown.map(yearData => {
      // 简化的税率影响计算（实际应用中可能更复杂）
      const taxImpact = yearData.interest * (taxRateDifference / 100)
      
      return {
        ...yearData,
        interest: yearData.interest - taxImpact,
        endAmount: yearData.endAmount - taxImpact
      }
    })
  }

  /**
   * 增量更新通胀率
   */
  private updateInflationRateIncremental(
    yearlyBreakdown: YearlyData[],
    newInput: CalculationInput,
    oldInput: CalculationInput
  ): YearlyData[] {
    // 通胀率主要影响实际购买力，不直接影响名义金额
    // 这里可以添加实际价值的计算逻辑
    return yearlyBreakdown
  }

  /**
   * 计算受影响的年份
   */
  private calculateAffectedYears(changedFields: string[], input: CalculationInput): number[] {
    const affectedYears: number[] = []
    
    // 根据变化的字段确定受影响的年份
    if (changedFields.includes('monthlyAmount') || changedFields.includes('annualRate')) {
      // 月度投入和利率变化影响所有年份
      for (let year = 1; year <= input.investmentYears; year++) {
        affectedYears.push(year)
      }
    } else if (changedFields.includes('taxRate') || changedFields.includes('inflationRate')) {
      // 税率和通胀率变化也影响所有年份，但影响较小
      for (let year = 1; year <= input.investmentYears; year++) {
        affectedYears.push(year)
      }
    }
    
    return affectedYears
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.lastInput = null
    this.lastResult = null
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return this.cache.getStats()
  }
}

// 创建默认增量计算器实例
export const defaultIncrementalCalculator = new IncrementalCalculator()
