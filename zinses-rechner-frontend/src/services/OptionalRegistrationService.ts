/**
 * 可选用户注册和身份升级系统
 * 支持匿名用户向注册用户的平滑升级、数据迁移、身份验证和账户管理，保持数据连续性
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { AnonymousUserService } from './AnonymousUserService'
import { UserIdentityService } from './UserIdentityService'
import { EnterpriseEncryptionService } from './EnterpriseEncryptionService'

// 用户注册数据
export interface UserRegistrationData {
  // 基本信息
  email: string
  password: string
  firstName?: string
  lastName?: string
  
  // 可选信息
  dateOfBirth?: Date
  phoneNumber?: string
  address?: UserAddress
  
  // 偏好设置
  preferences?: Partial<UserPreferences>
  
  // 同意设置
  consents: RegistrationConsents
  
  // 营销偏好
  marketingPreferences?: MarketingPreferences
}

// 用户地址
export interface UserAddress {
  street: string
  city: string
  postalCode: string
  country: string
  state?: string
}

// 注册同意
export interface RegistrationConsents {
  termsOfService: boolean
  privacyPolicy: boolean
  dataProcessing: boolean
  marketing?: boolean
  analytics?: boolean
  thirdPartySharing?: boolean
}

// 营销偏好
export interface MarketingPreferences {
  emailMarketing: boolean
  smsMarketing: boolean
  pushNotifications: boolean
  personalizedOffers: boolean
  newsletterSubscription: boolean
}

// 注册用户
export interface RegisteredUser {
  id: string
  email: string
  
  // 基本信息
  profile: UserProfile
  
  // 账户状态
  accountStatus: {
    isActive: boolean
    isVerified: boolean
    isLocked: boolean
    createdAt: Date
    lastLoginAt?: Date
    emailVerifiedAt?: Date
  }
  
  // 安全信息
  security: {
    passwordHash: string
    passwordSalt: string
    passwordUpdatedAt: Date
    failedLoginAttempts: number
    lockoutUntil?: Date
    twoFactorEnabled: boolean
    recoveryCodesGenerated: boolean
  }
  
  // 偏好和设置
  preferences: UserPreferences
  privacySettings: UserPrivacySettings
  
  // 同意记录
  consents: ConsentRecord[]
  
  // 数据统计
  dataStats: {
    totalCalculations: number
    savedResults: number
    accountAge: number // 天数
    lastActivityAt: Date
  }
}

// 用户档案
export interface UserProfile {
  firstName?: string
  lastName?: string
  displayName?: string
  dateOfBirth?: Date
  phoneNumber?: string
  address?: UserAddress
  avatar?: string
  bio?: string
  website?: string
  
  // 专业信息
  occupation?: string
  company?: string
  industry?: string
  
  // 财务信息（可选）
  financialProfile?: {
    annualIncome?: number
    investmentExperience: 'beginner' | 'intermediate' | 'advanced'
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
    financialGoals: string[]
  }
}

// 用户隐私设置
export interface UserPrivacySettings {
  // 数据可见性
  profileVisibility: 'public' | 'private' | 'friends'
  emailVisibility: 'public' | 'private'
  
  // 数据处理同意
  analyticsConsent: boolean
  marketingConsent: boolean
  thirdPartyConsent: boolean
  
  // 通信偏好
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  
  // 数据保留
  dataRetentionPeriod: number
  autoDeleteInactive: boolean
  
  // 同意记录
  consentVersion: string
  consentTimestamp: Date
  ipAddress?: string
  userAgent?: string
}

// 同意记录
export interface ConsentRecord {
  id: string
  type: ConsentType
  granted: boolean
  timestamp: Date
  version: string
  ipAddress?: string
  userAgent?: string
  withdrawnAt?: Date
  withdrawalReason?: string
}

export type ConsentType = 'terms_of_service' | 'privacy_policy' | 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing'

// 数据迁移结果
export interface DataMigrationResult {
  migrationId: string
  success: boolean
  
  // 迁移统计
  totalItems: number
  migratedItems: number
  failedItems: number
  skippedItems: number
  
  // 迁移详情
  migratedData: {
    calculations: number
    preferences: number
    savedResults: number
    sessionData: number
  }
  
  // 错误信息
  errors: MigrationError[]
  warnings: string[]
  
  // 时间信息
  startedAt: Date
  completedAt: Date
  duration: number
}

export interface MigrationError {
  itemId: string
  itemType: string
  error: string
  recoverable: boolean
}

// 账户合并结果
export interface AccountMergeResult {
  mergeId: string
  success: boolean
  
  // 合并统计
  primaryAccountId: string
  secondaryAccountId: string
  mergedDataTypes: string[]
  
  // 合并详情
  mergedItems: {
    calculations: number
    savedResults: number
    preferences: number
    consents: number
  }
  
  // 冲突解决
  conflicts: DataConflict[]
  resolutions: ConflictResolution[]
  
  // 时间信息
  mergedAt: Date
  duration: number
}

// 数据完整性报告
export interface DataIntegrityReport {
  userId: string
  checkedAt: Date
  
  // 完整性检查
  checks: IntegrityCheck[]
  
  // 总体状态
  overallStatus: 'healthy' | 'warning' | 'error'
  healthScore: number // 0-100
  
  // 问题统计
  totalIssues: number
  criticalIssues: number
  warningIssues: number
  
  // 修复建议
  recommendations: string[]
}

export interface IntegrityCheck {
  checkType: string
  status: 'pass' | 'warning' | 'fail'
  message: string
  details?: any
}

// 密码重置结果
export interface PasswordResetResult {
  resetId: string
  success: boolean
  
  // 重置信息
  email: string
  resetToken?: string
  expiresAt?: Date
  
  // 状态
  status: 'sent' | 'expired' | 'used' | 'failed'
  
  // 时间信息
  requestedAt: Date
  completedAt?: Date
}

// 账户删除结果
export interface AccountDeletionResult {
  deletionId: string
  userId: string
  success: boolean
  
  // 删除统计
  deletedItems: {
    profile: boolean
    calculations: number
    savedResults: number
    preferences: boolean
    consents: number
  }
  
  // 保留数据（合规要求）
  retainedData: {
    auditLogs: boolean
    legalRecords: boolean
    financialRecords: boolean
  }
  
  // 删除证明
  deletionCertificate: {
    certificateId: string
    deletedAt: Date
    verificationHash: string
  }
  
  // 时间信息
  requestedAt: Date
  completedAt: Date
  gracePeriodEnds?: Date
}

// 同意历史
export interface ConsentHistory {
  userId: string
  consents: ConsentRecord[]
  
  // 统计信息
  summary: {
    totalConsents: number
    activeConsents: number
    withdrawnConsents: number
    lastUpdated: Date
  }
}

/**
 * 可选用户注册和身份升级系统
 */
