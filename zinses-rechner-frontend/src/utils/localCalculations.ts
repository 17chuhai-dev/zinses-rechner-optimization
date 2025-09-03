/**
 * 本地计算工具
 * 提供所有计算器的本地计算逻辑，无需后端API
 */

export interface CompoundInterestInput {
  principal: number
  monthlyPayment?: number
  annualRate: number
  years: number
  compoundFrequency?: 'monthly' | 'quarterly' | 'annually'
}

export interface CompoundInterestResult {
  totalAmount: number
  totalInterest: number
  totalContributions: number
  yearlyBreakdown: Array<{
    year: number
    startBalance: number
    contributions: number
    interest: number
    endBalance: number
  }>
  effectiveRate: number
  monthlyBreakdown?: Array<{
    month: number
    year: number
    balance: number
    interest: number
    contribution: number
  }>
}

export interface LoanInput {
  loanAmount: number
  annualRate: number
  years: number
  monthlyPayment?: number
}

export interface LoanResult {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  yearlyBreakdown: Array<{
    year: number
    startBalance: number
    payments: number
    interest: number
    principal: number
    endBalance: number
  }>
}

/**
 * 复利计算
 */
export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const { principal, monthlyPayment = 0, annualRate, years, compoundFrequency = 'monthly' } = input
  
  // 转换为小数
  const rate = annualRate / 100
  
  // 确定复利频率
  const compoundingPerYear = compoundFrequency === 'monthly' ? 12 : 
                            compoundFrequency === 'quarterly' ? 4 : 1
  
  // 每期利率
  const periodRate = rate / compoundingPerYear
  
  // 总期数
  const totalPeriods = years * compoundingPerYear
  
  // 每期付款
  const periodPayment = monthlyPayment * (12 / compoundingPerYear)
  
  let currentBalance = principal
  let totalContributions = principal
  let totalInterest = 0
  
  const yearlyBreakdown: CompoundInterestResult['yearlyBreakdown'] = []
  const monthlyBreakdown: CompoundInterestResult['monthlyBreakdown'] = []
  
  // 按期计算
  for (let period = 1; period <= totalPeriods; period++) {
    const startBalance = currentBalance
    
    // 计算利息
    const periodInterest = currentBalance * periodRate
    
    // 添加利息和付款
    currentBalance += periodInterest + periodPayment
    totalInterest += periodInterest
    totalContributions += periodPayment
    
    // 如果是月度复利，记录月度数据
    if (compoundFrequency === 'monthly') {
      monthlyBreakdown.push({
        month: ((period - 1) % 12) + 1,
        year: Math.ceil(period / 12),
        balance: currentBalance,
        interest: periodInterest,
        contribution: periodPayment
      })
    }
    
    // 年末记录
    if (period % compoundingPerYear === 0) {
      const year = period / compoundingPerYear
      const yearStartBalance = year === 1 ? principal : yearlyBreakdown[year - 2]?.endBalance || 0
      const yearContributions = periodPayment * compoundingPerYear
      const yearInterest = currentBalance - yearStartBalance - yearContributions
      
      yearlyBreakdown.push({
        year,
        startBalance: yearStartBalance,
        contributions: yearContributions,
        interest: yearInterest,
        endBalance: currentBalance
      })
    }
  }
  
  // 计算有效年利率
  const effectiveRate = totalInterest > 0 ? 
    (Math.pow(currentBalance / principal, 1 / years) - 1) * 100 : 0
  
  return {
    totalAmount: Math.round(currentBalance * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalContributions: Math.round(totalContributions * 100) / 100,
    yearlyBreakdown,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    monthlyBreakdown: compoundFrequency === 'monthly' ? monthlyBreakdown : undefined
  }
}

/**
 * 贷款计算
 */
