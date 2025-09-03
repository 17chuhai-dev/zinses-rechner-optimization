<!--
  即时结果显示组件
  专门的即时结果显示组件，支持实时更新计算结果、动画过渡效果、数据格式化显示
  包括结果预览卡片、关键指标高亮、趋势变化提示等功能
-->

<template>
  <div class="instant-results-display" :class="displayClasses">
    <!-- 结果状态指示器 -->
    <div class="results-status-bar">
      <div class="status-indicator" :class="statusIndicatorClass">
        <div class="status-dot"></div>
        <span class="status-text">{{ statusText }}</span>
      </div>

      <div v-if="lastUpdated" class="last-updated">
        <Icon name="clock" size="14" />
        <span>{{ formatLastUpdated(lastUpdated) }}</span>
      </div>
    </div>

    <!-- 主要结果卡片 -->
    <Transition name="result-card-fade" mode="out-in">
      <div v-if="displayResults" key="results" class="results-container">
        <!-- 核心指标卡片 -->
        <div class="primary-result-card" :class="{ 'highlight-change': hasSignificantChange }">
          <div class="result-header">
            <h3 class="result-title">{{ primaryMetric.label }}</h3>
            <div v-if="isCalculating" class="calculating-indicator">
              <div class="spinner"></div>
            </div>
          </div>

          <div class="result-value-container">
            <AnimationTransition
              type="number"
              :value="primaryMetric.value"
              :previous-value="previousPrimaryValue"
              format-type="currency"
              animation-speed="normal"
              easing-function="ease-out"
              @animation-start="onAnimationStart"
              @animation-end="onAnimationEnd"
            >
              <div class="primary-value">
                {{ formatCurrency(primaryMetric.value) }}
              </div>
            </AnimationTransition>

            <!-- 变化指示器 -->
            <div v-if="primaryChange" class="change-indicator" :class="changeIndicatorClass">
              <Icon :name="changeIcon" size="16" />
              <span class="change-text">{{ formatChange(primaryChange) }}</span>
              <span class="change-percentage">({{ formatChangePercentage(primaryChange, previousPrimaryValue) }})</span>
            </div>
          </div>

          <!-- 趋势图表 -->
          <div v-if="showTrendChart && trendData.length > 1" class="trend-chart">
            <svg class="trend-svg" viewBox="0 0 200 40" preserveAspectRatio="none">
              <polyline
                :points="trendPoints"
                fill="none"
                :stroke="trendColor"
                stroke-width="2"
                class="trend-line"
              />
              <circle
                v-for="(point, index) in trendData"
                :key="index"
                :cx="(index / (trendData.length - 1)) * 200"
                :cy="40 - ((point - minTrendValue) / (maxTrendValue - minTrendValue)) * 40"
                r="2"
                :fill="trendColor"
                class="trend-point"
              />
            </svg>
          </div>
        </div>

        <!-- 次要指标网格 -->
        <div class="secondary-metrics-grid">
          <div
            v-for="metric in secondaryMetrics"
            :key="metric.key"
            class="metric-card"
            :class="{ 'metric-highlight': metric.highlight }"
          >
            <div class="metric-header">
              <span class="metric-label">{{ metric.label }}</span>
              <Icon v-if="metric.icon" :name="metric.icon" size="16" class="metric-icon" />
            </div>

            <div class="metric-value">
              <AnimationTransition
                type="number"
                :value="metric.value"
                :format-type="metric.format"
                animation-speed="fast"
                easing-function="ease-out"
              >
                <span>{{ formatMetricValue(metric.value, metric.format) }}</span>
              </AnimationTransition>
            </div>

            <!-- 指标变化 -->
            <div v-if="metric.change" class="metric-change" :class="getChangeClass(metric.change)">
              <Icon :name="getChangeIcon(metric.change)" size="12" />
              <span>{{ formatMetricChange(metric.change, metric.format) }}</span>
            </div>
          </div>
        </div>

        <!-- 详细信息展开区域 -->
        <div v-if="showDetails" class="details-section">
          <button
            class="details-toggle"
            @click="detailsExpanded = !detailsExpanded"
            :aria-expanded="detailsExpanded"
          >
            <span>详细信息</span>
            <Icon name="chevron-down" :class="{ 'rotate-180': detailsExpanded }" size="16" />
          </button>

          <Transition name="details-expand">
            <div v-if="detailsExpanded" class="details-content">
              <div class="details-grid">
                <div
                  v-for="(value, key) in detailsData"
                  :key="key"
                  class="detail-item"
                >
                  <span class="detail-label">{{ getDetailLabel(key) }}</span>
                  <span class="detail-value">{{ formatDetailValue(value, key) }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 快速操作按钮 -->
        <div v-if="showActions" class="quick-actions">
          <button
            v-for="action in quickActions"
            :key="action.key"
            class="action-button"
            :class="action.variant || 'secondary'"
            @click="$emit('action', action.key)"
            :disabled="action.disabled"
          >
            <Icon :name="action.icon" size="16" />
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else key="empty" class="empty-state">
        <div class="empty-icon">
          <Icon name="calculator" size="48" />
        </div>
        <h3 class="empty-title">准备计算</h3>
        <p class="empty-description">输入参数后将显示实时计算结果</p>
      </div>
    </Transition>

    <!-- 错误状态 -->
    <Transition name="error-fade">
      <div v-if="error" class="error-state">
        <div class="error-content">
          <Icon name="alert-circle" size="20" class="error-icon" />
          <div class="error-text">
            <h4>计算错误</h4>
            <p>{{ error }}</p>
          </div>
          <button v-if="showRetry" class="retry-button" @click="$emit('retry')">
            <Icon name="refresh" size="16" />
            <span>重试</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 性能指标（开发模式） -->
    <div v-if="showPerformanceMetrics && performanceData" class="performance-metrics">
      <details class="performance-details">
        <summary>性能指标</summary>
        <div class="performance-grid">
          <div class="performance-item">
            <span>计算时间</span>
            <span>{{ performanceData.calculationTime }}ms</span>
          </div>
          <div class="performance-item">
            <span>渲染时间</span>
            <span>{{ performanceData.renderTime }}ms</span>
          </div>
          <div class="performance-item">
            <span>缓存命中</span>
            <span>{{ performanceData.cacheHitRate }}%</span>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { formatGermanCurrency, formatGermanNumber } from '@/utils/germanFormatters'
import AnimationTransition from './AnimationTransition.vue'
import Icon from '../ui/BaseIcon.vue'
import type { CalculationResult } from '@/types/calculator'

// 类型定义
interface MetricDefinition {
  key: string
  label: string
  value: number
  format: 'currency' | 'number' | 'percentage'
  icon?: string
  highlight?: boolean
  change?: number
}

interface QuickAction {
  key: string
  label: string
  icon: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

interface PerformanceData {
  calculationTime: number
  renderTime: number
  cacheHitRate: number
}

// Props定义
interface Props {
  results?: CalculationResult | null
  previewResults?: Partial<CalculationResult> | null
  isCalculating?: boolean
  isPreviewMode?: boolean
  error?: string | null
  lastUpdated?: Date | null
  showDetails?: boolean
  showActions?: boolean
  showTrendChart?: boolean
  showPerformanceMetrics?: boolean
  quickActions?: QuickAction[]
  performanceData?: PerformanceData | null
  showRetry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isCalculating: false,
  isPreviewMode: false,
  showDetails: true,
  showActions: false,
  showTrendChart: true,
  showPerformanceMetrics: false,
  showRetry: true,
  quickActions: () => []
})

// Emits定义
interface Emits {
  action: [actionKey: string]
  retry: []
  detailsToggle: [expanded: boolean]
}

const emit = defineEmits<Emits>()

// 响应式数据
const detailsExpanded = ref(false)
const previousPrimaryValue = ref(0)
const trendData = ref<number[]>([])
const animationInProgress = ref(false)

// 计算属性
const displayResults = computed(() => {
  return props.results || props.previewResults
})

const displayClasses = computed(() => {
  return {
    'is-calculating': props.isCalculating,
    'is-preview': props.isPreviewMode,
    'has-error': !!props.error,
    'animation-active': animationInProgress.value
  }
})

const statusIndicatorClass = computed(() => {
  if (props.error) return 'status-error'
  if (props.isCalculating) return 'status-calculating'
  if (props.isPreviewMode) return 'status-preview'
  return 'status-ready'
})

const statusText = computed(() => {
  if (props.error) return '计算错误'
  if (props.isCalculating) return '计算中...'
  if (props.isPreviewMode) return '预览模式'
  return '就绪'
})

const primaryMetric = computed((): MetricDefinition => {
  const results = displayResults.value
  if (!results) {
    return {
      key: 'finalAmount',
      label: '最终金额',
      value: 0,
      format: 'currency'
    }
  }

  return {
    key: 'finalAmount',
    label: '最终金额',
    value: results.finalAmount || results.final_amount || 0,
    format: 'currency',
    highlight: true
  }
})

const secondaryMetrics = computed((): MetricDefinition[] => {
  const results = displayResults.value
  if (!results) return []

  return [
    {
      key: 'totalContributions',
      label: '总投入',
      value: results.totalContributions || results.total_contributions || 0,
      format: 'currency',
      icon: 'trending-up'
    },
    {
      key: 'totalInterest',
      label: '总收益',
      value: results.totalInterest || results.total_interest || 0,
      format: 'currency',
      icon: 'dollar-sign'
    },
    {
      key: 'effectiveRate',
      label: '有效收益率',
      value: results.effectiveRate || results.annual_return || 0,
      format: 'percentage',
      icon: 'percent'
    }
  ]
})

const primaryChange = computed(() => {
  const current = primaryMetric.value.value
  const previous = previousPrimaryValue.value
  return current !== previous ? current - previous : null
})

const hasSignificantChange = computed(() => {
  if (!primaryChange.value) return false
  const changePercent = Math.abs(primaryChange.value / previousPrimaryValue.value) * 100
  return changePercent > 5 // 5%以上变化认为是显著变化
})

const changeIndicatorClass = computed(() => {
  if (!primaryChange.value) return ''
  return primaryChange.value > 0 ? 'change-positive' : 'change-negative'
})

const changeIcon = computed(() => {
  if (!primaryChange.value) return 'minus'
  return primaryChange.value > 0 ? 'trending-up' : 'trending-down'
})

const trendColor = computed(() => {
  if (trendData.value.length < 2) return '#3b82f6'
  const latest = trendData.value[trendData.value.length - 1]
  const previous = trendData.value[trendData.value.length - 2]
  return latest > previous ? '#10b981' : latest < previous ? '#ef4444' : '#3b82f6'
})

const trendPoints = computed(() => {
  if (trendData.value.length < 2) return ''

  const points = trendData.value.map((value, index) => {
    const x = (index / (trendData.value.length - 1)) * 200
    const y = 40 - ((value - minTrendValue.value) / (maxTrendValue.value - minTrendValue.value)) * 40
    return `${x},${y}`
  })

  return points.join(' ')
})

const minTrendValue = computed(() => Math.min(...trendData.value))
const maxTrendValue = computed(() => Math.max(...trendData.value))

const detailsData = computed(() => {
  const results = displayResults.value
  if (!results || !results.breakdown) return {}
  return results.breakdown
})

// 方法
const formatCurrency = (value: number): string => {
  return formatGermanCurrency(value)
}

const formatChange = (change: number): string => {
  const sign = change > 0 ? '+' : ''
  return `${sign}${formatGermanCurrency(Math.abs(change))}`
}

const formatChangePercentage = (change: number, base: number): string => {
  if (base === 0) return '0%'
  const percentage = (change / base) * 100
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}%`
}

const formatMetricValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      return formatGermanCurrency(value)
    case 'percentage':
      return `${formatGermanNumber(value)}%`
    default:
      return formatGermanNumber(value)
  }
}

const formatMetricChange = (change: number, format: string): string => {
  const sign = change > 0 ? '+' : ''
  return `${sign}${formatMetricValue(Math.abs(change), format)}`
}

const formatLastUpdated = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 1000) return '刚刚'
  if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`

  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getChangeClass = (change: number): string => {
  return change > 0 ? 'change-positive' : change < 0 ? 'change-negative' : 'change-neutral'
}

const getChangeIcon = (change: number): string => {
  return change > 0 ? 'arrow-up' : change < 0 ? 'arrow-down' : 'minus'
}

const getDetailLabel = (key: string): string => {
  const labels: Record<string, string> = {
    yearlyBreakdown: '年度明细',
    compoundingEffect: '复利效应',
    taxImpact: '税收影响',
    inflationAdjustment: '通胀调整'
  }
  return labels[key] || key
}

const formatDetailValue = (value: any, key: string): string => {
  if (typeof value === 'number') {
    if (key.includes('rate') || key.includes('percentage')) {
      return `${formatGermanNumber(value)}%`
    }
    return formatGermanCurrency(value)
  }
  return String(value)
}

const onAnimationStart = () => {
  animationInProgress.value = true
}

const onAnimationEnd = () => {
  animationInProgress.value = false
}

// 监听器
watch(() => primaryMetric.value.value, (newValue, oldValue) => {
  if (oldValue !== undefined && oldValue !== newValue) {
    previousPrimaryValue.value = oldValue

    // 更新趋势数据
    trendData.value.push(newValue)
    if (trendData.value.length > 10) {
      trendData.value.shift() // 保持最近10个数据点
    }
  }
}, { immediate: true })

watch(detailsExpanded, (expanded) => {
  emit('detailsToggle', expanded)
})

// 生命周期
onMounted(() => {
  if (primaryMetric.value.value > 0) {
    trendData.value = [primaryMetric.value.value]
  }
})
</script>

<style scoped>
.instant-results-display {
  @apply w-full space-y-4;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 结果状态栏 */
.results-status-bar {
  @apply flex items-center justify-between p-3 bg-gray-50 rounded-lg border;
}

.status-indicator {
  @apply flex items-center gap-2;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
  animation: pulse 2s infinite;
}

.status-ready .status-dot {
  @apply bg-green-500;
}

.status-calculating .status-dot {
  @apply bg-blue-500;
}

.status-preview .status-dot {
  @apply bg-yellow-500;
}

.status-error .status-dot {
  @apply bg-red-500;
}

.status-text {
  @apply text-sm font-medium text-gray-700;
}

.last-updated {
  @apply flex items-center gap-1 text-xs text-gray-500;
}

/* 结果容器 */
.results-container {
  @apply space-y-4;
}

/* 主要结果卡片 */
.primary-result-card {
  @apply bg-white rounded-xl shadow-lg border p-6 transition-all duration-300;
}

.primary-result-card.highlight-change {
  @apply ring-2 ring-blue-500 ring-opacity-50 shadow-xl;
  animation: highlight-pulse 1s ease-out;
}

.result-header {
  @apply flex items-center justify-between mb-4;
}

.result-title {
  @apply text-lg font-semibold text-gray-800;
}

.calculating-indicator {
  @apply flex items-center;
}

.spinner {
  @apply w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full;
  animation: spin 1s linear infinite;
}

.result-value-container {
  @apply space-y-3;
}

.primary-value {
  @apply text-3xl font-bold text-gray-900;
  font-variant-numeric: tabular-nums;
}

/* 变化指示器 */
.change-indicator {
  @apply flex items-center gap-2 text-sm font-medium;
}

.change-positive {
  @apply text-green-600;
}

.change-negative {
  @apply text-red-600;
}

.change-text {
  font-variant-numeric: tabular-nums;
}

.change-percentage {
  @apply text-gray-500;
}

/* 趋势图表 */
.trend-chart {
  @apply mt-4 p-3 bg-gray-50 rounded-lg;
}

.trend-svg {
  @apply w-full h-10;
}

.trend-line {
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-point {
  transition: r 0.2s ease;
}

.trend-point:hover {
  r: 3;
}

/* 次要指标网格 */
.secondary-metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.metric-card {
  @apply bg-white rounded-lg border p-4 transition-all duration-200 hover:shadow-md;
}

.metric-highlight {
  @apply bg-blue-50 border-blue-200;
}

.metric-header {
  @apply flex items-center justify-between mb-2;
}

.metric-label {
  @apply text-sm font-medium text-gray-600;
}

.metric-icon {
  @apply text-gray-400;
}

.metric-value {
  @apply text-xl font-semibold text-gray-900 mb-1;
  font-variant-numeric: tabular-nums;
}

.metric-change {
  @apply flex items-center gap-1 text-xs font-medium;
}

/* 详细信息区域 */
.details-section {
  @apply bg-white rounded-lg border;
}

.details-toggle {
  @apply w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors;
}

.details-content {
  @apply border-t p-4;
}

.details-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}

.detail-item {
  @apply flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0;
}

.detail-label {
  @apply text-sm text-gray-600;
}

.detail-value {
  @apply text-sm font-medium text-gray-900;
  font-variant-numeric: tabular-nums;
}

/* 快速操作按钮 */
.quick-actions {
  @apply flex flex-wrap gap-2;
}

.action-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.action-button.secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.action-button.danger {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

.action-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 空状态 */
.empty-state {
  @apply text-center py-12 bg-white rounded-lg border;
}

.empty-icon {
  @apply text-gray-400 mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-700 mb-2;
}

.empty-description {
  @apply text-gray-500;
}

/* 错误状态 */
.error-state {
  @apply bg-red-50 border border-red-200 rounded-lg p-4;
}

.error-content {
  @apply flex items-start gap-3;
}

.error-icon {
  @apply text-red-500 flex-shrink-0 mt-0.5;
}

.error-text h4 {
  @apply font-semibold text-red-800 mb-1;
}

.error-text p {
  @apply text-red-700 text-sm;
}

.retry-button {
  @apply flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors ml-auto;
}

/* 性能指标 */
.performance-metrics {
  @apply mt-4;
}

.performance-details {
  @apply bg-gray-50 rounded-lg border;
}

.performance-details summary {
  @apply p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-100 rounded-lg;
}

.performance-grid {
  @apply grid grid-cols-3 gap-4 p-3 border-t;
}

.performance-item {
  @apply flex flex-col items-center text-center;
}

.performance-item span:first-child {
  @apply text-xs text-gray-500 mb-1;
}

.performance-item span:last-child {
  @apply text-sm font-semibold text-gray-900;
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes highlight-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

/* 过渡动画 */
.result-card-fade-enter-active,
.result-card-fade-leave-active {
  transition: all 0.3s ease;
}

.result-card-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.result-card-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.details-expand-enter-active,
.details-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.details-expand-enter-from,
.details-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.details-expand-enter-to,
.details-expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .primary-value {
    @apply text-2xl;
  }

  .secondary-metrics-grid {
    @apply grid-cols-1;
  }

  .details-grid {
    @apply grid-cols-1;
  }

  .quick-actions {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .instant-results-display {
    color-scheme: dark;
  }

  .primary-result-card,
  .metric-card,
  .details-section,
  .empty-state {
    @apply bg-gray-800 border-gray-700;
  }

  .result-title,
  .primary-value,
  .metric-value,
  .detail-value {
    @apply text-gray-100;
  }

  .metric-label,
  .detail-label,
  .status-text {
    @apply text-gray-300;
  }

  .results-status-bar {
    @apply bg-gray-800 border-gray-700;
  }

  .trend-chart {
    @apply bg-gray-700;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .primary-result-card,
  .metric-card {
    @apply border-2;
  }

  .change-positive {
    @apply text-green-800;
  }

  .change-negative {
    @apply text-red-800;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .primary-result-card,
  .metric-card,
  .action-button,
  .details-toggle {
    transition: none;
  }

  .spinner {
    animation: none;
  }

  .status-dot {
    animation: none;
  }

  .highlight-pulse {
    animation: none;
  }
}
</style>
