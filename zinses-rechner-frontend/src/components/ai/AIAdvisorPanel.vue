<!--
  AI智能建议面板组件
  提供AI驱动的个性化财务建议和分析
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <SparklesIcon class="w-6 h-6 mr-2 text-blue-500" />
            {{ t('ai.intelligentAdvisor') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('ai.advisorDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <div class="ai-status flex items-center space-x-2">
            <div :class="getStatusIndicatorClasses()"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ getStatusText() }}
            </span>
          </div>
          
          <button
            @click="showSettings = !showSettings"
            class="settings-button"
          >
            <CogIcon class="w-4 h-4 mr-2" />
            {{ t('ai.settings') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 用户画像输入 -->
    <div v-if="!userProfile" class="profile-setup mb-8">
      <UserProfileForm
        @profile-created="handleProfileCreated"
        @profile-updated="handleProfileUpdated"
      />
    </div>

    <!-- AI分析结果 -->
    <div v-if="analysisResult" class="analysis-results mb-8">
      <div class="results-header mb-6">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('ai.analysisResults') }}
        </h4>
        <div class="analysis-meta text-sm text-gray-600 dark:text-gray-400">
          {{ t('ai.lastAnalysis') }}: {{ formatLastAnalysis() }}
        </div>
      </div>

      <!-- 综合评分 -->
      <div class="overall-score mb-6">
        <div class="score-card">
          <div class="score-header">
            <h5 class="score-title">{{ t('ai.overallFinancialScore') }}</h5>
            <button
              @click="showScoreDetails = !showScoreDetails"
              class="score-details-toggle"
            >
              <InformationCircleIcon class="w-4 h-4" />
            </button>
          </div>
          
          <div class="score-display">
            <div class="score-circle">
              <svg class="score-svg" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  stroke-width="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  :stroke="getScoreColor(analysisResult.overallScore)"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="getScoreOffset(analysisResult.overallScore)"
                  class="score-progress"
                />
              </svg>
              <div class="score-text">
                <span class="score-number">{{ analysisResult.overallScore }}</span>
                <span class="score-label">/100</span>
              </div>
            </div>
            
            <div class="score-description">
              <span :class="getScoreTextClasses(analysisResult.overallScore)">
                {{ getScoreDescription(analysisResult.overallScore) }}
              </span>
            </div>
          </div>
          
          <!-- 评分详情 -->
          <div v-if="showScoreDetails" class="score-breakdown mt-4">
            <div class="breakdown-items space-y-2">
              <div class="breakdown-item">
                <span class="item-label">{{ t('ai.financialHealth') }}</span>
                <div class="item-bar">
                  <div 
                    class="item-fill bg-green-500"
                    :style="{ width: `${analysisResult.financialHealth.score}%` }"
                  ></div>
                </div>
                <span class="item-value">{{ analysisResult.financialHealth.score }}</span>
              </div>
              
              <div class="breakdown-item">
                <span class="item-label">{{ t('ai.riskManagement') }}</span>
                <div class="item-bar">
                  <div 
                    class="item-fill bg-blue-500"
                    :style="{ width: `${getRiskScore()}%` }"
                  ></div>
                </div>
                <span class="item-value">{{ getRiskScore() }}</span>
              </div>
              
              <div class="breakdown-item">
                <span class="item-label">{{ t('ai.portfolioOptimization') }}</span>
                <div class="item-bar">
                  <div 
                    class="item-fill bg-purple-500"
                    :style="{ width: `${getPortfolioScore()}%` }"
                  ></div>
                </div>
                <span class="item-value">{{ getPortfolioScore() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SWOT分析 -->
      <div class="swot-analysis mb-6">
        <h5 class="section-title mb-4">{{ t('ai.swotAnalysis') }}</h5>
        
        <div class="swot-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="swot-card strengths">
            <div class="swot-header">
              <CheckCircleIcon class="w-5 h-5 text-green-500" />
              <span class="swot-title">{{ t('ai.strengths') }}</span>
            </div>
            <ul class="swot-list">
              <li v-for="strength in analysisResult.strengths" :key="strength" class="swot-item">
                {{ strength }}
              </li>
            </ul>
          </div>
          
          <div class="swot-card weaknesses">
            <div class="swot-header">
              <ExclamationTriangleIcon class="w-5 h-5 text-red-500" />
              <span class="swot-title">{{ t('ai.weaknesses') }}</span>
            </div>
            <ul class="swot-list">
              <li v-for="weakness in analysisResult.weaknesses" :key="weakness" class="swot-item">
                {{ weakness }}
              </li>
            </ul>
          </div>
          
          <div class="swot-card opportunities">
            <div class="swot-header">
              <LightBulbIcon class="w-5 h-5 text-blue-500" />
              <span class="swot-title">{{ t('ai.opportunities') }}</span>
            </div>
            <ul class="swot-list">
              <li v-for="opportunity in analysisResult.opportunities" :key="opportunity" class="swot-item">
                {{ opportunity }}
              </li>
            </ul>
          </div>
          
          <div class="swot-card threats">
            <div class="swot-header">
              <ShieldExclamationIcon class="w-5 h-5 text-orange-500" />
              <span class="swot-title">{{ t('ai.threats') }}</span>
            </div>
            <ul class="swot-list">
              <li v-for="threat in analysisResult.threats" :key="threat" class="swot-item">
                {{ threat }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- AI建议列表 -->
      <div class="recommendations">
        <div class="recommendations-header flex items-center justify-between mb-4">
          <h5 class="section-title">{{ t('ai.personalizedRecommendations') }}</h5>
          
          <div class="recommendations-filters flex items-center space-x-2">
            <select v-model="selectedPriority" class="filter-select">
              <option value="">{{ t('ai.allPriorities') }}</option>
              <option value="critical">{{ t('ai.critical') }}</option>
              <option value="high">{{ t('ai.high') }}</option>
              <option value="medium">{{ t('ai.medium') }}</option>
              <option value="low">{{ t('ai.low') }}</option>
            </select>
            
            <select v-model="selectedType" class="filter-select">
              <option value="">{{ t('ai.allTypes') }}</option>
              <option value="investment">{{ t('ai.investment') }}</option>
              <option value="retirement">{{ t('ai.retirement') }}</option>
              <option value="tax">{{ t('ai.tax') }}</option>
              <option value="risk">{{ t('ai.risk') }}</option>
              <option value="savings">{{ t('ai.savings') }}</option>
            </select>
          </div>
        </div>
        
        <div class="recommendations-list space-y-4">
          <div
            v-for="recommendation in filteredRecommendations"
            :key="recommendation.id"
            class="recommendation-card"
            :class="getRecommendationCardClasses(recommendation)"
          >
            <div class="recommendation-header">
              <div class="recommendation-meta">
                <div class="recommendation-priority" :class="getPriorityClasses(recommendation.priority)">
                  {{ getPriorityText(recommendation.priority) }}
                </div>
                <div class="recommendation-confidence">
                  {{ recommendation.confidence }}% {{ t('ai.confidence') }}
                </div>
              </div>
              
              <div class="recommendation-actions">
                <button
                  @click="toggleRecommendationDetails(recommendation.id)"
                  class="details-toggle"
                >
                  <ChevronDownIcon 
                    :class="{ 'rotate-180': expandedRecommendations.has(recommendation.id) }"
                    class="w-4 h-4 transition-transform duration-200"
                  />
                </button>
              </div>
            </div>
            
            <div class="recommendation-content">
              <h6 class="recommendation-title">{{ recommendation.title }}</h6>
              <p class="recommendation-description">{{ recommendation.description }}</p>
              
              <div class="recommendation-tags mt-2">
                <span
                  v-for="tag in recommendation.tags"
                  :key="tag"
                  class="recommendation-tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            
            <!-- 详细信息 -->
            <div v-if="expandedRecommendations.has(recommendation.id)" class="recommendation-details mt-4">
              <div class="details-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="detail-section">
                  <h7 class="detail-title">{{ t('ai.reasoning') }}</h7>
                  <p class="detail-content">{{ recommendation.reasoning }}</p>
                </div>
                
                <div class="detail-section">
                  <h7 class="detail-title">{{ t('ai.expectedOutcome') }}</h7>
                  <p class="detail-content">{{ recommendation.expectedOutcome }}</p>
                </div>
                
                <div class="detail-section">
                  <h7 class="detail-title">{{ t('ai.actionItems') }}</h7>
                  <ul class="action-list">
                    <li v-for="action in recommendation.actionItems" :key="action" class="action-item">
                      {{ action }}
                    </li>
                  </ul>
                </div>
                
                <div class="detail-section">
                  <h7 class="detail-title">{{ t('ai.investmentDetails') }}</h7>
                  <div class="investment-details">
                    <div class="detail-row">
                      <span class="detail-label">{{ t('ai.timeframe') }}:</span>
                      <span class="detail-value">{{ recommendation.timeframe }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">{{ t('ai.riskLevel') }}:</span>
                      <span class="detail-value" :class="getRiskLevelClasses(recommendation.riskLevel)">
                        {{ getRiskLevelText(recommendation.riskLevel) }}
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">{{ t('ai.potentialReturn') }}:</span>
                      <span class="detail-value text-green-600 dark:text-green-400">
                        {{ recommendation.potentialReturn }}%
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">{{ t('ai.requiredCapital') }}:</span>
                      <span class="detail-value">
                        {{ formatCurrency(recommendation.requiredCapital) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 建议操作 -->
              <div class="recommendation-actions-bar mt-4">
                <button
                  @click="implementRecommendation(recommendation)"
                  class="implement-button"
                >
                  <CheckIcon class="w-4 h-4 mr-2" />
                  {{ t('ai.implement') }}
                </button>
                
                <button
                  @click="saveRecommendation(recommendation)"
                  class="save-button"
                >
                  <BookmarkIcon class="w-4 h-4 mr-2" />
                  {{ t('ai.saveForLater') }}
                </button>
                
                <button
                  @click="provideFeedback(recommendation)"
                  class="feedback-button"
                >
                  <ChatBubbleLeftRightIcon class="w-4 h-4 mr-2" />
                  {{ t('ai.provideFeedback') }}
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="filteredRecommendations.length === 0" class="empty-recommendations">
            <SparklesIcon class="w-12 h-12 text-gray-400 mb-4" />
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('ai.noRecommendations') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析按钮 -->
    <div v-if="userProfile && !analysisResult" class="analyze-section mb-8">
      <button
        @click="runAnalysis"
        :disabled="isAnalyzing"
        class="analyze-button"
      >
        <SparklesIcon v-if="!isAnalyzing" class="w-5 h-5 mr-2" />
        <ArrowPathIcon v-else class="w-5 h-5 mr-2 animate-spin" />
        {{ isAnalyzing ? t('ai.analyzing') : t('ai.analyzeFinances') }}
      </button>
    </div>

    <!-- AI设置模态框 -->
    <AISettingsModal
      v-if="showSettings"
      @close="showSettings = false"
      @settings-updated="handleSettingsUpdated"
    />

    <!-- 加载状态 -->
    <div v-if="isAnalyzing" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">{{ t('ai.analyzingYourFinances') }}</p>
        <p class="loading-subtext">{{ t('ai.thisWillTakeAMoment') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  SparklesIcon,
  CogIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ShieldExclamationIcon,
  ChevronDownIcon,
  CheckIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import UserProfileForm from './UserProfileForm.vue'
import AISettingsModal from './AISettingsModal.vue'
import { useAIAdvisor } from '@/services/AIAdvisorManager'
import { useI18n } from '@/services/I18nService'
import type { UserProfile, AIAnalysisResult, AIAdvice } from '@/services/AIAdvisorManager'

// Props
interface Props {
  autoAnalyze?: boolean
  showTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoAnalyze: false,
  showTitle: true
})

// 使用服务
const {
  stats,
  isAnalyzing,
  modelStatus,
  analyzeUserFinances,
  getAdviceByType,
  updateMarketBasedAdvice
} = useAIAdvisor()

const { t } = useI18n()

// 响应式状态
const userProfile = ref<UserProfile | null>(null)
const analysisResult = ref<AIAnalysisResult | null>(null)
const showSettings = ref(false)
const showScoreDetails = ref(false)
const selectedPriority = ref('')
const selectedType = ref('')
const expandedRecommendations = reactive(new Set<string>())

// 圆形进度条参数
const circumference = 2 * Math.PI * 45

// 计算属性
const containerClasses = computed(() => [
  'ai-advisor-panel',
  'bg-white',
  'dark:bg-gray-900',
  'rounded-lg',
  'p-6',
  'max-w-7xl',
  'mx-auto'
])

const ariaLabel = computed(() => {
  return `${t('ai.intelligentAdvisor')}: ${analysisResult.value ? t('ai.analysisComplete') : t('ai.readyToAnalyze')}`
})

const filteredRecommendations = computed(() => {
  if (!analysisResult.value) return []
  
  let recommendations = analysisResult.value.recommendations
  
  if (selectedPriority.value) {
    recommendations = recommendations.filter(r => r.priority === selectedPriority.value)
  }
  
  if (selectedType.value) {
    recommendations = recommendations.filter(r => r.type === selectedType.value)
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
})

// 方法
const getStatusIndicatorClasses = (): string[] => {
  const classes = ['w-3', 'h-3', 'rounded-full']
  
  switch (modelStatus.value) {
    case 'ready':
      classes.push('bg-green-500')
      break
    case 'loading':
      classes.push('bg-yellow-500', 'animate-pulse')
      break
    case 'error':
      classes.push('bg-red-500')
      break
  }
  
  return classes
}

const getStatusText = (): string => {
  switch (modelStatus.value) {
    case 'ready': return t('ai.ready')
    case 'loading': return t('ai.loading')
    case 'error': return t('ai.error')
    default: return t('ai.unknown')
  }
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981' // green
  if (score >= 60) return '#f59e0b' // yellow
  return '#ef4444' // red
}

const getScoreOffset = (score: number): number => {
  return circumference - (score / 100) * circumference
}

const getScoreDescription = (score: number): string => {
  if (score >= 90) return t('ai.excellent')
  if (score >= 80) return t('ai.veryGood')
  if (score >= 70) return t('ai.good')
  if (score >= 60) return t('ai.fair')
  if (score >= 50) return t('ai.needsImprovement')
  return t('ai.critical')
}

const getScoreTextClasses = (score: number): string[] => {
  const classes = ['font-semibold']
  
  if (score >= 80) classes.push('text-green-600', 'dark:text-green-400')
  else if (score >= 60) classes.push('text-yellow-600', 'dark:text-yellow-400')
  else classes.push('text-red-600', 'dark:text-red-400')
  
  return classes
}

const getRiskScore = (): number => {
  if (!analysisResult.value) return 0
  return Math.max(0, 100 - Math.abs(analysisResult.value.riskAssessment.riskGap) * 10)
}

const getPortfolioScore = (): number => {
  if (!analysisResult.value) return 0
  return Math.min(100, 50 + analysisResult.value.portfolioOptimization.expectedImprovement * 10)
}

const getRecommendationCardClasses = (recommendation: AIAdvice): string[] => {
  const classes = [
    'recommendation-card',
    'bg-white',
    'dark:bg-gray-800',
    'rounded-lg',
    'p-4',
    'border-l-4',
    'shadow-sm',
    'hover:shadow-md',
    'transition-shadow',
    'duration-200'
  ]
  
  switch (recommendation.priority) {
    case 'critical':
      classes.push('border-red-500')
      break
    case 'high':
      classes.push('border-orange-500')
      break
    case 'medium':
      classes.push('border-blue-500')
      break
    case 'low':
      classes.push('border-gray-300')
      break
  }
  
  return classes
}

const getPriorityClasses = (priority: string): string[] => {
  const classes = ['px-2', 'py-1', 'rounded-full', 'text-xs', 'font-medium']
  
  switch (priority) {
    case 'critical':
      classes.push('bg-red-100', 'text-red-800', 'dark:bg-red-900/20', 'dark:text-red-400')
      break
    case 'high':
      classes.push('bg-orange-100', 'text-orange-800', 'dark:bg-orange-900/20', 'dark:text-orange-400')
      break
    case 'medium':
      classes.push('bg-blue-100', 'text-blue-800', 'dark:bg-blue-900/20', 'dark:text-blue-400')
      break
    case 'low':
      classes.push('bg-gray-100', 'text-gray-800', 'dark:bg-gray-800', 'dark:text-gray-400')
      break
  }
  
  return classes
}

const getPriorityText = (priority: string): string => {
  const priorityMap = {
    critical: t('ai.critical'),
    high: t('ai.high'),
    medium: t('ai.medium'),
    low: t('ai.low')
  }
  return priorityMap[priority as keyof typeof priorityMap] || priority
}

const getRiskLevelClasses = (riskLevel: string): string[] => {
  const classes = ['font-medium']
  
  switch (riskLevel) {
    case 'high':
      classes.push('text-red-600', 'dark:text-red-400')
      break
    case 'medium':
      classes.push('text-yellow-600', 'dark:text-yellow-400')
      break
    case 'low':
      classes.push('text-green-600', 'dark:text-green-400')
      break
  }
  
  return classes
}

const getRiskLevelText = (riskLevel: string): string => {
  const riskMap = {
    high: t('ai.highRisk'),
    medium: t('ai.mediumRisk'),
    low: t('ai.lowRisk')
  }
  return riskMap[riskLevel as keyof typeof riskMap] || riskLevel
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatLastAnalysis = (): string => {
  if (!stats.lastAnalysisTime) return t('ai.never')
  
  const now = new Date()
  const diff = now.getTime() - stats.lastAnalysisTime.getTime()
  
  if (diff < 60000) return t('ai.justNow')
  if (diff < 3600000) return t('ai.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('ai.hoursAgo', { count: Math.floor(diff / 3600000) })
  
  return stats.lastAnalysisTime.toLocaleDateString('de-DE')
}

const handleProfileCreated = (profile: UserProfile): void => {
  userProfile.value = profile
  
  if (props.autoAnalyze) {
    runAnalysis()
  }
}

const handleProfileUpdated = (profile: UserProfile): void => {
  userProfile.value = profile
  analysisResult.value = null // 清除旧分析结果
}

const runAnalysis = async (): Promise<void> => {
  if (!userProfile.value) return

  try {
    const result = await analyzeUserFinances(userProfile.value)
    analysisResult.value = result
  } catch (error) {
    console.error('Analysis failed:', error)
    // 显示错误提示
  }
}

const toggleRecommendationDetails = (recommendationId: string): void => {
  if (expandedRecommendations.has(recommendationId)) {
    expandedRecommendations.delete(recommendationId)
  } else {
    expandedRecommendations.add(recommendationId)
  }
}

const implementRecommendation = (recommendation: AIAdvice): void => {
  console.log('Implementing recommendation:', recommendation)
  // 实现建议的具体逻辑
}

const saveRecommendation = (recommendation: AIAdvice): void => {
  console.log('Saving recommendation:', recommendation)
  // 保存建议的逻辑
}

const provideFeedback = (recommendation: AIAdvice): void => {
  console.log('Providing feedback for recommendation:', recommendation)
  // 反馈逻辑
}

const handleSettingsUpdated = (settings: any): void => {
  console.log('AI settings updated:', settings)
  showSettings.value = false
}
</script>

<style scoped>
.ai-advisor-panel {
  @apply min-h-screen;
}

.score-card {
  @apply bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800;
}

.score-display {
  @apply flex items-center space-x-6;
}

.score-circle {
  @apply relative w-24 h-24;
}

.score-svg {
  @apply w-full h-full transform -rotate-90;
}

.score-progress {
  transition: stroke-dashoffset 1s ease-in-out;
}

.score-text {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.score-number {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.score-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.breakdown-item {
  @apply flex items-center space-x-3;
}

.item-label {
  @apply text-sm text-gray-600 dark:text-gray-400 w-32 flex-shrink-0;
}

.item-bar {
  @apply flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.item-fill {
  @apply h-full transition-all duration-500;
}

.item-value {
  @apply text-sm font-medium text-gray-900 dark:text-white w-8 text-right;
}

.swot-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
}

.swot-header {
  @apply flex items-center space-x-2 mb-3;
}

.swot-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.swot-list {
  @apply space-y-2;
}

.swot-item {
  @apply text-sm text-gray-600 dark:text-gray-400 flex items-start;
}

.swot-item::before {
  @apply content-['•'] text-current mr-2 flex-shrink-0;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.filter-select {
  @apply px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.recommendation-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.recommendation-description {
  @apply text-gray-600 dark:text-gray-400 mb-3;
}

.recommendation-tag {
  @apply inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full mr-2;
}

.detail-title {
  @apply text-sm font-medium text-gray-900 dark:text-white mb-2;
}

.detail-content {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.action-list {
  @apply space-y-1;
}

.action-item {
  @apply text-sm text-gray-600 dark:text-gray-400 flex items-start;
}

.action-item::before {
  @apply content-['✓'] text-green-500 mr-2 flex-shrink-0;
}

.detail-row {
  @apply flex justify-between items-center py-1;
}

.detail-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.detail-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.settings-button,
.details-toggle,
.implement-button,
.save-button,
.feedback-button,
.analyze-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.settings-button,
.details-toggle {
  @apply text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500;
}

.implement-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.save-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.feedback-button {
  @apply text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500;
}

.analyze-button {
  @apply text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed px-8 py-4 text-lg focus:ring-blue-500;
}

.loading-overlay {
  @apply fixed inset-0 bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50;
}

.loading-content {
  @apply text-center;
}

.loading-spinner {
  @apply w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4;
}

.loading-text {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-2;
}

.loading-subtext {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.empty-recommendations {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .swot-grid {
    @apply grid-cols-1;
  }
  
  .details-grid {
    @apply grid-cols-1;
  }
  
  .score-display {
    @apply flex-col space-x-0 space-y-4;
  }
  
  .recommendations-filters {
    @apply flex-col space-x-0 space-y-2;
  }
}

/* 动画 */
.recommendation-card {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
