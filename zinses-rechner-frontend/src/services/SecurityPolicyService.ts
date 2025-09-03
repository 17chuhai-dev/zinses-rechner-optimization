/**
 * 安全策略管理系统
 * 创建和管理安全策略，包括密码策略、访问控制、会话管理等
 */

import { authService } from './AuthService'
import { auditLogService } from './AuditLogService'

// 安全策略相关类型定义
export interface SecurityPolicy {
  id: string
  name: string
  description: string
  type: PolicyType
  scope: PolicyScope
  rules: PolicyRule[]
  enforcement: EnforcementLevel
  exceptions: PolicyException[]
  isActive: boolean
  version: string
  effectiveDate: Date
  expiryDate?: Date
  createdAt: Date
  updatedAt: Date
  createdBy: string
  approvedBy?: string
  tags: string[]
}

export type PolicyType = 
  | 'password'          // 密码策略
  | 'access_control'    // 访问控制
  | 'session'           // 会话管理
  | 'data_protection'   // 数据保护
  | 'network'           // 网络安全
  | 'authentication'    // 认证策略
  | 'authorization'     // 授权策略
  | 'audit'             // 审计策略
  | 'compliance'        // 合规策略

export interface PolicyScope {
  organizationIds: string[]
  userGroups: string[]
  roles: string[]
  applications: string[]
  environments: string[]
  ipRanges?: string[]
  timeRestrictions?: TimeRestriction[]
}

export interface TimeRestriction {
  dayOfWeek: number[] // 0-6, Sunday = 0
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  timezone: string
}

export interface PolicyRule {
  id: string
  name: string
  description: string
  condition: RuleCondition
  action: RuleAction
  priority: number
  isActive: boolean
  parameters: Record<string, any>
}

export interface RuleCondition {
  type: 'always' | 'user_attribute' | 'resource_attribute' | 'time_based' | 'location_based' | 'risk_based'
  operator?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  field?: string
  value?: any
  logicalOperator?: 'and' | 'or' | 'not'
  subConditions?: RuleCondition[]
}

export interface RuleAction {
  type: 'allow' | 'deny' | 'require_mfa' | 'require_approval' | 'log_only' | 'redirect' | 'throttle'
  parameters?: Record<string, any>
  message?: string
}

export type EnforcementLevel = 'advisory' | 'warning' | 'blocking' | 'strict'

export interface PolicyException {
  id: string
  reason: string
  requestedBy: string
  approvedBy?: string
  startDate: Date
  endDate: Date
  conditions: RuleCondition[]
  isActive: boolean
}

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  specialCharsSet: string
  preventCommonPasswords: boolean
  preventUserInfo: boolean
  preventReuse: number
  maxAge: number // days
  minAge: number // days
  lockoutThreshold: number
  lockoutDuration: number // minutes
  complexityScore: number
  dictionaryCheck: boolean
  customPatterns: string[]
  strengthMeter: boolean
}

export interface SessionPolicy {
  maxDuration: number // minutes
  idleTimeout: number // minutes
  maxConcurrentSessions: number
  requireReauth: boolean
  reauthInterval: number // minutes
  ipBinding: boolean
  deviceBinding: boolean
  geoLocationCheck: boolean
  suspiciousActivityDetection: boolean
  sessionRotation: boolean
  rotationInterval: number // minutes
  secureTransport: boolean
  cookieSettings: CookieSettings
}

export interface CookieSettings {
  secure: boolean
  httpOnly: boolean
  sameSite: 'strict' | 'lax' | 'none'
  domain?: string
  path: string
  maxAge: number // seconds
}

export interface AccessControlPolicy {
  defaultAction: 'allow' | 'deny'
  rbacEnabled: boolean
  abacEnabled: boolean
  inheritanceEnabled: boolean
  delegationEnabled: boolean
  temporaryAccessEnabled: boolean
  emergencyAccessEnabled: boolean
  privilegedAccessManagement: boolean
  segregationOfDuties: boolean
  leastPrivilegeEnforcement: boolean
  accessReviewRequired: boolean
  reviewInterval: number // days
  approvalWorkflow: boolean
  riskBasedAccess: boolean
}

