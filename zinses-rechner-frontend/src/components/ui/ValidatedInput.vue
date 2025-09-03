<!--
  实时验证输入组件
  支持实时输入验证、错误信息显示、数据修正建议的增强输入组件
-->

<template>
  <div class="validated-input" :class="inputClasses">
    <!-- 字段标签 -->
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="required-indicator">*</span>
      <button
        v-if="helpText"
        type="button"
        class="help-button"
        @click="showHelp = !showHelp"
        :aria-expanded="showHelp"
      >
        <Icon name="help-circle" size="16" />
      </button>
    </label>

    <!-- 帮助文本 -->
    <Transition name="help-expand">
      <div v-if="showHelp && helpText" class="help-text">
        {{ helpText }}
      </div>
    </Transition>

    <!-- 输入框容器 -->
    <div class="input-container">
      <!-- 前缀图标或文本 -->
      <div v-if="prefix" class="input-prefix">
        <Icon v-if="prefixIcon" :name="prefixIcon" size="16" />
        <span v-else>{{ prefix }}</span>
      </div>

      <!-- 主输入框 -->
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
        class="input-field"
        :class="fieldClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
        :aria-invalid="hasErrors"
        :aria-describedby="ariaDescribedBy"
      />

      <!-- 后缀图标或文本 -->
      <div v-if="suffix || suffixIcon || showValidationIcon" class="input-suffix">
        <!-- 验证状态图标 -->
        <div v-if="showValidationIcon" class="validation-icon">
          <Icon
            v-if="hasErrors"
            name="alert-circle"
            size="16"
            class="error-icon"
          />
          <Icon
            v-else-if="hasWarnings"
            name="alert-triangle"
            size="16"
            class="warning-icon"
          />
          <Icon
            v-else-if="isValid && hasValue"
            name="check-circle"
            size="16"
            class="success-icon"
          />
        </div>

        <!-- 自定义后缀 -->
        <Icon v-if="suffixIcon" :name="suffixIcon" size="16" />
        <span v-else-if="suffix">{{ suffix }}</span>
      </div>

      <!-- 清除按钮 -->
      <button
        v-if="clearable && hasValue && !disabled && !readonly"
        type="button"
        class="clear-button"
        @click="clearValue"
        :aria-label="'清除' + (label || '输入')"
      >
        <Icon name="x" size="14" />
      </button>
    </div>

    <!-- 验证消息区域 -->
    <div v-if="showValidationMessages" class="validation-messages">
      <!-- 错误消息 -->
      <Transition name="message-slide" mode="out-in">
        <div v-if="hasErrors" class="error-messages">
          <div
            v-for="error in validationResult.errors"
            :key="error.code"
            class="error-message"
          >
            <Icon name="alert-circle" size="14" />
            <span>{{ error.message }}</span>
          </div>
        </div>
      </Transition>

      <!-- 警告消息 -->
      <Transition name="message-slide" mode="out-in">
        <div v-if="hasWarnings && !hasErrors" class="warning-messages">
          <div
            v-for="warning in validationResult.warnings"
            :key="warning.code"
            class="warning-message"
          >
            <Icon name="alert-triangle" size="14" />
            <span>{{ warning.message }}</span>
            <button
              v-if="warning.suggestion"
              type="button"
              class="suggestion-button"
              @click="showSuggestion(warning)"
            >
              查看建议
            </button>
          </div>
        </div>
      </Transition>

      <!-- 建议消息 -->
      <Transition name="message-slide" mode="out-in">
        <div v-if="showSuggestions && hasSuggestions" class="suggestion-messages">
          <div
            v-for="suggestion in validationResult.suggestions"
            :key="suggestion.field + suggestion.type"
            class="suggestion-message"
            :class="getSuggestionClass(suggestion)"
          >
            <Icon :name="getSuggestionIcon(suggestion.type)" size="14" />
            <span>{{ suggestion.message }}</span>
            <button
              v-if="suggestion.suggestedValue !== undefined"
              type="button"
              class="apply-suggestion-button"
              @click="applySuggestion(suggestion)"
            >
              应用建议
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 字符计数 -->
    <div v-if="showCharCount && maxLength" class="char-count">
      {{ currentLength }} / {{ maxLength }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { debounce } from 'lodash-es'
import { ValidationEngine, ValidationResult, ValidationSuggestion } from '../../utils/validation/ValidationEngine'
import { formatGermanNumber, parseGermanNumber, formatGermanCurrency } from '@/utils/germanFormatters'
import Icon from './BaseIcon.vue'

// Props定义
interface Props {
  modelValue?: string | number | null
  fieldName: string
  label?: string
  placeholder?: string
  helpText?: string
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'email' | 'password'
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  min?: number
  max?: number
  step?: number
  minLength?: number
  maxLength?: number
  prefix?: string
  prefixIcon?: string
  suffix?: string
  suffixIcon?: string
  showValidationIcon?: boolean
  showValidationMessages?: boolean
  showSuggestions?: boolean
  showCharCount?: boolean
  validateOnInput?: boolean
  validateOnBlur?: boolean
  debounceMs?: number
  validationEngine?: ValidationEngine
  validationContext?: any
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  readonly: false,
  clearable: false,
  showValidationIcon: true,
  showValidationMessages: true,
  showSuggestions: true,
  showCharCount: false,
  validateOnInput: true,
  validateOnBlur: true,
  debounceMs: 300
})

