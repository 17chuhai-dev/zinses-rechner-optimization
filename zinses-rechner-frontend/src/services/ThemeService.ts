/**
 * 主题管理服务
 * 提供完整的暗色模式支持，包括主题切换、颜色变量、用户偏好保存
 */

import { ref, reactive, computed, watch } from 'vue'

// 主题类型
export type ThemeMode = 'light' | 'dark' | 'auto'

// 颜色方案
export type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'custom'

// 主题配置接口
export interface ThemeConfig {
  mode: ThemeMode
  colorScheme: ColorScheme
  customColors?: {
    primary: string
    secondary: string
    accent: string
    success: string
    warning: string
    error: string
    info: string
  }
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    largeText: boolean
  }
  preferences: {
    followSystem: boolean
    autoSwitch: boolean
    switchTime?: {
      lightMode: string // HH:MM
      darkMode: string // HH:MM
    }
  }
}

// 主题颜色定义
export interface ThemeColors {
  // 基础颜色
  background: {
    primary: string
    secondary: string
    tertiary: string
    elevated: string
    overlay: string
  }
  
  // 文本颜色
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
    disabled: string
  }
  
  // 边框颜色
  border: {
    primary: string
    secondary: string
    focus: string
    error: string
    success: string
  }
  
  // 品牌颜色
  brand: {
    primary: string
    secondary: string
    accent: string
  }
  
  // 状态颜色
  status: {
    success: string
    warning: string
    error: string
    info: string
  }
  
  // 图表颜色
  chart: {
    primary: string[]
    secondary: string[]
    gradient: string[]
  }
}

// 预定义主题
const LIGHT_THEME: ThemeColors = {
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)'
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    inverse: '#ffffff',
    disabled: '#94a3b8'
  },
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    focus: '#3b82f6',
    error: '#ef4444',
    success: '#10b981'
  },
  brand: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#06b6d4'
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  chart: {
    primary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    secondary: ['#93c5fd', '#6ee7b7', '#fcd34d', '#fca5a5', '#c4b5fd', '#67e8f9'],
    gradient: ['#3b82f6', '#1d4ed8', '#1e40af']
  }
}

const DARK_THEME: ThemeColors = {
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    elevated: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.8)'
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#0f172a',
    disabled: '#64748b'
  },
  border: {
    primary: '#334155',
    secondary: '#475569',
    focus: '#60a5fa',
    error: '#f87171',
    success: '#34d399'
  },
  brand: {
    primary: '#60a5fa',
    secondary: '#3b82f6',
    accent: '#22d3ee'
  },
  status: {
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa'
  },
  chart: {
    primary: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'],
    secondary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    gradient: ['#60a5fa', '#3b82f6', '#1e40af']
  }
}

/**
 * 主题管理服务类
 */
export class ThemeService {
  private static instance: ThemeService

  // 主题状态
  public readonly state = reactive({
    currentMode: 'auto' as ThemeMode,
    effectiveMode: 'light' as 'light' | 'dark',
    colorScheme: 'default' as ColorScheme,
    isTransitioning: false,
    systemPreference: 'light' as 'light' | 'dark'
  })

