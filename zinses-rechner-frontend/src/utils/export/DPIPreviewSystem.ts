/**
 * DPI预览系统
 * 实时显示不同DPI设置下的图像效果对比
 */

import { dpiCalculationEngine, type DPICalculationResult } from './DPICalculationEngine'
import { pixelDensityScaler, type ScalingResult } from './PixelDensityScaler'
import { resolutionManager, type ResolutionInfo } from './ResolutionManager'

// 预览配置接口
export interface PreviewConfig {
  dpiList: number[]
  showComparison: boolean
  showZoom: boolean
  zoomLevel: number
  showGrid: boolean
  showRuler: boolean
  backgroundColor: string
  borderColor: string
  maxPreviewSize: { width: number; height: number }
}

// 预览结果接口
export interface PreviewResult {
  dpi: number
  canvas: HTMLCanvasElement
  calculation: DPICalculationResult
  scalingResult: ScalingResult
  previewSize: { width: number; height: number }
  qualityScore: number
  fileSize: number
  renderTime: number
}

// 预览对比结果接口
export interface PreviewComparison {
  previews: PreviewResult[]
  bestQuality: PreviewResult
  smallestFile: PreviewResult
  fastestRender: PreviewResult
  recommended: PreviewResult
  comparisonMetrics: {
    qualityRange: { min: number; max: number }
    fileSizeRange: { min: number; max: number }
    renderTimeRange: { min: number; max: number }
  }
}

// 预览事件接口
export interface PreviewEvents {
  onPreviewGenerated?: (result: PreviewResult) => void
  onComparisonComplete?: (comparison: PreviewComparison) => void
  onError?: (error: Error) => void
  onProgress?: (completed: number, total: number) => void
}

// 默认预览配置
export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  dpiList: [72, 96, 150, 200, 300],
  showComparison: true,
  showZoom: false,
  zoomLevel: 1.0,
  showGrid: false,
  showRuler: false,
  backgroundColor: '#ffffff',
  borderColor: '#cccccc',
  maxPreviewSize: { width: 400, height: 300 }
}

// 预设DPI组合
export const DPI_PREVIEW_PRESETS = {
  WEB_FOCUSED: [72, 96, 144],
  PRINT_FOCUSED: [150, 200, 300, 600],
  MOBILE_FOCUSED: [160, 240, 320, 480],
  COMPREHENSIVE: [72, 96, 150, 200, 300, 400, 600],
  QUALITY_COMPARISON: [96, 200, 300, 450, 600]
} as const

/**
 * DPI预览系统类
 */
