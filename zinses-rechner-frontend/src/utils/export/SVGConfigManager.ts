/**
 * SVG导出配置管理器
 * 提供SVG导出的预设配置、配置验证、优化建议等功能
 */

import type { ChartSVGExportConfig } from './ChartSVGExporter'
import type { Chart } from 'chart.js'

// SVG导出预设类型
export type SVGExportPreset = 
  | 'web-optimized'
  | 'print-ready' 
  | 'presentation'
  | 'social-media'
  | 'high-quality'
  | 'minimal-size'
  | 'accessibility-focused'
  | 'dark-mode'
  | 'monochrome'

// SVG导出用途
export enum SVGExportPurpose {
  WEB = 'web',
  PRINT = 'print',
  PRESENTATION = 'presentation',
  SOCIAL = 'social',
  ARCHIVE = 'archive',
  DEVELOPMENT = 'development'
}

// SVG质量级别
export enum SVGQualityLevel {
  DRAFT = 'draft',
  STANDARD = 'standard',
  HIGH = 'high',
  ULTRA = 'ultra'
}

// 配置验证结果
export interface SVGConfigValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
  estimatedSize: string
  compatibility: {
    browsers: string[]
    issues: string[]
  }
}

// 预设配置定义
export const SVG_EXPORT_PRESETS: Record<SVGExportPreset, ChartSVGExportConfig> = {
  'web-optimized': {
    width: 800,
    height: 600,
    backgroundColor: 'transparent',
    preserveAspectRatio: true,
    embedFonts: false,
    optimizeSize: true,
    includeMetadata: false,
    includeTitle: true,
    includeLegend: true,
    includeTooltips: false,
    includeAnimation: false,
    includeDataLabels: false,
    dataLabelFormat: 'value',
    colorScheme: 'original',
    strokeWidth: 2,
    fillOpacity: 1.0,
    strokeOpacity: 1.0,
    includeInteractivity: false,
    includeHoverEffects: false,
    enableZoom: false,
    enablePan: false,
    makeResponsive: true,
    minWidth: 300,
    maxWidth: 1200,
    includeGridLines: false,
    includeAxes: true,
    includeDataPoints: true,
    smoothCurves: true,
    shadowEffects: false,
    gradientFills: false,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 12,
    fontWeight: 'normal',
    textColor: '#333333',
    precision: 1,
    vectorOptimization: 'aggressive',
    pathSimplification: true,
    removeRedundantElements: true,
    styling: {
      cssClasses: true,
      inlineStyles: false
    },
    accessibility: {
      ariaLabels: true
    }
  },

  'print-ready': {
    width: 1200,
    height: 900,
    backgroundColor: '#ffffff',
    preserveAspectRatio: true,
    embedFonts: true,
    optimizeSize: false,
    includeMetadata: true,
    includeTitle: true,
    includeLegend: true,
    includeTooltips: false,
    includeAnimation: false,
    includeDataLabels: true,
    dataLabelFormat: 'value',
    colorScheme: 'print-friendly',
    strokeWidth: 1,
    fillOpacity: 1.0,
    strokeOpacity: 1.0,
    includeInteractivity: false,
    includeHoverEffects: false,
    enableZoom: false,
    enablePan: false,
    makeResponsive: false,
    includeGridLines: true,
    includeAxes: true,
    includeDataPoints: true,
    smoothCurves: false,
    shadowEffects: false,
    gradientFills: false,
    fontFamily: 'Times, serif',
    fontSize: 14,
    fontWeight: 'normal',
    textColor: '#000000',
    precision: 2,
    vectorOptimization: 'none',
    pathSimplification: false,
    removeRedundantElements: false,
    styling: {
      cssClasses: false,
      inlineStyles: true
    },
    accessibility: {
      ariaLabels: true
    }
  },

  'presentation': {
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    preserveAspectRatio: true,
    embedFonts: true,
    optimizeSize: false,
    includeMetadata: false,
    includeTitle: true,
    includeLegend: true,
    includeTooltips: false,
    includeAnimation: false,
    includeDataLabels: true,
    dataLabelFormat: 'both',
    colorScheme: 'high-contrast',
    strokeWidth: 3,
    fillOpacity: 0.8,
    strokeOpacity: 1.0,
    includeInteractivity: false,
    includeHoverEffects: false,
    enableZoom: false,
    enablePan: false,
    makeResponsive: false,
    includeGridLines: true,
    includeAxes: true,
    includeDataPoints: true,
    smoothCurves: true,
    shadowEffects: true,
    gradientFills: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: 18,
    fontWeight: 'bold',
    textColor: '#333333',
    precision: 1,
    vectorOptimization: 'basic',
    pathSimplification: false,
    removeRedundantElements: true,
    styling: {
      cssClasses: false,
      inlineStyles: true
    },
    accessibility: {
      ariaLabels: true
    }
  },

  'social-media': {
    width: 1080,
    height: 1080,
    backgroundColor: '#ffffff',
    preserveAspectRatio: true,
    embedFonts: true,
    optimizeSize: true,
    includeMetadata: false,
    includeTitle: true,
    includeLegend: false,
    includeTooltips: false,
    includeAnimation: false,
    includeDataLabels: true,
    dataLabelFormat: 'value',
    colorScheme: 'original',
    strokeWidth: 3,
    fillOpacity: 1.0,
    strokeOpacity: 1.0,
    includeInteractivity: false,
    includeHoverEffects: false,
    enableZoom: false,
    enablePan: false,
    makeResponsive: false,
    includeGridLines: false,
    includeAxes: false,
    includeDataPoints: true,
    smoothCurves: true,
    shadowEffects: false,
    gradientFills: true,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 16,
    fontWeight: 'bold',
    textColor: '#333333',
    precision: 0,
    vectorOptimization: 'basic',
    pathSimplification: true,
    removeRedundantElements: true,
    styling: {
      cssClasses: false,
      inlineStyles: true
    },
    accessibility: {
      ariaLabels: false
    }
  },

  'high-quality': {
    width: 2400,
    height: 1800,
    backgroundColor: '#ffffff',
    preserveAspectRatio: true,
    embedFonts: true,
    optimizeSize: false,
    includeMetadata: true,
    includeTitle: true,
    includeLegend: true,
    includeTooltips: false,
    includeAnimation: false,
    includeDataLabels: true,
    dataLabelFormat: 'both',
    colorScheme: 'original',
    strokeWidth: 2,
    fillOpacity: 1.0,
    strokeOpacity: 1.0,
    includeInteractivity: false,
    includeHoverEffects: false,
    enableZoom: false,
    enablePan: false,
    makeResponsive: false,
    includeGridLines: true,
    includeAxes: true,
    includeDataPoints: true,
    smoothCurves: true,
    shadowEffects: true,
    gradientFills: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    fontWeight: 'normal',
    textColor: '#333333',
    precision: 3,
    vectorOptimization: 'none',
    pathSimplification: false,
    removeRedundantElements: false,
    styling: {
      cssClasses: false,
      inlineStyles: true
    },
    accessibility: {
      ariaLabels: true
    }
  },

  'minimal-size': {
    width: 600,
    height: 400,
    backgroundColor: 'transparent',
    preserveAspectRatio: true,
    embedFonts: false,
    optimizeSize: true,
    includeMetadata: false,
    includeTitle: false,
    includeLegend: false,
    includeTooltips: false,
    includeAnimation: false,
    includeDataLabels: false,
    dataLabelFormat: 'value',
    colorScheme: 'original',
    strokeWidth: 1,
    fillOpacity: 1.0,
    strokeOpacity: 1.0,
    includeInteractivity: false,
    includeHoverEffects: false,
    enableZoom: false,
    enablePan: false,
    makeResponsive: true,
    minWidth: 200,
    maxWidth: 800,
    includeGridLines: false,
    includeAxes: false,
    includeDataPoints: true,
    smoothCurves: false,
    shadowEffects: false,
    gradientFills: false,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 10,
    fontWeight: 'normal',
    textColor: '#666666',
    precision: 0,
    vectorOptimization: 'aggressive',
    pathSimplification: true,
    removeRedundantElements: true,
    styling: {
      cssClasses: true,
      inlineStyles: false
    },
    accessibility: {
      ariaLabels: false
    }
  },

  'accessibility-focused': {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    preserveAspectRatio: true,
    embedFonts: true,
    optimizeSize: false,
    includeMetadata: true,
    includeTitle: true,
    includeLegend: true,
    includeTooltips: false,
    includeAnimation: false,
    includeDataLabels: true,
    dataLabelFormat: 'both',
    colorScheme: 'high-contrast',
    strokeWidth: 3,
    fillOpacity: 1.0,
    strokeOpacity: 1.0,
    includeInteractivity: false,
    includeHoverEffects: false,
    enableZoom: false,
    enablePan: false,
    makeResponsive: true,
    minWidth: 400,
    maxWidth: 1200,
    includeGridLines: true,
    includeAxes: true,
    includeDataPoints: true,
    smoothCurves: false,
    shadowEffects: false,
    gradientFills: false,
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    fontWeight: 'bold',
    textColor: '#000000',
    precision: 1,
    vectorOptimization: 'basic',
    pathSimplification: false,
    removeRedundantElements: true,
    styling: {
      cssClasses: false,
      inlineStyles: true
    },
    accessibility: {
      ariaLabels: true
    }
  },

  'dark-mode': {
    width: 800,
    height: 600,
    backgroundColor: '#1a1a1a',
    preserveAspectRatio: true,
    embedFonts: true,
    optimizeSize: true,
    includeMetadata: false,
    includeTitle: true,
    includeLegend: true,
    includeTooltips: false,
    includeAnimation: false,
    includeDataLabels: false,
    dataLabelFormat: 'value',
    colorScheme: 'dark-mode',
    strokeWidth: 2,
    fillOpacity: 0.9,
    strokeOpacity: 1.0,
    includeInteractivity: false,
    includeHoverEffects: false,
    enableZoom: false,
    enablePan: false,
    makeResponsive: true,
    minWidth: 300,
    maxWidth: 1200,
    includeGridLines: true,
    includeAxes: true,
    includeDataPoints: true,
    smoothCurves: true,
    shadowEffects: false,
    gradientFills: true,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 12,
    fontWeight: 'normal',
    textColor: '#ffffff',
    precision: 1,
    vectorOptimization: 'basic',
    pathSimplification: true,
    removeRedundantElements: true,
    styling: {
      cssClasses: false,
      inlineStyles: true
    },
    accessibility: {
      ariaLabels: true
    }
  },

  'monochrome': {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    preserveAspectRatio: true,
    embedFonts: true,
    optimizeSize: true,
    includeMetadata: false,
    includeTitle: true,
    includeLegend: true,
    includeTooltips: false,
    includeAnimation: false,
    includeDataLabels: true,
    dataLabelFormat: 'value',
    colorScheme: 'monochrome',
    strokeWidth: 2,
    fillOpacity: 1.0,
    strokeOpacity: 1.0,
    includeInteractivity: false,
    includeHoverEffects: false,
    enableZoom: false,
    enablePan: false,
    makeResponsive: true,
    minWidth: 300,
    maxWidth: 1200,
    includeGridLines: true,
    includeAxes: true,
    includeDataPoints: true,
    smoothCurves: false,
    shadowEffects: false,
    gradientFills: false,
    fontFamily: 'Times, serif',
    fontSize: 12,
    fontWeight: 'normal',
    textColor: '#000000',
    precision: 1,
    vectorOptimization: 'basic',
    pathSimplification: true,
    removeRedundantElements: true,
    styling: {
      cssClasses: false,
      inlineStyles: true
    },
    accessibility: {
      ariaLabels: true
    }
  }
}

