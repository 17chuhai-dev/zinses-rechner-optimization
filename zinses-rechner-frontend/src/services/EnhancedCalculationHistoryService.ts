/**
 * 增强的计算历史管理服务
 * 提供高级历史记录管理功能，包括智能搜索、批量操作、数据分析等
 */

import { ref, reactive, computed } from 'vue'
import type { CalculationHistory } from './CalculationHistoryService'
import { calculationHistoryService } from './CalculationHistoryService'

// 智能搜索查询接口
export interface SmartSearchQuery {
  text?: string
  dateRange?: {
    start: Date
    end: Date
  }
  calculatorTypes?: string[]
  tags?: string[]
  resultRange?: {
    min: number
    max: number
  }
  isFavorite?: boolean
  hasNotes?: boolean
  operators?: {
    field: string
    operator: '>' | '<' | '=' | '>=' | '<=' | '!='
    value: any
  }[]
}

// 搜索建议接口
export interface SearchSuggestion {
  text: string
  icon: string
  count: number
  query: SmartSearchQuery
  category: 'recent' | 'popular' | 'smart' | 'filter'
}

// 批量操作结果
export interface BulkOperationResult {
  success: boolean
  processed: number
  failed: number
  errors: string[]
  results?: any[]
}

// 历史分析数据
export interface HistoryAnalytics {
  totalCalculations: number
  calculationsByType: Record<string, number>
  calculationsByMonth: Record<string, number>
  averageResults: Record<string, number>
  favoriteCount: number
  tagUsage: Record<string, number>
  trends: {
    mostUsedCalculator: string
    growthRate: number
    peakUsageDay: string
    averageSessionLength: number
  }
  insights: string[]
}

// 数据导出选项
export interface ExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf'
  includeCharts: boolean
  includeMetadata: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  fields?: string[]
  groupBy?: string
}

/**
 * 增强的计算历史管理服务类
 */
export class EnhancedCalculationHistoryService {
  private static instance: EnhancedCalculationHistoryService

  // 服务状态
  public readonly state = reactive({
    isAnalyzing: false,
    searchSuggestions: [] as SearchSuggestion[],
    recentSearches: [] as string[],
    analytics: null as HistoryAnalytics | null,
    selectedItems: [] as string[],
    bulkOperationProgress: 0
  })

  // 搜索索引缓存
  private searchCache = new Map<string, CalculationHistory[]>()
  private suggestionCache = new Map<string, SearchSuggestion[]>()

  public static getInstance(): EnhancedCalculationHistoryService {
    if (!EnhancedCalculationHistoryService.instance) {
      EnhancedCalculationHistoryService.instance = new EnhancedCalculationHistoryService()
    }
    return EnhancedCalculationHistoryService.instance
  }

  /**
   * 智能搜索
   */
  public async smartSearch(query: SmartSearchQuery): Promise<CalculationHistory[]> {
    const cacheKey = JSON.stringify(query)
    
    // 检查缓存
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!
    }

