<!--
  即时结果显示组件使用示例
  展示InstantResultsDisplay组件的各种使用场景和功能
-->

<template>
  <div class="instant-results-example">
    <div class="example-header">
      <h1>即时结果显示组件示例</h1>
      <p>展示实时计算结果、动画过渡效果、数据格式化等功能</p>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <h2>控制面板</h2>

      <div class="controls-grid">
        <div class="control-group">
          <label>初始金额 (€)</label>
          <input
            v-model.number="inputs.initialAmount"
            type="number"
            min="0"
            step="100"
            class="control-input"
          />
        </div>

        <div class="control-group">
          <label>月度投入 (€)</label>
          <input
            v-model.number="inputs.monthlyAmount"
            type="number"
            min="0"
            step="50"
            class="control-input"
          />
        </div>

        <div class="control-group">
          <label>年利率 (%)</label>
          <input
            v-model.number="inputs.annualRate"
            type="number"
            min="0"
            max="20"
            step="0.1"
            class="control-input"
          />
        </div>

        <div class="control-group">
          <label>投资年限</label>
          <input
            v-model.number="inputs.investmentYears"
            type="number"
            min="1"
            max="50"
            step="1"
            class="control-input"
          />
        </div>
      </div>

      <div class="control-buttons">
        <button @click="simulateCalculating" class="btn btn-primary">
          模拟计算中
        </button>
        <button @click="simulateError" class="btn btn-secondary">
          模拟错误
        </button>
        <button @click="clearError" class="btn btn-secondary">
          清除错误
        </button>
        <button @click="togglePreviewMode" class="btn btn-secondary">
          {{ isPreviewMode ? '退出预览' : '预览模式' }}
        </button>
      </div>
    </div>

    <!-- 即时结果显示 -->
    <div class="results-section">
      <h2>即时结果显示</h2>

      <InstantResultsDisplay
        :results="calculationResults"
        :preview-results="previewResults"
        :is-calculating="isCalculating"
        :is-preview-mode="isPreviewMode"
        :error="errorMessage"
        :last-updated="lastUpdated"
        :show-details="true"
        :show-actions="true"
        :show-trend-chart="true"
        :show-performance-metrics="true"
        :quick-actions="quickActions"
        :performance-data="performanceData"
        @action="handleAction"
        @retry="handleRetry"
        @details-toggle="handleDetailsToggle"
      />
    </div>

    <!-- 功能演示 -->
    <div class="demo-section">
      <h2>功能演示</h2>

      <div class="demo-grid">
        <div class="demo-card">
          <h3>实时更新</h3>
          <p>修改上方的输入参数，观察结果的实时更新和动画效果</p>
          <div class="demo-stats">
            <span>更新次数: {{ updateCount }}</span>
            <span>平均计算时间: {{ averageCalculationTime }}ms</span>
          </div>
        </div>

        <div class="demo-card">
          <h3>动画过渡</h3>
          <p>数值变化时会有平滑的动画过渡，支持不同的缓动函数</p>
          <button @click="triggerLargeChange" class="btn btn-small">
            触发大幅变化
          </button>
        </div>

        <div class="demo-card">
          <h3>趋势图表</h3>
          <p>显示最近10次计算结果的趋势变化</p>
          <div class="trend-info">
            <span>趋势点数: {{ trendPointCount }}</span>
            <span :class="trendDirectionClass">
              趋势: {{ trendDirection }}
            </span>
          </div>
        </div>

        <div class="demo-card">
          <h3>状态管理</h3>
          <p>支持多种状态：就绪、计算中、预览、错误</p>
          <div class="status-buttons">
            <button @click="setStatus('ready')" class="status-btn ready">就绪</button>
            <button @click="setStatus('calculating')" class="status-btn calculating">计算中</button>
            <button @click="setStatus('preview')" class="status-btn preview">预览</button>
            <button @click="setStatus('error')" class="status-btn error">错误</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 性能监控 -->
    <div class="performance-section">
      <h2>性能监控</h2>

      <div class="performance-cards">
        <div class="perf-card">
          <div class="perf-value">{{ performanceData?.calculationTime || 0 }}ms</div>
          <div class="perf-label">计算时间</div>
        </div>

        <div class="perf-card">
          <div class="perf-value">{{ performanceData?.renderTime || 0 }}ms</div>
          <div class="perf-label">渲染时间</div>
        </div>

        <div class="perf-card">
          <div class="perf-value">{{ performanceData?.cacheHitRate || 0 }}%</div>
          <div class="perf-label">缓存命中率</div>
        </div>

        <div class="perf-card">
          <div class="perf-value">{{ updateCount }}</div>
          <div class="perf-label">更新次数</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import InstantResultsDisplay from '../realtime/InstantResultsDisplay.vue'
