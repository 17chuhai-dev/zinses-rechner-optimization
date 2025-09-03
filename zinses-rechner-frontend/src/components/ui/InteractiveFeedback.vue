<!--
  交互反馈组件
  提供各种用户交互的视觉和触觉反馈，增强用户体验
-->

<template>
  <div 
    class="interactive-feedback"
    :class="feedbackClasses"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- 波纹效果 -->
    <div v-if="showRipple" class="ripple-container">
      <div
        v-for="ripple in ripples"
        :key="ripple.id"
        class="ripple"
        :style="ripple.style"
        @animationend="removeRipple(ripple.id)"
      ></div>
    </div>

    <!-- 脉冲效果 -->
    <div v-if="showPulse && (isHovered || isFocused)" class="pulse-effect"></div>

    <!-- 发光效果 */
    <div v-if="showGlow && (isHovered || isFocused)" class="glow-effect"></div>

    <!-- 内容插槽 -->
    <div class="feedback-content">
      <slot></slot>
    </div>

    <!-- 工具提示 -->
    <Transition name="tooltip-fade">
      <div v-if="tooltip && showTooltip" class="tooltip" :class="tooltipClasses">
        {{ tooltip }}
        <div class="tooltip-arrow"></div>
      </div>
    </Transition>

    <!-- 状态指示器 -->
    <div v-if="showStatusIndicator" class="status-indicator" :class="statusClasses">
      <Icon v-if="statusIcon" :name="statusIcon" size="12" />
      <div v-else class="status-dot"></div>
    </div>

    <!-- 加载覆盖层 -->
    <Transition name="loading-fade">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import Icon from './BaseIcon.vue'

// Props定义
interface Props {
  // 反馈类型
  feedbackType?: 'button' | 'card' | 'input' | 'custom'
  
  // 视觉效果
  showRipple?: boolean
  showPulse?: boolean
  showGlow?: boolean
  showShadow?: boolean
  
  // 状态
  disabled?: boolean
  loading?: boolean
  active?: boolean
  selected?: boolean
  
  // 工具提示
  tooltip?: string
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  tooltipDelay?: number
  
  // 状态指示器
  showStatusIndicator?: boolean
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  statusIcon?: string
  
  // 动画配置
  animationDuration?: number
  animationEasing?: string
  
  // 触觉反馈
  hapticFeedback?: boolean
  
  // 声音反馈
  soundFeedback?: boolean
  soundType?: 'click' | 'hover' | 'success' | 'error'
  
  // 样式变体
  variant?: 'default' | 'subtle' | 'prominent' | 'minimal'
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  feedbackType: 'button',
  showRipple: true,
  showPulse: false,
  showGlow: false,
  showShadow: true,
  disabled: false,
  loading: false,
  active: false,
  selected: false,
  tooltipPosition: 'top',
  tooltipDelay: 500,
  showStatusIndicator: false,
  status: 'neutral',
  animationDuration: 300,
  animationEasing: 'ease-out',
  hapticFeedback: false,
  soundFeedback: false,
  soundType: 'click',
  variant: 'default',
  size: 'medium'
})

// Emits定义
interface Emits {
  click: [event: MouseEvent]
  hover: [isHovered: boolean]
  focus: [isFocused: boolean]
  touch: [isTouched: boolean]
  statusChange: [status: string]
}

const emit = defineEmits<Emits>()

// 响应式数据
const isHovered = ref(false)
const isFocused = ref(false)
const isTouched = ref(false)
const showTooltip = ref(false)
const tooltipTimer = ref<NodeJS.Timeout>()
const ripples = ref<Array<{ id: number; style: Record<string, string> }>>([])
let rippleId = 0

// 计算属性
const feedbackClasses = computed(() => ({
  [`feedback-${props.feedbackType}`]: true,
  [`feedback-${props.variant}`]: true,
  [`feedback-${props.size}`]: true,
  'feedback-disabled': props.disabled,
  'feedback-loading': props.loading,
  'feedback-active': props.active,
  'feedback-selected': props.selected,
  'feedback-hovered': isHovered.value,
  'feedback-focused': isFocused.value,
  'feedback-touched': isTouched.value,
  'feedback-shadow': props.showShadow,
  'feedback-glow': props.showGlow && (isHovered.value || isFocused.value)
}))

