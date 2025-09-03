/**
 * 屏幕阅读器优化服务
 * 提供完整的屏幕阅读器支持，包括ARIA标签、语义化HTML、朗读优化
 */

import { ref, reactive, nextTick } from 'vue'

// 屏幕阅读器配置接口
export interface ScreenReaderConfig {
  announceChanges: boolean
  announceNavigation: boolean
  announceCalculations: boolean
  announceErrors: boolean
  verboseMode: boolean
  politeAnnouncements: boolean
  language: 'de' | 'en'
}

// 公告类型
export type AnnouncementType = 'polite' | 'assertive' | 'off'

// 公告消息接口
export interface AnnouncementMessage {
  id: string
  message: string
  type: AnnouncementType
  timestamp: Date
  context?: string
  priority: 'low' | 'medium' | 'high'
}

// ARIA属性接口
export interface AriaAttributes {
  role?: string
  label?: string
  labelledby?: string
  describedby?: string
  expanded?: boolean
  selected?: boolean
  checked?: boolean
  disabled?: boolean
  hidden?: boolean
  live?: 'off' | 'polite' | 'assertive'
  atomic?: boolean
  relevant?: string
  busy?: boolean
  controls?: string
  owns?: string
  flowto?: string
  level?: number
  setsize?: number
  posinset?: number
}

// 语义化结构接口
export interface SemanticStructure {
  landmarks: Array<{
    type: 'main' | 'navigation' | 'banner' | 'contentinfo' | 'complementary' | 'search' | 'form'
    element: HTMLElement
    label?: string
  }>
  headings: Array<{
    level: number
    element: HTMLElement
    text: string
  }>
  regions: Array<{
    type: string
    element: HTMLElement
    label?: string
  }>
}

/**
 * 屏幕阅读器优化服务类
 */
export class ScreenReaderService {
  private static instance: ScreenReaderService

  // 服务状态
  public readonly state = reactive({
    isEnabled: true,
    announcements: [] as AnnouncementMessage[],
    currentFocus: null as HTMLElement | null,
    semanticStructure: null as SemanticStructure | null,
    isScreenReaderDetected: false
  })

  // 配置
  private config = ref<ScreenReaderConfig>({
    announceChanges: true,
    announceNavigation: true,
    announceCalculations: true,
    announceErrors: true,
    verboseMode: false,
    politeAnnouncements: true,
    language: 'de'
  })

  // 实时区域元素
  private liveRegions = new Map<AnnouncementType, HTMLElement>()
  
  // 消息队列
  private messageQueue: AnnouncementMessage[] = []
  private isProcessingQueue = false

  // 德语文本模板
  private germanTexts = {
    navigation: {
      pageLoaded: 'Seite geladen',
      sectionEntered: 'Bereich betreten: {section}',
      calculatorSelected: 'Rechner ausgewählt: {calculator}',
      formFieldFocused: 'Eingabefeld fokussiert: {field}',
      buttonActivated: 'Schaltfläche aktiviert: {button}'
    },
    calculation: {
      started: 'Berechnung gestartet',
      completed: 'Berechnung abgeschlossen',
      resultsAvailable: 'Ergebnisse verfügbar',
      errorOccurred: 'Fehler bei der Berechnung aufgetreten',
      inputChanged: 'Eingabe geändert: {field} auf {value}'
    },
    ui: {
      modalOpened: 'Dialog geöffnet: {title}',
      modalClosed: 'Dialog geschlossen',
      tabSelected: 'Registerkarte ausgewählt: {tab}',
      menuExpanded: 'Menü erweitert',
      menuCollapsed: 'Menü eingeklappt',
      loadingStarted: 'Laden gestartet',
      loadingCompleted: 'Laden abgeschlossen'
    },
    data: {
      chartDescription: 'Diagramm mit {points} Datenpunkten',
      tableDescription: 'Tabelle mit {rows} Zeilen und {columns} Spalten',
      resultSummary: 'Ergebnis: {result}',
      comparisonAvailable: 'Vergleich verfügbar zwischen {items} Elementen'
    },
    errors: {
      validationError: 'Eingabefehler: {message}',
      networkError: 'Netzwerkfehler aufgetreten',
      calculationError: 'Berechnungsfehler: {message}',
      generalError: 'Fehler aufgetreten: {message}'
    }
  }

