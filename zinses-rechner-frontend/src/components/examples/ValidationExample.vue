<!--
  输入验证和错误处理示例
  展示实时验证、错误信息显示、数据修正建议等功能
-->

<template>
  <div class="validation-example">
    <div class="example-header">
      <h1>输入验证和错误处理示例</h1>
      <p>展示实时输入验证、错误信息显示、数据修正建议等功能</p>
    </div>

    <!-- 验证状态概览 -->
    <div class="validation-overview">
      <h2>验证状态概览</h2>
      <div class="status-cards">
        <div class="status-card" :class="{ 'valid': enhancedValidationState.isValid }">
          <div class="status-icon">
            <Icon :name="enhancedValidationState.isValid ? 'check-circle' : 'x-circle'" size="24" />
          </div>
          <div class="status-info">
            <div class="status-label">表单状态</div>
            <div class="status-value">{{ enhancedValidationState.isValid ? '有效' : '无效' }}</div>
          </div>
        </div>

        <div class="status-card error" v-if="enhancedValidationState.hasErrors">
          <div class="status-icon">
            <Icon name="alert-circle" size="24" />
          </div>
          <div class="status-info">
            <div class="status-label">错误</div>
            <div class="status-value">{{ enhancedValidationState.errorCount }}</div>
          </div>
        </div>

        <div class="status-card warning" v-if="enhancedValidationState.hasWarnings">
          <div class="status-icon">
            <Icon name="alert-triangle" size="24" />
          </div>
          <div class="status-info">
            <div class="status-label">警告</div>
            <div class="status-value">{{ enhancedValidationState.warningCount }}</div>
          </div>
        </div>

        <div class="status-card suggestion" v-if="enhancedValidationState.hasSuggestions">
          <div class="status-icon">
            <Icon name="lightbulb" size="24" />
          </div>
          <div class="status-info">
            <div class="status-label">建议</div>
            <div class="status-value">{{ enhancedValidationState.suggestionCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 验证表单 -->
    <div class="validation-form">
      <h2>计算器字段验证</h2>

      <form @submit.prevent="handleSubmit" class="form-grid">
        <!-- 初始金额 -->
        <ValidatedInput
          v-model="formData.initialAmount"
          field-name="initialAmount"
          label="初始金额"
          type="currency"
          placeholder="请输入初始投资金额"
          help-text="您计划投资的起始金额，可以为0"
          prefix-icon="euro"
          clearable
          :validation-engine="validationEngine"
          :validation-context="{ allFields: formData }"
          @validation-change="handleValidationChange"
          @suggestion-applied="handleSuggestionApplied"
        />

        <!-- 月度投入 -->
        <ValidatedInput
          v-model="formData.monthlyAmount"
          field-name="monthlyAmount"
          label="月度投入"
          type="currency"
          placeholder="请输入每月投资金额"
          help-text="您计划每月投入的金额"
          prefix-icon="calendar"
          clearable
          :validation-engine="validationEngine"
          :validation-context="{ allFields: formData }"
          @validation-change="handleValidationChange"
          @suggestion-applied="handleSuggestionApplied"
        />

        <!-- 年利率 -->
        <ValidatedInput
          v-model="formData.annualRate"
          field-name="annualRate"
          label="年利率"
          type="percentage"
          placeholder="请输入预期年利率"
          help-text="预期的年化收益率，德国市场通常在2-8%之间"
          suffix="%"
          required
          clearable
          :validation-engine="validationEngine"
          :validation-context="{ allFields: formData }"
          @validation-change="handleValidationChange"
          @suggestion-applied="handleSuggestionApplied"
        />

        <!-- 投资年限 -->
        <ValidatedInput
          v-model="formData.investmentYears"
          field-name="investmentYears"
          label="投资年限"
          type="number"
          placeholder="请输入投资年数"
          help-text="计划投资的年数，建议长期投资以获得更好的复利效果"
          suffix="年"
          required
          :min="1"
          :max="100"
          clearable
          :validation-engine="validationEngine"
          :validation-context="{ allFields: formData }"
          @validation-change="handleValidationChange"
          @suggestion-applied="handleSuggestionApplied"
        />

        <!-- 税率 -->
        <ValidatedInput
          v-model="formData.taxRate"
          field-name="taxRate"
          label="税率"
          type="percentage"
          placeholder="请输入适用税率"
          help-text="德国资本利得税约为26.375%（含团结税和教会税）"
          suffix="%"
          clearable
          :validation-engine="validationEngine"
          :validation-context="{ allFields: formData }"
          @validation-change="handleValidationChange"
          @suggestion-applied="handleSuggestionApplied"
        />

        <!-- 通胀率 -->
        <ValidatedInput
          v-model="formData.inflationRate"
          field-name="inflationRate"
          label="通胀率"
          type="percentage"
          placeholder="请输入预期通胀率"
          help-text="欧洲央行的通胀目标约为2%"
          suffix="%"
          clearable
          :validation-engine="validationEngine"
          :validation-context="{ allFields: formData }"
          @validation-change="handleValidationChange"
          @suggestion-applied="handleSuggestionApplied"
        />

        <!-- 提交按钮 -->
        <div class="form-actions">
          <button
            type="submit"
            class="submit-button"
            :disabled="!enhancedValidationState.isValid || isValidating"
          >
            <Icon v-if="isValidating" name="loader" size="16" class="animate-spin" />
            <Icon v-else name="calculator" size="16" />
            {{ isValidating ? '验证中...' : '开始计算' }}
          </button>

          <button
            type="button"
            class="reset-button"
            @click="resetForm"
          >
            <Icon name="refresh-cw" size="16" />
            重置表单
          </button>
        </div>
      </form>
    </div>

    <!-- 验证详情 -->
    <div class="validation-details">
      <h2>验证详情</h2>

      <!-- 错误列表 -->
      <div v-if="allErrors.length > 0" class="error-section">
        <h3>
          <Icon name="alert-circle" size="20" />
          错误信息 ({{ allErrors.length }})
        </h3>
        <div class="message-list">
          <div
            v-for="error in allErrors"
            :key="`${error.field}-${error.code}`"
            class="message-item error"
          >
            <Icon name="x-circle" size="16" />
            <div class="message-content">
              <div class="message-field">{{ getFieldLabel(error.field) }}</div>
              <div class="message-text">{{ error.message }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 警告列表 -->
      <div v-if="allWarnings.length > 0" class="warning-section">
        <h3>
          <Icon name="alert-triangle" size="20" />
          警告信息 ({{ allWarnings.length }})
        </h3>
        <div class="message-list">
          <div
            v-for="warning in allWarnings"
            :key="`${warning.field}-${warning.code}`"
            class="message-item warning"
          >
            <Icon name="alert-triangle" size="16" />
            <div class="message-content">
              <div class="message-field">{{ getFieldLabel(warning.field) }}</div>
              <div class="message-text">{{ warning.message }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 建议列表 -->
      <div v-if="allSuggestions.length > 0" class="suggestion-section">
        <h3>
          <Icon name="lightbulb" size="20" />
          优化建议 ({{ allSuggestions.length }})
        </h3>
        <div class="message-list">
          <div
            v-for="suggestion in allSuggestions"
            :key="`${suggestion.field}-${suggestion.type}`"
            class="message-item suggestion"
            :class="getSuggestionClass(suggestion)"
          >
            <Icon :name="getSuggestionIcon(suggestion.type)" size="16" />
            <div class="message-content">
              <div class="message-field">{{ getFieldLabel(suggestion.field) }}</div>
              <div class="message-text">{{ suggestion.message }}</div>
              <div class="message-confidence">可信度: {{ Math.round(suggestion.confidence * 100) }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div class="debug-section" v-if="showDebugInfo">
      <h2>调试信息</h2>
      <div class="debug-content">
        <pre>{{ JSON.stringify(enhancedValidationState, null, 2) }}</pre>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <h2>控制面板</h2>
      <div class="control-buttons">
        <button @click="showDebugInfo = !showDebugInfo" class="control-button">
          {{ showDebugInfo ? '隐藏' : '显示' }}调试信息
        </button>
        <button @click="validateAllFields" class="control-button">
          手动验证所有字段
        </button>
        <button @click="clearAllValidation" class="control-button">
          清除所有验证
        </button>
        <button @click="fillSampleData" class="control-button">
          填充示例数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAdvancedValidation } from '@/composables/useValidation'
import ValidatedInput from '@/components/ui/ValidatedInput.vue'
import Icon from '@/components/ui/BaseIcon.vue'

// 响应式数据
const formData = reactive({
  initialAmount: null as number | null,
  monthlyAmount: null as number | null,
  annualRate: null as number | null,
  investmentYears: null as number | null,
  taxRate: null as number | null,
  inflationRate: null as number | null
})

const showDebugInfo = ref(false)

// 使用高级验证
const {
  enhancedValidationState,
  isValidating,
  allErrors,
  allWarnings,
  allSuggestions,
  validateField,
  validateFields,
  clearValidation,
  resetValidation,
  validationEngine
} = useAdvancedValidation({
  validateOnInput: true,
  validateOnBlur: true,
  debounceMs: 300,
  showSuggestions: true
})

// 字段标签映射
const fieldLabels: Record<string, string> = {
  initialAmount: '初始金额',
  monthlyAmount: '月度投入',
  annualRate: '年利率',
  investmentYears: '投资年限',
  taxRate: '税率',
  inflationRate: '通胀率'
}

// 方法
const getFieldLabel = (fieldName: string) => {
  return fieldLabels[fieldName] || fieldName
}

const getSuggestionClass = (suggestion: any) => {
  return {
    'suggestion-correction': suggestion.type === 'correction',
    'suggestion-optimization': suggestion.type === 'optimization',
    'suggestion-alternative': suggestion.type === 'alternative',
    'high-confidence': suggestion.confidence > 0.8,
    'medium-confidence': suggestion.confidence > 0.5 && suggestion.confidence <= 0.8,
    'low-confidence': suggestion.confidence <= 0.5
  }
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'correction':
      return 'edit'
    case 'optimization':
      return 'trending-up'
    case 'alternative':
      return 'shuffle'
    default:
      return 'lightbulb'
  }
}

const handleValidationChange = (result: any) => {
  console.log('验证结果变化:', result)
}

const handleSuggestionApplied = (suggestion: any) => {
  console.log('应用建议:', suggestion)
}

const handleSubmit = async () => {
  console.log('提交表单:', formData)
  const results = await validateFields(formData)
  console.log('表单验证结果:', results)
}

const resetForm = () => {
  Object.keys(formData).forEach(key => {
    formData[key as keyof typeof formData] = null
  })
  resetValidation()
}

const validateAllFields = async () => {
  await validateFields(formData)
}

const clearAllValidation = () => {
  clearValidation()
}

const fillSampleData = () => {
  formData.initialAmount = 10000
  formData.monthlyAmount = 500
  formData.annualRate = 5.5
  formData.investmentYears = 15
  formData.taxRate = 26.375
  formData.inflationRate = 2.0
}
</script>

<style scoped>
.validation-example {
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

/* 验证状态概览 */
.validation-overview {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.validation-overview h2 {
  @apply text-xl font-semibold text-gray-800 mb-4;
}

.status-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.status-card {
  @apply flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200;
  @apply border-gray-200 bg-gray-50;
}

.status-card.valid {
  @apply border-green-200 bg-green-50;
}

.status-card.error {
  @apply border-red-200 bg-red-50;
}

.status-card.warning {
  @apply border-yellow-200 bg-yellow-50;
}

.status-card.suggestion {
  @apply border-blue-200 bg-blue-50;
}

.status-icon {
  @apply flex-shrink-0;
}

.status-card.valid .status-icon {
  @apply text-green-600;
}

.status-card.error .status-icon {
  @apply text-red-600;
}

.status-card.warning .status-icon {
  @apply text-yellow-600;
}

.status-card.suggestion .status-icon {
  @apply text-blue-600;
}

.status-info {
  @apply flex-1;
}

.status-label {
  @apply text-sm text-gray-600 font-medium;
}

.status-value {
  @apply text-lg font-bold text-gray-900;
}

/* 验证表单 */
.validation-form {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.validation-form h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.form-actions {
  @apply md:col-span-2 flex gap-4 pt-4 border-t border-gray-200;
}

.submit-button {
  @apply flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md font-medium;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors;
}

.reset-button {
  @apply flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-medium;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
  @apply transition-colors;
}

/* 验证详情 */
.validation-details {
  @apply bg-white rounded-lg shadow-md p-6 border space-y-6;
}

.validation-details h2 {
  @apply text-xl font-semibold text-gray-800;
}

.error-section h3,
.warning-section h3,
.suggestion-section h3 {
  @apply flex items-center gap-2 text-lg font-medium mb-4;
}

.error-section h3 {
  @apply text-red-700;
}

.warning-section h3 {
  @apply text-yellow-700;
}

.suggestion-section h3 {
  @apply text-blue-700;
}

.message-list {
  @apply space-y-3;
}

.message-item {
  @apply flex items-start gap-3 p-4 rounded-lg border;
}

.message-item.error {
  @apply bg-red-50 border-red-200 text-red-800;
}

.message-item.warning {
  @apply bg-yellow-50 border-yellow-200 text-yellow-800;
}

.message-item.suggestion {
  @apply bg-blue-50 border-blue-200 text-blue-800;
}

.message-item.suggestion-correction {
  @apply bg-orange-50 border-orange-200 text-orange-800;
}

.message-item.suggestion-optimization {
  @apply bg-green-50 border-green-200 text-green-800;
}

.message-item.suggestion-alternative {
  @apply bg-purple-50 border-purple-200 text-purple-800;
}

.message-item.high-confidence {
  @apply border-l-4;
}

.message-item.medium-confidence {
  @apply border-l-2;
}

.message-content {
  @apply flex-1;
}

.message-field {
  @apply text-sm font-semibold mb-1;
}

.message-text {
  @apply text-sm;
}

.message-confidence {
  @apply text-xs opacity-75 mt-1;
}

/* 调试信息 */
.debug-section {
  @apply bg-gray-900 rounded-lg p-6 text-white;
}

.debug-section h2 {
  @apply text-xl font-semibold mb-4;
}

.debug-content pre {
  @apply text-sm overflow-auto max-h-96 bg-gray-800 p-4 rounded;
}

/* 控制面板 */
.control-panel {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.control-panel h2 {
  @apply text-xl font-semibold text-gray-800 mb-4;
}

.control-buttons {
  @apply flex flex-wrap gap-3;
}

.control-button {
  @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium;
  @apply hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
  @apply transition-colors;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .status-cards {
    @apply grid-cols-1;
  }

  .form-grid {
    @apply grid-cols-1;
  }

  .form-actions {
    @apply flex-col;
  }

  .control-buttons {
    @apply flex-col;
  }
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

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .validation-overview,
  .validation-form,
  .validation-details,
  .control-panel {
    @apply bg-gray-800 border-gray-700;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .validation-overview h2,
  .validation-form h2,
  .validation-details h2,
  .control-panel h2 {
    @apply text-gray-100;
  }

  .status-label {
    @apply text-gray-300;
  }

  .status-value {
    @apply text-gray-100;
  }
}
</style>
