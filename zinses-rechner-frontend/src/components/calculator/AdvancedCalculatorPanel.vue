<!--
  高级计算器面板组件
  提供投资组合分析、贷款比较、退休规划等高级计算功能
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ t('calculator.advancedCalculator') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('calculator.advancedDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <button
            @click="showHistory = !showHistory"
            class="history-button"
          >
            <ClockIcon class="w-4 h-4 mr-2" />
            {{ t('calculator.history') }}
          </button>
          
          <button
            @click="clearAllHistory"
            :disabled="calculationHistory.length === 0"
            class="clear-button"
          >
            <TrashIcon class="w-4 h-4 mr-2" />
            {{ t('calculator.clearHistory') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 计算器类型选择 -->
    <div class="calculator-types mb-8">
      <div class="types-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          v-for="type in calculatorTypes"
          :key="type.id"
          @click="selectedType = type.id"
          :class="getTypeButtonClasses(type.id)"
        >
          <component :is="type.icon" class="w-6 h-6 mb-2" />
          <div class="type-info">
            <div class="type-name">{{ type.name }}</div>
            <div class="type-description">{{ type.description }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- 投资组合分析 -->
    <div v-if="selectedType === 'portfolio'" class="calculator-section">
      <PortfolioAnalysisCalculator
        @calculation-complete="handleCalculationComplete"
        @calculation-error="handleCalculationError"
      />
    </div>

    <!-- 贷款比较 -->
    <div v-if="selectedType === 'loan'" class="calculator-section">
      <LoanComparisonCalculator
        @calculation-complete="handleCalculationComplete"
        @calculation-error="handleCalculationError"
      />
    </div>

    <!-- 退休规划 -->
    <div v-if="selectedType === 'retirement'" class="calculator-section">
      <RetirementPlanningCalculator
        @calculation-complete="handleCalculationComplete"
        @calculation-error="handleCalculationError"
      />
    </div>

    <!-- 税务优化 -->
    <div v-if="selectedType === 'tax'" class="calculator-section">
      <TaxOptimizationCalculator
        @calculation-complete="handleCalculationComplete"
        @calculation-error="handleCalculationError"
      />
    </div>

    <!-- 投资策略建议 -->
    <div v-if="selectedType === 'strategy'" class="calculator-section">
      <InvestmentStrategyAdvisor
        @strategy-selected="handleStrategySelected"
      />
    </div>

    <!-- 计算历史侧边栏 -->
    <div v-if="showHistory" class="history-sidebar">
      <div class="sidebar-overlay" @click="showHistory = false"></div>
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('calculator.calculationHistory') }}
          </h4>
          <button
            @click="showHistory = false"
            class="close-sidebar-button"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        
        <div class="history-list">
          <div
            v-for="calculation in calculationHistory"
            :key="calculation.id"
            class="history-item"
            @click="loadCalculation(calculation)"
          >
            <div class="history-header">
              <component :is="getCalculationIcon(calculation.type)" class="w-4 h-4 text-blue-500" />
              <span class="history-type">{{ getCalculationTypeName(calculation.type) }}</span>
              <span class="history-time">{{ formatTime(calculation.timestamp) }}</span>
            </div>
            <div class="history-summary">
              {{ getCalculationSummary(calculation) }}
            </div>
          </div>
          
          <div v-if="calculationHistory.length === 0" class="empty-history">
            <ClockIcon class="w-8 h-8 text-gray-400 mb-2" />
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('calculator.noHistory') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isCalculating" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">{{ t('calculator.calculating') }}</p>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="calculationError" class="error-alert">
      <ExclamationTriangleIcon class="w-5 h-5 text-red-500" />
      <span class="error-message">{{ calculationError }}</span>
      <button @click="calculationError = null" class="dismiss-error">
        <XMarkIcon class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ClockIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalculatorIcon,
  LightBulbIcon
} from '@heroicons/vue/24/outline'
import PortfolioAnalysisCalculator from './PortfolioAnalysisCalculator.vue'
import LoanComparisonCalculator from './LoanComparisonCalculator.vue'
import RetirementPlanningCalculator from './RetirementPlanningCalculator.vue'
import TaxOptimizationCalculator from './TaxOptimizationCalculator.vue'
import InvestmentStrategyAdvisor from './InvestmentStrategyAdvisor.vue'
import { useAdvancedCalculator } from '@/services/AdvancedCalculatorManager'
import { useI18n } from '@/services/I18nService'

// Props
interface Props {
  defaultType?: string
  showTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultType: 'portfolio',
  showTitle: true
})

