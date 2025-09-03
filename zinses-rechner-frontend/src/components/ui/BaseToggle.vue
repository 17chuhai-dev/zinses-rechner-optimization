<template>
  <div class="base-toggle">
    <div class="flex items-center">
      <button
        type="button"
        :class="[
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          modelValue ? 'bg-blue-600' : 'bg-gray-200',
          disabled ? 'cursor-not-allowed opacity-50' : ''
        ]"
        :disabled="disabled"
        @click="toggle"
      >
        <span
          :class="[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            modelValue ? 'translate-x-5' : 'translate-x-0'
          ]"
        />
      </button>
      
      <div v-if="label || helpText" class="ml-3">
        <label v-if="label" class="text-sm font-medium text-gray-700">
          {{ label }}
        </label>
        <p v-if="helpText" class="text-sm text-gray-500">
          {{ helpText }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  helpText?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false
})

const emit = defineEmits<Emits>()

const toggle = () => {
  if (props.disabled) return
  
  const newValue = !props.modelValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>

<style scoped>
/* Toggle组件样式 */
</style>
