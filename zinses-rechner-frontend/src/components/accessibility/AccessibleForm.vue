<!--
  无障碍表单组件
  提供完整的表单无障碍支持，包括标签关联、错误处理、验证反馈
-->

<template>
  <form
    :class="formClasses"
    :novalidate="novalidate"
    @submit="handleSubmit"
    @reset="handleReset"
    role="form"
    :aria-label="formLabel"
    :aria-labelledby="formLabelledby"
    :aria-describedby="formDescribedby"
  >
    <!-- 表单标题 -->
    <div v-if="title" class="form-header mb-6">
      <h2 :id="titleId" class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ title }}
      </h2>
      <p v-if="description" :id="descriptionId" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {{ description }}
      </p>
    </div>

    <!-- 表单错误摘要 -->
    <div
      v-if="showErrorSummary && formErrors.length > 0"
      class="error-summary mb-6 p-4 border border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20"
      role="alert"
      aria-live="assertive"
      :id="errorSummaryId"
    >
      <h3 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
        <ExclamationTriangleIcon class="w-4 h-4 inline mr-1" />
        Fehler bei der Eingabe ({{ formErrors.length }})
      </h3>
      <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
        <li v-for="error in formErrors" :key="error.field">
          <a
            :href="`#${error.fieldId}`"
            class="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            @click="focusField(error.fieldId)"
          >
            {{ error.message }}
          </a>
        </li>
      </ul>
    </div>

    <!-- 表单进度指示器 -->
    <div
      v-if="showProgress && totalSteps > 1"
      class="form-progress mb-6"
      role="progressbar"
      :aria-valuenow="currentStep"
      :aria-valuemin="1"
      :aria-valuemax="totalSteps"
      :aria-label="`Schritt ${currentStep} von ${totalSteps}`"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Schritt {{ currentStep }} von {{ totalSteps }}
        </span>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ Math.round((currentStep / totalSteps) * 100) }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- 表单字段组 -->
    <div class="form-fields space-y-6">
      <slot
        :register-field="registerField"
        :unregister-field="unregisterField"
        :set-field-error="setFieldError"
        :clear-field-error="clearFieldError"
        :get-field-error="getFieldError"
        :validate-field="validateField"
        :form-state="formState"
      />
    </div>

    <!-- 表单操作 -->
    <div v-if="showActions" class="form-actions mt-8 flex flex-col sm:flex-row gap-3">
      <slot name="actions" :form-state="formState" :submit="handleSubmit" :reset="handleReset">
        <BaseButton
          type="submit"
          variant="primary"
          :disabled="!isValid || isSubmitting"
          :loading="isSubmitting"
          class="order-2 sm:order-1"
        >
          <span v-if="isSubmitting">{{ submittingText }}</span>
          <span v-else>{{ submitText }}</span>
        </BaseButton>
        
        <BaseButton
          v-if="showReset"
          type="reset"
          variant="outline"
          :disabled="isSubmitting"
          class="order-1 sm:order-2"
        >
          {{ resetText }}
        </BaseButton>
        
        <BaseButton
          v-if="showCancel"
          type="button"
          variant="ghost"
          :disabled="isSubmitting"
          @click="$emit('cancel')"
          class="order-3"
        >
          {{ cancelText }}
        </BaseButton>
      </slot>
    </div>

    <!-- 表单帮助信息 -->
    <div v-if="helpText" :id="helpTextId" class="form-help mt-4 text-sm text-gray-600 dark:text-gray-400">
      <InformationCircleIcon class="w-4 h-4 inline mr-1" />
      {{ helpText }}
    </div>

    <!-- 必填字段说明 -->
    <div v-if="hasRequiredFields" class="required-legend mt-4 text-xs text-gray-500 dark:text-gray-400">
      <span class="text-red-500">*</span> Pflichtfelder
    </div>

    <!-- 实时验证状态 -->
    <div
      v-if="liveValidation"
      class="sr-only"
      role="status"
      aria-live="polite"
      :id="validationStatusId"
    >
      {{ validationStatus }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, provide } from 'vue'
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useScreenReader } from '@/services/ScreenReaderService'

// 表单字段接口
export interface FormField {
  id: string
  name: string
  label: string
  type: string
  required: boolean
  value: any
  error?: string
  touched: boolean
  valid: boolean
  element?: HTMLElement
}

// 表单错误接口
export interface FormError {
  field: string
  fieldId: string
  message: string
}

