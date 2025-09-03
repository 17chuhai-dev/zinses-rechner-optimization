/**
 * 用户转化漏斗分析服务
 * 跟踪从内容阅读到计算器使用的转化路径，分析用户行为和优化转化率
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserAnalyticsService } from './UserAnalyticsService'
import { ContentPerformanceService } from './ContentPerformanceService'
import type { UserEvent, UserSession } from './UserAnalyticsService'

// 转化漏斗阶段
export type FunnelStage = 
  | 'awareness'      // 认知阶段：首次访问
  | 'interest'       // 兴趣阶段：浏览内容
  | 'consideration'  // 考虑阶段：深度阅读
  | 'intent'         // 意向阶段：使用计算器
  | 'conversion'     // 转化阶段：创建目标/保存结果
  | 'retention'      // 留存阶段：重复访问

// 转化漏斗数据
export interface ConversionFunnel {
  funnelId: string
  name: string
  description: string
  period: { start: Date; end: Date }
  stages: FunnelStageData[]
  overallConversionRate: number
  totalUsers: number
  dropOffAnalysis: DropOffAnalysis[]
  segmentAnalysis: SegmentAnalysis[]
}

// 漏斗阶段数据
export interface FunnelStageData {
  stage: FunnelStage
  name: string
  users: number
  conversionRate: number
  dropOffRate: number
  averageTimeToNext: number // 到下一阶段的平均时间（分钟）
  topActions: string[]
  commonPaths: string[]
}

// 流失分析
export interface DropOffAnalysis {
  fromStage: FunnelStage
  toStage: FunnelStage
  dropOffRate: number
  dropOffReasons: DropOffReason[]
  recoveryOpportunities: string[]
}

export interface DropOffReason {
  reason: string
  percentage: number
  description: string
  actionable: boolean
}

// 用户分群分析
export interface SegmentAnalysis {
  segmentId: string
  name: string
  description: string
  userCount: number
  conversionRate: number
  averageTimeToConvert: number
  topContent: string[]
  preferredCalculators: string[]
  characteristics: UserCharacteristics
}

export interface UserCharacteristics {
  demographics: {
    ageGroup?: string
    location?: string
    deviceType: string
  }
  behavior: {
    sessionDuration: number
    pagesPerSession: number
    returnVisitor: boolean
    timeOfDay: string
  }
  interests: string[]
}

// 转化路径分析
export interface ConversionPath {
  pathId: string
  steps: PathStep[]
  userCount: number
  conversionRate: number
  averageDuration: number
  successRate: number
}

export interface PathStep {
  stepNumber: number
  action: string
  page: string
  timestamp: Date
  duration: number
  exitRate: number
}

// 转化归因分析
export interface ConversionAttribution {
  conversionId: string
  userId: string
  conversionDate: Date
  touchpoints: Touchpoint[]
  attributionModel: 'first-click' | 'last-click' | 'linear' | 'time-decay'
  primarySource: string
  assistingChannels: string[]
  totalValue: number
}

export interface Touchpoint {
  channel: string
  source: string
  medium: string
  campaign?: string
  content?: string
  timestamp: Date
  value: number
  attribution: number
}

// 漏斗优化建议
export interface FunnelOptimization {
  id: string
  stage: FunnelStage
  type: 'content' | 'ux' | 'technical' | 'targeting'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  currentMetric: number
  targetMetric: number
  expectedImpact: string
  actionItems: string[]
  testingStrategy: string
}

/**
 * 用户转化漏斗分析服务
 */
export class ConversionFunnelService {
  private static instance: ConversionFunnelService
  private userAnalyticsService: UserAnalyticsService
  private contentPerformanceService: ContentPerformanceService
  private isInitialized = false

  private constructor() {
    this.userAnalyticsService = UserAnalyticsService.getInstance()
    this.contentPerformanceService = ContentPerformanceService.getInstance()
  }

