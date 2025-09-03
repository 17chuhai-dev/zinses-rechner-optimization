<template>
  <BaseCard :title="title" :padding="padding">
    <!-- 全局错误显示 -->
    <ErrorMessage
      v-if="globalError"
      type="error"
      :title="globalError.title"
      :message="globalError.message"
      class="mb-6"
      @dismiss="clearGlobalError"
    />

    <!-- 加载状态 -->
    <LoadingState
      v-if="isLoading"
      :is-loading="isLoading"
      :message="loadingMessage"
      type="spinner"
      size="md"
      class="mb-6"
    />

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 渲染表单部分 -->
      <template v-if="schema.sections && schema.sections.length > 0">
        <FormSection
          v-for="section in schema.sections"
          :key="section.title"
          :title="section.title"
          :description="section.description"
          :collapsible="section.collapsible"
          :default-expanded="section.defaultExpanded"
        >
          <div class="space-y-4">
            <DynamicField
              v-for="fieldKey in section.fields"
              :key="fieldKey"
              :field="getField(fieldKey)!"
              :model-value="modelValue[fieldKey]"
              :error-message="getFieldError(fieldKey)"
              @update:model-value="updateField(fieldKey, $event)"
              @validate="validateField(fieldKey)"
            />
          </div>
        </FormSection>
      </template>

      <!-- 渲染单独的字段（无分组） -->
      <template v-else>
        <div class="space-y-4">
          <DynamicField
            v-for="field in schema.fields"
            :key="field.key"
            :field="field"
            :model-value="modelValue[field.key]"
            :error-message="getFieldError(field.key)"
            @update:model-value="updateField(field.key, $event)"
            @validate="validateField(field.key)"
          />
        </div>
      </template>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-3">
        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          :disabled="!isFormValid || isLoading"
          :loading="isSubmitting"
          :full-width="!showResetButton"
          :icon-left="submitIcon"
        >
          {{ isSubmitting ? submittingText : submitText }}
        </BaseButton>

        <BaseButton
          v-if="showResetButton"
          type="button"
          variant="secondary"
          size="lg"
          :disabled="isLoading"
          @click="handleReset"
        >
          {{ resetText }}
        </BaseButton>
      </div>

      <!-- 表单帮助信息 -->
      <div v-if="helpText" class="text-sm text-gray-600">
        <BaseIcon name="info-circle" size="sm" class="inline mr-1" />
        {{ helpText }}
      </div>
    </form>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type {
  FormSchema,
  FormField,
  ValidationResult,
  ValidationError
} from '@/types/calculator'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import ErrorMessage from '../ui/ErrorMessage.vue'
import LoadingState from '../ui/LoadingState.vue'
import FormSection from './FormSection.vue'
import DynamicField from './DynamicField.vue'

interface Props {
  schema: FormSchema
  modelValue: Record<string, any>
  title?: string
  padding?: 'sm' | 'md' | 'lg'
  submitText?: string
  submittingText?: string
  resetText?: string
  showResetButton?: boolean
  submitIcon?: string
  helpText?: string
  isLoading?: boolean
  loadingMessage?: string
  autoValidate?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'submit', value: Record<string, any>): void
  (e: 'reset'): void
  (e: 'validate', result: ValidationResult): void
  (e: 'field-change', field: string, value: any): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  padding: 'lg',
  submitText: 'Berechnen',
  submittingText: 'Wird berechnet...',
  resetText: 'Zurücksetzen',
  showResetButton: true,
  submitIcon: 'calculator',
  helpText: '',
  isLoading: false,
  loadingMessage: 'Lädt...',
  autoValidate: true
})

const emit = defineEmits<Emits>()

// 状态管理
const isSubmitting = ref(false)
const errors = ref<ValidationError[]>([])
const globalError = ref<{ title: string; message: string } | null>(null)

// 计算属性
const isFormValid = computed(() => {
  return errors.value.length === 0 &&
         props.schema.fields.every(field =>
           !field.required || props.modelValue[field.key] !== undefined
         )
})

// 方法
const getField = (key: string): FormField | undefined => {
  return props.schema.fields.find(field => field.key === key)
}

const getFieldError = (fieldKey: string): string | undefined => {
  const error = errors.value.find(e => e.field === fieldKey)
  return error?.message
}

const updateField = (fieldKey: string, value: any) => {
  const newValue = { ...props.modelValue, [fieldKey]: value }
  emit('update:modelValue', newValue)
  emit('field-change', fieldKey, value)

  // 自动验证
  if (props.autoValidate) {
    validateField(fieldKey)
  }
}

const validateField = (fieldKey: string) => {
  const field = getField(fieldKey)
  if (!field) return

  const value = props.modelValue[fieldKey]
  const fieldErrors: ValidationError[] = []

  // 执行字段验证规则
  if (field.validation) {
    for (const rule of field.validation) {
      if (!validateRule(rule, value, fieldKey)) {
        fieldErrors.push({
          field: fieldKey,
          message: rule.message,
          code: rule.type
        })
      }
    }
  }

  // 更新错误状态
  errors.value = errors.value.filter(e => e.field !== fieldKey)
  errors.value.push(...fieldErrors)
}

const validateRule = (rule: any, value: any, fieldKey: string): boolean => {
  switch (rule.type) {
    case 'required':
      return value !== undefined && value !== null && value !== ''
    case 'min':
      return typeof value === 'number' ? value >= rule.value : true
    case 'max':
      return typeof value === 'number' ? value <= rule.value : true
    case 'range':
      return typeof value === 'number' ?
        value >= rule.value[0] && value <= rule.value[1] : true
    case 'custom':
      return rule.validator ? rule.validator(value) : true
    default:
      return true
  }
}

const validateForm = (): ValidationResult => {
  errors.value = []

  // 验证所有字段
  props.schema.fields.forEach(field => {
    validateField(field.key)
  })

  const result: ValidationResult = {
    isValid: errors.value.length === 0,
    errors: errors.value
  }

  emit('validate', result)
  return result
}

const handleSubmit = async () => {
  // 验证表单
  const validationResult = validateForm()
  if (!validationResult.isValid) {
    return
  }

  isSubmitting.value = true
  globalError.value = null

  try {
    emit('submit', props.modelValue)
  } catch (error) {
    globalError.value = {
      title: 'Fehler',
      message: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleReset = () => {
  errors.value = []
  globalError.value = null
  emit('reset')
}

const clearGlobalError = () => {
  globalError.value = null
}

// 监听器
watch(() => props.modelValue, () => {
  if (props.autoValidate) {
    validateForm()
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  // 初始化默认值
  const defaultValues: Record<string, any> = {}
  props.schema.fields.forEach(field => {
    if (field.defaultValue !== undefined && props.modelValue[field.key] === undefined) {
      defaultValues[field.key] = field.defaultValue
    }
  })

  if (Object.keys(defaultValues).length > 0) {
    emit('update:modelValue', { ...props.modelValue, ...defaultValues })
  }
})
</script>
