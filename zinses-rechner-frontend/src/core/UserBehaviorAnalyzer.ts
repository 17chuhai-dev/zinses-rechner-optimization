/**
 * 用户行为分析器
 * 分析用户输入行为模式，用于优化防抖策略
 */

import { ref, reactive } from 'vue'

// 输入事件接口
export interface InputEvent {
  calculatorId: string
  fieldName: string
  value: any
  timestamp: number
  eventType: 'input' | 'focus' | 'blur' | 'submit'
}

// 用户会话信息
export interface UserSession {
  sessionId: string
  startTime: number
  endTime?: number
  totalInputs: number
  calculatorsUsed: Set<string>
  averageInputInterval: number
  longestPause: number
  shortestPause: number
}

// 行为模式分析结果
export interface BehaviorPattern {
  userType: 'beginner' | 'intermediate' | 'expert'
  inputStyle: 'fast' | 'moderate' | 'slow' | 'erratic'
  preferredCalculators: string[]
  averageSessionDuration: number
  typicalInputFrequency: number
  pausePatterns: {
    short: number    // <1s
    medium: number   // 1-5s
    long: number     // >5s
  }
  calculatorExpertise: Record<string, number> // 1-10 expertise level
}

// 实时行为指标
export interface RealtimeBehaviorMetrics {
  currentInputFrequency: number
  currentPauseDuration: number
  sessionProgress: number
  focusLevel: number
  calculatorFamiliarity: number
}

/**
 * 用户行为分析器类
 */
export class UserBehaviorAnalyzer {
  private static instance: UserBehaviorAnalyzer
  
  // 事件历史记录
  private eventHistory: InputEvent[] = []
  private readonly maxHistorySize = 1000
  
  // 当前会话
  private currentSession: UserSession | null = null
  private sessionHistory: UserSession[] = []
  
  // 行为分析结果
  private behaviorPattern = reactive<BehaviorPattern>({
    userType: 'beginner',
    inputStyle: 'moderate',
    preferredCalculators: [],
    averageSessionDuration: 0,
    typicalInputFrequency: 1,
    pausePatterns: { short: 0, medium: 0, long: 0 },
    calculatorExpertise: {}
  })
  
  // 实时指标
  private realtimeMetrics = reactive<RealtimeBehaviorMetrics>({
    currentInputFrequency: 0,
    currentPauseDuration: 0,
    sessionProgress: 0,
    focusLevel: 5,
    calculatorFamiliarity: 1
  })
  
  // 分析配置
  private config = {
    analysisWindowMs: 30000,      // 30秒分析窗口
    sessionTimeoutMs: 300000,     // 5分钟会话超时
    minEventsForAnalysis: 10,     // 最少事件数才开始分析
    expertiseThreshold: 50        // 成为专家的最少使用次数
  }

  private constructor() {
    this.startRealtimeAnalysis()
    console.log('📊 用户行为分析器已初始化')
  }

  static getInstance(): UserBehaviorAnalyzer {
    if (!UserBehaviorAnalyzer.instance) {
      UserBehaviorAnalyzer.instance = new UserBehaviorAnalyzer()
    }
    return UserBehaviorAnalyzer.instance
  }

  /**
   * 开始实时分析
   */
  private startRealtimeAnalysis(): void {
    // 每5秒更新一次实时指标
    setInterval(() => {
      this.updateRealtimeMetrics()
    }, 5000)
    
    // 每30秒进行一次行为模式分析
    setInterval(() => {
      this.analyzeBehaviorPattern()
    }, 30000)
  }

  /**
   * 记录输入事件
   */
  recordEvent(event: Omit<InputEvent, 'timestamp'>): void {
    const inputEvent: InputEvent = {
      ...event,
      timestamp: Date.now()
    }
    
    // 添加到历史记录
    this.eventHistory.push(inputEvent)
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }
    
    // 更新或创建会话
    this.updateSession(inputEvent)
    
