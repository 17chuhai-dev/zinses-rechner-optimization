/**
 * 图表导出功能统一入口
 * 导出所有导出相关的类、接口和工具函数
 */

// 核心导出引擎
export {
  ChartExportEngine,
  chartExportEngine,
  ExportFormat,
  ExportQuality,
  type ExportConfig,
  type ExportResult,
  type ExportMetadata,
  type BatchExportConfig,
  type BatchExportResult
} from './ChartExportEngine'

// 导出工具类
export {
  ExportUtils,
  EXPORT_PRESETS,
  FORMAT_INFO,
  FileSizeUnit
} from './ExportUtils'

// 配置管理器
export {
  ExportConfigManager,
  exportConfigManager,
  type UserExportPreferences,
  type ExportTemplate,
  type ExportHistory
} from './ExportConfigManager'

// PNG高分辨率导出
export {
  PNGRenderEngine,
  pngRenderEngine,
  RenderQuality,
  AntiAliasMode,
  ColorSpace,
  type PNGRenderConfig,
  type PNGRenderResult,
  type RenderStats
} from './PNGRenderEngine'

export {
  PNGConfigManager,
  pngConfigManager,
  PNGExportPurpose,
  PNG_PRESETS,
  DPI_PRESETS,
  RESOLUTION_PRESETS
} from './PNGConfigManager'

export {
  PNGUtils,
  pngUtils,
  exportPNGForWeb,
  exportPNGForPrint,
  exportPNGForSocial,
  exportPNGHighRes,
  type PNGExportOptions,
  type PNGBatchExportOptions
} from './PNGUtils'

// DPI和分辨率控制系统
export {
  DPICalculationEngine,
  dpiCalculationEngine,
  SizeUnit,
  DPI_PRESETS,
  PAPER_SIZES,
  DEVICE_DPI_RANGES,
  type DPICalculationResult
} from './DPICalculationEngine'

export {
  SizeUnitConverter,
  sizeUnitConverter,
  UNIT_INFO,
  CONVERSION_PRESETS,
  type ConversionResult,
  type UnitInfo,
  type ConversionContext
} from './SizeUnitConverter'

export {
  PixelDensityScaler,
  pixelDensityScaler,
  ScalingAlgorithm,
  EdgeMode,
  SCALING_PRESETS,
  type ScalingConfig,
  type ScalingResult,
  type PixelDensityInfo
} from './PixelDensityScaler'

export {
  ResolutionManager,
  resolutionManager,
  ResolutionPreset,
  AspectRatio,
  RESOLUTION_PRESETS,
  ASPECT_RATIO_INFO,
  type ResolutionInfo,
  type ResolutionValidation,
  type ResolutionCalculation
} from './ResolutionManager'

export {
  DeviceAdaptationDetector,
  deviceAdaptationDetector,
  DeviceType,
  PerformanceLevel,
  type DeviceCapabilities,
  type AdaptationRecommendation,
  type DeviceDetectionResult
} from './DeviceAdaptationDetector'

export {
  DPIPreviewSystem,
  dpiPreviewSystem,
  DEFAULT_PREVIEW_CONFIG,
  DPI_PREVIEW_PRESETS,
  type PreviewConfig,
  type PreviewResult,
  type PreviewComparison,
  type PreviewEvents
} from './DPIPreviewSystem'

export {
  SmartResolutionEngine,
  smartResolutionEngine,
  DEFAULT_WEIGHTS,
  type RecommendationContext,
  type RecommendationResult,
  type LearningData,
  type RecommendationWeights
} from './SmartResolutionEngine'

// 便捷导出函数
import { chartExportEngine } from './ChartExportEngine'
import { exportConfigManager } from './ExportConfigManager'
import { ExportUtils, EXPORT_PRESETS } from './ExportUtils'
import { PNGUtils, PNGExportPurpose } from './PNGUtils'
import { dpiCalculationEngine } from './DPICalculationEngine'
import { sizeUnitConverter, SizeUnit } from './SizeUnitConverter'
import { pixelDensityScaler } from './PixelDensityScaler'
import { resolutionManager, ResolutionPreset } from './ResolutionManager'
import { deviceAdaptationDetector } from './DeviceAdaptationDetector'
import { dpiPreviewSystem } from './DPIPreviewSystem'
import { smartResolutionEngine } from './SmartResolutionEngine'
import type { Chart } from 'chart.js'

