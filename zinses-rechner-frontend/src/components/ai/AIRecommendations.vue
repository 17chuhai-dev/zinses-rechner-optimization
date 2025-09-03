<!--
  AI建议展示组件
  显示个性化的财务建议和分析结果
-->

<template>
  <div class="ai-recommendations">
    <!-- 头部信息 -->
    <div class="recommendations-header">
      <div class="header-content">
        <div class="ai-icon">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div class="header-text">
          <h2 class="header-title">Ihre persönlichen AI-Empfehlungen</h2>
          <p class="header-subtitle">
            Basierend auf Ihrer Finanzanalyse haben wir {{ recommendations.length }} 
            personalisierte Empfehlungen für Sie erstellt
          </p>
        </div>
      </div>
      
      <!-- 过滤器 -->
      <div class="filter-controls">
        <div class="filter-group">
          <label class="filter-label">Kategorie:</label>
          <select v-model="selectedType" class="filter-select">
            <option value="">Alle</option>
            <option value="investment">Investment</option>
            <option value="risk">Risiko</option>
            <option value="planning">Planung</option>
            <option value="optimization">Optimierung</option>
            <option value="warning">Warnung</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Priorität:</label>
          <select v-model="selectedPriority" class="filter-select">
            <option value="">Alle</option>
            <option value="critical">Kritisch</option>
            <option value="high">Hoch</option>
            <option value="medium">Mittel</option>
            <option value="low">Niedrig</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 建议列表 -->
    <div class="recommendations-list">
      <TransitionGroup name="recommendation" tag="div" class="recommendations-grid">
        <div
          v-for="recommendation in filteredRecommendations"
          :key="recommendation.id"
          class="recommendation-card"
          :class="getRecommendationClasses(recommendation)"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="priority-badge" :class="getPriorityClasses(recommendation.priority)">
              <span class="priority-text">{{ getPriorityText(recommendation.priority) }}</span>
            </div>
            
            <div class="type-icon" :class="getTypeClasses(recommendation.type)">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path v-if="recommendation.type === 'investment'" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                <path v-else-if="recommendation.type === 'risk'" fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                <path v-else-if="recommendation.type === 'planning'" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path v-else-if="recommendation.type === 'optimization'" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                <path v-else d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <h3 class="recommendation-title">{{ recommendation.title }}</h3>
            <p class="recommendation-description">{{ recommendation.description }}</p>
            
            <!-- 预期影响 -->
            <div class="expected-impact">
              <div class="impact-item">
                <span class="impact-label">Finanzieller Einfluss:</span>
                <span class="impact-value financial">
                  {{ formatCurrency(recommendation.expectedImpact.financial) }}
                </span>
              </div>
              
              <div class="impact-item">
                <span class="impact-label">Risiko:</span>
                <span class="impact-value" :class="getRiskClasses(recommendation.expectedImpact.risk)">
                  {{ getRiskText(recommendation.expectedImpact.risk) }}
                </span>
              </div>
              
              <div class="impact-item">
                <span class="impact-label">Zeitrahmen:</span>
                <span class="impact-value">{{ recommendation.expectedImpact.timeframe }}</span>
              </div>
            </div>

            <!-- 置信度 -->
            <div class="confidence-meter">
              <div class="confidence-label">
                Vertrauen: {{ recommendation.confidence }}%
              </div>
              <div class="confidence-bar">
                <div 
                  class="confidence-fill"
                  :style="{ width: `${recommendation.confidence}%` }"
                  :class="getConfidenceClasses(recommendation.confidence)"
                ></div>
              </div>
            </div>

            <!-- 标签 -->
            <div class="recommendation-tags">
              <span
                v-for="tag in recommendation.tags"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 可展开的详细信息 -->
          <div class="card-expandable">
            <button
              type="button"
              class="expand-button"
              @click="toggleExpanded(recommendation.id)"
              :aria-expanded="expandedCards.has(recommendation.id)"
            >
              <span>{{ expandedCards.has(recommendation.id) ? 'Weniger anzeigen' : 'Details anzeigen' }}</span>
              <svg 
                class="w-4 h-4 ml-2 transition-transform"
                :class="{ 'rotate-180': expandedCards.has(recommendation.id) }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <Transition name="expand">
              <div v-if="expandedCards.has(recommendation.id)" class="expanded-content">
                <!-- 推理过程 -->
                <div class="reasoning-section">
                  <h4 class="section-title">Begründung</h4>
                  <p class="reasoning-text">{{ recommendation.reasoning }}</p>
                </div>

                <!-- 行动项目 -->
                <div class="action-items-section">
                  <h4 class="section-title">Empfohlene Maßnahmen</h4>
                  <ul class="action-list">
                    <li
                      v-for="(action, index) in recommendation.actionItems"
                      :key="index"
                      class="action-item"
                    >
                      <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span>{{ action }}</span>
                    </li>
                  </ul>
                </div>

                <!-- 相关计算器 -->
                <div v-if="recommendation.relatedCalculators && recommendation.relatedCalculators.length > 0" class="related-calculators">
                  <h4 class="section-title">Passende Rechner</h4>
                  <div class="calculator-links">
                    <button
                      v-for="calculatorId in recommendation.relatedCalculators"
                      :key="calculatorId"
                      type="button"
                      class="calculator-link"
                      @click="navigateToCalculator(calculatorId)"
                    >
                      {{ getCalculatorName(calculatorId) }}
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredRecommendations.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20a7.962 7.962 0 01-5-1.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <h3 class="empty-title">Keine Empfehlungen gefunden</h3>
      <p class="empty-description">
        Versuchen Sie, die Filter zu ändern oder führen Sie eine neue Analyse durch.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { AIRecommendation } from '@/services/AIAdvisorService'

