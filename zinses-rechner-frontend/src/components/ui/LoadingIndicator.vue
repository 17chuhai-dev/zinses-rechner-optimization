<!--
  加载状态指示组件
  提供多种加载状态的视觉反馈，支持不同的加载样式和进度显示
-->

<template>
  <div class="loading-indicator" :class="indicatorClasses">
    <!-- 基础加载器 -->
    <div v-if="type === 'spinner'" class="spinner-container">
      <div class="spinner" :class="spinnerClasses">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div v-if="showText" class="loading-text">{{ text }}</div>
    </div>

    <!-- 脉冲加载器 -->
    <div v-else-if="type === 'pulse'" class="pulse-container">
      <div class="pulse-dots">
        <div class="pulse-dot" v-for="i in 3" :key="i" :style="{ animationDelay: `${i * 0.2}s` }"></div>
      </div>
      <div v-if="showText" class="loading-text">{{ text }}</div>
    </div>

    <!-- 进度条加载器 -->
    <div v-else-if="type === 'progress'" class="progress-container">
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
        <div class="progress-glow" :style="{ left: `${progress}%` }"></div>
      </div>
      <div class="progress-info">
        <span v-if="showText" class="progress-text">{{ text }}</span>
        <span v-if="showPercentage" class="progress-percentage">{{ Math.round(progress) }}%</span>
      </div>
    </div>

    <!-- 骨架屏加载器 -->
    <div v-else-if="type === 'skeleton'" class="skeleton-container">
      <div class="skeleton-lines">
        <div class="skeleton-line" v-for="i in skeletonLines" :key="i" :class="getSkeletonLineClass(i)"></div>
      </div>
    </div>

    <!-- 计算器专用加载器 -->
    <div v-else-if="type === 'calculator'" class="calculator-container">
      <div class="calculator-icon">
        <Icon name="calculator" :size="iconSize" class="calculator-icon-svg" />
        <div class="calculator-pulse"></div>
      </div>
      <div v-if="showText" class="loading-text">{{ text }}</div>
      <div v-if="showSteps" class="calculation-steps">
        <div 
          v-for="(step, index) in calculationSteps" 
          :key="index"
          class="calculation-step"
          :class="{ 'active': index <= currentStep, 'completed': index < currentStep }"
        >
          <div class="step-icon">
            <Icon v-if="index < currentStep" name="check" size="12" />
            <div v-else-if="index === currentStep" class="step-spinner"></div>
            <div v-else class="step-dot"></div>
          </div>
          <span class="step-text">{{ step }}</span>
        </div>
      </div>
    </div>

    <!-- 波浪加载器 -->
    <div v-else-if="type === 'wave'" class="wave-container">
      <div class="wave-bars">
        <div class="wave-bar" v-for="i in 5" :key="i" :style="{ animationDelay: `${i * 0.1}s` }"></div>
      </div>
      <div v-if="showText" class="loading-text">{{ text }}</div>
    </div>

    <!-- 默认加载器 -->
    <div v-else class="default-container">
      <div class="default-spinner"></div>
      <div v-if="showText" class="loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import Icon from './BaseIcon.vue'

// Props定义
interface Props {
  type?: 'spinner' | 'pulse' | 'progress' | 'skeleton' | 'calculator' | 'wave' | 'default'
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  text?: string
  showText?: boolean
  progress?: number
  showPercentage?: boolean
  skeletonLines?: number
  showSteps?: boolean
  calculationSteps?: string[]
  currentStep?: number
  overlay?: boolean
  fullscreen?: boolean
  duration?: number // 自动完成的持续时间（毫秒）
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 'medium',
  variant: 'primary',
  text: '加载中...',
  showText: true,
  progress: 0,
  showPercentage: false,
  skeletonLines: 3,
  showSteps: false,
  calculationSteps: () => ['验证输入', '执行计算', '格式化结果'],
  currentStep: 0,
  overlay: false,
  fullscreen: false,
  duration: 0
})

// Emits定义
interface Emits {
  complete: []
  stepChange: [step: number]
}

const emit = defineEmits<Emits>()

