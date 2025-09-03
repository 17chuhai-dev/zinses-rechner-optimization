/**
 * 防抖策略配置管理器
 * 为不同计算器提供差异化的防抖策略配置和动态调整能力
 */

import { ref, reactive, computed } from 'vue'

// 防抖策略配置接口
export interface DebounceStrategy {
  delay: number                    // 防抖延迟时间(ms)
  priority: 'high' | 'medium' | 'low'  // 优先级
  maxDelay?: number               // 最大延迟时间
  minDelay?: number               // 最小延迟时间
  adaptiveEnabled?: boolean       // 是否启用自适应调整
  description?: string            // 策略描述
}

// 动态调整参数
export interface AdaptiveParams {
  inputFrequency: number          // 输入频率 (次/秒)
  pauseDuration: number           // 停顿时间 (ms)
  calculationComplexity: number   // 计算复杂度 (1-10)
  userExperience: number          // 用户体验评分 (1-5)
}

// 策略统计信息
export interface StrategyStats {
  totalTriggers: number           // 总触发次数
  totalCancellations: number      // 总取消次数
  averageDelay: number            // 平均延迟时间
  adaptiveAdjustments: number     // 自适应调整次数
  lastUsed: Date                  // 最后使用时间
  effectivenessScore: number      // 有效性评分
}

// 默认防抖策略配置
export const DEFAULT_DEBOUNCE_STRATEGIES: Record<string, DebounceStrategy> = {
  'compound-interest': {
    delay: 500,
    priority: 'high',
    minDelay: 300,
    maxDelay: 800,
    adaptiveEnabled: true,
    description: '复利计算 - 高优先级，快速响应'
  },
  'savings-plan': {
    delay: 500,
    priority: 'high',
    minDelay: 300,
    maxDelay: 800,
    adaptiveEnabled: true,
    description: '储蓄计划 - 高优先级，快速响应'
  },
  'loan': {
    delay: 600,
    priority: 'medium',
    minDelay: 400,
    maxDelay: 1000,
    adaptiveEnabled: true,
    description: '贷款计算 - 中等优先级'
  },
  'mortgage': {
    delay: 700,
    priority: 'medium',
    minDelay: 500,
    maxDelay: 1200,
    adaptiveEnabled: true,
    description: '抵押贷款 - 中等优先级，复杂计算'
  },
  'retirement': {
    delay: 800,
    priority: 'low',
    minDelay: 600,
    maxDelay: 1500,
    adaptiveEnabled: true,
    description: '退休规划 - 低优先级，复杂计算'
  },
  'portfolio': {
    delay: 900,
    priority: 'low',
    minDelay: 700,
    maxDelay: 1800,
    adaptiveEnabled: true,
    description: '投资组合 - 低优先级，最复杂计算'
  },
  'tax-optimization': {
    delay: 1000,
    priority: 'low',
    minDelay: 800,
    maxDelay: 2000,
    adaptiveEnabled: true,
    description: '税务优化 - 低优先级，最复杂计算'
  },
  'etf-savings-plan': {
    delay: 600,
    priority: 'medium',
    minDelay: 400,
    maxDelay: 1000,
    adaptiveEnabled: true,
    description: 'ETF储蓄计划 - 中等优先级'
  }
}

/**
 * 防抖策略管理器类
 */
export class DebounceStrategyManager {
  private static instance: DebounceStrategyManager
  
  // 策略配置
  private strategies = reactive<Record<string, DebounceStrategy>>({ ...DEFAULT_DEBOUNCE_STRATEGIES })
  
  // 策略统计
  private stats = reactive<Record<string, StrategyStats>>({})
  
  // 全局配置
  private globalConfig = ref({
    adaptiveEnabled: true,          // 全局自适应开关
    performanceMode: false,         // 性能模式
    debugMode: false,               // 调试模式
    maxConcurrentCalculations: 3    // 最大并发计算数
  })

