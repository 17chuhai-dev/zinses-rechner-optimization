/**
 * 用户身份管理服务
 * 提供用户创建、升级、验证和数据管理的统一接口
 * 符合DSGVO要求，支持匿名用户和可选注册
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type {
  User,
  AnonymousUser,
  RegisteredUser,
  UserType,
  ValidationResult,
  ConsentSettings,
  UserPreferences,
  UpdateUserParams,
  DataProcessingPurpose
} from '@/types/user-identity'

import {
  createAnonymousUser,
  upgradeToRegisteredUser,
  validateUserDataIntegrity,
  hasConsentForPurpose,
  updateConsent,
  needsDataCleanup,
  anonymizeUserData,
  isValidUser
} from '@/utils/user-identity-utils'

import { UserDataValidator } from './UserDataValidator'
import { storageService } from './StorageService'
import { encryptionService } from './EncryptionService'

// 服务配置常量
const SERVICE_CONFIG = {
  STORAGE_KEY_PREFIX: 'zr_user_',
  CURRENT_USER_KEY: 'zr_current_user',
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分钟
  AUTO_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24小时
  MAX_FAILED_ATTEMPTS: 3
} as const

// 服务事件类型
export type UserServiceEvent =
  | 'user_created'
  | 'user_upgraded'
  | 'user_updated'
  | 'user_deleted'
  | 'consent_updated'
  | 'session_expired'
  | 'data_cleanup'

// 事件监听器类型
export type UserServiceEventListener = (event: UserServiceEvent, data: any) => void

// 邮箱验证结果接口
export interface EmailVerificationResult {
  success: boolean
  token?: string
  expiresAt?: Date
  error?: string
}

// 用户会话信息接口
export interface UserSession {
  userId: string
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
  deviceFingerprint: string
}

/**
 * 用户身份管理服务类
 */
export class UserIdentityService {
  private static instance: UserIdentityService | null = null
  private validator: UserDataValidator
  private currentUser: User | null = null
  private eventListeners: Map<UserServiceEvent, UserServiceEventListener[]> = new Map()
  private cleanupTimer: NodeJS.Timeout | null = null
  private isInitialized: boolean = false

  private constructor() {
    this.validator = new UserDataValidator()
    this.initializeEventListeners()
  }

  /**
   * 获取服务单例实例
   */
  static getInstance(): UserIdentityService {
    if (!UserIdentityService.instance) {
      UserIdentityService.instance = new UserIdentityService()
    }
    return UserIdentityService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // 初始化加密服务
      await encryptionService.initialize()

      // 加载当前用户
      await this.loadCurrentUser()

      // 启动自动清理定时器
      this.startAutoCleanup()

      this.isInitialized = true
      console.log('🔐 User Identity Service initialized')
    } catch (error) {
      console.error('Failed to initialize User Identity Service:', error)
      throw error
    }
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 初始化所有事件类型的监听器数组
    const eventTypes: UserServiceEvent[] = [
      'user_created', 'user_upgraded', 'user_updated',
      'user_deleted', 'consent_updated', 'session_expired', 'data_cleanup'
    ]

