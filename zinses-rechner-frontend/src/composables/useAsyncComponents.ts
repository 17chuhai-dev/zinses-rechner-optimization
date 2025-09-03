/**
 * 异步组件和代码分割优化
 * 实现智能懒加载和性能优化的组件加载策略
 */

import { defineAsyncComponent, defineComponent, type AsyncComponentLoader, type Component } from 'vue'
import { withPerformanceMonitoring } from './useWebVitals'

// 全局变量声明
declare const gtag: (...args: any[]) => void

// 加载状态组件
const LoadingSkeleton = defineComponent({
  name: 'LoadingSkeleton',
  template: `
    <div class="animate-pulse">
      <div class="bg-gray-200 rounded-lg h-64 mb-4"></div>
      <div class="space-y-3">
        <div class="bg-gray-200 rounded h-4 w-3/4"></div>
        <div class="bg-gray-200 rounded h-4 w-1/2"></div>
        <div class="bg-gray-200 rounded h-4 w-5/6"></div>
      </div>
    </div>
  `
})

const ChartSkeleton = defineComponent({
  name: 'ChartSkeleton',
  template: `
    <div class="animate-pulse">
      <div class="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div class="text-gray-400">
          <svg class="w-12 h-12 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    </div>
  `
})

const ErrorComponent = defineComponent({
  name: 'ErrorComponent',
  props: {
    error: Object,
    retry: Function
  },
  template: `
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div class="text-red-600 mb-4">
        <svg class="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-red-800 mb-2">Komponente konnte nicht geladen werden</h3>
      <p class="text-red-600 mb-4">{{ error?.message || 'Ein unerwarteter Fehler ist aufgetreten' }}</p>
      <button
        v-if="retry"
        @click="retry"
        class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
      >
        Erneut versuchen
      </button>
    </div>
  `
})

// 异步组件配置选项
interface AsyncComponentOptions {
  loadingComponent?: Component
  errorComponent?: Component
  delay?: number
  timeout?: number
  suspensible?: boolean
  retryDelay?: number
  maxRetries?: number
}

// 智能异步组件工厂
function createAsyncComponent(
  loader: AsyncComponentLoader,
  name: string,
  options: AsyncComponentOptions = {}
) {
  const {
    loadingComponent = LoadingSkeleton,
    errorComponent = ErrorComponent,
    delay = 200,
    timeout = 10000,
    suspensible = false,
    retryDelay = 1000,
    maxRetries = 3
  } = options

  let retryCount = 0

  const wrappedLoader = withPerformanceMonitoring(async () => {
    try {
      const startTime = performance.now()
      const component = await loader()
      const loadTime = performance.now() - startTime

      console.log(`📦 Component ${name} loaded in ${loadTime.toFixed(2)}ms`)

      // 发送组件加载指标
      if (typeof gtag !== 'undefined') {
        gtag('event', 'component_loaded', {
          event_category: 'Performance',
          event_label: name,
          value: Math.round(loadTime),
          custom_map: {
            component_name: name,
            load_time: loadTime,
            retry_count: retryCount
          }
        })
      }

      retryCount = 0 // 重置重试计数
      return component

    } catch (error) {
      console.error(`❌ Failed to load component ${name}:`, error)

      // 重试逻辑
      if (retryCount < maxRetries) {
        retryCount++
        console.log(`🔄 Retrying component ${name} (${retryCount}/${maxRetries})`)

        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount))
        return wrappedLoader()
      }

      // 发送加载失败指标
      if (typeof gtag !== 'undefined') {
        gtag('event', 'component_load_failed', {
          event_category: 'Error',
          event_label: name,
          value: retryCount,
          custom_map: {
            component_name: name,
            error_message: error instanceof Error ? error.message : String(error),
            retry_count: retryCount
          }
        })
      }

      throw error
    }
  }, `load-component-${name}`)

  return defineAsyncComponent({
    loader: wrappedLoader,
    loadingComponent,
    errorComponent,
    delay,
    timeout,
    suspensible
  })
}

// 预定义的异步组件
export const AsyncComponents = {
  // 图表组件 - 使用现有的CompoundInterestChart
  Chart: createAsyncComponent(
    () => import('../components/charts/CompoundInterestChart.vue'),
    'Chart',
    {
      loadingComponent: ChartSkeleton,
      delay: 100,
      timeout: 15000
    }
  ),

  // 计算器结果组件
  CalculatorResults: createAsyncComponent(
    () => import('../components/calculator/CalculatorResults.vue'),
    'CalculatorResults',
    {
      delay: 0, // 立即显示加载状态
      timeout: 8000
    }
  ),

  // 税务计算组件 - 使用现有的TaxSettings
  TaxCalculation: createAsyncComponent(
    () => import('../components/calculator/TaxSettings.vue'),
    'TaxCalculation',
    {
      delay: 150
    }
  ),

  // 导出功能组件 - 使用现有的ExportButtons
  ExportTools: createAsyncComponent(
    () => import('../components/calculator/ExportButtons.vue'),
    'ExportTools',
    {
      delay: 200
    }
  ),

  // 分享组件 - 使用现有的ExportButtons（包含分享功能）
  ShareTools: createAsyncComponent(
    () => import('../components/calculator/ExportButtons.vue'),
    'ShareTools',
    {
      delay: 300
    }
  ),

  // 公式解释组件 - 使用现有的FormulaExplanation
  FormulaExplanation: createAsyncComponent(
    () => import('../components/calculator/FormulaExplanation.vue'),
    'FormulaExplanation',
    {
      delay: 250
    }
  ),

  // 教育内容组件 - 使用现有的FormulaExplanation作为教育内容
  EducationalContent: createAsyncComponent(
    () => import('../components/calculator/FormulaExplanation.vue'),
    'EducationalContent',
    {
      delay: 400
    }
  ),

  // 比较工具组件 - 使用现有的TaxSettings作为高级功能
  ComparisonTool: createAsyncComponent(
    () => import('../components/calculator/TaxSettings.vue'),
    'ComparisonTool',
    {
      delay: 300,
      timeout: 12000
    }
  ),

  // 高级设置组件 - 使用现有的TaxSettings
  AdvancedSettings: createAsyncComponent(
    () => import('../components/calculator/TaxSettings.vue'),
    'AdvancedSettings',
    {
      delay: 200
    }
  ),

  // 性能监控仪表盘
  PerformanceDashboard: createAsyncComponent(
    () => import('../components/admin/PerformanceDashboard.vue'),
    'PerformanceDashboard',
    {
      delay: 500,
      timeout: 20000
    }
  )
}

