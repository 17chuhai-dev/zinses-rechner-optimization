<!--
  交互式图表组件
  支持缩放、悬停提示、数据点选择等高级交互功能
-->

<template>
  <div class="interactive-chart">
    <!-- 图表控制面板 -->
    <div class="chart-controls">
      <div class="control-group">
        <button
          v-for="view in chartViews"
          :key="view.id"
          @click="activeView = view.id"
          class="view-button"
          :class="{ 'active': activeView === view.id }"
        >
          <Icon :name="view.icon" size="sm" />
          {{ view.label }}
        </button>
      </div>

      <div class="control-group">
        <button @click="resetZoom" class="control-button" title="Zoom zurücksetzen">
          <Icon name="maximize-2" size="sm" />
        </button>
        <button @click="toggleFullscreen" class="control-button" title="Vollbild">
          <Icon :name="isFullscreen ? 'minimize-2' : 'maximize'" size="sm" />
        </button>
        <button @click="exportChart" class="control-button" title="Exportieren">
          <Icon name="download" size="sm" />
        </button>
        <button @click="toggleAnimations" class="control-button" title="Animationen">
          <Icon :name="animationsEnabled ? 'pause' : 'play'" size="sm" />
        </button>
      </div>
    </div>

    <!-- 图表容器 -->
    <div
      ref="chartContainer"
      class="chart-container"
      :class="{ 'fullscreen': isFullscreen }"
    >
      <canvas ref="chartCanvas"></canvas>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="chart-loading">
        <div class="loading-spinner"></div>
        <span>Lade Diagramm...</span>
      </div>

      <!-- 数据点详情面板 -->
      <Transition name="slide-up">
        <div v-if="selectedDataPoint" class="data-point-panel">
          <div class="panel-header">
            <h4>Datenpunkt Details</h4>
            <button @click="selectedDataPoint = null" class="close-button">
              <Icon name="x" size="sm" />
            </button>
          </div>

          <div class="panel-content">
            <div class="data-item">
              <span class="data-label">Jahr:</span>
              <span class="data-value">{{ selectedDataPoint.year }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Wert:</span>
              <span class="data-value">{{ formatCurrency(selectedDataPoint.value) }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Wachstum:</span>
              <span class="data-value" :class="selectedDataPoint.growth >= 0 ? 'positive' : 'negative'">
                {{ selectedDataPoint.growth >= 0 ? '+' : '' }}{{ formatPercentage(selectedDataPoint.growth) }}
              </span>
            </div>
            <div class="data-item">
              <span class="data-label">Beiträge:</span>
              <span class="data-value">{{ formatCurrency(selectedDataPoint.contributions) }}</span>
            </div>
          </div>

          <div class="panel-actions">
            <button @click="highlightDataPoint" class="highlight-button">
              <Icon name="target" size="sm" />
              Hervorheben
            </button>
            <button @click="compareDataPoint" class="compare-button">
              <Icon name="bar-chart-2" size="sm" />
              Vergleichen
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 图表信息面板 -->
    <div class="chart-info">
      <div class="info-stats">
        <div class="stat-item">
          <span class="stat-label">Datenpunkte:</span>
          <span class="stat-value">{{ totalDataPoints }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Zeitraum:</span>
          <span class="stat-value">{{ timeRange }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Zoom:</span>
          <span class="stat-value">{{ Math.round(zoomLevel * 100) }}%</span>
        </div>
      </div>

      <div class="info-actions">
        <button @click="showChartSettings" class="settings-button">
          <Icon name="settings" size="sm" />
          Einstellungen
        </button>
      </div>
    </div>

    <!-- 图表设置模态框 -->
    <Transition name="modal-fade">
      <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Diagramm-Einstellungen</h3>
            <button @click="showSettings = false" class="modal-close">
              <Icon name="x" size="md" />
            </button>
          </div>

          <div class="modal-body">
            <div class="settings-section">
              <h4>Darstellung</h4>
              <div class="setting-item">
                <label>Diagrammtyp:</label>
                <select v-model="chartSettings.type" @change="updateChartType">
                  <option value="line">Linie</option>
                  <option value="bar">Balken</option>
                  <option value="area">Fläche</option>
                </select>
              </div>

              <div class="setting-item">
                <label>Farbschema:</label>
                <select v-model="chartSettings.colorScheme" @change="updateColorScheme">
                  <option value="default">Standard</option>
                  <option value="blue">Blau</option>
                  <option value="green">Grün</option>
                  <option value="purple">Lila</option>
                </select>
              </div>

              <div class="setting-item">
                <label>
                  <input
                    v-model="chartSettings.showGrid"
                    type="checkbox"
                    @change="updateGridDisplay"
                  />
                  Gitter anzeigen
                </label>
              </div>

              <div class="setting-item">
                <label>
                  <input
                    v-model="chartSettings.showLegend"
                    type="checkbox"
                    @change="updateLegendDisplay"
                  />
                  Legende anzeigen
                </label>
              </div>
            </div>

            <div class="settings-section">
              <h4>Interaktion</h4>
              <div class="setting-item">
                <label>
                  <input
                    v-model="chartSettings.enableZoom"
                    type="checkbox"
                    @change="updateZoomSettings"
                  />
                  Zoom aktivieren
                </label>
              </div>

              <div class="setting-item">
                <label>
                  <input
                    v-model="chartSettings.enablePan"
                    type="checkbox"
                    @change="updatePanSettings"
                  />
                  Verschieben aktivieren
                </label>
              </div>

              <div class="setting-item">
                <label>
                  <input
                    v-model="chartSettings.enableSelection"
                    type="checkbox"
                    @change="updateSelectionSettings"
                  />
                  Datenpunkt-Auswahl aktivieren
                </label>
              </div>
            </div>

            <div class="settings-section">
              <h4>Animation</h4>
              <div class="setting-item">
                <label>Animationsdauer (ms):</label>
                <input
                  v-model.number="chartSettings.animationDuration"
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  @input="updateAnimationSettings"
                />
                <span>{{ chartSettings.animationDuration }}ms</span>
              </div>

              <div class="setting-item">
                <label>Animationstyp:</label>
                <select v-model="chartSettings.animationType" @change="updateAnimationSettings">
                  <option value="easeInOut">Sanft</option>
                  <option value="easeIn">Einblenden</option>
                  <option value="easeOut">Ausblenden</option>
                  <option value="linear">Linear</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="resetSettings" class="reset-button">
              Zurücksetzen
            </button>
            <button @click="showSettings = false" class="apply-button">
              Anwenden
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 注册Chart.js组件和插件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
)

// 接口定义
interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
    tension?: number
  }[]
}

interface DataPoint {
  year: number
  value: number
  growth: number
  contributions: number
}

interface ChartSettings {
  type: 'line' | 'bar' | 'area'
  colorScheme: 'default' | 'blue' | 'green' | 'purple'
  showGrid: boolean
  showLegend: boolean
  enableZoom: boolean
  enablePan: boolean
  enableSelection: boolean
  animationDuration: number
  animationType: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear'
}

// Props定义
interface Props {
  data: ChartData
  title?: string
  height?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Interaktives Diagramm',
  height: 400,
  loading: false
})

