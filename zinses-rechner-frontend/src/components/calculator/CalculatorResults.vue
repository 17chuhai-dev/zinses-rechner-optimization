<template>
  <BaseCard title="Ihre Berechnung" padding="lg">
    <!-- 加载状态 -->
    <LoadingSpinner
      v-if="isCalculating"
      :visible="isCalculating"
      size="lg"
      message="Berechnung läuft..."
      center
      class="py-12"
    />

    <!-- 结果显示 -->
    <div v-else-if="results">
      <!-- 主要结果卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
      <EnhancedResultCard
        title="Endkapital"
        description="Ihr Gesamtvermögen nach der Laufzeit"
        :value="results.final_amount || results.finalAmount || 0"
        format="currency"
        currency="EUR"
        variant="primary"
        icon="currency-euro"
        :secondary-info="[
          { label: 'Wachstum', value: getGrowthPercentage(), format: 'percentage' }
        ]"
        :animation-delay="0"
      />

      <EnhancedResultCard
        title="Zinserträge"
        description="Durch Zinsen erwirtschafteter Gewinn"
        :value="results.total_interest || results.totalInterest || 0"
        format="currency"
        currency="EUR"
        variant="success"
        icon="trending-up"
        :secondary-info="[
          { label: 'Anteil am Endkapital', value: getInterestPercentage(), format: 'percentage' }
        ]"
        :animation-delay="200"
      />

      <EnhancedResultCard
        title="Gesamteinzahlungen"
        description="Ihre gesamten Investitionen"
        :value="results.total_contributions || results.totalContributions || 0"
        format="currency"
        currency="EUR"
        variant="default"
        icon="chart-bar"
        :secondary-info="[
          { label: 'Laufzeit', value: results.years || 0, format: 'number' }
        ]"
        :animation-delay="400"
      />
    </div>

    <!-- 收益率信息 -->
    <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h4 class="text-lg font-semibold text-gray-800 mb-2">Rendite-Übersicht</h4>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-sm text-gray-600">Durchschnittliche jährliche Rendite:</span>
          <p class="text-lg font-bold text-blue-600">
            {{ formatPercentage(results.annual_return || results.annualReturn || 0) }}
          </p>
        </div>
        <div>
          <span class="text-sm text-gray-600">Gesamtrendite:</span>
          <p class="text-lg font-bold text-green-600">
            {{
              formatPercentage(
                (((results.final_amount || results.finalAmount || 0) - (results.total_contributions || results.totalContributions || 0)) / Math.max(results.total_contributions || results.totalContributions || 1, 1)) *
                  100,
              )
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- 智能结果解释 -->
    <ResultExplanation
      :result="results"
      :form="form"
      @export-csv="exportCSV"
      @share-result="shareResult"
    />

    <!-- 图表可视化 -->
    <div v-if="hasYearlyData" class="mt-8" ref="chartElement">
      <CompoundInterestChart
        :yearly-data="results.yearly_breakdown || results.yearlyBreakdown || []"
        :principal="form.principal || 0"
        :total-contributions="results.total_contributions || results.totalContributions || 0"
        :final-amount="results.final_amount || results.finalAmount || 0"
      />
    </div>

    <!-- 年度明细表格 -->
    <div v-if="hasYearlyData" class="mt-8">
      <YearlyBreakdownTable
        :yearlyData="results.yearly_breakdown || results.yearlyBreakdown || []"
        :principal="results.total_contributions || 0"
        :totalContributions="results.total_contributions || 0"
        :finalAmount="results.final_amount || 0"
      />
    </div>

    <!-- 公式说明 -->
    <FormulaExplanation v-if="results" :result="results" :form="form" />

    <!-- 导出功能 -->
    <ExportButtons
      :result="results"
      :form="form"
      :chart-element="chartElement"
      @export-started="onExportStarted"
      @export-completed="onExportCompleted"
      @export-failed="onExportFailed"
    />

    <!-- 税务结果 -->
    <TaxResults
      v-if="taxCalculation && taxSettings.enabled"
      :tax-calculation="taxCalculation"
      :tax-settings="taxSettings"
      class="mb-8"
    />

    <!-- 分享功能 -->
    <ShareButtons
      :result="results"
      :form="form"
      :chart-element="chartElement"
      @share-completed="onShareCompleted"
      @share-failed="onShareFailed"
    />
    </div>

    <!-- 空状态提示 -->
    <div v-else class="text-center py-12">
      <BaseIcon name="calculator" size="xl" class="mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        Bereit für Ihre Berechnung
      </h3>
      <p class="text-gray-500">
        Geben Sie Ihre Daten ein und klicken Sie auf "Jetzt berechnen", um Ihre Zinserträge zu sehen.
      </p>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import EnhancedResultCard from '../ui/EnhancedResultCard.vue'
import CompoundInterestChart from '../charts/CompoundInterestChart.vue'
import YearlyBreakdownTable from '../charts/YearlyBreakdownTable.vue'
import FormulaExplanation from './FormulaExplanation.vue'
import ResultExplanation from './ResultExplanation.vue'
import ExportButtons from './ExportButtons.vue'
import ShareButtons from './ShareButtons.vue'
import TaxResults from './TaxResults.vue'

interface Props {
  results: CalculationResult | null
  form: CalculatorForm
  isCalculating?: boolean
  taxCalculation?: any
  taxSettings?: any
}

const props = defineProps<Props>()

// 图表元素引用
const chartElement = ref<HTMLElement>()

// 计算属性
const hasYearlyData = computed(() => {
  const yearlyData = props.results?.yearly_breakdown || props.results?.yearlyBreakdown
  return yearlyData && Array.isArray(yearlyData) && yearlyData.length > 0
})

// 辅助计算方法
const getGrowthPercentage = (): number => {
  const finalAmount = props.results?.final_amount || props.results?.finalAmount || 0
  const totalContributions = props.results?.total_contributions || props.results?.totalContributions || 0

  if (totalContributions === 0) return 0
  return ((finalAmount / totalContributions - 1) * 100)
}

const getInterestPercentage = (): number => {
  const totalInterest = props.results?.total_interest || props.results?.totalInterest || 0
  const finalAmount = props.results?.final_amount || props.results?.finalAmount || 0

  if (finalAmount === 0) return 0
  return ((totalInterest / finalAmount) * 100)
}

const exportCSV = () => {
  // TODO: 实现CSV导出功能
  console.log('导出CSV')
}

const exportPDF = () => {
  // TODO: 实现PDF导出功能
  console.log('导出PDF')
}

const shareResult = () => {
  // TODO: 实现社交分享功能
  console.log('分享结果')
}

// 导出事件处理
const onExportStarted = (format: string) => {
  console.log(`开始导出 ${format}`)
}

const onExportCompleted = (format: string) => {
  console.log(`${format} 导出完成`)
}

const onExportFailed = (format: string, error: string) => {
  console.error(`${format} 导出失败:`, error)
}

// 分享事件处理
const onShareCompleted = (platform: string) => {
  console.log(`${platform} 分享完成`)
}

const onShareFailed = (platform: string, error: string) => {
  console.error(`${platform} 分享失败:`, error)
}
</script>

<style scoped>
/* 组件特定样式 */
.currency {
  @apply transition-all duration-300;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .text-2xl {
    @apply text-xl;
  }

  .text-sm {
    @apply text-xs;
  }

  .mb-6 {
    @apply mb-4;
  }

  .mt-8 {
    @apply mt-6;
  }

  /* 确保图表在移动端可滚动 */
  .chart-container {
    @apply overflow-x-auto;
  }
}

/* 超小屏幕优化 */
@media (max-width: 375px) {
  .text-xl {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }

  .gap-3 {
    gap: 0.5rem;
  }
}

/* 动画效果 */
@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.currency {
  animation: countUp 0.5s ease-out;
}

/* 暗色模式优化 */
@media (prefers-color-scheme: dark) {
  .currency {
    @apply text-gray-100;
  }
}
</style>
