<!--
  增强的历史记录面板
  提供高级的历史记录管理功能，包括智能分类、批量操作、数据分析等
-->

<template>
  <div class="enhanced-history-panel">
    <!-- 头部工具栏 -->
    <div class="history-toolbar bg-white border-b border-gray-200 p-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <h2 class="text-xl font-semibold text-gray-900 mr-4">
            Berechnungshistorie
          </h2>
          <div class="flex items-center text-sm text-gray-500">
            <span class="mr-4">{{ state.statistics?.total || 0 }} Berechnungen</span>
            <span v-if="state.selectedRecords.length > 0" class="text-blue-600">
              {{ state.selectedRecords.length }} ausgewählt
            </span>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- 视图切换 -->
          <div class="flex bg-gray-100 rounded-lg p-1">
            <button
              v-for="view in viewModes"
              :key="view.id"
              :class="[
                'px-3 py-1 text-sm rounded-md transition-colors',
                state.viewMode === view.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              ]"
              @click="state.viewMode = view.id"
            >
              <component :is="view.icon" class="w-4 h-4 mr-1" />
              {{ view.name }}
            </button>
          </div>
          
          <!-- 操作按钮 -->
          <BaseButton
            variant="outline"
            size="sm"
            @click="showFilters = !showFilters"
          >
            <FunnelIcon class="w-4 h-4 mr-2" />
            Filter
          </BaseButton>
          
          <BaseButton
            variant="outline"
            size="sm"
            @click="showExportDialog = true"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            Export
          </BaseButton>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <BaseInput
            v-model="searchQuery"
            type="text"
            placeholder="Berechnungen durchsuchen..."
            @input="handleSearch"
          >
            <template #prefix>
              <MagnifyingGlassIcon class="w-4 h-4 text-gray-400" />
            </template>
          </BaseInput>
        </div>
        
        <!-- 快速筛选 -->
        <div class="flex items-center gap-2">
          <BaseButton
            :variant="state.filters.favorites ? 'primary' : 'ghost'"
            size="sm"
            @click="toggleFavoriteFilter"
          >
            <StarIcon class="w-4 h-4 mr-1" />
            Favoriten
          </BaseButton>
          
          <BaseButton
            :variant="state.filters.shared ? 'primary' : 'ghost'"
            size="sm"
            @click="toggleSharedFilter"
          >
            <ShareIcon class="w-4 h-4 mr-1" />
            Geteilt
          </BaseButton>
        </div>
      </div>

      <!-- 批量操作栏 -->
      <div v-if="state.selectedRecords.length > 0" class="mt-4 p-3 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm text-blue-700">
            {{ state.selectedRecords.length }} Berechnungen ausgewählt
          </span>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="ghost"
              size="sm"
              @click="batchFavorite"
            >
              <StarIcon class="w-4 h-4 mr-1" />
              Favorisieren
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              @click="showBatchCategoryDialog = true"
            >
              <TagIcon class="w-4 h-4 mr-1" />
              Kategorisieren
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              @click="batchExport"
            >
              <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
              Exportieren
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              @click="batchDelete"
              class="text-red-600 hover:text-red-700"
            >
              <TrashIcon class="w-4 h-4 mr-1" />
              Löschen
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilters" class="filters-panel bg-gray-50 border-b border-gray-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- 计算器类型 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Rechner-Typ
          </label>
          <BaseSelect
            v-model="selectedCalculatorFilter"
            :options="calculatorOptions"
            placeholder="Alle Rechner"
            multiple
            @change="applyFilters"
          />
        </div>
        
        <!-- 分类 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Kategorie
          </label>
          <BaseSelect
            v-model="selectedCategoryFilter"
            :options="categoryOptions"
            placeholder="Alle Kategorien"
            multiple
            @change="applyFilters"
          />
        </div>
        
        <!-- 日期范围 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Zeitraum
          </label>
          <BaseDateRangePicker
            v-model="dateRangeFilter"
            @change="applyFilters"
          />
        </div>
        
        <!-- 质量评分 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Qualitätsbewertung
          </label>
          <BaseRangeSlider
            v-model="qualityRangeFilter"
            :min="0"
            :max="100"
            @change="applyFilters"
          />
        </div>
      </div>
      
      <div class="mt-4 flex justify-end">
        <BaseButton
          variant="ghost"
          size="sm"
          @click="clearFilters"
        >
          Filter zurücksetzen
        </BaseButton>
      </div>
    </div>

    <!-- 智能建议 -->
    <div v-if="state.suggestions.length > 0" class="suggestions-panel bg-yellow-50 border-b border-yellow-200 p-4">
      <h3 class="text-sm font-medium text-yellow-800 mb-2">
        Intelligente Vorschläge
      </h3>
      <div class="space-y-2">
        <div
          v-for="suggestion in state.suggestions"
          :key="suggestion.type"
          class="flex items-center justify-between p-2 bg-white rounded border border-yellow-200"
        >
          <div class="flex items-center">
            <component :is="getSuggestionIcon(suggestion.type)" class="w-4 h-4 text-yellow-600 mr-2" />
            <div>
              <span class="text-sm font-medium text-gray-900">{{ suggestion.title }}</span>
              <p class="text-xs text-gray-600">{{ suggestion.description }}</p>
            </div>
          </div>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="applySuggestion(suggestion)"
          >
            Anwenden
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="history-content flex-1 overflow-hidden">
      <!-- 加载状态 -->
      <div v-if="state.isLoading" class="flex items-center justify-center h-64">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Lade Berechnungshistorie...</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="state.error" class="flex items-center justify-center h-64">
        <div class="text-center">
          <ExclamationTriangleIcon class="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p class="text-red-600 mb-4">{{ state.error }}</p>
          <BaseButton variant="outline" @click="initialize">
            Erneut versuchen
          </BaseButton>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="state.filteredRecords.length === 0" class="flex items-center justify-center h-64">
        <div class="text-center">
          <DocumentIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            Keine Berechnungen gefunden
          </h3>
          <p class="text-gray-600 mb-4">
            {{ state.searchQuery ? 'Versuchen Sie andere Suchbegriffe' : 'Erstellen Sie Ihre erste Berechnung' }}
          </p>
          <BaseButton
            v-if="state.searchQuery"
            variant="outline"
            @click="clearSearch"
          >
            Suche zurücksetzen
          </BaseButton>
        </div>
      </div>

      <!-- 历史记录内容 -->
      <div v-else class="h-full">
        <!-- 列表视图 -->
        <HistoryListView
          v-if="state.viewMode === 'list'"
          :records="state.filteredRecords"
          :selected-records="state.selectedRecords"
          @select="handleRecordSelect"
          @view="handleRecordView"
          @favorite="handleRecordFavorite"
          @delete="handleRecordDelete"
        />

        <!-- 网格视图 -->
        <HistoryGridView
          v-else-if="state.viewMode === 'grid'"
          :records="state.filteredRecords"
          :selected-records="state.selectedRecords"
          @select="handleRecordSelect"
          @view="handleRecordView"
          @favorite="handleRecordFavorite"
          @delete="handleRecordDelete"
        />

        <!-- 时间线视图 -->
        <HistoryTimelineView
          v-else-if="state.viewMode === 'timeline'"
          :records="state.filteredRecords"
          :selected-records="state.selectedRecords"
          @select="handleRecordSelect"
          @view="handleRecordView"
          @favorite="handleRecordFavorite"
          @delete="handleRecordDelete"
        />

        <!-- 分析视图 -->
        <HistoryAnalyticsView
          v-else-if="state.viewMode === 'analytics'"
          :statistics="state.statistics"
          :analytics="analytics"
          @drill-down="handleAnalyticsDrillDown"
        />
      </div>
    </div>

    <!-- 导出对话框 -->
    <ExportDialog
      v-if="showExportDialog"
      :records="state.selectedRecords.length > 0 ? selectedRecords : state.filteredRecords"
      @close="showExportDialog = false"
      @export="handleExport"
    />

    <!-- 批量分类对话框 -->
    <BatchCategoryDialog
      v-if="showBatchCategoryDialog"
      :record-count="state.selectedRecords.length"
      @close="showBatchCategoryDialog = false"
      @apply="handleBatchCategory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  StarIcon,
  ShareIcon,
  TagIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ClockIcon,
  ChartBarIcon,
  LightBulbIcon,
  DocumentDuplicateIcon,
  FolderIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseDateRangePicker from '@/components/ui/BaseDateRangePicker.vue'
