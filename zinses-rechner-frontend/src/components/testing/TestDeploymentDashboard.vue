<!--
  测试和部署仪表板组件
  提供完整的测试执行和部署管理界面
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 仪表板标题 -->
    <div class="dashboard-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('testing.dashboard') }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('testing.dashboardDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-3">
          <div class="status-indicator flex items-center space-x-2">
            <div :class="getOverallStatusClasses()"></div>
            <span class="text-sm font-medium" :class="getOverallStatusTextClasses()">
              {{ getOverallStatusText() }}
            </span>
          </div>
          
          <button
            @click="runAllTests"
            :disabled="isRunning"
            class="run-tests-button"
          >
            <PlayIcon v-if="!isRunning" class="w-4 h-4 mr-2" />
            <ArrowPathIcon v-else class="w-4 h-4 mr-2 animate-spin" />
            {{ isRunning ? t('testing.running') : t('testing.runAllTests') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 测试概览 -->
    <div class="test-overview mb-8">
      <div class="overview-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- 总体统计 -->
        <div class="stat-card">
          <div class="stat-header">
            <BeakerIcon class="w-6 h-6 text-blue-500" />
            <span class="stat-title">{{ t('testing.totalTests') }}</span>
          </div>
          <div class="stat-value">{{ stats.totalTests }}</div>
          <div class="stat-meta">
            {{ stats.totalSuites }} {{ t('testing.testSuites') }}
          </div>
        </div>
        
        <!-- 成功率 -->
        <div class="stat-card">
          <div class="stat-header">
            <CheckCircleIcon class="w-6 h-6 text-green-500" />
            <span class="stat-title">{{ t('testing.successRate') }}</span>
          </div>
          <div class="stat-value" :class="getSuccessRateClasses()">
            {{ formatPercentage(stats.successRate) }}
          </div>
          <div class="stat-meta">
            {{ stats.passedTests }}/{{ stats.totalTests }} {{ t('testing.passed') }}
          </div>
        </div>
        
        <!-- 代码覆盖率 -->
        <div class="stat-card">
          <div class="stat-header">
            <ShieldCheckIcon class="w-6 h-6 text-purple-500" />
            <span class="stat-title">{{ t('testing.coverage') }}</span>
          </div>
          <div class="stat-value" :class="getCoverageClasses()">
            {{ formatPercentage(stats.coverage) }}
          </div>
          <div class="coverage-bar">
            <div 
              class="coverage-fill"
              :class="getCoverageFillClasses()"
              :style="{ width: `${stats.coverage}%` }"
            ></div>
          </div>
        </div>
        
        <!-- 执行时间 -->
        <div class="stat-card">
          <div class="stat-header">
            <ClockIcon class="w-6 h-6 text-orange-500" />
            <span class="stat-title">{{ t('testing.duration') }}</span>
          </div>
          <div class="stat-value">
            {{ formatDuration(stats.totalDuration) }}
          </div>
          <div class="stat-meta">
            {{ t('testing.lastRun') }}: {{ formatLastRun() }}
          </div>
        </div>
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="isRunning" class="test-progress mb-8">
      <div class="progress-header flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ currentSuite ? t('testing.runningSuite', { suite: currentSuite }) : t('testing.initializing') }}
        </span>
        <span class="text-sm text-gray-500 dark:text-gray-500">
          {{ formatPercentage(progress) }}
        </span>
      </div>
      
      <div class="progress-bar">
        <div 
          class="progress-fill bg-blue-500"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      
      <div v-if="currentTest" class="current-test mt-2">
        <span class="text-xs text-gray-600 dark:text-gray-400">
          {{ t('testing.currentTest') }}: {{ currentTest }}
        </span>
      </div>
    </div>

    <!-- 测试套件 -->
    <div class="test-suites mb-8">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {{ t('testing.testSuites') }}
      </h3>
      
      <div class="suites-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          v-for="suite in testSuites"
          :key="suite.id"
          class="suite-card"
          :class="getSuiteCardClasses(suite.status)"
        >
          <div class="suite-header flex items-center justify-between">
            <div class="suite-info flex items-center space-x-3">
              <component :is="getSuiteIcon(suite.type)" :class="getSuiteIconClasses(suite.status)" />
              <div>
                <h4 class="suite-name">{{ suite.name }}</h4>
                <p class="suite-description">{{ suite.description }}</p>
              </div>
            </div>
            
            <div class="suite-status">
              <component :is="getStatusIcon(suite.status)" :class="getStatusIconClasses(suite.status)" />
            </div>
          </div>
          
          <div class="suite-stats grid grid-cols-3 gap-4 mt-4">
            <div class="suite-stat">
              <div class="stat-number text-green-600 dark:text-green-400">{{ suite.passedTests }}</div>
              <div class="stat-label">{{ t('testing.passed') }}</div>
            </div>
            <div class="suite-stat">
              <div class="stat-number text-red-600 dark:text-red-400">{{ suite.failedTests }}</div>
              <div class="stat-label">{{ t('testing.failed') }}</div>
            </div>
            <div class="suite-stat">
              <div class="stat-number text-gray-600 dark:text-gray-400">{{ suite.skippedTests }}</div>
              <div class="stat-label">{{ t('testing.skipped') }}</div>
            </div>
          </div>
          
          <div class="suite-progress mt-3">
            <div class="progress-bar h-2">
              <div 
                class="progress-fill bg-green-500"
                :style="{ width: `${getSuiteProgress(suite)}%` }"
              ></div>
            </div>
          </div>
          
          <div class="suite-actions mt-4 flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-500">
              {{ formatDuration(suite.duration) }}
            </span>
            
            <button
              @click="runSuite(suite)"
              :disabled="isRunning"
              class="run-suite-button"
            >
              <PlayIcon class="w-3 h-3 mr-1" />
              {{ t('testing.runSuite') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 部署准备 -->
    <div class="deployment-section">
      <div class="section-header flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('deployment.title') }}
        </h3>
        
        <div class="deployment-actions flex items-center space-x-3">
          <button
            @click="generateReport"
            class="generate-report-button"
          >
            <DocumentTextIcon class="w-4 h-4 mr-2" />
            {{ t('testing.generateReport') }}
          </button>
          
          <button
            @click="showDeploymentModal = true"
            :disabled="!deploymentReadiness.ready"
            class="deploy-button"
            :class="{ 'ready': deploymentReadiness.ready }"
          >
            <RocketLaunchIcon class="w-4 h-4 mr-2" />
            {{ t('deployment.deploy') }}
          </button>
        </div>
      </div>
      
      <!-- 部署准备状态 -->
      <div class="deployment-readiness">
        <div class="readiness-header flex items-center space-x-3 mb-4">
          <component 
            :is="deploymentReadiness.ready ? CheckCircleIcon : ExclamationTriangleIcon" 
            :class="deploymentReadiness.ready ? 'w-6 h-6 text-green-500' : 'w-6 h-6 text-yellow-500'"
          />
          <span class="text-lg font-medium" :class="deploymentReadiness.ready ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'">
            {{ deploymentReadiness.ready ? t('deployment.ready') : t('deployment.notReady') }}
          </span>
        </div>
        
        <!-- 阻塞问题 -->
        <div v-if="deploymentReadiness.blockers.length > 0" class="blockers mb-4">
          <h4 class="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
            {{ t('deployment.blockers') }}
          </h4>
          <ul class="blocker-list space-y-1">
            <li
              v-for="blocker in deploymentReadiness.blockers"
              :key="blocker"
              class="blocker-item"
            >
              <XCircleIcon class="w-4 h-4 text-red-500 mr-2" />
              {{ blocker }}
            </li>
          </ul>
        </div>
        
        <!-- 警告 -->
        <div v-if="deploymentReadiness.warnings.length > 0" class="warnings">
          <h4 class="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">
            {{ t('deployment.warnings') }}
          </h4>
          <ul class="warning-list space-y-1">
            <li
              v-for="warning in deploymentReadiness.warnings"
              :key="warning"
              class="warning-item"
            >
              <ExclamationTriangleIcon class="w-4 h-4 text-yellow-500 mr-2" />
              {{ warning }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 部署模态框 -->
    <DeploymentModal
      v-if="showDeploymentModal"
      @close="showDeploymentModal = false"
      @deploy="handleDeploy"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  PlayIcon,
  ArrowPathIcon,
  BeakerIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CubeIcon,
  LinkIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  EyeIcon,
  ShieldExclamationIcon,
  GlobeAltIcon
} from '@heroicons/vue/24/outline'
import DeploymentModal from './DeploymentModal.vue'
import { useIntegrationTest } from '@/services/IntegrationTestManager'
import { useI18n } from '@/services/I18nService'
import { saveAs } from '../utils/file-saver-mock'
import type { TestSuite, TestStatus, TestType } from '@/services/IntegrationTestManager'

// Props
interface Props {
  autoRun?: boolean
  showDeployment?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRun: false,
  showDeployment: true
})

// 使用服务
const {
  stats,
  isRunning,
  currentSuite,
  currentTest,
  progress,
  runAllTests,
  runTestSuite,
  generateTestReport,
  prepareDeployment
} = useIntegrationTest()

const { t } = useI18n()

// 响应式状态
const showDeploymentModal = ref(false)
const testSuites = ref<TestSuite[]>([])
const deploymentReadiness = ref({
  ready: false,
  blockers: [] as string[],
  warnings: [] as string[]
})

// 测试套件图标映射
const suiteIcons = {
  unit: CubeIcon,
  integration: LinkIcon,
  e2e: DevicePhoneMobileIcon,
  performance: ChartBarIcon,
  accessibility: EyeIcon,
  security: ShieldExclamationIcon,
  compatibility: GlobeAltIcon
}

// 计算属性
const containerClasses = computed(() => [
  'test-deployment-dashboard',
  'bg-white',
  'dark:bg-gray-900',
  'rounded-lg',
  'p-6',
  'max-w-7xl',
  'mx-auto'
])

const ariaLabel = computed(() => {
  return `${t('testing.dashboard')}: ${stats.passedTests}/${stats.totalTests} ${t('testing.testsPassed')}`
})

// 方法
const getOverallStatusClasses = (): string[] => {
  const classes = ['w-3', 'h-3', 'rounded-full']
  
  if (isRunning.value) {
    classes.push('bg-blue-500', 'animate-pulse')
  } else if (stats.successRate >= 95) {
    classes.push('bg-green-500')
  } else if (stats.successRate >= 80) {
    classes.push('bg-yellow-500')
  } else {
    classes.push('bg-red-500')
  }
  
  return classes
}

const getOverallStatusTextClasses = (): string[] => {
  if (isRunning.value) {
    return ['text-blue-700', 'dark:text-blue-400']
  } else if (stats.successRate >= 95) {
    return ['text-green-700', 'dark:text-green-400']
  } else if (stats.successRate >= 80) {
    return ['text-yellow-700', 'dark:text-yellow-400']
  } else {
    return ['text-red-700', 'dark:text-red-400']
  }
}

const getOverallStatusText = (): string => {
  if (isRunning.value) {
    return t('testing.running')
  } else if (stats.successRate >= 95) {
    return t('testing.excellent')
  } else if (stats.successRate >= 80) {
    return t('testing.good')
  } else {
    return t('testing.needsAttention')
  }
}

const getSuccessRateClasses = (): string[] => {
  const classes = ['text-2xl', 'font-bold']
  
  if (stats.successRate >= 95) {
    classes.push('text-green-600', 'dark:text-green-400')
  } else if (stats.successRate >= 80) {
    classes.push('text-yellow-600', 'dark:text-yellow-400')
  } else {
    classes.push('text-red-600', 'dark:text-red-400')
  }
  
  return classes
}

const getCoverageClasses = (): string[] => {
  const classes = ['text-2xl', 'font-bold']
  
  if (stats.coverage >= 90) {
    classes.push('text-green-600', 'dark:text-green-400')
  } else if (stats.coverage >= 70) {
    classes.push('text-yellow-600', 'dark:text-yellow-400')
  } else {
    classes.push('text-red-600', 'dark:text-red-400')
  }
  
  return classes
}

const getCoverageFillClasses = (): string[] => {
  const classes = ['h-full', 'transition-all', 'duration-300']
  
  if (stats.coverage >= 90) {
    classes.push('bg-green-500')
  } else if (stats.coverage >= 70) {
    classes.push('bg-yellow-500')
  } else {
    classes.push('bg-red-500')
  }
  
  return classes
}

const getSuiteIcon = (type: TestType) => {
  return suiteIcons[type] || CubeIcon
}

const getSuiteIconClasses = (status: TestStatus): string[] => {
  const classes = ['w-5', 'h-5']
  
  switch (status) {
    case 'passed':
      classes.push('text-green-500')
      break
    case 'failed':
      classes.push('text-red-500')
      break
    case 'running':
      classes.push('text-blue-500', 'animate-pulse')
      break
    case 'skipped':
      classes.push('text-gray-400')
      break
    default:
      classes.push('text-gray-500')
  }
  
  return classes
}

const getSuiteCardClasses = (status: TestStatus): string[] => {
  const classes = [
    'suite-card',
    'bg-white',
    'dark:bg-gray-800',
    'rounded-lg',
    'p-4',
    'border',
    'transition-all',
    'duration-200'
  ]
  
  switch (status) {
    case 'passed':
      classes.push('border-green-200', 'dark:border-green-800')
      break
    case 'failed':
      classes.push('border-red-200', 'dark:border-red-800')
      break
    case 'running':
      classes.push('border-blue-200', 'dark:border-blue-800', 'shadow-lg')
      break
    default:
      classes.push('border-gray-200', 'dark:border-gray-700')
  }
  
  return classes
}

const getStatusIcon = (status: TestStatus) => {
  switch (status) {
    case 'passed': return CheckCircleIcon
    case 'failed': return XCircleIcon
    case 'running': return ArrowPathIcon
    default: return ClockIcon
  }
}

const getStatusIconClasses = (status: TestStatus): string[] => {
  const classes = ['w-5', 'h-5']
  
  switch (status) {
    case 'passed':
      classes.push('text-green-500')
      break
    case 'failed':
      classes.push('text-red-500')
      break
    case 'running':
      classes.push('text-blue-500', 'animate-spin')
      break
    default:
      classes.push('text-gray-400')
  }
  
  return classes
}

const getSuiteProgress = (suite: TestSuite): number => {
  return suite.totalTests > 0 ? (suite.passedTests / suite.totalTests) * 100 : 0
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

const formatLastRun = (): string => {
  if (!stats.lastRunTime) return t('testing.never')
  
  const now = new Date()
  const diff = now.getTime() - stats.lastRunTime.getTime()
  
  if (diff < 60000) return t('testing.justNow')
  if (diff < 3600000) return t('testing.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('testing.hoursAgo', { count: Math.floor(diff / 3600000) })
  
  return stats.lastRunTime.toLocaleDateString('de-DE')
}

const runSuite = async (suite: TestSuite): Promise<void> => {
  try {
    await runTestSuite(suite)
    updateDeploymentReadiness()
  } catch (error) {
    console.error('Suite execution failed:', error)
  }
}

const generateReport = (): void => {
  const report = generateTestReport()
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const filename = `test-report-${new Date().toISOString().slice(0, 10)}.json`
  saveAs(blob, filename)
}

const handleDeploy = async (environment: 'staging' | 'production'): Promise<void> => {
  try {
    const result = await prepareDeployment(environment)
    
    if (result.success) {
      console.log('Deployment prepared successfully:', result)
    } else {
      console.error('Deployment preparation failed:', result.errors)
    }
    
    showDeploymentModal.value = false
  } catch (error) {
    console.error('Deployment failed:', error)
  }
}

const updateDeploymentReadiness = (): void => {
  const report = generateTestReport()
  deploymentReadiness.value = report.deployment
}

// 生命周期
onMounted(async () => {
  if (props.autoRun) {
    await runAllTests()
  }
  
  updateDeploymentReadiness()
})
</script>

<style scoped>
.test-deployment-dashboard {
  @apply min-h-screen;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm;
}

.stat-header {
  @apply flex items-center space-x-3 mb-3;
}

.stat-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.stat-value {
  @apply text-3xl font-bold text-gray-900 dark:text-white mb-2;
}

.stat-meta {
  @apply text-sm text-gray-500 dark:text-gray-500;
}

.coverage-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2;
}

.progress-bar {
  @apply w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full transition-all duration-300;
}

.suite-name {
  @apply text-sm font-semibold text-gray-900 dark:text-white;
}

.suite-description {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.suite-stat {
  @apply text-center;
}

.stat-number {
  @apply text-lg font-bold;
}

.stat-label {
  @apply text-xs text-gray-500 dark:text-gray-500;
}

.run-tests-button,
.run-suite-button,
.generate-report-button,
.deploy-button {
  @apply flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.run-tests-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:ring-blue-500;
}

.run-suite-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500 text-xs px-2 py-1;
}

.generate-report-button {
  @apply text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500;
}

.deploy-button {
  @apply text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-gray-500;
}

.deploy-button.ready {
  @apply text-white bg-green-600 hover:bg-green-700 focus:ring-green-500;
}

.blocker-item,
.warning-item {
  @apply flex items-center text-sm;
}

.blocker-item {
  @apply text-red-700 dark:text-red-400;
}

.warning-item {
  @apply text-yellow-700 dark:text-yellow-400;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .overview-grid {
    @apply grid-cols-1;
  }
  
  .suites-grid {
    @apply grid-cols-1;
  }
  
  .dashboard-header .header-content {
    @apply flex-col space-y-4;
  }
  
  .section-header {
    @apply flex-col space-y-3;
  }
  
  .deployment-actions {
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

/* 动画 */
.suite-card.border-blue-200 {
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
  }
}

/* 打印样式 */
@media print {
  .header-actions,
  .deployment-actions,
  .suite-actions {
    @apply hidden;
  }
}
</style>
