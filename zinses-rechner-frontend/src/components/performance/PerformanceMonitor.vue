<!--
  性能监控组件
  实时显示计算性能指标、缓存状态、任务队列等信息
-->

<template>
  <div class="performance-monitor" :class="{ 'expanded': isExpanded }">
    <!-- 监控头部 -->
    <div class="monitor-header" @click="toggleExpanded">
      <div class="header-left">
        <Icon name="activity" size="20" />
        <span class="title">性能监控</span>
        <div class="status-indicator" :class="performanceStatus">
          <div class="status-dot"></div>
          <span class="status-text">{{ performanceStatusText }}</span>
        </div>
      </div>

      <div class="header-right">
        <div class="quick-stats">
          <span class="stat">{{ Math.round(performanceMetrics.averageResponseTime) }}ms</span>
          <span class="stat">{{ Math.round(performanceMetrics.cacheHitRate) }}%</span>
        </div>
        <Icon
          :name="isExpanded ? 'chevron-up' : 'chevron-down'"
          size="16"
          class="expand-icon"
        />
      </div>
    </div>

    <!-- 详细监控面板 -->
    <Transition name="panel-expand">
      <div v-if="isExpanded" class="monitor-panel">
        <!-- 性能指标卡片 -->
        <div class="metrics-grid">
          <!-- 响应时间 -->
          <div class="metric-card">
            <div class="metric-header">
              <Icon name="clock" size="16" />
              <span>响应时间</span>
            </div>
            <div class="metric-value">
              {{ Math.round(performanceMetrics.averageResponseTime) }}ms
            </div>
            <div class="metric-trend" :class="getResponseTimeTrend()">
              <Icon :name="getResponseTimeTrendIcon()" size="12" />
              <span>{{ getResponseTimeTrendText() }}</span>
            </div>
          </div>

          <!-- 缓存命中率 -->
          <div class="metric-card">
            <div class="metric-header">
              <Icon name="database" size="16" />
              <span>缓存命中率</span>
            </div>
            <div class="metric-value">
              {{ Math.round(performanceMetrics.cacheHitRate) }}%
            </div>
            <div class="metric-progress">
              <div
                class="progress-bar"
                :style="{ width: `${performanceMetrics.cacheHitRate}%` }"
              ></div>
            </div>
          </div>

          <!-- 增量更新 -->
          <div class="metric-card">
            <div class="metric-header">
              <Icon name="zap" size="16" />
              <span>增量更新</span>
            </div>
            <div class="metric-value">
              {{ performanceMetrics.incrementalUpdates }}
            </div>
            <div class="metric-subtitle">
              / {{ performanceMetrics.totalCalculations }} 总计算
            </div>
          </div>

          <!-- 队列长度 -->
          <div class="metric-card">
            <div class="metric-header">
              <Icon name="list" size="16" />
              <span>队列长度</span>
            </div>
            <div class="metric-value">
              {{ performanceMetrics.queueLength }}
            </div>
            <div class="metric-status" :class="getQueueStatus()">
              {{ getQueueStatusText() }}
            </div>
          </div>

          <!-- 内存使用 -->
          <div class="metric-card">
            <div class="metric-header">
              <Icon name="hard-drive" size="16" />
              <span>内存使用</span>
            </div>
            <div class="metric-value">
              {{ formatBytes(performanceMetrics.memoryUsage) }}
            </div>
            <div class="metric-progress">
              <div
                class="progress-bar memory"
                :style="{ width: `${getMemoryUsagePercentage()}%` }"
              ></div>
            </div>
          </div>

          <!-- 计算效率 -->
          <div class="metric-card">
            <div class="metric-header">
              <Icon name="trending-up" size="16" />
              <span>计算效率</span>
            </div>
            <div class="metric-value">
              {{ getEfficiencyScore() }}%
            </div>
            <div class="metric-trend" :class="getEfficiencyTrend()">
              <Icon :name="getEfficiencyTrendIcon()" size="12" />
              <span>{{ getEfficiencyTrendText() }}</span>
            </div>
          </div>
        </div>

        <!-- 实时图表 -->
        <div class="charts-section">
          <div class="chart-container">
            <h3>响应时间趋势</h3>
            <div class="mini-chart">
              <svg viewBox="0 0 200 60" class="chart-svg">
                <polyline
                  :points="responseTimeChartPoints"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2"
                />
              </svg>
            </div>
          </div>

          <div class="chart-container">
            <h3>缓存命中率</h3>
            <div class="mini-chart">
              <svg viewBox="0 0 200 60" class="chart-svg">
                <polyline
                  :points="cacheHitRateChartPoints"
                  fill="none"
                  stroke="#10b981"
                  stroke-width="2"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- 详细统计 -->
        <div class="detailed-stats">
          <div class="stats-section">
            <h3>缓存统计</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">命中次数</span>
                <span class="stat-value">{{ cacheStats.hits }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">未命中次数</span>
                <span class="stat-value">{{ cacheStats.misses }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">缓存项数</span>
                <span class="stat-value">{{ cacheStats.totalItems }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均计算时间</span>
                <span class="stat-value">{{ Math.round(cacheStats.averageComputationTime) }}ms</span>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <h3>调度器统计</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">已完成任务</span>
                <span class="stat-value">{{ schedulerStats.completedTasks }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">失败任务</span>
                <span class="stat-value">{{ schedulerStats.failedTasks }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">成功率</span>
                <span class="stat-value">{{ Math.round(schedulerStats.successRate) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">吞吐量</span>
                <span class="stat-value">{{ schedulerStats.throughput.toFixed(2) }}/s</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="monitor-actions">
          <button @click="clearCache" class="action-button">
            <Icon name="trash-2" size="16" />
            清除缓存
          </button>
          <button @click="optimizeMemory" class="action-button">
            <Icon name="cpu" size="16" />
            优化内存
          </button>
          <button @click="exportStats" class="action-button">
            <Icon name="download" size="16" />
            导出统计
          </button>
          <button @click="resetStats" class="action-button danger">
            <Icon name="refresh-cw" size="16" />
            重置统计
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import type { PerformanceMetrics } from '@/composables/useOptimizedCalculation'

// Props
interface Props {
  performanceMetrics: PerformanceMetrics
  getCacheStats: () => any
  getSchedulerStats: () => any
  clearCache: () => void
  optimizeMemory: () => void
}

const props = defineProps<Props>()

// Emits
interface Emits {
  'clear-cache': []
  'optimize-memory': []
  'export-stats': []
  'reset-stats': []
}

const emit = defineEmits<Emits>()

// 响应式数据
const isExpanded = ref(false)
const responseTimeHistory = ref<number[]>([])
const cacheHitRateHistory = ref<number[]>([])
const updateTimer = ref<NodeJS.Timeout>()

// 获取统计数据
const cacheStats = computed(() => props.getCacheStats())
const schedulerStats = computed(() => props.getSchedulerStats())

// 性能状态
const performanceStatus = computed(() => {
  const avgResponseTime = props.performanceMetrics.averageResponseTime
  const cacheHitRate = props.performanceMetrics.cacheHitRate
  const queueLength = props.performanceMetrics.queueLength

  if (avgResponseTime > 1000 || queueLength > 10) return 'poor'
  if (avgResponseTime > 500 || cacheHitRate < 50) return 'fair'
  if (cacheHitRate > 80 && avgResponseTime < 200) return 'excellent'
  return 'good'
})

const performanceStatusText = computed(() => {
  switch (performanceStatus.value) {
    case 'excellent': return '优秀'
    case 'good': return '良好'
    case 'fair': return '一般'
    case 'poor': return '较差'
    default: return '未知'
  }
})

// 图表数据
const responseTimeChartPoints = computed(() => {
  return generateChartPoints(responseTimeHistory.value, 200, 60)
})

const cacheHitRateChartPoints = computed(() => {
  return generateChartPoints(cacheHitRateHistory.value, 200, 60, 0, 100)
})

// 方法
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const getResponseTimeTrend = () => {
  const recent = responseTimeHistory.value.slice(-5)
  if (recent.length < 2) return 'stable'

  const trend = recent[recent.length - 1] - recent[0]
  if (trend > 50) return 'up'
  if (trend < -50) return 'down'
  return 'stable'
}

const getResponseTimeTrendIcon = () => {
  const trend = getResponseTimeTrend()
  return trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus'
}

const getResponseTimeTrendText = () => {
  const trend = getResponseTimeTrend()
  return trend === 'up' ? '上升' : trend === 'down' ? '下降' : '稳定'
}

const getQueueStatus = () => {
  const queueLength = props.performanceMetrics.queueLength
  if (queueLength === 0) return 'idle'
  if (queueLength < 5) return 'normal'
  if (queueLength < 10) return 'busy'
  return 'overloaded'
}

const getQueueStatusText = () => {
  const status = getQueueStatus()
  switch (status) {
    case 'idle': return '空闲'
    case 'normal': return '正常'
    case 'busy': return '繁忙'
    case 'overloaded': return '过载'
    default: return '未知'
  }
}

const getMemoryUsagePercentage = () => {
  const maxMemory = 50 * 1024 * 1024 // 50MB
  return Math.min((props.performanceMetrics.memoryUsage / maxMemory) * 100, 100)
}

const getEfficiencyScore = () => {
  const cacheHitRate = props.performanceMetrics.cacheHitRate
  const incrementalRate = props.performanceMetrics.totalCalculations > 0
    ? (props.performanceMetrics.incrementalUpdates / props.performanceMetrics.totalCalculations) * 100
    : 0

  return Math.round((cacheHitRate * 0.6) + (incrementalRate * 0.4))
}

const getEfficiencyTrend = () => {
  // 简化的效率趋势计算
  const score = getEfficiencyScore()
  if (score > 80) return 'excellent'
  if (score > 60) return 'good'
  if (score > 40) return 'fair'
  return 'poor'
}

const getEfficiencyTrendIcon = () => {
  const trend = getEfficiencyTrend()
  return trend === 'excellent' || trend === 'good' ? 'trending-up' : 'trending-down'
}

const getEfficiencyTrendText = () => {
  const trend = getEfficiencyTrend()
  switch (trend) {
    case 'excellent': return '优秀'
    case 'good': return '良好'
    case 'fair': return '一般'
    case 'poor': return '较差'
    default: return '未知'
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const generateChartPoints = (data: number[], width: number, height: number, minY = 0, maxY?: number): string => {
  if (data.length === 0) return ''

  const actualMaxY = maxY || Math.max(...data, minY + 1)
  const actualMinY = Math.min(minY, ...data)
  const range = actualMaxY - actualMinY || 1

  return data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - actualMinY) / range) * height
    return `${x},${y}`
  }).join(' ')
}

const clearCache = () => {
  emit('clear-cache')
}

const optimizeMemory = () => {
  emit('optimize-memory')
}

const exportStats = () => {
  const stats = {
    performanceMetrics: props.performanceMetrics,
    cacheStats: cacheStats.value,
    schedulerStats: schedulerStats.value,
    timestamp: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-stats-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  emit('export-stats')
}

const resetStats = () => {
  responseTimeHistory.value = []
  cacheHitRateHistory.value = []
  emit('reset-stats')
}

const updateHistories = () => {
  responseTimeHistory.value.push(props.performanceMetrics.averageResponseTime)
  cacheHitRateHistory.value.push(props.performanceMetrics.cacheHitRate)

  // 保持最近50个数据点
  if (responseTimeHistory.value.length > 50) {
    responseTimeHistory.value.shift()
  }
  if (cacheHitRateHistory.value.length > 50) {
    cacheHitRateHistory.value.shift()
  }
}

// 监听器
watch(() => props.performanceMetrics, updateHistories, { deep: true })

// 生命周期
onMounted(() => {
  updateTimer.value = setInterval(updateHistories, 1000)
})

onUnmounted(() => {
  if (updateTimer.value) {
    clearInterval(updateTimer.value)
  }
})
</script>

<style scoped>
.performance-monitor {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden;
  @apply transition-all duration-300;
}

.performance-monitor.expanded {
  @apply shadow-lg;
}

/* 监控头部 */
.monitor-header {
  @apply flex items-center justify-between p-4 cursor-pointer;
  @apply hover:bg-gray-50 transition-colors;
}

.header-left {
  @apply flex items-center gap-3;
}

.title {
  @apply font-semibold text-gray-800;
}

.status-indicator {
  @apply flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium;
}

.status-indicator.excellent {
  @apply bg-green-100 text-green-700;
}

.status-indicator.good {
  @apply bg-blue-100 text-blue-700;
}

.status-indicator.fair {
  @apply bg-yellow-100 text-yellow-700;
}

.status-indicator.poor {
  @apply bg-red-100 text-red-700;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.status-indicator.excellent .status-dot {
  @apply bg-green-500;
}

.status-indicator.good .status-dot {
  @apply bg-blue-500;
}

.status-indicator.fair .status-dot {
  @apply bg-yellow-500;
}

.status-indicator.poor .status-dot {
  @apply bg-red-500;
}

.header-right {
  @apply flex items-center gap-3;
}

.quick-stats {
  @apply flex gap-3 text-sm text-gray-600;
}

.stat {
  @apply font-mono;
}

.expand-icon {
  @apply text-gray-400 transition-transform;
}

/* 监控面板 */
.monitor-panel {
  @apply border-t border-gray-200 p-4 space-y-6;
}

.panel-expand-enter-active,
.panel-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.panel-expand-enter-from,
.panel-expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.panel-expand-enter-to,
.panel-expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}

/* 指标网格 */
.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.metric-card {
  @apply bg-gray-50 rounded-lg p-4 border border-gray-100;
}

.metric-header {
  @apply flex items-center gap-2 text-sm text-gray-600 mb-2;
}

.metric-value {
  @apply text-2xl font-bold text-gray-900 mb-1;
}

.metric-subtitle {
  @apply text-sm text-gray-500;
}

.metric-trend {
  @apply flex items-center gap-1 text-xs font-medium;
}

.metric-trend.up {
  @apply text-red-600;
}

.metric-trend.down {
  @apply text-green-600;
}

.metric-trend.stable {
  @apply text-gray-600;
}

.metric-trend.excellent {
  @apply text-green-600;
}

.metric-trend.good {
  @apply text-blue-600;
}

.metric-trend.fair {
  @apply text-yellow-600;
}

.metric-trend.poor {
  @apply text-red-600;
}

.metric-progress {
  @apply w-full bg-gray-200 rounded-full h-2 mt-2;
}

.progress-bar {
  @apply bg-blue-500 h-2 rounded-full transition-all duration-300;
}

.progress-bar.memory {
  @apply bg-purple-500;
}

.metric-status {
  @apply text-xs font-medium px-2 py-1 rounded-full;
}

.metric-status.idle {
  @apply bg-gray-100 text-gray-600;
}

.metric-status.normal {
  @apply bg-green-100 text-green-600;
}

.metric-status.busy {
  @apply bg-yellow-100 text-yellow-600;
}

.metric-status.overloaded {
  @apply bg-red-100 text-red-600;
}

/* 图表区域 */
.charts-section {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.chart-container {
  @apply bg-gray-50 rounded-lg p-4;
}

.chart-container h3 {
  @apply text-sm font-medium text-gray-700 mb-3;
}

.mini-chart {
  @apply h-16;
}

.chart-svg {
  @apply w-full h-full;
}

/* 详细统计 */
.detailed-stats {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.stats-section h3 {
  @apply text-sm font-medium text-gray-700 mb-3;
}

.stats-grid {
  @apply grid grid-cols-2 gap-3;
}

.stat-item {
  @apply bg-white rounded-lg p-3 border border-gray-100;
}

.stat-label {
  @apply block text-xs text-gray-500 mb-1;
}

.stat-value {
  @apply text-lg font-semibold text-gray-900;
}

/* 操作按钮 */
.monitor-actions {
  @apply flex flex-wrap gap-2 pt-4 border-t border-gray-200;
}

.action-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply transition-colors;
}

.action-button.danger {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid {
    @apply grid-cols-1;
  }

  .charts-section {
    @apply grid-cols-1;
  }

  .detailed-stats {
    @apply grid-cols-1;
  }

  .monitor-actions {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .performance-monitor {
    @apply bg-gray-800 border-gray-700;
  }

  .monitor-header:hover {
    @apply bg-gray-700;
  }

  .title {
    @apply text-gray-100;
  }

  .monitor-panel {
    @apply border-gray-700;
  }

  .metric-card {
    @apply bg-gray-700 border-gray-600;
  }

  .metric-value {
    @apply text-gray-100;
  }

  .chart-container {
    @apply bg-gray-700;
  }

  .stat-item {
    @apply bg-gray-800 border-gray-600;
  }

  .stat-value {
    @apply text-gray-100;
  }

  .action-button {
    @apply bg-gray-700 text-gray-200 hover:bg-gray-600;
  }
}

/* 动画优化 */
@media (prefers-reduced-motion: reduce) {
  .performance-monitor,
  .panel-expand-enter-active,
  .panel-expand-leave-active,
  .progress-bar {
    transition: none;
  }
}
</style>
