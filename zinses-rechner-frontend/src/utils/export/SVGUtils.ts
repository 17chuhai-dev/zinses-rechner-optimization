/**
 * SVG导出工具类
 * 提供SVG处理、优化、转换等实用功能
 */

import type { Chart } from 'chart.js'
import type { ChartSVGExportConfig, ChartSVGExportResult } from './ChartSVGExporter'
import { chartSVGExporter } from './ChartSVGExporter'
import { svgConfigManager, type SVGExportPreset, SVGExportPurpose } from './SVGConfigManager'

// SVG优化选项
export interface SVGOptimizationOptions {
  removeComments?: boolean
  removeMetadata?: boolean
  removeUnusedDefs?: boolean
  mergeStyles?: boolean
  minifyStyles?: boolean
  removeEmptyElements?: boolean
  convertShapeToPath?: boolean
  mergePaths?: boolean
  removeRedundantAttributes?: boolean
  sortAttributes?: boolean
  removeDefaultValues?: boolean
  convertColors?: boolean
  shortenIDs?: boolean
  removeViewBox?: boolean
  removeXMLNS?: boolean
}

// SVG转换选项
export interface SVGConversionOptions {
  format: 'png' | 'jpeg' | 'webp' | 'pdf'
  width?: number
  height?: number
  quality?: number
  backgroundColor?: string
  scale?: number
}

// 批量导出选项
export interface SVGBatchExportOptions {
  charts: Chart[]
  config: ChartSVGExportConfig
  filenameTemplate?: string
  zipOutput?: boolean
  progressCallback?: (progress: number, current: number, total: number) => void
}

/**
 * SVG工具类
 */
export class SVGUtils {
  private static instance: SVGUtils

  public static getInstance(): SVGUtils {
    if (!SVGUtils.instance) {
      SVGUtils.instance = new SVGUtils()
    }
    return SVGUtils.instance
  }

  /**
   * 快速导出SVG（使用预设）
   */
  public async quickExportSVG(
    chart: Chart,
    preset: SVGExportPreset = 'web-optimized'
  ): Promise<ChartSVGExportResult> {
    const config = svgConfigManager.getPresetConfig(preset)
    const optimizedConfig = svgConfigManager.optimizeConfigForChart(config, chart)
    
    return await chartSVGExporter.exportChart(chart, optimizedConfig)
  }

  /**
   * 根据用途导出SVG
   */
  public async exportSVGForPurpose(
    chart: Chart,
    purpose: SVGExportPurpose,
    customOptions?: Partial<ChartSVGExportConfig>
  ): Promise<ChartSVGExportResult> {
    const baseConfig = svgConfigManager.getRecommendedConfig(purpose)
    const config = { ...baseConfig, ...customOptions }
    const optimizedConfig = svgConfigManager.optimizeConfigForChart(config, chart)
    
    return await chartSVGExporter.exportChart(chart, optimizedConfig)
  }

  /**
   * 批量导出SVG
   */
  public async batchExportSVG(options: SVGBatchExportOptions): Promise<ChartSVGExportResult[]> {
    const results: ChartSVGExportResult[] = []
    const total = options.charts.length

    for (let i = 0; i < total; i++) {
      const chart = options.charts[i]
      
      // 报告进度
      if (options.progressCallback) {
        options.progressCallback((i / total) * 100, i, total)
      }

      try {
        const optimizedConfig = svgConfigManager.optimizeConfigForChart(options.config, chart)
        const result = await chartSVGExporter.exportChart(chart, optimizedConfig)
        
        // 自定义文件名
        if (options.filenameTemplate) {
          const filename = this.generateFilename(options.filenameTemplate, i, chart)
          result.filename = filename
        }
        
        results.push(result)
      } catch (error) {
        console.error(`导出第 ${i + 1} 个图表失败:`, error)
      }
    }

    // 完成进度报告
    if (options.progressCallback) {
      options.progressCallback(100, total, total)
    }

    // 如果需要打包成ZIP
    if (options.zipOutput) {
      await this.createZipArchive(results)
    }

    return results
  }

