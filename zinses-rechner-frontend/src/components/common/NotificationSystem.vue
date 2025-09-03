<!--
  全局通知系统组件
  显示应用级别的通知消息
-->

<template>
  <div class="notification-system">
    <TransitionGroup
      name="notification"
      tag="div"
      class="notifications-container"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="getNotificationClasses(notification)"
        @click="dismissNotification(notification.id)"
      >
        <div class="notification-icon">
          <component :is="getNotificationIcon(notification.type)" class="w-5 h-5" />
        </div>
        
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div v-if="notification.message" class="notification-message">
            {{ notification.message }}
          </div>
        </div>
        
        <button
          @click.stop="dismissNotification(notification.id)"
          class="notification-close"
          :aria-label="t('notification.close')"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'

// 使用服务
const { t } = useI18n()

// 通知接口
interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

// 响应式状态
const notifications = ref<Notification[]>([])

// 方法
const addNotification = (notification: Omit<Notification, 'id'>): string => {
  const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newNotification: Notification = {
    id,
    duration: 5000, // 默认5秒
    ...notification
  }
  
  notifications.value.push(newNotification)
  
  // 自动移除（除非是持久通知）
  if (!newNotification.persistent && newNotification.duration) {
    setTimeout(() => {
      dismissNotification(id)
    }, newNotification.duration)
  }
  
  return id
}

const dismissNotification = (id: string): void => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const clearAllNotifications = (): void => {
  notifications.value = []
}

const getNotificationClasses = (notification: Notification): string[] => {
  const classes = ['notification-item']
  
  switch (notification.type) {
    case 'success':
      classes.push('notification-success')
      break
    case 'error':
      classes.push('notification-error')
      break
    case 'warning':
      classes.push('notification-warning')
      break
    case 'info':
      classes.push('notification-info')
      break
  }
  
  return classes
}

const getNotificationIcon = (type: string) => {
  const iconMap = {
    'success': CheckCircleIcon,
    'error': XCircleIcon,
    'warning': ExclamationTriangleIcon,
    'info': InformationCircleIcon
  }
  
  return iconMap[type as keyof typeof iconMap] || InformationCircleIcon
}

// 全局通知事件监听
const handleGlobalNotification = (event: CustomEvent) => {
  addNotification(event.detail)
}

// 生命周期
onMounted(() => {
  // 监听全局通知事件
  window.addEventListener('show-notification', handleGlobalNotification as EventListener)
  
  // 暴露方法到全局
  window.showNotification = (notification: Omit<Notification, 'id'>) => {
    return addNotification(notification)
  }
})

onUnmounted(() => {
  window.removeEventListener('show-notification', handleGlobalNotification as EventListener)
  delete window.showNotification
})

// 暴露方法给父组件
defineExpose({
  addNotification,
  dismissNotification,
  clearAllNotifications
})
</script>

<style scoped>
.notification-system {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  pointer-events: none;
}

.notifications-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 24rem;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-left: 4px solid;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
}

.notification:hover {
  transform: translateX(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.notification-success {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.notification-error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.notification-warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.notification-info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.notification-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.notification-success .notification-icon {
  color: #10b981;
}

.notification-error .notification-icon {
  color: #ef4444;
}

.notification-warning .notification-icon {
  color: #f59e0b;
}

.notification-info .notification-icon {
  color: #3b82f6;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25rem;
  margin-bottom: 0.25rem;
}

.notification-success .notification-title {
  color: #065f46;
}

.notification-error .notification-title {
  color: #991b1b;
}

.notification-warning .notification-title {
  color: #92400e;
}

.notification-info .notification-title {
  color: #1e40af;
}

.notification-message {
  font-size: 0.75rem;
  line-height: 1rem;
  opacity: 0.8;
}

.notification-close {
  flex-shrink: 0;
  padding: 0.25rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.25rem;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.notification-close:hover {
  opacity: 1;
}

.notification-success .notification-close {
  color: #065f46;
}

.notification-error .notification-close {
  color: #991b1b;
}

.notification-warning .notification-close {
  color: #92400e;
}

.notification-info .notification-close {
  color: #1e40af;
}

/* 暗色模式 */
.dark .notification {
  background: #1f2937;
  color: #f9fafb;
}

.dark .notification-success {
  background: #064e3b;
}

.dark .notification-error {
  background: #7f1d1d;
}

.dark .notification-warning {
  background: #78350f;
}

.dark .notification-info {
  background: #1e3a8a;
}

/* 动画 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .notification-system {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
  }
  
  .notifications-container {
    max-width: none;
  }
  
  .notification {
    padding: 0.75rem;
  }
  
  .notification:hover {
    transform: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .notification {
    border: 2px solid;
  }
  
  .notification-success {
    border-color: #10b981;
  }
  
  .notification-error {
    border-color: #ef4444;
  }
  
  .notification-warning {
    border-color: #f59e0b;
  }
  
  .notification-info {
    border-color: #3b82f6;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .notification-enter-active,
  .notification-leave-active,
  .notification-move {
    transition: none;
  }
  
  .notification:hover {
    transform: none;
  }
}
</style>

<style>
/* 全局类型声明 */
declare global {
  interface Window {
    showNotification?: (notification: {
      type: 'success' | 'error' | 'warning' | 'info'
      title: string
      message?: string
      duration?: number
      persistent?: boolean
    }) => string
  }
}
</style>
