/**
 * PWA管理器
 * 统一管理PWA功能，包括Service Worker、离线缓存、推送通知、应用安装等
 */

import { ref, reactive } from 'vue'

// PWA状态接口
export interface PWAState {
  isSupported: boolean
  isInstalled: boolean
  isInstallable: boolean
  isOnline: boolean
  serviceWorkerRegistered: boolean
  updateAvailable: boolean
  notificationPermission: NotificationPermission
  installPromptEvent: BeforeInstallPromptEvent | null
}

// PWA配置接口
export interface PWAConfig {
  // Service Worker配置
  serviceWorker: {
    enabled: boolean
    scope: string
    updateInterval: number
    skipWaiting: boolean
  }
  
  // 缓存策略配置
  caching: {
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate'
    maxAge: number
    maxEntries: number
    precacheUrls: string[]
  }
  
  // 推送通知配置
  notifications: {
    enabled: boolean
    vapidKey: string
    defaultIcon: string
    defaultBadge: string
  }
  
  // 安装提示配置
  installation: {
    showPrompt: boolean
    promptDelay: number
    customPrompt: boolean
  }
  
  // 离线功能配置
  offline: {
    enabled: boolean
    fallbackPage: string
    offlineIndicator: boolean
  }
}

// 缓存策略枚举
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  NETWORK_ONLY = 'network-only',
  CACHE_ONLY = 'cache-only'
}

// 推送通知接口
export interface PushNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
}

/**
 * PWA管理器类
 */
export class PWAManager {
  private static instance: PWAManager

  // PWA状态
  public readonly state = reactive<PWAState>({
    isSupported: false,
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    serviceWorkerRegistered: false,
    updateAvailable: false,
    notificationPermission: 'default',
    installPromptEvent: null
  })

  // PWA配置
  public readonly config = reactive<PWAConfig>({
    serviceWorker: {
      enabled: true,
      scope: '/',
      updateInterval: 60000, // 1分钟
      skipWaiting: true
    },
    caching: {
      strategy: 'stale-while-revalidate',
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      maxEntries: 100,
      precacheUrls: [
        '/',
        '/manifest.webmanifest',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png'
      ]
    },
    notifications: {
      enabled: true,
      vapidKey: '',
      defaultIcon: '/icons/icon-192x192.png',
      defaultBadge: '/icons/badge-72x72.png'
    },
    installation: {
      showPrompt: true,
      promptDelay: 3000, // 3秒后显示
      customPrompt: true
    },
    offline: {
      enabled: true,
      fallbackPage: '/offline.html',
      offlineIndicator: true
    }
  })

  // Service Worker注册对象
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  
  // 事件监听器
  private eventListeners = new Map<string, Function[]>()

