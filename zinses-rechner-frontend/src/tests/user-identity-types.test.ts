/**
 * 用户身份数据模型类型测试
 * 验证类型定义、常量和工具函数
 */

import { describe, it, expect } from 'vitest'
import {
  isAnonymousUser,
  isRegisteredUser,
  DSGVO_CONSTANTS,
  DEFAULT_USER_PREFERENCES,
  DEFAULT_CONSENT_SETTINGS,
  DEFAULT_SYNC_SETTINGS,
  VALIDATION_ERROR_CODES,
  ERROR_MESSAGES_DE
} from '@/types/user-identity'

import type {
  AnonymousUser,
  RegisteredUser,
  UserPreferences,
  ConsentSettings,
  SyncSettings,
  ValidationResult,
  DataVersion
} from '@/types/user-identity'

describe('用户身份数据模型类型', () => {
  // 测试用户数据
  const testAnonymousUser: AnonymousUser = {
    id: 'test-anonymous-user',
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
    preferences: DEFAULT_USER_PREFERENCES,
    consentSettings: DEFAULT_CONSENT_SETTINGS
  }

  const testRegisteredUser: RegisteredUser = {
    ...testAnonymousUser,
    type: 'registered',
    email: 'test@example.de',
    emailVerified: true,
    registrationDate: new Date('2024-01-01'),
    syncEnabled: true,
    syncSettings: DEFAULT_SYNC_SETTINGS
  }

  describe('类型守卫函数', () => {
    it('应该正确识别匿名用户', () => {
      expect(isAnonymousUser(testAnonymousUser)).toBe(true)
      expect(isAnonymousUser(testRegisteredUser)).toBe(false)
    })

    it('应该正确识别注册用户', () => {
      expect(isRegisteredUser(testRegisteredUser)).toBe(true)
      expect(isRegisteredUser(testAnonymousUser)).toBe(false)
    })

    it('应该处理边界情况', () => {
      const invalidUser = { ...testAnonymousUser, type: 'invalid' as any }
      expect(isAnonymousUser(invalidUser)).toBe(false)
      expect(isRegisteredUser(invalidUser)).toBe(false)
    })
  })

  describe('DSGVO常量', () => {
    it('应该定义正确的数据保留期限', () => {
      expect(DSGVO_CONSTANTS.DEFAULT_RETENTION_DAYS).toBe(365)
      expect(DSGVO_CONSTANTS.MAX_RETENTION_DAYS).toBe(1095) // 3年
      expect(DSGVO_CONSTANTS.MIN_RETENTION_DAYS).toBe(30)
    })

    it('应该定义正确的版本信息', () => {
      expect(DSGVO_CONSTANTS.CURRENT_DATA_VERSION).toBe('1.0')
      expect(DSGVO_CONSTANTS.CONSENT_VERSION).toBe('1.0')
      expect(DSGVO_CONSTANTS.SUPPORTED_VERSIONS).toContain('1.0')
    })

    it('应该定义合理的限制值', () => {
      expect(DSGVO_CONSTANTS.MAX_DEVICE_FINGERPRINT_LENGTH).toBe(256)
      expect(DSGVO_CONSTANTS.MAX_EMAIL_LENGTH).toBe(254)
      expect(DSGVO_CONSTANTS.MAX_SYNC_DEVICES).toBe(5)
    })
  })

  describe('默认用户偏好设置', () => {
    it('应该包含所有必需字段', () => {
      expect(DEFAULT_USER_PREFERENCES.language).toBe('de')
      expect(DEFAULT_USER_PREFERENCES.currency).toBe('EUR')
      expect(DEFAULT_USER_PREFERENCES.theme).toBe('auto')
      expect(DEFAULT_USER_PREFERENCES.numberFormat).toBe('de-DE')
      expect(DEFAULT_USER_PREFERENCES.dateFormat).toBe('DD.MM.YYYY')
    })

    it('应该有合理的默认通知设置', () => {
      expect(DEFAULT_USER_PREFERENCES.notifications.browser).toBe(true)
      expect(DEFAULT_USER_PREFERENCES.notifications.email).toBe(false)
      expect(DEFAULT_USER_PREFERENCES.notifications.goalReminders).toBe(true)
      expect(DEFAULT_USER_PREFERENCES.notifications.dataCleanupReminders).toBe(true)
      expect(DEFAULT_USER_PREFERENCES.notifications.updateNotifications).toBe(true)
    })

    it('应该有保守的默认隐私设置', () => {
      expect(DEFAULT_USER_PREFERENCES.privacy.dataCollection).toBe('functional')
      expect(DEFAULT_USER_PREFERENCES.privacy.analytics).toBe(false)
      expect(DEFAULT_USER_PREFERENCES.privacy.performanceMonitoring).toBe(true)
      expect(DEFAULT_USER_PREFERENCES.privacy.errorReporting).toBe(true)
      expect(DEFAULT_USER_PREFERENCES.privacy.usageStatistics).toBe(false)
    })

    it('应该有合理的数据保留设置', () => {
      expect(DEFAULT_USER_PREFERENCES.autoSave).toBe(true)
      expect(DEFAULT_USER_PREFERENCES.dataRetentionDays).toBe(DSGVO_CONSTANTS.DEFAULT_RETENTION_DAYS)
    })
  })

  describe('默认同意设置', () => {
    it('应该包含所有必需的同意类型', () => {
      expect(DEFAULT_CONSENT_SETTINGS.functional).toBeDefined()
      expect(DEFAULT_CONSENT_SETTINGS.analytics).toBeDefined()
      expect(DEFAULT_CONSENT_SETTINGS.marketing).toBeDefined()
    })

    it('应该有正确的功能性同意设置', () => {
      const functional = DEFAULT_CONSENT_SETTINGS.functional
      expect(functional.status).toBe('granted')
      expect(functional.legalBasis).toBe('legitimate_interest')
      expect(functional.purposes).toContain('calculation_history')
      expect(functional.purposes).toContain('user_preferences')
    })

    it('应该默认拒绝分析和营销', () => {
      expect(DEFAULT_CONSENT_SETTINGS.analytics.status).toBe('denied')
      expect(DEFAULT_CONSENT_SETTINGS.marketing.status).toBe('denied')
    })

    it('应该有正确的版本和时间戳', () => {
      expect(DEFAULT_CONSENT_SETTINGS.version).toBe(DSGVO_CONSTANTS.CONSENT_VERSION)
      expect(DEFAULT_CONSENT_SETTINGS.consentDate).toBeInstanceOf(Date)
      expect(DEFAULT_CONSENT_SETTINGS.lastUpdated).toBeInstanceOf(Date)
    })
  })

  describe('默认同步设置', () => {
    it('应该默认禁用同步', () => {
      expect(DEFAULT_SYNC_SETTINGS.enabled).toBe(false)
      expect(DEFAULT_SYNC_SETTINGS.frequency).toBe('manual')
    })

    it('应该包含所有数据类型', () => {
      expect(DEFAULT_SYNC_SETTINGS.dataTypes.preferences).toBe(true)
      expect(DEFAULT_SYNC_SETTINGS.dataTypes.calculationHistory).toBe(true)
      expect(DEFAULT_SYNC_SETTINGS.dataTypes.goals).toBe(true)
      expect(DEFAULT_SYNC_SETTINGS.dataTypes.favorites).toBe(true)
    })

    it('应该有合理的冲突解决策略', () => {
      expect(DEFAULT_SYNC_SETTINGS.conflictResolution).toBe('latest_wins')
      expect(DEFAULT_SYNC_SETTINGS.maxDevices).toBe(DSGVO_CONSTANTS.MAX_SYNC_DEVICES)
    })
  })

  describe('验证错误代码', () => {
    it('应该定义所有必需的错误代码', () => {
      expect(VALIDATION_ERROR_CODES.INVALID_USER_ID).toBe('INVALID_USER_ID')
      expect(VALIDATION_ERROR_CODES.INVALID_EMAIL).toBe('INVALID_EMAIL')
      expect(VALIDATION_ERROR_CODES.INVALID_DEVICE_FINGERPRINT).toBe('INVALID_DEVICE_FINGERPRINT')
      expect(VALIDATION_ERROR_CODES.CONSENT_REQUIRED).toBe('CONSENT_REQUIRED')
    })

    it('应该包含数据迁移相关错误', () => {
      expect(VALIDATION_ERROR_CODES.MIGRATION_FAILED).toBe('MIGRATION_FAILED')
      expect(VALIDATION_ERROR_CODES.UNSUPPORTED_VERSION).toBe('UNSUPPORTED_VERSION')
      expect(VALIDATION_ERROR_CODES.DATA_CORRUPTION_DETECTED).toBe('DATA_CORRUPTION_DETECTED')
    })
  })

  describe('德语错误消息', () => {
    it('应该为所有错误代码提供德语消息', () => {
      Object.values(VALIDATION_ERROR_CODES).forEach(code => {
        expect(ERROR_MESSAGES_DE[code]).toBeDefined()
        expect(typeof ERROR_MESSAGES_DE[code]).toBe('string')
        expect(ERROR_MESSAGES_DE[code].length).toBeGreaterThan(0)
      })
    })

    it('应该包含正确的德语术语', () => {
      expect(ERROR_MESSAGES_DE[VALIDATION_ERROR_CODES.INVALID_EMAIL]).toContain('E-Mail')
      expect(ERROR_MESSAGES_DE[VALIDATION_ERROR_CODES.CONSENT_REQUIRED]).toContain('Einverständnis')
      expect(ERROR_MESSAGES_DE[VALIDATION_ERROR_CODES.MIGRATION_FAILED]).toContain('migration')
    })
  })

  describe('数据版本类型', () => {
    it('应该支持正确的版本格式', () => {
      // 只检查当前支持的版本
      expect(DSGVO_CONSTANTS.SUPPORTED_VERSIONS).toContain('1.0')
      expect(DSGVO_CONSTANTS.CURRENT_DATA_VERSION).toBe('1.0')
    })
  })

  describe('用户数据结构验证', () => {
    it('匿名用户应该包含所有必需字段', () => {
      expect(testAnonymousUser.id).toBeDefined()
      expect(testAnonymousUser.type).toBe('anonymous')
      expect(testAnonymousUser.createdAt).toBeInstanceOf(Date)
      expect(testAnonymousUser.lastActiveAt).toBeInstanceOf(Date)
      expect(testAnonymousUser.dataVersion).toBeDefined()
      expect(testAnonymousUser.deviceFingerprint).toBeDefined()
      expect(testAnonymousUser.deviceInfo).toBeDefined()
      expect(testAnonymousUser.preferences).toBeDefined()
      expect(testAnonymousUser.consentSettings).toBeDefined()
    })

    it('注册用户应该包含额外字段', () => {
      expect(testRegisteredUser.type).toBe('registered')
      expect(testRegisteredUser.email).toBeDefined()
      expect(testRegisteredUser.emailVerified).toBeDefined()
      expect(testRegisteredUser.registrationDate).toBeInstanceOf(Date)
      expect(testRegisteredUser.syncEnabled).toBeDefined()
      expect(testRegisteredUser.syncSettings).toBeDefined()
    })
  })

  describe('设备信息结构', () => {
    it('应该包含所有设备信息字段', () => {
      const deviceInfo = testAnonymousUser.deviceInfo
      expect(deviceInfo.type).toBeDefined()
      expect(deviceInfo.os).toBeDefined()
      expect(deviceInfo.browser).toBeDefined()
      expect(deviceInfo.screenSize).toBeDefined()
      expect(deviceInfo.timezone).toBeDefined()
      expect(deviceInfo.locale).toBeDefined()
    })

    it('应该使用有效的枚举值', () => {
      const deviceInfo = testAnonymousUser.deviceInfo
      expect(['desktop', 'tablet', 'mobile']).toContain(deviceInfo.type)
      expect(['windows', 'macos', 'linux', 'ios', 'android', 'other']).toContain(deviceInfo.os)
      expect(['chrome', 'firefox', 'safari', 'edge', 'other']).toContain(deviceInfo.browser)
      expect(['small', 'medium', 'large', 'xlarge']).toContain(deviceInfo.screenSize)
    })
  })

  describe('同意记录结构', () => {
    it('应该包含所有必需的同意字段', () => {
      const consent = DEFAULT_CONSENT_SETTINGS.functional
      expect(consent.status).toBeDefined()
      expect(consent.timestamp).toBeInstanceOf(Date)
      expect(consent.source).toBeDefined()
      expect(consent.legalBasis).toBeDefined()
      expect(consent.purposes).toBeInstanceOf(Array)
      expect(consent.retentionPeriod).toBeGreaterThan(0)
    })

    it('应该使用有效的同意状态', () => {
      const validStatuses = ['granted', 'denied', 'pending', 'withdrawn']
      Object.values(DEFAULT_CONSENT_SETTINGS).forEach(consent => {
        if (typeof consent === 'object' && 'status' in consent) {
          expect(validStatuses).toContain(consent.status)
        }
      })
    })

    it('应该使用有效的法律基础', () => {
      const validBases = ['consent', 'legitimate_interest', 'contract']
      Object.values(DEFAULT_CONSENT_SETTINGS).forEach(consent => {
        if (typeof consent === 'object' && 'legalBasis' in consent) {
          expect(validBases).toContain(consent.legalBasis)
        }
      })
    })
  })

  describe('同步设置结构', () => {
    it('应该包含所有同步配置', () => {
      expect(DEFAULT_SYNC_SETTINGS.enabled).toBeDefined()
      expect(DEFAULT_SYNC_SETTINGS.frequency).toBeDefined()
      expect(DEFAULT_SYNC_SETTINGS.dataTypes).toBeDefined()
      expect(DEFAULT_SYNC_SETTINGS.conflictResolution).toBeDefined()
      expect(DEFAULT_SYNC_SETTINGS.maxDevices).toBeDefined()
    })

    it('应该使用有效的同步频率', () => {
      const validFrequencies = ['manual', 'hourly', 'daily', 'weekly']
      expect(validFrequencies).toContain(DEFAULT_SYNC_SETTINGS.frequency)
    })

    it('应该使用有效的冲突解决策略', () => {
      const validStrategies = ['local_wins', 'remote_wins', 'latest_wins', 'manual']
      expect(validStrategies).toContain(DEFAULT_SYNC_SETTINGS.conflictResolution)
    })
  })

  describe('数据处理目的', () => {
    it('应该定义明确的处理目的', () => {
      const purposes = DEFAULT_CONSENT_SETTINGS.functional.purposes
      expect(purposes).toContain('calculation_history')
      expect(purposes).toContain('user_preferences')
    })

    it('分析同意应该包含正确目的', () => {
      const purposes = DEFAULT_CONSENT_SETTINGS.analytics.purposes
      expect(purposes).toContain('analytics')
    })
  })

  describe('时间戳和版本控制', () => {
    it('应该使用正确的时间戳格式', () => {
      expect(testAnonymousUser.createdAt).toBeInstanceOf(Date)
      expect(testAnonymousUser.lastActiveAt).toBeInstanceOf(Date)
      expect(testRegisteredUser.registrationDate).toBeInstanceOf(Date)
    })

    it('应该使用正确的数据版本', () => {
      expect(testAnonymousUser.dataVersion).toBe('1.0')
      expect(DSGVO_CONSTANTS.SUPPORTED_VERSIONS).toContain(testAnonymousUser.dataVersion)
    })
  })
})