export function calculateLoan(input: LoanInput): LoanResult {
  const { loanAmount, annualRate, years, monthlyPayment } = input
  
  const monthlyRate = annualRate / 100 / 12
  const totalMonths = years * 12
  
  let calculatedMonthlyPayment: number
  
  if (monthlyPayment) {
    calculatedMonthlyPayment = monthlyPayment
  } else {
    // 计算月供 (等额本息)
    if (monthlyRate === 0) {
      calculatedMonthlyPayment = loanAmount / totalMonths
    } else {
      calculatedMonthlyPayment = loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
    }
  }
  
  let remainingBalance = loanAmount
  let totalPayment = 0
  let totalInterest = 0
  
  const yearlyBreakdown: LoanResult['yearlyBreakdown'] = []
  
  for (let year = 1; year <= years; year++) {
    const yearStartBalance = remainingBalance
    let yearPayments = 0
    let yearInterest = 0
    let yearPrincipal = 0
    
    // 计算这一年的12个月
    for (let month = 1; month <= 12 && remainingBalance > 0; month++) {
      const monthInterest = remainingBalance * monthlyRate
      const monthPrincipal = Math.min(calculatedMonthlyPayment - monthInterest, remainingBalance)
      
      remainingBalance -= monthPrincipal
      yearPayments += calculatedMonthlyPayment
      yearInterest += monthInterest
      yearPrincipal += monthPrincipal
      totalPayment += calculatedMonthlyPayment
      totalInterest += monthInterest
      
      if (remainingBalance <= 0) break
    }
    
    yearlyBreakdown.push({
      year,
      startBalance: yearStartBalance,
      payments: Math.round(yearPayments * 100) / 100,
      interest: Math.round(yearInterest * 100) / 100,
      principal: Math.round(yearPrincipal * 100) / 100,
      endBalance: Math.round(remainingBalance * 100) / 100
    })
    
    if (remainingBalance <= 0) break
  }
  
  return {
    monthlyPayment: Math.round(calculatedMonthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    yearlyBreakdown
  }
}

/**
 * 房贷计算 (基于贷款计算的扩展)
 */
export function calculateMortgage(input: LoanInput & { 
  downPayment?: number 
  propertyValue?: number 
}): LoanResult & { 
  loanToValue?: number 
  downPaymentPercentage?: number 
} {
  const { downPayment = 0, propertyValue, ...loanInput } = input
  
  const loanResult = calculateLoan(loanInput)
  
  const result: ReturnType<typeof calculateMortgage> = {
    ...loanResult
  }
  
  if (propertyValue && propertyValue > 0) {
    result.loanToValue = Math.round((loanInput.loanAmount / propertyValue) * 100 * 100) / 100
    result.downPaymentPercentage = Math.round((downPayment / propertyValue) * 100 * 100) / 100
  }
  
  return result
}

/**
 * 验证输入数据
 */
export function validateCalculationInput(input: any, type: 'compound' | 'loan' | 'mortgage'): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // 通用验证
  if (typeof input.annualRate !== 'number' || input.annualRate < 0 || input.annualRate > 50) {
    errors.push('Zinssatz muss zwischen 0% und 50% liegen')
  }
  
  if (typeof input.years !== 'number' || input.years < 1 || input.years > 50) {
    errors.push('Laufzeit muss zwischen 1 und 50 Jahren liegen')
  }
  
  // 类型特定验证
  if (type === 'compound') {
    if (typeof input.principal !== 'number' || input.principal < 1 || input.principal > 10000000) {
      errors.push('Startkapital muss zwischen 1€ und 10.000.000€ liegen')
    }
    
    if (input.monthlyPayment && (input.monthlyPayment < 0 || input.monthlyPayment > 100000)) {
      errors.push('Monatliche Sparrate muss zwischen 0€ und 100.000€ liegen')
    }
  } else if (type === 'loan' || type === 'mortgage') {
    if (typeof input.loanAmount !== 'number' || input.loanAmount < 1000 || input.loanAmount > 10000000) {
      errors.push('Darlehensbetrag muss zwischen 1.000€ und 10.000.000€ liegen')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
