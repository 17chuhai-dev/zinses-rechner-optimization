<!--
  实时结果显示组件
  专门用于显示实时计算结果，支持动画过渡、预览模式、结果对比等功能
-->

<template>
  <div class="realtime-results" :class="{ 'results-preview': isPreviewMode, 'results-loading': isCalculating }">
    <!-- 结果头部 -->
    <div class="results-header">
      <div class="results-title">
        <h3>{{ $t('results.title') }}</h3>
        <div class="results-status">
          <span v-if="isPreviewMode" class="status-badge preview">
            {{ $t('results.preview') }}
          </span>
          <span v-else-if="isCalculating" class="status-badge calculating">
            {{ $t('results.calculating') }}
          </span>
          <span v-else class="status-badge final">
            {{ $t('results.final') }}
          </span>
        </div>
      </div>
      
      <!-- 最后更新时间 -->
      <div v-if="lastCalculated" class="last-updated">
        <span class="update-label">{{ $t('results.lastUpdated') }}:</span>
        <span class="update-time">{{ formatTime(lastCalculated) }}</span>
      </div>
    </div>

    <!-- 加载指示器 -->
    <LoadingIndicator
      v-if="isCalculating"
      state="calculating"
      :progress="calculationProgress"
      :calculator-name="calculatorName"
      :show-progress="true"
      compact
    />

    <!-- 结果内容 -->
    <Transition name="results-fade" mode="out-in">
      <div v-if="displayResults" key="results" class="results-content">
        <!-- 主要结果 -->
        <div class="primary-results">
          <AnimationTransition
            :trigger="resultChangeKey"
            animation="number-change"
            :duration="300"
          >
            <div class="result-card primary">
              <div class="result-label">{{ $t('results.finalAmount') }}</div>
              <div class="result-value primary-value">
                {{ formatCurrency(displayResults.finalAmount || 0) }}
              </div>
              <div v-if="resultsDiff?.finalAmountDiff" class="result-change">
                <span :class="resultsDiff.finalAmountDiff > 0 ? 'change-positive' : 'change-negative'">
                  {{ formatCurrencyChange(resultsDiff.finalAmountDiff) }}
                </span>
              </div>
            </div>
          </AnimationTransition>
        </div>

        <!-- 次要结果 -->
        <div class="secondary-results">
          <AnimationTransition
            :trigger="resultChangeKey"
            animation="slide-up"
            :duration="200"
            :delay="100"
          >
            <div class="result-grid">
              <div class="result-card">
                <div class="result-label">{{ $t('results.totalInterest') }}</div>
                <div class="result-value">
                  {{ formatCurrency(displayResults.totalInterest || 0) }}
                </div>
                <div v-if="resultsDiff?.totalInterestDiff" class="result-change">
                  <span :class="resultsDiff.totalInterestDiff > 0 ? 'change-positive' : 'change-negative'">
                    {{ formatCurrencyChange(resultsDiff.totalInterestDiff) }}
                  </span>
                </div>
              </div>

              <div class="result-card">
                <div class="result-label">{{ $t('results.totalContributions') }}</div>
                <div class="result-value">
                  {{ formatCurrency(displayResults.totalContributions || 0) }}
                </div>
              </div>

              <div class="result-card">
                <div class="result-label">{{ $t('results.effectiveRate') }}</div>
                <div class="result-value">
                  {{ formatPercentage(displayResults.effectiveRate || 0) }}
                </div>
                <div v-if="resultsDiff?.effectiveRateDiff" class="result-change">
                  <span :class="resultsDiff.effectiveRateDiff > 0 ? 'change-positive' : 'change-negative'">
                    {{ formatPercentageChange(resultsDiff.effectiveRateDiff) }}
                  </span>
                </div>
              </div>
            </div>
          </AnimationTransition>
        </div>

        <!-- 详细信息 -->
        <div v-if="showDetails && displayResults.breakdown" class="results-details">
          <button 
            class="details-toggle"
            @click="detailsExpanded = !detailsExpanded"
            :aria-expanded="detailsExpanded"
          >
            <span>{{ $t('results.details') }}</span>
            <svg 
              class="toggle-icon" 
              :class="{ 'rotated': detailsExpanded }"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>

          <Transition name="details-expand">
            <div v-if="detailsExpanded" class="details-content">
              <div class="breakdown-grid">
                <div v-for="(value, key) in displayResults.breakdown" :key="key" class="breakdown-item">
                  <span class="breakdown-label">{{ $t(`results.breakdown.${key}`) }}</span>
                  <span class="breakdown-value">{{ formatValue(value, key) }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else key="empty" class="results-empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 14h.01M12 11h.01M12 17V7a5 5 0 00-10 0v10a5 5 0 0010 0z" />
          </svg>
        </div>
        <h4>{{ $t('results.empty.title') }}</h4>
        <p>{{ $t('results.empty.description') }}</p>
      </div>
    </Transition>

    <!-- 错误显示 -->
    <ErrorDisplay
      v-if="error"
      :error="error"
      :show-retry="true"
      @retry="$emit('retry')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LoadingIndicator from './LoadingIndicator.vue'
import AnimationTransition from './AnimationTransition.vue'
import ErrorDisplay from './ErrorDisplay.vue'
import type { CalculationResult } from '@/types/calculator'

// Props定义
interface Props {
  results?: CalculationResult | null
  previewResults?: Partial<CalculationResult> | null
  isCalculating?: boolean
  isPreviewMode?: boolean
  calculationProgress?: number
  calculatorName?: string
  lastCalculated?: Date | null
  error?: string | null
  showDetails?: boolean
  resultsDiff?: {
    finalAmountDiff: number
    totalInterestDiff: number
    effectiveRateDiff: number
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  isCalculating: false,
  isPreviewMode: false,
  calculationProgress: 0,
  showDetails: true
})

// Emits定义
interface Emits {
  retry: []
}

const emit = defineEmits<Emits>()

// 组合函数
const { t } = useI18n()

// 响应式数据
const detailsExpanded = ref(false)
const resultChangeKey = ref(0)

// 计算属性
const displayResults = computed(() => {
  return props.results || props.previewResults
})

// 监听结果变化，触发动画
watch(displayResults, (newResults, oldResults) => {
  if (newResults && oldResults && newResults !== oldResults) {
    resultChangeKey.value++
  }
}, { deep: true })

// 工具方法
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatCurrencyChange = (value: number): string => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatCurrency(Math.abs(value))}`
}

const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

const formatPercentageChange = (value: number): string => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatPercentage(Math.abs(value))}`
}

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