/**
 * 快速导出图表（使用默认配置）
 */
export async function quickExport(
  chart: Chart | HTMLElement,
  format: 'png' | 'svg' | 'pdf' | 'jpeg' = 'png'
) {
  const config = exportConfigManager.createConfigFromPreferences({
    format: format as any
  })

  return await chartExportEngine.exportChart(chart, config)
}

/**
 * 使用预设配置导出图表
 */
export async function exportWithPreset(
  chart: Chart | HTMLElement,
  presetName: keyof typeof EXPORT_PRESETS
) {
  const config = ExportUtils.getRecommendedConfig(presetName)
  return await chartExportEngine.exportChart(chart, config)
}

/**
 * 使用模板导出图表
 */
export async function exportWithTemplate(
  chart: Chart | HTMLElement,
  templateId: string
) {
  const config = exportConfigManager.useTemplate(templateId)
  if (!config) {
    throw new Error(`模板不存在: ${templateId}`)
  }

  return await chartExportEngine.exportChart(chart, config)
}

/**
 * 批量导出多个图表
 */
export async function batchExport(
  charts: Array<{
    chart: Chart | HTMLElement
    filename?: string
    format?: 'png' | 'svg' | 'pdf' | 'jpeg'
  }>,
  onProgress?: (completed: number, total: number) => void
) {
  const batchConfig = {
    charts: charts.map(({ chart, filename, format = 'png' }) => ({
      chart,
      config: exportConfigManager.createConfigFromPreferences({
        format: format as any,
        filename
      })
    })),
    onProgress
  }

  return await chartExportEngine.exportBatch(batchConfig)
}

/**
 * 导出为社交媒体格式
 */
export async function exportForSocialMedia(chart: Chart | HTMLElement) {
  return await exportWithPreset(chart, 'SOCIAL_MEDIA')
}

/**
 * 导出为打印格式
 */
export async function exportForPrint(chart: Chart | HTMLElement) {
  return await exportWithPreset(chart, 'PRINT')
}

/**
 * 导出为网页展示格式
 */
export async function exportForWeb(chart: Chart | HTMLElement) {
  return await exportWithPreset(chart, 'WEB_DISPLAY')
}

/**
 * 导出为演示文稿格式
 */
export async function exportForPresentation(chart: Chart | HTMLElement) {
  return await exportWithPreset(chart, 'PRESENTATION')
}

/**
 * 导出为矢量格式
 */
export async function exportAsVector(chart: Chart | HTMLElement) {
  return await exportWithPreset(chart, 'VECTOR')
}

/**
 * 导出为缩略图
 */
export async function exportAsThumbnail(chart: Chart | HTMLElement) {
  return await exportWithPreset(chart, 'THUMBNAIL')
}

/**
 * PNG高分辨率导出 - 网页用途
 */
export async function exportPNGWeb(chart: Chart | HTMLElement, filename?: string) {
  return await PNGUtils.exportForPurpose(chart, PNGExportPurpose.WEB_DISPLAY, { filename })
}

/**
 * PNG高分辨率导出 - 打印用途
 */
export async function exportPNGPrint(chart: Chart | HTMLElement, filename?: string) {
  return await PNGUtils.exportForPurpose(chart, PNGExportPurpose.PRINT_SMALL, { filename })
}

/**
 * PNG高分辨率导出 - 社交媒体
 */
export async function exportPNGSocial(chart: Chart | HTMLElement, filename?: string) {
  return await PNGUtils.exportForPurpose(chart, PNGExportPurpose.SOCIAL_MEDIA, { filename })
}

/**
 * PNG高分辨率导出 - 自定义分辨率
 */
export async function exportPNGCustom(
  chart: Chart | HTMLElement,
  width: number,
  height: number,
  dpi: number = 300,
  filename?: string
) {
  return await PNGUtils.exportHighResolution(chart, width, height, dpi, { filename })
}

/**
 * 计算DPI和物理尺寸
 */
export function calculateDPI(
  pixelWidth: number,
  pixelHeight: number,
  physicalWidth: number,
  physicalHeight: number,
  unit: SizeUnit = SizeUnit.INCHES
) {
  return dpiCalculationEngine.calculateDPIFromSize(
    pixelWidth,
    pixelHeight,
    physicalWidth,
    physicalHeight,
    unit
  )
}

