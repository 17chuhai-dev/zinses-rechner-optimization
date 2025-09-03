<template>
  <div class="compound-interest-chart">
    <div class="chart-header mb-4">
      <h3 class="text-lg font-semibold text-gray-800 mb-2">
        Vermögensentwicklung über {{ years }} Jahre
      </h3>
      <div class="chart-controls flex flex-wrap gap-2">
        <button
          v-for="type in chartTypes"
          :key="type.value"
          @click="currentChartType = type.value"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            currentChartType === type.value
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <div class="chart-container" :style="{ height: chartHeight }">
      <Line
        v-if="currentChartType === 'line'"
        :data="lineChartData"
        :options="lineChartOptions"
      />
      <Line
        v-else-if="currentChartType === 'area'"
        :data="areaChartData"
        :options="areaChartOptions"
      />
      <Bar
        v-else-if="currentChartType === 'bar'"
        :data="barChartData"
        :options="barChartOptions"
      />
    </div>

    <div class="chart-summary mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="text-center p-3 bg-primary-50 rounded-lg">
        <p class="text-sm text-primary-600 font-medium">Durchschnittliches Wachstum</p>
        <p class="text-lg font-bold text-primary-800">
          {{ formatCurrency(averageGrowth) }}/Jahr
        </p>
      </div>
      <div class="text-center p-3 bg-success-50 rounded-lg">
        <p class="text-sm text-success-600 font-medium">Zinseszins-Effekt</p>
        <p class="text-lg font-bold text-success-800">
          {{ formatCurrency(compoundEffect) }}
        </p>
      </div>
      <div class="text-center p-3 bg-gray-50 rounded-lg">
        <p class="text-sm text-gray-600 font-medium">Gesamtrendite</p>
        <p class="text-lg font-bold text-gray-800">
          {{ formatPercentage(totalReturn) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import { useFinancialChart } from '@/composables/useChart'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import type { YearlyData } from '@/types/calculator'

interface Props {
  yearlyData: YearlyData[]
  principal: number
  totalContributions: number
  finalAmount: number
}

const props = defineProps<Props>()

const { 
  getLineChartOptions, 
  getAreaChartOptions, 
  getBarChartOptions, 
  getMobileChartOptions,
  chartColors 
} = useFinancialChart()

// 图表类型控制
const currentChartType = ref<'line' | 'area' | 'bar'>('line')
const chartTypes = [
  { value: 'line', label: 'Linie' },
  { value: 'area', label: 'Fläche' },
  { value: 'bar', label: 'Balken' }
]

// 响应式设计
const isMobile = ref(false)
const chartHeight = computed(() => isMobile.value ? '300px' : '400px')

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

// 计算属性
const years = computed(() => props.yearlyData.length)

const labels = computed(() => 
  props.yearlyData.map(data => data.year.toString())
)

const averageGrowth = computed(() => {
  if (props.yearlyData.length === 0) return 0
  const totalGrowth = props.finalAmount - props.principal
  return totalGrowth / props.yearlyData.length
})

const compoundEffect = computed(() => {
  // 复利效果 = 最终金额 - 本金 - 总投入（不含本金）
  const simpleInterest = (props.totalContributions - props.principal) + 
    (props.principal * 0.04 * years.value) // 假设4%简单利息
  return props.finalAmount - props.totalContributions - simpleInterest
})

const totalReturn = computed(() => {
  if (props.totalContributions === 0) return 0
  return ((props.finalAmount - props.totalContributions) / props.totalContributions) * 100
})

// 线性图表数据
const lineChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Gesamtvermögen',
      data: props.yearlyData.map(data => data.end_amount),
      borderColor: chartColors.primary,
      backgroundColor: chartColors.primary,
      fill: false,
      tension: 0.4
    },
    {
      label: 'Eingezahltes Kapital',
      data: props.yearlyData.map(data => data.start_amount + data.contributions),
      borderColor: chartColors.gray,
      backgroundColor: chartColors.gray,
      fill: false,
      borderDash: [5, 5]
    }
  ]
}))

// 面积图表数据
const areaChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Zinserträge',
      data: props.yearlyData.map(data => data.interest),
      backgroundColor: chartColors.successLight,
      borderColor: chartColors.success,
      fill: 'origin'
    },
    {
      label: 'Eingezahltes Kapital',
      data: props.yearlyData.map(data => data.start_amount + data.contributions),
      backgroundColor: chartColors.primaryLight,
      borderColor: chartColors.primary,
      fill: '-1'
    }
  ]
}))

// 柱状图表数据
const barChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Jährliche Zinserträge',
      data: props.yearlyData.map(data => data.interest),
      backgroundColor: chartColors.success,
      borderColor: chartColors.success,
      borderWidth: 1
    },
    {
      label: 'Jährliche Einzahlungen',
      data: props.yearlyData.map(data => data.contributions),
      backgroundColor: chartColors.primary,
      borderColor: chartColors.primary,
      borderWidth: 1
    }
  ]
}))

// 图表选项
const lineChartOptions = computed(() => {
  const baseOptions = getLineChartOptions()
  return isMobile.value ? getMobileChartOptions(baseOptions) : baseOptions
})

const areaChartOptions = computed(() => {
  const baseOptions = getAreaChartOptions()
  return isMobile.value ? getMobileChartOptions(baseOptions) : baseOptions
})

const barChartOptions = computed(() => {
  const baseOptions = getBarChartOptions()
  return isMobile.value ? getMobileChartOptions(baseOptions) : baseOptions
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
}

.chart-controls button {
  min-width: 60px;
}

@media (max-width: 640px) {
  .chart-controls {
    justify-content: center;
  }
  
  .chart-summary {
    grid-template-columns: 1fr;
  }
}
</style>
