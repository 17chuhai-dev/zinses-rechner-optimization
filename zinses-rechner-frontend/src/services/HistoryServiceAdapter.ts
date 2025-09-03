/**
 * 历史服务适配器
 * 创建实时计算与历史服务的适配层，实现统一的数据接口和格式转换
 */

import { realtimeCalculationEngine } from '@/core/RealtimeCalculationEngine'
import { defaultCache } from '@/core/LRUCache'

// 历史记录数据模型
export interface HistoryRecord {
  id: string
  userId: string
  calculatorId: string
  calculatorType: string
  inputData: Record<string, any>
  outputData: Record<string, any>
  metadata: HistoryMetadata
  createdAt: Date
  updatedAt: Date
  version: number
}

// 历史记录元数据
export interface HistoryMetadata {
  title?: string
  description?: string
  tags: string[]
  isPublic: boolean
  isFavorite: boolean
  calculationTime: number
  dataVersion: string
  userAgent: string
  sessionId: string
}

// 保存请求接口
export interface SaveHistoryRequest {
  calculatorId: string
  inputData: Record<string, any>
  outputData: Record<string, any>
  metadata?: Partial<HistoryMetadata>
  autoTitle?: boolean
}

// 查询请求接口
export interface QueryHistoryRequest {
  userId?: string
  calculatorId?: string
  calculatorType?: string
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  searchText?: string
  isPublic?: boolean
  isFavorite?: boolean
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// 查询响应接口
export interface QueryHistoryResponse {
  records: HistoryRecord[]
  total: number
  hasMore: boolean
  nextOffset?: number
}

// API响应接口
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: Date
}

/**
 * 历史服务适配器类
 */
export class HistoryServiceAdapter {
  private static instance: HistoryServiceAdapter
  private baseUrl: string
  private apiKey: string
  private userId: string | null = null
  private sessionId: string

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // 移除末尾斜杠
    this.apiKey = config.apiKey
    this.sessionId = this.generateSessionId()