/**
 * 根据DPI计算像素尺寸
 */
export function calculatePixelSize(
  physicalWidth: number,
  physicalHeight: number,
  dpi: number,
  unit: SizeUnit = SizeUnit.INCHES
) {
  return dpiCalculationEngine.calculatePixelSize(physicalWidth, physicalHeight, dpi, unit)
}

/**
 * 根据DPI计算物理尺寸
 */
export function calculatePhysicalSize(
  pixelWidth: number,
  pixelHeight: number,
  dpi: number,
  unit: SizeUnit = SizeUnit.INCHES
) {
  return dpiCalculationEngine.calculatePhysicalSize(pixelWidth, pixelHeight, dpi, unit)
}

/**
 * 单位转换
 */
export function convertSize(
  value: number,
  fromUnit: SizeUnit,
  toUnit: SizeUnit,
  dpi?: number
) {
  return sizeUnitConverter.convert(value, fromUnit, toUnit, { dpi })
}

/**
 * 像素到物理单位转换
 */
export function pixelsToPhysical(
  pixels: number,
  toUnit: SizeUnit,
  dpi: number = 96
) {
  return sizeUnitConverter.pixelsToPhysical(pixels, toUnit, dpi)
}

/**
 * 物理单位到像素转换
 */
export function physicalToPixels(
  value: number,
  fromUnit: SizeUnit,
  dpi: number = 96
) {
  return sizeUnitConverter.physicalToPixels(value, fromUnit, dpi)
}

/**
 * 获取预设分辨率信息
 */
export function getResolutionPreset(preset: ResolutionPreset) {
  return resolutionManager.getPresetInfo(preset)
}

/**
 * 计算分辨率详细信息
 */
export function calculateResolutionInfo(
  width: number,
  height: number,
  dpi: number = 96,
  preset?: ResolutionPreset
) {
  return resolutionManager.calculateResolution(width, height, dpi, preset)
}

/**
 * 验证分辨率设置
 */
export function validateResolution(width: number, height: number, dpi?: number) {
  return resolutionManager.validateResolution(width, height, dpi)
}

/**
 * 保持宽高比调整尺寸
 */
export function adjustWithAspectRatio(
  currentWidth: number,
  currentHeight: number,
  newWidth?: number,
  newHeight?: number
) {
  return resolutionManager.adjustWithAspectRatio(currentWidth, currentHeight, newWidth, newHeight)
}

/**
 * 检测设备能力并获取适配建议
 */
export async function detectDeviceAndGetRecommendations() {
  return await deviceAdaptationDetector.detectDevice()
}

/**
 * 获取推荐分辨率
 */
export function getRecommendedResolutions(purpose: 'web' | 'social' | 'print' | 'mobile' | 'presentation') {
  return resolutionManager.getRecommendedResolutions(purpose)
}

/**
 * 生成DPI预览
 */
export async function generateDPIPreview(
  sourceCanvas: HTMLCanvasElement,
  dpi: number,
  config?: Partial<any>
) {
  return await dpiPreviewSystem.generatePreview(sourceCanvas, dpi, config)
}

/**
 * 生成DPI对比预览
 */
export async function generateDPIComparison(
  sourceCanvas: HTMLCanvasElement,
  config?: Partial<any>
) {
  return await dpiPreviewSystem.generateComparison(sourceCanvas, config)
}

/**
 * 获取智能分辨率推荐
 */
export async function getSmartRecommendation(
  sourceWidth: number,
  sourceHeight: number,
  context: any
) {
  return await smartResolutionEngine.getRecommendation(sourceWidth, sourceHeight, context)
}

/**
 * 记录用户选择用于学习
 */
export function recordUserChoice(
  context: any,
  chosenSettings: { dpi: number; resolution: { width: number; height: number } },
  satisfaction: number,
  actualMetrics?: { fileSize: number; renderTime: number; qualityRating: number }
) {
  return smartResolutionEngine.recordUserChoice(context, chosenSettings, satisfaction, actualMetrics)
}

/**
 * 获取用途推荐
 */
export function getRecommendationsByPurpose(purpose: any) {
  return smartResolutionEngine.getRecommendationsByPurpose(purpose)
}

/**
 * 获取导出建议
 */
export function getExportRecommendation(purpose: string) {
  return ExportUtils.getBestFormatRecommendation(purpose)
}

