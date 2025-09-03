<!--
  交互式图表示例组件
  展示各种交互式图表功能和用法
-->

<template>
  <div class="interactive-charts-example">
    <div class="example-header">
      <h1>Interaktive Diagramme</h1>
      <p>Entdecken Sie erweiterte Diagrammfunktionen mit Zoom, Auswahl und detaillierten Analysen</p>
    </div>

    <!-- 参数配置面板 -->
    <div class="parameters-section">
      <h2>Berechnungsparameter</h2>
      <div class="parameters-grid">
        <div class="param-group">
          <label>Anfangsbetrag (€)</label>
          <input
            v-model.number="parameters.initialAmount"
            type="number"
            min="0"
            step="1000"
            class="param-input"
            @input="updateChartData"
          />
        </div>

        <div class="param-group">
          <label>Monatliche Sparrate (€)</label>
          <input
            v-model.number="parameters.monthlyContribution"
            type="number"
            min="0"
            step="50"
            class="param-input"
            @input="updateChartData"
          />
        </div>

        <div class="param-group">
          <label>Zinssatz (%)</label>
          <input
            v-model.number="parameters.interestRate"
            type="number"
            min="0"
            max="20"
            step="0.1"
            class="param-input"
            @input="updateChartData"
          />
        </div>

        <div class="param-group">
          <label>Laufzeit (Jahre)</label>
          <input
            v-model.number="parameters.years"
            type="number"
            min="1"
            max="50"
            step="1"
            class="param-input"
            @input="updateChartData"
          />
        </div>
      </div>
    </div>

    <!-- 主要交互式图表 -->
    <div class="main-chart-section">
      <InteractiveChart
        :data="mainChartData"
        :title="'Zinseszins-Entwicklung'"
        :height="500"
        :loading="isLoading"
        @data-point-selected="handleDataPointSelected"
        @zoom-changed="handleZoomChanged"
        @view-changed="handleViewChanged"
        @chart-exported="handleChartExported"
      />
    </div>

    <!-- 图表对比区域 -->
    <div class="chart-comparison-section">
      <h2>Diagramm-Vergleich</h2>
      <div class="comparison-tabs">
        <button
          v-for="tab in comparisonTabs"
          :key="tab.id"
          @click="activeComparisonTab = tab.id"
          class="tab-button"
          :class="{ 'active': activeComparisonTab === tab.id }"
        >
          <Icon :name="tab.icon" size="sm" />
          {{ tab.label }}
        </button>
      </div>

      <div class="comparison-content">
        <!-- 不同利率对比 -->
        <div v-if="activeComparisonTab === 'rates'" class="rates-comparison">
          <div class="comparison-charts">
            <InteractiveChart
              v-for="(rate, index) in comparisonRates"
              :key="index"
              :data="generateComparisonData(rate)"
              :title="`${rate}% Zinssatz`"
              :height="300"
              class="comparison-chart"
            />
          </div>
        </div>

        <!-- 不同时间段对比 -->
        <div v-if="activeComparisonTab === 'periods'" class="periods-comparison">
          <div class="comparison-charts">
            <InteractiveChart
              v-for="(period, index) in comparisonPeriods"
              :key="index"
              :data="generatePeriodData(period)"
              :title="`${period} Jahre Laufzeit`"
              :height="300"
              class="comparison-chart"
            />
          </div>
        </div>

        <!-- 投资策略对比 -->
        <div v-if="activeComparisonTab === 'strategies'" class="strategies-comparison">
          <div class="comparison-charts">
            <InteractiveChart
              v-for="(strategy, index) in investmentStrategies"
              :key="index"
              :data="generateStrategyData(strategy)"
              :title="strategy.name"
              :height="300"
              class="comparison-chart"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 选中数据点信息 */
    <div v-if="selectedDataPoint" class="selected-data-section">
      <h2>Ausgewählter Datenpunkt</h2>
      <div class="data-details-grid">
        <div class="detail-card">
          <div class="card-icon">
            <Icon name="calendar" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Jahr</div>
            <div class="card-value">{{ selectedDataPoint.year }}</div>
          </div>
        </div>

        <div class="detail-card">
          <div class="card-icon">
            <Icon name="euro" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Gesamtwert</div>
            <div class="card-value">{{ formatCurrency(selectedDataPoint.value) }}</div>
          </div>
        </div>

        <div class="detail-card">
          <div class="card-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Jährliches Wachstum</div>
            <div class="card-value" :class="selectedDataPoint.growth >= 0 ? 'positive' : 'negative'">
              {{ selectedDataPoint.growth >= 0 ? '+' : '' }}{{ formatPercentage(selectedDataPoint.growth) }}
            </div>
          </div>
        </div>

        <div class="detail-card">
          <div class="card-icon">
            <Icon name="plus-circle" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Eingezahlte Beiträge</div>
            <div class="card-value">{{ formatCurrency(selectedDataPoint.contributions) }}</div>
          </div>
        </div>
      </div>

      <div class="data-actions">
        <button @click="analyzeDataPoint" class="action-button primary">
          <Icon name="search" size="sm" />
          Detailanalyse
        </button>
        <button @click="compareWithOthers" class="action-button secondary">
          <Icon name="bar-chart-2" size="sm" />
          Mit anderen vergleichen
        </button>
        <button @click="exportDataPoint" class="action-button secondary">
          <Icon name="download" size="sm" />
          Daten exportieren
        </button>
      </div>
    </div>

    <!-- 图表统计信息 -->
    <div class="chart-statistics-section">
      <h2>Diagramm-Statistiken</h2>
      <div class="statistics-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <Icon name="activity" size="lg" />
          </div>
          <div class="stat-content">
            <div class="stat-label">Zoom-Level</div>
            <div class="stat-value">{{ Math.round(currentZoomLevel * 100) }}%</div>
            <div class="stat-change">
              {{ zoomLevel > 1 ? 'Vergrößert' : 'Standard' }}
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <Icon name="eye" size="lg" />
          </div>
          <div class="stat-content">
            <div class="stat-label">Aktuelle Ansicht</div>
            <div class="stat-value">{{ getCurrentViewLabel() }}</div>
            <div class="stat-change">
              {{ getViewDescription() }}
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <Icon name="mouse-pointer" size="lg" />
          </div>
          <div class="stat-content">
            <div class="stat-label">Interaktionen</div>
            <div class="stat-value">{{ interactionCount }}</div>
            <div class="stat-change">
              Klicks und Auswahlen
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <Icon name="download" size="lg" />
          </div>
          <div class="stat-content">
            <div class="stat-label">Exporte</div>
            <div class="stat-value">{{ exportCount }}</div>
            <div class="stat-change">
              Diagramme gespeichert
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 交互功能演示 -->
    <div class="interaction-demo-section">
      <h2>Interaktions-Demo</h2>
      <div class="demo-cards">
        <div class="demo-card">
          <div class="demo-icon">
            <Icon name="zoom-in" size="lg" />
          </div>
          <div class="demo-content">
            <h4>Zoom & Pan</h4>
            <p>Verwenden Sie das Mausrad zum Zoomen und ziehen Sie mit der Maus, um das Diagramm zu verschieben.</p>
            <button @click="demonstrateZoom" class="demo-button">
              Demo starten
            </button>
          </div>
        </div>

        <div class="demo-card">
          <div class="demo-icon">
            <Icon name="target" size="lg" />
          </div>
          <div class="demo-content">
            <h4>Datenpunkt-Auswahl</h4>
            <p>Klicken Sie auf einen Datenpunkt, um detaillierte Informationen anzuzeigen.</p>
            <button @click="demonstrateSelection" class="demo-button">
              Demo starten
            </button>
          </div>
        </div>

        <div class="demo-card">
          <div class="demo-icon">
            <Icon name="info" size="lg" />
          </div>
          <div class="demo-content">
            <h4>Hover-Tooltips</h4>
            <p>Bewegen Sie die Maus über das Diagramm, um erweiterte Tooltips zu sehen.</p>
            <button @click="demonstrateTooltips" class="demo-button">
              Demo starten
            </button>
          </div>
        </div>

        <div class="demo-card">
          <div class="demo-icon">
            <Icon name="settings" size="lg" />
          </div>
          <div class="demo-content">
            <h4>Anpassungen</h4>
            <p>Öffnen Sie die Einstellungen, um Diagrammtyp, Farben und Animationen anzupassen.</p>
            <button @click="demonstrateSettings" class="demo-button">
              Demo starten
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-section">
      <div class="action-buttons">
        <button @click="resetAllCharts" class="action-button primary">
          <Icon name="refresh-cw" size="sm" />
          Alle Diagramme zurücksetzen
        </button>
        <button @click="exportAllCharts" class="action-button secondary">
          <Icon name="download" size="sm" />
          Alle exportieren
        </button>
        <button @click="shareCharts" class="action-button secondary">
          <Icon name="share-2" size="sm" />
          Teilen
        </button>
        <button @click="printCharts" class="action-button secondary">
          <Icon name="printer" size="sm" />
          Drucken
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import InteractiveChart from '@/components/charts/InteractiveChart.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface Parameters {
  initialAmount: number
  monthlyContribution: number
  interestRate: number
  years: number
}

