<template>
  <div class="enhanced-form-field" :class="fieldClasses">
    <!-- 字段标签 -->
    <label 
      v-if="label"
      :for="fieldId"
      class="block text-sm font-medium text-gray-700 mb-2"
      :class="{ 'text-red-700': hasError }"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
      <span v-if="optional" class="text-gray-500 ml-1 text-xs">(optional)</span>
    </label>

    <!-- 输入字段容器 -->
    <div class="relative">
      <!-- 货币输入 -->
      <div v-if="type === 'currency'" class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-500 text-lg">€</span>
        </div>
        <input
          :id="fieldId"
          v-model="displayValue"
          type="text"
          inputmode="decimal"
          :class="inputClasses"
          class="pl-8"
          :placeholder="placeholder || '0,00'"
          :disabled="disabled"
          @input="handleInput"
          @blur="handleBlur"
          @focus="handleFocus"
        />
      </div>

      <!-- 百分比输入 -->
      <div v-else-if="type === 'percentage'" class="relative">
        <input
          :id="fieldId"
          v-model="displayValue"
          type="text"
          inputmode="decimal"
          :class="inputClasses"
          class="pr-8"
          :placeholder="placeholder || '0,00'"
          :disabled="disabled"
          @input="handleInput"
          @blur="handleBlur"
          @focus="handleFocus"
        />
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span class="text-gray-500">%</span>
        </div>
      </div>

      <!-- 数字输入 -->
      <input
        v-else-if="type === 'number'"
        :id="fieldId"
        v-model="displayValue"
        type="text"
        inputmode="numeric"
        :class="inputClasses"
        :placeholder="placeholder || '0'"
        :disabled="disabled"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- 选择框 -->
      <select
        v-else-if="type === 'select'"
        :id="fieldId"
        v-model="displayValue"
        :class="selectClasses"
        :disabled="disabled"
        @change="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- 文本输入 -->
      <input
        v-else
        :id="fieldId"
        v-model="displayValue"
        :type="type"
        :class="inputClasses"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- 验证状态图标 -->
      <div v-if="showValidationIcon" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <BaseIcon
          v-if="hasError"
          name="exclamation-circle"
          class="h-5 w-5 text-red-500"
        />
        <BaseIcon
          v-else-if="isValid && touched"
          name="check-circle"
          class="h-5 w-5 text-green-500"
        />
        <div
          v-else-if="isValidating"
          class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    </div>

    <!-- 帮助文本 -->
    <div v-if="helpText && !hasError" class="mt-1 text-sm text-gray-600">
      {{ helpText }}
    </div>

    <!-- 错误消息 -->
    <div v-if="hasError" class="mt-1">
      <p class="text-sm text-red-600 flex items-center">
        <BaseIcon name="exclamation-circle" class="h-4 w-4 mr-1 flex-shrink-0" />
        {{ errorMessage }}
      </p>
    </div>

    <!-- 警告消息 -->
    <div v-if="warningMessage && !hasError" class="mt-1">
      <p class="text-sm text-yellow-600 flex items-center">
        <BaseIcon name="exclamation-triangle" class="h-4 w-4 mr-1 flex-shrink-0" />
        {{ warningMessage }}
      </p>
    </div>

    <!-- 成功消息 -->
    <div v-if="successMessage && isValid && touched" class="mt-1">
      <p class="text-sm text-green-600 flex items-center">
        <BaseIcon name="check-circle" class="h-4 w-4 mr-1 flex-shrink-0" />
        {{ successMessage }}
      </p>
    </div>

    <!-- 实时建议 -->
    <div v-if="suggestions.length > 0 && focused" class="mt-2">
      <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
        <h4 class="text-sm font-medium text-blue-800 mb-2">💡 Vorschläge:</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li v-for="suggestion in suggestions" :key="suggestion" class="flex items-start">
            <BaseIcon name="light-bulb" class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>

    <!-- 快捷输入按钮 -->
    <div v-if="quickValues.length > 0 && focused" class="mt-2">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="quickValue in quickValues"
          :key="quickValue.value"
          type="button"
          class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          @click="setQuickValue(quickValue.value)"
        >
          {{ quickValue.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useValidation, type ValidationRule } from '@/composables/useValidation'
import { formatGermanCurrency, formatGermanNumber, parseGermanNumber } from '@/utils/germanFormatters'
import BaseIcon from './BaseIcon.vue'

interface Option {
  value: string | number
  label: string
}

interface QuickValue {
  value: number
  label: string
}

interface Props {
  modelValue: any
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'email' | 'select'
  label?: string
  placeholder?: string
  helpText?: string
  required?: boolean
  optional?: boolean
  disabled?: boolean
  options?: Option[]
  validationRules?: ValidationRule[]
  showValidationIcon?: boolean
  realtimeValidation?: boolean
  debounceMs?: number
  quickValues?: QuickValue[]
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'validate', isValid: boolean, errors: string[]): void
  (e: 'focus'): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  optional: false,
  disabled: false,
  showValidationIcon: true,
  realtimeValidation: true,
  debounceMs: 300,
  quickValues: () => []
})

const emit = defineEmits<Emits>()

// 状态管理
const displayValue = ref(props.modelValue)
const focused = ref(false)
const touched = ref(false)
const isValidating = ref(false)

