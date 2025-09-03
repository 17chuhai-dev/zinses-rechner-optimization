/**
 * Web Vitals性能监控
 * 实现Core Web Vitals指标收集和Google Analytics 4集成
 */

import { onMounted, onUnmounted } from 'vue'
// import type { Metric } from 'web-vitals' // 暂时注释掉以避免模块缺失错误

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

// Web Vitals指标类型
interface WebVitalsMetric {
  name: string
  value: number
  id: string
  delta: number
  rating: 'good' | 'needs-improvement' | 'poor'
  navigationType: string
  timestamp: number
}

// 性能目标配置
const PERFORMANCE_TARGETS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  FCP: { good: 1800, poor: 3000 }  // First Contentful Paint
}

// 评级函数
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const target = PERFORMANCE_TARGETS[name as keyof typeof PERFORMANCE_TARGETS]
  if (!target) return 'good'

  if (value <= target.good) return 'good'
  if (value <= target.poor) return 'needs-improvement'
  return 'poor'
}

// Google Analytics 4事件发送
function sendToGA4(metric: WebVitalsMetric) {
  if (typeof gtag === 'undefined') {
    console.warn('Google Analytics not loaded')
    return
  }

  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    custom_map: {
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating
    },
    non_interaction: true
  })
}

// 自定义分析端点发送
async function sendToCustomAnalytics(metric: WebVitalsMetric) {
  try {
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...metric,
        url: window.location.href,
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.error('Failed to send custom analytics:', error)
  }
}

// 性能指标处理函数
function handleMetric(metric: Metric) {
  const webVitalsMetric: WebVitalsMetric = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta,
    rating: getRating(metric.name, metric.value),
    navigationType: metric.navigationType || 'unknown',
    timestamp: Date.now()
  }

  // 发送到Google Analytics 4
  sendToGA4(webVitalsMetric)

  // 发送到自定义分析
  sendToCustomAnalytics(webVitalsMetric)

  // 控制台日志（开发环境）
  if (import.meta.env.DEV) {
    console.log(`${metric.name}: ${metric.value} (${webVitalsMetric.rating})`, metric)
  }

  // 性能警告
  if (webVitalsMetric.rating === 'poor') {
    console.warn(`⚠️ Poor ${metric.name} performance: ${metric.value}`)
  }
}

// Web Vitals监控Composable
export function useWebVitals() {
  let metricsCollected = false

  const initWebVitals = async () => {
    if (metricsCollected) return

    try {
      // 动态导入web-vitals库
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals' as any)

      // 收集所有Core Web Vitals指标
      getCLS(handleMetric)
      getFID(handleMetric)
      getFCP(handleMetric)
      getLCP(handleMetric)
      getTTFB(handleMetric)

      metricsCollected = true

      console.log('✅ Web Vitals monitoring initialized')

    } catch (error) {
      console.error('Failed to initialize Web Vitals:', error)
    }
  }

  // 手动收集性能指标
  const collectCustomMetrics = () => {
    if (!window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    const customMetrics = {
      // 导航时间
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      domComplete: navigation.domComplete - (navigation.navigationStart || 0),
      loadComplete: navigation.loadEventEnd - (navigation.navigationStart || 0),

      // 绘制时间
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,

      // 资源时间
      resourceCount: performance.getEntriesByType('resource').length,

      // 内存使用（如果支持）
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null
    }

    // 发送自定义指标
    sendToCustomAnalytics({
      name: 'custom_metrics',
      value: 0,
      id: 'custom-' + Date.now(),
      delta: 0,
      rating: 'good',
      navigationType: 'navigate',
      timestamp: Date.now(),
      ...customMetrics
    } as any)

    return customMetrics
  }

  // 监控长任务
  const observeLongTasks = () => {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // 长任务阈值50ms
            console.warn(`🐌 Long task detected: ${entry.duration}ms`, entry)

            // 发送长任务指标
            sendToCustomAnalytics({
              name: 'long_task',
              value: entry.duration,
              id: 'longtask-' + Date.now(),
              delta: 0,
              rating: entry.duration > 100 ? 'poor' : 'needs-improvement',
              navigationType: 'navigate',
              timestamp: Date.now()
            } as any)
          }
        }
      })

      observer.observe({ entryTypes: ['longtask'] })

      return observer
    } catch (error) {
      console.error('Failed to observe long tasks:', error)
    }
  }

  // 监控布局偏移
  const observeLayoutShifts = () => {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).hadRecentInput) continue // 忽略用户输入导致的偏移

          const layoutShift = entry as any
          if (layoutShift.value > 0.1) {
            console.warn(`📐 Significant layout shift: ${layoutShift.value}`, entry)
          }
        }
      })

      observer.observe({ entryTypes: ['layout-shift'] })

      return observer
    } catch (error) {
      console.error('Failed to observe layout shifts:', error)
    }
  }

  // 获取性能报告
  const getPerformanceReport = () => {
    const customMetrics = collectCustomMetrics()

    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      customMetrics,
      recommendations: generateRecommendations(customMetrics)
    }
  }

  // 生成性能建议
  const generateRecommendations = (metrics: any) => {
    const recommendations = []

    if (metrics.firstContentfulPaint > 3000) {
      recommendations.push('考虑优化关键渲染路径以改善FCP')
    }

    if (metrics.resourceCount > 100) {
      recommendations.push('考虑减少HTTP请求数量或使用资源合并')
    }

    if (metrics.memoryUsage && metrics.memoryUsage.used > 50 * 1024 * 1024) {
      recommendations.push('内存使用较高，考虑优化JavaScript代码')
    }

    return recommendations
  }

  onMounted(() => {
    // 延迟初始化以避免影响页面加载
    setTimeout(() => {
      initWebVitals()
      observeLongTasks()
      observeLayoutShifts()
    }, 1000)
  })

  return {
    initWebVitals,
    collectCustomMetrics,
    getPerformanceReport,
    observeLongTasks,
    observeLayoutShifts
  }
}

// 性能监控装饰器
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const start = performance.now()

    try {
      const result = fn(...args)

      // 如果是Promise，监控异步执行时间
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          console.log(`⏱️ ${name} completed in ${duration.toFixed(2)}ms`)

          if (duration > 100) {
            console.warn(`🐌 Slow operation: ${name} took ${duration.toFixed(2)}ms`)
          }
        })
      }

      const duration = performance.now() - start
      console.log(`⏱️ ${name} completed in ${duration.toFixed(2)}ms`)

      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }) as T
}

// 全局性能监控初始化
export function initGlobalPerformanceMonitoring() {
  // 监控页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // 页面隐藏时发送最终指标
      const report = useWebVitals().getPerformanceReport()
      navigator.sendBeacon('/api/analytics/page-unload', JSON.stringify(report))
    }
  })

  // 监控页面卸载
  window.addEventListener('beforeunload', () => {
    const report = useWebVitals().getPerformanceReport()
    navigator.sendBeacon('/api/analytics/page-unload', JSON.stringify(report))
  })

  console.log('🚀 Global performance monitoring initialized')
}
