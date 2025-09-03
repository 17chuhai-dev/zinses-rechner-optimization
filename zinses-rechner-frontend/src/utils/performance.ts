/**
 * 性能监控工具
 * 实现Core Web Vitals监控和性能优化
 */

// import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals' // 暂时注释掉以避免模块缺失错误

// 临时类型定义
interface Metric {
  name: string
  value: number
  delta: number
  id: string
  entries: PerformanceEntry[]
}

// 临时函数声明
declare const getCLS: (callback: (metric: Metric) => void) => void
declare const getFID: (callback: (metric: Metric) => void) => void
declare const getFCP: (callback: (metric: Metric) => void) => void
declare const getLCP: (callback: (metric: Metric) => void) => void
declare const getTTFB: (callback: (metric: Metric) => void) => void

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private apiEndpoint: string

  constructor(apiEndpoint: string = '') {
    this.apiEndpoint = apiEndpoint
  }

  /**
   * 初始化性能监控
   */
  init(): void {
    if (typeof window === 'undefined') return

    // 监控Core Web Vitals
    this.monitorCoreWebVitals()

    // 监控自定义指标
    this.monitorCustomMetrics()

    // 监控资源加载
    this.monitorResourceLoading()

    // 监控用户交互
    this.monitorUserInteractions()
  }

  /**
   * 监控Core Web Vitals
   */
  private monitorCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    getLCP((metric) => {
      this.recordMetric({
        name: 'LCP',
        value: metric.value,
        rating: this.getLCPRating(metric.value),
        timestamp: Date.now()
      })
    })

    // First Input Delay (FID)
    getFID((metric) => {
      this.recordMetric({
        name: 'FID',
        value: metric.value,
        rating: this.getFIDRating(metric.value),
        timestamp: Date.now()
      })
    })

    // Cumulative Layout Shift (CLS)
    getCLS((metric) => {
      this.recordMetric({
        name: 'CLS',
        value: metric.value,
        rating: this.getCLSRating(metric.value),
        timestamp: Date.now()
      })
    })

    // First Contentful Paint (FCP)
    getFCP((metric) => {
      this.recordMetric({
        name: 'FCP',
        value: metric.value,
        rating: this.getFCPRating(metric.value),
        timestamp: Date.now()
      })
    })

    // Time to First Byte (TTFB)
    getTTFB((metric) => {
      this.recordMetric({
        name: 'TTFB',
        value: metric.value,
        rating: this.getTTFBRating(metric.value),
        timestamp: Date.now()
      })
    })
  }

  /**
   * 监控自定义指标
   */
  private monitorCustomMetrics(): void {
    // 页面加载时间
    window.addEventListener('load', () => {
      const loadTime = performance.now()
      this.recordMetric({
        name: 'PAGE_LOAD_TIME',
        value: loadTime,
        rating: loadTime < 2500 ? 'good' : loadTime < 4000 ? 'needs-improvement' : 'poor',
        timestamp: Date.now()
      })
    })

    // DOM内容加载时间
    document.addEventListener('DOMContentLoaded', () => {
      const domLoadTime = performance.now()
      this.recordMetric({
        name: 'DOM_CONTENT_LOADED',
        value: domLoadTime,
        rating: domLoadTime < 1500 ? 'good' : domLoadTime < 2500 ? 'needs-improvement' : 'poor',
        timestamp: Date.now()
      })
    })

    // 计算性能监控
    this.monitorCalculationPerformance()
  }

  /**
   * 监控资源加载
   */
  private monitorResourceLoading(): void {
    // 监控关键资源加载时间
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming

          this.recordMetric({
            name: 'DNS_LOOKUP_TIME',
            value: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            rating: 'good',
            timestamp: Date.now()
          })

          this.recordMetric({
            name: 'TCP_CONNECT_TIME',
            value: navEntry.connectEnd - navEntry.connectStart,
            rating: 'good',
            timestamp: Date.now()
          })
        }

        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming

          // 监控关键资源
          if (resourceEntry.name.includes('main.js') ||
              resourceEntry.name.includes('main.css')) {
            this.recordMetric({
              name: 'CRITICAL_RESOURCE_LOAD_TIME',
              value: resourceEntry.responseEnd - resourceEntry.startTime,
              rating: 'good',
              timestamp: Date.now()
            })
          }
        }
      }
    })

    observer.observe({ entryTypes: ['navigation', 'resource'] })
  }

  /**
   * 监控用户交互
   */
  private monitorUserInteractions(): void {
    // 监控计算按钮点击响应时间
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.dataset.testid === 'calculate-button') {
        const startTime = performance.now()

        // 监控计算完成时间
        const checkCalculationComplete = () => {
          const resultElement = document.querySelector('[data-testid="calculation-result"]')
          if (resultElement) {
            const endTime = performance.now()
            this.recordMetric({
              name: 'CALCULATION_INTERACTION_TIME',
              value: endTime - startTime,
              rating: (endTime - startTime) < 1000 ? 'good' : 'needs-improvement',
              timestamp: Date.now()
            })
          } else {
            setTimeout(checkCalculationComplete, 100)
          }
        }

        setTimeout(checkCalculationComplete, 100)
      }
    })
  }

  /**
   * 监控计算性能
   */
  private monitorCalculationPerformance(): void {
    // 创建全局计算性能监控函数
    (window as any).recordCalculationPerformance = (duration: number, success: boolean) => {
      this.recordMetric({
        name: 'CALCULATION_PERFORMANCE',
        value: duration,
        rating: duration < 500 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor',
        timestamp: Date.now()
      })

      this.recordMetric({
        name: 'CALCULATION_SUCCESS_RATE',
        value: success ? 1 : 0,
        rating: 'good',
        timestamp: Date.now()
      })
    }
  }

  /**
   * 记录指标
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // 发送到后端（如果配置了）
    if (this.apiEndpoint) {
      this.sendMetricToBackend(metric)
    }

    // 本地存储（用于调试）
    if (import.meta.env.DEV) {
      console.log('Performance Metric:', metric)
    }
  }

  /**
   * 发送指标到后端
   */
  private async sendMetricToBackend(metric: PerformanceMetric): Promise<void> {
    try {
      await fetch(`${this.apiEndpoint}/monitoring/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metric_name: `frontend.${metric.name.toLowerCase()}`,
          metric_value: metric.value,
          tags: {
            rating: metric.rating,
            user_agent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            connection: (navigator as any).connection?.effectiveType || 'unknown'
          }
        })
      })
    } catch (error) {
      console.warn('Failed to send metric to backend:', error)
    }
  }

  /**
   * LCP评级
   */
  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  /**
   * FID评级
   */
  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }

  /**
   * CLS评级
   */
  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  /**
   * FCP评级
   */
  private getFCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good'
    if (value <= 3000) return 'needs-improvement'
    return 'poor'
  }

  /**
   * TTFB评级
   */
  private getTTFBRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good'
    if (value <= 1800) return 'needs-improvement'
    return 'poor'
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * 获取指标摘要
   */
  getMetricsSummary(): {
    coreWebVitals: Record<string, PerformanceMetric | undefined>
    customMetrics: PerformanceMetric[]
    overallRating: 'good' | 'needs-improvement' | 'poor'
  } {
    const coreWebVitals = {
      LCP: this.metrics.find(m => m.name === 'LCP'),
      FID: this.metrics.find(m => m.name === 'FID'),
      CLS: this.metrics.find(m => m.name === 'CLS'),
      FCP: this.metrics.find(m => m.name === 'FCP'),
      TTFB: this.metrics.find(m => m.name === 'TTFB')
    }

    const customMetrics = this.metrics.filter(m =>
      !['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].includes(m.name)
    )

    // 计算整体评级
    const coreMetrics = Object.values(coreWebVitals).filter(Boolean) as PerformanceMetric[]
    const goodCount = coreMetrics.filter(m => m.rating === 'good').length
    const totalCount = coreMetrics.length

    let overallRating: 'good' | 'needs-improvement' | 'poor'
    if (goodCount === totalCount) {
      overallRating = 'good'
    } else if (goodCount >= totalCount * 0.7) {
      overallRating = 'needs-improvement'
    } else {
      overallRating = 'poor'
    }

    return {
      coreWebVitals,
      customMetrics,
      overallRating
    }
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor(
  import.meta.env.VITE_API_BASE_URL
)

// 自动初始化（仅在浏览器环境）
if (typeof window !== 'undefined') {
  performanceMonitor.init()
}