// Emits定义
interface Emits {
  'data-point-selected': [point: DataPoint]
  'zoom-changed': [level: number]
  'view-changed': [view: string]
  'chart-exported': [format: string]
}

const emit = defineEmits<Emits>()

// 响应式数据
const chartCanvas = ref<HTMLCanvasElement>()
const chartContainer = ref<HTMLDivElement>()
const chart = ref<ChartJS | null>(null)

const activeView = ref('overview')
const isFullscreen = ref(false)
const isLoading = ref(false)
const animationsEnabled = ref(true)
const showSettings = ref(false)
const selectedDataPoint = ref<DataPoint | null>(null)
const zoomLevel = ref(1)

const chartSettings = ref<ChartSettings>({
  type: 'line',
  colorScheme: 'default',
  showGrid: true,
  showLegend: true,
  enableZoom: true,
  enablePan: true,
  enableSelection: true,
  animationDuration: 750,
  animationType: 'easeInOut'
})

// 图表视图选项
const chartViews = [
  { id: 'overview', label: 'Übersicht', icon: 'bar-chart' },
  { id: 'growth', label: 'Wachstum', icon: 'trending-up' },
  { id: 'contributions', label: 'Beiträge', icon: 'plus-circle' },
  { id: 'comparison', label: 'Vergleich', icon: 'layers' }
]

