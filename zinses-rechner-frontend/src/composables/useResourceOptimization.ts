/**
 * 资源优化策略
 * 实现图片优化、字体加载、资源预加载等性能优化措施
 */

import { ref, onMounted, nextTick } from 'vue'

// 全局变量声明
declare const gtag: (...args: any[]) => void

// 图片格式支持检测
const supportedFormats = ref({
  webp: false,
  avif: false,
  heic: false
})

// 检测浏览器支持的图片格式
async function detectImageFormatSupport() {
  const formats = {
    webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
    avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=',
    heic: 'data:image/heic;base64,AAAAGGZ0eXBoZWljAAAAAG1pZjFoZWljbWlhZgAAAOptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA=='
  }

  for (const [format, dataUrl] of Object.entries(formats)) {
    try {
      const img = new Image()
      const supported = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(img.width > 0 && img.height > 0)
        img.onerror = () => resolve(false)
        img.src = dataUrl
      })
      supportedFormats.value[format as keyof typeof supportedFormats.value] = supported
    } catch {
      supportedFormats.value[format as keyof typeof supportedFormats.value] = false
    }
  }

  console.log('🖼️ Supported image formats:', supportedFormats.value)
}

// 响应式图片组件配置
interface ResponsiveImageOptions {
  src: string
  alt: string
  sizes?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
  fetchpriority?: 'high' | 'low' | 'auto'
  quality?: number
  placeholder?: string
  blurDataURL?: string
}

// 生成优化的图片URL
function generateOptimizedImageUrl(
  src: string,
  width: number,
  quality: number = 85,
  format?: string
): string {
  // 如果使用Cloudflare Images或其他CDN
  if (src.includes('imagedelivery.net') || src.includes('images.unsplash.com')) {
    const formatParam = format && supportedFormats.value[format as keyof typeof supportedFormats.value]
      ? `f=${format}`
      : 'f=auto'
    return `${src}/w=${width},q=${quality},${formatParam}`
  }

  // 本地图片处理（需要构建时处理）
  const extension = src.split('.').pop()
  const baseName = src.replace(`.${extension}`, '')

  if (format && supportedFormats.value[format as keyof typeof supportedFormats.value]) {
    return `${baseName}-${width}w.${format}`
  }

  return `${baseName}-${width}w.${extension}`
}

// 响应式图片Composable
export function useResponsiveImage(options: ResponsiveImageOptions) {
  const imageRef = ref<HTMLImageElement>()
  const isLoaded = ref(false)
  const isError = ref(false)
  const loadTime = ref(0)

  // 生成srcset
  const generateSrcSet = () => {
    const breakpoints = [320, 640, 768, 1024, 1280, 1536, 1920]
    const quality = options.quality || 85

    // 优先使用WebP，回退到原格式
    const format = supportedFormats.value.webp ? 'webp' : undefined

    return breakpoints
      .map(width => `${generateOptimizedImageUrl(options.src, width, quality, format)} ${width}w`)
      .join(', ')
  }

  // 生成sizes属性
  const generateSizes = () => {
    return options.sizes || '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
  }

  // 图片加载处理
  const handleLoad = () => {
    isLoaded.value = true
    loadTime.value = performance.now()

    // 发送图片加载指标
    if (typeof gtag !== 'undefined') {
      gtag('event', 'image_loaded', {
        event_category: 'Performance',
        event_label: options.src,
        value: Math.round(loadTime.value),
        custom_map: {
          image_src: options.src,
          load_time: loadTime.value
        }
      })
    }
  }

  const handleError = () => {
    isError.value = true
    console.error(`Failed to load image: ${options.src}`)

    // 发送图片加载失败指标
    if (typeof gtag !== 'undefined') {
      gtag('event', 'image_load_failed', {
        event_category: 'Error',
        event_label: options.src
      })
    }
  }

  return {
    imageRef,
    isLoaded,
    isError,
    loadTime,
    srcSet: generateSrcSet(),
    sizes: generateSizes(),
    handleLoad,
    handleError
  }
}

// 字体优化
export function useFontOptimization() {
  const fontsLoaded = ref(false)
  const fontLoadTime = ref(0)

  // 预加载关键字体
  const preloadFonts = () => {
    const fonts = [
      { family: 'Inter', weight: '400', display: 'swap' },
      { family: 'Inter', weight: '600', display: 'swap' },
      { family: 'Inter', weight: '700', display: 'swap' }
    ]

    fonts.forEach(font => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      link.href = `/fonts/inter-${font.weight}.woff2`
      document.head.appendChild(link)
    })
  }

  // 监控字体加载
  const monitorFontLoading = async () => {
    if (!('fonts' in document)) return

    const startTime = performance.now()

    try {
      await document.fonts.ready
      fontLoadTime.value = performance.now() - startTime
      fontsLoaded.value = true

      console.log(`🔤 Fonts loaded in ${fontLoadTime.value.toFixed(2)}ms`)

      // 发送字体加载指标
      if (typeof gtag !== 'undefined') {
        gtag('event', 'fonts_loaded', {
          event_category: 'Performance',
          value: Math.round(fontLoadTime.value),
          custom_map: {
            font_load_time: fontLoadTime.value
          }
        })
      }
    } catch (error) {
      console.error('Font loading failed:', error)
    }
  }

  return {
    fontsLoaded,
    fontLoadTime,
    preloadFonts,
    monitorFontLoading
  }
}

