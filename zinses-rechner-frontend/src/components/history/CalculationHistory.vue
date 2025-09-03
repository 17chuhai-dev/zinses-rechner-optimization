<template>
  <div class="calculation-history">
    <BaseCard title="Berechnungshistorie" padding="lg">
      <!-- 增强的搜索和筛选 -->
      <div class="mb-6 space-y-4">
        <!-- 主搜索行 -->
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- 智能搜索框 -->
          <div class="flex-1 relative">
            <BaseInput
              v-model="searchQuery"
              type="text"
              placeholder="Berechnungen suchen... (z.B. 'Zinssatz > 3%' oder 'letzten 30 Tage')"
              prefix-icon="search"
              @input="handleSmartSearch"
              @keydown.enter="executeSearch"
            />
            <!-- 搜索建议下拉 -->
            <div
              v-if="searchSuggestions.length > 0 && showSuggestions"
              class="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg mt-1"
            >
              <div
                v-for="(suggestion, index) in searchSuggestions"
                :key="index"
                class="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                @click="applySuggestion(suggestion)"
              >
                <div class="flex items-center">
                  <BaseIcon :name="suggestion.icon" size="sm" class="mr-2 text-gray-400" />
                  <span>{{ suggestion.text }}</span>
                  <span class="ml-auto text-xs text-gray-500">{{ suggestion.count }} Ergebnisse</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 计算器类型筛选 -->
          <div class="sm:w-48">
            <BaseSelect
              v-model="selectedCalculator"
              :options="calculatorOptions"
              placeholder="Alle Rechner"
              @change="handleFilterChange"
            />
          </div>

          <!-- 快速筛选按钮 -->
          <div class="flex gap-2">
            <BaseButton
              :variant="showFavoritesOnly ? 'primary' : 'outline'"
              size="sm"
              @click="toggleFavoritesFilter"
            >
              <StarIcon class="w-4 h-4 mr-1" />
              Favoriten
            </BaseButton>
            <BaseButton
              :variant="showRecentOnly ? 'primary' : 'outline'"
              size="sm"
              @click="toggleRecentFilter"
            >
              <ClockIcon class="w-4 h-4 mr-1" />
              Letzte 7 Tage
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              @click="showAdvancedFilters = !showAdvancedFilters"
            >
              <AdjustmentsHorizontalIcon class="w-4 h-4 mr-1" />
              Filter
            </BaseButton>
          </div>
        </div>

        <!-- 高级筛选面板 -->
        <div
          v-if="showAdvancedFilters"
          class="advanced-filters bg-gray-50 rounded-lg p-4 space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- 日期范围 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Zeitraum</label>
              <BaseSelect
                v-model="dateRange"
                :options="dateRangeOptions"
                @change="handleFilterChange"
              />
            </div>

            <!-- 标签筛选 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <BaseMultiSelect
                v-model="selectedTags"
                :options="availableTags"
                placeholder="Tags auswählen"
                @change="handleFilterChange"
              />
            </div>

            <!-- 结果范围 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ergebnisbereich</label>
              <div class="flex gap-2">
                <BaseInput
                  v-model="resultRangeMin"
                  type="number"
                  placeholder="Min"
                  size="sm"
                  @input="handleFilterChange"
                />
                <BaseInput
                  v-model="resultRangeMax"
                  type="number"
                  placeholder="Max"
                  size="sm"
                  @input="handleFilterChange"
                />
              </div>
            </div>

            <!-- 排序选项 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sortierung</label>
              <BaseSelect
                v-model="sortBy"
                :options="sortOptions"
                @change="handleSortChange"
              />
            </div>
          </div>

          <!-- 筛选操作 -->
          <div class="flex justify-between items-center pt-2 border-t border-gray-200">
            <div class="text-sm text-gray-600">
              {{ filteredHistory.length }} von {{ history.length }} Berechnungen
            </div>
            <div class="flex gap-2">
              <BaseButton
                variant="outline"
                size="sm"
                @click="clearAllFilters"
              >
                Alle Filter löschen
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                @click="saveCurrentFilters"
              >
                Filter speichern
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- 活跃筛选标签 -->
        <div v-if="activeFilters.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="filter in activeFilters"
            :key="filter.key"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
          >
            {{ filter.label }}
            <button
              @click="removeFilter(filter.key)"
              class="ml-2 hover:text-blue-600"
            >
              <XMarkIcon class="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>

      <!-- 批量操作和分析面板 -->
      <div v-if="selectedItems.length > 0 || comparisonItems.length > 0" class="mb-6 space-y-4">
        <!-- 批量操作 -->
        <div v-if="selectedItems.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <CheckCircleIcon class="w-5 h-5 mr-2 text-yellow-600" />
              <span class="text-sm font-medium text-yellow-900">
                {{ selectedItems.length }} Berechnungen ausgewählt
              </span>
            </div>
            <div class="flex space-x-2">
              <BaseButton
                variant="outline"
                size="sm"
                @click="bulkAddToFavorites"
              >
                <StarIcon class="w-4 h-4 mr-1" />
                Zu Favoriten
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                @click="bulkAddTags"
              >
                <TagIcon class="w-4 h-4 mr-1" />
                Tags hinzufügen
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                @click="bulkExport"
              >
                <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
                Exportieren
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                @click="bulkDelete"
                class="text-red-600 hover:text-red-700"
              >
                <TrashIcon class="w-4 h-4 mr-1" />
                Löschen
              </BaseButton>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="clearSelection"
              >
                Auswahl aufheben
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- 比较功能 -->
        <div v-if="comparisonItems.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <ScaleIcon class="w-5 h-5 mr-2 text-blue-600" />
              <span class="text-sm font-medium text-blue-900">
                {{ comparisonItems.length }} Berechnungen zum Vergleich ausgewählt
              </span>
            </div>
            <div class="flex space-x-2">
              <BaseButton
                variant="primary"
                size="sm"
                @click="compareCalculations"
                :disabled="comparisonItems.length < 2"
              >
                <ChartBarIcon class="w-4 h-4 mr-1" />
                Vergleichen
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                @click="showComparisonAnalysis = true"
                :disabled="comparisonItems.length < 2"
              >
                <PresentationChartLineIcon class="w-4 h-4 mr-1" />
                Analysieren
              </BaseButton>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="clearComparison"
              >
                Löschen
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- 快速统计 -->
        <div v-if="showQuickStats" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-gray-900">{{ quickStats.totalCalculations }}</div>
              <div class="text-sm text-gray-600">Gesamt</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">{{ quickStats.avgResult }}</div>
              <div class="text-sm text-gray-600">Ø Ergebnis</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-blue-600">{{ quickStats.favoriteCount }}</div>
              <div class="text-sm text-gray-600">Favoriten</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-600">{{ quickStats.thisMonth }}</div>
              <div class="text-sm text-gray-600">Diesen Monat</div>
            </div>
          </div>
        </div>
      </div>

        <!-- 排序选项 -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">Sortieren nach:</span>
            <BaseButton
              :variant="sortBy === 'date' ? 'primary' : 'ghost'"
              size="sm"
              @click="setSortBy('date')"
            >
              Datum
            </BaseButton>
            <BaseButton
              :variant="sortBy === 'calculator' ? 'primary' : 'ghost'"
              size="sm"
              @click="setSortBy('calculator')"
            >
              Rechner
            </BaseButton>
            <BaseButton
              :variant="sortBy === 'favorite' ? 'primary' : 'ghost'"
              size="sm"
              @click="setSortBy('favorite')"
            >
              Favoriten
            </BaseButton>

            <!-- 排序方向 -->
            <BaseButton
              variant="ghost"
              size="sm"
              @click="toggleSortDirection"
            >
              <BaseIcon :name="sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" size="sm" />
            </BaseButton>
          </div>

          <!-- 视图选项 -->
          <div class="flex items-center space-x-2">
            <BaseButton
              variant="ghost"
              size="sm"
              @click="showQuickStats = !showQuickStats"
            >
              <ChartBarIcon class="w-4 h-4 mr-1" />
              Statistiken
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              @click="toggleSelectMode"
            >
              <CheckCircleIcon class="w-4 h-4 mr-1" />
              {{ selectMode ? 'Auswahl beenden' : 'Auswählen' }}
            </BaseButton>
          </div>
        </div>

      <!-- 加载状态 -->
      <LoadingState
        v-if="isLoading"
        :is-loading="true"
        message="Lade Berechnungshistorie..."
        type="spinner"
        size="md"
        class="py-8"
      />

      <!-- 历史记录列表 -->
      <div v-else-if="filteredHistory.length > 0" class="space-y-4">
        <HistoryItem
          v-for="item in paginatedHistory"
          :key="item.id"
          :calculation="item"
          @favorite="toggleFavorite"
          @delete="deleteCalculation"
          @view="viewCalculation"
          @compare="addToComparison"
        />

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="flex justify-center mt-6">
          <div class="flex items-center space-x-2">
            <BaseButton
              variant="secondary"
              size="sm"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              <BaseIcon name="chevron-left" size="sm" />
            </BaseButton>

            <span class="text-sm text-gray-600">
              Seite {{ currentPage }} von {{ totalPages }}
            </span>

            <BaseButton
              variant="secondary"
              size="sm"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              <BaseIcon name="chevron-right" size="sm" />
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-12">
        <BaseIcon name="clock" size="3xl" class="mx-auto text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ searchQuery || selectedCalculator || showFavoritesOnly
             ? 'Keine Ergebnisse gefunden'
             : 'Noch keine Berechnungen' }}
        </h3>
        <p class="text-gray-500 mb-4">
          {{ searchQuery || selectedCalculator || showFavoritesOnly
             ? 'Versuchen Sie andere Suchkriterien oder Filter.'
             : 'Ihre Berechnungshistorie wird hier angezeigt, sobald Sie Berechnungen durchführen.' }}
        </p>

        <BaseButton
          v-if="searchQuery || selectedCalculator || showFavoritesOnly"
          variant="secondary"
          @click="clearFilters"
        >
          Filter zurücksetzen
        </BaseButton>
      </div>

      <!-- 比较功能 -->
      <div v-if="comparisonItems.length > 0" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <BaseIcon name="scale" class="text-blue-600" />
            <span class="text-sm font-medium text-blue-900">
              {{ comparisonItems.length }} Berechnungen zum Vergleich ausgewählt
            </span>
          </div>

          <div class="flex space-x-2">
            <BaseButton
              variant="primary"
              size="sm"
              :disabled="comparisonItems.length < 2"
              @click="compareCalculations"
            >
              Vergleichen
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="sm"
              @click="clearComparison"
            >
              Löschen
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { localStorageService, type CalculationHistory } from '@/services/LocalStorageService'
import BaseCard from '../ui/BaseCard.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseSelect from '../ui/BaseSelect.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import LoadingState from '../ui/LoadingState.vue'
import HistoryItem from './HistoryItem.vue'