import type { CalculationResult } from '@/types/calculator'

// 响应式数据
const inputs = ref({
  initialAmount: 10000,
  monthlyAmount: 500,
  annualRate: 5.0,
  investmentYears: 10
})

const isCalculating = ref(false)
const isPreviewMode = ref(false)
const errorMessage = ref<string | null>(null)
const lastUpdated = ref<Date | null>(null)
const updateCount = ref(0)
const calculationTimes = ref<number[]>([])

// 计算结果
const calculationResults = ref<CalculationResult | null>(null)
const previewResults = ref<Partial<CalculationResult> | null>(null)

// 快速操作
const quickActions = ref([
  {
    key: 'save',
    label: '保存结果',
    icon: 'save',
    variant: 'primary' as const
  },
  {
    key: 'export',
    label: '导出数据',
    icon: 'download',
    variant: 'secondary' as const
  },
  {
    key: 'share',
    label: '分享',
    icon: 'share',
    variant: 'secondary' as const
  },
  {
    key: 'reset',
    label: '重置',
    icon: 'refresh',
    variant: 'danger' as const
  }
])

// 性能数据
const performanceData = ref({
  calculationTime: 0,
  renderTime: 0,
  cacheHitRate: 85
})

// 计算属性
const averageCalculationTime = computed(() => {
  if (calculationTimes.value.length === 0) return 0
  const sum = calculationTimes.value.reduce((a, b) => a + b, 0)
  return Math.round(sum / calculationTimes.value.length)
})

const trendPointCount = computed(() => {
  return calculationResults.value?.yearlyBreakdown?.length || 0
})

const trendDirection = computed(() => {
  const results = calculationResults.value
  if (!results || !results.yearlyBreakdown || results.yearlyBreakdown.length < 2) {
    return '无数据'
  }

  const breakdown = results.yearlyBreakdown
  const latest = breakdown[breakdown.length - 1]
  const previous = breakdown[breakdown.length - 2]

  if (latest.end_amount > previous.end_amount) return '上升'
  if (latest.end_amount < previous.end_amount) return '下降'
  return '平稳'
})

const trendDirectionClass = computed(() => {
  const direction = trendDirection.value
  return {
    'trend-up': direction === '上升',
    'trend-down': direction === '下降',
    'trend-stable': direction === '平稳'
  }
})

// 方法
const calculateResults = async () => {
  const startTime = performance.now()

  // 模拟计算过程
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))

  const monthlyRate = inputs.value.annualRate / 100 / 12
  const totalMonths = inputs.value.investmentYears * 12

  // 复利计算
  let balance = inputs.value.initialAmount
  const yearlyBreakdown = []

  for (let year = 1; year <= inputs.value.investmentYears; year++) {
    const startBalance = balance

    // 每月投入和复利
    for (let month = 1; month <= 12; month++) {
      balance = balance * (1 + monthlyRate) + inputs.value.monthlyAmount
    }

    yearlyBreakdown.push({
      year,
      start_amount: startBalance,
      contributions: inputs.value.monthlyAmount * 12,
      interest: balance - startBalance - (inputs.value.monthlyAmount * 12),
      end_amount: balance,
      growth_rate: ((balance - startBalance) / startBalance) * 100
    })
  }

  const totalContributions = inputs.value.initialAmount + (inputs.value.monthlyAmount * totalMonths)
  const totalInterest = balance - totalContributions

  calculationResults.value = {
    finalAmount: balance,
    final_amount: balance,
    totalContributions,
    total_contributions: totalContributions,
    totalInterest,
    total_interest: totalInterest,
    // effectiveRate: (totalInterest / totalContributions) * 100, // 临时注释掉，避免类型错误
    annual_return: inputs.value.annualRate,
    yearlyBreakdown,
    breakdown: {
      principal: inputs.value.initialAmount,
      monthlyContributions: inputs.value.monthlyAmount * totalMonths,
      compoundInterest: totalInterest,
      totalReturn: (balance / totalContributions - 1) * 100
    }
  }

  const calculationTime = performance.now() - startTime
  calculationTimes.value.push(calculationTime)
  if (calculationTimes.value.length > 10) {
    calculationTimes.value.shift()
  }

  performanceData.value.calculationTime = Math.round(calculationTime)
  performanceData.value.renderTime = Math.round(Math.random() * 20 + 5)

  lastUpdated.value = new Date()
  updateCount.value++
}

const simulateCalculating = async () => {
  isCalculating.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  isCalculating.value = false
  await calculateResults()
}

