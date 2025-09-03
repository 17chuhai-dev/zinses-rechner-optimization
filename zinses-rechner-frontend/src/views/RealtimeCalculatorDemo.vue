<!--
  实时计算器演示页面
  展示完整的实时计算反馈系统功能
-->

<template>
  <div class="realtime-calculator-demo">
    <div class="demo-header">
      <h1>{{ $t('demo.title') }}</h1>
      <p>{{ $t('demo.description') }}</p>
    </div>

    <!-- 实时计算器包装器 -->
    <RealtimeCalculatorWrapper
      :calculator-title="$t('demo.compoundInterestCalculator')"
      calculator-type="compound-interest"
      :initial-inputs="initialInputs"
      :field-labels="fieldLabels"
      :show-performance-metrics="true"
      :show-loading-details="true"
      :show-debug-panel="isDevelopment"
      :enable-optimization="true"
      :enable-preview="true"
      :debounce-ms="300"
      :throttle-ms="100"
      @calculation-complete="handleCalculationComplete"
      @calculation-error="handleCalculationError"
      @input-change="handleInputChange"
      @validation-error="handleValidationError"
    >
      <!-- 自定义输入表单 -->
      <template #inputs="{ registerField, updateValue }">
        <div class="demo-inputs">
          <div class="input-grid">
            <!-- 初始投资金额 -->
            <div class="input-group">
              <label for="initial-amount" class="input-label">
                {{ $t('inputs.initialAmount') }}
              </label>
              <div class="input-wrapper">
                <input
                  id="initial-amount"
                  ref="initialAmountInput"
                  type="number"
                  class="input-field"
                  :placeholder="$t('inputs.initialAmountPlaceholder')"
                  min="0"
                  step="100"
                  @input="handleInputChange('initialAmount', $event)"
                />
                <span class="input-suffix">€</span>
              </div>
            </div>

            <!-- 月度投资金额 -->
            <div class="input-group">
              <label for="monthly-amount" class="input-label">
                {{ $t('inputs.monthlyAmount') }}
              </label>
              <div class="input-wrapper">
                <input
                  id="monthly-amount"
                  ref="monthlyAmountInput"
                  type="number"
                  class="input-field"
                  :placeholder="$t('inputs.monthlyAmountPlaceholder')"
                  min="0"
                  step="50"
                  @input="handleInputChange('monthlyAmount', $event)"
                />
                <span class="input-suffix">€</span>
              </div>
            </div>

            <!-- 年利率 -->
            <div class="input-group">
              <label for="annual-rate" class="input-label">
                {{ $t('inputs.annualRate') }}
              </label>
              <div class="input-wrapper">
                <input
                  id="annual-rate"
                  ref="annualRateInput"
                  type="number"
                  class="input-field"
                  :placeholder="$t('inputs.annualRatePlaceholder')"
                  min="0"
                  max="20"
                  step="0.1"
                  @input="handleInputChange('annualRate', $event)"
                />
                <span class="input-suffix">%</span>
              </div>
            </div>

            <!-- 投资期限 -->
            <div class="input-group">
              <label for="investment-years" class="input-label">
                {{ $t('inputs.investmentYears') }}
              </label>
              <div class="input-wrapper">
                <input
                  id="investment-years"
                  ref="investmentYearsInput"
                  type="number"
                  class="input-field"
                  :placeholder="$t('inputs.investmentYearsPlaceholder')"
                  min="1"
                  max="50"
                  step="1"
                  @input="handleInputChange('investmentYears', $event)"
                />
                <span class="input-suffix">{{ $t('inputs.years') }}</span>
              </div>
            </div>

            <!-- 复利频率 -->
            <div class="input-group">
              <label for="compound-frequency" class="input-label">
                {{ $t('inputs.compoundFrequency') }}
              </label>
              <select
                id="compound-frequency"
                ref="compoundFrequencySelect"
                class="input-field"
                @change="handleInputChange('compoundFrequency', $event)"
              >
                <option value="">{{ $t('inputs.selectFrequency') }}</option>
                <option value="1">{{ $t('inputs.annually') }}</option>
                <option value="2">{{ $t('inputs.semiAnnually') }}</option>
                <option value="4">{{ $t('inputs.quarterly') }}</option>
                <option value="12">{{ $t('inputs.monthly') }}</option>
                <option value="365">{{ $t('inputs.daily') }}</option>
              </select>
            </div>

            <!-- 税率 -->
            <div class="input-group">
              <label for="tax-rate" class="input-label">
                {{ $t('inputs.taxRate') }}
              </label>
              <div class="input-wrapper">
                <input
                  id="tax-rate"
                  ref="taxRateInput"
                  type="number"
                  class="input-field"
                  :placeholder="$t('inputs.taxRatePlaceholder')"
                  min="0"
                  max="50"
                  step="0.1"
                  @input="handleInputChange('taxRate', $event)"
                />
                <span class="input-suffix">%</span>
              </div>
            </div>
          </div>

          <!-- 高级选项 -->
          <div class="advanced-options">
            <button
              class="advanced-toggle"
              @click="showAdvanced = !showAdvanced"
            >
              {{ showAdvanced ? $t('inputs.hideAdvanced') : $t('inputs.showAdvanced') }}
            </button>

            <Transition name="advanced-expand">
              <div v-if="showAdvanced" class="advanced-content">
                <div class="input-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      @change="handleInputChange('adjustForInflation', $event)"
                    />
                    <span>{{ $t('inputs.adjustForInflation') }}</span>
                  </label>
                </div>

                <div class="input-group">
                  <label for="inflation-rate" class="input-label">
                    {{ $t('inputs.inflationRate') }}
                  </label>
                  <div class="input-wrapper">
                    <input
                      id="inflation-rate"
                      type="number"
                      class="input-field"
                      :placeholder="$t('inputs.inflationRatePlaceholder')"
                      min="0"
                      max="10"
                      step="0.1"
                      @input="handleInputChange('inflationRate', $event)"
                    />
                    <span class="input-suffix">%</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </template>
    </RealtimeCalculatorWrapper>

    <!-- 演示控制面板 -->
    <div class="demo-controls">
      <h3>{{ $t('demo.controls') }}</h3>
      <div class="control-buttons">
        <button class="control-button" @click="loadPreset('conservative')">
          {{ $t('demo.presets.conservative') }}
        </button>
        <button class="control-button" @click="loadPreset('moderate')">
          {{ $t('demo.presets.moderate') }}
        </button>
        <button class="control-button" @click="loadPreset('aggressive')">
          {{ $t('demo.presets.aggressive') }}
        </button>
        <button class="control-button secondary" @click="clearInputs">
          {{ $t('demo.clearInputs') }}
        </button>
      </div>
    </div>

    <!-- 结果历史 -->
    <div v-if="calculationHistory.length > 0" class="calculation-history">
      <h3>{{ $t('demo.calculationHistory') }}</h3>
      <div class="history-list">
        <div
          v-for="(calculation, index) in calculationHistory"
          :key="index"
          class="history-item"
        >
          <div class="history-timestamp">
            {{ formatTimestamp(calculation.timestamp) }}
          </div>
          <div class="history-inputs">
            <span>{{ $t('demo.initialAmount') }}: {{ formatCurrency(calculation.inputs.initialAmount) }}</span>
            <span>{{ $t('demo.monthlyAmount') }}: {{ formatCurrency(calculation.inputs.monthlyAmount) }}</span>
            <span>{{ $t('demo.annualRate') }}: {{ calculation.inputs.annualRate }}%</span>
            <span>{{ $t('demo.years') }}: {{ calculation.inputs.investmentYears }}</span>
          </div>
          <div class="history-result">
            {{ formatCurrency(calculation.result.finalAmount) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import RealtimeCalculatorWrapper from '@/components/realtime/RealtimeCalculatorWrapper.vue'
import type { CalculationResult } from '@/types/calculator'

// 组合函数
const { t } = useI18n()

// 响应式数据
const showAdvanced = ref(false)
const calculationHistory = ref<Array<{
  timestamp: Date
  inputs: Record<string, any>
  result: CalculationResult
}>>([])

// 开发环境检测
const isDevelopment = ref(import.meta.env.DEV)

// 初始输入值
const initialInputs = ref({
  initialAmount: 10000,
  monthlyAmount: 500,
  annualRate: 7,
  investmentYears: 20,
  compoundFrequency: 12,
  taxRate: 26.375,
  adjustForInflation: false,
  inflationRate: 2
})

// 字段标签映射
const fieldLabels = ref({
  initialAmount: t('inputs.initialAmount'),
  monthlyAmount: t('inputs.monthlyAmount'),
  annualRate: t('inputs.annualRate'),
  investmentYears: t('inputs.investmentYears'),
  compoundFrequency: t('inputs.compoundFrequency'),
  taxRate: t('inputs.taxRate'),
  inflationRate: t('inputs.inflationRate')
})

// 预设配置
const presets = {
  conservative: {
    initialAmount: 5000,
    monthlyAmount: 200,
    annualRate: 4,
    investmentYears: 30,
    compoundFrequency: 12,
    taxRate: 26.375,
    adjustForInflation: true,
    inflationRate: 2
  },
  moderate: {
    initialAmount: 10000,
    monthlyAmount: 500,
    annualRate: 7,
    investmentYears: 20,
    compoundFrequency: 12,
    taxRate: 26.375,
    adjustForInflation: false,
    inflationRate: 2
  },
  aggressive: {
    initialAmount: 20000,
    monthlyAmount: 1000,
    annualRate: 10,
    investmentYears: 15,
    compoundFrequency: 12,
    taxRate: 26.375,
    adjustForInflation: false,
    inflationRate: 2
  }
}

// 方法
const handleInputChange = (field: string, event: Event) => {
  const target = event.target as HTMLInputElement
  let value: any = target.value

  // 类型转换
  if (target.type === 'number') {
    value = parseFloat(value) || 0
  } else if (target.type === 'checkbox') {
    value = target.checked
  }

  console.log(`输入变化: ${field} = ${value}`)
}

const handleCalculationComplete = (result: CalculationResult) => {
  console.log('计算完成:', result)

  // 添加到历史记录
  calculationHistory.value.unshift({
    timestamp: new Date(),
    inputs: { ...initialInputs.value },
    result
  })

  // 限制历史记录数量
  if (calculationHistory.value.length > 10) {
    calculationHistory.value.pop()
  }
}

const handleCalculationError = (error: string) => {
  console.error('计算错误:', error)
}

const handleValidationError = (errors: any[]) => {
  console.warn('验证错误:', errors)
}

const loadPreset = (presetName: keyof typeof presets) => {
  const preset = presets[presetName]
  initialInputs.value = { ...preset }

  // 更新DOM输入值
  nextTick(() => {
    updateInputElements(preset)
  })
}

const updateInputElements = (values: Record<string, any>) => {
  Object.entries(values).forEach(([key, value]) => {
    const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase())
    if (element && element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        element.checked = Boolean(value)
      } else {
        element.value = String(value)
      }
    }
  })
}

