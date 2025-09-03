<!--
  热力图组件
  用于显示二维数据的热力图可视化
-->

<template>
  <div class="heatmap-chart">
    <!-- 图表头部 -->
    <div class="chart-header">
      <div class="header-content">
        <h3 class="chart-title">{{ title }}</h3>
        <div class="chart-controls">
          <div class="color-scheme-selector">
            <label class="control-label">Farbschema:</label>
            <select v-model="selectedColorScheme" class="control-select">
              <option value="blues">Blau</option>
              <option value="greens">Grün</option>
              <option value="reds">Rot</option>
              <option value="oranges">Orange</option>
              <option value="purples">Violett</option>
              <option value="viridis">Viridis</option>
              <option value="plasma">Plasma</option>
            </select>
          </div>
          
          <div class="intensity-control">
            <label class="control-label">Intensität:</label>
            <input
              v-model="intensity"
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              class="intensity-slider"
            />
            <span class="intensity-value">{{ intensity }}x</span>
          </div>
          
          <button
            type="button"
            class="reset-btn"
            @click="resetView"
            title="Ansicht zurücksetzen"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- 图例 -->
      <div class="legend-container">
        <div class="legend-title">Werte</div>
        <div ref="legendElement" class="legend-gradient"></div>
        <div class="legend-labels">
          <span class="legend-min">{{ formatValue(minValue) }}</span>
          <span class="legend-max">{{ formatValue(maxValue) }}</span>
        </div>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container">
      <div ref="chartElement" class="chart-svg-container"></div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <span class="loading-text">Lade Heatmap...</span>
      </div>
      
      <!-- 空数据状态 -->
      <div v-if="!isLoading && (!data || data.length === 0)" class="empty-state">
        <div class="empty-icon">
          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="empty-title">Keine Daten verfügbar</h3>
        <p class="empty-description">Es sind keine Daten für die Heatmap-Darstellung vorhanden.</p>
      </div>
    </div>

    <!-- 工具提示 -->
    <div
      ref="tooltipElement"
      class="heatmap-tooltip"
      :class="{ visible: tooltip.visible }"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-content">
        <div class="tooltip-title">{{ tooltip.title }}</div>
        <div class="tooltip-value">{{ tooltip.value }}</div>
        <div v-if="tooltip.description" class="tooltip-description">
          {{ tooltip.description }}
        </div>
      </div>
    </div>

    <!-- 详细信息面板 -->
    <div v-if="showDetails" class="details-panel">
      <div class="details-header">
        <h4 class="details-title">Heatmap-Details</h4>
        <button
          type="button"
          class="close-details"
          @click="showDetails = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="details-content">
        <div class="detail-item">
          <span class="detail-label">Datenpunkte:</span>
          <span class="detail-value">{{ data?.length || 0 }}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Minimum:</span>
          <span class="detail-value">{{ formatValue(minValue) }}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Maximum:</span>
          <span class="detail-value">{{ formatValue(maxValue) }}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Durchschnitt:</span>
          <span class="detail-value">{{ formatValue(averageValue) }}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Standardabweichung:</span>
          <span class="detail-value">{{ formatValue(standardDeviation) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as d3 from 'd3'

// 热力图数据接口
interface HeatmapData {
  x: string | number
  y: string | number
  value: number
  label?: string
  category?: string
  metadata?: Record<string, any>
}

interface Props {
  data: HeatmapData[]
  title?: string
  width?: number
  height?: number
  theme?: 'light' | 'dark'
  interactive?: boolean
  showLegend?: boolean
  valueFormat?: 'number' | 'currency' | 'percentage'
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Heatmap',
  width: 800,
  height: 600,
  theme: 'light',
  interactive: true,
  showLegend: true,
  valueFormat: 'number'
})

const emit = defineEmits<{
  cellClick: [data: HeatmapData]
  cellHover: [data: HeatmapData | null]
  viewChange: [view: { zoom: number; pan: [number, number] }]
}>()

// 响应式数据
const selectedColorScheme = ref('blues')
const intensity = ref(1)
const isLoading = ref(false)
const showDetails = ref(false)
const currentZoom = ref(1)
const currentPan = ref<[number, number]>([0, 0])

// DOM引用
const chartElement = ref<HTMLElement>()
const legendElement = ref<HTMLElement>()
const tooltipElement = ref<HTMLElement>()

// 工具提示状态
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  value: '',
  description: ''
})

// SVG和比例尺
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
let g: d3.Selection<SVGGElement, unknown, null, undefined>
let xScale: d3.ScaleBand<string>
let yScale: d3.ScaleBand<string>
let colorScale: d3.ScaleSequential<string, never>
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>

// 计算属性
const minValue = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  return Math.min(...props.data.map(d => d.value))
})

const maxValue = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  return Math.max(...props.data.map(d => d.value))
})

const averageValue = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  return props.data.reduce((sum, d) => sum + d.value, 0) / props.data.length
})

const standardDeviation = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  const avg = averageValue.value
  const variance = props.data.reduce((sum, d) => sum + Math.pow(d.value - avg, 2), 0) / props.data.length
  return Math.sqrt(variance)
})

