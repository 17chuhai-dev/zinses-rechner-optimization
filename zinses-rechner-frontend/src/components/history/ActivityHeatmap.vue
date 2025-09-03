<!--
  活动热力图组件
  类似GitHub的贡献图，显示用户的计算活动模式
-->

<template>
  <div class="activity-heatmap">
    <!-- 月份标签 -->
    <div class="months-labels mb-2">
      <div class="grid grid-cols-12 gap-1 text-xs text-gray-500">
        <div v-for="month in monthLabels" :key="month" class="text-center">
          {{ month }}
        </div>
      </div>
    </div>

    <!-- 热力图网格 -->
    <div class="heatmap-grid">
      <div class="flex">
        <!-- 星期标签 -->
        <div class="weekday-labels mr-2">
          <div class="grid grid-rows-7 gap-1 text-xs text-gray-500 h-full">
            <div class="flex items-center justify-end pr-2 h-3">Mo</div>
            <div class="flex items-center justify-end pr-2 h-3"></div>
            <div class="flex items-center justify-end pr-2 h-3">Mi</div>
            <div class="flex items-center justify-end pr-2 h-3"></div>
            <div class="flex items-center justify-end pr-2 h-3">Fr</div>
            <div class="flex items-center justify-end pr-2 h-3"></div>
            <div class="flex items-center justify-end pr-2 h-3">So</div>
          </div>
        </div>

        <!-- 热力图单元格 -->
        <div class="heatmap-cells">
          <div class="grid grid-cols-53 gap-1">
            <div
              v-for="(cell, index) in heatmapCells"
              :key="index"
              :class="[
                'heatmap-cell w-3 h-3 rounded-sm cursor-pointer transition-all duration-200',
                getIntensityClass(cell.level),
                'hover:ring-2 hover:ring-blue-300 hover:scale-110'
              ]"
              :title="getCellTooltip(cell)"
              @click="handleCellClick(cell)"
              @mouseenter="showTooltip(cell, $event)"
              @mouseleave="hideTooltip"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="heatmap-stats mt-4 flex items-center justify-between text-sm text-gray-600">
      <div class="flex items-center">
        <span class="mr-4">
          {{ totalActiveDays }} aktive Tage in den letzten {{ totalDays }} Tagen
        </span>
        <span>
          Durchschnitt: {{ averagePerDay.toFixed(1) }} Berechnungen/Tag
        </span>
      </div>
      <div class="flex items-center">
        <span class="mr-2">Weniger</span>
        <div class="flex space-x-1">
          <div class="w-3 h-3 bg-gray-100 rounded-sm"></div>
          <div class="w-3 h-3 bg-green-200 rounded-sm"></div>
          <div class="w-3 h-3 bg-green-400 rounded-sm"></div>
          <div class="w-3 h-3 bg-green-600 rounded-sm"></div>
          <div class="w-3 h-3 bg-green-800 rounded-sm"></div>
        </div>
        <span class="ml-2">Mehr</span>
      </div>
    </div>

    <!-- 工具提示 -->
    <div
      v-if="tooltip.visible"
      ref="tooltipRef"
      class="heatmap-tooltip absolute z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      {{ tooltip.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface HeatmapCell {
  date: string
  count: number
  level: number
  dayOfWeek: number
  weekOfYear: number
}

interface Props {
  data: Array<{
    date: string
    count: number
    level: number
  }>
}

interface Emits {
  (e: 'cell-click', cell: HeatmapCell): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 组件状态
const tooltipRef = ref<HTMLElement>()
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  content: ''
})

// 计算属性
const monthLabels = computed(() => {
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const currentMonth = new Date().getMonth()
  const result = []
  
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth - 11 + i + 12) % 12
    result.push(months[monthIndex])
  }
  
  return result
})

const heatmapCells = computed(() => {
  const cells: HeatmapCell[] = []
  const today = new Date()
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
  
  // 找到一年前的周一
  const startDate = new Date(oneYearAgo)
  const dayOfWeek = startDate.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startDate.setDate(startDate.getDate() - daysToMonday)
  
  // 生成53周 × 7天的网格
  for (let week = 0; week < 53; week++) {
    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(startDate)
      cellDate.setDate(startDate.getDate() + week * 7 + day)
      
      if (cellDate > today) break
      
      const dateString = cellDate.toISOString().split('T')[0]
      const dataPoint = props.data.find(d => d.date === dateString)
      
      cells.push({
        date: dateString,
        count: dataPoint?.count || 0,
        level: dataPoint?.level || 0,
        dayOfWeek: day,
        weekOfYear: week
      })
    }
  }
  
  return cells
})

const totalActiveDays = computed(() => {
  return heatmapCells.value.filter(cell => cell.count > 0).length
})

const totalDays = computed(() => {
  return heatmapCells.value.length
})

const averagePerDay = computed(() => {
  const totalCount = heatmapCells.value.reduce((sum, cell) => sum + cell.count, 0)
  return totalCount / totalDays.value
})

// 方法
const getIntensityClass = (level: number): string => {
  const classes = [
    'bg-gray-100', // 0 - 无活动
    'bg-green-200', // 1 - 低活动
    'bg-green-400', // 2 - 中等活动
    'bg-green-600', // 3 - 高活动
    'bg-green-800'  // 4 - 非常高活动
  ]
  return classes[Math.min(level, 4)] || classes[0]
}

const getCellTooltip = (cell: HeatmapCell): string => {
  const date = new Date(cell.date)
  const dateStr = date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  if (cell.count === 0) {
    return `Keine Berechnungen am ${dateStr}`
  } else if (cell.count === 1) {
    return `1 Berechnung am ${dateStr}`
  } else {
    return `${cell.count} Berechnungen am ${dateStr}`
  }
}

const handleCellClick = (cell: HeatmapCell) => {
  emit('cell-click', cell)
}

const showTooltip = (cell: HeatmapCell, event: MouseEvent) => {
  tooltip.value.content = getCellTooltip(cell)
  tooltip.value.x = event.clientX + 10
  tooltip.value.y = event.clientY - 30
  tooltip.value.visible = true
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

// 处理窗口滚动时隐藏工具提示
const handleScroll = () => {
  hideTooltip()
}

// 生命周期
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.activity-heatmap {
  @apply relative;
}

.months-labels {
  @apply ml-16;
}

.weekday-labels {
  @apply w-12;
}

.heatmap-cells {
  @apply flex-1;
}

.heatmap-cell {
  @apply border border-gray-200;
}

.heatmap-cell:hover {
  @apply border-blue-300;
}

.heatmap-stats {
  @apply ml-16;
}

.heatmap-tooltip {
  @apply transform -translate-x-1/2 -translate-y-full;
  @apply shadow-lg;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .heatmap-cell {
    @apply w-2 h-2;
  }
  
  .months-labels {
    @apply ml-8 text-xs;
  }
  
  .weekday-labels {
    @apply w-6 text-xs;
  }
  
  .heatmap-stats {
    @apply ml-8 text-xs flex-col items-start gap-2;
  }
}

@media (max-width: 640px) {
  .activity-heatmap {
    @apply overflow-x-auto;
  }
  
  .heatmap-grid {
    @apply min-w-max;
  }
}
</style>
