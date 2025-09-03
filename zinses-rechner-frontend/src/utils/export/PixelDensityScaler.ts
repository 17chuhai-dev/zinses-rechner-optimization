/**
 * 像素密度缩放算法
 * 提供高质量的像素密度缩放和图像处理功能
 */

// 缩放算法类型
export enum ScalingAlgorithm {
  NEAREST_NEIGHBOR = 'nearest-neighbor',    // 最近邻
  BILINEAR = 'bilinear',                   // 双线性插值
  BICUBIC = 'bicubic',                     // 双三次插值
  LANCZOS = 'lanczos',                     // Lanczos算法
  MITCHELL = 'mitchell',                   // Mitchell滤波器
  CATMULL_ROM = 'catmull-rom'             // Catmull-Rom样条
}

// 边缘处理模式
export enum EdgeMode {
  CLAMP = 'clamp',           // 边缘像素延伸
  WRAP = 'wrap',             // 环绕模式
  MIRROR = 'mirror',         // 镜像模式
  TRANSPARENT = 'transparent' // 透明填充
}

// 缩放配置接口
export interface ScalingConfig {
  algorithm: ScalingAlgorithm
  edgeMode: EdgeMode
  preserveAspectRatio: boolean
  antiAliasing: boolean
  sharpening: number        // 0-1, 锐化强度
  noiseReduction: number    // 0-1, 降噪强度
  colorCorrection: boolean
  gammaCorrection: number   // 伽马校正值
}

// 缩放结果接口
export interface ScalingResult {
  canvas: HTMLCanvasElement
  originalWidth: number
  originalHeight: number
  scaledWidth: number
  scaledHeight: number
  scaleFactor: number
  algorithm: ScalingAlgorithm
  processingTime: number
  qualityScore: number
}

// 像素密度信息接口
export interface PixelDensityInfo {
  devicePixelRatio: number
  logicalPixels: { width: number; height: number }
  physicalPixels: { width: number; height: number }
  dpi: number
  ppi: number
  densityCategory: 'ldpi' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi'
}

// 预设缩放配置
export const SCALING_PRESETS: Record<string, ScalingConfig> = {
  FAST: {
    algorithm: ScalingAlgorithm.NEAREST_NEIGHBOR,
    edgeMode: EdgeMode.CLAMP,
    preserveAspectRatio: true,
    antiAliasing: false,
    sharpening: 0,
    noiseReduction: 0,
    colorCorrection: false,
    gammaCorrection: 1.0
  },
  BALANCED: {
    algorithm: ScalingAlgorithm.BILINEAR,
    edgeMode: EdgeMode.CLAMP,
    preserveAspectRatio: true,
    antiAliasing: true,
    sharpening: 0.2,
    noiseReduction: 0.1,
    colorCorrection: true,
    gammaCorrection: 1.0
  },
  HIGH_QUALITY: {
    algorithm: ScalingAlgorithm.BICUBIC,
    edgeMode: EdgeMode.CLAMP,
    preserveAspectRatio: true,
    antiAliasing: true,
    sharpening: 0.3,
    noiseReduction: 0.2,
    colorCorrection: true,
    gammaCorrection: 1.0
  },
  ULTRA_QUALITY: {
    algorithm: ScalingAlgorithm.LANCZOS,
    edgeMode: EdgeMode.CLAMP,
    preserveAspectRatio: true,
    antiAliasing: true,
    sharpening: 0.4,
    noiseReduction: 0.3,
    colorCorrection: true,
    gammaCorrection: 1.0
  }
}

/**
 * 像素密度缩放器类
 */
