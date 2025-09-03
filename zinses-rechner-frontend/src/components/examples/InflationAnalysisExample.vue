<!--
  通胀影响分析示例组件
  展示通胀影响分析系统的完整功能和交互
-->

<template>
  <div class="inflation-analysis-example">
    <div class="example-header">
      <h1>Inflationsanalyse für Kapitalanlagen</h1>
      <p>Verstehen Sie die Auswirkungen der Inflation auf Ihre Investitionen und Kaufkraft</p>
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
            @input="updateInflationAnalysis"
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
            @input="updateInflationAnalysis"
          />
        </div>

        <div class="param-group">
          <label>Erwartete Rendite (%)</label>
          <input
            v-model.number="investmentParams.expectedReturn"
            type="number"
            min="0"
            max="20"
            step="0.1"
            class="param-input"
            @input="updateInflationAnalysis"
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
            @input="updateInflationAnalysis"
          />
        </div>
      </div>
    </div>

    <!-- 通胀分析引擎 -->
    <div class="inflation-analysis-section">
      <InflationAnalysisEngine
        :investment-data="investmentData"
        @strategy-applied="handleStrategyApplied"
        @config-changed="handleConfigChanged"
        @analysis-updated="handleAnalysisUpdated"
      />
    </div>

    <!-- 通胀影响对比 -->
    <div class="inflation-impact-comparison">
      <h2>Inflationsauswirkungen im Vergleich</h2>
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
        <!-- 不同通胀率对比 -->
        <div v-if="activeComparisonTab === 'rates'" class="rates-comparison">
          <div class="comparison-chart">
            <div class="chart-header">
              <h3>Kaufkraftverlust bei verschiedenen Inflationsraten</h3>
            </div>

            <div class="rates-bars">
              <div
                v-for="(rate, index) in inflationRateComparisons"
                :key="index"
                class="rate-bar-group"
              >
                <div class="rate-label">{{ formatPercentage(rate.rate) }}</div>
                <div class="rate-bar-container">
                  <div class="rate-bar" :style="{ height: `${rate.lossPercentage}%` }">
                    <span class="bar-value">{{ formatPercentage(rate.lossPercentage / 100) }}</span>
                  </div>
                </div>
                <div class="rate-details">
                  <div class="detail-item">
                    <span class="detail-label">Realer Wert:</span>
                    <span class="detail-value">{{ formatCurrency(rate.realValue) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Verlust:</span>
                    <span class="detail-value negative">{{ formatCurrency(rate.loss) }}</span>
                  </div>
                </div>
              </div>
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
                  <div class="metric-bar nominal">
                    <div class="bar-fill" :style="{ height: `${(period.nominalValue / maxNominalValue) * 100}%` }"></div>
                    <span class="bar-label">Nominal</span>
                  </div>
                  <div class="metric-bar real">
                    <div class="bar-fill" :style="{ height: `${(period.realValue / maxNominalValue) * 100}%` }"></div>
                    <span class="bar-label">Real</span>
                  </div>
                </div>
                <div class="time-details">
                  <div class="time-value nominal">{{ formatCurrency(period.nominalValue) }}</div>
                  <div class="time-value real">{{ formatCurrency(period.realValue) }}</div>
                  <div class="purchasing-power-loss">-{{ formatPercentage(period.purchasingPowerLoss) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 保护策略对比 -->
        <div v-if="activeComparisonTab === 'protection'" class="protection-comparison">
          <div class="protection-strategies">
            <div
              v-for="(strategy, index) in protectionStrategies"
              :key="index"
              class="protection-strategy-card"
              :class="strategy.effectiveness"
            >
              <div class="strategy-header">
                <div class="strategy-icon">
                  <Icon :name="strategy.icon" size="md" />
                </div>
                <div class="strategy-info">
                  <h4>{{ strategy.name }}</h4>
                  <p>{{ strategy.description }}</p>
                </div>
                <div class="effectiveness-score">
                  <div class="score-circle" :class="strategy.effectiveness">
                    <span>{{ strategy.score }}</span>
                  </div>
                  <div class="score-label">Schutz-Score</div>
                </div>
              </div>

              <div class="strategy-metrics">
                <div class="metric-row">
                  <span class="metric-label">Inflationsschutz:</span>
                  <div class="metric-bar">
                    <div class="metric-fill" :style="{ width: `${strategy.protectionLevel}%` }"></div>
                  </div>
                  <span class="metric-value">{{ strategy.protectionLevel }}%</span>
                </div>

                <div class="metric-row">
                  <span class="metric-label">Historische Performance:</span>
                  <span class="metric-value" :class="strategy.performance > 0 ? 'positive' : 'negative'">
                    {{ strategy.performance > 0 ? '+' : '' }}{{ formatPercentage(strategy.performance) }}
                  </span>
                </div>

                <div class="metric-row">
                  <span class="metric-label">Volatilität:</span>
                  <span class="metric-value">{{ formatPercentage(strategy.volatility) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 应用的策略 -->
    <div v-if="appliedStrategies.length > 0" class="applied-strategies-section">
      <h2>Angewendete Inflationsschutz-Strategien</h2>
      <div class="applied-strategies-list">
        <div
          v-for="(strategy, index) in appliedStrategies"
          :key="index"
          class="applied-strategy-item"
        >
          <div class="strategy-header">
            <div class="strategy-icon">
              <Icon :name="strategy.icon" size="md" />
            </div>
            <div class="strategy-info">
              <h4>{{ strategy.title }}</h4>
              <p>{{ strategy.description }}</p>
            </div>
            <div class="strategy-effectiveness">
              <span class="effectiveness-label">Schutz:</span>
              <span class="effectiveness-value">{{ strategy.protectionLevel }}%</span>
            </div>
          </div>

          <div class="strategy-status">
            <div class="status-indicator applied">
              <Icon name="shield" size="sm" />
              <span>Aktiv</span>
            </div>
            <div class="applied-date">
              Seit {{ formatDate(strategy.appliedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通胀保护摘要 -->
    <div class="inflation-protection-summary">
      <h2>Inflationsschutz-Zusammenfassung</h2>
      <div class="summary-cards">
        <div class="summary-card primary">
          <div class="card-icon">
            <Icon name="shield" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Gesamtschutz-Level</div>
            <div class="card-value">{{ formatPercentage(protectionSummary.totalProtection) }}</div>
            <div class="card-detail">Durch {{ appliedStrategies.length }} Strategien</div>
          </div>
        </div>

        <div class="summary-card success">
          <div class="card-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Geschützte Kaufkraft</div>
            <div class="card-value">{{ formatCurrency(protectionSummary.protectedValue) }}</div>
            <div class="card-detail">Von {{ formatCurrency(protectionSummary.totalValue) }}</div>
          </div>
        </div>

        <div class="summary-card info">
          <div class="card-icon">
            <Icon name="target" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Verbleibendes Risiko</div>
            <div class="card-value">{{ formatPercentage(protectionSummary.remainingRisk) }}</div>
            <div class="card-detail">Ungeschützter Anteil</div>
          </div>
        </div>

        <div class="summary-card warning">
          <div class="card-icon">
            <Icon name="alert-triangle" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Empfohlene Maßnahmen</div>
            <div class="card-value">{{ protectionSummary.recommendedActions }}</div>
            <div class="card-detail">Weitere Optimierungen</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通胀计算器工具 -->
    <div class="inflation-calculator-tools">
      <h2>Inflations-Rechner</h2>
      <div class="tools-grid">
        <div class="tool-card">
          <div class="tool-icon">
            <Icon name="calculator" size="lg" />
          </div>
          <div class="tool-content">
            <h4>Kaufkraft-Rechner</h4>
            <p>Berechnen Sie den realen Wert Ihres Geldes</p>
            <div class="tool-inputs">
              <input
                v-model.number="calculatorInputs.amount"
                type="number"
                placeholder="Betrag (€)"
                class="tool-input"
              />
              <input
                v-model.number="calculatorInputs.years"
                type="number"
                placeholder="Jahre"
                class="tool-input"
              />
              <input
                v-model.number="calculatorInputs.inflationRate"
                type="number"
                placeholder="Inflation (%)"
                class="tool-input"
              />
            </div>
            <div class="tool-result">
              <span class="result-label">Realer Wert:</span>
              <span class="result-value">{{ formatCurrency(calculateRealValue()) }}</span>
            </div>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <div class="tool-content">
            <h4>Benötigte Rendite</h4>
            <p>Welche Rendite brauchen Sie zum Inflationsausgleich?</p>
            <div class="tool-inputs">
              <input
                v-model.number="renditeInputs.targetAmount"
                type="number"
                placeholder="Zielwert (€)"
                class="tool-input"
              />
              <input
                v-model.number="renditeInputs.currentAmount"
                type="number"
                placeholder="Aktueller Wert (€)"
                class="tool-input"
              />
              <input
                v-model.number="renditeInputs.years"
                type="number"
                placeholder="Jahre"
                class="tool-input"
              />
            </div>
            <div class="tool-result">
              <span class="result-label">Benötigte Rendite:</span>
              <span class="result-value">{{ formatPercentage(calculateRequiredReturn()) }}</span>
            </div>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-icon">
            <Icon name="clock" size="lg" />
          </div>
          <div class="tool-content">
            <h4>Inflations-Timeline</h4>
            <p>Wann halbiert sich Ihre Kaufkraft?</p>
            <div class="tool-inputs">
              <input
                v-model.number="timelineInputs.inflationRate"
                type="number"
                placeholder="Inflation (%)"
                class="tool-input"
              />
            </div>
            <div class="tool-result">
              <span class="result-label">Halbierung nach:</span>
              <span class="result-value">{{ calculateHalvingTime() }} Jahren</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-section">
      <div class="action-buttons">
        <button @click="exportInflationReport" class="action-button primary">
          <Icon name="download" size="sm" />
          Inflationsbericht exportieren
        </button>
        <button @click="scheduleInflationReview" class="action-button secondary">
          <Icon name="calendar" size="sm" />
          Überprüfung planen
        </button>
        <button @click="shareInflationAnalysis" class="action-button secondary">
          <Icon name="share-2" size="sm" />
          Analyse teilen
        </button>
        <button @click="resetInflationAnalysis" class="action-button secondary">
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
import InflationAnalysisEngine from '@/components/inflation/InflationAnalysisEngine.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface InvestmentParams {
  initialAmount: number
  monthlyContribution: number
  expectedReturn: number
  years: number
}

interface AppliedStrategy {
  id: string
  title: string
  description: string
  icon: string
  protectionLevel: number
  appliedAt: Date
}

interface InflationRateComparison {
  rate: number
  realValue: number
  loss: number
  lossPercentage: number
}

interface TimeComparison {
  years: number
  nominalValue: number
  realValue: number
  purchasingPowerLoss: number
}

interface ProtectionStrategy {
  name: string
  description: string
  icon: string
  effectiveness: 'high' | 'medium' | 'low'
  score: number
  protectionLevel: number
  performance: number
  volatility: number
}

interface ProtectionSummary {
  totalProtection: number
  protectedValue: number
  totalValue: number
  remainingRisk: number
  recommendedActions: number
}

// 响应式数据
const activeComparisonTab = ref('rates')

const investmentParams = reactive<InvestmentParams>({
  initialAmount: 100000,
  monthlyContribution: 500,
  expectedReturn: 6,
  years: 20
})

const calculatorInputs = reactive({
  amount: 10000,
  years: 10,
  inflationRate: 2.5
})

const renditeInputs = reactive({
  targetAmount: 150000,
  currentAmount: 100000,
  years: 10
})

const timelineInputs = reactive({
  inflationRate: 3
})

const appliedStrategies = ref<AppliedStrategy[]>([])
const investmentData = ref<any>({})

// 对比标签
const comparisonTabs = [
  { id: 'rates', label: 'Inflationsraten', icon: 'percent' },
  { id: 'time', label: 'Zeitvergleich', icon: 'clock' },
  { id: 'protection', label: 'Schutzstrategien', icon: 'shield' }
]

// 计算属性
const inflationRateComparisons = computed((): InflationRateComparison[] => {
  const rates = [0.01, 0.02, 0.025, 0.03, 0.04, 0.05]
  const nominalValue = investmentParams.initialAmount
  const years = investmentParams.years

  return rates.map(rate => {
    const realValue = nominalValue / Math.pow(1 + rate, years)
    const loss = nominalValue - realValue
    const lossPercentage = (loss / nominalValue) * 100

    return {
      rate,
      realValue,
      loss,
      lossPercentage
    }
  })
})

const timeComparisons = computed((): TimeComparison[] => {
  const periods = [5, 10, 15, 20, 25, 30]
  const inflationRate = 0.025 // 2.5%
  const nominalValue = investmentParams.initialAmount

  return periods.map(years => {
    const realValue = nominalValue / Math.pow(1 + inflationRate, years)
    const purchasingPowerLoss = 1 - (realValue / nominalValue)

    return {
      years,
      nominalValue,
      realValue,
      purchasingPowerLoss
    }
  })
})

const maxNominalValue = computed(() => Math.max(...timeComparisons.value.map(t => t.nominalValue)))

const protectionStrategies = computed((): ProtectionStrategy[] => [
  {
    name: 'Immobilien',
    description: 'Direktinvestitionen und REITs',
    icon: 'home',
    effectiveness: 'high',
    score: 85,
    protectionLevel: 85,
    performance: 0.067,
    volatility: 0.15
  },
  {
    name: 'Rohstoffe',
    description: 'Gold und Rohstoff-ETFs',
    icon: 'zap',
    effectiveness: 'high',
    score: 80,
    protectionLevel: 80,
    performance: 0.045,
    volatility: 0.25
  },
  {
    name: 'Inflationsanleihen',
    description: 'TIPS und inflationsindexierte Bonds',
    icon: 'shield',
    effectiveness: 'high',
    score: 95,
    protectionLevel: 95,
    performance: 0.025,
    volatility: 0.08
  },
  {
    name: 'Aktien',
    description: 'Dividendenstarke Qualitätsaktien',
    icon: 'trending-up',
    effectiveness: 'medium',
    score: 70,
    protectionLevel: 70,
    performance: 0.085,
    volatility: 0.20
  }
])

const protectionSummary = computed((): ProtectionSummary => {
  const totalValue = investmentParams.initialAmount
  const totalProtection = appliedStrategies.value.length > 0
    ? appliedStrategies.value.reduce((sum, s) => sum + s.protectionLevel, 0) / appliedStrategies.value.length / 100
    : 0
  const protectedValue = totalValue * totalProtection
  const remainingRisk = 1 - totalProtection
  const recommendedActions = Math.max(0, 3 - appliedStrategies.value.length)

  return {
    totalProtection,
    protectedValue,
    totalValue,
    remainingRisk,
    recommendedActions
  }
})

// 方法
const generateInvestmentData = () => {
  const finalAmount = investmentParams.initialAmount * Math.pow(1 + investmentParams.expectedReturn / 100, investmentParams.years)

  investmentData.value = {
    initialAmount: investmentParams.initialAmount,
    finalAmount,
    investmentYears: investmentParams.years,
    yearlyContributions: investmentParams.monthlyContribution * 12
  }
}

const calculateRealValue = (): number => {
  const { amount, years, inflationRate } = calculatorInputs
  if (!amount || !years || inflationRate === undefined) return 0
  return amount / Math.pow(1 + inflationRate / 100, years)
}

const calculateRequiredReturn = (): number => {
  const { targetAmount, currentAmount, years } = renditeInputs
  if (!targetAmount || !currentAmount || !years) return 0
  return Math.pow(targetAmount / currentAmount, 1 / years) - 1
}

const calculateHalvingTime = (): string => {
  const { inflationRate } = timelineInputs
  if (!inflationRate) return '∞'
  const years = Math.log(2) / Math.log(1 + inflationRate / 100)
  return years.toFixed(1)
}

const updateInflationAnalysis = () => {
  generateInvestmentData()
}

const handleStrategyApplied = (strategy: any) => {
  appliedStrategies.value.push({
    ...strategy,
    appliedAt: new Date()
  })
}

const handleConfigChanged = (config: any) => {
  console.log('Inflation config changed:', config)
}

const handleAnalysisUpdated = (data: any) => {
  console.log('Inflation analysis updated:', data)
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE')
}

const exportInflationReport = () => {
  const report = {
    investmentParams,
    appliedStrategies: appliedStrategies.value,
    protectionSummary: protectionSummary.value,
    inflationRateComparisons: inflationRateComparisons.value,
    timeComparisons: timeComparisons.value,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inflationsanalyse-bericht.json'
  a.click()
  URL.revokeObjectURL(url)
}

const scheduleInflationReview = () => {
  alert('Inflationsüberprüfung für das nächste Quartal geplant. Sie erhalten eine Erinnerung.')
}

const shareInflationAnalysis = () => {
  const shareText = `Meine Inflationsanalyse:
Gesamtschutz: ${formatPercentage(protectionSummary.value.totalProtection)}
Geschützte Kaufkraft: ${formatCurrency(protectionSummary.value.protectedValue)}
Angewendete Strategien: ${appliedStrategies.value.length}`

  if (navigator.share) {
    navigator.share({
      title: 'Inflationsanalyse',
      text: shareText
    })
  } else {
    navigator.clipboard.writeText(shareText)
    alert('Analyse in die Zwischenablage kopiert!')
  }
}

const resetInflationAnalysis = () => {
  if (confirm('Möchten Sie wirklich alle Inflationsschutz-Strategien zurücksetzen?')) {
    appliedStrategies.value = []
  }
}

// 生命周期
onMounted(() => {
  updateInflationAnalysis()
})
</script>

<style scoped>
.inflation-analysis-example {
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
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.param-group {
  @apply space-y-2;
}

.param-group label {
  @apply block text-sm font-medium text-gray-700;
}

.param-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent;
}

/* 通胀分析区域 */
.inflation-analysis-section {
  @apply space-y-6;
}

/* 通胀影响对比 */
.inflation-impact-comparison {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.inflation-impact-comparison h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.comparison-tabs {
  @apply flex gap-2 mb-6 border-b border-gray-200;
}

.tab-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium;
  @apply text-gray-600 hover:text-gray-900 border-b-2 border-transparent;
  @apply focus:outline-none focus:ring-2 focus:ring-orange-500;
  @apply transition-colors;
}

.tab-button.active {
  @apply text-orange-600 border-orange-600;
}

.comparison-content {
  @apply space-y-6;
}

/* 通胀率对比 */
.rates-comparison {
  @apply space-y-6;
}

.comparison-chart {
  @apply space-y-4;
}

.chart-header h3 {
  @apply text-lg font-semibold text-gray-800;
}

.rates-bars {
  @apply flex items-end justify-center gap-6 h-64;
}

.rate-bar-group {
  @apply flex flex-col items-center gap-2;
}

.rate-label {
  @apply text-sm font-medium text-gray-700 mb-2;
}

.rate-bar-container {
  @apply relative w-16 h-48 bg-gray-200 rounded-t-lg overflow-hidden;
}

.rate-bar {
  @apply absolute bottom-0 w-full bg-gradient-to-t from-orange-400 to-red-500 rounded-t-lg transition-all duration-500;
}

.bar-value {
  @apply text-xs font-semibold text-white transform rotate-90 whitespace-nowrap;
  @apply absolute bottom-2 left-1/2 transform -translate-x-1/2;
}

.rate-details {
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

.detail-value.negative {
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
  @apply flex items-end justify-center gap-4 h-64;
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

.metric-bar.nominal .bar-fill {
  @apply bg-gradient-to-t from-blue-400 to-blue-500;
}

.metric-bar.real .bar-fill {
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

.time-value.nominal {
  @apply text-blue-600;
}

.time-value.real {
  @apply text-green-600;
}

.purchasing-power-loss {
  @apply text-xs font-medium text-red-600;
}

/* 保护策略对比 */
.protection-comparison {
  @apply space-y-4;
}

.protection-strategies {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.protection-strategy-card {
  @apply border rounded-lg p-6 hover:shadow-lg transition-shadow;
}

.protection-strategy-card.high {
  @apply border-green-300 bg-green-50;
}

.protection-strategy-card.medium {
  @apply border-yellow-300 bg-yellow-50;
}

.protection-strategy-card.low {
  @apply border-red-300 bg-red-50;
}

.strategy-header {
  @apply flex items-start gap-4 mb-4;
}

.strategy-icon {
  @apply w-12 h-12 bg-white rounded-full flex items-center justify-center;
}

.protection-strategy-card.high .strategy-icon {
  @apply bg-green-100 text-green-600;
}

.protection-strategy-card.medium .strategy-icon {
  @apply bg-yellow-100 text-yellow-600;
}

.protection-strategy-card.low .strategy-icon {
  @apply bg-red-100 text-red-600;
}

.strategy-info {
  @apply flex-1;
}

.strategy-info h4 {
  @apply font-semibold text-gray-900 mb-1;
}

.strategy-info p {
  @apply text-sm text-gray-600;
}

.effectiveness-score {
  @apply text-center;
}

.score-circle {
  @apply w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-1;
}

.score-circle.high {
  @apply bg-green-100 text-green-800;
}

.score-circle.medium {
  @apply bg-yellow-100 text-yellow-800;
}

.score-circle.low {
  @apply bg-red-100 text-red-800;
}

.score-label {
  @apply text-xs text-gray-600;
}

.strategy-metrics {
  @apply space-y-3;
}

.metric-row {
  @apply flex items-center gap-3;
}

.metric-label {
  @apply text-sm text-gray-600 min-w-0 flex-shrink-0;
}

.metric-bar {
  @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.metric-fill {
  @apply h-full bg-green-500 transition-all duration-300;
}

.metric-value {
  @apply text-sm font-semibold text-gray-900;
}

.metric-value.positive {
  @apply text-green-600;
}

.metric-value.negative {
  @apply text-red-600;
}

/* 应用的策略 */
.applied-strategies-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.applied-strategies-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.applied-strategies-list {
  @apply space-y-4;
}

.applied-strategy-item {
  @apply border border-green-200 bg-green-50 rounded-lg p-4;
}

.applied-strategy-item .strategy-header {
  @apply flex items-start gap-4 mb-3;
}

.applied-strategy-item .strategy-icon {
  @apply w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center;
}

.applied-strategy-item .strategy-info h4 {
  @apply font-semibold text-gray-900 mb-1;
}

.applied-strategy-item .strategy-info p {
  @apply text-sm text-gray-600;
}

.strategy-effectiveness {
  @apply text-right;
}

.effectiveness-label {
  @apply text-sm text-gray-600;
}

.effectiveness-value {
  @apply block font-bold text-green-600;
}

.strategy-status {
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

/* 通胀保护摘要 */
.inflation-protection-summary {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.inflation-protection-summary h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.summary-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.summary-card {
  @apply flex items-center gap-4 p-4 rounded-lg border;
}

.summary-card.primary {
  @apply bg-orange-50 border-orange-200;
}

.summary-card.success {
  @apply bg-green-50 border-green-200;
}

.summary-card.info {
  @apply bg-blue-50 border-blue-200;
}

.summary-card.warning {
  @apply bg-yellow-50 border-yellow-200;
}

.card-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center;
}

.summary-card.primary .card-icon {
  @apply bg-orange-100 text-orange-600;
}

.summary-card.success .card-icon {
  @apply bg-green-100 text-green-600;
}

.summary-card.info .card-icon {
  @apply bg-blue-100 text-blue-600;
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

/* 通胀计算器工具 */
.inflation-calculator-tools {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.inflation-calculator-tools h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.tools-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.tool-card {
  @apply flex flex-col items-center text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200;
}

.tool-icon {
  @apply w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4;
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

.tool-inputs {
  @apply space-y-2 mb-4;
}

.tool-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent;
}

.tool-result {
  @apply flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200;
}

.result-label {
  @apply text-sm text-gray-600;
}

.result-value {
  @apply text-sm font-bold text-orange-600;
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
  @apply bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500;
}

.action-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .params-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .summary-cards {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .tools-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .protection-strategies {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .inflation-analysis-example {
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

  .rates-bars {
    @apply gap-3 h-48;
  }

  .rate-bar-container {
    @apply w-12 h-32;
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

  .protection-strategies {
    @apply grid-cols-1;
  }

  .strategy-header {
    @apply flex-col items-center gap-2 text-center;
  }

  .effectiveness-score {
    @apply self-center;
  }

  .applied-strategy-item .strategy-header {
    @apply flex-col items-center gap-2;
  }

  .strategy-effectiveness {
    @apply text-center;
  }

  .strategy-status {
    @apply flex-col gap-2;
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
  .inflation-analysis-example {
    @apply bg-gray-900;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .investment-params-section,
  .inflation-impact-comparison,
  .applied-strategies-section,
  .inflation-protection-summary,
  .inflation-calculator-tools,
  .actions-section {
    @apply bg-gray-800 border-gray-700;
  }

  .investment-params-section h2,
  .inflation-impact-comparison h2,
  .applied-strategies-section h2,
  .inflation-protection-summary h2,
  .inflation-calculator-tools h2 {
    @apply text-gray-100;
  }

  .param-group label {
    @apply text-gray-300;
  }

  .param-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .tab-button {
    @apply text-gray-400 hover:text-gray-200;
  }

  .tab-button.active {
    @apply text-orange-400 border-orange-400;
  }

  .chart-header h3 {
    @apply text-gray-200;
  }

  .rate-label,
  .time-label {
    @apply text-gray-300;
  }

  .rate-bar-container,
  .metric-bar {
    @apply bg-gray-700;
  }

  .detail-label {
    @apply text-gray-400;
  }

  .detail-value {
    @apply text-gray-200;
  }

  .protection-strategy-card {
    @apply bg-gray-700 border-gray-600;
  }

  .strategy-info h4 {
    @apply text-gray-100;
  }

  .strategy-info p {
    @apply text-gray-300;
  }

  .score-label {
    @apply text-gray-400;
  }

  .metric-label {
    @apply text-gray-300;
  }

  .metric-value {
    @apply text-gray-200;
  }

  .applied-strategy-item {
    @apply bg-green-900 border-green-700;
  }

  .applied-strategy-item .strategy-info h4 {
    @apply text-gray-100;
  }

  .applied-strategy-item .strategy-info p {
    @apply text-gray-300;
  }

  .effectiveness-label {
    @apply text-gray-300;
  }

  .status-indicator.applied {
    @apply bg-green-900 text-green-300;
  }

  .applied-date {
    @apply text-gray-400;
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

  .tool-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
  }

  .tool-content h4 {
    @apply text-gray-100;
  }

  .tool-content p {
    @apply text-gray-300;
  }

  .tool-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .tool-result {
    @apply bg-gray-800 border-gray-600;
  }

  .result-label {
    @apply text-gray-300;
  }

  .result-value {
    @apply text-orange-400;
  }

  .action-button.secondary {
    @apply bg-gray-600 text-gray-200 hover:bg-gray-500;
  }
}
</style>
