/**
 * 主题管理服务
 * 处理明暗主题切换和主题持久化
 */

import { ref, computed, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'

interface ThemeConfig {
  theme: Theme
  systemPreference: 'light' | 'dark'
  customColors?: Record<string, string>
}

class ThemeManager {
  private _currentTheme = ref<Theme>('auto')
  private _systemPreference = ref<'light' | 'dark'>('light')
  private _customColors = ref<Record<string, string>>({})

  constructor() {
    this.initializeTheme()
    this.setupSystemPreferenceListener()
    this.setupThemeWatcher()
  }

  /**
   * 当前主题
   */
  get currentTheme() {
    return this._currentTheme.value
  }

  /**
   * 实际应用的主题（解析auto）
   */
  get resolvedTheme() {
    return computed(() => {
      if (this._currentTheme.value === 'auto') {
        return this._systemPreference.value
      }
      return this._currentTheme.value
    })
  }

  /**
   * 是否为暗色主题
   */
  get isDark() {
    return computed(() => this.resolvedTheme.value === 'dark')
  }

  /**
   * 系统偏好
   */
  get systemPreference() {
    return this._systemPreference.value
  }

  /**
   * 自定义颜色
   */
  get customColors() {
    return this._customColors.value
  }

  /**
   * 设置主题
   */
  setTheme(theme: Theme) {
    this._currentTheme.value = theme
    this.applyTheme()
    this.saveThemePreference()
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    const themes: Theme[] = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(this._currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    this.setTheme(themes[nextIndex])
  }

  /**
   * 设置自定义颜色
   */
  setCustomColors(colors: Record<string, string>) {
    this._customColors.value = { ...colors }
    this.applyCustomColors()
    this.saveThemePreference()
  }

  /**
   * 获取主题配置
   */
  getThemeConfig(): ThemeConfig {
    return {
      theme: this._currentTheme.value,
      systemPreference: this._systemPreference.value,
      customColors: { ...this._customColors.value }
    }
  }

  /**
   * 初始化主题
   */
  private initializeTheme() {
    // 检测系统偏好
    this.detectSystemPreference()
    
    // 加载保存的主题偏好
    this.loadThemePreference()
    
    // 应用主题
    this.applyTheme()
  }

  /**
   * 检测系统主题偏好
   */
  private detectSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this._systemPreference.value = mediaQuery.matches ? 'dark' : 'light'
    }
  }

  /**
   * 设置系统偏好监听器
   */
  private setupSystemPreferenceListener() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = (e: MediaQueryListEvent) => {
        this._systemPreference.value = e.matches ? 'dark' : 'light'
        if (this._currentTheme.value === 'auto') {
          this.applyTheme()
        }
      }

      // 现代浏览器
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
      } else {
        // 旧版浏览器兼容
        mediaQuery.addListener(handleChange)
      }
    }
  }

  /**
   * 设置主题监听器
   */
  private setupThemeWatcher() {
    watch(
      () => this.resolvedTheme.value,
      () => {
        this.applyTheme()
      }
    )
  }

  /**
   * 应用主题到DOM
   */
  private applyTheme() {
    if (typeof document === 'undefined') return

    const resolvedTheme = this.resolvedTheme.value
    const html = document.documentElement

    // 移除所有主题类
    html.classList.remove('light', 'dark')
    
    // 添加当前主题类
    html.classList.add(resolvedTheme)

    // 设置CSS变量
    this.setCSSVariables(resolvedTheme)

    // 应用自定义颜色
    this.applyCustomColors()

    // 更新meta标签
    this.updateMetaThemeColor(resolvedTheme)
  }

  /**
   * 设置CSS变量
   */
  private setCSSVariables(theme: 'light' | 'dark') {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    
    if (theme === 'dark') {
      root.style.setProperty('--color-background', '#0f172a')
      root.style.setProperty('--color-foreground', '#f8fafc')
      root.style.setProperty('--color-primary', '#3b82f6')
      root.style.setProperty('--color-secondary', '#64748b')
      root.style.setProperty('--color-accent', '#06b6d4')
      root.style.setProperty('--color-muted', '#1e293b')
      root.style.setProperty('--color-border', '#334155')
    } else {
      root.style.setProperty('--color-background', '#ffffff')
      root.style.setProperty('--color-foreground', '#0f172a')
      root.style.setProperty('--color-primary', '#2563eb')
      root.style.setProperty('--color-secondary', '#64748b')
      root.style.setProperty('--color-accent', '#0891b2')
      root.style.setProperty('--color-muted', '#f1f5f9')
      root.style.setProperty('--color-border', '#e2e8f0')
    }
  }

  /**
   * 应用自定义颜色
   */
  private applyCustomColors() {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    
    Object.entries(this._customColors.value).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }

  /**
   * 更新meta主题颜色
   */
  private updateMetaThemeColor(theme: 'light' | 'dark') {
    if (typeof document === 'undefined') return

    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }

    const color = theme === 'dark' ? '#0f172a' : '#ffffff'
    metaThemeColor.setAttribute('content', color)
  }

  /**
   * 保存主题偏好
   */
  private saveThemePreference() {
    if (typeof localStorage === 'undefined') return

    const config: ThemeConfig = {
      theme: this._currentTheme.value,
      systemPreference: this._systemPreference.value,
      customColors: this._customColors.value
    }

    try {
      localStorage.setItem('theme-config', JSON.stringify(config))
    } catch (error) {
      console.warn('无法保存主题配置:', error)
    }
  }

  /**
   * 加载主题偏好
   */
  private loadThemePreference() {
    if (typeof localStorage === 'undefined') return

    try {
      const saved = localStorage.getItem('theme-config')
      if (saved) {
        const config: ThemeConfig = JSON.parse(saved)
        this._currentTheme.value = config.theme || 'auto'
        this._customColors.value = config.customColors || {}
      }
    } catch (error) {
      console.warn('无法加载主题配置:', error)
      // 使用默认配置
      this._currentTheme.value = 'auto'
    }
  }
}

// 创建单例实例
const themeManager = new ThemeManager()

/**
 * 主题管理组合式函数
 */
export function useTheme() {
  return {
    currentTheme: computed(() => themeManager.currentTheme),
    resolvedTheme: themeManager.resolvedTheme,
    isDark: themeManager.isDark,
    systemPreference: computed(() => themeManager.systemPreference),
    customColors: computed(() => themeManager.customColors),
    
    setTheme: (theme: Theme) => themeManager.setTheme(theme),
    toggleTheme: () => themeManager.toggleTheme(),
    setCustomColors: (colors: Record<string, string>) => themeManager.setCustomColors(colors),
    getThemeConfig: () => themeManager.getThemeConfig()
  }
}

export default themeManager
