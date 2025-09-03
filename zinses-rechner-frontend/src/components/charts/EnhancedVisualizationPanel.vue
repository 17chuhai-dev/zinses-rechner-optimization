<!--
  增强可视化面板组件
  提供热力图、桑基图、3D图表等高级可视化功能
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ t('charts.enhancedVisualization') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('charts.enhancedVisualizationDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <div class="stats-display flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{{ t('charts.totalCharts') }}: {{ stats.totalCharts }}</span>
            <span v-if="stats.averageRenderTime > 0">
              {{ t('charts.avgRenderTime') }}: {{ formatRenderTime(stats.averageRenderTime) }}
            </span>
          </div>
          
          <button
            @click="showChartGallery = !showChartGallery"
            class="gallery-button"
          >
            <PhotoIcon class="w-4 h-4 mr-2" />
            {{ t('charts.gallery') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 图表类型选择 -->
    <div class="chart-types mb-8">
      <div class="types-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <button
          v-for="type in chartTypes"
          :key="type.id"
          @click="selectedType = type.id"
          :class="getTypeButtonClasses(type.id)"
        >
          <component :is="type.icon" class="w-8 h-8 mb-2" />
          <div class="type-info">
            <div class="type-name">{{ type.name }}</div>
            <div class="type-description">{{ type.description }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- 数据输入区域 -->
    <div class="data-input-section mb-8">
      <div class="section-header mb-4">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('charts.dataInput') }}
        </h4>
      </div>

      <!-- 热力图数据输入 -->
      <div v-if="selectedType === 'heatmap'" class="heatmap-input">
        <HeatmapDataInput
          v-model="heatmapData"
          @data-changed="handleDataChange"
        />
      </div>

      <!-- 桑基图数据输入 -->
      <div v-if="selectedType === 'sankey'" class="sankey-input">
        <SankeyDataInput
          v-model="sankeyData"
          @data-changed="handleDataChange"
        />
      </div>

      <!-- 3D散点图数据输入 -->
      <div v-if="selectedType === '3d-scatter'" class="scatter3d-input">
        <Scatter3DDataInput
          v-model="scatter3DData"
          @data-changed="handleDataChange"
        />
      </div>

      <!-- 瀑布图数据输入 -->
      <div v-if="selectedType === 'waterfall'" class="waterfall-input">
        <WaterfallDataInput
          v-model="waterfallData"
          @data-changed="handleDataChange"
        />
      </div>

      <!-- 树状图数据输入 -->
      <div v-if="selectedType === 'treemap'" class="treemap-input">
        <TreemapDataInput
          v-model="treemapData"
          @data-changed="handleDataChange"
        />
      </div>
    </div>

    <!-- 图表配置 -->
    <div class="chart-config mb-8">
      <div class="config-header flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('charts.configuration') }}
        </h4>
        
        <button
          @click="showAdvancedConfig = !showAdvancedConfig"
          class="toggle-config-button"
        >
          <CogIcon class="w-4 h-4 mr-2" />
          {{ showAdvancedConfig ? t('charts.hideAdvanced') : t('charts.showAdvanced') }}
        </button>
      </div>

      <div class="config-content">
        <!-- 基础配置 -->
        <div class="basic-config grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="config-field">
            <label class="config-label">{{ t('charts.width') }}</label>
            <input
              v-model.number="chartConfig.width"
              type="number"
              min="300"
              max="2000"
              step="50"
              class="config-input"
            />
          </div>
          
          <div class="config-field">
            <label class="config-label">{{ t('charts.height') }}</label>
            <input
              v-model.number="chartConfig.height"
              type="number"
              min="200"
              max="1500"
              step="50"
              class="config-input"
            />
          </div>
          
          <div class="config-field">
            <label class="config-label">{{ t('charts.animationDuration') }}</label>
            <input
              v-model.number="chartConfig.animation.duration"
              type="number"
              min="0"
              max="3000"
              step="100"
              class="config-input"
            />
          </div>
          
          <div class="config-field">
            <label class="config-label">{{ t('charts.colorScheme') }}</label>
            <select v-model="selectedColorScheme" class="config-select">
              <option v-for="scheme in colorSchemes" :key="scheme.id" :value="scheme.id">
                {{ scheme.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 高级配置 -->
        <div v-if="showAdvancedConfig" class="advanced-config">
          <div class="config-sections space-y-6">
            <!-- 交互配置 -->
            <div class="interaction-config">
              <h5 class="config-section-title">{{ t('charts.interaction') }}</h5>
              <div class="config-options grid grid-cols-2 md:grid-cols-4 gap-4">
                <label class="config-option">
                  <input
                    v-model="chartConfig.interaction.hover"
                    type="checkbox"
                    class="config-checkbox"
                  />
                  <span class="option-text">{{ t('charts.enableHover') }}</span>
                </label>
                
                <label class="config-option">
                  <input
                    v-model="chartConfig.interaction.click"
                    type="checkbox"
                    class="config-checkbox"
                  />
                  <span class="option-text">{{ t('charts.enableClick') }}</span>
                </label>
                
                <label class="config-option">
                  <input
                    v-model="chartConfig.interaction.zoom"
                    type="checkbox"
                    class="config-checkbox"
                  />
                  <span class="option-text">{{ t('charts.enableZoom') }}</span>
                </label>
                
                <label class="config-option">
                  <input
                    v-model="chartConfig.interaction.brush"
                    type="checkbox"
                    class="config-checkbox"
                  />
                  <span class="option-text">{{ t('charts.enableBrush') }}</span>
                </label>
              </div>
            </div>

            <!-- 工具提示配置 -->
            <div class="tooltip-config">
              <h5 class="config-section-title">{{ t('charts.tooltip') }}</h5>
              <div class="config-options">
                <label class="config-option">
                  <input
                    v-model="chartConfig.tooltip.enabled"
                    type="checkbox"
                    class="config-checkbox"
                  />
                  <span class="option-text">{{ t('charts.enableTooltip') }}</span>
                </label>
              </div>
            </div>

            <!-- 图例配置 -->
            <div class="legend-config">
              <h5 class="config-section-title">{{ t('charts.legend') }}</h5>
              <div class="config-options grid grid-cols-2 gap-4">
                <label class="config-option">
                  <input
                    v-model="chartConfig.legend.enabled"
                    type="checkbox"
                    class="config-checkbox"
                  />
                  <span class="option-text">{{ t('charts.showLegend') }}</span>
                </label>
                
                <div class="config-field">
                  <label class="config-label">{{ t('charts.legendPosition') }}</label>
                  <select v-model="chartConfig.legend.position" class="config-select">
                    <option value="top">{{ t('charts.top') }}</option>
                    <option value="right">{{ t('charts.right') }}</option>
                    <option value="bottom">{{ t('charts.bottom') }}</option>
                    <option value="left">{{ t('charts.left') }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 生成按钮 -->
    <div class="generate-section mb-8">
      <button
        @click="generateChart"
        :disabled="!canGenerate || isRendering"
        class="generate-button"
      >
        <ChartBarIcon v-if="!isRendering" class="w-5 h-5 mr-2" />
        <ArrowPathIcon v-else class="w-5 h-5 mr-2 animate-spin" />
        {{ isRendering ? t('charts.rendering') : t('charts.generateChart') }}
      </button>
      
      <div v-if="validationError" class="error-message mt-2">
        <ExclamationTriangleIcon class="w-4 h-4 mr-2" />
        {{ validationError }}
      </div>
    </div>

    <!-- 图表显示区域 -->
    <div v-if="currentChart" class="chart-display">
      <div class="chart-header flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ getCurrentChartTitle() }}
        </h4>
        
        <div class="chart-actions flex items-center space-x-2">
          <button
            @click="exportChart('png')"
            class="export-button"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
            PNG
          </button>
          
          <button
            @click="exportChart('svg')"
            class="export-button"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
            SVG
          </button>
          
          <button
            @click="fullscreenChart"
            class="fullscreen-button"
          >
            <ArrowsPointingOutIcon class="w-4 h-4" />
          </button>
          
          <button
            @click="destroyCurrentChart"
            class="destroy-button"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div
        ref="chartContainer"
        class="chart-container"
        :style="{ width: `${chartConfig.width}px`, height: `${chartConfig.height}px` }"
      ></div>
    </div>

    <!-- 图表画廊 -->
    <div v-if="showChartGallery" class="chart-gallery">
      <div class="gallery-overlay" @click="showChartGallery = false"></div>
      <div class="gallery-content">
        <div class="gallery-header">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('charts.chartGallery') }}
          </h4>
          <button
            @click="showChartGallery = false"
            class="close-gallery-button"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        
        <div class="gallery-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <div
            v-for="example in chartExamples"
            :key="example.id"
            class="gallery-item"
            @click="loadExample(example)"
          >
            <div class="example-preview">
              <img :src="example.preview" :alt="example.name" class="preview-image" />
            </div>
            <div class="example-info">
              <div class="example-name">{{ example.name }}</div>
              <div class="example-description">{{ example.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick } from 'vue'
import {
  PhotoIcon,
  CogIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ArrowsPointingOutIcon,
  TrashIcon,
  XMarkIcon,
  MapIcon,
  CubeIcon,
  ChartPieIcon,
  Bars3BottomLeftIcon,
  PuzzlePieceIcon
} from '@heroicons/vue/24/outline'
import HeatmapDataInput from './HeatmapDataInput.vue'
import SankeyDataInput from './SankeyDataInput.vue'
import Scatter3DDataInput from './Scatter3DDataInput.vue'
import WaterfallDataInput from './WaterfallDataInput.vue'
import TreemapDataInput from './TreemapDataInput.vue'
import { useEnhancedVisualization } from '@/services/EnhancedVisualizationManager'
import { useI18n } from '@/services/I18nService'
import type { 
  EnhancedChartType, 
  EnhancedChartConfig, 
  ChartInstance,
  HeatmapData,
  SankeyData,
  Chart3DData,
  WaterfallData,
  TreemapData
} from '@/services/EnhancedVisualizationManager'

// Props
interface Props {
  defaultType?: EnhancedChartType
  showTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultType: 'heatmap',
  showTitle: true
})

// 使用服务
const {
  stats,
  isRendering,
  createHeatmap,
  createSankeyDiagram,
  create3DScatterPlot,
  createWaterfallChart,
  destroyChart
} = useEnhancedVisualization()

const { t } = useI18n()

// 模板引用
const chartContainer = ref<HTMLElement>()

// 响应式状态
const selectedType = ref<EnhancedChartType>(props.defaultType)
const showAdvancedConfig = ref(false)
const showChartGallery = ref(false)
const selectedColorScheme = ref('default')
const currentChart = ref<ChartInstance | null>(null)
const validationError = ref<string | null>(null)

// 数据状态
const heatmapData = ref<HeatmapData[]>([])
const sankeyData = ref<SankeyData>({ nodes: [], links: [] })
const scatter3DData = ref<Chart3DData[]>([])
const waterfallData = ref<WaterfallData[]>([])
const treemapData = ref<TreemapData>({ name: 'root', children: [] })

// 图表配置
const chartConfig = reactive<EnhancedChartConfig>({
  width: 800,
  height: 600,
  margin: { top: 20, right: 20, bottom: 40, left: 60 },
  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  animation: {
    duration: 750,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  interaction: {
    hover: true,
    click: true,
    zoom: false,
    brush: false
  },
  tooltip: {
    enabled: true
  },
  legend: {
    enabled: true,
    position: 'right'
  }
})

// 图表类型配置
const chartTypes = [
  {
    id: 'heatmap' as EnhancedChartType,
    name: t('charts.heatmap'),
    description: t('charts.heatmapDescription'),
    icon: MapIcon
  },
  {
    id: 'sankey' as EnhancedChartType,
    name: t('charts.sankeyDiagram'),
    description: t('charts.sankeyDescription'),
    icon: Bars3BottomLeftIcon
  },
  {
    id: '3d-scatter' as EnhancedChartType,
    name: t('charts.scatter3D'),
    description: t('charts.scatter3DDescription'),
    icon: CubeIcon
  },
  {
    id: 'waterfall' as EnhancedChartType,
    name: t('charts.waterfallChart'),
    description: t('charts.waterfallDescription'),
    icon: ChartBarIcon
  },
  {
    id: 'treemap' as EnhancedChartType,
    name: t('charts.treemap'),
    description: t('charts.treemapDescription'),
    icon: PuzzlePieceIcon
  }
]

// 颜色方案
const colorSchemes = [
  { id: 'default', name: t('charts.defaultColors') },
  { id: 'blues', name: t('charts.bluesScheme') },
  { id: 'greens', name: t('charts.greensScheme') },
  { id: 'warm', name: t('charts.warmScheme') },
  { id: 'cool', name: t('charts.coolScheme') }
]

// 示例图表
const chartExamples = [
  {
    id: 'heatmap-correlation',
    name: t('charts.correlationMatrix'),
    description: t('charts.correlationMatrixDesc'),
    type: 'heatmap',
    preview: '/images/examples/heatmap-correlation.png',
    data: generateCorrelationData()
  },
  {
    id: 'sankey-energy',
    name: t('charts.energyFlow'),
    description: t('charts.energyFlowDesc'),
    type: 'sankey',
    preview: '/images/examples/sankey-energy.png',
    data: generateEnergyFlowData()
  },
  {
    id: '3d-portfolio',
    name: t('charts.portfolioAnalysis3D'),
    description: t('charts.portfolioAnalysis3DDesc'),
    type: '3d-scatter',
    preview: '/images/examples/3d-portfolio.png',
    data: generatePortfolio3DData()
  }
]

// 计算属性
const containerClasses = computed(() => [
  'enhanced-visualization-panel',
  'bg-white',
  'dark:bg-gray-900',
  'rounded-lg',
  'p-6',
  'max-w-7xl',
  'mx-auto'
])

const ariaLabel = computed(() => {
  return `${t('charts.enhancedVisualization')}: ${getCurrentChartTitle()}`
})

const canGenerate = computed(() => {
  switch (selectedType.value) {
    case 'heatmap':
      return heatmapData.value.length > 0
    case 'sankey':
      return sankeyData.value.nodes.length > 0 && sankeyData.value.links.length > 0
    case '3d-scatter':
      return scatter3DData.value.length > 0
    case 'waterfall':
      return waterfallData.value.length > 0
    case 'treemap':
      return treemapData.value.children && treemapData.value.children.length > 0
    default:
      return false
  }
})

// 方法
const getTypeButtonClasses = (typeId: EnhancedChartType): string[] => {
  const classes = [
    'type-button',
    'flex',
    'flex-col',
    'items-center',
    'p-4',
    'rounded-lg',
    'border',
    'transition-all',
    'duration-200',
    'hover:shadow-md',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500'
  ]
  
  if (selectedType.value === typeId) {
    classes.push(
      'border-blue-500',
      'bg-blue-50',
      'dark:bg-blue-900/20',
      'text-blue-700',
      'dark:text-blue-300'
    )
  } else {
    classes.push(
      'border-gray-200',
      'dark:border-gray-700',
      'bg-white',
      'dark:bg-gray-800',
      'text-gray-700',
      'dark:text-gray-300',
      'hover:border-gray-300',
      'dark:hover:border-gray-600'
    )
  }
  
  return classes
}

const getCurrentChartTitle = (): string => {
  const type = chartTypes.find(t => t.id === selectedType.value)
  return type ? type.name : selectedType.value
}

const formatRenderTime = (ms: number): string => {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
}

const handleDataChange = (): void => {
  validationError.value = null
}

const generateChart = async (): Promise<void> => {
  if (!canGenerate.value || !chartContainer.value) return

  // 销毁现有图表
  if (currentChart.value) {
    destroyChart(currentChart.value.id)
    currentChart.value = null
  }

  await nextTick()

  try {
    // 更新颜色方案
    updateColorScheme()

    switch (selectedType.value) {
      case 'heatmap':
        currentChart.value = createHeatmap(chartContainer.value, heatmapData.value, chartConfig)
        break
      case 'sankey':
        currentChart.value = createSankeyDiagram(chartContainer.value, sankeyData.value, chartConfig)
        break
      case '3d-scatter':
        currentChart.value = create3DScatterPlot(chartContainer.value, scatter3DData.value, chartConfig)
        break
      case 'waterfall':
        currentChart.value = createWaterfallChart(chartContainer.value, waterfallData.value, chartConfig)
        break
    }
  } catch (error) {
    validationError.value = error instanceof Error ? error.message : String(error)
  }
}

const updateColorScheme = (): void => {
  const schemes = {
    default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    blues: ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa'],
    greens: ['#14532d', '#166534', '#15803d', '#16a34a', '#22c55e'],
    warm: ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#eab308'],
    cool: ['#0c4a6e', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8']
  }
  
  chartConfig.colors = schemes[selectedColorScheme.value as keyof typeof schemes] || schemes.default
}

const exportChart = async (format: 'png' | 'svg'): Promise<void> => {
  if (!currentChart.value) return

  try {
    const blob = await currentChart.value.export(format)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chart-${selectedType.value}-${Date.now()}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const fullscreenChart = (): void => {
  if (!chartContainer.value) return

  if (chartContainer.value.requestFullscreen) {
    chartContainer.value.requestFullscreen()
  }
}

const destroyCurrentChart = (): void => {
  if (currentChart.value) {
    destroyChart(currentChart.value.id)
    currentChart.value = null
  }
}

const loadExample = (example: any): void => {
  selectedType.value = example.type
  
  switch (example.type) {
    case 'heatmap':
      heatmapData.value = example.data
      break
    case 'sankey':
      sankeyData.value = example.data
      break
    case '3d-scatter':
      scatter3DData.value = example.data
      break
  }
  
  showChartGallery.value = false
  
  nextTick(() => {
    generateChart()
  })
}

// 示例数据生成函数
function generateCorrelationData(): HeatmapData[] {
  const assets = ['Aktien', 'Anleihen', 'Rohstoffe', 'Immobilien', 'Cash']
  const data: HeatmapData[] = []
  
  for (let i = 0; i < assets.length; i++) {
    for (let j = 0; j < assets.length; j++) {
      data.push({
        x: assets[i],
        y: assets[j],
        value: i === j ? 1 : Math.random() * 0.8 - 0.4,
        tooltip: `${assets[i]} vs ${assets[j]}`
      })
    }
  }
  
  return data
}

function generateEnergyFlowData(): SankeyData {
  return {
    nodes: [
      { id: 'coal', name: 'Kohle' },
      { id: 'gas', name: 'Gas' },
      { id: 'oil', name: 'Öl' },
      { id: 'renewable', name: 'Erneuerbare' },
      { id: 'electricity', name: 'Strom' },
      { id: 'heat', name: 'Wärme' },
      { id: 'transport', name: 'Transport' }
    ],
    links: [
      { source: 'coal', target: 'electricity', value: 30 },
      { source: 'gas', target: 'electricity', value: 25 },
      { source: 'gas', target: 'heat', value: 20 },
      { source: 'oil', target: 'transport', value: 35 },
      { source: 'renewable', target: 'electricity', value: 40 }
    ]
  }
}

function generatePortfolio3DData(): Chart3DData[] {
  const data: Chart3DData[] = []
  
  for (let i = 0; i < 50; i++) {
    data.push({
      x: Math.random() * 20 - 10, // 收益率
      y: Math.random() * 15,      // 风险
      z: Math.random() * 100,     // 市值
      value: Math.random() * 100,
      label: `Asset ${i + 1}`
    })
  }
  
  return data
}
</script>

<style scoped>
.enhanced-visualization-panel {
  @apply min-h-screen;
}

.type-button {
  @apply min-h-[120px] text-center;
}

.type-name {
  @apply font-semibold text-sm mb-1;
}

.type-description {
  @apply text-xs opacity-75;
}

.config-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.config-input,
.config-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.config-section-title {
  @apply text-sm font-medium text-gray-900 dark:text-white mb-3;
}

.config-option {
  @apply flex items-center space-x-2 cursor-pointer;
}

.config-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.option-text {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.generate-button {
  @apply flex items-center px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200;
}

.error-message {
  @apply flex items-center text-red-600 dark:text-red-400 text-sm;
}

.chart-container {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
}

.gallery-button,
.toggle-config-button,
.export-button,
.fullscreen-button,
.destroy-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.gallery-button,
.toggle-config-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.export-button {
  @apply text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500;
}

.fullscreen-button {
  @apply text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:ring-purple-500;
}

.destroy-button {
  @apply text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500;
}

.chart-gallery {
  @apply fixed inset-0 z-50 flex items-center justify-center;
}

.gallery-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50;
}

.gallery-content {
  @apply relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-y-auto;
}

.gallery-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.close-gallery-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md;
}

.gallery-item {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200;
}

.preview-image {
  @apply w-full h-32 object-cover rounded-md mb-3;
}

.example-name {
  @apply font-medium text-gray-900 dark:text-white mb-1;
}

.example-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .types-grid {
    @apply grid-cols-1;
  }
  
  .basic-config {
    @apply grid-cols-1;
  }
  
  .config-options {
    @apply grid-cols-1;
  }
  
  .gallery-grid {
    @apply grid-cols-1;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .type-button {
  @apply border-2;
}

/* 动画 */
.chart-container {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
