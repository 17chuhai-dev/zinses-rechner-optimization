/**
 * 导出功能composable
 * 管理导出状态、进度和用户反馈
 */

import { ref, computed } from 'vue'
import { ExportService, type ExportOptions } from '@/services/exportService'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'

export type ExportFormat = 'csv' | 'excel' | 'pdf'

interface ExportState {
  isExporting: boolean
  currentFormat: ExportFormat | null
  progress: number
  error: string | null
  success: boolean
}

export function useExport() {
  const exportService = ExportService.getInstance()
  
  // 导出状态
  const state = ref<ExportState>({
    isExporting: false,
    currentFormat: null,
    progress: 0,
    error: null,
    success: false
  })

  // 计算属性
  const isExporting = computed(() => state.value.isExporting)
  const exportError = computed(() => state.value.error)
  const exportSuccess = computed(() => state.value.success)
  const exportProgress = computed(() => state.value.progress)
  const currentExportFormat = computed(() => state.value.currentFormat)

  // 重置状态
  const resetState = () => {
    state.value = {
      isExporting: false,
      currentFormat: null,
      progress: 0,
      error: null,
      success: false
    }
  }

  // 设置导出状态
  const setExportState = (format: ExportFormat, progress: number = 0) => {
    state.value.isExporting = true
    state.value.currentFormat = format
    state.value.progress = progress
    state.value.error = null
    state.value.success = false
  }

  // 设置成功状态
  const setSuccess = () => {
    state.value.isExporting = false
    state.value.success = true
    state.value.progress = 100
    
    // 3秒后重置成功状态
    setTimeout(() => {
      if (state.value.success) {
        resetState()
      }
    }, 3000)
  }

  // 设置错误状态
  const setError = (error: string) => {
    state.value.isExporting = false
    state.value.error = error
    state.value.progress = 0
    
    // 5秒后重置错误状态
    setTimeout(() => {
      if (state.value.error === error) {
        resetState()
      }
    }, 5000)
  }

  // 更新进度
  const updateProgress = (progress: number) => {
    state.value.progress = Math.min(100, Math.max(0, progress))
  }

  /**
   * 导出为CSV
   */
  const exportToCSV = async (
    result: CalculationResult,
    form: CalculatorForm,
    options: ExportOptions = {}
  ): Promise<void> => {
    try {
      setExportState('csv', 10)
      
      updateProgress(30)
      await new Promise(resolve => setTimeout(resolve, 200)) // 模拟处理时间
      
      updateProgress(60)
      await exportService.exportToCSV(result, form, options)
      
      updateProgress(100)
      setSuccess()
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV导出失败'
      setError(message)
      throw error
    }
  }

  /**
   * 导出为Excel
   */
  const exportToExcel = async (
    result: CalculationResult,
    form: CalculatorForm,
    options: ExportOptions = {}
  ): Promise<void> => {
    try {
      setExportState('excel', 10)
      
      updateProgress(25)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      updateProgress(50)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      updateProgress(75)
      await exportService.exportToExcel(result, form, options)
      
      updateProgress(100)
      setSuccess()
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Excel导出失败'
      setError(message)
      throw error
    }
  }

  /**
   * 导出为PDF
   */
  const exportToPDF = async (
    result: CalculationResult,
    form: CalculatorForm,
    chartElement?: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> => {
    try {
      setExportState('pdf', 10)
      
      updateProgress(20)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      updateProgress(40)
      await new Promise(resolve => setTimeout(resolve, 500)) // PDF生成需要更多时间
      
      updateProgress(70)
      await exportService.exportToPDF(result, form, chartElement, options)
      
      updateProgress(100)
      setSuccess()
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF导出失败'
      setError(message)
      throw error
    }
  }

  /**
   * 批量导出所有格式
   */
  const exportAll = async (
    result: CalculationResult,
    form: CalculatorForm,
    chartElement?: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> => {
    try {
      // CSV
      await exportToCSV(result, form, options)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Excel
      await exportToExcel(result, form, { ...options, includeFormula: true })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // PDF
      await exportToPDF(result, form, chartElement, { ...options, includeChart: true })
      
    } catch (error) {
      // 错误已经在各个导出函数中处理
      throw error
    }
  }

  /**
   * 获取导出格式的显示名称
   */
  const getFormatDisplayName = (format: ExportFormat): string => {
    const names: Record<ExportFormat, string> = {
      csv: 'CSV-Datei',
      excel: 'Excel-Arbeitsmappe',
      pdf: 'PDF-Bericht'
    }
    return names[format]
  }

  /**
   * 获取导出格式的图标
   */
  const getFormatIcon = (format: ExportFormat): string => {
    const icons: Record<ExportFormat, string> = {
      csv: '📊',
      excel: '📈',
      pdf: '📄'
    }
    return icons[format]
  }

  /**
   * 获取导出状态的描述
   */
  const getStatusMessage = (): string => {
    if (state.value.success) {
      return `${getFormatDisplayName(state.value.currentFormat!)} erfolgreich heruntergeladen!`
    }
    
    if (state.value.error) {
      return state.value.error
    }
    
    if (state.value.isExporting && state.value.currentFormat) {
      return `${getFormatDisplayName(state.value.currentFormat)} wird erstellt...`
    }
    
    return ''
  }

  /**
   * 检查浏览器兼容性
   */
  const checkBrowserSupport = (): { supported: boolean; message?: string } => {
    // 检查必要的API支持
    if (!window.Blob) {
      return {
        supported: false,
        message: 'Ihr Browser unterstützt keine Datei-Downloads. Bitte verwenden Sie einen modernen Browser.'
      }
    }
    
    if (!window.URL || !window.URL.createObjectURL) {
      return {
        supported: false,
        message: 'Ihr Browser unterstützt keine Datei-URLs. Bitte aktualisieren Sie Ihren Browser.'
      }
    }
    
    return { supported: true }
  }

  /**
   * 清除错误状态
   */
  const clearError = () => {
    state.value.error = null
  }

  /**
   * 清除成功状态
   */
  const clearSuccess = () => {
    state.value.success = false
  }

  return {
    // 状态
    isExporting,
    exportError,
    exportSuccess,
    exportProgress,
    currentExportFormat,
    
    // 方法
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportAll,
    resetState,
    clearError,
    clearSuccess,
    
    // 工具方法
    getFormatDisplayName,
    getFormatIcon,
    getStatusMessage,
    checkBrowserSupport
  }
}
