<!--
  错误状态显示组件
  创建用户友好的错误状态显示界面，包括错误类型识别、德语错误消息和修复建议
-->

<template>
  <div class="error-display" :class="[`error-${severity}`, { 'error-compact': compact }]">
    <!-- 错误图标和标题 -->
    <div class="error-header">
      <div class="error-icon">
        <Icon :name="getErrorIcon()" :size="compact ? 20 : 24" />
      </div>
      <div class="error-title">
        <h4>{{ getErrorTitle() }}</h4>
        <p v-if="showTimestamp" class="error-timestamp">
          {{ formatTimestamp(timestamp) }}
        </p>
      </div>
    </div>

    <!-- 错误消息 -->
    <div class="error-message">
      <p class="primary-message">{{ getPrimaryMessage() }}</p>
      <p v-if="error.details" class="secondary-message">{{ error.details }}</p>
    </div>

    <!-- 错误详情（可展开） -->
    <div v-if="error.technicalDetails && showTechnicalDetails" class="error-details">
      <button 
        @click="showDetails = !showDetails"
        class="details-toggle"
        :aria-expanded="showDetails"
      >
        <Icon name="chevron-down" :class="{ 'rotate-180': showDetails }" size="16" />
        {{ showDetails ? $t('error.hideDetails') : $t('error.showDetails') }}
      </button>
      
      <Transition name="details-expand">
        <div v-if="showDetails" class="technical-details">
          <div class="detail-section">
            <h5>{{ $t('error.technicalInfo') }}</h5>
            <pre class="error-code">{{ error.technicalDetails }}</pre>
          </div>
          <div v-if="error.stack" class="detail-section">
            <h5>{{ $t('error.stackTrace') }}</h5>
            <pre class="error-stack">{{ error.stack }}</pre>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 修复建议 */
    <div v-if="suggestions.length > 0" class="error-suggestions">
      <h5>{{ $t('error.suggestions') }}</h5>
      <ul class="suggestion-list">
        <li v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item">
          <Icon name="lightbulb" size="16" class="suggestion-icon" />
          <span>{{ suggestion }}</span>
        </li>
      </ul>
    </div>

    <!-- 操作按钮 -->
    <div class="error-actions">
      <button 
        v-if="showRetryButton"
        @click="handleRetry"
        class="action-button primary"
        :disabled="retrying"
      >
        <Icon v-if="retrying" name="loading" size="16" class="animate-spin" />
        <Icon v-else name="refresh" size="16" />
        {{ retrying ? $t('error.retrying') : $t('error.retry') }}
      </button>
      
      <button 
        v-if="showReportButton"
        @click="handleReport"
        class="action-button secondary"
      >
        <Icon name="flag" size="16" />
        {{ $t('error.report') }}
      </button>
      
      <button 
        v-if="showDismissButton"
        @click="handleDismiss"
        class="action-button tertiary"
      >
        <Icon name="x" size="16" />
        {{ $t('error.dismiss') }}
      </button>
    </div>

    <!-- 错误统计（调试模式） -->
    <div v-if="showStatistics && statistics" class="error-statistics">
      <div class="stat-item">
        <span class="stat-label">{{ $t('error.occurrences') }}:</span>
        <span class="stat-value">{{ statistics.count }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ $t('error.firstOccurred') }}:</span>
        <span class="stat-value">{{ formatTimestamp(statistics.firstOccurred) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ $t('error.lastOccurred') }}:</span>
        <span class="stat-value">{{ formatTimestamp(statistics.lastOccurred) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'

// 错误类型定义
interface CalculationError {
  type: 'validation' | 'calculation' | 'network' | 'timeout' | 'worker' | 'cache' | 'unknown'
  code?: string
  message: string
  details?: string
  technicalDetails?: string
  stack?: string
  field?: string
  calculatorId?: string
}

interface ErrorStatistics {
  count: number
  firstOccurred: Date
  lastOccurred: Date
}

// Props定义
interface Props {
  error: CalculationError
  severity?: 'warning' | 'error' | 'critical'
  compact?: boolean
  showRetryButton?: boolean
  showReportButton?: boolean
  showDismissButton?: boolean
  showTechnicalDetails?: boolean
  showTimestamp?: boolean
  showStatistics?: boolean
  timestamp?: Date
  statistics?: ErrorStatistics
  retrying?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'error',
  compact: false,
  showRetryButton: true,
  showReportButton: false,
  showDismissButton: true,
  showTechnicalDetails: false,
  showTimestamp: true,
  showStatistics: false,
  timestamp: () => new Date(),
  retrying: false
})

// Emits定义
interface Emits {
  retry: []
  report: [error: CalculationError]
  dismiss: []
}

const emit = defineEmits<Emits>()

// 响应式数据
const showDetails = ref(false)

// 计算属性
const suggestions = computed(() => {
  const suggestions: string[] = []
  
  switch (props.error.type) {
    case 'validation':
      suggestions.push('Überprüfen Sie Ihre Eingabewerte')
      suggestions.push('Stellen Sie sicher, dass alle Pflichtfelder ausgefüllt sind')
      if (props.error.field) {
        suggestions.push(`Korrigieren Sie das Feld "${props.error.field}"`)
      }
      break
      
    case 'calculation':
      suggestions.push('Versuchen Sie es mit anderen Eingabewerten')
      suggestions.push('Reduzieren Sie die Komplexität der Berechnung')
      suggestions.push('Kontaktieren Sie den Support, wenn das Problem weiterhin besteht')
      break
      
    case 'network':
      suggestions.push('Überprüfen Sie Ihre Internetverbindung')
      suggestions.push('Versuchen Sie es in ein paar Minuten erneut')
      suggestions.push('Laden Sie die Seite neu')
      break
      
    case 'timeout':
      suggestions.push('Die Berechnung dauert zu lange')
      suggestions.push('Vereinfachen Sie Ihre Eingaben')
      suggestions.push('Versuchen Sie es später erneut')
      break
      
    case 'worker':
      suggestions.push('Ein technischer Fehler ist aufgetreten')
      suggestions.push('Laden Sie die Seite neu')
      suggestions.push('Versuchen Sie einen anderen Browser')
      break
      
    case 'cache':
      suggestions.push('Löschen Sie den Browser-Cache')
      suggestions.push('Laden Sie die Seite neu')
      break
      
    default:
      suggestions.push('Versuchen Sie es erneut')
      suggestions.push('Laden Sie die Seite neu')
      suggestions.push('Kontaktieren Sie den Support')
  }
  
  return suggestions
})

// 方法
const getErrorIcon = (): string => {
  switch (props.severity) {
    case 'warning':
      return 'exclamation-triangle'
    case 'critical':
      return 'exclamation-circle'
    default:
      return 'x-circle'
  }
}

const getErrorTitle = (): string => {
  switch (props.error.type) {
    case 'validation':
      return 'Eingabefehler'
    case 'calculation':
      return 'Berechnungsfehler'
    case 'network':
      return 'Verbindungsfehler'
    case 'timeout':
      return 'Zeitüberschreitung'
    case 'worker':
      return 'Technischer Fehler'
    case 'cache':
      return 'Cache-Fehler'
    default:
      return 'Unbekannter Fehler'
  }
}

const getPrimaryMessage = (): string => {
  if (props.error.message) {
    return props.error.message
  }
  
  switch (props.error.type) {
    case 'validation':
      return 'Die eingegebenen Werte sind ungültig.'
    case 'calculation':
      return 'Die Berechnung konnte nicht durchgeführt werden.'
    case 'network':
      return 'Es besteht keine Verbindung zum Server.'
    case 'timeout':
      return 'Die Berechnung hat zu lange gedauert.'
    case 'worker':
      return 'Ein technischer Fehler ist bei der Berechnung aufgetreten.'
    case 'cache':
      return 'Es gab ein Problem mit dem Zwischenspeicher.'
    default:
      return 'Ein unerwarteter Fehler ist aufgetreten.'
  }
}

const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

const handleRetry = () => {
  emit('retry')
}

const handleReport = () => {
  emit('report', props.error)
}

const handleDismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
.error-display {
  @apply rounded-lg border p-4;
  background: #fef2f2;
  border-color: #fecaca;
}

.error-warning {
  background: #fffbeb;
  border-color: #fed7aa;
}

.error-critical {
  background: #fef2f2;
  border-color: #fca5a5;
}

.error-compact {
  @apply p-3;
}

.error-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.error-icon {
  flex-shrink: 0;
  @apply text-red-500;
}

.error-warning .error-icon {
  @apply text-amber-500;
}

.error-critical .error-icon {
  @apply text-red-600;
}

.error-title h4 {
  @apply text-lg font-semibold text-red-800 mb-1;
  margin: 0;
}

.error-warning .error-title h4 {
  @apply text-amber-800;
}

.error-critical .error-title h4 {
  @apply text-red-900;
}

.error-timestamp {
  @apply text-sm text-red-600;
  margin: 0;
}

.error-message {
  margin-bottom: 1rem;
}

.primary-message {
  @apply text-red-800 font-medium mb-2;
  margin: 0;
}

.secondary-message {
  @apply text-red-700 text-sm;
  margin: 0;
}

.error-details {
  margin-bottom: 1rem;
}

.details-toggle {
  @apply flex items-center gap-2 text-sm font-medium text-red-700;
  @apply hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
  @apply rounded px-2 py-1 -mx-2 -my-1;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.details-toggle svg {
  transition: transform 0.2s ease;
}

.technical-details {
  @apply mt-3 pt-3 border-t border-red-200;
}

.detail-section {
  margin-bottom: 1rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h5 {
  @apply text-sm font-semibold text-red-800 mb-2;
  margin: 0;
}

.error-code,
.error-stack {
  @apply text-xs text-red-700 bg-red-100 p-2 rounded border;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
}

.error-suggestions {
  margin-bottom: 1rem;
}

.error-suggestions h5 {
  @apply text-sm font-semibold text-red-800 mb-2;
  margin: 0;
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  @apply text-sm text-red-700 mb-2;
}

.suggestion-item:last-child {
  margin-bottom: 0;
}

.suggestion-icon {
  flex-shrink: 0;
  @apply text-amber-500 mt-0.5;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.error-actions:last-child {
  margin-bottom: 0;
}

.action-button {
  @apply inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button.primary {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.action-button.secondary {
  @apply bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500;
}

.action-button.tertiary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500;
}

.error-statistics {
  @apply pt-3 border-t border-red-200;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  @apply text-sm text-red-600;
}

.stat-value {
  @apply text-sm font-medium text-red-800;
}

/* 过渡动画 */
.details-expand-enter-active,
.details-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.details-expand-enter-from,
.details-expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.details-expand-enter-to,
.details-expand-leave-from {
  max-height: 500px;
  opacity: 1;
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .error-header {
    gap: 0.5rem;
  }
  
  .error-title h4 {
    @apply text-base;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .action-button {
    justify-content: center;
  }
}
</style>
