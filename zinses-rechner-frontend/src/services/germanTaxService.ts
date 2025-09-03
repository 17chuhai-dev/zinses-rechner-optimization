/**
 * 德国税务计算服务
 * 实现德国资本利得税、团结税和教会税的计算
 */

export interface TaxSettings {
  hasKirchensteuer: boolean
  kirchensteuerRate: number // 0.08 或 0.09
  bundesland: string
  isMarried: boolean // 影响免税额度
}

export interface TaxCalculation {
  grossInterest: number // 毛利息收入
  taxFreeAmount: number // 免税额度 (Sparerpauschbetrag)
  taxableInterest: number // 应税利息
  abgeltungssteuer: number // 资本利得税 25%
  solidaritaetszuschlag: number // 团结税 5.5%
  kirchensteuer: number // 教会税 8-9%
  totalTax: number // 总税额
  netInterest: number // 税后净利息
  effectiveTaxRate: number // 实际税率
}

export interface YearlyTaxBreakdown {
  year: number
  grossInterest: number
  taxCalculation: TaxCalculation
  cumulativeTaxPaid: number
}

export class GermanTaxService {
  // 2023年起的免税额度
  private static readonly SPARERPAUSCHBETRAG_2023 = 1000 // 单身
  private static readonly SPARERPAUSCHBETRAG_2023_MARRIED = 2000 // 夫妻合并申报
  
  // 税率常量
  private static readonly ABGELTUNGSSTEUER_RATE = 0.25 // 25%
  private static readonly SOLIDARITAETSZUSCHLAG_RATE = 0.055 // 5.5%
  
  // 各州教会税率
  private static readonly KIRCHENSTEUER_RATES: Record<string, number> = {
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

  /**
   * 计算单年度税务
   */
  static calculateYearlyTax(
    grossInterest: number,
    settings: TaxSettings,
    year: number = new Date().getFullYear()
  ): TaxCalculation {
    // 确定免税额度
    const taxFreeAmount = this.getTaxFreeAmount(settings.isMarried, year)
    
    // 计算应税利息
    const taxableInterest = Math.max(0, grossInterest - taxFreeAmount)
    
    // 计算资本利得税
    const abgeltungssteuer = taxableInterest * this.ABGELTUNGSSTEUER_RATE
    
    // 计算团结税（基于资本利得税）
    const solidaritaetszuschlag = abgeltungssteuer * this.SOLIDARITAETSZUSCHLAG_RATE
    
    // 计算教会税（基于资本利得税）
    const kirchensteuer = settings.hasKirchensteuer 
      ? abgeltungssteuer * settings.kirchensteuerRate
      : 0
    
    // 总税额
    const totalTax = abgeltungssteuer + solidaritaetszuschlag + kirchensteuer
    
    // 税后净利息
    const netInterest = grossInterest - totalTax
    
    // 实际税率
    const effectiveTaxRate = grossInterest > 0 ? (totalTax / grossInterest) * 100 : 0

    return {
      grossInterest,
      taxFreeAmount,
      taxableInterest,
      abgeltungssteuer,
      solidaritaetszuschlag,
      kirchensteuer,
      totalTax,
      netInterest,
      effectiveTaxRate
    }
  }

  /**
   * 计算多年度税务明细
   */
  static calculateMultiYearTax(
    yearlyInterestAmounts: number[],
    settings: TaxSettings,
    startYear: number = new Date().getFullYear()
  ): YearlyTaxBreakdown[] {
    let cumulativeTaxPaid = 0
    
    return yearlyInterestAmounts.map((grossInterest, index) => {
      const year = startYear + index
      const taxCalculation = this.calculateYearlyTax(grossInterest, settings, year)
      
      cumulativeTaxPaid += taxCalculation.totalTax
      
      return {
        year,
        grossInterest,
        taxCalculation,
        cumulativeTaxPaid
      }
    })
  }

  /**
   * 获取免税额度
   */
  private static getTaxFreeAmount(isMarried: boolean, year: number): number {
    // 2023年起提高到1000€/2000€
    if (year >= 2023) {
      return isMarried ? this.SPARERPAUSCHBETRAG_2023_MARRIED : this.SPARERPAUSCHBETRAG_2023
    }
    
    // 2023年前的免税额度（801€/1602€）
    return isMarried ? 1602 : 801
  }

  /**
   * 获取州的教会税率
   */
  static getKirchensteuerRate(bundesland: string): number {
    return this.KIRCHENSTEUER_RATES[bundesland] || 0.09
  }

  /**
   * 计算税务优化建议
   */
  static getTaxOptimizationTips(
    totalInterest: number,
    settings: TaxSettings
  ): string[] {
    const tips: string[] = []
    const taxFreeAmount = this.getTaxFreeAmount(settings.isMarried, new Date().getFullYear())
    
    if (totalInterest > taxFreeAmount) {
      tips.push(
        `💡 Nutzen Sie Ihren Sparerpauschbetrag von ${taxFreeAmount.toLocaleString('de-DE')}€ optimal aus.`
      )
    }
    
    if (settings.isMarried) {
      tips.push(
        '💡 Als Ehepaar können Sie den doppelten Sparerpauschbetrag nutzen (2.000€).'
      )
    }
    
    if (totalInterest > 10000) {
      tips.push(
        '💡 Bei höheren Erträgen könnte eine Aufteilung auf mehrere Jahre steuerlich vorteilhaft sein.'
      )
    }
    
    if (settings.hasKirchensteuer) {
      tips.push(
        '💡 Die Kirchensteuer ist bei der Einkommensteuer abzugsfähig.'
      )
    }
    
    tips.push(
      '⚠️ Diese Berechnung ersetzt keine professionelle Steuerberatung.'
    )
    
    return tips
  }

  /**
   * 格式化税务信息为德语显示
   */
  static formatTaxInfo(tax: TaxCalculation): Record<string, string> {
    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    })
    
