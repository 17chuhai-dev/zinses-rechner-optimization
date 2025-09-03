/**
 * 实时数据更新服务
 * 支持WebSocket连接、数据缓存和增量更新，确保仪表盘数据的实时性
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { DashboardPermissionController } from './DashboardPermissionController'

// 数据订阅
export interface DataSubscription {
  id: string
  dataType: string
  filters: Record<string, any>
  callback: (data: any) => void
  userId: string
  accountId: string
  
  // 订阅配置
  refreshInterval: number // 毫秒
  batchUpdates: boolean
  includeMetadata: boolean
  
  // 状态
  isActive: boolean
  lastUpdate: Date
  errorCount: number
  
  // 权限
  permissions: string[]
}

// 实时数据事件
export interface RealTimeDataEvent {
  id: string
  type: 'data_update' | 'data_insert' | 'data_delete' | 'data_error' | 'connection_status'
  dataType: string
  timestamp: Date
  
  // 数据内容
  data?: any
  changes?: DataChange[]
  metadata?: EventMetadata
  
  // 错误信息
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface DataChange {
  operation: 'insert' | 'update' | 'delete'
  id: string
  before?: any
  after?: any
  fields?: string[]
}

export interface EventMetadata {
  source: string
  version: number
  checksum?: string
  affectedRows: number
  executionTime: number
}

// 数据缓存项
export interface CacheItem {
  key: string
  data: any
  timestamp: Date
  ttl: number // 毫秒
  version: number
  metadata: {
    size: number
    hitCount: number
    lastAccess: Date
  }
}

// 连接状态
export interface ConnectionStatus {
  connected: boolean
  lastConnected?: Date
  lastDisconnected?: Date
  reconnectAttempts: number
  latency: number
  error?: string
}

// 数据同步状态
export interface SyncStatus {
  dataType: string
  lastSync: Date
  syncVersion: number
  pendingChanges: number
  conflictCount: number
  status: 'synced' | 'syncing' | 'error' | 'conflict'
}

/**
 * 实时数据更新服务
 */
export class RealTimeDataService {
  private static instance: RealTimeDataService
  private permissionController: DashboardPermissionController
  
  // WebSocket连接
  private websocket: WebSocket | null = null
  private connectionStatus: ConnectionStatus = {
    connected: false,
    reconnectAttempts: 0,
    latency: 0
  }
  
  // 订阅管理
  private subscriptions: Map<string, DataSubscription> = new Map()
  private eventListeners: Map<string, ((event: RealTimeDataEvent) => void)[]> = new Map()
  
