/**
 * 数据备份和恢复系统
 * 实现自动化数据备份和恢复，确保数据安全和业务连续性
 */

import { authService } from './AuthService'
import { auditLogService } from './AuditLogService'

// 备份相关类型定义
export interface BackupJob {
  id: string
  name: string
  description: string
  type: BackupType
  scope: BackupScope
  schedule: BackupSchedule
  retention: RetentionPolicy
  encryption: EncryptionConfig
  compression: CompressionConfig
  destination: BackupDestination
  status: BackupJobStatus
  lastRun?: Date
  nextRun?: Date
  createdAt: Date
  updatedAt: Date
  createdBy: string
  isActive: boolean
}

export type BackupType = 'full' | 'incremental' | 'differential' | 'snapshot'

export interface BackupScope {
  databases: string[]
  tables?: string[]
  userDataOnly: boolean
  includeSystemData: boolean
  includeCalculations: boolean
  includeUserProfiles: boolean
  includeOrganizationData: boolean
  customFilters?: BackupFilter[]
}

export interface BackupFilter {
  table: string
  condition: string
  parameters: Record<string, any>
}

export interface BackupSchedule {
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  interval: number
  time?: string // HH:MM format
  dayOfWeek?: number // 0-6, Sunday = 0
  dayOfMonth?: number // 1-31
  timezone: string
  isActive: boolean
}

export interface RetentionPolicy {
  keepDaily: number
  keepWeekly: number
  keepMonthly: number
  keepYearly: number
  maxAge: number // days
  maxSize: number // bytes
  autoCleanup: boolean
}

export interface EncryptionConfig {
  enabled: boolean
  algorithm: 'AES-256' | 'AES-128' | 'ChaCha20'
  keyDerivation: 'PBKDF2' | 'Argon2' | 'scrypt'
  keyId?: string
  customKey?: boolean
}

export interface CompressionConfig {
  enabled: boolean
  algorithm: 'gzip' | 'bzip2' | 'lz4' | 'zstd'
  level: number // 1-9
}

export interface BackupDestination {
  type: 'local' | 's3' | 'azure' | 'gcp' | 'ftp' | 'sftp'
  configuration: DestinationConfig
  testConnection: boolean
  isActive: boolean
}

export interface DestinationConfig {
  // S3配置
  s3?: {
    bucket: string
    region: string
    accessKeyId: string
    secretAccessKey: string
    endpoint?: string
    pathPrefix?: string
  }
  // Azure配置
  azure?: {
    storageAccount: string
    containerName: string
    accessKey: string
    pathPrefix?: string
  }
  // GCP配置
  gcp?: {
    projectId: string
    bucketName: string
    keyFile: string
    pathPrefix?: string
  }
  // FTP/SFTP配置
  ftp?: {
    host: string
    port: number
    username: string
    password: string
    path: string
    passive: boolean
    secure: boolean
  }
  // 本地配置
  local?: {
    path: string
    permissions: string
  }
}

export type BackupJobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'

export interface BackupExecution {
  id: string
  jobId: string
  type: BackupType
  status: BackupExecutionStatus
  startTime: Date
  endTime?: Date
  duration?: number // seconds
  size: number // bytes
  compressedSize?: number
  recordCount: number
  progress: number // 0-100
  logs: BackupLog[]
  metrics: BackupMetrics
  error?: BackupError
  checksum: string
  metadata: BackupMetadata
}

export type BackupExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface BackupLog {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  details?: any
}

export interface BackupMetrics {
  throughput: number // MB/s
  cpuUsage: number // percentage
  memoryUsage: number // bytes
  diskUsage: number // bytes
  networkUsage: number // bytes
}

export interface BackupError {
  code: string
  message: string
  details: string
  stackTrace?: string
  retryable: boolean
}

export interface BackupMetadata {
  version: string
  source: string
  environment: string
  databaseVersion: string
  applicationVersion: string
  customTags: Record<string, string>
}

export interface RestoreJob {
  id: string
  name: string
  description: string
  backupId: string
  targetEnvironment: string
  restoreScope: RestoreScope
  options: RestoreOptions
  status: RestoreJobStatus
  startTime: Date
  endTime?: Date
  progress: number
  logs: BackupLog[]
  createdBy: string
  approvedBy?: string
}

export interface RestoreScope {
  databases: string[]
  tables?: string[]
  pointInTime?: Date
  includeSystemData: boolean
  includeUserData: boolean
  customFilters?: BackupFilter[]
}

export interface RestoreOptions {
  overwriteExisting: boolean
  validateData: boolean
  skipErrors: boolean
  batchSize: number
  parallelism: number
  dryRun: boolean
}

export type RestoreJobStatus = 'pending' | 'approved' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface BackupCatalog {
  backups: BackupCatalogEntry[]
  totalSize: number
  totalCount: number
  oldestBackup?: Date
  newestBackup?: Date
}

