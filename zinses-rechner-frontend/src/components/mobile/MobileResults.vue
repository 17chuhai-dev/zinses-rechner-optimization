<template>
  <div class="mobile-results">
    <!-- 移动端结果概览卡片 -->
    <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold">Ergebnis</h3>
        <BaseIcon name="check-circle" size="lg" />
      </div>

      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-green-100">Endbetrag:</span>
          <span class="text-xl font-bold">
            €{{ formatCurrency(results.final_amount) }}
          </span>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-green-100">Gewinn:</span>
          <span class="text-lg font-semibold">
            €{{ formatCurrency(results.total_interest) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 关键指标卡片 -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center space-x-2 mb-2">
          <BaseIcon name="trending-up" class="text-blue-600" size="sm" />
          <span class="text-xs font-medium text-gray-600">Rendite</span>
        </div>
        <div class="text-lg font-bold text-gray-900">
          {{ (results.annual_return * 100).toFixed(2) }}%
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center space-x-2 mb-2">
          <BaseIcon name="calendar" class="text-green-600" size="sm" />
          <span class="text-xs font-medium text-gray-600">Laufzeit</span>
        </div>
        <div class="text-lg font-bold text-gray-900">
          {{ formData.years || 0 }} Jahre
        </div>
      </div>
    </div>

    <!-- 可展开的详细信息 -->
    <div class="space-y-3">
      <!-- 投资详情 -->
      <MobileExpandableCard
        title="Investitionsdetails"
        icon="chart-line"
        :default-expanded="true"
      >
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Anfangsinvestition:</span>
            <span class="font-medium">€{{ formatCurrency(formData.principal || 0) }}</span>
          </div>

          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Monatliche Einzahlung:</span>
            <span class="font-medium">€{{ formatCurrency(formData.monthlyPayment || 0) }}</span>
          </div>

          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Gesamte Einzahlungen:</span>
            <span class="font-medium">€{{ formatCurrency(results.total_contributions) }}</span>
          </div>

          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">Zinserträge:</span>
            <span class="font-medium text-green-600">€{{ formatCurrency(results.total_interest) }}</span>
          </div>
        </div>
      </MobileExpandableCard>

      <!-- 年度发展 -->
      <MobileExpandableCard
        title="Entwicklung über die Jahre"
        icon="chart-bar"
        :default-expanded="false"
      >
        <div class="space-y-2">
          <div
            v-for="(year, index) in displayYears"
            :key="year.year"
            class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
          >
            <span class="text-sm text-gray-600">Jahr {{ year.year }}:</span>
            <span class="font-medium">€{{ formatCurrency(year.end_amount) }}</span>
          </div>

          <div v-if="results.yearly_breakdown.length > 5" class="text-center pt-2">
            <BaseButton
              variant="secondary"
              size="sm"
              @click="showAllYears = !showAllYears"
            >
              {{ showAllYears ? 'Weniger anzeigen' : 'Alle Jahre anzeigen' }}
            </BaseButton>
          </div>
        </div>
      </MobileExpandableCard>

      <!-- 图表显示 -->
      <MobileExpandableCard
        title="Grafische Darstellung"
        icon="chart-pie"
        :default-expanded="false"
      >
        <div class="space-y-4">
          <!-- 简化的移动端图表 -->
          <div class="bg-gray-50 rounded-lg p-4">
            <MobileChart
              :data="chartData"
              :type="chartType"
              :height="200"
            />
          </div>

          <!-- 图表类型切换 -->
          <div class="flex space-x-2">
            <BaseButton
              v-for="type in chartTypes"
              :key="type.value"
              :variant="chartType === type.value ? 'primary' : 'secondary'"
              size="xs"
              @click="chartType = type.value as 'line' | 'bar' | 'pie'"
            >
              {{ type.label }}
            </BaseButton>
          </div>
        </div>
      </MobileExpandableCard>

      <!-- 操作按钮 -->
      <div class="grid grid-cols-2 gap-3 pt-4">
        <BaseButton
          variant="secondary"
          size="lg"
          class="flex items-center justify-center space-x-2"
          @click="saveResult"
        >
          <BaseIcon name="bookmark" size="sm" />
          <span>Speichern</span>
        </BaseButton>

        <BaseButton
          variant="primary"
          size="lg"
          class="flex items-center justify-center space-x-2"
          @click="shareResult"
        >
          <BaseIcon name="share" size="sm" />
          <span>Teilen</span>
        </BaseButton>
      </div>

      <!-- 相关建议 -->
      <div v-if="recommendations.length > 0" class="mt-6">
        <MobileExpandableCard
          title="Empfehlungen"
          icon="lightbulb"
          :default-expanded="false"
        >
          <div class="space-y-3">
            <div
              v-for="recommendation in recommendations"
              :key="recommendation.id"
              class="bg-blue-50 border border-blue-200 rounded-lg p-3"
            >
              <div class="flex items-start space-x-2">
                <BaseIcon name="lightbulb" class="text-blue-600 mt-0.5" size="sm" />
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-blue-900">{{ recommendation.title }}</h4>
                  <p class="text-sm text-blue-800 mt-1">{{ recommendation.description }}</p>

                  <div v-if="recommendation.action" class="mt-2">
                    <BaseButton
                      variant="primary"
                      size="xs"
                      @click="executeRecommendation(recommendation)"
                    >
                      {{ recommendation.action }}
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MobileExpandableCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CalculationResult } from '@/types/calculator'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseButton from '../ui/BaseButton.vue'
import MobileExpandableCard from './MobileExpandableCard.vue'
import MobileChart from './MobileChart.vue'

interface Props {
  results: CalculationResult
  formData: Record<string, any>
  calculator: any
}

interface Emits {
  (e: 'save-result'): void
  (e: 'share-result'): void
  (e: 'execute-recommendation', recommendation: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态管理
const showAllYears = ref(false)
const chartType = ref<'line' | 'bar' | 'pie'>('line')

// 计算属性
const displayYears = computed(() => {
  if (!props.results.yearly_breakdown) return []

  if (showAllYears.value || props.results.yearly_breakdown.length <= 5) {
    return props.results.yearly_breakdown
  }

  // 显示前3年和最后2年
  const breakdown = props.results.yearly_breakdown
  const firstYears = breakdown.slice(0, 3)
  const lastYears = breakdown.slice(-2)

  return [...firstYears, ...lastYears]
})

const chartData = computed(() => {
  if (!props.results.yearly_breakdown) return []

  return props.results.yearly_breakdown.map(year => ({
    year: year.year,
    value: year.end_amount,
    contributions: year.contributions,
    interest: year.interest
  }))
})

const chartTypes = [
  { value: 'line', label: 'Linie' },
  { value: 'bar', label: 'Balken' },
  { value: 'pie', label: 'Kreis' }
]

const recommendations = computed(() => {
  // 基于结果生成移动端友好的建议
  const recs = []

  // 基于年化收益率的建议
  if (props.results.annual_return < 0.04) {
    recs.push({
      id: 'low-return',
      title: 'Niedrige Rendite',
      description: 'Ihre erwartete Rendite ist niedrig. Erwägen Sie risikoreichere Anlagen.',
      action: 'Mehr erfahren'
    })
  }

  // 基于投资期限的建议
  if (props.formData.years < 5) {
    recs.push({
      id: 'short-term',
      title: 'Kurze Laufzeit',
      description: 'Bei kurzen Laufzeiten sind sichere Anlagen oft besser.',
      action: 'Alternativen zeigen'
    })
  }

  // 基于月供的建议
  if (props.formData.monthlyPayment < 100) {
    recs.push({
      id: 'low-monthly',
      title: 'Niedrige Sparrate',
      description: 'Erhöhen Sie Ihre monatliche Sparrate für bessere Ergebnisse.',
      action: 'Sparplan optimieren'
    })
  }

  return recs
})

// 方法
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const saveResult = () => {
  emit('save-result')
}

const shareResult = () => {
  emit('share-result')
}

const executeRecommendation = (recommendation: any) => {
  emit('execute-recommendation', recommendation)
}
</script>

<style scoped>
.mobile-results {
  @apply w-full space-y-4;
  padding-bottom: 80px; /* 为底部导航栏留出空间 */
}

/* 结果卡片动画 */
.mobile-results > div {
  animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 渐进式动画延迟 */
.mobile-results > div:nth-child(1) { animation-delay: 0.1s; }
.mobile-results > div:nth-child(2) { animation-delay: 0.2s; }
.mobile-results > div:nth-child(3) { animation-delay: 0.3s; }
.mobile-results > div:nth-child(4) { animation-delay: 0.4s; }

/* 触摸友好的按钮 */
.mobile-results button {
  min-height: 44px; /* iOS推荐的最小触摸目标 */
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .mobile-results .bg-gradient-to-r {
    @apply bg-green-700;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .mobile-results > div {
    animation: none;
  }
}
</style>
