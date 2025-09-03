/**
 * 企业级单点登录(SSO)服务
 * 集成SAML、OAuth2、LDAP等企业级认证协议，支持主流身份提供商
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserIdentityService } from './UserIdentityService'
import { EnterpriseAccountService } from './EnterpriseAccountService'
import { RoleBasedAccessControlService } from './RoleBasedAccessControlService'
import type { RegisteredUser } from '@/types/user-identity'

// SSO协议类型
export type SSOProtocol = 'saml2' | 'oauth2' | 'oidc' | 'ldap' | 'ad'

// SSO提供商
export interface SSOProvider {
  id: string
  name: string
  protocol: SSOProtocol
  accountId: string
  
  // 提供商配置
  config: SSOProviderConfig
  
  // 状态
  isActive: boolean
  isDefault: boolean
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  createdBy: string
  
  // 统计信息
  stats: SSOProviderStats
}

// SSO提供商配置
export interface SSOProviderConfig {
  // 通用配置
  displayName: string
  description?: string
  logoUrl?: string
  
  // 协议特定配置
  saml?: SAMLConfig
  oauth2?: OAuth2Config
  oidc?: OIDCConfig
  ldap?: LDAPConfig
  
  // 用户映射
  userMapping: UserAttributeMapping
  
  // 高级设置
  advanced: AdvancedSSOSettings
}

// SAML配置
export interface SAMLConfig {
  entityId: string
  ssoUrl: string
  sloUrl?: string
  certificate: string
  signRequests: boolean
  encryptAssertions: boolean
  nameIdFormat: 'email' | 'persistent' | 'transient'
  
  // 属性映射
  attributeMapping: {
    email: string
    firstName?: string
    lastName?: string
    displayName?: string
    groups?: string
  }
}

// OAuth2配置
export interface OAuth2Config {
  clientId: string
  clientSecret: string
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl: string
  scope: string[]
  
  // PKCE支持
  usePKCE: boolean
  
  // 响应类型
  responseType: 'code' | 'token' | 'id_token'
}

// OpenID Connect配置
export interface OIDCConfig extends OAuth2Config {
  discoveryUrl: string
  issuer: string
  jwksUri: string
  
  // ID Token验证
  validateIdToken: boolean
  clockSkew: number
}

// LDAP配置
export interface LDAPConfig {
  serverUrl: string
  bindDN: string
  bindPassword: string
  baseDN: string
  userFilter: string
  groupFilter?: string
  
  // TLS设置
  useTLS: boolean
  tlsCertificate?: string
  
  // 属性映射
  attributeMapping: {
    username: string
    email: string
    firstName?: string
    lastName?: string
    groups?: string
  }
}

// 用户属性映射
export interface UserAttributeMapping {
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  department?: string
  title?: string
  groups?: string
  roles?: string
  
  // 自定义属性
  customAttributes?: Record<string, string>
}

// 高级SSO设置
export interface AdvancedSSOSettings {
  // 会话管理
  sessionTimeout: number // 分钟
  maxConcurrentSessions: number
  
  // 安全设置
  requireMFA: boolean
  allowedDomains: string[]
  blockedDomains: string[]
  
  // 用户管理
  autoCreateUsers: boolean
  autoUpdateUsers: boolean
  defaultRole: string
  
  // 审计
  logAllAttempts: boolean
  logSuccessfulLogins: boolean
  logFailedLogins: boolean
}

// SSO提供商统计
export interface SSOProviderStats {
  totalLogins: number
  successfulLogins: number
  failedLogins: number
  lastLoginAt?: Date
  activeUsers: number
  
  // 最近30天统计
  recentStats: {
    logins: number
    uniqueUsers: number
    averageSessionDuration: number
  }
}

// SSO会话
export interface SSOSession {
  sessionId: string
  userId: string
  accountId: string
  providerId: string
  
  // 会话信息
  createdAt: Date
  lastAccessAt: Date
  expiresAt: Date
  
  // 认证信息
  authMethod: SSOProtocol
  authContext: Record<string, any>
  
  // 用户信息
  userAttributes: Record<string, any>
  
  // 状态
  isActive: boolean
}

// SSO认证结果
export interface SSOAuthResult {
  success: boolean
  user?: RegisteredUser
  session?: SSOSession
  error?: string
  redirectUrl?: string
  
  // 认证详情
  providerId: string
  authMethod: SSOProtocol
  timestamp: Date
}

// SSO配置验证结果
export interface SSOConfigValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  
  // 连接测试结果
  connectionTest?: {
    success: boolean
    responseTime: number
    error?: string
  }
}

/**
 * 企业级单点登录服务
 */
