<!--
  骨架屏加载组件
  提供各种类型的骨架屏加载效果
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel" role="status" aria-live="polite">
    <!-- 头像骨架 -->
    <div v-if="avatar" :class="avatarClasses"></div>
    
    <!-- 标题骨架 -->
    <div v-if="title" class="skeleton-content">
      <div :class="titleClasses"></div>
    </div>
    
    <!-- 图片骨架 -->
    <div v-if="image" :class="imageClasses"></div>
    
    <!-- 段落骨架 -->
    <div v-if="paragraph" class="skeleton-content space-y-2">
      <div
        v-for="(width, index) in paragraphWidths"
        :key="index"
        :class="[paragraphClasses, `w-${width}`]"
      ></div>
    </div>
    
    <!-- 表格骨架 -->
    <div v-if="table" class="skeleton-table">
      <div class="skeleton-table-header">
        <div
          v-for="col in columns"
          :key="`header-${col}`"
          :class="tableHeaderClasses"
        ></div>
      </div>
      <div
        v-for="row in rows"
        :key="`row-${row}`"
        class="skeleton-table-row"
      >
        <div
          v-for="col in columns"
          :key="`cell-${row}-${col}`"
          :class="tableCellClasses"
        ></div>
      </div>
    </div>
    
    <!-- 图表骨架 -->
    <div v-if="chart" class="skeleton-chart">
      <div class="skeleton-chart-header mb-4">
        <div :class="[baseClasses, 'h-6 w-48']"></div>
      </div>
      <div class="skeleton-chart-content">
        <!-- Y轴标签 -->
        <div class="skeleton-chart-y-axis">
          <div
            v-for="i in 5"
            :key="`y-${i}`"
            :class="[baseClasses, 'h-3 w-8 mb-4']"
          ></div>
        </div>
        <!-- 图表区域 -->
        <div class="skeleton-chart-area">
          <div
            v-for="i in 12"
            :key="`bar-${i}`"
            :class="[baseClasses, 'skeleton-chart-bar']"
            :style="{ height: `${Math.random() * 80 + 20}%` }"
          ></div>
        </div>
      </div>
      <!-- X轴标签 -->
      <div class="skeleton-chart-x-axis">
        <div
          v-for="i in 6"
          :key="`x-${i}`"
          :class="[baseClasses, 'h-3 w-12']"
        ></div>
      </div>
    </div>
    
    <!-- 卡片骨架 -->
    <div v-if="card" class="skeleton-card">
      <div v-if="cardImage" :class="[baseClasses, 'h-48 w-full mb-4']"></div>
      <div class="skeleton-card-content">
        <div :class="[baseClasses, 'h-6 w-3/4 mb-2']"></div>
        <div :class="[baseClasses, 'h-4 w-full mb-1']"></div>
        <div :class="[baseClasses, 'h-4 w-5/6 mb-1']"></div>
        <div :class="[baseClasses, 'h-4 w-2/3']"></div>
      </div>
    </div>
    
    <!-- 列表骨架 -->
    <div v-if="list" class="skeleton-list space-y-3">
      <div
        v-for="item in listItems"
        :key="`list-${item}`"
        class="skeleton-list-item flex items-center space-x-3"
      >
        <div :class="[baseClasses, 'h-10 w-10 rounded-full flex-shrink-0']"></div>
        <div class="flex-1 space-y-2">
          <div :class="[baseClasses, 'h-4 w-3/4']"></div>
          <div :class="[baseClasses, 'h-3 w-1/2']"></div>
        </div>
      </div>
    </div>
    
    <!-- 自定义行列骨架 -->
    <div v-if="!hasSpecificType" class="skeleton-rows space-y-2">
      <div
        v-for="row in rows"
        :key="`row-${row}`"
        class="skeleton-row flex space-x-2"
      >
        <div
          v-for="col in columns"
          :key="`col-${col}`"
          :class="[baseClasses, getCustomSize(row, col)]"
        ></div>
      </div>
    </div>
    
    <!-- 屏幕阅读器文本 -->
    <span class="sr-only">{{ loadingMessage }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  // 基础配置
  rows?: number
  columns?: number
  animation?: 'pulse' | 'wave' | 'shimmer'
  shape?: 'rectangle' | 'circle' | 'rounded'
  size?: 'sm' | 'md' | 'lg'
  
  // 特定类型
  avatar?: boolean
  title?: boolean
  paragraph?: boolean
  image?: boolean
  chart?: boolean
  table?: boolean
  card?: boolean
  cardImage?: boolean
  list?: boolean
  listItems?: number
  
  // 样式配置
  customClasses?: string | string[]
  spacing?: 'tight' | 'normal' | 'loose'
  
  // 无障碍
  ariaLabel?: string
  loadingMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
  columns: 1,
  animation: 'pulse',
  shape: 'rounded',
  size: 'md',
  listItems: 3,
  spacing: 'normal',
  ariaLabel: 'Inhalt wird geladen',
  loadingMessage: 'Inhalt wird geladen, bitte warten...'
})

// 计算属性
const hasSpecificType = computed(() => {
  return props.avatar || props.title || props.paragraph || props.image || 
         props.chart || props.table || props.card || props.list
})

const baseClasses = computed(() => {
  const classes = ['skeleton-item']
  
  // 动画类型
  switch (props.animation) {
    case 'pulse':
      classes.push('animate-pulse', 'bg-gray-300', 'dark:bg-gray-700')
      break
    case 'wave':
      classes.push('skeleton-wave')
      break
    case 'shimmer':
      classes.push('skeleton-shimmer')
      break
  }
  
  // 形状
  switch (props.shape) {
    case 'circle':
      classes.push('rounded-full')
      break
    case 'rounded':
      classes.push('rounded-md')
      break
    case 'rectangle':
      classes.push('rounded-none')
      break
  }
  
  return classes
})

