<!--
  批量导出面板组件
  提供批量导出的用户界面，包括队列管理、进度监控、错误处理
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('export.batchExport') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('export.batchExportDescription') }}
          </p>
        </div>
        
        <div class="action-buttons flex items-center space-x-2">
          <button
            v-if="!exportStatus.isRunning"
            @click="clearAllItems"
            :disabled="allItems.pending.length === 0 && allItems.completed.length === 0"
            class="clear-button"
          >
            <TrashIcon class="w-4 h-4 mr-2" />
            {{ t('export.clearAll') }}
          </button>
          
          <button
            v-if="exportStatus.isRunning && !exportStatus.isPaused"
            @click="pauseExport"
            class="pause-button"
          >
            <PauseIcon class="w-4 h-4 mr-2" />
            {{ t('export.pause') }}
          </button>
          
          <button
            v-else-if="exportStatus.isRunning && exportStatus.isPaused"
            @click="resumeExport"
            class="resume-button"
          >
            <PlayIcon class="w-4 h-4 mr-2" />
            {{ t('export.resume') }}
          </button>
          
          <button
            v-if="exportStatus.isRunning"
            @click="cancelExport"
            class="cancel-button"
          >
            <XMarkIcon class="w-4 h-4 mr-2" />
            {{ t('export.cancel') }}
          </button>
          
          <button
            v-else
            @click="startExport"
            :disabled="allItems.pending.length === 0"
            class="start-button"
          >
            <PlayIcon class="w-4 h-4 mr-2" />
            {{ t('export.startExport') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 导出统计 -->
    <div class="export-stats grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card">
        <div class="stat-icon">
          <ClockIcon class="w-6 h-6 text-blue-500" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ allItems.pending.length }}</div>
          <div class="stat-label">{{ t('export.pending') }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <ArrowPathIcon class="w-6 h-6 text-yellow-500" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ allItems.active.length }}</div>
          <div class="stat-label">{{ t('export.processing') }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <CheckCircleIcon class="w-6 h-6 text-green-500" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ completedCount }}</div>
          <div class="stat-label">{{ t('export.completed') }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <ExclamationTriangleIcon class="w-6 h-6 text-red-500" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ failedCount }}</div>
          <div class="stat-label">{{ t('export.failed') }}</div>
        </div>
      </div>
    </div>

    <!-- 整体进度 -->
    <div v-if="exportStatus.isRunning || progress.totalItems > 0" class="overall-progress mb-6">
      <div class="progress-header flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('export.overallProgress') }}
        </span>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ Math.round(progress.overallProgress) }}%
        </span>
      </div>
      
      <ProgressBar
        :value="progress.overallProgress"
        :max="100"
        size="md"
        color="blue"
        :striped="exportStatus.isRunning"
        :animated="exportStatus.isRunning"
      />
      
      <div class="progress-details flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>
          {{ progress.completedItems }} / {{ progress.totalItems }} {{ t('export.items') }}
        </span>
        <span v-if="progress.estimatedTimeRemaining">
          {{ t('export.estimatedTime') }}: {{ formatDuration(progress.estimatedTimeRemaining) }}
        </span>
      </div>
    </div>

    <!-- 导出队列 -->
    <div class="export-queue">
      <div class="queue-header flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('export.exportQueue') }}
        </h4>
        
        <div class="queue-controls flex items-center space-x-2">
          <select v-model="filterStatus" class="status-filter">
            <option value="">{{ t('export.allItems') }}</option>
            <option value="pending">{{ t('export.pending') }}</option>
            <option value="processing">{{ t('export.processing') }}</option>
            <option value="completed">{{ t('export.completed') }}</option>
            <option value="failed">{{ t('export.failed') }}</option>
          </select>
          
          <button
            v-if="failedCount > 0"
            @click="retryFailedItems"
            :disabled="exportStatus.isRunning"
            class="retry-button"
          >
            <ArrowPathIcon class="w-4 h-4 mr-1" />
            {{ t('export.retryFailed') }}
          </button>
        </div>
      </div>

      <!-- 队列项列表 -->
      <div class="queue-items space-y-3">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          :class="getItemClasses(item)"
        >
          <!-- 项目头部 -->
          <div class="item-header flex items-center justify-between">
            <div class="item-info flex items-center space-x-3">
              <div :class="getStatusIconClasses(item.status)">
                <component :is="getStatusIcon(item.status)" class="w-5 h-5" />
              </div>
              
              <div class="item-details">
                <h5 class="item-name font-medium text-gray-900 dark:text-white">
                  {{ item.name }}
                </h5>
                <p class="item-meta text-sm text-gray-600 dark:text-gray-400">
                  {{ getItemTypeLabel(item.type) }} • {{ item.format.toUpperCase() }}
                  <span v-if="item.result?.size" class="ml-2">
                    • {{ formatFileSize(item.result.size) }}
                  </span>
                </p>
              </div>
            </div>
            
            <div class="item-actions flex items-center space-x-2">
              <button
                v-if="item.status === 'pending'"
                @click="removeItem(item.id)"
                :disabled="exportStatus.isRunning"
                class="remove-button"
                :aria-label="`${t('export.remove')} ${item.name}`"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
              
              <button
                v-if="item.status === 'failed'"
                @click="retryItem(item.id)"
                :disabled="exportStatus.isRunning"
                class="retry-item-button"
                :aria-label="`${t('export.retry')} ${item.name}`"
              >
                <ArrowPathIcon class="w-4 h-4" />
              </button>
              
              <button
                v-if="item.status === 'completed' && item.result?.blob"
                @click="downloadItem(item)"
                class="download-button"
                :aria-label="`${t('export.download')} ${item.name}`"
              >
                <ArrowDownTrayIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- 进度条 -->
          <div v-if="item.status === 'processing'" class="item-progress mt-3">
            <ProgressBar
              :value="item.progress"
              :max="100"
              size="sm"
              color="blue"
              :striped="true"
              :animated="true"
            />
          </div>

          <!-- 错误信息 -->
          <div v-if="item.status === 'failed' && item.error" class="item-error mt-3">
            <div class="error-content p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <div class="error-header flex items-center mb-1">
                <ExclamationTriangleIcon class="w-4 h-4 text-red-500 mr-2" />
                <span class="text-sm font-medium text-red-800 dark:text-red-200">
                  {{ t('export.exportFailed') }}
                </span>
              </div>
              <p class="text-sm text-red-700 dark:text-red-300">
                {{ item.error }}
              </p>
            </div>
          </div>

          <!-- 完成信息 -->
          <div v-if="item.status === 'completed'" class="item-success mt-3">
            <div class="success-content text-sm text-gray-600 dark:text-gray-400">
              <span v-if="item.startTime && item.endTime">
                {{ t('export.completedIn') }}: {{ formatDuration((item.endTime.getTime() - item.startTime.getTime()) / 1000) }}
              </span>
              <span v-if="item.result?.size" class="ml-4">
                {{ t('export.fileSize') }}: {{ formatFileSize(item.result.size) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredItems.length === 0" class="empty-state text-center py-8">
          <DocumentIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ filterStatus ? t('export.noItemsWithStatus') : t('export.noItemsInQueue') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {{ filterStatus ? t('export.changeFilterToSeeItems') : t('export.addItemsToQueue') }}
          </p>
        </div>
      </div>
    </div>

    <!-- 导出配置 -->
    <div v-if="showConfig" class="export-config mt-8">
      <div class="config-header flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('export.exportSettings') }}
        </h4>
        <button
          @click="showConfig = false"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
      
      <div class="config-content bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div class="config-options grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="config-option">
            <label class="config-label">{{ t('export.outputFormat') }}</label>
            <select v-model="batchConfig.outputFormat" class="config-select">
              <option value="zip">ZIP {{ t('export.archive') }}</option>
              <option value="folder">{{ t('export.separateFiles') }}</option>
            </select>
          </div>
          
          <div class="config-option">
            <label class="config-label">{{ t('export.maxConcurrent') }}</label>
            <input
              v-model.number="batchConfig.maxConcurrent"
              type="number"
              min="1"
              max="10"
              class="config-input"
            />
          </div>
          
          <div class="config-option">
            <label class="config-label">{{ t('export.filenamePattern') }}</label>
            <input
              v-model="batchConfig.filenamePattern"
              type="text"
              class="config-input"
              placeholder="{name}_{timestamp}"
            />
          </div>
          
          <div class="config-option">
            <label class="checkbox-label">
              <input
                v-model="batchConfig.includeManifest"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">{{ t('export.includeManifest') }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions mt-8 flex items-center justify-between">
      <div class="action-info">
        <button
          v-if="!showConfig"
          @click="showConfig = true"
          class="config-toggle-button"
        >
          <CogIcon class="w-4 h-4 mr-2" />
          {{ t('export.showSettings') }}
        </button>
      </div>
      
      <div class="main-actions flex items-center space-x-3">
        <button
          v-if="allItems.completed.length > 0"
          @click="downloadAll"
          :disabled="exportStatus.isRunning"
          class="download-all-button"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          {{ t('export.downloadAll') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  CogIcon
} from '@heroicons/vue/24/outline'
import ProgressBar from '@/components/loading/ProgressBar.vue'
import { useBatchExport } from '@/services/BatchExportManager'
import { useI18n } from '@/services/I18nService'
import { saveAs } from '../utils/file-saver-mock'
import type { ExportItem, BatchExportConfig } from '@/services/BatchExportManager'

// Props
interface Props {
  showTitle?: boolean
  showConfig?: boolean
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true,
  showConfig: false
})

// 使用服务
const {
  progress,
  addExportItem,
  removeExportItem,
  clearQueue,
  startBatchExport,
  pauseBatchExport,
  resumeBatchExport,
  cancelBatchExport,
  retryFailedItems,
  getExportStatus,
  getAllItems,
  setConfig
} = useBatchExport()

const { t } = useI18n()

// 响应式状态
const filterStatus = ref('')
const showConfigPanel = ref(props.showConfig)
const refreshTimer = ref<number>()

// 批量导出配置
const batchConfig = ref<BatchExportConfig>({
  outputFormat: 'zip',
  filenamePattern: '{name}_{timestamp}',
  maxConcurrent: 3,
  retryAttempts: 2,
  retryDelay: 1000,
  includeManifest: true,
  manifestFormat: 'json'
})

// 计算属性
const exportStatus = computed(() => getExportStatus())
const allItems = computed(() => getAllItems())

const completedCount = computed(() => {
  return allItems.value.completed.filter(item => item.status === 'completed').length
})

const failedCount = computed(() => {
  return allItems.value.completed.filter(item => item.status === 'failed').length
})

const filteredItems = computed(() => {
  const all = [
    ...allItems.value.pending,
    ...allItems.value.active,
    ...allItems.value.completed
  ]
  
  if (!filterStatus.value) {
    return all
  }
  
  return all.filter(item => item.status === filterStatus.value)
})

const containerClasses = computed(() => {
  const classes = ['batch-export-panel', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'p-6']
  
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
  return `${t('export.batchExport')}: ${progress.totalItems} ${t('export.items')}`
})

// 方法
const getItemClasses = (item: ExportItem): string[] => {
  const classes = [
    'queue-item',
    'bg-gray-50',
    'dark:bg-gray-800',
    'rounded-lg',
    'p-4',
    'border',
    'border-gray-200',
    'dark:border-gray-700'
  ]
  
  switch (item.status) {
    case 'processing':
      classes.push('border-blue-300', 'dark:border-blue-600')
      break
    case 'completed':
      classes.push('border-green-300', 'dark:border-green-600')
      break
    case 'failed':
      classes.push('border-red-300', 'dark:border-red-600')
      break
  }
  
  return classes
}

const getStatusIconClasses = (status: string): string[] => {
  const classes = ['status-icon', 'flex', 'items-center', 'justify-center', 'w-8', 'h-8', 'rounded-full']
  
  switch (status) {
    case 'pending':
      classes.push('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400')
      break
    case 'processing':
      classes.push('bg-blue-100', 'dark:bg-blue-900', 'text-blue-600', 'dark:text-blue-400')
      break
    case 'completed':
      classes.push('bg-green-100', 'dark:bg-green-900', 'text-green-600', 'dark:text-green-400')
      break
    case 'failed':
      classes.push('bg-red-100', 'dark:bg-red-900', 'text-red-600', 'dark:text-red-400')
      break
  }
  
  return classes
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return ClockIcon
    case 'processing': return ArrowPathIcon
    case 'completed': return CheckCircleIcon
    case 'failed': return ExclamationTriangleIcon
    default: return DocumentIcon
  }
}

const getItemTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    'chart': t('export.chart'),
    'data': t('export.data'),
    'report': t('export.report'),
    'image': t('export.image')
  }
  return typeLabels[type] || type
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