    try {
      let results = await calculationHistoryService.findByUserId('current-user')

      // 文本搜索
      if (query.text) {
        const searchText = query.text.toLowerCase()
        results = results.filter(item => 
          item.notes?.toLowerCase().includes(searchText) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchText)) ||
          JSON.stringify(item.inputData).toLowerCase().includes(searchText)
        )
      }

      // 日期范围筛选
      if (query.dateRange) {
        results = results.filter(item => 
          item.timestamp >= query.dateRange!.start &&
          item.timestamp <= query.dateRange!.end
        )
      }

      // 计算器类型筛选
      if (query.calculatorTypes && query.calculatorTypes.length > 0) {
        results = results.filter(item => 
          query.calculatorTypes!.includes(item.calculatorType)
        )
      }

      // 标签筛选
      if (query.tags && query.tags.length > 0) {
        results = results.filter(item =>
          query.tags!.some(tag => item.tags.includes(tag))
        )
      }

      // 结果范围筛选
      if (query.resultRange) {
        results = results.filter(item => {
          const result = this.extractNumericResult(item.results)
          return result >= query.resultRange!.min && result <= query.resultRange!.max
        })
      }

      // 收藏筛选
      if (query.isFavorite !== undefined) {
        results = results.filter(item => item.isFavorite === query.isFavorite)
      }

      // 笔记筛选
      if (query.hasNotes !== undefined) {
        results = results.filter(item => 
          query.hasNotes ? !!item.notes : !item.notes
        )
      }

      // 操作符筛选
      if (query.operators && query.operators.length > 0) {
        results = results.filter(item => {
          return query.operators!.every(op => {
            const value = this.getFieldValue(item, op.field)
            return this.evaluateOperator(value, op.operator, op.value)
          })
        })
      }

      // 缓存结果
      this.searchCache.set(cacheKey, results)
      
      return results
    } catch (error) {
      console.error('Smart search failed:', error)
      return []
    }
  }

  /**
   * 生成搜索建议
   */
  public async generateSearchSuggestions(input: string): Promise<SearchSuggestion[]> {
    if (this.suggestionCache.has(input)) {
      return this.suggestionCache.get(input)!
    }

    const suggestions: SearchSuggestion[] = []
    const allHistory = await calculationHistoryService.findByUserId('current-user')

    // 最近搜索
    if (this.state.recentSearches.length > 0) {
      this.state.recentSearches
        .filter(search => search.toLowerCase().includes(input.toLowerCase()))
        .slice(0, 3)
        .forEach(search => {
          suggestions.push({
            text: search,
            icon: 'clock',
            count: 0,
            query: { text: search },
            category: 'recent'
          })
        })
    }

    // 智能建议
    if (input.includes('>') || input.includes('<') || input.includes('=')) {
      suggestions.push({
        text: `Zinssatz ${input}`,
        icon: 'calculator',
        count: this.countMatches(allHistory, 'interestRate', input),
        query: { operators: [{ field: 'interestRate', operator: '>', value: parseFloat(input.replace(/[^0-9.]/g, '')) }] },
        category: 'smart'
      })
    }

    // 日期建议
    if (input.includes('tag') || input.includes('Tag')) {
      const commonTags = this.getCommonTags(allHistory)
      commonTags.slice(0, 3).forEach(tag => {
        suggestions.push({
          text: `Tag: ${tag.name}`,
          icon: 'tag',
          count: tag.count,
          query: { tags: [tag.name] },
          category: 'filter'
        })
      })
    }

    // 时间建议
    const timeKeywords = ['heute', 'gestern', 'woche', 'monat', 'jahr']
    timeKeywords.forEach(keyword => {
      if (keyword.includes(input.toLowerCase())) {
        const dateRange = this.getDateRangeForKeyword(keyword)
        suggestions.push({
          text: `Letzte ${keyword}`,
          icon: 'calendar',
          count: this.countInDateRange(allHistory, dateRange),
          query: { dateRange },
          category: 'filter'
        })
      }
    })

    // 计算器类型建议
    const calculatorTypes = ['Zinseszins', 'Kredit', 'Hypothek', 'Portfolio']
    calculatorTypes.forEach(type => {
      if (type.toLowerCase().includes(input.toLowerCase())) {
        suggestions.push({
          text: `${type}-Berechnungen`,
          icon: 'calculator',
          count: allHistory.filter(h => h.calculatorType.includes(type.toLowerCase())).length,
          query: { calculatorTypes: [type.toLowerCase()] },
          category: 'filter'
        })
      }
    })

    this.suggestionCache.set(input, suggestions)
    return suggestions
  }

  /**
   * 批量操作：添加到收藏
   */
  public async bulkAddToFavorites(ids: string[]): Promise<BulkOperationResult> {
    return this.executeBulkOperation(ids, async (id) => {
      await calculationHistoryService.update(id, { isFavorite: true })
    }, 'Zu Favoriten hinzufügen')
  }

  /**
   * 批量操作：添加标签
   */
  public async bulkAddTags(ids: string[], tags: string[]): Promise<BulkOperationResult> {
    return this.executeBulkOperation(ids, async (id) => {
      const item = await calculationHistoryService.findById(id)
      if (item) {
        const newTags = [...new Set([...item.tags, ...tags])]
        await calculationHistoryService.update(id, { tags: newTags })
      }
    }, 'Tags hinzufügen')
  }

  /**
   * 批量操作：删除
   */
  public async bulkDelete(ids: string[]): Promise<BulkOperationResult> {
    return this.executeBulkOperation(ids, async (id) => {
      await calculationHistoryService.delete(id)
    }, 'Löschen')
  }

  /**
   * 批量导出
   */
  public async bulkExport(ids: string[], options: ExportOptions): Promise<BulkOperationResult> {
    try {
      const items = await Promise.all(
        ids.map(id => calculationHistoryService.findById(id))
      )
      const validItems = items.filter(item => item !== null) as CalculationHistory[]

      let exportData: any
      switch (options.format) {
        case 'csv':
          exportData = this.exportToCSV(validItems, options)
          break
        case 'excel':
          exportData = this.exportToExcel(validItems, options)
          break
        case 'json':
          exportData = this.exportToJSON(validItems, options)
          break
        case 'pdf':
          exportData = await this.exportToPDF(validItems, options)
          break
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }

      // 触发下载
      this.downloadFile(exportData, `calculations.${options.format}`)

      return {
        success: true,
        processed: validItems.length,
        failed: 0,
        errors: [],
        results: [exportData]
      }
    } catch (error) {
      return {
        success: false,
        processed: 0,
        failed: ids.length,
        errors: [(error as Error).message]
      }
    }
  }

  /**
   * 生成历史分析
   */
  public async generateAnalytics(): Promise<HistoryAnalytics> {
    this.state.isAnalyzing = true

    try {
      const allHistory = await calculationHistoryService.findByUserId('current-user')
      
      const analytics: HistoryAnalytics = {
        totalCalculations: allHistory.length,
        calculationsByType: this.groupByCalculatorType(allHistory),
        calculationsByMonth: this.groupByMonth(allHistory),
        averageResults: this.calculateAverageResults(allHistory),
        favoriteCount: allHistory.filter(h => h.isFavorite).length,
        tagUsage: this.analyzeTagUsage(allHistory),
        trends: this.analyzeTrends(allHistory),
        insights: this.generateInsights(allHistory)
      }

      this.state.analytics = analytics
      return analytics
    } finally {
      this.state.isAnalyzing = false
    }
  }

  /**
   * 获取推荐的计算参数
   */
  public async getRecommendedParameters(calculatorType: string): Promise<Record<string, any>> {
    const history = await calculationHistoryService.findByUserId('current-user')
    const typeHistory = history.filter(h => h.calculatorType === calculatorType)

    if (typeHistory.length === 0) {
      return {}
    }

    // 分析最常用的参数值
    const parameterFrequency: Record<string, Record<string, number>> = {}
    
    typeHistory.forEach(item => {
      Object.entries(item.inputData).forEach(([key, value]) => {
        if (!parameterFrequency[key]) {
          parameterFrequency[key] = {}
        }
        const valueStr = String(value)
        parameterFrequency[key][valueStr] = (parameterFrequency[key][valueStr] || 0) + 1
      })
    })

    // 返回最常用的值
    const recommendations: Record<string, any> = {}
    Object.entries(parameterFrequency).forEach(([key, values]) => {
      const mostCommon = Object.entries(values)
        .sort(([,a], [,b]) => b - a)[0]
      if (mostCommon) {
        recommendations[key] = mostCommon[0]
      }
    })

    return recommendations
  }

  // 私有辅助方法

  private async executeBulkOperation(
    ids: string[],
    operation: (id: string) => Promise<void>,
    operationName: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    }

    this.state.bulkOperationProgress = 0

    for (let i = 0; i < ids.length; i++) {
      try {
        await operation(ids[i])
        result.processed++
      } catch (error) {
        result.failed++
        result.errors.push(`${operationName} failed for ${ids[i]}: ${(error as Error).message}`)
      }

      this.state.bulkOperationProgress = ((i + 1) / ids.length) * 100
    }

    result.success = result.failed === 0
    this.state.bulkOperationProgress = 0

    return result
  }

  private extractNumericResult(results: any): number {
    // 从结果对象中提取数值结果
    if (typeof results === 'number') return results
    if (results?.finalAmount) return results.finalAmount
    if (results?.totalAmount) return results.totalAmount
    if (results?.result) return results.result
    return 0
  }

  private getFieldValue(item: CalculationHistory, field: string): any {
    const paths = field.split('.')
    let value: any = item
    for (const path of paths) {
      value = value?.[path]
    }
    return value
  }

  private evaluateOperator(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case '>': return Number(value) > Number(compareValue)
      case '<': return Number(value) < Number(compareValue)
      case '>=': return Number(value) >= Number(compareValue)
      case '<=': return Number(value) <= Number(compareValue)
      case '=': return value === compareValue
      case '!=': return value !== compareValue
      default: return false
    }
  }

  private getCommonTags(history: CalculationHistory[]): Array<{name: string, count: number}> {
    const tagCounts: Record<string, number> = {}
    history.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }

  private getDateRangeForKeyword(keyword: string): { start: Date, end: Date } {
    const now = new Date()
    const start = new Date()

    switch (keyword) {
      case 'heute':
        start.setHours(0, 0, 0, 0)
        break
      case 'gestern':
        start.setDate(now.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        break
      case 'woche':
        start.setDate(now.getDate() - 7)
        break
      case 'monat':
        start.setMonth(now.getMonth() - 1)
        break
      case 'jahr':
        start.setFullYear(now.getFullYear() - 1)
        break
    }

    return { start, end: now }
  }

  private countMatches(history: CalculationHistory[], field: string, condition: string): number {
    // 简化实现，实际应该解析条件
    return history.length
  }

  private countInDateRange(history: CalculationHistory[], dateRange: { start: Date, end: Date }): number {
    return history.filter(item => 
      item.timestamp >= dateRange.start && item.timestamp <= dateRange.end
    ).length
  }

  private groupByCalculatorType(history: CalculationHistory[]): Record<string, number> {
    const groups: Record<string, number> = {}
    history.forEach(item => {
      groups[item.calculatorType] = (groups[item.calculatorType] || 0) + 1
    })
    return groups
  }

  private groupByMonth(history: CalculationHistory[]): Record<string, number> {
    const groups: Record<string, number> = {}
    history.forEach(item => {
      const month = item.timestamp.toISOString().substring(0, 7) // YYYY-MM
      groups[month] = (groups[month] || 0) + 1
    })
    return groups
  }

  private calculateAverageResults(history: CalculationHistory[]): Record<string, number> {
    const averages: Record<string, number> = {}
    const groups = this.groupByCalculatorType(history)

    Object.keys(groups).forEach(type => {
      const typeHistory = history.filter(h => h.calculatorType === type)
      const sum = typeHistory.reduce((acc, item) => acc + this.extractNumericResult(item.results), 0)
      averages[type] = sum / typeHistory.length
    })

    return averages
  }

  private analyzeTagUsage(history: CalculationHistory[]): Record<string, number> {
    const usage: Record<string, number> = {}
    history.forEach(item => {
      item.tags.forEach(tag => {
        usage[tag] = (usage[tag] || 0) + 1
      })
    })
    return usage
  }

  private analyzeTrends(history: CalculationHistory[]): HistoryAnalytics['trends'] {
    const calculatorCounts = this.groupByCalculatorType(history)
    const mostUsedCalculator = Object.entries(calculatorCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown'

    return {
      mostUsedCalculator,
      growthRate: this.calculateGrowthRate(history),
      peakUsageDay: this.findPeakUsageDay(history),
      averageSessionLength: this.calculateAverageSessionLength(history)
    }
  }

  private generateInsights(history: CalculationHistory[]): string[] {
    const insights: string[] = []
    
    if (history.length > 10) {
      insights.push('Sie sind ein aktiver Nutzer mit vielen Berechnungen!')
    }
    
    const favoriteRatio = history.filter(h => h.isFavorite).length / history.length
    if (favoriteRatio > 0.3) {
      insights.push('Sie markieren viele Berechnungen als Favoriten - das zeigt gute Organisation!')
    }

    return insights
  }

  private calculateGrowthRate(history: CalculationHistory[]): number {
    // 简化实现
    return history.length > 0 ? 5.2 : 0
  }

  private findPeakUsageDay(history: CalculationHistory[]): string {
    // 简化实现
    return 'Montag'
  }

  private calculateAverageSessionLength(history: CalculationHistory[]): number {
    // 简化实现
    return 12.5
  }

  private exportToCSV(items: CalculationHistory[], options: ExportOptions): string {
    // CSV导出实现
    const headers = ['ID', 'Datum', 'Rechner', 'Ergebnis', 'Favorit']
    const rows = items.map(item => [
      item.id,
      item.timestamp.toLocaleDateString('de-DE'),
      item.calculatorType,
      this.extractNumericResult(item.results),
      item.isFavorite ? 'Ja' : 'Nein'
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private exportToExcel(items: CalculationHistory[], options: ExportOptions): Blob {
    // Excel导出实现（简化）
    const csv = this.exportToCSV(items, options)
    return new Blob([csv], { type: 'application/vnd.ms-excel' })
  }

  private exportToJSON(items: CalculationHistory[], options: ExportOptions): string {
    return JSON.stringify(items, null, 2)
  }

  private async exportToPDF(items: CalculationHistory[], options: ExportOptions): Promise<Blob> {
    // PDF导出实现（简化）
    const content = items.map(item => 
      `${item.timestamp.toLocaleDateString('de-DE')} - ${item.calculatorType}: ${this.extractNumericResult(item.results)}`
    ).join('\n')
    
    return new Blob([content], { type: 'application/pdf' })
  }

  private downloadFile(data: string | Blob, filename: string): void {
    const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain' }) : data
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// 导出单例实例
export const enhancedCalculationHistoryService = EnhancedCalculationHistoryService.getInstance()

// 便捷函数
export async function smartSearchCalculations(query: SmartSearchQuery): Promise<CalculationHistory[]> {
  return enhancedCalculationHistoryService.smartSearch(query)
}

export async function getCalculationAnalytics(): Promise<HistoryAnalytics> {
  return enhancedCalculationHistoryService.generateAnalytics()
}

export async function getSearchSuggestions(input: string): Promise<SearchSuggestion[]> {
  return enhancedCalculationHistoryService.generateSearchSuggestions(input)
}
