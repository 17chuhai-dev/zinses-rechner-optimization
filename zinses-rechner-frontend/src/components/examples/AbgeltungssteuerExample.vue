<!--
  Abgeltungssteuer计算示例
  展示德国资本利得税计算功能
-->

<template>
  <div class="abgeltungssteuer-example">
    <div class="example-header">
      <h1>Abgeltungssteuer-Rechner</h1>
      <p>Berechnen Sie Ihre Kapitalertragsteuer nach deutschem Steuerrecht</p>
    </div>

    <!-- 计算输入区域 -->
    <div class="calculation-input-section">
      <h2>Eingabeparameter</h2>

      <div class="input-grid">
        <!-- 基本投资参数 -->
        <div class="input-group">
          <h3>Investitionsparameter</h3>

          <div class="form-field">
            <label>Anfangskapital (€)</label>
            <input
              v-model.number="investmentParams.initialAmount"
              type="number"
              min="0"
              step="1000"
              class="form-input"
              @input="handleInputChange"
            />
          </div>

          <div class="form-field">
            <label>Monatliche Sparrate (€)</label>
            <input
              v-model.number="investmentParams.monthlyAmount"
              type="number"
              min="0"
              step="100"
              class="form-input"
              @input="handleInputChange"
            />
          </div>

          <div class="form-field">
            <label>Jährliche Rendite (%)</label>
            <input
              v-model.number="investmentParams.annualReturn"
              type="number"
              min="0"
              max="20"
              step="0.1"
              class="form-input"
              @input="handleInputChange"
            />
          </div>

          <div class="form-field">
            <label>Anlagedauer (Jahre)</label>
            <input
              v-model.number="investmentParams.years"
              type="number"
              min="1"
              max="50"
              step="1"
              class="form-input"
              @input="handleInputChange"
            />
          </div>
        </div>

        <!-- 税收配置 -->
        <div class="input-group">
          <h3>Steuereinstellungen</h3>

          <div class="form-field">
            <label class="checkbox-label">
              <input
                v-model="taxConfig.solidaritaetszuschlag.enabled"
                type="checkbox"
                @change="updateTaxConfig"
              />
              <span>Solidaritätszuschlag (5,5%)</span>
            </label>
          </div>

          <div class="form-field">
            <label class="checkbox-label">
              <input
                v-model="taxConfig.churchTax.enabled"
                type="checkbox"
                @change="updateTaxConfig"
              />
              <span>Kirchensteuer</span>
            </label>
          </div>

          <div v-if="taxConfig.churchTax.enabled" class="form-field">
            <label>Bundesland</label>
            <select
              v-model="taxConfig.churchTax.state"
              class="form-select"
              @change="updateTaxConfig"
            >
              <option value="Baden-Württemberg">Baden-Württemberg (8%)</option>
              <option value="Bayern">Bayern (8%)</option>
              <option value="Berlin">Berlin (9%)</option>
              <option value="Brandenburg">Brandenburg (9%)</option>
              <option value="Bremen">Bremen (9%)</option>
              <option value="Hamburg">Hamburg (9%)</option>
              <option value="Hessen">Hessen (9%)</option>
              <option value="Mecklenburg-Vorpommern">Mecklenburg-Vorpommern (9%)</option>
              <option value="Niedersachsen">Niedersachsen (9%)</option>
              <option value="Nordrhein-Westfalen">Nordrhein-Westfalen (9%)</option>
              <option value="Rheinland-Pfalz">Rheinland-Pfalz (9%)</option>
              <option value="Saarland">Saarland (9%)</option>
              <option value="Sachsen">Sachsen (9%)</option>
              <option value="Sachsen-Anhalt">Sachsen-Anhalt (9%)</option>
              <option value="Schleswig-Holstein">Schleswig-Holstein (9%)</option>
              <option value="Thüringen">Thüringen (9%)</option>
            </select>
          </div>

          <div class="form-field">
            <label class="checkbox-label">
              <input
                v-model="taxConfig.freistellungsauftrag.enabled"
                type="checkbox"
                @change="updateTaxConfig"
              />
              <span>Freistellungsauftrag nutzen</span>
            </label>
          </div>

          <div v-if="taxConfig.freistellungsauftrag.enabled" class="form-field">
            <label class="checkbox-label">
              <input
                v-model="taxConfig.freistellungsauftrag.isMarried"
                type="checkbox"
                @change="updateTaxConfig"
              />
              <span>Verheiratet (2.000€ Freibetrag)</span>
            </label>
          </div>
        </div>

        <!-- ETF配置 -->
        <div class="input-group">
          <h3>ETF-Einstellungen</h3>

          <div class="form-field">
            <label class="checkbox-label">
              <input
                v-model="taxConfig.etfTeilfreistellung.enabled"
                type="checkbox"
                @change="updateTaxConfig"
              />
              <span>ETF-Teilfreistellung nutzen</span>
            </label>
          </div>

          <div v-if="taxConfig.etfTeilfreistellung.enabled" class="form-field">
            <label>ETF-Typ</label>
            <select
              v-model="taxConfig.etfTeilfreistellung.etfType"
              class="form-select"
              @change="updateTaxConfig"
            >
              <option value="EQUITY_ETF">Aktien-ETF (30% Teilfreistellung)</option>
              <option value="MIXED_ETF">Misch-ETF (15% Teilfreistellung)</option>
              <option value="BOND_ETF">Anleihen-ETF (0% Teilfreistellung)</option>
              <option value="REIT_ETF">Immobilien-ETF (60% Teilfreistellung)</option>
              <option value="COMMODITY_ETF">Rohstoff-ETF (0% Teilfreistellung)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 计算按钮 -->
      <div class="calculation-actions">
        <button
          @click="calculateInvestment"
          :disabled="isCalculating"
          class="calculate-button"
        >
          <Icon v-if="isCalculating" name="loader" size="16" class="animate-spin" />
          <Icon v-else name="calculator" size="16" />
          {{ isCalculating ? 'Berechnung läuft...' : 'Steuer berechnen' }}
        </button>

        <button @click="resetCalculation" class="reset-button">
          <Icon name="refresh-cw" size="16" />
          Zurücksetzen
        </button>
      </div>
    </div>

    <!-- 计算结果显示 -->
    <div v-if="calculationResult" class="results-section">
      <h2>Berechnungsergebnis</h2>

      <!-- 投资概览 -->
      <div class="investment-overview">
        <div class="overview-card">
          <div class="overview-title">Brutto-Ergebnis</div>
          <div class="overview-grid">
            <div class="overview-item">
              <span class="item-label">Eingezahlt</span>
              <span class="item-value">{{ formatCurrency(calculationResult.originalResult.totalContributions) }}</span>
            </div>
            <div class="overview-item">
              <span class="item-label">Kapitalertrag</span>
              <span class="item-value positive">{{ formatCurrency(calculationResult.originalResult.totalInterest) }}</span>
            </div>
            <div class="overview-item">
              <span class="item-label">Endkapital</span>
              <span class="item-value">{{ formatCurrency(calculationResult.originalResult.finalAmount) }}</span>
            </div>
          </div>
        </div>

        <div class="overview-card">
          <div class="overview-title">Nach Steuern</div>
          <div class="overview-grid">
            <div class="overview-item">
              <span class="item-label">Steuern</span>
              <span class="item-value negative">{{ formatCurrency(calculationResult.taxImpact.taxAmount) }}</span>
            </div>
            <div class="overview-item">
              <span class="item-label">Netto-Ertrag</span>
              <span class="item-value positive">{{ formatCurrency(calculationResult.taxCalculation.summary.netGains) }}</span>
            </div>
            <div class="overview-item">
              <span class="item-label">Netto-Endkapital</span>
              <span class="item-value">{{ formatCurrency(calculationResult.afterTaxResult.finalAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细税收结果 -->
      <TaxResultsDisplay
        :tax-result="calculationResult.taxCalculation"
        @optimize="showOptimizations"
        @export="exportCalculation"
        @configure="showTaxSettings"
      />
    </div>

    <!-- 优化建议 -->
    <div v-if="optimizationSuggestions.length > 0" class="optimizations-section">
      <h2>Optimierungsvorschläge</h2>

      <div class="suggestions-grid">
        <div
          v-for="(suggestion, index) in optimizationSuggestions"
          :key="index"
          class="suggestion-card"
          :class="`difficulty-${suggestion.difficulty}`"
        >
          <div class="suggestion-header">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-savings">
              {{ formatCurrency(suggestion.potentialSavings) }}
            </div>
          </div>
          <div class="suggestion-description">{{ suggestion.description }}</div>
          <div class="suggestion-meta">
            <span class="difficulty-badge" :class="`difficulty-${suggestion.difficulty}`">
              {{ getDifficultyLabel(suggestion.difficulty) }}
            </span>
            <span class="priority-badge">Priorität {{ suggestion.priority }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误显示 -->
    <div v-if="calculationError" class="error-section">
      <div class="error-card">
        <Icon name="alert-circle" size="20" />
        <div>
          <div class="error-title">Berechnungsfehler</div>
          <div class="error-message">{{ calculationError }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useTaxCalculation } from '@/composables/useTaxCalculation'
import TaxResultsDisplay from '@/components/tax/TaxResultsDisplay.vue'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency } from '@/utils/formatters'
import type { CompoundInterestResult } from '@/types/CalculatorTypes'

// 响应式数据
const investmentParams = reactive({
  initialAmount: 10000,
  monthlyAmount: 500,
  annualReturn: 7.0,
  years: 15
})

const taxConfig = reactive({
  abgeltungssteuer: {
    enabled: true,
    rate: 0.25
  },
  solidaritaetszuschlag: {
    enabled: true,
    rate: 0.055
  },
  churchTax: {
    enabled: false,
    state: 'Nordrhein-Westfalen',
    rate: 0.09
  },
  freistellungsauftrag: {
    enabled: true,
    isMarried: false,
    totalAmount: 1000,
    usedAmount: 0,
    allocations: []
  },
  etfTeilfreistellung: {
    enabled: false,
    etfType: 'EQUITY_ETF'
  }
})

const calculationResult = ref<any>(null)

// 使用税收计算Composable
const {
  isCalculating,
  calculationError,
  optimizationSuggestions,
  updateTaxConfiguration,
  calculateCompoundInterestTax,
  generateOptimizationSuggestions
} = useTaxCalculation()

// 计算属性
const isFormValid = computed(() => {
  return investmentParams.initialAmount >= 0 &&
         investmentParams.monthlyAmount >= 0 &&
         investmentParams.annualReturn >= 0 &&
         investmentParams.years > 0
})

// 方法
const handleInputChange = () => {
  if (calculationResult.value) {
    // 自动重新计算
    calculateInvestment()
  }
}

const updateTaxConfig = () => {
  updateTaxConfiguration(taxConfig)
  if (calculationResult.value) {
    calculateInvestment()
  }
}

const calculateInvestment = async () => {
  if (!isFormValid.value) return

  // 模拟复利计算结果
  const mockResult: CompoundInterestResult = {
    finalAmount: calculateFinalAmount(),
    totalContributions: investmentParams.initialAmount + (investmentParams.monthlyAmount * 12 * investmentParams.years),
    totalInterest: 0,
    effectiveRate: investmentParams.annualReturn,
    yearlyData: []
  }

  mockResult.totalInterest = mockResult.finalAmount - mockResult.totalContributions

  // 计算税收
  await calculateCompoundInterestTax(mockResult)
  calculationResult.value = calculationResult

  // 生成优化建议
  await generateOptimizationSuggestions(mockResult)
}

const calculateFinalAmount = (): number => {
  const monthlyRate = investmentParams.annualReturn / 100 / 12
  const totalMonths = investmentParams.years * 12

  // 初始投资的复利增长
  const initialGrowth = investmentParams.initialAmount * Math.pow(1 + monthlyRate, totalMonths)

  // 月度投资的复利增长
  const monthlyGrowth = investmentParams.monthlyAmount *
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)

  return initialGrowth + monthlyGrowth
}

const resetCalculation = () => {
  calculationResult.value = null
  optimizationSuggestions.value = []
}

const showOptimizations = () => {
  console.log('显示优化建议')
}

const exportCalculation = () => {
  console.log('导出计算结果')
}

const showTaxSettings = () => {
  console.log('显示税收设置')
}

const getDifficultyLabel = (difficulty: string): string => {
  const labels: Record<string, string> = {
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Schwer'
  }
  return labels[difficulty] || difficulty
}

// 初始计算
calculateInvestment()
</script>

<style scoped>
.abgeltungssteuer-example {
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

/* 计算输入区域 */
.calculation-input-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.calculation-input-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.input-grid {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6;
}

.input-group {
  @apply space-y-4;
}

.input-group h3 {
  @apply text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200;
}

.form-field {
  @apply space-y-2;
}

.form-field label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input,
.form-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply transition-colors;
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

/* 计算按钮 */
.calculation-actions {
  @apply flex gap-4 pt-6 border-t border-gray-200;
}

.calculate-button {
  @apply flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply disabled:bg-gray-400 disabled:cursor-not-allowed;
  @apply transition-colors;
}

.reset-button {
  @apply flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
  @apply transition-colors;
}

/* 结果区域 */
.results-section {
  @apply bg-white rounded-lg shadow-md p-6 border space-y-6;
}

.results-section h2 {
  @apply text-xl font-semibold text-gray-800;
}

/* 投资概览 */
.investment-overview {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.overview-card {
  @apply bg-gray-50 rounded-lg p-6 border border-gray-200;
}

.overview-title {
  @apply text-lg font-medium text-gray-800 mb-4;
}

.overview-grid {
  @apply space-y-3;
}

.overview-item {
  @apply flex justify-between items-center;
}

.item-label {
  @apply text-sm text-gray-600;
}

.item-value {
  @apply font-semibold text-gray-900;
}

.item-value.positive {
  @apply text-green-600;
}

.item-value.negative {
  @apply text-red-600;
}

/* 优化建议 */
.optimizations-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.optimizations-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.suggestions-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.suggestion-card {
  @apply bg-gray-50 rounded-lg p-4 border-l-4;
}

.suggestion-card.difficulty-easy {
  @apply border-l-green-500;
}

.suggestion-card.difficulty-medium {
  @apply border-l-yellow-500;
}

.suggestion-card.difficulty-hard {
  @apply border-l-red-500;
}

.suggestion-header {
  @apply flex justify-between items-start mb-2;
}

.suggestion-title {
  @apply font-medium text-gray-800;
}

.suggestion-savings {
  @apply text-sm font-bold text-green-600;
}

.suggestion-description {
  @apply text-sm text-gray-600 mb-3;
}

.suggestion-meta {
  @apply flex gap-2;
}

.difficulty-badge,
.priority-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.difficulty-badge.difficulty-easy {
  @apply bg-green-100 text-green-700;
}

.difficulty-badge.difficulty-medium {
  @apply bg-yellow-100 text-yellow-700;
}

.difficulty-badge.difficulty-hard {
  @apply bg-red-100 text-red-700;
}

.priority-badge {
  @apply bg-blue-100 text-blue-700;
}

/* 错误显示 */
.error-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.error-card {
  @apply flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700;
}

.error-title {
  @apply font-medium mb-1;
}

.error-message {
  @apply text-sm;
}

/* 动画 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .input-grid {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .investment-overview {
    @apply grid-cols-1;
  }

  .suggestions-grid {
    @apply grid-cols-1;
  }

  .calculation-actions {
    @apply flex-col;
  }

  .calculate-button,
  .reset-button {
    @apply w-full justify-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .calculation-input-section,
  .results-section,
  .optimizations-section,
  .error-section {
    @apply bg-gray-800 border-gray-700;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .calculation-input-section h2,
  .results-section h2,
  .optimizations-section h2,
  .input-group h3,
  .overview-title,
  .suggestion-title {
    @apply text-gray-100;
  }

  .overview-card,
  .suggestion-card {
    @apply bg-gray-700;
  }

  .form-input,
  .form-select {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .checkbox-label span {
    @apply text-gray-300;
  }

  .item-label {
    @apply text-gray-300;
  }

  .item-value {
    @apply text-gray-100;
  }

  .suggestion-description {
    @apply text-gray-300;
  }
}
</style>
