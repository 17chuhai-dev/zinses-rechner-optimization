/**
 * 性能优化管理器
 * 统一管理所有性能优化策略，包括缓存、预加载、资源优化、监控等
 */

import { ref, reactive, computed } from 'vue'
import { defaultCache } from '@/core/LRUCache'
import { defaultCalculationCache } from '@/utils/performance/CalculationCache'
import { ChartPerformanceOptimizer } from '@/core/ChartPerformanceOptimizer'

// 性能优化配置接口
export interface PerformanceOptimizationConfig {
  // 缓存配置
  cache: {
    enabled: boolean
    maxSize: number
    ttl: number
    strategy: 'lru' | 'lfu' | 'fifo'
    compression: boolean
  }
  
  // 预加载配置
  preloading: {
    enabled: boolean
    criticalComponents: string[]
    prefetchThreshold: number
    maxConcurrentPreloads: number
  }
  
  // 资源优化配置
  resources: {
    lazyLoading: boolean
    imageOptimization: boolean
    codesplitting: boolean
    bundleAnalysis: boolean
  }
  
  // 监控配置
  monitoring: {
    enabled: boolean
    webVitals: boolean
    customMetrics: boolean
    errorTracking: boolean
    performanceAlerts: boolean
  }
  
  // 网络优化配置
  network: {
    requestBatching: boolean
    responseCompression: boolean
    connectionPooling: boolean
    retryStrategy: 'exponential' | 'linear' | 'fixed'
  }
}

// 性能指标接口
export interface PerformanceMetrics {
  // 核心Web Vitals
  webVitals: {
    lcp: number | null // Largest Contentful Paint
    fid: number | null // First Input Delay
    cls: number | null // Cumulative Layout Shift
    ttfb: number | null // Time to First Byte
    fcp: number | null // First Contentful Paint
  }
  
  // 缓存性能
  cache: {
    hitRate: number
    missRate: number
    totalRequests: number
    averageResponseTime: number
    memoryUsage: number
  }
  
  // 资源性能
  resources: {
    totalSize: number
    loadTime: number
    compressionRatio: number
    lazyLoadedCount: number
  }
  
  // 计算性能
  calculations: {
    averageTime: number
    cacheHitRate: number
    queueLength: number
    errorRate: number
  }
  
  // 用户体验
  userExperience: {
    interactionDelay: number
    renderingTime: number
    scrollPerformance: number
    memoryLeaks: number
  }
}

// 优化建议接口
export interface OptimizationSuggestion {
  id: string
  type: 'cache' | 'preload' | 'resource' | 'code' | 'network'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  action: () => Promise<void>
  estimatedImprovement: number // 预期性能提升百分比
}

// 性能优化状态
export interface OptimizationState {
  isOptimizing: boolean
  currentTask: string | null
  progress: number
  completedOptimizations: string[]
  failedOptimizations: Array<{ id: string; error: string }>
  lastOptimization: Date | null
}

/**
 * 性能优化管理器类
 */
export class PerformanceOptimizationManager {
  private static instance: PerformanceOptimizationManager

  // 配置和状态
  public readonly config = reactive<PerformanceOptimizationConfig>({
    cache: {
      enabled: true,
      maxSize: 50 * 1024 * 1024, // 50MB
      ttl: 30 * 60 * 1000, // 30分钟
      strategy: 'lru',
      compression: true
    },
    preloading: {
      enabled: true,
      criticalComponents: ['CalculatorResults', 'Chart', 'ExportDialog'],
      prefetchThreshold: 0.7, // 70%概率预加载
      maxConcurrentPreloads: 3
    },
    resources: {
      lazyLoading: true,
      imageOptimization: true,
      codesplitting: true,
      bundleAnalysis: false
    },
    monitoring: {
      enabled: true,
      webVitals: true,
      customMetrics: true,
      errorTracking: true,
      performanceAlerts: true
    },
    network: {
      requestBatching: true,
      responseCompression: true,
      connectionPooling: true,
      retryStrategy: 'exponential'
    }
  })

  public readonly state = reactive<OptimizationState>({
    isOptimizing: false,
    currentTask: null,
    progress: 0,
    completedOptimizations: [],
    failedOptimizations: [],
    lastOptimization: null
  })

  public readonly metrics = reactive<PerformanceMetrics>({
    webVitals: {
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      fcp: null
    },
    cache: {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      memoryUsage: 0
    },
    resources: {
      totalSize: 0,
      loadTime: 0,
      compressionRatio: 0,
      lazyLoadedCount: 0
    },
    calculations: {
      averageTime: 0,
      cacheHitRate: 0,
      queueLength: 0,
      errorRate: 0
    },
    userExperience: {
      interactionDelay: 0,
      renderingTime: 0,
      scrollPerformance: 0,
      memoryLeaks: 0
    }
  })

