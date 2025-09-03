<template>
  <div v-if="visible" :class="containerClasses">
    <div :class="spinnerClasses">
      <svg
        class="animate-spin"
        :class="sizeClasses"
        fill="none"
        viewBox="0 0 24 24"
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
    <p v-if="message" :class="messageClasses">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white'
  message?: string
  overlay?: boolean
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  size: 'md',
  color: 'primary',
  overlay: false,
  center: false
})

const containerClasses = computed(() => {
  const baseClasses = ['flex', 'items-center']
  
  if (props.center) {
    baseClasses.push('justify-center')
  }
  
  if (props.overlay) {
    baseClasses.push(
      'fixed',
      'inset-0',
      'bg-white',
      'bg-opacity-75',
      'z-50',
      'flex-col'
    )
  } else {
    baseClasses.push('space-x-3')
  }
  
  return baseClasses
})

const spinnerClasses = computed(() => {
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  }
  
  return [colorClasses[props.color]]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }
  
  return sizes[props.size]
})

const messageClasses = computed(() => {
  const baseClasses = ['text-sm', 'font-medium']
  
  if (props.overlay) {
    baseClasses.push('mt-4', 'text-center')
  }
  
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  }
  
  return [...baseClasses, colorClasses[props.color]]
})
</script>

<style scoped>
/* 组件特定样式 */
</style>
