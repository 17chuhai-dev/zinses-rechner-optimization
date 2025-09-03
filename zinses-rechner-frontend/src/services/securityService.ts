/**
 * 高级安全认证服务
 * 实现多因素认证(MFA)、设备管理、安全审计日志等企业级安全功能
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { generateAnonymousId, hashSensitiveData } from '@/utils/encryption'

// MFA方法类型
export type MfaMethodType = 'totp' | 'sms' | 'email' | 'backup_codes' | 'hardware_key'

// 设备类型
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown'

// 安全事件类型
export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'password_changed'
  | 'device_registered'
  | 'device_removed'
  | 'suspicious_activity'
  | 'account_locked'
  | 'account_unlocked'
  | 'data_export'
  | 'data_deletion'
  | 'permission_changed'

// 风险级别
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

// MFA方法
export interface MfaMethod {
  id: string
  userId: string
  type: MfaMethodType
  name: string
  enabled: boolean
  verified: boolean
  
  // TOTP特定字段
  totp?: {
    secret: string
    qrCodeUrl: string
    backupCodes: string[]
  }
  
  // SMS特定字段
  sms?: {
    phoneNumber: string
    countryCode: string
    verified: boolean
  }
  
  // 邮件特定字段
  email?: {
    emailAddress: string
    verified: boolean
  }
  
  // 硬件密钥特定字段
  hardwareKey?: {
    keyId: string
    publicKey: string
    attestation: string
  }
  
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
}

// 设备信息
export interface Device {
  id: string
  userId: string
  name: string
  type: DeviceType
  trusted: boolean
  
  // 设备指纹
  fingerprint: {
    userAgent: string
    platform: string
    language: string
    timezone: string
    screenResolution: string
    colorDepth: number
    hardwareConcurrency: number
    deviceMemory?: number
    hash: string
  }
  
  // 位置信息
  location?: {
    country: string
    region: string
    city: string
    latitude?: number
    longitude?: number
    ipAddress: string
  }
  
  // 使用统计
  firstSeenAt: Date
  lastSeenAt: Date
  loginCount: number
  
  createdAt: Date
  updatedAt: Date
}

// 安全审计日志
export interface SecurityAuditLog {
  id: string
  userId?: string
  sessionId?: string
  eventType: SecurityEventType
  riskLevel: RiskLevel
  
  // 事件详情
  description: string
  details: Record<string, any>
  
  // 上下文信息
  ipAddress: string
  userAgent: string
  deviceId?: string
  location?: {
    country: string
    region: string
    city: string
  }
  
  // 结果
  success: boolean
  errorMessage?: string
  
  // 时间戳
  timestamp: Date
  
  // 处理状态
  reviewed: boolean
  reviewedBy?: string
  reviewedAt?: Date
  notes?: string
}

// 安全策略
export interface SecurityPolicy {
  id: string
  name: string
  description: string
  enabled: boolean
  
  // 密码策略
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    preventReuse: number // 防止重复使用最近N个密码
    maxAge: number // 密码最大有效期（天）
  }
  
  // 会话策略
  sessionPolicy: {
    maxDuration: number // 最大会话时长（分钟）
    idleTimeout: number // 空闲超时（分钟）
    maxConcurrentSessions: number
    requireMfaForSensitiveActions: boolean
  }
  
  // 设备策略
  devicePolicy: {
    requireDeviceRegistration: boolean
    maxTrustedDevices: number
    deviceTrustDuration: number // 设备信任期限（天）
    blockUnknownDevices: boolean
  }
  
  // 访问策略
  accessPolicy: {
    allowedCountries: string[]
    blockedCountries: string[]
    allowedIpRanges: string[]
    blockedIpRanges: string[]
    requireMfaFromNewLocations: boolean
  }
  
  // 监控策略
  monitoringPolicy: {
    enableAnomalyDetection: boolean
    maxFailedLoginAttempts: number
    lockoutDuration: number // 锁定时长（分钟）
    alertOnSuspiciousActivity: boolean
  }
  
  createdAt: Date
  updatedAt: Date
}

// 安全会话
export interface SecuritySession {
  id: string
  userId: string
  deviceId: string
  
  // 认证信息
  authenticationLevel: 'basic' | 'mfa' | 'strong'
  mfaVerified: boolean
  mfaMethodsUsed: MfaMethodType[]
  
  // 会话状态
  active: boolean
  ipAddress: string
  location?: {
    country: string
    region: string
    city: string
  }
  
  // 时间信息
  createdAt: Date
  lastActivityAt: Date
  expiresAt: Date
  
  // 权限
  permissions: string[]
  elevatedUntil?: Date // 提升权限的有效期
}

class SecurityService {
  /**
   * 启用TOTP多因素认证
   */
  async enableTotp(userId: string, name: string = 'Authenticator App'): Promise<{
    secret: string
    qrCodeUrl: string
    backupCodes: string[]
  }> {
    // 生成TOTP密钥
    const secret = this.generateTotpSecret()
    
    // 生成备份码
    const backupCodes = this.generateBackupCodes()
    
    // 生成QR码URL
    const qrCodeUrl = this.generateTotpQrCode(userId, secret)
    
    // 创建MFA方法
    const mfaMethod: MfaMethod = {
      id: generateAnonymousId(),
      userId,
      type: 'totp',
      name,
      enabled: false, // 需要验证后才启用
      verified: false,
      totp: {
        secret,
        qrCodeUrl,
        backupCodes
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await this.saveMfaMethod(mfaMethod)
    
    // 记录安全事件
    await this.logSecurityEvent(userId, 'mfa_enabled', 'medium', 'TOTP MFA method added', {
      methodType: 'totp',
      methodName: name
    })
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    }
  }

  /**
   * 验证TOTP代码
   */
  async verifyTotp(userId: string, code: string): Promise<boolean> {
    const mfaMethod = await this.getUserMfaMethod(userId, 'totp')
    if (!mfaMethod || !mfaMethod.totp) {
      return false
    }

    // 验证TOTP代码
    const isValid = this.validateTotpCode(mfaMethod.totp.secret, code)
    
    if (isValid) {
      // 启用MFA方法（如果是首次验证）
      if (!mfaMethod.verified) {
        mfaMethod.verified = true
        mfaMethod.enabled = true
        mfaMethod.updatedAt = new Date()
        await this.saveMfaMethod(mfaMethod)
      }
      
      // 更新最后使用时间
      mfaMethod.lastUsedAt = new Date()
      await this.saveMfaMethod(mfaMethod)
      
      await this.logSecurityEvent(userId, 'login_success', 'low', 'TOTP verification successful')
    } else {
      await this.logSecurityEvent(userId, 'login_failed', 'medium', 'TOTP verification failed', {
        reason: 'invalid_code'
      })
    }
    
    return isValid
  }

  /**
   * 注册设备
   */
  async registerDevice(
    userId: string,
    deviceInfo: {
      name: string
      userAgent: string
      platform: string
      language: string
      timezone: string
      screenResolution: string
      colorDepth: number
      hardwareConcurrency: number
      deviceMemory?: number
    },
    ipAddress: string,
    trusted: boolean = false
  ): Promise<Device> {
    // 生成设备指纹
    const fingerprint = {
      ...deviceInfo,
      hash: await this.generateDeviceFingerprint(deviceInfo)
    }
    
    // 获取位置信息
    const location = await this.getLocationFromIp(ipAddress)
    
    // 确定设备类型
    const type = this.determineDeviceType(deviceInfo.userAgent)
    
    const device: Device = {
      id: generateAnonymousId(),
      userId,
      name: deviceInfo.name,
      type,
      trusted,
      fingerprint,
      location,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      loginCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await this.saveDevice(device)
    
    await this.logSecurityEvent(userId, 'device_registered', 'medium', 'New device registered', {
      deviceId: device.id,
      deviceName: device.name,
      deviceType: device.type,
      trusted: device.trusted,
      location: device.location
    })
    
    return device
  }

  /**
   * 检测可疑活动
   */
  async detectSuspiciousActivity(
    userId: string,
    sessionInfo: {
      ipAddress: string
      userAgent: string
      deviceFingerprint: string
    }
  ): Promise<{
    suspicious: boolean
    riskLevel: RiskLevel
    reasons: string[]
    recommendations: string[]
  }> {
    const reasons: string[] = []
    const recommendations: string[] = []
    let riskLevel: RiskLevel = 'low'
    
    // 检查设备是否已知
    const knownDevice = await this.getDeviceByFingerprint(userId, sessionInfo.deviceFingerprint)
    if (!knownDevice) {
      reasons.push('Unknown device')
      recommendations.push('Register this device as trusted')
      riskLevel = 'medium'
    }
    
    // 检查IP地址变化
    const recentSessions = await this.getRecentSessions(userId, 24) // 24小时内
    const knownIps = recentSessions.map(s => s.ipAddress)
    if (!knownIps.includes(sessionInfo.ipAddress)) {
      const location = await this.getLocationFromIp(sessionInfo.ipAddress)
      const recentLocations = await this.getRecentLocations(userId, 7) // 7天内
      
      const isNewCountry = !recentLocations.some(l => l.country === location?.country)
      if (isNewCountry) {
        reasons.push('Login from new country')
        recommendations.push('Verify this login attempt')
        riskLevel = 'high'
      }
    }
    
    // 检查登录频率
    const recentLogins = await this.getRecentLogins(userId, 1) // 1小时内
    if (recentLogins.length > 10) {
      reasons.push('Unusual login frequency')
      recommendations.push('Check for automated attacks')
      riskLevel = 'high'
    }
    
    // 检查失败登录尝试
    const failedAttempts = await this.getRecentFailedLogins(userId, 1) // 1小时内
    if (failedAttempts.length > 5) {
      reasons.push('Multiple failed login attempts')
      recommendations.push('Consider account lockout')
      riskLevel = 'critical'
    }
    
    const suspicious = reasons.length > 0
    
    if (suspicious) {
      await this.logSecurityEvent(userId, 'suspicious_activity', riskLevel, 'Suspicious activity detected', {
        reasons,
        sessionInfo,
        riskLevel
      })
    }
    
    return {
      suspicious,
      riskLevel,
      reasons,
      recommendations
    }
  }

  /**
   * 创建安全会话
   */
  async createSecuritySession(
    userId: string,
    deviceId: string,
    authenticationLevel: 'basic' | 'mfa' | 'strong',
    ipAddress: string,
    permissions: string[] = []
  ): Promise<SecuritySession> {
    const location = await this.getLocationFromIp(ipAddress)
    
    const session: SecuritySession = {
      id: generateAnonymousId(),
      userId,
      deviceId,
      authenticationLevel,
      mfaVerified: authenticationLevel !== 'basic',
      mfaMethodsUsed: [],
      active: true,
      ipAddress,
      location,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8小时后过期
      permissions
    }
    
    await this.saveSecuritySession(session)
    return session
  }

  /**
   * 验证会话权限
   */
  async validateSessionPermission(
    sessionId: string,
    requiredPermission: string,
    requireMfa: boolean = false
  ): Promise<{
    valid: boolean
    session?: SecuritySession
    reason?: string
  }> {
    const session = await this.getSecuritySession(sessionId)
    
    if (!session) {
      return { valid: false, reason: 'Session not found' }
    }
    
    if (!session.active) {
      return { valid: false, reason: 'Session inactive' }
    }
    
    if (new Date() > session.expiresAt) {
      return { valid: false, reason: 'Session expired' }
    }
    
    if (requireMfa && !session.mfaVerified) {
      return { valid: false, reason: 'MFA required' }
    }
    
    if (!session.permissions.includes(requiredPermission) && !session.permissions.includes('*')) {
      return { valid: false, reason: 'Insufficient permissions' }
    }
    
    // 更新最后活动时间
    session.lastActivityAt = new Date()
    await this.saveSecuritySession(session)
    
    return { valid: true, session }
  }

  // 私有方法

  /**
   * 生成TOTP密钥
   */
  private generateTotpSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  /**
   * 生成备份码
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  /**
   * 生成TOTP QR码URL
   */
  private generateTotpQrCode(userId: string, secret: string): string {
    const issuer = 'Zinses-Rechner'
    const label = `${issuer}:${userId}`
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
  }

  /**
   * 验证TOTP代码
   */
  private validateTotpCode(secret: string, code: string): boolean {
    // 简化的TOTP验证逻辑
    // 在实际实现中，会使用专门的TOTP库（如speakeasy）
    const timeStep = Math.floor(Date.now() / 1000 / 30)
    const expectedCode = this.generateTotpCode(secret, timeStep)
    
    // 允许前后一个时间窗口的代码（防止时钟偏差）
    return code === expectedCode ||
           code === this.generateTotpCode(secret, timeStep - 1) ||
           code === this.generateTotpCode(secret, timeStep + 1)
  }

  /**
   * 生成TOTP代码
   */
  private generateTotpCode(secret: string, timeStep: number): string {
    // 简化实现，实际中会使用HMAC-SHA1算法
    const hash = (secret + timeStep.toString()).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return Math.abs(hash % 1000000).toString().padStart(6, '0')
  }

  /**
   * 生成设备指纹
   */
  private async generateDeviceFingerprint(deviceInfo: any): Promise<string> {
    const data = JSON.stringify(deviceInfo)
    return await hashSensitiveData(data)
  }

  /**
   * 确定设备类型
   */
  private determineDeviceType(userAgent: string): DeviceType {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile'
    }
    if (/Windows|Mac|Linux/.test(userAgent)) {
      return 'desktop'
    }
    return 'unknown'
  }

  /**
   * 从IP获取位置信息
   */
  private async getLocationFromIp(ipAddress: string): Promise<{
    country: string
    region: string
    city: string
  } | undefined> {
    // 在实际实现中，会调用IP地理位置服务
    return {
      country: 'DE',
      region: 'Bayern',
      city: 'München'
    }
  }

  /**
   * 记录安全事件
   */
  private async logSecurityEvent(
    userId: string,
    eventType: SecurityEventType,
    riskLevel: RiskLevel,
    description: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const log: SecurityAuditLog = {
      id: generateAnonymousId(),
      userId,
      eventType,
      riskLevel,
      description,
      details,
      ipAddress: '0.0.0.0', // 在实际实现中会获取真实IP
      userAgent: 'Unknown',
      success: true,
      timestamp: new Date(),
      reviewed: false
    }
    
    await this.saveSecurityAuditLog(log)
  }

  // 数据访问方法

  /**
   * 保存MFA方法
   */
  private async saveMfaMethod(mfaMethod: MfaMethod): Promise<void> {
    // 在实际实现中，这里会保存到数据库
    console.log('保存MFA方法:', mfaMethod.id)
  }

  /**
   * 获取用户MFA方法
   */
  private async getUserMfaMethod(userId: string, type: MfaMethodType): Promise<MfaMethod | null> {
    // 在实际实现中，这里会从数据库查询
    return null
  }

  /**
   * 保存设备
   */
  private async saveDevice(device: Device): Promise<void> {
    // 在实际实现中，这里会保存到数据库
    console.log('保存设备:', device.id)
  }

  /**
   * 根据指纹获取设备
   */
  private async getDeviceByFingerprint(userId: string, fingerprint: string): Promise<Device | null> {
    // 在实际实现中，这里会从数据库查询
    return null
  }

  /**
   * 获取最近会话
   */
  private async getRecentSessions(userId: string, hours: number): Promise<SecuritySession[]> {
    // 在实际实现中，这里会从数据库查询
    return []
  }

  /**
   * 获取最近位置
   */
  private async getRecentLocations(userId: string, days: number): Promise<Array<{ country: string }>> {
    // 在实际实现中，这里会从数据库查询
    return []
  }

  /**
   * 获取最近登录
   */
  private async getRecentLogins(userId: string, hours: number): Promise<SecurityAuditLog[]> {
    // 在实际实现中，这里会从数据库查询
    return []
  }

  /**
   * 获取最近失败登录
   */
  private async getRecentFailedLogins(userId: string, hours: number): Promise<SecurityAuditLog[]> {
    // 在实际实现中，这里会从数据库查询
    return []
  }

  /**
   * 保存安全会话
   */
  private async saveSecuritySession(session: SecuritySession): Promise<void> {
    // 在实际实现中，这里会保存到数据库
    console.log('保存安全会话:', session.id)
  }

  /**
   * 获取安全会话
   */
  private async getSecuritySession(sessionId: string): Promise<SecuritySession | null> {
    // 在实际实现中，这里会从数据库查询
    return null
  }

  /**
   * 保存安全审计日志
   */
  private async saveSecurityAuditLog(log: SecurityAuditLog): Promise<void> {
    // 在实际实现中，这里会保存到数据库
    console.log('保存安全审计日志:', log.id)
  }
}

// 导出单例实例
export const securityService = new SecurityService()

// 导出类型
export type {
  MfaMethod,
  MfaMethodType,
  Device,
  DeviceType,
  SecurityAuditLog,
  SecurityEventType,
  SecurityPolicy,
  SecuritySession,
  RiskLevel
}
