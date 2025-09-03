/**
 * 分辨率管理系统
 * 提供分辨率预设、自定义分辨率设置、宽高比保持等功能
 */

import { dpiCalculationEngine, SizeUnit, type DPICalculationResult } from './DPICalculationEngine'
import { sizeUnitConverter } from './SizeUnitConverter'

// 分辨率预设类型
export enum ResolutionPreset {
  // 网页常用分辨率
  WEB_SMALL = 'web_small',           // 640x480
  WEB_MEDIUM = 'web_medium',         // 800x600
  WEB_LARGE = 'web_large',           // 1024x768
  WEB_HD = 'web_hd',                 // 1280x720
  WEB_FHD = 'web_fhd',               // 1920x1080
  WEB_4K = 'web_4k',                 // 3840x2160
  
  // 社交媒体分辨率
  FACEBOOK_POST = 'facebook_post',    // 1200x630
  TWITTER_POST = 'twitter_post',      // 1024x512
  INSTAGRAM_POST = 'instagram_post',  // 1080x1080
  LINKEDIN_POST = 'linkedin_post',    // 1200x627
  YOUTUBE_THUMB = 'youtube_thumb',    // 1280x720
  
  // 打印分辨率 (300 DPI)
  PRINT_A4_PORTRAIT = 'print_a4_portrait',     // 2480x3508
  PRINT_A4_LANDSCAPE = 'print_a4_landscape',   // 3508x2480
  PRINT_A3_PORTRAIT = 'print_a3_portrait',     // 3508x4961
  PRINT_A3_LANDSCAPE = 'print_a3_landscape',   // 4961x3508
  PRINT_LETTER = 'print_letter',               // 2550x3300
  PRINT_LEGAL = 'print_legal',                 // 2550x4200
  
  // 移动设备分辨率
  MOBILE_PORTRAIT = 'mobile_portrait',         // 750x1334
  MOBILE_LANDSCAPE = 'mobile_landscape',       // 1334x750
  TABLET_PORTRAIT = 'tablet_portrait',         // 1536x2048
  TABLET_LANDSCAPE = 'tablet_landscape',       // 2048x1536
  
  // 演示文稿分辨率
  PRESENTATION_4_3 = 'presentation_4_3',       // 1024x768
  PRESENTATION_16_9 = 'presentation_16_9',     // 1920x1080
  PRESENTATION_16_10 = 'presentation_16_10',   // 1920x1200
  
  // 自定义分辨率
  CUSTOM = 'custom'
}

// 宽高比枚举
export enum AspectRatio {
  RATIO_1_1 = '1:1',       // 正方形
  RATIO_4_3 = '4:3',       // 传统屏幕
  RATIO_16_9 = '16:9',     // 宽屏
  RATIO_16_10 = '16:10',   // 宽屏变体
  RATIO_21_9 = '21:9',     // 超宽屏
  RATIO_3_2 = '3:2',       // 摄影常用
  RATIO_5_4 = '5:4',       // 老式显示器
  CUSTOM = 'custom'        // 自定义比例
}

// 分辨率信息接口
export interface ResolutionInfo {
  preset: ResolutionPreset
  name: string
  description: string
  width: number
  height: number
  aspectRatio: AspectRatio
  category: 'web' | 'social' | 'print' | 'mobile' | 'presentation' | 'custom'
  recommendedDPI: number
  recommendedUse: string[]
  fileSize: {
    estimated: number
    unit: string
  }
}

// 分辨率验证结果接口
export interface ResolutionValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// 分辨率计算结果接口
export interface ResolutionCalculation extends DPICalculationResult {
  preset?: ResolutionPreset
  category: string
  recommendedUse: string[]
  estimatedFileSize: number
  aspectRatioName: string
  isStandardRatio: boolean
}

