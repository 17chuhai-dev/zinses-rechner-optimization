<template>
  <div class="base-select">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <select
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      :class="[
        errorMessage ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '',
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
      ]"
      @change="handleChange"
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
    
    <p v-if="helpText && !errorMessage" class="mt-1 text-sm text-gray-500">
      {{ helpText }}
    </p>
    
    <p v-if="errorMessage" class="mt-1 text-sm text-red-600">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Option {
  value: any
  label: string
}

interface Props {
  modelValue: any
  label?: string
  placeholder?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  errorMessage?: string
  options: Option[]
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  emit('update:modelValue', value)
  emit('change', value)
}
</script>
