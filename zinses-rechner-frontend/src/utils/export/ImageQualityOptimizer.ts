/**
 * 图像质量优化算法
 * 实现智能压缩、颜色优化、噪点减少、锐化处理等功能
 */

// 优化模式枚举
export enum OptimizationMode {
  QUALITY_FIRST = 'quality-first',      // 质量优先
  SIZE_FIRST = 'size-first',            // 大小优先
  BALANCED = 'balanced',                // 平衡模式
  CUSTOM = 'custom'                     // 自定义
}

// 压缩算法枚举
export enum CompressionAlgorithm {
  NONE = 'none',                        // 无压缩
  LOSSLESS = 'lossless',               // 无损压缩
  ADAPTIVE = 'adaptive',               // 自适应压缩
  SMART = 'smart'                      // 智能压缩
}

// 颜色优化模式
export enum ColorOptimization {
  NONE = 'none',                        // 无优化
  PALETTE_REDUCTION = 'palette-reduction', // 调色板缩减
  COLOR_QUANTIZATION = 'color-quantization', // 颜色量化
  DITHERING = 'dithering'              // 抖动处理
}

// 锐化算法
export enum SharpeningAlgorithm {
  NONE = 'none',                        // 无锐化
  UNSHARP_MASK = 'unsharp-mask',       // 反锐化遮罩
  LAPLACIAN = 'laplacian',             // 拉普拉斯算子
  HIGH_PASS = 'high-pass'              // 高通滤波
}

// 降噪算法
export enum NoiseReductionAlgorithm {
  NONE = 'none',                        // 无降噪
  GAUSSIAN_BLUR = 'gaussian-blur',     // 高斯模糊
  MEDIAN_FILTER = 'median-filter',     // 中值滤波
  BILATERAL_FILTER = 'bilateral-filter' // 双边滤波
}

// 优化配置接口
export interface OptimizationConfig {
  mode: OptimizationMode
  targetQuality: number                 // 0-1
  targetFileSize?: number              // KB
  compression: {
    algorithm: CompressionAlgorithm
    level: number                      // 0-1
    preserveDetails: boolean
  }
  colorOptimization: {
    mode: ColorOptimization
    maxColors?: number
    ditherStrength?: number            // 0-1
    preserveGradients: boolean
  }
  sharpening: {
    algorithm: SharpeningAlgorithm
    strength: number                   // 0-1
    radius: number                     // 像素
    threshold: number                  // 0-255
  }
  noiseReduction: {
    algorithm: NoiseReductionAlgorithm
    strength: number                   // 0-1
    preserveEdges: boolean
  }
  advanced: {
    gammaCorrection: number            // 0.1-3.0
    contrastEnhancement: number        // 0-1
    saturationAdjustment: number       // 0-2
    brightnessAdjustment: number       // -1 to 1
  }
}

// 优化结果接口
export interface OptimizationResult {
  canvas: HTMLCanvasElement
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  qualityScore: number
  processingTime: number
  appliedOptimizations: string[]
  metrics: {
    psnr: number                       // 峰值信噪比
    ssim: number                       // 结构相似性
    colorCount: number
    averageBrightness: number
    contrast: number
    sharpness: number
  }
}

// 默认优化配置
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  mode: OptimizationMode.BALANCED,
  targetQuality: 0.8,
  compression: {
    algorithm: CompressionAlgorithm.ADAPTIVE,
    level: 0.7,
    preserveDetails: true
  },
  colorOptimization: {
    mode: ColorOptimization.COLOR_QUANTIZATION,
    maxColors: 256,
    ditherStrength: 0.3,
    preserveGradients: true
  },
  sharpening: {
    algorithm: SharpeningAlgorithm.UNSHARP_MASK,
    strength: 0.5,
    radius: 1.0,
    threshold: 10
  },
  noiseReduction: {
    algorithm: NoiseReductionAlgorithm.GAUSSIAN_BLUR,
    strength: 0.3,
    preserveEdges: true
  },
  advanced: {
    gammaCorrection: 1.0,
    contrastEnhancement: 0.1,
    saturationAdjustment: 1.0,
    brightnessAdjustment: 0.0
  }
}

