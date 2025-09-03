<!--
  实时数据增强计算器组件
  为计算器添加实时数据集成功能
-->

<template>
  <div class="real-time-enhancement">
    <!-- 实时数据状态指示器 -->
    <div class="data-status-bar" :class="statusBarClass">
      <div class="status-content">
        <div class="status-indicator">
          <div class="status-dot" :class="statusDotClass"></div>
          <span class="status-text">{{ statusText }}</span>
        </div>
        
        <div class="data-info">
          <span class="data-age">{{ formatDataAge }}</span>
          <button
            v-if="canRefresh"
            type="button"
            class="refresh-btn"
            @click="refreshData"
            :disabled="isRefreshing"
          >
            <svg 
              class="w-4 h-4"
              :class="{ 'animate-spin': isRefreshing }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 实时数据建议卡片 -->
    <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-container">
      <div class="suggestions-header">
        <h3 class="suggestions-title">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Aktuelle Marktempfehlungen
        </h3>
        <button
          type="button"
          class="close-suggestions"
          @click="hideSuggestions"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="suggestions-list">
        <div
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="suggestion-item"
          :class="suggestion.type"
        >
          <div class="suggestion-icon">
            <svg v-if="suggestion.type === 'rate-change'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <svg v-else-if="suggestion.type === 'market-risk'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div class="suggestion-content">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-description">{{ suggestion.description }}</div>
            <button
              v-if="suggestion.action"
              type="button"
              class="suggestion-action"
              @click="applySuggestion(suggestion)"
            >
              {{ suggestion.action.text }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时数据输入增强 -->
    <div v-if="showRateInputs" class="rate-inputs-enhancement">
      <div class="enhancement-header">
        <h3 class="enhancement-title">Aktuelle Zinssätze verwenden</h3>
        <div class="enhancement-toggle">
          <label class="toggle-switch">
            <input
              v-model="useRealTimeRates"
              type="checkbox"
              class="toggle-input"
            />
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">Automatisch aktualisieren</span>
        </div>
      </div>
      
      <div v-if="useRealTimeRates" class="rate-options">
        <div class="rate-option">
          <label class="rate-label">Zinssatz-Typ:</label>
          <select v-model="selectedRateType" class="rate-select">
            <option value="ecb">EZB Leitzins ({{ formatRate(currentRates.ecb) }})</option>
            <option value="mortgage">Hypothekenzins ({{ formatRate(currentRates.mortgage) }})</option>
            <option value="savings">Sparzins ({{ formatRate(currentRates.savings) }})</option>
            <option value="investment">Anlagezins ({{ formatRate(currentRates.investment) }})</option>
          </select>
        </div>
        
        <div class="rate-preview">
          <span class="preview-label">Ausgewählter Zinssatz:</span>
          <span class="preview-value">{{ formatRate(selectedRate) }}</span>
          <button
            type="button"
            class="apply-rate-btn"
            @click="applySelectedRate"
          >
            Übernehmen
          </button>
        </div>
      </div>
    </div>

    <!-- 市场环境警告 -->
    <div v-if="showMarketWarning" class="market-warning" :class="warningLevel">
      <div class="warning-icon">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div class="warning-content">
        <div class="warning-title">{{ warningTitle }}</div>
        <div class="warning-message">{{ warningMessage }}</div>
      </div>
      <button
        type="button"
        class="warning-close"
        @click="dismissWarning"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useInterestRatesOnly } from '@/composables/useRealTimeData'

interface Props {
  calculatorType: string
  showSuggestions?: boolean
  showRateInputs?: boolean
  showMarketWarning?: boolean
}

interface Suggestion {
  id: string
  type: 'rate-change' | 'market-risk' | 'optimization'
  title: string
  description: string
  action?: {
    text: string
    value: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  showSuggestions: true,
  showRateInputs: true,
  showMarketWarning: true
})

const emit = defineEmits<{
  rateSelected: [rate: number]
  suggestionApplied: [suggestion: Suggestion]
  warningDismissed: []
}>()

// 使用实时数据
const {
  isOnline,
  isLoading,
  dataStatus,
  interestRates,
  currentInterestRate,
  currentMortgageRate,
  formatDataAge,
  refreshData: refreshRealTimeData
} = useInterestRatesOnly()

// 组件状态
const useRealTimeRates = ref(false)
const selectedRateType = ref('ecb')
const isRefreshing = ref(false)
const showSuggestionsState = ref(true)
const showWarningState = ref(true)

// 计算属性
const statusBarClass = computed(() => ({
  'status-online': isOnline.value && dataStatus.value === 'fresh',
  'status-stale': dataStatus.value === 'stale',
  'status-offline': !isOnline.value || dataStatus.value === 'error'
}))

