<!--
  同步状态监控组件
  显示数据同步状态、进度和统计信息
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 同步状态概览 -->
    <div class="sync-overview">
      <div class="sync-header flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Datensynchronisation
        </h3>
        <div class="sync-controls flex items-center space-x-2">
          <button
            @click="refreshStatus"
            :disabled="isRefreshing"
            class="refresh-button"
            :aria-label="t('common.refresh')"
          >
            <ArrowPathIcon :class="['w-4 h-4', { 'animate-spin': isRefreshing }]" />
          </button>
          <button
            v-if="canCreateTask"
            @click="$emit('create-task')"
            class="create-button"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            Neue Synchronisation
          </button>
        </div>
      </div>

      <!-- 全局同步状态 -->
      <div class="global-status grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="status-card">
          <div class="status-icon">
            <ClockIcon class="w-6 h-6 text-blue-500" />
          </div>
          <div class="status-content">
            <div class="status-value">{{ activeTasks.length }}</div>
            <div class="status-label">Aktive Aufgaben</div>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon">
            <CheckCircleIcon class="w-6 h-6 text-green-500" />
          </div>
          <div class="status-content">
            <div class="status-value">{{ completedTasks.length }}</div>
            <div class="status-label">Abgeschlossen</div>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-500" />
          </div>
          <div class="status-content">
            <div class="status-value">{{ failedTasks.length }}</div>
            <div class="status-label">Fehlgeschlagen</div>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon">
            <DocumentTextIcon class="w-6 h-6 text-purple-500" />
          </div>
          <div class="status-content">
            <div class="status-value">{{ totalRecordsProcessed }}</div>
            <div class="status-label">Datensätze</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 同步任务列表 -->
    <div class="sync-tasks">
      <div class="tasks-header flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          Synchronisationsaufgaben
        </h4>
        <div class="filter-controls flex items-center space-x-2">
          <select
            v-model="statusFilter"
            class="status-filter"
            @change="filterTasks"
          >
            <option value="">Alle Status</option>
            <option value="running">Läuft</option>
            <option value="completed">Abgeschlossen</option>
            <option value="failed">Fehlgeschlagen</option>
            <option value="paused">Pausiert</option>
          </select>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="tasks-list space-y-3">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          :class="getTaskClasses(task)"
        >
          <!-- 任务头部 -->
          <div class="task-header flex items-center justify-between">
            <div class="task-info flex items-center space-x-3">
              <div :class="getStatusIconClasses(task.status)">
                <component :is="getStatusIcon(task.status)" class="w-5 h-5" />
              </div>
              <div>
                <h5 class="task-name font-medium text-gray-900 dark:text-white">
                  {{ task.config.name }}
                </h5>
                <p class="task-description text-sm text-gray-600 dark:text-gray-400">
                  {{ task.config.description || 'Keine Beschreibung' }}
                </p>
              </div>
            </div>
            <div class="task-actions flex items-center space-x-2">
              <button
                v-if="task.status === 'running'"
                @click="pauseTask(task.id)"
                class="action-button pause"
                :aria-label="`Pausiere ${task.config.name}`"
              >
                <PauseIcon class="w-4 h-4" />
              </button>
              <button
                v-else-if="task.status === 'paused'"
                @click="resumeTask(task.id)"
                class="action-button resume"
                :aria-label="`Setze ${task.config.name} fort`"
              >
                <PlayIcon class="w-4 h-4" />
              </button>
              <button
                v-if="task.status === 'running' || task.status === 'paused'"
                @click="cancelTask(task.id)"
                class="action-button cancel"
                :aria-label="`Breche ${task.config.name} ab`"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
              <button
                v-if="task.status === 'failed' || task.status === 'completed'"
                @click="retryTask(task.id)"
                class="action-button retry"
                :aria-label="`Wiederhole ${task.config.name}`"
              >
                <ArrowPathIcon class="w-4 h-4" />
              </button>
              <button
                @click="deleteTask(task.id)"
                class="action-button delete"
                :aria-label="`Lösche ${task.config.name}`"
                :disabled="task.status === 'running'"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- 进度条 -->
          <div v-if="task.status === 'running'" class="task-progress mt-3">
            <div class="progress-info flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>{{ getTaskStatus(task)?.currentStep }}</span>
              <span>{{ task.progress }}%</span>
            </div>
            <ProgressBar
              :value="task.progress"
              :max="100"
              size="sm"
              :color="getProgressColor(task.status)"
              :striped="true"
              :animated="true"
            />
          </div>

          <!-- 任务统计 -->
          <div class="task-stats mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="stat-item">
              <span class="stat-label text-gray-600 dark:text-gray-400">Verarbeitet:</span>
              <span class="stat-value font-medium text-gray-900 dark:text-white">
                {{ task.stats.recordsProcessed }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label text-gray-600 dark:text-gray-400">Eingefügt:</span>
              <span class="stat-value font-medium text-green-600 dark:text-green-400">
                {{ task.stats.recordsInserted }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label text-gray-600 dark:text-gray-400">Aktualisiert:</span>
              <span class="stat-value font-medium text-blue-600 dark:text-blue-400">
                {{ task.stats.recordsUpdated }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label text-gray-600 dark:text-gray-400">Fehler:</span>
              <span class="stat-value font-medium text-red-600 dark:text-red-400">
                {{ task.stats.recordsErrored }}
              </span>
            </div>
          </div>

          <!-- 时间信息 -->
          <div class="task-timing mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div class="timing-info">
              <span v-if="task.startedAt">
                Gestartet: {{ formatDateTime(task.startedAt) }}
              </span>
              <span v-if="task.completedAt" class="ml-4">
                Abgeschlossen: {{ formatDateTime(task.completedAt) }}
              </span>
            </div>
            <div v-if="task.status === 'running'" class="estimated-completion">
              <span>Geschätzte Fertigstellung: {{ getEstimatedCompletion(task) }}</span>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="task.error" class="task-error mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <div class="error-header flex items-center mb-2">
              <ExclamationTriangleIcon class="w-4 h-4 text-red-500 mr-2" />
              <span class="text-sm font-medium text-red-800 dark:text-red-200">
                Fehler: {{ task.error.code }}
              </span>
            </div>
            <p class="text-sm text-red-700 dark:text-red-300">
              {{ task.error.message }}
            </p>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredTasks.length === 0" class="empty-state text-center py-8">
          <DocumentTextIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Synchronisationsaufgaben
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ statusFilter ? 'Keine Aufgaben mit diesem Status gefunden.' : 'Erstellen Sie Ihre erste Synchronisationsaufgabe.' }}
          </p>
          <button
            v-if="!statusFilter && canCreateTask"
            @click="$emit('create-task')"
            class="create-button"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Synchronisation erstellen
          </button>
        </div>
      </div>
    </div>

    <!-- 实时更新指示器 -->
    <div v-if="isRealtime" class="realtime-indicator">
      <div class="realtime-dot"></div>
      <span class="text-xs text-gray-500 dark:text-gray-400">Live-Updates</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import ProgressBar from '@/components/loading/ProgressBar.vue'
import { useDataSync } from '@/services/DataSyncService'
import { useI18n } from '@/services/I18nService'
import type { SyncTask, SyncStatus } from '@/services/DataSyncService'

// Props
interface Props {
  // 显示选项
  showControls?: boolean
  showStats?: boolean
  showTiming?: boolean
  
  // 权限选项
  canCreateTask?: boolean
  canControlTasks?: boolean
  
  // 更新选项
  autoRefresh?: boolean
  refreshInterval?: number
  
  // 样式选项
  variant?: 'default' | 'compact' | 'detailed'
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showControls: true,
  showStats: true,
  showTiming: true,
  canCreateTask: true,
  canControlTasks: true,
  autoRefresh: true,
  refreshInterval: 5000,
  variant: 'default'
})

