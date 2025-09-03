<template>
  <div class="base-input">
    <label v-if="label" :for="inputId" :class="labelClasses">
      {{ label }}
      <span v-if="required" class="text-danger-500 ml-1">*</span>
    </label>

    <div class="relative">
      <div v-if="prefixIcon || $slots.prefix" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <BaseIcon v-if="prefixIcon" :name="prefixIcon" size="md" color="text-gray-400" />
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        :class="inputClasses"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />

      <div v-if="suffixIcon || $slots.suffix" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <BaseIcon v-if="suffixIcon" :name="suffixIcon" size="md" color="text-gray-400" />
        <slot name="suffix" />
      </div>
    </div>

    <p v-if="hasError && errorMessage" :id="`${inputId}-error`" class="mt-1 text-sm text-danger-600">
      {{ errorMessage }}
    </p>

    <p v-else-if="helpText" :id="`${inputId}-help`" class="mt-1 text-sm text-gray-500">
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, useSlots } from 'vue'
import { formatCurrency, parseCurrencyInput, parsePercentageInput } from '@/utils/formatters'
import BaseIcon from './BaseIcon.vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'currency' | 'percentage' | 'date' | 'textarea'
  label?: string
  placeholder?: string
  helpText?: string
  errorMessage?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  prefixIcon?: string
  suffixIcon?: string
  min?: number
  max?: number
  step?: number | string
  id?: string
}

interface Emits {
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  disabled: false,
  readonly: false,
  required: false
})

const emit = defineEmits<Emits>()
const slots = useSlots()

const inputRef = ref<HTMLInputElement>()
const inputId = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`)
const hasError = computed(() => !!props.errorMessage)

const labelClasses = computed(() => [
  'block',
  'text-sm',
  'font-medium',
  'text-gray-700',
  'mb-2'
])

const inputClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'border',
    'rounded-md',
    'shadow-sm',
    'placeholder-gray-400',
    'focus:outline-none',
    'focus:ring-1',
    'transition-colors',
    'tabular-nums' // 德语数字显示优化
  ]

  // 尺寸样式
  const sizeClasses = {
    sm: ['px-3', 'py-1.5', 'text-sm'],
    md: ['px-3', 'py-2', 'text-sm'],
    lg: ['px-4', 'py-3', 'text-base']
  }

  // 状态样式
  const stateClasses = hasError.value
    ? [
        'border-danger-300',
        'focus:ring-danger-500',
        'focus:border-danger-500'
      ]
    : [
        'border-gray-300',
        'focus:ring-primary-500',
        'focus:border-primary-500'
      ]

  // 禁用状态
  const disabledClasses = props.disabled
    ? ['bg-gray-50', 'text-gray-500', 'cursor-not-allowed']
    : ['bg-white']

  // 前缀/后缀图标的内边距调整
  const iconPaddingClasses = []
  if (props.prefixIcon || slots.prefix) {
    iconPaddingClasses.push('pl-10')
  }
  if (props.suffixIcon || slots.suffix) {
    iconPaddingClasses.push('pr-10')
  }

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...stateClasses,
    ...disabledClasses,
    ...iconPaddingClasses
  ]
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value: string | number = target.value

  // 特殊类型处理
  if (props.type === 'currency') {
    const numericValue = parseCurrencyInput(value as string)
    emit('update:modelValue', numericValue)

    // 格式化显示
    nextTick(() => {
      if (inputRef.value && numericValue > 0) {
        inputRef.value.value = formatCurrency(numericValue).replace('€', '').trim()
      }
    })
    return
  }

  if (props.type === 'percentage') {
    const numericValue = parsePercentageInput(value as string)
    emit('update:modelValue', numericValue)
    return
  }

  if (props.type === 'number') {
    value = target.valueAsNumber || 0
  }

  emit('update:modelValue', value)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)

  // 德语数字输入优化
  if (props.type === 'number' || props.type === 'currency') {
    // 允许德语小数分隔符 (,)
    if (event.key === ',') {
      event.preventDefault()
      const target = event.target as HTMLInputElement
      const cursorPos = target.selectionStart || 0
      const value = target.value
      const newValue = value.slice(0, cursorPos) + '.' + value.slice(cursorPos)
      target.value = newValue
      target.setSelectionRange(cursorPos + 1, cursorPos + 1)
      handleInput(event)
    }
  }
}

// 暴露方法给父组件
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select()
})
</script>

<style scoped>
/* 移除数字输入框的默认箭头 */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
