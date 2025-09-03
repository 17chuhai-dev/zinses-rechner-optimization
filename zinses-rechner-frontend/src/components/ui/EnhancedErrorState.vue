<!--
  增强错误状态组件
  提供用户友好的错误显示、恢复建议和操作选项
-->

<template>
  <div 
    class="enhanced-error-state"
    :class="containerClasses"
    role="alert"
    :aria-live="'assertive'"
  >
    <!-- 错误图标 -->
    <div class="error-icon" :class="iconClasses">
      <svg v-if="type === 'network'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      
      <svg v-else-if="type === 'validation'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <svg v-else-if="type === 'calculation'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      
      <svg v-else-if="type === 'permission'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      
      <svg v-else class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    
    <!-- 错误内容 -->
    <div class="error-content">
      <!-- 标题 -->
      <h3 class="error-title">{{ title || getDefaultTitle() }}</h3>
      
      <!-- 描述 -->
      <p class="error-description">{{ description || getDefaultDescription() }}</p>
      
      <!-- 详细信息（可折叠） -->
      <div v-if="details || errorCode" class="error-details">
        <button
          type="button"
          class="details-toggle"
          @click="showDetails = !showDetails"
          :aria-expanded="showDetails"
        >
          <span>{{ showDetails ? 'Details ausblenden' : 'Details anzeigen' }}</span>
          <svg 
            class="w-4 h-4 ml-1 transition-transform"
            :class="{ 'rotate-180': showDetails }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <Transition name="slide-down">
          <div v-if="showDetails" class="details-content">
            <div v-if="errorCode" class="error-code">
              <strong>Fehlercode:</strong> {{ errorCode }}
            </div>
            <div v-if="details" class="error-message">
              <strong>Details:</strong> {{ details }}
            </div>
            <div v-if="timestamp" class="error-timestamp">
              <strong>Zeit:</strong> {{ formatTimestamp(timestamp) }}
            </div>
          </div>
        </Transition>
      </div>
      
      <!-- 建议操作 -->
      <div v-if="suggestions && suggestions.length > 0" class="error-suggestions">
        <h4 class="suggestions-title">Lösungsvorschläge:</h4>
        <ul class="suggestions-list">
          <li v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item">
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="error-actions">
      <button
        v-if="retryable"
        type="button"
        class="retry-button"
        @click="handleRetry"
        :disabled="retrying"
      >
        <svg v-if="retrying" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {{ retrying ? 'Wird wiederholt...' : 'Erneut versuchen' }}
      </button>
      
      <button
        v-if="reportable"
        type="button"
        class="report-button"
        @click="handleReport"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Fehler melden
      </button>
      
      <button
        v-if="dismissible"
        type="button"
        class="dismiss-button"
        @click="handleDismiss"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Schließen
      </button>
      
      <!-- 自定义操作 -->
      <slot name="actions" />
    </div>
    
    <!-- 联系支持 -->
    <div v-if="showSupport" class="support-info">
      <p class="support-text">
        Benötigen Sie weitere Hilfe? 
        <a href="mailto:support@example.com" class="support-link">
          Kontaktieren Sie unseren Support
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResponsive } from '@/composables/useResponsive'

interface Props {
  // 错误类型
  type?: 'general' | 'network' | 'validation' | 'calculation' | 'permission' | 'timeout'
  
  // 错误信息
  title?: string
  description?: string
  details?: string
  errorCode?: string
  timestamp?: Date
  
  // 建议操作
  suggestions?: string[]
  
  // 交互选项
  retryable?: boolean
  reportable?: boolean
  dismissible?: boolean
  showSupport?: boolean
  
  // 样式
  variant?: 'default' | 'minimal' | 'detailed'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'general',
  retryable: true,
  reportable: true,
  dismissible: true,
  showSupport: false,
  variant: 'default',
  size: 'md'
})

const emit = defineEmits<{
  retry: []
  report: [error: { type: string; title: string; description: string; details?: string; errorCode?: string }]
  dismiss: []
}>()

const { isMobile } = useResponsive()

// 状态
const showDetails = ref(false)
const retrying = ref(false)

// 样式类
const containerClasses = computed(() => [
  'enhanced-error-state',
  `variant-${props.variant}`,
  `size-${props.size}`,
  `type-${props.type}`,
  {
    'is-mobile': isMobile.value
  }
])

const iconClasses = computed(() => [
  'error-icon',
  `type-${props.type}`
])

