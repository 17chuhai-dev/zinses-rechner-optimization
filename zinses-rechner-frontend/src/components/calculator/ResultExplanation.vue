<template>
  <div v-if="explanation" class="result-explanation bg-white rounded-lg shadow-lg p-6 mt-6">
    <!-- 主要总结 -->
    <div class="summary-section mb-6">
      <h3 class="text-xl font-bold text-gray-900 mb-3">
        📊 Ihre Berechnung im Überblick
      </h3>
      <p class="text-lg text-gray-700 leading-relaxed">
        {{ explanation.summary }}
      </p>
    </div>

    <!-- 关键指标 -->
    <div class="metrics-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="metric-card bg-blue-50 p-4 rounded-lg">
        <div class="text-sm text-blue-600 font-medium">Gesamtrendite</div>
        <div class="text-2xl font-bold text-blue-900">
          {{ formatPercentage(explanation.keyMetrics.totalReturn) }}
        </div>
      </div>

      <div class="metric-card bg-green-50 p-4 rounded-lg">
        <div class="text-sm text-green-600 font-medium">Jährliche Rendite</div>
        <div class="text-2xl font-bold text-green-900">
          {{ formatPercentage(explanation.keyMetrics.annualReturn) }}
        </div>
      </div>

      <div class="metric-card bg-orange-50 p-4 rounded-lg">
        <div class="text-sm text-orange-600 font-medium">Real (nach Inflation)</div>
        <div class="text-2xl font-bold text-orange-900">
          {{ formatPercentage(explanation.keyMetrics.inflationAdjusted || 0) }}
        </div>
      </div>
    </div>

    <!-- 智能洞察 -->
    <div v-if="explanation.insights.length > 0" class="insights-section mb-6">
      <h4 class="text-lg font-semibold text-gray-900 mb-3">
        💡 Wichtige Erkenntnisse
      </h4>
      <div class="space-y-3">
        <div
          v-for="(insight, index) in explanation.insights"
          :key="index"
          :class="[
            'insight-card p-4 rounded-lg border-l-4',
            {
              'bg-green-50 border-green-400': insight.type === 'success',
              'bg-yellow-50 border-yellow-400': insight.type === 'warning',
              'bg-blue-50 border-blue-400': insight.type === 'info',
              'bg-purple-50 border-purple-400': insight.type === 'tip'
            }
          ]"
        >
          <div class="flex items-start space-x-3">
            <span class="text-xl">{{ insight.icon }}</span>
            <div>
              <h5 class="font-semibold text-gray-900">{{ insight.title }}</h5>
              <p class="text-gray-700 mt-1">{{ insight.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可折叠的详细部分 -->
    <div class="expandable-sections">
      <!-- 投资建议 -->
      <div class="section-toggle mb-4">
        <button
          @click="showRecommendations = !showRecommendations"
          class="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span class="font-medium text-gray-900">
            🎯 Empfehlungen für Sie
          </span>
          <ChevronDownIcon
            :class="['w-5 h-5 text-gray-500 transition-transform', { 'rotate-180': showRecommendations }]"
          />
        </button>

        <Transition name="slide-down">
          <div v-show="showRecommendations" class="mt-3 p-4 bg-white border rounded-lg">
            <ul class="space-y-2">
              <li
                v-for="(recommendation, index) in explanation.recommendations"
                :key="index"
                class="flex items-start space-x-2"
              >
                <span class="text-green-500 mt-1">✓</span>
                <span class="text-gray-700">{{ recommendation }}</span>
              </li>
            </ul>
          </div>
        </Transition>
      </div>

      <!-- 风险因素 -->
      <div class="section-toggle mb-4">
        <button
          @click="showRisks = !showRisks"
          class="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span class="font-medium text-gray-900">
            ⚠️ Wichtige Hinweise
          </span>
          <ChevronDownIcon
            :class="['w-5 h-5 text-gray-500 transition-transform', { 'rotate-180': showRisks }]"
          />
        </button>

        <Transition name="slide-down">
          <div v-show="showRisks" class="mt-3 p-4 bg-white border rounded-lg">
            <ul class="space-y-2">
              <li
                v-for="(risk, index) in explanation.riskFactors"
                :key="index"
                class="flex items-start space-x-2"
              >
                <span class="text-orange-500 mt-1">!</span>
                <span class="text-gray-700">{{ risk }}</span>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 行动号召 -->
    <div class="cta-section mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <h5 class="font-semibold text-gray-900">Nächste Schritte</h5>
          <p class="text-sm text-gray-600 mt-1">
            Speichern Sie Ihre Berechnung oder teilen Sie sie mit anderen.
          </p>
        </div>
        <div class="flex space-x-2">
          <button
            @click="$emit('export-csv')"
            class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            📊 CSV Export
          </button>
          <button
            @click="$emit('share-result')"
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            📤 Teilen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useResultExplanation } from '@/composables/useResultExplanation'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

interface Props {
  result: CalculationResult | null
  form: CalculatorForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'export-csv': []
  'share-result': []
}>()

// 使用结果解释composable
const { explanation } = useResultExplanation(
  ref(props.result),
  ref(props.form)
)

// 可折叠部分的状态
const showRecommendations = ref(false)
const showRisks = ref(false)
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.metric-card {
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.insight-card {
  transition: all 0.2s ease;
}

.insight-card:hover {
  transform: translateX(4px);
}
</style>
