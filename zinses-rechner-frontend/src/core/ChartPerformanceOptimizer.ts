/**
 * 图表性能优化模块
 * 实现大数据量图表的性能优化，包括数据采样、虚拟渲染、增量更新和内存回收
 */

import { Chart } from 'chart.js'

// 性能优化配置
export interface PerformanceConfig {
  maxDataPoints: number
  samplingThreshold: number
  virtualRenderingEnabled: boolean
  incrementalUpdateEnabled: boolean
  memoryCleanupInterval: number
  renderThrottleDelay: number
}

// 数据采样策略
export type SamplingStrategy = 'uniform' | 'adaptive' | 'peak-preserving' | 'time-based'

// 性能指标
export interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  dataPointCount: number
  frameRate: number
  samplingRatio: number
  lastOptimization: Date
}

// 数据点接口
export interface DataPoint {
  x: number | string
  y: number
  timestamp?: number
  importance?: number
}

/**
 * 图表性能优化器类
 */
export class ChartPerformanceOptimizer {
  private static instance: ChartPerformanceOptimizer
  
  // 优化配置
  private config: PerformanceConfig = {
    maxDataPoints: 1000,
    samplingThreshold: 2000,
    virtualRenderingEnabled: true,
    incrementalUpdateEnabled: true,
    memoryCleanupInterval: 300000, // 5分钟
    renderThrottleDelay: 16 // ~60fps
  }
  
  // 性能监控
  private performanceMetrics = new Map<string, PerformanceMetrics>()
  private renderTimers = new Map<string, NodeJS.Timeout>()
  private memoryCleanupTimer: NodeJS.Timeout | null = null
  
  // 数据缓存
  private originalDataCache = new Map<string, any[]>()
  private sampledDataCache = new Map<string, any[]>()

  private constructor() {
    this.startMemoryCleanup()
    console.log('⚡ 图表性能优化器已初始化')
  }

  static getInstance(): ChartPerformanceOptimizer {
    if (!ChartPerformanceOptimizer.instance) {
      ChartPerformanceOptimizer.instance = new ChartPerformanceOptimizer()
    }
    return ChartPerformanceOptimizer.instance
  }

  /**
   * 优化图表数据
   */
  optimizeChartData(
    chartId: string,
    data: DataPoint[],
    strategy: SamplingStrategy = 'adaptive'
  ): DataPoint[] {
    const startTime = Date.now()
    
    // 缓存原始数据
    this.originalDataCache.set(chartId, [...data])
    
    let optimizedData = data
    
    // 如果数据量超过阈值，进行采样
    if (data.length > this.config.samplingThreshold) {
      optimizedData = this.sampleData(data, strategy, this.config.maxDataPoints)
      console.log(`📊 数据采样: ${data.length} → ${optimizedData.length} (${strategy})`)
    }
    
    // 缓存采样后的数据
    this.sampledDataCache.set(chartId, optimizedData)
    
    // 更新性能指标
    this.updatePerformanceMetrics(chartId, {
      renderTime: Date.now() - startTime,
      dataPointCount: optimizedData.length,
      samplingRatio: optimizedData.length / data.length,
      lastOptimization: new Date()
    })
    
    return optimizedData
  }

  /**
   * 数据采样
   */
  private sampleData(
    data: DataPoint[],
    strategy: SamplingStrategy,
    targetCount: number
  ): DataPoint[] {
    if (data.length <= targetCount) return data
    
    switch (strategy) {
      case 'uniform':
        return this.uniformSampling(data, targetCount)
      case 'adaptive':
        return this.adaptiveSampling(data, targetCount)
      case 'peak-preserving':
        return this.peakPreservingSampling(data, targetCount)
      case 'time-based':
        return this.timeBasedSampling(data, targetCount)
      default:
        return this.uniformSampling(data, targetCount)
    }
  }

