<template>
  <div class="mortgage-cost-chart">
    <div class="chart-header mb-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <p class="text-sm text-gray-600">Aufschlüsselung der Gesamtkosten</p>
    </div>

    <div class="chart-container">
      <div class="chart-wrapper" :style="{ height: chartHeight }">
        <Pie
          :data="pieChartData"
          :options="pieChartOptions"
        />
      </div>
    </div>

    <!-- 成本明细表 -->
    <div class="cost-breakdown mt-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="(item, index) in costBreakdown"
          :key="item.label"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-4 h-4 rounded-full"
              :style="{ backgroundColor: chartColors[index] }"
            ></div>
            <span class="text-sm font-medium text-gray-700">{{ item.label }}</span>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-gray-900">
              {{ formatCurrency(item.amount) }}
            </div>
            <div class="text-xs text-gray-500">
              {{ formatPercentage(item.percentage) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 总计 -->
    <div class="total-summary mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
      <div class="flex items-center justify-between">
        <span class="text-base font-semibold text-primary-800">Gesamtkosten</span>
        <span class="text-lg font-bold text-primary-900">
          {{ formatCurrency(totalCost) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 注册Chart.js组件
ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  purchasePrice: number
  landTransferTax: number
  notaryCosts: number
  realEstateAgentFee: number
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Kaufkostenverteilung'
})

// 响应式设计
const isMobile = ref(false)
const chartHeight = computed(() => isMobile.value ? '250px' : '300px')

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

// 图表颜色
const chartColors = [
  '#3b82f6', // 蓝色 - 购房价格
  '#ef4444', // 红色 - 房产转让税
  '#f59e0b', // 橙色 - 公证费用
  '#10b981', // 绿色 - 中介费
]

// 计算成本分解
const costBreakdown = computed(() => {
  const total = props.purchasePrice + props.landTransferTax + props.notaryCosts + props.realEstateAgentFee

  return [
    {
      label: 'Kaufpreis',
      amount: props.purchasePrice,
      percentage: (props.purchasePrice / total) * 100
    },
    {
      label: 'Grunderwerbsteuer',
      amount: props.landTransferTax,
      percentage: (props.landTransferTax / total) * 100
    },
    {
      label: 'Notar- und Grundbuchkosten',
      amount: props.notaryCosts,
      percentage: (props.notaryCosts / total) * 100
    },
    {
      label: 'Maklerprovision',
      amount: props.realEstateAgentFee,
      percentage: (props.realEstateAgentFee / total) * 100
    }
  ].filter(item => item.amount > 0) // 只显示有值的项目
})

const totalCost = computed(() =>
  props.purchasePrice + props.landTransferTax + props.notaryCosts + props.realEstateAgentFee
)

// 饼图数据
const pieChartData = computed(() => ({
  labels: costBreakdown.value.map(item => item.label),
  datasets: [
    {
      data: costBreakdown.value.map(item => item.amount),
      backgroundColor: chartColors.slice(0, costBreakdown.value.length),
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverBorderColor: '#ffffff'
    }
  ]
}))

// 饼图选项
const pieChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false // 我们使用自定义图例
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.label || ''
          const value = context.parsed
          const percentage = ((value / totalCost.value) * 100).toFixed(1)
          return `${label}: ${formatCurrency(value)} (${percentage}%)`
        }
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1
    }
  },
  elements: {
    arc: {
      borderWidth: 2
    }
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 1000
  }
}))
</script>

<style scoped>
.chart-container {
  @apply w-full;
}

.chart-wrapper {
  @apply relative w-full;
}

.cost-breakdown {
  @apply w-full;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .cost-breakdown {
    @apply grid-cols-1;
  }

  .chart-header h3 {
    @apply text-base;
  }

  .chart-header p {
    @apply text-xs;
  }
}

/* 动画效果 */
.cost-breakdown > div {
  @apply transition-all duration-200 hover:bg-gray-100;
}

.total-summary {
  @apply transition-all duration-200 hover:bg-primary-100;
}
</style>
