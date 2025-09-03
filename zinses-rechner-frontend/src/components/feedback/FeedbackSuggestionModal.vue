<!--
  建议反馈模态框组件
  提供用户建议和改进意见的界面
-->

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框标题 -->
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t('feedback.shareSuggestion') }}
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
        <form @submit.prevent="submitSuggestion">
          <!-- 建议标题 -->
          <div class="title-section mb-6">
            <label class="section-label" for="title">
              {{ t('feedback.suggestionTitle') }}
            </label>
            <input
              id="title"
              v-model="title"
              type="text"
              class="title-input"
              :placeholder="t('feedback.suggestionTitlePlaceholder')"
              maxlength="100"
              required
            />
            <div class="character-count">
              {{ title.length }}/100
            </div>
          </div>

          <!-- 类别选择 -->
          <div class="category-section mb-6">
            <label class="section-label" for="category">
              {{ t('feedback.category') }}
            </label>
            <select
              id="category"
              v-model="category"
              class="category-select"
              required
            >
              <option value="">{{ t('feedback.selectCategory') }}</option>
              <option value="Benutzerfreundlichkeit">{{ t('feedback.usability') }}</option>
              <option value="Funktionalität">{{ t('feedback.functionality') }}</option>
              <option value="Performance">{{ t('feedback.performance') }}</option>
              <option value="Design">{{ t('feedback.design') }}</option>
              <option value="Neue Funktion">{{ t('feedback.newFeature') }}</option>
              <option value="Verbesserungsvorschlag">{{ t('feedback.improvement') }}</option>
              <option value="Allgemein">{{ t('feedback.general') }}</option>
            </select>
          </div>

          <!-- 详细描述 -->
          <div class="description-section mb-6">
            <label class="section-label" for="description">
              {{ t('feedback.detailedDescription') }}
            </label>
            <p class="section-description">
              {{ t('feedback.describeYourSuggestion') }}
            </p>
            <textarea
              id="description"
              v-model="description"
              class="description-textarea"
              :placeholder="t('feedback.suggestionDescriptionPlaceholder')"
              rows="6"
              maxlength="1000"
              required
            ></textarea>
            <div class="character-count">
              {{ description.length }}/1000
            </div>
          </div>

          <!-- 建议类型 -->
          <div class="suggestion-type-section mb-6">
            <label class="section-label">
              {{ t('feedback.suggestionType') }}
            </label>
            <div class="suggestion-types grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <label
                v-for="type in suggestionTypes"
                :key="type.value"
                class="suggestion-type-label"
                :class="{ 'selected': suggestionType === type.value }"
              >
                <input
                  v-model="suggestionType"
                  type="radio"
                  :value="type.value"
                  class="suggestion-type-radio"
                />
                <div class="suggestion-type-content">
                  <component :is="type.icon" class="w-5 h-5 text-blue-500" />
                  <div class="suggestion-type-text">
                    <div class="suggestion-type-title">{{ type.title }}</div>
                    <div class="suggestion-type-description">{{ type.description }}</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 优先级 -->
          <div class="priority-section mb-6">
            <label class="section-label">
              {{ t('feedback.priority') }}
            </label>
            <div class="priority-options flex items-center space-x-4 mt-2">
              <label
                v-for="priorityOption in priorityOptions"
                :key="priorityOption.value"
                class="priority-option-label"
              >
                <input
                  v-model="priority"
                  type="radio"
                  :value="priorityOption.value"
                  class="priority-option-radio"
                />
                <span class="priority-option-text" :class="priorityOption.colorClass">
                  {{ priorityOption.label }}
                </span>
              </label>
            </div>
          </div>

          <!-- 期望收益 -->
          <div class="benefit-section mb-6">
            <label class="section-label" for="benefit">
              {{ t('feedback.expectedBenefit') }}
              <span class="optional-label">({{ t('common.optional') }})</span>
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
              {{ t('feedback.submitSuggestion') }}
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
  LightBulbIcon, 
  WrenchScrewdriverIcon, 
  SparklesIcon, 
  BugAntIcon 
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'

// Emits
interface Emits {
  'close': []
  'submit': [data: { 
    title: string
    description: string
    category: string
    suggestionType?: string
    priority?: string
    expectedBenefit?: string
  }]
}

const emit = defineEmits<Emits>()

// 使用i18n
const { t } = useI18n()

// 响应式状态
const title = ref('')
const category = ref('')
const description = ref('')
const suggestionType = ref('improvement')
const priority = ref('medium')
const expectedBenefit = ref('')

// 建议类型选项
const suggestionTypes = [
  {
    value: 'improvement',
    title: t('feedback.improvement'),
    description: t('feedback.improvementDescription'),
    icon: SparklesIcon
  },
  {
    value: 'new-feature',
    title: t('feedback.newFeature'),
    description: t('feedback.newFeatureDescription'),
    icon: LightBulbIcon
  },
  {
    value: 'enhancement',
    title: t('feedback.enhancement'),
    description: t('feedback.enhancementDescription'),
    icon: WrenchScrewdriverIcon
  },
  {
    value: 'fix',
    title: t('feedback.fix'),
    description: t('feedback.fixDescription'),
    icon: BugAntIcon
  }
]

// 优先级选项
const priorityOptions = [
  {
    value: 'low',
    label: t('feedback.lowPriority'),
    colorClass: 'text-green-600 dark:text-green-400'
  },
  {
    value: 'medium',
    label: t('feedback.mediumPriority'),
    colorClass: 'text-yellow-600 dark:text-yellow-400'
  },
  {
    value: 'high',
    label: t('feedback.highPriority'),
    colorClass: 'text-red-600 dark:text-red-400'
  }
]

// 计算属性
const isValid = computed(() => {
  return title.value.trim().length > 0 && 
         category.value.length > 0 && 
         description.value.trim().length > 0
})

// 方法
const handleOverlayClick = (): void => {
  emit('close')
}

const submitSuggestion = (): void => {
  if (!isValid.value) return
  
  const data = {
    title: title.value.trim(),
    description: description.value.trim(),
    category: category.value,
    suggestionType: suggestionType.value,
    priority: priority.value,
    expectedBenefit: expectedBenefit.value.trim() || undefined
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

.title-input,
.category-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.description-textarea,
.benefit-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none;
}

.character-count {
  @apply text-xs text-gray-500 dark:text-gray-500 text-right mt-1;
}

.suggestion-type-label {
  @apply relative p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600;
}

.suggestion-type-label.selected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.suggestion-type-radio {
  @apply absolute top-3 right-3 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2;
}

.suggestion-type-content {
  @apply flex items-start space-x-3;
}

.suggestion-type-text {
  @apply flex-1;
}

.suggestion-type-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.suggestion-type-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.priority-option-label {
  @apply flex items-center cursor-pointer;
}

.priority-option-radio {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2;
}

.priority-option-text {
  @apply ml-2 text-sm font-medium;
}

.modal-actions {
  @apply flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

.submit-button {
  @apply px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .modal-container {
    @apply max-w-full m-2;
  }
  
  .suggestion-types {
    @apply grid-cols-1;
  }
  
  .priority-options {
    @apply flex-col items-start space-y-2 space-x-0;
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