interface Props {
  recommendations: AIRecommendation[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const router = useRouter()

// 状态管理
const selectedType = ref('')
const selectedPriority = ref('')
const expandedCards = ref(new Set<string>())

// 过滤后的建议
const filteredRecommendations = computed(() => {
  return props.recommendations.filter(rec => {
    const typeMatch = !selectedType.value || rec.type === selectedType.value
    const priorityMatch = !selectedPriority.value || rec.priority === selectedPriority.value
    return typeMatch && priorityMatch
  })
})

// 工具方法
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const getPriorityText = (priority: string): string => {
  const texts = {
    critical: 'Kritisch',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig'
  }
  return texts[priority as keyof typeof texts] || priority
}

const getRiskText = (risk: string): string => {
  const texts = {
    decrease: 'Verringert',
    neutral: 'Neutral',
    increase: 'Erhöht'
  }
  return texts[risk as keyof typeof texts] || risk
}

const getCalculatorName = (calculatorId: string): string => {
  const names = {
    'portfolio-analysis': 'Portfolio-Analyse',
    'loan-comparison': 'Kredit-Vergleich',
    'insurance-calculator': 'Versicherungsrechner',
    'compound-interest': 'Zinseszins-Rechner'
  }
  return names[calculatorId as keyof typeof names] || calculatorId
}

// 样式类方法
const getRecommendationClasses = (recommendation: AIRecommendation) => [
  'recommendation-card',
  `priority-${recommendation.priority}`,
  `type-${recommendation.type}`
]

const getPriorityClasses = (priority: string) => [
  'priority-badge',
  `priority-${priority}`
]

const getTypeClasses = (type: string) => [
  'type-icon',
  `type-${type}`
]

const getRiskClasses = (risk: string) => [
  'risk-indicator',
  `risk-${risk}`
]

const getConfidenceClasses = (confidence: number) => {
  if (confidence >= 80) return 'confidence-high'
  if (confidence >= 60) return 'confidence-medium'
  return 'confidence-low'
}

// 交互方法
const toggleExpanded = (id: string) => {
  if (expandedCards.value.has(id)) {
    expandedCards.value.delete(id)
  } else {
    expandedCards.value.add(id)
  }
}

const navigateToCalculator = (calculatorId: string) => {
  router.push(`/calculator/${calculatorId}`)
}
</script>

<style scoped>
.ai-recommendations {
  @apply space-y-6;
}

.recommendations-header {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
         rounded-xl p-6 border border-blue-200 dark:border-blue-800;
}

.header-content {
  @apply flex items-center mb-4;
}

.ai-icon {
  @apply flex-shrink-0 mr-4;
}

.header-text {
  @apply flex-1;
}

.header-title {
  @apply text-xl font-bold text-gray-900 dark:text-white mb-1;
}

.header-subtitle {
  @apply text-gray-600 dark:text-gray-400;
}

.filter-controls {
  @apply flex flex-wrap gap-4;
}

.filter-group {
  @apply flex items-center space-x-2;
}

.filter-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.filter-select {
  @apply px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.recommendations-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.recommendation-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
         hover:shadow-md transition-all duration-200;
}

.card-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.priority-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.priority-critical {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.priority-high {
  @apply bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400;
}

.priority-medium {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.priority-low {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.type-icon {
  @apply p-2 rounded-lg;
}

.type-investment {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400;
}

.type-risk {
  @apply bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400;
}

.type-planning {
  @apply bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400;
}

.type-optimization {
  @apply bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400;
}

.type-warning {
  @apply bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.card-content {
  @apply p-4 space-y-4;
}

.recommendation-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.recommendation-description {
  @apply text-gray-600 dark:text-gray-400;
}

.expected-impact {
  @apply space-y-2;
}

.impact-item {
  @apply flex justify-between items-center text-sm;
}

.impact-label {
  @apply text-gray-500 dark:text-gray-400;
}

.impact-value {
  @apply font-medium;
}

.impact-value.financial {
  @apply text-green-600 dark:text-green-400;
}

.risk-decrease {
  @apply text-green-600 dark:text-green-400;
}

.risk-neutral {
  @apply text-gray-600 dark:text-gray-400;
}

.risk-increase {
  @apply text-red-600 dark:text-red-400;
}

.confidence-meter {
  @apply space-y-1;
}

.confidence-label {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.confidence-bar {
  @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2;
}

.confidence-fill {
  @apply h-2 rounded-full transition-all duration-300;
}

.confidence-high {
  @apply bg-green-500;
}

.confidence-medium {
  @apply bg-yellow-500;
}

.confidence-low {
  @apply bg-red-500;
}

.recommendation-tags {
  @apply flex flex-wrap gap-2;
}

.tag {
  @apply px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         text-xs rounded-full;
}

.expand-button {
  @apply w-full p-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
         border-t border-gray-200 dark:border-gray-700 flex items-center justify-center
         transition-colors;
}

.expanded-content {
  @apply p-4 border-t border-gray-200 dark:border-gray-700 space-y-4;
}

.section-title {
  @apply text-sm font-semibold text-gray-900 dark:text-white mb-2;
}

.reasoning-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.action-list {
  @apply space-y-2;
}

.action-item {
  @apply flex items-start text-sm text-gray-700 dark:text-gray-300;
}

.calculator-links {
  @apply flex flex-wrap gap-2;
}

.calculator-link {
  @apply px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300
         text-xs rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors;
}

.empty-state {
  @apply text-center py-12;
}

.empty-icon {
  @apply flex justify-center mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.empty-description {
  @apply text-gray-600 dark:text-gray-400;
}

/* 动画 */
.recommendation-enter-active,
.recommendation-leave-active {
  @apply transition-all duration-300;
}

.recommendation-enter-from,
.recommendation-leave-to {
  @apply opacity-0 transform scale-95;
}

.expand-enter-active,
.expand-leave-active {
  @apply transition-all duration-200;
}

.expand-enter-from,
.expand-leave-to {
  @apply opacity-0 transform -translate-y-2;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .recommendations-grid {
    @apply grid-cols-1;
  }
  
  .filter-controls {
    @apply flex-col space-y-2;
  }
  
  .filter-group {
    @apply w-full justify-between;
  }
  
  .filter-select {
    @apply flex-1 ml-4;
  }
}
</style>
