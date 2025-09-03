<!--
  ETF Teilfreistellung示例
  展示ETF部分免税的完整功能和计算
-->

<template>
  <div class="etf-teilfreistellung-example">
    <div class="example-header">
      <h1>ETF-Teilfreistellung Rechner</h1>
      <p>Berechnen Sie die Steuervorteile verschiedener ETF-Typen in Deutschland</p>
    </div>

    <!-- 快速开始区域 -->
    <div class="quick-start-section">
      <h2>Schnellstart</h2>
      <div class="quick-start-grid">
        <div class="quick-start-card" @click="loadPreset('conservative')">
          <div class="preset-icon">
            <Icon name="shield" size="24" />
          </div>
          <h3>Konservativ</h3>
          <p>Sicherheitsorientierte Anlage</p>
          <div class="preset-details">
            <span>10.000€ • 5% Rendite • 10 Jahre</span>
          </div>
        </div>

        <div class="quick-start-card" @click="loadPreset('balanced')">
          <div class="preset-icon">
            <Icon name="pie-chart" size="24" />
          </div>
          <h3>Ausgewogen</h3>
          <p>Ausgewogene Mischung</p>
          <div class="preset-details">
            <span>25.000€ • 7% Rendite • 15 Jahre</span>
          </div>
        </div>

        <div class="quick-start-card" @click="loadPreset('growth')">
          <div class="preset-icon">
            <Icon name="trending-up" size="24" />
          </div>
          <h3>Wachstum</h3>
          <p>Wachstumsorientierte Anlage</p>
          <div class="preset-details">
            <span>50.000€ • 9% Rendite • 20 Jahre</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ETF类型选择 -->
    <div class="etf-selection-section">
      <h2>ETF-Typ auswählen</h2>
      <ETFTypeSelector
        v-model="selectedETFType"
        :show-info="true"
        :allow-custom="true"
        @etf-selected="handleETFSelected"
      />
    </div>

    <!-- 投资参数配置 -->
    <div class="investment-config-section">
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
            @input="calculateResults"
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
            @input="calculateResults"
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
            @input="calculateResults"
          />
        </div>

        <div class="config-group">
          <label>Monatliche Sparrate (€)</label>
          <input
            v-model.number="investmentParams.monthlyContribution"
            type="number"
            min="0"
            step="50"
            class="config-input"
            @input="calculateResults"
          />
        </div>
      </div>
    </div>

    <!-- 计算结果展示 -->
    <div v-if="calculationResults" class="results-section">
      <h2>Berechnungsergebnisse</h2>

      <!-- 主要指标 -->
      <div class="main-metrics">
        <div class="metric-card primary">
          <div class="metric-icon">
            <Icon name="trending-up" size="24" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Gesamtertrag</div>
            <div class="metric-value">{{ formatCurrency(calculationResults.totalReturn) }}</div>
            <div class="metric-detail">Nach {{ investmentParams.years }} Jahren</div>
          </div>
        </div>

        <div class="metric-card success">
          <div class="metric-icon">
            <Icon name="shield" size="24" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Teilfreistellung</div>
            <div class="metric-value">{{ formatCurrency(calculationResults.teilfreistellungAmount) }}</div>
            <div class="metric-detail">{{ formatPercentage(selectedETF?.teilfreistellungRate || 0) }} steuerfrei</div>
          </div>
        </div>

        <div class="metric-card warning">
          <div class="metric-icon">
            <Icon name="percent" size="24" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Steuerersparnis</div>
            <div class="metric-value">{{ formatCurrency(calculationResults.taxSavings) }}</div>
            <div class="metric-detail">Durch Teilfreistellung</div>
          </div>
        </div>

        <div class="metric-card info">
          <div class="metric-icon">
            <Icon name="calculator" size="24" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Netto-Ertrag</div>
            <div class="metric-value">{{ formatCurrency(calculationResults.netReturn) }}</div>
            <div class="metric-detail">Nach Steuern</div>
          </div>
        </div>
      </div>

      <!-- 详细分解 -->
      <div class="detailed-breakdown">
        <div class="breakdown-card">
          <h3>Steuerliche Aufschlüsselung</h3>
          <div class="breakdown-table">
            <div class="breakdown-row">
              <span class="row-label">Brutto-Ertrag:</span>
              <span class="row-value">{{ formatCurrency(calculationResults.grossReturn) }}</span>
            </div>
            <div class="breakdown-row highlight">
              <span class="row-label">Teilfreistellung ({{ formatPercentage(selectedETF?.teilfreistellungRate || 0) }}):</span>
              <span class="row-value positive">-{{ formatCurrency(calculationResults.teilfreistellungAmount) }}</span>
            </div>
            <div class="breakdown-row">
              <span class="row-label">Steuerpflichtiger Betrag:</span>
              <span class="row-value">{{ formatCurrency(calculationResults.taxableAmount) }}</span>
            </div>
            <div class="breakdown-row">
              <span class="row-label">Abgeltungssteuer (25%):</span>
              <span class="row-value negative">{{ formatCurrency(calculationResults.abgeltungssteuer) }}</span>
            </div>
            <div class="breakdown-row">
              <span class="row-label">Solidaritätszuschlag (5,5%):</span>
              <span class="row-value negative">{{ formatCurrency(calculationResults.solidaritaetszuschlag) }}</span>
            </div>
            <div class="breakdown-row total">
              <span class="row-label">Gesamte Steuern:</span>
              <span class="row-value negative">{{ formatCurrency(calculationResults.totalTax) }}</span>
            </div>
            <div class="breakdown-row final">
              <span class="row-label">Netto-Ertrag:</span>
              <span class="row-value">{{ formatCurrency(calculationResults.netReturn) }}</span>
            </div>
          </div>
        </div>

        <div class="breakdown-card">
          <h3>Vergleich ohne Teilfreistellung</h3>
          <div class="comparison-table">
            <div class="comparison-row">
              <span class="comparison-label">Mit Teilfreistellung:</span>
              <span class="comparison-value">{{ formatCurrency(calculationResults.netReturn) }}</span>
            </div>
            <div class="comparison-row">
              <span class="comparison-label">Ohne Teilfreistellung:</span>
              <span class="comparison-value">{{ formatCurrency(calculationResults.netReturnWithoutTeilfreistellung) }}</span>
            </div>
            <div class="comparison-row highlight">
              <span class="comparison-label">Vorteil:</span>
              <span class="comparison-value positive">{{ formatCurrency(calculationResults.taxSavings) }}</span>
            </div>
            <div class="comparison-row">
              <span class="comparison-label">Relative Ersparnis:</span>
              <span class="comparison-value">{{ formatPercentage(calculationResults.relativeSavings) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ETF税收对比工具 -->
    <div class="comparison-tool-section">
      <h2>ETF-Vergleichstool</h2>
      <ETFTaxComparison
        :initial-investment="investmentParams.amount"
        :initial-return="investmentParams.annualReturn"
        :initial-years="investmentParams.years"
      />
    </div>

    <!-- 教育信息 -->
    <div class="education-section">
      <h2>Wissenswertes zur ETF-Teilfreistellung</h2>

      <div class="education-grid">
        <div class="education-card">
          <div class="education-icon">
            <Icon name="book-open" size="24" />
          </div>
          <h3>Was ist die Teilfreistellung?</h3>
          <p>
            Die Teilfreistellung ist ein Steuervorteil für ETF-Anleger. Ein bestimmter Prozentsatz
            der Erträge bleibt steuerfrei, abhängig vom ETF-Typ und dessen Zusammensetzung.
          </p>
        </div>

        <div class="education-card">
          <div class="education-icon">
            <Icon name="calculator" size="24" />
          </div>
          <h3>Wie wird sie berechnet?</h3>
          <p>
            Die Teilfreistellung wird auf die gesamten Erträge angewendet. Bei einem Aktien-ETF
            mit 30% Teilfreistellung sind 30% der Erträge steuerfrei, 70% unterliegen der Abgeltungssteuer.
          </p>
        </div>

        <div class="education-card">
          <div class="education-icon">
            <Icon name="trending-up" size="24" />
          </div>
          <h3>Welche ETF-Typen gibt es?</h3>
          <p>
            Aktien-ETFs (30%), Misch-ETFs (15%), Immobilien-ETFs (60%) und Anleihen-ETFs (0%)
            haben unterschiedliche Teilfreistellungssätze je nach Zusammensetzung.
          </p>
        </div>

        <div class="education-card">
          <div class="education-icon">
            <Icon name="shield" size="24" />
          </div>
          <h3>Rechtliche Grundlage</h3>
          <p>
            Die Teilfreistellung ist im Investmentsteuergesetz (InvStG) geregelt und gilt seit 2018.
            Sie soll die Doppelbesteuerung von Unternehmenserträgen vermeiden.
          </p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="exportResults" class="action-button primary">
        <Icon name="download" size="16" />
        Ergebnisse exportieren
      </button>
      <button @click="shareResults" class="action-button secondary">
        <Icon name="share-2" size="16" />
        Ergebnisse teilen
      </button>
      <button @click="resetCalculation" class="action-button secondary">
        <Icon name="refresh-cw" size="16" />
        Berechnung zurücksetzen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import ETFTypeSelector from '@/components/etf/ETFTypeSelector.vue'
import ETFTaxComparison from '@/components/etf/ETFTaxComparison.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface ETFType {
  id: string
  name: string
  description: string
  teilfreistellungRate: number
  riskLevel: number
  icon: string
  category: string
}

interface InvestmentParams {
  amount: number
  annualReturn: number
  years: number
  monthlyContribution: number
}

interface CalculationResults {
  totalReturn: number
  grossReturn: number
  teilfreistellungAmount: number
  taxableAmount: number
  abgeltungssteuer: number
  solidaritaetszuschlag: number
  totalTax: number
  netReturn: number
  netReturnWithoutTeilfreistellung: number
  taxSavings: number
  relativeSavings: number
}

// 响应式数据
const selectedETFType = ref('')
const selectedETF = ref<ETFType | null>(null)

const investmentParams = reactive<InvestmentParams>({
  amount: 25000,
  annualReturn: 7,
  years: 15,
  monthlyContribution: 500
})

const calculationResults = ref<CalculationResults | null>(null)

// 预设配置
const presets = {
  conservative: {
    amount: 10000,
    annualReturn: 5,
    years: 10,
    monthlyContribution: 200
  },
  balanced: {
    amount: 25000,
    annualReturn: 7,
    years: 15,
    monthlyContribution: 500
  },
  growth: {
    amount: 50000,
    annualReturn: 9,
    years: 20,
    monthlyContribution: 1000
  }
}

// 方法
const loadPreset = (presetName: keyof typeof presets) => {
  const preset = presets[presetName]
  Object.assign(investmentParams, preset)
  calculateResults()
}

const handleETFSelected = (etf: ETFType) => {
  selectedETF.value = etf
  calculateResults()
}

const calculateResults = () => {
  if (!selectedETF.value) return

  // 计算复利增长（包含月度投资）
  const monthlyRate = investmentParams.annualReturn / 100 / 12
  const totalMonths = investmentParams.years * 12

  // 初始投资的复利增长
  const initialGrowth = investmentParams.amount * Math.pow(1 + investmentParams.annualReturn / 100, investmentParams.years)

  // 月度投资的复利增长
  const monthlyGrowth = investmentParams.monthlyContribution *
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)

  const totalValue = initialGrowth + monthlyGrowth
  const totalInvested = investmentParams.amount + (investmentParams.monthlyContribution * totalMonths)
  const grossReturn = totalValue - totalInvested

  // 计算Teilfreistellung
  const teilfreistellungAmount = grossReturn * selectedETF.value.teilfreistellungRate
  const taxableAmount = grossReturn - teilfreistellungAmount

  // 计算税收
  const abgeltungssteuer = taxableAmount * 0.25
  const solidaritaetszuschlag = abgeltungssteuer * 0.055
  const totalTax = abgeltungssteuer + solidaritaetszuschlag

  // 计算最终结果
  const netReturn = grossReturn - totalTax
  const netReturnWithoutTeilfreistellung = grossReturn - (grossReturn * 0.25 * 1.055)
  const taxSavings = netReturn - netReturnWithoutTeilfreistellung
  const relativeSavings = grossReturn > 0 ? (taxSavings / grossReturn) : 0

  calculationResults.value = {
    totalReturn: totalValue,
    grossReturn,
    teilfreistellungAmount,
    taxableAmount,
    abgeltungssteuer,
    solidaritaetszuschlag,
    totalTax,
    netReturn,
    netReturnWithoutTeilfreistellung,
    taxSavings,
    relativeSavings
  }
}

