<!--
  多图表类型支持组件
  为不同计算器实现对应的图表类型支持，包括线图、柱状图、饼图和复合图表
-->

<template>
  <div class="multi-chart-support" :class="{ 'chart-loading': isLoading }">
    <!-- 图表类型选择器 -->
    <div v-if="showTypeSelector" class="chart-type-selector">
      <div class="selector-header">
        <h4>{{ $t('chart.selectType') }}</h4>
        <button 
          v-if="showFullscreen"
          @click="toggleFullscreen"
          class="fullscreen-button"
          :class="{ active: isFullscreen }"
        >
          <Icon :name="isFullscreen ? 'minimize' : 'maximize'" size="16" />
        </button>
      </div>
      
      <div class="type-options">
        <button
          v-for="type in availableChartTypes"
          :key="type.value"
          @click="changeChartType(type.value)"
          :class="['type-button', { active: currentChartType === type.value }]"
          :disabled="isLoading"
        >
          <Icon :name="type.icon" size="20" />
          <span>{{ type.label }}</span>
        </button>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container" :class="[`chart-${currentChartType}`, { fullscreen: isFullscreen }]">
      <canvas
        ref="chartCanvas"
        :id="chartId"
        :width="chartWidth"
        :height="chartHeight"
      ></canvas>
      
      <!-- 加载覆盖层 -->
      <div v-if="isLoading" class="chart-loading-overlay">
        <div class="loading-spinner">
          <Icon name="loading" size="32" class="animate-spin" />
        </div>
        <p>{{ $t('chart.loading') }}</p>
      </div>
      
      <!-- 无数据状态 -->
      <div v-if="!isLoading && !hasData" class="chart-no-data">
        <Icon name="chart-bar" size="48" class="no-data-icon" />
        <h4>{{ $t('chart.noData') }}</h4>
        <p>{{ $t('chart.noDataDescription') }}</p>
      </div>
    </div>

    <!-- 图表控制面板 -->
    <div v-if="showControls" class="chart-controls">
      <div class="control-group">
        <label class="control-label">{{ $t('chart.timeRange') }}:</label>
        <select v-model="timeRange" @change="updateTimeRange" class="control-select">
          <option value="1">1 {{ $t('chart.year') }}</option>
          <option value="5">5 {{ $t('chart.years') }}</option>
          <option value="10">10 {{ $t('chart.years') }}</option>
          <option value="20">20 {{ $t('chart.years') }}</option>
          <option value="all">{{ $t('chart.allYears') }}</option>
        </select>
      </div>
      
      <div class="control-group">
        <label class="control-label">{{ $t('chart.dataPoints') }}:</label>
        <select v-model="dataGranularity" @change="updateDataGranularity" class="control-select">
          <option value="monthly">{{ $t('chart.monthly') }}</option>
          <option value="quarterly">{{ $t('chart.quarterly') }}</option>
          <option value="yearly">{{ $t('chart.yearly') }}</option>
        </select>
      </div>
      
      <div class="control-group">
        <button @click="exportChart" class="control-button">
          <Icon name="download" size="16" />
          {{ $t('chart.export') }}
        </button>
      </div>
    </div>

    <!-- 图表信息面板 -->
    <div v-if="showInfo && chartInfo" class="chart-info">
      <div class="info-item">
        <span class="info-label">{{ $t('chart.dataPoints') }}:</span>
        <span class="info-value">{{ chartInfo.dataPointCount }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">{{ $t('chart.lastUpdate') }}:</span>
        <span class="info-value">{{ formatTimestamp(chartInfo.lastUpdate) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">{{ $t('chart.renderTime') }}:</span>
        <span class="info-value">{{ chartInfo.renderTime }}ms</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js'
import { chartUpdateEngine } from '@/core/ChartUpdateEngine'
import { chartAnimationSystem } from '@/core/ChartAnimationSystem'
import Icon from '@/components/ui/Icon.vue'

// 注册Chart.js组件
Chart.register(...registerables)

// 图表类型定义
interface ChartTypeOption {
  value: ChartType
  label: string
  icon: string
  supportedCalculators: string[]
}

// 图表信息
interface ChartInfo {
  dataPointCount: number
  lastUpdate: Date
  renderTime: number
}

// Props定义
interface Props {
  calculatorId: string
  data: any
  chartId?: string
  initialChartType?: ChartType
  showTypeSelector?: boolean
  showControls?: boolean
  showInfo?: boolean
  showFullscreen?: boolean
  width?: number
  height?: number
  responsive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  chartId: () => `chart-${Date.now()}`,
  initialChartType: 'line',
  showTypeSelector: true,
  showControls: true,
  showInfo: false,
  showFullscreen: true,
  width: 800,
  height: 400,
  responsive: true
})

// Emits定义
interface Emits {
  chartTypeChange: [type: ChartType]
  dataUpdate: [data: any]
  fullscreenToggle: [isFullscreen: boolean]
  export: [format: string]
}

const emit = defineEmits<Emits>()

// 响应式数据
const chartCanvas = ref<HTMLCanvasElement>()
const chart = ref<Chart>()
const currentChartType = ref<ChartType>(props.initialChartType)
const isLoading = ref(false)
const isFullscreen = ref(false)
const timeRange = ref('10')
const dataGranularity = ref('yearly')
const chartInfo = ref<ChartInfo>()

// 可用图表类型
const chartTypes: ChartTypeOption[] = [
  {
    value: 'line',
    label: 'Liniendiagramm',
    icon: 'chart-line',
    supportedCalculators: ['compound-interest', 'savings-plan', 'retirement', 'etf-savings-plan']
  },
  {
    value: 'bar',
    label: 'Balkendiagramm',
    icon: 'chart-bar',
    supportedCalculators: ['loan', 'mortgage', 'tax-optimization']
  },
  {
    value: 'pie',
    label: 'Kreisdiagramm',
    icon: 'chart-pie',
    supportedCalculators: ['portfolio', 'tax-optimization']
  },
  {
    value: 'doughnut',
    label: 'Ringdiagramm',
    icon: 'chart-doughnut',
    supportedCalculators: ['portfolio', 'compound-interest']
  },
  {
    value: 'radar',
    label: 'Netzdiagramm',
    icon: 'chart-radar',
    supportedCalculators: ['portfolio']
  }
]

// 计算属性
const availableChartTypes = computed(() => {
  return chartTypes.filter(type => 
    type.supportedCalculators.includes(props.calculatorId)
  )
})

const hasData = computed(() => {
  return props.data && Object.keys(props.data).length > 0
})

const chartWidth = computed(() => {
  return isFullscreen.value ? window.innerWidth - 40 : props.width
})

const chartHeight = computed(() => {
  return isFullscreen.value ? window.innerHeight - 200 : props.height
})

// 方法
const initializeChart = async () => {
  if (!chartCanvas.value || !hasData.value) return

  isLoading.value = true

  try {
    // 销毁现有图表
    if (chart.value) {
      chart.value.destroy()
    }

    // 创建图表配置
    const config = createChartConfig()
    
    // 创建新图表
    chart.value = new Chart(chartCanvas.value, config)
    
    // 注册到更新引擎
    chartUpdateEngine.registerChart(props.chartId, chart.value)
    
    // 更新图表信息
    updateChartInfo()
    
    console.log(`📊 图表已初始化: ${props.chartId} (${currentChartType.value})`)
    
  } catch (error) {
    console.error('❌ 图表初始化失败:', error)
  } finally {
    isLoading.value = false
  }
}

const createChartConfig = (): ChartConfiguration => {
  const baseConfig: ChartConfiguration = {
    type: currentChartType.value,
    data: transformDataForChart(props.data),
    options: {
      responsive: props.responsive,
      maintainAspectRatio: false,
      animation: chartAnimationSystem.configureChartAnimation(props.chartId, 'data-update'),
      plugins: {
        title: {
          display: true,
          text: getChartTitle()
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: createScalesConfig(),
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6
        },
        line: {
          tension: 0.4
        }
      }
    }
  }

  return baseConfig
}

const transformDataForChart = (data: any) => {
  // 根据计算器类型和图表类型转换数据
  switch (props.calculatorId) {
    case 'compound-interest':
      return transformCompoundInterestData(data)
    case 'savings-plan':
      return transformSavingsPlanData(data)
    case 'loan':
      return transformLoanData(data)
    case 'mortgage':
      return transformMortgageData(data)
    case 'retirement':
      return transformRetirementData(data)
    case 'portfolio':
      return transformPortfolioData(data)
    case 'tax-optimization':
      return transformTaxOptimizationData(data)
    case 'etf-savings-plan':
      return transformETFSavingsPlanData(data)
    default:
      return { labels: [], datasets: [] }
  }
}

const transformCompoundInterestData = (data: any) => {
  const years = Array.from({ length: parseInt(timeRange.value) || 10 }, (_, i) => i + 1)
  
  return {
    labels: years.map(year => `Jahr ${year}`),
    datasets: [
      {
        label: 'Kapitalwachstum',
        data: years.map(year => calculateCompoundGrowth(data, year)),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true
      },
      {
        label: 'Zinserträge',
        data: years.map(year => calculateInterestEarnings(data, year)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true
      }
    ]
  }
}

const transformSavingsPlanData = (data: any) => {
  // 储蓄计划数据转换逻辑
  return {
    labels: ['Einzahlungen', 'Zinserträge', 'Endkapital'],
    datasets: [{
      data: [data.totalContributions, data.totalInterest, data.finalAmount],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
    }]
  }
}

const transformLoanData = (data: any) => {
  // 贷款数据转换逻辑
  return {
    labels: ['Tilgung', 'Zinsen', 'Restschuld'],
    datasets: [{
      data: [data.principalPayment, data.interestPayment, data.remainingBalance],
      backgroundColor: ['#10b981', '#ef4444', '#6b7280']
    }]
  }
}

const transformMortgageData = (data: any) => {
  // 抵押贷款数据转换逻辑
  return transformLoanData(data)
}

const transformRetirementData = (data: any) => {
  // 退休规划数据转换逻辑
  return transformCompoundInterestData(data)
}

const transformPortfolioData = (data: any) => {
  // 投资组合数据转换逻辑
  return {
    labels: Object.keys(data.allocation || {}),
    datasets: [{
      data: Object.values(data.allocation || {}),
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
      ]
    }]
  }
}

const transformTaxOptimizationData = (data: any) => {
  // 税务优化数据转换逻辑
  return {
    labels: ['Vor Optimierung', 'Nach Optimierung', 'Ersparnis'],
    datasets: [{
      data: [data.beforeOptimization, data.afterOptimization, data.savings],
      backgroundColor: ['#ef4444', '#10b981', '#f59e0b']
    }]
  }
}

const transformETFSavingsPlanData = (data: any) => {
  // ETF储蓄计划数据转换逻辑
  return transformCompoundInterestData(data)
}

const calculateCompoundGrowth = (data: any, year: number): number => {
  const { principal, monthlyPayment = 0, annualRate } = data
  const monthlyRate = annualRate / 100 / 12
  const totalMonths = year * 12
  
  const principalGrowth = principal * Math.pow(1 + monthlyRate, totalMonths)
  const monthlyGrowth = monthlyPayment > 0 
    ? monthlyPayment * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
    : 0
  
  return Math.round(principalGrowth + monthlyGrowth)
}

const calculateInterestEarnings = (data: any, year: number): number => {
  const totalAmount = calculateCompoundGrowth(data, year)
  const totalContributions = data.principal + (data.monthlyPayment || 0) * year * 12
  return Math.round(totalAmount - totalContributions)
}

const createScalesConfig = () => {
  if (currentChartType.value === 'pie' || currentChartType.value === 'doughnut') {
    return {}
  }
  
  return {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Zeit'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Betrag (€)'
      },
      ticks: {
        callback: function(value: any) {
          return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
          }).format(value)
        }
      }
    }
  }
}

