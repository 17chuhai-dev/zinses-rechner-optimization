/**
 * 智能分辨率推荐引擎
 * 基于用途、设备类型、文件大小限制等因素智能推荐最佳DPI和分辨率设置
 */

import { dpiCalculationEngine, DPI_PRESETS, DEVICE_DPI_RANGES } from './DPICalculationEngine'
import { resolutionManager, ResolutionPreset, type ResolutionInfo } from './ResolutionManager'
import { deviceAdaptationDetector, DeviceType, PerformanceLevel, type DeviceCapabilities } from './DeviceAdaptationDetector'

// 推荐上下文接口
export interface RecommendationContext {
  purpose: 'web' | 'print' | 'social' | 'mobile' | 'presentation' | 'email' | 'archive'
  deviceType?: DeviceType
  performanceLevel?: PerformanceLevel
  constraints?: {
    maxFileSize?: number // KB
    maxRenderTime?: number // ms
    minQuality?: number // 0-1
    maxDimensions?: { width: number; height: number }
    preferredAspectRatio?: string
  }
  userPreferences?: {
    prioritizeQuality?: boolean
    prioritizeSpeed?: boolean
    prioritizeFileSize?: boolean
    customDPI?: number
    customResolution?: { width: number; height: number }
  }
  contentType?: 'chart' | 'diagram' | 'photo' | 'text' | 'mixed'
  targetAudience?: 'general' | 'professional' | 'technical' | 'presentation'
}

// 推荐结果接口
export interface RecommendationResult {
  recommendedDPI: number
  recommendedResolution: { width: number; height: number }
  recommendedPreset?: ResolutionPreset
  confidence: number
  reasoning: string[]
  alternatives: Array<{
    dpi: number
    resolution: { width: number; height: number }
    preset?: ResolutionPreset
    score: number
    pros: string[]
    cons: string[]
  }>
  estimatedMetrics: {
    fileSize: number
    renderTime: number
    qualityScore: number
    compatibilityScore: number
  }
  warnings: string[]
  optimizations: string[]
}

// 学习数据接口
export interface LearningData {
  context: RecommendationContext
  chosenSettings: {
    dpi: number
    resolution: { width: number; height: number }
  }
  userSatisfaction: number // 0-1
  actualMetrics?: {
    fileSize: number
    renderTime: number
    qualityRating: number
  }
  timestamp: number
}

// 推荐权重配置
export interface RecommendationWeights {
  quality: number
  fileSize: number
  renderTime: number
  compatibility: number
  userPreference: number
}

// 默认权重配置
export const DEFAULT_WEIGHTS: Record<string, RecommendationWeights> = {
  web: { quality: 0.3, fileSize: 0.3, renderTime: 0.2, compatibility: 0.15, userPreference: 0.05 },
  print: { quality: 0.5, fileSize: 0.1, renderTime: 0.1, compatibility: 0.2, userPreference: 0.1 },
  social: { quality: 0.25, fileSize: 0.35, renderTime: 0.2, compatibility: 0.15, userPreference: 0.05 },
  mobile: { quality: 0.2, fileSize: 0.4, renderTime: 0.25, compatibility: 0.1, userPreference: 0.05 },
  presentation: { quality: 0.4, fileSize: 0.15, renderTime: 0.15, compatibility: 0.25, userPreference: 0.05 },
  email: { quality: 0.2, fileSize: 0.5, renderTime: 0.15, compatibility: 0.1, userPreference: 0.05 },
  archive: { quality: 0.6, fileSize: 0.1, renderTime: 0.05, compatibility: 0.2, userPreference: 0.05 }
}

/**
 * 智能分辨率推荐引擎类
 */
export class SmartResolutionEngine {
  private static instance: SmartResolutionEngine
  private learningData: LearningData[] = []
  private userPatterns: Map<string, any> = new Map()
  private readonly MAX_LEARNING_DATA = 1000

  private constructor() {
    this.loadLearningData()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): SmartResolutionEngine {
    if (!SmartResolutionEngine.instance) {
      SmartResolutionEngine.instance = new SmartResolutionEngine()
    }
    return SmartResolutionEngine.instance
  }

