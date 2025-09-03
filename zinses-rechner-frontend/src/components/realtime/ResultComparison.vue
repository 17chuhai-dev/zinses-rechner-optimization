<!--
  结果对比显示组件
  实现新旧计算结果的对比显示功能，包括数值变化高亮和差异可视化
-->

<template>
  <div class="result-comparison" :class="{ 'comparison-compact': compact }">
    <!-- 主要结果对比 -->
    <div class="comparison-main">
      <div class="result-item" v-for="(item, key) in comparisonData" :key="key">
        <div class="result-label">
          {{ getResultLabel(key) }}
        </div>
        
        <div class="result-values">
          <!-- 当前值 -->
          <div class="current-value" :class="getValueChangeClass(item.change)">
            <span class="value-amount">{{ formatValue(item.current, key) }}</span>
            <Transition name="change-indicator" mode="out-in">
              <div v-if="item.change && showChangeIndicators" class="change-indicator">
                <Icon 
                  :name="item.change.type === 'increase' ? 'arrow-up' : 'arrow-down'" 
                  :class="item.change.type === 'increase' ? 'text-green-500' : 'text-red-500'"
                  size="16"
                />
                <span class="change-amount" :class="getChangeAmountClass(item.change)">
                  {{ formatChangeAmount(item.change) }}
                </span>
              </div>
            </Transition>
          </div>
          
          <!-- 变化详情 -->
          <div v-if="item.change && showDetails" class="change-details">
            <div class="change-row">
              <span class="change-label">{{ $t('comparison.previous') }}:</span>
              <span class="change-value previous">{{ formatValue(item.previous, key) }}</span>
            </div>
            <div class="change-row">
              <span class="change-label">{{ $t('comparison.difference') }}:</span>
              <span class="change-value" :class="getChangeAmountClass(item.change)">
                {{ formatDifference(item.change) }}
              </span>
            </div>
            <div v-if="item.change.percentage !== undefined" class="change-row">
              <span class="change-label">{{ $t('comparison.percentageChange') }}:</span>
              <span class="change-value" :class="getChangeAmountClass(item.change)">
                {{ formatPercentage(item.change.percentage) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 对比模式切换 -->
    <div v-if="showModeToggle" class="comparison-modes">
      <div class="mode-toggle">
        <button
          v-for="mode in comparisonModes"
          :key="mode.value"
          @click="currentMode = mode.value"
          :class="['mode-button', { active: currentMode === mode.value }]"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- 对比阈值设置 -->
    <div v-if="showThresholdSettings" class="threshold-settings">
      <div class="threshold-item">
        <label class="threshold-label">{{ $t('comparison.significantChangeThreshold') }}:</label>
        <div class="threshold-input">
          <input
            v-model.number="significantThreshold"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="threshold-field"
          />
          <span class="threshold-unit">%</span>
        </div>
      </div>
    </div>

    <!-- 对比统计 -->
    <div v-if="showStatistics" class="comparison-statistics">
      <div class="stat-item">
        <span class="stat-label">{{ $t('comparison.totalChanges') }}:</span>
        <span class="stat-value">{{ statistics.totalChanges }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ $t('comparison.significantChanges') }}:</span>
        <span class="stat-value">{{ statistics.significantChanges }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ $t('comparison.averageChange') }}:</span>
        <span class="stat-value">{{ formatPercentage(statistics.averageChange) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatGermanCurrency, formatGermanNumber } from '@/utils/germanFormatters'
import Icon from '@/components/ui/Icon.vue'

// 类型定义
interface CalculationResult {
  finalAmount?: number
  totalInterest?: number
  totalContributions?: number
  monthlyPayment?: number
  effectiveRate?: number
  [key: string]: any
}

interface ChangeInfo {
  type: 'increase' | 'decrease'
  absolute: number
  percentage?: number
  isSignificant: boolean
}

interface ComparisonItem {
  current: number
  previous?: number
  change?: ChangeInfo
}

interface ComparisonMode {
  value: 'absolute' | 'percentage' | 'trend'
  label: string
}

// Props定义
interface Props {
  currentResults: CalculationResult
  previousResults?: CalculationResult
  showChangeIndicators?: boolean
  showDetails?: boolean
  showModeToggle?: boolean
  showThresholdSettings?: boolean
  showStatistics?: boolean
  compact?: boolean
  significantThreshold?: number
  comparisonFields?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  showChangeIndicators: true,
  showDetails: false,
  showModeToggle: false,
  showThresholdSettings: false,
  showStatistics: false,
  compact: false,
  significantThreshold: 5,
  comparisonFields: () => ['finalAmount', 'totalInterest', 'totalContributions', 'effectiveRate']
})

// Emits定义
interface Emits {
  modeChange: [mode: string]
  thresholdChange: [threshold: number]
}

const emit = defineEmits<Emits>()

// 响应式数据
const currentMode = ref<'absolute' | 'percentage' | 'trend'>('absolute')
const significantThreshold = ref(props.significantThreshold)

// 对比模式选项
const comparisonModes: ComparisonMode[] = [
  { value: 'absolute', label: 'Absolut' },
  { value: 'percentage', label: 'Prozent' },
  { value: 'trend', label: 'Trend' }
]

