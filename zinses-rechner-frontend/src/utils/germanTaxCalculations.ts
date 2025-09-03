/**
 * 德国税收计算工具
 * 实现德国税法相关的各种税收计算功能
 */

import {
  TaxSettings,
  TaxCalculationParams,
  TaxCalculationResult,
  FreistellungsauftragAllocation,
  GermanState,
  ChurchTaxType,
  ETFType,
  CHURCH_TAX_RATES,
  ETF_EXEMPTION_RATES
} from '@/types/GermanTaxTypes'

/**
 * 计算资本利得税（Abgeltungssteuer）
 */
export function calculateAbgeltungssteuer(
  params: TaxCalculationParams,
  settings: TaxSettings
): TaxCalculationResult {
  const { income } = params

  // 如果收入为负或零，直接返回
  if (income <= 0) {
    return {
      taxableIncome: 0,
      exemptAmount: 0,
      baseTax: 0,
      solidarityTax: 0,
      churchTax: 0,
      totalTax: 0,
      netIncome: income,
      effectiveTaxRate: 0,
      breakdown: {
        baseTax: 0,
        solidarityTax: 0,
        churchTax: 0,
        exemptAmount: 0,
        etfExemption: 0
      },
      calculatedAt: new Date()
    }
  }

  // 第1步: 应用免税额度
  const allowanceResult = calculateFreistellungsauftragUsage(income, settings)
  let taxableIncome = allowanceResult.taxableAmount
  const exemptFromAllowance = allowanceResult.usedAllowance

  // 第2步: 应用ETF部分免税
  let etfExemption = 0
  if (params.etfType && settings.etfTeilfreistellung?.enabled) {
    const etfResult = calculateETFTeilfreistellung(params, settings)
    etfExemption = etfResult.exemptAmount
    taxableIncome = Math.max(0, taxableIncome - etfExemption)
  }

  // 第3步: 计算基础资本利得税 (25%)
  const baseTax = taxableIncome * settings.abgeltungssteuer.baseTaxRate

  // 第4步: 计算团结税 (5.5% der Abgeltungssteuer)
  const solidarityTax = settings.abgeltungssteuer.calculation.includeSolidarityTax
    ? baseTax * settings.abgeltungssteuer.solidarityTaxRate
    : 0

  // 第5步: 计算教会税
  const churchTax = settings.abgeltungssteuer.calculation.includeChurchTax
    ? baseTax * settings.abgeltungssteuer.churchTax.rate
    : 0

  // 第6步: 计算总税额
  const totalTax = baseTax + solidarityTax + churchTax
  const netIncome = income - totalTax
  const effectiveTaxRate = income > 0 ? totalTax / income : 0

  return {
    taxableIncome,
    exemptAmount: exemptFromAllowance + etfExemption,
    baseTax: roundToDecimalPlaces(baseTax, 2),
    solidarityTax: roundToDecimalPlaces(solidarityTax, 2),
    churchTax: roundToDecimalPlaces(churchTax, 2),
    totalTax: roundToDecimalPlaces(totalTax, 2),
    netIncome: roundToDecimalPlaces(netIncome, 2),
    effectiveTaxRate: roundToDecimalPlaces(effectiveTaxRate, 4),
    breakdown: {
      baseTax: roundToDecimalPlaces(baseTax, 2),
      solidarityTax: roundToDecimalPlaces(solidarityTax, 2),
      churchTax: roundToDecimalPlaces(churchTax, 2),
      exemptAmount: exemptFromAllowance,
      etfExemption
    },
    calculatedAt: new Date()
  }
}

/**
 * 计算免税额度使用情况
 */
export function calculateFreistellungsauftragUsage(
  income: number,
  settings: TaxSettings
): {
  totalAllowance: number
  usedAllowance: number
  remainingAllowance: number
  taxableAmount: number
} {
  if (!settings.freistellungsauftrag.enabled || income <= 0) {
    return {
      totalAllowance: settings.freistellungsauftrag.annualAllowance,
      usedAllowance: 0,
      remainingAllowance: settings.freistellungsauftrag.remainingAllowance,
      taxableAmount: income
    }
  }

  const availableAllowance = settings.freistellungsauftrag.remainingAllowance
  const usedAllowance = Math.min(income, availableAllowance)
  const taxableAmount = Math.max(0, income - usedAllowance)

  return {
    totalAllowance: settings.freistellungsauftrag.annualAllowance,
    usedAllowance,
    remainingAllowance: availableAllowance - usedAllowance,
    taxableAmount
  }
}

/**
 * 计算ETF部分免税
 */