const getChartTitle = (): string => {
  const titles: Record<string, string> = {
    'compound-interest': 'Zinseszins-Entwicklung',
    'savings-plan': 'Sparplan-Übersicht',
    'loan': 'Kreditverlauf',
    'mortgage': 'Hypothekenverlauf',
    'retirement': 'Altersvorsorge-Entwicklung',
    'portfolio': 'Portfolio-Verteilung',
    'tax-optimization': 'Steueroptimierung',
    'etf-savings-plan': 'ETF-Sparplan-Entwicklung'
  }
  
  return titles[props.calculatorId] || 'Finanzdiagramm'
}

const changeChartType = async (newType: ChartType) => {
  if (newType === currentChartType.value || isLoading.value) return
  
  const oldType = currentChartType.value
  currentChartType.value = newType
  
  // 使用动画系统进行类型切换
  if (chart.value) {
    await chartAnimationSystem.animateChartTypeChange(props.chartId, newType)
  } else {
    await initializeChart()
  }
  
  emit('chartTypeChange', newType)
  console.log(`🔄 图表类型已切换: ${oldType} → ${newType}`)
}

const updateTimeRange = () => {
  if (chart.value) {
    const newData = transformDataForChart(props.data)
    chartUpdateEngine.replaceChartData(props.chartId, newData)
  }
}

