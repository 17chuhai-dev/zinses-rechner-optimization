<!--
  实时计算器包装组件
  整合所有实时计算功能，提供完整的实时计算反馈体验
-->

<template>
  <div class="realtime-calculator-wrapper" :class="{ 'wrapper-calculating': isCalculating }">
    <!-- 计算器头部 -->
    <div class="calculator-header">
      <div class="header-content">
        <h2 class="calculator-title">{{ calculatorTitle }}</h2>
        <div class="header-status">
          <!-- 实时状态指示器 -->
          <div class="status-indicators">
            <div class="status-item" :class="{ 'active': isCalculating }">
              <div class="status-dot calculating"></div>
              <span class="status-label">{{ $t('realtime.calculating') }}</span>
            </div>
            <div class="status-item" :class="{ 'active': hasValidationErrors }">
              <div class="status-dot error"></div>
              <span class="status-label">{{ $t('realtime.errors') }}</span>
            </div>
            <div class="status-item" :class="{ 'active': isOptimized }">
              <div class="status-dot optimized"></div>
              <span class="status-label">{{ $t('realtime.optimized') }}</span>
            </div>
          </div>

          <!-- 性能指标 -->
          <div v-if="showPerformanceMetrics" class="performance-metrics">
            <div class="metric-item">
              <span class="metric-label">{{ $t('performance.cacheHitRate') }}:</span>
              <span class="metric-value">{{ Math.round(cacheHitRate) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{{ $t('performance.avgTime') }}:</span>
              <span class="metric-value">{{ Math.round(averageComputationTime) }}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="calculator-content">
      <!-- 输入区域 -->
      <div class="input-section">
        <slot name="inputs" :register-field="registerField" :update-value="updateValue">
          <!-- 默认输入表单 -->
          <div class="default-inputs">
            <p class="input-placeholder">{{ $t('realtime.inputPlaceholder') }}</p>
          </div>
        </slot>

        <!-- 输入验证处理器 -->
        <InputValidationHandler
          :errors="validationErrors"
          :warnings="validationWarnings"
          :suggestions="validationSuggestions"
          :realtime-feedback="realtimeFeedback"
          :validation-state="validationState"
          :field-labels="fieldLabels"
          @apply-suggestion="handleApplySuggestion"
          @apply-suggestion-action="handleApplySuggestionAction"
        />
      </div>

      <!-- 结果区域 -->
      <div class="results-section">
        <!-- 实时结果显示 -->
        <RealtimeResultsDisplay
          :results="calculationResults"
          :preview-results="previewResults"
          :is-calculating="isCalculating"
          :is-preview-mode="isPreviewMode"
          :calculation-progress="calculationProgress"
          :calculator-name="calculatorTitle"
          :last-calculated="lastCalculated"
          :error="calculationError"
          :results-diff="resultsDiff"
          @retry="handleRetryCalculation"
        />

        <!-- 加载指示器 -->
        <LoadingIndicator
          v-if="showLoadingOverlay"
          :state="loadingState"
          :progress="calculationProgress"
          :calculator-name="calculatorTitle"
          :duration="calculationDuration"
          :cache-status="cacheStatus"
          :worker-info="workerInfo"
          :show-progress="true"
          :show-details="showLoadingDetails"
          :show-cancel-button="true"
          @cancel="handleCancelCalculation"
          @hidden="showLoadingOverlay = false"
        />
      </div>
    </div>

    <!-- 调试面板 -->
    <div v-if="showDebugPanel" class="debug-panel">
      <div class="debug-header">
        <h3>{{ $t('debug.title') }}</h3>
        <button class="debug-toggle" @click="debugExpanded = !debugExpanded">
          {{ debugExpanded ? $t('debug.collapse') : $t('debug.expand') }}
        </button>
      </div>
      
      <Transition name="debug-expand">
        <div v-if="debugExpanded" class="debug-content">
          <div class="debug-section">
            <h4>{{ $t('debug.inputValues') }}</h4>
            <pre class="debug-data">{{ JSON.stringify(inputValues, null, 2) }}</pre>
          </div>
          
          <div class="debug-section">
            <h4>{{ $t('debug.cacheStats') }}</h4>
            <div class="debug-stats">
              <div class="stat-item">
                <span>{{ $t('debug.cacheSize') }}:</span>
                <span>{{ cacheSize }}</span>
              </div>
              <div class="stat-item">
                <span>{{ $t('debug.hitRate') }}:</span>
                <span>{{ Math.round(cacheHitRate) }}%</span>
              </div>
              <div class="stat-item">
                <span>{{ $t('debug.memoryUsage') }}:</span>
                <span>{{ Math.round(memoryPressure) }}%</span>
              </div>
            </div>
          </div>

          <div class="debug-section">
            <h4>{{ $t('debug.optimizationSuggestions') }}</h4>
            <ul class="debug-suggestions">
              <li v-for="suggestion in optimizationSuggestions" :key="suggestion">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealtimeCalculation } from '@/composables/useRealtimeCalculation'
import { useInputListener } from '@/composables/useInputListener'
import { useCalculationOptimizer } from '@/composables/useCalculationOptimizer'
import RealtimeResultsDisplay from './RealtimeResultsDisplay.vue'
import InputValidationHandler from './InputValidationHandler.vue'
import LoadingIndicator from './LoadingIndicator.vue'
import type { CalculationResult } from '@/types/calculator'
import type { ValidationError, ValidationWarning, ValidationSuggestion, RealtimeFeedback } from './InputValidationHandler.vue'

// Props定义
interface Props {
  calculatorTitle?: string
  calculatorType: string
  initialInputs?: Record<string, any>
  fieldLabels?: Record<string, string>
  showPerformanceMetrics?: boolean
  showLoadingDetails?: boolean
  showDebugPanel?: boolean
  enableOptimization?: boolean
  enablePreview?: boolean
  debounceMs?: number
  throttleMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  calculatorTitle: 'Rechner',
  showPerformanceMetrics: false,
  showLoadingDetails: false,
  showDebugPanel: false,
  enableOptimization: true,
  enablePreview: true,
  debounceMs: 300,
  throttleMs: 100
})

