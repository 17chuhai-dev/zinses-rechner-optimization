<!--
  税收结果显示组件
  展示德国税收计算结果，包括Abgeltungssteuer、Solidaritätszuschlag、教会税等
-->

<template>
  <div class="tax-results-display">
    <!-- 税收摘要卡片 -->
    <div class="tax-summary-card">
      <div class="card-header">
        <h3 class="card-title">
          <Icon name="calculator" size="20" />
          Steuerberechnung
        </h3>
        <div class="tax-status" :class="taxStatusClass">
          <Icon :name="taxStatusIcon" size="16" />
          <span>{{ taxStatusText }}</span>
        </div>
      </div>

      <div class="tax-overview">
        <div class="overview-item primary">
          <div class="item-label">Kapitalertrag (brutto)</div>
          <div class="item-value">{{ formatCurrency(taxResult.capitalGains) }}</div>
        </div>

        <div class="overview-item negative">
          <div class="item-label">Gesamte Steuern</div>
          <div class="item-value">{{ formatCurrency(taxResult.summary.totalTaxes) }}</div>
        </div>

        <div class="overview-item positive">
          <div class="item-label">Kapitalertrag (netto)</div>
          <div class="item-value">{{ formatCurrency(taxResult.summary.netGains) }}</div>
        </div>

        <div class="overview-item">
          <div class="item-label">Effektiver Steuersatz</div>
          <div class="item-value">{{ formatPercentage(taxResult.summary.effectiveTaxRate) }}</div>
        </div>
      </div>
    </div>

    <!-- 详细税收分解 -->
    <div class="tax-breakdown-card">
      <div class="card-header">
        <h4 class="card-title">Steueraufschlüsselung</h4>
        <button
          @click="toggleBreakdown"
          class="toggle-button"
          :class="{ 'expanded': showBreakdown }"
        >
          <Icon :name="showBreakdown ? 'chevron-up' : 'chevron-down'" size="16" />
        </button>
      </div>

      <Transition name="breakdown-expand">
        <div v-if="showBreakdown" class="breakdown-content">
          <!-- Abgeltungssteuer -->
          <div class="breakdown-item">
            <div class="breakdown-header">
              <div class="breakdown-title">
                <Icon name="percent" size="16" />
                Abgeltungssteuer (25%)
              </div>
              <div class="breakdown-amount">
                {{ formatCurrency(taxResult.abgeltungssteuer.abgeltungssteuer) }}
              </div>
            </div>
            <div class="breakdown-details">
              <div class="detail-row">
                <span>Steuerpflichtiger Betrag:</span>
                <span>{{ formatCurrency(taxResult.abgeltungssteuer.taxableGains) }}</span>
              </div>
              <div class="detail-row">
                <span>Steuersatz:</span>
                <span>{{ formatPercentage(taxResult.abgeltungssteuer.breakdown.abgeltungssteuerRate) }}</span>
              </div>
            </div>
          </div>

          <!-- Solidaritätszuschlag -->
          <div v-if="taxResult.abgeltungssteuer.solidaritaetszuschlag > 0" class="breakdown-item">
            <div class="breakdown-header">
              <div class="breakdown-title">
                <Icon name="flag" size="16" />
                Solidaritätszuschlag (5,5%)
              </div>
              <div class="breakdown-amount">
                {{ formatCurrency(taxResult.abgeltungssteuer.solidaritaetszuschlag) }}
              </div>
            </div>
            <div class="breakdown-details">
              <div class="detail-row">
                <span>Bemessungsgrundlage:</span>
                <span>{{ formatCurrency(taxResult.abgeltungssteuer.abgeltungssteuer) }}</span>
              </div>
              <div class="detail-row">
                <span>Steuersatz:</span>
                <span>{{ formatPercentage(taxResult.abgeltungssteuer.breakdown.solidaritaetszuschlagRate) }}</span>
              </div>
            </div>
          </div>

          <!-- Kirchensteuer -->
          <div v-if="taxResult.abgeltungssteuer.churchTax > 0" class="breakdown-item">
            <div class="breakdown-header">
              <div class="breakdown-title">
                <Icon name="home" size="16" />
                Kirchensteuer
              </div>
              <div class="breakdown-amount">
                {{ formatCurrency(taxResult.abgeltungssteuer.churchTax) }}
              </div>
            </div>
            <div class="breakdown-details">
              <div class="detail-row">
                <span>Bemessungsgrundlage:</span>
                <span>{{ formatCurrency(taxResult.abgeltungssteuer.abgeltungssteuer) }}</span>
              </div>
              <div class="detail-row">
                <span>Steuersatz:</span>
                <span>{{ formatPercentage(taxResult.abgeltungssteuer.breakdown.churchTaxRate) }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Freistellungsauftrag -->
    <div v-if="taxResult.freistellungsauftrag.enabled" class="freistellungsauftrag-card">
      <div class="card-header">
        <h4 class="card-title">
          <Icon name="shield" size="20" />
          Freistellungsauftrag
        </h4>
        <div class="utilization-badge" :class="utilizationClass">
          {{ formatPercentage(utilizationPercentage) }} genutzt
        </div>
      </div>

      <div class="freistellungsauftrag-content">
        <div class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${utilizationPercentage}%` }"
            ></div>
          </div>
          <div class="progress-labels">
            <span>{{ formatCurrency(taxResult.freistellungsauftrag.usedAmount) }}</span>
            <span>{{ formatCurrency(taxResult.freistellungsauftrag.totalAvailable) }}</span>
          </div>
        </div>

        <div class="freistellungsauftrag-details">
          <div class="detail-item">
            <span class="detail-label">Verfügbarer Freibetrag:</span>
            <span class="detail-value">{{ formatCurrency(taxResult.freistellungsauftrag.totalAvailable) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Angewendet:</span>
            <span class="detail-value positive">{{ formatCurrency(taxResult.freistellungsauftrag.applicableAmount) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Verbleibt:</span>
            <span class="detail-value">{{ formatCurrency(taxResult.freistellungsauftrag.remainingAmount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ETF Teilfreistellung -->
    <div v-if="taxResult.etfTeilfreistellung" class="etf-teilfreistellung-card">
      <div class="card-header">
        <h4 class="card-title">
          <Icon name="trending-up" size="20" />
          ETF-Teilfreistellung
        </h4>
        <div class="etf-type-badge">
          {{ getETFTypeLabel(taxResult.etfTeilfreistellung.etfType) }}
        </div>
      </div>

      <div class="etf-content">
        <div class="etf-overview">
          <div class="etf-item">
            <div class="etf-label">ETF-Ertrag</div>
            <div class="etf-value">{{ formatCurrency(taxResult.etfTeilfreistellung.etfGains) }}</div>
          </div>
          <div class="etf-item positive">
            <div class="etf-label">Teilfreistellung ({{ formatPercentage(taxResult.etfTeilfreistellung.teilfreistellungRate) }})</div>
            <div class="etf-value">{{ formatCurrency(taxResult.etfTeilfreistellung.teilfreistellungAmount) }}</div>
          </div>
          <div class="etf-item">
            <div class="etf-label">Steuerpflichtiger Betrag</div>
            <div class="etf-value">{{ formatCurrency(taxResult.etfTeilfreistellung.taxableAmount) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 税收节省摘要 -->
    <div v-if="taxResult.summary.taxSavings > 0" class="tax-savings-card">
      <div class="card-header">
        <h4 class="card-title">
          <Icon name="piggy-bank" size="20" />
          Steuerersparnis
        </h4>
      </div>

      <div class="savings-content">
        <div class="savings-amount">
          <div class="savings-value">{{ formatCurrency(taxResult.summary.taxSavings) }}</div>
          <div class="savings-label">Gesamte Ersparnis</div>
        </div>

        <div class="savings-breakdown">
          <div v-if="taxResult.freistellungsauftrag.applicableAmount > 0" class="savings-item">
            <Icon name="shield" size="14" />
            <span>Freistellungsauftrag: {{ formatCurrency(taxResult.freistellungsauftrag.applicableAmount * 0.25) }}</span>
          </div>
          <div v-if="taxResult.etfTeilfreistellung?.teilfreistellungAmount" class="savings-item">
            <Icon name="trending-up" size="14" />
            <span>ETF-Teilfreistellung: {{ formatCurrency(taxResult.etfTeilfreistellung.teilfreistellungAmount * 0.25) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="tax-actions">
      <button @click="$emit('optimize')" class="action-button primary">
        <Icon name="zap" size="16" />
        Optimierung vorschlagen
      </button>
      <button @click="$emit('export')" class="action-button secondary">
        <Icon name="download" size="16" />
        Steuerberechnung exportieren
      </button>
      <button @click="$emit('configure')" class="action-button secondary">
        <Icon name="settings" size="16" />
        Steuereinstellungen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TaxCalculationResult } from '@/types/GermanTaxTypes'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// Props定义
interface Props {
  taxResult: TaxCalculationResult
  showOptimizations?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showOptimizations: true
})

// Emits定义
interface Emits {
  optimize: []
  export: []
  configure: []
}

const emit = defineEmits<Emits>()

// 响应式数据
const showBreakdown = ref(false)

// 计算属性
const taxStatusClass = computed(() => {
  const rate = props.taxResult.summary.effectiveTaxRate
  if (rate < 15) return 'status-low'
  if (rate < 25) return 'status-medium'
  return 'status-high'
})

const taxStatusIcon = computed(() => {
  const rate = props.taxResult.summary.effectiveTaxRate
  if (rate < 15) return 'check-circle'
  if (rate < 25) return 'alert-circle'
  return 'x-circle'
})

const taxStatusText = computed(() => {
  const rate = props.taxResult.summary.effectiveTaxRate
  if (rate < 15) return 'Niedrige Steuerbelastung'
  if (rate < 25) return 'Moderate Steuerbelastung'
  return 'Hohe Steuerbelastung'
})

const utilizationPercentage = computed(() => {
  if (!props.taxResult.freistellungsauftrag.enabled) return 0
  const total = props.taxResult.freistellungsauftrag.totalAvailable
  const used = props.taxResult.freistellungsauftrag.usedAmount + props.taxResult.freistellungsauftrag.applicableAmount
  return total > 0 ? (used / total) * 100 : 0
})

const utilizationClass = computed(() => {
  const percentage = utilizationPercentage.value
  if (percentage < 50) return 'utilization-low'
  if (percentage < 90) return 'utilization-medium'
  return 'utilization-high'
})

// 方法
const toggleBreakdown = () => {
  showBreakdown.value = !showBreakdown.value
}

const getETFTypeLabel = (etfType: string): string => {
  const labels: Record<string, string> = {
    'EQUITY_ETF': 'Aktien-ETF',
    'MIXED_ETF': 'Misch-ETF',
    'BOND_ETF': 'Anleihen-ETF',
    'REIT_ETF': 'Immobilien-ETF',
    'COMMODITY_ETF': 'Rohstoff-ETF'
  }
  return labels[etfType] || etfType
}
</script>

<style scoped>
.tax-results-display {
  @apply space-y-6;
}

/* 卡片基础样式 */
.tax-summary-card,
.tax-breakdown-card,
.freistellungsauftrag-card,
.etf-teilfreistellung-card,
.tax-savings-card {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.card-title {
  @apply flex items-center gap-2 text-lg font-semibold text-gray-800;
}

/* 税收摘要卡片 */
.tax-status {
  @apply flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium;
}

.tax-status.status-low {
  @apply bg-green-100 text-green-700;
}

.tax-status.status-medium {
  @apply bg-yellow-100 text-yellow-700;
}

.tax-status.status-high {
  @apply bg-red-100 text-red-700;
}

.tax-overview {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.overview-item {
  @apply bg-gray-50 rounded-lg p-4 text-center;
}

.overview-item.primary {
  @apply bg-blue-50 border border-blue-200;
}

.overview-item.negative {
  @apply bg-red-50 border border-red-200;
}

.overview-item.positive {
  @apply bg-green-50 border border-green-200;
}

.item-label {
  @apply text-sm text-gray-600 mb-1;
}

.item-value {
  @apply text-xl font-bold text-gray-900;
}

.overview-item.primary .item-value {
  @apply text-blue-900;
}

.overview-item.negative .item-value {
  @apply text-red-900;
}

.overview-item.positive .item-value {
  @apply text-green-900;
}

/* 税收分解卡片 */
.toggle-button {
  @apply p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-all;
}

.toggle-button.expanded {
  @apply text-blue-600 bg-blue-50;
}

.breakdown-expand-enter-active,
.breakdown-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.breakdown-expand-enter-from,
.breakdown-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.breakdown-expand-enter-to,
.breakdown-expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

.breakdown-content {
  @apply space-y-4;
}

.breakdown-item {
  @apply bg-gray-50 rounded-lg p-4 border border-gray-200;
}

.breakdown-header {
  @apply flex items-center justify-between mb-3;
}

.breakdown-title {
  @apply flex items-center gap-2 font-medium text-gray-800;
}

.breakdown-amount {
  @apply text-lg font-bold text-gray-900;
}

.breakdown-details {
  @apply space-y-2;
}

.detail-row {
  @apply flex justify-between text-sm;
}

.detail-row span:first-child {
  @apply text-gray-600;
}

.detail-row span:last-child {
  @apply font-medium text-gray-900;
}

/* Freistellungsauftrag卡片 */
.utilization-badge {
  @apply px-3 py-1 rounded-full text-sm font-medium;
}

.utilization-badge.utilization-low {
  @apply bg-red-100 text-red-700;
}

.utilization-badge.utilization-medium {
  @apply bg-yellow-100 text-yellow-700;
}

.utilization-badge.utilization-high {
  @apply bg-green-100 text-green-700;
}

.freistellungsauftrag-content {
  @apply space-y-4;
}

.progress-container {
  @apply space-y-2;
}

.progress-bar {
  @apply w-full h-3 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500;
}

.progress-labels {
  @apply flex justify-between text-sm text-gray-600;
}

.freistellungsauftrag-details {
  @apply space-y-2;
}

.detail-item {
  @apply flex justify-between items-center;
}

.detail-label {
  @apply text-sm text-gray-600;
}

.detail-value {
  @apply font-medium text-gray-900;
}

.detail-value.positive {
  @apply text-green-600;
}

/* ETF Teilfreistellung卡片 */
.etf-type-badge {
  @apply px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium;
}

.etf-content {
  @apply space-y-4;
}

.etf-overview {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.etf-item {
  @apply bg-gray-50 rounded-lg p-4 text-center;
}

.etf-item.positive {
  @apply bg-green-50 border border-green-200;
}

.etf-label {
  @apply text-sm text-gray-600 mb-1;
}

.etf-value {
  @apply text-lg font-bold text-gray-900;
}

.etf-item.positive .etf-value {
  @apply text-green-900;
}

/* 税收节省卡片 */
.savings-content {
  @apply space-y-4;
}

.savings-amount {
  @apply text-center bg-green-50 rounded-lg p-6 border border-green-200;
}

.savings-value {
  @apply text-3xl font-bold text-green-900 mb-1;
}

.savings-label {
  @apply text-sm text-green-700;
}

.savings-breakdown {
  @apply space-y-2;
}

.savings-item {
  @apply flex items-center gap-2 text-sm text-gray-700;
}

/* 操作按钮 */
.tax-actions {
  @apply flex flex-wrap gap-3 pt-4 border-t border-gray-200;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .tax-overview {
    @apply grid-cols-1;
  }

  .etf-overview {
    @apply grid-cols-1;
  }

  .tax-actions {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }

  .card-header {
    @apply flex-col items-start gap-2;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .tax-summary-card,
  .tax-breakdown-card,
  .freistellungsauftrag-card,
  .etf-teilfreistellung-card,
  .tax-savings-card {
    @apply bg-gray-800 border-gray-700;
  }

  .card-title {
    @apply text-gray-100;
  }

  .overview-item,
  .breakdown-item,
  .etf-item {
    @apply bg-gray-700;
  }

  .item-label,
  .detail-label,
  .etf-label {
    @apply text-gray-300;
  }

  .item-value,
  .breakdown-amount,
  .detail-value,
  .etf-value {
    @apply text-gray-100;
  }
}
</style>

<style scoped>
.tax-results-display {
  @apply space-y-6;
}

/* 卡片基础样式 */
.tax-summary-card,
.tax-breakdown-card,
.freistellungsauftrag-card,
.etf-teilfreistellung-card,
.tax-savings-card {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.card-title {
  @apply flex items-center gap-2 text-lg font-semibold text-gray-800;
}

/* 税收摘要卡片 */
.tax-status {
  @apply flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium;
}

.tax-status.status-low {
  @apply bg-green-100 text-green-700;
}

.tax-status.status-medium {
  @apply bg-yellow-100 text-yellow-700;
}

.tax-status.status-high {
  @apply bg-red-100 text-red-700;
}

.tax-overview {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.overview-item {
  @apply bg-gray-50 rounded-lg p-4 text-center;
}

.overview-item.primary {
  @apply bg-blue-50 border border-blue-200;
}

.overview-item.negative {
  @apply bg-red-50 border border-red-200;
}

.overview-item.positive {
  @apply bg-green-50 border border-green-200;
}

.item-label {
  @apply text-sm text-gray-600 mb-1;
}

.item-value {
  @apply text-xl font-bold text-gray-900;
}

.overview-item.primary .item-value {
  @apply text-blue-900;
}

.overview-item.negative .item-value {
  @apply text-red-900;
}

.overview-item.positive .item-value {
  @apply text-green-900;
}

/* 税收分解卡片 */
.toggle-button {
  @apply p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-all;
}

.toggle-button.expanded {
  @apply text-blue-600 bg-blue-50;
}

.breakdown-expand-enter-active,
.breakdown-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.breakdown-expand-enter-from,
.breakdown-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.breakdown-expand-enter-to,
.breakdown-expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

.breakdown-content {
  @apply space-y-4;
}

.breakdown-item {
  @apply bg-gray-50 rounded-lg p-4 border border-gray-200;
}

.breakdown-header {
  @apply flex items-center justify-between mb-3;
}

.breakdown-title {
  @apply flex items-center gap-2 font-medium text-gray-800;
}

.breakdown-amount {
  @apply text-lg font-bold text-gray-900;
}

.breakdown-details {
  @apply space-y-2;
}

.detail-row {
  @apply flex justify-between text-sm;
}

.detail-row span:first-child {
  @apply text-gray-600;
}

.detail-row span:last-child {
  @apply font-medium text-gray-900;
}

/* Freistellungsauftrag卡片 */
.utilization-badge {
  @apply px-3 py-1 rounded-full text-sm font-medium;
}

.utilization-badge.utilization-low {
  @apply bg-red-100 text-red-700;
}

.utilization-badge.utilization-medium {
  @apply bg-yellow-100 text-yellow-700;
}

.utilization-badge.utilization-high {
  @apply bg-green-100 text-green-700;
}

.freistellungsauftrag-content {
  @apply space-y-4;
}

.progress-container {
  @apply space-y-2;
}

.progress-bar {
  @apply w-full h-3 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500;
}

.progress-labels {
  @apply flex justify-between text-sm text-gray-600;
}

.freistellungsauftrag-details {
  @apply space-y-2;
}

.detail-item {
  @apply flex justify-between items-center;
}

.detail-label {
  @apply text-sm text-gray-600;
}

.detail-value {
  @apply font-medium text-gray-900;
}

.detail-value.positive {
  @apply text-green-600;
}

/* ETF Teilfreistellung卡片 */
.etf-type-badge {
  @apply px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium;
}

.etf-content {
  @apply space-y-4;
}

.etf-overview {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.etf-item {
  @apply bg-gray-50 rounded-lg p-4 text-center;
}

.etf-item.positive {
  @apply bg-green-50 border border-green-200;
}

.etf-label {
  @apply text-sm text-gray-600 mb-1;
}

.etf-value {
  @apply text-lg font-bold text-gray-900;
}

.etf-item.positive .etf-value {
  @apply text-green-900;
}

/* 税收节省卡片 */
.savings-content {
  @apply space-y-4;
}

.savings-amount {
  @apply text-center bg-green-50 rounded-lg p-6 border border-green-200;
}

.savings-value {
  @apply text-3xl font-bold text-green-900 mb-1;
}

.savings-label {
  @apply text-sm text-green-700;
}

.savings-breakdown {
  @apply space-y-2;
}

.savings-item {
  @apply flex items-center gap-2 text-sm text-gray-700;
}

/* 操作按钮 */
.tax-actions {
  @apply flex flex-wrap gap-3 pt-4 border-t border-gray-200;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .tax-overview {
    @apply grid-cols-1;
  }

  .etf-overview {
    @apply grid-cols-1;
  }

  .tax-actions {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }

  .card-header {
    @apply flex-col items-start gap-2;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .tax-summary-card,
  .tax-breakdown-card,
  .freistellungsauftrag-card,
  .etf-teilfreistellung-card,
  .tax-savings-card {
    @apply bg-gray-800 border-gray-700;
  }

  .card-title {
    @apply text-gray-100;
  }

  .overview-item,
  .breakdown-item,
  .etf-item {
    @apply bg-gray-700;
  }

  .overview-item.primary {
    @apply bg-blue-900 border-blue-700;
  }

  .overview-item.negative {
    @apply bg-red-900 border-red-700;
  }

  .overview-item.positive {
    @apply bg-green-900 border-green-700;
  }

  .item-label,
  .detail-label,
  .etf-label {
    @apply text-gray-300;
  }

  .item-value,
  .breakdown-amount,
  .detail-value,
  .etf-value {
    @apply text-gray-100;
  }

  .savings-amount {
    @apply bg-green-900 border-green-700;
  }

  .savings-value {
    @apply text-green-100;
  }

  .savings-label {
    @apply text-green-300;
  }
}
</style>
