/**
 * 手势管理器
 * 实现移动端手势识别和处理，包括滑动、缩放、长按、双击等交互
 */

import { ref, reactive } from 'vue'

// 手势类型枚举
export type GestureType = 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'pan' | 'rotate'

// 手势方向枚举
export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

// 触摸点接口
export interface TouchPoint {
  id: number
  x: number
  y: number
  timestamp: number
}

// 手势事件接口
export interface GestureEvent {
  type: GestureType
  target: HTMLElement
  touches: TouchPoint[]
  deltaX: number
  deltaY: number
  distance: number
  scale: number
  rotation: number
  velocity: number
  direction?: SwipeDirection
  duration: number
  center: { x: number; y: number }
  preventDefault: () => void
  stopPropagation: () => void
}

// 手势配置接口
export interface GestureConfig {
  // 点击配置
  tapTimeout: number
  doubleTapTimeout: number
  longPressTimeout: number
  tapThreshold: number
  
  // 滑动配置
  swipeThreshold: number
  swipeVelocityThreshold: number
  
  // 缩放配置
  pinchThreshold: number
  maxScale: number
  minScale: number
  
  // 拖拽配置
  panThreshold: number
  
  // 旋转配置
  rotationThreshold: number
  
  // 通用配置
  preventDefaultEvents: boolean
  enablePassiveListeners: boolean
}

// 手势监听器接口
export interface GestureListener {
  element: HTMLElement
  gestures: GestureType[]
  handler: (event: GestureEvent) => void
  config?: Partial<GestureConfig>
}

/**
 * 手势管理器类
 */
export class GestureManager {
  private static instance: GestureManager

  // 默认配置
  private defaultConfig: GestureConfig = {
    tapTimeout: 300,
    doubleTapTimeout: 300,
    longPressTimeout: 500,
    tapThreshold: 10,
    swipeThreshold: 50,
    swipeVelocityThreshold: 0.3,
    pinchThreshold: 10,
    maxScale: 5,
    minScale: 0.5,
    panThreshold: 10,
    rotationThreshold: 15,
    preventDefaultEvents: true,
    enablePassiveListeners: false
  }

  // 活跃的手势监听器
  private listeners = new Map<HTMLElement, GestureListener[]>()

  // 当前触摸状态
  private touchState = reactive({
    touches: new Map<number, TouchPoint>(),
    startTouches: new Map<number, TouchPoint>(),
    isActive: false,
    startTime: 0,
    lastTapTime: 0,
    tapCount: 0,
    longPressTimer: null as number | null,
    initialDistance: 0,
    initialAngle: 0,
    initialScale: 1,
    currentScale: 1
  })

  // 统计信息
  public readonly stats = reactive({
    totalGestures: 0,
    gesturesByType: {} as Record<GestureType, number>,
    averageGestureDuration: 0,
    lastGestureTime: null as Date | null
  })

  // 状态
  public readonly isEnabled = ref(true)
  public readonly isSupported = ref(false)

  public static getInstance(): GestureManager {
    if (!GestureManager.instance) {
      GestureManager.instance = new GestureManager()
    }
    return GestureManager.instance
  }

  constructor() {
    this.initializeGestureManager()
  }

  /**
   * 初始化手势管理器
   */
  private initializeGestureManager(): void {
    // 检查触摸支持
    this.isSupported.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    if (this.isSupported.value) {
      this.setupGlobalListeners()
      console.log('👆 Gesture manager initialized with touch support')
    } else {
      console.log('👆 Gesture manager initialized without touch support')
    }
  }

  /**
   * 添加手势监听器
   */
  public addGestureListener(
    element: HTMLElement,
    gestures: GestureType[],
    handler: (event: GestureEvent) => void,
    config?: Partial<GestureConfig>
  ): () => void {
    const listener: GestureListener = {
      element,
      gestures,
      handler,
      config: { ...this.defaultConfig, ...config }
    }

    if (!this.listeners.has(element)) {
      this.listeners.set(element, [])
    }

    this.listeners.get(element)!.push(listener)

    // 设置元素的触摸事件监听器
    this.setupElementListeners(element)

    // 返回移除监听器的函数
    return () => this.removeGestureListener(element, handler)
  }