  private constructor() {
    this.initializeStats()
    console.log('🎯 防抖策略管理器已初始化')
  }

  static getInstance(): DebounceStrategyManager {
    if (!DebounceStrategyManager.instance) {
      DebounceStrategyManager.instance = new DebounceStrategyManager()
    }
    return DebounceStrategyManager.instance
  }

  /**
   * 初始化统计数据
   */
  private initializeStats(): void {
    Object.keys(this.strategies).forEach(calculatorId => {
      this.stats[calculatorId] = {
        totalTriggers: 0,
        totalCancellations: 0,
        averageDelay: this.strategies[calculatorId].delay,
        adaptiveAdjustments: 0,
        lastUsed: new Date(),
        effectivenessScore: 5.0
      }
    })
  }

  /**
   * 获取计算器的防抖策略
   */
  getStrategy(calculatorId: string): DebounceStrategy {
    const strategy = this.strategies[calculatorId]
    if (!strategy) {
      console.warn(`⚠️ 未找到计算器 ${calculatorId} 的防抖策略，使用默认策略`)
      return {
        delay: 800,
        priority: 'medium',
        minDelay: 500,
        maxDelay: 1500,
        adaptiveEnabled: false,
        description: '默认策略'
      }
    }
    return { ...strategy }
  }

  /**
   * 更新计算器的防抖策略
   */
  updateStrategy(calculatorId: string, updates: Partial<DebounceStrategy>): void {
    if (!this.strategies[calculatorId]) {
      console.error(`❌ 计算器 ${calculatorId} 不存在`)
      return
    }

    const oldStrategy = { ...this.strategies[calculatorId] }
    this.strategies[calculatorId] = { ...oldStrategy, ...updates }
    
    console.log(`🔄 更新防抖策略: ${calculatorId}`, {
      old: oldStrategy.delay,
      new: this.strategies[calculatorId].delay
    })
  }

  /**
   * 动态调整防抖延迟
   */
  adaptDelay(calculatorId: string, params: AdaptiveParams): number {
    const strategy = this.strategies[calculatorId]
    if (!strategy || !strategy.adaptiveEnabled) {
      return strategy?.delay || 800
    }

    const stats = this.stats[calculatorId]
    let adjustedDelay = strategy.delay

    // 基于输入频率调整
    if (params.inputFrequency > 2) {
      // 高频输入，增加延迟
      adjustedDelay = Math.min(adjustedDelay * 1.2, strategy.maxDelay || 2000)
    } else if (params.inputFrequency < 0.5) {
      // 低频输入，减少延迟
      adjustedDelay = Math.max(adjustedDelay * 0.8, strategy.minDelay || 200)
    }

    // 基于停顿时间调整
    if (params.pauseDuration > 2000) {
      // 长时间停顿，用户可能在思考，减少延迟
      adjustedDelay = Math.max(adjustedDelay * 0.9, strategy.minDelay || 200)
    }

    // 基于计算复杂度调整
    const complexityFactor = params.calculationComplexity / 5
    adjustedDelay = adjustedDelay * (0.8 + complexityFactor * 0.4)

    // 基于用户体验评分调整
    if (params.userExperience < 3) {
      // 用户体验差，减少延迟
      adjustedDelay = Math.max(adjustedDelay * 0.85, strategy.minDelay || 200)
    }

    // 确保在合理范围内
    adjustedDelay = Math.max(
      strategy.minDelay || 200,
      Math.min(adjustedDelay, strategy.maxDelay || 2000)
    )

    // 更新统计
    if (Math.abs(adjustedDelay - strategy.delay) > 50) {
      stats.adaptiveAdjustments++
      stats.averageDelay = (stats.averageDelay + adjustedDelay) / 2
    }

    if (this.globalConfig.value.debugMode) {
      console.log(`🎯 自适应调整: ${calculatorId}`, {
        original: strategy.delay,
        adjusted: Math.round(adjustedDelay),
        params
      })
    }

    return Math.round(adjustedDelay)
  }