// 默认标题和描述
const getDefaultTitle = (): string => {
  switch (props.type) {
    case 'network':
      return 'Verbindungsfehler'
    case 'validation':
      return 'Eingabefehler'
    case 'calculation':
      return 'Berechnungsfehler'
    case 'permission':
      return 'Zugriff verweigert'
    case 'timeout':
      return 'Zeitüberschreitung'
    default:
      return 'Ein Fehler ist aufgetreten'
  }
}

const getDefaultDescription = (): string => {
  switch (props.type) {
    case 'network':
      return 'Die Verbindung zum Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung.'
    case 'validation':
      return 'Die eingegebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.'
    case 'calculation':
      return 'Die Berechnung konnte nicht durchgeführt werden. Bitte überprüfen Sie Ihre Parameter.'
    case 'permission':
      return 'Sie haben nicht die erforderlichen Berechtigungen für diese Aktion.'
    case 'timeout':
      return 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.'
    default:
      return 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.'
  }
}

// 时间戳格式化
const formatTimestamp = (timestamp: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp)
}

// 事件处理
const handleRetry = async () => {
  retrying.value = true
  
  try {
    emit('retry')
    
    // 模拟重试延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    retrying.value = false
  }
}

const handleReport = () => {
  const errorInfo = {
    type: props.type,
    title: props.title || getDefaultTitle(),
    description: props.description || getDefaultDescription(),
    details: props.details,
    errorCode: props.errorCode
  }
  
  emit('report', errorInfo)
}

const handleDismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
.enhanced-error-state {
  @apply flex flex-col items-center text-center p-8 bg-red-50 dark:bg-red-900/10 
         border border-red-200 dark:border-red-800 rounded-lg;
}

.error-icon {
  @apply mb-6 p-3 rounded-full;
}

.error-icon.type-general {
  @apply bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400;
}

.error-icon.type-network {
  @apply bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400;
}

.error-icon.type-validation {
  @apply bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400;
}

.error-icon.type-calculation {
  @apply bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400;
}

.error-icon.type-permission {
  @apply bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400;
}

.error-icon.type-timeout {
  @apply bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400;
}

.error-content {
  @apply mb-6 max-w-md;
}

.error-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
}

.error-description {
  @apply text-gray-600 dark:text-gray-400 mb-4;
}

.error-details {
  @apply text-left bg-white dark:bg-gray-800 rounded-lg p-4 mb-4;
}

.details-toggle {
  @apply flex items-center text-sm text-gray-500 dark:text-gray-400 
         hover:text-gray-700 dark:hover:text-gray-300 transition-colors;
}

.details-content {
  @apply mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm;
}

.error-code,
.error-message,
.error-timestamp {
  @apply text-gray-600 dark:text-gray-400;
}

.error-suggestions {
  @apply text-left bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4;
}

.suggestions-title {
  @apply text-sm font-medium text-blue-900 dark:text-blue-300 mb-2;
}

.suggestions-list {
  @apply space-y-1;
}

.suggestion-item {
  @apply text-sm text-blue-700 dark:text-blue-400 flex items-start;
}

.suggestion-item::before {
  content: "•";
  @apply mr-2 text-blue-500;
}

.error-actions {
  @apply flex flex-wrap gap-3 justify-center;
}

.retry-button {
  @apply flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg
         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors;
}

.report-button {
  @apply flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg
         hover:bg-gray-700 transition-colors;
}

.dismiss-button {
  @apply flex items-center px-4 py-2 bg-gray-300 dark:bg-gray-600 
         text-gray-700 dark:text-gray-300 rounded-lg
         hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors;
}

.support-info {
  @apply mt-6 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.support-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.support-link {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

/* 变体样式 */
.variant-minimal {
  @apply p-4 bg-transparent border-none;
}

.variant-minimal .error-icon {
  @apply mb-3 p-2;
}

.variant-minimal .error-title {
  @apply text-lg;
}

.variant-detailed {
  @apply p-10 max-w-2xl;
}

/* 尺寸变体 */
.size-sm {
  @apply p-4;
}

.size-sm .error-icon {
  @apply mb-3;
}

.size-sm .error-title {
  @apply text-lg;
}

.size-lg {
  @apply p-12;
}

.size-lg .error-icon {
  @apply mb-8;
}

.size-lg .error-title {
  @apply text-2xl;
}

/* 移动端优化 */
.is-mobile {
  @apply p-6;
}

.is-mobile .error-actions {
  @apply flex-col w-full;
}

.is-mobile .retry-button,
.is-mobile .report-button,
.is-mobile .dismiss-button {
  @apply w-full justify-center;
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  @apply transition-all duration-200;
}

.slide-down-enter-from,
.slide-down-leave-to {
  @apply opacity-0 transform -translate-y-2;
}
</style>
