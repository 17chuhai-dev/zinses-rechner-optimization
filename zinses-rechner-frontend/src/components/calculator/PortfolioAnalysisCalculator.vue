<!--
  投资组合分析计算器组件
  提供投资组合风险收益分析和优化建议
-->

<template>
  <div class="portfolio-analysis-calculator">
    <!-- 计算器标题 -->
    <div class="calculator-header mb-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ t('calculator.portfolioAnalysis') }}
      </h4>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {{ t('calculator.portfolioAnalysisDescription') }}
      </p>
    </div>

    <!-- 输入区域 -->
    <div class="input-section mb-8">
      <div class="section-header flex items-center justify-between mb-4">
        <h5 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('calculator.portfolioAssets') }}
        </h5>
        
        <div class="header-actions flex items-center space-x-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ t('calculator.totalAllocation') }}: {{ totalAllocation.toFixed(1) }}%
          </span>
          
          <button
            @click="addAsset"
            class="add-asset-button"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            {{ t('calculator.addAsset') }}
          </button>
        </div>
      </div>

      <!-- 资产列表 -->
      <div class="assets-list space-y-4">
        <div
          v-for="(asset, index) in assets"
          :key="asset.id"
          class="asset-item"
        >
          <div class="asset-header flex items-center justify-between">
            <div class="asset-info flex items-center space-x-3">
              <div class="asset-color" :style="{ backgroundColor: getAssetColor(index) }"></div>
              <span class="asset-number">{{ t('calculator.asset') }} {{ index + 1 }}</span>
            </div>
            
            <button
              v-if="assets.length > 1"
              @click="removeAsset(index)"
              class="remove-asset-button"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
          
          <div class="asset-fields grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
            <div class="field-group">
              <label class="field-label">{{ t('calculator.assetName') }}</label>
              <input
                v-model="asset.name"
                type="text"
                class="field-input"
                :placeholder="t('calculator.assetNamePlaceholder')"
              />
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('calculator.allocation') }} (%)</label>
              <input
                v-model.number="asset.allocation"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="field-input"
                @input="validateAllocation"
              />
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('calculator.expectedReturn') }} (%)</label>
              <input
                v-model.number="asset.expectedReturn"
                type="number"
                min="-50"
                max="50"
                step="0.1"
                class="field-input"
              />
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('calculator.riskLevel') }} (%)</label>
              <input
                v-model.number="asset.risk"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="field-input"
              />
            </div>
          </div>
          
          <!-- 高级选项 -->
          <div v-if="showAdvancedOptions" class="advanced-options mt-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="field-group">
                <label class="field-label">{{ t('calculator.symbol') }}</label>
                <input
                  v-model="asset.symbol"
                  type="text"
                  class="field-input"
                  :placeholder="t('calculator.symbolPlaceholder')"
                />
              </div>
              
              <div class="field-group">
                <label class="field-label">{{ t('calculator.correlation') }}</label>
                <input
                  v-model.number="asset.correlation"
                  type="number"
                  min="-1"
                  max="1"
                  step="0.01"
                  class="field-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 投资组合总价值 -->
      <div class="portfolio-value mt-6">
        <div class="field-group max-w-xs">
          <label class="field-label">{{ t('calculator.totalPortfolioValue') }}</label>
          <div class="input-with-currency">
            <input
              v-model.number="totalValue"
              type="number"
              min="0"
              step="1000"
              class="field-input pr-12"
            />
            <span class="currency-symbol">€</span>
          </div>
        </div>
      </div>

      <!-- 高级选项切换 -->
      <div class="advanced-toggle mt-4">
        <label class="toggle-label">
          <input
            v-model="showAdvancedOptions"
            type="checkbox"
            class="toggle-checkbox"
          />
          <span class="toggle-text">{{ t('calculator.showAdvancedOptions') }}</span>
        </label>
      </div>
    </div>

    <!-- 计算按钮 -->
    <div class="calculate-section mb-8">
      <button
        @click="calculatePortfolio"
        :disabled="!canCalculate || isCalculating"
        class="calculate-button"
      >
        <CalculatorIcon v-if="!isCalculating" class="w-5 h-5 mr-2" />
        <ArrowPathIcon v-else class="w-5 h-5 mr-2 animate-spin" />
        {{ isCalculating ? t('calculator.calculating') : t('calculator.analyzePortfolio') }}
      </button>
      
      <div v-if="allocationError" class="error-message mt-2">
        <ExclamationTriangleIcon class="w-4 h-4 mr-2" />
        {{ allocationError }}
      </div>
    </div>

    <!-- 结果区域 -->
    <div v-if="analysisResult" class="results-section">
      <div class="results-header mb-6">
        <h5 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('calculator.analysisResults') }}
        </h5>
      </div>

      <!-- 关键指标 -->
      <div class="key-metrics mb-8">
        <div class="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="metric-card">
            <div class="metric-header">
              <TrendingUpIcon class="w-5 h-5 text-green-500" />
              <span class="metric-title">{{ t('calculator.expectedReturn') }}</span>
            </div>
            <div class="metric-value text-green-600 dark:text-green-400">
              {{ formatPercentage(analysisResult.expectedReturn) }}
            </div>
            <div class="metric-subtitle">{{ t('calculator.annualizedReturn') }}</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-header">
              <ExclamationTriangleIcon class="w-5 h-5 text-orange-500" />
              <span class="metric-title">{{ t('calculator.portfolioRisk') }}</span>
            </div>
            <div class="metric-value text-orange-600 dark:text-orange-400">
              {{ formatPercentage(analysisResult.totalRisk) }}
            </div>
            <div class="metric-subtitle">{{ t('calculator.volatility') }}</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-header">
              <ChartBarIcon class="w-5 h-5 text-blue-500" />
              <span class="metric-title">{{ t('calculator.sharpeRatio') }}</span>
            </div>
            <div class="metric-value" :class="getSharpeRatioClasses()">
              {{ analysisResult.sharpeRatio.toFixed(2) }}
            </div>
            <div class="metric-subtitle">{{ getSharpeRatioDescription() }}</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-header">
              <PuzzlePieceIcon class="w-5 h-5 text-purple-500" />
              <span class="metric-title">{{ t('calculator.diversification') }}</span>
            </div>
            <div class="metric-value text-purple-600 dark:text-purple-400">
              {{ analysisResult.diversificationBenefit.toFixed(1) }}
            </div>
            <div class="metric-subtitle">{{ t('calculator.diversificationBenefit') }}</div>
          </div>
        </div>
      </div>

      <!-- 资产配置图表 -->
      <div class="allocation-chart mb-8">
        <h6 class="text-md font-medium text-gray-900 dark:text-white mb-4">
          {{ t('calculator.assetAllocation') }}
        </h6>
        
        <div class="chart-container">
          <canvas ref="allocationChartCanvas" class="allocation-canvas"></canvas>
        </div>
        
        <div class="chart-legend mt-4">
          <div class="legend-items grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <div
              v-for="(asset, index) in analysisResult.assets"
              :key="index"
              class="legend-item"
            >
              <div class="legend-color" :style="{ backgroundColor: getAssetColor(index) }"></div>
              <span class="legend-text">{{ asset.name }} ({{ formatPercentage(asset.allocation) }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 风险收益散点图 -->
      <div class="risk-return-chart mb-8">
        <h6 class="text-md font-medium text-gray-900 dark:text-white mb-4">
          {{ t('calculator.riskReturnProfile') }}
        </h6>
        
        <div class="chart-container">
          <canvas ref="riskReturnChartCanvas" class="risk-return-canvas"></canvas>
        </div>
      </div>

      <!-- 优化建议 -->
      <div class="optimization-suggestions">
        <h6 class="text-md font-medium text-gray-900 dark:text-white mb-4">
          {{ t('calculator.optimizationSuggestions') }}
        </h6>
        
        <div class="suggestions-list space-y-3">
          <div
            v-for="suggestion in getOptimizationSuggestions()"
            :key="suggestion.id"
            class="suggestion-item"
          >
            <div class="suggestion-header">
              <component :is="suggestion.icon" :class="suggestion.iconClasses" />
              <span class="suggestion-title">{{ suggestion.title }}</span>
            </div>
            <p class="suggestion-description">{{ suggestion.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import {
  PlusIcon,
  TrashIcon,
  CalculatorIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  ChartBarIcon,
  PuzzlePieceIcon
} from '@heroicons/vue/24/outline'
import { Chart, registerables } from 'chart.js'
import { useAdvancedCalculator } from '@/services/AdvancedCalculatorManager'
import { useI18n } from '@/services/I18nService'
import type { PortfolioAnalysis } from '@/services/AdvancedCalculatorManager'

// 注册Chart.js组件
Chart.register(...registerables)

// Emits
interface Emits {
  'calculation-complete': [result: PortfolioAnalysis]
  'calculation-error': [error: string]
}

const emit = defineEmits<Emits>()

// 使用服务
const { analyzePortfolio, isCalculating } = useAdvancedCalculator()
const { t } = useI18n()

// 模板引用
const allocationChartCanvas = ref<HTMLCanvasElement>()
const riskReturnChartCanvas = ref<HTMLCanvasElement>()

// 响应式状态
const showAdvancedOptions = ref(false)
const totalValue = ref(100000)
const analysisResult = ref<PortfolioAnalysis | null>(null)
const allocationError = ref<string | null>(null)

// 资产数据
const assets = ref([
  {
    id: 'asset-1',
    name: 'Deutsche Aktien',
    symbol: 'DAX',
    allocation: 40,
    expectedReturn: 8,
    risk: 15,
    correlation: 0.7
  },
  {
    id: 'asset-2',
    name: 'Internationale Aktien',
    symbol: 'MSCI World',
    allocation: 30,
    expectedReturn: 9,
    risk: 18,
    correlation: 0.8
  },
  {
    id: 'asset-3',
    name: 'Anleihen',
    symbol: 'Bonds',
    allocation: 20,
    expectedReturn: 3,
    risk: 5,
    correlation: -0.2
  },
  {
    id: 'asset-4',
    name: 'Rohstoffe',
    symbol: 'Commodities',
    allocation: 10,
    expectedReturn: 5,
    risk: 20,
    correlation: 0.3
  }
])

// 图表实例
let allocationChart: Chart | null = null
let riskReturnChart: Chart | null = null

// 计算属性
const totalAllocation = computed(() => {
  return assets.value.reduce((sum, asset) => sum + (asset.allocation || 0), 0)
})

const canCalculate = computed(() => {
  return assets.value.length > 0 && 
         Math.abs(totalAllocation.value - 100) < 0.01 &&
         totalValue.value > 0 &&
         assets.value.every(asset => 
           asset.name && 
           asset.allocation > 0 && 
           asset.expectedReturn !== undefined && 
           asset.risk > 0
         )
})

// 方法
const addAsset = (): void => {
  const newAsset = {
    id: `asset-${Date.now()}`,
    name: `Asset ${assets.value.length + 1}`,
    symbol: '',
    allocation: 0,
    expectedReturn: 5,
    risk: 10,
    correlation: 0.5
  }
  
  assets.value.push(newAsset)
}

const removeAsset = (index: number): void => {
  assets.value.splice(index, 1)
  validateAllocation()
}

const validateAllocation = (): void => {
  const total = totalAllocation.value
  
  if (Math.abs(total - 100) > 0.01) {
    allocationError.value = t('calculator.allocationMustEqual100', { current: total.toFixed(1) })
  } else {
    allocationError.value = null
  }
}

const calculatePortfolio = async (): Promise<void> => {
  if (!canCalculate.value) return
  
  try {
    const result = analyzePortfolio(assets.value, totalValue.value)
    analysisResult.value = result
    
    await nextTick()
    createCharts()
    
    emit('calculation-complete', result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    emit('calculation-error', errorMessage)
  }
}

const createCharts = (): void => {
  if (!analysisResult.value) return
  
  createAllocationChart()
  createRiskReturnChart()
}

const createAllocationChart = (): void => {
  if (!allocationChartCanvas.value || !analysisResult.value) return
  
  // 销毁现有图表
  if (allocationChart) {
    allocationChart.destroy()
  }
  
  const ctx = allocationChartCanvas.value.getContext('2d')
  if (!ctx) return
  
  allocationChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: analysisResult.value.assets.map(asset => asset.name),
      datasets: [{
        data: analysisResult.value.assets.map(asset => asset.allocation),
        backgroundColor: analysisResult.value.assets.map((_, index) => getAssetColor(index)),
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
              const label = context.label || ''
              const value = context.parsed
              return `${label}: ${value.toFixed(1)}%`
            }
          }
        }
      }
    }
  })
}

