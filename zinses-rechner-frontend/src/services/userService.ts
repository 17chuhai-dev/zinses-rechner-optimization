/**
 * DSGVO合规的用户身份管理服务
 * 支持匿名使用和可选注册，实现本地存储优先的数据管理策略
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type { 
  User, 
  AnonymousUser, 
  RegisteredUser, 
  UserPreferences, 
  ConsentStatus,
  DataProcessingRecord,
  UserSession,
  DataExportRequest,
  DataDeletionRequest
} from '@/types/user'

import { 
  generateAnonymousId, 
  encryptData, 
  decryptData, 
  deriveKey, 
  generateSalt,
  logDataProcessing,
  validateConsent,
  generateDataExport,
  secureDeleteUserData,
  minimizeUserData,
  checkDataRetention
} from '@/utils/encryption'

class UserService {
  private currentUser: User | null = null
  private encryptionKey: CryptoKey | null = null
  private processingLog: DataProcessingRecord[] = []

  /**
   * 初始化用户服务
   */
  async initialize(): Promise<void> {
    try {
      // 尝试从本地存储恢复用户会话
      await this.restoreUserSession()
      
      // 如果没有现有用户，创建匿名用户
      if (!this.currentUser) {
        await this.createAnonymousUser()
      }

      // 记录初始化
      this.logProcessing('read', 'user_session', 'session_restore', 'legitimate_interest')
    } catch (error) {
      console.error('用户服务初始化失败:', error)
      // 创建匿名用户作为后备
      await this.createAnonymousUser()
    }
  }

  /**
   * 创建匿名用户
   */
  async createAnonymousUser(): Promise<AnonymousUser> {
    const anonymousUser: AnonymousUser = {
      id: generateAnonymousId(),
      type: 'anonymous',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      sessionCount: 1,
      preferences: this.getDefaultPreferences(),
      consent: this.getDefaultConsent()
    }

    this.currentUser = anonymousUser
    await this.saveUserToStorage(anonymousUser)
    
    this.logProcessing('create', 'anonymous_user', 'user_session', 'legitimate_interest')
    
    return anonymousUser
  }

  /**
   * 用户注册
   */
  async registerUser(
    email: string, 
    displayName?: string,
    consent?: Partial<ConsentStatus>
  ): Promise<RegisteredUser> {
    // 验证必要的同意
    const requiredConsents = ['necessary', 'functional']
    const consentValidation = validateConsent(consent, requiredConsents)
    
    if (!consentValidation.valid) {
      throw new Error(`缺少必要的同意: ${consentValidation.missing.join(', ')}`)
    }

    // 从匿名用户升级或创建新用户
    const existingPreferences = this.currentUser?.preferences || this.getDefaultPreferences()
    
    const registeredUser: RegisteredUser = {
      id: this.currentUser?.id || generateAnonymousId(),
      type: 'registered',
      email,
      displayName,
      createdAt: this.currentUser?.createdAt || new Date(),
      lastActiveAt: new Date(),
      emailVerified: false,
      preferences: existingPreferences,
      consent: {
        ...this.getDefaultConsent(),
        ...consent,
        timestamp: new Date(),
        version: '1.0.0'
      },
      profile: {
        financialGoals: [],
        riskTolerance: 'moderate',
        investmentExperience: 'beginner'
      },
      settings: {
        dataStorage: 'local',
        privacyLevel: 'standard',
        autoSave: true,
        dataRetention: 365,
        exportFormat: 'json',
        twoFactorAuth: false,
        sessionTimeout: 60
      }
    }

    this.currentUser = registeredUser
    await this.saveUserToStorage(registeredUser)
    
    this.logProcessing('create', 'registered_user', 'user_registration', 'consent')
    
    return registeredUser
  }

  /**
   * 用户登录
   */
  async loginUser(email: string, password: string): Promise<RegisteredUser> {
    // 在实际实现中，这里会验证用户凭据
    // 目前返回模拟的用户数据
    
    const user = await this.getUserByEmail(email)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 更新最后活动时间
    user.lastActiveAt = new Date()
    this.currentUser = user
    
    await this.saveUserToStorage(user)
    this.logProcessing('read', 'user_login', 'authentication', 'contract')
    
    return user
  }

  /**
   * 用户登出
   */
  async logoutUser(): Promise<void> {
    if (this.currentUser) {
      this.logProcessing('update', 'user_session', 'logout', 'legitimate_interest')
      
      // 清除敏感数据
      this.encryptionKey = null
      
      // 如果是注册用户，保留基本信息；如果是匿名用户，创建新的匿名用户
      if (this.currentUser.type === 'anonymous') {
        await this.createAnonymousUser()
      } else {
        // 保留用户信息但清除会话
        await this.saveUserToStorage(this.currentUser)
      }
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    return this.currentUser
  }

  /**
   * 更新用户偏好
   */
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('没有活动用户')
    }

    this.currentUser.preferences = {
      ...this.currentUser.preferences,
      ...preferences
    }

    await this.saveUserToStorage(this.currentUser)
    this.logProcessing('update', 'user_preferences', 'user_customization', 'legitimate_interest')
  }

  /**
   * 更新用户同意状态
   */
  async updateConsent(consent: Partial<ConsentStatus>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('没有活动用户')
    }

    const previousConsent = { ...this.currentUser.consent }
    
    this.currentUser.consent = {
      ...this.currentUser.consent,
      ...consent,
      timestamp: new Date(),
      version: '1.0.0'
    }

    await this.saveUserToStorage(this.currentUser)
    this.logProcessing('update', 'user_consent', 'consent_management', 'consent')

    // 记录同意状态变更历史
    this.recordConsentChange(previousConsent, this.currentUser.consent)
  }

  /**
   * 请求数据导出
   */
  async requestDataExport(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<DataExportRequest> {
    if (!this.currentUser) {
      throw new Error('没有活动用户')
    }

    const exportRequest: DataExportRequest = {
      userId: this.currentUser.id,
      requestDate: new Date(),
      status: 'pending',
      format
    }

    // 生成导出数据
    const exportData = generateDataExport(this.currentUser)
    
    // 在实际实现中，这里会异步处理导出请求
    exportRequest.status = 'completed'
    exportRequest.downloadUrl = this.generateDownloadUrl(exportData, format)
    exportRequest.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期

    this.logProcessing('export', 'user_data', 'data_portability', 'consent')
    
    return exportRequest
  }

  /**
   * 请求数据删除
   */
  async requestDataDeletion(reason?: string): Promise<DataDeletionRequest> {
    if (!this.currentUser) {
      throw new Error('没有活动用户')
    }

    const deletionRequest: DataDeletionRequest = {
      userId: this.currentUser.id,
      requestDate: new Date(),
      scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后执行
      status: 'scheduled',
      reason
    }

    this.logProcessing('delete', 'user_data', 'right_to_erasure', 'consent')
    
    return deletionRequest
  }

  /**
   * 检查数据保留期限
   */
  checkUserDataRetention(): { expired: boolean; daysRemaining: number } {
    if (!this.currentUser) {
      return { expired: false, daysRemaining: 0 }
    }

    const retentionDays = 'settings' in this.currentUser 
      ? this.currentUser.settings.dataRetention 
      : 365

    return checkDataRetention(this.currentUser.createdAt, retentionDays)
  }

  /**
   * 获取默认用户偏好
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'de',
      currency: 'EUR',
      dateFormat: 'DD.MM.YYYY',
      numberFormat: 'de',
      theme: 'light',
      calculatorDefaults: {
        compoundInterest: {
          compoundFrequency: 'monthly'
        },
        loan: {
          paymentType: 'annuity'
        },
        mortgage: {}
      },
      notifications: {
        email: false,
        browser: true,
        goalReminders: true,
        calculationUpdates: false,
        marketingEmails: false
      }
    }
  }

  /**
   * 获取默认同意状态
   */
  private getDefaultConsent(): ConsentStatus {
    return {
      analytics: false,
      marketing: false,
      functional: false,
      necessary: true, // 技术必需，始终为true
      timestamp: new Date(),
      version: '1.0.0'
    }
  }

  /**
   * 保存用户到存储
   */
  private async saveUserToStorage(user: User): Promise<void> {
    try {
      const userData = JSON.stringify(user)
      localStorage.setItem('zinses_user', userData)
      
      // 如果用户选择云存储，也保存到云端
      if ('settings' in user && user.settings.dataStorage === 'cloud') {
        await this.saveUserToCloud(user)
      }
    } catch (error) {
      console.error('保存用户数据失败:', error)
      throw new Error('无法保存用户数据')
    }
  }

  /**
   * 从存储恢复用户会话
   */
  private async restoreUserSession(): Promise<void> {
    try {
      const userData = localStorage.getItem('zinses_user')
      if (userData) {
        this.currentUser = JSON.parse(userData)
        
        // 更新最后活动时间
        if (this.currentUser) {
          this.currentUser.lastActiveAt = new Date()
          await this.saveUserToStorage(this.currentUser)
        }
      }
    } catch (error) {
      console.error('恢复用户会话失败:', error)
      // 清除损坏的数据
      localStorage.removeItem('zinses_user')
    }
  }

  /**
   * 记录数据处理活动
   */
  private logProcessing(
    action: DataProcessingRecord['action'],
    dataType: string,
    purpose: string,
    legalBasis: DataProcessingRecord['legalBasis']
  ): void {
    if (this.currentUser) {
      const record = logDataProcessing(
        this.currentUser.id,
        action,
        dataType,
        purpose,
        legalBasis
      )
      this.processingLog.push(record)
    }
  }

  /**
   * 记录同意状态变更
   */
  private recordConsentChange(
    previousConsent: ConsentStatus,
    newConsent: ConsentStatus
  ): void {
    // 在实际实现中，这里会记录到审计日志
    console.log('同意状态变更:', {
      userId: this.currentUser?.id,
      previous: previousConsent,
      new: newConsent,
      timestamp: new Date()
    })
  }

  /**
   * 根据邮箱获取用户
   */
  private async getUserByEmail(email: string): Promise<RegisteredUser | null> {
    // 在实际实现中，这里会查询数据库
    // 目前返回null，表示用户不存在
    return null
  }

  /**
   * 保存用户到云端
   */
  private async saveUserToCloud(user: User): Promise<void> {
    // 在实际实现中，这里会调用云端API
    console.log('保存用户到云端:', user.id)
  }

  /**
   * 生成下载URL
   */
  private generateDownloadUrl(data: any, format: string): string {
    // 在实际实现中，这里会生成实际的下载URL
    return `data:application/json;base64,${btoa(JSON.stringify(data))}`
  }
}

// 导出单例实例
export const userService = new UserService()
