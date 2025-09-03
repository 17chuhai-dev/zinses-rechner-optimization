<!--
  AI智能分析页面
  提供完整的财务分析和个性化建议流程
-->

<template>
  <div class="ai-analysis-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container mx-auto px-4">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">AI-Finanzanalyse</h1>
            <p class="page-subtitle">
              Erhalten Sie personalisierte Empfehlungen basierend auf modernster KI-Technologie
            </p>
          </div>
          
          <div class="header-features">
            <div class="feature-item">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Personalisierte Analyse</span>
            </div>
            
            <div class="feature-item">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Wissenschaftlich fundiert</span>
            </div>
            
            <div class="feature-item">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Sofortige Umsetzung</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <div class="container mx-auto px-4">
        <!-- 步骤指示器 -->
        <div class="steps-indicator">
          <div class="step" :class="{ active: currentPhase === 'questionnaire', completed: isPhaseCompleted('questionnaire') }">
            <div class="step-number">1</div>
            <div class="step-label">Fragebogen</div>
          </div>
          
          <div class="step-connector" :class="{ active: isPhaseCompleted('questionnaire') }"></div>
          
          <div class="step" :class="{ active: currentPhase === 'analysis', completed: isPhaseCompleted('analysis') }">
            <div class="step-number">2</div>
            <div class="step-label">Analyse</div>
          </div>
          
          <div class="step-connector" :class="{ active: isPhaseCompleted('analysis') }"></div>
          
          <div class="step" :class="{ active: currentPhase === 'recommendations', completed: isPhaseCompleted('recommendations') }">
            <div class="step-number">3</div>
            <div class="step-label">Empfehlungen</div>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="content-area">
          <!-- 阶段1: 风险评估问卷 -->
          <div v-if="currentPhase === 'questionnaire'" class="phase-content">
            <RiskAssessmentQuestionnaire
              :initial-data="userProfile"
              @complete="handleQuestionnaireComplete"
              @cancel="handleCancel"
            />
          </div>

          <!-- 阶段2: 分析处理 -->
          <div v-if="currentPhase === 'analysis'" class="phase-content">
            <div class="analysis-container">
              <div class="analysis-header">
                <h2 class="analysis-title">Ihre Daten werden analysiert</h2>
                <p class="analysis-subtitle">
                  Unsere KI erstellt gerade Ihre personalisierte Finanzanalyse
                </p>
              </div>

              <div class="analysis-progress">
                <div class="progress-steps">
                  <div
                    v-for="(step, index) in analysisSteps"
                    :key="index"
                    class="progress-step"
                    :class="{ active: currentAnalysisStep >= index, completed: currentAnalysisStep > index }"
                  >
                    <div class="step-icon">
                      <svg v-if="currentAnalysisStep > index" class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <div v-else class="step-spinner" :class="{ spinning: currentAnalysisStep === index }"></div>
                    </div>
                    <span class="step-text">{{ step }}</span>
                  </div>
                </div>

                <div class="overall-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill"
                      :style="{ width: `${(currentAnalysisStep / analysisSteps.length) * 100}%` }"
                    ></div>
                  </div>
                  <div class="progress-text">
                    {{ Math.round((currentAnalysisStep / analysisSteps.length) * 100) }}% abgeschlossen
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 阶段3: AI建议展示 -->
          <div v-if="currentPhase === 'recommendations'" class="phase-content">
            <AIRecommendations
              :recommendations="recommendations"
              :loading="isLoadingRecommendations"
            />

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button
                type="button"
                class="action-button secondary"
                @click="restartAnalysis"
              >
                Neue Analyse starten
              </button>
              
              <button
                type="button"
                class="action-button primary"
                @click="exportRecommendations"
                :disabled="isExporting"
              >
                <svg v-if="isExporting" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ isExporting ? 'Wird exportiert...' : 'Als PDF exportieren' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalNotifications } from '@/composables/useNotifications'
import RiskAssessmentQuestionnaire from '@/components/ai/RiskAssessmentQuestionnaire.vue'
import AIRecommendations from '@/components/ai/AIRecommendations.vue'
import { aiAdvisorService } from '@/services/AIAdvisorService'
import type { UserProfile, AIRecommendation } from '@/services/AIAdvisorService'

// 组合函数
const router = useRouter()
const notifications = useGlobalNotifications()

// 状态管理
const currentPhase = ref<'questionnaire' | 'analysis' | 'recommendations'>('questionnaire')
const completedPhases = ref<Set<string>>(new Set())
const userProfile = ref<UserProfile | null>(null)
const recommendations = ref<AIRecommendation[]>([])
const isLoadingRecommendations = ref(false)
const isExporting = ref(false)

// 分析步骤
const analysisSteps = [
  'Risikoprofil wird erstellt',
  'Finanzielle Situation wird bewertet',
  'Marktdaten werden analysiert',
  'Empfehlungen werden generiert',
  'Ergebnisse werden aufbereitet'
]
const currentAnalysisStep = ref(0)

// 计算属性
const isPhaseCompleted = (phase: string) => completedPhases.value.has(phase)

// 事件处理
const handleQuestionnaireComplete = async (profile: UserProfile) => {
  userProfile.value = profile
  completedPhases.value.add('questionnaire')
  currentPhase.value = 'analysis'
  
  // 开始分析过程
  await startAnalysis(profile)
}

const handleCancel = () => {
  router.push('/')
}

