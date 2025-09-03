<!--
  进度条组件
  提供各种样式的进度条显示
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel" role="progressbar" :aria-valuenow="value" :aria-valuemin="0" :aria-valuemax="max">
    <!-- 进度条标签 -->
    <div v-if="showLabel || showPercentage" class="progress-label flex justify-between items-center mb-2">
      <span v-if="showLabel && label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
      </span>
      <span v-if="showPercentage" class="text-sm text-gray-600 dark:text-gray-400">
        {{ Math.round(percentage) }}%
      </span>
    </div>

    <!-- 进度条容器 -->
    <div :class="trackClasses">
      <!-- 进度条填充 -->
      <div
        :class="fillClasses"
        :style="fillStyle"
        :data-percentage="Math.round(percentage)"
      >
        <!-- 条纹效果 -->
        <div v-if="striped" class="progress-stripes"></div>
        
        <!-- 进度条内文本 -->
        <span v-if="showInnerText" class="progress-inner-text">
          {{ innerText || `${Math.round(percentage)}%` }}
        </span>
      </div>
      
      <!-- 不确定进度动画 -->
      <div v-if="indeterminate" class="progress-indeterminate"></div>
    </div>

    <!-- 进度条描述 -->
    <div v-if="description" class="progress-description mt-2 text-xs text-gray-500 dark:text-gray-400">
      {{ description }}
    </div>

    <!-- 时间估算 -->
    <div v-if="showTimeEstimate && timeEstimate" class="progress-time mt-1 text-xs text-gray-500 dark:text-gray-400">
      {{ timeEstimate }}
    </div>

    <!-- 屏幕阅读器文本 -->
    <span class="sr-only">
      {{ ariaDescription }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'

// Props
interface Props {
  // 进度值
  value?: number
  max?: number
  
  // 显示选项
  label?: string
  description?: string
  showLabel?: boolean
  showPercentage?: boolean
  showInnerText?: boolean
  innerText?: string
  showTimeEstimate?: boolean
  
  // 样式选项
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'pink'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  striped?: boolean
  animated?: boolean
  rounded?: boolean
  
  // 状态
  indeterminate?: boolean
  
  // 自定义样式
  customClasses?: string | string[]
  
  // 无障碍
  ariaLabel?: string
  
  // 时间估算
  startTime?: Date
  estimatedDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  max: 100,
  showLabel: false,
  showPercentage: true,
  showInnerText: false,
  showTimeEstimate: false,
  color: 'blue',
  size: 'md',
  striped: false,
  animated: false,
  rounded: true,
  indeterminate: false
})

// 响应式数据
const timeEstimate = ref<string>('')

// 计算属性
const percentage = computed(() => {
  if (props.indeterminate) return 0
  return Math.max(0, Math.min(100, (props.value / props.max) * 100))
})

const containerClasses = computed(() => {
  const classes = ['progress-container', 'w-full']
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const trackClasses = computed(() => {
  const classes = ['progress-track', 'relative', 'overflow-hidden', 'bg-gray-200', 'dark:bg-gray-700']
  
  // 大小
  const sizeMap = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6'
  }
  classes.push(sizeMap[props.size])
  
  // 圆角
  if (props.rounded) {
    classes.push('rounded-full')
  }
  
  return classes
})

const fillClasses = computed(() => {
  const classes = ['progress-fill', 'h-full', 'transition-all', 'duration-300', 'ease-out', 'relative', 'flex', 'items-center', 'justify-center']
  
  // 颜色
  const colorMap = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    indigo: 'bg-indigo-600',
    pink: 'bg-pink-600'
  }
  classes.push(colorMap[props.color])
  
  // 圆角
  if (props.rounded) {
    classes.push('rounded-full')
  }
  
  // 动画
  if (props.animated) {
    classes.push('progress-animated')
  }
  
  return classes
})

const fillStyle = computed(() => {
  if (props.indeterminate) {
    return { width: '100%' }
  }
  return { width: `${percentage.value}%` }
})

const ariaLabel = computed(() => {
  return props.ariaLabel || props.label || 'Fortschritt'
})

const ariaDescription = computed(() => {
  if (props.indeterminate) {
    return 'Fortschritt wird verarbeitet'
  }
  return `${Math.round(percentage.value)} Prozent abgeschlossen`
})

