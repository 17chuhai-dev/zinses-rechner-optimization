/**
 * 用户体验增强Composable
 * 提供加载状态、进度跟踪、动画控制、交互反馈等用户体验功能
 */

import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

// 加载状态接口
export interface LoadingState {
  isLoading: boolean
  loadingType: 'spinner' | 'progress' | 'skeleton' | 'calculator'
  loadingText: string
  progress: number
  currentStep: number
  steps: string[]
}

// 动画配置接口
export interface AnimationConfig {
  duration: number
  easing: string
  stagger: number
  enabled: boolean
}

// 反馈配置接口
export interface FeedbackConfig {
  haptic: boolean
  sound: boolean
  visual: boolean
  notifications: boolean
}

// 用户体验配置接口
export interface UserExperienceConfig {
  animations: AnimationConfig
  feedback: FeedbackConfig
  accessibility: {
    reduceMotion: boolean
    highContrast: boolean
    screenReader: boolean
  }
  performance: {
    enableOptimizations: boolean
    lazyLoading: boolean
    prefetch: boolean
  }
}

/**
 * 用户体验增强Composable
 */
export function useUserExperience(config: Partial<UserExperienceConfig> = {}) {
  // 默认配置
  const defaultConfig: UserExperienceConfig = {
    animations: {
      duration: 300,
      easing: 'ease-out',
      stagger: 50,
      enabled: true
    },
    feedback: {
      haptic: false,
      sound: false,
      visual: true,
      notifications: true
    },
    accessibility: {
      reduceMotion: false,
      highContrast: false,
      screenReader: false
    },
    performance: {
      enableOptimizations: true,
      lazyLoading: true,
      prefetch: false
    }
  }

  const finalConfig = { ...defaultConfig, ...config }

  // 响应式状态
  const loadingState = ref<LoadingState>({
    isLoading: false,
    loadingType: 'spinner',
    loadingText: '加载中...',
    progress: 0,
    currentStep: 0,
    steps: []
  })

  const animationQueue = ref<Array<{ id: string; animation: () => Promise<void> }>>([])
  const isAnimating = ref(false)
  const notifications = ref<Array<{ id: string; type: string; message: string; duration: number }>>([])
  const userPreferences = ref({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersColorScheme: 'light'
  })

  // 性能监控
  const performanceMetrics = ref({
    renderTime: 0,
    interactionTime: 0,
    animationFrames: 0,
    memoryUsage: 0
  })

  // 计算属性
  const shouldReduceMotion = computed(() => {
    return finalConfig.accessibility.reduceMotion || userPreferences.value.prefersReducedMotion
  })

  const effectiveAnimationDuration = computed(() => {
    return shouldReduceMotion.value ? 0 : finalConfig.animations.duration
  })

  const isAccessibilityMode = computed(() => {
    return finalConfig.accessibility.screenReader || finalConfig.accessibility.highContrast
  })

  // 加载状态管理
  const startLoading = (options: Partial<LoadingState> = {}) => {
    loadingState.value = {
      ...loadingState.value,
      isLoading: true,
      ...options
    }
  }

  const updateLoadingProgress = (progress: number, step?: number) => {
    loadingState.value.progress = Math.max(0, Math.min(100, progress))
    if (step !== undefined) {
      loadingState.value.currentStep = step
    }
  }

  const updateLoadingStep = (step: number, text?: string) => {
    loadingState.value.currentStep = step
    if (text) {
      loadingState.value.loadingText = text
    }
  }

  const stopLoading = () => {
    loadingState.value.isLoading = false
    loadingState.value.progress = 0
    loadingState.value.currentStep = 0
  }

  // 动画管理
  const queueAnimation = (id: string, animation: () => Promise<void>) => {
    animationQueue.value.push({ id, animation })
    processAnimationQueue()
  }

  const processAnimationQueue = async () => {
    if (isAnimating.value || animationQueue.value.length === 0) return

    isAnimating.value = true

    while (animationQueue.value.length > 0) {
      const { animation } = animationQueue.value.shift()!
      
      try {
        await animation()
        
        // 交错延迟
        if (finalConfig.animations.stagger > 0 && animationQueue.value.length > 0) {
          await new Promise(resolve => setTimeout(resolve, finalConfig.animations.stagger))
        }
      } catch (error) {
        console.error('动画执行失败:', error)
      }
    }

    isAnimating.value = false
  }

  const clearAnimationQueue = () => {
    animationQueue.value = []
    isAnimating.value = false
  }

  // 通知管理
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string, duration = 3000) => {
    if (!finalConfig.feedback.notifications) return

    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    notifications.value.push({
      id,
      type,
      message,
      duration
    })

    // 自动移除通知
    setTimeout(() => {
      removeNotification(id)
    }, duration)

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  // 反馈功能
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!finalConfig.feedback.haptic || !('vibrate' in navigator)) return

    const patterns = {
      light: [50],
      medium: [100],
      heavy: [200]
    }

    navigator.vibrate(patterns[type])
  }

  const playSound = (type: 'click' | 'success' | 'error' | 'notification' = 'click') => {
    if (!finalConfig.feedback.sound) return

    // 简单的音频反馈实现
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const frequencies = {
        click: 800,
        success: 1000,
        error: 400,
        notification: 600
      }

      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.warn('音频反馈失败:', error)
    }
  }

  const triggerVisualFeedback = (element: HTMLElement, type: 'highlight' | 'shake' | 'pulse' = 'highlight') => {
    if (!finalConfig.feedback.visual) return

    const animations = {
      highlight: 'animate-pulse',
      shake: 'animate-bounce',
      pulse: 'animate-ping'
    }

    const className = animations[type]
    element.classList.add(className)

    setTimeout(() => {
      element.classList.remove(className)
    }, effectiveAnimationDuration.value)
  }

  // 性能监控
  const measurePerformance = <T>(name: string, fn: () => T): T => {
    if (!finalConfig.performance.enableOptimizations) return fn()

    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()

    performanceMetrics.value.renderTime = endTime - startTime
    
    // 记录性能指标
    if (typeof result === 'object' && result instanceof Promise) {
      result.then(() => {
        console.debug(`${name} 执行时间: ${endTime - startTime}ms`)
      })
    } else {
      console.debug(`${name} 执行时间: ${endTime - startTime}ms`)
    }

    return result
  }

  const measureInteractionTime = (callback: () => void) => {
    const startTime = performance.now()
    
    callback()
    
    const endTime = performance.now()
    performanceMetrics.value.interactionTime = endTime - startTime
  }

  // 用户偏好检测
  const detectUserPreferences = () => {
    if (typeof window === 'undefined') return

    // 检测动画偏好
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    userPreferences.value.prefersReducedMotion = prefersReducedMotion

    // 检测对比度偏好
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    userPreferences.value.prefersHighContrast = prefersHighContrast

    // 检测颜色主题偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    userPreferences.value.prefersColorScheme = prefersDark ? 'dark' : 'light'

    // 监听偏好变化
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      userPreferences.value.prefersReducedMotion = e.matches
    })

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      userPreferences.value.prefersHighContrast = e.matches
    })

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      userPreferences.value.prefersColorScheme = e.matches ? 'dark' : 'light'
    })
  }

  // 无障碍功能
  const announceToScreenReader = (message: string) => {
    if (!finalConfig.accessibility.screenReader) return

    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const focusElement = (element: HTMLElement, options: { preventScroll?: boolean } = {}) => {
    nextTick(() => {
      element.focus(options)
    })
  }

  // 工具函数
  const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }) as T
  }

  const throttle = <T extends (...args: any[]) => any>(fn: T, limit: number): T => {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  }

  // 生命周期
  onMounted(() => {
    detectUserPreferences()
  })

  onUnmounted(() => {
    clearAnimationQueue()
    clearNotifications()
  })

  return {
    // 状态
    loadingState,
    isAnimating,
    notifications,
    userPreferences,
    performanceMetrics,

    // 计算属性
    shouldReduceMotion,
    effectiveAnimationDuration,
    isAccessibilityMode,

    // 加载管理
    startLoading,
    updateLoadingProgress,
    updateLoadingStep,
    stopLoading,

    // 动画管理
    queueAnimation,
    clearAnimationQueue,

    // 通知管理
    showNotification,
    removeNotification,
    clearNotifications,

    // 反馈功能
    triggerHapticFeedback,
    playSound,
    triggerVisualFeedback,

    // 性能监控
    measurePerformance,
    measureInteractionTime,

    // 无障碍功能
    announceToScreenReader,
    focusElement,

    // 工具函数
    debounce,
    throttle,

    // 配置
    config: finalConfig
  }
}

// 导出类型
export type { LoadingState, AnimationConfig, FeedbackConfig, UserExperienceConfig }