  public static getInstance(): ScreenReaderService {
    if (!ScreenReaderService.instance) {
      ScreenReaderService.instance = new ScreenReaderService()
    }
    return ScreenReaderService.instance
  }

  constructor() {
    this.initializeService()
  }

  /**
   * 初始化服务
   */
  private initializeService(): void {
    this.detectScreenReader()
    this.createLiveRegions()
    this.loadConfiguration()
    this.setupEventListeners()
  }

  /**
   * 检测屏幕阅读器
   */
  private detectScreenReader(): void {
    // 检测常见的屏幕阅读器
    const userAgent = navigator.userAgent.toLowerCase()
    const hasScreenReader = 
      // NVDA
      userAgent.includes('nvda') ||
      // JAWS
      userAgent.includes('jaws') ||
      // VoiceOver (通过特定的媒体查询)
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      // 检查是否有辅助技术API
      'speechSynthesis' in window ||
      // 检查高对比度模式
      window.matchMedia('(prefers-contrast: high)').matches

    this.state.isScreenReaderDetected = hasScreenReader

    // 如果检测到屏幕阅读器，启用详细模式
    if (hasScreenReader) {
      this.config.value.verboseMode = true
    }
  }

  /**
   * 创建实时区域
   */
  private createLiveRegions(): void {
    if (typeof document === 'undefined') return

    // 创建polite实时区域
    const politeRegion = document.createElement('div')
    politeRegion.setAttribute('aria-live', 'polite')
    politeRegion.setAttribute('aria-atomic', 'true')
    politeRegion.setAttribute('class', 'sr-only')
    politeRegion.setAttribute('id', 'sr-polite-announcements')
    document.body.appendChild(politeRegion)
    this.liveRegions.set('polite', politeRegion)

    // 创建assertive实时区域
    const assertiveRegion = document.createElement('div')
    assertiveRegion.setAttribute('aria-live', 'assertive')
    assertiveRegion.setAttribute('aria-atomic', 'true')
    assertiveRegion.setAttribute('class', 'sr-only')
    assertiveRegion.setAttribute('id', 'sr-assertive-announcements')
    document.body.appendChild(assertiveRegion)
    this.liveRegions.set('assertive', assertiveRegion)

    // 创建状态区域
    const statusRegion = document.createElement('div')
    statusRegion.setAttribute('role', 'status')
    statusRegion.setAttribute('aria-live', 'polite')
    statusRegion.setAttribute('class', 'sr-only')
    statusRegion.setAttribute('id', 'sr-status')
    document.body.appendChild(statusRegion)
    this.liveRegions.set('off', statusRegion)
  }

  /**
   * 公告消息
   */
  public announce(message: string, type: AnnouncementType = 'polite', context?: string): void {
    if (!this.state.isEnabled || !message.trim()) return

    const announcement: AnnouncementMessage = {
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: message.trim(),
      type,
      timestamp: new Date(),
      context,
      priority: type === 'assertive' ? 'high' : 'medium'
    }

    this.state.announcements.push(announcement)
    this.messageQueue.push(announcement)

    // 处理消息队列
    this.processMessageQueue()
  }

  /**
   * 处理消息队列
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return

    this.isProcessingQueue = true

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!
      await this.deliverMessage(message)
      
      // 短暂延迟，避免消息重叠
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.isProcessingQueue = false
  }

  /**
   * 传递消息到实时区域
   */
  private async deliverMessage(message: AnnouncementMessage): Promise<void> {
    const region = this.liveRegions.get(message.type)
    if (!region) return

    // 清空区域
    region.textContent = ''
    
    // 等待DOM更新
    await nextTick()
    
    // 设置新消息
    region.textContent = message.message

    // 记录消息历史
    if (this.state.announcements.length > 50) {
      this.state.announcements.shift()
    }
  }

  /**
   * 公告导航变化
   */
  public announceNavigation(action: string, target?: string): void {
    if (!this.config.value.announceNavigation) return

    let message = ''
    switch (action) {
      case 'pageLoaded':
        message = this.germanTexts.navigation.pageLoaded
        break
      case 'sectionEntered':
        message = this.germanTexts.navigation.sectionEntered.replace('{section}', target || '')
        break
      case 'calculatorSelected':
        message = this.germanTexts.navigation.calculatorSelected.replace('{calculator}', target || '')
        break
      case 'formFieldFocused':
        message = this.germanTexts.navigation.formFieldFocused.replace('{field}', target || '')
        break
      case 'buttonActivated':
        message = this.germanTexts.navigation.buttonActivated.replace('{button}', target || '')
        break
    }

    if (message) {
      this.announce(message, 'polite', 'navigation')
    }
  }

