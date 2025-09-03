// 德国本地化格式化工具函数

/**
 * 格式化货币显示（欧元）
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * 格式化百分比显示
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * 格式化数字（德国千位分隔符）
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * 格式化日期（德国格式）
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * 解析用户输入的货币值
 */
export function parseCurrencyInput(input: string): number {
  // 移除货币符号和千位分隔符
  const cleaned = input
    .replace(/[€\s]/g, '')
    .replace(/\./g, '') // 德国千位分隔符
    .replace(/,/g, '.') // 德国小数分隔符

  const value = parseFloat(cleaned)
  return isNaN(value) ? 0 : value
}

/**
 * 解析百分比输入
 */
export function parsePercentageInput(input: string): number {
  const cleaned = input.replace(/[%\s]/g, '').replace(/,/g, '.')
  const value = parseFloat(cleaned)
  return isNaN(value) ? 0 : value
}

/**
 * 验证数字范围
 */
export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * 生成友好的错误消息
 */
export function getValidationMessage(field: string, min: number, max: number): string {
  const messages: Record<string, string> = {
    principal: `Das Startkapital muss zwischen ${formatCurrency(min)} und ${formatCurrency(max)} liegen.`,
    monthlyPayment: `Die monatliche Sparrate muss zwischen ${formatCurrency(min)} und ${formatCurrency(max)} liegen.`,
    annualRate: `Der Zinssatz muss zwischen ${min}% und ${max}% liegen.`,
    years: `Die Laufzeit muss zwischen ${min} und ${max} Jahren liegen.`,
  }

  return messages[field] || `Der Wert muss zwischen ${min} und ${max} liegen.`
}
