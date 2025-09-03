<template>
  <div class="favorite-manager">
    <BaseCard title="Favoriten-Verwaltung" padding="lg">
      <!-- 收藏概览 -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <BaseIcon name="star" class="text-yellow-500" size="lg" />
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ favorites.length }} Favoriten
              </h3>
              <p class="text-sm text-gray-500">
                Ihre wichtigsten Berechnungen im Überblick
              </p>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <BaseButton
              variant="secondary"
              size="sm"
              @click="toggleViewMode"
            >
              <BaseIcon :name="viewMode === 'grid' ? 'list' : 'grid'" size="sm" class="mr-1" />
              {{ viewMode === 'grid' ? 'Liste' : 'Kacheln' }}
            </BaseButton>
            
            <BaseButton
              variant="secondary"
              size="sm"
              @click="exportFavorites"
            >
              <BaseIcon name="download" size="sm" class="mr-1" />
              Exportieren
            </BaseButton>
          </div>
        </div>
        
        <!-- 快速统计 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div class="flex items-center space-x-2">
              <BaseIcon name="calculator" class="text-yellow-600" />
              <div>
                <p class="text-sm text-yellow-600">Meist favorisiert</p>
                <p class="font-semibold text-yellow-900">{{ mostFavoritedCalculator.name }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <div class="flex items-center space-x-2">
              <BaseIcon name="clock" class="text-green-600" />
              <div>
                <p class="text-sm text-green-600">Neuester Favorit</p>
                <p class="font-semibold text-green-900">{{ newestFavorite.date }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div class="flex items-center space-x-2">
              <BaseIcon name="tag" class="text-blue-600" />
              <div>
                <p class="text-sm text-blue-600">Tags gesamt</p>
                <p class="font-semibold text-blue-900">{{ uniqueTags.length }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签筛选 -->
      <div v-if="uniqueTags.length > 0" class="mb-6">
        <h4 class="text-md font-medium text-gray-900 mb-3">Nach Tags filtern</h4>
        <div class="flex flex-wrap gap-2">
          <BaseButton
            :variant="selectedTag === '' ? 'primary' : 'secondary'"
            size="sm"
            @click="selectedTag = ''"
          >
            Alle ({{ favorites.length }})
          </BaseButton>
          
          <BaseButton
            v-for="tag in uniqueTags"
            :key="tag"
            :variant="selectedTag === tag ? 'primary' : 'secondary'"
            size="sm"
            @click="selectedTag = tag"
          >
            {{ tag }} ({{ getTagCount(tag) }})
          </BaseButton>
        </div>
      </div>

      <!-- 收藏列表 -->
      <div v-if="filteredFavorites.length > 0">
        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="favorite in filteredFavorites"
            :key="favorite.id"
            class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-2">
                <BaseIcon :name="getCalculatorIcon(favorite.calculatorId)" class="text-blue-600" />
                <h5 class="font-medium text-gray-900 truncate">
                  {{ favorite.calculatorName }}
                </h5>
              </div>
              
              <div class="flex space-x-1">
                <BaseButton
                  variant="ghost"
                  size="xs"
                  @click="viewFavorite(favorite)"
                >
                  <BaseIcon name="eye" size="xs" />
                </BaseButton>
                
                <BaseButton
                  variant="ghost"
                  size="xs"
                  @click="removeFavorite(favorite)"
                >
                  <BaseIcon name="star" class="text-yellow-500" size="xs" />
                </BaseButton>
              </div>
            </div>
            
            <div class="text-sm text-gray-600 mb-3">
              {{ formatDate(favorite.timestamp) }}
            </div>
            
            <!-- 关键结果 -->
            <div class="space-y-1 mb-3">
              <div v-for="(value, key) in getKeyResults(favorite)" :key="key" class="flex justify-between">
                <span class="text-xs text-gray-500">{{ getResultLabel(key) }}</span>
                <span class="text-xs font-medium text-gray-900">{{ formatValue(value, key) }}</span>
              </div>
            </div>
            
            <!-- 标签 -->
            <div v-if="favorite.tags.length > 0" class="flex flex-wrap gap-1">
              <span
                v-for="tag in favorite.tags"
                :key="tag"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {{ tag }}
              </span>
            </div>
            
            <!-- 备注 -->
            <div v-if="favorite.notes" class="mt-2 text-xs text-gray-600 italic">
              "{{ favorite.notes }}"
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else class="space-y-3">
          <div
            v-for="favorite in filteredFavorites"
            :key="favorite.id"
            class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4 flex-1 min-w-0">
                <BaseIcon :name="getCalculatorIcon(favorite.calculatorId)" class="text-blue-600 flex-shrink-0" />
                
                <div class="flex-1 min-w-0">
                  <h5 class="font-medium text-gray-900 truncate">{{ favorite.calculatorName }}</h5>
                  <p class="text-sm text-gray-500">{{ formatDate(favorite.timestamp) }}</p>
                </div>
                
                <div class="hidden md:flex items-center space-x-6">
                  <div v-for="(value, key) in getKeyResults(favorite)" :key="key" class="text-center">
                    <div class="text-xs text-gray-500">{{ getResultLabel(key) }}</div>
                    <div class="text-sm font-medium text-gray-900">{{ formatValue(value, key) }}</div>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center space-x-2 flex-shrink-0">
                <BaseButton
                  variant="secondary"
                  size="sm"
                  @click="viewFavorite(favorite)"
                >
                  <BaseIcon name="eye" size="sm" class="mr-1" />
                  Anzeigen
                </BaseButton>
                
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="removeFavorite(favorite)"
                >
                  <BaseIcon name="star" class="text-yellow-500" size="sm" />
                </BaseButton>
              </div>
            </div>
            
            <!-- 移动端的关键结果 -->
            <div class="md:hidden mt-3 grid grid-cols-2 gap-3">
              <div v-for="(value, key) in getKeyResults(favorite)" :key="key" class="text-center bg-gray-50 p-2 rounded">
                <div class="text-xs text-gray-500">{{ getResultLabel(key) }}</div>
                <div class="text-sm font-medium text-gray-900">{{ formatValue(value, key) }}</div>
              </div>
            </div>
            
            <!-- 标签和备注 -->
            <div v-if="favorite.tags.length > 0 || favorite.notes" class="mt-3 pt-3 border-t border-gray-100">
              <div v-if="favorite.tags.length > 0" class="flex flex-wrap gap-1 mb-2">
                <span
                  v-for="tag in favorite.tags"
                  :key="tag"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {{ tag }}
                </span>
              </div>
              
              <div v-if="favorite.notes" class="text-sm text-gray-600 italic">
                "{{ favorite.notes }}"
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-12">
        <BaseIcon name="star" size="3xl" class="mx-auto text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ selectedTag ? 'Keine Favoriten mit diesem Tag' : 'Noch keine Favoriten' }}
        </h3>
        <p class="text-gray-500 mb-4">
          {{ selectedTag 
             ? 'Versuchen Sie einen anderen Tag oder entfernen Sie den Filter.'
             : 'Markieren Sie wichtige Berechnungen als Favoriten, um sie hier zu sehen.' }}
        </p>
        
        <BaseButton
          v-if="selectedTag"
          variant="secondary"
          @click="selectedTag = ''"
        >
          Filter entfernen
        </BaseButton>
      </div>

      <!-- 批量操作 -->
      <div v-if="favorites.length > 0" class="mt-6 pt-6 border-t border-gray-200">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-500">
            {{ filteredFavorites.length }} von {{ favorites.length }} Favoriten angezeigt
          </div>
          
          <div class="flex space-x-3">
            <BaseButton
              variant="secondary"
              size="sm"
              @click="createFavoriteCollection"
            >
              <BaseIcon name="folder-plus" size="sm" class="mr-1" />
              Sammlung erstellen
            </BaseButton>
            
            <BaseButton
              variant="danger"
              size="sm"
              @click="confirmRemoveAllFavorites"
            >
              <BaseIcon name="trash" size="sm" class="mr-1" />
              Alle entfernen
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- 确认对话框 -->
    <div v-if="showRemoveAllConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg max-w-md mx-4">
        <div class="flex items-center space-x-3 mb-4">
          <BaseIcon name="exclamation-triangle" class="text-red-600" size="lg" />
          <h3 class="text-lg font-semibold text-gray-900">Alle Favoriten entfernen?</h3>
        </div>
        
        <p class="text-gray-600 mb-6">
          Sind Sie sicher, dass Sie alle {{ favorites.length }} Favoriten entfernen möchten? 
          Die Berechnungen bleiben in Ihrer Historie erhalten.
        </p>
        
        <div class="flex space-x-3">
          <BaseButton
            variant="danger"
            @click="removeAllFavorites"
            class="flex-1"
          >
            Ja, alle entfernen
          </BaseButton>
          <BaseButton
            variant="secondary"
            @click="showRemoveAllConfirm = false"
            class="flex-1"
          >
            Abbrechen
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CalculationHistory } from '@/services/LocalStorageService'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'

interface Props {
  favorites: CalculationHistory[]
}

interface Emits {
  (e: 'view-favorite', favorite: CalculationHistory): void
  (e: 'remove-favorite', favorite: CalculationHistory): void
  (e: 'remove-all-favorites'): void
  (e: 'export-favorites', favorites: CalculationHistory[]): void
  (e: 'create-collection', favorites: CalculationHistory[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态管理
const viewMode = ref<'grid' | 'list'>('grid')
const selectedTag = ref('')
const showRemoveAllConfirm = ref(false)

// 计算属性
const uniqueTags = computed(() => {
  const tags = new Set<string>()
  props.favorites.forEach(fav => {
    fav.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
})

const filteredFavorites = computed(() => {
  if (!selectedTag.value) return props.favorites
  return props.favorites.filter(fav => fav.tags.includes(selectedTag.value))
})

const mostFavoritedCalculator = computed(() => {
  const usage: Record<string, number> = {}
  props.favorites.forEach(fav => {
    usage[fav.calculatorId] = (usage[fav.calculatorId] || 0) + 1
  })
  
  const mostUsedId = Object.keys(usage).reduce((a, b) => usage[a] > usage[b] ? a : b, '')
  return {
    id: mostUsedId,
    name: getCalculatorName(mostUsedId),
    count: usage[mostUsedId] || 0
  }
})

const newestFavorite = computed(() => {
  if (props.favorites.length === 0) return { date: '-' }
  
  const newest = props.favorites.reduce((latest, current) => 
    new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
  )
  
  return {
    date: formatDate(newest.timestamp),
    calculation: newest
  }
})

// 方法
const getCalculatorIcon = (calculatorId: string): string => {
  const icons: Record<string, string> = {
    'compound-interest': 'chart-line',
    'loan': 'credit-card',
    'mortgage': 'home'
  }
  return icons[calculatorId] || 'calculator'
}

const getCalculatorName = (calculatorId: string): string => {
  const names: Record<string, string> = {
    'compound-interest': 'Zinseszins-Rechner',
    'loan': 'Darlehensrechner',
    'mortgage': 'Baufinanzierungsrechner'
  }
  return names[calculatorId] || calculatorId
}

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getKeyResults = (favorite: CalculationHistory): Record<string, any> => {
  const results = favorite.results
  const keyResults: Record<string, any> = {}
  
  // 根据计算器类型提取关键结果（最多3个）
  switch (favorite.calculatorId) {
    case 'compound-interest':
      if (results.finalAmount) keyResults.finalAmount = results.finalAmount
      if (results.totalInterest) keyResults.totalInterest = results.totalInterest
      if (results.annualReturn) keyResults.annualReturn = results.annualReturn
      break
      
    case 'loan':
      if (results.monthlyPayment) keyResults.monthlyPayment = results.monthlyPayment
      if (results.totalInterest) keyResults.totalInterest = results.totalInterest
      if (results.totalPayment) keyResults.totalPayment = results.totalPayment
      break
      
    case 'mortgage':
      if (results.monthlyPayment) keyResults.monthlyPayment = results.monthlyPayment
      if (results.totalCosts) keyResults.totalCosts = results.totalCosts
      if (results.affordabilityRatio) keyResults.affordabilityRatio = results.affordabilityRatio
      break
  }
  
  // 限制为前3个结果
  const entries = Object.entries(keyResults).slice(0, 3)
  return Object.fromEntries(entries)
}

const getResultLabel = (key: string): string => {
  const labels: Record<string, string> = {
    finalAmount: 'Endbetrag',
    totalInterest: 'Zinsen',
    annualReturn: 'Rendite',
    monthlyPayment: 'Monatsrate',
    totalPayment: 'Gesamtzahlung',
    totalCosts: 'Gesamtkosten',
    affordabilityRatio: 'Belastung'
  }
  return labels[key] || key
}

const formatValue = (value: any, key: string): string => {
  if (typeof value === 'number') {
    if (key.includes('Ratio') || key.includes('Return')) {
      return `${(value * 100).toFixed(1)}%`
    }
    return `€${value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  return String(value)
}

const getTagCount = (tag: string): number => {
  return props.favorites.filter(fav => fav.tags.includes(tag)).length
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const viewFavorite = (favorite: CalculationHistory) => {
  emit('view-favorite', favorite)
}

const removeFavorite = (favorite: CalculationHistory) => {
  emit('remove-favorite', favorite)
}

const confirmRemoveAllFavorites = () => {
  showRemoveAllConfirm.value = true
}

const removeAllFavorites = () => {
  emit('remove-all-favorites')
  showRemoveAllConfirm.value = false
}

const exportFavorites = () => {
  emit('export-favorites', filteredFavorites.value)
}

const createFavoriteCollection = () => {
  emit('create-collection', filteredFavorites.value)
}
</script>

<style scoped>
.favorite-manager {
  @apply w-full;
}

/* 网格项悬停效果 */
.favorite-manager .hover\:shadow-md:hover {
  transform: translateY(-1px);
}

/* 标签动画 */
.favorite-manager .inline-flex {
  transition: all 0.2s ease-in-out;
}

.favorite-manager .inline-flex:hover {
  transform: scale(1.05);
}
</style>
