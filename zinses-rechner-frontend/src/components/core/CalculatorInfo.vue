<template>
  <BaseCard title="Rechner-Informationen" padding="lg">
    <div class="space-y-6">
      <!-- 基本信息 -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-3">Über diesen Rechner</h3>
        <p class="text-gray-600">{{ calculator.description }}</p>
      </div>

      <!-- 公式说明 -->
      <div v-if="showFormula" class="pt-6 border-t border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-3">Berechnungsformel</h3>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600 mb-2">
            Die Berechnung basiert auf mathematisch präzisen Formeln für {{ calculator.name.toLowerCase() }}.
          </p>
          <div class="text-xs text-gray-500">
            Version {{ calculator.version }} | Kategorie: {{ getCategoryLabel(calculator.category) }}
          </div>
        </div>
      </div>

      <!-- 使用示例 -->
      <div v-if="showExamples" class="pt-6 border-t border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-3">Anwendungsbeispiele</h3>
        <div class="space-y-3">
          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="text-sm text-blue-800">
              💡 <strong>Tipp:</strong> Nutzen Sie realistische Werte für genauere Ergebnisse.
            </p>
          </div>
          <div class="bg-green-50 p-3 rounded-lg">
            <p class="text-sm text-green-800">
              ✅ <strong>Empfehlung:</strong> Vergleichen Sie verschiedene Szenarien für bessere Entscheidungen.
            </p>
          </div>
        </div>
      </div>

      <!-- 免责声明 -->
      <div class="pt-6 border-t border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-3">Wichtiger Hinweis</h3>
        <div class="bg-yellow-50 p-4 rounded-lg">
          <p class="text-sm text-yellow-800">
            ⚠️ Die Berechnungen dienen nur zu Informationszwecken und stellen keine Finanzberatung dar. 
            Konsultieren Sie einen Finanzexperten für individuelle Beratung.
          </p>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import type { BaseCalculator, CalculatorCategory } from '@/types/calculator'
import BaseCard from '../ui/BaseCard.vue'

interface Props {
  calculator: BaseCalculator
  showFormula?: boolean
  showExamples?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFormula: true,
  showExamples: true
})

// 方法
const getCategoryLabel = (category: CalculatorCategory): string => {
  const labels: Record<CalculatorCategory, string> = {
    'compound-interest': 'Zinseszins',
    'loan': 'Kredite',
    'mortgage': 'Baufinanzierung',
    'retirement': 'Altersvorsorge',
    'investment': 'Geldanlage',
    'tax': 'Steuern'
  }
  return labels[category] || category
}
</script>

<style scoped>
/* 组件样式 */
</style>
