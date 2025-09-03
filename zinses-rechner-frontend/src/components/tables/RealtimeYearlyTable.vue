<!--
  实时年度明细表格组件
  创建支持实时更新的年度明细表格组件，包含虚拟滚动和动画过渡效果
-->

<template>
  <div class="realtime-yearly-table" :class="{ 'table-loading': isLoading }">
    <!-- 表格头部控制 -->
    <div class="table-header">
      <div class="header-left">
        <h3>{{ $t('table.yearlyBreakdown') }}</h3>
        <span class="data-count">{{ $t('table.totalYears', { count: totalYears }) }}</span>
      </div>
      
      <div class="header-right">
        <!-- 显示选项 -->
        <div class="display-options">
          <label class="option-label">
            <input 
              v-model="showInterestOnly" 
              type="checkbox" 
              class="option-checkbox"
            />
            {{ $t('table.showInterestOnly') }}
          </label>
          
          <label class="option-label">
            <input 
              v-model="showCumulativeValues" 
              type="checkbox" 
              class="option-checkbox"
            />
            {{ $t('table.showCumulative') }}
          </label>
        </div>
        
        <!-- 导出按钮 -->
        <button @click="exportTable" class="export-button">
          <Icon name="download" size="16" />
          {{ $t('table.export') }}
        </button>
      </div>
    </div>

    <!-- 虚拟滚动表格容器 -->
    <div class="table-container" ref="tableContainer">
      <div class="table-wrapper">
        <!-- 表格头 -->
        <div class="table-head" :style="{ transform: `translateX(-${scrollLeft}px)` }">
          <div class="table-row header-row">
            <div 
              v-for="column in visibleColumns" 
              :key="column.key"
              class="table-cell header-cell"
              :class="[`cell-${column.key}`, { sortable: column.sortable }]"
              :style="{ width: column.width }"
              @click="column.sortable && handleSort(column.key)"
            >
              <span class="cell-content">{{ column.label }}</span>
              <Icon 
                v-if="column.sortable && sortBy === column.key"
                :name="sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'"
                size="14"
                class="sort-icon"
              />
            </div>
          </div>
        </div>

        <!-- 虚拟滚动内容 -->
        <div 
          class="table-body" 
          :style="{ height: `${containerHeight}px` }"
          @scroll="handleScroll"
          ref="tableBody"
        >
          <!-- 占位空间 -->
          <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
            <!-- 可见行 -->
            <div
              v-for="(item, index) in visibleItems"
              :key="item.year"
              class="table-row data-row"
              :class="{ 
                'row-highlighted': highlightedRows.includes(item.year),
                'row-changed': changedRows.includes(item.year),
                'row-even': index % 2 === 0,
                'row-odd': index % 2 === 1
              }"
              :style="{ 
                position: 'absolute',
                top: `${(startIndex + index) * rowHeight}px`,
                width: '100%',
                height: `${rowHeight}px`
              }"
            >
              <div 
                v-for="column in visibleColumns"
                :key="column.key"
                class="table-cell data-cell"
                :class="`cell-${column.key}`"
                :style="{ width: column.width }"
              >
                <div class="cell-content">
                  <AnimationTransition
                    v-if="column.animated && changedRows.includes(item.year)"
                    type="number"
                    :value="getCellValue(item, column.key)"
                    :previous-value="getPreviousCellValue(item, column.key)"
                    :format-type="column.format"
                    :animation-speed="animationSpeed"
                  />
                  <span v-else>{{ formatCellValue(getCellValue(item, column.key), column.format) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载覆盖层 -->
      <div v-if="isLoading" class="table-loading-overlay">
        <div class="loading-content">
          <Icon name="loading" size="32" class="animate-spin" />
          <p>{{ $t('table.loading') }}</p>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-if="!isLoading && tableData.length === 0" class="table-no-data">
        <Icon name="table" size="48" class="no-data-icon" />
        <h4>{{ $t('table.noData') }}</h4>
        <p>{{ $t('table.noDataDescription') }}</p>
      </div>
    </div>

    <!-- 表格底部信息 -->
    <div class="table-footer">
      <div class="footer-left">
        <span class="visible-info">
          {{ $t('table.showing', { 
            start: startIndex + 1, 
            end: Math.min(startIndex + visibleCount, totalYears),
            total: totalYears 
          }) }}
        </span>
      </div>
      
      <div class="footer-right">
        <div class="performance-info" v-if="showPerformanceInfo">
          <span class="perf-item">{{ $t('table.renderTime') }}: {{ renderTime }}ms</span>
          <span class="perf-item">{{ $t('table.scrollPosition') }}: {{ Math.round(scrollTop) }}px</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { formatGermanCurrency, formatGermanNumber } from '@/utils/germanFormatters'
import AnimationTransition from '@/components/realtime/AnimationTransition.vue'
import Icon from '@/components/ui/Icon.vue'

// 年度数据接口
interface YearlyData {
  year: number
  startBalance: number
  contributions: number
  interest: number
  endBalance: number
  cumulativeContributions?: number
  cumulativeInterest?: number
  effectiveRate?: number
}

// 表格列配置
interface TableColumn {
  key: string
  label: string
  width: string
  sortable: boolean
  format: 'currency' | 'number' | 'percentage' | 'none'
  animated: boolean
}

// Props定义
interface Props {
  data: YearlyData[]
  calculatorId: string
  isLoading?: boolean
  showPerformanceInfo?: boolean
  animationSpeed?: 'slow' | 'normal' | 'fast'
  containerHeight?: number
  rowHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  showPerformanceInfo: false,
  animationSpeed: 'normal',
  containerHeight: 400,
  rowHeight: 48
})

// Emits定义
interface Emits {
  export: [format: string, data: YearlyData[]]
  rowClick: [row: YearlyData]
  sortChange: [sortBy: string, sortOrder: 'asc' | 'desc']
}

const emit = defineEmits<Emits>()

// 响应式数据
const tableContainer = ref<HTMLElement>()
const tableBody = ref<HTMLElement>()
const scrollTop = ref(0)
const scrollLeft = ref(0)
const startIndex = ref(0)
const visibleCount = ref(10)
const highlightedRows = ref<number[]>([])
const changedRows = ref<number[]>([])
const previousData = ref<YearlyData[]>([])
const renderTime = ref(0)

// 表格配置
const showInterestOnly = ref(false)
const showCumulativeValues = ref(false)
const sortBy = ref<string>('year')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 表格列配置
const baseColumns: TableColumn[] = [
  { key: 'year', label: 'Jahr', width: '80px', sortable: true, format: 'none', animated: false },
  { key: 'startBalance', label: 'Anfangssaldo', width: '120px', sortable: true, format: 'currency', animated: true },
  { key: 'contributions', label: 'Einzahlungen', width: '120px', sortable: true, format: 'currency', animated: true },
  { key: 'interest', label: 'Zinsen', width: '120px', sortable: true, format: 'currency', animated: true },
  { key: 'endBalance', label: 'Endsaldo', width: '120px', sortable: true, format: 'currency', animated: true },
  { key: 'effectiveRate', label: 'Eff. Zinssatz', width: '100px', sortable: true, format: 'percentage', animated: true }
]

const cumulativeColumns: TableColumn[] = [
  { key: 'cumulativeContributions', label: 'Gesamt Einzahlungen', width: '140px', sortable: true, format: 'currency', animated: true },
  { key: 'cumulativeInterest', label: 'Gesamt Zinsen', width: '120px', sortable: true, format: 'currency', animated: true }
]

// 计算属性
const visibleColumns = computed(() => {
  let columns = [...baseColumns]
  
  if (showInterestOnly.value) {
    columns = columns.filter(col => 
      ['year', 'interest', 'cumulativeInterest', 'effectiveRate'].includes(col.key)
    )
  }
  
  if (showCumulativeValues.value) {
    columns = [...columns, ...cumulativeColumns]
  }
  
  return columns
})

const tableData = computed(() => {
  const data = [...props.data]
  
  // 排序
  if (sortBy.value) {
    data.sort((a, b) => {
      const aVal = getCellValue(a, sortBy.value)
      const bVal = getCellValue(b, sortBy.value)
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
      } else {
        const aStr = String(aVal)
        const bStr = String(bVal)
        return sortOrder.value === 'asc' 
          ? aStr.localeCompare(bStr) 
          : bStr.localeCompare(aStr)
      }
    })
  }
  
  return data
})

