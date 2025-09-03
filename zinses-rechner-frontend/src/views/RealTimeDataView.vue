<!--
  实时数据页面
  展示完整的实时金融数据仪表板
-->

<template>
  <div class="real-time-data-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container mx-auto px-4">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">Aktuelle Marktdaten</h1>
            <p class="page-subtitle">
              Verfolgen Sie die neuesten Zinssätze, Wechselkurse und Wirtschaftsindikatoren in Echtzeit
            </p>
          </div>
          
          <div class="header-stats">
            <div class="stat-item">
              <div class="stat-value">{{ formatDataAge }}</div>
              <div class="stat-label">Letzte Aktualisierung</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value" :class="connectionStatusClass">
                {{ isOnline ? 'Online' : 'Offline' }}
              </div>
              <div class="stat-label">Verbindungsstatus</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value" :class="dataQualityClass">
                {{ dataQualityText }}
              </div>
              <div class="stat-label">Datenqualität</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <div class="container mx-auto px-4">
        <!-- 快速概览卡片 -->
        <div class="quick-overview">
          <h2 class="section-title">Schnellübersicht</h2>
          <div class="overview-grid">
            <div class="overview-card">
              <div class="card-icon ecb-rate">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div class="card-content">
                <div class="card-value">{{ formatPercentage(currentInterestRate) }}</div>
                <div class="card-label">EZB Leitzins</div>
                <div class="card-change" :class="getRateChangeClass(0.25)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  +0.25%
                </div>
              </div>
            </div>

            <div class="overview-card">
              <div class="card-icon exchange-rate">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="card-content">
                <div class="card-value">{{ formatCurrency(exchangeRateEURUSD, 'USD') }}</div>
                <div class="card-label">EUR/USD</div>
                <div class="card-change" :class="getRateChangeClass(-0.02)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                  -0.02
                </div>
              </div>
            </div>

            <div class="overview-card">
              <div class="card-icon inflation">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div class="card-content">
                <div class="card-value">{{ formatPercentage(currentInflationRate) }}</div>
                <div class="card-label">Inflation (DE)</div>
                <div class="card-change" :class="getRateChangeClass(0.1)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  +0.1%
                </div>
              </div>
            </div>

            <div class="overview-card">
              <div class="card-icon market-risk">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div class="card-content">
                <div class="card-value" :class="getMarketRiskClass(marketRiskLevel)">
                  {{ getMarketRiskText(marketRiskLevel) }}
                </div>
                <div class="card-label">Marktrisiko</div>
                <div class="card-change neutral">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                  </svg>
                  Stabil
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细数据仪表板 -->
        <div class="detailed-dashboard">
          <h2 class="section-title">Detaillierte Marktdaten</h2>
          <RealTimeDataDashboard />
        </div>

        <!-- 数据使用建议 -->
        <div class="data-usage-tips">
          <h2 class="section-title">Wie Sie diese Daten nutzen können</h2>
          <div class="tips-grid">
            <div class="tip-card">
              <div class="tip-icon">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="tip-title">Zinsrechner optimieren</h3>
              <p class="tip-description">
                Nutzen Sie die aktuellen Zinssätze in unseren Rechnern für präzise Berechnungen 
                Ihrer Finanzplanung.
              </p>
              <router-link to="/calculator/compound-interest" class="tip-link">
                Zum Zinsrechner →
              </router-link>
            </div>

            <div class="tip-card">
              <div class="tip-icon">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 class="tip-title">Hypotheken planen</h3>
              <p class="tip-description">
                Verwenden Sie die aktuellen Hypothekenzinsen für realistische 
                Immobilienfinanzierungsberechnungen.
              </p>
              <router-link to="/calculator/mortgage" class="tip-link">
                Zum Hypothekenrechner →
              </router-link>
            </div>

            <div class="tip-card">
              <div class="tip-icon">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 class="tip-title">AI-Analyse nutzen</h3>
              <p class="tip-description">
                Lassen Sie unsere KI die aktuellen Marktdaten analysieren und 
                personalisierte Empfehlungen erstellen.
              </p>
              <router-link to="/ai-analysis" class="tip-link">
                Zur AI-Analyse →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RealTimeDataDashboard from '@/components/data/RealTimeDataDashboard.vue'
import { useFullMarketData } from '@/composables/useRealTimeData'

// 使用实时数据
const {
  isOnline,
  lastUpdated,
  dataStatus,
  currentInterestRate,
  currentInflationRate,
  exchangeRateEURUSD,
  marketRiskLevel,
  formatDataAge
} = useFullMarketData()

// 计算属性
const connectionStatusClass = computed(() => ({
  'text-green-600': isOnline.value,
  'text-red-600': !isOnline.value
}))

const dataQualityClass = computed(() => {
  switch (dataStatus.value) {
    case 'fresh':
      return 'text-green-600'
    case 'stale':
      return 'text-yellow-600'
    case 'error':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
})

const dataQualityText = computed(() => {
  switch (dataStatus.value) {
    case 'loading':
      return 'Wird geladen...'
    case 'fresh':
      return 'Aktuell'
    case 'stale':
      return 'Veraltet'
    case 'error':
      return 'Fehler'
    default:
      return 'Unbekannt'
  }
})

// 格式化方法
const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`
}

const formatCurrency = (value: number, currency: string): string => {
  return value.toFixed(4)
}

const getRateChangeClass = (change: number) => ({
  'positive': change > 0,
  'negative': change < 0,
  'neutral': change === 0
})

const getMarketRiskClass = (risk: string) => ({
  'text-green-600': risk === 'low',
  'text-yellow-600': risk === 'medium',
  'text-red-600': risk === 'high'
})

const getMarketRiskText = (risk: string): string => {
  const texts = {
    'low': 'Niedrig',
    'medium': 'Mittel',
    'high': 'Hoch'
  }
  return texts[risk as keyof typeof texts] || 'Unbekannt'
}
</script>

<style scoped>
.real-time-data-view {
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

.header-stats {
  @apply flex flex-col sm:flex-row gap-6;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply text-2xl font-bold mb-1;
}

.stat-label {
  @apply text-sm text-blue-200;
}

.main-content {
  @apply py-12;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-6;
}

.quick-overview {
  @apply mb-12;
}

.overview-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6;
}

.overview-card {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700
         hover:shadow-md transition-shadow;
}

.card-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center mb-4;
}

.ecb-rate {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400;
}

.exchange-rate {
  @apply bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400;
}

.inflation {
  @apply bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400;
}

.market-risk {
  @apply bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400;
}

.card-content {
  @apply space-y-2;
}

.card-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.card-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.card-change {
  @apply flex items-center text-sm font-medium;
}

.card-change.positive {
  @apply text-green-600 dark:text-green-400;
}

.card-change.negative {
  @apply text-red-600 dark:text-red-400;
}

.card-change.neutral {
  @apply text-gray-600 dark:text-gray-400;
}

.detailed-dashboard {
  @apply mb-12;
}

.data-usage-tips {
  @apply mb-12;
}

.tips-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.tip-card {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700
         hover:shadow-md transition-shadow;
}

.tip-icon {
  @apply mb-4;
}

.tip-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-3;
}

.tip-description {
  @apply text-gray-600 dark:text-gray-400 mb-4;
}

.tip-link {
  @apply text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 
         font-medium transition-colors;
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
  
  .header-stats {
    @apply gap-4;
  }
  
  .overview-grid {
    @apply grid-cols-1;
  }
  
  .tips-grid {
    @apply grid-cols-1;
  }
}
</style>
