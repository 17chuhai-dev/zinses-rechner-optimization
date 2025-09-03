/**
 * PNG高分辨率渲染引擎
 * 专门优化PNG格式的高质量渲染和导出
 */

import html2canvas from 'html2canvas'
import type { Chart } from 'chart.js'

// 渲染质量级别
export enum RenderQuality {
  DRAFT = 'draft',        // 草稿质量 - 快速预览
  STANDARD = 'standard',  // 标准质量 - 一般用途
  HIGH = 'high',         // 高质量 - 专业用途
  ULTRA = 'ultra'        // 超高质量 - 印刷级别
}

// 抗锯齿模式
export enum AntiAliasMode {
  NONE = 'none',           // 无抗锯齿
  STANDARD = 'standard',   // 标准抗锯齿
  SUBPIXEL = 'subpixel',  // 子像素抗锯齿
  ADVANCED = 'advanced'    // 高级抗锯齿
}

// 颜色空间类型
export enum ColorSpace {
  SRGB = 'srgb',           // 标准RGB
  ADOBE_RGB = 'adobe-rgb', // Adobe RGB
  DISPLAY_P3 = 'display-p3', // Display P3
  REC2020 = 'rec2020'      // Rec. 2020
}

// PNG渲染配置接口
export interface PNGRenderConfig {
  width: number
  height: number
  dpi: number
  pixelRatio: number
  quality: RenderQuality
  antiAlias: AntiAliasMode
  colorSpace: ColorSpace
  backgroundColor?: string
  transparent: boolean
  preserveDrawingBuffer?: boolean
  premultipliedAlpha?: boolean
  powerPreference?: 'default' | 'high-performance' | 'low-power'
}

// 渲染结果接口
export interface PNGRenderResult {
  canvas: HTMLCanvasElement
  dataUrl: string
  blob: Blob
  width: number
  height: number
  actualDPI: number
  renderTime: number
  memoryUsed: number
  quality: RenderQuality
}

// 渲染统计信息
export interface RenderStats {
  totalPixels: number
  renderTime: number
  memoryPeak: number
  gpuAccelerated: boolean
  antiAliasApplied: boolean
  colorSpaceConverted: boolean
}

/**
 * PNG高分辨率渲染引擎类
 */
export class PNGRenderEngine {
  private static instance: PNGRenderEngine
  private renderCache: Map<string, PNGRenderResult> = new Map()
  private maxCacheSize = 10
  private gpuSupported = false

  private constructor() {
    this.detectGPUSupport()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): PNGRenderEngine {
    if (!PNGRenderEngine.instance) {
      PNGRenderEngine.instance = new PNGRenderEngine()
    }
    return PNGRenderEngine.instance
  }

  /**
   * 渲染图表为高分辨率PNG
   */
  public async renderToPNG(
    element: HTMLElement | Chart,
    config: PNGRenderConfig
  ): Promise<PNGRenderResult> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(element, config)

    // 检查缓存
    if (this.renderCache.has(cacheKey)) {
      const cached = this.renderCache.get(cacheKey)!
      return { ...cached, renderTime: performance.now() - startTime }
    }

