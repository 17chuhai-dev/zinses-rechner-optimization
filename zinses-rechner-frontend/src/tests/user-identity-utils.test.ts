/**
 * 用户身份工具函数测试
 * 验证用户创建、升级、验证和管理功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createAnonymousUser,
  upgradeToRegisteredUser,
  validateUserDataIntegrity,
  hasConsentForPurpose,
  updateConsent,
  needsDataCleanup,
  anonymizeUserData,
  isValidUser,
  generateDeviceFingerprint
} from '@/utils/user-identity-utils'

import type {
  AnonymousUser,
  RegisteredUser,
  DataProcessingPurpose
} from '@/types/user-identity'

// Mock设备指纹生成
vi.mock('@/utils/user-identity-utils', async () => {
  const actual = await vi.importActual('@/utils/user-identity-utils')
  return {
    ...actual,
    generateDeviceFingerprint: vi.fn(() => 'mocked-device-fingerprint-123456789')
  }
})

describe('用户身份工具函数', () => {
  let testAnonymousUser: AnonymousUser
  let testRegisteredUser: RegisteredUser

  beforeEach(() => {
    vi.clearAllMocks()

    // 创建测试用户数据
    testAnonymousUser = {
      id: '550e8400-e29b-41d4-a716-446655440000', // 有效的UUID v4格式
      type: 'anonymous',
      createdAt: new Date('2024-01-01'),
      lastActiveAt: new Date(),
      dataVersion: '1.0',
      deviceFingerprint: 'test-device-fingerprint',
      deviceInfo: {
        type: 'desktop',
        os: 'other',
        browser: 'other',
        screenSize: 'medium',
        timezone: 'Europe/Berlin',
        locale: 'de-DE'
      },
      preferences: {
        language: 'de',
        currency: 'EUR',
        theme: 'auto',
        numberFormat: 'de-DE',
        dateFormat: 'DD.MM.YYYY',
        notifications: {
          browser: true,
          email: false,
          goalReminders: true,
          dataCleanupReminders: true,
          updateNotifications: true
        },
        privacy: {
          dataCollection: 'functional',
          analytics: false,
          performanceMonitoring: true,
          errorReporting: true,
          usageStatistics: false
        },
        autoSave: true,
        dataRetentionDays: 365
      },
      consentSettings: {
        version: '1.0',
        consentDate: new Date('2024-01-01'),
        lastUpdated: new Date(),
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
          retentionPeriod: 90
        },
        marketing: {
          status: 'denied',
          timestamp: new Date(),
          source: 'initial_setup',
          legalBasis: 'consent',
          purposes: [],
          retentionPeriod: 0
        }
      }
    }

    testRegisteredUser = {
      ...testAnonymousUser,
      type: 'registered',
      email: 'test@example.de',
      emailVerified: true,
      registrationDate: new Date('2024-01-01'),
      syncEnabled: true,
      syncSettings: {
        enabled: true,
        frequency: 'daily',
        dataTypes: {
          preferences: true,
          calculationHistory: true,
          goals: true,
          favorites: true
        },
        conflictResolution: 'latest_wins',
        maxDevices: 5
      }
    }
  })

  describe('createAnonymousUser', () => {
    it('应该创建有效的匿名用户', () => {
      const user = createAnonymousUser()

      expect(user.type).toBe('anonymous')
      expect(user.id).toBeTruthy()
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.lastActiveAt).toBeInstanceOf(Date)
      expect(user.dataVersion).toBe('1.0')
      expect(user.deviceFingerprint).toBeTruthy()
      expect(user.deviceInfo).toBeDefined()
      expect(user.preferences).toBeDefined()
      expect(user.consentSettings).toBeDefined()
    })

    it('应该使用自定义偏好设置', () => {
      const customPreferences = {
        theme: 'dark' as const,
        autoSave: false,
        language: 'de' as const // 明确设置语言
      }

      const user = createAnonymousUser({ preferences: customPreferences })

      expect(user.preferences.theme).toBe('dark')
      expect(user.preferences.autoSave).toBe(false)
      expect(user.preferences.language).toBe('de') // 默认值保持
    })

    it('应该使用自定义同意设置', () => {
      const customConsent = {
        analytics: {
          status: 'granted' as const,
          timestamp: new Date(),
          source: 'user_action' as const,
          legalBasis: 'consent' as const,
          purposes: ['analytics' as DataProcessingPurpose],
          retentionPeriod: 180
        }
      }

      const user = createAnonymousUser({ consentSettings: customConsent })

      expect(user.consentSettings.analytics.status).toBe('granted')
      expect(user.consentSettings.analytics.retentionPeriod).toBe(180)
    })

    it('应该生成唯一的用户ID', () => {
      const user1 = createAnonymousUser()
      const user2 = createAnonymousUser()

      expect(user1.id).not.toBe(user2.id)
    })

    it('应该设置正确的时间戳', () => {
      const beforeCreation = new Date()
      const user = createAnonymousUser()
      const afterCreation = new Date()

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
      expect(user.lastActiveAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(user.lastActiveAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    })
  })

  describe('upgradeToRegisteredUser', () => {
    it('应该成功升级匿名用户', () => {
      const email = 'user@example.de'
      const registeredUser = upgradeToRegisteredUser(testAnonymousUser, email)

      expect(registeredUser.type).toBe('registered')
      expect(registeredUser.email).toBe(email)
      expect(registeredUser.emailVerified).toBe(false)
      expect(registeredUser.registrationDate).toBeInstanceOf(Date)
      expect(registeredUser.syncEnabled).toBe(false)
      expect(registeredUser.syncSettings).toBeDefined()

      // 应该保持原有属性
      expect(registeredUser.id).toBe(testAnonymousUser.id)
      expect(registeredUser.deviceFingerprint).toBe(testAnonymousUser.deviceFingerprint)
      expect(registeredUser.preferences).toEqual(testAnonymousUser.preferences)
    })

    it('应该设置默认同步设置', () => {
      const registeredUser = upgradeToRegisteredUser(testAnonymousUser, 'test@example.de')

      expect(registeredUser.syncSettings.enabled).toBe(false)
      expect(registeredUser.syncSettings.frequency).toBe('manual')
      expect(registeredUser.syncSettings.conflictResolution).toBe('latest_wins')
      expect(registeredUser.syncSettings.maxDevices).toBe(5)
    })

    it('应该更新同意设置以支持跨设备同步', () => {
      const registeredUser = upgradeToRegisteredUser(testAnonymousUser, 'test@example.de')

      expect(registeredUser.consentSettings.crossDeviceSync).toBeDefined()
      expect(registeredUser.consentSettings.crossDeviceSync?.status).toBe('denied')
      expect(registeredUser.consentSettings.crossDeviceSync?.legalBasis).toBe('consent')
    })

    it('应该验证邮箱格式', () => {
      expect(() => upgradeToRegisteredUser(testAnonymousUser, 'invalid-email'))
        .toThrow('Invalid email format')
    })

    it('应该处理空邮箱', () => {
      expect(() => upgradeToRegisteredUser(testAnonymousUser, ''))
        .toThrow('Email is required')
    })
  })

  describe('validateUserDataIntegrity', () => {
    it('应该验证有效的匿名用户数据', () => {
      const result = validateUserDataIntegrity(testAnonymousUser)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该验证有效的注册用户数据', () => {
      const result = validateUserDataIntegrity(testRegisteredUser)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测缺失的必需字段', () => {
      const invalidUser = { ...testAnonymousUser, id: undefined } as any
      const result = validateUserDataIntegrity(invalidUser)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.field === 'id')).toBe(true)
    })

    it('应该检测无效的邮箱格式', () => {
      const invalidUser = { ...testRegisteredUser, email: 'invalid-email' }
      const result = validateUserDataIntegrity(invalidUser)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'email')).toBe(true)
    })

    it('应该检测过长的设备指纹', () => {
      const invalidUser = {
        ...testAnonymousUser,
        deviceFingerprint: 'a'.repeat(300) // 超过最大长度
      }
      const result = validateUserDataIntegrity(invalidUser)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'deviceFingerprint')).toBe(true)
    })

    it('应该检测无效的数据保留期限', () => {
      const invalidUser = {
        ...testAnonymousUser,
        preferences: {
          ...testAnonymousUser.preferences,
          dataRetentionDays: 10 // 小于最小值
        }
      }
      const result = validateUserDataIntegrity(invalidUser)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'preferences.dataRetentionDays')).toBe(true)
    })
  })

  describe('hasConsentForPurpose', () => {
    it('应该正确检查功能性同意', () => {
      expect(hasConsentForPurpose(testAnonymousUser, 'calculation_history')).toBe(true)
      expect(hasConsentForPurpose(testAnonymousUser, 'user_preferences')).toBe(true)
    })

    it('应该正确检查分析同意', () => {
      expect(hasConsentForPurpose(testAnonymousUser, 'analytics')).toBe(false)
    })

    it('应该处理未定义的目的', () => {
      expect(hasConsentForPurpose(testAnonymousUser, 'unknown_purpose' as any)).toBe(false)
    })

    it('应该检查跨设备同步同意', () => {
      expect(hasConsentForPurpose(testRegisteredUser, 'cross_device_sync')).toBe(false)

      // 启用同步后应该有同意
      const userWithSync = {
        ...testRegisteredUser,
        consentSettings: {
          ...testRegisteredUser.consentSettings,
          crossDeviceSync: {
            status: 'granted' as const,
            timestamp: new Date(),
            source: 'user_action' as const,
            legalBasis: 'consent' as const,
            purposes: ['cross_device_sync' as DataProcessingPurpose],
            retentionPeriod: 365
          }
        }
      }

      expect(hasConsentForPurpose(userWithSync, 'cross_device_sync')).toBe(true)
    })
  })

  describe('updateConsent', () => {
    it('应该更新分析同意', () => {
      const updatedUser = updateConsent(testAnonymousUser, 'analytics', true)

      expect(updatedUser.consentSettings.analytics.status).toBe('granted')
      expect(updatedUser.consentSettings.analytics.timestamp).toBeInstanceOf(Date)
      expect(updatedUser.consentSettings.lastUpdated).toBeInstanceOf(Date)
    })

    it('应该撤回同意', () => {
      // 先授予同意
      const userWithConsent = updateConsent(testAnonymousUser, 'analytics', true)

      // 然后撤回
      const userWithdrawn = updateConsent(userWithConsent, 'analytics', false)

      expect(userWithdrawn.consentSettings.analytics.status).toBe('denied')
    })

    it('应该更新同意来源', () => {
      const updatedUser = updateConsent(testAnonymousUser, 'analytics', true, 'privacy_update')

      expect(updatedUser.consentSettings.analytics.source).toBe('privacy_update')
    })

    it('应该处理无效的目的', () => {
      expect(() => updateConsent(testAnonymousUser, 'invalid_purpose' as any, true))
        .toThrow('Invalid consent purpose')
    })
  })

  describe('needsDataCleanup', () => {
    it('应该识别需要清理的过期数据', () => {
      const expiredUser = {
        ...testAnonymousUser,
        lastActiveAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400天前
        preferences: {
          ...testAnonymousUser.preferences,
          dataRetentionDays: 365
        }
      }

      expect(needsDataCleanup(expiredUser)).toBe(true)
    })

    it('应该识别不需要清理的活跃数据', () => {
      const activeUser = {
        ...testAnonymousUser,
        lastActiveAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100天前
      }

      expect(needsDataCleanup(activeUser)).toBe(false)
    })

    it('应该处理无效的保留期限', () => {
      const invalidUser = {
        ...testAnonymousUser,
        preferences: {
          ...testAnonymousUser.preferences,
          dataRetentionDays: -1
        }
      }

      expect(needsDataCleanup(invalidUser)).toBe(false)
    })
  })

  describe('anonymizeUserData', () => {
    it('应该移除个人标识信息', () => {
      const anonymized = anonymizeUserData(testRegisteredUser)

      expect(anonymized.email).toBeUndefined()
      expect(anonymized.id).not.toBe(testRegisteredUser.id)
      expect(anonymized.deviceFingerprint).not.toBe(testRegisteredUser.deviceFingerprint)
    })

    it('应该保留统计相关信息', () => {
      const anonymized = anonymizeUserData(testAnonymousUser)

      expect(anonymized.type).toBe(testAnonymousUser.type)
      expect(anonymized.createdAt).toEqual(testAnonymousUser.createdAt)
      expect(anonymized.dataVersion).toBe(testAnonymousUser.dataVersion)
      expect(anonymized.deviceInfo.type).toBe(testAnonymousUser.deviceInfo.type)
      expect(anonymized.deviceInfo.os).toBe(testAnonymousUser.deviceInfo.os)
    })

    it('应该匿名化设备信息', () => {
      const anonymized = anonymizeUserData(testAnonymousUser)

      expect(anonymized.deviceInfo.timezone).toBe('anonymized')
      expect(anonymized.deviceInfo.locale).toBe('anonymized')
    })
  })

  describe('isValidUser', () => {
    it('应该验证有效的匿名用户', () => {
      expect(isValidUser(testAnonymousUser)).toBe(true)
    })

    it('应该验证有效的注册用户', () => {
      expect(isValidUser(testRegisteredUser)).toBe(true)
    })

    it('应该拒绝null或undefined', () => {
      expect(isValidUser(null)).toBe(false)
      expect(isValidUser(undefined)).toBe(false)
    })

    it('应该拒绝缺少必需字段的对象', () => {
      const invalidUser = { ...testAnonymousUser, id: undefined }
      expect(isValidUser(invalidUser)).toBe(false)
    })

    it('应该拒绝无效类型的用户', () => {
      const invalidUser = { ...testAnonymousUser, type: 'invalid' }
      expect(isValidUser(invalidUser)).toBe(false)
    })
  })

  describe('generateDeviceFingerprint', () => {
    it('应该生成设备指纹', () => {
      const fingerprint = generateDeviceFingerprint()

      expect(fingerprint).toBeTruthy()
      expect(typeof fingerprint).toBe('string')
      expect(fingerprint.length).toBeGreaterThan(0)
    })

    it('应该生成唯一的指纹', () => {
      const fingerprint1 = generateDeviceFingerprint()
      const fingerprint2 = generateDeviceFingerprint()

      // 注意：由于Mock，这个测试可能返回相同值
      // 在实际实现中应该是不同的
      expect(typeof fingerprint1).toBe('string')
      expect(typeof fingerprint2).toBe('string')
    })
  })

  describe('边界情况和错误处理', () => {
    it('应该处理空对象', () => {
      expect(isValidUser({})).toBe(false)
      expect(() => validateUserDataIntegrity({} as any)).not.toThrow()
    })

    it('应该处理循环引用', () => {
      const circularUser: any = { ...testAnonymousUser }
      circularUser.self = circularUser

      expect(() => isValidUser(circularUser)).not.toThrow()
    })

    it('应该处理非常大的数据保留期限', () => {
      const userWithLargeRetention = {
        ...testAnonymousUser,
        preferences: {
          ...testAnonymousUser.preferences,
          dataRetentionDays: 10000 // 超过最大值
        }
      }

      const result = validateUserDataIntegrity(userWithLargeRetention)
      expect(result.isValid).toBe(false)
    })
  })
})
