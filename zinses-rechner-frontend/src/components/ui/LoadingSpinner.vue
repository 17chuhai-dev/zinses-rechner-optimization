<template>
  <div 
    v-if="visible"
    :class="[
      'loading-spinner',
      containerClasses,
      { 'loading-center': center }
    ]"
  >
    <!-- 加载动画 -->
    <div :class="spinnerClasses">
      <svg
        :class="iconClasses"
        :style="iconStyles"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>

    <!-- 加载文本 -->
    <div v-if="message" :class="messageClasses">
      {{ message }}
    </div>

    <!-- 进度条 -->
    <div v-if="showProgress && progress !== null" class="mt-3">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
        />
      </div>
      <div class="text-xs text-gray-500 mt-1 text-center">
        {{ Math.round(progress) }}%
      </div>
    </div>

    <!-- 取消按钮 -->
    <button
      v-if="cancellable"
      @click="$emit('cancel')"
      class="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
    >
      Abbrechen
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white'
  message?: string
  center?: boolean
  overlay?: boolean
  progress?: number | null
  showProgress?: boolean
  cancellable?: boolean
  variant?: 'default' | 'dots' | 'pulse' | 'bounce'
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  size: 'md',
  color: 'primary',
  center: false,
  overlay: false,
  progress: null,
  showProgress: false,
  cancellable: false,
  variant: 'default'
})

const emit = defineEmits<{
  'cancel': []
}>()

// 容器样式类
const containerClasses = computed(() => {
  const classes = ['flex flex-col items-center justify-center']
  
  if (props.overlay) {
    classes.push('fixed inset-0 bg-white bg-opacity-75 z-50')
  }
  
  return classes
})

// 加载动画容器样式类
const spinnerClasses = computed(() => {
  const classes = ['animate-spin']
  
  if (props.variant === 'pulse') {
    classes.push('animate-pulse')
  } else if (props.variant === 'bounce') {
    classes.push('animate-bounce')
  }
  
  return classes
})

// 图标样式类
const iconClasses = computed(() => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    white: 'text-white'
  }
  
  return [
    sizeClasses[props.size],
    colorClasses[props.color]
  ]
})

// 图标样式
const iconStyles = computed(() => {
  if (props.variant === 'dots') {
    return {
      animation: 'spin 1.5s linear infinite'
    }
  }
  return {}
})

// 消息样式类
const messageClasses = computed(() => {
  const sizeClasses = {
    xs: 'text-xs mt-1',
    sm: 'text-sm mt-2',
    md: 'text-base mt-3',
    lg: 'text-lg mt-4',
    xl: 'text-xl mt-4'
  }
  
  const colorClasses = {
    primary: 'text-blue-700',
    secondary: 'text-gray-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    error: 'text-red-700',
    white: 'text-white'
  }
  
  return [
    'font-medium text-center',
    sizeClasses[props.size],
    colorClasses[props.color]
  ]
})
</script>

<style scoped>
.loading-spinner {
  transition: opacity 0.3s ease-in-out;
}

.loading-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 点状加载动画 */
@keyframes dots {
  0%, 20% {
    color: rgba(0, 0, 0, 0);
    text-shadow:
      .25em 0 0 rgba(0, 0, 0, 0),
      .5em 0 0 rgba(0, 0, 0, 0);
  }
  40% {
    color: currentColor;
    text-shadow:
      .25em 0 0 rgba(0, 0, 0, 0),
      .5em 0 0 rgba(0, 0, 0, 0);
  }
  60% {
    text-shadow:
      .25em 0 0 currentColor,
      .5em 0 0 rgba(0, 0, 0, 0);
  }
  80%, 100% {
    text-shadow:
      .25em 0 0 currentColor,
      .5em 0 0 currentColor;
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 弹跳动画 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

/* 旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .loading-spinner {
    padding: 1rem;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .loading-spinner {
    color: #f3f4f6;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .loading-spinner {
    border: 2px solid currentColor;
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .animate-spin,
  .animate-pulse,
  .animate-bounce {
    animation: none;
  }
}
</style>