    console.log('📚 历史服务适配器已初始化')
  }

  static getInstance(config?: { baseUrl: string; apiKey: string }): HistoryServiceAdapter {
    if (!HistoryServiceAdapter.instance) {
      if (!config) {
        throw new Error('首次创建实例时必须提供配置')
      }
      HistoryServiceAdapter.instance = new HistoryServiceAdapter(config)
    }
    return HistoryServiceAdapter.instance
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId
    console.log(`👤 用户ID已设置: ${userId}`)
  }

  /**
   * 保存历史记录
   */
  async saveHistory(request: SaveHistoryRequest): Promise<HistoryRecord> {
    this.validateSaveRequest(request)

    const record = this.createHistoryRecord(request)

    try {
      const response = await this.makeApiCall<HistoryRecord>('POST', '/history', record)

      if (response.success && response.data) {
        console.log(`💾 历史记录已保存: ${response.data.id}`)

        // 更新缓存
        this.updateCache(response.data)

        return response.data
      } else {
        throw new Error(response.error?.message || '保存失败')
      }
    } catch (error) {
      console.error('❌ 保存历史记录失败:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * 查询历史记录
   */
  async queryHistory(request: QueryHistoryRequest = {}): Promise<QueryHistoryResponse> {
    try {
      const queryParams = this.buildQueryParams(request)
      const response = await this.makeApiCall<QueryHistoryResponse>('GET', `/history?${queryParams}`)

      if (response.success && response.data) {
        console.log(`📋 查询到 ${response.data.records.length} 条历史记录`)

        // 缓存查询结果
        this.cacheQueryResults(response.data.records)

        return response.data
      } else {
        throw new Error(response.error?.message || '查询失败')
      }
    } catch (error) {
      console.error('❌ 查询历史记录失败:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * 获取单个历史记录
   */
  async getHistoryById(id: string): Promise<HistoryRecord | null> {
    // 先检查缓存
    const cached = defaultCache.get(`history_${id}`)
    if (cached) {
      console.log(`💾 从缓存获取历史记录: ${id}`)
      return cached
    }

    try {
      const response = await this.makeApiCall<HistoryRecord>('GET', `/history/${id}`)

      if (response.success && response.data) {
        // 更新缓存
        this.updateCache(response.data)
        return response.data
      } else {
        return null
      }
    } catch (error) {
      console.error(`❌ 获取历史记录失败 (${id}):`, error)
      return null
    }
  }

  /**
   * 更新历史记录
   */
  async updateHistory(id: string, updates: Partial<HistoryRecord>): Promise<HistoryRecord> {
    try {
      const response = await this.makeApiCall<HistoryRecord>('PUT', `/history/${id}`, updates)

      if (response.success && response.data) {
        console.log(`✏️ 历史记录已更新: ${id}`)

        // 更新缓存
        this.updateCache(response.data)

        return response.data
      } else {
        throw new Error(response.error?.message || '更新失败')
      }
    } catch (error) {
      console.error(`❌ 更新历史记录失败 (${id}):`, error)
      throw this.handleApiError(error)
    }
  }

  /**
   * 删除历史记录
   */
  async deleteHistory(id: string): Promise<boolean> {
    try {
      const response = await this.makeApiCall<{ deleted: boolean }>('DELETE', `/history/${id}`)

      if (response.success && response.data?.deleted) {
        console.log(`🗑️ 历史记录已删除: ${id}`)

        // 从缓存中移除
        defaultCache.delete(`history_${id}`)

        return true
      } else {
        return false
      }
    } catch (error) {
      console.error(`❌ 删除历史记录失败 (${id}):`, error)
      throw this.handleApiError(error)
    }
  }

  /**
   * 批量保存历史记录
   */
  async batchSaveHistory(requests: SaveHistoryRequest[]): Promise<HistoryRecord[]> {
    if (requests.length === 0) return []

    const records = requests.map(request => {
      this.validateSaveRequest(request)
      return this.createHistoryRecord(request)
    })

    try {
      const response = await this.makeApiCall<HistoryRecord[]>('POST', '/history/batch', { records })

      if (response.success && response.data) {
        console.log(`💾 批量保存了 ${response.data.length} 条历史记录`)

        // 批量更新缓存
        response.data.forEach(record => this.updateCache(record))

        return response.data
      } else {
        throw new Error(response.error?.message || '批量保存失败')
      }
    } catch (error) {
      console.error('❌ 批量保存历史记录失败:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * 从实时计算结果创建历史记录
   */
  createHistoryFromRealtimeResult(
    calculatorId: string,
    inputData: Record<string, any>,
    outputData: Record<string, any>,
    metadata?: Partial<HistoryMetadata>
  ): SaveHistoryRequest {
    return {
      calculatorId,
      inputData: this.sanitizeInputData(inputData),
      outputData: this.sanitizeOutputData(outputData),
      metadata: {
        title: this.generateAutoTitle(calculatorId, inputData),
        tags: this.generateAutoTags(calculatorId, inputData),
        isPublic: false,
        isFavorite: false,
        calculationTime: Date.now(),
        dataVersion: '1.0',
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        ...metadata
      },
      autoTitle: true
    }
  }

  /**
   * 验证保存请求
   */
  private validateSaveRequest(request: SaveHistoryRequest): void {
    if (!request.calculatorId) {
      throw new Error('计算器ID不能为空')
    }

    if (!request.inputData || Object.keys(request.inputData).length === 0) {
      throw new Error('输入数据不能为空')
    }

    if (!request.outputData || Object.keys(request.outputData).length === 0) {
      throw new Error('输出数据不能为空')
    }

    if (!this.userId) {
      throw new Error('用户未登录')
    }
  }

  /**
   * 创建历史记录对象
   */
  private createHistoryRecord(request: SaveHistoryRequest): Omit<HistoryRecord, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date()

    return {
      userId: this.userId!,
      calculatorId: request.calculatorId,
      calculatorType: this.getCalculatorType(request.calculatorId),
      inputData: request.inputData,
      outputData: request.outputData,
      metadata: {
        title: request.metadata?.title || this.generateAutoTitle(request.calculatorId, request.inputData),
        description: request.metadata?.description || '',
        tags: request.metadata?.tags || this.generateAutoTags(request.calculatorId, request.inputData),
        isPublic: request.metadata?.isPublic || false,
        isFavorite: request.metadata?.isFavorite || false,
        calculationTime: request.metadata?.calculationTime || Date.now(),
        dataVersion: request.metadata?.dataVersion || '1.0',
        userAgent: request.metadata?.userAgent || navigator.userAgent,
        sessionId: request.metadata?.sessionId || this.sessionId
      },
      version: 1
    }
  }

  /**
   * 构建查询参数
   */
  private buildQueryParams(request: QueryHistoryRequest): string {
    const params = new URLSearchParams()

    if (request.userId) params.append('userId', request.userId)
    if (request.calculatorId) params.append('calculatorId', request.calculatorId)
    if (request.calculatorType) params.append('calculatorType', request.calculatorType)
    if (request.tags && request.tags.length > 0) {
      params.append('tags', request.tags.join(','))
    }
    if (request.dateRange) {
      params.append('startDate', request.dateRange.start.toISOString())
      params.append('endDate', request.dateRange.end.toISOString())
    }
    if (request.searchText) params.append('search', request.searchText)
    if (request.isPublic !== undefined) params.append('isPublic', String(request.isPublic))
    if (request.isFavorite !== undefined) params.append('isFavorite', String(request.isFavorite))
    if (request.limit) params.append('limit', String(request.limit))
    if (request.offset) params.append('offset', String(request.offset))
    if (request.sortBy) params.append('sortBy', request.sortBy)
    if (request.sortOrder) params.append('sortOrder', request.sortOrder)

    return params.toString()
  }

  /**
   * 发起API调用
   */
  private async makeApiCall<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Session-ID': this.sessionId
    }

    if (this.userId) {
      headers['X-User-ID'] = this.userId
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include'
    }

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data)
    }

    const response = await fetch(url, config)
    const responseData = await response.json()

    return {
      success: response.ok,
      data: response.ok ? responseData : undefined,
      error: response.ok ? undefined : {
        code: String(response.status),
        message: responseData.message || response.statusText,
        details: responseData
      },
      timestamp: new Date()
    }
  }

  /**
   * 处理API错误
   */
  private handleApiError(error: any): Error {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Error('网络连接失败，请检查网络设置')
    }

    if (error.message) {
      return new Error(error.message)
    }

    return new Error('未知错误')
  }

  /**
   * 更新缓存
   */
  private updateCache(record: HistoryRecord): void {
    defaultCache.set(`history_${record.id}`, record)
  }

  /**
   * 缓存查询结果
   */
  private cacheQueryResults(records: HistoryRecord[]): void {
    records.forEach(record => this.updateCache(record))
  }

  /**
   * 清理输入数据
   */
  private sanitizeInputData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * 清理输出数据
   */
  private sanitizeOutputData(data: Record<string, any>): Record<string, any> {
    return this.sanitizeInputData(data) // 使用相同的清理逻辑
  }

  /**
   * 生成自动标题
   */
  private generateAutoTitle(calculatorId: string, inputData: Record<string, any>): string {
    const calculatorNames: Record<string, string> = {
      'compound-interest': 'Zinseszins-Berechnung',
      'savings-plan': 'Sparplan-Berechnung',
      'loan': 'Kredit-Berechnung',
      'mortgage': 'Hypotheken-Berechnung',
      'retirement': 'Altersvorsorge-Berechnung',
      'portfolio': 'Portfolio-Berechnung',
      'tax-optimization': 'Steueroptimierung',
      'etf-savings-plan': 'ETF-Sparplan-Berechnung'
    }

    const baseName = calculatorNames[calculatorId] || 'Finanz-Berechnung'
    const timestamp = new Date().toLocaleDateString('de-DE')

    return `${baseName} - ${timestamp}`
  }

  /**
   * 生成自动标签
   */
  private generateAutoTags(calculatorId: string, inputData: Record<string, any>): string[] {
    const tags = [calculatorId]

    // 根据输入数据添加相关标签
    if (inputData.principal && inputData.principal > 100000) {
      tags.push('high-amount')
    }

    if (inputData.years && inputData.years > 20) {
      tags.push('long-term')
    }

    if (inputData.monthlyPayment && inputData.monthlyPayment > 0) {
      tags.push('monthly-payment')
    }

    return tags
  }

  /**
   * 获取计算器类型
   */
  private getCalculatorType(calculatorId: string): string {
    const typeMap: Record<string, string> = {
      'compound-interest': 'investment',
      'savings-plan': 'savings',
      'loan': 'loan',
      'mortgage': 'loan',
      'retirement': 'retirement',
      'portfolio': 'investment',
      'tax-optimization': 'tax',
      'etf-savings-plan': 'investment'
    }

    return typeMap[calculatorId] || 'general'
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// 导出默认实例配置
export const historyServiceAdapter = HistoryServiceAdapter.getInstance({
  baseUrl: import.meta.env.VITE_HISTORY_API_URL || 'http://localhost:8000/api/v1',
  apiKey: import.meta.env.VITE_HISTORY_API_KEY || 'dev-api-key'
})
