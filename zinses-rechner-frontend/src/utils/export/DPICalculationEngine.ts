/**
 * DPI计算引擎
 * 提供精确的DPI计算、转换和相关参数计算功能
 */

// DPI计算结果接口
export interface DPICalculationResult {
  dpi: number
  pixelWidth: number
  pixelHeight: number
  physicalWidth: number  // 英寸
  physicalHeight: number // 英寸
  pixelRatio: number
  totalPixels: number
  aspectRatio: number
  printSize: {
    width: number
    height: number
    unit: 'in' | 'cm' | 'mm'
  }
}

// 尺寸单位枚举
export enum SizeUnit {
  PIXELS = 'px',
  INCHES = 'in',
  CENTIMETERS = 'cm',
  MILLIMETERS = 'mm',
  POINTS = 'pt',
  PICAS = 'pc'
}

// DPI预设常量
export const DPI_PRESETS = {
  WEB_LOW: 72,      // 网页低分辨率
  WEB_STANDARD: 96, // 网页标准分辨率
  WEB_HIGH: 144,    // 网页高分辨率
  PRINT_DRAFT: 150, // 打印草稿质量
  PRINT_GOOD: 200,  // 打印良好质量
  PRINT_HIGH: 300,  // 打印高质量
  PRINT_ULTRA: 600  // 打印超高质量
} as const

// 标准纸张尺寸（英寸）
export const PAPER_SIZES = {
  A4: { width: 8.27, height: 11.69 },
  A3: { width: 11.69, height: 16.54 },
  A5: { width: 5.83, height: 8.27 },
  LETTER: { width: 8.5, height: 11 },
  LEGAL: { width: 8.5, height: 14 },
  TABLOID: { width: 11, height: 17 },
  BUSINESS_CARD: { width: 3.5, height: 2 },
  POSTER_SMALL: { width: 18, height: 24 },
  POSTER_LARGE: { width: 24, height: 36 }
} as const

// 设备类型DPI范围
export const DEVICE_DPI_RANGES = {
  DESKTOP_MONITOR: { min: 72, max: 144, optimal: 96 },
  LAPTOP_SCREEN: { min: 96, max: 200, optimal: 120 },
  TABLET: { min: 132, max: 264, optimal: 160 },
  SMARTPHONE: { min: 200, max: 500, optimal: 300 },
  PRINT_DEVICE: { min: 150, max: 600, optimal: 300 },
  PROFESSIONAL_PRINT: { min: 300, max: 1200, optimal: 600 }
} as const

/**
 * DPI计算引擎类
 */