// 预设优化配置
export const OPTIMIZATION_PRESETS: Record<string, OptimizationConfig> = {
  WEB_OPTIMIZED: {
    mode: OptimizationMode.SIZE_FIRST,
    targetQuality: 0.7,
    targetFileSize: 500, // 500KB
    compression: {
      algorithm: CompressionAlgorithm.SMART,
      level: 0.8,
      preserveDetails: false
    },
    colorOptimization: {
      mode: ColorOptimization.PALETTE_REDUCTION,
      maxColors: 128,
      ditherStrength: 0.5,
      preserveGradients: false
    },
    sharpening: {
      algorithm: SharpeningAlgorithm.NONE,
      strength: 0,
      radius: 0,
      threshold: 0
    },
    noiseReduction: {
      algorithm: NoiseReductionAlgorithm.GAUSSIAN_BLUR,
      strength: 0.4,
      preserveEdges: false
    },
    advanced: {
      gammaCorrection: 1.0,
      contrastEnhancement: 0.2,
      saturationAdjustment: 1.1,
      brightnessAdjustment: 0.05
    }
  },
  PRINT_QUALITY: {
    mode: OptimizationMode.QUALITY_FIRST,
    targetQuality: 0.95,
    compression: {
      algorithm: CompressionAlgorithm.LOSSLESS,
      level: 0.3,
      preserveDetails: true
    },
    colorOptimization: {
      mode: ColorOptimization.NONE,
      preserveGradients: true
    },
    sharpening: {
      algorithm: SharpeningAlgorithm.UNSHARP_MASK,
      strength: 0.7,
      radius: 1.5,
      threshold: 5
    },
    noiseReduction: {
      algorithm: NoiseReductionAlgorithm.BILATERAL_FILTER,
      strength: 0.2,
      preserveEdges: true
    },
    advanced: {
      gammaCorrection: 1.0,
      contrastEnhancement: 0.05,
      saturationAdjustment: 1.0,
      brightnessAdjustment: 0.0
    }
  },
  SOCIAL_MEDIA: {
    mode: OptimizationMode.BALANCED,
    targetQuality: 0.75,
    targetFileSize: 1024, // 1MB
    compression: {
      algorithm: CompressionAlgorithm.ADAPTIVE,
      level: 0.6,
      preserveDetails: true
    },
    colorOptimization: {
      mode: ColorOptimization.COLOR_QUANTIZATION,
      maxColors: 200,
      ditherStrength: 0.2,
      preserveGradients: true
    },
    sharpening: {
      algorithm: SharpeningAlgorithm.UNSHARP_MASK,
      strength: 0.4,
      radius: 0.8,
      threshold: 8
    },
    noiseReduction: {
      algorithm: NoiseReductionAlgorithm.MEDIAN_FILTER,
      strength: 0.3,
      preserveEdges: true
    },
    advanced: {
      gammaCorrection: 1.0,
      contrastEnhancement: 0.15,
      saturationAdjustment: 1.05,
      brightnessAdjustment: 0.02
    }
  }
}

/**
 * 图像质量优化器类
 */
export class ImageQualityOptimizer {
  private static instance: ImageQualityOptimizer

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ImageQualityOptimizer {
    if (!ImageQualityOptimizer.instance) {
      ImageQualityOptimizer.instance = new ImageQualityOptimizer()
    }
    return ImageQualityOptimizer.instance
  }

  /**
   * 优化图像质量
   */
  public async optimizeImage(
    sourceCanvas: HTMLCanvasElement,
    config: Partial<OptimizationConfig> = {}
  ): Promise<OptimizationResult> {
    const startTime = performance.now()
    const fullConfig = this.mergeConfig(config)
    const appliedOptimizations: string[] = []

    // 创建工作Canvas
    const workCanvas = this.createWorkCanvas(sourceCanvas)
    const workCtx = workCanvas.getContext('2d')!

    // 获取原始图像数据
    const originalImageData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height)
    const originalSize = this.estimateImageSize(originalImageData)

    // 应用高级调整
    if (this.shouldApplyAdvancedAdjustments(fullConfig.advanced)) {
      await this.applyAdvancedAdjustments(workCtx, workCanvas, fullConfig.advanced)
      appliedOptimizations.push('高级调整')
    }

