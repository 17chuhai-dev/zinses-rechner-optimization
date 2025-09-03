<!--
  安全监控面板组件
  提供应用安全状态监控和管理界面
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('security.monitorPanel') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('security.monitorDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <div class="security-status flex items-center space-x-2">
            <div :class="getSecurityStatusClasses()"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ getSecurityStatusText() }}
            </span>
          </div>
          
          <button
            @click="refreshSecurityData"
            class="refresh-button"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            {{ t('security.refresh') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 安全概览 -->
    <div class="security-overview mb-6">
      <div class="overview-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 风险评分 -->
        <div class="stat-card">
          <div class="stat-header">
            <ShieldExclamationIcon :class="getRiskScoreIconClasses()" />
            <span class="stat-title">{{ t('security.riskScore') }}</span>
          </div>
          <div class="stat-value" :class="getRiskScoreClasses()">
            {{ stats.riskScore }}/100
          </div>
          <div class="risk-indicator">
            <div class="risk-bar">
              <div 
                class="risk-fill"
                :class="getRiskFillClasses()"
                :style="{ width: `${stats.riskScore}%` }"
              ></div>
            </div>
            <span class="risk-label">{{ getRiskLevelText() }}</span>
          </div>
        </div>
        
        <!-- 总事件数 -->
        <div class="stat-card">
          <div class="stat-header">
            <ExclamationTriangleIcon class="w-5 h-5 text-yellow-500" />
            <span class="stat-title">{{ t('security.totalEvents') }}</span>
          </div>
          <div class="stat-value">
            {{ stats.totalEvents.toLocaleString() }}
          </div>
          <div class="stat-meta text-xs text-gray-500 dark:text-gray-500">
            {{ t('security.blocked') }}: {{ stats.blockedEvents }}
          </div>
        </div>
        
        <!-- 最近活动 -->
        <div class="stat-card">
          <div class="stat-header">
            <ClockIcon class="w-5 h-5 text-blue-500" />
            <span class="stat-title">{{ t('security.recentActivity') }}</span>
          </div>
          <div class="stat-value">
            {{ getRecentEventsCount() }}
          </div>
          <div class="stat-meta text-xs text-gray-500 dark:text-gray-500">
            {{ t('security.lastHour') }}
          </div>
        </div>
        
        <!-- 最后检查 -->
        <div class="stat-card">
          <div class="stat-header">
            <CheckCircleIcon class="w-5 h-5 text-green-500" />
            <span class="stat-title">{{ t('security.lastCheck') }}</span>
          </div>
          <div class="stat-value text-sm">
            {{ formatTimestamp(lastSecurityCheck) }}
          </div>
          <div class="stat-meta text-xs text-gray-500 dark:text-gray-500">
            {{ getTimeSinceLastCheck() }}
          </div>
        </div>
      </div>
    </div>

    <!-- 事件类型分布 -->
    <div class="event-distribution mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('security.eventDistribution') }}
      </h4>
      
      <div class="distribution-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(count, type) in stats.eventsByType"
          :key="type"
          class="distribution-item"
        >
          <div class="distribution-header flex items-center justify-between">
            <div class="distribution-info flex items-center space-x-2">
              <component :is="getEventTypeIcon(type)" :class="getEventTypeIconClasses(type)" />
              <span class="distribution-title">{{ getEventTypeLabel(type) }}</span>
            </div>
            <span class="distribution-count">{{ count }}</span>
          </div>
          <div class="distribution-bar">
            <div 
              class="distribution-fill"
              :class="getEventTypeFillClasses(type)"
              :style="{ width: `${(count / Math.max(stats.totalEvents, 1)) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近安全事件 -->
    <div class="recent-events mb-6">
      <div class="events-header flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('security.recentEvents') }}
        </h4>
        
        <div class="events-controls flex items-center space-x-2">
          <select v-model="eventFilter" class="event-filter">
            <option value="">{{ t('security.allEvents') }}</option>
            <option value="xss_attempt">{{ t('security.xssAttempts') }}</option>
            <option value="invalid_input">{{ t('security.invalidInput') }}</option>
            <option value="rate_limit">{{ t('security.rateLimits') }}</option>
            <option value="blocked_domain">{{ t('security.blockedDomains') }}</option>
            <option value="file_upload">{{ t('security.fileUploads') }}</option>
            <option value="csp_violation">{{ t('security.cspViolations') }}</option>
          </select>
          
          <button
            @click="clearSecurityEvents"
            :disabled="stats.totalEvents === 0"
            class="clear-events-button"
          >
            <TrashIcon class="w-4 h-4 mr-2" />
            {{ t('security.clearEvents') }}
          </button>
        </div>
      </div>
      
      <div class="events-list space-y-3">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          :class="getEventItemClasses(event)"
        >
          <div class="event-content flex items-start justify-between">
            <div class="event-info flex items-start space-x-3">
              <div :class="getEventSeverityClasses(event.severity)">
                <component :is="getSeverityIcon(event.severity)" class="w-5 h-5" />
              </div>
              
              <div class="event-details">
                <div class="event-message font-medium text-gray-900 dark:text-white">
                  {{ event.message }}
                </div>
                <div class="event-meta flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-500">
                  <span>{{ formatTimestamp(event.timestamp) }}</span>
                  <span>{{ getEventTypeLabel(event.type) }}</span>
                  <span>{{ t(`security.severity.${event.severity}`) }}</span>
                  <span v-if="event.blocked" class="blocked-badge">
                    {{ t('security.blocked') }}
                  </span>
                </div>
                <div v-if="event.details && showEventDetails[event.id]" class="event-details-content mt-2">
                  <pre class="details-json">{{ JSON.stringify(event.details, null, 2) }}</pre>
                </div>
              </div>
            </div>
            
            <div class="event-actions flex items-center space-x-2">
              <button
                @click="toggleEventDetails(event.id)"
                class="details-button"
                :aria-label="`${t('security.toggleDetails')} ${event.message}`"
              >
                <component :is="showEventDetails[event.id] ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="filteredEvents.length === 0" class="empty-events text-center py-8">
          <ShieldCheckIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ t('security.noEvents') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {{ eventFilter ? t('security.noEventsForFilter') : t('security.noEventsDescription') }}
          </p>
        </div>
      </div>
    </div>

    <!-- 安全建议 -->
    <div v-if="securityRecommendations.length > 0" class="security-recommendations mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('security.recommendations') }}
      </h4>
      
      <div class="recommendations-list space-y-3">
        <div
          v-for="(recommendation, index) in securityRecommendations"
          :key="index"
          class="recommendation-item"
        >
          <div class="recommendation-content flex items-start space-x-3">
            <LightBulbIcon class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span class="recommendation-text text-gray-700 dark:text-gray-300">
              {{ recommendation }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions flex items-center justify-between">
      <div class="action-info">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('security.monitoringActive') }}
        </span>
      </div>
      
      <div class="main-actions flex items-center space-x-3">
        <button
          @click="exportSecurityReport"
          class="export-button"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          {{ t('security.exportReport') }}
        </button>
        
        <button
          @click="showConfigModal = true"
          class="config-button"
        >
          <Cog6ToothIcon class="w-4 h-4 mr-2" />
          {{ t('security.configure') }}
        </button>
      </div>
    </div>

    <!-- 配置模态框 -->
    <SecurityConfigModal
      v-if="showConfigModal"
      @close="showConfigModal = false"
      @update="handleConfigUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ShieldExclamationIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  LightBulbIcon,
  BugAntIcon,
  ExclamationCircleIcon,
  NoSymbolIcon,
  DocumentIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  FireIcon
} from '@heroicons/vue/24/outline'
import SecurityConfigModal from './SecurityConfigModal.vue'
import { useSecurity } from '@/services/SecurityManager'
import { useI18n } from '@/services/I18nService'
import { saveAs } from '../utils/file-saver-mock'
import type { SecurityEvent, SecurityConfig } from '@/services/SecurityManager'

