<!--
  税收影响可视化示例
  展示税收对投资收益影响的完整可视化功能
-->

<template>
  <div class="tax-visualization-example">
    <div class="example-header">
      <h1>Steuerauswirkungen Visualisierung</h1>
      <p>Verstehen Sie, wie sich Steuern auf Ihre Investitionsrendite auswirken</p>
    </div>

    <!-- 快速场景选择 -->
    <div class="scenario-selector">
      <h2>Szenario auswählen</h2>
      <div class="scenario-grid">
        <div
          v-for="scenario in predefinedScenarios"
          :key="scenario.id"
          class="scenario-card"
          :class="{ 'active': selectedScenario === scenario.id }"
          @click="loadScenario(scenario.id)"
        >
          <div class="scenario-icon">
            <Icon :name="scenario.icon" size="24" />
          </div>
          <h3>{{ scenario.name }}</h3>
          <p>{{ scenario.description }}</p>
          <div class="scenario-stats">
            <span>{{ formatCurrency(scenario.investment) }}</span>
            <span>{{ scenario.years }} Jahre</span>
            <span>{{ formatPercentage(scenario.expectedReturn) }} p.a.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 投资参数配置 -->
    <div class="investment-config">
      <h2>Investitionsparameter</h2>
      <div class="config-grid">
        <div class="config-group">
          <label>Investitionsbetrag (€)</label>
          <input
            v-model.number="investmentParams.amount"
            type="number"
            min="1000"
            step="1000"
            class="config-input"
            @input="calculateTaxImpact"
          />
        </div>

        <div class="config-group">
          <label>Erwartete jährliche Rendite (%)</label>
          <input
            v-model.number="investmentParams.annualReturn"
            type="number"
            min="0"
            max="20"
            step="0.5"
            class="config-input"
            @input="calculateTaxImpact"
          />
        </div>

        <div class="config-group">
          <label>Anlagedauer (Jahre)</label>
          <input
            v-model.number="investmentParams.years"
            type="number"
            min="1"
            max="50"
            step="1"
            class="config-input"
            @input="calculateTaxImpact"
          />
        </div>

        <div class="config-group">
          <label>Bundesland</label>
          <select v-model="taxConfig.state" @change="calculateTaxImpact" class="config-select">
            <option value="BY">Bayern</option>
            <option value="BW">Baden-Württemberg</option>
            <option value="NW">Nordrhein-Westfalen</option>
            <option value="HE">Hessen</option>
            <option value="BE">Berlin</option>
          </select>
        </div>
      </div>

      <div class="tax-options">
        <label class="checkbox-label">
          <input
            v-model="taxConfig.hasChurchTax"
            type="checkbox"
            @change="calculateTaxImpact"
          />
          <span>Kirchensteuerpflichtig</span>
        </label>

        <label class="checkbox-label">
          <input
            v-model="taxConfig.useFreistellungsauftrag"
            type="checkbox"
            @change="calculateTaxImpact"
          />
          <span>Freistellungsauftrag nutzen</span>
        </label>

        <label class="checkbox-label">
          <input
            v-model="taxConfig.useETFTeilfreistellung"
            type="checkbox"
            @change="calculateTaxImpact"
          />
          <span>ETF Teilfreistellung (30%)</span>
        </label>
      </div>
    </div>

    <!-- 税前税后对比 -->
    <div class="comparison-section">
      <h2>Steuervergleich</h2>
      <TaxComparisonWidget
        :gross-return="calculationResults.grossReturn"
        :net-return="calculationResults.netReturn"
        :total-tax="calculationResults.totalTax"
        :tax-savings="calculationResults.taxSavings"
        :abgeltungssteuer="calculationResults.abgeltungssteuer"
        :solidaritaetszuschlag="calculationResults.solidaritaetszuschlag"
        :kirchensteuer="calculationResults.kirchensteuer"
      />
    </div>

    <!-- 详细税收影响图表 -->
    <div class="detailed-charts-section">
      <h2>Detaillierte Steueranalyse</h2>
      <TaxImpactChart
        :tax-data="taxChartData"
        :investment-amount="investmentParams.amount"
        :investment-years="investmentParams.years"
        :show-optimizations="true"
      />
    </div>

    <!-- 优化建议 -->
    <div class="optimization-section">
      <h2>Optimierungsempfehlungen</h2>
      <div class="optimization-cards">
        <div
          v-for="(optimization, index) in optimizationSuggestions"
          :key="index"
          class="optimization-card"
          :class="optimization.priority"
        >
          <div class="card-header">
            <div class="card-icon">
              <Icon :name="optimization.icon" size="20" />
            </div>
            <div class="card-title">{{ optimization.title }}</div>
            <div class="card-savings">{{ formatCurrency(optimization.potentialSavings) }}</div>
          </div>
          <div class="card-content">
            <p>{{ optimization.description }}</p>
            <div class="implementation-difficulty">
              <span class="difficulty-label">Umsetzung:</span>
              <div class="difficulty-indicator">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="difficulty-dot"
                  :class="{ 'active': i <= optimization.difficulty }"
                ></div>
              </div>
              <span class="difficulty-text">{{ getDifficultyText(optimization.difficulty) }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button @click="applyOptimization(optimization)" class="apply-button">
              Anwenden
            </button>
            <button @click="learnMore(optimization)" class="learn-more-button">
              Mehr erfahren
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 年度税收影响时间线 -->
    <div class="timeline-section">
      <h2>Jährliche Steuerentwicklung</h2>
      <div class="timeline-chart">
        <canvas ref="timelineCanvas" class="timeline-canvas"></canvas>
      </div>
      <div class="timeline-controls">
        <div class="control-group">
          <label>Darstellung:</label>
          <select v-model="timelineView" @change="updateTimelineChart">
            <option value="absolute">Absolute Werte</option>
            <option value="percentage">Prozentuale Anteile</option>
            <option value="cumulative">Kumulierte Werte</option>
          </select>
        </div>
        <div class="control-group">
          <label class="checkbox-label">
            <input
              v-model="showInflationAdjusted"
              type="checkbox"
              @change="updateTimelineChart"
            />
            <span>Inflationsbereinigt</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 税收影响摘要 -->
    <div class="impact-summary">
      <h2>Steuerauswirkungen Zusammenfassung</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">
            <Icon name="trending-down" size="24" />
          </div>
          <div class="summary-content">
            <div class="summary-label">Steuerliche Belastung</div>
            <div class="summary-value">{{ formatPercentage(calculationResults.effectiveTaxRate) }}</div>
            <div class="summary-detail">Ihrer Gesamtrendite</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">
            <Icon name="shield" size="24" />
          </div>
          <div class="summary-content">
            <div class="summary-label">Mögliche Ersparnis</div>
            <div class="summary-value">{{ formatCurrency(calculationResults.maxPossibleSavings) }}</div>
            <div class="summary-detail">Durch Optimierung</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">
            <Icon name="calendar" size="24" />
          </div>
          <div class="summary-content">
            <div class="summary-label">Jährliche Steuern</div>
            <div class="summary-value">{{ formatCurrency(calculationResults.annualTax) }}</div>
            <div class="summary-detail">Im Durchschnitt</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">
            <Icon name="target" size="24" />
          </div>
          <div class="summary-content">
            <div class="summary-label">Netto-Rendite</div>
            <div class="summary-value">{{ formatPercentage(calculationResults.netAnnualReturn) }}</div>
            <div class="summary-detail">Nach Steuern p.a.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="exportAnalysis" class="action-button primary">
        <Icon name="download" size="16" />
        Analyse exportieren
      </button>
      <button @click="shareAnalysis" class="action-button secondary">
        <Icon name="share-2" size="16" />
        Analyse teilen
      </button>
      <button @click="saveScenario" class="action-button secondary">
        <Icon name="bookmark" size="16" />
        Szenario speichern
      </button>
      <button @click="resetAnalysis" class="action-button secondary">
        <Icon name="refresh-cw" size="16" />
        Zurücksetzen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import Icon from '@/components/ui/BaseIcon.vue'
import TaxComparisonWidget from '@/components/tax/TaxComparisonWidget.vue'
import TaxImpactChart from '@/components/charts/TaxImpactChart.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 注册Chart.js组件
Chart.register(...registerables)

// 接口定义
interface InvestmentParams {
  amount: number
  annualReturn: number
  years: number
}

interface TaxConfig {
  state: string
  hasChurchTax: boolean
  useFreistellungsauftrag: boolean
  useETFTeilfreistellung: boolean
}

interface CalculationResults {
  grossReturn: number
  netReturn: number
  totalTax: number
  taxSavings: number
  abgeltungssteuer: number
  solidaritaetszuschlag: number
  kirchensteuer: number
  effectiveTaxRate: number
  maxPossibleSavings: number
  annualTax: number
  netAnnualReturn: number
}

interface OptimizationSuggestion {
  title: string
  description: string
  potentialSavings: number
  icon: string
  priority: 'high' | 'medium' | 'low'
  difficulty: number
}

// 响应式数据
const selectedScenario = ref('')
const timelineView = ref('absolute')
const showInflationAdjusted = ref(false)
const timelineCanvas = ref<HTMLCanvasElement>()

const investmentParams = reactive<InvestmentParams>({
  amount: 50000,
  annualReturn: 7,
  years: 15
})

const taxConfig = reactive<TaxConfig>({
  state: 'BY',
  hasChurchTax: true,
  useFreistellungsauftrag: true,
  useETFTeilfreistellung: true
})

const calculationResults = reactive<CalculationResults>({
  grossReturn: 0,
  netReturn: 0,
  totalTax: 0,
  taxSavings: 0,
  abgeltungssteuer: 0,
  solidaritaetszuschlag: 0,
  kirchensteuer: 0,
  effectiveTaxRate: 0,
  maxPossibleSavings: 0,
  annualTax: 0,
  netAnnualReturn: 0
})

// 预定义场景
const predefinedScenarios = [
  {
    id: 'conservative',
    name: 'Konservativ',
    description: 'Sicherheitsorientierte Anlage',
    icon: 'shield',
    investment: 25000,
    years: 10,
    expectedReturn: 0.04
  },
  {
    id: 'balanced',
    name: 'Ausgewogen',
    description: 'Ausgewogene Mischung',
    icon: 'pie-chart',
    investment: 50000,
    years: 15,
    expectedReturn: 0.07
  },
  {
    id: 'growth',
    name: 'Wachstum',
    description: 'Wachstumsorientierte Anlage',
    icon: 'trending-up',
    investment: 100000,
    years: 20,
    expectedReturn: 0.09
  }
]

// 计算属性
const taxChartData = computed(() => ({
  grossReturn: calculationResults.grossReturn,
  totalTax: calculationResults.totalTax,
  netReturn: calculationResults.netReturn,
  taxSavings: calculationResults.taxSavings,
  effectiveTaxRate: calculationResults.effectiveTaxRate,
  abgeltungssteuer: calculationResults.abgeltungssteuer,
  solidaritaetszuschlag: calculationResults.solidaritaetszuschlag,
  kirchensteuer: calculationResults.kirchensteuer,
  freistellungsauftragSavings: taxConfig.useFreistellungsauftrag ? 250 : 0,
  etfTeilfreistellungSavings: taxConfig.useETFTeilfreistellung ? 500 : 0
}))

const optimizationSuggestions = computed((): OptimizationSuggestion[] => [
  {
    title: 'Freistellungsauftrag optimieren',
    description: 'Nutzen Sie Ihren jährlichen Freibetrag von 1.000€ vollständig aus.',
    potentialSavings: taxConfig.useFreistellungsauftrag ? 0 : 250,
    icon: 'shield',
    priority: 'high',
    difficulty: 1
  },
  {
    title: 'ETF Teilfreistellung nutzen',
    description: 'Investieren Sie in ETFs mit hoher Teilfreistellung für Steuervorteile.',
    potentialSavings: taxConfig.useETFTeilfreistellung ? 0 : 500,
    icon: 'trending-up',
    priority: 'high',
    difficulty: 2
  },
  {
    title: 'Kirchensteuer optimieren',
    description: 'Prüfen Sie Möglichkeiten zur Kirchensteuer-Optimierung.',
    potentialSavings: taxConfig.hasChurchTax ? calculationResults.kirchensteuer * 0.5 : 0,
    icon: 'home',
    priority: 'medium',
    difficulty: 4
  }
])

// 方法
const loadScenario = (scenarioId: string) => {
  selectedScenario.value = scenarioId
  const scenario = predefinedScenarios.find(s => s.id === scenarioId)
  if (scenario) {
    investmentParams.amount = scenario.investment
    investmentParams.annualReturn = scenario.expectedReturn * 100
    investmentParams.years = scenario.years
    calculateTaxImpact()
  }
}

const calculateTaxImpact = () => {
  // 计算复利增长
  const futureValue = investmentParams.amount * Math.pow(1 + investmentParams.annualReturn / 100, investmentParams.years)
  const grossReturn = futureValue - investmentParams.amount

  // 计算各种税收
  let taxableAmount = grossReturn

  // ETF Teilfreistellung
  if (taxConfig.useETFTeilfreistellung) {
    taxableAmount = grossReturn * 0.7 // 30% Teilfreistellung
  }

  // Freistellungsauftrag
  if (taxConfig.useFreistellungsauftrag) {
    taxableAmount = Math.max(0, taxableAmount - 1000)
  }

  // Abgeltungssteuer
  const abgeltungssteuer = taxableAmount * 0.25

  // Solidaritätszuschlag
  const solidaritaetszuschlag = abgeltungssteuer * 0.055

  // Kirchensteuer
  const kirchensteuer = taxConfig.hasChurchTax ? abgeltungssteuer * 0.09 : 0

  const totalTax = abgeltungssteuer + solidaritaetszuschlag + kirchensteuer
  const netReturn = grossReturn - totalTax

  // 计算节省的税收
  const taxWithoutOptimizations = grossReturn * 0.25 * 1.055 * (taxConfig.hasChurchTax ? 1.09 : 1)
  const taxSavings = taxWithoutOptimizations - totalTax

  // 更新计算结果
  Object.assign(calculationResults, {
    grossReturn,
    netReturn,
    totalTax,
    taxSavings,
    abgeltungssteuer,
    solidaritaetszuschlag,
    kirchensteuer,
    effectiveTaxRate: grossReturn > 0 ? totalTax / grossReturn : 0,
    maxPossibleSavings: taxSavings,
    annualTax: totalTax / investmentParams.years,
    netAnnualReturn: Math.pow(netReturn / investmentParams.amount + 1, 1 / investmentParams.years) - 1
  })
}

const getDifficultyText = (difficulty: number): string => {
  const texts = ['', 'Sehr einfach', 'Einfach', 'Mittel', 'Schwer', 'Sehr schwer']
  return texts[difficulty] || 'Unbekannt'
}

const applyOptimization = (optimization: OptimizationSuggestion) => {
  // 应用优化建议的逻辑
  console.log('Applying optimization:', optimization.title)
}

const learnMore = (optimization: OptimizationSuggestion) => {
  // 显示更多信息的逻辑
  console.log('Learn more about:', optimization.title)
}

const updateTimelineChart = () => {
  // 更新时间线图表的逻辑
  console.log('Updating timeline chart...')
}

const exportAnalysis = () => {
  const data = {
    investmentParams,
    taxConfig,
    calculationResults,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'steueranalyse.json'
  a.click()
  URL.revokeObjectURL(url)
}

const shareAnalysis = () => {
  const shareText = `Steueranalyse:
Investition: ${formatCurrency(investmentParams.amount)}
Netto-Rendite: ${formatPercentage(calculationResults.netAnnualReturn)} p.a.
Steuerersparnis: ${formatCurrency(calculationResults.taxSavings)}`

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

const saveScenario = () => {
  // 保存场景的逻辑
  console.log('Saving scenario...')
}

const resetAnalysis = () => {
  selectedScenario.value = ''
  Object.assign(investmentParams, { amount: 50000, annualReturn: 7, years: 15 })
  Object.assign(taxConfig, { state: 'BY', hasChurchTax: true, useFreistellungsauftrag: true, useETFTeilfreistellung: true })
  calculateTaxImpact()
}

// 生命周期
onMounted(() => {
  calculateTaxImpact()
  loadScenario('balanced')
})
</script>

<style scoped>
.tax-visualization-example {
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

/* 场景选择器 */
.scenario-selector {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.scenario-selector h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.scenario-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.scenario-card {
  @apply p-4 border border-gray-200 rounded-lg cursor-pointer;
  @apply hover:border-blue-300 hover:shadow-md transition-all;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.scenario-card.active {
  @apply border-blue-500 bg-blue-50 shadow-md;
}

.scenario-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3;
}

.scenario-card.active .scenario-icon {
  @apply bg-blue-200 text-blue-700;
}

.scenario-card h3 {
  @apply font-semibold text-gray-900 mb-2;
}

.scenario-card p {
  @apply text-sm text-gray-600 mb-3;
}

.scenario-stats {
  @apply flex justify-between text-xs text-gray-500;
}

/* 投资配置 */
.investment-config {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.investment-config h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.config-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6;
}

.config-group {
  @apply space-y-2;
}

.config-group label {
  @apply block text-sm font-medium text-gray-700;
}

.config-input,
.config-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.tax-options {
  @apply flex flex-wrap gap-6;
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

/* 对比和图表区域 */
.comparison-section,
.detailed-charts-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.comparison-section h2,
.detailed-charts-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

/* 优化建议 */
.optimization-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.optimization-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.optimization-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.optimization-card {
  @apply border rounded-lg p-4;
}

.optimization-card.high {
  @apply border-red-300 bg-red-50;
}

.optimization-card.medium {
  @apply border-yellow-300 bg-yellow-50;
}

.optimization-card.low {
  @apply border-blue-300 bg-blue-50;
}

.card-header {
  @apply flex items-center justify-between mb-3;
}

.card-icon {
  @apply w-10 h-10 rounded-full flex items-center justify-center;
}

.optimization-card.high .card-icon {
  @apply bg-red-100 text-red-600;
}

.optimization-card.medium .card-icon {
  @apply bg-yellow-100 text-yellow-600;
}

.optimization-card.low .card-icon {
  @apply bg-blue-100 text-blue-600;
}

.card-title {
  @apply flex-1 font-semibold text-gray-900 mx-3;
}

.card-savings {
  @apply font-bold text-green-600;
}

.card-content {
  @apply mb-4;
}

.card-content p {
  @apply text-sm text-gray-600 mb-3;
}

.implementation-difficulty {
  @apply flex items-center gap-2 text-sm;
}

.difficulty-label {
  @apply text-gray-600;
}

.difficulty-indicator {
  @apply flex gap-1;
}

.difficulty-dot {
  @apply w-2 h-2 bg-gray-300 rounded-full;
}

.difficulty-dot.active {
  @apply bg-orange-500;
}

.difficulty-text {
  @apply text-xs text-gray-500;
}

.card-actions {
  @apply flex gap-2;
}

.apply-button {
  @apply flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.learn-more-button {
  @apply flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500;
}

/* 时间线区域 */
.timeline-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.timeline-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.timeline-chart {
  @apply mb-6;
}

.timeline-canvas {
  @apply w-full h-80;
}

.timeline-controls {
  @apply flex flex-wrap gap-4 items-center;
}

.control-group {
  @apply flex items-center gap-2;
}

.control-group label {
  @apply text-sm font-medium text-gray-700;
}

.control-group select {
  @apply px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

/* 影响摘要 */
.impact-summary {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.impact-summary h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.summary-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.summary-card {
  @apply flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200;
}

.summary-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.summary-content {
  @apply flex-1;
}

.summary-label {
  @apply text-sm text-gray-600;
}

.summary-value {
  @apply text-lg font-bold text-gray-900;
}

.summary-detail {
  @apply text-xs text-gray-500;
}

/* 操作按钮 */
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .scenario-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .config-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .optimization-cards {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .summary-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }
}

@media (max-width: 768px) {
  .scenario-grid {
    @apply grid-cols-1;
  }

  .config-grid {
    @apply grid-cols-1;
  }

  .tax-options {
    @apply flex-col gap-3;
  }

  .optimization-cards {
    @apply grid-cols-1;
  }

  .summary-grid {
    @apply grid-cols-1;
  }

  .summary-card {
    @apply flex-col text-center;
  }

  .summary-icon {
    @apply mb-3;
  }

  .timeline-controls {
    @apply flex-col items-start gap-2;
  }

  .action-buttons {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }

  .card-actions {
    @apply flex-col;
  }

  .apply-button,
  .learn-more-button {
    @apply w-full;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .scenario-selector,
  .investment-config,
  .comparison-section,
  .detailed-charts-section,
  .optimization-section,
  .timeline-section,
  .impact-summary {
    @apply bg-gray-800 border-gray-700;
  }

  .scenario-selector h2,
  .investment-config h2,
  .comparison-section h2,
  .detailed-charts-section h2,
  .optimization-section h2,
  .timeline-section h2,
  .impact-summary h2 {
    @apply text-gray-100;
  }

  .scenario-card {
    @apply bg-gray-700 border-gray-600;
  }

  .scenario-card.active {
    @apply bg-blue-900 border-blue-600;
  }

  .scenario-card h3 {
    @apply text-gray-100;
  }

  .scenario-card p {
    @apply text-gray-300;
  }

  .scenario-stats {
    @apply text-gray-400;
  }

  .config-group label {
    @apply text-gray-300;
  }

  .config-input,
  .config-select,
  .control-group select {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .checkbox-label span {
    @apply text-gray-300;
  }

  .optimization-card {
    @apply bg-gray-700 border-gray-600;
  }

  .card-title {
    @apply text-gray-100;
  }

  .card-content p {
    @apply text-gray-300;
  }

  .difficulty-label {
    @apply text-gray-300;
  }

  .difficulty-text {
    @apply text-gray-400;
  }

  .summary-card {
    @apply bg-gray-700 border-gray-600;
  }

  .summary-label {
    @apply text-gray-300;
  }

  .summary-value {
    @apply text-gray-100;
  }

  .summary-detail {
    @apply text-gray-400;
  }

  .control-group label {
    @apply text-gray-300;
  }
}
</style>