interface Emits {
  (e: 'view-calculation', calculation: CalculationHistory): void
  (e: 'compare-calculations', calculations: CalculationHistory[]): void
}

const emit = defineEmits<Emits>()

// 状态管理
const history = ref<CalculationHistory[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCalculator = ref('')
const showFavoritesOnly = ref(false)
const sortBy = ref<'date' | 'calculator' | 'favorite'>('date')
const sortDirection = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const itemsPerPage = 10
const comparisonItems = ref<CalculationHistory[]>([])

// 计算器选项
const calculatorOptions = computed(() => {
  const uniqueCalculators = [...new Set(history.value.map(h => h.calculatorId))]
  return [
    { value: '', label: 'Alle Rechner' },
    ...uniqueCalculators.map(id => ({
      value: id,
      label: getCalculatorName(id)
    }))
  ]
})

// 筛选后的历史记录
const filteredHistory = computed(() => {
  let filtered = [...history.value]

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.calculatorName.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 计算器类型筛选
  if (selectedCalculator.value) {
    filtered = filtered.filter(item => item.calculatorId === selectedCalculator.value)
  }

  // 收藏筛选
  if (showFavoritesOnly.value) {
    filtered = filtered.filter(item => item.isFavorite)
  }

  // 排序
  filtered.sort((a, b) => {
    let comparison = 0

    switch (sortBy.value) {
      case 'date':
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        break
      case 'calculator':
        comparison = a.calculatorName.localeCompare(b.calculatorName)
        break
      case 'favorite':
        comparison = (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
        break
    }

    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  return filtered
})

// 分页
const totalPages = computed(() => Math.ceil(filteredHistory.value.length / itemsPerPage))

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredHistory.value.slice(start, end)
})

// 方法
const getCalculatorName = (calculatorId: string): string => {
  const names: Record<string, string> = {
    'compound-interest': 'Zinseszins-Rechner',
    'loan': 'Darlehensrechner',
    'mortgage': 'Baufinanzierungsrechner'
  }
  return names[calculatorId] || calculatorId
}

const loadHistory = async () => {
  isLoading.value = true
  try {
    history.value = await localStorageService.getCalculationHistory()
  } catch (error) {
    console.error('Failed to load calculation history:', error)
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const toggleFavoritesFilter = () => {
  showFavoritesOnly.value = !showFavoritesOnly.value
  currentPage.value = 1
}

const setSortBy = (newSortBy: 'date' | 'calculator' | 'favorite') => {
  if (sortBy.value === newSortBy) {
    toggleSortDirection()
  } else {
    sortBy.value = newSortBy
    sortDirection.value = 'desc'
  }
  currentPage.value = 1
}

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCalculator.value = ''
  showFavoritesOnly.value = false
  currentPage.value = 1
}

const toggleFavorite = async (calculation: CalculationHistory) => {
  try {
    // 更新本地状态
    const index = history.value.findIndex(h => h.id === calculation.id)
    if (index !== -1) {
      history.value[index].isFavorite = !history.value[index].isFavorite
    }

    // 这里应该调用存储服务更新收藏状态
    // 由于当前的LocalStorageService没有更新单个记录的方法，
    // 我们需要重新保存整个记录
    console.log('Toggle favorite for:', calculation.id)
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
  }
}

const deleteCalculation = async (calculation: CalculationHistory) => {
  try {
    await localStorageService.deleteCalculation(calculation.id)

    // 从本地状态中移除
    const index = history.value.findIndex(h => h.id === calculation.id)
    if (index !== -1) {
      history.value.splice(index, 1)
    }

    // 从比较列表中移除
    const comparisonIndex = comparisonItems.value.findIndex(c => c.id === calculation.id)
    if (comparisonIndex !== -1) {
      comparisonItems.value.splice(comparisonIndex, 1)
    }
  } catch (error) {
    console.error('Failed to delete calculation:', error)
  }
}

const viewCalculation = (calculation: CalculationHistory) => {
  emit('view-calculation', calculation)
}

const addToComparison = (calculation: CalculationHistory) => {
  const exists = comparisonItems.value.find(c => c.id === calculation.id)
  if (!exists && comparisonItems.value.length < 5) {
    comparisonItems.value.push(calculation)
  }
}

const compareCalculations = () => {
  if (comparisonItems.value.length >= 2) {
    emit('compare-calculations', comparisonItems.value)
  }
}

const clearComparison = () => {
  comparisonItems.value = []
}

// 监听筛选变化，重置页码
watch([searchQuery, selectedCalculator, showFavoritesOnly], () => {
  currentPage.value = 1
})

// 生命周期
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.calculation-history {
  @apply w-full;
}
</style>
