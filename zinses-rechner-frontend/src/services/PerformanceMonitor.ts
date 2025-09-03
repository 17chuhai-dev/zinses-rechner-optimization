/**
 * 性能监控服务
 * 实时监控应用性能指标，包括页面加载时间、用户交互响应、内存使用等
 */

import { ref, reactive, computed } from 'vue'

// 性能指标类型
export interface PerformanceMetrics {
  // 页面性能
  pageLoad: {
    domContentLoaded: number
    loadComplete: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    firstInputDelay: number
    cumulativeLayoutShift: number
  }
  
  // 资源性能
  resources: {
    totalSize: number
    loadTime: number
    cacheHitRate: number
    failedRequests: number
  }
  
  // 用户体验
  userExperience: {
    interactionLatency: number
    scrollPerformance: number
    animationFrameRate: number
    errorRate: number
  }
  
  // 系统资源
  system: {
    memoryUsage: number
    cpuUsage: number
    networkSpeed: number
    deviceType: string
  }
  
  // 应用特定指标
  application: {
    calculationTime: number
    chartRenderTime: number
    exportTime: number
    cacheEfficiency: number
  }
}

// 性能警告级别
export type AlertLevel = 'info' | 'warning' | 'critical'

// 性能警告
export interface PerformanceAlert {
  id: string
  level: AlertLevel
  metric: string
  message: string
  value: number
  threshold: number
  timestamp: Date
  resolved: boolean
}

// 性能趋势数据
export interface PerformanceTrend {
  timestamp: Date
  metrics: Partial<PerformanceMetrics>
}

