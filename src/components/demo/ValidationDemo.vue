<template>
  <div class="validation-demo max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        🔍 Erweiterte Formularvalidierung
      </h2>
      <p class="text-gray-600">
        Demonstration der verbesserten Echtzeit-Validierung mit intelligenten Vorschlägen und Warnungen.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 表单区域 -->
      <div class="space-y-6">
        <BaseCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">
              Zinseszins-Rechner Formular
            </h3>
          </template>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- 起始资本 -->
            <EnhancedFormField
              v-model="formData.principal"
              type="currency"
              label="Startkapital"
              placeholder="Geben Sie Ihr Startkapital ein"
              help-text="Das anfängliche Kapital, das Sie investieren möchten"
              :validation-rules="businessRules.principal"
              :quick-values="principalQuickValues"
              required
              @validate="handleFieldValidation('principal', $event)"
            />

            <!-- 月度储蓄 -->
            <EnhancedFormField
              v-model="formData.monthlyPayment"
              type="currency"
              label="Monatliche Sparrate"
              placeholder="Monatlicher Sparbetrag"
              help-text="Betrag, den Sie jeden Monat zusätzlich sparen"
              :validation-rules="businessRules.monthlyPayment"
              :quick-values="monthlyQuickValues"
              optional
              @validate="handleFieldValidation('monthlyPayment', $event)"
            />

            <!-- 年利率 -->
            <EnhancedFormField
              v-model="formData.annualRate"
              type="percentage"
              label="Jährlicher Zinssatz"
              placeholder="Erwartete jährliche Rendite"
              help-text="Die erwartete jährliche Rendite Ihrer Investition"
              :validation-rules="businessRules.annualRate"
              :quick-values="rateQuickValues"
              required
              @validate="handleFieldValidation('annualRate', $event)"
            />

            <!-- 投资年限 -->
            <EnhancedFormField
              v-model="formData.years"
              type="number"
              label="Anlagedauer"
              placeholder="Anzahl Jahre"
              help-text="Wie lange möchten Sie das Geld anlegen?"
              :validation-rules="businessRules.years"
              :quick-values="yearsQuickValues"
              required
              @validate="handleFieldValidation('years', $event)"
            />

            <!-- 提交按钮 -->
            <div class="flex justify-between items-center pt-4">
              <div class="text-sm text-gray-600">
                <span v-if="validFields === totalFields && totalFields > 0" class="text-green-600">
                  ✅ Alle Felder sind gültig
                </span>
                <span v-else class="text-gray-500">
                  {{ validFields }}/{{ totalFields }} Felder gültig
                </span>
              </div>
              
              <BaseButton
                type="submit"
                variant="primary"
                :disabled="!isFormValid || isSubmitting"
                :loading="isSubmitting"
              >
                Berechnen
              </BaseButton>
            </div>
          </form>
        </BaseCard>
      </div>

      <!-- 验证状态区域 -->
      <div class="space-y-6">
        <!-- 实时验证状态 -->
        <BaseCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">
              📊 Validierungsstatus
            </h3>
          </template>

          <div class="space-y-4">
            <div
              v-for="(fieldName, index) in Object.keys(formData)"
              :key="fieldName"
              class="p-3 rounded-lg border"
              :class="getFieldStatusClasses(fieldName)"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">{{ getFieldLabel(fieldName) }}</span>
                <div class="flex items-center space-x-2">
                  <BaseIcon
                    v-if="getFieldState(fieldName).isValid"
                    name="check-circle"
                    class="h-4 w-4 text-green-500"
                  />
                  <BaseIcon
                    v-else-if="getFieldState(fieldName).errors.length > 0"
                    name="exclamation-circle"
                    class="h-4 w-4 text-red-500"
                  />
                  <BaseIcon
                    v-else
                    name="clock"
                    class="h-4 w-4 text-gray-400"
                  />
                </div>
              </div>

              <!-- 错误信息 -->
              <div v-if="getFieldState(fieldName).errors.length > 0" class="mb-2">
                <div
                  v-for="error in getFieldState(fieldName).errors"
                  :key="error"
                  class="text-xs text-red-600 flex items-center"
                >
                  <BaseIcon name="x-circle" class="h-3 w-3 mr-1" />
                  {{ error }}
                </div>
              </div>

              <!-- 警告信息 -->
              <div v-if="getFieldState(fieldName).warnings.length > 0" class="mb-2">
                <div
                  v-for="warning in getFieldState(fieldName).warnings"
                  :key="warning"
                  class="text-xs text-yellow-600 flex items-center"
                >
                  <BaseIcon name="exclamation-triangle" class="h-3 w-3 mr-1" />
                  {{ warning }}
                </div>
              </div>

              <!-- 建议信息 -->
              <div v-if="getFieldState(fieldName).suggestions.length > 0">
                <div
                  v-for="suggestion in getFieldState(fieldName).suggestions"
                  :key="suggestion"
                  class="text-xs text-blue-600 flex items-center"
                >
                  <BaseIcon name="light-bulb" class="h-3 w-3 mr-1" />
                  {{ suggestion }}
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- 验证统计 -->
        <BaseCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">
              📈 Validierungsstatistiken
            </h3>
          </template>

          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-3 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ validFields }}</div>
              <div class="text-sm text-green-700">Gültige Felder</div>
            </div>
            
            <div class="text-center p-3 bg-red-50 rounded-lg">
              <div class="text-2xl font-bold text-red-600">{{ invalidFields }}</div>
              <div class="text-sm text-red-700">Fehlerhafte Felder</div>
            </div>
            
            <div class="text-center p-3 bg-yellow-50 rounded-lg">
              <div class="text-2xl font-bold text-yellow-600">{{ totalWarnings }}</div>
              <div class="text-sm text-yellow-700">Warnungen</div>
            </div>
            
            <div class="text-center p-3 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ totalSuggestions }}</div>
              <div class="text-sm text-blue-700">Vorschläge</div>
            </div>
          </div>
        </BaseCard>

        <!-- 表单数据预览 -->
        <BaseCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">
              🔍 Formulardaten
            </h3>
          </template>

          <pre class="text-xs bg-gray-50 p-3 rounded-lg overflow-auto">{{ JSON.stringify(formData, null, 2) }}</pre>
        </BaseCard>
      </div>
    </div>

    <!-- 成功消息 -->
    <div v-if="showSuccess" class="mt-6">
      <div class="bg-green-50 border border-green-200 rounded-md p-4">
        <div class="flex">
          <BaseIcon name="check-circle" class="h-5 w-5 text-green-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">
              Formular erfolgreich validiert!
            </h3>
            <div class="mt-2 text-sm text-green-700">
              <p>Alle Eingaben sind gültig und die Berechnung kann durchgeführt werden.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useEnhancedValidation, businessRules } from '@/composables/useValidation'
