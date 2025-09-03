/**
 * 导出工具类
 * 提供导出相关的辅助功能和工具方法
 */

import { ExportFormat, ExportQuality, ExportConfig } from './ChartExportEngine'

// 文件大小单位
export enum FileSizeUnit {
  BYTES = 'bytes',
  KB = 'KB',
  MB = 'MB',
  GB = 'GB'
}

// 预设导出配置
export const EXPORT_PRESETS = {
  // 社交媒体分享
  SOCIAL_MEDIA: {
    format: ExportFormat.PNG,
    quality: ExportQuality.HIGH,
    width: 1200,
    height: 630,
    backgroundColor: '#ffffff',
    transparent: false
  },
  
  // 打印用途
  PRINT: {
    format: ExportFormat.PDF,
    quality: ExportQuality.ULTRA,
    width: 2480, // A4 300DPI
    height: 3508,
    backgroundColor: '#ffffff',
    includeTitle: true,
    includeData: true
  },
  
  // 网页展示
  WEB_DISPLAY: {
    format: ExportFormat.PNG,
    quality: ExportQuality.MEDIUM,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    transparent: false
  },
  
  // 演示文稿
  PRESENTATION: {
    format: ExportFormat.PNG,
    quality: ExportQuality.HIGH,
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    transparent: false
  },
  
  // 矢量图形
  VECTOR: {
    format: ExportFormat.SVG,
    quality: ExportQuality.HIGH,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    transparent: true
  },
  
  // 缩略图
  THUMBNAIL: {
    format: ExportFormat.JPEG,
    quality: ExportQuality.MEDIUM,
    width: 300,
    height: 200,
    backgroundColor: '#ffffff'
  }
} as const

/**
 * 导出工具类
 */
