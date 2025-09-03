<!--
  年度明细表格示例组件
  展示年度明细表格的完整功能和交互
-->

<template>
  <div class="yearly-detail-example">
    <div class="example-header">
      <h1>Jährliche Aufschlüsselung</h1>
      <p>Detaillierte Analyse Ihrer Investitionsentwicklung Jahr für Jahr</p>
    </div>

    <!-- 投资参数配置 -->
    <div class="parameters-section">
      <h2>Investitionsparameter</h2>
      <div class="parameters-grid">
        <div class="parameter-group">
          <label>Anfangsbetrag (€)</label>
          <input
            v-model.number="investmentParams.initialAmount"
            type="number"
            min="0"
            step="1000"
            class="parameter-input"
            @input="updateTableData"
          />
        </div>

        <div class="parameter-group">
          <label>Monatliche Einzahlung (€)</label>
          <input
            v-model.number="investmentParams.monthlyContribution"
            type="number"
            min="0"
            step="50"
            class="parameter-input"
            @input="updateTableData"
          />
        </div>

        <div class="parameter-group">
          <label>Jährlicher Zinssatz (%)</label>
          <input
            v-model.number="investmentParams.annualRate"
            type="number"
            min="0"
            max="20"
            step="0.1"
            class="parameter-input"
            @input="updateTableData"
          />
        </div>

        <div class="parameter-group">
          <label>Anlagedauer (Jahre)</label>
          <input
            v-model.number="investmentParams.years"
            type="number"
            min="1"
            max="50"
            step="1"
            class="parameter-input"
            @input="updateTableData"
          />
        </div>

        <div class="parameter-group">
          <label>Inflationsrate (%)</label>
          <input
            v-model.number="investmentParams.inflationRate"
            type="number"
            min="0"
            max="10"
            step="0.1"
            class="parameter-input"
            @input="updateTableData"
          />
        </div>

        <div class="parameter-group">
          <label class="checkbox-label">
            <input
              v-model="investmentParams.includeInflation"
              type="checkbox"
              @change="updateTableData"
            />
            <span>Inflationsbereinigung anzeigen</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 快速场景选择 -->
    <div class="scenarios-section">
      <h2>Schnell-Szenarien</h2>
      <div class="scenario-buttons">
        <button
          v-for="scenario in quickScenarios"
          :key="scenario.id"
          @click="loadScenario(scenario)"
          class="scenario-button"
          :class="{ 'active': selectedScenario === scenario.id }"
        >
          <Icon :name="scenario.icon" size="sm" />
          {{ scenario.name }}
        </button>
      </div>
    </div>

    <!-- 年度明细表格 -->
    <div class="table-section">
      <YearlyDetailTable
        :data="tableData"
        :loading="isLoading"
        @row-select="handleRowSelect"
        @data-export="handleDataExport"
        @filter-change="handleFilterChange"
      />
    </div>

    <!-- 数据摘要 -->
    <div class="summary-section">
      <h2>Zusammenfassung</h2>
      <div class="summary-cards">
        <div class="summary-card primary">
          <div class="card-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Gesamtwachstum</div>
            <div class="card-value">{{ formatCurrency(summaryData.totalGrowth) }}</div>
            <div class="card-detail">
              {{ formatPercentage(summaryData.totalGrowthRate) }} über {{ investmentParams.years }} Jahre
            </div>
          </div>
        </div>

        <div class="summary-card success">
          <div class="card-icon">
            <Icon name="dollar-sign" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Gesamte Zinserträge</div>
            <div class="card-value">{{ formatCurrency(summaryData.totalInterest) }}</div>
            <div class="card-detail">
              Durchschnittlich {{ formatCurrency(summaryData.averageYearlyInterest) }} pro Jahr
            </div>
          </div>
        </div>

        <div class="summary-card info">
          <div class="card-icon">
            <Icon name="calendar" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Bestes Jahr</div>
            <div class="card-value">Jahr {{ summaryData.bestYear?.year || '-' }}</div>
            <div class="card-detail">
              {{ formatPercentage(summaryData.bestYear?.growthRate || 0) }} Wachstum
            </div>
          </div>
        </div>

        <div class="summary-card warning">
          <div class="card-icon">
            <Icon name="target" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Endwert</div>
            <div class="card-value">{{ formatCurrency(summaryData.finalValue) }}</div>
            <div class="card-detail">
              {{ formatCurrency(summaryData.totalContributions) }} eingezahlt
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 年度趋势分析 -->
    <div class="trends-section">
      <h2>Wachstumstrends</h2>
      <div class="trends-content">
        <div class="trend-chart">
          <div class="chart-header">
            <h3>Jährliche Wachstumsraten</h3>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color positive"></div>
                <span>Überdurchschnittlich</span>
              </div>
              <div class="legend-item">
                <div class="legend-color neutral"></div>
                <span>Durchschnittlich</span>
              </div>
              <div class="legend-item">
                <div class="legend-color negative"></div>
                <span>Unterdurchschnittlich</span>
              </div>
            </div>
          </div>

          <div class="trend-bars">
            <div
              v-for="(data, index) in tableData.slice(0, 20)"
              :key="data.year"
              class="trend-bar-group"
            >
              <div class="trend-year">{{ data.year }}</div>
              <div class="trend-bar-container">
                <div
                  class="trend-bar"
                  :class="getTrendClass(data.growthRate)"
                  :style="{ height: `${Math.max(5, (data.growthRate * 100 / maxGrowthRate) * 100)}%` }"
                  :title="`Jahr ${data.year}: ${formatPercentage(data.growthRate)}`"
                >
                  <span class="trend-value">{{ formatPercentage(data.growthRate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="trend-insights">
          <h3>Trend-Analyse</h3>
          <div class="insights-list">
            <div class="insight-item">
              <Icon name="trending-up" size="sm" />
              <div class="insight-content">
                <div class="insight-title">Durchschnittliche Wachstumsrate</div>
                <div class="insight-value">{{ formatPercentage(summaryData.averageGrowthRate) }}</div>
              </div>
            </div>

            <div class="insight-item">
              <Icon name="bar-chart" size="sm" />
              <div class="insight-content">
                <div class="insight-title">Wachstumsstabilität</div>
                <div class="insight-value">{{ getStabilityRating() }}</div>
              </div>
            </div>

            <div class="insight-item">
              <Icon name="zap" size="sm" />
              <div class="insight-content">
                <div class="insight-title">Zinseszins-Effekt</div>
                <div class="insight-value">{{ formatCurrency(summaryData.compoundEffect) }}</div>
              </div>
            </div>

            <div class="insight-item">
              <Icon name="clock" size="sm" />
              <div class="insight-content">
                <div class="insight-title">Verdoppelungszeit</div>
                <div class="insight-value">{{ summaryData.doublingTime }} Jahre</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出和操作 -->
    <div class="actions-section">
      <div class="action-buttons">
        <button @click="exportToCSV" class="action-button primary">
          <Icon name="download" size="sm" />
          CSV exportieren
        </button>
        <button @click="exportToExcel" class="action-button secondary">
          <Icon name="file-spreadsheet" size="sm" />
          Excel exportieren
        </button>
        <button @click="printTable" class="action-button secondary">
          <Icon name="printer" size="sm" />
          Drucken
        </button>
        <button @click="shareAnalysis" class="action-button secondary">
          <Icon name="share-2" size="sm" />
          Teilen
        </button>
      </div>
    </div>

    <!-- 选中行详情提示 -->
    <Transition name="toast-slide">
      <div v-if="selectedRowData" class="row-selection-toast">
        <div class="toast-content">
          <Icon name="info" size="sm" />
          <span>Jahr {{ selectedRowData.year }} ausgewählt - Klicken Sie auf die Zeile für Details</span>
        </div>
        <button @click="selectedRowData = null" class="toast-close">
          <Icon name="x" size="xs" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import YearlyDetailTable from '@/components/tables/YearlyDetailTable.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface InvestmentParams {
  initialAmount: number
  monthlyContribution: number
  annualRate: number
  years: number
  inflationRate: number
  includeInflation: boolean
}

interface YearlyData {
  year: number
  startBalance: number
  totalValue: number
  contributions: number
  interest: number
  growthRate: number
  yearlyContributions: number
  inflationAdjustedValue?: number
}

interface QuickScenario {
  id: string
  name: string
  icon: string
  params: Partial<InvestmentParams>
}

interface SummaryData {
  totalGrowth: number
  totalGrowthRate: number
  totalInterest: number
  averageYearlyInterest: number
  bestYear: YearlyData | null
  finalValue: number
  totalContributions: number
  averageGrowthRate: number
  compoundEffect: number
  doublingTime: number
}

// 响应式数据
const isLoading = ref(false)
const selectedScenario = ref('')
const selectedRowData = ref<YearlyData | null>(null)

const investmentParams = reactive<InvestmentParams>({
  initialAmount: 10000,
  monthlyContribution: 500,
  annualRate: 7,
  years: 25,
  inflationRate: 2,
  includeInflation: false
})

const tableData = ref<YearlyData[]>([])

// 快速场景配置
const quickScenarios: QuickScenario[] = [
  {
    id: 'conservative',
    name: 'Konservativ',
    icon: 'shield',
    params: {
      initialAmount: 5000,
      monthlyContribution: 200,
      annualRate: 4,
      years: 30
    }
  },
  {
    id: 'balanced',
    name: 'Ausgewogen',
    icon: 'trending-up',
    params: {
      initialAmount: 10000,
      monthlyContribution: 500,
      annualRate: 7,
      years: 25
    }
  },
  {
    id: 'aggressive',
    name: 'Wachstumsorientiert',
    icon: 'zap',
    params: {
      initialAmount: 15000,
      monthlyContribution: 800,
      annualRate: 10,
      years: 20
    }
  },
  {
    id: 'retirement',
    name: 'Altersvorsorge',
    icon: 'home',
    params: {
      initialAmount: 25000,
      monthlyContribution: 1000,
      annualRate: 6,
      years: 35
    }
  }
]

// 计算属性
const summaryData = computed((): SummaryData => {
  if (!tableData.value.length) {
    return {
      totalGrowth: 0,
      totalGrowthRate: 0,
      totalInterest: 0,
      averageYearlyInterest: 0,
      bestYear: null,
      finalValue: 0,
      totalContributions: 0,
      averageGrowthRate: 0,
      compoundEffect: 0,
      doublingTime: 0
    }
  }

  const lastYear = tableData.value[tableData.value.length - 1]
  const totalContributions = lastYear.contributions
  const finalValue = lastYear.totalValue
  const totalGrowth = finalValue - totalContributions
  const totalGrowthRate = totalContributions > 0 ? totalGrowth / totalContributions : 0
  const totalInterest = lastYear.interest
  const averageYearlyInterest = totalInterest / tableData.value.length

  // 找到最佳年份
  const bestYear = tableData.value.reduce((best, current) =>
    current.growthRate > (best?.growthRate || 0) ? current : best
  , null as YearlyData | null)

  // 计算平均增长率
  const averageGrowthRate = tableData.value.reduce((sum, data) => sum + data.growthRate, 0) / tableData.value.length

  // 计算复利效应
  const simpleInterest = investmentParams.initialAmount * (investmentParams.annualRate / 100) * investmentParams.years +
    (investmentParams.monthlyContribution * 12 * (investmentParams.annualRate / 100) * investmentParams.years / 2)
  const compoundEffect = totalInterest - simpleInterest

  // 计算翻倍时间
  const doublingTime = investmentParams.annualRate > 0 ? Math.round(72 / investmentParams.annualRate) : 0

  return {
    totalGrowth,
    totalGrowthRate,
    totalInterest,
    averageYearlyInterest,
    bestYear,
    finalValue,
    totalContributions,
    averageGrowthRate,
    compoundEffect,
    doublingTime
  }
})

const maxGrowthRate = computed(() => {
  if (!tableData.value.length) return 1
  return Math.max(...tableData.value.map(d => d.growthRate * 100))
})

// 方法
const generateTableData = (): YearlyData[] => {
  const data: YearlyData[] = []
  let currentBalance = investmentParams.initialAmount
  let totalContributions = investmentParams.initialAmount

  for (let year = 1; year <= investmentParams.years; year++) {
    const startBalance = currentBalance
    const yearlyContributions = investmentParams.monthlyContribution * 12
    const yearlyInterest = currentBalance * (investmentParams.annualRate / 100)

    currentBalance = currentBalance + yearlyInterest + yearlyContributions
    totalContributions += yearlyContributions

    const totalInterest = currentBalance - totalContributions
    const growthRate = startBalance > 0 ? (currentBalance - startBalance) / startBalance : 0

    let inflationAdjustedValue: number | undefined
    if (investmentParams.includeInflation) {
      inflationAdjustedValue = currentBalance / Math.pow(1 + investmentParams.inflationRate / 100, year)
    }

    data.push({
      year,
      startBalance,
      totalValue: currentBalance,
      contributions: totalContributions,
      interest: totalInterest,
      growthRate,
      yearlyContributions,
      inflationAdjustedValue
    })
  }

  return data
}

const updateTableData = () => {
  isLoading.value = true
  setTimeout(() => {
    tableData.value = generateTableData()
    isLoading.value = false
  }, 300)
}

const loadScenario = (scenario: QuickScenario) => {
  selectedScenario.value = scenario.id
  Object.assign(investmentParams, scenario.params)
  updateTableData()
}

const getTrendClass = (growthRate: number): string => {
  const avgRate = summaryData.value.averageGrowthRate
  if (growthRate > avgRate * 1.1) return 'positive'
  if (growthRate < avgRate * 0.9) return 'negative'
  return 'neutral'
}

const getStabilityRating = (): string => {
  if (!tableData.value.length) return 'Keine Daten'

  const rates = tableData.value.map(d => d.growthRate)
  const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
  const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) / rates.length
  const stdDev = Math.sqrt(variance)

  if (stdDev < 0.02) return 'Sehr stabil'
  if (stdDev < 0.05) return 'Stabil'
  if (stdDev < 0.1) return 'Moderat'
  return 'Volatil'
}

const handleRowSelect = (row: YearlyData) => {
  selectedRowData.value = row
  setTimeout(() => {
    selectedRowData.value = null
  }, 5000)
}

const handleDataExport = (data: YearlyData[], format: string) => {
  console.log(`Exporting ${data.length} rows as ${format}`)
}

const handleFilterChange = (filters: any) => {
  console.log('Filters changed:', filters)
}

const exportToCSV = () => {
  const headers = ['Jahr', 'Anfangswert', 'Einzahlungen', 'Zinserträge', 'Endwert', 'Wachstum']
  const csvContent = [
    headers.join(','),
    ...tableData.value.map(row => [
      row.year,
      row.startBalance.toFixed(2),
      row.yearlyContributions.toFixed(2),
      row.interest.toFixed(2),
      row.totalValue.toFixed(2),
      (row.growthRate * 100).toFixed(2) + '%'
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'jaehrliche-aufschluesselung.csv'
  link.click()
}

const exportToExcel = () => {
  console.log('Excel export would be implemented here')
}

const printTable = () => {
  window.print()
}

const shareAnalysis = () => {
  const shareText = `Investitionsanalyse:
Startkapital: ${formatCurrency(investmentParams.initialAmount)}
Monatlich: ${formatCurrency(investmentParams.monthlyContribution)}
Zinssatz: ${formatPercentage(investmentParams.annualRate / 100)}
Endwert nach ${investmentParams.years} Jahren: ${formatCurrency(summaryData.value.finalValue)}`

  if (navigator.share) {
    navigator.share({
      title: 'Investitionsanalyse',
      text: shareText
    })
  } else {
    navigator.clipboard.writeText(shareText)
    alert('Analyse in die Zwischenablage kopiert!')
  }
}

// 生命周期
onMounted(() => {
  updateTableData()
})
</script>

<style scoped>
.yearly-detail-example {
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
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.parameter-group {
  @apply space-y-2;
}

.parameter-group label {
  @apply block text-sm font-medium text-gray-700;
}

.parameter-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
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

/* 快速场景区域 */
.scenarios-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.scenarios-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.scenario-buttons {
  @apply flex flex-wrap gap-3;
}

.scenario-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-md border;
  @apply text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-all duration-200;
}

.scenario-button.active {
  @apply bg-blue-100 border-blue-500 text-blue-700;
}

/* 表格区域 */
.table-section {
  @apply space-y-4;
}

/* 数据摘要区域 */
.summary-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.summary-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.summary-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.summary-card {
  @apply flex items-center gap-4 p-4 rounded-lg border;
}

.summary-card.primary {
  @apply bg-blue-50 border-blue-200;
}

.summary-card.success {
  @apply bg-green-50 border-green-200;
}

.summary-card.info {
  @apply bg-gray-50 border-gray-200;
}

.summary-card.warning {
  @apply bg-yellow-50 border-yellow-200;
}

.card-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center;
}

.summary-card.primary .card-icon {
  @apply bg-blue-100 text-blue-600;
}

.summary-card.success .card-icon {
  @apply bg-green-100 text-green-600;
}

.summary-card.info .card-icon {
  @apply bg-gray-100 text-gray-600;
}

.summary-card.warning .card-icon {
  @apply bg-yellow-100 text-yellow-600;
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

.card-detail {
  @apply text-xs text-gray-500;
}

/* 趋势分析区域 */
.trends-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.trends-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.trends-content {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.trend-chart {
  @apply lg:col-span-2;
}

.chart-header {
  @apply flex items-center justify-between mb-4;
}

.chart-header h3 {
  @apply text-lg font-semibold text-gray-800;
}

.chart-legend {
  @apply flex gap-4;
}

.legend-item {
  @apply flex items-center gap-2;
}

.legend-color {
  @apply w-3 h-3 rounded;
}

.legend-color.positive {
  @apply bg-green-500;
}

.legend-color.neutral {
  @apply bg-blue-500;
}

.legend-color.negative {
  @apply bg-red-500;
}

.legend-item span {
  @apply text-sm text-gray-600;
}

.trend-bars {
  @apply flex items-end gap-1 h-32 bg-gray-50 rounded-lg p-4 overflow-x-auto;
}

.trend-bar-group {
  @apply flex flex-col items-center gap-1 min-w-0 flex-shrink-0;
}

.trend-year {
  @apply text-xs text-gray-500 transform rotate-45 whitespace-nowrap;
}

.trend-bar-container {
  @apply relative w-6 h-20 bg-gray-200 rounded-t overflow-hidden;
}

.trend-bar {
  @apply absolute bottom-0 w-full rounded-t transition-all duration-500;
}

.trend-bar.positive {
  @apply bg-gradient-to-t from-green-400 to-green-500;
}

.trend-bar.neutral {
  @apply bg-gradient-to-t from-blue-400 to-blue-500;
}

.trend-bar.negative {
  @apply bg-gradient-to-t from-red-400 to-red-500;
}

.trend-value {
  @apply text-xs font-semibold text-white transform rotate-90 whitespace-nowrap;
  @apply absolute bottom-1 left-1/2 transform -translate-x-1/2;
}

.trend-insights {
  @apply space-y-4;
}

.trend-insights h3 {
  @apply text-lg font-semibold text-gray-800 mb-4;
}

.insights-list {
  @apply space-y-3;
}

.insight-item {
  @apply flex items-start gap-3 p-3 bg-gray-50 rounded-lg;
}

.insight-content {
  @apply flex-1;
}

.insight-title {
  @apply text-sm font-medium text-gray-700;
}

.insight-value {
  @apply text-sm font-bold text-gray-900;
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

/* 选中行提示 */
.row-selection-toast {
  @apply fixed bottom-4 right-4 bg-blue-600 text-white rounded-lg shadow-lg p-4;
  @apply flex items-center gap-3 max-w-sm z-50;
}

.toast-content {
  @apply flex items-center gap-2 flex-1;
}

.toast-close {
  @apply p-1 hover:bg-blue-700 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-300;
}

/* 过渡动画 */
.toast-slide-enter-active,
.toast-slide-leave-active {
  @apply transition-all duration-300;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  @apply opacity-0 transform translate-x-full;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .parameters-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .summary-cards {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .trends-content {
    @apply grid-cols-1;
  }

  .chart-header {
    @apply flex-col items-start gap-2;
  }

  .chart-legend {
    @apply flex-wrap;
  }
}

@media (max-width: 768px) {
  .yearly-detail-example {
    @apply p-4;
  }

  .example-header h1 {
    @apply text-2xl;
  }

  .parameters-grid {
    @apply grid-cols-1;
  }

  .scenario-buttons {
    @apply grid grid-cols-2 gap-2;
  }

  .summary-cards {
    @apply grid-cols-1;
  }

  .summary-card {
    @apply flex-col text-center;
  }

  .card-icon {
    @apply mb-3;
  }

  .trend-bars {
    @apply h-24;
  }

  .trend-bar-container {
    @apply w-4 h-16;
  }

  .trend-year {
    @apply text-xs;
  }

  .action-buttons {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }

  .row-selection-toast {
    @apply bottom-2 right-2 left-2 max-w-none;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .yearly-detail-example {
    @apply bg-gray-900;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .parameters-section,
  .scenarios-section,
  .summary-section,
  .trends-section,
  .actions-section {
    @apply bg-gray-800 border-gray-700;
  }

  .parameters-section h2,
  .scenarios-section h2,
  .summary-section h2,
  .trends-section h2 {
    @apply text-gray-100;
  }

  .parameter-group label {
    @apply text-gray-300;
  }

  .parameter-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .checkbox-label span {
    @apply text-gray-300;
  }

  .scenario-button {
    @apply text-gray-300 border-gray-600 hover:border-blue-400 hover:bg-blue-900;
  }

  .scenario-button.active {
    @apply bg-blue-900 border-blue-500 text-blue-300;
  }

  .summary-card {
    @apply bg-gray-700 border-gray-600;
  }

  .card-label {
    @apply text-gray-300;
  }

  .card-value {
    @apply text-gray-100;
  }

  .card-detail {
    @apply text-gray-400;
  }

  .chart-header h3,
  .trend-insights h3 {
    @apply text-gray-100;
  }

  .legend-item span {
    @apply text-gray-300;
  }

  .trend-bars {
    @apply bg-gray-700;
  }

  .trend-year {
    @apply text-gray-400;
  }

  .trend-bar-container {
    @apply bg-gray-600;
  }

  .insight-item {
    @apply bg-gray-700;
  }

  .insight-title {
    @apply text-gray-300;
  }

  .insight-value {
    @apply text-gray-100;
  }

  .action-button.secondary {
    @apply bg-gray-600 text-gray-200 hover:bg-gray-500;
  }

  .row-selection-toast {
    @apply bg-blue-700;
  }

  .toast-close:hover {
    @apply bg-blue-800;
  }
}

/* 打印样式 */
@media print {
  .yearly-detail-example {
    @apply shadow-none;
  }

  .parameters-section,
  .scenarios-section {
    @apply hidden;
  }

  .summary-section,
  .trends-section,
  .actions-section {
    @apply shadow-none border border-gray-300;
  }

  .actions-section {
    @apply hidden;
  }

  .row-selection-toast {
    @apply hidden;
  }

  .summary-card {
    @apply bg-white border-gray-300;
  }

  .trend-bars {
    @apply bg-gray-100;
  }

  .insight-item {
    @apply bg-gray-100;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .summary-card {
    @apply border-2 border-black;
  }

  .scenario-button {
    @apply border-2 border-black;
  }

  .scenario-button.active {
    @apply bg-black text-white;
  }

  .trend-bar {
    @apply border border-black;
  }

  .action-button.primary {
    @apply bg-black text-white;
  }
}
</style>
