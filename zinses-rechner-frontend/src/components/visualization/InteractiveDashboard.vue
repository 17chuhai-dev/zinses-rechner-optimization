<!--
  交互式仪表盘组件
  提供多种高级图表类型的集成展示和交互功能
-->

<template>
  <div class="interactive-dashboard">
    <!-- 仪表盘头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <h2 class="dashboard-title">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Interaktives Dashboard
        </h2>
        
        <div class="header-controls">
          <div class="view-selector">
            <button
              v-for="view in availableViews"
              :key="view.id"
              type="button"
              class="view-btn"
              :class="{ active: currentView === view.id }"
              @click="switchView(view.id)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="view.icon" />
              </svg>
              {{ view.label }}
            </button>
          </div>
          
          <div class="dashboard-actions">
            <button
              type="button"
              class="action-btn"
              @click="toggleFullscreen"
              :title="isFullscreen ? 'Vollbild verlassen' : 'Vollbild'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="!isFullscreen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0 0l5.5 5.5" />
              </svg>
            </button>
            
            <button
              type="button"
              class="action-btn"
              @click="exportDashboard"
              title="Dashboard exportieren"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            
            <button
              type="button"
              class="action-btn"
              @click="showSettings = true"
              title="Dashboard-Einstellungen"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 仪表盘内容 -->
    <div class="dashboard-content" :class="{ 'fullscreen': isFullscreen }">
      <!-- 概览视图 -->
      <div v-if="currentView === 'overview'" class="overview-layout">
        <div class="metrics-grid">
          <div
            v-for="metric in keyMetrics"
            :key="metric.id"
            class="metric-card"
            :class="metric.trend"
          >
            <div class="metric-header">
              <div class="metric-icon" :style="{ backgroundColor: metric.color + '20', color: metric.color }">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="metric.icon" />
                </svg>
              </div>
              <div class="metric-trend">
                <svg v-if="metric.trend === 'up'" class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <svg v-else-if="metric.trend === 'down'" class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
                <svg v-else class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </div>
            </div>
            
            <div class="metric-content">
              <div class="metric-value">{{ formatValue(metric.value, metric.format) }}</div>
              <div class="metric-label">{{ metric.label }}</div>
              <div class="metric-change" :class="metric.trend">
                {{ formatChange(metric.change, metric.format) }}
              </div>
            </div>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-container large">
            <div class="chart-header">
              <h3 class="chart-title">Kapitalentwicklung</h3>
              <div class="chart-controls">
                <select v-model="timeRange" class="time-selector">
                  <option value="1y">1 Jahr</option>
                  <option value="5y">5 Jahre</option>
                  <option value="10y">10 Jahre</option>
                  <option value="all">Gesamt</option>
                </select>
              </div>
            </div>
            <div ref="mainChart" class="chart-area"></div>
          </div>

          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Zusammensetzung</h3>
            </div>
            <div ref="compositionChart" class="chart-area"></div>
          </div>

          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Risiko-Rendite</h3>
            </div>
            <div ref="riskChart" class="chart-area"></div>
          </div>
        </div>
      </div>

      <!-- 详细分析视图 -->
      <div v-if="currentView === 'analysis'" class="analysis-layout">
        <div class="analysis-sidebar">
          <div class="analysis-controls">
            <h3 class="controls-title">Analyse-Parameter</h3>
            
            <div class="control-group">
              <label class="control-label">Diagrammtyp</label>
              <select v-model="selectedChartType" class="control-select">
                <option value="heatmap">Heatmap</option>
                <option value="sankey">Sankey-Diagramm</option>
                <option value="sunburst">Sunburst</option>
                <option value="treemap">Treemap</option>
                <option value="radar">Radar-Chart</option>
              </select>
            </div>
            
            <div class="control-group">
              <label class="control-label">Zeitraum</label>
              <div class="time-range-selector">
                <input
                  v-model="analysisTimeRange.start"
                  type="number"
                  min="1"
                  max="50"
                  class="time-input"
                  placeholder="Von"
                />
                <span class="time-separator">bis</span>
                <input
                  v-model="analysisTimeRange.end"
                  type="number"
                  min="1"
                  max="50"
                  class="time-input"
                  placeholder="Bis"
                />
                <span class="time-unit">Jahre</span>
              </div>
            </div>
            
            <div class="control-group">
              <label class="control-label">Metriken</label>
              <div class="metrics-checkboxes">
                <label
                  v-for="metric in availableMetrics"
                  :key="metric.id"
                  class="metric-checkbox"
                >
                  <input
                    v-model="selectedMetrics"
                    :value="metric.id"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-label">{{ metric.label }}</span>
                </label>
              </div>
            </div>
            
            <button
              type="button"
              class="update-btn"
              @click="updateAnalysis"
              :disabled="isUpdating"
            >
              <svg v-if="isUpdating" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyse aktualisieren
            </button>
          </div>
        </div>

        <div class="analysis-main">
          <div class="analysis-chart-container">
            <div class="chart-header">
              <h3 class="chart-title">{{ getChartTitle(selectedChartType) }}</h3>
              <div class="chart-info">
                <button
                  type="button"
                  class="info-btn"
                  @click="showChartInfo = !showChartInfo"
                  title="Diagramm-Information"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div v-if="showChartInfo" class="chart-info-panel">
              <p class="chart-description">{{ getChartDescription(selectedChartType) }}</p>
            </div>
            
            <div ref="analysisChart" class="chart-area large"></div>
          </div>
        </div>
      </div>

      <!-- 比较视图 -->
      <div v-if="currentView === 'comparison'" class="comparison-layout">
        <div class="comparison-header">
          <h3 class="comparison-title">Szenario-Vergleich</h3>
          <button
            type="button"
            class="add-scenario-btn"
            @click="addScenario"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Szenario hinzufügen
          </button>
        </div>

        <div class="scenarios-grid">
          <div
            v-for="(scenario, index) in scenarios"
            :key="scenario.id"
            class="scenario-card"
            :class="{ active: scenario.id === activeScenario }"
          >
            <div class="scenario-header">
              <input
                v-model="scenario.name"
                class="scenario-name"
                placeholder="Szenario-Name"
              />
              <div class="scenario-actions">
                <button
                  type="button"
                  class="scenario-action"
                  @click="duplicateScenario(scenario)"
                  title="Duplizieren"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  v-if="scenarios.length > 1"
                  type="button"
                  class="scenario-action danger"
                  @click="removeScenario(scenario.id)"
                  title="Löschen"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="scenario-metrics">
              <div class="scenario-metric">
                <span class="metric-label">Endkapital</span>
                <span class="metric-value">{{ formatCurrency(scenario.finalAmount) }}</span>
              </div>
              <div class="scenario-metric">
                <span class="metric-label">Gesamtrendite</span>
                <span class="metric-value">{{ formatPercentage(scenario.totalReturn) }}</span>
              </div>
              <div class="scenario-metric">
                <span class="metric-label">Jährliche Rendite</span>
                <span class="metric-value">{{ formatPercentage(scenario.annualReturn) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="comparison-chart-container">
          <div ref="comparisonChart" class="chart-area"></div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <DashboardSettingsDialog
      v-if="showSettings"
      :settings="dashboardSettings"
      @close="showSettings = false"
      @save="saveDashboardSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { advancedVisualizationService } from '@/services/AdvancedVisualizationService'
import type { ChartType, ChartConfig } from '@/services/AdvancedVisualizationService'
import type { CalculationResult } from '@/types/calculator'
import DashboardSettingsDialog from './DashboardSettingsDialog.vue'

interface Props {
  calculationResult: CalculationResult
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light'
})

// 响应式数据
const currentView = ref('overview')
const isFullscreen = ref(false)
const showSettings = ref(false)
const showChartInfo = ref(false)
const timeRange = ref('all')
const selectedChartType = ref<ChartType>('heatmap')
const isUpdating = ref(false)
const activeScenario = ref('scenario-1')

// 分析参数
const analysisTimeRange = reactive({
  start: 1,
  end: 10
})

const selectedMetrics = ref(['finalAmount', 'totalInterest', 'totalReturn'])

// 场景比较
const scenarios = ref([
  {
    id: 'scenario-1',
    name: 'Basis-Szenario',
    finalAmount: props.calculationResult.finalAmount,
    totalReturn: 0.05,
    annualReturn: 0.05
  }
])

// DOM引用
const mainChart = ref<HTMLElement>()
const compositionChart = ref<HTMLElement>()
const riskChart = ref<HTMLElement>()
const analysisChart = ref<HTMLElement>()
const comparisonChart = ref<HTMLElement>()

// 配置数据
const availableViews = [
  {
    id: 'overview',
    label: 'Übersicht',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
  },
  {
    id: 'analysis',
    label: 'Analyse',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  },
  {
    id: 'comparison',
    label: 'Vergleich',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  }
]

const availableMetrics = [
  { id: 'finalAmount', label: 'Endkapital' },
  { id: 'totalInterest', label: 'Gesamtzinsen' },
  { id: 'totalReturn', label: 'Gesamtrendite' },
  { id: 'annualReturn', label: 'Jährliche Rendite' },
  { id: 'volatility', label: 'Volatilität' },
  { id: 'sharpeRatio', label: 'Sharpe-Ratio' }
]

const dashboardSettings = reactive({
  theme: props.theme,
  animations: true,
  autoRefresh: false,
  refreshInterval: 30,
  defaultView: 'overview'
})

// 计算属性
const keyMetrics = computed(() => [
  {
    id: 'finalAmount',
    label: 'Endkapital',
    value: props.calculationResult.finalAmount,
    format: 'currency',
    change: 0.05,
    trend: 'up',
    color: '#10B981',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
  },
  {
    id: 'totalInterest',
    label: 'Gesamtzinsen',
    value: props.calculationResult.totalInterest || 0,
    format: 'currency',
    change: 0.03,
    trend: 'up',
    color: '#3B82F6',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
  },
  {
    id: 'totalReturn',
    label: 'Gesamtrendite',
    value: ((props.calculationResult.finalAmount / (props.calculationResult.initialAmount || 1)) - 1),
    format: 'percentage',
    change: 0.02,
    trend: 'up',
    color: '#F59E0B',
    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'
  },
  {
    id: 'duration',
    label: 'Laufzeit',
    value: props.calculationResult.duration || 0,
    format: 'years',
    change: 0,
    trend: 'neutral',
    color: '#8B5CF6',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
  }
])

// 方法
const switchView = (viewId: string) => {
  currentView.value = viewId
  nextTick(() => {
    updateCharts()
  })
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    updateCharts()
  })
}

