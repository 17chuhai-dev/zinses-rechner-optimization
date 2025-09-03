<template>
  <div class="mobile-calculator-form">
    <!-- 移动端表单容器 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- 表单头部 -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-4 text-white">
        <div class="flex items-center space-x-3">
          <BaseIcon :name="calculator.icon || 'calculator'" size="lg" />
          <div>
            <h2 class="text-lg font-semibold">{{ calculator.name }}</h2>
            <p class="text-sm text-blue-100">{{ calculator.description }}</p>
          </div>
        </div>
      </div>

      <!-- 表单内容 -->
      <div class="p-4">
        <!-- 增强的分步表单（移动端友好） -->
        <div v-if="isMobileStepForm" class="space-y-6">
          <!-- 增强的步骤指示器 -->
          <div class="step-indicator mb-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div
                  v-for="(step, index) in formSteps"
                  :key="index"
                  class="step-dot relative"
                  :class="getStepDotClass(index + 1)"
                  @click="goToStep(index + 1)"
                >
                  <div class="step-number">
                    <CheckIcon
                      v-if="currentStep > index + 1"
                      class="w-3 h-3 text-white"
                    />
                    <span v-else class="text-xs font-medium">{{ index + 1 }}</span>
                  </div>
                  <div
                    v-if="index < formSteps.length - 1"
                    class="step-connector"
                    :class="currentStep > index + 1 ? 'bg-blue-600' : 'bg-gray-300'"
                  ></div>
                </div>
              </div>
              <div class="text-xs text-gray-500">
                {{ currentStep }} / {{ formSteps.length }}
              </div>
            </div>

            <!-- 步骤标题和描述 -->
            <div class="mt-4 text-center">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ formSteps[currentStep - 1]?.title }}
              </h3>
              <p v-if="formSteps[currentStep - 1]?.description" class="text-sm text-gray-600 mt-1">
                {{ formSteps[currentStep - 1]?.description }}
              </p>
            </div>
          </div>

          <!-- 步骤进度条 -->
          <div class="progress-bar mb-6">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                :style="{ width: `${(currentStep / formSteps.length) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- 当前步骤内容 -->
          <div class="step-content">
            <div class="min-h-64 relative">
              <!-- 步骤切换动画容器 -->
              <Transition
                :name="stepTransition"
                mode="out-in"
                @before-enter="onBeforeEnter"
                @enter="onEnter"
                @leave="onLeave"
              >
                <div :key="currentStep" class="step-fields space-y-4">
                  <div
                    v-for="(field, fieldIndex) in formSteps[currentStep - 1]?.fields"
                    :key="field.name"
                    class="field-container"
                    :style="{ animationDelay: `${fieldIndex * 100}ms` }"
                  >
                    <!-- 增强的移动端输入组件 -->
                    <EnhancedMobileFormField
                      :field="field"
                      :value="formData[field.name]"
                      :error-message="fieldErrors[field.name]"
                      :is-focused="focusedField === field.name"
                      :show-suggestions="showFieldSuggestions"
                      @update="updateField"
                      @focus="handleFieldFocus"
                      @blur="handleFieldBlur"
                      @validate="handleFieldValidation"
                    />
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- 智能输入提示 -->
          <div v-if="showInputHints && currentStepHint" class="input-hints">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="flex items-start">
                <LightBulbIcon class="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div class="flex-1">
                  <p class="text-sm text-blue-800">{{ currentStepHint }}</p>
                  <button
                    v-if="currentStepExample"
                    @click="applyExample"
                    class="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                  >
                    Beispiel verwenden
                  </button>
                </div>
                <button
                  @click="showInputHints = false"
                  class="text-blue-400 hover:text-blue-600 ml-2"
                >
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 增强的步骤导航 -->
          <div class="step-navigation pt-6">
            <div class="flex justify-between items-center mb-4">
              <!-- 返回按钮 -->
              <BaseButton
                variant="outline"
                size="lg"
                class="flex-1 mr-3"
                :disabled="currentStep === 1"
                @click="previousStep"
              >
                <ArrowLeftIcon class="w-4 h-4 mr-2" />
                Zurück
              </BaseButton>

              <!-- 前进/计算按钮 -->
              <BaseButton
                v-if="currentStep < formSteps.length"
                variant="primary"
                size="lg"
                class="flex-1"
                :disabled="!canProceedToNextStep"
                @click="nextStep"
              >
                Weiter
                <ArrowRightIcon class="w-4 h-4 ml-2" />
              </BaseButton>

              <BaseButton
                v-else
                variant="primary"
                size="lg"
                class="flex-1"
                :loading="isCalculating"
                :disabled="!isFormValid"
                @click="calculate"
              >
                <CalculatorIcon class="w-4 h-4 mr-2" />
                Berechnen
              </BaseButton>
            </div>

            <!-- 快速操作按钮 -->
            <div v-if="showQuickActions" class="quick-actions">
              <div class="grid grid-cols-3 gap-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="resetForm"
                  class="text-xs"
                >
                  <ArrowPathIcon class="w-3 h-3 mr-1" />
                  Reset
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="loadExample"
                  class="text-xs"
                >
                  <LightBulbIcon class="w-3 h-3 mr-1" />
                  Beispiel
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="saveAsDraft"
                  class="text-xs"
                >
                  <BookmarkIcon class="w-3 h-3 mr-1" />
                  Speichern
                </BaseButton>
              </div>
            </div>

            <!-- 键盘快捷键提示 -->
            <div v-if="showKeyboardHints" class="keyboard-hints mt-3">
              <div class="flex justify-center space-x-4 text-xs text-gray-500">
                <span v-if="currentStep > 1">
                  <kbd class="kbd">←</kbd> Zurück
                </span>
                <span v-if="currentStep < formSteps.length">
                  <kbd class="kbd">→</kbd> Weiter
                </span>
                <span v-else>
                  <kbd class="kbd">Enter</kbd> Berechnen
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 紧凑表单（简单计算器） -->
        <div v-else class="space-y-4">
          <div
            v-for="field in allFields"
            :key="field.name"
            class="space-y-2"
          >
            <MobileFormField
              :field="field"
              :value="formData[field.name]"
              @update="updateField"
            />
          </div>

          <!-- 计算按钮 -->
          <div class="pt-4">
            <BaseButton
              variant="primary"
              size="lg"
              class="w-full"
              :loading="isCalculating"
              :disabled="!isFormValid"
              @click="calculate"
            >
              <BaseIcon name="calculator" size="sm" class="mr-2" />
              Jetzt berechnen
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端快速操作面板 -->
    <div v-if="showQuickActions" class="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 class="text-md font-semibold text-gray-900 mb-3">Schnellaktionen</h3>

      <div class="grid grid-cols-2 gap-3">
        <BaseButton
          variant="secondary"
          size="sm"
          class="flex flex-col items-center space-y-1 py-3"
          @click="loadExample"
        >
          <BaseIcon name="lightbulb" size="sm" />
          <span class="text-xs">Beispiel laden</span>
        </BaseButton>

        <BaseButton
          variant="secondary"
          size="sm"
          class="flex flex-col items-center space-y-1 py-3"
          @click="resetForm"
        >
          <BaseIcon name="refresh" size="sm" />
          <span class="text-xs">Zurücksetzen</span>
        </BaseButton>

        <BaseButton
          variant="secondary"
          size="sm"
          class="flex flex-col items-center space-y-1 py-3"
          @click="saveAsDraft"
        >
          <BaseIcon name="bookmark" size="sm" />
          <span class="text-xs">Als Entwurf</span>
        </BaseButton>

        <BaseButton
          variant="secondary"
          size="sm"
          class="flex flex-col items-center space-y-1 py-3"
          @click="shareCalculation"
        >
          <BaseIcon name="share" size="sm" />
          <span class="text-xs">Teilen</span>
        </BaseButton>
      </div>
    </div>

    <!-- 移动端输入提示 -->
    <div v-if="showInputHints" class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-start space-x-2">
        <BaseIcon name="information-circle" class="text-blue-600 mt-0.5" size="sm" />
        <div class="text-sm text-blue-800">
          <h4 class="font-medium mb-1">💡 Eingabe-Tipp</h4>
          <p>{{ currentInputHint }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalculatorIcon,
  ArrowPathIcon,
  LightBulbIcon,
  BookmarkIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import type { BaseCalculator } from '@/types/calculator'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseInput from '../ui/BaseInput.vue'
import MobileFormField from './MobileFormField.vue'
import EnhancedMobileFormField from './EnhancedMobileFormField.vue'

interface Props {
  calculator: BaseCalculator
  formData: Record<string, any>
  isCalculating: boolean
}

interface Emits {
  (e: 'update-field', name: string, value: any): void
  (e: 'calculate'): void
  (e: 'reset'): void
  (e: 'load-example'): void
  (e: 'save-draft'): void
  (e: 'share'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 增强的状态管理
const currentStep = ref(1)
const showQuickActions = ref(true)
const showInputHints = ref(true)
const showKeyboardHints = ref(true)
const focusedField = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const stepTransition = ref('slide-right')
const showFieldSuggestions = ref(true)

// 计算属性
const formSchema = computed(() => {
  return props.calculator.formSchema || props.calculator.getFormSchema?.()
})

const allFields = computed(() => {
  return formSchema.value?.fields || []
})

const isMobileStepForm = computed(() => {
  // 如果字段超过4个，使用分步表单
  return allFields.value.length > 4
})

const formSteps = computed(() => {
  if (!isMobileStepForm.value) return []

  // 将字段分组为步骤（每步最多3个字段）
  const steps = []
  const fieldsPerStep = 3

  for (let i = 0; i < allFields.value.length; i += fieldsPerStep) {
    const stepFields = allFields.value.slice(i, i + fieldsPerStep)
    const stepNumber = Math.floor(i / fieldsPerStep) + 1

    steps.push({
      title: `Schritt ${stepNumber}`,
      fields: stepFields
    })
  }

  return steps
})

const canProceedToNextStep = computed(() => {
  if (!isMobileStepForm.value) return true

  const currentStepFields = formSteps.value[currentStep.value - 1]?.fields || []

  // 检查当前步骤的必填字段和验证错误
  return currentStepFields.every((field: any) => {
    if (!field.required) return true
    const value = props.formData[field.name]
    const isValid = value !== undefined && value !== null && value !== ''
    const hasNoErrors = !fieldErrors.value[field.name]
    return isValid && hasNoErrors
  })
})

const isFormValid = computed(() => {
  const hasAllRequiredFields = allFields.value.every((field: any) => {
    if (!field.required) return true
    const value = props.formData[field.name]
    return value !== undefined && value !== null && value !== ''
  })

  const hasNoErrors = Object.keys(fieldErrors.value).length === 0
  return hasAllRequiredFields && hasNoErrors
})

const currentStepHint = computed(() => {
  return formSteps.value[currentStep.value - 1]?.hint
})

const currentStepExample = computed(() => {
  return formSteps.value[currentStep.value - 1]?.example
})

const currentInputHint = computed(() => {
  const hints: Record<string, string> = {
    principal: 'Geben Sie den Anfangsbetrag ein, den Sie investieren möchten.',
    monthlyPayment: 'Wie viel können Sie monatlich sparen?',
    annualRate: 'Erwartete jährliche Rendite (z.B. 6% für ETFs).',
    years: 'Wie lange möchten Sie investieren?',
    loanAmount: 'Gewünschte Darlehenssumme eingeben.',
    interestRate: 'Zinssatz Ihres Darlehens.',
    loanTerm: 'Laufzeit des Darlehens in Jahren.',
    currentAge: 'Ihr aktuelles Alter für die Altersvorsorge-Planung.',
    retirementAge: 'Gewünschtes Rentenalter (meist 65-67 Jahre).',
    currentSalary: 'Ihr aktuelles Bruttojahresgehalt.'
  }

  if (!isMobileStepForm.value) {
    return 'Füllen Sie alle Felder aus und tippen Sie auf "Berechnen".'
  }

  const currentStepFields = formSteps.value[currentStep.value - 1]?.fields || []
  const firstField = currentStepFields[0]

  return firstField ? hints[firstField.name] || 'Füllen Sie die Felder in diesem Schritt aus.' : ''
})

// 方法
const updateField = (name: string, value: any) => {
  emit('update-field', name, value)
}

const nextStep = () => {
  if (canProceedToNextStep.value && currentStep.value < formSteps.value.length) {
    stepTransition.value = 'slide-right'
    currentStep.value++
    scrollToTop()
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    stepTransition.value = 'slide-left'
    currentStep.value--
    scrollToTop()
  }
}

const goToStep = (step: number) => {
  if (step >= 1 && step <= formSteps.value.length) {
    stepTransition.value = step > currentStep.value ? 'slide-right' : 'slide-left'
    currentStep.value = step
    scrollToTop()
  }
}

const getStepDotClass = (step: number) => {
  if (currentStep.value > step) {
    return 'step-completed'
  } else if (currentStep.value === step) {
    return 'step-active'
  } else {
    return 'step-inactive'
  }
}

const calculate = () => {
  emit('calculate')
}

const resetForm = () => {
  currentStep.value = 1
  fieldErrors.value = {}
  emit('reset')
}

const loadExample = () => {
  if (currentStepExample.value) {
    Object.entries(currentStepExample.value).forEach(([key, value]) => {
      emit('update-field', key, value)
    })
  }
}

const saveAsDraft = () => {
  // 保存当前表单数据为草稿
  const draftData = {
    formData: props.formData,
    currentStep: currentStep.value,
    timestamp: Date.now()
  }
  localStorage.setItem('calculator_draft', JSON.stringify(draftData))
  // 显示保存成功提示
}

const applyExample = () => {
  loadExample()
}

const handleFieldFocus = (fieldName: string) => {
  focusedField.value = fieldName
}

const handleFieldBlur = (fieldName: string) => {
  focusedField.value = null
  // 触发字段验证
  validateField(fieldName)
}

const handleFieldValidation = (fieldName: string, isValid: boolean, errorMessage?: string) => {
  if (isValid) {
    delete fieldErrors.value[fieldName]
  } else {
    fieldErrors.value[fieldName] = errorMessage || 'Ungültiger Wert'
  }
}

const validateField = (fieldName: string) => {
  const field = allFields.value.find(f => f.name === fieldName)
  if (!field) return

  const value = props.formData[fieldName]

  // 基础验证
  if (field.required && (!value || value === '')) {
    fieldErrors.value[fieldName] = 'Dieses Feld ist erforderlich'
    return
  }

  // 类型验证
  if (field.type === 'number' && value && isNaN(Number(value))) {
    fieldErrors.value[fieldName] = 'Bitte geben Sie eine gültige Zahl ein'
    return
  }

  // 清除错误
  delete fieldErrors.value[fieldName]
}

const scrollToTop = () => {
  nextTick(() => {
    const container = document.querySelector('.mobile-calculator-form')
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })
}

const loadExample = () => {
  emit('load-example')
}

const saveAsDraft = () => {
  emit('save-draft')
}

const shareCalculation = () => {
  emit('share')
}

// 动画事件处理
const onBeforeEnter = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.opacity = '0'
  htmlEl.style.transform = stepTransition.value === 'slide-right'
    ? 'translateX(100%)'
    : 'translateX(-100%)'
}

const onEnter = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.offsetHeight // 触发重排
  htmlEl.style.transition = 'all 0.3s ease-out'
  htmlEl.style.opacity = '1'
  htmlEl.style.transform = 'translateX(0)'
}

const onLeave = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'all 0.3s ease-out'
  htmlEl.style.opacity = '0'
  htmlEl.style.transform = stepTransition.value === 'slide-right'
    ? 'translateX(-100%)'
    : 'translateX(100%)'
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!isMobileStepForm.value) return

  switch (event.key) {
    case 'ArrowLeft':
      if (currentStep.value > 1) {
        event.preventDefault()
        previousStep()
      }
      break
    case 'ArrowRight':
      if (currentStep.value < formSteps.value.length && canProceedToNextStep.value) {
        event.preventDefault()
        nextStep()
      }
      break
    case 'Enter':
      if (currentStep.value === formSteps.value.length && isFormValid.value) {
        event.preventDefault()
        calculate()
      }
      break
  }
}

