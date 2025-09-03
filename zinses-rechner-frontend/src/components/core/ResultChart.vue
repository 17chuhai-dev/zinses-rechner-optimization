<template>
  <BaseCard :title="chart.title" padding="lg">
    <div class="chart-container">
      <!-- 房贷成本分布饼图 -->
      <MortgageCostChart
        v-if="chart.type === 'pie' && chart.title === 'Kaufkostenverteilung'"
        :purchase-price="formData.purchasePrice || 0"
        :land-transfer-tax="calculateLandTransferTax()"
        :notary-costs="calculateNotaryCosts()"
        :real-estate-agent-fee="calculateAgentFee()"
        :title="chart.title"
      />

      <!-- 复利发展图表 -->
      <CompoundInterestChart
        v-else-if="chart.type === 'area' && data && Array.isArray(data)"
        :yearly-data="data"
        :principal="formData.principal || 0"
        :total-contributions="getTotalContributions()"
        :final-amount="getFinalAmount()"
      />

      <!-- 默认占位符 -->
      <div v-else class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div class="text-center">
          <BaseIcon name="chart-bar" size="2xl" class="text-gray-400 mb-2" />
          <p class="text-gray-500">{{ chart.title }}</p>
          <p class="text-sm text-gray-400 mt-1">图表类型: {{ chart.type }}</p>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import type { ChartConfig } from '@/types/calculator'
import BaseCard from '../ui/BaseCard.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import MortgageCostChart from '../charts/MortgageCostChart.vue'

interface Props {
  chart: ChartConfig
  data: any
  formData: Record<string, any>
}

const props = defineProps<Props>()

// 计算房产转让税
const calculateLandTransferTax = (): number => {
  const purchasePrice = props.formData?.purchasePrice || 0
  const taxRate = (props.formData?.landTransferTaxRate || 5) / 100
  return purchasePrice * taxRate
}

// 计算公证费用
const calculateNotaryCosts = (): number => {
  const purchasePrice = props.formData?.purchasePrice || 0
  const notaryRate = (props.formData?.notaryRate || 1.5) / 100
  return purchasePrice * notaryRate
}

// 计算中介费
const calculateAgentFee = (): number => {
  const purchasePrice = props.formData?.purchasePrice || 0
  const agentRate = (props.formData?.realEstateAgentRate || 3.57) / 100
  return purchasePrice * agentRate
}
</script>

<style scoped>
.chart-container {
  @apply w-full;
}
</style>
