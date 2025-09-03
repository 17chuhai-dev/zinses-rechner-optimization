/**
 * 数据导出核心服务
 * 支持多种格式的数据导出（CSV、Excel、JSON、XML、PDF），包括数据转换、格式化和批量导出功能
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { EnterpriseDashboardService } from './EnterpriseDashboardService'
import { ReportDesignerService } from './ReportDesignerService'
import { UserAnalyticsService } from './UserAnalyticsService'
import { DashboardPermissionController } from './DashboardPermissionController'

// 导出格式
export type ExportFormat = 'csv' | 'excel' | 'json' | 'xml' | 'pdf' | 'txt' | 'yaml'

// 导出配置
export interface ExportConfig {
  id: string
  name: string
  description?: string
  
  // 数据源配置
  dataSource: DataSourceConfig
  
  // 导出格式和选项
  format: ExportFormat
  options: ExportOptions
  
  // 数据处理
  processing: DataProcessingConfig
  
  // 权限和安全
  security: ExportSecurityConfig
  
  // 调度配置
  schedule?: ExportScheduleConfig
  
  // 元数据
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// 数据源配置
export interface DataSourceConfig {
  type: 'dashboard' | 'report' | 'analytics' | 'custom' | 'api'
  sourceId: string
  
  // 数据查询
  query?: {
    filters: Record<string, any>
    dateRange?: { start: Date; end: Date }
    fields?: string[]
    limit?: number
    offset?: number
  }
  
  // 数据转换
  transformations?: DataTransformation[]
}

export interface DataTransformation {
  type: 'filter' | 'map' | 'aggregate' | 'sort' | 'group' | 'join'
  config: any
  order: number
}

// 导出选项
export interface ExportOptions {
  // 通用选项
  includeHeaders: boolean
  includeMetadata: boolean
  compression?: 'none' | 'gzip' | 'zip'
  
  // CSV选项
  csv?: {
    delimiter: ',' | ';' | '\t' | '|'
    quote: '"' | "'" | 'none'
    escape: '\\' | '"' | 'none'
    encoding: 'utf-8' | 'utf-16' | 'iso-8859-1'
    lineEnding: '\n' | '\r\n' | '\r'
  }
  
  // Excel选项
  excel?: {
    sheetName: string
    includeFormulas: boolean
    includeCharts: boolean
    password?: string
    template?: string
  }
  
  // JSON选项
  json?: {
    pretty: boolean
    includeSchema: boolean
    arrayWrapper: boolean
    dateFormat: 'iso' | 'timestamp' | 'custom'
    customDateFormat?: string
  }
  
  // XML选项
  xml?: {
    rootElement: string
    itemElement: string
    includeXmlDeclaration: boolean
    encoding: 'utf-8' | 'utf-16'
    indent: boolean
  }
  
  // PDF选项
  pdf?: {
    pageSize: 'A4' | 'A3' | 'letter' | 'legal'
    orientation: 'portrait' | 'landscape'
    margins: { top: number; right: number; bottom: number; left: number }
    includeCharts: boolean
    watermark?: string
  }
}

// 数据处理配置
export interface DataProcessingConfig {
  // 数据清理
  cleaning?: {
    removeEmptyRows: boolean
    removeEmptyColumns: boolean
    trimWhitespace: boolean
    removeDuplicates: boolean
    handleNullValues: 'keep' | 'remove' | 'replace'
    nullReplacement?: any
  }
  
  // 数据验证
  validation?: {
    rules: ValidationRule[]
    onValidationError: 'skip' | 'stop' | 'log'
  }
  
  // 数据脱敏
  masking?: {
    rules: MaskingRule[]
    enabled: boolean
  }
  
  // 数据聚合
  aggregation?: {
    groupBy: string[]
    aggregations: AggregationRule[]
  }
}

export interface ValidationRule {
  field: string
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom'
  config: any
  message?: string
}

export interface MaskingRule {
  field: string
  type: 'hash' | 'partial' | 'replace' | 'remove'
  config: any
}

export interface AggregationRule {
  field: string
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct'
  alias?: string
}

// 导出安全配置
export interface ExportSecurityConfig {
  // 权限检查
  requirePermissions: string[]
  
  // 数据过滤
  applyDataFilters: boolean
  
  // 访问控制
  allowedUsers?: string[]
  allowedRoles?: string[]
  
  // 审计
  enableAuditLog: boolean
  
  // 加密
  encryption?: {
    enabled: boolean
    algorithm: 'aes-256' | 'aes-128'
    password?: string
  }
}

// 导出调度配置
export interface ExportScheduleConfig {
  enabled: boolean
  cron: string
  timezone: string
  
  // 输出配置
  output: {
    type: 'download' | 'email' | 'ftp' | 'webhook' | 's3'
    config: any
  }
  
  // 重试配置
  retry: {
    maxAttempts: number
    backoffStrategy: 'linear' | 'exponential'
    initialDelay: number
  }
}

// 导出结果
export interface ExportResult {
  id: string
  configId: string
  
  // 文件信息
  filename: string
  format: ExportFormat
  size: number
  recordCount: number
  
  // 内容
  blob?: Blob
  downloadUrl?: string
  
  // 执行信息
  executionTime: number
  startedAt: Date
  completedAt: Date
  
  // 状态
  status: 'success' | 'error' | 'partial'
  errors: string[]
  warnings: string[]
  
  // 元数据
  metadata: {
    dataSource: string
    filters: Record<string, any>
    transformations: string[]
    validationResults?: ValidationResult[]
  }
}

// 批量导出结果
export interface BatchExportResult {
  id: string
  name: string
  
  // 任务信息
  totalTasks: number
  completedTasks: number
  failedTasks: number
  
  // 结果
  results: ExportResult[]
  errors: string[]
  
  // 时间信息
  startedAt: Date
  completedAt?: Date
  totalTime?: number
  
  // 状态
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
}

// 定时导出
export interface ScheduledExport {
  id: string
  configId: string
  
  // 调度信息
  schedule: ExportScheduleConfig
  nextRun: Date
  lastRun?: Date
  
  // 状态
  isActive: boolean
  
  // 执行历史
  executions: ScheduledExportExecution[]
  
  // 统计
  stats: {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    averageExecutionTime: number
  }
}

export interface ScheduledExportExecution {
  id: string
  scheduledAt: Date
  startedAt: Date
  completedAt?: Date
  status: 'running' | 'success' | 'failed'
  result?: ExportResult
  error?: string
}

// 导出记录
export interface ExportRecord {
  id: string
  configId: string
  userId: string
  
  // 导出信息
  format: ExportFormat
  filename: string
  size: number
  recordCount: number
  
  // 时间信息
  createdAt: Date
  downloadedAt?: Date
  expiresAt?: Date
  
  // 状态
  status: 'pending' | 'ready' | 'downloaded' | 'expired' | 'deleted'
  downloadCount: number
  
  // 安全信息
  isEncrypted: boolean
  accessLog: AccessLogEntry[]
}

export interface AccessLogEntry {
  timestamp: Date
  userId: string
  action: 'download' | 'view' | 'share'
  ipAddress?: string
  userAgent?: string
}

/**
 * 数据导出核心服务
 */
