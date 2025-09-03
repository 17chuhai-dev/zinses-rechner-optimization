<!--
  通知系统组件
  提供Toast通知、横幅通知和模态通知
-->

<template>
  <Teleport to="body">
    <!-- Toast 通知容器 -->
    <div class="notification-container" :class="containerClasses">
      <TransitionGroup name="notification" tag="div" class="notifications-list">
        <div
          v-for="notification in visibleNotifications"
          :key="notification.id"
          class="notification-item"
          :class="getNotificationClasses(notification)"
          :role="notification.type === 'error' ? 'alert' : 'status'"
          :aria-live="notification.type === 'error' ? 'assertive' : 'polite'"
        >
          <!-- 图标 -->
          <div class="notification-icon">
            <svg v-if="notification.type === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            
            <svg v-else-if="notification.type === 'error'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            
            <svg v-else-if="notification.type === 'warning'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          
          <!-- 内容 -->
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div v-if="notification.message" class="notification-message">
              {{ notification.message }}
            </div>
            
            <!-- 操作按钮 -->
            <div v-if="notification.actions && notification.actions.length > 0" class="notification-actions">
              <button
                v-for="action in notification.actions"
                :key="action.label"
                type="button"
                class="notification-action-button"
                :class="action.primary ? 'primary' : 'secondary'"
                @click="handleAction(notification, action)"
              >
                {{ action.label }}
              </button>
            </div>
          </div>
          
          <!-- 关闭按钮 -->
          <button
            v-if="notification.dismissible !== false"
            type="button"
            class="notification-close"
            @click="dismissNotification(notification.id)"
            :aria-label="'Benachrichtigung schließen'"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- 进度条 -->
          <div
            v-if="notification.duration && notification.duration > 0"
            class="notification-progress"
          >
            <div 
              class="notification-progress-bar"
              :style="{ 
                animationDuration: `${notification.duration}ms`,
                animationPlayState: notification.paused ? 'paused' : 'running'
              }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useResponsive } from '@/composables/useResponsive'

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

interface Props {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxNotifications?: number
  defaultDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top-right',
  maxNotifications: 5,
  defaultDuration: 5000
})

const { isMobile } = useResponsive()

// 通知列表
const notifications = ref<Notification[]>([])
const timers = new Map<string, number>()

// 可见通知（限制数量）
const visibleNotifications = computed(() => {
  return notifications.value.slice(0, props.maxNotifications)
})

// 容器样式类
const containerClasses = computed(() => [
  'notification-container',
  `position-${props.position}`,
  {
    'is-mobile': isMobile.value
  }
])

// 获取通知样式类
const getNotificationClasses = (notification: Notification) => [
  'notification-item',
  `type-${notification.type}`,
  {
    'has-actions': notification.actions && notification.actions.length > 0,
    'is-persistent': notification.persistent
  }
]

// 添加通知
const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
  const notification: Notification = {
    ...notificationData,
    id: generateId(),
    createdAt: new Date(),
    duration: notificationData.duration ?? props.defaultDuration
  }
  
  notifications.value.unshift(notification)
  
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

// 处理操作按钮点击
const handleAction = (notification: Notification, action: NotificationAction) => {
  action.handler()
  
  // 执行操作后关闭通知（除非是持久通知）
  if (!notification.persistent) {
    dismissNotification(notification.id)
  }
}

// 生成唯一ID
const generateId = (): string => {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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

// 清理定时器
onUnmounted(() => {
  timers.forEach(timerId => clearTimeout(timerId))
  timers.clear()
})

// 暴露方法
defineExpose({
  addNotification,
  dismissNotification,
  clearAll,
  pauseNotification,
  resumeNotification,
  success,
  error,
  warning,
  info
})
</script>

<style scoped>
.notification-container {
  @apply fixed z-50 p-4 pointer-events-none;
}

.position-top-right {
  @apply top-0 right-0;
}

.position-top-left {
  @apply top-0 left-0;
}

.position-bottom-right {
  @apply bottom-0 right-0;
}

.position-bottom-left {
  @apply bottom-0 left-0;
}

.position-top-center {
  @apply top-0 left-1/2 transform -translate-x-1/2;
}

.position-bottom-center {
  @apply bottom-0 left-1/2 transform -translate-x-1/2;
}

.notifications-list {
  @apply space-y-3;
}

.notification-item {
  @apply relative flex items-start p-4 bg-white dark:bg-gray-800 
         rounded-lg shadow-lg border pointer-events-auto
         max-w-sm w-full overflow-hidden;
}

.notification-item.type-success {
  @apply border-green-200 dark:border-green-800;
}

.notification-item.type-error {
  @apply border-red-200 dark:border-red-800;
}

.notification-item.type-warning {
  @apply border-yellow-200 dark:border-yellow-800;
}

.notification-item.type-info {
  @apply border-blue-200 dark:border-blue-800;
}

.notification-icon {
  @apply flex-shrink-0 mr-3;
}

.notification-item.type-success .notification-icon {
  @apply text-green-500;
}

.notification-item.type-error .notification-icon {
  @apply text-red-500;
}

.notification-item.type-warning .notification-icon {
  @apply text-yellow-500;
}

.notification-item.type-info .notification-icon {
  @apply text-blue-500;
}

.notification-content {
  @apply flex-1 min-w-0;
}

.notification-title {
  @apply font-medium text-gray-900 dark:text-white text-sm;
}

.notification-message {
  @apply mt-1 text-sm text-gray-600 dark:text-gray-400;
}

.notification-actions {
  @apply mt-3 flex space-x-2;
}

.notification-action-button {
  @apply px-3 py-1 text-xs font-medium rounded transition-colors;
}

.notification-action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.notification-action-button.secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         hover:bg-gray-300 dark:hover:bg-gray-600;
}

.notification-close {
  @apply flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
         transition-colors;
}

.notification-progress {
  @apply absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700;
}

.notification-progress-bar {
  @apply h-full bg-current opacity-50;
  animation: progress-countdown linear forwards;
}

@keyframes progress-countdown {
  from { width: 100%; }
  to { width: 0%; }
}

/* 动画 */
.notification-enter-active {
  @apply transition-all duration-300 ease-out;
}

.notification-leave-active {
  @apply transition-all duration-200 ease-in;
}

.notification-enter-from {
  @apply opacity-0 transform translate-x-full;
}

.notification-leave-to {
  @apply opacity-0 transform translate-x-full;
}

.position-top-left .notification-enter-from,
.position-bottom-left .notification-enter-from {
  @apply transform -translate-x-full;
}

.position-top-left .notification-leave-to,
.position-bottom-left .notification-leave-to {
  @apply transform -translate-x-full;
}

.position-top-center .notification-enter-from,
.position-bottom-center .notification-enter-from {
  @apply transform -translate-y-full;
}

.position-top-center .notification-leave-to,
.position-bottom-center .notification-leave-to {
  @apply transform -translate-y-full;
}

/* 移动端优化 */
.is-mobile {
  @apply p-2;
}

.is-mobile .notification-item {
  @apply max-w-none;
}

.is-mobile .notifications-list {
  @apply space-y-2;
}
</style>
