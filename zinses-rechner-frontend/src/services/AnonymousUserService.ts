/**
 * 匿名用户标识和会话管理系统
 * 支持无需注册的匿名用户标识、会话管理、本地数据存储和隐私保护，确保DSGVO合规
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { EnterpriseEncryptionService } from './EnterpriseEncryptionService'
import { DashboardPermissionController } from './DashboardPermissionController'

// 匿名用户
export interface AnonymousUser {
  sessionId: string
  fingerprint?: string
  
  // 基本信息
  createdAt: Date
  lastActiveAt: Date
  
  // 用户偏好
  preferences: UserPreferences
  
  // 隐私设置
  privacySettings: AnonymousPrivacySettings
  
  // 会话信息
  sessionInfo: SessionInfo
  
  // 数据统计
  dataStats: {
    calculationsCount: number
    savedResultsCount: number
    sessionDuration: number
    lastCalculationType?: string
  }
}

// 用户偏好
export interface UserPreferences {
  // 界面设置
  language: 'de' | 'en'
  theme: 'light' | 'dark' | 'auto'
  currency: 'EUR' | 'USD'
  
  // 计算器设置
  defaultCalculator?: string
  decimalPlaces: number
  thousandsSeparator: '.' | ',' | ' '
  decimalSeparator: ',' | '.'
  
  // 通知设置
  showTips: boolean
  showCalculationHistory: boolean
  autoSaveResults: boolean
  
  // 隐私偏好
  allowAnalytics: boolean
  allowCookies: boolean
  dataRetentionDays: number
}

// 匿名用户隐私设置
export interface AnonymousPrivacySettings {
  // 数据收集同意
  analyticsConsent: boolean
  functionalCookiesConsent: boolean
  performanceCookiesConsent: boolean
  
  // 数据处理同意
  localStorageConsent: boolean
  sessionTrackingConsent: boolean
  
  // 数据保留设置
  dataRetentionPeriod: number // 天数
  autoDeleteEnabled: boolean
  
  // 同意记录
  consentTimestamp: Date
  consentVersion: string
  ipAddress?: string
  userAgent?: string
}

// 会话信息
export interface SessionInfo {
  sessionId: string
  startTime: Date
  lastActivity: Date
  expiresAt: Date
  
  // 会话状态
  isActive: boolean
  isExpired: boolean
  
  // 设备信息
  deviceInfo: {
    userAgent: string
    platform: string
    language: string
    timezone: string
    screenResolution?: string
  }
  
  // 安全信息
  securityInfo: {
    ipAddress?: string
    fingerprint?: string
    riskScore: number
    isSecure: boolean
  }
}

// 用户会话
export interface UserSession {
  sessionId: string
  userId?: string
  type: 'anonymous' | 'registered'
  
  // 会话数据
  data: Record<string, any>
  
  // 会话配置
  config: {
    maxAge: number // 毫秒
    secure: boolean
    httpOnly: boolean
    sameSite: 'strict' | 'lax' | 'none'
  }
  
  // 时间信息
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

// 隐私报告
export interface PrivacyReport {
  userId: string
  generatedAt: Date
  
  // 数据概览
  dataOverview: {
    totalDataPoints: number
    dataTypes: string[]
    oldestData: Date
    newestData: Date
    storageSize: number // bytes
  }
  
  // 同意状态
  consentStatus: {
    analytics: boolean
    functionalCookies: boolean
    performanceCookies: boolean
    localStorage: boolean
    sessionTracking: boolean
  }
  
  // 数据处理活动
  processingActivities: {
    purposes: string[]
    legalBases: string[]
    dataCategories: string[]
    retentionPeriods: Record<string, number>
  }
  
  // 权利行使
  rightsExercised: {
    accessRequests: number
    rectificationRequests: number
    erasureRequests: number
    portabilityRequests: number
  }
}

// DSGVO请求类型
export type DSGVORequestType = 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection'

// DSGVO响应
export interface DSGVOResponse {
  requestId: string
  requestType: DSGVORequestType
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  
  // 响应数据
  responseData?: any
  
  // 处理信息
  processedAt?: Date
  completedAt?: Date
  
  // 错误信息
  error?: {
    code: string
    message: string
    details?: any
  }
}

/**
 * 匿名用户标识和会话管理系统
 */
export class AnonymousUserService {
  private static instance: AnonymousUserService
  private encryptionService: EnterpriseEncryptionService
  private permissionController: DashboardPermissionController
  
