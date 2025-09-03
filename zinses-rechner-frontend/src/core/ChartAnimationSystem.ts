/**
 * 图表动画过渡系统
 * 实现图表数据更新的平滑动画过渡效果，包括数据点移动动画、轴缩放动画和颜色渐变
 */

import { Chart, ChartType, AnimationOptions } from 'chart.js'
import { chartUpdateEngine } from './ChartUpdateEngine'

// 动画配置接口
export interface ChartAnimationConfig {
  duration: number
  easing: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
  delay: number
  loop: boolean
  animateRotate: boolean
  animateScale: boolean
}

// 动画类型
export type ChartAnimationType = 
  | 'data-update'
  | 'scale-change' 
  | 'color-transition'
  | 'chart-type-change'
  | 'dataset-toggle'

// 动画状态
export interface AnimationState {
  isAnimating: boolean
  animationType: ChartAnimationType
  progress: number
  startTime: number
  duration: number
}

// 自定义缓动函数
export interface EasingFunction {
  (t: number): number
}

/**
 * 图表动画系统类
 */
export class ChartAnimationSystem {
  private static instance: ChartAnimationSystem
  
  // 动画状态管理
  private animationStates = new Map<string, AnimationState>()
  private animationFrames = new Map<string, number>()
  
  // 预定义动画配置
  private animationConfigs: Record<ChartAnimationType, ChartAnimationConfig> = {
    'data-update': {
      duration: 800,
      easing: 'easeOutCubic',
      delay: 0,
      loop: false,
      animateRotate: true,
      animateScale: true
    },
    'scale-change': {
      duration: 600,
      easing: 'easeInOutQuad',
      delay: 0,
      loop: false,
      animateRotate: false,
      animateScale: true
    },
    'color-transition': {
      duration: 400,
      easing: 'easeOutQuad',
      delay: 0,
      loop: false,
      animateRotate: false,
      animateScale: false
    },
    'chart-type-change': {
      duration: 1000,
      easing: 'easeInOutCubic',
      delay: 100,
      loop: false,
      animateRotate: true,
      animateScale: true
    },
    'dataset-toggle': {
      duration: 500,
      easing: 'easeOutQuad',
      delay: 0,
      loop: false,
      animateRotate: false,
      animateScale: true
    }
  }