// 资源预加载策略
export function useResourcePreloading() {
  const preloadedResources = new Set<string>()

  // 预加载关键资源
  const preloadCriticalResources = () => {
    const resources = [
      { href: '/api/v1/calculator/compound-interest', as: 'fetch', type: 'application/json' },
      { href: '/api/v1/calculator/limits', as: 'fetch', type: 'application/json' },
      { href: '/css/critical.css', as: 'style' },
      { href: '/js/web-vitals.js', as: 'script' }
    ]

    resources.forEach(resource => {
      if (!preloadedResources.has(resource.href)) {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = resource.href
        link.as = resource.as
        if (resource.type) link.type = resource.type
        if (resource.as === 'fetch') link.crossOrigin = 'anonymous'

        document.head.appendChild(link)
        preloadedResources.add(resource.href)

        console.log(`🔗 Preloaded resource: ${resource.href}`)
      }
    })
  }

  // DNS预解析
  const preconnectToDomains = () => {
    const domains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.google-analytics.com',
      'https://api.zinses-rechner.de'
    ]

    domains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })

    console.log('🌐 DNS preconnect configured for external domains')
  }

  // 预取下一页资源
  const prefetchNextPageResources = (routeName: string) => {
    const routeResourceMap: Record<string, string[]> = {
      'calculator': ['/js/chart.js', '/css/calculator.css'],
      'education': ['/js/education.js', '/css/education.css'],
      'api-docs': ['/js/api-docs.js', '/css/docs.css']
    }

    const resources = routeResourceMap[routeName] || []

    resources.forEach(resource => {
      if (!preloadedResources.has(resource)) {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = resource
        document.head.appendChild(link)
        preloadedResources.add(resource)
      }
    })
  }

  return {
    preloadCriticalResources,
    preconnectToDomains,
    prefetchNextPageResources,
    preloadedResources
  }
}

// 图片懒加载优化
export function useImageLazyLoading() {
  const observedImages = new WeakSet<HTMLImageElement>()
  let observer: IntersectionObserver | null = null

  const createObserver = () => {
    if (!('IntersectionObserver' in window)) return null

    return new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement

            // 加载图片
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
            }

            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset
              img.removeAttribute('data-srcset')
            }

            // 停止观察
            observer?.unobserve(img)

            console.log('🖼️ Lazy loaded image:', img.src)
          }
        })
      },
      {
        rootMargin: '50px 0px', // 提前50px开始加载
        threshold: 0.01
      }
    )
  }

  const observeImage = (img: HTMLImageElement) => {
    if (!observer) {
      observer = createObserver()
    }

    if (observer && !observedImages.has(img)) {
      observer.observe(img)
      observedImages.add(img)
    }
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  return {
    observeImage,
    disconnect
  }
}

// 资源优化主函数
export function useResourceOptimization() {
  const { preloadFonts, monitorFontLoading } = useFontOptimization()
  const { preloadCriticalResources, preconnectToDomains } = useResourcePreloading()

  const initResourceOptimization = async () => {
    // 检测图片格式支持
    await detectImageFormatSupport()

    // 预连接到外部域名
    preconnectToDomains()

    // 预加载关键资源
    preloadCriticalResources()

    // 预加载字体
    preloadFonts()

    // 监控字体加载
    await monitorFontLoading()

    console.log('🚀 Resource optimization initialized')
  }

  onMounted(() => {
    // 延迟初始化以避免阻塞关键渲染路径
    nextTick(() => {
      initResourceOptimization()
    })
  })

  return {
    supportedFormats,
    initResourceOptimization,
    generateOptimizedImageUrl
  }
}

// 性能预算监控
export function usePerformanceBudget() {
  const budgets = {
    totalSize: 2 * 1024 * 1024, // 2MB
    imageSize: 1 * 1024 * 1024, // 1MB
    jsSize: 500 * 1024,         // 500KB
    cssSize: 100 * 1024,        // 100KB
    fontSize: 200 * 1024        // 200KB
  }

  const checkResourceBudget = () => {
    if (!('performance' in window)) return

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const resourceSizes = {
      total: 0,
      images: 0,
      scripts: 0,
      stylesheets: 0,
      fonts: 0
    }

    resources.forEach(resource => {
      const size = resource.transferSize || 0
      resourceSizes.total += size

      if (resource.initiatorType === 'img') {
        resourceSizes.images += size
      } else if (resource.initiatorType === 'script') {
        resourceSizes.scripts += size
      } else if (resource.initiatorType === 'link' && resource.name.includes('.css')) {
        resourceSizes.stylesheets += size
      } else if (resource.name.includes('font')) {
        resourceSizes.fonts += size
      }
    })

    // 检查预算超支
    const violations = []
    if (resourceSizes.total > budgets.totalSize) {
      violations.push(`Total size: ${(resourceSizes.total / 1024).toFixed(0)}KB > ${(budgets.totalSize / 1024).toFixed(0)}KB`)
    }
    if (resourceSizes.images > budgets.imageSize) {
      violations.push(`Images: ${(resourceSizes.images / 1024).toFixed(0)}KB > ${(budgets.imageSize / 1024).toFixed(0)}KB`)
    }
    if (resourceSizes.scripts > budgets.jsSize) {
      violations.push(`JavaScript: ${(resourceSizes.scripts / 1024).toFixed(0)}KB > ${(budgets.jsSize / 1024).toFixed(0)}KB`)
    }

    if (violations.length > 0) {
      console.warn('💰 Performance budget violations:', violations)
    } else {
      console.log('✅ Performance budget: All checks passed')
    }

    return {
      resourceSizes,
      budgets,
      violations,
      withinBudget: violations.length === 0
    }
  }

  return {
    budgets,
    checkResourceBudget
  }
}
