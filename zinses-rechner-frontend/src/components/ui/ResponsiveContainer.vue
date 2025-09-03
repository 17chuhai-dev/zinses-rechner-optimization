<!--
  响应式容器组件
  提供统一的响应式布局管理
-->

<template>
  <div 
    :class="containerClasses"
    :style="containerStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsive } from '@/composables/useResponsive'

interface Props {
  // 容器类型
  type?: 'page' | 'section' | 'card' | 'grid' | 'flex'
  
  // 最大宽度设置
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none'
  
  // 内边距设置
  padding?: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  } | string
  
  // 外边距设置
  margin?: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  } | string
  
  // 网格设置（当 type 为 'grid' 时）
  gridCols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  
  // 间距设置
  gap?: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  } | string
  
  // 是否居中
  centered?: boolean
  
  // 自定义类名
  class?: string
  
  // 是否启用响应式字体
  responsiveText?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'section',
  maxWidth: 'xl',
  centered: true,
  responsiveText: false
})

const { 
  currentBreakpoint, 
  isMobile, 
  isTablet, 
  isDesktop,
  getSpacing,
  getContainerMaxWidth 
} = useResponsive()

// 容器基础类名
const baseClasses = computed(() => {
  const classes = ['responsive-container']
  
  // 容器类型
  switch (props.type) {
    case 'page':
      classes.push('min-h-screen')
      break
    case 'section':
      classes.push('w-full')
      break
    case 'card':
      classes.push('rounded-lg', 'shadow-sm')
      break
    case 'grid':
      classes.push('grid')
      break
    case 'flex':
      classes.push('flex')
      break
  }
  
  // 居中设置
  if (props.centered) {
    classes.push('mx-auto')
  }
  
  // 最大宽度
  if (props.maxWidth !== 'none') {
    const maxWidthMap = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full'
    }
    classes.push(maxWidthMap[props.maxWidth] || 'max-w-7xl')
  }
  
  // 响应式文本
  if (props.responsiveText) {
    if (isMobile.value) {
      classes.push('text-sm')
    } else if (isTablet.value) {
      classes.push('text-base')
    } else {
      classes.push('text-lg')
    }
  }
  
  return classes
})

// 网格列数
const gridColsClasses = computed(() => {
  if (props.type !== 'grid' || !props.gridCols) return []
  
  const bp = currentBreakpoint.value
  const cols = props.gridCols[bp] || props.gridCols.xs || 1
  
  return [`grid-cols-${cols}`]
})

// 间距类名
const gapClasses = computed(() => {
  if (!props.gap) return []
  
  if (typeof props.gap === 'string') {
    return [`gap-${props.gap}`]
  }
  
  const bp = currentBreakpoint.value
  const gap = props.gap[bp] || props.gap.xs || '4'
  
  return [`gap-${gap}`]
})

// 合并所有类名
const containerClasses = computed(() => {
  return [
    ...baseClasses.value,
    ...gridColsClasses.value,
    ...gapClasses.value,
    props.class
  ].filter(Boolean).join(' ')
})

// 动态样式
const containerStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  // 内边距
  if (props.padding) {
    if (typeof props.padding === 'string') {
      styles.padding = props.padding
    } else {
      const bp = currentBreakpoint.value
      const padding = props.padding[bp] || props.padding.xs
      if (padding) {
        styles.padding = padding
      }
    }
  }
  
  // 外边距
  if (props.margin) {
    if (typeof props.margin === 'string') {
      styles.margin = props.margin
    } else {
      const bp = currentBreakpoint.value
      const margin = props.margin[bp] || props.margin.xs
      if (margin) {
        styles.margin = margin
      }
    }
  }
  
  return styles
})
</script>

<style scoped>
.responsive-container {
  transition: all 0.3s ease;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .responsive-container {
    @apply px-4;
  }
}

/* 平板优化 */
@media (min-width: 641px) and (max-width: 1023px) {
  .responsive-container {
    @apply px-6;
  }
}

/* 桌面优化 */
@media (min-width: 1024px) {
  .responsive-container {
    @apply px-8;
  }
}
</style>