// Emits
interface Emits {
  'create-task': []
  'task-action': [action: string, taskId: string]
}

const emit = defineEmits<Emits>()

// 使用服务
const {
  getAllSyncTasks,
  getSyncTaskStatus,
  pauseSyncTask,
  resumeSyncTask,
  cancelSyncTask,
  deleteSyncTask,
  executeSyncTask
} = useDataSync()

const { t, formatDateTime } = useI18n()

// 响应式状态
const tasks = ref<SyncTask[]>([])
const taskStatuses = ref<Map<string, SyncStatus>>(new Map())
const statusFilter = ref('')
const isRefreshing = ref(false)
const isRealtime = ref(false)
const refreshTimer = ref<number>()

// 计算属性
const containerClasses = computed(() => {
  const classes = ['sync-status-monitor', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'p-6']
  
  if (props.variant === 'compact') {
    classes.push('p-4')
  } else if (props.variant === 'detailed') {
    classes.push('p-8')
  }
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const activeTasks = computed(() => {
  return tasks.value.filter(task => task.status === 'running' || task.status === 'paused')
})

const completedTasks = computed(() => {
  return tasks.value.filter(task => task.status === 'completed')
})

const failedTasks = computed(() => {
  return tasks.value.filter(task => task.status === 'failed')
})

const totalRecordsProcessed = computed(() => {
  return tasks.value.reduce((sum, task) => sum + task.stats.recordsProcessed, 0)
})

const filteredTasks = computed(() => {
  if (!statusFilter.value) {
    return tasks.value
  }
  return tasks.value.filter(task => task.status === statusFilter.value)
})

const ariaLabel = computed(() => {
  return `Synchronisationsstatus: ${activeTasks.value.length} aktive Aufgaben`
})

// 方法
const refreshStatus = async (): Promise<void> => {
  if (isRefreshing.value) return

  isRefreshing.value = true

  try {
    // 获取所有任务
    tasks.value = getAllSyncTasks()
    
    // 获取任务状态
    for (const task of tasks.value) {
      const status = getSyncTaskStatus(task.id)
      if (status) {
        taskStatuses.value.set(task.id, status)
      }
    }
  } catch (error) {
    console.error('Failed to refresh sync status:', error)
  } finally {
    isRefreshing.value = false
  }
}

const getTaskStatus = (task: SyncTask): SyncStatus | undefined => {
  return taskStatuses.value.get(task.id)
}

const getTaskClasses = (task: SyncTask): string[] => {
  const classes = [
    'task-item',
    'bg-gray-50',
    'dark:bg-gray-800',
    'rounded-lg',
    'p-4',
    'border',
    'border-gray-200',
    'dark:border-gray-700'
  ]
  
  switch (task.status) {
    case 'running':
      classes.push('border-blue-300', 'dark:border-blue-600')
      break
    case 'completed':
      classes.push('border-green-300', 'dark:border-green-600')
      break
    case 'failed':
      classes.push('border-red-300', 'dark:border-red-600')
      break
    case 'paused':
      classes.push('border-yellow-300', 'dark:border-yellow-600')
      break
  }
  
  return classes
}

const getStatusIconClasses = (status: string): string[] => {
  const classes = ['status-icon', 'flex', 'items-center', 'justify-center', 'w-8', 'h-8', 'rounded-full']
  
  switch (status) {
    case 'running':
      classes.push('bg-blue-100', 'dark:bg-blue-900', 'text-blue-600', 'dark:text-blue-400')
      break
    case 'completed':
      classes.push('bg-green-100', 'dark:bg-green-900', 'text-green-600', 'dark:text-green-400')
      break
    case 'failed':
      classes.push('bg-red-100', 'dark:bg-red-900', 'text-red-600', 'dark:text-red-400')
      break
    case 'paused':
      classes.push('bg-yellow-100', 'dark:bg-yellow-900', 'text-yellow-600', 'dark:text-yellow-400')
      break
    default:
      classes.push('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400')
  }
  
  return classes
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return ClockIcon
    case 'completed': return CheckCircleIcon
    case 'failed': return ExclamationTriangleIcon
    case 'paused': return PauseIcon
    default: return DocumentTextIcon
  }
}

const getProgressColor = (status: string): string => {
  switch (status) {
    case 'running': return 'blue'
    case 'completed': return 'green'
    case 'failed': return 'red'
    case 'paused': return 'yellow'
    default: return 'gray'
  }
}

const getEstimatedCompletion = (task: SyncTask): string => {
  const status = getTaskStatus(task)
  if (!status?.estimatedCompletion) {
    return 'Unbekannt'
  }
  
  return formatDateTime(status.estimatedCompletion)
}

const pauseTask = async (taskId: string): Promise<void> => {
  try {
    await pauseSyncTask(taskId)
    emit('task-action', 'pause', taskId)
    await refreshStatus()
  } catch (error) {
    console.error('Failed to pause task:', error)
  }
}

const resumeTask = async (taskId: string): Promise<void> => {
  try {
    await resumeSyncTask(taskId)
    emit('task-action', 'resume', taskId)
    await refreshStatus()
  } catch (error) {
    console.error('Failed to resume task:', error)
  }
}

const cancelTask = async (taskId: string): Promise<void> => {
  try {
    await cancelSyncTask(taskId)
    emit('task-action', 'cancel', taskId)
    await refreshStatus()
  } catch (error) {
    console.error('Failed to cancel task:', error)
  }
}

const deleteTask = async (taskId: string): Promise<void> => {
  if (!confirm('Sind Sie sicher, dass Sie diese Synchronisationsaufgabe löschen möchten?')) {
    return
  }
  
  try {
    await deleteSyncTask(taskId)
    emit('task-action', 'delete', taskId)
    await refreshStatus()
  } catch (error) {
    console.error('Failed to delete task:', error)
  }
}

const retryTask = async (taskId: string): Promise<void> => {
  try {
    await executeSyncTask(taskId)
    emit('task-action', 'retry', taskId)
    await refreshStatus()
  } catch (error) {
    console.error('Failed to retry task:', error)
  }
}

const filterTasks = (): void => {
  // 过滤逻辑已在计算属性中处理
}

const startAutoRefresh = (): void => {
  if (props.autoRefresh && !refreshTimer.value) {
    refreshTimer.value = window.setInterval(() => {
      refreshStatus()
    }, props.refreshInterval)
    isRealtime.value = true
  }
}

const stopAutoRefresh = (): void => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = undefined
    isRealtime.value = false
  }
}

