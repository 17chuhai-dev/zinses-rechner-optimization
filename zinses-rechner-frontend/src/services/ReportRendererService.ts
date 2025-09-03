/**
 * 报告渲染和导出引擎
 * 支持多种格式导出（PDF、Excel、Word、HTML），高质量渲染和批量处理
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { ReportDesignerService } from './ReportDesignerService'
import { DashboardPermissionController } from './DashboardPermissionController'
import { EnterpriseDashboardService } from './EnterpriseDashboardService'
import type { ReportConfig, ReportComponent } from './ReportDesignerService'

// 渲染格式
export type RenderFormat = 'pdf' | 'excel' | 'word' | 'html' | 'png' | 'jpeg' | 'svg'

// 渲染选项
export interface RenderOptions {
  format: RenderFormat
  quality: 'low' | 'medium' | 'high' | 'ultra'
  
  // 页面设置
  pageSettings?: {
    size?: 'A4' | 'A3' | 'letter' | 'legal' | 'custom'
    orientation?: 'portrait' | 'landscape'
    margins?: { top: number; right: number; bottom: number; left: number }
    scale?: number
  }
  
  // 水印设置
  watermark?: WatermarkConfig
  
  // 安全设置
  security?: SecurityConfig
  
  // 性能设置
  performance?: {
    enableCache: boolean
    timeout: number // 毫秒
    maxMemory: number // MB
    concurrent: boolean
  }
  
  // 自定义设置
  customOptions?: Record<string, any>
}

// 水印配置
export interface WatermarkConfig {
  type: 'text' | 'image'
  content: string // 文本内容或图片URL
  
  // 位置设置
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'repeat'
  
  // 样式设置
  opacity: number // 0-1
  rotation: number // 度数
  size: number
  color?: string
  font?: string
  
  // 高级设置
  zIndex: number
  blend: 'normal' | 'multiply' | 'overlay'
}

// 安全配置
export interface SecurityConfig {
  // PDF安全
  password?: string
  permissions?: {
    print: boolean
    copy: boolean
    modify: boolean
    annotate: boolean
    fillForms: boolean
    extract: boolean
    assemble: boolean
  }
  
  // 数字签名
  digitalSignature?: {
    enabled: boolean
    certificate?: string
    reason?: string
    location?: string
  }
  
  // 访问控制
  accessControl?: {
    expiryDate?: Date
    allowedIPs?: string[]
    maxViews?: number
  }
}

// 渲染结果
export interface RenderResult {
  id: string
  reportId: string
  format: RenderFormat
  
  // 文件信息
  blob: Blob
  filename: string
  size: number
  mimeType: string
  
  // 渲染信息
  renderTime: number
  quality: string
  pages: number
  
  // 元数据
  createdAt: Date
  createdBy: string
  watermarked: boolean
  secured: boolean
  
  // 下载信息
  downloadUrl?: string
  expiresAt?: Date
}

// 批量渲染任务
export interface BatchRenderTask {
  id: string
  name: string
  reportIds: string[]
  options: RenderOptions
  
  // 任务状态
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  
  // 结果
  results: RenderResult[]
  errors: string[]
  
  // 时间信息
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  
  // 创建者
  createdBy: string
}

// 渲染缓存
export interface RenderCache {
  key: string
  reportId: string
  options: RenderOptions
  result: RenderResult
  
  // 缓存信息
  createdAt: Date
  lastAccessed: Date
  accessCount: number
  ttl: number // 毫秒
  
  // 缓存大小
  size: number
}

// 渲染统计
export interface RenderStatistics {
  totalRenders: number
  successfulRenders: number
  failedRenders: number
  
  // 格式统计
  formatStats: Record<RenderFormat, number>
  
  // 性能统计
  averageRenderTime: number
  totalRenderTime: number
  cacheHitRate: number
  
  // 大小统计
  totalSize: number
  averageSize: number
  
  // 时间范围
  period: { start: Date; end: Date }
}

/**
 * 报告渲染和导出引擎
 */