    eventTypes.forEach(eventType => {
      this.eventListeners.set(eventType, [])
    })
  }

  /**
   * 添加事件监听器
   */
  addEventListener(event: UserServiceEvent, listener: UserServiceEventListener): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event: UserServiceEvent, listener: UserServiceEventListener): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: UserServiceEvent, data: any): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }

  /**
   * 创建匿名用户
   */
  async createAnonymousUser(
    preferences?: Partial<UserPreferences>,
    consentSettings?: Partial<ConsentSettings>
  ): Promise<AnonymousUser> {
    try {
      const user = createAnonymousUser({
        preferences,
        consentSettings
      })

      // 验证用户数据
      const validation = this.validator.validateAnonymousUser(user)
      if (!validation.isValid) {
        throw new Error(`User validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // 保存用户数据
      await this.saveUser(user)
      this.currentUser = user

      // 触发事件
      this.emitEvent('user_created', { user, type: 'anonymous' })

      console.log('👤 Anonymous user created:', user.id)
      return user
    } catch (error) {
      console.error('Failed to create anonymous user:', error)
      throw error
    }
  }

  /**
   * 升级匿名用户为注册用户
   */
  async upgradeToRegistered(
    anonymousUser: AnonymousUser,
    email: string
  ): Promise<RegisteredUser> {
    try {
      // 验证邮箱格式
      const emailValidation = this.validator.validateEmail(email)
      if (!emailValidation.isValid) {
        throw new Error(`Invalid email: ${emailValidation.errors.map(e => e.message).join(', ')}`)
      }

      // 升级用户
      const registeredUser = upgradeToRegisteredUser(anonymousUser, email)

      // 验证升级后的用户数据
      const validation = this.validator.validateRegisteredUser(registeredUser)
      if (!validation.isValid) {
        throw new Error(`User validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // 保存用户数据
      await this.saveUser(registeredUser)
      this.currentUser = registeredUser

      // 触发事件
      this.emitEvent('user_upgraded', {
        user: registeredUser,
        previousType: 'anonymous',
        email
      })

      console.log('📧 User upgraded to registered:', registeredUser.id)
      return registeredUser
    } catch (error) {
      console.error('Failed to upgrade user:', error)
      throw error
    }
  }

  /**
   * 更新用户数据
   */
  async updateUser(userId: string, updates: UpdateUserParams): Promise<User> {
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // 创建更新后的用户对象
      const updatedUser: User = {
        ...user,
        ...updates,
        lastActiveAt: new Date()
      }

      // 验证更新后的用户数据
      const validation = user.type === 'anonymous'
        ? this.validator.validateAnonymousUser(updatedUser as AnonymousUser)
        : this.validator.validateRegisteredUser(updatedUser as RegisteredUser)

      if (!validation.isValid) {
        throw new Error(`User validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // 保存更新后的用户数据
      await this.saveUser(updatedUser)

      if (this.currentUser?.id === userId) {
        this.currentUser = updatedUser
      }

      // 触发事件
      this.emitEvent('user_updated', { user: updatedUser, updates })

      console.log('✏️ User updated:', userId)
      return updatedUser
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    return this.currentUser
  }

  /**
   * 获取用户数据
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const userData = await storageService.get<User>(`${SERVICE_CONFIG.STORAGE_KEY_PREFIX}${userId}`)

      if (!userData || !isValidUser(userData)) {
        return null
      }

      // 检查数据是否需要清理
      if (needsDataCleanup(userData)) {
        console.warn('User data needs cleanup:', userId)
        await this.deleteUser(userId)
        return null
      }

      return userData
    } catch (error) {
      console.error('Failed to get user:', error)
      return null
    }
  }

  /**
   * 保存用户数据
   */
  private async saveUser(user: User): Promise<void> {
    try {
      await storageService.set(
        `${SERVICE_CONFIG.STORAGE_KEY_PREFIX}${user.id}`,
        user,
        {
          expiresIn: user.preferences.dataRetentionDays * 24 * 60 * 60 * 1000,
          metadata: {
            userType: user.type,
            lastSaved: new Date().toISOString()
          }
        }
      )

      // 更新当前用户引用
      await storageService.set(SERVICE_CONFIG.CURRENT_USER_KEY, user.id)
    } catch (error) {
      console.error('Failed to save user:', error)
      throw error
    }
  }

  /**
   * 加载当前用户
   */
  private async loadCurrentUser(): Promise<void> {
    try {
      const currentUserId = await storageService.get<string>(SERVICE_CONFIG.CURRENT_USER_KEY)

      if (currentUserId) {
        this.currentUser = await this.getUser(currentUserId)

        if (this.currentUser) {
          // 更新最后活跃时间
          this.currentUser.lastActiveAt = new Date()
          await this.saveUser(this.currentUser)
          console.log('👤 Current user loaded:', this.currentUser.id)
        }
      }
    } catch (error) {
      console.error('Failed to load current user:', error)
    }
  }

  /**
   * 删除用户数据（DSGVO删除权利）
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.getUser(userId)

      if (user) {
        // 匿名化数据用于统计（如果用户同意）
        if (hasConsentForPurpose(user, 'analytics')) {
          const anonymizedData = anonymizeUserData(user)
          await storageService.set(
            `zr_anonymous_stats_${Date.now()}`,
            anonymizedData,
            { expiresIn: 365 * 24 * 60 * 60 * 1000 } // 1年
          )
        }
      }

      // 删除用户数据
      await storageService.remove(`${SERVICE_CONFIG.STORAGE_KEY_PREFIX}${userId}`)

      // 如果是当前用户，清除引用
      if (this.currentUser?.id === userId) {
        this.currentUser = null
        await storageService.remove(SERVICE_CONFIG.CURRENT_USER_KEY)
      }

      // 触发事件
      this.emitEvent('user_deleted', { userId, user })

      console.log('🗑️ User deleted:', userId)
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  /**
   * 启动自动清理定时器
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(async () => {
      await this.performDataCleanup()
    }, SERVICE_CONFIG.AUTO_CLEANUP_INTERVAL)
  }

  /**
   * 执行数据清理
   */
  private async performDataCleanup(): Promise<void> {
    try {
      const keys = await storageService.keys()
      const userKeys = keys.filter(key => key.startsWith(SERVICE_CONFIG.STORAGE_KEY_PREFIX))
      let cleanedCount = 0

      for (const key of userKeys) {
        const userId = key.replace(SERVICE_CONFIG.STORAGE_KEY_PREFIX, '')
        const user = await this.getUser(userId)

        if (!user || needsDataCleanup(user)) {
          await this.deleteUser(userId)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        this.emitEvent('data_cleanup', { cleanedCount })
        console.log(`🧹 Data cleanup completed: ${cleanedCount} users cleaned`)
      }
    } catch (error) {
      console.error('Data cleanup failed:', error)
    }
  }

  /**
   * 获取服务统计信息
   */
  async getServiceStats(): Promise<{
    totalUsers: number
    anonymousUsers: number
    registeredUsers: number
    encryptedUsers: number
    storageUsage: any
    lastCleanup?: Date
  }> {
    try {
      const keys = await storageService.keys()
      const userKeys = keys.filter(key => key.startsWith(SERVICE_CONFIG.STORAGE_KEY_PREFIX))

      let anonymousUsers = 0
      let registeredUsers = 0

      for (const key of userKeys) {
        const userId = key.replace(SERVICE_CONFIG.STORAGE_KEY_PREFIX, '')
        const user = await this.getUser(userId)

        if (user) {
          if (user.type === 'anonymous') {
            anonymousUsers++
          } else {
            registeredUsers++
          }
        }
      }

      const storageStats = await storageService.getStats()

      return {
        totalUsers: userKeys.length,
        anonymousUsers,
        registeredUsers,
        encryptedUsers: storageStats.encryptedItems,
        storageUsage: storageStats
      }
    } catch (error) {
      console.error('Failed to get service stats:', error)
      throw error
    }
  }

  /**
   * 更新用户同意设置
   */
  async updateConsent(
    userId: string,
    purpose: DataProcessingPurpose,
    granted: boolean,
    source: string = 'user_action'
  ): Promise<User> {
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // 更新同意设置
      const updatedUser = updateConsent(user, purpose, granted, source)

      // 保存更新后的用户数据
      await this.saveUser(updatedUser)

      if (this.currentUser?.id === userId) {
        this.currentUser = updatedUser
      }

      // 触发事件
      this.emitEvent('consent_updated', {
        user: updatedUser,
        purpose,
        granted,
        source
      })

      console.log(`✅ Consent updated for ${purpose}:`, granted)
      return updatedUser
    } catch (error) {
      console.error('Failed to update consent:', error)
      throw error
    }
  }

  /**
   * 检查用户对特定目的的同意状态
   */
  hasConsentForPurpose(userId: string, purpose: DataProcessingPurpose): boolean {
    if (!this.currentUser || this.currentUser.id !== userId) {
      return false
    }

    return hasConsentForPurpose(this.currentUser, purpose)
  }

  /**
   * 发送邮箱验证
   */
  async sendEmailVerification(userId: string): Promise<EmailVerificationResult> {
    try {
      const user = await this.getUser(userId)
      if (!user || user.type !== 'registered') {
        throw new Error('User not found or not registered')
      }

      const registeredUser = user as RegisteredUser
      if (!registeredUser.email) {
        throw new Error('No email address found')
      }

      if (registeredUser.emailVerified) {
        return {
          success: false,
          error: 'Email already verified'
        }
      }

      // 生成验证令牌
      const token = this.generateVerificationToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

      // 保存验证令牌
      await storageService.set(
        `zr_email_verification_${token}`,
        {
          userId,
          email: registeredUser.email,
          createdAt: new Date(),
          expiresAt
        },
        { expiresIn: 24 * 60 * 60 * 1000 }
      )

      // 在实际应用中，这里应该发送邮件
      // 目前只是模拟验证过程
      console.log(`📧 Email verification sent to: ${registeredUser.email}`)
      console.log(`🔗 Verification token: ${token}`)

      return {
        success: true,
        token,
        expiresAt
      }
    } catch (error) {
      console.error('Failed to send email verification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // 获取验证信息
      const verificationData = await storageService.get<{
        userId: string
        email: string
        createdAt: Date
        expiresAt: Date
      }>(`zr_email_verification_${token}`)

      if (!verificationData) {
        return {
          success: false,
          error: 'Invalid or expired verification token'
        }
      }

      // 检查是否过期
      if (new Date() > new Date(verificationData.expiresAt)) {
        await storageService.remove(`zr_email_verification_${token}`)
        return {
          success: false,
          error: 'Verification token expired'
        }
      }

      // 获取用户并更新验证状态
      const user = await this.getUser(verificationData.userId)
      if (!user || user.type !== 'registered') {
        return {
          success: false,
          error: 'User not found'
        }
      }

      const updatedUser: RegisteredUser = {
        ...user as RegisteredUser,
        emailVerified: true,
        lastActiveAt: new Date()
      }

      // 保存更新后的用户数据
      await this.saveUser(updatedUser)

      if (this.currentUser?.id === verificationData.userId) {
        this.currentUser = updatedUser
      }

      // 删除验证令牌
      await storageService.remove(`zr_email_verification_${token}`)

      console.log('✅ Email verified successfully:', verificationData.email)
      return {
        success: true,
        user: updatedUser
      }
    } catch (error) {
      console.error('Failed to verify email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 生成验证令牌
   */
  private generateVerificationToken(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    return `${timestamp}-${random}`
  }

  /**
   * 创建用户会话
   */
  async createSession(userId: string): Promise<UserSession> {
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const now = new Date()
      const session: UserSession = {
        userId,
        createdAt: now,
        lastActiveAt: now,
        expiresAt: new Date(now.getTime() + SERVICE_CONFIG.SESSION_TIMEOUT),
        deviceFingerprint: user.deviceFingerprint
      }

      // 保存会话
      await storageService.set(
        `zr_session_${userId}`,
        session,
        { expiresIn: SERVICE_CONFIG.SESSION_TIMEOUT }
      )

      console.log('🔐 Session created for user:', userId)
      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  }

  /**
   * 验证用户会话
   */
  async validateSession(userId: string): Promise<boolean> {
    try {
      const session = await storageService.get<UserSession>(`zr_session_${userId}`)

      if (!session) {
        return false
      }

      // 检查会话是否过期
      if (new Date() > new Date(session.expiresAt)) {
        await storageService.remove(`zr_session_${userId}`)
        this.emitEvent('session_expired', { userId, session })
        return false
      }

      // 更新最后活跃时间
      session.lastActiveAt = new Date()
      session.expiresAt = new Date(Date.now() + SERVICE_CONFIG.SESSION_TIMEOUT)

      await storageService.set(
        `zr_session_${userId}`,
        session,
        { expiresIn: SERVICE_CONFIG.SESSION_TIMEOUT }
      )

      return true
    } catch (error) {
      console.error('Failed to validate session:', error)
      return false
    }
  }

  /**
   * 销毁用户会话
   */
  async destroySession(userId: string): Promise<void> {
    try {
      await storageService.remove(`zr_session_${userId}`)
      console.log('🔒 Session destroyed for user:', userId)
    } catch (error) {
      console.error('Failed to destroy session:', error)
    }
  }

  /**
   * 验证用户数据完整性
   */
  async validateUserIntegrity(userId: string): Promise<ValidationResult> {
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      return validateUserDataIntegrity(user)
    } catch (error) {
      console.error('Failed to validate user integrity:', error)
      throw error
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.eventListeners.clear()
    this.currentUser = null
    this.isInitialized = false

    console.log('🔒 User Identity Service destroyed')
  }
}

// 导出单例实例
export const userIdentityService = UserIdentityService.getInstance()
