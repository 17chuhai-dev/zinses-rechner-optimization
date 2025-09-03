/**
 * 企业级批量计算服务
 * 提供大规模批量计算、并行处理、结果聚合等功能
 */

import { authService } from './AuthService'
import type { CalculationResult } from '@/types/calculator'

// 批量计算相关类型定义
export interface BulkCalculationJob {
  id: string
  organizationId: string
  name: string
  description?: string
  calculatorType: string
  inputTemplate: Record<string, any>
  variableFields: string[]
  inputData: BulkCalculationInput[]
  status: JobStatus
  progress: JobProgress
  results: BulkCalculationResult[]
  settings: BulkCalculationSettings
  createdBy: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  estimatedDuration?: number
  actualDuration?: number
}

export type JobStatus = 
  | 'pending'     // 等待执行
  | 'queued'      // 已排队
  | 'running'     // 执行中
  | 'paused'      // 已暂停
  | 'completed'   // 已完成
  | 'failed'      // 执行失败
  | 'cancelled'   // 已取消

export interface JobProgress {
  total: number
  completed: number
  failed: number
  percentage: number
  currentItem?: string
  estimatedTimeRemaining?: number
  throughputPerSecond?: number
}

export interface BulkCalculationInput {
  id: string
  rowIndex: number
  data: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  processingTime?: number
}

export interface BulkCalculationResult {
  inputId: string
  rowIndex: number
  inputData: Record<string, any>
  result: CalculationResult
  calculatedAt: Date
  processingTime: number
  status: 'success' | 'error'
  error?: string
}

export interface BulkCalculationSettings {
  parallelism: number           // 并行度
  batchSize: number            // 批处理大小
  retryAttempts: number        // 重试次数
  timeoutSeconds: number       // 超时时间
  priority: 'low' | 'normal' | 'high'
  notifyOnCompletion: boolean  // 完成时通知
  saveIntermediateResults: boolean  // 保存中间结果
  exportFormat: 'json' | 'csv' | 'xlsx' | 'pdf'
  aggregationRules: AggregationRule[]
}

export interface AggregationRule {
  field: string
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'std'
  groupBy?: string[]
  filter?: FilterCondition
}

export interface FilterCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'
  value: any
}

export interface BulkCalculationTemplate {
  id: string
  organizationId: string
  name: string
  description?: string
  calculatorType: string
  inputTemplate: Record<string, any>
  variableFields: VariableField[]
  defaultSettings: BulkCalculationSettings
  tags: string[]
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  usageCount: number
}

export interface VariableField {
  name: string
  label: string
  type: 'number' | 'string' | 'boolean' | 'date' | 'select'
  required: boolean
  defaultValue?: any
  validation?: FieldValidation
  options?: string[]  // for select type
  description?: string
}

export interface FieldValidation {
  min?: number
  max?: number
  pattern?: string
  customValidator?: string
}

export interface BulkCalculationSummary {
  jobId: string
  totalInputs: number
  successfulCalculations: number
  failedCalculations: number
  totalProcessingTime: number
  averageProcessingTime: number
  aggregatedResults: Record<string, any>
  insights: CalculationInsight[]
}

export interface CalculationInsight {
  type: 'trend' | 'outlier' | 'correlation' | 'recommendation'
  title: string
  description: string
  data: any
  confidence: number
}

export interface JobQueue {
  id: string
  organizationId: string
  name: string
  maxConcurrentJobs: number
  priority: 'low' | 'normal' | 'high'
  jobs: string[]  // job IDs
  isActive: boolean
}

export class BulkCalculationService {
  private static instance: BulkCalculationService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private listeners: Map<string, Function[]> = new Map()
  private activeJobs: Map<string, BulkCalculationJob> = new Map()
  private progressPollingIntervals: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {}

  public static getInstance(): BulkCalculationService {
    if (!BulkCalculationService.instance) {
      BulkCalculationService.instance = new BulkCalculationService()
    }
    return BulkCalculationService.instance
  }

