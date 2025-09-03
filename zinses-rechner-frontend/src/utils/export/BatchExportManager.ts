/**
 * 批量导出管理器
 * 实现多图表的批量导出功能，支持队列管理、进度跟踪、错误处理等
 */

import { chartExportEngine } from './ChartExportEngine'
import { exportConfigManager } from './ExportConfigManager'
import type { ExportFormat, ExportConfig } from './ExportUtils'
import type { Chart } from 'chart.js'

// 导出任务状态
export enum ExportTaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 导出任务优先级
export enum ExportTaskPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4
}

// 导出任务接口
export interface ExportTask {
  id: string
  name: string
  chart: Chart | HTMLElement
  format: ExportFormat
  config: ExportConfig
  status: ExportTaskStatus
  priority: ExportTaskPriority
  progress: number
  error?: string
  result?: {
    blob: Blob
    filename: string
    size: number
    duration: number
  }
  createdAt: number
  startedAt?: number
  completedAt?: number
  retryCount: number
  maxRetries: number
}

// 批量导出配置接口
export interface BatchExportConfig {
  maxConcurrent: number
  retryAttempts: number
  retryDelay: number
  timeout: number
  autoDownload: boolean
  zipOutput: boolean
  zipFilename?: string
  onProgress?: (progress: BatchExportProgress) => void
  onTaskComplete?: (task: ExportTask) => void
  onTaskError?: (task: ExportTask, error: Error) => void
  onComplete?: (results: BatchExportResult) => void
}

// 批量导出进度接口
export interface BatchExportProgress {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  cancelledTasks: number
  currentTask?: ExportTask
  overallProgress: number
  estimatedTimeRemaining: number
}

// 批量导出结果接口
export interface BatchExportResult {
  totalTasks: number
  successfulTasks: number
  failedTasks: number
  cancelledTasks: number
  results: ExportTask[]
  zipBlob?: Blob
  totalSize: number
  totalDuration: number
}

// 导出队列统计接口
export interface QueueStatistics {
  totalTasks: number
  pendingTasks: number
  processingTasks: number
  completedTasks: number
  failedTasks: number
  cancelledTasks: number
  averageProcessingTime: number
  successRate: number
}

// 默认批量导出配置
export const DEFAULT_BATCH_CONFIG: BatchExportConfig = {
  maxConcurrent: 3,
  retryAttempts: 2,
  retryDelay: 1000,
  timeout: 30000,
  autoDownload: true,
  zipOutput: false
}

/**
 * 批量导出管理器类
 */