const exportResults = () => {
  if (!calculationResults.value || !selectedETF.value) return

  const data = {
    etf: selectedETF.value,
    parameters: investmentParams,
    results: calculationResults.value,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `etf-teilfreistellung-${selectedETF.value.name.toLowerCase().replace(/\s+/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const shareResults = () => {
  if (!calculationResults.value || !selectedETF.value) return

  const shareText = `ETF-Teilfreistellung Berechnung:
${selectedETF.value.name}
Investition: ${formatCurrency(investmentParams.amount)}
Netto-Ertrag: ${formatCurrency(calculationResults.value.netReturn)}
Steuerersparnis: ${formatCurrency(calculationResults.value.taxSavings)}`

  if (navigator.share) {
    navigator.share({
      title: 'ETF-Teilfreistellung Berechnung',
      text: shareText
    })
  } else {
    navigator.clipboard.writeText(shareText)
    alert('Ergebnisse in die Zwischenablage kopiert!')
  }
}

const resetCalculation = () => {
  selectedETFType.value = ''
  selectedETF.value = null
  calculationResults.value = null
  Object.assign(investmentParams, presets.balanced)
}

// 生命周期
onMounted(() => {
  // 默认选择Aktien-ETF
  selectedETFType.value = 'equity-etf'
})
</script>

<style scoped>
.etf-teilfreistellung-example {
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

/* 快速开始区域 */
.quick-start-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.quick-start-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.quick-start-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.quick-start-card {
  @apply p-4 border border-gray-200 rounded-lg cursor-pointer;
  @apply hover:border-blue-300 hover:shadow-md transition-all;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.preset-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3;
}

.quick-start-card h3 {
  @apply font-semibold text-gray-900 mb-2;
}

.quick-start-card p {
  @apply text-sm text-gray-600 mb-3;
}

.preset-details {
  @apply text-xs text-gray-500;
}

/* ETF选择和配置区域 */
.etf-selection-section,
.investment-config-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.etf-selection-section h2,
.investment-config-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.config-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.config-group {
  @apply space-y-2;
}

.config-group label {
  @apply block text-sm font-medium text-gray-700;
}

.config-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* 结果展示区域 */
.results-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.results-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.main-metrics {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8;
}

.metric-card {
  @apply flex items-center gap-4 p-4 rounded-lg border;
}

.metric-card.primary {
  @apply bg-blue-50 border-blue-200;
}

.metric-card.success {
  @apply bg-green-50 border-green-200;
}

.metric-card.warning {
  @apply bg-yellow-50 border-yellow-200;
}

.metric-card.info {
  @apply bg-gray-50 border-gray-200;
}

.metric-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center;
}

.metric-card.primary .metric-icon {
  @apply bg-blue-100 text-blue-600;
}

.metric-card.success .metric-icon {
  @apply bg-green-100 text-green-600;
}

.metric-card.warning .metric-icon {
  @apply bg-yellow-100 text-yellow-600;
}

.metric-card.info .metric-icon {
  @apply bg-gray-100 text-gray-600;
}

.metric-content {
  @apply flex-1;
}

.metric-label {
  @apply text-sm text-gray-600;
}

.metric-value {
  @apply text-lg font-bold text-gray-900;
}

.metric-detail {
  @apply text-xs text-gray-500;
}

/* 详细分解区域 */
.detailed-breakdown {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.breakdown-card {
  @apply bg-gray-50 rounded-lg p-6 border border-gray-200;
}

.breakdown-card h3 {
  @apply font-semibold text-gray-800 mb-4;
}

.breakdown-table,
.comparison-table {
  @apply space-y-2;
}

.breakdown-row,
.comparison-row {
  @apply flex justify-between text-sm;
}

.breakdown-row.highlight,
.comparison-row.highlight {
  @apply bg-yellow-100 px-2 py-1 rounded;
}

.breakdown-row.total {
  @apply border-t border-gray-300 pt-2 font-semibold;
}

.breakdown-row.final {
  @apply border-t-2 border-gray-400 pt-2 font-bold text-lg;
}

.row-label,
.comparison-label {
  @apply text-gray-700;
}

.row-value,
.comparison-value {
  @apply font-medium text-gray-900;
}

.row-value.positive,
.comparison-value.positive {
  @apply text-green-600;
}

.row-value.negative,
.comparison-value.negative {
  @apply text-red-600;
}

/* 对比工具区域 */
.comparison-tool-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.comparison-tool-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

/* 教育信息区域 */
.education-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.education-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.education-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.education-card {
  @apply p-6 bg-gray-50 rounded-lg border border-gray-200;
}

.education-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4;
}

.education-card h3 {
  @apply font-semibold text-gray-900 mb-3;
}

.education-card p {
  @apply text-sm text-gray-600 leading-relaxed;
}

/* 操作按钮区域 */
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
  .quick-start-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .config-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .main-metrics {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .detailed-breakdown {
    @apply grid-cols-1;
  }

  .education-grid {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .quick-start-grid {
    @apply grid-cols-1;
  }

  .config-grid {
    @apply grid-cols-1;
  }

  .main-metrics {
    @apply grid-cols-1;
  }

  .metric-card {
    @apply flex-col text-center;
  }

  .metric-icon {
    @apply mb-3;
  }

  .breakdown-row,
  .comparison-row {
    @apply flex-col gap-1;
  }

  .breakdown-row.highlight,
  .comparison-row.highlight {
    @apply text-center;
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
  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .quick-start-section,
  .etf-selection-section,
  .investment-config-section,
  .results-section,
  .comparison-tool-section,
  .education-section {
    @apply bg-gray-800 border-gray-700;
  }

  .quick-start-section h2,
  .etf-selection-section h2,
  .investment-config-section h2,
  .results-section h2,
  .comparison-tool-section h2,
  .education-section h2 {
    @apply text-gray-100;
  }

  .quick-start-card {
    @apply bg-gray-700 border-gray-600;
  }

  .quick-start-card h3 {
    @apply text-gray-100;
  }

  .quick-start-card p {
    @apply text-gray-300;
  }

  .preset-details {
    @apply text-gray-400;
  }

  .config-group label {
    @apply text-gray-300;
  }

  .config-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .metric-card {
    @apply bg-gray-700 border-gray-600;
  }

  .metric-label {
    @apply text-gray-300;
  }

  .metric-value {
    @apply text-gray-100;
  }

  .metric-detail {
    @apply text-gray-400;
  }

  .breakdown-card {
    @apply bg-gray-700 border-gray-600;
  }

  .breakdown-card h3 {
    @apply text-gray-100;
  }

  .row-label,
  .comparison-label {
    @apply text-gray-300;
  }

  .row-value,
  .comparison-value {
    @apply text-gray-100;
  }

  .education-card {
    @apply bg-gray-700 border-gray-600;
  }

  .education-card h3 {
    @apply text-gray-100;
  }

  .education-card p {
    @apply text-gray-300;
  }
}
</style>