export interface PolicyViolation {
  id: string
  policyId: string
  policyName: string
  ruleId: string
  userId: string
  organizationId?: string
  violationType: ViolationType
  severity: ViolationSeverity
  description: string
  details: ViolationDetails
  timestamp: Date
  status: ViolationStatus
  resolution?: string
  resolvedBy?: string
  resolvedAt?: Date
  metadata: ViolationMetadata
}

export type ViolationType = 
  | 'password_violation'
  | 'access_denied'
  | 'session_violation'
  | 'authentication_failure'
  | 'authorization_failure'
  | 'data_access_violation'
  | 'policy_bypass_attempt'

export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical'

export type ViolationStatus = 'open' | 'investigating' | 'resolved' | 'false_positive' | 'accepted_risk'

export interface ViolationDetails {
  attemptedAction: string
  resource: string
  sourceIP: string
  userAgent: string
  location?: string
  riskScore: number
  context: Record<string, any>
}

export interface ViolationMetadata {
  detectionMethod: string
  confidence: number
  relatedViolations: string[]
  mitigationActions: string[]
  businessImpact: string
}

export interface PolicyCompliance {
  policyId: string
  policyName: string
  complianceRate: number // 0-100
  totalChecks: number
  passedChecks: number
  failedChecks: number
  lastAssessment: Date
  trends: ComplianceTrend[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ComplianceTrend {
  date: Date
  complianceRate: number
  violationCount: number
}

export interface SecurityMetrics {
  totalPolicies: number
  activePolicies: number
  policyViolations: number
  criticalViolations: number
  averageComplianceRate: number
  topViolatedPolicies: Array<{ policyId: string; policyName: string; violationCount: number }>
  complianceTrends: ComplianceTrend[]
  riskDistribution: Record<string, number>
}

export class SecurityPolicyService {
  private static instance: SecurityPolicyService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private policyCache: Map<string, SecurityPolicy> = new Map()
  private violationListeners: Set<(violation: PolicyViolation) => void> = new Set()

  private constructor() {}

  public static getInstance(): SecurityPolicyService {
    if (!SecurityPolicyService.instance) {
      SecurityPolicyService.instance = new SecurityPolicyService()
    }
    return SecurityPolicyService.instance
  }

  /**
   * 创建安全策略
   */
  public async createPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<SecurityPolicy | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/security/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(policy)
      })

      if (response.ok) {
        const data = await response.json()
        const createdPolicy = data.policy
        
        // 更新缓存
        this.policyCache.set(createdPolicy.id, createdPolicy)
        
        // 记录审计日志
        await auditLogService.log(
          'security_event',
          'security',
          'security_policy_created',
          'security_policy',
          {
            description: `Security policy created: ${policy.name}`,
            newValue: policy
          },
          { resourceId: createdPolicy.id, severity: 'medium', immediate: true }
        )

        return createdPolicy
      }

