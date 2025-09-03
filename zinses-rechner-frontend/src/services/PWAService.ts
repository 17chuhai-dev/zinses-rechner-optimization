/**
 * PWA管理服务
 * 提供Service Worker注册、更新检测、离线状态管理、安装提示等功能
 */

import { ref, reactive } from 'vue'

// PWA状态接口
export interface PWAState {
  isInstalled: boolean
  isInstallable: boolean
  isOffline: boolean
  hasUpdate: boolean
  isUpdating: boolean
  swRegistration: ServiceWorkerRegistration | null
  installPrompt: BeforeInstallPromptEvent | null
  cacheSize: number
  lastSync: Date | null
}

// PWA配置接口
export interface PWAConfig {
  swPath: string
  updateCheckInterval: number
  enableNotifications: boolean
  enableBackgroundSync: boolean
  maxCacheSize: number
  offlinePages: string[]
}

// 安装提示事件接口
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * PWA管理服务类
 */
export class PWAService {
  private static instance: PWAService

  // 服务状态
  public readonly state = reactive<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOffline: !navigator.onLine,
    hasUpdate: false,
    isUpdating: false,
    swRegistration: null,
    installPrompt: null,
    cacheSize: 0,
    lastSync: null
  })

  // 配置
  private config: PWAConfig = {
    swPath: '/sw.js',
    updateCheckInterval: 60000, // 1分钟
    enableNotifications: true,
    enableBackgroundSync: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    offlinePages: ['/', '/calculator', '/history']
  }

  // 定时器
  private updateCheckTimer?: number

  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService()
    }
    return PWAService.instance
  }

  constructor() {
    this.initializeService()
  }

  /**
   * 初始化服务
   */
  private async initializeService(): Promise<void> {
    // 检查PWA支持
    if (!this.isPWASupported()) {
      console.warn('PWA features not supported in this browser')
      return
    }

    // 注册Service Worker
    await this.registerServiceWorker()

    // 设置事件监听器
    this.setupEventListeners()

    // 检查安装状态
    this.checkInstallationStatus()

    // 开始定期更新检查
    this.startUpdateCheck()

    // 获取缓存大小
    this.updateCacheSize()
  }

  /**
   * 检查PWA支持
   */
  private isPWASupported(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window
  }

  /**
   * 注册Service Worker
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register(this.config.swPath, {
        scope: '/'
      })

      this.state.swRegistration = registration
      console.log('✅ Service Worker registered successfully')

      // 监听更新
      registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate(registration)
      })

      // 检查是否有等待的Service Worker
      if (registration.waiting) {
        this.state.hasUpdate = true
      }

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
    }
  }

  /**
   * 处理Service Worker更新
   */
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
    const newWorker = registration.installing

    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.state.hasUpdate = true
          this.notifyUpdate()
        }
      })
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 网络状态监听
    window.addEventListener('online', () => {
      this.state.isOffline = false
      this.handleOnline()
    })

    window.addEventListener('offline', () => {
      this.state.isOffline = true
      this.handleOffline()
    })

    // 安装提示监听
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.state.installPrompt = e as BeforeInstallPromptEvent
      this.state.isInstallable = true
      console.log('📱 PWA install prompt available')
    })

    // 应用安装监听
    window.addEventListener('appinstalled', () => {
      this.state.isInstalled = true
      this.state.isInstallable = false
      this.state.installPrompt = null
      console.log('🎉 PWA installed successfully')
    })

    // Service Worker消息监听
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event)
    })
  }

  /**
   * 检查安装状态
   */
  private checkInstallationStatus(): void {
    // 检查是否在独立模式运行（已安装）
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.state.isInstalled = true
    }

    // 检查是否在PWA模式运行
    if ((navigator as any).standalone === true) {
      this.state.isInstalled = true
    }
  }

  /**
   * 开始定期更新检查
   */
  private startUpdateCheck(): void {
    this.updateCheckTimer = window.setInterval(() => {
      this.checkForUpdates()
    }, this.config.updateCheckInterval)
  }

  /**
   * 检查更新
   */
  public async checkForUpdates(): Promise<void> {
    if (!this.state.swRegistration) return

    try {
      await this.state.swRegistration.update()
    } catch (error) {
      console.error('Update check failed:', error)
    }
  }

  /**
   * 应用更新
   */
  public async applyUpdate(): Promise<void> {
    if (!this.state.swRegistration?.waiting) return

    this.state.isUpdating = true

    try {
      // 发送跳过等待消息
      this.state.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })

      // 等待控制器变更
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          resolve()
        }, { once: true })
      })

      this.state.hasUpdate = false
      this.state.isUpdating = false

      // 重新加载页面
      window.location.reload()
    } catch (error) {
      console.error('Update application failed:', error)
      this.state.isUpdating = false
    }
  }

  /**
   * 安装PWA
   */
  public async installPWA(): Promise<boolean> {
    if (!this.state.installPrompt) {
      console.warn('Install prompt not available')
      return false
    }

    try {
      await this.state.installPrompt.prompt()
      const { outcome } = await this.state.installPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('✅ PWA installation accepted')
        return true
      } else {
        console.log('❌ PWA installation dismissed')
        return false
      }
    } catch (error) {
      console.error('PWA installation failed:', error)
      return false
    }
  }

  /**
   * 请求通知权限
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Notification permission request failed:', error)
      return false
    }
  }

  /**
   * 发送通知
   */
  public async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.config.enableNotifications) return

    const hasPermission = await this.requestNotificationPermission()
    if (!hasPermission) return

    try {
      if (this.state.swRegistration) {
        await this.state.swRegistration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options
        })
      } else {
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          ...options
        })
      }
    } catch (error) {
      console.error('Notification failed:', error)
    }
  }

  /**
   * 注册后台同步
   */
  public async registerBackgroundSync(tag: string): Promise<void> {
    if (!this.config.enableBackgroundSync || !this.state.swRegistration) return

    try {
      await this.state.swRegistration.sync.register(tag)
      console.log('✅ Background sync registered:', tag)
    } catch (error) {
      console.error('Background sync registration failed:', error)
    }
  }

  /**
   * 清除缓存
   */
  public async clearCache(): Promise<void> {
    if (!this.state.swRegistration) return

    try {
      await this.sendMessageToSW({ type: 'CLEAR_CACHE' })
      this.updateCacheSize()
      console.log('✅ Cache cleared')
    } catch (error) {
      console.error('Cache clearing failed:', error)
    }
  }

  /**
   * 获取缓存大小
   */
  public async updateCacheSize(): Promise<void> {
    try {
      const size = await this.sendMessageToSW({ type: 'GET_CACHE_SIZE' })
      this.state.cacheSize = size || 0
    } catch (error) {
      console.error('Cache size calculation failed:', error)
    }
  }

  /**
   * 预缓存资源
   */
  public async precacheResource(url: string): Promise<void> {
    if (!this.state.swRegistration) return

    try {
      await this.sendMessageToSW({
        type: 'CACHE_RESOURCE',
        data: { url, strategy: 'cache-first' }
      })
    } catch (error) {
      console.error('Resource precaching failed:', error)
    }
  }

  /**
   * 处理在线状态
   */
  private handleOnline(): void {
    console.log('🌐 Device is online')
    this.registerBackgroundSync('data-sync')
    this.state.lastSync = new Date()
  }

  /**
   * 处理离线状态
   */
  private handleOffline(): void {
    console.log('📴 Device is offline')
    this.sendNotification('Offline-Modus', {
      body: 'Sie sind offline. Grundlegende Funktionen sind weiterhin verfügbar.',
      tag: 'offline-notification'
    })
  }

  /**
   * 通知更新可用
   */
  private notifyUpdate(): void {
    this.sendNotification('Update verfügbar', {
      body: 'Eine neue Version der App ist verfügbar. Klicken Sie hier, um zu aktualisieren.',
      tag: 'update-notification',
      requireInteraction: true,
      actions: [
        { action: 'update', title: 'Aktualisieren' },
        { action: 'dismiss', title: 'Später' }
      ]
    })
  }

  /**
   * 处理Service Worker消息
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data

    switch (type) {
      case 'CACHE_SIZE':
        this.state.cacheSize = data.size
        break
      case 'SYNC_COMPLETE':
        this.state.lastSync = new Date()
        break
      default:
        console.log('Unknown SW message:', type, data)
    }
  }

  /**
   * 向Service Worker发送消息
   */
  private async sendMessageToSW(message: any): Promise<any> {
    if (!this.state.swRegistration?.active) {
      throw new Error('Service Worker not active')
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data)
        }
      }

      this.state.swRegistration!.active!.postMessage(message, [messageChannel.port2])
    })
  }

  /**
   * 获取PWA状态
   */
  public getState(): PWAState {
    return { ...this.state }
  }

  /**
   * 设置配置
   */
  public setConfig(newConfig: Partial<PWAConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer)
    }
  }
}

// 导出单例实例
export const pwaService = PWAService.getInstance()

// 便捷的组合式API
export function usePWA() {
  const service = PWAService.getInstance()
  
  return {
    // 状态
    state: service.state,
    isInstalled: () => service.state.isInstalled,
    isInstallable: () => service.state.isInstallable,
    isOffline: () => service.state.isOffline,
    hasUpdate: () => service.state.hasUpdate,
    
    // 方法
    installPWA: service.installPWA.bind(service),
    applyUpdate: service.applyUpdate.bind(service),
    checkForUpdates: service.checkForUpdates.bind(service),
    requestNotificationPermission: service.requestNotificationPermission.bind(service),
    sendNotification: service.sendNotification.bind(service),
    registerBackgroundSync: service.registerBackgroundSync.bind(service),
    clearCache: service.clearCache.bind(service),
    updateCacheSize: service.updateCacheSize.bind(service),
    precacheResource: service.precacheResource.bind(service)
  }
}