const formatValue = (value: any, key: string): string => {
  if (typeof value === 'number') {
    if (key.includes('rate') || key.includes('percentage')) {
      return formatPercentage(value)
    } else {
      return formatCurrency(value)
    }
  }
  return String(value)
}
</script>

<style scoped>
.realtime-results {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
  transition: all 0.3s ease;
}

.results-preview {
  @apply border-blue-200 bg-blue-50;
}

.results-loading {
  @apply opacity-75;
}

/* 结果头部 */
.results-header {
  @apply flex justify-between items-start mb-6;
}

.results-title {
  @apply flex items-center gap-3;
}

.results-title h3 {
  @apply text-lg font-semibold text-gray-900 m-0;
}

.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.status-badge.preview {
  @apply bg-blue-100 text-blue-800;
}

.status-badge.calculating {
  @apply bg-yellow-100 text-yellow-800;
}

.status-badge.final {
  @apply bg-green-100 text-green-800;
}

.last-updated {
  @apply text-sm text-gray-500;
}

.update-label {
  @apply font-medium;
}

/* 结果内容 */
.results-content {
  @apply space-y-6;
}

.primary-results .result-card {
  @apply bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg;
}

.primary-value {
  @apply text-3xl font-bold;
}

.secondary-results .result-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.result-card {
  @apply bg-gray-50 p-4 rounded-lg border border-gray-200;
  transition: all 0.2s ease;
}

.result-card:hover {
  @apply shadow-md border-gray-300;
}

.result-label {
  @apply text-sm font-medium text-gray-600 mb-2;
}

.result-value {
  @apply text-xl font-semibold text-gray-900;
}

.result-change {
  @apply mt-2 text-sm;
}

.change-positive {
  @apply text-green-600;
}

.change-negative {
  @apply text-red-600;
}

/* 详细信息 */
.details-toggle {
  @apply flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg;
  @apply hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.toggle-icon {
  @apply w-5 h-5 transition-transform duration-200;
}

.toggle-icon.rotated {
  @apply transform rotate-180;
}

.breakdown-grid {
  @apply grid grid-cols-2 gap-3 mt-4;
}

.breakdown-item {
  @apply flex justify-between items-center p-2 bg-white rounded border;
}

.breakdown-label {
  @apply text-sm text-gray-600;
}

.breakdown-value {
  @apply text-sm font-medium text-gray-900;
}

/* 空状态 */
.results-empty {
  @apply text-center py-12;
}

.empty-icon {
  @apply w-16 h-16 mx-auto mb-4 text-gray-400;
}

.results-empty h4 {
  @apply text-lg font-medium text-gray-900 mb-2;
}

.results-empty p {
  @apply text-gray-600;
}

/* 过渡动画 */
.results-fade-enter-active,
.results-fade-leave-active {
  transition: all 0.3s ease;
}

.results-fade-enter-from,
.results-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.details-expand-enter-active,
.details-expand-leave-active {
  transition: all 0.3s ease;
}

.details-expand-enter-from,
.details-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.details-expand-enter-to,
.details-expand-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}
</style>
