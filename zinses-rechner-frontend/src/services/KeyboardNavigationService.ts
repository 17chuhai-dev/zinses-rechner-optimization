/**
 * 键盘导航服务
 * 提供完整的键盘导航支持，包括Tab键导航、快捷键、焦点管理
 */

import { ref, reactive, computed, nextTick } from 'vue'

// 快捷键配置接口
export interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void | Promise<void>
  category: 'navigation' | 'calculation' | 'export' | 'general'
  enabled?: boolean
}

// 焦点陷阱配置
export interface FocusTrapConfig {
  container: HTMLElement
  initialFocus?: HTMLElement | string
  returnFocus?: HTMLElement
  allowOutsideClick?: boolean
  escapeDeactivates?: boolean
}

// 焦点管理状态
export interface FocusState {
  currentElement: HTMLElement | null
  previousElement: HTMLElement | null
  focusHistory: HTMLElement[]
  trapStack: FocusTrapConfig[]
  isNavigating: boolean
}

/**
 * 键盘导航服务类
 */
export class KeyboardNavigationService {
  private static instance: KeyboardNavigationService

  // 服务状态
  public readonly state = reactive<FocusState>({
    currentElement: null,
    previousElement: null,
    focusHistory: [],
    trapStack: [],
    isNavigating: false
  })

  // 快捷键注册表
  private shortcuts = new Map<string, ShortcutConfig>()
  
