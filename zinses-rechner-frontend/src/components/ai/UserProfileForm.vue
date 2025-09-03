<!--
  用户画像表单组件
  收集用户财务信息用于AI分析
-->

<template>
  <div class="user-profile-form">
    <!-- 表单标题 -->
    <div class="form-header mb-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ t('ai.createUserProfile') }}
      </h4>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {{ t('ai.profileDescription') }}
      </p>
    </div>

    <!-- 进度指示器 -->
    <div class="progress-indicator mb-8">
      <div class="progress-steps flex items-center justify-between">
        <div
          v-for="(step, index) in formSteps"
          :key="step.id"
          class="progress-step"
          :class="getStepClasses(index)"
        >
          <div class="step-circle">
            <CheckIcon v-if="index < currentStep" class="w-4 h-4" />
            <span v-else class="step-number">{{ index + 1 }}</span>
          </div>
          <span class="step-label">{{ step.title }}</span>
        </div>
      </div>
      
      <div class="progress-bar mt-4">
        <div 
          class="progress-fill"
          :style="{ width: `${(currentStep / (formSteps.length - 1)) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- 表单内容 -->
    <form @submit.prevent="handleSubmit" class="profile-form">
      <!-- 第一步：基本信息 -->
      <div v-if="currentStep === 0" class="form-step">
        <h5 class="step-title">{{ t('ai.basicInformation') }}</h5>
        
        <div class="form-fields grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="field-group">
            <label class="field-label">{{ t('ai.age') }} *</label>
            <input
              v-model.number="formData.age"
              type="number"
              min="18"
              max="100"
              required
              class="field-input"
              :class="{ 'error': errors.age }"
            />
            <div v-if="errors.age" class="field-error">{{ errors.age }}</div>
          </div>
          
          <div class="field-group">
            <label class="field-label">{{ t('ai.monthlyIncome') }} * (€)</label>
            <input
              v-model.number="formData.income"
              type="number"
              min="0"
              step="100"
              required
              class="field-input"
              :class="{ 'error': errors.income }"
            />
            <div v-if="errors.income" class="field-error">{{ errors.income }}</div>
          </div>
          
          <div class="field-group">
            <label class="field-label">{{ t('ai.currentSavings') }} (€)</label>
            <input
              v-model.number="formData.savings"
              type="number"
              min="0"
              step="1000"
              class="field-input"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">{{ t('ai.totalDebt') }} (€)</label>
            <input
              v-model.number="formData.debt"
              type="number"
              min="0"
              step="1000"
              class="field-input"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">{{ t('ai.monthlyExpenses') }} * (€)</label>
            <input
              v-model.number="formData.monthlyExpenses"
              type="number"
              min="0"
              step="100"
              required
              class="field-input"
              :class="{ 'error': errors.monthlyExpenses }"
            />
            <div v-if="errors.monthlyExpenses" class="field-error">{{ errors.monthlyExpenses }}</div>
          </div>
          
          <div class="field-group">
            <label class="field-label">{{ t('ai.emergencyFund') }} (€)</label>
            <input
              v-model.number="formData.emergencyFund"
              type="number"
              min="0"
              step="500"
              class="field-input"
            />
            <div class="field-hint">
              {{ t('ai.emergencyFundHint') }}
            </div>
          </div>
        </div>
      </div>

      <!-- 第二步：个人情况 -->
      <div v-if="currentStep === 1" class="form-step">
        <h5 class="step-title">{{ t('ai.personalSituation') }}</h5>
        
        <div class="form-fields space-y-6">
          <div class="field-group">
            <label class="field-label">{{ t('ai.familyStatus') }} *</label>
            <div class="radio-group">
              <label
                v-for="status in familyStatusOptions"
                :key="status.value"
                class="radio-option"
              >
                <input
                  v-model="formData.familyStatus"
                  type="radio"
                  :value="status.value"
                  class="radio-input"
                />
                <span class="radio-label">{{ status.label }}</span>
              </label>
            </div>
          </div>
          
          <div class="field-group">
            <label class="field-label">{{ t('ai.employmentStatus') }} *</label>
            <div class="radio-group">
              <label
                v-for="status in employmentStatusOptions"
                :key="status.value"
                class="radio-option"
              >
                <input
                  v-model="formData.employmentStatus"
                  type="radio"
                  :value="status.value"
                  class="radio-input"
                />
                <span class="radio-label">{{ status.label }}</span>
              </label>
            </div>
          </div>
          
          <div class="field-group">
            <label class="field-label">{{ t('ai.investmentExperience') }} *</label>
            <div class="radio-group">
              <label
                v-for="level in experienceLevels"
                :key="level.value"
                class="radio-option"
              >
                <input
                  v-model="formData.investmentExperience"
                  type="radio"
                  :value="level.value"
                  class="radio-input"
                />
                <div class="radio-content">
                  <span class="radio-label">{{ level.label }}</span>
                  <span class="radio-description">{{ level.description }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三步：投资偏好 -->
      <div v-if="currentStep === 2" class="form-step">
        <h5 class="step-title">{{ t('ai.investmentPreferences') }}</h5>
        
        <div class="form-fields space-y-6">
          <div class="field-group">
            <label class="field-label">{{ t('ai.riskTolerance') }} *</label>
            <div class="risk-tolerance-selector">
              <div
                v-for="risk in riskToleranceOptions"
                :key="risk.value"
                class="risk-option"
                :class="{ 'selected': formData.riskTolerance === risk.value }"
                @click="formData.riskTolerance = risk.value"
              >
                <div class="risk-header">
                  <component :is="risk.icon" :class="risk.iconColor" />
                  <span class="risk-title">{{ risk.label }}</span>
                </div>
                <p class="risk-description">{{ risk.description }}</p>
                <div class="risk-characteristics">
                  <div class="characteristic">
                    <span class="char-label">{{ t('ai.expectedReturn') }}:</span>
                    <span class="char-value">{{ risk.expectedReturn }}%</span>
                  </div>
                  <div class="characteristic">
                    <span class="char-label">{{ t('ai.volatility') }}:</span>
                    <span class="char-value">{{ risk.volatility }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="field-group">
            <label class="field-label">{{ t('ai.investmentTimeHorizon') }} *</label>
            <div class="time-horizon-slider">
              <input
                v-model.number="formData.timeHorizon"
                type="range"
                min="1"
                max="40"
                step="1"
                class="horizon-slider"
              />
              <div class="horizon-display">
                <span class="horizon-value">{{ formData.timeHorizon }} {{ t('ai.years') }}</span>
                <span class="horizon-description">{{ getTimeHorizonDescription() }}</span>
              </div>
            </div>
          </div>
          
          <div class="field-group">
            <label class="field-label">{{ t('ai.financialGoals') }}</label>
            <div class="goals-selector">
              <label
                v-for="goal in financialGoalsOptions"
                :key="goal.value"
                class="goal-option"
              >
                <input
                  v-model="formData.financialGoals"
                  type="checkbox"
                  :value="goal.value"
                  class="goal-checkbox"
                />
                <div class="goal-content">
                  <component :is="goal.icon" class="w-5 h-5 text-blue-500" />
                  <span class="goal-label">{{ goal.label }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 表单导航 -->
      <div class="form-navigation mt-8">
        <div class="nav-buttons flex items-center justify-between">
          <button
            v-if="currentStep > 0"
            type="button"
            @click="previousStep"
            class="nav-button secondary"
          >
            <ChevronLeftIcon class="w-4 h-4 mr-2" />
            {{ t('ai.previous') }}
          </button>
          
          <div class="nav-spacer"></div>
          
          <button
            v-if="currentStep < formSteps.length - 1"
            type="button"
            @click="nextStep"
            :disabled="!canProceed"
            class="nav-button primary"
          >
            {{ t('ai.next') }}
            <ChevronRightIcon class="w-4 h-4 ml-2" />
          </button>
          
          <button
            v-else
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="nav-button primary"
          >
            <SparklesIcon v-if="!isSubmitting" class="w-4 h-4 mr-2" />
            <ArrowPathIcon v-else class="w-4 h-4 mr-2 animate-spin" />
            {{ isSubmitting ? t('ai.creating') : t('ai.createProfile') }}
          </button>
        </div>
        
        <!-- 表单验证错误 -->
        <div v-if="Object.keys(errors).length > 0" class="form-errors mt-4">
          <div class="error-summary">
            <ExclamationTriangleIcon class="w-5 h-5 text-red-500" />
            <span class="error-text">{{ t('ai.pleaseFixErrors') }}</span>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ScaleIcon,
  FireIcon,
  HomeIcon,
  AcademicCapIcon,
  HeartIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  GlobeAltIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'
import type { UserProfile } from '@/services/AIAdvisorManager'

// Emits
interface Emits {
  'profile-created': [profile: UserProfile]
  'profile-updated': [profile: UserProfile]
}

const emit = defineEmits<Emits>()

// 使用服务
const { t } = useI18n()

// 响应式状态
const currentStep = ref(0)
const isSubmitting = ref(false)
const errors = reactive<Record<string, string>>({})

// 表单数据
const formData = reactive<UserProfile>({
  age: 30,
  income: 3500,
  savings: 10000,
  debt: 0,
  riskTolerance: 'moderate',
  investmentExperience: 'beginner',
  financialGoals: [],
  timeHorizon: 10,
  familyStatus: 'single',
  employmentStatus: 'employed',
  monthlyExpenses: 2000,
  emergencyFund: 5000
})

// 表单步骤配置
const formSteps = [
  { id: 'basic', title: t('ai.basicInfo') },
  { id: 'personal', title: t('ai.personalInfo') },
  { id: 'preferences', title: t('ai.preferences') }
]

// 选项配置
const familyStatusOptions = [
  { value: 'single', label: t('ai.single') },
  { value: 'married', label: t('ai.married') },
  { value: 'family', label: t('ai.family') }
]

const employmentStatusOptions = [
  { value: 'employed', label: t('ai.employed') },
  { value: 'self-employed', label: t('ai.selfEmployed') },
  { value: 'retired', label: t('ai.retired') }
]

const experienceLevels = [
  {
    value: 'beginner',
    label: t('ai.beginner'),
    description: t('ai.beginnerDescription')
  },
  {
    value: 'intermediate',
    label: t('ai.intermediate'),
    description: t('ai.intermediateDescription')
  },
  {
    value: 'advanced',
    label: t('ai.advanced'),
    description: t('ai.advancedDescription')
  }
]

const riskToleranceOptions = [
  {
    value: 'conservative',
    label: t('ai.conservative'),
    description: t('ai.conservativeDescription'),
    icon: ShieldCheckIcon,
    iconColor: 'w-6 h-6 text-green-500',
    expectedReturn: 4.5,
    volatility: 8
  },
  {
    value: 'moderate',
    label: t('ai.moderate'),
    description: t('ai.moderateDescription'),
    icon: ScaleIcon,
    iconColor: 'w-6 h-6 text-blue-500',
    expectedReturn: 7,
    volatility: 12
  },
  {
    value: 'aggressive',
    label: t('ai.aggressive'),
    description: t('ai.aggressiveDescription'),
    icon: FireIcon,
    iconColor: 'w-6 h-6 text-red-500',
    expectedReturn: 9.5,
    volatility: 18
  }
]

const financialGoalsOptions = [
  { value: 'retirement', label: t('ai.retirementGoal'), icon: HomeIcon },
  { value: 'education', label: t('ai.educationGoal'), icon: AcademicCapIcon },
  { value: 'family', label: t('ai.familyGoal'), icon: HeartIcon },
  { value: 'wealth', label: t('ai.wealthGoal'), icon: CurrencyDollarIcon },
  { value: 'business', label: t('ai.businessGoal'), icon: BuildingOfficeIcon },
  { value: 'travel', label: t('ai.travelGoal'), icon: GlobeAltIcon }
]

// 计算属性
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return formData.age > 0 && formData.income > 0 && formData.monthlyExpenses > 0
    case 1:
      return formData.familyStatus && formData.employmentStatus && formData.investmentExperience
    case 2:
      return formData.riskTolerance && formData.timeHorizon > 0
    default:
      return false
  }
})