// 性能配置
export interface PerformanceConfig {
  enableRealTimeMonitoring: boolean
  samplingRate: number // 采样率 (0-1)
  alertThresholds: {
    pageLoadTime: number // ms
    memoryUsage: number // MB
    errorRate: number // %
    interactionLatency: number // ms
  }
  retentionPeriod: number // 数据保留天数
}

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor

  // 当前性能指标
  public readonly metrics = reactive<PerformanceMetrics>({
    pageLoad: {
      domContentLoaded: 0,
      loadComplete: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0
    },
    resources: {
      totalSize: 0,
      loadTime: 0,
      cacheHitRate: 0,
      failedRequests: 0
    },
    userExperience: {
      interactionLatency: 0,
      scrollPerformance: 0,
      animationFrameRate: 60,
      errorRate: 0
    },
    system: {
      memoryUsage: 0,
      cpuUsage: 0,
      networkSpeed: 0,
      deviceType: 'desktop'
    },
    application: {
      calculationTime: 0,
      chartRenderTime: 0,
      exportTime: 0,
      cacheEfficiency: 0
    }
  })

  // 性能警告
  public readonly alerts = ref<PerformanceAlert[]>([])

  // 性能趋势数据
  public readonly trends = ref<PerformanceTrend[]>([])

  // 监控状态
  public readonly isMonitoring = ref(false)
  public readonly lastUpdate = ref<Date>(new Date())

  // 配置
  private config: PerformanceConfig = {
    enableRealTimeMonitoring: true,
    samplingRate: 0.1, // 10% 采样率
    alertThresholds: {
      pageLoadTime: 3000, // 3秒
      memoryUsage: 100, // 100MB
      errorRate: 5, // 5%
      interactionLatency: 100 // 100ms
    },
    retentionPeriod: 7 // 7天
  }

  // 监控定时器
  private monitoringInterval?: number
  private performanceObserver?: PerformanceObserver

  // 统计计数器
  private counters = {
    interactions: 0,
    calculations: 0,
    exports: 0,
    errors: 0
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  constructor() {
    this.initializeMonitoring()
  }

  /**
   * 初始化性能监控
   */
  private initializeMonitoring(): void {
    // 检测设备类型
    this.detectDeviceType()

    // 监听页面性能事件
    this.setupPagePerformanceMonitoring()

    // 监听用户交互
    this.setupUserInteractionMonitoring()

    // 监听错误
    this.setupErrorMonitoring()

    // 启动实时监控
    if (this.config.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring()
    }

    console.log('🔍 Performance monitoring initialized')
  }

  /**
   * 启动实时监控
   */
  public startRealTimeMonitoring(): void {
    if (this.isMonitoring.value) return

    this.isMonitoring.value = true

    // 定期更新指标
    this.monitoringInterval = window.setInterval(() => {
      this.updateMetrics()
      this.checkAlerts()
      this.recordTrend()
    }, 5000) // 每5秒更新一次

    console.log('📊 Real-time performance monitoring started')
  }

  /**
   * 停止实时监控
   */
  public stopRealTimeMonitoring(): void {
    if (!this.isMonitoring.value) return

    this.isMonitoring.value = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }

    console.log('📊 Real-time performance monitoring stopped')
  }

  /**
   * 记录计算性能
   */
  public recordCalculationPerformance(duration: number): void {
    this.metrics.application.calculationTime = duration
    this.counters.calculations++

    // 检查是否需要警告
    if (duration > 1000) { // 超过1秒
      this.addAlert('warning', 'calculationTime', 
        `Berechnung dauerte ${duration}ms`, duration, 1000)
    }

    console.log(`⚡ Calculation performance: ${duration}ms`)
  }

  /**
   * 记录图表渲染性能
   */
  public recordChartRenderPerformance(duration: number): void {
    this.metrics.application.chartRenderTime = duration

    if (duration > 500) { // 超过500ms
      this.addAlert('warning', 'chartRenderTime', 
        `Diagramm-Rendering dauerte ${duration}ms`, duration, 500)
    }

    console.log(`📊 Chart render performance: ${duration}ms`)
  }

  /**
   * 记录导出性能
   */
  public recordExportPerformance(duration: number): void {
    this.metrics.application.exportTime = duration
    this.counters.exports++

    if (duration > 2000) { // 超过2秒
      this.addAlert('warning', 'exportTime', 
        `Export dauerte ${duration}ms`, duration, 2000)
    }

    console.log(`📤 Export performance: ${duration}ms`)
  }

  /**
   * 记录用户交互延迟
   */
  public recordInteractionLatency(duration: number): void {
    this.metrics.userExperience.interactionLatency = 
      (this.metrics.userExperience.interactionLatency + duration) / 2 // 移动平均
    this.counters.interactions++

    if (duration > this.config.alertThresholds.interactionLatency) {
      this.addAlert('warning', 'interactionLatency', 
        `Interaktion dauerte ${duration}ms`, duration, 
        this.config.alertThresholds.interactionLatency)
    }
  }

  /**
   * 记录错误
   */
  public recordError(error: Error | string): void {
    this.counters.errors++
    
    const errorRate = (this.counters.errors / Math.max(this.counters.interactions, 1)) * 100
    this.metrics.userExperience.errorRate = errorRate

    if (errorRate > this.config.alertThresholds.errorRate) {
      this.addAlert('critical', 'errorRate', 
        `Fehlerrate erreicht ${errorRate.toFixed(1)}%`, errorRate, 
        this.config.alertThresholds.errorRate)
    }

    console.error('❌ Error recorded:', error)
  }

  /**
   * 获取性能摘要
   */
  public getPerformanceSummary(): {
    overall: 'excellent' | 'good' | 'fair' | 'poor'
    score: number
    recommendations: string[]
  } {
    let score = 100
    const recommendations: string[] = []

    // 页面加载性能评分
    if (this.metrics.pageLoad.loadComplete > 3000) {
      score -= 20
      recommendations.push('Seitenladezeit optimieren')
    }

    // 内存使用评分
    if (this.metrics.system.memoryUsage > 100) {
      score -= 15
      recommendations.push('Speicherverbrauch reduzieren')
    }

    // 交互延迟评分
    if (this.metrics.userExperience.interactionLatency > 100) {
      score -= 15
      recommendations.push('Interaktionsgeschwindigkeit verbessern')
    }

    // 错误率评分
    if (this.metrics.userExperience.errorRate > 1) {
      score -= 25
      recommendations.push('Fehlerrate reduzieren')
    }

    // 应用性能评分
    if (this.metrics.application.calculationTime > 500) {
      score -= 10
      recommendations.push('Berechnungsgeschwindigkeit optimieren')
    }

    let overall: 'excellent' | 'good' | 'fair' | 'poor'
    if (score >= 90) overall = 'excellent'
    else if (score >= 70) overall = 'good'
    else if (score >= 50) overall = 'fair'
    else overall = 'poor'

    return { overall, score: Math.max(0, score), recommendations }
  }

  /**
   * 获取性能趋势
   */
  public getPerformanceTrends(hours: number = 24): PerformanceTrend[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.trends.value.filter(trend => trend.timestamp >= cutoff)
  }

  /**
   * 清除已解决的警告
   */
  public clearResolvedAlerts(): void {
    this.alerts.value = this.alerts.value.filter(alert => !alert.resolved)
  }

  /**
   * 解决警告
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.value.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (newConfig.enableRealTimeMonitoring !== undefined) {
      if (newConfig.enableRealTimeMonitoring) {
        this.startRealTimeMonitoring()
      } else {
        this.stopRealTimeMonitoring()
      }
    }
  }

  /**
   * 导出性能数据
   */
  public exportPerformanceData(): {
    metrics: PerformanceMetrics
    alerts: PerformanceAlert[]
    trends: PerformanceTrend[]
    summary: ReturnType<typeof this.getPerformanceSummary>
    exportTime: Date
  } {
    return {
      metrics: { ...this.metrics },
      alerts: [...this.alerts.value],
      trends: [...this.trends.value],
      summary: this.getPerformanceSummary(),
      exportTime: new Date()
    }
  }

  // 私有方法

  /**
   * 检测设备类型
   */
  private detectDeviceType(): void {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      this.metrics.system.deviceType = 'mobile'
    } else if (/tablet|ipad/.test(userAgent)) {
      this.metrics.system.deviceType = 'tablet'
    } else {
      this.metrics.system.deviceType = 'desktop'
    }
  }

  /**
   * 设置页面性能监控
   */
  private setupPagePerformanceMonitoring(): void {
    // 使用 Performance Observer API
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry)
        }
      })

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
      })
    }

    // 监听页面加载完成
    if (document.readyState === 'complete') {
      this.updatePageLoadMetrics()
    } else {
      window.addEventListener('load', () => {
        this.updatePageLoadMetrics()
      })
    }
  }

  /**
   * 处理性能条目
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming
        this.metrics.pageLoad.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.navigationStart
        this.metrics.pageLoad.loadComplete = navEntry.loadEventEnd - navEntry.navigationStart
        break

      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.pageLoad.firstContentfulPaint = entry.startTime
        }
        break

      case 'largest-contentful-paint':
        this.metrics.pageLoad.largestContentfulPaint = entry.startTime
        break

      case 'first-input':
        const fiEntry = entry as any
        this.metrics.pageLoad.firstInputDelay = fiEntry.processingStart - fiEntry.startTime
        break

      case 'layout-shift':
        const lsEntry = entry as any
        if (!lsEntry.hadRecentInput) {
          this.metrics.pageLoad.cumulativeLayoutShift += lsEntry.value
        }
        break
    }
  }

  /**
   * 更新页面加载指标
   */
  private updatePageLoadMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      this.metrics.pageLoad.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart
      this.metrics.pageLoad.loadComplete = navigation.loadEventEnd - navigation.navigationStart
    }
  }

  /**
   * 设置用户交互监控
   */
  private setupUserInteractionMonitoring(): void {
    // 监听点击事件
    document.addEventListener('click', (event) => {
      const startTime = performance.now()
      
      // 使用 requestAnimationFrame 测量响应时间
      requestAnimationFrame(() => {
        const duration = performance.now() - startTime
        this.recordInteractionLatency(duration)
      })
    })

    // 监听滚动性能
    let scrollStartTime = 0
    document.addEventListener('scroll', () => {
      if (scrollStartTime === 0) {
        scrollStartTime = performance.now()
      }
    })

    document.addEventListener('scrollend', () => {
      if (scrollStartTime > 0) {
        const duration = performance.now() - scrollStartTime
        this.metrics.userExperience.scrollPerformance = duration
        scrollStartTime = 0
      }
    })
  }

  /**
   * 设置错误监控
   */
  private setupErrorMonitoring(): void {
    // 监听 JavaScript 错误
    window.addEventListener('error', (event) => {
      this.recordError(event.error || event.message)
    })

    // 监听 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(event.reason)
    })
  }

  /**
   * 更新指标
   */
  private updateMetrics(): void {
    // 更新内存使用
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.system.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
    }

    // 更新网络速度
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.metrics.system.networkSpeed = connection.downlink || 0
    }

    // 更新动画帧率
    this.measureFrameRate()

    this.lastUpdate.value = new Date()
  }

  /**
   * 测量帧率
   */
  private measureFrameRate(): void {
    let frames = 0
    const startTime = performance.now()

    const countFrames = () => {
      frames++
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(countFrames)
      } else {
        this.metrics.userExperience.animationFrameRate = frames
      }
    }

    requestAnimationFrame(countFrames)
  }

  /**
   * 检查警告
   */
  private checkAlerts(): void {
    // 检查页面加载时间
    if (this.metrics.pageLoad.loadComplete > this.config.alertThresholds.pageLoadTime) {
      this.addAlert('warning', 'pageLoadTime', 
        `Seitenladezeit überschreitet ${this.config.alertThresholds.pageLoadTime}ms`, 
        this.metrics.pageLoad.loadComplete, this.config.alertThresholds.pageLoadTime)
    }

    // 检查内存使用
    if (this.metrics.system.memoryUsage > this.config.alertThresholds.memoryUsage) {
      this.addAlert('critical', 'memoryUsage', 
        `Speicherverbrauch überschreitet ${this.config.alertThresholds.memoryUsage}MB`, 
        this.metrics.system.memoryUsage, this.config.alertThresholds.memoryUsage)
    }
  }

  /**
   * 添加警告
   */
  private addAlert(level: AlertLevel, metric: string, message: string, value: number, threshold: number): void {
    // 避免重复警告
    const existingAlert = this.alerts.value.find(
      alert => alert.metric === metric && !alert.resolved && 
      Date.now() - alert.timestamp.getTime() < 60000 // 1分钟内
    )

    if (existingAlert) return

    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      metric,
      message,
      value,
      threshold,
      timestamp: new Date(),
      resolved: false
    }

    this.alerts.value.push(alert)

    // 限制警告数量
    if (this.alerts.value.length > 100) {
      this.alerts.value = this.alerts.value.slice(-50)
    }

    console.warn(`⚠️ Performance alert: ${message}`)
  }

  /**
   * 记录趋势数据
   */
  private recordTrend(): void {
    const trend: PerformanceTrend = {
      timestamp: new Date(),
      metrics: { ...this.metrics }
    }

    this.trends.value.push(trend)

    // 清理旧数据
    const cutoff = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000)
    this.trends.value = this.trends.value.filter(t => t.timestamp >= cutoff)
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance()

