<!--
  输入验证和错误处理组件
  提供实时输入验证、错误显示、数据修正建议等功能
-->

<template>
  <div class="input-validation-handler">
    <!-- 验证状态指示器 -->
    <div v-if="showValidationStatus" class="validation-status" :class="validationStatusClass">
      <div class="status-indicator">
        <svg v-if="validationState === 'valid'" class="status-icon valid" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="validationState === 'invalid'" class="status-icon invalid" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="validationState === 'warning'" class="status-icon warning" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div v-else class="status-spinner">
          <div class="spinner-ring"></div>
        </div>
      </div>
      <span class="status-text">{{ validationStatusText }}</span>
    </div>

    <!-- 错误消息显示 -->
    <Transition name="error-slide" mode="out-in">
      <div v-if="errors.length > 0" key="errors" class="error-messages">
        <div class="error-header">
          <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span class="error-title">{{ $t('validation.errors.title') }}</span>
        </div>
        <ul class="error-list">
          <li v-for="error in errors" :key="error.field" class="error-item">
            <span class="error-field">{{ getFieldLabel(error.field) }}:</span>
            <span class="error-message">{{ error.message }}</span>
            <button 
              v-if="error.suggestion"
              class="error-fix-button"
              @click="applySuggestion(error)"
            >
              {{ $t('validation.applySuggestion') }}
            </button>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- 警告消息显示 -->
    <Transition name="warning-slide" mode="out-in">
      <div v-if="warnings.length > 0" key="warnings" class="warning-messages">
        <div class="warning-header">
          <svg class="warning-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span class="warning-title">{{ $t('validation.warnings.title') }}</span>
        </div>
        <ul class="warning-list">
          <li v-for="warning in warnings" :key="warning.field" class="warning-item">
            <span class="warning-field">{{ getFieldLabel(warning.field) }}:</span>
            <span class="warning-message">{{ warning.message }}</span>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- 建议和提示 -->
    <Transition name="suggestions-slide" mode="out-in">
      <div v-if="suggestions.length > 0" key="suggestions" class="suggestions">
        <div class="suggestions-header">
          <svg class="suggestions-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <span class="suggestions-title">{{ $t('validation.suggestions.title') }}</span>
        </div>
        <ul class="suggestions-list">
          <li v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item">
            <span class="suggestion-text">{{ suggestion.message }}</span>
            <button 
              v-if="suggestion.action"
              class="suggestion-button"
              @click="applySuggestionAction(suggestion)"
            >
              {{ suggestion.actionText }}
            </button>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- 实时验证反馈 -->
    <div v-if="showRealtimeFeedback" class="realtime-feedback">
      <div class="feedback-item" v-for="feedback in realtimeFeedback" :key="feedback.field">
        <span class="feedback-field">{{ getFieldLabel(feedback.field) }}</span>
        <div class="feedback-content" :class="feedback.type">
          <span class="feedback-message">{{ feedback.message }}</span>
          <div v-if="feedback.progress !== undefined" class="feedback-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${feedback.progress}%` }"
                :class="feedback.type"
              ></div>
            </div>
            <span class="progress-text">{{ Math.round(feedback.progress) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 验证错误类型
export interface ValidationError {
  field: string
  message: string
  type: 'required' | 'format' | 'range' | 'custom'
  suggestion?: {
    value: any
    message: string
  }
}

// 验证警告类型
export interface ValidationWarning {
  field: string
  message: string
  type: 'performance' | 'recommendation' | 'info'
}

// 建议类型
export interface ValidationSuggestion {
  id: string
  message: string
  action?: () => void
  actionText?: string
}

// 实时反馈类型
export interface RealtimeFeedback {
  field: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  progress?: number
}

// Props定义
interface Props {
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
  suggestions?: ValidationSuggestion[]
  realtimeFeedback?: RealtimeFeedback[]
  validationState?: 'valid' | 'invalid' | 'warning' | 'validating'
  showValidationStatus?: boolean
  showRealtimeFeedback?: boolean
  fieldLabels?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => [],
  warnings: () => [],
  suggestions: () => [],
  realtimeFeedback: () => [],
  validationState: 'valid',
  showValidationStatus: true,
  showRealtimeFeedback: true,
  fieldLabels: () => ({})
})

// Emits定义
interface Emits {
  applySuggestion: [error: ValidationError]
  applySuggestionAction: [suggestion: ValidationSuggestion]
}

const emit = defineEmits<Emits>()

// 组合函数
const { t } = useI18n()

// 计算属性
const validationStatusClass = computed(() => {
  return `validation-${props.validationState}`
})

const validationStatusText = computed(() => {
  switch (props.validationState) {
    case 'valid':
      return t('validation.status.valid')
    case 'invalid':
      return t('validation.status.invalid')
    case 'warning':
      return t('validation.status.warning')
    case 'validating':
      return t('validation.status.validating')
    default:
      return ''
  }
})

// 方法
const getFieldLabel = (field: string): string => {
  return props.fieldLabels[field] || t(`fields.${field}`) || field
}

const applySuggestion = (error: ValidationError) => {
  emit('applySuggestion', error)
}

const applySuggestionAction = (suggestion: ValidationSuggestion) => {
  if (suggestion.action) {
    suggestion.action()
  }
  emit('applySuggestionAction', suggestion)
}
</script>

<style scoped>
.input-validation-handler {
  @apply space-y-3;
}

/* 验证状态指示器 */
.validation-status {
  @apply flex items-center gap-2 p-2 rounded-md text-sm;
}

.validation-valid {
  @apply bg-green-50 text-green-800 border border-green-200;
}

.validation-invalid {
  @apply bg-red-50 text-red-800 border border-red-200;
}

.validation-warning {
  @apply bg-yellow-50 text-yellow-800 border border-yellow-200;
}

.validation-validating {
  @apply bg-blue-50 text-blue-800 border border-blue-200;
}

.status-indicator {
  @apply flex items-center justify-center;
}

.status-icon {
  @apply w-4 h-4;
}

.status-icon.valid {
  @apply text-green-600;
}

.status-icon.invalid {
  @apply text-red-600;
}

.status-icon.warning {
  @apply text-yellow-600;
}

.status-spinner {
  @apply w-4 h-4 relative;
}

.spinner-ring {
  @apply w-full h-full border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin;
}

/* 错误消息 */
.error-messages {
  @apply bg-red-50 border border-red-200 rounded-md p-4;
}

.error-header {
  @apply flex items-center gap-2 mb-3;
}

.error-icon {
  @apply w-5 h-5 text-red-600;
}

.error-title {
  @apply font-medium text-red-800;
}

.error-list {
  @apply space-y-2 list-none p-0 m-0;
}

.error-item {
  @apply flex items-center justify-between gap-2 p-2 bg-white rounded border border-red-100;
}

.error-field {
  @apply font-medium text-red-700;
}

.error-message {
  @apply text-red-600 flex-1;
}

.error-fix-button {
  @apply px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded;
  @apply hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500;
}

/* 警告消息 */
.warning-messages {
  @apply bg-yellow-50 border border-yellow-200 rounded-md p-4;
}

.warning-header {
  @apply flex items-center gap-2 mb-3;
}

.warning-icon {
  @apply w-5 h-5 text-yellow-600;
}

.warning-title {
  @apply font-medium text-yellow-800;
}

.warning-list {
  @apply space-y-2 list-none p-0 m-0;
}

.warning-item {
  @apply flex items-center gap-2 p-2 bg-white rounded border border-yellow-100;
}

.warning-field {
  @apply font-medium text-yellow-700;
}

.warning-message {
  @apply text-yellow-600;
}

/* 建议 */
.suggestions {
  @apply bg-blue-50 border border-blue-200 rounded-md p-4;
}

.suggestions-header {
  @apply flex items-center gap-2 mb-3;
}

.suggestions-icon {
  @apply w-5 h-5 text-blue-600;
}

.suggestions-title {
  @apply font-medium text-blue-800;
}

.suggestions-list {
  @apply space-y-2 list-none p-0 m-0;
}

.suggestion-item {
  @apply flex items-center justify-between gap-2 p-2 bg-white rounded border border-blue-100;
}

.suggestion-text {
  @apply text-blue-600 flex-1;
}

.suggestion-button {
  @apply px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded;
  @apply hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

/* 实时反馈 */
.realtime-feedback {
  @apply space-y-2;
}

.feedback-item {
  @apply flex items-center gap-3 p-2 bg-gray-50 rounded border;
}

.feedback-field {
  @apply text-sm font-medium text-gray-700 min-w-0 flex-shrink-0;
}

.feedback-content {
  @apply flex items-center gap-2 flex-1;
}

.feedback-content.info {
  @apply text-blue-600;
}

.feedback-content.success {
  @apply text-green-600;
}

.feedback-content.warning {
  @apply text-yellow-600;
}

.feedback-content.error {
  @apply text-red-600;
}

.feedback-message {
  @apply text-sm;
}

.feedback-progress {
  @apply flex items-center gap-2 ml-auto;
}

.progress-bar {
  @apply w-16 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full transition-all duration-300 ease-out;
}

.progress-fill.info {
  @apply bg-blue-500;
}

.progress-fill.success {
  @apply bg-green-500;
}

.progress-fill.warning {
  @apply bg-yellow-500;
}

.progress-fill.error {
  @apply bg-red-500;
}

.progress-text {
  @apply text-xs font-medium text-gray-600;
}

/* 过渡动画 */
.error-slide-enter-active,
.error-slide-leave-active,
.warning-slide-enter-active,
.warning-slide-leave-active,
.suggestions-slide-enter-active,
.suggestions-slide-leave-active {
  transition: all 0.3s ease;
}

.error-slide-enter-from,
.error-slide-leave-to,
.warning-slide-enter-from,
.warning-slide-leave-to,
.suggestions-slide-enter-from,
.suggestions-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.error-slide-enter-to,
.error-slide-leave-from,
.warning-slide-enter-to,
.warning-slide-leave-from,
.suggestions-slide-enter-to,
.suggestions-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 200px;
}
</style>
