<!--
  复利增长图表组件
  专业的复利增长可视化图表，支持多种显示模式和交互功能
-->

<template>
  <div class="compound-growth-chart">
    <!-- 图表头部 -->
    <div class="chart-header">
      <h3 class="chart-title">
        <Icon name="trending-up" size="lg" />
        Zinswachstum Visualisierung
      </h3>
      <div class="chart-controls">
        <div class="view-mode-selector">
          <button
            v-for="mode in displayModes"
            :key="mode.id"
            @click="currentDisplayMode = mode.id"
            class="mode-button"
            :class="{ 'active': currentDisplayMode === mode.id }"
          >
            <Icon :name="mode.icon" size="sm" />
            <span>{{ mode.label }}</span>
          </button>
        </div>
        <div class="chart-actions">
          <button @click="resetZoom" class="action-button" title="Zoom zurücksetzen">
            <Icon name="maximize-2" size="sm" />
          </button>
          <button @click="togglePanMode" class="action-button" :class="{ 'active': panModeEnabled }" title="Verschieben">
            <Icon name="move" size="sm" />
          </button>
          <button @click="toggleFullscreen" class="action-button">
            <Icon :name="isFullscreen ? 'minimize-2' : 'maximize'" size="sm" />
          </button>
          <button @click="exportChart" class="action-button">
            <Icon name="download" size="sm" />
          </button>
        </div>
      </div>
    </div>

    <!-- 图表配置面板 -->
    <div class="chart-config-panel" :class="{ 'collapsed': !showConfigPanel }">
      <div class="config-header">
        <h4>Diagramm-Einstellungen</h4>
        <button @click="toggleConfigPanel" class="toggle-button">
          <Icon :name="showConfigPanel ? 'chevron-up' : 'chevron-down'" size="sm" />
        </button>
      </div>

      <div v-if="showConfigPanel" class="config-content">
        <div class="config-grid">
          <div class="config-group">
            <label>Zeitraum</label>
            <select v-model="chartConfig.timeRange" @change="updateChart">
              <option value="all">Gesamter Zeitraum</option>
              <option value="10">Erste 10 Jahre</option>
              <option value="20">Erste 20 Jahre</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
          </div>

          <div class="config-group">
            <label>Datenpunkte</label>
            <select v-model="chartConfig.dataPoints" @change="updateChart">
              <option value="yearly">Jährlich</option>
              <option value="monthly">Monatlich</option>
              <option value="quarterly">Quartalsweise</option>
            </select>
          </div>

          <div class="config-group">
            <label>Währungsformat</label>
            <select v-model="chartConfig.currencyFormat" @change="updateChart">
              <option value="full">Vollständig (€1.234,56)</option>
              <option value="abbreviated">Abgekürzt (€1,2K)</option>
              <option value="scientific">Wissenschaftlich</option>
            </select>
          </div>

          <div class="config-group">
            <label class="checkbox-label">
              <input
                v-model="chartConfig.showInflationAdjusted"
                type="checkbox"
                @change="updateChart"
              />
              <span>Inflationsbereinigt anzeigen</span>
            </label>
          </div>

          <div class="config-group">
            <label class="checkbox-label">
              <input
                v-model="chartConfig.showContributions"
                type="checkbox"
                @change="updateChart"
              />
              <span>Einzahlungen hervorheben</span>
            </label>
          </div>

          <div class="config-group">
            <label class="checkbox-label">
              <input
                v-model="chartConfig.showInterestOnly"
                type="checkbox"
                @change="updateChart"
              />
              <span>Nur Zinserträge anzeigen</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container" :class="{ 'fullscreen': isFullscreen }">
      <div class="chart-wrapper">
        <canvas ref="chartCanvas" class="growth-chart"></canvas>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="chart-loading">
          <div class="loading-spinner"></div>
          <p>Diagramm wird geladen...</p>
        </div>

        <!-- 无数据状态 -->
        <div v-if="!hasData && !isLoading" class="chart-empty">
          <Icon name="bar-chart-2" size="xl" />
          <h4>Keine Daten verfügbar</h4>
          <p>Geben Sie Ihre Investitionsparameter ein, um das Wachstumsdiagramm zu sehen.</p>
        </div>
      </div>

      <!-- 图表图例 -->
      <div v-if="hasData" class="chart-legend">
        <div
          v-for="(item, index) in chartLegend"
          :key="index"
          class="legend-item"
          @click="toggleDataset(index)"
          :class="{ 'disabled': item.hidden }"
        >
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <span class="legend-label">{{ item.label }}</span>
          <span class="legend-value">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <!-- 数据洞察面板 -->
    <div v-if="hasData" class="insights-panel">
      <h4>Wachstums-Insights</h4>
      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-icon">
            <Icon name="trending-up" size="md" />
          </div>
          <div class="insight-content">
            <div class="insight-label">Durchschnittliches jährliches Wachstum</div>
            <div class="insight-value">{{ formatPercentage(insights.averageGrowthRate) }}</div>
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-icon">
            <Icon name="zap" size="md" />
          </div>
          <div class="insight-content">
            <div class="insight-label">Zinseszins-Effekt</div>
            <div class="insight-value">{{ formatCurrency(insights.compoundEffect) }}</div>
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-icon">
            <Icon name="calendar" size="md" />
          </div>
          <div class="insight-content">
            <div class="insight-label">Verdoppelungszeit</div>
            <div class="insight-value">{{ insights.doublingTime }} Jahre</div>
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-icon">
            <Icon name="target" size="md" />
          </div>
          <div class="insight-content">
            <div class="insight-label">ROI nach {{ totalYears }} Jahren</div>
            <div class="insight-value">{{ formatPercentage(insights.totalROI) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 交互式数据点信息 -->
    <Transition name="tooltip-fade">
      <div
        v-if="hoveredDataPoint"
        class="data-point-tooltip"
        :style="tooltipPosition"
      >
        <div class="tooltip-header">
          <strong>Jahr {{ hoveredDataPoint.year }}</strong>
        </div>
        <div class="tooltip-content">
          <div class="tooltip-row">
            <span>Gesamtwert:</span>
            <span class="value">{{ formatCurrency(hoveredDataPoint.totalValue) }}</span>
          </div>
          <div class="tooltip-row">
            <span>Einzahlungen:</span>
            <span class="value">{{ formatCurrency(hoveredDataPoint.contributions) }}</span>
          </div>
          <div class="tooltip-row">
            <span>Zinserträge:</span>
            <span class="value positive">{{ formatCurrency(hoveredDataPoint.interest) }}</span>
          </div>
          <div class="tooltip-row">
            <span>Jährliches Wachstum:</span>
            <span class="value">{{ formatPercentage(hoveredDataPoint.growthRate) }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 注册Chart.js组件和插件
Chart.register(...registerables, zoomPlugin)

// 接口定义
interface YearlyData {
  year: number
  totalValue: number
  contributions: number
  interest: number
  growthRate: number
  inflationAdjustedValue?: number
}

interface ChartConfig {
  timeRange: string
  dataPoints: 'yearly' | 'monthly' | 'quarterly'
  currencyFormat: 'full' | 'abbreviated' | 'scientific'
  showInflationAdjusted: boolean
  showContributions: boolean
  showInterestOnly: boolean
}

interface DisplayMode {
  id: string
  label: string
  icon: string
}

interface ChartInsights {
  averageGrowthRate: number
  compoundEffect: number
  doublingTime: number
  totalROI: number
}

// Props定义
interface Props {
  data: YearlyData[]
  initialAmount?: number
  monthlyContribution?: number
  annualRate?: number
  years?: number
  inflationRate?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialAmount: 0,
  monthlyContribution: 0,
  annualRate: 0,
  years: 0,
  inflationRate: 2
})

// Emits定义
interface Emits {
  'data-point-click': [data: YearlyData]
  'chart-export': [format: string]
  'config-change': [config: ChartConfig]
}

const emit = defineEmits<Emits>()

// 响应式数据
const chartCanvas = ref<HTMLCanvasElement>()
const currentDisplayMode = ref('line')
const showConfigPanel = ref(false)
const isFullscreen = ref(false)
const isLoading = ref(false)
const hoveredDataPoint = ref<YearlyData | null>(null)
const tooltipPosition = ref({ left: '0px', top: '0px' })
const panModeEnabled = ref(false)
const zoomLevel = ref(1)
const selectedDataPoints = ref<YearlyData[]>([])

let chart: Chart | null = null

const chartConfig = ref<ChartConfig>({
  timeRange: 'all',
  dataPoints: 'yearly',
  currencyFormat: 'full',
  showInflationAdjusted: false,
  showContributions: true,
  showInterestOnly: false
})

// 显示模式配置
const displayModes: DisplayMode[] = [
  { id: 'line', label: 'Linie', icon: 'trending-up' },
  { id: 'area', label: 'Fläche', icon: 'activity' },
  { id: 'bar', label: 'Balken', icon: 'bar-chart' },
  { id: 'stacked', label: 'Gestapelt', icon: 'layers' }
]

// 计算属性
const hasData = computed(() => props.data && props.data.length > 0)

const totalYears = computed(() => props.years || (props.data?.length || 0))

const chartLegend = computed(() => {
  if (!hasData.value) return []

  const legend = []

  if (chartConfig.value.showContributions) {
    legend.push({
      label: 'Einzahlungen',
      color: '#3b82f6',
      value: formatCurrency(props.data[props.data.length - 1]?.contributions || 0),
      hidden: false
    })
  }

  legend.push({
    label: 'Zinserträge',
    color: '#10b981',
    value: formatCurrency(props.data[props.data.length - 1]?.interest || 0),
    hidden: false
  })

  if (chartConfig.value.showInflationAdjusted) {
    legend.push({
      label: 'Inflationsbereinigt',
      color: '#f59e0b',
      value: formatCurrency(props.data[props.data.length - 1]?.inflationAdjustedValue || 0),
      hidden: false
    })
  }

  return legend
})

const insights = computed((): ChartInsights => {
  if (!hasData.value) {
    return {
      averageGrowthRate: 0,
      compoundEffect: 0,
      doublingTime: 0,
      totalROI: 0
    }
  }

  const lastData = props.data[props.data.length - 1]
  const totalContributions = lastData.contributions
  const totalValue = lastData.totalValue
  const compoundEffect = totalValue - totalContributions

  // 计算平均增长率
  const years = props.data.length
  const averageGrowthRate = years > 1 ? Math.pow(totalValue / props.initialAmount, 1 / years) - 1 : 0

  // 计算翻倍时间（72法则）
  const doublingTime = props.annualRate > 0 ? Math.round(72 / (props.annualRate * 100)) : 0

  // 计算总ROI
  const totalROI = totalContributions > 0 ? (totalValue - totalContributions) / totalContributions : 0

  return {
    averageGrowthRate,
    compoundEffect,
    doublingTime,
    totalROI
  }
})

// 方法
const createChart = () => {
  if (!chartCanvas.value || !hasData.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  if (chart) {
    chart.destroy()
  }

  const chartData = prepareChartData()
  const chartOptions = getChartOptions()

  chart = new Chart(ctx, {
    type: getChartType(),
    data: chartData,
    options: chartOptions
  })
}

const prepareChartData = () => {
  const labels = props.data.map(item => `Jahr ${item.year}`)
  const datasets = []

  if (chartConfig.value.showContributions && !chartConfig.value.showInterestOnly) {
    datasets.push({
      label: 'Einzahlungen',
      data: props.data.map(item => item.contributions),
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      fill: currentDisplayMode.value === 'area'
    })
  }

  datasets.push({
    label: chartConfig.value.showInterestOnly ? 'Zinserträge' : 'Gesamtwert',
    data: props.data.map(item =>
      chartConfig.value.showInterestOnly ? item.interest : item.totalValue
    ),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
    borderWidth: 2,
    fill: currentDisplayMode.value === 'area'
  })

  if (chartConfig.value.showInflationAdjusted && !chartConfig.value.showInterestOnly) {
    datasets.push({
      label: 'Inflationsbereinigt',
      data: props.data.map(item => item.inflationAdjustedValue || item.totalValue),
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: '#f59e0b',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false
    })
  }

  return { labels, datasets }
}

const getChartType = () => {
  switch (currentDisplayMode.value) {
    case 'bar':
    case 'stacked':
      return 'bar'
    default:
      return 'line'
  }
}

const getChartOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: false // 使用自定义图例
      },
      tooltip: {
        enabled: false, // 使用自定义tooltip
        external: handleTooltip
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
          onZoom: (context: any) => {
            zoomLevel.value = context.chart.getZoomLevel()
          }
        },
        pan: {
          enabled: panModeEnabled.value,
          mode: 'x'
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Zeit'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Wert (€)'
        },
        ticks: {
          callback: (value: any) => formatCurrencyForChart(value)
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    onHover: handleChartHover,
    onClick: handleChartClick
  }
}

const formatCurrencyForChart = (value: number): string => {
  switch (chartConfig.value.currencyFormat) {
    case 'abbreviated':
      if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `€${(value / 1000).toFixed(1)}K`
      return `€${value.toFixed(0)}`
    case 'scientific':
      return value.toExponential(2)
    default:
      return formatCurrency(value)
  }
}

const handleTooltip = (context: any) => {
  // 自定义tooltip处理逻辑
  const tooltipModel = context.tooltip

  if (tooltipModel.opacity === 0) {
    hoveredDataPoint.value = null
    return
  }

  const dataIndex = tooltipModel.dataPoints[0].dataIndex
  hoveredDataPoint.value = props.data[dataIndex]

  // 更新tooltip位置
  tooltipPosition.value = {
    left: `${context.chart.canvas.offsetLeft + tooltipModel.caretX}px`,
    top: `${context.chart.canvas.offsetTop + tooltipModel.caretY}px`
  }
}

const handleChartHover = (event: any, elements: any[]) => {
  if (elements.length > 0) {
    const dataIndex = elements[0].index
    hoveredDataPoint.value = props.data[dataIndex]
  }
}

const handleChartClick = (event: any, elements: any[]) => {
  if (elements.length > 0) {
    const dataIndex = elements[0].index
    emit('data-point-click', props.data[dataIndex])
  }
}

const updateChart = () => {
  emit('config-change', chartConfig.value)
  nextTick(() => createChart())
}

const toggleDataset = (index: number) => {
  if (chart) {
    const meta = chart.getDatasetMeta(index)
    meta.hidden = !meta.hidden
    chart.update()

    // 更新图例状态
    chartLegend.value[index].hidden = meta.hidden
  }
}

const toggleConfigPanel = () => {
  showConfigPanel.value = !showConfigPanel.value
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    if (chart) {
      chart.resize()
    }
  })
}