  // 主题配置
  private config = ref<ThemeConfig>({
    mode: 'auto',
    colorScheme: 'default',
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      largeText: false
    },
    preferences: {
      followSystem: true,
      autoSwitch: false
    }
  })

  // 当前主题颜色
  private currentColors = ref<ThemeColors>(LIGHT_THEME)

  // 媒体查询监听器
  private mediaQueryListener?: (e: MediaQueryListEvent) => void

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService()
    }
    return ThemeService.instance
  }

  constructor() {
    this.initializeTheme()
    this.setupMediaQueryListener()
    this.setupWatchers()
  }

  /**
   * 初始化主题
   */
  private initializeTheme(): void {
    // 从本地存储加载配置
    this.loadThemeConfig()
    
    // 检测系统偏好
    this.detectSystemPreference()
    
    // 应用主题
    this.applyTheme()
  }

  /**
   * 设置媒体查询监听器
   */
  private setupMediaQueryListener(): void {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    this.mediaQueryListener = (e: MediaQueryListEvent) => {
      this.state.systemPreference = e.matches ? 'dark' : 'light'
      if (this.config.value.mode === 'auto') {
        this.updateEffectiveMode()
      }
    }

    mediaQuery.addEventListener('change', this.mediaQueryListener)
  }

  /**
   * 设置监听器
   */
  private setupWatchers(): void {
    // 监听模式变化
    watch(() => this.state.currentMode, () => {
      this.updateEffectiveMode()
      this.applyTheme()
      this.saveThemeConfig()
    })

    // 监听颜色方案变化
    watch(() => this.state.colorScheme, () => {
      this.applyTheme()
      this.saveThemeConfig()
    })

    // 监听系统偏好变化
    watch(() => this.state.systemPreference, () => {
      if (this.config.value.mode === 'auto') {
        this.updateEffectiveMode()
      }
    })
  }

  /**
   * 切换主题模式
   */
  public setThemeMode(mode: ThemeMode): void {
    this.state.currentMode = mode
    this.config.value.mode = mode
    this.updateEffectiveMode()
  }

  /**
   * 设置颜色方案
   */
  public setColorScheme(scheme: ColorScheme): void {
    this.state.colorScheme = scheme
    this.config.value.colorScheme = scheme
  }

  /**
   * 切换暗色模式
   */
  public toggleDarkMode(): void {
    const newMode = this.state.effectiveMode === 'light' ? 'dark' : 'light'
    this.setThemeMode(newMode)
  }

  /**
   * 设置自定义颜色
   */
  public setCustomColors(colors: Partial<ThemeConfig['customColors']>): void {
    this.config.value.customColors = {
      ...this.config.value.customColors,
      ...colors
    }
    this.applyTheme()
  }

  /**
   * 设置无障碍选项
   */
  public setAccessibilityOptions(options: Partial<ThemeConfig['accessibility']>): void {
    this.config.value.accessibility = {
      ...this.config.value.accessibility,
      ...options
    }
    this.applyAccessibilityFeatures()
  }

  /**
   * 获取当前主题颜色
   */
  public getCurrentColors(): ThemeColors {
    return this.currentColors.value
  }

  /**
   * 获取主题配置
   */
  public getConfig(): ThemeConfig {
    return this.config.value
  }

  /**
   * 检测系统偏好
   */
  private detectSystemPreference(): void {
    if (typeof window === 'undefined') return

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    this.state.systemPreference = prefersDark ? 'dark' : 'light'
  }

  /**
   * 更新有效模式
   */
  private updateEffectiveMode(): void {
    let effectiveMode: 'light' | 'dark'

    switch (this.state.currentMode) {
      case 'light':
        effectiveMode = 'light'
        break
      case 'dark':
        effectiveMode = 'dark'
        break
      case 'auto':
        effectiveMode = this.state.systemPreference
        break
      default:
        effectiveMode = 'light'
    }

    this.state.effectiveMode = effectiveMode
  }

  /**
   * 应用主题
   */
  private applyTheme(): void {
    this.state.isTransitioning = true

    // 选择主题颜色
    const baseColors = this.state.effectiveMode === 'dark' ? DARK_THEME : LIGHT_THEME
    
    // 应用颜色方案
    this.currentColors.value = this.applyColorScheme(baseColors)
    
    // 设置CSS变量
    this.setCSSVariables()
    
    // 设置HTML类
    this.setHTMLClasses()
    
    // 应用无障碍功能
    this.applyAccessibilityFeatures()

    // 延迟结束过渡状态
    setTimeout(() => {
      this.state.isTransitioning = false
    }, 300)
  }

  /**
   * 应用颜色方案
   */
  private applyColorScheme(baseColors: ThemeColors): ThemeColors {
    if (this.state.colorScheme === 'default') {
      return baseColors
    }

    // 应用自定义颜色方案
    const schemeColors = this.getSchemeColors(this.state.colorScheme)
    
    return {
      ...baseColors,
      brand: {
        ...baseColors.brand,
        ...schemeColors
      }
    }
  }

  /**
   * 获取方案颜色
   */
  private getSchemeColors(scheme: ColorScheme): Partial<ThemeColors['brand']> {
    const schemes = {
      blue: { primary: '#3b82f6', secondary: '#1e40af', accent: '#06b6d4' },
      green: { primary: '#10b981', secondary: '#059669', accent: '#34d399' },
      purple: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa' },
      orange: { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
      red: { primary: '#ef4444', secondary: '#dc2626', accent: '#f87171' },
      custom: this.config.value.customColors || {}
    }

    return schemes[scheme] || schemes.blue
  }

  /**
   * 设置CSS变量
   */
  private setCSSVariables(): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const colors = this.currentColors.value

    // 设置背景颜色变量
    root.style.setProperty('--color-bg-primary', colors.background.primary)
    root.style.setProperty('--color-bg-secondary', colors.background.secondary)
    root.style.setProperty('--color-bg-tertiary', colors.background.tertiary)
    root.style.setProperty('--color-bg-elevated', colors.background.elevated)
    root.style.setProperty('--color-bg-overlay', colors.background.overlay)

    // 设置文本颜色变量
    root.style.setProperty('--color-text-primary', colors.text.primary)
    root.style.setProperty('--color-text-secondary', colors.text.secondary)
    root.style.setProperty('--color-text-tertiary', colors.text.tertiary)
    root.style.setProperty('--color-text-inverse', colors.text.inverse)
    root.style.setProperty('--color-text-disabled', colors.text.disabled)

    // 设置边框颜色变量
    root.style.setProperty('--color-border-primary', colors.border.primary)
    root.style.setProperty('--color-border-secondary', colors.border.secondary)
    root.style.setProperty('--color-border-focus', colors.border.focus)
    root.style.setProperty('--color-border-error', colors.border.error)
    root.style.setProperty('--color-border-success', colors.border.success)

    // 设置品牌颜色变量
    root.style.setProperty('--color-brand-primary', colors.brand.primary)
    root.style.setProperty('--color-brand-secondary', colors.brand.secondary)
    root.style.setProperty('--color-brand-accent', colors.brand.accent)

    // 设置状态颜色变量
    root.style.setProperty('--color-status-success', colors.status.success)
    root.style.setProperty('--color-status-warning', colors.status.warning)
    root.style.setProperty('--color-status-error', colors.status.error)
    root.style.setProperty('--color-status-info', colors.status.info)
  }

  /**
   * 设置HTML类
   */
  private setHTMLClasses(): void {
    if (typeof document === 'undefined') return

    const html = document.documentElement
    
    // 移除旧的主题类
    html.classList.remove('theme-light', 'theme-dark', 'theme-auto')
    html.classList.remove('scheme-default', 'scheme-blue', 'scheme-green', 'scheme-purple', 'scheme-orange', 'scheme-red')
    
    // 添加新的主题类
    html.classList.add(`theme-${this.state.effectiveMode}`)
    html.classList.add(`scheme-${this.state.colorScheme}`)
    
    // 添加过渡类
    if (this.state.isTransitioning) {
      html.classList.add('theme-transitioning')
    } else {
      html.classList.remove('theme-transitioning')
    }
  }

  /**
   * 应用无障碍功能
   */
  private applyAccessibilityFeatures(): void {
    if (typeof document === 'undefined') return

    const html = document.documentElement
    const { accessibility } = this.config.value

    // 高对比度
    if (accessibility.highContrast) {
      html.classList.add('high-contrast')
    } else {
      html.classList.remove('high-contrast')
    }

    // 减少动画
    if (accessibility.reducedMotion) {
      html.classList.add('reduced-motion')
    } else {
      html.classList.remove('reduced-motion')
    }

    // 大字体
    if (accessibility.largeText) {
      html.classList.add('large-text')
    } else {
      html.classList.remove('large-text')
    }
  }

  /**
   * 加载主题配置
   */
  private loadThemeConfig(): void {
    try {
      const saved = localStorage.getItem('theme-config')
      if (saved) {
        const config = JSON.parse(saved)
        this.config.value = { ...this.config.value, ...config }
        this.state.currentMode = config.mode || 'auto'
        this.state.colorScheme = config.colorScheme || 'default'
      }
    } catch (error) {
      console.warn('Failed to load theme config:', error)
    }
  }

  /**
   * 保存主题配置
   */
  private saveThemeConfig(): void {
    try {
      const configToSave = {
        mode: this.state.currentMode,
        colorScheme: this.state.colorScheme,
        customColors: this.config.value.customColors,
        accessibility: this.config.value.accessibility,
        preferences: this.config.value.preferences
      }
      localStorage.setItem('theme-config', JSON.stringify(configToSave))
    } catch (error) {
      console.warn('Failed to save theme config:', error)
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    if (this.mediaQueryListener && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.removeEventListener('change', this.mediaQueryListener)
    }
  }
}

// 导出单例实例
export const themeService = ThemeService.getInstance()

// 便捷的组合式API
export function useTheme() {
  const service = ThemeService.getInstance()
  
  return {
    // 状态
    currentMode: computed(() => service.state.currentMode),
    effectiveMode: computed(() => service.state.effectiveMode),
    colorScheme: computed(() => service.state.colorScheme),
    isTransitioning: computed(() => service.state.isTransitioning),
    isDark: computed(() => service.state.effectiveMode === 'dark'),
    
    // 方法
    setThemeMode: service.setThemeMode.bind(service),
    setColorScheme: service.setColorScheme.bind(service),
    toggleDarkMode: service.toggleDarkMode.bind(service),
    setCustomColors: service.setCustomColors.bind(service),
    setAccessibilityOptions: service.setAccessibilityOptions.bind(service),
    getCurrentColors: service.getCurrentColors.bind(service),
    getConfig: service.getConfig.bind(service)
  }
}