  // 焦点元素选择器
  private focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'details summary',
    'audio[controls]',
    'video[controls]'
  ].join(', ')

  // 事件监听器
  private keydownListener?: (e: KeyboardEvent) => void
  private focusListener?: (e: FocusEvent) => void
  private blurListener?: (e: FocusEvent) => void

  public static getInstance(): KeyboardNavigationService {
    if (!KeyboardNavigationService.instance) {
      KeyboardNavigationService.instance = new KeyboardNavigationService()
    }
    return KeyboardNavigationService.instance
  }

  constructor() {
    this.initializeEventListeners()
    this.registerDefaultShortcuts()
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    if (typeof window === 'undefined') return

    // 键盘事件监听
    this.keydownListener = (e: KeyboardEvent) => {
      this.handleKeydown(e)
    }

    // 焦点事件监听
    this.focusListener = (e: FocusEvent) => {
      this.handleFocus(e)
    }

    this.blurListener = (e: FocusEvent) => {
      this.handleBlur(e)
    }

    document.addEventListener('keydown', this.keydownListener)
    document.addEventListener('focusin', this.focusListener)
    document.addEventListener('focusout', this.blurListener)
  }

  /**
   * 注册默认快捷键
   */
  private registerDefaultShortcuts(): void {
    // 导航快捷键
    this.registerShortcut({
      key: 'Tab',
      description: 'Zum nächsten Element navigieren',
      action: () => this.navigateToNext(),
      category: 'navigation'
    })

    this.registerShortcut({
      key: 'Tab',
      shiftKey: true,
      description: 'Zum vorherigen Element navigieren',
      action: () => this.navigateToPrevious(),
      category: 'navigation'
    })

    // 计算快捷键
    this.registerShortcut({
      key: 'Enter',
      ctrlKey: true,
      description: 'Berechnung starten',
      action: () => this.triggerCalculation(),
      category: 'calculation'
    })

    this.registerShortcut({
      key: 'r',
      ctrlKey: true,
      description: 'Eingaben zurücksetzen',
      action: () => this.resetInputs(),
      category: 'calculation'
    })

    // 导出快捷键
    this.registerShortcut({
      key: 's',
      ctrlKey: true,
      description: 'Ergebnisse speichern',
      action: () => this.saveResults(),
      category: 'export'
    })

    this.registerShortcut({
      key: 'p',
      ctrlKey: true,
      description: 'PDF exportieren',
      action: () => this.exportPDF(),
      category: 'export'
    })

    // 通用快捷键
    this.registerShortcut({
      key: 'Escape',
      description: 'Dialog schließen / Aktion abbrechen',
      action: () => this.handleEscape(),
      category: 'general'
    })

    this.registerShortcut({
      key: 'h',
      ctrlKey: true,
      description: 'Hilfe anzeigen',
      action: () => this.showHelp(),
      category: 'general'
    })

    this.registerShortcut({
      key: 'k',
      ctrlKey: true,
      description: 'Tastenkürzel anzeigen',
      action: () => this.showShortcuts(),
      category: 'general'
    })

    // 主题切换
    this.registerShortcut({
      key: 't',
      ctrlKey: true,
      altKey: true,
      description: 'Thema wechseln',
      action: () => this.toggleTheme(),
      category: 'general'
    })
  }

  /**
   * 注册快捷键
   */
  public registerShortcut(config: ShortcutConfig): void {
    const key = this.getShortcutKey(config)
    this.shortcuts.set(key, { ...config, enabled: config.enabled ?? true })
  }

  /**
   * 注销快捷键
   */
  public unregisterShortcut(config: Partial<ShortcutConfig>): void {
    const key = this.getShortcutKey(config as ShortcutConfig)
    this.shortcuts.delete(key)
  }

  /**
   * 获取所有快捷键
   */
  public getShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * 按类别获取快捷键
   */
  public getShortcutsByCategory(category: ShortcutConfig['category']): ShortcutConfig[] {
    return this.getShortcuts().filter(shortcut => shortcut.category === category)
  }

  /**
   * 创建焦点陷阱
   */
  public createFocusTrap(config: FocusTrapConfig): void {
    this.state.trapStack.push(config)
    
    // 设置初始焦点
    nextTick(() => {
      if (config.initialFocus) {
        const element = typeof config.initialFocus === 'string' 
          ? config.container.querySelector(config.initialFocus) as HTMLElement
          : config.initialFocus
        
        if (element) {
          this.setFocus(element)
        }
      } else {
        // 焦点到第一个可聚焦元素
        const firstFocusable = this.getFirstFocusableElement(config.container)
        if (firstFocusable) {
          this.setFocus(firstFocusable)
        }
      }
    })
  }

  /**
   * 释放焦点陷阱
   */
  public releaseFocusTrap(): void {
    const trap = this.state.trapStack.pop()
    
    if (trap?.returnFocus) {
      this.setFocus(trap.returnFocus)
    } else if (this.state.previousElement) {
      this.setFocus(this.state.previousElement)
    }
  }

  /**
   * 设置焦点
   */
  public setFocus(element: HTMLElement): void {
    if (!element || !this.isFocusable(element)) return

    this.state.previousElement = this.state.currentElement
    this.state.currentElement = element
    
    // 添加到历史记录
    if (this.state.focusHistory.length > 10) {
      this.state.focusHistory.shift()
    }
    this.state.focusHistory.push(element)

    element.focus()
  }

  /**
   * 导航到下一个元素
   */
  public navigateToNext(): void {
    const currentTrap = this.getCurrentFocusTrap()
    const container = currentTrap?.container || document.body
    const focusableElements = this.getFocusableElements(container)
    
    if (focusableElements.length === 0) return

    const currentIndex = this.state.currentElement 
      ? focusableElements.indexOf(this.state.currentElement)
      : -1
    
    const nextIndex = (currentIndex + 1) % focusableElements.length
    this.setFocus(focusableElements[nextIndex])
  }

  /**
   * 导航到上一个元素
   */
  public navigateToPrevious(): void {
    const currentTrap = this.getCurrentFocusTrap()
    const container = currentTrap?.container || document.body
    const focusableElements = this.getFocusableElements(container)
    
    if (focusableElements.length === 0) return

    const currentIndex = this.state.currentElement 
      ? focusableElements.indexOf(this.state.currentElement)
      : 0
    
    const prevIndex = currentIndex === 0 
      ? focusableElements.length - 1 
      : currentIndex - 1
    
    this.setFocus(focusableElements[prevIndex])
  }

  /**
   * 跳转到特定元素
   */
  public jumpToElement(selector: string): void {
    const element = document.querySelector(selector) as HTMLElement
    if (element && this.isFocusable(element)) {
      this.setFocus(element)
    }
  }

  /**
   * 获取可聚焦元素
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = container.querySelectorAll(this.focusableSelectors) as NodeListOf<HTMLElement>
    return Array.from(elements).filter(el => this.isFocusable(el))
  }

  /**
   * 获取第一个可聚焦元素
   */
  private getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    return elements.length > 0 ? elements[0] : null
  }

  /**
   * 检查元素是否可聚焦
   */
  private isFocusable(element: HTMLElement): boolean {
    if (!element || element.hidden) return false
    
    const style = window.getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    
    const tabIndex = element.tabIndex
    if (tabIndex < 0) return false
    
    return true
  }

  /**
   * 获取当前焦点陷阱
   */
  private getCurrentFocusTrap(): FocusTrapConfig | null {
    return this.state.trapStack.length > 0 
      ? this.state.trapStack[this.state.trapStack.length - 1]
      : null
  }

  /**
   * 处理键盘事件
   */
  private handleKeydown(e: KeyboardEvent): void {
    const shortcutKey = this.getShortcutKeyFromEvent(e)
    const shortcut = this.shortcuts.get(shortcutKey)
    
    if (shortcut && shortcut.enabled) {
      // 检查是否在焦点陷阱中
      const currentTrap = this.getCurrentFocusTrap()
      
      if (shortcut.key === 'Tab') {
        // Tab键导航
        if (currentTrap) {
          e.preventDefault()
          if (e.shiftKey) {
            this.navigateToPrevious()
          } else {
            this.navigateToNext()
          }
        }
      } else if (shortcut.key === 'Escape') {
        // Escape键处理
        if (currentTrap && currentTrap.escapeDeactivates !== false) {
          e.preventDefault()
          this.releaseFocusTrap()
        }
        shortcut.action()
      } else {
        // 其他快捷键
        e.preventDefault()
        shortcut.action()
      }
    }
  }

  /**
   * 处理焦点事件
   */
  private handleFocus(e: FocusEvent): void {
    const target = e.target as HTMLElement
    if (target && this.isFocusable(target)) {
      this.state.previousElement = this.state.currentElement
      this.state.currentElement = target
    }
  }

  /**
   * 处理失焦事件
   */
  private handleBlur(e: FocusEvent): void {
    // 延迟处理，确保新焦点已设置
    setTimeout(() => {
      if (!document.activeElement || document.activeElement === document.body) {
        this.state.currentElement = null
      }
    }, 0)
  }

  /**
   * 获取快捷键标识
   */
  private getShortcutKey(config: ShortcutConfig): string {
    const modifiers = []
    if (config.ctrlKey) modifiers.push('Ctrl')
    if (config.altKey) modifiers.push('Alt')
    if (config.shiftKey) modifiers.push('Shift')
    if (config.metaKey) modifiers.push('Meta')
    
    return [...modifiers, config.key].join('+')
  }

  /**
   * 从事件获取快捷键标识
   */
  private getShortcutKeyFromEvent(e: KeyboardEvent): string {
    const modifiers = []
    if (e.ctrlKey) modifiers.push('Ctrl')
    if (e.altKey) modifiers.push('Alt')
    if (e.shiftKey) modifiers.push('Shift')
    if (e.metaKey) modifiers.push('Meta')
    
    return [...modifiers, e.key].join('+')
  }

  // 快捷键动作实现
  private async triggerCalculation(): Promise<void> {
    const calculateButton = document.querySelector('[data-action="calculate"]') as HTMLElement
    if (calculateButton) {
      calculateButton.click()
    }
  }

  private async resetInputs(): Promise<void> {
    const resetButton = document.querySelector('[data-action="reset"]') as HTMLElement
    if (resetButton) {
      resetButton.click()
    }
  }

  private async saveResults(): Promise<void> {
    const saveButton = document.querySelector('[data-action="save"]') as HTMLElement
    if (saveButton) {
      saveButton.click()
    }
  }

  private async exportPDF(): Promise<void> {
    const exportButton = document.querySelector('[data-action="export-pdf"]') as HTMLElement
    if (exportButton) {
      exportButton.click()
    }
  }

  private async handleEscape(): Promise<void> {
    // 关闭模态框或取消当前操作
    const modal = document.querySelector('[role="dialog"]:not([hidden])') as HTMLElement
    if (modal) {
      const closeButton = modal.querySelector('[data-action="close"]') as HTMLElement
      if (closeButton) {
        closeButton.click()
      }
    }
  }

  private async showHelp(): Promise<void> {
    const helpButton = document.querySelector('[data-action="help"]') as HTMLElement
    if (helpButton) {
      helpButton.click()
    }
  }

  private async showShortcuts(): Promise<void> {
    // 显示快捷键帮助
    console.log('Keyboard shortcuts:', this.getShortcuts())
  }

  private async toggleTheme(): Promise<void> {
    const themeToggle = document.querySelector('[data-action="toggle-theme"]') as HTMLElement
    if (themeToggle) {
      themeToggle.click()
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener)
    }
    if (this.focusListener) {
      document.removeEventListener('focusin', this.focusListener)
    }
    if (this.blurListener) {
      document.removeEventListener('focusout', this.blurListener)
    }
    
    this.shortcuts.clear()
    this.state.trapStack = []
  }
}

// 导出单例实例
export const keyboardNavigationService = KeyboardNavigationService.getInstance()

// 便捷的组合式API
export function useKeyboardNavigation() {
  const service = KeyboardNavigationService.getInstance()
  
  return {
    // 状态
    focusState: computed(() => service.state),
    currentElement: computed(() => service.state.currentElement),
    isNavigating: computed(() => service.state.isNavigating),
    
    // 方法
    registerShortcut: service.registerShortcut.bind(service),
    unregisterShortcut: service.unregisterShortcut.bind(service),
    getShortcuts: service.getShortcuts.bind(service),
    getShortcutsByCategory: service.getShortcutsByCategory.bind(service),
    createFocusTrap: service.createFocusTrap.bind(service),
    releaseFocusTrap: service.releaseFocusTrap.bind(service),
    setFocus: service.setFocus.bind(service),
    navigateToNext: service.navigateToNext.bind(service),
    navigateToPrevious: service.navigateToPrevious.bind(service),
    jumpToElement: service.jumpToElement.bind(service)
  }
}
