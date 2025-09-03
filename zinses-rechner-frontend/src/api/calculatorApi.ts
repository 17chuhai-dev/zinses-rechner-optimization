/**
 * 计算器API服务
 * 提供所有计算器相关的API接口
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { apiClient, type ApiResponse } from './client'
import { API_ENDPOINTS, buildCalculatorUrl } from './routes'
import type { CalculationResult, ValidationResult } from '@/types/calculator'

// 计算器类型
export type CalculatorType = 'compound-interest' | 'loan' | 'mortgage'

// 基础输入类型
export interface CompoundInterestInput {
  principal: number
  interestRate: number
  compoundingFrequency: number
  timePeriod: number
  additionalContributions?: number
  contributionFrequency?: number
}

export interface LoanInput {
  loanAmount: number
  interestRate: number
  loanTerm: number
  paymentFrequency?: number
  extraPayments?: number
}

export interface MortgageInput {
  homePrice: number
  downPayment: number
  interestRate: number
  loanTerm: number
  propertyTax?: number
  insurance?: number
  pmi?: number
}

// 联合输入类型
export type CalculatorInput = CompoundInterestInput | LoanInput | MortgageInput

// 计算请求接口
export interface CalculationRequest {
  type: CalculatorType
  input: CalculatorInput
  options?: {
    includeBreakdown?: boolean
    includeCharts?: boolean
    currency?: string
    locale?: string
  }
}

// 计算历史接口
export interface CalculationHistory {
  id: string
  userId: string
  calculatorType: CalculatorType
  input: CalculatorInput
  result: CalculationResult
  createdAt: Date
  updatedAt: Date
  name?: string
  description?: string
  tags?: string[]
  favorite: boolean
}

// 计算器模式接口
export interface CalculatorSchema {
  type: CalculatorType
  name: string
  description: string
  version: string
  fields: Array<{
    name: string
    type: 'number' | 'string' | 'boolean' | 'select'
    label: string
    description?: string
    required: boolean
    min?: number
    max?: number
    step?: number
    options?: Array<{ value: string | number | boolean; label: string }>
    defaultValue?: string | number | boolean
    validation?: {
      pattern?: string
      message?: string
    }
  }>
  outputs: Array<{
    name: string
    type: 'number' | 'string' | 'object' | 'array'
    label: string
    description?: string
    format?: string
  }>
}

// 计算器比较接口
export interface CalculatorComparison {
  scenarios: Array<{
    name: string
    input: CalculatorInput
    result: CalculationResult
  }>
  comparison: {
    metrics: Array<{
      name: string
      values: number[]
      winner?: number // 最优方案索引
    }>
    recommendation?: string
  }
}

class CalculatorApiService {
  /**
   * 获取所有可用的计算器列表
   */
  async getCalculators(): Promise<ApiResponse<CalculatorType[]>> {
    return apiClient.get(API_ENDPOINTS.calculators.list)
  }

  /**
   * 获取计算器模式定义
   */
  async getCalculatorSchema(type: CalculatorType): Promise<ApiResponse<CalculatorSchema>> {
    const endpoint = API_ENDPOINTS.calculators.schema.replace(':type', type)
    return apiClient.get(endpoint)
  }

  /**
   * 验证计算器输入
   */
  async validateInput(
    type: CalculatorType,
    input: CalculatorInput
  ): Promise<ApiResponse<ValidationResult>> {
    const endpoint = API_ENDPOINTS.calculators.validate.replace(':type', type)
    return apiClient.post(endpoint, { input })
  }

  /**
   * 执行计算
   */
  async calculate(request: CalculationRequest): Promise<ApiResponse<CalculationResult>> {
    const endpoint = API_ENDPOINTS.calculators.calculate.replace(':type', request.type)
    return apiClient.post(endpoint, {
      input: request.input,
      options: request.options
    })
  }

  /**
   * 复利计算器专用方法
   */
  async calculateCompoundInterest(input: {
    principal: number
    monthlyPayment?: number
    annualRate: number
    years: number
    compoundFrequency?: 'monthly' | 'quarterly' | 'annually'
  }): Promise<ApiResponse<CalculationResult>> {
    return apiClient.post(API_ENDPOINTS.compoundInterest.calculate, { input })
  }

  /**
   * 生成复利计算场景对比
   */
  async generateCompoundInterestScenarios(
    baseInput: CompoundInterestInput,
    variations: Array<{ name: string; changes: Partial<CompoundInterestInput> }>
  ): Promise<ApiResponse<CalculatorComparison>> {
    return apiClient.post(API_ENDPOINTS.compoundInterest.scenarios, {
      baseInput,
      variations
    })
  }

  /**
   * 贷款计算器专用方法
   */
  async calculateLoan(input: {
    principal: number
    annualRate: number
    termYears: number
    paymentType?: 'annuity' | 'linear'
    fixedRatePeriod?: number
  }): Promise<ApiResponse<CalculationResult>> {
    return apiClient.post(API_ENDPOINTS.loan.calculate, { input })
  }

  /**
   * 生成贷款摊销表
   */
  async generateAmortizationSchedule(
    loanId: string,
    options?: {
      format?: 'json' | 'csv' | 'pdf'
      includeCharts?: boolean
    }
  ): Promise<ApiResponse<{ schedule: Array<{ period: number; payment: number; principal: number; interest: number; balance: number }> }>> {
    return apiClient.get(API_ENDPOINTS.loan.amortization, {
      ...options,
      loanId
    })
  }

  /**
   * 贷款方案比较
   */
  async compareLoanOptions(
    scenarios: Array<{
      name: string
      input: LoanInput
    }>
  ): Promise<ApiResponse<CalculatorComparison>> {
    return apiClient.post(API_ENDPOINTS.loan.comparison, { scenarios })
  }

  /**
   * 房贷计算器专用方法
   */
  async calculateMortgage(input: {
    purchasePrice: number
    downPayment: number
    annualRate: number
    termYears: number
    landTransferTaxRate?: number
    notaryRate?: number
    realEstateAgentRate?: number
  }): Promise<ApiResponse<CalculationResult>> {
    return apiClient.post(API_ENDPOINTS.mortgage.calculate, { input })
  }

  /**
   * 房贷承受能力评估
   */
  async assessMortgageAffordability(input: {
    monthlyIncome: number
    monthlyExpenses: number
    existingDebts?: number
    downPayment: number
    interestRate: number
    termYears: number
  }): Promise<ApiResponse<{
    maxPurchasePrice: number
    maxMonthlyPayment: number
    debtToIncomeRatio: number
    recommendation: string
    riskLevel: 'low' | 'medium' | 'high'
  }>> {
    return apiClient.post(API_ENDPOINTS.mortgage.affordability, { input })
  }

  /**
   * 房贷成本分析
   */
  async analyzeMortgageCosts(input: {
    purchasePrice: number
    location: string // 德国州代码
    propertyType: 'house' | 'apartment' | 'commercial'
  }): Promise<ApiResponse<{
    purchasePrice: number
    landTransferTax: number
    notaryCosts: number
    realEstateAgentFee: number
    additionalCosts: number
    totalCosts: number
    breakdown: Array<{
      category: string
      amount: number
      percentage: number
      description: string
    }>
  }>> {
    return apiClient.post(API_ENDPOINTS.mortgage.costs, { input })
  }

  /**
   * 获取计算历史
   */
  async getCalculationHistory(params?: {
    type?: CalculatorType
    limit?: number
    offset?: number
    sortBy?: 'createdAt' | 'updatedAt' | 'name'
    sortOrder?: 'asc' | 'desc'
    search?: string
    tags?: string[]
    favorite?: boolean
  }): Promise<ApiResponse<{
    items: CalculationHistory[]
    total: number
    hasMore: boolean
  }>> {
    return apiClient.get(API_ENDPOINTS.calculators.history, params)
  }

  /**
   * 保存计算结果到历史
   */
  async saveCalculationToHistory(data: {
    calculatorType: CalculatorType
    input: CalculatorInput
    result: CalculationResult
    name?: string
    description?: string
    tags?: string[]
  }): Promise<ApiResponse<CalculationHistory>> {
    return apiClient.post(API_ENDPOINTS.history.create, data)
  }

  /**
   * 更新计算历史记录
   */
  async updateCalculationHistory(
    id: string,
    updates: Partial<Pick<CalculationHistory, 'name' | 'description' | 'tags' | 'favorite'>>
  ): Promise<ApiResponse<CalculationHistory>> {
    const endpoint = API_ENDPOINTS.history.update.replace(':id', id)
    return apiClient.patch(endpoint, updates)
  }

  /**
   * 删除计算历史记录
   */
  async deleteCalculationHistory(id: string): Promise<ApiResponse<void>> {
    const endpoint = API_ENDPOINTS.history.delete.replace(':id', id)
    return apiClient.delete(endpoint)
  }

  /**
   * 搜索计算历史
   */
  async searchCalculationHistory(query: {
    q: string
    type?: CalculatorType
    dateFrom?: Date
    dateTo?: Date
    tags?: string[]
  }): Promise<ApiResponse<{
    items: CalculationHistory[]
    total: number
    facets: {
      types: Array<{ type: CalculatorType; count: number }>
      tags: Array<{ tag: string; count: number }>
    }
  }>> {
    return apiClient.get(API_ENDPOINTS.history.search, query)
  }

  /**
   * 导出计算历史
   */
  async exportCalculationHistory(options: {
    format: 'json' | 'csv' | 'pdf'
    type?: CalculatorType
    dateFrom?: Date
    dateTo?: Date
    includeCharts?: boolean
  }): Promise<ApiResponse<{
    downloadUrl: string
    expiresAt: Date
    fileSize: number
  }>> {
    return apiClient.post(API_ENDPOINTS.history.export, options)
  }

  /**
   * 获取收藏的计算
   */
  async getFavoriteCalculations(): Promise<ApiResponse<CalculationHistory[]>> {
    return apiClient.get(API_ENDPOINTS.calculators.favorites)
  }

  /**
   * 添加到收藏
   */
  async addToFavorites(historyId: string): Promise<ApiResponse<void>> {
    return apiClient.post(API_ENDPOINTS.calculators.favorites, { historyId })
  }

  /**
   * 从收藏中移除
   */
  async removeFromFavorites(historyId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${API_ENDPOINTS.calculators.favorites}/${historyId}`)
  }
}

// 导出单例实例
export const calculatorApi = new CalculatorApiService()

// 导出类型
export type {
  CalculatorType,
  CalculationRequest,
  CalculationHistory,
  CalculatorSchema,
  CalculatorComparison
}
