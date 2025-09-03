/**
 * 数据转换工具
 * 确保API响应数据包含兼容性属性
 */

import type { CalculationResult, YearlyData } from '@/types/calculator'

/**
 * 转换计算结果，添加camelCase兼容性属性
 */
export function transformCalculationResult(result: any): CalculationResult {
  return {
    // 保持原有的snake_case属性
    final_amount: result.final_amount,
    total_contributions: result.total_contributions,
    total_interest: result.total_interest,
    annual_return: result.annual_return,
    yearly_breakdown: result.yearly_breakdown || [],
    calculation_time: result.calculation_time,
    
    // 添加camelCase兼容性属性
    finalAmount: result.final_amount,
    totalContributions: result.total_contributions,
    totalInterest: result.total_interest,
    annualReturn: result.annual_return,
    yearlyBreakdown: result.yearly_breakdown || []
  }
}

/**
 * 转换年度数据，添加兼容性属性
 */
export function transformYearlyData(data: any[]): YearlyData[] {
  return data.map(item => ({
    year: item.year,
    start_amount: item.start_amount,
    contributions: item.contributions,
    interest: item.interest,
    end_amount: item.end_amount,
    growth_rate: item.growth_rate
  }))
}

/**
 * 安全获取属性值，支持snake_case和camelCase
 */
export function safeGet(obj: any, snakeKey: string, camelKey: string): any {
  return obj[snakeKey] ?? obj[camelKey] ?? 0
}

/**
 * 格式化API响应数据
 */
export function formatApiResponse(response: any): CalculationResult {
  if (!response) {
    throw new Error('Invalid API response')
  }

  return transformCalculationResult(response)
}