const totalYears = computed(() => tableData.value.length)
const totalHeight = computed(() => totalYears.value * props.rowHeight)

const visibleItems = computed(() => {
  const endIndex = Math.min(startIndex.value + visibleCount.value, totalYears.value)
  return tableData.value.slice(startIndex.value, endIndex)
})

// 方法
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  scrollLeft.value = target.scrollLeft
  
  // 计算可见范围
  const newStartIndex = Math.floor(scrollTop.value / props.rowHeight)
  const newVisibleCount = Math.ceil(props.containerHeight / props.rowHeight) + 2 // 缓冲区
  
  startIndex.value = Math.max(0, newStartIndex)
  visibleCount.value = newVisibleCount
}

const handleSort = (columnKey: string) => {
  if (sortBy.value === columnKey) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = columnKey
    sortOrder.value = 'asc'
  }
  
  emit('sortChange', sortBy.value, sortOrder.value)
}

const getCellValue = (item: YearlyData, key: string): any => {
  return (item as any)[key]
}

const getPreviousCellValue = (item: YearlyData, key: string): any => {
  const prevItem = previousData.value.find(prev => prev.year === item.year)
  return prevItem ? (prevItem as any)[key] : (item as any)[key]
}

const formatCellValue = (value: any, format: string): string => {
  if (value === null || value === undefined) return '-'
  
  switch (format) {
    case 'currency':
      return formatGermanCurrency(Number(value))
    case 'number':
      return formatGermanNumber(Number(value))
    case 'percentage':
      return `${formatGermanNumber(Number(value))}%`
    default:
      return String(value)
  }
}

