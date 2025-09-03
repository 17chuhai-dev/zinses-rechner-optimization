/**
 * 导出管理器服务
 * 统一管理所有导出功能，协调格式选择器、配置面板和导出引擎
 */

import { ref, reactive } from 'vue'
import { 
  chartExportEngine, 
  exportConfigManager, 
  ExportFormat, 
  ExportQuality,
  type ExportConfig,
  type ExportResult 
} from '@/utils/export'
import type { Chart } from 'chart.js'

// 导出状态接口
export interface ExportState {
  isExporting: boolean
  currentFormat: ExportFormat | null
  progress: number
  error: string | null
  result: ExportResult | null
}

// 导出选项接口
export interface ExportOptions {
  format: ExportFormat
  quality?: ExportQuality
  filename?: string
  includeChart?: boolean
  includeData?: boolean
  includeFormulas?: boolean
  includeMetadata?: boolean
  customConfig?: Partial<ExportConfig>
}

// 批量导出配置接口
export interface BatchExportOptions {
  formats: ExportFormat[]
  baseFilename?: string
  quality?: ExportQuality
  includeChart?: boolean
  includeData?: boolean
  zipOutput?: boolean
}

/**
 * 导出管理器类
 */
export class ExportManager {
  private static instance: ExportManager

  // 导出状态
  public readonly state = reactive<ExportState>({
    isExporting: false,
    currentFormat: null,
    progress: 0,
    error: null,
    result: null
  })

  // 支持的格式
  public readonly supportedFormats: ExportFormat[] = [
    'png', 'svg', 'pdf', 'csv', 'excel'
  ]

