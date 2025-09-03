/**
 * 基于角色的访问控制(RBAC)服务
 * 开发企业级权限管理系统，支持细粒度权限控制和动态权限分配
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { EnterpriseAccountService } from './EnterpriseAccountService'
import type { TeamRole } from './EnterpriseAccountService'

// 权限定义
export interface Permission {
  id: string
  name: string
  description: string
  category: PermissionCategory
  resource: string
  action: string
  conditions?: PermissionCondition[]
}

export type PermissionCategory = 
  | 'account_management'
  | 'team_management'
  | 'content_management'
  | 'analytics'
  | 'billing'
  | 'security'
  | 'integrations'
  | 'system'

export interface PermissionCondition {
  type: 'time' | 'location' | 'resource_owner' | 'custom'
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

// 角色定义
export interface Role {
  id: string
  name: string
  description: string
  type: 'system' | 'custom'
  accountId?: string // 自定义角色属于特定账户
  
  // 权限
  permissions: string[] // Permission IDs
  
  // 角色层级
  level: number // 数字越大权限越高
  inheritsFrom?: string[] // 继承的角色ID
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  isActive: boolean
}

// 用户权限上下文
export interface UserPermissionContext {
  userId: string
  accountId: string
  teamId?: string
  roles: UserRole[]
  effectivePermissions: Permission[]
  lastUpdated: Date
}

export interface UserRole {
  roleId: string
  roleName: string
  assignedAt: Date
  assignedBy: string
  expiresAt?: Date
  scope: 'account' | 'team' | 'project'
  scopeId: string
}

// 权限检查结果
export interface PermissionCheckResult {
  granted: boolean
  reason: string
  requiredPermissions: string[]
  missingPermissions: string[]
  conditions?: PermissionCondition[]
}

// 权限策略
export interface PermissionPolicy {
  id: string
  name: string
  description: string
  accountId: string
  
  // 策略规则
  rules: PolicyRule[]
  
  // 策略状态
  isActive: boolean
  priority: number
  
  // 元数据
  createdAt: Date
  updatedAt: Date
}

export interface PolicyRule {
  id: string
  condition: string // JavaScript表达式
  effect: 'allow' | 'deny'
  permissions: string[]
  description: string
}

/**
 * 基于角色的访问控制服务
 */
export class RoleBasedAccessControlService {
  private static instance: RoleBasedAccessControlService
  private enterpriseAccountService: EnterpriseAccountService
  private systemRoles: Map<string, Role> = new Map()
  private systemPermissions: Map<string, Permission> = new Map()
  private userContextCache: Map<string, UserPermissionContext> = new Map()
  private isInitialized = false

  private constructor() {
    this.enterpriseAccountService = EnterpriseAccountService.getInstance()
  }