const exportChart = () => {
  if (chart) {
    const url = chart.toBase64Image()
    const link = document.createElement('a')
    link.download = 'zinswachstum-diagramm.png'
    link.href = url
    link.click()

    emit('chart-export', 'png')
  }
}

const resetZoom = () => {
  if (chart) {
    chart.resetZoom()
    zoomLevel.value = 1
  }
}

const togglePanMode = () => {
  panModeEnabled.value = !panModeEnabled.value
  if (chart) {
    chart.options.plugins.zoom.pan.enabled = panModeEnabled.value
    chart.update()
  }
}

// 监听器
watch(() => props.data, () => {
  if (hasData.value) {
    isLoading.value = true
    nextTick(() => {
      createChart()
      isLoading.value = false
    })
  }
}, { deep: true })

watch(currentDisplayMode, () => {
  updateChart()
})

// 生命周期
onMounted(() => {
  if (hasData.value) {
    nextTick(() => createChart())
  }
})
</script>

<style scoped>
.compound-growth-chart {
  @apply bg-white rounded-lg shadow-lg border p-6 space-y-6;
}

/* 图表头部 */
.chart-header {
  @apply flex items-center justify-between;
}

.chart-title {
  @apply flex items-center gap-3 text-xl font-bold text-gray-800;
}

