<!--
  风险评估问卷组件
  收集用户信息以生成个性化的AI建议
-->

<template>
  <div class="risk-assessment-questionnaire">
    <!-- 问卷头部 -->
    <div class="questionnaire-header">
      <div class="header-content">
        <div class="icon-container">
          <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div class="header-text">
          <h2 class="questionnaire-title">Persönliche Finanzanalyse</h2>
          <p class="questionnaire-subtitle">
            Beantworten Sie einige Fragen, um personalisierte AI-Empfehlungen zu erhalten
          </p>
        </div>
      </div>
      
      <!-- 进度条 -->
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
        <div class="progress-text">
          Schritt {{ currentStep }} von {{ totalSteps }}
        </div>
      </div>
    </div>

    <!-- 问卷内容 -->
    <div class="questionnaire-content">
      <form @submit.prevent="handleSubmit">
        <!-- 步骤1: 基本信息 -->
        <div v-if="currentStep === 1" class="step-content">
          <h3 class="step-title">Grundlegende Informationen</h3>
          
          <div class="form-group">
            <label for="age" class="form-label">Alter</label>
            <input
              id="age"
              v-model.number="formData.age"
              type="number"
              min="18"
              max="100"
              class="form-input"
              placeholder="z.B. 35"
              required
            />
          </div>

          <div class="form-group">
            <label for="monthlyIncome" class="form-label">Netto-Monatseinkommen (€)</label>
            <input
              id="monthlyIncome"
              v-model.number="formData.monthlyIncome"
              type="number"
              min="0"
              class="form-input"
              placeholder="z.B. 3500"
              required
            />
          </div>

          <div class="form-group">
            <label for="monthlyExpenses" class="form-label">Monatliche Ausgaben (€)</label>
            <input
              id="monthlyExpenses"
              v-model.number="formData.monthlyExpenses"
              type="number"
              min="0"
              class="form-input"
              placeholder="z.B. 2500"
              required
            />
          </div>

          <div class="form-group">
            <label for="dependents" class="form-label">Anzahl Angehörige</label>
            <select id="dependents" v-model.number="formData.dependents" class="form-select" required>
              <option value="0">Keine</option>
              <option value="1">1 Person</option>
              <option value="2">2 Personen</option>
              <option value="3">3 Personen</option>
              <option value="4">4+ Personen</option>
            </select>
          </div>
        </div>

        <!-- 步骤2: 财务状况 -->
        <div v-if="currentStep === 2" class="step-content">
          <h3 class="step-title">Ihre finanzielle Situation</h3>
          
          <div class="form-group">
            <label for="currentAssets" class="form-label">Vorhandene Vermögenswerte (€)</label>
            <input
              id="currentAssets"
              v-model.number="formData.currentAssets"
              type="number"
              min="0"
              class="form-input"
              placeholder="z.B. 50000"
            />
            <p class="form-help">Ersparnisse, Investitionen, Immobilien (ohne Eigenheim)</p>
          </div>

          <div class="form-group">
            <label for="currentDebt" class="form-label">Bestehende Schulden (€)</label>
            <input
              id="currentDebt"
              v-model.number="formData.currentDebt"
              type="number"
              min="0"
              class="form-input"
              placeholder="z.B. 150000"
            />
            <p class="form-help">Hypotheken, Kredite, Kreditkarten</p>
          </div>

          <div class="form-group">
            <label for="timeHorizon" class="form-label">Anlagehorizont (Jahre)</label>
            <select id="timeHorizon" v-model.number="formData.timeHorizon" class="form-select" required>
              <option value="1">Weniger als 1 Jahr</option>
              <option value="3">1-3 Jahre</option>
              <option value="7">3-7 Jahre</option>
              <option value="15">7-15 Jahre</option>
              <option value="25">15-25 Jahre</option>
              <option value="30">Mehr als 25 Jahre</option>
            </select>
          </div>
        </div>

        <!-- 步骤3: 投资经验和风险偏好 -->
        <div v-if="currentStep === 3" class="step-content">
          <h3 class="step-title">Investmenterfahrung und Risikoprofil</h3>
          
          <div class="form-group">
            <label class="form-label">Ihre Investmenterfahrung</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  v-model="formData.investmentExperience"
                  type="radio"
                  value="beginner"
                  class="radio-input"
                />
                <span class="radio-label">
                  <strong>Anfänger</strong>
                  <span class="radio-description">Wenig bis keine Erfahrung mit Investitionen</span>
                </span>
              </label>
              
              <label class="radio-option">
                <input
                  v-model="formData.investmentExperience"
                  type="radio"
                  value="intermediate"
                  class="radio-input"
                />
                <span class="radio-label">
                  <strong>Fortgeschritten</strong>
                  <span class="radio-description">Einige Jahre Erfahrung mit verschiedenen Anlagen</span>
                </span>
              </label>
              
              <label class="radio-option">
                <input
                  v-model="formData.investmentExperience"
                  type="radio"
                  value="advanced"
                  class="radio-input"
                />
                <span class="radio-label">
                  <strong>Experte</strong>
                  <span class="radio-description">Umfangreiche Erfahrung und tiefes Verständnis</span>
                </span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Ihre Risikotoleranz</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  v-model="formData.riskTolerance"
                  type="radio"
                  value="conservative"
                  class="radio-input"
                />
                <span class="radio-label">
                  <strong>Konservativ</strong>
                  <span class="radio-description">Kapitalerhalt ist wichtiger als hohe Renditen</span>
                </span>
              </label>
              
              <label class="radio-option">
                <input
                  v-model="formData.riskTolerance"
                  type="radio"
                  value="moderate"
                  class="radio-input"
                />
                <span class="radio-label">
                  <strong>Ausgewogen</strong>
                  <span class="radio-description">Balance zwischen Sicherheit und Wachstum</span>
                </span>
              </label>
              
              <label class="radio-option">
                <input
                  v-model="formData.riskTolerance"
                  type="radio"
                  value="aggressive"
                  class="radio-input"
                />
                <span class="radio-label">
                  <strong>Risikofreudig</strong>
                  <span class="radio-description">Bereit für höhere Risiken für bessere Renditen</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- 步骤4: 财务目标 -->
        <div v-if="currentStep === 4" class="step-content">
          <h3 class="step-title">Ihre finanziellen Ziele</h3>
          
          <div class="form-group">
            <label class="form-label">Welche Ziele verfolgen Sie? (Mehrfachauswahl möglich)</label>
            <div class="checkbox-group">
              <label
                v-for="goal in availableGoals"
                :key="goal.value"
                class="checkbox-option"
              >
                <input
                  v-model="formData.financialGoals"
                  type="checkbox"
                  :value="goal.value"
                  class="checkbox-input"
                />
                <span class="checkbox-label">
                  <strong>{{ goal.label }}</strong>
                  <span class="checkbox-description">{{ goal.description }}</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="form-navigation">
          <button
            v-if="currentStep > 1"
            type="button"
            class="nav-button nav-button-secondary"
            @click="previousStep"
          >
            Zurück
          </button>
          
          <button
            v-if="currentStep < totalSteps"
            type="button"
            class="nav-button nav-button-primary"
            @click="nextStep"
            :disabled="!isCurrentStepValid"
          >
            Weiter
          </button>
          
          <button
            v-if="currentStep === totalSteps"
            type="submit"
            class="nav-button nav-button-primary"
            :disabled="!isFormValid || isSubmitting"
          >
            <span v-if="isSubmitting">Wird analysiert...</span>
            <span v-else>Analyse starten</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { UserProfile } from '@/services/AIAdvisorService'

