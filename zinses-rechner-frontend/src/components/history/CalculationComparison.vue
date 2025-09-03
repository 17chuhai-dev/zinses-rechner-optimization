<template>
  <div class="calculation-comparison">
    <BaseCard title="Berechnungsvergleich" padding="lg">
      <!-- 比较概览 -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ calculations.length }} Berechnungen im Vergleich
          </h3>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="$emit('close')"
          >
            <BaseIcon name="x" size="sm" class="mr-1" />
            Schließen
          </BaseButton>
        </div>
        
        <!-- 计算器类型标签 -->
        <div class="flex flex-wrap gap-2">
          <span
            v-for="type in uniqueCalculatorTypes"
            :key="type"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
          >
            <BaseIcon :name="getCalculatorIcon(type)" size="sm" class="mr-1" />
            {{ getCalculatorName(type) }}
          </span>
        </div>
      </div>

      <!-- 对比表格 -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Eigenschaft
              </th>
              <th
                v-for="(calc, index) in calculations"
                :key="calc.id"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div class="flex items-center space-x-2">
                  <BaseIcon :name="getCalculatorIcon(calc.calculatorId)" size="sm" />
                  <span>Berechnung {{ index + 1 }}</span>
                  <BaseButton
                    variant="ghost"
                    size="xs"
                    @click="removeFromComparison(calc.id)"
                  >
                    <BaseIcon name="x" size="xs" />
                  </BaseButton>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- 基本信息行 -->
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Rechner
              </td>
              <td
                v-for="calc in calculations"
                :key="`calculator-${calc.id}`"
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              >
                {{ calc.calculatorName }}
              </td>
            </tr>
            
            <tr class="bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Datum
              </td>
              <td
                v-for="calc in calculations"
                :key="`date-${calc.id}`"
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              >
                {{ formatDate(calc.timestamp) }}
              </td>
            </tr>

            <!-- 输入参数对比 -->
            <tr v-for="param in commonInputParams" :key="`input-${param}`">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ getParamLabel(param) }}
              </td>
              <td
                v-for="calc in calculations"
                :key="`${param}-${calc.id}`"
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              >
                {{ formatParamValue(calc.inputData[param], param) }}
              </td>
            </tr>

            <!-- 结果对比 -->
            <tr class="bg-blue-50">
              <td colspan="100%" class="px-6 py-3 text-sm font-semibold text-blue-900">
                Ergebnisse
              </td>
            </tr>
            
            <tr v-for="result in commonResultParams" :key="`result-${result}`">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ getResultLabel(result) }}
              </td>
              <td
                v-for="calc in calculations"
                :key="`${result}-${calc.id}`"
                :class="[
                  'px-6 py-4 whitespace-nowrap text-sm',
                  getBestValueClass(result, calc.results[result])
                ]"
              >
                {{ formatResultValue(calc.results[result], result) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 可视化图表 -->
      <div v-if="chartData.length > 0" class="mt-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Visueller Vergleich</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 柱状图对比 -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="text-md font-medium text-gray-900 mb-3">Hauptergebnisse</h4>
            <div class="h-64 flex items-end justify-around space-x-2">
              <div
                v-for="(item, index) in chartData"
                :key="`chart-${index}`"
                class="flex flex-col items-center space-y-2"
              >
                <div
                  class="bg-blue-500 rounded-t"
                  :style="{ 
                    height: `${(item.value / maxChartValue) * 200}px`,
                    width: '40px'
                  }"
                ></div>
                <div class="text-xs text-center text-gray-600">
                  <div class="font-medium">{{ item.label }}</div>
                  <div>{{ formatCurrency(item.value) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 差异分析 -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="text-md font-medium text-gray-900 mb-3">Unterschiede</h4>
            <div class="space-y-3">
              <div v-for="diff in differences" :key="diff.metric" class="flex justify-between items-center">
                <span class="text-sm text-gray-600">{{ diff.metric }}</span>
                <div class="flex items-center space-x-2">
                  <span :class="[
                    'text-sm font-medium',
                    diff.difference > 0 ? 'text-green-600' : 'text-red-600'
                  ]">
                    {{ diff.difference > 0 ? '+' : '' }}{{ formatCurrency(diff.difference) }}
                  </span>
                  <span class="text-xs text-gray-500">
                    ({{ diff.percentage > 0 ? '+' : '' }}{{ diff.percentage.toFixed(1) }}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导出和操作 -->
      <div class="mt-6 flex justify-between items-center">
        <div class="text-sm text-gray-500">
          Vergleich erstellt am {{ formatDate(new Date()) }}
        </div>
        
        <div class="flex space-x-3">
          <BaseButton
            variant="secondary"
            size="sm"
            @click="exportComparison"
          >
            <BaseIcon name="download" size="sm" class="mr-1" />
            Exportieren
          </BaseButton>
          
          <BaseButton
            variant="primary"
            size="sm"
            @click="saveComparison"
          >
            <BaseIcon name="bookmark" size="sm" class="mr-1" />
            Vergleich speichern
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
  (e: 'close'): void
  (e: 'remove-calculation', id: string): void
  (e: 'export-comparison', data: any): void
  (e: 'save-comparison', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性
const uniqueCalculatorTypes = computed(() => {
  return [...new Set(props.calculations.map(c => c.calculatorId))]
})

const commonInputParams = computed(() => {
  if (props.calculations.length === 0) return []
  
  const allParams = props.calculations.map(c => Object.keys(c.inputData))
  return allParams[0].filter(param => 
    allParams.every(params => params.includes(param))
  )
})

const commonResultParams = computed(() => {
  if (props.calculations.length === 0) return []
  
  const allResults = props.calculations.map(c => Object.keys(c.results))
  return allResults[0].filter(result => 
    allResults.every(results => results.includes(result))
  )
})

const chartData = computed(() => {
  const mainMetrics = ['finalAmount', 'monthlyPayment', 'totalInterest', 'totalPayment']
  const data: Array<{ label: string; value: number }> = []
  
  props.calculations.forEach((calc, index) => {
    mainMetrics.forEach(metric => {
      if (calc.results[metric] && typeof calc.results[metric] === 'number') {
        data.push({
          label: `${getCalculatorName(calc.calculatorId)} ${index + 1}`,
          value: calc.results[metric]
        })
      }
    })
  })
  
  return data
})

const maxChartValue = computed(() => {
  return Math.max(...chartData.value.map(d => d.value), 1)
})

const differences = computed(() => {
  if (props.calculations.length < 2) return []
  
  const diffs: Array<{ metric: string; difference: number; percentage: number }> = []
  const baseCalc = props.calculations[0]
  const compareCalc = props.calculations[1]
  
  commonResultParams.value.forEach(param => {
    const baseValue = baseCalc.results[param]
    const compareValue = compareCalc.results[param]
    
    if (typeof baseValue === 'number' && typeof compareValue === 'number') {
      const difference = compareValue - baseValue
      const percentage = baseValue !== 0 ? (difference / baseValue) * 100 : 0
      
      diffs.push({
        metric: getResultLabel(param),
        difference,
        percentage
      })
    }
  })
  
  return diffs
})

// 方法
const getCalculatorIcon = (calculatorId: string): string => {
  const icons: Record<string, string> = {
    'compound-interest': 'chart-line',
    'loan': 'credit-card',
    'mortgage': 'home'
  }
  return icons[calculatorId] || 'calculator'
}

const getCalculatorName = (calculatorId: string): string => {
  const names: Record<string, string> = {
    'compound-interest': 'Zinseszins-Rechner',
    'loan': 'Darlehensrechner',
    'mortgage': 'Baufinanzierungsrechner'
  }
  return names[calculatorId] || calculatorId
}

const getParamLabel = (param: string): string => {
  const labels: Record<string, string> = {
    principal: 'Startkapital',
    monthlyPayment: 'Monatliche Einzahlung',
    annualRate: 'Zinssatz',
    years: 'Laufzeit (Jahre)',
    purchasePrice: 'Kaufpreis',
    downPayment: 'Eigenkapital'
  }
  return labels[param] || param
}

const getResultLabel = (result: string): string => {
  const labels: Record<string, string> = {
    finalAmount: 'Endbetrag',
    totalInterest: 'Zinsen gesamt',
    monthlyPayment: 'Monatsrate',
    totalPayment: 'Gesamtzahlung',
    affordabilityRatio: 'Belastungsquote'
  }
  return labels[result] || result
}

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatParamValue = (value: any, param: string): string => {
  if (typeof value === 'number') {
    if (param.includes('Rate') || param.includes('rate')) {
      return `${value}%`
    }
    if (param.includes('years') || param.includes('Years')) {
      return `${value} Jahre`
    }
    return formatCurrency(value)
  }
  return String(value || '-')
}

const formatResultValue = (value: any, result: string): string => {
  if (typeof value === 'number') {
    if (result.includes('Ratio') || result.includes('ratio')) {
      return `${(value * 100).toFixed(1)}%`
    }
    return formatCurrency(value)
  }
  return String(value || '-')
}

const formatCurrency = (value: number): string => {
  return `€${value.toLocaleString('de-DE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}

const getBestValueClass = (metric: string, value: any): string => {
  // 这里可以根据指标类型来判断哪个值更好
  // 例如：利息越低越好，收益越高越好
  const lowerIsBetter = ['totalInterest', 'monthlyPayment']
  
  if (lowerIsBetter.includes(metric)) {
    // 找到最小值并高亮
    const values = props.calculations.map(c => c.results[metric]).filter(v => typeof v === 'number')
    const minValue = Math.min(...values)
    return value === minValue ? 'text-green-600 font-semibold' : 'text-gray-500'
  }
  
  return 'text-gray-500'
}

const removeFromComparison = (id: string) => {
  emit('remove-calculation', id)
}

const exportComparison = () => {
  const comparisonData = {
    timestamp: new Date(),
    calculations: props.calculations,
    summary: {
      totalCalculations: props.calculations.length,
      calculatorTypes: uniqueCalculatorTypes.value,
      differences: differences.value
    }
  }
  
  emit('export-comparison', comparisonData)
}

const saveComparison = () => {
  const comparisonData = {
    id: crypto.randomUUID(),
    name: `Vergleich ${props.calculations.length} Berechnungen`,
    timestamp: new Date(),
    calculations: props.calculations,
    type: 'comparison'
  }
  
  emit('save-comparison', comparisonData)
}
</script>

<style scoped>
.calculation-comparison {
  @apply w-full;
}

/* 表格样式优化 */
.calculation-comparison table {
  @apply border-collapse;
}

.calculation-comparison th,
.calculation-comparison td {
  @apply border-b border-gray-200;
}

/* 图表动画 */
.calculation-comparison .bg-blue-500 {
  transition: height 0.3s ease-in-out;
}
</style>
