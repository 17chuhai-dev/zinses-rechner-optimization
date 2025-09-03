<template>
  <div class="tax-results">
    <!-- 税前/税后对比 -->
    <div class="tax-comparison bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span class="text-2xl mr-2">🇩🇪</span>
        Steuerliche Auswirkung
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 税前收益 -->
        <div class="gross-results">
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <h4 class="text-sm font-medium text-gray-600 mb-2">Brutto-Erträge</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-700">Zinserträge gesamt:</span>
                <span class="font-semibold text-gray-900">
                  {{ formatCurrency(taxCalculation.grossInterest) }}
                </span>
              </div>
              <div class="flex justify-between text-xs text-gray-500">
                <span>Vor Steuern</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 税后收益 -->
        <div class="net-results">
          <div class="bg-white rounded-lg p-4 border border-green-200">
            <h4 class="text-sm font-medium text-green-700 mb-2">Netto-Erträge</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-700">Nach Steuern:</span>
                <span class="font-semibold text-green-600">
                  {{ formatCurrency(taxCalculation.netInterest) }}
                </span>
              </div>
              <div class="flex justify-between text-xs text-gray-500">
                <span>Effektive Rendite</span>
                <span>{{ (100 - taxCalculation.effectiveTaxRate).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 税务差额突出显示 -->
      <div class="tax-impact mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-red-600 text-xl mr-2">💸</span>
            <span class="text-sm font-medium text-red-800">Steuerbelastung:</span>
          </div>
          <div class="text-right">
            <div class="font-bold text-red-600">
              {{ formatCurrency(taxCalculation.totalTax) }}
            </div>
            <div class="text-xs text-red-500">
              {{ taxCalculation.effectiveTaxRate.toFixed(1) }}% der Erträge
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细税务明细 -->
    <div class="tax-breakdown bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h4 class="text-md font-semibold text-gray-900 mb-4">
        📋 Detaillierte Steuerberechnung
      </h4>
      
      <div class="space-y-4">
        <!-- 免税额度 -->
        <div class="tax-item flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <span class="text-sm font-medium text-gray-700">Sparerpauschbetrag</span>
            <p class="text-xs text-gray-500">Steuerfreier Betrag pro Jahr</p>
          </div>
          <span class="font-semibold text-green-600">
            {{ formatCurrency(taxCalculation.taxFreeAmount) }}
          </span>
        </div>

        <!-- 应税利息 -->
        <div class="tax-item flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <span class="text-sm font-medium text-gray-700">Steuerpflichtige Erträge</span>
            <p class="text-xs text-gray-500">Erträge über dem Freibetrag</p>
          </div>
          <span class="font-semibold text-gray-900">
            {{ formatCurrency(taxCalculation.taxableInterest) }}
          </span>
        </div>

        <!-- 资本利得税 -->
        <div class="tax-item flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <span class="text-sm font-medium text-gray-700">Abgeltungssteuer (25%)</span>
            <p class="text-xs text-gray-500">Kapitalertragsteuer</p>
          </div>
          <span class="font-semibold text-red-600">
            -{{ formatCurrency(taxCalculation.abgeltungssteuer) }}
          </span>
        </div>

        <!-- 团结税 -->
        <div class="tax-item flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <span class="text-sm font-medium text-gray-700">Solidaritätszuschlag (5,5%)</span>
            <p class="text-xs text-gray-500">Auf die Abgeltungssteuer</p>
          </div>
          <span class="font-semibold text-red-600">
            -{{ formatCurrency(taxCalculation.solidaritaetszuschlag) }}
          </span>
        </div>

        <!-- 教会税 -->
        <div 
          v-if="taxCalculation.kirchensteuer > 0" 
          class="tax-item flex justify-between items-center py-2 border-b border-gray-100"
        >
          <div>
            <span class="text-sm font-medium text-gray-700">
              Kirchensteuer ({{ (taxSettings.kirchensteuerRate * 100).toFixed(1) }}%)
            </span>
            <p class="text-xs text-gray-500">Auf die Abgeltungssteuer</p>
          </div>
          <span class="font-semibold text-red-600">
            -{{ formatCurrency(taxCalculation.kirchensteuer) }}
          </span>
        </div>
      </div>

      <!-- 总计 -->
      <div class="tax-total mt-4 pt-4 border-t-2 border-gray-200">
        <div class="flex justify-between items-center">
          <span class="text-base font-semibold text-gray-900">Steuern gesamt:</span>
          <span class="text-lg font-bold text-red-600">
            -{{ formatCurrency(taxCalculation.totalTax) }}
          </span>
        </div>
        <div class="flex justify-between items-center mt-2">
          <span class="text-base font-semibold text-gray-900">Netto-Ertrag:</span>
          <span class="text-lg font-bold text-green-600">
            {{ formatCurrency(taxCalculation.netInterest) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 税务优化提示 -->
    <div class="tax-tips bg-blue-50 rounded-lg p-6 border border-blue-200">
      <h4 class="text-md font-semibold text-blue-900 mb-3 flex items-center">
        <span class="text-xl mr-2">💡</span>
        Steueroptimierung-Tipps
      </h4>
      
      <div class="space-y-2">
        <div 
          v-for="(tip, index) in optimizationTips" 
          :key="index"
          class="flex items-start text-sm text-blue-800"
        >
          <span class="mr-2 mt-0.5">•</span>
          <span v-html="tip"></span>
        </div>
      </div>
    </div>

    <!-- 年度税务明细表格 -->
    <div v-if="yearlyTaxBreakdown.length > 0" class="yearly-tax-breakdown mt-6">
      <h4 class="text-md font-semibold text-gray-900 mb-4">
        📊 Jährliche Steuerbelastung
      </h4>
      
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jahr
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brutto-Zinsen
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Steuern
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Netto-Zinsen
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Steuersatz
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr 
              v-for="yearData in yearlyTaxBreakdown.slice(0, 10)" 
              :key="yearData.year"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ yearData.year }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right">
                {{ formatCurrency(yearData.grossInterest) }}
              </td>
              <td class="px-4 py-3 text-sm text-red-600 text-right">
                {{ formatCurrency(yearData.taxCalculation.totalTax) }}
              </td>
              <td class="px-4 py-3 text-sm text-green-600 text-right font-medium">
                {{ formatCurrency(yearData.taxCalculation.netInterest) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 text-right">
                {{ yearData.taxCalculation.effectiveTaxRate.toFixed(1) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="yearlyTaxBreakdown.length > 10" class="mt-3 text-center">
        <button 
          @click="showAllYears = !showAllYears"
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {{ showAllYears ? 'Weniger anzeigen' : `${yearlyTaxBreakdown.length - 10} weitere Jahre anzeigen` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { GermanTaxService, type TaxCalculation, type TaxSettings, type YearlyTaxBreakdown } from '@/services/germanTaxService'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  taxCalculation: TaxCalculation
  taxSettings: TaxSettings
  yearlyTaxBreakdown?: YearlyTaxBreakdown[]
}

const props = withDefaults(defineProps<Props>(), {
  yearlyTaxBreakdown: () => []
})

// 状态
const showAllYears = ref(false)

// 计算属性
const optimizationTips = computed(() => {
  return GermanTaxService.getTaxOptimizationTips(
    props.taxCalculation.grossInterest,
    props.taxSettings
  )
})

const displayedYearlyData = computed(() => {
  if (showAllYears.value) {
    return props.yearlyTaxBreakdown
  }
  return props.yearlyTaxBreakdown.slice(0, 10)
})
</script>

<style scoped>
.tax-item {
  transition: background-color 0.2s ease;
}

.tax-item:hover {
  @apply bg-gray-50;
}

/* 表格样式 */
table {
  border-collapse: separate;
  border-spacing: 0;
}

th:first-child,
td:first-child {
  border-top-left-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
}

th:last-child,
td:last-child {
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

/* 动画效果 */
.tax-results > * {
  animation: slideInUp 0.3s ease-out;
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
</style>