// 计算属性
const totalDataPoints = computed(() => {
  return props.data.labels?.length || 0
})

const timeRange = computed(() => {
  if (!props.data.labels || props.data.labels.length === 0) return 'N/A'
  const first = props.data.labels[0]
  const last = props.data.labels[props.data.labels.length - 1]
  return `${first} - ${last}`
})

// 方法
const initializeChart = async () => {
  if (!chartCanvas.value) return

  await nextTick()

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  chart.value = new ChartJS(ctx, {
    type: chartSettings.value.type,
    data: props.data,
    options: getChartOptions()
  })
}

const getChartOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: animationsEnabled.value ? chartSettings.value.animationDuration : 0,
      easing: chartSettings.value.animationType
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      title: {
        display: !!props.title,
        text: props.title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        display: chartSettings.value.showLegend,
        position: 'top' as const
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return `Jahr ${context[0].label}`
          },
          label: (context: any) => {
            const label = context.dataset.label || ''
            const value = formatCurrency(context.parsed.y)
            return `${label}: ${value}`
          },
          afterBody: (context: any) => {
            if (context.length > 0) {
              const dataIndex = context[0].dataIndex
              const growth = calculateGrowth(dataIndex)
              return growth !== null ? [`Wachstum: ${formatPercentage(growth)}`] : []
            }
            return []
          }
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: chartSettings.value.enableZoom
          },
          pinch: {
            enabled: chartSettings.value.enableZoom
          },
          mode: 'x' as const,
          onZoom: (context: any) => {
            zoomLevel.value = context.chart.getZoomLevel()
            emit('zoom-changed', zoomLevel.value)
          }
        },
        pan: {
          enabled: chartSettings.value.enablePan,
          mode: 'x' as const
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: chartSettings.value.showGrid
        },
        title: {
          display: true,
          text: 'Jahre'
        }
      },
      y: {
        display: true,
        grid: {
          display: chartSettings.value.showGrid
        },
        title: {
          display: true,
          text: 'Wert (€)'
        },
        ticks: {
          callback: (value: any) => formatCurrency(value)
        }
      }
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && chartSettings.value.enableSelection) {
        const element = elements[0]
        const dataIndex = element.index
        const datasetIndex = element.datasetIndex

        const point: DataPoint = {
          year: parseInt(props.data.labels[dataIndex]),
          value: props.data.datasets[datasetIndex].data[dataIndex],
          growth: calculateGrowth(dataIndex) || 0,
          contributions: calculateContributions(dataIndex)
        }

        selectedDataPoint.value = point
        emit('data-point-selected', point)
      }
    }
  }
}

const calculateGrowth = (index: number): number | null => {
  if (index === 0 || !props.data.datasets[0]) return null
  const current = props.data.datasets[0].data[index]
  const previous = props.data.datasets[0].data[index - 1]
  return previous !== 0 ? (current - previous) / previous : 0
}

const calculateContributions = (index: number): number => {
  // 简化计算，实际应该基于具体的贡献数据
  return props.data.datasets[0]?.data[index] * 0.1 || 0
}

