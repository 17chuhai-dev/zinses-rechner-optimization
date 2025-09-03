/**
 * 导出预览系统
 * 提供实时预览功能，支持不同格式、尺寸、质量设置的预览效果
 */

import { chartExportEngine } from './ChartExportEngine'
import { exportQualityOptimizer } from './ExportQualityOptimizer'
import { dpiCalculationEngine } from './DPICalculationEngine'
import { resolutionManager } from './ResolutionManager'
import type { ExportFormat, ExportConfig } from './ExportUtils'
import type { Chart } from 'chart.js'

// 预览模式枚举
export enum PreviewMode {
  THUMBNAIL = 'thumbnail',      // 缩略图预览
  ACTUAL_SIZE = 'actual-size',  // 实际尺寸预览
  FIT_TO_SCREEN = 'fit-to-screen', // 适应屏幕预览
  ZOOM = 'zoom'                 // 缩放预览
}

// 预览质量级别
export enum PreviewQuality {
  LOW = 'low',                  // 低质量（快速预览）
  MEDIUM = 'medium',            // 中等质量
  HIGH = 'high'                 // 高质量（接近最终效果）
}

// 预览配置接口
export interface PreviewConfig {
  mode: PreviewMode
  quality: PreviewQuality
  format: ExportFormat
  exportConfig: ExportConfig
  showGrid: boolean
  showRuler: boolean
  showDimensions: boolean
  backgroundColor: string
  zoomLevel: number
  maxPreviewSize: { width: number; height: number }
  enableRealTimeUpdate: boolean
  updateDelay: number           // ms
}

// 预览结果接口
export interface PreviewResult {
  canvas: HTMLCanvasElement
  previewCanvas: HTMLCanvasElement
  originalSize: { width: number; height: number }
  previewSize: { width: number; height: number }
  actualSize: { width: number; height: number }
  scale: number
  format: ExportFormat
  estimatedFileSize: number
  renderTime: number
  quality: {
    dpi: number
    resolution: string
    colorDepth: number
    compression: string
  }
}

// 预览对比结果接口
export interface PreviewComparison {
  previews: Map<string, PreviewResult>
  bestQuality: PreviewResult
  smallestSize: PreviewResult
  recommended: PreviewResult
  comparisonMetrics: {
    fileSizeRange: { min: number; max: number }
    qualityRange: { min: number; max: number }
    renderTimeRange: { min: number; max: number }
  }
}

// 预览事件接口
export interface PreviewEvents {
  onPreviewGenerated?: (result: PreviewResult) => void
  onPreviewError?: (error: Error) => void
  onPreviewUpdate?: (result: PreviewResult) => void
  onZoomChange?: (zoomLevel: number) => void
  onModeChange?: (mode: PreviewMode) => void
}

// 默认预览配置
export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  mode: PreviewMode.FIT_TO_SCREEN,
  quality: PreviewQuality.MEDIUM,
  format: 'png',
  exportConfig: {
    width: 800,
    height: 600,
    dpi: 96,
    quality: 0.8,
    backgroundColor: '#ffffff'
  },
  showGrid: false,
  showRuler: false,
  showDimensions: true,
  backgroundColor: '#f5f5f5',
  zoomLevel: 1.0,
  maxPreviewSize: { width: 800, height: 600 },
  enableRealTimeUpdate: true,
  updateDelay: 300
}

// 预览质量预设
export const PREVIEW_QUALITY_PRESETS: Record<PreviewQuality, Partial<PreviewConfig>> = {
  [PreviewQuality.LOW]: {
    quality: PreviewQuality.LOW,
    exportConfig: {
      dpi: 72,
      quality: 0.6
    },
    enableRealTimeUpdate: true,
    updateDelay: 100
  },
  [PreviewQuality.MEDIUM]: {
    quality: PreviewQuality.MEDIUM,
    exportConfig: {
      dpi: 96,
      quality: 0.8
    },
    enableRealTimeUpdate: true,
    updateDelay: 300
  },
  [PreviewQuality.HIGH]: {
    quality: PreviewQuality.HIGH,
    exportConfig: {
      dpi: 150,
      quality: 0.9
    },
    enableRealTimeUpdate: false,
    updateDelay: 500
  }
}

