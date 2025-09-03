/**
 * Freistellungsauftrag服务
 * 处理德国免税额度的复杂计算和管理逻辑
 */

import type { 
  FreistellungsauftragAllocation,
  FreistellungsauftragOptimization,
  FreistellungsauftragReport,
  InvestmentAccount
} from '@/types/FreistellungsauftragTypes'

// 免税额度常量
export const FREISTELLUNGSAUFTRAG_CONSTANTS = {
  // 2023年起的免税额度
  SINGLE_ALLOWANCE: 1000,
  MARRIED_ALLOWANCE: 2000,
  
  // 历史免税额度（用于历史计算）
  HISTORICAL_ALLOWANCES: {
    2022: { single: 801, married: 1602 },
    2023: { single: 1000, married: 2000 }
  },
  
  // 税率
  TAX_RATE: 0.25, // Abgeltungssteuer
  SOLI_RATE: 0.055, // Solidaritätszuschlag
  
  // 银行类型权重（用于优化分配）
  BANK_TYPE_WEIGHTS: {
    'major': 1.0,      // 大银行
    'online': 0.9,     // 在线银行
    'regional': 0.8,   // 地区银行
    'cooperative': 0.7 // 合作银行
  }
} as const

/**
 * Freistellungsauftrag服务类
 */
export class FreistellungsauftragService {
  private allocations: FreistellungsauftragAllocation[] = []
  private isMarried: boolean = false
  private currentYear: number = new Date().getFullYear()

  constructor(isMarried: boolean = false, currentYear?: number) {
    this.isMarried = isMarried
    this.currentYear = currentYear || new Date().getFullYear()
  }

  /**
   * 获取当前年度的总免税额度
   */
  getTotalAllowance(): number {
    const allowances = FREISTELLUNGSAUFTRAG_CONSTANTS.HISTORICAL_ALLOWANCES[this.currentYear as keyof typeof FREISTELLUNGSAUFTRAG_CONSTANTS.HISTORICAL_ALLOWANCES]
    
    if (allowances) {
      return this.isMarried ? allowances.married : allowances.single
    }
    
    // 默认使用最新的额度
    return this.isMarried 
      ? FREISTELLUNGSAUFTRAG_CONSTANTS.MARRIED_ALLOWANCE 
      : FREISTELLUNGSAUFTRAG_CONSTANTS.SINGLE_ALLOWANCE
  }

  /**
   * 设置分配列表
   */
  setAllocations(allocations: FreistellungsauftragAllocation[]): void {
    this.allocations = [...allocations]
  }

