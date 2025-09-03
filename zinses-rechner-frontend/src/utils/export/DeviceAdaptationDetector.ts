/**
 * 设备适配检测器
 * 自动检测用户设备能力并提供最佳DPI和分辨率建议
 */

import { dpiCalculationEngine, DEVICE_DPI_RANGES } from './DPICalculationEngine'
import { resolutionManager, type ResolutionInfo } from './ResolutionManager'
import { pixelDensityScaler, type PixelDensityInfo } from './PixelDensityScaler'

// 设备类型枚举
export enum DeviceType {
  DESKTOP = 'desktop',
  LAPTOP = 'laptop',
  TABLET = 'tablet',
  MOBILE = 'mobile',
  UNKNOWN = 'unknown'
}

// 设备性能等级
export enum PerformanceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

// 设备能力信息接口
export interface DeviceCapabilities {
  deviceType: DeviceType
  performanceLevel: PerformanceLevel
  screenInfo: {
    width: number
    height: number
    availWidth: number
    availHeight: number
    colorDepth: number
    pixelDepth: number
  }
  pixelDensity: PixelDensityInfo
  memoryInfo: {
    totalJSHeapSize?: number
    usedJSHeapSize?: number
    jsHeapSizeLimit?: number
    deviceMemory?: number
  }
  networkInfo: {
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
  }
  hardwareInfo: {
    hardwareConcurrency: number
    maxTouchPoints: number
    platform: string
    userAgent: string
  }
  supportedFeatures: {
    webGL: boolean
    webGL2: boolean
    canvas2D: boolean
    offscreenCanvas: boolean
    webWorkers: boolean
    sharedArrayBuffer: boolean
  }
}

// 适配建议接口
export interface AdaptationRecommendation {
  recommendedDPI: number
  recommendedResolutions: ResolutionInfo[]
  maxSafeResolution: { width: number; height: number }
  performanceOptimizations: string[]
  qualitySettings: {
    antiAliasing: boolean
    highQualityScaling: boolean
    backgroundProcessing: boolean
  }
  limitations: string[]
  warnings: string[]
}

// 设备检测结果接口
export interface DeviceDetectionResult {
  capabilities: DeviceCapabilities
  recommendations: AdaptationRecommendation
  confidence: number
  detectionTime: number
}

/**
 * 设备适配检测器类
 */
