/**
 * PNG导出工具函数集合
 * 提供PNG相关的实用工具和辅助函数
 */

import { pngRenderEngine, type PNGRenderConfig, type PNGRenderResult, RenderQuality } from './PNGRenderEngine'
import { pngConfigManager, PNGExportPurpose } from './PNGConfigManager'
import type { Chart } from 'chart.js'

// PNG导出选项接口
export interface PNGExportOptions {
  purpose?: PNGExportPurpose
  filename?: string
  quality?: RenderQuality
  transparent?: boolean
  backgroundColor?: string
  customConfig?: Partial<PNGRenderConfig>
}

// PNG批量导出选项
export interface PNGBatchExportOptions {
  items: Array<{
    element: HTMLElement | Chart
    filename?: string
    options?: PNGExportOptions
  }>
  onProgress?: (completed: number, total: number, current?: string) => void
  onError?: (error: string, index: number) => void
}

/**
 * PNG导出工具类
 */
export class PNGUtils {
  /**
   * 快速导出PNG（使用默认配置）
   */
  static async quickExport(
    element: HTMLElement | Chart,
    filename?: string
  ): Promise<PNGRenderResult> {
    const config = pngConfigManager.getConfigForPurpose(PNGExportPurpose.WEB_DISPLAY)
    const result = await pngRenderEngine.renderToPNG(element, config)
    
    if (filename) {
      this.downloadPNG(result, filename)
    }
    
    return result
  }

  /**
   * 根据用途导出PNG
   */
  static async exportForPurpose(
    element: HTMLElement | Chart,
    purpose: PNGExportPurpose,
    options: PNGExportOptions = {}
  ): Promise<PNGRenderResult> {
    let config = pngConfigManager.getConfigForPurpose(purpose)
    
    // 应用自定义选项
    if (options.quality) config.quality = options.quality
    if (options.transparent !== undefined) config.transparent = options.transparent
    if (options.backgroundColor) config.backgroundColor = options.backgroundColor
    if (options.customConfig) config = { ...config, ...options.customConfig }
    
    // 优化配置
    config = pngConfigManager.optimizeConfigForDevice(config)
    
    const result = await pngRenderEngine.renderToPNG(element, config)
    
    if (options.filename) {
      this.downloadPNG(result, options.filename)
    }
    
    return result
  }

  /**
   * 高分辨率导出
   */
  static async exportHighResolution(
    element: HTMLElement | Chart,
    width: number,
    height: number,
    dpi: number = 300,
    options: PNGExportOptions = {}
  ): Promise<PNGRenderResult> {
    let config = pngConfigManager.createConfigByDPI(width, height, dpi)
    
    // 应用自定义选项
    if (options.quality) config.quality = options.quality
    if (options.transparent !== undefined) config.transparent = options.transparent
    if (options.backgroundColor) config.backgroundColor = options.backgroundColor
    if (options.customConfig) config = { ...config, ...options.customConfig }
    
    // 验证配置
    const validation = pngConfigManager.validateConfig(config)
    if (!validation.valid) {
      throw new Error(`配置无效: ${validation.errors.join(', ')}`)
    }
    
    const result = await pngRenderEngine.renderToPNG(element, config)
    
    if (options.filename) {
      this.downloadPNG(result, options.filename)
    }
    
    return result
  }

