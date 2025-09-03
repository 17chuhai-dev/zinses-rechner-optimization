<!--
  增强加载状态组件
  提供多种加载动画、进度指示和用户友好的反馈
-->

<template>
  <div 
    class="enhanced-loading-state"
    :class="containerClasses"
    :aria-live="'polite'"
    :aria-label="ariaLabel"
  >
    <!-- 加载动画 -->
    <div class="loading-animation" :class="animationClasses">
      <!-- 旋转器动画 -->
      <div v-if="type === 'spinner'" class="spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      
      <!-- 脉冲动画 -->
      <div v-else-if="type === 'pulse'" class="pulse">
        <div class="pulse-dot"></div>
        <div class="pulse-dot"></div>
        <div class="pulse-dot"></div>
      </div>
      
      <!-- 波浪动画 -->
      <div v-else-if="type === 'wave'" class="wave">
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
      </div>
      
      <!-- 计算器特定动画 */
      <div v-else-if="type === 'calculator'" class="calculator-animation">
        <div class="calculator-icon">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
        </div>
        <div class="calculation-bars">
          <div class="calc-bar"></div>
          <div class="calc-bar"></div>
          <div class="calc-bar"></div>
        </div>
      </div>
      
      <!-- 进度条动画 -->
      <div v-else-if="type === 'progress'" class="progress-animation">
        <div class="progress-track">
          <div 
            class="progress-bar"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="progress-text">{{ Math.round(progress) }}%</div>
      </div>
      
      <!-- 骨架屏 -->
      <div v-else-if="type === 'skeleton'" class="skeleton">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div class="skeleton-grid">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      </div>
    </div>
    
    <!-- 加载文本 -->
    <div v-if="showText" class="loading-text">
      <h3 v-if="title" class="loading-title">{{ title }}</h3>
      <p class="loading-message">{{ currentMessage }}</p>
      
      <!-- 进度信息 -->
      <div v-if="showProgress && type !== 'progress'" class="progress-info">
        <div class="progress-steps">
          <span class="current-step">{{ currentStep }}</span>
          <span class="step-separator">/</span>
          <span class="total-steps">{{ totalSteps }}</span>
        </div>
        <div class="progress-percentage">{{ Math.round(progress) }}%</div>
      </div>
      
      <!-- 估计时间 -->
      <div v-if="estimatedTime" class="estimated-time">
        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clip-rule="evenodd" />
        </svg>
        <span>Geschätzte Zeit: {{ estimatedTime }}</span>
      </div>
    </div>
    
    <!-- 取消按钮 -->
    <button
      v-if="cancellable"
      type="button"
      class="cancel-button"
      @click="handleCancel"
      :disabled="cancelling"
    >
      <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
      {{ cancelling ? 'Wird abgebrochen...' : 'Abbrechen' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useResponsive } from '@/composables/useResponsive'

interface Props {
  // 加载状态
  loading?: boolean
  
  // 动画类型
  type?: 'spinner' | 'pulse' | 'wave' | 'calculator' | 'progress' | 'skeleton'
  
  // 尺寸
  size?: 'sm' | 'md' | 'lg' | 'xl'
  
  // 颜色主题
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  
  // 文本内容
  title?: string
  message?: string | string[]
  showText?: boolean
  
  // 进度相关
  progress?: number
  currentStep?: number
  totalSteps?: number
  showProgress?: boolean
  
  // 时间估计
  estimatedTime?: string
  
  // 交互
  cancellable?: boolean
  
  // 样式
  overlay?: boolean
  blur?: boolean
  
  // 无障碍
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: true,
  type: 'spinner',
  size: 'md',
  color: 'primary',
  showText: true,
  progress: 0,
  currentStep: 1,
  totalSteps: 1,
  showProgress: false,
  cancellable: false,
  overlay: false,
  blur: false
})

const emit = defineEmits<{
  cancel: []
}>()

const { isMobile, prefersReducedMotion } = useResponsive()

// 状态
const cancelling = ref(false)
const messageIndex = ref(0)

// 当前显示的消息
const currentMessage = computed(() => {
  if (Array.isArray(props.message)) {
    return props.message[messageIndex.value] || props.message[0] || 'Wird geladen...'
  }
  return props.message || 'Wird geladen...'
})

// 样式类
const containerClasses = computed(() => [
  'enhanced-loading-state',
  `size-${props.size}`,
  `color-${props.color}`,
  {
    'is-overlay': props.overlay,
    'is-blur': props.blur,
    'is-mobile': isMobile.value,
    'reduced-motion': prefersReducedMotion.value,
    'is-loading': props.loading
  }
])

const animationClasses = computed(() => [
  'loading-animation',
  `type-${props.type}`,
  {
    'reduced-motion': prefersReducedMotion.value
  }
])

// ARIA 标签
const ariaLabel = computed(() => {
  return props.ariaLabel || `${currentMessage.value} ${props.showProgress ? `${Math.round(props.progress)}% abgeschlossen` : ''}`
})

// 消息轮换
let messageInterval: number | null = null

const startMessageRotation = () => {
  if (!Array.isArray(props.message) || props.message.length <= 1) return
  
  messageInterval = window.setInterval(() => {
    messageIndex.value = (messageIndex.value + 1) % props.message.length
  }, 3000)
}

const stopMessageRotation = () => {
  if (messageInterval) {
    clearInterval(messageInterval)
    messageInterval = null
  }
}

// 取消处理
const handleCancel = () => {
  if (cancelling.value) return
  
  cancelling.value = true
  emit('cancel')
  
  // 重置状态
  setTimeout(() => {
    cancelling.value = false
  }, 1000)
}

