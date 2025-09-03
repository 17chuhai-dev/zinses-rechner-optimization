<!--
  税前税后对比组件
  直观展示税前税后收益对比
-->

<template>
  <div class="tax-comparison-widget">
    <!-- 组件头部 -->
    <div class="widget-header">
      <h3 class="widget-title">
        <Icon name="bar-chart-2" size="20" />
        Steuervergleich: Brutto vs. Netto
      </h3>
      <div class="header-actions">
        <button @click="toggleView" class="view-toggle">
          <Icon :name="viewMode === 'bars' ? 'pie-chart' : 'bar-chart'" size="16" />
          {{ viewMode === 'bars' ? 'Kreisdiagramm' : 'Balkendiagramm' }}
        </button>
        <button @click="exportComparison" class="export-button">
          <Icon name="download" size="16" />
          Exportieren
        </button>
      </div>
    </div>

    <!-- 主要对比指标 -->
    <div class="comparison-metrics">
      <div class="metric-pair">
        <div class="metric-card gross">
          <div class="metric-header">
            <Icon name="trending-up" size="20" />
            <span>Brutto-Ertrag</span>
          </div>
          <div class="metric-value">{{ formatCurrency(grossReturn) }}</div>
          <div class="metric-detail">Vor Steuern</div>
        </div>

        <div class="comparison-arrow">
          <Icon name="arrow-right" size="24" />
          <div class="tax-impact">
            <span class="tax-label">Steuern</span>
            <span class="tax-amount">-{{ formatCurrency(totalTax) }}</span>
            <span class="tax-rate">({{ formatPercentage(effectiveTaxRate) }})</span>
          </div>
        </div>

        <div class="metric-card net">
          <div class="metric-header">
            <Icon name="check-circle" size="20" />
            <span>Netto-Ertrag</span>
          </div>
          <div class="metric-value">{{ formatCurrency(netReturn) }}</div>
          <div class="metric-detail">Nach Steuern</div>
        </div>
      </div>
    </div>

    <!-- 可视化对比 -->
    <div class="visualization-container">
      <!-- 柱状图视图 -->
      <div v-if="viewMode === 'bars'" class="bars-view">
        <div class="comparison-bars">
          <div class="bar-group">
            <div class="bar-label">Brutto</div>
            <div class="bar-container">
              <div class="bar gross-bar" :style="{ height: '100%' }">
                <span class="bar-value">{{ formatCurrency(grossReturn) }}</span>
              </div>
            </div>
          </div>

          <div class="bar-group">
            <div class="bar-label">Steuern</div>
            <div class="bar-container">
              <div class="bar tax-bar" :style="{ height: `${(totalTax / grossReturn) * 100}%` }">
                <span class="bar-value">{{ formatCurrency(totalTax) }}</span>
              </div>
            </div>
          </div>

          <div class="bar-group">
            <div class="bar-label">Netto</div>
            <div class="bar-container">
              <div class="bar net-bar" :style="{ height: `${(netReturn / grossReturn) * 100}%` }">
                <span class="bar-value">{{ formatCurrency(netReturn) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bars-legend">
          <div class="legend-item">
            <div class="legend-color gross"></div>
            <span>Brutto-Ertrag (100%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color tax"></div>
            <span>Steuern ({{ formatPercentage(effectiveTaxRate) }})</span>
          </div>
          <div class="legend-item">
            <div class="legend-color net"></div>
            <span>Netto-Ertrag ({{ formatPercentage(1 - effectiveTaxRate) }})</span>
          </div>
        </div>
      </div>

      <!-- 饼图视图 -->
      <div v-if="viewMode === 'pie'" class="pie-view">
        <div class="pie-container">
          <canvas ref="pieCanvas" class="pie-chart"></canvas>
        </div>
        <div class="pie-legend">
          <div class="legend-item">
            <div class="legend-color net"></div>
            <div class="legend-content">
              <span class="legend-label">Netto-Ertrag</span>
              <span class="legend-value">{{ formatCurrency(netReturn) }}</span>
              <span class="legend-percentage">{{ formatPercentage(1 - effectiveTaxRate) }}</span>
            </div>
          </div>
          <div class="legend-item">
            <div class="legend-color tax"></div>
            <div class="legend-content">
              <span class="legend-label">Steuern</span>
              <span class="legend-value">{{ formatCurrency(totalTax) }}</span>
              <span class="legend-percentage">{{ formatPercentage(effectiveTaxRate) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细税收分解 -->
    <div class="tax-breakdown">
      <h4>Steuerliche Aufschlüsselung</h4>
      <div class="breakdown-items">
        <div
          v-for="(item, index) in taxBreakdownItems"
          :key="index"
          class="breakdown-item"
        >
          <div class="item-header">
            <Icon :name="item.icon" size="16" />
            <span class="item-name">{{ item.name }}</span>
            <span class="item-rate">{{ formatPercentage(item.rate) }}</span>
          </div>
          <div class="item-bar">
            <div
              class="item-fill"
              :style="{
                width: `${(item.amount / totalTax) * 100}%`,
                backgroundColor: item.color
              }"
            ></div>
          </div>
          <div class="item-amount">{{ formatCurrency(item.amount) }}</div>
        </div>
      </div>
    </div>

    <!-- 优化提示 -->
    <div v-if="optimizationTips.length > 0" class="optimization-tips">
      <h4>Optimierungstipps</h4>
      <div class="tips-list">
        <div
          v-for="(tip, index) in optimizationTips"
          :key="index"
          class="tip-item"
          :class="tip.priority"
        >
          <div class="tip-icon">
            <Icon :name="tip.icon" size="16" />
          </div>
          <div class="tip-content">
            <div class="tip-title">{{ tip.title }}</div>
            <div class="tip-description">{{ tip.description }}</div>
            <div class="tip-savings">Potenzielle Ersparnis: {{ formatCurrency(tip.savings) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 对比摘要 -->
    <div class="comparison-summary">
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-label">Steuerbelastung:</span>
          <span class="stat-value">{{ formatPercentage(effectiveTaxRate) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Verbleibt nach Steuern:</span>
          <span class="stat-value">{{ formatPercentage(1 - effectiveTaxRate) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Absolute Steuerersparnis:</span>
          <span class="stat-value positive">{{ formatCurrency(taxSavings) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 注册Chart.js组件
Chart.register(...registerables)

// 接口定义
interface TaxBreakdownItem {
  name: string
  icon: string
  rate: number
  amount: number
  color: string
}

interface OptimizationTip {
  title: string
  description: string
  savings: number
  icon: string
  priority: 'high' | 'medium' | 'low'
}

// Props定义
interface Props {
  grossReturn: number
  netReturn: number
  totalTax: number
  taxSavings?: number
  abgeltungssteuer?: number
  solidaritaetszuschlag?: number
  kirchensteuer?: number
}

const props = withDefaults(defineProps<Props>(), {
  taxSavings: 0,
  abgeltungssteuer: 0,
  solidaritaetszuschlag: 0,
  kirchensteuer: 0
})

// 响应式数据
const viewMode = ref<'bars' | 'pie'>('bars')
const pieCanvas = ref<HTMLCanvasElement>()
let pieChart: Chart | null = null

// 计算属性
const effectiveTaxRate = computed(() => {
  return props.grossReturn > 0 ? props.totalTax / props.grossReturn : 0
})

const taxBreakdownItems = computed((): TaxBreakdownItem[] => [
  {
    name: 'Abgeltungssteuer',
    icon: 'percent',
    rate: 0.25,
    amount: props.abgeltungssteuer,
    color: '#ef4444'
  },
  {
    name: 'Solidaritätszuschlag',
    icon: 'plus',
    rate: 0.055,
    amount: props.solidaritaetszuschlag,
    color: '#f97316'
  },
  {
    name: 'Kirchensteuer',
    icon: 'home',
    rate: 0.09,
    amount: props.kirchensteuer,
    color: '#8b5cf6'
  }
].filter(item => item.amount > 0))

const optimizationTips = computed((): OptimizationTip[] => {
  const tips: OptimizationTip[] = []

  if (props.taxSavings > 0) {
    tips.push({
      title: 'Steueroptimierung möglich',
      description: 'Durch bessere Nutzung von Freibeträgen und ETF-Teilfreistellung können Sie Steuern sparen.',
      savings: props.taxSavings,
      icon: 'zap',
      priority: 'high'
    })
  }

  if (effectiveTaxRate.value > 0.2) {
    tips.push({
      title: 'Hohe Steuerbelastung',
      description: 'Ihre Steuerbelastung ist überdurchschnittlich hoch. Prüfen Sie Optimierungsmöglichkeiten.',
      savings: props.totalTax * 0.1,
      icon: 'alert-triangle',
      priority: 'medium'
    })
  }

  return tips
})

// 方法
const toggleView = () => {
  viewMode.value = viewMode.value === 'bars' ? 'pie' : 'bars'
  if (viewMode.value === 'pie') {
    nextTick(() => createPieChart())
  }
}

const createPieChart = () => {
  if (!pieCanvas.value) return

  const ctx = pieCanvas.value.getContext('2d')
  if (!ctx) return

  if (pieChart) {
    pieChart.destroy()
  }

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Netto-Ertrag', 'Steuern'],
      datasets: [{
        data: [props.netReturn, props.totalTax],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed
              const percentage = (value / props.grossReturn * 100).toFixed(1)
              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

const exportComparison = () => {
  const data = {
    grossReturn: props.grossReturn,
    netReturn: props.netReturn,
    totalTax: props.totalTax,
    effectiveTaxRate: effectiveTaxRate.value,
    taxBreakdown: taxBreakdownItems.value,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'steuervergleich.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 生命周期
onMounted(() => {
  if (viewMode.value === 'pie') {
    nextTick(() => createPieChart())
  }
})
</script>

<style scoped>
.tax-comparison-widget {
  @apply bg-white rounded-lg shadow-md border p-6 space-y-6;
}

/* 组件头部 */
.widget-header {
  @apply flex items-center justify-between;
}

.widget-title {
  @apply flex items-center gap-2 text-lg font-semibold text-gray-800;
}

.header-actions {
  @apply flex gap-3;
}

.view-toggle,
.export-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply transition-colors;
}

.view-toggle {
  @apply bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500;
}

.export-button {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 主要对比指标 */
.comparison-metrics {
  @apply bg-gray-50 rounded-lg p-6;
}

.metric-pair {
  @apply flex items-center justify-between gap-6;
}

.metric-card {
  @apply flex-1 text-center p-4 rounded-lg border-2;
}

.metric-card.gross {
  @apply bg-blue-50 border-blue-200;
}

.metric-card.net {
  @apply bg-green-50 border-green-200;
}

.metric-header {
  @apply flex items-center justify-center gap-2 mb-3;
}

.metric-card.gross .metric-header {
  @apply text-blue-600;
}

.metric-card.net .metric-header {
  @apply text-green-600;
}

.metric-header span {
  @apply font-medium;
}

.metric-value {
  @apply text-2xl font-bold mb-2;
}

.metric-card.gross .metric-value {
  @apply text-blue-700;
}

.metric-card.net .metric-value {
  @apply text-green-700;
}

.metric-detail {
  @apply text-sm text-gray-600;
}

.comparison-arrow {
  @apply flex flex-col items-center gap-2 text-gray-400;
}

.tax-impact {
  @apply text-center;
}

.tax-label {
  @apply block text-xs text-gray-500;
}

.tax-amount {
  @apply block font-semibold text-red-600;
}

.tax-rate {
  @apply block text-xs text-gray-500;
}

/* 可视化容器 */
.visualization-container {
  @apply bg-gray-50 rounded-lg p-6;
}

/* 柱状图视图 */
.comparison-bars {
  @apply flex items-end justify-center gap-8 h-64 mb-4;
}

.bar-group {
  @apply flex flex-col items-center gap-2;
}

.bar-label {
  @apply text-sm font-medium text-gray-700 mb-2;
}

.bar-container {
  @apply relative w-16 h-48 bg-gray-200 rounded-t-lg overflow-hidden;
}

.bar {
  @apply absolute bottom-0 w-full rounded-t-lg flex items-end justify-center pb-2;
  @apply transition-all duration-500;
}

.gross-bar {
  @apply bg-gradient-to-t from-blue-400 to-blue-500;
}

.tax-bar {
  @apply bg-gradient-to-t from-red-400 to-red-500;
}

.net-bar {
  @apply bg-gradient-to-t from-green-400 to-green-500;
}

.bar-value {
  @apply text-xs font-semibold text-white transform rotate-90 whitespace-nowrap;
}

.bars-legend {
  @apply flex justify-center gap-6;
}

.legend-item {
  @apply flex items-center gap-2;
}

.legend-color {
  @apply w-4 h-4 rounded;
}

.legend-color.gross {
  @apply bg-blue-500;
}

.legend-color.tax {
  @apply bg-red-500;
}

.legend-color.net {
  @apply bg-green-500;
}

.legend-item span {
  @apply text-sm text-gray-700;
}

/* 饼图视图 */
.pie-view {
  @apply flex items-center gap-8;
}

.pie-container {
  @apply flex-1;
}

.pie-chart {
  @apply w-full h-64;
}

.pie-legend {
  @apply space-y-4 w-64;
}

.pie-legend .legend-item {
  @apply flex items-center gap-3 p-3 bg-white rounded border border-gray-200;
}

.pie-legend .legend-color {
  @apply w-6 h-6 rounded-full;
}

.legend-content {
  @apply flex-1;
}

.legend-label {
  @apply block font-medium text-gray-900;
}

.legend-value {
  @apply block text-sm text-gray-700;
}

.legend-percentage {
  @apply block text-xs text-gray-500;
}

/* 税收分解 */
.tax-breakdown {
  @apply bg-gray-50 rounded-lg p-6;
}

.tax-breakdown h4 {
  @apply font-semibold text-gray-800 mb-4;
}

.breakdown-items {
  @apply space-y-3;
}

.breakdown-item {
  @apply bg-white rounded-lg p-4 border border-gray-200;
}

.item-header {
  @apply flex items-center justify-between mb-2;
}

.item-header > div:first-child {
  @apply flex items-center gap-2;
}

.item-name {
  @apply font-medium text-gray-900;
}

.item-rate {
  @apply text-sm text-gray-600;
}

.item-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2;
}

.item-fill {
  @apply h-full transition-all duration-500;
}

.item-amount {
  @apply text-right font-semibold text-gray-900;
}

/* 优化提示 */
.optimization-tips {
  @apply bg-yellow-50 rounded-lg p-6 border border-yellow-200;
}

.optimization-tips h4 {
  @apply font-semibold text-yellow-900 mb-4;
}

.tips-list {
  @apply space-y-3;
}

.tip-item {
  @apply flex items-start gap-3 p-3 rounded-lg;
}

.tip-item.high {
  @apply bg-red-50 border border-red-200;
}

.tip-item.medium {
  @apply bg-yellow-50 border border-yellow-200;
}

.tip-item.low {
  @apply bg-blue-50 border border-blue-200;
}

.tip-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
}

.tip-item.high .tip-icon {
  @apply bg-red-100 text-red-600;
}

.tip-item.medium .tip-icon {
  @apply bg-yellow-100 text-yellow-600;
}

.tip-item.low .tip-icon {
  @apply bg-blue-100 text-blue-600;
}

.tip-content {
  @apply flex-1;
}

.tip-title {
  @apply font-medium text-gray-900 mb-1;
}

.tip-description {
  @apply text-sm text-gray-600 mb-2;
}

.tip-savings {
  @apply text-sm font-semibold text-green-600;
}

/* 对比摘要 */
.comparison-summary {
  @apply bg-gray-50 rounded-lg p-6;
}

.summary-stats {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.stat-item {
  @apply flex justify-between items-center p-3 bg-white rounded border border-gray-200;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply font-semibold text-gray-900;
}

.stat-value.positive {
  @apply text-green-600;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .metric-pair {
    @apply flex-col gap-4;
  }

  .comparison-arrow {
    @apply rotate-90;
  }

  .pie-view {
    @apply flex-col gap-4;
  }

  .pie-legend {
    @apply w-full;
  }

  .summary-stats {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .widget-header {
    @apply flex-col items-start gap-4;
  }

  .header-actions {
    @apply w-full justify-between;
  }

  .comparison-bars {
    @apply gap-4;
  }

  .bar-container {
    @apply w-12 h-32;
  }

  .bars-legend {
    @apply flex-col gap-2;
  }

  .pie-legend .legend-item {
    @apply flex-col text-center;
  }

  .tip-item {
    @apply flex-col gap-2;
  }

  .stat-item {
    @apply flex-col gap-1 text-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .tax-comparison-widget {
    @apply bg-gray-800 border-gray-700;
  }

  .widget-title {
    @apply text-gray-100;
  }

  .comparison-metrics,
  .visualization-container,
  .tax-breakdown,
  .comparison-summary {
    @apply bg-gray-700;
  }

  .metric-card {
    @apply bg-gray-600 border-gray-500;
  }

  .metric-header span {
    @apply text-gray-300;
  }

  .metric-detail {
    @apply text-gray-400;
  }

  .tax-breakdown h4 {
    @apply text-gray-100;
  }

  .breakdown-item,
  .pie-legend .legend-item,
  .stat-item {
    @apply bg-gray-600 border-gray-500;
  }

  .item-name {
    @apply text-gray-100;
  }

  .item-rate {
    @apply text-gray-300;
  }

  .item-amount {
    @apply text-gray-100;
  }

  .optimization-tips {
    @apply bg-yellow-900 border-yellow-700;
  }

  .optimization-tips h4 {
    @apply text-yellow-100;
  }

  .tip-title {
    @apply text-gray-100;
  }

  .tip-description {
    @apply text-gray-300;
  }

  .stat-label {
    @apply text-gray-300;
  }

  .stat-value {
    @apply text-gray-100;
  }

  .legend-item span {
    @apply text-gray-300;
  }

  .legend-label {
    @apply text-gray-100;
  }

  .legend-value {
    @apply text-gray-300;
  }

  .legend-percentage {
    @apply text-gray-400;
  }
}
</style>
