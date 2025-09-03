/**
 * Chart.js实时更新引擎
 * 创建Chart.js的实时数据更新核心引擎，支持数据流式更新和图表重绘优化
 */

import { Chart, ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js'
import { ref, reactive, computed } from 'vue'

// 图表更新配置接口
export interface ChartUpdateConfig {
  animationDuration: number
  enableAnimations: boolean
  batchUpdateDelay: number
  maxDataPoints: number
  enableVirtualization: boolean
  memoryThreshold: number
}

// 图表数据更新接口
export interface ChartDataUpdate {
  type: 'replace' | 'append' | 'update' | 'remove'
  data: any
  datasetIndex?: number
  pointIndex?: number
  animated?: boolean
}

// 图表性能统计
export interface ChartPerformanceStats {
  updateCount: number
  averageUpdateTime: number
  lastUpdateTime: number
  memoryUsage: number
  renderFrameRate: number
  dataPointCount: number
}

// 图表实例管理
interface ManagedChart {
  id: string
  chart: Chart
  config: ChartUpdateConfig
  lastUpdate: Date
  updateQueue: ChartDataUpdate[]
  performanceStats: ChartPerformanceStats
  isUpdating: boolean
}

/**
 * Chart.js实时更新引擎类
 */
export class ChartUpdateEngine {
  private static instance: ChartUpdateEngine
  
  // 图表实例管理
  private charts = new Map<string, ManagedChart>()
  private updateTimers = new Map<string, NodeJS.Timeout>()
  
  // 全局配置
  private globalConfig = reactive<ChartUpdateConfig>({
    animationDuration: 800,
    enableAnimations: true,
    batchUpdateDelay: 100,
    maxDataPoints: 1000,
    enableVirtualization: true,
    memoryThreshold: 100 * 1024 * 1024 // 100MB
  })
  
  // 性能监控
  private performanceMonitor = {
    totalUpdates: 0,
    totalUpdateTime: 0,
    memoryPeakUsage: 0,
    activeCharts: 0
  }

  private constructor() {
    this.startPerformanceMonitoring()
    console.log('📊 Chart.js实时更新引擎已初始化')
  }

  static getInstance(): ChartUpdateEngine {
    if (!ChartUpdateEngine.instance) {
      ChartUpdateEngine.instance = new ChartUpdateEngine()
    }
    return ChartUpdateEngine.instance
  }

  /**
   * 注册图表实例
   */
  registerChart(
    chartId: string, 
    chart: Chart, 
    config?: Partial<ChartUpdateConfig>
  ): void {
    const finalConfig = { ...this.globalConfig, ...config }
    
    const managedChart: ManagedChart = {
      id: chartId,
      chart,
      config: finalConfig,
      lastUpdate: new Date(),
      updateQueue: [],
      performanceStats: {
        updateCount: 0,
        averageUpdateTime: 0,
        lastUpdateTime: 0,
        memoryUsage: 0,
        renderFrameRate: 60,
        dataPointCount: 0
      },
      isUpdating: false
    }
    
    this.charts.set(chartId, managedChart)
    this.performanceMonitor.activeCharts++
    
    console.log(`📈 图表已注册: ${chartId}`)
  }

  /**
   * 注销图表实例
   */
  unregisterChart(chartId: string): void {
    const managedChart = this.charts.get(chartId)
    if (!managedChart) return
    
    // 清理定时器
    const timer = this.updateTimers.get(chartId)
    if (timer) {
      clearTimeout(timer)
      this.updateTimers.delete(chartId)
    }
    
    // 销毁图表
    managedChart.chart.destroy()
    this.charts.delete(chartId)
    this.performanceMonitor.activeCharts--
    
    console.log(`🗑️ 图表已注销: ${chartId}`)
  }

  /**
   * 更新图表数据（主要方法）
   */
  async updateChart(chartId: string, update: ChartDataUpdate): Promise<void> {
    const managedChart = this.charts.get(chartId)
    if (!managedChart) {
      console.warn(`⚠️ 图表不存在: ${chartId}`)
      return
    }

    // 添加到更新队列
    managedChart.updateQueue.push(update)
    
    // 如果启用批量更新，延迟处理
    if (managedChart.config.batchUpdateDelay > 0) {
      this.scheduleBatchUpdate(chartId)
    } else {
      await this.processUpdates(chartId)
    }
  }

  /**
   * 批量更新数据
   */
  async updateChartBatch(chartId: string, updates: ChartDataUpdate[]): Promise<void> {
    const managedChart = this.charts.get(chartId)
    if (!managedChart) return

    managedChart.updateQueue.push(...updates)
    await this.processUpdates(chartId)
  }

  /**
   * 替换图表数据
   */
  async replaceChartData(chartId: string, newData: ChartData): Promise<void> {
    const managedChart = this.charts.get(chartId)
    if (!managedChart) return

    const startTime = Date.now()
    managedChart.isUpdating = true

    try {
      // 保存动画设置
      const originalAnimation = managedChart.chart.options.animation
      
      // 临时禁用动画以提高性能
      if (!managedChart.config.enableAnimations) {
        managedChart.chart.options.animation = false
      }

      // 替换数据
      managedChart.chart.data = newData
      managedChart.chart.update('none')

      // 恢复动画设置
      managedChart.chart.options.animation = originalAnimation

      // 更新统计
      this.updatePerformanceStats(managedChart, Date.now() - startTime)
      
      console.log(`🔄 图表数据已替换: ${chartId}`)
    } catch (error) {
      console.error(`❌ 图表数据替换失败: ${chartId}`, error)
    } finally {
      managedChart.isUpdating = false
    }
  }

  /**
   * 调度批量更新
   */
  private scheduleBatchUpdate(chartId: string): void {
    // 清除现有定时器
    const existingTimer = this.updateTimers.get(chartId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的定时器
    const managedChart = this.charts.get(chartId)!
    const timer = setTimeout(() => {
      this.processUpdates(chartId)
      this.updateTimers.delete(chartId)
    }, managedChart.config.batchUpdateDelay)

    this.updateTimers.set(chartId, timer)
  }

  /**
   * 处理更新队列
   */
  private async processUpdates(chartId: string): Promise<void> {
    const managedChart = this.charts.get(chartId)
    if (!managedChart || managedChart.updateQueue.length === 0) return

    if (managedChart.isUpdating) {
      // 如果正在更新，稍后重试
      setTimeout(() => this.processUpdates(chartId), 50)
      return
    }

    const startTime = Date.now()
    managedChart.isUpdating = true

    try {
      const updates = [...managedChart.updateQueue]
      managedChart.updateQueue = []

      // 处理每个更新
      for (const update of updates) {
        await this.applyUpdate(managedChart, update)
      }

      // 执行图表更新
      const animationMode = managedChart.config.enableAnimations ? 'active' : 'none'
      managedChart.chart.update(animationMode)

      // 更新性能统计
      this.updatePerformanceStats(managedChart, Date.now() - startTime)

    } catch (error) {
      console.error(`❌ 图表更新失败: ${chartId}`, error)
    } finally {
      managedChart.isUpdating = false
    }
  }

  /**
   * 应用单个更新
   */
  private async applyUpdate(managedChart: ManagedChart, update: ChartDataUpdate): Promise<void> {
    const { chart } = managedChart
    const { type, data, datasetIndex = 0, pointIndex } = update

    switch (type) {
      case 'replace':
        if (chart.data.datasets[datasetIndex]) {
          chart.data.datasets[datasetIndex].data = data
        }
        break

      case 'append':
        if (chart.data.datasets[datasetIndex]) {
          const dataset = chart.data.datasets[datasetIndex]
          if (Array.isArray(dataset.data)) {
            dataset.data.push(...(Array.isArray(data) ? data : [data]))
            
            // 检查数据点限制
            if (dataset.data.length > managedChart.config.maxDataPoints) {
              const excess = dataset.data.length - managedChart.config.maxDataPoints
              dataset.data.splice(0, excess)
              
              // 同时更新标签
              if (chart.data.labels && Array.isArray(chart.data.labels)) {
                chart.data.labels.splice(0, excess)
              }
            }
          }
        }
        break

      case 'update':
        if (pointIndex !== undefined && chart.data.datasets[datasetIndex]) {
          const dataset = chart.data.datasets[datasetIndex]
          if (Array.isArray(dataset.data) && pointIndex < dataset.data.length) {
            dataset.data[pointIndex] = data
          }
        }
        break

      case 'remove':
        if (pointIndex !== undefined && chart.data.datasets[datasetIndex]) {
          const dataset = chart.data.datasets[datasetIndex]
          if (Array.isArray(dataset.data) && pointIndex < dataset.data.length) {
            dataset.data.splice(pointIndex, 1)
            
            // 同时移除对应的标签
            if (chart.data.labels && Array.isArray(chart.data.labels)) {
              chart.data.labels.splice(pointIndex, 1)
            }
          }
        }
        break
    }
  }

  /**
   * 更新性能统计
   */
  private updatePerformanceStats(managedChart: ManagedChart, updateTime: number): void {
    const stats = managedChart.performanceStats
    
    stats.updateCount++
    stats.lastUpdateTime = updateTime
    stats.averageUpdateTime = (stats.averageUpdateTime * (stats.updateCount - 1) + updateTime) / stats.updateCount
    
    // 计算数据点数量
    stats.dataPointCount = managedChart.chart.data.datasets.reduce((total, dataset) => {
      return total + (Array.isArray(dataset.data) ? dataset.data.length : 0)
    }, 0)
    
    // 更新全局统计
    this.performanceMonitor.totalUpdates++
    this.performanceMonitor.totalUpdateTime += updateTime
    
    managedChart.lastUpdate = new Date()
  }

  /**
   * 开始性能监控
   */
  private startPerformanceMonitoring(): void {
    // 每5秒检查一次性能
    setInterval(() => {
      this.checkPerformance()
    }, 5000)
  }

  /**
   * 检查性能
   */
  private checkPerformance(): void {
    // 检查内存使用
    if (typeof performance !== 'undefined' && performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize
      this.performanceMonitor.memoryPeakUsage = Math.max(
        this.performanceMonitor.memoryPeakUsage,
        memoryUsage
      )
      
      // 如果内存使用过高，触发清理
      if (memoryUsage > this.globalConfig.memoryThreshold) {
        this.performMemoryCleanup()
      }
    }
  }

  /**
   * 执行内存清理
   */
  private performMemoryCleanup(): void {
    console.log('🧹 执行图表内存清理')
    
    this.charts.forEach((managedChart, chartId) => {
      // 清理长时间未使用的图表
      const timeSinceLastUpdate = Date.now() - managedChart.lastUpdate.getTime()
      if (timeSinceLastUpdate > 300000) { // 5分钟
        console.log(`🗑️ 清理长时间未使用的图表: ${chartId}`)
        this.unregisterChart(chartId)
      }
    })
  }

  /**
   * 获取图表信息
   */
  getChartInfo(chartId: string): ManagedChart | undefined {
    return this.charts.get(chartId)
  }

  /**
   * 获取所有图表ID
   */
  getAllChartIds(): string[] {
    return Array.from(this.charts.keys())
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): any {
    const averageUpdateTime = this.performanceMonitor.totalUpdates > 0
      ? this.performanceMonitor.totalUpdateTime / this.performanceMonitor.totalUpdates
      : 0

    return {
      ...this.performanceMonitor,
      averageUpdateTime: Math.round(averageUpdateTime * 100) / 100,
      memoryUsageMB: Math.round(this.performanceMonitor.memoryPeakUsage / 1024 / 1024 * 100) / 100,
      chartsInfo: Array.from(this.charts.values()).map(chart => ({
        id: chart.id,
        updateCount: chart.performanceStats.updateCount,
        averageUpdateTime: chart.performanceStats.averageUpdateTime,
        dataPointCount: chart.performanceStats.dataPointCount,
        lastUpdate: chart.lastUpdate
      }))
    }
  }

  /**
   * 更新全局配置
   */
  updateGlobalConfig(config: Partial<ChartUpdateConfig>): void {
    Object.assign(this.globalConfig, config)
    console.log('⚙️ 全局配置已更新:', config)
  }

  /**
   * 暂停所有图表更新
   */
  pauseAllUpdates(): void {
    this.updateTimers.forEach((timer, chartId) => {
      clearTimeout(timer)
      this.updateTimers.delete(chartId)
    })
    console.log('⏸️ 所有图表更新已暂停')
  }

  /**
   * 恢复所有图表更新
   */
  resumeAllUpdates(): void {
    this.charts.forEach((managedChart, chartId) => {
      if (managedChart.updateQueue.length > 0) {
        this.scheduleBatchUpdate(chartId)
      }
    })
    console.log('▶️ 所有图表更新已恢复')
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    // 注销所有图表
    Array.from(this.charts.keys()).forEach(chartId => {
      this.unregisterChart(chartId)
    })
    
    // 清理定时器
    this.updateTimers.forEach(timer => clearTimeout(timer))
    this.updateTimers.clear()
    
    console.log('🗑️ Chart.js实时更新引擎已销毁')
  }
}

// 导出单例实例
export const chartUpdateEngine = ChartUpdateEngine.getInstance()