export class BatchExportManager {
  private static instance: BatchExportManager
  private tasks: Map<string, ExportTask> = new Map()
  private processingTasks: Set<string> = new Set()
  private config: BatchExportConfig = DEFAULT_BATCH_CONFIG
  private isProcessing = false
  private abortController?: AbortController

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): BatchExportManager {
    if (!BatchExportManager.instance) {
      BatchExportManager.instance = new BatchExportManager()
    }
    return BatchExportManager.instance
  }

  /**
   * 配置批量导出设置
   */
  public configure(config: Partial<BatchExportConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 添加导出任务
   */
  public addTask(
    name: string,
    chart: Chart | HTMLElement,
    format: ExportFormat,
    config: Partial<ExportConfig> = {},
    priority: ExportTaskPriority = ExportTaskPriority.NORMAL
  ): string {
    const taskId = this.generateTaskId()
    const fullConfig = exportConfigManager.mergeConfig(config)

    const task: ExportTask = {
      id: taskId,
      name,
      chart,
      format,
      config: fullConfig,
      status: ExportTaskStatus.PENDING,
      priority,
      progress: 0,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: this.config.retryAttempts
    }

    this.tasks.set(taskId, task)
    return taskId
  }

  /**
   * 批量添加任务
   */
  public addTasks(
    tasks: Array<{
      name: string
      chart: Chart | HTMLElement
      format: ExportFormat
      config?: Partial<ExportConfig>
      priority?: ExportTaskPriority
    }>
  ): string[] {
    return tasks.map(task => 
      this.addTask(
        task.name,
        task.chart,
        task.format,
        task.config,
        task.priority
      )
    )
  }

  /**
   * 移除任务
   */
  public removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false

    if (task.status === ExportTaskStatus.PROCESSING) {
      task.status = ExportTaskStatus.CANCELLED
      this.processingTasks.delete(taskId)
    }

    this.tasks.delete(taskId)
    return true
  }

  /**
   * 清空所有任务
   */
  public clearTasks(): void {
    this.cancelAll()
    this.tasks.clear()
    this.processingTasks.clear()
  }

  /**
   * 开始批量导出
   */
  public async startBatch(): Promise<BatchExportResult> {
    if (this.isProcessing) {
      throw new Error('批量导出已在进行中')
    }

    this.isProcessing = true
    this.abortController = new AbortController()

    try {
      const result = await this.processBatch()
      
      if (this.config.zipOutput && result.successfulTasks > 1) {
        result.zipBlob = await this.createZipArchive(result.results)
      }

      if (this.config.autoDownload) {
        await this.downloadResults(result)
      }

      this.config.onComplete?.(result)
      return result

    } finally {
      this.isProcessing = false
      this.abortController = undefined
    }
  }

  /**
   * 取消批量导出
   */
  public cancelBatch(): void {
    if (!this.isProcessing) return

    this.abortController?.abort()
    
    // 取消所有待处理和正在处理的任务
    for (const [taskId, task] of this.tasks) {
      if (task.status === ExportTaskStatus.PENDING || task.status === ExportTaskStatus.PROCESSING) {
        task.status = ExportTaskStatus.CANCELLED
        this.processingTasks.delete(taskId)
      }
    }

    this.isProcessing = false
  }

  /**
   * 取消所有任务
   */
  public cancelAll(): void {
    for (const [taskId, task] of this.tasks) {
      if (task.status !== ExportTaskStatus.COMPLETED && task.status !== ExportTaskStatus.FAILED) {
        task.status = ExportTaskStatus.CANCELLED
        this.processingTasks.delete(taskId)
      }
    }
  }

  /**
   * 重试失败的任务
   */
  public async retryFailedTasks(): Promise<void> {
    const failedTasks = Array.from(this.tasks.values())
      .filter(task => task.status === ExportTaskStatus.FAILED && task.retryCount < task.maxRetries)

    for (const task of failedTasks) {
      task.status = ExportTaskStatus.PENDING
      task.progress = 0
      task.error = undefined
      task.retryCount++
    }

    if (failedTasks.length > 0 && !this.isProcessing) {
      await this.startBatch()
    }
  }

  /**
   * 获取任务状态
   */
  public getTask(taskId: string): ExportTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 获取所有任务
   */
  public getAllTasks(): ExportTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * 获取队列统计
   */
  public getStatistics(): QueueStatistics {
    const tasks = Array.from(this.tasks.values())
    const totalTasks = tasks.length
    const pendingTasks = tasks.filter(t => t.status === ExportTaskStatus.PENDING).length
    const processingTasks = tasks.filter(t => t.status === ExportTaskStatus.PROCESSING).length
    const completedTasks = tasks.filter(t => t.status === ExportTaskStatus.COMPLETED).length
    const failedTasks = tasks.filter(t => t.status === ExportTaskStatus.FAILED).length
    const cancelledTasks = tasks.filter(t => t.status === ExportTaskStatus.CANCELLED).length

    const completedTasksWithDuration = tasks.filter(t => 
      t.status === ExportTaskStatus.COMPLETED && t.result?.duration
    )
    const averageProcessingTime = completedTasksWithDuration.length > 0
      ? completedTasksWithDuration.reduce((sum, t) => sum + (t.result?.duration || 0), 0) / completedTasksWithDuration.length
      : 0

    const successRate = totalTasks > 0 ? completedTasks / totalTasks : 0

    return {
      totalTasks,
      pendingTasks,
      processingTasks,
      completedTasks,
      failedTasks,
      cancelledTasks,
      averageProcessingTime,
      successRate
    }
  }

  /**
   * 获取当前进度
   */
  public getProgress(): BatchExportProgress {
    const stats = this.getStatistics()
    const currentTask = Array.from(this.tasks.values())
      .find(task => task.status === ExportTaskStatus.PROCESSING)

    const overallProgress = stats.totalTasks > 0 
      ? (stats.completedTasks + stats.failedTasks + stats.cancelledTasks) / stats.totalTasks
      : 0

    const estimatedTimeRemaining = this.calculateEstimatedTime(stats)

    return {
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      failedTasks: stats.failedTasks,
      cancelledTasks: stats.cancelledTasks,
      currentTask,
      overallProgress,
      estimatedTimeRemaining
    }
  }

  /**
   * 处理批量导出
   */
  private async processBatch(): Promise<BatchExportResult> {
    const startTime = Date.now()
    const concurrentLimit = this.config.maxConcurrent
    const processingPromises: Promise<void>[] = []

    // 按优先级排序任务
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === ExportTaskStatus.PENDING)
      .sort((a, b) => b.priority - a.priority)

    // 处理任务队列
    for (const task of pendingTasks) {
      if (this.abortController?.signal.aborted) break

      // 等待有空闲槽位
      while (processingPromises.length >= concurrentLimit) {
        await Promise.race(processingPromises)
        this.cleanupCompletedPromises(processingPromises)
      }

      // 开始处理任务
      const promise = this.processTask(task)
      processingPromises.push(promise)
    }

    // 等待所有任务完成
    await Promise.allSettled(processingPromises)

    // 生成结果
    const tasks = Array.from(this.tasks.values())
    const successfulTasks = tasks.filter(t => t.status === ExportTaskStatus.COMPLETED).length
    const failedTasks = tasks.filter(t => t.status === ExportTaskStatus.FAILED).length
    const cancelledTasks = tasks.filter(t => t.status === ExportTaskStatus.CANCELLED).length
    const totalSize = tasks.reduce((sum, t) => sum + (t.result?.size || 0), 0)
    const totalDuration = Date.now() - startTime

    return {
      totalTasks: tasks.length,
      successfulTasks,
      failedTasks,
      cancelledTasks,
      results: tasks,
      totalSize,
      totalDuration
    }
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: ExportTask): Promise<void> {
    if (this.abortController?.signal.aborted) {
      task.status = ExportTaskStatus.CANCELLED
      return
    }

    try {
      task.status = ExportTaskStatus.PROCESSING
      task.startedAt = Date.now()
      task.progress = 0
      this.processingTasks.add(task.id)

      // 创建任务超时控制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('任务超时')), this.config.timeout)
      })

      // 执行导出
      const exportPromise = this.executeExport(task)
      const result = await Promise.race([exportPromise, timeoutPromise])

      task.result = result
      task.status = ExportTaskStatus.COMPLETED
      task.completedAt = Date.now()
      task.progress = 100

      this.config.onTaskComplete?.(task)

    } catch (error) {
      task.error = error instanceof Error ? error.message : String(error)
      task.status = ExportTaskStatus.FAILED
      task.completedAt = Date.now()

      this.config.onTaskError?.(task, error instanceof Error ? error : new Error(String(error)))

      // 如果还有重试次数，重新加入队列
      if (task.retryCount < task.maxRetries) {
        setTimeout(() => {
          if (task.status === ExportTaskStatus.FAILED) {
            task.status = ExportTaskStatus.PENDING
            task.progress = 0
            task.error = undefined
            task.retryCount++
          }
        }, this.config.retryDelay)
      }

    } finally {
      this.processingTasks.delete(task.id)
      
      // 更新进度
      const progress = this.getProgress()
      this.config.onProgress?.(progress)
    }
  }

  /**
   * 执行导出操作
   */
  private async executeExport(task: ExportTask): Promise<ExportTask['result']> {
    const startTime = Date.now()

    // 根据格式选择导出方法
    let blob: Blob
    let filename: string

    switch (task.format) {
      case 'png':
        blob = await chartExportEngine.exportToPNG(task.chart, task.config)
        filename = `${task.name}.png`
        break
      case 'svg':
        blob = await chartExportEngine.exportToSVG(task.chart, task.config)
        filename = `${task.name}.svg`
        break
      case 'pdf':
        blob = await chartExportEngine.exportToPDF(task.chart, task.config)
        filename = `${task.name}.pdf`
        break
      default:
        throw new Error(`不支持的导出格式: ${task.format}`)
    }

    const duration = Date.now() - startTime

    return {
      blob,
      filename,
      size: blob.size,
      duration
    }
  }

  /**
   * 创建ZIP压缩包
   */
  private async createZipArchive(tasks: ExportTask[]): Promise<Blob> {
    // 这里需要使用ZIP库，如JSZip
    // 简化实现，实际项目中需要引入JSZip
    const successfulTasks = tasks.filter(t => t.status === ExportTaskStatus.COMPLETED && t.result)
    
    // 模拟ZIP创建
    const zipContent = new Uint8Array(0) // 实际实现需要使用JSZip
    return new Blob([zipContent], { type: 'application/zip' })
  }

  /**
   * 下载结果
   */
  private async downloadResults(result: BatchExportResult): Promise<void> {
    if (result.zipBlob) {
      // 下载ZIP文件
      const filename = this.config.zipFilename || `export_${Date.now()}.zip`
      this.downloadBlob(result.zipBlob, filename)
    } else {
      // 逐个下载文件
      const successfulTasks = result.results.filter(t => 
        t.status === ExportTaskStatus.COMPLETED && t.result
      )

      for (const task of successfulTasks) {
        if (task.result) {
          this.downloadBlob(task.result.blob, task.result.filename)
          // 添加延迟避免浏览器阻止多个下载
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }
  }

  /**
   * 下载Blob文件
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 清理已完成的Promise
   */
  private cleanupCompletedPromises(promises: Promise<void>[]): void {
    for (let i = promises.length - 1; i >= 0; i--) {
      const promise = promises[i]
      promise.then(() => {
        const index = promises.indexOf(promise)
        if (index > -1) {
          promises.splice(index, 1)
        }
      }).catch(() => {
        const index = promises.indexOf(promise)
        if (index > -1) {
          promises.splice(index, 1)
        }
      })
    }
  }

  /**
   * 计算预估剩余时间
   */
  private calculateEstimatedTime(stats: QueueStatistics): number {
    if (stats.averageProcessingTime === 0 || stats.pendingTasks === 0) {
      return 0
    }

    const remainingTasks = stats.pendingTasks + stats.processingTasks
    const concurrentFactor = Math.min(this.config.maxConcurrent, remainingTasks)
    
    return (remainingTasks * stats.averageProcessingTime) / concurrentFactor
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 导出任务模板
   */
  public createTaskTemplate(
    name: string,
    format: ExportFormat,
    config: Partial<ExportConfig> = {}
  ): Omit<ExportTask, 'id' | 'chart' | 'status' | 'progress' | 'createdAt' | 'retryCount'> {
    return {
      name,
      format,
      config: exportConfigManager.mergeConfig(config),
      priority: ExportTaskPriority.NORMAL,
      maxRetries: this.config.retryAttempts
    }
  }

  /**
   * 从模板批量创建任务
   */
  public addTasksFromTemplate(
    charts: Array<{ name: string; chart: Chart | HTMLElement }>,
    template: Omit<ExportTask, 'id' | 'chart' | 'status' | 'progress' | 'createdAt' | 'retryCount'>
  ): string[] {
    return charts.map(({ name, chart }) => 
      this.addTask(
        name,
        chart,
        template.format,
        template.config,
        template.priority
      )
    )
  }

  /**
   * 暂停批量导出
   */
  public pauseBatch(): void {
    // 实现暂停逻辑
    // 将正在处理的任务标记为暂停状态
  }

  /**
   * 恢复批量导出
   */
  public resumeBatch(): void {
    // 实现恢复逻辑
    // 恢复暂停的任务
  }

  /**
   * 获取任务详细信息
   */
  public getTaskDetails(taskId: string): ExportTask | null {
    return this.tasks.get(taskId) || null
  }

  /**
   * 更新任务优先级
   */
  public updateTaskPriority(taskId: string, priority: ExportTaskPriority): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== ExportTaskStatus.PENDING) {
      return false
    }

    task.priority = priority
    return true
  }

  /**
   * 获取任务日志
   */
  public getTaskLog(taskId: string): string[] {
    // 实现任务日志功能
    return []
  }
}

// 导出单例实例
export const batchExportManager = BatchExportManager.getInstance()
