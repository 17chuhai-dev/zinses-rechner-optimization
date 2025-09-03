<!--
  增强输入组件
  提供实时验证、智能提示、输入格式化等功能
-->

<template>
  <div class="enhanced-input" :class="containerClasses">
    <!-- 标签和帮助图标 -->
    <div v-if="label" class="input-header">
      <label 
        :for="inputId" 
        class="input-label"
        :class="{ 'text-red-600': hasError, 'text-green-600': isValid }"
      >
        {{ label }}
        <span v-if="required" class="text-red-500 ml-1">*</span>
      </label>
      
      <button
        v-if="helpText"
        type="button"
        class="help-button"
        @click="showHelp = !showHelp"
        :aria-expanded="showHelp"
        :aria-describedby="`${inputId}-help`"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- 输入容器 -->
    <div class="input-container" :class="inputContainerClasses">
      <!-- 前缀图标 -->
      <div v-if="prefixIcon || $slots.prefix" class="input-prefix">
        <slot name="prefix">
          <svg v-if="prefixIcon" class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path v-if="prefixIcon === 'currency-euro'" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10.4 6c.8 0 1.6.4 1.6 1.2 0 .8-.8 1.2-1.6 1.2h-.64v1.6h.64c.8 0 1.6.4 1.6 1.2 0 .8-.8 1.2-1.6 1.2-.704 0-1.192-.193-1.664-.979L7.6 12.8c.8 1.6 2.4 2.4 4 2.4 2.4 0 4-1.6 4-3.6 0-1.2-.8-2.4-2-2.8 1.2-.4 2-1.6 2-2.8 0-2-1.6-3.6-4-3.6-1.6 0-3.2.8-4 2.4l1.136 1.179z"/>
            <path v-else-if="prefixIcon === 'percentage'" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
          </svg>
        </slot>
      </div>

      <!-- 输入字段 -->
      <input
        :id="inputId"
        ref="inputRef"
        :type="inputType"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedBy"
        :aria-invalid="hasError"
        class="input-field"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
        @paste="handlePaste"
      />

      <!-- 后缀内容 -->
      <div v-if="suffixIcon || suffix || $slots.suffix" class="input-suffix">
        <slot name="suffix">
          <span v-if="suffix" class="suffix-text">{{ suffix }}</span>
          <svg v-if="suffixIcon" class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path v-if="suffixIcon === 'chart-bar'" d="M3 3v10a2 2 0 002 2h10a2 2 0 002-2V3a2 2 0 00-2-2H5a2 2 0 00-2 2zm12 1v8l-4-4-4 4V4h8z"/>
          </svg>
        </slot>
      </div>

      <!-- 清除按钮 -->
      <button
        v-if="clearable && modelValue && !disabled && !readonly"
        type="button"
        class="clear-button"
        @click="clearInput"
        :aria-label="'清除输入'"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- 验证状态图标 -->
      <div v-if="showValidationIcon" class="validation-icon">
        <svg v-if="isValid" class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="hasError" class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- 帮助文本 -->
    <Transition name="slide-down">
      <div
        v-if="showHelp && helpText"
        :id="`${inputId}-help`"
        class="help-text"
      >
        {{ helpText }}
      </div>
    </Transition>

    <!-- 错误消息 -->
    <Transition name="slide-down">
      <div
        v-if="hasError && errorMessage"
        class="error-message"
        role="alert"
        :aria-live="'polite'"
      >
        {{ errorMessage }}
      </div>
    </Transition>

    <!-- 智能建议 -->
    <Transition name="slide-down">
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="suggestions-dropdown"
      >
        <button
          v-for="(suggestion, index) in suggestions"
          :key="index"
          type="button"
          class="suggestion-item"
          @click="applySuggestion(suggestion)"
        >
          <span class="suggestion-value">{{ suggestion.value }}</span>
          <span v-if="suggestion.description" class="suggestion-description">
            {{ suggestion.description }}
          </span>
        </button>
      </div>
    </Transition>

    <!-- 实时反馈 -->
    <div v-if="showFeedback && feedback" class="input-feedback">
      <div class="feedback-content" :class="feedback.type">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path v-if="feedback.type === 'info'" fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          <path v-else-if="feedback.type === 'warning'" fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          <path v-else-if="feedback.type === 'success'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span>{{ feedback.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useResponsive } from '@/composables/useResponsive'

