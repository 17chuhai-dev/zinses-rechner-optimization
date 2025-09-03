<!--
  加载状态指示器组件
  专业的加载状态指示器，支持多种加载状态和平滑动画过渡
-->

<template>
  <div class="loading-indicator" :class="[`loading-${state}`, { 'loading-compact': compact }]">
    <!-- 主要加载状态 -->
    <Transition name="loading-fade" mode="out-in">
      <div v-if="state === 'initializing'" key="initializing" class="loading-content">
        <div class="loading-spinner spinner-pulse">
          <div class="pulse-ring"></div>
          <div class="pulse-ring"></div>
          <div class="pulse-ring"></div>
        </div>
        <div class="loading-text">
          <h4>{{ $t('loading.initializing') }}</h4>
          <p>{{ $t('loading.preparingCalculation') }}</p>
        </div>
      </div>

      <div v-else-if="state === 'calculating'" key="calculating" class="loading-content">
        <div class="loading-spinner spinner-rotate">
          <svg class="circular" viewBox="25 25 50 50">
            <circle
              class="path"
              cx="50"
              cy="50"
              r="20"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-miterlimit="10"
            />
          </svg>
        </div>
        <div class="loading-text">
          <h4>{{ $t('loading.calculating') }}</h4>
          <p v-if="calculatorName">{{ $t('loading.calculatingFor', { calculator: calculatorName }) }}</p>
          <div v-if="showProgress" class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <span class="progress-text">{{ Math.round(progress) }}%</span>
          </div>
        </div>
      </div>

      <div v-else-if="state === 'completed'" key="completed" class="loading-content">
        <div class="loading-spinner spinner-success">
          <svg class="checkmark" viewBox="0 0 52 52">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="m14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <div class="loading-text">
          <h4>{{ $t('loading.completed') }}</h4>
          <p>{{ $t('loading.calculationComplete') }}</p>
        </div>
      </div>

      <div v-else-if="state === 'error'" key="error" class="loading-content">
        <div class="loading-spinner spinner-error">
          <svg class="error-icon" viewBox="0 0 52 52">
            <circle class="error-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="error-cross" fill="none" d="m16 16 20 20 m0-20-20 20"/>
          </svg>
        </div>
        <div class="loading-text">
          <h4>{{ $t('loading.error') }}</h4>
          <p v-if="errorMessage">{{ errorMessage }}</p>
          <p v-else>{{ $t('loading.calculationError') }}</p>
        </div>
      </div>
    </Transition>

    <!-- 次要信息 -->
    <div v-if="showDetails && !compact" class="loading-details">
      <div v-if="duration > 0" class="detail-item">
        <span class="detail-label">{{ $t('loading.duration') }}:</span>
        <span class="detail-value">{{ formatDuration(duration) }}</span>
      </div>
      <div v-if="cacheStatus" class="detail-item">
        <span class="detail-label">{{ $t('loading.cache') }}:</span>
        <span class="detail-value" :class="cacheStatus.hit ? 'cache-hit' : 'cache-miss'">
          {{ cacheStatus.hit ? $t('loading.cacheHit') : $t('loading.cacheMiss') }}
        </span>
      </div>
      <div v-if="workerInfo" class="detail-item">
        <span class="detail-label">{{ $t('loading.worker') }}:</span>
        <span class="detail-value">{{ workerInfo.id }}</span>
      </div>
    </div>

    <!-- 取消按钮 -->
    <div v-if="showCancelButton && state === 'calculating'" class="loading-actions">
      <button 
        class="cancel-button"
        @click="handleCancel"
        :disabled="cancelling"
      >
        <span v-if="!cancelling">{{ $t('loading.cancel') }}</span>
        <span v-else>{{ $t('loading.cancelling') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Props定义
interface Props {
  state: 'initializing' | 'calculating' | 'completed' | 'error'
  progress?: number
  calculatorName?: string
  errorMessage?: string
  duration?: number
  cacheStatus?: { hit: boolean; key?: string }
  workerInfo?: { id: string; activeRequests: number }
  showProgress?: boolean
  showDetails?: boolean
  showCancelButton?: boolean
  compact?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  showProgress: false,
  showDetails: false,
  showCancelButton: false,
  compact: false,
  autoHide: false,
  autoHideDelay: 2000
})

// Emits定义
interface Emits {
  cancel: []
  hidden: []
}

const emit = defineEmits<Emits>()

// 响应式数据
const cancelling = ref(false)
const startTime = ref<number>(0)
const currentDuration = ref(0)

// 计算属性
const isVisible = computed(() => {
  if (props.autoHide && props.state === 'completed') {
    return false
  }
  return true
})

// 定时器
let durationTimer: NodeJS.Timeout | null = null
let autoHideTimer: NodeJS.Timeout | null = null

// 方法
const handleCancel = () => {
  if (cancelling.value) return
  
  cancelling.value = true
  emit('cancel')
  
  // 2秒后重置取消状态
  setTimeout(() => {
    cancelling.value = false
  }, 2000)
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const startDurationTimer = () => {
  if (durationTimer) clearInterval(durationTimer)
  
  startTime.value = Date.now()
  durationTimer = setInterval(() => {
    currentDuration.value = Date.now() - startTime.value
  }, 100)
}

const stopDurationTimer = () => {
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
}

const startAutoHideTimer = () => {
  if (!props.autoHide) return
  
  if (autoHideTimer) clearTimeout(autoHideTimer)
  
  autoHideTimer = setTimeout(() => {
    emit('hidden')
  }, props.autoHideDelay)
}

// 监听器
watch(() => props.state, (newState, oldState) => {
  if (newState === 'calculating' && oldState !== 'calculating') {
    startDurationTimer()
  } else if (newState !== 'calculating' && oldState === 'calculating') {
    stopDurationTimer()
  }
  
  if (newState === 'completed' || newState === 'error') {
    startAutoHideTimer()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (props.state === 'calculating') {
    startDurationTimer()
  }
})

onUnmounted(() => {
  stopDurationTimer()
  if (autoHideTimer) clearTimeout(autoHideTimer)
})
</script>

<style scoped>
.loading-indicator {
  @apply bg-white rounded-lg shadow-lg border border-gray-200 p-6;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.loading-compact {
  @apply p-4;
  min-height: 80px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

/* 加载动画样式 */
.loading-spinner {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-compact .loading-spinner {
  width: 32px;
  height: 32px;
}

/* 脉冲动画 */
.spinner-pulse {
  position: relative;
}

.pulse-ring {
  position: absolute;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  width: 100%;
  height: 100%;
  animation: pulse 1.5s ease-out infinite;
}

.pulse-ring:nth-child(2) {
  animation-delay: 0.5s;
}

.pulse-ring:nth-child(3) {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 旋转动画 */
.spinner-rotate {
  animation: rotate 2s linear infinite;
}

.circular {
  width: 100%;
  height: 100%;
}

.path {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
  color: #3b82f6;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 成功动画 */
.spinner-success .checkmark {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  stroke-width: 2;
  stroke: #10b981;
  stroke-miterlimit: 10;
  animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
}

.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #10b981;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

/* 错误动画 */
.spinner-error .error-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  stroke-width: 2;
  stroke: #ef4444;
  stroke-miterlimit: 10;
}

.error-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #ef4444;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.error-cross {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 30px #10b981;
  }
}

/* 文本样式 */
.loading-text h4 {
  @apply text-lg font-semibold text-gray-900 mb-1;
  margin: 0;
}

.loading-text p {
  @apply text-sm text-gray-600;
  margin: 0;
}

.loading-compact .loading-text h4 {
  @apply text-base;
}

.loading-compact .loading-text p {
  @apply text-xs;
}

/* 进度条 */
.progress-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  width: 200px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  @apply text-xs text-gray-500 font-medium;
  min-width: 35px;
}

/* 详细信息 */
.loading-details {
  @apply mt-4 pt-4 border-t border-gray-100;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  @apply text-xs text-gray-500;
}

.detail-value {
  @apply text-xs font-medium text-gray-700;
}

.cache-hit {
  @apply text-green-600;
}

.cache-miss {
  @apply text-orange-600;
}

/* 操作按钮 */
.loading-actions {
  @apply mt-4 pt-4 border-t border-gray-100;
  width: 100%;
  display: flex;
  justify-content: center;
}

.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md;
  @apply hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  transition: all 0.2s ease;
}

/* 状态特定样式 */
.loading-initializing {
  @apply border-blue-200 bg-blue-50;
}

.loading-calculating {
  @apply border-blue-200 bg-blue-50;
}

.loading-completed {
  @apply border-green-200 bg-green-50;
}

.loading-error {
  @apply border-red-200 bg-red-50;
}

/* 过渡动画 */
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: all 0.3s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
