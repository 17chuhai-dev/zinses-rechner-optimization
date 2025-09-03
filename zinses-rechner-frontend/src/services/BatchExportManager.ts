/**
 * 批量导出管理器
 * 支持多个图表和数据的批量导出功能，包括进度跟踪、错误处理、并发控制
 */

import { ref, reactive } from 'vue'
import JSZip from 'jszip'
import { saveAs } from '../utils/file-saver-mock'

// 导出项类型
export type ExportItemType = 'chart' | 'data' | 'report' | 'image'

// 导出状态
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

// 导出格式
export type BatchExportFormat = 'png' | 'svg' | 'pdf' | 'csv' | 'xlsx' | 'json'

// 导出项接口
export interface ExportItem {
  id: string
  name: string
  type: ExportItemType
  format: BatchExportFormat
  data: any
  config: ExportConfiguration
  status: ExportStatus
  progress: number
  error?: string
  result?: {
    blob?: Blob
    filename: string
    size: number
    url?: string
  }
  startTime?: Date
  endTime?: Date
  retryCount: number
}

// 导出配置接口
export interface ExportConfiguration {
  width?: number
  height?: number
  quality?: number
  background?: string
  includeMetadata?: boolean
  compression?: boolean
  [key: string]: any
}

// 批量导出配置接口
export interface BatchExportConfig {
  outputFormat: 'zip' | 'folder'
  filenamePattern: string
  maxConcurrent: number
  retryAttempts: number
  retryDelay: number
  includeManifest: boolean
  manifestFormat: 'json' | 'csv'
  onProgress?: (progress: BatchExportProgress) => void
  onItemComplete?: (item: ExportItem) => void
  onError?: (error: string, item?: ExportItem) => void
}

// 批量导出进度接口
export interface BatchExportProgress {
  totalItems: number
  completedItems: number
  failedItems: number
  currentItem?: string
  overallProgress: number
  estimatedTimeRemaining?: number
  throughput: number
}

// 导出统计接口
export interface ExportStatistics {
  totalExports: number
  successfulExports: number
  failedExports: number
  totalSize: number
  averageTime: number
  throughput: number
  errorRate: number
}

/**
 * 批量导出管理器类
 */
export class BatchExportManager {
  private static instance: BatchExportManager

  // 导出队列
  private exportQueue: ExportItem[] = []
  private activeExports = new Map<string, ExportItem>()
  private completedExports: ExportItem[] = []

  // 状态管理
  public readonly progress = reactive<BatchExportProgress>({
    totalItems: 0,
    completedItems: 0,
    failedItems: 0,
    overallProgress: 0,
    throughput: 0
  })

  // 配置
  private config: BatchExportConfig = {
    outputFormat: 'zip',
    filenamePattern: '{name}_{timestamp}',
    maxConcurrent: 3,
    retryAttempts: 2,
    retryDelay: 1000,
    includeManifest: true,
    manifestFormat: 'json'
  }

  // 控制状态
  private isRunning = false
  private isPaused = false
  private isCancelled = false
  private startTime?: Date

  // 统计数据
  private statistics = reactive<ExportStatistics>({
    totalExports: 0,
    successfulExports: 0,
    failedExports: 0,
    totalSize: 0,
    averageTime: 0,
    throughput: 0,
    errorRate: 0
  })

  public static getInstance(): BatchExportManager {
    if (!BatchExportManager.instance) {
      BatchExportManager.instance = new BatchExportManager()
    }
    return BatchExportManager.instance
  }

  /**
   * 添加导出项到队列
   */
  public addExportItem(item: Omit<ExportItem, 'id' | 'status' | 'progress' | 'retryCount'>): string {
    const exportItem: ExportItem = {
      ...item,
      id: this.generateId(),
      status: 'pending',
      progress: 0,
      retryCount: 0
    }

    this.exportQueue.push(exportItem)
    this.updateProgress()

    console.log(`📋 Export item added: ${exportItem.name} (${exportItem.format})`)
    return exportItem.id
  }

