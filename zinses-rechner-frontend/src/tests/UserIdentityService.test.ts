/**
 * 用户身份管理服务测试
 * 验证用户创建、升级、验证和数据管理功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UserIdentityService, userIdentityService } from '../services/UserIdentityService'
import type { AnonymousUser, RegisteredUser, DataProcessingPurpose } from '@/types/user-identity'

// Mock设备指纹生成函数
vi.mock('../utils/user-identity-utils', async () => {
  const actual = await vi.importActual('../utils/user-identity-utils')
  return {
    ...actual,
    generateDeviceFingerprint: vi.fn(() => 'test-device-fingerprint-123456789')
  }
})

// Mock加密服务
vi.mock('../services/EncryptionService', () => ({
  encryptionService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    encrypt: vi.fn().mockImplementation(async (data) => ({
      data: 'encrypted-data',
      iv: 'test-iv',
      salt: 'test-salt',
      version: '1.0',
      timestamp: Date.now()
    })),
    decrypt: vi.fn().mockImplementation(async (encryptedData) => ({
      test: 'decrypted-data'
    })),
    getStatus: vi.fn(() => ({
      initialized: true,
      hasDeviceFingerprint: true,
      cachedKeysCount: 0,
      supportedAlgorithms: ['AES-GCM']
    }))
  }
}))

// Mock存储服务
vi.mock('../services/StorageService', () => ({
  storageService: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    remove: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({
      totalItems: 0,
      totalSize: 0,
      encryptedItems: 0,
      oldestItem: undefined,
      newestItem: undefined,
      encryptionStatus: {
        enabled: true,
        ready: true,
        serviceStatus: {}
      }
    })
  }
}))

describe('UserIdentityService', () => {
  let service: UserIdentityService
  let testAnonymousUser: AnonymousUser
  let testRegisteredUser: RegisteredUser
  let mockStorageService: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // 获取Mock的存储服务
    const { storageService } = await import('../services/StorageService')
    mockStorageService = storageService

    // 获取服务实例
    service = UserIdentityService.getInstance()

    // 初始化服务
    await service.initialize()

    // 创建测试用户数据
    testAnonymousUser = {
      id: 'test-anonymous-user-id',
      type: 'anonymous',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      dataVersion: '1.0',
      deviceFingerprint: 'test-device-fingerprint-123456789',
      deviceInfo: {
        type: 'desktop',
        os: 'other',
        browser: 'other',
        screenSize: 'medium',
        timezone: 'Europe/Berlin',
        locale: 'de-DE'
      },
      preferences: {
        theme: 'light',
        language: 'de',
        currency: 'EUR',
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'de-DE',
        autoSave: true,
        dataRetentionDays: 365,
        privacy: {
          analytics: false,
          marketing: false,
          performanceMonitoring: false
        }
      },
      consentSettings: {
        functional: {
          status: 'granted',
          timestamp: new Date(),
          source: 'initial_setup',
          legalBasis: 'legitimate_interest',
          purposes: ['calculation_history', 'user_preferences'],
          retentionPeriod: 365
        },
        analytics: {
          status: 'denied',
          timestamp: new Date(),
          source: 'initial_setup',
          legalBasis: 'consent',
          purposes: ['analytics'],
          retentionPeriod: 365
        },
        marketing: {
          status: 'denied',
          timestamp: new Date(),
          source: 'initial_setup',
          legalBasis: 'consent',
          purposes: [],
          retentionPeriod: 365
        }
      }
    }

    testRegisteredUser = {
      ...testAnonymousUser,
      type: 'registered',
      email: 'test@example.de',
      emailVerified: false,
      registrationDate: new Date(),
      syncEnabled: false,
      syncSettings: {
        enabled: false,
        lastSync: undefined,
        syncedDevices: [],
        conflictResolution: 'manual',
        autoSync: false,
        syncFrequency: 'manual'
      }
    }
  })

  afterEach(() => {
    service.destroy()
  })

  describe('服务初始化', () => {
    it('应该成功初始化服务', async () => {
      const newService = UserIdentityService.getInstance()
      await expect(newService.initialize()).resolves.not.toThrow()
    })

    it('应该是单例模式', () => {
      const service1 = UserIdentityService.getInstance()
      const service2 = UserIdentityService.getInstance()
      expect(service1).toBe(service2)
    })
  })

  describe('匿名用户管理', () => {
    it('应该创建匿名用户', async () => {
      const user = await service.createAnonymousUser()

      expect(user).toBeDefined()
      expect(user.type).toBe('anonymous')
      expect(user.id).toBeTruthy()
      expect(user.deviceFingerprint).toBeTruthy()
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(mockStorageService.set).toHaveBeenCalled()
    })

    it('应该创建带自定义偏好的匿名用户', async () => {
      const customPreferences = {
        theme: 'dark' as const,
        language: 'de' as const
      }

      const user = await service.createAnonymousUser(customPreferences)

      expect(user.preferences.theme).toBe('dark')
      expect(user.preferences.language).toBe('de')
    })

    it('应该获取当前用户', async () => {
      const user = await service.createAnonymousUser()
      const currentUser = service.getCurrentUser()

      expect(currentUser).toBeDefined()
      expect(currentUser?.id).toBe(user.id)
    })
  })

  describe('用户升级', () => {
    it('应该将匿名用户升级为注册用户', async () => {
      const anonymousUser = await service.createAnonymousUser()
      const email = 'test@example.de'

      const registeredUser = await service.upgradeToRegistered(anonymousUser, email)

      expect(registeredUser.type).toBe('registered')
      expect(registeredUser.email).toBe(email)
      expect(registeredUser.emailVerified).toBe(false)
      expect(registeredUser.id).toBe(anonymousUser.id) // 保持相同ID
    })

    it('应该拒绝无效的邮箱格式', async () => {
      const anonymousUser = await service.createAnonymousUser()
      const invalidEmail = 'invalid-email'

      await expect(service.upgradeToRegistered(anonymousUser, invalidEmail))
        .rejects.toThrow('Invalid email')
    })
  })

  describe('用户数据管理', () => {
    it('应该更新用户数据', async () => {
      const user = await service.createAnonymousUser()
      const updates = {
        preferences: {
          ...user.preferences,
          theme: 'dark' as const
        }
      }

      const updatedUser = await service.updateUser(user.id, updates)

      expect(updatedUser.preferences.theme).toBe('dark')
      expect(mockStorageService.set).toHaveBeenCalledTimes(2) // 创建 + 更新
    })

    it('应该获取用户数据', async () => {
      const userId = 'test-user-id'
      mockStorageService.get.mockResolvedValueOnce(testAnonymousUser)

      const user = await service.getUser(userId)

      expect(user).toBeDefined()
      expect(mockStorageService.get).toHaveBeenCalledWith(`zr_user_${userId}`)
    })

    it('应该删除用户数据', async () => {
      const user = await service.createAnonymousUser()

      await service.deleteUser(user.id)

      expect(mockStorageService.remove).toHaveBeenCalledWith(`zr_user_${user.id}`)
      expect(service.getCurrentUser()).toBeNull()
    })
  })

  describe('同意管理', () => {
    it('应该更新用户同意设置', async () => {
      const user = await service.createAnonymousUser()
      mockStorageService.get.mockResolvedValueOnce(user)

      const purpose: DataProcessingPurpose = 'analytics'
      await service.updateConsent(user.id, purpose, true)

      expect(mockStorageService.set).toHaveBeenCalled()
    })

    it('应该检查同意状态', async () => {
      const user = await service.createAnonymousUser()

      const hasConsent = service.hasConsentForPurpose(user.id, 'calculation_history')

      // 基于测试数据，functional同意应该是granted
      expect(hasConsent).toBe(true)
    })
  })

  describe('邮箱验证', () => {
    it('应该发送邮箱验证', async () => {
      const registeredUser = await service.upgradeToRegistered(testAnonymousUser, 'test@example.de')
      mockStorageService.get.mockResolvedValueOnce(registeredUser)

      const result = await service.sendEmailVerification(registeredUser.id)

      expect(result.success).toBe(true)
      expect(result.token).toBeTruthy()
      expect(result.expiresAt).toBeInstanceOf(Date)
      expect(mockStorageService.set).toHaveBeenCalled()
    })

    it('应该验证邮箱令牌', async () => {
      const token = 'test-verification-token'
      const verificationData = {
        userId: testRegisteredUser.id,
        email: testRegisteredUser.email,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }

      mockStorageService.get
        .mockResolvedValueOnce(verificationData) // 验证数据
        .mockResolvedValueOnce(testRegisteredUser) // 用户数据

      const result = await service.verifyEmail(token)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(mockStorageService.remove).toHaveBeenCalledWith(`zr_email_verification_${token}`)
    })

    it('应该拒绝过期的验证令牌', async () => {
      const token = 'expired-token'
      const expiredVerificationData = {
        userId: testRegisteredUser.id,
        email: testRegisteredUser.email,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000) // 已过期
      }

      mockStorageService.get.mockResolvedValueOnce(expiredVerificationData)

      const result = await service.verifyEmail(token)

      expect(result.success).toBe(false)
      expect(result.error).toContain('expired')
    })
  })

  describe('会话管理', () => {
    it('应该创建用户会话', async () => {
      const user = await service.createAnonymousUser()
      mockStorageService.get.mockResolvedValueOnce(user)

      const session = await service.createSession(user.id)

      expect(session).toBeDefined()
      expect(session.userId).toBe(user.id)
      expect(session.deviceFingerprint).toBe(user.deviceFingerprint)
      expect(mockStorageService.set).toHaveBeenCalled()
    })

    it('应该验证有效会话', async () => {
      const userId = 'test-user-id'
      const validSession = {
        userId,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
        deviceFingerprint: 'test-fingerprint'
      }

      mockStorageService.get.mockResolvedValueOnce(validSession)

      const isValid = await service.validateSession(userId)

      expect(isValid).toBe(true)
      expect(mockStorageService.set).toHaveBeenCalled() // 更新会话
    })

    it('应该拒绝过期会话', async () => {
      const userId = 'test-user-id'
      const expiredSession = {
        userId,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() - 1000), // 已过期
        deviceFingerprint: 'test-fingerprint'
      }

      mockStorageService.get.mockResolvedValueOnce(expiredSession)

      const isValid = await service.validateSession(userId)

      expect(isValid).toBe(false)
      expect(mockStorageService.remove).toHaveBeenCalled()
    })

    it('应该销毁用户会话', async () => {
      const userId = 'test-user-id'

      await service.destroySession(userId)

      expect(mockStorageService.remove).toHaveBeenCalledWith(`zr_session_${userId}`)
    })
  })

  describe('服务统计', () => {
    it('应该获取服务统计信息', async () => {
      mockStorageService.keys.mockResolvedValueOnce([
        'zr_user_user1',
        'zr_user_user2',
        'other_key'
      ])

      mockStorageService.get
        .mockResolvedValueOnce(testAnonymousUser)
        .mockResolvedValueOnce(testRegisteredUser)

      const stats = await service.getServiceStats()

      expect(stats).toBeDefined()
      expect(stats.totalUsers).toBe(2)
      expect(stats.anonymousUsers).toBe(1)
      expect(stats.registeredUsers).toBe(1)
    })
  })

  describe('事件系统', () => {
    it('应该触发用户创建事件', async () => {
      const eventListener = vi.fn()
      service.addEventListener('user_created', eventListener)

      await service.createAnonymousUser()

      expect(eventListener).toHaveBeenCalledWith('user_created', expect.any(Object))
    })

    it('应该移除事件监听器', () => {
      const eventListener = vi.fn()
      service.addEventListener('user_created', eventListener)
      service.removeEventListener('user_created', eventListener)

      // 创建用户不应该触发事件
      service.createAnonymousUser()
      expect(eventListener).not.toHaveBeenCalled()
    })
  })

  describe('错误处理', () => {
    it('应该处理存储错误', async () => {
      mockStorageService.set.mockRejectedValueOnce(new Error('Storage error'))

      await expect(service.createAnonymousUser()).rejects.toThrow('Storage error')
    })

    it('应该处理用户不存在的情况', async () => {
      mockStorageService.get.mockResolvedValueOnce(null)

      const user = await service.getUser('non-existent-user')
      expect(user).toBeNull()
    })
  })
})