// 预设分辨率配置
export const RESOLUTION_PRESETS: Record<ResolutionPreset, Omit<ResolutionInfo, 'fileSize'>> = {
  // 网页分辨率
  [ResolutionPreset.WEB_SMALL]: {
    preset: ResolutionPreset.WEB_SMALL,
    name: '网页小尺寸',
    description: '适合小屏幕和快速加载',
    width: 640,
    height: 480,
    aspectRatio: AspectRatio.RATIO_4_3,
    category: 'web',
    recommendedDPI: 96,
    recommendedUse: ['网页缩略图', '快速预览', '移动端']
  },
  [ResolutionPreset.WEB_MEDIUM]: {
    preset: ResolutionPreset.WEB_MEDIUM,
    name: '网页中等尺寸',
    description: '网页显示的标准尺寸',
    width: 800,
    height: 600,
    aspectRatio: AspectRatio.RATIO_4_3,
    category: 'web',
    recommendedDPI: 96,
    recommendedUse: ['网页展示', '博客文章', '在线文档']
  },
  [ResolutionPreset.WEB_LARGE]: {
    preset: ResolutionPreset.WEB_LARGE,
    name: '网页大尺寸',
    description: '高质量网页显示',
    width: 1024,
    height: 768,
    aspectRatio: AspectRatio.RATIO_4_3,
    category: 'web',
    recommendedDPI: 96,
    recommendedUse: ['详细展示', '桌面壁纸', '高质量网页']
  },
  [ResolutionPreset.WEB_HD]: {
    preset: ResolutionPreset.WEB_HD,
    name: '高清网页',
    description: 'HD质量的网页显示',
    width: 1280,
    height: 720,
    aspectRatio: AspectRatio.RATIO_16_9,
    category: 'web',
    recommendedDPI: 96,
    recommendedUse: ['高清展示', '视频缩略图', '现代网页']
  },
  [ResolutionPreset.WEB_FHD]: {
    preset: ResolutionPreset.WEB_FHD,
    name: '全高清网页',
    description: 'Full HD质量显示',
    width: 1920,
    height: 1080,
    aspectRatio: AspectRatio.RATIO_16_9,
    category: 'web',
    recommendedDPI: 96,
    recommendedUse: ['全高清展示', '大屏显示', '专业网页']
  },
  [ResolutionPreset.WEB_4K]: {
    preset: ResolutionPreset.WEB_4K,
    name: '4K超高清',
    description: '4K超高清显示',
    width: 3840,
    height: 2160,
    aspectRatio: AspectRatio.RATIO_16_9,
    category: 'web',
    recommendedDPI: 96,
    recommendedUse: ['4K显示', '超高清展示', '专业用途']
  },
  
  // 社交媒体分辨率
  [ResolutionPreset.FACEBOOK_POST]: {
    preset: ResolutionPreset.FACEBOOK_POST,
    name: 'Facebook帖子',
    description: 'Facebook帖子推荐尺寸',
    width: 1200,
    height: 630,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'social',
    recommendedDPI: 72,
    recommendedUse: ['Facebook分享', '社交媒体', '链接预览']
  },
  [ResolutionPreset.TWITTER_POST]: {
    preset: ResolutionPreset.TWITTER_POST,
    name: 'Twitter帖子',
    description: 'Twitter帖子推荐尺寸',
    width: 1024,
    height: 512,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'social',
    recommendedDPI: 72,
    recommendedUse: ['Twitter分享', '微博分享', '社交媒体']
  },
  [ResolutionPreset.INSTAGRAM_POST]: {
    preset: ResolutionPreset.INSTAGRAM_POST,
    name: 'Instagram帖子',
    description: 'Instagram正方形帖子',
    width: 1080,
    height: 1080,
    aspectRatio: AspectRatio.RATIO_1_1,
    category: 'social',
    recommendedDPI: 72,
    recommendedUse: ['Instagram', '正方形展示', '社交媒体']
  },
  [ResolutionPreset.LINKEDIN_POST]: {
    preset: ResolutionPreset.LINKEDIN_POST,
    name: 'LinkedIn帖子',
    description: 'LinkedIn帖子推荐尺寸',
    width: 1200,
    height: 627,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'social',
    recommendedDPI: 72,
    recommendedUse: ['LinkedIn分享', '职业社交', '商务分享']
  },
  [ResolutionPreset.YOUTUBE_THUMB]: {
    preset: ResolutionPreset.YOUTUBE_THUMB,
    name: 'YouTube缩略图',
    description: 'YouTube视频缩略图',
    width: 1280,
    height: 720,
    aspectRatio: AspectRatio.RATIO_16_9,
    category: 'social',
    recommendedDPI: 72,
    recommendedUse: ['YouTube', '视频缩略图', '视频平台']
  },
  
  // 打印分辨率
  [ResolutionPreset.PRINT_A4_PORTRAIT]: {
    preset: ResolutionPreset.PRINT_A4_PORTRAIT,
    name: 'A4纵向打印',
    description: 'A4纸张纵向打印(300 DPI)',
    width: 2480,
    height: 3508,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'print',
    recommendedDPI: 300,
    recommendedUse: ['A4打印', '文档打印', '报告打印']
  },
  [ResolutionPreset.PRINT_A4_LANDSCAPE]: {
    preset: ResolutionPreset.PRINT_A4_LANDSCAPE,
    name: 'A4横向打印',
    description: 'A4纸张横向打印(300 DPI)',
    width: 3508,
    height: 2480,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'print',
    recommendedDPI: 300,
    recommendedUse: ['A4横向', '图表打印', '横向文档']
  },
  [ResolutionPreset.PRINT_A3_PORTRAIT]: {
    preset: ResolutionPreset.PRINT_A3_PORTRAIT,
    name: 'A3纵向打印',
    description: 'A3纸张纵向打印(300 DPI)',
    width: 3508,
    height: 4961,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'print',
    recommendedDPI: 300,
    recommendedUse: ['A3打印', '大尺寸打印', '海报打印']
  },
  [ResolutionPreset.PRINT_A3_LANDSCAPE]: {
    preset: ResolutionPreset.PRINT_A3_LANDSCAPE,
    name: 'A3横向打印',
    description: 'A3纸张横向打印(300 DPI)',
    width: 4961,
    height: 3508,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'print',
    recommendedDPI: 300,
    recommendedUse: ['A3横向', '大图表', '横向海报']
  },
  [ResolutionPreset.PRINT_LETTER]: {
    preset: ResolutionPreset.PRINT_LETTER,
    name: 'Letter打印',
    description: 'Letter纸张打印(300 DPI)',
    width: 2550,
    height: 3300,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'print',
    recommendedDPI: 300,
    recommendedUse: ['Letter打印', '美国标准', '文档打印']
  },
  [ResolutionPreset.PRINT_LEGAL]: {
    preset: ResolutionPreset.PRINT_LEGAL,
    name: 'Legal打印',
    description: 'Legal纸张打印(300 DPI)',
    width: 2550,
    height: 4200,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'print',
    recommendedDPI: 300,
    recommendedUse: ['Legal打印', '法律文档', '长文档']
  },
  
  // 移动设备分辨率
  [ResolutionPreset.MOBILE_PORTRAIT]: {
    preset: ResolutionPreset.MOBILE_PORTRAIT,
    name: '手机纵向',
    description: '手机纵向显示',
    width: 750,
    height: 1334,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'mobile',
    recommendedDPI: 326,
    recommendedUse: ['手机应用', '移动网页', '纵向显示']
  },
  [ResolutionPreset.MOBILE_LANDSCAPE]: {
    preset: ResolutionPreset.MOBILE_LANDSCAPE,
    name: '手机横向',
    description: '手机横向显示',
    width: 1334,
    height: 750,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'mobile',
    recommendedDPI: 326,
    recommendedUse: ['手机横屏', '游戏界面', '横向应用']
  },
  [ResolutionPreset.TABLET_PORTRAIT]: {
    preset: ResolutionPreset.TABLET_PORTRAIT,
    name: '平板纵向',
    description: '平板纵向显示',
    width: 1536,
    height: 2048,
    aspectRatio: AspectRatio.RATIO_3_2,
    category: 'mobile',
    recommendedDPI: 264,
    recommendedUse: ['平板应用', '电子书', '纵向阅读']
  },
  [ResolutionPreset.TABLET_LANDSCAPE]: {
    preset: ResolutionPreset.TABLET_LANDSCAPE,
    name: '平板横向',
    description: '平板横向显示',
    width: 2048,
    height: 1536,
    aspectRatio: AspectRatio.RATIO_3_2,
    category: 'mobile',
    recommendedDPI: 264,
    recommendedUse: ['平板横屏', '视频播放', '横向应用']
  },
  
  // 演示文稿分辨率
  [ResolutionPreset.PRESENTATION_4_3]: {
    preset: ResolutionPreset.PRESENTATION_4_3,
    name: '演示文稿4:3',
    description: '传统演示文稿比例',
    width: 1024,
    height: 768,
    aspectRatio: AspectRatio.RATIO_4_3,
    category: 'presentation',
    recommendedDPI: 96,
    recommendedUse: ['PowerPoint', '传统投影', '学术演示']
  },
  [ResolutionPreset.PRESENTATION_16_9]: {
    preset: ResolutionPreset.PRESENTATION_16_9,
    name: '演示文稿16:9',
    description: '现代演示文稿比例',
    width: 1920,
    height: 1080,
    aspectRatio: AspectRatio.RATIO_16_9,
    category: 'presentation',
    recommendedDPI: 96,
    recommendedUse: ['现代投影', '宽屏演示', '商务演示']
  },
  [ResolutionPreset.PRESENTATION_16_10]: {
    preset: ResolutionPreset.PRESENTATION_16_10,
    name: '演示文稿16:10',
    description: '宽屏演示文稿比例',
    width: 1920,
    height: 1200,
    aspectRatio: AspectRatio.RATIO_16_10,
    category: 'presentation',
    recommendedDPI: 96,
    recommendedUse: ['宽屏投影', '专业演示', '设计展示']
  },
  
  // 自定义分辨率
  [ResolutionPreset.CUSTOM]: {
    preset: ResolutionPreset.CUSTOM,
    name: '自定义分辨率',
    description: '用户自定义的分辨率设置',
    width: 800,
    height: 600,
    aspectRatio: AspectRatio.CUSTOM,
    category: 'custom',
    recommendedDPI: 96,
    recommendedUse: ['自定义用途', '特殊需求', '个性化设置']
  }
}