const isFormValid = computed(() => {
  return Object.keys(errors).length === 0 && canProceed.value
})

// 方法
const getStepClasses = (index: number): string[] => {
  const classes = ['flex', 'flex-col', 'items-center', 'space-y-2']
  
  if (index < currentStep.value) {
    classes.push('completed')
  } else if (index === currentStep.value) {
    classes.push('current')
  } else {
    classes.push('pending')
  }
  
  return classes
}

const getTimeHorizonDescription = (): string => {
  const years = formData.timeHorizon
  
  if (years <= 3) return t('ai.shortTerm')
  if (years <= 10) return t('ai.mediumTerm')
  return t('ai.longTerm')
}

const validateCurrentStep = (): boolean => {
  errors.age = ''
  errors.income = ''
  errors.monthlyExpenses = ''

  let isValid = true

  if (currentStep.value === 0) {
    if (!formData.age || formData.age < 18 || formData.age > 100) {
      errors.age = t('ai.ageError')
      isValid = false
    }
    
    if (!formData.income || formData.income <= 0) {
      errors.income = t('ai.incomeError')
      isValid = false
    }
    
    if (!formData.monthlyExpenses || formData.monthlyExpenses <= 0) {
      errors.monthlyExpenses = t('ai.expensesError')
      isValid = false
    }
    
    if (formData.monthlyExpenses >= formData.income) {
      errors.monthlyExpenses = t('ai.expensesTooHighError')
      isValid = false
    }
  }

  return isValid
}