const createRiskReturnChart = (): void => {
  if (!riskReturnChartCanvas.value || !analysisResult.value) return
  
  // 销毁现有图表
  if (riskReturnChart) {
    riskReturnChart.destroy()
  }
  
  const ctx = riskReturnChartCanvas.value.getContext('2d')
  if (!ctx) return
  
  const data = analysisResult.value.assets.map((asset, index) => ({
    x: asset.risk,
    y: asset.expectedReturn,
    label: asset.name,
    color: getAssetColor(index)
  }))
  
  // 添加投资组合点
  data.push({
    x: analysisResult.value.totalRisk,
    y: analysisResult.value.expectedReturn,
    label: 'Portfolio',
    color: '#ef4444'
  })
  
  riskReturnChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Assets',
        data: data.slice(0, -1),
        backgroundColor: data.slice(0, -1).map(d => d.color),
        borderColor: data.slice(0, -1).map(d => d.color),
        pointRadius: 8
      }, {
        label: 'Portfolio',
        data: [data[data.length - 1]],
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        pointRadius: 12,
        pointStyle: 'star'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Risiko (%)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Erwartete Rendite (%)'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const point = data[context.dataIndex]
              return `${point.label}: Risiko ${point.x}%, Rendite ${point.y}%`
            }
          }
        }
      }
    }
  })
}

