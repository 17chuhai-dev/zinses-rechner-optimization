<!--
  错误回退组件
  为不同类型的错误提供专门的回退界面
-->

<template>
  <div :class="fallbackClasses" :data-error-type="error?.type">
    <!-- 计算器错误回退 -->
    <div v-if="isCalculatorError" class="calculator-error-fallback">
      <div class="text-center mb-6">
        <CalculatorIcon class="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Rechner temporär nicht verfügbar
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Der Rechner kann momentan nicht verwendet werden. Sie können eine einfache Berechnung manuell durchführen.
        </p>
      </div>

      <!-- 简单计算器回退 -->
      <div class="simple-calculator bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 dark:text-white mb-3">
          Einfache Zinsberechnung
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kapital (€)
            </label>
            <input
              v-model.number="simpleCalc.principal"
              type="number"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="10000"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zinssatz (%)
            </label>
            <input
              v-model.number="simpleCalc.rate"
              type="number"
              step="0.1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="3.5"
            />
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Laufzeit (Jahre)
          </label>
          <input
            v-model.number="simpleCalc.years"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="5"
          />
        </div>
        <BaseButton
          @click="calculateSimple"
          variant="primary"
          class="w-full mb-4"
        >
          Berechnen
        </BaseButton>
        <div v-if="simpleResult" class="result bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div class="text-sm text-blue-800 dark:text-blue-200">
            <div>Endkapital: <strong>{{ formatCurrency(simpleResult.total) }}</strong></div>
            <div>Zinserträge: <strong>{{ formatCurrency(simpleResult.interest) }}</strong></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表错误回退 -->
    <div v-else-if="isChartError" class="chart-error-fallback">
      <div class="text-center mb-6">
        <ChartBarIcon class="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Diagramm kann nicht angezeigt werden
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Das Diagramm kann momentan nicht geladen werden. Hier sind die Daten in Tabellenform:
        </p>
      </div>

      <!-- 数据表格回退 -->
      <div class="data-table-fallback">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Jahr
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kapital
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Zinsen
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gesamt
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(row, index) in tableData"
                :key="index"
                class="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ row.year }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatCurrency(row.principal) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatCurrency(row.interest) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatCurrency(row.total) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 网络错误回退 -->
    <div v-else-if="isNetworkError" class="network-error-fallback">
      <div class="text-center mb-6">
        <WifiIcon class="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Verbindungsproblem
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Es besteht keine Internetverbindung. Die Anwendung funktioniert im Offline-Modus mit eingeschränkten Funktionen.
        </p>
      </div>

      <!-- 离线功能提示 -->
      <div class="offline-features bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
        <h4 class="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Verfügbare Offline-Funktionen:
        </h4>
        <ul class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Grundlegende Berechnungen</li>
          <li>• Lokale Datenspeicherung</li>
          <li>• Bereits geladene Inhalte</li>
          <li>• Export als PDF (eingeschränkt)</li>
        </ul>
      </div>
    </div>

    <!-- 通用错误回退 -->
    <div v-else class="generic-error-fallback">
      <div class="text-center mb-6">
        <ExclamationTriangleIcon class="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Inhalt nicht verfügbar
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Dieser Bereich kann momentan nicht angezeigt werden.
        </p>
      </div>

      <!-- 替代操作 -->
      <div class="alternative-actions">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseButton
            variant="outline"
            @click="$emit('navigate', '/calculator')"
            class="flex items-center justify-center"
          >
            <CalculatorIcon class="w-4 h-4 mr-2" />
            Zum Rechner
          </BaseButton>
          <BaseButton
            variant="outline"
            @click="$emit('navigate', '/help')"
            class="flex items-center justify-center"
          >
            <QuestionMarkCircleIcon class="w-4 h-4 mr-2" />
            Hilfe
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- 通用操作按钮 -->
    <div class="fallback-actions mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      <BaseButton
        v-if="canRetry"
        variant="primary"
        @click="$emit('retry')"
        :disabled="isRetrying"
      >
        <ArrowPathIcon class="w-4 h-4 mr-2" />
        {{ isRetrying ? 'Wird wiederholt...' : 'Erneut versuchen' }}
      </BaseButton>

      <BaseButton
        variant="outline"
        @click="$emit('reset')"
      >
        <HomeIcon class="w-4 h-4 mr-2" />
        Zurücksetzen
      </BaseButton>

      <BaseButton
        v-if="canReport"
        variant="ghost"
        @click="$emit('report')"
        :disabled="isReporting"
      >
        <BugAntIcon class="w-4 h-4 mr-2" />
        Problem melden
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CalculatorIcon,
  ChartBarIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  BugAntIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import { ErrorType, type ErrorInfo } from '@/services/ErrorHandlingService'