// 使用服务
const {
  isCalculating,
  lastCalculation,
  getCalculationHistory,
  clearHistory
} = useAdvancedCalculator()

const { t } = useI18n()

// 响应式状态
const selectedType = ref(props.defaultType)
const showHistory = ref(false)
const calculationError = ref<string | null>(null)
const calculationHistory = ref(getCalculationHistory())

// 计算器类型配置
const calculatorTypes = [
  {
    id: 'portfolio',
    name: t('calculator.portfolioAnalysis'),
    description: t('calculator.portfolioDescription'),
    icon: ChartPieIcon
  },
  {
    id: 'loan',
    name: t('calculator.loanComparison'),
    description: t('calculator.loanDescription'),
    icon: CurrencyDollarIcon
  },
  {
    id: 'retirement',
    name: t('calculator.retirementPlanning'),
    description: t('calculator.retirementDescription'),
    icon: UserIcon
  },
  {
    id: 'tax',
    name: t('calculator.taxOptimization'),
    description: t('calculator.taxDescription'),
    icon: CalculatorIcon
  },
  {
    id: 'strategy',
    name: t('calculator.investmentStrategy'),
    description: t('calculator.strategyDescription'),
    icon: LightBulbIcon
  }
]

// 计算属性
const containerClasses = computed(() => [
  'advanced-calculator-panel',
  'bg-white',
  'dark:bg-gray-900',
  'rounded-lg',
  'p-6',
  'relative',
  'max-w-7xl',
  'mx-auto'
])

const ariaLabel = computed(() => {
  return `${t('calculator.advancedCalculator')}: ${getCalculationTypeName(selectedType.value)}`
})

