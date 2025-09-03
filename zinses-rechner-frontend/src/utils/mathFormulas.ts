/**
 * 数学公式工具类
 * 提供复利计算的各种公式和解释
 */

export interface FormulaStep {
  title: string
  description: string
  formula: string
  result?: string
  variables?: Record<string, number>
}

export interface FormulaVariable {
  symbol: string
  name: string
  description: string
  value?: number
  unit?: string
}

export class MathFormulas {
  
  /**
   * 计算简单利息
   */
  static calculateSimpleInterest(
    principal: number,
    rate: number,
    years: number,
    monthlyPayment: number = 0
  ): number {
    const simpleInterest = principal * (rate / 100) * years
    const totalContributions = principal + (monthlyPayment * 12 * years)
    return totalContributions + simpleInterest
  }

  /**
   * 计算复利（基础公式）
   */
  static calculateBasicCompoundInterest(
    principal: number,
    rate: number,
    years: number
  ): number {
    return principal * Math.pow(1 + rate / 100, years)
  }

  /**
   * 计算复利（月复利）
   */
  static calculateMonthlyCompoundInterest(
    principal: number,
    rate: number,
    years: number,
    compoundsPerYear: number = 12
  ): number {
    const periodicRate = rate / 100 / compoundsPerYear
    const totalPeriods = compoundsPerYear * years
    return principal * Math.pow(1 + periodicRate, totalPeriods)
  }

