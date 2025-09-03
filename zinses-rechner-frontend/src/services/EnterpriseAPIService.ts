/**
 * 企业级API管理服务
 * 提供API密钥管理、访问控制、使用统计、限流等功能
 */

import { authService } from './AuthService'

// API相关类型定义
export interface APIKey {
  id: string
  organizationId: string
  name: string
  description?: string
  key: string
  keyPrefix: string  // 显示用的前缀，如 "zr_live_abc..."
  environment: 'development' | 'staging' | 'production'
  permissions: APIPermissions
  rateLimit: RateLimit
  ipWhitelist: string[]
  isActive: boolean
  expiresAt?: Date
  createdBy: string
  createdAt: Date
  lastUsedAt?: Date
  usageStats: APIUsageStats
}

export interface APIPermissions {
  calculations: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
  bulkCalculations: {
    create: boolean
    read: boolean
    manage: boolean
  }
  organizations: {
    read: boolean
    update: boolean
  }
  teams: {
    read: boolean
    manage: boolean
  }
  reports: {
    read: boolean
    create: boolean
  }
  webhooks: {
    create: boolean
    manage: boolean
  }
}

export interface RateLimit {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstLimit: number
  concurrentRequests: number
}

export interface APIUsageStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastRequestAt?: Date
  dailyUsage: DailyUsage[]
  endpointUsage: EndpointUsage[]
}

export interface DailyUsage {
  date: string
  requests: number
  errors: number
  averageResponseTime: number
}

export interface EndpointUsage {
  endpoint: string
  method: string
  requests: number
  averageResponseTime: number
  errorRate: number
}

export interface APIEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  parameters: APIParameter[]
  responses: APIResponse[]
  examples: APIExample[]
  rateLimit?: RateLimit
  requiresAuth: boolean
  permissions: string[]
}

export interface APIParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  example?: any
  validation?: ParameterValidation
}

export interface ParameterValidation {
  min?: number
  max?: number
  pattern?: string
  enum?: string[]
}

export interface APIResponse {
  statusCode: number
  description: string
  schema: any
  example?: any
}

export interface APIExample {
  name: string
  description: string
  request: {
    headers?: Record<string, string>
    parameters?: Record<string, any>
    body?: any
  }
  response: {
    statusCode: number
    headers?: Record<string, string>
    body: any
  }
}

export interface Webhook {
  id: string
  organizationId: string
  name: string
  url: string
  events: WebhookEvent[]
  headers: Record<string, string>
  secret?: string
  isActive: boolean
  retryPolicy: RetryPolicy
  createdAt: Date
  lastTriggeredAt?: Date
  deliveryStats: WebhookDeliveryStats
}

export type WebhookEvent = 
  | 'calculation.created'
  | 'calculation.updated'
  | 'calculation.deleted'
  | 'bulk_calculation.started'
  | 'bulk_calculation.completed'
  | 'bulk_calculation.failed'
  | 'team.member_added'
  | 'team.member_removed'
  | 'organization.updated'

export interface RetryPolicy {
  maxAttempts: number
  backoffMultiplier: number
  maxBackoffSeconds: number
}

export interface WebhookDeliveryStats {
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  averageResponseTime: number
  lastDeliveryAt?: Date
}

export interface APIQuota {
  organizationId: string
  plan: 'starter' | 'professional' | 'enterprise' | 'custom'
  limits: {
    requestsPerMonth: number
    concurrentRequests: number
    maxAPIKeys: number
    maxWebhooks: number
    bulkCalculationsPerMonth: number
  }
  usage: {
    requestsThisMonth: number
    apiKeysCreated: number
    webhooksCreated: number
    bulkCalculationsThisMonth: number
  }
  resetDate: Date
}

export interface APILog {
  id: string
  organizationId: string
  apiKeyId: string
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  requestSize: number
  responseSize: number
  ipAddress: string
  userAgent: string
  timestamp: Date
  error?: string
}

export class EnterpriseAPIService {
  private static instance: EnterpriseAPIService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {}

  public static getInstance(): EnterpriseAPIService {
    if (!EnterpriseAPIService.instance) {
      EnterpriseAPIService.instance = new EnterpriseAPIService()
    }
    return EnterpriseAPIService.instance
  }