      return null
    } catch (error) {
      console.error('创建安全策略失败:', error)
      return null
    }
  }

  /**
   * 获取安全策略列表
   */
  public async getPolicies(
    type?: PolicyType,
    organizationId?: string,
    isActive?: boolean
  ): Promise<SecurityPolicy[]> {
    try {
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      if (organizationId) params.append('organizationId', organizationId)
      if (isActive !== undefined) params.append('isActive', isActive.toString())

      const response = await fetch(`${this.baseUrl}/api/security/policies?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const policies = data.policies || []
        
        // 更新缓存
        policies.forEach((policy: SecurityPolicy) => {
          this.policyCache.set(policy.id, policy)
        })
        
        return policies
      }

      return []
    } catch (error) {
      console.error('获取安全策略失败:', error)
      return []
    }
  }

  /**
   * 获取特定策略
   */
  public async getPolicy(policyId: string): Promise<SecurityPolicy | null> {
    // 先检查缓存
    if (this.policyCache.has(policyId)) {
      return this.policyCache.get(policyId)!
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/security/policies/${policyId}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const policy = data.policy
        
        // 更新缓存
        this.policyCache.set(policyId, policy)
        
        return policy
      }

      return null
    } catch (error) {
      console.error('获取安全策略失败:', error)
      return null
    }
  }

  /**
   * 更新安全策略
   */
  public async updatePolicy(
    policyId: string,
    updates: Partial<SecurityPolicy>
  ): Promise<SecurityPolicy | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/security/policies/${policyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        const updatedPolicy = data.policy
        
        // 更新缓存
        this.policyCache.set(policyId, updatedPolicy)
        
        // 记录审计日志
        await auditLogService.log(
          'security_event',
          'security',
          'security_policy_updated',
          'security_policy',
          {
            description: `Security policy updated: ${updatedPolicy.name}`,
            oldValue: this.policyCache.get(policyId),
            newValue: updates
          },
          { resourceId: policyId, severity: 'medium', immediate: true }
        )

        return updatedPolicy
      }

      return null
    } catch (error) {
      console.error('更新安全策略失败:', error)
      return null
    }
  }

  /**
   * 删除安全策略
   */
  public async deletePolicy(policyId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/security/policies/${policyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        // 从缓存中移除
        this.policyCache.delete(policyId)
        
        // 记录审计日志
        await auditLogService.log(
          'security_event',
          'security',
          'security_policy_deleted',
          'security_policy',
          {
            description: `Security policy deleted: ${policyId}`
          },
          { resourceId: policyId, severity: 'high', immediate: true }
        )

        return true
      }

      return false
    } catch (error) {
      console.error('删除安全策略失败:', error)
      return false
    }
  }

  /**
   * 评估策略合规性
   */
  public async evaluatePolicy(
    policyId: string,
    context: Record<string, any>
  ): Promise<{
    allowed: boolean
    violations: PolicyViolation[]
    recommendations: string[]
    riskScore: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/security/policies/${policyId}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({ context })
      })

      if (response.ok) {
        const data = await response.json()
        const evaluation = data.evaluation
        
        // 如果有违规，通知监听器
        if (evaluation.violations.length > 0) {
          evaluation.violations.forEach((violation: PolicyViolation) => {
            this.notifyViolationListeners(violation)
          })
        }
        
        return evaluation
      }

      return {
        allowed: false,
        violations: [],
        recommendations: ['策略评估失败'],
        riskScore: 100
      }
    } catch (error) {
      console.error('评估策略合规性失败:', error)
      return {
        allowed: false,
        violations: [],
        recommendations: ['策略评估过程中发生错误'],
        riskScore: 100
      }
    }
  }

  /**
   * 获取策略违规记录
   */
  public async getPolicyViolations(
    policyId?: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
    severity?: ViolationSeverity,
    status?: ViolationStatus,
    limit = 100
  ): Promise<PolicyViolation[]> {
    try {
      const params = new URLSearchParams()
      if (policyId) params.append('policyId', policyId)
      if (userId) params.append('userId', userId)
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())
      if (severity) params.append('severity', severity)
      if (status) params.append('status', status)
      params.append('limit', limit.toString())

      const response = await fetch(`${this.baseUrl}/api/security/violations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.violations || []
      }

      return []
    } catch (error) {
      console.error('获取策略违规记录失败:', error)
      return []
    }
  }

  /**
   * 获取策略合规性报告
   */
  public async getPolicyCompliance(
    organizationId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PolicyCompliance[]> {
    try {
      const params = new URLSearchParams()
      if (organizationId) params.append('organizationId', organizationId)
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await fetch(`${this.baseUrl}/api/security/compliance?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.compliance || []
      }

      return []
    } catch (error) {
      console.error('获取策略合规性报告失败:', error)
      return []
    }
  }

  /**
   * 获取安全指标
   */
  public async getSecurityMetrics(
    organizationId?: string,
    period = 30 // days
  ): Promise<SecurityMetrics> {
    try {
      const params = new URLSearchParams()
      if (organizationId) params.append('organizationId', organizationId)
      params.append('period', period.toString())

      const response = await fetch(`${this.baseUrl}/api/security/metrics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.metrics
      }

      return {
        totalPolicies: 0,
        activePolicies: 0,
        policyViolations: 0,
        criticalViolations: 0,
        averageComplianceRate: 0,
        topViolatedPolicies: [],
        complianceTrends: [],
        riskDistribution: {}
      }
    } catch (error) {
      console.error('获取安全指标失败:', error)
      return {
        totalPolicies: 0,
        activePolicies: 0,
        policyViolations: 0,
        criticalViolations: 0,
        averageComplianceRate: 0,
        topViolatedPolicies: [],
        complianceTrends: [],
        riskDistribution: {}
      }
    }
  }

  /**
   * 验证密码策略
   */
  public validatePassword(password: string, policy: PasswordPolicy): {
    isValid: boolean
    violations: string[]
    score: number
  } {
    const violations: string[] = []
    let score = 0

    // 长度检查
    if (password.length < policy.minLength) {
      violations.push(`密码长度至少需要 ${policy.minLength} 个字符`)
    } else if (password.length > policy.maxLength) {
      violations.push(`密码长度不能超过 ${policy.maxLength} 个字符`)
    } else {
      score += 20
    }

    // 大写字母检查
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      violations.push('密码必须包含大写字母')
    } else if (policy.requireUppercase) {
      score += 15
    }

    // 小写字母检查
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      violations.push('密码必须包含小写字母')
    } else if (policy.requireLowercase) {
      score += 15
    }

    // 数字检查
    if (policy.requireNumbers && !/\d/.test(password)) {
      violations.push('密码必须包含数字')
    } else if (policy.requireNumbers) {
      score += 15
    }

    // 特殊字符检查
    if (policy.requireSpecialChars) {
      const specialCharsRegex = new RegExp(`[${policy.specialCharsSet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`)
      if (!specialCharsRegex.test(password)) {
        violations.push('密码必须包含特殊字符')
      } else {
        score += 15
      }
    }

    // 复杂度评分
    const uniqueChars = new Set(password).size
    const entropy = uniqueChars / password.length
    score += Math.min(20, entropy * 40)

    return {
      isValid: violations.length === 0 && score >= policy.complexityScore,
      violations,
      score: Math.min(100, score)
    }
  }

  /**
   * 添加违规监听器
   */
  public addViolationListener(listener: (violation: PolicyViolation) => void): void {
    this.violationListeners.add(listener)
  }

  /**
   * 移除违规监听器
   */
  public removeViolationListener(listener: (violation: PolicyViolation) => void): void {
    this.violationListeners.delete(listener)
  }

  /**
   * 通知违规监听器
   */
  private notifyViolationListeners(violation: PolicyViolation): void {
    this.violationListeners.forEach(listener => {
      try {
        listener(violation)
      } catch (error) {
        console.error('违规监听器执行失败:', error)
      }
    })
  }

  /**
   * 获取策略类型标签
   */
  public getPolicyTypeLabel(type: PolicyType): string {
    const labels: Record<PolicyType, string> = {
      password: 'Passwort-Richtlinie',
      access_control: 'Zugriffskontrolle',
      session: 'Sitzungsverwaltung',
      data_protection: 'Datenschutz',
      network: 'Netzwerksicherheit',
      authentication: 'Authentifizierung',
      authorization: 'Autorisierung',
      audit: 'Audit-Richtlinie',
      compliance: 'Compliance-Richtlinie'
    }
    
    return labels[type] || type
  }

  /**
   * 获取违规严重程度标签
   */
  public getViolationSeverityLabel(severity: ViolationSeverity): string {
    const labels: Record<ViolationSeverity, string> = {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      critical: 'Kritisch'
    }
    
    return labels[severity] || severity
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.policyCache.clear()
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.policyCache.clear()
    this.violationListeners.clear()
  }
}

// 导出单例实例
export const securityPolicyService = SecurityPolicyService.getInstance()
