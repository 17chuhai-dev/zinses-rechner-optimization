<!--
  增强的移动端表单字段组件
  提供智能输入、验证、建议等高级功能
-->

<template>
  <div class="enhanced-mobile-form-field">
    <!-- 字段标签 -->
    <div class="field-header mb-2">
      <label
        :for="fieldId"
        class="block text-sm font-medium text-gray-900"
      >
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-1">*</span>
      </label>
      <div v-if="field.helpText" class="text-xs text-gray-500 mt-1">
        {{ field.helpText }}
      </div>
    </div>

    <!-- 输入字段容器 -->
    <div class="field-input-container relative">
      <!-- 数字输入字段 -->
      <div v-if="field.type === 'number'" class="number-input-wrapper">
        <div class="relative">
          <input
            :id="fieldId"
            :value="displayValue"
            :placeholder="field.placeholder"
            :class="[
              'w-full px-4 py-3 text-lg border rounded-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'placeholder-gray-400',
              errorMessage ? 'border-red-300 bg-red-50' : 'border-gray-300',
              isFocused ? 'shadow-lg' : 'shadow-sm'
            ]"
            type="text"
            inputmode="decimal"
            @input="handleNumberInput"
            @focus="handleFocus"
            @blur="handleBlur"
            @keydown="handleKeydown"
          />
          
          <!-- 货币符号 -->
          <div
            v-if="field.currency"
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
          >
            {{ getCurrencySymbol(field.currency) }}
          </div>
          
          <!-- 单位标签 -->
          <div
            v-if="field.unit"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none"
          >
            {{ field.unit }}
          </div>
        </div>

        <!-- 数字键盘快捷按钮 -->
        <div v-if="showNumberPad && isFocused" class="number-pad mt-3">
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="num in [1, 2, 3, 'C']"
              :key="num"
              :class="[
                'h-12 rounded-lg font-medium transition-all duration-150',
                num === 'C' 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              ]"
              @click="handleNumberPadClick(num)"
            >
              {{ num }}
            </button>
            <button
              v-for="num in [4, 5, 6, '00']"
              :key="num"
              class="h-12 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-all duration-150"
              @click="handleNumberPadClick(num)"
            >
              {{ num }}
            </button>
            <button
              v-for="num in [7, 8, 9, '000']"
              :key="num"
              class="h-12 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-all duration-150"
              @click="handleNumberPadClick(num)"
            >
              {{ num }}
            </button>
            <button
              class="h-12 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-all duration-150"
              @click="handleNumberPadClick('.')"
            >
              .
            </button>
            <button
              class="h-12 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-all duration-150"
              @click="handleNumberPadClick(0)"
            >
              0
            </button>
            <button
              class="h-12 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all duration-150"
              @click="handleNumberPadClick('⌫')"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>

      <!-- 选择字段 -->
      <select
        v-else-if="field.type === 'select'"
        :id="fieldId"
        :value="value"
        :class="[
          'w-full px-4 py-3 text-lg border rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          errorMessage ? 'border-red-300 bg-red-50' : 'border-gray-300',
          isFocused ? 'shadow-lg' : 'shadow-sm'
        ]"
        @change="handleSelectChange"
        @focus="handleFocus"
        @blur="handleBlur"
      >
        <option value="" disabled>{{ field.placeholder || 'Wählen Sie...' }}</option>
        <option
          v-for="option in field.options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- 文本输入字段 -->
      <input
        v-else
        :id="fieldId"
        :value="value"
        :placeholder="field.placeholder"
        :type="field.type"
        :class="[
          'w-full px-4 py-3 text-lg border rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'placeholder-gray-400',
          errorMessage ? 'border-red-300 bg-red-50' : 'border-gray-300',
          isFocused ? 'shadow-lg' : 'shadow-sm'
        ]"
        @input="handleTextInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <!-- 输入建议 -->
      <div
        v-if="showSuggestions && suggestions.length > 0 && isFocused"
        class="suggestions-dropdown absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
      >
        <button
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
          @click="applySuggestion(suggestion)"
        >
          <div class="flex items-center justify-between">
            <span class="text-gray-900">{{ suggestion.label }}</span>
            <span v-if="suggestion.description" class="text-xs text-gray-500">
              {{ suggestion.description }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- 错误消息 -->
    <div v-if="errorMessage" class="error-message mt-2">
      <div class="flex items-center text-sm text-red-600">
        <ExclamationCircleIcon class="w-4 h-4 mr-1 flex-shrink-0" />
        {{ errorMessage }}
      </div>
    </div>

    <!-- 字段提示 -->
    <div v-if="field.hint && !errorMessage" class="field-hint mt-2">
      <div class="flex items-center text-xs text-gray-500">
        <InformationCircleIcon class="w-3 h-3 mr-1 flex-shrink-0" />
        {{ field.hint }}
      </div>
    </div>

    <!-- 验证状态指示器 -->
    <div v-if="showValidationStatus" class="validation-status absolute top-2 right-2">
      <CheckCircleIcon
        v-if="isValid && value"
        class="w-5 h-5 text-green-500"
      />
      <ExclamationCircleIcon
        v-else-if="errorMessage"
        class="w-5 h-5 text-red-500"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

interface FormField {
  name: string
  type: string
  label: string
  placeholder?: string
  helpText?: string
  hint?: string
  required: boolean
  currency?: string
  unit?: string
  options?: Array<{ value: string; label: string }>
  suggestions?: Array<{ label: string; value: any; description?: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: any) => boolean | string
  }
}

