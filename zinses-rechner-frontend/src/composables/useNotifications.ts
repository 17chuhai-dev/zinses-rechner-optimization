/**
 * 通知系统组合函数
 * 提供全局通知管理功能
 */

import { ref, reactive } from 'vue'

interface NotificationAction {
  label: string
  handler: () => void
  primary?: boolean
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
  persistent?: boolean
  actions?: NotificationAction[]
  paused?: boolean
  createdAt: Date
}

// 全局通知状态
const notifications = ref<Notification[]>([])
const timers = new Map<string, number>()

// 默认配置
const defaultConfig = reactive({
  position: 'top-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center',
  maxNotifications: 5,
  defaultDuration: 5000
})

export function useNotifications() {
  // 生成唯一ID
  const generateId = (): string => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 添加通知
  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const notification: Notification = {
      ...notificationData,
      id: generateId(),
      createdAt: new Date(),
      duration: notificationData.duration ?? defaultConfig.defaultDuration
    }
    
    notifications.value.unshift(notification)
    
    // 限制通知数量
    if (notifications.value.length > defaultConfig.maxNotifications) {
      const removed = notifications.value.splice(defaultConfig.maxNotifications)
      removed.forEach(n => {
        const timerId = timers.get(n.id)
        if (timerId) {
          clearTimeout(timerId)
          timers.delete(n.id)
        }
      })
    }
    
    // 设置自动关闭定时器
    if (notification.duration && notification.duration > 0 && !notification.persistent) {
      const timerId = window.setTimeout(() => {
        dismissNotification(notification.id)
      }, notification.duration)
      
      timers.set(notification.id, timerId)
    }
    
    return notification.id
  }

  // 关闭通知
  const dismissNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
    
    // 清除定时器
    const timerId = timers.get(id)
    if (timerId) {
      clearTimeout(timerId)
      timers.delete(id)
    }
  }

  // 清除所有通知
  const clearAll = () => {
    notifications.value = []
    timers.forEach(timerId => clearTimeout(timerId))
    timers.clear()
  }

  // 暂停/恢复通知
  const pauseNotification = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.paused = true
      
      const timerId = timers.get(id)
      if (timerId) {
        clearTimeout(timerId)
        timers.delete(id)
      }
    }
  }

  const resumeNotification = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification && notification.duration) {
      notification.paused = false
      
      const remainingTime = notification.duration - (Date.now() - notification.createdAt.getTime())
      if (remainingTime > 0) {
        const timerId = window.setTimeout(() => {
          dismissNotification(id)
        }, remainingTime)
        
        timers.set(id, timerId)
      }
    }
  }

  // 便捷方法
  const success = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  const error = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // 错误通知默认持久显示
      ...options
    })
  }

  const warning = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  const info = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  // 计算器特定的通知方法
  const calculationSuccess = (finalAmount: number, totalInterest: number) => {
    return success(
      'Berechnung erfolgreich',
      `Endkapital: €${finalAmount.toLocaleString('de-DE')} (Zinserträge: €${totalInterest.toLocaleString('de-DE')})`,
      {
        duration: 8000,
        actions: [
          {
            label: 'Details anzeigen',
            handler: () => {
              // 滚动到结果区域
              const resultsElement = document.querySelector('[data-results]')
              if (resultsElement) {
                resultsElement.scrollIntoView({ behavior: 'smooth' })
              }
            },
            primary: true
          }
        ]
      }
    )
  }

  const calculationError = (errorMessage: string, suggestions?: string[]) => {
    return error(
      'Berechnungsfehler',
      errorMessage,
      {
        actions: suggestions ? [
          {
            label: 'Hilfe anzeigen',
            handler: () => {
              // 显示帮助信息
              console.log('显示帮助:', suggestions)
            }
          }
        ] : undefined
      }
    )
  }

  const validationError = (fieldName: string, errorMessage: string) => {
    return warning(
      `Eingabefehler: ${fieldName}`,
      errorMessage,
      {
        duration: 6000,
        actions: [
          {
            label: 'Feld fokussieren',
            handler: () => {
              // 聚焦到错误字段
              const fieldElement = document.querySelector(`[name="${fieldName}"]`) as HTMLElement
              if (fieldElement) {
                fieldElement.focus()
              }
            },
            primary: true
          }
        ]
      }
    )
  }

  const networkError = () => {
    return error(
      'Verbindungsfehler',
      'Die Verbindung zum Server konnte nicht hergestellt werden.',
      {
        actions: [
          {
            label: 'Erneut versuchen',
            handler: () => {
              // 重新尝试连接
              window.location.reload()
            },
            primary: true
          },
          {
            label: 'Offline weiterarbeiten',
            handler: () => {
              // 切换到离线模式
              console.log('切换到离线模式')
            }
          }
        ]
      }
    )
  }

  // 配置方法
  const setConfig = (config: Partial<typeof defaultConfig>) => {
    Object.assign(defaultConfig, config)
  }

  const getConfig = () => {
    return { ...defaultConfig }
  }

  return {
    // 状态
    notifications,
    
    // 基础方法
    addNotification,
    dismissNotification,
    clearAll,
    pauseNotification,
    resumeNotification,
    
    // 便捷方法
    success,
    error,
    warning,
    info,
    
    // 计算器特定方法
    calculationSuccess,
    calculationError,
    validationError,
    networkError,
    
    // 配置方法
    setConfig,
    getConfig
  }
}

// 全局实例（单例模式）
let globalNotifications: ReturnType<typeof useNotifications> | null = null

export function useGlobalNotifications() {
  if (!globalNotifications) {
    globalNotifications = useNotifications()
  }
  return globalNotifications
}
