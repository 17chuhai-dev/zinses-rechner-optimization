<template>
  <div class="base-slider">
    <div class="flex items-center justify-between mb-2">
      <label v-if="label" class="text-sm font-medium text-gray-700">
        {{ label }}
      </label>
      <span v-if="showValue" class="text-sm font-medium text-gray-900">
        {{ formatValue ? formatValue(modelValue) : modelValue }}
      </span>
    </div>
    
    <div class="relative">
      <input
        type="range"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        :class="{ 'cursor-not-allowed opacity-50': disabled }"
        @input="handleInput"
        @change="handleChange"
      />
      
      <!-- 刻度标记 -->
      <div v-if="showTicks" class="flex justify-between text-xs text-gray-500 mt-1">
        <span>{{ min }}</span>
        <span>{{ max }}</span>
      </div>
    </div>
    
    <p v-if="helpText" class="mt-1 text-sm text-gray-500">
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number
  label?: string
  helpText?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  showValue?: boolean
  showTicks?: boolean
  formatValue?: (value: number) => string
}

interface Emits {
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  showValue: true,
  showTicks: false
})

const emit = defineEmits<Emits>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  emit('update:modelValue', value)
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  emit('change', value)
}
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider::-webkit-slider-track {
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
}

.slider::-moz-range-track {
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
}
</style>