interface DataPoint {
  year: number
  value: number
  growth: number
  contributions: number
}

interface InvestmentStrategy {
  name: string
  description: string
  riskLevel: 'low' | 'medium' | 'high'
  expectedReturn: number
}

// 响应式数据
const isLoading = ref(false)
const activeComparisonTab = ref('rates')
const selectedDataPoint = ref<DataPoint | null>(null)
const currentZoomLevel = ref(1)
const currentView = ref('overview')
const interactionCount = ref(0)
const exportCount = ref(0)

const parameters = reactive<Parameters>({
  initialAmount: 10000,
  monthlyContribution: 200,
  interestRate: 5,
  years: 20
})

const mainChartData = ref<any>({
  labels: [],
  datasets: []
})

// 对比标签
const comparisonTabs = [
  { id: 'rates', label: 'Zinssätze', icon: 'percent' },
  { id: 'periods', label: 'Zeiträume', icon: 'clock' },
  { id: 'strategies', label: 'Strategien', icon: 'trending-up' }
]

// 对比数据
const comparisonRates = [3, 5, 7, 9]
const comparisonPeriods = [10, 20, 30, 40]

const investmentStrategies: InvestmentStrategy[] = [
  {
    name: 'Konservativ',
    description: 'Niedrige Rendite, geringes Risiko',
    riskLevel: 'low',
    expectedReturn: 3
  },
  {
    name: 'Ausgewogen',
    description: 'Moderate Rendite, mittleres Risiko',
    riskLevel: 'medium',
    expectedReturn: 6
  },
  {
    name: 'Wachstumsorientiert',
    description: 'Hohe Rendite, höheres Risiko',
    riskLevel: 'high',
    expectedReturn: 9
  }
]

