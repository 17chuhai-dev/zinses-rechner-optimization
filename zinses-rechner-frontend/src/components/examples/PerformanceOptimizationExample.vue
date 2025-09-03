<!--
  性能优化示例组件
  展示智能缓存、增量计算、任务调度等性能优化功能
-->

<template>
  <div class="performance-optimization-example">
    <div class="example-header">
      <h1>计算性能优化示例</h1>
      <p>展示智能缓存、增量计算、任务调度等性能优化功能</p>
    </div>

    <!-- 性能监控 -->
    <PerformanceMonitor
      :performance-metrics="performanceMetrics"
      :get-cache-stats="getCacheStats"
      :get-scheduler-stats="getSchedulerStats"
      :clear-cache="clearCache"
      :optimize-memory="optimizeMemory"
      @clear-cache="handleClearCache"
      @optimize-memory="handleOptimizeMemory"
      @export-stats="handleExportStats"
      @reset-stats="handleResetStats"
    />

    <!-- 计算器表单 -->
    <div class="calculator-section">
      <h2>优化计算器</h2>

      <div class="calculator-grid">
        <!-- 输入表单 -->
        <div class="input-form">
          <h3>计算参数</h3>

          <div class="form-grid">
            <div class="form-group">
              <label>初始金额 (€)</label>
              <input
                v-model.number="calculationInput.initialAmount"
                type="number"
                min="0"
                step="1000"
                class="form-input"
                @input="handleInputChange"
              />
            </div>

            <div class="form-group">
              <label>月度投入 (€)</label>
              <input
                v-model.number="calculationInput.monthlyAmount"
                type="number"
                min="0"
                step="100"
                class="form-input"
                @input="handleInputChange"
              />
            </div>

            <div class="form-group">
              <label>年利率 (%)</label>
              <input
                v-model.number="calculationInput.annualRate"
                type="number"
                min="0"
                max="20"
                step="0.1"
                class="form-input"
                @input="handleInputChange"
              />
            </div>

            <div class="form-group">
              <label>投资年限</label>
              <input
                v-model.number="calculationInput.investmentYears"
                type="number"
                min="1"
                max="50"
                step="1"
                class="form-input"
                @input="handleInputChange"
              />
            </div>
          </div>

          <!-- 优化选项 -->
          <div class="optimization-options">
            <h4>优化选项</h4>
            <div class="options-grid">
              <label class="option-item">
                <input
                  v-model="optimizationConfig.enableCache"
                  type="checkbox"
                  @change="updateConfig"
                />
                <span>启用缓存</span>
              </label>

              <label class="option-item">
                <input
                  v-model="optimizationConfig.enableIncremental"
                  type="checkbox"
                  @change="updateConfig"
                />
                <span>增量计算</span>
              </label>

              <label class="option-item">
                <input
                  v-model="optimizationConfig.enableScheduling"
                  type="checkbox"
                  @change="updateConfig"
                />
                <span>任务调度</span>
              </label>

              <label class="option-item">
                <input
                  v-model="optimizationConfig.preloadCommonScenarios"
                  type="checkbox"
                  @change="updateConfig"
                />
                <span>预加载场景</span>
              </label>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button
              @click="calculateNow"
              :disabled="isCalculating"
              class="btn btn-primary"
            >
              <Icon v-if="isCalculating" name="loader" size="16" class="animate-spin" />
              <Icon v-else name="calculator" size="16" />
              {{ isCalculating ? '计算中...' : '立即计算' }}
            </button>

            <button @click="batchCalculate" class="btn btn-secondary">
              <Icon name="layers" size="16" />
              批量计算
            </button>

            <button @click="preloadScenarios" class="btn btn-secondary">
              <Icon name="download" size="16" />
              预加载场景
            </button>
          </div>
        </div>

        <!-- 结果显示 -->
        <div class="results-display">
          <h3>计算结果</h3>

          <div v-if="currentResult" class="result-card">
            <div class="result-header">
              <div class="result-title">最终金额</div>
              <div class="result-value">{{ formatCurrency(currentResult.finalAmount) }}</div>
            </div>

            <div class="result-details">
              <div class="detail-item">
                <span class="detail-label">总投入</span>
                <span class="detail-value">{{ formatCurrency(currentResult.totalContributions) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">总利息</span>
                <span class="detail-value">{{ formatCurrency(currentResult.totalInterest) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">有效利率</span>
                <span class="detail-value">{{ currentResult.effectiveRate.toFixed(2) }}%</span>
              </div>
            </div>

            <!-- 性能指标 -->
            <div class="performance-indicators">
              <div class="indicator">
                <Icon name="clock" size="14" />
                <span>{{ currentResult.metadata.calculationTime.toFixed(1) }}ms</span>
              </div>
              <div class="indicator" v-if="currentResult.metadata.cacheHit">
                <Icon name="database" size="14" />
                <span>缓存命中</span>
              </div>
              <div class="indicator" v-if="currentResult.metadata.incrementalUpdate">
                <Icon name="zap" size="14" />
                <span>增量更新</span>
              </div>
            </div>
          </div>

          <div v-else-if="error" class="error-card">
            <Icon name="alert-circle" size="20" />
            <span>{{ error }}</span>
          </div>

          <div v-else class="placeholder-card">
            <Icon name="calculator" size="48" />
            <p>输入参数后开始计算</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 性能对比 -->
    <div class="performance-comparison">
      <h2>性能对比</h2>

      <div class="comparison-grid">
        <div class="comparison-card">
          <h3>传统计算</h3>
          <div class="comparison-stats">
            <div class="stat">
              <span class="stat-label">平均响应时间</span>
              <span class="stat-value">{{ traditionalStats.averageTime }}ms</span>
            </div>
            <div class="stat">
              <span class="stat-label">计算次数</span>
              <span class="stat-value">{{ traditionalStats.calculations }}</span>
            </div>
          </div>
          <button @click="runTraditionalCalculation" class="btn btn-outline">
            运行传统计算
          </button>
        </div>

        <div class="comparison-card optimized">
          <h3>优化计算</h3>
          <div class="comparison-stats">
            <div class="stat">
              <span class="stat-label">平均响应时间</span>
              <span class="stat-value">{{ Math.round(performanceMetrics.averageResponseTime) }}ms</span>
            </div>
            <div class="stat">
              <span class="stat-label">缓存命中率</span>
              <span class="stat-value">{{ Math.round(performanceMetrics.cacheHitRate) }}%</span>
            </div>
            <div class="stat">
              <span class="stat-label">增量更新</span>
              <span class="stat-value">{{ performanceMetrics.incrementalUpdates }}</span>
            </div>
          </div>
          <div class="performance-improvement">
            <Icon name="trending-up" size="16" />
            <span>性能提升 {{ getPerformanceImprovement() }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 计算历史 -->
    <div class="calculation-history">
      <h2>计算历史</h2>

      <div class="history-list">
        <div
          v-for="(result, index) in calculationHistory.slice(-10)"
          :key="index"
          class="history-item"
        >
          <div class="history-info">
            <div class="history-amount">{{ formatCurrency(result.finalAmount) }}</div>
            <div class="history-meta">
              <span>{{ result.metadata.calculationTime.toFixed(1) }}ms</span>
              <span v-if="result.metadata.cacheHit" class="cache-hit">缓存</span>
              <span v-if="result.metadata.incrementalUpdate" class="incremental">增量</span>
            </div>
          </div>
          <div class="history-time">
            {{ formatTime(Date.now() - (index * 1000)) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useOptimizedCalculation, type OptimizedCalculationConfig } from '@/composables/useOptimizedCalculation'
import PerformanceMonitor from '@/components/performance/PerformanceMonitor.vue'
import Icon from '@/components/ui/BaseIcon.vue'
import { TaskPriority } from '@/utils/performance/CalculationScheduler'

// 响应式数据
const calculationInput = reactive({
  initialAmount: 10000,
  monthlyAmount: 500,
  annualRate: 5.0,
  investmentYears: 10
})

const optimizationConfig = reactive<OptimizedCalculationConfig>({
  enableCache: true,
  enableIncremental: true,
  enableScheduling: true,
  debounceMs: 300,
  priority: TaskPriority.NORMAL,
  maxRetries: 2,
  timeout: 10000,
  preloadCommonScenarios: false
})

const traditionalStats = reactive({
  averageTime: 0,
  calculations: 0,
  totalTime: 0
})

// 使用优化计算
const {
  isCalculating,
  currentResult,
  error,
  calculationHistory,
  performanceMetrics,
  calculate,
  debouncedCalculate,
  batchCalculate: optimizedBatchCalculate,
  clearCache,
  optimizeMemory,
  preloadCommonScenarios,
  getCacheStats,
  getSchedulerStats
} = useOptimizedCalculation(optimizationConfig)

// 方法
const handleInputChange = () => {
  debouncedCalculate(calculationInput)
}

const calculateNow = async () => {
  await calculate(calculationInput, TaskPriority.HIGH)
}

const batchCalculate = async () => {
  const scenarios = [
    { ...calculationInput, annualRate: 3 },
    { ...calculationInput, annualRate: 5 },
    { ...calculationInput, annualRate: 7 },
    { ...calculationInput, investmentYears: 15 },
    { ...calculationInput, investmentYears: 20 }
  ]

  await optimizedBatchCalculate(scenarios)
}

const preloadScenarios = async () => {
  await preloadCommonScenarios()
}

const updateConfig = () => {
  // 配置更新会自动应用到useOptimizedCalculation
}

const runTraditionalCalculation = async () => {
  const startTime = performance.now()

  // 模拟传统计算（无优化）
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))

  const endTime = performance.now()
  const calculationTime = endTime - startTime

  traditionalStats.totalTime += calculationTime
  traditionalStats.calculations++
  traditionalStats.averageTime = traditionalStats.totalTime / traditionalStats.calculations
}

const getPerformanceImprovement = () => {
  if (traditionalStats.averageTime === 0) return 0

  const improvement = ((traditionalStats.averageTime - performanceMetrics.value.averageResponseTime) / traditionalStats.averageTime) * 100
  return Math.max(0, Math.round(improvement))
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  return `${hours}小时前`
}

// 事件处理
const handleClearCache = () => {
  clearCache()
}

const handleOptimizeMemory = () => {
  optimizeMemory()
}

const handleExportStats = () => {
  console.log('导出统计数据')
}

const handleResetStats = () => {
  traditionalStats.averageTime = 0
  traditionalStats.calculations = 0
  traditionalStats.totalTime = 0
}

// 监听器
watch(() => optimizationConfig, (newConfig) => {
  // 配置变化时重新计算
  if (currentResult.value) {
    debouncedCalculate(calculationInput)
  }
}, { deep: true })

// 初始计算
calculateNow()
</script>

<style scoped>
.performance-optimization-example {
  @apply max-w-7xl mx-auto p-6 space-y-8;
}

.example-header {
  @apply text-center mb-8;
}

.example-header h1 {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.example-header p {
  @apply text-lg text-gray-600;
}

/* 计算器区域 */
.calculator-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.calculator-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.calculator-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-8;
}

/* 输入表单 */
.input-form {
  @apply space-y-6;
}

.input-form h3 {
  @apply text-lg font-medium text-gray-800 mb-4;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply transition-colors;
}

/* 优化选项 */
.optimization-options {
  @apply bg-gray-50 rounded-lg p-4;
}

.optimization-options h4 {
  @apply text-sm font-medium text-gray-800 mb-3;
}

.options-grid {
  @apply grid grid-cols-2 gap-3;
}

.option-item {
  @apply flex items-center gap-2 text-sm text-gray-700 cursor-pointer;
}

.option-item input[type="checkbox"] {
  @apply rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

/* 操作按钮 */
.action-buttons {
  @apply flex flex-wrap gap-3;
}

.btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
  @apply disabled:bg-gray-400 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500;
}

/* 结果显示 */
.results-display {
  @apply space-y-4;
}

.results-display h3 {
  @apply text-lg font-medium text-gray-800;
}

.result-card {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200;
}

.result-header {
  @apply text-center mb-4;
}

.result-title {
  @apply text-sm text-gray-600 mb-1;
}

.result-value {
  @apply text-3xl font-bold text-blue-900;
}

.result-details {
  @apply space-y-2 mb-4;
}

.detail-item {
  @apply flex justify-between items-center;
}

.detail-label {
  @apply text-sm text-gray-600;
}

.detail-value {
  @apply text-sm font-semibold text-gray-900;
}

.performance-indicators {
  @apply flex flex-wrap gap-2 pt-4 border-t border-blue-200;
}

.indicator {
  @apply flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs;
}

.error-card {
  @apply flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700;
}

.placeholder-card {
  @apply flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-gray-500;
}

.placeholder-card p {
  @apply mt-2 text-sm;
}

/* 性能对比 */
.performance-comparison {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.performance-comparison h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.comparison-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.comparison-card {
  @apply bg-gray-50 rounded-lg p-6 border border-gray-200;
}

.comparison-card.optimized {
  @apply bg-green-50 border-green-200;
}

.comparison-card h3 {
  @apply text-lg font-medium text-gray-800 mb-4;
}

.comparison-stats {
  @apply space-y-3 mb-4;
}

.stat {
  @apply flex justify-between items-center;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply text-lg font-semibold text-gray-900;
}

.performance-improvement {
  @apply flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm font-medium;
}

/* 计算历史 */
.calculation-history {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.calculation-history h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.history-list {
  @apply space-y-3;
}

.history-item {
  @apply flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200;
}

.history-info {
  @apply flex-1;
}

.history-amount {
  @apply font-semibold text-gray-900;
}

.history-meta {
  @apply flex gap-2 mt-1;
}

.history-meta span {
  @apply text-xs text-gray-500;
}

.cache-hit {
  @apply bg-blue-100 text-blue-700 px-2 py-1 rounded-full;
}

.incremental {
  @apply bg-green-100 text-green-700 px-2 py-1 rounded-full;
}

.history-time {
  @apply text-xs text-gray-500;
}

/* 动画 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .calculator-grid {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .form-grid {
    @apply grid-cols-1;
  }

  .options-grid {
    @apply grid-cols-1;
  }

  .comparison-grid {
    @apply grid-cols-1;
  }

  .action-buttons {
    @apply flex-col;
  }

  .btn {
    @apply w-full justify-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .calculator-section,
  .performance-comparison,
  .calculation-history {
    @apply bg-gray-800 border-gray-700;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .calculator-section h2,
  .performance-comparison h2,
  .calculation-history h2,
  .input-form h3,
  .comparison-card h3 {
    @apply text-gray-100;
  }

  .form-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .optimization-options {
    @apply bg-gray-700;
  }

  .result-card {
    @apply bg-gradient-to-r from-gray-700 to-gray-600 border-gray-600;
  }

  .result-value {
    @apply text-gray-100;
  }

  .comparison-card {
    @apply bg-gray-700 border-gray-600;
  }

  .history-item {
    @apply bg-gray-700 border-gray-600;
  }

  .history-amount {
    @apply text-gray-100;
  }
}
</style>
