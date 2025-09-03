/**
 * 企业级团队管理服务
 * 提供团队管理、权限控制、组织架构等企业级功能
 */

import { authService } from './AuthService'

// 团队和组织相关类型定义
export interface Organization {
  id: string
  name: string
  displayName: string
  description?: string
  domain: string
  logo?: string
  settings: OrganizationSettings
  subscription: SubscriptionInfo
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface OrganizationSettings {
  allowedDomains: string[]
  requireEmailVerification: boolean
  enableSSO: boolean
  ssoProvider?: 'google' | 'microsoft' | 'okta' | 'custom'
  defaultRole: TeamRole
  maxUsers: number
  features: OrganizationFeatures
  branding: BrandingSettings
  security: SecuritySettings
}

export interface OrganizationFeatures {
  advancedCalculators: boolean
  bulkCalculations: boolean
  customReports: boolean
  apiAccess: boolean
  whiteLabeling: boolean
  prioritySupport: boolean
  auditLogs: boolean
  dataExport: boolean
}

export interface BrandingSettings {
  primaryColor: string
  secondaryColor: string
  logo?: string
  favicon?: string
  customDomain?: string
  hideZinsesRechnerBranding: boolean
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy
  sessionTimeout: number
  ipWhitelist: string[]
  twoFactorRequired: boolean
  auditLogRetention: number
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxAge: number
}

export interface SubscriptionInfo {
  plan: 'starter' | 'professional' | 'enterprise' | 'custom'
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  startDate: Date
  endDate?: Date
  billingCycle: 'monthly' | 'yearly'
  maxUsers: number
  features: string[]
  price: number
  currency: string
}

export interface Team {
  id: string
  organizationId: string
  name: string
  description?: string
  parentTeamId?: string
  members: TeamMember[]
  permissions: TeamPermissions
  settings: TeamSettings
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface TeamMember {
  userId: string
  email: string
  displayName: string
  role: TeamRole
  permissions: UserPermissions
  joinedAt: Date
  lastActiveAt?: Date
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  invitedBy?: string
}

export type TeamRole = 'owner' | 'admin' | 'manager' | 'analyst' | 'viewer'

export interface TeamPermissions {
  canCreateCalculations: boolean
  canEditCalculations: boolean
  canDeleteCalculations: boolean
  canShareCalculations: boolean
  canExportData: boolean
  canManageTeam: boolean
  canViewReports: boolean
  canCreateReports: boolean
  canAccessAPI: boolean
  canManageSettings: boolean
}

export interface UserPermissions extends TeamPermissions {
  canInviteUsers: boolean
  canRemoveUsers: boolean
  canChangeRoles: boolean
  canViewAuditLogs: boolean
  canManageBilling: boolean
}

export interface TeamSettings {
  defaultCalculatorAccess: string[]
  allowGuestAccess: boolean
  requireApprovalForSharing: boolean
  dataRetentionDays: number
  notificationSettings: NotificationSettings
}

export interface NotificationSettings {
  emailNotifications: boolean
  slackIntegration?: SlackIntegration
  webhookUrl?: string
  notifyOnNewCalculations: boolean
  notifyOnSharedCalculations: boolean
  notifyOnTeamChanges: boolean
  notifyOnSystemUpdates: boolean
}

export interface SlackIntegration {
  webhookUrl: string
  channel: string
  enabled: boolean
}

export interface TeamInvitation {
  id: string
  organizationId: string
  teamId?: string
  email: string
  role: TeamRole
  invitedBy: string
  invitedAt: Date
  expiresAt: Date
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  message?: string
}

export interface AuditLogEntry {
  id: string
  organizationId: string
  userId: string
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
}

export class EnterpriseTeamService {
  private static instance: EnterpriseTeamService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {}

  public static getInstance(): EnterpriseTeamService {
    if (!EnterpriseTeamService.instance) {
      EnterpriseTeamService.instance = new EnterpriseTeamService()
    }
    return EnterpriseTeamService.instance
  }

  /**
   * 创建组织
   */
  public async createOrganization(data: {
    name: string
    displayName: string
    domain: string
    description?: string
    plan: SubscriptionInfo['plan']
  }): Promise<Organization | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/enterprise/organizations', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('organization:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建组织失败:', error)
      return null
    }
  }