  /**
   * 移除手势监听器
   */
  public removeGestureListener(element: HTMLElement, handler?: (event: GestureEvent) => void): void {
    const elementListeners = this.listeners.get(element)
    if (!elementListeners) return

    if (handler) {
      const index = elementListeners.findIndex(l => l.handler === handler)
      if (index > -1) {
        elementListeners.splice(index, 1)
      }
    } else {
      elementListeners.length = 0
    }

    if (elementListeners.length === 0) {
      this.listeners.delete(element)
      this.removeElementListeners(element)
    }
  }

  /**
   * 清除所有手势监听器
   */
  public clearAllListeners(): void {
    for (const element of this.listeners.keys()) {
      this.removeElementListeners(element)
    }
    this.listeners.clear()
  }

  /**
   * 启用/禁用手势识别
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled.value = enabled
  }

  /**
   * 获取手势统计
   */
  public getStats(): typeof this.stats {
    return { ...this.stats }
  }

  // 私有方法

  /**
   * 设置全局监听器
   */
  private setupGlobalListeners(): void {
    // 防止默认的触摸行为
    document.addEventListener('touchstart', this.preventDefaultTouch, { passive: false })
    document.addEventListener('touchmove', this.preventDefaultTouch, { passive: false })
  }

  /**
   * 设置元素监听器
   */
  private setupElementListeners(element: HTMLElement): void {
    if (element.dataset.gestureListenerAdded) return

    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false })

    element.dataset.gestureListenerAdded = 'true'
  }

  /**
   * 移除元素监听器
   */
  private removeElementListeners(element: HTMLElement): void {
    element.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    element.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    element.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this))

    delete element.dataset.gestureListenerAdded
  }

  /**
   * 防止默认触摸行为
   */
  private preventDefaultTouch = (event: TouchEvent): void => {
    if (!this.isEnabled.value) return

    const target = event.target as HTMLElement
    const listeners = this.getElementListeners(target)

    if (listeners.length > 0) {
      const config = listeners[0].config || this.defaultConfig
      if (config.preventDefaultEvents) {
        event.preventDefault()
      }
    }
  }

  /**
   * 处理触摸开始
   */
  private handleTouchStart = (event: TouchEvent): void => {
    if (!this.isEnabled.value) return

    const now = Date.now()
    this.touchState.startTime = now
    this.touchState.isActive = true

    // 记录触摸点
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i]
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        timestamp: now
      }

      this.touchState.touches.set(touch.identifier, touchPoint)
      this.touchState.startTouches.set(touch.identifier, { ...touchPoint })
    }

    // 设置长按定时器
    this.setupLongPressTimer(event)

    // 计算初始距离和角度（用于缩放和旋转）
    if (event.touches.length === 2) {
      this.touchState.initialDistance = this.calculateDistance(event.touches[0], event.touches[1])
      this.touchState.initialAngle = this.calculateAngle(event.touches[0], event.touches[1])
    }
  }

  /**
   * 处理触摸移动
   */
  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.isEnabled.value || !this.touchState.isActive) return

    const now = Date.now()

    // 更新触摸点
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i]
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        timestamp: now
      }

      this.touchState.touches.set(touch.identifier, touchPoint)
    }

    // 清除长按定时器（因为手指移动了）
    this.clearLongPressTimer()

    // 检测手势
    this.detectGestures(event)
  }

  /**
   * 处理触摸结束
   */
  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.isEnabled.value || !this.touchState.isActive) return

    const now = Date.now()
    const duration = now - this.touchState.startTime

    // 移除结束的触摸点
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      this.touchState.touches.delete(touch.identifier)
    }

    // 如果没有剩余触摸点，处理手势结束
    if (this.touchState.touches.size === 0) {
      this.handleGestureEnd(event, duration)
      this.resetTouchState()
    }

    this.clearLongPressTimer()
  }

  /**
   * 处理触摸取消
   */
  private handleTouchCancel = (event: TouchEvent): void => {
    this.resetTouchState()
    this.clearLongPressTimer()
  }

  /**
   * 设置长按定时器
   */
  private setupLongPressTimer(event: TouchEvent): void {
    const listeners = this.getElementListeners(event.target as HTMLElement)
    const hasLongPress = listeners.some(l => l.gestures.includes('long-press'))

    if (hasLongPress && event.touches.length === 1) {
      const config = listeners[0].config || this.defaultConfig
      
      this.touchState.longPressTimer = window.setTimeout(() => {
        this.triggerGesture('long-press', event, {
          duration: config.longPressTimeout
        })
      }, config.longPressTimeout)
    }
  }

  /**
   * 清除长按定时器
   */
  private clearLongPressTimer(): void {
    if (this.touchState.longPressTimer) {
      clearTimeout(this.touchState.longPressTimer)
      this.touchState.longPressTimer = null
    }
  }

  /**
   * 检测手势
   */
  private detectGestures(event: TouchEvent): void {
    const listeners = this.getElementListeners(event.target as HTMLElement)
    if (listeners.length === 0) return

    // 检测拖拽
    if (event.touches.length === 1) {
      this.detectPan(event, listeners)
    }

    // 检测缩放和旋转
    if (event.touches.length === 2) {
      this.detectPinchAndRotate(event, listeners)
    }
  }

  /**
   * 检测拖拽手势
   */
  private detectPan(event: TouchEvent, listeners: GestureListener[]): void {
    const hasPan = listeners.some(l => l.gestures.includes('pan'))
    if (!hasPan) return

    const touch = event.touches[0]
    const startTouch = this.touchState.startTouches.get(touch.identifier)
    if (!startTouch) return

    const deltaX = touch.clientX - startTouch.x
    const deltaY = touch.clientY - startTouch.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    const config = listeners[0].config || this.defaultConfig
    if (distance > config.panThreshold) {
      this.triggerGesture('pan', event, { deltaX, deltaY, distance })
    }
  }

  /**
   * 检测缩放和旋转手势
   */
  private detectPinchAndRotate(event: TouchEvent, listeners: GestureListener[]): void {
    const hasPinch = listeners.some(l => l.gestures.includes('pinch'))
    const hasRotate = listeners.some(l => l.gestures.includes('rotate'))

    if (!hasPinch && !hasRotate) return

    const touch1 = event.touches[0]
    const touch2 = event.touches[1]

    const currentDistance = this.calculateDistance(touch1, touch2)
    const currentAngle = this.calculateAngle(touch1, touch2)

    const config = listeners[0].config || this.defaultConfig

    // 检测缩放
    if (hasPinch) {
      const scale = currentDistance / this.touchState.initialDistance
      const scaleDelta = Math.abs(scale - 1)

      if (scaleDelta > config.pinchThreshold / 100) {
        this.touchState.currentScale = Math.max(
          config.minScale,
          Math.min(config.maxScale, scale)
        )

        this.triggerGesture('pinch', event, {
          scale: this.touchState.currentScale,
          distance: currentDistance
        })
      }
    }

    // 检测旋转
    if (hasRotate) {
      const rotation = currentAngle - this.touchState.initialAngle
      const rotationDelta = Math.abs(rotation)

      if (rotationDelta > config.rotationThreshold) {
        this.triggerGesture('rotate', event, { rotation })
      }
    }
  }

  /**
   * 处理手势结束
   */
  private handleGestureEnd(event: TouchEvent, duration: number): void {
    const listeners = this.getElementListeners(event.target as HTMLElement)
    if (listeners.length === 0) return

    const changedTouch = event.changedTouches[0]
    const startTouch = this.touchState.startTouches.get(changedTouch.identifier)
    if (!startTouch) return

    const deltaX = changedTouch.clientX - startTouch.x
    const deltaY = changedTouch.clientY - startTouch.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = distance / duration

    const config = listeners[0].config || this.defaultConfig

    // 检测滑动
    if (distance > config.swipeThreshold && velocity > config.swipeVelocityThreshold) {
      const direction = this.getSwipeDirection(deltaX, deltaY)
      this.triggerGesture('swipe', event, { deltaX, deltaY, distance, velocity, direction })
      return
    }

    // 检测点击
    if (distance < config.tapThreshold) {
      const now = Date.now()
      
      // 检测双击
      if (now - this.touchState.lastTapTime < config.doubleTapTimeout) {
        this.touchState.tapCount++
        if (this.touchState.tapCount === 2) {
          this.triggerGesture('double-tap', event, { duration })
          this.touchState.tapCount = 0
          return
        }
      } else {
        this.touchState.tapCount = 1
      }

      this.touchState.lastTapTime = now

      // 延迟触发单击（等待可能的双击）
      setTimeout(() => {
        if (this.touchState.tapCount === 1) {
          this.triggerGesture('tap', event, { duration })
          this.touchState.tapCount = 0
        }
      }, config.doubleTapTimeout)
    }
  }

  /**
   * 触发手势事件
   */
  private triggerGesture(
    type: GestureType,
    event: TouchEvent,
    extraData: Partial<GestureEvent> = {}
  ): void {
    const listeners = this.getElementListeners(event.target as HTMLElement)
    const relevantListeners = listeners.filter(l => l.gestures.includes(type))

    if (relevantListeners.length === 0) return

    const touches = Array.from(this.touchState.touches.values())
    const center = this.calculateCenter(touches)

    const gestureEvent: GestureEvent = {
      type,
      target: event.target as HTMLElement,
      touches,
      deltaX: 0,
      deltaY: 0,
      distance: 0,
      scale: this.touchState.currentScale,
      rotation: 0,
      velocity: 0,
      duration: Date.now() - this.touchState.startTime,
      center,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      ...extraData
    }

    // 触发监听器
    relevantListeners.forEach(listener => {
      try {
        listener.handler(gestureEvent)
      } catch (error) {
        console.error('Gesture handler error:', error)
      }
    })

    // 更新统计
    this.updateStats(type, gestureEvent.duration)
  }

  /**
   * 获取元素的手势监听器
   */
  private getElementListeners(element: HTMLElement): GestureListener[] {
    const listeners: GestureListener[] = []
    let currentElement: HTMLElement | null = element

    // 向上遍历DOM树查找监听器
    while (currentElement) {
      const elementListeners = this.listeners.get(currentElement)
      if (elementListeners) {
        listeners.push(...elementListeners)
      }
      currentElement = currentElement.parentElement
    }

    return listeners
  }

  /**
   * 计算两点间距离
   */
  private calculateDistance(touch1: Touch, touch2: Touch): number {
    const deltaX = touch2.clientX - touch1.clientX
    const deltaY = touch2.clientY - touch1.clientY
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  /**
   * 计算两点间角度
   */
  private calculateAngle(touch1: Touch, touch2: Touch): number {
    const deltaX = touch2.clientX - touch1.clientX
    const deltaY = touch2.clientY - touch1.clientY
    return Math.atan2(deltaY, deltaX) * 180 / Math.PI
  }

  /**
   * 计算触摸点中心
   */
  private calculateCenter(touches: TouchPoint[]): { x: number; y: number } {
    if (touches.length === 0) return { x: 0, y: 0 }

    const sum = touches.reduce(
      (acc, touch) => ({ x: acc.x + touch.x, y: acc.y + touch.y }),
      { x: 0, y: 0 }
    )

    return {
      x: sum.x / touches.length,
      y: sum.y / touches.length
    }
  }

  /**
   * 获取滑动方向
   */
  private getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }

  /**
   * 重置触摸状态
   */
  private resetTouchState(): void {
    this.touchState.touches.clear()
    this.touchState.startTouches.clear()
    this.touchState.isActive = false
    this.touchState.startTime = 0
    this.touchState.initialDistance = 0
    this.touchState.initialAngle = 0
    this.touchState.currentScale = 1
  }

  /**
   * 更新统计信息
   */
  private updateStats(type: GestureType, duration: number): void {
    this.stats.totalGestures++
    this.stats.gesturesByType[type] = (this.stats.gesturesByType[type] || 0) + 1
    this.stats.lastGestureTime = new Date()

    // 更新平均手势持续时间
    const totalDuration = this.stats.averageGestureDuration * (this.stats.totalGestures - 1) + duration
    this.stats.averageGestureDuration = totalDuration / this.stats.totalGestures
  }
}

// 导出单例实例
export const gestureManager = GestureManager.getInstance()

// 便捷的组合式API
export function useGestures() {
  const manager = GestureManager.getInstance()
  
  return {
    // 状态
    isEnabled: manager.isEnabled,
    isSupported: manager.isSupported,
    stats: manager.stats,
    
    // 方法
    addGestureListener: manager.addGestureListener.bind(manager),
    removeGestureListener: manager.removeGestureListener.bind(manager),
    clearAllListeners: manager.clearAllListeners.bind(manager),
    setEnabled: manager.setEnabled.bind(manager),
    getStats: manager.getStats.bind(manager)
  }
}