  /**
   * 创建批量计算作业
   */
  public async createBulkCalculationJob(data: {
    organizationId: string
    name: string
    description?: string
    calculatorType: string
    inputTemplate: Record<string, any>
    variableFields: string[]
    inputData: Array<Record<string, any>>
    settings?: Partial<BulkCalculationSettings>
  }): Promise<BulkCalculationJob | null> {
    try {
      const defaultSettings: BulkCalculationSettings = {
        parallelism: 4,
        batchSize: 100,
        retryAttempts: 3,
        timeoutSeconds: 300,
        priority: 'normal',
        notifyOnCompletion: true,
        saveIntermediateResults: true,
        exportFormat: 'json',
        aggregationRules: []
      }

      const jobData = {
        ...data,
        settings: { ...defaultSettings, ...data.settings }
      }

      const response = await this.makeAuthenticatedRequest('/api/enterprise/bulk-calculations', {
        method: 'POST',
        body: JSON.stringify(jobData)
      })

      if (response.success) {
        const job = response.data
        this.activeJobs.set(job.id, job)
        this.emit('job:created', job)
        return job
      }

      return null
    } catch (error) {
      console.error('创建批量计算作业失败:', error)
      return null
    }
  }

  /**
   * 启动批量计算作业
   */
  public async startJob(jobId: string): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/bulk-calculations/${jobId}/start`,
        { method: 'POST' }
      )

      if (response.success) {
        this.startProgressPolling(jobId)
        this.emit('job:started', { jobId })
        return true
      }

      return false
    } catch (error) {
      console.error('启动作业失败:', error)
      return false
    }
  }

  /**
   * 暂停批量计算作业
   */
  public async pauseJob(jobId: string): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/bulk-calculations/${jobId}/pause`,
        { method: 'POST' }
      )

      if (response.success) {
        this.stopProgressPolling(jobId)
        this.emit('job:paused', { jobId })
        return true
      }

      return false
    } catch (error) {
      console.error('暂停作业失败:', error)
      return false
    }
  }

  /**
   * 恢复批量计算作业
   */
  public async resumeJob(jobId: string): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/bulk-calculations/${jobId}/resume`,
        { method: 'POST' }
      )

      if (response.success) {
        this.startProgressPolling(jobId)
        this.emit('job:resumed', { jobId })
        return true
      }

      return false
    } catch (error) {
      console.error('恢复作业失败:', error)
      return false
    }
  }

  /**
   * 取消批量计算作业
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/bulk-calculations/${jobId}/cancel`,
        { method: 'POST' }
      )

      if (response.success) {
        this.stopProgressPolling(jobId)
        this.activeJobs.delete(jobId)
        this.emit('job:cancelled', { jobId })
        return true
      }

      return false
    } catch (error) {
      console.error('取消作业失败:', error)
      return false
    }
  }

  /**
   * 获取作业详情
   */
  public async getJob(jobId: string): Promise<BulkCalculationJob | null> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/bulk-calculations/${jobId}`
      )
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取作业详情失败:', error)
      return null
    }
  }

  /**
   * 获取组织的批量计算作业列表
   */
  public async getOrganizationJobs(
    organizationId: string,
    options?: {
      status?: JobStatus
      limit?: number
      offset?: number
      sortBy?: 'createdAt' | 'name' | 'status'
      sortOrder?: 'asc' | 'desc'
    }
  ): Promise<{ jobs: BulkCalculationJob[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (options?.status) params.append('status', options.status)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())
      if (options?.sortBy) params.append('sortBy', options.sortBy)
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder)

      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/bulk-calculations?${params.toString()}`
      )

      return response.success ? response.data : { jobs: [], total: 0 }
    } catch (error) {
      console.error('获取作业列表失败:', error)
      return { jobs: [], total: 0 }
    }
  }

  /**
   * 获取作业结果
   */
  public async getJobResults(
    jobId: string,
    options?: {
      limit?: number
      offset?: number
      status?: 'success' | 'error'
    }
  ): Promise<{ results: BulkCalculationResult[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())
      if (options?.status) params.append('status', options.status)

      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/bulk-calculations/${jobId}/results?${params.toString()}`
      )

      return response.success ? response.data : { results: [], total: 0 }
    } catch (error) {
      console.error('获取作业结果失败:', error)
      return { results: [], total: 0 }
    }
  }

  /**
   * 获取作业摘要和洞察
   */
  public async getJobSummary(jobId: string): Promise<BulkCalculationSummary | null> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/bulk-calculations/${jobId}/summary`
      )
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取作业摘要失败:', error)
      return null
    }
  }

  /**
   * 导出作业结果
   */
  public async exportJobResults(
    jobId: string,
    format: 'json' | 'csv' | 'xlsx' | 'pdf',
    options?: {
      includeInputData?: boolean
      includeMetadata?: boolean
      aggregateResults?: boolean
    }
  ): Promise<Blob | null> {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      if (options?.includeInputData) params.append('includeInputData', 'true')
      if (options?.includeMetadata) params.append('includeMetadata', 'true')
      if (options?.aggregateResults) params.append('aggregateResults', 'true')

      const response = await fetch(
        `${this.baseUrl}/api/enterprise/bulk-calculations/${jobId}/export?${params.toString()}`,
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
      console.error('导出作业结果失败:', error)
      return null
    }
  }

  /**
   * 创建批量计算模板
   */
  public async createTemplate(data: {
    organizationId: string
    name: string
    description?: string
    calculatorType: string
    inputTemplate: Record<string, any>
    variableFields: VariableField[]
    defaultSettings: BulkCalculationSettings
    tags?: string[]
    isPublic?: boolean
  }): Promise<BulkCalculationTemplate | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/enterprise/bulk-calculation-templates', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('template:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建模板失败:', error)
      return null
    }
  }

  /**
   * 获取组织的模板列表
   */
  public async getOrganizationTemplates(organizationId: string): Promise<BulkCalculationTemplate[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/organizations/${organizationId}/bulk-calculation-templates`
      )
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取模板列表失败:', error)
      return []
    }
  }

  /**
   * 从模板创建作业
   */
  public async createJobFromTemplate(
    templateId: string,
    data: {
      name: string
      description?: string
      inputData: Array<Record<string, any>>
      settings?: Partial<BulkCalculationSettings>
    }
  ): Promise<BulkCalculationJob | null> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/enterprise/bulk-calculation-templates/${templateId}/create-job`,
        {
          method: 'POST',
          body: JSON.stringify(data)
        }
      )

      if (response.success) {
        const job = response.data
        this.activeJobs.set(job.id, job)
        this.emit('job:created_from_template', job)
        return job
      }

      return null
    } catch (error) {
      console.error('从模板创建作业失败:', error)
      return null
    }
  }

  /**
   * 开始进度轮询
   */
  private startProgressPolling(jobId: string): void {
    if (this.progressPollingIntervals.has(jobId)) {
      return
    }

    const interval = setInterval(async () => {
      try {
        const job = await this.getJob(jobId)
        if (job) {
          this.activeJobs.set(jobId, job)
          this.emit('job:progress', job)

          if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
            this.stopProgressPolling(jobId)
            this.emit('job:finished', job)
          }
        }
      } catch (error) {
        console.error('轮询作业进度失败:', error)
      }
    }, 2000) // 每2秒轮询一次

    this.progressPollingIntervals.set(jobId, interval)
  }

  /**
   * 停止进度轮询
   */
  private stopProgressPolling(jobId: string): void {
    const interval = this.progressPollingIntervals.get(jobId)
    if (interval) {
      clearInterval(interval)
      this.progressPollingIntervals.delete(jobId)
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
    // 清理所有轮询间隔
    this.progressPollingIntervals.forEach(interval => clearInterval(interval))
    this.progressPollingIntervals.clear()
    
    this.listeners.clear()
    this.activeJobs.clear()
  }
}

// 导出单例实例
export const bulkCalculationService = BulkCalculationService.getInstance()
