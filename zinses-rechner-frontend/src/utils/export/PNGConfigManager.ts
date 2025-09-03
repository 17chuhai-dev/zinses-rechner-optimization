/**
 * PNG导出配置管理器
 * 专门管理PNG高分辨率导出的配置和预设
 */

import { RenderQuality, AntiAliasMode, ColorSpace, type PNGRenderConfig } from './PNGRenderEngine'

// PNG导出用途枚举
export enum PNGExportPurpose {
  WEB_DISPLAY = 'web_display',      // 网页显示
  SOCIAL_MEDIA = 'social_media',    // 社交媒体
  PRINT_SMALL = 'print_small',      // 小尺寸打印
  PRINT_LARGE = 'print_large',      // 大尺寸打印
  PRESENTATION = 'presentation',     // 演示文稿
  MOBILE_APP = 'mobile_app',        // 移动应用
  RETINA_DISPLAY = 'retina_display', // 高分辨率显示
  THUMBNAIL = 'thumbnail',          // 缩略图
  ICON = 'icon',                   // 图标
  CUSTOM = 'custom'                // 自定义
}

// PNG预设配置
export const PNG_PRESETS: Record<PNGExportPurpose, Partial<PNGRenderConfig>> = {
  [PNGExportPurpose.WEB_DISPLAY]: {
    width: 800,
    height: 600,
    dpi: 96,
    pixelRatio: 1,
    quality: RenderQuality.STANDARD,
    antiAlias: AntiAliasMode.STANDARD,
    colorSpace: ColorSpace.SRGB,
    transparent: false,
    backgroundColor: '#ffffff'
  },
  
  [PNGExportPurpose.SOCIAL_MEDIA]: {
    width: 1200,
    height: 630,
    dpi: 72,
    pixelRatio: 1,
    quality: RenderQuality.HIGH,
    antiAlias: AntiAliasMode.STANDARD,
    colorSpace: ColorSpace.SRGB,
    transparent: false,
    backgroundColor: '#ffffff'
  },
  
  [PNGExportPurpose.PRINT_SMALL]: {
    width: 2400,
    height: 1800,
    dpi: 300,
    pixelRatio: 1,
    quality: RenderQuality.HIGH,
    antiAlias: AntiAliasMode.ADVANCED,
    colorSpace: ColorSpace.ADOBE_RGB,
    transparent: false,
    backgroundColor: '#ffffff'
  },
  
  [PNGExportPurpose.PRINT_LARGE]: {
    width: 4800,
    height: 3600,
    dpi: 300,
    pixelRatio: 1,
    quality: RenderQuality.ULTRA,
    antiAlias: AntiAliasMode.ADVANCED,
    colorSpace: ColorSpace.ADOBE_RGB,
    transparent: false,
    backgroundColor: '#ffffff'
  },
  
  [PNGExportPurpose.PRESENTATION]: {
    width: 1920,
    height: 1080,
    dpi: 96,
    pixelRatio: 1,
    quality: RenderQuality.HIGH,
    antiAlias: AntiAliasMode.STANDARD,
    colorSpace: ColorSpace.SRGB,
    transparent: false,
    backgroundColor: '#ffffff'
  },
  
  [PNGExportPurpose.MOBILE_APP]: {
    width: 750,
    height: 1334,
    dpi: 326,
    pixelRatio: 2,
    quality: RenderQuality.HIGH,
    antiAlias: AntiAliasMode.SUBPIXEL,
    colorSpace: ColorSpace.DISPLAY_P3,
    transparent: true
  },
  
  [PNGExportPurpose.RETINA_DISPLAY]: {
    width: 1600,
    height: 1200,
    dpi: 192,
    pixelRatio: 2,
    quality: RenderQuality.HIGH,
    antiAlias: AntiAliasMode.SUBPIXEL,
    colorSpace: ColorSpace.DISPLAY_P3,
    transparent: false,
    backgroundColor: '#ffffff'
  },
  
  [PNGExportPurpose.THUMBNAIL]: {
    width: 300,
    height: 200,
    dpi: 72,
    pixelRatio: 1,
    quality: RenderQuality.STANDARD,
    antiAlias: AntiAliasMode.STANDARD,
    colorSpace: ColorSpace.SRGB,
    transparent: false,
    backgroundColor: '#ffffff'
  },
  
  [PNGExportPurpose.ICON]: {
    width: 512,
    height: 512,
    dpi: 72,
    pixelRatio: 1,
    quality: RenderQuality.HIGH,
    antiAlias: AntiAliasMode.ADVANCED,
    colorSpace: ColorSpace.SRGB,
    transparent: true
  },
  
  [PNGExportPurpose.CUSTOM]: {
    width: 800,
    height: 600,
    dpi: 96,
    pixelRatio: 1,
    quality: RenderQuality.STANDARD,
    antiAlias: AntiAliasMode.STANDARD,
    colorSpace: ColorSpace.SRGB,
    transparent: false
  }
}

// DPI预设选项
export const DPI_PRESETS = {
  WEB: 72,
  STANDARD: 96,
  PRINT_DRAFT: 150,
  PRINT_QUALITY: 300,
  PRINT_HIGH: 600
} as const