const tooltipClasses = computed(() => ({
  [`tooltip-${props.tooltipPosition}`]: true
}))

const statusClasses = computed(() => ({
  [`status-${props.status}`]: true
}))

// 方法
const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  
  // 创建波纹效果
  if (props.showRipple) {
    createRipple(event)
  }
  
  // 触觉反馈
  if (props.hapticFeedback && 'vibrate' in navigator) {
    navigator.vibrate(50)
  }
  
  // 声音反馈
  if (props.soundFeedback) {
    playSound(props.soundType)
  }
  
  emit('click', event)
}

const handleMouseEnter = () => {
  if (props.disabled) return
  
  isHovered.value = true
  emit('hover', true)
  
  // 显示工具提示
  if (props.tooltip) {
    tooltipTimer.value = setTimeout(() => {
      showTooltip.value = true
    }, props.tooltipDelay)
  }
  
  // 声音反馈
  if (props.soundFeedback && props.soundType === 'hover') {
    playSound('hover')
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
  emit('hover', false)
  
  // 隐藏工具提示
  if (tooltipTimer.value) {
    clearTimeout(tooltipTimer.value)
  }
  showTooltip.value = false
}

const handleFocus = () => {
  if (props.disabled) return
  
  isFocused.value = true
  emit('focus', true)
}

const handleBlur = () => {
  isFocused.value = false
  emit('focus', false)
  
  // 隐藏工具提示
  showTooltip.value = false
}

const handleTouchStart = () => {
  if (props.disabled) return
  
  isTouched.value = true
  emit('touch', true)
}

const handleTouchEnd = () => {
  isTouched.value = false
  emit('touch', false)
}

const createRipple = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  
  const ripple = {
    id: rippleId++,
    style: {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`,
      animationDuration: `${props.animationDuration}ms`,
      animationTimingFunction: props.animationEasing
    }
  }
  
  ripples.value.push(ripple)
}

const removeRipple = (id: number) => {
  const index = ripples.value.findIndex(ripple => ripple.id === id)
  if (index > -1) {
    ripples.value.splice(index, 1)
  }
}

const playSound = (type: string) => {
  // 简单的声音反馈实现
  // 在实际应用中，可以使用Web Audio API或预加载的音频文件
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  // 根据类型设置不同的频率
  switch (type) {
    case 'click':
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      break
    case 'hover':
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
      break
    case 'success':
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
      break
    case 'error':
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
      break
  }
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

// 暴露方法
defineExpose({
  createRipple,
  playSound
})
</script>

<style scoped>
.interactive-feedback {
  @apply relative overflow-hidden transition-all duration-300;
}

/* 反馈类型样式 */
.feedback-button {
  @apply cursor-pointer select-none;
}

.feedback-card {
  @apply cursor-pointer;
}

.feedback-input {
  @apply transition-colors;
}

/* 变体样式 */
.feedback-default {
  @apply hover:bg-gray-50 active:bg-gray-100;
}

.feedback-subtle {
  @apply hover:bg-gray-25 active:bg-gray-50;
}

.feedback-prominent {
  @apply hover:bg-blue-50 active:bg-blue-100 hover:border-blue-300;
}

.feedback-minimal {
  @apply hover:opacity-80 active:opacity-60;
}

/* 尺寸样式 */
.feedback-small {
  @apply text-sm;
}

.feedback-medium {
  @apply text-base;
}

.feedback-large {
  @apply text-lg;
}

/* 状态样式 */
.feedback-disabled {
  @apply opacity-50 cursor-not-allowed pointer-events-none;
}

.feedback-loading {
  @apply cursor-wait;
}

.feedback-active {
  @apply bg-blue-100 border-blue-300;
}

.feedback-selected {
  @apply bg-blue-50 border-blue-200;
}

.feedback-hovered {
  @apply transform scale-105;
}

.feedback-focused {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

.feedback-touched {
  @apply transform scale-95;
}

.feedback-shadow {
  @apply shadow-sm hover:shadow-md active:shadow-lg;
}

.feedback-glow {
  @apply shadow-lg shadow-blue-500/25;
}

/* 波纹效果 */
.ripple-container {
  @apply absolute inset-0 pointer-events-none;
}

.ripple {
  @apply absolute bg-current opacity-25 rounded-full pointer-events-none;
  animation: ripple-expand 0.6s ease-out;
}

/* 脉冲效果 */
.pulse-effect {
  @apply absolute inset-0 bg-current opacity-10 rounded-full;
  animation: pulse-ring 2s ease-out infinite;
}

/* 发光效果 */
.glow-effect {
  @apply absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 rounded-full blur-sm;
}

/* 内容区域 */
.feedback-content {
  @apply relative z-10;
}

/* 工具提示 */
.tooltip {
  @apply absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none;
  @apply whitespace-nowrap;
}

.tooltip-top {
  @apply bottom-full left-1/2 transform -translate-x-1/2 mb-2;
}

.tooltip-bottom {
  @apply top-full left-1/2 transform -translate-x-1/2 mt-2;
}

.tooltip-left {
  @apply right-full top-1/2 transform -translate-y-1/2 mr-2;
}

.tooltip-right {
  @apply left-full top-1/2 transform -translate-y-1/2 ml-2;
}

.tooltip-arrow {
  @apply absolute w-2 h-2 bg-gray-900 transform rotate-45;
}

.tooltip-top .tooltip-arrow {
  @apply top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2;
}

.tooltip-bottom .tooltip-arrow {
  @apply bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2;
}

.tooltip-left .tooltip-arrow {
  @apply left-full top-1/2 transform -translate-x-1/2 -translate-y-1/2;
}

.tooltip-right .tooltip-arrow {
  @apply right-full top-1/2 transform translate-x-1/2 -translate-y-1/2;
}

/* 状态指示器 */
.status-indicator {
  @apply absolute top-0 right-0 w-3 h-3 rounded-full flex items-center justify-center;
  transform: translate(50%, -50%);
}

.status-success {
  @apply bg-green-500 text-white;
}

.status-warning {
  @apply bg-yellow-500 text-white;
}

.status-error {
  @apply bg-red-500 text-white;
}

.status-info {
  @apply bg-blue-500 text-white;
}

.status-neutral {
  @apply bg-gray-500 text-white;
}

.status-dot {
  @apply w-1.5 h-1.5 bg-current rounded-full;
}

/* 加载覆盖层 */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full;
  animation: spin 1s linear infinite;
}

/* 过渡动画 */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

/* 动画定义 */
@keyframes ripple-expand {
  from {
    transform: scale(0);
    opacity: 0.5;
  }
  to {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .feedback-default {
    @apply hover:bg-gray-800 active:bg-gray-700;
  }
  
  .feedback-subtle {
    @apply hover:bg-gray-850 active:bg-gray-800;
  }
  
  .feedback-prominent {
    @apply hover:bg-blue-900 active:bg-blue-800 hover:border-blue-600;
  }
  
  .feedback-active {
    @apply bg-blue-900 border-blue-600;
  }
  
  .feedback-selected {
    @apply bg-blue-950 border-blue-700;
  }
  
  .tooltip {
    @apply bg-gray-800 text-gray-200;
  }
  
  .tooltip-arrow {
    @apply bg-gray-800;
  }
  
  .loading-overlay {
    @apply bg-gray-900 bg-opacity-75;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .interactive-feedback {
    transition: none !important;
  }
  
  .ripple,
  .pulse-effect,
  .loading-spinner {
    animation: none !important;
  }
  
  .feedback-hovered,
  .feedback-touched {
    transform: none !important;
  }
}
</style>