const exportDashboard = () => {
  // 导出仪表盘功能
  console.log('导出仪表盘')
}

const updateAnalysis = async () => {
  isUpdating.value = true
  
  try {
    await nextTick()
    
    if (analysisChart.value) {
      const chartData = advancedVisualizationService.generateChartDataFromCalculation(
        props.calculationResult,
        selectedChartType.value
      )
      
      const config: Partial<ChartConfig> = {
        theme: props.theme,
        width: analysisChart.value.clientWidth,
        height: analysisChart.value.clientHeight
      }
      
      switch (selectedChartType.value) {
        case 'heatmap':
          advancedVisualizationService.createHeatmap(
            analysisChart.value,
            chartData as any,
            config
          )
          break
        case 'sankey':
          advancedVisualizationService.createSankey(
            analysisChart.value,
            chartData as any,
            config
          )
          break
        case 'sunburst':
          advancedVisualizationService.createSunburst(
            analysisChart.value,
            chartData as any,
            config
          )
          break
      }
    }
  } catch (error) {
    console.error('分析更新失败:', error)
  } finally {
    isUpdating.value = false
  }
}

const updateCharts = () => {
  if (currentView.value === 'overview') {
    updateOverviewCharts()
  } else if (currentView.value === 'analysis') {
    updateAnalysis()
  } else if (currentView.value === 'comparison') {
    updateComparisonChart()
  }
}

