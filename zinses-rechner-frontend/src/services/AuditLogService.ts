/**
 * 审计日志系统
 * 记录用户操作、数据访问、系统事件等，确保合规性和安全性
 */

import { authService } from './AuthService'

// 审计日志相关类型定义
export interface AuditLog {
  id: string
  timestamp: Date
  userId?: string
  sessionId?: string
  organizationId?: string
  eventType: AuditEventType
  eventCategory: AuditEventCategory
  action: string
  resource: string
  resourceId?: string
  details: AuditLogDetails
  metadata: AuditLogMetadata
  severity: AuditSeverity
  status: AuditStatus
  ipAddress: string
  userAgent: string
  location?: GeoLocation
  tags: string[]
}

export type AuditEventType = 
  | 'authentication'    // 认证事件
  | 'authorization'     // 授权事件
  | 'data_access'       // 数据访问
  | 'data_modification' // 数据修改
  | 'system_event'      // 系统事件
  | 'security_event'    // 安全事件
  | 'compliance_event'  // 合规事件
  | 'user_action'       // 用户操作
  | 'admin_action'      // 管理员操作
  | 'api_call'          // API调用

export type AuditEventCategory = 
  | 'user_management'   // 用户管理
  | 'calculation'       // 计算操作
  | 'data_export'       // 数据导出
  | 'settings'          // 设置变更
  | 'integration'       // 集成操作
  | 'billing'           // 计费操作
  | 'security'          // 安全操作
  | 'system'            // 系统操作

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AuditStatus = 'success' | 'failure' | 'warning' | 'info'

export interface AuditLogDetails {
  description: string
  oldValue?: any
  newValue?: any
  affectedRecords?: number
  duration?: number
  errorMessage?: string
  stackTrace?: string
  requestId?: string
  correlationId?: string
  customFields?: Record<string, any>
}

export interface AuditLogMetadata {
  source: string
  version: string
  environment: string
  clientVersion?: string
  deviceType?: string
  browserInfo?: BrowserInfo
  networkInfo?: NetworkInfo
  performanceMetrics?: PerformanceMetrics
}

export interface BrowserInfo {
  name: string
  version: string
  engine: string
  platform: string
  language: string
  cookieEnabled: boolean
  javaEnabled: boolean
}

export interface NetworkInfo {
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export interface PerformanceMetrics {
  loadTime?: number
  renderTime?: number
  memoryUsage?: number
  cpuUsage?: number
}

export interface GeoLocation {
  country: string
  region: string
  city: string
  latitude?: number
  longitude?: number
  timezone: string
}

export interface AuditLogQuery {
  startDate?: Date
  endDate?: Date
  userId?: string
  organizationId?: string
  eventType?: AuditEventType
  eventCategory?: AuditEventCategory
  action?: string
  resource?: string
  severity?: AuditSeverity
  status?: AuditStatus
  ipAddress?: string
  tags?: string[]
  searchText?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AuditLogSummary {
  totalEvents: number
  eventsByType: Record<AuditEventType, number>
  eventsByCategory: Record<AuditEventCategory, number>
  eventsBySeverity: Record<AuditSeverity, number>
  eventsByStatus: Record<AuditStatus, number>
  topUsers: Array<{ userId: string; count: number }>
  topResources: Array<{ resource: string; count: number }>
  timeline: Array<{ date: Date; count: number }>
}

export interface AuditLogExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf'
  query: AuditLogQuery
  includeMetadata: boolean
  includeDetails: boolean
  fileName?: string
  compression?: 'none' | 'gzip' | 'zip'
}

export interface AuditLogRetentionPolicy {
  id: string
  name: string
  description: string
  retentionPeriod: number // days
  eventTypes: AuditEventType[]
  severityLevels: AuditSeverity[]
  archiveAfter?: number // days
  deleteAfter?: number // days
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuditLogAlert {
  id: string
  name: string
  description: string
  conditions: AuditLogAlertCondition[]
  actions: AuditLogAlertAction[]
  isActive: boolean
  lastTriggered?: Date
  triggerCount: number
  createdAt: Date
  updatedAt: Date
}

export interface AuditLogAlertCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'and' | 'or'
}

export interface AuditLogAlertAction {
  type: 'email' | 'webhook' | 'sms' | 'slack' | 'teams'
  configuration: Record<string, any>
  isActive: boolean
}

export class AuditLogService {
  private static instance: AuditLogService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private logBuffer: AuditLog[] = []
  private bufferSize = 100
  private flushInterval = 5000 // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null