// 分辨率预设选项
export const RESOLUTION_PRESETS = {
  // 网页常用尺寸
  WEB_SMALL: { width: 640, height: 480 },
  WEB_MEDIUM: { width: 800, height: 600 },
  WEB_LARGE: { width: 1024, height: 768 },
  WEB_HD: { width: 1280, height: 720 },
  WEB_FHD: { width: 1920, height: 1080 },
  
  // 社交媒体尺寸
  FACEBOOK_POST: { width: 1200, height: 630 },
  TWITTER_POST: { width: 1024, height: 512 },
  INSTAGRAM_POST: { width: 1080, height: 1080 },
  LINKEDIN_POST: { width: 1200, height: 627 },
  
  // 打印尺寸 (300 DPI)
  PRINT_A4: { width: 2480, height: 3508 },
  PRINT_A3: { width: 3508, height: 4961 },
  PRINT_LETTER: { width: 2550, height: 3300 },
  
  // 移动设备尺寸
  MOBILE_PORTRAIT: { width: 750, height: 1334 },
  MOBILE_LANDSCAPE: { width: 1334, height: 750 },
  TABLET_PORTRAIT: { width: 1536, height: 2048 },
  TABLET_LANDSCAPE: { width: 2048, height: 1536 }
} as const

/**
 * PNG配置管理器类
 */