// 计算属性
const zoomLevel = computed(() => currentZoomLevel.value)

// 方法
const calculateCompoundInterest = (
  initial: number,
  monthly: number,
  rate: number,
  years: number
) => {
  const monthlyRate = rate / 100 / 12
  const months = years * 12
  const labels = []
  const values = []

  for (let year = 0; year <= years; year++) {
    labels.push(year.toString())

    const monthsElapsed = year * 12
    let value = initial

    if (monthsElapsed > 0) {
      // 复利计算
      value = initial * Math.pow(1 + rate / 100, year)

      // 月度缴费的复利
      if (monthly > 0) {
        const annuityValue = monthly * 12 * ((Math.pow(1 + rate / 100, year) - 1) / (rate / 100))
        value += annuityValue
      }
    }

    values.push(Math.round(value))
  }

  return { labels, values }
}

const updateChartData = () => {
  isLoading.value = true

  setTimeout(() => {
    const { labels, values } = calculateCompoundInterest(
      parameters.initialAmount,
      parameters.monthlyContribution,
      parameters.interestRate,
      parameters.years
    )

    mainChartData.value = {
      labels,
      datasets: [
        {
          label: 'Gesamtwert',
          data: values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Eingezahlte Beiträge',
          data: labels.map((_, index) =>
            parameters.initialAmount + (parameters.monthlyContribution * 12 * index)
          ),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    }

    isLoading.value = false
  }, 500)
}

const generateComparisonData = (rate: number) => {
  const { labels, values } = calculateCompoundInterest(
    parameters.initialAmount,
    parameters.monthlyContribution,
    rate,
    parameters.years
  )

  return {
    labels,
    datasets: [
      {
        label: `${rate}% Zinssatz`,
        data: values,
        borderColor: getColorForRate(rate),
        backgroundColor: getColorForRate(rate, 0.1),
        fill: true,
        tension: 0.4
      }
    ]
  }
}

const generatePeriodData = (period: number) => {
  const { labels, values } = calculateCompoundInterest(
    parameters.initialAmount,
    parameters.monthlyContribution,
    parameters.interestRate,
    period
  )

  return {
    labels,
    datasets: [
      {
        label: `${period} Jahre`,
        data: values,
        borderColor: getColorForPeriod(period),
        backgroundColor: getColorForPeriod(period, 0.1),
        fill: true,
        tension: 0.4
      }
    ]
  }
}

const generateStrategyData = (strategy: InvestmentStrategy) => {
  const { labels, values } = calculateCompoundInterest(
    parameters.initialAmount,
    parameters.monthlyContribution,
    strategy.expectedReturn,
    parameters.years
  )

  return {
    labels,
    datasets: [
      {
        label: strategy.name,
        data: values,
        borderColor: getColorForStrategy(strategy.riskLevel),
        backgroundColor: getColorForStrategy(strategy.riskLevel, 0.1),
        fill: true,
        tension: 0.4
      }
    ]
  }
}

const getColorForRate = (rate: number, alpha = 1) => {
  const colors = {
    3: `rgba(34, 197, 94, ${alpha})`,
    5: `rgba(59, 130, 246, ${alpha})`,
    7: `rgba(249, 115, 22, ${alpha})`,
    9: `rgba(239, 68, 68, ${alpha})`
  }
  return colors[rate as keyof typeof colors] || `rgba(107, 114, 128, ${alpha})`
}

const getColorForPeriod = (period: number, alpha = 1) => {
  const colors = {
    10: `rgba(168, 85, 247, ${alpha})`,
    20: `rgba(59, 130, 246, ${alpha})`,
    30: `rgba(16, 185, 129, ${alpha})`,
    40: `rgba(245, 158, 11, ${alpha})`
  }
  return colors[period as keyof typeof colors] || `rgba(107, 114, 128, ${alpha})`
}

const getColorForStrategy = (riskLevel: string, alpha = 1) => {
  const colors = {
    low: `rgba(34, 197, 94, ${alpha})`,
    medium: `rgba(59, 130, 246, ${alpha})`,
    high: `rgba(239, 68, 68, ${alpha})`
  }
  return colors[riskLevel as keyof typeof colors] || `rgba(107, 114, 128, ${alpha})`
}

const handleDataPointSelected = (point: DataPoint) => {
  selectedDataPoint.value = point
  interactionCount.value++
}

const handleZoomChanged = (level: number) => {
  currentZoomLevel.value = level
  interactionCount.value++
}

const handleViewChanged = (view: string) => {
  currentView.value = view
  interactionCount.value++
}

const handleChartExported = (format: string) => {
  exportCount.value++
  console.log(`Chart exported as ${format}`)
}

const getCurrentViewLabel = () => {
  const viewLabels = {
    overview: 'Übersicht',
    growth: 'Wachstum',
    contributions: 'Beiträge',
    comparison: 'Vergleich'
  }
  return viewLabels[currentView.value as keyof typeof viewLabels] || 'Unbekannt'
}

const getViewDescription = () => {
  const descriptions = {
    overview: 'Gesamtentwicklung',
    growth: 'Wachstumsanalyse',
    contributions: 'Beitragsverteilung',
    comparison: 'Vergleichsansicht'
  }
  return descriptions[currentView.value as keyof typeof descriptions] || ''
}

const analyzeDataPoint = () => {
  if (selectedDataPoint.value) {
    alert(`Detailanalyse für Jahr ${selectedDataPoint.value.year} wird geöffnet...`)
  }
}

const compareWithOthers = () => {
  if (selectedDataPoint.value) {
    alert(`Vergleich mit anderen Datenpunkten wird geöffnet...`)
  }
}

const exportDataPoint = () => {
  if (selectedDataPoint.value) {
    const data = JSON.stringify(selectedDataPoint.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `datenpunkt-${selectedDataPoint.value.year}.json`
    a.click()
    URL.revokeObjectURL(url)
    exportCount.value++
  }
}

const demonstrateZoom = () => {
  alert('Verwenden Sie das Mausrad über dem Diagramm zum Zoomen!')
}

const demonstrateSelection = () => {
  alert('Klicken Sie auf einen Datenpunkt im Diagramm!')
}

const demonstrateTooltips = () => {
  alert('Bewegen Sie die Maus über das Diagramm!')
}

const demonstrateSettings = () => {
  alert('Klicken Sie auf das Einstellungen-Symbol im Diagramm!')
}

const resetAllCharts = () => {
  currentZoomLevel.value = 1
  selectedDataPoint.value = null
  interactionCount.value = 0
  updateChartData()
}

const exportAllCharts = () => {
  alert('Alle Diagramme werden exportiert...')
  exportCount.value += 3
}

const shareCharts = () => {
  if (navigator.share) {
    navigator.share({
      title: 'Interaktive Diagramme',
      text: 'Schauen Sie sich diese interaktiven Zinseszins-Diagramme an!'
    })
  } else {
    alert('Diagramme in die Zwischenablage kopiert!')
  }
}

const printCharts = () => {
  window.print()
}

// 生命周期
onMounted(() => {
  updateChartData()
})
</script>

<style scoped>
.interactive-charts-example {
  @apply max-w-7xl mx-auto p-6 space-y-8;
}

.example-header {
  @apply text-center mb-8;
}

.example-header h1 {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.example-header p {
  @apply text-lg text-gray-600;
}

/* 参数配置区域 */
.parameters-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.parameters-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.parameters-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.param-group {
  @apply space-y-2;
}

.param-group label {
  @apply block text-sm font-medium text-gray-700;
}

.param-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* 主图表区域 */
.main-chart-section {
  @apply bg-white rounded-lg shadow-lg border;
}

/* 图表对比区域 */
.chart-comparison-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.chart-comparison-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.comparison-tabs {
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

.comparison-content {
  @apply space-y-6;
}

.comparison-charts {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.comparison-chart {
  @apply border border-gray-200 rounded-lg;
}

/* 选中数据点区域 */
.selected-data-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.selected-data-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.data-details-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6;
}

.detail-card {
  @apply flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200;
}

.card-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.card-content {
  @apply flex-1;
}

.card-label {
  @apply text-sm text-gray-600;
}

.card-value {
  @apply text-lg font-bold text-gray-900;
}

.card-value.positive {
  @apply text-green-600;
}

.card-value.negative {
  @apply text-red-600;
}

.data-actions {
  @apply flex flex-wrap gap-3;
}

/* 图表统计区域 */
.chart-statistics-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.chart-statistics-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.statistics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
  @apply flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200;
}

.stat-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.stat-content {
  @apply flex-1;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply text-lg font-bold text-gray-900;
}

.stat-change {
  @apply text-xs text-gray-500;
}

/* 交互演示区域 */
.interaction-demo-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.interaction-demo-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.demo-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.demo-card {
  @apply flex flex-col items-center text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200;
  @apply hover:shadow-lg transition-shadow;
}

.demo-icon {
  @apply w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4;
}

.demo-content {
  @apply flex-1;
}

.demo-content h4 {
  @apply font-semibold text-gray-900 mb-2;
}

.demo-content p {
  @apply text-sm text-gray-600 mb-4;
}

.demo-button {
  @apply px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700;
  @apply focus:outline-none focus:ring-2 focus:ring-purple-500;
  @apply transition-colors;
}

/* 操作按钮区域 */
.actions-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.action-buttons {
  @apply flex flex-wrap gap-4 justify-center;
}

.action-button {
  @apply flex items-center gap-2 px-6 py-3 rounded-md font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply transition-colors;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.action-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .parameters-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .comparison-charts {
    @apply grid-cols-1;
  }

  .data-details-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .statistics-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .demo-cards {
    @apply grid-cols-1 md:grid-cols-2;
  }
}

@media (max-width: 768px) {
  .interactive-charts-example {
    @apply p-4;
  }

  .example-header h1 {
    @apply text-2xl;
  }

  .parameters-grid {
    @apply grid-cols-1;
  }

  .comparison-tabs {
    @apply flex-wrap;
  }

  .tab-button {
    @apply flex-1 justify-center;
  }

  .data-details-grid {
    @apply grid-cols-1;
  }

  .detail-card {
    @apply flex-col text-center;
  }

  .card-icon {
    @apply mb-3;
  }

  .data-actions {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }

  .statistics-grid {
    @apply grid-cols-1;
  }

  .stat-card {
    @apply flex-col text-center;
  }

  .stat-icon {
    @apply mb-3;
  }

  .demo-cards {
    @apply grid-cols-1;
  }

  .action-buttons {
    @apply flex-col;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .interactive-charts-example {
    @apply bg-gray-900;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .parameters-section,
  .chart-comparison-section,
  .selected-data-section,
  .chart-statistics-section,
  .interaction-demo-section,
  .actions-section {
    @apply bg-gray-800 border-gray-700;
  }

  .parameters-section h2,
  .chart-comparison-section h2,
  .selected-data-section h2,
  .chart-statistics-section h2,
  .interaction-demo-section h2 {
    @apply text-gray-100;
  }

  .param-group label {
    @apply text-gray-300;
  }

  .param-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .tab-button {
    @apply text-gray-400 hover:text-gray-200;
  }

  .tab-button.active {
    @apply text-blue-400 border-blue-400;
  }

  .comparison-chart {
    @apply border-gray-700;
  }

  .detail-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
  }

  .card-label {
    @apply text-gray-300;
  }

  .card-value {
    @apply text-gray-100;
  }

  .stat-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
  }

  .stat-label {
    @apply text-gray-300;
  }

  .stat-value {
    @apply text-gray-100;
  }

  .stat-change {
    @apply text-gray-400;
  }

  .demo-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
  }

  .demo-content h4 {
    @apply text-gray-100;
  }

  .demo-content p {
    @apply text-gray-300;
  }

  .action-button.secondary {
    @apply bg-gray-600 text-gray-200 hover:bg-gray-500;
  }
}
</style>
