/**
 * 计算历史管理服务
 * 提供计算历史记录的完整管理功能，包括CRUD操作、搜索、收藏、标签管理等
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type { User } from '@/types/user-identity'
import { hasConsentForPurpose } from '@/utils/user-identity-utils'
import { LocalStorageService } from './LocalStorageService'

// 计算历史数据接口
export interface CalculationHistory {
  id: string
  userId: string
  calculatorType: CalculatorType
  inputData: Record<string, unknown>
  results: CalculationResult
  timestamp: Date
  isFavorite: boolean
  tags: string[]
  notes?: string
  metadata: {
    version: string
    duration: number
    source: 'web' | 'mobile'
    accuracy: number
  }
}

export type CalculatorType = 
  | 'compound-interest'
  | 'loan'
  | 'mortgage'
  | 'portfolio'
  | 'tax-optimization'

export interface CalculationResult {
  finalAmount?: number
  totalContributions?: number
  totalInterest?: number
  annualReturn?: number
  monthlyPayment?: number
  totalCost?: number
  [key: string]: unknown
}

export interface SearchQuery {
  text?: string
  calculatorType?: CalculatorType
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
  isFavorite?: boolean
}

export interface QueryOptions {
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'calculatorType' | 'isFavorite'
  sortOrder?: 'asc' | 'desc'
}

export interface SyncResult {
  success: boolean
  updatedRecords: number
  timestamp: Date
}

export interface DataConflict {
  localRecord: CalculationHistory
  remoteRecord: CalculationHistory
  conflictType: 'timestamp' | 'content' | 'deleted'
}

/**
 * 计算历史管理服务
 */
export class CalculationHistoryService {
  private static instance: CalculationHistoryService
  private storageService: LocalStorageService
  private searchIndex: Map<string, Set<string>> = new Map()
  private metrics = {
    searchTime: [] as number[],
    saveTime: [] as number[],
    loadTime: [] as number[]
  }

  private constructor() {
    this.storageService = new LocalStorageService()
    this.initializeSearchIndex()
  }

  static getInstance(): CalculationHistoryService {
    if (!CalculationHistoryService.instance) {
      CalculationHistoryService.instance = new CalculationHistoryService()
    }
    return CalculationHistoryService.instance
  }

  /**
   * 初始化搜索索引
   */
  private async initializeSearchIndex(): Promise<void> {
    try {
      const allRecords = await this.storageService.getCalculationHistory()
      this.buildSearchIndex(allRecords)
    } catch (error) {
      console.error('Failed to initialize search index:', error)
    }
  }

  /**
   * 构建搜索索引
   */
  private buildSearchIndex(records: CalculationHistory[]): void {
    this.searchIndex.clear()
    
    records.forEach(record => {
      // 索引计算器类型
      this.addToIndex('calculatorType', record.calculatorType, record.id)
      
      // 索引标签
      record.tags.forEach(tag => {
        this.addToIndex('tags', tag.toLowerCase(), record.id)
      })
      
      // 索引备注
      if (record.notes) {
        const words = record.notes.toLowerCase().split(/\s+/)
        words.forEach(word => {
          this.addToIndex('notes', word, record.id)
        })
      }
      
      // 索引收藏状态
      if (record.isFavorite) {
        this.addToIndex('favorite', 'true', record.id)
      }
    })
  }

  /**
   * 添加到搜索索引
   */
  private addToIndex(field: string, value: string, recordId: string): void {
    const key = `${field}:${value}`
    if (!this.searchIndex.has(key)) {
      this.searchIndex.set(key, new Set())
    }
    this.searchIndex.get(key)!.add(recordId)
  }

  /**
   * 保存计算历史
   */
  async save(calculation: Omit<CalculationHistory, 'id' | 'timestamp'>): Promise<void> {
    const startTime = performance.now()
    
    try {
      // 数据验证
      this.validateCalculation(calculation)
      
      // 创建完整记录
      const record: CalculationHistory = {
        ...calculation,
        id: crypto.randomUUID(),
        timestamp: new Date()
      }
      
      // 保存到本地存储
      await this.storageService.saveCalculation(record)
      
      // 更新搜索索引
      this.addRecordToIndex(record)
      
      // 记录性能指标
      const duration = performance.now() - startTime
      this.metrics.saveTime.push(duration)
      
      console.log(`💾 Calculation saved: ${record.id} (${duration.toFixed(2)}ms)`)
      
    } catch (error) {
      console.error('Failed to save calculation:', error)
      throw error
    }
  }