  /**
   * 添加新的分配
   */
  addAllocation(allocation: Omit<FreistellungsauftragAllocation, 'id' | 'createdAt' | 'updatedAt'>): FreistellungsauftragAllocation {
    const newAllocation: FreistellungsauftragAllocation = {
      ...allocation,
      id: `allocation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.allocations.push(newAllocation)
    return newAllocation
  }

  /**
   * 更新分配
   */
  updateAllocation(id: string, updates: Partial<FreistellungsauftragAllocation>): boolean {
    const index = this.allocations.findIndex(a => a.id === id)
    if (index === -1) return false
    
    this.allocations[index] = {
      ...this.allocations[index],
      ...updates,
      updatedAt: new Date()
    }
    
    return true
  }

  /**
   * 删除分配
   */
  removeAllocation(id: string): boolean {
    const initialLength = this.allocations.length
    this.allocations = this.allocations.filter(a => a.id !== id)
    return this.allocations.length < initialLength
  }

  /**
   * 计算总的已使用金额
   */
  getTotalUsed(): number {
    return this.allocations.reduce((sum, allocation) => sum + allocation.used, 0)
  }

  /**
   * 计算总的已分配金额
   */
  getTotalAllocated(): number {
    return this.allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
  }

  /**
   * 计算剩余可用金额
   */
  getRemainingAmount(): number {
    return Math.max(0, this.getTotalAllowance() - this.getTotalUsed())
  }

  /**
   * 计算使用率
   */
  getUsagePercentage(): number {
    const total = this.getTotalAllowance()
    return total > 0 ? (this.getTotalUsed() / total) * 100 : 0
  }

  /**
   * 验证分配是否有效
   */
  validateAllocation(allocation: Partial<FreistellungsauftragAllocation>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    // 检查金额
    if (!allocation.amount || allocation.amount <= 0) {
      errors.push('分配金额必须大于0')
    }
    
    if (allocation.used && allocation.used < 0) {
      errors.push('已使用金额不能为负数')
    }
    
    if (allocation.used && allocation.amount && allocation.used > allocation.amount) {
      errors.push('已使用金额不能超过分配金额')
    }
    
    // 检查总分配是否超限
    const currentTotalAllocated = this.getTotalAllocated()
    const newAmount = allocation.amount || 0
    const totalAllowance = this.getTotalAllowance()
    
    if (currentTotalAllocated + newAmount > totalAllowance) {
      errors.push(`总分配金额不能超过免税额度 ${totalAllowance}€`)
    }
    
    // 检查银行名称
    if (!allocation.bankName || allocation.bankName.trim().length === 0) {
      errors.push('银行名称不能为空')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 优化分配建议
   */
  generateOptimizationSuggestions(): FreistellungsauftragOptimization[] {
    const suggestions: FreistellungsauftragOptimization[] = []
    const totalAllowance = this.getTotalAllowance()
    const totalUsed = this.getTotalUsed()
    const totalAllocated = this.getTotalAllocated()
    const usagePercentage = this.getUsagePercentage()
    
    // 建议1: 未充分利用
    if (usagePercentage < 50) {
      suggestions.push({
        type: 'underutilized',
        title: 'Freibetrag besser nutzen',
        description: `Sie nutzen nur ${usagePercentage.toFixed(1)}% Ihres Freibetrags. Erwägen Sie zusätzliche Investitionen.`,
        potentialSavings: (totalAllowance - totalUsed) * FREISTELLUNGSAUFTRAG_CONSTANTS.TAX_RATE,
        priority: 1,
        action: 'increase_investments'
      })
    }
    
    // 建议2: 过度分配
    if (totalAllocated > totalAllowance) {
      const overAllocation = totalAllocated - totalAllowance
      suggestions.push({
        type: 'over_allocated',
        title: 'Überzuteilung korrigieren',
        description: `Sie haben ${overAllocation}€ mehr zugeteilt als verfügbar. Reduzieren Sie die Zuteilungen.`,
        potentialSavings: 0,
        priority: 1,
        action: 'reduce_allocations'
      })
    }
    
    // 建议3: 不平衡的分配
    const allocationsWithHighUsage = this.allocations.filter(a => (a.used / a.amount) > 0.8)
    const allocationsWithLowUsage = this.allocations.filter(a => (a.used / a.amount) < 0.2)
    
    if (allocationsWithHighUsage.length > 0 && allocationsWithLowUsage.length > 0) {
      suggestions.push({
        type: 'rebalance',
        title: 'Zuteilungen ausbalancieren',
        description: 'Einige Zuteilungen sind fast ausgeschöpft, während andere kaum genutzt werden.',
        potentialSavings: 0,
        priority: 2,
        action: 'rebalance_allocations'
      })
    }
    
    // 建议4: 年末优化
    const currentMonth = new Date().getMonth()
    if (currentMonth >= 10 && usagePercentage < 90) { // November/December
      suggestions.push({
        type: 'year_end',
        title: 'Jahresende-Optimierung',
        description: 'Nutzen Sie Ihren Freibetrag vor Jahresende vollständig aus.',
        potentialSavings: (totalAllowance - totalUsed) * FREISTELLUNGSAUFTRAG_CONSTANTS.TAX_RATE,
        priority: 1,
        action: 'year_end_optimization'
      })
    }
    
    return suggestions.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 智能分配优化
   */
  optimizeAllocations(accounts: InvestmentAccount[]): FreistellungsauftragAllocation[] {
    const totalAllowance = this.getTotalAllowance()
    let remainingAllowance = totalAllowance
    
    // 按预期收益率排序（高收益优先）
    const sortedAccounts = accounts.sort((a, b) => b.expectedReturn - a.expectedReturn)
    
    const optimizedAllocations: FreistellungsauftragAllocation[] = []
    
    for (const account of sortedAccounts) {
      if (remainingAllowance <= 0) break
      
      // 计算建议分配金额
      const suggestedAmount = Math.min(
        account.expectedGains,
        remainingAllowance,
        Math.floor(remainingAllowance * 0.3) // 最多分配30%给单个账户
      )
      
      if (suggestedAmount > 0) {
        optimizedAllocations.push({
          id: `optimized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          bankName: account.bankName,
          accountType: account.accountType,
          amount: suggestedAmount,
          used: 0,
          notes: `Optimiert basierend auf erwarteter Rendite von ${account.expectedReturn}%`,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        
        remainingAllowance -= suggestedAmount
      }
    }
    