interface Suggestion {
  value: string | number
  description?: string
}

interface Feedback {
  type: 'info' | 'warning' | 'success' | 'error'
  message: string
}

interface Props {
  modelValue?: string | number
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'currency' | 'percentage'
  label?: string
  placeholder?: string
  helpText?: string
  errorMessage?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  
  // 数字输入相关
  min?: number
  max?: number
  step?: number
  
  // 格式化相关
  formatOnBlur?: boolean
  thousandsSeparator?: boolean
  decimalPlaces?: number
  
  // 验证相关
  validateOnInput?: boolean
  showValidationIcon?: boolean
  
  // 智能建议
  suggestions?: Suggestion[]
  showSuggestions?: boolean
  
  // 反馈
  feedback?: Feedback
  showFeedback?: boolean
  
  // 样式
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
  
  // 图标
  prefixIcon?: string
  suffixIcon?: string
  suffix?: string
  
  // 其他
  autocomplete?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  variant: 'default',
  validateOnInput: true,
  showValidationIcon: true,
  showSuggestions: false,
  showFeedback: true,
  formatOnBlur: true,
  thousandsSeparator: true,
  decimalPlaces: 2
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'input': [value: string | number]
  'clear': []
  'suggestion-applied': [suggestion: Suggestion]
}>()

// 响应式状态
const { isMobile } = useResponsive()
const inputRef = ref<HTMLInputElement>()
const showHelp = ref(false)
const isFocused = ref(false)
const internalValue = ref(props.modelValue || '')

// 生成唯一ID
const inputId = computed(() => `enhanced-input-${Math.random().toString(36).substr(2, 9)}`)

// 输入类型处理
const inputType = computed(() => {
  switch (props.type) {
    case 'currency':
    case 'percentage':
      return 'text'
    default:
      return props.type
  }
})

// 显示值处理
const displayValue = computed(() => {
  if (!internalValue.value) return ''
  
  if (props.type === 'currency' && !isFocused.value && props.formatOnBlur) {
    return formatCurrency(Number(internalValue.value))
  }
  
  if (props.type === 'percentage' && !isFocused.value && props.formatOnBlur) {
    return `${internalValue.value}%`
  }
  
  return internalValue.value.toString()
})

// 验证状态
const hasError = computed(() => Boolean(props.errorMessage))
const isValid = computed(() => {
  return !hasError.value && internalValue.value && props.validateOnInput
})

// 样式类
const containerClasses = computed(() => [
  'enhanced-input',
  `size-${props.size}`,
  `variant-${props.variant}`,
  {
    'is-focused': isFocused.value,
    'has-error': hasError.value,
    'is-valid': isValid.value,
    'is-disabled': props.disabled,
    'is-mobile': isMobile.value
  }
])

const inputContainerClasses = computed(() => [
  'input-container',
  {
    'has-prefix': props.prefixIcon || props.$slots?.prefix,
    'has-suffix': props.suffixIcon || props.suffix || props.$slots?.suffix,
    'has-clear': props.clearable && internalValue.value,
    'has-validation': props.showValidationIcon
  }
])

// ARIA 描述
const ariaDescribedBy = computed(() => {
  const ids = []
  if (showHelp.value && props.helpText) ids.push(`${inputId.value}-help`)
  if (hasError.value && props.errorMessage) ids.push(`${inputId.value}-error`)
  return ids.join(' ') || undefined
})

// 格式化函数
const formatCurrency = (value: number): string => {
  if (isNaN(value)) return ''
  
  const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: props.decimalPlaces,
    maximumFractionDigits: props.decimalPlaces
  })
  
  return formatter.format(value)
}