const uniqueXValues = computed(() => {
  if (!props.data) return []
  return Array.from(new Set(props.data.map(d => String(d.x)))).sort()
})

const uniqueYValues = computed(() => {
  if (!props.data) return []
  return Array.from(new Set(props.data.map(d => String(d.y)))).sort()
})

const colorInterpolator = computed(() => {
  const interpolators = {
    blues: d3.interpolateBlues,
    greens: d3.interpolateGreens,
    reds: d3.interpolateReds,
    oranges: d3.interpolateOranges,
    purples: d3.interpolatePurples,
    viridis: d3.interpolateViridis,
    plasma: d3.interpolatePlasma
  }
  return interpolators[selectedColorScheme.value as keyof typeof interpolators] || d3.interpolateBlues
})

// 方法
const initializeChart = () => {
  if (!chartElement.value || !props.data || props.data.length === 0) return

  const margin = { top: 20, right: 20, bottom: 60, left: 80 }
  const width = props.width - margin.left - margin.right
  const height = props.height - margin.top - margin.bottom

  // 清空现有内容
  d3.select(chartElement.value).selectAll('*').remove()

  // 创建SVG
  svg = d3.select(chartElement.value)
    .append('svg')
    .attr('width', props.width)
    .attr('height', props.height)

  g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 创建比例尺
  xScale = d3.scaleBand()
    .domain(uniqueXValues.value)
    .range([0, width])
    .padding(0.05)

  yScale = d3.scaleBand()
    .domain(uniqueYValues.value)
    .range([0, height])
    .padding(0.05)

  colorScale = d3.scaleSequential()
    .interpolator(colorInterpolator.value)
    .domain([minValue.value, maxValue.value * intensity.value])

  // 创建缩放行为
  if (props.interactive) {
    zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .on('zoom', handleZoom)

    svg.call(zoom)
  }

  // 绘制热力图
  drawHeatmap()

  // 添加坐标轴
  addAxes(width, height)

  // 创建图例
  if (props.showLegend) {
    createLegend()
  }
}

const drawHeatmap = () => {
  if (!g || !props.data) return

  // 绘制热力图单元格
  const cells = g.selectAll('.heatmap-cell')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('class', 'heatmap-cell')
    .attr('x', d => xScale(String(d.x))!)
    .attr('y', d => yScale(String(d.y))!)
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('fill', d => colorScale(d.value))
    .attr('stroke', props.theme === 'dark' ? '#374151' : '#E5E7EB')
    .attr('stroke-width', 0.5)
    .style('cursor', props.interactive ? 'pointer' : 'default')

  // 添加交互功能
  if (props.interactive) {
    cells
      .on('mouseover', handleCellHover)
      .on('mousemove', handleCellMove)
      .on('mouseout', handleCellOut)
      .on('click', handleCellClick)
  }

  // 添加动画
  cells
    .style('opacity', 0)
    .transition()
    .duration(750)
    .style('opacity', 1)
}

const addAxes = (width: number, height: number) => {
  if (!g) return

  // X轴
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)')
    .style('fill', props.theme === 'dark' ? '#F3F4F6' : '#374151')

  // Y轴
  g.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale))
    .selectAll('text')
    .style('fill', props.theme === 'dark' ? '#F3F4F6' : '#374151')

  // 轴线样式
  g.selectAll('.domain, .tick line')
    .style('stroke', props.theme === 'dark' ? '#6B7280' : '#D1D5DB')
}

const createLegend = () => {
  if (!legendElement.value) return

  const legendWidth = 200
  const legendHeight = 20

  // 清空现有图例
  d3.select(legendElement.value).selectAll('*').remove()

  const legendSvg = d3.select(legendElement.value)
    .append('svg')
    .attr('width', legendWidth)
    .attr('height', legendHeight)

  // 创建渐变定义
  const defs = legendSvg.append('defs')
  const gradient = defs.append('linearGradient')
    .attr('id', 'legend-gradient')
    .attr('x1', '0%')
    .attr('x2', '100%')
    .attr('y1', '0%')
    .attr('y2', '0%')

  // 添加渐变停止点
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    gradient.append('stop')
      .attr('offset', `${t * 100}%`)
      .attr('stop-color', colorInterpolator.value(t))
  }

  // 绘制渐变矩形
  legendSvg.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#legend-gradient)')
    .style('stroke', props.theme === 'dark' ? '#6B7280' : '#D1D5DB')
    .style('stroke-width', 1)
}

const handleCellHover = (event: MouseEvent, d: HeatmapData) => {
  // 高亮单元格
  d3.select(event.target as Element)
    .style('stroke-width', 2)
    .style('stroke', props.theme === 'dark' ? '#F3F4F6' : '#374151')

  // 显示工具提示
  showTooltip(event, d)
  
  emit('cellHover', d)
}

const handleCellMove = (event: MouseEvent, d: HeatmapData) => {
  updateTooltipPosition(event)
}

