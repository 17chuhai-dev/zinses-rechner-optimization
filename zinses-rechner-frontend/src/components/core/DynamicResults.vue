<template>
  <div class="dynamic-results">
    <!-- 加载状态 -->
    <LoadingState
      v-if="isCalculating"
      :is-loading="true"
      message="Berechnung läuft..."
      type="spinner"
      size="lg"
      class="py-12"
    />

    <!-- 结果显示 -->
    <div v-else-if="results" class="space-y-6">
      <!-- 主要指标 -->
      <BaseCard title="Ergebnisse" padding="lg">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ResultMetric
            v-for="metric in calculator.resultConfig?.primaryMetrics || []"
            :key="metric.key"
            :metric="metric"
            :value="getMetricValue(metric.key)"
            :highlight="metric.highlight"
          />
        </div>

        <!-- 次要指标 -->
        <div
          v-if="calculator.resultConfig?.secondaryMetrics?.length"
          class="mt-8 pt-6 border-t border-gray-200"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultMetric
              v-for="metric in calculator.resultConfig?.secondaryMetrics || []"
              :key="metric.key"
              :metric="metric"
              :value="getMetricValue(metric.key)"
              size="sm"
            />
          </div>
        </div>
      </BaseCard>

      <!-- 图表显示 -->
      <div
        v-if="calculator.resultConfig?.charts?.length"
        class="space-y-6"
      >
        <ResultChart
          v-for="chart in calculator.resultConfig?.charts || []"
          :key="chart.title"
          :chart="chart"
          :data="getChartData(chart.dataKey)"
          :form-data="formData"
        />
      </div>

      <!-- 表格显示 -->
      <div
        v-if="calculator.resultConfig?.tables?.length"
        class="space-y-6"
      >
        <ResultTable
          v-for="table in calculator.resultConfig?.tables || []"
          :key="table.title"
          :table="table"
          :data="getTableData(table.dataKey)"
        />
      </div>

      <!-- 导出按钮 -->
      <div class="flex flex-wrap gap-3">
        <BaseButton
          v-for="format in exportFormats"
          :key="format"
          variant="secondary"
          size="sm"
          :icon-left="getExportIcon(format)"
          @click="handleExport(format)"
        >
          {{ getExportLabel(format) }}
        </BaseButton>

        <BaseButton
          variant="secondary"
          size="sm"
          icon-left="share"
          @click="handleShare"
        >
          Teilen
        </BaseButton>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-12">
      <BaseIcon name="calculator" size="3xl" class="mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        Bereit für Ihre Berechnung
      </h3>
      <p class="text-gray-500">
        Füllen Sie das Formular aus und klicken Sie auf "Berechnen", um Ihre Ergebnisse zu sehen.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  BaseCalculator,
  CalculationResult
} from '@/types/calculator'
import type { ExportFormat } from '@/types/global'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import LoadingState from '../ui/LoadingState.vue'
import ResultMetric from './ResultMetric.vue'
import ResultChart from './ResultChart.vue'
import ResultTable from './ResultTable.vue'

interface Props {
  calculator: BaseCalculator
  results: CalculationResult | null
  formData: Record<string, any>
  isCalculating?: boolean
}

interface Emits {
  (e: 'export', format: ExportFormat): void
  (e: 'share', platform: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性
const exportFormats = computed((): ExportFormat[] => {
  return (props.calculator.exportConfig?.formats || ['csv', 'pdf']) as ExportFormat[]
})

// 方法
const getMetricValue = (key: string): any => {
  if (!props.results) return null

  // 支持嵌套键访问
  const keys = key.split('.')
  let value = props.results as any

  for (const k of keys) {
    value = value?.[k]
  }

  return value
}

const getChartData = (dataKey: string): any => {
  return getMetricValue(dataKey)
}

const getTableData = (dataKey: string): any => {
  return getMetricValue(dataKey)
}

const getExportIcon = (format: ExportFormat): string => {
  const icons: Record<ExportFormat, string> = {
    csv: 'document-text',
    excel: 'document-text',
    pdf: 'document',
    json: 'code'
  }
  return icons[format] || 'download'
}

const getExportLabel = (format: ExportFormat): string => {
  const labels: Record<ExportFormat, string> = {
    csv: 'CSV',
    excel: 'Excel',
    pdf: 'PDF',
    json: 'JSON'
  }
  return labels[format] || format.toUpperCase()
}

const handleExport = (format: ExportFormat) => {
  emit('export', format)
}

const handleShare = () => {
  emit('share', 'general')
}
</script>

<style scoped>
.dynamic-results {
  @apply w-full;
}
</style>
