/**
 * API密钥管理和认证系统
 * 支持API密钥生成、管理、权限控制和撤销，集成OAuth2.0和JWT认证，实现细粒度的API访问控制
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { DashboardPermissionController } from './DashboardPermissionController'

// API密钥
export interface APIKey {
  id: string
  key: string
  name: string
  description?: string
  
  // 所有者信息
  userId: string
  developerId?: string
  applicationId?: string
  
  // 权限和作用域
  permissions: APIPermission[]
  scopes: string[]
  
  // 限制设置
  restrictions: APIKeyRestrictions
  
  // 状态信息
  status: 'active' | 'inactive' | 'revoked' | 'expired'
  
  // 使用统计
  usage: {
    totalRequests: number
    lastUsed?: Date
    dailyLimit: number
    monthlyLimit: number
    currentDailyUsage: number
    currentMonthlyUsage: number
  }
  
  // 时间信息
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
  lastRotatedAt?: Date
}

// API权限
export interface APIPermission {
  resource: string // 资源类型：users, dashboards, reports, exports
  actions: string[] // 操作：read, write, delete, export
  conditions?: PermissionCondition[]
}

export interface PermissionCondition {
  type: 'ip_whitelist' | 'time_range' | 'rate_limit' | 'data_filter'
  config: any
}

// API密钥限制
export interface APIKeyRestrictions {
  // IP限制
  ipWhitelist?: string[]
  ipBlacklist?: string[]
  
  // 时间限制
  timeRestrictions?: {
    allowedHours: number[] // 0-23
    allowedDays: number[] // 0-6 (Sunday-Saturday)
    timezone: string
  }
  
  // 速率限制
  rateLimit: {
    requests: number
    window: number // 秒
    burst?: number
  }
  
  // 数据访问限制
  dataFilters?: {
    allowedAccounts?: string[]
    allowedDataTypes?: string[]
    maxRecords?: number
  }
  
  // 功能限制
  featureRestrictions?: {
    allowedEndpoints?: string[]
    blockedEndpoints?: string[]
    maxExportSize?: number
  }
}

// API密钥验证结果
export interface APIKeyValidation {
  valid: boolean
  key?: APIKey
  error?: string
  remainingRequests?: number
  resetTime?: Date
}

// OAuth应用
export interface OAuthApp {
  id: string
  clientId: string
  clientSecret: string
  name: string
  description?: string
  
  // 应用信息
  developerId: string
  website?: string
  logoUrl?: string
  
  // OAuth配置
  redirectUris: string[]
  scopes: string[]
  grantTypes: ('authorization_code' | 'client_credentials' | 'refresh_token')[]
  
  // 安全设置
  requirePKCE: boolean
  allowedOrigins?: string[]
  
  // 状态
  status: 'active' | 'inactive' | 'suspended'
  
  // 统计
  stats: {
    totalAuthorizations: number
    activeTokens: number
    lastUsed?: Date
  }
  
  // 时间信息
  createdAt: Date
  updatedAt: Date
}

// OAuth请求
export interface OAuthRequest {
  type: 'authorization' | 'token' | 'refresh'
  clientId: string
  clientSecret?: string
  redirectUri?: string
  code?: string
  refreshToken?: string
  grantType: string
  scope?: string
  state?: string
  codeChallenge?: string
  codeChallengeMethod?: string
}

// OAuth响应
export interface OAuthResponse {
  success: boolean
  data?: {
    accessToken?: string
    refreshToken?: string
    tokenType?: string
    expiresIn?: number
    scope?: string
    state?: string
    authorizationUrl?: string
  }
  error?: {
    code: string
    description: string
  }
}

// 令牌响应
export interface TokenResponse {
  accessToken: string
  refreshToken?: string
  tokenType: 'Bearer'
  expiresIn: number
  scope: string
}

// JWT载荷
export interface JWTPayload {
  sub: string // 主题（用户ID）
  iss: string // 签发者
  aud: string // 受众
  exp: number // 过期时间
  iat: number // 签发时间
  jti: string // JWT ID
  
  // 自定义声明
  userId?: string
  developerId?: string
  applicationId?: string
  scopes: string[]
  permissions: string[]
}

// JWT验证结果
export interface JWTValidation {
  valid: boolean
  payload?: JWTPayload
  error?: string
  expired?: boolean
}

/**
 * API密钥管理和认证系统
 */
