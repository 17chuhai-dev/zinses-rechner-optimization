/**
 * 税收配置服务
 * 实现税收参数的业务逻辑处理，包括实时验证、保存加载、默认值管理和导入导出功能
 */

import {
  TaxSettings,
  DEFAULT_TAX_SETTINGS,
  TaxCalculationParams,
  TaxCalculationResult,
  FreistellungsauftragAllocation,
  TaxOptimizationSuggestion,
  TaxRegulationUpdate,
  GermanState,
  ChurchTaxType,
  ETFType,
  CHURCH_TAX_RATES
} from '@/types/GermanTaxTypes'
import { validateTaxSettings, calculateAbgeltungssteuer } from '@/utils/germanTaxCalculations'

/**
 * 税收配置服务类
 */
export class TaxConfigurationService {
  private static instance: TaxConfigurationService
  private currentSettings: TaxSettings
  private settingsHistory: TaxSettings[] = []
  private changeCallbacks = new Map<string, (settings: TaxSettings) => void>()
  private validationCallbacks = new Map<string, (errors: string[]) => void>()

  constructor() {
    this.currentSettings = this.loadSettings()
    console.log('🏛️ 税收配置服务已初始化')
  }

  static getInstance(): TaxConfigurationService {
    if (!TaxConfigurationService.instance) {
      TaxConfigurationService.instance = new TaxConfigurationService()
    }
    return TaxConfigurationService.instance
  }

  /**
   * 获取当前税收设置
   */
  getCurrentSettings(): TaxSettings {
    return { ...this.currentSettings }
  }

  /**
   * 更新税收设置
   */
  updateSettings(newSettings: TaxSettings, skipValidation = false): boolean {
    // 验证设置
    if (!skipValidation) {
      const validation = this.validateSettings(newSettings)
      if (!validation.isValid) {
        this.triggerValidationCallbacks(validation.errors)
        return false
      }
    }

    // 保存当前设置到历史
    this.settingsHistory.push({ ...this.currentSettings })
    if (this.settingsHistory.length > 10) {
      this.settingsHistory = this.settingsHistory.slice(-10)
    }

    // 更新设置
    this.currentSettings = {
      ...newSettings,
      metadata: {
        ...newSettings.metadata,
        updatedAt: new Date(),
        lastUsed: new Date()
      }
    }

    // 保存到存储
    this.saveSettings()

    // 触发变更回调
    this.triggerChangeCallbacks()

    return true
  }