// 响应式数据
const internalProgress = ref(props.progress)
const internalCurrentStep = ref(props.currentStep)
const progressTimer = ref<NodeJS.Timeout>()

// 计算属性
const indicatorClasses = computed(() => ({
  [`loading-${props.size}`]: true,
  [`loading-${props.variant}`]: true,
  'loading-overlay': props.overlay,
  'loading-fullscreen': props.fullscreen
}))

const spinnerClasses = computed(() => ({
  [`spinner-${props.size}`]: true,
  [`spinner-${props.variant}`]: true
}))

const iconSize = computed(() => {
  switch (props.size) {
    case 'small': return 16
    case 'large': return 32
    default: return 24
  }
})

// 方法
const getSkeletonLineClass = (index: number) => {
  const classes = ['skeleton-line']
  
  // 不同长度的骨架线
  if (index === 1) classes.push('skeleton-line-full')
  else if (index === props.skeletonLines) classes.push('skeleton-line-short')
  else classes.push('skeleton-line-medium')
  
  return classes
}

const startAutoProgress = () => {
  if (props.duration > 0 && props.type === 'progress') {
    const interval = 50 // 50ms更新间隔
    const increment = 100 / (props.duration / interval)
    
    progressTimer.value = setInterval(() => {
      internalProgress.value += increment
      
      if (internalProgress.value >= 100) {
        internalProgress.value = 100
        clearInterval(progressTimer.value!)
        emit('complete')
      }
    }, interval)
  }
}

const startAutoSteps = () => {
  if (props.duration > 0 && props.type === 'calculator' && props.showSteps) {
    const stepDuration = props.duration / props.calculationSteps.length
    
    const stepTimer = setInterval(() => {
      if (internalCurrentStep.value < props.calculationSteps.length - 1) {
        internalCurrentStep.value++
        emit('stepChange', internalCurrentStep.value)
      } else {
        clearInterval(stepTimer)
        emit('complete')
      }
    }, stepDuration)
  }
}

// 监听器
watch(() => props.progress, (newProgress) => {
  internalProgress.value = newProgress
})

watch(() => props.currentStep, (newStep) => {
  internalCurrentStep.value = newStep
})

// 生命周期
onMounted(() => {
  startAutoProgress()
  startAutoSteps()
})

onUnmounted(() => {
  if (progressTimer.value) {
    clearInterval(progressTimer.value)
  }
})
</script>

<style scoped>
.loading-indicator {
  @apply flex items-center justify-center;
}

.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 z-50;
}

.loading-fullscreen {
  @apply fixed inset-0 bg-white bg-opacity-90 z-50;
}

/* 尺寸变体 */
.loading-small {
  @apply text-sm;
}

.loading-medium {
  @apply text-base;
}

.loading-large {
  @apply text-lg;
}

/* 颜色变体 */
.loading-primary .spinner-ring,
.loading-primary .progress-bar,
.loading-primary .pulse-dot,
.loading-primary .wave-bar {
  @apply border-blue-500 bg-blue-500;
}

.loading-secondary .spinner-ring,
.loading-secondary .progress-bar,
.loading-secondary .pulse-dot,
.loading-secondary .wave-bar {
  @apply border-gray-500 bg-gray-500;
}

.loading-success .spinner-ring,
.loading-success .progress-bar,
.loading-success .pulse-dot,
.loading-success .wave-bar {
  @apply border-green-500 bg-green-500;
}

.loading-warning .spinner-ring,
.loading-warning .progress-bar,
.loading-warning .pulse-dot,
.loading-warning .wave-bar {
  @apply border-yellow-500 bg-yellow-500;
}

.loading-error .spinner-ring,
.loading-error .progress-bar,
.loading-error .pulse-dot,
.loading-error .wave-bar {
  @apply border-red-500 bg-red-500;
}

/* 旋转加载器 */
.spinner-container {
  @apply flex flex-col items-center gap-3;
}

.spinner {
  @apply relative;
}

.spinner-small {
  @apply w-6 h-6;
}

.spinner-medium {
  @apply w-8 h-8;
}

.spinner-large {
  @apply w-12 h-12;
}