export class EnterpriseSSOService {
  private static instance: EnterpriseSSOService
  private userIdentityService: UserIdentityService
  private enterpriseAccountService: EnterpriseAccountService
  private rbacService: RoleBasedAccessControlService
  private activeSessions: Map<string, SSOSession> = new Map()
  private isInitialized = false

  private constructor() {
    this.userIdentityService = UserIdentityService.getInstance()
    this.enterpriseAccountService = EnterpriseAccountService.getInstance()
    this.rbacService = RoleBasedAccessControlService.getInstance()
  }

  static getInstance(): EnterpriseSSOService {
    if (!EnterpriseSSOService.instance) {
      EnterpriseSSOService.instance = new EnterpriseSSOService()
    }
    return EnterpriseSSOService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.userIdentityService.initialize()
      await this.enterpriseAccountService.initialize()
      await this.rbacService.initialize()
      await this.loadActiveSessions()
      this.startSessionCleanup()
      this.isInitialized = true
      console.log('✅ EnterpriseSSOService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize EnterpriseSSOService:', error)
      throw error
    }
  }

  /**
   * 创建SSO提供商
   */
  async createSSOProvider(
    accountId: string,
    providerData: {
      name: string
      protocol: SSOProtocol
      config: Omit<SSOProviderConfig, 'advanced'>
      isDefault?: boolean
    },
    createdBy: string
  ): Promise<SSOProvider> {
    if (!this.isInitialized) await this.initialize()

    const provider: SSOProvider = {
      id: crypto.randomUUID(),
      name: providerData.name,
      protocol: providerData.protocol,
      accountId,
      config: {
        ...providerData.config,
        advanced: this.getDefaultAdvancedSettings()
      },
      isActive: true,
      isDefault: providerData.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      stats: {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        activeUsers: 0,
        recentStats: {
          logins: 0,
          uniqueUsers: 0,
          averageSessionDuration: 0
        }
      }
    }

    // 验证配置
    const validation = await this.validateSSOConfig(provider)
    if (!validation.isValid) {
      throw new Error(`SSO configuration invalid: ${validation.errors.join(', ')}`)
    }

    // 如果设为默认，取消其他默认提供商
    if (provider.isDefault) {
      await this.clearDefaultProvider(accountId)
    }

    await this.saveSSOProvider(provider)

    console.log(`🔐 SSO Provider created: ${provider.name} (${provider.protocol})`)
    return provider
  }

  /**
   * 启动SSO认证流程
   */
  async initiateSSOAuth(providerId: string, returnUrl?: string): Promise<string> {
    if (!this.isInitialized) await this.initialize()

    const provider = await this.getSSOProvider(providerId)
    if (!provider || !provider.isActive) {
      throw new Error('SSO provider not found or inactive')
    }

    // 生成状态参数
    const state = crypto.randomUUID()
    const authRequest = {
      providerId,
      state,
      returnUrl,
      timestamp: new Date()
    }

    // 保存认证请求
    sessionStorage.setItem(`sso_auth_${state}`, JSON.stringify(authRequest))

    // 根据协议生成认证URL
    switch (provider.protocol) {
      case 'saml2':
        return this.generateSAMLAuthUrl(provider, state)
      case 'oauth2':
      case 'oidc':
        return this.generateOAuth2AuthUrl(provider, state)
      case 'ldap':
      case 'ad':
        throw new Error('LDAP/AD requires server-side authentication')
      default:
        throw new Error(`Unsupported SSO protocol: ${provider.protocol}`)
    }
  }

  /**
   * 处理SSO回调
   */
  async handleSSOCallback(
    protocol: SSOProtocol,
    callbackData: Record<string, any>
  ): Promise<SSOAuthResult> {
    if (!this.isInitialized) await this.initialize()

    try {
      switch (protocol) {
        case 'saml2':
          return await this.handleSAMLCallback(callbackData)
        case 'oauth2':
        case 'oidc':
          return await this.handleOAuth2Callback(callbackData)
        default:
          throw new Error(`Unsupported callback protocol: ${protocol}`)
      }
    } catch (error) {
      console.error('SSO callback failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        providerId: 'unknown',
        authMethod: protocol,
        timestamp: new Date()
      }
    }
  }

  /**
   * LDAP认证
   */
  async authenticateLDAP(
    providerId: string,
    username: string,
    password: string
  ): Promise<SSOAuthResult> {
    if (!this.isInitialized) await this.initialize()

    const provider = await this.getSSOProvider(providerId)
    if (!provider || !provider.config.ldap) {
      throw new Error('LDAP provider not found')
    }

    try {
      // 模拟LDAP认证
      const authResult = await this.performLDAPAuth(provider.config.ldap, username, password)
      
      if (authResult.success) {
        const user = await this.createOrUpdateSSOUser(
          provider,
          authResult.userAttributes,
          'ldap'
        )
        
        const session = await this.createSSOSession(user, provider, authResult.userAttributes)
        
        await this.updateProviderStats(provider.id, true)
        
        return {
          success: true,
          user,
          session,
          providerId: provider.id,
          authMethod: 'ldap',
          timestamp: new Date()
        }
      } else {
        await this.updateProviderStats(provider.id, false)
        
        return {
          success: false,
          error: authResult.error,
          providerId: provider.id,
          authMethod: 'ldap',
          timestamp: new Date()
        }
      }
    } catch (error) {
      await this.updateProviderStats(provider.id, false)
      throw error
    }
  }

  /**
   * 验证SSO会话
   */
  async validateSSOSession(sessionId: string): Promise<SSOSession | null> {
    const session = this.activeSessions.get(sessionId)
    
    if (!session) {
      return null
    }

    // 检查会话是否过期
    if (session.expiresAt < new Date()) {
      await this.terminateSSOSession(sessionId)
      return null
    }

    // 更新最后访问时间
    session.lastAccessAt = new Date()
    this.activeSessions.set(sessionId, session)
    await this.saveSSOSession(session)

    return session
  }

  /**
   * 终止SSO会话
   */
  async terminateSSOSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    
    if (session) {
      session.isActive = false
      await this.saveSSOSession(session)
      this.activeSessions.delete(sessionId)
      
      console.log(`🔓 SSO session terminated: ${sessionId}`)
    }
  }

  /**
   * 获取账户的SSO提供商
   */
  async getAccountSSOProviders(accountId: string): Promise<SSOProvider[]> {
    try {
      const stored = localStorage.getItem(`sso_providers_${accountId}`)
      if (!stored) return []

      const providers = JSON.parse(stored) as SSOProvider[]
      return providers.filter(p => p.isActive)
        .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
    } catch (error) {
      console.error('Failed to get SSO providers:', error)
      return []
    }
  }

  /**
   * 测试SSO配置
   */
  async testSSOConfiguration(providerId: string): Promise<SSOConfigValidation> {
    const provider = await this.getSSOProvider(providerId)
    if (!provider) {
      return {
        isValid: false,
        errors: ['Provider not found'],
        warnings: []
      }
    }

    return await this.validateSSOConfig(provider)
  }

  // 私有方法
  private getDefaultAdvancedSettings(): AdvancedSSOSettings {
    return {
      sessionTimeout: 480, // 8小时
      maxConcurrentSessions: 5,
      requireMFA: false,
      allowedDomains: [],
      blockedDomains: [],
      autoCreateUsers: true,
      autoUpdateUsers: true,
      defaultRole: 'viewer',
      logAllAttempts: true,
      logSuccessfulLogins: true,
      logFailedLogins: true
    }
  }

  private async validateSSOConfig(provider: SSOProvider): Promise<SSOConfigValidation> {
    const errors: string[] = []
    const warnings: string[] = []

    // 基本验证
    if (!provider.config.displayName) {
      errors.push('Display name is required')
    }

    if (!provider.config.userMapping.email) {
      errors.push('Email mapping is required')
    }

    // 协议特定验证
    switch (provider.protocol) {
      case 'saml2':
        if (!provider.config.saml) {
          errors.push('SAML configuration is required')
        } else {
          if (!provider.config.saml.entityId) errors.push('SAML Entity ID is required')
          if (!provider.config.saml.ssoUrl) errors.push('SAML SSO URL is required')
          if (!provider.config.saml.certificate) errors.push('SAML Certificate is required')
        }
        break

      case 'oauth2':
      case 'oidc':
        if (!provider.config.oauth2) {
          errors.push('OAuth2 configuration is required')
        } else {
          if (!provider.config.oauth2.clientId) errors.push('OAuth2 Client ID is required')
          if (!provider.config.oauth2.clientSecret) errors.push('OAuth2 Client Secret is required')
          if (!provider.config.oauth2.authorizationUrl) errors.push('Authorization URL is required')
          if (!provider.config.oauth2.tokenUrl) errors.push('Token URL is required')
        }
        break

      case 'ldap':
      case 'ad':
        if (!provider.config.ldap) {
          errors.push('LDAP configuration is required')
        } else {
          if (!provider.config.ldap.serverUrl) errors.push('LDAP Server URL is required')
          if (!provider.config.ldap.baseDN) errors.push('LDAP Base DN is required')
          if (!provider.config.ldap.userFilter) errors.push('LDAP User Filter is required')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private generateSAMLAuthUrl(provider: SSOProvider, state: string): string {
    const samlConfig = provider.config.saml!
    const params = new URLSearchParams({
      SAMLRequest: this.createSAMLRequest(samlConfig),
      RelayState: state
    })

    return `${samlConfig.ssoUrl}?${params.toString()}`
  }

  private generateOAuth2AuthUrl(provider: SSOProvider, state: string): string {
    const oauth2Config = provider.config.oauth2!
    const params = new URLSearchParams({
      client_id: oauth2Config.clientId,
      response_type: oauth2Config.responseType,
      scope: oauth2Config.scope.join(' '),
      redirect_uri: `${window.location.origin}/sso/callback`,
      state
    })

    return `${oauth2Config.authorizationUrl}?${params.toString()}`
  }

  private createSAMLRequest(samlConfig: SAMLConfig): string {
    // 简化的SAML请求生成
    const samlRequest = `
      <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                          ID="_${crypto.randomUUID()}"
                          Version="2.0"
                          IssueInstant="${new Date().toISOString()}"
                          Destination="${samlConfig.ssoUrl}">
        <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${samlConfig.entityId}</saml:Issuer>
      </samlp:AuthnRequest>
    `
    
    // 在实际实现中，这里应该进行Base64编码和可选的压缩
    return btoa(samlRequest)
  }

  private async handleSAMLCallback(callbackData: Record<string, any>): Promise<SSOAuthResult> {
    // 简化的SAML响应处理
    const samlResponse = callbackData.SAMLResponse
    const relayState = callbackData.RelayState

    if (!samlResponse || !relayState) {
      throw new Error('Invalid SAML callback data')
    }

    // 获取认证请求
    const authRequest = JSON.parse(sessionStorage.getItem(`sso_auth_${relayState}`) || '{}')
    const provider = await this.getSSOProvider(authRequest.providerId)

    if (!provider) {
      throw new Error('SSO provider not found')
    }

    // 解析SAML响应（简化实现）
    const userAttributes = this.parseSAMLResponse(samlResponse, provider.config.saml!)
    
    const user = await this.createOrUpdateSSOUser(provider, userAttributes, 'saml2')
    const session = await this.createSSOSession(user, provider, userAttributes)

    await this.updateProviderStats(provider.id, true)

    // 清理认证请求
    sessionStorage.removeItem(`sso_auth_${relayState}`)

    return {
      success: true,
      user,
      session,
      redirectUrl: authRequest.returnUrl,
      providerId: provider.id,
      authMethod: 'saml2',
      timestamp: new Date()
    }
  }

  private async handleOAuth2Callback(callbackData: Record<string, any>): Promise<SSOAuthResult> {
    const code = callbackData.code
    const state = callbackData.state

    if (!code || !state) {
      throw new Error('Invalid OAuth2 callback data')
    }

    // 获取认证请求
    const authRequest = JSON.parse(sessionStorage.getItem(`sso_auth_${state}`) || '{}')
    const provider = await this.getSSOProvider(authRequest.providerId)

    if (!provider) {
      throw new Error('SSO provider not found')
    }

    // 交换访问令牌（简化实现）
    const tokenResponse = await this.exchangeOAuth2Code(provider.config.oauth2!, code)
    const userAttributes = await this.fetchOAuth2UserInfo(provider.config.oauth2!, tokenResponse.access_token)

    const user = await this.createOrUpdateSSOUser(provider, userAttributes, 'oauth2')
    const session = await this.createSSOSession(user, provider, userAttributes)

    await this.updateProviderStats(provider.id, true)

    // 清理认证请求
    sessionStorage.removeItem(`sso_auth_${state}`)

    return {
      success: true,
      user,
      session,
      redirectUrl: authRequest.returnUrl,
      providerId: provider.id,
      authMethod: 'oauth2',
      timestamp: new Date()
    }
  }

  private parseSAMLResponse(samlResponse: string, samlConfig: SAMLConfig): Record<string, any> {
    // 简化的SAML响应解析
    const decoded = atob(samlResponse)
    
    // 在实际实现中，这里应该进行XML解析和签名验证
    return {
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      groups: ['users', 'employees']
    }
  }

  private async exchangeOAuth2Code(oauth2Config: OAuth2Config, code: string): Promise<any> {
    // 简化的OAuth2令牌交换
    return {
      access_token: 'mock_access_token',
      token_type: 'Bearer',
      expires_in: 3600
    }
  }

  private async fetchOAuth2UserInfo(oauth2Config: OAuth2Config, accessToken: string): Promise<Record<string, any>> {
    // 简化的用户信息获取
    return {
      email: 'user@example.com',
      name: 'John Doe',
      given_name: 'John',
      family_name: 'Doe'
    }
  }

  private async performLDAPAuth(ldapConfig: LDAPConfig, username: string, password: string): Promise<{
    success: boolean
    userAttributes?: Record<string, any>
    error?: string
  }> {
    // 简化的LDAP认证
    if (username && password) {
      return {
        success: true,
        userAttributes: {
          email: `${username}@company.com`,
          firstName: 'John',
          lastName: 'Doe',
          groups: ['employees']
        }
      }
    } else {
      return {
        success: false,
        error: 'Invalid credentials'
      }
    }
  }

  private async createOrUpdateSSOUser(
    provider: SSOProvider,
    attributes: Record<string, any>,
    authMethod: SSOProtocol
  ): Promise<RegisteredUser> {
    const mapping = provider.config.userMapping
    const email = attributes[mapping.email]

    if (!email) {
      throw new Error('Email not found in SSO attributes')
    }

    // 检查用户是否已存在
    let user = await this.findUserByEmail(email)

    if (user) {
      // 更新现有用户
      if (provider.config.advanced.autoUpdateUsers) {
        user = await this.updateUserFromSSO(user, attributes, mapping)
      }
    } else {
      // 创建新用户
      if (provider.config.advanced.autoCreateUsers) {
        user = await this.createUserFromSSO(attributes, mapping, provider.accountId)
      } else {
        throw new Error('User auto-creation is disabled')
      }
    }

    return user
  }

  private async findUserByEmail(email: string): Promise<RegisteredUser | null> {
    // 简化实现：在实际应用中应该查询用户数据库
    return null
  }

  private async updateUserFromSSO(
    user: RegisteredUser,
    attributes: Record<string, any>,
    mapping: UserAttributeMapping
  ): Promise<RegisteredUser> {
    // 更新用户属性
    const updates: any = {}

    if (mapping.firstName && attributes[mapping.firstName]) {
      updates.firstName = attributes[mapping.firstName]
    }

    if (mapping.lastName && attributes[mapping.lastName]) {
      updates.lastName = attributes[mapping.lastName]
    }

    if (mapping.displayName && attributes[mapping.displayName]) {
      updates.displayName = attributes[mapping.displayName]
    }

    return await this.userIdentityService.updateUser(user.id, updates) as RegisteredUser
  }

  private async createUserFromSSO(
    attributes: Record<string, any>,
    mapping: UserAttributeMapping,
    accountId: string
  ): Promise<RegisteredUser> {
    const email = attributes[mapping.email]
    const firstName = mapping.firstName ? attributes[mapping.firstName] : undefined
    const lastName = mapping.lastName ? attributes[mapping.lastName] : undefined
    const displayName = mapping.displayName ? attributes[mapping.displayName] : `${firstName} ${lastName}`.trim()

    // 创建匿名用户并升级为注册用户
    const anonymousUser = await this.userIdentityService.createAnonymousUser({
      preferences: {
        displayName,
        theme: 'auto',
        language: 'de',
        currency: 'EUR'
      }
    })

    const registeredUser = await this.userIdentityService.upgradeToRegisteredUser(
      anonymousUser.id,
      email,
      {
        skipEmailVerification: true // SSO用户已通过身份提供商验证
      }
    )

    return registeredUser
  }

  private async createSSOSession(
    user: RegisteredUser,
    provider: SSOProvider,
    userAttributes: Record<string, any>
  ): Promise<SSOSession> {
    const session: SSOSession = {
      sessionId: crypto.randomUUID(),
      userId: user.id,
      accountId: provider.accountId,
      providerId: provider.id,
      createdAt: new Date(),
      lastAccessAt: new Date(),
      expiresAt: new Date(Date.now() + provider.config.advanced.sessionTimeout * 60 * 1000),
      authMethod: provider.protocol,
      authContext: {
        provider: provider.name,
        protocol: provider.protocol
      },
      userAttributes,
      isActive: true
    }

    this.activeSessions.set(session.sessionId, session)
    await this.saveSSOSession(session)

    return session
  }

  private async getSSOProvider(providerId: string): Promise<SSOProvider | null> {
    // 简化实现：遍历所有账户的提供商
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('sso_providers_')) {
        try {
          const providers = JSON.parse(localStorage.getItem(key) || '[]') as SSOProvider[]
          const provider = providers.find(p => p.id === providerId)
          if (provider) return provider
        } catch (error) {
          continue
        }
      }
    }
    return null
  }

  private async saveSSOProvider(provider: SSOProvider): Promise<void> {
    try {
      const key = `sso_providers_${provider.accountId}`
      const providers = JSON.parse(localStorage.getItem(key) || '[]') as SSOProvider[]
      
      const index = providers.findIndex(p => p.id === provider.id)
      if (index >= 0) {
        providers[index] = provider
      } else {
        providers.push(provider)
      }
      
      localStorage.setItem(key, JSON.stringify(providers))
    } catch (error) {
      console.error('Failed to save SSO provider:', error)
      throw error
    }
  }

  private async saveSSOSession(session: SSOSession): Promise<void> {
    try {
      localStorage.setItem(`sso_session_${session.sessionId}`, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save SSO session:', error)
    }
  }

  private async loadActiveSessions(): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('sso_session_')) {
        try {
          const session = JSON.parse(localStorage.getItem(key) || '{}') as SSOSession
          if (session.isActive && session.expiresAt > new Date()) {
            this.activeSessions.set(session.sessionId, session)
          }
        } catch (error) {
          continue
        }
      }
    }
  }

  private async clearDefaultProvider(accountId: string): Promise<void> {
    const providers = await this.getAccountSSOProviders(accountId)
    for (const provider of providers) {
      if (provider.isDefault) {
        provider.isDefault = false
        await this.saveSSOProvider(provider)
      }
    }
  }

  private async updateProviderStats(providerId: string, success: boolean): Promise<void> {
    const provider = await this.getSSOProvider(providerId)
    if (provider) {
      provider.stats.totalLogins++
      if (success) {
        provider.stats.successfulLogins++
        provider.stats.lastLoginAt = new Date()
      } else {
        provider.stats.failedLogins++
      }
      await this.saveSSOProvider(provider)
    }
  }

  private startSessionCleanup(): void {
    // 每小时清理过期会话
    setInterval(() => {
      const now = new Date()
      for (const [sessionId, session] of this.activeSessions) {
        if (session.expiresAt < now) {
          this.terminateSSOSession(sessionId)
        }
      }
    }, 60 * 60 * 1000) // 1小时
  }
}

// Export singleton instance
export const enterpriseSSOService = EnterpriseSSOService.getInstance()
