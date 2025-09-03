/**
 * 图表导出引擎核心类
 * 支持PNG、SVG、PDF等多种格式的高质量图表导出
 */

import { Chart } from 'chart.js'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// 导出格式枚举
export enum ExportFormat {
  PNG = 'png',
  SVG = 'svg',
  PDF = 'pdf',
  JPEG = 'jpeg'
}

// 导出质量级别
export enum ExportQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

// 导出配置接口
export interface ExportConfig {
  format: ExportFormat
  quality: ExportQuality
  width?: number
  height?: number
  dpi?: number
  backgroundColor?: string
  transparent?: boolean
  filename?: string
  includeTitle?: boolean
  includeData?: boolean
  watermark?: string
}

// 导出结果接口
export interface ExportResult {
  success: boolean
  filename: string
  format: ExportFormat
  size: number
  url?: string
  error?: string
  metadata?: ExportMetadata
}

// 导出元数据接口
export interface ExportMetadata {
  width: number
  height: number
  dpi: number
  quality: ExportQuality
  timestamp: Date
  chartType: string
  dataPoints: number
}

// 批量导出配置接口
export interface BatchExportConfig {
  charts: Array<{
    chart: Chart | HTMLElement
    config: ExportConfig
  }>
  onProgress?: (completed: number, total: number) => void
  onError?: (error: string, index: number) => void
}

// 批量导出结果接口
export interface BatchExportResult {
  results: ExportResult[]
  totalSuccess: number
  totalFailed: number
  errors: string[]
}

/**
 * 图表导出引擎主类
 */
export class ChartExportEngine {
  private static instance: ChartExportEngine
  private defaultConfig: Partial<ExportConfig>
  private qualitySettings: Record<ExportQuality, any>