  private anonymousUsers: Map<string, AnonymousUser> = new Map()
  private activeSessions: Map<string, UserSession> = new Map()
  private sessionCleanupInterval?: NodeJS.Timeout
  
  private isInitialized = false

  private constructor() {
    this.encryptionService = EnterpriseEncryptionService.getInstance()
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): AnonymousUserService {
    if (!AnonymousUserService.instance) {
      AnonymousUserService.instance = new AnonymousUserService()
    }
    return AnonymousUserService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.encryptionService.initialize()
      await this.permissionController.initialize()
      await this.loadAnonymousUsers()
      await this.loadActiveSessions()
      this.startSessionCleanup()
      this.isInitialized = true
      console.log('✅ AnonymousUserService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize AnonymousUserService:', error)
      throw error
    }
  }

  /**
   * 创建匿名用户
   */
  async createAnonymousUser(fingerprint?: string): Promise<AnonymousUser> {
    if (!this.isInitialized) await this.initialize()

    const sessionId = this.generateSessionId()
    const now = new Date()

    const anonymousUser: AnonymousUser = {
      sessionId,
      fingerprint,
      createdAt: now,
      lastActiveAt: now,
      preferences: this.getDefaultPreferences(),
      privacySettings: this.getDefaultPrivacySettings(),
      sessionInfo: {
        sessionId,
        startTime: now,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24小时
        isActive: true,
        isExpired: false,
        deviceInfo: this.getDeviceInfo(),
        securityInfo: {
          fingerprint,
          riskScore: 0,
          isSecure: true
        }
      },
      dataStats: {
        calculationsCount: 0,
        savedResultsCount: 0,
        sessionDuration: 0
      }
    }

    this.anonymousUsers.set(sessionId, anonymousUser)
    await this.saveAnonymousUser(anonymousUser)

    console.log(`👤 Anonymous user created: ${sessionId}`)
    return anonymousUser
  }

  /**
   * 获取匿名用户
   */
  async getAnonymousUser(sessionId: string): Promise<AnonymousUser | null> {
    if (!this.isInitialized) await this.initialize()

    const user = this.anonymousUsers.get(sessionId)
    if (!user) {
      return null
    }

    // 检查会话是否过期
    if (user.sessionInfo.expiresAt < new Date()) {
      user.sessionInfo.isExpired = true
      user.sessionInfo.isActive = false
      await this.saveAnonymousUser(user)
      return null
    }

    // 更新最后活动时间
    user.lastActiveAt = new Date()
    user.sessionInfo.lastActivity = new Date()
    await this.saveAnonymousUser(user)

    return user
  }

  /**
   * 更新匿名用户偏好
   */
  async updateAnonymousUserPreferences(
    sessionId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const user = this.anonymousUsers.get(sessionId)
    if (!user) {
      throw new Error('Anonymous user not found')
    }

    user.preferences = { ...user.preferences, ...preferences }
    user.lastActiveAt = new Date()

    await this.saveAnonymousUser(user)

    console.log(`⚙️ Anonymous user preferences updated: ${sessionId}`)
  }

  /**
   * 删除匿名用户数据
   */
  async deleteAnonymousUserData(sessionId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const user = this.anonymousUsers.get(sessionId)
    if (!user) {
      return // 用户不存在，无需删除
    }

    // 删除本地存储的数据
    await this.clearLocalData(sessionId)

    // 删除用户记录
    this.anonymousUsers.delete(sessionId)
    this.activeSessions.delete(sessionId)

    // 删除持久化数据
    localStorage.removeItem(`anonymous_user_${sessionId}`)
    localStorage.removeItem(`user_session_${sessionId}`)

    console.log(`🗑️ Anonymous user data deleted: ${sessionId}`)
  }

  /**
   * 创建会话
   */
  async createSession(fingerprint?: string): Promise<UserSession> {
    if (!this.isInitialized) await this.initialize()

    const sessionId = this.generateSessionId()
    const now = new Date()

    const session: UserSession = {
      sessionId,
      type: 'anonymous',
      data: {},
      config: {
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        secure: true,
        httpOnly: false, // 前端需要访问
        sameSite: 'strict'
      },
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }

    this.activeSessions.set(sessionId, session)
    await this.saveSession(session)

    console.log(`🔐 Session created: ${sessionId}`)
    return session
  }

  /**
   * 验证会话
   */
  async validateSession(sessionId: string): Promise<boolean> {
    if (!this.isInitialized) await this.initialize()

    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return false
    }

    // 检查会话是否过期
    if (session.expiresAt < new Date()) {
      await this.terminateSession(sessionId)
      return false
    }

    return true
  }

  /**
   * 延长会话
   */
  async extendSession(sessionId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const now = new Date()
    session.updatedAt = now
    session.expiresAt = new Date(now.getTime() + session.config.maxAge)

    await this.saveSession(session)

    console.log(`⏰ Session extended: ${sessionId}`)
  }

  /**
   * 终止会话
   */
  async terminateSession(sessionId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    this.activeSessions.delete(sessionId)
    localStorage.removeItem(`user_session_${sessionId}`)

    console.log(`🔒 Session terminated: ${sessionId}`)
  }

  /**
   * 存储本地数据
   */
  async storeLocalData(sessionId: string, data: any, encrypted: boolean = true): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const user = await this.getAnonymousUser(sessionId)
    if (!user) {
      throw new Error('Anonymous user not found')
    }

    let dataToStore = data
    if (encrypted) {
      dataToStore = await this.encryptionService.encryptData(data, 'standard', sessionId)
    }

    const key = `local_data_${sessionId}_${Date.now()}`
    localStorage.setItem(key, JSON.stringify(dataToStore))

    console.log(`💾 Local data stored: ${sessionId}`)
  }

  /**
   * 检索本地数据
   */
  async retrieveLocalData(sessionId: string, dataType: string): Promise<any> {
    if (!this.isInitialized) await this.initialize()

    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(`local_data_${sessionId}`) && key.includes(dataType)
    )

    const data: any[] = []
    for (const key of keys) {
      const storedData = localStorage.getItem(key)
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
          // 如果数据是加密的，尝试解密
          if (parsedData.encryptedContent) {
            const decryptedData = await this.encryptionService.decryptData(parsedData, sessionId)
            data.push(decryptedData)
          } else {
            data.push(parsedData)
          }
        } catch (error) {
          console.warn(`Failed to parse local data for key ${key}:`, error)
        }
      }
    }

    return data
  }

  /**
   * 清除本地数据
   */
  async clearLocalData(sessionId: string, dataTypes?: string[]): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`local_data_${sessionId}`)) {
        if (!dataTypes || dataTypes.some(type => key.includes(type))) {
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))

    console.log(`🧹 Local data cleared: ${sessionId} (${keysToRemove.length} items)`)
  }

  /**
   * 应用数据保留策略
   */
  async applyDataRetentionPolicy(sessionId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const user = await this.getAnonymousUser(sessionId)
    if (!user) {
      return
    }

    const retentionDays = user.privacySettings.dataRetentionPeriod
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

    // 删除过期的本地数据
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`local_data_${sessionId}`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          const createdAt = new Date(data.createdAt || data.timestamp || 0)
          if (createdAt < cutoffDate) {
            keysToRemove.push(key)
          }
        } catch (error) {
          // 如果无法解析，删除该数据
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))

    console.log(`📋 Data retention policy applied: ${sessionId} (removed ${keysToRemove.length} items)`)
  }

  /**
   * 生成隐私报告
   */
  async generatePrivacyReport(sessionId: string): Promise<PrivacyReport> {
    if (!this.isInitialized) await this.initialize()

    const user = await this.getAnonymousUser(sessionId)
    if (!user) {
      throw new Error('Anonymous user not found')
    }

    // 收集本地数据统计
    const localDataKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`local_data_${sessionId}`)
    )

    let totalSize = 0
    let oldestData = new Date()
    let newestData = new Date(0)

    for (const key of localDataKeys) {
      const data = localStorage.getItem(key)
      if (data) {
        totalSize += data.length
        try {
          const parsedData = JSON.parse(data)
          const createdAt = new Date(parsedData.createdAt || parsedData.timestamp || Date.now())
          if (createdAt < oldestData) oldestData = createdAt
          if (createdAt > newestData) newestData = createdAt
        } catch (error) {
          // 忽略解析错误
        }
      }
    }

    return {
      userId: sessionId,
      generatedAt: new Date(),
      dataOverview: {
        totalDataPoints: localDataKeys.length,
        dataTypes: ['calculations', 'preferences', 'session_data'],
        oldestData: localDataKeys.length > 0 ? oldestData : new Date(),
        newestData: localDataKeys.length > 0 ? newestData : new Date(),
        storageSize: totalSize
      },
      consentStatus: {
        analytics: user.privacySettings.analyticsConsent,
        functionalCookies: user.privacySettings.functionalCookiesConsent,
        performanceCookies: user.privacySettings.performanceCookiesConsent,
        localStorage: user.privacySettings.localStorageConsent,
        sessionTracking: user.privacySettings.sessionTrackingConsent
      },
      processingActivities: {
        purposes: ['Service provision', 'User experience improvement'],
        legalBases: ['Consent', 'Legitimate interest'],
        dataCategories: ['Technical data', 'Usage data', 'Preferences'],
        retentionPeriods: {
          'session_data': 1,
          'preferences': user.privacySettings.dataRetentionPeriod,
          'calculations': user.privacySettings.dataRetentionPeriod
        }
      },
      rightsExercised: {
        accessRequests: 0,
        rectificationRequests: 0,
        erasureRequests: 0,
        portabilityRequests: 0
      }
    }
  }

  /**
   * 处理DSGVO数据主体请求
   */
  async handleDataSubjectRequest(sessionId: string, requestType: DSGVORequestType): Promise<DSGVOResponse> {
    if (!this.isInitialized) await this.initialize()

    const requestId = crypto.randomUUID()
    const response: DSGVOResponse = {
      requestId,
      requestType,
      status: 'processing'
    }

    try {
      switch (requestType) {
        case 'access':
          response.responseData = await this.generatePrivacyReport(sessionId)
          break
        case 'erasure':
          await this.deleteAnonymousUserData(sessionId)
          response.responseData = { deleted: true }
          break
        case 'portability':
          response.responseData = await this.exportUserData(sessionId)
          break
        default:
          throw new Error(`Unsupported request type: ${requestType}`)
      }

      response.status = 'completed'
      response.completedAt = new Date()

    } catch (error) {
      response.status = 'rejected'
      response.error = {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    console.log(`📋 DSGVO request processed: ${requestType} for ${sessionId}`)
    return response
  }

  // 私有方法
  private generateSessionId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
      autoSaveResults: false,
      allowAnalytics: false,
      allowCookies: true,
      dataRetentionDays: 30
    }
  }

  private getDefaultPrivacySettings(): AnonymousPrivacySettings {
    return {
      analyticsConsent: false,
      functionalCookiesConsent: true,
      performanceCookiesConsent: false,
      localStorageConsent: true,
      sessionTrackingConsent: true,
      dataRetentionPeriod: 30,
      autoDeleteEnabled: true,
      consentTimestamp: new Date(),
      consentVersion: '1.0'
    }
  }

  private getDeviceInfo(): SessionInfo['deviceInfo'] {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`
    }
  }

  private async exportUserData(sessionId: string): Promise<any> {
    const user = await this.getAnonymousUser(sessionId)
    const localData = await this.retrieveLocalData(sessionId, '')
    
    return {
      user,
      localData,
      exportedAt: new Date(),
      format: 'json'
    }
  }

  private async loadAnonymousUsers(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('anonymous_user_')) {
          const user = JSON.parse(localStorage.getItem(key) || '{}') as AnonymousUser
          this.anonymousUsers.set(user.sessionId, user)
        }
      }
      console.log(`👤 Loaded ${this.anonymousUsers.size} anonymous users`)
    } catch (error) {
      console.error('Failed to load anonymous users:', error)
    }
  }

  private async loadActiveSessions(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('user_session_')) {
          const session = JSON.parse(localStorage.getItem(key) || '{}') as UserSession
          if (new Date(session.expiresAt) > new Date()) {
            this.activeSessions.set(session.sessionId, session)
          } else {
            localStorage.removeItem(key)
          }
        }
      }
      console.log(`🔐 Loaded ${this.activeSessions.size} active sessions`)
    } catch (error) {
      console.error('Failed to load active sessions:', error)
    }
  }

  private async saveAnonymousUser(user: AnonymousUser): Promise<void> {
    try {
      localStorage.setItem(`anonymous_user_${user.sessionId}`, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to save anonymous user:', error)
      throw error
    }
  }

  private async saveSession(session: UserSession): Promise<void> {
    try {
      localStorage.setItem(`user_session_${session.sessionId}`, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save session:', error)
      throw error
    }
  }

  private startSessionCleanup(): void {
    // 每小时清理过期会话
    this.sessionCleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, 60 * 60 * 1000)
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date()
    let cleanedCount = 0

    // 清理过期的匿名用户
    for (const [sessionId, user] of this.anonymousUsers) {
      if (user.sessionInfo.expiresAt < now) {
        await this.deleteAnonymousUserData(sessionId)
        cleanedCount++
      }
    }

    // 清理过期的会话
    for (const [sessionId, session] of this.activeSessions) {
      if (session.expiresAt < now) {
        await this.terminateSession(sessionId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`)
    }
  }
}

// Export singleton instance
export const anonymousUserService = AnonymousUserService.getInstance()
