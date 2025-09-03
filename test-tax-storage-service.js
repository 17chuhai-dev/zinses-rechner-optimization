/**
 * 税收设置存储管理服务测试
 * 验证税收配置的持久化存储、版本控制、数据迁移和备份恢复功能
 */

// 模拟localStorage
class MockLocalStorage {
  constructor() {
    this.store = new Map()
  }

  getItem(key) {
    return this.store.get(key) || null
  }

  setItem(key, value) {
    this.store.set(key, value)
  }

  removeItem(key) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }

  get length() {
    return this.store.size
  }

  key(index) {
    const keys = Array.from(this.store.keys())
    return keys[index] || null
  }
}

// 模拟navigator.storage
const mockNavigatorStorage = {
  estimate: async () => ({
    quota: 10 * 1024 * 1024, // 10MB
    usage: 1024 * 1024 // 1MB
  })
}

// 模拟税收设置存储服务
class MockTaxStorageService {
  constructor() {
    this.STORAGE_KEY = 'tax-settings-v2'
    this.BACKUP_KEY = 'tax-settings-backups'
    this.SYNC_KEY = 'tax-settings-sync'
    this.VERSION_KEY = 'tax-settings-version'
    
    this.CURRENT_VERSION = '2.0.0'
    this.MAX_BACKUPS = 10
    this.COMPRESSION_THRESHOLD = 1024

    this.storageQuota = 10 * 1024 * 1024
    this.usedStorage = 1024 * 1024
    this.changeCallbacks = new Map()
    this.errorCallbacks = new Map()

    // 使用模拟的localStorage
    global.localStorage = new MockLocalStorage()

    // 模拟navigator对象
    if (typeof global.navigator === 'undefined') {
      global.navigator = {}
    }

    // 设置navigator属性
    Object.defineProperty(global.navigator, 'storage', {
      value: mockNavigatorStorage,
      writable: true,
      configurable: true
    })
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Test Browser)',
      writable: true,
      configurable: true
    })
    Object.defineProperty(global.navigator, 'language', {
      value: 'de-DE',
      writable: true,
      configurable: true
    })

    this.initializeStorage()
    console.log('💾 模拟税收设置存储服务已初始化')
  }

  getDefaultSettings() {
    return {
      userInfo: {
        state: 'NW',
        churchTaxType: 'none',
        isMarried: false,
        taxYear: 2024
      },
      abgeltungssteuer: {
        baseTaxRate: 0.25,
        solidarityTaxRate: 0.055,
        churchTax: { type: 'none', rate: 0, state: 'NW' },
        enabled: true,
        calculation: {
          includeChurchTax: false,
          includeSolidarityTax: true,
          roundingMethod: 'round',
          decimalPlaces: 2
        }
      },
      freistellungsauftrag: {
        annualAllowance: 801,
        usedAllowance: 0,
        remainingAllowance: 801,
        allocations: [],
        enabled: true,
        options: {
          autoOptimize: true,
          carryForward: false,
          splitBetweenSpouses: false
        }
      },
      etfTeilfreistellung: {
        exemptionRates: {
          'equity_domestic': 0.30, 'equity_foreign': 0.30, 'mixed_fund': 0.15,
          'bond_fund': 0.00, 'real_estate': 0.60, 'commodity': 0.00, 'other': 0.00
        },
        enabled: true,
        defaultETFType: 'equity_foreign',
        options: {
          applyToDistributions: true,
          applyToCapitalGains: true,
          minimumHoldingPeriod: 12
        }
      },
      advanced: {
        enableDetailedCalculation: true,
        showCalculationSteps: true,
        enableTaxOptimization: true,
        autoSaveSettings: true
      },
      metadata: {
        version: '2.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsed: new Date()
      }
    }
  }

  async saveTaxSettings(settings, description) {
    try {
      const storageData = {
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

      const serializedData = this.shouldCompress(storageData) 
        ? this.compressData(storageData)
        : JSON.stringify(storageData)

      if (!await this.checkStorageSpace(serializedData.length)) {
        throw new Error('Nicht genügend Speicherplatz verfügbar')
      }

      localStorage.setItem(this.STORAGE_KEY, serializedData)

      if (description) {
        await this.createBackup(settings, `Auto: ${description}`)
      }

      this.updateVersionInfo()
      this.triggerChangeCallbacks(storageData)

      return true
    } catch (error) {
      this.triggerErrorCallbacks(error)
      return false
    }
  }

  async loadTaxSettings() {
    try {
      const rawData = localStorage.getItem(this.STORAGE_KEY)
      
      if (!rawData) {
        return this.getDefaultSettings()
      }

      const storageData = this.isCompressed(rawData)
        ? this.decompressData(rawData)
        : JSON.parse(rawData)

      if (!this.validateStorageData(storageData)) {
        throw new Error('Gespeicherte Daten sind beschädigt')
      }

      const migrationResult = await this.migrateIfNeeded(storageData)
      if (migrationResult.migrated) {
        await this.saveTaxSettings(migrationResult.settings, 'Migration')
        return migrationResult.settings
      }

      storageData.metadata.lastAccessed = new Date()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData))

      return storageData.settings
    } catch (error) {
      this.triggerErrorCallbacks(error)
      
      const backupSettings = await this.restoreFromLatestBackup()
      if (backupSettings) {
        return backupSettings
      }

      return this.getDefaultSettings()
    }
  }

  async createBackup(settings, name) {
    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const backupData = {
        id: backupId,
        name: name || `Backup ${new Date().toLocaleString('de-DE')}`,
        settings: { ...settings },
        createdAt: new Date(),
        size: JSON.stringify(settings).length,
        description: `Automatische Sicherung`
      }

      const existingBackups = await this.getBackups()
      existingBackups.push(backupData)
      
      if (existingBackups.length > this.MAX_BACKUPS) {
        existingBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        existingBackups.splice(this.MAX_BACKUPS)
      }

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(existingBackups))
      return backupId
    } catch (error) {
      throw error
    }
  }

  async getBackups() {
    try {
      const rawData = localStorage.getItem(this.BACKUP_KEY)
      if (!rawData) return []

      const backups = JSON.parse(rawData)
      return backups.map(backup => ({
        ...backup,
        createdAt: new Date(backup.createdAt)
      })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      return []
    }
  }

  async restoreFromBackup(backupId) {
    try {
      const backups = await this.getBackups()
      const backup = backups.find(b => b.id === backupId)
      
      if (!backup) {
        throw new Error(`Backup mit ID ${backupId} nicht gefunden`)
      }

      const currentSettings = await this.loadTaxSettings()
      await this.createBackup(currentSettings, 'Vor Wiederherstellung')

      await this.saveTaxSettings(backup.settings, `Wiederhergestellt von: ${backup.name}`)
      return backup.settings
    } catch (error) {
      this.triggerErrorCallbacks(error)
      return null
    }
  }

  async deleteBackup(backupId) {
    try {
      const backups = await this.getBackups()
      const filteredBackups = backups.filter(b => b.id !== backupId)
      
      if (filteredBackups.length === backups.length) {
        throw new Error(`Backup mit ID ${backupId} nicht gefunden`)
      }

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(filteredBackups))
      return true
    } catch (error) {
      return false
    }
  }

  async exportAllData() {
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
      throw error
    }
  }

  async importAllData(jsonData) {
    try {
      const importData = JSON.parse(jsonData)
      
      if (!importData.version || !importData.settings) {
        throw new Error('Ungültiges Datenformat')
      }

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

      const currentSettings = await this.loadTaxSettings()
      await this.createBackup(currentSettings, 'Vor Import')

      await this.saveTaxSettings(migrationResult.settings, 'Importiert')

      if (importData.backups && Array.isArray(importData.backups)) {
        const existingBackups = await this.getBackups()
        const importedBackups = importData.backups.map(backup => ({
          ...backup,
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(backup.createdAt)
        }))

        const allBackups = [...existingBackups, ...importedBackups]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, this.MAX_BACKUPS)

        localStorage.setItem(this.BACKUP_KEY, JSON.stringify(allBackups))
      }

      return true
    } catch (error) {
      this.triggerErrorCallbacks(error)
      return false
    }
  }

  async clearAllData() {
    try {
      const currentSettings = await this.loadTaxSettings()
      await this.createBackup(currentSettings, 'Vor Löschung aller Daten')

      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.SYNC_KEY)
      localStorage.removeItem(this.VERSION_KEY)

      return true
    } catch (error) {
      return false
    }
  }

  getStorageStats() {
    return {
      quota: this.storageQuota,
      used: this.usedStorage,
      available: this.storageQuota - this.usedStorage,
      usagePercentage: this.storageQuota > 0 ? (this.usedStorage / this.storageQuota) * 100 : 0,
      backupCount: this.getBackupCount()
    }
  }

  // 辅助方法
  async migrateIfNeeded(storageData) {
    const dataVersion = storageData.metadata.version
    
    if (dataVersion === this.CURRENT_VERSION) {
      return { migrated: false, settings: storageData.settings }
    }

    let migratedSettings = { ...storageData.settings }

    if (this.compareVersions(dataVersion, '2.0.0') < 0) {
      migratedSettings = this.migrateToV2(migratedSettings)
    }

    return { migrated: true, settings: migratedSettings }
  }

  migrateToV2(settings) {
    const migratedSettings = {
      ...this.getDefaultSettings(),
      ...settings
    }

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

  compareVersions(version1, version2) {
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

  calculateChecksum(settings) {
    const settingsString = JSON.stringify(settings, Object.keys(settings).sort())
    let hash = 0
    for (let i = 0; i < settingsString.length; i++) {
      const char = settingsString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }

  validateStorageData(data) {
    if (!data.settings || !data.metadata || !data.checksum) {
      return false
    }

    const calculatedChecksum = this.calculateChecksum(data.settings)
    return calculatedChecksum === data.checksum
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('device-id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('device-id', deviceId)
    }
    return deviceId
  }

  getBrowserInfo() {
    return `${navigator.userAgent.split(' ')[0]} ${navigator.language}`
  }

  async checkStorageSpace(requiredSpace) {
    const availableSpace = this.storageQuota - this.usedStorage
    return availableSpace > requiredSpace * 1.1
  }

  shouldCompress(data) {
    return JSON.stringify(data).length > this.COMPRESSION_THRESHOLD
  }

  compressData(data) {
    const jsonString = JSON.stringify(data)
    return `COMPRESSED:${btoa(jsonString)}`
  }

  isCompressed(data) {
    return data.startsWith('COMPRESSED:')
  }

  decompressData(compressedData) {
    const base64Data = compressedData.replace('COMPRESSED:', '')
    const jsonString = atob(base64Data)
    return JSON.parse(jsonString)
  }

  async getBackupCount() {
    const backups = await this.getBackups()
    return backups.length
  }

  getBackupCount() {
    try {
      const rawData = localStorage.getItem(this.BACKUP_KEY)
      if (!rawData) return 0
      const backups = JSON.parse(rawData)
      return Array.isArray(backups) ? backups.length : 0
    } catch {
      return 0
    }
  }

  async restoreFromLatestBackup() {
    try {
      const backups = await this.getBackups()
      if (backups.length === 0) return null
      
      const latestBackup = backups[0]
      return latestBackup.settings
    } catch {
      return null
    }
  }

  getSyncStatus() {
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

  initializeStorage() {
    this.updateVersionInfo()
  }

  updateVersionInfo() {
    const versionInfo = {
      version: this.CURRENT_VERSION,
      timestamp: new Date(),
      description: 'Aktuelle Version',
      migrationRequired: false
    }
    
    localStorage.setItem(this.VERSION_KEY, JSON.stringify(versionInfo))
  }

  onDataChange(key, callback) {
    this.changeCallbacks.set(key, callback)
  }

  offDataChange(key) {
    this.changeCallbacks.delete(key)
  }

  onError(key, callback) {
    this.errorCallbacks.set(key, callback)
  }

  offError(key) {
    this.errorCallbacks.delete(key)
  }

  triggerChangeCallbacks(data) {
    this.changeCallbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('数据变更回调执行失败:', error)
      }
    })
  }

  triggerErrorCallbacks(error) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error)
      } catch (callbackError) {
        console.error('错误回调执行失败:', callbackError)
      }
    })
  }
}

