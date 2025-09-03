/**
 * 性能优化组合式函数
 * 提供运行时性能优化功能
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

// 懒加载状态
interface LazyLoadState {
  isLoading: boolean
  isLoaded: boolean
  error: Error | null
}

// 性能指标
interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

export function usePerformanceOptimization() {
  const router = useRouter()
  
  // 懒加载状态管理
  const lazyLoadStates = ref<Map<string, LazyLoadState>>(new Map())
  const performanceMetrics = ref<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0
  })

  // 动态导入组件
  const lazyLoadComponent = async (componentPath: string, chunkName?: string) => {
    const key = componentPath
    
    // 设置加载状态
    lazyLoadStates.value.set(key, {
      isLoading: true,
      isLoaded: false,
      error: null
    })

    try {
      const component = await import(
        /* webpackChunkName: "[request]" */
        `../components/${componentPath}.vue`
      )
      
      // 更新加载状态
      lazyLoadStates.value.set(key, {
        isLoading: false,
        isLoaded: true,
        error: null
      })
      
      return component.default || component
    } catch (error) {
      // 更新错误状态
      lazyLoadStates.value.set(key, {
        isLoading: false,
        isLoaded: false,
        error: error as Error
      })
      
      throw error
    }
  }

  // 预加载组件
  const preloadComponent = (componentPath: string) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        lazyLoadComponent(componentPath).catch(() => {
          // 静默处理预加载错误
        })
      })
    } else {
      setTimeout(() => {
        lazyLoadComponent(componentPath).catch(() => {
          // 静默处理预加载错误
        })
      }, 100)
    }
  }

  // 批量预加载
  const preloadComponents = (componentPaths: string[]) => {
    componentPaths.forEach((path, index) => {
      setTimeout(() => {
        preloadComponent(path)
      }, index * 50) // 错开加载时间
    })
  }

  // 智能预加载 - 基于用户行为
  const setupSmartPreloading = () => {
    let hoverTimer: number | null = null
    
    // 鼠标悬停预加载
    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const preloadAttr = target.getAttribute('data-preload')
      
      if (preloadAttr) {
        hoverTimer = window.setTimeout(() => {
          preloadComponent(preloadAttr)
        }, 200) // 200ms延迟避免误触
      }
    }
    
    const handleMouseOut = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer)
        hoverTimer = null
      }
    }
    
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      if (hoverTimer) clearTimeout(hoverTimer)
    }
  }

  // 视口内预加载
  const setupIntersectionPreloading = () => {
    if (!('IntersectionObserver' in window)) return () => {}
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            const preloadAttr = target.getAttribute('data-preload')
            
            if (preloadAttr) {
              preloadComponent(preloadAttr)
              observer.unobserve(target)
            }
          }
        })
      },
      {
        rootMargin: '100px', // 提前100px开始预加载
        threshold: 0.1
      }
    )
    
    // 观察所有带有data-preload属性的元素
    const observeElements = () => {
      document.querySelectorAll('[data-preload]').forEach(el => {
        observer.observe(el)
      })
    }
    
    // 初始观察
    nextTick(observeElements)
    
    // 路由变化后重新观察
    const unwatch = router.afterEach(() => {
      nextTick(observeElements)
    })
    
    return () => {
      observer.disconnect()
      unwatch()
    }
  }

  // 性能指标收集
  const collectPerformanceMetrics = () => {
    if (!('performance' in window)) return
    
    // 收集导航时间
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      performanceMetrics.value.ttfb = navigation.responseStart - navigation.fetchStart
    }
    
    // 收集绘制时间
    const paintEntries = performance.getEntriesByType('paint')
    paintEntries.forEach(entry => {
      if (entry.name === 'first-contentful-paint') {
        performanceMetrics.value.fcp = entry.startTime
      }
    })
    
    // 使用Performance Observer收集其他指标
    if ('PerformanceObserver' in window) {
      // LCP观察器
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        performanceMetrics.value.lcp = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      
      // FID观察器
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          const fidEntry = entry as PerformanceEventTiming
          performanceMetrics.value.fid = fidEntry.processingStart - fidEntry.startTime
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      
      // CLS观察器
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          const layoutShift = entry as any
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value
            performanceMetrics.value.cls = clsValue
          }
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  // 资源优化
  const optimizeResources = () => {
    // 预加载关键资源
    const preloadCriticalResources = () => {
      const criticalResources = [
        { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
        { href: '/css/critical.css', as: 'style' }
      ]
      
      criticalResources.forEach(resource => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = resource.href
        link.as = resource.as
        if (resource.type) link.type = resource.type
        if (resource.as === 'font') link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })
    }
    
    // 预连接外部域名
    const preconnectExternalDomains = () => {
      const domains = [
        'https://api.ecb.europa.eu',
        'https://api.bundesbank.de',
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ]
      
      domains.forEach(domain => {
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = domain
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })
    }
    
    preloadCriticalResources()
    preconnectExternalDomains()
  }

  // 内存优化
  const optimizeMemory = () => {
    // 清理未使用的组件缓存
    const cleanupComponentCache = () => {
      const unusedComponents = Array.from(lazyLoadStates.value.entries())
        .filter(([_, state]) => state.isLoaded && !document.querySelector(`[data-component="${_}"]`))
        .map(([key]) => key)
      
      unusedComponents.forEach(key => {
        lazyLoadStates.value.delete(key)
      })
    }
    
    // 定期清理
    const cleanupInterval = setInterval(cleanupComponentCache, 60000) // 每分钟清理一次
    
    return () => {
      clearInterval(cleanupInterval)
    }
  }

  // 获取组件加载状态
  const getLoadingState = (componentPath: string) => {
    return computed(() => lazyLoadStates.value.get(componentPath) || {
      isLoading: false,
      isLoaded: false,
      error: null
    })
  }

  // 获取性能分数
  const getPerformanceScore = computed(() => {
    const metrics = performanceMetrics.value
    let score = 100
    
    // FCP评分 (权重: 25%)
    if (metrics.fcp > 0) {
      const fcpScore = Math.max(0, 100 - (metrics.fcp / 20))
      score = score * 0.75 + fcpScore * 0.25
    }
    
    // LCP评分 (权重: 25%)
    if (metrics.lcp > 0) {
      const lcpScore = Math.max(0, 100 - (metrics.lcp / 30))
      score = score * 0.75 + lcpScore * 0.25
    }
    
    // FID评分 (权重: 25%)
    if (metrics.fid > 0) {
      const fidScore = Math.max(0, 100 - metrics.fid)
      score = score * 0.75 + fidScore * 0.25
    }
    
    // CLS评分 (权重: 25%)
    const clsScore = Math.max(0, 100 - (metrics.cls * 1000))
    score = score * 0.75 + clsScore * 0.25
    
    return Math.round(score)
  })

  // 初始化性能优化
  const initializeOptimizations = () => {
    const cleanupFunctions: (() => void)[] = []
    
    // 设置各种优化
    cleanupFunctions.push(setupSmartPreloading())
    cleanupFunctions.push(setupIntersectionPreloading())
    cleanupFunctions.push(optimizeMemory())
    
    // 收集性能指标
    collectPerformanceMetrics()
    
    // 优化资源
    optimizeResources()
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }

  // 生命周期钩子
  let cleanup: (() => void) | null = null
  
  onMounted(() => {
    cleanup = initializeOptimizations()
  })
  
  onUnmounted(() => {
    if (cleanup) cleanup()
  })

  return {
    // 懒加载
    lazyLoadComponent,
    preloadComponent,
    preloadComponents,
    getLoadingState,
    
    // 性能指标
    performanceMetrics: computed(() => performanceMetrics.value),
    getPerformanceScore,
    
    // 优化功能
    setupSmartPreloading,
    setupIntersectionPreloading,
    optimizeResources,
    collectPerformanceMetrics
  }
}
