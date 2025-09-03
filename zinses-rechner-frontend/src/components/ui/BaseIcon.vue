<template>
  <component
    :is="iconComponent"
    :class="iconClasses"
    v-bind="iconProps"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ShareIcon,
  CurrencyEuroIcon,
  CalculatorIcon,
  ChartBarIcon,
  ClockIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline'

interface Props {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

// 图标映射
const iconMap = {
  check: CheckIcon,
  'x-mark': XMarkIcon,
  'exclamation-triangle': ExclamationTriangleIcon,
  'information-circle': InformationCircleIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  eye: EyeIcon,
  'eye-slash': EyeSlashIcon,
  'document-arrow-down': DocumentArrowDownIcon,
  printer: PrinterIcon,
  share: ShareIcon,
  'currency-euro': CurrencyEuroIcon,
  calculator: CalculatorIcon,
  'chart-bar': ChartBarIcon,
  clock: ClockIcon,
  'question-mark-circle': QuestionMarkCircleIcon
}

const iconComponent = computed(() => {
  return iconMap[props.name as keyof typeof iconMap] || InformationCircleIcon
})

const iconClasses = computed(() => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10',
    '3xl': 'h-12 w-12'
  }

  const classes = [sizeClasses[props.size]]

  if (props.color) {
    classes.push(props.color)
  }

  return classes
})

const iconProps = computed(() => {
  return {
    'aria-hidden': true
  }
})
</script>

<style scoped>
/* 组件特定样式 */
</style>
