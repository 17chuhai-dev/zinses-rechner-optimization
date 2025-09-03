/**
 * 用户数据验证器测试
 * 测试数据验证逻辑和业务约束的正确性
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { UserDataValidator } from '@/services/UserDataValidator'
import { createAnonymousUser, upgradeToRegisteredUser } from '@/utils/user-identity-utils'
import type { AnonymousUser, RegisteredUser } from '@/types/user-identity'
import { DSGVO_CONSTANTS, VALIDATION_ERROR_CODES } from '@/types/user-identity'

describe('UserDataValidator', () => {
  let validator: UserDataValidator
  let validAnonymousUser: AnonymousUser
  let validRegisteredUser: RegisteredUser

  beforeEach(() => {
    validator = new UserDataValidator()
    validAnonymousUser = createAnonymousUser()
    validRegisteredUser = upgradeToRegisteredUser(validAnonymousUser, 'test@example.de')
  })

  // ============================================================================
  // 基础验证测试
  // ============================================================================

  describe('validateUserId', () => {
    it('应该验证有效的UUID v4', () => {
      const result = validator.validateUserId('f47ac10b-58cc-4372-a567-0e02b2c3d479')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝无效的UUID格式', () => {
      const result = validator.validateUserId('invalid-uuid')
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.USER_ID_FORMAT_INVALID)
    })

    it('应该拒绝空的用户ID', () => {
      const result = validator.validateUserId('')
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.USER_ID_REQUIRED)
    })

    it('应该拒绝非UUID v4版本', () => {
      // UUID v1格式
      const result = validator.validateUserId('f47ac10b-58cc-1372-a567-0e02b2c3d479')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('应该验证有效的邮箱地址', () => {
      const validEmails = [
        'test@example.de',
        'user.name@domain.com',
        'test+tag@example.org',
        'user123@test-domain.net'
      ]

      validEmails.forEach(email => {
        const result = validator.validateEmail(email)
        expect(result.isValid).toBe(true)
      })
    })

    it('应该拒绝无效的邮箱格式', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user name@domain.com'
      ]

      invalidEmails.forEach(email => {
        const result = validator.validateEmail(email)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.INVALID_EMAIL)
      })
    })

    it('应该拒绝过长的邮箱地址', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      const result = validator.validateEmail(longEmail)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.EMAIL_TOO_LONG)
    })

    it('应该允许空邮箱（可选字段）', () => {
      const result = validator.validateEmail('')
      expect(result.isValid).toBe(true)
    })

    it('应该对非德国域名给出警告', () => {
      const result = validator.validateEmail('test@example.xyz')
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('UNCOMMON_EMAIL_DOMAIN')
    })
  })

  describe('validateDeviceFingerprint', () => {
    it('应该验证有效的设备指纹', () => {
      const result = validator.validateDeviceFingerprint('abc123def456')
      expect(result.isValid).toBe(true)
    })

    it('应该拒绝空的设备指纹', () => {
      const result = validator.validateDeviceFingerprint('')
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.INVALID_DEVICE_FINGERPRINT)
    })

    it('应该拒绝过长的设备指纹', () => {
      const longFingerprint = 'a'.repeat(DSGVO_CONSTANTS.MAX_DEVICE_FINGERPRINT_LENGTH + 1)
      const result = validator.validateDeviceFingerprint(longFingerprint)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.DEVICE_FINGERPRINT_TOO_LONG)
    })

    it('应该对特殊字符给出警告', () => {
      const result = validator.validateDeviceFingerprint('abc-123_def!')
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('UNUSUAL_FINGERPRINT_FORMAT')
    })
  })

  describe('validateDataRetention', () => {
    it('应该验证有效的数据保留期限', () => {
      const user = createAnonymousUser()
      user.preferences.dataRetentionDays = 365
      const result = validator.validateDataRetention(user)
      expect(result.isValid).toBe(true)
    })

    it('应该拒绝过短的保留期限', () => {
      const user = createAnonymousUser()
      user.preferences.dataRetentionDays = 10
      const result = validator.validateDataRetention(user)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.RETENTION_PERIOD_TOO_SHORT)
    })

    it('应该拒绝过长的保留期限', () => {
      const user = createAnonymousUser()
      user.preferences.dataRetentionDays = 2000
      const result = validator.validateDataRetention(user)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.RETENTION_PERIOD_TOO_LONG)
    })

    it('应该对过期数据给出警告', () => {
      const user = createAnonymousUser()
      user.createdAt = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000) // 400天前
      user.preferences.dataRetentionDays = 365
      const result = validator.validateDataRetention(user)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('DATA_RETENTION_EXCEEDED')
    })

    it('应该对即将过期的数据给出警告', () => {
      const user = createAnonymousUser()
      user.createdAt = new Date(Date.now() - 350 * 24 * 60 * 60 * 1000) // 350天前
      user.preferences.dataRetentionDays = 365
      const result = validator.validateDataRetention(user)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('DATA_RETENTION_EXPIRING_SOON')
    })
  })

  // ============================================================================
  // 完整用户验证测试
  // ============================================================================

  describe('validateAnonymousUser', () => {
    it('应该验证有效的匿名用户', () => {
      const result = validator.validateAnonymousUser(validAnonymousUser)
      expect(result.isValid).toBe(true)
    })

    it('应该拒绝错误的用户类型', () => {
      const invalidUser = { ...validAnonymousUser, type: 'registered' as const }
      const result = validator.validateAnonymousUser(invalidUser as AnonymousUser)
      expect(result.isValid).toBe(false)
    })

    it('应该验证设备信息完整性', () => {
      const userWithIncompleteDevice = {
        ...validAnonymousUser,
        deviceInfo: { type: 'desktop' } as any
      }
      const result = validator.validateAnonymousUser(userWithIncompleteDevice)
      expect(result.isValid).toBe(true) // 不完整的设备信息只是警告
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('validateRegisteredUser', () => {
    it('应该验证有效的注册用户', () => {
      const result = validator.validateRegisteredUser(validRegisteredUser)
      expect(result.isValid).toBe(true)
    })

    it('应该拒绝错误的用户类型', () => {
      const invalidUser = { ...validRegisteredUser, type: 'anonymous' as const }
      const result = validator.validateRegisteredUser(invalidUser as RegisteredUser)
      expect(result.isValid).toBe(false)
    })

    it('应该验证注册时间逻辑', () => {
      const userWithInvalidRegDate = {
        ...validRegisteredUser,
        registrationDate: new Date(validRegisteredUser.createdAt.getTime() - 1000)
      }
      const result = validator.validateRegisteredUser(userWithInvalidRegDate)
      expect(result.isValid).toBe(false)
    })

    it('应该验证同步设置一致性', () => {
      const userWithInconsistentSync = {
        ...validRegisteredUser,
        syncEnabled: true,
        syncSettings: undefined as any
      }
      const result = validator.validateRegisteredUser(userWithInconsistentSync)
      expect(result.isValid).toBe(false)
    })

    it('应该要求跨设备同步的同意', () => {
      const userWithoutSyncConsent = {
        ...validRegisteredUser,
        syncEnabled: true,
        consentSettings: {
          ...validRegisteredUser.consentSettings,
          crossDeviceSync: undefined
        }
      }
      const result = validator.validateRegisteredUser(userWithoutSyncConsent)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_ERROR_CODES.CONSENT_REQUIRED)).toBe(true)
    })
  })

  // ============================================================================
  // 业务规则验证测试
  // ============================================================================

  describe('validateBusinessRules', () => {
    it('应该验证DSGVO合规性', () => {
      const result = validator.validateBusinessRules(validAnonymousUser)
      expect(result.isValid).toBe(true)
    })

    it('应该检测数据一致性问题', () => {
      const inconsistentUser = {
        ...validAnonymousUser,
        lastActiveAt: new Date(validAnonymousUser.createdAt.getTime() - 1000)
      }
      const result = validator.validateBusinessRules(inconsistentUser)
      expect(result.isValid).toBe(false)
    })

    it('应该检测安全问题', () => {
      const insecureUser = {
        ...validAnonymousUser,
        deviceFingerprint: 'weak'
      }
      const result = validator.validateBusinessRules(insecureUser)
      expect(result.isValid).toBe(true) // 弱指纹只是警告
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // 性能测试
  // ============================================================================

  describe('性能测试', () => {
    it('单个用户验证应该在10ms内完成', () => {
      const startTime = performance.now()
      validator.validateAnonymousUser(validAnonymousUser)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(10)
    })

    it('批量验证100个用户应该在100ms内完成', () => {
      const users = Array.from({ length: 100 }, () => createAnonymousUser())

      const startTime = performance.now()
      validator.validateBatch(users)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
    })

    it('快速验证应该比完整验证快或相当', () => {
      const user = validRegisteredUser

      // 完整验证（多次运行取平均值以提高准确性）
      let fullDurationTotal = 0
      const iterations = 10

      for (let i = 0; i < iterations; i++) {
        const fullStartTime = performance.now()
        validator.validateRegisteredUser(user)
        const fullEndTime = performance.now()
        fullDurationTotal += (fullEndTime - fullStartTime)
      }
      const avgFullDuration = fullDurationTotal / iterations

      // 快速验证（多次运行取平均值）
      let quickDurationTotal = 0
      for (let i = 0; i < iterations; i++) {
        const quickStartTime = performance.now()
        validator.validateQuick(user)
        const quickEndTime = performance.now()
        quickDurationTotal += (quickEndTime - quickStartTime)
      }
      const avgQuickDuration = quickDurationTotal / iterations

      // 快速验证应该不超过完整验证时间的2倍（考虑到测试环境的不稳定性）
      expect(avgQuickDuration).toBeLessThan(avgFullDuration * 2)
    })
  })

  // ============================================================================
  // 边界条件测试
  // ============================================================================

  describe('边界条件测试', () => {
    it('应该处理最小保留期限', () => {
      const user = createAnonymousUser()
      user.preferences.dataRetentionDays = DSGVO_CONSTANTS.MIN_RETENTION_DAYS
      const result = validator.validateDataRetention(user)
      expect(result.isValid).toBe(true)
    })

    it('应该处理最大保留期限', () => {
      const user = createAnonymousUser()
      user.preferences.dataRetentionDays = DSGVO_CONSTANTS.MAX_RETENTION_DAYS
      const result = validator.validateDataRetention(user)
      expect(result.isValid).toBe(true)
    })

    it('应该处理最大邮箱长度', () => {
      const maxLengthEmail = 'a'.repeat(DSGVO_CONSTANTS.MAX_EMAIL_LENGTH - 11) + '@test.de'
      const result = validator.validateEmail(maxLengthEmail)
      expect(result.isValid).toBe(true)
    })

    it('应该处理最大设备指纹长度', () => {
      const maxLengthFingerprint = 'a'.repeat(DSGVO_CONSTANTS.MAX_DEVICE_FINGERPRINT_LENGTH)
      const result = validator.validateDeviceFingerprint(maxLengthFingerprint)
      expect(result.isValid).toBe(true)
    })

    it('应该处理最大同步设备数', () => {
      const user = upgradeToRegisteredUser(validAnonymousUser, 'test@example.de')
      user.syncSettings.maxDevices = DSGVO_CONSTANTS.MAX_SYNC_DEVICES
      const result = validator.validateSyncSettings(user.syncSettings)
      expect(result.isValid).toBe(true)
    })

    it('应该处理未来的时间戳（应该失败）', () => {
      const user = createAnonymousUser()
      user.createdAt = new Date(Date.now() + 1000)
      user.consentSettings.consentDate = new Date(Date.now() + 1000)
      const result = validator.validateBaseUser(user)
      expect(result.isValid).toBe(false)
    })

    it('应该处理极端的设备指纹', () => {
      const extremeFingerprints = [
        '1', // 最短有效
        'a'.repeat(DSGVO_CONSTANTS.MAX_DEVICE_FINGERPRINT_LENGTH), // 最长有效
        '0'.repeat(100), // 重复字符
        'AbC123XyZ789' // 混合大小写
      ]

      extremeFingerprints.forEach(fingerprint => {
        const result = validator.validateDeviceFingerprint(fingerprint)
        expect(result.isValid).toBe(true)
      })
    })
  })

  // ============================================================================
  // 错误消息本地化测试
  // ============================================================================

  describe('德语错误消息', () => {
    it('应该返回德语错误消息', () => {
      const result = validator.validateUserId('invalid')
      expect(result.errors[0].message).toContain('ungültig')
    })

    it('应该返回德语警告消息', () => {
      const user = createAnonymousUser()
      user.preferences.dataRetentionDays = 350
      user.createdAt = new Date(Date.now() - 340 * 24 * 60 * 60 * 1000)
      const result = validator.validateDataRetention(user)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0].message).toMatch(/Tagen|Daten|ab/)
    })

    it('所有错误消息都应该是德语', () => {
      const invalidUser = {
        ...validAnonymousUser,
        id: 'invalid',
        deviceFingerprint: '',
        createdAt: new Date(Date.now() + 1000)
      }

      const result = validator.validateAnonymousUser(invalidUser as AnonymousUser)
      result.errors.forEach(error => {
        expect(error.message).toMatch(/[äöüßÄÖÜ]|ungültig|erforderlich|fehlen/)
      })
    })
  })
})
