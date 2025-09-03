<!--
  投资建议示例组件
  展示投资建议系统的完整功能和交互
-->

<template>
  <div class="investment-advice-example">
    <div class="example-header">
      <h1>Intelligente Anlageberatung</h1>
      <p>Erhalten Sie personalisierte Investmentempfehlungen basierend auf Ihren Zielen und Ihrer Risikotoleranz</p>
    </div>

    <!-- 用户输入区域 -->
    <div class="user-inputs-section">
      <h2>Ihre Anlageparameter</h2>
      <div class="inputs-grid">
        <div class="input-group">
          <label>Anfangsbetrag (€)</label>
          <input
            v-model.number="userInputs.initialAmount"
            type="number"
            min="0"
            step="1000"
            class="input-field"
            @input="updateAdvice"
          />
        </div>

        <div class="input-group">
          <label>Monatliche Sparrate (€)</label>
          <input
            v-model.number="userInputs.monthlyContribution"
            type="number"
            min="0"
            step="50"
            class="input-field"
            @input="updateAdvice"
          />
        </div>

        <div class="input-group">
          <label>Gewünschte Rendite (%)</label>
          <input
            v-model.number="userInputs.annualRate"
            type="number"
            min="0"
            max="20"
            step="0.1"
            class="input-field"
            @input="updateAdvice"
          />
        </div>

        <div class="input-group">
          <label>Anlagehorizont (Jahre)</label>
          <input
            v-model.number="userInputs.years"
            type="number"
            min="1"
            max="50"
            step="1"
            class="input-field"
            @input="updateAdvice"
          />
        </div>

        <div class="input-group">
          <label>Risikotoleranz</label>
          <select v-model="userInputs.riskTolerance" @change="updateAdvice" class="input-field">
            <option value="conservative">Konservativ</option>
            <option value="moderate">Ausgewogen</option>
            <option value="aggressive">Risikofreudig</option>
          </select>
        </div>

        <div class="input-group">
          <label>Anlageziel</label>
          <select v-model="userInputs.investmentGoal" @change="updateAdvice" class="input-field">
            <option value="retirement">Altersvorsorge</option>
            <option value="wealth_building">Vermögensaufbau</option>
            <option value="income">Einkommen generieren</option>
            <option value="education">Bildungsfinanzierung</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 投资建议引擎 -->
    <div class="advice-engine-section">
      <InvestmentAdviceEngine
        :user-inputs="userInputs"
        :current-results="currentResults"
        @recommendation-applied="handleRecommendationApplied"
        @suggestion-implemented="handleSuggestionImplemented"
        @parameters-updated="handleParametersUpdated"
      />
    </div>

    <!-- 应用的建议历史 -->
    <div v-if="appliedRecommendations.length > 0" class="applied-recommendations-section">
      <h2>Angewendete Empfehlungen</h2>
      <div class="applied-recommendations-list">
        <div
          v-for="(recommendation, index) in appliedRecommendations"
          :key="index"
          class="applied-recommendation-card"
        >
          <div class="card-header">
            <div class="recommendation-icon">
              <Icon :name="recommendation.icon" size="md" />
            </div>
            <div class="recommendation-info">
              <h4>{{ recommendation.title }}</h4>
              <p>{{ recommendation.description }}</p>
            </div>
            <div class="recommendation-status">
              <span class="status-badge applied">Angewendet</span>
            </div>
          </div>

          <div class="card-metrics">
            <div class="metric">
              <span class="metric-label">Erwartete Rendite:</span>
              <span class="metric-value positive">{{ formatPercentage(recommendation.expectedReturn) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Risiko:</span>
              <span class="metric-value" :class="getRiskClass(recommendation.riskLevel)">
                {{ getRiskLabel(recommendation.riskLevel) }}
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Angewendet am:</span>
              <span class="metric-value">{{ formatDate(recommendation.appliedAt) }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button @click="removeRecommendation(index)" class="remove-button">
              <Icon name="x" size="sm" />
              Entfernen
            </button>
            <button @click="viewRecommendationDetails(recommendation)" class="details-button">
              <Icon name="info" size="sm" />
              Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 实施的建议历史 -->
    <div v-if="implementedSuggestions.length > 0" class="implemented-suggestions-section">
      <h2>Umgesetzte Optimierungen</h2>
      <div class="implemented-suggestions-list">
        <div
          v-for="(suggestion, index) in implementedSuggestions"
          :key="index"
          class="implemented-suggestion-card"
        >
          <div class="card-header">
            <div class="suggestion-icon">
              <Icon :name="suggestion.icon" size="md" />
            </div>
            <div class="suggestion-info">
              <h4>{{ suggestion.title }}</h4>
              <p>{{ suggestion.description }}</p>
            </div>
            <div class="suggestion-savings">
              <span class="savings-label">Ersparnis:</span>
              <span class="savings-value">{{ formatCurrency(suggestion.potentialSaving) }}</span>
            </div>
          </div>

          <div class="implementation-progress">
            <div class="progress-header">
              <span class="progress-label">Umsetzungsfortschritt</span>
              <span class="progress-percentage">{{ suggestion.progress || 0 }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${suggestion.progress || 0}%` }"></div>
            </div>
          </div>

          <div class="card-actions">
            <button @click="updateProgress(suggestion, index)" class="progress-button">
              <Icon name="trending-up" size="sm" />
              Fortschritt aktualisieren
            </button>
            <button @click="completeSuggestion(suggestion, index)" class="complete-button">
              <Icon name="check" size="sm" />
              Als abgeschlossen markieren
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 投资表现跟踪 -->
    <div class="performance-tracking-section">
      <h2>Performance-Tracking</h2>
      <div class="performance-cards">
        <div class="performance-card">
          <div class="card-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Erwartete Jahresrendite</div>
            <div class="card-value">{{ formatPercentage(performanceMetrics.expectedAnnualReturn) }}</div>
            <div class="card-change positive">
              +{{ formatPercentage(performanceMetrics.returnImprovement) }} durch Optimierungen
            </div>
          </div>
        </div>

        <div class="performance-card">
          <div class="card-icon">
            <Icon name="shield" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Risiko-Score</div>
            <div class="card-value">{{ performanceMetrics.riskScore }}/10</div>
            <div class="card-change" :class="performanceMetrics.riskChange > 0 ? 'negative' : 'positive'">
              {{ performanceMetrics.riskChange > 0 ? '+' : '' }}{{ performanceMetrics.riskChange }} durch Anpassungen
            </div>
          </div>
        </div>

        <div class="performance-card">
          <div class="card-icon">
            <Icon name="dollar-sign" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Potenzielle Ersparnis</div>
            <div class="card-value">{{ formatCurrency(performanceMetrics.totalSavings) }}</div>
            <div class="card-change positive">
              Durch {{ implementedSuggestions.length }} Optimierungen
            </div>
          </div>
        </div>

        <div class="performance-card">
          <div class="card-icon">
            <Icon name="target" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Zielerreichung</div>
            <div class="card-value">{{ performanceMetrics.goalProgress }}%</div>
            <div class="card-change positive">
              {{ formatCurrency(performanceMetrics.projectedValue) }} prognostiziert
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下一步建议 -->
    <div class="next-steps-section">
      <h2>Nächste Schritte</h2>
      <div class="next-steps-list">
        <div
          v-for="(step, index) in nextSteps"
          :key="index"
          class="next-step-item"
          :class="{ 'completed': step.completed }"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content">
            <h4>{{ step.title }}</h4>
            <p>{{ step.description }}</p>
            <div class="step-timeline">
              <Icon name="clock" size="sm" />
              <span>{{ step.timeframe }}</span>
            </div>
          </div>
          <div class="step-actions">
            <button
              v-if="!step.completed"
              @click="completeStep(step, index)"
              class="complete-step-button"
            >
              <Icon name="check" size="sm" />
              Erledigt
            </button>
            <span v-else class="completed-badge">
              <Icon name="check-circle" size="sm" />
              Abgeschlossen
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-section">
      <div class="action-buttons">
        <button @click="exportAdviceReport" class="action-button primary">
          <Icon name="download" size="sm" />
          Beratungsbericht exportieren
        </button>
        <button @click="scheduleReview" class="action-button secondary">
          <Icon name="calendar" size="sm" />
          Überprüfung planen
        </button>
        <button @click="shareAdvice" class="action-button secondary">
          <Icon name="share-2" size="sm" />
          Empfehlungen teilen
        </button>
        <button @click="resetAdvice" class="action-button secondary">
          <Icon name="refresh-cw" size="sm" />
          Zurücksetzen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import InvestmentAdviceEngine from '@/components/advice/InvestmentAdviceEngine.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface UserInputs {
  initialAmount: number
  monthlyContribution: number
  annualRate: number
  years: number
  riskTolerance: string
  investmentGoal: string
}

interface AppliedRecommendation {
  id: string
  title: string
  description: string
  icon: string
  expectedReturn: number
  riskLevel: string
  appliedAt: Date
}

interface ImplementedSuggestion {
  id: string
  title: string
  description: string
  icon: string
  potentialSaving: number
  progress?: number
  implementedAt: Date
}

interface NextStep {
  id: string
  title: string
  description: string
  timeframe: string
  completed: boolean
}

interface PerformanceMetrics {
  expectedAnnualReturn: number
  returnImprovement: number
  riskScore: number
  riskChange: number
  totalSavings: number
  goalProgress: number
  projectedValue: number
}

// 响应式数据
const userInputs = reactive<UserInputs>({
  initialAmount: 25000,
  monthlyContribution: 800,
  annualRate: 7,
  years: 20,
  riskTolerance: 'moderate',
  investmentGoal: 'wealth_building'
})

const currentResults = ref<any>(null)
const appliedRecommendations = ref<AppliedRecommendation[]>([])
const implementedSuggestions = ref<ImplementedSuggestion[]>([])

const nextSteps = ref<NextStep[]>([
  {
    id: 'emergency-fund',
    title: 'Notgroschen aufbauen',
    description: 'Stellen Sie sicher, dass Sie 3-6 Monatsausgaben als Notreserve haben.',
    timeframe: '1-2 Monate',
    completed: false
  },
  {
    id: 'investment-account',
    title: 'Depot eröffnen',
    description: 'Eröffnen Sie ein kostengünstiges Depot bei einem Online-Broker.',
    timeframe: '1 Woche',
    completed: false
  },
  {
    id: 'automatic-savings',
    title: 'Sparplan einrichten',
    description: 'Richten Sie einen automatischen Sparplan für regelmäßige Investitionen ein.',
    timeframe: '1 Woche',
    completed: false
  },
  {
    id: 'diversification',
    title: 'Portfolio diversifizieren',
    description: 'Streuen Sie Ihr Risiko über verschiedene Anlageklassen.',
    timeframe: '2-4 Wochen',
    completed: false
  }
])

// 计算属性
const performanceMetrics = computed((): PerformanceMetrics => {
  const baseReturn = userInputs.annualRate / 100
  const returnImprovement = appliedRecommendations.value.reduce((sum, rec) =>
    sum + (rec.expectedReturn - baseReturn), 0
  )

  const totalSavings = implementedSuggestions.value.reduce((sum, sug) =>
    sum + sug.potentialSaving, 0
  )

  const riskScore = getRiskScore(userInputs.riskTolerance)
  const riskChange = appliedRecommendations.value.length > 0 ? -0.5 : 0

  const projectedValue = calculateProjectedValue()
  const goalProgress = Math.min(100, (projectedValue / (userInputs.initialAmount * 3)) * 100)

  return {
    expectedAnnualReturn: baseReturn + returnImprovement,
    returnImprovement,
    riskScore: riskScore + riskChange,
    riskChange,
    totalSavings,
    goalProgress,
    projectedValue
  }
})

// 方法
const calculateProjectedValue = (): number => {
  const monthlyRate = userInputs.annualRate / 100 / 12
  const totalMonths = userInputs.years * 12

  const futureValuePrincipal = userInputs.initialAmount * Math.pow(1 + userInputs.annualRate / 100, userInputs.years)
  const futureValueAnnuity = userInputs.monthlyContribution *
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)

  return futureValuePrincipal + futureValueAnnuity
}

const getRiskScore = (riskTolerance: string): number => {
  switch (riskTolerance) {
    case 'conservative': return 3
    case 'moderate': return 6
    case 'aggressive': return 9
    default: return 5
  }
}

const getRiskClass = (risk: string): string => {
  switch (risk) {
    case 'conservative': return 'low-risk'
    case 'moderate': return 'medium-risk'
    case 'aggressive': return 'high-risk'
    default: return ''
  }
}

const getRiskLabel = (risk: string): string => {
  switch (risk) {
    case 'conservative': return 'Niedrig'
    case 'moderate': return 'Mittel'
    case 'aggressive': return 'Hoch'
    default: return 'Unbekannt'
  }
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE')
}

const updateAdvice = () => {
  // 更新建议引擎的输入
  currentResults.value = {
    projectedValue: calculateProjectedValue(),
    totalContributions: userInputs.initialAmount + (userInputs.monthlyContribution * 12 * userInputs.years)
  }
}

const handleRecommendationApplied = (recommendation: any) => {
  appliedRecommendations.value.push({
    ...recommendation,
    appliedAt: new Date()
  })
}

const handleSuggestionImplemented = (suggestion: any) => {
  implementedSuggestions.value.push({
    ...suggestion,
    progress: 0,
    implementedAt: new Date()
  })
}

const handleParametersUpdated = (params: any) => {
  Object.assign(userInputs, params)
}

const removeRecommendation = (index: number) => {
  appliedRecommendations.value.splice(index, 1)
}

const viewRecommendationDetails = (recommendation: AppliedRecommendation) => {
  console.log('Viewing recommendation details:', recommendation.title)
}

const updateProgress = (suggestion: ImplementedSuggestion, index: number) => {
  const newProgress = prompt('Neuer Fortschritt (0-100):', String(suggestion.progress || 0))
  if (newProgress !== null) {
    const progress = Math.max(0, Math.min(100, parseInt(newProgress) || 0))
    implementedSuggestions.value[index].progress = progress
  }
}

const completeSuggestion = (suggestion: ImplementedSuggestion, index: number) => {
  implementedSuggestions.value[index].progress = 100
}

const completeStep = (step: NextStep, index: number) => {
  nextSteps.value[index].completed = true
}

const exportAdviceReport = () => {
  const report = {
    userInputs,
    appliedRecommendations: appliedRecommendations.value,
    implementedSuggestions: implementedSuggestions.value,
    performanceMetrics: performanceMetrics.value,
    nextSteps: nextSteps.value,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'anlageberatung-bericht.json'
  a.click()
  URL.revokeObjectURL(url)
}

const scheduleReview = () => {
  alert('Überprüfung für 6 Monate geplant. Sie erhalten eine Erinnerung.')
}

const shareAdvice = () => {
  const shareText = `Meine Anlageberatung:
Erwartete Rendite: ${formatPercentage(performanceMetrics.value.expectedAnnualReturn)}
Risiko-Score: ${performanceMetrics.value.riskScore}/10
Potenzielle Ersparnis: ${formatCurrency(performanceMetrics.value.totalSavings)}`

  if (navigator.share) {
    navigator.share({
      title: 'Anlageberatung',
      text: shareText
    })
  } else {
    navigator.clipboard.writeText(shareText)
    alert('Beratung in die Zwischenablage kopiert!')
  }
}

const resetAdvice = () => {
  if (confirm('Möchten Sie wirklich alle Empfehlungen zurücksetzen?')) {
    appliedRecommendations.value = []
    implementedSuggestions.value = []
    nextSteps.value.forEach(step => step.completed = false)
  }
}

// 生命周期
onMounted(() => {
  updateAdvice()
})
</script>

<style scoped>
.investment-advice-example {
  @apply max-w-7xl mx-auto p-6 space-y-8;
}

.example-header {
  @apply text-center mb-8;
}

.example-header h1 {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.example-header p {
  @apply text-lg text-gray-600;
}

/* 用户输入区域 */
.user-inputs-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.user-inputs-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.inputs-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.input-group {
  @apply space-y-2;
}

.input-group label {
  @apply block text-sm font-medium text-gray-700;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* 建议引擎区域 */
.advice-engine-section {
  @apply space-y-6;
}

/* 应用的建议区域 */
.applied-recommendations-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.applied-recommendations-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.applied-recommendations-list {
  @apply space-y-4;
}

.applied-recommendation-card {
  @apply border border-green-200 bg-green-50 rounded-lg p-4;
}

.card-header {
  @apply flex items-start gap-4 mb-4;
}

.recommendation-icon {
  @apply w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center;
}

.recommendation-info {
  @apply flex-1;
}

.recommendation-info h4 {
  @apply font-semibold text-gray-900 mb-1;
}

.recommendation-info p {
  @apply text-sm text-gray-600;
}

.recommendation-status {
  @apply flex items-center;
}

.status-badge {
  @apply px-3 py-1 text-xs font-semibold rounded-full;
}

.status-badge.applied {
  @apply bg-green-100 text-green-800;
}

.card-metrics {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4 mb-4;
}

.metric {
  @apply flex justify-between items-center text-sm;
}

.metric-label {
  @apply text-gray-600;
}

.metric-value {
  @apply font-semibold;
}

.metric-value.positive {
  @apply text-green-600;
}

.metric-value.low-risk {
  @apply text-green-600;
}

.metric-value.medium-risk {
  @apply text-yellow-600;
}

.metric-value.high-risk {
  @apply text-red-600;
}

.card-actions {
  @apply flex gap-2;
}

.remove-button {
  @apply flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-red-500;
}

.details-button {
  @apply flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

/* 实施的建议区域 */
.implemented-suggestions-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.implemented-suggestions-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.implemented-suggestions-list {
  @apply space-y-4;
}

.implemented-suggestion-card {
  @apply border border-blue-200 bg-blue-50 rounded-lg p-4;
}

.suggestion-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.suggestion-info {
  @apply flex-1;
}

.suggestion-info h4 {
  @apply font-semibold text-gray-900 mb-1;
}

.suggestion-info p {
  @apply text-sm text-gray-600;
}

.suggestion-savings {
  @apply text-right;
}

.savings-label {
  @apply text-sm text-gray-600;
}

.savings-value {
  @apply block font-bold text-green-600;
}

.implementation-progress {
  @apply mb-4;
}

.progress-header {
  @apply flex justify-between items-center mb-2;
}

.progress-label {
  @apply text-sm font-medium text-gray-700;
}

.progress-percentage {
  @apply text-sm font-semibold text-blue-600;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.progress-button {
  @apply flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.complete-button {
  @apply flex items-center gap-2 px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-green-500;
}

/* 性能跟踪区域 */
.performance-tracking-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.performance-tracking-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.performance-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.performance-card {
  @apply flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200;
}

.performance-card .card-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.performance-card .card-content {
  @apply flex-1;
}

.performance-card .card-label {
  @apply text-sm text-gray-600;
}

.performance-card .card-value {
  @apply text-lg font-bold text-gray-900;
}

.performance-card .card-change {
  @apply text-xs font-medium;
}

.performance-card .card-change.positive {
  @apply text-green-600;
}

.performance-card .card-change.negative {
  @apply text-red-600;
}

/* 下一步建议区域 */
.next-steps-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.next-steps-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.next-steps-list {
  @apply space-y-4;
}

.next-step-item {
  @apply flex items-start gap-4 p-4 border border-gray-200 rounded-lg;
  @apply hover:shadow-md transition-shadow;
}

.next-step-item.completed {
  @apply bg-green-50 border-green-200;
}

.step-number {
  @apply w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold;
}

.next-step-item.completed .step-number {
  @apply bg-green-600;
}

.step-content {
  @apply flex-1;
}

.step-content h4 {
  @apply font-semibold text-gray-900 mb-1;
}

.step-content p {
  @apply text-sm text-gray-600 mb-2;
}

.step-timeline {
  @apply flex items-center gap-2 text-xs text-gray-500;
}

.step-actions {
  @apply flex items-center;
}

.complete-step-button {
  @apply flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded;
  @apply hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500;
}

.completed-badge {
  @apply flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-800 rounded;
}

/* 操作按钮区域 */
.actions-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.action-buttons {
  @apply flex flex-wrap gap-4 justify-center;
}

.action-button {
  @apply flex items-center gap-2 px-6 py-3 rounded-md font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply transition-colors;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.action-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .inputs-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .performance-cards {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .card-metrics {
    @apply grid-cols-1 md:grid-cols-2;
  }
}

@media (max-width: 768px) {
  .investment-advice-example {
    @apply p-4;
  }

  .example-header h1 {
    @apply text-2xl;
  }

  .inputs-grid {
    @apply grid-cols-1;
  }

  .card-header {
    @apply flex-col items-start gap-2;
  }

  .recommendation-status,
  .suggestion-savings {
    @apply self-start;
  }

  .card-metrics {
    @apply grid-cols-1;
  }

  .card-actions {
    @apply flex-col gap-2;
  }

  .remove-button,
  .details-button,
  .progress-button,
  .complete-button {
    @apply w-full justify-center;
  }

  .performance-cards {
    @apply grid-cols-1;
  }

  .performance-card {
    @apply flex-col text-center;
  }

  .performance-card .card-icon {
    @apply mb-3;
  }

  .next-step-item {
    @apply flex-col items-start gap-2;
  }

  .step-number {
    @apply self-center;
  }

  .step-actions {
    @apply self-stretch;
  }

  .complete-step-button {
    @apply w-full justify-center;
  }

  .action-buttons {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .investment-advice-example {
    @apply bg-gray-900;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .user-inputs-section,
  .applied-recommendations-section,
  .implemented-suggestions-section,
  .performance-tracking-section,
  .next-steps-section,
  .actions-section {
    @apply bg-gray-800 border-gray-700;
  }

  .user-inputs-section h2,
  .applied-recommendations-section h2,
  .implemented-suggestions-section h2,
  .performance-tracking-section h2,
  .next-steps-section h2 {
    @apply text-gray-100;
  }

  .input-group label {
    @apply text-gray-300;
  }

  .input-field {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .applied-recommendation-card {
    @apply bg-green-900 border-green-700;
  }

  .implemented-suggestion-card {
    @apply bg-blue-900 border-blue-700;
  }

  .recommendation-info h4,
  .suggestion-info h4 {
    @apply text-gray-100;
  }

  .recommendation-info p,
  .suggestion-info p {
    @apply text-gray-300;
  }

  .performance-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
  }

  .performance-card .card-label {
    @apply text-gray-300;
  }

  .performance-card .card-value {
    @apply text-gray-100;
  }

  .next-step-item {
    @apply bg-gray-700 border-gray-600;
  }

  .next-step-item.completed {
    @apply bg-green-900 border-green-700;
  }

  .step-content h4 {
    @apply text-gray-100;
  }

  .step-content p {
    @apply text-gray-300;
  }

  .step-timeline {
    @apply text-gray-400;
  }

  .completed-badge {
    @apply bg-green-900 text-green-300;
  }

  .action-button.secondary {
    @apply bg-gray-600 text-gray-200 hover:bg-gray-500;
  }
}
</style>