const updateDataGranularity = () => {
  updateTimeRange() // 重用时间范围更新逻辑
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('fullscreenToggle', isFullscreen.value)
  
  // 延迟调整图表大小
  nextTick(() => {
    if (chart.value) {
      chart.value.resize()
    }
  })
}

const exportChart = () => {
  if (chart.value) {
    const url = chart.value.toBase64Image()
    const link = document.createElement('a')
    link.download = `${props.calculatorId}-chart.png`
    link.href = url
    link.click()
    
    emit('export', 'png')
  }
}

const updateChartInfo = () => {
  if (chart.value) {
    const dataPointCount = chart.value.data.datasets.reduce((total, dataset) => {
      return total + (Array.isArray(dataset.data) ? dataset.data.length : 0)
    }, 0)
    
    chartInfo.value = {
      dataPointCount,
      lastUpdate: new Date(),
      renderTime: 0 // 这里应该从实际渲染时间获取
    }
  }
}

const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

// 监听器
watch(() => props.data, () => {
  if (chart.value && hasData.value) {
    const newData = transformDataForChart(props.data)
    chartUpdateEngine.replaceChartData(props.chartId, newData)
    updateChartInfo()
  }
}, { deep: true })

watch(currentChartType, () => {
  if (hasData.value) {
    initializeChart()
  }
})