// 便捷的组合式API
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    // 状态
    metrics: monitor.metrics,
    alerts: monitor.alerts,
    trends: monitor.trends,
    isMonitoring: monitor.isMonitoring,
    lastUpdate: monitor.lastUpdate,
    
    // 计算属性
    performanceSummary: computed(() => monitor.getPerformanceSummary()),
    activeAlerts: computed(() => monitor.alerts.value.filter(alert => !alert.resolved)),
    
    // 方法
    startMonitoring: monitor.startRealTimeMonitoring.bind(monitor),
    stopMonitoring: monitor.stopRealTimeMonitoring.bind(monitor),
    recordCalculationPerformance: monitor.recordCalculationPerformance.bind(monitor),
    recordChartRenderPerformance: monitor.recordChartRenderPerformance.bind(monitor),
    recordExportPerformance: monitor.recordExportPerformance.bind(monitor),
    recordInteractionLatency: monitor.recordInteractionLatency.bind(monitor),
    recordError: monitor.recordError.bind(monitor),
    getPerformanceTrends: monitor.getPerformanceTrends.bind(monitor),
    clearResolvedAlerts: monitor.clearResolvedAlerts.bind(monitor),
    resolveAlert: monitor.resolveAlert.bind(monitor),
    updateConfig: monitor.updateConfig.bind(monitor),
    exportPerformanceData: monitor.exportPerformanceData.bind(monitor)
  }
}
