<template>
  <BaseCard title="Zinseszins-Rechner" padding="lg">
    <!-- 增强错误状态显示 -->
    <EnhancedErrorState
      v-if="hasCalculationError"
      :type="errorType"
      :title="errorTitle"
      :description="errorDescription"
      :details="errorDetails"
      :error-code="errorCode"
      :suggestions="errorSuggestions"
      :retryable="true"
      :reportable="true"
      :dismissible="true"
      class="mb-6"
      @retry="retryCalculation"
      @report="reportError"
      @dismiss="dismissError"
    />

    <!-- 加载状态 -->
    <EnhancedLoadingState
      v-if="isLoading || isCalculating"
      type="calculator"
      title="Berechnung läuft"
      :message="loadingMessages"
      :progress="calculationProgress"
      :current-step="currentCalculationStep"
      :total-steps="totalCalculationSteps"
      :show-progress="true"
      :estimated-time="estimatedCalculationTime"
      :cancellable="true"
      size="md"
      class="mb-6"
      @cancel="cancelCalculation"
    />

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 本金输入 -->
      <div class="space-y-2">
        <EnhancedInput
          v-model="form.principal"
          type="currency"
          label="Startkapital (€)"
          placeholder="10.000"
          :min="1"
          :max="10000000"
          :error-message="getFieldError('principal')"
          prefix-icon="currency-euro"
          help-text="Das Geld, das Sie zu Beginn anlegen. Mindestens 1€, maximal 10 Millionen €."
          :suggestions="principalSuggestions"
          :show-suggestions="true"
          clearable
          required
        />
      </div>

      <!-- 月供输入 -->
      <EnhancedInput
        v-model="form.monthlyPayment"
        type="currency"
        label="Monatliche Sparrate (€)"
        placeholder="500"
        :min="0"
        :max="50000"
        :error-message="getFieldError('monthlyPayment')"
        prefix-icon="currency-euro"
        help-text="Optional: Regelmäßige monatliche Einzahlungen"
        :suggestions="monthlySuggestions"
        :show-suggestions="true"
        clearable
      />

      <!-- 利率输入 -->
      <EnhancedInput
        v-model="form.annualRate"
        type="percentage"
        label="Zinssatz (%)"
        placeholder="4,0"
        :min="0"
        :max="20"
        :step="0.1"
        :error-message="getFieldError('annualRate')"
        suffix-icon="chart-bar"
        help-text="Erwarteter jährlicher Zinssatz"
        :suggestions="rateSuggestions"
        :show-suggestions="true"
        :feedback="getRateFeedback()"
        clearable
        required
      />

      <!-- 年限输入 -->
      <div>
        <label for="years" class="block text-sm font-medium text-gray-700 mb-2">
          Laufzeit: {{ form.years }} Jahre
        </label>
        <input
          id="years"
          v-model.number="form.years"
          type="range"
          min="1"
          max="50"
          step="1"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 Jahr</span>
          <span>50 Jahre</span>
        </div>
        <p v-if="getFieldError('years')" class="mt-1 text-sm text-red-600">
          {{ getFieldError('years') }}
        </p>
      </div>

      <!-- 复利频率选择 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Zinszahlung </label>
        <div class="flex space-x-4">
          <label class="flex items-center">
            <input v-model="form.compoundFrequency" type="radio" value="monthly" class="mr-2" />
            Monatlich
          </label>
          <label class="flex items-center">
            <input v-model="form.compoundFrequency" type="radio" value="quarterly" class="mr-2" />
            Vierteljährlich
          </label>
          <label class="flex items-center">
            <input v-model="form.compoundFrequency" type="radio" value="yearly" class="mr-2" />
            Jährlich
          </label>
        </div>
      </div>

      <!-- 提交按钮 -->
      <BaseButton
        type="submit"
        variant="primary"
        size="lg"
        :disabled="isCalculating || !isFormValid"
        :loading="isCalculating"
        full-width
        icon-left="calculator"
      >
        <span v-if="isCalculating">Berechnung läuft...</span>
        <span v-else>Jetzt berechnen</span>
      </BaseButton>

      <!-- 重置按钮 -->
      <BaseButton
        type="button"
        variant="secondary"
        size="md"
        full-width
        @click="resetForm"
      >
        Zurücksetzen
      </BaseButton>
    </form>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCalculator } from '@/composables/useCalculator'