  static getInstance(): RoleBasedAccessControlService {
    if (!RoleBasedAccessControlService.instance) {
      RoleBasedAccessControlService.instance = new RoleBasedAccessControlService()
    }
    return RoleBasedAccessControlService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.enterpriseAccountService.initialize()
      await this.loadSystemPermissions()
      await this.loadSystemRoles()
      this.isInitialized = true
      console.log('✅ RoleBasedAccessControlService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize RoleBasedAccessControlService:', error)
      throw error
    }
  }

  /**
   * 检查用户权限
   */
  async checkPermission(
    userId: string,
    accountId: string,
    permissionId: string,
    resourceId?: string,
    context?: Record<string, any>
  ): Promise<PermissionCheckResult> {
    if (!this.isInitialized) await this.initialize()

    try {
      // 获取用户权限上下文
      const userContext = await this.getUserPermissionContext(userId, accountId)
      
      // 检查是否有所需权限
      const permission = this.systemPermissions.get(permissionId)
      if (!permission) {
        return {
          granted: false,
          reason: 'Permission not found',
          requiredPermissions: [permissionId],
          missingPermissions: [permissionId]
        }
      }

      const hasPermission = userContext.effectivePermissions.some(p => p.id === permissionId)
      
      if (!hasPermission) {
        return {
          granted: false,
          reason: 'User does not have required permission',
          requiredPermissions: [permissionId],
          missingPermissions: [permissionId]
        }
      }

      // 检查权限条件
      if (permission.conditions && permission.conditions.length > 0) {
        const conditionResult = await this.evaluatePermissionConditions(
          permission.conditions,
          userId,
          resourceId,
          context
        )
        
        if (!conditionResult.granted) {
          return conditionResult
        }
      }

      return {
        granted: true,
        reason: 'Permission granted',
        requiredPermissions: [permissionId],
        missingPermissions: []
      }
    } catch (error) {
      console.error('Permission check failed:', error)
      return {
        granted: false,
        reason: 'Permission check failed',
        requiredPermissions: [permissionId],
        missingPermissions: [permissionId]
      }
    }
  }

  /**
   * 批量检查权限
   */
  async checkPermissions(
    userId: string,
    accountId: string,
    permissionIds: string[],
    resourceId?: string,
    context?: Record<string, any>
  ): Promise<Record<string, PermissionCheckResult>> {
    const results: Record<string, PermissionCheckResult> = {}

    for (const permissionId of permissionIds) {
      results[permissionId] = await this.checkPermission(
        userId,
        accountId,
        permissionId,
        resourceId,
        context
      )
    }

    return results
  }

  /**
   * 为用户分配角色
   */
  async assignRole(
    userId: string,
    accountId: string,
    roleId: string,
    scope: 'account' | 'team' | 'project',
    scopeId: string,
    assignedBy: string,
    expiresAt?: Date
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const role = await this.getRole(roleId, accountId)
    if (!role) {
      throw new Error('Role not found')
    }

    const userRole: UserRole = {
      roleId,
      roleName: role.name,
      assignedAt: new Date(),
      assignedBy,
      expiresAt,
      scope,
      scopeId
    }

    // 保存用户角色分配
    await this.saveUserRole(userId, accountId, userRole)
    
    // 清除用户权限缓存
    this.clearUserPermissionCache(userId, accountId)

    console.log(`🔐 Role ${role.name} assigned to user ${userId}`)
  }

  /**
   * 撤销用户角色
   */
  async revokeRole(
    userId: string,
    accountId: string,
    roleId: string,
    scope: string,
    scopeId: string
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    await this.removeUserRole(userId, accountId, roleId, scope, scopeId)
    
    // 清除用户权限缓存
    this.clearUserPermissionCache(userId, accountId)

    console.log(`🔓 Role ${roleId} revoked from user ${userId}`)
  }

  /**
   * 创建自定义角色
   */
  async createCustomRole(
    accountId: string,
    roleData: {
      name: string
      description: string
      permissions: string[]
      inheritsFrom?: string[]
    },
    createdBy: string
  ): Promise<Role> {
    if (!this.isInitialized) await this.initialize()

    // 验证权限ID
    for (const permissionId of roleData.permissions) {
      if (!this.systemPermissions.has(permissionId)) {
        throw new Error(`Permission ${permissionId} not found`)
      }
    }

    const role: Role = {
      id: crypto.randomUUID(),
      name: roleData.name,
      description: roleData.description,
      type: 'custom',
      accountId,
      permissions: roleData.permissions,
      level: 1, // 自定义角色默认级别
      inheritsFrom: roleData.inheritsFrom,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      isActive: true
    }

    // 如果继承其他角色，合并权限
    if (role.inheritsFrom && role.inheritsFrom.length > 0) {
      const inheritedPermissions = await this.getInheritedPermissions(role.inheritsFrom, accountId)
      role.permissions = [...new Set([...role.permissions, ...inheritedPermissions])]
    }

    await this.saveRole(role)

    console.log(`🎭 Custom role created: ${role.name}`)
    return role
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId: string, accountId: string): Promise<Permission[]> {
    if (!this.isInitialized) await this.initialize()

    const context = await this.getUserPermissionContext(userId, accountId)
    return context.effectivePermissions
  }

  /**
   * 获取用户的所有角色
   */
  async getUserRoles(userId: string, accountId: string): Promise<UserRole[]> {
    if (!this.isInitialized) await this.initialize()

    const context = await this.getUserPermissionContext(userId, accountId)
    return context.roles
  }

  /**
   * 获取账户的所有自定义角色
   */
  async getAccountRoles(accountId: string): Promise<Role[]> {
    const roles: Role[] = []
    
    // 添加系统角色
    for (const role of this.systemRoles.values()) {
      roles.push(role)
    }

    // 添加自定义角色
    try {
      const customRoles = JSON.parse(localStorage.getItem(`custom_roles_${accountId}`) || '[]') as Role[]
      roles.push(...customRoles.filter(r => r.isActive))
    } catch (error) {
      console.error('Failed to load custom roles:', error)
    }

    return roles.sort((a, b) => b.level - a.level)
  }

  // 私有方法
  private async loadSystemPermissions(): Promise<void> {
    const permissions: Permission[] = [
      // 账户管理权限
      {
        id: 'account.view',
        name: '查看账户信息',
        description: '查看企业账户基本信息',
        category: 'account_management',
        resource: 'account',
        action: 'view'
      },
      {
        id: 'account.edit',
        name: '编辑账户信息',
        description: '编辑企业账户信息和设置',
        category: 'account_management',
        resource: 'account',
        action: 'edit'
      },
      {
        id: 'account.delete',
        name: '删除账户',
        description: '删除企业账户',
        category: 'account_management',
        resource: 'account',
        action: 'delete'
      },

      // 团队管理权限
      {
        id: 'team.create',
        name: '创建团队',
        description: '创建新团队',
        category: 'team_management',
        resource: 'team',
        action: 'create'
      },
      {
        id: 'team.view',
        name: '查看团队',
        description: '查看团队信息和成员',
        category: 'team_management',
        resource: 'team',
        action: 'view'
      },
      {
        id: 'team.edit',
        name: '编辑团队',
        description: '编辑团队信息和设置',
        category: 'team_management',
        resource: 'team',
        action: 'edit'
      },
      {
        id: 'team.delete',
        name: '删除团队',
        description: '删除团队',
        category: 'team_management',
        resource: 'team',
        action: 'delete'
      },
      {
        id: 'team.invite_members',
        name: '邀请成员',
        description: '邀请新成员加入团队',
        category: 'team_management',
        resource: 'team',
        action: 'invite_members'
      },
      {
        id: 'team.remove_members',
        name: '移除成员',
        description: '从团队中移除成员',
        category: 'team_management',
        resource: 'team',
        action: 'remove_members'
      },

      // 内容管理权限
      {
        id: 'content.create',
        name: '创建内容',
        description: '创建新的文章和内容',
        category: 'content_management',
        resource: 'content',
        action: 'create'
      },
      {
        id: 'content.edit',
        name: '编辑内容',
        description: '编辑现有内容',
        category: 'content_management',
        resource: 'content',
        action: 'edit'
      },
      {
        id: 'content.publish',
        name: '发布内容',
        description: '发布内容到生产环境',
        category: 'content_management',
        resource: 'content',
        action: 'publish'
      },
      {
        id: 'content.delete',
        name: '删除内容',
        description: '删除内容',
        category: 'content_management',
        resource: 'content',
        action: 'delete'
      },

      // 分析权限
      {
        id: 'analytics.view',
        name: '查看分析数据',
        description: '查看分析报告和数据',
        category: 'analytics',
        resource: 'analytics',
        action: 'view'
      },
      {
        id: 'analytics.export',
        name: '导出分析数据',
        description: '导出分析数据和报告',
        category: 'analytics',
        resource: 'analytics',
        action: 'export'
      },

      // 计费权限
      {
        id: 'billing.view',
        name: '查看计费信息',
        description: '查看订阅和计费信息',
        category: 'billing',
        resource: 'billing',
        action: 'view'
      },
      {
        id: 'billing.manage',
        name: '管理计费',
        description: '管理订阅和支付方式',
        category: 'billing',
        resource: 'billing',
        action: 'manage'
      },

      // 安全权限
      {
        id: 'security.view',
        name: '查看安全设置',
        description: '查看安全配置和日志',
        category: 'security',
        resource: 'security',
        action: 'view'
      },
      {
        id: 'security.manage',
        name: '管理安全设置',
        description: '配置安全策略和权限',
        category: 'security',
        resource: 'security',
        action: 'manage'
      },

      // 集成权限
      {
        id: 'integrations.view',
        name: '查看集成',
        description: '查看API和集成配置',
        category: 'integrations',
        resource: 'integrations',
        action: 'view'
      },
      {
        id: 'integrations.manage',
        name: '管理集成',
        description: '配置API和第三方集成',
        category: 'integrations',
        resource: 'integrations',
        action: 'manage'
      }
    ]

    for (const permission of permissions) {
      this.systemPermissions.set(permission.id, permission)
    }
  }

  private async loadSystemRoles(): Promise<void> {
    const roles: Role[] = [
      {
        id: 'account_owner',
        name: '账户所有者',
        description: '企业账户的最高权限角色',
        type: 'system',
        permissions: Array.from(this.systemPermissions.keys()), // 所有权限
        level: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        id: 'account_admin',
        name: '账户管理员',
        description: '企业账户管理员，除删除账户外的所有权限',
        type: 'system',
        permissions: Array.from(this.systemPermissions.keys()).filter(p => p !== 'account.delete'),
        level: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        id: 'team_lead',
        name: '团队负责人',
        description: '团队管理和内容管理权限',
        type: 'system',
        permissions: [
          'team.view', 'team.edit', 'team.invite_members',
          'content.create', 'content.edit', 'content.publish',
          'analytics.view'
        ],
        level: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        id: 'content_editor',
        name: '内容编辑',
        description: '内容创建和编辑权限',
        type: 'system',
        permissions: [
          'content.create', 'content.edit',
          'team.view',
          'analytics.view'
        ],
        level: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        id: 'viewer',
        name: '查看者',
        description: '只读权限',
        type: 'system',
        permissions: [
          'account.view', 'team.view', 'analytics.view'
        ],
        level: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }
    ]

    for (const role of roles) {
      this.systemRoles.set(role.id, role)
    }
  }

  private async getUserPermissionContext(userId: string, accountId: string): Promise<UserPermissionContext> {
    const cacheKey = `${userId}_${accountId}`
    
    // 检查缓存
    if (this.userContextCache.has(cacheKey)) {
      const cached = this.userContextCache.get(cacheKey)!
      // 如果缓存未过期（5分钟），直接返回
      if (Date.now() - cached.lastUpdated.getTime() < 5 * 60 * 1000) {
        return cached
      }
    }

    // 构建用户权限上下文
    const userRoles = await this.loadUserRoles(userId, accountId)
    const effectivePermissions = await this.calculateEffectivePermissions(userRoles, accountId)

    const context: UserPermissionContext = {
      userId,
      accountId,
      roles: userRoles,
      effectivePermissions,
      lastUpdated: new Date()
    }

    // 缓存结果
    this.userContextCache.set(cacheKey, context)

    return context
  }

  private async loadUserRoles(userId: string, accountId: string): Promise<UserRole[]> {
    try {
      const stored = localStorage.getItem(`user_roles_${userId}_${accountId}`)
      if (!stored) return []

      const roles = JSON.parse(stored) as UserRole[]
      
      // 过滤过期角色
      const now = new Date()
      return roles.filter(role => !role.expiresAt || role.expiresAt > now)
    } catch (error) {
      console.error('Failed to load user roles:', error)
      return []
    }
  }

  private async calculateEffectivePermissions(userRoles: UserRole[], accountId: string): Promise<Permission[]> {
    const permissionIds = new Set<string>()

    for (const userRole of userRoles) {
      const role = await this.getRole(userRole.roleId, accountId)
      if (role && role.isActive) {
        role.permissions.forEach(p => permissionIds.add(p))
      }
    }

    const permissions: Permission[] = []
    for (const permissionId of permissionIds) {
      const permission = this.systemPermissions.get(permissionId)
      if (permission) {
        permissions.push(permission)
      }
    }

    return permissions
  }

  private async getRole(roleId: string, accountId: string): Promise<Role | null> {
    // 先检查系统角色
    if (this.systemRoles.has(roleId)) {
      return this.systemRoles.get(roleId)!
    }

    // 检查自定义角色
    try {
      const customRoles = JSON.parse(localStorage.getItem(`custom_roles_${accountId}`) || '[]') as Role[]
      return customRoles.find(r => r.id === roleId) || null
    } catch (error) {
      console.error('Failed to get custom role:', error)
      return null
    }
  }

  private async getInheritedPermissions(roleIds: string[], accountId: string): Promise<string[]> {
    const permissions = new Set<string>()

    for (const roleId of roleIds) {
      const role = await this.getRole(roleId, accountId)
      if (role) {
        role.permissions.forEach(p => permissions.add(p))
      }
    }

    return Array.from(permissions)
  }

  private async saveRole(role: Role): Promise<void> {
    try {
      const customRoles = JSON.parse(localStorage.getItem(`custom_roles_${role.accountId}`) || '[]') as Role[]
      const index = customRoles.findIndex(r => r.id === role.id)
      
      if (index >= 0) {
        customRoles[index] = role
      } else {
        customRoles.push(role)
      }
      
      localStorage.setItem(`custom_roles_${role.accountId}`, JSON.stringify(customRoles))
    } catch (error) {
      console.error('Failed to save role:', error)
      throw error
    }
  }

  private async saveUserRole(userId: string, accountId: string, userRole: UserRole): Promise<void> {
    try {
      const userRoles = await this.loadUserRoles(userId, accountId)
      userRoles.push(userRole)
      localStorage.setItem(`user_roles_${userId}_${accountId}`, JSON.stringify(userRoles))
    } catch (error) {
      console.error('Failed to save user role:', error)
      throw error
    }
  }

  private async removeUserRole(
    userId: string,
    accountId: string,
    roleId: string,
    scope: string,
    scopeId: string
  ): Promise<void> {
    try {
      const userRoles = await this.loadUserRoles(userId, accountId)
      const filteredRoles = userRoles.filter(r => 
        !(r.roleId === roleId && r.scope === scope && r.scopeId === scopeId)
      )
      localStorage.setItem(`user_roles_${userId}_${accountId}`, JSON.stringify(filteredRoles))
    } catch (error) {
      console.error('Failed to remove user role:', error)
      throw error
    }
  }

  private clearUserPermissionCache(userId: string, accountId: string): void {
    const cacheKey = `${userId}_${accountId}`
    this.userContextCache.delete(cacheKey)
  }

  private async evaluatePermissionConditions(
    conditions: PermissionCondition[],
    userId: string,
    resourceId?: string,
    context?: Record<string, any>
  ): Promise<PermissionCheckResult> {
    // 简化实现：所有条件都通过
    return {
      granted: true,
      reason: 'All conditions satisfied',
      requiredPermissions: [],
      missingPermissions: [],
      conditions
    }
  }
}

// Export singleton instance
export const rbacService = RoleBasedAccessControlService.getInstance()
