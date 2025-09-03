/**
 * 税收设置存储管理服务
 * 实现税收配置的持久化存储、版本控制、数据迁移和备份恢复功能
 */

import { TaxSettings, DEFAULT_TAX_SETTINGS } from '@/types/GermanTaxTypes'

// 存储版本信息
export interface StorageVersion {
  version: string
  timestamp: Date
  description: string
  migrationRequired: boolean
}

// 存储元数据
export interface StorageMetadata {
  version: string
  createdAt: Date
  updatedAt: Date
  lastAccessed: Date
  deviceId: string
  browserInfo: string
  backupCount: number
}

// 存储数据结构
export interface StorageData {
  settings: TaxSettings
  metadata: StorageMetadata
  checksum: string
}

// 备份数据结构
export interface BackupData {
  id: string
  name: string
  settings: TaxSettings
  createdAt: Date
  size: number
  description?: string
}

// 同步状态
export interface SyncStatus {
  lastSync: Date | null
  syncEnabled: boolean
  conflicts: string[]
  pendingChanges: boolean
}

/**
 * 税收设置存储管理服务类
 */
export class TaxStorageService {
  private static instance: TaxStorageService
  private readonly STORAGE_KEY = 'tax-settings-v2'
  private readonly BACKUP_KEY = 'tax-settings-backups'
  private readonly SYNC_KEY = 'tax-settings-sync'
  private readonly VERSION_KEY = 'tax-settings-version'

  private readonly CURRENT_VERSION = '2.0.0'
  private readonly MAX_BACKUPS = 10
  private readonly COMPRESSION_THRESHOLD = 1024 // 1KB

  private storageQuota: number = 0
  private usedStorage: number = 0
  private changeCallbacks = new Map<string, (data: StorageData) => void>()
  private errorCallbacks = new Map<string, (error: Error) => void>()
  private initialized: boolean = false

  constructor() {
    // 构造函数中不立即初始化，等待显式调用initialize
    console.log('💾 税收设置存储服务已创建')
  }

  /**
   * 初始化存储服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.initializeStorage()
      await this.checkStorageQuota()
      this.initialized = true
      console.log('💾 税收设置存储服务已初始化')
    } catch (error) {
      console.error('税收设置存储服务初始化失败:', error)
      throw error
    }
  }

  static getInstance(): TaxStorageService {
    if (!TaxStorageService.instance) {
      TaxStorageService.instance = new TaxStorageService()
    }
    return TaxStorageService.instance
  }

  /**
   * 保存税收设置
   */
  async saveTaxSettings(settings: TaxSettings, description?: string): Promise<boolean> {
    try {
      // 创建存储数据
      const storageData: StorageData = {
        settings,
        metadata: {
          version: this.CURRENT_VERSION,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: new Date(),
          deviceId: this.getDeviceId(),
          browserInfo: this.getBrowserInfo(),
          backupCount: await this.getBackupCount()
        },
        checksum: this.calculateChecksum(settings)
      }

      // 压缩数据（如果需要）
      const serializedData = this.shouldCompress(storageData)
        ? this.compressData(storageData)
        : JSON.stringify(storageData)

      // 检查存储空间
      if (!await this.checkStorageSpace(serializedData.length)) {
        throw new Error('Nicht genügend Speicherplatz verfügbar')
      }

      // 保存到本地存储
      localStorage.setItem(this.STORAGE_KEY, serializedData)

      // 创建自动备份
      if (description) {
        await this.createBackup(settings, `Auto: ${description}`)
      }

      // 更新版本信息
      this.updateVersionInfo()

      // 触发变更回调
      this.triggerChangeCallbacks(storageData)

      console.log('💾 税收设置已保存')
      return true

    } catch (error) {
      console.error('❌ 保存税收设置失败:', error)
      this.triggerErrorCallbacks(error as Error)
      return false
    }
  }

