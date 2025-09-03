/**
 * 网络状态检测服务
 * 提供网络连接状态监控、连接质量检测、离线模式处理等功能
 */

import { ref, reactive } from 'vue'

// 网络状态类型
export type NetworkStatus = 'online' | 'offline' | 'slow' | 'unstable'

// 连接类型
export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'unknown'

// 网络质量等级
export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline'

// 网络状态接口
export interface NetworkState {
  isOnline: boolean
  status: NetworkStatus
  connectionType: ConnectionType
  quality: NetworkQuality
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
  lastOnline: Date | null
  lastOffline: Date | null
  outageCount: number
  totalOutageTime: number
}

// 网络检测配置
export interface NetworkConfig {
  pingInterval: number
  pingTimeout: number
  pingUrl: string
  qualityThresholds: {
    excellent: { rtt: number; downlink: number }
    good: { rtt: number; downlink: number }
    fair: { rtt: number; downlink: number }
    poor: { rtt: number; downlink: number }
  }
  retryAttempts: number
  retryDelay: number
}

// 网络事件接口
export interface NetworkEvent {
  type: 'online' | 'offline' | 'slow' | 'quality-change'
  timestamp: Date
  previousState?: NetworkState
  currentState: NetworkState
  duration?: number
}

/**
 * 网络状态检测服务类
 */
export class NetworkStatusService {
  private static instance: NetworkStatusService

  // 服务状态
  public readonly state = reactive<NetworkState>({
    isOnline: navigator.onLine,
    status: navigator.onLine ? 'online' : 'offline',
    connectionType: 'unknown',
    quality: 'offline',
    effectiveType: '',
    downlink: 0,
    rtt: 0,
    saveData: false,
    lastOnline: null,
    lastOffline: null,
    outageCount: 0,
    totalOutageTime: 0
  })

  // 配置
  private config: NetworkConfig = {
    pingInterval: 30000, // 30秒
    pingTimeout: 5000,   // 5秒
    pingUrl: '/api/health',
    qualityThresholds: {
      excellent: { rtt: 100, downlink: 10 },
      good: { rtt: 300, downlink: 5 },
      fair: { rtt: 600, downlink: 1.5 },
      poor: { rtt: 1000, downlink: 0.5 }
    },
    retryAttempts: 3,
    retryDelay: 1000
  }

  // 事件监听器
  private eventListeners: Array<(event: NetworkEvent) => void> = []

  // 定时器和状态
  private pingTimer?: number
  private lastPingTime = 0
  private consecutiveFailures = 0
  private isMonitoring = false

  public static getInstance(): NetworkStatusService {
    if (!NetworkStatusService.instance) {
      NetworkStatusService.instance = new NetworkStatusService()
    }
    return NetworkStatusService.instance
  }

  constructor() {
    this.initializeService()
  }

  /**
   * 初始化服务
   */
  private initializeService(): void {
    this.setupEventListeners()
    this.updateConnectionInfo()
    this.startMonitoring()
    
    // 初始状态设置
    if (this.state.isOnline) {
      this.state.lastOnline = new Date()
    } else {
      this.state.lastOffline = new Date()
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 基础网络状态监听
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // 连接信息变化监听
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', this.handleConnectionChange.bind(this))
    }

    // 页面可见性变化监听
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }

  /**
   * 开始监控
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.schedulePing()
    console.log('🌐 Network monitoring started')
  }

  /**
   * 停止监控
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.pingTimer) {
      clearTimeout(this.pingTimer)
      this.pingTimer = undefined
    }
    console.log('🌐 Network monitoring stopped')
  }

  /**
   * 调度Ping检测
   */
  private schedulePing(): void {
    if (!this.isMonitoring) return

    this.pingTimer = window.setTimeout(() => {
      this.performPing().finally(() => {
        this.schedulePing()
      })
    }, this.config.pingInterval)
  }

  /**
   * 执行Ping检测
   */
  private async performPing(): Promise<void> {
    if (!this.state.isOnline) return

    const startTime = performance.now()
    let success = false

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.pingTimeout)

