<template>
  <div class="yearly-breakdown-table">
    <div class="table-header mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h3 class="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
        Jährliche Aufschlüsselung
      </h3>
      <div class="table-controls flex gap-2">
        <button
          @click="exportToCSV"
          class="px-3 py-1 text-sm bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors"
        >
          CSV Export
        </button>
        <button
          @click="toggleView"
          class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          {{ isCompactView ? 'Detailansicht' : 'Kompaktansicht' }}
        </button>
      </div>
    </div>

    <!-- 移动端卡片视图 -->
    <div v-if="isMobile" class="mobile-cards space-y-4">
      <div
        v-for="(row, index) in sortedData"
        :key="row.year"
        class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
      >
        <div class="flex justify-between items-center mb-3">
          <h4 class="text-lg font-semibold text-gray-800">Jahr {{ row.year }}</h4>
          <span class="text-sm text-gray-500">#{{ index + 1 }}</span>
        </div>
        
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-600">Startkapital:</span>
            <p class="font-medium currency">{{ formatCurrency(row.start_amount) }}</p>
          </div>
          <div>
            <span class="text-gray-600">Einzahlungen:</span>
            <p class="font-medium currency">{{ formatCurrency(row.contributions) }}</p>
          </div>
          <div>
            <span class="text-gray-600">Zinserträge:</span>
            <p class="font-medium text-success-600 currency">{{ formatCurrency(row.interest) }}</p>
          </div>
          <div>
            <span class="text-gray-600">Endkapital:</span>
            <p class="font-bold text-primary-600 currency">{{ formatCurrency(row.end_amount) }}</p>
          </div>
          <div class="col-span-2">
            <span class="text-gray-600">Wachstum:</span>
            <p class="font-medium" :class="getGrowthColor(row.growth_rate)">
              {{ formatPercentage(row.growth_rate) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 桌面端表格视图 -->
    <div v-else class="table-container overflow-x-auto">
      <table class="w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              @click="sort(column.key)"
              :class="[
                'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors',
                { 'bg-gray-200': sortKey === column.key }
              ]"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <BaseIcon
                  v-if="sortKey === column.key"
                  :name="sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'"
                  size="sm"
                  class="text-gray-400"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="(row, index) in sortedData"
            :key="row.year"
            :class="[
              'hover:bg-gray-50 transition-colors',
              { 'bg-blue-50': index === highlightedRow }
            ]"
            @mouseenter="highlightedRow = index"
            @mouseleave="highlightedRow = -1"
          >
            <td class="px-4 py-3 text-sm font-medium text-gray-900">
              {{ row.year }}
            </td>
            <td v-if="!isCompactView" class="px-4 py-3 text-sm text-gray-900 currency">
              {{ formatCurrency(row.start_amount) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-900 currency">
              {{ formatCurrency(row.contributions) }}
            </td>
            <td class="px-4 py-3 text-sm font-medium text-success-600 currency">
              {{ formatCurrency(row.interest) }}
            </td>
            <td class="px-4 py-3 text-sm font-bold text-primary-600 currency">
              {{ formatCurrency(row.end_amount) }}
            </td>
            <td class="px-4 py-3 text-sm font-medium" :class="getGrowthColor(row.growth_rate)">
              {{ formatPercentage(row.growth_rate) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 表格统计信息 -->
    <div class="table-summary mt-4 p-4 bg-gray-50 rounded-lg">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
        <div class="text-center">
          <p class="text-gray-600">Gesamte Einzahlungen</p>
          <p class="font-bold text-gray-800 currency">{{ formatCurrency(totalContributions) }}</p>
        </div>
        <div class="text-center">
          <p class="text-gray-600">Gesamte Zinserträge</p>
          <p class="font-bold text-success-600 currency">{{ formatCurrency(totalInterest) }}</p>
        </div>
        <div class="text-center">
          <p class="text-gray-600">Durchschn. Wachstum</p>
          <p class="font-bold text-primary-600">{{ formatPercentage(averageGrowth) }}</p>
        </div>
        <div class="text-center">
          <p class="text-gray-600">Beste Jahr</p>
          <p class="font-bold text-success-600">
            {{ bestYear.year }} ({{ formatPercentage(bestYear.growth) }})
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import BaseIcon from '../ui/BaseIcon.vue'
import type { YearlyData } from '@/types/calculator'

interface Props {
  yearlyData: YearlyData[]
}

const props = defineProps<Props>()

// 响应式状态
const isMobile = ref(false)
const isCompactView = ref(false)
const sortKey = ref<keyof YearlyData>('year')
const sortOrder = ref<'asc' | 'desc'>('asc')
const highlightedRow = ref(-1)

// 表格列定义
const allColumns = [
  { key: 'year', label: 'Jahr' },
  { key: 'start_amount', label: 'Startkapital' },
  { key: 'contributions', label: 'Einzahlungen' },
  { key: 'interest', label: 'Zinserträge' },
  { key: 'end_amount', label: 'Endkapital' },
  { key: 'growth_rate', label: 'Wachstum' }
]

const compactColumns = [
  { key: 'year', label: 'Jahr' },
  { key: 'contributions', label: 'Einzahlungen' },
  { key: 'interest', label: 'Zinserträge' },
  { key: 'end_amount', label: 'Endkapital' },
  { key: 'growth_rate', label: 'Wachstum' }
]

const visibleColumns = computed(() => 
  isCompactView.value ? compactColumns : allColumns
)

// 检测移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 排序功能
const sort = (key: keyof YearlyData) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortedData = computed(() => {
  const data = [...props.yearlyData]
  return data.sort((a, b) => {
    const aVal = a[sortKey.value]
    const bVal = b[sortKey.value]
    const modifier = sortOrder.value === 'asc' ? 1 : -1
    
    if (aVal < bVal) return -1 * modifier
    if (aVal > bVal) return 1 * modifier
    return 0
  })
})

// 统计计算
const totalContributions = computed(() =>
  props.yearlyData.reduce((sum, data) => sum + data.contributions, 0)
)

const totalInterest = computed(() =>
  props.yearlyData.reduce((sum, data) => sum + data.interest, 0)
)

const averageGrowth = computed(() => {
  if (props.yearlyData.length === 0) return 0
  const totalGrowth = props.yearlyData.reduce((sum, data) => sum + data.growth_rate, 0)
  return totalGrowth / props.yearlyData.length
})

const bestYear = computed(() => {
  if (props.yearlyData.length === 0) return { year: 0, growth: 0 }
  const best = props.yearlyData.reduce((max, data) => 
    data.growth_rate > max.growth_rate ? data : max
  )
  return { year: best.year, growth: best.growth_rate }
})

// 工具函数
const getGrowthColor = (growth: number) => {
  if (growth > 5) return 'text-success-600'
  if (growth > 0) return 'text-primary-600'
  return 'text-danger-600'
}

const toggleView = () => {
  isCompactView.value = !isCompactView.value
}

const exportToCSV = () => {
  const headers = visibleColumns.value.map(col => col.label).join(';')
  const rows = sortedData.value.map(row => 
    visibleColumns.value.map(col => {
      const value = row[col.key as keyof YearlyData]
      return typeof value === 'number' ? value.toFixed(2) : value
    }).join(';')
  )
  
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `zinseszins-aufschluesselung-${new Date().getFullYear()}.csv`
  link.click()
}
</script>

<style scoped>
.table-container {
  border-radius: 0.5rem;
  overflow: hidden;
}

.currency {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
}

@media (max-width: 640px) {
  .table-controls {
    justify-content: center;
  }
}
</style>
