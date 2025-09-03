/**
 * 开放API服务
 * 提供RESTful API接口、GraphQL支持、第三方集成等功能
 */

import { authService } from './AuthService'
import type { CalculationResult } from '@/types/calculator'
import type { AnalysisResult } from './AdvancedAnalyticsService'

// API相关类型定义
export interface APIEndpoint {
  path: string
  method: HTTPMethod
  version: string
  description: string
  parameters: APIParameter[]
  responses: APIResponse[]
  authentication: AuthenticationType
  rateLimit: RateLimitConfig
  examples: APIExample[]
  deprecated?: boolean
  tags: string[]
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type AuthenticationType = 'none' | 'api_key' | 'oauth2' | 'jwt'

export interface APIParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'body'
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  schema?: any
  example?: any
  validation?: ParameterValidation
}

export interface ParameterValidation {
  min?: number
  max?: number
  pattern?: string
  enum?: any[]
  format?: string
}

export interface APIResponse {
  statusCode: number
  description: string
  schema: any
  headers?: Record<string, string>
  examples?: Record<string, any>
}

export interface APIExample {
  name: string
  summary: string
  description: string
  value: any
}

export interface RateLimitConfig {
  requests: number
  window: number // seconds
  burst?: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface APIDocumentation {
  info: APIInfo
  servers: APIServer[]
  paths: Record<string, Record<HTTPMethod, APIEndpoint>>
  components: APIComponents
  security: SecurityScheme[]
  tags: APITag[]
}

export interface APIInfo {
  title: string
  description: string
  version: string
  contact: ContactInfo
  license: LicenseInfo
  termsOfService?: string
}

export interface ContactInfo {
  name: string
  email: string
  url?: string
}

export interface LicenseInfo {
  name: string
  url?: string
}

export interface APIServer {
  url: string
  description: string
  variables?: Record<string, ServerVariable>
}

export interface ServerVariable {
  enum?: string[]
  default: string
  description?: string
}

export interface APIComponents {
  schemas: Record<string, any>
  responses: Record<string, APIResponse>
  parameters: Record<string, APIParameter>
  examples: Record<string, APIExample>
  requestBodies: Record<string, any>
  headers: Record<string, any>
  securitySchemes: Record<string, SecurityScheme>
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  description?: string
  name?: string
  in?: 'query' | 'header' | 'cookie'
  scheme?: string
  bearerFormat?: string
  flows?: OAuthFlows
  openIdConnectUrl?: string
}

export interface OAuthFlows {
  implicit?: OAuthFlow
  password?: OAuthFlow
  clientCredentials?: OAuthFlow
  authorizationCode?: OAuthFlow
}

export interface OAuthFlow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}

export interface APITag {
  name: string
  description: string
  externalDocs?: ExternalDocumentation
}

export interface ExternalDocumentation {
  description: string
  url: string
}

// 第三方集成相关类型
export interface ThirdPartyIntegration {
  id: string
  name: string
  type: IntegrationType
  provider: string
  status: IntegrationStatus
  configuration: IntegrationConfig
  credentials: IntegrationCredentials
  endpoints: IntegrationEndpoint[]
  webhooks: WebhookConfig[]
  lastSync?: Date
  syncFrequency: SyncFrequency
  errorCount: number
  isActive: boolean
}

export type IntegrationType = 
  | 'banking'           // 银行API
  | 'accounting'        // 会计软件
  | 'crm'              // CRM系统
  | 'market_data'      // 市场数据
  | 'payment'          // 支付系统
  | 'analytics'        // 分析平台
  | 'notification'     // 通知服务
  | 'storage'          // 存储服务

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending' | 'suspended'

export type SyncFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual'

export interface IntegrationConfig {
  baseUrl: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  batchSize?: number
  customHeaders?: Record<string, string>
  customParameters?: Record<string, any>
  dataMapping: DataMapping[]
  filters?: DataFilter[]
}

export interface IntegrationCredentials {
  type: 'api_key' | 'oauth2' | 'basic_auth' | 'certificate'
  apiKey?: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
  refreshToken?: string
  username?: string
  password?: string
  certificate?: string
  expiresAt?: Date
}

export interface IntegrationEndpoint {
  name: string
  url: string
  method: HTTPMethod
  description: string
  requestSchema?: any
  responseSchema?: any
  rateLimit?: RateLimitConfig
}

export interface WebhookConfig {
  id: string
  url: string
  events: string[]
  secret?: string
  headers?: Record<string, string>
  isActive: boolean
  retryPolicy: WebhookRetryPolicy
}

export interface WebhookRetryPolicy {
  maxAttempts: number
  backoffMultiplier: number
  maxBackoffSeconds: number
}

export interface DataMapping {
  sourceField: string
  targetField: string
  transformation?: DataTransformation
  required: boolean
}

export interface DataTransformation {
  type: 'format' | 'calculate' | 'lookup' | 'conditional'
  parameters: Record<string, any>
}

export interface DataFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'
  value: any
}

export interface SyncResult {
  integrationId: string
  startTime: Date
  endTime: Date
  status: 'success' | 'partial' | 'failed'
  recordsProcessed: number
  recordsSucceeded: number
  recordsFailed: number
  errors: SyncError[]
  summary: string
}

export interface SyncError {
  record: any
  error: string
  code?: string
  retryable: boolean
}

export class OpenAPIService {
  private static instance: OpenAPIService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {}

  public static getInstance(): OpenAPIService {
    if (!OpenAPIService.instance) {
      OpenAPIService.instance = new OpenAPIService()
    }
    return OpenAPIService.instance
  }

