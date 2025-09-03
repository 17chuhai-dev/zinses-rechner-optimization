<!--
  加载指示器组件
  提供各种类型的加载动画和指示器
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel" role="status" aria-live="polite">
    <!-- 旋转器加载 -->
    <div v-if="type === 'spinner'" class="loading-spinner">
      <div :class="spinnerClasses">
        <div class="spinner-circle"></div>
      </div>
    </div>

    <!-- 点状加载 -->
    <div v-else-if="type === 'dots'" class="loading-dots">
      <div
        v-for="i in 3"
        :key="i"
        :class="[dotClasses, `dot-${i}`]"
      ></div>
    </div>

    <!-- 脉冲加载 -->
    <div v-else-if="type === 'pulse'" class="loading-pulse">
      <div :class="pulseClasses"></div>
    </div>

    <!-- 波浪加载 -->
    <div v-else-if="type === 'wave'" class="loading-wave">
      <div
        v-for="i in 5"
        :key="i"
        :class="[waveBarClasses, `wave-${i}`]"
      ></div>
    </div>

    <!-- 环形加载 -->
    <div v-else-if="type === 'ring'" class="loading-ring">
      <div :class="ringClasses"></div>
    </div>

    <!-- 条形加载 -->
    <div v-else-if="type === 'bars'" class="loading-bars">
      <div
        v-for="i in 4"
        :key="i"
        :class="[barClasses, `bar-${i}`]"
      ></div>
    </div>

    <!-- 加载文本 -->
    <div v-if="showMessage && message" :class="messageClasses">
      {{ message }}
    </div>

    <!-- 取消按钮 -->
    <BaseButton
      v-if="cancelable"
      variant="ghost"
      size="sm"
      @click="$emit('cancel')"
      class="mt-3"
    >
      <XMarkIcon class="w-4 h-4 mr-1" />
      Abbrechen
    </BaseButton>

    <!-- 屏幕阅读器文本 -->
    <span class="sr-only">
      {{ screenReaderText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'

// Props
interface Props {
  // 加载类型
  type?: 'spinner' | 'dots' | 'pulse' | 'wave' | 'ring' | 'bars'
  
  // 大小
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  // 颜色
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'white'
  
  // 消息
  message?: string
  showMessage?: boolean
  
  // 行为
  cancelable?: boolean
  overlay?: boolean
  
  // 样式
  customClasses?: string | string[]
  centered?: boolean
  
  // 无障碍
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 'md',
  color: 'blue',
  showMessage: true,
  cancelable: false,
  overlay: false,
  centered: true,
  ariaLabel: 'Wird geladen'
})

// Emits
interface Emits {
  cancel: []
}

defineEmits<Emits>()

// 计算属性
const containerClasses = computed(() => {
  const classes = ['loading-indicator']
  
  if (props.centered) {
    classes.push('flex', 'flex-col', 'items-center', 'justify-center')
  }
  
  if (props.overlay) {
    classes.push(
      'fixed', 'inset-0', 'z-50', 'bg-white', 'bg-opacity-75', 
      'dark:bg-gray-900', 'dark:bg-opacity-75', 'backdrop-blur-sm'
    )
  }
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const sizeClasses = computed(() => {
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return sizeMap[props.size]
})

const colorClasses = computed(() => {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-500',
    red: 'text-red-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600',
    white: 'text-white'
  }
  return colorMap[props.color]
})

const spinnerClasses = computed(() => {
  return [sizeClasses.value, colorClasses.value, 'animate-spin']
})

const dotClasses = computed(() => {
  const sizeMap = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  }
  
  return [
    sizeMap[props.size],
    'rounded-full',
    'bg-current',
    colorClasses.value,
    'animate-pulse'
  ]
})

const pulseClasses = computed(() => {
  return [
    sizeClasses.value,
    'rounded-full',
    'bg-current',
    colorClasses.value,
    'animate-pulse'
  ]
})

const waveBarClasses = computed(() => {
  const widthMap = {
    xs: 'w-0.5',
    sm: 'w-1',
    md: 'w-1',
    lg: 'w-1.5',
    xl: 'w-2'
  }
  
  const heightMap = {
    xs: 'h-4',
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16'
  }
  
  return [
    widthMap[props.size],
    heightMap[props.size],
    'bg-current',
    colorClasses.value,
    'rounded-full'
  ]
})

const ringClasses = computed(() => {
  return [
    sizeClasses.value,
    'border-2',
    'border-current',
    'border-t-transparent',
    colorClasses.value,
    'rounded-full',
    'animate-spin'
  ]
})

const barClasses = computed(() => {
  const widthMap = {
    xs: 'w-0.5',
    sm: 'w-1',
    md: 'w-1',
    lg: 'w-1.5',
    xl: 'w-2'
  }
  
  const heightMap = {
    xs: 'h-3',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-10'
  }
  
  return [
    widthMap[props.size],
    heightMap[props.size],
    'bg-current',
    colorClasses.value,
    'rounded-sm'
  ]
})

const messageClasses = computed(() => {
  const sizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }
  
  return [
    'mt-3',
    'text-center',
    'font-medium',
    'text-gray-700',
    'dark:text-gray-300',
    sizeMap[props.size]
  ]
})

