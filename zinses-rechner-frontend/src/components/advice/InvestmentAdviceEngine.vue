<!--
  投资建议引擎组件
  智能的投资建议系统，基于用户输入和市场数据提供个性化建议
-->

<template>
  <div class="investment-advice-engine">
    <!-- 建议引擎头部 -->
    <div class="engine-header">
      <h3 class="engine-title">
        <Icon name="lightbulb" size="lg" />
        Intelligente Anlageberatung
      </h3>
      <div class="engine-status">
        <div class="status-indicator" :class="{ 'active': isAnalyzing }">
          <div class="status-dot"></div>
          <span>{{ isAnalyzing ? 'Analysiere...' : 'Bereit' }}</span>
        </div>
      </div>
    </div>

    <!-- 用户画像分析 -->
    <div class="user-profile-section">
      <h4>Ihr Anlegerprofil</h4>
      <div class="profile-cards">
        <div class="profile-card" :class="userProfile.riskTolerance">
          <div class="card-icon">
            <Icon :name="getRiskIcon(userProfile.riskTolerance)" size="md" />
          </div>
          <div class="card-content">
            <div class="card-label">Risikotoleranz</div>
            <div class="card-value">{{ getRiskLabel(userProfile.riskTolerance) }}</div>
          </div>
        </div>

        <div class="profile-card">
          <div class="card-icon">
            <Icon name="calendar" size="md" />
          </div>
          <div class="card-content">
            <div class="card-label">Anlagehorizont</div>
            <div class="card-value">{{ userProfile.timeHorizon }} Jahre</div>
          </div>
        </div>

        <div class="profile-card">
          <div class="card-icon">
            <Icon name="target" size="md" />
          </div>
          <div class="card-content">
            <div class="card-label">Anlageziel</div>
            <div class="card-value">{{ getGoalLabel(userProfile.investmentGoal) }}</div>
          </div>
        </div>

        <div class="profile-card">
          <div class="card-icon">
            <Icon name="dollar-sign" size="md" />
          </div>
          <div class="card-content">
            <div class="card-label">Verfügbares Kapital</div>
            <div class="card-value">{{ formatCurrency(userProfile.availableCapital) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要建议 -->
    <div class="main-recommendations">
      <h4>Hauptempfehlungen</h4>
      <div class="recommendations-grid">
        <div
          v-for="(recommendation, index) in mainRecommendations"
          :key="index"
          class="recommendation-card"
          :class="recommendation.priority"
        >
          <div class="recommendation-header">
            <div class="rec-icon">
              <Icon :name="recommendation.icon" size="lg" />
            </div>
            <div class="rec-priority">
              <span class="priority-badge" :class="recommendation.priority">
                {{ getPriorityLabel(recommendation.priority) }}
              </span>
            </div>
          </div>

          <div class="recommendation-content">
            <h5>{{ recommendation.title }}</h5>
            <p>{{ recommendation.description }}</p>

            <div class="recommendation-metrics">
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
                <span class="metric-label">Zeithorizont:</span>
                <span class="metric-value">{{ recommendation.timeFrame }}</span>
              </div>
            </div>

            <div class="recommendation-actions">
              <button @click="applyRecommendation(recommendation)" class="apply-button">
                <Icon name="check" size="sm" />
                Anwenden
              </button>
              <button @click="showDetails(recommendation)" class="details-button">
                <Icon name="info" size="sm" />
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 优化建议 -->
    <div class="optimization-suggestions">
      <h4>Optimierungsvorschläge</h4>
      <div class="suggestions-list">
        <div
          v-for="(suggestion, index) in optimizationSuggestions"
          :key="index"
          class="suggestion-item"
          :class="{ 'expanded': expandedSuggestion === index }"
        >
          <div class="suggestion-header" @click="toggleSuggestion(index)">
            <div class="suggestion-icon">
              <Icon :name="suggestion.icon" size="sm" />
            </div>
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-impact">
              <span class="impact-label">Potenzial:</span>
              <span class="impact-value positive">{{ formatCurrency(suggestion.potentialSaving) }}</span>
            </div>
            <div class="suggestion-toggle">
              <Icon :name="expandedSuggestion === index ? 'chevron-up' : 'chevron-down'" size="sm" />
            </div>
          </div>

          <Transition name="suggestion-expand">
            <div v-if="expandedSuggestion === index" class="suggestion-details">
              <p>{{ suggestion.description }}</p>

              <div class="implementation-steps">
                <h6>Umsetzungsschritte:</h6>
                <ol>
                  <li v-for="(step, stepIndex) in suggestion.steps" :key="stepIndex">
                    {{ step }}
                  </li>
                </ol>
              </div>

              <div class="suggestion-metrics">
                <div class="metric-row">
                  <span class="metric-label">Aufwand:</span>
                  <div class="difficulty-indicator">
                    <div
                      v-for="i in 5"
                      :key="i"
                      class="difficulty-dot"
                      :class="{ 'active': i <= suggestion.difficulty }"
                    ></div>
                  </div>
                  <span class="difficulty-text">{{ getDifficultyLabel(suggestion.difficulty) }}</span>
                </div>

                <div class="metric-row">
                  <span class="metric-label">Zeitrahmen:</span>
                  <span class="metric-value">{{ suggestion.timeframe }}</span>
                </div>
              </div>

              <div class="suggestion-actions">
                <button @click="implementSuggestion(suggestion)" class="implement-button">
                  <Icon name="play" size="sm" />
                  Umsetzen
                </button>
                <button @click="saveSuggestion(suggestion)" class="save-button">
                  <Icon name="bookmark" size="sm" />
                  Merken
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 市场洞察 -->
    <div class="market-insights">
      <h4>Markteinblicke</h4>
      <div class="insights-grid">
        <div
          v-for="(insight, index) in marketInsights"
          :key="index"
          class="insight-card"
          :class="insight.sentiment"
        >
          <div class="insight-header">
            <Icon :name="insight.icon" size="md" />
            <span class="insight-category">{{ insight.category }}</span>
          </div>

          <div class="insight-content">
            <h6>{{ insight.title }}</h6>
            <p>{{ insight.summary }}</p>

            <div class="insight-metrics">
              <div class="metric">
                <span class="metric-label">Trend:</span>
                <span class="metric-value" :class="insight.sentiment">
                  <Icon :name="getTrendIcon(insight.trend)" size="xs" />
                  {{ formatPercentage(insight.trend) }}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">Vertrauen:</span>
                <div class="confidence-bar">
                  <div class="confidence-fill" :style="{ width: `${insight.confidence}%` }"></div>
                </div>
                <span class="confidence-text">{{ insight.confidence }}%</span>
              </div>
            </div>
          </div>

          <div class="insight-actions">
            <button @click="exploreInsight(insight)" class="explore-button">
              <Icon name="external-link" size="sm" />
              Erkunden
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 个性化提示 -->
    <div class="personalized-tips">
      <h4>Persönliche Tipps</h4>
      <div class="tips-carousel">
        <div class="tip-card" v-for="(tip, index) in personalizedTips" :key="index">
          <div class="tip-icon">
            <Icon :name="tip.icon" size="lg" />
          </div>
          <div class="tip-content">
            <h6>{{ tip.title }}</h6>
            <p>{{ tip.content }}</p>
            <div class="tip-relevance">
              <span class="relevance-label">Relevanz für Sie:</span>
              <div class="relevance-stars">
                <Icon
                  v-for="i in 5"
                  :key="i"
                  name="star"
                  size="xs"
                  :class="{ 'filled': i <= tip.relevance }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 建议详情模态框 -->
    <Transition name="modal-fade">
      <div v-if="selectedRecommendation" class="modal-overlay" @click="closeRecommendationDetails">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ selectedRecommendation.title }}</h3>
            <button @click="closeRecommendationDetails" class="modal-close">
              <Icon name="x" size="md" />
            </button>
          </div>

          <div class="modal-body">
            <div class="recommendation-overview">
              <p>{{ selectedRecommendation.detailedDescription }}</p>

              <div class="recommendation-analysis">
                <h5>Detailanalyse</h5>
                <div class="analysis-grid">
                  <div class="analysis-item">
                    <span class="analysis-label">Erwartete jährliche Rendite:</span>
                    <span class="analysis-value">{{ formatPercentage(selectedRecommendation.expectedReturn) }}</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Volatilität:</span>
                    <span class="analysis-value">{{ formatPercentage(selectedRecommendation.volatility) }}</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Maximaler Drawdown:</span>
                    <span class="analysis-value negative">{{ formatPercentage(selectedRecommendation.maxDrawdown) }}</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Sharpe Ratio:</span>
                    <span class="analysis-value">{{ selectedRecommendation.sharpeRatio?.toFixed(2) || 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <div class="recommendation-pros-cons">
                <div class="pros-section">
                  <h6>Vorteile</h6>
                  <ul>
                    <li v-for="(pro, index) in selectedRecommendation.pros" :key="index">
                      {{ pro }}
                    </li>
                  </ul>
                </div>

                <div class="cons-section">
                  <h6>Nachteile</h6>
                  <ul>
                    <li v-for="(con, index) in selectedRecommendation.cons" :key="index">
                      {{ con }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="applyRecommendation(selectedRecommendation)" class="apply-button primary">
              <Icon name="check" size="sm" />
              Empfehlung anwenden
            </button>
            <button @click="closeRecommendationDetails" class="cancel-button">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface UserProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  timeHorizon: number
  investmentGoal: 'retirement' | 'wealth_building' | 'income' | 'education'
  availableCapital: number
  monthlyContribution: number
  currentAge: number
  targetAge?: number
}

interface InvestmentRecommendation {
  id: string
  title: string
  description: string
  detailedDescription: string
  icon: string
  priority: 'high' | 'medium' | 'low'
  expectedReturn: number
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  timeFrame: string
  volatility: number
  maxDrawdown: number
  sharpeRatio?: number
  pros: string[]
  cons: string[]
  category: string
}

interface OptimizationSuggestion {
  id: string
  title: string
  description: string
  icon: string
  potentialSaving: number
  difficulty: number
  timeframe: string
  steps: string[]
  category: string
}

interface MarketInsight {
  id: string
  title: string
  summary: string
  category: string
  icon: string
  sentiment: 'positive' | 'neutral' | 'negative'
  trend: number
  confidence: number
  source: string
}

interface PersonalizedTip {
  id: string
  title: string
  content: string
  icon: string
  relevance: number
  category: string
}

// Props定义
interface Props {
  userInputs: {
    initialAmount: number
    monthlyContribution: number
    annualRate: number
    years: number
    riskTolerance?: string
    investmentGoal?: string
  }
  currentResults?: any
}

const props = defineProps<Props>()

// Emits定义
interface Emits {
  'recommendation-applied': [recommendation: InvestmentRecommendation]
  'suggestion-implemented': [suggestion: OptimizationSuggestion]
  'parameters-updated': [params: any]
}

const emit = defineEmits<Emits>()

// 响应式数据
const isAnalyzing = ref(false)
const expandedSuggestion = ref<number | null>(null)
const selectedRecommendation = ref<InvestmentRecommendation | null>(null)

const userProfile = ref<UserProfile>({
  riskTolerance: 'moderate',
  timeHorizon: 20,
  investmentGoal: 'wealth_building',
  availableCapital: 50000,
  monthlyContribution: 500,
  currentAge: 35
})

const mainRecommendations = ref<InvestmentRecommendation[]>([])
const optimizationSuggestions = ref<OptimizationSuggestion[]>([])
const marketInsights = ref<MarketInsight[]>([])
const personalizedTips = ref<PersonalizedTip[]>([])

// 计算属性
const analysisComplete = computed(() => {
  return mainRecommendations.value.length > 0 && !isAnalyzing.value
})

// 方法
const analyzeUserProfile = () => {
  // 基于用户输入分析用户画像
  const inputs = props.userInputs

  // 推断风险承受能力
  if (inputs.annualRate <= 4) {
    userProfile.value.riskTolerance = 'conservative'
  } else if (inputs.annualRate <= 8) {
    userProfile.value.riskTolerance = 'moderate'
  } else {
    userProfile.value.riskTolerance = 'aggressive'
  }

  userProfile.value.timeHorizon = inputs.years
  userProfile.value.availableCapital = inputs.initialAmount
  userProfile.value.monthlyContribution = inputs.monthlyContribution

  // 基于投资期限推断投资目标
  if (inputs.years >= 30) {
    userProfile.value.investmentGoal = 'retirement'
  } else if (inputs.years >= 15) {
    userProfile.value.investmentGoal = 'wealth_building'
  } else if (inputs.years >= 5) {
    userProfile.value.investmentGoal = 'education'
  } else {
    userProfile.value.investmentGoal = 'income'
  }
}

const generateRecommendations = async () => {
  isAnalyzing.value = true

  // 模拟分析延迟
  await new Promise(resolve => setTimeout(resolve, 2000))

  const recommendations: InvestmentRecommendation[] = []

  // 基于用户画像生成建议
  if (userProfile.value.riskTolerance === 'conservative') {
    recommendations.push({
      id: 'conservative-bonds',
      title: 'Sichere Staatsanleihen',
      description: 'Stabile Rendite mit geringem Risiko durch deutsche Staatsanleihen.',
      detailedDescription: 'Deutsche Staatsanleihen bieten eine sichere Anlagemöglichkeit mit vorhersagbaren Erträgen. Ideal für konservative Anleger, die Kapitalerhalt priorisieren.',
      icon: 'shield',
      priority: 'high',
      expectedReturn: 0.025,
      riskLevel: 'conservative',
      timeFrame: 'Langfristig',
      volatility: 0.05,
      maxDrawdown: 0.02,
      sharpeRatio: 0.8,
      pros: [
        'Sehr geringes Ausfallrisiko',
        'Stabile, vorhersagbare Erträge',
        'Hohe Liquidität'
      ],
      cons: [
        'Niedrige Rendite',
        'Inflationsrisiko',
        'Begrenzte Wachstumschancen'
      ],
      category: 'Anleihen'
    })
  }

  if (userProfile.value.riskTolerance === 'moderate') {
    recommendations.push({
      id: 'balanced-etf',
      title: 'Ausgewogener ETF-Mix',
      description: 'Diversifizierte Mischung aus Aktien- und Anleihen-ETFs für ausgewogenes Risiko.',
      detailedDescription: 'Ein ausgewogenes Portfolio aus 60% Aktien-ETFs und 40% Anleihen-ETFs bietet eine gute Balance zwischen Wachstum und Stabilität.',
      icon: 'trending-up',
      priority: 'high',
      expectedReturn: 0.06,
      riskLevel: 'moderate',
      timeFrame: 'Mittelfristig',
      volatility: 0.12,
      maxDrawdown: 0.15,
      sharpeRatio: 1.2,
      pros: [
        'Gute Diversifikation',
        'Moderate Volatilität',
        'Langfristig attraktive Rendite'
      ],
      cons: [
        'Schwankungen möglich',
        'Marktrisiko',
        'Keine Garantie auf positive Rendite'
      ],
      category: 'ETFs'
    })
  }

  if (userProfile.value.riskTolerance === 'aggressive') {
    recommendations.push({
      id: 'growth-stocks',
      title: 'Wachstumsaktien-Portfolio',
      description: 'Fokus auf wachstumsstarke Unternehmen für maximale Rendite.',
      detailedDescription: 'Ein Portfolio aus sorgfältig ausgewählten Wachstumsaktien bietet das Potenzial für überdurchschnittliche Renditen bei höherem Risiko.',
      icon: 'zap',
      priority: 'high',
      expectedReturn: 0.10,
      riskLevel: 'aggressive',
      timeFrame: 'Langfristig',
      volatility: 0.20,
      maxDrawdown: 0.30,
      sharpeRatio: 1.5,
      pros: [
        'Hohes Renditepotenzial',
        'Partizipation am Unternehmenswachstum',
        'Inflationsschutz'
      ],
      cons: [
        'Hohe Volatilität',
        'Verlustrisiko',
        'Erfordert langfristigen Anlagehorizont'
      ],
      category: 'Aktien'
    })
  }

  mainRecommendations.value = recommendations
  isAnalyzing.value = false
}

const generateOptimizationSuggestions = () => {
  const suggestions: OptimizationSuggestion[] = [
    {
      id: 'increase-contribution',
      title: 'Sparrate erhöhen',
      description: 'Durch eine Erhöhung Ihrer monatlichen Sparrate um 100€ können Sie Ihr Endkapital erheblich steigern.',
      icon: 'arrow-up',
      potentialSaving: 25000,
      difficulty: 2,
      timeframe: 'Sofort umsetzbar',
      steps: [
        'Überprüfen Sie Ihr monatliches Budget',
        'Identifizieren Sie Einsparpotenziale',
        'Richten Sie einen automatischen Sparplan ein',
        'Überwachen Sie regelmäßig Ihre Fortschritte'
      ],
      category: 'Sparverhalten'
    },
    {
      id: 'tax-optimization',
      title: 'Steueroptimierung nutzen',
      description: 'Nutzen Sie Freibeträge und steueroptimierte Anlageprodukte für bessere Nettorendite.',
      icon: 'percent',
      potentialSaving: 15000,
      difficulty: 3,
      timeframe: '1-2 Monate',
      steps: [
        'Freistellungsauftrag bei der Bank einrichten',
        'Steueroptimierte ETFs wählen',
        'Verlustverrechnung nutzen',
        'Jährliche Steuererklärung optimieren'
      ],
      category: 'Steuern'
    },
    {
      id: 'cost-reduction',
      title: 'Kosten reduzieren',
      description: 'Wechsel zu kostengünstigeren Anbietern kann Ihre Rendite um 0,5% jährlich steigern.',
      icon: 'minus-circle',
      potentialSaving: 12000,
      difficulty: 2,
      timeframe: '2-4 Wochen',
      steps: [
        'Aktuelle Kosten analysieren',
        'Günstigere Anbieter vergleichen',
        'Depot wechseln oder Konditionen verhandeln',
        'Laufende Kosten überwachen'
      ],
      category: 'Kosten'
    }
  ]

  optimizationSuggestions.value = suggestions
}

const generateMarketInsights = () => {
  const insights: MarketInsight[] = [
    {
      id: 'interest-rates',
      title: 'Zinswende in Sicht',
      summary: 'Die EZB signalisiert mögliche Zinserhöhungen, was Auswirkungen auf Anleihen haben könnte.',
      category: 'Zinsen',
      icon: 'trending-up',
      sentiment: 'neutral',
      trend: 0.02,
      confidence: 75,
      source: 'EZB'
    },
    {
      id: 'tech-sector',
      title: 'Technologiesektor robust',
      summary: 'Technologieaktien zeigen weiterhin starke Fundamentaldaten trotz Marktvolatilität.',
      category: 'Sektoren',
      icon: 'cpu',
      sentiment: 'positive',
      trend: 0.08,
      confidence: 82,
      source: 'Marktanalyse'
    },
    {
      id: 'inflation',
      title: 'Inflation stabilisiert sich',
      summary: 'Die Inflationsrate zeigt Anzeichen einer Stabilisierung auf moderatem Niveau.',
      category: 'Makroökonomie',
      icon: 'bar-chart',
      sentiment: 'positive',
      trend: -0.01,
      confidence: 68,
      source: 'Statistisches Bundesamt'
    }
  ]

  marketInsights.value = insights
}

const generatePersonalizedTips = () => {
  const tips: PersonalizedTip[] = [
    {
      id: 'emergency-fund',
      title: 'Notgroschen aufbauen',
      content: 'Bevor Sie investieren, sollten Sie 3-6 Monatsausgaben als Notgroschen auf einem Tagesgeldkonto haben.',
      icon: 'shield',
      relevance: 5,
      category: 'Grundlagen'
    },
    {
      id: 'diversification',
      title: 'Diversifikation beachten',
      content: 'Streuen Sie Ihr Risiko über verschiedene Anlageklassen, Regionen und Branchen.',
      icon: 'layers',
      relevance: 4,
      category: 'Risikomanagement'
    },
    {
      id: 'regular-review',
      title: 'Regelmäßige Überprüfung',
      content: 'Überprüfen Sie Ihr Portfolio mindestens einmal jährlich und passen Sie es bei Bedarf an.',
      icon: 'refresh-cw',
      relevance: 4,
      category: 'Portfolio-Management'
    }
  ]

  personalizedTips.value = tips
}

const getRiskIcon = (risk: string): string => {
  switch (risk) {
    case 'conservative': return 'shield'
    case 'moderate': return 'trending-up'
    case 'aggressive': return 'zap'
    default: return 'help-circle'
  }
}

const getRiskLabel = (risk: string): string => {
  switch (risk) {
    case 'conservative': return 'Konservativ'
    case 'moderate': return 'Ausgewogen'
    case 'aggressive': return 'Risikofreudig'
    default: return 'Unbekannt'
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

const getGoalLabel = (goal: string): string => {
  switch (goal) {
    case 'retirement': return 'Altersvorsorge'
    case 'wealth_building': return 'Vermögensaufbau'
    case 'income': return 'Einkommen'
    case 'education': return 'Bildung'
    default: return 'Allgemein'
  }
}

const getPriorityLabel = (priority: string): string => {
  switch (priority) {
    case 'high': return 'Hoch'
    case 'medium': return 'Mittel'
    case 'low': return 'Niedrig'
    default: return 'Normal'
  }
}

const getDifficultyLabel = (difficulty: number): string => {
  if (difficulty <= 2) return 'Einfach'
  if (difficulty <= 3) return 'Mittel'
  return 'Schwer'
}

const getTrendIcon = (trend: number): string => {
  if (trend > 0.02) return 'trending-up'
  if (trend < -0.02) return 'trending-down'
  return 'minus'
}

const toggleSuggestion = (index: number) => {
  expandedSuggestion.value = expandedSuggestion.value === index ? null : index
}

const applyRecommendation = (recommendation: InvestmentRecommendation) => {
  emit('recommendation-applied', recommendation)
  selectedRecommendation.value = null
}

const showDetails = (recommendation: InvestmentRecommendation) => {
  selectedRecommendation.value = recommendation
}

const closeRecommendationDetails = () => {
  selectedRecommendation.value = null
}

const implementSuggestion = (suggestion: OptimizationSuggestion) => {
  emit('suggestion-implemented', suggestion)
}

const saveSuggestion = (suggestion: OptimizationSuggestion) => {
  // 保存建议到用户收藏
  console.log('Saving suggestion:', suggestion.title)
}

const exploreInsight = (insight: MarketInsight) => {
  // 打开市场洞察详情
  console.log('Exploring insight:', insight.title)
}

// 监听器
watch(() => props.userInputs, () => {
  analyzeUserProfile()
  generateRecommendations()
}, { deep: true, immediate: true })

// 生命周期
onMounted(() => {
  analyzeUserProfile()
  generateRecommendations()
  generateOptimizationSuggestions()
  generateMarketInsights()
  generatePersonalizedTips()
})
</script>

<style scoped>
.investment-advice-engine {
  @apply space-y-8;
}

/* 引擎头部 */
.engine-header {
  @apply flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200;
}

.engine-title {
  @apply flex items-center gap-3 text-xl font-bold text-gray-800;
}

.engine-status {
  @apply flex items-center gap-2;
}

.status-indicator {
  @apply flex items-center gap-2 px-3 py-1 bg-white rounded-full border;
}

.status-indicator.active {
  @apply border-blue-300 bg-blue-50;
}

.status-dot {
  @apply w-2 h-2 bg-gray-400 rounded-full;
}

.status-indicator.active .status-dot {
  @apply bg-blue-500 animate-pulse;
}

.status-indicator span {
  @apply text-sm font-medium text-gray-700;
}

.status-indicator.active span {
  @apply text-blue-700;
}

/* 用户画像区域 */
.user-profile-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.user-profile-section h4 {
  @apply text-lg font-semibold text-gray-800 mb-4;
}

.profile-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.profile-card {
  @apply flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200;
}

.profile-card.conservative {
  @apply bg-green-50 border-green-200;
}

.profile-card.moderate {
  @apply bg-blue-50 border-blue-200;
}

.profile-card.aggressive {
  @apply bg-red-50 border-red-200;
}

.card-icon {
  @apply w-12 h-12 bg-white rounded-full flex items-center justify-center;
}

.profile-card.conservative .card-icon {
  @apply bg-green-100 text-green-600;
}

.profile-card.moderate .card-icon {
  @apply bg-blue-100 text-blue-600;
}

.profile-card.aggressive .card-icon {
  @apply bg-red-100 text-red-600;
}

.card-content {
  @apply flex-1;
}

.card-label {
  @apply text-sm text-gray-600;
}

.card-value {
  @apply font-semibold text-gray-900;
}

/* 主要建议区域 */
.main-recommendations {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.main-recommendations h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.recommendations-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6;
}

.recommendation-card {
  @apply bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow;
}

.recommendation-card.high {
  @apply border-red-300 bg-red-50;
}

.recommendation-card.medium {
  @apply border-yellow-300 bg-yellow-50;
}

.recommendation-card.low {
  @apply border-blue-300 bg-blue-50;
}

.recommendation-header {
  @apply flex items-center justify-between mb-4;
}

.rec-icon {
  @apply w-12 h-12 bg-white rounded-full flex items-center justify-center;
}

.recommendation-card.high .rec-icon {
  @apply bg-red-100 text-red-600;
}

.recommendation-card.medium .rec-icon {
  @apply bg-yellow-100 text-yellow-600;
}

.recommendation-card.low .rec-icon {
  @apply bg-blue-100 text-blue-600;
}

.priority-badge {
  @apply px-2 py-1 text-xs font-semibold rounded-full;
}

.priority-badge.high {
  @apply bg-red-100 text-red-800;
}

.priority-badge.medium {
  @apply bg-yellow-100 text-yellow-800;
}

.priority-badge.low {
  @apply bg-blue-100 text-blue-800;
}

.recommendation-content h5 {
  @apply font-semibold text-gray-900 mb-2;
}

.recommendation-content p {
  @apply text-sm text-gray-600 mb-4;
}

.recommendation-metrics {
  @apply space-y-2 mb-4;
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

.recommendation-actions {
  @apply flex gap-2;
}

.apply-button {
  @apply flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.details-button {
  @apply flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500;
}

/* 优化建议区域 */
.optimization-suggestions {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.optimization-suggestions h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.suggestions-list {
  @apply space-y-4;
}

.suggestion-item {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.suggestion-header {
  @apply flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors;
}

.suggestion-icon {
  @apply w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.suggestion-title {
  @apply flex-1 font-semibold text-gray-900;
}

.suggestion-impact {
  @apply flex items-center gap-2;
}

.impact-label {
  @apply text-sm text-gray-600;
}

.impact-value {
  @apply font-bold text-green-600;
}

.suggestion-toggle {
  @apply text-gray-400;
}

.suggestion-details {
  @apply p-4 bg-gray-50 border-t border-gray-200;
}

.suggestion-details p {
  @apply text-gray-700 mb-4;
}

.implementation-steps h6 {
  @apply font-semibold text-gray-800 mb-2;
}

.implementation-steps ol {
  @apply list-decimal list-inside space-y-1 text-sm text-gray-600 mb-4;
}

.suggestion-metrics {
  @apply space-y-3 mb-4;
}

.metric-row {
  @apply flex items-center gap-3;
}

.difficulty-indicator {
  @apply flex gap-1;
}

.difficulty-dot {
  @apply w-2 h-2 bg-gray-300 rounded-full;
}

.difficulty-dot.active {
  @apply bg-orange-500;
}

.difficulty-text {
  @apply text-sm text-gray-600;
}

.suggestion-actions {
  @apply flex gap-2;
}

.implement-button {
  @apply flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-md;
  @apply hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500;
}

.save-button {
  @apply flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500;
}

/* 市场洞察区域 */
.market-insights {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.market-insights h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.insights-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.insight-card {
  @apply border rounded-lg p-4 hover:shadow-md transition-shadow;
}

.insight-card.positive {
  @apply border-green-300 bg-green-50;
}

.insight-card.neutral {
  @apply border-gray-300 bg-gray-50;
}

.insight-card.negative {
  @apply border-red-300 bg-red-50;
}

.insight-header {
  @apply flex items-center gap-3 mb-3;
}

.insight-category {
  @apply text-sm font-medium text-gray-600;
}

.insight-content h6 {
  @apply font-semibold text-gray-900 mb-2;
}

.insight-content p {
  @apply text-sm text-gray-600 mb-4;
}

.insight-metrics {
  @apply space-y-2 mb-4;
}

.insight-metrics .metric {
  @apply flex items-center justify-between text-sm;
}

.insight-metrics .metric-value {
  @apply flex items-center gap-1;
}

.insight-metrics .metric-value.positive {
  @apply text-green-600;
}

.insight-metrics .metric-value.negative {
  @apply text-red-600;
}

.insight-metrics .metric-value.neutral {
  @apply text-gray-600;
}

.confidence-bar {
  @apply w-16 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.confidence-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.confidence-text {
  @apply text-xs text-gray-600;
}

.insight-actions {
  @apply flex justify-end;
}

.explore-button {
  @apply flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 rounded;
}

/* 个性化提示区域 */
.personalized-tips {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.personalized-tips h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.tips-carousel {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.tip-card {
  @apply flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200;
}

.tip-icon {
  @apply w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center;
}

.tip-content {
  @apply flex-1;
}

.tip-content h6 {
  @apply font-semibold text-gray-900 mb-2;
}

.tip-content p {
  @apply text-sm text-gray-600 mb-3;
}

.tip-relevance {
  @apply flex items-center gap-2;
}

.relevance-label {
  @apply text-xs text-gray-600;
}

.relevance-stars {
  @apply flex gap-1;
}

.relevance-stars .filled {
  @apply text-yellow-500;
}

.relevance-stars :not(.filled) {
  @apply text-gray-300;
}

/* 模态框 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.modal-header h3 {
  @apply text-lg font-semibold text-gray-900;
}

.modal-close {
  @apply p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.modal-body {
  @apply p-6;
}

.recommendation-overview p {
  @apply text-gray-700 mb-6;
}

.recommendation-analysis h5 {
  @apply font-semibold text-gray-800 mb-4;
}

.analysis-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-6;
}

.analysis-item {
  @apply flex justify-between items-center py-2 border-b border-gray-100;
}

.analysis-label {
  @apply text-sm text-gray-600;
}

.analysis-value {
  @apply font-semibold text-gray-900;
}

.analysis-value.negative {
  @apply text-red-600;
}

.recommendation-pros-cons {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.pros-section h6,
.cons-section h6 {
  @apply font-semibold text-gray-800 mb-3;
}

.pros-section ul,
.cons-section ul {
  @apply space-y-2;
}

.pros-section li,
.cons-section li {
  @apply text-sm text-gray-600 flex items-start gap-2;
}

.pros-section li::before {
  content: '✓';
  @apply text-green-600 font-bold;
}

.cons-section li::before {
  content: '✗';
  @apply text-red-600 font-bold;
}

.modal-footer {
  @apply flex gap-3 p-6 border-t border-gray-200;
}

.apply-button.primary {
  @apply flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.cancel-button {
  @apply px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-500;
}

/* 过渡动画 */
.suggestion-expand-enter-active,
.suggestion-expand-leave-active {
  @apply transition-all duration-300;
}

.suggestion-expand-enter-from,
.suggestion-expand-leave-to {
  @apply opacity-0 max-h-0;
}

.suggestion-expand-enter-to,
.suggestion-expand-leave-from {
  @apply opacity-100 max-h-96;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  @apply transition-opacity duration-300;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  @apply opacity-0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .profile-cards {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .recommendations-grid {
    @apply grid-cols-1 lg:grid-cols-2;
  }

  .insights-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .tips-carousel {
    @apply grid-cols-1 md:grid-cols-2;
  }
}

@media (max-width: 768px) {
  .engine-header {
    @apply flex-col items-start gap-4;
  }

  .profile-cards {
    @apply grid-cols-1;
  }

  .profile-card {
    @apply flex-col text-center;
  }

  .card-icon {
    @apply mb-3;
  }

  .recommendations-grid {
    @apply grid-cols-1;
  }

  .recommendation-actions {
    @apply flex-col gap-2;
  }

  .apply-button,
  .details-button {
    @apply w-full;
  }

  .suggestion-header {
    @apply flex-col items-start gap-2;
  }

  .suggestion-impact {
    @apply self-end;
  }

  .suggestion-actions {
    @apply flex-col gap-2;
  }

  .implement-button,
  .save-button {
    @apply w-full justify-center;
  }

  .insights-grid {
    @apply grid-cols-1;
  }

  .tips-carousel {
    @apply grid-cols-1;
  }

  .tip-card {
    @apply flex-col text-center;
  }

  .tip-icon {
    @apply mb-3;
  }

  .modal-content {
    @apply mx-2 max-h-[90vh];
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    @apply p-4;
  }

  .analysis-grid {
    @apply grid-cols-1;
  }

  .recommendation-pros-cons {
    @apply grid-cols-1;
  }

  .modal-footer {
    @apply flex-col;
  }

  .apply-button.primary {
    @apply w-full;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .investment-advice-engine {
    @apply bg-gray-900;
  }

  .engine-header {
    @apply bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600;
  }

  .engine-title {
    @apply text-gray-100;
  }

  .status-indicator {
    @apply bg-gray-800 border-gray-600;
  }

  .status-indicator span {
    @apply text-gray-300;
  }

  .status-indicator.active {
    @apply bg-blue-900 border-blue-600;
  }

  .status-indicator.active span {
    @apply text-blue-300;
  }

  .user-profile-section,
  .main-recommendations,
  .optimization-suggestions,
  .market-insights,
  .personalized-tips {
    @apply bg-gray-800 border-gray-700;
  }

  .user-profile-section h4,
  .main-recommendations h4,
  .optimization-suggestions h4,
  .market-insights h4,
  .personalized-tips h4 {
    @apply text-gray-100;
  }

  .profile-card {
    @apply bg-gray-700 border-gray-600;
  }

  .card-label {
    @apply text-gray-300;
  }

  .card-value {
    @apply text-gray-100;
  }

  .recommendation-card {
    @apply bg-gray-700 border-gray-600;
  }

  .recommendation-content h5 {
    @apply text-gray-100;
  }

  .recommendation-content p {
    @apply text-gray-300;
  }

  .suggestion-item {
    @apply border-gray-600;
  }

  .suggestion-header {
    @apply hover:bg-gray-700;
  }

  .suggestion-title {
    @apply text-gray-100;
  }

  .suggestion-details {
    @apply bg-gray-700 border-gray-600;
  }

  .suggestion-details p {
    @apply text-gray-300;
  }

  .implementation-steps h6 {
    @apply text-gray-200;
  }

  .implementation-steps ol {
    @apply text-gray-300;
  }

  .insight-card {
    @apply bg-gray-700 border-gray-600;
  }

  .insight-content h6 {
    @apply text-gray-100;
  }

  .insight-content p {
    @apply text-gray-300;
  }

  .tip-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
  }

  .tip-content h6 {
    @apply text-gray-100;
  }

  .tip-content p {
    @apply text-gray-300;
  }

  .modal-content {
    @apply bg-gray-800;
  }

  .modal-header {
    @apply border-gray-700;
  }

  .modal-header h3 {
    @apply text-gray-100;
  }

  .modal-close {
    @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
  }

  .recommendation-overview p {
    @apply text-gray-300;
  }

  .recommendation-analysis h5 {
    @apply text-gray-200;
  }

  .analysis-item {
    @apply border-gray-700;
  }

  .analysis-label {
    @apply text-gray-300;
  }

  .analysis-value {
    @apply text-gray-100;
  }

  .pros-section h6,
  .cons-section h6 {
    @apply text-gray-200;
  }

  .pros-section li,
  .cons-section li {
    @apply text-gray-300;
  }

  .modal-footer {
    @apply border-gray-700;
  }

  .cancel-button {
    @apply text-gray-300 hover:text-gray-100 hover:bg-gray-700;
  }
}
</style>