  /**
   * 获取API文档
   */
  public async getAPIDocumentation(): Promise<APIDocumentation> {
    try {
      const response = await fetch(`${this.baseUrl}/api/docs/openapi.json`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('获取API文档失败:', error)
      throw error
    }
  }

  /**
   * 执行计算API调用
   */
  public async calculate(
    calculatorType: string,
    parameters: Record<string, any>,
    options?: {
      format?: 'json' | 'xml'
      callback?: string
      async?: boolean
    }
  ): Promise<CalculationResult> {
    try {
      const response = await this.makeAPIRequest('/api/v1/calculate', {
        method: 'POST',
        body: JSON.stringify({
          type: calculatorType,
          parameters,
          options
        })
      })

      return response.data
    } catch (error) {
      console.error('计算API调用失败:', error)
      throw error
    }
  }

  /**
   * 批量计算API
   */
  public async batchCalculate(
    requests: Array<{
      id: string
      type: string
      parameters: Record<string, any>
    }>
  ): Promise<Record<string, CalculationResult>> {
    try {
      const response = await this.makeAPIRequest('/api/v1/calculate/batch', {
        method: 'POST',
        body: JSON.stringify({ requests })
      })

      return response.data
    } catch (error) {
      console.error('批量计算API调用失败:', error)
      throw error
    }
  }

  /**
   * 获取分析结果API
   */
  public async getAnalysis(
    analysisId: string,
    format?: 'json' | 'xml'
  ): Promise<AnalysisResult> {
    try {
      const params = new URLSearchParams()
      if (format) params.append('format', format)

      const response = await this.makeAPIRequest(
        `/api/v1/analysis/${analysisId}?${params.toString()}`
      )

      return response.data
    } catch (error) {
      console.error('获取分析结果失败:', error)
      throw error
    }
  }

  /**
   * 创建第三方集成
   */
  public async createIntegration(data: {
    name: string
    type: IntegrationType
    provider: string
    configuration: IntegrationConfig
    credentials: IntegrationCredentials
  }): Promise<ThirdPartyIntegration | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/integrations', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('integration:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建集成失败:', error)
      return null
    }
  }

  /**
   * 获取集成列表
   */
  public async getIntegrations(
    organizationId: string,
    type?: IntegrationType
  ): Promise<ThirdPartyIntegration[]> {
    try {
      const params = new URLSearchParams()
      if (type) params.append('type', type)

      const response = await this.makeAuthenticatedRequest(
        `/api/organizations/${organizationId}/integrations?${params.toString()}`
      )

      return response.success ? response.data : []
    } catch (error) {
      console.error('获取集成列表失败:', error)
      return []
    }
  }

  /**
   * 测试集成连接
   */
  public async testIntegration(integrationId: string): Promise<{
    success: boolean
    responseTime: number
    error?: string
    details?: any
  }> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/integrations/${integrationId}/test`,
        { method: 'POST' }
      )

      return response.data
    } catch (error) {
      console.error('测试集成失败:', error)
      return {
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 同步集成数据
   */
  public async syncIntegration(
    integrationId: string,
    options?: {
      fullSync?: boolean
      startDate?: Date
      endDate?: Date
    }
  ): Promise<SyncResult | null> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/integrations/${integrationId}/sync`,
        {
          method: 'POST',
          body: JSON.stringify(options || {})
        }
      )

      if (response.success) {
        this.emit('integration:sync_started', { integrationId, options })
        return response.data
      }

      return null
    } catch (error) {
      console.error('同步集成数据失败:', error)
      return null
    }
  }

  /**
   * 获取同步历史
   */
  public async getSyncHistory(
    integrationId: string,
    limit = 50
  ): Promise<SyncResult[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/integrations/${integrationId}/sync-history?limit=${limit}`
      )

      return response.success ? response.data : []
    } catch (error) {
      console.error('获取同步历史失败:', error)
      return []
    }
  }

  /**
   * 创建Webhook
   */
  public async createWebhook(data: {
    integrationId: string
    url: string
    events: string[]
    secret?: string
    headers?: Record<string, string>
  }): Promise<WebhookConfig | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/webhooks', {
        method: 'POST',
        body: JSON.stringify(data)
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
   * 生成API客户端SDK
   */
  public async generateSDK(
    language: 'javascript' | 'python' | 'php' | 'java' | 'csharp' | 'go' | 'ruby',
    options?: {
      packageName?: string
      version?: string
      includeExamples?: boolean
    }
  ): Promise<Blob | null> {
    try {
      const params = new URLSearchParams()
      params.append('language', language)
      if (options?.packageName) params.append('packageName', options.packageName)
      if (options?.version) params.append('version', options.version)
      if (options?.includeExamples) params.append('includeExamples', 'true')

      const response = await fetch(
        `${this.baseUrl}/api/sdk/generate?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${authService.getAccessToken()}`
          }
        }
      )

      if (response.ok) {
        return await response.blob()
      }

      return null
    } catch (error) {
      console.error('生成SDK失败:', error)
      return null
    }
  }

  /**
   * 获取API使用统计
   */
  public async getAPIUsageStats(
    organizationId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day',
    limit = 30
  ): Promise<{
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    topEndpoints: Array<{ endpoint: string; requests: number }>
    timeline: Array<{ timestamp: Date; requests: number; errors: number }>
  }> {
    try {
      const params = new URLSearchParams()
      params.append('period', period)
      params.append('limit', limit.toString())

      const response = await this.makeAuthenticatedRequest(
        `/api/organizations/${organizationId}/api-usage?${params.toString()}`
      )

      return response.success ? response.data : {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        topEndpoints: [],
        timeline: []
      }
    } catch (error) {
      console.error('获取API使用统计失败:', error)
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        topEndpoints: [],
        timeline: []
      }
    }
  }

  /**
   * 发起API请求
   */
  private async makeAPIRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 发起认证API请求
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
export const openAPIService = OpenAPIService.getInstance()