  private constructor() {
    this.defaultConfig = {
      format: ExportFormat.PNG,
      quality: ExportQuality.HIGH,
      width: 800,
      height: 600,
      dpi: 300,
      backgroundColor: '#ffffff',
      transparent: false,
      includeTitle: true,
      includeData: false
    }

    this.qualitySettings = {
      [ExportQuality.LOW]: {
        dpi: 72,
        compression: 0.7,
        scale: 1
      },
      [ExportQuality.MEDIUM]: {
        dpi: 150,
        compression: 0.8,
        scale: 1.5
      },
      [ExportQuality.HIGH]: {
        dpi: 300,
        compression: 0.9,
        scale: 2
      },
      [ExportQuality.ULTRA]: {
        dpi: 600,
        compression: 1.0,
        scale: 3
      }
    }
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ChartExportEngine {
    if (!ChartExportEngine.instance) {
      ChartExportEngine.instance = new ChartExportEngine()
    }
    return ChartExportEngine.instance
  }

  /**
   * 导出单个图表
   */
  public async exportChart(
    chart: Chart | HTMLElement,
    config: Partial<ExportConfig> = {}
  ): Promise<ExportResult> {
    const finalConfig = this.mergeConfig(config)
    
    try {
      const startTime = Date.now()
      
      switch (finalConfig.format) {
        case ExportFormat.PNG:
          return await this.exportToPNG(chart, finalConfig)
        case ExportFormat.SVG:
          return await this.exportToSVG(chart, finalConfig)
        case ExportFormat.PDF:
          return await this.exportToPDF(chart, finalConfig)
        case ExportFormat.JPEG:
          return await this.exportToJPEG(chart, finalConfig)
        default:
          throw new Error(`不支持的导出格式: ${finalConfig.format}`)
      }
    } catch (error) {
      return {
        success: false,
        filename: finalConfig.filename || 'export_failed',
        format: finalConfig.format!,
        size: 0,
        error: error instanceof Error ? error.message : '导出失败'
      }
    }
  }

  /**
   * 批量导出图表
   */
  public async exportBatch(config: BatchExportConfig): Promise<BatchExportResult> {
    const results: ExportResult[] = []
    const errors: string[] = []
    let totalSuccess = 0
    let totalFailed = 0

    for (let i = 0; i < config.charts.length; i++) {
      try {
        const { chart, config: chartConfig } = config.charts[i]
        const result = await this.exportChart(chart, chartConfig)
        
        results.push(result)
        
        if (result.success) {
          totalSuccess++
        } else {
          totalFailed++
          if (result.error) {
            errors.push(`图表 ${i + 1}: ${result.error}`)
          }
        }

        // 调用进度回调
        if (config.onProgress) {
          config.onProgress(i + 1, config.charts.length)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        errors.push(`图表 ${i + 1}: ${errorMessage}`)
        totalFailed++
        
        if (config.onError) {
          config.onError(errorMessage, i)
        }

        results.push({
          success: false,
          filename: `export_failed_${i}`,
          format: config.charts[i].config.format || ExportFormat.PNG,
          size: 0,
          error: errorMessage
        })
      }
    }

    return {
      results,
      totalSuccess,
      totalFailed,
      errors
    }
  }

  /**
   * 导出为PNG格式
   */
  private async exportToPNG(
    chart: Chart | HTMLElement,
    config: ExportConfig
  ): Promise<ExportResult> {
    const element = this.getChartElement(chart)
    const qualitySettings = this.qualitySettings[config.quality!]
    
    const canvas = await html2canvas(element, {
      width: config.width,
      height: config.height,
      scale: qualitySettings.scale,
      backgroundColor: config.transparent ? null : config.backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false
    })

    const dataUrl = canvas.toDataURL('image/png', qualitySettings.compression)
    const filename = this.generateFilename(config, 'png')
    
    // 下载文件
    this.downloadFile(dataUrl, filename)
    
    // 计算文件大小（估算）
    const size = Math.round((dataUrl.length * 3) / 4)
    
    return {
      success: true,
      filename,
      format: ExportFormat.PNG,
      size,
      url: dataUrl,
      metadata: this.generateMetadata(config, canvas, chart)
    }
  }

  /**
   * 导出为SVG格式
   */
  private async exportToSVG(
    chart: Chart | HTMLElement,
    config: ExportConfig
  ): Promise<ExportResult> {
    if (chart instanceof Chart) {
      // Chart.js图表转SVG
      const canvas = chart.canvas
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('无法获取Canvas上下文')
      }

      // 创建SVG字符串
      const svgString = this.canvasToSVG(canvas, config)
      const filename = this.generateFilename(config, 'svg')
      
      // 创建Blob并下载
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      this.downloadFile(url, filename)
      
      return {
        success: true,
        filename,
        format: ExportFormat.SVG,
        size: blob.size,
        url,
        metadata: this.generateMetadata(config, canvas, chart)
      }
    } else {
      // HTML元素转SVG
      const svgString = await this.htmlToSVG(chart, config)
      const filename = this.generateFilename(config, 'svg')
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      this.downloadFile(url, filename)
      
      return {
        success: true,
        filename,
        format: ExportFormat.SVG,
        size: blob.size,
        url,
        metadata: this.generateMetadata(config, chart, chart)
      }
    }
  }

  /**
   * 导出为PDF格式
   */
  private async exportToPDF(
    chart: Chart | HTMLElement,
    config: ExportConfig
  ): Promise<ExportResult> {
    const element = this.getChartElement(chart)
    const qualitySettings = this.qualitySettings[config.quality!]
    
    // 首先转换为Canvas
    const canvas = await html2canvas(element, {
      width: config.width,
      height: config.height,
      scale: qualitySettings.scale,
      backgroundColor: config.backgroundColor,
      useCORS: true,
      allowTaint: true
    })

    // 创建PDF
    const pdf = new jsPDF({
      orientation: config.width! > config.height! ? 'landscape' : 'portrait',
      unit: 'px',
      format: [config.width!, config.height!]
    })

    // 添加图表到PDF
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, config.width!, config.height!)

    // 添加标题（如果需要）
    if (config.includeTitle) {
      pdf.setFontSize(16)
      pdf.text('图表导出', 20, 30)
    }

    // 添加水印（如果需要）
    if (config.watermark) {
      pdf.setTextColor(200, 200, 200)
      pdf.setFontSize(12)
      pdf.text(config.watermark, config.width! - 100, config.height! - 20)
    }

    const filename = this.generateFilename(config, 'pdf')
    pdf.save(filename)

    return {
      success: true,
      filename,
      format: ExportFormat.PDF,
      size: pdf.output('blob').size,
      metadata: this.generateMetadata(config, canvas, chart)
    }
  }