  /**
   * 创建API密钥
   */
  public async createAPIKey(data: {
    organizationId: string
    name: string
    description?: string
    environment: APIKey['environment']
    permissions: APIPermissions
    rateLimit?: Partial<RateLimit>
    ipWhitelist?: string[]
    expiresAt?: Date
  }): Promise<APIKey | null> {
    try {
      const defaultRateLimit: RateLimit = {
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 200,
        concurrentRequests: 10
      }

      const keyData = {
        ...data,
        rateLimit: { ...defaultRateLimit, ...data.rateLimit },
        ipWhitelist: data.ipWhitelist || []
      }

      const response = await this.makeAuthenticatedRequest('/api/enterprise/api-keys', {
        method: 'POST',
        body: JSON.stringify(keyData)
      })

      if (response.success) {
        this.emit('api_key:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建API密钥失败:', error)
      return null
    }
  }

  /**
   * 获取组织的API密钥列表
   */
  public async getOrganizationAPIKeys(organizationId: string): Promise<APIKey[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/api-keys`
      )
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取API密钥列表失败:', error)
      return []
    }
  }

  /**
   * 更新API密钥
   */
  public async updateAPIKey(
    keyId: string,
    updates: Partial<Pick<APIKey, 'name' | 'description' | 'permissions' | 'rateLimit' | 'ipWhitelist' | 'isActive'>>
  ): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/enterprise/api-keys/${keyId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })

      if (response.success) {
        this.emit('api_key:updated', { keyId, updates })
        return true
      }

      return false
    } catch (error) {
      console.error('更新API密钥失败:', error)
      return false
    }
  }

  /**
   * 删除API密钥
   */
  public async deleteAPIKey(keyId: string): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/enterprise/api-keys/${keyId}`, {
        method: 'DELETE'
      })

      if (response.success) {
        this.emit('api_key:deleted', { keyId })
        return true
      }

      return false
    } catch (error) {
      console.error('删除API密钥失败:', error)
      return false
    }
  }

  /**
   * 轮换API密钥
   */
  public async rotateAPIKey(keyId: string): Promise<{ newKey: string } | null> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/enterprise/api-keys/${keyId}/rotate`, {
        method: 'POST'
      })

      if (response.success) {
        this.emit('api_key:rotated', { keyId, newKey: response.data.newKey })
        return response.data
      }

      return null
    } catch (error) {
      console.error('轮换API密钥失败:', error)
      return null
    }
  }

  /**
   * 获取API使用统计
   */
  public async getAPIUsageStats(
    organizationId: string,
    options?: {
      keyId?: string
      startDate?: Date
      endDate?: Date
      granularity?: 'hour' | 'day' | 'week' | 'month'
    }
  ): Promise<APIUsageStats | null> {
    try {
      const params = new URLSearchParams()
      if (options?.keyId) params.append('keyId', options.keyId)
      if (options?.startDate) params.append('startDate', options.startDate.toISOString())
      if (options?.endDate) params.append('endDate', options.endDate.toISOString())
      if (options?.granularity) params.append('granularity', options.granularity)

      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/api-usage?${params.toString()}`
      )

      return response.success ? response.data : null
    } catch (error) {
      console.error('获取API使用统计失败:', error)
      return null
    }
  }

  /**
   * 获取API配额信息
   */
  public async getAPIQuota(organizationId: string): Promise<APIQuota | null> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/api-quota`
      )
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取API配额失败:', error)
      return null
    }
  }

  /**
   * 获取API文档
   */
  public async getAPIDocumentation(): Promise<{
    endpoints: APIEndpoint[]
    schemas: Record<string, any>
    examples: APIExample[]
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/documentation`)
      const data = await response.json()
      return data.success ? data.data : { endpoints: [], schemas: {}, examples: [] }
    } catch (error) {
      console.error('获取API文档失败:', error)
      return { endpoints: [], schemas: {}, examples: [] }
    }
  }

  /**
   * 创建Webhook
   */
  public async createWebhook(data: {
    organizationId: string
    name: string
    url: string
    events: WebhookEvent[]
    headers?: Record<string, string>
    secret?: string
    retryPolicy?: Partial<RetryPolicy>
  }): Promise<Webhook | null> {
    try {
      const defaultRetryPolicy: RetryPolicy = {
        maxAttempts: 3,
        backoffMultiplier: 2,
        maxBackoffSeconds: 300
      }

      const webhookData = {
        ...data,
        headers: data.headers || {},
        retryPolicy: { ...defaultRetryPolicy, ...data.retryPolicy }
      }

      const response = await this.makeAuthenticatedRequest('/api/enterprise/webhooks', {
        method: 'POST',
        body: JSON.stringify(webhookData)
      })

      if (response.success) {
        this.emit('webhook:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建Webhook失败:', error)
      return null
    }
  }

  /**
   * 获取组织的Webhook列表
   */
  public async getOrganizationWebhooks(organizationId: string): Promise<Webhook[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/webhooks`
      )
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取Webhook列表失败:', error)
      return []
    }
  }

  /**
   * 测试Webhook
   */
  public async testWebhook(webhookId: string, event: WebhookEvent): Promise<{
    success: boolean
    statusCode?: number
    responseTime?: number
    error?: string
  }> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/enterprise/webhooks/${webhookId}/test`, {
        method: 'POST',
        body: JSON.stringify({ event })
      })

      return response.success ? response.data : { success: false, error: 'Test failed' }
    } catch (error) {
      console.error('测试Webhook失败:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取API日志
   */
  public async getAPILogs(
    organizationId: string,
    options?: {
      keyId?: string
      startDate?: Date
      endDate?: Date
      statusCode?: number
      endpoint?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ logs: APILog[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (options?.keyId) params.append('keyId', options.keyId)
      if (options?.startDate) params.append('startDate', options.startDate.toISOString())
      if (options?.endDate) params.append('endDate', options.endDate.toISOString())
      if (options?.statusCode) params.append('statusCode', options.statusCode.toString())
      if (options?.endpoint) params.append('endpoint', options.endpoint)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/api-logs?${params.toString()}`
      )

      return response.success ? response.data : { logs: [], total: 0 }
    } catch (error) {
      console.error('获取API日志失败:', error)
      return { logs: [], total: 0 }
    }
  }

  /**
   * 生成API客户端代码
   */
  public async generateClientCode(
    language: 'javascript' | 'python' | 'php' | 'java' | 'csharp' | 'go',
    apiKeyId: string
  ): Promise<string | null> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/api-keys/${apiKeyId}/generate-client/${language}`
      )
      return response.success ? response.data.code : null
    } catch (error) {
      console.error('生成客户端代码失败:', error)
      return null
    }
  }

  /**
   * 验证API密钥
   */
  public async validateAPIKey(key: string): Promise<{
    valid: boolean
    keyInfo?: Partial<APIKey>
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        }
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('验证API密钥失败:', error)
      return { valid: false, error: 'Validation failed' }
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
export const enterpriseAPIService = EnterpriseAPIService.getInstance()
