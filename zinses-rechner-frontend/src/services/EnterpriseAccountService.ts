/**
 * 企业账户和团队管理服务
 * 扩展现有用户管理系统，支持企业级多用户、团队协作和组织管理
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserIdentityService } from './UserIdentityService'
import type { User, RegisteredUser } from '@/types/user-identity'

// 企业账户类型
export interface EnterpriseAccount {
  accountId: string
  name: string
  domain: string
  industry: string
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  
  // 账户状态
  status: 'active' | 'suspended' | 'trial' | 'expired'
  createdAt: Date
  updatedAt: Date
  
  // 订阅信息
  subscription: SubscriptionInfo
  
  // 账户设置
  settings: EnterpriseSettings
  
  // 联系信息
  primaryContact: ContactInfo
  billingContact?: ContactInfo
  
  // 合规信息
  complianceInfo: ComplianceInfo
}

// 订阅信息
export interface SubscriptionInfo {
  planId: string
  planName: string
  status: 'active' | 'cancelled' | 'past_due' | 'trial'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd?: Date
  
  // 使用限制
  limits: {
    maxUsers: number
    maxTeams: number
    maxProjects: number
    storageGB: number
    apiCallsPerMonth: number
  }
  
  // 当前使用量
  usage: {
    users: number
    teams: number
    projects: number
    storageUsedGB: number
    apiCallsThisMonth: number
  }
}

// 企业设置
export interface EnterpriseSettings {
  // 安全设置
  security: {
    enforceSSO: boolean
    requireMFA: boolean
    passwordPolicy: PasswordPolicy
    sessionTimeout: number // 分钟
    ipWhitelist: string[]
  }
  
  // 数据设置
  data: {
    dataRetentionDays: number
    allowDataExport: boolean
    requireDataApproval: boolean
    backupFrequency: 'daily' | 'weekly' | 'monthly'
  }
  
  // 集成设置
  integrations: {
    allowedDomains: string[]
    webhookEndpoints: string[]
    apiAccess: boolean
  }
  
  // 品牌设置
  branding: {
    logoUrl?: string
    primaryColor?: string
    customDomain?: string
  }
}

// 密码策略
export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxAge: number // 天数
  preventReuse: number // 防止重复使用的历史密码数量
}

// 联系信息
export interface ContactInfo {
  name: string
  email: string
  phone?: string
  title?: string
  department?: string
}

// 合规信息
export interface ComplianceInfo {
  gdprCompliant: boolean
  dataProcessingAgreement: boolean
  privacyPolicyAccepted: boolean
  termsOfServiceAccepted: boolean
  lastComplianceReview: Date
  
  // 审计信息
  auditLog: AuditLogEntry[]
}

export interface AuditLogEntry {
  id: string
  timestamp: Date
  userId: string
  action: string
  resource: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
}

// 团队管理
export interface Team {
  teamId: string
  accountId: string
  name: string
  description?: string
  
  // 团队状态
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
  
  // 团队成员
  members: TeamMember[]
  
  // 团队设置
  settings: TeamSettings
  
  // 团队权限
  permissions: TeamPermissions
}

export interface TeamMember {
  userId: string
  email: string
  name?: string
  role: TeamRole
  status: 'active' | 'invited' | 'suspended'
  joinedAt: Date
  invitedBy?: string
  lastActiveAt?: Date
}

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface TeamSettings {
  visibility: 'private' | 'internal' | 'public'
  allowMemberInvites: boolean
  requireApprovalForJoin: boolean
  defaultMemberRole: TeamRole
}

export interface TeamPermissions {
  canCreateProjects: boolean
  canManageMembers: boolean
  canViewAnalytics: boolean
  canExportData: boolean
  canManageIntegrations: boolean
}

// 邀请管理
export interface TeamInvitation {
  invitationId: string
  accountId: string
  teamId?: string
  email: string
  role: TeamRole
  
  // 邀请状态
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: Date
  expiresAt: Date
  
  // 邀请信息
  invitedBy: string
  message?: string
  
  // 接受信息
  acceptedAt?: Date
  declinedAt?: Date
}

/**
 * 企业账户和团队管理服务
 */
export class EnterpriseAccountService {
  private static instance: EnterpriseAccountService
  private userIdentityService: UserIdentityService
  private isInitialized = false