export class ExportUtils {
  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number, unit?: FileSizeUnit): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    
    if (unit) {
      const unitIndex = sizes.indexOf(unit.toUpperCase())
      if (unitIndex !== -1) {
        const value = bytes / Math.pow(k, unitIndex)
        return `${value.toFixed(2)} ${unit}`
      }
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const value = bytes / Math.pow(k, i)
    
    return `${value.toFixed(2)} ${sizes[i]}`
  }

  /**
   * 验证导出配置
   */
  static validateConfig(config: Partial<ExportConfig>): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查必需字段
    if (!config.format) {
      errors.push('导出格式不能为空')
    }

    // 检查尺寸
    if (config.width && config.width <= 0) {
      errors.push('宽度必须大于0')
    }
    if (config.height && config.height <= 0) {
      errors.push('高度必须大于0')
    }

    // 检查DPI
    if (config.dpi && (config.dpi < 72 || config.dpi > 600)) {
      warnings.push('DPI建议在72-600之间')
    }

    // 检查文件名
    if (config.filename) {
      const invalidChars = /[<>:"/\\|?*]/
      if (invalidChars.test(config.filename)) {
        errors.push('文件名包含无效字符')
      }
    }

    // 格式特定检查
    if (config.format === ExportFormat.JPEG && config.transparent) {
      warnings.push('JPEG格式不支持透明背景')
    }

    // 尺寸警告
    if (config.width && config.height) {
      const totalPixels = config.width * config.height
      if (totalPixels > 16777216) { // 4096x4096
        warnings.push('图像尺寸过大，可能影响性能')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取推荐配置
   */
  static getRecommendedConfig(purpose: keyof typeof EXPORT_PRESETS): ExportConfig {
    const preset = EXPORT_PRESETS[purpose]
    return { ...preset } as ExportConfig
  }

  /**
   * 计算估算文件大小
   */
  static estimateFileSize(config: ExportConfig): number {
    const { width = 800, height = 600, format, quality = ExportQuality.MEDIUM } = config
    const totalPixels = width * height

    // 质量系数
    const qualityFactors = {
      [ExportQuality.LOW]: 0.3,
      [ExportQuality.MEDIUM]: 0.6,
      [ExportQuality.HIGH]: 0.9,
      [ExportQuality.ULTRA]: 1.2
    }

    const qualityFactor = qualityFactors[quality]

    switch (format) {
      case ExportFormat.PNG:
        // PNG通常每像素3-4字节（RGB + Alpha）
        return Math.round(totalPixels * 3.5 * qualityFactor)
      
      case ExportFormat.JPEG:
        // JPEG压缩率较高，每像素约0.5-2字节
        return Math.round(totalPixels * 1.2 * qualityFactor)
      
      case ExportFormat.SVG:
        // SVG大小主要取决于复杂度，估算基础大小
        return Math.round(10000 + totalPixels * 0.1 * qualityFactor)
      
      case ExportFormat.PDF:
        // PDF包含图像数据加上文档结构
        return Math.round(totalPixels * 2 * qualityFactor + 50000)
      
      default:
        return Math.round(totalPixels * 2 * qualityFactor)
    }
  }

  /**
   * 生成唯一文件名
   */
  static generateUniqueFilename(
    baseName: string = 'chart',
    format: ExportFormat,
    includeTimestamp: boolean = true
  ): string {
    let filename = baseName

    if (includeTimestamp) {
      const now = new Date()
      const timestamp = now.toISOString()
        .slice(0, 19)
        .replace(/[:-]/g, '')
        .replace('T', '_')
      filename += `_${timestamp}`
    }

    // 添加随机后缀避免冲突
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    filename += `_${randomSuffix}`

    return `${filename}.${format}`
  }

  /**
   * 检查浏览器支持
   */
  static checkBrowserSupport(): {
    canvas: boolean
    download: boolean
    blob: boolean
    webp: boolean
  } {
    const canvas = !!document.createElement('canvas').getContext
    const download = 'download' in document.createElement('a')
    const blob = typeof Blob !== 'undefined'
    
    // 检查WebP支持
    const webpCanvas = document.createElement('canvas')
    webpCanvas.width = 1
    webpCanvas.height = 1
    const webp = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0

    return { canvas, download, blob, webp }
  }

  /**
   * 获取最佳导出格式建议
   */
  static getBestFormatRecommendation(purpose: string): {
    format: ExportFormat
    reason: string
  } {
    const purposeLower = purpose.toLowerCase()

    if (purposeLower.includes('print') || purposeLower.includes('打印')) {
      return {
        format: ExportFormat.PDF,
        reason: '打印用途建议使用PDF格式，支持高分辨率和矢量元素'
      }
    }

    if (purposeLower.includes('web') || purposeLower.includes('网页')) {
      return {
        format: ExportFormat.PNG,
        reason: '网页展示建议使用PNG格式，支持透明背景且兼容性好'
      }
    }

    if (purposeLower.includes('social') || purposeLower.includes('社交')) {
      return {
        format: ExportFormat.JPEG,
        reason: '社交媒体分享建议使用JPEG格式，文件小且加载快'
      }
    }

    if (purposeLower.includes('vector') || purposeLower.includes('矢量')) {
      return {
        format: ExportFormat.SVG,
        reason: '矢量图形建议使用SVG格式，可无损缩放'
      }
    }

    return {
      format: ExportFormat.PNG,
      reason: 'PNG格式通用性好，适合大多数用途'
    }
  }

  /**
   * 优化导出配置
   */
  static optimizeConfig(config: ExportConfig, constraints?: {
    maxFileSize?: number
    maxWidth?: number
    maxHeight?: number
  }): ExportConfig {
    const optimized = { ...config }

    if (constraints) {
      // 限制尺寸
      if (constraints.maxWidth && optimized.width && optimized.width > constraints.maxWidth) {
        const ratio = constraints.maxWidth / optimized.width
        optimized.width = constraints.maxWidth
        if (optimized.height) {
          optimized.height = Math.round(optimized.height * ratio)
        }
      }

      if (constraints.maxHeight && optimized.height && optimized.height > constraints.maxHeight) {
        const ratio = constraints.maxHeight / optimized.height
        optimized.height = constraints.maxHeight
        if (optimized.width) {
          optimized.width = Math.round(optimized.width * ratio)
        }
      }

      // 限制文件大小
      if (constraints.maxFileSize) {
        const estimatedSize = this.estimateFileSize(optimized)
        if (estimatedSize > constraints.maxFileSize) {
          // 降低质量
          if (optimized.quality === ExportQuality.ULTRA) {
            optimized.quality = ExportQuality.HIGH
          } else if (optimized.quality === ExportQuality.HIGH) {
            optimized.quality = ExportQuality.MEDIUM
          } else if (optimized.quality === ExportQuality.MEDIUM) {
            optimized.quality = ExportQuality.LOW
          }

          // 如果还是太大，考虑改变格式
          const newEstimatedSize = this.estimateFileSize(optimized)
          if (newEstimatedSize > constraints.maxFileSize && optimized.format === ExportFormat.PNG) {
            optimized.format = ExportFormat.JPEG
          }
        }
      }
    }

    return optimized
  }

  /**
   * 创建导出进度跟踪器
   */
  static createProgressTracker(total: number) {
    let completed = 0
    const callbacks: Array<(progress: number) => void> = []

    return {
      increment() {
        completed++
        const progress = completed / total
        callbacks.forEach(callback => callback(progress))
      },
      
      setProgress(value: number) {
        completed = Math.min(Math.max(0, value), total)
        const progress = completed / total
        callbacks.forEach(callback => callback(progress))
      },
      
      onProgress(callback: (progress: number) => void) {
        callbacks.push(callback)
      },
      
      getProgress(): number {
        return completed / total
      },
      
      isComplete(): boolean {
        return completed >= total
      }
    }
  }

  /**
   * 验证导出权限
   */
  static checkExportPermissions(): {
    canExport: boolean
    limitations: string[]
  } {
    const limitations: string[] = []
    let canExport = true

    // 检查浏览器支持
    const support = this.checkBrowserSupport()
    
    if (!support.canvas) {
      limitations.push('浏览器不支持Canvas API')
      canExport = false
    }

    if (!support.download) {
      limitations.push('浏览器不支持文件下载')
    }

    if (!support.blob) {
      limitations.push('浏览器不支持Blob API')
      canExport = false
    }

    // 检查存储空间（如果可用）
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        if (estimate.quota && estimate.usage) {
          const available = estimate.quota - estimate.usage
          if (available < 10 * 1024 * 1024) { // 10MB
            limitations.push('可用存储空间不足')
          }
        }
      })
    }

    return { canExport, limitations }
  }

  /**
   * 清理临时资源
   */
  static cleanupResources(urls: string[]): void {
    urls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
  }
}