    return optimizedAllocations
  }

  /**
   * 生成年度报告
   */
  generateAnnualReport(): FreistellungsauftragReport {
    const totalAllowance = this.getTotalAllowance()
    const totalUsed = this.getTotalUsed()
    const totalAllocated = this.getTotalAllocated()
    const taxSavings = totalUsed * FREISTELLUNGSAUFTRAG_CONSTANTS.TAX_RATE
    
    // 按银行分组统计
    const bankStats = this.allocations.reduce((stats, allocation) => {
      if (!stats[allocation.bankName]) {
        stats[allocation.bankName] = {
          allocated: 0,
          used: 0,
          accounts: 0
        }
      }
      
      stats[allocation.bankName].allocated += allocation.amount
      stats[allocation.bankName].used += allocation.used
      stats[allocation.bankName].accounts += 1
      
      return stats
    }, {} as Record<string, { allocated: number; used: number; accounts: number }>)
    
    // 按账户类型分组统计
    const accountTypeStats = this.allocations.reduce((stats, allocation) => {
      if (!stats[allocation.accountType]) {
        stats[allocation.accountType] = {
          allocated: 0,
          used: 0,
          count: 0
        }
      }
      
      stats[allocation.accountType].allocated += allocation.amount
      stats[allocation.accountType].used += allocation.used
      stats[allocation.accountType].count += 1
      
      return stats
    }, {} as Record<string, { allocated: number; used: number; count: number }>)
    
    return {
      year: this.currentYear,
      isMarried: this.isMarried,
      totalAllowance,
      totalAllocated,
      totalUsed,
      remainingAmount: totalAllowance - totalUsed,
      usagePercentage: (totalUsed / totalAllowance) * 100,
      taxSavings,
      potentialAdditionalSavings: (totalAllowance - totalUsed) * FREISTELLUNGSAUFTRAG_CONSTANTS.TAX_RATE,
      bankStats,
      accountTypeStats,
      allocations: [...this.allocations],
      optimizationSuggestions: this.generateOptimizationSuggestions(),
      generatedAt: new Date()
    }
  }

  /**
   * 导出数据
   */
  exportData(): {
    metadata: {
      exportDate: Date
      year: number
      isMarried: boolean
      totalAllowance: number
    }
    allocations: FreistellungsauftragAllocation[]
    summary: {
      totalAllocated: number
      totalUsed: number
      remainingAmount: number
      usagePercentage: number
      taxSavings: number
    }
  } {
    return {
      metadata: {
        exportDate: new Date(),
        year: this.currentYear,
        isMarried: this.isMarried,
        totalAllowance: this.getTotalAllowance()
      },
      allocations: [...this.allocations],
      summary: {
        totalAllocated: this.getTotalAllocated(),
        totalUsed: this.getTotalUsed(),
        remainingAmount: this.getRemainingAmount(),
        usagePercentage: this.getUsagePercentage(),
        taxSavings: this.getTotalUsed() * FREISTELLUNGSAUFTRAG_CONSTANTS.TAX_RATE
      }
    }
  }

  /**
   * 导入数据
   */
  importData(data: ReturnType<FreistellungsauftragService['exportData']>): boolean {
    try {
      this.isMarried = data.metadata.isMarried
      this.currentYear = data.metadata.year
      this.allocations = data.allocations.map(allocation => ({
        ...allocation,
        createdAt: new Date(allocation.createdAt),
        updatedAt: new Date(allocation.updatedAt)
      }))
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }
}
