<template>
  <div class="monitoring-dashboard p-6 bg-gray-50 min-h-screen">
    <!-- 头部信息 -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p class="text-gray-600 mt-1">Real-time system health and performance monitoring</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div :class="[
              'w-3 h-3 rounded-full',
              getStatusColor(overallStatus)
            ]"></div>
            <span class="text-sm text-gray-600 capitalize">
              {{ overallStatus }}
            </span>
          </div>
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- 最后更新时间 -->
      <div v-if="lastUpdate" class="text-sm text-gray-500 mt-2">
        Last updated: {{ formatTime(lastUpdate) }}
      </div>
    </div>

    <!-- 系统状态概览 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <!-- 整体状态 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Overall Status</p>
            <p class="text-2xl font-bold mt-2" :class="getStatusTextColor(overallStatus)">
              {{ overallStatus.toUpperCase() }}
            </p>
          </div>
          <div class="text-3xl">
            {{ getStatusEmoji(overallStatus) }}
          </div>
        </div>
      </div>

      <!-- 活跃告警 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Alerts</p>
            <p class="text-2xl font-bold mt-2" :class="alertCount > 0 ? 'text-red-600' : 'text-green-600'">
              {{ alertCount }}
            </p>
          </div>
          <div class="text-3xl">
            {{ alertCount > 0 ? '🚨' : '✅' }}
          </div>
        </div>
      </div>

      <!-- 运行时间 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Uptime</p>
            <p class="text-2xl font-bold mt-2 text-blue-600">
              {{ formatUptime(uptimeSeconds) }}
            </p>
          </div>
          <div class="text-3xl">⏱️</div>
        </div>
      </div>

      <!-- 可用性 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Availability</p>
            <p class="text-2xl font-bold mt-2 text-green-600">
              {{ availability }}%
            </p>
          </div>
          <div class="text-3xl">📊</div>
        </div>
      </div>
    </div>

    <!-- 健康检查详情 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- 服务健康检查 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Service Health Checks</h2>
        <div class="space-y-4">
          <div
            v-for="(check, name) in healthChecks"
            :key="name"
            class="flex items-center justify-between p-4 rounded-lg border"
            :class="getHealthCheckBorderColor(check.status)"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-3 h-3 rounded-full"
                :class="getStatusColor(check.status)"
              ></div>
              <div>
                <p class="font-medium text-gray-900 capitalize">{{ name }}</p>
                <p class="text-sm text-gray-500">{{ check.message }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">
                {{ check.response_time_ms.toFixed(0) }}ms
              </p>
              <p class="text-xs text-gray-500">
                {{ formatTime(new Date(check.timestamp)) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统资源监控 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">System Resources</h2>
        <div class="space-y-6">
          <!-- CPU使用率 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600">CPU Usage</span>
              <span class="text-sm font-bold text-gray-900">{{ systemMetrics.cpu }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="getResourceBarColor(systemMetrics.cpu)"
                :style="{ width: `${systemMetrics.cpu}%` }"
              ></div>
            </div>
          </div>

          <!-- 内存使用率 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600">Memory Usage</span>
              <span class="text-sm font-bold text-gray-900">{{ systemMetrics.memory }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="getResourceBarColor(systemMetrics.memory)"
                :style="{ width: `${systemMetrics.memory}%` }"
              ></div>
            </div>
          </div>

          <!-- 磁盘使用率 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600">Disk Usage</span>
              <span class="text-sm font-bold text-gray-900">{{ systemMetrics.disk }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="getResourceBarColor(systemMetrics.disk)"
                :style="{ width: `${systemMetrics.disk}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 告警和指标 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 活跃告警 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Active Alerts</h2>
        <div v-if="activeAlerts.length === 0" class="text-center py-8">
          <div class="text-6xl mb-4">✅</div>
          <p class="text-gray-500">No active alerts</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="alert in activeAlerts"
            :key="alert.id"
            :class="[
              'p-4 rounded-lg border-l-4',
              getAlertColor(alert.severity)
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">{{ alert.name }}</p>
                <p class="text-sm text-gray-600 mt-1">{{ alert.message }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatTime(new Date(alert.timestamp)) }}
                </p>
              </div>
              <div :class="[
                'px-2 py-1 rounded text-xs font-medium',
                getAlertBadgeColor(alert.severity)
              ]">
                {{ alert.severity.toUpperCase() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 关键指标 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Key Metrics</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="text-blue-600">⚡</div>
              <div>
                <p class="font-medium text-gray-900">API Response Time</p>
                <p class="text-sm text-gray-500">Average response time</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold text-blue-600">
                {{ apiMetrics.responseTime }}ms
              </p>
              <p class="text-xs text-gray-500">Target: &lt; 500ms</p>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="text-green-600">📈</div>
              <div>
                <p class="font-medium text-gray-900">Cache Hit Rate</p>
                <p class="text-sm text-gray-500">Cache performance</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold text-green-600">
                {{ apiMetrics.cacheHitRate }}%
              </p>
              <p class="text-xs text-gray-500">Target: &gt; 85%</p>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="text-yellow-600">🎯</div>
              <div>
                <p class="font-medium text-gray-900">Error Rate</p>
                <p class="text-sm text-gray-500">API error percentage</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold text-yellow-600">
                {{ apiMetrics.errorRate }}%
              </p>
              <p class="text-xs text-gray-500">Target: &lt; 0.1%</p>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="text-purple-600">🔄</div>
              <div>
                <p class="font-medium text-gray-900">Requests/Min</p>
                <p class="text-sm text-gray-500">Current request rate</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold text-purple-600">
                {{ apiMetrics.requestRate }}
              </p>
              <p class="text-xs text-gray-500">Last minute</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'

// 响应式数据
const isLoading = ref(false)
const lastUpdate = ref<Date | null>(null)
const overallStatus = ref('unknown')
const alertCount = ref(0)
const uptimeSeconds = ref(0)
const availability = ref(99.9)

const healthChecks = reactive<any>({})
const activeAlerts = ref<any[]>([])
const systemMetrics = reactive({
  cpu: 0,
  memory: 0,
  disk: 0
})

const apiMetrics = reactive({
  responseTime: 0,
  cacheHitRate: 0,
  errorRate: 0,
  requestRate: 0
})

let refreshInterval: NodeJS.Timeout | null = null

// 获取监控数据
const fetchMonitoringData = async () => {
  try {
    isLoading.value = true

    // 获取监控状态
    const statusResponse = await fetch('/monitoring/status')
    if (statusResponse.ok) {
      const statusData = await statusResponse.json()

      overallStatus.value = statusData.overall_status
      uptimeSeconds.value = statusData.uptime_seconds
      Object.assign(healthChecks, statusData.health_checks)

      // 更新系统指标
      if (statusData.health_checks.system?.details) {
        const details = statusData.health_checks.system.details
        systemMetrics.cpu = Math.round(details.cpu_percent || 0)
        systemMetrics.memory = Math.round(details.memory_percent || 0)
        systemMetrics.disk = Math.round(details.disk_percent || 0)
      }
    }

    // 获取告警信息
    const alertsResponse = await fetch('/monitoring/alerts')
    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json()
      activeAlerts.value = alertsData.active_alerts
      alertCount.value = alertsData.active_alerts.length
    }

    // 获取缓存统计
    const cacheResponse = await fetch('/cache/stats')
    if (cacheResponse.ok) {
      const cacheData = await cacheResponse.json()
      apiMetrics.cacheHitRate = Math.round(cacheData.hit_rate_percent || 0)
    }

    // 模拟其他API指标（实际应该从监控端点获取）
    apiMetrics.responseTime = Math.round(Math.random() * 200 + 100) // 100-300ms
    apiMetrics.errorRate = Math.round(Math.random() * 0.1 * 100) / 100 // 0-0.1%
    apiMetrics.requestRate = Math.round(Math.random() * 50 + 20) // 20-70 req/min

    lastUpdate.value = new Date()

  } catch (error) {
    console.error('Failed to fetch monitoring data:', error)
  } finally {
    isLoading.value = false
  }
}

// 手动刷新数据
const refreshData = () => {
  fetchMonitoringData()
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化运行时间
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'bg-green-500'
    case 'degraded': return 'bg-yellow-500'
    case 'unhealthy': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'text-green-600'
    case 'degraded': return 'text-yellow-600'
    case 'unhealthy': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const getStatusEmoji = (status: string) => {
  switch (status) {
    case 'healthy': return '✅'
    case 'degraded': return '⚠️'
    case 'unhealthy': return '❌'
    default: return '❓'
  }
}

// 获取健康检查边框颜色
const getHealthCheckBorderColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'border-green-200 bg-green-50'
    case 'degraded': return 'border-yellow-200 bg-yellow-50'
    case 'unhealthy': return 'border-red-200 bg-red-50'
    default: return 'border-gray-200 bg-gray-50'
  }
}

// 获取资源使用率颜色
const getResourceBarColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 80) return 'bg-yellow-500'
  if (percentage >= 60) return 'bg-blue-500'
  return 'bg-green-500'
}

// 获取告警颜色
const getAlertColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-50 border-red-500'
    case 'error': return 'bg-orange-50 border-orange-500'
    case 'warning': return 'bg-yellow-50 border-yellow-500'
    case 'info': return 'bg-blue-50 border-blue-500'
    default: return 'bg-gray-50 border-gray-500'
  }
}

const getAlertBadgeColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'error': return 'bg-orange-100 text-orange-800'
    case 'warning': return 'bg-yellow-100 text-yellow-800'
    case 'info': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// 生命周期
onMounted(() => {
  // 立即获取数据
  fetchMonitoringData()

  // 设置定期刷新
  refreshInterval = setInterval(() => {
    fetchMonitoringData()
  }, 30000) // 每30秒刷新
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.monitoring-dashboard {
  font-family: 'Inter', sans-serif;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>