// 宽高比信息
export const ASPECT_RATIO_INFO: Record<AspectRatio, { name: string; decimal: number; description: string }> = {
  [AspectRatio.RATIO_1_1]: { name: '1:1', decimal: 1.0, description: '正方形，适合社交媒体' },
  [AspectRatio.RATIO_4_3]: { name: '4:3', decimal: 1.333, description: '传统屏幕比例' },
  [AspectRatio.RATIO_16_9]: { name: '16:9', decimal: 1.778, description: '现代宽屏比例' },
  [AspectRatio.RATIO_16_10]: { name: '16:10', decimal: 1.6, description: '宽屏变体' },
  [AspectRatio.RATIO_21_9]: { name: '21:9', decimal: 2.333, description: '超宽屏比例' },
  [AspectRatio.RATIO_3_2]: { name: '3:2', decimal: 1.5, description: '摄影常用比例' },
  [AspectRatio.RATIO_5_4]: { name: '5:4', decimal: 1.25, description: '老式显示器比例' },
  [AspectRatio.CUSTOM]: { name: '自定义', decimal: 0, description: '用户自定义比例' }
}

/**
 * 分辨率管理器类
 */
export class ResolutionManager {
  private static instance: ResolutionManager

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ResolutionManager {
    if (!ResolutionManager.instance) {
      ResolutionManager.instance = new ResolutionManager()
    }
    return ResolutionManager.instance
  }