// 计算属性
const comparisonData = computed(() => {
  const data: Record<string, ComparisonItem> = {}
  
  props.comparisonFields.forEach(field => {
    const current = props.currentResults[field]
    const previous = props.previousResults?.[field]
    
    if (current !== undefined) {
      const item: ComparisonItem = { current }
      
      if (previous !== undefined && previous !== current) {
        const absolute = current - previous
        const percentage = previous !== 0 ? (absolute / previous) * 100 : 0
        const isSignificant = Math.abs(percentage) >= significantThreshold.value
        
        item.previous = previous
        item.change = {
          type: absolute >= 0 ? 'increase' : 'decrease',
          absolute,
          percentage,
          isSignificant
        }
      }
      
      data[field] = item
    }
  })
  
  return data
})

const statistics = computed(() => {
  const changes = Object.values(comparisonData.value)
    .map(item => item.change)
    .filter(change => change !== undefined)
  
  const totalChanges = changes.length
  const significantChanges = changes.filter(change => change!.isSignificant).length
  const averageChange = totalChanges > 0 
    ? changes.reduce((sum, change) => sum + Math.abs(change!.percentage || 0), 0) / totalChanges
    : 0
  
  return {
    totalChanges,
    significantChanges,
    averageChange
  }
})

// 方法
const getResultLabel = (key: string): string => {
  const labels: Record<string, string> = {
    finalAmount: 'Endkapital',
    totalInterest: 'Gesamtzinsen',
    totalContributions: 'Gesamteinzahlungen',
    monthlyPayment: 'Monatliche Rate',
    effectiveRate: 'Effektiver Zinssatz'
  }
  return labels[key] || key
}

const formatValue = (value: number, key: string): string => {
  if (key === 'effectiveRate') {
    return `${formatGermanNumber(value)}%`
  }
  return formatGermanCurrency(value)
}

const formatChangeAmount = (change: ChangeInfo): string => {
  if (currentMode.value === 'percentage' && change.percentage !== undefined) {
    return formatPercentage(change.percentage)
  }
  return formatGermanCurrency(Math.abs(change.absolute))
}

const formatDifference = (change: ChangeInfo): string => {
  const sign = change.type === 'increase' ? '+' : '-'
  return `${sign}${formatGermanCurrency(Math.abs(change.absolute))}`
}

const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${formatGermanNumber(percentage)}%`
}

const getValueChangeClass = (change?: ChangeInfo): string => {
  if (!change) return ''
  
  const baseClass = change.type === 'increase' ? 'value-increase' : 'value-decrease'
  const significantClass = change.isSignificant ? 'significant-change' : ''
  
  return `${baseClass} ${significantClass}`.trim()
}

const getChangeAmountClass = (change: ChangeInfo): string => {
  return change.type === 'increase' ? 'change-positive' : 'change-negative'
}

// 监听器
watch(currentMode, (newMode) => {
  emit('modeChange', newMode)
})

watch(significantThreshold, (newThreshold) => {
  emit('thresholdChange', newThreshold)
})
</script>

<style scoped>
.result-comparison {
  @apply bg-white rounded-lg border border-gray-200 p-4;
}

.comparison-compact {
  @apply p-3;
}

.comparison-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  @apply border-b border-gray-100 pb-3;
}

.result-item:last-child {
  @apply border-b-0 pb-0;
}

.result-label {
  @apply text-sm font-medium text-gray-700 mb-2;
}

.result-values {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.current-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.value-amount {
  @apply text-lg font-semibold text-gray-900;
}

.value-increase .value-amount {
  @apply text-green-700;
}

.value-decrease .value-amount {
  @apply text-red-700;
}

.significant-change .value-amount {
  @apply font-bold;
}

.change-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.change-amount {
  font-weight: 600;
}

.change-positive {
  @apply text-green-600 bg-green-50;
}

.change-negative {
  @apply text-red-600 bg-red-50;
}

.change-details {
  @apply ml-4 pl-4 border-l-2 border-gray-200;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.change-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.change-label {
  @apply text-xs text-gray-500;
}

.change-value {
  @apply text-xs font-medium;
}

.change-value.previous {
  @apply text-gray-600;
}

.comparison-modes {
  @apply mt-4 pt-4 border-t border-gray-200;
}

.mode-toggle {
  display: flex;
  gap: 0.5rem;
}

.mode-button {
  @apply px-3 py-1 text-sm font-medium rounded-md border;
  @apply border-gray-300 text-gray-700 bg-white;
  @apply hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
  transition: all 0.2s ease;
}

.mode-button.active {
  @apply bg-blue-600 text-white border-blue-600;
}

.threshold-settings {
  @apply mt-4 pt-4 border-t border-gray-200;
}

.threshold-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.threshold-label {
  @apply text-sm font-medium text-gray-700;
}

.threshold-input {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.threshold-field {
  @apply w-16 px-2 py-1 text-sm border border-gray-300 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.threshold-unit {
  @apply text-sm text-gray-500;
}

.comparison-statistics {
  @apply mt-4 pt-4 border-t border-gray-200;
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
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply text-sm font-medium text-gray-900;
}

/* 过渡动画 */
.change-indicator-enter-active,
.change-indicator-leave-active {
  transition: all 0.3s ease;
}

.change-indicator-enter-from,
.change-indicator-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .comparison-main {
    gap: 0.75rem;
  }
  
  .result-item {
    @apply pb-2;
  }
  
  .value-amount {
    @apply text-base;
  }
  
  .change-details {
    @apply ml-2 pl-2;
  }
  
  .mode-toggle {
    flex-wrap: wrap;
  }
  
  .threshold-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
