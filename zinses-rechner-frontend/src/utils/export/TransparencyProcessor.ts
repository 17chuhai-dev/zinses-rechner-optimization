/**
 * 透明背景处理优化系统
 * 支持Alpha通道精确控制、半透明效果、渐变透明、边缘抗锯齿等高级透明处理功能
 */

// 透明度处理模式
export enum TransparencyMode {
  NONE = 'none',                    // 无透明
  FULL = 'full',                    // 完全透明
  GRADIENT = 'gradient',            // 渐变透明
  ALPHA_MASK = 'alpha-mask',        // Alpha遮罩
  EDGE_FADE = 'edge-fade',          // 边缘淡化
  SELECTIVE = 'selective'           // 选择性透明
}

// 抗锯齿模式
export enum AntiAliasingMode {
  NONE = 'none',                    // 无抗锯齿
  STANDARD = 'standard',            // 标准抗锯齿
  SUBPIXEL = 'subpixel',           // 子像素抗锯齿
  ADVANCED = 'advanced'             // 高级抗锯齿
}

// 透明度配置接口
export interface TransparencyConfig {
  mode: TransparencyMode
  opacity: number                   // 0-1
  backgroundColor: string
  preserveAlpha: boolean
  antiAliasing: AntiAliasingMode
  edgeSmoothing: number            // 0-1
  gradientStops?: Array<{
    position: number               // 0-1
    opacity: number               // 0-1
  }>
  selectiveColors?: string[]       // 选择性透明的颜色
  colorTolerance: number          // 颜色容差 0-255
}

// 透明度处理结果接口
export interface TransparencyResult {
  canvas: HTMLCanvasElement
  hasTransparency: boolean
  alphaChannelData: Uint8ClampedArray
  transparentPixels: number
  opaquePixels: number
  semiTransparentPixels: number
  averageOpacity: number
  processingTime: number
}

// 默认透明度配置
export const DEFAULT_TRANSPARENCY_CONFIG: TransparencyConfig = {
  mode: TransparencyMode.FULL,
  opacity: 1.0,
  backgroundColor: '#ffffff',
  preserveAlpha: true,
  antiAliasing: AntiAliasingMode.STANDARD,
  edgeSmoothing: 0.5,
  colorTolerance: 10
}

// 预设透明度配置
export const TRANSPARENCY_PRESETS: Record<string, TransparencyConfig> = {
  OPAQUE: {
    mode: TransparencyMode.NONE,
    opacity: 1.0,
    backgroundColor: '#ffffff',
    preserveAlpha: false,
    antiAliasing: AntiAliasingMode.STANDARD,
    edgeSmoothing: 0,
    colorTolerance: 0
  },
  TRANSPARENT: {
    mode: TransparencyMode.FULL,
    opacity: 1.0,
    backgroundColor: 'transparent',
    preserveAlpha: true,
    antiAliasing: AntiAliasingMode.ADVANCED,
    edgeSmoothing: 0.8,
    colorTolerance: 10
  },
  SEMI_TRANSPARENT: {
    mode: TransparencyMode.FULL,
    opacity: 0.8,
    backgroundColor: 'transparent',
    preserveAlpha: true,
    antiAliasing: AntiAliasingMode.STANDARD,
    edgeSmoothing: 0.5,
    colorTolerance: 5
  },
  WHITE_BACKGROUND: {
    mode: TransparencyMode.SELECTIVE,
    opacity: 1.0,
    backgroundColor: '#ffffff',
    preserveAlpha: true,
    antiAliasing: AntiAliasingMode.STANDARD,
    edgeSmoothing: 0.3,
    selectiveColors: ['#ffffff', '#f8f9fa', '#f1f3f4'],
    colorTolerance: 20
  },
  GRADIENT_FADE: {
    mode: TransparencyMode.GRADIENT,
    opacity: 1.0,
    backgroundColor: 'transparent',
    preserveAlpha: true,
    antiAliasing: AntiAliasingMode.ADVANCED,
    edgeSmoothing: 0.7,
    gradientStops: [
      { position: 0, opacity: 1.0 },
      { position: 0.8, opacity: 1.0 },
      { position: 1.0, opacity: 0.0 }
    ],
    colorTolerance: 5
  }
}

/**
 * 透明背景处理器类
 */
