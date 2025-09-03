<!--
  Freistellungsauftrag管理示例
  展示德国免税额度管理的完整功能
-->

<template>
  <div class="freistellungsauftrag-example">
    <div class="example-header">
      <h1>Freistellungsauftrag-Verwaltung</h1>
      <p>Verwalten Sie Ihre Freibeträge für Kapitalerträge optimal</p>
    </div>

    <!-- 配置区域 -->
    <div class="configuration-section">
      <h2>Grundeinstellungen</h2>
      <div class="config-grid">
        <div class="config-group">
          <label class="config-label">
            <input
              v-model="isMarried"
              type="checkbox"
              @change="updateConfiguration"
            />
            <span>Verheiratet (2.000€ Freibetrag)</span>
          </label>
        </div>

        <div class="config-group">
          <label>Steuerjahr</label>
          <select v-model="currentYear" @change="updateConfiguration" class="config-select">
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div class="config-group">
          <div class="config-summary">
            <div class="summary-item">
              <span class="summary-label">Verfügbarer Freibetrag:</span>
              <span class="summary-value">{{ formatCurrency(totalAvailable) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Familienstand:</span>
              <span class="summary-value">{{ isMarried ? 'Verheiratet' : 'Ledig' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Freistellungsauftrag管理器 -->
    <FreistellungsauftragManager
      :is-married="isMarried"
      :current-year="currentYear"
      :initial-allocations="allocations"
      @allocations-change="handleAllocationsChange"
      @optimization-applied="handleOptimizationApplied"
    />

    <!-- 可视化展示 -->
    <div class="visualization-section">
      <h2>Visualisierung</h2>
      <FreistellungsauftragVisualization
        :allocations="allocations"
        :total-available="totalAvailable"
        :is-married="isMarried"
        :previous-year-data="previousYearData"
      />
    </div>

    <!-- 优化建议 */
    <div v-if="optimizationSuggestions.length > 0" class="optimization-section">
      <h2>Optimierungsvorschläge</h2>
      <div class="suggestions-grid">
        <div
          v-for="(suggestion, index) in optimizationSuggestions"
          :key="index"
          class="suggestion-card"
          :class="`priority-${suggestion.priority}`"
        >
          <div class="suggestion-header">
            <div class="suggestion-icon">
              <Icon :name="getSuggestionIcon(suggestion.type)" size="20" />
            </div>
            <div class="suggestion-meta">
              <span class="suggestion-type">{{ getSuggestionTypeLabel(suggestion.type) }}</span>
              <span class="suggestion-priority">Priorität {{ suggestion.priority }}</span>
            </div>
          </div>

          <div class="suggestion-content">
            <h3>{{ suggestion.title }}</h3>
            <p>{{ suggestion.description }}</p>

            <div v-if="suggestion.potentialSavings > 0" class="suggestion-savings">
              <Icon name="piggy-bank" size="16" />
              <span>Potenzielle Ersparnis: {{ formatCurrency(suggestion.potentialSavings) }}</span>
            </div>
          </div>

          <div class="suggestion-actions">
            <button @click="applySuggestion(suggestion)" class="suggestion-button">
              {{ getSuggestionActionLabel(suggestion.action) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 年度报告 */
    <div class="report-section">
      <div class="report-header">
        <h2>Jahresbericht {{ currentYear }}</h2>
        <div class="report-actions">
          <button @click="generateReport" class="report-button">
            <Icon name="file-text" size="16" />
            Bericht generieren
          </button>
          <button @click="exportData" class="report-button secondary">
            <Icon name="download" size="16" />
            Daten exportieren
          </button>
        </div>
      </div>

      <div v-if="annualReport" class="report-content">
        <div class="report-summary">
          <div class="report-card">
            <h3>Nutzungsübersicht</h3>
            <div class="report-stats">
              <div class="stat-item">
                <span class="stat-label">Gesamter Freibetrag</span>
                <span class="stat-value">{{ formatCurrency(annualReport.totalAllowance) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Genutzt</span>
                <span class="stat-value">{{ formatCurrency(annualReport.totalUsed) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Nutzungsgrad</span>
                <span class="stat-value">{{ formatPercentage(annualReport.usagePercentage) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Steuerersparnis</span>
                <span class="stat-value positive">{{ formatCurrency(annualReport.taxSavings) }}</span>
              </div>
            </div>
          </div>

          <div class="report-card">
            <h3>Verteilung nach Banken</h3>
            <div class="bank-distribution">
              <div
                v-for="(stats, bankName) in annualReport.bankStats"
                :key="bankName"
                class="bank-item"
              >
                <div class="bank-info">
                  <span class="bank-name">{{ bankName }}</span>
                  <span class="bank-accounts">{{ stats.accounts }} Konten</span>
                </div>
                <div class="bank-amounts">
                  <span class="bank-used">{{ formatCurrency(stats.used) }}</span>
                  <span class="bank-percentage">{{ formatPercentage((stats.used / annualReport.totalUsed) * 100) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="report-card">
            <h3>Verteilung nach Kontotyp</h3>
            <div class="account-type-distribution">
              <div
                v-for="(stats, accountType) in annualReport.accountTypeStats"
                :key="accountType"
                class="account-type-item"
              >
                <div class="account-type-info">
                  <span class="account-type-name">{{ getAccountTypeLabel(accountType) }}</span>
                  <span class="account-type-count">{{ stats.count }} Konten</span>
                </div>
                <div class="account-type-amounts">
                  <span class="account-type-used">{{ formatCurrency(stats.used) }}</span>
                  <span class="account-type-percentage">{{ formatPercentage((stats.used / annualReport.totalUsed) * 100) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="annualReport.potentialAdditionalSavings > 0" class="potential-savings">
          <div class="savings-card">
            <div class="savings-icon">
              <Icon name="trending-up" size="24" />
            </div>
            <div class="savings-content">
              <h3>Zusätzliches Sparpotenzial</h3>
              <p>Sie könnten weitere {{ formatCurrency(annualReport.potentialAdditionalSavings) }} an Steuern sparen, wenn Sie Ihren Freibetrag vollständig ausschöpfen.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模拟数据控制 -->
    <div class="demo-controls">
      <h3>Demo-Steuerung</h3>
      <div class="demo-buttons">
        <button @click="addSampleAllocations" class="demo-button">
          <Icon name="plus" size="16" />
          Beispiel-Zuteilungen hinzufügen
        </button>
        <button @click="simulateUsage" class="demo-button">
          <Icon name="play" size="16" />
          Nutzung simulieren
        </button>
        <button @click="resetDemo" class="demo-button secondary">
          <Icon name="refresh-cw" size="16" />
          Demo zurücksetzen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import FreistellungsauftragManager from '@/components/tax/FreistellungsauftragManager.vue'
import FreistellungsauftragVisualization from '@/components/tax/FreistellungsauftragVisualization.vue'
import Icon from '@/components/ui/BaseIcon.vue'
import { FreistellungsauftragService } from '@/services/FreistellungsauftragService'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import type {
  FreistellungsauftragAllocation,
  FreistellungsauftragOptimization,
  FreistellungsauftragReport
} from '@/types/FreistellungsauftragTypes'

// 响应式数据
const isMarried = ref(false)
const currentYear = ref(2024)
const allocations = ref<FreistellungsauftragAllocation[]>([])
const optimizationSuggestions = ref<FreistellungsauftragOptimization[]>([])
const annualReport = ref<FreistellungsauftragReport | null>(null)

// 前一年数据（模拟）
const previousYearData = reactive({
  used: 650,
  available: 1000
})

// Freistellungsauftrag服务
let freistellungsauftragService: FreistellungsauftragService

// 计算属性
const totalAvailable = computed(() => {
  return isMarried.value ? 2000 : 1000
})

// 方法
const updateConfiguration = () => {
  freistellungsauftragService = new FreistellungsauftragService(isMarried.value, currentYear.value)
  freistellungsauftragService.setAllocations(allocations.value)
  updateOptimizationSuggestions()
}

const handleAllocationsChange = (newAllocations: FreistellungsauftragAllocation[]) => {
  allocations.value = newAllocations
  freistellungsauftragService.setAllocations(newAllocations)
  updateOptimizationSuggestions()
}

const handleOptimizationApplied = (suggestion: any) => {
  console.log('优化建议已应用:', suggestion)
  updateOptimizationSuggestions()
}

const updateOptimizationSuggestions = () => {
  if (freistellungsauftragService) {
    optimizationSuggestions.value = freistellungsauftragService.generateOptimizationSuggestions()
  }
}

const generateReport = () => {
  if (freistellungsauftragService) {
    annualReport.value = freistellungsauftragService.generateAnnualReport()
  }
}

const exportData = () => {
  if (freistellungsauftragService) {
    const data = freistellungsauftragService.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `freistellungsauftrag-${currentYear.value}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

const applySuggestion = (suggestion: FreistellungsauftragOptimization) => {
  console.log('应用建议:', suggestion)
  // 这里可以实现具体的建议应用逻辑
}

const getSuggestionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'underutilized': 'trending-up',
    'over_allocated': 'alert-triangle',
    'rebalance': 'shuffle',
    'year_end': 'calendar'
  }
  return icons[type] || 'info'
}

const getSuggestionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'underutilized': 'Unterausnutzung',
    'over_allocated': 'Überzuteilung',
    'rebalance': 'Neuausrichtung',
    'year_end': 'Jahresende'
  }
  return labels[type] || type
}

const getSuggestionActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    'increase_investments': 'Investitionen erhöhen',
    'reduce_allocations': 'Zuteilungen reduzieren',
    'rebalance_allocations': 'Neu ausbalancieren',
    'year_end_optimization': 'Jahresende optimieren'
  }
  return labels[action] || 'Anwenden'
}

const getAccountTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    depot: 'Wertpapierdepot',
    savings: 'Sparkonto',
    fixed: 'Festgeld',
    etf: 'ETF-Sparplan',
    other: 'Sonstiges'
  }
  return labels[type] || type
}

// Demo控制方法
const addSampleAllocations = () => {
  const sampleAllocations: Omit<FreistellungsauftragAllocation, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      bankName: 'Deutsche Bank',
      accountType: 'depot',
      amount: 400,
      used: 250,
      notes: 'Hauptdepot für ETF-Sparpläne'
    },
    {
      bankName: 'ING',
      accountType: 'etf',
      amount: 300,
      used: 180,
      notes: 'ETF-Sparplan'
    },
    {
      bankName: 'Sparkasse',
      accountType: 'savings',
      amount: 200,
      used: 120,
      notes: 'Tagesgeldkonto'
    }
  ]

  sampleAllocations.forEach(allocation => {
    const newAllocation = freistellungsauftragService.addAllocation(allocation)
    allocations.value.push(newAllocation)
  })

  updateOptimizationSuggestions()
}

const simulateUsage = () => {
  allocations.value.forEach(allocation => {
    const additionalUsage = Math.random() * (allocation.amount - allocation.used) * 0.3
    allocation.used = Math.min(allocation.amount, allocation.used + additionalUsage)
    allocation.updatedAt = new Date()
  })

  freistellungsauftragService.setAllocations(allocations.value)
  updateOptimizationSuggestions()
}

const resetDemo = () => {
  allocations.value = []
  optimizationSuggestions.value = []
  annualReport.value = null
  freistellungsauftragService.setAllocations([])
}

// 生命周期
onMounted(() => {
  updateConfiguration()
})
</script>

<style scoped>
.freistellungsauftrag-example {
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

/* 配置区域 */
.configuration-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.configuration-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.config-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.config-group {
  @apply space-y-2;
}

.config-label {
  @apply flex items-center gap-2 cursor-pointer;
}

.config-label input[type="checkbox"] {
  @apply rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

.config-label span {
  @apply text-sm text-gray-700;
}

.config-group label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.config-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.config-summary {
  @apply bg-gray-50 rounded-lg p-4 space-y-2;
}

.summary-item {
  @apply flex justify-between text-sm;
}

.summary-label {
  @apply text-gray-600;
}

.summary-value {
  @apply font-medium text-gray-900;
}

/* 可视化区域 */
.visualization-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.visualization-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

/* 优化建议区域 */
.optimization-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.optimization-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.suggestions-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.suggestion-card {
  @apply bg-gray-50 rounded-lg border-l-4 p-6;
}

.suggestion-card.priority-1 {
  @apply border-l-red-500;
}

.suggestion-card.priority-2 {
  @apply border-l-yellow-500;
}

.suggestion-card.priority-3 {
  @apply border-l-blue-500;
}

.suggestion-header {
  @apply flex items-start justify-between mb-4;
}

.suggestion-icon {
  @apply flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600;
}

.suggestion-meta {
  @apply text-right;
}

.suggestion-type {
  @apply block text-xs text-gray-500 mb-1;
}

.suggestion-priority {
  @apply text-xs font-medium text-gray-700;
}

.suggestion-content {
  @apply space-y-3 mb-4;
}

.suggestion-content h3 {
  @apply font-semibold text-gray-900;
}

.suggestion-content p {
  @apply text-sm text-gray-600;
}

.suggestion-savings {
  @apply flex items-center gap-2 text-sm font-medium text-green-600;
}

.suggestion-actions {
  @apply pt-4 border-t border-gray-200;
}

.suggestion-button {
  @apply w-full px-4 py-2 bg-blue-600 text-white rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors;
}

/* 报告区域 */
.report-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.report-header {
  @apply flex items-center justify-between mb-6;
}

.report-header h2 {
  @apply text-xl font-semibold text-gray-800;
}

.report-actions {
  @apply flex gap-3;
}

.report-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-md font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply transition-colors;
}

.report-button:not(.secondary) {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.report-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

.report-content {
  @apply space-y-6;
}

.report-summary {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.report-card {
  @apply bg-gray-50 rounded-lg p-6 border border-gray-200;
}

.report-card h3 {
  @apply text-lg font-semibold text-gray-800 mb-4;
}

.report-stats {
  @apply space-y-3;
}

.stat-item {
  @apply flex justify-between;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply font-semibold text-gray-900;
}

.stat-value.positive {
  @apply text-green-600;
}

/* 银行分布 */
.bank-distribution {
  @apply space-y-3;
}

.bank-item {
  @apply flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200;
}

.bank-info {
  @apply flex-1;
}

.bank-name {
  @apply font-medium text-gray-900;
}

.bank-accounts {
  @apply text-xs text-gray-500;
}

.bank-amounts {
  @apply text-right;
}

.bank-used {
  @apply block font-semibold text-gray-900;
}

.bank-percentage {
  @apply text-xs text-gray-500;
}

/* 账户类型分布 */
.account-type-distribution {
  @apply space-y-3;
}

.account-type-item {
  @apply flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200;
}

.account-type-info {
  @apply flex-1;
}

.account-type-name {
  @apply font-medium text-gray-900;
}

.account-type-count {
  @apply text-xs text-gray-500;
}

.account-type-amounts {
  @apply text-right;
}

.account-type-used {
  @apply block font-semibold text-gray-900;
}

.account-type-percentage {
  @apply text-xs text-gray-500;
}

/* 潜在节省 */
.potential-savings {
  @apply mt-6;
}

.savings-card {
  @apply flex items-start gap-4 p-6 bg-green-50 border border-green-200 rounded-lg;
}

.savings-icon {
  @apply flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600;
}

.savings-content h3 {
  @apply font-semibold text-green-900 mb-2;
}

.savings-content p {
  @apply text-sm text-green-700;
}

/* Demo控制 */
.demo-controls {
  @apply bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300;
}

.demo-controls h3 {
  @apply text-lg font-semibold text-gray-800 mb-4;
}

.demo-buttons {
  @apply flex flex-wrap gap-3;
}

.demo-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-md font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply transition-colors;
}

.demo-button:not(.secondary) {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.demo-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .config-grid {
    @apply grid-cols-1;
  }

  .suggestions-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .report-summary {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .report-header {
    @apply flex-col items-start gap-4;
  }

  .report-actions {
    @apply w-full justify-between;
  }

  .suggestions-grid {
    @apply grid-cols-1;
  }

  .demo-buttons {
    @apply flex-col;
  }

  .demo-button {
    @apply w-full justify-center;
  }

  .bank-item,
  .account-type-item {
    @apply flex-col items-start gap-2;
  }

  .bank-amounts,
  .account-type-amounts {
    @apply text-left;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .configuration-section,
  .visualization-section,
  .optimization-section,
  .report-section {
    @apply bg-gray-800 border-gray-700;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .configuration-section h2,
  .visualization-section h2,
  .optimization-section h2,
  .report-header h2 {
    @apply text-gray-100;
  }

  .config-summary,
  .suggestion-card,
  .report-card {
    @apply bg-gray-700;
  }

  .config-select {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .config-label span {
    @apply text-gray-300;
  }

  .summary-label,
  .stat-label {
    @apply text-gray-300;
  }

  .summary-value,
  .stat-value {
    @apply text-gray-100;
  }

  .suggestion-content h3 {
    @apply text-gray-100;
  }

  .suggestion-content p {
    @apply text-gray-300;
  }

  .report-card h3 {
    @apply text-gray-100;
  }

  .bank-item,
  .account-type-item {
    @apply bg-gray-700 border-gray-600;
  }

  .bank-name,
  .account-type-name,
  .bank-used,
  .account-type-used {
    @apply text-gray-100;
  }

  .bank-accounts,
  .account-type-count,
  .bank-percentage,
  .account-type-percentage {
    @apply text-gray-400;
  }

  .savings-card {
    @apply bg-green-900 border-green-700;
  }

  .savings-icon {
    @apply bg-green-800 text-green-300;
  }

  .savings-content h3 {
    @apply text-green-100;
  }

  .savings-content p {
    @apply text-green-300;
  }

  .demo-controls {
    @apply bg-gray-700 border-gray-600;
  }

  .demo-controls h3 {
    @apply text-gray-100;
  }
}
</style>