export class PNGConfigManager {
  private static instance: PNGConfigManager
  private storageKey = 'png_export_config'

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): PNGConfigManager {
    if (!PNGConfigManager.instance) {
      PNGConfigManager.instance = new PNGConfigManager()
    }
    return PNGConfigManager.instance
  }

  /**
   * 根据用途获取推荐配置
   */
  public getConfigForPurpose(purpose: PNGExportPurpose): PNGRenderConfig {
    const preset = PNG_PRESETS[purpose]
    return this.createCompleteConfig(preset)
  }

  /**
   * 根据DPI和尺寸创建配置
   */
  public createConfigByDPI(
    width: number,
    height: number,
    dpi: number,
    options: Partial<PNGRenderConfig> = {}
  ): PNGRenderConfig {
    const baseConfig: Partial<PNGRenderConfig> = {
      width,
      height,
      dpi,
      pixelRatio: this.calculatePixelRatio(dpi),
      quality: this.getQualityForDPI(dpi),
      antiAlias: this.getAntiAliasForDPI(dpi),
      ...options
    }
    
    return this.createCompleteConfig(baseConfig)
  }

  /**
   * 优化配置以适应设备限制
   */
  public optimizeConfigForDevice(config: PNGRenderConfig): PNGRenderConfig {
    const maxResolution = this.getMaxSupportedResolution()
    const optimized = { ...config }

    // 限制最大分辨率
    if (optimized.width > maxResolution.width) {
      const ratio = maxResolution.width / optimized.width
      optimized.width = maxResolution.width
      optimized.height = Math.round(optimized.height * ratio)
    }

    if (optimized.height > maxResolution.height) {
      const ratio = maxResolution.height / optimized.height
      optimized.height = maxResolution.height
      optimized.width = Math.round(optimized.width * ratio)
    }

    // 根据设备性能调整质量
    const deviceMemory = this.getDeviceMemory()
    if (deviceMemory < 4) { // 低内存设备
      if (optimized.quality === RenderQuality.ULTRA) {
        optimized.quality = RenderQuality.HIGH
      }
      if (optimized.antiAlias === AntiAliasMode.ADVANCED) {
        optimized.antiAlias = AntiAliasMode.STANDARD
      }
    }

    return optimized
  }

  /**
   * 验证PNG配置
   */
  public validateConfig(config: Partial<PNGRenderConfig>): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查必需字段
    if (!config.width || config.width <= 0) {
      errors.push('宽度必须大于0')
    }
    if (!config.height || config.height <= 0) {
      errors.push('高度必须大于0')
    }
    if (!config.dpi || config.dpi < 72 || config.dpi > 600) {
      errors.push('DPI必须在72-600之间')
    }

    // 检查分辨率限制
    if (config.width && config.height) {
      const totalPixels = config.width * config.height
      const maxPixels = 16777216 // 4096x4096
      
      if (totalPixels > maxPixels) {
        errors.push('图像分辨率过大，可能导致渲染失败')
      } else if (totalPixels > maxPixels / 2) {
        warnings.push('图像分辨率较大，可能影响性能')
      }
    }

    // 检查内存使用
    if (config.width && config.height) {
      const estimatedMemory = config.width * config.height * 4 // RGBA
      const maxMemory = 100 * 1024 * 1024 // 100MB
      
      if (estimatedMemory > maxMemory) {
        warnings.push('预计内存使用量较大，可能影响性能')
      }
    }

    // 检查DPI和像素比的匹配
    if (config.dpi && config.pixelRatio) {
      const expectedPixelRatio = this.calculatePixelRatio(config.dpi)
      if (Math.abs(config.pixelRatio - expectedPixelRatio) > 0.1) {
        warnings.push('像素比与DPI不匹配，可能影响显示效果')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 估算文件大小
   */
  public estimateFileSize(config: PNGRenderConfig): {
    uncompressed: number
    estimated: number
    unit: string
  } {
    const totalPixels = config.width * config.height
    const uncompressed = totalPixels * 4 // RGBA

    // PNG压缩率估算（基于质量和内容复杂度）
    let compressionRatio = 0.3 // 默认30%压缩率
    
    switch (config.quality) {
      case RenderQuality.DRAFT:
        compressionRatio = 0.2
        break
      case RenderQuality.STANDARD:
        compressionRatio = 0.3
        break
      case RenderQuality.HIGH:
        compressionRatio = 0.4
        break
      case RenderQuality.ULTRA:
        compressionRatio = 0.5
        break
    }

    const estimated = Math.round(uncompressed * compressionRatio)
    
    return {
      uncompressed,
      estimated,
      unit: this.formatFileSize(estimated)
    }
  }

  /**
   * 保存用户配置
   */
  public saveUserConfig(config: PNGRenderConfig): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(config))
    } catch (error) {
      console.warn('无法保存PNG配置:', error)
    }
  }

  /**
   * 加载用户配置
   */
  public loadUserConfig(): PNGRenderConfig | null {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const config = JSON.parse(stored)
        return this.createCompleteConfig(config)
      }
    } catch (error) {
      console.warn('无法加载PNG配置:', error)
    }
    return null
  }

  /**
   * 获取所有预设用途
   */
  public getAllPurposes(): Array<{
    key: PNGExportPurpose
    name: string
    description: string
    config: PNGRenderConfig
  }> {
    return [
      {
        key: PNGExportPurpose.WEB_DISPLAY,
        name: '网页显示',
        description: '适合网页展示的标准分辨率',
        config: this.getConfigForPurpose(PNGExportPurpose.WEB_DISPLAY)
      },
      {
        key: PNGExportPurpose.SOCIAL_MEDIA,
        name: '社交媒体',
        description: '适合社交媒体分享的尺寸',
        config: this.getConfigForPurpose(PNGExportPurpose.SOCIAL_MEDIA)
      },
      {
        key: PNGExportPurpose.PRINT_SMALL,
        name: '小尺寸打印',
        description: '适合A4等小尺寸打印',
        config: this.getConfigForPurpose(PNGExportPurpose.PRINT_SMALL)
      },
      {
        key: PNGExportPurpose.PRINT_LARGE,
        name: '大尺寸打印',
        description: '适合海报等大尺寸打印',
        config: this.getConfigForPurpose(PNGExportPurpose.PRINT_LARGE)
      },
      {
        key: PNGExportPurpose.PRESENTATION,
        name: '演示文稿',
        description: '适合PPT等演示文稿',
        config: this.getConfigForPurpose(PNGExportPurpose.PRESENTATION)
      },
      {
        key: PNGExportPurpose.RETINA_DISPLAY,
        name: '高分辨率显示',
        description: '适合Retina等高分辨率屏幕',
        config: this.getConfigForPurpose(PNGExportPurpose.RETINA_DISPLAY)
      }
    ]
  }

  /**
   * 创建完整配置
   */
  private createCompleteConfig(partial: Partial<PNGRenderConfig>): PNGRenderConfig {
    const defaults: PNGRenderConfig = {
      width: 800,
      height: 600,
      dpi: 96,
      pixelRatio: 1,
      quality: RenderQuality.STANDARD,
      antiAlias: AntiAliasMode.STANDARD,
      colorSpace: ColorSpace.SRGB,
      transparent: false,
      backgroundColor: '#ffffff',
      preserveDrawingBuffer: true,
      premultipliedAlpha: true,
      powerPreference: 'default'
    }

    return { ...defaults, ...partial }
  }

  /**
   * 根据DPI计算像素比
   */
  private calculatePixelRatio(dpi: number): number {
    const baseDPI = 96
    return Math.max(1, Math.round((dpi / baseDPI) * 10) / 10)
  }

  /**
   * 根据DPI获取推荐质量
   */
  private getQualityForDPI(dpi: number): RenderQuality {
    if (dpi >= 300) return RenderQuality.ULTRA
    if (dpi >= 150) return RenderQuality.HIGH
    if (dpi >= 96) return RenderQuality.STANDARD
    return RenderQuality.DRAFT
  }

  /**
   * 根据DPI获取推荐抗锯齿模式
   */
  private getAntiAliasForDPI(dpi: number): AntiAliasMode {
    if (dpi >= 300) return AntiAliasMode.ADVANCED
    if (dpi >= 150) return AntiAliasMode.SUBPIXEL
    return AntiAliasMode.STANDARD
  }

  /**
   * 获取设备最大支持分辨率
   */
  private getMaxSupportedResolution(): { width: number; height: number } {
    // 简化实现，实际应该检测设备能力
    return { width: 8192, height: 8192 }
  }

  /**
   * 获取设备内存信息
   */
  private getDeviceMemory(): number {
    // @ts-ignore
    return navigator.deviceMemory || 4 // 默认4GB
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
}

// 导出单例实例
export const pngConfigManager = PNGConfigManager.getInstance()
