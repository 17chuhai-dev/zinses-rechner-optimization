<template>
  <div class="performance-dashboard p-6 bg-gray-50 min-h-screen">
    <!-- 头部信息 -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p class="text-gray-600 mt-1">Real-time Core Web Vitals monitoring</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div :class="[
              'w-3 h-3 rounded-full',
              isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            ]"></div>
            <span class="text-sm text-gray-600">
              {{ isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped' }}
            </span>
          </div>
          <button
            @click="exportData('json')"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export Report
          </button>
        </div>
      </div>
      
      <!-- 最后更新时间 -->
      <div v-if="lastUpdate" class="text-sm text-gray-500 mt-2">
        Last updated: {{ formatTime(lastUpdate) }}
      </div>
    </div>

    <!-- 性能评分卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <!-- 总体评分 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Performance Score</p>
            <p class="text-3xl font-bold mt-2" :class="getScoreColor(performanceScore)">
              {{ performanceScore }}
            </p>
          </div>
          <div class="text-right">
            <div :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              getGradeColor(performanceGrade.grade)
            ]">
              {{ performanceGrade.grade }}
            </div>
            <p class="text-xs text-gray-500 mt-1">{{ performanceGrade.description }}</p>
          </div>
        </div>
      </div>

      <!-- 活跃告警 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Alerts</p>
            <p class="text-3xl font-bold mt-2" :class="activeAlerts.length > 0 ? 'text-red-600' : 'text-green-600'">
              {{ activeAlerts.length }}
            </p>
          </div>
          <div class="text-2xl">
            {{ activeAlerts.length > 0 ? '🚨' : '✅' }}
          </div>
        </div>
      </div>

      <!-- 资源大小 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Resources</p>
            <p class="text-3xl font-bold mt-2 text-blue-600">
              {{ formatBytes(metrics.resources.totalSize) }}
            </p>
          </div>
          <div class="text-2xl">📦</div>
        </div>
      </div>

      <!-- 请求数量 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">HTTP Requests</p>
            <p class="text-3xl font-bold mt-2 text-purple-600">
              {{ metrics.resources.requestCount }}
            </p>
          </div>
          <div class="text-2xl">🌐</div>
        </div>
      </div>
    </div>

    <!-- Core Web Vitals -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Web Vitals指标 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Core Web Vitals</h2>
        <div class="space-y-6">
          <!-- LCP -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <p class="font-medium text-gray-900">Largest Contentful Paint</p>
                <p class="text-sm text-gray-500">LCP measures loading performance</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold" :class="getMetricColor('lcp', metrics.webVitals.lcp)">
                {{ formatMetric('lcp', metrics.webVitals.lcp) }}
              </p>
              <p class="text-xs text-gray-500">Target: &lt; 2.5s</p>
            </div>
          </div>

          <!-- FID -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <p class="font-medium text-gray-900">First Input Delay</p>
                <p class="text-sm text-gray-500">FID measures interactivity</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold" :class="getMetricColor('fid', metrics.webVitals.fid)">
                {{ formatMetric('fid', metrics.webVitals.fid) }}
              </p>
              <p class="text-xs text-gray-500">Target: &lt; 100ms</p>
            </div>
          </div>

          <!-- CLS -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div>
                <p class="font-medium text-gray-900">Cumulative Layout Shift</p>
                <p class="text-sm text-gray-500">CLS measures visual stability</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold" :class="getMetricColor('cls', metrics.webVitals.cls)">
                {{ formatMetric('cls', metrics.webVitals.cls) }}
              </p>
              <p class="text-xs text-gray-500">Target: &lt; 0.1</p>
            </div>
          </div>

          <!-- TTFB -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div>
                <p class="font-medium text-gray-900">Time to First Byte</p>
                <p class="text-sm text-gray-500">TTFB measures server response</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold" :class="getMetricColor('ttfb', metrics.webVitals.ttfb)">
                {{ formatMetric('ttfb', metrics.webVitals.ttfb) }}
              </p>
              <p class="text-xs text-gray-500">Target: &lt; 800ms</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 资源分析 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Resource Analysis</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">JavaScript</span>
            <div class="flex items-center space-x-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-yellow-500 h-2 rounded-full" 
                  :style="{ width: `${getResourcePercentage('js')}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium">{{ formatBytes(metrics.resources.jsSize) }}</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-gray-600">Images</span>
            <div class="flex items-center space-x-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-blue-500 h-2 rounded-full" 
                  :style="{ width: `${getResourcePercentage('image')}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium">{{ formatBytes(metrics.resources.imageSize) }}</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-gray-600">CSS</span>
            <div class="flex items-center space-x-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-green-500 h-2 rounded-full" 
                  :style="{ width: `${getResourcePercentage('css')}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium">{{ formatBytes(metrics.resources.cssSize) }}</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-gray-600">Fonts</span>
            <div class="flex items-center space-x-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-purple-500 h-2 rounded-full" 
                  :style="{ width: `${getResourcePercentage('font')}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium">{{ formatBytes(metrics.resources.fontSize) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 告警和建议 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 活跃告警 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Active Alerts</h2>
        <div v-if="activeAlerts.length === 0" class="text-center py-8">
          <div class="text-6xl mb-4">✅</div>
          <p class="text-gray-500">No active performance alerts</p>
        </div>
        <div v-else class="space-y-4">
          <div 
            v-for="alert in activeAlerts" 
            :key="alert.metric"
            :class="[
              'p-4 rounded-lg border-l-4',
              getSeverityColor(alert.severity)
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">{{ alert.description }}</p>
                <p class="text-sm text-gray-600 mt-1">
                  Current: {{ formatMetric(alert.metric, alert.value) }} 
                  (Threshold: {{ formatMetric(alert.metric, alert.threshold) }})
                </p>
              </div>
              <div :class="[
                'px-2 py-1 rounded text-xs font-medium',
                getSeverityBadgeColor(alert.severity)
              ]">
                {{ alert.severity.toUpperCase() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 优化建议 -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Optimization Recommendations</h2>
        <div class="space-y-4">
          <div 
            v-for="(recommendation, index) in generateRecommendations()" 
            :key="index"
            class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
          >
            <div class="text-blue-600 mt-0.5">💡</div>
            <p class="text-sm text-gray-700">{{ recommendation }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePerformanceMonitoring } from '../../composables/usePerformanceMonitoring'

const {
  metrics,
  activeAlerts,
  isMonitoring,
  lastUpdate,
  performanceScore,
  performanceGrade,
  exportData
} = usePerformanceMonitoring()

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化字节
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 格式化指标
const formatMetric = (metric: string, value: number | null) => {
  if (value === null) return 'N/A'
  
  switch (metric) {
    case 'lcp':
    case 'fid':
    case 'ttfb':
      return `${(value / 1000).toFixed(2)}s`
    case 'cls':
      return value.toFixed(3)
    default:
      return value.toString()
  }
}

// 获取评分颜色
const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-yellow-600'
  if (score >= 60) return 'text-orange-600'
  return 'text-red-600'
}

// 获取等级颜色
const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-800'
    case 'B': return 'bg-blue-100 text-blue-800'
    case 'C': return 'bg-yellow-100 text-yellow-800'
    case 'D': return 'bg-orange-100 text-orange-800'
    case 'F': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// 获取指标颜色
const getMetricColor = (metric: string, value: number | null) => {
  if (value === null) return 'text-gray-500'
  
  const thresholds: Record<string, { good: number; poor: number }> = {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    ttfb: { good: 800, poor: 1800 }
  }
  
  const threshold = thresholds[metric]
  if (!threshold) return 'text-gray-900'
  
  if (value <= threshold.good) return 'text-green-600'
  if (value <= threshold.poor) return 'text-yellow-600'
  return 'text-red-600'
}

// 获取资源百分比
const getResourcePercentage = (type: string) => {
  const total = metrics.resources.totalSize
  if (total === 0) return 0
  
  switch (type) {
    case 'js': return Math.round((metrics.resources.jsSize / total) * 100)
    case 'image': return Math.round((metrics.resources.imageSize / total) * 100)
    case 'css': return Math.round((metrics.resources.cssSize / total) * 100)
    case 'font': return Math.round((metrics.resources.fontSize / total) * 100)
    default: return 0
  }
}

// 获取严重程度颜色
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-50 border-red-500'
    case 'high': return 'bg-orange-50 border-orange-500'
    case 'medium': return 'bg-yellow-50 border-yellow-500'
    case 'low': return 'bg-blue-50 border-blue-500'
    default: return 'bg-gray-50 border-gray-500'
  }
}

const getSeverityBadgeColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// 生成建议
const generateRecommendations = () => {
  const recommendations = []
  
  if (metrics.webVitals.lcp && metrics.webVitals.lcp > 2500) {
    recommendations.push('Optimize LCP: Consider image optimization, reduce server response time, or implement resource preloading')
  }
  
  if (metrics.webVitals.fid && metrics.webVitals.fid > 100) {
    recommendations.push('Improve FID: Reduce JavaScript execution time, use Web Workers, or defer non-critical scripts')
  }
  
  if (metrics.webVitals.cls && metrics.webVitals.cls > 0.1) {
    recommendations.push('Fix CLS: Set dimensions for images and ads, avoid dynamically injected content above the fold')
  }
  
  if (metrics.resources.totalSize > 2 * 1024 * 1024) {
    recommendations.push('Reduce bundle size: Enable compression, remove unused code, implement code splitting')
  }
  
  if (metrics.resources.jsSize > 500 * 1024) {
    recommendations.push('Optimize JavaScript: Implement lazy loading, use tree shaking, consider modern bundling techniques')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Great job! Your performance metrics are within acceptable ranges.')
  }
  
  return recommendations
}
</script>

<style scoped>
.performance-dashboard {
  font-family: 'Inter', sans-serif;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>
