<template>
  <div 
    class="result-metric"
    :class="[
      sizeClasses,
      highlight ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
    ]"
  >
    <div class="flex items-center space-x-3">
      <div 
        v-if="metric.icon"
        class="flex-shrink-0"
      >
        <BaseIcon 
          :name="metric.icon" 
          :size="size === 'sm' ? 'md' : 'lg'"
          :class="highlight ? 'text-blue-600' : 'text-gray-500'"
        />
      </div>
      
      <div class="flex-1 min-w-0">
        <p 
          class="font-medium truncate"
          :class="size === 'sm' ? 'text-sm text-gray-600' : 'text-gray-900'"
        >
          {{ metric.label }}
        </p>
        
        <p 
          class="font-bold truncate"
          :class="[
            highlight ? 'text-blue-600' : 'text-gray-900',
            size === 'sm' ? 'text-lg' : 'text-2xl'
          ]"
        >
          {{ formattedValue }}
        </p>
        
        <p 
          v-if="metric.description && size !== 'sm'"
          class="text-xs text-gray-500 mt-1"
        >
          {{ metric.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResultMetric } from '@/types/calculator'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import BaseIcon from '../ui/BaseIcon.vue'

interface Props {
  metric: ResultMetric
  value: any
  highlight?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  highlight: false,
  size: 'md'
})

// 计算属性
const sizeClasses = computed(() => {
  const classes = {
    sm: 'p-3 bg-gray-50 rounded-lg',
    md: 'p-4 bg-white border border-gray-200 rounded-lg shadow-sm',
    lg: 'p-6 bg-white border border-gray-200 rounded-xl shadow-md'
  }
  return classes[props.size]
})

const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return '—'
  }

  switch (props.metric.format) {
    case 'currency':
      return formatCurrency(props.value)
    case 'percentage':
      return formatPercentage(props.value)
    case 'number':
      return new Intl.NumberFormat('de-DE').format(props.value)
    case 'date':
      return new Date(props.value).toLocaleDateString('de-DE')
    default:
      return String(props.value)
  }
})
</script>

<style scoped>
.result-metric {
  @apply transition-all duration-200 hover:shadow-md;
}
</style>