  /**
   * 公告计算状态
   */
  public announceCalculation(status: string, details?: string): void {
    if (!this.config.value.announceCalculations) return

    let message = ''
    switch (status) {
      case 'started':
        message = this.germanTexts.calculation.started
        break
      case 'completed':
        message = this.germanTexts.calculation.completed
        break
      case 'resultsAvailable':
        message = this.germanTexts.calculation.resultsAvailable
        break
      case 'error':
        message = this.germanTexts.calculation.errorOccurred
        break
      case 'inputChanged':
        message = details || this.germanTexts.calculation.inputChanged
        break
    }

    if (message) {
      const type = status === 'error' ? 'assertive' : 'polite'
      this.announce(message, type, 'calculation')
    }
  }

  /**
   * 公告UI变化
   */
  public announceUIChange(change: string, details?: string): void {
    if (!this.config.value.announceChanges) return

    let message = ''
    switch (change) {
      case 'modalOpened':
        message = this.germanTexts.ui.modalOpened.replace('{title}', details || 'Dialog')
        break
      case 'modalClosed':
        message = this.germanTexts.ui.modalClosed
        break
      case 'tabSelected':
        message = this.germanTexts.ui.tabSelected.replace('{tab}', details || '')
        break
      case 'menuExpanded':
        message = this.germanTexts.ui.menuExpanded
        break
      case 'menuCollapsed':
        message = this.germanTexts.ui.menuCollapsed
        break
      case 'loadingStarted':
        message = this.germanTexts.ui.loadingStarted
        break
      case 'loadingCompleted':
        message = this.germanTexts.ui.loadingCompleted
        break
    }

    if (message) {
      this.announce(message, 'polite', 'ui')
    }
  }

  /**
   * 公告错误
   */
  public announceError(error: string, details?: string): void {
    if (!this.config.value.announceErrors) return

    let message = ''
    if (error.includes('validation')) {
      message = this.germanTexts.errors.validationError.replace('{message}', details || error)
    } else if (error.includes('network')) {
      message = this.germanTexts.errors.networkError
    } else if (error.includes('calculation')) {
      message = this.germanTexts.errors.calculationError.replace('{message}', details || error)
    } else {
      message = this.germanTexts.errors.generalError.replace('{message}', details || error)
    }

    this.announce(message, 'assertive', 'error')
  }

