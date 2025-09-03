/**
 * 多因素认证(MFA)系统
 * 支持TOTP、SMS、邮件、硬件令牌等多种认证方式，集成现有用户系统，提供企业级MFA管理
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserIdentityService } from './UserIdentityService'
import { DashboardPermissionController } from './DashboardPermissionController'

// MFA方法类型
export type MFAMethod = 'totp' | 'sms' | 'email' | 'hardware_token' | 'backup_codes'

// MFA设置
export interface MFASetup {
  userId: string
  method: MFAMethod
  
  // TOTP设置
  totp?: {
    secret: string
    qrCode: string
    backupCodes: string[]
    issuer: string
    accountName: string
  }
  
  // SMS设置
  sms?: {
    phoneNumber: string
    countryCode: string
    verified: boolean
    lastSentAt?: Date
  }
  
  // 邮件设置
  email?: {
    emailAddress: string
    verified: boolean
    lastSentAt?: Date
  }
  
  // 硬件令牌设置
  hardwareToken?: {
    tokenId: string
    publicKey: string
    algorithm: 'RS256' | 'ES256'
    counter: number
  }
  
  // 状态信息
  isEnabled: boolean
  setupCompletedAt?: Date
  lastUsedAt?: Date
  
  // 元数据
  createdAt: Date
  updatedAt: Date
}

// MFA验证
export interface MFAVerification {
  success: boolean
  method: MFAMethod
  userId: string
  
  // 验证详情
  verificationId: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  
  // 结果信息
  remainingAttempts?: number
  lockoutUntil?: Date
  
  // 错误信息
  error?: {
    code: string
    message: string
    details?: any
  }
}

// TOTP密钥
export interface TOTPSecret {
  secret: string
  qrCode: string
  manualEntryKey: string
  issuer: string
  accountName: string
  algorithm: 'SHA1' | 'SHA256' | 'SHA512'
  digits: 6 | 8
  period: number
}

// 硬件令牌数据
export interface HardwareTokenData {
  tokenType: 'yubikey' | 'fido2' | 'smart_card'
  publicKey: string
  algorithm: string
  attestation?: string
  metadata?: Record<string, any>
}

// 硬件令牌
export interface HardwareToken {
  id: string
  userId: string
  tokenData: HardwareTokenData
  
  // 状态
  isActive: boolean
  nickname?: string
  
  // 使用统计
  usage: {
    totalUses: number
    lastUsed?: Date
    successfulUses: number
    failedUses: number
  }
  
  // 时间信息
  registeredAt: Date
  lastVerifiedAt?: Date
  expiresAt?: Date
}

// MFA策略
export interface MFAPolicy {
  organizationId: string
  
  // 强制要求
  required: boolean
  requiredForRoles: string[]
  requiredForActions: string[]
  
  // 允许的方法
  allowedMethods: MFAMethod[]
  preferredMethod?: MFAMethod
  
  // 安全设置
  maxAttempts: number
  lockoutDuration: number // 分钟
  sessionTimeout: number // 分钟
  
  // 备用选项
  allowBackupCodes: boolean
  backupCodeCount: number
  
  // 恢复选项
  allowRecovery: boolean
  recoveryMethods: ('admin_reset' | 'security_questions' | 'trusted_device')[]
  
  // 时间设置
  createdAt: Date
  updatedAt: Date
  effectiveFrom: Date
  expiresAt?: Date
}

// MFA状态
export interface MFAStatus {
  userId: string
  
  // 启用状态
  isEnabled: boolean
  enabledMethods: MFAMethod[]
  primaryMethod?: MFAMethod
  
  // 设置状态
  setupRequired: boolean
  setupMethods: MFASetup[]
  
  // 验证状态
  lastVerification?: Date
  verificationRequired: boolean
  
  // 安全状态
  isLocked: boolean
  lockoutUntil?: Date
  failedAttempts: number
  
  // 备用代码
  backupCodesRemaining: number
  backupCodesGenerated: boolean
}

// MFA报告
export interface MFAReport {
  organizationId: string
  period: { start: Date; end: Date }
  
  // 采用统计
  totalUsers: number
  mfaEnabledUsers: number
  adoptionRate: number
  
  // 方法分布
  methodDistribution: Record<MFAMethod, number>
  
  // 使用统计
  totalVerifications: number
  successfulVerifications: number
  failedVerifications: number
  
  // 安全事件
  securityEvents: {
    bruteForceAttempts: number
    accountLockouts: number
    suspiciousActivity: number
  }
  
  // 趋势数据
  trends: {
    adoptionTrend: Array<{ date: Date; rate: number }>
    usageTrend: Array<{ date: Date; verifications: number }>
  }
}

/**
 * 多因素认证系统
 */
