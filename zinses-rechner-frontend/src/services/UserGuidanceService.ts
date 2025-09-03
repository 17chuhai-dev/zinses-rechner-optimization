/**
 * 用户引导服务
 * 提供完整的用户引导系统，包括新手教程、交互式引导和帮助中心
 */

import { ref, reactive } from 'vue'

// 引导步骤接口
export interface GuidanceStep {
  id: string
  title: string
  content: string
  target?: string // CSS选择器
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: 'click' | 'input' | 'scroll' | 'wait'
  actionTarget?: string
  actionValue?: string
  skipable?: boolean
  required?: boolean
  duration?: number
  animation?: 'fade' | 'slide' | 'bounce' | 'none'
  highlight?: boolean
  overlay?: boolean
  nextButton?: string
  prevButton?: string
  skipButton?: string
}

// 引导流程接口
export interface GuidanceTour {
  id: string
  name: string
  description: string
  category: 'onboarding' | 'feature' | 'advanced' | 'troubleshooting'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // 分钟
  prerequisites?: string[]
  steps: GuidanceStep[]
  completionReward?: {
    type: 'badge' | 'tip' | 'feature'
    value: string
  }
}

// 用户进度接口
export interface UserProgress {
  userId: string
  completedTours: string[]
  currentTour?: string
  currentStep?: number
  skippedTours: string[]
  preferences: {
    showHints: boolean
    autoStart: boolean
    animationSpeed: 'slow' | 'normal' | 'fast'
    skipIntro: boolean
  }
  statistics: {
    toursCompleted: number
    totalSteps: number
    averageCompletionTime: number
    lastActivity: Date
  }
}

// 帮助内容接口
export interface HelpContent {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  lastUpdated: Date
  views: number
  helpful: number
  notHelpful: number
  relatedTopics: string[]
  searchKeywords: string[]
}

// 引导状态接口
export interface GuidanceState {
  isActive: boolean
  currentTour: GuidanceTour | null
  currentStep: number
  totalSteps: number
  isLoading: boolean
  error: string | null
  overlay: boolean
  highlightedElement: string | null
}

/**
 * 用户引导服务类
 */
export class UserGuidanceService {
  private static instance: UserGuidanceService

  // 引导状态
  public readonly state = reactive<GuidanceState>({
    isActive: false,
    currentTour: null,
    currentStep: 0,
    totalSteps: 0,
    isLoading: false,
    error: null,
    overlay: false,
    highlightedElement: null
  })

  // 用户进度
  private userProgress = ref<UserProgress | null>(null)

  // 可用的引导流程
  private tours = new Map<string, GuidanceTour>()

  // 帮助内容
  private helpContent = new Map<string, HelpContent>()

  // 事件监听器
  private eventListeners = new Map<string, Function[]>()

  private constructor() {
    this.initializeDefaultTours()
    this.initializeHelpContent()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): UserGuidanceService {
    if (!UserGuidanceService.instance) {
      UserGuidanceService.instance = new UserGuidanceService()
    }
    return UserGuidanceService.instance
  }

  /**
   * 初始化用户引导
   */
  public async initialize(userId: string): Promise<void> {
    try {
      this.state.isLoading = true
      
      // 加载用户进度
      await this.loadUserProgress(userId)
      
      // 检查是否需要显示新手引导
      if (this.shouldShowOnboarding()) {
        await this.startOnboardingTour()
      }
      
      this.state.isLoading = false
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : '初始化失败'
      this.state.isLoading = false
    }
  }

  /**
   * 开始引导流程
   */
  public async startTour(tourId: string): Promise<void> {
    const tour = this.tours.get(tourId)
    if (!tour) {
      throw new Error(`引导流程 ${tourId} 不存在`)
    }

    // 检查前置条件
    if (tour.prerequisites && !this.checkPrerequisites(tour.prerequisites)) {
      throw new Error('不满足前置条件')
    }

    this.state.currentTour = tour
    this.state.currentStep = 0
    this.state.totalSteps = tour.steps.length
    this.state.isActive = true
    this.state.error = null

    // 开始第一步
    await this.showStep(0)

    // 触发事件
    this.emit('tour-started', { tour, userId: this.userProgress.value?.userId })
  }