  private constructor() {
    this.startBufferFlush()
  }

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService()
    }
    return AuditLogService.instance
  }

  /**
   * 记录审计日志
   */
  public async log(
    eventType: AuditEventType,
    eventCategory: AuditEventCategory,
    action: string,
    resource: string,
    details: Partial<AuditLogDetails> = {},
    options: {
      resourceId?: string
      severity?: AuditSeverity
      status?: AuditStatus
      tags?: string[]
      immediate?: boolean
    } = {}
  ): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: this.generateLogId(),
        timestamp: new Date(),
        userId: authService.getCurrentUser()?.id,
        sessionId: authService.getSessionId(),
        organizationId: authService.getCurrentUser()?.organizationId,
        eventType,
        eventCategory,
        action,
        resource,
        resourceId: options.resourceId,
        details: {
          description: details.description || `${action} on ${resource}`,
          ...details
        },
        metadata: await this.collectMetadata(),
        severity: options.severity || 'low',
        status: options.status || 'success',
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        location: await this.getGeoLocation(),
        tags: options.tags || []
      }

      if (options.immediate) {
        await this.sendLog(auditLog)
      } else {
        this.addToBuffer(auditLog)
      }
    } catch (error) {
      console.error('审计日志记录失败:', error)
    }
  }

  /**
   * 记录认证事件
   */
  public async logAuthentication(
    action: 'login' | 'logout' | 'login_failed' | 'password_reset' | 'mfa_enabled' | 'mfa_disabled',
    details: Partial<AuditLogDetails> = {},
    status: AuditStatus = 'success'
  ): Promise<void> {
    await this.log(
      'authentication',
      'user_management',
      action,
      'user_session',
      details,
      { severity: action.includes('failed') ? 'high' : 'medium', status, immediate: true }
    )
  }

  /**
   * 记录数据访问事件
   */
  public async logDataAccess(
    resource: string,
    resourceId: string,
    action: 'view' | 'download' | 'export',
    details: Partial<AuditLogDetails> = {}
  ): Promise<void> {
    await this.log(
      'data_access',
      'calculation',
      action,
      resource,
      details,
      { resourceId, severity: 'low' }
    )
  }

  /**
   * 记录数据修改事件
   */
  public async logDataModification(
    resource: string,
    resourceId: string,
    action: 'create' | 'update' | 'delete',
    oldValue: any,
    newValue: any,
    details: Partial<AuditLogDetails> = {}
  ): Promise<void> {
    await this.log(
      'data_modification',
      'calculation',
      action,
      resource,
      {
        ...details,
        oldValue,
        newValue
      },
      { resourceId, severity: 'medium', immediate: true }
    )
  }

  /**
   * 记录安全事件
   */
  public async logSecurityEvent(
    action: string,
    details: Partial<AuditLogDetails> = {},
    severity: AuditSeverity = 'high'
  ): Promise<void> {
    await this.log(
      'security_event',
      'security',
      action,
      'security_system',
      details,
      { severity, status: 'warning', immediate: true }
    )
  }

  /**
   * 查询审计日志
   */
  public async queryLogs(query: AuditLogQuery): Promise<{
    logs: AuditLog[]
    total: number
    hasMore: boolean
  }> {
    try {
      const params = new URLSearchParams()
      
      if (query.startDate) params.append('startDate', query.startDate.toISOString())
      if (query.endDate) params.append('endDate', query.endDate.toISOString())
      if (query.userId) params.append('userId', query.userId)
      if (query.organizationId) params.append('organizationId', query.organizationId)
      if (query.eventType) params.append('eventType', query.eventType)
      if (query.eventCategory) params.append('eventCategory', query.eventCategory)
      if (query.action) params.append('action', query.action)
      if (query.resource) params.append('resource', query.resource)
      if (query.severity) params.append('severity', query.severity)
      if (query.status) params.append('status', query.status)
      if (query.ipAddress) params.append('ipAddress', query.ipAddress)
      if (query.searchText) params.append('searchText', query.searchText)
      if (query.limit) params.append('limit', query.limit.toString())
      if (query.offset) params.append('offset', query.offset.toString())
      if (query.sortBy) params.append('sortBy', query.sortBy)
      if (query.sortOrder) params.append('sortOrder', query.sortOrder)
      if (query.tags) params.append('tags', query.tags.join(','))

      const response = await fetch(`${this.baseUrl}/api/audit/logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return {
          logs: data.logs || [],
          total: data.total || 0,
          hasMore: data.hasMore || false
        }
      }

      return { logs: [], total: 0, hasMore: false }
    } catch (error) {
      console.error('查询审计日志失败:', error)
      return { logs: [], total: 0, hasMore: false }
    }
  }

  /**
   * 获取审计日志摘要
   */
  public async getSummary(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<AuditLogSummary | null> {
    try {
      const params = new URLSearchParams()
      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())
      if (organizationId) params.append('organizationId', organizationId)

      const response = await fetch(`${this.baseUrl}/api/audit/summary?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.summary
      }

      return null
    } catch (error) {
      console.error('获取审计日志摘要失败:', error)
      return null
    }
  }

  /**
   * 导出审计日志
   */
  public async exportLogs(options: AuditLogExportOptions): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/audit/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(options)
      })

      if (response.ok) {
        return await response.blob()
      }

      return null
    } catch (error) {
      console.error('导出审计日志失败:', error)
      return null
    }
  }

  /**
   * 添加日志到缓冲区
   */
  private addToBuffer(log: AuditLog): void {
    this.logBuffer.push(log)
    
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushBuffer()
    }
  }

  /**
   * 刷新缓冲区
   */
  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return

    const logsToSend = [...this.logBuffer]
    this.logBuffer = []

    try {
      await fetch(`${this.baseUrl}/api/audit/logs/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({ logs: logsToSend })
      })
    } catch (error) {
      console.error('批量发送审计日志失败:', error)
      // 重新添加到缓冲区
      this.logBuffer.unshift(...logsToSend)
    }
  }

  /**
   * 发送单个日志
   */
  private async sendLog(log: AuditLog): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/audit/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(log)
      })
    } catch (error) {
      console.error('发送审计日志失败:', error)
      // 添加到缓冲区作为备选
      this.addToBuffer(log)
    }
  }

  /**
   * 启动缓冲区定时刷新
   */
  private startBufferFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer()
    }, this.flushInterval)
  }

  /**
   * 收集元数据
   */
  private async collectMetadata(): Promise<AuditLogMetadata> {
    return {
      source: 'zinses-rechner-frontend',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.VITE_APP_ENV || 'production',
      clientVersion: navigator.userAgent,
      deviceType: this.getDeviceType(),
      browserInfo: this.getBrowserInfo(),
      networkInfo: this.getNetworkInfo(),
      performanceMetrics: this.getPerformanceMetrics()
    }
  }

  /**
   * 生成日志ID
   */
  private generateLogId(): string {
    return 'audit_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
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
   * 获取地理位置信息
   */
  private async getGeoLocation(): Promise<GeoLocation | undefined> {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      return {
        country: data.country_name || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown',
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone || 'Unknown'
      }
    } catch {
      return undefined
    }
  }

  /**
   * 获取设备类型
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile'
    } else if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }

  /**
   * 获取浏览器信息
   */
  private getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent
    return {
      name: this.getBrowserName(userAgent),
      version: this.getBrowserVersion(userAgent),
      engine: this.getBrowserEngine(userAgent),
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      javaEnabled: false // Java is deprecated in modern browsers
    }
  }

  /**
   * 获取网络信息
   */
  private getNetworkInfo(): NetworkInfo | undefined {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      return {
        connectionType: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      }
    }
    return undefined
  }

  /**
   * 获取性能指标
   */
  private getPerformanceMetrics(): PerformanceMetrics | undefined {
    if (performance && performance.timing) {
      const timing = performance.timing
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        renderTime: timing.domContentLoadedEventEnd - timing.navigationStart,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
        cpuUsage: undefined // CPU usage is not available in browsers
      }
    }
    return undefined
  }

  /**
   * 获取浏览器名称
   */
  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'
    return 'Unknown'
  }

  /**
   * 获取浏览器版本
   */
  private getBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(chrome|firefox|safari|edge|opera)\/(\d+)/i)
    return match ? match[2] : 'Unknown'
  }

  /**
   * 获取浏览器引擎
   */
  private getBrowserEngine(userAgent: string): string {
    if (userAgent.includes('WebKit')) return 'WebKit'
    if (userAgent.includes('Gecko')) return 'Gecko'
    if (userAgent.includes('Trident')) return 'Trident'
    return 'Unknown'
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flushBuffer()
  }
}

// 导出单例实例
export const auditLogService = AuditLogService.getInstance()