  /**
   * 设置ARIA属性
   */
  public setAriaAttributes(element: HTMLElement, attributes: AriaAttributes): void {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          element.setAttribute(`aria-${key}`, value.toString())
        } else {
          element.setAttribute(`aria-${key}`, value.toString())
        }
      }
    })
  }

  /**
   * 创建描述性文本
   */
  public createDescription(element: HTMLElement, description: string): string {
    const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const descElement = document.createElement('div')
    descElement.id = descId
    descElement.className = 'sr-only'
    descElement.textContent = description
    
    element.parentNode?.insertBefore(descElement, element.nextSibling)
    element.setAttribute('aria-describedby', descId)
    
    return descId
  }

  /**
   * 分析页面语义结构
   */
  public analyzeSemanticStructure(): SemanticStructure {
    const structure: SemanticStructure = {
      landmarks: [],
      headings: [],
      regions: []
    }

    // 分析地标
    const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="search"], [role="form"], main, nav, header, footer, aside, form')
    landmarks.forEach(element => {
      const htmlElement = element as HTMLElement
      const role = htmlElement.getAttribute('role') || this.getImplicitRole(htmlElement)
      if (role) {
        structure.landmarks.push({
          type: role as any,
          element: htmlElement,
          label: htmlElement.getAttribute('aria-label') || undefined
        })
      }
    })

    // 分析标题
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')
    headings.forEach(element => {
      const htmlElement = element as HTMLElement
      const level = this.getHeadingLevel(htmlElement)
      structure.headings.push({
        level,
        element: htmlElement,
        text: htmlElement.textContent || ''
      })
    })

    // 分析区域
    const regions = document.querySelectorAll('[role], section, article')
    regions.forEach(element => {
      const htmlElement = element as HTMLElement
      const role = htmlElement.getAttribute('role') || htmlElement.tagName.toLowerCase()
      structure.regions.push({
        type: role,
        element: htmlElement,
        label: htmlElement.getAttribute('aria-label') || undefined
      })
    })

    this.state.semanticStructure = structure
    return structure
  }

  /**
   * 获取隐式角色
   */
  private getImplicitRole(element: HTMLElement): string | null {
    const tagName = element.tagName.toLowerCase()
    const roleMap: Record<string, string> = {
      'main': 'main',
      'nav': 'navigation',
      'header': 'banner',
      'footer': 'contentinfo',
      'aside': 'complementary',
      'form': 'form'
    }
    return roleMap[tagName] || null
  }

  /**
   * 获取标题级别
   */
  private getHeadingLevel(element: HTMLElement): number {
    if (element.hasAttribute('aria-level')) {
      return parseInt(element.getAttribute('aria-level')!) || 1
    }
    
    const tagName = element.tagName.toLowerCase()
    if (tagName.match(/^h[1-6]$/)) {
      return parseInt(tagName.charAt(1))
    }
    
    return 1
  }

  /**
   * 设置配置
   */
  public setConfig(newConfig: Partial<ScreenReaderConfig>): void {
    this.config.value = { ...this.config.value, ...newConfig }
    this.saveConfiguration()
  }

  /**
   * 获取配置
   */
  public getConfig(): ScreenReaderConfig {
    return this.config.value
  }

  /**
   * 加载配置
   */
  private loadConfiguration(): void {
    try {
      const saved = localStorage.getItem('screen-reader-config')
      if (saved) {
        const config = JSON.parse(saved)
        this.config.value = { ...this.config.value, ...config }
      }
    } catch (error) {
      console.warn('Failed to load screen reader config:', error)
    }
  }

  /**
   * 保存配置
   */
  private saveConfiguration(): void {
    try {
      localStorage.setItem('screen-reader-config', JSON.stringify(this.config.value))
    } catch (error) {
      console.warn('Failed to save screen reader config:', error)
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (typeof document === 'undefined') return

    // 监听焦点变化
    document.addEventListener('focusin', (e) => {
      this.state.currentFocus = e.target as HTMLElement
    })

    // 监听页面加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.announceNavigation('pageLoaded')
        this.analyzeSemanticStructure()
      })
    } else {
      this.announceNavigation('pageLoaded')
      this.analyzeSemanticStructure()
    }
  }

  /**
   * 启用/禁用服务
   */
  public setEnabled(enabled: boolean): void {
    this.state.isEnabled = enabled
  }

  /**
   * 清除公告历史
   */
  public clearAnnouncements(): void {
    this.state.announcements = []
    this.messageQueue = []
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    // 移除实时区域
    this.liveRegions.forEach(region => {
      region.remove()
    })
    this.liveRegions.clear()
    
    // 清除状态
    this.clearAnnouncements()
    this.state.currentFocus = null
    this.state.semanticStructure = null
  }
}

// 导出单例实例
export const screenReaderService = ScreenReaderService.getInstance()

// 便捷的组合式API
export function useScreenReader() {
  const service = ScreenReaderService.getInstance()
  
  return {
    // 状态
    isEnabled: () => service.state.isEnabled,
    isScreenReaderDetected: () => service.state.isScreenReaderDetected,
    announcements: () => service.state.announcements,
    currentFocus: () => service.state.currentFocus,
    
    // 方法
    announce: service.announce.bind(service),
    announceNavigation: service.announceNavigation.bind(service),
    announceCalculation: service.announceCalculation.bind(service),
    announceUIChange: service.announceUIChange.bind(service),
    announceError: service.announceError.bind(service),
    setAriaAttributes: service.setAriaAttributes.bind(service),
    createDescription: service.createDescription.bind(service),
    analyzeSemanticStructure: service.analyzeSemanticStructure.bind(service),
    setConfig: service.setConfig.bind(service),
    getConfig: service.getConfig.bind(service),
    setEnabled: service.setEnabled.bind(service)
  }
}