// 生命周期
onMounted(() => {
  if (hasData.value) {
    nextTick(() => {
      initializeChart()
    })
  }
})

onUnmounted(() => {
  if (chart.value) {
    chartUpdateEngine.unregisterChart(props.chartId)
    chart.value.destroy()
  }
})
</script>

<style scoped>
.multi-chart-support {
  @apply bg-white rounded-lg border border-gray-200 p-4;
  position: relative;
}

.chart-loading {
  @apply opacity-75 pointer-events-none;
}

.chart-type-selector {
  @apply mb-4 pb-4 border-b border-gray-200;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @apply mb-3;
}

.selector-header h4 {
  @apply text-lg font-semibold text-gray-900;
  margin: 0;
}

.fullscreen-button {
  @apply p-2 text-gray-500 hover:text-gray-700 rounded-md;
  @apply hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500;
  border: none;
  background: none;
  cursor: pointer;
}

.fullscreen-button.active {
  @apply text-blue-600 bg-blue-50;
}

.type-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border;
  @apply border-gray-300 text-gray-700 bg-white;
  @apply hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  transition: all 0.2s ease;
}

.type-button.active {
  @apply bg-blue-600 text-white border-blue-600;
}

.chart-container {
  position: relative;
  @apply mb-4;
}

.chart-container.fullscreen {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  @apply bg-white rounded-lg shadow-2xl p-4;
}

.chart-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  @apply bg-white bg-opacity-90 flex flex-col items-center justify-center;
  z-index: 10;
}

.loading-spinner {
  @apply mb-2;
}

.chart-no-data {
  @apply flex flex-col items-center justify-center py-12 text-gray-500;
}

.no-data-icon {
  @apply mb-4 text-gray-400;
}

.chart-no-data h4 {
  @apply text-lg font-medium mb-2;
  margin: 0;
}

.chart-no-data p {
  @apply text-sm;
  margin: 0;
}

.chart-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  @apply mb-4 pb-4 border-b border-gray-200;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-label {
  @apply text-sm font-medium text-gray-700;
}

.control-select {
  @apply px-3 py-1 text-sm border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.control-button {
  @apply flex items-center gap-2 px-3 py-1 text-sm font-medium;
  @apply bg-gray-100 text-gray-700 border border-gray-300 rounded-md;
  @apply hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.chart-info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  @apply text-sm text-gray-600;
}

.info-item {
  display: flex;
  gap: 0.25rem;
}

.info-label {
  font-weight: 500;
}

.info-value {
  @apply text-gray-900;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .type-options {
    flex-direction: column;
  }
  
  .type-button {
    justify-content: center;
  }
  
  .chart-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .control-group {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