  static getInstance(): ConversionFunnelService {
    if (!ConversionFunnelService.instance) {
      ConversionFunnelService.instance = new ConversionFunnelService()
    }
    return ConversionFunnelService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.userAnalyticsService.initialize()
      await this.contentPerformanceService.initialize()
      this.isInitialized = true
      console.log('✅ ConversionFunnelService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ConversionFunnelService:', error)
      throw error
    }
  }

  /**
   * 分析转化漏斗
   */
  async analyzeConversionFunnel(period: { start: Date; end: Date }): Promise<ConversionFunnel> {
    if (!this.isInitialized) await this.initialize()

    const sessions = await this.getUserSessions(period)
    const stages = await this.calculateFunnelStages(sessions)
    const dropOffAnalysis = await this.analyzeDropOffs(stages)
    const segmentAnalysis = await this.analyzeUserSegments(sessions)

    const totalUsers = sessions.length
    const convertedUsers = sessions.filter(s => this.hasConverted(s)).length
    const overallConversionRate = totalUsers > 0 ? convertedUsers / totalUsers : 0

    return {
      funnelId: crypto.randomUUID(),
      name: 'Content to Calculator Conversion',
      description: 'Analyse der Nutzerreise von Inhalten zu Rechner-Nutzung',
      period,
      stages,
      overallConversionRate,
      totalUsers,
      dropOffAnalysis,
      segmentAnalysis
    }
  }

  /**
   * 分析转化路径
   */
  async analyzeConversionPaths(period: { start: Date; end: Date }): Promise<ConversionPath[]> {
    if (!this.isInitialized) await this.initialize()

    const sessions = await this.getUserSessions(period)
    const convertedSessions = sessions.filter(s => this.hasConverted(s))

    const pathGroups = this.groupSessionsByPath(convertedSessions)
    const paths: ConversionPath[] = []

    for (const [pathSignature, sessionGroup] of pathGroups) {
      const steps = this.extractPathSteps(sessionGroup[0]) // 使用第一个会话作为模板
      const userCount = sessionGroup.length
      const conversionRate = 1.0 // 这些都是已转化的会话
      const averageDuration = this.calculateAverageDuration(sessionGroup)
      const successRate = this.calculateSuccessRate(sessionGroup)

      paths.push({
        pathId: crypto.randomUUID(),
        steps,
        userCount,
        conversionRate,
        averageDuration,
        successRate
      })
    }

    return paths.sort((a, b) => b.userCount - a.userCount).slice(0, 10) // 返回前10个路径
  }

  /**
   * 转化归因分析
   */
  async analyzeConversionAttribution(
    period: { start: Date; end: Date },
    model: 'first-click' | 'last-click' | 'linear' | 'time-decay' = 'linear'
  ): Promise<ConversionAttribution[]> {
    if (!this.isInitialized) await this.initialize()

    const sessions = await this.getUserSessions(period)
    const convertedSessions = sessions.filter(s => this.hasConverted(s))

    const attributions: ConversionAttribution[] = []

    for (const session of convertedSessions) {
      const touchpoints = this.extractTouchpoints(session)
      const attribution = this.calculateAttribution(touchpoints, model)

      attributions.push({
        conversionId: crypto.randomUUID(),
        userId: session.userId,
        conversionDate: session.endTime || new Date(),
        touchpoints,
        attributionModel: model,
        primarySource: this.getPrimarySource(touchpoints, model),
        assistingChannels: this.getAssistingChannels(touchpoints, model),
        totalValue: this.calculateConversionValue(session)
      })
    }

    return attributions
  }

  /**
   * 生成漏斗优化建议
   */
  async generateFunnelOptimizations(funnel: ConversionFunnel): Promise<FunnelOptimization[]> {
    const optimizations: FunnelOptimization[] = []

    // 分析每个阶段的优化机会
    for (let i = 0; i < funnel.stages.length - 1; i++) {
      const currentStage = funnel.stages[i]
      const nextStage = funnel.stages[i + 1]
      
      if (currentStage.dropOffRate > 0.5) { // 流失率超过50%
        optimizations.push({
          id: crypto.randomUUID(),
          stage: currentStage.stage,
          type: 'ux',
          priority: 'high',
          title: `${currentStage.name} 阶段流失率过高`,
          description: `${currentStage.name} 到 ${nextStage.name} 的流失率为 ${(currentStage.dropOffRate * 100).toFixed(1)}%`,
          currentMetric: currentStage.dropOffRate,
          targetMetric: 0.3,
          expectedImpact: `+${((currentStage.dropOffRate - 0.3) * currentStage.users).toFixed(0)} 转化用户`,
          actionItems: this.generateActionItems(currentStage.stage),
          testingStrategy: this.generateTestingStrategy(currentStage.stage)
        })
      }
    }

    // 分析整体转化率
    if (funnel.overallConversionRate < 0.05) { // 整体转化率低于5%
      optimizations.push({
        id: crypto.randomUUID(),
        stage: 'consideration',
        type: 'content',
        priority: 'high',
        title: '整体转化率偏低',
        description: `当前整体转化率为 ${(funnel.overallConversionRate * 100).toFixed(2)}%，低于行业平均水平`,
        currentMetric: funnel.overallConversionRate,
        targetMetric: 0.08,
        expectedImpact: `+${((0.08 - funnel.overallConversionRate) * funnel.totalUsers).toFixed(0)} 转化用户`,
        actionItems: [
          '优化内容质量和相关性',
          '改善计算器的可发现性',
          '添加更多行动号召(CTA)',
          '简化用户操作流程'
        ],
        testingStrategy: 'A/B测试不同的内容布局和CTA位置'
      })
    }

    return optimizations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * 实时转化跟踪
   */
  async trackConversionEvent(
    userId: string,
    stage: FunnelStage,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    await this.userAnalyticsService.trackEvent('funnel_progression', {
      stage,
      action,
      ...metadata
    })
  }

  // 私有方法
  private async getUserSessions(period: { start: Date; end: Date }): Promise<UserSession[]> {
    // 简化实现，实际应该从UserAnalyticsService获取
    const mockSessions: UserSession[] = []
    
    for (let i = 0; i < 1000; i++) {
      const startTime = new Date(period.start.getTime() + Math.random() * (period.end.getTime() - period.start.getTime()))
      const duration = Math.random() * 1800 + 300 // 5-35分钟
      
      mockSessions.push({
        sessionId: `session_${i}`,
        userId: `user_${Math.floor(i / 3)}`, // 平均每用户3个会话
        startTime,
        endTime: new Date(startTime.getTime() + duration * 1000),
        duration,
        pageViews: Math.floor(Math.random() * 10) + 1,
        events: [],
        deviceInfo: {
          userAgent: 'Mozilla/5.0...',
          platform: Math.random() > 0.5 ? 'desktop' : 'mobile',
          language: 'de-DE'
        },
        location: {
          country: 'DE',
          city: 'Berlin'
        }
      })
    }
    
    return mockSessions
  }

  private async calculateFunnelStages(sessions: UserSession[]): Promise<FunnelStageData[]> {
    const totalUsers = new Set(sessions.map(s => s.userId)).size

    // 模拟各阶段数据
    const stageData = [
      { stage: 'awareness' as FunnelStage, users: totalUsers, name: 'Erstkontakt' },
      { stage: 'interest' as FunnelStage, users: Math.floor(totalUsers * 0.7), name: 'Interesse' },
      { stage: 'consideration' as FunnelStage, users: Math.floor(totalUsers * 0.4), name: 'Überlegung' },
      { stage: 'intent' as FunnelStage, users: Math.floor(totalUsers * 0.15), name: 'Absicht' },
      { stage: 'conversion' as FunnelStage, users: Math.floor(totalUsers * 0.08), name: 'Konversion' },
      { stage: 'retention' as FunnelStage, users: Math.floor(totalUsers * 0.05), name: 'Bindung' }
    ]

    return stageData.map((data, index) => {
      const nextStageUsers = index < stageData.length - 1 ? stageData[index + 1].users : 0
      const conversionRate = data.users > 0 ? nextStageUsers / data.users : 0
      const dropOffRate = 1 - conversionRate

      return {
        ...data,
        conversionRate,
        dropOffRate,
        averageTimeToNext: Math.random() * 60 + 10, // 10-70分钟
        topActions: this.getTopActionsForStage(data.stage),
        commonPaths: this.getCommonPathsForStage(data.stage)
      }
    })
  }

  private async analyzeDropOffs(stages: FunnelStageData[]): Promise<DropOffAnalysis[]> {
    const dropOffs: DropOffAnalysis[] = []

    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i]
      const toStage = stages[i + 1]

      dropOffs.push({
        fromStage: fromStage.stage,
        toStage: toStage.stage,
        dropOffRate: fromStage.dropOffRate,
        dropOffReasons: this.getDropOffReasons(fromStage.stage),
        recoveryOpportunities: this.getRecoveryOpportunities(fromStage.stage)
      })
    }

    return dropOffs
  }

  private async analyzeUserSegments(sessions: UserSession[]): Promise<SegmentAnalysis[]> {
    return [
      {
        segmentId: 'high-intent',
        name: 'Hochinteressierte Nutzer',
        description: 'Nutzer mit langen Sitzungen und mehreren Seitenaufrufen',
        userCount: 150,
        conversionRate: 0.25,
        averageTimeToConvert: 45,
        topContent: ['Zinseszins Grundlagen', 'Investment Strategien'],
        preferredCalculators: ['Sparplan-Rechner', 'Zinseszins-Rechner'],
        characteristics: {
          demographics: {
            ageGroup: '35-44',
            location: 'Deutschland',
            deviceType: 'desktop'
          },
          behavior: {
            sessionDuration: 1200,
            pagesPerSession: 8,
            returnVisitor: true,
            timeOfDay: 'evening'
          },
          interests: ['Geldanlage', 'Vermögensaufbau', 'Finanzplanung']
        }
      },
      {
        segmentId: 'mobile-users',
        name: 'Mobile Nutzer',
        description: 'Nutzer, die hauptsächlich mobile Geräte verwenden',
        userCount: 200,
        conversionRate: 0.12,
        averageTimeToConvert: 25,
        topContent: ['Schnelle Finanz-Tipps', 'Mobile Rechner'],
        preferredCalculators: ['Einfacher Zinsrechner'],
        characteristics: {
          demographics: {
            ageGroup: '25-34',
            deviceType: 'mobile'
          },
          behavior: {
            sessionDuration: 300,
            pagesPerSession: 3,
            returnVisitor: false,
            timeOfDay: 'lunch'
          },
          interests: ['Sparen', 'Budgetplanung']
        }
      }
    ]
  }

  private hasConverted(session: UserSession): boolean {
    // 简化判断：假设30%的会话有转化
    return Math.random() < 0.3
  }

  private groupSessionsByPath(sessions: UserSession[]): Map<string, UserSession[]> {
    const pathGroups = new Map<string, UserSession[]>()
    
    for (const session of sessions) {
      const pathSignature = this.generatePathSignature(session)
      if (!pathGroups.has(pathSignature)) {
        pathGroups.set(pathSignature, [])
      }
      pathGroups.get(pathSignature)!.push(session)
    }
    
    return pathGroups
  }

  private generatePathSignature(session: UserSession): string {
    // 简化实现：基于页面浏览数生成路径签名
    return `path_${Math.floor(session.pageViews / 2)}`
  }

  private extractPathSteps(session: UserSession): PathStep[] {
    const steps: PathStep[] = []
    const stepCount = Math.min(session.pageViews, 5)
    
    for (let i = 0; i < stepCount; i++) {
      steps.push({
        stepNumber: i + 1,
        action: i === 0 ? 'landing' : i === stepCount - 1 ? 'conversion' : 'navigation',
        page: i === 0 ? '/artikel/zinseszins' : i === stepCount - 1 ? '/rechner/sparplan' : '/artikel/other',
        timestamp: new Date(session.startTime.getTime() + i * 300000), // 每步5分钟
        duration: 300,
        exitRate: i === stepCount - 1 ? 0 : Math.random() * 0.3
      })
    }
    
    return steps
  }

  private calculateAverageDuration(sessions: UserSession[]): number {
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0)
    return totalDuration / sessions.length
  }

  private calculateSuccessRate(sessions: UserSession[]): number {
    return 1.0 // 这些都是成功转化的会话
  }

  private extractTouchpoints(session: UserSession): Touchpoint[] {
    return [
      {
        channel: 'organic',
        source: 'google',
        medium: 'search',
        timestamp: session.startTime,
        value: 1,
        attribution: 0.5
      },
      {
        channel: 'direct',
        source: 'direct',
        medium: 'none',
        timestamp: new Date(session.startTime.getTime() + 600000),
        value: 1,
        attribution: 0.5
      }
    ]
  }

  private calculateAttribution(touchpoints: Touchpoint[], model: string): Touchpoint[] {
    // 简化实现：平均分配归因
    const attribution = 1 / touchpoints.length
    return touchpoints.map(tp => ({ ...tp, attribution }))
  }

  private getPrimarySource(touchpoints: Touchpoint[], model: string): string {
    return touchpoints[0]?.source || 'unknown'
  }

  private getAssistingChannels(touchpoints: Touchpoint[], model: string): string[] {
    return touchpoints.slice(1).map(tp => tp.channel)
  }

  private calculateConversionValue(session: UserSession): number {
    return 10 // 假设每次转化价值10欧元
  }

  private getTopActionsForStage(stage: FunnelStage): string[] {
    const actions = {
      awareness: ['Seitenaufruf', 'Artikel öffnen'],
      interest: ['Artikel lesen', 'Scrollen'],
      consideration: ['Mehrere Artikel lesen', 'Verweildauer erhöhen'],
      intent: ['Rechner öffnen', 'Parameter eingeben'],
      conversion: ['Berechnung durchführen', 'Ergebnis speichern'],
      retention: ['Wiederkehrender Besuch', 'Neue Berechnung']
    }
    return actions[stage] || []
  }

  private getCommonPathsForStage(stage: FunnelStage): string[] {
    const paths = {
      awareness: ['Google → Artikel', 'Direkt → Homepage'],
      interest: ['Artikel → Verwandte Artikel', 'Homepage → Kategorie'],
      consideration: ['Artikel → Rechner-Übersicht', 'Kategorie → Artikel'],
      intent: ['Artikel → Rechner', 'Rechner-Übersicht → Rechner'],
      conversion: ['Rechner → Ergebnis', 'Parameter → Berechnung'],
      retention: ['Bookmark → Rechner', 'E-Mail → Artikel']
    }
    return paths[stage] || []
  }

  private getDropOffReasons(stage: FunnelStage): DropOffReason[] {
    const reasons = {
      awareness: [
        { reason: 'Langsame Ladezeit', percentage: 30, description: 'Seite lädt zu langsam', actionable: true },
        { reason: 'Irrelevanter Inhalt', percentage: 25, description: 'Inhalt entspricht nicht der Erwartung', actionable: true }
      ],
      interest: [
        { reason: 'Schwer verständlich', percentage: 35, description: 'Inhalt zu komplex', actionable: true },
        { reason: 'Fehlende CTA', percentage: 20, description: 'Keine klaren nächsten Schritte', actionable: true }
      ],
      consideration: [
        { reason: 'Fehlende Rechner-Links', percentage: 40, description: 'Rechner nicht leicht auffindbar', actionable: true },
        { reason: 'Zu viele Optionen', percentage: 15, description: 'Nutzer überfordert', actionable: true }
      ]
    }
    return reasons[stage] || []
  }

  private getRecoveryOpportunities(stage: FunnelStage): string[] {
    const opportunities = {
      awareness: ['Retargeting-Kampagnen', 'E-Mail-Follow-up'],
      interest: ['Push-Benachrichtigungen', 'Personalisierte Empfehlungen'],
      consideration: ['Rechner-Tutorials', 'Live-Chat Support'],
      intent: ['Vereinfachte Eingabe', 'Beispiel-Szenarien'],
      conversion: ['Speicher-Erinnerungen', 'Teilen-Funktionen']
    }
    return opportunities[stage] || []
  }

  private generateActionItems(stage: FunnelStage): string[] {
    const actions = {
      awareness: ['Ladezeiten optimieren', 'Landing Page A/B testen', 'SEO verbessern'],
      interest: ['Inhalte vereinfachen', 'Mehr visuelle Elemente', 'Bessere Navigation'],
      consideration: ['CTA-Buttons prominenter platzieren', 'Rechner-Vorschau hinzufügen'],
      intent: ['Rechner-UX verbessern', 'Eingabe-Hilfen hinzufügen'],
      conversion: ['Speicher-Funktion verbessern', 'Teilen erleichtern']
    }
    return actions[stage] || []
  }

  private generateTestingStrategy(stage: FunnelStage): string {
    const strategies = {
      awareness: 'A/B Test verschiedener Landing Page Designs',
      interest: 'Multivariate Tests für Content-Layout',
      consideration: 'A/B Test für CTA-Platzierung und -Text',
      intent: 'Usability Tests für Rechner-Interface',
      conversion: 'A/B Test für Ergebnis-Darstellung'
    }
    return strategies[stage] || 'Standard A/B Test'
  }
}

// Export singleton instance
export const conversionFunnelService = ConversionFunnelService.getInstance()
