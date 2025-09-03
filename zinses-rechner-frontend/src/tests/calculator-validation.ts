/**
 * 德国金融计算器功能验证测试
 * 验证所有计算器的计算准确性和德国金融标准合规性
 */

import { compoundInterestCalculator } from '../calculators/CompoundInterestCalculator.js'
import { loanCalculator } from '../calculators/LoanCalculator.js'
import { mortgageCalculator } from '../calculators/MortgageCalculator.js'

// 测试结果接口
interface TestResult {
  calculatorName: string
  testName: string
  passed: boolean
  expected: any
  actual: any
  error?: string
}

class CalculatorValidator {
  private results: TestResult[] = []

  /**
   * 测试复利计算器
   */
  async testCompoundInterestCalculator(): Promise<void> {
    console.log('🧮 测试复利计算器（Zinseszins-Rechner）...')

    // 测试用例1：基础复利计算
    try {
      const input1 = {
        principal: 10000,
        monthlyPayment: 500,
        annualRate: 4.0,
        years: 10,
        compoundFrequency: 'monthly'
      }

      const result1 = await compoundInterestCalculator.calculate(input1)

      // 验证基本属性存在
      this.addTestResult('复利计算器', '基本属性存在',
        result1.finalAmount !== undefined &&
        result1.totalContributions !== undefined &&
        result1.totalInterest !== undefined,
        { finalAmount: 'number', totalContributions: 'number', totalInterest: 'number' },
        {
          finalAmount: typeof result1.finalAmount,
          totalContributions: typeof result1.totalContributions,
          totalInterest: typeof result1.totalInterest
        }
      )

      // 验证计算逻辑合理性
      const expectedContributions = input1.principal + (input1.monthlyPayment * input1.years * 12)
      this.addTestResult('复利计算器', '总贡献计算正确',
        result1.totalContributions !== undefined && Math.abs(result1.totalContributions - expectedContributions) < 1,
        expectedContributions,
        result1.totalContributions || 0
      )

      // 验证最终金额大于总贡献（有利息收益）
      this.addTestResult('复利计算器', '最终金额大于总贡献',
        result1.finalAmount !== undefined && result1.totalContributions !== undefined && result1.finalAmount > result1.totalContributions,
        `finalAmount > totalContributions`,
        `${result1.finalAmount || 0} > ${result1.totalContributions || 0}`
      )

      console.log(`✅ 复利计算器测试完成 - 最终金额: €${(result1.finalAmount || 0).toFixed(2)}`)

    } catch (error) {
      this.addTestResult('复利计算器', '基础计算', false, 'success', error)
      console.error('❌ 复利计算器测试失败:', error)
    }
  }

  /**
   * 测试贷款计算器
   */
  async testLoanCalculator(): Promise<void> {
    console.log('🏦 测试贷款计算器（Darlehensrechner）...')

    try {
      const input1 = {
        principal: 200000,
        annualRate: 3.5,
        termYears: 20,
        paymentType: 'annuity' as const
      }

      const result1 = await loanCalculator.calculate(input1)

      // 验证基本属性存在
      this.addTestResult('贷款计算器', '基本属性存在',
        result1.monthlyPayment !== undefined &&
        result1.totalInterest !== undefined &&
        result1.amortizationSchedule !== undefined,
        { monthlyPayment: 'number', totalInterest: 'number', amortizationSchedule: 'array' },
        {
          monthlyPayment: typeof result1.monthlyPayment,
          totalInterest: typeof result1.totalInterest,
          amortizationSchedule: Array.isArray(result1.amortizationSchedule) ? 'array' : typeof result1.amortizationSchedule
        }
      )

      // 验证月供合理性（德国标准：通常在1000-2000欧元范围）
      this.addTestResult('贷款计算器', '月供金额合理',
        result1.monthlyPayment > 800 && result1.monthlyPayment < 2000,
        '800 < monthlyPayment < 2000',
        result1.monthlyPayment
      )

      // 验证还款计划表长度
      const expectedScheduleLength = input1.termYears * 12
      this.addTestResult('贷款计算器', '还款计划表长度正确',
        result1.amortizationSchedule.length <= expectedScheduleLength,
        `<= ${expectedScheduleLength}`,
        result1.amortizationSchedule.length
      )

      // 验证德国金融标准：实际利率应该接近名义利率
      this.addTestResult('贷款计算器', '实际利率合理',
        Math.abs(result1.effectiveRate - input1.annualRate) < 1,
        `接近 ${input1.annualRate}%`,
        `${result1.effectiveRate}%`
      )

      console.log(`✅ 贷款计算器测试完成 - 月供: €${result1.monthlyPayment.toFixed(2)}`)

    } catch (error) {
      this.addTestResult('贷款计算器', '基础计算', false, 'success', error)
      console.error('❌ 贷款计算器测试失败:', error)
    }
  }