// 事件处理
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value
  
  // 数字类型处理
  if (props.type === 'number' || props.type === 'currency' || props.type === 'percentage') {
    // 移除非数字字符（保留小数点和负号）
    value = value.replace(/[^\d.-]/g, '')
    
    // 限制小数位数
    if (props.decimalPlaces !== undefined) {
      const parts = value.split('.')
      if (parts.length > 1) {
        parts[1] = parts[1].substring(0, props.decimalPlaces)
        value = parts.join('.')
      }
    }
  }
  
  internalValue.value = value
  emit('update:modelValue', props.type === 'number' ? Number(value) || 0 : value)
  emit('input', props.type === 'number' ? Number(value) || 0 : value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  
  // 格式化处理
  if (props.formatOnBlur && (props.type === 'currency' || props.type === 'percentage')) {
    const numValue = Number(internalValue.value)
    if (!isNaN(numValue)) {
      internalValue.value = numValue.toString()
    }
  }
  
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  // 数字输入限制
  if (props.type === 'number' || props.type === 'currency' || props.type === 'percentage') {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    const isNumber = /^[0-9]$/.test(event.key)
    const isDecimal = event.key === '.' && !internalValue.value.toString().includes('.')
    const isMinus = event.key === '-' && internalValue.value.toString().length === 0
    
    if (!allowedKeys.includes(event.key) && !isNumber && !isDecimal && !isMinus) {
      event.preventDefault()
    }
  }
}

const handlePaste = (event: ClipboardEvent) => {
  if (props.type === 'number' || props.type === 'currency' || props.type === 'percentage') {
    const paste = event.clipboardData?.getData('text') || ''
    const numValue = parseFloat(paste.replace(/[^\d.-]/g, ''))
    
    if (isNaN(numValue)) {
      event.preventDefault()
    }
  }
}

const clearInput = () => {
  internalValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const applySuggestion = (suggestion: Suggestion) => {
  internalValue.value = suggestion.value.toString()
  emit('update:modelValue', suggestion.value)
  emit('suggestion-applied', suggestion)
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue?.toString() || ''
  }
})

// 组件挂载时设置初始值
onMounted(() => {
  if (props.modelValue !== undefined) {
    internalValue.value = props.modelValue.toString()
  }
})
</script>

<style scoped>
.enhanced-input {
  @apply w-full;
}

.input-header {
  @apply flex items-center justify-between mb-2;
}

.input-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors;
}

.help-button {
  @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors;
}

.input-container {
  @apply relative flex items-center;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         placeholder-gray-500 dark:placeholder-gray-400
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
         transition-all duration-200;
}

.input-prefix,
.input-suffix {
  @apply absolute inset-y-0 flex items-center px-3 pointer-events-none;
}

.input-prefix {
  @apply left-0;
}

.input-suffix {
  @apply right-0;
}

.input-container.has-prefix .input-field {
  @apply pl-10;
}

.input-container.has-suffix .input-field {
  @apply pr-10;
}

.clear-button {
  @apply absolute right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
         transition-colors pointer-events-auto;
}

.validation-icon {
  @apply absolute right-2 pointer-events-none;
}

.input-container.has-clear .validation-icon {
  @apply right-8;
}

.help-text {
  @apply mt-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 
         p-3 rounded-lg border border-blue-200 dark:border-blue-800;
}

.error-message {
  @apply mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 
         p-2 rounded-lg border border-red-200 dark:border-red-800;
}

.suggestions-dropdown {
  @apply absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 
         border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10
         max-h-48 overflow-y-auto;
}

.suggestion-item {
  @apply w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 
         transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0;
}

.suggestion-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.suggestion-description {
  @apply block text-sm text-gray-500 dark:text-gray-400;
}

.input-feedback {
  @apply mt-2;
}

.feedback-content {
  @apply flex items-center space-x-2 p-2 rounded-lg text-sm;
}

.feedback-content.info {
  @apply bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300;
}

.feedback-content.warning {
  @apply bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300;
}

.feedback-content.success {
  @apply bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300;
}

.feedback-content.error {
  @apply bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300;
}

/* 尺寸变体 */
.size-sm .input-field {
  @apply px-2 py-1 text-sm;
}

.size-lg .input-field {
  @apply px-4 py-3 text-lg;
}

/* 样式变体 */
.variant-filled .input-field {
  @apply bg-gray-100 dark:bg-gray-800 border-transparent;
}

.variant-outlined .input-field {
  @apply bg-transparent border-2;
}

/* 状态样式 */
.has-error .input-field {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

.is-valid .input-field {
  @apply border-green-500 focus:ring-green-500 focus:border-green-500;
}

/* 移动端优化 */
.is-mobile .input-field {
  @apply text-base; /* 防止iOS缩放 */
}

.is-mobile .size-sm .input-field {
  @apply text-sm;
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  @apply transition-all duration-200;
}

.slide-down-enter-from,
.slide-down-leave-to {
  @apply opacity-0 transform -translate-y-2;
}
</style>
