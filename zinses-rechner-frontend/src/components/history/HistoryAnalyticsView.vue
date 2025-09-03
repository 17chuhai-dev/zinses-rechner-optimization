<!--
  历史记录分析视图
  提供数据分析、趋势图表、洞察报告等功能
-->

<template>
  <div class="history-analytics-view p-6">
    <!-- 概览卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="stats-card bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <CalculatorIcon class="w-6 h-6 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Gesamt Berechnungen</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics?.total || 0 }}</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <TrendingUpIcon class="w-4 h-4 text-green-500 mr-1" />
            <span class="text-green-600">+12%</span>
            <span class="text-gray-500 ml-1">vs. letzter Monat</span>
          </div>
        </div>
      </div>

      <div class="stats-card bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <StarIcon class="w-6 h-6 text-yellow-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Favoriten</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics?.favorites || 0 }}</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span class="text-gray-600">
              {{ ((statistics?.favorites || 0) / (statistics?.total || 1) * 100).toFixed(1) }}% der Berechnungen
            </span>
          </div>
        </div>
      </div>

      <div class="stats-card bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <ChartBarIcon class="w-6 h-6 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Durchschn. Qualität</p>
            <p class="text-2xl font-bold text-gray-900">{{ (statistics?.avgQualityScore || 0).toFixed(1) }}</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-green-600 h-2 rounded-full"
              :style="{ width: `${statistics?.avgQualityScore || 0}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="stats-card bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <ShareIcon class="w-6 h-6 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Geteilt</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics?.shared || 0 }}</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span class="text-gray-600">
              {{ ((statistics?.shared || 0) / (statistics?.total || 1) * 100).toFixed(1) }}% geteilt
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 使用趋势图 -->
      <div class="chart-card bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Nutzungstrend</h3>
          <BaseSelect
            v-model="trendPeriod"
            :options="trendPeriodOptions"
            size="sm"
            @change="updateTrendChart"
          />
        </div>
        <div class="h-64">
          <canvas ref="trendChartRef" class="w-full h-full"></canvas>
        </div>
      </div>

      <!-- 计算器类型分布 -->
      <div class="chart-card bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Rechner-Verteilung</h3>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="toggleChartType"
          >
            {{ chartType === 'pie' ? 'Balken' : 'Kreis' }}
          </BaseButton>
        </div>
        <div class="h-64">
          <canvas ref="distributionChartRef" class="w-full h-full"></canvas>
        </div>
      </div>
    </div>

    <!-- 详细分析 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 最常用标签 -->
      <div class="analysis-card bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Häufigste Tags</h3>
        <div class="space-y-3">
          <div
            v-for="tag in statistics?.mostUsedTags?.slice(0, 8) || []"
            :key="tag.tag"
            class="flex items-center justify-between"
          >
            <div class="flex items-center">
              <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span class="text-sm text-gray-700">{{ tag.tag }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-sm font-medium text-gray-900 mr-2">{{ tag.count }}</span>
              <div class="w-16 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-500 h-2 rounded-full"
                  :style="{ width: `${(tag.count / (statistics?.mostUsedTags?.[0]?.count || 1)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 活动模式 -->
      <div class="analysis-card bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Aktivitätsmuster</h3>
        <div class="space-y-4">
          <div
            v-for="pattern in analytics?.patterns || []"
            :key="pattern.pattern"
            class="p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-900">{{ pattern.pattern }}</span>
              <span class="text-xs text-gray-500">{{ (pattern.frequency * 100).toFixed(0) }}%</span>
            </div>
            <p class="text-xs text-gray-600">{{ pattern.description }}</p>
          </div>
        </div>
      </div>

      <!-- 洞察报告 -->
      <div class="analysis-card bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Erkenntnisse</h3>
        <div class="space-y-3">
          <div
            v-for="insight in analytics?.insights || []"
            :key="insight.title"
            class="p-3 rounded-lg"
            :class="{
              'bg-red-50 border border-red-200': insight.impact === 'high',
              'bg-yellow-50 border border-yellow-200': insight.impact === 'medium',
              'bg-blue-50 border border-blue-200': insight.impact === 'low'
            }"
          >
            <div class="flex items-start">
              <div
                class="w-2 h-2 rounded-full mt-2 mr-3"
                :class="{
                  'bg-red-500': insight.impact === 'high',
                  'bg-yellow-500': insight.impact === 'medium',
                  'bg-blue-500': insight.impact === 'low'
                }"
              ></div>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-900 mb-1">{{ insight.title }}</h4>
                <p class="text-xs text-gray-600">{{ insight.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间热力图 -->
    <div class="heatmap-card bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Aktivitäts-Heatmap</h3>
        <div class="flex items-center text-sm text-gray-500">
          <span class="mr-4">Weniger</span>
          <div class="flex space-x-1">
            <div class="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div class="w-3 h-3 bg-green-200 rounded-sm"></div>
            <div class="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div class="w-3 h-3 bg-green-600 rounded-sm"></div>
            <div class="w-3 h-3 bg-green-800 rounded-sm"></div>
          </div>
          <span class="ml-4">Mehr</span>
        </div>
      </div>
      <div class="heatmap-container">
        <ActivityHeatmap :data="heatmapData" @cell-click="handleHeatmapClick" />
      </div>
    </div>

    <!-- 导出和操作 -->
    <div class="actions-bar bg-gray-50 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center text-sm text-gray-600">
          <ClockIcon class="w-4 h-4 mr-2" />
          Letzte Aktualisierung: {{ lastUpdated.toLocaleString('de-DE') }}
        </div>
        <div class="flex items-center gap-3">
          <BaseButton
            variant="outline"
            size="sm"
            @click="refreshAnalytics"
            :loading="isRefreshing"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            Aktualisieren
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            @click="exportAnalytics"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            Bericht exportieren
          </BaseButton>
          <BaseButton
            variant="primary"
            size="sm"
            @click="generateInsights"
          >
            <LightBulbIcon class="w-4 h-4 mr-2" />
            KI-Insights
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import {
  CalculatorIcon,
  StarIcon,
  ChartBarIcon,
  ShareIcon,
  TrendingUpIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  LightBulbIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import ActivityHeatmap from './ActivityHeatmap.vue'
import { Chart, registerables } from 'chart.js'

// 注册Chart.js组件
Chart.register(...registerables)

interface Props {
  statistics: any
  analytics: any
}

interface Emits {
  (e: 'drill-down', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 组件状态
const trendChartRef = ref<HTMLCanvasElement>()
const distributionChartRef = ref<HTMLCanvasElement>()
const trendPeriod = ref('3months')
const chartType = ref<'pie' | 'bar'>('pie')
const isRefreshing = ref(false)
const lastUpdated = ref(new Date())

// Chart.js实例
let trendChart: Chart | null = null
let distributionChart: Chart | null = null

// 选项配置
const trendPeriodOptions = [
  { value: '1month', label: '1 Monat' },
  { value: '3months', label: '3 Monate' },
  { value: '6months', label: '6 Monate' },
  { value: '1year', label: '1 Jahr' }
]

// 计算属性
const heatmapData = computed(() => {
  // 生成示例热力图数据
  const data = []
  const now = new Date()
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 10),
      level: Math.floor(Math.random() * 5)
    })
  }
  
  return data.reverse()
})

// 方法
const initializeTrendChart = () => {
  if (!trendChartRef.value) return

  const ctx = trendChartRef.value.getContext('2d')
  if (!ctx) return

  // 销毁现有图表
  if (trendChart) {
    trendChart.destroy()
  }

  // 生成趋势数据
  const labels = []
  const data = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }))
    data.push(Math.floor(Math.random() * 50) + 10)
  }

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Berechnungen',
        data,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index
          emit('drill-down', { type: 'trend', period: labels[index], value: data[index] })
        }
      }
    }
  })
}

