<!--
  功能请求模态框组件
  提供用户功能请求的界面
-->

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框标题 -->
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t('feedback.requestFeature') }}
        </h3>
        <button
          @click="$emit('close')"
          class="close-button"
          :aria-label="t('common.close')"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-content">
        <form @submit.prevent="submitFeatureRequest">
          <!-- 功能标题 -->
          <div class="title-section mb-6">
            <label class="section-label" for="title">
              {{ t('feedback.featureTitle') }}
            </label>
            <input
              id="title"
              v-model="title"
              type="text"
              class="title-input"
              :placeholder="t('feedback.featureTitlePlaceholder')"
              maxlength="100"
              required
            />
            <div class="character-count">
              {{ title.length }}/100
            </div>
          </div>

          <!-- 功能描述 -->
          <div class="description-section mb-6">
            <label class="section-label" for="description">
              {{ t('feedback.featureDescription') }}
            </label>
            <p class="section-description">
              {{ t('feedback.describeFeatureDetail') }}
            </p>
            <textarea
              id="description"
              v-model="description"
              class="description-textarea"
              :placeholder="t('feedback.featureDescriptionPlaceholder')"
              rows="6"
              maxlength="1000"
              required
            ></textarea>
            <div class="character-count">
              {{ description.length }}/1000
            </div>
          </div>

          <!-- 优先级选择 -->
          <div class="priority-section mb-6">
            <label class="section-label">
              {{ t('feedback.requestPriority') }}
            </label>
            <div class="priority-options grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <label
                v-for="priorityOption in priorityOptions"
                :key="priorityOption.value"
                class="priority-option-label"
                :class="{ 'selected': priority === priorityOption.value }"
              >
                <input
                  v-model="priority"
                  type="radio"
                  :value="priorityOption.value"
                  class="priority-option-radio"
                />
                <div class="priority-option-content">
                  <component :is="priorityOption.icon" :class="['w-5 h-5', priorityOption.colorClass]" />
                  <div class="priority-option-text">
                    <div class="priority-option-title">{{ priorityOption.title }}</div>
                    <div class="priority-option-description">{{ priorityOption.description }}</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 使用场景 -->
          <div class="use-case-section mb-6">
            <label class="section-label" for="useCase">
              {{ t('feedback.useCase') }}
            </label>
            <p class="section-description">
              {{ t('feedback.describeUseCase') }}
            </p>
            <textarea
              id="useCase"
              v-model="useCase"
              class="use-case-textarea"
              :placeholder="t('feedback.useCasePlaceholder')"
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="character-count">
              {{ useCase.length }}/500
            </div>
          </div>

          <!-- 期望收益 -->
          <div class="benefit-section mb-6">
            <label class="section-label" for="benefit">
              {{ t('feedback.expectedBenefit') }}
            </label>
            <p class="section-description">
              {{ t('feedback.howWouldThisHelp') }}
            </p>
            <textarea
              id="benefit"
              v-model="expectedBenefit"
              class="benefit-textarea"
              :placeholder="t('feedback.benefitPlaceholder')"
              rows="3"
              maxlength="300"
            ></textarea>
            <div class="character-count">
              {{ expectedBenefit.length }}/300
            </div>
          </div>

          <!-- 替代方案 -->
          <div class="alternatives-section mb-6">
            <label class="section-label" for="alternatives">
              {{ t('feedback.alternatives') }}
              <span class="optional-label">({{ t('common.optional') }})</span>
            </label>
            <p class="section-description">
              {{ t('feedback.currentWorkarounds') }}
            </p>
            <textarea
              id="alternatives"
              v-model="alternatives"
              class="alternatives-textarea"
              :placeholder="t('feedback.alternativesPlaceholder')"
              rows="3"
              maxlength="300"
            ></textarea>
            <div class="character-count">
              {{ alternatives.length }}/300
            </div>
          </div>

          <!-- 功能类型 -->
          <div class="feature-type-section mb-6">
            <label class="section-label">
              {{ t('feedback.featureType') }}
            </label>
            <div class="feature-types flex flex-wrap gap-2 mt-2">
              <label
                v-for="type in featureTypes"
                :key="type.value"
                class="feature-type-label"
              >
                <input
                  v-model="selectedTypes"
                  type="checkbox"
                  :value="type.value"
                  class="feature-type-checkbox"
                />
                <span class="feature-type-text">{{ type.label }}</span>
              </label>
            </div>
          </div>

          <!-- 影响范围 -->
          <div class="impact-section mb-6">
            <label class="section-label">
              {{ t('feedback.impactScope') }}
            </label>
            <div class="impact-options flex items-center space-x-6 mt-2">
              <label
                v-for="impact in impactOptions"
                :key="impact.value"
                class="impact-option-label"
              >
                <input
                  v-model="impactScope"
                  type="radio"
                  :value="impact.value"
                  class="impact-option-radio"
                />
                <span class="impact-option-text">{{ impact.label }}</span>
              </label>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="modal-actions">
            <button
              type="button"
              @click="$emit('close')"
              class="cancel-button"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="!isValid"
              class="submit-button"
            >
              {{ t('feedback.submitFeatureRequest') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  XMarkIcon, 
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  FireIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'
import type { FeedbackPriority } from '@/services/UserFeedbackService'

// Emits
interface Emits {
  'close': []
  'submit': [data: { 
    title: string
    description: string
    priority: FeedbackPriority
    useCase?: string
    expectedBenefit?: string
    alternatives?: string
    selectedTypes?: string[]
    impactScope?: string
  }]
}

const emit = defineEmits<Emits>()

// 使用i18n
const { t } = useI18n()

// 响应式状态
const title = ref('')
const description = ref('')
const priority = ref<FeedbackPriority>('medium')
const useCase = ref('')
const expectedBenefit = ref('')
const alternatives = ref('')
const selectedTypes = ref<string[]>([])
const impactScope = ref('individual')

// 优先级选项
const priorityOptions = [
  {
    value: 'low' as FeedbackPriority,
    title: t('feedback.lowPriority'),
    description: t('feedback.niceToHave'),
    icon: ArrowTrendingUpIcon,
    colorClass: 'text-green-500'
  },
  {
    value: 'medium' as FeedbackPriority,
    title: t('feedback.mediumPriority'),
    description: t('feedback.wouldImprove'),
    icon: ExclamationTriangleIcon,
    colorClass: 'text-yellow-500'
  },
  {
    value: 'high' as FeedbackPriority,
    title: t('feedback.highPriority'),
    description: t('feedback.criticalNeed'),
    icon: FireIcon,
    colorClass: 'text-red-500'
  }
]

// 功能类型选项
const featureTypes = [
  { value: 'calculation', label: t('feedback.calculationFeature') },
  { value: 'visualization', label: t('feedback.visualizationFeature') },
  { value: 'export', label: t('feedback.exportFeature') },
  { value: 'ui', label: t('feedback.uiFeature') },
  { value: 'integration', label: t('feedback.integrationFeature') },
  { value: 'automation', label: t('feedback.automationFeature') },
  { value: 'reporting', label: t('feedback.reportingFeature') },
  { value: 'other', label: t('feedback.otherFeature') }
]

// 影响范围选项
const impactOptions = [
  { value: 'individual', label: t('feedback.individualUser') },
  { value: 'team', label: t('feedback.teamUsers') },
  { value: 'organization', label: t('feedback.organizationWide') },
  { value: 'all', label: t('feedback.allUsers') }
]

// 计算属性
const isValid = computed(() => {
  return title.value.trim().length > 0 && description.value.trim().length > 0
})

// 方法
const handleOverlayClick = (): void => {
  emit('close')
}

const submitFeatureRequest = (): void => {
  if (!isValid.value) return
  
  const data = {
    title: title.value.trim(),
    description: description.value.trim(),
    priority: priority.value,
    useCase: useCase.value.trim() || undefined,
    expectedBenefit: expectedBenefit.value.trim() || undefined,
    alternatives: alternatives.value.trim() || undefined,
    selectedTypes: selectedTypes.value.length > 0 ? selectedTypes.value : undefined,
    impactScope: impactScope.value
  }
  
  emit('submit', data)
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors duration-200;
}

.modal-content {
  @apply p-6;
}

.section-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.section-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-3;
}

.optional-label {
  @apply text-xs text-gray-500 dark:text-gray-500 font-normal;
}

.title-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.description-textarea,
.use-case-textarea,
.benefit-textarea,
.alternatives-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none;
}

.character-count {
  @apply text-xs text-gray-500 dark:text-gray-500 text-right mt-1;
}

.priority-option-label {
  @apply relative p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600;
}

.priority-option-label.selected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.priority-option-radio {
  @apply absolute top-3 right-3 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2;
}

.priority-option-content {
  @apply flex items-start space-x-3;
}

.priority-option-text {
  @apply flex-1;
}

.priority-option-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.priority-option-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.feature-type-label {
  @apply flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/20;
}

.feature-type-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.feature-type-text {
  @apply ml-2 text-sm text-gray-700 dark:text-gray-300;
}

.impact-option-label {
  @apply flex items-center cursor-pointer;
}

.impact-option-radio {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2;
}

.impact-option-text {
  @apply ml-2 text-sm text-gray-700 dark:text-gray-300;
}

.modal-actions {
  @apply flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

.submit-button {
  @apply px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .modal-container {
    @apply max-w-full m-2;
  }
  
  .priority-options {
    @apply grid-cols-1;
  }
  
  .impact-options {
    @apply flex-col items-start space-y-2 space-x-0;
  }
  
  .feature-types {
    @apply flex-col;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .modal-container {
  @apply border-2 border-current;
}

/* 动画 */
.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  animation: slideIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