  /**
   * 获取智能推荐
   */
  public async getRecommendation(
    sourceWidth: number,
    sourceHeight: number,
    context: RecommendationContext
  ): Promise<RecommendationResult> {
    // 获取设备能力（如果未提供）
    let deviceCapabilities: DeviceCapabilities | undefined
    if (!context.deviceType || !context.performanceLevel) {
      const detection = await deviceAdaptationDetector.detectDevice()
      deviceCapabilities = detection.capabilities
      context.deviceType = context.deviceType || detection.capabilities.deviceType
      context.performanceLevel = context.performanceLevel || detection.capabilities.performanceLevel
    }

    // 生成候选方案
    const candidates = this.generateCandidates(sourceWidth, sourceHeight, context)

    // 评估候选方案
    const evaluatedCandidates = candidates.map(candidate => 
      this.evaluateCandidate(candidate, context, deviceCapabilities)
    )

    // 排序并选择最佳方案
    evaluatedCandidates.sort((a, b) => b.score - a.score)
    const best = evaluatedCandidates[0]

    // 应用用户学习模式
    const adjustedBest = this.applyLearningAdjustments(best, context)

    // 生成推荐结果
    return this.buildRecommendationResult(
      adjustedBest,
      evaluatedCandidates.slice(1, 4), // 前3个备选方案
      context,
      deviceCapabilities
    )
  }

  /**
   * 记录用户选择用于学习
   */
  public recordUserChoice(
    context: RecommendationContext,
    chosenSettings: { dpi: number; resolution: { width: number; height: number } },
    satisfaction: number,
    actualMetrics?: { fileSize: number; renderTime: number; qualityRating: number }
  ): void {
    const learningEntry: LearningData = {
      context,
      chosenSettings,
      userSatisfaction: satisfaction,
      actualMetrics,
      timestamp: Date.now()
    }

    this.learningData.push(learningEntry)

    // 限制学习数据大小
    if (this.learningData.length > this.MAX_LEARNING_DATA) {
      this.learningData = this.learningData.slice(-this.MAX_LEARNING_DATA)
    }

    // 更新用户模式
    this.updateUserPatterns(learningEntry)

    // 保存学习数据
    this.saveLearningData()
  }

  /**
   * 获取用途推荐
   */
  public getRecommendationsByPurpose(
    purpose: RecommendationContext['purpose']
  ): Array<{ dpi: number; resolution: ResolutionInfo; description: string }> {
    const recommendations: Array<{ dpi: number; resolution: ResolutionInfo; description: string }> = []

    switch (purpose) {
      case 'web':
        recommendations.push(
          { dpi: 96, resolution: resolutionManager.getPresetInfo(ResolutionPreset.WEB_MEDIUM), description: '标准网页显示' },
          { dpi: 144, resolution: resolutionManager.getPresetInfo(ResolutionPreset.WEB_HD), description: '高清网页显示' },
          { dpi: 96, resolution: resolutionManager.getPresetInfo(ResolutionPreset.WEB_LARGE), description: '大尺寸网页显示' }
        )
        break

      case 'print':
        recommendations.push(
          { dpi: 300, resolution: resolutionManager.getPresetInfo(ResolutionPreset.PRINT_A4_PORTRAIT), description: 'A4打印标准' },
          { dpi: 300, resolution: resolutionManager.getPresetInfo(ResolutionPreset.PRINT_A4_LANDSCAPE), description: 'A4横向打印' },
          { dpi: 600, resolution: resolutionManager.getPresetInfo(ResolutionPreset.PRINT_A3_PORTRAIT), description: '高质量大尺寸打印' }
        )
        break

      case 'social':
        recommendations.push(
          { dpi: 72, resolution: resolutionManager.getPresetInfo(ResolutionPreset.FACEBOOK_POST), description: 'Facebook分享' },
          { dpi: 72, resolution: resolutionManager.getPresetInfo(ResolutionPreset.INSTAGRAM_POST), description: 'Instagram帖子' },
          { dpi: 72, resolution: resolutionManager.getPresetInfo(ResolutionPreset.TWITTER_POST), description: 'Twitter分享' }
        )
        break

      case 'mobile':
        recommendations.push(
          { dpi: 326, resolution: resolutionManager.getPresetInfo(ResolutionPreset.MOBILE_PORTRAIT), description: '手机纵向显示' },
          { dpi: 264, resolution: resolutionManager.getPresetInfo(ResolutionPreset.TABLET_PORTRAIT), description: '平板显示' },
          { dpi: 326, resolution: resolutionManager.getPresetInfo(ResolutionPreset.MOBILE_LANDSCAPE), description: '手机横向显示' }
        )
        break

      case 'presentation':
        recommendations.push(
          { dpi: 96, resolution: resolutionManager.getPresetInfo(ResolutionPreset.PRESENTATION_16_9), description: '现代演示文稿' },
          { dpi: 96, resolution: resolutionManager.getPresetInfo(ResolutionPreset.PRESENTATION_4_3), description: '传统演示文稿' },
          { dpi: 96, resolution: resolutionManager.getPresetInfo(ResolutionPreset.PRESENTATION_16_10), description: '宽屏演示文稿' }
        )
        break

      default:
        recommendations.push(
          { dpi: 96, resolution: resolutionManager.getPresetInfo(ResolutionPreset.WEB_MEDIUM), description: '通用标准' }
        )
    }

    return recommendations
  }

