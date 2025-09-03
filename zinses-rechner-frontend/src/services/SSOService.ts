/**
 * 单点登录(SSO)集成服务
 * 支持SAML、OAuth2、OpenID Connect等企业级认证协议
 */

import { authService } from './AuthService'

// SSO相关类型定义
export interface SSOProvider {
  id: string
  name: string
  type: SSOProviderType
  displayName: string
  logo?: string
  description?: string
  isActive: boolean
  configuration: SSOConfiguration
  metadata?: SSOMetadata
  createdAt: Date
  updatedAt: Date
}

export type SSOProviderType = 'saml' | 'oauth2' | 'oidc' | 'ldap' | 'azure_ad' | 'google_workspace' | 'okta'

export interface SSOConfiguration {
  // SAML配置
  saml?: SAMLConfiguration
  // OAuth2配置
  oauth2?: OAuth2Configuration
  // OpenID Connect配置
  oidc?: OIDCConfiguration
  // LDAP配置
  ldap?: LDAPConfiguration
  // 通用配置
  common: CommonSSOConfiguration
}

export interface SAMLConfiguration {
  entityId: string
  ssoUrl: string
  sloUrl?: string
  x509Certificate: string
  signatureAlgorithm: 'RSA-SHA1' | 'RSA-SHA256'
  digestAlgorithm: 'SHA1' | 'SHA256'
  nameIdFormat: string
  attributeMapping: AttributeMapping
  signRequests: boolean
  wantAssertionsSigned: boolean
  wantResponseSigned: boolean
}

export interface OAuth2Configuration {
  clientId: string
  clientSecret: string
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl?: string
  scope: string[]
  responseType: 'code' | 'token' | 'id_token'
  grantType: 'authorization_code' | 'implicit' | 'client_credentials'
  redirectUri: string
  state?: string
  pkce: boolean
}

export interface OIDCConfiguration {
  clientId: string
  clientSecret: string
  discoveryUrl: string
  scope: string[]
  responseType: string
  redirectUri: string
  postLogoutRedirectUri?: string
  clockSkew: number
  maxAge?: number
  acrValues?: string[]
}

export interface LDAPConfiguration {
  host: string
  port: number
  baseDN: string
  bindDN: string
  bindPassword: string
  userSearchBase: string
  userSearchFilter: string
  groupSearchBase?: string
  groupSearchFilter?: string
  attributeMapping: AttributeMapping
  useSSL: boolean
  useTLS: boolean
  timeout: number
}

export interface CommonSSOConfiguration {
  autoProvision: boolean
  defaultRole: string
  allowedDomains?: string[]
  blockedDomains?: string[]
  sessionTimeout: number
  requireMFA: boolean
  enableJIT: boolean // Just-In-Time provisioning
  customClaims?: Record<string, string>
}

export interface AttributeMapping {
  userId: string
  email: string
  firstName: string
  lastName: string
  displayName?: string
  groups?: string
  roles?: string
  department?: string
  title?: string
  phone?: string
  customAttributes?: Record<string, string>
}

export interface SSOMetadata {
  lastSync?: Date
  userCount?: number
  groupCount?: number
  errorCount: number
  lastError?: string
  healthStatus: 'healthy' | 'warning' | 'error'
  responseTime?: number
}

export interface SSOAuthRequest {
  providerId: string
  returnUrl?: string
  state?: string
  nonce?: string
  codeChallenge?: string
  codeChallengeMethod?: 'S256' | 'plain'
}

export interface SSOAuthResponse {
  success: boolean
  user?: SSOUser
  tokens?: SSOTokens
  error?: string
  errorDescription?: string
  state?: string
}

export interface SSOUser {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  groups: string[]
  roles: string[]
  attributes: Record<string, any>
  providerId: string
  providerUserId: string
  lastLogin: Date
  isActive: boolean
}

export interface SSOTokens {
  accessToken: string
  refreshToken?: string
  idToken?: string
  tokenType: string
  expiresIn: number
  scope?: string
}

export interface SSOSession {
  id: string
  userId: string
  providerId: string
  sessionIndex?: string
  nameId?: string
  createdAt: Date
  expiresAt: Date
  lastActivity: Date
  ipAddress: string
  userAgent: string
  isActive: boolean
}

export class SSOService {
  private static instance: SSOService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private providers: Map<string, SSOProvider> = new Map()
  private currentSession: SSOSession | null = null

  private constructor() {}

  public static getInstance(): SSOService {
    if (!SSOService.instance) {
      SSOService.instance = new SSOService()
    }
    return SSOService.instance
  }