// 分析处理
const startAnalysis = async (profile: UserProfile) => {
  try {
    // 模拟分析步骤
    for (let i = 0; i < analysisSteps.length; i++) {
      currentAnalysisStep.value = i
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    
    currentAnalysisStep.value = analysisSteps.length
    
    // 生成AI建议
    isLoadingRecommendations.value = true
    
    // 创建模拟的计算结果
    const mockCalculationResult = {
      finalAmount: profile.currentAssets + (profile.monthlyIncome - profile.monthlyExpenses) * 12 * profile.timeHorizon * 1.05,
      totalContributions: (profile.monthlyIncome - profile.monthlyExpenses) * 12 * profile.timeHorizon,
      totalInterest: 0,
      yearlyBreakdown: []
    }
    
    // 生成AI建议
    const aiRecommendations = await aiAdvisorService.generateRecommendations(
      mockCalculationResult,
      profile
    )
    
    recommendations.value = aiRecommendations
    completedPhases.value.add('analysis')
    currentPhase.value = 'recommendations'
    
    // 显示成功通知
    notifications.success(
      'Analyse abgeschlossen',
      `${aiRecommendations.length} personalisierte Empfehlungen wurden erstellt.`
    )
    
  } catch (error) {
    console.error('分析失败:', error)
    notifications.error(
      'Analyse fehlgeschlagen',
      'Bei der Erstellung Ihrer Empfehlungen ist ein Fehler aufgetreten.'
    )
  } finally {
    isLoadingRecommendations.value = false
  }
}

// 重新开始分析
const restartAnalysis = () => {
  currentPhase.value = 'questionnaire'
  completedPhases.value.clear()
  userProfile.value = null
  recommendations.value = []
  currentAnalysisStep.value = 0
}

// 导出建议
const exportRecommendations = async () => {
  if (!userProfile.value || recommendations.value.length === 0) return
  
  isExporting.value = true
  
  try {
    // 模拟PDF导出
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    notifications.success(
      'Export erfolgreich',
      'Ihre Empfehlungen wurden als PDF heruntergeladen.'
    )
  } catch (error) {
    console.error('导出失败:', error)
    notifications.error(
      'Export fehlgeschlagen',
      'Beim Erstellen der PDF ist ein Fehler aufgetreten.'
    )
  } finally {
    isExporting.value = false
  }
}

// 页面初始化
onMounted(() => {
  // 可以从URL参数或本地存储恢复状态
  const savedProfile = localStorage.getItem('ai-analysis-profile')
  if (savedProfile) {
    try {
      userProfile.value = JSON.parse(savedProfile)
    } catch (error) {
      console.error('无法恢复用户画像:', error)
    }
  }
})
</script>

<style scoped>
.ai-analysis-view {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.page-header {
  @apply bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16;
}

.header-content {
  @apply flex flex-col lg:flex-row lg:items-center lg:justify-between;
}

.header-text {
  @apply mb-8 lg:mb-0;
}

.page-title {
  @apply text-4xl lg:text-5xl font-bold mb-4;
}

.page-subtitle {
  @apply text-xl text-blue-100 max-w-2xl;
}

.header-features {
  @apply flex flex-col sm:flex-row gap-6;
}

.feature-item {
  @apply flex items-center space-x-3 text-blue-100;
}

.main-content {
  @apply py-12;
}

.steps-indicator {
  @apply flex items-center justify-center mb-12;
}

.step {
  @apply flex flex-col items-center;
}

.step-number {
  @apply w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 
         flex items-center justify-center text-sm font-medium
         bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400
         transition-all duration-200;
}

.step.active .step-number {
  @apply border-blue-500 bg-blue-500 text-white;
}

.step.completed .step-number {
  @apply border-green-500 bg-green-500 text-white;
}

.step-label {
  @apply mt-2 text-sm font-medium text-gray-600 dark:text-gray-400;
}

.step.active .step-label {
  @apply text-blue-600 dark:text-blue-400;
}

.step.completed .step-label {
  @apply text-green-600 dark:text-green-400;
}

.step-connector {
  @apply w-16 h-0.5 bg-gray-300 dark:bg-gray-600 mx-4 transition-colors duration-200;
}

.step-connector.active {
  @apply bg-green-500;
}

.content-area {
  @apply max-w-4xl mx-auto;
}

.phase-content {
  @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8;
}

.analysis-container {
  @apply text-center space-y-8;
}

.analysis-header {
  @apply space-y-2;
}

.analysis-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.analysis-subtitle {
  @apply text-gray-600 dark:text-gray-400;
}

.analysis-progress {
  @apply space-y-8;
}

.progress-steps {
  @apply space-y-4;
}

.progress-step {
  @apply flex items-center justify-center space-x-3 text-gray-500 dark:text-gray-400;
}

.progress-step.active {
  @apply text-blue-600 dark:text-blue-400;
}

.progress-step.completed {
  @apply text-green-600 dark:text-green-400;
}

.step-icon {
  @apply w-6 h-6 flex items-center justify-center;
}

.step-spinner {
  @apply w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full;
}

.step-spinner.spinning {
  @apply animate-spin;
}

.overall-progress {
  @apply space-y-2;
}

.progress-bar {
  @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2;
}

.progress-fill {
  @apply bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out;
}

.progress-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.action-buttons {
  @apply flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-8 border-t border-gray-200 dark:border-gray-700;
}

.action-button {
  @apply px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600;
}

.action-button.secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         hover:bg-gray-300 dark:hover:bg-gray-600;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .page-header {
    @apply py-12;
  }
  
  .page-title {
    @apply text-3xl;
  }
  
  .page-subtitle {
    @apply text-lg;
  }
  
  .header-features {
    @apply gap-4;
  }
  
  .steps-indicator {
    @apply px-4;
  }
  
  .step-connector {
    @apply w-8 mx-2;
  }
  
  .phase-content {
    @apply p-4;
  }
  
  .action-buttons {
    @apply flex-col;
  }
}
</style>