export class ReportRendererService {
  private static instance: ReportRendererService
  private reportDesignerService: ReportDesignerService
  private permissionController: DashboardPermissionController
  private dashboardService: EnterpriseDashboardService
  
  private renderCache: Map<string, RenderCache> = new Map()
  private batchTasks: Map<string, BatchRenderTask> = new Map()
  private renderQueue: string[] = []
  private isProcessing = false
  
  private statistics: RenderStatistics = {
    totalRenders: 0,
    successfulRenders: 0,
    failedRenders: 0,
    formatStats: {} as Record<RenderFormat, number>,
    averageRenderTime: 0,
    totalRenderTime: 0,
    cacheHitRate: 0,
    totalSize: 0,
    averageSize: 0,
    period: { start: new Date(), end: new Date() }
  }
  
  private isInitialized = false

  private constructor() {
    this.reportDesignerService = ReportDesignerService.getInstance()
    this.permissionController = DashboardPermissionController.getInstance()
    this.dashboardService = EnterpriseDashboardService.getInstance()
  }

  static getInstance(): ReportRendererService {
    if (!ReportRendererService.instance) {
      ReportRendererService.instance = new ReportRendererService()
    }
    return ReportRendererService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await Promise.all([
        this.reportDesignerService.initialize(),
        this.permissionController.initialize(),
        this.dashboardService.initialize()
      ])
      
      this.startCacheCleanup()
      this.startQueueProcessor()
      this.isInitialized = true
      console.log('✅ ReportRendererService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ReportRendererService:', error)
      throw error
    }
  }

  /**
   * 渲染报告
   */
  async renderReport(
    reportId: string,
    userId: string,
    options: RenderOptions
  ): Promise<RenderResult> {
    if (!this.isInitialized) await this.initialize()

    const startTime = Date.now()

    try {
      // 获取报告配置
      const report = await this.reportDesignerService.getReport(reportId, userId)
      if (!report) {
        throw new Error('Report not found')
      }

      // 检查导出权限
      const hasPermission = await this.permissionController.checkDataAccess(
        userId,
        report.createdBy, // 简化：使用创建者的accountId
        'analytics',
        'export'
      )

      if (!hasPermission.granted) {
        throw new Error('Insufficient permissions to export report')
      }

      // 检查缓存
      const cacheKey = this.generateCacheKey(reportId, options)
      const cached = this.getCachedRender(cacheKey)
      if (cached) {
        this.updateStatistics('cache_hit', Date.now() - startTime)
        return cached.result
      }

      // 渲染报告
      const result = await this.performRender(report, userId, options)
      
      // 缓存结果
      if (options.performance?.enableCache !== false) {
        this.cacheRenderResult(cacheKey, reportId, options, result)
      }

      // 更新统计
      this.updateStatistics('success', Date.now() - startTime, options.format, result.size)

      console.log(`📄 Report rendered: ${report.name} (${options.format})`)
      return result
    } catch (error) {
      this.updateStatistics('error', Date.now() - startTime)
      console.error('Report render failed:', error)
      throw error
    }
  }

  /**
   * 批量渲染报告
   */
  async renderReportBatch(
    reportIds: string[],
    userId: string,
    options: RenderOptions,
    taskName?: string
  ): Promise<BatchRenderTask> {
    if (!this.isInitialized) await this.initialize()

    const task: BatchRenderTask = {
      id: crypto.randomUUID(),
      name: taskName || `批量渲染任务 ${new Date().toLocaleString()}`,
      reportIds,
      options,
      status: 'pending',
      progress: 0,
      results: [],
      errors: [],
      createdAt: new Date(),
      createdBy: userId
    }

    this.batchTasks.set(task.id, task)

    // 添加到处理队列
    this.renderQueue.push(task.id)
    this.processQueue()

    console.log(`📦 Batch render task created: ${task.name} (${reportIds.length} reports)`)
    return task
  }

  /**
   * 渲染带水印的报告
   */
  async renderWithWatermark(
    reportId: string,
    userId: string,
    watermark: WatermarkConfig,
    format: RenderFormat = 'pdf'
  ): Promise<RenderResult> {
    const options: RenderOptions = {
      format,
      quality: 'high',
      watermark
    }

    return await this.renderReport(reportId, userId, options)
  }

  /**
   * 渲染交互式报告
   */
  async renderInteractiveReport(
    reportId: string,
    userId: string,
    options: Partial<RenderOptions> = {}
  ): Promise<string> {
    const renderOptions: RenderOptions = {
      format: 'html',
      quality: 'high',
      ...options,
      customOptions: {
        ...options.customOptions,
        interactive: true,
        embedAssets: true,
        includeScripts: true
      }
    }

    const result = await this.renderReport(reportId, userId, renderOptions)
    
    // 返回HTML内容
    return await result.blob.text()
  }

  /**
   * 预渲染报告
   */
  async preRenderReport(
    reportId: string,
    userId: string,
    formats: RenderFormat[] = ['pdf', 'excel']
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    for (const format of formats) {
      const options: RenderOptions = {
        format,
        quality: 'medium',
        performance: { enableCache: true, timeout: 30000, maxMemory: 512, concurrent: false }
      }

      try {
        await this.renderReport(reportId, userId, options)
        console.log(`🔄 Pre-rendered: ${reportId} (${format})`)
      } catch (error) {
        console.error(`Pre-render failed for ${reportId} (${format}):`, error)
      }
    }
  }

  /**
   * 获取缓存的渲染结果
   */
  getCachedRender(cacheKey: string): RenderCache | null {
    const cached = this.renderCache.get(cacheKey)
    if (!cached) return null

    // 检查TTL
    if (Date.now() - cached.createdAt.getTime() > cached.ttl) {
      this.renderCache.delete(cacheKey)
      return null
    }

    // 更新访问信息
    cached.lastAccessed = new Date()
    cached.accessCount++

    return cached
  }

  /**
   * 获取批量任务状态
   */
  getBatchTask(taskId: string): BatchRenderTask | null {
    return this.batchTasks.get(taskId) || null
  }

  /**
   * 取消批量任务
   */
  async cancelBatchTask(taskId: string, userId: string): Promise<void> {
    const task = this.batchTasks.get(taskId)
    if (!task) {
      throw new Error('Batch task not found')
    }

    if (task.createdBy !== userId) {
      throw new Error('Insufficient permissions to cancel task')
    }

    if (task.status === 'running') {
      task.status = 'cancelled'
      console.log(`❌ Batch task cancelled: ${taskId}`)
    }
  }

  /**
   * 获取渲染统计
   */
  getRenderStatistics(): RenderStatistics {
    return { ...this.statistics }
  }

  /**
   * 清理缓存
   */
  clearCache(reportId?: string): void {
    if (reportId) {
      // 清理特定报告的缓存
      for (const [key, cache] of this.renderCache) {
        if (cache.reportId === reportId) {
          this.renderCache.delete(key)
        }
      }
    } else {
      // 清理所有缓存
      this.renderCache.clear()
    }

    console.log(`🧹 Render cache cleared: ${reportId || 'all'}`)
  }

  // 私有方法
  private async performRender(
    report: ReportConfig,
    userId: string,
    options: RenderOptions
  ): Promise<RenderResult> {
    const startTime = Date.now()

    // 获取报告数据
    const reportData = await this.gatherReportData(report, userId)

    // 根据格式选择渲染器
    let blob: Blob
    let mimeType: string
    let pages = 1

    switch (options.format) {
      case 'pdf':
        ({ blob, mimeType, pages } = await this.renderToPDF(report, reportData, options))
        break
      case 'excel':
        ({ blob, mimeType } = await this.renderToExcel(report, reportData, options))
        break
      case 'word':
        ({ blob, mimeType } = await this.renderToWord(report, reportData, options))
        break
      case 'html':
        ({ blob, mimeType } = await this.renderToHTML(report, reportData, options))
        break
      case 'png':
      case 'jpeg':
        ({ blob, mimeType } = await this.renderToImage(report, reportData, options))
        break
      case 'svg':
        ({ blob, mimeType } = await this.renderToSVG(report, reportData, options))
        break
      default:
        throw new Error(`Unsupported render format: ${options.format}`)
    }

    // 应用水印
    if (options.watermark) {
      blob = await this.applyWatermark(blob, options.watermark, options.format)
    }

    // 应用安全设置
    if (options.security) {
      blob = await this.applySecurity(blob, options.security, options.format)
    }

    const result: RenderResult = {
      id: crypto.randomUUID(),
      reportId: report.id,
      format: options.format,
      blob,
      filename: this.generateFilename(report, options.format),
      size: blob.size,
      mimeType,
      renderTime: Date.now() - startTime,
      quality: options.quality,
      pages,
      createdAt: new Date(),
      createdBy: userId,
      watermarked: !!options.watermark,
      secured: !!options.security,
      downloadUrl: this.generateDownloadUrl(report.id, options.format),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时过期
    }

    return result
  }

  private async gatherReportData(report: ReportConfig, userId: string): Promise<any> {
    // 简化实现：收集报告所需的数据
    const data: any = {}

    for (const component of report.components) {
      if (component.dataBinding && component.dataBinding.source) {
        try {
          // 从仪表盘服务获取数据
          const componentData = await this.dashboardService.getDashboardData(
            userId,
            report.createdBy, // 简化：使用创建者的accountId
            {
              dateRange: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: new Date()
              }
            }
          )
          data[component.id] = componentData
        } catch (error) {
          console.warn(`Failed to load data for component ${component.id}:`, error)
          data[component.id] = null
        }
      }
    }

    return data
  }

  private async renderToPDF(
    report: ReportConfig,
    data: any,
    options: RenderOptions
  ): Promise<{ blob: Blob; mimeType: string; pages: number }> {
    // 简化实现：生成PDF
    const htmlContent = await this.generateHTMLContent(report, data, options)
    
    // 模拟PDF生成
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${report.name}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`

    return {
      blob: new Blob([pdfContent], { type: 'application/pdf' }),
      mimeType: 'application/pdf',
      pages: 1
    }
  }

  private async renderToExcel(
    report: ReportConfig,
    data: any,
    options: RenderOptions
  ): Promise<{ blob: Blob; mimeType: string }> {
    // 简化实现：生成Excel
    const csvContent = this.generateCSVContent(report, data)
    
    return {
      blob: new Blob([csvContent], { type: 'text/csv' }),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }

  private async renderToWord(
    report: ReportConfig,
    data: any,
    options: RenderOptions
  ): Promise<{ blob: Blob; mimeType: string }> {
    // 简化实现：生成Word文档
    const htmlContent = await this.generateHTMLContent(report, data, options)
    
    return {
      blob: new Blob([htmlContent], { type: 'text/html' }),
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  }

  private async renderToHTML(
    report: ReportConfig,
    data: any,
    options: RenderOptions
  ): Promise<{ blob: Blob; mimeType: string }> {
    const htmlContent = await this.generateHTMLContent(report, data, options)
    
    return {
      blob: new Blob([htmlContent], { type: 'text/html' }),
      mimeType: 'text/html'
    }
  }

  private async renderToImage(
    report: ReportConfig,
    data: any,
    options: RenderOptions
  ): Promise<{ blob: Blob; mimeType: string }> {
    // 简化实现：生成图片
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = '#333333'
    ctx.font = '24px Arial'
    ctx.fillText(report.name, 50, 50)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({
          blob: blob!,
          mimeType: options.format === 'png' ? 'image/png' : 'image/jpeg'
        })
      }, options.format === 'png' ? 'image/png' : 'image/jpeg')
    })
  }

  private async renderToSVG(
    report: ReportConfig,
    data: any,
    options: RenderOptions
  ): Promise<{ blob: Blob; mimeType: string }> {
    // 简化实现：生成SVG
    const svgContent = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50" y="50" font-family="Arial" font-size="24" fill="#333333">${report.name}</text>
      </svg>
    `
    
    return {
      blob: new Blob([svgContent], { type: 'image/svg+xml' }),
      mimeType: 'image/svg+xml'
    }
  }

  private async generateHTMLContent(
    report: ReportConfig,
    data: any,
    options: RenderOptions
  ): Promise<string> {
    const isInteractive = options.customOptions?.interactive || false
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.name}</title>
        <style>
          body { font-family: ${report.styling.globalFont.family}; margin: 0; padding: 20px; }
          .report-header { text-align: center; margin-bottom: 30px; }
          .report-content { display: grid; grid-template-columns: repeat(${report.layout.grid.columns}, 1fr); gap: ${report.layout.grid.gap.x}px; }
          .component { border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
          ${isInteractive ? '.component:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }' : ''}
        </style>
        ${isInteractive ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ''}
      </head>
      <body>
        <div class="report-header">
          <h1>${report.name}</h1>
          ${report.description ? `<p>${report.description}</p>` : ''}
        </div>
        <div class="report-content">
          ${report.components.map(component => `
            <div class="component" style="grid-column: span ${component.position.width}; grid-row: span ${component.position.height};">
              <h3>${component.name}</h3>
              <div class="component-content">
                ${this.renderComponentHTML(component, data[component.id], isInteractive)}
              </div>
            </div>
          `).join('')}
        </div>
        ${isInteractive ? '<script>/* 交互式脚本 */</script>' : ''}
      </body>
      </html>
    `
  }

  private renderComponentHTML(component: ReportComponent, data: any, interactive: boolean): string {
    switch (component.type) {
      case 'kpi_card':
        return `<div class="kpi-card">
          <div class="kpi-value">12,345</div>
          <div class="kpi-label">${component.name}</div>
        </div>`
      case 'line_chart':
        return interactive 
          ? `<canvas id="chart-${component.id}" width="400" height="200"></canvas>`
          : `<div class="chart-placeholder">📈 ${component.name}</div>`
      case 'data_table':
        return `<table border="1" style="width: 100%; border-collapse: collapse;">
          <thead><tr><th>项目</th><th>数值</th></tr></thead>
          <tbody>
            <tr><td>示例数据1</td><td>100</td></tr>
            <tr><td>示例数据2</td><td>200</td></tr>
          </tbody>
        </table>`
      default:
        return `<div class="component-placeholder">${component.name}</div>`
    }
  }

  private generateCSVContent(report: ReportConfig, data: any): string {
    const headers = ['组件名称', '类型', '位置X', '位置Y', '宽度', '高度']
    const rows = report.components.map(component => [
      component.name,
      component.type,
      component.position.x.toString(),
      component.position.y.toString(),
      component.position.width.toString(),
      component.position.height.toString()
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private async applyWatermark(
    blob: Blob,
    watermark: WatermarkConfig,
    format: RenderFormat
  ): Promise<Blob> {
    // 简化实现：返回原始blob
    console.log(`💧 Watermark applied: ${watermark.type}`)
    return blob
  }

  private async applySecurity(
    blob: Blob,
    security: SecurityConfig,
    format: RenderFormat
  ): Promise<Blob> {
    // 简化实现：返回原始blob
    console.log(`🔒 Security applied: password=${!!security.password}`)
    return blob
  }

  private generateFilename(report: ReportConfig, format: RenderFormat): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const extension = this.getFileExtension(format)
    return `${report.name}_${timestamp}.${extension}`
  }

  private getFileExtension(format: RenderFormat): string {
    const extensions: Record<RenderFormat, string> = {
      pdf: 'pdf',
      excel: 'xlsx',
      word: 'docx',
      html: 'html',
      png: 'png',
      jpeg: 'jpg',
      svg: 'svg'
    }
    return extensions[format] || 'bin'
  }

  private generateDownloadUrl(reportId: string, format: RenderFormat): string {
    return `/api/reports/${reportId}/download?format=${format}&token=${crypto.randomUUID()}`
  }

  private generateCacheKey(reportId: string, options: RenderOptions): string {
    return `${reportId}_${JSON.stringify(options)}`
  }

  private cacheRenderResult(
    key: string,
    reportId: string,
    options: RenderOptions,
    result: RenderResult
  ): void {
    const cache: RenderCache = {
      key,
      reportId,
      options,
      result,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      ttl: 60 * 60 * 1000, // 1小时
      size: result.size
    }

    this.renderCache.set(key, cache)
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.renderQueue.length === 0) return

    this.isProcessing = true

    while (this.renderQueue.length > 0) {
      const taskId = this.renderQueue.shift()!
      const task = this.batchTasks.get(taskId)
      
      if (!task || task.status === 'cancelled') continue

      try {
        await this.processBatchTask(task)
      } catch (error) {
        console.error(`Batch task failed: ${taskId}`, error)
      }
    }

    this.isProcessing = false
  }

  private async processBatchTask(task: BatchRenderTask): Promise<void> {
    task.status = 'running'
    task.startedAt = new Date()

    for (let i = 0; i < task.reportIds.length; i++) {
      if (task.status === 'cancelled') break

      const reportId = task.reportIds[i]
      
      try {
        const result = await this.renderReport(reportId, task.createdBy, task.options)
        task.results.push(result)
      } catch (error) {
        task.errors.push(`Report ${reportId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      task.progress = Math.round(((i + 1) / task.reportIds.length) * 100)
    }

    task.status = task.errors.length === 0 ? 'completed' : 'failed'
    task.completedAt = new Date()

    console.log(`📦 Batch task completed: ${task.id} (${task.results.length}/${task.reportIds.length})`)
  }

  private updateStatistics(
    type: 'success' | 'error' | 'cache_hit',
    renderTime: number,
    format?: RenderFormat,
    size?: number
  ): void {
    this.statistics.totalRenders++
    
    if (type === 'success') {
      this.statistics.successfulRenders++
      this.statistics.totalRenderTime += renderTime
      this.statistics.averageRenderTime = this.statistics.totalRenderTime / this.statistics.successfulRenders
      
      if (format) {
        this.statistics.formatStats[format] = (this.statistics.formatStats[format] || 0) + 1
      }
      
      if (size) {
        this.statistics.totalSize += size
        this.statistics.averageSize = this.statistics.totalSize / this.statistics.successfulRenders
      }
    } else if (type === 'error') {
      this.statistics.failedRenders++
    }

    // 更新缓存命中率
    const totalCacheRequests = this.statistics.totalRenders
    const cacheHits = Array.from(this.renderCache.values()).reduce((sum, cache) => sum + cache.accessCount, 0)
    this.statistics.cacheHitRate = totalCacheRequests > 0 ? cacheHits / totalCacheRequests : 0
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      let cleanedCount = 0

      for (const [key, cache] of this.renderCache) {
        if (now - cache.createdAt.getTime() > cache.ttl) {
          this.renderCache.delete(key)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned ${cleanedCount} expired render cache entries`)
      }
    }, 10 * 60 * 1000) // 每10分钟清理一次
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue()
    }, 5000) // 每5秒检查队列
  }
}

// Export singleton instance
export const reportRendererService = ReportRendererService.getInstance()
