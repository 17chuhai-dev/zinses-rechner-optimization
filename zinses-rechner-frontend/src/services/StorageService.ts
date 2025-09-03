/**
 * 本地存储服务
 * 提供统一的数据持久化接口，支持 localStorage、IndexedDB 和内存存储
 * 集成AES-256-GCM加密功能，确保数据安全
 */

import { encryptionService, type EncryptedData } from './EncryptionService'

// 存储类型枚举
export enum StorageType {
  LOCAL_STORAGE = 'localStorage',
  INDEXED_DB = 'indexedDB',
  MEMORY = 'memory'
}

// 存储配置接口
export interface StorageConfig {
  type: StorageType
  dbName?: string
  version?: number
  encryption?: boolean
  compression?: boolean
}

// 存储项接口
export interface StorageItem<T = any> {
  key: string
  value: T
  timestamp: number
  expiresAt?: number
  metadata?: Record<string, any>
}

// 查询选项接口
export interface QueryOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: (item: StorageItem) => boolean
}

/**
 * 统一存储服务类
 */
export class StorageService {
  private config: StorageConfig
  private db: IDBDatabase | null = null
  private memoryStore: Map<string, StorageItem> = new Map()
  private isEncryptionReady: boolean = false

  constructor(config: StorageConfig = { type: StorageType.LOCAL_STORAGE }) {
    this.config = config
    this.initialize()
  }

  /**
   * 初始化存储服务
   */
  private async initialize(): Promise<void> {
    try {
      // 初始化加密服务（如果启用）
      if (this.config.encryption) {
        await encryptionService.initialize()
        this.isEncryptionReady = true
        console.log('🔐 Storage encryption enabled')
      }

      // 初始化存储后端
      if (this.config.type === StorageType.INDEXED_DB) {
        await this.initIndexedDB()
      }

      console.log(`📦 Storage service initialized (${this.config.type})`)
    } catch (error) {
      console.error('Storage service initialization failed:', error)
      // 如果加密初始化失败，禁用加密功能
      if (this.config.encryption) {
        console.warn('⚠️ Encryption disabled due to initialization failure')
        this.config.encryption = false
        this.isEncryptionReady = false
      }
    }
  }

  /**
   * 初始化 IndexedDB
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        this.config.dbName || 'ZinsesRechnerDB',
        this.config.version || 1
      )

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        if (!db.objectStoreNames.contains('storage')) {
          const store = db.createObjectStore('storage', { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('expiresAt', 'expiresAt', { unique: false })
        }
      }
    })
  }

  /**
   * 存储数据
   */
  async set<T>(key: string, value: T, options?: {
    expiresIn?: number // 过期时间（毫秒）
    metadata?: Record<string, any>
  }): Promise<void> {
    // 加密数据（如果启用）
    const encryptedValue = this.config.encryption ? await this.encrypt(value) : value

    const item: StorageItem<T | EncryptedData> = {
      key,
      value: encryptedValue,
      timestamp: Date.now(),
      expiresAt: options?.expiresIn ? Date.now() + options.expiresIn : undefined,
      metadata: options?.metadata
    }

    switch (this.config.type) {
      case StorageType.LOCAL_STORAGE:
        await this.setLocalStorage(key, item)
        break
      case StorageType.INDEXED_DB:
        await this.setIndexedDB(key, item)
        break
      case StorageType.MEMORY:
        this.memoryStore.set(key, item as StorageItem)
        break
    }
  }