    // 应用降噪
    if (fullConfig.noiseReduction.algorithm !== NoiseReductionAlgorithm.NONE) {
      await this.applyNoiseReduction(workCtx, workCanvas, fullConfig.noiseReduction)
      appliedOptimizations.push('降噪处理')
    }

    // 应用锐化
    if (fullConfig.sharpening.algorithm !== SharpeningAlgorithm.NONE) {
      await this.applySharpening(workCtx, workCanvas, fullConfig.sharpening)
      appliedOptimizations.push('锐化处理')
    }

    // 应用颜色优化
    if (fullConfig.colorOptimization.mode !== ColorOptimization.NONE) {
      await this.applyColorOptimization(workCtx, workCanvas, fullConfig.colorOptimization)
      appliedOptimizations.push('颜色优化')
    }

    // 应用压缩
    if (fullConfig.compression.algorithm !== CompressionAlgorithm.NONE) {
      await this.applyCompression(workCtx, workCanvas, fullConfig.compression)
      appliedOptimizations.push('智能压缩')
    }

    // 计算优化后的指标
    const optimizedImageData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height)
    const optimizedSize = this.estimateImageSize(optimizedImageData)
    const metrics = this.calculateMetrics(originalImageData, optimizedImageData)
    const qualityScore = this.calculateQualityScore(metrics, fullConfig)

    const processingTime = performance.now() - startTime

    return {
      canvas: workCanvas,
      originalSize,
      optimizedSize,
      compressionRatio: originalSize / optimizedSize,
      qualityScore,
      processingTime,
      appliedOptimizations,
      metrics
    }
  }

  /**
   * 应用高级调整
   */
  private async applyAdvancedAdjustments(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: OptimizationConfig['advanced']
  ): Promise<void> {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // 伽马校正
      if (config.gammaCorrection !== 1.0) {
        r = Math.pow(r / 255, 1 / config.gammaCorrection) * 255
        g = Math.pow(g / 255, 1 / config.gammaCorrection) * 255
        b = Math.pow(b / 255, 1 / config.gammaCorrection) * 255
      }

      // 亮度调整
      if (config.brightnessAdjustment !== 0) {
        const brightness = config.brightnessAdjustment * 255
        r = Math.max(0, Math.min(255, r + brightness))
        g = Math.max(0, Math.min(255, g + brightness))
        b = Math.max(0, Math.min(255, b + brightness))
      }

      // 对比度增强
      if (config.contrastEnhancement > 0) {
        const factor = (259 * (config.contrastEnhancement * 255 + 255)) / (255 * (259 - config.contrastEnhancement * 255))
        r = Math.max(0, Math.min(255, factor * (r - 128) + 128))
        g = Math.max(0, Math.min(255, factor * (g - 128) + 128))
        b = Math.max(0, Math.min(255, factor * (b - 128) + 128))
      }

      // 饱和度调整
      if (config.saturationAdjustment !== 1.0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        r = Math.max(0, Math.min(255, gray + config.saturationAdjustment * (r - gray)))
        g = Math.max(0, Math.min(255, gray + config.saturationAdjustment * (g - gray)))
        b = Math.max(0, Math.min(255, gray + config.saturationAdjustment * (b - gray)))
      }

      data[i] = Math.round(r)
      data[i + 1] = Math.round(g)
      data[i + 2] = Math.round(b)
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 应用降噪处理
   */
  private async applyNoiseReduction(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: OptimizationConfig['noiseReduction']
  ): Promise<void> {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    switch (config.algorithm) {
      case NoiseReductionAlgorithm.GAUSSIAN_BLUR:
        this.applyGaussianBlur(imageData, config.strength)
        break
      case NoiseReductionAlgorithm.MEDIAN_FILTER:
        this.applyMedianFilter(imageData, config.strength)
        break
      case NoiseReductionAlgorithm.BILATERAL_FILTER:
        this.applyBilateralFilter(imageData, config.strength, config.preserveEdges)
        break
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 应用锐化处理
   */
  private async applySharpening(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: OptimizationConfig['sharpening']
  ): Promise<void> {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    switch (config.algorithm) {
      case SharpeningAlgorithm.UNSHARP_MASK:
        this.applyUnsharpMask(imageData, config.strength, config.radius, config.threshold)
        break
      case SharpeningAlgorithm.LAPLACIAN:
        this.applyLaplacianSharpening(imageData, config.strength)
        break
      case SharpeningAlgorithm.HIGH_PASS:
        this.applyHighPassSharpening(imageData, config.strength, config.radius)
        break
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 应用颜色优化
   */
  private async applyColorOptimization(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: OptimizationConfig['colorOptimization']
  ): Promise<void> {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    switch (config.mode) {
      case ColorOptimization.PALETTE_REDUCTION:
        this.applyPaletteReduction(imageData, config.maxColors || 256)
        break
      case ColorOptimization.COLOR_QUANTIZATION:
        this.applyColorQuantization(imageData, config.maxColors || 256)
        break
      case ColorOptimization.DITHERING:
        this.applyDithering(imageData, config.ditherStrength || 0.5)
        break
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 应用压缩
   */
  private async applyCompression(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: OptimizationConfig['compression']
  ): Promise<void> {
    // 压缩主要通过调整图像数据实现
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    switch (config.algorithm) {
      case CompressionAlgorithm.ADAPTIVE:
        this.applyAdaptiveCompression(imageData, config.level, config.preserveDetails)
        break
      case CompressionAlgorithm.SMART:
        this.applySmartCompression(imageData, config.level)
        break
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 应用高斯模糊
   */
  private applyGaussianBlur(imageData: ImageData, strength: number): void {
    // 简化的高斯模糊实现
    const { width, height, data } = imageData
    const newData = new Uint8ClampedArray(data)
    const radius = Math.round(strength * 3)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let totalR = 0, totalG = 0, totalB = 0, totalA = 0, count = 0

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = Math.max(0, Math.min(height - 1, y + dy))
            const nx = Math.max(0, Math.min(width - 1, x + dx))
            const index = (ny * width + nx) * 4

            totalR += data[index]
            totalG += data[index + 1]
            totalB += data[index + 2]
            totalA += data[index + 3]
            count++
          }
        }

        const index = (y * width + x) * 4
        newData[index] = totalR / count
        newData[index + 1] = totalG / count
        newData[index + 2] = totalB / count
        newData[index + 3] = totalA / count
      }
    }

    data.set(newData)
  }

  /**
   * 应用中值滤波
   */
  private applyMedianFilter(imageData: ImageData, strength: number): void {
    // 简化的中值滤波实现
    const { width, height, data } = imageData
    const newData = new Uint8ClampedArray(data)
    const radius = Math.round(strength * 2)

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const rValues: number[] = []
        const gValues: number[] = []
        const bValues: number[] = []

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const index = ((y + dy) * width + (x + dx)) * 4
            rValues.push(data[index])
            gValues.push(data[index + 1])
            bValues.push(data[index + 2])
          }
        }

        rValues.sort((a, b) => a - b)
        gValues.sort((a, b) => a - b)
        bValues.sort((a, b) => a - b)

        const medianIndex = Math.floor(rValues.length / 2)
        const index = (y * width + x) * 4

        newData[index] = rValues[medianIndex]
        newData[index + 1] = gValues[medianIndex]
        newData[index + 2] = bValues[medianIndex]
      }
    }

    data.set(newData)
  }

  /**
   * 应用双边滤波
   */
  private applyBilateralFilter(imageData: ImageData, strength: number, preserveEdges: boolean): void {
    // 简化的双边滤波实现
    if (preserveEdges) {
      this.applyMedianFilter(imageData, strength * 0.7)
    } else {
      this.applyGaussianBlur(imageData, strength)
    }
  }

  /**
   * 应用反锐化遮罩
   */
  private applyUnsharpMask(imageData: ImageData, strength: number, radius: number, threshold: number): void {
    // 简化的反锐化遮罩实现
    const { width, height, data } = imageData
    const blurredData = new Uint8ClampedArray(data)
    
    // 先应用高斯模糊
    const tempImageData = { width, height, data: blurredData }
    this.applyGaussianBlur(tempImageData as ImageData, radius / 3)

    // 应用反锐化遮罩
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const original = data[i + c]
        const blurred = blurredData[i + c]
        const difference = original - blurred

        if (Math.abs(difference) > threshold) {
          const sharpened = original + strength * difference
          data[i + c] = Math.max(0, Math.min(255, sharpened))
        }
      }
    }
  }

  /**
   * 应用拉普拉斯锐化
   */
  private applyLaplacianSharpening(imageData: ImageData, strength: number): void {
    // 简化的拉普拉斯锐化实现
    const { width, height, data } = imageData
    const newData = new Uint8ClampedArray(data)
    
    // 拉普拉斯核
    const kernel = [0, -1, 0, -1, 4, -1, 0, -1, 0]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const index = ((y + ky) * width + (x + kx)) * 4 + c
              sum += data[index] * kernel[(ky + 1) * 3 + (kx + 1)]
            }
          }
          
          const index = (y * width + x) * 4 + c
          const sharpened = data[index] + strength * sum
          newData[index] = Math.max(0, Math.min(255, sharpened))
        }
      }
    }

    data.set(newData)
  }

  /**
   * 应用高通滤波锐化
   */
  private applyHighPassSharpening(imageData: ImageData, strength: number, radius: number): void {
    // 简化实现，使用反锐化遮罩
    this.applyUnsharpMask(imageData, strength, radius, 0)
  }

  /**
   * 应用调色板缩减
   */
  private applyPaletteReduction(imageData: ImageData, maxColors: number): void {
    // 简化的调色板缩减实现
    const { data } = imageData
    const colorStep = Math.ceil(256 / Math.cbrt(maxColors))

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / colorStep) * colorStep
      data[i + 1] = Math.round(data[i + 1] / colorStep) * colorStep
      data[i + 2] = Math.round(data[i + 2] / colorStep) * colorStep
    }
  }

  /**
   * 应用颜色量化
   */
  private applyColorQuantization(imageData: ImageData, maxColors: number): void {
    // 简化的颜色量化实现
    this.applyPaletteReduction(imageData, maxColors)
  }

  /**
   * 应用抖动处理
   */
  private applyDithering(imageData: ImageData, strength: number): void {
    // 简化的抖动实现
    const { width, height, data } = imageData

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4
        const noise = (Math.random() - 0.5) * strength * 32

        for (let c = 0; c < 3; c++) {
          data[index + c] = Math.max(0, Math.min(255, data[index + c] + noise))
        }
      }
    }
  }

  /**
   * 应用自适应压缩
   */
  private applyAdaptiveCompression(imageData: ImageData, level: number, preserveDetails: boolean): void {
    // 简化的自适应压缩实现
    if (preserveDetails) {
      this.applyGaussianBlur(imageData, level * 0.3)
    } else {
      this.applyGaussianBlur(imageData, level * 0.5)
    }
  }

  /**
   * 应用智能压缩
   */
  private applySmartCompression(imageData: ImageData, level: number): void {
    // 智能压缩结合多种技术
    this.applyColorQuantization(imageData, Math.round(256 * (1 - level * 0.5)))
    this.applyGaussianBlur(imageData, level * 0.2)
  }

  /**
   * 计算图像指标
   */
  private calculateMetrics(original: ImageData, optimized: ImageData): OptimizationResult['metrics'] {
    const psnr = this.calculatePSNR(original, optimized)
    const ssim = this.calculateSSIM(original, optimized)
    const colorCount = this.countUniqueColors(optimized)
    const averageBrightness = this.calculateAverageBrightness(optimized)
    const contrast = this.calculateContrast(optimized)
    const sharpness = this.calculateSharpness(optimized)

    return {
      psnr,
      ssim,
      colorCount,
      averageBrightness,
      contrast,
      sharpness
    }
  }

  /**
   * 计算PSNR
   */
  private calculatePSNR(original: ImageData, optimized: ImageData): number {
    let mse = 0
    const data1 = original.data
    const data2 = optimized.data

    for (let i = 0; i < data1.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const diff = data1[i + c] - data2[i + c]
        mse += diff * diff
      }
    }

    mse /= (data1.length / 4) * 3
    return mse === 0 ? Infinity : 20 * Math.log10(255 / Math.sqrt(mse))
  }

  /**
   * 计算SSIM（简化版）
   */
  private calculateSSIM(original: ImageData, optimized: ImageData): number {
    // 简化的SSIM计算
    const psnr = this.calculatePSNR(original, optimized)
    return Math.min(1, psnr / 40) // 简化映射
  }

  /**
   * 计算唯一颜色数量
   */
  private countUniqueColors(imageData: ImageData): number {
    const colors = new Set<string>()
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const color = `${data[i]},${data[i + 1]},${data[i + 2]}`
      colors.add(color)
    }

    return colors.size
  }

  /**
   * 计算平均亮度
   */
  private calculateAverageBrightness(imageData: ImageData): number {
    let totalBrightness = 0
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
      totalBrightness += brightness
    }

    return totalBrightness / (data.length / 4)
  }

  /**
   * 计算对比度
   */
  private calculateContrast(imageData: ImageData): number {
    const data = imageData.data
    let min = 255, max = 0

    for (let i = 0; i < data.length; i += 4) {
      const brightness = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      min = Math.min(min, brightness)
      max = Math.max(max, brightness)
    }

    return (max - min) / 255
  }

  /**
   * 计算锐度
   */
  private calculateSharpness(imageData: ImageData): number {
    // 简化的锐度计算
    const { width, height, data } = imageData
    let totalVariation = 0
    let count = 0

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = (y * width + x) * 4
        const rightIndex = (y * width + x + 1) * 4
        const bottomIndex = ((y + 1) * width + x) * 4

        for (let c = 0; c < 3; c++) {
          const horizontalDiff = Math.abs(data[index + c] - data[rightIndex + c])
          const verticalDiff = Math.abs(data[index + c] - data[bottomIndex + c])
          totalVariation += horizontalDiff + verticalDiff
          count += 2
        }
      }
    }

    return totalVariation / (count * 255)
  }

  /**
   * 计算质量分数
   */
  private calculateQualityScore(metrics: OptimizationResult['metrics'], config: OptimizationConfig): number {
    let score = 0.5

    // PSNR贡献
    if (metrics.psnr > 30) score += 0.2
    else if (metrics.psnr > 20) score += 0.1

    // SSIM贡献
    score += metrics.ssim * 0.2

    // 锐度贡献
    score += Math.min(0.1, metrics.sharpness * 0.5)

    // 对比度贡献
    score += Math.min(0.1, metrics.contrast * 0.3)

    return Math.min(1, score)
  }

  /**
   * 估算图像大小
   */
  private estimateImageSize(imageData: ImageData): number {
    // 简化的大小估算
    return imageData.data.length * 0.7 // 假设70%的压缩率
  }

  /**
   * 创建工作Canvas
   */
  private createWorkCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = sourceCanvas.width
    canvas.height = sourceCanvas.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(sourceCanvas, 0, 0)
    return canvas
  }

  /**
   * 合并配置
   */
  private mergeConfig(config: Partial<OptimizationConfig>): OptimizationConfig {
    return {
      ...DEFAULT_OPTIMIZATION_CONFIG,
      ...config,
      compression: { ...DEFAULT_OPTIMIZATION_CONFIG.compression, ...config.compression },
      colorOptimization: { ...DEFAULT_OPTIMIZATION_CONFIG.colorOptimization, ...config.colorOptimization },
      sharpening: { ...DEFAULT_OPTIMIZATION_CONFIG.sharpening, ...config.sharpening },
      noiseReduction: { ...DEFAULT_OPTIMIZATION_CONFIG.noiseReduction, ...config.noiseReduction },
      advanced: { ...DEFAULT_OPTIMIZATION_CONFIG.advanced, ...config.advanced }
    }
  }

  /**
   * 判断是否应该应用高级调整
   */
  private shouldApplyAdvancedAdjustments(config: OptimizationConfig['advanced']): boolean {
    return config.gammaCorrection !== 1.0 ||
           config.contrastEnhancement > 0 ||
           config.saturationAdjustment !== 1.0 ||
           config.brightnessAdjustment !== 0
  }

  /**
   * 获取预设配置
   */
  public getPresetConfig(presetName: keyof typeof OPTIMIZATION_PRESETS): OptimizationConfig {
    return { ...OPTIMIZATION_PRESETS[presetName] }
  }
}

// 导出单例实例
export const imageQualityOptimizer = ImageQualityOptimizer.getInstance()
