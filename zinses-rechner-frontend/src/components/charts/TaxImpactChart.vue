<!--
  税收影响图表组件
  可视化展示税收对投资收益的影响
-->

<template>
  <div class="tax-impact-chart">
    <!-- 图表头部 -->
    <div class="chart-header">
      <h3 class="chart-title">
        <Icon name="pie-chart" size="20" />
        Steuerauswirkungen auf Ihre Investition
      </h3>
      <div class="chart-controls">
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
        <button @click="exportChart" class="export-button">
          <Icon name="download" size="16" />
          Exportieren
        </button>
      </div>
    </div>

    <!-- 主要指标卡片 -->
    <div class="metrics-overview">
      <div class="metric-card primary">
        <div class="metric-icon">
          <Icon name="trending-up" size="24" />
        </div>
        <div class="metric-content">
          <div class="metric-label">Brutto-Ertrag</div>
          <div class="metric-value">{{ formatCurrency(taxData.grossReturn) }}</div>
          <div class="metric-detail">Vor Steuern</div>
        </div>
      </div>

      <div class="metric-card warning">
        <div class="metric-icon">
          <Icon name="minus-circle" size="24" />
        </div>
        <div class="metric-content">
          <div class="metric-label">Gesamte Steuern</div>
          <div class="metric-value negative">{{ formatCurrency(taxData.totalTax) }}</div>
          <div class="metric-detail">{{ formatPercentage(taxData.effectiveTaxRate) }} effektiv</div>
        </div>
      </div>

      <div class="metric-card success">
        <div class="metric-icon">
          <Icon name="check-circle" size="24" />
        </div>
        <div class="metric-content">
          <div class="metric-label">Netto-Ertrag</div>
          <div class="metric-value">{{ formatCurrency(taxData.netReturn) }}</div>
          <div class="metric-detail">Nach Steuern</div>
        </div>
      </div>

      <div class="metric-card info">
        <div class="metric-icon">
          <Icon name="shield" size="24" />
        </div>
        <div class="metric-content">
          <div class="metric-label">Steuerersparnis</div>
          <div class="metric-value positive">{{ formatCurrency(taxData.taxSavings) }}</div>
          <div class="metric-detail">Durch Optimierung</div>
        </div>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container">
      <!-- 饼图视图 -->
      <div v-if="currentView === 'pie'" class="pie-chart-view">
        <canvas ref="pieChartCanvas" class="chart-canvas"></canvas>
        <div class="chart-legend">
          <div
            v-for="(item, index) in pieChartData"
            :key="index"
            class="legend-item"
          >
            <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-value">{{ formatCurrency(item.value) }}</span>
            <span class="legend-percentage">{{ formatPercentage(item.percentage) }}</span>
          </div>
        </div>
      </div>

      <!-- 瀑布图视图 -->
      <div v-if="currentView === 'waterfall'" class="waterfall-chart-view">
        <canvas ref="waterfallChartCanvas" class="chart-canvas"></canvas>
        <div class="waterfall-explanation">
          <h4>Steuerlicher Abzug Schritt für Schritt</h4>
          <div class="step-list">
            <div
              v-for="(step, index) in waterfallSteps"
              :key="index"
              class="step-item"
              :class="step.type"
            >
              <div class="step-icon">
                <Icon :name="step.icon" size="16" />
              </div>
              <div class="step-content">
                <div class="step-label">{{ step.label }}</div>
                <div class="step-value" :class="step.type">{{ formatCurrency(step.value) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 对比柱状图视图 -->
      <div v-if="currentView === 'comparison'" class="comparison-chart-view">
        <canvas ref="comparisonChartCanvas" class="chart-canvas"></canvas>
        <div class="comparison-insights">
          <div class="insight-card">
            <h4>Steueroptimierung Potenzial</h4>
            <div class="optimization-list">
              <div
                v-for="(optimization, index) in optimizationSuggestions"
                :key="index"
                class="optimization-item"
              >
                <div class="optimization-icon">
                  <Icon :name="optimization.icon" size="16" />
                </div>
                <div class="optimization-content">
                  <div class="optimization-title">{{ optimization.title }}</div>
                  <div class="optimization-savings">{{ formatCurrency(optimization.savings) }} sparen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间线视图 -->
      <div v-if="currentView === 'timeline'" class="timeline-chart-view">
        <canvas ref="timelineChartCanvas" class="chart-canvas"></canvas>
        <div class="timeline-controls">
          <div class="time-range-selector">
            <label>Zeitraum:</label>
            <select v-model="selectedTimeRange" @change="updateTimelineChart">
              <option value="1">1 Jahr</option>
              <option value="5">5 Jahre</option>
              <option value="10">10 Jahre</option>
              <option value="20">20 Jahre</option>
              <option value="all">Gesamter Zeitraum</option>
            </select>
          </div>
          <div class="data-toggle">
            <label class="toggle-label">
              <input
                v-model="showCumulativeData"
                type="checkbox"
                @change="updateTimelineChart"
              />
              <span>Kumulierte Werte anzeigen</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细分析 -->
    <div class="detailed-analysis">
      <div class="analysis-tabs">
        <button
          v-for="tab in analysisTabs"
          :key="tab.id"
          @click="activeAnalysisTab = tab.id"
          class="tab-button"
          :class="{ 'active': activeAnalysisTab === tab.id }"
        >
          <Icon :name="tab.icon" size="16" />
          {{ tab.label }}
        </button>
      </div>

      <div class="analysis-content">
        <!-- 税收分解分析 -->
        <div v-if="activeAnalysisTab === 'breakdown'" class="breakdown-analysis">
          <h4>Steuerliche Aufschlüsselung</h4>
          <div class="breakdown-table">
            <div class="breakdown-row header">
              <span>Steuerart</span>
              <span>Steuersatz</span>
              <span>Steuerbetrag</span>
              <span>Anteil</span>
            </div>
            <div
              v-for="(item, index) in taxBreakdown"
              :key="index"
              class="breakdown-row"
            >
              <span class="tax-type">
                <Icon :name="item.icon" size="14" />
                {{ item.name }}
              </span>
              <span class="tax-rate">{{ formatPercentage(item.rate) }}</span>
              <span class="tax-amount">{{ formatCurrency(item.amount) }}</span>
              <span class="tax-share">{{ formatPercentage(item.share) }}</span>
            </div>
          </div>
        </div>

        <!-- 优化建议分析 -->
        <div v-if="activeAnalysisTab === 'optimization'" class="optimization-analysis">
          <h4>Steueroptimierung Empfehlungen</h4>
          <div class="optimization-cards">
            <div
              v-for="(suggestion, index) in detailedOptimizations"
              :key="index"
              class="optimization-card"
              :class="suggestion.priority"
            >
              <div class="card-header">
                <div class="card-icon">
                  <Icon :name="suggestion.icon" size="20" />
                </div>
                <div class="card-title">{{ suggestion.title }}</div>
                <div class="card-savings">{{ formatCurrency(suggestion.potentialSavings) }}</div>
              </div>
              <div class="card-content">
                <p>{{ suggestion.description }}</p>
                <div class="implementation-steps">
                  <h5>Umsetzung:</h5>
                  <ul>
                    <li v-for="(step, stepIndex) in suggestion.steps" :key="stepIndex">
                      {{ step }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 场景对比分析 -->
        <div v-if="activeAnalysisTab === 'scenarios'" class="scenarios-analysis">
          <h4>Szenario-Vergleich</h4>
          <div class="scenarios-table">
            <div class="scenario-header">
              <span>Szenario</span>
              <span>Brutto-Ertrag</span>
              <span>Steuern</span>
              <span>Netto-Ertrag</span>
              <span>Vorteil</span>
            </div>
            <div
              v-for="(scenario, index) in comparisonScenarios"
              :key="index"
              class="scenario-row"
              :class="{ 'best': scenario.isBest }"
            >
              <span class="scenario-name">
                <Icon :name="scenario.icon" size="14" />
                {{ scenario.name }}
              </span>
              <span class="scenario-gross">{{ formatCurrency(scenario.grossReturn) }}</span>
              <span class="scenario-tax">{{ formatCurrency(scenario.totalTax) }}</span>
              <span class="scenario-net">{{ formatCurrency(scenario.netReturn) }}</span>
              <span class="scenario-advantage" :class="{ 'positive': scenario.advantage > 0 }">
                {{ scenario.advantage > 0 ? '+' : '' }}{{ formatCurrency(scenario.advantage) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 注册Chart.js组件
Chart.register(...registerables)

// 接口定义
interface TaxData {
  grossReturn: number
  totalTax: number
  netReturn: number
  taxSavings: number
  effectiveTaxRate: number
  abgeltungssteuer: number
  solidaritaetszuschlag: number
  kirchensteuer: number
  freistellungsauftragSavings: number
  etfTeilfreistellungSavings: number
}

interface OptimizationSuggestion {
  icon: string
  title: string
  savings: number
  description?: string
  potentialSavings?: number
  priority?: 'high' | 'medium' | 'low'
  steps?: string[]
}

interface ComparisonScenario {
  name: string
  icon: string
  grossReturn: number
  totalTax: number
  netReturn: number
  advantage: number
  isBest: boolean
}

// Props定义
interface Props {
  taxData: TaxData
  investmentAmount?: number
  investmentYears?: number
  showOptimizations?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  investmentAmount: 10000,
  investmentYears: 10,
  showOptimizations: true
})

// 响应式数据
const currentView = ref<'pie' | 'waterfall' | 'comparison' | 'timeline'>('pie')
const activeAnalysisTab = ref('breakdown')
const selectedTimeRange = ref('all')
const showCumulativeData = ref(true)

// Chart实例引用
const pieChartCanvas = ref<HTMLCanvasElement>()
const waterfallChartCanvas = ref<HTMLCanvasElement>()
const comparisonChartCanvas = ref<HTMLCanvasElement>()
const timelineChartCanvas = ref<HTMLCanvasElement>()

let pieChart: Chart | null = null
const waterfallChart: Chart | null = null
const comparisonChart: Chart | null = null
const timelineChart: Chart | null = null

// 可用视图
const availableViews = [
  { type: 'pie', icon: 'pie-chart', label: 'Aufteilung' },
  { type: 'waterfall', icon: 'bar-chart-2', label: 'Wasserfall' },
  { type: 'comparison', icon: 'bar-chart', label: 'Vergleich' },
  { type: 'timeline', icon: 'activity', label: 'Zeitverlauf' }
] as const

// 分析标签
const analysisTabs = [
  { id: 'breakdown', icon: 'pie-chart', label: 'Aufschlüsselung' },
  { id: 'optimization', icon: 'zap', label: 'Optimierung' },
  { id: 'scenarios', icon: 'layers', label: 'Szenarien' }
]

// 计算属性
const pieChartData = computed(() => [
  {
    label: 'Netto-Ertrag',
    value: props.taxData.netReturn,
    percentage: props.taxData.netReturn / props.taxData.grossReturn,
    color: '#10b981'
  },
  {
    label: 'Abgeltungssteuer',
    value: props.taxData.abgeltungssteuer,
    percentage: props.taxData.abgeltungssteuer / props.taxData.grossReturn,
    color: '#ef4444'
  },
  {
    label: 'Solidaritätszuschlag',
    value: props.taxData.solidaritaetszuschlag,
    percentage: props.taxData.solidaritaetszuschlag / props.taxData.grossReturn,
    color: '#f97316'
  },
  {
    label: 'Kirchensteuer',
    value: props.taxData.kirchensteuer,
    percentage: props.taxData.kirchensteuer / props.taxData.grossReturn,
    color: '#8b5cf6'
  }
])

const waterfallSteps = computed(() => [
  {
    label: 'Brutto-Ertrag',
    value: props.taxData.grossReturn,
    type: 'positive',
    icon: 'trending-up'
  },
  {
    label: 'Abgeltungssteuer',
    value: -props.taxData.abgeltungssteuer,
    type: 'negative',
    icon: 'minus'
  },
  {
    label: 'Solidaritätszuschlag',
    value: -props.taxData.solidaritaetszuschlag,
    type: 'negative',
    icon: 'minus'
  },
  {
    label: 'Kirchensteuer',
    value: -props.taxData.kirchensteuer,
    type: 'negative',
    icon: 'minus'
  },
  {
    label: 'Netto-Ertrag',
    value: props.taxData.netReturn,
    type: 'result',
    icon: 'check'
  }
])

const optimizationSuggestions = computed((): OptimizationSuggestion[] => [
  {
    icon: 'shield',
    title: 'Freistellungsauftrag nutzen',
    savings: props.taxData.freistellungsauftragSavings
  },
  {
    icon: 'trending-up',
    title: 'ETF Teilfreistellung',
    savings: props.taxData.etfTeilfreistellungSavings
  },
  {
    icon: 'calendar',
    title: 'Verlustverrechnung',
    savings: 500
  }
])

const taxBreakdown = computed(() => [
  {
    name: 'Abgeltungssteuer',
    icon: 'percent',
    rate: 0.25,
    amount: props.taxData.abgeltungssteuer,
    share: props.taxData.abgeltungssteuer / props.taxData.totalTax
  },
  {
    name: 'Solidaritätszuschlag',
    icon: 'plus',
    rate: 0.055,
    amount: props.taxData.solidaritaetszuschlag,
    share: props.taxData.solidaritaetszuschlag / props.taxData.totalTax
  },
  {
    name: 'Kirchensteuer',
    icon: 'home',
    rate: 0.09,
    amount: props.taxData.kirchensteuer,
    share: props.taxData.kirchensteuer / props.taxData.totalTax
  }
])

const detailedOptimizations = computed((): OptimizationSuggestion[] => [
  {
    icon: 'shield',
    title: 'Freistellungsauftrag optimieren',
    potentialSavings: props.taxData.freistellungsauftragSavings,
    priority: 'high',
    description: 'Nutzen Sie Ihren jährlichen Freibetrag von 1.000€ (2.000€ für Verheiratete) optimal aus.',
    steps: [
      'Freistellungsauftrag bei der Bank einreichen',
      'Freibetrag auf mehrere Banken aufteilen',
      'Jährlich Nutzung überprüfen und anpassen'
    ]
  },
  {
    icon: 'trending-up',
    title: 'ETF Teilfreistellung nutzen',
    potentialSavings: props.taxData.etfTeilfreistellungSavings,
    priority: 'high',
    description: 'Investieren Sie in ETFs mit hoher Teilfreistellung (z.B. Aktien-ETFs mit 30%).',
    steps: [
      'Aktien-ETFs mit mindestens 51% Aktienanteil wählen',
      'Immobilien-ETFs für 60% Teilfreistellung prüfen',
      'Portfolio-Zusammensetzung optimieren'
    ]
  }
])

const comparisonScenarios = computed((): ComparisonScenario[] => {
  const baseScenario = {
    name: 'Aktuell',
    icon: 'user',
    grossReturn: props.taxData.grossReturn,
    totalTax: props.taxData.totalTax,
    netReturn: props.taxData.netReturn,
    advantage: 0,
    isBest: false
  }

  const optimizedScenario = {
    name: 'Optimiert',
    icon: 'zap',
    grossReturn: props.taxData.grossReturn,
    totalTax: props.taxData.totalTax - props.taxData.taxSavings,
    netReturn: props.taxData.netReturn + props.taxData.taxSavings,
    advantage: props.taxData.taxSavings,
    isBest: true
  }

  return [baseScenario, optimizedScenario]
})

// 方法
const createPieChart = () => {
  if (!pieChartCanvas.value) return

  const ctx = pieChartCanvas.value.getContext('2d')
  if (!ctx) return

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: pieChartData.value.map(item => item.label),
      datasets: [{
        data: pieChartData.value.map(item => item.value),
        backgroundColor: pieChartData.value.map(item => item.color),
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
              const percentage = (value / props.taxData.grossReturn * 100).toFixed(1)
              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

const exportChart = () => {
  // 实现图表导出功能
  console.log('Exporting chart...')
}

const updateTimelineChart = () => {
  // 更新时间线图表
  console.log('Updating timeline chart...')
}

// 生命周期
onMounted(async () => {
  await nextTick()
  createPieChart()
})

// 监听器
watch(currentView, async (newView) => {
  await nextTick()
  if (newView === 'pie') {
    createPieChart()
  }
  // 其他视图的图表创建逻辑
})
</script>

<style scoped>
.tax-impact-chart {
  @apply space-y-6;
}

/* 图表头部 */
.chart-header {
  @apply flex items-center justify-between mb-6;
}

.chart-title {
  @apply flex items-center gap-2 text-xl font-semibold text-gray-800;
}

.chart-controls {
  @apply flex items-center gap-4;
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

.export-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 text-gray-700;
  @apply hover:bg-gray-300 rounded-md transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-500;
}

/* 指标概览 */
.metrics-overview {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6;
}

.metric-card {
  @apply flex items-center gap-4 p-4 rounded-lg border;
}

.metric-card.primary {
  @apply bg-blue-50 border-blue-200;
}

.metric-card.warning {
  @apply bg-orange-50 border-orange-200;
}

.metric-card.success {
  @apply bg-green-50 border-green-200;
}

.metric-card.info {
  @apply bg-gray-50 border-gray-200;
}

.metric-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center;
}

.metric-card.primary .metric-icon {
  @apply bg-blue-100 text-blue-600;
}

.metric-card.warning .metric-icon {
  @apply bg-orange-100 text-orange-600;
}

.metric-card.success .metric-icon {
  @apply bg-green-100 text-green-600;
}

.metric-card.info .metric-icon {
  @apply bg-gray-100 text-gray-600;
}

.metric-content {
  @apply flex-1;
}

.metric-label {
  @apply text-sm text-gray-600;
}

.metric-value {
  @apply text-lg font-bold text-gray-900;
}

.metric-value.negative {
  @apply text-red-600;
}

.metric-value.positive {
  @apply text-green-600;
}

.metric-detail {
  @apply text-xs text-gray-500;
}

/* 图表容器 */
.chart-container {
  @apply bg-white rounded-lg shadow-md border p-6 mb-6;
}

.chart-canvas {
  @apply w-full h-80;
}

/* 饼图视图 */
.pie-chart-view {
  @apply flex flex-col lg:flex-row gap-6;
}

.chart-legend {
  @apply space-y-3 lg:w-80;
}

.legend-item {
  @apply flex items-center gap-3 p-2 bg-gray-50 rounded;
}

.legend-color {
  @apply w-4 h-4 rounded-full;
}

.legend-label {
  @apply flex-1 text-sm font-medium text-gray-700;
}

.legend-value {
  @apply text-sm font-semibold text-gray-900;
}

.legend-percentage {
  @apply text-xs text-gray-500;
}

/* 瀑布图视图 */
.waterfall-chart-view {
  @apply space-y-6;
}

.waterfall-explanation h4 {
  @apply font-semibold text-gray-800 mb-4;
}

.step-list {
  @apply space-y-3;
}

.step-item {
  @apply flex items-center gap-3 p-3 rounded-lg;
}

.step-item.positive {
  @apply bg-green-50 border border-green-200;
}

.step-item.negative {
  @apply bg-red-50 border border-red-200;
}

.step-item.result {
  @apply bg-blue-50 border border-blue-200;
}

.step-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
}

.step-item.positive .step-icon {
  @apply bg-green-100 text-green-600;
}

.step-item.negative .step-icon {
  @apply bg-red-100 text-red-600;
}

.step-item.result .step-icon {
  @apply bg-blue-100 text-blue-600;
}

.step-content {
  @apply flex-1;
}

.step-label {
  @apply text-sm font-medium text-gray-700;
}

.step-value {
  @apply font-semibold;
}

.step-value.positive {
  @apply text-green-600;
}

.step-value.negative {
  @apply text-red-600;
}

.step-value.result {
  @apply text-blue-600;
}

/* 对比图视图 */
.comparison-chart-view {
  @apply space-y-6;
}

.comparison-insights {
  @apply space-y-4;
}

.insight-card {
  @apply bg-gray-50 rounded-lg p-4 border border-gray-200;
}

.insight-card h4 {
  @apply font-semibold text-gray-800 mb-4;
}

.optimization-list {
  @apply space-y-3;
}

.optimization-item {
  @apply flex items-center gap-3 p-3 bg-white rounded border border-gray-200;
}

.optimization-icon {
  @apply w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.optimization-content {
  @apply flex-1;
}

.optimization-title {
  @apply font-medium text-gray-900;
}

.optimization-savings {
  @apply text-sm text-green-600 font-semibold;
}

/* 时间线视图 */
.timeline-chart-view {
  @apply space-y-6;
}

.timeline-controls {
  @apply flex flex-wrap gap-4 items-center;
}

.time-range-selector {
  @apply flex items-center gap-2;
}

.time-range-selector label {
  @apply text-sm font-medium text-gray-700;
}

.time-range-selector select {
  @apply px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.data-toggle {
  @apply flex items-center;
}

.toggle-label {
  @apply flex items-center gap-2 cursor-pointer;
}

.toggle-label input[type="checkbox"] {
  @apply rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

.toggle-label span {
  @apply text-sm text-gray-700;
}

/* 详细分析 */
.detailed-analysis {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.analysis-tabs {
  @apply flex gap-2 mb-6 border-b border-gray-200;
}

.tab-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium;
  @apply text-gray-600 hover:text-gray-900 border-b-2 border-transparent;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors;
}

.tab-button.active {
  @apply text-blue-600 border-blue-600;
}

.analysis-content {
  @apply space-y-6;
}

/* 税收分解分析 */
.breakdown-analysis h4 {
  @apply font-semibold text-gray-800 mb-4;
}

.breakdown-table {
  @apply space-y-2;
}

.breakdown-row {
  @apply grid grid-cols-4 gap-4 py-3 px-4 rounded-lg;
}

.breakdown-row.header {
  @apply bg-gray-100 font-semibold text-gray-700;
}

.breakdown-row:not(.header) {
  @apply bg-gray-50 hover:bg-gray-100 transition-colors;
}

.tax-type {
  @apply flex items-center gap-2 font-medium text-gray-900;
}

.tax-rate,
.tax-amount,
.tax-share {
  @apply text-sm text-gray-700;
}

/* 优化分析 */
.optimization-analysis h4 {
  @apply font-semibold text-gray-800 mb-4;
}

.optimization-cards {
  @apply space-y-4;
}

.optimization-card {
  @apply border rounded-lg p-4;
}

.optimization-card.high {
  @apply border-red-300 bg-red-50;
}

.optimization-card.medium {
  @apply border-yellow-300 bg-yellow-50;
}

.optimization-card.low {
  @apply border-blue-300 bg-blue-50;
}

.card-header {
  @apply flex items-center justify-between mb-3;
}

.card-icon {
  @apply w-10 h-10 rounded-full flex items-center justify-center;
}

.optimization-card.high .card-icon {
  @apply bg-red-100 text-red-600;
}

.optimization-card.medium .card-icon {
  @apply bg-yellow-100 text-yellow-600;
}

.optimization-card.low .card-icon {
  @apply bg-blue-100 text-blue-600;
}

.card-title {
  @apply flex-1 font-semibold text-gray-900 mx-3;
}

.card-savings {
  @apply font-bold text-green-600;
}

.card-content p {
  @apply text-sm text-gray-600 mb-3;
}

.implementation-steps h5 {
  @apply font-medium text-gray-800 mb-2;
}

.implementation-steps ul {
  @apply list-disc list-inside space-y-1;
}

.implementation-steps li {
  @apply text-sm text-gray-600;
}

/* 场景分析 */
.scenarios-analysis h4 {
  @apply font-semibold text-gray-800 mb-4;
}

.scenarios-table {
  @apply space-y-2;
}

.scenario-header {
  @apply grid grid-cols-5 gap-4 py-3 px-4 bg-gray-100 rounded-lg font-semibold text-gray-700;
}

.scenario-row {
  @apply grid grid-cols-5 gap-4 py-3 px-4 bg-gray-50 rounded-lg;
  @apply hover:bg-gray-100 transition-colors;
}

.scenario-row.best {
  @apply bg-green-50 border border-green-200;
}

.scenario-name {
  @apply flex items-center gap-2 font-medium text-gray-900;
}

.scenario-gross,
.scenario-tax,
.scenario-net {
  @apply text-sm text-gray-700;
}

.scenario-advantage {
  @apply text-sm font-semibold text-gray-700;
}

.scenario-advantage.positive {
  @apply text-green-600;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .chart-header {
    @apply flex-col items-start gap-4;
  }

  .chart-controls {
    @apply w-full justify-between;
  }

  .metrics-overview {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .pie-chart-view {
    @apply flex-col;
  }

  .breakdown-row {
    @apply grid-cols-2 gap-2;
  }

  .scenario-header,
  .scenario-row {
    @apply grid-cols-2 gap-2;
  }
}

@media (max-width: 768px) {
  .metrics-overview {
    @apply grid-cols-1;
  }

  .metric-card {
    @apply flex-col text-center;
  }

  .metric-icon {
    @apply mb-3;
  }

  .view-selector {
    @apply flex-wrap;
  }

  .analysis-tabs {
    @apply flex-wrap;
  }

  .timeline-controls {
    @apply flex-col items-start gap-2;
  }

  .breakdown-row {
    @apply grid-cols-1 gap-1;
  }

  .scenario-header,
  .scenario-row {
    @apply grid-cols-1 gap-1;
  }

  .card-header {
    @apply flex-col items-start gap-2;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .chart-title {
    @apply text-gray-100;
  }

  .chart-container,
  .detailed-analysis {
    @apply bg-gray-800 border-gray-700;
  }

  .metric-card {
    @apply bg-gray-700 border-gray-600;
  }

  .metric-label {
    @apply text-gray-300;
  }

  .metric-value {
    @apply text-gray-100;
  }

  .metric-detail {
    @apply text-gray-400;
  }

  .legend-item,
  .insight-card,
  .optimization-item {
    @apply bg-gray-700 border-gray-600;
  }

  .legend-label,
  .optimization-title {
    @apply text-gray-300;
  }

  .legend-value {
    @apply text-gray-100;
  }

  .legend-percentage {
    @apply text-gray-400;
  }

  .step-label {
    @apply text-gray-300;
  }

  .waterfall-explanation h4,
  .breakdown-analysis h4,
  .optimization-analysis h4,
  .scenarios-analysis h4,
  .insight-card h4 {
    @apply text-gray-100;
  }

  .breakdown-row.header {
    @apply bg-gray-700 text-gray-300;
  }

  .breakdown-row:not(.header) {
    @apply bg-gray-700 hover:bg-gray-600;
  }

  .tax-type {
    @apply text-gray-100;
  }

  .tax-rate,
  .tax-amount,
  .tax-share {
    @apply text-gray-300;
  }

  .optimization-card {
    @apply bg-gray-700 border-gray-600;
  }

  .card-title {
    @apply text-gray-100;
  }

  .card-content p {
    @apply text-gray-300;
  }

  .implementation-steps h5 {
    @apply text-gray-100;
  }

  .implementation-steps li {
    @apply text-gray-300;
  }

  .scenario-header {
    @apply bg-gray-700 text-gray-300;
  }

  .scenario-row {
    @apply bg-gray-700 hover:bg-gray-600;
  }

  .scenario-row.best {
    @apply bg-green-900 border-green-700;
  }

  .scenario-name {
    @apply text-gray-100;
  }

  .scenario-gross,
  .scenario-tax,
  .scenario-net {
    @apply text-gray-300;
  }

  .scenario-advantage {
    @apply text-gray-300;
  }

  .time-range-selector select {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .toggle-label span {
    @apply text-gray-300;
  }
}
</style>