  /**
   * 实时验证税收参数
   */
  validateSettings(settings: TaxSettings): { isValid: boolean; errors: string[] } {
    const validation = validateTaxSettings(settings)
    
    // 额外的业务逻辑验证
    const businessErrors: string[] = []

    // 验证免税额度分配总和
    if (settings.freistellungsauftrag.enabled) {
      const totalAllocated = settings.freistellungsauftrag.allocations.reduce(
        (sum, allocation) => sum + allocation.allocatedAmount, 0
      )
      
      if (totalAllocated > settings.freistellungsauftrag.annualAllowance) {
        businessErrors.push(
          `Gesamte Freibetrag-Verteilung (${totalAllocated.toFixed(2)}€) überschreitet den jährlichen Freibetrag (${settings.freistellungsauftrag.annualAllowance}€)`
        )
      }
    }

    // 验证教会税设置一致性
    if (settings.abgeltungssteuer.calculation.includeChurchTax) {
      if (settings.userInfo.churchTaxType === ChurchTaxType.NONE) {
        businessErrors.push('Kirchensteuer kann nicht aktiviert werden, wenn keine Religionszugehörigkeit gewählt ist')
      }
      
      const expectedRate = CHURCH_TAX_RATES[settings.userInfo.state] || 0.09
      if (Math.abs(settings.abgeltungssteuer.churchTax.rate - expectedRate) > 0.001) {
        businessErrors.push(
          `Kirchensteuersatz (${(settings.abgeltungssteuer.churchTax.rate * 100).toFixed(1)}%) stimmt nicht mit dem Bundesland überein (erwartet: ${(expectedRate * 100).toFixed(1)}%)`
        )
      }
    }

    // 验证税收年度
    const currentYear = new Date().getFullYear()
    if (settings.userInfo.taxYear > currentYear + 1) {
      businessErrors.push(`Steuerjahr (${settings.userInfo.taxYear}) kann nicht mehr als ein Jahr in der Zukunft liegen`)
    }
    
    if (settings.userInfo.taxYear < currentYear - 10) {
      businessErrors.push(`Steuerjahr (${settings.userInfo.taxYear}) ist zu weit in der Vergangenheit`)
    }

    const allErrors = [...validation.errors, ...businessErrors]
    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    }
  }

  /**
   * 计算税收预览
   */
  calculateTaxPreview(income: number, etfType?: ETFType): TaxCalculationResult {
    const params: TaxCalculationParams = {
      income,
      incomeType: 'capital_gains' as any,
      etfType,
      jointFiling: this.currentSettings.userInfo.isMarried,
      deductions: 0,
      taxYear: this.currentSettings.userInfo.taxYear
    }

    return calculateAbgeltungssteuer(params, this.currentSettings)
  }

  /**
   * 优化免税额度分配
   */
  optimizeAllowanceAllocation(): FreistellungsauftragAllocation[] {
    const allocations = [...this.currentSettings.freistellungsauftrag.allocations]
    const totalAllowance = this.currentSettings.freistellungsauftrag.annualAllowance

    // 按预期收益率排序（这里简化为按已使用金额排序）
    allocations.sort((a, b) => {
      const aEfficiency = a.usedAmount / Math.max(a.allocatedAmount, 1)
      const bEfficiency = b.usedAmount / Math.max(b.allocatedAmount, 1)
      return bEfficiency - aEfficiency
    })

    // 重新分配额度
    let remainingAllowance = totalAllowance
    const optimizedAllocations: FreistellungsauftragAllocation[] = []

    for (const allocation of allocations) {
      if (remainingAllowance <= 0) break

      const optimalAmount = Math.min(
        allocation.usedAmount * 1.2, // 预留20%缓冲
        remainingAllowance
      )

      optimizedAllocations.push({
        ...allocation,
        allocatedAmount: Math.round(optimalAmount),
        remainingAmount: Math.round(optimalAmount - allocation.usedAmount),
        updatedAt: new Date()
      })

      remainingAllowance -= optimalAmount
    }

    return optimizedAllocations
  }

  /**
   * 获取税收优化建议
   */
  getTaxOptimizationSuggestions(annualIncome: number): TaxOptimizationSuggestion[] {
    const suggestions: TaxOptimizationSuggestion[] = []

    // 免税额度优化建议
    if (this.currentSettings.freistellungsauftrag.remainingAllowance > 0) {
      const potentialSavings = Math.min(annualIncome, this.currentSettings.freistellungsauftrag.remainingAllowance) * 0.26375 // 约26.375%总税率
      
      suggestions.push({
        id: 'optimize-allowance',
        type: 'allowance',
        title: 'Freistellungsauftrag optimieren',
        description: `Sie haben noch ${this.currentSettings.freistellungsauftrag.remainingAllowance.toFixed(2)}€ Freibetrag verfügbar. Nutzen Sie diesen optimal aus.`,
        potentialSavings,
        difficulty: 'easy',
        timeframe: 'Sofort umsetzbar',
        steps: [
          'Gehen Sie zu Ihrer Bank oder Ihrem Online-Broker',
          'Stellen Sie einen Freistellungsauftrag über den verfügbaren Betrag',
          'Verteilen Sie den Freibetrag auf Ihre ertragsstärksten Depots'
        ],
        risks: ['Keine wesentlichen Risiken'],
        applicableScenarios: ['Kapitalerträge über dem Freibetrag']
      })
    }

    // ETF Teilfreistellung Optimierung
    if (annualIncome > 1000 && this.currentSettings.etfTeilfreistellung.enabled) {
      const currentETFSavings = annualIncome * 0.30 * 0.26375 // 30% Teilfreistellung für Aktien-ETFs
      
      suggestions.push({
        id: 'optimize-etf-selection',
        type: 'etf_type',
        title: 'ETF-Auswahl steueroptimiert gestalten',
        description: 'Durch die Wahl steueroptimierter ETFs können Sie Ihre Steuerlast reduzieren.',
        potentialSavings: currentETFSavings,
        difficulty: 'medium',
        timeframe: '1-3 Monate',
        steps: [
          'Prüfen Sie Ihre aktuellen ETF-Investments',
          'Bevorzugen Sie Aktien-ETFs mit 30% Teilfreistellung',
          'Erwägen Sie Immobilien-ETFs mit 60% Teilfreistellung',
          'Vermeiden Sie Renten-ETFs ohne Teilfreistellung'
        ],
        risks: [
          'Änderung der Anlagestrategie erforderlich',
          'Mögliche Transaktionskosten beim Umschichten'
        ],
        applicableScenarios: ['Diversifiziertes ETF-Portfolio', 'Langfristige Anlagestrategie']
      })
    }

    // Kirchensteuer Optimierung
    if (this.currentSettings.abgeltungssteuer.calculation.includeChurchTax) {
      const churchTaxAmount = annualIncome * 0.25 * this.currentSettings.abgeltungssteuer.churchTax.rate
      
      if (churchTaxAmount > 200) {
        suggestions.push({
          id: 'church-tax-optimization',
          type: 'structure',
          title: 'Kirchensteuer-Optimierung prüfen',
          description: `Ihre jährliche Kirchensteuer beträgt ca. ${churchTaxAmount.toFixed(2)}€. Prüfen Sie Optimierungsmöglichkeiten.`,
          potentialSavings: churchTaxAmount,
          difficulty: 'hard',
          timeframe: 'Langfristig',
          steps: [
            'Informieren Sie sich über die Konsequenzen eines Kirchenaustritts',
            'Berücksichtigen Sie persönliche und familiäre Aspekte',
            'Konsultieren Sie einen Steuerberater',
            'Prüfen Sie alternative Spendenstrategien'
          ],
          risks: [
            'Verlust kirchlicher Dienstleistungen',
            'Soziale und familiäre Konsequenzen',
            'Mögliche Kirchensteuer bei späterem Wiedereintritt'
          ],
          applicableScenarios: ['Hohe Kapitalerträge', 'Steueroptimierung im Fokus']
        })
      }
    }

    // Timing-Optimierung
    if (annualIncome > 5000) {
      suggestions.push({
        id: 'timing-optimization',
        type: 'timing',
        title: 'Verkaufszeitpunkt optimieren',
        description: 'Durch geschicktes Timing von Verkäufen können Sie Steuern sparen.',
        potentialSavings: annualIncome * 0.05, // Geschätzte 5% Einsparung
        difficulty: 'medium',
        timeframe: 'Laufend',
        steps: [
          'Planen Sie Verkäufe über mehrere Jahre',
          'Nutzen Sie jährlich Ihren Freibetrag optimal aus',
          'Berücksichtigen Sie Verlustverrechnungsmöglichkeiten',
          'Prüfen Sie steuerliche Auswirkungen vor Verkäufen'
        ],
        risks: [
          'Marktrisiko bei verzögerten Verkäufen',
          'Komplexere Portfolioverwaltung erforderlich'
        ],
        applicableScenarios: ['Größere Portfolios', 'Regelmäßige Umschichtungen']
      })
    }

    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings)
  }

  /**
   * 应用默认设置
   */
  applyDefaultSettings(): void {
    const defaultSettings = { ...DEFAULT_TAX_SETTINGS }
    defaultSettings.metadata.createdAt = new Date()
    defaultSettings.metadata.updatedAt = new Date()
    
    this.updateSettings(defaultSettings, true)
  }

  /**
   * 重置为默认设置
   */
  resetToDefaults(): void {
    this.applyDefaultSettings()
    console.log('🔄 税收设置已重置为默认值')
  }

  /**
   * 导出设置
   */
  exportSettings(): string {
    const exportData = {
      settings: this.currentSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      application: 'Zinses Rechner'
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 导入设置
   */
  importSettings(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData)
      
      // 验证导入数据格式
      if (!importData.settings || !importData.version) {
        throw new Error('Ungültiges Datenformat')
      }
      
      // 版本兼容性检查
      if (importData.version !== '1.0.0') {
        console.warn('⚠️ 版本不匹配，尝试兼容性导入')
      }
      
      // 合并默认设置以确保完整性
      const importedSettings = this.mergeWithDefaults(importData.settings)
      
      // 验证并应用设置
      const validation = this.validateSettings(importedSettings)
      if (!validation.isValid) {
        throw new Error(`Importierte Einstellungen sind ungültig: ${validation.errors.join(', ')}`)
      }
      
      this.updateSettings(importedSettings)
      console.log('✅ 税收设置导入成功')
      return true
      
    } catch (error) {
      console.error('❌ 税收设置导入失败:', error)
      return false
    }
  }

  /**
   * 保存设置到本地存储
   */
  private saveSettings(): void {
    try {
      const settingsData = {
        settings: this.currentSettings,
        savedAt: new Date().toISOString()
      }
      
      localStorage.setItem('tax-settings', JSON.stringify(settingsData))
      console.log('💾 税收设置已保存到本地存储')
    } catch (error) {
      console.error('❌ 保存税收设置失败:', error)
    }
  }

  /**
   * 从本地存储加载设置
   */
  private loadSettings(): TaxSettings {
    try {
      const savedData = localStorage.getItem('tax-settings')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        const loadedSettings = this.mergeWithDefaults(parsedData.settings)
        
        // 验证加载的设置
        const validation = this.validateSettings(loadedSettings)
        if (validation.isValid) {
          console.log('📂 税收设置已从本地存储加载')
          return loadedSettings
        } else {
          console.warn('⚠️ 加载的设置无效，使用默认设置')
        }
      }
    } catch (error) {
      console.error('❌ 加载税收设置失败:', error)
    }
    
    return { ...DEFAULT_TAX_SETTINGS }
  }

  /**
   * 与默认设置合并
   */
  private mergeWithDefaults(settings: Partial<TaxSettings>): TaxSettings {
    return {
      ...DEFAULT_TAX_SETTINGS,
      ...settings,
      userInfo: {
        ...DEFAULT_TAX_SETTINGS.userInfo,
        ...settings.userInfo
      },
      abgeltungssteuer: {
        ...DEFAULT_TAX_SETTINGS.abgeltungssteuer,
        ...settings.abgeltungssteuer,
        calculation: {
          ...DEFAULT_TAX_SETTINGS.abgeltungssteuer.calculation,
          ...settings.abgeltungssteuer?.calculation
        },
        churchTax: {
          ...DEFAULT_TAX_SETTINGS.abgeltungssteuer.churchTax,
          ...settings.abgeltungssteuer?.churchTax
        }
      },
      freistellungsauftrag: {
        ...DEFAULT_TAX_SETTINGS.freistellungsauftrag,
        ...settings.freistellungsauftrag,
        options: {
          ...DEFAULT_TAX_SETTINGS.freistellungsauftrag.options,
          ...settings.freistellungsauftrag?.options
        }
      },
      etfTeilfreistellung: {
        ...DEFAULT_TAX_SETTINGS.etfTeilfreistellung,
        ...settings.etfTeilfreistellung,
        exemptionRates: {
          ...DEFAULT_TAX_SETTINGS.etfTeilfreistellung.exemptionRates,
          ...settings.etfTeilfreistellung?.exemptionRates
        },
        options: {
          ...DEFAULT_TAX_SETTINGS.etfTeilfreistellung.options,
          ...settings.etfTeilfreistellung?.options
        }
      },
      advanced: {
        ...DEFAULT_TAX_SETTINGS.advanced,
        ...settings.advanced
      },
      metadata: {
        ...DEFAULT_TAX_SETTINGS.metadata,
        ...settings.metadata
      }
    }
  }

  /**
   * 注册设置变更回调
   */
  onSettingsChange(key: string, callback: (settings: TaxSettings) => void): void {
    this.changeCallbacks.set(key, callback)
  }

  /**
   * 注销设置变更回调
   */
  offSettingsChange(key: string): void {
    this.changeCallbacks.delete(key)
  }

  /**
   * 注册验证错误回调
   */
  onValidationError(key: string, callback: (errors: string[]) => void): void {
    this.validationCallbacks.set(key, callback)
  }

  /**
   * 注销验证错误回调
   */
  offValidationError(key: string): void {
    this.validationCallbacks.delete(key)
  }

  /**
   * 触发设置变更回调
   */
  private triggerChangeCallbacks(): void {
    this.changeCallbacks.forEach(callback => {
      try {
        callback(this.currentSettings)
      } catch (error) {
        console.error('设置变更回调执行失败:', error)
      }
    })
  }

  /**
   * 触发验证错误回调
   */
  private triggerValidationCallbacks(errors: string[]): void {
    this.validationCallbacks.forEach(callback => {
      try {
        callback(errors)
      } catch (error) {
        console.error('验证错误回调执行失败:', error)
      }
    })
  }

  /**
   * 获取设置历史
   */
  getSettingsHistory(): TaxSettings[] {
    return [...this.settingsHistory]
  }

  /**
   * 恢复到历史设置
   */
  restoreFromHistory(index: number): boolean {
    if (index >= 0 && index < this.settingsHistory.length) {
      const historicalSettings = this.settingsHistory[index]
      return this.updateSettings(historicalSettings)
    }
    return false
  }
}

// 导出单例实例
export const taxConfigurationService = TaxConfigurationService.getInstance()