// 方法
const getTypeButtonClasses = (typeId: string): string[] => {
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

const getCalculationIcon = (type: string) => {
  const iconMap = {
    'portfolio-analysis': ChartPieIcon,
    'loan-comparison': CurrencyDollarIcon,
    'retirement-planning': UserIcon,
    'tax-optimization': CalculatorIcon,
    'investment-strategy': LightBulbIcon
  }
  return iconMap[type as keyof typeof iconMap] || CalculatorIcon
}

const getCalculationTypeName = (type: string): string => {
  const nameMap = {
    'portfolio': t('calculator.portfolioAnalysis'),
    'portfolio-analysis': t('calculator.portfolioAnalysis'),
    'loan': t('calculator.loanComparison'),
    'loan-comparison': t('calculator.loanComparison'),
    'retirement': t('calculator.retirementPlanning'),
    'retirement-planning': t('calculator.retirementPlanning'),
    'tax': t('calculator.taxOptimization'),
    'tax-optimization': t('calculator.taxOptimization'),
    'strategy': t('calculator.investmentStrategy'),
    'investment-strategy': t('calculator.investmentStrategy')
  }
  return nameMap[type as keyof typeof nameMap] || type
}

const getCalculationSummary = (calculation: any): string => {
  switch (calculation.type) {
    case 'portfolio-analysis':
      return `${calculation.results.assets?.length || 0} Assets, ${(calculation.results.expectedReturn || 0).toFixed(1)}% Rendite`
    case 'loan-comparison':
      return `${calculation.results.loans?.length || 0} Kredite verglichen, ${formatCurrency(calculation.results.savings || 0)} Ersparnis`
    case 'retirement-planning':
      return `Rente mit ${calculation.inputs.retirementAge}, ${formatCurrency(calculation.results.projectedSavings || 0)} projiziert`
    case 'tax-optimization':
      return `${formatCurrency(calculation.results.savings || 0)} Steuerersparnis möglich`
    default:
      return 'Berechnung abgeschlossen'
  }
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return 'Gerade eben'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return date.toLocaleDateString('de-DE')
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const handleCalculationComplete = (result: any): void => {
  calculationError.value = null
  calculationHistory.value = getCalculationHistory()
  
  // 显示成功提示
  console.log('Calculation completed:', result)
}

const handleCalculationError = (error: string): void => {
  calculationError.value = error
}

const handleStrategySelected = (strategy: any): void => {
  console.log('Investment strategy selected:', strategy)
}

const loadCalculation = (calculation: any): void => {
  // 根据计算类型切换到相应的计算器
  const typeMap = {
    'portfolio-analysis': 'portfolio',
    'loan-comparison': 'loan',
    'retirement-planning': 'retirement',
    'tax-optimization': 'tax'
  }
  
  const newType = typeMap[calculation.type as keyof typeof typeMap]
  if (newType) {
    selectedType.value = newType
  }
  
  showHistory.value = false
  
  // 这里可以添加加载历史计算数据的逻辑
  console.log('Loading calculation:', calculation)
}

const clearAllHistory = (): void => {
  if (confirm(t('calculator.confirmClearHistory'))) {
    clearHistory()
    calculationHistory.value = getCalculationHistory()
  }
}

// 生命周期
onMounted(() => {
  calculationHistory.value = getCalculationHistory()
})
</script>

<style scoped>
.advanced-calculator-panel {
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

.calculator-section {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-6;
}

.history-sidebar {
  @apply fixed inset-0 z-50 flex;
}

.sidebar-overlay {
  @apply flex-1 bg-black bg-opacity-50;
}

.sidebar-content {
  @apply w-96 bg-white dark:bg-gray-900 shadow-xl flex flex-col max-h-screen;
}

.sidebar-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.close-sidebar-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md;
}

.history-list {
  @apply flex-1 overflow-y-auto p-4 space-y-3;
}

.history-item {
  @apply p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200;
}

.history-header {
  @apply flex items-center space-x-2 mb-2;
}

.history-type {
  @apply flex-1 font-medium text-sm text-gray-900 dark:text-white;
}

.history-time {
  @apply text-xs text-gray-500 dark:text-gray-500;
}

.history-summary {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.empty-history {
  @apply flex flex-col items-center justify-center py-8 text-center;
}

.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-40;
}

.loading-content {
  @apply flex flex-col items-center space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin;
}

.loading-text {
  @apply text-gray-600 dark:text-gray-400 font-medium;
}

.error-alert {
  @apply fixed bottom-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-3 shadow-lg z-50;
}

.error-message {
  @apply text-red-700 dark:text-red-400 text-sm;
}

.dismiss-error {
  @apply text-red-400 hover:text-red-600 dark:hover:text-red-300;
}

.history-button,
.clear-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.history-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.clear-button {
  @apply text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-red-500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .types-grid {
    @apply grid-cols-1;
  }
  
  .sidebar-content {
    @apply w-full;
  }
  
  .panel-header .header-content {
    @apply flex-col space-y-4;
  }
  
  .header-actions {
    @apply w-full justify-between;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .type-button {
  @apply border-2;
}

/* 暗色模式支持 */
:global(.theme-dark) .calculator-section {
  @apply bg-gray-800;
}

/* 动画 */
.calculator-section {
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

/* 打印样式 */
@media print {
  .header-actions,
  .history-sidebar,
  .loading-overlay,
  .error-alert {
    @apply hidden;
  }
}
</style>