export class DeviceAdaptationDetector {
  private static instance: DeviceAdaptationDetector
  private detectionCache: Map<string, DeviceDetectionResult> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): DeviceAdaptationDetector {
    if (!DeviceAdaptationDetector.instance) {
      DeviceAdaptationDetector.instance = new DeviceAdaptationDetector()
    }
    return DeviceAdaptationDetector.instance
  }

  /**
   * 检测设备能力和生成适配建议
   */
  public async detectDevice(): Promise<DeviceDetectionResult> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey()
    
    // 检查缓存
    const cached = this.detectionCache.get(cacheKey)
    if (cached && (Date.now() - cached.detectionTime) < this.CACHE_DURATION) {
      return cached
    }

    // 检测设备能力
    const capabilities = await this.detectCapabilities()
    
    // 生成适配建议
    const recommendations = this.generateRecommendations(capabilities)
    
    // 计算置信度
    const confidence = this.calculateConfidence(capabilities)
    
    const result: DeviceDetectionResult = {
      capabilities,
      recommendations,
      confidence,
      detectionTime: Date.now()
    }

    // 缓存结果
    this.detectionCache.set(cacheKey, result)
    
    return result
  }

  /**
   * 检测设备能力
   */
  private async detectCapabilities(): Promise<DeviceCapabilities> {
    const screenInfo = this.getScreenInfo()
    const pixelDensity = pixelDensityScaler.getCurrentPixelDensityInfo()
    const memoryInfo = this.getMemoryInfo()
    const networkInfo = await this.getNetworkInfo()
    const hardwareInfo = this.getHardwareInfo()
    const supportedFeatures = await this.detectSupportedFeatures()
    
    const deviceType = this.detectDeviceType(screenInfo, hardwareInfo)
    const performanceLevel = this.assessPerformanceLevel(memoryInfo, hardwareInfo, supportedFeatures)

    return {
      deviceType,
      performanceLevel,
      screenInfo,
      pixelDensity,
      memoryInfo,
      networkInfo,
      hardwareInfo,
      supportedFeatures
    }
  }

  /**
   * 获取屏幕信息
   */
  private getScreenInfo() {
    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth
    }
  }

  /**
   * 获取内存信息
   */
  private getMemoryInfo() {
    const performance = window.performance as any
    const memory = performance.memory
    const navigator = window.navigator as any

    return {
      totalJSHeapSize: memory?.totalJSHeapSize,
      usedJSHeapSize: memory?.usedJSHeapSize,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit,
      deviceMemory: navigator?.deviceMemory
    }
  }

  /**
   * 获取网络信息
   */
  private async getNetworkInfo() {
    const navigator = window.navigator as any
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    return {
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    }
  }

  /**
   * 获取硬件信息
   */
  private getHardwareInfo() {
    return {
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    }
  }

  /**
   * 检测支持的功能
   */
  private async detectSupportedFeatures() {
    const canvas = document.createElement('canvas')
    const ctx2d = canvas.getContext('2d')
    
    let webGL = false
    let webGL2 = false
    
    try {
      const gl = canvas.getContext('webgl')
      webGL = !!gl
      
      const gl2 = canvas.getContext('webgl2')
      webGL2 = !!gl2
    } catch (e) {
      // WebGL不支持
    }

    return {
      webGL,
      webGL2,
      canvas2D: !!ctx2d,
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      webWorkers: typeof Worker !== 'undefined',
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
    }
  }

  /**
   * 检测设备类型
   */
  private detectDeviceType(screenInfo: any, hardwareInfo: any): DeviceType {
    const { width, height } = screenInfo
    const { maxTouchPoints, userAgent } = hardwareInfo
    
    // 基于用户代理的检测
    const ua = userAgent.toLowerCase()
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return DeviceType.MOBILE
    }
    
    if (/tablet|ipad/i.test(ua)) {
      return DeviceType.TABLET
    }
    
    // 基于屏幕尺寸和触摸点的检测
    const screenSize = Math.max(width, height)
    
    if (maxTouchPoints > 0) {
      if (screenSize <= 768) {
        return DeviceType.MOBILE
      } else if (screenSize <= 1024) {
        return DeviceType.TABLET
      }
    }
    
    // 基于屏幕尺寸的桌面设备检测
    if (screenSize <= 1366) {
      return DeviceType.LAPTOP
    } else {
      return DeviceType.DESKTOP
    }
  }

  /**
   * 评估性能等级
   */
  private assessPerformanceLevel(memoryInfo: any, hardwareInfo: any, features: any): PerformanceLevel {
    let score = 0
    
    // CPU核心数评分
    const cores = hardwareInfo.hardwareConcurrency
    if (cores >= 8) score += 3
    else if (cores >= 4) score += 2
    else if (cores >= 2) score += 1
    
    // 内存评分
    const deviceMemory = memoryInfo.deviceMemory
    if (deviceMemory >= 8) score += 3
    else if (deviceMemory >= 4) score += 2
    else if (deviceMemory >= 2) score += 1
    
    // JS堆内存评分
    const heapLimit = memoryInfo.jsHeapSizeLimit
    if (heapLimit >= 4 * 1024 * 1024 * 1024) score += 2 // 4GB+
    else if (heapLimit >= 2 * 1024 * 1024 * 1024) score += 1 // 2GB+
    
    // WebGL支持评分
    if (features.webGL2) score += 2
    else if (features.webGL) score += 1
    
    // 其他功能支持评分
    if (features.offscreenCanvas) score += 1
    if (features.webWorkers) score += 1
    if (features.sharedArrayBuffer) score += 1
    
    // 根据总分确定性能等级
    if (score >= 10) return PerformanceLevel.ULTRA
    if (score >= 7) return PerformanceLevel.HIGH
    if (score >= 4) return PerformanceLevel.MEDIUM
    return PerformanceLevel.LOW
  }

  /**
   * 生成适配建议
   */
  private generateRecommendations(capabilities: DeviceCapabilities): AdaptationRecommendation {
    const { deviceType, performanceLevel, screenInfo, pixelDensity } = capabilities
    
    // 推荐DPI
    const recommendedDPI = this.getRecommendedDPI(deviceType, pixelDensity)
    
    // 推荐分辨率
    const recommendedResolutions = this.getRecommendedResolutions(deviceType, screenInfo)
    
    // 最大安全分辨率
    const maxSafeResolution = this.calculateMaxSafeResolution(performanceLevel, capabilities.memoryInfo)
    
    // 性能优化建议
    const performanceOptimizations = this.getPerformanceOptimizations(performanceLevel, capabilities)
    
    // 质量设置
    const qualitySettings = this.getQualitySettings(performanceLevel, capabilities.supportedFeatures)
    
    // 限制和警告
    const { limitations, warnings } = this.getLimitationsAndWarnings(capabilities)

    return {
      recommendedDPI,
      recommendedResolutions,
      maxSafeResolution,
      performanceOptimizations,
      qualitySettings,
      limitations,
      warnings
    }
  }

  /**
   * 获取推荐DPI
   */
  private getRecommendedDPI(deviceType: DeviceType, pixelDensity: PixelDensityInfo): number {
    switch (deviceType) {
      case DeviceType.MOBILE:
        return Math.min(300, Math.max(200, Math.round(pixelDensity.ppi)))
      case DeviceType.TABLET:
        return Math.min(264, Math.max(132, Math.round(pixelDensity.ppi * 0.8)))
      case DeviceType.LAPTOP:
        return Math.min(144, Math.max(96, Math.round(pixelDensity.ppi * 0.6)))
      case DeviceType.DESKTOP:
        return Math.min(120, Math.max(72, Math.round(pixelDensity.ppi * 0.5)))
      default:
        return 96
    }
  }

  /**
   * 获取推荐分辨率
   */
  private getRecommendedResolutions(deviceType: DeviceType, screenInfo: any): ResolutionInfo[] {
    const { width, height } = screenInfo
    const maxDimension = Math.max(width, height)
    
    let category: 'web' | 'mobile' | 'presentation'
    
    if (deviceType === DeviceType.MOBILE || deviceType === DeviceType.TABLET) {
      category = 'mobile'
    } else if (maxDimension >= 1920) {
      category = 'presentation'
    } else {
      category = 'web'
    }
    
    return resolutionManager.getRecommendedResolutions(category)
  }

  /**
   * 计算最大安全分辨率
   */
  private calculateMaxSafeResolution(performanceLevel: PerformanceLevel, memoryInfo: any): { width: number; height: number } {
    const heapLimit = memoryInfo.jsHeapSizeLimit || 2 * 1024 * 1024 * 1024 // 默认2GB
    const safeMemoryRatio = 0.3 // 使用30%的可用内存
    const bytesPerPixel = 4 // RGBA
    
    const maxPixels = Math.floor((heapLimit * safeMemoryRatio) / bytesPerPixel)
    
    // 根据性能等级调整
    let adjustedMaxPixels = maxPixels
    switch (performanceLevel) {
      case PerformanceLevel.LOW:
        adjustedMaxPixels = Math.min(maxPixels, 1024 * 768)
        break
      case PerformanceLevel.MEDIUM:
        adjustedMaxPixels = Math.min(maxPixels, 1920 * 1080)
        break
      case PerformanceLevel.HIGH:
        adjustedMaxPixels = Math.min(maxPixels, 2560 * 1440)
        break
      case PerformanceLevel.ULTRA:
        adjustedMaxPixels = Math.min(maxPixels, 3840 * 2160)
        break
    }
    
    // 计算16:9比例的最大尺寸
    const aspectRatio = 16 / 9
    const height = Math.floor(Math.sqrt(adjustedMaxPixels / aspectRatio))
    const width = Math.floor(height * aspectRatio)
    
    return { width, height }
  }

  /**
   * 获取性能优化建议
   */
  private getPerformanceOptimizations(performanceLevel: PerformanceLevel, capabilities: DeviceCapabilities): string[] {
    const optimizations: string[] = []
    
    if (performanceLevel === PerformanceLevel.LOW) {
      optimizations.push('使用较低的分辨率和DPI设置')
      optimizations.push('禁用抗锯齿和高级渲染效果')
      optimizations.push('使用简单的缩放算法')
      optimizations.push('避免同时处理多个大图像')
    }
    
    if (performanceLevel === PerformanceLevel.MEDIUM) {
      optimizations.push('适度使用抗锯齿')
      optimizations.push('限制同时处理的图像数量')
      optimizations.push('使用渐进式渲染')
    }
    
    if (capabilities.networkInfo.saveData) {
      optimizations.push('启用数据节省模式')
      optimizations.push('使用较小的文件尺寸')
    }
    
    if (!capabilities.supportedFeatures.webWorkers) {
      optimizations.push('避免复杂的后台处理')
    }
    
    return optimizations
  }

  /**
   * 获取质量设置
   */
  private getQualitySettings(performanceLevel: PerformanceLevel, features: any) {
    return {
      antiAliasing: performanceLevel !== PerformanceLevel.LOW,
      highQualityScaling: performanceLevel === PerformanceLevel.HIGH || performanceLevel === PerformanceLevel.ULTRA,
      backgroundProcessing: features.webWorkers && performanceLevel !== PerformanceLevel.LOW
    }
  }

  /**
   * 获取限制和警告
   */
  private getLimitationsAndWarnings(capabilities: DeviceCapabilities): { limitations: string[]; warnings: string[] } {
    const limitations: string[] = []
    const warnings: string[] = []
    
    if (capabilities.performanceLevel === PerformanceLevel.LOW) {
      limitations.push('高分辨率导出可能较慢')
      limitations.push('同时处理多个图像受限')
      warnings.push('建议使用较小的图像尺寸')
    }
    
    if (!capabilities.supportedFeatures.webGL) {
      limitations.push('不支持GPU加速渲染')
      warnings.push('复杂图像处理性能受限')
    }
    
    if (capabilities.memoryInfo.deviceMemory && capabilities.memoryInfo.deviceMemory < 4) {
      warnings.push('设备内存较少，建议避免超大图像')
    }
    
    if (capabilities.networkInfo.effectiveType === 'slow-2g' || capabilities.networkInfo.effectiveType === '2g') {
      warnings.push('网络连接较慢，建议使用较小的文件')
    }
    
    return { limitations, warnings }
  }

  /**
   * 计算检测置信度
   */
  private calculateConfidence(capabilities: DeviceCapabilities): number {
    let confidence = 0.5 // 基础置信度
    
    // 设备类型检测置信度
    if (capabilities.deviceType !== DeviceType.UNKNOWN) {
      confidence += 0.2
    }
    
    // 内存信息可用性
    if (capabilities.memoryInfo.deviceMemory) {
      confidence += 0.1
    }
    
    // 网络信息可用性
    if (capabilities.networkInfo.effectiveType) {
      confidence += 0.1
    }
    
    // 功能检测完整性
    const featureCount = Object.values(capabilities.supportedFeatures).filter(Boolean).length
    confidence += (featureCount / 6) * 0.1
    
    return Math.min(1.0, confidence)
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(): string {
    const screen = window.screen
    const navigator = window.navigator
    
    return `${screen.width}x${screen.height}_${screen.colorDepth}_${navigator.hardwareConcurrency}_${navigator.platform}`
  }

  /**
   * 清除检测缓存
   */
  public clearCache(): void {
    this.detectionCache.clear()
  }

  /**
   * 获取设备类型显示名称
   */
  public getDeviceTypeName(deviceType: DeviceType): string {
    const names = {
      [DeviceType.DESKTOP]: '台式机',
      [DeviceType.LAPTOP]: '笔记本电脑',
      [DeviceType.TABLET]: '平板电脑',
      [DeviceType.MOBILE]: '手机',
      [DeviceType.UNKNOWN]: '未知设备'
    }
    return names[deviceType]
  }

  /**
   * 获取性能等级显示名称
   */
  public getPerformanceLevelName(level: PerformanceLevel): string {
    const names = {
      [PerformanceLevel.LOW]: '低性能',
      [PerformanceLevel.MEDIUM]: '中等性能',
      [PerformanceLevel.HIGH]: '高性能',
      [PerformanceLevel.ULTRA]: '超高性能'
    }
    return names[level]
  }
}

// 导出单例实例
export const deviceAdaptationDetector = DeviceAdaptationDetector.getInstance()
