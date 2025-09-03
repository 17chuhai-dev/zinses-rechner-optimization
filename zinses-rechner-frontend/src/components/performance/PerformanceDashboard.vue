<!--
  性能监控仪表板
  提供实时性能监控、优化建议、性能分析等功能
-->

<template>
  <div class="performance-dashboard p-6">
    <!-- 头部概览 -->
    <div class="dashboard-header mb-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p class="text-gray-600 mt-1">Überwachen und optimieren Sie die Anwendungsleistung</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="performance-score-badge">
            <div class="text-center">
              <div :class="[
                'text-3xl font-bold',
                getScoreColor(performanceScore)
              ]">
                {{ performanceScore }}
              </div>
              <div class="text-sm text-gray-600">Performance Score</div>
            </div>
          </div>
          <BaseButton
            variant="primary"
            @click="runOptimization"
            :loading="state.isOptimizing"
          >
            <BoltIcon class="w-4 h-4 mr-2" />
            Optimieren
          </BaseButton>
        </div>
      </div>

      <!-- 优化进度 -->
      <div v-if="state.isOptimizing" class="optimization-progress mb-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-blue-900">{{ state.currentTask }}</span>
            <span class="text-sm text-blue-700">{{ Math.round(state.progress) }}%</span>
          </div>
          <div class="w-full bg-blue-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${state.progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Web Vitals 指标 -->
    <div class="web-vitals-section mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h2>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div
          v-for="vital in webVitalsMetrics"
          :key="vital.key"
          class="vital-card bg-white rounded-lg border border-gray-200 p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">{{ vital.name }}</span>
            <div :class="[
              'w-3 h-3 rounded-full',
              getVitalStatusColor(vital.value, vital.thresholds)
            ]"></div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">
            {{ formatVitalValue(vital.value, vital.unit) }}
          </div>
          <div class="text-xs text-gray-500">
            {{ vital.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- 性能指标网格 -->
    <div class="metrics-grid mb-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 缓存性能 -->
        <div class="metric-card bg-white rounded-lg border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Cache Performance</h3>
            <ServerIcon class="w-5 h-5 text-gray-400" />
          </div>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Hit Rate</span>
              <div class="flex items-center">
                <span class="text-sm font-medium text-gray-900 mr-2">
                  {{ (metrics.cache.hitRate * 100).toFixed(1) }}%
                </span>
                <div class="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-green-500 h-2 rounded-full"
                    :style="{ width: `${metrics.cache.hitRate * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Total Requests</span>
              <span class="text-sm font-medium text-gray-900">
                {{ formatNumber(metrics.cache.totalRequests) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Memory Usage</span>
              <span class="text-sm font-medium text-gray-900">
                {{ formatBytes(metrics.cache.memoryUsage) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 资源性能 -->
        <div class="metric-card bg-white rounded-lg border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Resource Performance</h3>
            <DocumentIcon class="w-5 h-5 text-gray-400" />
          </div>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Total Size</span>
              <span class="text-sm font-medium text-gray-900">
                {{ formatBytes(metrics.resources.totalSize) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Load Time</span>
              <span class="text-sm font-medium text-gray-900">
                {{ metrics.resources.loadTime.toFixed(0) }}ms
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Compression Ratio</span>
              <span class="text-sm font-medium text-gray-900">
                {{ (metrics.resources.compressionRatio * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 优化建议 -->
    <div class="suggestions-section mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Optimierungsvorschläge</h2>
        <BaseButton
          variant="ghost"
          size="sm"
          @click="refreshSuggestions"
          :loading="loadingSuggestions"
        >
          <ArrowPathIcon class="w-4 h-4 mr-2" />
          Aktualisieren
        </BaseButton>
      </div>
      
      <div v-if="suggestions.length === 0" class="text-center py-8">
        <CheckCircleIcon class="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">Alles optimal!</h3>
        <p class="text-gray-600">Keine Optimierungsvorschläge verfügbar.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="suggestion-card bg-white rounded-lg border border-gray-200 p-4"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <div :class="[
                  'w-2 h-2 rounded-full mr-3',
                  getPriorityColor(suggestion.priority)
                ]"></div>
                <h4 class="text-sm font-medium text-gray-900">{{ suggestion.title }}</h4>
                <span :class="[
                  'ml-2 px-2 py-1 text-xs rounded-full',
                  getTypeColor(suggestion.type)
                ]">
                  {{ getTypeLabel(suggestion.type) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">{{ suggestion.description }}</p>
              <div class="flex items-center text-xs text-gray-500">
                <span class="mr-4">Impact: {{ suggestion.impact }}</span>
                <span class="mr-4">Aufwand: {{ getEffortLabel(suggestion.effort) }}</span>
                <span>+{{ suggestion.estimatedImprovement }}% Performance</span>
              </div>
            </div>
            <BaseButton
              variant="outline"
              size="sm"
              @click="applySuggestion(suggestion)"
            >
              Anwenden
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时监控图表 -->
    <div class="monitoring-charts">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 性能趋势图 -->
        <div class="chart-card bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
          <div class="h-64">
            <canvas ref="performanceTrendChart" class="w-full h-full"></canvas>
          </div>
        </div>

        <!-- 资源使用图 -->
        <div class="chart-card bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
          <div class="h-64">
            <canvas ref="resourceUsageChart" class="w-full h-full"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置面板 -->
    <div v-if="showConfig" class="config-panel mt-8">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Configuration</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 缓存配置 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">Cache Settings</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600">Enable Cache</label>
                <BaseToggle v-model="config.cache.enabled" />
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-1">Max Size (MB)</label>
                <BaseInput
                  v-model.number="cacheSizeMB"
                  type="number"
                  min="1"
                  max="100"
                  size="sm"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-1">TTL (minutes)</label>
                <BaseInput
                  v-model.number="cacheTTLMinutes"
                  type="number"
                  min="1"
                  max="1440"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <!-- 监控配置 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">Monitoring Settings</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600">Web Vitals</label>
                <BaseToggle v-model="config.monitoring.webVitals" />
              </div>
              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600">Custom Metrics</label>
                <BaseToggle v-model="config.monitoring.customMetrics" />
              </div>
              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600">Performance Alerts</label>
                <BaseToggle v-model="config.monitoring.performanceAlerts" />
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <BaseButton variant="primary" @click="saveConfig">
            Konfiguration speichern
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- 配置切换按钮 -->
    <div class="fixed bottom-6 right-6">
      <BaseButton
        variant="secondary"
        @click="showConfig = !showConfig"
        class="rounded-full w-12 h-12 p-0"
      >
        <CogIcon class="w-5 h-5" />
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import {
  BoltIcon,
  ServerIcon,
  DocumentIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CogIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseToggle from '@/components/ui/BaseToggle.vue'
import { usePerformanceOptimization } from '@/services/PerformanceOptimizationManager'
import { Chart, registerables } from 'chart.js'

// 注册Chart.js组件
Chart.register(...registerables)

// 使用性能优化管理器
const {
  config,
  state,
  metrics,
  performanceScore,
  initialize,
  runOptimization,
  getOptimizationSuggestions
} = usePerformanceOptimization()

// 组件状态
const suggestions = ref<any[]>([])
const loadingSuggestions = ref(false)
const showConfig = ref(false)
const performanceTrendChart = ref<HTMLCanvasElement>()
const resourceUsageChart = ref<HTMLCanvasElement>()

// Chart.js实例
let trendChart: Chart | null = null
let usageChart: Chart | null = null

// 配置绑定
const cacheSizeMB = computed({
  get: () => config.cache.maxSize / (1024 * 1024),
  set: (value) => { config.cache.maxSize = value * 1024 * 1024 }
})

const cacheTTLMinutes = computed({
  get: () => config.cache.ttl / (60 * 1000),
  set: (value) => { config.cache.ttl = value * 60 * 1000 }
})

// Web Vitals指标
const webVitalsMetrics = computed(() => [
  {
    key: 'lcp',
    name: 'LCP',
    value: metrics.webVitals.lcp,
    unit: 'ms',
    description: 'Largest Contentful Paint',
    thresholds: { good: 2500, poor: 4000 }
  },
  {
    key: 'fid',
    name: 'FID',
    value: metrics.webVitals.fid,
    unit: 'ms',
    description: 'First Input Delay',
    thresholds: { good: 100, poor: 300 }
  },
  {
    key: 'cls',
    name: 'CLS',
    value: metrics.webVitals.cls,
    unit: '',
    description: 'Cumulative Layout Shift',
    thresholds: { good: 0.1, poor: 0.25 }
  },
  {
    key: 'ttfb',
    name: 'TTFB',
    value: metrics.webVitals.ttfb,
    unit: 'ms',
    description: 'Time to First Byte',
    thresholds: { good: 800, poor: 1800 }
  },
  {
    key: 'fcp',
    name: 'FCP',
    value: metrics.webVitals.fcp,
    unit: 'ms',
    description: 'First Contentful Paint',
    thresholds: { good: 1800, poor: 3000 }
  }
])

// 方法
const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

const getVitalStatusColor = (value: number | null, thresholds: any): string => {
  if (!value) return 'bg-gray-300'
  if (value <= thresholds.good) return 'bg-green-500'
  if (value <= thresholds.poor) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getPriorityColor = (priority: string): string => {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  }
  return colors[priority as keyof typeof colors] || 'bg-gray-500'
}

const getTypeColor = (type: string): string => {
  const colors = {
    cache: 'bg-blue-100 text-blue-800',
    preload: 'bg-green-100 text-green-800',
    resource: 'bg-purple-100 text-purple-800',
    code: 'bg-orange-100 text-orange-800',
    network: 'bg-indigo-100 text-indigo-800'
  }
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const getTypeLabel = (type: string): string => {
  const labels = {
    cache: 'Cache',
    preload: 'Preload',
    resource: 'Resource',
    code: 'Code',
    network: 'Network'
  }
  return labels[type as keyof typeof labels] || type
}

const getEffortLabel = (effort: string): string => {
  const labels = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch'
  }
  return labels[effort as keyof typeof labels] || effort
}

const formatVitalValue = (value: number | null, unit: string): string => {
  if (value === null) return '-'
  if (unit === 'ms') return `${Math.round(value)}ms`
  if (unit === '') return value.toFixed(3)
  return `${value}${unit}`
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('de-DE').format(num)
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const refreshSuggestions = async () => {
  loadingSuggestions.value = true
  try {
    suggestions.value = await getOptimizationSuggestions()
  } catch (error) {
    console.error('Failed to load suggestions:', error)
  } finally {
    loadingSuggestions.value = false
  }
}

const applySuggestion = async (suggestion: any) => {
  try {
    await suggestion.action()
    // 从建议列表中移除已应用的建议
    const index = suggestions.value.findIndex(s => s.id === suggestion.id)
    if (index > -1) {
      suggestions.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Failed to apply suggestion:', error)
  }
}

const saveConfig = () => {
  // 配置会自动保存，因为使用了响应式绑定
  console.log('Configuration saved')
}

const initializeCharts = () => {
  // 初始化性能趋势图
  if (performanceTrendChart.value) {
    const ctx = performanceTrendChart.value.getContext('2d')
    if (ctx) {
      trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({ length: 20 }, (_, i) => `${i + 1}m`),
          datasets: [{
            label: 'Performance Score',
            data: Array.from({ length: 20 }, () => Math.random() * 40 + 60),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      })
    }
  }

  // 初始化资源使用图
  if (resourceUsageChart.value) {
    const ctx = resourceUsageChart.value.getContext('2d')
    if (ctx) {
      usageChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['JavaScript', 'CSS', 'Images', 'Fonts', 'Other'],
          datasets: [{
            data: [30, 15, 35, 10, 10],
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#F59E0B',
              '#EF4444',
              '#8B5CF6'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      })
    }
  }
}

// 生命周期
onMounted(async () => {
  await initialize()
  await refreshSuggestions()
  
  nextTick(() => {
    initializeCharts()
  })
})

// 监听器
watch(() => performanceScore.value, (newScore) => {
  if (trendChart) {
    const data = trendChart.data.datasets[0].data as number[]
    data.shift()
    data.push(newScore)
    trendChart.update()
  }
})
</script>

<style scoped>
.performance-dashboard {
  @apply min-h-screen bg-gray-50;
}

.performance-score-badge {
  @apply bg-white rounded-lg border border-gray-200 p-4 shadow-sm;
}

.vital-card,
.metric-card,
.suggestion-card,
.chart-card {
  @apply transition-shadow hover:shadow-md;
}

.optimization-progress {
  @apply animate-pulse;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .metrics-grid .grid {
    @apply grid-cols-1;
  }
  
  .monitoring-charts .grid {
    @apply grid-cols-1;
  }
  
  .web-vitals-section .grid {
    @apply grid-cols-2;
  }
}
</style>