/**
 * 导出预览系统类
 */
export class ExportPreviewSystem {
  private static instance: ExportPreviewSystem
  private previewCache: Map<string, PreviewResult> = new Map()
  private updateTimers: Map<string, NodeJS.Timeout> = new Map()
  private readonly CACHE_SIZE_LIMIT = 50

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ExportPreviewSystem {
    if (!ExportPreviewSystem.instance) {
      ExportPreviewSystem.instance = new ExportPreviewSystem()
    }
    return ExportPreviewSystem.instance
  }

  /**
   * 生成预览
   */
  public async generatePreview(
    chart: Chart | HTMLElement,
    config: Partial<PreviewConfig> = {},
    events?: PreviewEvents
  ): Promise<PreviewResult> {
    const startTime = performance.now()
    const fullConfig = this.mergeConfig(config)

    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(chart, fullConfig)
      const cached = this.previewCache.get(cacheKey)
      if (cached && this.isCacheValid(cached, fullConfig)) {
        events?.onPreviewGenerated?.(cached)
        return cached
      }

      // 获取源Canvas
      const sourceCanvas = await this.getSourceCanvas(chart)
      
      // 应用导出配置生成Canvas
      const exportCanvas = await this.generateExportCanvas(sourceCanvas, fullConfig)
      
      // 创建预览Canvas
      const previewCanvas = await this.createPreviewCanvas(exportCanvas, fullConfig)
      
      // 计算尺寸信息
      const sizes = this.calculateSizes(sourceCanvas, exportCanvas, previewCanvas, fullConfig)
      
      // 估算文件大小
      const estimatedFileSize = await this.estimateFileSize(exportCanvas, fullConfig)
      
      // 创建预览结果
      const result: PreviewResult = {
        canvas: exportCanvas,
        previewCanvas,
        originalSize: { width: sourceCanvas.width, height: sourceCanvas.height },
        previewSize: { width: previewCanvas.width, height: previewCanvas.height },
        actualSize: sizes.actualSize,
        scale: sizes.scale,
        format: fullConfig.format,
        estimatedFileSize,
        renderTime: performance.now() - startTime,
        quality: {
          dpi: fullConfig.exportConfig.dpi || 96,
          resolution: `${exportCanvas.width}x${exportCanvas.height}`,
          colorDepth: 24, // 简化实现
          compression: this.getCompressionInfo(fullConfig)
        }
      }

      // 缓存结果
      this.addToCache(cacheKey, result)
      
      events?.onPreviewGenerated?.(result)
      return result

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      events?.onPreviewError?.(err)
      throw err
    }
  }

  /**
   * 实时预览更新
   */
  public setupRealTimePreview(
    chart: Chart | HTMLElement,
    container: HTMLElement,
    config: Partial<PreviewConfig> = {},
    events?: PreviewEvents
  ): () => void {
    const fullConfig = this.mergeConfig(config)
    const previewId = this.generatePreviewId()
    
    let lastConfig = { ...fullConfig }

    const updatePreview = async () => {
      try {
        const result = await this.generatePreview(chart, fullConfig, events)
        this.renderPreviewToContainer(result, container, fullConfig)
        events?.onPreviewUpdate?.(result)
      } catch (error) {
        events?.onPreviewError?.(error instanceof Error ? error : new Error(String(error)))
      }
    }

    const scheduleUpdate = () => {
      const existingTimer = this.updateTimers.get(previewId)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(updatePreview, fullConfig.updateDelay)
      this.updateTimers.set(previewId, timer)
    }

    // 初始预览
    updatePreview()

    // 配置变化监听
    const configWatcher = () => {
      if (this.hasConfigChanged(lastConfig, fullConfig)) {
        lastConfig = { ...fullConfig }
        if (fullConfig.enableRealTimeUpdate) {
          scheduleUpdate()
        }
      }
    }

    // 返回清理函数
    return () => {
      const timer = this.updateTimers.get(previewId)
      if (timer) {
        clearTimeout(timer)
        this.updateTimers.delete(previewId)
      }
    }
  }

  /**
   * 生成格式对比预览
   */
  public async generateFormatComparison(
    chart: Chart | HTMLElement,
    formats: ExportFormat[],
    baseConfig: Partial<PreviewConfig> = {}
  ): Promise<PreviewComparison> {
    const previews = new Map<string, PreviewResult>()
    const fullConfig = this.mergeConfig(baseConfig)

    // 为每种格式生成预览
    for (const format of formats) {
      const formatConfig = { ...fullConfig, format }
      const result = await this.generatePreview(chart, formatConfig)
      previews.set(format, result)
    }

    // 分析对比结果
    const results = Array.from(previews.values())
    const bestQuality = results.reduce((best, current) => 
      current.quality.dpi > best.quality.dpi ? current : best
    )
    const smallestSize = results.reduce((smallest, current) => 
      current.estimatedFileSize < smallest.estimatedFileSize ? current : smallest
    )
    
    // 推荐算法：平衡质量和文件大小
    const recommended = results.reduce((best, current) => {
      const bestScore = this.calculateFormatScore(best)
      const currentScore = this.calculateFormatScore(current)
      return currentScore > bestScore ? current : best
    })

    // 计算对比指标
    const fileSizes = results.map(r => r.estimatedFileSize)
    const qualities = results.map(r => r.quality.dpi)
    const renderTimes = results.map(r => r.renderTime)

    return {
      previews,
      bestQuality,
      smallestSize,
      recommended,
      comparisonMetrics: {
        fileSizeRange: { min: Math.min(...fileSizes), max: Math.max(...fileSizes) },
        qualityRange: { min: Math.min(...qualities), max: Math.max(...qualities) },
        renderTimeRange: { min: Math.min(...renderTimes), max: Math.max(...renderTimes) }
      }
    }
  }

  /**
   * 生成尺寸对比预览
   */
  public async generateSizeComparison(
    chart: Chart | HTMLElement,
    sizes: Array<{ width: number; height: number; name: string }>,
    baseConfig: Partial<PreviewConfig> = {}
  ): Promise<Map<string, PreviewResult>> {
    const results = new Map<string, PreviewResult>()
    const fullConfig = this.mergeConfig(baseConfig)

    for (const size of sizes) {
      const sizeConfig = {
        ...fullConfig,
        exportConfig: {
          ...fullConfig.exportConfig,
          width: size.width,
          height: size.height
        }
      }
      
      const result = await this.generatePreview(chart, sizeConfig)
      results.set(size.name, result)
    }

    return results
  }

  /**
   * 缩放预览
   */
  public async zoomPreview(
    result: PreviewResult,
    zoomLevel: number,
    focusPoint?: { x: number; y: number }
  ): Promise<HTMLCanvasElement> {
    const sourceCanvas = result.canvas
    const zoomedCanvas = document.createElement('canvas')
    
    // 计算缩放后的尺寸
    const zoomedWidth = Math.round(sourceCanvas.width * zoomLevel)
    const zoomedHeight = Math.round(sourceCanvas.height * zoomLevel)
    
    zoomedCanvas.width = zoomedWidth
    zoomedCanvas.height = zoomedHeight
    
    const ctx = zoomedCanvas.getContext('2d')!
    
    // 设置高质量缩放
    ctx.imageSmoothingEnabled = zoomLevel > 1
    ctx.imageSmoothingQuality = 'high'
    
    if (focusPoint) {
      // 以焦点为中心缩放
      const offsetX = focusPoint.x * (1 - zoomLevel)
      const offsetY = focusPoint.y * (1 - zoomLevel)
      ctx.drawImage(sourceCanvas, offsetX, offsetY, zoomedWidth, zoomedHeight)
    } else {
      // 居中缩放
      ctx.drawImage(sourceCanvas, 0, 0, zoomedWidth, zoomedHeight)
    }
    
    return zoomedCanvas
  }

  /**
   * 添加预览装饰
   */
  public addPreviewDecorations(
    canvas: HTMLCanvasElement,
    config: PreviewConfig
  ): HTMLCanvasElement {
    const decoratedCanvas = document.createElement('canvas')
    decoratedCanvas.width = canvas.width + 40 // 边距
    decoratedCanvas.height = canvas.height + 40
    
    const ctx = decoratedCanvas.getContext('2d')!
    
    // 背景
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, decoratedCanvas.width, decoratedCanvas.height)
    
    // 绘制原图
    ctx.drawImage(canvas, 20, 20)
    
    // 添加网格
    if (config.showGrid) {
      this.drawGrid(ctx, decoratedCanvas.width, decoratedCanvas.height)
    }
    
    // 添加标尺
    if (config.showRuler) {
      this.drawRuler(ctx, canvas.width, canvas.height, config.exportConfig.dpi || 96)
    }
    
    // 添加尺寸标注
    if (config.showDimensions) {
      this.drawDimensions(ctx, canvas.width, canvas.height)
    }
    
    return decoratedCanvas
  }

  /**
   * 获取源Canvas
   */
  private async getSourceCanvas(chart: Chart | HTMLElement): Promise<HTMLCanvasElement> {
    if (chart instanceof HTMLCanvasElement) {
      return chart
    }
    
    if (chart instanceof HTMLElement) {
      // 将HTML元素转换为Canvas
      return await this.htmlToCanvas(chart)
    }
    
    // Chart.js图表
    return (chart as Chart).canvas
  }

  /**
   * 生成导出Canvas
   */
  private async generateExportCanvas(
    sourceCanvas: HTMLCanvasElement,
    config: PreviewConfig
  ): Promise<HTMLCanvasElement> {
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = config.exportConfig.width || sourceCanvas.width
    exportCanvas.height = config.exportConfig.height || sourceCanvas.height
    
    const ctx = exportCanvas.getContext('2d')!
    
    // 设置背景
    if (config.exportConfig.backgroundColor) {
      ctx.fillStyle = config.exportConfig.backgroundColor
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
    }
    
    // 绘制源图像
    ctx.drawImage(sourceCanvas, 0, 0, exportCanvas.width, exportCanvas.height)
    
    // 根据质量级别应用优化
    if (config.quality === PreviewQuality.HIGH) {
      const optimized = await exportQualityOptimizer.optimizeExport(exportCanvas, {
        qualityLevel: 'high',
        performanceMode: 'quality'
      })
      return optimized.optimizedCanvas
    }
    
    return exportCanvas
  }

  /**
   * 创建预览Canvas
   */
  private async createPreviewCanvas(
    exportCanvas: HTMLCanvasElement,
    config: PreviewConfig
  ): Promise<HTMLCanvasElement> {
    const previewCanvas = document.createElement('canvas')
    
    // 根据预览模式计算尺寸
    const previewSize = this.calculatePreviewSize(exportCanvas, config)
    previewCanvas.width = previewSize.width
    previewCanvas.height = previewSize.height
    
    const ctx = previewCanvas.getContext('2d')!
    
    // 设置渲染质量
    ctx.imageSmoothingEnabled = config.quality !== PreviewQuality.LOW
    ctx.imageSmoothingQuality = config.quality === PreviewQuality.HIGH ? 'high' : 'medium'
    
    // 绘制预览
    ctx.drawImage(exportCanvas, 0, 0, previewSize.width, previewSize.height)
    
    return previewCanvas
  }

  /**
   * 计算预览尺寸
   */
  private calculatePreviewSize(
    canvas: HTMLCanvasElement,
    config: PreviewConfig
  ): { width: number; height: number } {
    const { width: canvasWidth, height: canvasHeight } = canvas
    const { width: maxWidth, height: maxHeight } = config.maxPreviewSize
    
    switch (config.mode) {
      case PreviewMode.THUMBNAIL:
        return this.calculateThumbnailSize(canvasWidth, canvasHeight, 200, 150)
      
      case PreviewMode.ACTUAL_SIZE:
        return { width: canvasWidth, height: canvasHeight }
      
      case PreviewMode.FIT_TO_SCREEN:
        return this.calculateFitToScreenSize(canvasWidth, canvasHeight, maxWidth, maxHeight)
      
      case PreviewMode.ZOOM:
        return {
          width: Math.round(canvasWidth * config.zoomLevel),
          height: Math.round(canvasHeight * config.zoomLevel)
        }
      
      default:
        return { width: canvasWidth, height: canvasHeight }
    }
  }

  /**
   * 计算缩略图尺寸
   */
  private calculateThumbnailSize(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = width / height
    
    if (aspectRatio > maxWidth / maxHeight) {
      return {
        width: maxWidth,
        height: Math.round(maxWidth / aspectRatio)
      }
    } else {
      return {
        width: Math.round(maxHeight * aspectRatio),
        height: maxHeight
      }
    }
  }

  /**
   * 计算适应屏幕尺寸
   */
  private calculateFitToScreenSize(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const scaleX = maxWidth / width
    const scaleY = maxHeight / height
    const scale = Math.min(scaleX, scaleY, 1) // 不放大
    
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale)
    }
  }

  /**
   * 计算尺寸信息
   */
  private calculateSizes(
    sourceCanvas: HTMLCanvasElement,
    exportCanvas: HTMLCanvasElement,
    previewCanvas: HTMLCanvasElement,
    config: PreviewConfig
  ): { actualSize: { width: number; height: number }; scale: number } {
    const dpi = config.exportConfig.dpi || 96
    const physicalSize = dpiCalculationEngine.calculatePhysicalSize(
      exportCanvas.width,
      exportCanvas.height,
      dpi,
      'inches'
    )
    
    return {
      actualSize: {
        width: Math.round(physicalSize.width * 100) / 100,
        height: Math.round(physicalSize.height * 100) / 100
      },
      scale: previewCanvas.width / exportCanvas.width
    }
  }

  /**
   * 估算文件大小
   */
  private async estimateFileSize(
    canvas: HTMLCanvasElement,
    config: PreviewConfig
  ): Promise<number> {
    // 简化的文件大小估算
    const pixelCount = canvas.width * canvas.height
    const quality = config.exportConfig.quality || 0.8
    
    switch (config.format) {
      case 'png':
        return Math.round(pixelCount * 3 * quality) // RGB
      case 'jpg':
      case 'jpeg':
        return Math.round(pixelCount * 0.5 * quality) // 压缩比更高
      case 'svg':
        return Math.round(pixelCount * 0.1) // 矢量格式
      case 'pdf':
        return Math.round(pixelCount * 0.8 * quality)
      default:
        return Math.round(pixelCount * 2)
    }
  }

  /**
   * 获取压缩信息
   */
  private getCompressionInfo(config: PreviewConfig): string {
    const quality = config.exportConfig.quality || 0.8
    
    if (quality >= 0.9) return '无损'
    if (quality >= 0.8) return '高质量'
    if (quality >= 0.6) return '标准'
    return '高压缩'
  }

  /**
   * 计算格式评分
   */
  private calculateFormatScore(result: PreviewResult): number {
    const qualityWeight = 0.4
    const sizeWeight = 0.4
    const speedWeight = 0.2
    
    const qualityScore = result.quality.dpi / 300 // 归一化到0-1
    const sizeScore = 1 - (result.estimatedFileSize / (1024 * 1024)) // 1MB为基准
    const speedScore = 1 - (result.renderTime / 5000) // 5秒为基准
    
    return qualityScore * qualityWeight + 
           Math.max(0, sizeScore) * sizeWeight + 
           Math.max(0, speedScore) * speedWeight
  }

  /**
   * 渲染预览到容器
   */
  private renderPreviewToContainer(
    result: PreviewResult,
    container: HTMLElement,
    config: PreviewConfig
  ): void {
    // 清空容器
    container.innerHTML = ''
    
    // 添加预览Canvas
    const decoratedCanvas = this.addPreviewDecorations(result.previewCanvas, config)
    container.appendChild(decoratedCanvas)
    
    // 添加信息面板
    const infoPanel = this.createInfoPanel(result)
    container.appendChild(infoPanel)
  }

  /**
   * 创建信息面板
   */
  private createInfoPanel(result: PreviewResult): HTMLElement {
    const panel = document.createElement('div')
    panel.className = 'preview-info-panel'
    panel.innerHTML = `
      <div class="info-item">
        <label>格式:</label>
        <span>${result.format.toUpperCase()}</span>
      </div>
      <div class="info-item">
        <label>分辨率:</label>
        <span>${result.quality.resolution}</span>
      </div>
      <div class="info-item">
        <label>DPI:</label>
        <span>${result.quality.dpi}</span>
      </div>
      <div class="info-item">
        <label>文件大小:</label>
        <span>${this.formatFileSize(result.estimatedFileSize)}</span>
      </div>
      <div class="info-item">
        <label>渲染时间:</label>
        <span>${Math.round(result.renderTime)}ms</span>
      </div>
    `
    return panel
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * 绘制网格
   */
  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gridSize = 20
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  /**
   * 绘制标尺
   */
  private drawRuler(ctx: CanvasRenderingContext2D, width: number, height: number, dpi: number): void {
    const rulerHeight = 20
    const pixelsPerInch = dpi
    
    // 顶部标尺
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, width, rulerHeight)
    
    ctx.strokeStyle = '#666'
    ctx.fillStyle = '#333'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    
    for (let inch = 0; inch * pixelsPerInch < width; inch++) {
      const x = inch * pixelsPerInch
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, rulerHeight)
      ctx.stroke()
      
      if (inch > 0) {
        ctx.fillText(`${inch}"`, x, rulerHeight - 5)
      }
    }
  }

  /**
   * 绘制尺寸标注
   */
  private drawDimensions(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(5, 5, 120, 40)
    
    ctx.fillStyle = '#fff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`宽度: ${width}px`, 10, 20)
    ctx.fillText(`高度: ${height}px`, 10, 35)
  }

  /**
   * HTML转Canvas
   */
  private async htmlToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    // 简化实现，实际项目中可能需要使用html2canvas等库
    const canvas = document.createElement('canvas')
    canvas.width = element.offsetWidth
    canvas.height = element.offsetHeight
    
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    return canvas
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(chart: Chart | HTMLElement, config: PreviewConfig): string {
    const configHash = JSON.stringify({
      mode: config.mode,
      quality: config.quality,
      format: config.format,
      width: config.exportConfig.width,
      height: config.exportConfig.height,
      dpi: config.exportConfig.dpi
    })
    
    return btoa(configHash)
  }

  /**
   * 检查缓存有效性
   */
  private isCacheValid(cached: PreviewResult, config: PreviewConfig): boolean {
    // 简化的缓存有效性检查
    return cached.format === config.format && 
           cached.quality.dpi === (config.exportConfig.dpi || 96)
  }

  /**
   * 添加到缓存
   */
  private addToCache(key: string, result: PreviewResult): void {
    if (this.previewCache.size >= this.CACHE_SIZE_LIMIT) {
      const firstKey = this.previewCache.keys().next().value
      this.previewCache.delete(firstKey)
    }
    
    this.previewCache.set(key, result)
  }

  /**
   * 检查配置是否变化
   */
  private hasConfigChanged(oldConfig: PreviewConfig, newConfig: PreviewConfig): boolean {
    return JSON.stringify(oldConfig) !== JSON.stringify(newConfig)
  }

  /**
   * 生成预览ID
   */
  private generatePreviewId(): string {
    return `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 合并配置
   */
  private mergeConfig(config: Partial<PreviewConfig>): PreviewConfig {
    const qualityPreset = config.quality ? PREVIEW_QUALITY_PRESETS[config.quality] : {}
    return {
      ...DEFAULT_PREVIEW_CONFIG,
      ...qualityPreset,
      ...config,
      exportConfig: {
        ...DEFAULT_PREVIEW_CONFIG.exportConfig,
        ...qualityPreset.exportConfig,
        ...config.exportConfig
      }
    }
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    // 清理定时器
    for (const timer of this.updateTimers.values()) {
      clearTimeout(timer)
    }
    this.updateTimers.clear()
    
    // 清理缓存
    this.previewCache.clear()
  }
}

// 导出单例实例
export const exportPreviewSystem = ExportPreviewSystem.getInstance()