  /**
   * 根据ID查找记录
   */
  async findById(id: string): Promise<CalculationHistory | null> {
    try {
      const allRecords = await this.storageService.getCalculationHistory()
      return allRecords.find(record => record.id === id) || null
    } catch (error) {
      console.error('Failed to find calculation by ID:', error)
      return null
    }
  }

  /**
   * 根据用户ID查找记录
   */
  async findByUserId(userId: string, options?: QueryOptions): Promise<CalculationHistory[]> {
    const startTime = performance.now()
    
    try {
      const allRecords = await this.storageService.getCalculationHistory()
      let userRecords = allRecords.filter(record => record.userId === userId)
      
      // 排序
      if (options?.sortBy) {
        userRecords = this.sortRecords(userRecords, options.sortBy, options.sortOrder || 'desc')
      }
      
      // 分页
      if (options?.offset || options?.limit) {
        const start = options.offset || 0
        const end = options.limit ? start + options.limit : undefined
        userRecords = userRecords.slice(start, end)
      }
      
      // 记录性能指标
      const duration = performance.now() - startTime
      this.metrics.loadTime.push(duration)
      
      return userRecords
      
    } catch (error) {
      console.error('Failed to find calculations by user ID:', error)
      return []
    }
  }

  /**
   * 搜索计算历史
   */
  async search(query: SearchQuery): Promise<CalculationHistory[]> {
    const startTime = performance.now()
    
    try {
      let candidateIds: Set<string> | null = null
      
      // 使用搜索索引快速筛选
      if (query.calculatorType) {
        const ids = this.searchIndex.get(`calculatorType:${query.calculatorType}`)
        candidateIds = this.intersectSets(candidateIds, ids)
      }
      
      if (query.tags && query.tags.length > 0) {
        for (const tag of query.tags) {
          const ids = this.searchIndex.get(`tags:${tag.toLowerCase()}`)
          candidateIds = this.intersectSets(candidateIds, ids)
        }
      }
      
      if (query.isFavorite) {
        const ids = this.searchIndex.get('favorite:true')
        candidateIds = this.intersectSets(candidateIds, ids)
      }
      
      // 获取候选记录
      const allRecords = await this.storageService.getCalculationHistory()
      let results = candidateIds 
        ? allRecords.filter(record => candidateIds!.has(record.id))
        : allRecords
      
      // 文本搜索
      if (query.text) {
        const searchText = query.text.toLowerCase()
        results = results.filter(record => 
          record.notes?.toLowerCase().includes(searchText) ||
          record.tags.some(tag => tag.toLowerCase().includes(searchText))
        )
      }
      
      // 日期范围筛选
      if (query.dateRange) {
        results = results.filter(record => 
          record.timestamp >= query.dateRange!.start &&
          record.timestamp <= query.dateRange!.end
        )
      }
      
      // 按时间戳降序排序
      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      
      // 记录性能指标
      const duration = performance.now() - startTime
      this.metrics.searchTime.push(duration)
      
      console.log(`🔍 Search completed: ${results.length} results (${duration.toFixed(2)}ms)`)
      
      return results
      
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }

  /**
   * 根据标签查找
   */
  async findByTags(tags: string[]): Promise<CalculationHistory[]> {
    return this.search({ tags })
  }

  /**
   * 获取收藏记录
   */
  async getFavorites(userId: string): Promise<CalculationHistory[]> {
    return this.search({ isFavorite: true })
  }

  /**
   * 更新记录
   */
  async update(id: string, updates: Partial<CalculationHistory>): Promise<void> {
    try {
      const allRecords = await this.storageService.getCalculationHistory()
      const recordIndex = allRecords.findIndex(record => record.id === id)
      
      if (recordIndex === -1) {
        throw new Error(`Calculation with ID ${id} not found`)
      }
      
      // 更新记录
      const updatedRecord = {
        ...allRecords[recordIndex],
        ...updates,
        timestamp: new Date() // 更新时间戳
      }
      
      allRecords[recordIndex] = updatedRecord
      
      // 重新保存所有记录（简化实现）
      await this.storageService.clearCalculationHistory()
      for (const record of allRecords) {
        await this.storageService.saveCalculation(record)
      }
      
      // 重建搜索索引
      this.buildSearchIndex(allRecords)
      
      console.log(`📝 Calculation updated: ${id}`)
      
    } catch (error) {
      console.error('Failed to update calculation:', error)
      throw error
    }
  }

  /**
   * 删除记录
   */
  async delete(id: string): Promise<void> {
    try {
      await this.storageService.deleteCalculation(id)
      
      // 从搜索索引中移除
      this.removeFromSearchIndex(id)
      
      console.log(`🗑️ Calculation deleted: ${id}`)
      
    } catch (error) {
      console.error('Failed to delete calculation:', error)
      throw error
    }
  }

  /**
   * 批量删除
   */
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      for (const id of ids) {
        await this.delete(id)
      }
      console.log(`🗑️ Bulk deleted ${ids.length} calculations`)
    } catch (error) {
      console.error('Failed to bulk delete calculations:', error)
      throw error
    }
  }

  /**
   * 批量更新标签
   */
  async bulkUpdateTags(ids: string[], tags: string[]): Promise<void> {
    try {
      for (const id of ids) {
        await this.update(id, { tags })
      }
      console.log(`🏷️ Bulk updated tags for ${ids.length} calculations`)
    } catch (error) {
      console.error('Failed to bulk update tags:', error)
      throw error
    }
  }

  // 辅助方法
  private validateCalculation(calculation: Omit<CalculationHistory, 'id' | 'timestamp'>): void {
    if (!calculation.userId) {
      throw new Error('User ID is required')
    }
    if (!calculation.calculatorType) {
      throw new Error('Calculator type is required')
    }
    if (!calculation.inputData || Object.keys(calculation.inputData).length === 0) {
      throw new Error('Input data is required')
    }
    if (!calculation.results || Object.keys(calculation.results).length === 0) {
      throw new Error('Results are required')
    }
  }

  private addRecordToIndex(record: CalculationHistory): void {
    this.addToIndex('calculatorType', record.calculatorType, record.id)
    record.tags.forEach(tag => {
      this.addToIndex('tags', tag.toLowerCase(), record.id)
    })
    if (record.notes) {
      const words = record.notes.toLowerCase().split(/\s+/)
      words.forEach(word => {
        this.addToIndex('notes', word, record.id)
      })
    }
    if (record.isFavorite) {
      this.addToIndex('favorite', 'true', record.id)
    }
  }

  private removeFromSearchIndex(recordId: string): void {
    for (const [key, ids] of this.searchIndex.entries()) {
      ids.delete(recordId)
      if (ids.size === 0) {
        this.searchIndex.delete(key)
      }
    }
  }

  private intersectSets(set1: Set<string> | null, set2: Set<string> | undefined): Set<string> | null {
    if (!set2) return set1
    if (!set1) return new Set(set2)
    return new Set([...set1].filter(id => set2.has(id)))
  }

  private sortRecords(
    records: CalculationHistory[], 
    sortBy: string, 
    order: 'asc' | 'desc'
  ): CalculationHistory[] {
    return records.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime()
          break
        case 'calculatorType':
          comparison = a.calculatorType.localeCompare(b.calculatorType)
          break
        case 'isFavorite':
          comparison = (a.isFavorite ? 1 : 0) - (b.isFavorite ? 1 : 0)
          break
        default:
          return 0
      }
      
      return order === 'desc' ? -comparison : comparison
    })
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    
    return {
      searchTime: {
        average: avg(this.metrics.searchTime),
        count: this.metrics.searchTime.length
      },
      saveTime: {
        average: avg(this.metrics.saveTime),
        count: this.metrics.saveTime.length
      },
      loadTime: {
        average: avg(this.metrics.loadTime),
        count: this.metrics.loadTime.length
      }
    }
  }
}