const startExport = async (): Promise<void> => {
  try {
    setConfig(batchConfig.value)
    await startBatchExport()
  } catch (error) {
    console.error('Failed to start batch export:', error)
  }
}

const pauseExport = (): void => {
  pauseBatchExport()
}

const resumeExport = (): void => {
  resumeBatchExport()
}

const cancelExport = (): void => {
  if (confirm(t('export.confirmCancel'))) {
    cancelBatchExport()
  }
}

const clearAllItems = (): void => {
  if (confirm(t('export.confirmClearAll'))) {
    clearQueue()
  }
}

const removeItem = (id: string): void => {
  removeExportItem(id)
}

const retryItem = (id: string): void => {
  // 重试单个项目的逻辑
  console.log('Retrying item:', id)
}

const retryFailedItemsAction = async (): Promise<void> => {
  try {
    await retryFailedItems()
  } catch (error) {
    console.error('Failed to retry failed items:', error)
  }
}

const downloadItem = (item: ExportItem): void => {
  if (item.result?.blob && item.result?.filename) {
    saveAs(item.result.blob, item.result.filename)
  }
}

const downloadAll = (): void => {
  // 触发批量下载
  startExport()
}

const refreshStatus = (): void => {
  // 状态会自动更新，这里可以添加额外的刷新逻辑
}