// Props
interface Props {
  showTitle?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true,
  autoRefresh: true,
  refreshInterval: 30000 // 30秒
})

// 使用服务
const {
  stats,
  isEnabled,
  lastSecurityCheck,
  getSecurityEvents,
  clearSecurityEvents,
  exportSecurityReport,
  updateConfig
} = useSecurity()

const { t } = useI18n()

// 响应式状态
const showConfigModal = ref(false)
const eventFilter = ref('')
const showEventDetails = ref<Record<string, boolean>>({})
const securityEvents = ref<SecurityEvent[]>([])
const securityRecommendations = ref<string[]>([])
const refreshTimer = ref<number>()

// 计算属性
const containerClasses = computed(() => {
  const classes = ['security-monitor-panel', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'p-6']
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const ariaLabel = computed(() => {
  return `${t('security.monitorPanel')}: ${getRiskLevelText()}, ${stats.totalEvents} ${t('security.events')}`
})

const filteredEvents = computed(() => {
  if (!eventFilter.value) {
    return securityEvents.value
  }
  return securityEvents.value.filter(event => event.type === eventFilter.value)
})

// 方法
const getSecurityStatusClasses = (): string[] => {
  const classes = ['w-2', 'h-2', 'rounded-full']
  
  if (stats.riskScore < 30) {
    classes.push('bg-green-500')
  } else if (stats.riskScore < 70) {
    classes.push('bg-yellow-500')
  } else {
    classes.push('bg-red-500', 'animate-pulse')
  }
  
  return classes
}

const getSecurityStatusText = (): string => {
  if (stats.riskScore < 30) {
    return t('security.statusGood')
  } else if (stats.riskScore < 70) {
    return t('security.statusWarning')
  } else {
    return t('security.statusCritical')
  }
}

const getRiskScoreIconClasses = (): string[] => {
  const classes = ['w-5', 'h-5']
  
  if (stats.riskScore < 30) {
    classes.push('text-green-500')
  } else if (stats.riskScore < 70) {
    classes.push('text-yellow-500')
  } else {
    classes.push('text-red-500')
  }
  
  return classes
}

const getRiskScoreClasses = (): string[] => {
  const classes = ['text-2xl', 'font-bold']
  
  if (stats.riskScore < 30) {
    classes.push('text-green-600', 'dark:text-green-400')
  } else if (stats.riskScore < 70) {
    classes.push('text-yellow-600', 'dark:text-yellow-400')
  } else {
    classes.push('text-red-600', 'dark:text-red-400')
  }
  
  return classes
}

const getRiskFillClasses = (): string[] => {
  const classes = ['transition-all', 'duration-500', 'h-full', 'rounded-full']
  
  if (stats.riskScore < 30) {
    classes.push('bg-green-500')
  } else if (stats.riskScore < 70) {
    classes.push('bg-yellow-500')
  } else {
    classes.push('bg-red-500')
  }
  
  return classes
}

const getRiskLevelText = (): string => {
  if (stats.riskScore < 30) {
    return t('security.riskLow')
  } else if (stats.riskScore < 70) {
    return t('security.riskMedium')
  } else {
    return t('security.riskHigh')
  }
}

const getEventTypeIcon = (type: string) => {
  const icons: Record<string, any> = {
    xss_attempt: BugAntIcon,
    invalid_input: ExclamationCircleIcon,
    rate_limit: NoSymbolIcon,
    blocked_domain: GlobeAltIcon,
    file_upload: DocumentIcon,
    csp_violation: ShieldExclamationIcon
  }
  return icons[type] || InformationCircleIcon
}

const getEventTypeIconClasses = (type: string): string[] => {
  const classes = ['w-4', 'h-4']
  
  const colorMap: Record<string, string[]> = {
    xss_attempt: ['text-red-500'],
    invalid_input: ['text-yellow-500'],
    rate_limit: ['text-orange-500'],
    blocked_domain: ['text-purple-500'],
    file_upload: ['text-blue-500'],
    csp_violation: ['text-red-600']
  }
  
  classes.push(...(colorMap[type] || ['text-gray-500']))
  return classes
}

const getEventTypeFillClasses = (type: string): string[] => {
  const classes = ['transition-all', 'duration-300', 'h-2', 'rounded-full']
  
  const colorMap: Record<string, string[]> = {
    xss_attempt: ['bg-red-500'],
    invalid_input: ['bg-yellow-500'],
    rate_limit: ['bg-orange-500'],
    blocked_domain: ['bg-purple-500'],
    file_upload: ['bg-blue-500'],
    csp_violation: ['bg-red-600']
  }
  
  classes.push(...(colorMap[type] || ['bg-gray-500']))
  return classes
}

const getEventTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    xss_attempt: t('security.xssAttempt'),
    invalid_input: t('security.invalidInput'),
    rate_limit: t('security.rateLimit'),
    blocked_domain: t('security.blockedDomain'),
    file_upload: t('security.fileUpload'),
    csp_violation: t('security.cspViolation')
  }
  return labels[type] || type
}