// 导出常用预设
export { EXPORT_PRESETS }

// 导出格式信息
export const FORMAT_INFO = {
  [ExportFormat.PNG]: {
    name: 'PNG',
    description: '便携式网络图形，支持透明背景',
    mimeType: 'image/png',
    extension: 'png',
    supportsTransparency: true,
    supportsAnimation: false,
    typical_use: ['网页展示', '图标', '截图']
  },
  [ExportFormat.JPEG]: {
    name: 'JPEG',
    description: '联合图像专家组格式，文件小但不支持透明',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    supportsTransparency: false,
    supportsAnimation: false,
    typical_use: ['照片', '社交媒体', '网页背景']
  },
  [ExportFormat.SVG]: {
    name: 'SVG',
    description: '可缩放矢量图形，支持无损缩放',
    mimeType: 'image/svg+xml',
    extension: 'svg',
    supportsTransparency: true,
    supportsAnimation: true,
    typical_use: ['图标', '矢量图形', '打印']
  },
  [ExportFormat.PDF]: {
    name: 'PDF',
    description: '便携式文档格式，适合打印和文档分享',
    mimeType: 'application/pdf',
    extension: 'pdf',
    supportsTransparency: false,
    supportsAnimation: false,
    typical_use: ['报告', '打印', '文档分享']
  }
} as const