// 生命周期
onMounted(() => {
  // 设置定时刷新
  refreshTimer.value = window.setInterval(refreshStatus, 1000)
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style scoped>
.batch-export-panel {
  @apply max-w-6xl mx-auto;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center space-x-3;
}

.stat-icon {
  @apply flex-shrink-0;
}

.stat-content {
  @apply flex-1;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.status-filter,
.config-select,
.config-input {
  @apply px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.config-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.checkbox-label {
  @apply flex items-center;
}

.checkbox-input {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.checkbox-text {
  @apply ml-2 text-sm text-gray-700 dark:text-gray-300;
}

.clear-button,
.pause-button,
.resume-button,
.cancel-button,
.start-button,
.retry-button,
.remove-button,
.retry-item-button,
.download-button,
.config-toggle-button,
.download-all-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.clear-button,
.remove-button {
  @apply text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500;
}

.pause-button,
.cancel-button {
  @apply text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:ring-yellow-500;
}

.resume-button,
.start-button,
.retry-button,
.retry-item-button {
  @apply text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500;
}

.download-button,
.config-toggle-button,
.download-all-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.start-button,
.download-all-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.remove-button,
.retry-item-button,
.download-button {
  @apply w-8 h-8 p-1 rounded-full;
}

button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .export-stats {
    @apply grid-cols-2;
  }
  
  .config-options {
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
  .queue-controls {
    @apply hidden;
  }
}
</style>
