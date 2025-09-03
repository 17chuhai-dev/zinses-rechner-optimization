/**
 * 德国税收计算引擎
 * 实现Abgeltungssteuer（资本利得税）和相关税收的精确计算
 */

import type { 
  GermanTaxConfiguration, 
  TaxCalculationResult, 
  AbgeltungssteuerCalculation,
  FreistellungsauftragAllocation,
  ETFTeilfreistellungData
} from '@/types/GermanTaxTypes'

// 德国税收常量
export const GERMAN_TAX_CONSTANTS = {
  // Abgeltungssteuer（资本利得税）
  ABGELTUNGSSTEUER_RATE: 0.25, // 25%
  
  // Solidaritätszuschlag（团结税）
  SOLIDARITAETSZUSCHLAG_RATE: 0.055, // 5.5% of Abgeltungssteuer
  SOLIDARITAETSZUSCHLAG_THRESHOLD: 972, // 免征额度（年度）
  
  // Freistellungsauftrag（免税额度）
  FREISTELLUNGSAUFTRAG_SINGLE: 1000, // 单身免税额度（2023年起）
  FREISTELLUNGSAUFTRAG_MARRIED: 2000, // 夫妻免税额度（2023年起）
  
  // ETF Teilfreistellung（ETF部分免税）
  ETF_TEILFREISTELLUNG_RATES: {
    EQUITY_ETF: 0.30, // 股票ETF 30%免税
    MIXED_ETF: 0.15,  // 混合ETF 15%免税
    BOND_ETF: 0.00,   // 债券ETF 0%免税
    REIT_ETF: 0.60,   // REIT ETF 60%免税
    COMMODITY_ETF: 0.00 // 商品ETF 0%免税
  },
  
  // 教会税税率（按联邦州）
  CHURCH_TAX_RATES: {
    'Baden-Württemberg': 0.08,
    'Bayern': 0.08,
    'Berlin': 0.09,
    'Brandenburg': 0.09,
    'Bremen': 0.09,
    'Hamburg': 0.09,
    'Hessen': 0.09,
    'Mecklenburg-Vorpommern': 0.09,
    'Niedersachsen': 0.09,
    'Nordrhein-Westfalen': 0.09,
    'Rheinland-Pfalz': 0.09,
    'Saarland': 0.09,
    'Sachsen': 0.09,
    'Sachsen-Anhalt': 0.09,
    'Schleswig-Holstein': 0.09,
    'Thüringen': 0.09
  }
} as const

/**
 * 德国税收计算引擎类
 */
export class GermanTaxEngine {
  private config: GermanTaxConfiguration

  constructor(config: GermanTaxConfiguration) {
    this.config = config
  }

