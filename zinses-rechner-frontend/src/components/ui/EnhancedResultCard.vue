<!--
  增强结果卡片组件
  提供动画效果、数据可视化和用户友好的解释
-->

<template>
  <div 
    class="enhanced-result-card"
    :class="cardClasses"
    @click="handleClick"
  >
    <!-- 卡片头部 -->
    <div class="card-header">
      <!-- 图标 -->
      <div v-if="icon || $slots.icon" class="card-icon" :class="iconClasses">
        <slot name="icon">
          <svg v-if="icon" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path v-if="icon === 'currency-euro'" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10.4 6c.8 0 1.6.4 1.6 1.2 0 .8-.8 1.2-1.6 1.2h-.64v1.6h.64c.8 0 1.6.4 1.6 1.2 0 .8-.8 1.2-1.6 1.2-.704 0-1.192-.193-1.664-.979L7.6 12.8c.8 1.6 2.4 2.4 4 2.4 2.4 0 4-1.6 4-3.6 0-1.2-.8-2.4-2-2.8 1.2-.4 2-1.6 2-2.8 0-2-1.6-3.6-4-3.6-1.6 0-3.2.8-4 2.4l1.136 1.179z"/>
            <path v-else-if="icon === 'chart-bar'" d="M3 3v10a2 2 0 002 2h10a2 2 0 002-2V3a2 2 0 00-2-2H5a2 2 0 00-2 2zm12 1v8l-4-4-4 4V4h8z"/>
            <path v-else-if="icon === 'trending-up'" d="M13 7H7v6h6V7z"/>
            <path v-else-if="icon === 'clock'" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z"/>
          </svg>
        </slot>
      </div>
      
      <!-- 标题和描述 -->
      <div class="card-title-section">
        <h3 class="card-title">{{ title }}</h3>
        <p v-if="description" class="card-description">{{ description }}</p>
      </div>
      
      <!-- 操作按钮 -->
      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions" />
      </div>
    </div>
    
    <!-- 主要值显示 -->
    <div class="card-value-section">
      <AnimatedCounter
        :value="value"
        :format="format"
        :currency="currency"
        :duration="animationDuration"
        :delay="animationDelay"
        :size="valueSize"
        :color="valueColor"
        :weight="valueWeight"
        :animated="animated"
        :trigger-on-visible="triggerOnVisible"
        class="card-main-value"
      />
      
      <!-- 变化指示器 -->
      <div v-if="showChange && change !== undefined" class="change-indicator" :class="changeClasses">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path v-if="change > 0" fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          <path v-else-if="change < 0" fill-rule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          <path v-else fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="change-text">
          {{ formatChange(change) }}
        </span>
      </div>
    </div>
    
    <!-- 次要信息 -->
    <div v-if="secondaryInfo && secondaryInfo.length > 0" class="card-secondary-info">
      <div
        v-for="(info, index) in secondaryInfo"
        :key="index"
        class="secondary-item"
      >
        <span class="secondary-label">{{ info.label }}</span>
        <AnimatedCounter
          :value="info.value"
          :format="info.format || 'number'"
          :currency="info.currency || currency"
          :duration="animationDuration + index * 200"
          :delay="animationDelay + index * 100"
          size="sm"
          color="default"
          weight="medium"
          :animated="animated"
          :trigger-on-visible="triggerOnVisible"
          class="secondary-value"
        />
      </div>
    </div>
    
    <!-- 进度条 -->
    <div v-if="showProgress && progressValue !== undefined" class="card-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :class="progressClasses"
          :style="{ width: `${Math.min(progressValue, 100)}%` }"
        ></div>
      </div>
      <div class="progress-labels">
        <span class="progress-current">{{ progressLabel || `${Math.round(progressValue)}%` }}</span>
        <span v-if="progressTarget" class="progress-target">Ziel: {{ progressTarget }}</span>
      </div>
    </div>
    
    <!-- 底部内容 -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
    
    <!-- 工具提示 -->
    <div v-if="tooltip" class="card-tooltip" :class="{ 'show-tooltip': showTooltip }">
      {{ tooltip }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import AnimatedCounter from './AnimatedCounter.vue'

interface SecondaryInfo {
  label: string
  value: number
  format?: 'currency' | 'percentage' | 'number'
  currency?: string
}

interface Props {
  // 基本信息
  title: string
  description?: string
  value: number
  
  // 格式化
  format?: 'currency' | 'percentage' | 'number'
  currency?: string
  
  // 变化指示
  change?: number
  showChange?: boolean
  
  // 次要信息
  secondaryInfo?: SecondaryInfo[]
  
  // 进度条
  showProgress?: boolean
  progressValue?: number
  progressLabel?: string
  progressTarget?: string
  
  // 样式
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  
  // 动画
  animated?: boolean
  animationDuration?: number
  animationDelay?: number
  triggerOnVisible?: boolean
  
  // 交互
  clickable?: boolean
  tooltip?: string
  
  // 值显示样式
  valueSize?: 'sm' | 'md' | 'lg' | 'xl'
  valueColor?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  valueWeight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  currency: 'EUR',
  showChange: false,
  variant: 'default',
  size: 'md',
  animated: true,
  animationDuration: 1500,
  animationDelay: 0,
  triggerOnVisible: true,
  clickable: false,
  valueSize: 'lg',
  valueColor: 'primary',
  valueWeight: 'bold'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const { isMobile } = useResponsive()
const showTooltip = ref(false)

// 样式类
const cardClasses = computed(() => [
  'enhanced-result-card',
  `variant-${props.variant}`,
  `size-${props.size}`,
  {
    'is-clickable': props.clickable,
    'is-mobile': isMobile.value,
    'has-tooltip': props.tooltip
  }
])

const iconClasses = computed(() => [
  'card-icon',
  `variant-${props.variant}`
])

const changeClasses = computed(() => {
  if (props.change === undefined) return []
  
  return [
    'change-indicator',
    {
      'positive': props.change > 0,
      'negative': props.change < 0,
      'neutral': props.change === 0
    }
  ]
})

const progressClasses = computed(() => [
  'progress-fill',
  `variant-${props.variant}`
])

// 格式化变化值
const formatChange = (change: number): string => {
  const abs = Math.abs(change)
  const sign = change > 0 ? '+' : change < 0 ? '-' : ''
  
  if (props.format === 'currency') {
    return `${sign}${new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: props.currency
    }).format(abs)}`
  } else if (props.format === 'percentage') {
    return `${sign}${abs.toFixed(1)}%`
  } else {
    return `${sign}${abs.toLocaleString('de-DE')}`
  }
}

// 事件处理
const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.enhanced-result-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
         p-6 transition-all duration-300 hover:shadow-md;
}

.is-clickable {
  @apply cursor-pointer hover:scale-105 active:scale-95;
}

.card-header {
  @apply flex items-start justify-between mb-4;
}

.card-icon {
  @apply flex-shrink-0 p-2 rounded-lg mr-3;
}

.card-icon.variant-default {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400;
}

.card-icon.variant-primary {
  @apply bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400;
}

.card-icon.variant-success {
  @apply bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400;
}

.card-icon.variant-warning {
  @apply bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400;
}

.card-icon.variant-error {
  @apply bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400;
}

.card-title-section {
  @apply flex-1;
}

.card-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-1;
}