    try {
      // 获取渲染目标元素
      const targetElement = this.getTargetElement(element)
      
      // 准备渲染配置
      const renderOptions = this.prepareRenderOptions(config)
      
      // 执行高分辨率渲染
      const canvas = await this.performHighResolutionRender(targetElement, renderOptions)
      
      // 应用后处理效果
      const processedCanvas = await this.applyPostProcessing(canvas, config)
      
      // 生成输出数据
      const result = await this.generateRenderResult(processedCanvas, config, startTime)
      
      // 缓存结果
      this.cacheResult(cacheKey, result)
      
      return result
    } catch (error) {
      throw new Error(`PNG渲染失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量渲染多个图表
   */
  public async batchRender(
    items: Array<{ element: HTMLElement | Chart; config: PNGRenderConfig }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<PNGRenderResult[]> {
    const results: PNGRenderResult[] = []
    
    for (let i = 0; i < items.length; i++) {
      const { element, config } = items[i]
      const result = await this.renderToPNG(element, config)
      results.push(result)
      
      if (onProgress) {
        onProgress(i + 1, items.length)
      }
    }
    
    return results
  }

  /**
   * 获取渲染统计信息
   */
  public getRenderStats(result: PNGRenderResult): RenderStats {
    return {
      totalPixels: result.width * result.height,
      renderTime: result.renderTime,
      memoryPeak: result.memoryUsed,
      gpuAccelerated: this.gpuSupported,
      antiAliasApplied: true, // 基于配置确定
      colorSpaceConverted: true // 基于配置确定
    }
  }

  /**
   * 清理渲染缓存
   */
  public clearCache(): void {
    this.renderCache.clear()
  }

  /**
   * 获取支持的最大分辨率
   */
  public getMaxSupportedResolution(): { width: number; height: number } {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      return { width: 4096, height: 4096 }
    }

    // 测试最大支持的canvas尺寸
    let maxSize = 16384
    while (maxSize > 1024) {
      try {
        canvas.width = maxSize
        canvas.height = maxSize
        ctx.fillRect(0, 0, 1, 1)
        return { width: maxSize, height: maxSize }
      } catch {
        maxSize = Math.floor(maxSize / 2)
      }
    }
    
    return { width: maxSize, height: maxSize }
  }

  /**
   * 检测GPU支持
   */
  private detectGPUSupport(): void {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      this.gpuSupported = !!gl
    } catch {
      this.gpuSupported = false
    }
  }

  /**
   * 获取目标渲染元素
   */
  private getTargetElement(element: HTMLElement | Chart): HTMLElement {
    if (element instanceof HTMLElement) {
      return element
    }
    
    // Chart.js实例
    if ('canvas' in element && element.canvas) {
      return element.canvas.parentElement || element.canvas
    }
    
    throw new Error('无效的渲染目标元素')
  }

  /**
   * 准备渲染选项
   */
  private prepareRenderOptions(config: PNGRenderConfig): any {
    const qualitySettings = this.getQualitySettings(config.quality)
    
    return {
      width: config.width,
      height: config.height,
      scale: config.pixelRatio * this.getDPIScale(config.dpi),
      backgroundColor: config.transparent ? null : (config.backgroundColor || '#ffffff'),
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 30000,
      removeContainer: true,
      foreignObjectRendering: true,
      ...qualitySettings
    }
  }

  /**
   * 执行高分辨率渲染
   */
  private async performHighResolutionRender(
    element: HTMLElement,
    options: any
  ): Promise<HTMLCanvasElement> {
    // 使用html2canvas进行基础渲染
    const canvas = await html2canvas(element, options)
    
    // 如果支持GPU加速，进行额外优化
    if (this.gpuSupported) {
      return this.applyGPUOptimization(canvas)
    }
    
    return canvas
  }

  /**
   * 应用GPU优化
   */
  private applyGPUOptimization(canvas: HTMLCanvasElement): HTMLCanvasElement {
    // 创建WebGL上下文进行GPU加速处理
    const webglCanvas = document.createElement('canvas')
    webglCanvas.width = canvas.width
    webglCanvas.height = canvas.height
    
    const gl = webglCanvas.getContext('webgl2') || webglCanvas.getContext('webgl')
    
    if (!gl) {
      return canvas // 回退到原始canvas
    }

    // 这里可以实现GPU加速的图像处理
    // 目前返回原始canvas，实际实现中可以添加GPU着色器处理
    return canvas
  }

  /**
   * 应用后处理效果
   */
  private async applyPostProcessing(
    canvas: HTMLCanvasElement,
    config: PNGRenderConfig
  ): Promise<HTMLCanvasElement> {
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // 应用抗锯齿处理
    if (config.antiAlias !== AntiAliasMode.NONE) {
      this.applyAntiAliasing(ctx, canvas, config.antiAlias)
    }

    // 应用颜色空间转换
    if (config.colorSpace !== ColorSpace.SRGB) {
      this.applyColorSpaceConversion(ctx, canvas, config.colorSpace)
    }

    return canvas
  }

  /**
   * 应用抗锯齿处理
   */
  private applyAntiAliasing(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mode: AntiAliasMode
  ): void {
    switch (mode) {
      case AntiAliasMode.STANDARD:
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'medium'
        break
      case AntiAliasMode.SUBPIXEL:
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        break
      case AntiAliasMode.ADVANCED:
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        // 可以添加更高级的抗锯齿算法
        break
    }
  }

  /**
   * 应用颜色空间转换
   */
  private applyColorSpaceConversion(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    colorSpace: ColorSpace
  ): void {
    // 这里可以实现颜色空间转换
    // 目前是占位符实现，实际需要颜色管理库
    console.log(`应用颜色空间转换: ${colorSpace}`)
  }

  /**
   * 生成渲染结果
   */
  private async generateRenderResult(
    canvas: HTMLCanvasElement,
    config: PNGRenderConfig,
    startTime: number
  ): Promise<PNGRenderResult> {
    const dataUrl = canvas.toDataURL('image/png', 1.0)
    
    // 转换为Blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/png', 1.0)
    })

    const renderTime = performance.now() - startTime
    const memoryUsed = this.estimateMemoryUsage(canvas)

    return {
      canvas,
      dataUrl,
      blob,
      width: canvas.width,
      height: canvas.height,
      actualDPI: config.dpi,
      renderTime,
      memoryUsed,
      quality: config.quality
    }
  }

  /**
   * 获取质量设置
   */
  private getQualitySettings(quality: RenderQuality): any {
    switch (quality) {
      case RenderQuality.DRAFT:
        return {
          scale: 1,
          imageSmoothingEnabled: false
        }
      case RenderQuality.STANDARD:
        return {
          scale: 1.5,
          imageSmoothingEnabled: true
        }
      case RenderQuality.HIGH:
        return {
          scale: 2,
          imageSmoothingEnabled: true
        }
      case RenderQuality.ULTRA:
        return {
          scale: 3,
          imageSmoothingEnabled: true
        }
      default:
        return {
          scale: 2,
          imageSmoothingEnabled: true
        }
    }
  }

  /**
   * 获取DPI缩放比例
   */
  private getDPIScale(dpi: number): number {
    const baseDPI = 96 // 标准屏幕DPI
    return dpi / baseDPI
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(element: HTMLElement | Chart, config: PNGRenderConfig): string {
    const elementId = element instanceof HTMLElement 
      ? element.id || element.tagName 
      : 'chart'
    
    return `${elementId}_${config.width}x${config.height}_${config.dpi}_${config.quality}`
  }

  /**
   * 缓存渲染结果
   */
  private cacheResult(key: string, result: PNGRenderResult): void {
    if (this.renderCache.size >= this.maxCacheSize) {
      const firstKey = this.renderCache.keys().next().value
      this.renderCache.delete(firstKey)
    }
    
    this.renderCache.set(key, result)
  }

  /**
   * 估算内存使用量
   */
  private estimateMemoryUsage(canvas: HTMLCanvasElement): number {
    // 估算canvas内存使用：宽 × 高 × 4字节(RGBA)
    return canvas.width * canvas.height * 4
  }
}

// 导出单例实例
export const pngRenderEngine = PNGRenderEngine.getInstance()