const clearInputs = () => {
  const emptyInputs = {
    initialAmount: 0,
    monthlyAmount: 0,
    annualRate: 0,
    investmentYears: 0,
    compoundFrequency: '',
    taxRate: 0,
    adjustForInflation: false,
    inflationRate: 0
  }

  initialInputs.value = emptyInputs
  nextTick(() => {
    updateInputElements(emptyInputs)
  })
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

// 生命周期
onMounted(() => {
  console.log('实时计算器演示页面已加载')
})
</script>

<style scoped>
.realtime-calculator-demo {
  @apply max-w-6xl mx-auto p-6 space-y-8;
}

.demo-header {
  @apply text-center mb-8;
}

.demo-header h1 {
  @apply text-3xl font-bold text-gray-900 mb-4;
}

.demo-header p {
  @apply text-lg text-gray-600;
}

/* 输入表单样式 */
.demo-inputs {
  @apply space-y-6;
}

.input-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.input-group {
  @apply space-y-2;
}

.input-label {
  @apply block text-sm font-medium text-gray-700;
}

.input-wrapper {
  @apply relative;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply transition-colors duration-200;
}

.input-suffix {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm;
}

.checkbox-label {
  @apply flex items-center gap-2 text-sm text-gray-700 cursor-pointer;
}

/* 高级选项 */
.advanced-options {
  @apply border-t border-gray-200 pt-4;
}

.advanced-toggle {
  @apply text-blue-600 hover:text-blue-800 text-sm font-medium;
}

.advanced-content {
  @apply mt-4 space-y-4;
}

/* 演示控制面板 */
.demo-controls {
  @apply bg-gray-50 rounded-lg p-6;
}

.demo-controls h3 {
  @apply text-lg font-semibold text-gray-900 mb-4;
}

.control-buttons {
  @apply flex flex-wrap gap-3;
}

.control-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors duration-200;
}

.control-button.secondary {
  @apply bg-gray-600 hover:bg-gray-700;
}

/* 计算历史 */
.calculation-history {
  @apply bg-white rounded-lg border border-gray-200 p-6;
}

.calculation-history h3 {
  @apply text-lg font-semibold text-gray-900 mb-4;
}

.history-list {
  @apply space-y-3;
}

.history-item {
  @apply flex items-center justify-between p-3 bg-gray-50 rounded border;
}

.history-timestamp {
  @apply text-xs text-gray-500 font-mono;
}

.history-inputs {
  @apply flex flex-wrap gap-2 text-xs text-gray-600;
}

.history-result {
  @apply text-sm font-semibold text-green-600;
}

/* 过渡动画 */
.advanced-expand-enter-active,
.advanced-expand-leave-active {
  transition: all 0.3s ease;
}

.advanced-expand-enter-from,
.advanced-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.advanced-expand-enter-to,
.advanced-expand-leave-from {
  opacity: 1;
  max-height: 200px;
  transform: translateY(0);
}
</style>