const initializeDistributionChart = () => {
  if (!distributionChartRef.value) return

  const ctx = distributionChartRef.value.getContext('2d')
  if (!ctx) return

  // 销毁现有图表
  if (distributionChart) {
    distributionChart.destroy()
  }

  const calculatorData = props.statistics?.byCalculator || {}
  const labels = Object.keys(calculatorData).map(getCalculatorDisplayName)
  const data = Object.values(calculatorData) as number[]
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
  ]

  distributionChart = new Chart(ctx, {
    type: chartType.value,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length),
        borderWidth: chartType.value === 'bar' ? 0 : 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType.value === 'pie',
          position: 'bottom'
        }
      },
      scales: chartType.value === 'bar' ? {
        y: {
          beginAtZero: true
        }
      } : {},
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index
          emit('drill-down', { 
            type: 'calculator', 
            calculator: Object.keys(calculatorData)[index], 
            count: data[index] 
          })
        }
      }
    }
  })
}

const updateTrendChart = () => {
  // 根据选择的时间段更新趋势图
  initializeTrendChart()
}

const toggleChartType = () => {
  chartType.value = chartType.value === 'pie' ? 'bar' : 'pie'
  initializeDistributionChart()
}

const refreshAnalytics = async () => {
  isRefreshing.value = true
  
  // 模拟刷新延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 重新初始化图表
  initializeTrendChart()
  initializeDistributionChart()
  
  lastUpdated.value = new Date()
  isRefreshing.value = false
}

const exportAnalytics = () => {
  // 实现分析报告导出
  console.log('Exporting analytics report...')
}

const generateInsights = () => {
  // 实现AI洞察生成
  console.log('Generating AI insights...')
}

const handleHeatmapClick = (data: any) => {
  emit('drill-down', { type: 'heatmap', date: data.date, count: data.count })
}

const getCalculatorDisplayName = (id: string): string => {
  const names = {
    'compound-interest': 'Zinseszins',
    'loan': 'Kredit',
    'mortgage': 'Hypothek',
    'portfolio': 'Portfolio',
    'tax-optimization': 'Steuer'
  }
  return names[id as keyof typeof names] || id
}

// 监听器
watch(() => props.statistics, () => {
  nextTick(() => {
    initializeTrendChart()
    initializeDistributionChart()
  })
}, { deep: true })

// 生命周期
onMounted(() => {
  nextTick(() => {
    initializeTrendChart()
    initializeDistributionChart()
  })
})
</script>

<style scoped>
.stats-card {
  @apply transition-shadow hover:shadow-md;
}

.chart-card {
  @apply transition-shadow hover:shadow-md;
}

.analysis-card {
  @apply transition-shadow hover:shadow-md;
}

.heatmap-card {
  @apply transition-shadow hover:shadow-md;
}

.heatmap-container {
  @apply overflow-x-auto;
}

.actions-bar {
  @apply border border-gray-200;
}
</style>