export class DPICalculationEngine {
  private static instance: DPICalculationEngine
  private readonly MIN_DPI = 72
  private readonly MAX_DPI = 600
  private readonly BASE_DPI = 96 // 标准屏幕DPI

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): DPICalculationEngine {
    if (!DPICalculationEngine.instance) {
      DPICalculationEngine.instance = new DPICalculationEngine()
    }
    return DPICalculationEngine.instance
  }

  /**
   * 根据像素尺寸和物理尺寸计算DPI
   */
  public calculateDPIFromSize(
    pixelWidth: number,
    pixelHeight: number,
    physicalWidth: number,
    physicalHeight: number,
    unit: SizeUnit = SizeUnit.INCHES
  ): number {
    // 转换物理尺寸为英寸
    const widthInches = this.convertToInches(physicalWidth, unit)
    const heightInches = this.convertToInches(physicalHeight, unit)

    // 计算水平和垂直DPI
    const horizontalDPI = pixelWidth / widthInches
    const verticalDPI = pixelHeight / heightInches

    // 返回平均DPI
    return Math.round((horizontalDPI + verticalDPI) / 2)
  }

  /**
   * 根据DPI和像素尺寸计算物理尺寸
   */
  public calculatePhysicalSize(
    pixelWidth: number,
    pixelHeight: number,
    dpi: number,
    unit: SizeUnit = SizeUnit.INCHES
  ): { width: number; height: number } {
    this.validateDPI(dpi)

    const widthInches = pixelWidth / dpi
    const heightInches = pixelHeight / dpi

    return {
      width: this.convertFromInches(widthInches, unit),
      height: this.convertFromInches(heightInches, unit)
    }
  }

  /**
   * 根据DPI和物理尺寸计算像素尺寸
   */
  public calculatePixelSize(
    physicalWidth: number,
    physicalHeight: number,
    dpi: number,
    unit: SizeUnit = SizeUnit.INCHES
  ): { width: number; height: number } {
    this.validateDPI(dpi)

    const widthInches = this.convertToInches(physicalWidth, unit)
    const heightInches = this.convertToInches(physicalHeight, unit)

    return {
      width: Math.round(widthInches * dpi),
      height: Math.round(heightInches * dpi)
    }
  }

  /**
   * 计算像素比例（相对于标准DPI）
   */
  public calculatePixelRatio(dpi: number): number {
    this.validateDPI(dpi)
    return Math.round((dpi / this.BASE_DPI) * 100) / 100
  }

  /**
   * 完整的DPI计算
   */
  public performFullCalculation(
    pixelWidth: number,
    pixelHeight: number,
    dpi: number
  ): DPICalculationResult {
    this.validateDPI(dpi)
    this.validatePixelSize(pixelWidth, pixelHeight)

    const physicalSize = this.calculatePhysicalSize(pixelWidth, pixelHeight, dpi)
    const pixelRatio = this.calculatePixelRatio(dpi)
    const totalPixels = pixelWidth * pixelHeight
    const aspectRatio = Math.round((pixelWidth / pixelHeight) * 100) / 100

    // 计算不同单位的打印尺寸
    const printSizeCm = this.calculatePhysicalSize(pixelWidth, pixelHeight, dpi, SizeUnit.CENTIMETERS)

    return {
      dpi,
      pixelWidth,
      pixelHeight,
      physicalWidth: physicalSize.width,
      physicalHeight: physicalSize.height,
      pixelRatio,
      totalPixels,
      aspectRatio,
      printSize: {
        width: printSizeCm.width,
        height: printSizeCm.height,
        unit: 'cm'
      }
    }
  }

  /**
   * 根据纸张尺寸和DPI计算像素尺寸
   */
  public calculateForPaperSize(
    paperSize: keyof typeof PAPER_SIZES,
    dpi: number,
    orientation: 'portrait' | 'landscape' = 'portrait'
  ): DPICalculationResult {
    const paper = PAPER_SIZES[paperSize]
    let width = paper.width
    let height = paper.height

    if (orientation === 'landscape') {
      [width, height] = [height, width]
    }

    const pixelSize = this.calculatePixelSize(width, height, dpi)
    return this.performFullCalculation(pixelSize.width, pixelSize.height, dpi)
  }

  /**
   * 获取设备类型的推荐DPI
   */
  public getRecommendedDPI(deviceType: keyof typeof DEVICE_DPI_RANGES): {
    min: number
    max: number
    optimal: number
    range: number[]
  } {
    const range = DEVICE_DPI_RANGES[deviceType]
    const dpiRange: number[] = []

    // 生成DPI范围数组
    for (let dpi = range.min; dpi <= range.max; dpi += 12) {
      dpiRange.push(dpi)
    }

    return {
      ...range,
      range: dpiRange
    }
  }

  /**
   * 验证DPI值是否有效
   */
  public validateDPI(dpi: number): boolean {
    if (dpi < this.MIN_DPI || dpi > this.MAX_DPI) {
      throw new Error(`DPI必须在${this.MIN_DPI}-${this.MAX_DPI}之间，当前值：${dpi}`)
    }
    return true
  }

  /**
   * 验证像素尺寸是否有效
   */
  public validatePixelSize(width: number, height: number): boolean {
    if (width <= 0 || height <= 0) {
      throw new Error(`像素尺寸必须大于0，当前值：${width}x${height}`)
    }
    if (width > 16384 || height > 16384) {
      throw new Error(`像素尺寸过大，最大支持16384x16384，当前值：${width}x${height}`)
    }
    return true
  }

  /**
   * 计算最优DPI（基于用途和约束）
   */
  public calculateOptimalDPI(
    pixelWidth: number,
    pixelHeight: number,
    purpose: 'web' | 'print' | 'mobile' | 'tablet',
    constraints?: {
      maxFileSize?: number // KB
      minQuality?: number  // 0-1
      deviceType?: keyof typeof DEVICE_DPI_RANGES
    }
  ): number {
    let baseDPI: number

    // 根据用途确定基础DPI
    switch (purpose) {
      case 'web':
        baseDPI = DPI_PRESETS.WEB_STANDARD
        break
      case 'print':
        baseDPI = DPI_PRESETS.PRINT_HIGH
        break
      case 'mobile':
        baseDPI = 300
        break
      case 'tablet':
        baseDPI = 160
        break
      default:
        baseDPI = DPI_PRESETS.WEB_STANDARD
    }

    // 应用约束条件
    if (constraints) {
      if (constraints.deviceType) {
        const deviceRange = DEVICE_DPI_RANGES[constraints.deviceType]
        baseDPI = Math.max(deviceRange.min, Math.min(deviceRange.max, baseDPI))
      }

      if (constraints.maxFileSize) {
        // 根据文件大小限制调整DPI
        const estimatedSize = this.estimateFileSize(pixelWidth, pixelHeight, baseDPI)
        if (estimatedSize > constraints.maxFileSize * 1024) {
          const scaleFactor = Math.sqrt((constraints.maxFileSize * 1024) / estimatedSize)
          baseDPI = Math.round(baseDPI * scaleFactor)
        }
      }

      if (constraints.minQuality) {
        const minDPI = this.BASE_DPI * constraints.minQuality
        baseDPI = Math.max(baseDPI, minDPI)
      }
    }

    return Math.max(this.MIN_DPI, Math.min(this.MAX_DPI, baseDPI))
  }

  /**
   * 估算文件大小（基于像素数量和DPI）
   */
  public estimateFileSize(pixelWidth: number, pixelHeight: number, dpi: number): number {
    const totalPixels = pixelWidth * pixelHeight
    const dpiMultiplier = (dpi / this.BASE_DPI) ** 2
    
    // 基础估算：每像素4字节(RGBA) * DPI倍数 * 压缩率(0.3)
    return Math.round(totalPixels * 4 * dpiMultiplier * 0.3)
  }

  /**
   * 转换为英寸
   */
  private convertToInches(value: number, unit: SizeUnit): number {
    switch (unit) {
      case SizeUnit.INCHES:
        return value
      case SizeUnit.CENTIMETERS:
        return value / 2.54
      case SizeUnit.MILLIMETERS:
        return value / 25.4
      case SizeUnit.POINTS:
        return value / 72
      case SizeUnit.PICAS:
        return value / 6
      case SizeUnit.PIXELS:
        return value / this.BASE_DPI
      default:
        return value
    }
  }

  /**
   * 从英寸转换为指定单位
   */
  private convertFromInches(value: number, unit: SizeUnit): number {
    switch (unit) {
      case SizeUnit.INCHES:
        return Math.round(value * 100) / 100
      case SizeUnit.CENTIMETERS:
        return Math.round(value * 2.54 * 100) / 100
      case SizeUnit.MILLIMETERS:
        return Math.round(value * 25.4 * 10) / 10
      case SizeUnit.POINTS:
        return Math.round(value * 72)
      case SizeUnit.PICAS:
        return Math.round(value * 6 * 10) / 10
      case SizeUnit.PIXELS:
        return Math.round(value * this.BASE_DPI)
      default:
        return Math.round(value * 100) / 100
    }
  }

  /**
   * 获取DPI相关信息
   */
  public getDPIInfo(dpi: number): {
    category: string
    description: string
    suitableFor: string[]
    pixelRatio: number
    qualityLevel: 'low' | 'medium' | 'high' | 'ultra'
  } {
    this.validateDPI(dpi)

    let category: string
    let description: string
    let suitableFor: string[]
    let qualityLevel: 'low' | 'medium' | 'high' | 'ultra'

    if (dpi <= 96) {
      category = '网页标准'
      description = '适合网页显示和屏幕查看'
      suitableFor = ['网页', '屏幕显示', '电子邮件']
      qualityLevel = 'low'
    } else if (dpi <= 150) {
      category = '高清显示'
      description = '适合高分辨率屏幕和轻度打印'
      suitableFor = ['高清屏幕', '草稿打印', '演示文稿']
      qualityLevel = 'medium'
    } else if (dpi <= 300) {
      category = '打印质量'
      description = '适合专业打印和出版'
      suitableFor = ['专业打印', '杂志', '宣传册']
      qualityLevel = 'high'
    } else {
      category = '超高质量'
      description = '适合专业印刷和大幅面输出'
      suitableFor = ['专业印刷', '海报', '艺术品复制']
      qualityLevel = 'ultra'
    }

    return {
      category,
      description,
      suitableFor,
      pixelRatio: this.calculatePixelRatio(dpi),
      qualityLevel
    }
  }

  /**
   * 比较不同DPI设置
   */
  public compareDPISettings(
    pixelWidth: number,
    pixelHeight: number,
    dpiList: number[]
  ): Array<DPICalculationResult & { fileSize: number; qualityScore: number }> {
    return dpiList.map(dpi => {
      const result = this.performFullCalculation(pixelWidth, pixelHeight, dpi)
      const fileSize = this.estimateFileSize(pixelWidth, pixelHeight, dpi)
      const qualityScore = Math.min(1, dpi / 300) // 以300 DPI为满分

      return {
        ...result,
        fileSize,
        qualityScore
      }
    })
  }
}

// 导出单例实例
export const dpiCalculationEngine = DPICalculationEngine.getInstance()
