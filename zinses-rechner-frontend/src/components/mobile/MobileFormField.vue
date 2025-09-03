<template>
  <div class="mobile-form-field">
    <!-- 字段标签 -->
    <label
      :for="field.name"
      class="block text-sm font-medium text-gray-700 mb-2"
    >
      {{ field.label }}
      <span v-if="field.required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- 货币输入 -->
    <div v-if="field.type === 'currency'" class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span class="text-gray-500 text-lg">€</span>
      </div>
      <input
        :id="field.name"
        v-model="displayValue"
        type="text"
        inputmode="decimal"
        class="mobile-input pl-8"
        :placeholder="field.placeholder || '0'"
        @input="handleCurrencyInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <!-- 百分比输入 -->
    <div v-else-if="field.type === 'percentage'" class="relative">
      <input
        :id="field.name"
        v-model="displayValue"
        type="number"
        inputmode="decimal"
        step="0.1"
        :min="field.min"
        :max="field.max"
        class="mobile-input pr-8"
        :placeholder="field.placeholder || '0'"
        @input="handlePercentageInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span class="text-gray-500">%</span>
      </div>
    </div>

    <!-- 数字输入 -->
    <div v-else-if="field.type === 'number'" class="relative">
      <input
        :id="field.name"
        v-model="displayValue"
        type="number"
        inputmode="numeric"
        :step="field.step || 1"
        :min="field.min"
        :max="field.max"
        class="mobile-input"
        :placeholder="field.placeholder || '0'"
        @input="handleNumberInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <!-- 日期输入 -->
    <div v-else-if="field.type === 'date'" class="relative">
      <input
        :id="field.name"
        v-model="displayValue"
        type="date"
        class="mobile-input"
        @input="handleDateInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <!-- 选择器 -->
    <div v-else-if="field.type === 'select'" class="relative">
      <select
        :id="field.name"
        v-model="displayValue"
        class="mobile-select"
        @change="handleSelectChange"
        @focus="handleFocus"
        @blur="handleBlur"
      >
        <option value="" disabled>{{ field.placeholder || 'Bitte wählen...' }}</option>
        <option
          v-for="option in field.options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <BaseIcon name="chevron-down" size="sm" class="text-gray-400" />
      </div>
    </div>

    <!-- 滑块输入 -->
    <div v-else-if="field.type === 'slider'" class="space-y-3">
      <div class="flex justify-between text-sm text-gray-600">
        <span>{{ field.min || 0 }}%</span>
        <span class="font-medium text-gray-900">{{ displayValue }}%</span>
        <span>{{ field.max || 100 }}%</span>
      </div>

      <input
        :id="field.name"
        v-model="displayValue"
        type="range"
        :min="field.min || 0"
        :max="field.max || 100"
        :step="field.step || 1"
        class="mobile-slider"
        @input="handleSliderInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <!-- 布尔值输入（开关） -->
    <div v-else-if="field.type === 'boolean'" class="flex items-center justify-between">
      <span class="text-sm text-gray-700">{{ field.label }}</span>
      <label class="mobile-switch">
        <input
          :id="field.name"
          v-model="displayValue"
          type="checkbox"
          class="sr-only"
          @change="handleBooleanInput"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <div class="mobile-switch-track">
          <div class="mobile-switch-thumb"></div>
        </div>
      </label>
    </div>

    <!-- 文本输入 -->
    <div v-else class="relative">
      <input
        :id="field.name"
        v-model="displayValue"
        type="text"
        class="mobile-input"
        :placeholder="field.placeholder || ''"
        @input="handleTextInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <!-- 帮助文本 -->
    <p v-if="field.helpText" class="mt-1 text-xs text-gray-500">
      {{ field.helpText }}
    </p>

    <!-- 错误信息 -->
    <p v-if="errorMessage" class="mt-1 text-xs text-red-600">
      {{ errorMessage }}
    </p>

    <!-- 移动端数字键盘快捷按钮 -->
    <div v-if="showQuickButtons && (field.type === 'currency' || field.type === 'number')" class="mt-2">
      <div class="flex space-x-2">
        <BaseButton
          v-for="amount in quickAmounts"
          :key="amount.value"
          variant="secondary"
          size="xs"
          @click="setQuickValue(amount.value)"
        >
          {{ amount.label }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormField } from '@/types/calculator'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseButton from '../ui/BaseButton.vue'

interface Props {
  field: FormField
  value: any
  errorMessage?: string
}

interface Emits {
  (e: 'update', name: string, value: any): void
  (e: 'focus', name: string): void
  (e: 'blur', name: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态管理
const isFocused = ref(false)
const displayValue = ref(props.value)

// 计算属性
const showQuickButtons = computed(() => {
  return (props.field.type === 'currency' || props.field.type === 'number') &&
         props.field.name !== 'years' // 年份字段不显示快捷按钮
})

const quickAmounts = computed(() => {
  if (props.field.type === 'currency') {
    if (props.field.name.includes('monthly') || props.field.name.includes('Monthly')) {
      return [
        { value: 100, label: '€100' },
        { value: 250, label: '€250' },
        { value: 500, label: '€500' },
        { value: 1000, label: '€1K' }
      ]
    } else {
      return [
        { value: 1000, label: '€1K' },
        { value: 5000, label: '€5K' },
        { value: 10000, label: '€10K' },
        { value: 50000, label: '€50K' }
      ]
    }
  } else if (props.field.type === 'number') {
    if (props.field.name.includes('age') || props.field.name.includes('Age')) {
      return [
        { value: 25, label: '25' },
        { value: 35, label: '35' },
        { value: 45, label: '45' },
        { value: 65, label: '65' }
      ]
    } else {
      return [
        { value: 1, label: '1' },
        { value: 5, label: '5' },
        { value: 10, label: '10' },
        { value: 20, label: '20' }
      ]
    }
  }
  return []
})

// 方法
const handleCurrencyInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value.replace(/[^\d.,]/g, '') // 只保留数字、逗号和点

  // 转换德国数字格式
  value = value.replace(',', '.')
  const numericValue = parseFloat(value) || 0

  displayValue.value = formatCurrency(numericValue)
  emit('update', props.field.name, numericValue)
}

const handlePercentageInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const numericValue = parseFloat(target.value) || 0

