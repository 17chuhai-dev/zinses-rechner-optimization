/**
 * 德语数字格式化工具函数测试
 * 测试所有格式化函数的正确性、边界值和特殊情况
 */

import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatDate,
  parseCurrencyInput,
  parsePercentageInput,
  validateRange,
  getValidationMessage
} from './formatters'

describe('formatCurrency', () => {
  it('应该正确格式化正数货币', () => {
    expect(formatCurrency(1234.56)).toBe('1.234,56 €')
    expect(formatCurrency(1000)).toBe('1.000,00 €')
    expect(formatCurrency(0.99)).toBe('0,99 €')
  })

  it('应该正确格式化负数货币', () => {
    expect(formatCurrency(-1234.56)).toBe('-1.234,56 €')
    expect(formatCurrency(-0.01)).toBe('-0,01 €')
  })

  it('应该正确处理零值', () => {
    expect(formatCurrency(0)).toBe('0,00 €')
    expect(formatCurrency(-0)).toBe('0,00 €')
  })

  it('应该正确处理大数值', () => {
    expect(formatCurrency(1000000)).toBe('1.000.000,00 €')
    expect(formatCurrency(999999999.99)).toBe('999.999.999,99 €')
  })

  it('应该正确处理小数精度', () => {
    expect(formatCurrency(1.234)).toBe('1,23 €') // 四舍五入到2位小数
    expect(formatCurrency(1.235)).toBe('1,24 €')
    expect(formatCurrency(1.999)).toBe('2,00 €')
  })

  it('应该处理特殊数值', () => {
    expect(formatCurrency(Infinity)).toBe('∞ €')
    expect(formatCurrency(-Infinity)).toBe('-∞ €')
    expect(formatCurrency(NaN)).toBe('NaN €')
  })
})

describe('formatPercentage', () => {
  it('应该正确格式化百分比', () => {
    expect(formatPercentage(5.5)).toBe('5,50 %')
    expect(formatPercentage(100)).toBe('100,00 %')
    expect(formatPercentage(0.1)).toBe('0,10 %')
  })

  it('应该支持自定义小数位数', () => {
    expect(formatPercentage(5.555, 0)).toBe('6 %')
    expect(formatPercentage(5.555, 1)).toBe('5,6 %')
    expect(formatPercentage(5.555, 3)).toBe('5,555 %')
  })

  it('应该正确处理负百分比', () => {
    expect(formatPercentage(-2.5)).toBe('-2,50 %')
    expect(formatPercentage(-0.01)).toBe('-0,01 %')
  })

  it('应该正确处理零值', () => {
    expect(formatPercentage(0)).toBe('0,00 %')
  })

  it('应该处理特殊数值', () => {
    expect(formatPercentage(Infinity)).toBe('∞ %')
    expect(formatPercentage(NaN)).toBe('NaN %')
  })
})

describe('formatNumber', () => {
  it('应该正确格式化整数', () => {
    expect(formatNumber(1234)).toBe('1.234')
    expect(formatNumber(1000000)).toBe('1.000.000')
    expect(formatNumber(0)).toBe('0')
  })

  it('应该支持自定义小数位数', () => {
    expect(formatNumber(1234.567, 2)).toBe('1.234,57')
    expect(formatNumber(1234.567, 0)).toBe('1.235')
    expect(formatNumber(1234.567, 4)).toBe('1.234,5670')
  })

  it('应该正确处理负数', () => {
    expect(formatNumber(-1234)).toBe('-1.234')
    expect(formatNumber(-1234.56, 2)).toBe('-1.234,56')
  })

  it('应该正确处理小数', () => {
    expect(formatNumber(0.123, 3)).toBe('0,123')
    expect(formatNumber(0.999, 2)).toBe('1,00')
  })
})

describe('formatDate', () => {
  it('应该正确格式化日期为德国格式', () => {
    const date = new Date('2023-12-25')
    expect(formatDate(date)).toBe('25.12.2023')
  })

  it('应该正确处理不同月份和日期', () => {
    expect(formatDate(new Date('2023-01-01'))).toBe('01.01.2023')
    expect(formatDate(new Date('2023-12-31'))).toBe('31.12.2023')
  })

  it('应该正确处理闰年', () => {
    expect(formatDate(new Date('2024-02-29'))).toBe('29.02.2024')
  })
})

describe('parseCurrencyInput', () => {
  it('应该正确解析德语货币格式', () => {
    expect(parseCurrencyInput('1.234,56')).toBe(1234.56)
    expect(parseCurrencyInput('1.000,00')).toBe(1000)
    expect(parseCurrencyInput('0,99')).toBe(0.99)
  })

  it('应该正确处理带货币符号的输入', () => {
    expect(parseCurrencyInput('1.234,56 €')).toBe(1234.56)
    expect(parseCurrencyInput('€ 1.234,56')).toBe(1234.56)
    expect(parseCurrencyInput('1.234,56€')).toBe(1234.56)
  })

  it('应该正确处理空格', () => {
    expect(parseCurrencyInput(' 1.234,56 ')).toBe(1234.56)
    expect(parseCurrencyInput('1 234,56')).toBe(1234.56)
  })

  it('应该正确处理无千位分隔符的输入', () => {
    expect(parseCurrencyInput('1234,56')).toBe(1234.56)
    expect(parseCurrencyInput('123')).toBe(123)
  })

  it('应该正确处理英语格式输入', () => {
    expect(parseCurrencyInput('1234.56')).toBe(1234.56)
    expect(parseCurrencyInput('1,234.56')).toBe(1234.56)
  })

  it('应该处理无效输入', () => {
    expect(parseCurrencyInput('')).toBe(0)
    expect(parseCurrencyInput('abc')).toBe(0)
    expect(parseCurrencyInput('€')).toBe(0)
  })

  it('应该正确处理负数', () => {
    expect(parseCurrencyInput('-1.234,56')).toBe(-1234.56)
    expect(parseCurrencyInput('-€1.234,56')).toBe(-1234.56)
  })

  it('应该处理边界值', () => {
    expect(parseCurrencyInput('0')).toBe(0)
    expect(parseCurrencyInput('0,00')).toBe(0)
    expect(parseCurrencyInput('999.999.999,99')).toBe(999999999.99)
  })
})