.card-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.card-value-section {
  @apply flex items-center justify-between mb-4;
}

.card-main-value {
  @apply flex-1;
}

.change-indicator {
  @apply flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium;
}

.change-indicator.positive {
  @apply bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400;
}

.change-indicator.negative {
  @apply bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400;
}

.change-indicator.neutral {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400;
}

.card-secondary-info {
  @apply grid grid-cols-2 gap-4 mb-4;
}

.secondary-item {
  @apply flex flex-col;
}

.secondary-label {
  @apply text-xs text-gray-500 dark:text-gray-400 mb-1;
}

.secondary-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.card-progress {
  @apply mb-4;
}

.progress-bar {
  @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2;
}

.progress-fill {
  @apply h-full rounded-full transition-all duration-1000 ease-out;
}

.progress-fill.variant-default {
  @apply bg-gray-400;
}

.progress-fill.variant-primary {
  @apply bg-blue-500;
}

.progress-fill.variant-success {
  @apply bg-green-500;
}

.progress-fill.variant-warning {
  @apply bg-yellow-500;
}

.progress-fill.variant-error {
  @apply bg-red-500;
}

.progress-labels {
  @apply flex justify-between text-xs text-gray-500 dark:text-gray-400;
}

.card-footer {
  @apply pt-4 border-t border-gray-200 dark:border-gray-700;
}

.card-tooltip {
  @apply absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
         bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2
         opacity-0 pointer-events-none transition-opacity duration-200 z-10;
}

.show-tooltip {
  @apply opacity-100;
}

/* 尺寸变体 */
.size-sm {
  @apply p-4;
}

.size-sm .card-title {
  @apply text-base;
}

.size-lg {
  @apply p-8;
}

.size-lg .card-title {
  @apply text-xl;
}

/* 变体样式 */
.variant-primary {
  @apply border-blue-200 dark:border-blue-800;
}

.variant-success {
  @apply border-green-200 dark:border-green-800;
}

.variant-warning {
  @apply border-yellow-200 dark:border-yellow-800;
}

.variant-error {
  @apply border-red-200 dark:border-red-800;
}

/* 移动端优化 */
.is-mobile .card-secondary-info {
  @apply grid-cols-1 gap-2;
}

.is-mobile .card-header {
  @apply flex-col items-start space-y-2;
}

.is-mobile .card-value-section {
  @apply flex-col items-start space-y-2;
}

/* 悬停效果 */
.enhanced-result-card:hover .card-tooltip {
  @apply opacity-100;
}
</style>
