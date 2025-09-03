<!--
  用户反馈面板组件
  提供用户反馈收集界面，包括评分、建议、错误报告等功能
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('feedback.panel') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('feedback.panelDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <div class="feedback-status flex items-center space-x-2">
            <div :class="getStatusIndicatorClasses()"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ isCollecting ? t('feedback.collecting') : t('feedback.paused') }}
            </span>
          </div>
          
          <button
            v-if="pendingCount > 0"
            @click="submitPendingFeedback"
            :disabled="isSubmitting"
            class="submit-button"
          >
            <component :is="isSubmitting ? ArrowPathIcon : PaperAirplaneIcon" 
                      :class="['w-4 h-4 mr-2', { 'animate-spin': isSubmitting }]" />
            {{ t('feedback.submitPending', { count: pendingCount }) }}
          </button>
        </div>
      </div>
    </div>

    <!-- 快速反馈选项 -->
    <div class="quick-feedback mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('feedback.quickFeedback') }}
      </h4>
      
      <div class="quick-options grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 评分反馈 -->
        <div class="quick-option-card" @click="showRatingModal = true">
          <div class="option-icon">
            <StarIcon class="w-6 h-6 text-yellow-500" />
          </div>
          <div class="option-content">
            <h5 class="option-title">{{ t('feedback.rating') }}</h5>
            <p class="option-description">{{ t('feedback.ratingDescription') }}</p>
          </div>
        </div>
        
        <!-- 建议反馈 -->
        <div class="quick-option-card" @click="showSuggestionModal = true">
          <div class="option-icon">
            <LightBulbIcon class="w-6 h-6 text-blue-500" />
          </div>
          <div class="option-content">
            <h5 class="option-title">{{ t('feedback.suggestion') }}</h5>
            <p class="option-description">{{ t('feedback.suggestionDescription') }}</p>
          </div>
        </div>
        
        <!-- 错误报告 -->
        <div class="quick-option-card" @click="showBugReportModal = true">
          <div class="option-icon">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-500" />
          </div>
          <div class="option-content">
            <h5 class="option-title">{{ t('feedback.bugReport') }}</h5>
            <p class="option-description">{{ t('feedback.bugReportDescription') }}</p>
          </div>
        </div>
        
        <!-- 功能请求 -->
        <div class="quick-option-card" @click="showFeatureRequestModal = true">
          <div class="option-icon">
            <PlusCircleIcon class="w-6 h-6 text-green-500" />
          </div>
          <div class="option-content">
            <h5 class="option-title">{{ t('feedback.featureRequest') }}</h5>
            <p class="option-description">{{ t('feedback.featureRequestDescription') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 反馈统计 -->
    <div class="feedback-stats mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('feedback.statistics') }}
      </h4>
      
      <div class="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-card">
          <div class="stat-icon">
            <ChatBubbleLeftRightIcon class="w-5 h-5 text-blue-500" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.total }}</div>
            <div class="stat-label">{{ t('feedback.totalFeedback') }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <StarIcon class="w-5 h-5 text-yellow-500" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatRating(statistics.averageRating) }}</div>
            <div class="stat-label">{{ t('feedback.averageRating') }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <ClockIcon class="w-5 h-5 text-green-500" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.byStatus.pending }}</div>
            <div class="stat-label">{{ t('feedback.pending') }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <CheckCircleIcon class="w-5 h-5 text-purple-500" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatPercentage(statistics.resolutionRate) }}</div>
            <div class="stat-label">{{ t('feedback.resolutionRate') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 反馈历史 -->
    <div v-if="showHistory" class="feedback-history">
      <div class="history-header flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('feedback.history') }}
        </h4>
        
        <div class="history-controls flex items-center space-x-2">
          <select v-model="historyFilter" class="history-filter">
            <option value="">{{ t('feedback.allTypes') }}</option>
            <option value="rating">{{ t('feedback.rating') }}</option>
            <option value="suggestion">{{ t('feedback.suggestion') }}</option>
            <option value="bug">{{ t('feedback.bugReport') }}</option>
            <option value="feature">{{ t('feedback.featureRequest') }}</option>
          </select>
          
          <button
            @click="clearAllFeedback"
            :disabled="allFeedback.total === 0"
            class="clear-button"
          >
            <TrashIcon class="w-4 h-4 mr-2" />
            {{ t('feedback.clearAll') }}
          </button>
        </div>
      </div>
      
      <div class="history-list space-y-3">
        <div
          v-for="feedback in filteredFeedback"
          :key="feedback.id"
          :class="getFeedbackItemClasses(feedback)"
        >
          <div class="feedback-header flex items-start justify-between">
            <div class="feedback-info flex items-start space-x-3">
              <div :class="getFeedbackIconClasses(feedback.type)">
                <component :is="getFeedbackIcon(feedback.type)" class="w-5 h-5" />
              </div>
              
              <div class="feedback-details">
                <h5 class="feedback-title font-medium text-gray-900 dark:text-white">
                  {{ feedback.title }}
                </h5>
                <p class="feedback-description text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ feedback.description }}
                </p>
                <div class="feedback-meta flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                  <span>{{ formatTimestamp(feedback.metadata.created) }}</span>
                  <span>{{ t(`feedback.type.${feedback.type}`) }}</span>
                  <span>{{ t(`feedback.priority.${feedback.priority}`) }}</span>
                  <span v-if="feedback.rating" class="flex items-center">
                    <StarIcon class="w-3 h-3 mr-1" />
                    {{ feedback.rating }}/5
                  </span>
                </div>
              </div>
            </div>
            
            <div class="feedback-actions flex items-center space-x-2">
              <div :class="getStatusBadgeClasses(feedback.status)">
                {{ t(`feedback.status.${feedback.status}`) }}
              </div>
              
              <button
                @click="deleteFeedback(feedback.id)"
                class="delete-button"
                :aria-label="`${t('feedback.delete')} ${feedback.title}`"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <!-- 附件 -->
          <div v-if="feedback.attachments.length > 0" class="feedback-attachments mt-3">
            <div class="attachments-list flex items-center space-x-2">
              <PaperClipIcon class="w-4 h-4 text-gray-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">
                {{ t('feedback.attachments', { count: feedback.attachments.length }) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="filteredFeedback.length === 0" class="empty-state text-center py-8">
          <ChatBubbleLeftRightIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ t('feedback.noFeedback') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {{ t('feedback.noFeedbackDescription') }}
          </p>
        </div>
      </div>
    </div>

    <!-- 评分模态框 -->
    <FeedbackRatingModal
      v-if="showRatingModal"
      @close="showRatingModal = false"
      @submit="handleRatingSubmit"
    />
    
    <!-- 建议模态框 -->
    <FeedbackSuggestionModal
      v-if="showSuggestionModal"
      @close="showSuggestionModal = false"
      @submit="handleSuggestionSubmit"
    />
    
    <!-- 错误报告模态框 -->
    <FeedbackBugReportModal
      v-if="showBugReportModal"
      @close="showBugReportModal = false"
      @submit="handleBugReportSubmit"
    />
    
    <!-- 功能请求模态框 -->
    <FeedbackFeatureRequestModal
      v-if="showFeatureRequestModal"
      @close="showFeatureRequestModal = false"
      @submit="handleFeatureRequestSubmit"
    />

    <!-- 操作按钮 -->
    <div class="panel-actions mt-6 flex items-center justify-between">
      <div class="action-info">
        <button
          @click="showHistory = !showHistory"
          class="toggle-history-button"
        >
          <component :is="showHistory ? EyeSlashIcon : EyeIcon" class="w-4 h-4 mr-2" />
          {{ showHistory ? t('feedback.hideHistory') : t('feedback.showHistory') }}
        </button>
      </div>
      
      <div class="main-actions flex items-center space-x-3">
        <button
          @click="exportFeedbackData"
          :disabled="allFeedback.total === 0"
          class="export-button"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          {{ t('feedback.export') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  StarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  TrashIcon,
  XMarkIcon,
  PaperClipIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import FeedbackRatingModal from './FeedbackRatingModal.vue'
import FeedbackSuggestionModal from './FeedbackSuggestionModal.vue'
import FeedbackBugReportModal from './FeedbackBugReportModal.vue'
import FeedbackFeatureRequestModal from './FeedbackFeatureRequestModal.vue'
import { useUserFeedback } from '@/services/UserFeedbackService'
import { useI18n } from '@/services/I18nService'
import { saveAs } from '../utils/file-saver-mock'
import type { FeedbackItem, FeedbackType, FeedbackStatus, FeedbackPriority } from '@/services/UserFeedbackService'

// Props
interface Props {
  showTitle?: boolean
  showHistory?: boolean
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true,
  showHistory: false
})

// 使用服务
const {
  isCollecting,
  isSubmitting,
  statistics,
  submitRating,
  submitSuggestion,
  submitBugReport,
  submitFeatureRequest,
  getAllFeedback,
  deleteFeedback,
  clearAllFeedback,
  submitPendingFeedback,
  exportFeedbackData
} = useUserFeedback()

const { t } = useI18n()

// 响应式状态
const showRatingModal = ref(false)
const showSuggestionModal = ref(false)
const showBugReportModal = ref(false)
const showFeatureRequestModal = ref(false)
const showHistoryPanel = ref(props.showHistory)
const historyFilter = ref('')

// 计算属性
const allFeedback = computed(() => getAllFeedback())
const pendingCount = computed(() => allFeedback.value.pending.length)

const filteredFeedback = computed(() => {
  const all = [...allFeedback.value.pending, ...allFeedback.value.submitted]
  
  if (!historyFilter.value) {
    return all
  }
  
  return all.filter(feedback => feedback.type === historyFilter.value)
})

const containerClasses = computed(() => {
  const classes = ['feedback-panel', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'p-6']
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const ariaLabel = computed(() => {
  return `${t('feedback.panel')}: ${statistics.total} ${t('feedback.totalFeedback')}`
})

// 方法
const getStatusIndicatorClasses = (): string[] => {
  const classes = ['w-2', 'h-2', 'rounded-full']
  
  if (isCollecting.value) {
    classes.push('bg-green-500', 'animate-pulse')
  } else {
    classes.push('bg-gray-400')
  }
  
  return classes
}

const getFeedbackItemClasses = (feedback: FeedbackItem): string[] => {
  const classes = [
    'feedback-item',
    'p-4',
    'border',
    'rounded-lg',
    'transition-colors',
    'duration-200'
  ]
  
  switch (feedback.status) {
    case 'pending':
      classes.push('border-yellow-200', 'bg-yellow-50', 'dark:border-yellow-800', 'dark:bg-yellow-900/20')
      break
    case 'submitted':
      classes.push('border-blue-200', 'bg-blue-50', 'dark:border-blue-800', 'dark:bg-blue-900/20')
      break
    case 'resolved':
      classes.push('border-green-200', 'bg-green-50', 'dark:border-green-800', 'dark:bg-green-900/20')
      break
    default:
      classes.push('border-gray-200', 'bg-gray-50', 'dark:border-gray-700', 'dark:bg-gray-800')
  }
  
  return classes
}

const getFeedbackIconClasses = (type: FeedbackType): string[] => {
  const classes = ['feedback-icon', 'flex', 'items-center', 'justify-center', 'w-8', 'h-8', 'rounded-full']
  
  switch (type) {
    case 'rating':
      classes.push('bg-yellow-100', 'dark:bg-yellow-900', 'text-yellow-600', 'dark:text-yellow-400')
      break
    case 'suggestion':
      classes.push('bg-blue-100', 'dark:bg-blue-900', 'text-blue-600', 'dark:text-blue-400')
      break
    case 'bug':
      classes.push('bg-red-100', 'dark:bg-red-900', 'text-red-600', 'dark:text-red-400')
      break
    case 'feature':
      classes.push('bg-green-100', 'dark:bg-green-900', 'text-green-600', 'dark:text-green-400')
      break
    default:
      classes.push('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400')
  }
  
  return classes
}

const getFeedbackIcon = (type: FeedbackType) => {
  switch (type) {
    case 'rating': return StarIcon
    case 'suggestion': return LightBulbIcon
    case 'bug': return ExclamationTriangleIcon
    case 'feature': return PlusCircleIcon
    default: return ChatBubbleLeftRightIcon
  }
}

const getStatusBadgeClasses = (status: FeedbackStatus): string[] => {
  const classes = ['status-badge', 'px-2', 'py-1', 'text-xs', 'font-medium', 'rounded-full']
  
  switch (status) {
    case 'pending':
      classes.push('bg-yellow-100', 'text-yellow-800', 'dark:bg-yellow-900', 'dark:text-yellow-200')
      break
    case 'submitted':
      classes.push('bg-blue-100', 'text-blue-800', 'dark:bg-blue-900', 'dark:text-blue-200')
      break
    case 'acknowledged':
      classes.push('bg-purple-100', 'text-purple-800', 'dark:bg-purple-900', 'dark:text-purple-200')
      break
    case 'resolved':
      classes.push('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200')
      break
    case 'rejected':
      classes.push('bg-red-100', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-200')
      break
  }
  
  return classes
}

const formatRating = (rating: number): string => {
  return rating > 0 ? `${rating.toFixed(1)}/5` : '—'
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const formatTimestamp = (date: Date): string => {
  return new Date(date).toLocaleString('de-DE')
}

// 事件处理
const handleRatingSubmit = async (data: { rating: number; category: string; comment?: string }) => {
  try {
    await submitRating(data.rating, data.category, data.comment)
    showRatingModal.value = false
  } catch (error) {
    console.error('Failed to submit rating:', error)
  }
}

const handleSuggestionSubmit = async (data: { title: string; description: string; category: string }) => {
  try {
    await submitSuggestion(data.title, data.description, data.category)
    showSuggestionModal.value = false
  } catch (error) {
    console.error('Failed to submit suggestion:', error)
  }
}

const handleBugReportSubmit = async (data: { title: string; description: string; includeScreenshot: boolean }) => {
  try {
    await submitBugReport(data.title, data.description, undefined, data.includeScreenshot)
    showBugReportModal.value = false
  } catch (error) {
    console.error('Failed to submit bug report:', error)
  }
}

const handleFeatureRequestSubmit = async (data: { title: string; description: string; priority: FeedbackPriority }) => {
  try {
    await submitFeatureRequest(data.title, data.description, data.priority)
    showFeatureRequestModal.value = false
  } catch (error) {
    console.error('Failed to submit feature request:', error)
  }
}

const exportData = (): void => {
  const data = exportFeedbackData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const filename = `feedback-data-${new Date().toISOString().slice(0, 10)}.json`
  saveAs(blob, filename)
}

// 生命周期
onMounted(() => {
  showHistoryPanel.value = props.showHistory
})
</script>

<style scoped>
.feedback-panel {
  @apply max-w-6xl mx-auto;
}

.quick-option-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600;
}

.option-icon {
  @apply flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3;
}

.option-title {
  @apply font-medium text-gray-900 dark:text-white mb-1;
}

.option-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center space-x-3;
}

.stat-icon {
  @apply flex-shrink-0;
}

.stat-content {
  @apply flex-1;
}

.stat-value {
  @apply text-xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.history-filter {
  @apply px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.submit-button,
.clear-button,
.delete-button,
.toggle-history-button,
.export-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.submit-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.clear-button {
  @apply text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500;
}

.delete-button {
  @apply p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md;
}

.toggle-history-button,
.export-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .quick-options {
    @apply grid-cols-1;
  }
  
  .stats-grid {
    @apply grid-cols-2;
  }
  
  .panel-actions {
    @apply flex-col space-y-3;
  }
  
  .main-actions {
    @apply w-full justify-between;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .quick-option-card {
  @apply border-2 border-current;
}

/* 暗色模式支持 */
:global(.theme-dark) .quick-option-card {
  @apply bg-gray-800 border-gray-600;
}

/* 打印样式 */
@media print {
  .panel-actions,
  .header-actions {
    @apply hidden;
  }
}
</style>
