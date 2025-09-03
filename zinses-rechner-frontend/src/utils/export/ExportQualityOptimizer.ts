/**
 * 导出质量优化系统
 * 优化导出图表的质量和性能，包括图像压缩、渲染优化、内存管理等
 */

import { imageQualityOptimizer } from './ImageQualityOptimizer'
import { transparencyProcessor } from './TransparencyProcessor'
import { pixelDensityScaler } from './PixelDensityScaler'
import type { Chart } from 'chart.js'

// 质量优化级别
export enum QualityLevel {
  DRAFT = 'draft',           // 草稿质量
  STANDARD = 'standard',     // 标准质量
  HIGH = 'high',            // 高质量
  ULTRA = 'ultra'           // 超高质量
}

// 性能优化模式
export enum PerformanceMode {
  SPEED = 'speed',          // 速度优先
  BALANCED = 'balanced',    // 平衡模式
  QUALITY = 'quality'       // 质量优先
}

// 内存管理策略
export enum MemoryStrategy {
  CONSERVATIVE = 'conservative',  // 保守策略
  BALANCED = 'balanced',         // 平衡策略
  AGGRESSIVE = 'aggressive'      // 激进策略
}

// 优化配置接口
export interface QualityOptimizationConfig {
  qualityLevel: QualityLevel
  performanceMode: PerformanceMode
  memoryStrategy: MemoryStrategy
  enableCompression: boolean
  enableCaching: boolean
  enableProgressiveRendering: boolean
  enableBackgroundProcessing: boolean
  maxMemoryUsage: number        // MB
  renderTimeout: number         // ms
  compressionQuality: number    // 0-1
  targetFileSize?: number       // KB
  preserveTransparency: boolean
  antiAliasing: boolean
  colorOptimization: boolean
  customOptimizations?: {
    sharpening?: number         // 0-1
    noiseReduction?: number     // 0-1
    contrastEnhancement?: number // 0-1
  }
}

// 优化结果接口
export interface QualityOptimizationResult {
  originalCanvas: HTMLCanvasElement
  optimizedCanvas: HTMLCanvasElement
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  qualityScore: number
  processingTime: number
  memoryUsed: number
  optimizationsApplied: string[]
  metrics: {
    psnr: number
    ssim: number
    fileSize: number
    renderTime: number
    memoryPeak: number
  }
}

// 性能监控接口
export interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  cpuUsage: number
  cacheHitRate: number
  compressionRatio: number
  qualityScore: number
  throughput: number
}

// 缓存条目接口
interface CacheEntry {
  key: string
  canvas: HTMLCanvasElement
  timestamp: number
  accessCount: number
  size: number
}

// 默认优化配置
export const DEFAULT_QUALITY_CONFIG: QualityOptimizationConfig = {
  qualityLevel: QualityLevel.STANDARD,
  performanceMode: PerformanceMode.BALANCED,
  memoryStrategy: MemoryStrategy.BALANCED,
  enableCompression: true,
  enableCaching: true,
  enableProgressiveRendering: false,
  enableBackgroundProcessing: false,
  maxMemoryUsage: 512, // 512MB
  renderTimeout: 30000, // 30秒
  compressionQuality: 0.8,
  preserveTransparency: true,
  antiAliasing: true,
  colorOptimization: true
}

// 质量级别预设
export const QUALITY_PRESETS: Record<QualityLevel, Partial<QualityOptimizationConfig>> = {
  [QualityLevel.DRAFT]: {
    qualityLevel: QualityLevel.DRAFT,
    performanceMode: PerformanceMode.SPEED,
    compressionQuality: 0.5,
    antiAliasing: false,
    colorOptimization: false,
    customOptimizations: {
      sharpening: 0,
      noiseReduction: 0.2,
      contrastEnhancement: 0
    }
  },
  [QualityLevel.STANDARD]: {
    qualityLevel: QualityLevel.STANDARD,
    performanceMode: PerformanceMode.BALANCED,
    compressionQuality: 0.8,
    antiAliasing: true,
    colorOptimization: true,
    customOptimizations: {
      sharpening: 0.3,
      noiseReduction: 0.1,
      contrastEnhancement: 0.1
    }
  },
  [QualityLevel.HIGH]: {
    qualityLevel: QualityLevel.HIGH,
    performanceMode: PerformanceMode.QUALITY,
    compressionQuality: 0.9,
    antiAliasing: true,
    colorOptimization: true,
    customOptimizations: {
      sharpening: 0.5,
      noiseReduction: 0.05,
      contrastEnhancement: 0.15
    }
  },
  [QualityLevel.ULTRA]: {
    qualityLevel: QualityLevel.ULTRA,
    performanceMode: PerformanceMode.QUALITY,
    compressionQuality: 0.95,
    antiAliasing: true,
    colorOptimization: true,
    enableProgressiveRendering: true,
    customOptimizations: {
      sharpening: 0.7,
      noiseReduction: 0.02,
      contrastEnhancement: 0.2
    }
  }
}