  /**
   * 获取数据
   */
  async get<T>(key: string): Promise<T | null> {
    let item: StorageItem<T | EncryptedData> | null = null

    switch (this.config.type) {
      case StorageType.LOCAL_STORAGE:
        item = await this.getLocalStorage<T | EncryptedData>(key)
        break
      case StorageType.INDEXED_DB:
        item = await this.getIndexedDB<T | EncryptedData>(key)
        break
      case StorageType.MEMORY:
        item = this.memoryStore.get(key) || null
        break
    }

    if (!item) return null

    // 检查是否过期
    if (item.expiresAt && Date.now() > item.expiresAt) {
      await this.remove(key)
      return null
    }

    // 解密数据（如果启用）
    try {
      return this.config.encryption ? await this.decrypt<T>(item.value) : item.value as T
    } catch (error) {
      console.error(`Failed to decrypt data for key "${key}":`, error)
      // 如果解密失败，删除损坏的数据
      await this.remove(key)
      return null
    }
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<void> {
    switch (this.config.type) {
      case StorageType.LOCAL_STORAGE:
        localStorage.removeItem(key)
        break
      case StorageType.INDEXED_DB:
        await this.removeIndexedDB(key)
        break
      case StorageType.MEMORY:
        this.memoryStore.delete(key)
        break
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    switch (this.config.type) {
      case StorageType.LOCAL_STORAGE:
        localStorage.clear()
        break
      case StorageType.INDEXED_DB:
        await this.clearIndexedDB()
        break
      case StorageType.MEMORY:
        this.memoryStore.clear()
        break
    }
  }

  /**
   * 获取所有键
   */
  async keys(): Promise<string[]> {
    switch (this.config.type) {
      case StorageType.LOCAL_STORAGE:
        return Object.keys(localStorage)
      case StorageType.INDEXED_DB:
        return await this.getIndexedDBKeys()
      case StorageType.MEMORY:
        return Array.from(this.memoryStore.keys())
    }
  }

  /**
   * 查询数据
   */
  async query<T>(options: QueryOptions = {}): Promise<StorageItem<T>[]> {
    let items: StorageItem<T>[] = []

    switch (this.config.type) {
      case StorageType.LOCAL_STORAGE:
        items = await this.queryLocalStorage<T>(options)
        break
      case StorageType.INDEXED_DB:
        items = await this.queryIndexedDB<T>(options)
        break
      case StorageType.MEMORY:
        items = Array.from(this.memoryStore.values()) as StorageItem<T>[]
        break
    }

    // 应用过滤器
    if (options.filter) {
      items = items.filter(options.filter)
    }

    // 排序
    if (options.sortBy) {
      items.sort((a, b) => {
        const aVal = (a as any)[options.sortBy!]
        const bVal = (b as any)[options.sortBy!]
        const order = options.sortOrder === 'desc' ? -1 : 1
        return aVal > bVal ? order : aVal < bVal ? -order : 0
      })
    }

    // 分页
    if (options.offset || options.limit) {
      const start = options.offset || 0
      const end = options.limit ? start + options.limit : undefined
      items = items.slice(start, end)
    }

    return items
  }

  /**
   * 获取存储统计信息
   */
  async getStats(): Promise<{
    totalItems: number
    totalSize: number
    encryptedItems: number
    oldestItem?: number
    newestItem?: number
    encryptionStatus: {
      enabled: boolean
      ready: boolean
      serviceStatus: any
    }
  }> {
    const keys = await this.keys()
    let totalSize = 0
    let encryptedItems = 0
    let oldestItem: number | undefined
    let newestItem: number | undefined

    for (const key of keys) {
      const rawItem = await this.getRawItem(key)
      if (rawItem) {
        totalSize += JSON.stringify(rawItem).length

        // 检查是否为加密数据
        if (this.isEncryptedData(rawItem.value)) {
          encryptedItems++
        }

        // 获取时间戳
        if (!oldestItem || rawItem.timestamp < oldestItem) {
          oldestItem = rawItem.timestamp
        }
        if (!newestItem || rawItem.timestamp > newestItem) {
          newestItem = rawItem.timestamp
        }
      }
    }

    return {
      totalItems: keys.length,
      totalSize,
      encryptedItems,
      oldestItem,
      newestItem,
      encryptionStatus: {
        enabled: this.config.encryption || false,
        ready: this.isEncryptionReady,
        serviceStatus: encryptionService.getStatus()
      }
    }
  }

  /**
   * 验证存储数据的完整性
   */
  async verifyIntegrity(): Promise<{
    totalItems: number
    validItems: number
    corruptedItems: string[]
    encryptionErrors: string[]
  }> {
    const keys = await this.keys()
    const corruptedItems: string[] = []
    const encryptionErrors: string[] = []
    let validItems = 0

    for (const key of keys) {
      try {
        const item = await this.get(key)
        if (item !== null) {
          validItems++
        } else {
          corruptedItems.push(key)
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('decrypt')) {
          encryptionErrors.push(key)
        } else {
          corruptedItems.push(key)
        }
      }
    }

    return {
      totalItems: keys.length,
      validItems,
      corruptedItems,
      encryptionErrors
    }
  }

  /**
   * 获取加密配置状态
   */
  getEncryptionConfig(): {
    enabled: boolean
    ready: boolean
    type: string
    serviceStatus: any
  } {
    return {
      enabled: this.config.encryption || false,
      ready: this.isEncryptionReady,
      type: this.config.type,
      serviceStatus: encryptionService.getStatus()
    }
  }

  /**
   * 清理过期数据
   */
  async cleanup(): Promise<number> {
    const keys = await this.keys()
    let cleanedCount = 0

    for (const key of keys) {
      const item = await this.get(key)
      if (!item) {
        cleanedCount++
      }
    }

    return cleanedCount
  }

  /**
   * 启用加密功能（数据迁移）
   */
  async enableEncryption(): Promise<void> {
    if (this.config.encryption) {
      console.log('Encryption already enabled')
      return
    }

    try {
      // 初始化加密服务
      await encryptionService.initialize()
      this.isEncryptionReady = true

      // 获取所有现有数据
      const keys = await this.keys()
      console.log(`🔄 Migrating ${keys.length} items to encrypted storage...`)

      // 逐个迁移数据
      for (const key of keys) {
        const item = await this.getRawItem(key)
        if (item && !this.isEncryptedData(item.value)) {
          // 重新存储数据（会自动加密）
          await this.set(key, item.value, {
            expiresIn: item.expiresAt ? item.expiresAt - Date.now() : undefined,
            metadata: item.metadata
          })
        }
      }

      // 启用加密配置
      this.config.encryption = true
      console.log('✅ Encryption enabled and data migrated')
    } catch (error) {
      console.error('Failed to enable encryption:', error)
      throw error
    }
  }

  /**
   * 禁用加密功能（数据迁移）
   */
  async disableEncryption(): Promise<void> {
    if (!this.config.encryption) {
      console.log('Encryption already disabled')
      return
    }

    try {
      // 获取所有现有数据
      const keys = await this.keys()
      console.log(`🔄 Migrating ${keys.length} items to unencrypted storage...`)

      // 逐个迁移数据
      for (const key of keys) {
        const decryptedValue = await this.get(key)
        if (decryptedValue !== null) {
          const item = await this.getRawItem(key)
          // 直接存储解密后的数据
          await this.setRawItem(key, {
            ...item!,
            value: decryptedValue
          })
        }
      }

      // 禁用加密配置
      this.config.encryption = false
      this.isEncryptionReady = false

      // 清理加密服务缓存
      encryptionService.clearKeyCache()
      console.log('✅ Encryption disabled and data migrated')
    } catch (error) {
      console.error('Failed to disable encryption:', error)
      throw error
    }
  }

  /**
   * 获取原始存储项（不解密）
   */
  private async getRawItem<T>(key: string): Promise<StorageItem<T> | null> {
    switch (this.config.type) {
      case StorageType.LOCAL_STORAGE:
        return await this.getLocalStorage<T>(key)
      case StorageType.INDEXED_DB:
        return await this.getIndexedDB<T>(key)
      case StorageType.MEMORY:
        return this.memoryStore.get(key) || null
      default:
        return null
    }
  }

  /**
   * 设置原始存储项（不加密）
   */
  private async setRawItem<T>(key: string, item: StorageItem<T>): Promise<void> {
    switch (this.config.type) {
      case StorageType.LOCAL_STORAGE:
        await this.setLocalStorage(key, item)
        break
      case StorageType.INDEXED_DB:
        await this.setIndexedDB(key, item)
        break
      case StorageType.MEMORY:
        this.memoryStore.set(key, item as StorageItem)
        break
    }
  }

  // LocalStorage 实现
  private async setLocalStorage<T>(key: string, item: StorageItem<T>): Promise<void> {
    try {
      const serialized = this.config.compression ?
        this.compress(JSON.stringify(item)) :
        JSON.stringify(item)
      localStorage.setItem(key, serialized)
    } catch (error) {
      throw new Error(`Failed to save to localStorage: ${error}`)
    }
  }

  private async getLocalStorage<T>(key: string): Promise<StorageItem<T> | null> {
    try {
      const serialized = localStorage.getItem(key)
      if (!serialized) return null

      const data = this.config.compression ?
        this.decompress(serialized) :
        serialized
      return JSON.parse(data)
    } catch (error) {
      console.warn(`Failed to parse localStorage item ${key}:`, error)
      return null
    }
  }

  private async queryLocalStorage<T>(options: QueryOptions): Promise<StorageItem<T>[]> {
    const items: StorageItem<T>[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const item = await this.getLocalStorage<T>(key)
        if (item) items.push(item)
      }
    }

    return items
  }

  // IndexedDB 实现
  private async setIndexedDB<T>(key: string, item: StorageItem<T>): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readwrite')
      const store = transaction.objectStore('storage')
      const request = store.put(item)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async getIndexedDB<T>(key: string): Promise<StorageItem<T> | null> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readonly')
      const store = transaction.objectStore('storage')
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  private async removeIndexedDB(key: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readwrite')
      const store = transaction.objectStore('storage')
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readwrite')
      const store = transaction.objectStore('storage')
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async getIndexedDBKeys(): Promise<string[]> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readonly')
      const store = transaction.objectStore('storage')
      const request = store.getAllKeys()

      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  }

  private async queryIndexedDB<T>(options: QueryOptions): Promise<StorageItem<T>[]> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readonly')
      const store = transaction.objectStore('storage')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 加密/解密实现
  private async encrypt<T>(data: T): Promise<T | EncryptedData> {
    if (!this.config.encryption || !this.isEncryptionReady) {
      return data
    }

    try {
      const encryptedData = await encryptionService.encrypt(data)
      return encryptedData as T
    } catch (error) {
      console.error('Encryption failed, storing unencrypted:', error)
      return data
    }
  }

  private async decrypt<T>(data: T | EncryptedData): Promise<T> {
    if (!this.config.encryption || !this.isEncryptionReady) {
      return data as T
    }

    // 检查数据是否为加密格式
    if (this.isEncryptedData(data)) {
      try {
        return await encryptionService.decrypt<T>(data as EncryptedData)
      } catch (error) {
        console.error('Decryption failed:', error)
        throw new Error('Failed to decrypt stored data')
      }
    }

    // 如果不是加密数据，直接返回
    return data as T
  }

  /**
   * 检查数据是否为加密格式
   */
  private isEncryptedData(data: any): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      'data' in data &&
      'iv' in data &&
      'salt' in data &&
      'version' in data &&
      'timestamp' in data
    )
  }

  // 压缩/解压（简化实现）
  private compress(data: string): string {
    // 这里应该实现真正的压缩逻辑
    // 为了演示，我们只是返回原数据
    return data
  }

  private decompress(data: string): string {
    // 这里应该实现真正的解压逻辑
    // 为了演示，我们只是返回原数据
    return data
  }
}

// 创建默认存储服务实例（启用加密）
export const storageService = new StorageService({
  type: StorageType.LOCAL_STORAGE,
  encryption: true,
  compression: true
})

// 创建 IndexedDB 存储服务实例（启用加密）
export const indexedDBService = new StorageService({
  type: StorageType.INDEXED_DB,
  dbName: 'ZinsesRechnerDB',
  version: 1,
  encryption: true,
  compression: true
})

// 创建内存存储服务实例（不加密，用于临时数据）
export const memoryStorageService = new StorageService({
  type: StorageType.MEMORY,
  encryption: false,
  compression: false
})