const containerClasses = computed(() => {
  const classes = ['skeleton-loader']
  
  // 间距
  switch (props.spacing) {
    case 'tight':
      classes.push('space-y-1')
      break
    case 'normal':
      classes.push('space-y-2')
      break
    case 'loose':
      classes.push('space-y-4')
      break
  }
  
  // 自定义类
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const avatarClasses = computed(() => {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }
  
  return [
    ...baseClasses.value,
    sizeMap[props.size],
    'rounded-full',
    'flex-shrink-0'
  ]
})

const titleClasses = computed(() => {
  const sizeMap = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8'
  }
  
  return [
    ...baseClasses.value,
    sizeMap[props.size],
    'w-3/4',
    'mb-2'
  ]
})

const imageClasses = computed(() => {
  const sizeMap = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64'
  }
  
  return [
    ...baseClasses.value,
    sizeMap[props.size],
    'w-full',
    'mb-4'
  ]
})

const paragraphClasses = computed(() => {
  const sizeMap = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5'
  }
  
  return [
    ...baseClasses.value,
    sizeMap[props.size]
  ]
})

const tableHeaderClasses = computed(() => {
  return [
    ...baseClasses.value,
    'h-6',
    'bg-gray-200',
    'dark:bg-gray-600'
  ]
})

const tableCellClasses = computed(() => {
  return [
    ...baseClasses.value,
    'h-4'
  ]
})

const paragraphWidths = computed(() => {
  // 生成随机宽度的段落行
  const widths = []
  for (let i = 0; i < props.rows; i++) {
    if (i === props.rows - 1) {
      // 最后一行通常较短
      widths.push(['1/2', '2/3', '3/4'][Math.floor(Math.random() * 3)])
    } else {
      widths.push(['5/6', 'full', '11/12'][Math.floor(Math.random() * 3)])
    }
  }
  return widths
})

// 方法
const getCustomSize = (row: number, col: number): string => {
  const sizeMap = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5'
  }
  
  const widthVariations = ['w-full', 'w-3/4', 'w-1/2', 'w-1/3']
  const randomWidth = widthVariations[Math.floor(Math.random() * widthVariations.length)]
  
  return `${sizeMap[props.size]} ${randomWidth}`
}
</script>

<style scoped>
.skeleton-loader {
  @apply w-full;
}

.skeleton-item {
  @apply block;
}

/* 波浪动画 */
.skeleton-wave {
  @apply bg-gray-300 dark:bg-gray-700 relative overflow-hidden;
}

.skeleton-wave::after {
  @apply absolute top-0 right-0 bottom-0 left-0;
  content: '';
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: wave 1.5s infinite;
}

:global(.theme-dark) .skeleton-wave::after {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
}

@keyframes wave {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 闪烁动画 */
.skeleton-shimmer {
  @apply bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700;
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 表格骨架 */
.skeleton-table {
  @apply w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.skeleton-table-header {
  @apply grid gap-4 p-4 bg-gray-50 dark:bg-gray-800;
  grid-template-columns: repeat(var(--columns, 3), 1fr);
}

.skeleton-table-row {
  @apply grid gap-4 p-4 border-t border-gray-200 dark:border-gray-700;
  grid-template-columns: repeat(var(--columns, 3), 1fr);
}

/* 图表骨架 */
.skeleton-chart {
  @apply w-full h-64 p-4 border border-gray-200 dark:border-gray-700 rounded-lg;
}

.skeleton-chart-content {
  @apply flex h-48;
}

.skeleton-chart-y-axis {
  @apply flex flex-col justify-between w-12 mr-4;
}

.skeleton-chart-area {
  @apply flex-1 flex items-end justify-between space-x-1;
}

.skeleton-chart-bar {
  @apply flex-1 min-h-4;
}

.skeleton-chart-x-axis {
  @apply flex justify-between mt-2;
}

/* 卡片骨架 */
.skeleton-card {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.skeleton-card-content {
  @apply p-4;
}

/* 列表骨架 */
.skeleton-list-item {
  @apply p-3 border border-gray-200 dark:border-gray-700 rounded-lg;
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
:global(.high-contrast) .skeleton-item {
  @apply border-2 border-current;
}

/* 减少动画模式支持 */
:global(.reduced-motion) .skeleton-item {
  @apply animate-none;
}

:global(.reduced-motion) .skeleton-wave::after {
  animation: none;
}

:global(.reduced-motion) .skeleton-shimmer {
  animation: none;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .skeleton-table-header,
  .skeleton-table-row {
    @apply grid-cols-1 gap-2;
  }
  
  .skeleton-chart {
    @apply h-48;
  }
  
  .skeleton-chart-content {
    @apply h-32;
  }
}

/* 打印样式 */
@media print {
  .skeleton-loader {
    @apply hidden;
  }
}

/* 自定义CSS变量支持 */
.skeleton-table-header,
.skeleton-table-row {
  grid-template-columns: repeat(var(--skeleton-columns, 3), 1fr);
}

/* 动画性能优化 */
.skeleton-item {
  will-change: opacity, transform;
}

/* 无障碍增强 */
@media (prefers-reduced-motion: reduce) {
  .skeleton-item,
  .skeleton-wave::after,
  .skeleton-shimmer {
    animation: none !important;
  }
}
</style>