  /**
   * 获取预设分辨率信息
   */
  public getPresetInfo(preset: ResolutionPreset): ResolutionInfo {
    const presetInfo = RESOLUTION_PRESETS[preset]
    const fileSize = this.estimateFileSize(presetInfo.width, presetInfo.height, presetInfo.recommendedDPI)
    
    return {
      ...presetInfo,
      fileSize
    }
  }

  /**
   * 获取所有预设分辨率
   */
  public getAllPresets(): ResolutionInfo[] {
    return Object.values(ResolutionPreset).map(preset => this.getPresetInfo(preset))
  }

  /**
   * 根据类别获取预设分辨率
   */
  public getPresetsByCategory(category: ResolutionInfo['category']): ResolutionInfo[] {
    return this.getAllPresets().filter(preset => preset.category === category)
  }

  /**
   * 计算分辨率详细信息
   */
  public calculateResolution(
    width: number,
    height: number,
    dpi: number = 96,
    preset?: ResolutionPreset
  ): ResolutionCalculation {
    const dpiResult = dpiCalculationEngine.performFullCalculation(width, height, dpi)
    const aspectRatio = this.detectAspectRatio(width, height)
    const category = preset ? RESOLUTION_PRESETS[preset].category : 'custom'
    const recommendedUse = preset ? RESOLUTION_PRESETS[preset].recommendedUse : ['自定义用途']
    const estimatedFileSize = this.estimateFileSize(width, height, dpi).estimated
    
    return {
      ...dpiResult,
      preset,
      category,
      recommendedUse,
      estimatedFileSize,
      aspectRatioName: aspectRatio,
      isStandardRatio: aspectRatio !== AspectRatio.CUSTOM
    }
  }