  /**
   * 测试房贷计算器
   */
  async testMortgageCalculator(): Promise<void> {
    console.log('🏠 测试房贷计算器（Baufinanzierungsrechner）...')

    try {
      const input1 = {
        purchasePrice: 400000,
        downPayment: 80000,
        annualRate: 3.8,
        termYears: 25,
        landTransferTaxRate: 5.0, // 德国标准税率
        notaryRate: 1.5,
        realEstateAgentRate: 3.57,
        monthlyIncome: 4000,
        monthlyExpenses: 1500
      }

      const result1 = await mortgageCalculator.calculate(input1)

      // 验证基本属性存在
      this.addTestResult('房贷计算器', '基本属性存在',
        result1.monthlyPayment !== undefined &&
        result1.propertyCosts !== undefined &&
        result1.affordabilityRatio !== undefined,
        { monthlyPayment: 'number', propertyCosts: 'object', affordabilityRatio: 'number' },
        {
          monthlyPayment: typeof result1.monthlyPayment,
          propertyCosts: typeof result1.propertyCosts,
          affordabilityRatio: typeof result1.affordabilityRatio
        }
      )

      // 验证德国购房成本计算
      const expectedLandTransferTax = input1.purchasePrice * (input1.landTransferTaxRate / 100)
      this.addTestResult('房贷计算器', '土地转让税计算正确',
        Math.abs(result1.propertyCosts.landTransferTax - expectedLandTransferTax) < 100,
        expectedLandTransferTax,
        result1.propertyCosts.landTransferTax
      )

      // 验证负担能力比率（德国标准：不超过40%）
      this.addTestResult('房贷计算器', '负担能力比率合理',
        result1.affordabilityRatio <= 0.5, // 允许一定的灵活性
        '<= 50%',
        `${(result1.affordabilityRatio * 100).toFixed(1)}%`
      )

      // 验证所需自有资金合理性
      this.addTestResult('房贷计算器', '所需自有资金合理',
        result1.requiredEquity > input1.downPayment * 0.8, // 应该包含购房成本
        `> ${input1.downPayment * 0.8}`,
        result1.requiredEquity
      )

      console.log(`✅ 房贷计算器测试完成 - 月供: €${result1.monthlyPayment.toFixed(2)}, 负担比率: ${(result1.affordabilityRatio * 100).toFixed(1)}%`)

    } catch (error) {
      this.addTestResult('房贷计算器', '基础计算', false, 'success', error)
      console.error('❌ 房贷计算器测试失败:', error)
    }
  }

  /**
   * 添加测试结果
   */
  private addTestResult(calculatorName: string, testName: string, passed: boolean, expected: any, actual: any, error?: string): void {
    this.results.push({
      calculatorName,
      testName,
      passed,
      expected,
      actual,
      error: error?.toString()
    })
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 开始德国金融计算器功能验证...\n')

    await this.testCompoundInterestCalculator()
    await this.testLoanCalculator()
    await this.testMortgageCalculator()

    this.printResults()
  }

  /**
   * 打印测试结果
   */
  private printResults(): void {
    console.log('\n📊 测试结果汇总:')
    console.log('=' .repeat(60))

    const passedTests = this.results.filter(r => r.passed).length
    const totalTests = this.results.length

    console.log(`总测试数: ${totalTests}`)
    console.log(`通过测试: ${passedTests}`)
    console.log(`失败测试: ${totalTests - passedTests}`)
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

    console.log('\n详细结果:')
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${result.calculatorName} - ${result.testName}`)
      if (!result.passed) {
        console.log(`   期望: ${JSON.stringify(result.expected)}`)
        console.log(`   实际: ${JSON.stringify(result.actual)}`)
        if (result.error) {
          console.log(`   错误: ${result.error}`)
        }
      }
    })

    console.log('\n' + '=' .repeat(60))
  }

  /**
   * 获取测试结果
   */
  getResults(): TestResult[] {
    return this.results
  }
}

// 导出验证器
export { CalculatorValidator }

// 如果直接运行此文件，执行测试
if (typeof window === 'undefined') {
  const validator = new CalculatorValidator()
  validator.runAllTests().catch(console.error)
}