// 验证系统
const { validateField } = useValidation()
const errors = ref<string[]>([])
const warnings = ref<string[]>([])

// 计算属性
const fieldId = computed(() => `field-${Math.random().toString(36).substr(2, 9)}`)

const hasError = computed(() => errors.value.length > 0)
const isValid = computed(() => errors.value.length === 0 && touched.value)
const errorMessage = computed(() => errors.value[0])
const warningMessage = computed(() => warnings.value[0])

const fieldClasses = computed(() => [
  'enhanced-form-field',
  {
    'field-error': hasError.value,
    'field-valid': isValid.value,
    'field-focused': focused.value,
    'field-disabled': props.disabled
  }
])

const inputClasses = computed(() => [
  'block w-full px-3 py-2 border rounded-md shadow-sm text-sm',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  'transition-colors duration-200',
  {
    'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500': hasError.value,
    'border-green-300 text-green-900 focus:ring-green-500 focus:border-green-500': isValid.value,
    'border-gray-300 text-gray-900 placeholder-gray-400': !hasError.value && !isValid.value,
    'bg-gray-50 text-gray-500 cursor-not-allowed': props.disabled
  }
])

const selectClasses = computed(() => [
  ...inputClasses.value,
  'pr-10 bg-white'
])

// 智能建议
const suggestions = computed(() => {
  const suggestions: string[] = []
  
  if (props.type === 'currency' && displayValue.value) {
    const value = parseGermanNumber(displayValue.value.toString())
    if (value > 0 && value < 1000) {
      suggestions.push('Für bessere Ergebnisse sollten Sie mindestens 1.000€ investieren')
    }
    if (value > 1000000) {
      suggestions.push('Bei hohen Beträgen sollten Sie eine professionelle Beratung in Anspruch nehmen')
    }
  }
  
  if (props.type === 'percentage' && displayValue.value) {
    const value = parseFloat(displayValue.value.toString().replace(',', '.'))
    if (value > 15) {
      suggestions.push('Sehr hohe Renditen sind oft mit höheren Risiken verbunden')
    }
    if (value < 1) {
      suggestions.push('Niedrige Zinssätze können die Inflation nicht ausgleichen')
    }
  }
  
  return suggestions
})

// 方法
const handleInput = async (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value
  
  // 格式化输入
  if (props.type === 'currency') {
    // 允许用户输入，但限制字符
    value = value.replace(/[^0-9.,]/g, '')
  } else if (props.type === 'percentage') {
    value = value.replace(/[^0-9.,]/g, '')
  } else if (props.type === 'number') {
    value = value.replace(/[^0-9]/g, '')
  }
  
  displayValue.value = value
  
  // 实时验证
  if (props.realtimeValidation && props.validationRules) {
    await validateFieldValue(value)
  }
  
  // 发出更新事件
  let parsedValue = value
  if (props.type === 'currency' || props.type === 'percentage') {
    parsedValue = parseGermanNumber(value)
  } else if (props.type === 'number') {
    parsedValue = parseInt(value) || 0
  }
  
  emit('update:modelValue', parsedValue)
}

const handleFocus = () => {
  focused.value = true
  emit('focus')
}

const handleBlur = async () => {
  focused.value = false
  touched.value = true
  
  // 格式化显示值
  if (props.type === 'currency' && displayValue.value) {
    const numValue = parseGermanNumber(displayValue.value.toString())
    if (!isNaN(numValue)) {
      displayValue.value = formatGermanCurrency(numValue)
    }
  }
  
  // 完整验证
  if (props.validationRules) {
    await validateFieldValue(displayValue.value)
  }
  
  emit('blur')
}

const validateFieldValue = async (value: any) => {
  if (!props.validationRules) return
  
  isValidating.value = true
  
  // 模拟异步验证延迟
  await new Promise(resolve => setTimeout(resolve, props.debounceMs))
  
  const fieldErrors = validateField('field', value, props.validationRules)
  errors.value = fieldErrors.map(e => e.message)
  
  isValidating.value = false
  
  emit('validate', errors.value.length === 0, errors.value)
}

const setQuickValue = (value: number) => {
  if (props.type === 'currency') {
    displayValue.value = formatGermanCurrency(value)
  } else {
    displayValue.value = value.toString()
  }
  
  emit('update:modelValue', value)
  
  // 验证新值
  if (props.validationRules) {
    validateFieldValue(value)
  }
}

// 监听器
watch(() => props.modelValue, (newValue) => {
  if (newValue !== displayValue.value) {
    displayValue.value = newValue
  }
})

// 成功消息
const successMessage = computed(() => {
  if (props.type === 'currency' && isValid.value) {
    return 'Gültiger Betrag eingegeben'
  }
  if (props.type === 'percentage' && isValid.value) {
    return 'Gültiger Prozentsatz eingegeben'
  }
  return ''
})
</script>

<style scoped>
.enhanced-form-field {
  @apply transition-all duration-200;
}

.field-focused {
  @apply transform scale-[1.01];
}

.field-error input,
.field-error select {
  @apply animate-pulse;
}

.field-valid input,
.field-valid select {
  @apply ring-1 ring-green-200;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .enhanced-form-field input,
  .enhanced-form-field select {
    @apply text-base; /* 防止iOS缩放 */
  }
}
</style>