export class DPIPreviewSystem {
  private static instance: DPIPreviewSystem
  private previewCache: Map<string, PreviewResult> = new Map()
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10分钟缓存

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): DPIPreviewSystem {
    if (!DPIPreviewSystem.instance) {
      DPIPreviewSystem.instance = new DPIPreviewSystem()
    }
    return DPIPreviewSystem.instance
  }

  /**
   * 生成DPI预览
   */
  public async generatePreview(
    sourceCanvas: HTMLCanvasElement,
    dpi: number,
    config: Partial<PreviewConfig> = {},
    events?: PreviewEvents
  ): Promise<PreviewResult> {
    const startTime = performance.now()
    const fullConfig = { ...DEFAULT_PREVIEW_CONFIG, ...config }
    
    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(sourceCanvas, dpi, fullConfig)
      const cached = this.previewCache.get(cacheKey)
      if (cached && this.isCacheValid(cached)) {
        return cached
      }

      // 计算DPI信息
      const calculation = dpiCalculationEngine.performFullCalculation(
        sourceCanvas.width,
        sourceCanvas.height,
        dpi
      )

      // 计算预览尺寸
      const previewSize = this.calculatePreviewSize(
        sourceCanvas.width,
        sourceCanvas.height,
        fullConfig.maxPreviewSize
      )

      // 生成预览Canvas
      const previewCanvas = await this.createPreviewCanvas(
        sourceCanvas,
        previewSize.width,
        previewSize.height,
        dpi,
        fullConfig
      )

      // 执行缩放
      const scalingResult = await pixelDensityScaler.scaleCanvas(
        sourceCanvas,
        previewSize.width,
        previewSize.height,
        {
          algorithm: 'bilinear' as any,
          edgeMode: 'clamp' as any,
          preserveAspectRatio: true,
          antiAliasing: true,
          sharpening: 0.2,
          noiseReduction: 0.1,
          colorCorrection: true,
          gammaCorrection: 1.0
        }
      )

      // 计算质量分数
      const qualityScore = this.calculateQualityScore(dpi, scalingResult)

      // 估算文件大小
      const fileSize = dpiCalculationEngine.estimateFileSize(
        sourceCanvas.width,
        sourceCanvas.height,
        dpi
      )

      const renderTime = performance.now() - startTime

      const result: PreviewResult = {
        dpi,
        canvas: previewCanvas,
        calculation,
        scalingResult,
        previewSize,
        qualityScore,
        fileSize,
        renderTime
      }

      // 缓存结果
      this.previewCache.set(cacheKey, result)

      // 触发事件
      if (events?.onPreviewGenerated) {
        events.onPreviewGenerated(result)
      }

      return result

    } catch (error) {
      if (events?.onError) {
        events.onError(error as Error)
      }
      throw error
    }
  }

  /**
   * 生成DPI对比预览
   */
  public async generateComparison(
    sourceCanvas: HTMLCanvasElement,
    config: Partial<PreviewConfig> = {},
    events?: PreviewEvents
  ): Promise<PreviewComparison> {
    const fullConfig = { ...DEFAULT_PREVIEW_CONFIG, ...config }
    const previews: PreviewResult[] = []

    try {
      // 生成所有DPI预览
      for (let i = 0; i < fullConfig.dpiList.length; i++) {
        const dpi = fullConfig.dpiList[i]
        const preview = await this.generatePreview(sourceCanvas, dpi, fullConfig, events)
        previews.push(preview)

        // 触发进度事件
        if (events?.onProgress) {
          events.onProgress(i + 1, fullConfig.dpiList.length)
        }
      }

      // 分析对比结果
      const comparison = this.analyzeComparison(previews)

      // 触发完成事件
      if (events?.onComparisonComplete) {
        events.onComparisonComplete(comparison)
      }

      return comparison

    } catch (error) {
      if (events?.onError) {
        events.onError(error as Error)
      }
      throw error
    }
  }

  /**
   * 生成并排预览
   */
  public async generateSideBySidePreview(
    sourceCanvas: HTMLCanvasElement,
    dpiList: number[],
    config: Partial<PreviewConfig> = {}
  ): Promise<HTMLCanvasElement> {
    const fullConfig = { ...DEFAULT_PREVIEW_CONFIG, ...config }
    const previews: PreviewResult[] = []

    // 生成所有预览
    for (const dpi of dpiList) {
      const preview = await this.generatePreview(sourceCanvas, dpi, fullConfig)
      previews.push(preview)
    }

    // 创建并排Canvas
    return this.createSideBySideCanvas(previews, fullConfig)
  }

  /**
   * 生成缩放预览
   */
  public async generateZoomPreview(
    sourceCanvas: HTMLCanvasElement,
    dpi: number,
    zoomLevel: number,
    focusArea?: { x: number; y: number; width: number; height: number }
  ): Promise<HTMLCanvasElement> {
    const preview = await this.generatePreview(sourceCanvas, dpi)
    
    if (focusArea) {
      return this.createFocusAreaPreview(preview.canvas, focusArea, zoomLevel)
    } else {
      return this.createZoomedPreview(preview.canvas, zoomLevel)
    }
  }

  /**
   * 获取预设DPI组合
   */
  public getPresetDPIList(preset: keyof typeof DPI_PREVIEW_PRESETS): number[] {
    return [...DPI_PREVIEW_PRESETS[preset]]
  }

  /**
   * 创建预览Canvas
   */
  private async createPreviewCanvas(
    sourceCanvas: HTMLCanvasElement,
    width: number,
    height: number,
    dpi: number,
    config: PreviewConfig
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    // 设置背景
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, width, height)

    // 绘制源图像
    ctx.drawImage(sourceCanvas, 0, 0, width, height)

    // 添加网格（如果启用）
    if (config.showGrid) {
      this.drawGrid(ctx, width, height, config)
    }

    // 添加标尺（如果启用）
    if (config.showRuler) {
      this.drawRuler(ctx, width, height, dpi, config)
    }

    // 添加边框
    ctx.strokeStyle = config.borderColor
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, width, height)

    return canvas
  }

  /**
   * 绘制网格
   */
  private drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: PreviewConfig
  ): void {
    const gridSize = 20
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5

    // 垂直线
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // 水平线
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  /**
   * 绘制标尺
   */
  private drawRuler(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dpi: number,
    config: PreviewConfig
  ): void {
    const rulerHeight = 20
    const pixelsPerInch = dpi

    // 顶部标尺
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, width, rulerHeight)

    ctx.fillStyle = '#333333'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'

    // 英寸刻度
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
   * 创建并排Canvas
   */
  private createSideBySideCanvas(
    previews: PreviewResult[],
    config: PreviewConfig
  ): HTMLCanvasElement {
    const previewWidth = config.maxPreviewSize.width
    const previewHeight = config.maxPreviewSize.height
    const padding = 10
    const labelHeight = 30

    const totalWidth = previews.length * (previewWidth + padding) - padding
    const totalHeight = previewHeight + labelHeight

    const canvas = document.createElement('canvas')
    canvas.width = totalWidth
    canvas.height = totalHeight
    const ctx = canvas.getContext('2d')!

    // 绘制每个预览
    previews.forEach((preview, index) => {
      const x = index * (previewWidth + padding)
      
      // 绘制预览图像
      ctx.drawImage(preview.canvas, x, 0, previewWidth, previewHeight)
      
      // 绘制标签
      ctx.fillStyle = '#333333'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${preview.dpi} DPI`,
        x + previewWidth / 2,
        previewHeight + 15
      )
      
      // 绘制质量分数
      ctx.font = '10px Arial'
      ctx.fillText(
        `质量: ${(preview.qualityScore * 100).toFixed(0)}%`,
        x + previewWidth / 2,
        previewHeight + 28
      )
    })

    return canvas
  }

  /**
   * 创建焦点区域预览
   */
  private createFocusAreaPreview(
    sourceCanvas: HTMLCanvasElement,
    focusArea: { x: number; y: number; width: number; height: number },
    zoomLevel: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = focusArea.width * zoomLevel
    canvas.height = focusArea.height * zoomLevel
    const ctx = canvas.getContext('2d')!

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      sourceCanvas,
      focusArea.x, focusArea.y, focusArea.width, focusArea.height,
      0, 0, canvas.width, canvas.height
    )

    return canvas
  }

  /**
   * 创建缩放预览
   */
  private createZoomedPreview(
    sourceCanvas: HTMLCanvasElement,
    zoomLevel: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = sourceCanvas.width * zoomLevel
    canvas.height = sourceCanvas.height * zoomLevel
    const ctx = canvas.getContext('2d')!

    ctx.imageSmoothingEnabled = zoomLevel < 1
    ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height)

    return canvas
  }

  /**
   * 计算预览尺寸
   */
  private calculatePreviewSize(
    sourceWidth: number,
    sourceHeight: number,
    maxSize: { width: number; height: number }
  ): { width: number; height: number } {
    const aspectRatio = sourceWidth / sourceHeight
    
    let width = maxSize.width
    let height = width / aspectRatio
    
    if (height > maxSize.height) {
      height = maxSize.height
      width = height * aspectRatio
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height)
    }
  }

  /**
   * 计算质量分数
   */
  private calculateQualityScore(dpi: number, scalingResult: ScalingResult): number {
    let score = 0.5 // 基础分数

    // DPI质量加分
    if (dpi >= 300) score += 0.3
    else if (dpi >= 200) score += 0.2
    else if (dpi >= 150) score += 0.1

    // 缩放质量加分
    score += scalingResult.qualityScore * 0.2

    return Math.min(1, score)
  }

  /**
   * 分析对比结果
   */
  private analyzeComparison(previews: PreviewResult[]): PreviewComparison {
    const bestQuality = previews.reduce((best, current) =>
      current.qualityScore > best.qualityScore ? current : best
    )

    const smallestFile = previews.reduce((smallest, current) =>
      current.fileSize < smallest.fileSize ? current : smallest
    )

    const fastestRender = previews.reduce((fastest, current) =>
      current.renderTime < fastest.renderTime ? current : fastest
    )

    // 推荐算法：平衡质量、文件大小和渲染时间
    const recommended = previews.reduce((best, current) => {
      const currentScore = this.calculateRecommendationScore(current)
      const bestScore = this.calculateRecommendationScore(best)
      return currentScore > bestScore ? current : best
    })

    const qualityRange = {
      min: Math.min(...previews.map(p => p.qualityScore)),
      max: Math.max(...previews.map(p => p.qualityScore))
    }

    const fileSizeRange = {
      min: Math.min(...previews.map(p => p.fileSize)),
      max: Math.max(...previews.map(p => p.fileSize))
    }

    const renderTimeRange = {
      min: Math.min(...previews.map(p => p.renderTime)),
      max: Math.max(...previews.map(p => p.renderTime))
    }

    return {
      previews,
      bestQuality,
      smallestFile,
      fastestRender,
      recommended,
      comparisonMetrics: {
        qualityRange,
        fileSizeRange,
        renderTimeRange
      }
    }
  }

  /**
   * 计算推荐分数
   */
  private calculateRecommendationScore(preview: PreviewResult): number {
    const qualityWeight = 0.5
    const fileSizeWeight = 0.3
    const renderTimeWeight = 0.2

    // 归一化分数（越小越好的指标需要反转）
    const qualityScore = preview.qualityScore
    const fileSizeScore = 1 - Math.min(1, preview.fileSize / (10 * 1024 * 1024)) // 10MB为满分
    const renderTimeScore = 1 - Math.min(1, preview.renderTime / 5000) // 5秒为满分

    return qualityScore * qualityWeight + 
           fileSizeScore * fileSizeWeight + 
           renderTimeScore * renderTimeWeight
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    sourceCanvas: HTMLCanvasElement,
    dpi: number,
    config: PreviewConfig
  ): string {
    const configHash = JSON.stringify({
      dpi,
      maxSize: config.maxPreviewSize,
      backgroundColor: config.backgroundColor,
      showGrid: config.showGrid,
      showRuler: config.showRuler
    })
    
    return `${sourceCanvas.width}x${sourceCanvas.height}_${btoa(configHash)}`
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(result: PreviewResult): boolean {
    // 简单的时间检查，实际应用中可能需要更复杂的验证
    return Date.now() - result.renderTime < this.CACHE_DURATION
  }

  /**
   * 清除预览缓存
   */
  public clearCache(): void {
    this.previewCache.clear()
  }

  /**
   * 获取缓存统计
   */
  public getCacheStats(): { size: number; memoryUsage: number } {
    let memoryUsage = 0
    
    this.previewCache.forEach(result => {
      const canvas = result.canvas
      memoryUsage += canvas.width * canvas.height * 4 // RGBA
    })
    
    return {
      size: this.previewCache.size,
      memoryUsage
    }
  }
}

// 导出单例实例
export const dpiPreviewSystem = DPIPreviewSystem.getInstance()