const getEventItemClasses = (event: SecurityEvent): string[] => {
  const classes = [
    'event-item',
    'p-4',
    'border',
    'rounded-lg',
    'transition-colors',
    'duration-200'
  ]
  
  switch (event.severity) {
    case 'critical':
      classes.push('border-red-300', 'bg-red-50', 'dark:border-red-800', 'dark:bg-red-900/20')
      break
    case 'high':
      classes.push('border-orange-300', 'bg-orange-50', 'dark:border-orange-800', 'dark:bg-orange-900/20')
      break
    case 'medium':
      classes.push('border-yellow-300', 'bg-yellow-50', 'dark:border-yellow-800', 'dark:bg-yellow-900/20')
      break
    case 'low':
      classes.push('border-blue-300', 'bg-blue-50', 'dark:border-blue-800', 'dark:bg-blue-900/20')
      break
    default:
      classes.push('border-gray-200', 'bg-gray-50', 'dark:border-gray-700', 'dark:bg-gray-800')
  }
  
  return classes
}

const getEventSeverityClasses = (severity: string): string[] => {
  const classes = ['flex', 'items-center', 'justify-center', 'w-8', 'h-8', 'rounded-full']
  
  switch (severity) {
    case 'critical':
      classes.push('bg-red-100', 'dark:bg-red-900', 'text-red-600', 'dark:text-red-400')
      break
    case 'high':
      classes.push('bg-orange-100', 'dark:bg-orange-900', 'text-orange-600', 'dark:text-orange-400')
      break
    case 'medium':
      classes.push('bg-yellow-100', 'dark:bg-yellow-900', 'text-yellow-600', 'dark:text-yellow-400')
      break
    case 'low':
      classes.push('bg-blue-100', 'dark:bg-blue-900', 'text-blue-600', 'dark:text-blue-400')
      break
    default:
      classes.push('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400')
  }
  
  return classes
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return FireIcon
    case 'high': return ExclamationTriangleIcon
    case 'medium': return ExclamationCircleIcon
    case 'low': return InformationCircleIcon
    default: return InformationCircleIcon
  }
}

