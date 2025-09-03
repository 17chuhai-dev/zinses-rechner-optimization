/**
 * DSGVO合规的本地存储服务
 * 实现加密的本地数据存储，完全符合德国数据保护法规
 */

// 计算历史数据接口
export interface CalculationHistory {
  id: string
  calculatorId: string
  calculatorName: string
  inputData: Record<string, any>
  results: Record<string, any>
  timestamp: Date
  isFavorite: boolean
  tags: string[]
  notes?: string
}

// 用户偏好设置接口
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: 'de' | 'en'
  currency: 'EUR' | 'USD'
  dateFormat: 'DD.MM.YYYY' | 'MM/DD/YYYY'
  numberFormat: 'de-DE' | 'en-US'
  defaultCalculator?: string
  autoSave: boolean
  dataRetentionDays: number
}

// 数据导出格式接口
export interface ExportData {
  version: string
  exportDate: Date
  calculations: CalculationHistory[]
  preferences: UserPreferences
  metadata: {
    totalCalculations: number
    favoriteCount: number
    calculatorUsage: Record<string, number>
  }
}

// DSGVO合规配置
const DSGVO_CONFIG = {
  MAX_STORAGE_SIZE: 50 * 1024 * 1024, // 50MB最大存储
  DEFAULT_RETENTION_DAYS: 365, // 默认保留1年
  ENCRYPTION_KEY_LENGTH: 32,
  DATABASE_NAME: 'ZinsesRechnerDB',
  DATABASE_VERSION: 1,
  STORES: {
    CALCULATIONS: 'calculations',
    PREFERENCES: 'preferences',
    METADATA: 'metadata'
  }
}

/**
 * DSGVO合规的本地存储服务类
 */
export class LocalStorageService {
  private db: IDBDatabase | null = null
  private encryptionKey: CryptoKey | null = null
  private isInitialized = false

  /**
   * 初始化存储服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 初始化IndexedDB
      await this.initializeDatabase()

      // 初始化加密密钥
      await this.initializeEncryption()

      // 清理过期数据
      await this.cleanupExpiredData()

      this.isInitialized = true
      console.log('✅ LocalStorageService initialized with DSGVO compliance')
    } catch (error) {
      console.error('❌ Failed to initialize LocalStorageService:', error)
      throw error
    }
  }

  /**
   * 初始化IndexedDB数据库
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DSGVO_CONFIG.DATABASE_NAME, DSGVO_CONFIG.DATABASE_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建计算历史存储
        if (!db.objectStoreNames.contains(DSGVO_CONFIG.STORES.CALCULATIONS)) {
          const calculationsStore = db.createObjectStore(DSGVO_CONFIG.STORES.CALCULATIONS, {
            keyPath: 'id'
          })
          calculationsStore.createIndex('calculatorId', 'calculatorId', { unique: false })
          calculationsStore.createIndex('timestamp', 'timestamp', { unique: false })
          calculationsStore.createIndex('isFavorite', 'isFavorite', { unique: false })
        }

        // 创建用户偏好存储
        if (!db.objectStoreNames.contains(DSGVO_CONFIG.STORES.PREFERENCES)) {
          db.createObjectStore(DSGVO_CONFIG.STORES.PREFERENCES, { keyPath: 'key' })
        }

        // 创建元数据存储
        if (!db.objectStoreNames.contains(DSGVO_CONFIG.STORES.METADATA)) {
          db.createObjectStore(DSGVO_CONFIG.STORES.METADATA, { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * 初始化加密系统
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // 检查是否已有存储的密钥
      const storedKey = localStorage.getItem('zr_encryption_key')

      if (storedKey) {
        // 从存储中恢复密钥
        const keyData = JSON.parse(storedKey)
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          new Uint8Array(keyData),
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        )
      } else {
        // 生成新的加密密钥
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        )

        // 导出并存储密钥
        const exportedKey = await crypto.subtle.exportKey('raw', this.encryptionKey)
        localStorage.setItem('zr_encryption_key', JSON.stringify(Array.from(new Uint8Array(exportedKey))))
      }
    } catch (error) {
      console.error('加密初始化失败:', error)
      throw error
    }
  }

  /**
   * 加密数据
   */
  private async encryptData(data: any): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    if (!this.encryptionKey) throw new Error('Encryption key not initialized')