  /**
   * 导出为JPEG格式
   */
  private async exportToJPEG(
    chart: Chart | HTMLElement,
    config: ExportConfig
  ): Promise<ExportResult> {
    const element = this.getChartElement(chart)
    const qualitySettings = this.qualitySettings[config.quality!]
    
    const canvas = await html2canvas(element, {
      width: config.width,
      height: config.height,
      scale: qualitySettings.scale,
      backgroundColor: config.backgroundColor || '#ffffff', // JPEG不支持透明
      useCORS: true,
      allowTaint: true
    })

    const dataUrl = canvas.toDataURL('image/jpeg', qualitySettings.compression)
    const filename = this.generateFilename(config, 'jpeg')
    
    this.downloadFile(dataUrl, filename)
    
    const size = Math.round((dataUrl.length * 3) / 4)
    
    return {
      success: true,
      filename,
      format: ExportFormat.JPEG,
      size,
      url: dataUrl,
      metadata: this.generateMetadata(config, canvas, chart)
    }
  }

  /**
   * 合并配置
   */
  private mergeConfig(config: Partial<ExportConfig>): ExportConfig {
    return {
      ...this.defaultConfig,
      ...config
    } as ExportConfig
  }

  /**
   * 获取图表元素
   */
  private getChartElement(chart: Chart | HTMLElement): HTMLElement {
    if (chart instanceof Chart) {
      return chart.canvas.parentElement || chart.canvas
    }
    return chart
  }

  /**
   * 生成文件名
   */
  private generateFilename(config: ExportConfig, extension: string): string {
    if (config.filename) {
      return config.filename.endsWith(`.${extension}`) 
        ? config.filename 
        : `${config.filename}.${extension}`
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    return `chart_export_${timestamp}.${extension}`
  }

  /**
   * 下载文件
   */
  private downloadFile(url: string, filename: string): void {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }

  /**
   * 生成导出元数据
   */
  private generateMetadata(
    config: ExportConfig,
    canvas: HTMLCanvasElement | HTMLElement,
    chart: Chart | HTMLElement
  ): ExportMetadata {
    const width = canvas instanceof HTMLCanvasElement ? canvas.width : config.width!
    const height = canvas instanceof HTMLCanvasElement ? canvas.height : config.height!
    
    return {
      width,
      height,
      dpi: config.dpi!,
      quality: config.quality!,
      timestamp: new Date(),
      chartType: chart instanceof Chart ? chart.config.type || 'unknown' : 'html',
      dataPoints: chart instanceof Chart ? (chart.data.datasets[0]?.data?.length || 0) : 0
    }
  }

  /**
   * Canvas转SVG
   */
  private canvasToSVG(canvas: HTMLCanvasElement, config: ExportConfig): string {
    const dataUrl = canvas.toDataURL('image/png')
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${config.width}" height="${config.height}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${config.width}" height="${config.height}" xlink:href="${dataUrl}"/>
</svg>`
  }

  /**
   * HTML元素转SVG
   */
  private async htmlToSVG(element: HTMLElement, config: ExportConfig): Promise<string> {
    // 这里可以实现更复杂的HTML到SVG转换逻辑
    // 目前使用简化版本，先转Canvas再转SVG
    const canvas = await html2canvas(element, {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      useCORS: true
    })
    
    return this.canvasToSVG(canvas, config)
  }

  /**
   * 设置默认配置
   */
  public setDefaultConfig(config: Partial<ExportConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }
  }

  /**
   * 获取默认配置
   */
  public getDefaultConfig(): Partial<ExportConfig> {
    return { ...this.defaultConfig }
  }

  /**
   * 获取支持的格式列表
   */
  public getSupportedFormats(): ExportFormat[] {
    return Object.values(ExportFormat)
  }

  /**
   * 获取质量级别列表
   */
  public getQualityLevels(): ExportQuality[] {
    return Object.values(ExportQuality)
  }
}

// 导出单例实例
export const chartExportEngine = ChartExportEngine.getInstance()