.spinner-ring {
  @apply absolute inset-0 border-2 border-transparent rounded-full;
  border-top-color: currentColor;
  animation: spin 1s linear infinite;
}

.spinner-ring:nth-child(2) {
  animation-delay: 0.33s;
  opacity: 0.7;
}

.spinner-ring:nth-child(3) {
  animation-delay: 0.66s;
  opacity: 0.4;
}

/* 脉冲加载器 */
.pulse-container {
  @apply flex flex-col items-center gap-3;
}

.pulse-dots {
  @apply flex gap-1;
}

.pulse-dot {
  @apply w-2 h-2 rounded-full;
  animation: pulse-scale 1.5s ease-in-out infinite;
}

/* 进度条加载器 */
.progress-container {
  @apply w-full max-w-xs space-y-2;
}

.progress-bar-container {
  @apply relative w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.progress-bar {
  @apply h-full transition-all duration-300 ease-out rounded-full;
}

.progress-glow {
  @apply absolute top-0 w-4 h-full bg-white opacity-30 rounded-full;
  transform: translateX(-50%);
  animation: progress-glow 2s ease-in-out infinite;
}

.progress-info {
  @apply flex justify-between items-center text-sm;
}

/* 骨架屏加载器 */
.skeleton-container {
  @apply w-full space-y-3;
}

.skeleton-line {
  @apply h-4 bg-gray-200 rounded animate-pulse;
}

.skeleton-line-full {
  @apply w-full;
}

.skeleton-line-medium {
  @apply w-3/4;
}

.skeleton-line-short {
  @apply w-1/2;
}

/* 计算器加载器 */
.calculator-container {
  @apply flex flex-col items-center gap-4;
}

.calculator-icon {
  @apply relative;
}

.calculator-icon-svg {
  @apply text-blue-500;
}

.calculator-pulse {
  @apply absolute inset-0 rounded-full bg-blue-500 opacity-20;
  animation: pulse-ring 2s ease-out infinite;
}

.calculation-steps {
  @apply space-y-2;
}

.calculation-step {
  @apply flex items-center gap-3 text-sm text-gray-600;
}

.calculation-step.active {
  @apply text-blue-600;
}

.calculation-step.completed {
  @apply text-green-600;
}

.step-icon {
  @apply flex items-center justify-center w-5 h-5;
}

.step-spinner {
  @apply w-3 h-3 border border-blue-500 border-t-transparent rounded-full;
  animation: spin 1s linear infinite;
}

.step-dot {
  @apply w-2 h-2 bg-gray-300 rounded-full;
}

/* 波浪加载器 */
.wave-container {
  @apply flex flex-col items-center gap-3;
}

.wave-bars {
  @apply flex items-end gap-1;
}

.wave-bar {
  @apply w-1 bg-current rounded-full;
  height: 20px;
  animation: wave-bounce 1.2s ease-in-out infinite;
}

/* 默认加载器 */
.default-container {
  @apply flex flex-col items-center gap-3;
}

.default-spinner {
  @apply w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full;
  animation: spin 1s linear infinite;
}

/* 加载文本 */
.loading-text {
  @apply text-gray-600 font-medium;
}

/* 动画定义 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse-scale {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes progress-glow {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes wave-bounce {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .progress-container {
    @apply max-w-full;
  }
  
  .calculation-steps {
    @apply text-xs;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .loading-overlay {
    @apply bg-gray-900 bg-opacity-75;
  }
  
  .loading-fullscreen {
    @apply bg-gray-900 bg-opacity-90;
  }
  
  .loading-text {
    @apply text-gray-300;
  }
  
  .progress-bar-container {
    @apply bg-gray-700;
  }
  
  .skeleton-line {
    @apply bg-gray-700;
  }
  
  .calculation-step {
    @apply text-gray-400;
  }
  
  .step-dot {
    @apply bg-gray-600;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .spinner-ring,
  .pulse-dot,
  .progress-glow,
  .calculator-pulse,
  .step-spinner,
  .wave-bar,
  .default-spinner {
    animation: none;
  }
  
  .skeleton-line {
    @apply animate-none;
  }
}
</style>