// 生命周期钩子
onMounted(() => {
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)

  // 加载草稿数据
  const savedDraft = localStorage.getItem('calculator_draft')
  if (savedDraft) {
    try {
      const draftData = JSON.parse(savedDraft)
      // 可以选择性地恢复草稿数据
    } catch (error) {
      console.warn('Failed to load draft:', error)
    }
  }
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeydown)
})

// 监听表单数据变化和步骤变化
watch(() => props.formData, () => {
  // 如果当前步骤完成且不是最后一步，可以考虑自动前进
  // 这里暂时不实现自动前进，让用户手动控制
}, { deep: true })

watch(currentStep, (newStep) => {
  // 步骤变化时的逻辑
  console.log('Step changed to:', newStep)

  // 清除当前步骤的错误
  const currentStepFields = formSteps.value[newStep - 1]?.fields || []
  currentStepFields.forEach(field => {
    delete fieldErrors.value[field.name]
  })
})
</script>

<style scoped>
.mobile-calculator-form {
  @apply w-full;
}

/* 增强的步骤指示器样式 */
.step-indicator {
  @apply relative;
}

.step-dot {
  @apply relative cursor-pointer;
}

.step-number {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300;
}

.step-completed .step-number {
  @apply bg-blue-600 text-white;
}

.step-active .step-number {
  @apply bg-blue-600 text-white ring-4 ring-blue-200;
}