  /**
   * 优化SVG内容
   */
  public optimizeSVG(
    svgString: string,
    options: SVGOptimizationOptions = {}
  ): string {
    let optimized = svgString

    // 移除注释
    if (options.removeComments !== false) {
      optimized = optimized.replace(/<!--[\s\S]*?-->/g, '')
    }

    // 移除元数据
    if (options.removeMetadata !== false) {
      optimized = optimized.replace(/<metadata[\s\S]*?<\/metadata>/g, '')
    }

    // 移除空元素
    if (options.removeEmptyElements !== false) {
      optimized = optimized.replace(/<(\w+)([^>]*?)\/>/g, (match, tag, attrs) => {
        if (attrs.trim() === '') {
          return ''
        }
        return match
      })
    }

    // 移除默认值
    if (options.removeDefaultValues !== false) {
      optimized = this.removeDefaultAttributes(optimized)
    }

    // 转换颜色格式
    if (options.convertColors !== false) {
      optimized = this.optimizeColors(optimized)
    }

    // 缩短ID
    if (options.shortenIDs !== false) {
      optimized = this.shortenIDs(optimized)
    }

    // 排序属性
    if (options.sortAttributes !== false) {
      optimized = this.sortAttributes(optimized)
    }

    return optimized
  }

  /**
   * 转换SVG为其他格式
   */
  public async convertSVG(
    svgString: string,
    options: SVGConversionOptions
  ): Promise<Blob> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // 设置画布尺寸
    canvas.width = options.width || 800
    canvas.height = options.height || 600
    
    // 设置背景色
    if (options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 创建图像
    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)