const updateOverviewCharts = () => {
  // 更新概览图表
  if (mainChart.value && props.calculationResult.yearlyBreakdown) {
    // 这里可以使用现有的图表组件或D3创建主图表
  }
}

const updateComparisonChart = () => {
  // 更新比较图表
  if (comparisonChart.value) {
    // 创建场景比较图表
  }
}

const addScenario = () => {
  const newScenario = {
    id: `scenario-${scenarios.value.length + 1}`,
    name: `Szenario ${scenarios.value.length + 1}`,
    finalAmount: props.calculationResult.finalAmount * (1 + Math.random() * 0.2 - 0.1),
    totalReturn: 0.05 + Math.random() * 0.04 - 0.02,
    annualReturn: 0.05 + Math.random() * 0.04 - 0.02
  }
  scenarios.value.push(newScenario)
}

const duplicateScenario = (scenario: any) => {
  const duplicated = {
    ...scenario,
    id: `scenario-${Date.now()}`,
    name: `${scenario.name} (Kopie)`
  }
  scenarios.value.push(duplicated)
}

const removeScenario = (scenarioId: string) => {
  scenarios.value = scenarios.value.filter(s => s.id !== scenarioId)
  if (activeScenario.value === scenarioId) {
    activeScenario.value = scenarios.value[0]?.id || ''
  }
}

