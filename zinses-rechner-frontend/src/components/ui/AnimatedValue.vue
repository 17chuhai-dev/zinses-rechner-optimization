<!--
  动画数值组件
  提供平滑的数值变化动画，支持多种动画效果和格式化选项
-->

<template>
  <span 
    class="animated-value" 
    :class="valueClasses"
    :style="valueStyles"
  >
    {{ displayValue }}
  </span>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters'

// Props定义
interface Props {
  value: number
  format?: 'currency' | 'number' | 'percentage' | 'integer' | 'custom'
  duration?: number // 动画持续时间（毫秒）
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'
  precision?: number // 小数位数
  prefix?: string
  suffix?: string
  separator?: string // 千位分隔符
  decimalSeparator?: string // 小数分隔符
  animateOnMount?: boolean
  highlightChange?: boolean
  highlightDuration?: number
  customFormatter?: (value: number) => string
  minValue?: number
  maxValue?: number
  step?: number
  showSign?: boolean // 显示正负号
  colorByValue?: boolean // 根据数值变化颜色
  size?: 'small' | 'medium' | 'large' | 'xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  duration: 1000,
  easing: 'ease-out',
  precision: 2,
  separator: '.',
  decimalSeparator: ',',
  animateOnMount: true,
  highlightChange: true,
  highlightDuration: 2000,
  showSign: false,
  colorByValue: false,
  size: 'medium',
  weight: 'normal'
})

// Emits定义
interface Emits {
  animationStart: []
  animationEnd: []
  valueChange: [oldValue: number, newValue: number]
}

const emit = defineEmits<Emits>()

// 响应式数据
const currentValue = ref(props.animateOnMount ? 0 : props.value)
const isAnimating = ref(false)
const isHighlighted = ref(false)
const animationFrame = ref<number>()
const highlightTimer = ref<NodeJS.Timeout>()

// 计算属性
const displayValue = computed(() => {
  const value = currentValue.value
  
  // 应用最小值和最大值限制
  const clampedValue = Math.max(
    props.minValue ?? -Infinity,
    Math.min(props.maxValue ?? Infinity, value)
  )
  
  // 自定义格式化器
  if (props.customFormatter) {
    return props.customFormatter(clampedValue)
  }
  
  // 内置格式化
  let formatted = ''
  
  switch (props.format) {
    case 'currency':
      formatted = formatCurrency(clampedValue)
      break
    case 'percentage':
      formatted = formatPercentage(clampedValue, props.precision)
      break
    case 'integer':
      formatted = formatNumber(Math.round(clampedValue), 0)
      break
    case 'number':
      formatted = formatNumber(clampedValue, props.precision)
      break
    case 'custom':
      formatted = clampedValue.toFixed(props.precision)
      break
    default:
      formatted = clampedValue.toString()
  }
  
  // 添加前缀和后缀
  if (props.prefix) formatted = props.prefix + formatted
  if (props.suffix) formatted = formatted + props.suffix
  
  // 添加正负号
  if (props.showSign && clampedValue > 0) {
    formatted = '+' + formatted
  }
  
  return formatted
})

const valueClasses = computed(() => ({
  'animated-value-animating': isAnimating.value,
  'animated-value-highlighted': isHighlighted.value,
  'animated-value-positive': props.colorByValue && currentValue.value > 0,
  'animated-value-negative': props.colorByValue && currentValue.value < 0,
  'animated-value-zero': props.colorByValue && currentValue.value === 0,
  [`animated-value-${props.size}`]: true,
  [`animated-value-${props.weight}`]: true
}))

const valueStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  // 根据动画类型设置过渡
  if (isAnimating.value) {
    const easingMap = {
      linear: 'linear',
      ease: 'ease',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
    
    styles.transition = `all ${props.duration}ms ${easingMap[props.easing]}`
  }
  
  return styles
})