  /**
   * 生成候选方案
   */
  private generateCandidates(
    sourceWidth: number,
    sourceHeight: number,
    context: RecommendationContext
  ): Array<{ dpi: number; resolution: { width: number; height: number }; preset?: ResolutionPreset }> {
    const candidates: Array<{ dpi: number; resolution: { width: number; height: number }; preset?: ResolutionPreset }> = []

    // 基于用途的基础候选
    const purposeRecommendations = this.getRecommendationsByPurpose(context.purpose)
    purposeRecommendations.forEach(rec => {
      candidates.push({
        dpi: rec.dpi,
        resolution: { width: rec.resolution.width, height: rec.resolution.height },
        preset: rec.resolution.preset
      })
    })

    // 基于设备类型的候选
    if (context.deviceType) {
      const deviceRange = DEVICE_DPI_RANGES[context.deviceType as keyof typeof DEVICE_DPI_RANGES]
      if (deviceRange) {
        [deviceRange.min, deviceRange.optimal, deviceRange.max].forEach(dpi => {
          const aspectRatio = sourceWidth / sourceHeight
          let width = sourceWidth
          let height = sourceHeight

          // 根据约束调整尺寸
          if (context.constraints?.maxDimensions) {
            const maxWidth = context.constraints.maxDimensions.width
            const maxHeight = context.constraints.maxDimensions.height
            
            if (width > maxWidth || height > maxHeight) {
              const scale = Math.min(maxWidth / width, maxHeight / height)
              width = Math.round(width * scale)
              height = Math.round(height * scale)
            }
          }

          candidates.push({ dpi, resolution: { width, height } })
        })
      }
    }

    // 用户自定义候选
    if (context.userPreferences?.customDPI) {
      const customResolution = context.userPreferences.customResolution || { width: sourceWidth, height: sourceHeight }
      candidates.push({
        dpi: context.userPreferences.customDPI,
        resolution: customResolution
      })
    }

    // 去重
    const uniqueCandidates = candidates.filter((candidate, index, self) =>
      index === self.findIndex(c => c.dpi === candidate.dpi && 
        c.resolution.width === candidate.resolution.width && 
        c.resolution.height === candidate.resolution.height)
    )

    return uniqueCandidates
  }

  /**
   * 评估候选方案
   */
  private evaluateCandidate(
    candidate: { dpi: number; resolution: { width: number; height: number }; preset?: ResolutionPreset },
    context: RecommendationContext,
    deviceCapabilities?: DeviceCapabilities
  ): any {
    const weights = DEFAULT_WEIGHTS[context.purpose] || DEFAULT_WEIGHTS.web

    // 计算各项指标
    const qualityScore = this.calculateQualityScore(candidate.dpi, context)
    const fileSizeScore = this.calculateFileSizeScore(candidate, context)
    const renderTimeScore = this.calculateRenderTimeScore(candidate, context, deviceCapabilities)
    const compatibilityScore = this.calculateCompatibilityScore(candidate, context)
    const userPreferenceScore = this.calculateUserPreferenceScore(candidate, context)

    // 计算总分
    const totalScore = 
      qualityScore * weights.quality +
      fileSizeScore * weights.fileSize +
      renderTimeScore * weights.renderTime +
      compatibilityScore * weights.compatibility +
      userPreferenceScore * weights.userPreference

    return {
      ...candidate,
      score: totalScore,
      metrics: {
        quality: qualityScore,
        fileSize: fileSizeScore,
        renderTime: renderTimeScore,
        compatibility: compatibilityScore,
        userPreference: userPreferenceScore
      }
    }
  }

