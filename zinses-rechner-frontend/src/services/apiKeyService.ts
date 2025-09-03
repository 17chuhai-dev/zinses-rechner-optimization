/**
 * API密钥管理服务
 * 提供API密钥的生成、验证、管理和限流功能
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { generateAnonymousId, hashSensitiveData } from '@/utils/encryption'

// API密钥类型
export type ApiKeyType = 'development' | 'production' | 'enterprise'

// API密钥状态
export type ApiKeyStatus = 'active' | 'inactive' | 'revoked' | 'expired'

// 限流策略
export interface RateLimitPolicy {
  name: string
  requestsPerHour: number
  requestsPerDay: number
  requestsPerMonth: number
  burstLimit: number // 突发请求限制
  concurrentRequests: number // 并发请求限制
}

// API密钥接口
export interface ApiKey {
  id: string
  userId: string
  name: string
  description?: string
  key: string // 实际的API密钥
  keyHash: string // 密钥的哈希值（用于验证）
  type: ApiKeyType
  status: ApiKeyStatus
  permissions: string[] // 权限列表
  rateLimitPolicy: RateLimitPolicy
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
  expiresAt?: Date
  ipWhitelist?: string[] // IP白名单
  domainWhitelist?: string[] // 域名白名单
  usage: ApiKeyUsage
}

// API密钥使用统计
export interface ApiKeyUsage {
  totalRequests: number
  requestsToday: number
  requestsThisMonth: number
  lastRequestAt?: Date
  errorCount: number
  averageResponseTime: number
  topEndpoints: Array<{
    endpoint: string
    count: number
    lastUsed: Date
  }>
}

// 限流状态
export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetTime: Date
  retryAfter?: number // 秒数
  policy: RateLimitPolicy
}

// 请求记录
export interface ApiRequest {
  id: string
  apiKeyId: string
  endpoint: string
  method: string
  timestamp: Date
  responseTime: number
  statusCode: number
  ipAddress: string
  userAgent: string
  requestSize: number
  responseSize: number
  error?: string
}

// 预定义的限流策略
const RATE_LIMIT_POLICIES: Record<ApiKeyType, RateLimitPolicy> = {
  development: {
    name: 'Development',
    requestsPerHour: 100,
    requestsPerDay: 1000,
    requestsPerMonth: 10000,
    burstLimit: 10,
    concurrentRequests: 5
  },
  production: {
    name: 'Production',
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    requestsPerMonth: 100000,
    burstLimit: 50,
    concurrentRequests: 20
  },
  enterprise: {
    name: 'Enterprise',
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    requestsPerMonth: 1000000,
    burstLimit: 200,
    concurrentRequests: 100
  }
}

// 默认权限
const DEFAULT_PERMISSIONS: Record<ApiKeyType, string[]> = {
  development: [
    'calculators:read',
    'calculators:calculate',
    'history:read',
    'history:write'
  ],
  production: [
    'calculators:read',
    'calculators:calculate',
    'calculators:validate',
    'history:read',
    'history:write',
    'history:export',
    'users:read',
    'users:update'
  ],
  enterprise: [
    'calculators:*',
    'history:*',
    'users:*',
    'analytics:read',
    'reports:generate',
    'admin:read'
  ]
}

class ApiKeyService {
  private requestCounts: Map<string, Map<string, number>> = new Map()
  private lastRequestTimes: Map<string, Date> = new Map()
  private concurrentRequests: Map<string, number> = new Map()

  /**
   * 生成新的API密钥
   */
  async generateApiKey(
    userId: string,
    name: string,
    type: ApiKeyType,
    options?: {
      description?: string
      expiresAt?: Date
      ipWhitelist?: string[]
      domainWhitelist?: string[]
      customPermissions?: string[]
    }
  ): Promise<ApiKey> {
    const keyId = generateAnonymousId()
    const rawKey = this.generateRawApiKey(type)
    const keyHash = await hashSensitiveData(rawKey)

    const apiKey: ApiKey = {
      id: keyId,
      userId,
      name,
      description: options?.description,
      key: rawKey,
      keyHash,
      type,
      status: 'active',
      permissions: options?.customPermissions || DEFAULT_PERMISSIONS[type],
      rateLimitPolicy: RATE_LIMIT_POLICIES[type],
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: options?.expiresAt,
      ipWhitelist: options?.ipWhitelist,
      domainWhitelist: options?.domainWhitelist,
      usage: {
        totalRequests: 0,
        requestsToday: 0,
        requestsThisMonth: 0,
        errorCount: 0,
        averageResponseTime: 0,
        topEndpoints: []
      }
    }

    // 在实际实现中，这里会保存到数据库
    await this.saveApiKey(apiKey)

    return apiKey
  }

  /**
   * 验证API密钥
   */
  async validateApiKey(key: string): Promise<{
    valid: boolean
    apiKey?: ApiKey
    error?: string
  }> {
    try {
      const apiKey = await this.getApiKeyByKey(key)

      if (!apiKey) {
        return { valid: false, error: 'Invalid API key' }
      }

      if (apiKey.status !== 'active') {
        return { valid: false, error: `API key is ${apiKey.status}` }
      }

      if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
        await this.updateApiKeyStatus(apiKey.id, 'expired')
        return { valid: false, error: 'API key has expired' }
      }

      return { valid: true, apiKey }
    } catch (error) {
      return { valid: false, error: 'API key validation failed' }
    }
  }

  /**
   * 检查限流状态
   */
  async checkRateLimit(
    apiKey: ApiKey,
    endpoint: string,
    ipAddress?: string
  ): Promise<RateLimitStatus> {
    const policy = apiKey.rateLimitPolicy
    const keyId = apiKey.id
    const now = new Date()

    // 检查并发请求限制
    const currentConcurrent = this.concurrentRequests.get(keyId) || 0
    if (currentConcurrent >= policy.concurrentRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now.getTime() + 60000), // 1分钟后重试
        retryAfter: 60,
        policy
      }
    }

    // 检查小时限制
    const hourlyKey = `${keyId}:${this.getHourKey(now)}`
    const hourlyCount = this.getRequestCount(hourlyKey)

    if (hourlyCount >= policy.requestsPerHour) {
      const nextHour = new Date(now)
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)

      return {
        allowed: false,
        remaining: 0,
        resetTime: nextHour,
        retryAfter: Math.ceil((nextHour.getTime() - now.getTime()) / 1000),
        policy
      }
    }

    // 检查日限制
    const dailyKey = `${keyId}:${this.getDayKey(now)}`
    const dailyCount = this.getRequestCount(dailyKey)

    if (dailyCount >= policy.requestsPerDay) {
      const nextDay = new Date(now)
      nextDay.setDate(nextDay.getDate() + 1)
      nextDay.setHours(0, 0, 0, 0)

      return {
        allowed: false,
        remaining: 0,
        resetTime: nextDay,
        retryAfter: Math.ceil((nextDay.getTime() - now.getTime()) / 1000),
        policy
      }
    }

    // 检查突发限制
    const lastRequestTime = this.lastRequestTimes.get(keyId)
    if (lastRequestTime) {
      const timeDiff = now.getTime() - lastRequestTime.getTime()
      const minInterval = (60 * 60 * 1000) / policy.burstLimit // 毫秒

      if (timeDiff < minInterval) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(lastRequestTime.getTime() + minInterval),
          retryAfter: Math.ceil((minInterval - timeDiff) / 1000),
          policy
        }
      }
    }

    // 检查IP白名单
    if (apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0 && ipAddress) {
      if (!apiKey.ipWhitelist.includes(ipAddress)) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: now,
          policy
        }
      }
    }

    return {
      allowed: true,
      remaining: Math.min(
        policy.requestsPerHour - hourlyCount,
        policy.requestsPerDay - dailyCount
      ),
      resetTime: new Date(now.getTime() + 60 * 60 * 1000), // 下一小时
      policy
    }
  }

  /**
   * 记录API请求
   */
  async recordRequest(
    apiKey: ApiKey,
    request: Omit<ApiRequest, 'id' | 'apiKeyId' | 'timestamp'>
  ): Promise<void> {
    const now = new Date()
    const keyId = apiKey.id

    // 增加并发计数
    this.concurrentRequests.set(keyId, (this.concurrentRequests.get(keyId) || 0) + 1)

    // 记录请求时间
    this.lastRequestTimes.set(keyId, now)

    // 增加请求计数
    const hourlyKey = `${keyId}:${this.getHourKey(now)}`
    const dailyKey = `${keyId}:${this.getDayKey(now)}`
    const monthlyKey = `${keyId}:${this.getMonthKey(now)}`

    this.incrementRequestCount(hourlyKey)
    this.incrementRequestCount(dailyKey)
    this.incrementRequestCount(monthlyKey)

    // 创建请求记录
    const apiRequest: ApiRequest = {
      id: generateAnonymousId(),
      apiKeyId: keyId,
      timestamp: now,
      ...request
    }

    // 更新API密钥使用统计
    await this.updateApiKeyUsage(apiKey, apiRequest)

    // 在实际实现中，这里会保存到数据库
    await this.saveApiRequest(apiRequest)

    // 异步减少并发计数（模拟请求完成）
    setTimeout(() => {
      const current = this.concurrentRequests.get(keyId) || 0
      this.concurrentRequests.set(keyId, Math.max(0, current - 1))
    }, request.responseTime)
  }

  /**
   * 获取API密钥列表
   */
  async getApiKeys(userId: string): Promise<ApiKey[]> {
    // 在实际实现中，这里会从数据库查询
    return []
  }

  /**
   * 更新API密钥状态
   */
  async updateApiKeyStatus(keyId: string, status: ApiKeyStatus): Promise<void> {
    // 在实际实现中，这里会更新数据库
    console.log(`API密钥 ${keyId} 状态更新为: ${status}`)
  }

  /**
   * 撤销API密钥
   */
  async revokeApiKey(keyId: string): Promise<void> {
    await this.updateApiKeyStatus(keyId, 'revoked')
  }

  /**
   * 重新生成API密钥
   */
  async regenerateApiKey(keyId: string): Promise<string> {
    const apiKey = await this.getApiKeyById(keyId)
    if (!apiKey) {
      throw new Error('API密钥不存在')
    }

    const newRawKey = this.generateRawApiKey(apiKey.type)
    const newKeyHash = await hashSensitiveData(newRawKey)

    apiKey.key = newRawKey
    apiKey.keyHash = newKeyHash
    apiKey.updatedAt = new Date()

    await this.saveApiKey(apiKey)
    return newRawKey
  }

  /**
   * 获取API密钥使用统计
   */
  async getApiKeyStats(keyId: string, period: 'day' | 'week' | 'month' = 'day'): Promise<{
    requests: Array<{ date: string; count: number }>
    errors: Array<{ date: string; count: number }>
    responseTime: Array<{ date: string; avgTime: number }>
    topEndpoints: Array<{ endpoint: string; count: number }>
  }> {
    // 在实际实现中，这里会从数据库查询统计数据
    return {
      requests: [],
      errors: [],
      responseTime: [],
      topEndpoints: []
    }
  }

  // 私有方法

  /**
   * 生成原始API密钥
   */
  private generateRawApiKey(type: ApiKeyType): string {
    const prefix = {
      development: 'zr_dev_',
      production: 'zr_prod_',
      enterprise: 'zr_ent_'
    }[type]

    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return `${prefix}${randomPart}`
  }

  /**
   * 获取小时键
   */
  private getHourKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
  }

  /**
   * 获取日键
   */
  private getDayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  }

  /**
   * 获取月键
   */
  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}`
  }

  /**
   * 获取请求计数
   */
  private getRequestCount(key: string): number {
    const counts = this.requestCounts.get(key)
    if (!counts) return 0

    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    let count = 0
    counts.forEach((value, timestamp) => {
      if (new Date(timestamp) > hourAgo) {
        count += value
      }
    })

    return count
  }

  /**
   * 增加请求计数
   */
  private incrementRequestCount(key: string): void {
    const now = new Date().toISOString()

    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, new Map())
    }

    const counts = this.requestCounts.get(key)!
    counts.set(now, (counts.get(now) || 0) + 1)

    // 清理旧数据
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    counts.forEach((_, timestamp) => {
      if (new Date(timestamp) < dayAgo) {
        counts.delete(timestamp)
      }
    })
  }

  /**
   * 保存API密钥
   */
  private async saveApiKey(apiKey: ApiKey): Promise<void> {
    // 在实际实现中，这里会保存到数据库
    console.log('保存API密钥:', apiKey.id)
  }

  /**
   * 保存API请求记录
   */
  private async saveApiRequest(request: ApiRequest): Promise<void> {
    // 在实际实现中，这里会保存到数据库
    console.log('保存API请求记录:', request.id)
  }

  /**
   * 根据密钥获取API密钥对象
   */
  private async getApiKeyByKey(key: string): Promise<ApiKey | null> {
    // 在实际实现中，这里会从数据库查询
    return null
  }

  /**
   * 根据ID获取API密钥对象
   */
  private async getApiKeyById(keyId: string): Promise<ApiKey | null> {
    // 在实际实现中，这里会从数据库查询
    return null
  }

  /**
   * 更新API密钥使用统计
   */
  private async updateApiKeyUsage(apiKey: ApiKey, request: ApiRequest): Promise<void> {
    apiKey.usage.totalRequests++
    apiKey.usage.lastRequestAt = request.timestamp

    if (request.statusCode >= 400) {
      apiKey.usage.errorCount++
    }

    // 更新平均响应时间
    const totalTime = apiKey.usage.averageResponseTime * (apiKey.usage.totalRequests - 1)
    apiKey.usage.averageResponseTime = (totalTime + request.responseTime) / apiKey.usage.totalRequests

    // 更新热门端点
    const existingEndpoint = apiKey.usage.topEndpoints.find(e => e.endpoint === request.endpoint)
    if (existingEndpoint) {
      existingEndpoint.count++
      existingEndpoint.lastUsed = request.timestamp
    } else {
      apiKey.usage.topEndpoints.push({
        endpoint: request.endpoint,
        count: 1,
        lastUsed: request.timestamp
      })
    }

    // 保持热门端点列表最多10个
    apiKey.usage.topEndpoints.sort((a, b) => b.count - a.count)
    apiKey.usage.topEndpoints = apiKey.usage.topEndpoints.slice(0, 10)

    apiKey.lastUsedAt = request.timestamp
    apiKey.updatedAt = new Date()

    await this.saveApiKey(apiKey)
  }
}

// 导出单例实例
export const apiKeyService = new ApiKeyService()

// 导出类型和常量
export type {
  ApiKey,
  ApiKeyType,
  ApiKeyStatus,
  RateLimitPolicy,
  RateLimitStatus,
  ApiRequest,
  ApiKeyUsage
}

export { RATE_LIMIT_POLICIES, DEFAULT_PERMISSIONS }
