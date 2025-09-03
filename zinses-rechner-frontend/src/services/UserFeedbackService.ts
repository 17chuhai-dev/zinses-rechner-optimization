/**
 * 用户反馈收集服务
 * 收集用户评分、建议、错误报告等反馈信息，支持离线存储和批量提交
 */

import { ref, reactive } from 'vue'

// 反馈类型
export type FeedbackType = 'rating' | 'suggestion' | 'bug' | 'feature' | 'general'

// 反馈优先级
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical'

// 反馈状态
export type FeedbackStatus = 'pending' | 'submitted' | 'acknowledged' | 'resolved' | 'rejected'

// 反馈项接口
export interface FeedbackItem {
  id: string
  type: FeedbackType
  priority: FeedbackPriority
  status: FeedbackStatus
  title: string
  description: string
  rating?: number // 1-5 星评分
  category: string
  tags: string[]
  userInfo: {
    userId?: string
    sessionId: string
    userAgent: string
    screenResolution: string
    timestamp: Date
  }
  context: {
    currentPage: string
    previousPage?: string
    userActions: string[]
    errorStack?: string
    performanceMetrics?: Record<string, number>
  }
  attachments: FeedbackAttachment[]
  metadata: {
    created: Date
    updated: Date
    submittedAt?: Date
    acknowledgedAt?: Date
    resolvedAt?: Date
  }
}

// 反馈附件接口
export interface FeedbackAttachment {
  id: string
  type: 'screenshot' | 'log' | 'file'
  name: string
  size: number
  mimeType: string
  data: string | Blob
  thumbnail?: string
}

// 反馈统计接口
export interface FeedbackStatistics {
  total: number
  byType: Record<FeedbackType, number>
  byPriority: Record<FeedbackPriority, number>
  byStatus: Record<FeedbackStatus, number>
  averageRating: number
  responseTime: number
  resolutionRate: number
  trends: {
    daily: Array<{ date: string; count: number }>
    weekly: Array<{ week: string; count: number }>
    monthly: Array<{ month: string; count: number }>
  }
}

// 反馈配置接口
export interface FeedbackConfig {
  enableAutoScreenshot: boolean
  enablePerformanceMetrics: boolean
  enableUserTracking: boolean
  maxAttachmentSize: number // MB
  maxAttachments: number
  categories: string[]
  autoSubmit: boolean
  submitInterval: number // 分钟
  retentionPeriod: number // 天
}

/**
 * 用户反馈服务类
 */
export class UserFeedbackService {
  private static instance: UserFeedbackService

  // 反馈队列
  private feedbackQueue: FeedbackItem[] = []
  private submittedFeedback: FeedbackItem[] = []

  // 服务状态
  public readonly isCollecting = ref(true)
  public readonly isSubmitting = ref(false)
  public readonly lastSubmission = ref<Date>()