// 监听加载状态
watch(() => props.loading, (isLoading) => {
  if (isLoading) {
    startMessageRotation()
  } else {
    stopMessageRotation()
    messageIndex.value = 0
  }
})

// 生命周期
onMounted(() => {
  if (props.loading) {
    startMessageRotation()
  }
})

onUnmounted(() => {
  stopMessageRotation()
})
</script>

<style scoped>
.enhanced-loading-state {
  @apply flex flex-col items-center justify-center p-8 text-center;
}

.is-overlay {
  @apply fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50;
}

.is-blur {
  @apply backdrop-blur-md;
}

/* 加载动画容器 */
.loading-animation {
  @apply mb-6;
}

/* 旋转器动画 */
.spinner {
  @apply relative inline-block;
}

.spinner-ring {
  @apply absolute border-4 border-transparent rounded-full animate-spin;
}

.spinner-ring:nth-child(1) {
  @apply w-12 h-12 border-t-current;
  animation-duration: 1.2s;
}

.spinner-ring:nth-child(2) {
  @apply w-10 h-10 border-r-current top-1 left-1;
  animation-duration: 1.0s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  @apply w-8 h-8 border-b-current top-2 left-2;
  animation-duration: 0.8s;
}

.spinner-ring:nth-child(4) {
  @apply w-6 h-6 border-l-current top-3 left-3;
  animation-duration: 0.6s;
  animation-direction: reverse;
}

/* 脉冲动画 */
.pulse {
  @apply flex space-x-2;
}

.pulse-dot {
  @apply w-3 h-3 bg-current rounded-full animate-pulse;
}

.pulse-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.pulse-dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* 波浪动画 */
.wave {
  @apply flex items-end space-x-1;
}

.wave-bar {
  @apply w-2 bg-current rounded-full;
  height: 20px;
  animation: wave 1.2s ease-in-out infinite;
}

.wave-bar:nth-child(2) { animation-delay: 0.1s; }
.wave-bar:nth-child(3) { animation-delay: 0.2s; }
.wave-bar:nth-child(4) { animation-delay: 0.3s; }
.wave-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 40%, 100% { transform: scaleY(0.4); }
  20% { transform: scaleY(1); }
}

/* 计算器动画 */
.calculator-animation {
  @apply flex flex-col items-center space-y-4;
}

.calculator-icon {
  @apply text-4xl animate-bounce;
}

.calculation-bars {
  @apply flex space-x-1;
}

.calc-bar {
  @apply w-1 h-6 bg-current rounded-full;
  animation: calc-pulse 1.5s ease-in-out infinite;
}

.calc-bar:nth-child(2) { animation-delay: 0.2s; }
.calc-bar:nth-child(3) { animation-delay: 0.4s; }

@keyframes calc-pulse {
  0%, 100% { opacity: 0.3; transform: scaleY(0.5); }
  50% { opacity: 1; transform: scaleY(1); }
}

/* 进度条动画 */
.progress-animation {
  @apply w-full max-w-xs;
}

.progress-track {
  @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2;
}

.progress-bar {
  @apply h-full bg-current rounded-full transition-all duration-300 ease-out;
}

.progress-text {
  @apply text-sm font-medium;
}

/* 骨架屏 */
.skeleton {
  @apply w-full max-w-md space-y-4;
}

.skeleton-line {
  @apply bg-gray-200 dark:bg-gray-700 rounded animate-pulse;
}

.skeleton-title {
  @apply h-6 w-3/4;
}

.skeleton-text {
  @apply h-4 w-full;
}

.skeleton-text.short {
  @apply w-2/3;
}

.skeleton-grid {
  @apply grid grid-cols-3 gap-4 mt-6;
}

.skeleton-card {
  @apply bg-gray-200 dark:bg-gray-700 rounded-lg h-20 animate-pulse;
}

/* 加载文本 */
.loading-text {
  @apply space-y-3;
}

.loading-title {
  @apply text-lg font-semibold;
}

.loading-message {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.progress-info {
  @apply flex items-center justify-between text-xs text-gray-500 dark:text-gray-400;
}

.progress-steps {
  @apply flex items-center space-x-1;
}

.estimated-time {
  @apply flex items-center justify-center text-xs text-gray-500 dark:text-gray-400;
}

.cancel-button {
  @apply mt-4 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
         rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
         disabled:opacity-50 disabled:cursor-not-allowed;
}

/* 尺寸变体 */
.size-sm .loading-animation {
  @apply mb-4;
}

.size-sm .spinner-ring:nth-child(1) {
  @apply w-8 h-8;
}

.size-lg .spinner-ring:nth-child(1) {
  @apply w-16 h-16;
}

.size-xl .spinner-ring:nth-child(1) {
  @apply w-20 h-20;
}

/* 颜色变体 */
.color-primary {
  @apply text-blue-600 dark:text-blue-400;
}

.color-secondary {
  @apply text-gray-600 dark:text-gray-400;
}

.color-success {
  @apply text-green-600 dark:text-green-400;
}

.color-warning {
  @apply text-yellow-600 dark:text-yellow-400;
}

.color-error {
  @apply text-red-600 dark:text-red-400;
}

/* 减少动画偏好 */
.reduced-motion * {
  @apply animate-none;
}

.reduced-motion .spinner-ring {
  @apply animate-pulse;
}

/* 移动端优化 */
.is-mobile {
  @apply p-6;
}

.is-mobile .loading-title {
  @apply text-base;
}

.is-mobile .loading-message {
  @apply text-xs;
}
</style>