// Emits定义
interface Emits {
  'update:modelValue': [value: string | number | null]
  'validation-change': [result: ValidationResult]
  'suggestion-applied': [suggestion: ValidationSuggestion]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}

const emit = defineEmits<Emits>()

// 响应式数据
const inputRef = ref<HTMLInputElement>()
const showHelp = ref(false)
const isFocused = ref(false)
const validationResult = ref<ValidationResult>({
  isValid: true,
  errors: [],
  warnings: [],
  suggestions: []
})

// 生成唯一ID
const inputId = computed(() => `validated-input-${props.fieldName}-${Math.random().toString(36).substr(2, 9)}`)

// 计算属性
const inputType = computed(() => {
  switch (props.type) {
    case 'currency':
    case 'percentage':
      return 'text'
    case 'number':
      return 'number'
    default:
      return props.type
  }
})

const displayValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return ''
  }

  if (props.type === 'currency') {
    return typeof props.modelValue === 'number'
      ? formatGermanCurrency(props.modelValue)
      : props.modelValue
  }

  if (props.type === 'percentage') {
    return typeof props.modelValue === 'number'
      ? formatGermanNumber(props.modelValue) + '%'
      : props.modelValue
  }

  return String(props.modelValue)
})

const hasValue = computed(() => {
  return props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== ''
})

const currentLength = computed(() => {
  return String(props.modelValue || '').length
})

const hasErrors = computed(() => validationResult.value.errors.length > 0)
const hasWarnings = computed(() => validationResult.value.warnings.length > 0)
const hasSuggestions = computed(() => validationResult.value.suggestions.length > 0)
const isValid = computed(() => validationResult.value.isValid)

const inputClasses = computed(() => ({
  'has-errors': hasErrors.value,
  'has-warnings': hasWarnings.value && !hasErrors.value,
  'is-valid': isValid.value && hasValue.value,
  'is-focused': isFocused.value,
  'is-disabled': props.disabled,
  'is-readonly': props.readonly
}))

const fieldClasses = computed(() => ({
  'has-prefix': !!props.prefix || !!props.prefixIcon,
  'has-suffix': !!props.suffix || !!props.suffixIcon || props.showValidationIcon,
  'has-clear': props.clearable && hasValue.value
}))

const ariaDescribedBy = computed(() => {
  const ids = []
  if (hasErrors.value) ids.push(`${inputId.value}-errors`)
  if (hasWarnings.value) ids.push(`${inputId.value}-warnings`)
  if (hasSuggestions.value) ids.push(`${inputId.value}-suggestions`)
  return ids.join(' ')
})