  // 统计数据
  public readonly statistics = reactive<FeedbackStatistics>({
    total: 0,
    byType: {
      rating: 0,
      suggestion: 0,
      bug: 0,
      feature: 0,
      general: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    byStatus: {
      pending: 0,
      submitted: 0,
      acknowledged: 0,
      resolved: 0,
      rejected: 0
    },
    averageRating: 0,
    responseTime: 0,
    resolutionRate: 0,
    trends: {
      daily: [],
      weekly: [],
      monthly: []
    }
  })

  // 配置
  private config: FeedbackConfig = {
    enableAutoScreenshot: true,
    enablePerformanceMetrics: true,
    enableUserTracking: false,
    maxAttachmentSize: 5, // 5MB
    maxAttachments: 3,
    categories: [
      'Benutzerfreundlichkeit',
      'Funktionalität',
      'Performance',
      'Design',
      'Fehler',
      'Verbesserungsvorschlag',
      'Allgemein'
    ],
    autoSubmit: true,
    submitInterval: 30, // 30分钟
    retentionPeriod: 30 // 30天
  }

  // 用户会话信息
  private sessionInfo = {
    sessionId: this.generateSessionId(),
    startTime: new Date(),
    userActions: [] as string[],
    pageViews: [] as string[]
  }

  // 自动提交定时器
  private submitTimer?: number

  public static getInstance(): UserFeedbackService {
    if (!UserFeedbackService.instance) {
      UserFeedbackService.instance = new UserFeedbackService()
    }
    return UserFeedbackService.instance
  }

  constructor() {
    this.initializeService()
  }

  /**
   * 初始化服务
   */
  private initializeService(): void {
    // 加载本地存储的反馈
    this.loadLocalFeedback()

    // 监听用户操作
    this.setupUserActionTracking()

    // 监听页面变化
    this.setupPageTracking()

    // 监听错误
    this.setupErrorTracking()

    // 启动自动提交
    if (this.config.autoSubmit) {
      this.startAutoSubmit()
    }

    console.log('📝 User feedback service initialized')
  }

  /**
   * 提交反馈
   */
  public async submitFeedback(feedback: Omit<FeedbackItem, 'id' | 'userInfo' | 'context' | 'metadata'>): Promise<string> {
    const feedbackItem: FeedbackItem = {
      ...feedback,
      id: this.generateId(),
      userInfo: this.getUserInfo(),
      context: this.getContextInfo(),
      metadata: {
        created: new Date(),
        updated: new Date()
      }
    }

    // 添加到队列
    this.feedbackQueue.push(feedbackItem)

    // 更新统计
    this.updateStatistics()

    // 保存到本地存储
    this.saveLocalFeedback()

    console.log(`📝 Feedback submitted: ${feedbackItem.type} - ${feedbackItem.title}`)

    // 如果启用自动提交，立即尝试提交
    if (this.config.autoSubmit) {
      this.submitPendingFeedback()
    }

    return feedbackItem.id
  }

  /**
   * 提交评分反馈
   */
  public async submitRating(rating: number, category: string, comment?: string): Promise<string> {
    return this.submitFeedback({
      type: 'rating',
      priority: 'medium',
      status: 'pending',
      title: `Bewertung: ${rating} Sterne`,
      description: comment || `Benutzer hat ${rating} von 5 Sternen gegeben`,
      rating,
      category,
      tags: ['rating', 'user-satisfaction'],
      attachments: []
    })
  }

  /**
   * 提交建议反馈
   */
  public async submitSuggestion(title: string, description: string, category: string): Promise<string> {
    return this.submitFeedback({
      type: 'suggestion',
      priority: 'medium',
      status: 'pending',
      title,
      description,
      category,
      tags: ['suggestion', 'improvement'],
      attachments: []
    })
  }

  /**
   * 提交错误报告
   */
  public async submitBugReport(
    title: string, 
    description: string, 
    error?: Error,
    includeScreenshot: boolean = true
  ): Promise<string> {
    const attachments: FeedbackAttachment[] = []

    // 添加截图
    if (includeScreenshot && this.config.enableAutoScreenshot) {
      try {
        const screenshot = await this.captureScreenshot()
        if (screenshot) {
          attachments.push(screenshot)
        }
      } catch (err) {
        console.warn('Failed to capture screenshot:', err)
      }
    }

    // 添加错误堆栈
    let errorContext = description
    if (error) {
      errorContext += `\n\nFehler-Details:\n${error.name}: ${error.message}\n${error.stack}`
    }

    return this.submitFeedback({
      type: 'bug',
      priority: error ? 'high' : 'medium',
      status: 'pending',
      title,
      description: errorContext,
      category: 'Fehler',
      tags: ['bug', 'error'],
      attachments
    })
  }

  /**
   * 提交功能请求
   */
  public async submitFeatureRequest(title: string, description: string, priority: FeedbackPriority = 'medium'): Promise<string> {
    return this.submitFeedback({
      type: 'feature',
      priority,
      status: 'pending',
      title,
      description,
      category: 'Verbesserungsvorschlag',
      tags: ['feature-request', 'enhancement'],
      attachments: []
    })
  }

  /**
   * 获取所有反馈
   */
  public getAllFeedback(): {
    pending: FeedbackItem[]
    submitted: FeedbackItem[]
    total: number
  } {
    return {
      pending: [...this.feedbackQueue],
      submitted: [...this.submittedFeedback],
      total: this.feedbackQueue.length + this.submittedFeedback.length
    }
  }

  /**
   * 获取反馈统计
   */
  public getFeedbackStatistics(): FeedbackStatistics {
    return { ...this.statistics }
  }

  /**
   * 删除反馈
   */
  public deleteFeedback(feedbackId: string): boolean {
    const pendingIndex = this.feedbackQueue.findIndex(f => f.id === feedbackId)
    if (pendingIndex > -1) {
      this.feedbackQueue.splice(pendingIndex, 1)
      this.updateStatistics()
      this.saveLocalFeedback()
      return true
    }

    const submittedIndex = this.submittedFeedback.findIndex(f => f.id === feedbackId)
    if (submittedIndex > -1) {
      this.submittedFeedback.splice(submittedIndex, 1)
      this.updateStatistics()
      this.saveLocalFeedback()
      return true
    }

    return false
  }

  /**
   * 清空所有反馈
   */
  public clearAllFeedback(): void {
    this.feedbackQueue = []
    this.submittedFeedback = []
    this.updateStatistics()
    this.saveLocalFeedback()
    console.log('📝 All feedback cleared')
  }

  /**
   * 手动提交待处理反馈
   */
  public async submitPendingFeedback(): Promise<void> {
    if (this.isSubmitting.value || this.feedbackQueue.length === 0) {
      return
    }

    this.isSubmitting.value = true

    try {
      // 模拟提交到服务器
      await this.delay(1000 + Math.random() * 2000)

      // 将待处理反馈移动到已提交列表
      const submitted = this.feedbackQueue.splice(0)
      submitted.forEach(feedback => {
        feedback.status = 'submitted'
        feedback.metadata.submittedAt = new Date()
        feedback.metadata.updated = new Date()
      })

      this.submittedFeedback.push(...submitted)
      this.lastSubmission.value = new Date()

      this.updateStatistics()
      this.saveLocalFeedback()

      console.log(`📝 Submitted ${submitted.length} feedback items`)

    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      this.isSubmitting.value = false
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 重新启动自动提交
    if (this.config.autoSubmit) {
      this.startAutoSubmit()
    } else {
      this.stopAutoSubmit()
    }

    console.log('📝 Feedback config updated')
  }

  /**
   * 导出反馈数据
   */
  public exportFeedbackData(): {
    feedback: FeedbackItem[]
    statistics: FeedbackStatistics
    config: FeedbackConfig
    exportTime: Date
  } {
    return {
      feedback: [...this.feedbackQueue, ...this.submittedFeedback],
      statistics: { ...this.statistics },
      config: { ...this.config },
      exportTime: new Date()
    }
  }

  // 私有方法

  /**
   * 获取用户信息
   */
  private getUserInfo() {
    return {
      sessionId: this.sessionInfo.sessionId,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: new Date()
    }
  }

  /**
   * 获取上下文信息
   */
  private getContextInfo() {
    return {
      currentPage: window.location.pathname,
      previousPage: document.referrer || undefined,
      userActions: [...this.sessionInfo.userActions.slice(-10)], // 最近10个操作
      performanceMetrics: this.config.enablePerformanceMetrics ? this.getPerformanceMetrics() : undefined
    }
  }

  /**
   * 获取性能指标
   */
  private getPerformanceMetrics(): Record<string, number> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    }
  }

