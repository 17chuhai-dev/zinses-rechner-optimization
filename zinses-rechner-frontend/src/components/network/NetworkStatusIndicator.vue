<!--
  网络状态指示器组件
  显示网络连接状态、质量和相关信息
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel" role="status">
    <!-- 网络状态图标 -->
    <div class="network-icon" :title="statusTooltip">
      <!-- 在线状态 -->
      <WifiIcon 
        v-if="networkState.isOnline && networkState.quality !== 'poor'"
        :class="iconClasses"
      />
      
      <!-- 信号弱 -->
      <SignalIcon 
        v-else-if="networkState.isOnline && networkState.quality === 'poor'"
        :class="[iconClasses, 'text-yellow-500']"
      />
      
      <!-- 离线状态 -->
      <NoSymbolIcon 
        v-else
        :class="[iconClasses, 'text-red-500']"
      />
      
      <!-- 连接质量指示器 -->
      <div v-if="showQualityBars && networkState.isOnline" class="quality-bars">
        <div
          v-for="bar in 4"
          :key="bar"
          :class="getQualityBarClass(bar)"
        ></div>
      </div>
    </div>

    <!-- 网络状态文本 -->
    <div v-if="showText" class="network-text">
      <span :class="textClasses">
        {{ statusText }}
      </span>
      
      <!-- 连接类型 -->
      <span v-if="showConnectionType && networkState.connectionType !== 'unknown'" class="connection-type">
        ({{ connectionTypeText }})
      </span>
    </div>

    <!-- 详细信息（展开时显示） -->
    <div v-if="showDetails && expanded" class="network-details">
      <div class="detail-row">
        <span class="detail-label">Qualität:</span>
        <span :class="qualityTextClass">{{ qualityText }}</span>
      </div>
      
      <div v-if="networkState.rtt > 0" class="detail-row">
        <span class="detail-label">Latenz:</span>
        <span class="detail-value">{{ networkState.rtt }}ms</span>
      </div>
      
      <div v-if="networkState.downlink > 0" class="detail-row">
        <span class="detail-label">Geschwindigkeit:</span>
        <span class="detail-value">{{ networkState.downlink }}Mbps</span>
      </div>
      
      <div v-if="networkState.outageCount > 0" class="detail-row">
        <span class="detail-label">Ausfälle:</span>
        <span class="detail-value">{{ networkState.outageCount }}</span>
      </div>
    </div>

    <!-- 离线提示横幅 -->
    <Transition name="slide-down">
      <div v-if="showOfflineBanner && !networkState.isOnline" class="offline-banner">
        <div class="offline-content">
          <ExclamationTriangleIcon class="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div class="offline-message">
            <p class="font-medium">Sie sind offline</p>
            <p class="text-sm">Grundlegende Funktionen sind weiterhin verfügbar</p>
          </div>
          <button
            @click="retryConnection"
            class="retry-button"
            :disabled="isRetrying"
          >
            <ArrowPathIcon :class="['w-4 h-4', { 'animate-spin': isRetrying }]" />
            {{ isRetrying ? 'Prüfen...' : 'Erneut versuchen' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 网络质量警告 -->
    <Transition name="fade">
      <div v-if="showQualityWarning && networkState.quality === 'poor'" class="quality-warning">
        <SignalSlashIcon class="w-4 h-4 text-orange-500" />
        <span class="text-sm text-orange-700 dark:text-orange-300">
          Langsame Verbindung erkannt
        </span>
      </div>
    </Transition>

    <!-- 屏幕阅读器文本 -->
    <span class="sr-only">
      {{ screenReaderText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  WifiIcon,
  SignalIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SignalSlashIcon
} from '@heroicons/vue/24/outline'
import { useNetworkStatus } from '@/services/NetworkStatusService'
import type { NetworkEvent } from '@/services/NetworkStatusService'

// Props
interface Props {
  // 显示选项
  showText?: boolean
  showDetails?: boolean
  showQualityBars?: boolean
  showConnectionType?: boolean
  showOfflineBanner?: boolean
  showQualityWarning?: boolean
  
  // 样式选项
  size?: 'sm' | 'md' | 'lg'
  variant?: 'minimal' | 'detailed' | 'banner'
  position?: 'top' | 'bottom' | 'inline'
  
  // 行为选项
  expandable?: boolean
  autoHide?: boolean
  hideDelay?: number
  
  // 自定义样式
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  showDetails: false,
  showQualityBars: false,
  showConnectionType: false,
  showOfflineBanner: true,
  showQualityWarning: true,
  size: 'md',
  variant: 'minimal',
  position: 'inline',
  expandable: false,
  autoHide: false,
  hideDelay: 5000
})

// 使用网络状态服务
const { 
  state: networkState, 
  addEventListener, 
  removeEventListener 
} = useNetworkStatus()

// 响应式状态
const expanded = ref(false)
const isRetrying = ref(false)
const isVisible = ref(true)

// 计算属性
const containerClasses = computed(() => {
  const classes = ['network-status-indicator']
  
  // 变体样式
  switch (props.variant) {
    case 'minimal':
      classes.push('flex', 'items-center', 'space-x-2')
      break
    case 'detailed':
      classes.push('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'p-3', 'shadow-sm', 'border', 'border-gray-200', 'dark:border-gray-700')
      break
    case 'banner':
      classes.push('w-full', 'bg-gray-50', 'dark:bg-gray-900', 'border-b', 'border-gray-200', 'dark:border-gray-700')
      break
  }
  
  // 位置样式
  if (props.position === 'top') {
    classes.push('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
  } else if (props.position === 'bottom') {
    classes.push('fixed', 'bottom-0', 'left-0', 'right-0', 'z-50')
  }
  
  // 自定义类
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  // 可见性
  if (!isVisible.value && props.autoHide) {
    classes.push('opacity-0', 'pointer-events-none')
  }
  
  return classes
})

const iconClasses = computed(() => {
  const classes = []
  
  // 大小
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  classes.push(sizeMap[props.size])
  
  // 状态颜色
  if (networkState.isOnline) {
    switch (networkState.quality) {
      case 'excellent':
        classes.push('text-green-500')
        break
      case 'good':
        classes.push('text-blue-500')
        break
      case 'fair':
        classes.push('text-yellow-500')
        break
      case 'poor':
        classes.push('text-orange-500')
        break
    }
  } else {
    classes.push('text-red-500')
  }
  
  return classes
})

const textClasses = computed(() => {
  const classes = ['text-sm', 'font-medium']
  
  // 状态颜色
  if (networkState.isOnline) {
    classes.push('text-gray-700', 'dark:text-gray-300')
  } else {
    classes.push('text-red-600', 'dark:text-red-400')
  }
  
  return classes
})

const qualityTextClass = computed(() => {
  const classes = ['detail-value']
  
  switch (networkState.quality) {
    case 'excellent':
      classes.push('text-green-600', 'dark:text-green-400')
      break
    case 'good':
      classes.push('text-blue-600', 'dark:text-blue-400')
      break
    case 'fair':
      classes.push('text-yellow-600', 'dark:text-yellow-400')
      break
    case 'poor':
      classes.push('text-orange-600', 'dark:text-orange-400')
      break
    case 'offline':
      classes.push('text-red-600', 'dark:text-red-400')
      break
  }
  
  return classes
})

const statusText = computed(() => {
  if (!networkState.isOnline) {
    return 'Offline'
  }
  
  switch (networkState.status) {
    case 'online':
      return 'Online'
    case 'slow':
      return 'Langsam'
    case 'unstable':
      return 'Instabil'
    default:
      return 'Unbekannt'
  }
})

const connectionTypeText = computed(() => {
  const typeMap = {
    wifi: 'WLAN',
    cellular: 'Mobil',
    ethernet: 'Ethernet',
    bluetooth: 'Bluetooth',
    unknown: 'Unbekannt'
  }
  return typeMap[networkState.connectionType] || 'Unbekannt'
})

const qualityText = computed(() => {
  const qualityMap = {
    excellent: 'Ausgezeichnet',
    good: 'Gut',
    fair: 'Mäßig',
    poor: 'Schlecht',
    offline: 'Offline'
  }
  return qualityMap[networkState.quality] || 'Unbekannt'
})

const statusTooltip = computed(() => {
  if (!networkState.isOnline) {
    return 'Keine Internetverbindung'
  }
  
  let tooltip = `Verbindung: ${statusText.value}`
  if (networkState.quality !== 'offline') {
    tooltip += ` (${qualityText.value})`
  }
  
  if (networkState.rtt > 0) {
    tooltip += ` - ${networkState.rtt}ms`
  }
  
  return tooltip
})

const ariaLabel = computed(() => {
  return `Netzwerkstatus: ${statusText.value}`
})

const screenReaderText = computed(() => {
  let text = `Netzwerkstatus: ${statusText.value}`
  
  if (networkState.isOnline && networkState.quality !== 'offline') {
    text += `, Qualität: ${qualityText.value}`
  }
  
  if (networkState.connectionType !== 'unknown') {
    text += `, Verbindungstyp: ${connectionTypeText.value}`
  }
  
  return text
})

// 方法
const getQualityBarClass = (barIndex: number): string[] => {
  const classes = ['quality-bar']
  
  // 根据网络质量确定激活的条数
  let activeBars = 0
  switch (networkState.quality) {
    case 'excellent':
      activeBars = 4
      break
    case 'good':
      activeBars = 3
      break
    case 'fair':
      activeBars = 2
      break
    case 'poor':
      activeBars = 1
      break
  }
  
  if (barIndex <= activeBars) {
    classes.push('active')
    
    // 颜色
    if (activeBars >= 3) {
      classes.push('bg-green-500')
    } else if (activeBars >= 2) {
      classes.push('bg-yellow-500')
    } else {
      classes.push('bg-red-500')
    }
  } else {
    classes.push('bg-gray-300', 'dark:bg-gray-600')
  }
  
  return classes
}

const toggleExpanded = (): void => {
  if (props.expandable) {
    expanded.value = !expanded.value
  }
}

const retryConnection = async (): Promise<void> => {
  if (isRetrying.value) return
  
  isRetrying.value = true
  
  try {
    // 尝试发起网络请求来检测连接
    await fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache'
    })
  } catch (error) {
    console.log('Connection retry failed:', error)
  } finally {
    setTimeout(() => {
      isRetrying.value = false
    }, 1000)
  }
}

const handleNetworkEvent = (event: NetworkEvent): void => {
  console.log('Network event:', event.type, event.currentState)
  
  // 自动隐藏逻辑
  if (props.autoHide && event.type === 'online') {
    setTimeout(() => {
      isVisible.value = false
    }, props.hideDelay)
  } else if (event.type === 'offline') {
    isVisible.value = true
  }
}

// 生命周期
onMounted(() => {
  addEventListener(handleNetworkEvent)
})

onUnmounted(() => {
  removeEventListener(handleNetworkEvent)
})
</script>

<style scoped>
.network-status-indicator {
  @apply transition-all duration-300;
}

.network-icon {
  @apply relative flex items-center;
}

.quality-bars {
  @apply absolute -bottom-1 -right-1 flex space-x-0.5;
}

.quality-bar {
  @apply w-1 rounded-full transition-colors duration-200;
  height: 4px;
}

.quality-bar:nth-child(1) { height: 2px; }
.quality-bar:nth-child(2) { height: 4px; }
.quality-bar:nth-child(3) { height: 6px; }
.quality-bar:nth-child(4) { height: 8px; }

.network-text {
  @apply flex items-center space-x-1;
}

.connection-type {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.network-details {
  @apply mt-3 space-y-2 text-sm;
}

.detail-row {
  @apply flex justify-between items-center;
}

.detail-label {
  @apply text-gray-600 dark:text-gray-400;
}

.detail-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.offline-banner {
  @apply w-full bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4;
}

.offline-content {
  @apply flex items-center space-x-3;
}

.offline-message {
  @apply flex-1;
}

.retry-button {
  @apply flex items-center space-x-1 px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors duration-200 disabled:opacity-50;
}

.quality-warning {
  @apply flex items-center space-x-2 mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md;
}

/* 屏幕阅读器专用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 高对比度模式支持 */
:global(.high-contrast) .network-status-indicator {
  @apply border-2 border-current;
}

:global(.high-contrast) .quality-bar.active {
  @apply bg-current;
}

/* 大字体模式支持 */
:global(.large-text) .network-text {
  @apply text-base;
}

:global(.large-text) .network-details {
  @apply text-base;
}

/* 减少动画模式支持 */
:global(.reduced-motion) .network-status-indicator,
:global(.reduced-motion) .quality-bar,
:global(.reduced-motion) .retry-button {
  @apply transition-none;
}

/* 暗色模式支持 */
:global(.theme-dark) .offline-banner {
  @apply bg-yellow-900/30 border-yellow-500;
}

:global(.theme-dark) .quality-warning {
  @apply bg-orange-900/30;
}

/* 打印样式 */
@media print {
  .network-status-indicator {
    @apply hidden;
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .offline-content {
    @apply flex-col space-x-0 space-y-2 items-start;
  }
  
  .retry-button {
    @apply self-end;
  }
}

/* 动画性能优化 */
.quality-bar {
  will-change: background-color, height;
}

.network-status-indicator {
  will-change: opacity, transform;
}

/* 无障碍增强 */
.retry-button:focus {
  @apply outline-none ring-2 ring-yellow-500 ring-offset-2;
}

:global(.theme-dark) .retry-button:focus {
  @apply ring-offset-gray-900;
}

/* 可点击指示器 */
.network-status-indicator.expandable {
  @apply cursor-pointer;
}

.network-status-indicator.expandable:hover {
  @apply opacity-80;
}
</style>
