<!--
  Freistellungsauftrag可视化组件
  提供免税额度使用情况的多种可视化展示
-->

<template>
  <div class="freistellungsauftrag-visualization">
    <!-- 可视化类型选择器 -->
    <div class="visualization-header">
      <h3 class="visualization-title">Freibetrag-Visualisierung</h3>
      <div class="view-selector">
        <button
          v-for="view in availableViews"
          :key="view.type"
          @click="currentView = view.type"
          class="view-button"
          :class="{ 'active': currentView === view.type }"
        >
          <Icon :name="view.icon" size="16" />
          <span>{{ view.label }}</span>
        </button>
      </div>
    </div>

    <!-- 圆环图视图 -->
    <div v-if="currentView === 'donut'" class="donut-chart-container">
      <div class="chart-wrapper">
        <svg class="donut-chart" :width="chartSize" :height="chartSize" viewBox="0 0 200 200">
          <!-- 背景圆环 -->
          <circle
            cx="100"
            cy="100"
            :r="radius"
            fill="none"
            stroke="#e5e7eb"
            :stroke-width="strokeWidth"
          />

          <!-- 已使用部分 -->
          <circle
            cx="100"
            cy="100"
            :r="radius"
            fill="none"
            stroke="#f97316"
            :stroke-width="strokeWidth"
            :stroke-dasharray="usedCircumference + ' ' + totalCircumference"
            :stroke-dashoffset="totalCircumference / 4"
            class="used-arc"
          />

          <!-- 已分配但未使用部分 -->
          <circle
            cx="100"
            cy="100"
            :r="radius"
            fill="none"
            stroke="#3b82f6"
            :stroke-width="strokeWidth"
            :stroke-dasharray="allocatedCircumference + ' ' + totalCircumference"
            :stroke-dashoffset="totalCircumference / 4 - usedCircumference"
            class="allocated-arc"
          />

          <!-- 中心文本 */
          <text x="100" y="90" text-anchor="middle" class="center-label">Genutzt</text>
          <text x="100" y="110" text-anchor="middle" class="center-value">
            {{ formatPercentage(usagePercentage) }}
          </text>
          <text x="100" y="125" text-anchor="middle" class="center-amount">
            {{ formatCurrency(totalUsed) }}
          </text>
        </svg>

        <!-- 图例 -->
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color used"></div>
            <span class="legend-label">Genutzt: {{ formatCurrency(totalUsed) }}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color allocated"></div>
            <span class="legend-label">Zugeteilt: {{ formatCurrency(totalAllocated - totalUsed) }}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color available"></div>
            <span class="legend-label">Verfügbar: {{ formatCurrency(totalAvailable - totalAllocated) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 进度条视图 -->
    <div v-if="currentView === 'progress'" class="progress-chart-container">
      <div class="progress-chart">
        <div class="progress-header">
          <h4>Freibetrag-Nutzung</h4>
          <div class="progress-stats">
            <span class="stat-item">
              <Icon name="target" size="14" />
              Ziel: {{ formatCurrency(totalAvailable) }}
            </span>
            <span class="stat-item">
              <Icon name="trending-up" size="14" />
              Genutzt: {{ formatPercentage(usagePercentage) }}
            </span>
          </div>
        </div>

        <div class="progress-bars">
          <!-- 主进度条 -->
          <div class="main-progress">
            <div class="progress-track">
              <div
                class="progress-fill used"
                :style="{ width: `${usagePercentage}%` }"
              ></div>
              <div
                class="progress-fill allocated"
                :style="{
                  width: `${allocationPercentage}%`,
                  left: `${usagePercentage}%`
                }"
              ></div>
            </div>
            <div class="progress-markers">
              <div class="marker" style="left: 25%">25%</div>
              <div class="marker" style="left: 50%">50%</div>
              <div class="marker" style="left: 75%">75%</div>
            </div>
          </div>

          <!-- 银行分解进度条 -->
          <div class="bank-breakdown">
            <h5>Nach Banken</h5>
            <div
              v-for="(bank, bankName) in bankStats"
              :key="bankName"
              class="bank-progress"
            >
              <div class="bank-info">
                <span class="bank-name">{{ bankName }}</span>
                <span class="bank-amount">{{ formatCurrency(bank.used) }}</span>
              </div>
              <div class="bank-progress-bar">
                <div
                  class="bank-progress-fill"
                  :style="{ width: `${(bank.used / totalAvailable) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 堆叠柱状图视图 -->
    <div v-if="currentView === 'stacked'" class="stacked-chart-container">
      <div class="stacked-chart">
        <h4>Verteilung nach Kontotyp</h4>
        <div class="chart-bars">
          <div
            v-for="(type, typeName) in accountTypeStats"
            :key="typeName"
            class="account-type-bar"
          >
            <div class="bar-header">
              <span class="type-name">{{ getAccountTypeLabel(typeName) }}</span>
              <span class="type-amount">{{ formatCurrency(type.used) }}</span>
            </div>
            <div class="bar-container">
              <div class="bar-background"></div>
              <div
                class="bar-fill"
                :style="{
                  width: `${(type.used / Math.max(...Object.values(accountTypeStats).map(t => t.used))) * 100}%`,
                  backgroundColor: getAccountTypeColor(typeName)
                }"
              ></div>
            </div>
            <div class="bar-details">
              <span class="detail-item">{{ type.count }} Konten</span>
              <span class="detail-item">{{ formatPercentage((type.used / totalUsed) * 100) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间线视图 */
    <div v-if="currentView === 'timeline'" class="timeline-chart-container">
      <div class="timeline-chart">
        <h4>Nutzungsverlauf</h4>
        <div class="timeline">
          <div
            v-for="(month, index) in monthlyUsage"
            :key="index"
            class="timeline-item"
          >
            <div class="timeline-marker">
              <div
                class="marker-dot"
                :class="{ 'active': month.used > 0 }"
              ></div>
            </div>
            <div class="timeline-content">
              <div class="timeline-month">{{ month.month }}</div>
              <div class="timeline-amount">{{ formatCurrency(month.used) }}</div>
              <div class="timeline-bar">
                <div
                  class="timeline-fill"
                  :style="{ width: `${(month.used / maxMonthlyUsage) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 比较视图 */
    <div v-if="currentView === 'comparison'" class="comparison-chart-container">
      <div class="comparison-chart">
        <h4>Vergleich mit Vorjahr</h4>
        <div class="comparison-bars">
          <div class="comparison-item">
            <div class="comparison-label">Aktuelles Jahr</div>
            <div class="comparison-bar current">
              <div
                class="comparison-fill"
                :style="{ width: `${usagePercentage}%` }"
              ></div>
              <span class="comparison-value">{{ formatCurrency(totalUsed) }}</span>
            </div>
          </div>
          <div class="comparison-item">
            <div class="comparison-label">Vorjahr</div>
            <div class="comparison-bar previous">
              <div
                class="comparison-fill"
                :style="{ width: `${previousYearUsagePercentage}%` }"
              ></div>
              <span class="comparison-value">{{ formatCurrency(previousYearUsed) }}</span>
            </div>
          </div>
        </div>

        <div class="comparison-insights">
          <div class="insight-item" :class="improvementClass">
            <Icon :name="improvementIcon" size="16" />
            <span>{{ improvementText }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计摘要 -->
    <div class="statistics-summary">
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="shield" size="20" />
          </div>
          <div class="summary-content">
            <div class="summary-label">Gesamter Freibetrag</div>
            <div class="summary-value">{{ formatCurrency(totalAvailable) }}</div>
          </div>
        </div>

        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="trending-up" size="20" />
          </div>
          <div class="summary-content">
            <div class="summary-label">Nutzungsgrad</div>
            <div class="summary-value">{{ formatPercentage(usagePercentage) }}</div>
          </div>
        </div>

        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="piggy-bank" size="20" />
          </div>
          <div class="summary-content">
            <div class="summary-label">Steuerersparnis</div>
            <div class="summary-value">{{ formatCurrency(taxSavings) }}</div>
          </div>
        </div>

        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="calendar" size="20" />
          </div>
          <div class="summary-content">
            <div class="summary-label">Verbleibende Monate</div>
            <div class="summary-value">{{ remainingMonths }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import type { FreistellungsauftragAllocation } from '@/types/FreistellungsauftragTypes'

// Props定义
interface Props {
  allocations: FreistellungsauftragAllocation[]
  totalAvailable: number
  isMarried?: boolean
  previousYearData?: {
    used: number
    available: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  isMarried: false,
  previousYearData: () => ({ used: 0, available: 1000 })
})

// 响应式数据
const currentView = ref<'donut' | 'progress' | 'stacked' | 'timeline' | 'comparison'>('donut')
const chartSize = ref(300)
const radius = ref(70)
const strokeWidth = ref(20)

// 可用视图
const availableViews = [
  { type: 'donut', icon: 'pie-chart', label: 'Kreisdiagramm' },
  { type: 'progress', icon: 'bar-chart-2', label: 'Fortschritt' },
  { type: 'stacked', icon: 'bar-chart', label: 'Gestapelt' },
  { type: 'timeline', icon: 'activity', label: 'Zeitverlauf' },
  { type: 'comparison', icon: 'trending-up', label: 'Vergleich' }
] as const

// 计算属性
const totalUsed = computed(() => {
  return props.allocations.reduce((sum, allocation) => sum + allocation.used, 0)
})

const totalAllocated = computed(() => {
  return props.allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
})

const usagePercentage = computed(() => {
  return props.totalAvailable > 0 ? (totalUsed.value / props.totalAvailable) * 100 : 0
})

const allocationPercentage = computed(() => {
  const allocatedButNotUsed = totalAllocated.value - totalUsed.value
  return props.totalAvailable > 0 ? (allocatedButNotUsed / props.totalAvailable) * 100 : 0
})

const taxSavings = computed(() => {
  return totalUsed.value * 0.25 // 25% Abgeltungssteuer
})

const remainingMonths = computed(() => {
  const currentMonth = new Date().getMonth()
  return 12 - currentMonth
})

// 圆环图计算
const totalCircumference = computed(() => 2 * Math.PI * radius.value)
const usedCircumference = computed(() => (usagePercentage.value / 100) * totalCircumference.value)
const allocatedCircumference = computed(() => (allocationPercentage.value / 100) * totalCircumference.value)

// 银行统计
const bankStats = computed(() => {
  return props.allocations.reduce((stats, allocation) => {
    if (!stats[allocation.bankName]) {
      stats[allocation.bankName] = { used: 0, allocated: 0, count: 0 }
    }
    stats[allocation.bankName].used += allocation.used
    stats[allocation.bankName].allocated += allocation.amount
    stats[allocation.bankName].count += 1
    return stats
  }, {} as Record<string, { used: number; allocated: number; count: number }>)
})

// 账户类型统计
const accountTypeStats = computed(() => {
  return props.allocations.reduce((stats, allocation) => {
    if (!stats[allocation.accountType]) {
      stats[allocation.accountType] = { used: 0, allocated: 0, count: 0 }
    }
    stats[allocation.accountType].used += allocation.used
    stats[allocation.accountType].allocated += allocation.amount
    stats[allocation.accountType].count += 1
    return stats
  }, {} as Record<string, { used: number; allocated: number; count: number }>)
})

// 月度使用情况（模拟数据）
const monthlyUsage = computed(() => {
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const currentMonth = new Date().getMonth()

  return months.map((month, index) => ({
    month,
    used: index <= currentMonth ? (totalUsed.value / (currentMonth + 1)) : 0
  }))
})

const maxMonthlyUsage = computed(() => {
  return Math.max(...monthlyUsage.value.map(m => m.used))
})

// 前一年比较
const previousYearUsed = computed(() => props.previousYearData?.used || 0)
const previousYearUsagePercentage = computed(() => {
  const previousAvailable = props.previousYearData?.available || 1000
  return previousAvailable > 0 ? (previousYearUsed.value / previousAvailable) * 100 : 0
})

const improvementClass = computed(() => {
  const improvement = usagePercentage.value - previousYearUsagePercentage.value
  if (improvement > 10) return 'improvement-good'
  if (improvement > 0) return 'improvement-slight'
  if (improvement < -10) return 'improvement-poor'
  return 'improvement-neutral'
})

const improvementIcon = computed(() => {
  const improvement = usagePercentage.value - previousYearUsagePercentage.value
  if (improvement > 0) return 'trending-up'
  if (improvement < 0) return 'trending-down'
  return 'minus'
})

const improvementText = computed(() => {
  const improvement = usagePercentage.value - previousYearUsagePercentage.value
  if (improvement > 10) return `Deutlich bessere Nutzung (+${improvement.toFixed(1)}%)`
  if (improvement > 0) return `Leicht bessere Nutzung (+${improvement.toFixed(1)}%)`
  if (improvement < -10) return `Schlechtere Nutzung (${improvement.toFixed(1)}%)`
  if (improvement < 0) return `Etwas schlechtere Nutzung (${improvement.toFixed(1)}%)`
  return 'Ähnliche Nutzung wie im Vorjahr'
})

// 方法
const getAccountTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    depot: 'Wertpapierdepot',
    savings: 'Sparkonto',
    fixed: 'Festgeld',
    etf: 'ETF-Sparplan',
    other: 'Sonstiges'
  }
  return labels[type] || type
}

const getAccountTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    depot: '#3b82f6',
    savings: '#10b981',
    fixed: '#f59e0b',
    etf: '#8b5cf6',
    other: '#6b7280'
  }
  return colors[type] || '#6b7280'
}
</script>

