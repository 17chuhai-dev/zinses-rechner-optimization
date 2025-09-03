<!--
  动画计数器组件
  提供数字动画效果，增强结果展示的视觉体验
-->

<template>
  <span
    ref="counterRef"
    class="animated-counter"
    :class="counterClasses"
  >
    {{ displayValue }}
  </span>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useResponsive } from '@/composables/useResponsive'

interface Props {
  // 目标值
  value: number

  // 动画持续时间（毫秒）
  duration?: number

  // 动画延迟（毫秒）
  delay?: number

  // 格式化选项
  format?: 'currency' | 'percentage' | 'number'
  currency?: string
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number

  // 动画缓动函数
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

  // 是否启用动画
  animated?: boolean

  // 前缀和后缀
  prefix?: string
  suffix?: string

  // 样式
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'

  // 是否在视口中时才开始动画
  triggerOnVisible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 1500,
  delay: 0,
  format: 'number',
  currency: 'EUR',
  locale: 'de-DE',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  easing: 'ease-out',
  animated: true,
  size: 'md',
  color: 'default',
  weight: 'medium',
  triggerOnVisible: true
})

const { prefersReducedMotion } = useResponsive()

// 组件引用
const counterRef = ref<HTMLElement>()

// 当前显示值
const currentValue = ref(0)
const isAnimating = ref(false)
const hasStarted = ref(false)

// 动画控制
let animationId: number | null = null
let startTime: number | null = null

// 缓动函数
const easingFunctions = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// 格式化显示值
const displayValue = computed(() => {
  const value = currentValue.value
  let formatted = ''

  switch (props.format) {
    case 'currency':
      formatted = new Intl.NumberFormat(props.locale, {
        style: 'currency',
        currency: props.currency,
        minimumFractionDigits: props.minimumFractionDigits,
        maximumFractionDigits: props.maximumFractionDigits
      }).format(value)
      break

    case 'percentage':
      formatted = new Intl.NumberFormat(props.locale, {
        style: 'percent',
        minimumFractionDigits: props.minimumFractionDigits,
        maximumFractionDigits: props.maximumFractionDigits
      }).format(value / 100)
      break

    case 'number':
    default:
      formatted = new Intl.NumberFormat(props.locale, {
        minimumFractionDigits: props.minimumFractionDigits,
        maximumFractionDigits: props.maximumFractionDigits
      }).format(value)
      break
  }

  return `${props.prefix || ''}${formatted}${props.suffix || ''}`
})

// 样式类
const counterClasses = computed(() => [
  'animated-counter',
  `size-${props.size}`,
  `color-${props.color}`,
  `weight-${props.weight}`,
  {
    'is-animating': isAnimating.value,
    'reduced-motion': prefersReducedMotion.value
  }
])

// 动画函数
const animate = (timestamp: number) => {
  if (!startTime) startTime = timestamp

  const elapsed = timestamp - startTime
  const progress = Math.min(elapsed / props.duration, 1)

  // 应用缓动函数
  const easedProgress = easingFunctions[props.easing](progress)

  // 计算当前值
  currentValue.value = props.value * easedProgress

  if (progress < 1) {
    animationId = requestAnimationFrame(animate)
  } else {
    // 动画完成
    currentValue.value = props.value
    isAnimating.value = false
    startTime = null
  }
}

// 开始动画
const startAnimation = () => {
  if (!props.animated || prefersReducedMotion.value) {
    currentValue.value = props.value
    return
  }

  if (hasStarted.value) return
  hasStarted.value = true

  // 停止之前的动画
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  isAnimating.value = true
  startTime = null

  // 延迟开始动画
  setTimeout(() => {
    animationId = requestAnimationFrame(animate)
  }, props.delay)
}

// 重置动画
const resetAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  currentValue.value = 0
  isAnimating.value = false
  hasStarted.value = false
  startTime = null
}

// 交集观察器（用于视口触发）
let intersectionObserver: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
  if (!props.triggerOnVisible || !counterRef.value) return

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasStarted.value) {
          startAnimation()
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '50px'
    }
  )

  intersectionObserver.observe(counterRef.value)
}

// 监听值变化
watch(() => props.value, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    resetAnimation()

    if (props.triggerOnVisible) {
      // 重新设置观察器
      if (intersectionObserver) {
        intersectionObserver.disconnect()
        setupIntersectionObserver()
      }
    } else {
      startAnimation()
    }
  }
})

// 组件挂载
onMounted(() => {
  if (props.triggerOnVisible) {
    setupIntersectionObserver()
  } else {
    startAnimation()
  }
})

// 组件卸载时清理
onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
})

// 暴露方法
defineExpose({
  startAnimation,
  resetAnimation
})
</script>

<style scoped>
.animated-counter {
  @apply inline-block transition-all duration-300;
  font-variant-numeric: tabular-nums;
}

/* 尺寸样式 */
.size-sm {
  @apply text-sm;
}

.size-md {
  @apply text-base;
}

.size-lg {
  @apply text-lg;
}

.size-xl {
  @apply text-xl;
}

/* 颜色样式 */
.color-default {
  @apply text-gray-900 dark:text-white;
}

.color-primary {
  @apply text-blue-600 dark:text-blue-400;
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

/* 字重样式 */
.weight-normal {
  @apply font-normal;
}

.weight-medium {
  @apply font-medium;
}

.weight-semibold {
  @apply font-semibold;
}

.weight-bold {
  @apply font-bold;
}

/* 动画状态 */
.is-animating {
  @apply transform;
}

/* 减少动画偏好 */
.reduced-motion {
  @apply transition-none;
}

.reduced-motion.is-animating {
  @apply transform-none;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .size-xl {
    @apply text-lg;
  }

  .size-lg {
    @apply text-base;
  }
}
</style>
