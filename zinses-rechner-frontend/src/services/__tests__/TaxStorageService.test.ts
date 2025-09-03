/**
 * TaxStorageService单元测试
 * 测试税收设置存储管理服务的所有功能，包括数据持久化、版本控制、数据迁移、备份恢复等
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TaxStorageService, StorageData, BackupData, StorageMetadata } from '../TaxStorageService'
import { TaxSettings, DEFAULT_TAX_SETTINGS, GermanState, ChurchTaxType } from '@/types/GermanTaxTypes'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock navigator.storage
const mockStorageEstimate = vi.fn().mockResolvedValue({
  quota: 10 * 1024 * 1024, // 10MB
  usage: 1 * 1024 * 1024   // 1MB
})
Object.defineProperty(navigator, 'storage', {
  value: { estimate: mockStorageEstimate }
})

// Mock console方法
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock crypto for checksum calculation
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
})

describe('TaxStorageService', () => {
  let service: TaxStorageService
  let defaultSettings: TaxSettings

  beforeEach(() => {
    // 清除所有mock调用记录
    vi.clearAllMocks()
    
    // 重置localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    mockLocalStorage.removeItem.mockImplementation(() => {})
    
    // 深拷贝默认设置
    defaultSettings = JSON.parse(JSON.stringify(DEFAULT_TAX_SETTINGS))
    
    // 重置单例实例
    ;(TaxStorageService as any).instance = null
    
    // 创建新的服务实例
    service = TaxStorageService.getInstance()
  })

  afterEach(() => {
    // 清理
    ;(TaxStorageService as any).instance = null
  })

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = TaxStorageService.getInstance()
      const instance2 = TaxStorageService.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('应该在初始化时记录日志', () => {
      expect(mockConsoleLog).toHaveBeenCalledWith('💾 税收设置存储服务已初始化')
    })

    it('应该在初始化时检查存储配额', () => {
      expect(mockStorageEstimate).toHaveBeenCalled()
    })
  })

  describe('数据保存', () => {
    it('应该成功保存税收设置', async () => {
      const result = await service.saveTaxSettings(defaultSettings)
      
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tax-settings-v2',
        expect.any(String)
      )
      expect(mockConsoleLog).toHaveBeenCalledWith('💾 税收设置已保存')
    })

    it('应该在保存时创建正确的存储数据结构', async () => {
      await service.saveTaxSettings(defaultSettings)
      
      const saveCall = mockLocalStorage.setItem.mock.calls[0]
      const savedData = JSON.parse(saveCall[1])
      
      expect(savedData.settings).toEqual(defaultSettings)
      expect(savedData.metadata).toBeDefined()
      expect(savedData.metadata.version).toBe('2.0.0')
      expect(savedData.metadata.createdAt).toBeDefined()
      expect(savedData.metadata.deviceId).toBeDefined()
      expect(savedData.checksum).toBeDefined()
    })

    it('应该在保存时创建自动备份', async () => {
      await service.saveTaxSettings(defaultSettings, '测试保存')
      
      // 验证备份被创建
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tax-settings-backups',
        expect.any(String)
      )
    })

    it('应该处理存储空间不足的情况', async () => {
      // Mock存储空间不足
      mockStorageEstimate.mockResolvedValueOnce({
        quota: 1000,
        usage: 999
      })
      
      const result = await service.saveTaxSettings(defaultSettings)
      
      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ 保存税收设置失败:',
        expect.any(Error)
      )
    })

    it('应该压缩大数据', async () => {
      // 创建大的设置对象
      const largeSettings = {
        ...defaultSettings,
        freistellungsauftrag: {
          ...defaultSettings.freistellungsauftrag,
          allocations: Array(100).fill(0).map((_, i) => ({
            id: `allocation-${i}`,
            bankName: `Bank ${i}`,
            allocatedAmount: 100,
            usedAmount: 50,
            remainingAmount: 50,
            createdAt: new Date(),
            updatedAt: new Date()
          }))
        }
      }

      await service.saveTaxSettings(largeSettings)
      
      // 验证数据被保存（可能被压缩）
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('数据加载', () => {
    it('应该成功加载保存的税收设置', async () => {
      const storageData: StorageData = {
        settings: defaultSettings,
        metadata: {
          version: '2.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: new Date(),
          deviceId: 'test-device',
          browserInfo: 'test-browser',
          backupCount: 0
        },
        checksum: 'test-checksum'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storageData))
      
      const loadedSettings = await service.loadTaxSettings()
      
      expect(loadedSettings).toEqual(defaultSettings)
      expect(mockConsoleLog).toHaveBeenCalledWith('📂 税收设置已从存储加载')
    })

    it('应该在没有保存数据时返回默认设置', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const loadedSettings = await service.loadTaxSettings()
      
      expect(loadedSettings).toEqual(DEFAULT_TAX_SETTINGS)
      expect(mockConsoleLog).toHaveBeenCalledWith('📂 未找到保存的设置，使用默认设置')
    })

    it('应该处理损坏的存储数据', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')
      
      const loadedSettings = await service.loadTaxSettings()
      
      expect(loadedSettings).toEqual(DEFAULT_TAX_SETTINGS)
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ 加载税收设置失败:',
        expect.any(Error)
      )
    })

    it('应该验证数据完整性', async () => {
      const corruptedData = {
        settings: defaultSettings,
        metadata: {
          version: '2.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: new Date(),
          deviceId: 'test-device',
          browserInfo: 'test-browser',
          backupCount: 0
        },
        checksum: 'wrong-checksum'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(corruptedData))
      
      const loadedSettings = await service.loadTaxSettings()
      
      expect(loadedSettings).toEqual(DEFAULT_TAX_SETTINGS)
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ 加载税收设置失败:',
        expect.objectContaining({ message: expect.stringContaining('beschädigt') })
      )
    })

    it('应该解压缩压缩的数据', async () => {
      // Mock压缩数据标识
      const compressedData = 'COMPRESSED:' + JSON.stringify({
        settings: defaultSettings,
        metadata: {
          version: '2.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: new Date(),
          deviceId: 'test-device',
          browserInfo: 'test-browser',
          backupCount: 0
        },
        checksum: 'test-checksum'
      })
      
      mockLocalStorage.getItem.mockReturnValue(compressedData)
      
      const loadedSettings = await service.loadTaxSettings()
      
      expect(loadedSettings).toEqual(defaultSettings)
    })
  })

  describe('版本控制和数据迁移', () => {
    it('应该检测需要迁移的旧版本数据', async () => {
      const oldVersionData = {
        settings: defaultSettings,
        metadata: {
          version: '1.0.0', // 旧版本
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: new Date(),
          deviceId: 'test-device',
          browserInfo: 'test-browser',
          backupCount: 0
        },
        checksum: 'test-checksum'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldVersionData))
      
      const loadedSettings = await service.loadTaxSettings()
      
      // 应该触发迁移并保存新版本
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tax-settings-v2',
        expect.any(String)
      )
    })

    it('应该获取版本历史', () => {
      const versionHistory = service.getVersionHistory()
      
      expect(versionHistory).toBeInstanceOf(Array)
      expect(versionHistory.length).toBeGreaterThan(0)
      expect(versionHistory[0].version).toBeDefined()
      expect(versionHistory[0].description).toBeDefined()
    })

    it('应该检查版本兼容性', () => {
      const isCompatible = service.isVersionCompatible('2.0.0')
      expect(isCompatible).toBe(true)
      
      const isIncompatible = service.isVersionCompatible('999.0.0')
      expect(isIncompatible).toBe(false)
    })
  })

  describe('备份管理', () => {
    it('应该创建备份', async () => {
      const result = await service.createBackup(defaultSettings, '手动备份')
      
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tax-settings-backups',
        expect.any(String)
      )
    })

    it('应该获取备份列表', async () => {
      // 先创建一个备份
      await service.createBackup(defaultSettings, '测试备份')
      
      const backups = await service.getBackups()
      
      expect(backups).toBeInstanceOf(Array)
      expect(backups.length).toBeGreaterThan(0)
      expect(backups[0].name).toBe('测试备份')
    })

    it('应该从备份恢复设置', async () => {
      // 先创建一个备份
      await service.createBackup(defaultSettings, '测试备份')
      const backups = await service.getBackups()
      
      const result = await service.restoreFromBackup(backups[0].id)
      
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tax-settings-v2',
        expect.any(String)
      )
    })

    it('应该删除指定备份', async () => {
      // 先创建一个备份
      await service.createBackup(defaultSettings, '测试备份')
      const backups = await service.getBackups()
      
      const result = await service.deleteBackup(backups[0].id)
      
      expect(result).toBe(true)
    })

    it('应该限制备份数量', async () => {
      // 创建超过最大数量的备份
      for (let i = 0; i < 15; i++) {
        await service.createBackup(defaultSettings, `备份 ${i}`)
      }
      
      const backups = await service.getBackups()
      
      expect(backups.length).toBeLessThanOrEqual(10) // 最大备份数量
    })

    it('应该清理所有备份', async () => {
      // 先创建几个备份
      await service.createBackup(defaultSettings, '备份1')
      await service.createBackup(defaultSettings, '备份2')
      
      const result = await service.clearAllBackups()
      
      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tax-settings-backups')
    })
  })

  describe('存储统计', () => {
    it('应该获取存储使用统计', async () => {
      const stats = await service.getStorageStats()
      
      expect(stats).toBeDefined()
      expect(stats.totalQuota).toBeGreaterThan(0)
      expect(stats.usedSpace).toBeGreaterThanOrEqual(0)
      expect(stats.availableSpace).toBeGreaterThan(0)
      expect(stats.usagePercentage).toBeGreaterThanOrEqual(0)
      expect(stats.usagePercentage).toBeLessThanOrEqual(100)
    })

    it('应该计算各组件的存储使用', async () => {
      const stats = await service.getStorageStats()
      
      expect(stats.componentSizes).toBeDefined()
      expect(stats.componentSizes.settings).toBeGreaterThanOrEqual(0)
      expect(stats.componentSizes.backups).toBeGreaterThanOrEqual(0)
      expect(stats.componentSizes.metadata).toBeGreaterThanOrEqual(0)
    })
  })

  describe('回调机制', () => {
    it('应该注册和触发数据变更回调', async () => {
      const callback = vi.fn()
      service.onDataChange('test', callback)
      
      await service.saveTaxSettings(defaultSettings)
      
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        settings: defaultSettings
      }))
    })

    it('应该注册和触发错误回调', async () => {
      const callback = vi.fn()
      service.onError('test', callback)
      
      // 模拟存储错误
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('存储失败')
      })
      
      await service.saveTaxSettings(defaultSettings)
      
      expect(callback).toHaveBeenCalledWith(expect.any(Error))
    })

    it('应该移除回调', async () => {
      const callback = vi.fn()
      service.onDataChange('test', callback)
      service.offDataChange('test')
      
      await service.saveTaxSettings(defaultSettings)
      
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('数据清理', () => {
    it('应该清除所有存储数据', async () => {
      const result = await service.clearAllData()
      
      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tax-settings-v2')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tax-settings-backups')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tax-settings-sync')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tax-settings-version')
    })

    it('应该清理过期数据', async () => {
      const result = await service.cleanupExpiredData()
      
      expect(result).toBe(true)
      // 验证清理逻辑被执行
    })
  })

  describe('错误处理', () => {
    it('应该处理localStorage不可用的情况', () => {
      // 临时禁用localStorage
      Object.defineProperty(window, 'localStorage', { value: undefined })
      
      expect(() => {
        ;(TaxStorageService as any).instance = null
        TaxStorageService.getInstance()
      }).toThrow('LocalStorage ist nicht verfügbar')
      
      // 恢复localStorage
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })
    })

    it('应该处理存储配额检查失败', async () => {
      mockStorageEstimate.mockRejectedValue(new Error('配额检查失败'))
      
      // 重新创建实例以触发配额检查
      ;(TaxStorageService as any).instance = null
      service = TaxStorageService.getInstance()
      
      // 应该不抛出错误，使用默认值
      expect(service).toBeDefined()
    })

    it('应该处理备份不存在的情况', async () => {
      const result = await service.restoreFromBackup('non-existent-backup')
      
      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ 从备份恢复失败:',
        expect.any(Error)
      )
    })
  })
})