  /**
   * 计算质量分数
   */
  private calculateQualityScore(dpi: number, context: RecommendationContext): number {
    let score = 0.5

    // 基于DPI的质量评分
    if (dpi >= 300) score = 1.0
    else if (dpi >= 200) score = 0.8
    else if (dpi >= 150) score = 0.6
    else if (dpi >= 96) score = 0.4
    else score = 0.2

    // 根据用途调整
    if (context.purpose === 'print' && dpi >= 300) score += 0.1
    if (context.purpose === 'web' && dpi >= 96 && dpi <= 144) score += 0.1
    if (context.purpose === 'social' && dpi >= 72 && dpi <= 96) score += 0.1

    // 根据内容类型调整
    if (context.contentType === 'text' && dpi >= 200) score += 0.05
    if (context.contentType === 'photo' && dpi >= 300) score += 0.05

    return Math.min(1, score)
  }

  /**
   * 计算文件大小分数
   */
  private calculateFileSizeScore(
    candidate: { dpi: number; resolution: { width: number; height: number } },
    context: RecommendationContext
  ): number {
    const estimatedSize = dpiCalculationEngine.estimateFileSize(
      candidate.resolution.width,
      candidate.resolution.height,
      candidate.dpi
    )

    let score = 1.0

    // 基于文件大小的评分（越小越好）
    if (estimatedSize > 10 * 1024 * 1024) score = 0.1 // >10MB
    else if (estimatedSize > 5 * 1024 * 1024) score = 0.3 // >5MB
    else if (estimatedSize > 2 * 1024 * 1024) score = 0.5 // >2MB
    else if (estimatedSize > 1 * 1024 * 1024) score = 0.7 // >1MB
    else if (estimatedSize > 500 * 1024) score = 0.9 // >500KB

    // 应用约束
    if (context.constraints?.maxFileSize) {
      const maxSize = context.constraints.maxFileSize * 1024
      if (estimatedSize > maxSize) {
        score *= 0.1 // 严重惩罚超出限制的方案
      }
    }

    return score
  }

  /**
   * 计算渲染时间分数
   */
  private calculateRenderTimeScore(
    candidate: { dpi: number; resolution: { width: number; height: number } },
    context: RecommendationContext,
    deviceCapabilities?: DeviceCapabilities
  ): number {
    // 基于像素数量和DPI估算渲染时间
    const totalPixels = candidate.resolution.width * candidate.resolution.height
    const dpiMultiplier = (candidate.dpi / 96) ** 2
    const baseRenderTime = (totalPixels * dpiMultiplier) / 1000000 // 简化估算

    // 根据设备性能调整
    let performanceMultiplier = 1.0
    if (deviceCapabilities) {
      switch (deviceCapabilities.performanceLevel) {
        case PerformanceLevel.LOW: performanceMultiplier = 2.0; break
        case PerformanceLevel.MEDIUM: performanceMultiplier = 1.5; break
        case PerformanceLevel.HIGH: performanceMultiplier = 0.8; break
        case PerformanceLevel.ULTRA: performanceMultiplier = 0.5; break
      }
    }

    const estimatedRenderTime = baseRenderTime * performanceMultiplier

    let score = 1.0
    if (estimatedRenderTime > 10000) score = 0.1 // >10s
    else if (estimatedRenderTime > 5000) score = 0.3 // >5s
    else if (estimatedRenderTime > 2000) score = 0.5 // >2s
    else if (estimatedRenderTime > 1000) score = 0.7 // >1s
    else if (estimatedRenderTime > 500) score = 0.9 // >0.5s

    // 应用约束
    if (context.constraints?.maxRenderTime && estimatedRenderTime > context.constraints.maxRenderTime) {
      score *= 0.1
    }

    return score
  }