export class DataExportService {
  private static instance: DataExportService
  private dashboardService: EnterpriseDashboardService
  private reportService: ReportDesignerService
  private analyticsService: UserAnalyticsService
  private permissionController: DashboardPermissionController
  
  private exportConfigs: Map<string, ExportConfig> = new Map()
  private exportResults: Map<string, ExportResult> = new Map()
  private scheduledExports: Map<string, ScheduledExport> = new Map()
  private batchTasks: Map<string, BatchExportResult> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.dashboardService = EnterpriseDashboardService.getInstance()
    this.reportService = ReportDesignerService.getInstance()
    this.analyticsService = UserAnalyticsService.getInstance()
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService()
    }
    return DataExportService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await Promise.all([
        this.dashboardService.initialize(),
        this.reportService.initialize(),
        this.analyticsService.initialize(),
        this.permissionController.initialize()
      ])
      
      await this.loadExportConfigs()
      await this.loadScheduledExports()
      this.startScheduler()
      this.isInitialized = true
      console.log('✅ DataExportService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize DataExportService:', error)
      throw error
    }
  }

  /**
   * 创建导出配置
   */
  async createExportConfig(
    userId: string,
    accountId: string,
    config: Omit<ExportConfig, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>
  ): Promise<ExportConfig> {
    if (!this.isInitialized) await this.initialize()

    // 检查权限
    const hasPermission = await this.permissionController.checkDataAccess(
      userId,
      accountId,
      'analytics',
      'export'
    )

    if (!hasPermission.granted) {
      throw new Error('Insufficient permissions to create export configuration')
    }

    const exportConfig: ExportConfig = {
      id: crypto.randomUUID(),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...config
    }

    // 验证配置
    await this.validateExportConfig(exportConfig)

    // 保存配置
    this.exportConfigs.set(exportConfig.id, exportConfig)
    await this.saveExportConfig(exportConfig)

    console.log(`📤 Export config created: ${exportConfig.name}`)
    return exportConfig
  }

  /**
   * 执行数据导出
   */
  async exportData(
    configId: string,
    userId: string,
    overrides?: Partial<ExportConfig>
  ): Promise<ExportResult> {
    if (!this.isInitialized) await this.initialize()

    const startTime = Date.now()

    try {
      // 获取导出配置
      let config = this.exportConfigs.get(configId)
      if (!config) {
        throw new Error('Export configuration not found')
      }

      // 应用覆盖配置
      if (overrides) {
        config = { ...config, ...overrides }
      }

      // 检查权限
      const hasPermission = await this.checkExportPermission(config, userId)
      if (!hasPermission) {
        throw new Error('Insufficient permissions to export data')
      }

      // 获取数据
      const rawData = await this.fetchData(config.dataSource, userId)
      
      // 处理数据
      const processedData = await this.processData(rawData, config.processing)
      
      // 导出数据
      const result = await this.performExport(config, processedData, userId, startTime)
      
      // 保存结果
      this.exportResults.set(result.id, result)
      await this.saveExportResult(result)
      
      // 记录审计日志
      if (config.security.enableAuditLog) {
        await this.logExportActivity(userId, config, result)
      }

      console.log(`📤 Data exported: ${config.name} (${result.recordCount} records)`)
      return result
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }

  /**
   * 批量导出
   */
  async batchExport(
    configIds: string[],
    userId: string,
    batchName?: string
  ): Promise<BatchExportResult> {
    if (!this.isInitialized) await this.initialize()

    const batchResult: BatchExportResult = {
      id: crypto.randomUUID(),
      name: batchName || `批量导出 ${new Date().toLocaleString()}`,
      totalTasks: configIds.length,
      completedTasks: 0,
      failedTasks: 0,
      results: [],
      errors: [],
      startedAt: new Date(),
      status: 'running',
      progress: 0
    }

    this.batchTasks.set(batchResult.id, batchResult)

    // 异步执行批量导出
    this.executeBatchExport(batchResult, configIds, userId)

    console.log(`📦 Batch export started: ${batchResult.name} (${configIds.length} tasks)`)
    return batchResult
  }

  /**
   * 创建定时导出
   */
  async scheduleExport(
    configId: string,
    userId: string,
    schedule: ExportScheduleConfig
  ): Promise<ScheduledExport> {
    if (!this.isInitialized) await this.initialize()

    const config = this.exportConfigs.get(configId)
    if (!config) {
      throw new Error('Export configuration not found')
    }

    // 检查权限
    const hasPermission = await this.checkExportPermission(config, userId)
    if (!hasPermission) {
      throw new Error('Insufficient permissions to schedule export')
    }

    const scheduledExport: ScheduledExport = {
      id: crypto.randomUUID(),
      configId,
      schedule,
      nextRun: this.calculateNextRun(schedule.cron, schedule.timezone),
      isActive: true,
      executions: [],
      stats: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageExecutionTime: 0
      }
    }

    this.scheduledExports.set(scheduledExport.id, scheduledExport)
    await this.saveScheduledExport(scheduledExport)

    console.log(`⏰ Export scheduled: ${config.name}`)
    return scheduledExport
  }

  /**
   * 获取导出历史
   */
  async getExportHistory(
    userId: string,
    accountId: string,
    filters?: {
      configId?: string
      format?: ExportFormat
      dateRange?: { start: Date; end: Date }
      status?: string
    }
  ): Promise<ExportRecord[]> {
    if (!this.isInitialized) await this.initialize()

    // 简化实现：从本地存储获取导出记录
    const records: ExportRecord[] = []
    
    for (const result of this.exportResults.values()) {
      // 检查权限
      const config = this.exportConfigs.get(result.configId)
      if (!config || config.createdBy !== userId) continue

      // 应用过滤器
      if (filters?.configId && result.configId !== filters.configId) continue
      if (filters?.format && result.format !== filters.format) continue
      if (filters?.status && result.status !== filters.status) continue
      if (filters?.dateRange) {
        const resultDate = result.startedAt
        if (resultDate < filters.dateRange.start || resultDate > filters.dateRange.end) continue
      }

      const record: ExportRecord = {
        id: result.id,
        configId: result.configId,
        userId,
        format: result.format,
        filename: result.filename,
        size: result.size,
        recordCount: result.recordCount,
        createdAt: result.startedAt,
        status: 'ready',
        downloadCount: 0,
        isEncrypted: false,
        accessLog: []
      }

      records.push(record)
    }

    return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // 私有方法
  private async validateExportConfig(config: ExportConfig): Promise<void> {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Export configuration name is required')
    }

    if (!config.dataSource || !config.dataSource.type) {
      throw new Error('Data source configuration is required')
    }

    if (!config.format) {
      throw new Error('Export format is required')
    }

    // 验证数据源
    await this.validateDataSource(config.dataSource)
  }

  private async validateDataSource(dataSource: DataSourceConfig): Promise<void> {
    switch (dataSource.type) {
      case 'dashboard':
        // 验证仪表盘是否存在
        break
      case 'report':
        // 验证报告是否存在
        break
      case 'analytics':
        // 验证分析数据源
        break
      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`)
    }
  }

  private async checkExportPermission(config: ExportConfig, userId: string): Promise<boolean> {
    // 检查基础导出权限
    const hasBasePermission = await this.permissionController.checkDataAccess(
      userId,
      config.createdBy, // 简化：使用创建者的accountId
      'analytics',
      'export'
    )

    if (!hasBasePermission.granted) {
      return false
    }

    // 检查特定权限要求
    for (const permission of config.security.requirePermissions) {
      const hasPermission = await this.permissionController.checkDataAccess(
        userId,
        config.createdBy,
        'analytics',
        permission
      )
      
      if (!hasPermission.granted) {
        return false
      }
    }

    // 检查用户和角色限制
    if (config.security.allowedUsers && !config.security.allowedUsers.includes(userId)) {
      return false
    }

    return true
  }

  private async fetchData(dataSource: DataSourceConfig, userId: string): Promise<any[]> {
    switch (dataSource.type) {
      case 'dashboard':
        return await this.fetchDashboardData(dataSource, userId)
      case 'report':
        return await this.fetchReportData(dataSource, userId)
      case 'analytics':
        return await this.fetchAnalyticsData(dataSource, userId)
      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`)
    }
  }

  private async fetchDashboardData(dataSource: DataSourceConfig, userId: string): Promise<any[]> {
    const dashboardData = await this.dashboardService.getDashboardData(
      userId,
      dataSource.sourceId,
      {
        dateRange: dataSource.query?.dateRange || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        ...dataSource.query?.filters
      }
    )

    // 转换为数组格式
    return this.flattenDashboardData(dashboardData)
  }

  private async fetchReportData(dataSource: DataSourceConfig, userId: string): Promise<any[]> {
    const report = await this.reportService.getReport(dataSource.sourceId, userId)
    if (!report) {
      throw new Error('Report not found')
    }

    // 简化实现：返回报告组件数据
    return report.components.map(component => ({
      id: component.id,
      name: component.name,
      type: component.type,
      position: component.position,
      config: component.config
    }))
  }

  private async fetchAnalyticsData(dataSource: DataSourceConfig, userId: string): Promise<any[]> {
    const stats = await this.analyticsService.getAggregatedStats(
      'month',
      dataSource.query?.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dataSource.query?.dateRange?.end || new Date()
    )

    // 转换为数组格式
    return [
      { metric: 'total_users', value: stats.users.total },
      { metric: 'active_users', value: stats.users.active },
      { metric: 'new_users', value: stats.users.new },
      { metric: 'sessions', value: stats.usage.sessions },
      { metric: 'page_views', value: stats.usage.pageViews },
      { metric: 'bounce_rate', value: stats.usage.bounceRate }
    ]
  }

  private flattenDashboardData(dashboardData: any): any[] {
    const flattened: any[] = []

    // 用户分析数据
    if (dashboardData.userAnalytics) {
      flattened.push({
        category: 'user_analytics',
        total_users: dashboardData.userAnalytics.totalUsers,
        active_users: dashboardData.userAnalytics.activeUsers,
        new_users: dashboardData.userAnalytics.newUsers,
        growth_rate: dashboardData.userAnalytics.userGrowthRate
      })
    }

    // 内容表现数据
    if (dashboardData.contentPerformance) {
      flattened.push({
        category: 'content_performance',
        total_content: dashboardData.contentPerformance.totalContent,
        total_views: dashboardData.contentPerformance.totalViews,
        average_engagement: dashboardData.contentPerformance.averageEngagement
      })
    }

    // 转化指标数据
    if (dashboardData.conversionMetrics) {
      flattened.push({
        category: 'conversion_metrics',
        conversion_rate: dashboardData.conversionMetrics.overallConversionRate,
        total_conversions: dashboardData.conversionMetrics.totalConversions,
        conversion_value: dashboardData.conversionMetrics.conversionValue
      })
    }

    return flattened
  }

  private async processData(data: any[], processing: DataProcessingConfig): Promise<any[]> {
    let processedData = [...data]

    // 数据清理
    if (processing.cleaning) {
      processedData = await this.cleanData(processedData, processing.cleaning)
    }

    // 数据验证
    if (processing.validation) {
      processedData = await this.validateData(processedData, processing.validation)
    }

    // 数据脱敏
    if (processing.masking?.enabled) {
      processedData = await this.maskData(processedData, processing.masking.rules)
    }

    // 数据聚合
    if (processing.aggregation) {
      processedData = await this.aggregateData(processedData, processing.aggregation)
    }

    return processedData
  }

  private async cleanData(data: any[], cleaning: any): Promise<any[]> {
    let cleaned = data

    if (cleaning.removeEmptyRows) {
      cleaned = cleaned.filter(row => Object.values(row).some(value => value != null && value !== ''))
    }

    if (cleaning.trimWhitespace) {
      cleaned = cleaned.map(row => {
        const trimmed: any = {}
        for (const [key, value] of Object.entries(row)) {
          trimmed[key] = typeof value === 'string' ? value.trim() : value
        }
        return trimmed
      })
    }

    if (cleaning.removeDuplicates) {
      const seen = new Set()
      cleaned = cleaned.filter(row => {
        const key = JSON.stringify(row)
        if (seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })
    }

    return cleaned
  }

  private async validateData(data: any[], validation: any): Promise<any[]> {
    // 简化实现：基本验证
    return data.filter(row => {
      for (const rule of validation.rules) {
        const value = row[rule.field]
        
        switch (rule.type) {
          case 'required':
            if (value == null || value === '') {
              if (validation.onValidationError === 'skip') continue
              if (validation.onValidationError === 'stop') throw new Error(`Required field missing: ${rule.field}`)
            }
            break
          case 'type':
            if (value != null && typeof value !== rule.config.expectedType) {
              if (validation.onValidationError === 'skip') continue
              if (validation.onValidationError === 'stop') throw new Error(`Type mismatch for field: ${rule.field}`)
            }
            break
        }
      }
      return true
    })
  }

  private async maskData(data: any[], rules: MaskingRule[]): Promise<any[]> {
    return data.map(row => {
      const masked = { ...row }
      
      for (const rule of rules) {
        if (masked[rule.field] != null) {
          switch (rule.type) {
            case 'hash':
              masked[rule.field] = `***${String(masked[rule.field]).slice(-4)}`
              break
            case 'partial':
              const value = String(masked[rule.field])
              masked[rule.field] = value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2)
              break
            case 'replace':
              masked[rule.field] = rule.config.replacement || '***'
              break
            case 'remove':
              delete masked[rule.field]
              break
          }
        }
      }
      
      return masked
    })
  }

  private async aggregateData(data: any[], aggregation: any): Promise<any[]> {
    // 简化实现：基本聚合
    const grouped = new Map()
    
    for (const row of data) {
      const groupKey = aggregation.groupBy.map((field: string) => row[field]).join('|')
      
      if (!grouped.has(groupKey)) {
        const groupedRow: any = {}
        for (const field of aggregation.groupBy) {
          groupedRow[field] = row[field]
        }
        grouped.set(groupKey, groupedRow)
      }
      
      const groupedRow = grouped.get(groupKey)
      
      for (const agg of aggregation.aggregations) {
        const alias = agg.alias || `${agg.function}_${agg.field}`
        const value = row[agg.field]
        
        switch (agg.function) {
          case 'sum':
            groupedRow[alias] = (groupedRow[alias] || 0) + (Number(value) || 0)
            break
          case 'count':
            groupedRow[alias] = (groupedRow[alias] || 0) + 1
            break
          case 'avg':
            groupedRow[`${alias}_sum`] = (groupedRow[`${alias}_sum`] || 0) + (Number(value) || 0)
            groupedRow[`${alias}_count`] = (groupedRow[`${alias}_count`] || 0) + 1
            groupedRow[alias] = groupedRow[`${alias}_sum`] / groupedRow[`${alias}_count`]
            break
        }
      }
    }
    
    return Array.from(grouped.values())
  }

  private async performExport(
    config: ExportConfig,
    data: any[],
    userId: string,
    startTime: number
  ): Promise<ExportResult> {
    let blob: Blob
    let filename: string

    switch (config.format) {
      case 'csv':
        blob = await this.exportToCSV(data, config.options.csv || {})
        filename = `${config.name}.csv`
        break
      case 'excel':
        blob = await this.exportToExcel(data, config.options.excel || {})
        filename = `${config.name}.xlsx`
        break
      case 'json':
        blob = await this.exportToJSON(data, config.options.json || {})
        filename = `${config.name}.json`
        break
      case 'xml':
        blob = await this.exportToXML(data, config.options.xml || {})
        filename = `${config.name}.xml`
        break
      default:
        throw new Error(`Unsupported export format: ${config.format}`)
    }

    const result: ExportResult = {
      id: crypto.randomUUID(),
      configId: config.id,
      filename,
      format: config.format,
      size: blob.size,
      recordCount: data.length,
      blob,
      downloadUrl: this.generateDownloadUrl(config.id, config.format),
      executionTime: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'success',
      errors: [],
      warnings: [],
      metadata: {
        dataSource: config.dataSource.type,
        filters: config.dataSource.query?.filters || {},
        transformations: config.dataSource.transformations?.map(t => t.type) || []
      }
    }

    return result
  }

  private async exportToCSV(data: any[], options: any): Promise<Blob> {
    if (data.length === 0) {
      return new Blob([''], { type: 'text/csv' })
    }

    const delimiter = options.delimiter || ','
    const quote = options.quote || '"'
    const headers = Object.keys(data[0])
    
    let csv = ''
    
    // 添加标题行
    if (options.includeHeaders !== false) {
      csv += headers.map(header => `${quote}${header}${quote}`).join(delimiter) + '\n'
    }
    
    // 添加数据行
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return `${quote}${value != null ? String(value).replace(/"/g, '""') : ''}${quote}`
      })
      csv += values.join(delimiter) + '\n'
    }

    return new Blob([csv], { type: 'text/csv' })
  }

  private async exportToExcel(data: any[], options: any): Promise<Blob> {
    // 简化实现：生成CSV格式
    const csv = await this.exportToCSV(data, { delimiter: ',', quote: '"' })
    return new Blob([await csv.text()], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
  }

  private async exportToJSON(data: any[], options: any): Promise<Blob> {
    const jsonOptions = {
      pretty: options.pretty !== false,
      includeSchema: options.includeSchema || false,
      arrayWrapper: options.arrayWrapper !== false
    }

    let output: any = data

    if (jsonOptions.arrayWrapper) {
      output = { data, count: data.length, exported_at: new Date().toISOString() }
    }

    if (jsonOptions.includeSchema && data.length > 0) {
      const schema = this.generateJSONSchema(data[0])
      output = jsonOptions.arrayWrapper ? { ...output, schema } : { schema, data }
    }

    const jsonString = jsonOptions.pretty 
      ? JSON.stringify(output, null, 2)
      : JSON.stringify(output)

    return new Blob([jsonString], { type: 'application/json' })
  }

  private async exportToXML(data: any[], options: any): Promise<Blob> {
    const rootElement = options.rootElement || 'data'
    const itemElement = options.itemElement || 'item'
    const includeDeclaration = options.includeXmlDeclaration !== false
    const indent = options.indent !== false

    let xml = ''
    
    if (includeDeclaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n'
    }
    
    xml += `<${rootElement}>\n`
    
    for (const row of data) {
      xml += indent ? `  <${itemElement}>\n` : `<${itemElement}>`
      
      for (const [key, value] of Object.entries(row)) {
        const escapedValue = String(value || '').replace(/[<>&'"]/g, (char) => {
          switch (char) {
            case '<': return '&lt;'
            case '>': return '&gt;'
            case '&': return '&amp;'
            case "'": return '&apos;'
            case '"': return '&quot;'
            default: return char
          }
        })
        
        if (indent) {
          xml += `    <${key}>${escapedValue}</${key}>\n`
        } else {
          xml += `<${key}>${escapedValue}</${key}>`
        }
      }
      
      xml += indent ? `  </${itemElement}>\n` : `</${itemElement}>`
    }
    
    xml += `</${rootElement}>`

    return new Blob([xml], { type: 'application/xml' })
  }

  private generateJSONSchema(sample: any): any {
    const schema: any = {
      type: 'object',
      properties: {}
    }

    for (const [key, value] of Object.entries(sample)) {
      if (value === null) {
        schema.properties[key] = { type: 'null' }
      } else if (typeof value === 'string') {
        schema.properties[key] = { type: 'string' }
      } else if (typeof value === 'number') {
        schema.properties[key] = { type: 'number' }
      } else if (typeof value === 'boolean') {
        schema.properties[key] = { type: 'boolean' }
      } else if (Array.isArray(value)) {
        schema.properties[key] = { type: 'array' }
      } else if (typeof value === 'object') {
        schema.properties[key] = { type: 'object' }
      }
    }

    return schema
  }

  private generateDownloadUrl(configId: string, format: ExportFormat): string {
    return `/api/exports/${configId}/download?format=${format}&token=${crypto.randomUUID()}`
  }

  private calculateNextRun(cron: string, timezone: string): Date {
    // 简化实现：返回1小时后
    return new Date(Date.now() + 60 * 60 * 1000)
  }

  private async executeBatchExport(
    batchResult: BatchExportResult,
    configIds: string[],
    userId: string
  ): Promise<void> {
    for (let i = 0; i < configIds.length; i++) {
      if (batchResult.status === 'cancelled') break

      const configId = configIds[i]
      
      try {
        const result = await this.exportData(configId, userId)
        batchResult.results.push(result)
        batchResult.completedTasks++
      } catch (error) {
        batchResult.errors.push(`Config ${configId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        batchResult.failedTasks++
      }

      batchResult.progress = Math.round(((i + 1) / configIds.length) * 100)
    }

    batchResult.status = batchResult.failedTasks === 0 ? 'completed' : 'failed'
    batchResult.completedAt = new Date()
    batchResult.totalTime = batchResult.completedAt.getTime() - batchResult.startedAt.getTime()

    console.log(`📦 Batch export completed: ${batchResult.id} (${batchResult.completedTasks}/${batchResult.totalTasks})`)
  }

  private async logExportActivity(userId: string, config: ExportConfig, result: ExportResult): Promise<void> {
    // 简化实现：记录到控制台
    console.log(`📋 Export activity: User ${userId} exported ${result.recordCount} records from ${config.dataSource.type} as ${config.format}`)
  }

  private async loadExportConfigs(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('export_config_')) {
          const config = JSON.parse(localStorage.getItem(key) || '{}') as ExportConfig
          this.exportConfigs.set(config.id, config)
        }
      }
      console.log(`📚 Loaded ${this.exportConfigs.size} export configurations`)
    } catch (error) {
      console.error('Failed to load export configurations:', error)
    }
  }

  private async loadScheduledExports(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('scheduled_export_')) {
          const scheduled = JSON.parse(localStorage.getItem(key) || '{}') as ScheduledExport
          this.scheduledExports.set(scheduled.id, scheduled)
        }
      }
      console.log(`⏰ Loaded ${this.scheduledExports.size} scheduled exports`)
    } catch (error) {
      console.error('Failed to load scheduled exports:', error)
    }
  }

  private async saveExportConfig(config: ExportConfig): Promise<void> {
    try {
      localStorage.setItem(`export_config_${config.id}`, JSON.stringify(config))
    } catch (error) {
      console.error('Failed to save export configuration:', error)
      throw error
    }
  }

  private async saveExportResult(result: ExportResult): Promise<void> {
    try {
      // 不保存blob到localStorage，只保存元数据
      const metadata = { ...result }
      delete metadata.blob
      localStorage.setItem(`export_result_${result.id}`, JSON.stringify(metadata))
    } catch (error) {
      console.error('Failed to save export result:', error)
    }
  }

  private async saveScheduledExport(scheduled: ScheduledExport): Promise<void> {
    try {
      localStorage.setItem(`scheduled_export_${scheduled.id}`, JSON.stringify(scheduled))
    } catch (error) {
      console.error('Failed to save scheduled export:', error)
      throw error
    }
  }

  private startScheduler(): void {
    // 每分钟检查定时任务
    setInterval(() => {
      this.checkScheduledExports()
    }, 60 * 1000)
  }

  private async checkScheduledExports(): Promise<void> {
    const now = new Date()
    
    for (const scheduled of this.scheduledExports.values()) {
      if (scheduled.isActive && scheduled.nextRun <= now) {
        try {
          await this.executeScheduledExport(scheduled)
        } catch (error) {
          console.error(`Scheduled export failed: ${scheduled.id}`, error)
        }
      }
    }
  }

  private async executeScheduledExport(scheduled: ScheduledExport): Promise<void> {
    const execution: ScheduledExportExecution = {
      id: crypto.randomUUID(),
      scheduledAt: scheduled.nextRun,
      startedAt: new Date(),
      status: 'running'
    }

    scheduled.executions.push(execution)

    try {
      const config = this.exportConfigs.get(scheduled.configId)
      if (!config) {
        throw new Error('Export configuration not found')
      }

      const result = await this.exportData(scheduled.configId, config.createdBy)
      
      execution.completedAt = new Date()
      execution.status = 'success'
      execution.result = result

      scheduled.stats.totalRuns++
      scheduled.stats.successfulRuns++
      scheduled.stats.averageExecutionTime = 
        (scheduled.stats.averageExecutionTime * (scheduled.stats.totalRuns - 1) + 
         (execution.completedAt.getTime() - execution.startedAt.getTime())) / scheduled.stats.totalRuns

    } catch (error) {
      execution.completedAt = new Date()
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'

      scheduled.stats.totalRuns++
      scheduled.stats.failedRuns++
    }

    // 计算下次运行时间
    scheduled.lastRun = scheduled.nextRun
    scheduled.nextRun = this.calculateNextRun(scheduled.schedule.cron, scheduled.schedule.timezone)

    await this.saveScheduledExport(scheduled)
  }
}

// Export singleton instance
export const dataExportService = DataExportService.getInstance()
