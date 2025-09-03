<!--
  主页面组件
  德国利息计算器的主入口页面，展示所有功能模块
-->

<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            {{ t('home.title') }}
          </h1>
          <p class="hero-subtitle">
            {{ t('home.subtitle') }}
          </p>
          <div class="hero-features">
            <div class="feature-item">
              <CheckCircleIcon class="w-5 h-5 text-green-500" />
              <span>{{ t('home.feature1') }}</span>
            </div>
            <div class="feature-item">
              <CheckCircleIcon class="w-5 h-5 text-green-500" />
              <span>{{ t('home.feature2') }}</span>
            </div>
            <div class="feature-item">
              <CheckCircleIcon class="w-5 h-5 text-green-500" />
              <span>{{ t('home.feature3') }}</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-card">
            <ChartBarIcon class="w-16 h-16 text-blue-500 mb-4" />
            <div class="visual-stats">
              <div class="stat-item">
                <span class="stat-value">{{ formatNumber(totalCalculations) }}</span>
                <span class="stat-label">{{ t('home.calculations') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ formatPercentage(currentInterestRate) }}%</span>
                <span class="stat-label">{{ t('home.currentRate') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 实时金融数据概览 -->
    <ResponsiveContainer
      type="section"
      max-width="2xl"
      :padding="{ xs: '1rem', sm: '1.5rem', lg: '2rem' }"
      class="financial-overview"
    >
      <div class="section-header">
        <h2 class="section-title">{{ t('home.financialOverview') }}</h2>
        <button @click="refreshFinancialData" class="refresh-button">
          <ArrowPathIcon :class="{ 'animate-spin': isRefreshing }" class="w-4 h-4 mr-2" />
          {{ t('home.refresh') }}
        </button>
      </div>

      <div class="financial-grid">
        <div class="financial-card">
          <div class="card-icon">
            <BanknotesIcon class="w-6 h-6 text-blue-500" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ formatPercentage(financialData.ecbRate) }}%</div>
            <div class="card-label">{{ t('home.ecbMainRate') }}</div>
            <div class="card-change" :class="getChangeClasses(financialData.ecbRateChange)">
              {{ formatChange(financialData.ecbRateChange) }}
            </div>
          </div>
        </div>

        <div class="financial-card">
          <div class="card-icon">
            <DocumentTextIcon class="w-6 h-6 text-purple-500" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ formatPercentage(financialData.bondYield) }}%</div>
            <div class="card-label">{{ t('home.germanBond10Y') }}</div>
            <div class="card-change" :class="getChangeClasses(financialData.bondYieldChange)">
              {{ formatChange(financialData.bondYieldChange) }}
            </div>
          </div>
        </div>

        <div class="financial-card">
          <div class="card-icon">
            <CurrencyDollarIcon class="w-6 h-6 text-green-500" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ formatCurrency(financialData.eurUsd, 'USD', 4) }}</div>
            <div class="card-label">{{ t('home.eurUsdRate') }}</div>
            <div class="card-change" :class="getChangeClasses(financialData.eurUsdChange)">
              {{ formatChange(financialData.eurUsdChange, 4) }}
            </div>
          </div>
        </div>

        <div class="financial-card">
          <div class="card-icon">
            <ChartBarIcon class="w-6 h-6 text-orange-500" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ formatNumber(financialData.daxIndex) }}</div>
            <div class="card-label">{{ t('home.daxIndex') }}</div>
            <div class="card-change" :class="getChangeClasses(financialData.daxChange)">
              {{ formatChange(financialData.daxChange, 0) }}
            </div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>

    <!-- 计算器功能模块 -->
    <section class="calculators-section">
      <div class="section-header">
        <h2 class="section-title">{{ t('home.calculators') }}</h2>
        <p class="section-description">{{ t('home.calculatorsDescription') }}</p>
      </div>

      <div class="calculators-grid">
        <div
          v-for="calculator in calculators"
          :key="calculator.id"
          class="calculator-card"
          @click="navigateToCalculator(calculator.route)"
        >
          <div class="calculator-header">
            <div class="calculator-icon">
              <component :is="calculator.icon" :class="calculator.iconColor" />
            </div>
            <div class="calculator-badge" v-if="calculator.isNew">
              {{ t('home.new') }}
            </div>
          </div>

          <div class="calculator-content">
            <h3 class="calculator-title">{{ calculator.title }}</h3>
            <p class="calculator-description">{{ calculator.description }}</p>

            <div class="calculator-features">
              <div
                v-for="feature in calculator.features"
                :key="feature"
                class="feature-tag"
              >
                {{ feature }}
              </div>
            </div>
          </div>

          <div class="calculator-footer">
            <div class="usage-stats">
              <UsersIcon class="w-4 h-4 text-gray-400" />
              <span class="usage-count">{{ formatNumber(calculator.usageCount) }}</span>
            </div>
            <ChevronRightIcon class="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </section>

    <!-- AI智能建议预览 -->
    <section v-if="isAuthenticated" class="ai-suggestions">
      <div class="section-header">
        <h2 class="section-title">{{ t('home.aiSuggestions') }}</h2>
        <router-link to="/ai-advisor" class="view-all-link">
          {{ t('home.viewAll') }}
          <ArrowRightIcon class="w-4 h-4 ml-1" />
        </router-link>
      </div>

      <div class="suggestions-grid">
        <div
          v-for="suggestion in aiSuggestions.slice(0, 3)"
          :key="suggestion.id"
          class="suggestion-card"
        >
          <div class="suggestion-header">
            <div class="suggestion-priority" :class="getPriorityClasses(suggestion.priority)">
              {{ getPriorityText(suggestion.priority) }}
            </div>
            <div class="suggestion-confidence">
              {{ suggestion.confidence }}%
            </div>
          </div>

          <div class="suggestion-content">
            <h4 class="suggestion-title">{{ suggestion.title }}</h4>
            <p class="suggestion-description">{{ suggestion.description }}</p>
          </div>

          <div class="suggestion-footer">
            <button @click="implementSuggestion(suggestion)" class="implement-button">
              {{ t('home.implement') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 最近使用的计算器 -->
    <section v-if="recentCalculators.length > 0" class="recent-calculators">
      <div class="section-header">
        <h2 class="section-title">{{ t('home.recentCalculators') }}</h2>
        <button @click="clearRecentCalculators" class="clear-button">
          {{ t('home.clearRecent') }}
        </button>
      </div>

      <div class="recent-grid">
        <div
          v-for="recent in recentCalculators"
          :key="recent.id"
          class="recent-card"
          @click="navigateToCalculator(recent.route, recent.params)"
        >
          <div class="recent-icon">
            <component :is="recent.icon" class="w-5 h-5 text-blue-500" />
          </div>
          <div class="recent-content">
            <div class="recent-title">{{ recent.title }}</div>
            <div class="recent-params">{{ formatRecentParams(recent.params) }}</div>
            <div class="recent-time">{{ formatRecentTime(recent.lastUsed) }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 快速操作 -->
    <section class="quick-actions">
      <div class="section-header">
        <h2 class="section-title">{{ t('home.quickActions') }}</h2>
      </div>

      <div class="actions-grid">
        <button
          v-for="action in quickActions"
          :key="action.id"
          @click="executeQuickAction(action)"
          class="action-button"
        >
          <component :is="action.icon" :class="action.iconColor" />
          <span class="action-text">{{ action.text }}</span>
        </button>
      </div>
    </section>

    <!-- 用户认证提示 -->
    <section v-if="!isAuthenticated" class="auth-prompt">
      <div class="prompt-content">
        <div class="prompt-icon">
          <UserIcon class="w-12 h-12 text-blue-500" />
        </div>
        <div class="prompt-text">
          <h3 class="prompt-title">{{ t('home.authPromptTitle') }}</h3>
          <p class="prompt-description">{{ t('home.authPromptDescription') }}</p>
        </div>
        <div class="prompt-actions">
          <button @click="showAuthModal = true" class="auth-button primary">
            {{ t('home.signUp') }}
          </button>
          <button @click="showAuthModal = true" class="auth-button secondary">
            {{ t('home.signIn') }}
          </button>
        </div>
      </div>
    </section>

    <!-- 认证模态框 -->
    <AuthModal
      v-if="showAuthModal"
      :is-visible="showAuthModal"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckCircleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  UserIcon,
  CalculatorIcon,
  CogIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'
import AuthModal from '@/components/auth/AuthModal.vue'
import ResponsiveContainer from '@/components/ui/ResponsiveContainer.vue'
import { useI18n } from '@/services/I18nService'
import { useUserManager } from '@/services/UserManager'
import { useRealTimeData } from '@/services/RealTimeDataManager'
import { useAIAdvisor } from '@/services/AIAdvisorManager'

// 使用服务
const { t } = useI18n()
const router = useRouter()
const { isAuthenticated } = useUserManager()
const { getGermanFinancialData } = useRealTimeData()
const { stats: aiStats } = useAIAdvisor()

// 响应式状态
const showAuthModal = ref(false)
const isRefreshing = ref(false)
const totalCalculations = ref(12847)
const currentInterestRate = ref(4.5)

// 金融数据
const financialData = ref({
  ecbRate: 4.5,
  ecbRateChange: 0.0,
  bondYield: 2.3,
  bondYieldChange: 0.05,
  eurUsd: 1.0842,
  eurUsdChange: -0.0023,
  daxIndex: 15567,
  daxChange: 45.2
})

// 计算器配置
const calculators = [
  {
    id: 'compound-interest',
    title: t('calculators.compoundInterest'),
    description: t('calculators.compoundInterestDesc'),
    icon: CalculatorIcon,
    iconColor: 'w-8 h-8 text-blue-500',
    route: '/calculator/compound-interest',
    features: [t('calculators.realTimeRates'), t('calculators.charts'), t('calculators.export')],
    usageCount: 3247,
    isNew: false
  },
  {
    id: 'loan-calculator',
    title: t('calculators.loanCalculator'),
    description: t('calculators.loanCalculatorDesc'),
    icon: BanknotesIcon,
    iconColor: 'w-8 h-8 text-green-500',
    route: '/calculator/loan',
    features: [t('calculators.amortization'), t('calculators.comparison'), t('calculators.taxes')],
    usageCount: 2891,
    isNew: false
  },
  {
    id: 'investment-calculator',
    title: t('calculators.investmentCalculator'),
    description: t('calculators.investmentCalculatorDesc'),
    icon: ChartBarIcon,
    iconColor: 'w-8 h-8 text-purple-500',
    route: '/calculator/investment',
    features: [t('calculators.portfolio'), t('calculators.risk'), t('calculators.performance')],
    usageCount: 1956,
    isNew: true
  },
  {
    id: 'retirement-calculator',
    title: t('calculators.retirementCalculator'),
    description: t('calculators.retirementCalculatorDesc'),
    icon: UserIcon,
    iconColor: 'w-8 h-8 text-orange-500',
    route: '/calculator/retirement',
    features: [t('calculators.pension'), t('calculators.riester'), t('calculators.planning')],
    usageCount: 1634,
    isNew: false
  }
]

// AI建议
const aiSuggestions = ref([
  {
    id: 'emergency-fund',
    title: 'Notfallfonds aufbauen',
    description: 'Erhöhen Sie Ihren Notfallfonds auf 6 Monatsausgaben',
    priority: 'high',
    confidence: 92
  },
  {
    id: 'etf-investment',
    title: 'ETF-Sparplan starten',
    description: 'Beginnen Sie mit einem diversifizierten ETF-Sparplan',
    priority: 'medium',
    confidence: 85
  },
  {
    id: 'tax-optimization',
    title: 'Steueroptimierung nutzen',
    description: 'Nutzen Sie Ihre Freibeträge optimal aus',
    priority: 'low',
    confidence: 78
  }
])

// 最近使用的计算器
const recentCalculators = ref([
  {
    id: 'recent-1',
    title: t('calculators.compoundInterest'),
    icon: CalculatorIcon,
    route: '/calculator/compound-interest',
    params: { principal: 10000, rate: 4.5, time: 10 },
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
  }
])

// 快速操作
const quickActions = [
  {
    id: 'new-calculation',
    text: t('home.newCalculation'),
    icon: CalculatorIcon,
    iconColor: 'w-6 h-6 text-blue-500',
    action: 'navigate',
    target: '/calculator'
  },
  {
    id: 'ai-advisor',
    text: t('home.aiAdvisor'),
    icon: SparklesIcon,
    iconColor: 'w-6 h-6 text-purple-500',
    action: 'navigate',
    target: '/ai-advisor'
  },
  {
    id: 'export-data',
    text: t('home.exportData'),
    icon: DocumentArrowDownIcon,
    iconColor: 'w-6 h-6 text-green-500',
    action: 'export'
  },
  {
    id: 'settings',
    text: t('home.settings'),
    icon: CogIcon,
    iconColor: 'w-6 h-6 text-gray-500',
    action: 'navigate',
    target: '/settings'
  }
]

// 方法
const refreshFinancialData = async (): Promise<void> => {
  isRefreshing.value = true

  try {
    const data = getGermanFinancialData()
    financialData.value = {
      ecbRate: data['DE-BASE-RATE']?.value || 4.5,
      ecbRateChange: data['DE-BASE-RATE']?.change || 0,
      bondYield: data['DE-10Y-BOND']?.value || 2.3,
      bondYieldChange: data['DE-10Y-BOND']?.change || 0,
      eurUsd: data['EUR-USD']?.value || 1.08,
      eurUsdChange: data['EUR-USD']?.change || 0,
      daxIndex: data['DAX']?.value || 15500,
      daxChange: data['DAX']?.change || 0
    }
  } catch (error) {
    console.error('Failed to refresh financial data:', error)
  } finally {
    isRefreshing.value = false
  }
}

const navigateToCalculator = (route: string, params?: any): void => {
  if (params) {
    router.push({ path: route, query: params })
  } else {
    router.push(route)
  }
}

const executeQuickAction = (action: any): void => {
  switch (action.action) {
    case 'navigate':
      router.push(action.target)
      break
    case 'export':
      // 实现导出功能
      console.log('Export data')
      break
    default:
      console.log('Unknown action:', action)
  }
}

const implementSuggestion = (suggestion: any): void => {
  console.log('Implement suggestion:', suggestion)
  // 实现建议的具体逻辑
}

const clearRecentCalculators = (): void => {
  recentCalculators.value = []
}

const handleAuthSuccess = (user: any): void => {
  showAuthModal.value = false
  console.log('User authenticated:', user)
}

// 格式化方法
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('de-DE').format(value)
}

const formatPercentage = (value: number): string => {
  return value.toFixed(2)
}

const formatCurrency = (value: number, currency = 'EUR', decimals = 2): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

const formatChange = (change: number, decimals = 2): string => {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(decimals)}`
}

const getChangeClasses = (change: number): string[] => {
  const classes = ['text-sm', 'font-medium']

  if (change > 0) {
    classes.push('text-green-600', 'dark:text-green-400')
  } else if (change < 0) {
    classes.push('text-red-600', 'dark:text-red-400')
  } else {
    classes.push('text-gray-500', 'dark:text-gray-500')
  }

  return classes
}

const getPriorityClasses = (priority: string): string[] => {
  const classes = ['px-2', 'py-1', 'rounded-full', 'text-xs', 'font-medium']

  switch (priority) {
    case 'high':
      classes.push('bg-red-100', 'text-red-800', 'dark:bg-red-900/20', 'dark:text-red-400')
      break
    case 'medium':
      classes.push('bg-yellow-100', 'text-yellow-800', 'dark:bg-yellow-900/20', 'dark:text-yellow-400')
      break
    case 'low':
      classes.push('bg-green-100', 'text-green-800', 'dark:bg-green-900/20', 'dark:text-green-400')
      break
  }

  return classes
}

const getPriorityText = (priority: string): string => {
  const priorityMap = {
    high: t('priority.high'),
    medium: t('priority.medium'),
    low: t('priority.low')
  }
  return priorityMap[priority as keyof typeof priorityMap] || priority
}

const formatRecentParams = (params: any): string => {
  if (params.principal && params.rate && params.time) {
    return `${formatCurrency(params.principal)}, ${params.rate}%, ${params.time}J`
  }
  return ''
}

const formatRecentTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return t('time.justNow')
  if (diff < 3600000) return t('time.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('time.hoursAgo', { count: Math.floor(diff / 3600000) })

  return date.toLocaleDateString('de-DE')
}

// 生命周期
onMounted(() => {
  refreshFinancialData()
})
</script>

<style scoped>
.home-page {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.hero-section {
  @apply bg-gradient-to-br from-blue-600 to-purple-700 text-white py-12 sm:py-16;
}

.hero-content {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center;
}

.hero-title {
  @apply text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight;
}

.hero-subtitle {
  @apply text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed;
}

.hero-features {
  @apply space-y-3;
}

.feature-item {
  @apply flex items-center space-x-3;
}

.visual-card {
  @apply bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center;
}

.visual-stats {
  @apply grid grid-cols-2 gap-6;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply text-2xl font-bold block;
}

.stat-label {
  @apply text-sm text-blue-100;
}

.financial-overview,
.calculators-section,
.ai-suggestions,
.recent-calculators,
.quick-actions {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12;
}

.section-header {
  @apply flex items-center justify-between mb-8;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.section-description {
  @apply text-gray-600 dark:text-gray-400 mt-2;
}

.financial-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6;
}

.financial-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105;
}

.card-icon {
  @apply mb-4;
}

.card-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-1;
}

.card-label {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
}

.calculators-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6;
}

.calculator-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 active:scale-95;
}

.calculator-header {
  @apply flex items-start justify-between mb-4;
}

.calculator-badge {
  @apply px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs font-medium rounded-full;
}

.calculator-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.calculator-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-4;
}

.calculator-features {
  @apply flex flex-wrap gap-2 mb-4;
}

.feature-tag {
  @apply px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded;
}

.calculator-footer {
  @apply flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700;
}

.usage-stats {
  @apply flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500;
}

.suggestions-grid,
.recent-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.suggestion-card,
.recent-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200;
}

.actions-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.action-button {
  @apply flex flex-col items-center space-y-2 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200;
}

.action-text {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.auth-prompt {
  @apply bg-blue-50 dark:bg-blue-900/20 py-12;
}

.prompt-content {
  @apply max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center;
}

.prompt-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-4;
}

.prompt-description {
  @apply text-gray-600 dark:text-gray-400 mb-8;
}

.prompt-actions {
  @apply flex items-center justify-center space-x-4;
}

.auth-button {
  @apply px-6 py-3 rounded-lg font-medium transition-colors duration-200;
}

.auth-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.auth-button.secondary {
  @apply bg-white text-blue-600 border border-blue-600 hover:bg-blue-50;
}

.refresh-button,
.view-all-link,
.clear-button {
  @apply flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300;
}

.implement-button {
  @apply px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors duration-200;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .hero-content {
    @apply grid-cols-1 text-center;
  }

  .financial-grid,
  .calculators-grid {
    @apply grid-cols-1;
  }

  .suggestions-grid,
  .recent-grid {
    @apply grid-cols-1;
  }

  .actions-grid {
    @apply grid-cols-2;
  }
}

/* 动画 */
.calculator-card:hover {
  transform: translateY(-2px);
}

.financial-card,
.calculator-card,
.suggestion-card,
.recent-card {
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

/* 移动端专用优化 */
@media (max-width: 640px) {
  .hero-content {
    @apply gap-6;
  }

  .hero-title {
    @apply text-2xl leading-tight;
  }

  .hero-subtitle {
    @apply text-base mb-6;
  }

  .visual-card {
    @apply p-6;
  }

  .visual-stats {
    @apply grid-cols-1 gap-4;
  }

  .financial-grid {
    @apply gap-3;
  }

  .financial-card {
    @apply p-4;
  }

  .card-value {
    @apply text-xl;
  }

  .calculators-grid {
    @apply gap-3;
  }

  .calculator-card {
    @apply p-4;
  }

  .section-title {
    @apply text-xl;
  }

  .financial-overview,
  .calculators-section,
  .ai-suggestions,
  .recent-calculators,
  .quick-actions {
    @apply py-8;
  }
}

/* 超小屏幕优化 */
@media (max-width: 375px) {
  .hero-content {
    @apply px-3;
  }

  .financial-overview,
  .calculators-section,
  .ai-suggestions,
  .recent-calculators,
  .quick-actions {
    @apply px-3;
  }

  .hero-title {
    @apply text-xl;
  }

  .hero-subtitle {
    @apply text-sm;
  }
}
</style>