describe('parsePercentageInput', () => {
  it('应该正确解析百分比输入', () => {
    expect(parsePercentageInput('5,5%')).toBe(5.5)
    expect(parsePercentageInput('100%')).toBe(100)
    expect(parsePercentageInput('0,1%')).toBe(0.1)
  })

  it('应该正确处理无百分号的输入', () => {
    expect(parsePercentageInput('5,5')).toBe(5.5)
    expect(parsePercentageInput('100')).toBe(100)
  })

  it('应该正确处理空格', () => {
    expect(parsePercentageInput(' 5,5 % ')).toBe(5.5)
    expect(parsePercentageInput('5 , 5')).toBe(5.5)
  })

  it('应该处理无效输入', () => {
    expect(parsePercentageInput('')).toBe(0)
    expect(parsePercentageInput('abc')).toBe(0)
    expect(parsePercentageInput('%')).toBe(0)
  })

  it('应该正确处理负百分比', () => {
    expect(parsePercentageInput('-2,5%')).toBe(-2.5)
  })
})

describe('validateRange', () => {
  it('应该正确验证范围内的值', () => {
    expect(validateRange(5, 0, 10)).toBe(true)
    expect(validateRange(0, 0, 10)).toBe(true)
    expect(validateRange(10, 0, 10)).toBe(true)
  })

  it('应该正确识别范围外的值', () => {
    expect(validateRange(-1, 0, 10)).toBe(false)
    expect(validateRange(11, 0, 10)).toBe(false)
  })

  it('应该处理负数范围', () => {
    expect(validateRange(-5, -10, 0)).toBe(true)
    expect(validateRange(-11, -10, 0)).toBe(false)
  })

  it('应该处理小数范围', () => {
    expect(validateRange(1.5, 1.0, 2.0)).toBe(true)
    expect(validateRange(0.9, 1.0, 2.0)).toBe(false)
  })
})

describe('getValidationMessage', () => {
  it('应该为已知字段返回德语错误消息', () => {
    const message = getValidationMessage('principal', 1000, 1000000)
    expect(message).toContain('Startkapital')
    expect(message).toContain('1.000,00 €')
    expect(message).toContain('1.000.000,00 €')
  })

  it('应该为所有预定义字段返回正确消息', () => {
    expect(getValidationMessage('monthlyPayment', 10, 5000)).toContain('monatliche Sparrate')
    expect(getValidationMessage('annualRate', 0, 20)).toContain('Zinssatz')
    expect(getValidationMessage('years', 1, 50)).toContain('Laufzeit')
  })

  it('应该为未知字段返回通用消息', () => {
    const message = getValidationMessage('unknown', 0, 100)
    expect(message).toBe('Der Wert muss zwischen 0 und 100 liegen.')
  })

  it('应该正确格式化数字范围', () => {
    const message = getValidationMessage('principal', 1234.56, 9876.54)
    expect(message).toContain('1.234,56 €')
    expect(message).toContain('9.876,54 €')
  })
})

describe('边界值和特殊情况测试', () => {
  it('应该处理极大数值', () => {
    const largeNumber = Number.MAX_SAFE_INTEGER
    expect(() => formatCurrency(largeNumber)).not.toThrow()
    expect(() => formatNumber(largeNumber)).not.toThrow()
  })

  it('应该处理极小数值', () => {
    const smallNumber = Number.MIN_VALUE
    expect(() => formatCurrency(smallNumber)).not.toThrow()
    expect(() => formatNumber(smallNumber)).not.toThrow()
  })

  it('应该处理科学计数法', () => {
    expect(parseCurrencyInput('1e6')).toBe(1000000)
    expect(parseCurrencyInput('1.23e-4')).toBe(0.000123)
  })

  it('应该处理Unicode字符', () => {
    expect(parseCurrencyInput('1.234,56 €')).toBe(1234.56) // 正常欧元符号
    expect(parseCurrencyInput('1.234,56 ‚¬')).toBe(1234.56) // 其他欧元符号变体
  })

  it('应该处理多种分隔符组合', () => {
    expect(parseCurrencyInput('1,234.56')).toBe(1234.56) // 英语格式
    expect(parseCurrencyInput('1.234,56')).toBe(1234.56) // 德语格式
    expect(parseCurrencyInput('1 234,56')).toBe(1234.56) // 空格分隔符
  })
})