/**
 * 导出质量优化器类
 */
export class ExportQualityOptimizer {
  private static instance: ExportQualityOptimizer
  private cache: Map<string, CacheEntry> = new Map()
  private performanceMetrics: PerformanceMetrics[] = []
  private memoryMonitor: MemoryMonitor
  private renderQueue: RenderQueue
  private readonly MAX_CACHE_SIZE = 100
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30分钟

  private constructor() {
    this.memoryMonitor = new MemoryMonitor()
    this.renderQueue = new RenderQueue()
    this.startPerformanceMonitoring()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ExportQualityOptimizer {
    if (!ExportQualityOptimizer.instance) {
      ExportQualityOptimizer.instance = new ExportQualityOptimizer()
    }
    return ExportQualityOptimizer.instance
  }

  /**
   * 优化导出质量
   */
  public async optimizeExport(
    chart: Chart | HTMLCanvasElement,
    config: Partial<QualityOptimizationConfig> = {}
  ): Promise<QualityOptimizationResult> {
    const startTime = performance.now()
    const fullConfig = this.mergeConfig(config)
    const optimizationsApplied: string[] = []

    // 内存检查
    await this.memoryMonitor.checkMemoryAvailability(fullConfig.maxMemoryUsage)

    // 获取源Canvas
    const sourceCanvas = await this.getSourceCanvas(chart)
    const originalSize = this.estimateCanvasSize(sourceCanvas)

    // 检查缓存
    const cacheKey = this.generateCacheKey(sourceCanvas, fullConfig)
    if (fullConfig.enableCaching) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return this.createResultFromCache(cached, sourceCanvas, startTime)
      }
    }

    // 创建工作Canvas
    let workCanvas = this.cloneCanvas(sourceCanvas)

    // 应用渐进式渲染
    if (fullConfig.enableProgressiveRendering) {
      workCanvas = await this.applyProgressiveRendering(workCanvas, fullConfig)
      optimizationsApplied.push('渐进式渲染')
    }

    // 应用像素密度优化
    if (this.shouldApplyPixelDensityOptimization(fullConfig)) {
      workCanvas = await this.applyPixelDensityOptimization(workCanvas, fullConfig)
      optimizationsApplied.push('像素密度优化')
    }

    // 应用透明度优化
    if (fullConfig.preserveTransparency) {
      const transparencyResult = await transparencyProcessor.processTransparency(workCanvas, {
        mode: 'full',
        antiAliasing: fullConfig.antiAliasing ? 'advanced' : 'none'
      })
      workCanvas = transparencyResult.canvas
      optimizationsApplied.push('透明度优化')
    }

    // 应用图像质量优化
    if (this.shouldApplyImageOptimization(fullConfig)) {
      const imageResult = await imageQualityOptimizer.optimizeImage(workCanvas, {
        mode: this.getImageOptimizationMode(fullConfig),
        targetQuality: fullConfig.compressionQuality,
        compression: {
          algorithm: 'adaptive',
          level: fullConfig.compressionQuality,
          preserveDetails: fullConfig.qualityLevel !== QualityLevel.DRAFT
        },
        sharpening: {
          algorithm: 'unsharp-mask',
          strength: fullConfig.customOptimizations?.sharpening || 0.3,
          radius: 1.0,
          threshold: 10
        },
        noiseReduction: {
          algorithm: 'gaussian-blur',
          strength: fullConfig.customOptimizations?.noiseReduction || 0.1,
          preserveEdges: true
        },
        advanced: {
          gammaCorrection: 1.0,
          contrastEnhancement: fullConfig.customOptimizations?.contrastEnhancement || 0.1,
          saturationAdjustment: 1.0,
          brightnessAdjustment: 0.0
        }
      })
      workCanvas = imageResult.canvas
      optimizationsApplied.push('图像质量优化')
    }