  displayValue.value = numericValue
  emit('update', props.field.name, numericValue)
}

const handleNumberInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const numericValue = parseFloat(target.value) || 0

  displayValue.value = numericValue
  emit('update', props.field.name, numericValue)
}

const handleDateInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  displayValue.value = target.value
  emit('update', props.field.name, target.value)
}

const handleSelectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  displayValue.value = target.value
  emit('update', props.field.name, target.value)
}

const handleSliderInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const numericValue = parseFloat(target.value) || 0

  displayValue.value = numericValue
  emit('update', props.field.name, numericValue)
}

const handleBooleanInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  displayValue.value = target.checked
  emit('update', props.field.name, target.checked)
}

const handleTextInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  displayValue.value = target.value
  emit('update', props.field.name, target.value)
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus', props.field.name)
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur', props.field.name)
}

const setQuickValue = (value: number) => {
  displayValue.value = props.field.type === 'currency' ? formatCurrency(value) : value
  emit('update', props.field.name, value)
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

// 监听props变化
watch(() => props.value, (newValue) => {
  if (props.field.type === 'currency') {
    displayValue.value = formatCurrency(newValue || 0)
  } else {
    displayValue.value = newValue
  }
}, { immediate: true })
</script>

<style scoped>
.mobile-form-field {
  @apply w-full;
}

/* 移动端优化的输入样式 */
.mobile-input {
  @apply w-full px-4 py-3 text-base border border-gray-300 rounded-lg
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         transition-all duration-200;
  min-height: 48px; /* 移动端友好的触摸目标 */
}

.mobile-select {
  @apply w-full px-4 py-3 text-base border border-gray-300 rounded-lg
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         transition-all duration-200 appearance-none bg-white;
  min-height: 48px;
}

.mobile-slider {
  @apply w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
}

.mobile-slider::-webkit-slider-thumb {
  @apply appearance-none w-6 h-6 bg-blue-600 rounded-full cursor-pointer
         shadow-lg hover:bg-blue-700 transition-colors;
}

.mobile-slider::-moz-range-thumb {
  @apply w-6 h-6 bg-blue-600 rounded-full cursor-pointer
         shadow-lg hover:bg-blue-700 transition-colors border-0;
}

/* 移动端开关样式 */
.mobile-switch {
  @apply relative inline-flex items-center cursor-pointer;
}

.mobile-switch-track {
  @apply w-12 h-6 bg-gray-200 rounded-full transition-colors duration-200;
}

.mobile-switch input:checked + .mobile-switch-track {
  @apply bg-blue-600;
}

.mobile-switch-thumb {
  @apply absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md
         transition-transform duration-200;
}

.mobile-switch input:checked + .mobile-switch-track .mobile-switch-thumb {
  @apply transform translate-x-6;
}

/* 焦点状态增强 */
.mobile-input:focus,
.mobile-select:focus {
  @apply ring-2 ring-blue-500 border-blue-500 shadow-lg;
  transform: scale(1.02);
}

/* 错误状态 */
.mobile-form-field.error .mobile-input,
.mobile-form-field.error .mobile-select {
  @apply border-red-300 ring-red-500;
}

/* 快捷按钮样式 */
.mobile-form-field .flex.space-x-2 button {
  @apply min-w-16 text-xs;
  transition: all 0.2s ease-in-out;
}

.mobile-form-field .flex.space-x-2 button:active {
  transform: scale(0.95);
}

/* 触摸反馈 */
@media (hover: none) and (pointer: coarse) {
  .mobile-input:active,
  .mobile-select:active {
    @apply bg-gray-50;
  }

  .mobile-switch:active .mobile-switch-track {
    @apply scale-95;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .mobile-input,
  .mobile-select {
    @apply bg-gray-800 border-gray-600 text-white;
  }

  .mobile-input:focus,
  .mobile-select:focus {
    @apply border-blue-400 ring-blue-400;
  }

  .mobile-switch-track {
    @apply bg-gray-600;
  }

  .mobile-switch input:checked + .mobile-switch-track {
    @apply bg-blue-500;
  }
}

/* 大字体支持 */
@media (prefers-reduced-motion: no-preference) {
  .mobile-input,
  .mobile-select,
  .mobile-slider {
    transition: all 0.2s ease-in-out;
  }
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  .mobile-input,
  .mobile-select {
    @apply border-2 border-gray-900;
  }

  .mobile-input:focus,
  .mobile-select:focus {
    @apply ring-4 ring-blue-600;
  }
}
</style>
