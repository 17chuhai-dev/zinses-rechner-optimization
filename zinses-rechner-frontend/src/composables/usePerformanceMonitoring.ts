/**
 * 性能监控仪表盘和告警系统
 * 集成所有性能指标，提供实时监控和告警功能
 */

import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

// 全局变量声明
declare const gtag: (...args: any[]) => void

// web-vitals类型定义
interface Metric {
  name: string
  value: number
  delta: number
  id: string
  entries: PerformanceEntry[]
  navigationType?: string
}

// 扩展PerformanceNavigationTiming接口
declare global {
  interface PerformanceNavigationTiming {
    navigationStart?: number
  }
}
import { useWebVitals } from './useWebVitals'
import { useResourceOptimization } from './useResourceOptimization'

// 性能指标接口
interface PerformanceMetrics {
  webVitals: {
    lcp: number | null
    fid: number | null
    cls: number | null
    ttfb: number | null
    fcp: number | null
  }
  resources: {
    totalSize: number
    imageSize: number
    jsSize: number
    cssSize: number
    fontSize: number
    requestCount: number
  }
  timing: {
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
    firstContentfulPaint: number
  }
  memory: {
    used: number
    total: number
    limit: number
  } | null
  network: {
    effectiveType: string
    downlink: number
    rtt: number
  } | null
  errors: Array<{
    message: string
    source: string
    line: number
    column: number
    timestamp: number
  }>
}

// 性能告警配置
interface AlertConfig {
  metric: string
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  description: string
}

// 默认告警配置
const DEFAULT_ALERTS: AlertConfig[] = [
  {
    metric: 'lcp',
    threshold: 2500,
    severity: 'medium',
    enabled: true,
    description: 'Largest Contentful Paint > 2.5s'
  },
  {
    metric: 'fid',
    threshold: 100,
    severity: 'high',
    enabled: true,
    description: 'First Input Delay > 100ms'
  },
  {
    metric: 'cls',
    threshold: 0.1,
    severity: 'medium',
    enabled: true,
    description: 'Cumulative Layout Shift > 0.1'
  },
  {
    metric: 'ttfb',
    threshold: 800,
    severity: 'high',
    enabled: true,
    description: 'Time to First Byte > 800ms'
  },
  {
    metric: 'totalSize',
    threshold: 2 * 1024 * 1024, // 2MB
    severity: 'medium',
    enabled: true,
    description: 'Total resource size > 2MB'
  },
  {
    metric: 'jsSize',
    threshold: 500 * 1024, // 500KB
    severity: 'low',
    enabled: true,
    description: 'JavaScript size > 500KB'
  }
]