  /**
   * 验证分辨率设置
   */
  public validateResolution(width: number, height: number, dpi?: number): ResolutionValidation {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // 基础验证
    if (width <= 0 || height <= 0) {
      errors.push('宽度和高度必须大于0')
    }

    if (width > 8192 || height > 8192) {
      errors.push('分辨率过大，最大支持8192x8192')
    }

    // DPI验证
    if (dpi && (dpi < 72 || dpi > 600)) {
      warnings.push('DPI建议在72-600之间')
    }

    // 文件大小警告
    const fileSize = this.estimateFileSize(width, height, dpi || 96)
    if (fileSize.estimated > 10 * 1024 * 1024) { // 10MB
      warnings.push('预计文件大小较大，可能影响性能')
    }

    // 宽高比建议
    const aspectRatio = this.detectAspectRatio(width, height)
    if (aspectRatio === AspectRatio.CUSTOM) {
      suggestions.push('考虑使用标准宽高比以获得更好的兼容性')
    }

    // 用途建议
    const matchingPresets = this.findMatchingPresets(width, height)
    if (matchingPresets.length > 0) {
      suggestions.push(`此分辨率适合: ${matchingPresets.map(p => p.name).join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * 保持宽高比调整尺寸
   */
  public adjustWithAspectRatio(
    currentWidth: number,
    currentHeight: number,
    newWidth?: number,
    newHeight?: number,
    aspectRatio?: AspectRatio
  ): { width: number; height: number } {
    if (aspectRatio && aspectRatio !== AspectRatio.CUSTOM) {
      const ratio = ASPECT_RATIO_INFO[aspectRatio].decimal
      if (newWidth) {
        return { width: newWidth, height: Math.round(newWidth / ratio) }
      } else if (newHeight) {
        return { width: Math.round(newHeight * ratio), height: newHeight }
      }
    }

    const currentRatio = currentWidth / currentHeight
    
    if (newWidth) {
      return { width: newWidth, height: Math.round(newWidth / currentRatio) }
    } else if (newHeight) {
      return { width: Math.round(newHeight * currentRatio), height: newHeight }
    }

    return { width: currentWidth, height: currentHeight }
  }

  /**
   * 检测宽高比
   */
  public detectAspectRatio(width: number, height: number): AspectRatio {
    const ratio = width / height
    const tolerance = 0.01

    for (const [aspectRatio, info] of Object.entries(ASPECT_RATIO_INFO)) {
      if (aspectRatio === AspectRatio.CUSTOM) continue
      if (Math.abs(ratio - info.decimal) < tolerance) {
        return aspectRatio as AspectRatio
      }
    }

    return AspectRatio.CUSTOM
  }

  /**
   * 查找匹配的预设
   */
  public findMatchingPresets(width: number, height: number): ResolutionInfo[] {
    return this.getAllPresets().filter(preset => 
      preset.width === width && preset.height === height
    )
  }

  /**
   * 获取推荐分辨率
   */
  public getRecommendedResolutions(purpose: 'web' | 'social' | 'print' | 'mobile' | 'presentation'): ResolutionInfo[] {
    return this.getPresetsByCategory(purpose).slice(0, 5) // 返回前5个推荐
  }

  /**
   * 估算文件大小
   */
  private estimateFileSize(width: number, height: number, dpi: number): { estimated: number; unit: string } {
    const estimated = dpiCalculationEngine.estimateFileSize(width, height, dpi)
    return {
      estimated,
      unit: this.formatFileSize(estimated)
    }
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
export const resolutionManager = ResolutionManager.getInstance()
