<!--
  年度明细表格组件
  专业的年度数据明细表格，支持排序、筛选和导出功能
-->

<template>
  <div class="yearly-detail-table">
    <!-- 表格头部 -->
    <div class="table-header">
      <div class="header-left">
        <h3 class="table-title">
          <Icon name="table" size="lg" />
          Jährliche Aufschlüsselung
        </h3>
        <div class="table-summary">
          {{ filteredData.length }} von {{ data.length }} Jahren angezeigt
        </div>
      </div>

      <div class="header-actions">
        <div class="view-options">
          <button
            v-for="view in viewModes"
            :key="view.id"
            @click="currentView = view.id"
            class="view-button"
            :class="{ 'active': currentView === view.id }"
          >
            <Icon :name="view.icon" size="sm" />
            {{ view.label }}
          </button>
        </div>

        <div class="action-buttons">
          <button @click="toggleFilters" class="action-button">
            <Icon name="filter" size="sm" />
            Filter
            <span v-if="hasActiveFilters" class="filter-badge">{{ activeFiltersCount }}</span>
          </button>
          <button @click="exportData" class="action-button">
            <Icon name="download" size="sm" />
            Export
          </button>
          <button @click="toggleFullscreen" class="action-button">
            <Icon :name="isFullscreen ? 'minimize-2' : 'maximize-2'" size="sm" />
          </button>
        </div>
      </div>
    </div>

    <!-- 筛选面板 -->
    <Transition name="slide-down">
      <div v-if="showFilters" class="filters-panel">
        <div class="filters-grid">
          <div class="filter-group">
            <label>Zeitraum</label>
            <div class="range-inputs">
              <input
                v-model.number="filters.yearRange.start"
                type="number"
                :min="minYear"
                :max="maxYear"
                class="filter-input"
                placeholder="Von Jahr"
              />
              <span class="range-separator">bis</span>
              <input
                v-model.number="filters.yearRange.end"
                type="number"
                :min="minYear"
                :max="maxYear"
                class="filter-input"
                placeholder="Bis Jahr"
              />
            </div>
          </div>

          <div class="filter-group">
            <label>Mindest-Gesamtwert (€)</label>
            <input
              v-model.number="filters.minTotalValue"
              type="number"
              min="0"
              step="1000"
              class="filter-input"
              placeholder="z.B. 10000"
            />
          </div>

          <div class="filter-group">
            <label>Mindest-Zinserträge (€)</label>
            <input
              v-model.number="filters.minInterest"
              type="number"
              min="0"
              step="100"
              class="filter-input"
              placeholder="z.B. 500"
            />
          </div>

          <div class="filter-group">
            <label>Mindest-Wachstumsrate (%)</label>
            <input
              v-model.number="filters.minGrowthRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="filter-input"
              placeholder="z.B. 5.0"
            />
          </div>
        </div>

        <div class="filter-actions">
          <button @click="applyFilters" class="apply-button">
            <Icon name="check" size="sm" />
            Filter anwenden
          </button>
          <button @click="clearFilters" class="clear-button">
            <Icon name="x" size="sm" />
            Zurücksetzen
          </button>
        </div>
      </div>
    </Transition>

    <!-- 表格容器 -->
    <div class="table-container" :class="{ 'fullscreen': isFullscreen }">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="table-loading">
        <div class="loading-spinner"></div>
        <p>Daten werden geladen...</p>
      </div>

      <!-- 空数据状态 -->
      <div v-else-if="!hasData" class="table-empty">
        <Icon name="table" size="xl" />
        <h4>Keine Daten verfügbar</h4>
        <p>Geben Sie Ihre Investitionsparameter ein, um die jährliche Aufschlüsselung zu sehen.</p>
      </div>

      <!-- 数据表格 -->
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th
                v-for="column in visibleColumns"
                :key="column.key"
                @click="handleSort(column.key)"
                class="table-header-cell"
                :class="{
                  'sortable': column.sortable,
                  'sorted': sortConfig.key === column.key,
                  'asc': sortConfig.key === column.key && sortConfig.direction === 'asc',
                  'desc': sortConfig.key === column.key && sortConfig.direction === 'desc'
                }"
              >
                <div class="header-content">
                  <span class="header-text">{{ column.label }}</span>
                  <div v-if="column.sortable" class="sort-indicators">
                    <Icon name="chevron-up" size="xs" class="sort-icon sort-asc" />
                    <Icon name="chevron-down" size="xs" class="sort-icon sort-desc" />
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(row, index) in paginatedData"
              :key="row.year"
              class="table-row"
              :class="{ 'highlighted': highlightedYear === row.year }"
              @click="selectRow(row)"
              @mouseenter="highlightRow(row.year)"
              @mouseleave="highlightRow(null)"
            >
              <td
                v-for="column in visibleColumns"
                :key="column.key"
                class="table-cell"
                :class="column.align || 'left'"
              >
                <div class="cell-content">
                  <span v-if="column.key === 'year'" class="year-badge">
                    Jahr {{ formatValue(row[column.key], column) }}
                  </span>
                  <span v-else-if="column.type === 'currency'" class="currency-value">
                    {{ formatValue(row[column.key], column) }}
                  </span>
                  <span v-else-if="column.type === 'percentage'" class="percentage-value">
                    {{ formatValue(row[column.key], column) }}
                  </span>
                  <span v-else-if="column.type === 'growth'" class="growth-value" :class="getGrowthClass(row[column.key])">
                    <Icon :name="getGrowthIcon(row[column.key])" size="xs" />
                    {{ formatValue(row[column.key], column) }}
                  </span>
                  <span v-else>
                    {{ formatValue(row[column.key], column) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页控件 -->
      <div v-if="hasData && totalPages > 1" class="pagination">
        <div class="pagination-info">
          Zeige {{ startIndex + 1 }}-{{ endIndex }} von {{ filteredData.length }} Einträgen
        </div>

        <div class="pagination-controls">
          <button
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            class="page-button"
          >
            <Icon name="chevrons-left" size="sm" />
          </button>
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="page-button"
          >
            <Icon name="chevron-left" size="sm" />
          </button>

          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              class="page-number"
              :class="{ 'active': page === currentPage }"
            >
              {{ page }}
            </button>
          </div>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="page-button"
          >
            <Icon name="chevron-right" size="sm" />
          </button>
          <button
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
            class="page-button"
          >
            <Icon name="chevrons-right" size="sm" />
          </button>
        </div>

        <div class="page-size-selector">
          <label>Pro Seite:</label>
          <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 行详情模态框 -->
    <Transition name="modal-fade">
      <div v-if="selectedRow" class="modal-overlay" @click="closeRowDetails">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Jahr {{ selectedRow.year }} - Detailansicht</h3>
            <button @click="closeRowDetails" class="modal-close">
              <Icon name="x" size="md" />
            </button>
          </div>

          <div class="modal-body">
            <div class="detail-sections">
              <div class="detail-section">
                <h4>Grunddaten</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Jahr:</span>
                    <span class="detail-value">{{ selectedRow.year }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Anfangswert:</span>
                    <span class="detail-value">{{ formatCurrency(selectedRow.startBalance) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Endwert:</span>
                    <span class="detail-value">{{ formatCurrency(selectedRow.totalValue) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Wachstum:</span>
                    <span class="detail-value positive">{{ formatCurrency(selectedRow.totalValue - selectedRow.startBalance) }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Einzahlungen & Zinsen</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Jährliche Einzahlungen:</span>
                    <span class="detail-value">{{ formatCurrency(selectedRow.yearlyContributions || 0) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Gesamte Einzahlungen:</span>
                    <span class="detail-value">{{ formatCurrency(selectedRow.contributions) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Zinserträge:</span>
                    <span class="detail-value positive">{{ formatCurrency(selectedRow.interest) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Wachstumsrate:</span>
                    <span class="detail-value" :class="getGrowthClass(selectedRow.growthRate)">
                      {{ formatPercentage(selectedRow.growthRate) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="selectedRow.inflationAdjustedValue" class="detail-section">
                <h4>Inflationsbereinigung</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Nominaler Wert:</span>
                    <span class="detail-value">{{ formatCurrency(selectedRow.totalValue) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Realer Wert:</span>
                    <span class="detail-value">{{ formatCurrency(selectedRow.inflationAdjustedValue) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Kaufkraftverlust:</span>
                    <span class="detail-value negative">
                      {{ formatCurrency(selectedRow.totalValue - selectedRow.inflationAdjustedValue) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface YearlyData {
  year: number
  startBalance: number
  totalValue: number
  contributions: number
  interest: number
  growthRate: number
  yearlyContributions?: number
  inflationAdjustedValue?: number
}

interface TableColumn {
  key: string
  label: string
  type: 'text' | 'currency' | 'percentage' | 'growth' | 'number'
  sortable: boolean
  align?: 'left' | 'center' | 'right'
  visible: boolean
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface FilterConfig {
  yearRange: {
    start: number | null
    end: number | null
  }
  minTotalValue: number | null
  minInterest: number | null
  minGrowthRate: number | null
}

interface ViewMode {
  id: string
  label: string
  icon: string
}

// Props定义
interface Props {
  data: YearlyData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits定义
interface Emits {
  'row-select': [row: YearlyData]
  'data-export': [data: YearlyData[], format: string]
  'filter-change': [filters: FilterConfig]
}

const emit = defineEmits<Emits>()

// 响应式数据
const currentView = ref('detailed')
const showFilters = ref(false)
const isFullscreen = ref(false)
const isLoading = ref(false)
const selectedRow = ref<YearlyData | null>(null)
const highlightedYear = ref<number | null>(null)

const currentPage = ref(1)
const pageSize = ref(25)

const sortConfig = ref<SortConfig>({
  key: 'year',
  direction: 'asc'
})

const filters = ref<FilterConfig>({
  yearRange: {
    start: null,
    end: null
  },
  minTotalValue: null,
  minInterest: null,
  minGrowthRate: null
})

// 视图模式配置
const viewModes: ViewMode[] = [
  { id: 'detailed', label: 'Detailliert', icon: 'list' },
  { id: 'compact', label: 'Kompakt', icon: 'minimize' },
  { id: 'summary', label: 'Zusammenfassung', icon: 'bar-chart-2' }
]

// 表格列配置
const allColumns: TableColumn[] = [
  { key: 'year', label: 'Jahr', type: 'number', sortable: true, align: 'center', visible: true },
  { key: 'startBalance', label: 'Anfangswert', type: 'currency', sortable: true, align: 'right', visible: true },
  { key: 'yearlyContributions', label: 'Einzahlungen', type: 'currency', sortable: true, align: 'right', visible: true },
  { key: 'interest', label: 'Zinserträge', type: 'currency', sortable: true, align: 'right', visible: true },
  { key: 'totalValue', label: 'Endwert', type: 'currency', sortable: true, align: 'right', visible: true },
  { key: 'growthRate', label: 'Wachstum', type: 'growth', sortable: true, align: 'right', visible: true },
  { key: 'contributions', label: 'Gesamt Einzahlungen', type: 'currency', sortable: true, align: 'right', visible: false },
  { key: 'inflationAdjustedValue', label: 'Realer Wert', type: 'currency', sortable: true, align: 'right', visible: false }
]

// 计算属性
const hasData = computed(() => props.data && props.data.length > 0)

const minYear = computed(() => hasData.value ? Math.min(...props.data.map(d => d.year)) : 1)
const maxYear = computed(() => hasData.value ? Math.max(...props.data.map(d => d.year)) : 50)

const visibleColumns = computed(() => {
  const baseColumns = allColumns.filter(col => col.visible)

  if (currentView.value === 'compact') {
    return baseColumns.filter(col => ['year', 'totalValue', 'interest', 'growthRate'].includes(col.key))
  } else if (currentView.value === 'summary') {
    return baseColumns.filter(col => ['year', 'totalValue', 'contributions', 'interest'].includes(col.key))
  }

  return baseColumns
})

const hasActiveFilters = computed(() => {
  return filters.value.yearRange.start !== null ||
         filters.value.yearRange.end !== null ||
         filters.value.minTotalValue !== null ||
         filters.value.minInterest !== null ||
         filters.value.minGrowthRate !== null
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.yearRange.start !== null || filters.value.yearRange.end !== null) count++
  if (filters.value.minTotalValue !== null) count++
  if (filters.value.minInterest !== null) count++
  if (filters.value.minGrowthRate !== null) count++
  return count
})

const filteredData = computed(() => {
  if (!hasData.value) return []

  let filtered = [...props.data]

  // 年份范围筛选
  if (filters.value.yearRange.start !== null) {
    filtered = filtered.filter(row => row.year >= filters.value.yearRange.start!)
  }
  if (filters.value.yearRange.end !== null) {
    filtered = filtered.filter(row => row.year <= filters.value.yearRange.end!)
  }

  // 最小总值筛选
  if (filters.value.minTotalValue !== null) {
    filtered = filtered.filter(row => row.totalValue >= filters.value.minTotalValue!)
  }

  // 最小利息筛选
  if (filters.value.minInterest !== null) {
    filtered = filtered.filter(row => row.interest >= filters.value.minInterest!)
  }

  // 最小增长率筛选
  if (filters.value.minGrowthRate !== null) {
    filtered = filtered.filter(row => (row.growthRate * 100) >= filters.value.minGrowthRate!)
  }

  return filtered
})

const sortedData = computed(() => {
  if (!filteredData.value.length) return []

  const sorted = [...filteredData.value].sort((a, b) => {
    const aVal = a[sortConfig.value.key as keyof YearlyData]
    const bVal = b[sortConfig.value.key as keyof YearlyData]

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.value.direction === 'asc' ? aVal - bVal : bVal - aVal
    }

    const aStr = String(aVal)
    const bStr = String(bVal)

    if (sortConfig.value.direction === 'asc') {
      return aStr.localeCompare(bStr)
    } else {
      return bStr.localeCompare(aStr)
    }
  })

  return sorted
})

const totalPages = computed(() => Math.ceil(sortedData.value.length / pageSize.value))

const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)
const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, sortedData.value.length))

const paginatedData = computed(() => {
  return sortedData.value.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  const half = Math.floor(maxVisible / 2)

  let start = Math.max(1, currentPage.value - half)
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// 方法
const formatValue = (value: any, column: TableColumn): string => {
  if (value === null || value === undefined) return '-'

  switch (column.type) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
    case 'growth':
      return formatPercentage(value)
    case 'number':
      return value.toLocaleString('de-DE')
    default:
      return String(value)
  }
}

const getGrowthClass = (value: number): string => {
  if (value > 0.05) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const getGrowthIcon = (value: number): string => {
  if (value > 0.05) return 'trending-up'
  if (value < 0) return 'trending-down'
  return 'minus'
}

const handleSort = (key: string) => {
  if (sortConfig.value.key === key) {
    sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortConfig.value.key = key
    sortConfig.value.direction = 'asc'
  }
}

const selectRow = (row: YearlyData) => {
  selectedRow.value = row
  emit('row-select', row)
}

const closeRowDetails = () => {
  selectedRow.value = null
}

const highlightRow = (year: number | null) => {
  highlightedYear.value = year
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const applyFilters = () => {
  currentPage.value = 1
  emit('filter-change', filters.value)
}

const clearFilters = () => {
  filters.value = {
    yearRange: { start: null, end: null },
    minTotalValue: null,
    minInterest: null,
    minGrowthRate: null
  }
  applyFilters()
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const handlePageSizeChange = () => {
  currentPage.value = 1
}

const exportData = () => {
  emit('data-export', sortedData.value, 'csv')
}

// 监听器
watch(() => props.loading, (newVal) => {
  isLoading.value = newVal
})

watch(() => props.data, () => {
  currentPage.value = 1
}, { deep: true })
</script>

<style scoped>
.yearly-detail-table {
  @apply bg-white rounded-lg shadow-lg border;
}

/* 表格头部 */
.table-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.header-left {
  @apply flex items-center gap-4;
}

.table-title {
  @apply flex items-center gap-3 text-xl font-bold text-gray-800;
}

.table-summary {
  @apply text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full;
}

.header-actions {
  @apply flex items-center gap-4;
}

.view-options {
  @apply flex gap-2;
}

.view-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm rounded-md;
  @apply text-gray-600 hover:text-gray-900 hover:bg-gray-100;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-all duration-200;
}

.view-button.active {
  @apply bg-blue-100 text-blue-700 shadow-sm;
}

.action-buttons {
  @apply flex gap-2;
}

.action-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm rounded-md;
  @apply text-gray-600 hover:text-gray-900 hover:bg-gray-100;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors relative;
}

.filter-badge {
  @apply absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs;
  @apply rounded-full flex items-center justify-center;
}

/* 筛选面板 */
.filters-panel {
  @apply bg-gray-50 border-b border-gray-200 p-6;
}

.filters-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4;
}

.filter-group {
  @apply space-y-2;
}

.filter-group label {
  @apply block text-sm font-medium text-gray-700;
}

.range-inputs {
  @apply flex items-center gap-2;
}

.range-separator {
  @apply text-sm text-gray-500;
}

.filter-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.filter-actions {
  @apply flex gap-2;
}

.apply-button {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.clear-button {
  @apply flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500;
}

/* 表格容器 */
.table-container {
  @apply relative;
  @apply transition-all duration-300;
}

.table-container.fullscreen {
  @apply fixed inset-4 z-50 bg-white shadow-2xl rounded-lg;
  @apply flex flex-col;
}

.table-loading {
  @apply flex flex-col items-center justify-center py-12;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4;
}

.table-loading p {
  @apply text-gray-600;
}

.table-empty {
  @apply flex flex-col items-center justify-center py-12 text-gray-500;
}

.table-empty h4 {
  @apply text-lg font-semibold mt-4 mb-2;
}

.table-empty p {
  @apply text-center max-w-md;
}

/* 数据表格 */
.table-wrapper {
  @apply overflow-x-auto;
}

.data-table {
  @apply w-full border-collapse;
}

.table-header-cell {
  @apply px-4 py-3 text-left text-sm font-semibold text-gray-700;
  @apply bg-gray-50 border-b border-gray-200;
  @apply sticky top-0 z-10;
}

.table-header-cell.sortable {
  @apply cursor-pointer hover:bg-gray-100 transition-colors;
}

.header-content {
  @apply flex items-center justify-between;
}

.header-text {
  @apply flex-1;
}

.sort-indicators {
  @apply flex flex-col ml-2;
}

.sort-icon {
  @apply text-gray-400 transition-colors;
}

.table-header-cell.sorted .sort-icon {
  @apply text-gray-600;
}

.table-header-cell.asc .sort-asc {
  @apply text-blue-600;
}

.table-header-cell.desc .sort-desc {
  @apply text-blue-600;
}

.table-row {
  @apply hover:bg-gray-50 cursor-pointer transition-colors;
}

.table-row.highlighted {
  @apply bg-blue-50;
}

.table-cell {
  @apply px-4 py-3 text-sm border-b border-gray-200;
}

.table-cell.left {
  @apply text-left;
}

.table-cell.center {
  @apply text-center;
}

.table-cell.right {
  @apply text-right;
}

.cell-content {
  @apply flex items-center;
}

.table-cell.right .cell-content {
  @apply justify-end;
}

.table-cell.center .cell-content {
  @apply justify-center;
}

.year-badge {
  @apply inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full;
}

.currency-value {
  @apply font-mono text-gray-900;
}

.percentage-value {
  @apply font-mono text-gray-900;
}

.growth-value {
  @apply flex items-center gap-1 font-mono;
}

.growth-value.positive {
  @apply text-green-600;
}

.growth-value.negative {
  @apply text-red-600;
}

.growth-value.neutral {
  @apply text-gray-600;
}

/* 分页控件 */
.pagination {
  @apply flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50;
}

.pagination-info {
  @apply text-sm text-gray-600;
}

.pagination-controls {
  @apply flex items-center gap-2;
}

.page-button {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.page-numbers {
  @apply flex gap-1 mx-2;
}

.page-number {
  @apply px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.page-number.active {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.page-size-selector {
  @apply flex items-center gap-2 text-sm;
}

.page-size-selector label {
  @apply text-gray-600;
}

.page-size-select {
  @apply px-2 py-1 border border-gray-300 rounded text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
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

.detail-sections {
  @apply space-y-6;
}

.detail-section h4 {
  @apply text-base font-semibold text-gray-800 mb-4;
}

.detail-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.detail-item {
  @apply flex justify-between items-center py-2 border-b border-gray-100;
}

.detail-label {
  @apply text-sm text-gray-600;
}

.detail-value {
  @apply font-semibold text-gray-900;
}

.detail-value.positive {
  @apply text-green-600;
}

.detail-value.negative {
  @apply text-red-600;
}

/* 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  @apply transition-all duration-300;
}

.slide-down-enter-from,
.slide-down-leave-to {
  @apply opacity-0 transform -translate-y-4;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  @apply transition-opacity duration-300;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  @apply opacity-0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .table-header {
    @apply flex-col items-start gap-4;
  }

  .header-actions {
    @apply w-full justify-between;
  }

  .view-options {
    @apply flex-wrap;
  }

  .filters-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .pagination {
    @apply flex-col gap-4;
  }

  .pagination-controls {
    @apply order-2;
  }

  .pagination-info {
    @apply order-1;
  }

  .page-size-selector {
    @apply order-3;
  }
}

@media (max-width: 768px) {
  .yearly-detail-table {
    @apply rounded-none border-x-0;
  }

  .table-header {
    @apply p-4;
  }

  .table-title {
    @apply text-lg;
  }

  .header-actions {
    @apply flex-col gap-2;
  }

  .view-options {
    @apply grid grid-cols-3 gap-2 w-full;
  }

  .action-buttons {
    @apply w-full justify-between;
  }

  .filters-panel {
    @apply p-4;
  }

  .filters-grid {
    @apply grid-cols-1;
  }

  .range-inputs {
    @apply flex-col gap-2;
  }

  .filter-actions {
    @apply flex-col gap-2;
  }

  .apply-button,
  .clear-button {
    @apply w-full justify-center;
  }

  .table-wrapper {
    @apply -mx-4;
  }

  .data-table {
    @apply text-xs;
  }

  .table-header-cell,
  .table-cell {
    @apply px-2 py-2;
  }

  .pagination {
    @apply p-4;
  }

  .page-numbers {
    @apply hidden;
  }

  .modal-content {
    @apply mx-2 max-h-[90vh];
  }

  .modal-header,
  .modal-body {
    @apply p-4;
  }

  .detail-grid {
    @apply grid-cols-1;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .yearly-detail-table {
    @apply bg-gray-800 border-gray-700;
  }

  .table-header {
    @apply border-gray-700;
  }

  .table-title {
    @apply text-gray-100;
  }

  .table-summary {
    @apply bg-gray-700 text-gray-300;
  }

  .view-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-700;
  }

  .view-button.active {
    @apply bg-blue-900 text-blue-300;
  }

  .action-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-700;
  }

  .filters-panel {
    @apply bg-gray-700 border-gray-600;
  }

  .filter-group label {
    @apply text-gray-300;
  }

  .range-separator {
    @apply text-gray-400;
  }

  .filter-input {
    @apply bg-gray-800 border-gray-600 text-gray-100;
  }

  .apply-button {
    @apply bg-blue-700 hover:bg-blue-800;
  }

  .clear-button {
    @apply bg-gray-600 text-gray-200 hover:bg-gray-500;
  }

  .table-container.fullscreen {
    @apply bg-gray-800;
  }

  .table-loading p {
    @apply text-gray-300;
  }

  .table-empty {
    @apply text-gray-400;
  }

  .table-empty h4 {
    @apply text-gray-300;
  }

  .table-header-cell {
    @apply bg-gray-700 text-gray-300 border-gray-600;
  }

  .table-header-cell.sortable:hover {
    @apply bg-gray-600;
  }

  .table-header-cell.sorted .sort-icon {
    @apply text-gray-300;
  }

  .table-header-cell.asc .sort-asc,
  .table-header-cell.desc .sort-desc {
    @apply text-blue-400;
  }

  .table-row:hover {
    @apply bg-gray-700;
  }

  .table-row.highlighted {
    @apply bg-blue-900;
  }

  .table-cell {
    @apply border-gray-700;
  }

  .year-badge {
    @apply bg-blue-900 text-blue-300;
  }

  .currency-value,
  .percentage-value {
    @apply text-gray-100;
  }

  .growth-value.positive {
    @apply text-green-400;
  }

  .growth-value.negative {
    @apply text-red-400;
  }

  .growth-value.neutral {
    @apply text-gray-300;
  }

  .pagination {
    @apply bg-gray-700 border-gray-600;
  }

  .pagination-info {
    @apply text-gray-300;
  }

  .page-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-600;
  }

  .page-number {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-600;
  }

  .page-number.active {
    @apply bg-blue-700 text-white hover:bg-blue-800;
  }

  .page-size-selector label {
    @apply text-gray-300;
  }

  .page-size-select {
    @apply bg-gray-800 border-gray-600 text-gray-100;
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

  .modal-close {
    @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
  }

  .detail-section h4 {
    @apply text-gray-200;
  }

  .detail-item {
    @apply border-gray-700;
  }

  .detail-label {
    @apply text-gray-300;
  }

  .detail-value {
    @apply text-gray-100;
  }

  .detail-value.positive {
    @apply text-green-400;
  }

  .detail-value.negative {
    @apply text-red-400;
  }
}

/* 打印样式 */
@media print {
  .yearly-detail-table {
    @apply shadow-none border border-gray-300;
  }

  .table-header {
    @apply border-b border-gray-300;
  }

  .header-actions {
    @apply hidden;
  }

  .filters-panel {
    @apply hidden;
  }

  .table-container {
    @apply shadow-none;
  }

  .table-wrapper {
    @apply overflow-visible;
  }

  .data-table {
    @apply text-xs;
  }

  .table-header-cell {
    @apply bg-gray-100 print:bg-gray-100;
  }

  .table-row:hover {
    @apply bg-transparent;
  }

  .pagination {
    @apply hidden;
  }

  .modal-overlay {
    @apply hidden;
  }

  .growth-value.positive {
    @apply text-black;
  }

  .growth-value.negative {
    @apply text-black;
  }

  .currency-value,
  .percentage-value {
    @apply text-black;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .table-header-cell {
    @apply border-2 border-black;
  }

  .table-cell {
    @apply border border-black;
  }

  .table-row:hover {
    @apply bg-yellow-100;
  }

  .page-number.active {
    @apply bg-black text-white;
  }
}
</style>
