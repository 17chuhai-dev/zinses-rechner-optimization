<!--
  实时数据面板组件
  显示实时金融数据，包括利率、汇率、股价等
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon class="w-6 h-6 mr-2 text-green-500" />
            {{ t('data.realTimeData') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('data.realTimeDataDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <div class="connection-status flex items-center space-x-2">
            <div :class="getConnectionStatusClasses()"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ getConnectionStatusText() }}
            </span>
          </div>
          
          <div class="last-update text-xs text-gray-500 dark:text-gray-500">
            {{ t('data.lastUpdate') }}: {{ formatLastUpdate() }}
          </div>
          
          <button
            @click="refreshAllData"
            :disabled="isRefreshing"
            class="refresh-button"
          >
            <ArrowPathIcon 
              :class="{ 'animate-spin': isRefreshing }"
              class="w-4 h-4 mr-2"
            />
            {{ t('data.refresh') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 数据网格 -->
    <div class="data-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      <!-- 德国央行利率 -->
      <div class="data-card interest-rate">
        <div class="card-header">
          <div class="card-icon">
            <BanknotesIcon class="w-6 h-6 text-blue-500" />
          </div>
          <div class="card-title">
            <h4 class="card-name">{{ t('data.ecbMainRate') }}</h4>
            <p class="card-description">{{ t('data.ecbMainRateDesc') }}</p>
          </div>
        </div>
        
        <div class="card-content">
          <div class="data-value">
            <span class="value-number">{{ formatPercentage(germanData['DE-BASE-RATE']?.value) }}</span>
            <span class="value-unit">%</span>
          </div>
          
          <div class="data-change" :class="getChangeClasses(germanData['DE-BASE-RATE']?.change)">
            <ArrowTrendingUpIcon v-if="(germanData['DE-BASE-RATE']?.change || 0) > 0" class="w-4 h-4" />
            <ArrowTrendingDownIcon v-else-if="(germanData['DE-BASE-RATE']?.change || 0) < 0" class="w-4 h-4" />
            <MinusIcon v-else class="w-4 h-4" />
            <span class="change-value">{{ formatChange(germanData['DE-BASE-RATE']?.change) }}</span>
          </div>
        </div>
        
        <div class="card-footer">
          <span class="data-source">{{ t('data.sourceECB') }}</span>
          <span class="data-timestamp">{{ formatTimestamp(germanData['DE-BASE-RATE']?.timestamp) }}</span>
        </div>
      </div>

      <!-- 德国10年期国债 -->
      <div class="data-card bond-yield">
        <div class="card-header">
          <div class="card-icon">
            <DocumentTextIcon class="w-6 h-6 text-purple-500" />
          </div>
          <div class="card-title">
            <h4 class="card-name">{{ t('data.germanBond10Y') }}</h4>
            <p class="card-description">{{ t('data.germanBond10YDesc') }}</p>
          </div>
        </div>
        
        <div class="card-content">
          <div class="data-value">
            <span class="value-number">{{ formatPercentage(germanData['DE-10Y-BOND']?.value) }}</span>
            <span class="value-unit">%</span>
          </div>
          
          <div class="data-change" :class="getChangeClasses(germanData['DE-10Y-BOND']?.change)">
            <ArrowTrendingUpIcon v-if="(germanData['DE-10Y-BOND']?.change || 0) > 0" class="w-4 h-4" />
            <ArrowTrendingDownIcon v-else-if="(germanData['DE-10Y-BOND']?.change || 0) < 0" class="w-4 h-4" />
            <MinusIcon v-else class="w-4 h-4" />
            <span class="change-value">{{ formatChange(germanData['DE-10Y-BOND']?.change) }}</span>
          </div>
        </div>
        
        <div class="card-footer">
          <span class="data-source">{{ t('data.sourceBundesbank') }}</span>
          <span class="data-timestamp">{{ formatTimestamp(germanData['DE-10Y-BOND']?.timestamp) }}</span>
        </div>
      </div>

      <!-- 欧元美元汇率 -->
      <div class="data-card exchange-rate">
        <div class="card-header">
          <div class="card-icon">
            <CurrencyDollarIcon class="w-6 h-6 text-green-500" />
          </div>
          <div class="card-title">
            <h4 class="card-name">{{ t('data.eurUsdRate') }}</h4>
            <p class="card-description">{{ t('data.eurUsdRateDesc') }}</p>
          </div>
        </div>
        
        <div class="card-content">
          <div class="data-value">
            <span class="value-number">{{ formatCurrency(germanData['EUR-USD']?.value, 'USD', 4) }}</span>
          </div>
          
          <div class="data-change" :class="getChangeClasses(germanData['EUR-USD']?.change)">
            <ArrowTrendingUpIcon v-if="(germanData['EUR-USD']?.change || 0) > 0" class="w-4 h-4" />
            <ArrowTrendingDownIcon v-else-if="(germanData['EUR-USD']?.change || 0) < 0" class="w-4 h-4" />
            <MinusIcon v-else class="w-4 h-4" />
            <span class="change-value">{{ formatChange(germanData['EUR-USD']?.change, 4) }}</span>
          </div>
        </div>
        
        <div class="card-footer">
          <span class="data-source">{{ t('data.sourceFixer') }}</span>
          <span class="data-timestamp">{{ formatTimestamp(germanData['EUR-USD']?.timestamp) }}</span>
        </div>
      </div>

      <!-- DAX指数 -->
      <div class="data-card stock-index">
        <div class="card-header">
          <div class="card-icon">
            <ChartBarIcon class="w-6 h-6 text-orange-500" />
          </div>
          <div class="card-title">
            <h4 class="card-name">{{ t('data.daxIndex') }}</h4>
            <p class="card-description">{{ t('data.daxIndexDesc') }}</p>
          </div>
        </div>
        
        <div class="card-content">
          <div class="data-value">
            <span class="value-number">{{ formatNumber(germanData['DAX']?.value) }}</span>
            <span class="value-unit">Pkt</span>
          </div>
          
          <div class="data-change" :class="getChangeClasses(germanData['DAX']?.change)">
            <ArrowTrendingUpIcon v-if="(germanData['DAX']?.change || 0) > 0" class="w-4 h-4" />
            <ArrowTrendingDownIcon v-else-if="(germanData['DAX']?.change || 0) < 0" class="w-4 h-4" />
            <MinusIcon v-else class="w-4 h-4" />
            <span class="change-value">{{ formatChange(germanData['DAX']?.change, 0) }}</span>
            <span class="change-percent">({{ formatPercentage(germanData['DAX']?.changePercent) }}%)</span>
          </div>
        </div>
        
        <div class="card-footer">
          <span class="data-source">{{ t('data.sourceYahoo') }}</span>
          <span class="data-timestamp">{{ formatTimestamp(germanData['DAX']?.timestamp) }}</span>
        </div>
      </div>

      <!-- 德国通胀率 -->
      <div class="data-card inflation-rate">
        <div class="card-header">
          <div class="card-icon">
            <FireIcon class="w-6 h-6 text-red-500" />
          </div>
          <div class="card-title">
            <h4 class="card-name">{{ t('data.germanInflation') }}</h4>
            <p class="card-description">{{ t('data.germanInflationDesc') }}</p>
          </div>
        </div>
        
        <div class="card-content">
          <div class="data-value">
            <span class="value-number">{{ formatPercentage(germanData['DE-INFLATION']?.value) }}</span>
            <span class="value-unit">%</span>
          </div>
          
          <div class="data-change" :class="getChangeClasses(germanData['DE-INFLATION']?.change)">
            <ArrowTrendingUpIcon v-if="(germanData['DE-INFLATION']?.change || 0) > 0" class="w-4 h-4" />
            <ArrowTrendingDownIcon v-else-if="(germanData['DE-INFLATION']?.change || 0) < 0" class="w-4 h-4" />
            <MinusIcon v-else class="w-4 h-4" />
            <span class="change-value">{{ formatChange(germanData['DE-INFLATION']?.change) }}</span>
          </div>
        </div>
        
        <div class="card-footer">
          <span class="data-source">{{ t('data.sourceBundesbank') }}</span>
          <span class="data-timestamp">{{ formatTimestamp(germanData['DE-INFLATION']?.timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="data-stats mb-6">
      <div class="stats-header mb-4">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('data.dataStatistics') }}
        </h4>
      </div>
      
      <div class="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-item">
          <div class="stat-icon">
            <SignalIcon class="w-5 h-5 text-blue-500" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeSubscriptions }}</div>
            <div class="stat-label">{{ t('data.activeSubscriptions') }}</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon">
            <ClockIcon class="w-5 h-5 text-green-500" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatResponseTime(stats.averageResponseTime) }}</div>
            <div class="stat-label">{{ t('data.avgResponseTime') }}</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon">
            <CheckCircleIcon class="w-5 h-5 text-green-500" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatPercentage(getSuccessRate()) }}%</div>
            <div class="stat-label">{{ t('data.successRate') }}</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon">
            <ServerIcon class="w-5 h-5 text-purple-500" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatPercentage(stats.cacheHitRate) }}%</div>
            <div class="stat-label">{{ t('data.cacheHitRate') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据源信息 -->
    <div class="data-sources">
      <div class="sources-header mb-4">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('data.dataSources') }}
        </h4>
      </div>
      
      <div class="sources-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="source-item">
          <div class="source-logo">
            <img src="/images/logos/ecb-logo.png" alt="ECB" class="w-8 h-8" />
          </div>
          <div class="source-info">
            <div class="source-name">{{ t('data.europeanCentralBank') }}</div>
            <div class="source-description">{{ t('data.ecbDescription') }}</div>
          </div>
        </div>
        
        <div class="source-item">
          <div class="source-logo">
            <img src="/images/logos/bundesbank-logo.png" alt="Bundesbank" class="w-8 h-8" />
          </div>
          <div class="source-info">
            <div class="source-name">{{ t('data.deutscheBundesbank') }}</div>
            <div class="source-description">{{ t('data.bundesbankDescription') }}</div>
          </div>
        </div>
        
        <div class="source-item">
          <div class="source-logo">
            <img src="/images/logos/yahoo-logo.png" alt="Yahoo Finance" class="w-8 h-8" />
          </div>
          <div class="source-info">
            <div class="source-name">{{ t('data.yahooFinance') }}</div>
            <div class="source-description">{{ t('data.yahooDescription') }}</div>
          </div>
        </div>
        
        <div class="source-item">
          <div class="source-logo">
            <img src="/images/logos/fixer-logo.png" alt="Fixer.io" class="w-8 h-8" />
          </div>
          <div class="source-info">
            <div class="source-name">{{ t('data.fixerIO') }}</div>
            <div class="source-description">{{ t('data.fixerDescription') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 离线提示 -->
    <div v-if="!isConnected" class="offline-notice">
      <ExclamationTriangleIcon class="w-5 h-5 text-yellow-500" />
      <span class="notice-text">{{ t('data.offlineNotice') }}</span>
      <button @click="reconnect" class="reconnect-button">
        {{ t('data.reconnect') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ChartBarIcon,
  ArrowPathIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  SignalIcon,
  ClockIcon,
  CheckCircleIcon,
  ServerIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useRealTimeData } from '@/services/RealTimeDataManager'
import { useI18n } from '@/services/I18nService'
import type { RealTimeData } from '@/services/RealTimeDataManager'

// Props
interface Props {
  autoRefresh?: boolean
  refreshInterval?: number
  showStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true,
  refreshInterval: 60000, // 1分钟
  showStats: true
})

// 使用服务
const {
  currentData,
  isConnected,
  lastUpdate,
  stats,
  getGermanFinancialData,
  refreshData,
  getDataStats
} = useRealTimeData()

const { t } = useI18n()

// 响应式状态
const isRefreshing = ref(false)
const germanData = ref<Record<string, RealTimeData>>({})
const refreshTimer = ref<number | null>(null)

// 计算属性
const containerClasses = computed(() => [
  'real-time-data-panel',
  'bg-white',
  'dark:bg-gray-900',
  'rounded-lg',
  'p-6',
  'max-w-7xl',
  'mx-auto'
])

const ariaLabel = computed(() => {
  return `${t('data.realTimeData')}: ${isConnected.value ? t('data.connected') : t('data.disconnected')}`
})

// 方法
const getConnectionStatusClasses = (): string[] => {
  const classes = ['w-3', 'h-3', 'rounded-full']
  
  if (isConnected.value) {
    classes.push('bg-green-500', 'animate-pulse')
  } else {
    classes.push('bg-red-500')
  }
  
  return classes
}

const getConnectionStatusText = (): string => {
  return isConnected.value ? t('data.connected') : t('data.disconnected')
}

const formatLastUpdate = (): string => {
  if (!lastUpdate.value) return t('data.never')
  
  const now = new Date()
  const diff = now.getTime() - lastUpdate.value.getTime()
  
  if (diff < 60000) return t('data.justNow')
  if (diff < 3600000) return t('data.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('data.hoursAgo', { count: Math.floor(diff / 3600000) })
  
  return lastUpdate.value.toLocaleDateString('de-DE')
}

const getChangeClasses = (change?: number): string[] => {
  const classes = ['flex', 'items-center', 'space-x-1', 'text-sm']
  
  if (!change) {
    classes.push('text-gray-500', 'dark:text-gray-500')
  } else if (change > 0) {
    classes.push('text-green-600', 'dark:text-green-400')
  } else {
    classes.push('text-red-600', 'dark:text-red-400')
  }
  
  return classes
}

const formatPercentage = (value?: number): string => {
  if (value === undefined) return '--'
  return value.toFixed(2)
}

const formatCurrency = (value?: number, currency = 'EUR', decimals = 2): string => {
  if (value === undefined) return '--'
  
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

const formatNumber = (value?: number): string => {
  if (value === undefined) return '--'
  
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatChange = (change?: number, decimals = 2): string => {
  if (change === undefined) return '0.00'
  
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(decimals)}`
}

const formatTimestamp = (timestamp?: Date): string => {
  if (!timestamp) return '--'
  
  return timestamp.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatResponseTime = (ms: number): string => {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
}

const getSuccessRate = (): number => {
  const total = stats.totalRequests
  const successful = stats.successfulRequests
  
  return total > 0 ? (successful / total) * 100 : 0
}

const refreshAllData = async (): Promise<void> => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  
  try {
    // 刷新德国金融数据
    await loadGermanData()
    
    // 更新统计信息
    getDataStats()
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    isRefreshing.value = false
  }
}

const loadGermanData = async (): Promise<void> => {
  try {
    germanData.value = getGermanFinancialData()
  } catch (error) {
    console.error('Failed to load German financial data:', error)
  }
}

const reconnect = async (): Promise<void> => {
  await refreshAllData()
}

const startAutoRefresh = (): void => {
  if (props.autoRefresh && !refreshTimer.value) {
    refreshTimer.value = window.setInterval(() => {
      refreshAllData()
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = (): void => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// 生命周期
onMounted(async () => {
  await loadGermanData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.real-time-data-panel {
  @apply min-h-screen;
}

.data-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200;
}

.card-header {
  @apply flex items-start space-x-3 mb-4;
}

.card-icon {
  @apply flex-shrink-0;
}

.card-title {
  @apply flex-1 min-w-0;
}

.card-name {
  @apply text-sm font-semibold text-gray-900 dark:text-white;
}

.card-description {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.card-content {
  @apply mb-4;
}

.data-value {
  @apply flex items-baseline space-x-1 mb-2;
}

.value-number {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.value-unit {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.data-change {
  @apply flex items-center space-x-1 text-sm;
}

.change-value {
  @apply font-medium;
}

.change-percent {
  @apply text-xs opacity-75;
}

.card-footer {
  @apply flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700;
}

.stat-item {
  @apply flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg;
}

.stat-icon {
  @apply flex-shrink-0;
}

.stat-content {
  @apply flex-1 min-w-0;
}

.stat-value {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.source-item {
  @apply flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg;
}

.source-logo {
  @apply flex-shrink-0;
}

.source-info {
  @apply flex-1 min-w-0;
}

.source-name {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.source-description {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.refresh-button {
  @apply flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.offline-notice {
  @apply flex items-center justify-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg;
}

.notice-text {
  @apply text-sm text-yellow-700 dark:text-yellow-400;
}

.reconnect-button {
  @apply px-3 py-1 text-sm font-medium text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800/20 rounded border border-yellow-300 dark:border-yellow-600 transition-colors duration-200;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .data-grid {
    @apply grid-cols-1;
  }
  
  .stats-grid {
    @apply grid-cols-2;
  }
  
  .sources-list {
    @apply grid-cols-1;
  }
}

/* 动画 */
.data-card {
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

/* 数据变化动画 */
.value-number {
  transition: color 0.3s ease;
}

.data-change {
  transition: all 0.3s ease;
}

/* 高对比度模式支持 */
:global(.high-contrast) .data-card {
  @apply border-2;
}
</style>
