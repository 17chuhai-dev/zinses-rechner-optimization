<!--
  离线状态指示器组件
  显示网络状态、离线任务进度、同步状态等信息
-->

<template>
  <div class="offline-status-indicator">
    <!-- 主状态指示器 -->
    <div
      :class="[
        'status-indicator fixed top-4 right-4 z-50 transition-all duration-300',
        'bg-white rounded-lg shadow-lg border',
        isExpanded ? 'w-80' : 'w-12 h-12'
      ]"
    >
      <!-- 折叠状态 -->
      <div
        v-if="!isExpanded"
        :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer',
          'transition-all duration-200 hover:scale-105',
          getStatusColor()
        ]"
        @click="toggleExpanded"
      >
        <component :is="getStatusIcon()" class="w-6 h-6 text-white" />
        
        <!-- 任务计数徽章 -->
        <div
          v-if="state.pendingTasks > 0"
          class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
        >
          {{ state.pendingTasks > 99 ? '99+' : state.pendingTasks }}
        </div>
      </div>

      <!-- 展开状态 -->
      <div v-else class="p-4">
        <!-- 头部 -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <component :is="getStatusIcon()" :class="['w-5 h-5 mr-2', getStatusTextColor()]" />
            <h3 class="font-semibold text-gray-900">{{ getStatusTitle() }}</h3>
          </div>
          <button
            @click="toggleExpanded"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- 网络状态 -->
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Netzwerkstatus</span>
            <span :class="state.isOnline ? 'text-green-600' : 'text-red-600'">
              {{ state.isOnline ? 'Online' : 'Offline' }}
            </span>
          </div>
        </div>

        <!-- 任务统计 -->
        <div class="space-y-2 mb-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Wartende Aufgaben</span>
            <span class="font-medium text-gray-900">{{ state.pendingTasks }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Abgeschlossen</span>
            <span class="font-medium text-green-600">{{ state.completedTasks }}</span>
          </div>
          <div v-if="state.failedTasks > 0" class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Fehlgeschlagen</span>
            <span class="font-medium text-red-600">{{ state.failedTasks }}</span>
          </div>
        </div>

        <!-- 处理进度 -->
        <div v-if="state.isProcessing" class="mb-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-600">Verarbeitung</span>
            <span class="text-blue-600">Läuft...</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 60%"></div>
          </div>
        </div>

        <!-- 同步状态 -->
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Synchronisation</span>
            <div class="flex items-center">
              <component
                :is="getSyncIcon()"
                :class="[
                  'w-4 h-4 mr-1',
                  state.syncStatus === 'syncing' ? 'animate-spin text-blue-600' : '',
                  state.syncStatus === 'error' ? 'text-red-600' : 'text-gray-400'
                ]"
              />
              <span :class="getSyncStatusColor()">
                {{ getSyncStatusText() }}
              </span>
            </div>
          </div>
          <div v-if="statistics.lastSync" class="text-xs text-gray-500 mt-1">
            Zuletzt: {{ formatDate(statistics.lastSync) }}
          </div>
        </div>

        <!-- 存储使用情况 -->
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-600">Speicher</span>
            <span class="text-gray-900">
              {{ formatBytes(state.storageUsage) }} / {{ formatBytes(state.maxStorage) }}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(state.storageUsage / state.maxStorage) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex space-x-2">
          <BaseButton
            v-if="state.isOnline && state.syncStatus !== 'syncing'"
            variant="outline"
            size="sm"
            @click="syncData"
            class="flex-1"
          >
            <ArrowPathIcon class="w-4 h-4 mr-1" />
            Sync
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            @click="showDetails = true"
            class="flex-1"
          >
            <InformationCircleIcon class="w-4 h-4 mr-1" />
            Details
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- 详细信息对话框 -->
    <BaseDialog
      :open="showDetails"
      @close="showDetails = false"
      title="Offline-Status Details"
      size="lg"
    >
      <div class="space-y-6">
        <!-- 统计概览 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-gray-900">{{ statistics.totalTasks }}</div>
            <div class="text-sm text-gray-600">Gesamt Aufgaben</div>
          </div>
          <div class="stat-card bg-blue-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ statistics.cacheSize }}</div>
            <div class="text-sm text-gray-600">Cache Einträge</div>
          </div>
          <div class="stat-card bg-green-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ state.completedTasks }}</div>
            <div class="text-sm text-gray-600">Erfolgreich</div>
          </div>
          <div class="stat-card bg-red-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-red-600">{{ state.failedTasks }}</div>
            <div class="text-sm text-gray-600">Fehlgeschlagen</div>
          </div>
        </div>

        <!-- 任务列表 -->
        <div>
          <h4 class="text-lg font-semibold text-gray-900 mb-3">Aktuelle Aufgaben</h4>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="task in recentTasks"
              :key="task.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex-1">
                <div class="flex items-center">
                  <component
                    :is="getTaskStatusIcon(task.status)"
                    :class="['w-4 h-4 mr-2', getTaskStatusColor(task.status)]"
                  />
                  <span class="text-sm font-medium text-gray-900">
                    {{ getTaskTypeLabel(task.type) }}
                  </span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ formatDate(task.createdAt) }}
                </div>
              </div>
              <div class="text-right">
                <div :class="['text-sm font-medium', getTaskStatusColor(task.status)]">
                  {{ getTaskStatusLabel(task.status) }}
                </div>
                <div v-if="task.retryCount > 0" class="text-xs text-gray-500">
                  Versuche: {{ task.retryCount }}/{{ task.maxRetries }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作区域 -->
        <div class="flex justify-between">
          <BaseButton
            variant="outline"
            @click="cleanupData"
          >
            <TrashIcon class="w-4 h-4 mr-2" />
            Daten bereinigen
          </BaseButton>
          <div class="space-x-2">
            <BaseButton
              v-if="state.isOnline"
              variant="primary"
              @click="syncData"
              :loading="state.syncStatus === 'syncing'"
            >
              <ArrowPathIcon class="w-4 h-4 mr-2" />
              Jetzt synchronisieren
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseDialog>

    <!-- 通知提示 -->
    <div
      v-if="showNotification"
      class="notification fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border p-4 max-w-sm"
    >
      <div class="flex items-start">
        <component :is="notificationIcon" :class="['w-5 h-5 mr-3 mt-0.5', notificationColor]" />
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">{{ notificationTitle }}</p>
          <p class="text-sm text-gray-600 mt-1">{{ notificationMessage }}</p>
        </div>
        <button
          @click="showNotification = false"
          class="text-gray-400 hover:text-gray-600 ml-2"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  WifiIcon,
  SignalSlashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  XMarkIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { useOfflineCalculation } from '@/services/OfflineCalculationManager'

// 使用离线计算服务
const {
  state,
  syncData,
  cleanupExpiredData,
  getOfflineStatistics
} = useOfflineCalculation()

// 组件状态
const isExpanded = ref(false)
const showDetails = ref(false)
const showNotification = ref(false)
const notificationTitle = ref('')
const notificationMessage = ref('')
const notificationIcon = ref(InformationCircleIcon)
const notificationColor = ref('text-blue-600')

// 模拟任务数据（实际应该从服务获取）
const recentTasks = ref([
  {
    id: '1',
    type: 'compound-interest',
    status: 'completed',
    createdAt: new Date(),
    retryCount: 0,
    maxRetries: 3
  },
  {
    id: '2',
    type: 'loan',
    status: 'pending',
    createdAt: new Date(Date.now() - 60000),
    retryCount: 1,
    maxRetries: 3
  }
])

// 计算属性
const statistics = computed(() => getOfflineStatistics())

// 方法
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const getStatusIcon = () => {
  if (!state.isOnline) return SignalSlashIcon
  if (state.isProcessing) return ArrowPathIcon
  return WifiIcon
}

const getStatusColor = () => {
  if (!state.isOnline) return 'bg-red-500'
  if (state.isProcessing) return 'bg-blue-500'
  if (state.pendingTasks > 0) return 'bg-yellow-500'
  return 'bg-green-500'
}

const getStatusTextColor = () => {
  if (!state.isOnline) return 'text-red-600'
  if (state.isProcessing) return 'text-blue-600'
  if (state.pendingTasks > 0) return 'text-yellow-600'
  return 'text-green-600'
}

const getStatusTitle = () => {
  if (!state.isOnline) return 'Offline'
  if (state.isProcessing) return 'Verarbeitung'
  if (state.pendingTasks > 0) return 'Warteschlange'
  return 'Online'
}

const getSyncIcon = () => {
  if (state.syncStatus === 'syncing') return ArrowPathIcon
  if (state.syncStatus === 'error') return ExclamationCircleIcon
  return CheckCircleIcon
}

const getSyncStatusColor = () => {
  if (state.syncStatus === 'syncing') return 'text-blue-600'
  if (state.syncStatus === 'error') return 'text-red-600'
  return 'text-green-600'
}

const getSyncStatusText = () => {
  if (state.syncStatus === 'syncing') return 'Läuft'
  if (state.syncStatus === 'error') return 'Fehler'
  return 'Aktuell'
}

const getTaskStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return CheckCircleIcon
    case 'failed': return XCircleIcon
    case 'processing': return ArrowPathIcon
    default: return ClockIcon
  }
}

const getTaskStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-600'
    case 'failed': return 'text-red-600'
    case 'processing': return 'text-blue-600'
    default: return 'text-yellow-600'
  }
}

const getTaskStatusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'Fertig'
    case 'failed': return 'Fehler'
    case 'processing': return 'Läuft'
    default: return 'Wartend'
  }
}

const getTaskTypeLabel = (type: string) => {
  const labels = {
    'compound-interest': 'Zinseszins',
    'loan': 'Kredit',
    'mortgage': 'Hypothek',
    'portfolio': 'Portfolio',
    'tax-optimization': 'Steuer'
  }
  return labels[type as keyof typeof labels] || type
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const cleanupData = async () => {
  try {
    await cleanupExpiredData()
    showNotification.value = true
    notificationTitle.value = 'Bereinigung abgeschlossen'
    notificationMessage.value = 'Veraltete Daten wurden erfolgreich entfernt.'
    notificationIcon.value = CheckCircleIcon
    notificationColor.value = 'text-green-600'
    
    setTimeout(() => {
      showNotification.value = false
    }, 5000)
  } catch (error) {
    showNotification.value = true
    notificationTitle.value = 'Bereinigung fehlgeschlagen'
    notificationMessage.value = 'Fehler beim Entfernen der Daten.'
    notificationIcon.value = ExclamationCircleIcon
    notificationColor.value = 'text-red-600'
  }
}

// 监听网络状态变化
watch(() => state.isOnline, (isOnline, wasOnline) => {
  if (isOnline && !wasOnline) {
    showNotification.value = true
    notificationTitle.value = 'Verbindung wiederhergestellt'
    notificationMessage.value = 'Wartende Aufgaben werden verarbeitet.'
    notificationIcon.value = WifiIcon
    notificationColor.value = 'text-green-600'
  } else if (!isOnline && wasOnline) {
    showNotification.value = true
    notificationTitle.value = 'Verbindung unterbrochen'
    notificationMessage.value = 'Arbeite im Offline-Modus weiter.'
    notificationIcon.value = SignalSlashIcon
    notificationColor.value = 'text-yellow-600'
  }
  
  setTimeout(() => {
    showNotification.value = false
  }, 5000)
})

// 监听任务变化
watch(() => state.pendingTasks, (newCount, oldCount) => {
  if (newCount > oldCount && newCount > 0) {
    // 新任务添加
    if (!isExpanded.value) {
      // 简短显示展开状态
      isExpanded.value = true
      setTimeout(() => {
        if (state.pendingTasks === 0) {
          isExpanded.value = false
        }
      }, 3000)
    }
  }
})

// 生命周期
onMounted(() => {
  // 自动隐藏通知
  setTimeout(() => {
    showNotification.value = false
  }, 5000)
})
</script>

<style scoped>
.offline-status-indicator {
  @apply pointer-events-none;
}

.status-indicator {
  @apply pointer-events-auto;
}

.stat-card {
  @apply transition-shadow hover:shadow-md;
}

.notification {
  @apply animate-slideInRight;
}

/* 动画 */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slideInRight {
  animation: slideInRight 0.3s ease-out;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .status-indicator {
    @apply top-2 right-2;
  }
  
  .notification {
    @apply bottom-2 right-2 left-2 max-w-none;
  }
}
</style>
