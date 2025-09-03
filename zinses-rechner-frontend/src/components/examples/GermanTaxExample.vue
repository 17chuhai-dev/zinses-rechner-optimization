<!--
  德国税务分析示例组件
  展示德国税务分析系统的完整功能和交互
-->

<template>
  <div class="german-tax-example">
    <div class="example-header">
      <h1>Deutsche Steueranalyse für Kapitalanlagen</h1>
      <p>Verstehen Sie die steuerlichen Auswirkungen Ihrer Investitionen in Deutschland</p>
    </div>

    <!-- 投资参数配置 -->
    <div class="investment-params-section">
      <h2>Investitionsparameter</h2>
      <div class="params-grid">
        <div class="param-group">
          <label>Anfangsbetrag (€)</label>
          <input
            v-model.number="investmentParams.initialAmount"
            type="number"
            min="0"
            step="1000"
            class="param-input"
            @input="updateTaxAnalysis"
          />
        </div>

        <div class="param-group">
          <label>Monatliche Sparrate (€)</label>
          <input
            v-model.number="investmentParams.monthlyContribution"
            type="number"
            min="0"
            step="50"
            class="param-input"
            @input="updateTaxAnalysis"
          />
        </div>

        <div class="param-group">
          <label>Erwartete Jahresrendite (%)</label>
          <input
            v-model.number="investmentParams.expectedReturn"
            type="number"
            min="0"
            max="20"
            step="0.1"
            class="param-input"
            @input="updateTaxAnalysis"
          />
        </div>

        <div class="param-group">
          <label>Anlagedauer (Jahre)</label>
          <input
            v-model.number="investmentParams.years"
            type="number"
            min="1"
            max="50"
            step="1"
            class="param-input"
            @input="updateTaxAnalysis"
          />
        </div>

        <div class="param-group">
          <label>Anlagetyp</label>
          <select v-model="investmentParams.type" @change="updateTaxAnalysis" class="param-input">
            <option value="stocks">Aktien</option>
            <option value="etf">ETFs</option>
            <option value="bonds">Anleihen</option>
            <option value="mixed">Mischportfolio</option>
          </select>
        </div>

        <div class="param-group">
          <label>Thesaurierend</label>
          <div class="checkbox-wrapper">
            <input
              v-model="investmentParams.accumulating"
              type="checkbox"
              id="accumulating"
              @change="updateTaxAnalysis"
            />
            <label for="accumulating">Ja, thesaurierende Fonds</label>
          </div>
        </div>
      </div>
    </div>

    <!-- 德国税务分析引擎 -->
    <div class="tax-analysis-section">
      <GermanTaxAnalysisEngine
        :investment-data="investmentData"
        :investment-type="investmentParams.type"
        @optimization-applied="handleOptimizationApplied"
        @tax-config-changed="handleTaxConfigChanged"
        @calculation-updated="handleCalculationUpdated"
      />
    </div>

    <!-- 税务对比分析 -->
    <div class="tax-comparison-section">
      <h2>Steuervergleich</h2>
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
        <!-- 不同投资类型对比 -->
        <div v-if="activeComparisonTab === 'types'" class="types-comparison">
          <div class="comparison-chart">
            <div class="chart-header">
              <h3>Steuerbelastung nach Anlagetyp</h3>
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-color stocks"></div>
                  <span>Aktien</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color etf"></div>
                  <span>ETFs</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color bonds"></div>
                  <span>Anleihen</span>
                </div>
              </div>
            </div>

            <div class="comparison-bars">
              <div
                v-for="(comparison, index) in typeComparisons"
                :key="index"
                class="comparison-bar-group"
              >
                <div class="comparison-label">{{ comparison.type }}</div>
                <div class="comparison-bar-container">
                  <div class="comparison-bar" :class="comparison.type.toLowerCase()" :style="{ height: `${(comparison.taxBurden / maxTaxBurden) * 100}%` }">
                    <span class="bar-value">{{ formatCurrency(comparison.taxBurden) }}</span>
                  </div>
                </div>
                <div class="comparison-details">
                  <div class="detail-item">
                    <span class="detail-label">Effektive Rate:</span>
                    <span class="detail-value">{{ formatPercentage(comparison.effectiveRate) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Netto-Rendite:</span>
                    <span class="detail-value positive">{{ formatCurrency(comparison.netReturn) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 不同州的对比 -->
        <div v-if="activeComparisonTab === 'states'" class="states-comparison">
          <div class="states-table">
            <div class="table-header">
              <span>Bundesland</span>
              <span>Kirchensteuer</span>
              <span>Gesamtbelastung</span>
              <span>Unterschied</span>
            </div>
            <div
              v-for="(state, index) in stateComparisons"
              :key="index"
              class="table-row"
              :class="{ 'current': state.current }"
            >
              <span class="state-name">{{ state.name }}</span>
              <span class="church-tax">{{ formatPercentage(state.churchTaxRate) }}</span>
              <span class="total-burden">{{ formatCurrency(state.totalBurden) }}</span>
              <span class="difference" :class="{ 'positive': state.difference < 0, 'negative': state.difference > 0 }">
                {{ state.difference > 0 ? '+' : '' }}{{ formatCurrency(state.difference) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 时间影响对比 -->
        <div v-if="activeComparisonTab === 'time'" class="time-comparison">
          <div class="time-chart">
            <div class="time-bars">
              <div
                v-for="(period, index) in timeComparisons"
                :key="index"
                class="time-bar-group"
              >
                <div class="time-label">{{ period.years }} Jahre</div>
                <div class="time-metrics">
                  <div class="metric-bar gross">
                    <div class="bar-fill" :style="{ height: `${(period.grossReturn / maxGrossReturn) * 100}%` }"></div>
                    <span class="bar-label">Brutto</span>
                  </div>
                  <div class="metric-bar net">
                    <div class="bar-fill" :style="{ height: `${(period.netReturn / maxGrossReturn) * 100}%` }"></div>
                    <span class="bar-label">Netto</span>
                  </div>
                </div>
                <div class="time-details">
                  <div class="time-value gross">{{ formatCurrency(period.grossReturn) }}</div>
                  <div class="time-value net">{{ formatCurrency(period.netReturn) }}</div>
                  <div class="tax-impact">-{{ formatCurrency(period.taxBurden) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 税务优化建议摘要 -->
    <div class="optimization-summary-section">
      <h2>Optimierungspotenzial</h2>
      <div class="optimization-cards">
        <div class="optimization-card primary">
          <div class="card-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Mögliche Steuerersparnis</div>
            <div class="card-value">{{ formatCurrency(optimizationSummary.totalSavings) }}</div>
            <div class="card-detail">Durch {{ appliedOptimizations.length }} Maßnahmen</div>
          </div>
        </div>

        <div class="optimization-card success">
          <div class="card-icon">
            <Icon name="shield" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Freibetrag-Nutzung</div>
            <div class="card-value">{{ formatPercentage(optimizationSummary.exemptionUtilization) }}</div>
            <div class="card-detail">{{ formatCurrency(optimizationSummary.exemptionUsed) }} von {{ formatCurrency(1000) }}</div>
          </div>
        </div>

        <div class="optimization-card info">
          <div class="card-icon">
            <Icon name="percent" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Effektive Steuerrate</div>
            <div class="card-value">{{ formatPercentage(optimizationSummary.effectiveTaxRate) }}</div>
            <div class="card-detail">Nach Optimierungen</div>
          </div>
        </div>

        <div class="optimization-card warning">
          <div class="card-icon">
            <Icon name="clock" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Umsetzungszeit</div>
            <div class="card-value">{{ optimizationSummary.implementationTime }}</div>
            <div class="card-detail">Durchschnittlich</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 应用的优化措施 -->
    <div v-if="appliedOptimizations.length > 0" class="applied-optimizations-section">
      <h2>Angewendete Optimierungen</h2>
      <div class="applied-optimizations-list">
        <div
          v-for="(optimization, index) in appliedOptimizations"
          :key="index"
          class="applied-optimization-item"
        >
          <div class="optimization-header">
            <div class="optimization-icon">
              <Icon :name="optimization.icon" size="md" />
            </div>
            <div class="optimization-info">
              <h4>{{ optimization.title }}</h4>
              <p>{{ optimization.description }}</p>
            </div>
            <div class="optimization-savings">
              <span class="savings-label">Ersparnis:</span>
              <span class="savings-amount">{{ formatCurrency(optimization.potentialSaving) }}</span>
            </div>
          </div>

          <div class="optimization-status">
            <div class="status-indicator applied">
              <Icon name="check-circle" size="sm" />
              <span>Angewendet</span>
            </div>
            <div class="applied-date">
              {{ formatDate(optimization.appliedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 税务计算器工具 -->
    <div class="tax-calculator-tools">
      <h2>Steuerrechner-Tools</h2>
      <div class="tools-grid">
        <div class="tool-card">
          <div class="tool-icon">
            <Icon name="calculator" size="lg" />
          </div>
          <div class="tool-content">
            <h4>Abgeltungssteuer-Rechner</h4>
            <p>Berechnen Sie die Abgeltungssteuer für Ihre Kapitalerträge</p>
            <div class="tool-input">
              <input
                v-model.number="toolInputs.capitalGains"
                type="number"
                placeholder="Kapitalerträge (€)"
                class="tool-input-field"
              />
              <div class="tool-result">
                <span class="result-label">Steuer:</span>
                <span class="result-value">{{ formatCurrency(calculateCapitalGainsTax(toolInputs.capitalGains)) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-icon">
            <Icon name="shield" size="lg" />
          </div>
          <div class="tool-content">
            <h4>Freibetrag-Optimierer</h4>
            <p>Optimieren Sie die Nutzung Ihres Sparerpauschbetrags</p>
            <div class="tool-input">
              <input
                v-model.number="toolInputs.currentExemption"
                type="number"
                placeholder="Aktuell genutzt (€)"
                class="tool-input-field"
              />
              <div class="tool-result">
                <span class="result-label">Verbleibt:</span>
                <span class="result-value">{{ formatCurrency(1000 - (toolInputs.currentExemption || 0)) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-icon">
            <Icon name="home" size="lg" />
          </div>
          <div class="tool-content">
            <h4>Kirchensteuer-Rechner</h4>
            <p>Berechnen Sie die Kirchensteuer auf Kapitalerträge</p>
            <div class="tool-input">
              <input
                v-model.number="toolInputs.churchTaxBase"
                type="number"
                placeholder="Abgeltungssteuer (€)"
                class="tool-input-field"
              />
              <div class="tool-result">
                <span class="result-label">Kirchensteuer:</span>
                <span class="result-value">{{ formatCurrency(calculateChurchTax(toolInputs.churchTaxBase)) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-section">
      <div class="action-buttons">
        <button @click="exportTaxReport" class="action-button primary">
          <Icon name="download" size="sm" />
          Steuerbericht exportieren
        </button>
        <button @click="scheduleTaxReview" class="action-button secondary">
          <Icon name="calendar" size="sm" />
          Steuerprüfung planen
        </button>
        <button @click="shareTaxAnalysis" class="action-button secondary">
          <Icon name="share-2" size="sm" />
          Analyse teilen
        </button>
        <button @click="resetTaxAnalysis" class="action-button secondary">
          <Icon name="refresh-cw" size="sm" />
          Zurücksetzen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import GermanTaxAnalysisEngine from '@/components/tax/GermanTaxAnalysisEngine.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface InvestmentParams {
  initialAmount: number
  monthlyContribution: number
  expectedReturn: number
  years: number
  type: 'stocks' | 'etf' | 'bonds' | 'mixed'
  accumulating: boolean
}

interface AppliedOptimization {
  id: string
  title: string
  description: string
  icon: string
  potentialSaving: number
  appliedAt: Date
}

interface TypeComparison {
  type: string
  taxBurden: number
  effectiveRate: number
  netReturn: number
}

interface StateComparison {
  name: string
  churchTaxRate: number
  totalBurden: number
  difference: number
  current: boolean
}

interface TimeComparison {
  years: number
  grossReturn: number
  netReturn: number
  taxBurden: number
}

interface OptimizationSummary {
  totalSavings: number
  exemptionUtilization: number
  exemptionUsed: number
  effectiveTaxRate: number
  implementationTime: string
}

// 响应式数据
const activeComparisonTab = ref('types')

const investmentParams = reactive<InvestmentParams>({
  initialAmount: 50000,
  monthlyContribution: 1000,
  expectedReturn: 7,
  years: 20,
  type: 'etf',
  accumulating: true
})

const toolInputs = reactive({
  capitalGains: 5000,
  currentExemption: 800,
  churchTaxBase: 1250
})

const appliedOptimizations = ref<AppliedOptimization[]>([])
const investmentData = ref<any>({})

// 对比标签
const comparisonTabs = [
  { id: 'types', label: 'Anlagetypen', icon: 'pie-chart' },
  { id: 'states', label: 'Bundesländer', icon: 'map' },
  { id: 'time', label: 'Zeitvergleich', icon: 'clock' }
]

// 计算属性
const typeComparisons = computed((): TypeComparison[] => {
  const types = ['Aktien', 'ETFs', 'Anleihen']
  const baseTaxBurden = 15000

  return types.map((type, index) => ({
    type,
    taxBurden: baseTaxBurden * (1 + index * 0.1 - (type === 'ETFs' ? 0.3 : 0)),
    effectiveRate: 0.25 * (1 - (type === 'ETFs' ? 0.3 : 0)),
    netReturn: 85000 + (type === 'ETFs' ? 4500 : 0)
  }))
})

const maxTaxBurden = computed(() => Math.max(...typeComparisons.value.map(t => t.taxBurden)))

const stateComparisons = computed((): StateComparison[] => {
  const states = [
    { name: 'Baden-Württemberg', rate: 0.08 },
    { name: 'Bayern', rate: 0.08 },
    { name: 'Berlin', rate: 0.09 },
    { name: 'Nordrhein-Westfalen', rate: 0.09 },
    { name: 'Hamburg', rate: 0.09 }
  ]

  const baseTax = 12500
  const baseState = states.find(s => s.name === 'Nordrhein-Westfalen')!

  return states.map(state => ({
    name: state.name,
    churchTaxRate: state.rate,
    totalBurden: baseTax * (1 + state.rate),
    difference: baseTax * (state.rate - baseState.rate),
    current: state.name === 'Nordrhein-Westfalen'
  }))
})

const timeComparisons = computed((): TimeComparison[] => {
  const periods = [5, 10, 15, 20, 25]

  return periods.map(years => {
    const grossReturn = investmentParams.initialAmount * Math.pow(1 + investmentParams.expectedReturn / 100, years)
    const taxBurden = grossReturn * 0.2
    const netReturn = grossReturn - taxBurden

    return {
      years,
      grossReturn,
      netReturn,
      taxBurden
    }
  })
})

const maxGrossReturn = computed(() => Math.max(...timeComparisons.value.map(t => t.grossReturn)))

const optimizationSummary = computed((): OptimizationSummary => {
  const totalSavings = appliedOptimizations.value.reduce((sum, opt) => sum + opt.potentialSaving, 0)
  const exemptionUsed = 850
  const exemptionUtilization = exemptionUsed / 1000
  const effectiveTaxRate = 0.18
  const implementationTime = '2-4 Wochen'

  return {
    totalSavings,
    exemptionUtilization,
    exemptionUsed,
    effectiveTaxRate,
    implementationTime
  }
})

// 方法
const generateInvestmentData = () => {
  const yearlyReturns = []
  let currentValue = investmentParams.initialAmount

  for (let i = 0; i < investmentParams.years; i++) {
    const yearlyReturn = currentValue * (investmentParams.expectedReturn / 100)
    const yearlyContribution = investmentParams.monthlyContribution * 12
    currentValue += yearlyReturn + yearlyContribution
    yearlyReturns.push(yearlyReturn)
  }

  investmentData.value = {
    yearlyReturns,
    totalReturn: currentValue - investmentParams.initialAmount,
    investmentYears: investmentParams.years
  }
}

const calculateCapitalGainsTax = (capitalGains: number): number => {
  const exemption = Math.min(capitalGains, 1000)
  const taxableAmount = Math.max(0, capitalGains - exemption)
  return taxableAmount * 0.25
}

const calculateChurchTax = (capitalGainsTax: number): number => {
  return capitalGainsTax * 0.09 // 9% Kirchensteuer
}

const updateTaxAnalysis = () => {
  generateInvestmentData()
}

const handleOptimizationApplied = (optimization: any) => {
  appliedOptimizations.value.push({
    ...optimization,
    appliedAt: new Date()
  })
}

const handleTaxConfigChanged = (config: any) => {
  console.log('Tax config changed:', config)
}

const handleCalculationUpdated = (calculations: any[]) => {
  console.log('Tax calculations updated:', calculations.length, 'years')
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE')
}

const exportTaxReport = () => {
  const report = {
    investmentParams,
    appliedOptimizations: appliedOptimizations.value,
    optimizationSummary: optimizationSummary.value,
    typeComparisons: typeComparisons.value,
    stateComparisons: stateComparisons.value,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'steueranalyse-bericht.json'
  a.click()
  URL.revokeObjectURL(url)
}

const scheduleTaxReview = () => {
  alert('Steuerprüfung für das nächste Quartal geplant. Sie erhalten eine Erinnerung.')
}

const shareTaxAnalysis = () => {
  const shareText = `Meine Steueranalyse:
Effektive Steuerrate: ${formatPercentage(optimizationSummary.value.effectiveTaxRate)}
Mögliche Ersparnis: ${formatCurrency(optimizationSummary.value.totalSavings)}
Freibetrag-Nutzung: ${formatPercentage(optimizationSummary.value.exemptionUtilization)}`

  if (navigator.share) {
    navigator.share({
      title: 'Steueranalyse',
      text: shareText
    })
  } else {
    navigator.clipboard.writeText(shareText)
    alert('Analyse in die Zwischenablage kopiert!')
  }
}

const resetTaxAnalysis = () => {
  if (confirm('Möchten Sie wirklich alle Steueroptimierungen zurücksetzen?')) {
    appliedOptimizations.value = []
  }
}

// 生命周期
onMounted(() => {
  updateTaxAnalysis()
})
</script>

<style scoped>
.german-tax-example {
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

/* 投资参数区域 */
.investment-params-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.investment-params-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.params-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
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

.checkbox-wrapper {
  @apply flex items-center gap-2;
}

.checkbox-wrapper input[type="checkbox"] {
  @apply rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

.checkbox-wrapper label {
  @apply text-sm text-gray-700 cursor-pointer;
}

/* 税务分析区域 */
.tax-analysis-section {
  @apply space-y-6;
}

/* 税务对比区域 */
.tax-comparison-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.tax-comparison-section h2 {
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

/* 类型对比 */
.types-comparison {
  @apply space-y-6;
}

.comparison-chart {
  @apply space-y-4;
}

.chart-header {
  @apply flex items-center justify-between;
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

.legend-color.stocks {
  @apply bg-red-500;
}

.legend-color.etf {
  @apply bg-blue-500;
}

.legend-color.bonds {
  @apply bg-green-500;
}

.legend-item span {
  @apply text-sm text-gray-600;
}

.comparison-bars {
  @apply flex items-end justify-center gap-8 h-64;
}

.comparison-bar-group {
  @apply flex flex-col items-center gap-2;
}

.comparison-label {
  @apply text-sm font-medium text-gray-700 mb-2;
}

.comparison-bar-container {
  @apply relative w-20 h-48 bg-gray-200 rounded-t-lg overflow-hidden;
}

.comparison-bar {
  @apply absolute bottom-0 w-full rounded-t-lg transition-all duration-500;
}

.comparison-bar.aktien {
  @apply bg-gradient-to-t from-red-400 to-red-500;
}

.comparison-bar.etfs {
  @apply bg-gradient-to-t from-blue-400 to-blue-500;
}

.comparison-bar.anleihen {
  @apply bg-gradient-to-t from-green-400 to-green-500;
}

.bar-value {
  @apply text-xs font-semibold text-white transform rotate-90 whitespace-nowrap;
  @apply absolute bottom-2 left-1/2 transform -translate-x-1/2;
}

.comparison-details {
  @apply space-y-1 text-center;
}

.detail-item {
  @apply flex justify-between text-xs;
}

.detail-label {
  @apply text-gray-600;
}

.detail-value {
  @apply font-semibold text-gray-900;
}

.detail-value.positive {
  @apply text-green-600;
}

/* 州对比 */
.states-comparison {
  @apply space-y-4;
}

.states-table {
  @apply overflow-x-auto;
}

.table-header {
  @apply grid grid-cols-4 gap-4 p-3 bg-gray-100 rounded-t-lg text-sm font-semibold text-gray-700;
}

.table-row {
  @apply grid grid-cols-4 gap-4 p-3 border-b border-gray-200 text-sm;
  @apply hover:bg-gray-50 transition-colors;
}

.table-row.current {
  @apply bg-blue-50 border-blue-200;
}

.state-name {
  @apply font-semibold text-gray-900;
}

.church-tax {
  @apply text-center font-mono text-gray-700;
}

.total-burden {
  @apply text-right font-mono text-gray-900;
}

.difference {
  @apply text-right font-mono font-semibold;
}

.difference.positive {
  @apply text-green-600;
}

.difference.negative {
  @apply text-red-600;
}

/* 时间对比 */
.time-comparison {
  @apply space-y-4;
}

.time-chart {
  @apply space-y-4;
}

.time-bars {
  @apply flex items-end justify-center gap-6 h-64;
}

.time-bar-group {
  @apply flex flex-col items-center gap-2;
}

.time-label {
  @apply text-sm font-medium text-gray-700 mb-2;
}

.time-metrics {
  @apply flex gap-2 h-48;
}

.metric-bar {
  @apply relative w-12 bg-gray-200 rounded-t-lg overflow-hidden;
}

.metric-bar.gross .bar-fill {
  @apply bg-gradient-to-t from-blue-400 to-blue-500;
}

.metric-bar.net .bar-fill {
  @apply bg-gradient-to-t from-green-400 to-green-500;
}

.bar-fill {
  @apply absolute bottom-0 w-full transition-all duration-500;
}

.bar-label {
  @apply absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600;
}

.time-details {
  @apply space-y-1 text-center;
}

.time-value {
  @apply text-xs font-semibold;
}

.time-value.gross {
  @apply text-blue-600;
}

.time-value.net {
  @apply text-green-600;
}

.tax-impact {
  @apply text-xs font-medium text-red-600;
}

/* 优化摘要区域 */
.optimization-summary-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.optimization-summary-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.optimization-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.optimization-card {
  @apply flex items-center gap-4 p-4 rounded-lg border;
}

.optimization-card.primary {
  @apply bg-red-50 border-red-200;
}

.optimization-card.success {
  @apply bg-green-50 border-green-200;
}

.optimization-card.info {
  @apply bg-blue-50 border-blue-200;
}

.optimization-card.warning {
  @apply bg-yellow-50 border-yellow-200;
}

.card-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center;
}

.optimization-card.primary .card-icon {
  @apply bg-red-100 text-red-600;
}

.optimization-card.success .card-icon {
  @apply bg-green-100 text-green-600;
}

.optimization-card.info .card-icon {
  @apply bg-blue-100 text-blue-600;
}

.optimization-card.warning .card-icon {
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

/* 应用的优化措施 */
.applied-optimizations-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.applied-optimizations-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.applied-optimizations-list {
  @apply space-y-4;
}

.applied-optimization-item {
  @apply border border-green-200 bg-green-50 rounded-lg p-4;
}

.optimization-header {
  @apply flex items-start gap-4 mb-3;
}

.optimization-icon {
  @apply w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center;
}

.optimization-info {
  @apply flex-1;
}

.optimization-info h4 {
  @apply font-semibold text-gray-900 mb-1;
}

.optimization-info p {
  @apply text-sm text-gray-600;
}

.optimization-savings {
  @apply text-right;
}

.savings-label {
  @apply text-sm text-gray-600;
}

.savings-amount {
  @apply block font-bold text-green-600;
}

.optimization-status {
  @apply flex items-center justify-between;
}

.status-indicator {
  @apply flex items-center gap-2 px-3 py-1 rounded-full text-sm;
}

.status-indicator.applied {
  @apply bg-green-100 text-green-800;
}

.applied-date {
  @apply text-sm text-gray-500;
}

/* 税务计算器工具 */
.tax-calculator-tools {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.tax-calculator-tools h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.tools-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.tool-card {
  @apply flex flex-col items-center text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200;
}

.tool-icon {
  @apply w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4;
}

.tool-content {
  @apply flex-1 w-full;
}

.tool-content h4 {
  @apply font-semibold text-gray-900 mb-2;
}

.tool-content p {
  @apply text-sm text-gray-600 mb-4;
}

.tool-input {
  @apply space-y-3;
}

.tool-input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.tool-result {
  @apply flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200;
}

.result-label {
  @apply text-sm text-gray-600;
}

.result-value {
  @apply text-sm font-bold text-blue-600;
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
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.action-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .params-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .optimization-cards {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .tools-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .comparison-bars {
    @apply gap-4;
  }

  .time-bars {
    @apply gap-4;
  }
}

@media (max-width: 768px) {
  .german-tax-example {
    @apply p-4;
  }

  .example-header h1 {
    @apply text-2xl;
  }

  .params-grid {
    @apply grid-cols-1;
  }

  .comparison-tabs {
    @apply flex-wrap;
  }

  .tab-button {
    @apply flex-1 justify-center;
  }

  .table-header,
  .table-row {
    @apply grid-cols-2 gap-2 text-xs;
  }

  .table-header span:nth-child(n+3),
  .table-row span:nth-child(n+3) {
    @apply hidden;
  }

  .comparison-bars {
    @apply gap-2 h-48;
  }

  .comparison-bar-container {
    @apply w-16 h-32;
  }

  .time-bars {
    @apply gap-2 h-48;
  }

  .time-metrics {
    @apply h-32;
  }

  .metric-bar {
    @apply w-8;
  }

  .optimization-cards {
    @apply grid-cols-1;
  }

  .optimization-card {
    @apply flex-col text-center;
  }

  .card-icon {
    @apply mb-3;
  }

  .optimization-header {
    @apply flex-col items-center gap-2;
  }

  .optimization-savings {
    @apply text-center;
  }

  .optimization-status {
    @apply flex-col gap-2;
  }

  .tools-grid {
    @apply grid-cols-1;
  }

  .action-buttons {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .german-tax-example {
    @apply bg-gray-900;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .investment-params-section,
  .tax-comparison-section,
  .optimization-summary-section,
  .applied-optimizations-section,
  .tax-calculator-tools,
  .actions-section {
    @apply bg-gray-800 border-gray-700;
  }

  .investment-params-section h2,
  .tax-comparison-section h2,
  .optimization-summary-section h2,
  .applied-optimizations-section h2,
  .tax-calculator-tools h2 {
    @apply text-gray-100;
  }

  .param-group label {
    @apply text-gray-300;
  }

  .param-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .checkbox-wrapper label {
    @apply text-gray-300;
  }

  .tab-button {
    @apply text-gray-400 hover:text-gray-200;
  }

  .tab-button.active {
    @apply text-blue-400 border-blue-400;
  }

  .chart-header h3 {
    @apply text-gray-200;
  }

  .legend-item span {
    @apply text-gray-400;
  }

  .comparison-label,
  .time-label {
    @apply text-gray-300;
  }

  .comparison-bar-container,
  .metric-bar {
    @apply bg-gray-700;
  }

  .detail-label {
    @apply text-gray-400;
  }

  .detail-value {
    @apply text-gray-200;
  }

  .table-header {
    @apply bg-gray-700 text-gray-300;
  }

  .table-row {
    @apply border-gray-700 hover:bg-gray-700;
  }

  .table-row.current {
    @apply bg-blue-900 border-blue-700;
  }

  .state-name {
    @apply text-gray-200;
  }

  .church-tax,
  .total-burden {
    @apply text-gray-300;
  }

  .optimization-card {
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

  .applied-optimization-item {
    @apply bg-green-900 border-green-700;
  }

  .optimization-info h4 {
    @apply text-gray-100;
  }

  .optimization-info p {
    @apply text-gray-300;
  }

  .status-indicator.applied {
    @apply bg-green-900 text-green-300;
  }

  .applied-date {
    @apply text-gray-400;
  }

  .tool-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
  }

  .tool-content h4 {
    @apply text-gray-100;
  }

  .tool-content p {
    @apply text-gray-300;
  }

  .tool-input-field {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .tool-result {
    @apply bg-gray-800 border-gray-600;
  }

  .result-label {
    @apply text-gray-300;
  }

  .result-value {
    @apply text-blue-400;
  }

  .action-button.secondary {
    @apply bg-gray-600 text-gray-200 hover:bg-gray-500;
  }
}
</style>
