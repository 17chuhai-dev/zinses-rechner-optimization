<template>
  <div v-if="visible" :class="alertClasses" role="alert">
    <div class="flex items-start">
      <BaseIcon :name="iconName" :size="iconSize" class="flex-shrink-0 mt-0.5" />
      <div class="ml-3 flex-1">
        <h3 v-if="title" class="text-sm font-medium" :class="titleClasses">
          {{ title }}
        </h3>
        <div class="text-sm" :class="messageClasses">
          <p v-if="typeof message === 'string'">{{ message }}</p>
          <ul v-else-if="Array.isArray(message)" class="list-disc list-inside space-y-1">
            <li v-for="(msg, index) in message" :key="index">{{ msg }}</li>
          </ul>
        </div>
        <div v-if="$slots.actions" class="mt-3">
          <slot name="actions" />
        </div>
      </div>
      <button
        v-if="dismissible"
        @click="dismiss"
        class="ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2"
        :class="dismissButtonClasses"
      >
        <BaseIcon name="x-mark" size="sm" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, h } from 'vue'
import BaseIcon from './BaseIcon.vue'

interface Props {
  type?: 'error' | 'warning' | 'info' | 'success'
  title?: string
  message?: string | string[]
  dismissible?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

interface Emits {
  dismiss: []
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  dismissible: true,
  autoHide: false,
  autoHideDelay: 5000
})

const emit = defineEmits<Emits>()

const visible = ref(true)

// 自动隐藏逻辑
if (props.autoHide) {
  setTimeout(() => {
    visible.value = false
  }, props.autoHideDelay)
}

const iconName = computed(() => {
  const icons = {
    error: 'exclamation-triangle',
    warning: 'exclamation-triangle',
    info: 'information-circle',
    success: 'check'
  }
  return icons[props.type]
})

const iconSize = computed(() => 'md')

const alertClasses = computed(() => {
  const baseClasses = ['rounded-md', 'p-4', 'border']
  
  const typeClasses = {
    error: ['bg-danger-50', 'border-danger-200', 'text-danger-800'],
    warning: ['bg-warning-50', 'border-warning-200', 'text-warning-800'],
    info: ['bg-blue-50', 'border-blue-200', 'text-blue-800'],
    success: ['bg-success-50', 'border-success-200', 'text-success-800']
  }
  
  return [...baseClasses, ...typeClasses[props.type]]
})

const titleClasses = computed(() => {
  const typeClasses = {
    error: 'text-danger-800',
    warning: 'text-warning-800',
    info: 'text-blue-800',
    success: 'text-success-800'
  }
  
  return typeClasses[props.type]
})

const messageClasses = computed(() => {
  const baseClasses = props.title ? ['mt-1'] : []
  
  const typeClasses = {
    error: 'text-danger-700',
    warning: 'text-warning-700',
    info: 'text-blue-700',
    success: 'text-success-700'
  }
  
  return [...baseClasses, typeClasses[props.type]]
})

const dismissButtonClasses = computed(() => {
  const typeClasses = {
    error: 'focus:ring-danger-500',
    warning: 'focus:ring-warning-500',
    info: 'focus:ring-blue-500',
    success: 'focus:ring-success-500'
  }
  
  return typeClasses[props.type]
})

const dismiss = () => {
  visible.value = false
  emit('dismiss')
}
</script>

<style scoped>
/* 组件特定样式 */
</style>
