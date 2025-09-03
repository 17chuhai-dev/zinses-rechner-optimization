/**
 * API服务模块
 * 处理与后端FastAPI的通信
 */

import type { CalculatorForm, CalculationResult, ApiError } from '@/types/calculator'
import { transformCalculationResult } from '@/utils/dataTransform'

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_VERSION = 'v1'

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/${API_VERSION}`
  }

  /**
   * 通用请求方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.error?.code || response.status.toString(),
          errorData.error?.details || {}
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // 网络错误或其他错误
      throw new ApiError(
        'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
        'NETWORK_ERROR',
        { originalError: error }
      )
    }
  }

  /**
   * GET请求
   */
  private async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST请求
   */
  private async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 计算复利
   */
  async calculateCompoundInterest(form: CalculatorForm): Promise<CalculationResult> {
    const requestData = {
      principal: form.principal,
      monthly_payment: form.monthlyPayment,
      annual_rate: form.annualRate,
      years: form.years,
      compound_frequency: form.compoundFrequency,
    }

    const response = await this.post<any>('/calculator/compound-interest', requestData)
    return transformCalculationResult(response)
  }

  /**
   * 获取计算限制
   */
  async getCalculationLimits(): Promise<{
    max_principal: number
    max_monthly_payment: number
    max_annual_rate: number
    max_years: number
    supported_frequencies: string[]
    currency: string
    locale: string
  }> {
    return this.get('/calculate/limits')
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: string
    timestamp: string
    version: string
    environment: string
  }> {
    return this.get('/health')
  }
}

// 创建API服务实例
export const apiService = new ApiService()

// 导出API错误类
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details: Record<string, unknown> = {}
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 导出便捷方法
export const calculatorAPI = {
  calculate: (form: CalculatorForm) => apiService.calculateCompoundInterest(form),
  getLimits: () => apiService.getCalculationLimits(),
  healthCheck: () => apiService.healthCheck(),
}