const screenReaderText = computed(() => {
  if (props.message) {
    return `${props.ariaLabel}: ${props.message}`
  }
  return props.ariaLabel
})
</script>

<style scoped>
.loading-indicator {
  @apply select-none;
}

/* 旋转器样式 */
.spinner-circle {
  @apply w-full h-full border-2 border-current border-t-transparent rounded-full;
}

/* 点状加载动画 */
.loading-dots {
  @apply flex space-x-1;
}

.dot-1 {
  animation: dot-bounce 1.4s ease-in-out infinite both;
  animation-delay: -0.32s;
}

.dot-2 {
  animation: dot-bounce 1.4s ease-in-out infinite both;
  animation-delay: -0.16s;
}

.dot-3 {
  animation: dot-bounce 1.4s ease-in-out infinite both;
}

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 波浪加载动画 */
.loading-wave {
  @apply flex items-end space-x-1;
}

.wave-1 { animation: wave-bounce 1.2s ease-in-out infinite; animation-delay: 0s; }
.wave-2 { animation: wave-bounce 1.2s ease-in-out infinite; animation-delay: 0.1s; }
.wave-3 { animation: wave-bounce 1.2s ease-in-out infinite; animation-delay: 0.2s; }
.wave-4 { animation: wave-bounce 1.2s ease-in-out infinite; animation-delay: 0.3s; }
.wave-5 { animation: wave-bounce 1.2s ease-in-out infinite; animation-delay: 0.4s; }

@keyframes wave-bounce {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

/* 条形加载动画 */
.loading-bars {
  @apply flex items-end space-x-1;
}

.bar-1 { animation: bar-stretch 1s ease-in-out infinite; animation-delay: 0s; }
.bar-2 { animation: bar-stretch 1s ease-in-out infinite; animation-delay: 0.1s; }
.bar-3 { animation: bar-stretch 1s ease-in-out infinite; animation-delay: 0.2s; }
.bar-4 { animation: bar-stretch 1s ease-in-out infinite; animation-delay: 0.3s; }

@keyframes bar-stretch {
  0%, 40%, 100% {
    transform: scaleY(0.5);
  }
  20% {
    transform: scaleY(1);
  }
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
:global(.high-contrast) .loading-indicator {
  filter: contrast(2);
}

/* 减少动画模式支持 */
:global(.reduced-motion) .loading-indicator * {
  animation: none !important;
}

:global(.reduced-motion) .spinner-circle {
  @apply border-l-transparent;
}

/* 暗色模式支持 */
:global(.theme-dark) .loading-indicator {
  @apply text-white;
}

/* 打印样式 */
@media print {
  .loading-indicator {
    @apply hidden;
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .loading-indicator.fixed {
    @apply p-4;
  }
}

/* 动画性能优化 */
.loading-indicator * {
  will-change: transform, opacity;
}

/* 无障碍增强 */
@media (prefers-reduced-motion: reduce) {
  .loading-indicator *,
  .dot-1,
  .dot-2,
  .dot-3,
  .wave-1,
  .wave-2,
  .wave-3,
  .wave-4,
  .wave-5,
  .bar-1,
  .bar-2,
  .bar-3,
  .bar-4 {
    animation: none !important;
  }
  
  .spinner-circle {
    @apply border-l-transparent opacity-75;
  }
  
  .loading-dots .dot-1,
  .loading-dots .dot-2,
  .loading-dots .dot-3 {
    @apply opacity-75;
  }
}

/* 焦点管理 */
.loading-indicator:focus-within {
  @apply outline-none;
}

/* 覆盖层样式增强 */
.loading-indicator.fixed {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* 颜色变体增强 */
.text-blue-600 { color: #2563eb; }
.text-green-600 { color: #16a34a; }
.text-yellow-500 { color: #eab308; }
.text-red-600 { color: #dc2626; }
.text-purple-600 { color: #9333ea; }
.text-gray-600 { color: #4b5563; }
.text-white { color: #ffffff; }

/* 暗色模式颜色调整 */
:global(.theme-dark) .text-blue-600 { color: #60a5fa; }
:global(.theme-dark) .text-green-600 { color: #34d399; }
:global(.theme-dark) .text-yellow-500 { color: #fbbf24; }
:global(.theme-dark) .text-red-600 { color: #f87171; }
:global(.theme-dark) .text-purple-600 { color: #a78bfa; }
:global(.theme-dark) .text-gray-600 { color: #9ca3af; }
</style>
