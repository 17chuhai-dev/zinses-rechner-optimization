/**
 * 仪表盘权限控制器
 * 实现基于角色的数据访问控制，确保用户只能查看有权限的数据
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { RoleBasedAccessControlService } from './RoleBasedAccessControlService'
import { EnterpriseAccountService } from './EnterpriseAccountService'
import type { Permission } from './RoleBasedAccessControlService'
import type { Team } from './EnterpriseAccountService'

// 数据访问权限
export interface DataAccessPermission {
  dataType: string
  actions: ('view' | 'export' | 'share' | 'drill-down')[]
  filters: DataAccessFilter[]
  conditions: AccessCondition[]
}

export interface DataAccessFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'range'
  values: any[]
  required: boolean
}

export interface AccessCondition {
  type: 'time_range' | 'data_scope' | 'user_segment' | 'custom'
  condition: string
  parameters: Record<string, any>
}

// 数据范围限制
export interface DataScopeRestriction {
  userId: string
  accountId: string
  teamIds: string[]
  
  // 时间范围限制
  maxTimeRange: number // 最大查询天数
  allowHistoricalData: boolean
  
  // 数据类型限制
  allowedDataTypes: string[]
  restrictedDataTypes: string[]
  
  // 用户数据限制
  canViewOwnDataOnly: boolean
  canViewTeamData: boolean
  canViewAccountData: boolean
  
  // 敏感数据限制
  canViewPII: boolean // 个人身份信息
  canViewFinancialData: boolean
  canViewDetailedAnalytics: boolean
}

// 权限检查结果
export interface PermissionCheckResult {
  granted: boolean
  reason: string
  restrictions: DataScopeRestriction
  allowedActions: string[]
  deniedActions: string[]
  appliedFilters: DataAccessFilter[]
}

// 数据过滤结果
export interface DataFilterResult<T = any> {
  data: T[]
  filteredCount: number
  totalCount: number
  appliedFilters: string[]
  restrictions: string[]
}

/**
 * 仪表盘权限控制器
 */
export class DashboardPermissionController {
  private static instance: DashboardPermissionController
  private rbacService: RoleBasedAccessControlService
  private enterpriseAccountService: EnterpriseAccountService
  private permissionCache: Map<string, { result: PermissionCheckResult; timestamp: Date }> = new Map()
  private isInitialized = false

  private constructor() {
    this.rbacService = RoleBasedAccessControlService.getInstance()
    this.enterpriseAccountService = EnterpriseAccountService.getInstance()
  }

