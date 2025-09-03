<template>
  <div 
    v-if="show"
    :class="[
      'error-message rounded-md p-4 border',
      variantClasses,
      sizeClasses,
      { 'animate-fade-in': animate }
    ]"
  >
    <!-- 错误图标和标题 -->
    <div class="flex items-start">
      <div v-if="showIcon" class="flex-shrink-0 mr-3">
        <component 
          :is="iconComponent" 
          :class="iconClasses"
        />
      </div>
      
      <div class="flex-1">
        <!-- 错误标题 -->
        <h3 v-if="title" :class="titleClasses">
          {{ title }}
        </h3>
        
        <!-- 错误消息 -->
        <div :class="messageClasses">
          <slot>
            <p>{{ message }}</p>
          </slot>
        </div>
        
        <!-- 错误详情 -->
        <div v-if="details && showDetails" class="mt-2">
          <details class="text-sm opacity-75">
            <summary class="cursor-pointer hover:opacity-100">
              Details anzeigen
            </summary>
            <pre class="mt-2 p-2 bg-black bg-opacity-10 rounded text-xs overflow-auto">{{ details }}</pre>
          </details>
        </div>
        
        <!-- 操作按钮 -->
        <div v-if="showActions" class="mt-3 flex space-x-2">
          <button
            v-if="retryable"
            @click="$emit('retry')"
            class="text-sm font-medium hover:underline focus:outline-none"
            :class="actionClasses"
          >
            Erneut versuchen
          </button>
          
          <button
            v-if="dismissible"
            @click="$emit('dismiss')"
            class="text-sm font-medium hover:underline focus:outline-none"
            :class="actionClasses"
          >
            Schließen
          </button>
        </div>
      </div>
      
      <!-- 关闭按钮 -->
      <div v-if="closable" class="flex-shrink-0 ml-3">
        <button
          @click="$emit('close')"
          class="rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
          :class="closeButtonClasses"
        >
          <span class="sr-only">Schließen</span>
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, h } from 'vue'

interface Props {
  message?: string
  title?: string
  details?: string
  variant?: 'error' | 'warning' | 'info' | 'success'
  size?: 'sm' | 'md' | 'lg'
  show?: boolean
  showIcon?: boolean
  showDetails?: boolean
  showActions?: boolean
  retryable?: boolean
  dismissible?: boolean
  closable?: boolean
  animate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Ein Fehler ist aufgetreten',
  variant: 'error',
  size: 'md',
  show: true,
  showIcon: true,
  showDetails: false,
  showActions: false,
  retryable: false,
  dismissible: false,
  closable: false,
  animate: true
})

const emit = defineEmits<{
  'retry': []
  'dismiss': []
  'close': []
}>()

// 计算样式类
const variantClasses = computed(() => {
  const variants = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-sm p-3',
    md: 'text-base p-4',
    lg: 'text-lg p-6'
  }
  return sizes[props.size]
})

const iconClasses = computed(() => {
  const variants = {
    error: 'h-5 w-5 text-red-400',
    warning: 'h-5 w-5 text-yellow-400',
    info: 'h-5 w-5 text-blue-400',
    success: 'h-5 w-5 text-green-400'
  }
  return variants[props.variant]
})

const titleClasses = computed(() => {
  const variants = {
    error: 'text-red-900 font-medium',
    warning: 'text-yellow-900 font-medium',
    info: 'text-blue-900 font-medium',
    success: 'text-green-900 font-medium'
  }
  return variants[props.variant]
})

const messageClasses = computed(() => {
  const base = props.title ? 'mt-1' : ''
  return base
})

const actionClasses = computed(() => {
  const variants = {
    error: 'text-red-700 hover:text-red-900',
    warning: 'text-yellow-700 hover:text-yellow-900',
    info: 'text-blue-700 hover:text-blue-900',
    success: 'text-green-700 hover:text-green-900'
  }
  return variants[props.variant]
})

const closeButtonClasses = computed(() => {
  const variants = {
    error: 'text-red-400 hover:text-red-600 focus:ring-red-500',
    warning: 'text-yellow-400 hover:text-yellow-600 focus:ring-yellow-500',
    info: 'text-blue-400 hover:text-blue-600 focus:ring-blue-500',
    success: 'text-green-400 hover:text-green-600 focus:ring-green-500'
  }
  return variants[props.variant]
})

// 图标组件
const iconComponent = computed(() => {
  const icons = {
    error: 'ExclamationCircleIcon',
    warning: 'ExclamationTriangleIcon', 
    info: 'InformationCircleIcon',
    success: 'CheckCircleIcon'
  }
  
  // 简化的SVG图标组件
  return {
    name: icons[props.variant],
    render: () => {
      const paths = {
        error: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
        warning: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
        info: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
        success: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
      }
      
      return h('svg', {
        class: iconClasses.value,
        fill: 'currentColor',
        viewBox: '0 0 20 20'
      }, [
        h('path', {
          'fill-rule': 'evenodd',
          d: paths[props.variant],
          'clip-rule': 'evenodd'
        })
      ])
    }
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-message {
  transition: all 0.2s ease-in-out;
}

.error-message:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