  /**
   * 计算兼容性分数
   */
  private calculateCompatibilityScore(
    candidate: { dpi: number; resolution: { width: number; height: number }; preset?: ResolutionPreset },
    context: RecommendationContext
  ): number {
    let score = 0.5

    // 预设分辨率加分
    if (candidate.preset) score += 0.3

    // 标准DPI加分
    const standardDPIs = [72, 96, 150, 200, 300, 600]
    if (standardDPIs.includes(candidate.dpi)) score += 0.2

    // 标准宽高比加分
    const aspectRatio = candidate.resolution.width / candidate.resolution.height
    const standardRatios = [1.0, 1.333, 1.5, 1.6, 1.778, 2.333] // 1:1, 4:3, 3:2, 16:10, 16:9, 21:9
    const tolerance = 0.01
    if (standardRatios.some(ratio => Math.abs(aspectRatio - ratio) < tolerance)) {
      score += 0.2
    }

    return Math.min(1, score)
  }

  /**
   * 计算用户偏好分数
   */
  private calculateUserPreferenceScore(
    candidate: { dpi: number; resolution: { width: number; height: number } },
    context: RecommendationContext
  ): number {
    let score = 0.5

    // 用户偏好调整
    if (context.userPreferences?.prioritizeQuality && candidate.dpi >= 300) score += 0.3
    if (context.userPreferences?.prioritizeSpeed && candidate.dpi <= 150) score += 0.3
    if (context.userPreferences?.prioritizeFileSize && candidate.dpi <= 96) score += 0.3

    // 自定义设置匹配
    if (context.userPreferences?.customDPI === candidate.dpi) score += 0.2

    return Math.min(1, score)
  }

  /**
   * 应用学习调整
   */
  private applyLearningAdjustments(candidate: any, context: RecommendationContext): any {
    // 基于历史数据调整推荐
    const similarChoices = this.learningData.filter(data => 
      data.context.purpose === context.purpose &&
      Math.abs(data.chosenSettings.dpi - candidate.dpi) <= 50
    )

    if (similarChoices.length > 0) {
      const avgSatisfaction = similarChoices.reduce((sum, choice) => sum + choice.userSatisfaction, 0) / similarChoices.length
      candidate.score *= (0.5 + avgSatisfaction * 0.5) // 根据满意度调整分数
    }

    return candidate
  }

  /**
   * 构建推荐结果
   */
  private buildRecommendationResult(
    best: any,
    alternatives: any[],
    context: RecommendationContext,
    deviceCapabilities?: DeviceCapabilities
  ): RecommendationResult {
    const reasoning: string[] = []
    const warnings: string[] = []
    const optimizations: string[] = []

    // 生成推理说明
    reasoning.push(`基于${context.purpose}用途选择了${best.dpi} DPI`)
    reasoning.push(`分辨率${best.resolution.width}x${best.resolution.height}适合当前需求`)

    if (best.preset) {
      reasoning.push(`使用预设配置：${resolutionManager.getPresetInfo(best.preset).name}`)
    }

    // 生成警告
    const estimatedSize = dpiCalculationEngine.estimateFileSize(best.resolution.width, best.resolution.height, best.dpi)
    if (estimatedSize > 5 * 1024 * 1024) {
      warnings.push('预计文件大小较大，可能影响加载速度')
    }

    if (deviceCapabilities?.performanceLevel === PerformanceLevel.LOW && best.dpi > 200) {
      warnings.push('当前设备性能较低，高DPI可能导致渲染缓慢')
    }

    // 生成优化建议
    if (context.purpose === 'web' && best.dpi > 144) {
      optimizations.push('考虑使用较低DPI以提高网页加载速度')
    }

    if (context.purpose === 'print' && best.dpi < 300) {
      optimizations.push('建议使用300 DPI或更高以获得最佳打印质量')
    }

    return {
      recommendedDPI: best.dpi,
      recommendedResolution: best.resolution,
      recommendedPreset: best.preset,
      confidence: best.score,
      reasoning,
      alternatives: alternatives.map(alt => ({
        dpi: alt.dpi,
        resolution: alt.resolution,
        preset: alt.preset,
        score: alt.score,
        pros: this.generatePros(alt, context),
        cons: this.generateCons(alt, context)
      })),
      estimatedMetrics: {
        fileSize: estimatedSize,
        renderTime: this.estimateRenderTime(best, deviceCapabilities),
        qualityScore: best.metrics.quality,
        compatibilityScore: best.metrics.compatibility
      },
      warnings,
      optimizations
    }
  }