const resetZoom = () => {
  if (chart.value) {
    chart.value.resetZoom()
    zoomLevel.value = 1
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    chartContainer.value?.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const exportChart = () => {
  if (chart.value) {
    const url = chart.value.toBase64Image()
    const link = document.createElement('a')
    link.download = `chart-${Date.now()}.png`
    link.href = url
    link.click()
    emit('chart-exported', 'png')
  }
}

const toggleAnimations = () => {
  animationsEnabled.value = !animationsEnabled.value
  updateChart()
}

const showChartSettings = () => {
  showSettings.value = true
}

const updateChartType = () => {
  if (chart.value) {
    chart.value.config.type = chartSettings.value.type
    chart.value.update()
  }
}

const updateColorScheme = () => {
  // 实现颜色方案更新逻辑
  updateChart()
}

const updateGridDisplay = () => {
  updateChart()
}

const updateLegendDisplay = () => {
  updateChart()
}

const updateZoomSettings = () => {
  updateChart()
}

const updatePanSettings = () => {
  updateChart()
}

const updateSelectionSettings = () => {
  updateChart()
}

const updateAnimationSettings = () => {
  updateChart()
}

const updateChart = () => {
  if (chart.value) {
    chart.value.options = getChartOptions()
    chart.value.update()
  }
}

const resetSettings = () => {
  chartSettings.value = {
    type: 'line',
    colorScheme: 'default',
    showGrid: true,
    showLegend: true,
    enableZoom: true,
    enablePan: true,
    enableSelection: true,
    animationDuration: 750,
    animationType: 'easeInOut'
  }
  updateChart()
}

const highlightDataPoint = () => {
  // 实现数据点高亮逻辑
  console.log('Highlighting data point:', selectedDataPoint.value)
}

const compareDataPoint = () => {
  // 实现数据点比较逻辑
  console.log('Comparing data point:', selectedDataPoint.value)
}

// 监听器
watch(() => props.data, () => {
  if (chart.value) {
    chart.value.data = props.data
    chart.value.update()
  }
}, { deep: true })

watch(() => props.loading, (newLoading) => {
  isLoading.value = newLoading
})

watch(activeView, (newView) => {
  emit('view-changed', newView)
})

// 生命周期
onMounted(() => {
  initializeChart()
})

onUnmounted(() => {
  if (chart.value) {
    chart.value.destroy()
  }
})
</script>

<style scoped>
.interactive-chart {
  @apply bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden;
}

/* 图表控制面板 */
.chart-controls {
  @apply flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200;
}

.control-group {
  @apply flex items-center gap-2;
}

.view-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md;
  @apply text-gray-600 hover:text-gray-900 hover:bg-white;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors;
}

.view-button.active {
  @apply bg-blue-600 text-white shadow-sm;
}

.control-button {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors;
}

/* 图表容器 */
.chart-container {
  @apply relative;
  height: 400px;
}

.chart-container.fullscreen {
  @apply fixed inset-0 z-50 bg-white;
  height: 100vh;
}

.chart-container canvas {
  @apply w-full h-full;
}

/* 加载状态 */
.chart-loading {
  @apply absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2;
}

.chart-loading span {
  @apply text-sm text-gray-600;
}

/* 数据点详情面板 */
.data-point-panel {
  @apply absolute top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-10;
}

.panel-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.panel-header h4 {
  @apply font-semibold text-gray-900;
}

.close-button {
  @apply p-1 text-gray-400 hover:text-gray-600 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.panel-content {
  @apply p-4 space-y-3;
}

.data-item {
  @apply flex justify-between items-center;
}

.data-label {
  @apply text-sm text-gray-600;
}

.data-value {
  @apply text-sm font-semibold text-gray-900;
}

.data-value.positive {
  @apply text-green-600;
}

.data-value.negative {
  @apply text-red-600;
}

.panel-actions {
  @apply flex gap-2 p-4 border-t border-gray-200;
}

.highlight-button,
.compare-button {
  @apply flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.highlight-button {
  @apply bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500;
}

.compare-button {
  @apply bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500;
}

/* 图表信息面板 */
.chart-info {
  @apply flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200;
}

.info-stats {
  @apply flex items-center gap-6;
}

.stat-item {
  @apply flex items-center gap-2;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply text-sm font-semibold text-gray-900;
}

.info-actions {
  @apply flex items-center gap-2;
}

.settings-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

/* 模态框 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.modal-header h3 {
  @apply text-lg font-semibold text-gray-900;
}

.modal-close {
  @apply p-1 text-gray-400 hover:text-gray-600 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.modal-body {
  @apply p-6 space-y-6;
}

.settings-section {
  @apply space-y-4;
}

.settings-section h4 {
  @apply font-semibold text-gray-900 border-b border-gray-200 pb-2;
}

.setting-item {
  @apply flex items-center justify-between gap-4;
}

.setting-item label {
  @apply text-sm text-gray-700 flex items-center gap-2;
}

.setting-item select,
.setting-item input[type="range"] {
  @apply px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.setting-item input[type="checkbox"] {
  @apply rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

.modal-footer {
  @apply flex justify-end gap-3 p-6 border-t border-gray-200;
}

.reset-button {
  @apply px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-500;
}

.apply-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

/* 过渡动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  @apply transition-all duration-300;
}

.slide-up-enter-from {
  @apply opacity-0 transform translate-y-4;
}

.slide-up-leave-to {
  @apply opacity-0 transform translate-y-4;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  @apply transition-opacity duration-300;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  @apply opacity-0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-controls {
    @apply flex-col items-stretch gap-4;
  }

  .control-group {
    @apply flex-wrap justify-center;
  }

  .view-button {
    @apply flex-1 justify-center;
  }

  .data-point-panel {
    @apply left-4 right-4 w-auto;
  }

  .info-stats {
    @apply flex-col items-start gap-2;
  }

  .chart-info {
    @apply flex-col items-start gap-4;
  }

  .modal-content {
    @apply mx-2 max-h-[90vh];
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    @apply p-4;
  }

  .setting-item {
    @apply flex-col items-start gap-2;
  }

  .modal-footer {
    @apply flex-col;
  }

  .reset-button,
  .apply-button {
    @apply w-full justify-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .interactive-chart {
    @apply bg-gray-800 border-gray-700;
  }

  .chart-controls {
    @apply bg-gray-700 border-gray-600;
  }

  .view-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-600;
  }

  .view-button.active {
    @apply bg-blue-600 text-white;
  }

  .control-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-600;
  }

  .chart-container.fullscreen {
    @apply bg-gray-800;
  }

  .chart-loading {
    @apply bg-gray-800 bg-opacity-90;
  }

  .chart-loading span {
    @apply text-gray-300;
  }

  .data-point-panel {
    @apply bg-gray-800 border-gray-700;
  }

  .panel-header h4 {
    @apply text-gray-100;
  }

  .panel-header {
    @apply border-gray-600;
  }

  .close-button {
    @apply text-gray-400 hover:text-gray-200;
  }

  .data-label {
    @apply text-gray-400;
  }

  .data-value {
    @apply text-gray-100;
  }

  .panel-actions {
    @apply border-gray-600;
  }

  .chart-info {
    @apply bg-gray-700 border-gray-600;
  }

  .stat-label {
    @apply text-gray-400;
  }

  .stat-value {
    @apply text-gray-100;
  }

  .settings-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-600;
  }

  .modal-content {
    @apply bg-gray-800;
  }

  .modal-header {
    @apply border-gray-700;
  }

  .modal-header h3 {
    @apply text-gray-100;
  }

  .modal-close {
    @apply text-gray-400 hover:text-gray-200;
  }

  .settings-section h4 {
    @apply text-gray-100 border-gray-700;
  }

  .setting-item label {
    @apply text-gray-300;
  }

  .setting-item select,
  .setting-item input[type="range"] {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .modal-footer {
    @apply border-gray-700;
  }

  .reset-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-700;
  }
}
</style>