  /**
   * 获取用户的组织列表
   */
  public async getUserOrganizations(): Promise<Organization[]> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/enterprise/organizations')
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取组织列表失败:', error)
      return []
    }
  }

  /**
   * 获取组织详情
   */
  public async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/enterprise/organizations/${organizationId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取组织详情失败:', error)
      return null
    }
  }

  /**
   * 更新组织设置
   */
  public async updateOrganizationSettings(
    organizationId: string,
    settings: Partial<OrganizationSettings>
  ): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/settings`,
        {
          method: 'PATCH',
          body: JSON.stringify(settings)
        }
      )

      if (response.success) {
        this.emit('organization:settings_updated', { organizationId, settings })
        return true
      }

      return false
    } catch (error) {
      console.error('更新组织设置失败:', error)
      return false
    }
  }

  /**
   * 创建团队
   */
  public async createTeam(data: {
    organizationId: string
    name: string
    description?: string
    parentTeamId?: string
  }): Promise<Team | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/enterprise/teams', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('team:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建团队失败:', error)
      return null
    }
  }

  /**
   * 获取组织的团队列表
   */
  public async getOrganizationTeams(organizationId: string): Promise<Team[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/teams`
      )
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取团队列表失败:', error)
      return []
    }
  }

  /**
   * 邀请用户加入团队
   */
  public async inviteUserToTeam(data: {
    organizationId: string
    teamId?: string
    email: string
    role: TeamRole
    message?: string
  }): Promise<TeamInvitation | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/enterprise/invitations', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('invitation:sent', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('邀请用户失败:', error)
      return null
    }
  }

  /**
   * 批量邀请用户
   */
  public async bulkInviteUsers(data: {
    organizationId: string
    teamId?: string
    invitations: Array<{
      email: string
      role: TeamRole
      message?: string
    }>
  }): Promise<{ success: TeamInvitation[]; failed: Array<{ email: string; error: string }> }> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/enterprise/invitations/bulk', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('invitations:bulk_sent', response.data)
        return response.data
      }

      return { success: [], failed: [] }
    } catch (error) {
      console.error('批量邀请用户失败:', error)
      return { success: [], failed: [] }
    }
  }

  /**
   * 接受邀请
   */
  public async acceptInvitation(invitationId: string): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/invitations/${invitationId}/accept`,
        { method: 'POST' }
      )

      if (response.success) {
        this.emit('invitation:accepted', { invitationId })
        return true
      }

      return false
    } catch (error) {
      console.error('接受邀请失败:', error)
      return false
    }
  }

  /**
   * 更新团队成员角色
   */
  public async updateMemberRole(
    teamId: string,
    userId: string,
    role: TeamRole
  ): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/teams/${teamId}/members/${userId}/role`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role })
        }
      )

      if (response.success) {
        this.emit('member:role_updated', { teamId, userId, role })
        return true
      }

      return false
    } catch (error) {
      console.error('更新成员角色失败:', error)
      return false
    }
  }

  /**
   * 移除团队成员
   */
  public async removeMember(teamId: string, userId: string): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/teams/${teamId}/members/${userId}`,
        { method: 'DELETE' }
      )

      if (response.success) {
        this.emit('member:removed', { teamId, userId })
        return true
      }

      return false
    } catch (error) {
      console.error('移除成员失败:', error)
      return false
    }
  }

  /**
   * 获取审计日志
   */
  public async getAuditLogs(
    organizationId: string,
    options?: {
      startDate?: Date
      endDate?: Date
      userId?: string
      action?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (options?.startDate) params.append('startDate', options.startDate.toISOString())
      if (options?.endDate) params.append('endDate', options.endDate.toISOString())
      if (options?.userId) params.append('userId', options.userId)
      if (options?.action) params.append('action', options.action)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/audit-logs?${params.toString()}`
      )

      return response.success ? response.data : { logs: [], total: 0 }
    } catch (error) {
      console.error('获取审计日志失败:', error)
      return { logs: [], total: 0 }
    }
  }

  /**
   * 记录审计日志
   */
  public async logAuditEvent(data: {
    organizationId: string
    action: string
    resource: string
    resourceId?: string
    details?: Record<string, any>
  }): Promise<void> {
    try {
      await this.makeAuthenticatedRequest('/api/enterprise/audit-logs', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('记录审计日志失败:', error)
    }
  }

  /**
   * 检查用户权限
   */
  public async checkPermission(
    organizationId: string,
    permission: keyof UserPermissions
  ): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/permissions/${permission}`
      )
      return response.success ? response.data.hasPermission : false
    } catch (error) {
      console.error('检查权限失败:', error)
      return false
    }
  }

  /**
   * 获取用户在组织中的角色和权限
   */
  public async getUserRoleAndPermissions(organizationId: string): Promise<{
    role: TeamRole
    permissions: UserPermissions
  } | null> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/user/role-permissions`
      )
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取用户角色权限失败:', error)
      return null
    }
  }

  /**
   * 发起认证请求
   */
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = authService.getAccessToken()
    if (!token) {
      throw new Error('用户未认证')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })

    if (response.status === 401) {
      const refreshed = await authService.refreshToken()
      if (refreshed) {
        return this.makeAuthenticatedRequest(endpoint, options)
      } else {
        throw new Error('认证失败')
      }
    }

    return await response.json()
  }

  /**
   * 事件监听器管理
   */
  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  public off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.listeners.clear()
  }
}

// 导出单例实例
export const enterpriseTeamService = EnterpriseTeamService.getInstance()