interface Props {
  initialData?: Partial<UserProfile>
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({})
})

const emit = defineEmits<{
  complete: [profile: UserProfile]
  cancel: []
}>()

// 表单状态
const currentStep = ref(1)
const totalSteps = 4
const isSubmitting = ref(false)

// 表单数据
const formData = reactive<UserProfile>({
  age: 35,
  riskTolerance: 'moderate',
  investmentExperience: 'intermediate',
  financialGoals: [],
  timeHorizon: 15,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  currentAssets: 0,
  currentDebt: 0,
  dependents: 0,
  ...props.initialData
})

// 可选的财务目标
const availableGoals = [
  {
    value: 'retirement',
    label: 'Altersvorsorge',
    description: 'Aufbau eines Vermögens für den Ruhestand'
  },
  {
    value: 'house',
    label: 'Immobilienkauf',
    description: 'Sparen für den Kauf einer Immobilie'
  },
  {
    value: 'education',
    label: 'Bildung/Ausbildung',
    description: 'Finanzierung von Bildungskosten'
  },
  {
    value: 'emergency',
    label: 'Notfallfonds',
    description: 'Aufbau einer finanziellen Reserve'
  },
  {
    value: 'travel',
    label: 'Reisen',
    description: 'Sparen für Urlaub und Reisen'
  },
  {
    value: 'business',
    label: 'Unternehmensgründung',
    description: 'Kapital für eigenes Unternehmen'
  },
  {
    value: 'wealth',
    label: 'Vermögensaufbau',
    description: 'Langfristiger Aufbau von Wohlstand'
  }
]

