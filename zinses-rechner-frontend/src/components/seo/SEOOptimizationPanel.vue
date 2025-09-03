<!--
  SEO优化面板组件
  提供SEO状态监控和优化管理界面
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('seo.optimizationPanel') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('seo.panelDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <div class="seo-status flex items-center space-x-2">
            <div :class="getSEOStatusClasses()"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ getSEOStatusText() }}
            </span>
          </div>
          
          <button
            @click="refreshSEOData"
            class="refresh-button"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            {{ t('seo.refresh') }}
          </button>
        </div>
      </div>
    </div>

    <!-- SEO概览 -->
    <div class="seo-overview mb-6">
      <div class="overview-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 优化页面数 -->
        <div class="stat-card">
          <div class="stat-header">
            <CheckCircleIcon class="w-5 h-5 text-green-500" />
            <span class="stat-title">{{ t('seo.optimizedPages') }}</span>
          </div>
          <div class="stat-value">
            {{ stats.optimizedPages }}/{{ stats.totalPages }}
          </div>
          <div class="stat-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill bg-green-500"
                :style="{ width: `${getOptimizationRate()}%` }"
              ></div>
            </div>
            <span class="progress-text">{{ formatPercentage(getOptimizationRate()) }}</span>
          </div>
        </div>
        
        <!-- 平均标题长度 -->
        <div class="stat-card">
          <div class="stat-header">
            <DocumentTextIcon class="w-5 h-5 text-blue-500" />
            <span class="stat-title">{{ t('seo.averageTitleLength') }}</span>
          </div>
          <div class="stat-value">
            {{ Math.round(stats.averageTitleLength) }}
          </div>
          <div class="stat-meta text-xs" :class="getTitleLengthClasses()">
            {{ getTitleLengthStatus() }}
          </div>
        </div>
        
        <!-- 平均描述长度 -->
        <div class="stat-card">
          <div class="stat-header">
            <ChatBubbleLeftRightIcon class="w-5 h-5 text-purple-500" />
            <span class="stat-title">{{ t('seo.averageDescriptionLength') }}</span>
          </div>
          <div class="stat-value">
            {{ Math.round(stats.averageDescriptionLength) }}
          </div>
          <div class="stat-meta text-xs" :class="getDescriptionLengthClasses()">
            {{ getDescriptionLengthStatus() }}
          </div>
        </div>
        
        <!-- 结构化数据页面 -->
        <div class="stat-card">
          <div class="stat-header">
            <CodeBracketIcon class="w-5 h-5 text-orange-500" />
            <span class="stat-title">{{ t('seo.structuredDataPages') }}</span>
          </div>
          <div class="stat-value">
            {{ stats.structuredDataPages }}
          </div>
          <div class="stat-meta text-xs text-gray-500 dark:text-gray-500">
            {{ t('seo.ofTotalPages', { total: stats.totalPages }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- SEO问题 -->
    <div v-if="seoIssues.length > 0" class="seo-issues mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('seo.identifiedIssues') }}
      </h4>
      
      <div class="issues-list space-y-3">
        <div
          v-for="issue in seoIssues"
          :key="issue.id"
          :class="getIssueItemClasses(issue.severity)"
        >
          <div class="issue-content flex items-start space-x-3">
            <div :class="getIssueSeverityClasses(issue.severity)">
              <component :is="getSeverityIcon(issue.severity)" class="w-5 h-5" />
            </div>
            
            <div class="issue-details flex-1">
              <div class="issue-title font-medium text-gray-900 dark:text-white">
                {{ issue.title }}
              </div>
              <div class="issue-description text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ issue.description }}
              </div>
              <div v-if="issue.pages && issue.pages.length > 0" class="affected-pages mt-2">
                <span class="text-xs text-gray-500 dark:text-gray-500">
                  {{ t('seo.affectedPages') }}: {{ issue.pages.slice(0, 3).join(', ') }}
                  <span v-if="issue.pages.length > 3">
                    {{ t('seo.andMore', { count: issue.pages.length - 3 }) }}
                  </span>
                </span>
              </div>
            </div>
            
            <div class="issue-actions">
              <button
                @click="fixIssue(issue)"
                class="fix-button"
                :disabled="issue.autoFixable === false"
              >
                {{ issue.autoFixable ? t('seo.autoFix') : t('seo.viewDetails') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO建议 -->
    <div v-if="seoRecommendations.length > 0" class="seo-recommendations mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('seo.recommendations') }}
      </h4>
      
      <div class="recommendations-list space-y-3">
        <div
          v-for="(recommendation, index) in seoRecommendations"
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

    <!-- 技术SEO状态 -->
    <div class="technical-seo mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('seo.technicalSEO') }}
      </h4>
      
      <div class="technical-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in technicalSEOItems"
          :key="item.key"
          class="technical-item"
        >
          <div class="technical-header flex items-center justify-between">
            <div class="technical-info flex items-center space-x-2">
              <component :is="item.icon" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span class="technical-title">{{ item.title }}</span>
            </div>
            <div :class="getStatusBadgeClasses(item.status)">
              {{ item.status ? t('seo.enabled') : t('seo.disabled') }}
            </div>
          </div>
          <div class="technical-description text-sm text-gray-600 dark:text-gray-400 mt-2">
            {{ item.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- 页面SEO详情 -->
    <div class="page-seo-details mb-6">
      <div class="details-header flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('seo.pageDetails') }}
        </h4>
        
        <div class="details-controls flex items-center space-x-2">
          <select v-model="selectedPage" class="page-select">
            <option value="">{{ t('seo.selectPage') }}</option>
            <option
              v-for="page in pageList"
              :key="page.path"
              :value="page.path"
            >
              {{ page.title || page.path }}
            </option>
          </select>
          
          <button
            @click="showPageSEOModal = true"
            class="edit-page-button"
          >
            <PencilIcon class="w-4 h-4 mr-2" />
            {{ t('seo.editPageSEO') }}
          </button>
        </div>
      </div>
      
      <div v-if="selectedPageData" class="page-seo-info">
        <div class="seo-preview bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="preview-title text-blue-600 dark:text-blue-400 text-lg font-medium mb-1">
            {{ selectedPageData.title }}
          </div>
          <div class="preview-url text-green-600 dark:text-green-400 text-sm mb-2">
            {{ selectedPageData.url || window.location.origin + selectedPage }}
          </div>
          <div class="preview-description text-gray-700 dark:text-gray-300 text-sm">
            {{ selectedPageData.description }}
          </div>
          
          <div class="seo-metrics mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="metric">
              <div class="metric-label text-xs text-gray-500 dark:text-gray-500">
                {{ t('seo.titleLength') }}
              </div>
              <div class="metric-value" :class="getTitleLengthClasses(selectedPageData.title.length)">
                {{ selectedPageData.title.length }}
              </div>
            </div>
            
            <div class="metric">
              <div class="metric-label text-xs text-gray-500 dark:text-gray-500">
                {{ t('seo.descriptionLength') }}
              </div>
              <div class="metric-value" :class="getDescriptionLengthClasses(selectedPageData.description.length)">
                {{ selectedPageData.description.length }}
              </div>
            </div>
            
            <div class="metric">
              <div class="metric-label text-xs text-gray-500 dark:text-gray-500">
                {{ t('seo.keywords') }}
              </div>
              <div class="metric-value">
                {{ selectedPageData.keywords?.length || 0 }}
              </div>
            </div>
            
            <div class="metric">
              <div class="metric-label text-xs text-gray-500 dark:text-gray-500">
                {{ t('seo.structuredData') }}
              </div>
              <div class="metric-value">
                {{ selectedPageData.calculatorData ? t('seo.yes') : t('seo.no') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions flex items-center justify-between">
      <div class="action-info">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('seo.lastUpdate') }}: {{ formatTimestamp(lastUpdate) }}
        </span>
      </div>
      
      <div class="main-actions flex items-center space-x-3">
        <button
          @click="generateSitemap"
          class="sitemap-button"
        >
          <MapIcon class="w-4 h-4 mr-2" />
          {{ t('seo.generateSitemap') }}
        </button>
        
        <button
          @click="exportSEOReport"
          class="export-button"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          {{ t('seo.exportReport') }}
        </button>
        
        <button
          @click="showConfigModal = true"
          class="config-button"
        >
          <Cog6ToothIcon class="w-4 h-4 mr-2" />
          {{ t('seo.configure') }}
        </button>
      </div>
    </div>

    <!-- 页面SEO编辑模态框 -->
    <PageSEOModal
      v-if="showPageSEOModal"
      :page-path="selectedPage"
      :page-data="selectedPageData"
      @close="showPageSEOModal = false"
      @update="handlePageSEOUpdate"
    />

    <!-- SEO配置模态框 -->
    <SEOConfigModal
      v-if="showConfigModal"
      @close="showConfigModal = false"
      @update="handleConfigUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  PencilIcon,
  MapIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  DocumentIcon,
  ShieldCheckIcon
} from '@heroicons/vue/24/outline'
import PageSEOModal from './PageSEOModal.vue'
import SEOConfigModal from './SEOConfigModal.vue'
import { useSEO } from '@/services/SEOManager'
import { useI18n } from '@/services/I18nService'
import { saveAs } from '../utils/file-saver-mock'
import type { PageSEOData, SEOConfig } from '@/services/SEOManager'

// Props
interface Props {
  showTitle?: boolean
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true
})

// 使用服务
const {
  stats,
  isEnabled,
  lastUpdate,
  getPageSEO,
  setPageSEO,
  generateSitemap,
  generateSEOReport,
  updateConfig,
  getConfig
} = useSEO()

const { t } = useI18n()

// 响应式状态
const showPageSEOModal = ref(false)
const showConfigModal = ref(false)
const selectedPage = ref('')
const seoIssues = ref<Array<{
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  pages?: string[]
  autoFixable: boolean
}>>([])
const seoRecommendations = ref<string[]>([])
const pageList = ref<Array<{ path: string; title: string }>>([])

// 计算属性
const containerClasses = computed(() => {
  const classes = ['seo-optimization-panel', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'p-6']
  
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
  return `${t('seo.optimizationPanel')}: ${stats.optimizedPages}/${stats.totalPages} ${t('seo.pagesOptimized')}`
})

const selectedPageData = computed(() => {
  return selectedPage.value ? getPageSEO(selectedPage.value) : null
})

const technicalSEOItems = computed(() => {
  const config = getConfig()
  
  return [
    {
      key: 'sitemap',
      title: t('seo.sitemap'),
      description: t('seo.sitemapDescription'),
      status: config.enableSitemap,
      icon: MapIcon
    },
    {
      key: 'robotsTxt',
      title: t('seo.robotsTxt'),
      description: t('seo.robotsTxtDescription'),
      status: config.enableRobotsTxt,
      icon: DocumentIcon
    },
    {
      key: 'structuredData',
      title: t('seo.structuredData'),
      description: t('seo.structuredDataDescription'),
      status: config.enableStructuredData,
      icon: CodeBracketIcon
    },
    {
      key: 'openGraph',
      title: t('seo.openGraph'),
      description: t('seo.openGraphDescription'),
      status: config.enableOpenGraph,
      icon: GlobeAltIcon
    },
    {
      key: 'twitterCards',
      title: t('seo.twitterCards'),
      description: t('seo.twitterCardsDescription'),
      status: config.enableTwitterCards,
      icon: ChatBubbleLeftRightIcon
    },
    {
      key: 'secureHeaders',
      title: t('seo.secureHeaders'),
      description: t('seo.secureHeadersDescription'),
      status: true, // 假设总是启用
      icon: ShieldCheckIcon
    }
  ]
})

// 方法
const getSEOStatusClasses = (): string[] => {
  const classes = ['w-2', 'h-2', 'rounded-full']
  const optimizationRate = getOptimizationRate()
  
  if (optimizationRate >= 80) {
    classes.push('bg-green-500')
  } else if (optimizationRate >= 60) {
    classes.push('bg-yellow-500')
  } else {
    classes.push('bg-red-500', 'animate-pulse')
  }
  
  return classes
}

const getSEOStatusText = (): string => {
  const optimizationRate = getOptimizationRate()
  
  if (optimizationRate >= 80) {
    return t('seo.statusExcellent')
  } else if (optimizationRate >= 60) {
    return t('seo.statusGood')
  } else {
    return t('seo.statusNeedsImprovement')
  }
}

const getOptimizationRate = (): number => {
  return stats.totalPages > 0 ? (stats.optimizedPages / stats.totalPages) * 100 : 0
}

const getTitleLengthClasses = (length?: number): string[] => {
  const titleLength = length !== undefined ? length : stats.averageTitleLength
  const classes = ['font-medium']
  
  if (titleLength < 30 || titleLength > 60) {
    classes.push('text-red-600', 'dark:text-red-400')
  } else if (titleLength < 40 || titleLength > 55) {
    classes.push('text-yellow-600', 'dark:text-yellow-400')
  } else {
    classes.push('text-green-600', 'dark:text-green-400')
  }
  
  return classes
}

const getDescriptionLengthClasses = (length?: number): string[] => {
  const descLength = length !== undefined ? length : stats.averageDescriptionLength
  const classes = ['font-medium']
  
  if (descLength < 120 || descLength > 160) {
    classes.push('text-red-600', 'dark:text-red-400')
  } else if (descLength < 140 || descLength > 155) {
    classes.push('text-yellow-600', 'dark:text-yellow-400')
  } else {
    classes.push('text-green-600', 'dark:text-green-400')
  }
  
  return classes
}

const getTitleLengthStatus = (): string => {
  const length = stats.averageTitleLength
  if (length < 30) return t('seo.tooShort')
  if (length > 60) return t('seo.tooLong')
  return t('seo.optimal')
}

const getDescriptionLengthStatus = (): string => {
  const length = stats.averageDescriptionLength
  if (length < 120) return t('seo.tooShort')
  if (length > 160) return t('seo.tooLong')
  return t('seo.optimal')
}

const getIssueItemClasses = (severity: string): string[] => {
  const classes = [
    'issue-item',
    'p-4',
    'border',
    'rounded-lg',
    'transition-colors',
    'duration-200'
  ]
  
  switch (severity) {
    case 'high':
      classes.push('border-red-300', 'bg-red-50', 'dark:border-red-800', 'dark:bg-red-900/20')
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

const getIssueSeverityClasses = (severity: string): string[] => {
  const classes = ['flex', 'items-center', 'justify-center', 'w-8', 'h-8', 'rounded-full']
  
  switch (severity) {
    case 'high':
      classes.push('bg-red-100', 'dark:bg-red-900', 'text-red-600', 'dark:text-red-400')
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
    case 'high': return ExclamationCircleIcon
    case 'medium': return ExclamationTriangleIcon
    case 'low': return InformationCircleIcon
    default: return InformationCircleIcon
  }
}

const getStatusBadgeClasses = (status: boolean): string[] => {
  const classes = ['px-2', 'py-1', 'text-xs', 'font-medium', 'rounded-full']
  
  if (status) {
    classes.push('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200')
  } else {
    classes.push('bg-red-100', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-200')
  }
  
  return classes
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const formatTimestamp = (date: Date): string => {
  return date.toLocaleString('de-DE')
}

const refreshSEOData = async (): Promise<void> => {
  // 刷新SEO数据和分析
  const report = generateSEOReport()
  seoRecommendations.value = report.recommendations
  
  // 生成SEO问题列表
  seoIssues.value = [
    ...(stats.missingTitles > 0 ? [{
      id: 'missing-titles',
      title: t('seo.missingTitles'),
      description: t('seo.missingTitlesDescription', { count: stats.missingTitles }),
      severity: 'high' as const,
      autoFixable: false
    }] : []),
    ...(stats.missingDescriptions > 0 ? [{
      id: 'missing-descriptions',
      title: t('seo.missingDescriptions'),
      description: t('seo.missingDescriptionsDescription', { count: stats.missingDescriptions }),
      severity: 'high' as const,
      autoFixable: false
    }] : []),
    ...(stats.averageTitleLength < 30 || stats.averageTitleLength > 60 ? [{
      id: 'title-length',
      title: t('seo.titleLengthIssue'),
      description: t('seo.titleLengthIssueDescription'),
      severity: 'medium' as const,
      autoFixable: false
    }] : [])
  ]
  
  // 更新页面列表
  pageList.value = [
    { path: '/', title: 'Startseite' },
    { path: '/calculator', title: 'Zinsrechner' },
    { path: '/about', title: 'Über uns' },
    { path: '/help', title: 'Hilfe' }
  ]
}

const fixIssue = (issue: any): void => {
  if (issue.autoFixable) {
    // 执行自动修复逻辑
    console.log('Auto-fixing issue:', issue.id)
  } else {
    // 显示详细信息或手动修复指南
    console.log('Manual fix required for:', issue.id)
  }
}

const generateSitemapFile = (): void => {
  const sitemap = generateSitemap()
  const blob = new Blob([sitemap], { type: 'application/xml' })
  saveAs(blob, 'sitemap.xml')
}

const exportSEOReport = (): void => {
  const report = generateSEOReport()
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const filename = `seo-report-${new Date().toISOString().slice(0, 10)}.json`
  saveAs(blob, filename)
}

const handlePageSEOUpdate = (path: string, data: PageSEOData): void => {
  setPageSEO(path, data)
  showPageSEOModal.value = false
  refreshSEOData()
}

const handleConfigUpdate = (newConfig: Partial<SEOConfig>): void => {
  updateConfig(newConfig)
  showConfigModal.value = false
  refreshSEOData()
}

// 生命周期
onMounted(() => {
  refreshSEOData()
})
</script>

<style scoped>
.seo-optimization-panel {
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

.stat-progress {
  @apply mt-2;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full transition-all duration-300;
}

.progress-text {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.technical-item {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
}

.technical-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.page-select {
  @apply px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.recommendation-item {
  @apply bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3;
}

.refresh-button,
.sitemap-button,
.export-button,
.config-button,
.edit-page-button,
.fix-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.refresh-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.sitemap-button {
  @apply text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500;
}

.export-button {
  @apply text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:ring-purple-500;
}

.config-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.edit-page-button {
  @apply text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500;
}

.fix-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .overview-grid {
    @apply grid-cols-1;
  }
  
  .technical-grid {
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