  /**
   * 生成优点列表
   */
  private generatePros(candidate: any, context: RecommendationContext): string[] {
    const pros: string[] = []

    if (candidate.metrics.quality > 0.8) pros.push('高质量输出')
    if (candidate.metrics.fileSize > 0.8) pros.push('文件大小适中')
    if (candidate.metrics.renderTime > 0.8) pros.push('渲染速度快')
    if (candidate.metrics.compatibility > 0.8) pros.push('兼容性好')

    return pros
  }

  /**
   * 生成缺点列表
   */
  private generateCons(candidate: any, context: RecommendationContext): string[] {
    const cons: string[] = []

    if (candidate.metrics.quality < 0.4) cons.push('质量较低')
    if (candidate.metrics.fileSize < 0.4) cons.push('文件大小较大')
    if (candidate.metrics.renderTime < 0.4) cons.push('渲染时间较长')
    if (candidate.metrics.compatibility < 0.4) cons.push('兼容性一般')

    return cons
  }

  /**
   * 估算渲染时间
   */
  private estimateRenderTime(candidate: any, deviceCapabilities?: DeviceCapabilities): number {
    const totalPixels = candidate.resolution.width * candidate.resolution.height
    const dpiMultiplier = (candidate.dpi / 96) ** 2
    let baseTime = (totalPixels * dpiMultiplier) / 1000000

    if (deviceCapabilities) {
      switch (deviceCapabilities.performanceLevel) {
        case PerformanceLevel.LOW: baseTime *= 2.0; break
        case PerformanceLevel.MEDIUM: baseTime *= 1.5; break
        case PerformanceLevel.HIGH: baseTime *= 0.8; break
        case PerformanceLevel.ULTRA: baseTime *= 0.5; break
      }
    }

    return Math.round(baseTime)
  }

  /**
   * 更新用户模式
   */
  private updateUserPatterns(learningEntry: LearningData): void {
    const key = `${learningEntry.context.purpose}_${learningEntry.context.deviceType}`
    const existing = this.userPatterns.get(key) || { choices: [], avgSatisfaction: 0 }
    
    existing.choices.push({
      dpi: learningEntry.chosenSettings.dpi,
      satisfaction: learningEntry.userSatisfaction,
      timestamp: learningEntry.timestamp
    })

    // 保持最近50个选择
    if (existing.choices.length > 50) {
      existing.choices = existing.choices.slice(-50)
    }

    existing.avgSatisfaction = existing.choices.reduce((sum: number, choice: any) => sum + choice.satisfaction, 0) / existing.choices.length

    this.userPatterns.set(key, existing)
  }

  /**
   * 加载学习数据
   */
  private loadLearningData(): void {
    try {
      const stored = localStorage.getItem('smartResolutionLearningData')
      if (stored) {
        this.learningData = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load learning data:', error)
    }
  }

  /**
   * 保存学习数据
   */
  private saveLearningData(): void {
    try {
      localStorage.setItem('smartResolutionLearningData', JSON.stringify(this.learningData))
    } catch (error) {
      console.warn('Failed to save learning data:', error)
    }
  }

  /**
   * 清除学习数据
   */
  public clearLearningData(): void {
    this.learningData = []
    this.userPatterns.clear()
    localStorage.removeItem('smartResolutionLearningData')
  }

  /**
   * 获取学习统计
   */
  public getLearningStats(): {
    totalChoices: number
    avgSatisfaction: number
    topPurposes: Array<{ purpose: string; count: number }>
    topDPIs: Array<{ dpi: number; count: number }>
  } {
    const totalChoices = this.learningData.length
    const avgSatisfaction = totalChoices > 0 
      ? this.learningData.reduce((sum, data) => sum + data.userSatisfaction, 0) / totalChoices 
      : 0

    // 统计用途
    const purposeCount = new Map<string, number>()
    const dpiCount = new Map<number, number>()

    this.learningData.forEach(data => {
      purposeCount.set(data.context.purpose, (purposeCount.get(data.context.purpose) || 0) + 1)
      dpiCount.set(data.chosenSettings.dpi, (dpiCount.get(data.chosenSettings.dpi) || 0) + 1)
    })

    const topPurposes = Array.from(purposeCount.entries())
      .map(([purpose, count]) => ({ purpose, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const topDPIs = Array.from(dpiCount.entries())
      .map(([dpi, count]) => ({ dpi, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalChoices,
      avgSatisfaction,
      topPurposes,
      topDPIs
    }
  }
}

// 导出单例实例
export const smartResolutionEngine = SmartResolutionEngine.getInstance()
