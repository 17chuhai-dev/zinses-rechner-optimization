/**
 * 多语言数据格式化服务
 * 提供基于语言环境的数字、日期、货币格式化功能
 */

import { i18nService } from './I18nService'
import type { SupportedLocale } from './I18nService'

// 格式化选项接口
export interface NumberFormatOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
  style?: 'decimal' | 'currency' | 'percent'
  currency?: string
  currencyDisplay?: 'symbol' | 'code' | 'name'
}

export interface DateFormatOptions {
  year?: 'numeric' | '2-digit'
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
  day?: 'numeric' | '2-digit'
  weekday?: 'long' | 'short' | 'narrow'
  hour?: 'numeric' | '2-digit'
  minute?: 'numeric' | '2-digit'
  second?: 'numeric' | '2-digit'
  timeZone?: string
  hour12?: boolean
}

export interface RelativeTimeFormatOptions {
  numeric?: 'always' | 'auto'
  style?: 'long' | 'short' | 'narrow'
}

// 语言环境特定的格式化配置
export interface LocaleFormatConfig {
  locale: SupportedLocale
  numberFormat: {
    decimal: string
    thousands: string
    currency: string
    currencyPosition: 'before' | 'after'
  }
  dateFormat: {
    short: string
    medium: string
    long: string
    full: string
  }
  timeFormat: {
    short: string
    medium: string
    long: string
  }
  firstDayOfWeek: number // 0 = Sunday, 1 = Monday
  rtl: boolean
}

export class LocaleFormatterService {
  private static instance: LocaleFormatterService
  