const nextStep = (): void => {
  if (validateCurrentStep() && canProceed.value) {
    currentStep.value++
  }
}

const previousStep = (): void => {
  if (currentStep.value > 0) {
    currentStep.value--
    // 清除错误
    Object.keys(errors).forEach(key => {
      errors[key] = ''
    })
  }
}

const handleSubmit = async (): Promise<void> => {
  if (!isFormValid.value) return

  isSubmitting.value = true

  try {
    // 验证整个表单
    if (!validateCurrentStep()) {
      return
    }

    // 创建用户画像
    const profile: UserProfile = { ...formData }
    
    // 发出事件
    emit('profile-created', profile)
    
    console.log('✅ User profile created:', profile)
  } catch (error) {
    console.error('❌ Profile creation failed:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.user-profile-form {
  @apply max-w-4xl mx-auto;
}

.progress-step {
  @apply flex-1 text-center;
}

.step-circle {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-2 transition-colors duration-200;
}

.progress-step.completed .step-circle {
  @apply bg-green-500 text-white;
}

.progress-step.current .step-circle {
  @apply bg-blue-500 text-white;
}

.progress-step.pending .step-circle {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400;
}

.step-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.progress-step.completed .step-label,
.progress-step.current .step-label {
  @apply text-gray-900 dark:text-white font-medium;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-blue-500 transition-all duration-500;
}

.step-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-6;
}

.field-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.field-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200;
}