// Emits定义
interface Emits {
  calculationComplete: [result: CalculationResult]
  calculationError: [error: string]
  inputChange: [field: string, value: any]
  validationError: [errors: ValidationError[]]
}

const emit = defineEmits<Emits>()

// 组合函数
const { t } = useI18n()

// 实时计算
const {
  isCalculating,
  calculationProgress,
  calculationResults,
  calculationError,
  lastCalculated,
  calculate,
  cancelCalculation
} = useRealtimeCalculation({
  debounceMs: props.debounceMs,
  enableWorkers: true,
  enableCaching: props.enableOptimization
})

// 输入监听
const {
  values: inputValues,
  validationStates,
  hasChanges,
  isAllValid,
  registerField,
  updateValue,
  onInputChange
} = useInputListener({
  debounceMs: props.debounceMs,
  throttleMs: props.throttleMs,
  validateOnChange: true,
  trackHistory: true
})

// 计算优化
const {
  cacheHitRate,
  isOptimized,
  memoryPressure,
  metrics,
  optimizedCalculate,
  getOptimizationSuggestions
} = useCalculationOptimizer({
  maxCacheSize: 100,
  enableIncrementalCalculation: true,
  enablePriorityQueue: true,
  debounceMs: props.debounceMs
})

// 响应式数据
const isPreviewMode = ref(false)
const previewResults = ref<Partial<CalculationResult> | null>(null)
const showLoadingOverlay = ref(false)
const debugExpanded = ref(false)
const calculationDuration = ref(0)
const resultsDiff = ref<any>(null)

// 验证状态
const validationErrors = ref<ValidationError[]>([])
const validationWarnings = ref<ValidationWarning[]>([])
const validationSuggestions = ref<ValidationSuggestion[]>([])
const realtimeFeedback = ref<RealtimeFeedback[]>([])

// 计算属性
const hasValidationErrors = computed(() => validationErrors.value.length > 0)

const validationState = computed(() => {
  if (isCalculating.value) return 'validating'
  if (hasValidationErrors.value) return 'invalid'
  if (validationWarnings.value.length > 0) return 'warning'
  return 'valid'
})

const loadingState = computed(() => {
  if (isCalculating.value) return 'calculating'
  if (calculationError.value) return 'error'
  if (calculationResults.value) return 'completed'
  return 'initializing'
})

const averageComputationTime = computed(() => metrics.value.averageComputationTime)
const cacheSize = computed(() => metrics.value.totalCalculations)

const cacheStatus = computed(() => ({
  hit: cacheHitRate.value > 50,
  key: `${props.calculatorType}_cache`
}))

const workerInfo = computed(() => ({
  id: 'worker_1',
  activeRequests: isCalculating.value ? 1 : 0
}))

const optimizationSuggestions = computed(() => getOptimizationSuggestions())