        const response = await fetch(this.config.pingUrl, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          success = true
          break
        }
      } catch (error) {
        console.warn(`Ping attempt ${attempt + 1} failed:`, error)
        
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay)
        }
      }
    }

    const endTime = performance.now()
    const rtt = endTime - startTime

    this.updatePingResults(success, rtt)
  }

  /**
   * 更新Ping结果
   */
  private updatePingResults(success: boolean, rtt: number): void {
    if (success) {
      this.consecutiveFailures = 0
      this.state.rtt = Math.round(rtt)
      this.updateNetworkQuality()
      
      if (this.state.status === 'offline') {
        this.handleNetworkRecovery()
      }
    } else {
      this.consecutiveFailures++
      
      if (this.consecutiveFailures >= 2 && this.state.status !== 'offline') {
        this.handleNetworkFailure()
      }
    }
  }

  /**
   * 处理在线事件
   */
  private handleOnline(): void {
    const previousState = { ...this.state }
    
    this.state.isOnline = true
    this.state.status = 'online'
    this.state.lastOnline = new Date()
    
    // 计算离线时长
    if (this.state.lastOffline) {
      const outageTime = Date.now() - this.state.lastOffline.getTime()
      this.state.totalOutageTime += outageTime
    }
    
    this.updateConnectionInfo()
    this.updateNetworkQuality()
    
    this.emitEvent({
      type: 'online',
      timestamp: new Date(),
      previousState,
      currentState: { ...this.state }
    })
    
    console.log('🌐 Network is online')
  }

  /**
   * 处理离线事件
   */
  private handleOffline(): void {
    const previousState = { ...this.state }
    
    this.state.isOnline = false
    this.state.status = 'offline'
    this.state.quality = 'offline'
    this.state.lastOffline = new Date()
    this.state.outageCount++
    
    this.emitEvent({
      type: 'offline',
      timestamp: new Date(),
      previousState,
      currentState: { ...this.state }
    })
    
    console.log('📴 Network is offline')
  }

  /**
   * 处理网络恢复
   */
  private handleNetworkRecovery(): void {
    const previousState = { ...this.state }
    
    this.state.status = 'online'
    this.updateNetworkQuality()
    
    this.emitEvent({
      type: 'online',
      timestamp: new Date(),
      previousState,
      currentState: { ...this.state }
    })
    
    console.log('🌐 Network recovered')
  }

  /**
   * 处理网络故障
   */
  private handleNetworkFailure(): void {
    const previousState = { ...this.state }
    
    if (this.state.isOnline) {
      this.state.status = 'unstable'
    } else {
      this.state.status = 'offline'
      this.state.quality = 'offline'
    }
    
    this.emitEvent({
      type: 'offline',
      timestamp: new Date(),
      previousState,
      currentState: { ...this.state }
    })
    
    console.log('⚠️ Network failure detected')
  }

  /**
   * 处理连接信息变化
   */
  private handleConnectionChange(): void {
    this.updateConnectionInfo()
    this.updateNetworkQuality()
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // 页面变为可见时立即检测网络状态
      this.performPing()
    }
  }

  /**
   * 更新连接信息
   */
  private updateConnectionInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      this.state.effectiveType = connection.effectiveType || ''
      this.state.downlink = connection.downlink || 0
      this.state.saveData = connection.saveData || false
      
      // 推断连接类型
      this.state.connectionType = this.inferConnectionType(connection)
    }
  }

  /**
   * 推断连接类型
   */
  private inferConnectionType(connection: any): ConnectionType {
    if (connection.type) {
      switch (connection.type) {
        case 'wifi':
          return 'wifi'
        case 'cellular':
          return 'cellular'
        case 'ethernet':
          return 'ethernet'
        case 'bluetooth':
          return 'bluetooth'
        default:
          return 'unknown'
      }
    }
    
    // 基于effectiveType推断
    if (connection.effectiveType) {
      switch (connection.effectiveType) {
        case '4g':
        case '3g':
        case '2g':
          return 'cellular'
        default:
          return 'wifi'
      }
    }
    
    return 'unknown'
  }

  /**
   * 更新网络质量
   */
  private updateNetworkQuality(): void {
    if (!this.state.isOnline) {
      this.state.quality = 'offline'
      return
    }

    const { rtt, downlink } = this.state
    const { qualityThresholds } = this.config

    let newQuality: NetworkQuality = 'poor'

    if (rtt <= qualityThresholds.excellent.rtt && downlink >= qualityThresholds.excellent.downlink) {
      newQuality = 'excellent'
    } else if (rtt <= qualityThresholds.good.rtt && downlink >= qualityThresholds.good.downlink) {
      newQuality = 'good'
    } else if (rtt <= qualityThresholds.fair.rtt && downlink >= qualityThresholds.fair.downlink) {
      newQuality = 'fair'
    }

    if (this.state.quality !== newQuality) {
      const previousState = { ...this.state }
      this.state.quality = newQuality
      
      this.emitEvent({
        type: 'quality-change',
        timestamp: new Date(),
        previousState,
        currentState: { ...this.state }
      })
    }
  }

  /**
   * 检测网络速度
   */
  public async measureNetworkSpeed(): Promise<{ downloadSpeed: number; uploadSpeed: number }> {
    if (!this.state.isOnline) {
      return { downloadSpeed: 0, uploadSpeed: 0 }
    }

    try {
      // 下载速度测试
      const downloadSpeed = await this.measureDownloadSpeed()
      
      // 上传速度测试
      const uploadSpeed = await this.measureUploadSpeed()
      
      return { downloadSpeed, uploadSpeed }
    } catch (error) {
      console.error('Network speed measurement failed:', error)
      return { downloadSpeed: 0, uploadSpeed: 0 }
    }
  }

  /**
   * 测量下载速度
   */
  private async measureDownloadSpeed(): Promise<number> {
    const testSize = 1024 * 1024 // 1MB
    const startTime = performance.now()
    
    try {
      const response = await fetch(`/api/speed-test?size=${testSize}`, {
        cache: 'no-cache'
      })
      
      if (!response.ok) throw new Error('Speed test request failed')
      
      await response.blob()
      const endTime = performance.now()
      
      const duration = (endTime - startTime) / 1000 // 秒
      const speed = (testSize * 8) / duration / 1000000 // Mbps
      
      return Math.round(speed * 100) / 100
    } catch (error) {
      console.error('Download speed test failed:', error)
      return 0
    }
  }

  /**
   * 测量上传速度
   */
  private async measureUploadSpeed(): Promise<number> {
    const testData = new Blob([new ArrayBuffer(1024 * 512)]) // 512KB
    const startTime = performance.now()
    
    try {
      const response = await fetch('/api/speed-test', {
        method: 'POST',
        body: testData,
        cache: 'no-cache'
      })
      
      if (!response.ok) throw new Error('Upload speed test failed')
      
      const endTime = performance.now()
      const duration = (endTime - startTime) / 1000 // 秒
      const speed = (testData.size * 8) / duration / 1000000 // Mbps
      
      return Math.round(speed * 100) / 100
    } catch (error) {
      console.error('Upload speed test failed:', error)
      return 0
    }
  }

  /**
   * 添加事件监听器
   */
  public addEventListener(listener: (event: NetworkEvent) => void): void {
    this.eventListeners.push(listener)
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(listener: (event: NetworkEvent) => void): void {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  /**
   * 发出事件
   */
  private emitEvent(event: NetworkEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Network event listener error:', error)
      }
    })
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取网络状态
   */
  public getState(): NetworkState {
    return { ...this.state }
  }

  /**
   * 设置配置
   */
  public setConfig(newConfig: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取网络统计
   */
  public getStatistics() {
    return {
      outageCount: this.state.outageCount,
      totalOutageTime: this.state.totalOutageTime,
      averageOutageTime: this.state.outageCount > 0 ? this.state.totalOutageTime / this.state.outageCount : 0,
      uptime: this.state.lastOnline ? Date.now() - this.state.lastOnline.getTime() : 0,
      currentQuality: this.state.quality,
      connectionType: this.state.connectionType
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.stopMonitoring()
    this.eventListeners = []
    
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.removeEventListener('change', this.handleConnectionChange.bind(this))
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }
}

// 导出单例实例
export const networkStatusService = NetworkStatusService.getInstance()

// 便捷的组合式API
export function useNetworkStatus() {
  const service = NetworkStatusService.getInstance()
  
  return {
    // 状态
    state: service.state,
    isOnline: () => service.state.isOnline,
    status: () => service.state.status,
    quality: () => service.state.quality,
    connectionType: () => service.state.connectionType,
    
    // 方法
    startMonitoring: service.startMonitoring.bind(service),
    stopMonitoring: service.stopMonitoring.bind(service),
    measureNetworkSpeed: service.measureNetworkSpeed.bind(service),
    addEventListener: service.addEventListener.bind(service),
    removeEventListener: service.removeEventListener.bind(service),
    getStatistics: service.getStatistics.bind(service),
    setConfig: service.setConfig.bind(service)
  }
}
