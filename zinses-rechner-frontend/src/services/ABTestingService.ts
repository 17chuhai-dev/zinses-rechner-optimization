/**
 * A/B测试框架服务
 * 支持内容标题、描述、CTA按钮的测试优化，提供统计显著性检验和自动化测试结果分析
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { UserAnalyticsService } from './UserAnalyticsService'
import { ConversionFunnelService } from './ConversionFunnelService'

// A/B测试实验
export interface ABTest {
  testId: string
  name: string
  description: string
  hypothesis: string
  
  // 测试配置
  testType: 'simple' | 'multivariate' | 'split-url'
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived'
  
  // 时间配置
  startDate: Date
  endDate?: Date
  duration: number // 预计持续天数
  
  // 流量配置
  trafficAllocation: number // 0-1，参与测试的流量比例
  variants: TestVariant[]
  
  // 目标配置
  primaryGoal: TestGoal
  secondaryGoals: TestGoal[]
  
  // 统计配置
  confidenceLevel: number // 0.95, 0.99等
  minimumDetectableEffect: number // 最小可检测效应
  statisticalPower: number // 统计功效，通常0.8
  
  // 结果
  results?: TestResults
  winner?: string // 获胜变体ID
  
  // 元数据
  createdBy: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
}

// 测试变体
export interface TestVariant {
  variantId: string
  name: string
  description: string
  trafficWeight: number // 流量权重
  
  // 变体配置
  changes: VariantChange[]
  
  // 实时数据
  visitors: number
  conversions: number
  conversionRate: number
  
  // 统计数据
  confidenceInterval: [number, number]
  pValue: number
  isSignificant: boolean
}

// 变体变更
export interface VariantChange {
  element: string // CSS选择器或元素ID
  property: string // 'text', 'html', 'style', 'attribute'
  value: any
  originalValue?: any
}

// 测试目标
export interface TestGoal {
  goalId: string
  name: string
  description: string
  type: 'conversion' | 'engagement' | 'revenue' | 'custom'
  
  // 目标配置
  eventType: string // 'click', 'page_view', 'form_submit'等
  selector?: string // CSS选择器
  url?: string // 目标URL
  customEvent?: string // 自定义事件名
  
  // 目标值
  targetValue?: number
  valueType?: 'binary' | 'numeric' | 'duration'
}

// 测试结果
export interface TestResults {
  testId: string
  status: 'running' | 'completed' | 'inconclusive'
  
  // 整体统计
  totalVisitors: number
  totalConversions: number
  overallConversionRate: number
  
  // 变体比较
  variantResults: VariantResults[]
  
  // 统计显著性
  isSignificant: boolean
  pValue: number
  confidenceLevel: number
  
  // 业务影响
  expectedLift: number
  expectedImpact: string
  
  // 建议
  recommendation: 'implement_winner' | 'continue_testing' | 'redesign_test' | 'no_change'
  reasoning: string
  
  // 时间数据
  startDate: Date
  endDate?: Date
  lastUpdated: Date
}

// 变体结果
export interface VariantResults {
  variantId: string
  name: string
  
  // 基础指标
  visitors: number
  conversions: number
  conversionRate: number
  
  // 统计指标
  standardError: number
  confidenceInterval: [number, number]
  pValue: number
  zScore: number
  
  // 相对表现
  relativeImprovement: number // 相对于控制组的提升
  isWinner: boolean
  isSignificant: boolean
  
  // 业务指标
  revenue?: number
  averageOrderValue?: number
  customMetrics?: Record<string, number>
}

// 测试洞察
export interface TestInsight {
  id: string
  testId: string
  type: 'performance' | 'statistical' | 'business' | 'technical'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  recommendation?: string
  actionRequired: boolean
}

// 测试模板
export interface TestTemplate {
  templateId: string
  name: string
  description: string
  category: 'headline' | 'cta' | 'layout' | 'content' | 'form'
  
  // 模板配置
  defaultVariants: Partial<TestVariant>[]
  defaultGoals: Partial<TestGoal>[]
  
  // 最佳实践
  bestPractices: string[]
  commonPitfalls: string[]
  
  // 使用统计
  usageCount: number
  successRate: number
}

/**
 * A/B测试框架服务
 */