// 防抖验证函数
const debouncedValidate = debounce((value: any) => {
  validateValue(value)
}, props.debounceMs)

// 方法
const validateValue = (value: any) => {
  if (!props.validationEngine) {
    return
  }

  const result = props.validationEngine.validateField(
    props.fieldName,
    value,
    props.validationContext
  )

  validationResult.value = result
  emit('validation-change', result)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value: string | number | null = target.value

  // 处理不同类型的输入
  if (props.type === 'currency' || props.type === 'percentage') {
    // 移除格式化字符，保留原始输入
    value = target.value.replace(/[€%\s]/g, '')
  }

  if (props.type === 'number' || props.type === 'currency' || props.type === 'percentage') {
    try {
      const numericValue = parseGermanNumber(value as string)
      if (!isNaN(numericValue)) {
        value = numericValue
      }
    } catch (error) {
      // 保持原始字符串值，让验证器处理错误
    }
  }

  emit('update:modelValue', value)

  if (props.validateOnInput) {
    debouncedValidate(value)
  }
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)

  if (props.validateOnBlur) {
    validateValue(props.modelValue)
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  // ESC键清除焦点
  if (event.key === 'Escape') {
    inputRef.value?.blur()
  }

  // Enter键触发验证
  if (event.key === 'Enter') {
    validateValue(props.modelValue)
  }
}

const clearValue = () => {
  emit('update:modelValue', null)
  validationResult.value = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  }
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const showSuggestion = (warning: any) => {
  // 显示建议的详细信息
  console.log('显示建议:', warning)
}

const applySuggestion = (suggestion: ValidationSuggestion) => {
  if (suggestion.suggestedValue !== undefined) {
    emit('update:modelValue', suggestion.suggestedValue)
    emit('suggestion-applied', suggestion)

    // 重新验证
    nextTick(() => {
      validateValue(suggestion.suggestedValue)
    })
  }
}

const getSuggestionClass = (suggestion: ValidationSuggestion) => {
  return {
    'suggestion-correction': suggestion.type === 'correction',
    'suggestion-optimization': suggestion.type === 'optimization',
    'suggestion-alternative': suggestion.type === 'alternative',
    'high-confidence': suggestion.confidence > 0.8,
    'medium-confidence': suggestion.confidence > 0.5 && suggestion.confidence <= 0.8,
    'low-confidence': suggestion.confidence <= 0.5
  }
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'correction':
      return 'edit'
    case 'optimization':
      return 'trending-up'
    case 'alternative':
      return 'shuffle'
    default:
      return 'lightbulb'
  }
}