    const percentFormatter = new Intl.NumberFormat('de-DE', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })

    return {
      grossInterest: formatter.format(tax.grossInterest),
      taxFreeAmount: formatter.format(tax.taxFreeAmount),
      taxableInterest: formatter.format(tax.taxableInterest),
      abgeltungssteuer: formatter.format(tax.abgeltungssteuer),
      solidaritaetszuschlag: formatter.format(tax.solidaritaetszuschlag),
      kirchensteuer: formatter.format(tax.kirchensteuer),
      totalTax: formatter.format(tax.totalTax),
      netInterest: formatter.format(tax.netInterest),
      effectiveTaxRate: percentFormatter.format(tax.effectiveTaxRate / 100)
    }
  }

  /**
   * 验证税务设置
   */
  static validateTaxSettings(settings: TaxSettings): string[] {
    const errors: string[] = []
    
    if (settings.kirchensteuerRate < 0.08 || settings.kirchensteuerRate > 0.09) {
      errors.push('Kirchensteuersatz muss zwischen 8% und 9% liegen.')
    }
    
    if (settings.hasKirchensteuer && !settings.bundesland) {
      errors.push('Bundesland ist erforderlich für die Kirchensteuer-Berechnung.')
    }
    
    return errors
  }

  /**
   * 获取税务计算说明
   */
  static getTaxExplanation(): {
    title: string
    content: string
    disclaimer: string
  } {
    return {
      title: 'Deutsche Kapitalertragsteuer',
      content: `
        <p><strong>Abgeltungssteuer:</strong> 25% auf Kapitalerträge über dem Sparerpauschbetrag</p>
        <p><strong>Solidaritätszuschlag:</strong> 5,5% auf die Abgeltungssteuer</p>
        <p><strong>Kirchensteuer:</strong> 8-9% auf die Abgeltungssteuer (je nach Bundesland)</p>
        <p><strong>Sparerpauschbetrag 2023:</strong> 1.000€ (Alleinstehende) / 2.000€ (Verheiratete)</p>
      `,
      disclaimer: `
        <p><strong>Wichtiger Hinweis:</strong> Diese Berechnung dient nur der groben Orientierung. 
        Tatsächliche Steuerbelastungen können aufgrund individueller Umstände abweichen. 
        Konsultieren Sie einen Steuerberater für eine verbindliche Beratung.</p>
      `
    }
  }
}