// 方法
const animateToValue = (targetValue: number) => {
  if (currentValue.value === targetValue) return
  
  const startValue = currentValue.value
  const difference = targetValue - startValue
  const startTime = performance.now()
  
  isAnimating.value = true
  emit('animationStart')
  emit('valueChange', startValue, targetValue)
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    
    // 应用缓动函数
    const easedProgress = applyEasing(progress, props.easing)
    
    // 计算当前值
    const newValue = startValue + (difference * easedProgress)
    
    // 应用步长
    if (props.step) {
      currentValue.value = Math.round(newValue / props.step) * props.step
    } else {
      currentValue.value = newValue
    }
    
    if (progress < 1) {
      animationFrame.value = requestAnimationFrame(animate)
    } else {
      currentValue.value = targetValue
      isAnimating.value = false
      emit('animationEnd')
      
      // 触发高亮效果
      if (props.highlightChange) {
        triggerHighlight()
      }
    }
  }
  
  animationFrame.value = requestAnimationFrame(animate)
}

const applyEasing = (t: number, easing: string): number => {
  switch (easing) {
    case 'linear':
      return t
    case 'ease-in':
      return t * t
    case 'ease-out':
      return 1 - Math.pow(1 - t, 2)
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    case 'bounce':
      if (t < 1 / 2.75) {
        return 7.5625 * t * t
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
      }
    case 'elastic':
      const c4 = (2 * Math.PI) / 3
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
    default:
      return t
  }
}

const triggerHighlight = () => {
  isHighlighted.value = true
  
  if (highlightTimer.value) {
    clearTimeout(highlightTimer.value)
  }
  
  highlightTimer.value = setTimeout(() => {
    isHighlighted.value = false
  }, props.highlightDuration)
}

const stopAnimation = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
    animationFrame.value = undefined
  }
  isAnimating.value = false
}

// 监听器
watch(() => props.value, (newValue) => {
  animateToValue(newValue)
})

// 生命周期
onMounted(() => {
  if (props.animateOnMount) {
    // 延迟一帧以确保组件已渲染
    requestAnimationFrame(() => {
      animateToValue(props.value)
    })
  } else {
    currentValue.value = props.value
  }
})

onUnmounted(() => {
  stopAnimation()
  if (highlightTimer.value) {
    clearTimeout(highlightTimer.value)
  }
})

// 暴露方法
defineExpose({
  animateToValue,
  stopAnimation,
  triggerHighlight
})
</script>

<style scoped>
.animated-value {
  @apply inline-block transition-colors;
}

/* 尺寸变体 */
.animated-value-small {
  @apply text-sm;
}

.animated-value-medium {
  @apply text-base;
}

.animated-value-large {
  @apply text-lg;
}

.animated-value-xl {
  @apply text-xl;
}

/* 字重变体 */
.animated-value-normal {
  @apply font-normal;
}

.animated-value-medium {
  @apply font-medium;
}

.animated-value-semibold {
  @apply font-semibold;
}

.animated-value-bold {
  @apply font-bold;
}

/* 动画状态 */
.animated-value-animating {
  @apply transform;
}

/* 高亮效果 */
.animated-value-highlighted {
  @apply bg-yellow-100 text-yellow-800 px-1 rounded;
  animation: highlight-pulse 0.5s ease-out;
}

/* 颜色变体 */
.animated-value-positive {
  @apply text-green-600;
}

.animated-value-negative {
  @apply text-red-600;
}

.animated-value-zero {
  @apply text-gray-600;
}

/* 动画定义 */
@keyframes highlight-pulse {
  0% {
    background-color: transparent;
    transform: scale(1);
  }
  50% {
    background-color: rgb(254 240 138); /* yellow-200 */
    transform: scale(1.05);
  }
  100% {
    background-color: rgb(254 249 195); /* yellow-100 */
    transform: scale(1);
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .animated-value-highlighted {
    @apply bg-yellow-900 text-yellow-200;
  }
  
  .animated-value-positive {
    @apply text-green-400;
  }
  
  .animated-value-negative {
    @apply text-red-400;
  }
  
  .animated-value-zero {
    @apply text-gray-400;
  }
  
  @keyframes highlight-pulse {
    0% {
      background-color: transparent;
      transform: scale(1);
    }
    50% {
      background-color: rgb(133 77 14); /* yellow-800 */
      transform: scale(1.05);
    }
    100% {
      background-color: rgb(113 63 18); /* yellow-900 */
      transform: scale(1);
    }
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .animated-value {
    transition: none !important;
  }
  
  .animated-value-highlighted {
    animation: none;
  }
}
</style>
