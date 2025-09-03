<template>
  <div class="dynamic-field">
    <!-- 货币输入字段 -->
    <BaseInput
      v-if="field.type === 'currency'"
      :model-value="modelValue"
      type="currency"
      :label="field.label"
      :placeholder="field.placeholder"
      :help-text="field.helpText"
      :required="field.required"
      :min="field.min"
      :max="field.max"
      :step="field.step"
      :error-message="errorMessage"
      :prefix-icon="field.icon || 'currency-euro'"
      @update:model-value="updateValue"
      @blur="handleBlur"
    />

    <!-- 百分比输入字段 -->
    <BaseInput
      v-else-if="field.type === 'percentage'"
      :model-value="modelValue"
      type="percentage"
      :label="field.label"
      :placeholder="field.placeholder"
      :help-text="field.helpText"
      :required="field.required"
      :min="field.min"
      :max="field.max"
      :step="field.step || 0.1"
      :error-message="errorMessage"
      :suffix-icon="field.icon || 'percentage'"
      @update:model-value="updateValue"
      @blur="handleBlur"
    />

    <!-- 数字输入字段 -->
    <BaseInput
      v-else-if="field.type === 'number'"
      :model-value="modelValue"
      type="number"
      :label="field.label"
      :placeholder="field.placeholder"
      :help-text="field.helpText"
      :required="field.required"
      :min="field.min"
      :max="field.max"
      :step="field.step || 1"
      :error-message="errorMessage"
      :prefix-icon="field.icon"
      @update:model-value="updateValue"
      @blur="handleBlur"
    />

    <!-- 选择器字段 -->
    <BaseSelect
      v-else-if="field.type === 'select'"
      :model-value="modelValue"
      :label="field.label"
      :placeholder="field.placeholder"
      :help-text="field.helpText"
      :required="field.required"
      :options="field.options || []"
      :error-message="errorMessage"
      @update:model-value="updateValue"
      @change="handleChange"
    />

    <!-- 滑块字段 -->
    <div v-else-if="field.type === 'slider'" class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-1">*</span>
      </label>
      
      <div class="px-3">
        <BaseSlider
          :model-value="modelValue"
          :min="field.min || 0"
          :max="field.max || 100"
          :step="field.step || 1"
          :label="field.label"
          :show-value="true"
          :format-value="formatSliderValue"
          @update:model-value="updateValue"
        />
      </div>

      <div v-if="field.helpText" class="text-sm text-gray-500">
        {{ field.helpText }}
      </div>

      <div v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </div>
    </div>

    <!-- 日期字段 -->
    <BaseInput
      v-else-if="field.type === 'date'"
      :model-value="modelValue"
      type="date"
      :label="field.label"
      :placeholder="field.placeholder"
      :help-text="field.helpText"
      :required="field.required"
      :error-message="errorMessage"
      :prefix-icon="field.icon || 'calendar'"
      @update:model-value="updateValue"
      @blur="handleBlur"
    />

    <!-- 布尔值字段（开关） -->
    <div v-else-if="field.type === 'boolean'" class="flex items-center space-x-3">
      <BaseToggle
        :model-value="modelValue"
        :label="field.label"
        :help-text="field.helpText"
        @update:model-value="updateValue"
      />
      
      <div v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </div>
    </div>

    <!-- 未知字段类型 -->
    <div v-else class="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div class="flex">
        <BaseIcon name="exclamation-triangle" class="text-yellow-400 mr-2" />
        <div>
          <h4 class="text-sm font-medium text-yellow-800">
            Unbekannter Feldtyp
          </h4>
          <p class="text-sm text-yellow-700">
            Feldtyp "{{ field.type }}" wird nicht unterstützt.
          </p>
        </div>
      </div>
    </div>

    <!-- 字段指导信息 -->
    <UserGuidance
      v-if="showGuidance && field.helpText"
      type="inline"
      :content="field.helpText"
      :icon="getGuidanceIcon(field.type)"
      class="mt-2"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormField } from '@/types/calculator'
import BaseInput from '../ui/BaseInput.vue'
import BaseSelect from '../ui/BaseSelect.vue'
import BaseSlider from '../ui/BaseSlider.vue'
import BaseToggle from '../ui/BaseToggle.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import UserGuidance from '../ui/UserGuidance.vue'

interface Props {
  field: FormField
  modelValue: any
  errorMessage?: string
  showGuidance?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'validate'): void
  (e: 'change', value: any): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  showGuidance: true
})

const emit = defineEmits<Emits>()

// 计算属性
const formatSliderValue = computed(() => {
  return (value: number) => {
    switch (props.field.type) {
      case 'currency':
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(value)
      case 'percentage':
        return `${value}%`
      default:
        return value.toString()
    }
  }
})

// 方法
const updateValue = (value: any) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const handleBlur = () => {
  emit('validate')
  emit('blur')
}

const handleChange = (value: any) => {
  updateValue(value)
  emit('validate')
}

const getGuidanceIcon = (fieldType: string): string => {
  const iconMap: Record<string, string> = {
    currency: '💰',
    percentage: '📊',
    number: '🔢',
    select: '📋',
    slider: '🎚️',
    date: '📅',
    boolean: '✅'
  }
  return iconMap[fieldType] || '💡'
}
</script>

<style scoped>
.dynamic-field {
  @apply w-full;
}

/* 滑块字段特殊样式 */
.dynamic-field .slider-container {
  @apply py-2;
}
</style>