  /**
   * 批量导出PNG
   */
  static async batchExport(options: PNGBatchExportOptions): Promise<PNGRenderResult[]> {
    const results: PNGRenderResult[] = []
    const { items, onProgress, onError } = options
    
    for (let i = 0; i < items.length; i++) {
      try {
        const { element, filename, options: itemOptions = {} } = items[i]
        
        // 通知当前处理项目
        if (onProgress) {
          onProgress(i, items.length, filename || `项目 ${i + 1}`)
        }
        
        const result = await this.exportForPurpose(
          element,
          itemOptions.purpose || PNGExportPurpose.WEB_DISPLAY,
          { ...itemOptions, filename }
        )
        
        results.push(result)
        
        // 通知完成
        if (onProgress) {
          onProgress(i + 1, items.length)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        
        if (onError) {
          onError(errorMessage, i)
        }
        
        // 添加错误结果占位符
        results.push({
          canvas: document.createElement('canvas'),
          dataUrl: '',
          blob: new Blob(),
          width: 0,
          height: 0,
          actualDPI: 0,
          renderTime: 0,
          memoryUsed: 0,
          quality: RenderQuality.DRAFT
        })
      }
    }
    
    return results
  }

  /**
   * 创建PNG预览
   */
  static async createPreview(
    element: HTMLElement | Chart,
    config: PNGRenderConfig,
    maxWidth: number = 400,
    maxHeight: number = 300
  ): Promise<PNGRenderResult> {
    // 创建预览配置（降低分辨率以提高速度）
    const previewConfig: PNGRenderConfig = {
      ...config,
      width: Math.min(config.width, maxWidth),
      height: Math.min(config.height, maxHeight),
      quality: RenderQuality.DRAFT,
      dpi: 72,
      pixelRatio: 1
    }
    
    return await pngRenderEngine.renderToPNG(element, previewConfig)
  }

  /**
   * 比较不同质量设置的效果
   */
  static async compareQualities(
    element: HTMLElement | Chart,
    baseConfig: PNGRenderConfig
  ): Promise<Record<RenderQuality, PNGRenderResult>> {
    const results: Record<RenderQuality, PNGRenderResult> = {} as any
    const qualities = [RenderQuality.DRAFT, RenderQuality.STANDARD, RenderQuality.HIGH, RenderQuality.ULTRA]
    
    for (const quality of qualities) {
      const config = { ...baseConfig, quality }
      results[quality] = await pngRenderEngine.renderToPNG(element, config)
    }
    
    return results
  }

  /**
   * 下载PNG文件
   */
  static downloadPNG(result: PNGRenderResult, filename: string): void {
    const finalFilename = filename.endsWith('.png') ? filename : `${filename}.png`
    
    const link = document.createElement('a')
    link.href = result.dataUrl
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * 将PNG结果转换为File对象
   */
  static resultToFile(result: PNGRenderResult, filename: string): File {
    const finalFilename = filename.endsWith('.png') ? filename : `${filename}.png`
    return new File([result.blob], finalFilename, { type: 'image/png' })
  }

  /**
   * 获取PNG的详细信息
   */
  static getPNGInfo(result: PNGRenderResult): {
    dimensions: string
    fileSize: string
    dpi: number
    quality: RenderQuality
    renderTime: string
    memoryUsed: string
    aspectRatio: string
  } {
    const aspectRatio = (result.width / result.height).toFixed(2)
    
    return {
      dimensions: `${result.width} × ${result.height}`,
      fileSize: this.formatFileSize(result.blob.size),
      dpi: result.actualDPI,
      quality: result.quality,
      renderTime: `${result.renderTime.toFixed(1)}ms`,
      memoryUsed: this.formatFileSize(result.memoryUsed),
      aspectRatio: `${aspectRatio}:1`
    }
  }

  /**
   * 验证PNG导出是否成功
   */
  static validatePNGResult(result: PNGRenderResult): {
    valid: boolean
    issues: string[]
  } {
    const issues: string[] = []
    
    if (result.width <= 0 || result.height <= 0) {
      issues.push('图像尺寸无效')
    }
    
    if (result.blob.size === 0) {
      issues.push('文件大小为0')
    }
    
    if (!result.dataUrl.startsWith('data:image/png')) {
      issues.push('数据URL格式无效')
    }
    
    if (result.renderTime <= 0) {
      issues.push('渲染时间异常')
    }
    
    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * 优化PNG配置以减少文件大小
   */
  static optimizeForFileSize(config: PNGRenderConfig, targetSizeKB: number): PNGRenderConfig {
    const optimized = { ...config }
    const estimatedSize = pngConfigManager.estimateFileSize(config)
    
    if (estimatedSize.estimated > targetSizeKB * 1024) {
      // 降低质量
      if (optimized.quality === RenderQuality.ULTRA) {
        optimized.quality = RenderQuality.HIGH
      } else if (optimized.quality === RenderQuality.HIGH) {
        optimized.quality = RenderQuality.STANDARD
      }
      
      // 如果还是太大，降低分辨率
      const newEstimate = pngConfigManager.estimateFileSize(optimized)
      if (newEstimate.estimated > targetSizeKB * 1024) {
        const scaleFactor = Math.sqrt((targetSizeKB * 1024) / newEstimate.estimated)
        optimized.width = Math.round(optimized.width * scaleFactor)
        optimized.height = Math.round(optimized.height * scaleFactor)
      }
    }
    
    return optimized
  }

  /**
   * 创建PNG导出报告
   */
  static createExportReport(results: PNGRenderResult[]): {
    totalFiles: number
    totalSize: number
    averageSize: number
    totalRenderTime: number
    averageRenderTime: number
    qualityDistribution: Record<RenderQuality, number>
    sizeDistribution: {
      small: number    // < 1MB
      medium: number   // 1-5MB
      large: number    // > 5MB
    }
  } {
    const totalFiles = results.length
    const totalSize = results.reduce((sum, r) => sum + r.blob.size, 0)
    const totalRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0)
    
    const qualityDistribution: Record<RenderQuality, number> = {
      [RenderQuality.DRAFT]: 0,
      [RenderQuality.STANDARD]: 0,
      [RenderQuality.HIGH]: 0,
      [RenderQuality.ULTRA]: 0
    }
    
    const sizeDistribution = { small: 0, medium: 0, large: 0 }
    
    results.forEach(result => {
      qualityDistribution[result.quality]++
      
      const sizeMB = result.blob.size / (1024 * 1024)
      if (sizeMB < 1) {
        sizeDistribution.small++
      } else if (sizeMB <= 5) {
        sizeDistribution.medium++
      } else {
        sizeDistribution.large++
      }
    })
    
    return {
      totalFiles,
      totalSize,
      averageSize: totalSize / totalFiles,
      totalRenderTime,
      averageRenderTime: totalRenderTime / totalFiles,
      qualityDistribution,
      sizeDistribution
    }
  }

  /**
   * 格式化文件大小
   */
  private static formatFileSize(bytes: number): string {
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

// 便捷导出函数
export const pngUtils = PNGUtils

// 快捷导出函数
export async function exportPNGForWeb(element: HTMLElement | Chart, filename?: string) {
  return PNGUtils.exportForPurpose(element, PNGExportPurpose.WEB_DISPLAY, { filename })
}

export async function exportPNGForPrint(element: HTMLElement | Chart, filename?: string) {
  return PNGUtils.exportForPurpose(element, PNGExportPurpose.PRINT_SMALL, { filename })
}

export async function exportPNGForSocial(element: HTMLElement | Chart, filename?: string) {
  return PNGUtils.exportForPurpose(element, PNGExportPurpose.SOCIAL_MEDIA, { filename })
}

export async function exportPNGHighRes(
  element: HTMLElement | Chart,
  width: number,
  height: number,
  filename?: string
) {
  return PNGUtils.exportHighResolution(element, width, height, 300, { filename })
}

// 默认导出
export default PNGUtils