import BaseRangeSlider from '@/components/ui/BaseRangeSlider.vue'
import HistoryListView from './HistoryListView.vue'
import HistoryGridView from './HistoryGridView.vue'
import HistoryTimelineView from './HistoryTimelineView.vue'
import HistoryAnalyticsView from './HistoryAnalyticsView.vue'
import ExportDialog from './ExportDialog.vue'
import BatchCategoryDialog from './BatchCategoryDialog.vue'
import { useEnhancedHistory } from '@/services/EnhancedHistoryManager'

// 使用增强历史管理器
const {
  state,
  initialize,
  search,
  applyFilters,
  batchOperation,
  autoCategorizе,
  generateAutoTags,
  detectDuplicates,
  generateAnalytics,
  exportHistory
} = useEnhancedHistory()

// 组件状态
const showFilters = ref(false)
const showExportDialog = ref(false)
const showBatchCategoryDialog = ref(false)
const searchQuery = ref('')
const selectedCalculatorFilter = ref([])
const selectedCategoryFilter = ref([])
const dateRangeFilter = ref({ start: null, end: null })
const qualityRangeFilter = ref([0, 100])

// 视图模式
const viewModes = [
  { id: 'list', name: 'Liste', icon: ListBulletIcon },
  { id: 'grid', name: 'Raster', icon: Squares2X2Icon },
  { id: 'timeline', name: 'Zeitlinie', icon: ClockIcon },
  { id: 'analytics', name: 'Analyse', icon: ChartBarIcon }
]