  /**
   * 捕获截图
   */
  private async captureScreenshot(): Promise<FeedbackAttachment | null> {
    try {
      // 使用html2canvas或类似库捕获截图
      // 这里模拟截图捕获
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext('2d')!
      
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#333'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Screenshot Placeholder', canvas.width / 2, canvas.height / 2)

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              id: this.generateId(),
              type: 'screenshot',
              name: `screenshot-${Date.now()}.png`,
              size: blob.size,
              mimeType: 'image/png',
              data: blob,
              thumbnail: canvas.toDataURL('image/png', 0.3)
            })
          } else {
            resolve(null)
          }
        }, 'image/png', 0.8)
      })
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      return null
    }
  }

  /**
   * 设置用户操作跟踪
   */
  private setupUserActionTracking(): void {
    if (!this.config.enableUserTracking) return

    // 跟踪点击事件
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const action = `click:${target.tagName.toLowerCase()}${target.id ? '#' + target.id : ''}${target.className ? '.' + target.className.split(' ')[0] : ''}`
      this.recordUserAction(action)
    })

    // 跟踪表单提交
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement
      const action = `submit:${target.id || 'form'}`
      this.recordUserAction(action)
    })
  }

  /**
   * 记录用户操作
   */
  private recordUserAction(action: string): void {
    this.sessionInfo.userActions.push(`${new Date().toISOString()}: ${action}`)
    
    // 限制操作历史长度
    if (this.sessionInfo.userActions.length > 50) {
      this.sessionInfo.userActions = this.sessionInfo.userActions.slice(-25)
    }
  }

  /**
   * 设置页面跟踪
   */
  private setupPageTracking(): void {
    // 记录初始页面
    this.sessionInfo.pageViews.push(window.location.pathname)

    // 监听路由变化（如果使用Vue Router）
    window.addEventListener('popstate', () => {
      this.sessionInfo.pageViews.push(window.location.pathname)
      this.recordUserAction(`navigate:${window.location.pathname}`)
    })
  }

  /**
   * 设置错误跟踪
   */
  private setupErrorTracking(): void {
    // 监听JavaScript错误
    window.addEventListener('error', (event) => {
      this.submitBugReport(
        `JavaScript Fehler: ${event.error?.name || 'Unbekannter Fehler'}`,
        `Fehler in ${event.filename}:${event.lineno}:${event.colno}\n${event.error?.message || event.message}`,
        event.error,
        false // 不自动截图，避免递归
      )
    })

    // 监听Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.submitBugReport(
        'Unbehandelte Promise-Ablehnung',
        `Promise wurde abgelehnt: ${event.reason}`,
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        false
      )
    })
  }

  /**
   * 启动自动提交
   */
  private startAutoSubmit(): void {
    this.stopAutoSubmit() // 清除现有定时器
    
    this.submitTimer = window.setInterval(() => {
      if (this.feedbackQueue.length > 0) {
        this.submitPendingFeedback()
      }
    }, this.config.submitInterval * 60 * 1000)
  }

  /**
   * 停止自动提交
   */
  private stopAutoSubmit(): void {
    if (this.submitTimer) {
      clearInterval(this.submitTimer)
      this.submitTimer = undefined
    }
  }

  /**
   * 更新统计数据
   */
  private updateStatistics(): void {
    const allFeedback = [...this.feedbackQueue, ...this.submittedFeedback]
    
    this.statistics.total = allFeedback.length

    // 重置计数器
    Object.keys(this.statistics.byType).forEach(key => {
      this.statistics.byType[key as FeedbackType] = 0
    })
    Object.keys(this.statistics.byPriority).forEach(key => {
      this.statistics.byPriority[key as FeedbackPriority] = 0
    })
    Object.keys(this.statistics.byStatus).forEach(key => {
      this.statistics.byStatus[key as FeedbackStatus] = 0
    })

    // 统计各类别
    let totalRating = 0
    let ratingCount = 0

    allFeedback.forEach(feedback => {
      this.statistics.byType[feedback.type]++
      this.statistics.byPriority[feedback.priority]++
      this.statistics.byStatus[feedback.status]++

      if (feedback.rating) {
        totalRating += feedback.rating
        ratingCount++
      }
    })

    // 计算平均评分
    this.statistics.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0

    // 计算解决率
    const resolvedCount = this.statistics.byStatus.resolved
    this.statistics.resolutionRate = this.statistics.total > 0 ? (resolvedCount / this.statistics.total) * 100 : 0
  }

  /**
   * 保存到本地存储
   */
  private saveLocalFeedback(): void {
    try {
      const data = {
        queue: this.feedbackQueue,
        submitted: this.submittedFeedback,
        statistics: this.statistics,
        lastUpdate: new Date().toISOString()
      }
      localStorage.setItem('user-feedback-data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save feedback to localStorage:', error)
    }
  }

  /**
   * 从本地存储加载
   */
  private loadLocalFeedback(): void {
    try {
      const data = localStorage.getItem('user-feedback-data')
      if (data) {
        const parsed = JSON.parse(data)
        this.feedbackQueue = parsed.queue || []
        this.submittedFeedback = parsed.submitted || []
        
        // 清理过期数据
        this.cleanupExpiredFeedback()
        
        this.updateStatistics()
      }
    } catch (error) {
      console.error('Failed to load feedback from localStorage:', error)
    }
  }

  /**
   * 清理过期反馈
   */
  private cleanupExpiredFeedback(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000)
    
    this.feedbackQueue = this.feedbackQueue.filter(feedback => 
      new Date(feedback.metadata.created) >= cutoff
    )
    
    this.submittedFeedback = this.submittedFeedback.filter(feedback => 
      new Date(feedback.metadata.created) >= cutoff
    )
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出单例实例
export const userFeedbackService = UserFeedbackService.getInstance()

// 便捷的组合式API
export function useUserFeedback() {
  const service = UserFeedbackService.getInstance()
  
  return {
    // 状态
    isCollecting: service.isCollecting,
    isSubmitting: service.isSubmitting,
    lastSubmission: service.lastSubmission,
    statistics: service.statistics,
    
    // 方法
    submitFeedback: service.submitFeedback.bind(service),
    submitRating: service.submitRating.bind(service),
    submitSuggestion: service.submitSuggestion.bind(service),
    submitBugReport: service.submitBugReport.bind(service),
    submitFeatureRequest: service.submitFeatureRequest.bind(service),
    getAllFeedback: service.getAllFeedback.bind(service),
    getFeedbackStatistics: service.getFeedbackStatistics.bind(service),
    deleteFeedback: service.deleteFeedback.bind(service),
    clearAllFeedback: service.clearAllFeedback.bind(service),
    submitPendingFeedback: service.submitPendingFeedback.bind(service),
    updateConfig: service.updateConfig.bind(service),
    exportFeedbackData: service.exportFeedbackData.bind(service)
  }
}