const statusDotClass = computed(() => ({
  'dot-online': isOnline.value && dataStatus.value === 'fresh',
  'dot-stale': dataStatus.value === 'stale',
  'dot-offline': !isOnline.value || dataStatus.value === 'error'
}))

const statusText = computed(() => {
  if (!isOnline.value) return 'Offline'
  if (dataStatus.value === 'loading') return 'Wird geladen...'
  if (dataStatus.value === 'error') return 'Fehler'
  if (dataStatus.value === 'stale') return 'Daten veraltet'
  return 'Aktuelle Daten'
})

const canRefresh = computed(() => isOnline.value && !isLoading.value)

const currentRates = computed(() => ({
  ecb: currentInterestRate.value,
  mortgage: currentMortgageRate.value,
  savings: interestRates.value?.savingsRate || 0.5,
  investment: (interestRates.value?.germanBund10y || 2.4) + 2
}))

const selectedRate = computed(() => {
  return currentRates.value[selectedRateType.value as keyof typeof currentRates.value]
})

const suggestions = computed((): Suggestion[] => {
  if (!interestRates.value || !showSuggestionsState.value) return []

  const suggestions: Suggestion[] = []

  // 利率变化建议
  if (interestRates.value.ecb > 4.0) {
    suggestions.push({
      id: 'high-rates',
      type: 'rate-change',
      title: 'Hohe Zinsen nutzen',
      description: 'Die aktuellen Zinssätze sind attraktiv für Sparer. Erwägen Sie höhere Sparraten.',
      action: {
        text: 'Zinssatz übernehmen',
        value: interestRates.value.ecb
      }
    })
  }

  // 房贷建议
  if (props.calculatorType === 'mortgage' && interestRates.value.mortgageRate > 4.5) {
    suggestions.push({
      id: 'mortgage-rates',
      type: 'market-risk',
      title: 'Hypothekenzinsen gestiegen',
      description: 'Die Hypothekenzinsen sind auf einem hohen Niveau. Prüfen Sie alternative Finanzierungsoptionen.',
      action: {
        text: 'Aktuellen Zinssatz verwenden',
        value: interestRates.value.mortgageRate
      }
    })
  }

  return suggestions
})

const warningLevel = computed(() => {
  if (!interestRates.value) return 'warning-info'
  
  const ecbRate = interestRates.value.ecb
  if (ecbRate > 5.0) return 'warning-high'
  if (ecbRate > 4.0) return 'warning-medium'
  return 'warning-info'
})

const warningTitle = computed(() => {
  const level = warningLevel.value
  if (level === 'warning-high') return 'Hohe Zinsen'
  if (level === 'warning-medium') return 'Erhöhte Zinsen'
  return 'Marktinformation'
})

const warningMessage = computed(() => {
  if (!interestRates.value) return 'Marktdaten werden geladen...'
  
  const ecbRate = interestRates.value.ecb
  if (ecbRate > 5.0) {
    return 'Die Zinssätze befinden sich auf einem sehr hohen Niveau. Dies kann Ihre Finanzplanung erheblich beeinflussen.'
  }
  if (ecbRate > 4.0) {
    return 'Die Zinssätze sind gestiegen. Berücksichtigen Sie dies in Ihren Berechnungen.'
  }
  return 'Die aktuellen Marktbedingungen sind stabil.'
})

// 方法
const refreshData = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await refreshRealTimeData()
  } finally {
    isRefreshing.value = false
  }
}

const formatRate = (rate: number): string => {
  return `${rate.toFixed(2)}%`
}

const applySelectedRate = () => {
  emit('rateSelected', selectedRate.value)
}

const applySuggestion = (suggestion: Suggestion) => {
  emit('suggestionApplied', suggestion)
  if (suggestion.action) {
    emit('rateSelected', suggestion.action.value)
  }
}

const hideSuggestions = () => {
  showSuggestionsState.value = false
}

const dismissWarning = () => {
  showWarningState.value = false
  emit('warningDismissed')
}

// 监听器
watch(useRealTimeRates, (enabled) => {
  if (enabled && selectedRate.value) {
    emit('rateSelected', selectedRate.value)
  }
})

watch(selectedRateType, () => {
  if (useRealTimeRates.value) {
    emit('rateSelected', selectedRate.value)
  }
})

onMounted(() => {
  // 根据计算器类型设置默认利率类型
  switch (props.calculatorType) {
    case 'mortgage':
      selectedRateType.value = 'mortgage'
      break
    case 'savings':
      selectedRateType.value = 'savings'
      break
    case 'investment':
      selectedRateType.value = 'investment'
      break
    default:
      selectedRateType.value = 'ecb'
  }
})
</script>

<style scoped>
.real-time-enhancement {
  @apply space-y-4;
}

