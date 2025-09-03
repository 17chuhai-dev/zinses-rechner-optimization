<!--
  动画过渡系统
  实现结果更新的平滑动画过渡效果，包括数值滚动动画、颜色渐变和布局变化动画
-->

<template>
  <div class="animation-transition" :class="animationClasses">
    <!-- 数值滚动动画容器 -->
    <div v-if="type === 'number'" class="number-animation">
      <span 
        ref="numberElement"
        class="animated-number"
        :class="{ 'number-changing': isAnimating }"
      >
        {{ displayValue }}
      </span>
      <span v-if="suffix" class="number-suffix">{{ suffix }}</span>
    </div>

    <!-- 内容过渡动画容器 -->
    <Transition
      v-else-if="type === 'content'"
      :name="transitionName"
      :mode="transitionMode"
      :duration="transitionDuration"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div :key="contentKey" class="transition-content">
        <slot />
      </div>
    </Transition>

    <!-- 颜色过渡动画容器 -->
    <div
      v-else-if="type === 'color'"
      class="color-animation"
      :style="colorStyles"
    >
      <slot />
    </div>

    <!-- 布局变化动画容器 -->
    <div
      v-else-if="type === 'layout'"
      class="layout-animation"
      :style="layoutStyles"
    >
      <slot />
    </div>

    <!-- 默认容器 -->
    <div v-else class="default-animation">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { formatGermanCurrency, formatGermanNumber } from '@/utils/germanFormatters'

// 类型定义
type AnimationType = 'number' | 'content' | 'color' | 'layout'
type TransitionName = 'fade' | 'slide' | 'scale' | 'flip' | 'bounce'
type TransitionMode = 'out-in' | 'in-out' | undefined
type EasingFunction = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'

// Props定义
interface Props {
  type: AnimationType
  value?: number | string
  previousValue?: number | string
  transitionName?: TransitionName
  transitionMode?: TransitionMode
  transitionDuration?: number | { enter: number; leave: number }
  easingFunction?: EasingFunction
  animationDelay?: number
  contentKey?: string | number
  suffix?: string
  formatType?: 'currency' | 'number' | 'percentage' | 'none'
  colorFrom?: string
  colorTo?: string
  layoutFrom?: Record<string, string>
  layoutTo?: Record<string, string>
  autoAnimate?: boolean
  animationSpeed?: 'slow' | 'normal' | 'fast'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'content',
  transitionName: 'fade',
  transitionMode: 'out-in',
  transitionDuration: 300,
  easingFunction: 'ease-out',
  animationDelay: 0,
  formatType: 'none',
  autoAnimate: true,
  animationSpeed: 'normal'
})

// Emits定义
interface Emits {
  animationStart: []
  animationEnd: []
  beforeEnter: [el: Element]
  enter: [el: Element]
  afterEnter: [el: Element]
  beforeLeave: [el: Element]
  leave: [el: Element]
  afterLeave: [el: Element]
}

const emit = defineEmits<Emits>()

// 响应式数据
const numberElement = ref<HTMLElement>()
const displayValue = ref<string>('')
const isAnimating = ref(false)
const currentColorValue = ref(0)
const animationFrame = ref<number>()

// 计算属性
const animationClasses = computed(() => {
  const classes = [`animation-${props.type}`, `speed-${props.animationSpeed}`]
  
  if (isAnimating.value) {
    classes.push('is-animating')
  }
  
  return classes
})

const colorStyles = computed(() => {
  if (props.type !== 'color' || !props.colorFrom || !props.colorTo) {
    return {}
  }
  
  const progress = currentColorValue.value
  const fromColor = hexToRgb(props.colorFrom)
  const toColor = hexToRgb(props.colorTo)
  
  if (!fromColor || !toColor) return {}
  
  const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * progress)
  const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * progress)
  const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * progress)
  
  return {
    color: `rgb(${r}, ${g}, ${b})`,
    transition: `color ${props.transitionDuration}ms ${props.easingFunction}`
  }
})

const layoutStyles = computed(() => {
  if (props.type !== 'layout' || !props.layoutFrom || !props.layoutTo) {
    return {}
  }
  
  const styles: Record<string, string> = {}
  const duration = typeof props.transitionDuration === 'number' 
    ? props.transitionDuration 
    : props.transitionDuration.enter
  
  Object.keys(props.layoutTo).forEach(property => {
    styles[property] = props.layoutTo![property]
    styles.transition = `${property} ${duration}ms ${props.easingFunction}`
  })
  
  return styles
})

// 方法
const formatValue = (value: number | string): string => {
  if (typeof value === 'string') return value
  
  switch (props.formatType) {
    case 'currency':
      return formatGermanCurrency(value)
    case 'number':
      return formatGermanNumber(value)
    case 'percentage':
      return `${formatGermanNumber(value)}%`
    default:
      return String(value)
  }
}