  // 语言环境格式化配置
  private formatConfigs: Record<SupportedLocale, LocaleFormatConfig> = {
    de: {
      locale: 'de',
      numberFormat: {
        decimal: ',',
        thousands: '.',
        currency: '€',
        currencyPosition: 'after'
      },
      dateFormat: {
        short: 'DD.MM.YYYY',
        medium: 'DD. MMM YYYY',
        long: 'DD. MMMM YYYY',
        full: 'dddd, DD. MMMM YYYY'
      },
      timeFormat: {
        short: 'HH:mm',
        medium: 'HH:mm:ss',
        long: 'HH:mm:ss z'
      },
      firstDayOfWeek: 1, // Monday
      rtl: false
    },
    en: {
      locale: 'en',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        currency: '$',
        currencyPosition: 'before'
      },
      dateFormat: {
        short: 'MM/DD/YYYY',
        medium: 'MMM DD, YYYY',
        long: 'MMMM DD, YYYY',
        full: 'dddd, MMMM DD, YYYY'
      },
      timeFormat: {
        short: 'h:mm A',
        medium: 'h:mm:ss A',
        long: 'h:mm:ss A z'
      },
      firstDayOfWeek: 0, // Sunday
      rtl: false
    },
    fr: {
      locale: 'fr',
      numberFormat: {
        decimal: ',',
        thousands: ' ',
        currency: '€',
        currencyPosition: 'after'
      },
      dateFormat: {
        short: 'DD/MM/YYYY',
        medium: 'DD MMM YYYY',
        long: 'DD MMMM YYYY',
        full: 'dddd DD MMMM YYYY'
      },
      timeFormat: {
        short: 'HH:mm',
        medium: 'HH:mm:ss',
        long: 'HH:mm:ss z'
      },
      firstDayOfWeek: 1, // Monday
      rtl: false
    },
    it: {
      locale: 'it',
      numberFormat: {
        decimal: ',',
        thousands: '.',
        currency: '€',
        currencyPosition: 'after'
      },
      dateFormat: {
        short: 'DD/MM/YYYY',
        medium: 'DD MMM YYYY',
        long: 'DD MMMM YYYY',
        full: 'dddd DD MMMM YYYY'
      },
      timeFormat: {
        short: 'HH:mm',
        medium: 'HH:mm:ss',
        long: 'HH:mm:ss z'
      },
      firstDayOfWeek: 1, // Monday
      rtl: false
    }
  }

  private constructor() {}

  public static getInstance(): LocaleFormatterService {
    if (!LocaleFormatterService.instance) {
      LocaleFormatterService.instance = new LocaleFormatterService()
    }
    return LocaleFormatterService.instance
  }

  /**
   * 格式化数字
   */
  public formatNumber(
    value: number,
    locale?: SupportedLocale,
    options?: NumberFormatOptions
  ): string {
    const currentLocale = locale || i18nService.getCurrentLocale()
    
    try {
      const formatter = new Intl.NumberFormat(currentLocale, {
        minimumFractionDigits: options?.minimumFractionDigits ?? 0,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
        useGrouping: options?.useGrouping ?? true,
        ...options
      })
      
      return formatter.format(value)
    } catch (error) {
      console.warn('数字格式化失败，使用回退方案:', error)
      return this.fallbackNumberFormat(value, currentLocale, options)
    }
  }

  /**
   * 格式化货币
   */
  public formatCurrency(
    value: number,
    currency?: string,
    locale?: SupportedLocale,
    options?: Omit<NumberFormatOptions, 'style' | 'currency'>
  ): string {
    const currentLocale = locale || i18nService.getCurrentLocale()
    const config = this.formatConfigs[currentLocale]
    const currencyCode = currency || (currentLocale === 'en' ? 'USD' : 'EUR')
    
    try {
      const formatter = new Intl.NumberFormat(currentLocale, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: options?.currencyDisplay ?? 'symbol',
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
        ...options
      })
      
      return formatter.format(value)
    } catch (error) {
      console.warn('货币格式化失败，使用回退方案:', error)
      return this.fallbackCurrencyFormat(value, currentLocale, currencyCode)
    }
  }

  /**
   * 格式化百分比
   */
  public formatPercentage(
    value: number,
    locale?: SupportedLocale,
    options?: Omit<NumberFormatOptions, 'style'>
  ): string {
    const currentLocale = locale || i18nService.getCurrentLocale()
    
    try {
      const formatter = new Intl.NumberFormat(currentLocale, {
        style: 'percent',
        minimumFractionDigits: options?.minimumFractionDigits ?? 1,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
        ...options
      })
      
      return formatter.format(value)
    } catch (error) {
      console.warn('百分比格式化失败，使用回退方案:', error)
      const config = this.formatConfigs[currentLocale]
      const formatted = this.fallbackNumberFormat(value * 100, currentLocale, options)
      return `${formatted}%`
    }
  }

  /**
   * 格式化日期
   */
  public formatDate(
    date: Date,
    locale?: SupportedLocale,
    options?: DateFormatOptions
  ): string {
    const currentLocale = locale || i18nService.getCurrentLocale()
    
    try {
      const formatter = new Intl.DateTimeFormat(currentLocale, {
        year: options?.year ?? 'numeric',
        month: options?.month ?? 'long',
        day: options?.day ?? 'numeric',
        ...options
      })
      
      return formatter.format(date)
    } catch (error) {
      console.warn('日期格式化失败，使用回退方案:', error)
      return this.fallbackDateFormat(date, currentLocale)
    }
  }

  /**
   * 格式化时间
   */
  public formatTime(
    date: Date,
    locale?: SupportedLocale,
    options?: DateFormatOptions
  ): string {
    const currentLocale = locale || i18nService.getCurrentLocale()
    
    try {
      const formatter = new Intl.DateTimeFormat(currentLocale, {
        hour: options?.hour ?? 'numeric',
        minute: options?.minute ?? '2-digit',
        second: options?.second,
        hour12: options?.hour12,
        ...options
      })
      
      return formatter.format(date)
    } catch (error) {
      console.warn('时间格式化失败，使用回退方案:', error)
      return this.fallbackTimeFormat(date, currentLocale)
    }
  }

  /**
   * 格式化相对时间
   */
  public formatRelativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    locale?: SupportedLocale,
    options?: RelativeTimeFormatOptions
  ): string {
    const currentLocale = locale || i18nService.getCurrentLocale()
    
    try {
      const formatter = new Intl.RelativeTimeFormat(currentLocale, {
        numeric: options?.numeric ?? 'auto',
        style: options?.style ?? 'long'
      })
      
      return formatter.format(value, unit)
    } catch (error) {
      console.warn('相对时间格式化失败，使用回退方案:', error)
      return this.fallbackRelativeTimeFormat(value, unit, currentLocale)
    }
  }

  /**
   * 获取语言环境配置
   */
  public getLocaleConfig(locale?: SupportedLocale): LocaleFormatConfig {
    const currentLocale = locale || i18nService.getCurrentLocale()
    return this.formatConfigs[currentLocale]
  }

  /**
   * 解析本地化数字
   */
  public parseLocalizedNumber(value: string, locale?: SupportedLocale): number | null {
    const currentLocale = locale || i18nService.getCurrentLocale()
    const config = this.formatConfigs[currentLocale]
    
    try {
      // 移除千位分隔符并替换小数点
      const normalized = value
        .replace(new RegExp(`\\${config.numberFormat.thousands}`, 'g'), '')
        .replace(config.numberFormat.decimal, '.')
      
      const parsed = parseFloat(normalized)
      return isNaN(parsed) ? null : parsed
    } catch (error) {
      console.warn('本地化数字解析失败:', error)
      return null
    }
  }

  /**
   * 数字格式化回退方案
   */
  private fallbackNumberFormat(
    value: number,
    locale: SupportedLocale,
    options?: NumberFormatOptions
  ): string {
    const config = this.formatConfigs[locale]
    const decimals = options?.maximumFractionDigits ?? 2
    
    let formatted = value.toFixed(decimals)
    
    // 替换小数点
    if (config.numberFormat.decimal !== '.') {
      formatted = formatted.replace('.', config.numberFormat.decimal)
    }
    
    // 添加千位分隔符
    if (options?.useGrouping !== false && config.numberFormat.thousands) {
      const parts = formatted.split(config.numberFormat.decimal)
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.numberFormat.thousands)
      formatted = parts.join(config.numberFormat.decimal)
    }
    
    return formatted
  }

  /**
   * 货币格式化回退方案
   */
  private fallbackCurrencyFormat(
    value: number,
    locale: SupportedLocale,
    currency: string
  ): string {
    const config = this.formatConfigs[locale]
    const formatted = this.fallbackNumberFormat(value, locale, { maximumFractionDigits: 2 })
    const symbol = config.numberFormat.currency
    
    return config.numberFormat.currencyPosition === 'before'
      ? `${symbol}${formatted}`
      : `${formatted} ${symbol}`
  }

  /**
   * 日期格式化回退方案
   */
  private fallbackDateFormat(date: Date, locale: SupportedLocale): string {
    const config = this.formatConfigs[locale]
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    
    switch (locale) {
      case 'en':
        return `${month}/${day}/${year}`
      case 'de':
      case 'fr':
      case 'it':
      default:
        return `${day}.${month}.${year}`
    }
  }

  /**
   * 时间格式化回退方案
   */
  private fallbackTimeFormat(date: Date, locale: SupportedLocale): string {
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    if (locale === 'en') {
      const hour12 = hours % 12 || 12
      const ampm = hours >= 12 ? 'PM' : 'AM'
      return `${hour12}:${minutes} ${ampm}`
    } else {
      return `${hours.toString().padStart(2, '0')}:${minutes}`
    }
  }

  /**
   * 相对时间格式化回退方案
   */
  private fallbackRelativeTimeFormat(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    locale: SupportedLocale
  ): string {
    const absValue = Math.abs(value)
    const isPast = value < 0
    
    // 简化的相对时间标签
    const labels: Record<SupportedLocale, Record<string, { singular: string; plural: string }>> = {
      de: {
        second: { singular: 'Sekunde', plural: 'Sekunden' },
        minute: { singular: 'Minute', plural: 'Minuten' },
        hour: { singular: 'Stunde', plural: 'Stunden' },
        day: { singular: 'Tag', plural: 'Tage' },
        week: { singular: 'Woche', plural: 'Wochen' },
        month: { singular: 'Monat', plural: 'Monate' },
        year: { singular: 'Jahr', plural: 'Jahre' }
      },
      en: {
        second: { singular: 'second', plural: 'seconds' },
        minute: { singular: 'minute', plural: 'minutes' },
        hour: { singular: 'hour', plural: 'hours' },
        day: { singular: 'day', plural: 'days' },
        week: { singular: 'week', plural: 'weeks' },
        month: { singular: 'month', plural: 'months' },
        year: { singular: 'year', plural: 'years' }
      },
      fr: {
        second: { singular: 'seconde', plural: 'secondes' },
        minute: { singular: 'minute', plural: 'minutes' },
        hour: { singular: 'heure', plural: 'heures' },
        day: { singular: 'jour', plural: 'jours' },
        week: { singular: 'semaine', plural: 'semaines' },
        month: { singular: 'mois', plural: 'mois' },
        year: { singular: 'année', plural: 'années' }
      },
      it: {
        second: { singular: 'secondo', plural: 'secondi' },
        minute: { singular: 'minuto', plural: 'minuti' },
        hour: { singular: 'ora', plural: 'ore' },
        day: { singular: 'giorno', plural: 'giorni' },
        week: { singular: 'settimana', plural: 'settimane' },
        month: { singular: 'mese', plural: 'mesi' },
        year: { singular: 'anno', plural: 'anni' }
      }
    }
    
    const unitLabels = labels[locale][unit]
    const unitLabel = absValue === 1 ? unitLabels.singular : unitLabels.plural
    
    const prefixes: Record<SupportedLocale, { past: string; future: string }> = {
      de: { past: 'vor', future: 'in' },
      en: { past: '', future: 'in' },
      fr: { past: 'il y a', future: 'dans' },
      it: { past: '', future: 'tra' }
    }
    
    const suffixes: Record<SupportedLocale, { past: string; future: string }> = {
      de: { past: '', future: '' },
      en: { past: 'ago', future: '' },
      fr: { past: '', future: '' },
      it: { past: 'fa', future: '' }
    }
    
    const prefix = isPast ? prefixes[locale].past : prefixes[locale].future
    const suffix = isPast ? suffixes[locale].past : suffixes[locale].future
    
    const parts = [prefix, `${absValue} ${unitLabel}`, suffix].filter(Boolean)
    return parts.join(' ')
  }
}

// 导出单例实例
export const localeFormatterService = LocaleFormatterService.getInstance()