  /**
   * 记录防抖触发
   */
  recordTrigger(calculatorId: string): void {
    const stats = this.stats[calculatorId]
    if (stats) {
      stats.totalTriggers++
      stats.lastUsed = new Date()
    }
  }

  /**
   * 记录防抖取消
   */
  recordCancellation(calculatorId: string): void {
    const stats = this.stats[calculatorId]
    if (stats) {
      stats.totalCancellations++
    }
  }

  /**
   * 获取策略统计信息
   */
  getStats(calculatorId?: string): Record<string, StrategyStats> | StrategyStats {
    if (calculatorId) {
      return this.stats[calculatorId] || {
        totalTriggers: 0,
        totalCancellations: 0,
        averageDelay: 800,
        adaptiveAdjustments: 0,
        lastUsed: new Date(),
        effectivenessScore: 5.0
      }
    }
    return { ...this.stats }
  }

  /**
   * 获取所有支持的计算器ID
   */
  getSupportedCalculators(): string[] {
    return Object.keys(this.strategies)
  }

  /**
   * 获取按优先级排序的计算器列表
   */
  getCalculatorsByPriority(): { high: string[], medium: string[], low: string[] } {
    const result = { high: [] as string[], medium: [] as string[], low: [] as string[] }
    
    Object.entries(this.strategies).forEach(([calculatorId, strategy]) => {
      result[strategy.priority].push(calculatorId)
    })
    
    return result
  }

  /**
   * 重置策略为默认值
   */
  resetToDefaults(): void {
    Object.assign(this.strategies, DEFAULT_DEBOUNCE_STRATEGIES)
    this.initializeStats()
    console.log('🔄 防抖策略已重置为默认值')
  }

  /**
   * 导出策略配置
   */
  exportConfig(): string {
    return JSON.stringify({
      strategies: this.strategies,
      stats: this.stats,
      globalConfig: this.globalConfig.value,
      timestamp: new Date().toISOString()
    }, null, 2)
  }

  /**
   * 导入策略配置
   */
  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson)
      
      if (config.strategies) {
        Object.assign(this.strategies, config.strategies)
      }
      
      if (config.stats) {
        Object.assign(this.stats, config.stats)
      }
      
      if (config.globalConfig) {
        Object.assign(this.globalConfig.value, config.globalConfig)
      }
      
      console.log('✅ 防抖策略配置导入成功')
      return true
    } catch (error) {
      console.error('❌ 防抖策略配置导入失败:', error)
      return false
    }
  }

  /**
   * 获取全局配置
   */
  getGlobalConfig() {
    return this.globalConfig
  }

  /**
   * 更新全局配置
   */
  updateGlobalConfig(updates: Partial<typeof this.globalConfig.value>): void {
    Object.assign(this.globalConfig.value, updates)
    console.log('🔄 全局配置已更新:', updates)
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): any {
    const totalTriggers = Object.values(this.stats).reduce((sum, stat) => sum + stat.totalTriggers, 0)
    const totalCancellations = Object.values(this.stats).reduce((sum, stat) => sum + stat.totalCancellations, 0)
    const averageEffectiveness = Object.values(this.stats).reduce((sum, stat) => sum + stat.effectivenessScore, 0) / Object.keys(this.stats).length

    return {
      totalTriggers,
      totalCancellations,
      cancellationRate: totalTriggers > 0 ? (totalCancellations / totalTriggers) * 100 : 0,
      averageEffectiveness,
      strategiesCount: Object.keys(this.strategies).length,
      adaptiveStrategiesCount: Object.values(this.strategies).filter(s => s.adaptiveEnabled).length,
      lastActivity: Math.max(...Object.values(this.stats).map(s => s.lastUsed.getTime()))
    }
  }
}

// 导出单例实例
export const debounceStrategyManager = DebounceStrategyManager.getInstance()