const saveDashboardSettings = (settings: any) => {
  Object.assign(dashboardSettings, settings)
  showSettings.value = false
}

const getChartTitle = (chartType: ChartType): string => {
  const titles = {
    heatmap: 'Heatmap-Analyse',
    sankey: 'Kapitalfluss-Diagramm',
    sunburst: 'Hierarchische Aufschlüsselung',
    treemap: 'Treemap-Visualisierung',
    radar: 'Radar-Chart'
  }
  return titles[chartType] || 'Erweiterte Analyse'
}

const getChartDescription = (chartType: ChartType): string => {
  const descriptions = {
    heatmap: 'Zeigt die Intensität von Werten über verschiedene Dimensionen hinweg.',
    sankey: 'Visualisiert den Fluss von Kapital zwischen verschiedenen Kategorien.',
    sunburst: 'Stellt hierarchische Daten in konzentrischen Kreisen dar.',
    treemap: 'Zeigt hierarchische Daten als verschachtelte Rechtecke.',
    radar: 'Vergleicht mehrere Metriken in einem radialen Format.'
  }
  return descriptions[chartType] || 'Erweiterte Datenvisualisierung.'
}

const formatValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
      }).format(value)
    case 'percentage':
      return new Intl.NumberFormat('de-DE', {
        style: 'percent',
        minimumFractionDigits: 2
      }).format(value)
    case 'years':
      return `${value} Jahre`
    default:
      return value.toLocaleString('de-DE')
  }
}

const formatChange = (change: number, format: string): string => {
  const prefix = change >= 0 ? '+' : ''
  return prefix + formatValue(change, format)
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 2
  }).format(value)
}

// 监听器
watch(() => selectedChartType.value, () => {
  if (currentView.value === 'analysis') {
    updateAnalysis()
  }
})

watch(() => props.calculationResult, () => {
  updateCharts()
}, { deep: true })

// 生命周期
onMounted(() => {
  nextTick(() => {
    updateCharts()
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCharts)
})
</script>

<style scoped>
.interactive-dashboard {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.dashboard-header {
  @apply p-6 border-b border-gray-200 dark:border-gray-700;
}

.header-content {
  @apply flex items-center justify-between;
}

.dashboard-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white flex items-center;
}

.header-controls {
  @apply flex items-center space-x-4;
}

.view-selector {
  @apply flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1;
}

.view-btn {
  @apply px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center
         text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white;
}

.view-btn.active {
  @apply bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm;
}

.dashboard-actions {
  @apply flex items-center space-x-2;
}

.action-btn {
  @apply p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors;
}

.dashboard-content {
  @apply p-6;
}

.dashboard-content.fullscreen {
  @apply fixed inset-0 z-50 bg-white dark:bg-gray-800 overflow-auto;
}

.overview-layout {
  @apply space-y-6;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.metric-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-xl p-6;
}

.metric-header {
  @apply flex items-center justify-between mb-4;
}

.metric-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center;
}

