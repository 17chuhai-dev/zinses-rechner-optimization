/**
 * 计算器注册和管理系统
 * 支持动态注册、发现和管理多种计算器类型
 */

import type {
  BaseCalculator,
  CalculatorCategory,
  ValidationResult,
  CalculationResult
} from '@/types/calculator'

export class CalculatorRegistry {
  private static instance: CalculatorRegistry
  private calculators = new Map<string, BaseCalculator>()
  private categories = new Map<CalculatorCategory, BaseCalculator[]>()

  private constructor() {}

  static getInstance(): CalculatorRegistry {
    if (!CalculatorRegistry.instance) {
      CalculatorRegistry.instance = new CalculatorRegistry()
    }
    return CalculatorRegistry.instance
  }

  /**
   * 注册计算器
   */
  register(calculator: BaseCalculator): void {
    // 验证计算器配置
    this.validateCalculator(calculator)

    // 注册到主映射
    this.calculators.set(calculator.id, calculator)

    // 注册到分类映射
    if (!this.categories.has(calculator.category)) {
      this.categories.set(calculator.category, [])
    }
    this.categories.get(calculator.category)!.push(calculator)

    console.log(`✅ 计算器已注册: ${calculator.name} (${calculator.id})`)
  }

  /**
   * 获取计算器
   */
  getCalculator(id: string): BaseCalculator | undefined {
    return this.calculators.get(id)
  }

  /**
   * 获取所有计算器
   */
  getAllCalculators(): BaseCalculator[] {
    return Array.from(this.calculators.values())
  }

  /**
   * 按分类获取计算器
   */
  getCalculatorsByCategory(category: CalculatorCategory): BaseCalculator[] {
    return this.categories.get(category) || []
  }

  /**
   * 获取所有分类
   */
  getCategories(): CalculatorCategory[] {
    return Array.from(this.categories.keys())
  }

  /**
   * 搜索计算器
   */
  searchCalculators(query: string): BaseCalculator[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllCalculators().filter(calc =>
      calc.name.toLowerCase().includes(lowerQuery) ||
      calc.description.toLowerCase().includes(lowerQuery) ||
      calc.id.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * 验证计算器配置
   */
  private validateCalculator(calculator: BaseCalculator): void {
    if (!calculator.id) {
      throw new Error('计算器必须有唯一ID')
    }

    if (this.calculators.has(calculator.id)) {
      throw new Error(`计算器ID已存在: ${calculator.id}`)
    }

    if (!calculator.name) {
      throw new Error('计算器必须有名称')
    }

    if (!calculator.formSchema || !calculator.formSchema.fields) {
      throw new Error('计算器必须有表单配置')
    }

    if (!calculator.resultConfig) {
      throw new Error('计算器必须有结果显示配置')
    }

    if (typeof calculator.calculate !== 'function') {
      throw new Error('计算器必须实现calculate方法')
    }

    if (typeof calculator.validate !== 'function') {
      throw new Error('计算器必须实现validate方法')
    }
  }

  /**
   * 注销计算器
   */
  unregister(id: string): boolean {
    const calculator = this.calculators.get(id)
    if (!calculator) {
      return false
    }

    // 从主映射中移除
    this.calculators.delete(id)

    // 从分类映射中移除
    const categoryCalculators = this.categories.get(calculator.category)
    if (categoryCalculators) {
      const index = categoryCalculators.findIndex(calc => calc.id === id)
      if (index > -1) {
        categoryCalculators.splice(index, 1)
      }
    }

    console.log(`❌ 计算器已注销: ${calculator.name} (${id})`)
    return true
  }

  /**
   * 清空所有注册的计算器
   */
  clear(): void {
    this.calculators.clear()
    this.categories.clear()
    console.log('🧹 所有计算器已清空')
  }

  /**
   * 获取注册统计信息
   */
  getStats(): RegistryStats {
    const stats: RegistryStats = {
      totalCalculators: this.calculators.size,
      categoriesCount: this.categories.size,
      categories: {
        'compound-interest': 0,
        'loan': 0,
        'mortgage': 0,
        'retirement': 0,
        'investment': 0,
        'tax': 0,
        'insurance': 0,
        'comparison': 0,
        'analysis': 0
      }
    }

    for (const [category, calculators] of this.categories) {
      stats.categories[category] = calculators.length
    }

    return stats
  }
}

export interface RegistryStats {
  totalCalculators: number
  categoriesCount: number
  categories: Record<CalculatorCategory, number>
}

// 导出单例实例 - 直接导出但延迟初始化内部实例
export const calculatorRegistry = CalculatorRegistry.getInstance()

/**
 * 计算器装饰器 - 用于自动注册计算器
 */
export function RegisterCalculator(calculator: BaseCalculator) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // 在类实例化时自动注册计算器
    calculatorRegistry.register(calculator)
    return constructor
  }
}

/**
 * 计算器工厂函数
 */
export function createCalculator(
  config: Partial<BaseCalculator> & {
    id: string
    name: string
    category: CalculatorCategory
  }
): BaseCalculator {
  const defaultConfig: Partial<BaseCalculator> = {
    version: '1.0.0',
    description: '',
    formSchema: { fields: [] },
    resultConfig: { primaryMetrics: [] },

    // 默认验证方法
    validate: (input: Record<string, any>): ValidationResult => {
      return { isValid: true, errors: [] }
    },

    // 默认计算方法（需要被重写）
    calculate: async (input: Record<string, any>): Promise<CalculationResult> => {
      throw new Error('计算方法未实现')
    }
  }

  return { ...defaultConfig, ...config } as BaseCalculator
}