import { useCalculatorValidation } from '@/composables/useValidation'
import { useErrorHandler } from '@/composables/useErrorHandler'
import BaseCard from '../ui/BaseCard.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'
import ErrorMessage from '../ui/ErrorMessage.vue'
import EnhancedInput from '../ui/EnhancedInput.vue'
import ErrorDisplay from '../ui/ErrorDisplay.vue'
import LoadingState from '../ui/LoadingState.vue'
import EnhancedLoadingState from '../ui/EnhancedLoadingState.vue'
import EnhancedErrorState from '../ui/EnhancedErrorState.vue'
import UserGuidance from '../ui/UserGuidance.vue'

const { form, errors, isCalculating, isFormValid, calculate, resetForm } = useCalculator()
const {
  validateCalculatorForm,
  validateBusinessLogic,
  clearAllErrors,
  setErrors
} = useCalculatorValidation()

// 错误处理
const {
  errors: systemErrors,
  hasErrors: hasSystemErrors,
  isLoading,
  handleValidationError,
  handleCalculationError,
  withErrorHandling,
  removeError,
  clearErrors
} = useErrorHandler()

// 业务逻辑警告
const businessWarnings = ref<string[]>([])

// 智能建议数据
const principalSuggestions = computed(() => [
  { value: 1000, description: 'Kleiner Anfang' },
  { value: 5000, description: 'Solide Basis' },
  { value: 10000, description: 'Guter Start' },
  { value: 25000, description: 'Starke Position' },
  { value: 50000, description: 'Große Investition' },
  { value: 100000, description: 'Erhebliches Kapital' }
])

const monthlySuggestions = computed(() => [
  { value: 50, description: 'Minimaler Sparplan' },
  { value: 100, description: 'Grundsparen' },
  { value: 250, description: 'Solides Sparen' },
  { value: 500, description: 'Ambitioniertes Sparen' },
  { value: 1000, description: 'Intensives Sparen' },
  { value: 2000, description: 'Maximales Sparen' }
])

const rateSuggestions = computed(() => [
  { value: 1.5, description: 'Konservativ (Festgeld)' },
  { value: 3.0, description: 'Moderat (Anleihen)' },
  { value: 4.5, description: 'Ausgewogen (Mischfonds)' },
  { value: 6.0, description: 'Wachstum (Aktienfonds)' },
  { value: 8.0, description: 'Aggressiv (Einzelaktien)' }
])

// 智能反馈
const getRateFeedback = () => {
  const rate = Number(form.value.annualRate)
  if (!rate) return null

  if (rate < 2) {
    return {
      type: 'info' as const,
      message: 'Sehr konservativer Zinssatz. Sicher, aber geringes Wachstum.'
    }
  } else if (rate < 4) {
    return {
      type: 'success' as const,
      message: 'Moderater Zinssatz. Gute Balance zwischen Sicherheit und Rendite.'
    }
  } else if (rate < 7) {
    return {
      type: 'warning' as const,
      message: 'Ambitionierter Zinssatz. Höhere Rendite, aber auch höheres Risiko.'
    }
  } else {
    return {
      type: 'warning' as const,
      message: 'Sehr optimistischer Zinssatz. Hohe Rendite möglich, aber sehr riskant.'
    }
  }
}

// 加载状态管理
const calculationProgress = ref(0)
const currentCalculationStep = ref(1)
const totalCalculationSteps = ref(4)
const estimatedCalculationTime = ref('2-3 Sekunden')

const loadingMessages = computed(() => [
  'Eingabedaten werden validiert...',
  'Zinseszinsberechnung läuft...',
  'Ergebnisse werden aufbereitet...',
  'Diagramme werden generiert...'
])

// 取消计算
const cancelCalculation = () => {
  // 重置状态
  calculationProgress.value = 0
  currentCalculationStep.value = 1

  // 这里可以添加实际的取消逻辑
  console.log('计算已取消')
}

// 错误状态管理
const hasCalculationError = computed(() => {
  return hasSystemErrors.value || (errors.value.length > 0 && errors.value.some(e => e.field === 'general'))
})

