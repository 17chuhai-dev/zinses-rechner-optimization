/**
 * 虚拟滚动优化器
 * 实现高性能的虚拟滚动功能，支持大数据量表格的流畅渲染
 */

// 虚拟滚动配置
export interface VirtualScrollConfig {
  itemHeight: number
  containerHeight: number
  bufferSize: number
  overscan: number
  enableSmoothScrolling: boolean
  throttleDelay: number
}

// 滚动状态
export interface ScrollState {
  scrollTop: number
  scrollLeft: number
  startIndex: number
  endIndex: number
  visibleCount: number
  totalHeight: number
}

// 渲染项目
export interface VirtualItem<T = any> {
  index: number
  data: T
  top: number
  height: number
  isVisible: boolean
}

// 性能指标
export interface VirtualScrollMetrics {
  renderTime: number
  scrollFPS: number
  visibleItems: number
  totalItems: number
  memoryUsage: number
  lastUpdate: Date
}

/**
 * 虚拟滚动优化器类
 */
export class VirtualScrollOptimizer<T = any> {
  private config: VirtualScrollConfig
  private scrollState: ScrollState
  private metrics: VirtualScrollMetrics
  private items: T[] = []
  private visibleItems: VirtualItem<T>[] = []
  
  // 性能优化
  private scrollTimer: NodeJS.Timeout | null = null
  private renderTimer: NodeJS.Timeout | null = null
  private lastScrollTime = 0
  private frameCount = 0
  private fpsTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<VirtualScrollConfig> = {}) {
    this.config = {
      itemHeight: 48,
      containerHeight: 400,
      bufferSize: 5,
      overscan: 3,
      enableSmoothScrolling: true,
      throttleDelay: 16, // ~60fps
      ...config
    }

    this.scrollState = {
      scrollTop: 0,
      scrollLeft: 0,
      startIndex: 0,
      endIndex: 0,
      visibleCount: 0,
      totalHeight: 0
    }

    this.metrics = {
      renderTime: 0,
      scrollFPS: 0,
      visibleItems: 0,
      totalItems: 0,
      memoryUsage: 0,
      lastUpdate: new Date()
    }

    this.startFPSMonitoring()
    console.log('📊 虚拟滚动优化器已初始化')
  }

  /**
   * 设置数据源
   */
  setItems(items: T[]): void {
    this.items = items
    this.updateScrollState()
    this.updateMetrics()
    
    console.log(`📋 数据源已更新: ${items.length} 项`)
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<VirtualScrollConfig>): void {
    this.config = { ...this.config, ...config }
    this.updateScrollState()
    console.log('⚙️ 虚拟滚动配置已更新')
  }

  /**
   * 处理滚动事件
   */
  handleScroll(scrollTop: number, scrollLeft: number = 0): void {
    const now = Date.now()
    this.lastScrollTime = now

    // 节流处理
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
    }

    this.scrollTimer = setTimeout(() => {
      this.updateScrollPosition(scrollTop, scrollLeft)
    }, this.config.throttleDelay)

    // 立即更新滚动位置（用于平滑滚动）
    if (this.config.enableSmoothScrolling) {
      this.scrollState.scrollTop = scrollTop
      this.scrollState.scrollLeft = scrollLeft
    }

    this.frameCount++
  }

  /**
   * 更新滚动位置
   */
  private updateScrollPosition(scrollTop: number, scrollLeft: number): void {
    const startTime = Date.now()

    this.scrollState.scrollTop = scrollTop
    this.scrollState.scrollLeft = scrollLeft

    this.updateVisibleRange()
    this.updateVisibleItems()
    this.updateMetrics()

    this.metrics.renderTime = Date.now() - startTime
    this.metrics.lastUpdate = new Date()
  }

  /**
   * 更新滚动状态
   */
  private updateScrollState(): void {
    const totalItems = this.items.length
    const containerHeight = this.config.containerHeight
    const itemHeight = this.config.itemHeight

    this.scrollState.totalHeight = totalItems * itemHeight
    this.scrollState.visibleCount = Math.ceil(containerHeight / itemHeight)

    this.updateVisibleRange()
    this.updateVisibleItems()
  }

  /**
   * 更新可见范围
   */
  private updateVisibleRange(): void {
    const { scrollTop } = this.scrollState
    const { itemHeight, bufferSize, overscan } = this.config
    const totalItems = this.items.length

    // 计算基础可见范围
    const startIndex = Math.floor(scrollTop / itemHeight)
    const visibleCount = this.scrollState.visibleCount

    // 添加缓冲区和预渲染
    const bufferedStart = Math.max(0, startIndex - bufferSize - overscan)
    const bufferedEnd = Math.min(totalItems - 1, startIndex + visibleCount + bufferSize + overscan)

    this.scrollState.startIndex = bufferedStart
    this.scrollState.endIndex = bufferedEnd
  }

  /**
   * 更新可见项目
   */
  private updateVisibleItems(): void {
    const { startIndex, endIndex } = this.scrollState
    const { itemHeight } = this.config
    const { scrollTop, containerHeight } = this.scrollState

    this.visibleItems = []

    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < this.items.length) {
        const top = i * itemHeight
        const bottom = top + itemHeight
        const isVisible = bottom >= scrollTop && top <= scrollTop + containerHeight

        this.visibleItems.push({
          index: i,
          data: this.items[i],
          top,
          height: itemHeight,
          isVisible
        })
      }
    }

    this.metrics.visibleItems = this.visibleItems.filter(item => item.isVisible).length
  }

  /**
   * 获取可见项目
   */
  getVisibleItems(): VirtualItem<T>[] {
    return this.visibleItems
  }

  /**
   * 获取滚动状态
   */
  getScrollState(): ScrollState {
    return { ...this.scrollState }
  }

  /**
   * 滚动到指定索引
   */
  scrollToIndex(index: number, behavior: 'auto' | 'smooth' = 'smooth'): void {
    const targetScrollTop = index * this.config.itemHeight
    const maxScrollTop = this.scrollState.totalHeight - this.config.containerHeight

    const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))

    if (behavior === 'smooth' && this.config.enableSmoothScrolling) {
      this.smoothScrollTo(finalScrollTop)
    } else {
      this.updateScrollPosition(finalScrollTop, this.scrollState.scrollLeft)
    }
  }

  /**
   * 平滑滚动到指定位置
   */
  private smoothScrollTo(targetScrollTop: number): void {
    const startScrollTop = this.scrollState.scrollTop
    const distance = targetScrollTop - startScrollTop
    const duration = 300 // ms
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 使用缓动函数
      const easeProgress = this.easeInOutCubic(progress)
      const currentScrollTop = startScrollTop + distance * easeProgress

      this.updateScrollPosition(currentScrollTop, this.scrollState.scrollLeft)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }

  /**
   * 缓动函数
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }

  /**
   * 获取项目位置信息
   */
  getItemPosition(index: number): { top: number; height: number } {
    return {
      top: index * this.config.itemHeight,
      height: this.config.itemHeight
    }
  }

  /**
   * 查找指定位置的项目索引
   */
  findItemIndexAtPosition(scrollTop: number): number {
    return Math.floor(scrollTop / this.config.itemHeight)
  }

  /**
   * 获取容器样式
   */
  getContainerStyle(): Record<string, string> {
    return {
      height: `${this.config.containerHeight}px`,
      overflow: 'auto',
      position: 'relative'
    }
  }

  /**
   * 获取内容样式
   */
  getContentStyle(): Record<string, string> {
    return {
      height: `${this.scrollState.totalHeight}px`,
      position: 'relative'
    }
  }

  /**
   * 获取项目样式
   */
  getItemStyle(item: VirtualItem<T>): Record<string, string> {
    return {
      position: 'absolute',
      top: `${item.top}px`,
      width: '100%',
      height: `${item.height}px`
    }
  }

  /**
   * 开始FPS监控
   */
  private startFPSMonitoring(): void {
    this.fpsTimer = setInterval(() => {
      const now = Date.now()
      const timeDiff = now - this.lastScrollTime

      if (timeDiff < 1000) {
        // 如果最近有滚动，计算FPS
        this.metrics.scrollFPS = Math.round(this.frameCount * 1000 / Math.max(timeDiff, 1))
      } else {
        this.metrics.scrollFPS = 0
      }

      this.frameCount = 0
    }, 1000)
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(): void {
    this.metrics.totalItems = this.items.length
    this.metrics.lastUpdate = new Date()

    // 估算内存使用（简化计算）
    const itemSize = 100 // 假设每个项目占用100字节
    this.metrics.memoryUsage = this.visibleItems.length * itemSize
  }

  /**
   * 获取性能指标
   */
  getMetrics(): VirtualScrollMetrics {
    return { ...this.metrics }
  }

  /**
   * 重置滚动位置
   */
  reset(): void {
    this.scrollState.scrollTop = 0
    this.scrollState.scrollLeft = 0
    this.updateScrollState()
    console.log('🔄 虚拟滚动已重置')
  }

  /**
   * 刷新渲染
   */
  refresh(): void {
    this.updateScrollState()
    console.log('🔄 虚拟滚动已刷新')
  }

  /**
   * 优化建议
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const { renderTime, scrollFPS, totalItems, visibleItems } = this.metrics

    if (renderTime > 16) {
      suggestions.push('渲染时间过长，建议增加节流延迟或减少缓冲区大小')
    }

    if (scrollFPS < 30 && scrollFPS > 0) {
      suggestions.push('滚动帧率较低，建议优化渲染逻辑或减少DOM操作')
    }

    if (totalItems > 10000 && this.config.bufferSize > 10) {
      suggestions.push('大数据量情况下建议减少缓冲区大小以节省内存')
    }

    if (visibleItems > 50) {
      suggestions.push('可见项目过多，建议增加项目高度或减少容器高度')
    }

    return suggestions
  }

  /**
   * 销毁优化器
   */
  destroy(): void {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
      this.scrollTimer = null
    }

    if (this.renderTimer) {
      clearTimeout(this.renderTimer)
      this.renderTimer = null
    }

    if (this.fpsTimer) {
      clearInterval(this.fpsTimer)
      this.fpsTimer = null
    }

    this.items = []
    this.visibleItems = []

    console.log('🗑️ 虚拟滚动优化器已销毁')
  }
}

// 导出工厂函数
export function createVirtualScrollOptimizer<T>(
  config?: Partial<VirtualScrollConfig>
): VirtualScrollOptimizer<T> {
  return new VirtualScrollOptimizer<T>(config)
}
