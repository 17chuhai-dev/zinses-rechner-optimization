<!--
  ETF税收对比工具
  比较不同ETF类型的税收影响和Teilfreistellung效果
-->

<template>
  <div class="etf-tax-comparison">
    <!-- 对比工具头部 -->
    <div class="comparison-header">
      <h3 class="comparison-title">
        <Icon name="bar-chart-2" size="20" />
        ETF-Steuervergleich
      </h3>
      <div class="header-actions">
        <button @click="addComparison" class="action-button primary">
          <Icon name="plus" size="16" />
          ETF hinzufügen
        </button>
        <button @click="resetComparisons" class="action-button secondary">
          <Icon name="refresh-cw" size="16" />
          Zurücksetzen
        </button>
      </div>
    </div>

    <!-- 投资参数设置 -->
    <div class="investment-parameters">
      <h4>Investitionsparameter</h4>
      <div class="parameters-grid">
        <div class="parameter-group">
          <label>Investitionsbetrag (€)</label>
          <input
            v-model.number="investmentAmount"
            type="number"
            min="1000"
            step="1000"
            class="parameter-input"
            @input="updateComparisons"
          />
        </div>

        <div class="parameter-group">
          <label>Erwartete jährliche Rendite (%)</label>
          <input
            v-model.number="expectedReturn"
            type="number"
            min="0"
            max="20"
            step="0.5"
            class="parameter-input"
            @input="updateComparisons"
          />
        </div>

        <div class="parameter-group">
          <label>Anlagedauer (Jahre)</label>
          <input
            v-model.number="investmentYears"
            type="number"
            min="1"
            max="50"
            step="1"
            class="parameter-input"
            @input="updateComparisons"
          />
        </div>

        <div class="parameter-group">
          <label class="checkbox-label">
            <input
              v-model="includeFreibetrag"
              type="checkbox"
              @change="updateComparisons"
            />
            <span>Freistellungsauftrag berücksichtigen</span>
          </label>
        </div>
      </div>
    </div>

    <!-- ETF对比列表 */
    <div class="comparisons-list">
      <div
        v-for="(comparison, index) in comparisons"
        :key="comparison.id"
        class="comparison-card"
        :class="{ 'best-option': comparison.isBestOption }"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="etf-info">
            <div class="etf-icon">
              <Icon :name="comparison.etf.icon" size="20" />
            </div>
            <div class="etf-details">
              <h5 class="etf-name">{{ comparison.etf.name }}</h5>
              <p class="etf-description">{{ comparison.etf.description }}</p>
            </div>
          </div>

          <div class="card-actions">
            <button v-if="comparison.isBestOption" class="best-badge">
              <Icon name="crown" size="12" />
              <span>Beste Option</span>
            </button>
            <button @click="removeComparison(index)" class="remove-button">
              <Icon name="x" size="16" />
            </button>
          </div>
        </div>

        <!-- Teilfreistellung信息 -->
        <div class="teilfreistellung-section">
          <div class="teilfreistellung-header">
            <h6>Teilfreistellung</h6>
            <span class="teilfreistellung-rate">{{ formatPercentage(comparison.etf.teilfreistellungRate) }}</span>
          </div>

          <div class="teilfreistellung-details">
            <div class="detail-row">
              <span>Brutto-Ertrag:</span>
              <span>{{ formatCurrency(comparison.calculations.grossReturn) }}</span>
            </div>
            <div class="detail-row">
              <span>Teilfreistellung:</span>
              <span class="positive">{{ formatCurrency(comparison.calculations.teilfreistellungAmount) }}</span>
            </div>
            <div class="detail-row">
              <span>Steuerpflichtiger Betrag:</span>
              <span>{{ formatCurrency(comparison.calculations.taxableAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- 税收计算 -->
        <div class="tax-calculation-section">
          <h6>Steuerberechnung</h6>
          <div class="tax-breakdown">
            <div class="tax-row">
              <span>Abgeltungssteuer (25%):</span>
              <span class="negative">{{ formatCurrency(comparison.calculations.abgeltungssteuer) }}</span>
            </div>
            <div class="tax-row">
              <span>Solidaritätszuschlag (5,5%):</span>
              <span class="negative">{{ formatCurrency(comparison.calculations.solidaritaetszuschlag) }}</span>
            </div>
            <div v-if="comparison.calculations.freistellungsauftragSavings > 0" class="tax-row">
              <span>Freistellungsauftrag:</span>
              <span class="positive">-{{ formatCurrency(comparison.calculations.freistellungsauftragSavings) }}</span>
            </div>
            <div class="tax-row total">
              <span>Gesamte Steuern:</span>
              <span class="negative">{{ formatCurrency(comparison.calculations.totalTax) }}</span>
            </div>
          </div>
        </div>

        <!-- 最终结果 */
        <div class="final-results">
          <div class="result-grid">
            <div class="result-item">
              <span class="result-label">Netto-Ertrag</span>
              <span class="result-value">{{ formatCurrency(comparison.calculations.netReturn) }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Effektive Steuerrate</span>
              <span class="result-value">{{ formatPercentage(comparison.calculations.effectiveTaxRate) }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Steuerersparnis</span>
              <span class="result-value positive">{{ formatCurrency(comparison.calculations.taxSavings) }}</span>
            </div>
          </div>
        </div>

        <!-- 进度条对比 */
        <div class="progress-comparison">
          <div class="progress-label">Netto-Rendite im Vergleich</div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${(comparison.calculations.netReturn / maxNetReturn) * 100}%` }"
            ></div>
          </div>
          <div class="progress-value">{{ formatPercentage((comparison.calculations.netReturn / investmentAmount) * 100) }}</div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="comparisons.length === 0" class="empty-state">
        <Icon name="bar-chart-2" size="48" />
        <h4>Keine ETFs zum Vergleich</h4>
        <p>Fügen Sie ETFs hinzu, um deren Steuerauswirkungen zu vergleichen</p>
        <button @click="addComparison" class="empty-action-button">
          <Icon name="plus" size="16" />
          Ersten ETF hinzufügen
        </button>
      </div>
    </div>

    <!-- 对比摘要 -->
    <div v-if="comparisons.length > 1" class="comparison-summary">
      <h4>Vergleichsübersicht</h4>

      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <Icon name="trending-up" size="20" />
          </div>
          <div class="stat-content">
            <div class="stat-label">Beste Netto-Rendite</div>
            <div class="stat-value">{{ formatCurrency(maxNetReturn) }}</div>
            <div class="stat-detail">{{ bestETF?.name }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <Icon name="shield" size="20" />
          </div>
          <div class="stat-content">
            <div class="stat-label">Höchste Steuerersparnis</div>
            <div class="stat-value">{{ formatCurrency(maxTaxSavings) }}</div>
            <div class="stat-detail">Durch Teilfreistellung</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <Icon name="percent" size="20" />
          </div>
          <div class="stat-content">
            <div class="stat-label">Niedrigste Steuerrate</div>
            <div class="stat-value">{{ formatPercentage(minTaxRate) }}</div>
            <div class="stat-detail">Effektive Belastung</div>
          </div>
        </div>
      </div>

      <div class="recommendation">
        <div class="recommendation-icon">
          <Icon name="lightbulb" size="24" />
        </div>
        <div class="recommendation-content">
          <h5>Empfehlung</h5>
          <p>{{ getRecommendationText() }}</p>
        </div>
      </div>
    </div>

    <!-- ETF选择模态框 -->
    <Transition name="modal-fade">
      <div v-if="showETFSelector" class="modal-overlay" @click="closeETFSelector">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>ETF für Vergleich auswählen</h3>
            <button @click="closeETFSelector" class="modal-close">
              <Icon name="x" size="20" />
            </button>
          </div>

          <div class="modal-body">
            <ETFTypeSelector
              v-model="selectedETFForComparison"
              :show-info="false"
              :allow-custom="true"
              @etf-selected="handleETFSelected"
            />
          </div>

          <div class="modal-footer">
            <button @click="closeETFSelector" class="modal-button secondary">
              Abbrechen
            </button>
            <button @click="confirmETFSelection" class="modal-button primary" :disabled="!selectedETFForComparison">
              Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import ETFTypeSelector from './ETFTypeSelector.vue'
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

interface TaxCalculations {
  grossReturn: number
  teilfreistellungAmount: number
  taxableAmount: number
  abgeltungssteuer: number
  solidaritaetszuschlag: number
  freistellungsauftragSavings: number
  totalTax: number
  netReturn: number
  effectiveTaxRate: number
  taxSavings: number
}

interface ETFComparison {
  id: string
  etf: ETFType
  calculations: TaxCalculations
  isBestOption: boolean
}

// Props定义
interface Props {
  initialInvestment?: number
  initialReturn?: number
  initialYears?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialInvestment: 10000,
  initialReturn: 7,
  initialYears: 10
})

// 响应式数据
const investmentAmount = ref(props.initialInvestment)
const expectedReturn = ref(props.initialReturn)
const investmentYears = ref(props.initialYears)
const includeFreibetrag = ref(true)

const comparisons = ref<ETFComparison[]>([])
const showETFSelector = ref(false)
const selectedETFForComparison = ref('')

// 计算属性
const maxNetReturn = computed(() => {
  return Math.max(...comparisons.value.map(c => c.calculations.netReturn), 0)
})

const maxTaxSavings = computed(() => {
  return Math.max(...comparisons.value.map(c => c.calculations.taxSavings), 0)
})

const minTaxRate = computed(() => {
  const rates = comparisons.value.map(c => c.calculations.effectiveTaxRate)
  return rates.length > 0 ? Math.min(...rates) : 0
})

const bestETF = computed(() => {
  return comparisons.value.find(c => c.isBestOption)?.etf
})

// 方法
const calculateTaxes = (etf: ETFType): TaxCalculations => {
  // 计算总收益
  const totalValue = investmentAmount.value * Math.pow(1 + expectedReturn.value / 100, investmentYears.value)
  const grossReturn = totalValue - investmentAmount.value

  // 计算Teilfreistellung
  const teilfreistellungAmount = grossReturn * etf.teilfreistellungRate
  const taxableAmount = grossReturn - teilfreistellungAmount

  // 计算Freistellungsauftrag节省
  const freibetrag = 1000 // 简化为单身
  const freistellungsauftragSavings = includeFreibetrag.value
    ? Math.min(taxableAmount, freibetrag) * 0.25
    : 0

  // 计算税收
  const taxableAfterFreibetrag = Math.max(0, taxableAmount - (includeFreibetrag.value ? freibetrag : 0))
  const abgeltungssteuer = taxableAfterFreibetrag * 0.25
  const solidaritaetszuschlag = abgeltungssteuer * 0.055
  const totalTax = abgeltungssteuer + solidaritaetszuschlag

  // 计算最终结果
  const netReturn = grossReturn - totalTax
  const effectiveTaxRate = grossReturn > 0 ? (totalTax / grossReturn) : 0
  const taxSavings = teilfreistellungAmount * 0.25 + freistellungsauftragSavings

  return {
    grossReturn,
    teilfreistellungAmount,
    taxableAmount,
    abgeltungssteuer,
    solidaritaetszuschlag,
    freistellungsauftragSavings,
    totalTax,
    netReturn,
    effectiveTaxRate,
    taxSavings
  }
}

const updateComparisons = () => {
  comparisons.value.forEach(comparison => {
    comparison.calculations = calculateTaxes(comparison.etf)
  })

  // 标记最佳选项
  const bestComparison = comparisons.value.reduce((best, current) =>
    current.calculations.netReturn > best.calculations.netReturn ? current : best
  , comparisons.value[0])

  comparisons.value.forEach(comparison => {
    comparison.isBestOption = comparison.id === bestComparison?.id
  })
}

const addComparison = () => {
  showETFSelector.value = true
}

const handleETFSelected = (etf: ETFType) => {
  selectedETFForComparison.value = etf.id
}

const confirmETFSelection = () => {
  // 这里需要获取选中的ETF数据
  // 简化实现，使用预定义的ETF类型
  const etfTypes = [
    {
      id: 'equity-etf',
      name: 'Aktien-ETF',
      description: 'Mindestens 51% Aktienanteil',
      teilfreistellungRate: 0.30,
      riskLevel: 4,
      icon: 'trending-up',
      category: 'equity'
    },
    {
      id: 'mixed-etf',
      name: 'Misch-ETF',
      description: 'Mindestens 25% Aktienanteil',
      teilfreistellungRate: 0.15,
      riskLevel: 3,
      icon: 'pie-chart',
      category: 'mixed'
    },
    {
      id: 'reit-etf',
      name: 'Immobilien-ETF',
      description: 'Immobilien-Investmentfonds',
      teilfreistellungRate: 0.60,
      riskLevel: 3,
      icon: 'home',
      category: 'reit'
    }
  ]

  const selectedETF = etfTypes.find(etf => etf.id === selectedETFForComparison.value)
  if (selectedETF && !comparisons.value.find(c => c.etf.id === selectedETF.id)) {
    const newComparison: ETFComparison = {
      id: `comparison-${Date.now()}`,
      etf: selectedETF,
      calculations: calculateTaxes(selectedETF),
      isBestOption: false
    }

    comparisons.value.push(newComparison)
    updateComparisons()
  }

  closeETFSelector()
}

const closeETFSelector = () => {
  showETFSelector.value = false
  selectedETFForComparison.value = ''
}

const removeComparison = (index: number) => {
  comparisons.value.splice(index, 1)
  updateComparisons()
}

const resetComparisons = () => {
  comparisons.value = []
}

const getRecommendationText = (): string => {
  if (!bestETF.value) return ''

  const best = comparisons.value.find(c => c.isBestOption)
  if (!best) return ''

  return `Basierend auf Ihren Parametern bietet der ${best.etf.name} die beste Netto-Rendite von ${formatCurrency(best.calculations.netReturn)} mit einer Steuerersparnis von ${formatCurrency(best.calculations.taxSavings)} durch die ${formatPercentage(best.etf.teilfreistellungRate)} Teilfreistellung.`
}

// 监听器
watch([investmentAmount, expectedReturn, investmentYears, includeFreibetrag], () => {
  updateComparisons()
})
</script>

<style scoped>
.etf-tax-comparison {
  @apply space-y-6;
}

/* 对比工具头部 */
.comparison-header {
  @apply flex items-center justify-between mb-6;
}

.comparison-title {
  @apply flex items-center gap-2 text-xl font-semibold text-gray-800;
}

.header-actions {
  @apply flex gap-3;
}

.action-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-md font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply transition-colors;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.action-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 投资参数设置 */
.investment-parameters {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.investment-parameters h4 {
  @apply text-lg font-semibold text-gray-800 mb-4;
}

.parameters-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
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

/* 对比列表 */
.comparisons-list {
  @apply space-y-4;
}

.comparison-card {
  @apply bg-white rounded-lg shadow-md border p-6;
  @apply transition-all duration-200;
}

.comparison-card.best-option {
  @apply border-green-500 bg-green-50 shadow-lg;
}

.card-header {
  @apply flex items-start justify-between mb-4;
}

.etf-info {
  @apply flex items-center gap-3;
}

.etf-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.comparison-card.best-option .etf-icon {
  @apply bg-green-100 text-green-600;
}

.etf-details h5 {
  @apply font-semibold text-gray-900;
}

.etf-details p {
  @apply text-sm text-gray-600;
}

.card-actions {
  @apply flex items-center gap-2;
}

.best-badge {
  @apply flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700;
  @apply text-xs font-medium rounded-full;
}

.remove-button {
  @apply p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-red-500;
}

/* Teilfreistellung区域 */
.teilfreistellung-section {
  @apply mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200;
}

.comparison-card.best-option .teilfreistellung-section {
  @apply bg-green-100 border-green-300;
}

.teilfreistellung-header {
  @apply flex items-center justify-between mb-3;
}

.teilfreistellung-header h6 {
  @apply font-medium text-blue-900;
}

.comparison-card.best-option .teilfreistellung-header h6 {
  @apply text-green-900;
}

.teilfreistellung-rate {
  @apply font-bold text-blue-600;
}

.comparison-card.best-option .teilfreistellung-rate {
  @apply text-green-600;
}

.teilfreistellung-details {
  @apply space-y-2;
}

.detail-row {
  @apply flex justify-between text-sm;
}

.detail-row span:first-child {
  @apply text-gray-700;
}

.detail-row span:last-child {
  @apply font-medium text-gray-900;
}

.detail-row .positive {
  @apply text-green-600;
}

.detail-row .negative {
  @apply text-red-600;
}

/* 税收计算区域 */
.tax-calculation-section {
  @apply mb-4;
}

.tax-calculation-section h6 {
  @apply font-medium text-gray-800 mb-3;
}

.tax-breakdown {
  @apply space-y-2;
}

.tax-row {
  @apply flex justify-between text-sm;
}

.tax-row.total {
  @apply border-t border-gray-200 pt-2 font-semibold;
}

.tax-row .negative {
  @apply text-red-600;
}

.tax-row .positive {
  @apply text-green-600;
}

/* 最终结果区域 */
.final-results {
  @apply mb-4;
}

.result-grid {
  @apply grid grid-cols-3 gap-4;
}

.result-item {
  @apply text-center p-3 bg-gray-50 rounded-lg;
}

.comparison-card.best-option .result-item {
  @apply bg-green-100;
}

.result-label {
  @apply block text-xs text-gray-600 mb-1;
}

.comparison-card.best-option .result-label {
  @apply text-green-700;
}

.result-value {
  @apply font-semibold text-gray-900;
}

.result-value.positive {
  @apply text-green-600;
}

/* 进度条对比 */
.progress-comparison {
  @apply space-y-2;
}

.progress-label {
  @apply text-sm font-medium text-gray-700;
}

.progress-bar {
  @apply w-full h-3 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-blue-500 transition-all duration-500;
}

.comparison-card.best-option .progress-fill {
  @apply bg-green-500;
}

.progress-value {
  @apply text-sm font-medium text-gray-600 text-right;
}

/* 空状态 */
.empty-state {
  @apply text-center py-12 text-gray-500;
}

.empty-state h4 {
  @apply text-lg font-medium text-gray-700 mt-4 mb-2;
}

.empty-state p {
  @apply text-sm mb-6;
}

.empty-action-button {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

/* 对比摘要 */
.comparison-summary {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.comparison-summary h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.summary-stats {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4 mb-6;
}

.stat-card {
  @apply flex items-center gap-4 p-4 bg-gray-50 rounded-lg;
}

.stat-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.stat-content {
  @apply flex-1;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply text-lg font-bold text-gray-900;
}

.stat-detail {
  @apply text-xs text-gray-500;
}

.recommendation {
  @apply flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg;
}

.recommendation-icon {
  @apply w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center;
}

.recommendation-content h5 {
  @apply font-semibold text-yellow-900 mb-2;
}

.recommendation-content p {
  @apply text-sm text-yellow-800;
}

/* 模态框 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.modal-header h3 {
  @apply text-lg font-semibold text-gray-900;
}

.modal-close {
  @apply p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.modal-body {
  @apply p-6;
}

.modal-footer {
  @apply flex gap-3 p-6 border-t border-gray-200;
}

.modal-button {
  @apply flex-1 px-4 py-2 rounded-md font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.modal-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
  @apply disabled:bg-gray-400 disabled:cursor-not-allowed;
}

.modal-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .parameters-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .summary-stats {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .comparison-header {
    @apply flex-col items-start gap-4;
  }

  .header-actions {
    @apply w-full justify-between;
  }

  .parameters-grid {
    @apply grid-cols-1;
  }

  .result-grid {
    @apply grid-cols-1 gap-2;
  }

  .result-item {
    @apply text-left flex justify-between;
  }

  .recommendation {
    @apply flex-col gap-3;
  }

  .modal-content {
    @apply mx-2;
  }

  .modal-footer {
    @apply flex-col;
  }

  .modal-button {
    @apply w-full;
  }
}
</style>
