<template>
  <div class="toggle-switch-container">
    <label class="toggle-switch" :class="{ disabled: disabled }">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        @change="handleChange"
        class="sr-only"
      />
      <div class="toggle-track" :class="trackClasses">
        <div class="toggle-thumb" :class="thumbClasses"></div>
      </div>
      <span v-if="label" class="toggle-label" :class="labelClasses">
        {{ label }}
      </span>
    </label>
    <div v-if="description" class="toggle-description">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  disabled?: boolean
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow'
}

interface Emits {
  'update:modelValue': [value: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md',
  color: 'blue'
})

const emit = defineEmits<Emits>()

const handleChange = (event: Event) => {
  if (props.disabled) return
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}

const trackClasses = computed(() => {
  const baseClasses = 'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus-within:ring-2 focus-within:ring-offset-2'
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-14'
  }
  
  let colorClasses = ''
  if (props.modelValue && !props.disabled) {
    const activeColors = {
      blue: 'bg-blue-600 focus-within:ring-blue-500',
      green: 'bg-green-600 focus-within:ring-green-500',
      red: 'bg-red-600 focus-within:ring-red-500',
      yellow: 'bg-yellow-600 focus-within:ring-yellow-500'
    }
    colorClasses = activeColors[props.color]
  } else {
    colorClasses = props.disabled 
      ? 'bg-gray-200 cursor-not-allowed' 
      : 'bg-gray-200 hover:bg-gray-300'
  }
  
  return [baseClasses, sizeClasses[props.size], colorClasses].join(' ')
})

const thumbClasses = computed(() => {
  const baseClasses = 'inline-block rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out'
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }
  
  const positionClasses = {
    sm: props.modelValue ? 'translate-x-4' : 'translate-x-0',
    md: props.modelValue ? 'translate-x-5' : 'translate-x-0',
    lg: props.modelValue ? 'translate-x-7' : 'translate-x-0'
  }
  
  return [baseClasses, sizeClasses[props.size], positionClasses[props.size]].join(' ')
})

const labelClasses = computed(() => {
  const baseClasses = 'ml-3 text-sm font-medium'
  const colorClasses = props.disabled 
    ? 'text-gray-400' 
    : 'text-gray-900'
  
  return [baseClasses, colorClasses].join(' ')
})
</script>

<style scoped>
.toggle-switch-container {
  @apply flex flex-col;
}

.toggle-switch {
  @apply flex items-center cursor-pointer;
}

.toggle-switch.disabled {
  @apply cursor-not-allowed;
}

.toggle-track {
  @apply cursor-pointer;
}

.toggle-switch.disabled .toggle-track {
  @apply cursor-not-allowed;
}

.toggle-description {
  @apply mt-1 text-xs text-gray-500;
}

/* 确保焦点样式正确显示 */
.toggle-track:focus-within {
  @apply outline-none;
}

/* 隐藏默认的checkbox */
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
</style>