// 路由级别的异步组件
export const AsyncPages = {
  // 主计算器页面 - 使用现有的CalculatorForm组件
  Calculator: createAsyncComponent(
    () => import('../components/calculator/CalculatorForm.vue'),
    'CalculatorPage',
    {
      delay: 0,
      timeout: 10000
    }
  ),

  // API文档页面
  ApiDocs: createAsyncComponent(
    () => import('../pages/api-docs.vue'),
    'ApiDocsPage',
    {
      delay: 200
    }
  ),

  // 教育内容页面 - 使用现有的FormulaExplanation组件
  Education: createAsyncComponent(
    () => import('../components/calculator/FormulaExplanation.vue'),
    'EducationPage',
    {
      delay: 300
    }
  ),

  // 关于页面 - 使用现有的CalculatorForm组件作为占位符
  About: createAsyncComponent(
    () => import('../components/calculator/CalculatorForm.vue'),
    'AboutPage',
    {
      delay: 400
    }
  ),

  // 隐私政策页面 - 使用现有的CalculatorForm组件作为占位符
  Privacy: createAsyncComponent(
    () => import('../components/calculator/CalculatorForm.vue'),
    'PrivacyPage',
    {
      delay: 500
    }
  ),

  // 联系页面 - 使用现有的CalculatorForm组件作为占位符
  Contact: createAsyncComponent(
    () => import('../components/calculator/CalculatorForm.vue'),
    'ContactPage',
    {
      delay: 400
    }
  )
}

// 组件预加载策略
export function useComponentPreloading() {
  const preloadedComponents = new Set<string>()

  // 预加载关键组件
  const preloadCriticalComponents = async () => {
    const criticalComponents = [
      'CalculatorResults',
      'Chart'
    ]

    for (const componentName of criticalComponents) {
      if (!preloadedComponents.has(componentName)) {
        try {
          // 在空闲时间预加载
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              preloadComponent(componentName)
            })
          } else {
            setTimeout(() => {
              preloadComponent(componentName)
            }, 100)
          }
        } catch (error) {
          console.warn(`Failed to preload component ${componentName}:`, error)
        }
      }
    }
  }

  // 预加载单个组件
  const preloadComponent = async (componentName: string) => {
    if (preloadedComponents.has(componentName)) return

    try {
      const component = AsyncComponents[componentName as keyof typeof AsyncComponents]
      if (component) {
        // 触发组件加载但不渲染
        await component.__asyncLoader()
        preloadedComponents.add(componentName)
        console.log(`✅ Preloaded component: ${componentName}`)
      }
    } catch (error) {
      console.warn(`Failed to preload component ${componentName}:`, error)
    }
  }

  // 基于用户交互预加载
  const preloadOnHover = (componentName: string) => {
    return {
      onMouseenter: () => preloadComponent(componentName),
      onFocus: () => preloadComponent(componentName)
    }
  }

  // 基于路由预加载
  const preloadForRoute = (routeName: string) => {
    const routeComponentMap: Record<string, string[]> = {
      'calculator': ['CalculatorResults', 'Chart', 'TaxCalculation'],
      'education': ['EducationalContent', 'FormulaExplanation'],
      'api-docs': ['PerformanceDashboard']
    }

    const components = routeComponentMap[routeName] || []
    components.forEach(componentName => {
      preloadComponent(componentName)
    })
  }

  return {
    preloadCriticalComponents,
    preloadComponent,
    preloadOnHover,
    preloadForRoute,
    preloadedComponents: preloadedComponents
  }
}

// 组件加载性能监控
export function useComponentLoadingMetrics() {
  const loadingMetrics = new Map<string, {
    startTime: number
    endTime?: number
    duration?: number
    success: boolean
    retryCount: number
  }>()

  const trackComponentLoading = (componentName: string) => {
    loadingMetrics.set(componentName, {
      startTime: performance.now(),
      success: false,
      retryCount: 0
    })
  }

  const trackComponentLoaded = (componentName: string, success: boolean = true) => {
    const metric = loadingMetrics.get(componentName)
    if (metric) {
      metric.endTime = performance.now()
      metric.duration = metric.endTime - metric.startTime
      metric.success = success

      console.log(`📊 Component ${componentName} metrics:`, metric)
    }
  }

  const getLoadingReport = () => {
    const report = Array.from(loadingMetrics.entries()).map(([name, metric]) => ({
      component: name,
      ...metric
    }))

    return {
      components: report,
      totalComponents: report.length,
      successfulLoads: report.filter(r => r.success).length,
      averageLoadTime: report.reduce((sum, r) => sum + (r.duration || 0), 0) / report.length,
      slowestComponent: report.reduce((slowest, current) =>
        (current.duration || 0) > (slowest.duration || 0) ? current : slowest
      )
    }
  }

  return {
    trackComponentLoading,
    trackComponentLoaded,
    getLoadingReport,
    loadingMetrics
  }
}