  // 自定义缓动函数
  private easingFunctions: Record<string, EasingFunction> = {
    linear: (t: number) => t,
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInElastic: (t: number) => {
      if (t === 0) return 0
      if (t === 1) return 1
      const p = 0.3
      const s = p / 4
      return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p))
    },
    easeOutElastic: (t: number) => {
      if (t === 0) return 0
      if (t === 1) return 1
      const p = 0.3
      const s = p / 4
      return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1
    }
  }

  private constructor() {
    console.log('🎬 图表动画系统已初始化')
  }

  static getInstance(): ChartAnimationSystem {
    if (!ChartAnimationSystem.instance) {
      ChartAnimationSystem.instance = new ChartAnimationSystem()
    }
    return ChartAnimationSystem.instance
  }

  /**
   * 配置图表动画
   */
  configureChartAnimation(chartId: string, animationType: ChartAnimationType): AnimationOptions {
    const config = this.animationConfigs[animationType]
    
    return {
      duration: config.duration,
      easing: config.easing as any,
      delay: config.delay,
      loop: config.loop,
      animateRotate: config.animateRotate,
      animateScale: config.animateScale,
      onProgress: (animation) => {
        this.updateAnimationState(chartId, animationType, animation.currentStep / animation.numSteps)
      },
      onComplete: () => {
        this.completeAnimation(chartId)
      }
    }
  }

  /**
   * 执行数据更新动画
   */
  async animateDataUpdate(
    chartId: string, 
    newData: any[], 
    datasetIndex: number = 0,
    customConfig?: Partial<ChartAnimationConfig>
  ): Promise<void> {
    const chartInfo = chartUpdateEngine.getChartInfo(chartId)
    if (!chartInfo) {
      console.warn(`⚠️ 图表不存在: ${chartId}`)
      return
    }

    const config = { ...this.animationConfigs['data-update'], ...customConfig }
    
    return new Promise((resolve) => {
      this.startAnimation(chartId, 'data-update', config.duration)
      
      // 更新图表配置以启用动画
      chartInfo.chart.options.animation = this.configureChartAnimation(chartId, 'data-update')
      
      // 更新数据
      if (chartInfo.chart.data.datasets[datasetIndex]) {
        chartInfo.chart.data.datasets[datasetIndex].data = newData
        chartInfo.chart.update('active')
      }
      
      // 动画完成后resolve
      setTimeout(() => {
        resolve()
      }, config.duration)
    })
  }

  /**
   * 执行轴缩放动画
   */
  async animateScaleChange(
    chartId: string,
    newScaleOptions: any,
    customConfig?: Partial<ChartAnimationConfig>
  ): Promise<void> {
    const chartInfo = chartUpdateEngine.getChartInfo(chartId)
    if (!chartInfo) return

    const config = { ...this.animationConfigs['scale-change'], ...customConfig }
    
    return new Promise((resolve) => {
      this.startAnimation(chartId, 'scale-change', config.duration)
      
      // 配置缩放动画
      chartInfo.chart.options.animation = this.configureChartAnimation(chartId, 'scale-change')
      
      // 更新轴配置
      if (chartInfo.chart.options.scales) {
        Object.assign(chartInfo.chart.options.scales, newScaleOptions)
        chartInfo.chart.update('active')
      }
      
      setTimeout(() => {
        resolve()
      }, config.duration)
    })
  }

  /**
   * 执行颜色过渡动画
   */
  async animateColorTransition(
    chartId: string,
    newColors: string[],
    datasetIndex: number = 0,
    customConfig?: Partial<ChartAnimationConfig>
  ): Promise<void> {
    const chartInfo = chartUpdateEngine.getChartInfo(chartId)
    if (!chartInfo) return

    const config = { ...this.animationConfigs['color-transition'], ...customConfig }
    const dataset = chartInfo.chart.data.datasets[datasetIndex]
    
    if (!dataset) return

    return new Promise((resolve) => {
      this.startAnimation(chartId, 'color-transition', config.duration)
      
      // 保存原始颜色
      const originalColors = Array.isArray(dataset.backgroundColor) 
        ? [...dataset.backgroundColor] 
        : [dataset.backgroundColor]
      
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / config.duration, 1)
        const easedProgress = this.easingFunctions[config.easing](progress)
        
        // 插值计算颜色
        const interpolatedColors = newColors.map((newColor, index) => {
          const originalColor = originalColors[index] || originalColors[0]
          return this.interpolateColor(originalColor as string, newColor, easedProgress)
        })
        
        // 更新颜色
        dataset.backgroundColor = interpolatedColors
        chartInfo.chart.update('none')
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          this.completeAnimation(chartId)
          resolve()
        }
      }
      
      animate()
    })
  }

  /**
   * 执行图表类型切换动画
   */
  async animateChartTypeChange(
    chartId: string,
    newType: ChartType,
    customConfig?: Partial<ChartAnimationConfig>
  ): Promise<void> {
    const chartInfo = chartUpdateEngine.getChartInfo(chartId)
    if (!chartInfo) return

    const config = { ...this.animationConfigs['chart-type-change'], ...customConfig }
    
    return new Promise((resolve) => {
      this.startAnimation(chartId, 'chart-type-change', config.duration)
      
      // 先淡出当前图表
      this.fadeOutChart(chartInfo.chart, config.duration / 2).then(() => {
        // 更改图表类型
        chartInfo.chart.config.type = newType
        chartInfo.chart.update('none')
        
        // 淡入新图表
        this.fadeInChart(chartInfo.chart, config.duration / 2).then(() => {
          this.completeAnimation(chartId)
          resolve()
        })
      })
    })
  }

  /**
   * 执行数据集切换动画
   */
  async animateDatasetToggle(
    chartId: string,
    datasetIndex: number,
    visible: boolean,
    customConfig?: Partial<ChartAnimationConfig>
  ): Promise<void> {
    const chartInfo = chartUpdateEngine.getChartInfo(chartId)
    if (!chartInfo) return

    const config = { ...this.animationConfigs['dataset-toggle'], ...customConfig }
    const dataset = chartInfo.chart.data.datasets[datasetIndex]
    
    if (!dataset) return

    return new Promise((resolve) => {
      this.startAnimation(chartId, 'dataset-toggle', config.duration)
      
      // 配置动画
      chartInfo.chart.options.animation = this.configureChartAnimation(chartId, 'dataset-toggle')
      
      // 切换数据集可见性
      chartInfo.chart.setDatasetVisibility(datasetIndex, visible)
      chartInfo.chart.update('active')
      
      setTimeout(() => {
        this.completeAnimation(chartId)
        resolve()
      }, config.duration)
    })
  }

  /**
   * 开始动画
   */
  private startAnimation(chartId: string, animationType: ChartAnimationType, duration: number): void {
    // 取消现有动画
    this.cancelAnimation(chartId)
    
    const animationState: AnimationState = {
      isAnimating: true,
      animationType,
      progress: 0,
      startTime: Date.now(),
      duration
    }
    
    this.animationStates.set(chartId, animationState)
    console.log(`🎬 开始动画: ${chartId} - ${animationType}`)
  }

  /**
   * 更新动画状态
   */
  private updateAnimationState(chartId: string, animationType: ChartAnimationType, progress: number): void {
    const state = this.animationStates.get(chartId)
    if (state && state.animationType === animationType) {
      state.progress = progress
    }
  }

  /**
   * 完成动画
   */
  private completeAnimation(chartId: string): void {
    const state = this.animationStates.get(chartId)
    if (state) {
      state.isAnimating = false
      state.progress = 1
      console.log(`✅ 动画完成: ${chartId} - ${state.animationType}`)
    }
  }

  /**
   * 取消动画
   */
  cancelAnimation(chartId: string): void {
    const frameId = this.animationFrames.get(chartId)
    if (frameId) {
      cancelAnimationFrame(frameId)
      this.animationFrames.delete(chartId)
    }
    
    const state = this.animationStates.get(chartId)
    if (state && state.isAnimating) {
      state.isAnimating = false
      console.log(`🚫 动画已取消: ${chartId}`)
    }
  }

  /**
   * 淡出图表
   */
  private fadeOutChart(chart: Chart, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const originalAlpha = chart.options.elements?.point?.backgroundColor || 1
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const alpha = 1 - progress
        
        // 更新透明度
        chart.data.datasets.forEach(dataset => {
          if (dataset.backgroundColor) {
            if (Array.isArray(dataset.backgroundColor)) {
              dataset.backgroundColor = dataset.backgroundColor.map(color => 
                this.adjustColorAlpha(color as string, alpha)
              )
            } else {
              dataset.backgroundColor = this.adjustColorAlpha(dataset.backgroundColor as string, alpha)
            }
          }
        })
        
        chart.update('none')
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      animate()
    })
  }

  /**
   * 淡入图表
   */
  private fadeInChart(chart: Chart, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const alpha = progress
        
        // 更新透明度
        chart.data.datasets.forEach(dataset => {
          if (dataset.backgroundColor) {
            if (Array.isArray(dataset.backgroundColor)) {
              dataset.backgroundColor = dataset.backgroundColor.map(color => 
                this.adjustColorAlpha(color as string, alpha)
              )
            } else {
              dataset.backgroundColor = this.adjustColorAlpha(dataset.backgroundColor as string, alpha)
            }
          }
        })
        
        chart.update('none')
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      animate()
    })
  }

  /**
   * 颜色插值
   */
  private interpolateColor(color1: string, color2: string, progress: number): string {
    // 简化的颜色插值实现
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) return color2
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * progress)
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * progress)
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * progress)
    
    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * 调整颜色透明度
   */
  private adjustColorAlpha(color: string, alpha: number): string {
    const rgb = this.hexToRgb(color)
    if (!rgb) return color
    
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
  }

  /**
   * 十六进制转RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  /**
   * 获取动画状态
   */
  getAnimationState(chartId: string): AnimationState | undefined {
    return this.animationStates.get(chartId)
  }

  /**
   * 获取所有动画状态
   */
  getAllAnimationStates(): Map<string, AnimationState> {
    return new Map(this.animationStates)
  }

  /**
   * 更新动画配置
   */
  updateAnimationConfig(animationType: ChartAnimationType, config: Partial<ChartAnimationConfig>): void {
    this.animationConfigs[animationType] = { ...this.animationConfigs[animationType], ...config }
    console.log(`⚙️ 动画配置已更新: ${animationType}`)
  }

  /**
   * 销毁动画系统
   */
  destroy(): void {
    // 取消所有动画
    this.animationStates.forEach((_, chartId) => {
      this.cancelAnimation(chartId)
    })
    
    this.animationStates.clear()
    this.animationFrames.clear()
    
    console.log('🗑️ 图表动画系统已销毁')
  }
}

// 导出单例实例
export const chartAnimationSystem = ChartAnimationSystem.getInstance()
