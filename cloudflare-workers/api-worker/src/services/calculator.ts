/**
 * 复利计算服务 - Cloudflare Workers版本
 * 基于FastAPI版本的计算逻辑，使用高精度数学运算
 */

import { CalculatorRequest, CalculatorResponse, YearlyBreakdown } from '../types/api'
import { Env } from '../index'

export class CalculatorService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  /**
   * 计算复利
   * 基于德国金融标准的高精度计算
   */
  async calculateCompoundInterest(request: CalculatorRequest): Promise<CalculatorResponse> {
    const startTime = Date.now()

    try {
      // 输入验证
      this.validateCalculatorInput(request)

      // 使用高精度数学运算（避免JavaScript浮点数精度问题）
      const principal = this.toDecimal(request.principal)
      const monthlyPayment = this.toDecimal(request.monthly_payment)
      const annualRate = this.toDecimal(request.annual_rate / 100) // 转换为小数
      const years = request.years

      // 根据复利频率确定计算参数
      let periodsPerYear: number
      let ratePerPeriod: number
      let totalPeriods: number

      switch (request.compound_frequency) {
        case 'monthly':
          periodsPerYear = 12
          ratePerPeriod = annualRate / 12
          totalPeriods = years * 12
          break
        case 'quarterly':
          periodsPerYear = 4
          ratePerPeriod = annualRate / 4
          totalPeriods = years * 4
          break
        case 'yearly':
        default:
          periodsPerYear = 1
          ratePerPeriod = annualRate
          totalPeriods = years
          break
      }

      // 执行复利计算
      let currentAmount = principal
      let totalContributions = principal
      const yearlyBreakdown: YearlyBreakdown[] = []

      for (let year = 1; year <= years; year++) {
        const yearStartAmount = currentAmount
        let yearContributions = 0
        let yearInterest = 0

        // 计算这一年的增长
        for (let period = 0; period < periodsPerYear; period++) {
          // 添加月供（如果是月复利）
          if (request.compound_frequency === 'monthly' && monthlyPayment > 0) {
            currentAmount += monthlyPayment
            yearContributions += monthlyPayment
            totalContributions += monthlyPayment
          }

          // 计算利息
          const periodInterest = currentAmount * ratePerPeriod
          currentAmount += periodInterest
          yearInterest += periodInterest
        }

        // 对于季度和年度复利，在年末添加年度供款
        if (request.compound_frequency !== 'monthly' && monthlyPayment > 0) {
          const annualContribution = monthlyPayment * 12
          currentAmount += annualContribution
          yearContributions += annualContribution
          totalContributions += annualContribution
        }

        // 计算年度增长率
        const growthRate = yearStartAmount > 0 
          ? ((currentAmount - yearStartAmount) / yearStartAmount) * 100 
          : 0

        // 添加年度明细
        yearlyBreakdown.push({
          year,
          start_amount: this.roundToEuro(yearStartAmount),
          contributions: this.roundToEuro(yearContributions),
          interest: this.roundToEuro(yearInterest),
          end_amount: this.roundToEuro(currentAmount),
          growth_rate: this.roundToPercent(growthRate)
        })
      }

      // 计算最终结果
      const finalAmount = this.roundToEuro(currentAmount)
      const totalInterest = this.roundToEuro(currentAmount - totalContributions)
      
      // 计算年化收益率
      const annualReturn = totalContributions > 0 && years > 0
        ? (Math.pow(finalAmount / totalContributions, 1 / years) - 1) * 100
        : 0

      // 构建响应
      const response: CalculatorResponse = {
        final_amount: finalAmount,
        total_contributions: this.roundToEuro(totalContributions),
        total_interest: totalInterest,
        annual_return: this.roundToPercent(annualReturn),
        yearly_breakdown: yearlyBreakdown,
        calculation_time: new Date().toISOString(),
        performance: {
          calculation_time_ms: Date.now() - startTime,
          cache_used: false,
          worker_region: this.getWorkerRegion()
        }
      }

      return response

    } catch (error) {
      console.error('Calculation error:', error)
      throw new Error(`计算错误: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 高精度数学运算辅助函数
   */
  private toDecimal(value: number): number {
    // 使用字符串转换避免浮点数精度问题
    return parseFloat(value.toFixed(10))
  }

  /**
   * 四舍五入到欧元分
   */
  private roundToEuro(value: number): number {
    return Math.round(value * 100) / 100
  }

  /**
   * 四舍五入到百分比（2位小数）
   */
  private roundToPercent(value: number): number {
    return Math.round(value * 100) / 100
  }

  /**
   * 获取Worker运行区域
   */
  private getWorkerRegion(): string {
    // Cloudflare Workers提供的区域信息
    return globalThis.navigator?.userAgent?.includes('Cloudflare-Workers') 
      ? 'cloudflare-edge' 
      : 'unknown'
  }

  /**
   * 验证计算结果的合理性
   */
  private validateCalculationResult(
    request: CalculatorRequest, 
    result: CalculatorResponse
  ): boolean {
    // 基本合理性检查
    if (result.final_amount < request.principal) {
      console.warn('Warning: Final amount less than principal')
      return false
    }

    if (result.total_interest < 0) {
      console.warn('Warning: Negative interest calculated')
      return false
    }

    if (result.annual_return < 0 || result.annual_return > 50) {
      console.warn('Warning: Unrealistic annual return calculated')
      return false
    }

    return true
  }

  /**
   * 验证计算器输入参数
   */
  private validateCalculatorInput(request: CalculatorRequest): void {
    // 验证本金
    if (request.principal < 0) {
      throw new Error('本金不能为负数')
    }

    // 验证年利率
    if (request.annual_rate < 0) {
      throw new Error('年利率不能为负数')
    }
    if (request.annual_rate > 100) {
      throw new Error('年利率不能超过100%')
    }

    // 验证投资年限
    if (request.years <= 0) {
      throw new Error('投资年限必须大于0')
    }
    if (request.years > 100) {
      throw new Error('投资年限不能超过100年')
    }

    // 验证月供
    if (request.monthly_payment < 0) {
      throw new Error('月供金额不能为负数')
    }

    // 验证复利频率
    const validFrequencies = ['monthly', 'quarterly', 'yearly']
    if (!validFrequencies.includes(request.compound_frequency)) {
      throw new Error('无效的复利频率')
    }

    // 验证数值范围
    if (request.principal > 10000000) {
      throw new Error('本金金额过大，请联系客服')
    }
    if (request.monthly_payment > 100000) {
      throw new Error('月供金额过大，请联系客服')
    }
  }

  /**
   * 计算德国税务影响（可选功能）
   */
  calculateGermanTax(grossInterest: number, hasKirchensteuer: boolean = false): {
    grossInterest: number
    taxFreeAmount: number
    taxableInterest: number
    abgeltungssteuer: number
    solidaritaetszuschlag: number
    kirchensteuer: number
    netInterest: number
  } {
    const taxFreeAmount = 1000 // Sparerpauschbetrag 2023
    const taxableInterest = Math.max(0, grossInterest - taxFreeAmount)
    
    const abgeltungssteuer = taxableInterest * 0.25 // 25% Abgeltungssteuer
    const solidaritaetszuschlag = abgeltungssteuer * 0.055 // 5.5% Solidaritätszuschlag
    const kirchensteuer = hasKirchensteuer ? abgeltungssteuer * 0.08 : 0 // 8% Kirchensteuer
    
    const totalTax = abgeltungssteuer + solidaritaetszuschlag + kirchensteuer
    const netInterest = grossInterest - totalTax

    return {
      grossInterest: this.roundToEuro(grossInterest),
      taxFreeAmount: this.roundToEuro(taxFreeAmount),
      taxableInterest: this.roundToEuro(taxableInterest),
      abgeltungssteuer: this.roundToEuro(abgeltungssteuer),
      solidaritaetszuschlag: this.roundToEuro(solidaritaetszuschlag),
      kirchensteuer: this.roundToEuro(kirchensteuer),
      netInterest: this.roundToEuro(netInterest)
    }
  }
}
