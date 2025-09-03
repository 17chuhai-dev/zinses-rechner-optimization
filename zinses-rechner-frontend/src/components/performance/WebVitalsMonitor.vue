<!--
  Web Vitals 性能监控组件
  实时监控和显示Core Web Vitals指标
-->

<template>
  <div v-if="showMonitor" class="web-vitals-monitor">
    <!-- 开发环境性能面板 -->
    <div v-if="isDevelopment" class="performance-panel">
      <div class="panel-header">
        <h3 class="panel-title">Performance Monitor</h3>
        <button @click="togglePanel" class="toggle-btn">
          {{ isPanelExpanded ? '−' : '+' }}
        </button>
      </div>
      
      <div v-show="isPanelExpanded" class="panel-content">
        <!-- Core Web Vitals -->
        <div class="vitals-section">
          <h4>Core Web Vitals</h4>
          <div class="vitals-grid">
            <div class="vital-item" :class="getVitalStatus('fcp')">
              <div class="vital-label">FCP</div>
              <div class="vital-value">{{ formatTime(vitals.fcp) }}</div>
              <div class="vital-threshold">< 1.8s</div>
            </div>
            
            <div class="vital-item" :class="getVitalStatus('lcp')">
              <div class="vital-label">LCP</div>
              <div class="vital-value">{{ formatTime(vitals.lcp) }}</div>
              <div class="vital-threshold">< 2.5s</div>
            </div>
            
            <div class="vital-item" :class="getVitalStatus('fid')">
              <div class="vital-label">FID</div>
              <div class="vital-value">{{ formatTime(vitals.fid) }}</div>
              <div class="vital-threshold">< 100ms</div>
            </div>
            
            <div class="vital-item" :class="getVitalStatus('cls')">
              <div class="vital-label">CLS</div>
              <div class="vital-value">{{ vitals.cls.toFixed(3) }}</div>
              <div class="vital-threshold">< 0.1</div>
            </div>
          </div>
        </div>
        
        <!-- 其他性能指标 -->
        <div class="metrics-section">
          <h4>Other Metrics</h4>
          <div class="metrics-list">
            <div class="metric-item">
              <span class="metric-label">TTFB:</span>
              <span class="metric-value">{{ formatTime(vitals.ttfb) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">DOM Load:</span>
              <span class="metric-value">{{ formatTime(vitals.domLoad) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Page Load:</span>
              <span class="metric-value">{{ formatTime(vitals.pageLoad) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Memory:</span>
              <span class="metric-value">{{ formatMemory(vitals.memory) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 性能分数 -->
        <div class="score-section">
          <div class="performance-score" :class="getScoreClass(performanceScore)">
            <div class="score-value">{{ performanceScore }}</div>
            <div class="score-label">Performance Score</div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="actions-section">
          <button @click="exportMetrics" class="action-btn">
            Export Metrics
          </button>
          <button @click="clearMetrics" class="action-btn">
            Clear Data
          </button>
        </div>
      </div>
    </div>
    
    <!-- 生产环境简化指示器 -->
    <div v-else-if="showProductionIndicator" class="production-indicator">
      <div class="indicator-dot" :class="getOverallStatus()"></div>
      <div class="indicator-score">{{ performanceScore }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { logger } from '@/services/LoggingService'

interface WebVitals {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
  domLoad: number
  pageLoad: number
  memory: number
}

interface Props {
  showInProduction?: boolean
  autoExport?: boolean
  exportInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  showInProduction: false,
  autoExport: true,
  exportInterval: 60000 // 1分钟
})

// 状态
const isDevelopment = ref(import.meta.env.DEV)
const showMonitor = ref(isDevelopment.value || props.showInProduction)
const showProductionIndicator = ref(!isDevelopment.value && props.showInProduction)
const isPanelExpanded = ref(true)

const vitals = ref<WebVitals>({
  fcp: 0,
  lcp: 0,
  fid: 0,
  cls: 0,
  ttfb: 0,
  domLoad: 0,
  pageLoad: 0,
  memory: 0
})

// 性能观察器
let performanceObserver: PerformanceObserver | null = null
const navigationObserver: PerformanceObserver | null = null
let paintObserver: PerformanceObserver | null = null
let layoutShiftObserver: PerformanceObserver | null = null
let exportTimer: number | null = null

// 计算性能分数
const performanceScore = computed(() => {
  let score = 100
  const metrics = vitals.value
  
  // FCP评分 (权重: 25%)
  if (metrics.fcp > 0) {
    const fcpScore = metrics.fcp <= 1800 ? 100 : 
                     metrics.fcp <= 3000 ? 50 : 0
    score = score * 0.75 + fcpScore * 0.25
  }
  
  // LCP评分 (权重: 25%)
  if (metrics.lcp > 0) {
    const lcpScore = metrics.lcp <= 2500 ? 100 : 
                     metrics.lcp <= 4000 ? 50 : 0
    score = score * 0.75 + lcpScore * 0.25
  }
  
  // FID评分 (权重: 25%)
  if (metrics.fid > 0) {
    const fidScore = metrics.fid <= 100 ? 100 : 
                     metrics.fid <= 300 ? 50 : 0
    score = score * 0.75 + fidScore * 0.25
  }
  
  // CLS评分 (权重: 25%)
  const clsScore = metrics.cls <= 0.1 ? 100 : 
                   metrics.cls <= 0.25 ? 50 : 0
  score = score * 0.75 + clsScore * 0.25
  
  return Math.round(score)
})

// 初始化性能监控
const initializeMonitoring = () => {
  if (!('performance' in window)) {
    logger.warn('Performance API not supported', 'web-vitals')
    return
  }
  
  // 监控导航时间
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (navigation) {
    vitals.value.ttfb = navigation.responseStart - navigation.fetchStart
    vitals.value.domLoad = navigation.domContentLoadedEventEnd - navigation.fetchStart
    vitals.value.pageLoad = navigation.loadEventEnd - navigation.fetchStart
  }
  
  // 监控内存使用
  if ('memory' in performance) {
    const memory = (performance as any).memory
    vitals.value.memory = memory.usedJSHeapSize
  }
  
  // 设置Performance Observer
  if ('PerformanceObserver' in window) {
    // 监控绘制时间
    paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          vitals.value.fcp = entry.startTime
        }
      })
    })
    paintObserver.observe({ entryTypes: ['paint'] })
    
    // 监控LCP
    performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      vitals.value.lcp = lastEntry.startTime
    })
    performanceObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    
    // 监控FID
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        const fidEntry = entry as PerformanceEventTiming
        vitals.value.fid = fidEntry.processingStart - fidEntry.startTime
      })
    })
    fidObserver.observe({ entryTypes: ['first-input'] })
    
    // 监控CLS
    let clsValue = 0
    layoutShiftObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        const layoutShift = entry as any
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value
          vitals.value.cls = clsValue
        }
      })
    })
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
  }
  
  // 定期更新内存使用
  const updateMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      vitals.value.memory = memory.usedJSHeapSize
    }
  }
  
  setInterval(updateMemory, 5000) // 每5秒更新一次
}