  /**
   * 更新税收配置
   */
  updateConfiguration(config: Partial<GermanTaxConfiguration>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 计算资本利得税（Abgeltungssteuer）
   */
  calculateAbgeltungssteuer(
    capitalGains: number,
    freistellungsauftragUsed: number = 0,
    etfTeilfreistellung: number = 0
  ): AbgeltungssteuerCalculation {
    // 应用ETF部分免税
    const taxableGainsAfterTeilfreistellung = capitalGains - etfTeilfreistellung
    
    // 应用Freistellungsauftrag免税额度
    const availableFreistellungsauftrag = this.getAvailableFreistellungsauftrag() - freistellungsauftragUsed
    const freistellungsauftragApplied = Math.min(
      Math.max(0, taxableGainsAfterTeilfreistellung),
      Math.max(0, availableFreistellungsauftrag)
    )
    
    // 计算应税收益
    const taxableGains = Math.max(0, taxableGainsAfterTeilfreistellung - freistellungsauftragApplied)
    
    // 计算Abgeltungssteuer
    const abgeltungssteuer = taxableGains * GERMAN_TAX_CONSTANTS.ABGELTUNGSSTEUER_RATE
    
    // 计算Solidaritätszuschlag（团结税）
    const solidaritaetszuschlag = this.calculateSolidaritaetszuschlag(abgeltungssteuer)
    
    // 计算教会税
    const churchTax = this.calculateChurchTax(abgeltungssteuer)
    
    // 总税额
    const totalTax = abgeltungssteuer + solidaritaetszuschlag + churchTax
    
    return {
      capitalGains,
      etfTeilfreistellung,
      taxableGainsAfterTeilfreistellung,
      freistellungsauftragApplied,
      taxableGains,
      abgeltungssteuer,
      solidaritaetszuschlag,
      churchTax,
      totalTax,
      netGains: capitalGains - totalTax,
      effectiveTaxRate: capitalGains > 0 ? (totalTax / capitalGains) * 100 : 0,
      breakdown: {
        abgeltungssteuerRate: GERMAN_TAX_CONSTANTS.ABGELTUNGSSTEUER_RATE * 100,
        solidaritaetszuschlagRate: GERMAN_TAX_CONSTANTS.SOLIDARITAETSZUSCHLAG_RATE * 100,
        churchTaxRate: this.getChurchTaxRate() * 100,
        totalTaxRate: capitalGains > 0 ? (totalTax / capitalGains) * 100 : 0
      }
    }
  }

  /**
   * 计算团结税（Solidaritätszuschlag）
   */
  private calculateSolidaritaetszuschlag(abgeltungssteuer: number): number {
    if (!this.config.solidaritaetszuschlag.enabled) {
      return 0
    }

    // 年度团结税计算（简化版本）
    const annualAbgeltungssteuer = abgeltungssteuer
    
    // 如果低于免征额度，则不征收团结税
    if (annualAbgeltungssteuer <= GERMAN_TAX_CONSTANTS.SOLIDARITAETSZUSCHLAG_THRESHOLD) {
      return 0
    }

    return annualAbgeltungssteuer * GERMAN_TAX_CONSTANTS.SOLIDARITAETSZUSCHLAG_RATE
  }

  /**
   * 计算教会税
   */
  private calculateChurchTax(abgeltungssteuer: number): number {
    if (!this.config.churchTax.enabled) {
      return 0
    }

    const churchTaxRate = this.getChurchTaxRate()
    return abgeltungssteuer * churchTaxRate
  }

  /**
   * 获取教会税税率
   */
  private getChurchTaxRate(): number {
    if (!this.config.churchTax.enabled) {
      return 0
    }

    return GERMAN_TAX_CONSTANTS.CHURCH_TAX_RATES[this.config.churchTax.state] || 0.09
  }

  /**
   * 获取可用的Freistellungsauftrag额度
   */
  private getAvailableFreistellungsauftrag(): number {
    if (!this.config.freistellungsauftrag.enabled) {
      return 0
    }

    const baseAmount = this.config.freistellungsauftrag.isMarried
      ? GERMAN_TAX_CONSTANTS.FREISTELLUNGSAUFTRAG_MARRIED
      : GERMAN_TAX_CONSTANTS.FREISTELLUNGSAUFTRAG_SINGLE

    return baseAmount
  }

  /**
   * 计算ETF部分免税金额
   */
  calculateETFTeilfreistellung(
    etfGains: number,
    etfType: keyof typeof GERMAN_TAX_CONSTANTS.ETF_TEILFREISTELLUNG_RATES
  ): ETFTeilfreistellungData {
    if (!this.config.etfTeilfreistellung.enabled) {
      return {
        etfGains,
        etfType,
        teilfreistellungRate: 0,
        teilfreistellungAmount: 0,
        taxableAmount: etfGains
      }
    }

    const teilfreistellungRate = GERMAN_TAX_CONSTANTS.ETF_TEILFREISTELLUNG_RATES[etfType] || 0
    const teilfreistellungAmount = etfGains * teilfreistellungRate
    const taxableAmount = etfGains - teilfreistellungAmount

    return {
      etfGains,
      etfType,
      teilfreistellungRate: teilfreistellungRate * 100,
      teilfreistellungAmount,
      taxableAmount
    }
  }

  /**
   * 计算完整的税收结果
   */
  calculateTaxes(
    capitalGains: number,
    etfData?: { gains: number; type: keyof typeof GERMAN_TAX_CONSTANTS.ETF_TEILFREISTELLUNG_RATES },
    freistellungsauftragUsed: number = 0
  ): TaxCalculationResult {
    // 计算ETF部分免税
    let etfTeilfreistellung = 0
    let etfTeilfreistellungData: ETFTeilfreistellungData | undefined

    if (etfData && etfData.gains > 0) {
      etfTeilfreistellungData = this.calculateETFTeilfreistellung(etfData.gains, etfData.type)
      etfTeilfreistellung = etfTeilfreistellungData.teilfreistellungAmount
    }

    // 计算Abgeltungssteuer
    const abgeltungssteuerCalculation = this.calculateAbgeltungssteuer(
      capitalGains,
      freistellungsauftragUsed,
      etfTeilfreistellung
    )

    // 计算Freistellungsauftrag分配
    const freistellungsauftragAllocation = this.calculateFreistellungsauftragAllocation(
      capitalGains,
      freistellungsauftragUsed
    )

    return {
      capitalGains,
      abgeltungssteuer: abgeltungssteuerCalculation,
      freistellungsauftrag: freistellungsauftragAllocation,
      etfTeilfreistellung: etfTeilfreistellungData,
      summary: {
        totalTaxes: abgeltungssteuerCalculation.totalTax,
        netGains: abgeltungssteuerCalculation.netGains,
        effectiveTaxRate: abgeltungssteuerCalculation.effectiveTaxRate,
        taxSavings: etfTeilfreistellung + abgeltungssteuerCalculation.freistellungsauftragApplied
      },
      configuration: this.config
    }
  }

  /**
   * 计算Freistellungsauftrag分配
   */
  private calculateFreistellungsauftragAllocation(
    capitalGains: number,
    usedAmount: number
  ): FreistellungsauftragAllocation {
    const totalAvailable = this.getAvailableFreistellungsauftrag()
    const remainingAmount = Math.max(0, totalAvailable - usedAmount)
    const applicableAmount = Math.min(Math.max(0, capitalGains), remainingAmount)

    return {
      totalAvailable,
      usedAmount,
      remainingAmount,
      applicableAmount,
      isMarried: this.config.freistellungsauftrag.isMarried,
      enabled: this.config.freistellungsauftrag.enabled
    }
  }

  /**
   * 获取税收配置
   */
  getConfiguration(): GermanTaxConfiguration {
    return { ...this.config }
  }

  /**
   * 验证税收配置
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // 验证教会税配置
    if (this.config.churchTax.enabled) {
      if (!this.config.churchTax.state) {
        errors.push('教会税已启用但未选择联邦州')
      } else if (!(this.config.churchTax.state in GERMAN_TAX_CONSTANTS.CHURCH_TAX_RATES)) {
        errors.push('无效的联邦州选择')
      }
    }

    // 验证Freistellungsauftrag配置
    if (this.config.freistellungsauftrag.enabled) {
      // 基本验证通过
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 获取税收摘要信息
   */
  getTaxSummary(): {
    abgeltungssteuerRate: number
    solidaritaetszuschlagRate: number
    churchTaxRate: number
    totalTaxRate: number
    freistellungsauftragAmount: number
  } {
    const churchTaxRate = this.getChurchTaxRate()
    const abgeltungssteuerRate = GERMAN_TAX_CONSTANTS.ABGELTUNGSSTEUER_RATE
    const solidaritaetszuschlagRate = this.config.solidaritaetszuschlag.enabled 
      ? GERMAN_TAX_CONSTANTS.SOLIDARITAETSZUSCHLAG_RATE 
      : 0

    // 计算总税率（近似值）
    const totalTaxRate = abgeltungssteuerRate + 
      (abgeltungssteuerRate * solidaritaetszuschlagRate) + 
      (abgeltungssteuerRate * churchTaxRate)

    return {
      abgeltungssteuerRate: abgeltungssteuerRate * 100,
      solidaritaetszuschlagRate: solidaritaetszuschlagRate * 100,
      churchTaxRate: churchTaxRate * 100,
      totalTaxRate: totalTaxRate * 100,
      freistellungsauftragAmount: this.getAvailableFreistellungsauftrag()
    }
  }
}