export class APIKeyManagementService {
  private static instance: APIKeyManagementService
  private permissionController: DashboardPermissionController
  
  private apiKeys: Map<string, APIKey> = new Map()
  private oauthApps: Map<string, OAuthApp> = new Map()
  private accessTokens: Map<string, { token: string; payload: JWTPayload; expiresAt: Date }> = new Map()
  private refreshTokens: Map<string, { token: string; userId: string; clientId: string; expiresAt: Date }> = new Map()
  
  private jwtSecret = 'your-jwt-secret-key' // 应该从环境变量获取
  private isInitialized = false

  private constructor() {
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): APIKeyManagementService {
    if (!APIKeyManagementService.instance) {
      APIKeyManagementService.instance = new APIKeyManagementService()
    }
    return APIKeyManagementService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.permissionController.initialize()
      await this.loadAPIKeys()
      await this.loadOAuthApps()
      this.startTokenCleanup()
      this.isInitialized = true
      console.log('✅ APIKeyManagementService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize APIKeyManagementService:', error)
      throw error
    }
  }

  /**
   * 生成API密钥
   */
  async generateAPIKey(
    userId: string,
    config: {
      name: string
      description?: string
      permissions: APIPermission[]
      scopes?: string[]
      restrictions?: Partial<APIKeyRestrictions>
      expiresIn?: number // 秒
    }
  ): Promise<APIKey> {
    if (!this.isInitialized) await this.initialize()

    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      key: this.generateSecureKey(),
      name: config.name,
      description: config.description,
      userId,
      permissions: config.permissions,
      scopes: config.scopes || [],
      restrictions: {
        rateLimit: { requests: 1000, window: 3600 },
        ...config.restrictions
      },
      status: 'active',
      usage: {
        totalRequests: 0,
        dailyLimit: 10000,
        monthlyLimit: 100000,
        currentDailyUsage: 0,
        currentMonthlyUsage: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: config.expiresIn ? new Date(Date.now() + config.expiresIn * 1000) : undefined
    }

    this.apiKeys.set(apiKey.key, apiKey)
    await this.saveAPIKey(apiKey)

    console.log(`🔑 API key generated: ${apiKey.name} for user ${userId}`)
    return apiKey
  }

  /**
   * 撤销API密钥
   */
  async revokeAPIKey(keyId: string, userId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const apiKey = Array.from(this.apiKeys.values()).find(k => k.id === keyId)
    if (!apiKey) {
      throw new Error('API key not found')
    }

    if (apiKey.userId !== userId) {
      throw new Error('Insufficient permissions to revoke API key')
    }

    apiKey.status = 'revoked'
    apiKey.updatedAt = new Date()

    await this.saveAPIKey(apiKey)

    console.log(`🚫 API key revoked: ${keyId}`)
  }

  /**
   * 轮换API密钥
   */
  async rotateAPIKey(keyId: string, userId: string): Promise<APIKey> {
    if (!this.isInitialized) await this.initialize()

    const oldKey = Array.from(this.apiKeys.values()).find(k => k.id === keyId)
    if (!oldKey) {
      throw new Error('API key not found')
    }

    if (oldKey.userId !== userId) {
      throw new Error('Insufficient permissions to rotate API key')
    }

    // 创建新密钥
    const newKey: APIKey = {
      ...oldKey,
      key: this.generateSecureKey(),
      updatedAt: new Date(),
      lastRotatedAt: new Date()
    }

    // 移除旧密钥
    this.apiKeys.delete(oldKey.key)
    
    // 添加新密钥
    this.apiKeys.set(newKey.key, newKey)
    
    await this.saveAPIKey(newKey)

    console.log(`🔄 API key rotated: ${keyId}`)
    return newKey
  }

  /**
   * 验证API密钥
   */
  async validateAPIKey(key: string, request?: { ip?: string; endpoint?: string }): Promise<APIKeyValidation> {
    if (!this.isInitialized) await this.initialize()

    const apiKey = this.apiKeys.get(key)
    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' }
    }

    // 检查状态
    if (apiKey.status !== 'active') {
      return { valid: false, error: 'API key is not active' }
    }

    // 检查过期时间
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.status = 'expired'
      await this.saveAPIKey(apiKey)
      return { valid: false, error: 'API key has expired' }
    }

    // 检查IP限制
    if (request?.ip && !this.checkIPRestrictions(request.ip, apiKey.restrictions)) {
      return { valid: false, error: 'IP address not allowed' }
    }

    // 检查时间限制
    if (!this.checkTimeRestrictions(apiKey.restrictions)) {
      return { valid: false, error: 'Access not allowed at this time' }
    }

    // 检查端点限制
    if (request?.endpoint && !this.checkEndpointRestrictions(request.endpoint, apiKey.restrictions)) {
      return { valid: false, error: 'Endpoint access not allowed' }
    }

    // 检查速率限制
    const rateLimitCheck = await this.checkRateLimit(apiKey)
    if (!rateLimitCheck.allowed) {
      return { 
        valid: false, 
        error: 'Rate limit exceeded',
        remainingRequests: rateLimitCheck.remaining,
        resetTime: rateLimitCheck.resetTime
      }
    }

    // 更新使用统计
    await this.updateUsageStats(apiKey)

    return { 
      valid: true, 
      key: apiKey,
      remainingRequests: rateLimitCheck.remaining,
      resetTime: rateLimitCheck.resetTime
    }
  }

  /**
   * 检查权限
   */
  async checkPermission(keyId: string, resource: string, action: string): Promise<boolean> {
    if (!this.isInitialized) await this.initialize()

    const apiKey = Array.from(this.apiKeys.values()).find(k => k.id === keyId)
    if (!apiKey || apiKey.status !== 'active') {
      return false
    }

    // 检查权限
    for (const permission of apiKey.permissions) {
      if (permission.resource === resource && permission.actions.includes(action)) {
        // 检查条件
        if (permission.conditions) {
          for (const condition of permission.conditions) {
            if (!await this.checkPermissionCondition(condition, apiKey)) {
              return false
            }
          }
        }
        return true
      }
    }

    return false
  }

  /**
   * 更新权限
   */
  async updatePermissions(keyId: string, userId: string, permissions: APIPermission[]): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const apiKey = Array.from(this.apiKeys.values()).find(k => k.id === keyId)
    if (!apiKey) {
      throw new Error('API key not found')
    }

    if (apiKey.userId !== userId) {
      throw new Error('Insufficient permissions to update API key')
    }

    apiKey.permissions = permissions
    apiKey.updatedAt = new Date()

    await this.saveAPIKey(apiKey)

    console.log(`🔧 API key permissions updated: ${keyId}`)
  }

  /**
   * 创建OAuth应用
   */
  async createOAuthApp(
    developerId: string,
    config: {
      name: string
      description?: string
      website?: string
      redirectUris: string[]
      scopes: string[]
    }
  ): Promise<OAuthApp> {
    if (!this.isInitialized) await this.initialize()

    const oauthApp: OAuthApp = {
      id: crypto.randomUUID(),
      clientId: this.generateClientId(),
      clientSecret: this.generateClientSecret(),
      name: config.name,
      description: config.description,
      developerId,
      website: config.website,
      redirectUris: config.redirectUris,
      scopes: config.scopes,
      grantTypes: ['authorization_code', 'refresh_token'],
      requirePKCE: true,
      status: 'active',
      stats: {
        totalAuthorizations: 0,
        activeTokens: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.oauthApps.set(oauthApp.clientId, oauthApp)
    await this.saveOAuthApp(oauthApp)

    console.log(`📱 OAuth app created: ${oauthApp.name} for developer ${developerId}`)
    return oauthApp
  }

  /**
   * 处理OAuth流程
   */
  async handleOAuthFlow(request: OAuthRequest): Promise<OAuthResponse> {
    if (!this.isInitialized) await this.initialize()

    const app = this.oauthApps.get(request.clientId)
    if (!app || app.status !== 'active') {
      return {
        success: false,
        error: { code: 'invalid_client', description: 'Invalid client ID' }
      }
    }

    switch (request.type) {
      case 'authorization':
        return await this.handleAuthorizationRequest(request, app)
      case 'token':
        return await this.handleTokenRequest(request, app)
      case 'refresh':
        return await this.handleRefreshRequest(request, app)
      default:
        return {
          success: false,
          error: { code: 'unsupported_grant_type', description: 'Unsupported grant type' }
        }
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    if (!this.isInitialized) await this.initialize()

    const tokenData = this.refreshTokens.get(refreshToken)
    if (!tokenData || tokenData.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token')
    }

    const app = this.oauthApps.get(tokenData.clientId)
    if (!app) {
      throw new Error('OAuth application not found')
    }

    // 生成新的访问令牌
    const payload: JWTPayload = {
      sub: tokenData.userId,
      iss: 'zinses-rechner-api',
      aud: tokenData.clientId,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1小时
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
      userId: tokenData.userId,
      scopes: app.scopes,
      permissions: []
    }

    const accessToken = await this.generateJWT(payload)

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: app.scopes.join(' ')
    }
  }

  /**
   * 生成JWT
   */
  async generateJWT(payload: JWTPayload): Promise<string> {
    // 简化实现：使用基本的JWT结构
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))
    const signature = btoa(`${encodedHeader}.${encodedPayload}.${this.jwtSecret}`)

    const token = `${encodedHeader}.${encodedPayload}.${signature}`
    
    // 存储令牌
    this.accessTokens.set(token, {
      token,
      payload,
      expiresAt: new Date(payload.exp * 1000)
    })

    return token
  }

  /**
   * 验证JWT
   */
  async validateJWT(token: string): Promise<JWTValidation> {
    if (!this.isInitialized) await this.initialize()

    try {
      const tokenData = this.accessTokens.get(token)
      if (!tokenData) {
        return { valid: false, error: 'Token not found' }
      }

      if (tokenData.expiresAt < new Date()) {
        this.accessTokens.delete(token)
        return { valid: false, error: 'Token expired', expired: true }
      }

      return { valid: true, payload: tokenData.payload }
    } catch (error) {
      return { valid: false, error: 'Invalid token format' }
    }
  }

  // 私有方法
  private generateSecureKey(): string {
    const prefix = 'ak_'
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    const key = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
    return prefix + key
  }

  private generateClientId(): string {
    return 'client_' + crypto.randomUUID().replace(/-/g, '')
  }

  private generateClientSecret(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  private checkIPRestrictions(ip: string, restrictions: APIKeyRestrictions): boolean {
    if (restrictions.ipWhitelist && restrictions.ipWhitelist.length > 0) {
      return restrictions.ipWhitelist.includes(ip)
    }

    if (restrictions.ipBlacklist && restrictions.ipBlacklist.includes(ip)) {
      return false
    }

    return true
  }

  private checkTimeRestrictions(restrictions: APIKeyRestrictions): boolean {
    if (!restrictions.timeRestrictions) {
      return true
    }

    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()

    if (restrictions.timeRestrictions.allowedHours && 
        !restrictions.timeRestrictions.allowedHours.includes(hour)) {
      return false
    }

    if (restrictions.timeRestrictions.allowedDays && 
        !restrictions.timeRestrictions.allowedDays.includes(day)) {
      return false
    }

    return true
  }

  private checkEndpointRestrictions(endpoint: string, restrictions: APIKeyRestrictions): boolean {
    if (!restrictions.featureRestrictions) {
      return true
    }

    if (restrictions.featureRestrictions.allowedEndpoints) {
      return restrictions.featureRestrictions.allowedEndpoints.some(pattern => 
        endpoint.match(new RegExp(pattern))
      )
    }

    if (restrictions.featureRestrictions.blockedEndpoints) {
      return !restrictions.featureRestrictions.blockedEndpoints.some(pattern => 
        endpoint.match(new RegExp(pattern))
      )
    }

    return true
  }

  private async checkRateLimit(apiKey: APIKey): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const now = Date.now()
    const windowStart = Math.floor(now / (apiKey.restrictions.rateLimit.window * 1000)) * apiKey.restrictions.rateLimit.window * 1000
    const resetTime = new Date(windowStart + apiKey.restrictions.rateLimit.window * 1000)

    // 简化实现：基于内存的速率限制
    const key = `rate_limit_${apiKey.id}_${windowStart}`
    const currentCount = parseInt(localStorage.getItem(key) || '0')

    if (currentCount >= apiKey.restrictions.rateLimit.requests) {
      return { allowed: false, remaining: 0, resetTime }
    }

    return { 
      allowed: true, 
      remaining: apiKey.restrictions.rateLimit.requests - currentCount - 1, 
      resetTime 
    }
  }

  private async updateUsageStats(apiKey: APIKey): Promise<void> {
    apiKey.usage.totalRequests++
    apiKey.usage.lastUsed = new Date()
    apiKey.usage.currentDailyUsage++
    apiKey.usage.currentMonthlyUsage++

    // 更新速率限制计数
    const now = Date.now()
    const windowStart = Math.floor(now / (apiKey.restrictions.rateLimit.window * 1000)) * apiKey.restrictions.rateLimit.window * 1000
    const key = `rate_limit_${apiKey.id}_${windowStart}`
    const currentCount = parseInt(localStorage.getItem(key) || '0')
    localStorage.setItem(key, (currentCount + 1).toString())

    await this.saveAPIKey(apiKey)
  }

  private async checkPermissionCondition(condition: PermissionCondition, apiKey: APIKey): Promise<boolean> {
    switch (condition.type) {
      case 'rate_limit':
        const rateLimitCheck = await this.checkRateLimit(apiKey)
        return rateLimitCheck.allowed
      case 'ip_whitelist':
        // 需要请求上下文来检查IP
        return true
      default:
        return true
    }
  }

  private async handleAuthorizationRequest(request: OAuthRequest, app: OAuthApp): Promise<OAuthResponse> {
    // 简化实现：生成授权URL
    const authUrl = `/oauth/authorize?client_id=${app.clientId}&redirect_uri=${request.redirectUri}&scope=${request.scope}&state=${request.state}`
    
    return {
      success: true,
      data: {
        authorizationUrl: authUrl,
        state: request.state
      }
    }
  }

  private async handleTokenRequest(request: OAuthRequest, app: OAuthApp): Promise<OAuthResponse> {
    // 简化实现：生成访问令牌
    const payload: JWTPayload = {
      sub: 'user_123',
      iss: 'zinses-rechner-api',
      aud: app.clientId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
      userId: 'user_123',
      scopes: app.scopes,
      permissions: []
    }

    const accessToken = await this.generateJWT(payload)
    const refreshToken = crypto.randomUUID()

    // 存储刷新令牌
    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      userId: 'user_123',
      clientId: app.clientId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天
    })

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: app.scopes.join(' ')
      }
    }
  }

  private async handleRefreshRequest(request: OAuthRequest, app: OAuthApp): Promise<OAuthResponse> {
    if (!request.refreshToken) {
      return {
        success: false,
        error: { code: 'invalid_request', description: 'Refresh token required' }
      }
    }

    try {
      const tokenResponse = await this.refreshAccessToken(request.refreshToken)
      return {
        success: true,
        data: tokenResponse
      }
    } catch (error) {
      return {
        success: false,
        error: { code: 'invalid_grant', description: 'Invalid refresh token' }
      }
    }
  }

  private async loadAPIKeys(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('api_key_')) {
          const apiKey = JSON.parse(localStorage.getItem(key) || '{}') as APIKey
          this.apiKeys.set(apiKey.key, apiKey)
        }
      }
      console.log(`🔑 Loaded ${this.apiKeys.size} API keys`)
    } catch (error) {
      console.error('Failed to load API keys:', error)
    }
  }

  private async loadOAuthApps(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('oauth_app_')) {
          const app = JSON.parse(localStorage.getItem(key) || '{}') as OAuthApp
          this.oauthApps.set(app.clientId, app)
        }
      }
      console.log(`📱 Loaded ${this.oauthApps.size} OAuth apps`)
    } catch (error) {
      console.error('Failed to load OAuth apps:', error)
    }
  }

  private async saveAPIKey(apiKey: APIKey): Promise<void> {
    try {
      localStorage.setItem(`api_key_${apiKey.id}`, JSON.stringify(apiKey))
    } catch (error) {
      console.error('Failed to save API key:', error)
      throw error
    }
  }

  private async saveOAuthApp(app: OAuthApp): Promise<void> {
    try {
      localStorage.setItem(`oauth_app_${app.id}`, JSON.stringify(app))
    } catch (error) {
      console.error('Failed to save OAuth app:', error)
      throw error
    }
  }

  private startTokenCleanup(): void {
    setInterval(() => {
      const now = new Date()
      let cleanedCount = 0

      // 清理过期的访问令牌
      for (const [token, data] of this.accessTokens) {
        if (data.expiresAt <= now) {
          this.accessTokens.delete(token)
          cleanedCount++
        }
      }

      // 清理过期的刷新令牌
      for (const [token, data] of this.refreshTokens) {
        if (data.expiresAt <= now) {
          this.refreshTokens.delete(token)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned ${cleanedCount} expired tokens`)
      }
    }, 10 * 60 * 1000) // 每10分钟清理一次
  }
}

// Export singleton instance
export const apiKeyManagementService = APIKeyManagementService.getInstance()