// 格式化时间
const formatTime = (ms: number) => {
  if (ms === 0) return '-'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// 格式化内存
const formatMemory = (bytes: number) => {
  if (bytes === 0) return '-'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)}MB`
}

// 获取指标状态
const getVitalStatus = (vital: keyof WebVitals) => {
  const value = vitals.value[vital]
  if (value === 0) return 'unknown'
  
  switch (vital) {
    case 'fcp':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
    case 'lcp':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
    case 'fid':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
    case 'cls':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
    default:
      return 'unknown'
  }
}

// 获取分数等级
const getScoreClass = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'needs-improvement'
  return 'poor'
}

// 获取整体状态
const getOverallStatus = () => {
  const score = performanceScore.value
  if (score >= 90) return 'good'
  if (score >= 70) return 'needs-improvement'
  return 'poor'
}

// 切换面板
const togglePanel = () => {
  isPanelExpanded.value = !isPanelExpanded.value
}

// 导出指标
const exportMetrics = () => {
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    vitals: vitals.value,
    score: performanceScore.value
  }
  
  // 发送到分析服务
  logger.info('Web Vitals exported', 'performance', data)
  
  // 下载JSON文件（开发环境）
  if (isDevelopment.value) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `web-vitals-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// 清除指标
const clearMetrics = () => {
  vitals.value = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    domLoad: 0,
    pageLoad: 0,
    memory: 0
  }
}

// 自动导出
const setupAutoExport = () => {
  if (props.autoExport) {
    exportTimer = window.setInterval(() => {
      exportMetrics()
    }, props.exportInterval)
  }
}

// 生命周期
onMounted(() => {
  initializeMonitoring()
  setupAutoExport()
})

onUnmounted(() => {
  // 清理观察器
  if (performanceObserver) performanceObserver.disconnect()
  if (navigationObserver) navigationObserver.disconnect()
  if (paintObserver) paintObserver.disconnect()
  if (layoutShiftObserver) layoutShiftObserver.disconnect()
  
  // 清理定时器
  if (exportTimer) clearInterval(exportTimer)
})
</script>

<style scoped>
.web-vitals-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.performance-panel {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  padding: 16px;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: bold;
}

.toggle-btn {
  background: none;
  border: 1px solid #666;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vitals-section h4,
.metrics-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #ccc;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.vital-item {
  padding: 8px;
  border-radius: 4px;
  text-align: center;
  border: 1px solid #666;
}

.vital-item.good {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
}

.vital-item.needs-improvement {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
}

.vital-item.poor {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.vital-label {
  font-weight: bold;
  font-size: 10px;
  margin-bottom: 2px;
}

.vital-value {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.vital-threshold {
  font-size: 9px;
  color: #999;
}

.metrics-list {
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.metric-label {
  color: #ccc;
}

.score-section {
  text-align: center;
  margin-bottom: 16px;
}

.performance-score {
  display: inline-block;
  padding: 12px;
  border-radius: 50%;
  border: 3px solid;
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.performance-score.excellent {
  border-color: #4ade80;
  color: #4ade80;
}

.performance-score.good {
  border-color: #22d3ee;
  color: #22d3ee;
}

.performance-score.needs-improvement {
  border-color: #fbbf24;
  color: #fbbf24;
}

.performance-score.poor {
  border-color: #ef4444;
  color: #ef4444;
}

.score-value {
  font-size: 18px;
  font-weight: bold;
}

.score-label {
  font-size: 8px;
  margin-top: 2px;
}

.actions-section {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 6px 12px;
  background: #333;
  border: 1px solid #666;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
}

.action-btn:hover {
  background: #444;
}

.production-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.indicator-dot.good {
  background: #4ade80;
}

.indicator-dot.needs-improvement {
  background: #fbbf24;
}

.indicator-dot.poor {
  background: #ef4444;
}

.indicator-score {
  font-weight: bold;
  font-size: 12px;
}
</style>