.chart-controls {
  @apply flex items-center gap-4;
}

.view-mode-selector {
  @apply flex gap-2;
}

.mode-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm rounded-md;
  @apply text-gray-600 hover:text-gray-900 hover:bg-gray-100;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-all duration-200;
}

.mode-button.active {
  @apply bg-blue-100 text-blue-700 shadow-sm;
}

.chart-actions {
  @apply flex gap-2;
}

.action-button {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors;
}

.action-button.active {
  @apply bg-blue-100 text-blue-700;
}

/* 配置面板 */
.chart-config-panel {
  @apply bg-gray-50 rounded-lg border transition-all duration-300;
}

.chart-config-panel.collapsed {
  @apply bg-transparent border-transparent;
}

.config-header {
  @apply flex items-center justify-between p-4;
}

.config-header h4 {
  @apply font-semibold text-gray-800;
}

.toggle-button {
  @apply p-1 text-gray-500 hover:text-gray-700 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.config-content {
  @apply px-4 pb-4;
}

.config-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.config-group {
  @apply space-y-2;
}

.config-group label {
  @apply block text-sm font-medium text-gray-700;
}

.config-group select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.checkbox-label {
  @apply flex items-center gap-2 cursor-pointer;
}

.checkbox-label input[type="checkbox"] {
  @apply rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

.checkbox-label span {
  @apply text-sm text-gray-700;
}

/* 图表容器 */
.chart-container {
  @apply relative bg-white rounded-lg border;
  @apply transition-all duration-300;
}

.chart-container.fullscreen {
  @apply fixed inset-4 z-50 shadow-2xl;
}

.chart-wrapper {
  @apply relative p-4;
  @apply min-h-96;
}

.growth-chart {
  @apply w-full h-full;
}

/* 加载和空状态 */
.chart-loading {
  @apply absolute inset-0 flex flex-col items-center justify-center;
  @apply bg-white bg-opacity-90;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4;
}

.chart-loading p {
  @apply text-gray-600;
}

.chart-empty {
  @apply absolute inset-0 flex flex-col items-center justify-center text-gray-500;
}

.chart-empty h4 {
  @apply text-lg font-semibold mt-4 mb-2;
}

.chart-empty p {
  @apply text-center max-w-md;
}

/* 图例 */
.chart-legend {
  @apply flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg mt-4;
}

.legend-item {
  @apply flex items-center gap-2 cursor-pointer;
  @apply hover:bg-gray-100 px-2 py-1 rounded transition-colors;
}

.legend-item.disabled {
  @apply opacity-50;
}

.legend-color {
  @apply w-4 h-4 rounded;
}

.legend-label {
  @apply text-sm font-medium text-gray-700;
}

.legend-value {
  @apply text-sm text-gray-600;
}

/* 数据洞察面板 */
.insights-panel {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200;
}

.insights-panel h4 {
  @apply text-lg font-semibold text-gray-800 mb-4;
}

.insights-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.insight-card {
  @apply flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border;
  @apply hover:shadow-md transition-shadow;
}

.insight-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.insight-content {
  @apply flex-1;
}

.insight-label {
  @apply text-sm text-gray-600 mb-1;
}

.insight-value {
  @apply text-lg font-bold text-gray-900;
}

/* 交互式tooltip */
.data-point-tooltip {
  @apply absolute z-50 bg-gray-900 text-white rounded-lg shadow-xl p-4;
  @apply pointer-events-none transform -translate-x-1/2 -translate-y-full;
  @apply min-w-64;
}

.data-point-tooltip::after {
  content: '';
  @apply absolute top-full left-1/2 transform -translate-x-1/2;
  @apply border-4 border-transparent border-t-gray-900;
}

.tooltip-header {
  @apply text-center mb-3 pb-2 border-b border-gray-700;
}

.tooltip-content {
  @apply space-y-2;
}

.tooltip-row {
  @apply flex justify-between items-center;
}

.tooltip-row .value {
  @apply font-semibold;
}

.tooltip-row .value.positive {
  @apply text-green-400;
}

/* 过渡动画 */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  @apply transition-all duration-200;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  @apply opacity-0 transform scale-95;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .chart-header {
    @apply flex-col items-start gap-4;
  }

  .chart-controls {
    @apply w-full justify-between;
  }

  .view-mode-selector {
    @apply flex-wrap;
  }

  .config-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .insights-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .chart-legend {
    @apply flex-col gap-2;
  }
}

@media (max-width: 768px) {
  .compound-growth-chart {
    @apply p-4;
  }

  .chart-title {
    @apply text-lg;
  }

  .view-mode-selector {
    @apply grid grid-cols-2 gap-2 w-full;
  }

  .mode-button {
    @apply justify-center;
  }

  .config-grid {
    @apply grid-cols-1;
  }

  .insights-grid {
    @apply grid-cols-1;
  }

  .insight-card {
    @apply flex-col text-center;
  }

  .insight-icon {
    @apply mb-2;
  }

  .chart-container.fullscreen {
    @apply inset-2;
  }

  .data-point-tooltip {
    @apply min-w-48 text-sm;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .compound-growth-chart {
    @apply bg-gray-800 border-gray-700;
  }

  .chart-title {
    @apply text-gray-100;
  }

  .mode-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-700;
  }

  .mode-button.active {
    @apply bg-blue-900 text-blue-300;
  }

  .action-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-700;
  }

  .chart-config-panel {
    @apply bg-gray-700 border-gray-600;
  }

  .config-header h4 {
    @apply text-gray-100;
  }

  .toggle-button {
    @apply text-gray-400 hover:text-gray-200;
  }

  .config-group label {
    @apply text-gray-300;
  }

  .config-group select {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .checkbox-label span {
    @apply text-gray-300;
  }

  .chart-container {
    @apply bg-gray-800 border-gray-700;
  }

  .chart-loading {
    @apply bg-gray-800 bg-opacity-90;
  }

  .chart-loading p {
    @apply text-gray-300;
  }

  .chart-empty {
    @apply text-gray-400;
  }

  .chart-empty h4 {
    @apply text-gray-300;
  }

  .chart-legend {
    @apply bg-gray-700;
  }

  .legend-item {
    @apply hover:bg-gray-600;
  }

  .legend-label {
    @apply text-gray-300;
  }

  .legend-value {
    @apply text-gray-400;
  }

  .insights-panel {
    @apply bg-gradient-to-r from-gray-700 to-gray-600 border-gray-600;
  }

  .insights-panel h4 {
    @apply text-gray-100;
  }

  .insight-card {
    @apply bg-gray-700 border-gray-600;
  }

  .insight-icon {
    @apply bg-blue-900 text-blue-300;
  }

  .insight-label {
    @apply text-gray-300;
  }

  .insight-value {
    @apply text-gray-100;
  }

  .data-point-tooltip {
    @apply bg-gray-700 border border-gray-600;
  }

  .data-point-tooltip::after {
    @apply border-t-gray-700;
  }

  .tooltip-header {
    @apply border-gray-600;
  }
}

/* 打印样式 */
@media print {
  .compound-growth-chart {
    @apply shadow-none border border-gray-300;
  }

  .chart-controls,
  .chart-config-panel {
    @apply hidden;
  }

  .chart-container {
    @apply shadow-none;
  }

  .data-point-tooltip {
    @apply hidden;
  }
}
</style>