interface Props {
  field: FormField
  value: any
  errorMessage?: string
  isFocused?: boolean
  showSuggestions?: boolean
}

interface Emits {
  (e: 'update', fieldName: string, value: any): void
  (e: 'focus', fieldName: string): void
  (e: 'blur', fieldName: string): void
  (e: 'validate', fieldName: string, isValid: boolean, errorMessage?: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 组件状态
const fieldId = computed(() => `field-${props.field.name}`)
const showNumberPad = ref(true)
const showValidationStatus = ref(true)

// 计算属性
const displayValue = computed(() => {
  if (props.field.type === 'number' && props.value) {
    return formatNumber(props.value)
  }
  return props.value || ''
})

const suggestions = computed(() => {
  if (!props.field.suggestions || !props.showSuggestions) return []
  
  const query = String(props.value || '').toLowerCase()
  if (!query) return props.field.suggestions.slice(0, 5)
  
  return props.field.suggestions
    .filter(suggestion => 
      suggestion.label.toLowerCase().includes(query) ||
      String(suggestion.value).toLowerCase().includes(query)
    )
    .slice(0, 5)
})

const isValid = computed(() => {
  if (!props.value && !props.field.required) return true
  if (!props.value && props.field.required) return false
  
  return validateValue(props.value).isValid
})

// 方法
const handleFocus = () => {
  emit('focus', props.field.name)
}

const handleBlur = () => {
  emit('blur', props.field.name)
  validateAndEmit()
}

const handleTextInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update', props.field.name, target.value)
}

const handleSelectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update', props.field.name, target.value)
}

const handleNumberInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value.replace(/[^\d.,]/g, '') // 只允许数字、逗号和点
  
  // 处理德语数字格式
  value = value.replace(',', '.')
  
  // 确保只有一个小数点
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  
  const numericValue = value ? parseFloat(value) : null
  emit('update', props.field.name, numericValue)
}

const handleNumberPadClick = (input: string | number) => {
  const currentValue = String(props.value || '')
  
  if (input === 'C') {
    emit('update', props.field.name, null)
  } else if (input === '⌫') {
    const newValue = currentValue.slice(0, -1)
    const numericValue = newValue ? parseFloat(newValue) : null
    emit('update', props.field.name, numericValue)
  } else {
    const newValue = currentValue + String(input)
    const numericValue = parseFloat(newValue)
    if (!isNaN(numericValue)) {
      emit('update', props.field.name, numericValue)
    }
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // 允许的按键
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
  ]
  
  if (allowedKeys.includes(event.key)) return
  
  // 数字和小数点
  if (props.field.type === 'number') {
    if (!/[\d.,]/.test(event.key)) {
      event.preventDefault()
    }
  }
}

const applySuggestion = (suggestion: any) => {
  emit('update', props.field.name, suggestion.value)
}

const validateValue = (value: any) => {
  if (!value && props.field.required) {
    return { isValid: false, message: 'Dieses Feld ist erforderlich' }
  }
  
  if (!value) {
    return { isValid: true }
  }
  
  const validation = props.field.validation
  if (!validation) {
    return { isValid: true }
  }
  
  // 数值范围验证
  if (props.field.type === 'number') {
    const numValue = Number(value)
    if (validation.min !== undefined && numValue < validation.min) {
      return { isValid: false, message: `Wert muss mindestens ${validation.min} sein` }
    }
    if (validation.max !== undefined && numValue > validation.max) {
      return { isValid: false, message: `Wert darf höchstens ${validation.max} sein` }
    }
  }
  
  // 正则表达式验证
  if (validation.pattern && !validation.pattern.test(String(value))) {
    return { isValid: false, message: 'Ungültiges Format' }
  }
  
  // 自定义验证
  if (validation.custom) {
    const result = validation.custom(value)
    if (typeof result === 'string') {
      return { isValid: false, message: result }
    }
    if (!result) {
      return { isValid: false, message: 'Ungültiger Wert' }
    }
  }
  
  return { isValid: true }
}

const validateAndEmit = () => {
  const result = validateValue(props.value)
  emit('validate', props.field.name, result.isValid, result.message)
}

const formatNumber = (value: number): string => {
  if (!value) return ''
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

const getCurrencySymbol = (currency: string): string => {
  const symbols = {
    EUR: '€',
    USD: '$',
    GBP: '£'
  }
  return symbols[currency as keyof typeof symbols] || currency
}

// 监听器
watch(() => props.value, () => {
  if (props.isFocused) return // 避免在用户输入时验证
  validateAndEmit()
}, { immediate: true })
</script>

<style scoped>
.enhanced-mobile-form-field {
  @apply relative;
}

.field-input-container {
  @apply relative;
}

.number-input-wrapper input[type="text"] {
  @apply font-mono;
}

.number-pad {
  @apply animate-slideInUp;
}

.suggestions-dropdown {
  @apply animate-slideInUp;
}

.validation-status {
  @apply transition-all duration-200;
}

/* 动画 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideInUp {
  animation: slideInUp 0.2s ease-out;
}

/* 触摸优化 */
.number-pad button {
  @apply touch-manipulation;
}

/* 焦点样式 */
input:focus,
select:focus {
  @apply ring-2 ring-blue-500 ring-offset-1;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .number-pad {
    @apply grid-cols-3;
  }
  
  .number-pad button {
    @apply h-10 text-sm;
  }
}
</style>
