/**
 * 国际化服务
 * 提供标准的i18n架构，虽然目前只支持德语，但为未来扩展做好准备
 */

import { ref, reactive, computed } from 'vue'

// 支持的语言
export type SupportedLocale = 'de' | 'en' | 'fr' | 'it'

// 翻译键类型
export type TranslationKey = string

// 翻译参数类型
export type TranslationParams = Record<string, string | number>

// 翻译函数类型
export type TranslationFunction = (key: TranslationKey, params?: TranslationParams) => string

// 语言配置接口
export interface LocaleConfig {
  code: SupportedLocale
  name: string
  nativeName: string
  flag: string
  rtl: boolean
  dateFormat: string
  timeFormat: string
  numberFormat: {
    decimal: string
    thousands: string
    currency: string
  }
}

// 翻译消息接口
export interface TranslationMessages {
  [key: string]: string | TranslationMessages
}

// i18n状态接口
export interface I18nState {
  currentLocale: SupportedLocale
  availableLocales: SupportedLocale[]
  messages: Record<SupportedLocale, TranslationMessages>
  fallbackLocale: SupportedLocale
  isLoading: boolean
  loadedLocales: Set<SupportedLocale>
}

/**
 * 国际化服务类
 */
export class I18nService {
  private static instance: I18nService

  // 服务状态
  public readonly state = reactive<I18nState>({
    currentLocale: 'de',
    availableLocales: ['de', 'en', 'fr', 'it'],
    messages: {},
    fallbackLocale: 'de',
    isLoading: false,
    loadedLocales: new Set(['de'])
  })