const getAssetColor = (index: number): string => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316'  // orange
  ]
  return colors[index % colors.length]
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const getSharpeRatioClasses = (): string[] => {
  const ratio = analysisResult.value?.sharpeRatio || 0
  const classes = ['text-lg', 'font-bold']
  
  if (ratio > 1) {
    classes.push('text-green-600', 'dark:text-green-400')
  } else if (ratio > 0.5) {
    classes.push('text-yellow-600', 'dark:text-yellow-400')
  } else {
    classes.push('text-red-600', 'dark:text-red-400')
  }
  
  return classes
}

const getSharpeRatioDescription = (): string => {
  const ratio = analysisResult.value?.sharpeRatio || 0
  
  if (ratio > 1) return t('calculator.excellentRiskAdjustedReturn')
  if (ratio > 0.5) return t('calculator.goodRiskAdjustedReturn')
  return t('calculator.poorRiskAdjustedReturn')
}

const getOptimizationSuggestions = () => {
  if (!analysisResult.value) return []
  
  const suggestions = []
  
  // 基于夏普比率的建议
  if (analysisResult.value.sharpeRatio < 0.5) {
    suggestions.push({
      id: 'improve-sharpe',
      title: t('calculator.improveSharpeRatio'),
      description: t('calculator.improveSharpeDescription'),
      icon: TrendingUpIcon,
      iconClasses: 'w-5 h-5 text-blue-500'
    })
  }
  
  // 基于多样化的建议
  if (analysisResult.value.diversificationBenefit < 2) {
    suggestions.push({
      id: 'increase-diversification',
      title: t('calculator.increaseDiversification'),
      description: t('calculator.increaseDiversificationDescription'),
      icon: PuzzlePieceIcon,
      iconClasses: 'w-5 h-5 text-purple-500'
    })
  }
  
  // 基于风险的建议
  if (analysisResult.value.totalRisk > 20) {
    suggestions.push({
      id: 'reduce-risk',
      title: t('calculator.reduceRisk'),
      description: t('calculator.reduceRiskDescription'),
      icon: ExclamationTriangleIcon,
      iconClasses: 'w-5 h-5 text-orange-500'
    })
  }
  
  return suggestions
}