/**
 * SVG配置管理器类
 */
export class SVGConfigManager {
  private static instance: SVGConfigManager

  public static getInstance(): SVGConfigManager {
    if (!SVGConfigManager.instance) {
      SVGConfigManager.instance = new SVGConfigManager()
    }
    return SVGConfigManager.instance
  }

  /**
   * 获取预设配置
   */
  public getPresetConfig(preset: SVGExportPreset): ChartSVGExportConfig {
    return { ...SVG_EXPORT_PRESETS[preset] }
  }

  /**
   * 根据用途推荐配置
   */
  public getRecommendedConfig(purpose: SVGExportPurpose): ChartSVGExportConfig {
    const presetMap: Record<SVGExportPurpose, SVGExportPreset> = {
      [SVGExportPurpose.WEB]: 'web-optimized',
      [SVGExportPurpose.PRINT]: 'print-ready',
      [SVGExportPurpose.PRESENTATION]: 'presentation',
      [SVGExportPurpose.SOCIAL]: 'social-media',
      [SVGExportPurpose.ARCHIVE]: 'high-quality',
      [SVGExportPurpose.DEVELOPMENT]: 'minimal-size'
    }

    return this.getPresetConfig(presetMap[purpose])
  }

  /**
   * 根据图表类型优化配置
   */
  public optimizeConfigForChart(
    config: ChartSVGExportConfig,
    chart: Chart
  ): ChartSVGExportConfig {
    const optimizedConfig = { ...config }
    const chartType = chart.config.type

    switch (chartType) {
      case 'line':
        optimizedConfig.smoothCurves = true
        optimizedConfig.includeDataPoints = true
        optimizedConfig.strokeWidth = Math.max(optimizedConfig.strokeWidth || 2, 2)
        break

      case 'bar':
        optimizedConfig.smoothCurves = false
        optimizedConfig.includeDataPoints = false
        optimizedConfig.strokeWidth = 1
        break

      case 'pie':
      case 'doughnut':
        optimizedConfig.includeAxes = false
        optimizedConfig.includeGridLines = false
        optimizedConfig.includeDataLabels = true
        optimizedConfig.dataLabelFormat = 'percentage'
        break

      case 'scatter':
        optimizedConfig.includeDataPoints = true
        optimizedConfig.smoothCurves = false
        optimizedConfig.strokeWidth = 0
        break
    }

    return optimizedConfig
  }