  private constructor() {
    this.detectPWASupport()
    this.setupEventListeners()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  /**
   * 初始化PWA功能
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🚀 初始化PWA管理器...')

      // 检测PWA支持
      this.detectPWASupport()

      // 注册Service Worker
      if (this.config.serviceWorker.enabled) {
        await this.registerServiceWorker()
      }

      // 检查安装状态
      this.checkInstallationStatus()

      // 设置网络状态监听
      this.setupNetworkListeners()

      // 设置安装提示监听
      this.setupInstallPromptListener()

      // 检查通知权限
      await this.checkNotificationPermission()

      console.log('✅ PWA管理器初始化完成')
    } catch (error) {
      console.error('❌ PWA初始化失败:', error)
      throw error
    }
  }

  /**
   * 注册Service Worker
   */
  public async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker不受支持')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: this.config.serviceWorker.scope
      })

      this.serviceWorkerRegistration = registration
      this.state.serviceWorkerRegistered = true

      // 监听Service Worker更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.state.updateAvailable = true
              this.emit('update-available', registration)
            }
          })
        }
      })

      // 定期检查更新
      setInterval(() => {
        registration.update()
      }, this.config.serviceWorker.updateInterval)

      console.log('✅ Service Worker注册成功')
    } catch (error) {
      console.error('❌ Service Worker注册失败:', error)
      throw error
    }
  }

  /**
   * 更新Service Worker
   */
  public async updateServiceWorker(): Promise<void> {
    if (!this.serviceWorkerRegistration) return

    try {
      const newWorker = this.serviceWorkerRegistration.waiting
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    } catch (error) {
      console.error('Service Worker更新失败:', error)
    }
  }

  /**
   * 显示安装提示
   */
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.state.installPromptEvent) {
      console.warn('安装提示事件不可用')
      return false
    }

    try {
      const result = await this.state.installPromptEvent.prompt()
      const accepted = result.outcome === 'accepted'
      
      if (accepted) {
        this.state.isInstalled = true
        this.emit('app-installed')
      }

      // 清除事件引用
      this.state.installPromptEvent = null
      this.state.isInstallable = false

      return accepted
    } catch (error) {
      console.error('安装提示显示失败:', error)
      return false
    }
  }

  /**
   * 请求通知权限
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('通知API不受支持')
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      this.state.notificationPermission = permission
      return permission
    } catch (error) {
      console.error('通知权限请求失败:', error)
      return 'denied'
    }
  }

  /**
   * 发送推送通知
   */
  public async sendNotification(options: PushNotificationOptions): Promise<void> {
    if (this.state.notificationPermission !== 'granted') {
      console.warn('通知权限未授予')
      return
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || this.config.notifications.defaultIcon,
        badge: options.badge || this.config.notifications.defaultBadge,
        tag: options.tag,
        data: options.data,
        actions: options.actions,
        requireInteraction: options.requireInteraction,
        silent: options.silent
      })

      // 设置点击事件
      notification.onclick = (event) => {
        event.preventDefault()
        window.focus()
        notification.close()
        
        if (options.data?.url) {
          window.open(options.data.url, '_blank')
        }
      }

      this.emit('notification-sent', notification)
    } catch (error) {
      console.error('通知发送失败:', error)
    }
  }

  /**
   * 缓存资源
   */
  public async cacheResource(url: string, strategy: CacheStrategy = CacheStrategy.STALE_WHILE_REVALIDATE): Promise<void> {
    if (!this.serviceWorkerRegistration) return

    try {
      // 通过Service Worker缓存资源
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'CACHE_RESOURCE',
        url,
        strategy
      })
    } catch (error) {
      console.error('资源缓存失败:', error)
    }
  }

  /**
   * 清除缓存
   */
  public async clearCache(): Promise<void> {
    if (!this.serviceWorkerRegistration) return

    try {
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'CLEAR_CACHE'
      })
      
      this.emit('cache-cleared')
    } catch (error) {
      console.error('缓存清除失败:', error)
    }
  }

  /**
   * 获取缓存大小
   */
  public async getCacheSize(): Promise<number> {
    if (!('storage' in navigator)) return 0

    try {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    } catch (error) {
      console.error('获取缓存大小失败:', error)
      return 0
    }
  }

  /**
   * 检查离线状态
   */
  public isOffline(): boolean {
    return !this.state.isOnline
  }

  /**
   * 添加事件监听器
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 私有方法

  /**
   * 检测PWA支持
   */
  private detectPWASupport(): void {
    this.state.isSupported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      'fetch' in window &&
      'caches' in window
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听应用安装事件
    window.addEventListener('appinstalled', () => {
      this.state.isInstalled = true
      this.state.isInstallable = false
      this.emit('app-installed')
    })
  }

  /**
   * 检查安装状态
   */
  private checkInstallationStatus(): void {
    // 检查是否在独立模式下运行（已安装）
    this.state.isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.state.isOnline = true
      this.emit('network-online')
    })

    window.addEventListener('offline', () => {
      this.state.isOnline = false
      this.emit('network-offline')
    })
  }

  /**
   * 设置安装提示监听
   */
  private setupInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      this.state.installPromptEvent = event as BeforeInstallPromptEvent
      this.state.isInstallable = true
      
      // 延迟显示安装提示
      if (this.config.installation.showPrompt) {
        setTimeout(() => {
          this.emit('install-prompt-ready', event)
        }, this.config.installation.promptDelay)
      }
    })
  }

  /**
   * 检查通知权限
   */
  private async checkNotificationPermission(): Promise<void> {
    if ('Notification' in window) {
      this.state.notificationPermission = Notification.permission
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }
}

// 导出单例实例
export const pwaManager = PWAManager.getInstance()

// 导出便捷的composable
export function usePWA() {
  const manager = PWAManager.getInstance()
  
  return {
    // 状态
    state: manager.state,
    config: manager.config,
    
    // 方法
    initialize: manager.initialize.bind(manager),
    registerServiceWorker: manager.registerServiceWorker.bind(manager),
    updateServiceWorker: manager.updateServiceWorker.bind(manager),
    showInstallPrompt: manager.showInstallPrompt.bind(manager),
    requestNotificationPermission: manager.requestNotificationPermission.bind(manager),
    sendNotification: manager.sendNotification.bind(manager),
    cacheResource: manager.cacheResource.bind(manager),
    clearCache: manager.clearCache.bind(manager),
    getCacheSize: manager.getCacheSize.bind(manager),
    isOffline: manager.isOffline.bind(manager),
    on: manager.on.bind(manager),
    off: manager.off.bind(manager)
  }
}