const errorType = computed(() => {
  const generalError = errors.value.find(e => e.field === 'general')
  if (generalError) {
    if (generalError.message.includes('Netzwerk') || generalError.message.includes('Verbindung')) {
      return 'network'
    } else if (generalError.message.includes('Eingabe') || generalError.message.includes('ungültig')) {
      return 'validation'
    } else if (generalError.message.includes('Berechnung')) {
      return 'calculation'
    }
  }
  return 'general'
})

const errorTitle = computed(() => {
  const generalError = errors.value.find(e => e.field === 'general')
  return generalError?.message || 'Ein Fehler ist aufgetreten'
})

const errorDescription = computed(() => {
  const type = errorType.value
  switch (type) {
    case 'network':
      return 'Die Verbindung zum Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung.'
    case 'validation':
      return 'Die eingegebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.'
    case 'calculation':
      return 'Die Berechnung konnte nicht durchgeführt werden. Bitte überprüfen Sie Ihre Parameter.'
    default:
      return 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.'
  }
})

const errorDetails = computed(() => {
  return systemErrors.value.map(e => e.message).join('; ') || undefined
})

const errorCode = computed(() => {
  return systemErrors.value[0]?.code || undefined
})

const errorSuggestions = computed(() => {
  const type = errorType.value
  switch (type) {
    case 'network':
      return [
        'Überprüfen Sie Ihre Internetverbindung',
        'Versuchen Sie es in ein paar Minuten erneut',
        'Kontaktieren Sie den Support, falls das Problem weiterhin besteht'
      ]
    case 'validation':
      return [
        'Überprüfen Sie alle Eingabefelder auf korrekte Werte',
        'Stellen Sie sicher, dass alle Pflichtfelder ausgefüllt sind',
        'Verwenden Sie realistische Werte für Ihre Berechnung'
      ]
    case 'calculation':
      return [
        'Reduzieren Sie die Laufzeit oder den Zinssatz',
        'Überprüfen Sie die Eingabewerte auf Plausibilität',
        'Versuchen Sie es mit kleineren Beträgen'
      ]
    default:
      return [
        'Laden Sie die Seite neu und versuchen Sie es erneut',
        'Überprüfen Sie Ihre Eingaben',
        'Kontaktieren Sie den Support, falls das Problem weiterhin besteht'
      ]
  }
})

// 错误处理方法
const retryCalculation = () => {
  clearAllErrors()
  clearErrors()
  handleSubmit()
}

const reportError = (errorInfo: any) => {
  console.log('错误报告:', errorInfo)
  // 这里可以添加实际的错误报告逻辑
}

const dismissError = () => {
  clearAllErrors()
  clearErrors()
}

const handleSubmit = async () => {
  // 清除之前的错误
  clearAllErrors()
  businessWarnings.value = []

  // 验证表单数据
  const validationResult = validateCalculatorForm(form.value)

  if (!validationResult.isValid) {
    // 设置验证错误
    setErrors(validationResult.errors)
    return
  }

  // 业务逻辑验证（警告）
  const warnings = validateBusinessLogic(form.value)
  if (warnings.length > 0) {
    businessWarnings.value = warnings.map(w => w.message)
  }

  // 执行计算
  await calculate()
}

const getFieldError = (field: string): string | undefined => {
  const error = errors.value.find((e) => e.field === field)
  return error?.message
}

const clearGeneralErrors = () => {
  errors.value = errors.value.filter(e => e.field !== 'general')
}
</script>

<style scoped>
/* 自定义滑块样式 */
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: all 0.2s ease;
}

input[type='range']::-webkit-slider-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
}

input[type='range']::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

input[type='range']::-moz-range-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
}

/* 移动端优化 */
@media (max-width: 640px) {
  .space-y-6 > * + * {
    margin-top: 1rem;
  }

  input[type='range']::-webkit-slider-thumb {
    height: 24px;
    width: 24px;
  }

  input[type='range']::-moz-range-thumb {
    height: 24px;
    width: 24px;
  }

  /* 增大触摸目标 */
  input[type='range'] {
    height: 44px;
    padding: 12px 0;
  }
}

/* 超小屏幕优化 */
@media (max-width: 375px) {
  .space-y-6 > * + * {
    margin-top: 0.75rem;
  }
}

/* 焦点状态优化 */
input[type='range']:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* 暗色模式优化 */
@media (prefers-color-scheme: dark) {
  input[type='range']::-webkit-slider-track {
    background: #374151;
  }

  input[type='range']::-moz-range-track {
    background: #374151;
  }
}
</style>