.step-inactive .step-number {
  @apply bg-gray-300 text-gray-600;
}

.step-connector {
  @apply absolute top-4 left-8 w-12 h-0.5 transition-all duration-300;
}

/* 步骤内容动画 */
.step-content {
  @apply relative overflow-hidden;
}

.step-fields {
  @apply w-full;
}

.field-container {
  @apply animate-fadeInUp;
}

/* 进度条样式 */
.progress-bar .bg-blue-600 {
  @apply transition-all duration-500 ease-out;
}

/* 导航按钮样式 */
.step-navigation .flex-1 {
  @apply min-h-12;
}

.quick-actions button {
  @apply transition-all duration-200 hover:scale-105;
}

/* 键盘快捷键样式 */
.kbd {
  @apply inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono;
}

/* 输入提示样式 */
.input-hints {
  @apply animate-slideInUp;
}

/* 步骤切换动画 */
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease-out;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 动画关键帧 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 工具类 */
.animate-fadeInUp {
  animation: fadeInUp 0.4s ease-out forwards;
}

.animate-slideInUp {
  animation: slideInUp 0.3s ease-out;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .step-number {
    @apply w-6 h-6 text-xs;
  }

  .step-connector {
    @apply left-6 w-8;
  }

  .quick-actions {
    @apply grid-cols-2 gap-1;
  }

  .quick-actions button {
    @apply text-xs px-2 py-1;
  }
}

/* 触摸优化 */
.step-dot {
  @apply min-w-12 min-h-12 flex items-center justify-center;
}

.navigation-buttons button {
  @apply min-h-12 touch-manipulation;
}

/* 焦点样式 */
.step-dot:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .step-inactive .step-number {
    @apply bg-gray-600 text-gray-300;
  }

  .kbd {
    @apply bg-gray-800 border-gray-600 text-gray-300;
  }
}
</style>