  // 数据缓存
  private dataCache: Map<string, CacheItem> = new Map()
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0
  }
  
  // 同步状态
  private syncStatus: Map<string, SyncStatus> = new Map()
  
  // 配置
  private config = {
    websocketUrl: 'ws://localhost:8080/realtime',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    batchInterval: 1000,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    defaultTTL: 5 * 60 * 1000 // 5分钟
  }
  
  private isInitialized = false
  private heartbeatTimer: NodeJS.Timeout | null = null
  private batchTimer: NodeJS.Timeout | null = null
  private pendingUpdates: Map<string, any[]> = new Map()

  private constructor() {
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService()
    }
    return RealTimeDataService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.permissionController.initialize()
      await this.connectWebSocket()
      this.startCacheCleanup()
      this.startBatchProcessor()
      this.isInitialized = true
      console.log('✅ RealTimeDataService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize RealTimeDataService:', error)
      throw error
    }
  }

  /**
   * 订阅数据更新
   */
  async subscribe(
    dataType: string,
    callback: (data: any) => void,
    userId: string,
    accountId: string,
    options: {
      filters?: Record<string, any>
      refreshInterval?: number
      batchUpdates?: boolean
      includeMetadata?: boolean
    } = {}
  ): Promise<string> {
    if (!this.isInitialized) await this.initialize()

    // 检查权限
    const permissionCheck = await this.permissionController.checkDataAccess(
      userId,
      accountId,
      dataType,
      'view'
    )

    if (!permissionCheck.granted) {
      throw new Error('Insufficient permissions to subscribe to data updates')
    }

    const subscription: DataSubscription = {
      id: crypto.randomUUID(),
      dataType,
      filters: options.filters || {},
      callback,
      userId,
      accountId,
      refreshInterval: options.refreshInterval || 5000,
      batchUpdates: options.batchUpdates || false,
      includeMetadata: options.includeMetadata || false,
      isActive: true,
      lastUpdate: new Date(),
      errorCount: 0,
      permissions: permissionCheck.allowedActions
    }

    this.subscriptions.set(subscription.id, subscription)

    // 发送订阅请求到服务器
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'subscribe',
        subscriptionId: subscription.id,
        dataType,
        filters: subscription.filters,
        options: {
          refreshInterval: subscription.refreshInterval,
          batchUpdates: subscription.batchUpdates,
          includeMetadata: subscription.includeMetadata
        }
      }))
    }

    console.log(`📡 Subscribed to ${dataType} updates: ${subscription.id}`)
    return subscription.id
  }

  /**
   * 取消订阅
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    subscription.isActive = false
    this.subscriptions.delete(subscriptionId)

    // 发送取消订阅请求到服务器
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'unsubscribe',
        subscriptionId
      }))
    }

    console.log(`📡 Unsubscribed from updates: ${subscriptionId}`)
  }

  /**
   * 手动更新数据
   */
  async updateData(dataType: string, data: any, metadata?: EventMetadata): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const event: RealTimeDataEvent = {
      id: crypto.randomUUID(),
      type: 'data_update',
      dataType,
      timestamp: new Date(),
      data,
      metadata
    }

    // 更新缓存
    this.updateCache(dataType, data)

    // 通知订阅者
    await this.notifySubscribers(event)

    console.log(`🔄 Data updated: ${dataType}`)
  }

  /**
   * 获取缓存数据
   */
  getCachedData(dataType: string, filters?: Record<string, any>): any | null {
    const cacheKey = this.generateCacheKey(dataType, filters)
    const cacheItem = this.dataCache.get(cacheKey)

    if (!cacheItem) {
      this.cacheStats.misses++
      return null
    }

    // 检查TTL
    if (Date.now() - cacheItem.timestamp.getTime() > cacheItem.ttl) {
      this.dataCache.delete(cacheKey)
      this.cacheStats.evictions++
      return null
    }

    // 更新访问统计
    cacheItem.metadata.hitCount++
    cacheItem.metadata.lastAccess = new Date()
    this.cacheStats.hits++

    return cacheItem.data
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(dataType?: string): SyncStatus[] {
    if (dataType) {
      const status = this.syncStatus.get(dataType)
      return status ? [status] : []
    }
    return Array.from(this.syncStatus.values())
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): typeof this.cacheStats & { totalItems: number; totalSize: string } {
    return {
      ...this.cacheStats,
      totalItems: this.dataCache.size,
      totalSize: this.formatBytes(this.cacheStats.totalSize)
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(eventType: string, listener: (event: RealTimeDataEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventType: string, listener: (event: RealTimeDataEvent) => void): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 清理缓存
   */
  clearCache(dataType?: string): void {
    if (dataType) {
      // 清理特定数据类型的缓存
      for (const [key, item] of this.dataCache) {
        if (key.startsWith(dataType)) {
          this.dataCache.delete(key)
          this.cacheStats.totalSize -= item.metadata.size
        }
      }
    } else {
      // 清理所有缓存
      this.dataCache.clear()
      this.cacheStats.totalSize = 0
    }
    
    console.log(`🧹 Cache cleared: ${dataType || 'all'}`)
  }

  // 私有方法
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.config.websocketUrl)

        this.websocket.onopen = () => {
          this.connectionStatus.connected = true
          this.connectionStatus.lastConnected = new Date()
          this.connectionStatus.reconnectAttempts = 0
          this.startHeartbeat()
          console.log('🔌 WebSocket connected')
          resolve()
        }

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event)
        }

        this.websocket.onclose = () => {
          this.connectionStatus.connected = false
          this.connectionStatus.lastDisconnected = new Date()
          this.stopHeartbeat()
          console.log('🔌 WebSocket disconnected')
          this.attemptReconnect()
        }

        this.websocket.onerror = (error) => {
          this.connectionStatus.error = 'WebSocket connection error'
          console.error('🔌 WebSocket error:', error)
          reject(error)
        }

        // 连接超时
        setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'))
          }
        }, 10000)
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'data_update':
          this.handleDataUpdate(message)
          break
        case 'heartbeat_response':
          this.handleHeartbeatResponse(message)
          break
        case 'subscription_confirmed':
          console.log(`✅ Subscription confirmed: ${message.subscriptionId}`)
          break
        case 'error':
          console.error('❌ Server error:', message.error)
          break
        default:
          console.warn('Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private async handleDataUpdate(message: any): Promise<void> {
    const event: RealTimeDataEvent = {
      id: message.id || crypto.randomUUID(),
      type: 'data_update',
      dataType: message.dataType,
      timestamp: new Date(message.timestamp),
      data: message.data,
      changes: message.changes,
      metadata: message.metadata
    }

    // 更新缓存
    if (message.data) {
      this.updateCache(message.dataType, message.data)
    }

    // 更新同步状态
    this.updateSyncStatus(message.dataType, {
      lastSync: event.timestamp,
      syncVersion: message.metadata?.version || 0,
      pendingChanges: 0,
      conflictCount: 0,
      status: 'synced'
    })

    // 通知订阅者
    await this.notifySubscribers(event)
  }

  private handleHeartbeatResponse(message: any): void {
    const now = Date.now()
    const sentTime = message.timestamp
    this.connectionStatus.latency = now - sentTime
  }

  private async notifySubscribers(event: RealTimeDataEvent): Promise<void> {
    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive && sub.dataType === event.dataType)

    for (const subscription of relevantSubscriptions) {
      try {
        // 检查权限
        const hasPermission = await this.permissionController.checkDataAccess(
          subscription.userId,
          subscription.accountId,
          event.dataType,
          'view'
        )

        if (!hasPermission.granted) {
          continue
        }

        // 应用过滤器
        let data = event.data
        if (subscription.filters && Object.keys(subscription.filters).length > 0) {
          data = this.applyFilters(data, subscription.filters)
        }

        // 批量更新或立即更新
        if (subscription.batchUpdates) {
          this.addToBatch(subscription.id, data)
        } else {
          subscription.callback(data)
          subscription.lastUpdate = new Date()
        }
      } catch (error) {
        subscription.errorCount++
        console.error(`Failed to notify subscription ${subscription.id}:`, error)
      }
    }

    // 触发事件监听器
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      })
    }
  }

  private updateCache(dataType: string, data: any, ttl?: number): void {
    const cacheKey = this.generateCacheKey(dataType)
    const dataSize = this.calculateDataSize(data)
    
    // 检查缓存大小限制
    if (this.cacheStats.totalSize + dataSize > this.config.maxCacheSize) {
      this.evictOldestCacheItems(dataSize)
    }

    const cacheItem: CacheItem = {
      key: cacheKey,
      data,
      timestamp: new Date(),
      ttl: ttl || this.config.defaultTTL,
      version: Date.now(),
      metadata: {
        size: dataSize,
        hitCount: 0,
        lastAccess: new Date()
      }
    }

    this.dataCache.set(cacheKey, cacheItem)
    this.cacheStats.totalSize += dataSize
  }

  private updateSyncStatus(dataType: string, updates: Partial<SyncStatus>): void {
    const existing = this.syncStatus.get(dataType) || {
      dataType,
      lastSync: new Date(),
      syncVersion: 0,
      pendingChanges: 0,
      conflictCount: 0,
      status: 'synced' as const
    }

    this.syncStatus.set(dataType, { ...existing, ...updates })
  }

  private generateCacheKey(dataType: string, filters?: Record<string, any>): string {
    const filterStr = filters ? JSON.stringify(filters) : ''
    return `${dataType}_${filterStr}`
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length * 2 // 简化计算，每字符2字节
  }

  private evictOldestCacheItems(requiredSpace: number): void {
    const items = Array.from(this.dataCache.entries())
      .sort(([, a], [, b]) => a.metadata.lastAccess.getTime() - b.metadata.lastAccess.getTime())

    let freedSpace = 0
    for (const [key, item] of items) {
      this.dataCache.delete(key)
      freedSpace += item.metadata.size
      this.cacheStats.evictions++
      
      if (freedSpace >= requiredSpace) {
        break
      }
    }

    this.cacheStats.totalSize -= freedSpace
  }

  private applyFilters(data: any, filters: Record<string, any>): any {
    if (!Array.isArray(data)) return data

    return data.filter(item => {
      for (const [field, value] of Object.entries(filters)) {
        if (item[field] !== value) {
          return false
        }
      }
      return true
    })
  }

  private addToBatch(subscriptionId: string, data: any): void {
    if (!this.pendingUpdates.has(subscriptionId)) {
      this.pendingUpdates.set(subscriptionId, [])
    }
    this.pendingUpdates.get(subscriptionId)!.push(data)
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        }))
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private startBatchProcessor(): void {
    this.batchTimer = setInterval(() => {
      for (const [subscriptionId, updates] of this.pendingUpdates) {
        if (updates.length === 0) continue

        const subscription = this.subscriptions.get(subscriptionId)
        if (subscription && subscription.isActive) {
          try {
            subscription.callback(updates)
            subscription.lastUpdate = new Date()
          } catch (error) {
            subscription.errorCount++
            console.error(`Batch update failed for subscription ${subscriptionId}:`, error)
          }
        }

        // 清空批次
        this.pendingUpdates.set(subscriptionId, [])
      }
    }, this.config.batchInterval)
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      let cleanedSize = 0

      for (const [key, item] of this.dataCache) {
        if (now - item.timestamp.getTime() > item.ttl) {
          this.dataCache.delete(key)
          cleanedSize += item.metadata.size
          this.cacheStats.evictions++
        }
      }

      this.cacheStats.totalSize -= cleanedSize
      
      if (cleanedSize > 0) {
        console.log(`🧹 Cache cleanup: freed ${this.formatBytes(cleanedSize)}`)
      }
    }, 60000) // 每分钟清理一次
  }

  private attemptReconnect(): void {
    if (this.connectionStatus.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      return
    }

    this.connectionStatus.reconnectAttempts++
    
    setTimeout(async () => {
      try {
        console.log(`🔄 Attempting to reconnect (${this.connectionStatus.reconnectAttempts}/${this.config.maxReconnectAttempts})`)
        await this.connectWebSocket()
        
        // 重新订阅所有活跃订阅
        for (const subscription of this.subscriptions.values()) {
          if (subscription.isActive && this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
              type: 'subscribe',
              subscriptionId: subscription.id,
              dataType: subscription.dataType,
              filters: subscription.filters
            }))
          }
        }
      } catch (error) {
        console.error('Reconnection failed:', error)
        this.attemptReconnect()
      }
    }, this.config.reconnectInterval)
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Export singleton instance
export const realTimeDataService = RealTimeDataService.getInstance()