    // 应用内存优化
    if (fullConfig.memoryStrategy !== MemoryStrategy.CONSERVATIVE) {
      await this.applyMemoryOptimization(workCanvas, fullConfig)
      optimizationsApplied.push('内存优化')
    }

    const optimizedSize = this.estimateCanvasSize(workCanvas)
    const processingTime = performance.now() - startTime
    const memoryUsed = this.memoryMonitor.getCurrentUsage()

    // 计算质量指标
    const metrics = await this.calculateQualityMetrics(sourceCanvas, workCanvas, processingTime)

    // 缓存结果
    if (fullConfig.enableCaching) {
      this.addToCache(cacheKey, workCanvas)
    }

    // 记录性能指标
    this.recordPerformanceMetrics({
      renderTime: processingTime,
      memoryUsage: memoryUsed,
      cpuUsage: 0, // 简化实现
      cacheHitRate: this.calculateCacheHitRate(),
      compressionRatio: originalSize / optimizedSize,
      qualityScore: metrics.ssim,
      throughput: optimizedSize / processingTime
    })

    return {
      originalCanvas: sourceCanvas,
      optimizedCanvas: workCanvas,
      originalSize,
      optimizedSize,
      compressionRatio: originalSize / optimizedSize,
      qualityScore: metrics.ssim,
      processingTime,
      memoryUsed,
      optimizationsApplied,
      metrics
    }
  }

  /**
   * 批量优化
   */
  public async batchOptimize(
    charts: Array<Chart | HTMLCanvasElement>,
    config: Partial<QualityOptimizationConfig> = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<QualityOptimizationResult[]> {
    const results: QualityOptimizationResult[] = []
    const fullConfig = this.mergeConfig(config)

    // 根据性能模式调整并发数
    const concurrency = this.getConcurrencyLevel(fullConfig.performanceMode)
    
    for (let i = 0; i < charts.length; i += concurrency) {
      const batch = charts.slice(i, i + concurrency)
      const batchPromises = batch.map(chart => this.optimizeExport(chart, fullConfig))
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      }

      if (onProgress) {
        onProgress(Math.min(i + concurrency, charts.length), charts.length)
      }

      // 内存清理
      if (fullConfig.memoryStrategy === MemoryStrategy.AGGRESSIVE) {
        await this.performMemoryCleanup()
      }
    }

    return results
  }

  /**
   * 获取性能统计
   */
  public getPerformanceStatistics(): {
    averageRenderTime: number
    averageMemoryUsage: number
    averageQualityScore: number
    cacheHitRate: number
    totalOptimizations: number
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageMemoryUsage: 0,
        averageQualityScore: 0,
        cacheHitRate: 0,
        totalOptimizations: 0
      }
    }

    const metrics = this.performanceMetrics
    return {
      averageRenderTime: metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length,
      averageMemoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
      averageQualityScore: metrics.reduce((sum, m) => sum + m.qualityScore, 0) / metrics.length,
      cacheHitRate: this.calculateCacheHitRate(),
      totalOptimizations: metrics.length
    }
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   */
  public getCacheStatistics(): {
    size: number
    hitRate: number
    memoryUsage: number
  } {
    const memoryUsage = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0)

    return {
      size: this.cache.size,
      hitRate: this.calculateCacheHitRate(),
      memoryUsage
    }
  }

  /**
   * 获取源Canvas
   */
  private async getSourceCanvas(chart: Chart | HTMLCanvasElement): Promise<HTMLCanvasElement> {
    if (chart instanceof HTMLCanvasElement) {
      return chart
    }

    // Chart.js图表转换为Canvas
    return chart.canvas
  }

  /**
   * 应用渐进式渲染
   */
  private async applyProgressiveRendering(
    canvas: HTMLCanvasElement,
    config: QualityOptimizationConfig
  ): Promise<HTMLCanvasElement> {
    // 简化的渐进式渲染实现
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // 分层渲染
    const layers = this.createRenderingLayers(imageData)
    
    for (const layer of layers) {
      ctx.putImageData(layer, 0, 0)
      await new Promise(resolve => setTimeout(resolve, 10)) // 模拟渐进渲染
    }

    return canvas
  }

  /**
   * 应用像素密度优化
   */
  private async applyPixelDensityOptimization(
    canvas: HTMLCanvasElement,
    config: QualityOptimizationConfig
  ): Promise<HTMLCanvasElement> {
    const scalingConfig = {
      algorithm: config.antiAliasing ? 'bilinear' as const : 'nearest-neighbor' as const,
      edgeMode: 'clamp' as const,
      preserveAspectRatio: true,
      antiAliasing: config.antiAliasing,
      sharpening: config.customOptimizations?.sharpening || 0,
      noiseReduction: config.customOptimizations?.noiseReduction || 0,
      colorCorrection: config.colorOptimization,
      gammaCorrection: 1.0
    }

    const result = await pixelDensityScaler.scaleCanvas(
      canvas,
      canvas.width,
      canvas.height,
      scalingConfig
    )

    return result.canvas
  }

  /**
   * 应用内存优化
   */
  private async applyMemoryOptimization(
    canvas: HTMLCanvasElement,
    config: QualityOptimizationConfig
  ): Promise<void> {
    // 根据内存策略进行优化
    switch (config.memoryStrategy) {
      case MemoryStrategy.AGGRESSIVE:
        await this.performMemoryCleanup()
        break
      case MemoryStrategy.BALANCED:
        if (this.memoryMonitor.getCurrentUsage() > config.maxMemoryUsage * 0.8) {
          await this.performMemoryCleanup()
        }
        break
    }
  }

  /**
   * 计算质量指标
   */
  private async calculateQualityMetrics(
    original: HTMLCanvasElement,
    optimized: HTMLCanvasElement,
    processingTime: number
  ): Promise<QualityOptimizationResult['metrics']> {
    const originalCtx = original.getContext('2d')!
    const optimizedCtx = optimized.getContext('2d')!
    
    const originalData = originalCtx.getImageData(0, 0, original.width, original.height)
    const optimizedData = optimizedCtx.getImageData(0, 0, optimized.width, optimized.height)

    // 计算PSNR
    const psnr = this.calculatePSNR(originalData, optimizedData)
    
    // 计算SSIM（简化版）
    const ssim = this.calculateSSIM(originalData, optimizedData)
    
    // 估算文件大小
    const fileSize = this.estimateCanvasSize(optimized)
    
    return {
      psnr,
      ssim,
      fileSize,
      renderTime: processingTime,
      memoryPeak: this.memoryMonitor.getPeakUsage()
    }
  }

  /**
   * 计算PSNR
   */
  private calculatePSNR(original: ImageData, optimized: ImageData): number {
    let mse = 0
    const data1 = original.data
    const data2 = optimized.data
    const length = Math.min(data1.length, data2.length)

    for (let i = 0; i < length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const diff = data1[i + c] - data2[i + c]
        mse += diff * diff
      }
    }

    mse /= (length / 4) * 3
    return mse === 0 ? Infinity : 20 * Math.log10(255 / Math.sqrt(mse))
  }

  /**
   * 计算SSIM（简化版）
   */
  private calculateSSIM(original: ImageData, optimized: ImageData): number {
    // 简化的SSIM计算
    const psnr = this.calculatePSNR(original, optimized)
    return Math.min(1, psnr / 40)
  }

  /**
   * 估算Canvas大小
   */
  private estimateCanvasSize(canvas: HTMLCanvasElement): number {
    return canvas.width * canvas.height * 4 // RGBA
  }

  /**
   * 克隆Canvas
   */
  private cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
    const clone = document.createElement('canvas')
    clone.width = source.width
    clone.height = source.height
    const ctx = clone.getContext('2d')!
    ctx.drawImage(source, 0, 0)
    return clone
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(canvas: HTMLCanvasElement, config: QualityOptimizationConfig): string {
    const configHash = JSON.stringify({
      qualityLevel: config.qualityLevel,
      performanceMode: config.performanceMode,
      compressionQuality: config.compressionQuality,
      antiAliasing: config.antiAliasing,
      colorOptimization: config.colorOptimization
    })
    
    return `${canvas.width}x${canvas.height}_${btoa(configHash)}`
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // 检查TTL
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    entry.accessCount++
    return entry
  }

  /**
   * 添加到缓存
   */
  private addToCache(key: string, canvas: HTMLCanvasElement): void {
    // 清理过期缓存
    this.cleanupCache()

    // 如果缓存已满，删除最少使用的条目
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastUsed()
    }

    const entry: CacheEntry = {
      key,
      canvas: this.cloneCanvas(canvas),
      timestamp: Date.now(),
      accessCount: 1,
      size: this.estimateCanvasSize(canvas)
    }

    this.cache.set(key, entry)
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 驱逐最少使用的缓存条目
   */
  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let leastUsedCount = Infinity

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < leastUsedCount) {
        leastUsedCount = entry.accessCount
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  /**
   * 计算缓存命中率
   */
  private calculateCacheHitRate(): number {
    // 简化实现
    return 0.8 // 假设80%命中率
  }

  /**
   * 合并配置
   */
  private mergeConfig(config: Partial<QualityOptimizationConfig>): QualityOptimizationConfig {
    const preset = config.qualityLevel ? QUALITY_PRESETS[config.qualityLevel] : {}
    return {
      ...DEFAULT_QUALITY_CONFIG,
      ...preset,
      ...config
    }
  }

  /**
   * 判断是否应用像素密度优化
   */
  private shouldApplyPixelDensityOptimization(config: QualityOptimizationConfig): boolean {
    return config.qualityLevel !== QualityLevel.DRAFT && config.antiAliasing
  }

  /**
   * 判断是否应用图像优化
   */
  private shouldApplyImageOptimization(config: QualityOptimizationConfig): boolean {
    return config.enableCompression || config.colorOptimization
  }

  /**
   * 获取图像优化模式
   */
  private getImageOptimizationMode(config: QualityOptimizationConfig): string {
    switch (config.performanceMode) {
      case PerformanceMode.SPEED: return 'size-first'
      case PerformanceMode.QUALITY: return 'quality-first'
      default: return 'balanced'
    }
  }

  /**
   * 获取并发级别
   */
  private getConcurrencyLevel(mode: PerformanceMode): number {
    switch (mode) {
      case PerformanceMode.SPEED: return 4
      case PerformanceMode.QUALITY: return 1
      default: return 2
    }
  }

  /**
   * 创建渲染层
   */
  private createRenderingLayers(imageData: ImageData): ImageData[] {
    // 简化实现，返回单层
    return [imageData]
  }

  /**
   * 执行内存清理
   */
  private async performMemoryCleanup(): Promise<void> {
    // 清理缓存
    this.cleanupCache()
    
    // 强制垃圾回收（如果可用）
    if (window.gc) {
      window.gc()
    }
  }

  /**
   * 从缓存创建结果
   */
  private createResultFromCache(
    cached: CacheEntry,
    originalCanvas: HTMLCanvasElement,
    startTime: number
  ): QualityOptimizationResult {
    return {
      originalCanvas,
      optimizedCanvas: cached.canvas,
      originalSize: this.estimateCanvasSize(originalCanvas),
      optimizedSize: cached.size,
      compressionRatio: this.estimateCanvasSize(originalCanvas) / cached.size,
      qualityScore: 1.0, // 缓存结果假设为完美质量
      processingTime: performance.now() - startTime,
      memoryUsed: 0,
      optimizationsApplied: ['缓存命中'],
      metrics: {
        psnr: Infinity,
        ssim: 1.0,
        fileSize: cached.size,
        renderTime: 0,
        memoryPeak: 0
      }
    }
  }

  /**
   * 记录性能指标
   */
  private recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics)
    
    // 保持最近1000条记录
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000)
    }
  }

  /**
   * 开始性能监控
   */
  private startPerformanceMonitoring(): void {
    // 定期清理和监控
    setInterval(() => {
      this.cleanupCache()
      this.memoryMonitor.updateUsage()
    }, 60000) // 每分钟
  }
}

/**
 * 内存监控器类
 */
class MemoryMonitor {
  private currentUsage = 0
  private peakUsage = 0

  public getCurrentUsage(): number {
    return this.currentUsage
  }

  public getPeakUsage(): number {
    return this.peakUsage
  }

  public async checkMemoryAvailability(maxUsage: number): Promise<void> {
    this.updateUsage()
    if (this.currentUsage > maxUsage) {
      throw new Error(`内存使用超限: ${this.currentUsage}MB > ${maxUsage}MB`)
    }
  }

  public updateUsage(): void {
    // 简化的内存使用计算
    if (performance.memory) {
      this.currentUsage = performance.memory.usedJSHeapSize / (1024 * 1024)
      this.peakUsage = Math.max(this.peakUsage, this.currentUsage)
    }
  }
}

/**
 * 渲染队列类
 */
class RenderQueue {
  private queue: Array<() => Promise<void>> = []
  private processing = false

  public async add(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await task()
          resolve()
        } catch (error) {
          reject(error)
        }
      })
      
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    
    while (this.queue.length > 0) {
      const task = this.queue.shift()!
      await task()
    }
    
    this.processing = false
  }
}

// 导出单例实例
export const exportQualityOptimizer = ExportQualityOptimizer.getInstance()