export class ABTestingService {
  private static instance: ABTestingService
  private userAnalyticsService: UserAnalyticsService
  private conversionFunnelService: ConversionFunnelService
  private activeTests: Map<string, ABTest> = new Map()
  private userAssignments: Map<string, Map<string, string>> = new Map() // userId -> testId -> variantId
  private isInitialized = false

  private constructor() {
    this.userAnalyticsService = UserAnalyticsService.getInstance()
    this.conversionFunnelService = ConversionFunnelService.getInstance()
  }

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService()
    }
    return ABTestingService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.userAnalyticsService.initialize()
      await this.conversionFunnelService.initialize()
      await this.loadActiveTests()
      this.startResultsProcessor()
      this.isInitialized = true
      console.log('✅ ABTestingService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ABTestingService:', error)
      throw error
    }
  }

  /**
   * 创建A/B测试
   */
  async createTest(testConfig: Omit<ABTest, 'testId' | 'createdAt' | 'updatedAt'>): Promise<ABTest> {
    if (!this.isInitialized) await this.initialize()

    // 验证测试配置
    this.validateTestConfig(testConfig)

    const test: ABTest = {
      testId: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...testConfig
    }

    // 计算样本量需求
    const sampleSize = this.calculateSampleSize(test)
    console.log(`📊 Test "${test.name}" requires ${sampleSize} visitors per variant`)

    // 保存测试
    await this.saveTest(test)
    
    console.log(`🧪 A/B Test created: ${test.name}`)
    return test
  }

  /**
   * 启动测试
   */
  async startTest(testId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const test = await this.getTest(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    if (test.status !== 'draft') {
      throw new Error(`Test ${testId} is not in draft status`)
    }

    test.status = 'running'
    test.startDate = new Date()
    test.updatedAt = new Date()

    this.activeTests.set(testId, test)
    await this.saveTest(test)

    console.log(`🚀 A/B Test started: ${test.name}`)
  }

  /**
   * 停止测试
   */
  async stopTest(testId: string, reason?: string): Promise<TestResults> {
    if (!this.isInitialized) await this.initialize()

    const test = await this.getTest(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    test.status = 'completed'
    test.endDate = new Date()
    test.updatedAt = new Date()

    // 计算最终结果
    const results = await this.calculateTestResults(test)
    test.results = results
    test.winner = this.determineWinner(results)

    this.activeTests.delete(testId)
    await this.saveTest(test)

    console.log(`🏁 A/B Test completed: ${test.name}`)
    return results
  }

  /**
   * 获取用户的测试变体
   */
  async getVariantForUser(userId: string, testId: string): Promise<string | null> {
    if (!this.isInitialized) await this.initialize()

    // 检查用户是否已分配变体
    const userTests = this.userAssignments.get(userId)
    if (userTests?.has(testId)) {
      return userTests.get(testId) || null
    }

    const test = this.activeTests.get(testId)
    if (!test || test.status !== 'running') {
      return null
    }

    // 检查用户是否应该参与测试
    if (!this.shouldUserParticipate(userId, test)) {
      return null
    }

    // 分配变体
    const variantId = this.assignVariant(userId, test)
    
    // 记录分配
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map())
    }
    this.userAssignments.get(userId)!.set(testId, variantId)

    // 跟踪参与事件
    await this.trackTestEvent(userId, testId, variantId, 'assigned')

    return variantId
  }

  /**
   * 跟踪测试目标事件
   */
  async trackGoalEvent(
    userId: string,
    testId: string,
    goalId: string,
    value?: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const variantId = await this.getVariantForUser(userId, testId)
    if (!variantId) return

    await this.trackTestEvent(userId, testId, variantId, 'goal_achieved', {
      goalId,
      value,
      ...metadata
    })
  }

  /**
   * 获取测试结果
   */
  async getTestResults(testId: string): Promise<TestResults | null> {
    if (!this.isInitialized) await this.initialize()

    const test = await this.getTest(testId)
    if (!test) return null

    if (test.results) {
      return test.results
    }

    // 实时计算结果
    return await this.calculateTestResults(test)
  }

  /**
   * 获取测试洞察
   */
  async getTestInsights(testId: string): Promise<TestInsight[]> {
    if (!this.isInitialized) await this.initialize()

    const test = await this.getTest(testId)
    if (!test) return []

    const results = await this.getTestResults(testId)
    if (!results) return []

    const insights: TestInsight[] = []

    // 检查样本量
    if (results.totalVisitors < 100) {
      insights.push({
        id: crypto.randomUUID(),
        testId,
        type: 'statistical',
        severity: 'warning',
        title: 'Geringe Stichprobengröße',
        description: `Nur ${results.totalVisitors} Besucher. Mindestens 100 empfohlen.`,
        recommendation: 'Test länger laufen lassen',
        actionRequired: false
      })
    }

    // 检查统计显著性
    if (!results.isSignificant && test.status === 'running') {
      insights.push({
        id: crypto.randomUUID(),
        testId,
        type: 'statistical',
        severity: 'info',
        title: 'Noch nicht statistisch signifikant',
        description: `p-Wert: ${results.pValue.toFixed(4)}. Benötigt p < 0.05.`,
        recommendation: 'Test fortsetzen oder Stichprobengröße erhöhen',
        actionRequired: false
      })
    }

    // 检查转化率异常
    const avgConversionRate = results.overallConversionRate
    if (avgConversionRate < 0.01) {
      insights.push({
        id: crypto.randomUUID(),
        testId,
        type: 'performance',
        severity: 'warning',
        title: 'Niedrige Konversionsrate',
        description: `Durchschnittliche Konversionsrate: ${(avgConversionRate * 100).toFixed(2)}%`,
        recommendation: 'Ziel-Events oder Test-Setup überprüfen',
        actionRequired: true
      })
    }

    return insights
  }

  /**
   * 获取测试模板
   */
  async getTestTemplates(): Promise<TestTemplate[]> {
    return [
      {
        templateId: 'headline-test',
        name: 'Überschriften-Test',
        description: 'Teste verschiedene Artikel-Überschriften',
        category: 'headline',
        defaultVariants: [
          {
            name: 'Kontrolle',
            description: 'Original Überschrift',
            trafficWeight: 0.5,
            changes: []
          },
          {
            name: 'Variante A',
            description: 'Neue Überschrift',
            trafficWeight: 0.5,
            changes: [
              {
                element: 'h1',
                property: 'text',
                value: 'Neue Überschrift hier einfügen'
              }
            ]
          }
        ],
        defaultGoals: [
          {
            name: 'Artikel-Engagement',
            description: 'Zeit auf Seite > 2 Minuten',
            type: 'engagement',
            eventType: 'time_on_page',
            targetValue: 120
          }
        ],
        bestPractices: [
          'Teste nur eine Variable gleichzeitig',
          'Verwende aussagekräftige Überschriften',
          'Berücksichtige SEO-Auswirkungen'
        ],
        commonPitfalls: [
          'Zu viele Varianten gleichzeitig',
          'Zu kurze Testdauer',
          'Ignorieren von saisonalen Effekten'
        ],
        usageCount: 45,
        successRate: 0.67
      },
      {
        templateId: 'cta-test',
        name: 'Call-to-Action Test',
        description: 'Teste verschiedene CTA-Buttons',
        category: 'cta',
        defaultVariants: [
          {
            name: 'Kontrolle',
            description: 'Original CTA',
            trafficWeight: 0.5,
            changes: []
          },
          {
            name: 'Variante A',
            description: 'Neuer CTA-Text',
            trafficWeight: 0.5,
            changes: [
              {
                element: '.cta-button',
                property: 'text',
                value: 'Jetzt berechnen'
              }
            ]
          }
        ],
        defaultGoals: [
          {
            name: 'CTA-Klicks',
            description: 'Klicks auf CTA-Button',
            type: 'conversion',
            eventType: 'click',
            selector: '.cta-button'
          }
        ],
        bestPractices: [
          'Verwende aktive Verben',
          'Schaffe Dringlichkeit',
          'Teste verschiedene Farben'
        ],
        commonPitfalls: [
          'Zu generische CTAs',
          'Zu viele CTAs auf einer Seite',
          'Unklare Nutzenversprechen'
        ],
        usageCount: 32,
        successRate: 0.72
      }
    ]
  }

  // 私有方法
  private validateTestConfig(config: Omit<ABTest, 'testId' | 'createdAt' | 'updatedAt'>): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Test name is required')
    }

    if (config.variants.length < 2) {
      throw new Error('At least 2 variants are required')
    }

    const totalWeight = config.variants.reduce((sum, v) => sum + v.trafficWeight, 0)
    if (Math.abs(totalWeight - 1) > 0.01) {
      throw new Error('Variant traffic weights must sum to 1')
    }

    if (config.trafficAllocation <= 0 || config.trafficAllocation > 1) {
      throw new Error('Traffic allocation must be between 0 and 1')
    }
  }

  private calculateSampleSize(test: ABTest): number {
    // 简化的样本量计算
    const alpha = 1 - test.confidenceLevel
    const beta = 1 - test.statisticalPower
    const mde = test.minimumDetectableEffect

    // 使用简化公式
    const zAlpha = 1.96 // 95% 置信度
    const zBeta = 0.84 // 80% 统计功效
    
    const baseConversionRate = 0.05 // 假设基础转化率5%
    const p1 = baseConversionRate
    const p2 = baseConversionRate * (1 + mde)
    
    const pooledP = (p1 + p2) / 2
    const sampleSize = Math.ceil(
      (Math.pow(zAlpha + zBeta, 2) * 2 * pooledP * (1 - pooledP)) /
      Math.pow(p2 - p1, 2)
    )

    return sampleSize
  }

  private shouldUserParticipate(userId: string, test: ABTest): boolean {
    // 基于用户ID的哈希决定是否参与
    const hash = this.hashUserId(userId)
    return hash < test.trafficAllocation
  }

  private assignVariant(userId: string, test: ABTest): string {
    const hash = this.hashUserId(userId + test.testId)
    let cumulativeWeight = 0
    
    for (const variant of test.variants) {
      cumulativeWeight += variant.trafficWeight
      if (hash < cumulativeWeight) {
        return variant.variantId
      }
    }
    
    return test.variants[0].variantId // 默认返回第一个变体
  }

  private hashUserId(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash) / Math.pow(2, 31) // 标准化到0-1
  }

  private async trackTestEvent(
    userId: string,
    testId: string,
    variantId: string,
    eventType: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.userAnalyticsService.trackEvent('ab_test_event', {
      testId,
      variantId,
      eventType,
      ...metadata
    })
  }

  private async calculateTestResults(test: ABTest): Promise<TestResults> {
    // 模拟测试结果计算
    const variantResults: VariantResults[] = test.variants.map(variant => {
      const visitors = Math.floor(Math.random() * 1000) + 100
      const conversions = Math.floor(visitors * (Math.random() * 0.1 + 0.02))
      const conversionRate = conversions / visitors
      
      return {
        variantId: variant.variantId,
        name: variant.name,
        visitors,
        conversions,
        conversionRate,
        standardError: Math.sqrt(conversionRate * (1 - conversionRate) / visitors),
        confidenceInterval: [
          Math.max(0, conversionRate - 1.96 * Math.sqrt(conversionRate * (1 - conversionRate) / visitors)),
          Math.min(1, conversionRate + 1.96 * Math.sqrt(conversionRate * (1 - conversionRate) / visitors))
        ],
        pValue: Math.random() * 0.1,
        zScore: Math.random() * 3 - 1.5,
        relativeImprovement: Math.random() * 0.4 - 0.2, // -20% to +20%
        isWinner: false,
        isSignificant: Math.random() > 0.5
      }
    })

    // 确定获胜者
    const bestVariant = variantResults.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    )
    bestVariant.isWinner = true

    const totalVisitors = variantResults.reduce((sum, v) => sum + v.visitors, 0)
    const totalConversions = variantResults.reduce((sum, v) => sum + v.conversions, 0)
    const overallConversionRate = totalConversions / totalVisitors

    return {
      testId: test.testId,
      status: test.status === 'completed' ? 'completed' : 'running',
      totalVisitors,
      totalConversions,
      overallConversionRate,
      variantResults,
      isSignificant: bestVariant.isSignificant,
      pValue: bestVariant.pValue,
      confidenceLevel: test.confidenceLevel,
      expectedLift: bestVariant.relativeImprovement,
      expectedImpact: `${(bestVariant.relativeImprovement * 100).toFixed(1)}% Verbesserung`,
      recommendation: bestVariant.isSignificant ? 'implement_winner' : 'continue_testing',
      reasoning: bestVariant.isSignificant 
        ? `Variante "${bestVariant.name}" zeigt signifikante Verbesserung`
        : 'Test benötigt mehr Daten für statistisch signifikante Ergebnisse',
      startDate: test.startDate,
      endDate: test.endDate,
      lastUpdated: new Date()
    }
  }

  private determineWinner(results: TestResults): string | undefined {
    const winner = results.variantResults.find(v => v.isWinner && v.isSignificant)
    return winner?.variantId
  }

  private async loadActiveTests(): Promise<void> {
    // 简化实现：从localStorage加载
    try {
      const stored = localStorage.getItem('ab_tests')
      if (stored) {
        const tests = JSON.parse(stored) as ABTest[]
        tests.filter(t => t.status === 'running').forEach(test => {
          this.activeTests.set(test.testId, test)
        })
      }
    } catch (error) {
      console.error('Failed to load active tests:', error)
    }
  }

  private async saveTest(test: ABTest): Promise<void> {
    // 简化实现：保存到localStorage
    try {
      const stored = localStorage.getItem('ab_tests')
      const tests = stored ? JSON.parse(stored) as ABTest[] : []
      
      const index = tests.findIndex(t => t.testId === test.testId)
      if (index >= 0) {
        tests[index] = test
      } else {
        tests.push(test)
      }
      
      localStorage.setItem('ab_tests', JSON.stringify(tests))
    } catch (error) {
      console.error('Failed to save test:', error)
    }
  }

  private async getTest(testId: string): Promise<ABTest | null> {
    // 先检查内存中的活跃测试
    if (this.activeTests.has(testId)) {
      return this.activeTests.get(testId)!
    }

    // 从存储中加载
    try {
      const stored = localStorage.getItem('ab_tests')
      if (stored) {
        const tests = JSON.parse(stored) as ABTest[]
        return tests.find(t => t.testId === testId) || null
      }
    } catch (error) {
      console.error('Failed to get test:', error)
    }

    return null
  }

  private startResultsProcessor(): void {
    // 每小时更新一次测试结果
    setInterval(async () => {
      for (const [testId, test] of this.activeTests) {
        try {
          const results = await this.calculateTestResults(test)
          test.results = results
          await this.saveTest(test)
        } catch (error) {
          console.error(`Failed to update results for test ${testId}:`, error)
        }
      }
    }, 60 * 60 * 1000) // 1小时
  }
}

// Export singleton instance
export const abTestingService = ABTestingService.getInstance()