  /**
   * 批量添加导出项
   */
  public addMultipleItems(items: Array<Omit<ExportItem, 'id' | 'status' | 'progress' | 'retryCount'>>): string[] {
    const ids: string[] = []
    
    items.forEach(item => {
      const id = this.addExportItem(item)
      ids.push(id)
    })

    console.log(`📋 Added ${items.length} export items to queue`)
    return ids
  }

  /**
   * 移除导出项
   */
  public removeExportItem(id: string): boolean {
    // 从队列中移除
    const queueIndex = this.exportQueue.findIndex(item => item.id === id)
    if (queueIndex > -1) {
      this.exportQueue.splice(queueIndex, 1)
      this.updateProgress()
      return true
    }

    // 如果正在处理，标记为取消
    const activeItem = this.activeExports.get(id)
    if (activeItem) {
      activeItem.status = 'cancelled'
      return true
    }

    return false
  }

  /**
   * 清空导出队列
   */
  public clearQueue(): void {
    this.exportQueue = []
    this.completedExports = []
    this.activeExports.clear()
    this.updateProgress()
    console.log('📋 Export queue cleared')
  }

  /**
   * 开始批量导出
   */
  public async startBatchExport(config?: Partial<BatchExportConfig>): Promise<void> {
    if (this.isRunning) {
      throw new Error('Batch export is already running')
    }

    if (this.exportQueue.length === 0) {
      throw new Error('No items in export queue')
    }

    // 更新配置
    if (config) {
      this.config = { ...this.config, ...config }
    }

    this.isRunning = true
    this.isPaused = false
    this.isCancelled = false
    this.startTime = new Date()

    console.log(`🚀 Starting batch export of ${this.exportQueue.length} items`)

    try {
      await this.processBatchExport()
      
      if (!this.isCancelled) {
        await this.generateOutput()
        console.log('✅ Batch export completed successfully')
      } else {
        console.log('❌ Batch export was cancelled')
      }
    } catch (error) {
      console.error('❌ Batch export failed:', error)
      this.config.onError?.(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      this.isRunning = false
      this.updateStatistics()
    }
  }

  /**
   * 暂停批量导出
   */
  public pauseBatchExport(): void {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true
      console.log('⏸️ Batch export paused')
    }
  }