  /**
   * 均匀采样
   */
  private uniformSampling(data: DataPoint[], targetCount: number): DataPoint[] {
    const step = data.length / targetCount
    const sampled: DataPoint[] = []
    
    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step)
      if (index < data.length) {
        sampled.push(data[index])
      }
    }
    
    return sampled
  }

  /**
   * 自适应采样
   */
  private adaptiveSampling(data: DataPoint[], targetCount: number): DataPoint[] {
    if (data.length <= targetCount) return data
    
    // 计算数据变化率
    const changes = this.calculateDataChanges(data)
    
    // 根据变化率分配采样点
    const sampled: DataPoint[] = []
    const totalChange = changes.reduce((sum, change) => sum + change, 0)
    
    let currentIndex = 0
    for (let i = 0; i < targetCount && currentIndex < data.length; i++) {
      sampled.push(data[currentIndex])
      
      // 根据变化率计算下一个采样点
      const remainingPoints = targetCount - i - 1
      const remainingData = data.length - currentIndex - 1
      
      if (remainingPoints > 0 && remainingData > 0) {
        const avgStep = remainingData / remainingPoints
        const changeWeight = changes[currentIndex] / totalChange
        const step = Math.max(1, Math.floor(avgStep * (1 + changeWeight)))
        currentIndex = Math.min(currentIndex + step, data.length - 1)
      } else {
        currentIndex++
      }
    }
    
    return sampled
  }

  /**
   * 峰值保持采样
   */
  private peakPreservingSampling(data: DataPoint[], targetCount: number): DataPoint[] {
    if (data.length <= targetCount) return data
    
    // 识别峰值点
    const peaks = this.identifyPeaks(data)
    const valleys = this.identifyValleys(data)
    const importantPoints = new Set([...peaks, ...valleys])
    
    // 确保包含重要点
    const sampled: DataPoint[] = []
    const step = data.length / targetCount
    
    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step)
      
      // 寻找附近的重要点
      let bestIndex = index
      for (let j = Math.max(0, index - 5); j <= Math.min(data.length - 1, index + 5); j++) {
        if (importantPoints.has(j)) {
          bestIndex = j
          break
        }
      }
      
      if (bestIndex < data.length) {
        sampled.push(data[bestIndex])
      }
    }
    
    return sampled
  }

  /**
   * 基于时间的采样
   */
  private timeBasedSampling(data: DataPoint[], targetCount: number): DataPoint[] {
    if (data.length <= targetCount) return data
    
    // 按时间间隔采样
    const timeSpan = this.getTimeSpan(data)
    const interval = timeSpan / targetCount
    
    const sampled: DataPoint[] = []
    let lastTime = 0
    
    for (const point of data) {
      const currentTime = this.getPointTime(point)
      
      if (currentTime - lastTime >= interval || sampled.length === 0) {
        sampled.push(point)
        lastTime = currentTime
      }
      
      if (sampled.length >= targetCount) break
    }
    
    return sampled
  }

  /**
   * 计算数据变化率
   */
  private calculateDataChanges(data: DataPoint[]): number[] {
    const changes: number[] = []
    
    for (let i = 1; i < data.length; i++) {
      const prev = typeof data[i - 1].y === 'number' ? data[i - 1].y : 0
      const curr = typeof data[i].y === 'number' ? data[i].y : 0
      changes.push(Math.abs(curr - prev))
    }
    
    return changes
  }

  /**
   * 识别峰值点
   */
  private identifyPeaks(data: DataPoint[]): number[] {
    const peaks: number[] = []
    
    for (let i = 1; i < data.length - 1; i++) {
      const prev = typeof data[i - 1].y === 'number' ? data[i - 1].y : 0
      const curr = typeof data[i].y === 'number' ? data[i].y : 0
      const next = typeof data[i + 1].y === 'number' ? data[i + 1].y : 0
      
      if (curr > prev && curr > next) {
        peaks.push(i)
      }
    }
    
    return peaks
  }

  /**
   * 识别谷值点
   */
  private identifyValleys(data: DataPoint[]): number[] {
    const valleys: number[] = []
    
    for (let i = 1; i < data.length - 1; i++) {
      const prev = typeof data[i - 1].y === 'number' ? data[i - 1].y : 0
      const curr = typeof data[i].y === 'number' ? data[i].y : 0
      const next = typeof data[i + 1].y === 'number' ? data[i + 1].y : 0
      
      if (curr < prev && curr < next) {
        valleys.push(i)
      }
    }
    
    return valleys
  }

  /**
   * 获取时间跨度
   */
  private getTimeSpan(data: DataPoint[]): number {
    if (data.length < 2) return 0
    
    const firstTime = this.getPointTime(data[0])
    const lastTime = this.getPointTime(data[data.length - 1])
    
    return lastTime - firstTime
  }

  /**
   * 获取数据点时间
   */
  private getPointTime(point: DataPoint): number {
    if (point.timestamp) return point.timestamp
    if (typeof point.x === 'number') return point.x
    if (typeof point.x === 'string') {
      const parsed = Date.parse(point.x)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  /**
   * 节流渲染更新
   */
  throttleRender(chartId: string, updateFunction: () => void): void {
    // 清除现有定时器
    const existingTimer = this.renderTimers.get(chartId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    
    // 设置新的定时器
    const timer = setTimeout(() => {
      updateFunction()
      this.renderTimers.delete(chartId)
    }, this.config.renderThrottleDelay)
    
    this.renderTimers.set(chartId, timer)
  }

  /**
   * 增量数据更新
   */
  incrementalUpdate(
    chartId: string,
    newData: DataPoint[],
    strategy: SamplingStrategy = 'adaptive'
  ): DataPoint[] {
    const cachedData = this.sampledDataCache.get(chartId) || []
    
    // 合并新数据
    const mergedData = [...cachedData, ...newData]
    
    // 如果超过阈值，重新采样
    if (mergedData.length > this.config.maxDataPoints) {
      return this.optimizeChartData(chartId, mergedData, strategy)
    }
    
    // 更新缓存
    this.sampledDataCache.set(chartId, mergedData)
    
    return mergedData
  }

  /**
   * 虚拟渲染优化
   */
  enableVirtualRendering(chart: Chart): void {
    if (!this.config.virtualRenderingEnabled) return
    
    // 实现视口裁剪
    const originalDraw = chart.draw
    chart.draw = function() {
      const ctx = this.ctx
      const chartArea = this.chartArea
      
      // 设置裁剪区域
      ctx.save()
      ctx.beginPath()
      ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top)
      ctx.clip()
      
      // 调用原始绘制方法
      originalDraw.call(this)
      
      // 恢复上下文
      ctx.restore()
    }
  }

  /**
   * 内存清理
   */
  private startMemoryCleanup(): void {
    this.memoryCleanupTimer = setInterval(() => {
      this.performMemoryCleanup()
    }, this.config.memoryCleanupInterval)
  }

  /**
   * 执行内存清理
   */
  private performMemoryCleanup(): void {
    const now = Date.now()
    const cleanupThreshold = 600000 // 10分钟
    
    // 清理长时间未使用的缓存
    this.performanceMetrics.forEach((metrics, chartId) => {
      const timeSinceLastOptimization = now - metrics.lastOptimization.getTime()
      
      if (timeSinceLastOptimization > cleanupThreshold) {
        this.originalDataCache.delete(chartId)
        this.sampledDataCache.delete(chartId)
        this.performanceMetrics.delete(chartId)
        console.log(`🧹 清理图表缓存: ${chartId}`)
      }
    })
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(chartId: string, updates: Partial<PerformanceMetrics>): void {
    const existing = this.performanceMetrics.get(chartId) || {
      renderTime: 0,
      memoryUsage: 0,
      dataPointCount: 0,
      frameRate: 60,
      samplingRatio: 1,
      lastOptimization: new Date()
    }
    
    this.performanceMetrics.set(chartId, { ...existing, ...updates })
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(chartId: string): PerformanceMetrics | undefined {
    return this.performanceMetrics.get(chartId)
  }

  /**
   * 获取所有性能指标
   */
  getAllPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceMetrics)
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('⚙️ 性能优化配置已更新:', config)
  }

  /**
   * 获取原始数据
   */
  getOriginalData(chartId: string): DataPoint[] | undefined {
    return this.originalDataCache.get(chartId)
  }

  /**
   * 获取采样数据
   */
  getSampledData(chartId: string): DataPoint[] | undefined {
    return this.sampledDataCache.get(chartId)
  }

  /**
   * 清理图表数据
   */
  clearChartData(chartId: string): void {
    this.originalDataCache.delete(chartId)
    this.sampledDataCache.delete(chartId)
    this.performanceMetrics.delete(chartId)
    
    const timer = this.renderTimers.get(chartId)
    if (timer) {
      clearTimeout(timer)
      this.renderTimers.delete(chartId)
    }
  }

  /**
   * 销毁优化器
   */
  destroy(): void {
    // 清理所有定时器
    this.renderTimers.forEach(timer => clearTimeout(timer))
    this.renderTimers.clear()
    
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer)
      this.memoryCleanupTimer = null
    }
    
    // 清理缓存
    this.originalDataCache.clear()
    this.sampledDataCache.clear()
    this.performanceMetrics.clear()
    
    console.log('🗑️ 图表性能优化器已销毁')
  }
}

// 导出单例实例
export const chartPerformanceOptimizer = ChartPerformanceOptimizer.getInstance()
