/**
 * DSGVO合规性验证器测试
 * 验证DSGVO合规性检查功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DSGVOComplianceValidator, dsgvoComplianceValidator } from '../services/DSGVOComplianceValidator'
import type { AnonymousUser, RegisteredUser } from '@/types/user-identity'
import { DEFAULT_USER_PREFERENCES, DEFAULT_CONSENT_SETTINGS, DEFAULT_SYNC_SETTINGS } from '@/types/user-identity'

describe('DSGVOComplianceValidator', () => {
  let validator: DSGVOComplianceValidator
  let testAnonymousUser: AnonymousUser
  let testRegisteredUser: RegisteredUser

  beforeEach(() => {
    validator = DSGVOComplianceValidator.getInstance()
    validator.clearAuditLog()

    // 创建测试用户数据
    testAnonymousUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'anonymous',
      createdAt: new Date('2024-01-01'),
      lastActiveAt: new Date(),
      dataVersion: '1.0',
      deviceFingerprint: 'test-device-fingerprint-12345',
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

    testRegisteredUser = {
      ...testAnonymousUser,
      type: 'registered',
      email: 'test@example.de',
      emailVerified: true,
      registrationDate: new Date('2024-01-01'),
      syncEnabled: false,
      syncSettings: DEFAULT_SYNC_SETTINGS
    }
  })

  describe('服务初始化', () => {
    it('应该是单例模式', () => {
      const validator1 = DSGVOComplianceValidator.getInstance()
      const validator2 = DSGVOComplianceValidator.getInstance()
      expect(validator1).toBe(validator2)
    })

    it('应该与导出的实例相同', () => {
      expect(validator).toBe(dsgvoComplianceValidator)
    })
  })

  describe('基本合规性验证', () => {
    it('应该验证合规的匿名用户', () => {
      const result = validator.validateUserCompliance(testAnonymousUser)
      
      expect(result).toBeDefined()
      expect(result.complianceScore).toBeGreaterThan(0)
      expect(result.violations).toBeInstanceOf(Array)
      expect(result.warnings).toBeInstanceOf(Array)
      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.auditTrail).toBeInstanceOf(Array)
    })

    it('应该验证合规的注册用户', () => {
      const result = validator.validateUserCompliance(testRegisteredUser)
      
      expect(result).toBeDefined()
      expect(result.complianceScore).toBeGreaterThan(0)
      expect(result.isCompliant).toBeDefined()
    })

    it('应该生成审计记录', () => {
      validator.validateUserCompliance(testAnonymousUser)
      const auditLog = validator.getAuditLog()
      
      expect(auditLog.length).toBeGreaterThan(0)
      expect(auditLog[0].action).toBe('user_compliance_check')
      expect(auditLog[0].timestamp).toBeInstanceOf(Date)
    })
  })

  describe('第6条：数据处理的合法性', () => {
    it('应该验证功能性数据处理的合法利益基础', () => {
      const userWithWrongBasis = {
        ...testAnonymousUser,
        consentSettings: {
          ...testAnonymousUser.consentSettings,
          functional: {
            ...testAnonymousUser.consentSettings.functional,
            legalBasis: 'consent' as const
          }
        }
      }
      
      const result = validator.validateUserCompliance(userWithWrongBasis)
      
      expect(result.violations.some(v => 
        v.article === 'Art. 6(1)(f)' && 
        v.field === 'consentSettings.functional.legalBasis'
      )).toBe(true)
    })

    it('应该验证分析数据处理的同意基础', () => {
      const userWithAnalytics = {
        ...testAnonymousUser,
        consentSettings: {
          ...testAnonymousUser.consentSettings,
          analytics: {
            ...testAnonymousUser.consentSettings.analytics,
            status: 'granted' as const,
            legalBasis: 'legitimate_interest' as const
          }
        }
      }
      
      const result = validator.validateUserCompliance(userWithAnalytics)
      
      expect(result.violations.some(v => 
        v.article === 'Art. 6(1)(a)' && 
        v.field === 'consentSettings.analytics.legalBasis'
      )).toBe(true)
    })
  })

  describe('第7条：同意条件', () => {
    it('应该检查同意的具体性', () => {
      const userWithVagueConsent = {
        ...testAnonymousUser,
        consentSettings: {
          ...testAnonymousUser.consentSettings,
          analytics: {
            ...testAnonymousUser.consentSettings.analytics,
            status: 'granted' as const,
            purposes: [] // 空的目的数组
          }
        }
      }
      
      const result = validator.validateUserCompliance(userWithVagueConsent)
      
      expect(result.violations.some(v => 
        v.article === 'Art. 7(2)' && 
        v.field === 'consentSettings.analytics.purposes'
      )).toBe(true)
    })

    it('应该检查同意记录的有效性', () => {
      const userWithInvalidConsent = {
        ...testAnonymousUser,
        consentSettings: {
          ...testAnonymousUser.consentSettings,
          consentDate: new Date(Date.now() + 86400000) // 未来日期
        }
      }
      
      const result = validator.validateUserCompliance(userWithInvalidConsent)
      
      expect(result.violations.some(v => 
        v.article === 'Art. 7(1)' && 
        v.field === 'consentSettings.consentDate'
      )).toBe(true)
    })

    it('应该建议实现同意撤回机制', () => {
      const result = validator.validateUserCompliance(testAnonymousUser)
      
      expect(result.recommendations.some(r => 
        r.category === 'consent'
      )).toBe(true)
    })
  })

  describe('第5条：数据处理原则', () => {
    it('应该检查数据最小化原则', () => {
      const userWithLongFingerprint = {
        ...testAnonymousUser,
        deviceFingerprint: 'a'.repeat(150) // 过长的设备指纹
      }
      
      const result = validator.validateUserCompliance(userWithLongFingerprint)
      
      expect(result.warnings.some(w => 
        w.article === 'Art. 5(1)(c)'
      )).toBe(true)
    })

    it('应该检查存储限制原则', () => {
      const userWithLongRetention = {
        ...testAnonymousUser,
        preferences: {
          ...testAnonymousUser.preferences,
          dataRetentionDays: 2000 // 超过最大保留期限
        }
      }
      
      const result = validator.validateUserCompliance(userWithLongRetention)
      
      expect(result.violations.some(v => 
        v.article === 'Art. 5(1)(e)' && 
        v.field === 'preferences.dataRetentionDays'
      )).toBe(true)
    })

    it('应该检查过期数据', () => {
      const userWithExpiredData = {
        ...testAnonymousUser,
        lastActiveAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400天前
        preferences: {
          ...testAnonymousUser.preferences,
          dataRetentionDays: 365
        }
      }
      
      const result = validator.validateUserCompliance(userWithExpiredData)
      
      expect(result.violations.some(v => 
        v.article === 'Art. 5(1)(e)' && 
        v.severity === 'high'
      )).toBe(true)
    })
  })

  describe('第13条：透明度要求', () => {
    it('应该检查数据处理目的的透明度', () => {
      const userWithoutPurposes = {
        ...testAnonymousUser,
        consentSettings: {
          ...testAnonymousUser.consentSettings,
          functional: {
            ...testAnonymousUser.consentSettings.functional,
            purposes: [] // 空的目的数组
          }
        }
      }
      
      const result = validator.validateUserCompliance(userWithoutPurposes)
      
      expect(result.violations.some(v => 
        v.article === 'Art. 13(1)(c)' && 
        v.field === 'consentSettings.functional.purposes'
      )).toBe(true)
    })

    it('应该建议创建透明的隐私政策', () => {
      const result = validator.validateUserCompliance(testAnonymousUser)
      
      expect(result.recommendations.some(r => 
        r.category === 'transparency'
      )).toBe(true)
    })
  })

  describe('第25条：隐私设计和默认', () => {
    it('应该检查默认隐私设置', () => {
      const userWithBadDefaults = {
        ...testAnonymousUser,
        consentSettings: {
          ...testAnonymousUser.consentSettings,
          analytics: {
            ...testAnonymousUser.consentSettings.analytics,
            status: 'granted' as const,
            source: 'initial_setup' as const
          }
        }
      }
      
      const result = validator.validateUserCompliance(userWithBadDefaults)
      
      expect(result.violations.some(v => 
        v.article === 'Art. 25(2)' && 
        v.field === 'consentSettings.analytics.status'
      )).toBe(true)
    })

    it('应该检查营销默认设置', () => {
      const userWithMarketingDefault = {
        ...testAnonymousUser,
        consentSettings: {
          ...testAnonymousUser.consentSettings,
          marketing: {
            ...testAnonymousUser.consentSettings.marketing,
            status: 'granted' as const,
            source: 'initial_setup' as const
          }
        }
      }
      
      const result = validator.validateUserCompliance(userWithMarketingDefault)
      
      expect(result.violations.some(v => 
        v.article === 'Art. 25(2)' && 
        v.field === 'consentSettings.marketing.status'
      )).toBe(true)
    })
  })

  describe('第32条：处理安全', () => {
    it('应该检查设备指纹的安全性', () => {
      const userWithWeakFingerprint = {
        ...testAnonymousUser,
        deviceFingerprint: '123' // 过短的设备指纹
      }
      
      const result = validator.validateUserCompliance(userWithWeakFingerprint)
      
      expect(result.warnings.some(w => 
        w.article === 'Art. 32(1)'
      )).toBe(true)
    })

    it('应该建议实现数据加密', () => {
      const result = validator.validateUserCompliance(testAnonymousUser)
      
      expect(result.recommendations.some(r => 
        r.category === 'security'
      )).toBe(true)
    })
  })

  describe('用户权利建议', () => {
    it('应该为注册用户建议删除功能', () => {
      const result = validator.validateUserCompliance(testRegisteredUser)
      
      expect(result.recommendations.some(r => 
        r.category === 'rights' && 
        r.description.includes('Löschfunktionalität')
      )).toBe(true)
    })

    it('应该为注册用户建议数据导出功能', () => {
      const result = validator.validateUserCompliance(testRegisteredUser)
      
      expect(result.recommendations.some(r => 
        r.category === 'rights' && 
        r.description.includes('Datenexport')
      )).toBe(true)
    })
  })

  describe('合规分数计算', () => {
    it('应该为完全合规的用户给出高分', () => {
      const result = validator.validateUserCompliance(testAnonymousUser)
      
      expect(result.complianceScore).toBeGreaterThan(70)
    })

    it('应该为有严重违规的用户降低分数', () => {
      const userWithViolations = {
        ...testAnonymousUser,
        consentSettings: {
          ...testAnonymousUser.consentSettings,
          analytics: {
            ...testAnonymousUser.consentSettings.analytics,
            status: 'granted' as const,
            source: 'initial_setup' as const,
            legalBasis: 'legitimate_interest' as const,
            purposes: []
          }
        },
        preferences: {
          ...testAnonymousUser.preferences,
          dataRetentionDays: 2000
        }
      }
      
      const result = validator.validateUserCompliance(userWithViolations)
      
      expect(result.complianceScore).toBeLessThan(70)
      expect(result.isCompliant).toBe(false)
    })
  })

  describe('审计功能', () => {
    it('应该记录合规性检查', () => {
      validator.validateUserCompliance(testAnonymousUser)
      const auditLog = validator.getAuditLog()
      
      expect(auditLog.length).toBe(1)
      expect(auditLog[0].action).toBe('user_compliance_check')
      expect(auditLog[0].details.userId).toBe(testAnonymousUser.id)
      expect(auditLog[0].details.userType).toBe('anonymous')
    })

    it('应该能够清除审计日志', () => {
      validator.validateUserCompliance(testAnonymousUser)
      expect(validator.getAuditLog().length).toBeGreaterThan(0)
      
      validator.clearAuditLog()
      expect(validator.getAuditLog().length).toBe(0)
    })

    it('应该为多次检查创建多个审计记录', () => {
      validator.validateUserCompliance(testAnonymousUser)
      validator.validateUserCompliance(testRegisteredUser)
      
      const auditLog = validator.getAuditLog()
      expect(auditLog.length).toBe(2)
    })
  })

  describe('边界情况', () => {
    it('应该处理缺失的同意设置', () => {
      const userWithMissingConsent = {
        ...testAnonymousUser,
        consentSettings: {
          ...testAnonymousUser.consentSettings,
          consentDate: undefined as any
        }
      }
      
      expect(() => validator.validateUserCompliance(userWithMissingConsent)).not.toThrow()
    })

    it('应该处理极端的数据保留期限', () => {
      const userWithZeroRetention = {
        ...testAnonymousUser,
        preferences: {
          ...testAnonymousUser.preferences,
          dataRetentionDays: 0
        }
      }
      
      const result = validator.validateUserCompliance(userWithZeroRetention)
      expect(result).toBeDefined()
    })
  })
})