  /**
   * 显示指定步骤
   */
  public async showStep(stepIndex: number): Promise<void> {
    if (!this.state.currentTour || stepIndex >= this.state.currentTour.steps.length) {
      return
    }

    const step = this.state.currentTour.steps[stepIndex]
    this.state.currentStep = stepIndex

    // 清除之前的高亮
    this.clearHighlight()

    // 滚动到目标元素
    if (step.target) {
      await this.scrollToTarget(step.target)
    }

    // 高亮目标元素
    if (step.highlight && step.target) {
      this.highlightElement(step.target)
    }

    // 显示遮罩层
    if (step.overlay) {
      this.state.overlay = true
    }

    // 执行步骤动作
    if (step.action) {
      await this.executeStepAction(step)
    }

    // 触发事件
    this.emit('step-shown', { step, stepIndex, tour: this.state.currentTour })
  }

  /**
   * 下一步
   */
  public async nextStep(): Promise<void> {
    if (!this.state.currentTour) return

    const nextIndex = this.state.currentStep + 1

    if (nextIndex >= this.state.currentTour.steps.length) {
      await this.completeTour()
    } else {
      await this.showStep(nextIndex)
    }
  }

  /**
   * 上一步
   */
  public async prevStep(): Promise<void> {
    if (!this.state.currentTour || this.state.currentStep <= 0) return

    await this.showStep(this.state.currentStep - 1)
  }

  /**
   * 跳过当前步骤
   */
  public async skipStep(): Promise<void> {
    const currentStep = this.getCurrentStep()
    if (!currentStep || !currentStep.skipable) return

    await this.nextStep()
  }

  /**
   * 跳过整个引导
   */
  public async skipTour(): Promise<void> {
    if (!this.state.currentTour || !this.userProgress.value) return

    const tourId = this.state.currentTour.id
    this.userProgress.value.skippedTours.push(tourId)
    await this.saveUserProgress()

    this.endTour()
    this.emit('tour-skipped', { tourId, userId: this.userProgress.value.userId })
  }

  /**
   * 完成引导流程
   */
  public async completeTour(): Promise<void> {
    if (!this.state.currentTour || !this.userProgress.value) return

    const tourId = this.state.currentTour.id
    const completionTime = Date.now() - (this.state.currentTour as any).startTime || 0

    // 更新用户进度
    this.userProgress.value.completedTours.push(tourId)
    this.userProgress.value.statistics.toursCompleted++
    this.userProgress.value.statistics.totalSteps += this.state.totalSteps
    this.userProgress.value.statistics.averageCompletionTime = 
      (this.userProgress.value.statistics.averageCompletionTime + completionTime) / 2
    this.userProgress.value.statistics.lastActivity = new Date()

    await this.saveUserProgress()

    // 显示完成奖励
    if (this.state.currentTour.completionReward) {
      this.showCompletionReward(this.state.currentTour.completionReward)
    }

    this.endTour()
    this.emit('tour-completed', { tourId, userId: this.userProgress.value.userId, completionTime })
  }

  /**
   * 结束引导
   */
  public endTour(): void {
    this.clearHighlight()
    this.state.overlay = false
    this.state.isActive = false
    this.state.currentTour = null
    this.state.currentStep = 0
    this.state.totalSteps = 0
  }

  /**
   * 获取当前步骤
   */
  public getCurrentStep(): GuidanceStep | null {
    if (!this.state.currentTour) return null
    return this.state.currentTour.steps[this.state.currentStep] || null
  }

  /**
   * 获取可用的引导流程
   */
  public getAvailableTours(category?: string): GuidanceTour[] {
    const tours = Array.from(this.tours.values())
    
    if (category) {
      return tours.filter(tour => tour.category === category)
    }
    
    return tours
  }