.field-input.error {
  @apply border-red-500 focus:ring-red-500;
}

.field-error {
  @apply text-sm text-red-600 dark:text-red-400 mt-1;
}

.field-hint {
  @apply text-xs text-gray-500 dark:text-gray-500 mt-1;
}

.radio-group {
  @apply space-y-3;
}

.radio-option {
  @apply flex items-start space-x-3 cursor-pointer;
}

.radio-input {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2 mt-0.5;
}

.radio-label {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.radio-description {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.risk-tolerance-selector {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.risk-option {
  @apply p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600;
}

.risk-option.selected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.risk-header {
  @apply flex items-center space-x-2 mb-2;
}

.risk-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.risk-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-3;
}

.risk-characteristics {
  @apply space-y-1;
}

.characteristic {
  @apply flex justify-between text-xs;
}

.char-label {
  @apply text-gray-600 dark:text-gray-400;
}

.char-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.time-horizon-slider {
  @apply space-y-3;
}

.horizon-slider {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer;
}

.horizon-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-blue-500 rounded-full cursor-pointer;
}

.horizon-display {
  @apply text-center;
}

.horizon-value {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.horizon-description {
  @apply text-sm text-gray-600 dark:text-gray-400 ml-2;
}

.goals-selector {
  @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}

.goal-option {
  @apply flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200;
}

.goal-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.goal-content {
  @apply flex items-center space-x-2;
}

.goal-label {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.nav-button {
  @apply flex items-center px-6 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.nav-button.primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:ring-blue-500;
}

.nav-button.secondary {
  @apply text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500;
}

.nav-spacer {
  @apply flex-1;
}

.form-errors {
  @apply bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4;
}

.error-summary {
  @apply flex items-center space-x-2;
}

.error-text {
  @apply text-sm text-red-700 dark:text-red-400;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .form-fields.grid {
    @apply grid-cols-1;
  }
  
  .risk-tolerance-selector {
    @apply grid-cols-1;
  }
  
  .goals-selector {
    @apply grid-cols-1;
  }
  
  .nav-buttons {
    @apply flex-col space-y-3;
  }
  
  .nav-spacer {
    @apply hidden;
  }
}

/* 动画 */
.form-step {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