// 方法
const handleInputChange = async (field: string, value: any) => {
  updateValue(field, value)
  emit('inputChange', field, value)

  // 触发实时计算
  if (props.enablePreview && isAllValid.value) {
    isPreviewMode.value = true
    try {
      const result = await optimizedCalculate(
        props.calculatorType,
        inputValues.value,
        (inputs) => calculate(inputs),
        { useCache: true, priority: 1 }
      )
      previewResults.value = result
    } catch (error) {
      console.warn('预览计算失败:', error)
    } finally {
      isPreviewMode.value = false
    }
  }
}

const handleApplySuggestion = (error: ValidationError) => {
  if (error.suggestion) {
    updateValue(error.field, error.suggestion.value)
  }
}

const handleApplySuggestionAction = (suggestion: ValidationSuggestion) => {
  // 处理建议操作
  console.log('应用建议:', suggestion)
}

const handleRetryCalculation = async () => {
  if (isAllValid.value) {
    showLoadingOverlay.value = true
    try {
      const result = await calculate(inputValues.value)
      emit('calculationComplete', result)
    } catch (error) {
      emit('calculationError', error as string)
    } finally {
      showLoadingOverlay.value = false
    }
  }
}

const handleCancelCalculation = () => {
  cancelCalculation()
  showLoadingOverlay.value = false
}

// 监听器
watch(inputValues, (newValues, oldValues) => {
  // 计算结果差异
  if (calculationResults.value && oldValues) {
    // 这里可以实现结果差异计算逻辑
    resultsDiff.value = null // 简化实现
  }
}, { deep: true })

// 监听输入变化
onInputChange((event) => {
  handleInputChange(event.field, event.value)
})

// 提供给子组件的上下文
provide('calculatorContext', {
  registerField,
  updateValue,
  inputValues,
  validationStates,
  isCalculating,
  calculatorType: props.calculatorType
})

// 生命周期
onMounted(() => {
  // 初始化输入值
  if (props.initialInputs) {
    Object.entries(props.initialInputs).forEach(([key, value]) => {
      updateValue(key, value, false)
    })
  }
})

onUnmounted(() => {
  cancelCalculation()
})
</script>

<style scoped>
.realtime-calculator-wrapper {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
  transition: all 0.3s ease;
}

.wrapper-calculating {
  @apply border-blue-300 shadow-md;
}

/* 头部样式 */
.calculator-header {
  @apply border-b border-gray-200 p-4;
}

.header-content {
  @apply flex justify-between items-center;
}

.calculator-title {
  @apply text-xl font-semibold text-gray-900 m-0;
}

.header-status {
  @apply flex items-center gap-4;
}

.status-indicators {
  @apply flex items-center gap-3;
}

.status-item {
  @apply flex items-center gap-1 text-sm text-gray-500;
  transition: all 0.2s ease;
}

.status-item.active {
  @apply text-gray-900;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.status-dot.calculating {
  @apply bg-blue-500;
  animation: pulse 2s infinite;
}

.status-dot.error {
  @apply bg-red-500;
}

.status-dot.optimized {
  @apply bg-green-500;
}

.performance-metrics {
  @apply flex items-center gap-3 text-xs text-gray-600;
}

.metric-item {
  @apply flex items-center gap-1;
}

.metric-label {
  @apply font-medium;
}

.metric-value {
  @apply font-mono;
}

/* 内容样式 */
.calculator-content {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6 p-6;
}

.input-section,
.results-section {
  @apply space-y-4;
}

.input-placeholder {
  @apply text-center text-gray-500 py-8;
}

/* 调试面板 */
.debug-panel {
  @apply border-t border-gray-200 bg-gray-50 p-4;
}

.debug-header {
  @apply flex justify-between items-center mb-3;
}

.debug-header h3 {
  @apply text-sm font-medium text-gray-700 m-0;
}

.debug-toggle {
  @apply text-xs text-blue-600 hover:text-blue-800;
}

.debug-content {
  @apply space-y-4;
}

.debug-section h4 {
  @apply text-xs font-medium text-gray-600 mb-2 m-0;
}

.debug-data {
  @apply text-xs bg-white p-2 rounded border font-mono overflow-auto max-h-32;
}

.debug-stats {
  @apply grid grid-cols-3 gap-2;
}

.stat-item {
  @apply flex justify-between text-xs bg-white p-2 rounded border;
}

.debug-suggestions {
  @apply text-xs space-y-1 list-disc list-inside text-gray-600;
}

/* 过渡动画 */
.debug-expand-enter-active,
.debug-expand-leave-active {
  transition: all 0.3s ease;
}

.debug-expand-enter-from,
.debug-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.debug-expand-enter-to,
.debug-expand-leave-from {
  opacity: 1;
  max-height: 300px;
  transform: translateY(0);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