// Props
interface Props {
  error: ErrorInfo | null
  canRetry?: boolean
  canReport?: boolean
  isRetrying?: boolean
  isReporting?: boolean
  tableData?: Array<{
    year: number
    principal: number
    interest: number
    total: number
  }>
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  canRetry: true,
  canReport: true,
  isRetrying: false,
  isReporting: false,
  tableData: () => []
})

// Emits
interface Emits {
  retry: []
  reset: []
  report: []
  navigate: [path: string]
}

defineEmits<Emits>()

// 响应式数据
const simpleCalc = ref({
  principal: 10000,
  rate: 3.5,
  years: 5
})

const simpleResult = ref<{
  total: number
  interest: number
} | null>(null)

// 计算属性
const fallbackClasses = computed(() => {
  const classes = ['error-fallback', 'p-6', 'max-w-4xl', 'mx-auto']
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const isCalculatorError = computed(() => {
  return props.error?.type === ErrorType.CALCULATION_ERROR ||
         props.error?.context?.componentName?.includes('Calculator')
})

const isChartError = computed(() => {
  return props.error?.context?.componentName?.includes('Chart') ||
         props.error?.context?.componentName?.includes('Graph')
})

const isNetworkError = computed(() => {
  return props.error?.type === ErrorType.NETWORK_ERROR
})

// 方法
const calculateSimple = () => {
  const { principal, rate, years } = simpleCalc.value
  
  if (!principal || !rate || !years) {
    return
  }
  
  // 简单复利计算
  const total = principal * Math.pow(1 + rate / 100, years)
  const interest = total - principal
  
  simpleResult.value = {
    total: Math.round(total * 100) / 100,
    interest: Math.round(interest * 100) / 100
  }
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}
</script>

<style scoped>
.error-fallback {
  @apply bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700;
}

.simple-calculator input {
  @apply bg-white dark:bg-gray-800 text-gray-900 dark:text-white;
}

.simple-calculator input:focus {
  @apply outline-none ring-2 ring-blue-500 border-blue-500;
}

.data-table-fallback {
  @apply bg-white dark:bg-gray-900 rounded-lg overflow-hidden;
}

.offline-features {
  @apply border border-yellow-200 dark:border-yellow-800;
}

.alternative-actions {
  @apply max-w-md mx-auto;
}

.fallback-actions {
  @apply border-t border-gray-200 dark:border-gray-700 pt-6;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .error-fallback {
    @apply p-4;
  }
  
  .simple-calculator .grid {
    @apply grid-cols-1;
  }
  
  .fallback-actions {
    @apply flex-col;
  }
  
  .fallback-actions button {
    @apply w-full;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .error-fallback {
  @apply border-4 border-current;
}

:global(.high-contrast) .simple-calculator {
  @apply border-2 border-current;
}

/* 大字体模式支持 */
:global(.large-text) .error-fallback {
  @apply text-lg;
}

:global(.large-text) .error-fallback h3 {
  @apply text-xl;
}

/* 暗色模式支持 */
:global(.theme-dark) .simple-calculator input {
  @apply border-gray-600 bg-gray-800;
}

:global(.theme-dark) .data-table-fallback {
  @apply bg-gray-900;
}

/* 打印样式 */
@media print {
  .fallback-actions {
    @apply hidden;
  }
  
  .error-fallback {
    @apply bg-white border-black text-black;
  }
}

/* 动画效果 */
.error-fallback {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 无障碍增强 */
.simple-calculator input:focus,
.fallback-actions button:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

:global(.theme-dark) .simple-calculator input:focus,
:global(.theme-dark) .fallback-actions button:focus {
  @apply ring-offset-gray-900;
}

/* 错误类型特定样式 */
.error-fallback[data-error-type="calculation_error"] {
  @apply border-orange-200 dark:border-orange-800;
}

.error-fallback[data-error-type="network_error"] {
  @apply border-red-200 dark:border-red-800;
}

.error-fallback[data-error-type="component_error"] {
  @apply border-purple-200 dark:border-purple-800;
}
</style>