// Props
interface Props {
  title?: string
  description?: string
  formLabel?: string
  formLabelledby?: string
  formDescribedby?: string
  novalidate?: boolean
  showErrorSummary?: boolean
  showProgress?: boolean
  showActions?: boolean
  showReset?: boolean
  showCancel?: boolean
  currentStep?: number
  totalSteps?: number
  submitText?: string
  submittingText?: string
  resetText?: string
  cancelText?: string
  helpText?: string
  liveValidation?: boolean
  autoFocus?: boolean
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  novalidate: true,
  showErrorSummary: true,
  showProgress: false,
  showActions: true,
  showReset: false,
  showCancel: false,
  currentStep: 1,
  totalSteps: 1,
  submitText: 'Absenden',
  submittingText: 'Wird gesendet...',
  resetText: 'Zurücksetzen',
  cancelText: 'Abbrechen',
  liveValidation: true,
  autoFocus: true
})

// Emits
interface Emits {
  submit: [data: Record<string, any>, event: Event]
  reset: [event: Event]
  cancel: []
  fieldChange: [field: FormField]
  validationChange: [isValid: boolean]
}

const emit = defineEmits<Emits>()

// 使用屏幕阅读器服务
const { announce, announceError } = useScreenReader()

// 响应式数据
const fields = reactive<Map<string, FormField>>(new Map())
const formErrors = ref<FormError[]>([])
const isSubmitting = ref(false)
const validationStatus = ref('')

// 生成唯一ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const titleId = ref(generateId('form-title'))
const descriptionId = ref(generateId('form-desc'))
const errorSummaryId = ref(generateId('error-summary'))
const helpTextId = ref(generateId('form-help'))
const validationStatusId = ref(generateId('validation-status'))

// 计算属性
const formClasses = computed(() => {
  const classes = ['accessible-form']
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  if (isSubmitting.value) classes.push('form-submitting')
  if (!isValid.value) classes.push('form-invalid')
  
  return classes
})

const formState = computed(() => ({
  fields: Array.from(fields.values()),
  errors: formErrors.value,
  isValid: isValid.value,
  isSubmitting: isSubmitting.value,
  hasChanges: hasChanges.value
}))

const isValid = computed(() => {
  return Array.from(fields.values()).every(field => field.valid || !field.required)
})

const hasChanges = computed(() => {
  return Array.from(fields.values()).some(field => field.touched)
})

const hasRequiredFields = computed(() => {
  return Array.from(fields.values()).some(field => field.required)
})

// 表单字段管理
const registerField = (field: Omit<FormField, 'touched' | 'valid'>) => {
  const fullField: FormField = {
    ...field,
    touched: false,
    valid: !field.required || (field.value !== undefined && field.value !== '' && field.value !== null)
  }
  
  fields.set(field.id, fullField)
  updateValidationStatus()
}

const unregisterField = (fieldId: string) => {
  fields.delete(fieldId)
  clearFieldError(fieldId)
  updateValidationStatus()
}

const setFieldError = (fieldId: string, message: string) => {
  const field = fields.get(fieldId)
  if (field) {
    field.error = message
    field.valid = false
    
    // 更新错误摘要
    const existingError = formErrors.value.find(e => e.field === fieldId)
    if (existingError) {
      existingError.message = message
    } else {
      formErrors.value.push({
        field: fieldId,
        fieldId: fieldId,
        message: `${field.label}: ${message}`
      })
    }
    
    // 公告错误
    if (props.liveValidation) {
      announceError('validation', `${field.label}: ${message}`)
    }
  }
  
  updateValidationStatus()
}

const clearFieldError = (fieldId: string) => {
  const field = fields.get(fieldId)
  if (field) {
    field.error = undefined
    field.valid = !field.required || (field.value !== undefined && field.value !== '' && field.value !== null)
  }
  
  // 从错误摘要中移除
  const errorIndex = formErrors.value.findIndex(e => e.field === fieldId)
  if (errorIndex > -1) {
    formErrors.value.splice(errorIndex, 1)
  }
  
  updateValidationStatus()
}

const getFieldError = (fieldId: string): string | undefined => {
  return fields.get(fieldId)?.error
}

const validateField = (fieldId: string): boolean => {
  const field = fields.get(fieldId)
  if (!field) return false
  
  // 基础验证
  if (field.required && (field.value === undefined || field.value === '' || field.value === null)) {
    setFieldError(fieldId, 'Dieses Feld ist erforderlich')
    return false
  }
  
  // 类型特定验证
  if (field.value !== undefined && field.value !== '' && field.value !== null) {
    switch (field.type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          setFieldError(fieldId, 'Bitte geben Sie eine gültige E-Mail-Adresse ein')
          return false
        }
        break
      case 'number':
        if (isNaN(Number(field.value))) {
          setFieldError(fieldId, 'Bitte geben Sie eine gültige Zahl ein')
          return false
        }
        break
      case 'url':
        try {
          new URL(field.value)
        } catch {
          setFieldError(fieldId, 'Bitte geben Sie eine gültige URL ein')
          return false
        }
        break
    }
  }
  
  clearFieldError(fieldId)
  return true
}