  private constructor() {
    this.userIdentityService = UserIdentityService.getInstance()
  }

  static getInstance(): EnterpriseAccountService {
    if (!EnterpriseAccountService.instance) {
      EnterpriseAccountService.instance = new EnterpriseAccountService()
    }
    return EnterpriseAccountService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.userIdentityService.initialize()
      this.isInitialized = true
      console.log('✅ EnterpriseAccountService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize EnterpriseAccountService:', error)
      throw error
    }
  }

  /**
   * 创建企业账户
   */
  async createEnterpriseAccount(accountData: {
    name: string
    domain: string
    industry: string
    size: EnterpriseAccount['size']
    primaryContact: ContactInfo
    planId: string
  }): Promise<EnterpriseAccount> {
    if (!this.isInitialized) await this.initialize()

    const account: EnterpriseAccount = {
      accountId: crypto.randomUUID(),
      name: accountData.name,
      domain: accountData.domain,
      industry: accountData.industry,
      size: accountData.size,
      status: 'trial',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      subscription: {
        planId: accountData.planId,
        planName: this.getPlanName(accountData.planId),
        status: 'trial',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天试用
        trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        limits: this.getPlanLimits(accountData.planId),
        usage: {
          users: 1, // 创建者
          teams: 0,
          projects: 0,
          storageUsedGB: 0,
          apiCallsThisMonth: 0
        }
      },
      
      settings: this.getDefaultEnterpriseSettings(),
      primaryContact: accountData.primaryContact,
      
      complianceInfo: {
        gdprCompliant: true,
        dataProcessingAgreement: false,
        privacyPolicyAccepted: true,
        termsOfServiceAccepted: true,
        lastComplianceReview: new Date(),
        auditLog: []
      }
    }

    // 保存企业账户
    await this.saveEnterpriseAccount(account)
    
    // 记录审计日志
    await this.logAuditEvent(account.accountId, 'account_created', 'enterprise_account', {
      accountName: account.name,
      domain: account.domain
    })

    console.log(`🏢 Enterprise account created: ${account.name}`)
    return account
  }

  /**
   * 创建团队
   */
  async createTeam(accountId: string, teamData: {
    name: string
    description?: string
    settings?: Partial<TeamSettings>
    permissions?: Partial<TeamPermissions>
  }, creatorUserId: string): Promise<Team> {
    if (!this.isInitialized) await this.initialize()

    const account = await this.getEnterpriseAccount(accountId)
    if (!account) {
      throw new Error('Enterprise account not found')
    }

    // 检查使用限制
    if (account.subscription.usage.teams >= account.subscription.limits.maxTeams) {
      throw new Error('Team limit exceeded')
    }

    const team: Team = {
      teamId: crypto.randomUUID(),
      accountId,
      name: teamData.name,
      description: teamData.description,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      members: [{
        userId: creatorUserId,
        email: '', // 需要从用户服务获取
        role: 'owner',
        status: 'active',
        joinedAt: new Date()
      }],
      
      settings: {
        visibility: 'private',
        allowMemberInvites: true,
        requireApprovalForJoin: false,
        defaultMemberRole: 'member',
        ...teamData.settings
      },
      
      permissions: {
        canCreateProjects: true,
        canManageMembers: true,
        canViewAnalytics: true,
        canExportData: false,
        canManageIntegrations: false,
        ...teamData.permissions
      }
    }

    // 保存团队
    await this.saveTeam(team)
    
    // 更新账户使用量
    account.subscription.usage.teams++
    await this.saveEnterpriseAccount(account)
    
    // 记录审计日志
    await this.logAuditEvent(accountId, 'team_created', 'team', {
      teamId: team.teamId,
      teamName: team.name,
      createdBy: creatorUserId
    })

    console.log(`👥 Team created: ${team.name}`)
    return team
  }

  /**
   * 邀请团队成员
   */
  async inviteTeamMember(
    accountId: string,
    teamId: string,
    email: string,
    role: TeamRole,
    invitedBy: string,
    message?: string
  ): Promise<TeamInvitation> {
    if (!this.isInitialized) await this.initialize()

    const team = await this.getTeam(teamId)
    if (!team || team.accountId !== accountId) {
      throw new Error('Team not found')
    }

    // 检查邀请者权限
    const inviter = team.members.find(m => m.userId === invitedBy)
    if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
      throw new Error('Insufficient permissions to invite members')
    }

    // 检查是否已经是成员
    const existingMember = team.members.find(m => m.email === email)
    if (existingMember) {
      throw new Error('User is already a team member')
    }

    const invitation: TeamInvitation = {
      invitationId: crypto.randomUUID(),
      accountId,
      teamId,
      email,
      role,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天过期
      invitedBy,
      message
    }

    // 保存邀请
    await this.saveTeamInvitation(invitation)
    
    // 发送邀请邮件（模拟）
    await this.sendInvitationEmail(invitation, team)
    
    // 记录审计日志
    await this.logAuditEvent(accountId, 'member_invited', 'team_invitation', {
      teamId,
      invitedEmail: email,
      role,
      invitedBy
    })

    console.log(`📧 Team invitation sent to: ${email}`)
    return invitation
  }

  /**
   * 接受团队邀请
   */
  async acceptTeamInvitation(invitationId: string, userId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const invitation = await this.getTeamInvitation(invitationId)
    if (!invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid')
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired')
    }

    // 获取用户信息
    const user = await this.userIdentityService.getUser(userId) as RegisteredUser
    if (!user || user.email !== invitation.email) {
      throw new Error('User email does not match invitation')
    }

    // 获取团队
    const team = await this.getTeam(invitation.teamId!)
    if (!team) {
      throw new Error('Team not found')
    }

    // 添加成员到团队
    const newMember: TeamMember = {
      userId,
      email: invitation.email,
      name: user.preferences?.displayName,
      role: invitation.role,
      status: 'active',
      joinedAt: new Date(),
      invitedBy: invitation.invitedBy
    }

    team.members.push(newMember)
    team.updatedAt = new Date()
    await this.saveTeam(team)

    // 更新邀请状态
    invitation.status = 'accepted'
    invitation.acceptedAt = new Date()
    await this.saveTeamInvitation(invitation)

    // 记录审计日志
    await this.logAuditEvent(team.accountId, 'member_joined', 'team', {
      teamId: team.teamId,
      userId,
      email: invitation.email,
      role: invitation.role
    })

    console.log(`✅ User ${user.email} joined team: ${team.name}`)
  }

  /**
   * 获取企业账户
   */
  async getEnterpriseAccount(accountId: string): Promise<EnterpriseAccount | null> {
    try {
      const stored = localStorage.getItem(`enterprise_account_${accountId}`)
      if (!stored) return null

      const account = JSON.parse(stored) as EnterpriseAccount
      // 转换日期字符串为Date对象
      account.createdAt = new Date(account.createdAt)
      account.updatedAt = new Date(account.updatedAt)
      account.subscription.currentPeriodStart = new Date(account.subscription.currentPeriodStart)
      account.subscription.currentPeriodEnd = new Date(account.subscription.currentPeriodEnd)
      if (account.subscription.trialEnd) {
        account.subscription.trialEnd = new Date(account.subscription.trialEnd)
      }

      return account
    } catch (error) {
      console.error('Failed to get enterprise account:', error)
      return null
    }
  }

  /**
   * 获取团队
   */
  async getTeam(teamId: string): Promise<Team | null> {
    try {
      const stored = localStorage.getItem(`team_${teamId}`)
      if (!stored) return null

      const team = JSON.parse(stored) as Team
      // 转换日期字符串为Date对象
      team.createdAt = new Date(team.createdAt)
      team.updatedAt = new Date(team.updatedAt)
      team.members.forEach(member => {
        member.joinedAt = new Date(member.joinedAt)
        if (member.lastActiveAt) {
          member.lastActiveAt = new Date(member.lastActiveAt)
        }
      })

      return team
    } catch (error) {
      console.error('Failed to get team:', error)
      return null
    }
  }

  /**
   * 获取账户的所有团队
   */
  async getAccountTeams(accountId: string): Promise<Team[]> {
    const teams: Team[] = []
    
    // 简化实现：遍历localStorage查找团队
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('team_')) {
        const team = await this.getTeam(key.replace('team_', ''))
        if (team && team.accountId === accountId) {
          teams.push(team)
        }
      }
    }

    return teams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // 私有方法
  private getPlanName(planId: string): string {
    const planNames: Record<string, string> = {
      'starter': 'Starter Plan',
      'professional': 'Professional Plan',
      'enterprise': 'Enterprise Plan'
    }
    return planNames[planId] || 'Unknown Plan'
  }

  private getPlanLimits(planId: string): SubscriptionInfo['limits'] {
    const limits: Record<string, SubscriptionInfo['limits']> = {
      'starter': {
        maxUsers: 5,
        maxTeams: 2,
        maxProjects: 10,
        storageGB: 10,
        apiCallsPerMonth: 10000
      },
      'professional': {
        maxUsers: 25,
        maxTeams: 10,
        maxProjects: 50,
        storageGB: 100,
        apiCallsPerMonth: 100000
      },
      'enterprise': {
        maxUsers: -1, // 无限制
        maxTeams: -1,
        maxProjects: -1,
        storageGB: 1000,
        apiCallsPerMonth: 1000000
      }
    }
    return limits[planId] || limits['starter']
  }

  private getDefaultEnterpriseSettings(): EnterpriseSettings {
    return {
      security: {
        enforceSSO: false,
        requireMFA: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          maxAge: 90,
          preventReuse: 5
        },
        sessionTimeout: 480, // 8小时
        ipWhitelist: []
      },
      data: {
        dataRetentionDays: 365,
        allowDataExport: true,
        requireDataApproval: false,
        backupFrequency: 'daily'
      },
      integrations: {
        allowedDomains: [],
        webhookEndpoints: [],
        apiAccess: true
      },
      branding: {}
    }
  }

  private async saveEnterpriseAccount(account: EnterpriseAccount): Promise<void> {
    try {
      localStorage.setItem(`enterprise_account_${account.accountId}`, JSON.stringify(account))
    } catch (error) {
      console.error('Failed to save enterprise account:', error)
      throw error
    }
  }

  private async saveTeam(team: Team): Promise<void> {
    try {
      localStorage.setItem(`team_${team.teamId}`, JSON.stringify(team))
    } catch (error) {
      console.error('Failed to save team:', error)
      throw error
    }
  }

  private async saveTeamInvitation(invitation: TeamInvitation): Promise<void> {
    try {
      localStorage.setItem(`invitation_${invitation.invitationId}`, JSON.stringify(invitation))
    } catch (error) {
      console.error('Failed to save team invitation:', error)
      throw error
    }
  }

  private async getTeamInvitation(invitationId: string): Promise<TeamInvitation | null> {
    try {
      const stored = localStorage.getItem(`invitation_${invitationId}`)
      if (!stored) return null

      const invitation = JSON.parse(stored) as TeamInvitation
      // 转换日期字符串为Date对象
      invitation.createdAt = new Date(invitation.createdAt)
      invitation.expiresAt = new Date(invitation.expiresAt)
      if (invitation.acceptedAt) {
        invitation.acceptedAt = new Date(invitation.acceptedAt)
      }
      if (invitation.declinedAt) {
        invitation.declinedAt = new Date(invitation.declinedAt)
      }

      return invitation
    } catch (error) {
      console.error('Failed to get team invitation:', error)
      return null
    }
  }

  private async sendInvitationEmail(invitation: TeamInvitation, team: Team): Promise<void> {
    // 模拟发送邀请邮件
    console.log(`📧 Sending invitation email to ${invitation.email}`)
    console.log(`Team: ${team.name}`)
    console.log(`Role: ${invitation.role}`)
    console.log(`Invitation link: /accept-invitation/${invitation.invitationId}`)
  }

  private async logAuditEvent(
    accountId: string,
    action: string,
    resource: string,
    details: Record<string, any>
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: 'system', // 实际应该是当前用户ID
      action,
      resource,
      details,
      ipAddress: '127.0.0.1', // 实际应该获取真实IP
      userAgent: navigator.userAgent
    }

    // 简化实现：保存到localStorage
    try {
      const auditLog = JSON.parse(localStorage.getItem(`audit_log_${accountId}`) || '[]')
      auditLog.push(auditEntry)
      
      // 保留最近1000条记录
      if (auditLog.length > 1000) {
        auditLog.splice(0, auditLog.length - 1000)
      }
      
      localStorage.setItem(`audit_log_${accountId}`, JSON.stringify(auditLog))
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }
}

// Export singleton instance
export const enterpriseAccountService = EnterpriseAccountService.getInstance()