  /**
   * 获取可用的SSO提供商
   */
  public async getAvailableProviders(): Promise<SSOProvider[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sso/providers`)
      const data = await response.json()
      
      if (response.ok) {
        const providers = data.providers || []
        providers.forEach((provider: SSOProvider) => {
          this.providers.set(provider.id, provider)
        })
        return providers.filter(p => p.isActive)
      }
      
      return []
    } catch (error) {
      console.error('获取SSO提供商失败:', error)
      return []
    }
  }

  /**
   * 发起SSO认证
   */
  public async initiateAuth(request: SSOAuthRequest): Promise<string> {
    const provider = this.providers.get(request.providerId)
    if (!provider) {
      throw new Error(`SSO提供商不存在: ${request.providerId}`)
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/sso/auth/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      const data = await response.json()
      
      if (response.ok) {
        return data.authUrl
      } else {
        throw new Error(data.error || 'SSO认证发起失败')
      }
    } catch (error) {
      console.error('SSO认证发起失败:', error)
      throw error
    }
  }

  /**
   * 处理SSO回调
   */
  public async handleCallback(
    providerId: string,
    callbackData: Record<string, any>
  ): Promise<SSOAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sso/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId,
          ...callbackData
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // 更新认证状态
        if (data.tokens) {
          await authService.setTokens(data.tokens.accessToken, data.tokens.refreshToken)
        }
        
        // 创建SSO会话
        if (data.user) {
          this.currentSession = await this.createSession(data.user, providerId)
        }
        
        return data
      } else {
        return {
          success: false,
          error: data.error || 'SSO认证失败',
          errorDescription: data.errorDescription
        }
      }
    } catch (error) {
      console.error('SSO回调处理失败:', error)
      return {
        success: false,
        error: 'SSO回调处理失败',
        errorDescription: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 发起SSO登出
   */
  public async initiateLogout(returnUrl?: string): Promise<string | null> {
    if (!this.currentSession) {
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/sso/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({
          sessionId: this.currentSession.id,
          returnUrl
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        this.currentSession = null
        return data.logoutUrl || null
      }
      
      return null
    } catch (error) {
      console.error('SSO登出发起失败:', error)
      return null
    }
  }

  /**
   * 验证SSO会话
   */
  public async validateSession(): Promise<boolean> {
    if (!this.currentSession) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/sso/session/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({
          sessionId: this.currentSession.id
        })
      })

      const data = await response.json()
      return response.ok && data.valid
    } catch (error) {
      console.error('SSO会话验证失败:', error)
      return false
    }
  }

  /**
   * 刷新SSO令牌
   */
  public async refreshTokens(): Promise<SSOTokens | null> {
    if (!this.currentSession) {
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/sso/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({
          sessionId: this.currentSession.id
        })
      })

      const data = await response.json()
      
      if (response.ok && data.tokens) {
        await authService.setTokens(data.tokens.accessToken, data.tokens.refreshToken)
        return data.tokens
      }
      
      return null
    } catch (error) {
      console.error('SSO令牌刷新失败:', error)
      return null
    }
  }

  /**
   * 获取用户SSO信息
   */
  public async getUserSSOInfo(): Promise<SSOUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sso/user/info`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      const data = await response.json()
      return response.ok ? data.user : null
    } catch (error) {
      console.error('获取用户SSO信息失败:', error)
      return null
    }
  }

  /**
   * 创建SSO会话
   */
  private async createSession(user: SSOUser, providerId: string): Promise<SSOSession> {
    const session: SSOSession = {
      id: this.generateSessionId(),
      userId: user.id,
      providerId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8小时
      lastActivity: new Date(),
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      isActive: true
    }

    return session
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return 'sso_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
  }

  /**
   * 获取客户端IP地址
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 获取当前SSO会话
   */
  public getCurrentSession(): SSOSession | null {
    return this.currentSession
  }

  /**
   * 检查是否通过SSO认证
   */
  public isAuthenticated(): boolean {
    return this.currentSession !== null && this.currentSession.isActive
  }

  /**
   * 获取支持的SSO提供商类型
   */
  public getSupportedProviderTypes(): Array<{ type: SSOProviderType; name: string; description: string }> {
    return [
      {
        type: 'saml',
        name: 'SAML 2.0',
        description: 'Security Assertion Markup Language 2.0'
      },
      {
        type: 'oauth2',
        name: 'OAuth 2.0',
        description: 'Open Authorization 2.0'
      },
      {
        type: 'oidc',
        name: 'OpenID Connect',
        description: 'OpenID Connect 1.0'
      },
      {
        type: 'ldap',
        name: 'LDAP',
        description: 'Lightweight Directory Access Protocol'
      },
      {
        type: 'azure_ad',
        name: 'Azure Active Directory',
        description: 'Microsoft Azure Active Directory'
      },
      {
        type: 'google_workspace',
        name: 'Google Workspace',
        description: 'Google Workspace (formerly G Suite)'
      },
      {
        type: 'okta',
        name: 'Okta',
        description: 'Okta Identity Platform'
      }
    ]
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.providers.clear()
    this.currentSession = null
  }
}

// 导出单例实例
export const ssoService = SSOService.getInstance()