export class OptionalRegistrationService {
  private static instance: OptionalRegistrationService
  private anonymousUserService: AnonymousUserService
  private userIdentityService: UserIdentityService
  private encryptionService: EnterpriseEncryptionService
  
  private registeredUsers: Map<string, RegisteredUser> = new Map()
  private pendingVerifications: Map<string, VerificationToken> = new Map()
  private passwordResetTokens: Map<string, PasswordResetToken> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.anonymousUserService = AnonymousUserService.getInstance()
    this.userIdentityService = UserIdentityService.getInstance()
    this.encryptionService = EnterpriseEncryptionService.getInstance()
  }

  static getInstance(): OptionalRegistrationService {
    if (!OptionalRegistrationService.instance) {
      OptionalRegistrationService.instance = new OptionalRegistrationService()
    }
    return OptionalRegistrationService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.anonymousUserService.initialize()
      await this.userIdentityService.initialize()
      await this.encryptionService.initialize()
      await this.loadRegisteredUsers()
      await this.loadPendingVerifications()
      this.startTokenCleanup()
      this.isInitialized = true
      console.log('✅ OptionalRegistrationService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize OptionalRegistrationService:', error)
      throw error
    }
  }

  /**
   * 注册用户
   */
  async registerUser(registrationData: UserRegistrationData): Promise<RegisteredUser> {
    if (!this.isInitialized) await this.initialize()

    // 验证注册数据
    await this.validateRegistrationData(registrationData)

    // 检查邮箱是否已存在
    if (await this.emailExists(registrationData.email)) {
      throw new Error('Email already registered')
    }

    // 创建用户账户
    const userId = crypto.randomUUID()
    const passwordHash = await this.hashPassword(registrationData.password)

    const registeredUser: RegisteredUser = {
      id: userId,
      email: registrationData.email,
      profile: {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        displayName: registrationData.firstName ? 
          `${registrationData.firstName} ${registrationData.lastName || ''}`.trim() : 
          undefined,
        dateOfBirth: registrationData.dateOfBirth,
        phoneNumber: registrationData.phoneNumber,
        address: registrationData.address
      },
      accountStatus: {
        isActive: true,
        isVerified: false,
        isLocked: false,
        createdAt: new Date()
      },
      security: {
        passwordHash: passwordHash.hash,
        passwordSalt: passwordHash.salt,
        passwordUpdatedAt: new Date(),
        failedLoginAttempts: 0,
        twoFactorEnabled: false,
        recoveryCodesGenerated: false
      },
      preferences: {
        ...this.getDefaultPreferences(),
        ...registrationData.preferences
      },
      privacySettings: this.getDefaultPrivacySettings(registrationData.consents),
      consents: this.createConsentRecords(registrationData.consents),
      dataStats: {
        totalCalculations: 0,
        savedResults: 0,
        accountAge: 0,
        lastActivityAt: new Date()
      }
    }

    this.registeredUsers.set(userId, registeredUser)
    await this.saveRegisteredUser(registeredUser)

    // 发送验证邮件
    await this.sendVerificationEmail(userId)

    console.log(`👤 User registered: ${registrationData.email}`)
    return registeredUser
  }

  /**
   * 升级匿名用户
   */
  async upgradeAnonymousUser(
    sessionId: string,
    registrationData: UserRegistrationData
  ): Promise<RegisteredUser> {
    if (!this.isInitialized) await this.initialize()

    // 获取匿名用户数据
    const anonymousUser = await this.anonymousUserService.getAnonymousUser(sessionId)
    if (!anonymousUser) {
      throw new Error('Anonymous user not found')
    }

    // 注册新用户
    const registeredUser = await this.registerUser(registrationData)

    // 迁移匿名用户数据
    const migrationResult = await this.migrateAnonymousData(sessionId, registeredUser.id)

    // 更新用户统计
    registeredUser.dataStats.totalCalculations = migrationResult.migratedData.calculations
    registeredUser.dataStats.savedResults = migrationResult.migratedData.savedResults

    // 合并偏好设置
    registeredUser.preferences = {
      ...anonymousUser.preferences,
      ...registeredUser.preferences
    }

    await this.saveRegisteredUser(registeredUser)

    // 清理匿名用户数据
    await this.anonymousUserService.deleteAnonymousUserData(sessionId)

    console.log(`🔄 Anonymous user upgraded: ${sessionId} -> ${registeredUser.id}`)
    return registeredUser
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(userId: string, verificationToken: string): Promise<boolean> {
    if (!this.isInitialized) await this.initialize()

    const tokenData = this.pendingVerifications.get(verificationToken)
    if (!tokenData || tokenData.userId !== userId) {
      return false
    }

    if (tokenData.expiresAt < new Date()) {
      this.pendingVerifications.delete(verificationToken)
      return false
    }

    const user = this.registeredUsers.get(userId)
    if (!user) {
      return false
    }

    // 更新验证状态
    user.accountStatus.isVerified = true
    user.accountStatus.emailVerifiedAt = new Date()

    await this.saveRegisteredUser(user)
    this.pendingVerifications.delete(verificationToken)

    console.log(`✅ Email verified: ${user.email}`)
    return true
  }

  /**
   * 重新发送验证邮件
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const user = this.registeredUsers.get(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (user.accountStatus.isVerified) {
      throw new Error('Email already verified')
    }

    await this.sendVerificationEmail(userId)

    console.log(`📧 Verification email resent: ${user.email}`)
  }

  /**
   * 迁移匿名数据
   */
  async migrateAnonymousData(sessionId: string, userId: string): Promise<DataMigrationResult> {
    if (!this.isInitialized) await this.initialize()

    const migrationId = crypto.randomUUID()
    const startTime = new Date()

    const result: DataMigrationResult = {
      migrationId,
      success: false,
      totalItems: 0,
      migratedItems: 0,
      failedItems: 0,
      skippedItems: 0,
      migratedData: {
        calculations: 0,
        preferences: 0,
        savedResults: 0,
        sessionData: 0
      },
      errors: [],
      warnings: [],
      startedAt: startTime,
      completedAt: new Date(),
      duration: 0
    }

    try {
      // 获取匿名用户的本地数据
      const localData = await this.anonymousUserService.retrieveLocalData(sessionId, '')
      result.totalItems = localData.length

      // 迁移数据
      for (const item of localData) {
        try {
          await this.migrateDataItem(item, userId)
          result.migratedItems++
          
          // 更新分类统计
          if (item.type === 'calculation') {
            result.migratedData.calculations++
          } else if (item.type === 'saved_result') {
            result.migratedData.savedResults++
          } else if (item.type === 'preferences') {
            result.migratedData.preferences++
          } else {
            result.migratedData.sessionData++
          }
        } catch (error) {
          result.failedItems++
          result.errors.push({
            itemId: item.id || 'unknown',
            itemType: item.type || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true
          })
        }
      }

      result.success = result.failedItems === 0
      result.completedAt = new Date()
      result.duration = result.completedAt.getTime() - startTime.getTime()

      console.log(`🔄 Data migration completed: ${result.migratedItems}/${result.totalItems} items`)
      return result

    } catch (error) {
      result.success = false
      result.errors.push({
        itemId: 'migration',
        itemType: 'process',
        error: error instanceof Error ? error.message : 'Migration failed',
        recoverable: false
      })
      result.completedAt = new Date()
      result.duration = result.completedAt.getTime() - startTime.getTime()
      
      throw error
    }
  }

  // 私有方法
  private async validateRegistrationData(data: UserRegistrationData): Promise<void> {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format')
    }

    // 验证密码强度
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    // 验证必需的同意
    if (!data.consents.termsOfService || !data.consents.privacyPolicy || !data.consents.dataProcessing) {
      throw new Error('Required consents not provided')
    }
  }

  private async emailExists(email: string): Promise<boolean> {
    for (const user of this.registeredUsers.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return true
      }
    }
    return false
  }

  private async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    // 简化实现：实际应该使用bcrypt或类似的安全哈希函数
    const salt = crypto.randomUUID()
    const hash = btoa(password + salt)
    return { hash, salt }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'de',
      theme: 'auto',
      currency: 'EUR',
      decimalPlaces: 2,
      thousandsSeparator: '.',
      decimalSeparator: ',',
      showTips: true,
      showCalculationHistory: true,
      autoSaveResults: true,
      allowAnalytics: false,
      allowCookies: true,
      dataRetentionDays: 365
    }
  }

  private getDefaultPrivacySettings(consents: RegistrationConsents): UserPrivacySettings {
    return {
      profileVisibility: 'private',
      emailVisibility: 'private',
      analyticsConsent: consents.analytics || false,
      marketingConsent: consents.marketing || false,
      thirdPartyConsent: consents.thirdPartySharing || false,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      dataRetentionPeriod: 365,
      autoDeleteInactive: false,
      consentVersion: '1.0',
      consentTimestamp: new Date()
    }
  }

  private createConsentRecords(consents: RegistrationConsents): ConsentRecord[] {
    const records: ConsentRecord[] = []
    const timestamp = new Date()

    const consentMappings: Array<{ key: keyof RegistrationConsents; type: ConsentType }> = [
      { key: 'termsOfService', type: 'terms_of_service' },
      { key: 'privacyPolicy', type: 'privacy_policy' },
      { key: 'dataProcessing', type: 'data_processing' },
      { key: 'marketing', type: 'marketing' },
      { key: 'analytics', type: 'analytics' },
      { key: 'thirdPartySharing', type: 'third_party_sharing' }
    ]

    for (const mapping of consentMappings) {
      const granted = consents[mapping.key]
      if (granted !== undefined) {
        records.push({
          id: crypto.randomUUID(),
          type: mapping.type,
          granted,
          timestamp,
          version: '1.0'
        })
      }
    }

    return records
  }

  private async sendVerificationEmail(userId: string): Promise<void> {
    const user = this.registeredUsers.get(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const verificationToken = crypto.randomUUID()
    const tokenData: VerificationToken = {
      token: verificationToken,
      userId,
      email: user.email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时
    }

    this.pendingVerifications.set(verificationToken, tokenData)

    // 模拟发送邮件
    console.log(`📧 Verification email sent to ${user.email}: ${verificationToken}`)
  }

  private async migrateDataItem(item: any, userId: string): Promise<void> {
    // 简化实现：将数据项迁移到注册用户的存储空间
    const key = `user_data_${userId}_${item.type}_${Date.now()}`
    localStorage.setItem(key, JSON.stringify({
      ...item,
      migratedAt: new Date(),
      originalSessionId: item.sessionId
    }))
  }

  private async loadRegisteredUsers(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('registered_user_')) {
          const user = JSON.parse(localStorage.getItem(key) || '{}') as RegisteredUser
          this.registeredUsers.set(user.id, user)
        }
      }
      console.log(`👤 Loaded ${this.registeredUsers.size} registered users`)
    } catch (error) {
      console.error('Failed to load registered users:', error)
    }
  }

  private async loadPendingVerifications(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('verification_token_')) {
          const token = JSON.parse(localStorage.getItem(key) || '{}') as VerificationToken
          if (token.expiresAt && new Date(token.expiresAt) > new Date()) {
            this.pendingVerifications.set(token.token, token)
          } else {
            localStorage.removeItem(key)
          }
        }
      }
      console.log(`📧 Loaded ${this.pendingVerifications.size} pending verifications`)
    } catch (error) {
      console.error('Failed to load pending verifications:', error)
    }
  }

  private async saveRegisteredUser(user: RegisteredUser): Promise<void> {
    try {
      localStorage.setItem(`registered_user_${user.id}`, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to save registered user:', error)
      throw error
    }
  }

  private startTokenCleanup(): void {
    // 每小时清理过期的令牌
    setInterval(() => {
      this.cleanupExpiredTokens()
    }, 60 * 60 * 1000)
  }

  private cleanupExpiredTokens(): void {
    const now = new Date()
    let cleanedCount = 0

    // 清理过期的验证令牌
    for (const [token, tokenData] of this.pendingVerifications) {
      if (tokenData.expiresAt < now) {
        this.pendingVerifications.delete(token)
        localStorage.removeItem(`verification_token_${token}`)
        cleanedCount++
      }
    }

    // 清理过期的密码重置令牌
    for (const [token, tokenData] of this.passwordResetTokens) {
      if (tokenData.expiresAt < now) {
        this.passwordResetTokens.delete(token)
        localStorage.removeItem(`password_reset_token_${token}`)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired tokens`)
    }
  }
}

// 内部类型定义
interface VerificationToken {
  token: string
  userId: string
  email: string
  createdAt: Date
  expiresAt: Date
}

interface PasswordResetToken {
  token: string
  userId: string
  email: string
  createdAt: Date
  expiresAt: Date
  used: boolean
}

// Export singleton instance
export const optionalRegistrationService = OptionalRegistrationService.getInstance()