// 监听器
watch(() => props.modelValue, (newValue) => {
  if (props.validateOnInput) {
    debouncedValidate(newValue)
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (props.modelValue && props.validationEngine) {
    validateValue(props.modelValue)
  }
})
</script>

<style scoped>
.validated-input {
  @apply w-full space-y-2;
}

/* 标签样式 */
.input-label {
  @apply flex items-center gap-2 text-sm font-medium text-gray-700 mb-1;
}

.required-indicator {
  @apply text-red-500;
}

.help-button {
  @apply text-gray-400 hover:text-gray-600 transition-colors;
}

/* 帮助文本 */
.help-text {
  @apply text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3 mb-2;
}

.help-expand-enter-active,
.help-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.help-expand-enter-from,
.help-expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.help-expand-enter-to,
.help-expand-leave-from {
  max-height: 200px;
  opacity: 1;
}

/* 输入框容器 */
.input-container {
  @apply relative flex items-center;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed;
  @apply readonly:bg-gray-50 readonly:cursor-default;
}

.input-field.has-prefix {
  @apply pl-10;
}

.input-field.has-suffix {
  @apply pr-10;
}

.input-field.has-clear {
  @apply pr-16;
}

/* 状态样式 */
.validated-input.has-errors .input-field {
  @apply border-red-300 focus:ring-red-500;
}

.validated-input.has-warnings .input-field {
  @apply border-yellow-300 focus:ring-yellow-500;
}

.validated-input.is-valid .input-field {
  @apply border-green-300 focus:ring-green-500;
}

.validated-input.is-focused .input-field {
  @apply ring-2;
}

/* 前缀和后缀 */
.input-prefix,
.input-suffix {
  @apply absolute flex items-center text-gray-500;
}

.input-prefix {
  @apply left-3;
}

.input-suffix {
  @apply right-3 gap-2;
}

.validation-icon {
  @apply flex items-center;
}

.error-icon {
  @apply text-red-500;
}

.warning-icon {
  @apply text-yellow-500;
}

.success-icon {
  @apply text-green-500;
}

/* 清除按钮 */
.clear-button {
  @apply absolute right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.validated-input.has-suffix .clear-button {
  @apply right-8;
}

/* 验证消息 */
.validation-messages {
  @apply space-y-1;
}

.error-messages,
.warning-messages,
.suggestion-messages {
  @apply space-y-1;
}

.error-message,
.warning-message,
.suggestion-message {
  @apply flex items-start gap-2 text-sm p-2 rounded-md;
}

.error-message {
  @apply text-red-700 bg-red-50 border border-red-200;
}

.warning-message {
  @apply text-yellow-700 bg-yellow-50 border border-yellow-200;
}

.suggestion-message {
  @apply text-blue-700 bg-blue-50 border border-blue-200;
}

.suggestion-message.suggestion-correction {
  @apply text-orange-700 bg-orange-50 border-orange-200;
}

.suggestion-message.suggestion-optimization {
  @apply text-green-700 bg-green-50 border-green-200;
}

.suggestion-message.suggestion-alternative {
  @apply text-purple-700 bg-purple-50 border-purple-200;
}

.suggestion-message.high-confidence {
  @apply border-l-4;
}

.suggestion-message.medium-confidence {
  @apply border-l-2;
}

.suggestion-message.low-confidence {
  @apply border-l;
}

/* 建议按钮 */
.suggestion-button,
.apply-suggestion-button {
  @apply ml-auto px-2 py-1 text-xs font-medium rounded transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-1;
}

.suggestion-button {
  @apply text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500;
}

.apply-suggestion-button {
  @apply text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500;
}

/* 字符计数 */
.char-count {
  @apply text-xs text-gray-500 text-right;
}

.validated-input.has-errors .char-count {
  @apply text-red-500;
}

/* 消息动画 */
.message-slide-enter-active,
.message-slide-leave-active {
  transition: all 0.3s ease;
}

.message-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.message-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .input-field {
    @apply text-base; /* 防止iOS缩放 */
  }

  .suggestion-message {
    @apply flex-col items-start gap-1;
  }

  .apply-suggestion-button,
  .suggestion-button {
    @apply self-end;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .input-label {
    @apply text-gray-300;
  }

  .input-field {
    @apply bg-gray-800 border-gray-600 text-gray-100;
    @apply focus:ring-blue-400;
  }

  .input-field:disabled {
    @apply bg-gray-700 text-gray-400;
  }

  .help-text {
    @apply bg-blue-900 border-blue-700 text-blue-100;
  }

  .error-message {
    @apply text-red-300 bg-red-900 border-red-700;
  }

  .warning-message {
    @apply text-yellow-300 bg-yellow-900 border-yellow-700;
  }

  .suggestion-message {
    @apply text-blue-300 bg-blue-900 border-blue-700;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .input-field {
    @apply border-2;
  }

  .error-message,
  .warning-message,
  .suggestion-message {
    @apply border-2;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .help-expand-enter-active,
  .help-expand-leave-active,
  .message-slide-enter-active,
  .message-slide-leave-active {
    transition: none;
  }

  .input-field {
    transition: none;
  }
}
</style>
