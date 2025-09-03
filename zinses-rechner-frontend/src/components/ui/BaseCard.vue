<template>
  <div :class="cardClasses">
    <!-- 卡片头部 -->
    <div v-if="$slots.header || title" :class="headerClasses">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-medium text-gray-900">
          {{ title }}
        </h3>
      </slot>
    </div>

    <!-- 卡片主体 -->
    <div :class="bodyClasses">
      <slot />
    </div>

    <!-- 卡片底部 -->
    <div v-if="$slots.footer" :class="footerClasses">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  shadow: 'md',
  rounded: 'md',
  border: true,
  hover: false,
  padding: 'md'
})

const cardClasses = computed(() => {
  const baseClasses = ['bg-white', 'transition-all', 'duration-200']

  // 变体样式
  const variantClasses = {
    default: ['border-gray-200'],
    primary: ['border-primary-200', 'bg-primary-50'],
    success: ['border-success-200', 'bg-success-50'],
    warning: ['border-warning-200', 'bg-warning-50'],
    danger: ['border-danger-200', 'bg-danger-50']
  }

  // 阴影样式
  const shadowClasses = {
    none: [],
    sm: ['shadow-sm'],
    md: ['shadow-soft'],
    lg: ['shadow-medium']
  }

  // 圆角样式
  const roundedClasses = {
    none: [],
    sm: ['rounded-sm'],
    md: ['rounded-md'],
    lg: ['rounded-lg'],
    xl: ['rounded-xl']
  }

  // 边框样式
  const borderClasses = props.border ? ['border'] : []

  // 悬停效果
  const hoverClasses = props.hover
    ? ['hover:shadow-strong', 'hover:-translate-y-1', 'cursor-pointer']
    : []

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    ...shadowClasses[props.shadow],
    ...roundedClasses[props.rounded],
    ...borderClasses,
    ...hoverClasses
  ]
})

const headerClasses = computed(() => {
  const baseClasses = ['border-b', 'border-gray-200']

  const paddingClasses = {
    none: [],
    sm: ['px-4', 'py-3'],
    md: ['px-6', 'py-4'],
    lg: ['px-8', 'py-6']
  }

  return [...baseClasses, ...paddingClasses[props.padding]]
})

const bodyClasses = computed(() => {
  const paddingClasses = {
    none: [],
    sm: ['p-4'],
    md: ['p-6'],
    lg: ['p-8']
  }

  return paddingClasses[props.padding]
})

const footerClasses = computed(() => {
  const baseClasses = ['border-t', 'border-gray-200', 'bg-gray-50']

  const paddingClasses = {
    none: [],
    sm: ['px-4', 'py-3'],
    md: ['px-6', 'py-4'],
    lg: ['px-8', 'py-6']
  }

  return [...baseClasses, ...paddingClasses[props.padding]]
})
</script>

<style scoped>
/* 组件特定样式 */
</style>