    const encoder = new TextEncoder()
    const dataString = JSON.stringify(data)
    const dataBuffer = encoder.encode(dataString)

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      dataBuffer
    )

    return { encrypted, iv }
  }

  /**
   * 解密数据
   */
  private async decryptData(encrypted: ArrayBuffer, iv: Uint8Array): Promise<any> {
    if (!this.encryptionKey) throw new Error('Encryption key not initialized')

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encrypted
    )

    const decoder = new TextDecoder()
    const dataString = decoder.decode(decrypted)
    return JSON.parse(dataString)
  }

  /**
   * 保存计算历史
   */
  async saveCalculation(calculation: Omit<CalculationHistory, 'id' | 'timestamp'>): Promise<string> {
    if (!this.isInitialized) await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const id = crypto.randomUUID()
    const timestamp = new Date()

    const calculationData: CalculationHistory = {
      id,
      timestamp,
      ...calculation
    }

    // 加密敏感数据
    const { encrypted, iv } = await this.encryptData(calculationData)

    const transaction = this.db.transaction([DSGVO_CONFIG.STORES.CALCULATIONS], 'readwrite')
    const store = transaction.objectStore(DSGVO_CONFIG.STORES.CALCULATIONS)

    await new Promise<void>((resolve, reject) => {
      const request = store.add({
        id,
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        timestamp,
        calculatorId: calculation.calculatorId,
        isFavorite: calculation.isFavorite
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // 更新使用统计
    await this.updateUsageStatistics(calculation.calculatorId)

    return id
  }

  /**
   * 获取计算历史
   */
  async getCalculationHistory(limit?: number, calculatorId?: string): Promise<CalculationHistory[]> {
    if (!this.isInitialized) await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const transaction = this.db.transaction([DSGVO_CONFIG.STORES.CALCULATIONS], 'readonly')
    const store = transaction.objectStore(DSGVO_CONFIG.STORES.CALCULATIONS)

    let request: IDBRequest
    if (calculatorId) {
      const index = store.index('calculatorId')
      request = index.getAll(calculatorId)
    } else {
      request = store.getAll()
    }

    const encryptedData = await new Promise<any[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    // 解密数据
    const decryptedData: CalculationHistory[] = []
    for (const item of encryptedData) {
      try {
        const encrypted = new Uint8Array(item.encrypted).buffer
        const iv = new Uint8Array(item.iv)
        const decrypted = await this.decryptData(encrypted, iv)
        decryptedData.push(decrypted)
      } catch (error) {
        console.warn('Failed to decrypt calculation:', item.id, error)
      }
    }

    // 按时间排序并限制数量
    decryptedData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return limit ? decryptedData.slice(0, limit) : decryptedData
  }

  /**
   * 删除计算历史
   */
  async deleteCalculation(id: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const transaction = this.db.transaction([DSGVO_CONFIG.STORES.CALCULATIONS], 'readwrite')
    const store = transaction.objectStore(DSGVO_CONFIG.STORES.CALCULATIONS)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清理过期数据（DSGVO合规）
   */
  private async cleanupExpiredData(): Promise<void> {
    if (!this.db) return

    const preferences = await this.getUserPreferences()
    const retentionDays = preferences.dataRetentionDays || DSGVO_CONFIG.DEFAULT_RETENTION_DAYS
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const transaction = this.db.transaction([DSGVO_CONFIG.STORES.CALCULATIONS], 'readwrite')
    const store = transaction.objectStore(DSGVO_CONFIG.STORES.CALCULATIONS)
    const index = store.index('timestamp')

    const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate))

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })

    console.log(`🧹 Cleaned up data older than ${retentionDays} days`)
  }

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences(): Promise<UserPreferences> {
    if (!this.isInitialized) await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const transaction = this.db.transaction([DSGVO_CONFIG.STORES.PREFERENCES], 'readonly')
    const store = transaction.objectStore(DSGVO_CONFIG.STORES.PREFERENCES)

    const result = await new Promise<any>((resolve, reject) => {
      const request = store.get('user_preferences')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (result) {
      const decrypted = await this.decryptData(
        new Uint8Array(result.encrypted).buffer,
        new Uint8Array(result.iv)
      )
      return decrypted
    }

    // 返回默认偏好设置
    return {
      theme: 'auto',
      language: 'de',
      currency: 'EUR',
      dateFormat: 'DD.MM.YYYY',
      numberFormat: 'de-DE',
      autoSave: true,
      dataRetentionDays: DSGVO_CONFIG.DEFAULT_RETENTION_DAYS
    }
  }

  /**
   * 保存用户偏好设置
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    if (!this.isInitialized) await this.initialize()
    if (!this.db) throw new Error('Database not initialized')

    const { encrypted, iv } = await this.encryptData(preferences)

    const transaction = this.db.transaction([DSGVO_CONFIG.STORES.PREFERENCES], 'readwrite')
    const store = transaction.objectStore(DSGVO_CONFIG.STORES.PREFERENCES)

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        key: 'user_preferences',
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        updatedAt: new Date()
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 更新使用统计
   */
  private async updateUsageStatistics(calculatorId: string): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction([DSGVO_CONFIG.STORES.METADATA], 'readwrite')
    const store = transaction.objectStore(DSGVO_CONFIG.STORES.METADATA)

    // 获取当前统计
    const result = await new Promise<any>((resolve, reject) => {
      const request = store.get('usage_statistics')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    let statistics: { calculatorUsage: Record<string, number>, totalCalculations: number } = {
      calculatorUsage: {},
      totalCalculations: 0
    }
    if (result) {
      const decrypted = await this.decryptData(
        new Uint8Array(result.encrypted).buffer,
        new Uint8Array(result.iv)
      )
      statistics = decrypted
    }

    // 更新统计
    statistics.totalCalculations++
    statistics.calculatorUsage[calculatorId] = (statistics.calculatorUsage[calculatorId] || 0) + 1

    // 保存更新的统计
    const { encrypted, iv } = await this.encryptData(statistics)

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        key: 'usage_statistics',
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        updatedAt: new Date()
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 导出所有数据（DSGVO权利）
   */
  async exportAllData(): Promise<ExportData> {
    const calculations = await this.getCalculationHistory()
    const preferences = await this.getUserPreferences()

    // 获取统计数据
    const transaction = this.db!.transaction([DSGVO_CONFIG.STORES.METADATA], 'readonly')
    const store = transaction.objectStore(DSGVO_CONFIG.STORES.METADATA)

    const statsResult = await new Promise<any>((resolve, reject) => {
      const request = store.get('usage_statistics')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    let metadata = {
      totalCalculations: 0,
      favoriteCount: 0,
      calculatorUsage: {}
    }

    if (statsResult) {
      const decrypted = await this.decryptData(
        new Uint8Array(statsResult.encrypted).buffer,
        new Uint8Array(statsResult.iv)
      )
      metadata = {
        ...decrypted,
        favoriteCount: calculations.filter(c => c.isFavorite).length
      }
    }

    return {
      version: '1.0.0',
      exportDate: new Date(),
      calculations,
      preferences,
      metadata
    }
  }

  /**
   * 删除所有数据（DSGVO权利）
   */
  async deleteAllData(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction([
      DSGVO_CONFIG.STORES.CALCULATIONS,
      DSGVO_CONFIG.STORES.PREFERENCES,
      DSGVO_CONFIG.STORES.METADATA
    ], 'readwrite')

    // 清空所有存储
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(DSGVO_CONFIG.STORES.CALCULATIONS).clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(DSGVO_CONFIG.STORES.PREFERENCES).clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(DSGVO_CONFIG.STORES.METADATA).clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    ])

    // 删除加密密钥
    localStorage.removeItem('zr_encryption_key')
    this.encryptionKey = null

    console.log('🗑️ All user data deleted (DSGVO compliance)')
  }

  /**
   * 获取存储使用情况
   */
  async getStorageInfo(): Promise<{
    used: number
    available: number
    percentage: number
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage || 0
      const available = estimate.quota || DSGVO_CONFIG.MAX_STORAGE_SIZE

      return {
        used,
        available,
        percentage: (used / available) * 100
      }
    }

    return {
      used: 0,
      available: DSGVO_CONFIG.MAX_STORAGE_SIZE,
      percentage: 0
    }
  }
}

// 导出单例实例
export const localStorageService = new LocalStorageService()
