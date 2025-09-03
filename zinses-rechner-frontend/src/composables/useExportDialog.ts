/**
 * 导出对话框 Composable
 * 提供统一的导出对话框管理功能
 */

import { ref, computed } from 'vue'
import { useExportManager, type ExportOptions, type BatchExportOptions } from '@/services/ExportManager'
import { ExportFormat } from '@/utils/export'
import type { Chart } from 'chart.js'

// 导出对话框状态接口
export interface ExportDialogState {
  isOpen: boolean
  chart: Chart | HTMLElement | null
  availableFormats: ExportFormat[]
  defaultFormat?: ExportFormat
  showPreview: boolean
}

// 导出对话框选项接口
export interface ExportDialogOptions {
  chart?: Chart | HTMLElement
  availableFormats?: ExportFormat[]
  defaultFormat?: ExportFormat
  showPreview?: boolean
  autoClose?: boolean
}

/**
 * 导出对话框 Composable
 */
export function useExportDialog() {
  const { exportManager, state: exportState } = useExportManager()

  // 对话框状态
  const dialogState = ref<ExportDialogState>({
    isOpen: false,
    chart: null,
    availableFormats: ['png', 'svg', 'pdf', 'csv', 'excel'],
    showPreview: true
  })

  // 导出历史记录
  const exportHistory = ref<Array<{
    id: string
    format: ExportFormat
    filename: string
    size: number
    timestamp: Date
  }>>([])

  // 用户偏好设置
  const userPreferences = ref({
    defaultFormat: 'png' as ExportFormat,
    autoDownload: true,
    showPreview: true,
    rememberLastSettings: true
  })

  // 计算属性
  const isExporting = computed(() => exportState.isExporting)
  const exportProgress = computed(() => exportState.progress)
  const exportError = computed(() => exportState.error)
  const currentFormat = computed(() => exportState.currentFormat)

  // 是否可以导出
  const canExport = computed(() => {
    return dialogState.value.chart !== null && !isExporting.value
  })

  // 推荐的导出格式
  const recommendedFormats = computed(() => {
    const formats = dialogState.value.availableFormats
    const recommendations: { format: ExportFormat; reason: string }[] = []

    if (formats.includes('png')) {
      recommendations.push({
        format: 'png',
        reason: 'Universell einsetzbar, hohe Qualität'
      })
    }

    if (formats.includes('svg')) {
      recommendations.push({
        format: 'svg',
        reason: 'Skalierbar, kleine Dateigröße'
      })
    }

    if (formats.includes('pdf')) {
      recommendations.push({
        format: 'pdf',
        reason: 'Professionelle Berichte, druckoptimiert'
      })
    }

    return recommendations
  })

  /**
   * 打开导出对话框
   */
  const openDialog = (options: ExportDialogOptions = {}) => {
    dialogState.value = {
      isOpen: true,
      chart: options.chart || null,
      availableFormats: options.availableFormats || ['png', 'svg', 'pdf', 'csv', 'excel'],
      defaultFormat: options.defaultFormat || userPreferences.value.defaultFormat,
      showPreview: options.showPreview ?? userPreferences.value.showPreview
    }

    // 清除之前的错误状态
    exportManager.clearError()
  }

  /**
   * 关闭导出对话框
   */
  const closeDialog = () => {
    dialogState.value.isOpen = false
    dialogState.value.chart = null
    
    // 如果正在导出，询问是否取消
    if (isExporting.value) {
      const shouldCancel = confirm('Export läuft noch. Möchten Sie abbrechen?')
      if (shouldCancel) {
        exportManager.cancelExport()
      }
    }
  }

  /**
   * 快速导出（不显示对话框）
   */
  const quickExport = async (
    chart: Chart | HTMLElement,
    format: ExportFormat = 'png'
  ) => {
    try {
      const result = await exportManager.quickExport(chart, format)
      
      // 添加到历史记录
      addToHistory({
        id: `quick_${Date.now()}`,
        format,
        filename: result.filename || `export.${format}`,
        size: result.blob?.size || 0,
        timestamp: new Date()
      })

      return result
    } catch (error) {
      console.error('Quick export failed:', error)
      throw error
    }
  }

  /**
   * 批量导出
   */
  const batchExport = async (
    chart: Chart | HTMLElement,
    options: BatchExportOptions
  ) => {
    try {
      const results = await exportManager.exportBatch(chart, options)
      
      // 添加到历史记录
      results.forEach(result => {
        addToHistory({
          id: `batch_${Date.now()}_${Math.random()}`,
          format: result.format as ExportFormat,
          filename: result.filename || `export.${result.format}`,
          size: result.blob?.size || 0,
          timestamp: new Date()
        })
      })

      return results
    } catch (error) {
      console.error('Batch export failed:', error)
      throw error
    }
  }

  /**
   * 导出为社交媒体格式
   */
  const exportForSocialMedia = async (chart: Chart | HTMLElement) => {
    const options: ExportOptions = {
      format: 'png',
      quality: 'high',
      customConfig: {
        width: 1200,
        height: 630, // 社交媒体推荐尺寸
        backgroundColor: '#ffffff'
      }
    }

    return exportManager.exportSingle(chart, options)
  }

  /**
   * 导出为打印格式
   */
  const exportForPrint = async (chart: Chart | HTMLElement) => {
    const options: ExportOptions = {
      format: 'pdf',
      quality: 'ultra',
      includeChart: true,
      includeData: true,
      includeMetadata: true
    }

    return exportManager.exportSingle(chart, options)
  }

  /**
   * 导出为数据分析格式
   */
  const exportForAnalysis = async (chart: Chart | HTMLElement) => {
    const options: ExportOptions = {
      format: 'excel',
      includeChart: true,
      includeData: true,
      includeFormulas: true,
      includeMetadata: true
    }

    return exportManager.exportSingle(chart, options)
  }

  /**
   * 获取导出建议
   */
  const getExportRecommendation = (purpose: 'web' | 'print' | 'social' | 'analysis') => {
    const recommendations = {
      web: {
        format: 'png' as ExportFormat,
        quality: 'high' as const,
        description: 'Optimiert für Web-Veröffentlichung'
      },
      print: {
        format: 'pdf' as ExportFormat,
        quality: 'ultra' as const,
        description: 'Hochauflösend für professionellen Druck'
      },
      social: {
        format: 'png' as ExportFormat,
        quality: 'high' as const,
        description: 'Optimiert für soziale Medien'
      },
      analysis: {
        format: 'excel' as ExportFormat,
        quality: 'medium' as const,
        description: 'Mit Daten für weitere Analyse'
      }
    }

    return recommendations[purpose]
  }

  /**
   * 保存用户偏好
   */
  const saveUserPreferences = (preferences: Partial<typeof userPreferences.value>) => {
    Object.assign(userPreferences.value, preferences)
    
    // 保存到本地存储
    try {
      localStorage.setItem('export-preferences', JSON.stringify(userPreferences.value))
    } catch (error) {
      console.warn('Failed to save export preferences:', error)
    }
  }

  /**
   * 加载用户偏好
   */
  const loadUserPreferences = () => {
    try {
      const saved = localStorage.getItem('export-preferences')
      if (saved) {
        const preferences = JSON.parse(saved)
        Object.assign(userPreferences.value, preferences)
      }
    } catch (error) {
      console.warn('Failed to load export preferences:', error)
    }
  }

  /**
   * 添加到历史记录
   */
  const addToHistory = (entry: {
    id: string
    format: ExportFormat
    filename: string
    size: number
    timestamp: Date
  }) => {
    exportHistory.value.unshift(entry)
    
    // 限制历史记录数量
    if (exportHistory.value.length > 50) {
      exportHistory.value = exportHistory.value.slice(0, 50)
    }

    // 保存到本地存储
    try {
      localStorage.setItem('export-history', JSON.stringify(exportHistory.value))
    } catch (error) {
      console.warn('Failed to save export history:', error)
    }
  }

  /**
   * 清除历史记录
   */
  const clearHistory = () => {
    exportHistory.value = []
    try {
      localStorage.removeItem('export-history')
    } catch (error) {
      console.warn('Failed to clear export history:', error)
    }
  }

  /**
   * 加载历史记录
   */
  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('export-history')
      if (saved) {
        exportHistory.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load export history:', error)
    }
  }

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 获取格式显示名称
   */
  const getFormatDisplayName = (format: ExportFormat): string => {
    const names = {
      png: 'PNG-Bild',
      svg: 'SVG-Vektor',
      pdf: 'PDF-Dokument',
      csv: 'CSV-Datei',
      excel: 'Excel-Arbeitsmappe'
    }
    return names[format] || format.toUpperCase()
  }

  // 初始化
  loadUserPreferences()
  loadHistory()

  return {
    // 状态
    dialogState: dialogState.value,
    exportHistory,
    userPreferences,
    
    // 计算属性
    isExporting,
    exportProgress,
    exportError,
    currentFormat,
    canExport,
    recommendedFormats,
    
    // 方法
    openDialog,
    closeDialog,
    quickExport,
    batchExport,
    exportForSocialMedia,
    exportForPrint,
    exportForAnalysis,
    getExportRecommendation,
    saveUserPreferences,
    loadUserPreferences,
    addToHistory,
    clearHistory,
    loadHistory,
    formatFileSize,
    getFormatDisplayName,
    
    // 导出管理器方法
    cancelExport: exportManager.cancelExport.bind(exportManager),
    clearError: exportManager.clearError.bind(exportManager),
    getFormatInfo: exportManager.getFormatInfo.bind(exportManager),
    estimateFileSize: exportManager.estimateFileSize.bind(exportManager)
  }
}