const simulateError = () => {
  errorMessage.value = '计算过程中发生错误：输入参数超出有效范围'
}

const clearError = () => {
  errorMessage.value = null
}

const togglePreviewMode = () => {
  isPreviewMode.value = !isPreviewMode.value

  if (isPreviewMode.value) {
    // 生成预览结果（简化版）
    previewResults.value = {
      finalAmount: inputs.value.initialAmount * 1.5,
      totalContributions: inputs.value.initialAmount + (inputs.value.monthlyAmount * 12),
      // effectiveRate: inputs.value.annualRate * 0.8 // 临时注释掉，避免类型错误
    }
  } else {
    previewResults.value = null
  }
}

const triggerLargeChange = () => {
  inputs.value.initialAmount += Math.random() * 10000 + 5000
}

const setStatus = (status: string) => {
  switch (status) {
    case 'ready':
      isCalculating.value = false
      errorMessage.value = null
      isPreviewMode.value = false
      break
    case 'calculating':
      simulateCalculating()
      break
    case 'preview':
      togglePreviewMode()
      break
    case 'error':
      simulateError()
      break
  }
}

const handleAction = (actionKey: string) => {
  console.log('Action triggered:', actionKey)

  switch (actionKey) {
    case 'save':
      alert('保存功能演示')
      break
    case 'export':
      alert('导出功能演示')
      break
    case 'share':
      alert('分享功能演示')
      break
    case 'reset':
      inputs.value = {
        initialAmount: 10000,
        monthlyAmount: 500,
        annualRate: 5.0,
        investmentYears: 10
      }
      break
  }
}

const handleRetry = () => {
  clearError()
  calculateResults()
}

const handleDetailsToggle = (expanded: boolean) => {
  console.log('Details toggled:', expanded)
}

// 监听器
watch(inputs, () => {
  if (!isCalculating.value && !errorMessage.value) {
    calculateResults()
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  calculateResults()
})
</script>

<style scoped>
.instant-results-example {
  @apply max-w-6xl mx-auto p-6 space-y-8;
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

/* 控制面板 */
.control-panel {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.control-panel h2 {
  @apply text-xl font-semibold text-gray-800 mb-4;
}

.controls-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6;
}

.control-group {
  @apply space-y-2;
}

.control-group label {
  @apply block text-sm font-medium text-gray-700;
}

.control-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.control-buttons {
  @apply flex flex-wrap gap-3;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors duration-200;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}

.btn-small {
  @apply px-3 py-1 text-sm;
}

/* 结果区域 */
.results-section {
  @apply space-y-4;
}

.results-section h2 {
  @apply text-xl font-semibold text-gray-800;
}

/* 演示区域 */
.demo-section {
  @apply space-y-6;
}

.demo-section h2 {
  @apply text-xl font-semibold text-gray-800;
}

.demo-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.demo-card {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.demo-card h3 {
  @apply text-lg font-semibold text-gray-800 mb-2;
}

.demo-card p {
  @apply text-gray-600 mb-4;
}

.demo-stats {
  @apply flex gap-4 text-sm text-gray-500;
}

.trend-info {
  @apply flex gap-4 text-sm;
}

.trend-up {
  @apply text-green-600 font-medium;
}

.trend-down {
  @apply text-red-600 font-medium;
}

.trend-stable {
  @apply text-gray-600 font-medium;
}

.status-buttons {
  @apply flex flex-wrap gap-2;
}

.status-btn {
  @apply px-3 py-1 rounded text-sm font-medium transition-colors;
}

.status-btn.ready {
  @apply bg-green-100 text-green-700 hover:bg-green-200;
}

.status-btn.calculating {
  @apply bg-blue-100 text-blue-700 hover:bg-blue-200;
}

.status-btn.preview {
  @apply bg-yellow-100 text-yellow-700 hover:bg-yellow-200;
}

.status-btn.error {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

/* 性能监控 */
.performance-section {
  @apply space-y-4;
}

.performance-section h2 {
  @apply text-xl font-semibold text-gray-800;
}

.performance-cards {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.perf-card {
  @apply bg-white rounded-lg shadow-md p-4 border text-center;
}

.perf-value {
  @apply text-2xl font-bold text-gray-900 mb-1;
}

.perf-label {
  @apply text-sm text-gray-600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .controls-grid {
    @apply grid-cols-1;
  }

  .demo-grid {
    @apply grid-cols-1;
  }

  .performance-cards {
    @apply grid-cols-2;
  }

  .control-buttons {
    @apply flex-col;
  }

  .btn {
    @apply w-full justify-center;
  }
}
</style>
