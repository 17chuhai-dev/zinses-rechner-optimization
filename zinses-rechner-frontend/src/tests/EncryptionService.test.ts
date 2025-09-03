/**
 * 加密服务测试
 * 验证AES-256-GCM加密功能和设备指纹集成
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EncryptionService, encryptionService } from '../services/EncryptionService'

// Mock设备指纹生成函数
vi.mock('../utils/user-identity-utils', () => ({
  generateDeviceFingerprint: vi.fn(() => 'test-device-fingerprint-123456789')
}))

// Mock Web Crypto API（如果在测试环境中不可用）
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    deriveKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn()
  },
  getRandomValues: vi.fn((array: Uint8Array) => {
    // 生成固定的测试数据以确保测试的可重复性
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256
    }
    return array
  })
}

// 设置全局crypto对象
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
})

describe('EncryptionService', () => {
  let service: EncryptionService

  beforeEach(async () => {
    // 重置所有mock
    vi.clearAllMocks()
    
    // 获取新的服务实例
    service = EncryptionService.getInstance()
    
    // Mock Web Crypto API方法
    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey)
    mockCrypto.subtle.deriveKey.mockResolvedValue({} as CryptoKey)
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32))
    mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('{"test":"data"}'))
  })

  describe('初始化', () => {
    it('应该成功初始化加密服务', async () => {
      await expect(service.initialize()).resolves.not.toThrow()
      
      const status = service.getStatus()
      expect(status.initialized).toBe(true)
      expect(status.hasDeviceFingerprint).toBe(true)
    })

    it('应该在Web Crypto API不可用时抛出错误', async () => {
      // 临时移除crypto对象
      const originalCrypto = global.crypto
      delete (global as any).crypto

      const newService = EncryptionService.getInstance()
      await expect(newService.initialize()).rejects.toThrow('Web Crypto API not supported')

      // 恢复crypto对象
      global.crypto = originalCrypto
    })
  })

  describe('数据加密', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该成功加密简单数据', async () => {
      const testData = { message: 'Hello, World!', number: 42 }
      
      const encrypted = await service.encrypt(testData)
      
      expect(encrypted).toHaveProperty('data')
      expect(encrypted).toHaveProperty('iv')
      expect(encrypted).toHaveProperty('salt')
      expect(encrypted).toHaveProperty('version')
      expect(encrypted).toHaveProperty('timestamp')
      expect(encrypted.version).toBe('1.0')
      expect(typeof encrypted.data).toBe('string')
      expect(typeof encrypted.iv).toBe('string')
      expect(typeof encrypted.salt).toBe('string')
    })

    it('应该为每次加密生成不同的IV和盐值', async () => {
      const testData = { message: 'test' }
      
      const encrypted1 = await service.encrypt(testData)
      const encrypted2 = await service.encrypt(testData)
      
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
      expect(encrypted1.salt).not.toBe(encrypted2.salt)
    })

    it('应该处理复杂的数据结构', async () => {
      const complexData = {
        user: {
          id: 'user-123',
          preferences: {
            theme: 'dark',
            language: 'de',
            notifications: true
          }
        },
        calculations: [
          { type: 'compound', result: 15000.50 },
          { type: 'loan', result: 250000 }
        ],
        metadata: {
          created: new Date().toISOString(),
          version: '1.0'
        }
      }
      
      const encrypted = await service.encrypt(complexData)
      expect(encrypted).toHaveProperty('data')
      expect(encrypted.version).toBe('1.0')
    })
  })

  describe('数据解密', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该成功解密数据', async () => {
      const testData = { message: 'Hello, World!', number: 42 }
      
      const encrypted = await service.encrypt(testData)
      const decrypted = await service.decrypt(encrypted)
      
      expect(decrypted).toEqual(testData)
    })

    it('应该在解密失败时抛出错误', async () => {
      const invalidEncryptedData = {
        data: 'invalid-base64-data',
        iv: 'invalid-iv',
        salt: 'invalid-salt',
        version: '1.0',
        timestamp: Date.now()
      }
      
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'))
      
      await expect(service.decrypt(invalidEncryptedData)).rejects.toThrow('Failed to decrypt data')
    })
  })

  describe('数据完整性验证', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该验证有效数据的完整性', async () => {
      const testData = { message: 'test' }
      const encrypted = await service.encrypt(testData)
      
      const isValid = await service.verifyIntegrity(encrypted)
      expect(isValid).toBe(true)
    })

    it('应该检测损坏的数据', async () => {
      const corruptedData = {
        data: 'corrupted-data',
        iv: 'corrupted-iv',
        salt: 'corrupted-salt',
        version: '1.0',
        timestamp: Date.now()
      }
      
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'))
      
      const isValid = await service.verifyIntegrity(corruptedData)
      expect(isValid).toBe(false)
    })
  })

  describe('密钥管理', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该缓存派生的密钥', async () => {
      const testData1 = { message: 'test1' }
      const testData2 = { message: 'test2' }
      
      await service.encrypt(testData1)
      await service.encrypt(testData2)
      
      const status = service.getStatus()
      expect(status.cachedKeysCount).toBeGreaterThan(0)
    })

    it('应该清理密钥缓存', async () => {
      const testData = { message: 'test' }
      await service.encrypt(testData)
      
      service.clearKeyCache()
      
      const status = service.getStatus()
      expect(status.cachedKeysCount).toBe(0)
    })

    it('应该限制缓存的密钥数量', async () => {
      // 创建超过缓存限制的加密操作
      for (let i = 0; i < 15; i++) {
        await service.encrypt({ message: `test${i}` })
      }
      
      const status = service.getStatus()
      expect(status.cachedKeysCount).toBeLessThanOrEqual(10)
    })
  })

  describe('服务状态', () => {
    it('应该返回正确的服务状态', async () => {
      await service.initialize()
      
      const status = service.getStatus()
      
      expect(status).toHaveProperty('initialized')
      expect(status).toHaveProperty('hasDeviceFingerprint')
      expect(status).toHaveProperty('cachedKeysCount')
      expect(status).toHaveProperty('supportedAlgorithms')
      expect(status.supportedAlgorithms).toContain('AES-GCM')
    })
  })

  describe('错误处理', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该处理加密过程中的错误', async () => {
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'))
      
      await expect(service.encrypt({ test: 'data' })).rejects.toThrow('Failed to encrypt data')
    })

    it('应该处理密钥派生错误', async () => {
      mockCrypto.subtle.deriveKey.mockRejectedValue(new Error('Key derivation failed'))
      
      await expect(service.encrypt({ test: 'data' })).rejects.toThrow('Failed to encrypt data')
    })
  })

  describe('边界条件', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该处理空数据', async () => {
      const emptyData = {}
      
      const encrypted = await service.encrypt(emptyData)
      const decrypted = await service.decrypt(encrypted)
      
      expect(decrypted).toEqual(emptyData)
    })

    it('应该处理null值', async () => {
      const nullData = { value: null }
      
      const encrypted = await service.encrypt(nullData)
      const decrypted = await service.decrypt(encrypted)
      
      expect(decrypted).toEqual(nullData)
    })

    it('应该处理大型数据对象', async () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: `Large data string for item ${i}`.repeat(10)
        }))
      }
      
      const encrypted = await service.encrypt(largeData)
      const decrypted = await service.decrypt(encrypted)
      
      expect(decrypted).toEqual(largeData)
    })
  })
})
