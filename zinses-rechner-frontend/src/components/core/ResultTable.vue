<template>
  <BaseCard :title="table.title" padding="lg">
    <div class="table-container">
      <!-- 表格头部操作 -->
      <div v-if="table.exportable" class="flex justify-end mb-4">
        <BaseButton
          variant="secondary"
          size="sm"
          icon-left="download"
          @click="exportTable"
        >
          Exportieren
        </BaseButton>
      </div>

      <!-- 表格内容 -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="column in table.columns"
                :key="column.key"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                :class="{ 'cursor-pointer': column.sortable }"
                @click="column.sortable ? handleSort(column.key) : null"
              >
                <div class="flex items-center space-x-1">
                  <span>{{ column.label }}</span>
                  <BaseIcon
                    v-if="column.sortable"
                    :name="getSortIcon(column.key)"
                    size="sm"
                    class="text-gray-400"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="(row, index) in sortedData"
              :key="index"
              class="hover:bg-gray-50"
            >
              <td
                v-for="column in table.columns"
                :key="column.key"
                class="px-6 py-4 whitespace-nowrap text-sm"
                :class="getColumnClasses(column)"
              >
                {{ formatCellValue(row[column.key], column.format) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页控制 -->
      <div
        v-if="table.pagination && totalPages > 1"
        class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200"
      >
        <div class="text-sm text-gray-700">
          Zeige {{ startIndex + 1 }} bis {{ endIndex }} von {{ data.length }} Einträgen
        </div>
        
        <div class="flex space-x-2">
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Zurück
          </BaseButton>
          
          <span class="px-3 py-1 text-sm text-gray-700">
            Seite {{ currentPage }} von {{ totalPages }}
          </span>
          
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Weiter
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TableConfig, TableColumn } from '@/types/calculator'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'

interface Props {
  table: TableConfig
  data: any[]
}

const props = defineProps<Props>()

// 状态管理
const currentPage = ref(1)
const pageSize = ref(10)
const sortColumn = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// 计算属性
const sortedData = computed(() => {
  const result = [...(props.data || [])]
  
  if (sortColumn.value) {
    result.sort((a, b) => {
      const aVal = a[sortColumn.value!]
      const bVal = b[sortColumn.value!]
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      
      if (sortDirection.value === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  }
  
  // 分页
  if (props.table.pagination) {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return result.slice(start, end)
  }
  
  return result
})

const totalPages = computed(() => {
  if (!props.table.pagination) return 1
  return Math.ceil((props.data?.length || 0) / pageSize.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + pageSize.value, props.data?.length || 0)
})

// 方法
const handleSort = (columnKey: string) => {
  if (sortColumn.value === columnKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = columnKey
    sortDirection.value = 'asc'
  }
}

const getSortIcon = (columnKey: string): string => {
  if (sortColumn.value !== columnKey) return 'chevron-up-down'
  return sortDirection.value === 'asc' ? 'chevron-up' : 'chevron-down'
}

const getColumnClasses = (column: TableColumn): string => {
  const classes = ['text-gray-900']
  
  if (column.format === 'currency' || column.format === 'number') {
    classes.push('text-right', 'font-mono')
  }
  
  return classes.join(' ')
}

const formatCellValue = (value: any, format?: string): string => {
  if (value === null || value === undefined) return '—'
  
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
      return formatPercentage(value)
    case 'number':
      return new Intl.NumberFormat('de-DE').format(value)
    case 'date':
      return new Date(value).toLocaleDateString('de-DE')
    default:
      return String(value)
  }
}

const exportTable = () => {
  // TODO: 实现表格导出功能
  console.log('导出表格:', props.table.title)
}
</script>

<style scoped>
.table-container {
  @apply w-full;
}
</style>