    // 立即更新实时指标
    this.updateRealtimeMetrics()
  }

  /**
   * 更新用户会话
   */
  private updateSession(event: InputEvent): void {
    const now = Date.now()
    
    // 检查是否需要创建新会话
    if (!this.currentSession || 
        (this.currentSession.endTime && now - this.currentSession.endTime > this.config.sessionTimeoutMs)) {
      
      // 结束当前会话
      if (this.currentSession) {
        this.currentSession.endTime = now
        this.sessionHistory.push({ ...this.currentSession })
      }
      
      // 创建新会话
      this.currentSession = {
        sessionId: `session-${now}`,
        startTime: now,
        totalInputs: 0,
        calculatorsUsed: new Set(),
        averageInputInterval: 0,
        longestPause: 0,
        shortestPause: Infinity
      }
    }
    
    // 更新会话数据
    this.currentSession.totalInputs++
    this.currentSession.calculatorsUsed.add(event.calculatorId)
    this.currentSession.endTime = now
    
    // 计算输入间隔
    if (this.eventHistory.length > 1) {
      const lastEvent = this.eventHistory[this.eventHistory.length - 2]
      const interval = now - lastEvent.timestamp
      
      this.currentSession.longestPause = Math.max(this.currentSession.longestPause, interval)
      this.currentSession.shortestPause = Math.min(this.currentSession.shortestPause, interval)
      
      // 更新平均间隔
      const totalInterval = this.currentSession.averageInputInterval * (this.currentSession.totalInputs - 1) + interval
      this.currentSession.averageInputInterval = totalInterval / this.currentSession.totalInputs
    }
  }

  /**
   * 更新实时指标
   */
  private updateRealtimeMetrics(): void {
    const now = Date.now()
    const windowStart = now - this.config.analysisWindowMs
    
    // 获取分析窗口内的事件
    const recentEvents = this.eventHistory.filter(event => event.timestamp >= windowStart)
    
    if (recentEvents.length === 0) {
      this.realtimeMetrics.currentInputFrequency = 0
      this.realtimeMetrics.currentPauseDuration = now - (this.eventHistory[this.eventHistory.length - 1]?.timestamp || now)
      return
    }
    
    // 计算当前输入频率 (事件/秒)
    this.realtimeMetrics.currentInputFrequency = recentEvents.length / (this.config.analysisWindowMs / 1000)
    
    // 计算当前停顿时间
    const lastEvent = this.eventHistory[this.eventHistory.length - 1]
    this.realtimeMetrics.currentPauseDuration = now - lastEvent.timestamp
    
    // 计算会话进度 (基于典型会话时长)
    if (this.currentSession) {
      const sessionDuration = now - this.currentSession.startTime
      const typicalDuration = this.behaviorPattern.averageSessionDuration || 300000 // 默认5分钟
      this.realtimeMetrics.sessionProgress = Math.min(sessionDuration / typicalDuration, 1)
    }
    
    // 计算专注度 (基于输入一致性)
    const inputIntervals = []
    for (let i = 1; i < recentEvents.length; i++) {
      inputIntervals.push(recentEvents[i].timestamp - recentEvents[i - 1].timestamp)
    }
    
    if (inputIntervals.length > 0) {
      const avgInterval = inputIntervals.reduce((a, b) => a + b, 0) / inputIntervals.length
      const variance = inputIntervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / inputIntervals.length
      const consistency = Math.max(0, 10 - Math.sqrt(variance) / 1000) // 0-10 scale
      this.realtimeMetrics.focusLevel = Math.round(consistency)
    }
    
    // 计算计算器熟悉度
    if (this.currentSession && recentEvents.length > 0) {
      const currentCalculator = recentEvents[recentEvents.length - 1].calculatorId
      const calculatorEvents = recentEvents.filter(e => e.calculatorId === currentCalculator)
      const familiarity = Math.min(calculatorEvents.length / 10, 10) // 0-10 scale
      this.realtimeMetrics.calculatorFamiliarity = Math.round(familiarity)
    }
  }

  /**
   * 分析用户行为模式
   */
  private analyzeBehaviorPattern(): void {
    if (this.eventHistory.length < this.config.minEventsForAnalysis) {
      return
    }
    
    // 分析用户类型
    this.analyzeUserType()
    
    // 分析输入风格
    this.analyzeInputStyle()
    
    // 分析偏好的计算器
    this.analyzePreferredCalculators()
    
    // 分析会话模式
    this.analyzeSessionPatterns()
    
    // 分析停顿模式
    this.analyzePausePatterns()
    
    // 分析计算器专业度
    this.analyzeCalculatorExpertise()
  }

  /**
   * 分析用户类型
   */
  private analyzeUserType(): void {
    const totalEvents = this.eventHistory.length
    const uniqueCalculators = new Set(this.eventHistory.map(e => e.calculatorId)).size
    const avgSessionDuration = this.sessionHistory.length > 0 
      ? this.sessionHistory.reduce((sum, s) => sum + (s.endTime! - s.startTime), 0) / this.sessionHistory.length
      : 0
    
    if (totalEvents > 200 && uniqueCalculators >= 5 && avgSessionDuration > 600000) {
      this.behaviorPattern.userType = 'expert'
    } else if (totalEvents > 50 && uniqueCalculators >= 3 && avgSessionDuration > 300000) {
      this.behaviorPattern.userType = 'intermediate'
    } else {
      this.behaviorPattern.userType = 'beginner'
    }
  }

  /**
   * 分析输入风格
   */
  private analyzeInputStyle(): void {
    const recentEvents = this.eventHistory.slice(-50) // 最近50个事件
    if (recentEvents.length < 10) return
    
    const intervals = []
    for (let i = 1; i < recentEvents.length; i++) {
      intervals.push(recentEvents[i].timestamp - recentEvents[i - 1].timestamp)
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
    
    if (avgInterval < 2000 && variance < 1000000) {
      this.behaviorPattern.inputStyle = 'fast'
    } else if (avgInterval > 10000 || variance > 5000000) {
      this.behaviorPattern.inputStyle = 'erratic'
    } else if (avgInterval > 5000) {
      this.behaviorPattern.inputStyle = 'slow'
    } else {
      this.behaviorPattern.inputStyle = 'moderate'
    }
  }

  /**
   * 分析偏好的计算器
   */
  private analyzePreferredCalculators(): void {
    const calculatorUsage = new Map<string, number>()
    
    this.eventHistory.forEach(event => {
      calculatorUsage.set(event.calculatorId, (calculatorUsage.get(event.calculatorId) || 0) + 1)
    })
    
    const sortedCalculators = Array.from(calculatorUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([calculatorId]) => calculatorId)
    
    this.behaviorPattern.preferredCalculators = sortedCalculators
  }

  /**
   * 分析会话模式
   */
  private analyzeSessionPatterns(): void {
    if (this.sessionHistory.length === 0) return
    
    const durations = this.sessionHistory.map(s => s.endTime! - s.startTime)
    this.behaviorPattern.averageSessionDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    
    const frequencies = this.sessionHistory.map(s => s.totalInputs / ((s.endTime! - s.startTime) / 1000))
    this.behaviorPattern.typicalInputFrequency = frequencies.reduce((a, b) => a + b, 0) / frequencies.length
  }

  /**
   * 分析停顿模式
   */
  private analyzePausePatterns(): void {
    const intervals = []
    for (let i = 1; i < this.eventHistory.length; i++) {
      intervals.push(this.eventHistory[i].timestamp - this.eventHistory[i - 1].timestamp)
    }
    
    const pausePatterns = { short: 0, medium: 0, long: 0 }
    intervals.forEach(interval => {
      if (interval < 1000) {
        pausePatterns.short++
      } else if (interval < 5000) {
        pausePatterns.medium++
      } else {
        pausePatterns.long++
      }
    })
    
    this.behaviorPattern.pausePatterns = pausePatterns
  }

  /**
   * 分析计算器专业度
   */
  private analyzeCalculatorExpertise(): void {
    const calculatorUsage = new Map<string, number>()
    
    this.eventHistory.forEach(event => {
      calculatorUsage.set(event.calculatorId, (calculatorUsage.get(event.calculatorId) || 0) + 1)
    })
    
    const expertise: Record<string, number> = {}
    calculatorUsage.forEach((count, calculatorId) => {
      expertise[calculatorId] = Math.min(Math.floor(count / 5), 10) // 0-10 scale
    })
    
    this.behaviorPattern.calculatorExpertise = expertise
  }

  /**
   * 获取行为模式
   */
  getBehaviorPattern(): BehaviorPattern {
    return { ...this.behaviorPattern }
  }

  /**
   * 获取实时指标
   */
  getRealtimeMetrics(): RealtimeBehaviorMetrics {
    return { ...this.realtimeMetrics }
  }

  /**
   * 获取当前会话信息
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession ? { ...this.currentSession } : null
  }

  /**
   * 获取会话历史
   */
  getSessionHistory(): UserSession[] {
    return [...this.sessionHistory]
  }

  /**
   * 获取统计报告
   */
  getAnalyticsReport(): any {
    const totalEvents = this.eventHistory.length
    const totalSessions = this.sessionHistory.length
    const uniqueCalculators = new Set(this.eventHistory.map(e => e.calculatorId)).size
    
    return {
      totalEvents,
      totalSessions,
      uniqueCalculators,
      behaviorPattern: this.getBehaviorPattern(),
      realtimeMetrics: this.getRealtimeMetrics(),
      currentSession: this.getCurrentSession(),
      analysisQuality: totalEvents >= this.config.minEventsForAnalysis ? 'good' : 'insufficient'
    }
  }

  /**
   * 重置分析数据
   */
  reset(): void {
    this.eventHistory = []
    this.currentSession = null
    this.sessionHistory = []
    
    // 重置为默认值
    Object.assign(this.behaviorPattern, {
      userType: 'beginner',
      inputStyle: 'moderate',
      preferredCalculators: [],
      averageSessionDuration: 0,
      typicalInputFrequency: 1,
      pausePatterns: { short: 0, medium: 0, long: 0 },
      calculatorExpertise: {}
    })
    
    Object.assign(this.realtimeMetrics, {
      currentInputFrequency: 0,
      currentPauseDuration: 0,
      sessionProgress: 0,
      focusLevel: 5,
      calculatorFamiliarity: 1
    })
    
    console.log('🔄 用户行为分析数据已重置')
  }

  /**
   * 导出分析数据
   */
  exportData(): string {
    return JSON.stringify({
      eventHistory: this.eventHistory,
      sessionHistory: this.sessionHistory,
      behaviorPattern: this.behaviorPattern,
      timestamp: new Date().toISOString()
    }, null, 2)
  }

  /**
   * 导入分析数据
   */
  importData(dataJson: string): boolean {
    try {
      const data = JSON.parse(dataJson)
      
      if (data.eventHistory) {
        this.eventHistory = data.eventHistory
      }
      
      if (data.sessionHistory) {
        this.sessionHistory = data.sessionHistory
      }
      
      if (data.behaviorPattern) {
        Object.assign(this.behaviorPattern, data.behaviorPattern)
      }
      
      console.log('✅ 用户行为分析数据导入成功')
      return true
    } catch (error) {
      console.error('❌ 用户行为分析数据导入失败:', error)
      return false
    }
  }
}

// 导出单例实例
export const userBehaviorAnalyzer = UserBehaviorAnalyzer.getInstance()
