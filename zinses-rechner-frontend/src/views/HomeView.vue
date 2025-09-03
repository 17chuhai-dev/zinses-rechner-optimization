<script setup lang="ts">
import { ref, reactive } from 'vue'

// 简化的表单数据
const form = reactive({
  principal: 10000,
  rate: 4.0,
  years: 10,
  monthlyPayment: 0
})

// 简化的税务设置
const taxSettings = ref({
  enabled: false
})

// 计算结果
const result = ref(null)
const isCalculating = ref(false)

// 德语内容
const MAIN_CONTENT = {
  title: 'Zinseszins-Rechner',
  subtitle: 'Berechnen Sie Ihre Kapitalentwicklung mit unserem kostenlosen Zinseszins-Rechner',
  description: 'Planen Sie Ihre finanzielle Zukunft mit unserem präzisen Zinseszins-Rechner. Berechnen Sie, wie sich Ihr Kapital über die Jahre entwickelt.'
}

const VALUE_PROPOSITIONS = [
  {
    icon: 'calculator',
    title: 'Präzise Berechnung',
    description: 'Exakte Zinseszins-Berechnung mit verschiedenen Zinszusammensetzungen'
  },
  {
    icon: 'shield',
    title: 'Kostenlos & Sicher',
    description: 'Vollständig kostenlos und ohne Registrierung. Ihre Daten bleiben privat.'
  },
  {
    icon: 'lightning',
    title: 'Sofortige Ergebnisse',
    description: 'Erhalten Sie Ihre Berechnungsergebnisse in Sekundenschnelle'
  },
  {
    icon: 'chart',
    title: 'Detaillierte Aufschlüsselung',
    description: 'Jahresweise Aufschlüsselung Ihrer Kapitalentwicklung'
  }
]

// 简化的计算函数
const calculate = () => {
  isCalculating.value = true

  setTimeout(() => {
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

    isCalculating.value = false
  }, 1000)
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}
</script>

<template>
  <main class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          {{ MAIN_CONTENT.title }}
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ MAIN_CONTENT.subtitle }}. {{ MAIN_CONTENT.description }}
        </p>
      </div>

      <!-- 主要内容区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：表单和税务设置 -->
        <div class="space-y-6">
          <!-- 计算器表单 -->
          <div class="bg-white rounded-lg shadow-lg p-6">
            <form @submit.prevent="calculate" class="space-y-6">
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

              <button
                type="submit"
                data-testid="calculate-button"
                :disabled="isCalculating"
                class="w-full bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {{ isCalculating ? 'Berechnung läuft...' : 'Jetzt berechnen' }}
              </button>
            </form>
          </div>

          <!-- 税务设置 -->
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">🇩🇪 Deutsche Steuern berücksichtigen</h3>
            <p class="text-gray-600 mb-4">Berechnung der Abgeltungssteuer und weiterer Steuern</p>
            <div class="flex items-center">
              <input
                id="tax-enabled"
                v-model="taxSettings.enabled"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="tax-enabled" class="ml-2 block text-sm text-gray-900">
                Aktivieren
              </label>
            </div>
          </div>
        </div>

        <!-- 右侧：结果展示 -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4">Ihre Berechnung</h3>

          <div v-if="!result && !isCalculating" class="text-center py-8">
            <div class="text-6xl mb-4">📊</div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Bereit für Ihre Berechnung</h3>
            <p class="text-gray-600">Geben Sie Ihre Daten ein und klicken Sie auf "Jetzt berechnen", um Ihre Zinserträge zu sehen.</p>
          </div>

          <div v-if="isCalculating" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Berechnung läuft...</p>
          </div>

          <div v-if="result" class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div class="text-center p-4 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">
                  {{ formatCurrency(result.finalAmount) }}
                </div>
                <div class="text-sm text-gray-600">Endkapital</div>
              </div>
              <div class="text-center p-4 bg-green-50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">
                  {{ formatCurrency(result.totalInterest) }}
                </div>
                <div class="text-sm text-gray-600">Zinserträge</div>
              </div>
              <div class="text-center p-4 bg-purple-50 rounded-lg">
                <div class="text-2xl font-bold text-purple-600">
                  {{ formatCurrency(result.totalContributions) }}
                </div>
                <div class="text-sm text-gray-600">Eingezahlt</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 价值主张区域 -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div
          v-for="(proposition, index) in VALUE_PROPOSITIONS"
          :key="index"
          class="text-center"
        >
          <div
            :class="[
              'rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4',
              index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-green-100' : index === 2 ? 'bg-yellow-100' : 'bg-purple-100'
            ]"
          >
            <span class="text-2xl">{{ proposition.icon }}</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ proposition.title }}</h3>
          <p class="text-gray-600">
            {{ proposition.description }}
          </p>
        </div>
      </div>
    </div>
  </main>
</template>
