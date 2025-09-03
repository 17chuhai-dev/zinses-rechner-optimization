<template>
  <BaseCard title="So berechnen wir Ihren Zinseszins" padding="lg" class="mt-8">
    <div class="formula-explanation">
      <!-- 公式介绍 -->
      <div class="mb-6">
        <p class="text-gray-700 mb-4">
          Unsere Berechnung basiert auf der mathematisch korrekten Zinseszins-Formel und 
          berücksichtigt deutsche Steuergesetze:
        </p>
        
        <!-- 主要公式 -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div class="text-center">
            <div class="text-lg font-mono text-blue-800 mb-2">
              A = P × (1 + r/n)^(n×t) + PMT × [((1 + r/n)^(n×t) - 1) / (r/n)]
            </div>
            <p class="text-sm text-blue-600">Zinseszins-Formel mit regelmäßigen Einzahlungen</p>
          </div>
        </div>
      </div>

      <!-- 参数说明 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 class="text-lg font-semibold text-gray-800 mb-3">Parameter-Erklärung:</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-center">
              <span class="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 mr-3 min-w-[2rem] text-center">A</span>
              <span class="text-gray-700">Endkapital nach t Jahren</span>
            </div>
            <div class="flex items-center">
              <span class="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 mr-3 min-w-[2rem] text-center">P</span>
              <span class="text-gray-700">Startkapital (Principal)</span>
            </div>
            <div class="flex items-center">
              <span class="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 mr-3 min-w-[2rem] text-center">r</span>
              <span class="text-gray-700">Jährlicher Zinssatz (als Dezimalzahl)</span>
            </div>
            <div class="flex items-center">
              <span class="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 mr-3 min-w-[2rem] text-center">n</span>
              <span class="text-gray-700">Anzahl der Zinsperioden pro Jahr</span>
            </div>
            <div class="flex items-center">
              <span class="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 mr-3 min-w-[2rem] text-center">t</span>
              <span class="text-gray-700">Anlagezeitraum in Jahren</span>
            </div>
            <div class="flex items-center">
              <span class="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 mr-3 min-w-[2rem] text-center">PMT</span>
              <span class="text-gray-700">Regelmäßige Zahlung (monatlich)</span>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-lg font-semibold text-gray-800 mb-3">Ihre Werte:</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Startkapital (P):</span>
              <span class="font-semibold">{{ formatCurrency(form.principal) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Zinssatz (r):</span>
              <span class="font-semibold">{{ form.annualRate }}% ({{ (form.annualRate / 100).toFixed(4) }})</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Laufzeit (t):</span>
              <span class="font-semibold">{{ form.years }} Jahre</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Monatliche Rate (PMT):</span>
              <span class="font-semibold">{{ formatCurrency(form.monthlyPayment) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Zinsperioden (n):</span>
              <span class="font-semibold">{{ getCompoundFrequencyNumber(form.compoundFrequency) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 示例计算 -->
      <div v-if="showExample" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h4 class="text-lg font-semibold text-green-800 mb-3">
          Beispielrechnung mit Ihren Werten:
        </h4>
        <div class="space-y-2 text-sm font-mono text-green-700">
          <div>1. Zinseszins ohne Sparplan:</div>
          <div class="ml-4">
            A₁ = {{ formatCurrency(form.principal) }} × (1 + {{ (form.annualRate / 100).toFixed(4) }})^{{ form.years }}
          </div>
          <div class="ml-4">
            A₁ = {{ formatCurrency(form.principal) }} × {{ Math.pow(1 + form.annualRate / 100, form.years).toFixed(4) }}
          </div>
          <div class="ml-4 font-bold">
            A₁ = {{ formatCurrency(form.principal * Math.pow(1 + form.annualRate / 100, form.years)) }}
          </div>
          
          <div v-if="form.monthlyPayment > 0" class="mt-3">
            <div>2. Zusätzlich durch Sparplan:</div>
            <div class="ml-4">
              A₂ = {{ formatCurrency(form.monthlyPayment) }} × [((1 + {{ (form.annualRate / 100 / 12).toFixed(6) }})^{{ form.years * 12 }} - 1) / {{ (form.annualRate / 100 / 12).toFixed(6) }}]
            </div>
            <div class="ml-4 font-bold">
              A₂ ≈ {{ formatCurrency(calculateSavingsPlanValue()) }}
            </div>
            
            <div class="mt-2 font-bold text-green-800">
              Gesamtsumme: A₁ + A₂ = {{ formatCurrency(form.principal * Math.pow(1 + form.annualRate / 100, form.years) + calculateSavingsPlanValue()) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 德国税务考虑 -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h4 class="text-lg font-semibold text-yellow-800 mb-3">
          🇩🇪 Deutsche Steueraspekte
        </h4>
        <div class="text-sm text-yellow-700 space-y-2">
          <p>
            <strong>Abgeltungssteuer:</strong> 25% auf Kapitalerträge über dem Sparerpauschbetrag ({{ formatCurrency(1000) }} für Ledige, {{ formatCurrency(2000) }} für Verheiratete)
          </p>
          <p>
            <strong>Solidaritätszuschlag:</strong> 5,5% der Abgeltungssteuer (bei höheren Einkommen)
          </p>
          <p>
            <strong>Kirchensteuer:</strong> 8-9% der Abgeltungssteuer (je nach Bundesland, falls kirchensteuerpflichtig)
          </p>
          <p class="text-xs text-yellow-600 mt-2">
            * Diese Berechnung zeigt Bruttoerträge. Für genaue Steuerberechnungen konsultieren Sie einen Steuerberater.
          </p>
        </div>
      </div>

      <!-- 切换按钮 -->
      <div class="text-center">
        <button
          @click="showExample = !showExample"
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {{ showExample ? 'Beispielrechnung ausblenden' : 'Beispielrechnung anzeigen' }}
        </button>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseCard from '../ui/BaseCard.vue'
import { formatCurrency } from '@/utils/formatters'
import type { CalculatorForm } from '@/types/calculator'

interface Props {
  form: CalculatorForm
}

const props = defineProps<Props>()

const showExample = ref(false)

// 获取复利频率数字
const getCompoundFrequencyNumber = (frequency: string): number => {
  switch (frequency) {
    case 'monthly': return 12
    case 'quarterly': return 4
    case 'yearly': return 1
    default: return 12
  }
}

// 计算储蓄计划价值
const calculateSavingsPlanValue = (): number => {
  if (props.form.monthlyPayment === 0) return 0
  
  const monthlyRate = props.form.annualRate / 100 / 12
  const months = props.form.years * 12
  
  if (monthlyRate === 0) {
    return props.form.monthlyPayment * months
  }
  
  return props.form.monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
}
</script>

<style scoped>
.formula-explanation {
  line-height: 1.6;
}

.font-mono {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}
</style>