  /**
   * 搜索帮助内容
   */
  public searchHelp(query: string): HelpContent[] {
    const results: HelpContent[] = []
    const queryLower = query.toLowerCase()

    for (const content of this.helpContent.values()) {
      // 搜索标题、内容、标签和关键词
      if (
        content.title.toLowerCase().includes(queryLower) ||
        content.content.toLowerCase().includes(queryLower) ||
        content.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
        content.searchKeywords.some(keyword => keyword.toLowerCase().includes(queryLower))
      ) {
        results.push(content)
      }
    }

    // 按相关性排序
    return results.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, queryLower)
      const bScore = this.calculateRelevanceScore(b, queryLower)
      return bScore - aScore
    })
  }

  /**
   * 获取帮助内容
   */
  public getHelpContent(id: string): HelpContent | null {
    const content = this.helpContent.get(id)
    if (content) {
      // 增加查看次数
      content.views++
      this.saveHelpContent()
    }
    return content || null
  }

  /**
   * 获取相关帮助内容
   */
  public getRelatedHelp(contentId: string): HelpContent[] {
    const content = this.helpContent.get(contentId)
    if (!content) return []

    return content.relatedTopics
      .map(id => this.helpContent.get(id))
      .filter(Boolean) as HelpContent[]
  }

  /**
   * 标记帮助内容为有用/无用
   */
  public async rateHelpContent(contentId: string, helpful: boolean): Promise<void> {
    const content = this.helpContent.get(contentId)
    if (!content) return

    if (helpful) {
      content.helpful++
    } else {
      content.notHelpful++
    }

    await this.saveHelpContent()
  }

  /**
   * 添加事件监听器
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 私有方法

  /**
   * 初始化默认引导流程
   */
  private initializeDefaultTours(): void {
    // 新手入门引导
    const onboardingTour: GuidanceTour = {
      id: 'onboarding',
      name: 'Willkommen bei Zinses-Rechner',
      description: 'Lernen Sie die Grundfunktionen unseres Zinseszins-Rechners kennen',
      category: 'onboarding',
      difficulty: 'beginner',
      estimatedTime: 5,
      steps: [
        {
          id: 'welcome',
          title: 'Willkommen!',
          content: 'Herzlich willkommen beim Zinses-Rechner! Lassen Sie uns gemeinsam die wichtigsten Funktionen erkunden.',
          position: 'center',
          skipable: true,
          overlay: true,
          animation: 'fade'
        },
        {
          id: 'input-form',
          title: 'Eingabeformular',
          content: 'Hier geben Sie Ihre Berechnungsparameter ein: Startkapital, monatliche Sparrate, Zinssatz und Laufzeit.',
          target: '.calculation-form',
          position: 'right',
          highlight: true,
          skipable: true
        },
        {
          id: 'calculate-button',
          title: 'Berechnung starten',
          content: 'Klicken Sie auf diesen Button, um Ihre Zinseszins-Berechnung zu starten.',
          target: '.calculate-button',
          position: 'top',
          highlight: true,
          action: 'click',
          actionTarget: '.calculate-button'
        },
        {
          id: 'results-chart',
          title: 'Ergebnisse visualisiert',
          content: 'Hier sehen Sie Ihre Berechnungsergebnisse als interaktives Diagramm.',
          target: '.results-chart',
          position: 'left',
          highlight: true,
          skipable: true
        },
        {
          id: 'export-options',
          title: 'Ergebnisse exportieren',
          content: 'Sie können Ihre Ergebnisse als PDF, Excel oder PNG exportieren.',
          target: '.export-button',
          position: 'bottom',
          highlight: true,
          skipable: true
        }
      ]
    }

    // 高级功能引导
    const advancedTour: GuidanceTour = {
      id: 'advanced-features',
      name: 'Erweiterte Funktionen',
      description: 'Entdecken Sie die erweiterten Berechnungsoptionen',
      category: 'feature',
      difficulty: 'intermediate',
      estimatedTime: 8,
      prerequisites: ['onboarding'],
      steps: [
        {
          id: 'tax-settings',
          title: 'Steuereinstellungen',
          content: 'Konfigurieren Sie hier Ihre deutschen Steuereinstellungen für präzisere Berechnungen.',
          target: '.tax-settings',
          position: 'right',
          highlight: true,
          skipable: true
        },
        {
          id: 'scenario-comparison',
          title: 'Szenario-Vergleich',
          content: 'Vergleichen Sie verschiedene Anlagestrategien miteinander.',
          target: '.scenario-comparison',
          position: 'top',
          highlight: true,
          skipable: true
        },
        {
          id: 'history-management',
          title: 'Berechnungsverlauf',
          content: 'Verwalten Sie Ihre gespeicherten Berechnungen und greifen Sie schnell darauf zu.',
          target: '.calculation-history',
          position: 'left',
          highlight: true,
          skipable: true
        }
      ]
    }

    this.tours.set('onboarding', onboardingTour)
    this.tours.set('advanced-features', advancedTour)
  }

  /**
   * 初始化帮助内容
   */
  private initializeHelpContent(): void {
    const helpContents: HelpContent[] = [
      {
        id: 'getting-started',
        title: 'Erste Schritte',
        content: 'Lernen Sie, wie Sie Ihre erste Zinseszins-Berechnung durchführen...',
        category: 'basics',
        tags: ['anfänger', 'grundlagen', 'berechnung'],
        difficulty: 'beginner',
        lastUpdated: new Date(),
        views: 0,
        helpful: 0,
        notHelpful: 0,
        relatedTopics: ['tax-calculation', 'export-results'],
        searchKeywords: ['erste schritte', 'anfang', 'tutorial', 'grundlagen']
      },
      {
        id: 'tax-calculation',
        title: 'Steuerberechnung verstehen',
        content: 'Erfahren Sie, wie die deutschen Steuerregeln in die Berechnung einfließen...',
        category: 'advanced',
        tags: ['steuern', 'deutschland', 'abgeltungssteuer'],
        difficulty: 'intermediate',
        lastUpdated: new Date(),
        views: 0,
        helpful: 0,
        notHelpful: 0,
        relatedTopics: ['getting-started', 'export-results'],
        searchKeywords: ['steuern', 'abgeltungssteuer', 'freibetrag', 'kirchensteuer']
      },
      {
        id: 'export-results',
        title: 'Ergebnisse exportieren',
        content: 'Verschiedene Möglichkeiten, Ihre Berechnungsergebnisse zu exportieren...',
        category: 'features',
        tags: ['export', 'pdf', 'excel', 'teilen'],
        difficulty: 'beginner',
        lastUpdated: new Date(),
        views: 0,
        helpful: 0,
        notHelpful: 0,
        relatedTopics: ['getting-started', 'tax-calculation'],
        searchKeywords: ['export', 'pdf', 'excel', 'download', 'speichern']
      }
    ]

    helpContents.forEach(content => {
      this.helpContent.set(content.id, content)
    })
  }

  /**
   * 加载用户进度
   */
  private async loadUserProgress(userId: string): Promise<void> {
    try {
      const saved = localStorage.getItem(`guidance_progress_${userId}`)
      if (saved) {
        this.userProgress.value = JSON.parse(saved)
      } else {
        // 创建新的用户进度
        this.userProgress.value = {
          userId,
          completedTours: [],
          skippedTours: [],
          preferences: {
            showHints: true,
            autoStart: true,
            animationSpeed: 'normal',
            skipIntro: false
          },
          statistics: {
            toursCompleted: 0,
            totalSteps: 0,
            averageCompletionTime: 0,
            lastActivity: new Date()
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user progress:', error)
    }
  }

  /**
   * 保存用户进度
   */
  private async saveUserProgress(): Promise<void> {
    if (!this.userProgress.value) return

    try {
      localStorage.setItem(
        `guidance_progress_${this.userProgress.value.userId}`,
        JSON.stringify(this.userProgress.value)
      )
    } catch (error) {
      console.error('Failed to save user progress:', error)
    }
  }

  /**
   * 保存帮助内容
   */
  private async saveHelpContent(): Promise<void> {
    try {
      const contentArray = Array.from(this.helpContent.values())
      localStorage.setItem('help_content_stats', JSON.stringify(contentArray))
    } catch (error) {
      console.error('Failed to save help content:', error)
    }
  }

  /**
   * 检查是否应该显示新手引导
   */
  private shouldShowOnboarding(): boolean {
    if (!this.userProgress.value) return false
    
    return !this.userProgress.value.completedTours.includes('onboarding') &&
           !this.userProgress.value.skippedTours.includes('onboarding') &&
           !this.userProgress.value.preferences.skipIntro
  }

  /**
   * 开始新手引导
   */
  private async startOnboardingTour(): Promise<void> {
    if (this.userProgress.value?.preferences.autoStart) {
      await this.startTour('onboarding')
    }
  }

  /**
   * 检查前置条件
   */
  private checkPrerequisites(prerequisites: string[]): boolean {
    if (!this.userProgress.value) return false
    
    return prerequisites.every(prereq => 
      this.userProgress.value!.completedTours.includes(prereq)
    )
  }

  /**
   * 滚动到目标元素
   */
  private async scrollToTarget(target: string): Promise<void> {
    const element = document.querySelector(target)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 等待滚动完成
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  /**
   * 高亮元素
   */
  private highlightElement(target: string): void {
    this.clearHighlight()
    this.state.highlightedElement = target
    
    const element = document.querySelector(target)
    if (element) {
      element.classList.add('guidance-highlight')
    }
  }

  /**
   * 清除高亮
   */
  private clearHighlight(): void {
    if (this.state.highlightedElement) {
      const element = document.querySelector(this.state.highlightedElement)
      if (element) {
        element.classList.remove('guidance-highlight')
      }
      this.state.highlightedElement = null
    }
  }

  /**
   * 执行步骤动作
   */
  private async executeStepAction(step: GuidanceStep): Promise<void> {
    if (!step.action || !step.actionTarget) return

    const element = document.querySelector(step.actionTarget) as HTMLElement
    if (!element) return

    switch (step.action) {
      case 'click':
        element.click()
        break
      case 'input':
        if (element instanceof HTMLInputElement && step.actionValue) {
          element.value = step.actionValue
          element.dispatchEvent(new Event('input', { bubbles: true }))
        }
        break
      case 'scroll':
        element.scrollIntoView({ behavior: 'smooth' })
        break
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, step.duration || 1000))
        break
    }
  }

  /**
   * 显示完成奖励
   */
  private showCompletionReward(reward: NonNullable<GuidanceTour['completionReward']>): void {
    // 简化实现，实际可以显示徽章、解锁功能等
    console.log(`🎉 Congratulations! You earned: ${reward.type} - ${reward.value}`)
  }

  /**
   * 计算相关性分数
   */
  private calculateRelevanceScore(content: HelpContent, query: string): number {
    let score = 0
    
    // 标题匹配权重最高
    if (content.title.toLowerCase().includes(query)) {
      score += 10
    }
    
    // 标签匹配
    content.tags.forEach(tag => {
      if (tag.toLowerCase().includes(query)) {
        score += 5
      }
    })
    
    // 关键词匹配
    content.searchKeywords.forEach(keyword => {
      if (keyword.toLowerCase().includes(query)) {
        score += 3
      }
    })
    
    // 内容匹配
    if (content.content.toLowerCase().includes(query)) {
      score += 1
    }
    
    return score
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }
}

// 导出单例实例
export const userGuidanceService = UserGuidanceService.getInstance()

// 导出便捷的composable
export function useUserGuidance() {
  const service = UserGuidanceService.getInstance()
  
  return {
    // 状态
    state: service.state,
    
    // 方法
    initialize: service.initialize.bind(service),
    startTour: service.startTour.bind(service),
    nextStep: service.nextStep.bind(service),
    prevStep: service.prevStep.bind(service),
    skipStep: service.skipStep.bind(service),
    skipTour: service.skipTour.bind(service),
    endTour: service.endTour.bind(service),
    getCurrentStep: service.getCurrentStep.bind(service),
    getAvailableTours: service.getAvailableTours.bind(service),
    searchHelp: service.searchHelp.bind(service),
    getHelpContent: service.getHelpContent.bind(service),
    getRelatedHelp: service.getRelatedHelp.bind(service),
    rateHelpContent: service.rateHelpContent.bind(service),
    on: service.on.bind(service),
    off: service.off.bind(service)
  }
}