export function calculateETFTeilfreistellung(
  params: TaxCalculationParams,
  settings: TaxSettings
): {
  exemptAmount: number
  exemptionRate: number
  applicableIncome: number
} {
  if (!settings.etfTeilfreistellung?.enabled || !params.etfType || params.income <= 0) {
    return {
      exemptAmount: 0,
      exemptionRate: 0,
      applicableIncome: params.income
    }
  }

  const exemptionRate = ETF_EXEMPTION_RATES[params.etfType] || 0
  const exemptAmount = params.income * exemptionRate

  return {
    exemptAmount: roundToDecimalPlaces(exemptAmount, 2),
    exemptionRate,
    applicableIncome: params.income
  }
}

/**
 * 计算教会税
 */
export function calculateChurchTax(
  baseTaxAmount: number,
  state: GermanState,
  churchTaxType: ChurchTaxType
): {
  amount: number
  rate: number
  state: GermanState
} {
  if (churchTaxType === ChurchTaxType.NONE || baseTaxAmount <= 0) {
    return {
      amount: 0,
      rate: 0,
      state
    }
  }

  const rate = CHURCH_TAX_RATES[state] || 0.09
  const amount = baseTaxAmount * rate

  return {
    amount: roundToDecimalPlaces(amount, 2),
    rate,
    state
  }
}

/**
 * 计算总税负
 */
export function calculateTotalTaxBurden(
  params: TaxCalculationParams,
  settings: TaxSettings
): TaxCalculationResult {
  return calculateAbgeltungssteuer(params, settings)
}

/**
 * 优化免税额度分配
 */
export function optimizeFreistellungsauftragAllocation(
  settings: TaxSettings
): FreistellungsauftragAllocation[] {
  const allocations = [...settings.freistellungsauftrag.allocations]
  const totalAllowance = settings.freistellungsauftrag.annualAllowance

  if (allocations.length === 0) {
    return []
  }

  // 按效率排序（使用率高的优先）
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

    // 建议分配额度 = 已使用金额 * 1.2（预留20%缓冲）
    const suggestedAmount = Math.min(
      Math.ceil(allocation.usedAmount * 1.2),
      remainingAllowance
    )

    optimizedAllocations.push({
      ...allocation,
      allocatedAmount: suggestedAmount,
      remainingAmount: suggestedAmount - allocation.usedAmount,
      updatedAt: new Date()
    })

    remainingAllowance -= suggestedAmount
  }

  return optimizedAllocations
}

/**
 * 验证税收设置
 */
export function validateTaxSettings(settings: TaxSettings): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // 验证基础税率
  if (settings.abgeltungssteuer.baseTaxRate < 0 || settings.abgeltungssteuer.baseTaxRate > 1) {
    errors.push('Abgeltungssteuersatz muss zwischen 0% und 100% liegen')
  }

  // 验证团结税税率
  if (settings.abgeltungssteuer.solidarityTaxRate < 0 || settings.abgeltungssteuer.solidarityTaxRate > 1) {
    errors.push('Solidaritätszuschlag muss zwischen 0% und 100% liegen')
  }

  // 验证免税额度
  if (settings.freistellungsauftrag.annualAllowance < 0) {
    errors.push('Jährlicher Freibetrag kann nicht negativ sein')
  }

  if (settings.freistellungsauftrag.usedAllowance > settings.freistellungsauftrag.annualAllowance) {
    errors.push('Verwendeter Freibetrag kann nicht größer als der jährliche Freibetrag sein')
  }

  if (settings.freistellungsauftrag.usedAllowance < 0) {
    errors.push('Verwendeter Freibetrag kann nicht negativ sein')
  }

  // 验证教会税税率
  if (settings.abgeltungssteuer.churchTax.rate < 0 || settings.abgeltungssteuer.churchTax.rate > 1) {
    errors.push('Kirchensteuersatz muss zwischen 0% und 100% liegen')
  }

  // 验证ETF免税率
  Object.entries(settings.etfTeilfreistellung.exemptionRates).forEach(([etfType, rate]) => {
    if (rate < 0 || rate > 1) {
      errors.push(`ETF Teilfreistellungssatz für ${etfType} muss zwischen 0% und 100% liegen`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 格式化货币
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount).replace(/\u00A0/g, ' ')
}

/**
 * 格式化百分比
 */
export function formatPercentage(rate: number, decimalPlaces = 2): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(rate).replace(/\u00A0/g, ' ')
}

/**
 * 四舍五入到指定小数位数
 */
export function roundToDecimalPlaces(value: number, decimalPlaces: number): number {
  const factor = Math.pow(10, decimalPlaces)
  return Math.round(value * factor) / factor
}
