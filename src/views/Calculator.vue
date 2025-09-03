<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <h1 class="text-3xl font-bold text-center mb-8">Zinseszins-Rechner</h1>
      
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <form @submit.prevent="calculate" class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="principal" class="block text-sm font-medium text-gray-700 mb-2">
                  Startkapital (€)
                </label>
                <input
                  id="principal"
                  v-model="form.principal"
                  data-testid="principal-input"
                  type="number"
                  step="0.01"
                  min="1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label for="rate" class="block text-sm font-medium text-gray-700 mb-2">
                  Zinssatz (% p.a.)
                </label>
                <input
                  id="rate"
                  v-model="form.rate"
                  data-testid="rate-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label for="years" class="block text-sm font-medium text-gray-700 mb-2">
                  Laufzeit (Jahre)
                </label>
                <input
                  id="years"
                  v-model="form.years"
                  data-testid="years-input"
                  type="number"
                  min="1"
                  max="50"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label for="monthlyPayment" class="block text-sm font-medium text-gray-700 mb-2">
                  Monatliche Sparrate (€)
                </label>
                <input
                  id="monthlyPayment"
                  v-model="form.monthlyPayment"
                  data-testid="monthly-payment-input"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="text-center">
              <button
                type="submit"
                data-testid="calculate-button"
                class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Berechnen
              </button>
            </div>
          </form>

          <div v-if="result" class="mt-8 p-6 bg-blue-50 rounded-lg">
            <h2 class="text-xl font-semibold mb-4">Ergebnis</h2>
            <div class="grid md:grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">
                  {{ formatCurrency(result.finalAmount) }}
                </div>
                <div class="text-sm text-gray-600">Endkapital</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">
                  {{ formatCurrency(result.totalInterest) }}
                </div>
                <div class="text-sm text-gray-600">Zinserträge</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">
                  {{ formatCurrency(result.totalContributions) }}
                </div>
                <div class="text-sm text-gray-600">Eingezahlt</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const form = reactive({
  principal: 10000,
  rate: 4.0,
  years: 10,
  monthlyPayment: 0
})

const result = ref<any>(null)

const calculate = () => {
  // 简化的计算逻辑
  const principal = Number(form.principal)
  const rate = Number(form.rate) / 100
  const years = Number(form.years)
  const monthlyPayment = Number(form.monthlyPayment) || 0
  
  const monthlyRate = rate / 12
  const totalMonths = years * 12
  
  // 复利计算
  let finalAmount = principal * Math.pow(1 + rate, years)
  
  // 月供计算
  if (monthlyPayment > 0) {
    const monthlyCompound = monthlyPayment * (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate
    finalAmount += monthlyCompound
  }
  
  const totalContributions = principal + (monthlyPayment * totalMonths)
  const totalInterest = finalAmount - totalContributions
  
  result.value = {
    finalAmount,
    totalInterest,
    totalContributions
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}
</script>
