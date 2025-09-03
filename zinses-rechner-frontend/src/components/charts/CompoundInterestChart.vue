<template>
  <div class="chart-container">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-gray-800 mb-2">
        Vermögensentwicklung über {{ yearlyData.length }} Jahre
      </h3>
      <p class="text-sm text-gray-600">
        Entwicklung Ihres Kapitals von {{ formatCurrency(principal) }} auf {{ formatCurrency(finalAmount) }}
      </p>
    </div>

    <!-- 图表选项卡 -->
    <div class="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
      <button
        v-for="tab in chartTabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors',
          activeTab === tab.id
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 图表容器 -->
    <div class="relative h-80 bg-white rounded-lg border border-gray-200 p-4">
      <canvas
        ref="chartCanvas"
        class="w-full h-full"
        :aria-label="`Diagramm der Vermögensentwicklung über ${yearlyData.length} Jahre`"
      ></canvas>
    </div>

    <!-- 图表说明 -->
    <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div class="flex items-center">
        <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
        <span class="text-gray-600">Gesamtkapital</span>
      </div>
      <div class="flex items-center">
        <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
        <span class="text-gray-600">Zinserträge</span>
      </div>
      <div class="flex items-center">
        <div class="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
        <span class="text-gray-600">Eingezahlt</span>
      </div>
      <div class="flex items-center">
        <div class="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
        <span class="text-gray-600">Jährliche Rendite</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { formatCurrency } from '@/utils/formatters'

// 注册Chart.js组件
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface YearlyData {
  year: number
  start_amount: number
  contributions: number
  interest: number
  end_amount: number
  growth_rate: number
}

interface Props {
  yearlyData: YearlyData[]
  principal: number
  totalContributions: number
  finalAmount: number
}

const props = defineProps<Props>()

const chartCanvas = ref<HTMLCanvasElement>()
const activeTab = ref<'growth' | 'breakdown' | 'returns'>('growth')
let chartInstance: Chart | null = null

const chartTabs = [
  { id: 'growth' as const, label: 'Vermögenswachstum' },
  { id: 'breakdown' as const, label: 'Kapital-Aufschlüsselung' },
  { id: 'returns' as const, label: 'Jährliche Rendite' }
]

// 创建图表
const createChart = async () => {
  if (!chartCanvas.value || !props.yearlyData.length) return

  // 销毁现有图表
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const labels = props.yearlyData.map(d => `Jahr ${d.year}`)

  let datasets: any[] = []
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || ''
            const value = formatCurrency(context.parsed.y)
            return `${label}: ${value}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Jahre'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Betrag (€)'
        },
        ticks: {
          callback: (value: any) => formatCurrency(value)
        }
      }
    }
  }

  switch (activeTab.value) {
    case 'growth':
      // 资产增长趋势图
      datasets = [
        {
          label: 'Gesamtkapital',
          data: props.yearlyData.map(d => d.end_amount),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
      options.plugins.title = {
        display: true,
        text: 'Vermögenswachstum über die Zeit'
      }
      break

    case 'breakdown':
      // 本金vs利息堆叠图
      const cumulativeContributions = []
      const cumulativeInterest = []
      let totalContrib = props.principal
      let totalInt = 0

      for (const data of props.yearlyData) {
        totalContrib += data.contributions
        totalInt += data.interest
        cumulativeContributions.push(totalContrib)
        cumulativeInterest.push(totalInt)
      }

      datasets = [
        {
          label: 'Eingezahltes Kapital',
          data: cumulativeContributions,
          backgroundColor: 'rgba(107, 114, 128, 0.8)',
          borderColor: 'rgb(107, 114, 128)',
          borderWidth: 1
        },
        {
          label: 'Zinserträge',
          data: cumulativeInterest,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        }
      ]
      options.plugins.title = {
        display: true,
        text: 'Aufschlüsselung: Eingezahltes Kapital vs. Zinserträge'
      }
      options.scales.y.stacked = true
      break

    case 'returns':
      // 年度收益率图
      datasets = [
        {
          label: 'Jährliche Rendite (%)',
          data: props.yearlyData.map(d => d.growth_rate),
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 2,
          type: 'bar'
        }
      ]
      options.plugins.title = {
        display: true,
        text: 'Jährliche Rendite-Entwicklung'
      }
      options.scales.y.title.text = 'Rendite (%)'
      options.scales.y.ticks.callback = (value: any) => `${value.toFixed(1)}%`
      break
  }

  chartInstance = new Chart(ctx, {
    type: activeTab.value === 'returns' ? 'bar' : 'line',
    data: { labels, datasets },
    options
  })
}

// 监听选项卡变化
watch(activeTab, () => {
  nextTick(() => {
    createChart()
  })
})

// 监听数据变化
watch(() => props.yearlyData, () => {
  nextTick(() => {
    createChart()
  })
}, { deep: true })

// 组件挂载时创建图表
onMounted(() => {
  nextTick(() => {
    createChart()
  })
})
</script>

<style scoped>
.chart-container {
  @apply w-full;
}

/* 确保图表在移动端正确显示 */
@media (max-width: 768px) {
  .chart-container {
    @apply px-2;
  }

  .chart-container canvas {
    @apply max-w-full;
  }
}

/* 图表响应式调整 */
.chart-container canvas {
  max-height: 320px;
}

@media (min-width: 1024px) {
  .chart-container canvas {
    max-height: 400px;
  }
}
</style>
