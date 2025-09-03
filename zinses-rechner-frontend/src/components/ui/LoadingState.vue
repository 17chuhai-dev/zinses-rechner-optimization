<template>
  <div v-if="isLoading" class="loading-state">
    <!-- 全屏加载遮罩 -->
    <div
      v-if="overlay"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="handleOverlayClick"
    >
      <div class="loading-content bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4">
        <LoadingContent />
      </div>
    </div>

    <!-- 内联加载状态 -->
    <div v-else :class="containerClasses">
      <LoadingContent />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'

interface Props {
  isLoading: boolean
  message?: string
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  size?: 'sm' | 'md' | 'lg'
  overlay?: boolean
  dismissible?: boolean
  showProgress?: boolean
  progress?: number
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Wird geladen...',
  type: 'spinner',
  size: 'md',
  overlay: false,
  dismissible: false,
  showProgress: false,
  progress: 0
})

const emit = defineEmits<{
  'dismiss': []
}>()

// 计算属性
const containerClasses = computed(() => [
  'loading-container flex flex-col items-center justify-center p-6',
  {
    'min-h-32': props.size === 'sm',
    'min-h-48': props.size === 'md',
    'min-h-64': props.size === 'lg'
  }
])

// 方法
const handleOverlayClick = () => {
  if (props.dismissible) {
    emit('dismiss')
  }
}

// 加载内容组件
const LoadingContent = () => h('div', { class: 'text-center' }, [
  // 加载指示器
  h('div', { class: 'mb-4' }, [
    props.type === 'spinner' && h(SpinnerLoader),
    props.type === 'dots' && h(DotsLoader),
    props.type === 'pulse' && h(PulseLoader),
    props.type === 'skeleton' && h(SkeletonLoader)
  ].filter(Boolean)),

  // 加载消息
  props.message && h('p', {
    class: 'text-gray-600 text-sm font-medium mb-2'
  }, props.message),

  // 进度条
  props.showProgress && h('div', { class: 'w-full bg-gray-200 rounded-full h-2 mb-2' }, [
    h('div', {
      class: 'bg-blue-600 h-2 rounded-full transition-all duration-300',
      style: { width: `${Math.min(100, Math.max(0, props.progress))}%` }
    })
  ]),

  // 取消按钮
  props.dismissible && h('button', {
    class: 'text-sm text-gray-500 hover:text-gray-700 mt-2',
    onClick: () => emit('dismiss')
  }, 'Abbrechen')
].filter(Boolean))

// 旋转加载器
const SpinnerLoader = () => h('div', { class: `spinner ${props.size}` }, [
  h('div', { class: 'spinner-circle' })
])

// 点状加载器
const DotsLoader = () => h('div', { class: `dots-loader ${props.size}` }, [
  h('div', { class: 'dot' }),
  h('div', { class: 'dot' }),
  h('div', { class: 'dot' })
])

// 脉冲加载器
const PulseLoader = () => h('div', { class: `pulse-loader ${props.size}` }, [
  h('div', { class: 'pulse-circle' })
])

// 骨架加载器
const SkeletonLoader = () => h('div', { class: 'skeleton-loader' }, [
  h('div', { class: 'skeleton-line skeleton-line-long' }),
  h('div', { class: 'skeleton-line skeleton-line-medium' }),
  h('div', { class: 'skeleton-line skeleton-line-short' })
])
</script>

<style scoped>
/* 旋转加载器 */
.spinner {
  @apply inline-block;
}

.spinner.sm .spinner-circle {
  @apply w-4 h-4 border-2;
}

.spinner.md .spinner-circle {
  @apply w-8 h-8 border-2;
}

.spinner.lg .spinner-circle {
  @apply w-12 h-12 border-4;
}

.spinner-circle {
  @apply border-blue-600 border-t-transparent rounded-full animate-spin;
}

/* 点状加载器 */
.dots-loader {
  @apply flex space-x-1;
}

.dots-loader.sm .dot {
  @apply w-2 h-2;
}

.dots-loader.md .dot {
  @apply w-3 h-3;
}

.dots-loader.lg .dot {
  @apply w-4 h-4;
}

.dot {
  @apply bg-blue-600 rounded-full animate-pulse;
  animation-delay: calc(var(--i, 0) * 0.2s);
}

.dot:nth-child(1) { --i: 0; }
.dot:nth-child(2) { --i: 1; }
.dot:nth-child(3) { --i: 2; }

/* 脉冲加载器 */
.pulse-loader {
  @apply relative;
}

.pulse-loader.sm .pulse-circle {
  @apply w-8 h-8;
}

.pulse-loader.md .pulse-circle {
  @apply w-12 h-12;
}

.pulse-loader.lg .pulse-circle {
  @apply w-16 h-16;
}

.pulse-circle {
  @apply bg-blue-600 rounded-full opacity-75;
  animation: pulse-animation 1.5s ease-in-out infinite;
}

@keyframes pulse-animation {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
}

/* 骨架加载器 */
.skeleton-loader {
  @apply space-y-3 w-full max-w-sm;
}

.skeleton-line {
  @apply h-4 bg-gray-300 rounded animate-pulse;
}

.skeleton-line-long {
  @apply w-full;
}

.skeleton-line-medium {
  @apply w-3/4;
}

.skeleton-line-short {
  @apply w-1/2;
}

/* 加载容器动画 */
.loading-container {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 遮罩动画 */
.loading-content {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