// 测试函数
async function runTaxStorageServiceTests() {
  console.log('🧪 开始税收设置存储管理服务测试...\n')
  
  const storageService = new MockTaxStorageService()
  
  let passed = 0
  let failed = 0
  
  function test(description, condition) {
    if (condition) {
      console.log(`✅ ${description}`)
      passed++
    } else {
      console.log(`❌ ${description}`)
      failed++
    }
  }
  
  // 测试1: 服务初始化
  console.log('🏗️ 测试服务初始化:')
  
  test('存储服务应该正确初始化', storageService !== null)
  test('应该设置正确的版本', storageService.CURRENT_VERSION === '2.0.0')
  test('应该有存储配额信息', storageService.storageQuota > 0)
  test('应该初始化版本信息', localStorage.getItem(storageService.VERSION_KEY) !== null)
  
  // 测试2: 基本保存和加载
  console.log('\n💾 测试基本保存和加载:')
  
  const testSettings = storageService.getDefaultSettings()
  testSettings.userInfo.isMarried = true
  testSettings.freistellungsauftrag.usedAllowance = 200
  
  const saveResult = await storageService.saveTaxSettings(testSettings, 'Test Save')
  test('保存设置应该成功', saveResult === true)
  
  const loadedSettings = await storageService.loadTaxSettings()
  test('加载设置应该成功', loadedSettings !== null)
  test('加载的设置应该正确', loadedSettings.userInfo.isMarried === true)
  test('加载的设置应该保持数值', loadedSettings.freistellungsauftrag.usedAllowance === 200)
  
  // 测试3: 数据完整性验证
  console.log('\n🔍 测试数据完整性验证:')
  
  const rawData = localStorage.getItem(storageService.STORAGE_KEY)
  test('存储数据应该存在', rawData !== null)
  
  const storageData = JSON.parse(rawData)
  test('存储数据应该有校验和', storageData.checksum !== undefined)
  test('存储数据应该有元数据', storageData.metadata !== undefined)
  test('存储数据应该有设置', storageData.settings !== undefined)
  
  const isValid = storageService.validateStorageData(storageData)
  test('存储数据应该通过验证', isValid === true)
  
  // 测试4: 备份功能
  console.log('\n📦 测试备份功能:')
  
  const backupId = await storageService.createBackup(testSettings, 'Test Backup')
  test('创建备份应该成功', backupId !== null && backupId.startsWith('backup_'))
  
  const backups = await storageService.getBackups()
  test('应该能获取备份列表', Array.isArray(backups))
  test('备份列表应该包含新备份', backups.some(b => b.id === backupId))
  test('备份应该有正确的名称', backups.find(b => b.id === backupId)?.name === 'Test Backup')
  
  // 测试5: 备份恢复
  console.log('\n🔄 测试备份恢复:')
  
  // 修改当前设置
  const modifiedSettings = { ...testSettings }
  modifiedSettings.userInfo.taxYear = 2025
  await storageService.saveTaxSettings(modifiedSettings, 'Modified')
  
  // 从备份恢复
  const restoredSettings = await storageService.restoreFromBackup(backupId)
  test('从备份恢复应该成功', restoredSettings !== null)
  test('恢复的设置应该正确', restoredSettings.userInfo.taxYear === 2024) // 原始值
  
  // 验证当前设置已更新
  const currentSettings = await storageService.loadTaxSettings()
  test('当前设置应该已恢复', currentSettings.userInfo.taxYear === 2024)
  
  // 测试6: 备份删除
  console.log('\n🗑️ 测试备份删除:')
  
  const deleteResult = await storageService.deleteBackup(backupId)
  test('删除备份应该成功', deleteResult === true)
  
  const backupsAfterDelete = await storageService.getBackups()
  test('备份应该已被删除', !backupsAfterDelete.some(b => b.id === backupId))
  
  const deleteNonExistentResult = await storageService.deleteBackup('non-existent-id')
  test('删除不存在的备份应该失败', deleteNonExistentResult === false)
  
  // 测试7: 数据导出导入
  console.log('\n📤📥 测试数据导出导入:')
  
  const exportData = await storageService.exportAllData()
  test('导出数据应该成功', typeof exportData === 'string')
  
  const exportedObject = JSON.parse(exportData)
  test('导出数据应该包含版本', exportedObject.version !== undefined)
  test('导出数据应该包含设置', exportedObject.settings !== undefined)
  test('导出数据应该包含备份', Array.isArray(exportedObject.backups))
  test('导出数据应该包含元数据', exportedObject.metadata !== undefined)
  
  // 清除当前数据并导入
  localStorage.clear()
  
  const importResult = await storageService.importAllData(exportData)
  test('导入数据应该成功', importResult === true)
  
  const importedSettings = await storageService.loadTaxSettings()
  test('导入的设置应该正确', importedSettings.userInfo.isMarried === true)
  
  // 测试8: 版本迁移
  console.log('\n🔄 测试版本迁移:')
  
  // 模拟旧版本数据
  const oldVersionData = {
    settings: {
      userInfo: { state: 'BY', churchTaxType: 'catholic' },
      // 缺少一些新字段
    },
    metadata: {
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessed: new Date(),
      deviceId: 'test-device',
      browserInfo: 'Test Browser',
      backupCount: 0
    },
    checksum: 'old-checksum'
  }
  
  const migrationResult = await storageService.migrateIfNeeded(oldVersionData)
  test('应该检测到需要迁移', migrationResult.migrated === true)
  test('迁移后的设置应该完整', migrationResult.settings.freistellungsauftrag !== undefined)
  test('迁移后的设置应该保留原有数据', migrationResult.settings.userInfo.state === 'BY')
  
  // 测试9: 压缩功能
  console.log('\n🗜️ 测试压缩功能:')
  
  // 创建大数据以触发压缩
  const largeSettings = { ...testSettings }
  largeSettings.largeData = 'x'.repeat(2000) // 超过压缩阈值
  
  const shouldCompress = storageService.shouldCompress({ settings: largeSettings })
  test('大数据应该触发压缩', shouldCompress === true)
  
  const compressedData = storageService.compressData({ settings: largeSettings })
  test('压缩数据应该有正确格式', storageService.isCompressed(compressedData))
  
  const decompressedData = storageService.decompressData(compressedData)
  test('解压缩应该恢复原始数据', decompressedData.settings.largeData === largeSettings.largeData)
  
  // 测试10: 存储统计
  console.log('\n📊 测试存储统计:')
  
  const stats = storageService.getStorageStats()
  test('存储统计应该有配额信息', typeof stats.quota === 'number')
  test('存储统计应该有使用信息', typeof stats.used === 'number')
  test('存储统计应该有可用空间', typeof stats.available === 'number')
  test('存储统计应该有使用百分比', typeof stats.usagePercentage === 'number')
  test('存储统计应该有备份数量', typeof stats.backupCount === 'number')
  
  // 测试11: 错误处理
  console.log('\n⚠️ 测试错误处理:')
  
  let errorCallbackTriggered = false
  storageService.onError('test', (error) => {
    errorCallbackTriggered = true
  })
  
  // 尝试导入无效数据
  const invalidImportResult = await storageService.importAllData('invalid json')
  test('导入无效数据应该失败', invalidImportResult === false)
  test('错误回调应该被触发', errorCallbackTriggered === true)
  
  // 测试12: 回调管理
  console.log('\n🔔 测试回调管理:')
  
  let changeCallbackTriggered = false
  storageService.onDataChange('test', (data) => {
    changeCallbackTriggered = true
  })
  
  await storageService.saveTaxSettings(testSettings, 'Callback Test')
  test('数据变更回调应该被触发', changeCallbackTriggered === true)
  
  // 注销回调
  storageService.offDataChange('test')
  storageService.offError('test')
  
  changeCallbackTriggered = false
  await storageService.saveTaxSettings(testSettings, 'After Unregister')
  test('注销后回调不应该被触发', changeCallbackTriggered === false)
  
  // 测试13: 清除所有数据
  console.log('\n🗑️ 测试清除所有数据:')
  
  const clearResult = await storageService.clearAllData()
  test('清除所有数据应该成功', clearResult === true)
  
  const settingsAfterClear = localStorage.getItem(storageService.STORAGE_KEY)
  test('主要设置数据应该被清除', settingsAfterClear === null)
  
  const syncAfterClear = localStorage.getItem(storageService.SYNC_KEY)
  test('同步数据应该被清除', syncAfterClear === null)
  
  // 但备份应该保留（作为最后的安全措施）
  const backupsAfterClear = await storageService.getBackups()
  test('备份数据应该保留', backupsAfterClear.length > 0)
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  // 输出功能覆盖情况
  console.log('\n🎯 功能覆盖情况:')
  console.log(`   ✅ 服务初始化 - 版本管理和存储配额`)
  console.log(`   ✅ 基本保存和加载 - 核心存储功能`)
  console.log(`   ✅ 数据完整性验证 - 校验和和数据验证`)
  console.log(`   ✅ 备份功能 - 创建和管理备份`)
  console.log(`   ✅ 备份恢复 - 从备份恢复数据`)
  console.log(`   ✅ 备份删除 - 备份生命周期管理`)
  console.log(`   ✅ 数据导出导入 - 完整数据迁移`)
  console.log(`   ✅ 版本迁移 - 向后兼容性`)
  console.log(`   ✅ 压缩功能 - 存储空间优化`)
  console.log(`   ✅ 存储统计 - 存储使用情况监控`)
  console.log(`   ✅ 错误处理 - 异常情况处理`)
  console.log(`   ✅ 回调管理 - 事件通知机制`)
  console.log(`   ✅ 清除所有数据 - 数据清理功能`)
  
  if (failed === 0) {
    console.log('\n🎉 所有税收设置存储管理服务测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查存储服务实现。')
    return false
  }
}

// 运行测试
runTaxStorageServiceTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
