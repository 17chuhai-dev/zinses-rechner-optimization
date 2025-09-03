/**
 * 收藏和标签管理系统
 * 支持计算结果的收藏、标签管理、分类组织和快速访问，提供个性化的收藏夹管理功能
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { AnonymousUserService } from './AnonymousUserService'
import { OptionalRegistrationService } from './OptionalRegistrationService'
import { EnterpriseLocalStorageService } from './EnterpriseLocalStorageService'
import { CalculationHistoryService } from './CalculationHistoryService'

// 收藏项
export interface FavoriteItem {
  id: string
  userId: string
  calculationId: string
  
  // 收藏信息
  title: string
  description?: string
  
  // 分类和标签
  tags: string[]
  collectionId?: string
  
  // 元数据
  metadata: FavoriteMetadata
  
  // 时间信息
  createdAt: Date
  updatedAt: Date
  lastAccessedAt?: Date
  
  // 统计信息
  accessCount: number
  
  // 状态
  isPublic: boolean
  isArchived: boolean
}

// 收藏元数据
export interface FavoriteMetadata {
  calculatorType: string
  originalAmount?: number
  originalResult?: number
  
  // 用户注释
  userNotes?: string
  importance: 'low' | 'medium' | 'high'
  
  // 上下文信息
  context?: {
    purpose: string
    scenario: string
    assumptions: string[]
  }
  
  // 提醒设置
  reminder?: {
    enabled: boolean
    date: Date
    message: string
  }
}

// 标签
export interface Tag {
  id: string
  userId: string
  name: string
  color: string
  description?: string
  
  // 使用统计
  usageCount: number
  lastUsed?: Date
  
  // 分类
  category?: string
  
  // 时间信息
  createdAt: Date
  updatedAt: Date
}

// 标签数据
export interface TagData {
  name: string
  color: string
  description?: string
  category?: string
}

// 收藏集合
export interface Collection {
  id: string
  userId: string
  name: string
  description?: string
  
  // 外观设置
  color: string
  icon?: string
  
  // 收藏项
  favoriteIds: string[]
  
  // 设置
  isPublic: boolean
  sortBy: 'date' | 'title' | 'amount' | 'custom'
  sortOrder: 'asc' | 'desc'
  
  // 时间信息
  createdAt: Date
  updatedAt: Date
}

// 收藏集合数据
export interface CollectionData {
  name: string
  description?: string
  color: string
  icon?: string
  isPublic?: boolean
  sortBy?: 'date' | 'title' | 'amount' | 'custom'
  sortOrder?: 'asc' | 'desc'
}

// 收藏过滤器
export interface FavoriteFilters {
  tags?: string[]
  collectionId?: string
  calculatorTypes?: string[]
  importance?: ('low' | 'medium' | 'high')[]
  dateRange?: {
    start: Date
    end: Date
  }
  isArchived?: boolean
  searchQuery?: string
  sortBy?: 'date' | 'title' | 'amount' | 'access_count'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 搜索查询
export interface SearchQuery {
  query: string
  filters?: FavoriteFilters
  includeArchived?: boolean
  fuzzySearch?: boolean
}

// 搜索结果
export interface SearchResult {
  results: FavoriteItem[]
  totalCount: number
  searchTime: number
  suggestions?: string[]
}

/**
 * 收藏和标签管理系统
 */
export class FavoritesService {
  private static instance: FavoritesService
  private anonymousUserService: AnonymousUserService
  private registrationService: OptionalRegistrationService
  private storageService: EnterpriseLocalStorageService
  private historyService: CalculationHistoryService
  