.metric-content {
  @apply space-y-2;
}

.metric-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.metric-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.metric-change {
  @apply text-sm font-medium;
}

.metric-change.up {
  @apply text-green-600 dark:text-green-400;
}

.metric-change.down {
  @apply text-red-600 dark:text-red-400;
}

.metric-change.neutral {
  @apply text-gray-600 dark:text-gray-400;
}

.charts-grid {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.chart-container {
  @apply bg-gray-50 dark:bg-gray-700 rounded-xl p-6;
}

.chart-container.large {
  @apply lg:col-span-2;
}

.chart-header {
  @apply flex items-center justify-between mb-4;
}

.chart-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.chart-controls {
  @apply flex items-center space-x-2;
}

.time-selector {
  @apply px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.chart-area {
  @apply min-h-64;
}

.chart-area.large {
  @apply min-h-96;
}

.analysis-layout {
  @apply grid grid-cols-1 lg:grid-cols-4 gap-6;
}

.analysis-sidebar {
  @apply lg:col-span-1;
}

.analysis-controls {
  @apply bg-gray-50 dark:bg-gray-700 rounded-xl p-6 space-y-6;
}

.controls-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.control-group {
  @apply space-y-2;
}

.control-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.control-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.time-range-selector {
  @apply flex items-center space-x-2;
}

.time-input {
  @apply w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.time-separator,
.time-unit {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.metrics-checkboxes {
  @apply space-y-2;
}

.metric-checkbox {
  @apply flex items-center space-x-2;
}

.checkbox-input {
  @apply rounded border-gray-300 dark:border-gray-600 text-blue-600 
         focus:ring-blue-500 dark:focus:ring-blue-600;
}

.checkbox-label {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.update-btn {
  @apply w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
         disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center;
}

.analysis-main {
  @apply lg:col-span-3;
}

.analysis-chart-container {
  @apply bg-gray-50 dark:bg-gray-700 rounded-xl p-6;
}

.chart-info-panel {
  @apply mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg;
}

.chart-description {
  @apply text-sm text-blue-800 dark:text-blue-200;
}

.info-btn {
  @apply p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
         hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors;
}

.comparison-layout {
  @apply space-y-6;
}

.comparison-header {
  @apply flex items-center justify-between;
}

.comparison-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.add-scenario-btn {
  @apply px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700
         transition-colors flex items-center;
}

.scenarios-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.scenario-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border-2 border-transparent
         hover:border-blue-200 dark:hover:border-blue-800 transition-colors;
}

.scenario-card.active {
  @apply border-blue-500 dark:border-blue-400;
}

.scenario-header {
  @apply flex items-center justify-between mb-4;
}

.scenario-name {
  @apply flex-1 px-2 py-1 text-sm font-medium bg-transparent border-none
         text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-600
         rounded;
}

.scenario-actions {
  @apply flex items-center space-x-1;
}

.scenario-action {
  @apply p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
         hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors;
}

.scenario-action.danger {
  @apply text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300;
}

.scenario-metrics {
  @apply space-y-2;
}

.scenario-metric {
  @apply flex justify-between items-center;
}

.scenario-metric .metric-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.scenario-metric .metric-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.comparison-chart-container {
  @apply bg-gray-50 dark:bg-gray-700 rounded-xl p-6;
}

/* 移动端优化 */
@media (max-width: 1024px) {
  .header-content {
    @apply flex-col space-y-4;
  }
  
  .header-controls {
    @apply w-full justify-between;
  }
  
  .analysis-layout {
    @apply grid-cols-1;
  }
  
  .analysis-sidebar {
    @apply order-2;
  }
  
  .analysis-main {
    @apply order-1;
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    @apply grid-cols-1;
  }
  
  .charts-grid {
    @apply grid-cols-1;
  }
  
  .scenarios-grid {
    @apply grid-cols-1;
  }
  
  .view-selector {
    @apply flex-col space-y-1 p-2;
  }
  
  .view-btn {
    @apply w-full justify-center;
  }
}
</style>
