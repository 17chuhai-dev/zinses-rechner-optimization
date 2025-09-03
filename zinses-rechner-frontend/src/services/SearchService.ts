/**
 * 高级搜索和过滤引擎
 * 支持全文搜索、多维度过滤、智能建议和搜索历史，提供强大的计算历史和收藏内容发现能力
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { CalculationHistoryService } from './CalculationHistoryService'
import { FavoritesService } from './FavoritesService'
import { EnterpriseLocalStorageService } from './EnterpriseLocalStorageService'

// 搜索选项
export interface SearchOptions {
  fuzzySearch?: boolean
  includeArchived?: boolean
  boostRecent?: boolean
  boostFavorites?: boolean
  maxResults?: number
  timeout?: number
}

// 搜索条件
export interface SearchCriteria {
  query?: string
  filters: FilterCriteria[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  dateRange?: DateRange
  amountRange?: NumberRange
}

// 过滤条件
export interface FilterCriteria {
  field: string
  operator: FilterOperator
  value: any
  values?: any[]
  caseSensitive?: boolean
}

export type FilterOperator = 
  | 'equals' | 'not_equals' 
  | 'contains' | 'not_contains' 
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than' | 'between'
  | 'in' | 'not_in'
  | 'is_null' | 'is_not_null'
  | 'regex'

// 日期范围
export interface DateRange {
  start: Date
  end: Date
}

// 数值范围
export interface NumberRange {
  min: number
  max: number
}

// 过滤器定义
export interface FilterDefinition {
  id: string
  name: string
  field: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect'
  operators: FilterOperator[]
  options?: FilterOption[]
  defaultValue?: any
}

export interface FilterOption {
  value: any
  label: string
  count?: number
}

// 保存的过滤器
export interface SavedFilter {
  id: string
  userId: string
  name: string
  description?: string
  criteria: FilterCriteria[]
  isPublic: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

// 搜索建议
export interface SearchSuggestion {
  text: string
  type: 'query' | 'filter' | 'tag' | 'calculator_type'
  count?: number
  boost?: number
}

// 热门搜索
export interface PopularSearch {
  query: string
  count: number
  trend: 'up' | 'down' | 'stable'
  lastSearched: Date
}

// 搜索历史项
export interface SearchHistoryItem {
  id: string
  userId: string
  query: string
  filters?: FilterCriteria[]
  resultCount: number
  searchTime: number
  timestamp: Date
}

// 高级查询
export interface AdvancedQuery {
  select: string[]
  from: string
  where: QueryCondition[]
  orderBy?: QuerySort[]
  limit?: number
  offset?: number
}

export interface QueryCondition {
  field: string
  operator: FilterOperator
  value: any
  logic?: 'AND' | 'OR'
}

export interface QuerySort {
  field: string
  direction: 'ASC' | 'DESC'
}

// 查询结果
export interface QueryResult {
  data: any[]
  totalCount: number
  executionTime: number
  queryPlan?: string
}

// 计算搜索结果
export interface CalculationSearchResult {
  calculations: any[]
  totalCount: number
  searchTime: number
  facets: SearchFacet[]
  suggestions: SearchSuggestion[]
}

// 收藏搜索结果
export interface FavoriteSearchResult {
  favorites: any[]
  totalCount: number
  searchTime: number
  facets: SearchFacet[]
  suggestions: SearchSuggestion[]
}

// 搜索分面
export interface SearchFacet {
  field: string
  name: string
  values: FacetValue[]
}

export interface FacetValue {
  value: string
  count: number
  selected?: boolean
}

// 搜索分析
export interface SearchAnalytics {
  period: DateRange
  totalSearches: number
  uniqueQueries: number
  averageResultCount: number
  averageSearchTime: number
  
  // 热门查询
  topQueries: Array<{
    query: string
    count: number
    percentage: number
  }>
  
  // 搜索趋势
  searchTrends: Array<{
    date: string
    searches: number
    uniqueUsers: number
  }>
  
  // 性能指标
  performanceMetrics: {
    fastSearches: number // <100ms
    slowSearches: number // >1000ms
    failedSearches: number
    cacheHitRate: number
  }
}

// 搜索性能
export interface SearchPerformance {
  queryId: string
  executionTime: number
  resultCount: number
  cacheHit: boolean
  indexUsed: boolean
  optimizationSuggestions: string[]
}

/**
 * 高级搜索和过滤引擎
 */
export class SearchService {
  private static instance: SearchService
  private historyService: CalculationHistoryService
  private favoritesService: FavoritesService
  private storageService: EnterpriseLocalStorageService
  