export class TransparencyProcessor {
  private static instance: TransparencyProcessor
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  private constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d', { alpha: true })!
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): TransparencyProcessor {
    if (!TransparencyProcessor.instance) {
      TransparencyProcessor.instance = new TransparencyProcessor()
    }
    return TransparencyProcessor.instance
  }

  /**
   * 处理透明背景
   */
  public async processTransparency(
    sourceCanvas: HTMLCanvasElement,
    config: Partial<TransparencyConfig> = {}
  ): Promise<TransparencyResult> {
    const startTime = performance.now()
    const fullConfig = { ...DEFAULT_TRANSPARENCY_CONFIG, ...config }

    // 创建处理Canvas
    const processedCanvas = this.createProcessingCanvas(sourceCanvas)
    const processedCtx = processedCanvas.getContext('2d', { alpha: true })!

    // 根据模式处理透明度
    let result: TransparencyResult
    
    switch (fullConfig.mode) {
      case TransparencyMode.NONE:
        result = await this.processOpaque(sourceCanvas, processedCanvas, fullConfig)
        break
      case TransparencyMode.FULL:
        result = await this.processFullTransparency(sourceCanvas, processedCanvas, fullConfig)
        break
      case TransparencyMode.GRADIENT:
        result = await this.processGradientTransparency(sourceCanvas, processedCanvas, fullConfig)
        break
      case TransparencyMode.ALPHA_MASK:
        result = await this.processAlphaMask(sourceCanvas, processedCanvas, fullConfig)
        break
      case TransparencyMode.EDGE_FADE:
        result = await this.processEdgeFade(sourceCanvas, processedCanvas, fullConfig)
        break
      case TransparencyMode.SELECTIVE:
        result = await this.processSelectiveTransparency(sourceCanvas, processedCanvas, fullConfig)
        break
      default:
        result = await this.processFullTransparency(sourceCanvas, processedCanvas, fullConfig)
    }

    // 应用抗锯齿
    if (fullConfig.antiAliasing !== AntiAliasingMode.NONE) {
      await this.applyAntiAliasing(result.canvas, fullConfig.antiAliasing, fullConfig.edgeSmoothing)
    }

    result.processingTime = performance.now() - startTime
    return result
  }

  /**
   * 处理不透明背景
   */
  private async processOpaque(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    config: TransparencyConfig
  ): Promise<TransparencyResult> {
    const ctx = targetCanvas.getContext('2d')!
    
    // 填充背景色
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height)
    
    // 绘制源图像
    ctx.globalAlpha = config.opacity
    ctx.drawImage(sourceCanvas, 0, 0)
    
    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height)
    const alphaData = this.extractAlphaChannel(imageData)
    
    return {
      canvas: targetCanvas,
      hasTransparency: false,
      alphaChannelData: alphaData,
      transparentPixels: 0,
      opaquePixels: imageData.data.length / 4,
      semiTransparentPixels: 0,
      averageOpacity: 1.0,
      processingTime: 0
    }
  }

  /**
   * 处理完全透明背景
   */
  private async processFullTransparency(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    config: TransparencyConfig
  ): Promise<TransparencyResult> {
    const ctx = targetCanvas.getContext('2d', { alpha: true })!
    
    // 清除背景
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
    
    // 绘制源图像
    ctx.globalAlpha = config.opacity
    ctx.drawImage(sourceCanvas, 0, 0)
    
    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height)
    const stats = this.analyzeTransparency(imageData)
    const alphaData = this.extractAlphaChannel(imageData)
    
    return {
      canvas: targetCanvas,
      hasTransparency: true,
      alphaChannelData: alphaData,
      ...stats,
      processingTime: 0
    }
  }

  /**
   * 处理渐变透明
   */
  private async processGradientTransparency(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    config: TransparencyConfig
  ): Promise<TransparencyResult> {
    const ctx = targetCanvas.getContext('2d', { alpha: true })!
    
    // 清除背景
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
    
    // 绘制源图像
    ctx.drawImage(sourceCanvas, 0, 0)
    
    // 应用渐变遮罩
    if (config.gradientStops && config.gradientStops.length > 0) {
      await this.applyGradientMask(ctx, targetCanvas.width, targetCanvas.height, config.gradientStops)
    }
    
    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height)
    const stats = this.analyzeTransparency(imageData)
    const alphaData = this.extractAlphaChannel(imageData)
    
    return {
      canvas: targetCanvas,
      hasTransparency: true,
      alphaChannelData: alphaData,
      ...stats,
      processingTime: 0
    }
  }

  /**
   * 处理Alpha遮罩
   */
  private async processAlphaMask(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    config: TransparencyConfig
  ): Promise<TransparencyResult> {
    const ctx = targetCanvas.getContext('2d', { alpha: true })!
    
    // 清除背景
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
    
    // 绘制源图像
    ctx.drawImage(sourceCanvas, 0, 0)
    
    // 应用Alpha遮罩处理
    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height)
    this.applyAlphaMaskProcessing(imageData, config)
    ctx.putImageData(imageData, 0, 0)
    
    const stats = this.analyzeTransparency(imageData)
    const alphaData = this.extractAlphaChannel(imageData)
    
    return {
      canvas: targetCanvas,
      hasTransparency: true,
      alphaChannelData: alphaData,
      ...stats,
      processingTime: 0
    }
  }

  /**
   * 处理边缘淡化
   */
  private async processEdgeFade(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    config: TransparencyConfig
  ): Promise<TransparencyResult> {
    const ctx = targetCanvas.getContext('2d', { alpha: true })!
    
    // 清除背景
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
    
    // 绘制源图像
    ctx.drawImage(sourceCanvas, 0, 0)
    
    // 应用边缘淡化
    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height)
    this.applyEdgeFade(imageData, config.edgeSmoothing)
    ctx.putImageData(imageData, 0, 0)
    
    const stats = this.analyzeTransparency(imageData)
    const alphaData = this.extractAlphaChannel(imageData)
    
    return {
      canvas: targetCanvas,
      hasTransparency: true,
      alphaChannelData: alphaData,
      ...stats,
      processingTime: 0
    }
  }

  /**
   * 处理选择性透明
   */
  private async processSelectiveTransparency(
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    config: TransparencyConfig
  ): Promise<TransparencyResult> {
    const ctx = targetCanvas.getContext('2d', { alpha: true })!
    
    // 清除背景
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
    
    // 绘制源图像
    ctx.drawImage(sourceCanvas, 0, 0)
    
    // 应用选择性透明
    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height)
    if (config.selectiveColors) {
      this.applySelectiveTransparency(imageData, config.selectiveColors, config.colorTolerance)
    }
    ctx.putImageData(imageData, 0, 0)
    
    const stats = this.analyzeTransparency(imageData)
    const alphaData = this.extractAlphaChannel(imageData)
    
    return {
      canvas: targetCanvas,
      hasTransparency: true,
      alphaChannelData: alphaData,
      ...stats,
      processingTime: 0
    }
  }

  /**
   * 应用渐变遮罩
   */
  private async applyGradientMask(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gradientStops: Array<{ position: number; opacity: number }>
  ): Promise<void> {
    // 创建渐变
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    
    gradientStops.forEach(stop => {
      const alpha = Math.round(stop.opacity * 255).toString(16).padStart(2, '0')
      gradient.addColorStop(stop.position, `#000000${alpha}`)
    })
    
    // 应用遮罩
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'
  }

  /**
   * 应用Alpha遮罩处理
   */
  private applyAlphaMaskProcessing(imageData: ImageData, config: TransparencyConfig): void {
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      
      // 基于亮度计算Alpha值
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255
      const newAlpha = Math.round(brightness * a * config.opacity)
      
      data[i + 3] = newAlpha
    }
  }

  /**
   * 应用边缘淡化
   */
  private applyEdgeFade(imageData: ImageData, fadeStrength: number): void {
    const { width, height, data } = imageData
    const fadePixels = Math.round(Math.min(width, height) * fadeStrength * 0.1)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4
        
        // 计算到边缘的距离
        const distanceToEdge = Math.min(x, y, width - x - 1, height - y - 1)
        
        if (distanceToEdge < fadePixels) {
          const fadeRatio = distanceToEdge / fadePixels
          data[index + 3] = Math.round(data[index + 3] * fadeRatio)
        }
      }
    }
  }

  /**
   * 应用选择性透明
   */
  private applySelectiveTransparency(
    imageData: ImageData,
    targetColors: string[],
    tolerance: number
  ): void {
    const data = imageData.data
    const targetRGBs = targetColors.map(color => this.hexToRgb(color))
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // 检查是否匹配目标颜色
      const isTargetColor = targetRGBs.some(targetRGB => {
        if (!targetRGB) return false
        
        const distance = Math.sqrt(
          Math.pow(r - targetRGB.r, 2) +
          Math.pow(g - targetRGB.g, 2) +
          Math.pow(b - targetRGB.b, 2)
        )
        
        return distance <= tolerance
      })
      
      if (isTargetColor) {
        data[i + 3] = 0 // 设为透明
      }
    }
  }

  /**
   * 应用抗锯齿
   */
  private async applyAntiAliasing(
    canvas: HTMLCanvasElement,
    mode: AntiAliasingMode,
    strength: number
  ): Promise<void> {
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    switch (mode) {
      case AntiAliasingMode.STANDARD:
        this.applyStandardAntiAliasing(imageData, strength)
        break
      case AntiAliasingMode.SUBPIXEL:
        this.applySubpixelAntiAliasing(imageData, strength)
        break
      case AntiAliasingMode.ADVANCED:
        this.applyAdvancedAntiAliasing(imageData, strength)
        break
    }
    
    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 应用标准抗锯齿
   */
  private applyStandardAntiAliasing(imageData: ImageData, strength: number): void {
    // 简化的抗锯齿实现
    const { width, height, data } = imageData
    const newData = new Uint8ClampedArray(data)
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = (y * width + x) * 4
        
        // 3x3邻域平均
        let totalR = 0, totalG = 0, totalB = 0, totalA = 0
        let count = 0
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIndex = ((y + dy) * width + (x + dx)) * 4
            totalR += data[neighborIndex]
            totalG += data[neighborIndex + 1]
            totalB += data[neighborIndex + 2]
            totalA += data[neighborIndex + 3]
            count++
          }
        }
        
        const factor = strength * 0.3
        newData[index] = Math.round(data[index] * (1 - factor) + (totalR / count) * factor)
        newData[index + 1] = Math.round(data[index + 1] * (1 - factor) + (totalG / count) * factor)
        newData[index + 2] = Math.round(data[index + 2] * (1 - factor) + (totalB / count) * factor)
        newData[index + 3] = Math.round(data[index + 3] * (1 - factor) + (totalA / count) * factor)
      }
    }
    
    data.set(newData)
  }

  /**
   * 应用子像素抗锯齿
   */
  private applySubpixelAntiAliasing(imageData: ImageData, strength: number): void {
    // 子像素抗锯齿的简化实现
    this.applyStandardAntiAliasing(imageData, strength * 0.7)
  }

  /**
   * 应用高级抗锯齿
   */
  private applyAdvancedAntiAliasing(imageData: ImageData, strength: number): void {
    // 高级抗锯齿的简化实现
    this.applyStandardAntiAliasing(imageData, strength)
    // 可以添加更复杂的算法，如Lanczos滤波等
  }

  /**
   * 分析透明度统计
   */
  private analyzeTransparency(imageData: ImageData): {
    transparentPixels: number
    opaquePixels: number
    semiTransparentPixels: number
    averageOpacity: number
  } {
    const data = imageData.data
    let transparentPixels = 0
    let opaquePixels = 0
    let semiTransparentPixels = 0
    let totalOpacity = 0
    
    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i]
      totalOpacity += alpha
      
      if (alpha === 0) {
        transparentPixels++
      } else if (alpha === 255) {
        opaquePixels++
      } else {
        semiTransparentPixels++
      }
    }
    
    const totalPixels = data.length / 4
    const averageOpacity = totalOpacity / (totalPixels * 255)
    
    return {
      transparentPixels,
      opaquePixels,
      semiTransparentPixels,
      averageOpacity
    }
  }

  /**
   * 提取Alpha通道数据
   */
  private extractAlphaChannel(imageData: ImageData): Uint8ClampedArray {
    const data = imageData.data
    const alphaData = new Uint8ClampedArray(data.length / 4)
    
    for (let i = 0; i < alphaData.length; i++) {
      alphaData[i] = data[i * 4 + 3]
    }
    
    return alphaData
  }

  /**
   * 创建处理Canvas
   */
  private createProcessingCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = sourceCanvas.width
    canvas.height = sourceCanvas.height
    return canvas
  }

  /**
   * 十六进制颜色转RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  /**
   * 获取预设配置
   */
  public getPresetConfig(presetName: keyof typeof TRANSPARENCY_PRESETS): TransparencyConfig {
    return { ...TRANSPARENCY_PRESETS[presetName] }
  }

  /**
   * 验证透明度配置
   */
  public validateConfig(config: Partial<TransparencyConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (config.opacity !== undefined && (config.opacity < 0 || config.opacity > 1)) {
      errors.push('透明度值必须在0-1之间')
    }
    
    if (config.edgeSmoothing !== undefined && (config.edgeSmoothing < 0 || config.edgeSmoothing > 1)) {
      errors.push('边缘平滑值必须在0-1之间')
    }
    
    if (config.colorTolerance !== undefined && (config.colorTolerance < 0 || config.colorTolerance > 255)) {
      errors.push('颜色容差必须在0-255之间')
    }
    
    if (config.gradientStops) {
      config.gradientStops.forEach((stop, index) => {
        if (stop.position < 0 || stop.position > 1) {
          errors.push(`渐变停止点${index + 1}的位置必须在0-1之间`)
        }
        if (stop.opacity < 0 || stop.opacity > 1) {
          errors.push(`渐变停止点${index + 1}的透明度必须在0-1之间`)
        }
      })
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// 导出单例实例
export const transparencyProcessor = TransparencyProcessor.getInstance()