const handleCellOut = (event: MouseEvent) => {
  // 恢复单元格样式
  d3.select(event.target as Element)
    .style('stroke-width', 0.5)
    .style('stroke', props.theme === 'dark' ? '#374151' : '#E5E7EB')

  // 隐藏工具提示
  hideTooltip()
  
  emit('cellHover', null)
}

const handleCellClick = (event: MouseEvent, d: HeatmapData) => {
  emit('cellClick', d)
}

const handleZoom = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
  const { transform } = event
  
  g.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`)
  
  currentZoom.value = transform.k
  currentPan.value = [transform.x, transform.y]
  
  emit('viewChange', {
    zoom: transform.k,
    pan: [transform.x, transform.y]
  })
}

const showTooltip = (event: MouseEvent, d: HeatmapData) => {
  tooltip.value = {
    visible: true,
    x: event.pageX + 10,
    y: event.pageY - 10,
    title: d.label || `${d.x}, ${d.y}`,
    value: formatValue(d.value),
    description: d.category || ''
  }
}

const updateTooltipPosition = (event: MouseEvent) => {
  if (tooltip.value.visible) {
    tooltip.value.x = event.pageX + 10
    tooltip.value.y = event.pageY - 10
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const formatValue = (value: number): string => {
  switch (props.valueFormat) {
    case 'currency':
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
      }).format(value)
    case 'percentage':
      return new Intl.NumberFormat('de-DE', {
        style: 'percent',
        minimumFractionDigits: 2
      }).format(value / 100)
    default:
      return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
  }
}

const resetView = () => {
  if (svg && zoom) {
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity)
  }
}

const updateChart = () => {
  if (chartElement.value && props.data && props.data.length > 0) {
    initializeChart()
  }
}

// 监听器
watch(() => props.data, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

watch(() => selectedColorScheme.value, () => {
  if (colorScale) {
    colorScale.interpolator(colorInterpolator.value)
    g.selectAll('.heatmap-cell')
      .transition()
      .duration(500)
      .attr('fill', (d: any) => colorScale(d.value))
    
    if (props.showLegend) {
      createLegend()
    }
  }
})

watch(() => intensity.value, () => {
  if (colorScale) {
    colorScale.domain([minValue.value, maxValue.value * intensity.value])
    g.selectAll('.heatmap-cell')
      .transition()
      .duration(300)
      .attr('fill', (d: any) => colorScale(d.value))
  }
})

watch(() => props.theme, () => {
  updateChart()
})

// 生命周期
onMounted(() => {
  nextTick(() => {
    updateChart()
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateChart)
})
</script>

<style scoped>
.heatmap-chart {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.chart-header {
  @apply p-6 border-b border-gray-200 dark:border-gray-700;
}

.header-content {
  @apply flex items-center justify-between mb-4;
}

.chart-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.chart-controls {
  @apply flex items-center space-x-4;
}

.control-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.control-select {
  @apply px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.intensity-control {
  @apply flex items-center space-x-2;
}

.intensity-slider {
  @apply w-20;
}

.intensity-value {
  @apply text-sm text-gray-600 dark:text-gray-400 min-w-8;
}

.reset-btn {
  @apply p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors;
}

.legend-container {
  @apply flex items-center space-x-4;
}

.legend-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.legend-gradient {
  @apply flex-1 max-w-48;
}

.legend-labels {
  @apply flex justify-between text-xs text-gray-600 dark:text-gray-400;
}

.legend-min,
.legend-max {
  @apply min-w-16 text-center;
}

.chart-container {
  @apply relative p-6;
}

.chart-svg-container {
  @apply w-full overflow-hidden;
}

.loading-overlay {
  @apply absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3;
}

.loading-text {
  @apply text-gray-600 dark:text-gray-400;
}

.empty-state {
  @apply text-center py-12;
}

.empty-icon {
  @apply flex justify-center mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.empty-description {
  @apply text-gray-600 dark:text-gray-400;
}

.heatmap-tooltip {
  @apply absolute z-50 pointer-events-none opacity-0 transition-opacity duration-200;
}

.heatmap-tooltip.visible {
  @apply opacity-100;
}

.tooltip-content {
  @apply bg-gray-900 dark:bg-gray-700 text-white rounded-lg px-3 py-2 shadow-lg max-w-64;
}

.tooltip-title {
  @apply font-semibold text-sm;
}

.tooltip-value {
  @apply text-lg font-bold;
}

.tooltip-description {
  @apply text-xs text-gray-300 dark:text-gray-400 mt-1;
}

.details-panel {
  @apply absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-64;
}

.details-header {
  @apply flex items-center justify-between mb-3;
}

.details-title {
  @apply text-sm font-semibold text-gray-900 dark:text-white;
}

.close-details {
  @apply p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
         hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors;
}

.details-content {
  @apply space-y-2;
}

.detail-item {
  @apply flex justify-between items-center;
}

.detail-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.detail-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col space-y-4;
  }
  
  .chart-controls {
    @apply flex-col space-y-2 space-x-0 w-full;
  }
  
  .legend-container {
    @apply flex-col space-y-2 space-x-0;
  }
  
  .details-panel {
    @apply relative top-0 right-0 w-full;
  }
}
</style>