// 时间估算计算
const calculateTimeEstimate = () => {
  if (!props.startTime || !props.estimatedDuration || props.indeterminate) {
    timeEstimate.value = ''
    return
  }
  
  const elapsed = Date.now() - props.startTime.getTime()
  const progress = percentage.value / 100
  
  if (progress > 0) {
    const estimatedTotal = elapsed / progress
    const remaining = estimatedTotal - elapsed
    
    if (remaining > 0) {
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      
      if (minutes > 0) {
        timeEstimate.value = `Noch etwa ${minutes}m ${seconds}s`
      } else {
        timeEstimate.value = `Noch etwa ${seconds}s`
      }
    } else {
      timeEstimate.value = 'Fast fertig...'
    }
  } else {
    timeEstimate.value = 'Berechnung der verbleibenden Zeit...'
  }
}

// 监听器
watch(() => [props.value, props.startTime, props.estimatedDuration], () => {
  if (props.showTimeEstimate) {
    calculateTimeEstimate()
  }
}, { immediate: true })

// 定期更新时间估算
if (props.showTimeEstimate) {
  setInterval(calculateTimeEstimate, 1000)
}
</script>

<style scoped>
.progress-container {
  @apply w-full;
}

.progress-track {
  @apply relative overflow-hidden;
}

.progress-fill {
  @apply relative;
}

/* 条纹效果 */
.progress-stripes {
  @apply absolute inset-0 opacity-25;
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}

/* 动画条纹 */
.progress-animated .progress-stripes {
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 1rem 0;
  }
}

/* 不确定进度动画 */
.progress-indeterminate {
  @apply absolute inset-0 bg-current opacity-75;
  animation: progress-indeterminate 2s ease-in-out infinite;
}

@keyframes progress-indeterminate {
  0% {
    left: -35%;
    right: 100%;
  }
  60% {
    left: 100%;
    right: -90%;
  }
  100% {
    left: 100%;
    right: -90%;
  }
}

/* 进度条内文本 */
.progress-inner-text {
  @apply text-xs font-medium text-white mix-blend-difference;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

/* 颜色变体 */
.progress-fill.bg-blue-600 .progress-indeterminate {
  @apply bg-blue-400;
}

.progress-fill.bg-green-600 .progress-indeterminate {
  @apply bg-green-400;
}

.progress-fill.bg-yellow-500 .progress-indeterminate {
  @apply bg-yellow-300;
}

.progress-fill.bg-red-600 .progress-indeterminate {
  @apply bg-red-400;
}

.progress-fill.bg-purple-600 .progress-indeterminate {
  @apply bg-purple-400;
}

.progress-fill.bg-indigo-600 .progress-indeterminate {
  @apply bg-indigo-400;
}

.progress-fill.bg-pink-600 .progress-indeterminate {
  @apply bg-pink-400;
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

/* 高对比度模式支持 */
:global(.high-contrast) .progress-track {
  @apply border-2 border-current;
}

:global(.high-contrast) .progress-fill {
  @apply border border-current;
}

/* 大字体模式支持 */
:global(.large-text) .progress-label {
  @apply text-base;
}

:global(.large-text) .progress-description,
:global(.large-text) .progress-time {
  @apply text-sm;
}

:global(.large-text) .progress-inner-text {
  @apply text-sm;
}

/* 减少动画模式支持 */
:global(.reduced-motion) .progress-fill {
  @apply transition-none;
}

:global(.reduced-motion) .progress-stripes {
  animation: none;
}

:global(.reduced-motion) .progress-indeterminate {
  animation: none;
  @apply left-0 right-0;
}

/* 暗色模式支持 */
:global(.theme-dark) .progress-inner-text {
  @apply text-gray-900;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
}

/* 打印样式 */
@media print {
  .progress-container {
    @apply text-black bg-white;
  }
  
  .progress-track {
    @apply bg-gray-300 border border-gray-400;
  }
  
  .progress-fill {
    @apply bg-gray-600;
  }
  
  .progress-stripes,
  .progress-indeterminate {
    @apply hidden;
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .progress-label {
    @apply flex-col items-start space-y-1;
  }
  
  .progress-inner-text {
    @apply hidden;
  }
}

/* 动画性能优化 */
.progress-fill {
  will-change: width;
}

.progress-stripes {
  will-change: background-position;
}

.progress-indeterminate {
  will-change: left, right;
}

/* 无障碍增强 */
@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .progress-stripes,
  .progress-indeterminate {
    animation: none !important;
    transition: none !important;
  }
}

/* 成功状态动画 */
.progress-fill[data-percentage="100"] {
  animation: progress-complete 0.5s ease-out;
}

@keyframes progress-complete {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

/* 脉冲效果（用于不确定进度） */
.progress-track:has(.progress-indeterminate) {
  animation: progress-pulse 2s ease-in-out infinite;
}

@keyframes progress-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
