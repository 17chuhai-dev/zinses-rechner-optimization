<!--
  实时数据仪表板组件
  展示实时金融数据，包括利率、汇率、股票价格等
-->

<template>
  <div class="real-time-dashboard">
    <!-- 仪表板头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <h2 class="dashboard-title">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Aktuelle Marktdaten
        </h2>
        
        <div class="header-controls">
          <div class="status-indicator" :class="connectionStatusClass">
            <div class="status-dot"></div>
            <span class="status-text">{{ connectionStatusText }}</span>
          </div>
          
          <button
            type="button"
            class="refresh-button"
            @click="refreshAllData"
            :disabled="isRefreshing"
          >
            <svg 
              class="w-4 h-4"
              :class="{ 'animate-spin': isRefreshing }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="ml-1">Aktualisieren</span>
          </button>
        </div>
      </div>
      
      <!-- 最后更新时间 -->
      <div class="last-updated">
        Letzte Aktualisierung: {{ formatLastUpdated }}
      </div>
    </div>

    <!-- 数据网格 -->
    <div class="data-grid">
      <!-- 利率卡片 -->
      <div class="data-card interest-rates">
        <div class="card-header">
          <h3 class="card-title">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Zinssätze
          </h3>
          <div class="card-status" :class="getDataStatus('interest-rates')">
            <div class="status-dot"></div>
          </div>
        </div>
        
        <div class="card-content">
          <div v-if="interestRates" class="interest-rates-grid">
            <div class="rate-item">
              <span class="rate-label">EZB Leitzins</span>
              <span class="rate-value">{{ formatPercentage(interestRates.ecb) }}</span>
            </div>
            
            <div class="rate-item">
              <span class="rate-label">EURIBOR 3M</span>
              <span class="rate-value">{{ formatPercentage(interestRates.euribor3m) }}</span>
            </div>
            
            <div class="rate-item">
              <span class="rate-label">EURIBOR 12M</span>
              <span class="rate-value">{{ formatPercentage(interestRates.euribor12m) }}</span>
            </div>
            
            <div class="rate-item">
              <span class="rate-label">Bund 10J</span>
              <span class="rate-value">{{ formatPercentage(interestRates.germanBund10y) }}</span>
            </div>
            
            <div class="rate-item">
              <span class="rate-label">Hypothekenzins</span>
              <span class="rate-value">{{ formatPercentage(interestRates.mortgageRate) }}</span>
            </div>
            
            <div class="rate-item">
              <span class="rate-label">Sparzins</span>
              <span class="rate-value">{{ formatPercentage(interestRates.savingsRate) }}</span>
            </div>
          </div>
          
          <div v-else class="loading-state">
            <div class="loading-spinner"></div>
            <span>Lade Zinsdaten...</span>
          </div>
        </div>
      </div>

      <!-- 汇率卡片 -->
      <div class="data-card exchange-rates">
        <div class="card-header">
          <h3 class="card-title">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Wechselkurse (EUR)
          </h3>
          <div class="card-status" :class="getDataStatus('exchange-rates')">
            <div class="status-dot"></div>
          </div>
        </div>
        
        <div class="card-content">
          <div v-if="exchangeRates" class="exchange-rates-grid">
            <div
              v-for="(rate, currency) in exchangeRates.rates"
              :key="currency"
              class="rate-item"
            >
              <span class="rate-label">{{ currency }}</span>
              <span class="rate-value">{{ formatCurrency(rate, currency) }}</span>
            </div>
          </div>
          
          <div v-else class="loading-state">
            <div class="loading-spinner"></div>
            <span>Lade Wechselkurse...</span>
          </div>
        </div>
      </div>

      <!-- 经济指标卡片 -->
      <div class="data-card economic-indicators">
        <div class="card-header">
          <h3 class="card-title">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Wirtschaftsindikatoren
          </h3>
          <div class="card-status" :class="getDataStatus('economic-indicators')">
            <div class="status-dot"></div>
          </div>
        </div>
        
        <div class="card-content">
          <div v-if="economicIndicators" class="indicators-grid">
            <div class="indicator-section">
              <h4 class="section-title">Inflation</h4>
              <div class="indicator-item">
                <span class="indicator-label">Deutschland</span>
                <span class="indicator-value">{{ formatPercentage(economicIndicators.inflation.germany) }}</span>
              </div>
              <div class="indicator-item">
                <span class="indicator-label">Eurozone</span>
                <span class="indicator-value">{{ formatPercentage(economicIndicators.inflation.eurozone) }}</span>
              </div>
            </div>
            
            <div class="indicator-section">
              <h4 class="section-title">Arbeitslosigkeit</h4>
              <div class="indicator-item">
                <span class="indicator-label">Deutschland</span>
                <span class="indicator-value">{{ formatPercentage(economicIndicators.unemployment.germany) }}</span>
              </div>
              <div class="indicator-item">
                <span class="indicator-label">Eurozone</span>
                <span class="indicator-value">{{ formatPercentage(economicIndicators.unemployment.eurozone) }}</span>
              </div>
            </div>
            
            <div class="indicator-section">
              <h4 class="section-title">BIP-Wachstum</h4>
              <div class="indicator-item">
                <span class="indicator-label">Deutschland</span>
                <span class="indicator-value">{{ formatPercentage(economicIndicators.gdp.germany) }}</span>
              </div>
              <div class="indicator-item">
                <span class="indicator-label">Eurozone</span>
                <span class="indicator-value">{{ formatPercentage(economicIndicators.gdp.eurozone) }}</span>
              </div>
            </div>
          </div>
          
          <div v-else class="loading-state">
            <div class="loading-spinner"></div>
            <span>Lade Wirtschaftsdaten...</span>
          </div>
        </div>
      </div>

      <!-- 市场情绪卡片 -->
      <div class="data-card market-sentiment">
        <div class="card-header">
          <h3 class="card-title">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Marktstimmung
          </h3>
          <div class="card-status" :class="getDataStatus('market-sentiment')">
            <div class="status-dot"></div>
          </div>
        </div>
        
        <div class="card-content">
          <div v-if="marketSentiment" class="sentiment-content">
            <div class="sentiment-gauge">
              <div class="gauge-container">
                <div class="gauge-background"></div>
                <div 
                  class="gauge-fill"
                  :style="{ width: `${marketSentiment.fearGreedIndex}%` }"
                  :class="getSentimentClass(marketSentiment.sentiment)"
                ></div>
                <div class="gauge-value">{{ marketSentiment.fearGreedIndex }}</div>
              </div>
              <div class="gauge-label">
                Fear & Greed Index
              </div>
              <div class="sentiment-label" :class="getSentimentClass(marketSentiment.sentiment)">
                {{ getSentimentText(marketSentiment.sentiment) }}
              </div>
            </div>
            
            <div class="vix-indicator">
              <span class="vix-label">VIX (Volatilität)</span>
              <span class="vix-value" :class="getVixClass(marketSentiment.vix)">
                {{ marketSentiment.vix.toFixed(2) }}
              </span>
            </div>
          </div>
          
          <div v-else class="loading-state">
            <div class="loading-spinner"></div>
            <span>Lade Marktstimmung...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据源状态 -->
    <div class="data-sources-status">
      <h3 class="sources-title">Datenquellen Status</h3>
      <div class="sources-grid">
        <div
          v-for="(status, source) in dataSourceStatus"
          :key="source"
          class="source-item"
          :class="{ 'source-error': !status.available }"
        >
          <div class="source-indicator" :class="{ 'available': status.available }"></div>
          <span class="source-name">{{ getSourceDisplayName(source) }}</span>
          <span class="source-update">
            {{ status.lastUpdate ? formatTime(status.lastUpdate) : 'N/A' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { realTimeFinancialDataService } from '@/services/RealTimeFinancialDataService'
import type { 
  InterestRates, 
  ExchangeRates, 
  EconomicIndicators, 
  MarketSentiment 
} from '@/services/RealTimeFinancialDataService'

// 响应式数据
const isOnline = ref(navigator.onLine)
const isRefreshing = ref(false)
const lastUpdated = ref<Date>(new Date())

const interestRates = ref<InterestRates | null>(null)
const exchangeRates = ref<ExchangeRates | null>(null)
const economicIndicators = ref<EconomicIndicators | null>(null)
const marketSentiment = ref<MarketSentiment | null>(null)
const dataSourceStatus = ref<Record<string, any>>({})

// 计算属性
const connectionStatusClass = computed(() => ({
  'status-online': isOnline.value,
  'status-offline': !isOnline.value
}))

const connectionStatusText = computed(() => 
  isOnline.value ? 'Online' : 'Offline'
)

const formatLastUpdated = computed(() => {
  return lastUpdated.value.toLocaleString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

// 事件监听器
let eventListeners: (() => void)[] = []

// 生命周期
onMounted(() => {
  setupEventListeners()
  loadInitialData()
})

onUnmounted(() => {
  eventListeners.forEach(cleanup => cleanup())
})

// 方法
const setupEventListeners = () => {
  const service = realTimeFinancialDataService

  // 网络状态监听
  const onOnline = () => { isOnline.value = true }
  const onOffline = () => { isOnline.value = false }
  
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  
  eventListeners.push(
    () => window.removeEventListener('online', onOnline),
    () => window.removeEventListener('offline', onOffline)
  )

  // 数据更新监听
  const onInterestRates = (data: InterestRates) => {
    interestRates.value = data
    lastUpdated.value = new Date()
  }
  
  const onExchangeRates = (data: ExchangeRates) => {
    exchangeRates.value = data
    lastUpdated.value = new Date()
  }
  
  const onEconomicIndicators = (data: EconomicIndicators) => {
    economicIndicators.value = data
    lastUpdated.value = new Date()
  }
  
  const onMarketSentiment = (data: MarketSentiment) => {
    marketSentiment.value = data
    lastUpdated.value = new Date()
  }

  service.on('data:interest-rates', onInterestRates)
  service.on('data:exchange-rates', onExchangeRates)
  service.on('data:economic-indicators', onEconomicIndicators)
  service.on('data:market-sentiment', onMarketSentiment)

  eventListeners.push(
    () => service.off('data:interest-rates', onInterestRates),
    () => service.off('data:exchange-rates', onExchangeRates),
    () => service.off('data:economic-indicators', onEconomicIndicators),
    () => service.off('data:market-sentiment', onMarketSentiment)
  )
}

const loadInitialData = async () => {
  const service = realTimeFinancialDataService
  
  try {
    // 加载缓存数据
    const cachedData = service.getAllCachedData()
    
    if (cachedData['interest-rates']) {
      interestRates.value = cachedData['interest-rates']
    }
    
    if (cachedData['exchange-rates']) {
      exchangeRates.value = cachedData['exchange-rates']
    }
    
    if (cachedData['economic-indicators']) {
      economicIndicators.value = cachedData['economic-indicators']
    }
    
    if (cachedData['market-sentiment']) {
      marketSentiment.value = cachedData['market-sentiment']
    }

    // 获取数据源状态
    dataSourceStatus.value = service.getDataSourceStatus()
    
  } catch (error) {
    console.error('加载初始数据失败:', error)
  }
}

const refreshAllData = async () => {
  if (isRefreshing.value || !isOnline.value) return
  
  isRefreshing.value = true
  const service = realTimeFinancialDataService
  
  try {
    await Promise.allSettled([
      service.fetchInterestRates(),
      service.fetchExchangeRates(),
      service.fetchEconomicIndicators(),
      service.fetchMarketSentiment()
    ])
    
    dataSourceStatus.value = service.getDataSourceStatus()
    lastUpdated.value = new Date()
    
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

// 格式化方法
const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`
}

const formatCurrency = (value: number, currency: string): string => {
  if (currency === 'JPY') {
    return value.toFixed(0)
  }
  return value.toFixed(4)
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 状态方法
const getDataStatus = (dataType: string): string => {
  const data = {
    'interest-rates': interestRates.value,
    'exchange-rates': exchangeRates.value,
    'economic-indicators': economicIndicators.value,
    'market-sentiment': marketSentiment.value
  }[dataType]
  
  return data ? 'status-success' : 'status-loading'
}

const getSentimentClass = (sentiment: string): string => {
  const classes = {
    'extreme_fear': 'sentiment-extreme-fear',
    'fear': 'sentiment-fear',
    'neutral': 'sentiment-neutral',
    'greed': 'sentiment-greed',
    'extreme_greed': 'sentiment-extreme-greed'
  }
  return classes[sentiment as keyof typeof classes] || 'sentiment-neutral'
}

const getSentimentText = (sentiment: string): string => {
  const texts = {
    'extreme_fear': 'Extreme Angst',
    'fear': 'Angst',
    'neutral': 'Neutral',
    'greed': 'Gier',
    'extreme_greed': 'Extreme Gier'
  }
  return texts[sentiment as keyof typeof texts] || 'Neutral'
}

const getVixClass = (vix: number): string => {
  if (vix < 15) return 'vix-low'
  if (vix < 25) return 'vix-medium'
  return 'vix-high'
}

const getSourceDisplayName = (source: string): string => {
  const names = {
    'ecb': 'EZB',
    'exchangeRatesApi': 'Exchange Rates API',
    'alphavantage': 'Alpha Vantage',
    'finnhub': 'Finnhub'
  }
  return names[source as keyof typeof names] || source
}
</script>

<style scoped>
.real-time-dashboard {
  @apply space-y-6;
}

.dashboard-header {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700;
}

.header-content {
  @apply flex items-center justify-between mb-4;
}

.dashboard-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white flex items-center;
}

.header-controls {
  @apply flex items-center space-x-4;
}

.status-indicator {
  @apply flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium;
}

.status-online {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.status-offline {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.status-online .status-dot {
  @apply bg-green-500;
}

.status-offline .status-dot {
  @apply bg-red-500;
}

.refresh-button {
  @apply flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
         disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.last-updated {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.data-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.data-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.card-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.card-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white flex items-center;
}

.card-status {
  @apply w-3 h-3 rounded-full;
}

.status-success .status-dot {
  @apply bg-green-500;
}

.status-loading .status-dot {
  @apply bg-yellow-500 animate-pulse;
}

.card-content {
  @apply p-4;
}

.interest-rates-grid,
.exchange-rates-grid {
  @apply grid grid-cols-2 gap-4;
}

.rate-item {
  @apply flex justify-between items-center py-2;
}

.rate-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.rate-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.indicators-grid {
  @apply space-y-4;
}

.indicator-section {
  @apply space-y-2;
}

.section-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1;
}

.indicator-item {
  @apply flex justify-between items-center py-1;
}

.indicator-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.indicator-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.sentiment-content {
  @apply space-y-4;
}

.sentiment-gauge {
  @apply text-center space-y-2;
}

.gauge-container {
  @apply relative w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.gauge-fill {
  @apply h-full transition-all duration-500 ease-out;
}

.sentiment-extreme-fear {
  @apply bg-red-600;
}

.sentiment-fear {
  @apply bg-orange-500;
}

.sentiment-neutral {
  @apply bg-yellow-500;
}

.sentiment-greed {
  @apply bg-lime-500;
}

.sentiment-extreme-greed {
  @apply bg-green-600;
}

.gauge-value {
  @apply absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white;
}

.gauge-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.sentiment-label {
  @apply text-sm font-bold;
}

.vix-indicator {
  @apply flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.vix-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.vix-value {
  @apply text-sm font-bold;
}

.vix-low {
  @apply text-green-600 dark:text-green-400;
}

.vix-medium {
  @apply text-yellow-600 dark:text-yellow-400;
}

.vix-high {
  @apply text-red-600 dark:text-red-400;
}

.loading-state {
  @apply flex items-center justify-center space-x-2 py-8 text-gray-500 dark:text-gray-400;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin;
}

.data-sources-status {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700;
}

.sources-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.sources-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
}

.source-item {
  @apply flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.source-item.source-error {
  @apply bg-red-50 dark:bg-red-900/20;
}

.source-indicator {
  @apply w-3 h-3 rounded-full bg-red-500;
}

.source-indicator.available {
  @apply bg-green-500;
}

.source-name {
  @apply flex-1 text-sm font-medium text-gray-900 dark:text-white;
}

.source-update {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .header-content {
    @apply flex-col space-y-4;
  }
  
  .header-controls {
    @apply w-full justify-between;
  }
  
  .data-grid {
    @apply grid-cols-1;
  }
  
  .interest-rates-grid,
  .exchange-rates-grid {
    @apply grid-cols-1;
  }
  
  .sources-grid {
    @apply grid-cols-1;
  }
}
</style>
