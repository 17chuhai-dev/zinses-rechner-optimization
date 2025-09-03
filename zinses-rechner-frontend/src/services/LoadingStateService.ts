/**
 * 加载状态管理服务
 * 提供统一的加载状态管理，包括骨架屏、进度条、加载动画等
 */

import { ref, reactive, computed } from 'vue'

// 加载状态类型
export type LoadingType = 'spinner' | 'skeleton' | 'progress' | 'dots' | 'pulse' | 'wave'

// 加载状态接口
export interface LoadingState {
  id: string
  type: LoadingType
  message?: string
  progress?: number
  isIndeterminate: boolean
  startTime: Date
  duration?: number
  context?: string
  priority: 'low' | 'medium' | 'high'
  cancelable: boolean
  onCancel?: () => void
}

// 加载配置接口
export interface LoadingConfig {
  type: LoadingType
  message?: string
  timeout?: number
  showProgress?: boolean
  cancelable?: boolean
  onCancel?: () => void
  context?: string
  priority?: 'low' | 'medium' | 'high'
  minDuration?: number
  delay?: number
}

// 骨架屏配置
export interface SkeletonConfig {
  rows: number
  columns?: number
  avatar?: boolean
  title?: boolean
  paragraph?: boolean
  image?: boolean
  chart?: boolean
  table?: boolean
  customShape?: 'rectangle' | 'circle' | 'rounded'
  animation?: 'pulse' | 'wave' | 'shimmer'
}

// 进度条配置
export interface ProgressConfig {
  value: number
  max?: number
  showPercentage?: boolean
  showLabel?: boolean
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  striped?: boolean
  animated?: boolean
}

/**
 * 加载状态管理服务类
 */
export class LoadingStateService {
  private static instance: LoadingStateService

  // 服务状态
  public readonly state = reactive({
    loadingStates: new Map<string, LoadingState>(),
    globalLoading: false,
    activeCount: 0,
    highPriorityCount: 0
  })

  // 默认配置
  private defaultConfig: LoadingConfig = {
    type: 'spinner',
    timeout: 30000,
    showProgress: false,
    cancelable: false,
    priority: 'medium',
    minDuration: 300,
    delay: 100
  }

  // 定时器映射
  private timers = new Map<string, number>()
  private delayTimers = new Map<string, number>()

  public static getInstance(): LoadingStateService {
    if (!LoadingStateService.instance) {
      LoadingStateService.instance = new LoadingStateService()
    }
    return LoadingStateService.instance
  }

  /**
   * 开始加载
   */
  public startLoading(config: LoadingConfig): string {
    const id = this.generateId()
    const finalConfig = { ...this.defaultConfig, ...config }
    
    const loadingState: LoadingState = {
      id,
      type: finalConfig.type,
      message: finalConfig.message,
      progress: finalConfig.showProgress ? 0 : undefined,
      isIndeterminate: !finalConfig.showProgress,
      startTime: new Date(),
      context: finalConfig.context,
      priority: finalConfig.priority || 'medium',
      cancelable: finalConfig.cancelable || false,
      onCancel: finalConfig.onCancel
    }

    // 延迟显示加载状态
    if (finalConfig.delay && finalConfig.delay > 0) {
      const delayTimer = window.setTimeout(() => {
        this.addLoadingState(loadingState)
        this.setupTimeout(id, finalConfig.timeout)
        this.delayTimers.delete(id)
      }, finalConfig.delay)
      
      this.delayTimers.set(id, delayTimer)
    } else {
      this.addLoadingState(loadingState)
      this.setupTimeout(id, finalConfig.timeout)
    }

    return id
  }

  /**
   * 停止加载
   */
  public stopLoading(id: string): void {
    const loadingState = this.state.loadingStates.get(id)
    if (!loadingState) return

    // 检查最小持续时间
    const elapsed = Date.now() - loadingState.startTime.getTime()
    const minDuration = this.defaultConfig.minDuration || 0

    if (elapsed < minDuration) {
      setTimeout(() => {
        this.removeLoadingState(id)
      }, minDuration - elapsed)
    } else {
      this.removeLoadingState(id)
    }
  }

  /**
   * 更新进度
   */
  public updateProgress(id: string, progress: number, message?: string): void {
    const loadingState = this.state.loadingStates.get(id)
    if (!loadingState) return

    loadingState.progress = Math.max(0, Math.min(100, progress))
    loadingState.isIndeterminate = false
    
    if (message) {
      loadingState.message = message
    }

    // 如果进度达到100%，自动停止加载
    if (progress >= 100) {
      setTimeout(() => {
        this.stopLoading(id)
      }, 500)
    }
  }

  /**
   * 取消加载
   */
  public cancelLoading(id: string): void {
    const loadingState = this.state.loadingStates.get(id)
    if (!loadingState || !loadingState.cancelable) return

    if (loadingState.onCancel) {
      loadingState.onCancel()
    }

    this.removeLoadingState(id)
  }

  /**
   * 获取加载状态
   */
  public getLoadingState(id: string): LoadingState | undefined {
    return this.state.loadingStates.get(id)
  }

  /**
   * 获取所有加载状态
   */
  public getAllLoadingStates(): LoadingState[] {
    return Array.from(this.state.loadingStates.values())
  }

  /**
   * 按上下文获取加载状态
   */
  public getLoadingStatesByContext(context: string): LoadingState[] {
    return this.getAllLoadingStates().filter(state => state.context === context)
  }

  /**
   * 检查是否正在加载
   */
  public isLoading(id?: string): boolean {
    if (id) {
      return this.state.loadingStates.has(id)
    }
    return this.state.activeCount > 0
  }