// 生命周期
onMounted(async () => {
  await refreshStatus()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.sync-status-monitor {
  @apply relative;
}

.status-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center space-x-3;
}

.status-icon {
  @apply flex-shrink-0;
}

.status-content {
  @apply flex-1;
}

.status-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.status-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.refresh-button,
.create-button,
.action-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.refresh-button {
  @apply text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500;
}

.create-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.action-button {
  @apply w-8 h-8 p-1 rounded-full;
}

.action-button.pause {
  @apply text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900 focus:ring-yellow-500;
}

.action-button.resume {
  @apply text-green-600 hover:bg-green-100 dark:hover:bg-green-900 focus:ring-green-500;
}

.action-button.cancel {
  @apply text-red-600 hover:bg-red-100 dark:hover:bg-red-900 focus:ring-red-500;
}

.action-button.retry {
  @apply text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 focus:ring-blue-500;
}

.action-button.delete {
  @apply text-red-600 hover:bg-red-100 dark:hover:bg-red-900 focus:ring-red-500;
}

.action-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.status-filter {
  @apply px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.stat-item {
  @apply flex flex-col;
}

.stat-label {
  @apply text-xs;
}

.stat-value {
  @apply text-sm;
}

.realtime-indicator {
  @apply absolute top-4 right-4 flex items-center space-x-2;
}

.realtime-dot {
  @apply w-2 h-2 bg-green-500 rounded-full animate-pulse;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .global-status {
    @apply grid-cols-2;
  }
  
  .task-stats {
    @apply grid-cols-2;
  }
  
  .task-actions {
    @apply flex-col space-x-0 space-y-1;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .status-card {
  @apply border-2 border-current;
}

/* 暗色模式支持 */
:global(.theme-dark) .status-card {
  @apply bg-gray-800 border-gray-600;
}

/* 打印样式 */
@media print {
  .sync-controls,
  .task-actions,
  .realtime-indicator {
    @apply hidden;
  }
}
</style>
