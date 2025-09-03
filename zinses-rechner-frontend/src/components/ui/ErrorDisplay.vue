<template>
  <div v-if="hasErrors" class="error-display">
    <!-- 错误列表 -->
    <TransitionGroup name="error-list" tag="div" class="space-y-3">
      <div
        v-for="error in visibleErrors"
        :key="error.id"
        :class="[
          'error-item rounded-lg border p-4 shadow-sm transition-all duration-300',
          errorTypeClasses[error.type]
        ]"
      >
        <div class="flex items-start">
          <!-- 错误图标 -->
          <div class="flex-shrink-0 mr-3">
            <component
              :is="getErrorIcon(error.type)"
              :class="['w-5 h-5', errorIconClasses[error.type]]"
            />
          </div>

          <!-- 错误内容 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <h4 :class="['text-sm font-medium', errorTextClasses[error.type]]">
                {{ error.title }}
              </h4>
              
              <!-- 关闭按钮 -->
              <button
                @click="removeError(error.id)"
                :class="['ml-2 flex-shrink-0 rounded-md p-1 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2', 
                  errorHoverClasses[error.type]]"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>

            <p :class="['text-sm mb-2', errorTextClasses[error.type]]">
              {{ error.message }}
            </p>

            <!-- 详细信息 -->
            <div v-if="error.details && showDetails" class="mb-3">
              <p :class="['text-xs opacity-75', errorTextClasses[error.type]]">
                {{ error.details }}
              </p>
            </div>

            <!-- 错误操作按钮 -->
            <div v-if="error.actions && error.actions.length > 0" class="flex flex-wrap gap-2">
              <button
                v-for="action in error.actions"
                :key="action.label"
                @click="handleAction(action)"
                :class="[
                  'inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  action.primary 
                    ? errorPrimaryButtonClasses[error.type]
                    : errorSecondaryButtonClasses[error.type]
                ]"
              >
                {{ action.label }}
              </button>
            </div>

            <!-- 时间戳 -->
            <div v-if="showTimestamp" class="mt-2">
              <p :class="['text-xs opacity-50', errorTextClasses[error.type]]">
                {{ formatTimestamp(error.timestamp) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- 显示更多/收起按钮 -->
    <div v-if="errors.length > maxVisible" class="mt-3 text-center">
      <button
        @click="toggleShowAll"
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {{ showAll ? 'Weniger anzeigen' : `${errors.length - maxVisible} weitere Fehler anzeigen` }}
      </button>
    </div>

    <!-- 全部清除按钮 -->
    <div v-if="errors.length > 1" class="mt-3 text-center">
      <button
        @click="clearAllErrors"
        class="text-sm text-gray-600 hover:text-gray-800 font-medium"
      >
        Alle Fehler löschen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import type { AppError, ErrorAction } from '@/composables/useErrorHandler'

interface Props {
  errors: AppError[]
  maxVisible?: number
  showDetails?: boolean
  showTimestamp?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 3,
  showDetails: true,
  showTimestamp: false,
  autoHide: false,
  autoHideDelay: 5000
})

const emit = defineEmits<{
  'remove-error': [errorId: string]
  'clear-all': []
}>()

// 状态
const showAll = ref(false)

// 计算属性
const hasErrors = computed(() => props.errors.length > 0)

const visibleErrors = computed(() => {
  if (showAll.value || props.errors.length <= props.maxVisible) {
    return props.errors
  }
  return props.errors.slice(-props.maxVisible)
})

// 错误类型样式映射
const errorTypeClasses = {
  validation: 'bg-yellow-50 border-yellow-200',
  network: 'bg-red-50 border-red-200',
  calculation: 'bg-orange-50 border-orange-200',
  system: 'bg-purple-50 border-purple-200',
  user: 'bg-blue-50 border-blue-200'
}

const errorIconClasses = {
  validation: 'text-yellow-600',
  network: 'text-red-600',
  calculation: 'text-orange-600',
  system: 'text-purple-600',
  user: 'text-blue-600'
}

const errorTextClasses = {
  validation: 'text-yellow-800',
  network: 'text-red-800',
  calculation: 'text-orange-800',
  system: 'text-purple-800',
  user: 'text-blue-800'
}

const errorHoverClasses = {
  validation: 'hover:bg-yellow-200 focus:ring-yellow-500',
  network: 'hover:bg-red-200 focus:ring-red-500',
  calculation: 'hover:bg-orange-200 focus:ring-orange-500',
  system: 'hover:bg-purple-200 focus:ring-purple-500',
  user: 'hover:bg-blue-200 focus:ring-blue-500'
}

const errorPrimaryButtonClasses = {
  validation: 'bg-yellow-600 text-white hover:bg-yellow-700',
  network: 'bg-red-600 text-white hover:bg-red-700',
  calculation: 'bg-orange-600 text-white hover:bg-orange-700',
  system: 'bg-purple-600 text-white hover:bg-purple-700',
  user: 'bg-blue-600 text-white hover:bg-blue-700'
}

const errorSecondaryButtonClasses = {
  validation: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  network: 'bg-red-100 text-red-800 hover:bg-red-200',
  calculation: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  system: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  user: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
}

// 方法
const getErrorIcon = (type: AppError['type']) => {
  const iconMap = {
    validation: ExclamationTriangleIcon,
    network: XCircleIcon,
    calculation: ExclamationCircleIcon,
    system: ExclamationCircleIcon,
    user: InformationCircleIcon
  }
  return iconMap[type] || InformationCircleIcon
}

const removeError = (errorId: string) => {
  emit('remove-error', errorId)
}

const clearAllErrors = () => {
  emit('clear-all')
}

const toggleShowAll = () => {
  showAll.value = !showAll.value
}

const handleAction = async (action: ErrorAction) => {
  try {
    await action.action()
  } catch (error) {
    console.error('Error executing action:', error)
  }
}

const formatTimestamp = (timestamp: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp)
}

// 自动隐藏功能
if (props.autoHide) {
  setTimeout(() => {
    if (hasErrors.value) {
      clearAllErrors()
    }
  }, props.autoHideDelay)
}
</script>

<style scoped>
/* 错误列表动画 */
.error-list-enter-active,
.error-list-leave-active {
  transition: all 0.3s ease;
}

.error-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.error-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.error-list-move {
  transition: transform 0.3s ease;
}

/* 错误项悬停效果 */
.error-item {
  transition: all 0.2s ease;
}

.error-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 按钮动画 */
button {
  transition: all 0.2s ease;
}

button:active {
  transform: scale(0.98);
}
</style>