// 生命周期
onMounted(() => {
  validateAllocation()
})
</script>

<style scoped>
.portfolio-analysis-calculator {
  @apply space-y-6;
}

.asset-item {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
}

.asset-color {
  @apply w-4 h-4 rounded-full;
}

.asset-number {
  @apply font-medium text-gray-900 dark:text-white;
}

.field-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.field-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.input-with-currency {
  @apply relative;
}

.currency-symbol {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-500;
}

.toggle-label {
  @apply flex items-center space-x-2 cursor-pointer;
}

.toggle-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.toggle-text {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.calculate-button {
  @apply flex items-center px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200;
}

.error-message {
  @apply flex items-center text-red-600 dark:text-red-400 text-sm;
}

.metric-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
}

.metric-header {
  @apply flex items-center space-x-2 mb-2;
}

.metric-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.metric-value {
  @apply text-2xl font-bold mb-1;
}

.metric-subtitle {
  @apply text-xs text-gray-500 dark:text-gray-500;
}

.chart-container {
  @apply relative h-64 bg-white dark:bg-gray-800 rounded-lg p-4;
}

.legend-item {
  @apply flex items-center space-x-2;
}

.legend-color {
  @apply w-3 h-3 rounded-full;
}

.legend-text {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.suggestion-item {
  @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4;
}

.suggestion-header {
  @apply flex items-center space-x-2 mb-2;
}

.suggestion-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.suggestion-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.add-asset-button,
.remove-asset-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.add-asset-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.remove-asset-button {
  @apply text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .asset-fields {
    @apply grid-cols-1;
  }
  
  .metrics-grid {
    @apply grid-cols-1;
  }
  
  .legend-items {
    @apply grid-cols-1;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .asset-item {
  @apply border-2 border-current;
}
</style>