const detectChanges = () => {
  const startTime = Date.now()
  const newChangedRows: number[] = []
  const newHighlightedRows: number[] = []
  
  props.data.forEach(item => {
    const prevItem = previousData.value.find(prev => prev.year === item.year)
    
    if (prevItem) {
      // 检查是否有变化
      const hasChanges = Object.keys(item).some(key => {
        if (key === 'year') return false
        return (item as any)[key] !== (prevItem as any)[key]
      })
      
      if (hasChanges) {
        newChangedRows.push(item.year)
        newHighlightedRows.push(item.year)
      }
    }
  })
  
  changedRows.value = newChangedRows
  highlightedRows.value = newHighlightedRows
  
  // 清除高亮（延迟）
  setTimeout(() => {
    highlightedRows.value = []
  }, 2000)
  
  renderTime.value = Date.now() - startTime
}

const exportTable = () => {
  emit('export', 'csv', tableData.value)
}

const scrollToYear = (year: number) => {
  const index = tableData.value.findIndex(item => item.year === year)
  if (index !== -1) {
    const targetScrollTop = index * props.rowHeight
    if (tableBody.value) {
      tableBody.value.scrollTop = targetScrollTop
    }
  }
}

// 监听器
watch(() => props.data, (newData) => {
  if (previousData.value.length > 0) {
    detectChanges()
  }
  previousData.value = [...newData]
}, { deep: true })

watch([showInterestOnly, showCumulativeValues], () => {
  // 重新计算列宽
  nextTick(() => {
    if (tableBody.value) {
      tableBody.value.scrollLeft = 0
      scrollLeft.value = 0
    }
  })
})