const validateAllFields = (): boolean => {
  let allValid = true
  
  for (const [fieldId] of fields) {
    if (!validateField(fieldId)) {
      allValid = false
    }
  }
  
  return allValid
}

const updateValidationStatus = () => {
  const totalFields = fields.size
  const validFields = Array.from(fields.values()).filter(f => f.valid).length
  const errorCount = formErrors.value.length
  
  if (props.liveValidation) {
    if (errorCount > 0) {
      validationStatus.value = `${errorCount} Fehler in ${totalFields} Feldern`
    } else if (totalFields > 0) {
      validationStatus.value = `Alle ${totalFields} Felder sind gültig`
    } else {
      validationStatus.value = ''
    }
  }
  
  emit('validationChange', isValid.value)
}

// 事件处理
const handleSubmit = async (event: Event) => {
  event.preventDefault()
  
  if (isSubmitting.value) return
  
  // 验证所有字段
  if (!validateAllFields()) {
    // 聚焦到第一个错误字段
    if (formErrors.value.length > 0) {
      focusField(formErrors.value[0].fieldId)
    }
    
    announce(`Formular enthält ${formErrors.value.length} Fehler`, 'assertive')
    return
  }
  
  isSubmitting.value = true
  
  try {
    // 收集表单数据
    const formData: Record<string, any> = {}
    for (const [fieldId, field] of fields) {
      formData[field.name] = field.value
    }
    
    announce('Formular wird gesendet', 'polite')
    emit('submit', formData, event)
  } finally {
    isSubmitting.value = false
  }
}

const handleReset = (event: Event) => {
  // 重置所有字段
  for (const [fieldId, field] of fields) {
    field.value = ''
    field.touched = false
    field.error = undefined
    field.valid = !field.required
  }
  
  // 清除错误
  formErrors.value = []
  updateValidationStatus()
  
  announce('Formular wurde zurückgesetzt', 'polite')
  emit('reset', event)
}

const focusField = (fieldId: string) => {
  const field = fields.get(fieldId)
  if (field?.element) {
    field.element.focus()
    field.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else {
    // 回退到DOM查询
    const element = document.getElementById(fieldId) as HTMLElement
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}

// 提供给子组件的上下文
provide('form-context', {
  registerField,
  unregisterField,
  setFieldError,
  clearFieldError,
  getFieldError,
  validateField,
  formState
})

// 监听器
watch(() => formErrors.value.length, (newCount, oldCount) => {
  if (newCount > oldCount && props.liveValidation) {
    announce(`${newCount} Validierungsfehler`, 'assertive')
  }
})

// 生命周期
onMounted(() => {
  // 自动聚焦到第一个字段
  if (props.autoFocus) {
    setTimeout(() => {
      const firstField = Array.from(fields.values())[0]
      if (firstField?.element) {
        firstField.element.focus()
      }
    }, 100)
  }
})
</script>

<style scoped>
.accessible-form {
  @apply max-w-none;
}

.form-submitting {
  @apply pointer-events-none opacity-75;
}

.form-invalid .form-actions button[type="submit"] {
  @apply opacity-60;
}

.error-summary a:focus {
  @apply outline-none ring-2 ring-red-500 rounded;
}

.form-progress {
  @apply relative;
}

.form-actions {
  @apply border-t border-gray-200 dark:border-gray-700 pt-6;
}

/* 屏幕阅读器专用内容 */
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

/* 高对比度模式支持 */
:global(.high-contrast) .error-summary {
  @apply border-4 border-current;
}

/* 大字体模式支持 */
:global(.large-text) .accessible-form {
  @apply text-lg;
}

:global(.large-text) .form-header h2 {
  @apply text-2xl;
}

/* 减少动画模式支持 */
:global(.reduced-motion) .form-progress div {
  @apply transition-none;
}

/* 打印样式 */
@media print {
  .form-actions {
    @apply hidden;
  }
  
  .error-summary {
    @apply bg-white border-black text-black;
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .form-actions {
    @apply flex-col;
  }
  
  .form-actions button {
    @apply w-full;
  }
}
</style>
