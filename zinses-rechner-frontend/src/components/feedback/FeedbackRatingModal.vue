<!--
  评分反馈模态框组件
  提供用户评分和评论的界面
-->

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框标题 -->
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t('feedback.rateExperience') }}
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
        <form @submit.prevent="submitRating">
          <!-- 评分选择 -->
          <div class="rating-section mb-6">
            <label class="section-label">
              {{ t('feedback.overallRating') }}
            </label>
            <p class="section-description">
              {{ t('feedback.rateYourExperience') }}
            </p>
            
            <div class="rating-stars flex items-center justify-center space-x-2 my-4">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="setRating(star)"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                :class="getStarClasses(star)"
                :aria-label="`${t('feedback.rateStar')} ${star}`"
              >
                <StarIcon class="w-8 h-8" />
              </button>
            </div>
            
            <div class="rating-label text-center">
              <span v-if="rating > 0" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ getRatingLabel(rating) }}
              </span>
              <span v-else class="text-sm text-gray-500 dark:text-gray-500">
                {{ t('feedback.selectRating') }}
              </span>
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
              <option value="Allgemein">{{ t('feedback.general') }}</option>
            </select>
          </div>

          <!-- 评论输入 -->
          <div class="comment-section mb-6">
            <label class="section-label" for="comment">
              {{ t('feedback.additionalComments') }}
              <span class="optional-label">({{ t('common.optional') }})</span>
            </label>
            <textarea
              id="comment"
              v-model="comment"
              class="comment-textarea"
              :placeholder="t('feedback.commentPlaceholder')"
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="character-count">
              {{ comment.length }}/500
            </div>
          </div>

          <!-- 快速反馈选项 -->
          <div v-if="rating > 0" class="quick-feedback-section mb-6">
            <label class="section-label">
              {{ rating >= 4 ? t('feedback.whatDidYouLike') : t('feedback.whatCanWeImprove') }}
            </label>
            <div class="quick-options grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <label
                v-for="option in getQuickOptions()"
                :key="option.value"
                class="quick-option-label"
              >
                <input
                  v-model="quickFeedback"
                  type="checkbox"
                  :value="option.value"
                  class="quick-option-checkbox"
                />
                <span class="quick-option-text">{{ option.label }}</span>
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
              {{ t('feedback.submitRating') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { XMarkIcon, StarIcon } from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'
import { useI18n } from '@/services/I18nService'

// Emits
interface Emits {
  'close': []
  'submit': [data: { rating: number; category: string; comment?: string; quickFeedback?: string[] }]
}

const emit = defineEmits<Emits>()

// 使用i18n
const { t } = useI18n()

// 响应式状态
const rating = ref(0)
const hoverRating = ref(0)
const category = ref('')
const comment = ref('')
const quickFeedback = ref<string[]>([])

// 计算属性
const isValid = computed(() => {
  return rating.value > 0 && category.value.length > 0
})

// 方法
const setRating = (star: number): void => {
  rating.value = star
}

const getStarClasses = (star: number): string[] => {
  const classes = [
    'star-button',
    'p-1',
    'rounded-md',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-yellow-500'
  ]
  
  const activeRating = hoverRating.value || rating.value
  
  if (star <= activeRating) {
    classes.push('text-yellow-500', 'hover:text-yellow-600')
  } else {
    classes.push('text-gray-300', 'dark:text-gray-600', 'hover:text-yellow-400')
  }
  
  return classes
}

const getRatingLabel = (rating: number): string => {
  const labels = [
    '',
    t('feedback.veryPoor'),
    t('feedback.poor'),
    t('feedback.average'),
    t('feedback.good'),
    t('feedback.excellent')
  ]
  return labels[rating] || ''
}

const getQuickOptions = () => {
  if (rating.value >= 4) {
    // 正面反馈选项
    return [
      { value: 'easy-to-use', label: t('feedback.easyToUse') },
      { value: 'fast-calculation', label: t('feedback.fastCalculation') },
      { value: 'clear-results', label: t('feedback.clearResults') },
      { value: 'helpful-features', label: t('feedback.helpfulFeatures') },
      { value: 'good-design', label: t('feedback.goodDesign') },
      { value: 'reliable', label: t('feedback.reliable') }
    ]
  } else {
    // 改进建议选项
    return [
      { value: 'confusing-interface', label: t('feedback.confusingInterface') },
      { value: 'slow-performance', label: t('feedback.slowPerformance') },
      { value: 'unclear-results', label: t('feedback.unclearResults') },
      { value: 'missing-features', label: t('feedback.missingFeatures') },
      { value: 'design-issues', label: t('feedback.designIssues') },
      { value: 'technical-problems', label: t('feedback.technicalProblems') }
    ]
  }
}

const handleOverlayClick = (): void => {
  emit('close')
}

const submitRating = (): void => {
  if (!isValid.value) return
  
  const data = {
    rating: rating.value,
    category: category.value,
    comment: comment.value.trim() || undefined,
    quickFeedback: quickFeedback.value.length > 0 ? quickFeedback.value : undefined
  }
  
  emit('submit', data)
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto;
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
  @apply text-sm text-gray-600 dark:text-gray-400 mb-4;
}

.optional-label {
  @apply text-xs text-gray-500 dark:text-gray-500 font-normal;
}

.star-button {
  @apply transform hover:scale-110;
}

.category-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.comment-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none;
}

.character-count {
  @apply text-xs text-gray-500 dark:text-gray-500 text-right mt-1;
}

.quick-option-label {
  @apply flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200;
}

.quick-option-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.quick-option-text {
  @apply ml-2 text-sm text-gray-700 dark:text-gray-300;
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
  
  .quick-options {
    @apply grid-cols-1;
  }
  
  .rating-stars {
    @apply space-x-1;
  }
  
  .rating-stars .star-button {
    @apply p-0.5;
  }
  
  .rating-stars .w-8 {
    @apply w-6 h-6;
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