  /**
   * 计算年金现值（定期投入）
   */
  static calculateAnnuityFutureValue(
    monthlyPayment: number,
    rate: number,
    years: number,
    compoundsPerYear: number = 12
  ): number {
    if (rate === 0) {
      return monthlyPayment * 12 * years
    }
    
    const periodicRate = rate / 100 / compoundsPerYear
    const totalPeriods = compoundsPerYear * years
    
    return monthlyPayment * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate)
  }

  /**
   * 生成公式变量说明
   */
  static getFormulaVariables(
    principal: number,
    rate: number,
    years: number,
    monthlyPayment: number = 0,
    compoundsPerYear: number = 12
  ): FormulaVariable[] {
    const variables: FormulaVariable[] = [
      {
        symbol: 'A',
        name: 'Endkapital',
        description: 'Das Geld, das Sie am Ende haben',
        unit: '€'
      },
      {
        symbol: 'P',
        name: 'Startkapital',
        description: 'Ihr anfängliches Investment',
        value: principal,
        unit: '€'
      },
      {
        symbol: 'r',
        name: 'Zinssatz',
        description: 'Jährlicher Zinssatz',
        value: rate,
        unit: '%'
      },
      {
        symbol: 't',
        name: 'Zeit',
        description: 'Anlagedauer in Jahren',
        value: years,
        unit: 'Jahre'
      }
    ]

    if (compoundsPerYear !== 1) {
      variables.push({
        symbol: 'n',
        name: 'Zinszahlungen pro Jahr',
        description: 'Wie oft pro Jahr Zinsen gutgeschrieben werden',
        value: compoundsPerYear,
        unit: 'mal/Jahr'
      })
    }

    if (monthlyPayment > 0) {
      variables.push({
        symbol: 'PMT',
        name: 'Monatliche Sparrate',
        description: 'Regelmäßige monatliche Einzahlung',
        value: monthlyPayment,
        unit: '€/Monat'
      })
    }

    return variables
  }

  /**
   * 生成计算步骤
   */
  static generateCalculationSteps(
    principal: number,
    rate: number,
    years: number,
    monthlyPayment: number = 0,
    compoundsPerYear: number = 12
  ): FormulaStep[] {
    const steps: FormulaStep[] = []
    const periodicRate = rate / 100 / compoundsPerYear
    const totalPeriods = compoundsPerYear * years

    // 步骤1：参数设置
    steps.push({
      title: 'Parameter einsetzen',
      description: 'Ihre Eingabewerte in die Formel einsetzen',
      formula: `P = ${principal.toLocaleString('de-DE')}€, r = ${rate}%, t = ${years} Jahre${compoundsPerYear !== 1 ? `, n = ${compoundsPerYear}` : ''}`,
      variables: { P: principal, r: rate, t: years, n: compoundsPerYear }
    })

    if (compoundsPerYear !== 1) {
      // 步骤2：周期利率
      steps.push({
        title: 'Periodenzinssatz berechnen',
        description: `Jahresrate durch ${compoundsPerYear} ${compoundsPerYear === 12 ? 'Monate' : 'Perioden'} teilen`,
        formula: `r/n = ${rate}% ÷ ${compoundsPerYear} = ${(periodicRate * 100).toFixed(4)}%`,
        result: `${(periodicRate * 100).toFixed(4)}% pro ${compoundsPerYear === 12 ? 'Monat' : 'Periode'}`,
        variables: { 'r/n': periodicRate }
      })

      // 步骤3：总期数
      steps.push({
        title: 'Gesamtanzahl der Perioden',
        description: `Anzahl Jahre mal ${compoundsPerYear} ${compoundsPerYear === 12 ? 'Monate' : 'Perioden'}`,
        formula: `n × t = ${compoundsPerYear} × ${years} = ${totalPeriods}`,
        result: `${totalPeriods} ${compoundsPerYear === 12 ? 'Monate' : 'Perioden'}`,
        variables: { 'n×t': totalPeriods }
      })
    }

    // 步骤4：复利因子
    const compoundFactor = Math.pow(1 + periodicRate, totalPeriods)
    const formulaBase = compoundsPerYear === 1 ? '(1 + r)' : '(1 + r/n)'
    const formulaExponent = compoundsPerYear === 1 ? 't' : 'n×t'
    
    steps.push({
      title: 'Zinseszins-Faktor berechnen',
      description: 'Der Multiplikator für das Startkapital',
      formula: `${formulaBase}^${formulaExponent} = ${compoundsPerYear === 1 ? `(1 + ${rate/100})^${years}` : `(1 + ${(periodicRate * 100).toFixed(4)}%)^${totalPeriods}`}`,
      result: compoundFactor.toFixed(6),
      variables: { 'compound_factor': compoundFactor }
    })

    // 步骤5：本金部分计算
    const principalGrowth = principal * compoundFactor
    steps.push({
      title: 'Startkapital-Wachstum',
      description: 'Wie viel aus dem Startkapital wird',
      formula: `P × ${compoundFactor.toFixed(4)} = ${principal.toLocaleString('de-DE')}€ × ${compoundFactor.toFixed(4)}`,
      result: `${principalGrowth.toLocaleString('de-DE', { maximumFractionDigits: 2 })}€`,
      variables: { principal_growth: principalGrowth }
    })

    // 步骤6：月供部分（如果有）
    if (monthlyPayment > 0) {
      const annuityValue = this.calculateAnnuityFutureValue(monthlyPayment, rate, years, compoundsPerYear)
      
      steps.push({
        title: 'Sparraten-Wachstum',
        description: 'Wie viel aus den monatlichen Sparraten wird',
        formula: `PMT × [((1 + r/n)^(n×t) - 1) / (r/n)]`,
        result: `${annuityValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}€`,
        variables: { annuity_value: annuityValue }
      })

      // 步骤7：总和
      const totalAmount = principalGrowth + annuityValue
      steps.push({
        title: 'Gesamtes Endkapital',
        description: 'Startkapital-Wachstum plus Sparraten-Wachstum',
        formula: `${principalGrowth.toFixed(2)}€ + ${annuityValue.toFixed(2)}€`,
        result: `${totalAmount.toLocaleString('de-DE', { maximumFractionDigits: 2 })}€`,
        variables: { total_amount: totalAmount }
      })
    } else {
      // 只有本金的情况
      steps.push({
        title: 'Endkapital',
        description: 'Ihr finales Kapital nach Zinseszins',
        formula: `A = ${principalGrowth.toFixed(2)}€`,
        result: `${principalGrowth.toLocaleString('de-DE', { maximumFractionDigits: 2 })}€`,
        variables: { final_amount: principalGrowth }
      })
    }

    return steps
  }

  /**
   * 获取公式类型说明
   */
  static getFormulaTypes(): Array<{
    name: string
    formula: string
    description: string
    useCase: string
  }> {
    return [
      {
        name: 'Einfache Zinsen',
        formula: 'A = P + (P × r × t)',
        description: 'Zinsen werden nur auf das Startkapital berechnet',
        useCase: 'Selten verwendet, da weniger vorteilhaft'
      },
      {
        name: 'Jährliche Zinseszinsen',
        formula: 'A = P × (1 + r)^t',
        description: 'Zinsen werden einmal pro Jahr kapitalisiert',
        useCase: 'Einfache Anlageprodukte mit jährlicher Zinsgutschrift'
      },
      {
        name: 'Monatliche Zinseszinsen',
        formula: 'A = P × (1 + r/12)^(12×t)',
        description: 'Zinsen werden monatlich kapitalisiert',
        useCase: 'Sparkonten, die meisten Anlageprodukte'
      },
      {
        name: 'Mit regelmäßigen Einzahlungen',
        formula: 'A = P × (1 + r/n)^(n×t) + PMT × [((1 + r/n)^(n×t) - 1) / (r/n)]',
        description: 'Startkapital plus regelmäßige Sparraten',
        useCase: 'Sparpläne, ETF-Sparpläne, Rentenpläne'
      }
    ]
  }

  /**
   * 计算复利优势
   */
  static calculateCompoundAdvantage(
    principal: number,
    rate: number,
    years: number,
    monthlyPayment: number = 0
  ): {
    simpleInterest: number
    compoundInterest: number
    advantage: number
    advantagePercentage: number
  } {
    const simpleInterest = this.calculateSimpleInterest(principal, rate, years, monthlyPayment)
    const compoundInterest = this.calculateMonthlyCompoundInterest(principal, rate, years) + 
                            this.calculateAnnuityFutureValue(monthlyPayment, rate, years)
    
    const advantage = compoundInterest - simpleInterest
    const advantagePercentage = (advantage / simpleInterest) * 100

    return {
      simpleInterest,
      compoundInterest,
      advantage,
      advantagePercentage
    }
  }

  /**
   * 格式化公式显示
   */
  static formatFormula(
    formula: string,
    variables: Record<string, number>
  ): string {
    let formatted = formula
    
    // 替换变量
    Object.entries(variables).forEach(([symbol, value]) => {
      const regex = new RegExp(`\\b${symbol}\\b`, 'g')
      formatted = formatted.replace(regex, value.toString())
    })
    
    return formatted
  }
}
