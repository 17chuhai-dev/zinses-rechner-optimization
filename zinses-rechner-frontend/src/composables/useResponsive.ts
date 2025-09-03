/**
 * 响应式设计工具组合函数
 * 提供屏幕尺寸检测、断点管理和响应式状态
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

// 断点定义（与 Tailwind CSS 保持一致）
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

export type Breakpoint = keyof typeof breakpoints

export function useResponsive() {
  // 当前窗口宽度
  const windowWidth = ref(0)
  const windowHeight = ref(0)

  // 更新窗口尺寸
  const updateWindowSize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  // 当前断点
  const currentBreakpoint = computed<Breakpoint>(() => {
    const width = windowWidth.value
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  })

  // 断点检查函数
  const isBreakpoint = (breakpoint: Breakpoint) => {
    return currentBreakpoint.value === breakpoint
  }

  const isBreakpointOrAbove = (breakpoint: Breakpoint) => {
    return windowWidth.value >= breakpoints[breakpoint]
  }

  const isBreakpointOrBelow = (breakpoint: Breakpoint) => {
    return windowWidth.value <= breakpoints[breakpoint]
  }

  // 常用的响应式状态
  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  const isTablet = computed(() => 
    windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg
  )
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)
  const isSmallScreen = computed(() => windowWidth.value < breakpoints.sm)
  const isLargeScreen = computed(() => windowWidth.value >= breakpoints.xl)

  // 设备类型检测
  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  // 屏幕方向
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)
  const isPortrait = computed(() => windowHeight.value > windowWidth.value)

  // 网格列数计算
  const getGridCols = (config: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }) => {
    const bp = currentBreakpoint.value
    return config[bp] || config.xs || 1
  }

  // 间距计算
  const getSpacing = (config: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  }) => {
    const bp = currentBreakpoint.value
    return config[bp] || config.xs || '1rem'
  }

  // 字体大小计算
  const getFontSize = (config: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  }) => {
    const bp = currentBreakpoint.value
    return config[bp] || config.xs || '1rem'
  }

  // 容器最大宽度
  const getContainerMaxWidth = () => {
    switch (currentBreakpoint.value) {
      case 'xs':
      case 'sm':
        return '100%'
      case 'md':
        return '768px'
      case 'lg':
        return '1024px'
      case 'xl':
        return '1280px'
      case '2xl':
        return '1536px'
      default:
        return '100%'
    }
  }

  // 触摸设备检测
  const isTouchDevice = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  // 高DPI屏幕检测
  const isHighDPI = computed(() => {
    return window.devicePixelRatio > 1
  })

  // 暗色模式检测
  const prefersDarkMode = computed(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // 减少动画偏好检测
  const prefersReducedMotion = computed(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  // 生命周期管理
  onMounted(() => {
    updateWindowSize()
    window.addEventListener('resize', updateWindowSize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWindowSize)
  })

  return {
    // 窗口尺寸
    windowWidth,
    windowHeight,
    
    // 断点信息
    currentBreakpoint,
    isBreakpoint,
    isBreakpointOrAbove,
    isBreakpointOrBelow,
    
    // 设备类型
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
    deviceType,
    
    // 屏幕方向
    isLandscape,
    isPortrait,
    
    // 工具函数
    getGridCols,
    getSpacing,
    getFontSize,
    getContainerMaxWidth,
    
    // 设备特性
    isTouchDevice,
    isHighDPI,
    prefersDarkMode,
    prefersReducedMotion,
    
    // 手动更新
    updateWindowSize
  }
}

// 响应式类名生成器
export function useResponsiveClasses() {
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsive()

  const getResponsiveClasses = (baseClasses: string, responsiveClasses?: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  }) => {
    let classes = baseClasses
    
    if (responsiveClasses) {
      const bp = currentBreakpoint.value
      const responsiveClass = responsiveClasses[bp]
      if (responsiveClass) {
        classes += ` ${responsiveClass}`
      }
    }
    
    return classes
  }

  const getDeviceClasses = (mobileClasses?: string, tabletClasses?: string, desktopClasses?: string) => {
    if (isMobile.value && mobileClasses) return mobileClasses
    if (isTablet.value && tabletClasses) return tabletClasses
    if (isDesktop.value && desktopClasses) return desktopClasses
    return ''
  }

  return {
    getResponsiveClasses,
    getDeviceClasses
  }
}