// 验证逻辑
const isCurrentStepValid = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.age > 0 && formData.monthlyIncome > 0 && formData.monthlyExpenses > 0
    case 2:
      return formData.timeHorizon > 0
    case 3:
      return formData.investmentExperience && formData.riskTolerance
    case 4:
      return formData.financialGoals.length > 0
    default:
      return false
  }
})

const isFormValid = computed(() => {
  return formData.age > 0 &&
         formData.monthlyIncome > 0 &&
         formData.monthlyExpenses > 0 &&
         formData.timeHorizon > 0 &&
         formData.investmentExperience &&
         formData.riskTolerance &&
         formData.financialGoals.length > 0
})

// 导航方法
const nextStep = () => {
  if (currentStep.value < totalSteps && isCurrentStepValid.value) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// 提交处理
const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    emit('complete', { ...formData })
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.risk-assessment-questionnaire {
  @apply max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg;
}

.questionnaire-header {
  @apply mb-8;
}

.header-content {
  @apply flex items-center mb-6;
}

.icon-container {
  @apply flex-shrink-0 mr-4;
}

.header-text {
  @apply flex-1;
}

.questionnaire-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-2;
}

.questionnaire-subtitle {
  @apply text-gray-600 dark:text-gray-400;
}

.progress-container {
  @apply space-y-2;
}

.progress-bar {
  @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2;
}

.progress-fill {
  @apply bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out;
}

.progress-text {
  @apply text-sm text-gray-600 dark:text-gray-400 text-center;
}

.step-content {
  @apply space-y-6;
}

.step-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-6;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input,
.form-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         transition-colors;
}

.form-help {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.radio-group,
.checkbox-group {
  @apply space-y-3;
}

.radio-option,
.checkbox-option {
  @apply flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg
         hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors;
}

.radio-input,
.checkbox-input {
  @apply mt-1 mr-3 flex-shrink-0;
}

.radio-label,
.checkbox-label {
  @apply flex-1;
}

.radio-label strong,
.checkbox-label strong {
  @apply block text-gray-900 dark:text-white font-medium;
}

.radio-description,
.checkbox-description {
  @apply block text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.form-navigation {
  @apply flex justify-between items-center pt-6 mt-8 border-t border-gray-200 dark:border-gray-700;
}

.nav-button {
  @apply px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.nav-button-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600;
}

.nav-button-secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         hover:bg-gray-300 dark:hover:bg-gray-600;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .risk-assessment-questionnaire {
    @apply p-4;
  }
  
  .header-content {
    @apply flex-col text-center;
  }
  
  .icon-container {
    @apply mr-0 mb-4;
  }
  
  .form-navigation {
    @apply flex-col space-y-3;
  }
  
  .nav-button {
    @apply w-full;
  }
}
</style>
