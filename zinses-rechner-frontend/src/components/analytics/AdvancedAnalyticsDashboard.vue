<!--
  高级分析仪表盘
  提供专业的财务分析、风险评估、投资组合优化等功能界面
-->

<template>
  <div class="advanced-analytics-dashboard">
    <!-- 仪表盘头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">
          <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Erweiterte Finanzanalyse
        </h1>
        
        <div class="header-actions">
          <div class="time-range-selector">
            <select v-model="selectedTimeRange" class="time-range-select">
              <option value="1M">1 Monat</option>
              <option value="3M">3 Monate</option>
              <option value="6M">6 Monate</option>
              <option value="1Y">1 Jahr</option>
              <option value="3Y">3 Jahre</option>
              <option value="5Y">5 Jahre</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
          </div>
          
          <button
            type="button"
            class="action-btn secondary"
            @click="showReportDialog = true"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Bericht erstellen
          </button>
          
          <button
            type="button"
            class="action-btn primary"
            @click="showAnalysisDialog = true"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Neue Analyse
          </button>
        </div>
      </div>
      
      <!-- 关键指标概览 -->
      <div class="metrics-overview">
        <div class="metric-card">
          <div class="metric-icon portfolio">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatCurrency(portfolioValue) }}</div>
            <div class="metric-label">Portfolio-Wert</div>
            <div class="metric-change" :class="{ positive: portfolioChange >= 0, negative: portfolioChange < 0 }">
              <svg v-if="portfolioChange >= 0" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 7l-9.2 9.2M7 7v10h10" />
              </svg>
              {{ formatPercentage(Math.abs(portfolioChange)) }}
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon risk">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatPercentage(riskLevel) }}</div>
            <div class="metric-label">Risiko-Level</div>
            <div class="metric-status" :class="getRiskLevelClass(riskLevel)">
              {{ getRiskLevelLabel(riskLevel) }}
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon performance">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatPercentage(sharpeRatio) }}</div>
            <div class="metric-label">Sharpe-Ratio</div>
            <div class="metric-benchmark">
              Benchmark: {{ formatPercentage(benchmarkSharpe) }}
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon diversification">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            </svg>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatPercentage(diversificationRatio) }}</div>
            <div class="metric-label">Diversifikation</div>
            <div class="metric-status" :class="getDiversificationClass(diversificationRatio)">
              {{ getDiversificationLabel(diversificationRatio) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析工具栏 -->
    <div class="analysis-toolbar">
      <div class="analysis-types">
        <button
          v-for="analysisType in analysisTypes"
          :key="analysisType.id"
          type="button"
          class="analysis-type-btn"
          :class="{ active: selectedAnalysisType === analysisType.id }"
          @click="selectedAnalysisType = analysisType.id"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="analysisType.icon" />
          </svg>
          {{ analysisType.label }}
        </button>
      </div>
      
      <div class="analysis-controls">
        <div class="control-group">
          <label class="control-label">Konfidenz-Level:</label>
          <select v-model="confidenceLevel" class="control-select">
            <option value="0.90">90%</option>
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
          </select>
        </div>
        
        <div class="control-group">
          <label class="control-label">Simulationen:</label>
          <select v-model="simulationRuns" class="control-select">
            <option value="1000">1,000</option>
            <option value="5000">5,000</option>
            <option value="10000">10,000</option>
            <option value="50000">50,000</option>
          </select>
        </div>
        
        <button
          type="button"
          class="run-analysis-btn"
          @click="runAnalysis"
          :disabled="isAnalysisRunning"
        >
          <svg v-if="isAnalysisRunning" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
          </svg>
          {{ isAnalysisRunning ? 'Analysiere...' : 'Analyse starten' }}
        </button>
      </div>
    </div>

    <!-- 分析结果区域 -->
    <div class="analysis-results">
      <div v-if="isAnalysisRunning" class="analysis-loading">
        <div class="loading-spinner"></div>
        <div class="loading-content">
          <h3 class="loading-title">Analyse wird durchgeführt...</h3>
          <p class="loading-description">
            {{ getAnalysisTypeLabel(selectedAnalysisType) }} wird berechnet. 
            Dies kann einige Minuten dauern.
          </p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${analysisProgress}%` }"></div>
          </div>
          <div class="progress-text">{{ analysisProgress }}% abgeschlossen</div>
        </div>
      </div>
      
      <div v-else-if="currentAnalysisResult" class="analysis-content">
        <!-- 分析摘要 -->
        <div class="analysis-summary">
          <div class="summary-header">
            <h2 class="summary-title">{{ currentAnalysisResult.summary.title }}</h2>
            <div class="summary-meta">
              <span class="analysis-date">{{ formatDate(new Date()) }}</span>
              <span class="confidence-badge" :class="getConfidenceClass(currentAnalysisResult.summary.confidence)">
                {{ formatPercentage(currentAnalysisResult.summary.confidence) }} Konfidenz
              </span>
            </div>
          </div>
          
          <p class="summary-description">{{ currentAnalysisResult.summary.description }}</p>
          
          <div class="key-findings">
            <h3 class="findings-title">Wichtige Erkenntnisse:</h3>
            <ul class="findings-list">
              <li
                v-for="(finding, index) in currentAnalysisResult.summary.keyFindings"
                :key="index"
                class="finding-item"
              >
                {{ finding }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 分析图表 -->
        <div class="analysis-charts">
          <div class="charts-grid">
            <div
              v-for="chart in currentAnalysisResult.charts"
              :key="chart.id"
              class="chart-container"
            >
              <div class="chart-header">
                <h3 class="chart-title">{{ chart.title }}</h3>
                <p v-if="chart.description" class="chart-description">{{ chart.description }}</p>
              </div>
              
              <div class="chart-content">
                <AnalysisChart
                  :type="chart.type"
                  :data="chart.data"
                  :config="chart.config"
                  :height="300"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 关键指标 -->
        <div class="analysis-metrics">
          <h3 class="metrics-title">Kennzahlen</h3>
          <div class="metrics-grid">
            <div
              v-for="(value, key) in currentAnalysisResult.metrics"
              :key="key"
              class="metric-item"
            >
              <div class="metric-name">{{ getMetricLabel(key) }}</div>
              <div class="metric-value">{{ formatMetricValue(key, value) }}</div>
            </div>
          </div>
        </div>

        <!-- 推荐建议 -->
        <div class="analysis-recommendations">
          <h3 class="recommendations-title">Empfehlungen</h3>
          <div class="recommendations-list">
            <div
              v-for="recommendation in currentAnalysisResult.recommendations"
              :key="recommendation.id"
              class="recommendation-card"
              :class="recommendation.priority"
            >
              <div class="recommendation-header">
                <div class="recommendation-priority">
                  <span class="priority-badge" :class="recommendation.priority">
                    {{ getPriorityLabel(recommendation.priority) }}
                  </span>
                </div>
                <h4 class="recommendation-title">{{ recommendation.title }}</h4>
              </div>
              
              <p class="recommendation-description">{{ recommendation.description }}</p>
              
              <div class="recommendation-details">
                <div class="detail-item">
                  <span class="detail-label">Auswirkung:</span>
                  <span class="detail-value">{{ recommendation.impact }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Umsetzung:</span>
                  <span class="detail-value">{{ recommendation.implementation }}</span>
                </div>
                <div v-if="recommendation.expectedBenefit" class="detail-item">
                  <span class="detail-label">Erwarteter Nutzen:</span>
                  <span class="detail-value">{{ formatCurrency(recommendation.expectedBenefit) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="analysis-empty">
        <div class="empty-icon">
          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="empty-title">Keine Analyse verfügbar</h3>
        <p class="empty-description">
          Starten Sie eine neue Analyse, um detaillierte Einblicke in Ihre Finanzdaten zu erhalten.
        </p>
        <button
          type="button"
          class="action-btn primary"
          @click="showAnalysisDialog = true"
        >
          Erste Analyse starten
        </button>
      </div>
    </div>

    <!-- 分析历史 -->
    <div class="analysis-history">
      <div class="history-header">
        <h3 class="history-title">Analyse-Verlauf</h3>
        <button
          type="button"
          class="view-all-btn"
          @click="showHistoryDialog = true"
        >
          Alle anzeigen
        </button>
      </div>
      
      <div class="history-list">
        <div
          v-for="analysis in recentAnalyses"
          :key="analysis.id"
          class="history-item"
          @click="loadAnalysis(analysis)"
        >
          <div class="history-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="history-content">
            <div class="history-name">{{ analysis.name }}</div>
            <div class="history-meta">
              <span class="history-type">{{ getAnalysisTypeLabel(analysis.analysisType) }}</span>
              <span class="history-date">{{ formatRelativeTime(analysis.createdAt) }}</span>
            </div>
          </div>
          <div class="history-status">
            <span class="status-badge" :class="analysis.status">
              {{ getStatusLabel(analysis.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 对话框组件 -->
    <CreateAnalysisDialog
      v-if="showAnalysisDialog"
      :organization-id="organizationId"
      @close="showAnalysisDialog = false"
      @created="handleAnalysisCreated"
    />

    <CreateReportDialog
      v-if="showReportDialog"
      :organization-id="organizationId"
      :analysis-result="currentAnalysisResult"
      @close="showReportDialog = false"
      @created="handleReportCreated"
    />

    <AnalysisHistoryDialog
      v-if="showHistoryDialog"
      :organization-id="organizationId"
      @close="showHistoryDialog = false"
      @analysis-selected="loadAnalysis"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { advancedAnalyticsService } from '@/services/AdvancedAnalyticsService'
import type { AnalysisRequest, AnalysisResult, AnalysisType } from '@/services/AdvancedAnalyticsService'
import AnalysisChart from './AnalysisChart.vue'
import CreateAnalysisDialog from './CreateAnalysisDialog.vue'
import CreateReportDialog from './CreateReportDialog.vue'
import AnalysisHistoryDialog from './AnalysisHistoryDialog.vue'

interface Props {
  organizationId: string
}

const props = defineProps<Props>()

// 响应式数据
const selectedTimeRange = ref('1Y')
const selectedAnalysisType = ref<AnalysisType>('risk_assessment')
const confidenceLevel = ref(0.95)
const simulationRuns = ref(10000)
const isAnalysisRunning = ref(false)
const analysisProgress = ref(0)
const currentAnalysisResult = ref<AnalysisResult | null>(null)
const recentAnalyses = ref<AnalysisRequest[]>([])
const showAnalysisDialog = ref(false)
const showReportDialog = ref(false)
const showHistoryDialog = ref(false)

// 模拟数据
const portfolioValue = ref(1250000)
const portfolioChange = ref(0.0847)
const riskLevel = ref(0.15)
const sharpeRatio = ref(1.23)
const benchmarkSharpe = ref(0.89)
const diversificationRatio = ref(0.78)

// 分析类型配置
const analysisTypes = [
  {
    id: 'risk_assessment',
    label: 'Risikobewertung',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z'
  },
  {
    id: 'portfolio_optimization',
    label: 'Portfolio-Optimierung',
    icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z'
  },
  {
    id: 'monte_carlo',
    label: 'Monte-Carlo-Simulation',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
  },
  {
    id: 'stress_testing',
    label: 'Stresstest',
    icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    id: 'sensitivity_analysis',
    label: 'Sensitivitätsanalyse',
    icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
  }
]

// 方法
const runAnalysis = async () => {
  isAnalysisRunning.value = true
  analysisProgress.value = 0
  
  // 模拟进度更新
  const progressInterval = setInterval(() => {
    analysisProgress.value += Math.random() * 10
    if (analysisProgress.value >= 100) {
      analysisProgress.value = 100
      clearInterval(progressInterval)
    }
  }, 500)
  
  try {
    // 这里应该调用实际的分析服务
    await new Promise(resolve => setTimeout(resolve, 5000)) // 模拟分析时间
    
    // 模拟分析结果
    currentAnalysisResult.value = {
      summary: {
        title: `${getAnalysisTypeLabel(selectedAnalysisType.value)} Ergebnis`,
        description: 'Detaillierte Analyse Ihres Portfolios basierend auf aktuellen Marktdaten.',
        keyFindings: [
          'Das Portfolio zeigt eine ausgewogene Risiko-Rendite-Struktur',
          'Diversifikation kann durch Hinzufügung von Emerging Markets verbessert werden',
          'Aktuelle Volatilität liegt unter dem Marktdurchschnitt'
        ],
        riskLevel: 'medium',
        confidence: confidenceLevel.value,
        executionTime: 4.7
      },
      metrics: {
        expectedReturn: 0.089,
        volatility: 0.156,
        sharpeRatio: 1.23,
        maxDrawdown: -0.087,
        valueAtRisk: -0.034,
        conditionalVaR: -0.052,
        beta: 0.89,
        alpha: 0.023,
        informationRatio: 0.67,
        trackingError: 0.045
      },
      recommendations: [
        {
          id: '1',
          type: 'allocation',
          priority: 'high',
          title: 'Diversifikation erhöhen',
          description: 'Fügen Sie internationale Märkte hinzu, um das Risiko zu reduzieren.',
          impact: 'Reduzierung der Volatilität um 2-3%',
          implementation: 'Schrittweise Umschichtung über 3 Monate',
          confidence: 0.85,
          expectedBenefit: 15000
        }
      ],
      charts: [
        {
          id: 'efficient-frontier',
          type: 'scatter',
          title: 'Effiziente Grenze',
          description: 'Optimale Risiko-Rendite-Kombinationen',
          data: {},
          config: {}
        }
      ],
      reports: []
    }
  } catch (error) {
    console.error('分析失败:', error)
  } finally {
    isAnalysisRunning.value = false
    clearInterval(progressInterval)
  }
}

const loadAnalysis = (analysis: AnalysisRequest) => {
  // 加载历史分析结果
  console.log('加载分析:', analysis)
}

const handleAnalysisCreated = (analysis: AnalysisRequest) => {
  recentAnalyses.value.unshift(analysis)
  showAnalysisDialog.value = false
}

const handleReportCreated = (report: any) => {
  console.log('报告已创建:', report)
  showReportDialog.value = false
}

// 工具方法
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 2
  }).format(value)
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'heute'
  if (diffDays === 1) return 'gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  return `vor ${Math.floor(diffDays / 7)} Wochen`
}

const getRiskLevelClass = (risk: number): string => {
  if (risk < 0.1) return 'low'
  if (risk < 0.2) return 'medium'
  return 'high'
}

const getRiskLevelLabel = (risk: number): string => {
  if (risk < 0.1) return 'Niedrig'
  if (risk < 0.2) return 'Mittel'
  return 'Hoch'
}

const getDiversificationClass = (ratio: number): string => {
  if (ratio > 0.8) return 'excellent'
  if (ratio > 0.6) return 'good'
  return 'needs-improvement'
}

const getDiversificationLabel = (ratio: number): string => {
  if (ratio > 0.8) return 'Ausgezeichnet'
  if (ratio > 0.6) return 'Gut'
  return 'Verbesserungsbedarf'
}

const getAnalysisTypeLabel = (type: AnalysisType): string => {
  const labels = {
    risk_assessment: 'Risikobewertung',
    portfolio_optimization: 'Portfolio-Optimierung',
    stress_testing: 'Stresstest',
    monte_carlo: 'Monte-Carlo-Simulation',
    sensitivity_analysis: 'Sensitivitätsanalyse',
    scenario_analysis: 'Szenario-Analyse',
    correlation_analysis: 'Korrelationsanalyse',
    performance_attribution: 'Performance-Attribution'
  }
  return labels[type] || type
}

const getConfidenceClass = (confidence: number): string => {
  if (confidence >= 0.95) return 'high'
  if (confidence >= 0.90) return 'medium'
  return 'low'
}

const getMetricLabel = (key: string): string => {
  const labels: Record<string, string> = {
    expectedReturn: 'Erwartete Rendite',
    volatility: 'Volatilität',
    sharpeRatio: 'Sharpe-Ratio',
    maxDrawdown: 'Max. Drawdown',
    valueAtRisk: 'Value at Risk',
    conditionalVaR: 'Conditional VaR',
    beta: 'Beta',
    alpha: 'Alpha',
    informationRatio: 'Information Ratio',
    trackingError: 'Tracking Error'
  }
  return labels[key] || key
}

const formatMetricValue = (key: string, value: number): string => {
  const percentageMetrics = ['expectedReturn', 'volatility', 'maxDrawdown', 'valueAtRisk', 'conditionalVaR', 'alpha', 'trackingError']
  
  if (percentageMetrics.includes(key)) {
    return formatPercentage(value)
  }
  
  return value.toFixed(2)
}

const getPriorityLabel = (priority: string): string => {
  const labels = {
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig'
  }
  return labels[priority as keyof typeof labels] || priority
}

const getStatusLabel = (status: string): string => {
  const labels = {
    pending: 'Wartend',
    running: 'Laufend',
    completed: 'Abgeschlossen',
    failed: 'Fehlgeschlagen'
  }
  return labels[status as keyof typeof labels] || status
}

// 生命周期
onMounted(() => {
  // 加载最近的分析
  // loadRecentAnalyses()
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped>
.advanced-analytics-dashboard {
  @apply space-y-6;
}

.dashboard-header {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.header-content {
  @apply flex items-center justify-between mb-6;
}

.dashboard-title {
  @apply text-3xl font-bold text-gray-900 dark:text-white flex items-center;
}

.header-actions {
  @apply flex items-center space-x-4;
}

.time-range-select {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.action-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors flex items-center
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-btn.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.action-btn.secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         hover:bg-gray-300 dark:hover:bg-gray-600;
}

.metrics-overview {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.metric-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-start space-x-4;
}

.metric-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center;
}

.metric-icon.portfolio {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400;
}

.metric-icon.risk {
  @apply bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400;
}

.metric-icon.performance {
  @apply bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400;
}

.metric-icon.diversification {
  @apply bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400;
}

.metric-content {
  @apply flex-1 space-y-1;
}

.metric-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.metric-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.metric-change {
  @apply flex items-center text-sm font-medium;
}

.metric-change.positive {
  @apply text-green-600 dark:text-green-400;
}

.metric-change.negative {
  @apply text-red-600 dark:text-red-400;
}

.metric-status {
  @apply text-xs font-medium px-2 py-1 rounded-full;
}

.metric-status.low {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.metric-status.medium {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.metric-status.high {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.metric-status.excellent {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.metric-status.good {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400;
}

.metric-status.needs-improvement {
  @apply bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400;
}

.analysis-toolbar {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4
         flex items-center justify-between;
}

.analysis-types {
  @apply flex items-center space-x-2;
}

.analysis-type-btn {
  @apply px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center
         text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
         hover:bg-gray-100 dark:hover:bg-gray-700;
}

.analysis-type-btn.active {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400;
}

.analysis-controls {
  @apply flex items-center space-x-4;
}

.control-group {
  @apply flex items-center space-x-2;
}

.control-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.control-select {
  @apply px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.run-analysis-btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors
         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center;
}

.analysis-results {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.analysis-loading {
  @apply flex items-center justify-center p-12;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-4;
}

.loading-content {
  @apply text-center;
}

.loading-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.loading-description {
  @apply text-gray-600 dark:text-gray-400 mb-4;
}

.progress-bar {
  @apply w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2;
}

.progress-fill {
  @apply bg-blue-600 h-2 rounded-full transition-all duration-300;
}

.progress-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.analysis-content {
  @apply p-6 space-y-8;
}

.analysis-summary {
  @apply space-y-4;
}

.summary-header {
  @apply flex items-start justify-between;
}

.summary-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.summary-meta {
  @apply flex items-center space-x-3;
}

.analysis-date {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.confidence-badge {
  @apply px-3 py-1 text-sm font-medium rounded-full;
}

.confidence-badge.high {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.confidence-badge.medium {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.confidence-badge.low {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.summary-description {
  @apply text-gray-600 dark:text-gray-400;
}

.key-findings {
  @apply space-y-2;
}

.findings-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.findings-list {
  @apply space-y-2;
}

.finding-item {
  @apply flex items-start space-x-2 text-gray-700 dark:text-gray-300;
}

.finding-item::before {
  content: "•";
  @apply text-blue-600 font-bold;
}

.analysis-charts {
  @apply space-y-6;
}

.charts-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.chart-container {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4;
}

.chart-header {
  @apply mb-4;
}

.chart-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.chart-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.analysis-metrics {
  @apply space-y-4;
}

.metrics-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.metrics-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4;
}

.metric-item {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center;
}

.metric-name {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-1;
}

.metric-value {
  @apply text-lg font-bold text-gray-900 dark:text-white;
}

.analysis-recommendations {
  @apply space-y-4;
}

.recommendations-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.recommendations-list {
  @apply space-y-4;
}

.recommendation-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4;
}

.recommendation-card.high {
  @apply border-red-500;
}

.recommendation-card.medium {
  @apply border-yellow-500;
}

.recommendation-card.low {
  @apply border-green-500;
}

.recommendation-header {
  @apply flex items-start justify-between mb-3;
}

.priority-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.priority-badge.high {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.priority-badge.medium {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.priority-badge.low {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.recommendation-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.recommendation-description {
  @apply text-gray-600 dark:text-gray-400 mb-3;
}

.recommendation-details {
  @apply space-y-2;
}

.detail-item {
  @apply flex justify-between items-center;
}

.detail-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.detail-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.analysis-empty {
  @apply text-center py-12 px-6;
}

.empty-icon {
  @apply flex justify-center mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.empty-description {
  @apply text-gray-600 dark:text-gray-400 mb-6;
}

.analysis-history {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.history-header {
  @apply flex items-center justify-between mb-4;
}

.history-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.view-all-btn {
  @apply text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium;
}

.history-list {
  @apply space-y-3;
}

.history-item {
  @apply flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors;
}

.history-icon {
  @apply w-10 h-10 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center;
}

.history-content {
  @apply flex-1;
}

.history-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.history-meta {
  @apply flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400;
}

.history-type {
  @apply px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs;
}

.history-status {
  @apply flex-shrink-0;
}

.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.status-badge.pending {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400;
}

.status-badge.running {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400;
}

.status-badge.completed {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.status-badge.failed {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col space-y-4;
  }
  
  .metrics-overview {
    @apply grid-cols-1;
  }
  
  .analysis-toolbar {
    @apply flex-col space-y-4;
  }
  
  .analysis-types {
    @apply flex-wrap;
  }
  
  .charts-grid {
    @apply grid-cols-1;
  }
  
  .metrics-grid {
    @apply grid-cols-2;
  }
}
</style>