// 计算属性
const selectedRecords = computed(() => 
  state.records.filter(record => state.selectedRecords.includes(record.id))
)

const calculatorOptions = computed(() => {
  const calculators = new Set(state.records.map(r => r.calculatorId))
  return Array.from(calculators).map(id => ({
    value: id,
    label: getCalculatorDisplayName(id)
  }))
})

const categoryOptions = computed(() => {
  const categories = new Set(state.records.map(r => r.category).filter(Boolean))
  return Array.from(categories).map(category => ({
    value: category,
    label: category
  }))
})

const analytics = computed(() => generateAnalytics())

// 方法
const handleSearch = async () => {
  await search(searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
  handleSearch()
}

const toggleFavoriteFilter = () => {
  state.filters.favorites = !state.filters.favorites
  applyFilters()
}

const toggleSharedFilter = () => {
  state.filters.shared = !state.filters.shared
  applyFilters()
}

const clearFilters = () => {
  selectedCalculatorFilter.value = []
  selectedCategoryFilter.value = []
  dateRangeFilter.value = { start: null, end: null }
  qualityRangeFilter.value = [0, 100]
  state.filters = {
    calculator: [],
    category: [],
    tags: [],
    dateRange: { start: null, end: null },
    qualityRange: { min: 0, max: 100 },
    favorites: false,
    shared: false
  }
  applyFilters()
}

const handleRecordSelect = (recordId: string, selected: boolean) => {
  if (selected) {
    if (!state.selectedRecords.includes(recordId)) {
      state.selectedRecords.push(recordId)
    }
  } else {
    const index = state.selectedRecords.indexOf(recordId)
    if (index > -1) {
      state.selectedRecords.splice(index, 1)
    }
  }
}

const handleRecordView = (record: any) => {
  // 实现记录查看逻辑
  console.log('View record:', record)
}

const handleRecordFavorite = async (recordId: string, favorite: boolean) => {
  await batchOperation(favorite ? 'favorite' : 'unfavorite', [recordId])
}

const handleRecordDelete = async (recordId: string) => {
  if (confirm('Sind Sie sicher, dass Sie diese Berechnung löschen möchten?')) {
    await batchOperation('delete', [recordId])
  }
}

const batchFavorite = async () => {
  await batchOperation('favorite', state.selectedRecords)
  state.selectedRecords = []
}

const batchDelete = async () => {
  if (confirm(`Sind Sie sicher, dass Sie ${state.selectedRecords.length} Berechnungen löschen möchten?`)) {
    await batchOperation('delete', state.selectedRecords)
    state.selectedRecords = []
  }
}

const batchExport = async () => {
  showExportDialog.value = true
}

const handleBatchCategory = async (category: string) => {
  await batchOperation('categorize', state.selectedRecords, { category })
  state.selectedRecords = []
  showBatchCategoryDialog.value = false
}

const handleExport = async (format: string, options: any) => {
  await exportHistory(format as any, options)
  showExportDialog.value = false
}

const getSuggestionIcon = (type: string) => {
  const icons = {
    duplicate: DocumentDuplicateIcon,
    category: FolderIcon,
    tag: TagIcon,
    optimize: LightBulbIcon
  }
  return icons[type as keyof typeof icons] || LightBulbIcon
}

const applySuggestion = async (suggestion: any) => {
  switch (suggestion.action) {
    case 'review-duplicates':
      // 实现重复检测逻辑
      break
    case 'auto-categorize':
      await autoCategorizе()
      break
    case 'generate-tags':
      await generateAutoTags()
      break
  }
}

const handleAnalyticsDrillDown = (data: any) => {
  // 实现分析钻取逻辑
  console.log('Analytics drill down:', data)
}

const getCalculatorDisplayName = (id: string): string => {
  const names = {
    'compound-interest': 'Zinseszins-Rechner',
    'loan': 'Kredit-Rechner',
    'mortgage': 'Hypotheken-Rechner',
    'portfolio': 'Portfolio-Rechner',
    'tax-optimization': 'Steuer-Optimierung'
  }
  return names[id as keyof typeof names] || id
}

// 监听筛选变化
watch([selectedCalculatorFilter, selectedCategoryFilter, dateRangeFilter, qualityRangeFilter], () => {
  state.filters.calculator = selectedCalculatorFilter.value
  state.filters.category = selectedCategoryFilter.value
  state.filters.dateRange = dateRangeFilter.value
  state.filters.qualityRange = {
    min: qualityRangeFilter.value[0],
    max: qualityRangeFilter.value[1]
  }
  applyFilters()
})

// 生命周期
onMounted(async () => {
  await initialize('current-user') // 实际应该从用户上下文获取
})
</script>

<style scoped>
.enhanced-history-panel {
  @apply flex flex-col h-full bg-white;
}

.history-toolbar {
  @apply flex-shrink-0;
}

.filters-panel {
  @apply flex-shrink-0;
}

.suggestions-panel {
  @apply flex-shrink-0;
}

.history-content {
  @apply flex-1 overflow-auto;
}
</style>