import EnhancedFormField from '@/components/ui/EnhancedFormField.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'

// 表单数据
const formData = reactive({
  principal: 0,
  monthlyPayment: 0,
  annualRate: 0,
  years: 0
})

// 验证系统
const { getFieldState, validateFieldRealtime } = useEnhancedValidation()

// 状态管理
const isSubmitting = ref(false)
const showSuccess = ref(false)

// 快捷值配置
const principalQuickValues = [
  { value: 1000, label: '1.000€' },
  { value: 5000, label: '5.000€' },
  { value: 10000, label: '10.000€' },
  { value: 25000, label: '25.000€' },
  { value: 50000, label: '50.000€' }
]

const monthlyQuickValues = [
  { value: 50, label: '50€' },
  { value: 100, label: '100€' },
  { value: 250, label: '250€' },
  { value: 500, label: '500€' },
  { value: 1000, label: '1.000€' }
]

const rateQuickValues = [
  { value: 2, label: '2%' },
  { value: 4, label: '4%' },
  { value: 6, label: '6%' },
  { value: 8, label: '8%' },
  { value: 10, label: '10%' }
]

const yearsQuickValues = [
  { value: 5, label: '5 Jahre' },
  { value: 10, label: '10 Jahre' },
  { value: 15, label: '15 Jahre' },
  { value: 20, label: '20 Jahre' },
  { value: 30, label: '30 Jahre' }
]

// 计算属性
const totalFields = computed(() => Object.keys(formData).length)

const validFields = computed(() => {
  return Object.keys(formData).filter(fieldName => 
    getFieldState(fieldName).isValid
  ).length
})

const invalidFields = computed(() => {
  return Object.keys(formData).filter(fieldName => 
    getFieldState(fieldName).errors.length > 0
  ).length
})

const totalWarnings = computed(() => {
  return Object.keys(formData).reduce((total, fieldName) => 
    total + getFieldState(fieldName).warnings.length, 0
  )
})

const totalSuggestions = computed(() => {
  return Object.keys(formData).reduce((total, fieldName) => 
    total + getFieldState(fieldName).suggestions.length, 0
  )
})

const isFormValid = computed(() => validFields.value === totalFields.value)

// 方法
const handleFieldValidation = async (fieldName: string, { isValid, errors }: { isValid: boolean, errors: string[] }) => {
  // 验证逻辑已在 EnhancedFormField 中处理
  console.log(`Field ${fieldName} validation:`, { isValid, errors })
}

const getFieldLabel = (fieldName: string): string => {
  const labels: Record<string, string> = {
    principal: 'Startkapital',
    monthlyPayment: 'Monatliche Sparrate',
    annualRate: 'Jährlicher Zinssatz',
    years: 'Anlagedauer'
  }
  return labels[fieldName] || fieldName
}

const getFieldStatusClasses = (fieldName: string) => {
  const state = getFieldState(fieldName)
  
  if (state.errors.length > 0) {
    return 'border-red-200 bg-red-50'
  }
  if (state.isValid) {
    return 'border-green-200 bg-green-50'
  }
  if (state.warnings.length > 0) {
    return 'border-yellow-200 bg-yellow-50'
  }
  return 'border-gray-200 bg-gray-50'
}

const handleSubmit = async () => {
  isSubmitting.value = true
  showSuccess.value = false
  
  try {
    // 模拟提交延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (isFormValid.value) {
      showSuccess.value = true
      console.log('Form submitted successfully:', formData)
    }
  } catch (error) {
    console.error('Form submission error:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.validation-demo {
  @apply min-h-screen bg-gray-50;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