/**
 * 验证导出配置
 */
export function validateExportConfig(config: any) {
  return ExportUtils.validateConfig(config)
}

/**
 * 估算文件大小
 */
export function estimateExportSize(config: any) {
  return ExportUtils.estimateFileSize(config)
}

/**
 * 检查浏览器支持
 */
export function checkExportSupport() {
  return ExportUtils.checkBrowserSupport()
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number) {
  return ExportUtils.formatFileSize(bytes)
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFilename(baseName?: string, format?: string) {
  return ExportUtils.generateUniqueFilename(baseName, format as any)
}

/**
 * 优化导出配置
 */
export function optimizeExportConfig(config: any, constraints?: any) {
  return ExportUtils.optimizeConfig(config, constraints)
}

/**
 * 创建进度跟踪器
 */
export function createProgressTracker(total: number) {
  return ExportUtils.createProgressTracker(total)
}

/**
 * 导出设置管理
 */
export const exportSettings = {
  /**
   * 获取用户偏好
   */
  getPreferences() {
    return exportConfigManager.getUserPreferences()
  },

  /**
   * 保存用户偏好
   */
  savePreferences(preferences: any) {
    return exportConfigManager.saveUserPreferences(preferences)
  },

  /**
   * 获取所有模板
   */
  getTemplates() {
    return exportConfigManager.getTemplates()
  },

  /**
   * 保存新模板
   */
  saveTemplate(template: any) {
    return exportConfigManager.saveTemplate(template)
  },

  /**
   * 删除模板
   */
  deleteTemplate(id: string) {
    return exportConfigManager.deleteTemplate(id)
  },

  /**
   * 获取导出历史
   */
  getHistory() {
    return exportConfigManager.getHistory()
  },

  /**
   * 清除历史
   */
  clearHistory() {
    return exportConfigManager.clearHistory()
  },

  /**
   * 获取统计信息
   */
  getStats() {
    return exportConfigManager.getExportStats()
  },

  /**
   * 导出设置
   */
  exportSettings() {
    return exportConfigManager.exportSettings()
  },

  /**
   * 导入设置
   */
  importSettings(data: string) {
    return exportConfigManager.importSettings(data)
  },

  /**
   * 重置所有设置
   */
  resetAll() {
    return exportConfigManager.resetAllSettings()
  }
}

// 默认导出主要功能
export default {
  // 核心功能
  quickExport,
  exportWithPreset,
  exportWithTemplate,
  batchExport,

  // 便捷方法
  exportForSocialMedia,
  exportForPrint,
  exportForWeb,
  exportForPresentation,
  exportAsVector,
  exportAsThumbnail,

  // PNG高分辨率导出
  exportPNGWeb,
  exportPNGPrint,
  exportPNGSocial,
  exportPNGCustom,

  // 工具方法
  getExportRecommendation,
  validateExportConfig,
  estimateExportSize,
  checkExportSupport,
  formatFileSize,
  generateUniqueFilename,
  optimizeExportConfig,
  createProgressTracker,

  // 设置管理
  settings: exportSettings,

  // 引擎实例
  engine: chartExportEngine,
  configManager: exportConfigManager,
  utils: ExportUtils,

  // PNG专用功能
  pngEngine: pngRenderEngine,
  pngConfig: pngConfigManager,
  pngUtils: PNGUtils,

  // DPI和分辨率控制
  calculateDPI,
  calculatePixelSize,
  calculatePhysicalSize,
  convertSize,
  pixelsToPhysical,
  physicalToPixels,

  // DPI引擎实例
  dpiEngine: dpiCalculationEngine,
  sizeConverter: sizeUnitConverter,
  pixelScaler: pixelDensityScaler,

  // 分辨率和设备适配
  getResolutionPreset,
  calculateResolutionInfo,
  validateResolution,
  adjustWithAspectRatio,
  detectDeviceAndGetRecommendations,
  getRecommendedResolutions,

  // 管理器实例
  resolutionManager,
  deviceDetector: deviceAdaptationDetector,

  // DPI预览和智能推荐
  generateDPIPreview,
  generateDPIComparison,
  getSmartRecommendation,
  recordUserChoice,
  getRecommendationsByPurpose,

  // 系统实例
  dpiPreviewSystem,
  smartResolutionEngine
}
