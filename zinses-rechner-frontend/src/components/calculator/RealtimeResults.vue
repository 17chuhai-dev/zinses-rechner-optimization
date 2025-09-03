<template>
  <div class="realtime-results">
    <!-- 实时结果卡片 -->
    <BaseCard 
      v-if="displayResults || isCalculating"
      :class="[
        'transition-all duration-300',
        {
          'opacity-75 scale-95': isCalculating,
          'shadow-lg border-blue-200': isPreviewMode,
          'shadow-xl border-green-200': !isPreviewMode && displayResults
        }
      ]"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center">
            <BaseIcon 
              :name="isPreviewMode ? 'eye' : 'calculator'" 
              class="h-5 w-5 mr-2"
              :class="isPreviewMode ? 'text-blue-500' : 'text-green-500'"
            />
            {{ isPreviewMode ? 'Vorschau' : 'Ergebnis' }}
          </h3>
          
          <div class="flex items-center space-x-2">
            <!-- 预览模式标识 -->
            <span 
              v-if="isPreviewMode"
              class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
            >
              Vorschau
            </span>
            
            <!-- 计算中指示器 -->
            <div v-if="isCalculating" class="flex items-center space-x-2">
              <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span class="text-sm text-gray-600">Berechnung...</span>
            </div>
            
            <!-- 最后更新时间 -->
            <span 
              v-else-if="lastCalculated"
              class="text-xs text-gray-500"
              :title="lastCalculated.toLocaleString('de-DE')"
            >
              {{ formatRelativeTime(lastCalculated) }}
            </span>
          </div>
        </div>
      </template>

      <!-- 主要结果显示 -->
      <div v-if="displayResults" class="space-y-6">
        <!-- 关键指标 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 最终金额 -->
          <div class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div class="text-sm font-medium text-green-700 mb-1">Endkapital</div>
            <div 
              class="text-2xl font-bold text-green-900 transition-all duration-300"
              :class="{ 'animate-pulse': showAnimation }"
            >
              {{ formatCurrency(displayResults.finalAmount || 0) }}
            </div>
            <div v-if="resultsDiff?.finalAmountDiff" class="text-xs mt-1">
              <span 
                :class="resultsDiff.finalAmountDiff > 0 ? 'text-green-600' : 'text-red-600'"
                class="flex items-center justify-center"
              >
                <BaseIcon 
                  :name="resultsDiff.finalAmountDiff > 0 ? 'arrow-up' : 'arrow-down'" 
                  class="h-3 w-3 mr-1"
                />
                {{ formatCurrency(Math.abs(resultsDiff.finalAmountDiff)) }}
              </span>
            </div>
          </div>

          <!-- 总收益 -->
          <div class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div class="text-sm font-medium text-blue-700 mb-1">Zinserträge</div>
            <div 
              class="text-2xl font-bold text-blue-900 transition-all duration-300"
              :class="{ 'animate-pulse': showAnimation }"
            >
              {{ formatCurrency(displayResults.totalInterest || 0) }}
            </div>
            <div v-if="resultsDiff?.totalInterestDiff" class="text-xs mt-1">
              <span 
                :class="resultsDiff.totalInterestDiff > 0 ? 'text-green-600' : 'text-red-600'"
                class="flex items-center justify-center"
              >
                <BaseIcon 
                  :name="resultsDiff.totalInterestDiff > 0 ? 'arrow-up' : 'arrow-down'" 
                  class="h-3 w-3 mr-1"
                />
                {{ formatCurrency(Math.abs(resultsDiff.totalInterestDiff)) }}
              </span>
            </div>
          </div>

          <!-- 有效收益率 -->
          <div class="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div class="text-sm font-medium text-purple-700 mb-1">Effektive Rendite</div>
            <div 
              class="text-2xl font-bold text-purple-900 transition-all duration-300"
              :class="{ 'animate-pulse': showAnimation }"
            >
              {{ formatPercentage(displayResults.effectiveRate || 0) }}
            </div>
            <div v-if="resultsDiff?.effectiveRateDiff" class="text-xs mt-1">
              <span 
                :class="resultsDiff.effectiveRateDiff > 0 ? 'text-green-600' : 'text-red-600'"
                class="flex items-center justify-center"
              >
                <BaseIcon 
                  :name="resultsDiff.effectiveRateDiff > 0 ? 'arrow-up' : 'arrow-down'" 
                  class="h-3 w-3 mr-1"
                />
                {{ formatPercentage(Math.abs(resultsDiff.effectiveRateDiff)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 详细信息 -->
        <div v-if="!isPreviewMode" class="border-t pt-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Eingezahltes Kapital:</span>
              <span class="font-medium">{{ formatCurrency(displayResults.totalContributions || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Zinserträge:</span>
              <span class="font-medium text-green-600">{{ formatCurrency(displayResults.totalInterest || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- 预览模式提示 -->
        <div v-if="isPreviewMode" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="flex items-start">
            <BaseIcon name="information-circle" class="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div class="text-sm text-blue-700">
              <p class="font-medium mb-1">Vorschau-Berechnung</p>
              <p>Dies ist eine vereinfachte Vorschau. Für detaillierte Ergebnisse vervollständigen Sie bitte alle Felder.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 计算进度条 -->
      <div v-if="isCalculating && showProgress" class="mt-4">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${calculationProgress}%` }"
          ></div>
        </div>
        <div class="text-xs text-gray-500 mt-1 text-center">
          {{ calculationProgress.toFixed(0) }}% abgeschlossen
        </div>
      </div>
    </BaseCard>

    <!-- 错误显示 -->
    <BaseCard v-else-if="error" variant="danger" class="mt-4">
      <div class="flex items-start">
        <BaseIcon name="exclamation-triangle" class="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 class="text-sm font-medium text-red-800 mb-1">Berechnungsfehler</h4>
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </BaseCard>

    <!-- 空状态 -->
    <BaseCard v-else class="text-center py-8">
      <BaseIcon name="calculator" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Bereit für die Berechnung</h3>
      <p class="text-gray-600">
        Geben Sie Ihre Daten ein, um sofort die Ergebnisse zu sehen.
      </p>
    </BaseCard>

    <!-- 性能统计（开发模式） -->
    <div v-if="showPerformanceStats && performanceStats" class="mt-4 text-xs text-gray-500">
      <details class="cursor-pointer">
        <summary class="hover:text-gray-700">Performance-Statistiken</summary>
        <div class="mt-2 space-y-1 pl-4">
          <div>Berechnungen: {{ performanceStats.totalCalculations }}</div>
          <div>Cache-Größe: {{ performanceStats.cacheSize }}</div>
          <div>Cache-Trefferquote: {{ (performanceStats.cacheHitRate * 100).toFixed(1) }}%</div>
          <div v-if="performanceStats.lastCalculated">
            Letzte Berechnung: {{ performanceStats.lastCalculated.toLocaleString('de-DE') }}
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import { useRealtimeResultsDisplay } from '@/composables/useRealtimeCalculation'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import type { CalculationResult } from '@/types/calculator'

interface Props {
  displayResults: CalculationResult | Partial<CalculationResult> | null
  isCalculating?: boolean
  isPreviewMode?: boolean
  error?: string | null
  lastCalculated?: Date | null
  calculationProgress?: number
  performanceStats?: {
    totalCalculations: number
    cacheHitRate: number
    lastCalculated: Date | null
    cacheSize: number
  } | null
  showProgress?: boolean
  showPerformanceStats?: boolean
}

interface Emits {
  (e: 'retry'): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  isCalculating: false,
  isPreviewMode: false,
  error: null,
  lastCalculated: null,
  calculationProgress: 0,
  performanceStats: null,
  showProgress: true,
  showPerformanceStats: false
})

const emit = defineEmits<Emits>()

// 使用结果显示组合函数
const { showAnimation, resultsDiff, animateResultChange } = useRealtimeResultsDisplay()

// 监听结果变化以触发动画
watch(
  () => props.displayResults,
  (newResults) => {
    animateResultChange(newResults as CalculationResult | null)
  },
  { deep: true }
)

// 格式化相对时间
const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  
  if (diffSeconds < 10) return 'gerade eben'
  if (diffSeconds < 60) return `vor ${diffSeconds}s`
  if (diffMinutes < 60) return `vor ${diffMinutes}m`
  
  return date.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped>
.realtime-results {
  @apply transition-all duration-300;
}

/* 结果变化动画 */
@keyframes result-change {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.animate-result-change {
  animation: result-change 0.3s ease-in-out;
}

/* 预览模式样式 */
.preview-mode {
  @apply border-dashed border-2 border-blue-300 bg-blue-50;
}

/* 计算中样式 */
.calculating {
  @apply opacity-75 pointer-events-none;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .realtime-results .grid-cols-3 {
    @apply grid-cols-1;
  }
}
</style>