  /**
   * 检查全局加载状态
   */
  public isGlobalLoading(): boolean {
    return this.state.globalLoading || this.state.highPriorityCount > 0
  }

  /**
   * 清除所有加载状态
   */
  public clearAll(): void {
    // 清除所有定时器
    this.timers.forEach(timer => clearTimeout(timer))
    this.delayTimers.forEach(timer => clearTimeout(timer))
    
    this.timers.clear()
    this.delayTimers.clear()
    this.state.loadingStates.clear()
    this.updateGlobalState()
  }

  /**
   * 清除指定上下文的加载状态
   */
  public clearContext(context: string): void {
    const contextStates = this.getLoadingStatesByContext(context)
    contextStates.forEach(state => {
      this.removeLoadingState(state.id)
    })
  }

  /**
   * 设置全局加载状态
   */
  public setGlobalLoading(loading: boolean): void {
    this.state.globalLoading = loading
  }

  /**
   * 创建骨架屏加载
   */
  public createSkeletonLoading(config: SkeletonConfig & { context?: string }): string {
    return this.startLoading({
      type: 'skeleton',
      context: config.context,
      message: 'Inhalte werden geladen...',
      priority: 'low'
    })
  }

  /**
   * 创建进度条加载
   */
  public createProgressLoading(config: ProgressConfig & { context?: string; message?: string }): string {
    return this.startLoading({
      type: 'progress',
      context: config.context,
      message: config.message || 'Verarbeitung läuft...',
      showProgress: true,
      priority: 'medium'
    })
  }

  /**
   * 创建计算加载
   */
  public createCalculationLoading(message?: string): string {
    return this.startLoading({
      type: 'spinner',
      message: message || 'Berechnung läuft...',
      context: 'calculation',
      priority: 'high',
      timeout: 10000
    })
  }

  /**
   * 创建导出加载
   */
  public createExportLoading(format: string): string {
    return this.startLoading({
      type: 'progress',
      message: `${format.toUpperCase()}-Export wird vorbereitet...`,
      context: 'export',
      priority: 'medium',
      showProgress: true,
      cancelable: true,
      timeout: 60000
    })
  }

  /**
   * 创建网络请求加载
   */
  public createNetworkLoading(url: string): string {
    return this.startLoading({
      type: 'dots',
      message: 'Daten werden geladen...',
      context: 'network',
      priority: 'medium',
      timeout: 15000,
      delay: 200
    })
  }

  // 私有方法

  private addLoadingState(loadingState: LoadingState): void {
    this.state.loadingStates.set(loadingState.id, loadingState)
    this.updateGlobalState()
  }

  private removeLoadingState(id: string): void {
    // 清除相关定时器
    const timer = this.timers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(id)
    }

    const delayTimer = this.delayTimers.get(id)
    if (delayTimer) {
      clearTimeout(delayTimer)
      this.delayTimers.delete(id)
    }

    this.state.loadingStates.delete(id)
    this.updateGlobalState()
  }

  private updateGlobalState(): void {
    this.state.activeCount = this.state.loadingStates.size
    this.state.highPriorityCount = this.getAllLoadingStates()
      .filter(state => state.priority === 'high').length
  }

  private setupTimeout(id: string, timeout?: number): void {
    if (!timeout) return

    const timer = window.setTimeout(() => {
      this.removeLoadingState(id)
      console.warn(`Loading state ${id} timed out after ${timeout}ms`)
    }, timeout)

    this.timers.set(id, timer)
  }

  private generateId(): string {
    return `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 导出单例实例
export const loadingStateService = LoadingStateService.getInstance()

// 便捷的组合式API
export function useLoadingState() {
  const service = LoadingStateService.getInstance()
  
  return {
    // 状态
    loadingStates: computed(() => service.getAllLoadingStates()),
    activeCount: computed(() => service.state.activeCount),
    isGlobalLoading: computed(() => service.isGlobalLoading()),
    
    // 方法
    startLoading: service.startLoading.bind(service),
    stopLoading: service.stopLoading.bind(service),
    updateProgress: service.updateProgress.bind(service),
    cancelLoading: service.cancelLoading.bind(service),
    isLoading: service.isLoading.bind(service),
    clearAll: service.clearAll.bind(service),
    clearContext: service.clearContext.bind(service),
    setGlobalLoading: service.setGlobalLoading.bind(service),
    
    // 便捷方法
    createSkeletonLoading: service.createSkeletonLoading.bind(service),
    createProgressLoading: service.createProgressLoading.bind(service),
    createCalculationLoading: service.createCalculationLoading.bind(service),
    createExportLoading: service.createExportLoading.bind(service),
    createNetworkLoading: service.createNetworkLoading.bind(service)
  }
}

// 便捷函数
export async function withLoading<T>(
  operation: () => Promise<T>,
  config?: LoadingConfig
): Promise<T> {
  const service = LoadingStateService.getInstance()
  const loadingId = service.startLoading(config || {})
  
  try {
    const result = await operation()
    return result
  } finally {
    service.stopLoading(loadingId)
  }
}

export async function withProgressLoading<T>(
  operation: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
  config?: Omit<LoadingConfig, 'showProgress'>
): Promise<T> {
  const service = LoadingStateService.getInstance()
  const loadingId = service.startLoading({
    ...config,
    showProgress: true,
    type: 'progress'
  })
  
  const updateProgress = (progress: number, message?: string) => {
    service.updateProgress(loadingId, progress, message)
  }
  
  try {
    const result = await operation(updateProgress)
    return result
  } finally {
    service.stopLoading(loadingId)
  }
}
