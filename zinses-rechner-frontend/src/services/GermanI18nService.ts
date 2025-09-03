/**
 * 德语单一化国际化服务
 * 专为德国市场优化的简化i18n服务
 * 基于Task 001审计结果重构，从831行简化到180行
 */

import { ref, reactive, computed } from 'vue'

// 简化的类型定义 - 仅支持德语
export type SupportedLocale = 'de'
export type TranslationKey = string
export type TranslationParams = Record<string, string | number>
export type TranslationFunction = (key: TranslationKey, params?: TranslationParams) => string

// 德语配置接口
export interface GermanLocaleConfig {
  code: 'de'
  name: 'German'
  nativeName: 'Deutsch'
  flag: '🇩🇪'
  dateFormat: 'DD.MM.YYYY'
  timeFormat: 'HH:mm'
  numberFormat: {
    decimal: ','
    thousands: '.'
    currency: '€'
  }
}

// 翻译消息接口
export interface TranslationMessages {
  [key: string]: string | TranslationMessages
}

// 简化的i18n状态
export interface GermanI18nState {
  locale: 'de'
  messages: TranslationMessages
  isLoading: boolean
}

/**
 * 德语单一化国际化服务类
 * 移除了多语言支持、动态加载、语言切换等复杂功能
 * 专注于德语翻译和德国本地化格式化
 */
export class GermanI18nService {
  private static instance: GermanI18nService

  // 简化的服务状态
  public readonly state = reactive<GermanI18nState>({
    locale: 'de',
    messages: {},
    isLoading: false
  })

  // 德语配置（固定）
  private readonly config: GermanLocaleConfig = {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: '€'
    }
  }

  // 简化的翻译缓存
  private translationCache = new Map<string, string>()

  public static getInstance(): GermanI18nService {
    if (!GermanI18nService.instance) {
      GermanI18nService.instance = new GermanI18nService()
    }
    return GermanI18nService.instance
  }

  constructor() {
    this.initializeService()
  }

  /**
   * 初始化服务 - 大幅简化
   */
  private async initializeService(): Promise<void> {
    // 设置HTML属性
    document.documentElement.lang = 'de'
    document.documentElement.dir = 'ltr'

    // 加载德语翻译
    await this.loadGermanMessages()
  }

  /**
   * 加载德语翻译消息
   */
  private async loadGermanMessages(): Promise<void> {
    if (Object.keys(this.state.messages).length > 0) {
      return // 已加载
    }

    this.state.isLoading = true

    try {
      // 静态导入德语文件
      const module = await import('../locales/de.ts')
      this.state.messages = module.default
      console.log('✅ German messages loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load German messages:', error)
      // 使用基础回退消息
      this.state.messages = this.getBasicGermanMessages()
    } finally {
      this.state.isLoading = false
    }
  }

  /**
   * 基础德语回退消息
   */
  private getBasicGermanMessages(): TranslationMessages {
    return {
      common: {
        loading: 'Wird geladen...',
        error: 'Fehler',
        success: 'Erfolgreich',
        cancel: 'Abbrechen',
        save: 'Speichern',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        close: 'Schließen'
      },
      app: {
        title: 'Zinseszins-Rechner',
        subtitle: 'Der transparente Zinseszins-Rechner für deutsche Sparer'
      }
    }
  }

  /**
   * 核心翻译函数 - 保持接口兼容性
   */
  public t(key: TranslationKey, params?: TranslationParams): string {
    // 检查缓存
    const cacheKey = `${key}:${JSON.stringify(params || {})}`
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!
    }

    // 获取翻译
    let translation = this.getTranslation(key)

    // 如果没有找到翻译，返回键名
    if (!translation) {
      console.warn(`Missing German translation for key: ${key}`)
      translation = key
    }

    // 参数替换
    if (params) {
      translation = this.interpolateParams(translation, params)
    }

    // 缓存结果
    this.translationCache.set(cacheKey, translation)

    return translation
  }

  /**
   * 获取翻译 - 简化版本
   */
  private getTranslation(key: string): string | null {
    const keys = key.split('.')
    let current: any = this.state.messages

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        return null
      }
    }

    return typeof current === 'string' ? current : null
  }

  /**
   * 参数插值 - 保持原有功能
   */
  private interpolateParams(text: string, params: TranslationParams): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match
    })
  }

  /**
   * 德语数字格式化
   */
  public formatNumber(value: number, decimals: number = 2): string {
    try {
      return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value)
    } catch (error) {
      console.warn('Number formatting failed:', error)
      return value.toFixed(decimals).replace('.', ',')
    }
  }

  /**
   * 德语货币格式化
   */
  public formatCurrency(value: number, decimals: number = 2): string {
    try {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value)
    } catch (error) {
      console.warn('Currency formatting failed:', error)
      return `${this.formatNumber(value, decimals)} €`
    }
  }

  /**
   * 德语日期格式化
   */
  public formatDate(date: Date | string | number): string {
    try {
      const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
      return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(dateObj)
    } catch (error) {
      console.warn('Date formatting failed:', error)
      return date.toString()
    }
  }

  /**
   * 德语时间格式化
   */
  public formatTime(date: Date | string | number): string {
    try {
      const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
      return new Intl.DateTimeFormat('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch (error) {
      console.warn('Time formatting failed:', error)
      return date.toString()
    }
  }

  /**
   * 获取德语配置
   */
  public getConfig(): GermanLocaleConfig {
    return { ...this.config }
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.translationCache.clear()
  }
}

// 导出单例实例
export const germanI18nService = GermanI18nService.getInstance()

// 简化的组合式API - 保持接口兼容性
export function useI18n() {
  const service = GermanI18nService.getInstance()

  return {
    // 状态 - 简化但保持兼容
    locale: computed(() => service.state.locale),
    availableLocales: computed(() => ['de'] as const),
    isLoading: computed(() => service.state.isLoading),
    isRTL: computed(() => false), // 德语不需要RTL

    // 方法 - 保持完整接口
    t: service.t.bind(service),
    formatNumber: service.formatNumber.bind(service),
    formatCurrency: service.formatCurrency.bind(service),
    formatDate: service.formatDate.bind(service),
    formatTime: service.formatTime.bind(service),
    
    // 简化的配置方法
    getCurrentLocaleConfig: service.getConfig.bind(service),
    getAvailableLocaleConfigs: () => [service.getConfig()],
    
    // 兼容性方法（无操作）
    setLocale: async () => Promise.resolve(), // 德语固定，无需切换
  }
}

// 默认导出服务实例
export default germanI18nService