  /**
   * 加载税收设置
   */
  async loadTaxSettings(): Promise<TaxSettings> {
    try {
      const rawData = localStorage.getItem(this.STORAGE_KEY)

      if (!rawData) {
        console.log('📂 未找到保存的设置，使用默认设置')
        return { ...DEFAULT_TAX_SETTINGS }
      }

      // 解压缩数据（如果需要）
      const storageData: StorageData = this.isCompressed(rawData)
        ? this.decompressData(rawData)
        : JSON.parse(rawData)

      // 验证数据完整性
      if (!this.validateStorageData(storageData)) {
        throw new Error('Gespeicherte Daten sind beschädigt')
      }

      // 检查版本兼容性
      const migrationResult = await this.migrateIfNeeded(storageData)
      if (migrationResult.migrated) {
        await this.saveTaxSettings(migrationResult.settings, 'Migration')
        return migrationResult.settings
      }

      // 更新访问时间
      storageData.metadata.lastAccessed = new Date()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData))

      console.log('📂 税收设置已加载')
      return storageData.settings

    } catch (error) {
      console.error('❌ 加载税收设置失败:', error)
      this.triggerErrorCallbacks(error as Error)

      // 尝试从备份恢复
      const backupSettings = await this.restoreFromLatestBackup()
      if (backupSettings) {
        console.log('🔄 从备份恢复设置')
        return backupSettings
      }

      // 返回默认设置
      return { ...DEFAULT_TAX_SETTINGS }
    }
  }

  /**
   * 创建备份
   */
  async createBackup(settings: TaxSettings, name?: string): Promise<string> {
    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const backupData: BackupData = {
        id: backupId,
        name: name || `Backup ${new Date().toLocaleString('de-DE')}`,
        settings: { ...settings },
        createdAt: new Date(),
        size: JSON.stringify(settings).length,
        description: `Automatische Sicherung`
      }

      // 获取现有备份
      const existingBackups = await this.getBackups()

      // 添加新备份
      existingBackups.push(backupData)

      // 限制备份数量
      if (existingBackups.length > this.MAX_BACKUPS) {
        existingBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        existingBackups.splice(this.MAX_BACKUPS)
      }

      // 保存备份列表
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(existingBackups))

      console.log(`💾 备份已创建: ${backupData.name}`)
      return backupId

    } catch (error) {
      console.error('❌ 创建备份失败:', error)
      throw error
    }
  }

  /**
   * 获取所有备份
   */
  async getBackups(): Promise<BackupData[]> {
    try {
      const rawData = localStorage.getItem(this.BACKUP_KEY)
      if (!rawData) return []

      const backups: BackupData[] = JSON.parse(rawData)

      // 转换日期字符串为Date对象
      return backups.map(backup => ({
        ...backup,
        createdAt: new Date(backup.createdAt)
      })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    } catch (error) {
      console.error('❌ 获取备份列表失败:', error)
      return []
    }
  }

  /**
   * 从备份恢复
   */
  async restoreFromBackup(backupId: string): Promise<TaxSettings | null> {
    try {
      const backups = await this.getBackups()
      const backup = backups.find(b => b.id === backupId)

      if (!backup) {
        throw new Error(`Backup mit ID ${backupId} nicht gefunden`)
      }

      // 在恢复前创建当前设置的备份
      const currentSettings = await this.loadTaxSettings()
      await this.createBackup(currentSettings, 'Vor Wiederherstellung')

      // 恢复设置
      await this.saveTaxSettings(backup.settings, `Wiederhergestellt von: ${backup.name}`)

      console.log(`🔄 从备份恢复: ${backup.name}`)
      return backup.settings

    } catch (error) {
      console.error('❌ 从备份恢复失败:', error)
      this.triggerErrorCallbacks(error as Error)
      return null
    }
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backups = await this.getBackups()
      const filteredBackups = backups.filter(b => b.id !== backupId)

      if (filteredBackups.length === backups.length) {
        throw new Error(`Backup mit ID ${backupId} nicht gefunden`)
      }

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(filteredBackups))
      console.log(`🗑️ 备份已删除: ${backupId}`)
      return true

    } catch (error) {
      console.error('❌ 删除备份失败:', error)
      return false
    }
  }

  /**
   * 导出所有数据
   */
  async exportAllData(): Promise<string> {
    try {
      const settings = await this.loadTaxSettings()
      const backups = await this.getBackups()
      const syncStatus = this.getSyncStatus()

      const exportData = {
        version: this.CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        settings,
        backups,
        syncStatus,
        metadata: {
          deviceId: this.getDeviceId(),
          browserInfo: this.getBrowserInfo(),
          storageQuota: this.storageQuota,
          usedStorage: this.usedStorage
        }
      }

      return JSON.stringify(exportData, null, 2)

    } catch (error) {
      console.error('❌ 导出数据失败:', error)
      throw error
    }
  }

  /**
   * 导入所有数据
   */
  async importAllData(jsonData: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonData)

      // 验证导入数据格式
      if (!importData.version || !importData.settings) {
        throw new Error('Ungültiges Datenformat')
      }

      // 版本兼容性检查
      const migrationResult = await this.migrateIfNeeded({
        settings: importData.settings,
        metadata: {
          version: importData.version,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: new Date(),
          deviceId: this.getDeviceId(),
          browserInfo: this.getBrowserInfo(),
          backupCount: 0
        },
        checksum: this.calculateChecksum(importData.settings)
      })

      // 创建当前数据的备份
      const currentSettings = await this.loadTaxSettings()
      await this.createBackup(currentSettings, 'Vor Import')

      // 导入设置
      await this.saveTaxSettings(migrationResult.settings, 'Importiert')

      // 导入备份（如果存在）
      if (importData.backups && Array.isArray(importData.backups)) {
        const existingBackups = await this.getBackups()
        const importedBackups = importData.backups.map((backup: any) => ({
          ...backup,
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(backup.createdAt)
        }))

        const allBackups = [...existingBackups, ...importedBackups]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, this.MAX_BACKUPS)

        localStorage.setItem(this.BACKUP_KEY, JSON.stringify(allBackups))
      }

      console.log('📥 数据导入成功')
      return true

    } catch (error) {
      console.error('❌ 导入数据失败:', error)
      this.triggerErrorCallbacks(error as Error)
      return false
    }
  }

  /**
   * 清除所有数据
   */
  async clearAllData(): Promise<boolean> {
    try {
      // 创建最后的备份
      const currentSettings = await this.loadTaxSettings()
      await this.createBackup(currentSettings, 'Vor Löschung aller Daten')

      // 清除主要数据
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.SYNC_KEY)
      localStorage.removeItem(this.VERSION_KEY)

      console.log('🗑️ 所有税收设置数据已清除')
      return true

    } catch (error) {
      console.error('❌ 清除数据失败:', error)
      return false
    }
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats(): {
    quota: number
    used: number
    available: number
    usagePercentage: number
    backupCount: number
  } {
    return {
      quota: this.storageQuota,
      used: this.usedStorage,
      available: this.storageQuota - this.usedStorage,
      usagePercentage: this.storageQuota > 0 ? (this.usedStorage / this.storageQuota) * 100 : 0,
      backupCount: this.getBackupCount()
    }
  }

  /**
   * 数据迁移
   */
  private async migrateIfNeeded(storageData: StorageData): Promise<{ migrated: boolean; settings: TaxSettings }> {
    const dataVersion = storageData.metadata.version

    if (dataVersion === this.CURRENT_VERSION) {
      return { migrated: false, settings: storageData.settings }
    }

    console.log(`🔄 迁移数据从版本 ${dataVersion} 到 ${this.CURRENT_VERSION}`)

    let migratedSettings = { ...storageData.settings }

    // 版本特定的迁移逻辑
    if (this.compareVersions(dataVersion, '2.0.0') < 0) {
      migratedSettings = this.migrateToV2(migratedSettings)
    }

    return { migrated: true, settings: migratedSettings }
  }

  /**
   * 迁移到版本2.0.0
   */
  private migrateToV2(settings: any): TaxSettings {
    // 添加新的字段和默认值
    const migratedSettings = {
      ...DEFAULT_TAX_SETTINGS,
      ...settings
    }

    // 确保所有必需的字段都存在
    if (!migratedSettings.metadata) {
      migratedSettings.metadata = {
        version: this.CURRENT_VERSION,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsed: new Date()
      }
    }

    return migratedSettings
  }

  /**
   * 版本比较
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part < v2Part) return -1
      if (v1Part > v2Part) return 1
    }

    return 0
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(settings: TaxSettings): string {
    const settingsString = JSON.stringify(settings, Object.keys(settings).sort())
    let hash = 0
    for (let i = 0; i < settingsString.length; i++) {
      const char = settingsString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString(16)
  }

  /**
   * 验证存储数据
   */
  private validateStorageData(data: StorageData): boolean {
    if (!data.settings || !data.metadata || !data.checksum) {
      return false
    }

    const calculatedChecksum = this.calculateChecksum(data.settings)
    return calculatedChecksum === data.checksum
  }

  /**
   * 获取设备ID
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device-id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('device-id', deviceId)
    }
    return deviceId
  }

  /**
   * 获取浏览器信息
   */
  private getBrowserInfo(): string {
    return `${navigator.userAgent.split(' ')[0]} ${navigator.language}`
  }

  /**
   * 检查存储配额
   */
  private async checkStorageQuota(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        this.storageQuota = estimate.quota || 0
        this.usedStorage = estimate.usage || 0
      } catch (error) {
        console.warn('无法获取存储配额信息:', error)
      }
    }
  }

  /**
   * 检查存储空间
   */
  private async checkStorageSpace(requiredSpace: number): Promise<boolean> {
    await this.checkStorageQuota()
    const availableSpace = this.storageQuota - this.usedStorage
    return availableSpace > requiredSpace * 1.1 // 预留10%缓冲
  }

  /**
   * 数据压缩相关方法
   */
  private shouldCompress(data: StorageData): boolean {
    return JSON.stringify(data).length > this.COMPRESSION_THRESHOLD
  }

  private compressData(data: StorageData): string {
    // 简单的压缩实现（实际项目中可以使用更好的压缩算法）
    const jsonString = JSON.stringify(data)
    return `COMPRESSED:${btoa(jsonString)}`
  }

  private isCompressed(data: string): boolean {
    return data.startsWith('COMPRESSED:')
  }

  private decompressData(compressedData: string): StorageData {
    const base64Data = compressedData.replace('COMPRESSED:', '')
    const jsonString = atob(base64Data)
    return JSON.parse(jsonString)
  }

  /**
   * 辅助方法
   */
  private async getBackupCount(): Promise<number> {
    const backups = await this.getBackups()
    return backups.length
  }

  private getBackupCount(): number {
    try {
      const rawData = localStorage.getItem(this.BACKUP_KEY)
      if (!rawData) return 0
      const backups = JSON.parse(rawData)
      return Array.isArray(backups) ? backups.length : 0
    } catch {
      return 0
    }
  }

  private async restoreFromLatestBackup(): Promise<TaxSettings | null> {
    try {
      const backups = await this.getBackups()
      if (backups.length === 0) return null

      const latestBackup = backups[0]
      return latestBackup.settings
    } catch {
      return null
    }
  }

  private getSyncStatus(): SyncStatus {
    try {
      const rawData = localStorage.getItem(this.SYNC_KEY)
      if (!rawData) {
        return {
          lastSync: null,
          syncEnabled: false,
          conflicts: [],
          pendingChanges: false
        }
      }

      const syncData = JSON.parse(rawData)
      return {
        ...syncData,
        lastSync: syncData.lastSync ? new Date(syncData.lastSync) : null
      }
    } catch {
      return {
        lastSync: null,
        syncEnabled: false,
        conflicts: [],
        pendingChanges: false
      }
    }
  }

  private initializeStorage(): void {
    // 检查localStorage可用性
    if (typeof Storage === 'undefined') {
      throw new Error('LocalStorage ist nicht verfügbar')
    }

    // 初始化版本信息
    this.updateVersionInfo()
  }

  private updateVersionInfo(): void {
    const versionInfo: StorageVersion = {
      version: this.CURRENT_VERSION,
      timestamp: new Date(),
      description: 'Aktuelle Version',
      migrationRequired: false
    }

    localStorage.setItem(this.VERSION_KEY, JSON.stringify(versionInfo))
  }

  /**
   * 事件回调管理
   */
  onDataChange(key: string, callback: (data: StorageData) => void): void {
    this.changeCallbacks.set(key, callback)
  }

  offDataChange(key: string): void {
    this.changeCallbacks.delete(key)
  }

  onError(key: string, callback: (error: Error) => void): void {
    this.errorCallbacks.set(key, callback)
  }

  offError(key: string): void {
    this.errorCallbacks.delete(key)
  }

  private triggerChangeCallbacks(data: StorageData): void {
    this.changeCallbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('数据变更回调执行失败:', error)
      }
    })
  }

  private triggerErrorCallbacks(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error)
      } catch (callbackError) {
        console.error('错误回调执行失败:', callbackError)
      }
    })
  }
}

// 导出单例实例
export const taxStorageService = TaxStorageService.getInstance()
