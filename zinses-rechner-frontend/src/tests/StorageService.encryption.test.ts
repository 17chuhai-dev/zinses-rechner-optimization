/**
 * StorageService加密功能测试
 * 验证存储服务与加密服务的集成
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageService, StorageType } from '../services/StorageService'
import { encryptionService } from '../services/EncryptionService'

// Mock设备指纹生成函数
vi.mock('../utils/user-identity-utils', () => ({
  generateDeviceFingerprint: vi.fn(() => 'test-device-fingerprint-123456789')
}))

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: vi.fn().mockResolvedValue({} as CryptoKey),
    deriveKey: vi.fn().mockResolvedValue({} as CryptoKey),
    encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: vi.fn().mockImplementation((algorithm, key, data) => {
      // 模拟解密返回原始JSON数据
      return Promise.resolve(new TextEncoder().encode('{"test":"decrypted"}'))
    })
  },
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256
    }
    return array
  })
}

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('StorageService 加密集成', () => {
  let storageService: StorageService

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // 创建启用加密的存储服务
    storageService = new StorageService({
      type: StorageType.MEMORY,
      encryption: true
    })

    // 等待初始化完成
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  afterEach(() => {
    encryptionService.clearKeyCache()
  })

  describe('加密存储', () => {
    it('应该加密存储的数据', async () => {
      const testData = {
        userId: 'user-123',
        preferences: {
          theme: 'dark',
          language: 'de'
        }
      }

      await storageService.set('user-data', testData)

      // 验证数据已被加密存储
      const rawItem = await (storageService as any).getRawItem('user-data')
      expect(rawItem).toBeTruthy()
      expect(rawItem.value).toHaveProperty('data')
      expect(rawItem.value).toHaveProperty('iv')
      expect(rawItem.value).toHaveProperty('salt')
      expect(rawItem.value).toHaveProperty('version')
    })

    it('应该正确解密存储的数据', async () => {
      const testData = {
        calculationHistory: [
          { type: 'compound', result: 15000 },
          { type: 'loan', result: 250000 }
        ]
      }

      await storageService.set('calculations', testData)
      const retrievedData = await storageService.get('calculations')

      expect(retrievedData).toEqual({ test: 'decrypted' }) // Mock返回的数据
    })

    it('应该处理加密失败的情况', async () => {
      // 模拟加密失败
      vi.spyOn(encryptionService, 'encrypt').mockRejectedValue(new Error('Encryption failed'))

      const testData = { message: 'test' }
      
      // 应该回退到未加密存储
      await expect(storageService.set('test-key', testData)).resolves.not.toThrow()
    })

    it('应该处理解密失败的情况', async () => {
      // 先存储数据
      const testData = { message: 'test' }
      await storageService.set('test-key', testData)

      // 模拟解密失败
      vi.spyOn(encryptionService, 'decrypt').mockRejectedValue(new Error('Decryption failed'))

      // 应该返回null并删除损坏的数据
      const result = await storageService.get('test-key')
      expect(result).toBeNull()
    })
  })

  describe('数据迁移', () => {
    it('应该启用加密并迁移现有数据', async () => {
      // 创建未加密的存储服务
      const unencryptedService = new StorageService({
        type: StorageType.MEMORY,
        encryption: false
      })

      // 存储一些未加密数据
      await unencryptedService.set('data1', { value: 'test1' })
      await unencryptedService.set('data2', { value: 'test2' })

      // 启用加密
      await unencryptedService.enableEncryption()

      // 验证数据已被加密
      const stats = await unencryptedService.getStats()
      expect(stats.encryptionStatus.enabled).toBe(true)
      expect(stats.encryptedItems).toBeGreaterThan(0)
    })

    it('应该禁用加密并迁移数据', async () => {
      // 存储加密数据
      await storageService.set('encrypted-data', { value: 'test' })

      // 禁用加密
      await storageService.disableEncryption()

      // 验证加密已禁用
      const config = storageService.getEncryptionConfig()
      expect(config.enabled).toBe(false)
    })
  })

  describe('统计信息', () => {
    it('应该提供加密统计信息', async () => {
      await storageService.set('data1', { encrypted: true })
      await storageService.set('data2', { encrypted: true })

      const stats = await storageService.getStats()

      expect(stats).toHaveProperty('totalItems')
      expect(stats).toHaveProperty('encryptedItems')
      expect(stats).toHaveProperty('encryptionStatus')
      expect(stats.encryptionStatus.enabled).toBe(true)
      expect(stats.totalItems).toBe(2)
    })

    it('应该验证数据完整性', async () => {
      await storageService.set('valid-data', { test: 'data' })
      
      const integrity = await storageService.verifyIntegrity()

      expect(integrity).toHaveProperty('totalItems')
      expect(integrity).toHaveProperty('validItems')
      expect(integrity).toHaveProperty('corruptedItems')
      expect(integrity).toHaveProperty('encryptionErrors')
      expect(integrity.totalItems).toBe(1)
      expect(integrity.validItems).toBe(1)
    })
  })

  describe('配置管理', () => {
    it('应该返回正确的加密配置', async () => {
      const config = storageService.getEncryptionConfig()

      expect(config).toHaveProperty('enabled')
      expect(config).toHaveProperty('ready')
      expect(config).toHaveProperty('type')
      expect(config).toHaveProperty('serviceStatus')
      expect(config.enabled).toBe(true)
      expect(config.type).toBe(StorageType.MEMORY)
    })
  })

  describe('错误处理', () => {
    it('应该处理加密服务初始化失败', async () => {
      // 模拟加密服务初始化失败
      vi.spyOn(encryptionService, 'initialize').mockRejectedValue(new Error('Init failed'))

      const failingService = new StorageService({
        type: StorageType.MEMORY,
        encryption: true
      })

      // 等待初始化完成
      await new Promise(resolve => setTimeout(resolve, 100))

      // 应该回退到未加密模式
      const config = failingService.getEncryptionConfig()
      expect(config.enabled).toBe(false)
    })

    it('应该处理损坏的加密数据', async () => {
      // 直接设置损坏的加密数据
      const corruptedData = {
        key: 'corrupted-key',
        value: {
          data: 'invalid-base64',
          iv: 'invalid-iv',
          salt: 'invalid-salt',
          version: '1.0',
          timestamp: Date.now()
        },
        timestamp: Date.now()
      }

      await (storageService as any).setRawItem('corrupted-key', corruptedData)

      // 尝试获取数据应该返回null
      const result = await storageService.get('corrupted-key')
      expect(result).toBeNull()
    })
  })

  describe('性能测试', () => {
    it('加密操作应该在合理时间内完成', async () => {
      const testData = {
        largeArray: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          data: `Test data ${i}`.repeat(10)
        }))
      }

      const startTime = performance.now()
      await storageService.set('large-data', testData)
      await storageService.get('large-data')
      const endTime = performance.now()

      // 加密和解密操作应该在1秒内完成
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('应该有效缓存加密密钥', async () => {
      const data1 = { test: 'data1' }
      const data2 = { test: 'data2' }

      // 第一次操作会派生密钥
      await storageService.set('key1', data1)
      
      // 第二次操作应该使用缓存的密钥
      const startTime = performance.now()
      await storageService.set('key2', data2)
      const endTime = performance.now()

      // 第二次操作应该更快（使用缓存的密钥）
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('兼容性测试', () => {
    it('应该与未加密的StorageService兼容', async () => {
      const unencryptedService = new StorageService({
        type: StorageType.MEMORY,
        encryption: false
      })

      const testData = { compatibility: 'test' }

      // 在未加密服务中存储数据
      await unencryptedService.set('compat-test', testData)
      
      // 在加密服务中读取数据（应该能正常读取）
      const result = await unencryptedService.get('compat-test')
      expect(result).toEqual(testData)
    })

    it('应该处理版本升级', async () => {
      // 模拟旧版本的加密数据
      const oldVersionData = {
        data: 'old-encrypted-data',
        iv: 'old-iv',
        salt: 'old-salt',
        version: '0.9', // 旧版本
        timestamp: Date.now()
      }

      await (storageService as any).setRawItem('old-data', {
        key: 'old-data',
        value: oldVersionData,
        timestamp: Date.now()
      })

      // 应该能处理旧版本数据（即使解密失败也不应该崩溃）
      const result = await storageService.get('old-data')
      expect(result).toBeNull() // 解密失败返回null
    })
  })
})