export interface BackupCatalogEntry {
  id: string
  jobId: string
  jobName: string
  type: BackupType
  size: number
  compressedSize: number
  recordCount: number
  createdAt: Date
  expiresAt?: Date
  checksum: string
  isEncrypted: boolean
  isCompressed: boolean
  destination: string
  tags: string[]
  metadata: BackupMetadata
}

export interface BackupHealthCheck {
  jobId: string
  jobName: string
  status: 'healthy' | 'warning' | 'critical'
  lastBackup?: Date
  nextBackup?: Date
  issues: HealthIssue[]
  recommendations: string[]
  score: number // 0-100
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'schedule' | 'storage' | 'performance' | 'security' | 'data_integrity'
  message: string
  details: string
  resolution: string
}

export class DataBackupService {
  private static instance: DataBackupService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private activeJobs: Map<string, BackupExecution> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startHealthMonitoring()
  }

  public static getInstance(): DataBackupService {
    if (!DataBackupService.instance) {
      DataBackupService.instance = new DataBackupService()
    }
    return DataBackupService.instance
  }

  /**
   * 创建备份任务
   */
  public async createBackupJob(job: Omit<BackupJob, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<BackupJob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/backup/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(job)
      })

      if (response.ok) {
        const data = await response.json()
        
        // 记录审计日志
        await auditLogService.log(
          'system_event',
          'system',
          'backup_job_created',
          'backup_job',
          {
            description: `Backup job created: ${job.name}`,
            newValue: job
          },
          { resourceId: data.job.id, severity: 'medium', immediate: true }
        )

        return data.job
      }

      return null
    } catch (error) {
      console.error('创建备份任务失败:', error)
      return null
    }
  }

  /**
   * 获取备份任务列表
   */
  public async getBackupJobs(organizationId?: string): Promise<BackupJob[]> {
    try {
      const params = new URLSearchParams()
      if (organizationId) params.append('organizationId', organizationId)

      const response = await fetch(`${this.baseUrl}/api/backup/jobs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.jobs || []
      }

      return []
    } catch (error) {
      console.error('获取备份任务失败:', error)
      return []
    }
  }

  /**
   * 执行备份任务
   */
  public async executeBackupJob(jobId: string, type?: BackupType): Promise<BackupExecution | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/backup/jobs/${jobId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        const data = await response.json()
        const execution = data.execution
        
        // 添加到活动任务列表
        this.activeJobs.set(execution.id, execution)
        
        // 记录审计日志
        await auditLogService.log(
          'system_event',
          'system',
          'backup_job_executed',
          'backup_execution',
          {
            description: `Backup job executed: ${jobId}`,
            customFields: { jobId, type }
          },
          { resourceId: execution.id, severity: 'medium', immediate: true }
        )

        return execution
      }

      return null
    } catch (error) {
      console.error('执行备份任务失败:', error)
      return null
    }
  }

  /**
   * 获取备份执行状态
   */
  public async getBackupExecution(executionId: string): Promise<BackupExecution | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/backup/executions/${executionId}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const execution = data.execution
        
        // 更新活动任务列表
        if (execution.status === 'running') {
          this.activeJobs.set(executionId, execution)
        } else {
          this.activeJobs.delete(executionId)
        }
        
        return execution
      }

      return null
    } catch (error) {
      console.error('获取备份执行状态失败:', error)
      return null
    }
  }

  /**
   * 取消备份执行
   */
  public async cancelBackupExecution(executionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/backup/executions/${executionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        this.activeJobs.delete(executionId)
        
        // 记录审计日志
        await auditLogService.log(
          'system_event',
          'system',
          'backup_execution_cancelled',
          'backup_execution',
          {
            description: `Backup execution cancelled: ${executionId}`
          },
          { resourceId: executionId, severity: 'medium', immediate: true }
        )

        return true
      }

      return false
    } catch (error) {
      console.error('取消备份执行失败:', error)
      return false
    }
  }

  /**
   * 获取备份目录
   */
  public async getBackupCatalog(
    jobId?: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100
  ): Promise<BackupCatalog> {
    try {
      const params = new URLSearchParams()
      if (jobId) params.append('jobId', jobId)
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())
      params.append('limit', limit.toString())

      const response = await fetch(`${this.baseUrl}/api/backup/catalog?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.catalog
      }

      return {
        backups: [],
        totalSize: 0,
        totalCount: 0
      }
    } catch (error) {
      console.error('获取备份目录失败:', error)
      return {
        backups: [],
        totalSize: 0,
        totalCount: 0
      }
    }
  }

  /**
   * 创建恢复任务
   */
  public async createRestoreJob(restore: Omit<RestoreJob, 'id' | 'startTime' | 'progress' | 'logs' | 'createdBy'>): Promise<RestoreJob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/backup/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(restore)
      })

      if (response.ok) {
        const data = await response.json()
        
        // 记录审计日志
        await auditLogService.log(
          'system_event',
          'system',
          'restore_job_created',
          'restore_job',
          {
            description: `Restore job created: ${restore.name}`,
            newValue: restore
          },
          { resourceId: data.restore.id, severity: 'high', immediate: true }
        )

        return data.restore
      }

      return null
    } catch (error) {
      console.error('创建恢复任务失败:', error)
      return null
    }
  }

  /**
   * 验证备份完整性
   */
  public async verifyBackup(backupId: string): Promise<{
    isValid: boolean
    checksum: string
    issues: string[]
    details: any
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/backup/verify/${backupId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // 记录审计日志
        await auditLogService.log(
          'system_event',
          'system',
          'backup_verified',
          'backup',
          {
            description: `Backup verification completed: ${backupId}`,
            customFields: { isValid: data.verification.isValid, issues: data.verification.issues }
          },
          { resourceId: backupId, severity: 'low' }
        )

        return data.verification
      }

      return {
        isValid: false,
        checksum: '',
        issues: ['验证失败'],
        details: {}
      }
    } catch (error) {
      console.error('验证备份完整性失败:', error)
      return {
        isValid: false,
        checksum: '',
        issues: ['验证过程中发生错误'],
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * 测试备份目标连接
   */
  public async testDestination(destination: BackupDestination): Promise<{
    success: boolean
    responseTime: number
    error?: string
    details?: any
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/backup/test-destination`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(destination)
      })

      if (response.ok) {
        const data = await response.json()
        return data.test
      }

      return {
        success: false,
        responseTime: 0,
        error: '连接测试失败'
      }
    } catch (error) {
      console.error('测试备份目标连接失败:', error)
      return {
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取备份健康检查
   */
  public async getBackupHealthCheck(organizationId?: string): Promise<BackupHealthCheck[]> {
    try {
      const params = new URLSearchParams()
      if (organizationId) params.append('organizationId', organizationId)

      const response = await fetch(`${this.baseUrl}/api/backup/health?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.healthChecks || []
      }

      return []
    } catch (error) {
      console.error('获取备份健康检查失败:', error)
      return []
    }
  }

  /**
   * 清理过期备份
   */
  public async cleanupExpiredBackups(jobId?: string, dryRun = false): Promise<{
    deletedCount: number
    freedSpace: number
    deletedBackups: string[]
  }> {
    try {
      const params = new URLSearchParams()
      if (jobId) params.append('jobId', jobId)
      if (dryRun) params.append('dryRun', 'true')

      const response = await fetch(`${this.baseUrl}/api/backup/cleanup?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (!dryRun && data.cleanup.deletedCount > 0) {
          // 记录审计日志
          await auditLogService.log(
            'system_event',
            'system',
            'backup_cleanup_completed',
            'backup_system',
            {
              description: `Backup cleanup completed: ${data.cleanup.deletedCount} backups deleted`,
              customFields: data.cleanup
            },
            { severity: 'medium', immediate: true }
          )
        }

        return data.cleanup
      }

      return {
        deletedCount: 0,
        freedSpace: 0,
        deletedBackups: []
      }
    } catch (error) {
      console.error('清理过期备份失败:', error)
      return {
        deletedCount: 0,
        freedSpace: 0,
        deletedBackups: []
      }
    }
  }

  /**
   * 获取活动备份任务
   */
  public getActiveJobs(): BackupExecution[] {
    return Array.from(this.activeJobs.values())
  }

  /**
   * 启动健康监控
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthChecks = await this.getBackupHealthCheck()
        const criticalIssues = healthChecks.filter(check => check.status === 'critical')
        
        if (criticalIssues.length > 0) {
          // 记录关键问题
          await auditLogService.logSecurityEvent(
            'backup_health_critical',
            {
              description: `Critical backup health issues detected: ${criticalIssues.length} jobs`,
              customFields: { criticalJobs: criticalIssues.map(c => c.jobId) }
            },
            'critical'
          )
        }
      } catch (error) {
        console.error('备份健康监控失败:', error)
      }
    }, 5 * 60 * 1000) // 每5分钟检查一次
  }

  /**
   * 格式化文件大小
   */
  public formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  /**
   * 获取备份类型标签
   */
  public getBackupTypeLabel(type: BackupType): string {
    const labels: Record<BackupType, string> = {
      full: 'Vollständige Sicherung',
      incremental: 'Inkrementelle Sicherung',
      differential: 'Differentielle Sicherung',
      snapshot: 'Snapshot-Sicherung'
    }
    
    return labels[type] || type
  }

  /**
   * 获取备份状态标签
   */
  public getBackupStatusLabel(status: BackupJobStatus): string {
    const labels: Record<BackupJobStatus, string> = {
      idle: 'Bereit',
      running: 'Läuft',
      completed: 'Abgeschlossen',
      failed: 'Fehlgeschlagen',
      cancelled: 'Abgebrochen',
      paused: 'Pausiert'
    }
    
    return labels[status] || status
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    this.activeJobs.clear()
  }
}

// 导出单例实例
export const dataBackupService = DataBackupService.getInstance()