    return new Promise((resolve, reject) => {
      img.onload = () => {
        // 绘制到画布
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // 转换为指定格式
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('转换失败'))
            }
          },
          `image/${options.format}`,
          options.quality || 0.9
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('图像加载失败'))
      }

      img.src = url
    })
  }

  /**
   * 验证SVG内容
   */
  public validateSVG(svgString: string): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 尝试解析XML
      const parser = new DOMParser()
      const doc = parser.parseFromString(svgString, 'image/svg+xml')
      
      // 检查解析错误
      const parserError = doc.querySelector('parsererror')
      if (parserError) {
        errors.push('SVG格式错误: ' + parserError.textContent)
      }

      // 检查SVG根元素
      const svgElement = doc.querySelector('svg')
      if (!svgElement) {
        errors.push('缺少SVG根元素')
      } else {
        // 检查必要属性
        if (!svgElement.getAttribute('width') && !svgElement.getAttribute('viewBox')) {
          warnings.push('建议设置width属性或viewBox属性')
        }
        
        if (!svgElement.getAttribute('height') && !svgElement.getAttribute('viewBox')) {
          warnings.push('建议设置height属性或viewBox属性')
        }
      }

      // 检查无效元素
      const invalidElements = doc.querySelectorAll('*:not(svg):not(g):not(path):not(rect):not(circle):not(ellipse):not(line):not(polyline):not(polygon):not(text):not(tspan):not(defs):not(linearGradient):not(radialGradient):not(stop):not(filter):not(feGaussianBlur):not(feOffset):not(feMerge):not(feMergeNode):not(clipPath):not(mask):not(pattern):not(image):not(use):not(symbol):not(marker):not(foreignObject)')
      if (invalidElements.length > 0) {
        warnings.push(`发现 ${invalidElements.length} 个可能不支持的元素`)
      }

    } catch (error) {
      errors.push('SVG解析失败: ' + (error as Error).message)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取SVG信息
   */
  public getSVGInfo(svgString: string): {
    dimensions: { width: number; height: number }
    elementCount: number
    pathCount: number
    textCount: number
    hasGradients: boolean
    hasFilters: boolean
    fileSize: number
  } {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')

    const width = parseInt(svgElement?.getAttribute('width') || '0')
    const height = parseInt(svgElement?.getAttribute('height') || '0')
    
    return {
      dimensions: { width, height },
      elementCount: doc.querySelectorAll('*').length,
      pathCount: doc.querySelectorAll('path').length,
      textCount: doc.querySelectorAll('text, tspan').length,
      hasGradients: doc.querySelectorAll('linearGradient, radialGradient').length > 0,
      hasFilters: doc.querySelectorAll('filter').length > 0,
      fileSize: new Blob([svgString]).size
    }
  }

  /**
   * 创建响应式SVG
   */
  public makeResponsive(
    svgString: string,
    options: {
      minWidth?: number
      maxWidth?: number
      aspectRatio?: number
    } = {}
  ): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')

    if (!svgElement) return svgString

    // 移除固定尺寸
    svgElement.removeAttribute('width')
    svgElement.removeAttribute('height')

    // 设置viewBox（如果没有的话）
    if (!svgElement.getAttribute('viewBox')) {
      const width = options.maxWidth || 800
      const height = options.aspectRatio ? width / options.aspectRatio : 600
      svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`)
    }

    // 设置preserveAspectRatio
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    // 添加CSS样式
    const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = `
      svg {
        width: 100%;
        height: auto;
        ${options.minWidth ? `min-width: ${options.minWidth}px;` : ''}
        ${options.maxWidth ? `max-width: ${options.maxWidth}px;` : ''}
      }
    `
    svgElement.insertBefore(style, svgElement.firstChild)

    return new XMLSerializer().serializeToString(doc)
  }

  // 私有辅助方法

  private generateFilename(template: string, index: number, chart: Chart): string {
    return template
      .replace('{index}', (index + 1).toString())
      .replace('{type}', chart.config.type || 'chart')
      .replace('{timestamp}', Date.now().toString())
  }

  private async createZipArchive(results: ChartSVGExportResult[]): Promise<void> {
    // 这里需要使用JSZip库来创建ZIP文件
    // 由于这是一个简化实现，我们只是记录日志
    console.log('创建ZIP归档包含', results.length, '个SVG文件')
  }

  private removeDefaultAttributes(svgString: string): string {
    return svgString
      .replace(/\s+fill="none"/g, '')
      .replace(/\s+stroke="none"/g, '')
      .replace(/\s+stroke-width="1"/g, '')
      .replace(/\s+opacity="1"/g, '')
      .replace(/\s+fill-opacity="1"/g, '')
      .replace(/\s+stroke-opacity="1"/g, '')
  }

  private optimizeColors(svgString: string): string {
    // 将长颜色值转换为短格式
    return svgString.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, '#$1$2$3')
  }

  private shortenIDs(svgString: string): string {
    const idMap = new Map<string, string>()
    let counter = 0

    return svgString.replace(/id="([^"]+)"/g, (match, id) => {
      if (!idMap.has(id)) {
        idMap.set(id, `a${counter++}`)
      }
      return `id="${idMap.get(id)}"`
    }).replace(/url\(#([^)]+)\)/g, (match, id) => {
      return `url(#${idMap.get(id) || id})`
    })
  }

  private sortAttributes(svgString: string): string {
    return svgString.replace(/<(\w+)([^>]+)>/g, (match, tag, attrs) => {
      const attrList = attrs.trim().split(/\s+/)
        .filter((attr: string) => attr.includes('='))
        .sort()
      
      return `<${tag} ${attrList.join(' ')}>`
    })
  }
}

// 导出单例实例
export const svgUtils = SVGUtils.getInstance()

// 便捷导出函数
export async function exportSVGForWeb(chart: Chart): Promise<ChartSVGExportResult> {
  return svgUtils.exportSVGForPurpose(chart, SVGExportPurpose.WEB)
}

export async function exportSVGForPrint(chart: Chart): Promise<ChartSVGExportResult> {
  return svgUtils.exportSVGForPurpose(chart, SVGExportPurpose.PRINT)
}

export async function exportSVGForPresentation(chart: Chart): Promise<ChartSVGExportResult> {
  return svgUtils.exportSVGForPurpose(chart, SVGExportPurpose.PRESENTATION)
}

export async function exportSVGForSocial(chart: Chart): Promise<ChartSVGExportResult> {
  return svgUtils.exportSVGForPurpose(chart, SVGExportPurpose.SOCIAL)
}

export async function quickSVGExport(
  chart: Chart,
  preset: SVGExportPreset = 'web-optimized'
): Promise<ChartSVGExportResult> {
  return svgUtils.quickExportSVG(chart, preset)
}