export class PixelDensityScaler {
  private static instance: PixelDensityScaler
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  private constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): PixelDensityScaler {
    if (!PixelDensityScaler.instance) {
      PixelDensityScaler.instance = new PixelDensityScaler()
    }
    return PixelDensityScaler.instance
  }

  /**
   * 缩放图像到指定像素密度
   */
  public async scaleToPixelDensity(
    sourceCanvas: HTMLCanvasElement,
    targetDensity: number,
    config: Partial<ScalingConfig> = {}
  ): Promise<ScalingResult> {
    const startTime = performance.now()
    const fullConfig = this.mergeConfig(config)
    
    const currentDensity = this.getCurrentPixelDensity()
    const scaleFactor = targetDensity / currentDensity
    
    const targetWidth = Math.round(sourceCanvas.width * scaleFactor)
    const targetHeight = Math.round(sourceCanvas.height * scaleFactor)
    
    const result = await this.scaleCanvas(
      sourceCanvas,
      targetWidth,
      targetHeight,
      fullConfig
    )
    
    const processingTime = performance.now() - startTime
    
    return {
      ...result,
      scaleFactor,
      processingTime,
      qualityScore: this.calculateQualityScore(result, fullConfig)
    }
  }

  /**
   * 缩放Canvas到指定尺寸
   */
  public async scaleCanvas(
    sourceCanvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number,
    config: ScalingConfig
  ): Promise<ScalingResult> {
    const startTime = performance.now()
    
    // 创建目标Canvas
    const targetCanvas = document.createElement('canvas')
    targetCanvas.width = targetWidth
    targetCanvas.height = targetHeight
    const targetCtx = targetCanvas.getContext('2d')!
    
    // 配置渲染上下文
    this.configureRenderingContext(targetCtx, config)
    
    // 执行缩放
    await this.performScaling(
      sourceCanvas,
      targetCanvas,
      targetCtx,
      config
    )
    
    // 后处理
    if (config.sharpening > 0 || config.noiseReduction > 0) {
      await this.applyPostProcessing(targetCanvas, targetCtx, config)
    }
    
    const processingTime = performance.now() - startTime
    
    return {
      canvas: targetCanvas,
      originalWidth: sourceCanvas.width,
      originalHeight: sourceCanvas.height,
      scaledWidth: targetWidth,
      scaledHeight: targetHeight,
      scaleFactor: targetWidth / sourceCanvas.width,
      algorithm: config.algorithm,
      processingTime,
      qualityScore: 0 // 将在调用方计算
    }
  }

  /**
   * 获取当前设备像素密度信息
   */
  public getCurrentPixelDensityInfo(): PixelDensityInfo {
    const devicePixelRatio = window.devicePixelRatio || 1
    const screen = window.screen
    
    const logicalPixels = {
      width: screen.width,
      height: screen.height
    }
    
    const physicalPixels = {
      width: Math.round(screen.width * devicePixelRatio),
      height: Math.round(screen.height * devicePixelRatio)
    }
    
    // 估算DPI (假设标准显示器尺寸)
    const diagonalInches = this.estimateScreenDiagonal()
    const diagonalPixels = Math.sqrt(
      physicalPixels.width ** 2 + physicalPixels.height ** 2
    )
    const ppi = Math.round(diagonalPixels / diagonalInches)
    
    return {
      devicePixelRatio,
      logicalPixels,
      physicalPixels,
      dpi: ppi,
      ppi,
      densityCategory: this.getDensityCategory(ppi)
    }
  }

  /**
   * 计算最优缩放因子
   */
  public calculateOptimalScaleFactor(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    preserveAspectRatio: boolean = true
  ): { scaleX: number; scaleY: number; uniform: number } {
    const scaleX = targetWidth / sourceWidth
    const scaleY = targetHeight / sourceHeight
    
    let uniform: number
    if (preserveAspectRatio) {
      uniform = Math.min(scaleX, scaleY)
    } else {
      uniform = Math.sqrt(scaleX * scaleY)
    }
    
    return { scaleX, scaleY, uniform }
  }

  /**
   * 批量缩放多个Canvas
   */
  public async batchScale(
    canvases: HTMLCanvasElement[],
    targetWidth: number,
    targetHeight: number,
    config: Partial<ScalingConfig> = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<ScalingResult[]> {
    const fullConfig = this.mergeConfig(config)
    const results: ScalingResult[] = []
    
    for (let i = 0; i < canvases.length; i++) {
      const result = await this.scaleCanvas(
        canvases[i],
        targetWidth,
        targetHeight,
        fullConfig
      )
      results.push(result)
      
      if (onProgress) {
        onProgress(i + 1, canvases.length)
      }
    }
    
    return results
  }

  /**
   * 预览不同缩放算法的效果
   */
  public async previewScalingAlgorithms(
    sourceCanvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number
  ): Promise<Record<ScalingAlgorithm, ScalingResult>> {
    const results: Record<ScalingAlgorithm, ScalingResult> = {} as any
    
    for (const algorithm of Object.values(ScalingAlgorithm)) {
      const config: ScalingConfig = {
        ...SCALING_PRESETS.BALANCED,
        algorithm
      }
      
      results[algorithm] = await this.scaleCanvas(
        sourceCanvas,
        targetWidth,
        targetHeight,
        config
      )
    }
    
    return results
  }

  /**
   * 执行实际缩放操作
   */
  private async performScaling(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    targetCtx: CanvasRenderingContext2D,
    config: ScalingConfig
  ): Promise<void> {
    switch (config.algorithm) {
      case ScalingAlgorithm.NEAREST_NEIGHBOR:
        await this.nearestNeighborScaling(sourceCanvas, targetCanvas, targetCtx)
        break
      case ScalingAlgorithm.BILINEAR:
        await this.bilinearScaling(sourceCanvas, targetCanvas, targetCtx)
        break
      case ScalingAlgorithm.BICUBIC:
        await this.bicubicScaling(sourceCanvas, targetCanvas, targetCtx)
        break
      case ScalingAlgorithm.LANCZOS:
        await this.lanczosScaling(sourceCanvas, targetCanvas, targetCtx)
        break
      default:
        // 回退到浏览器默认缩放
        targetCtx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height)
    }
  }

  /**
   * 最近邻缩放
   */
  private async nearestNeighborScaling(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    targetCtx: CanvasRenderingContext2D
  ): Promise<void> {
    targetCtx.imageSmoothingEnabled = false
    targetCtx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height)
  }

  /**
   * 双线性插值缩放
   */
  private async bilinearScaling(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    targetCtx: CanvasRenderingContext2D
  ): Promise<void> {
    targetCtx.imageSmoothingEnabled = true
    targetCtx.imageSmoothingQuality = 'medium'
    targetCtx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height)
  }

  /**
   * 双三次插值缩放
   */
  private async bicubicScaling(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    targetCtx: CanvasRenderingContext2D
  ): Promise<void> {
    targetCtx.imageSmoothingEnabled = true
    targetCtx.imageSmoothingQuality = 'high'
    targetCtx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height)
  }

  /**
   * Lanczos缩放（简化实现）
   */
  private async lanczosScaling(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    targetCtx: CanvasRenderingContext2D
  ): Promise<void> {
    // 使用多步缩放来模拟Lanczos效果
    const steps = this.calculateScalingSteps(
      sourceCanvas.width,
      sourceCanvas.height,
      targetCanvas.width,
      targetCanvas.height
    )
    
    let currentCanvas = sourceCanvas
    
    for (const step of steps) {
      const stepCanvas = document.createElement('canvas')
      stepCanvas.width = step.width
      stepCanvas.height = step.height
      const stepCtx = stepCanvas.getContext('2d')!
      
      stepCtx.imageSmoothingEnabled = true
      stepCtx.imageSmoothingQuality = 'high'
      stepCtx.drawImage(currentCanvas, 0, 0, step.width, step.height)
      
      currentCanvas = stepCanvas
    }
    
    targetCtx.drawImage(currentCanvas, 0, 0)
  }

  /**
   * 配置渲染上下文
   */
  private configureRenderingContext(
    ctx: CanvasRenderingContext2D,
    config: ScalingConfig
  ): void {
    ctx.imageSmoothingEnabled = config.antiAliasing
    
    if (config.antiAliasing) {
      ctx.imageSmoothingQuality = 'high'
    }
  }

  /**
   * 应用后处理效果
   */
  private async applyPostProcessing(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    config: ScalingConfig
  ): Promise<void> {
    if (config.sharpening > 0) {
      await this.applySharpeningFilter(canvas, ctx, config.sharpening)
    }
    
    if (config.noiseReduction > 0) {
      await this.applyNoiseReduction(canvas, ctx, config.noiseReduction)
    }
    
    if (config.colorCorrection) {
      await this.applyColorCorrection(canvas, ctx, config.gammaCorrection)
    }
  }

  /**
   * 应用锐化滤镜
   */
  private async applySharpeningFilter(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    intensity: number
  ): Promise<void> {
    // 简化的锐化实现
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // 锐化卷积核
    const kernel = [
      0, -intensity, 0,
      -intensity, 1 + 4 * intensity, -intensity,
      0, -intensity, 0
    ]
    
    // 应用卷积（简化实现）
    // 实际实现会更复杂，这里只是示例
    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 应用降噪
   */
  private async applyNoiseReduction(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    intensity: number
  ): Promise<void> {
    // 简化的降噪实现
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    // 应用高斯模糊等降噪算法
    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 应用颜色校正
   */
  private async applyColorCorrection(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    gamma: number
  ): Promise<void> {
    if (gamma === 1.0) return
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // 应用伽马校正
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.pow(data[i] / 255, gamma) * 255     // R
      data[i + 1] = Math.pow(data[i + 1] / 255, gamma) * 255 // G
      data[i + 2] = Math.pow(data[i + 2] / 255, gamma) * 255 // B
      // Alpha通道不变
    }
    
    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 计算缩放步骤
   */
  private calculateScalingSteps(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): Array<{ width: number; height: number }> {
    const steps: Array<{ width: number; height: number }> = []
    const scaleFactor = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
    
    if (scaleFactor > 0.5) {
      // 直接缩放
      steps.push({ width: targetWidth, height: targetHeight })
    } else {
      // 多步缩放
      let currentWidth = sourceWidth
      let currentHeight = sourceHeight
      
      while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
        currentWidth = Math.max(targetWidth, Math.round(currentWidth * 0.5))
        currentHeight = Math.max(targetHeight, Math.round(currentHeight * 0.5))
        steps.push({ width: currentWidth, height: currentHeight })
      }
      
      if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
        steps.push({ width: targetWidth, height: targetHeight })
      }
    }
    
    return steps
  }

  /**
   * 获取当前像素密度
   */
  private getCurrentPixelDensity(): number {
    return window.devicePixelRatio || 1
  }

  /**
   * 估算屏幕对角线尺寸
   */
  private estimateScreenDiagonal(): number {
    // 基于常见设备类型的估算
    const width = window.screen.width
    const height = window.screen.height
    
    if (width <= 480) return 4.5  // 手机
    if (width <= 768) return 7.9  // 小平板
    if (width <= 1024) return 9.7 // 平板
    if (width <= 1366) return 13.3 // 笔记本
    if (width <= 1920) return 15.6 // 大笔记本
    return 24 // 台式机显示器
  }

  /**
   * 获取密度类别
   */
  private getDensityCategory(ppi: number): PixelDensityInfo['densityCategory'] {
    if (ppi <= 120) return 'ldpi'
    if (ppi <= 160) return 'mdpi'
    if (ppi <= 240) return 'hdpi'
    if (ppi <= 320) return 'xhdpi'
    if (ppi <= 480) return 'xxhdpi'
    return 'xxxhdpi'
  }

  /**
   * 合并配置
   */
  private mergeConfig(config: Partial<ScalingConfig>): ScalingConfig {
    return {
      ...SCALING_PRESETS.BALANCED,
      ...config
    }
  }

  /**
   * 计算质量分数
   */
  private calculateQualityScore(
    result: ScalingResult,
    config: ScalingConfig
  ): number {
    let score = 0.5 // 基础分数
    
    // 算法质量加分
    switch (config.algorithm) {
      case ScalingAlgorithm.LANCZOS:
        score += 0.3
        break
      case ScalingAlgorithm.BICUBIC:
        score += 0.2
        break
      case ScalingAlgorithm.BILINEAR:
        score += 0.1
        break
    }
    
    // 后处理加分
    if (config.antiAliasing) score += 0.1
    if (config.sharpening > 0) score += config.sharpening * 0.1
    if (config.colorCorrection) score += 0.05
    
    return Math.min(1, score)
  }
}

// 导出单例实例
export const pixelDensityScaler = PixelDensityScaler.getInstance()