.data-status-bar {
  @apply px-4 py-2 rounded-lg border;
}

.status-online {
  @apply bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800;
}

.status-stale {
  @apply bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800;
}

.status-offline {
  @apply bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800;
}

.status-content {
  @apply flex items-center justify-between;
}

.status-indicator {
  @apply flex items-center space-x-2;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.dot-online {
  @apply bg-green-500;
}

.dot-stale {
  @apply bg-yellow-500;
}

.dot-offline {
  @apply bg-red-500;
}

.status-text {
  @apply text-sm font-medium;
}

.status-online .status-text {
  @apply text-green-800 dark:text-green-400;
}

.status-stale .status-text {
  @apply text-yellow-800 dark:text-yellow-400;
}

.status-offline .status-text {
  @apply text-red-800 dark:text-red-400;
}

.data-info {
  @apply flex items-center space-x-2;
}

.data-age {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.refresh-btn {
  @apply p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
         transition-colors disabled:opacity-50;
}

.suggestions-container {
  @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4;
}

.suggestions-header {
  @apply flex items-center justify-between mb-3;
}

.suggestions-title {
  @apply text-sm font-semibold text-blue-800 dark:text-blue-400 flex items-center;
}

.close-suggestions {
  @apply p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200;
}

.suggestions-list {
  @apply space-y-2;
}

.suggestion-item {
  @apply flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border;
}

.suggestion-item.rate-change {
  @apply border-green-200 dark:border-green-800;
}

.suggestion-item.market-risk {
  @apply border-orange-200 dark:border-orange-800;
}

.suggestion-item.optimization {
  @apply border-blue-200 dark:border-blue-800;
}

.suggestion-icon {
  @apply flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center;
}

.rate-change .suggestion-icon {
  @apply bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400;
}

.market-risk .suggestion-icon {
  @apply bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400;
}

.optimization .suggestion-icon {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400;
}

.suggestion-content {
  @apply flex-1 space-y-1;
}

.suggestion-title {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.suggestion-description {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.suggestion-action {
  @apply text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors;
}

.rate-inputs-enhancement {
  @apply bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4;
}

.enhancement-header {
  @apply flex items-center justify-between mb-3;
}

.enhancement-title {
  @apply text-sm font-semibold text-gray-900 dark:text-white;
}

.enhancement-toggle {
  @apply flex items-center space-x-2;
}

.toggle-switch {
  @apply relative inline-block w-10 h-6;
}

.toggle-input {
  @apply sr-only;
}

.toggle-slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-colors;
}

.toggle-input:checked + .toggle-slider {
  @apply bg-blue-600;
}

.toggle-slider:before {
  @apply absolute content-[''] h-4 w-4 left-1 bottom-1 bg-white rounded-full transition-transform;
}

.toggle-input:checked + .toggle-slider:before {
  @apply transform translate-x-4;
}

.toggle-label {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.rate-options {
  @apply space-y-3;
}

.rate-option {
  @apply flex items-center space-x-3;
}

.rate-label {
  @apply text-sm text-gray-700 dark:text-gray-300 min-w-0 flex-shrink-0;
}

.rate-select {
  @apply flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.rate-preview {
  @apply flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600;
}

.preview-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.preview-value {
  @apply text-sm font-bold text-gray-900 dark:text-white;
}

.apply-rate-btn {
  @apply px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors;
}

.market-warning {
  @apply flex items-start space-x-3 p-4 rounded-lg border;
}

.warning-info {
  @apply bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800;
}

.warning-medium {
  @apply bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800;
}

.warning-high {
  @apply bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800;
}

.warning-icon {
  @apply flex-shrink-0;
}

.warning-info .warning-icon {
  @apply text-blue-600 dark:text-blue-400;
}

.warning-medium .warning-icon {
  @apply text-yellow-600 dark:text-yellow-400;
}

.warning-high .warning-icon {
  @apply text-red-600 dark:text-red-400;
}

.warning-content {
  @apply flex-1 space-y-1;
}

.warning-title {
  @apply text-sm font-semibold;
}

.warning-info .warning-title {
  @apply text-blue-800 dark:text-blue-400;
}

.warning-medium .warning-title {
  @apply text-yellow-800 dark:text-yellow-400;
}

.warning-high .warning-title {
  @apply text-red-800 dark:text-red-400;
}

.warning-message {
  @apply text-xs;
}

.warning-info .warning-message {
  @apply text-blue-700 dark:text-blue-300;
}

.warning-medium .warning-message {
  @apply text-yellow-700 dark:text-yellow-300;
}

.warning-high .warning-message {
  @apply text-red-700 dark:text-red-300;
}

.warning-close {
  @apply flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200;
}
</style>
