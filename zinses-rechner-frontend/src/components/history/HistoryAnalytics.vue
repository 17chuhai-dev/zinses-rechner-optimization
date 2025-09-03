<template>
  <div class="history-analytics">
    <BaseCard title="Nutzungsstatistiken" padding="lg">
      <!-- 概览统计 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm">Berechnungen gesamt</p>
              <p class="text-3xl font-bold">{{ analytics.totalCalculations }}</p>
            </div>
            <BaseIcon name="calculator" size="2xl" class="text-blue-200" />
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm">Favoriten</p>
              <p class="text-3xl font-bold">{{ analytics.favoriteCount }}</p>
            </div>
            <BaseIcon name="star" size="2xl" class="text-green-200" />
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm">Aktive Tage</p>
              <p class="text-3xl font-bold">{{ analytics.activeDays }}</p>
            </div>
            <BaseIcon name="calendar" size="2xl" class="text-purple-200" />
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm">Ø pro Tag</p>
              <p class="text-3xl font-bold">{{ analytics.averagePerDay.toFixed(1) }}</p>
            </div>
            <BaseIcon name="trending-up" size="2xl" class="text-orange-200" />
          </div>
        </div>
      </div>

      <!-- 计算器使用分布 -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Rechner-Nutzung</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 饼图 -->
          <div class="bg-gray-50 p-6 rounded-lg">
            <h4 class="text-md font-medium text-gray-900 mb-4">Verteilung nach Rechner</h4>
            <div class="relative h-64 flex items-center justify-center">
              <div class="relative w-48 h-48">
                <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90">
                  <circle
                    v-for="(segment, index) in pieChartSegments"
                    :key="index"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    :stroke="segment.color"
                    stroke-width="8"
                    :stroke-dasharray="`${segment.percentage} ${100 - segment.percentage}`"
                    :stroke-dashoffset="segment.offset"
                    class="transition-all duration-300"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-gray-900">{{ analytics.totalCalculations }}</div>
                    <div class="text-sm text-gray-500">Gesamt</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 图例 -->
            <div class="mt-4 space-y-2">
              <div
                v-for="(usage, calculatorId) in analytics.calculatorUsage"
                :key="calculatorId"
                class="flex items-center justify-between"
              >
                <div class="flex items-center space-x-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: getCalculatorColor(calculatorId) }"
                  ></div>
                  <span class="text-sm text-gray-700">{{ getCalculatorName(calculatorId) }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium text-gray-900">{{ usage }}</span>
                  <span class="text-xs text-gray-500">
                    ({{ ((usage / analytics.totalCalculations) * 100).toFixed(1) }}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 柱状图 -->
          <div class="bg-gray-50 p-6 rounded-lg">
            <h4 class="text-md font-medium text-gray-900 mb-4">Nutzung über Zeit</h4>
            <div class="h-64 flex items-end justify-around space-x-1">
              <div
                v-for="(day, index) in weeklyUsage"
                :key="index"
                class="flex flex-col items-center space-y-2"
              >
                <div
                  class="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                  :style="{ 
                    height: `${(day.count / maxDailyUsage) * 200}px`,
                    width: '24px'
                  }"
                  :title="`${day.label}: ${day.count} Berechnungen`"
                ></div>
                <div class="text-xs text-gray-600 transform rotate-45 origin-bottom-left">
                  {{ day.label }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间趋势 -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Aktivitätstrend</h3>
        <div class="bg-gray-50 p-6 rounded-lg">
          <div class="h-32 flex items-end justify-between">
            <div
              v-for="(month, index) in monthlyTrend"
              :key="index"
              class="flex flex-col items-center space-y-1"
            >
              <div
                class="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300"
                :style="{ 
                  height: `${(month.count / maxMonthlyUsage) * 100}px`,
                  width: '20px'
                }"
                :title="`${month.label}: ${month.count} Berechnungen`"
              ></div>
              <div class="text-xs text-gray-600 transform -rotate-45 origin-top">
                {{ month.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 收藏分析 -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Favoriten-Analyse</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <div class="flex items-center space-x-3 mb-4">
              <BaseIcon name="star" class="text-yellow-600" size="lg" />
              <h4 class="text-md font-medium text-gray-900">Favoriten-Rate</h4>
            </div>
            <div class="text-3xl font-bold text-yellow-600 mb-2">
              {{ favoriteRate.toFixed(1) }}%
            </div>
            <p class="text-sm text-gray-600">
              {{ analytics.favoriteCount }} von {{ analytics.totalCalculations }} Berechnungen als Favorit markiert
            </p>
          </div>
          
          <div class="bg-green-50 p-6 rounded-lg border border-green-200">
            <div class="flex items-center space-x-3 mb-4">
              <BaseIcon name="trophy" class="text-green-600" size="lg" />
              <h4 class="text-md font-medium text-gray-900">Beliebtester Rechner</h4>
            </div>
            <div class="text-lg font-bold text-green-600 mb-2">
              {{ mostUsedCalculator.name }}
            </div>
            <p class="text-sm text-gray-600">
              {{ mostUsedCalculator.count }} Berechnungen ({{ mostUsedCalculator.percentage.toFixed(1) }}%)
            </p>
          </div>
        </div>
      </div>

      <!-- 导出选项 -->
      <div class="flex justify-between items-center pt-6 border-t border-gray-200">
        <div class="text-sm text-gray-500">
          Statistiken basierend auf {{ analytics.totalCalculations }} Berechnungen
        </div>
        
        <div class="flex space-x-3">
          <BaseButton
            variant="secondary"
            size="sm"
            @click="exportAnalytics"
          >
            <BaseIcon name="download" size="sm" class="mr-1" />
            Statistiken exportieren
          </BaseButton>
          
          <BaseButton
            variant="primary"
            size="sm"
            @click="generateReport"
          >
            <BaseIcon name="document-text" size="sm" class="mr-1" />
            Bericht erstellen
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalculationHistory } from '@/services/LocalStorageService'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'

interface Props {
  calculations: CalculationHistory[]
}

interface Emits {
  (e: 'export-analytics', data: any): void
  (e: 'generate-report', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 分析数据计算
const analytics = computed(() => {
  const totalCalculations = props.calculations.length
  const favoriteCount = props.calculations.filter(c => c.isFavorite).length
  
  // 计算器使用统计
  const calculatorUsage: Record<string, number> = {}
  props.calculations.forEach(calc => {
    calculatorUsage[calc.calculatorId] = (calculatorUsage[calc.calculatorId] || 0) + 1
  })
  
  // 活跃天数计算
  const uniqueDates = new Set(
    props.calculations.map(c => new Date(c.timestamp).toDateString())
  )
  const activeDays = uniqueDates.size
  
  // 平均每日计算数
  const averagePerDay = activeDays > 0 ? totalCalculations / activeDays : 0
  
  return {
    totalCalculations,
    favoriteCount,
    calculatorUsage,
    activeDays,
    averagePerDay
  }
})

// 饼图数据
const pieChartSegments = computed(() => {
  const segments: Array<{
    calculatorId: string
    percentage: number
    offset: number
    color: string
  }> = []
  
  let currentOffset = 0
  
  Object.entries(analytics.value.calculatorUsage).forEach(([calculatorId, count]) => {
    const percentage = (count / analytics.value.totalCalculations) * 100
    
    segments.push({
      calculatorId,
      percentage,
      offset: currentOffset,
      color: getCalculatorColor(calculatorId)
    })
    
    currentOffset += percentage
  })
  
  return segments
})

// 周使用数据
const weeklyUsage = computed(() => {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const usage = Array(7).fill(0)
  
  props.calculations.forEach(calc => {
    const dayOfWeek = new Date(calc.timestamp).getDay()
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 调整为周一开始
    usage[adjustedDay]++
  })
  
  return days.map((day, index) => ({
    label: day,
    count: usage[index]
  }))
})

const maxDailyUsage = computed(() => Math.max(...weeklyUsage.value.map(d => d.count), 1))

// 月度趋势
const monthlyTrend = computed(() => {
  const months: Record<string, number> = {}
  
  props.calculations.forEach(calc => {
    const monthKey = new Date(calc.timestamp).toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'short' 
    })
    months[monthKey] = (months[monthKey] || 0) + 1
  })
  
  return Object.entries(months)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-6) // 最近6个月
    .map(([month, count]) => ({
      label: month,
      count
    }))
})

const maxMonthlyUsage = computed(() => Math.max(...monthlyTrend.value.map(m => m.count), 1))

// 收藏率
const favoriteRate = computed(() => {
  return analytics.value.totalCalculations > 0 
    ? (analytics.value.favoriteCount / analytics.value.totalCalculations) * 100 
    : 0
})

// 最常用计算器
const mostUsedCalculator = computed(() => {
  const usage = analytics.value.calculatorUsage
  const mostUsedId = Object.keys(usage).reduce((a, b) => usage[a] > usage[b] ? a : b, '')
  
  return {
    id: mostUsedId,
    name: getCalculatorName(mostUsedId),
    count: usage[mostUsedId] || 0,
    percentage: ((usage[mostUsedId] || 0) / analytics.value.totalCalculations) * 100
  }
})

// 辅助方法
const getCalculatorName = (calculatorId: string): string => {
  const names: Record<string, string> = {
    'compound-interest': 'Zinseszins-Rechner',
    'loan': 'Darlehensrechner',
    'mortgage': 'Baufinanzierungsrechner'
  }
  return names[calculatorId] || calculatorId
}

const getCalculatorColor = (calculatorId: string): string => {
  const colors: Record<string, string> = {
    'compound-interest': '#3B82F6',
    'loan': '#10B981',
    'mortgage': '#F59E0B'
  }
  return colors[calculatorId] || '#6B7280'
}

const exportAnalytics = () => {
  const analyticsData = {
    timestamp: new Date(),
    summary: analytics.value,
    trends: {
      weekly: weeklyUsage.value,
      monthly: monthlyTrend.value
    },
    favorites: {
      rate: favoriteRate.value,
      mostUsed: mostUsedCalculator.value
    }
  }
  
  emit('export-analytics', analyticsData)
}

const generateReport = () => {
  const reportData = {
    title: 'Nutzungsstatistik-Bericht',
    generatedAt: new Date(),
    period: {
      from: props.calculations.length > 0 
        ? new Date(Math.min(...props.calculations.map(c => new Date(c.timestamp).getTime())))
        : new Date(),
      to: new Date()
    },
    analytics: analytics.value,
    insights: [
      `Sie haben insgesamt ${analytics.value.totalCalculations} Berechnungen durchgeführt.`,
      `Ihr beliebtester Rechner ist der ${mostUsedCalculator.value.name}.`,
      `Sie markieren ${favoriteRate.value.toFixed(1)}% Ihrer Berechnungen als Favoriten.`,
      `Sie waren an ${analytics.value.activeDays} verschiedenen Tagen aktiv.`
    ]
  }
  
  emit('generate-report', reportData)
}
</script>

<style scoped>
.history-analytics {
  @apply w-full;
}

/* 图表动画 */
.history-analytics .bg-blue-500,
.history-analytics .bg-gradient-to-t {
  transition: all 0.3s ease-in-out;
}

/* SVG圆环动画 */
.history-analytics circle {
  transition: stroke-dasharray 0.5s ease-in-out;
}
</style>