  // 语言配置
  private localeConfigs: Record<SupportedLocale, LocaleConfig> = {
    de: {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      rtl: false,
      dateFormat: 'DD.MM.YYYY',
      timeFormat: 'HH:mm',
      numberFormat: {
        decimal: ',',
        thousands: '.',
        currency: '€'
      }
    },
    en: {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      rtl: false,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'h:mm A',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        currency: '$'
      }
    },
    fr: {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      rtl: false,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      numberFormat: {
        decimal: ',',
        thousands: ' ',
        currency: '€'
      }
    },
    it: {
      code: 'it',
      name: 'Italian',
      nativeName: 'Italiano',
      flag: '🇮🇹',
      rtl: false,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      numberFormat: {
        decimal: ',',
        thousands: '.',
        currency: '€'
      }
    }
  }

  // 缓存的翻译函数
  private translationCache = new Map<string, string>()

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService()
    }
    return I18nService.instance
  }

  constructor() {
    this.initializeService()
  }

  /**
   * 初始化服务
   */
  private async initializeService(): Promise<void> {
    // 检测浏览器语言
    const browserLocale = this.detectBrowserLocale()

    // 从本地存储加载保存的语言
    const savedLocale = this.loadSavedLocale()

    // 确定初始语言
    const initialLocale = savedLocale || browserLocale || 'de'

    // 加载德语翻译（默认语言）
    await this.loadLocaleMessages('de')

    // 设置当前语言
    await this.setLocale(initialLocale)
  }

  /**
   * 检测浏览器语言
   */
  private detectBrowserLocale(): SupportedLocale | null {
    const browserLang = navigator.language.toLowerCase()

    // 精确匹配
    if (browserLang === 'de' || browserLang === 'de-de') {
      return 'de'
    }

    if (browserLang === 'en' || browserLang.startsWith('en-')) {
      return 'en'
    }

    // 检查语言前缀
    const langPrefix = browserLang.split('-')[0]
    if (langPrefix === 'de') return 'de'
    if (langPrefix === 'en') return 'en'

    return null
  }

  /**
   * 从本地存储加载保存的语言
   */
  private loadSavedLocale(): SupportedLocale | null {
    try {
      const saved = localStorage.getItem('zinses-rechner-locale')
      if (saved && this.isValidLocale(saved)) {
        return saved as SupportedLocale
      }
    } catch (error) {
      console.warn('Failed to load saved locale:', error)
    }
    return null
  }

  /**
   * 保存语言到本地存储
   */
  private saveLocale(locale: SupportedLocale): void {
    try {
      localStorage.setItem('zinses-rechner-locale', locale)
    } catch (error) {
      console.warn('Failed to save locale:', error)
    }
  }

  /**
   * 验证语言代码是否有效
   */
  private isValidLocale(locale: string): boolean {
    return this.state.availableLocales.includes(locale as SupportedLocale)
  }

  /**
   * 加载语言消息
   */
  private async loadLocaleMessages(locale: SupportedLocale): Promise<void> {
    if (this.state.loadedLocales.has(locale)) {
      return
    }

    this.state.isLoading = true

    try {
      // 动态导入语言文件
      const messages = await this.importLocaleMessages(locale)
      this.state.messages[locale] = messages
      this.state.loadedLocales.add(locale)

      console.log(`✅ Loaded locale messages for: ${locale}`)
    } catch (error) {
      console.error(`❌ Failed to load locale messages for ${locale}:`, error)

      // 如果不是回退语言，尝试加载回退语言
      if (locale !== this.state.fallbackLocale) {
        await this.loadLocaleMessages(this.state.fallbackLocale)
      }
    } finally {
      this.state.isLoading = false
    }
  }

  /**
   * 动态导入语言消息
   */
  private async importLocaleMessages(locale: SupportedLocale): Promise<TranslationMessages> {
    try {
      // 动态导入语言文件
      const module = await import(`../locales/${locale}.ts`)
      return module.default
    } catch (error) {
      console.warn(`Failed to load locale file for ${locale}, using fallback messages`)

      // 如果文件不存在，返回基础消息
      switch (locale) {
        case 'de':
          return this.getGermanMessages()
        case 'en':
          return this.getEnglishMessages()
        case 'fr':
          return this.getFrenchMessages()
        case 'it':
          return this.getItalianMessages()
        default:
          throw new Error(`Unsupported locale: ${locale}`)
      }
    }
  }

  /**
   * 获取德语翻译消息
   */
  private getGermanMessages(): TranslationMessages {
    return {
      common: {
        yes: 'Ja',
        no: 'Nein',
        ok: 'OK',
        cancel: 'Abbrechen',
        save: 'Speichern',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        close: 'Schließen',
        back: 'Zurück',
        next: 'Weiter',
        previous: 'Zurück',
        loading: 'Wird geladen...',
        error: 'Fehler',
        success: 'Erfolgreich',
        warning: 'Warnung',
        info: 'Information'
      },
      navigation: {
        home: 'Startseite',
        calculator: 'Rechner',
        history: 'Verlauf',
        settings: 'Einstellungen',
        help: 'Hilfe',
        about: 'Über uns',
        contact: 'Kontakt'
      },
      calculator: {
        title: 'Zinseszins-Rechner',
        principal: 'Anfangskapital',
        rate: 'Zinssatz',
        time: 'Laufzeit',
        compound: 'Zinseszins',
        calculate: 'Berechnen',
        result: 'Ergebnis',
        finalAmount: 'Endkapital',
        totalInterest: 'Gesamtzinsen',
        yearlyBreakdown: 'Jährliche Aufschlüsselung'
      },
      validation: {
        required: 'Dieses Feld ist erforderlich',
        invalidNumber: 'Bitte geben Sie eine gültige Zahl ein',
        invalidEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        minValue: 'Der Wert muss mindestens {min} betragen',
        maxValue: 'Der Wert darf höchstens {max} betragen',
        minLength: 'Mindestens {min} Zeichen erforderlich',
        maxLength: 'Höchstens {max} Zeichen erlaubt'
      },
      errors: {
        networkError: 'Netzwerkfehler aufgetreten',
        calculationError: 'Fehler bei der Berechnung',
        validationError: 'Eingabefehler',
        unknownError: 'Ein unbekannter Fehler ist aufgetreten',
        offline: 'Keine Internetverbindung'
      },
      dates: {
        today: 'Heute',
        yesterday: 'Gestern',
        tomorrow: 'Morgen',
        thisWeek: 'Diese Woche',
        lastWeek: 'Letzte Woche',
        thisMonth: 'Dieser Monat',
        lastMonth: 'Letzter Monat',
        thisYear: 'Dieses Jahr',
        lastYear: 'Letztes Jahr'
      },
      units: {
        currency: '€',
        percent: '%',
        years: 'Jahre',
        months: 'Monate',
        days: 'Tage'
      }
    }
  }

  /**
   * 获取英语翻译消息（未来扩展）
   */
  private getEnglishMessages(): TranslationMessages {
    return {
      common: {
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information'
      },
      navigation: {
        home: 'Home',
        calculator: 'Calculator',
        history: 'History',
        settings: 'Settings',
        help: 'Help',
        about: 'About',
        contact: 'Contact'
      },
      calculator: {
        title: 'Compound Interest Calculator',
        principal: 'Principal Amount',
        rate: 'Interest Rate',
        time: 'Time Period',
        compound: 'Compound Interest',
        calculate: 'Calculate',
        result: 'Result',
        finalAmount: 'Final Amount',
        totalInterest: 'Total Interest',
        yearlyBreakdown: 'Yearly Breakdown'
      },
      validation: {
        required: 'This field is required',
        invalidNumber: 'Please enter a valid number',
        invalidEmail: 'Please enter a valid email address',
        minValue: 'Value must be at least {min}',
        maxValue: 'Value must not exceed {max}',
        minLength: 'Minimum {min} characters required',
        maxLength: 'Maximum {max} characters allowed'
      },
      errors: {
        networkError: 'Network error occurred',
        calculationError: 'Calculation error',
        validationError: 'Validation error',
        unknownError: 'An unknown error occurred',
        offline: 'No internet connection'
      },
      dates: {
        today: 'Today',
        yesterday: 'Yesterday',
        tomorrow: 'Tomorrow',
        thisWeek: 'This Week',
        lastWeek: 'Last Week',
        thisMonth: 'This Month',
        lastMonth: 'Last Month',
        thisYear: 'This Year',
        lastYear: 'Last Year'
      },
      units: {
        currency: '$',
        percent: '%',
        years: 'Years',
        months: 'Months',
        days: 'Days'
      }
    }
  }

  /**
   * 设置当前语言
   */
  public async setLocale(locale: SupportedLocale): Promise<void> {
    if (!this.isValidLocale(locale)) {
      console.warn(`Invalid locale: ${locale}, falling back to ${this.state.fallbackLocale}`)
      locale = this.state.fallbackLocale
    }

    // 加载语言消息
    await this.loadLocaleMessages(locale)

    // 更新当前语言
    this.state.currentLocale = locale

    // 保存到本地存储
    this.saveLocale(locale)

    // 清除翻译缓存
    this.translationCache.clear()

    // 更新HTML lang属性
    document.documentElement.lang = locale

    // 更新HTML dir属性（RTL支持）
    const config = this.localeConfigs[locale]
    document.documentElement.dir = config.rtl ? 'rtl' : 'ltr'

    console.log(`✅ Locale set to: ${locale}`)
  }

  /**
   * 翻译函数
   */
  public t(key: TranslationKey, params?: TranslationParams): string {
    // 检查缓存
    const cacheKey = `${this.state.currentLocale}:${key}:${JSON.stringify(params || {})}`
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!
    }

    // 获取翻译
    let translation = this.getTranslation(key, this.state.currentLocale)

    // 如果没有找到翻译，尝试回退语言
    if (!translation && this.state.currentLocale !== this.state.fallbackLocale) {
      translation = this.getTranslation(key, this.state.fallbackLocale)
    }

    // 如果仍然没有找到，返回键名
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`)
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
   * 获取翻译
   */
  private getTranslation(key: TranslationKey, locale: SupportedLocale): string | null {
    const messages = this.state.messages[locale]
    if (!messages) return null

    const keys = key.split('.')
    let current: any = messages

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
   * 参数插值
   */
  private interpolateParams(template: string, params: TranslationParams): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match
    })
  }

  /**
   * 格式化数字
   */
  public formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const config = this.localeConfigs[this.state.currentLocale]

    try {
      return new Intl.NumberFormat(this.state.currentLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
      }).format(value)
    } catch (error) {
      // 回退到手动格式化
      const formatted = value.toFixed(options?.minimumFractionDigits || 2)
      return formatted
        .replace('.', config.numberFormat.decimal)
        .replace(/\B(?=(\d{3})+(?!\d))/g, config.numberFormat.thousands)
    }
  }

  /**
   * 格式化货币
   */
  public formatCurrency(value: number, options?: Intl.NumberFormatOptions): string {
    const config = this.localeConfigs[this.state.currentLocale]

    try {
      return new Intl.NumberFormat(this.state.currentLocale, {
        style: 'currency',
        currency: this.state.currentLocale === 'de' ? 'EUR' : 'USD',
        ...options
      }).format(value)
    } catch (error) {
      // 回退到手动格式化
      const formatted = this.formatNumber(value, options)
      return `${formatted} ${config.numberFormat.currency}`
    }
  }

  /**
   * 格式化日期
   */
  public formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.state.currentLocale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...options
      }).format(date)
    } catch (error) {
      // 回退到简单格式化
      const config = this.localeConfigs[this.state.currentLocale]
      if (config.dateFormat === 'DD.MM.YYYY') {
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
      } else {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`
      }
    }
  }

  /**
   * 格式化时间
   */
  public formatTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.state.currentLocale, {
        hour: '2-digit',
        minute: '2-digit',
        ...options
      }).format(date)
    } catch (error) {
      // 回退到简单格式化
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  }

  /**
   * 获取当前语言配置
   */
  public getCurrentLocaleConfig(): LocaleConfig {
    return this.localeConfigs[this.state.currentLocale]
  }

  /**
   * 获取所有可用语言配置
   */
  public getAvailableLocaleConfigs(): LocaleConfig[] {
    return this.state.availableLocales.map(locale => this.localeConfigs[locale])
  }

  /**
   * 检查是否为RTL语言
   */
  public isRTL(): boolean {
    return this.localeConfigs[this.state.currentLocale].rtl
  }

  /**
   * 获取当前语言
   */
  public getCurrentLocale(): SupportedLocale {
    return this.state.currentLocale
  }

  /**
   * 检查语言是否已加载
   */
  public isLocaleLoaded(locale: SupportedLocale): boolean {
    return this.state.loadedLocales.has(locale)
  }

  /**
   * 获取法语翻译消息
   */
  private getFrenchMessages(): TranslationMessages {
    return {
      common: {
        yes: 'Oui',
        no: 'Non',
        ok: 'OK',
        cancel: 'Annuler',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        close: 'Fermer',
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        warning: 'Avertissement',
        info: 'Information'
      },
      navigation: {
        home: 'Accueil',
        calculator: 'Calculateur',
        history: 'Historique',
        settings: 'Paramètres',
        help: 'Aide',
        about: 'À propos',
        contact: 'Contact'
      },
      calculator: {
        title: 'Calculateur d\'Intérêts Composés',
        principal: 'Capital Initial',
        rate: 'Taux d\'Intérêt',
        time: 'Période',
        compound: 'Intérêts Composés',
        calculate: 'Calculer',
        result: 'Résultat',
        finalAmount: 'Montant Final',
        totalInterest: 'Intérêts Totaux',
        yearlyBreakdown: 'Répartition Annuelle'
      },
      validation: {
        required: 'Ce champ est obligatoire',
        invalidNumber: 'Veuillez saisir un nombre valide',
        invalidEmail: 'Veuillez saisir une adresse e-mail valide',
        minValue: 'La valeur doit être d\'au moins {min}',
        maxValue: 'La valeur ne doit pas dépasser {max}',
        minLength: 'Au moins {min} caractères requis',
        maxLength: 'Maximum {max} caractères autorisés'
      },
      errors: {
        networkError: 'Erreur réseau',
        calculationError: 'Erreur de calcul',
        validationError: 'Erreur de validation',
        unknownError: 'Une erreur inconnue s\'est produite',
        offline: 'Pas de connexion Internet'
      },
      dates: {
        today: 'Aujourd\'hui',
        yesterday: 'Hier',
        tomorrow: 'Demain',
        thisWeek: 'Cette semaine',
        lastWeek: 'La semaine dernière',
        thisMonth: 'Ce mois',
        lastMonth: 'Le mois dernier',
        thisYear: 'Cette année',
        lastYear: 'L\'année dernière'
      },
      units: {
        currency: '€',
        percent: '%',
        years: 'années',
        months: 'mois',
        days: 'jours'
      }
    }
  }

  /**
   * 获取意大利语翻译消息
   */
  private getItalianMessages(): TranslationMessages {
    return {
      common: {
        yes: 'Sì',
        no: 'No',
        ok: 'OK',
        cancel: 'Annulla',
        save: 'Salva',
        delete: 'Elimina',
        edit: 'Modifica',
        close: 'Chiudi',
        back: 'Indietro',
        next: 'Avanti',
        previous: 'Precedente',
        loading: 'Caricamento...',
        error: 'Errore',
        success: 'Successo',
        warning: 'Avviso',
        info: 'Informazione'
      },
      navigation: {
        home: 'Home',
        calculator: 'Calcolatore',
        history: 'Cronologia',
        settings: 'Impostazioni',
        help: 'Aiuto',
        about: 'Informazioni',
        contact: 'Contatto'
      },
      calculator: {
        title: 'Calcolatore di Interesse Composto',
        principal: 'Capitale Iniziale',
        rate: 'Tasso di Interesse',
        time: 'Periodo',
        compound: 'Interesse Composto',
        calculate: 'Calcola',
        result: 'Risultato',
        finalAmount: 'Importo Finale',
        totalInterest: 'Interesse Totale',
        yearlyBreakdown: 'Ripartizione Annuale'
      },
      validation: {
        required: 'Questo campo è obbligatorio',
        invalidNumber: 'Inserisci un numero valido',
        invalidEmail: 'Inserisci un indirizzo email valido',
        minValue: 'Il valore deve essere almeno {min}',
        maxValue: 'Il valore non deve superare {max}',
        minLength: 'Almeno {min} caratteri richiesti',
        maxLength: 'Massimo {max} caratteri consentiti'
      },
      errors: {
        networkError: 'Errore di rete',
        calculationError: 'Errore di calcolo',
        validationError: 'Errore di validazione',
        unknownError: 'Si è verificato un errore sconosciuto',
        offline: 'Nessuna connessione Internet'
      },
      dates: {
        today: 'Oggi',
        yesterday: 'Ieri',
        tomorrow: 'Domani',
        thisWeek: 'Questa settimana',
        lastWeek: 'La settimana scorsa',
        thisMonth: 'Questo mese',
        lastMonth: 'Il mese scorso',
        thisYear: 'Quest\'anno',
        lastYear: 'L\'anno scorso'
      },
      units: {
        currency: '€',
        percent: '%',
        years: 'anni',
        months: 'mesi',
        days: 'giorni'
      }
    }
  }
}

// 导出单例实例
export const i18nService = I18nService.getInstance()

// 便捷的组合式API
export function useI18n() {
  const service = I18nService.getInstance()

  return {
    // 状态
    locale: computed(() => service.state.currentLocale),
    availableLocales: computed(() => service.state.availableLocales),
    isLoading: computed(() => service.state.isLoading),
    isRTL: computed(() => service.isRTL()),

    // 方法
    t: service.t.bind(service),
    setLocale: service.setLocale.bind(service),
    formatNumber: service.formatNumber.bind(service),
    formatCurrency: service.formatCurrency.bind(service),
    formatDate: service.formatDate.bind(service),
    formatTime: service.formatTime.bind(service),
    getCurrentLocaleConfig: service.getCurrentLocaleConfig.bind(service),
    getAvailableLocaleConfigs: service.getAvailableLocaleConfigs.bind(service)
  }
}