  /**
   * 恢复批量导出
   */
  public resumeBatchExport(): void {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false
      console.log('▶️ Batch export resumed')
    }
  }

  /**
   * 取消批量导出
   */
  public cancelBatchExport(): void {
    this.isCancelled = true
    this.isPaused = false
    
    // 取消所有活动的导出
    this.activeExports.forEach(item => {
      item.status = 'cancelled'
    })

    console.log('❌ Batch export cancelled')
  }

  /**
   * 获取导出状态
   */
  public getExportStatus(): {
    isRunning: boolean
    isPaused: boolean
    isCancelled: boolean
    progress: BatchExportProgress
    statistics: ExportStatistics
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isCancelled: this.isCancelled,
      progress: { ...this.progress },
      statistics: { ...this.statistics }
    }
  }

  /**
   * 获取所有导出项
   */
  public getAllItems(): {
    pending: ExportItem[]
    active: ExportItem[]
    completed: ExportItem[]
  } {
    return {
      pending: [...this.exportQueue],
      active: Array.from(this.activeExports.values()),
      completed: [...this.completedExports]
    }
  }

  /**
   * 重试失败的导出项
   */
  public async retryFailedItems(): Promise<void> {
    const failedItems = this.completedExports.filter(item => item.status === 'failed')
    
    if (failedItems.length === 0) {
      console.log('📋 No failed items to retry')
      return
    }

    // 重置失败项状态并添加回队列
    failedItems.forEach(item => {
      item.status = 'pending'
      item.progress = 0
      item.error = undefined
      item.retryCount = 0
      this.exportQueue.push(item)
    })

    // 从完成列表中移除
    this.completedExports = this.completedExports.filter(item => item.status !== 'failed')

    console.log(`🔄 Retrying ${failedItems.length} failed items`)
    this.updateProgress()
  }

  /**
   * 设置配置
   */
  public setConfig(config: Partial<BatchExportConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // 私有方法

  /**
   * 处理批量导出
   */
  private async processBatchExport(): Promise<void> {
    const concurrentPromises: Promise<void>[] = []

    while (this.exportQueue.length > 0 && !this.isCancelled) {
      // 等待暂停状态解除
      while (this.isPaused && !this.isCancelled) {
        await this.delay(100)
      }

      if (this.isCancelled) break

      // 控制并发数量
      if (concurrentPromises.length >= this.config.maxConcurrent) {
        await Promise.race(concurrentPromises)
        // 清理已完成的Promise
        for (let i = concurrentPromises.length - 1; i >= 0; i--) {
          const promise = concurrentPromises[i]
          if (await this.isPromiseSettled(promise)) {
            concurrentPromises.splice(i, 1)
          }
        }
      }

      // 处理下一个导出项
      const item = this.exportQueue.shift()
      if (item) {
        const promise = this.processExportItem(item)
        concurrentPromises.push(promise)
      }
    }

    // 等待所有导出完成
    await Promise.allSettled(concurrentPromises)
  }

  /**
   * 处理单个导出项
   */
  private async processExportItem(item: ExportItem): Promise<void> {
    item.status = 'processing'
    item.startTime = new Date()
    this.activeExports.set(item.id, item)

    try {
      // 模拟导出过程
      const result = await this.performExport(item)
      
      item.result = result
      item.status = 'completed'
      item.progress = 100
      item.endTime = new Date()
      
      this.config.onItemComplete?.(item)
      console.log(`✅ Export completed: ${item.name}`)
      
    } catch (error) {
      item.error = error instanceof Error ? error.message : 'Unknown error'
      item.status = 'failed'
      item.endTime = new Date()
      
      // 重试逻辑
      if (item.retryCount < this.config.retryAttempts) {
        item.retryCount++
        item.status = 'pending'
        item.error = undefined
        
        await this.delay(this.config.retryDelay)
        this.exportQueue.unshift(item) // 重新加入队列前端
        
        console.log(`🔄 Retrying export: ${item.name} (attempt ${item.retryCount})`)
      } else {
        console.error(`❌ Export failed: ${item.name}`, error)
        this.config.onError?.(item.error, item)
      }
    } finally {
      this.activeExports.delete(item.id)
      this.completedExports.push(item)
      this.updateProgress()
    }
  }

  /**
   * 执行实际的导出操作
   */
  private async performExport(item: ExportItem): Promise<{
    blob: Blob
    filename: string
    size: number
  }> {
    // 根据类型和格式执行不同的导出逻辑
    let blob: Blob
    let filename: string

    // 更新进度
    const progressInterval = setInterval(() => {
      if (item.progress < 90) {
        item.progress += Math.random() * 10
        this.config.onProgress?.(this.progress)
      }
    }, 100)

    try {
      switch (item.type) {
        case 'chart':
          blob = await this.exportChart(item)
          break
        case 'data':
          blob = await this.exportData(item)
          break
        case 'report':
          blob = await this.exportReport(item)
          break
        case 'image':
          blob = await this.exportImage(item)
          break
        default:
          throw new Error(`Unsupported export type: ${item.type}`)
      }

      filename = this.generateFilename(item)
      
      return {
        blob,
        filename,
        size: blob.size
      }
    } finally {
      clearInterval(progressInterval)
      item.progress = 100
    }
  }

  /**
   * 导出图表
   */
  private async exportChart(item: ExportItem): Promise<Blob> {
    // 模拟图表导出
    await this.delay(1000 + Math.random() * 2000)
    
    switch (item.format) {
      case 'png':
        return new Blob(['fake-png-data'], { type: 'image/png' })
      case 'svg':
        return new Blob(['<svg>fake-svg-data</svg>'], { type: 'image/svg+xml' })
      case 'pdf':
        return new Blob(['fake-pdf-data'], { type: 'application/pdf' })
      default:
        throw new Error(`Unsupported chart format: ${item.format}`)
    }
  }

  /**
   * 导出数据
   */
  private async exportData(item: ExportItem): Promise<Blob> {
    // 模拟数据导出
    await this.delay(500 + Math.random() * 1000)
    
    switch (item.format) {
      case 'csv':
        return new Blob(['fake,csv,data'], { type: 'text/csv' })
      case 'xlsx':
        return new Blob(['fake-xlsx-data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      case 'json':
        return new Blob([JSON.stringify({ fake: 'json-data' })], { type: 'application/json' })
      default:
        throw new Error(`Unsupported data format: ${item.format}`)
    }
  }

  /**
   * 导出报告
   */
  private async exportReport(item: ExportItem): Promise<Blob> {
    // 模拟报告导出
    await this.delay(2000 + Math.random() * 3000)
    
    return new Blob(['fake-report-data'], { type: 'application/pdf' })
  }

  /**
   * 导出图像
   */
  private async exportImage(item: ExportItem): Promise<Blob> {
    // 模拟图像导出
    await this.delay(800 + Math.random() * 1200)
    
    switch (item.format) {
      case 'png':
        return new Blob(['fake-png-data'], { type: 'image/png' })
      case 'svg':
        return new Blob(['<svg>fake-svg-data</svg>'], { type: 'image/svg+xml' })
      default:
        throw new Error(`Unsupported image format: ${item.format}`)
    }
  }

  /**
   * 生成输出文件
   */
  private async generateOutput(): Promise<void> {
    const successfulExports = this.completedExports.filter(item => item.status === 'completed')
    
    if (successfulExports.length === 0) {
      throw new Error('No successful exports to generate output')
    }

    if (this.config.outputFormat === 'zip') {
      await this.generateZipOutput(successfulExports)
    } else {
      await this.generateFolderOutput(successfulExports)
    }
  }

  /**
   * 生成ZIP输出
   */
  private async generateZipOutput(items: ExportItem[]): Promise<void> {
    const zip = new JSZip()
    
    // 添加导出文件
    items.forEach(item => {
      if (item.result?.blob) {
        zip.file(item.result.filename, item.result.blob)
      }
    })

    // 添加清单文件
    if (this.config.includeManifest) {
      const manifest = this.generateManifest(items)
      const manifestFilename = `manifest.${this.config.manifestFormat}`
      
      if (this.config.manifestFormat === 'json') {
        zip.file(manifestFilename, JSON.stringify(manifest, null, 2))
      } else {
        zip.file(manifestFilename, this.convertManifestToCSV(manifest))
      }
    }

    // 生成并下载ZIP文件
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const zipFilename = `batch-export-${timestamp}.zip`
    
    saveAs(zipBlob, zipFilename)
    console.log(`📦 ZIP file generated: ${zipFilename}`)
  }

  /**
   * 生成文件夹输出（浏览器限制，实际上还是分别下载）
   */
  private async generateFolderOutput(items: ExportItem[]): Promise<void> {
    // 在浏览器中，我们只能分别下载文件
    items.forEach(item => {
      if (item.result?.blob) {
        saveAs(item.result.blob, item.result.filename)
      }
    })

    // 下载清单文件
    if (this.config.includeManifest) {
      const manifest = this.generateManifest(items)
      const manifestFilename = `manifest.${this.config.manifestFormat}`
      let manifestBlob: Blob
      
      if (this.config.manifestFormat === 'json') {
        manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
      } else {
        manifestBlob = new Blob([this.convertManifestToCSV(manifest)], { type: 'text/csv' })
      }
      
      saveAs(manifestBlob, manifestFilename)
    }

    console.log(`📁 Files downloaded separately (${items.length} files)`)
  }

  /**
   * 生成清单文件
   */
  private generateManifest(items: ExportItem[]): any {
    return {
      exportInfo: {
        timestamp: new Date().toISOString(),
        totalItems: items.length,
        totalSize: items.reduce((sum, item) => sum + (item.result?.size || 0), 0)
      },
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        format: item.format,
        filename: item.result?.filename,
        size: item.result?.size,
        exportTime: item.endTime?.toISOString(),
        duration: item.startTime && item.endTime 
          ? item.endTime.getTime() - item.startTime.getTime()
          : undefined
      }))
    }
  }

  /**
   * 将清单转换为CSV格式
   */
  private convertManifestToCSV(manifest: any): string {
    const headers = ['ID', 'Name', 'Type', 'Format', 'Filename', 'Size', 'Export Time', 'Duration']
    const rows = manifest.items.map((item: any) => [
      item.id,
      item.name,
      item.type,
      item.format,
      item.filename,
      item.size,
      item.exportTime,
      item.duration
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  /**
   * 生成文件名
   */
  private generateFilename(item: ExportItem): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    
    return this.config.filenamePattern
      .replace('{name}', item.name)
      .replace('{type}', item.type)
      .replace('{format}', item.format)
      .replace('{timestamp}', timestamp)
      .replace('{id}', item.id)
      + `.${item.format}`
  }

  /**
   * 更新进度
   */
  private updateProgress(): void {
    const total = this.exportQueue.length + this.activeExports.size + this.completedExports.length
    const completed = this.completedExports.filter(item => item.status === 'completed').length
    const failed = this.completedExports.filter(item => item.status === 'failed').length
    
    this.progress.totalItems = total
    this.progress.completedItems = completed
    this.progress.failedItems = failed
    this.progress.overallProgress = total > 0 ? (completed / total) * 100 : 0
    
    // 计算吞吐量
    if (this.startTime) {
      const elapsed = (Date.now() - this.startTime.getTime()) / 1000
      this.progress.throughput = elapsed > 0 ? completed / elapsed : 0
      
      // 估算剩余时间
      const remaining = total - completed - failed
      if (remaining > 0 && this.progress.throughput > 0) {
        this.progress.estimatedTimeRemaining = remaining / this.progress.throughput
      }
    }
    
    this.config.onProgress?.(this.progress)
  }

  /**
   * 更新统计数据
   */
  private updateStatistics(): void {
    const completed = this.completedExports.filter(item => item.status === 'completed')
    const failed = this.completedExports.filter(item => item.status === 'failed')
    
    this.statistics.totalExports = this.completedExports.length
    this.statistics.successfulExports = completed.length
    this.statistics.failedExports = failed.length
    this.statistics.totalSize = completed.reduce((sum, item) => sum + (item.result?.size || 0), 0)
    this.statistics.errorRate = this.statistics.totalExports > 0 
      ? this.statistics.failedExports / this.statistics.totalExports 
      : 0
    
    // 计算平均时间
    const durations = completed
      .filter(item => item.startTime && item.endTime)
      .map(item => item.endTime!.getTime() - item.startTime!.getTime())
    
    this.statistics.averageTime = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0
    
    // 计算吞吐量
    if (this.startTime) {
      const elapsed = (Date.now() - this.startTime.getTime()) / 1000
      this.statistics.throughput = elapsed > 0 ? completed.length / elapsed : 0
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 检查Promise是否已完成
   */
  private async isPromiseSettled(promise: Promise<any>): Promise<boolean> {
    try {
      await Promise.race([promise, Promise.resolve()])
      return true
    } catch {
      return true
    }
  }
}

// 导出单例实例
export const batchExportManager = BatchExportManager.getInstance()

// 便捷的组合式API
export function useBatchExport() {
  const manager = BatchExportManager.getInstance()
  
  return {
    // 状态
    progress: manager.progress,
    
    // 方法
    addExportItem: manager.addExportItem.bind(manager),
    addMultipleItems: manager.addMultipleItems.bind(manager),
    removeExportItem: manager.removeExportItem.bind(manager),
    clearQueue: manager.clearQueue.bind(manager),
    startBatchExport: manager.startBatchExport.bind(manager),
    pauseBatchExport: manager.pauseBatchExport.bind(manager),
    resumeBatchExport: manager.resumeBatchExport.bind(manager),
    cancelBatchExport: manager.cancelBatchExport.bind(manager),
    retryFailedItems: manager.retryFailedItems.bind(manager),
    getExportStatus: manager.getExportStatus.bind(manager),
    getAllItems: manager.getAllItems.bind(manager),
    setConfig: manager.setConfig.bind(manager)
  }
}