  // 格式信息
  public readonly formatInfo = {
    png: {
      name: 'PNG-Bild',
      description: 'Hochauflösendes Rasterbild',
      extensions: ['.png'],
      mimeType: 'image/png',
      category: 'image',
      supportsTransparency: true,
      supportsAnimation: false
    },
    svg: {
      name: 'SVG-Vektor',
      description: 'Skalierbare Vektorgrafik',
      extensions: ['.svg'],
      mimeType: 'image/svg+xml',
      category: 'vector',
      supportsTransparency: true,
      supportsAnimation: true
    },
    pdf: {
      name: 'PDF-Dokument',
      description: 'Vollständiger Bericht',
      extensions: ['.pdf'],
      mimeType: 'application/pdf',
      category: 'document',
      supportsTransparency: false,
      supportsAnimation: false
    },
    csv: {
      name: 'CSV-Datei',
      description: 'Tabellarische Rohdaten',
      extensions: ['.csv'],
      mimeType: 'text/csv',
      category: 'data',
      supportsTransparency: false,
      supportsAnimation: false
    },
    excel: {
      name: 'Excel-Arbeitsmappe',
      description: 'Formatierte Tabelle',
      extensions: ['.xlsx'],
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      category: 'data',
      supportsTransparency: false,
      supportsAnimation: false
    }
  }

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager()
    }
    return ExportManager.instance
  }

  /**
   * 单个导出
   */
  public async exportSingle(
    chart: Chart | HTMLElement,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      this.resetState()
      this.state.isExporting = true
      this.state.currentFormat = options.format

      // 创建导出配置
      const config = this.createExportConfig(options)

      // 更新进度
      this.updateProgress(10)

      // 执行导出
      const result = await chartExportEngine.exportChart(chart, config)

      // 更新进度
      this.updateProgress(90)

      // 保存到历史记录
      await this.saveToHistory(result, options)

      // 完成
      this.updateProgress(100)
      this.state.result = result
      this.state.isExporting = false

      return result

    } catch (error) {
      this.handleError(error)
      throw error
    }
  }

  /**
   * 批量导出
   */
  public async exportBatch(
    chart: Chart | HTMLElement,
    options: BatchExportOptions
  ): Promise<ExportResult[]> {
    try {
      this.resetState()
      this.state.isExporting = true

      const results: ExportResult[] = []
      const totalFormats = options.formats.length

      for (let i = 0; i < totalFormats; i++) {
        const format = options.formats[i]
        this.state.currentFormat = format

        // 创建单个导出选项
        const singleOptions: ExportOptions = {
          format,
          quality: options.quality,
          filename: options.baseFilename ? `${options.baseFilename}.${format}` : undefined,
          includeChart: options.includeChart,
          includeData: options.includeData
        }

        // 执行单个导出
        const config = this.createExportConfig(singleOptions)
        const result = await chartExportEngine.exportChart(chart, config)
        results.push(result)

        // 更新进度
        this.updateProgress(((i + 1) / totalFormats) * 90)

        // 短暂延迟避免浏览器阻塞
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 如果需要打包成ZIP
      if (options.zipOutput && results.length > 1) {
        const zipResult = await this.createZipArchive(results, options.baseFilename)
        this.updateProgress(100)
        this.state.result = zipResult
        this.state.isExporting = false
        return [zipResult]
      }

      this.updateProgress(100)
      this.state.isExporting = false
      return results

    } catch (error) {
      this.handleError(error)
      throw error
    }
  }

  /**
   * 快速导出（使用预设配置）
   */
  public async quickExport(
    chart: Chart | HTMLElement,
    format: ExportFormat = 'png'
  ): Promise<ExportResult> {
    const preferences = exportConfigManager.getUserPreferences()
    
    const options: ExportOptions = {
      format,
      quality: preferences.defaultQuality,
      includeChart: true,
      includeData: format === 'csv' || format === 'excel',
      includeMetadata: true
    }

    return this.exportSingle(chart, options)
  }

  /**
   * 获取推荐的导出格式
   */
  public getRecommendedFormat(purpose: 'web' | 'print' | 'social' | 'analysis'): ExportFormat {
    const recommendations = {
      web: 'png',
      print: 'pdf',
      social: 'png',
      analysis: 'excel'
    } as const

    return recommendations[purpose]
  }

  /**
   * 检查格式支持
   */
  public isFormatSupported(format: string): format is ExportFormat {
    return this.supportedFormats.includes(format as ExportFormat)
  }

  /**
   * 获取格式信息
   */
  public getFormatInfo(format: ExportFormat) {
    return this.formatInfo[format]
  }

  /**
   * 估算文件大小
   */
  public estimateFileSize(
    format: ExportFormat,
    quality: ExportQuality = 'high',
    dimensions?: { width: number; height: number }
  ): number {
    const baseSizes = {
      png: 300000, // 300KB
      svg: 100000,  // 100KB
      pdf: 800000,  // 800KB
      csv: 10000,   // 10KB
      excel: 200000 // 200KB
    }

    const qualityMultipliers = {
      low: 0.5,
      medium: 1,
      high: 1.5,
      ultra: 2
    }

    let size = baseSizes[format] * qualityMultipliers[quality]

    // 根据尺寸调整
    if (dimensions && (format === 'png' || format === 'svg')) {
      const pixelCount = dimensions.width * dimensions.height
      const basePixels = 800 * 600
      size *= Math.sqrt(pixelCount / basePixels)
    }

    return Math.round(size)
  }

  /**
   * 取消当前导出
   */
  public cancelExport(): void {
    if (this.state.isExporting) {
      this.state.isExporting = false
      this.state.currentFormat = null
      this.state.progress = 0
      this.state.error = 'Export wurde abgebrochen'
    }
  }

  /**
   * 清除错误状态
   */
  public clearError(): void {
    this.state.error = null
  }

  /**
   * 重置状态
   */
  private resetState(): void {
    this.state.isExporting = false
    this.state.currentFormat = null
    this.state.progress = 0
    this.state.error = null
    this.state.result = null
  }

  /**
   * 创建导出配置
   */
  private createExportConfig(options: ExportOptions): ExportConfig {
    const preferences = exportConfigManager.getUserPreferences()
    
    return {
      format: options.format,
      quality: options.quality || preferences.defaultQuality,
      width: preferences.defaultWidth,
      height: preferences.defaultHeight,
      backgroundColor: preferences.defaultBackgroundColor,
      transparent: preferences.defaultTransparent,
      filename: options.filename || this.generateFilename(options.format),
      includeWatermark: preferences.includeWatermark,
      watermarkText: preferences.watermarkText,
      ...options.customConfig
    }
  }

  /**
   * 生成文件名
   */
  private generateFilename(format: ExportFormat): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    return `zinses-rechner-export-${timestamp}.${format}`
  }

  /**
   * 更新进度
   */
  private updateProgress(progress: number): void {
    this.state.progress = Math.min(Math.max(progress, 0), 100)
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler beim Export'
    this.state.error = errorMessage
    this.state.isExporting = false
    this.state.progress = 0
    console.error('Export error:', error)
  }

  /**
   * 保存到历史记录
   */
  private async saveToHistory(result: ExportResult, options: ExportOptions): Promise<void> {
    try {
      const historyEntry = {
        id: `export_${Date.now()}`,
        format: options.format,
        filename: result.filename || 'unknown',
        size: result.blob?.size || 0,
        timestamp: new Date(),
        config: options
      }

      await exportConfigManager.addToHistory(historyEntry)
    } catch (error) {
      console.warn('Failed to save export to history:', error)
    }
  }

  /**
   * 创建ZIP归档
   */
  private async createZipArchive(
    results: ExportResult[],
    baseFilename?: string
  ): Promise<ExportResult> {
    // 简化实现：返回第一个结果
    // 实际实现需要使用JSZip等库
    const zipFilename = `${baseFilename || 'zinses-rechner-export'}.zip`
    
    return {
      ...results[0],
      filename: zipFilename,
      format: 'zip' as any
    }
  }
}

// 导出单例实例
export const exportManager = ExportManager.getInstance()

// 导出便捷方法
export const useExportManager = () => {
  return {
    exportManager,
    state: exportManager.state,
    exportSingle: exportManager.exportSingle.bind(exportManager),
    exportBatch: exportManager.exportBatch.bind(exportManager),
    quickExport: exportManager.quickExport.bind(exportManager),
    getRecommendedFormat: exportManager.getRecommendedFormat.bind(exportManager),
    isFormatSupported: exportManager.isFormatSupported.bind(exportManager),
    getFormatInfo: exportManager.getFormatInfo.bind(exportManager),
    estimateFileSize: exportManager.estimateFileSize.bind(exportManager),
    cancelExport: exportManager.cancelExport.bind(exportManager),
    clearError: exportManager.clearError.bind(exportManager)
  }
}