const animateNumber = (from: number, to: number, duration: number = 800) => {
  if (!props.autoAnimate) {
    displayValue.value = formatValue(to)
    return
  }
  
  isAnimating.value = true
  emit('animationStart')
  
  const startTime = Date.now()
  const difference = to - from
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 应用缓动函数
    const easedProgress = applyEasing(progress, props.easingFunction)
    const currentValue = from + (difference * easedProgress)
    
    displayValue.value = formatValue(currentValue)
    
    if (progress < 1) {
      animationFrame.value = requestAnimationFrame(animate)
    } else {
      isAnimating.value = false
      emit('animationEnd')
    }
  }
  
  setTimeout(() => {
    animate()
  }, props.animationDelay)
}

const animateColor = (duration: number = 300) => {
  if (!props.autoAnimate) {
    currentColorValue.value = 1
    return
  }
  
  isAnimating.value = true
  emit('animationStart')
  
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    currentColorValue.value = applyEasing(progress, props.easingFunction)
    
    if (progress < 1) {
      animationFrame.value = requestAnimationFrame(animate)
    } else {
      isAnimating.value = false
      emit('animationEnd')
    }
  }
  
  setTimeout(() => {
    animate()
  }, props.animationDelay)
}

const applyEasing = (progress: number, easing: EasingFunction): number => {
  switch (easing) {
    case 'linear':
      return progress
    case 'ease-in':
      return progress * progress
    case 'ease-out':
      return 1 - Math.pow(1 - progress, 2)
    case 'ease-in-out':
      return progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
    case 'bounce':
      return bounce(progress)
    case 'elastic':
      return elastic(progress)
    default:
      return progress
  }
}

const bounce = (t: number): number => {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t
  } else if (t < 2 / 2.75) {
    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
  } else if (t < 2.5 / 2.75) {
    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
  } else {
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
  }
}

const elastic = (t: number): number => {
  if (t === 0) return 0
  if (t === 1) return 1
  
  const p = 0.3
  const s = p / 4
  
  return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// 过渡事件处理
const onBeforeEnter = (el: Element) => {
  emit('beforeEnter', el)
}

const onEnter = (el: Element) => {
  emit('enter', el)
}

const onAfterEnter = (el: Element) => {
  emit('afterEnter', el)
}

const onBeforeLeave = (el: Element) => {
  emit('beforeLeave', el)
}

const onLeave = (el: Element) => {
  emit('leave', el)
}

const onAfterLeave = (el: Element) => {
  emit('afterLeave', el)
}

// 监听器
watch(() => props.value, (newValue, oldValue) => {
  if (props.type === 'number' && typeof newValue === 'number' && typeof oldValue === 'number') {
    const duration = props.animationSpeed === 'fast' ? 400 : props.animationSpeed === 'slow' ? 1200 : 800
    animateNumber(oldValue, newValue, duration)
  } else if (props.type === 'color') {
    const duration = typeof props.transitionDuration === 'number' 
      ? props.transitionDuration 
      : props.transitionDuration.enter
    animateColor(duration)
  } else {
    displayValue.value = formatValue(newValue || '')
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (props.type === 'number' && props.value !== undefined) {
    displayValue.value = formatValue(props.value)
  }
})

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }
})
</script>

<style scoped>
.animation-transition {
  position: relative;
  overflow: hidden;
}

/* 数值动画样式 */
.number-animation {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
}

.animated-number {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  transition: transform 0.2s ease;
}

.number-changing {
  transform: scale(1.05);
  color: #3b82f6;
  font-weight: 600;
}

.number-suffix {
  @apply text-gray-600;
}

/* 内容过渡样式 */
.transition-content {
  width: 100%;
}

/* 颜色动画样式 */
.color-animation {
  transition: color 0.3s ease;
}

/* 布局动画样式 */
.layout-animation {
  transition: all 0.3s ease;
}

/* 速度类 */
.speed-slow .animated-number {
  transition-duration: 1.2s;
}

.speed-normal .animated-number {
  transition-duration: 0.8s;
}

.speed-fast .animated-number {
  transition-duration: 0.4s;
}

/* 过渡动画定义 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.8);
  opacity: 0;
}

.flip-enter-active,
.flip-leave-active {
  transition: all 0.6s ease;
}

.flip-enter-from {
  transform: rotateY(90deg);
  opacity: 0;
}

.flip-leave-to {
  transform: rotateY(-90deg);
  opacity: 0;
}

.bounce-enter-active {
  animation: bounce-in 0.6s ease;
}

.bounce-leave-active {
  animation: bounce-out 0.3s ease;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

/* 动画状态指示 */
.is-animating {
  position: relative;
}

.is-animating::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  animation: shimmer 1.5s infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .number-animation {
    gap: 0.125rem;
  }
  
  .animated-number {
    font-size: 0.9em;
  }
}

/* 减少动画的用户偏好 */
@media (prefers-reduced-motion: reduce) {
  .animated-number,
  .color-animation,
  .layout-animation,
  .fade-enter-active,
  .fade-leave-active,
  .slide-enter-active,
  .slide-leave-active,
  .scale-enter-active,
  .scale-leave-active,
  .flip-enter-active,
  .flip-leave-active {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
  
  .is-animating::after {
    display: none;
  }
}
</style>