// 生命周期
onMounted(() => {
  if (props.data.length > 0) {
    previousData.value = [...props.data]
  }
  
  // 计算初始可见数量
  visibleCount.value = Math.ceil(props.containerHeight / props.rowHeight) + 2
})

onUnmounted(() => {
  // 清理
})

// 暴露方法给父组件
defineExpose({
  scrollToYear,
  exportTable
})
</script>

<style scoped>
.realtime-yearly-table {
  @apply bg-white rounded-lg border border-gray-200;
  position: relative;
}

.table-loading {
  @apply opacity-75 pointer-events-none;
}

.table-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.header-left h3 {
  @apply text-lg font-semibold text-gray-900 mb-1;
  margin: 0;
}

.data-count {
  @apply text-sm text-gray-600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.display-options {
  display: flex;
  gap: 1rem;
}

.option-label {
  @apply flex items-center gap-2 text-sm text-gray-700 cursor-pointer;
}

.option-checkbox {
  @apply rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

.export-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium;
  @apply bg-blue-600 text-white rounded-md hover:bg-blue-700;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.table-container {
  position: relative;
  overflow: hidden;
}

.table-wrapper {
  position: relative;
}

.table-head {
  @apply bg-gray-50 border-b border-gray-200;
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-row {
  display: flex;
  width: 100%;
}

.header-row {
  @apply bg-gray-50;
}

.data-row {
  @apply border-b border-gray-100 hover:bg-gray-50;
  transition: background-color 0.2s ease;
}

.row-highlighted {
  @apply bg-blue-50 border-blue-200;
  animation: highlight-pulse 2s ease-out;
}

.row-changed {
  position: relative;
}

.row-changed::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  @apply bg-blue-500;
}

.row-even {
  @apply bg-white;
}

.row-odd {
  @apply bg-gray-50;
}

.table-cell {
  @apply px-3 py-2 text-sm;
  display: flex;
  align-items: center;
  border-right: 1px solid #e5e7eb;
}

.table-cell:last-child {
  border-right: none;
}

.header-cell {
  @apply font-semibold text-gray-900 bg-gray-50;
  position: relative;
}

.header-cell.sortable {
  @apply cursor-pointer hover:bg-gray-100;
}

.data-cell {
  @apply text-gray-900;
}

.cell-content {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sort-icon {
  @apply ml-1 text-gray-500;
}

.table-body {
  overflow: auto;
  position: relative;
}

.table-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  @apply bg-white bg-opacity-90 flex items-center justify-center;
  z-index: 20;
}

.loading-content {
  @apply flex flex-col items-center gap-2 text-gray-600;
}

.table-no-data {
  @apply flex flex-col items-center justify-center py-12 text-gray-500;
}

.no-data-icon {
  @apply mb-4 text-gray-400;
}

.table-no-data h4 {
  @apply text-lg font-medium mb-2;
  margin: 0;
}

.table-no-data p {
  @apply text-sm;
  margin: 0;
}

.table-footer {
  @apply flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50;
}

.visible-info {
  @apply text-sm text-gray-600;
}

.performance-info {
  display: flex;
  gap: 1rem;
}

.perf-item {
  @apply text-xs text-gray-500;
}

/* 动画效果 */
@keyframes highlight-pulse {
  0% {
    background-color: rgba(59, 130, 246, 0.2);
  }
  50% {
    background-color: rgba(59, 130, 246, 0.1);
  }
  100% {
    background-color: transparent;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-header {
    @apply flex-col items-start gap-3;
  }
  
  .header-right {
    @apply flex-col items-start gap-2;
  }
  
  .display-options {
    @apply flex-col gap-1;
  }
  
  .table-cell {
    @apply px-2 py-1 text-xs;
  }
  
  .cell-content {
    font-size: 0.75rem;
  }
}

/* 滚动条样式 */
.table-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-body::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.table-body::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

.table-body::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}
</style>