  /**
   * 验证配置
   */
  public validateConfig(config: ChartSVGExportConfig): SVGConfigValidationResult {
    const warnings: string[] = []
    const errors: string[] = []
    const suggestions: string[] = []

    // 尺寸验证
    if (!config.width || config.width <= 0) {
      errors.push('宽度必须大于0')
    }
    if (!config.height || config.height <= 0) {
      errors.push('高度必须大于0')
    }

    // 响应式配置验证
    if (config.makeResponsive) {
      if (config.minWidth && config.maxWidth && config.minWidth >= config.maxWidth) {
        warnings.push('最小宽度应小于最大宽度')
      }
    }

    // 性能相关建议
    if (config.width && config.height && config.width * config.height > 2000000) {
      warnings.push('图表尺寸较大，可能影响性能')
      suggestions.push('考虑减小尺寸或启用矢量优化')
    }

    if (config.shadowEffects && config.gradientFills) {
      suggestions.push('同时使用阴影和渐变可能增加文件大小')
    }

    if (!config.optimizeSize && config.vectorOptimization === 'none') {
      suggestions.push('启用优化选项可以减小文件大小')
    }

    // 可访问性建议
    if (!config.accessibility?.ariaLabels) {
      suggestions.push('启用ARIA标签可以提高可访问性')
    }

    // 估算文件大小
    const estimatedSize = this.estimateFileSize(config)

    // 浏览器兼容性检查
    const compatibility = this.checkBrowserCompatibility(config)

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      suggestions,
      estimatedSize,
      compatibility
    }
  }

  /**
   * 估算文件大小
   */
  private estimateFileSize(config: ChartSVGExportConfig): string {
    let baseSize = 5000 // 基础大小 5KB

    // 尺寸影响
    const pixelCount = (config.width || 800) * (config.height || 600)
    baseSize += pixelCount * 0.001

    // 功能影响
    if (config.includeTitle) baseSize += 500
    if (config.includeLegend) baseSize += 1000
    if (config.includeDataLabels) baseSize += 2000
    if (config.shadowEffects) baseSize += 3000
    if (config.gradientFills) baseSize += 2000
    if (config.embedFonts) baseSize += 10000

    // 优化影响
    if (config.optimizeSize) baseSize *= 0.7
    if (config.vectorOptimization === 'aggressive') baseSize *= 0.5
    else if (config.vectorOptimization === 'basic') baseSize *= 0.8

    if (baseSize > 1024 * 1024) {
      return `${(baseSize / (1024 * 1024)).toFixed(1)} MB`
    } else if (baseSize > 1024) {
      return `${(baseSize / 1024).toFixed(1)} KB`
    } else {
      return `${Math.round(baseSize)} B`
    }
  }

  /**
   * 检查浏览器兼容性
   */
  private checkBrowserCompatibility(config: ChartSVGExportConfig): {
    browsers: string[]
    issues: string[]
  } {
    const browsers: string[] = []
    const issues: string[] = []

    // 基础SVG支持
    browsers.push('Chrome 4+', 'Firefox 3+', 'Safari 3.2+', 'IE 9+', 'Edge 12+')

    // 高级功能检查
    if (config.enableZoom || config.enablePan) {
      issues.push('交互功能在某些旧版浏览器中可能不支持')
    }

    if (config.shadowEffects) {
      issues.push('SVG滤镜在IE中支持有限')
    }

    if (config.gradientFills) {
      issues.push('复杂渐变在某些移动浏览器中可能渲染缓慢')
    }

    return { browsers, issues }
  }
}

// 导出单例实例
export const svgConfigManager = SVGConfigManager.getInstance()

// 便捷函数
export function getSVGPreset(preset: SVGExportPreset): ChartSVGExportConfig {
  return svgConfigManager.getPresetConfig(preset)
}

export function getRecommendedSVGConfig(purpose: SVGExportPurpose): ChartSVGExportConfig {
  return svgConfigManager.getRecommendedConfig(purpose)
}

export function validateSVGConfig(config: ChartSVGExportConfig): SVGConfigValidationResult {
  return svgConfigManager.validateConfig(config)
}