<style scoped>
.freistellungsauftrag-visualization {
  @apply space-y-6;
}

/* 可视化头部 */
.visualization-header {
  @apply flex items-center justify-between mb-6;
}

.visualization-title {
  @apply text-lg font-semibold text-gray-800;
}

.view-selector {
  @apply flex gap-2;
}

.view-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm rounded-md;
  @apply text-gray-600 hover:text-gray-900 hover:bg-gray-100;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors;
}

.view-button.active {
  @apply bg-blue-100 text-blue-700;
}

/* 圆环图 */
.donut-chart-container {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.chart-wrapper {
  @apply flex flex-col lg:flex-row items-center gap-8;
}

.donut-chart {
  @apply max-w-full h-auto;
}

.used-arc {
  @apply transition-all duration-500;
}

.allocated-arc {
  @apply transition-all duration-500;
}

.center-label {
  @apply text-xs fill-gray-600;
}

.center-value {
  @apply text-lg font-bold fill-gray-900;
}

.center-amount {
  @apply text-xs fill-gray-600;
}

.chart-legend {
  @apply space-y-3;
}

.legend-item {
  @apply flex items-center gap-3;
}

.legend-color {
  @apply w-4 h-4 rounded-full;
}

.legend-color.used {
  @apply bg-orange-500;
}

.legend-color.allocated {
  @apply bg-blue-500;
}

.legend-color.available {
  @apply bg-gray-300;
}

.legend-label {
  @apply text-sm text-gray-700;
}

/* 进度条图 */
.progress-chart-container {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.progress-header {
  @apply flex items-center justify-between mb-6;
}

.progress-header h4 {
  @apply text-lg font-semibold text-gray-800;
}

.progress-stats {
  @apply flex gap-4 text-sm text-gray-600;
}

.stat-item {
  @apply flex items-center gap-1;
}

.main-progress {
  @apply mb-8;
}

.progress-track {
  @apply relative w-full h-8 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply absolute top-0 h-full transition-all duration-500;
}

.progress-fill.used {
  @apply bg-gradient-to-r from-orange-400 to-orange-500;
}

.progress-fill.allocated {
  @apply bg-gradient-to-r from-blue-400 to-blue-500;
}

.progress-markers {
  @apply relative mt-2;
}

.marker {
  @apply absolute text-xs text-gray-500 transform -translate-x-1/2;
}

.bank-breakdown h5 {
  @apply text-sm font-medium text-gray-700 mb-4;
}

.bank-progress {
  @apply mb-4;
}

.bank-info {
  @apply flex justify-between items-center mb-2;
}

.bank-name {
  @apply text-sm font-medium text-gray-700;
}

.bank-amount {
  @apply text-sm text-gray-600;
}

.bank-progress-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.bank-progress-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}

/* 堆叠柱状图 */
.stacked-chart-container {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.stacked-chart h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.chart-bars {
  @apply space-y-4;
}

.account-type-bar {
  @apply space-y-2;
}

.bar-header {
  @apply flex justify-between items-center;
}

.type-name {
  @apply text-sm font-medium text-gray-700;
}

.type-amount {
  @apply text-sm text-gray-600;
}

.bar-container {
  @apply relative w-full h-6 bg-gray-200 rounded-full overflow-hidden;
}

.bar-background {
  @apply absolute inset-0 bg-gray-200;
}

.bar-fill {
  @apply h-full transition-all duration-500 rounded-full;
}

.bar-details {
  @apply flex justify-between text-xs text-gray-500;
}

/* 时间线图 */
.timeline-chart-container {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.timeline-chart h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.timeline {
  @apply space-y-4;
}

.timeline-item {
  @apply flex items-center gap-4;
}

.timeline-marker {
  @apply flex-shrink-0;
}

.marker-dot {
  @apply w-3 h-3 bg-gray-300 rounded-full transition-colors;
}

.marker-dot.active {
  @apply bg-blue-500;
}

.timeline-content {
  @apply flex-1 space-y-1;
}

.timeline-month {
  @apply text-sm font-medium text-gray-700;
}

.timeline-amount {
  @apply text-xs text-gray-600;
}

.timeline-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.timeline-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}

/* 比较图 */
.comparison-chart-container {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.comparison-chart h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.comparison-bars {
  @apply space-y-4 mb-6;
}

.comparison-item {
  @apply space-y-2;
}

.comparison-label {
  @apply text-sm font-medium text-gray-700;
}

.comparison-bar {
  @apply relative w-full h-8 bg-gray-200 rounded-full overflow-hidden;
}

.comparison-bar.current .comparison-fill {
  @apply bg-blue-500;
}

.comparison-bar.previous .comparison-fill {
  @apply bg-gray-400;
}

.comparison-fill {
  @apply h-full transition-all duration-500;
}

.comparison-value {
  @apply absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-white;
}

.comparison-insights {
  @apply pt-4 border-t border-gray-200;
}

.insight-item {
  @apply flex items-center gap-2 text-sm;
}

.insight-item.improvement-good {
  @apply text-green-600;
}

.insight-item.improvement-slight {
  @apply text-blue-600;
}

.insight-item.improvement-neutral {
  @apply text-gray-600;
}

.insight-item.improvement-poor {
  @apply text-red-600;
}

/* 统计摘要 */
.statistics-summary {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.summary-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.summary-item {
  @apply flex items-center gap-4 p-4 bg-gray-50 rounded-lg;
}

.summary-icon {
  @apply flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600;
}

.summary-content {
  @apply flex-1;
}

.summary-label {
  @apply text-sm text-gray-600 mb-1;
}

.summary-value {
  @apply text-lg font-bold text-gray-900;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .chart-wrapper {
    @apply flex-col;
  }

  .view-selector {
    @apply flex-wrap;
  }
}

@media (max-width: 768px) {
  .visualization-header {
    @apply flex-col items-start gap-4;
  }

  .view-selector {
    @apply w-full justify-between;
  }

  .progress-header {
    @apply flex-col items-start gap-2;
  }

  .progress-stats {
    @apply flex-col gap-1;
  }

  .summary-grid {
    @apply grid-cols-1;
  }

  .comparison-value {
    @apply relative right-auto top-auto transform-none text-gray-700 mt-1;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .donut-chart-container,
  .progress-chart-container,
  .stacked-chart-container,
  .timeline-chart-container,
  .comparison-chart-container,
  .statistics-summary {
    @apply bg-gray-800 border-gray-700;
  }

  .visualization-title,
  .progress-header h4,
  .stacked-chart h4,
  .timeline-chart h4,
  .comparison-chart h4 {
    @apply text-gray-100;
  }

  .view-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-700;
  }

  .view-button.active {
    @apply bg-blue-900 text-blue-300;
  }

  .center-label,
  .center-amount {
    @apply fill-gray-300;
  }

  .center-value {
    @apply fill-gray-100;
  }

  .legend-label,
  .bank-name,
  .type-name,
  .timeline-month,
  .comparison-label,
  .summary-label {
    @apply text-gray-300;
  }

  .bank-amount,
  .type-amount,
  .timeline-amount {
    @apply text-gray-400;
  }

  .summary-item {
    @apply bg-gray-700;
  }

  .summary-icon {
    @apply bg-blue-900 text-blue-300;
  }

  .summary-value {
    @apply text-gray-100;
  }

  .comparison-insights {
    @apply border-gray-700;
  }
}
</style>