  static getInstance(): DashboardPermissionController {
    if (!DashboardPermissionController.instance) {
      DashboardPermissionController.instance = new DashboardPermissionController()
    }
    return DashboardPermissionController.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.rbacService.initialize()
      await this.enterpriseAccountService.initialize()
      this.startCacheCleanup()
      this.isInitialized = true
      console.log('✅ DashboardPermissionController initialized')
    } catch (error) {
      console.error('❌ Failed to initialize DashboardPermissionController:', error)
      throw error
    }
  }

  /**
   * 检查数据访问权限
   */
  async checkDataAccess(
    userId: string,
    accountId: string,
    dataType: string,
    action: string = 'view',
    filters: Record<string, any> = {}
  ): Promise<PermissionCheckResult> {
    if (!this.isInitialized) await this.initialize()

    const cacheKey = `${userId}_${accountId}_${dataType}_${action}_${JSON.stringify(filters)}`
    
    // 检查缓存
    const cached = this.permissionCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp.getTime() < 5 * 60 * 1000) { // 5分钟缓存
      return cached.result
    }

    try {
      // 获取用户权限
      const userPermissions = await this.rbacService.getUserPermissions(userId, accountId)
      
      // 获取数据范围限制
      const restrictions = await this.getDataScopeRestriction(userId, accountId)
      
      // 检查基础权限
      const hasBasePermission = await this.checkBasePermission(userPermissions, dataType, action)
      
      if (!hasBasePermission.granted) {
        const result: PermissionCheckResult = {
          granted: false,
          reason: hasBasePermission.reason,
          restrictions,
          allowedActions: [],
          deniedActions: [action],
          appliedFilters: []
        }
        
        this.permissionCache.set(cacheKey, { result, timestamp: new Date() })
        return result
      }

      // 检查数据范围权限
      const scopeCheck = await this.checkDataScopePermission(restrictions, dataType, filters)
      
      if (!scopeCheck.granted) {
        const result: PermissionCheckResult = {
          granted: false,
          reason: scopeCheck.reason,
          restrictions,
          allowedActions: [],
          deniedActions: [action],
          appliedFilters: []
        }
        
        this.permissionCache.set(cacheKey, { result, timestamp: new Date() })
        return result
      }

      // 生成允许的操作列表
      const allowedActions = await this.getAllowedActions(userPermissions, dataType)
      
      // 生成必要的数据过滤器
      const appliedFilters = await this.generateDataFilters(restrictions, dataType, filters)

      const result: PermissionCheckResult = {
        granted: true,
        reason: 'Access granted',
        restrictions,
        allowedActions,
        deniedActions: [],
        appliedFilters
      }

      this.permissionCache.set(cacheKey, { result, timestamp: new Date() })
      return result
    } catch (error) {
      console.error('Permission check failed:', error)
      
      const result: PermissionCheckResult = {
        granted: false,
        reason: 'Permission check failed',
        restrictions: await this.getDataScopeRestriction(userId, accountId),
        allowedActions: [],
        deniedActions: [action],
        appliedFilters: []
      }
      
      return result
    }
  }

  /**
   * 根据权限过滤数据
   */
  async filterDataByPermissions<T = any>(
    data: T[],
    userId: string,
    accountId: string,
    dataType: string,
    dataKeyExtractor: (item: T) => Record<string, any>
  ): Promise<DataFilterResult<T>> {
    if (!this.isInitialized) await this.initialize()

    const permissionCheck = await this.checkDataAccess(userId, accountId, dataType)
    
    if (!permissionCheck.granted) {
      return {
        data: [],
        filteredCount: 0,
        totalCount: data.length,
        appliedFilters: ['access_denied'],
        restrictions: [permissionCheck.reason]
      }
    }

    const filteredData: T[] = []
    const appliedFilters: string[] = []
    const restrictions: string[] = []

    for (const item of data) {
      const itemData = dataKeyExtractor(item)
      let includeItem = true

      // 应用数据过滤器
      for (const filter of permissionCheck.appliedFilters) {
        const filterResult = this.applyDataFilter(itemData, filter)
        if (!filterResult.passed) {
          includeItem = false
          if (!appliedFilters.includes(filter.field)) {
            appliedFilters.push(filter.field)
          }
          break
        }
      }

      // 应用数据范围限制
      if (includeItem) {
        const scopeResult = this.applyDataScopeRestrictions(itemData, permissionCheck.restrictions)
        if (!scopeResult.passed) {
          includeItem = false
          restrictions.push(...scopeResult.restrictions)
        }
      }

      if (includeItem) {
        filteredData.push(item)
      }
    }

    return {
      data: filteredData,
      filteredCount: filteredData.length,
      totalCount: data.length,
      appliedFilters: [...new Set(appliedFilters)],
      restrictions: [...new Set(restrictions)]
    }
  }

  /**
   * 获取用户可访问的指标列表
   */
  async getAccessibleMetrics(userId: string, accountId: string): Promise<string[]> {
    if (!this.isInitialized) await this.initialize()

    const userPermissions = await this.rbacService.getUserPermissions(userId, accountId)
    const restrictions = await this.getDataScopeRestriction(userId, accountId)
    
    const allMetrics = [
      'user_analytics',
      'content_performance',
      'conversion_metrics',
      'social_media_metrics',
      'business_metrics',
      'financial_data',
      'detailed_analytics',
      'pii_data'
    ]

    const accessibleMetrics: string[] = []

    for (const metric of allMetrics) {
      const hasPermission = await this.checkBasePermission(userPermissions, metric, 'view')
      if (hasPermission.granted) {
        // 检查特殊限制
        if (metric === 'pii_data' && !restrictions.canViewPII) continue
        if (metric === 'financial_data' && !restrictions.canViewFinancialData) continue
        if (metric === 'detailed_analytics' && !restrictions.canViewDetailedAnalytics) continue
        
        accessibleMetrics.push(metric)
      }
    }

    return accessibleMetrics
  }

  /**
   * 检查团队数据访问权限
   */
  async checkTeamDataAccess(
    userId: string,
    accountId: string,
    teamId: string,
    dataType: string
  ): Promise<boolean> {
    if (!this.isInitialized) await this.initialize()

    try {
      const team = await this.enterpriseAccountService.getTeam(teamId)
      if (!team || team.accountId !== accountId) {
        return false
      }

      // 检查用户是否是团队成员
      const isMember = team.members.some(member => member.userId === userId)
      if (!isMember) {
        return false
      }

      // 检查团队权限
      const member = team.members.find(m => m.userId === userId)
      if (!member) return false

      // 根据角色检查权限
      switch (member.role) {
        case 'owner':
        case 'admin':
          return true
        case 'member':
          return team.permissions.canViewAnalytics
        case 'viewer':
          return dataType === 'basic_analytics'
        default:
          return false
      }
    } catch (error) {
      console.error('Team data access check failed:', error)
      return false
    }
  }

  // 私有方法
  private async getDataScopeRestriction(userId: string, accountId: string): Promise<DataScopeRestriction> {
    const userPermissions = await this.rbacService.getUserPermissions(userId, accountId)
    const userRoles = await this.rbacService.getUserRoles(userId, accountId)
    
    // 获取用户所属团队
    const teams = await this.enterpriseAccountService.getAccountTeams(accountId)
    const userTeams = teams.filter(team => 
      team.members.some(member => member.userId === userId)
    )

    // 根据角色确定权限级别
    const hasAdminRole = userRoles.some(role => 
      ['account_owner', 'account_admin'].includes(role.roleId)
    )
    
    const hasAnalyticsRole = userPermissions.some(permission => 
      permission.category === 'analytics'
    )

    return {
      userId,
      accountId,
      teamIds: userTeams.map(team => team.teamId),
      
      // 时间范围限制
      maxTimeRange: hasAdminRole ? 365 : hasAnalyticsRole ? 90 : 30,
      allowHistoricalData: hasAdminRole || hasAnalyticsRole,
      
      // 数据类型限制
      allowedDataTypes: hasAdminRole ? ['*'] : hasAnalyticsRole ? 
        ['user_analytics', 'content_performance', 'conversion_metrics'] : 
        ['basic_analytics'],
      restrictedDataTypes: hasAdminRole ? [] : ['financial_data', 'pii_data'],
      
      // 用户数据限制
      canViewOwnDataOnly: !hasAnalyticsRole,
      canViewTeamData: userTeams.length > 0,
      canViewAccountData: hasAdminRole,
      
      // 敏感数据限制
      canViewPII: hasAdminRole,
      canViewFinancialData: hasAdminRole,
      canViewDetailedAnalytics: hasAdminRole || hasAnalyticsRole
    }
  }

  private async checkBasePermission(
    userPermissions: Permission[],
    dataType: string,
    action: string
  ): Promise<{ granted: boolean; reason: string }> {
    // 检查通用分析权限
    const hasAnalyticsPermission = userPermissions.some(permission => 
      permission.id === 'analytics.view' && action === 'view'
    )

    if (!hasAnalyticsPermission) {
      return {
        granted: false,
        reason: 'User does not have analytics view permission'
      }
    }

    // 检查特定数据类型权限
    const dataTypePermissions: Record<string, string[]> = {
      'user_analytics': ['analytics.view'],
      'content_performance': ['analytics.view', 'content.view'],
      'conversion_metrics': ['analytics.view'],
      'social_media_metrics': ['analytics.view'],
      'business_metrics': ['analytics.view', 'billing.view'],
      'financial_data': ['billing.view'],
      'pii_data': ['security.view']
    }

    const requiredPermissions = dataTypePermissions[dataType] || ['analytics.view']
    
    for (const requiredPermission of requiredPermissions) {
      const hasPermission = userPermissions.some(permission => 
        permission.id === requiredPermission
      )
      
      if (!hasPermission) {
        return {
          granted: false,
          reason: `User does not have required permission: ${requiredPermission}`
        }
      }
    }

    return { granted: true, reason: 'Permission granted' }
  }

  private async checkDataScopePermission(
    restrictions: DataScopeRestriction,
    dataType: string,
    filters: Record<string, any>
  ): Promise<{ granted: boolean; reason: string }> {
    // 检查数据类型限制
    if (restrictions.allowedDataTypes[0] !== '*' && 
        !restrictions.allowedDataTypes.includes(dataType)) {
      return {
        granted: false,
        reason: `Data type ${dataType} is not allowed`
      }
    }

    if (restrictions.restrictedDataTypes.includes(dataType)) {
      return {
        granted: false,
        reason: `Data type ${dataType} is restricted`
      }
    }

    // 检查时间范围限制
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff > restrictions.maxTimeRange) {
        return {
          granted: false,
          reason: `Time range exceeds maximum allowed days: ${restrictions.maxTimeRange}`
        }
      }

      if (!restrictions.allowHistoricalData) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        if (start < thirtyDaysAgo) {
          return {
            granted: false,
            reason: 'Historical data access is not allowed'
          }
        }
      }
    }

    return { granted: true, reason: 'Scope permission granted' }
  }

  private async getAllowedActions(permissions: Permission[], dataType: string): Promise<string[]> {
    const actions: string[] = []

    // 基础查看权限
    if (permissions.some(p => p.id === 'analytics.view')) {
      actions.push('view')
    }

    // 导出权限
    if (permissions.some(p => p.id === 'analytics.export')) {
      actions.push('export')
    }

    // 分享权限
    if (permissions.some(p => p.category === 'team_management')) {
      actions.push('share')
    }

    // 钻取权限
    if (permissions.some(p => p.id === 'analytics.view')) {
      actions.push('drill-down')
    }

    return actions
  }

  private async generateDataFilters(
    restrictions: DataScopeRestriction,
    dataType: string,
    existingFilters: Record<string, any>
  ): Promise<DataAccessFilter[]> {
    const filters: DataAccessFilter[] = []

    // 用户数据范围过滤
    if (restrictions.canViewOwnDataOnly) {
      filters.push({
        field: 'userId',
        operator: 'equals',
        values: [restrictions.userId],
        required: true
      })
    } else if (!restrictions.canViewAccountData && restrictions.canViewTeamData) {
      filters.push({
        field: 'teamId',
        operator: 'in',
        values: restrictions.teamIds,
        required: true
      })
    }

    // 账户范围过滤
    filters.push({
      field: 'accountId',
      operator: 'equals',
      values: [restrictions.accountId],
      required: true
    })

    return filters
  }

  private applyDataFilter(itemData: Record<string, any>, filter: DataAccessFilter): { passed: boolean; reason?: string } {
    const fieldValue = itemData[filter.field]
    
    switch (filter.operator) {
      case 'equals':
        return { passed: fieldValue === filter.values[0] }
      case 'not_equals':
        return { passed: fieldValue !== filter.values[0] }
      case 'in':
        return { passed: filter.values.includes(fieldValue) }
      case 'not_in':
        return { passed: !filter.values.includes(fieldValue) }
      case 'contains':
        return { passed: String(fieldValue).includes(String(filter.values[0])) }
      case 'range':
        const [min, max] = filter.values
        return { passed: fieldValue >= min && fieldValue <= max }
      default:
        return { passed: true }
    }
  }

  private applyDataScopeRestrictions(
    itemData: Record<string, any>,
    restrictions: DataScopeRestriction
  ): { passed: boolean; restrictions: string[] } {
    const appliedRestrictions: string[] = []

    // 检查PII数据
    if (itemData.containsPII && !restrictions.canViewPII) {
      appliedRestrictions.push('PII data restricted')
    }

    // 检查财务数据
    if (itemData.containsFinancialData && !restrictions.canViewFinancialData) {
      appliedRestrictions.push('Financial data restricted')
    }

    // 检查详细分析数据
    if (itemData.isDetailedAnalytics && !restrictions.canViewDetailedAnalytics) {
      appliedRestrictions.push('Detailed analytics restricted')
    }

    return {
      passed: appliedRestrictions.length === 0,
      restrictions: appliedRestrictions
    }
  }

  private startCacheCleanup(): void {
    // 每30分钟清理过期缓存
    setInterval(() => {
      const now = Date.now()
      for (const [key, cached] of this.permissionCache) {
        if (now - cached.timestamp.getTime() > 30 * 60 * 1000) { // 30分钟
          this.permissionCache.delete(key)
        }
      }
    }, 30 * 60 * 1000)
  }
}

// Export singleton instance
export const dashboardPermissionController = DashboardPermissionController.getInstance()