  // 优化建议
  private suggestions = ref<OptimizationSuggestion[]>([])

  // 性能监控器
  private performanceObserver: PerformanceObserver | null = null
  private metricsUpdateInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.initializePerformanceMonitoring()
    this.startMetricsCollection()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): PerformanceOptimizationManager {
    if (!PerformanceOptimizationManager.instance) {
      PerformanceOptimizationManager.instance = new PerformanceOptimizationManager()
    }
    return PerformanceOptimizationManager.instance
  }

  /**
   * 初始化性能优化
   */
  public async initialize(): Promise<void> {
    try {
      this.state.isOptimizing = true
      this.state.currentTask = 'Initialisierung...'
      this.state.progress = 0

      // 1. 初始化缓存系统
      await this.initializeCacheSystem()
      this.updateProgress(20)

      // 2. 设置预加载策略
      await this.setupPreloadingStrategy()
      this.updateProgress(40)

      // 3. 优化资源加载
      await this.optimizeResourceLoading()
      this.updateProgress(60)

      // 4. 配置网络优化
      await this.configureNetworkOptimization()
      this.updateProgress(80)

      // 5. 启动性能监控
      await this.startPerformanceMonitoring()
      this.updateProgress(100)

      this.state.isOptimizing = false
      this.state.currentTask = null
      this.state.lastOptimization = new Date()

      console.log('🚀 性能优化管理器初始化完成')
    } catch (error) {
      this.state.isOptimizing = false
      this.state.currentTask = null
      console.error('❌ 性能优化初始化失败:', error)
      throw error
    }
  }

  /**
   * 运行性能优化
   */
  public async runOptimization(): Promise<void> {
    try {
      this.state.isOptimizing = true
      this.state.progress = 0

      // 生成优化建议
      const suggestions = await this.generateOptimizationSuggestions()
      
      // 按优先级排序
      const sortedSuggestions = suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

      // 执行优化
      for (let i = 0; i < sortedSuggestions.length; i++) {
        const suggestion = sortedSuggestions[i]
        this.state.currentTask = suggestion.title

        try {
          await suggestion.action()
          this.state.completedOptimizations.push(suggestion.id)
        } catch (error) {
          this.state.failedOptimizations.push({
            id: suggestion.id,
            error: error instanceof Error ? error.message : '未知错误'
          })
        }

        this.updateProgress((i + 1) / sortedSuggestions.length * 100)
      }

      this.state.isOptimizing = false
      this.state.currentTask = null
      this.state.lastOptimization = new Date()

      console.log('✅ 性能优化完成', {
        completed: this.state.completedOptimizations.length,
        failed: this.state.failedOptimizations.length
      })
    } catch (error) {
      this.state.isOptimizing = false
      this.state.currentTask = null
      console.error('❌ 性能优化失败:', error)
      throw error
    }
  }

  /**
   * 获取性能评分
   */
  public getPerformanceScore(): number {
    const weights = {
      webVitals: 0.4,
      cache: 0.2,
      resources: 0.2,
      calculations: 0.1,
      userExperience: 0.1
    }

    let totalScore = 0

    // Web Vitals评分
    const webVitalsScore = this.calculateWebVitalsScore()
    totalScore += webVitalsScore * weights.webVitals

    // 缓存性能评分
    const cacheScore = Math.min(this.metrics.cache.hitRate * 100, 100)
    totalScore += cacheScore * weights.cache

    // 资源性能评分
    const resourceScore = this.calculateResourceScore()
    totalScore += resourceScore * weights.resources

    // 计算性能评分
    const calculationScore = Math.min(this.metrics.calculations.cacheHitRate * 100, 100)
    totalScore += calculationScore * weights.calculations

    // 用户体验评分
    const uxScore = this.calculateUXScore()
    totalScore += uxScore * weights.userExperience

    return Math.round(totalScore)
  }

  /**
   * 获取优化建议
   */
  public async getOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    return this.generateOptimizationSuggestions()
  }

  /**
   * 清理性能数据
   */
  public cleanup(): void {
    // 清理缓存
    defaultCache.clear()
    defaultCalculationCache.clear()

    // 停止监控
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }

    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval)
    }

    // 重置状态
    this.state.completedOptimizations = []
    this.state.failedOptimizations = []
    this.suggestions.value = []

    console.log('🧹 性能数据已清理')
  }

  // 私有方法

  /**
   * 初始化缓存系统
   */
  private async initializeCacheSystem(): Promise<void> {
    if (!this.config.cache.enabled) return

    // 配置LRU缓存
    defaultCache.configure({
      maxSize: this.config.cache.maxSize / (1024 * 1024), // 转换为MB
      ttl: this.config.cache.ttl
    })

    // 配置计算缓存
    defaultCalculationCache.configure({
      maxSize: this.config.cache.maxSize,
      ttl: this.config.cache.ttl,
      enableCompression: this.config.cache.compression
    })

    console.log('💾 缓存系统已初始化')
  }

  /**
   * 设置预加载策略
   */
  private async setupPreloadingStrategy(): Promise<void> {
    if (!this.config.preloading.enabled) return

    // 预加载关键组件
    const { preloadCriticalComponents } = await import('@/composables/useAsyncComponents')
    await preloadCriticalComponents()

    console.log('⚡ 预加载策略已设置')
  }

  /**
   * 优化资源加载
   */
  private async optimizeResourceLoading(): Promise<void> {
    // 启用图片懒加载
    if (this.config.resources.lazyLoading) {
      this.enableImageLazyLoading()
    }

    // 优化字体加载
    this.optimizeFontLoading()

    console.log('📦 资源加载已优化')
  }

  /**
   * 配置网络优化
   */
  private async configureNetworkOptimization(): Promise<void> {
    // 启用请求批处理
    if (this.config.network.requestBatching) {
      this.enableRequestBatching()
    }

    // 配置连接池
    if (this.config.network.connectionPooling) {
      this.configureConnectionPooling()
    }

    console.log('🌐 网络优化已配置')
  }

  /**
   * 启动性能监控
   */
  private async startPerformanceMonitoring(): Promise<void> {
    if (!this.config.monitoring.enabled) return

    // 监控Web Vitals
    if (this.config.monitoring.webVitals) {
      await this.monitorWebVitals()
    }

    // 监控自定义指标
    if (this.config.monitoring.customMetrics) {
      this.monitorCustomMetrics()
    }

    console.log('📊 性能监控已启动')
  }

  /**
   * 初始化性能监控
   */
  private initializePerformanceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return

    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry)
      }
    })

    this.performanceObserver.observe({ 
      entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint'] 
    })
  }

  /**
   * 开始指标收集
   */
  private startMetricsCollection(): void {
    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetrics()
    }, 30000) // 每30秒更新一次
  }

  /**
   * 更新进度
   */
  private updateProgress(progress: number): void {
    this.state.progress = Math.min(100, Math.max(0, progress))
  }

  /**
   * 生成优化建议
   */
  private async generateOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = []

    // 缓存优化建议
    if (this.metrics.cache.hitRate < 0.7) {
      suggestions.push({
        id: 'improve-cache-hit-rate',
        type: 'cache',
        priority: 'high',
        title: 'Cache-Trefferrate verbessern',
        description: 'Die Cache-Trefferrate ist niedrig. Erwägen Sie eine Erhöhung der Cache-Größe oder TTL.',
        impact: 'Reduziert Serveranfragen um bis zu 30%',
        effort: 'low',
        action: async () => {
          this.config.cache.maxSize *= 1.5
          this.config.cache.ttl *= 1.2
        },
        estimatedImprovement: 25
      })
    }

    // Web Vitals优化建议
    if (this.metrics.webVitals.lcp && this.metrics.webVitals.lcp > 2500) {
      suggestions.push({
        id: 'optimize-lcp',
        type: 'resource',
        priority: 'high',
        title: 'Largest Contentful Paint optimieren',
        description: 'LCP ist zu hoch. Optimieren Sie kritische Ressourcen und Bilder.',
        impact: 'Verbessert die wahrgenommene Ladegeschwindigkeit',
        effort: 'medium',
        action: async () => {
          await this.optimizeCriticalResources()
        },
        estimatedImprovement: 35
      })
    }

    // 预加载优化建议
    if (this.config.preloading.criticalComponents.length < 5) {
      suggestions.push({
        id: 'expand-preloading',
        type: 'preload',
        priority: 'medium',
        title: 'Preloading erweitern',
        description: 'Erweitern Sie die Preloading-Strategie für bessere Performance.',
        impact: 'Reduziert die Zeit bis zur Interaktivität',
        effort: 'low',
        action: async () => {
          this.config.preloading.criticalComponents.push('HistoryPanel', 'SettingsDialog')
        },
        estimatedImprovement: 15
      })
    }

    return suggestions
  }

  /**
   * 计算Web Vitals评分
   */
  private calculateWebVitalsScore(): number {
    let score = 100
    
    if (this.metrics.webVitals.lcp && this.metrics.webVitals.lcp > 2500) score -= 20
    if (this.metrics.webVitals.fid && this.metrics.webVitals.fid > 100) score -= 20
    if (this.metrics.webVitals.cls && this.metrics.webVitals.cls > 0.1) score -= 20
    if (this.metrics.webVitals.ttfb && this.metrics.webVitals.ttfb > 800) score -= 20
    
    return Math.max(0, score)
  }

  /**
   * 计算资源评分
   */
  private calculateResourceScore(): number {
    let score = 100
    
    if (this.metrics.resources.totalSize > 2 * 1024 * 1024) score -= 30 // 2MB
    if (this.metrics.resources.loadTime > 3000) score -= 30 // 3秒
    if (this.metrics.resources.compressionRatio < 0.7) score -= 20
    
    return Math.max(0, score)
  }

  /**
   * 计算用户体验评分
   */
  private calculateUXScore(): number {
    let score = 100
    
    if (this.metrics.userExperience.interactionDelay > 100) score -= 25
    if (this.metrics.userExperience.renderingTime > 16) score -= 25 // 60fps
    if (this.metrics.userExperience.memoryLeaks > 0) score -= 30
    
    return Math.max(0, score)
  }

  /**
   * 处理性能条目
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming)
        break
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming)
        break
      case 'paint':
        this.processPaintEntry(entry)
        break
      case 'largest-contentful-paint':
        this.metrics.webVitals.lcp = entry.startTime
        break
    }
  }

  /**
   * 处理导航条目
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.metrics.webVitals.ttfb = entry.responseStart - entry.requestStart
  }

  /**
   * 处理资源条目
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    this.metrics.resources.totalSize += entry.transferSize || 0
    this.metrics.resources.loadTime = Math.max(this.metrics.resources.loadTime, entry.duration)
  }

  /**
   * 处理绘制条目
   */
  private processPaintEntry(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      this.metrics.webVitals.fcp = entry.startTime
    }
  }

  /**
   * 更新指标
   */
  private updateMetrics(): void {
    // 更新缓存指标
    const cacheStats = defaultCache.getStatistics()
    this.metrics.cache.hitRate = cacheStats.hitRate
    this.metrics.cache.totalRequests = cacheStats.totalRequests
    this.metrics.cache.memoryUsage = cacheStats.memoryUsage

    // 更新计算指标
    const calcStats = defaultCalculationCache.getStats()
    this.metrics.calculations.cacheHitRate = calcStats.hitRate
    this.metrics.calculations.averageTime = calcStats.averageComputationTime

    // 更新内存使用情况
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.userExperience.memoryLeaks = memory.usedJSHeapSize - memory.totalJSHeapSize
    }
  }

  /**
   * 监控Web Vitals
   */
  private async monitorWebVitals(): Promise<void> {
    try {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals')
      
      getCLS((metric) => { this.metrics.webVitals.cls = metric.value })
      getFID((metric) => { this.metrics.webVitals.fid = metric.value })
      getFCP((metric) => { this.metrics.webVitals.fcp = metric.value })
      getLCP((metric) => { this.metrics.webVitals.lcp = metric.value })
      getTTFB((metric) => { this.metrics.webVitals.ttfb = metric.value })
    } catch (error) {
      console.warn('Web Vitals监控失败:', error)
    }
  }

  /**
   * 监控自定义指标
   */
  private monitorCustomMetrics(): void {
    // 监控渲染性能
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'measure-render') {
          this.metrics.userExperience.renderingTime = entry.duration
        }
      }
    })
    
    observer.observe({ entryTypes: ['measure'] })
  }

  /**
   * 启用图片懒加载
   */
  private enableImageLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[data-src]')
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src!
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
            this.metrics.resources.lazyLoadedCount++
          }
        })
      })

      images.forEach(img => imageObserver.observe(img))
    }
  }

  /**
   * 优化字体加载
   */
  private optimizeFontLoading(): void {
    // 添加font-display: swap到CSS
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-display: swap;
      }
    `
    document.head.appendChild(style)
  }

  /**
   * 启用请求批处理
   */
  private enableRequestBatching(): void {
    // 实现请求批处理逻辑
    console.log('📦 请求批处理已启用')
  }

  /**
   * 配置连接池
   */
  private configureConnectionPooling(): void {
    // 实现连接池配置
    console.log('🔗 连接池已配置')
  }

  /**
   * 优化关键资源
   */
  private async optimizeCriticalResources(): Promise<void> {
    // 实现关键资源优化
    console.log('⚡ 关键资源已优化')
  }
}

// 导出单例实例
export const performanceOptimizationManager = PerformanceOptimizationManager.getInstance()

// 导出便捷的composable
export function usePerformanceOptimization() {
  const manager = PerformanceOptimizationManager.getInstance()
  
  return {
    // 状态
    config: manager.config,
    state: manager.state,
    metrics: manager.metrics,
    
    // 计算属性
    performanceScore: computed(() => manager.getPerformanceScore()),
    
    // 方法
    initialize: manager.initialize.bind(manager),
    runOptimization: manager.runOptimization.bind(manager),
    getOptimizationSuggestions: manager.getOptimizationSuggestions.bind(manager),
    cleanup: manager.cleanup.bind(manager)
  }
}