export class MFAService {
  private static instance: MFAService
  private userService: UserIdentityService
  private permissionController: DashboardPermissionController
  
  private mfaSetups: Map<string, Map<MFAMethod, MFASetup>> = new Map() // userId -> method -> setup
  private mfaPolicies: Map<string, MFAPolicy> = new Map() // organizationId -> policy
  private hardwareTokens: Map<string, HardwareToken> = new Map()
  private verificationAttempts: Map<string, number> = new Map() // userId -> attempts
  private lockouts: Map<string, Date> = new Map() // userId -> lockout until
  
  private isInitialized = false

  private constructor() {
    this.userService = UserIdentityService.getInstance()
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService()
    }
    return MFAService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.userService.initialize()
      await this.permissionController.initialize()
      await this.loadMFASetups()
      await this.loadMFAPolicies()
      await this.loadHardwareTokens()
      this.startMFAMonitoring()
      this.isInitialized = true
      console.log('✅ MFAService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize MFAService:', error)
      throw error
    }
  }

  /**
   * 启用MFA
   */
  async enableMFA(userId: string, method: MFAMethod): Promise<MFASetup> {
    if (!this.isInitialized) await this.initialize()

    // 检查用户是否存在
    const user = await this.userService.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 检查是否已经启用此方法
    const userSetups = this.mfaSetups.get(userId) || new Map()
    if (userSetups.has(method)) {
      throw new Error(`MFA method ${method} already enabled for user`)
    }

    let setup: MFASetup

    switch (method) {
      case 'totp':
        setup = await this.setupTOTP(userId)
        break
      case 'sms':
        setup = await this.setupSMS(userId)
        break
      case 'email':
        setup = await this.setupEmail(userId)
        break
      case 'hardware_token':
        setup = await this.setupHardwareToken(userId)
        break
      case 'backup_codes':
        setup = await this.setupBackupCodes(userId)
        break
      default:
        throw new Error(`Unsupported MFA method: ${method}`)
    }

    // 保存设置
    userSetups.set(method, setup)
    this.mfaSetups.set(userId, userSetups)
    await this.saveMFASetup(setup)

    console.log(`🔐 MFA enabled: ${method} for user ${userId}`)
    return setup
  }

  /**
   * 禁用MFA
   */
  async disableMFA(userId: string, method: MFAMethod): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const userSetups = this.mfaSetups.get(userId)
    if (!userSetups || !userSetups.has(method)) {
      throw new Error(`MFA method ${method} not enabled for user`)
    }

    const setup = userSetups.get(method)!
    setup.isEnabled = false
    setup.updatedAt = new Date()

    userSetups.delete(method)
    if (userSetups.size === 0) {
      this.mfaSetups.delete(userId)
    }

    await this.saveMFASetup(setup)

    console.log(`🔓 MFA disabled: ${method} for user ${userId}`)
  }

  /**
   * 验证MFA
   */
  async verifyMFA(userId: string, token: string, method: MFAMethod): Promise<MFAVerification> {
    if (!this.isInitialized) await this.initialize()

    const verification: MFAVerification = {
      success: false,
      method,
      userId,
      verificationId: crypto.randomUUID(),
      timestamp: new Date()
    }

    try {
      // 检查是否被锁定
      if (this.isUserLocked(userId)) {
        verification.error = {
          code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to too many failed attempts'
        }
        verification.lockoutUntil = this.lockouts.get(userId)
        return verification
      }

      // 获取MFA设置
      const userSetups = this.mfaSetups.get(userId)
      if (!userSetups || !userSetups.has(method)) {
        verification.error = {
          code: 'MFA_NOT_ENABLED',
          message: `MFA method ${method} not enabled for user`
        }
        return verification
      }

      const setup = userSetups.get(method)!
      if (!setup.isEnabled) {
        verification.error = {
          code: 'MFA_DISABLED',
          message: `MFA method ${method} is disabled`
        }
        return verification
      }

      // 根据方法验证
      let isValid = false
      switch (method) {
        case 'totp':
          isValid = await this.verifyTOTP(userId, token)
          break
        case 'sms':
        case 'email':
          isValid = await this.verifyCode(userId, token, method === 'sms' ? 'sms' : 'email')
          break
        case 'hardware_token':
          isValid = await this.verifyHardwareToken(userId, token)
          break
        case 'backup_codes':
          isValid = await this.verifyBackupCode(userId, token)
          break
        default:
          verification.error = {
            code: 'UNSUPPORTED_METHOD',
            message: `Unsupported MFA method: ${method}`
          }
          return verification
      }

      if (isValid) {
        verification.success = true
        setup.lastUsedAt = new Date()
        await this.saveMFASetup(setup)
        
        // 重置失败计数
        this.verificationAttempts.delete(userId)
        this.lockouts.delete(userId)
      } else {
        // 增加失败计数
        const attempts = (this.verificationAttempts.get(userId) || 0) + 1
        this.verificationAttempts.set(userId, attempts)
        
        verification.remainingAttempts = Math.max(0, 5 - attempts)
        
        // 检查是否需要锁定
        if (attempts >= 5) {
          const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000) // 15分钟
          this.lockouts.set(userId, lockoutUntil)
          verification.lockoutUntil = lockoutUntil
        }
        
        verification.error = {
          code: 'INVALID_TOKEN',
          message: 'Invalid verification token'
        }
      }

    } catch (error) {
      verification.error = {
        code: 'VERIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return verification
  }

  /**
   * 生成TOTP密钥
   */
  async generateTOTPSecret(userId: string): Promise<TOTPSecret> {
    if (!this.isInitialized) await this.initialize()

    const user = await this.userService.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 生成32字节随机密钥
    const secret = this.generateBase32Secret()
    const issuer = 'Zinses-Rechner'
    const accountName = user.email || user.username

    // 生成QR码URL
    const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

    return {
      secret,
      qrCode: qrCodeUrl,
      manualEntryKey: secret,
      issuer,
      accountName,
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    }
  }

  /**
   * 验证TOTP
   */
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    if (!this.isInitialized) await this.initialize()

    const userSetups = this.mfaSetups.get(userId)
    const totpSetup = userSetups?.get('totp')
    
    if (!totpSetup?.totp?.secret) {
      return false
    }

    // 简化实现：验证6位数字token
    if (!/^\d{6}$/.test(token)) {
      return false
    }

    // 模拟TOTP验证（实际应该使用TOTP算法）
    const currentTime = Math.floor(Date.now() / 1000 / 30)
    const expectedToken = this.generateTOTPToken(totpSetup.totp.secret, currentTime)
    
    // 允许前后一个时间窗口的token（防止时钟偏差）
    const prevToken = this.generateTOTPToken(totpSetup.totp.secret, currentTime - 1)
    const nextToken = this.generateTOTPToken(totpSetup.totp.secret, currentTime + 1)
    
    return token === expectedToken || token === prevToken || token === nextToken
  }

  /**
   * 生成备用代码
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    if (!this.isInitialized) await this.initialize()

    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateBackupCode())
    }

    // 保存备用代码（实际应该加密存储）
    const setup: MFASetup = {
      userId,
      method: 'backup_codes',
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const userSetups = this.mfaSetups.get(userId) || new Map()
    userSetups.set('backup_codes', setup)
    this.mfaSetups.set(userId, userSetups)
    await this.saveMFASetup(setup)

    // 存储备用代码到localStorage（实际应该存储到安全的后端）
    localStorage.setItem(`backup_codes_${userId}`, JSON.stringify(codes))

    console.log(`🔑 Generated ${codes.length} backup codes for user ${userId}`)
    return codes
  }

  /**
   * 发送SMS代码
   */
  async sendSMSCode(userId: string, phoneNumber: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const code = this.generateVerificationCode()
    
    // 模拟SMS发送
    console.log(`📱 SMS code sent to ${phoneNumber}: ${code}`)
    
    // 存储验证码（实际应该有过期时间和加密）
    localStorage.setItem(`sms_code_${userId}`, JSON.stringify({
      code,
      phoneNumber,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5分钟过期
    }))
  }

  /**
   * 发送邮件代码
   */
  async sendEmailCode(userId: string, email: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const code = this.generateVerificationCode()
    
    // 模拟邮件发送
    console.log(`📧 Email code sent to ${email}: ${code}`)
    
    // 存储验证码
    localStorage.setItem(`email_code_${userId}`, JSON.stringify({
      code,
      email,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10分钟过期
    }))
  }

  /**
   * 验证代码
   */
  async verifyCode(userId: string, code: string, type: 'sms' | 'email'): Promise<boolean> {
    if (!this.isInitialized) await this.initialize()

    const storedData = localStorage.getItem(`${type}_code_${userId}`)
    if (!storedData) {
      return false
    }

    try {
      const data = JSON.parse(storedData)
      const now = new Date()
      
      if (now > new Date(data.expiresAt)) {
        localStorage.removeItem(`${type}_code_${userId}`)
        return false
      }
      
      if (data.code === code) {
        localStorage.removeItem(`${type}_code_${userId}`)
        return true
      }
      
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * 注册硬件令牌
   */
  async registerHardwareToken(userId: string, tokenData: HardwareTokenData): Promise<HardwareToken> {
    if (!this.isInitialized) await this.initialize()

    const token: HardwareToken = {
      id: crypto.randomUUID(),
      userId,
      tokenData,
      isActive: true,
      usage: {
        totalUses: 0,
        successfulUses: 0,
        failedUses: 0
      },
      registeredAt: new Date()
    }

    this.hardwareTokens.set(token.id, token)
    await this.saveHardwareToken(token)

    console.log(`🔑 Hardware token registered: ${tokenData.tokenType} for user ${userId}`)
    return token
  }

  /**
   * 验证硬件令牌
   */
  async verifyHardwareToken(userId: string, signature: string): Promise<boolean> {
    if (!this.isInitialized) await this.initialize()

    // 查找用户的硬件令牌
    const userTokens = Array.from(this.hardwareTokens.values())
      .filter(token => token.userId === userId && token.isActive)

    for (const token of userTokens) {
      // 简化实现：模拟硬件令牌验证
      if (signature.length > 10) { // 基本验证
        token.usage.totalUses++
        token.usage.successfulUses++
        token.usage.lastUsed = new Date()
        token.lastVerifiedAt = new Date()
        await this.saveHardwareToken(token)
        return true
      }
    }

    // 更新失败统计
    for (const token of userTokens) {
      token.usage.failedUses++
      await this.saveHardwareToken(token)
    }

    return false
  }

  /**
   * 强制MFA策略
   */
  async enforceMFAPolicy(organizationId: string, policy: MFAPolicy): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    this.mfaPolicies.set(organizationId, policy)
    await this.saveMFAPolicy(policy)

    console.log(`🛡️ MFA policy enforced for organization: ${organizationId}`)
  }

  /**
   * 获取MFA状态
   */
  async getMFAStatus(userId: string): Promise<MFAStatus> {
    if (!this.isInitialized) await this.initialize()

    const userSetups = this.mfaSetups.get(userId) || new Map()
    const enabledMethods = Array.from(userSetups.keys()).filter(method => 
      userSetups.get(method)?.isEnabled
    )

    const backupCodesData = localStorage.getItem(`backup_codes_${userId}`)
    const backupCodes = backupCodesData ? JSON.parse(backupCodesData) : []

    return {
      userId,
      isEnabled: enabledMethods.length > 0,
      enabledMethods,
      primaryMethod: enabledMethods[0],
      setupRequired: enabledMethods.length === 0,
      setupMethods: Array.from(userSetups.values()),
      verificationRequired: false,
      isLocked: this.isUserLocked(userId),
      lockoutUntil: this.lockouts.get(userId),
      failedAttempts: this.verificationAttempts.get(userId) || 0,
      backupCodesRemaining: backupCodes.length,
      backupCodesGenerated: backupCodes.length > 0
    }
  }

  /**
   * 生成MFA报告
   */
  async generateMFAReport(organizationId: string): Promise<MFAReport> {
    if (!this.isInitialized) await this.initialize()

    // 简化实现：生成模拟报告数据
    const totalUsers = 100
    const mfaEnabledUsers = 75
    
    return {
      organizationId,
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      totalUsers,
      mfaEnabledUsers,
      adoptionRate: (mfaEnabledUsers / totalUsers) * 100,
      methodDistribution: {
        totp: 45,
        sms: 20,
        email: 15,
        hardware_token: 10,
        backup_codes: 5
      },
      totalVerifications: 1250,
      successfulVerifications: 1200,
      failedVerifications: 50,
      securityEvents: {
        bruteForceAttempts: 5,
        accountLockouts: 3,
        suspiciousActivity: 2
      },
      trends: {
        adoptionTrend: [
          { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), rate: 60 },
          { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), rate: 70 },
          { date: new Date(), rate: 75 }
        ],
        usageTrend: [
          { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), verifications: 800 },
          { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), verifications: 1000 },
          { date: new Date(), verifications: 1250 }
        ]
      }
    }
  }

  // 私有方法
  private async setupTOTP(userId: string): Promise<MFASetup> {
    const totpSecret = await this.generateTOTPSecret(userId)
    const backupCodes = await this.generateBackupCodes(userId)

    return {
      userId,
      method: 'totp',
      totp: {
        secret: totpSecret.secret,
        qrCode: totpSecret.qrCode,
        backupCodes,
        issuer: totpSecret.issuer,
        accountName: totpSecret.accountName
      },
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private async setupSMS(userId: string): Promise<MFASetup> {
    return {
      userId,
      method: 'sms',
      sms: {
        phoneNumber: '',
        countryCode: '+49',
        verified: false
      },
      isEnabled: false, // 需要验证手机号后启用
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private async setupEmail(userId: string): Promise<MFASetup> {
    const user = await this.userService.getUserById(userId)
    
    return {
      userId,
      method: 'email',
      email: {
        emailAddress: user?.email || '',
        verified: false
      },
      isEnabled: false, // 需要验证邮箱后启用
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private async setupHardwareToken(userId: string): Promise<MFASetup> {
    return {
      userId,
      method: 'hardware_token',
      hardwareToken: {
        tokenId: '',
        publicKey: '',
        algorithm: 'RS256',
        counter: 0
      },
      isEnabled: false, // 需要注册令牌后启用
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private async setupBackupCodes(userId: string): Promise<MFASetup> {
    return {
      userId,
      method: 'backup_codes',
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private generateBase32Secret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  private generateTOTPToken(secret: string, timeStep: number): string {
    // 简化实现：生成6位数字token
    const hash = (secret + timeStep.toString()).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return Math.abs(hash % 1000000).toString().padStart(6, '0')
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  private generateBackupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const backupCodesData = localStorage.getItem(`backup_codes_${userId}`)
    if (!backupCodesData) {
      return false
    }

    try {
      const codes = JSON.parse(backupCodesData)
      const index = codes.indexOf(code)
      
      if (index !== -1) {
        // 移除已使用的备用代码
        codes.splice(index, 1)
        localStorage.setItem(`backup_codes_${userId}`, JSON.stringify(codes))
        return true
      }
      
      return false
    } catch (error) {
      return false
    }
  }

  private isUserLocked(userId: string): boolean {
    const lockoutUntil = this.lockouts.get(userId)
    return lockoutUntil ? lockoutUntil > new Date() : false
  }

  private async loadMFASetups(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('mfa_setup_')) {
          const setup = JSON.parse(localStorage.getItem(key) || '{}') as MFASetup
          const userSetups = this.mfaSetups.get(setup.userId) || new Map()
          userSetups.set(setup.method, setup)
          this.mfaSetups.set(setup.userId, userSetups)
        }
      }
      console.log(`🔐 Loaded MFA setups for ${this.mfaSetups.size} users`)
    } catch (error) {
      console.error('Failed to load MFA setups:', error)
    }
  }

  private async loadMFAPolicies(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('mfa_policy_')) {
          const policy = JSON.parse(localStorage.getItem(key) || '{}') as MFAPolicy
          this.mfaPolicies.set(policy.organizationId, policy)
        }
      }
      console.log(`🛡️ Loaded ${this.mfaPolicies.size} MFA policies`)
    } catch (error) {
      console.error('Failed to load MFA policies:', error)
    }
  }

  private async loadHardwareTokens(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('hardware_token_')) {
          const token = JSON.parse(localStorage.getItem(key) || '{}') as HardwareToken
          this.hardwareTokens.set(token.id, token)
        }
      }
      console.log(`🔑 Loaded ${this.hardwareTokens.size} hardware tokens`)
    } catch (error) {
      console.error('Failed to load hardware tokens:', error)
    }
  }

  private async saveMFASetup(setup: MFASetup): Promise<void> {
    try {
      localStorage.setItem(`mfa_setup_${setup.userId}_${setup.method}`, JSON.stringify(setup))
    } catch (error) {
      console.error('Failed to save MFA setup:', error)
      throw error
    }
  }

  private async saveMFAPolicy(policy: MFAPolicy): Promise<void> {
    try {
      localStorage.setItem(`mfa_policy_${policy.organizationId}`, JSON.stringify(policy))
    } catch (error) {
      console.error('Failed to save MFA policy:', error)
      throw error
    }
  }

  private async saveHardwareToken(token: HardwareToken): Promise<void> {
    try {
      localStorage.setItem(`hardware_token_${token.id}`, JSON.stringify(token))
    } catch (error) {
      console.error('Failed to save hardware token:', error)
      throw error
    }
  }

  private startMFAMonitoring(): void {
    // 每小时清理过期的锁定和验证码
    setInterval(() => {
      this.cleanupExpiredData()
    }, 60 * 60 * 1000)
  }

  private cleanupExpiredData(): void {
    const now = new Date()
    let cleanedCount = 0

    // 清理过期的锁定
    for (const [userId, lockoutUntil] of this.lockouts) {
      if (lockoutUntil <= now) {
        this.lockouts.delete(userId)
        this.verificationAttempts.delete(userId)
        cleanedCount++
      }
    }

    // 清理过期的验证码
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.includes('_code_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          if (data.expiresAt && new Date(data.expiresAt) <= now) {
            localStorage.removeItem(key)
            cleanedCount++
          }
        } catch (error) {
          // 忽略解析错误
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired MFA data entries`)
    }
  }
}

// Export singleton instance
export const mfaService = MFAService.getInstance()