  private searchHistory: Map<string, SearchHistoryItem[]> = new Map()
  private savedFilters: Map<string, SavedFilter[]> = new Map()
  private searchIndex: Map<string, Set<string>> = new Map()
  private popularSearches: Map<string, PopularSearch[]> = new Map()
  private searchCache: Map<string, { result: any; timestamp: number }> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.historyService = CalculationHistoryService.getInstance()
    this.favoritesService = FavoritesService.getInstance()
    this.storageService = EnterpriseLocalStorageService.getInstance()
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService()
    }
    return SearchService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.historyService.initialize()
      await this.favoritesService.initialize()
      await this.storageService.initialize()
      await this.loadSearchHistory()
      await this.loadSavedFilters()
      await this.loadPopularSearches()
      await this.buildSearchIndex()
      this.startPeriodicTasks()
      this.isInitialized = true
      console.log('✅ SearchService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize SearchService:', error)
      throw error
    }
  }

  /**
   * 全文搜索
   */
  async fullTextSearch(userId: string, query: string, options?: SearchOptions): Promise<any> {
    if (!this.isInitialized) await this.initialize()

    const startTime = performance.now()
    const cacheKey = `${userId}_${query}_${JSON.stringify(options)}`
    
    // 检查缓存
    const cached = this.searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5分钟缓存
      return cached.result
    }

    try {
      // 执行搜索
      const calculationResults = await this.searchCalculations(userId, {
        query,
        filters: []
      })

      const favoriteResults = await this.searchFavorites(userId, {
        query,
        filters: []
      })

      const result = {
        calculations: calculationResults.calculations,
        favorites: favoriteResults.favorites,
        totalResults: calculationResults.totalCount + favoriteResults.totalCount,
        searchTime: performance.now() - startTime,
        suggestions: await this.getSearchSuggestions(userId, query)
      }

      // 缓存结果
      this.searchCache.set(cacheKey, { result, timestamp: Date.now() })

      // 保存搜索历史
      await this.saveSearchHistory(userId, {
        query,
        resultCount: result.totalResults,
        searchTime: result.searchTime
      })

      return result

    } catch (error) {
      console.error('Full text search failed:', error)
      throw error
    }
  }

  /**
   * 搜索计算记录
   */
  async searchCalculations(userId: string, searchCriteria: SearchCriteria): Promise<CalculationSearchResult> {
    if (!this.isInitialized) await this.initialize()

    const startTime = performance.now()

    // 使用CalculationHistoryService的搜索功能
    const searchQuery = {
      query: searchCriteria.query || '',
      filters: this.convertToHistoryFilters(searchCriteria.filters)
    }

    const result = await this.historyService.searchCalculations(userId, searchQuery)

    return {
      calculations: result.results,
      totalCount: result.totalCount,
      searchTime: performance.now() - startTime,
      facets: result.facets || [],
      suggestions: result.suggestions || []
    }
  }

  /**
   * 搜索收藏
   */
  async searchFavorites(userId: string, searchCriteria: SearchCriteria): Promise<FavoriteSearchResult> {
    if (!this.isInitialized) await this.initialize()

    const startTime = performance.now()

    // 使用FavoritesService的搜索功能
    const searchQuery = {
      query: searchCriteria.query || '',
      filters: this.convertToFavoriteFilters(searchCriteria.filters)
    }

    const result = await this.favoritesService.searchFavorites(userId, searchQuery)

    return {
      favorites: result.results,
      totalCount: result.totalCount,
      searchTime: performance.now() - startTime,
      facets: [],
      suggestions: result.suggestions || []
    }
  }

  /**
   * 应用过滤器
   */
  async applyFilters(data: any[], filters: FilterCriteria[]): Promise<any[]> {
    if (!this.isInitialized) await this.initialize()

    let filtered = [...data]

    for (const filter of filters) {
      filtered = filtered.filter(item => this.evaluateFilter(item, filter))
    }

    return filtered
  }

  /**
   * 创建过滤器
   */
  async createFilter(userId: string, filter: FilterDefinition): Promise<string> {
    if (!this.isInitialized) await this.initialize()

    // 这里可以创建自定义过滤器定义
    const filterId = crypto.randomUUID()
    
    console.log(`🔍 Filter created: ${filter.name} for user ${userId}`)
    return filterId
  }

  /**
   * 保存搜索过滤器
   */
  async saveSearchFilter(userId: string, filterName: string, criteria: FilterCriteria[]): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const userFilters = this.savedFilters.get(userId) || []

    const savedFilter: SavedFilter = {
      id: crypto.randomUUID(),
      userId,
      name: filterName,
      criteria,
      isPublic: false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    userFilters.push(savedFilter)
    this.savedFilters.set(userId, userFilters)

    // 保存到本地存储
    await this.storageService.storeData(
      `saved_filters_${userId}`,
      userFilters,
      { encrypt: true, compress: true, namespace: 'search' }
    )

    console.log(`💾 Search filter saved: ${filterName} for user ${userId}`)
  }

  /**
   * 获取保存的过滤器
   */
  async getSavedFilters(userId: string): Promise<SavedFilter[]> {
    if (!this.isInitialized) await this.initialize()

    return this.savedFilters.get(userId) || []
  }

  /**
   * 获取搜索建议
   */
  async getSearchSuggestions(userId: string, partialQuery: string): Promise<SearchSuggestion[]> {
    if (!this.isInitialized) await this.initialize()

    const suggestions: SearchSuggestion[] = []
    const queryLower = partialQuery.toLowerCase()

    // 从搜索索引获取建议
    for (const term of this.searchIndex.keys()) {
      if (term.startsWith(queryLower) && term !== queryLower) {
        suggestions.push({
          text: term,
          type: 'query',
          count: this.searchIndex.get(term)?.size || 0
        })
      }
    }

    // 从搜索历史获取建议
    const userHistory = this.searchHistory.get(userId) || []
    for (const historyItem of userHistory.slice(0, 10)) {
      if (historyItem.query.toLowerCase().includes(queryLower)) {
        suggestions.push({
          text: historyItem.query,
          type: 'query',
          count: historyItem.resultCount
        })
      }
    }

    // 去重并排序
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10)

    return uniqueSuggestions
  }

  /**
   * 保存搜索历史
   */
  async saveSearchHistory(userId: string, searchQuery: { query: string; resultCount: number; searchTime: number }): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const userHistory = this.searchHistory.get(userId) || []

    const historyItem: SearchHistoryItem = {
      id: crypto.randomUUID(),
      userId,
      query: searchQuery.query,
      resultCount: searchQuery.resultCount,
      searchTime: searchQuery.searchTime,
      timestamp: new Date()
    }

    userHistory.unshift(historyItem)

    // 限制历史记录数量
    if (userHistory.length > 100) {
      userHistory.splice(100)
    }

    this.searchHistory.set(userId, userHistory)

    // 保存到本地存储
    await this.storageService.storeData(
      `search_history_${userId}`,
      userHistory,
      { encrypt: true, compress: true, namespace: 'search' }
    )

    // 更新热门搜索
    await this.updatePopularSearches(userId, searchQuery.query)
  }

  /**
   * 获取搜索历史
   */
  async getSearchHistory(userId: string, limit: number = 50): Promise<SearchHistoryItem[]> {
    if (!this.isInitialized) await this.initialize()

    const userHistory = this.searchHistory.get(userId) || []
    return userHistory.slice(0, limit)
  }

  /**
   * 清除搜索历史
   */
  async clearSearchHistory(userId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    this.searchHistory.set(userId, [])

    // 从本地存储删除
    await this.storageService.deleteData(`search_history_${userId}`, { reason: 'user_request' })

    console.log(`🗑️ Search history cleared for user ${userId}`)
  }

  // 私有方法
  private convertToHistoryFilters(filters: FilterCriteria[]): any {
    // 转换过滤条件为CalculationHistoryService格式
    const historyFilters: any = {}

    for (const filter of filters) {
      switch (filter.field) {
        case 'calculatorType':
          historyFilters.calculatorTypes = Array.isArray(filter.value) ? filter.value : [filter.value]
          break
        case 'dateRange':
          historyFilters.dateRange = filter.value
          break
        case 'amount':
          if (filter.operator === 'greater_than') {
            historyFilters.minAmount = filter.value
          } else if (filter.operator === 'less_than') {
            historyFilters.maxAmount = filter.value
          }
          break
        case 'isFavorite':
          historyFilters.isFavorite = filter.value
          break
      }
    }

    return historyFilters
  }

  private convertToFavoriteFilters(filters: FilterCriteria[]): any {
    // 转换过滤条件为FavoritesService格式
    const favoriteFilters: any = {}

    for (const filter of filters) {
      switch (filter.field) {
        case 'tags':
          favoriteFilters.tags = Array.isArray(filter.value) ? filter.value : [filter.value]
          break
        case 'collectionId':
          favoriteFilters.collectionId = filter.value
          break
        case 'importance':
          favoriteFilters.importance = Array.isArray(filter.value) ? filter.value : [filter.value]
          break
        case 'dateRange':
          favoriteFilters.dateRange = filter.value
          break
      }
    }

    return favoriteFilters
  }

  private evaluateFilter(item: any, filter: FilterCriteria): boolean {
    const fieldValue = this.getFieldValue(item, filter.field)

    switch (filter.operator) {
      case 'equals':
        return fieldValue === filter.value
      case 'not_equals':
        return fieldValue !== filter.value
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase())
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase())
      case 'greater_than':
        return Number(fieldValue) > Number(filter.value)
      case 'less_than':
        return Number(fieldValue) < Number(filter.value)
      case 'between':
        const [min, max] = filter.values || []
        return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max)
      case 'in':
        return filter.values?.includes(fieldValue)
      case 'not_in':
        return !filter.values?.includes(fieldValue)
      case 'is_null':
        return fieldValue == null
      case 'is_not_null':
        return fieldValue != null
      default:
        return true
    }
  }

  private getFieldValue(item: any, fieldPath: string): any {
    const fields = fieldPath.split('.')
    let value = item

    for (const field of fields) {
      if (value && typeof value === 'object') {
        value = value[field]
      } else {
        return undefined
      }
    }

    return value
  }

  private async loadSearchHistory(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('search_history_')) {
          const userId = key.replace('search_history_', '')
          const history = await this.storageService.retrieveData(key)
          if (history && Array.isArray(history)) {
            this.searchHistory.set(userId, history)
          }
        }
      }
      console.log(`🔍 Loaded search history for ${this.searchHistory.size} users`)
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }

  private async loadSavedFilters(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('saved_filters_')) {
          const userId = key.replace('saved_filters_', '')
          const filters = await this.storageService.retrieveData(key)
          if (filters && Array.isArray(filters)) {
            this.savedFilters.set(userId, filters)
          }
        }
      }
      console.log(`💾 Loaded saved filters for ${this.savedFilters.size} users`)
    } catch (error) {
      console.error('Failed to load saved filters:', error)
    }
  }

  private async loadPopularSearches(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('popular_searches_')) {
          const userId = key.replace('popular_searches_', '')
          const searches = await this.storageService.retrieveData(key)
          if (searches && Array.isArray(searches)) {
            this.popularSearches.set(userId, searches)
          }
        }
      }
      console.log(`📈 Loaded popular searches for ${this.popularSearches.size} users`)
    } catch (error) {
      console.error('Failed to load popular searches:', error)
    }
  }

  private async buildSearchIndex(): Promise<void> {
    try {
      // 从历史记录和收藏构建搜索索引
      for (const userHistory of this.searchHistory.values()) {
        for (const historyItem of userHistory) {
          const words = historyItem.query.toLowerCase().split(/\s+/)
          for (const word of words) {
            if (word.length > 2) {
              if (!this.searchIndex.has(word)) {
                this.searchIndex.set(word, new Set())
              }
              this.searchIndex.get(word)!.add(historyItem.id)
            }
          }
        }
      }
      console.log(`🔍 Built search index with ${this.searchIndex.size} terms`)
    } catch (error) {
      console.error('Failed to build search index:', error)
    }
  }

  private async updatePopularSearches(userId: string, query: string): Promise<void> {
    const userPopular = this.popularSearches.get(userId) || []
    
    let popularSearch = userPopular.find(p => p.query === query)
    if (popularSearch) {
      popularSearch.count++
      popularSearch.lastSearched = new Date()
    } else {
      popularSearch = {
        query,
        count: 1,
        trend: 'stable',
        lastSearched: new Date()
      }
      userPopular.push(popularSearch)
    }

    // 保持最多50个热门搜索
    userPopular.sort((a, b) => b.count - a.count)
    if (userPopular.length > 50) {
      userPopular.splice(50)
    }

    this.popularSearches.set(userId, userPopular)

    // 保存到本地存储
    await this.storageService.storeData(
      `popular_searches_${userId}`,
      userPopular,
      { encrypt: true, compress: true, namespace: 'search' }
    )
  }

  private startPeriodicTasks(): void {
    // 每小时清理搜索缓存
    setInterval(() => {
      this.cleanupSearchCache()
    }, 60 * 60 * 1000)

    // 每天更新搜索索引
    setInterval(() => {
      this.rebuildSearchIndex()
    }, 24 * 60 * 60 * 1000)
  }

  private cleanupSearchCache(): void {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5分钟

    for (const [key, cached] of this.searchCache.entries()) {
      if (now - cached.timestamp > maxAge) {
        this.searchCache.delete(key)
      }
    }
  }

  private async rebuildSearchIndex(): Promise<void> {
    this.searchIndex.clear()
    await this.buildSearchIndex()
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance()
