<template>
  <div class="mobile-chart" :style="{ height: `${height}px` }">
    <!-- 图表容器 -->
    <div ref="chartContainer" class="w-full h-full relative">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
        <div class="flex flex-col items-center space-y-2">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="text-sm text-gray-600">Lade Diagramm...</span>
        </div>
      </div>

      <!-- 简化的SVG图表（移动端优化） -->
      <svg
        v-else
        class="w-full h-full"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- 背景网格 -->
        <defs>
          <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- 线性图表 -->
        <g v-if="type === 'line'" class="line-chart">
          <!-- 数据线 -->
          <path
            :d="linePath"
            fill="none"
            stroke="#3b82f6"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- 填充区域 -->
          <path
            :d="areaPath"
            fill="url(#gradient)"
            opacity="0.3"
          />

          <!-- 渐变定义 -->
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.4" />
              <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0" />
            </linearGradient>
          </defs>

          <!-- 数据点 -->
          <circle
            v-for="(point, index) in chartPoints"
            :key="index"
            :cx="point.x"
            :cy="point.y"
            r="4"
            fill="#3b82f6"
            stroke="white"
            stroke-width="2"
            class="cursor-pointer hover:r-6 transition-all"
            @click="showPointDetails(point, index)"
          />
        </g>

        <!-- 柱状图表 -->
        <g v-else-if="type === 'bar'" class="bar-chart">
          <rect
            v-for="(point, index) in chartPoints"
            :key="index"
            :x="point.x - barWidth / 2"
            :y="point.y"
            :width="barWidth"
            :height="svgHeight - padding.bottom - point.y"
            fill="#3b82f6"
            rx="2"
            class="cursor-pointer hover:fill-blue-700 transition-colors"
            @click="showPointDetails(point, index)"
          />
        </g>

        <!-- 饼图 -->
        <g v-else-if="type === 'pie'" class="pie-chart" :transform="`translate(${svgWidth/2}, ${svgHeight/2})`">
          <path
            v-for="(segment, index) in pieSegments"
            :key="index"
            :d="segment.path"
            :fill="segment.color"
            class="cursor-pointer hover:opacity-80 transition-opacity"
            @click="showSegmentDetails(segment, index)"
          />

          <!-- 中心文本 -->
          <text
            x="0"
            y="0"
            text-anchor="middle"
            dominant-baseline="middle"
            class="text-sm font-semibold fill-gray-900"
          >
            Total
          </text>
          <text
            x="0"
            y="16"
            text-anchor="middle"
            dominant-baseline="middle"
            class="text-xs fill-gray-600"
          >
            €{{ formatCurrency(totalValue) }}
          </text>
        </g>

        <!-- X轴标签 -->
        <g v-if="type !== 'pie'" class="x-axis">
          <text
            v-for="(label, index) in xAxisLabels"
            :key="index"
            :x="label.x"
            :y="svgHeight - 10"
            text-anchor="middle"
            class="text-xs fill-gray-600"
          >
            {{ label.text }}
          </text>
        </g>

        <!-- Y轴标签 -->
        <g v-if="type !== 'pie'" class="y-axis">
          <text
            v-for="(label, index) in yAxisLabels"
            :key="index"
            :x="15"
            :y="label.y"
            text-anchor="start"
            dominant-baseline="middle"
            class="text-xs fill-gray-600"
          >
            €{{ label.text }}
          </text>
        </g>
      </svg>
    </div>

    <!-- 图表图例（移动端优化） -->
    <div v-if="showLegend" class="mt-3 flex flex-wrap gap-2 justify-center">
      <div
        v-for="(item, index) in legendItems"
        :key="index"
        class="flex items-center space-x-2 text-xs"
      >
        <div
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: item.color }"
        ></div>
        <span class="text-gray-600">{{ item.label }}</span>
      </div>
    </div>

    <!-- 数据点详情弹窗 -->
    <div
      v-if="selectedPoint"
      class="fixed inset-x-4 bottom-20 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
    >
      <div class="flex justify-between items-start mb-3">
        <h4 class="text-md font-semibold text-gray-900">Jahr {{ selectedPoint.year }}</h4>
        <BaseButton
          variant="ghost"
          size="xs"
          @click="selectedPoint = null"
        >
          <BaseIcon name="x" size="sm" />
        </BaseButton>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Gesamtbetrag:</span>
          <span class="font-medium">€{{ formatCurrency(selectedPoint.value) }}</span>
        </div>

        <div v-if="selectedPoint.contributions" class="flex justify-between">
          <span class="text-sm text-gray-600">Einzahlungen:</span>
          <span class="font-medium">€{{ formatCurrency(selectedPoint.contributions) }}</span>
        </div>

        <div v-if="selectedPoint.interest" class="flex justify-between">
          <span class="text-sm text-gray-600">Zinserträge:</span>
          <span class="font-medium text-green-600">€{{ formatCurrency(selectedPoint.interest) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseButton from '../ui/BaseButton.vue'

interface ChartDataPoint {
  year: number
  value: number
  contributions?: number
  interest?: number
}

interface Props {
  data: ChartDataPoint[]
  type: 'line' | 'bar' | 'pie'
  height: number
  showLegend?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLegend: true
})

// 状态管理
const isLoading = ref(true)
const selectedPoint = ref<ChartDataPoint | null>(null)
const chartContainer = ref<HTMLElement>()

// 图表尺寸
const svgWidth = 320
const svgHeight = props.height
const padding = { top: 20, right: 20, bottom: 40, left: 60 }

// 计算属性
const chartPoints = computed(() => {
  if (!props.data.length) return []

  const maxValue = Math.max(...props.data.map(d => d.value))
  const minValue = Math.min(...props.data.map(d => d.value))
  const valueRange = maxValue - minValue || 1

  const chartWidth = svgWidth - padding.left - padding.right
  const chartHeight = svgHeight - padding.top - padding.bottom

  return props.data.map((point, index) => {
    const x = padding.left + (index / (props.data.length - 1)) * chartWidth
    const y = padding.top + ((maxValue - point.value) / valueRange) * chartHeight

    return {
      x,
      y,
      ...point
    }
  })
})

const barWidth = computed(() => {
  const chartWidth = svgWidth - padding.left - padding.right
  return Math.max(8, chartWidth / props.data.length * 0.8)
})

const linePath = computed(() => {
  if (!chartPoints.value.length) return ''

  const path = chartPoints.value.map((point, index) => {
    const command = index === 0 ? 'M' : 'L'
    return `${command} ${point.x} ${point.y}`
  }).join(' ')

  return path
})

const areaPath = computed(() => {
  if (!chartPoints.value.length) return ''

  const firstPoint = chartPoints.value[0]
  const lastPoint = chartPoints.value[chartPoints.value.length - 1]
  const bottomY = svgHeight - padding.bottom

  let path = `M ${firstPoint.x} ${bottomY}`
  path += ` L ${firstPoint.x} ${firstPoint.y}`

  chartPoints.value.forEach(point => {
    path += ` L ${point.x} ${point.y}`
  })

  path += ` L ${lastPoint.x} ${bottomY} Z`

  return path
})

const pieSegments = computed(() => {
  if (props.type !== 'pie' || !props.data.length) return []

  const total = props.data.reduce((sum, d) => sum + d.value, 0)
  const radius = Math.min(svgWidth, svgHeight) / 2 - 40
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  let currentAngle = 0

  return props.data.map((point, index) => {
    const percentage = point.value / total
    const angle = percentage * 2 * Math.PI

    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    const x1 = Math.cos(startAngle) * radius
    const y1 = Math.sin(startAngle) * radius
    const x2 = Math.cos(endAngle) * radius
    const y2 = Math.sin(endAngle) * radius

    const largeArcFlag = angle > Math.PI ? 1 : 0

    const path = [
      `M 0 0`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ')

    currentAngle += angle

    return {
      path,
      color: colors[index % colors.length],
      percentage: percentage * 100,
      ...point
    }
  })
})

const xAxisLabels = computed(() => {
  if (props.type === 'pie' || !props.data.length) return []

  const chartWidth = svgWidth - padding.left - padding.right
  const maxLabels = 5 // 移动端最多显示5个标签
  const step = Math.ceil(props.data.length / maxLabels)

  return props.data
    .filter((_, index) => index % step === 0 || index === props.data.length - 1)
    .map((point, index) => ({
      x: padding.left + (index * step / (props.data.length - 1)) * chartWidth,
      text: point.year.toString()
    }))
})

const yAxisLabels = computed(() => {
  if (props.type === 'pie' || !props.data.length) return []

  const maxValue = Math.max(...props.data.map(d => d.value))
  const chartHeight = svgHeight - padding.top - padding.bottom
  const labelCount = 4

  return Array.from({ length: labelCount }, (_, index) => {
    const value = (maxValue / (labelCount - 1)) * index
    const y = svgHeight - padding.bottom - (index / (labelCount - 1)) * chartHeight

    return {
      y,
      text: formatCurrency(value)
    }
  })
})

const legendItems = computed(() => {
  if (props.type === 'pie') {
    return pieSegments.value.map(segment => ({
      label: `Jahr ${segment.year}`,
      color: segment.color
    }))
  } else {
    return [
      { label: 'Gesamtbetrag', color: '#3b82f6' },
      { label: 'Einzahlungen', color: '#10b981' },
      { label: 'Zinserträge', color: '#f59e0b' }
    ]
  }
})

const totalValue = computed(() => {
  return props.data.reduce((sum, d) => sum + d.value, 0)
})

// 方法
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toFixed(0)
}

const showPointDetails = (point: any, index: number) => {
  selectedPoint.value = {
    year: props.data[index].year,
    value: props.data[index].value,
    contributions: props.data[index].contributions,
    interest: props.data[index].interest
  }

  // 3秒后自动关闭
  setTimeout(() => {
    selectedPoint.value = null
  }, 3000)
}

const showSegmentDetails = (segment: any, index: number) => {
  selectedPoint.value = {
    year: segment.year,
    value: segment.value,
    contributions: 0,
    interest: 0
  }

  // 3秒后自动关闭
  setTimeout(() => {
    selectedPoint.value = null
  }, 3000)
}

// 生命周期
onMounted(async () => {
  // 模拟加载延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  isLoading.value = false
})
</script>

<style scoped>
.mobile-chart {
  @apply w-full relative;
}

/* SVG响应式 */
.mobile-chart svg {
  @apply block;
}

/* 图表动画 */
.mobile-chart .line-chart path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 1.5s ease-out forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

.mobile-chart .bar-chart rect {
  transform-origin: bottom;
  animation: growBar 0.8s ease-out forwards;
}

@keyframes growBar {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}

.mobile-chart .pie-chart path {
  transform-origin: center;
  animation: growPie 1s ease-out forwards;
}

@keyframes growPie {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

/* 触摸反馈 */
@media (hover: none) and (pointer: coarse) {
  .mobile-chart circle:active,
  .mobile-chart rect:active,
  .mobile-chart path:active {
    opacity: 0.7;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .mobile-chart .line-chart path,
  .mobile-chart .bar-chart rect,
  .mobile-chart .pie-chart path {
    animation: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .mobile-chart .line-chart path {
    stroke-width: 4;
  }

  .mobile-chart circle {
    stroke-width: 3;
  }
}
</style>
