<!--
  部署模态框组件
  提供部署环境选择和配置界面
-->

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框标题 -->
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t('deployment.deployApplication') }}
        </h3>
        <button
          @click="$emit('close')"
          class="close-button"
          :aria-label="t('common.close')"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-content">
        <form @submit.prevent="handleDeploy">
          <!-- 环境选择 -->
          <div class="environment-section mb-6">
            <h4 class="section-title">{{ t('deployment.selectEnvironment') }}</h4>
            
            <div class="environment-options grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                v-for="env in environments"
                :key="env.id"
                class="environment-option"
                :class="{ 'selected': selectedEnvironment === env.id }"
              >
                <input
                  v-model="selectedEnvironment"
                  type="radio"
                  :value="env.id"
                  class="environment-radio"
                />
                <div class="environment-content">
                  <component :is="env.icon" class="w-6 h-6 mb-2" :class="env.iconColor" />
                  <div class="environment-info">
                    <div class="environment-name">{{ env.name }}</div>
                    <div class="environment-description">{{ env.description }}</div>
                    <div class="environment-url">{{ env.url }}</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 部署配置 -->
          <div class="deployment-config mb-6">
            <h4 class="section-title">{{ t('deployment.configuration') }}</h4>
            
            <div class="config-options space-y-4">
              <label class="config-option">
                <input
                  v-model="deploymentOptions.enableMinification"
                  type="checkbox"
                  class="config-checkbox"
                />
                <div class="config-content">
                  <span class="config-title">{{ t('deployment.enableMinification') }}</span>
                  <span class="config-description">{{ t('deployment.minificationDescription') }}</span>
                </div>
              </label>
              
              <label class="config-option">
                <input
                  v-model="deploymentOptions.enableCompression"
                  type="checkbox"
                  class="config-checkbox"
                />
                <div class="config-content">
                  <span class="config-title">{{ t('deployment.enableCompression') }}</span>
                  <span class="config-description">{{ t('deployment.compressionDescription') }}</span>
                </div>
              </label>
              
              <label class="config-option">
                <input
                  v-model="deploymentOptions.enableSourceMaps"
                  type="checkbox"
                  class="config-checkbox"
                />
                <div class="config-content">
                  <span class="config-title">{{ t('deployment.enableSourceMaps') }}</span>
                  <span class="config-description">{{ t('deployment.sourceMapsDescription') }}</span>
                </div>
              </label>
              
              <label class="config-option">
                <input
                  v-model="deploymentOptions.enablePWA"
                  type="checkbox"
                  class="config-checkbox"
                />
                <div class="config-content">
                  <span class="config-title">{{ t('deployment.enablePWA') }}</span>
                  <span class="config-description">{{ t('deployment.pwaDescription') }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- 部署预检查 -->
          <div class="pre-deployment-checks mb-6">
            <h4 class="section-title">{{ t('deployment.preDeploymentChecks') }}</h4>
            
            <div class="checks-list space-y-3">
              <div
                v-for="check in preDeploymentChecks"
                :key="check.id"
                class="check-item"
                :class="getCheckItemClasses(check.status)"
              >
                <component :is="getCheckIcon(check.status)" :class="getCheckIconClasses(check.status)" />
                <div class="check-content">
                  <div class="check-name">{{ check.name }}</div>
                  <div class="check-description">{{ check.description }}</div>
                </div>
                <div class="check-status">
                  {{ getCheckStatusText(check.status) }}
                </div>
              </div>
            </div>
            
            <button
              v-if="!checksCompleted"
              @click="runPreDeploymentChecks"
              :disabled="isRunningChecks"
              type="button"
              class="run-checks-button mt-4"
            >
              <ArrowPathIcon v-if="isRunningChecks" class="w-4 h-4 mr-2 animate-spin" />
              <PlayIcon v-else class="w-4 h-4 mr-2" />
              {{ isRunningChecks ? t('deployment.runningChecks') : t('deployment.runChecks') }}
            </button>
          </div>

          <!-- 部署摘要 -->
          <div v-if="selectedEnvironment" class="deployment-summary mb-6">
            <h4 class="section-title">{{ t('deployment.summary') }}</h4>
            
            <div class="summary-content bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div class="summary-item">
                <span class="summary-label">{{ t('deployment.environment') }}:</span>
                <span class="summary-value">{{ getEnvironmentName(selectedEnvironment) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">{{ t('deployment.buildCommand') }}:</span>
                <span class="summary-value font-mono text-sm">{{ getBuildCommand() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">{{ t('deployment.outputDirectory') }}:</span>
                <span class="summary-value font-mono text-sm">{{ getOutputDirectory() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">{{ t('deployment.estimatedTime') }}:</span>
                <span class="summary-value">{{ getEstimatedTime() }}</span>
              </div>
            </div>
          </div>

          <!-- 部署进度 -->
          <div v-if="isDeploying" class="deployment-progress mb-6">
            <h4 class="section-title">{{ t('deployment.progress') }}</h4>
            
            <div class="progress-content">
              <div class="progress-header flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ currentDeploymentStep }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-500">
                  {{ formatPercentage(deploymentProgress) }}
                </span>
              </div>
              
              <div class="progress-bar">
                <div 
                  class="progress-fill bg-blue-500"
                  :style="{ width: `${deploymentProgress}%` }"
                ></div>
              </div>
              
              <div class="progress-steps mt-4">
                <div
                  v-for="(step, index) in deploymentSteps"
                  :key="step.id"
                  class="progress-step"
                  :class="getStepClasses(step.status)"
                >
                  <component :is="getStepIcon(step.status)" class="w-4 h-4" />
                  <span class="step-name">{{ step.name }}</span>
                  <span class="step-duration">{{ formatDuration(step.duration) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="modal-actions">
            <div class="action-info">
              <span v-if="!canDeploy" class="text-sm text-red-600 dark:text-red-400">
                {{ t('deployment.cannotDeploy') }}
              </span>
            </div>
            
            <div class="action-buttons">
              <button
                type="button"
                @click="$emit('close')"
                :disabled="isDeploying"
                class="cancel-button"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="!canDeploy || isDeploying"
                class="deploy-button"
              >
                <RocketLaunchIcon v-if="!isDeploying" class="w-4 h-4 mr-2" />
                <ArrowPathIcon v-else class="w-4 h-4 mr-2 animate-spin" />
                {{ isDeploying ? t('deployment.deploying') : t('deployment.deploy') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import {
  XMarkIcon,
  RocketLaunchIcon,
  ArrowPathIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CloudIcon,
  ServerIcon,
  GlobeAltIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'

// Emits
interface Emits {
  'close': []
  'deploy': [environment: 'staging' | 'production']
}

const emit = defineEmits<Emits>()

// 使用i18n
const { t } = useI18n()

// 响应式状态
const selectedEnvironment = ref<'staging' | 'production'>('staging')
const isRunningChecks = ref(false)
const checksCompleted = ref(false)
const isDeploying = ref(false)
const deploymentProgress = ref(0)
const currentDeploymentStep = ref('')

// 部署选项
const deploymentOptions = reactive({
  enableMinification: true,
  enableCompression: true,
  enableSourceMaps: false,
  enablePWA: true
})

// 环境配置
const environments = [
  {
    id: 'staging' as const,
    name: t('deployment.staging'),
    description: t('deployment.stagingDescription'),
    url: 'https://staging.zinses-rechner.de',
    icon: CloudIcon,
    iconColor: 'text-blue-500'
  },
  {
    id: 'production' as const,
    name: t('deployment.production'),
    description: t('deployment.productionDescription'),
    url: 'https://zinses-rechner.de',
    icon: GlobeAltIcon,
    iconColor: 'text-green-500'
  }
]

// 预部署检查
const preDeploymentChecks = ref([
  {
    id: 'tests',
    name: t('deployment.testsCheck'),
    description: t('deployment.testsCheckDescription'),
    status: 'pending' as 'pending' | 'running' | 'passed' | 'failed'
  },
  {
    id: 'build',
    name: t('deployment.buildCheck'),
    description: t('deployment.buildCheckDescription'),
    status: 'pending' as 'pending' | 'running' | 'passed' | 'failed'
  },
  {
    id: 'security',
    name: t('deployment.securityCheck'),
    description: t('deployment.securityCheckDescription'),
    status: 'pending' as 'pending' | 'running' | 'passed' | 'failed'
  },
  {
    id: 'performance',
    name: t('deployment.performanceCheck'),
    description: t('deployment.performanceCheckDescription'),
    status: 'pending' as 'pending' | 'running' | 'passed' | 'failed'
  }
])

// 部署步骤
const deploymentSteps = ref([
  {
    id: 'build',
    name: t('deployment.buildStep'),
    status: 'pending' as 'pending' | 'running' | 'completed' | 'failed',
    duration: 0
  },
  {
    id: 'test',
    name: t('deployment.testStep'),
    status: 'pending' as 'pending' | 'running' | 'completed' | 'failed',
    duration: 0
  },
  {
    id: 'upload',
    name: t('deployment.uploadStep'),
    status: 'pending' as 'pending' | 'running' | 'completed' | 'failed',
    duration: 0
  },
  {
    id: 'deploy',
    name: t('deployment.deployStep'),
    status: 'pending' as 'pending' | 'running' | 'completed' | 'failed',
    duration: 0
  },
  {
    id: 'verify',
    name: t('deployment.verifyStep'),
    status: 'pending' as 'pending' | 'running' | 'completed' | 'failed',
    duration: 0
  }
])

// 计算属性
const canDeploy = computed(() => {
  return checksCompleted.value && 
         preDeploymentChecks.value.every(check => check.status === 'passed') &&
         selectedEnvironment.value &&
         !isDeploying.value
})

// 方法
const getCheckItemClasses = (status: string): string[] => {
  const classes = ['check-item', 'flex', 'items-center', 'space-x-3', 'p-3', 'rounded-lg', 'border']
  
  switch (status) {
    case 'passed':
      classes.push('border-green-200', 'bg-green-50', 'dark:border-green-800', 'dark:bg-green-900/20')
      break
    case 'failed':
      classes.push('border-red-200', 'bg-red-50', 'dark:border-red-800', 'dark:bg-red-900/20')
      break
    case 'running':
      classes.push('border-blue-200', 'bg-blue-50', 'dark:border-blue-800', 'dark:bg-blue-900/20')
      break
    default:
      classes.push('border-gray-200', 'bg-gray-50', 'dark:border-gray-700', 'dark:bg-gray-800')
  }
  
  return classes
}

const getCheckIcon = (status: string) => {
  switch (status) {
    case 'passed': return CheckCircleIcon
    case 'failed': return XCircleIcon
    case 'running': return ArrowPathIcon
    default: return ClockIcon
  }
}

const getCheckIconClasses = (status: string): string[] => {
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

const getCheckStatusText = (status: string): string => {
  switch (status) {
    case 'passed': return t('deployment.passed')
    case 'failed': return t('deployment.failed')
    case 'running': return t('deployment.running')
    default: return t('deployment.pending')
  }
}

const getStepClasses = (status: string): string[] => {
  const classes = ['progress-step', 'flex', 'items-center', 'space-x-2', 'text-sm']
  
  switch (status) {
    case 'completed':
      classes.push('text-green-600', 'dark:text-green-400')
      break
    case 'running':
      classes.push('text-blue-600', 'dark:text-blue-400')
      break
    case 'failed':
      classes.push('text-red-600', 'dark:text-red-400')
      break
    default:
      classes.push('text-gray-500', 'dark:text-gray-500')
  }
  
  return classes
}

const getStepIcon = (status: string) => {
  switch (status) {
    case 'completed': return CheckCircleIcon
    case 'running': return ArrowPathIcon
    case 'failed': return XCircleIcon
    default: return ClockIcon
  }
}

const getEnvironmentName = (envId: string): string => {
  const env = environments.find(e => e.id === envId)
  return env ? env.name : envId
}

const getBuildCommand = (): string => {
  const commands = {
    staging: 'npm run build:staging',
    production: 'npm run build:production'
  }
  return commands[selectedEnvironment.value]
}

const getOutputDirectory = (): string => {
  return selectedEnvironment.value === 'production' ? 'dist/production' : 'dist/staging'
}

const getEstimatedTime = (): string => {
  return selectedEnvironment.value === 'production' ? '8-12 Minuten' : '5-8 Minuten'
}

const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`
}

const formatDuration = (ms: number): string => {
  if (ms === 0) return ''
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const runPreDeploymentChecks = async (): Promise<void> => {
  isRunningChecks.value = true
  
  try {
    for (const check of preDeploymentChecks.value) {
      check.status = 'running'
      
      // 模拟检查过程
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
      
      // 模拟检查结果（90%成功率）
      check.status = Math.random() > 0.1 ? 'passed' : 'failed'
    }
    
    checksCompleted.value = true
  } catch (error) {
    console.error('Pre-deployment checks failed:', error)
  } finally {
    isRunningChecks.value = false
  }
}

const handleDeploy = async (): Promise<void> => {
  if (!canDeploy.value) return
  
  isDeploying.value = true
  deploymentProgress.value = 0
  
  try {
    for (let i = 0; i < deploymentSteps.value.length; i++) {
      const step = deploymentSteps.value[i]
      step.status = 'running'
      currentDeploymentStep.value = step.name
      
      const startTime = Date.now()
      
      // 模拟部署步骤
      const stepDuration = Math.random() * 3000 + 2000
      await new Promise(resolve => setTimeout(resolve, stepDuration))
      
      step.duration = Date.now() - startTime
      step.status = 'completed'
      
      deploymentProgress.value = ((i + 1) / deploymentSteps.value.length) * 100
    }
    
    currentDeploymentStep.value = t('deployment.completed')
    
    // 触发部署完成事件
    emit('deploy', selectedEnvironment.value)
    
  } catch (error) {
    console.error('Deployment failed:', error)
    
    // 标记当前步骤为失败
    const currentStep = deploymentSteps.value.find(s => s.status === 'running')
    if (currentStep) {
      currentStep.status = 'failed'
    }
  } finally {
    setTimeout(() => {
      isDeploying.value = false
    }, 2000)
  }
}

const handleOverlayClick = (): void => {
  if (!isDeploying.value) {
    emit('close')
  }
}

// 生命周期
onMounted(() => {
  // 可以在这里加载部署配置
})
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors duration-200;
}

.modal-content {
  @apply p-6;
}

.section-title {
  @apply text-md font-medium text-gray-900 dark:text-white mb-4;
}

.environment-option {
  @apply relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600;
}

.environment-option.selected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.environment-radio {
  @apply absolute top-3 right-3 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2;
}

.environment-content {
  @apply flex flex-col items-center text-center;
}

.environment-name {
  @apply font-semibold text-gray-900 dark:text-white;
}

.environment-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.environment-url {
  @apply text-xs text-blue-600 dark:text-blue-400 mt-2 font-mono;
}

.config-option {
  @apply flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200;
}

.config-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5;
}

.config-content {
  @apply flex-1;
}

.config-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.config-description {
  @apply block text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.check-content {
  @apply flex-1;
}

.check-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.check-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.check-status {
  @apply text-sm font-medium;
}

.summary-item {
  @apply flex items-center justify-between py-2;
}

.summary-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.summary-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.progress-bar {
  @apply w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full transition-all duration-300;
}

.step-name {
  @apply flex-1;
}

.step-duration {
  @apply text-xs;
}

.run-checks-button {
  @apply flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.modal-actions {
  @apply flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700;
}

.action-buttons {
  @apply flex items-center space-x-3;
}

.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

.deploy-button {
  @apply flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .modal-container {
    @apply max-w-full m-2;
  }
  
  .environment-options {
    @apply grid-cols-1;
  }
  
  .modal-actions {
    @apply flex-col space-y-3;
  }
  
  .action-buttons {
    @apply w-full justify-between;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .modal-container {
  @apply border-2 border-current;
}

/* 动画 */
.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  animation: slideIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