// 性能监控Composable
export function usePerformanceMonitoring() {
  const metrics = reactive<PerformanceMetrics>({
    webVitals: {
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      fcp: null
    },
    resources: {
      totalSize: 0,
      imageSize: 0,
      jsSize: 0,
      cssSize: 0,
      fontSize: 0,
      requestCount: 0
    },
    timing: {
      domContentLoaded: 0,
      loadComplete: 0,
      firstPaint: 0,
      firstContentfulPaint: 0
    },
    memory: null,
    network: null,
    errors: []
  })

  const alerts = ref<AlertConfig[]>([...DEFAULT_ALERTS])
  const activeAlerts = ref<Array<AlertConfig & { value: number; timestamp: number }>>([])
  const isMonitoring = ref(false)
  const lastUpdate = ref<Date | null>(null)

  // 性能评分计算
  const performanceScore = computed(() => {
    const scores = {
      lcp: metrics.webVitals.lcp ? (metrics.webVitals.lcp <= 2500 ? 100 : metrics.webVitals.lcp <= 4000 ? 50 : 0) : 100,
      fid: metrics.webVitals.fid ? (metrics.webVitals.fid <= 100 ? 100 : metrics.webVitals.fid <= 300 ? 50 : 0) : 100,
      cls: metrics.webVitals.cls ? (metrics.webVitals.cls <= 0.1 ? 100 : metrics.webVitals.cls <= 0.25 ? 50 : 0) : 100,
      ttfb: metrics.webVitals.ttfb ? (metrics.webVitals.ttfb <= 800 ? 100 : metrics.webVitals.ttfb <= 1800 ? 50 : 0) : 100
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
    return Math.round(totalScore / Object.keys(scores).length)
  })

  // 性能等级
  const performanceGrade = computed(() => {
    const score = performanceScore.value
    if (score >= 90) return { grade: 'A', color: 'green', description: 'Excellent' }
    if (score >= 80) return { grade: 'B', color: 'blue', description: 'Good' }
    if (score >= 70) return { grade: 'C', color: 'yellow', description: 'Needs Improvement' }
    if (score >= 60) return { grade: 'D', color: 'orange', description: 'Poor' }
    return { grade: 'F', color: 'red', description: 'Critical' }
  })

  // 收集Web Vitals指标
  const collectWebVitals = async () => {
    const { initWebVitals } = useWebVitals()

    // 监听Web Vitals指标
    const handleMetric = (metric: any) => {
      const metricName = metric.name.toLowerCase()
      if (metricName in metrics.webVitals) {
        metrics.webVitals[metricName as keyof typeof metrics.webVitals] = metric.value
        checkAlerts(metricName, metric.value)
      }
    }

    // 动态导入并初始化Web Vitals
    try {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals' as any)

      getCLS(handleMetric)
      getFID(handleMetric)
      getFCP(handleMetric)
      getLCP(handleMetric)
      getTTFB(handleMetric)

    } catch (error) {
      console.error('Failed to collect Web Vitals:', error)
    }
  }

  // 收集资源指标
  const collectResourceMetrics = () => {
    if (!window.performance) return

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    metrics.resources = {
      totalSize: 0,
      imageSize: 0,
      jsSize: 0,
      cssSize: 0,
      fontSize: 0,
      requestCount: resources.length
    }

    resources.forEach(resource => {
      const size = resource.transferSize || 0
      metrics.resources.totalSize += size

      switch (resource.initiatorType) {
        case 'img':
          metrics.resources.imageSize += size
          break
        case 'script':
          metrics.resources.jsSize += size
          break
        case 'link':
          if (resource.name.includes('.css')) {
            metrics.resources.cssSize += size
          }
          break
        default:
          if (resource.name.includes('font')) {
            metrics.resources.fontSize += size
          }
      }
    })

    // 检查资源大小告警
    checkAlerts('totalSize', metrics.resources.totalSize)
    checkAlerts('jsSize', metrics.resources.jsSize)
  }

  // 收集时间指标
  const collectTimingMetrics = () => {
    if (!window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    metrics.timing = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - (navigation.navigationStart || 0),
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    }
  }

  // 收集内存指标
  const collectMemoryMetrics = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
  }

  // 收集网络指标
  const collectNetworkMetrics = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      metrics.network = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      }
    }
  }

  // 错误监控
  const monitorErrors = () => {
    window.addEventListener('error', (event) => {
      metrics.errors.push({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now()
      })

      // 限制错误数量
      if (metrics.errors.length > 50) {
        metrics.errors = metrics.errors.slice(-25)
      }
    })

    window.addEventListener('unhandledrejection', (event) => {
      metrics.errors.push({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        source: 'Promise',
        line: 0,
        column: 0,
        timestamp: Date.now()
      })
    })
  }

  // 检查告警
  const checkAlerts = (metricName: string, value: number) => {
    const alertConfig = alerts.value.find(alert => alert.metric === metricName && alert.enabled)
    if (!alertConfig) return

    const shouldAlert = value > alertConfig.threshold
    const existingAlert = activeAlerts.value.find(alert => alert.metric === metricName)

    if (shouldAlert && !existingAlert) {
      // 触发新告警
      const newAlert = {
        ...alertConfig,
        value,
        timestamp: Date.now()
      }
      activeAlerts.value.push(newAlert)

      console.warn(`🚨 Performance Alert: ${alertConfig.description}`, { value, threshold: alertConfig.threshold })

      // 发送告警到分析系统
      sendAlert(newAlert)

    } else if (!shouldAlert && existingAlert) {
      // 清除告警
      const index = activeAlerts.value.indexOf(existingAlert)
      if (index > -1) {
        activeAlerts.value.splice(index, 1)
        console.log(`✅ Performance Alert Resolved: ${alertConfig.description}`)
      }
    }
  }

  // 发送告警
  const sendAlert = async (alert: AlertConfig & { value: number; timestamp: number }) => {
    try {
      await fetch('/api/analytics/performance-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...alert,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: alert.timestamp
        })
      })
    } catch (error) {
      console.error('Failed to send performance alert:', error)
    }

    // Google Analytics事件
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_alert', {
        event_category: 'Performance',
        event_label: alert.metric,
        value: Math.round(alert.value),
        custom_map: {
          metric: alert.metric,
          threshold: alert.threshold,
          severity: alert.severity,
          description: alert.description
        }
      })
    }
  }

  // 收集所有指标
  const collectAllMetrics = async () => {
    await collectWebVitals()
    collectResourceMetrics()
    collectTimingMetrics()
    collectMemoryMetrics()
    collectNetworkMetrics()

    lastUpdate.value = new Date()

    console.log('📊 Performance metrics collected:', metrics)
  }

  // 开始监控
  const startMonitoring = () => {
    if (isMonitoring.value) return

    isMonitoring.value = true

    // 立即收集一次指标
    collectAllMetrics()

    // 设置定期收集
    const interval = setInterval(() => {
      collectResourceMetrics()
      collectMemoryMetrics()
      collectNetworkMetrics()
      lastUpdate.value = new Date()
    }, 30000) // 每30秒更新一次

    // 监控错误
    monitorErrors()

    // 清理函数
    onUnmounted(() => {
      clearInterval(interval)
      isMonitoring.value = false
    })

    console.log('🚀 Performance monitoring started')
  }

  // 停止监控
  const stopMonitoring = () => {
    isMonitoring.value = false
    console.log('⏹️ Performance monitoring stopped')
  }

  // 生成性能报告
  const generateReport = () => {
    return {
      timestamp: new Date().toISOString(),
      score: performanceScore.value,
      grade: performanceGrade.value,
      metrics: { ...metrics },
      alerts: [...activeAlerts.value],
      recommendations: generateRecommendations()
    }
  }

  // 生成优化建议
  const generateRecommendations = () => {
    const recommendations = []

    if (metrics.webVitals.lcp && metrics.webVitals.lcp > 2500) {
      recommendations.push('优化LCP: 考虑优化图片加载、减少服务器响应时间')
    }

    if (metrics.webVitals.fid && metrics.webVitals.fid > 100) {
      recommendations.push('优化FID: 减少JavaScript执行时间、使用Web Workers')
    }

    if (metrics.webVitals.cls && metrics.webVitals.cls > 0.1) {
      recommendations.push('优化CLS: 为图片和广告设置尺寸、避免动态插入内容')
    }

    if (metrics.resources.totalSize > 2 * 1024 * 1024) {
      recommendations.push('减少资源大小: 压缩图片、启用Gzip、移除未使用的代码')
    }

    if (metrics.resources.jsSize > 500 * 1024) {
      recommendations.push('优化JavaScript: 代码分割、懒加载、Tree Shaking')
    }

    return recommendations
  }

  // 导出性能数据
  const exportData = (format: 'json' | 'csv' = 'json') => {
    const report = generateReport()

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-report-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    // CSV导出可以在这里实现
  }

  onMounted(() => {
    // 延迟启动监控
    setTimeout(() => {
      startMonitoring()
    }, 1000)
  })

  return {
    metrics,
    alerts,
    activeAlerts,
    isMonitoring,
    lastUpdate,
    performanceScore,
    performanceGrade,
    startMonitoring,
    stopMonitoring,
    collectAllMetrics,
    generateReport,
    exportData
  }
}
