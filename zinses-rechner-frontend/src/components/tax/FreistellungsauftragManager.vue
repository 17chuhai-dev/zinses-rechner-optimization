<!--
  Freistellungsauftrag管理组件
  管理德国免税额度的分配和使用
-->

<template>
  <div class="freistellungsauftrag-manager">
    <!-- 管理器头部 -->
    <div class="manager-header">
      <h2 class="manager-title">
        <Icon name="shield" size="24" />
        Freistellungsauftrag-Verwaltung
      </h2>
      <div class="header-actions">
        <button @click="addNewAllocation" class="action-button primary">
          <Icon name="plus" size="16" />
          Neue Zuteilung
        </button>
        <button @click="optimizeAllocations" class="action-button secondary">
          <Icon name="zap" size="16" />
          Optimieren
        </button>
      </div>
    </div>

    <!-- 总览卡片 -->
    <div class="overview-section">
      <div class="overview-card total">
        <div class="card-header">
          <h3>Gesamter Freibetrag</h3>
          <div class="status-badge" :class="statusClass">
            {{ statusText }}
          </div>
        </div>
        <div class="card-content">
          <div class="amount-display">
            <AnimatedValue
              :value="totalAvailable"
              format="currency"
              size="xl"
              weight="bold"
              :highlight-change="true"
            />
          </div>
          <div class="amount-details">
            <div class="detail-item">
              <span class="detail-label">Familienstand:</span>
              <span class="detail-value">{{ isMarried ? 'Verheiratet' : 'Ledig' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Steuerjahr:</span>
              <span class="detail-value">{{ currentYear }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="overview-card used">
        <div class="card-header">
          <h3>Bereits genutzt</h3>
        </div>
        <div class="card-content">
          <div class="amount-display">
            <AnimatedValue
              :value="totalUsed"
              format="currency"
              size="xl"
              weight="bold"
              :color-by-value="true"
            />
          </div>
          <div class="usage-percentage">
            {{ formatPercentage(usagePercentage) }} des Freibetrags
          </div>
        </div>
      </div>

      <div class="overview-card remaining">
        <div class="card-header">
          <h3>Verfügbar</h3>
        </div>
        <div class="card-content">
          <div class="amount-display">
            <AnimatedValue
              :value="totalRemaining"
              format="currency"
              size="xl"
              weight="bold"
              :color-by-value="true"
            />
          </div>
          <div class="remaining-months">
            Für {{ remainingMonths }} Monate verfügbar
          </div>
        </div>
      </div>
    </div>

    <!-- 可视化进度条 -->
    <div class="progress-section">
      <h3>Nutzungsübersicht</h3>
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill used"
            :style="{ width: `${usagePercentage}%` }"
          ></div>
          <div
            class="progress-fill allocated"
            :style="{
              width: `${allocationPercentage}%`,
              left: `${usagePercentage}%`
            }"
          ></div>
        </div>
        <div class="progress-labels">
          <div class="label-group">
            <div class="label-item used">
              <div class="label-dot"></div>
              <span>Genutzt: {{ formatCurrency(totalUsed) }}</span>
            </div>
            <div class="label-item allocated">
              <div class="label-dot"></div>
              <span>Zugeteilt: {{ formatCurrency(totalAllocated) }}</span>
            </div>
            <div class="label-item available">
              <div class="label-dot"></div>
              <span>Verfügbar: {{ formatCurrency(totalRemaining) }}</span>
            </div>
          </div>
          <div class="progress-scale">
            <span>0€</span>
            <span>{{ formatCurrency(totalAvailable / 2) }}</span>
            <span>{{ formatCurrency(totalAvailable) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分配列表 -->
    <div class="allocations-section">
      <div class="section-header">
        <h3>Aktuelle Zuteilungen</h3>
        <div class="section-actions">
          <select v-model="sortBy" class="sort-select">
            <option value="bank">Nach Bank</option>
            <option value="amount">Nach Betrag</option>
            <option value="usage">Nach Nutzung</option>
            <option value="date">Nach Datum</option>
          </select>
          <button @click="toggleView" class="view-toggle">
            <Icon :name="viewMode === 'list' ? 'grid' : 'list'" size="16" />
          </button>
        </div>
      </div>

      <div class="allocations-container" :class="`view-${viewMode}`">
        <div
          v-for="(allocation, index) in sortedAllocations"
          :key="allocation.id"
          class="allocation-card"
          :class="{ 'over-allocated': allocation.used > allocation.amount }"
        >
          <div class="allocation-header">
            <div class="allocation-info">
              <h4 class="bank-name">{{ allocation.bankName }}</h4>
              <div class="allocation-meta">
                <span class="account-type">{{ allocation.accountType }}</span>
                <span class="allocation-date">{{ formatDate(allocation.createdAt) }}</span>
              </div>
            </div>
            <div class="allocation-actions">
              <button @click="editAllocation(allocation)" class="action-btn edit">
                <Icon name="edit" size="14" />
              </button>
              <button @click="deleteAllocation(allocation.id)" class="action-btn delete">
                <Icon name="trash" size="14" />
              </button>
            </div>
          </div>

          <div class="allocation-content">
            <div class="allocation-amounts">
              <div class="amount-item">
                <span class="amount-label">Zugeteilt</span>
                <span class="amount-value">{{ formatCurrency(allocation.amount) }}</span>
              </div>
              <div class="amount-item">
                <span class="amount-label">Genutzt</span>
                <span class="amount-value used">{{ formatCurrency(allocation.used) }}</span>
              </div>
              <div class="amount-item">
                <span class="amount-label">Verfügbar</span>
                <span class="amount-value available">{{ formatCurrency(allocation.amount - allocation.used) }}</span>
              </div>
            </div>

            <div class="allocation-progress">
              <div class="mini-progress-bar">
                <div
                  class="mini-progress-fill"
                  :style="{ width: `${Math.min((allocation.used / allocation.amount) * 100, 100)}%` }"
                  :class="{ 'over-limit': allocation.used > allocation.amount }"
                ></div>
              </div>
              <div class="progress-text">
                {{ formatPercentage((allocation.used / allocation.amount) * 100) }}
              </div>
            </div>

            <div v-if="allocation.notes" class="allocation-notes">
              <Icon name="info" size="12" />
              <span>{{ allocation.notes }}</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="allocations.length === 0" class="empty-state">
          <Icon name="inbox" size="48" />
          <h4>Keine Zuteilungen vorhanden</h4>
          <p>Erstellen Sie Ihre erste Freistellungsauftrag-Zuteilung</p>
          <button @click="addNewAllocation" class="empty-action-button">
            <Icon name="plus" size="16" />
            Erste Zuteilung erstellen
          </button>
        </div>
      </div>
    </div>

    <!-- 分配表单模态框 -->
    <Transition name="modal-fade">
      <div v-if="showAllocationModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ editingAllocation ? 'Zuteilung bearbeiten' : 'Neue Zuteilung' }}</h3>
            <button @click="closeModal" class="modal-close">
              <Icon name="x" size="20" />
            </button>
          </div>

          <form @submit.prevent="saveAllocation" class="allocation-form">
            <div class="form-group">
              <label>Bank/Institut</label>
              <input
                v-model="allocationForm.bankName"
                type="text"
                required
                class="form-input"
                placeholder="z.B. Deutsche Bank"
              />
            </div>

            <div class="form-group">
              <label>Kontotyp</label>
              <select v-model="allocationForm.accountType" class="form-select">
                <option value="depot">Wertpapierdepot</option>
                <option value="savings">Sparkonto</option>
                <option value="fixed">Festgeld</option>
                <option value="etf">ETF-Sparplan</option>
                <option value="other">Sonstiges</option>
              </select>
            </div>

            <div class="form-group">
              <label>Zugeteilter Betrag (€)</label>
              <input
                v-model.number="allocationForm.amount"
                type="number"
                min="0"
                :max="maxAllowedAmount"
                step="50"
                required
                class="form-input"
              />
              <div class="form-hint">
                Maximal verfügbar: {{ formatCurrency(maxAllowedAmount) }}
              </div>
            </div>

            <div class="form-group">
              <label>Bereits genutzt (€)</label>
              <input
                v-model.number="allocationForm.used"
                type="number"
                min="0"
                :max="allocationForm.amount"
                step="10"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Notizen (optional)</label>
              <textarea
                v-model="allocationForm.notes"
                class="form-textarea"
                rows="3"
                placeholder="Zusätzliche Informationen..."
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn secondary">
                Abbrechen
              </button>
              <button type="submit" class="btn primary">
                {{ editingAllocation ? 'Aktualisieren' : 'Erstellen' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- 优化建议 -->
    <div v-if="optimizationSuggestions.length > 0" class="optimization-section">
      <h3>Optimierungsvorschläge</h3>
      <div class="suggestions-list">
        <div
          v-for="(suggestion, index) in optimizationSuggestions"
          :key="index"
          class="suggestion-card"
        >
          <div class="suggestion-icon">
            <Icon :name="suggestion.icon" size="20" />
          </div>
          <div class="suggestion-content">
            <h4>{{ suggestion.title }}</h4>
            <p>{{ suggestion.description }}</p>
            <div class="suggestion-impact">
              Potenzielle Ersparnis: {{ formatCurrency(suggestion.potentialSavings) }}
            </div>
          </div>
          <button @click="applySuggestion(suggestion)" class="suggestion-action">
            Anwenden
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import AnimatedValue from '@/components/ui/AnimatedValue.vue'
import { formatCurrency, formatPercentage, formatDate } from '@/utils/formatters'

// 接口定义
interface FreistellungsauftragAllocation {
  id: string
  bankName: string
  accountType: 'depot' | 'savings' | 'fixed' | 'etf' | 'other'
  amount: number
  used: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface OptimizationSuggestion {
  icon: string
  title: string
  description: string
  potentialSavings: number
  action: () => void
}

// Props定义
interface Props {
  isMarried?: boolean
  currentYear?: number
  initialAllocations?: FreistellungsauftragAllocation[]
}

const props = withDefaults(defineProps<Props>(), {
  isMarried: false,
  currentYear: new Date().getFullYear(),
  initialAllocations: () => []
})

// Emits定义
interface Emits {
  allocationsChange: [allocations: FreistellungsauftragAllocation[]]
  optimizationApplied: [suggestion: OptimizationSuggestion]
}

const emit = defineEmits<Emits>()

// 响应式数据
const allocations = ref<FreistellungsauftragAllocation[]>([...props.initialAllocations])
const showAllocationModal = ref(false)
const editingAllocation = ref<FreistellungsauftragAllocation | null>(null)
const sortBy = ref<'bank' | 'amount' | 'usage' | 'date'>('bank')
const viewMode = ref<'list' | 'grid'>('list')

const allocationForm = reactive({
  bankName: '',
  accountType: 'depot' as const,
  amount: 0,
  used: 0,
  notes: ''
})

// 计算属性
const totalAvailable = computed(() => {
  return props.isMarried ? 2000 : 1000
})

const totalUsed = computed(() => {
  return allocations.value.reduce((sum, allocation) => sum + allocation.used, 0)
})

const totalAllocated = computed(() => {
  return allocations.value.reduce((sum, allocation) => sum + allocation.amount, 0)
})

const totalRemaining = computed(() => {
  return totalAvailable.value - totalUsed.value
})

const usagePercentage = computed(() => {
  return totalAvailable.value > 0 ? (totalUsed.value / totalAvailable.value) * 100 : 0
})

const allocationPercentage = computed(() => {
  const allocatedButNotUsed = totalAllocated.value - totalUsed.value
  return totalAvailable.value > 0 ? (allocatedButNotUsed / totalAvailable.value) * 100 : 0
})

const statusClass = computed(() => {
  const percentage = usagePercentage.value
  if (percentage < 50) return 'status-low'
  if (percentage < 80) return 'status-medium'
  if (percentage < 100) return 'status-high'
  return 'status-over'
})

const statusText = computed(() => {
  const percentage = usagePercentage.value
  if (percentage < 50) return 'Niedrige Nutzung'
  if (percentage < 80) return 'Moderate Nutzung'
  if (percentage < 100) return 'Hohe Nutzung'
  return 'Überschritten'
})

const remainingMonths = computed(() => {
  const currentMonth = new Date().getMonth()
  return 12 - currentMonth
})

const maxAllowedAmount = computed(() => {
  if (editingAllocation.value) {
    return totalRemaining.value + editingAllocation.value.amount
  }
  return totalRemaining.value
})

const sortedAllocations = computed(() => {
  const sorted = [...allocations.value]

  switch (sortBy.value) {
    case 'bank':
      return sorted.sort((a, b) => a.bankName.localeCompare(b.bankName))
    case 'amount':
      return sorted.sort((a, b) => b.amount - a.amount)
    case 'usage':
      return sorted.sort((a, b) => (b.used / b.amount) - (a.used / a.amount))
    case 'date':
      return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    default:
      return sorted
  }
})

const optimizationSuggestions = computed((): OptimizationSuggestion[] => {
  const suggestions: OptimizationSuggestion[] = []

  // 未充分利用的建议
  if (usagePercentage.value < 50) {
    suggestions.push({
      icon: 'trending-up',
      title: 'Freibetrag besser nutzen',
      description: 'Sie nutzen nur einen kleinen Teil Ihres Freibetrags. Erwägen Sie zusätzliche Investitionen.',
      potentialSavings: (totalRemaining.value * 0.25),
      action: () => console.log('Suggest better utilization')
    })
  }

  // 过度分配的建议
  if (totalAllocated.value > totalAvailable.value) {
    suggestions.push({
      icon: 'alert-triangle',
      title: 'Überzuteilung korrigieren',
      description: 'Sie haben mehr zugeteilt als verfügbar. Passen Sie die Zuteilungen an.',
      potentialSavings: 0,
      action: () => console.log('Fix over-allocation')
    })
  }

  return suggestions
})

// 方法
const addNewAllocation = () => {
  resetForm()
  editingAllocation.value = null
  showAllocationModal.value = true
}

const editAllocation = (allocation: FreistellungsauftragAllocation) => {
  editingAllocation.value = allocation
  allocationForm.bankName = allocation.bankName
  allocationForm.accountType = allocation.accountType
  allocationForm.amount = allocation.amount
  allocationForm.used = allocation.used
  allocationForm.notes = allocation.notes || ''
  showAllocationModal.value = true
}

const deleteAllocation = (id: string) => {
  if (confirm('Sind Sie sicher, dass Sie diese Zuteilung löschen möchten?')) {
    allocations.value = allocations.value.filter(a => a.id !== id)
    emit('allocationsChange', allocations.value)
  }
}

const saveAllocation = () => {
  if (editingAllocation.value) {
    // 更新现有分配
    const index = allocations.value.findIndex(a => a.id === editingAllocation.value!.id)
    if (index > -1) {
      allocations.value[index] = {
        ...editingAllocation.value,
        bankName: allocationForm.bankName,
        accountType: allocationForm.accountType,
        amount: allocationForm.amount,
        used: allocationForm.used,
        notes: allocationForm.notes,
        updatedAt: new Date()
      }
    }
  } else {
    // 创建新分配
    const newAllocation: FreistellungsauftragAllocation = {
      id: `allocation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bankName: allocationForm.bankName,
      accountType: allocationForm.accountType,
      amount: allocationForm.amount,
      used: allocationForm.used,
      notes: allocationForm.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    allocations.value.push(newAllocation)
  }

  emit('allocationsChange', allocations.value)
  closeModal()
}

const closeModal = () => {
  showAllocationModal.value = false
  editingAllocation.value = null
  resetForm()
}

const resetForm = () => {
  allocationForm.bankName = ''
  allocationForm.accountType = 'depot'
  allocationForm.amount = 0
  allocationForm.used = 0
  allocationForm.notes = ''
}

const toggleView = () => {
  viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
}

const optimizeAllocations = () => {
  // 实现智能优化逻辑
  console.log('Optimizing allocations...')
}

const applySuggestion = (suggestion: OptimizationSuggestion) => {
  suggestion.action()
  emit('optimizationApplied', suggestion)
}

// 监听器
watch(() => props.initialAllocations, (newAllocations) => {
  allocations.value = [...newAllocations]
}, { deep: true })
</script>

<style scoped>
.freistellungsauftrag-manager {
  @apply max-w-6xl mx-auto p-6 space-y-8;
}

/* 管理器头部 */
.manager-header {
  @apply flex items-center justify-between mb-8;
}

.manager-title {
  @apply flex items-center gap-3 text-2xl font-bold text-gray-900;
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

/* 总览区域 */
.overview-section {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.overview-card {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.overview-card.total {
  @apply border-blue-200 bg-blue-50;
}

.overview-card.used {
  @apply border-orange-200 bg-orange-50;
}

.overview-card.remaining {
  @apply border-green-200 bg-green-50;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.card-header h3 {
  @apply text-lg font-semibold text-gray-800;
}

.status-badge {
  @apply px-3 py-1 rounded-full text-sm font-medium;
}

.status-badge.status-low {
  @apply bg-green-100 text-green-700;
}

.status-badge.status-medium {
  @apply bg-yellow-100 text-yellow-700;
}

.status-badge.status-high {
  @apply bg-orange-100 text-orange-700;
}

.status-badge.status-over {
  @apply bg-red-100 text-red-700;
}

.card-content {
  @apply space-y-4;
}

.amount-display {
  @apply text-center;
}

.amount-details {
  @apply space-y-2;
}

.detail-item {
  @apply flex justify-between text-sm;
}

.detail-label {
  @apply text-gray-600;
}

.detail-value {
  @apply font-medium text-gray-900;
}

.usage-percentage,
.remaining-months {
  @apply text-center text-sm text-gray-600;
}

/* 进度区域 */
.progress-section {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.progress-section h3 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.progress-container {
  @apply space-y-4;
}

.progress-bar {
  @apply relative w-full h-6 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply absolute top-0 h-full transition-all duration-500;
}

.progress-fill.used {
  @apply bg-gradient-to-r from-orange-400 to-orange-500;
}

.progress-fill.allocated {
  @apply bg-gradient-to-r from-blue-400 to-blue-500;
}

.progress-labels {
  @apply flex justify-between items-center;
}

.label-group {
  @apply flex gap-6;
}

.label-item {
  @apply flex items-center gap-2 text-sm;
}

.label-dot {
  @apply w-3 h-3 rounded-full;
}

.label-item.used .label-dot {
  @apply bg-orange-500;
}

.label-item.allocated .label-dot {
  @apply bg-blue-500;
}

.label-item.available .label-dot {
  @apply bg-gray-400;
}

.progress-scale {
  @apply flex justify-between text-xs text-gray-500;
}

/* 分配列表区域 */
.allocations-section {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.section-header {
  @apply flex items-center justify-between mb-6;
}

.section-header h3 {
  @apply text-lg font-semibold text-gray-800;
}

.section-actions {
  @apply flex items-center gap-3;
}

.sort-select {
  @apply px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.view-toggle {
  @apply p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.allocations-container {
  @apply space-y-4;
}

.allocations-container.view-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0;
}

.allocation-card {
  @apply bg-gray-50 rounded-lg border border-gray-200 p-4;
  @apply hover:shadow-md transition-shadow;
}

.allocation-card.over-allocated {
  @apply border-red-300 bg-red-50;
}

.allocation-header {
  @apply flex items-start justify-between mb-4;
}

.allocation-info h4 {
  @apply font-semibold text-gray-900;
}

.allocation-meta {
  @apply flex gap-2 text-xs text-gray-500 mt-1;
}

.allocation-actions {
  @apply flex gap-1;
}

.action-btn {
  @apply p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.action-btn.edit:hover {
  @apply text-blue-600;
}

.action-btn.delete:hover {
  @apply text-red-600;
}

.allocation-content {
  @apply space-y-4;
}

.allocation-amounts {
  @apply grid grid-cols-3 gap-4;
}

.amount-item {
  @apply text-center;
}

.amount-label {
  @apply block text-xs text-gray-500 mb-1;
}

.amount-value {
  @apply text-sm font-semibold text-gray-900;
}

.amount-value.used {
  @apply text-orange-600;
}

.amount-value.available {
  @apply text-green-600;
}

.allocation-progress {
  @apply flex items-center gap-3;
}

.mini-progress-bar {
  @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.mini-progress-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.mini-progress-fill.over-limit {
  @apply bg-red-500;
}

.progress-text {
  @apply text-xs text-gray-600 font-medium;
}

.allocation-notes {
  @apply flex items-center gap-2 text-xs text-gray-600 bg-gray-100 rounded p-2;
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

/* 模态框 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto;
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

.allocation-form {
  @apply p-6 space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input,
.form-select,
.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-hint {
  @apply text-xs text-gray-500;
}

.form-actions {
  @apply flex gap-3 pt-4 border-t border-gray-200;
}

.btn {
  @apply flex-1 px-4 py-2 rounded-md font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 优化建议区域 */
.optimization-section {
  @apply bg-white rounded-lg shadow-md border p-6;
}

.optimization-section h3 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.suggestions-list {
  @apply space-y-4;
}

.suggestion-card {
  @apply flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg;
}

.suggestion-icon {
  @apply flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600;
}

.suggestion-content {
  @apply flex-1;
}

.suggestion-content h4 {
  @apply font-medium text-gray-900 mb-1;
}

.suggestion-content p {
  @apply text-sm text-gray-600 mb-2;
}

.suggestion-impact {
  @apply text-sm font-medium text-green-600;
}

.suggestion-action {
  @apply px-3 py-1 bg-blue-600 text-white text-sm rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
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
@media (max-width: 768px) {
  .manager-header {
    @apply flex-col items-start gap-4;
  }

  .header-actions {
    @apply w-full justify-between;
  }

  .overview-section {
    @apply grid-cols-1;
  }

  .section-header {
    @apply flex-col items-start gap-4;
  }

  .section-actions {
    @apply w-full justify-between;
  }

  .allocations-container.view-grid {
    @apply grid-cols-1;
  }

  .allocation-amounts {
    @apply grid-cols-1 gap-2;
  }

  .progress-labels {
    @apply flex-col gap-2;
  }

  .label-group {
    @apply flex-col gap-2;
  }

  .suggestion-card {
    @apply flex-col gap-3;
  }

  .suggestion-action {
    @apply self-start;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .freistellungsauftrag-manager {
    @apply text-gray-100;
  }

  .manager-title {
    @apply text-gray-100;
  }

  .overview-card,
  .progress-section,
  .allocations-section,
  .optimization-section {
    @apply bg-gray-800 border-gray-700;
  }

  .overview-card.total {
    @apply bg-blue-900 border-blue-700;
  }

  .overview-card.used {
    @apply bg-orange-900 border-orange-700;
  }

  .overview-card.remaining {
    @apply bg-green-900 border-green-700;
  }

  .card-header h3,
  .progress-section h3,
  .section-header h3,
  .optimization-section h3 {
    @apply text-gray-100;
  }

  .allocation-card {
    @apply bg-gray-700 border-gray-600;
  }

  .allocation-card.over-allocated {
    @apply bg-red-900 border-red-700;
  }

  .allocation-info h4 {
    @apply text-gray-100;
  }

  .detail-label,
  .amount-label {
    @apply text-gray-300;
  }

  .detail-value,
  .amount-value {
    @apply text-gray-100;
  }

  .form-input,
  .form-select,
  .form-textarea,
  .sort-select {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .modal-content {
    @apply bg-gray-800;
  }

  .modal-header {
    @apply border-gray-700;
  }

  .modal-header h3 {
    @apply text-gray-100;
  }

  .form-actions {
    @apply border-gray-700;
  }

  .suggestion-card {
    @apply bg-blue-900 border-blue-700;
  }

  .suggestion-icon {
    @apply bg-blue-800 text-blue-300;
  }

  .suggestion-content h4 {
    @apply text-gray-100;
  }

  .suggestion-content p {
    @apply text-gray-300;
  }
}
</style>