  private favorites: Map<string, FavoriteItem[]> = new Map()
  private tags: Map<string, Tag[]> = new Map()
  private collections: Map<string, Collection[]> = new Map()
  private searchIndex: Map<string, Set<string>> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.anonymousUserService = AnonymousUserService.getInstance()
    this.registrationService = OptionalRegistrationService.getInstance()
    this.storageService = EnterpriseLocalStorageService.getInstance()
    this.historyService = CalculationHistoryService.getInstance()
  }

  static getInstance(): FavoritesService {
    if (!FavoritesService.instance) {
      FavoritesService.instance = new FavoritesService()
    }
    return FavoritesService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.anonymousUserService.initialize()
      await this.registrationService.initialize()
      await this.storageService.initialize()
      await this.historyService.initialize()
      await this.loadFavorites()
      await this.loadTags()
      await this.loadCollections()
      await this.buildSearchIndex()
      this.startPeriodicTasks()
      this.isInitialized = true
      console.log('✅ FavoritesService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize FavoritesService:', error)
      throw error
    }
  }

  /**
   * 添加到收藏
   */
  async addToFavorites(
    userId: string,
    calculationId: string,
    metadata?: Partial<FavoriteMetadata>
  ): Promise<string> {
    if (!this.isInitialized) await this.initialize()

    // 检查计算记录是否存在
    const calculation = await this.historyService.getCalculationById(calculationId)
    if (!calculation) {
      throw new Error('Calculation not found')
    }

    // 检查是否已经收藏
    const userFavorites = this.favorites.get(userId) || []
    const existingFavorite = userFavorites.find(fav => fav.calculationId === calculationId)
    if (existingFavorite) {
      throw new Error('Calculation already in favorites')
    }

    const favoriteItem: FavoriteItem = {
      id: crypto.randomUUID(),
      userId,
      calculationId,
      title: this.generateFavoriteTitle(calculation),
      tags: [],
      metadata: {
        calculatorType: calculation.calculatorType,
        originalAmount: calculation.inputData.principal as number,
        originalResult: calculation.outputData.finalAmount as number,
        importance: 'medium',
        ...metadata
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
      isPublic: false,
      isArchived: false
    }

    userFavorites.push(favoriteItem)
    this.favorites.set(userId, userFavorites)

    // 保存到本地存储
    await this.storageService.storeData(
      `favorites_${userId}`,
      userFavorites,
      { encrypt: true, compress: true, namespace: 'favorites' }
    )

    // 更新搜索索引
    await this.updateSearchIndex(favoriteItem)

    console.log(`⭐ Added to favorites: ${favoriteItem.id} for user ${userId}`)
    return favoriteItem.id
  }

  /**
   * 从收藏中移除
   */
  async removeFromFavorites(userId: string, favoriteId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const userFavorites = this.favorites.get(userId) || []
    const favoriteIndex = userFavorites.findIndex(fav => fav.id === favoriteId)
    
    if (favoriteIndex === -1) {
      throw new Error('Favorite not found')
    }

    userFavorites.splice(favoriteIndex, 1)
    this.favorites.set(userId, userFavorites)

    // 保存到本地存储
    await this.storageService.storeData(
      `favorites_${userId}`,
      userFavorites,
      { encrypt: true, compress: true, namespace: 'favorites' }
    )

    // 从搜索索引中移除
    await this.removeFromSearchIndex(favoriteId)

    console.log(`🗑️ Removed from favorites: ${favoriteId}`)
  }

  /**
   * 获取收藏列表
   */
  async getFavorites(userId: string, filters?: FavoriteFilters): Promise<FavoriteItem[]> {
    if (!this.isInitialized) await this.initialize()

    let favorites = this.favorites.get(userId) || []

    // 应用过滤器
    if (filters) {
      favorites = await this.applyFavoriteFilters(favorites, filters)
    }

    return favorites
  }

  /**
   * 更新收藏
   */
  async updateFavorite(favoriteId: string, updates: Partial<FavoriteItem>): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    for (const [userId, userFavorites] of this.favorites.entries()) {
      const favoriteIndex = userFavorites.findIndex(fav => fav.id === favoriteId)
      if (favoriteIndex !== -1) {
        const updatedFavorite = {
          ...userFavorites[favoriteIndex],
          ...updates,
          updatedAt: new Date()
        }
        
        userFavorites[favoriteIndex] = updatedFavorite

        // 保存到本地存储
        await this.storageService.storeData(
          `favorites_${userId}`,
          userFavorites,
          { encrypt: true, compress: true, namespace: 'favorites' }
        )

        // 更新搜索索引
        await this.updateSearchIndex(updatedFavorite)

        console.log(`🔄 Favorite updated: ${favoriteId}`)
        return
      }
    }

    throw new Error('Favorite not found')
  }

  /**
   * 创建标签
   */
  async createTag(userId: string, tagData: TagData): Promise<string> {
    if (!this.isInitialized) await this.initialize()

    const userTags = this.tags.get(userId) || []
    
    // 检查标签名是否已存在
    const existingTag = userTags.find(tag => tag.name.toLowerCase() === tagData.name.toLowerCase())
    if (existingTag) {
      throw new Error('Tag name already exists')
    }

    const tag: Tag = {
      id: crypto.randomUUID(),
      userId,
      name: tagData.name,
      color: tagData.color,
      description: tagData.description,
      category: tagData.category,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    userTags.push(tag)
    this.tags.set(userId, userTags)

    // 保存到本地存储
    await this.storageService.storeData(
      `tags_${userId}`,
      userTags,
      { encrypt: true, compress: true, namespace: 'favorites' }
    )

    console.log(`🏷️ Tag created: ${tag.name} for user ${userId}`)
    return tag.id
  }

  /**
   * 获取用户标签
   */
  async getUserTags(userId: string): Promise<Tag[]> {
    if (!this.isInitialized) await this.initialize()

    return this.tags.get(userId) || []
  }

  /**
   * 为收藏添加标签
   */
  async addTagToFavorite(favoriteId: string, tagId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    for (const [userId, userFavorites] of this.favorites.entries()) {
      const favorite = userFavorites.find(fav => fav.id === favoriteId)
      if (favorite) {
        if (!favorite.tags.includes(tagId)) {
          favorite.tags.push(tagId)
          favorite.updatedAt = new Date()

          // 更新标签使用统计
          await this.updateTagUsage(tagId)

          // 保存到本地存储
          await this.storageService.storeData(
            `favorites_${userId}`,
            userFavorites,
            { encrypt: true, compress: true, namespace: 'favorites' }
          )

          console.log(`🏷️ Tag added to favorite: ${tagId} -> ${favoriteId}`)
        }
        return
      }
    }

    throw new Error('Favorite not found')
  }

  /**
   * 创建收藏集合
   */
  async createCollection(userId: string, collectionData: CollectionData): Promise<string> {
    if (!this.isInitialized) await this.initialize()

    const userCollections = this.collections.get(userId) || []

    const collection: Collection = {
      id: crypto.randomUUID(),
      userId,
      name: collectionData.name,
      description: collectionData.description,
      color: collectionData.color,
      icon: collectionData.icon,
      favoriteIds: [],
      isPublic: collectionData.isPublic || false,
      sortBy: collectionData.sortBy || 'date',
      sortOrder: collectionData.sortOrder || 'desc',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    userCollections.push(collection)
    this.collections.set(userId, userCollections)

    // 保存到本地存储
    await this.storageService.storeData(
      `collections_${userId}`,
      userCollections,
      { encrypt: true, compress: true, namespace: 'favorites' }
    )

    console.log(`📁 Collection created: ${collection.name} for user ${userId}`)
    return collection.id
  }

  /**
   * 搜索收藏
   */
  async searchFavorites(userId: string, query: SearchQuery): Promise<SearchResult> {
    if (!this.isInitialized) await this.initialize()

    const startTime = performance.now()
    const userFavorites = this.favorites.get(userId) || []

    let results: FavoriteItem[] = []

    if (query.query.trim()) {
      // 执行文本搜索
      results = await this.performFavoriteTextSearch(userFavorites, query)
    } else {
      results = userFavorites
    }

    // 应用过滤器
    if (query.filters) {
      results = await this.applyFavoriteFilters(results, query.filters)
    }

    // 排序结果
    results = await this.sortFavoriteResults(results, query.filters?.sortBy, query.filters?.sortOrder)

    // 应用分页
    const totalCount = results.length
    if (query.filters?.limit) {
      const offset = query.filters.offset || 0
      results = results.slice(offset, offset + query.filters.limit)
    }

    const searchTime = performance.now() - startTime

    return {
      results,
      totalCount,
      searchTime,
      suggestions: await this.generateFavoriteSearchSuggestions(query.query, userId)
    }
  }

  // 私有方法
  private generateFavoriteTitle(calculation: any): string {
    const type = calculation.calculatorType.replace('_', ' ').replace('-', ' ')
    const amount = calculation.outputData.finalAmount || calculation.inputData.principal
    
    if (amount) {
      return `${type} - €${amount.toLocaleString('de-DE')}`
    } else {
      return `${type} - ${new Date(calculation.createdAt).toLocaleDateString('de-DE')}`
    }
  }

  private async loadFavorites(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('favorites_')) {
          const userId = key.replace('favorites_', '')
          const favorites = await this.storageService.retrieveData(key)
          if (favorites && Array.isArray(favorites)) {
            this.favorites.set(userId, favorites)
          }
        }
      }
      console.log(`⭐ Loaded favorites for ${this.favorites.size} users`)
    } catch (error) {
      console.error('Failed to load favorites:', error)
    }
  }

  private async loadTags(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('tags_')) {
          const userId = key.replace('tags_', '')
          const tags = await this.storageService.retrieveData(key)
          if (tags && Array.isArray(tags)) {
            this.tags.set(userId, tags)
          }
        }
      }
      console.log(`🏷️ Loaded tags for ${this.tags.size} users`)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  private async loadCollections(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('collections_')) {
          const userId = key.replace('collections_', '')
          const collections = await this.storageService.retrieveData(key)
          if (collections && Array.isArray(collections)) {
            this.collections.set(userId, collections)
          }
        }
      }
      console.log(`📁 Loaded collections for ${this.collections.size} users`)
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  private async buildSearchIndex(): Promise<void> {
    try {
      for (const userFavorites of this.favorites.values()) {
        for (const favorite of userFavorites) {
          await this.updateSearchIndex(favorite)
        }
      }
      console.log(`🔍 Built favorites search index for ${this.searchIndex.size} terms`)
    } catch (error) {
      console.error('Failed to build favorites search index:', error)
    }
  }

  private async updateSearchIndex(favorite: FavoriteItem): Promise<void> {
    const searchableText = [
      favorite.title,
      favorite.description || '',
      favorite.metadata.userNotes || '',
      favorite.metadata.calculatorType,
      ...favorite.tags
    ].join(' ').toLowerCase()

    const words = searchableText.split(/\s+/).filter(word => word.length > 2)

    for (const word of words) {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set())
      }
      this.searchIndex.get(word)!.add(favorite.id)
    }
  }

  private async removeFromSearchIndex(favoriteId: string): Promise<void> {
    for (const favoriteIds of this.searchIndex.values()) {
      favoriteIds.delete(favoriteId)
    }
  }

  private async performFavoriteTextSearch(favorites: FavoriteItem[], query: SearchQuery): Promise<FavoriteItem[]> {
    const searchTerms = query.query.toLowerCase().split(/\s+/)
    const matchingIds = new Set<string>()

    for (const term of searchTerms) {
      const ids = this.searchIndex.get(term)
      if (ids) {
        for (const id of ids) {
          matchingIds.add(id)
        }
      }
    }

    return favorites.filter(fav => matchingIds.has(fav.id))
  }

  private async applyFavoriteFilters(favorites: FavoriteItem[], filters: FavoriteFilters): Promise<FavoriteItem[]> {
    let filtered = [...favorites]

    if (filters.tags?.length) {
      filtered = filtered.filter(fav => 
        filters.tags!.some(tag => fav.tags.includes(tag))
      )
    }

    if (filters.collectionId) {
      const userCollections = Array.from(this.collections.values()).flat()
      const collection = userCollections.find(col => col.id === filters.collectionId)
      if (collection) {
        filtered = filtered.filter(fav => collection.favoriteIds.includes(fav.id))
      }
    }

    if (filters.importance?.length) {
      filtered = filtered.filter(fav => 
        filters.importance!.includes(fav.metadata.importance)
      )
    }

    if (filters.dateRange) {
      filtered = filtered.filter(fav => 
        fav.createdAt >= filters.dateRange!.start && 
        fav.createdAt <= filters.dateRange!.end
      )
    }

    if (filters.isArchived !== undefined) {
      filtered = filtered.filter(fav => fav.isArchived === filters.isArchived)
    }

    return filtered
  }

  private async sortFavoriteResults(
    results: FavoriteItem[], 
    sortBy?: string, 
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<FavoriteItem[]> {
    const sorted = [...results]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'amount':
          comparison = (a.metadata.originalAmount || 0) - (b.metadata.originalAmount || 0)
          break
        case 'access_count':
          comparison = a.accessCount - b.accessCount
          break
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  private async generateFavoriteSearchSuggestions(query: string, userId: string): Promise<string[]> {
    const suggestions: string[] = []
    const queryLower = query.toLowerCase()

    for (const term of this.searchIndex.keys()) {
      if (term.startsWith(queryLower) && term !== queryLower) {
        suggestions.push(term)
      }
    }

    return suggestions.slice(0, 5)
  }

  private async updateTagUsage(tagId: string): Promise<void> {
    for (const userTags of this.tags.values()) {
      const tag = userTags.find(t => t.id === tagId)
      if (tag) {
        tag.usageCount++
        tag.lastUsed = new Date()
        break
      }
    }
  }

  private startPeriodicTasks(): void {
    // 每天清理未使用的标签
    setInterval(() => {
      this.cleanupUnusedTags()
    }, 24 * 60 * 60 * 1000)
  }

  private async cleanupUnusedTags(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    for (const [userId, userTags] of this.tags.entries()) {
      const activeTags = userTags.filter(tag => 
        tag.usageCount > 0 || (tag.lastUsed && tag.lastUsed > thirtyDaysAgo)
      )
      
      if (activeTags.length !== userTags.length) {
        this.tags.set(userId, activeTags)
        await this.storageService.storeData(
          `tags_${userId}`,
          activeTags,
          { encrypt: true, compress: true, namespace: 'favorites' }
        )
      }
    }
  }
}

// Export singleton instance
export const favoritesService = FavoritesService.getInstance()