const getRecentEventsCount = (): number => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  return securityEvents.value.filter(event => event.timestamp >= oneHourAgo).length
}

const getTimeSinceLastCheck = (): string => {
  const diff = Date.now() - lastSecurityCheck.value.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) {
    return t('security.justNow')
  } else if (minutes < 60) {
    return t('security.minutesAgo', { count: minutes })
  } else {
    const hours = Math.floor(minutes / 60)
    return t('security.hoursAgo', { count: hours })
  }
}

const formatTimestamp = (date: Date): string => {
  return date.toLocaleString('de-DE')
}

const toggleEventDetails = (eventId: string): void => {
  showEventDetails.value[eventId] = !showEventDetails.value[eventId]
}

const refreshSecurityData = async (): Promise<void> => {
  securityEvents.value = getSecurityEvents(50)
  
  // 获取安全建议
  const report = exportSecurityReport()
  securityRecommendations.value = report.recommendations
}

const exportReport = (): void => {
  const report = exportSecurityReport()
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const filename = `security-report-${new Date().toISOString().slice(0, 10)}.json`
  saveAs(blob, filename)
}

const handleConfigUpdate = (newConfig: Partial<SecurityConfig>): void => {
  updateConfig(newConfig)
  showConfigModal.value = false
  refreshSecurityData()
}

// 生命周期
onMounted(() => {
  refreshSecurityData()
  
  if (props.autoRefresh) {
    refreshTimer.value = window.setInterval(() => {
      refreshSecurityData()
    }, props.refreshInterval)
  }
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style scoped>
.security-monitor-panel {
  @apply max-w-7xl mx-auto;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm;
}

.stat-header {
  @apply flex items-center space-x-2 mb-2;
}

.stat-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.risk-indicator {
  @apply mt-2;
}

.risk-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.risk-label {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.distribution-item {
  @apply bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700;
}

.distribution-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.distribution-count {
  @apply text-sm font-bold text-gray-900 dark:text-white;
}

.distribution-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2;
}

.event-filter {
  @apply px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.blocked-badge {
  @apply px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full font-medium;
}

.details-json {
  @apply text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded border overflow-x-auto;
}

.recommendation-item {
  @apply bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3;
}

.refresh-button,
.clear-events-button,
.export-button,
.config-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.refresh-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.clear-events-button {
  @apply text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500;
}

.export-button {
  @apply text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500;
}

.config-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.details-button {
  @apply p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md;
}

button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .overview-grid {
    @apply grid-cols-1;
  }
  
  .distribution-grid {
    @apply grid-cols-1;
  }
  
  .panel-actions {
    @apply flex-col space-y-3;
  }
  
  .main-actions {
    @apply w-full justify-between;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .stat-card {
  @apply border-2 border-current;
}

/* 暗色模式支持 */
:global(.theme-dark) .stat-card {
  @apply bg-gray-800 border-gray-600;
}

/* 打印样式 */
@media print {
  .panel-actions,
  .header-actions {
    @apply hidden;
  }
}
</style>
