/**
 * 计算器专用验证规则
 * 为德国利息计算器提供专门的验证规则和业务逻辑验证
 */

// 暂时注释掉导入以修复启动问题
// import { ValidationRule, ValidationResult, FieldConfig } from './ValidationEngine'
// import { parseCurrencyInput, parsePercentageInput, formatCurrency } from '@/utils/formatters'

/**
 * 计算器字段验证规则集合
 */
export class CalculatorValidationRules {

  /**
   * 初始金额验证规则
   */
  static createInitialAmountRule(): ValidationRule {
    return {
      name: 'initial-amount-validation',
      priority: 2,
      validator: (value: any) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value === null || value === undefined || value === '') {
          return result
        }

        const numericValue = typeof value === 'string' ? parseCurrencyInput(value) : value

        // 检查最小值
        if (numericValue < 0) {
          result.isValid = false
          result.errors.push({
            field: 'initialAmount',
            code: 'NEGATIVE_INITIAL_AMOUNT',
            message: '初始金额不能为负数',
            severity: 'error'
          })
        }

        // 检查合理性
        if (numericValue > 10000000) { // 1000万欧元
          result.warnings.push({
            field: 'initialAmount',
            code: 'VERY_HIGH_INITIAL_AMOUNT',
            message: '初始金额非常高，请确认输入是否正确',
            suggestion: '大多数个人投资的初始金额在1万到100万欧元之间'
          })
        }

        // 提供优化建议
        if (numericValue > 0 && numericValue < 100) {
          result.suggestions.push({
            field: 'initialAmount',
            type: 'optimization',
            message: '初始金额较小，可能影响复利效果',
            confidence: 0.6
          })
        }

        // 推荐常见金额
        if (numericValue === 0) {
          result.suggestions.push({
            field: 'initialAmount',
            type: 'alternative',
            message: '推荐常见的初始投资金额',
            suggestedValue: 10000,
            confidence: 0.5
          })
        }

        return result
      }
    }
  }

  /**
   * 月度投入验证规则
   */
  static createMonthlyAmountRule(): ValidationRule {
    return {
      name: 'monthly-amount-validation',
      priority: 2,
      validator: (value: any, context?: any) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value === null || value === undefined || value === '') {
          return result
        }

        const numericValue = typeof value === 'string' ? parseCurrencyInput(value) : value

        // 检查最小值
        if (numericValue < 0) {
          result.isValid = false
          result.errors.push({
            field: 'monthlyAmount',
            code: 'NEGATIVE_MONTHLY_AMOUNT',
            message: '月度投入不能为负数',
            severity: 'error'
          })
        }

        // 检查合理性
        if (numericValue > 50000) { // 5万欧元/月
          result.warnings.push({
            field: 'monthlyAmount',
            code: 'VERY_HIGH_MONTHLY_AMOUNT',
            message: '月度投入金额非常高，请确认输入是否正确',
            suggestion: '大多数个人的月度投资在50到5000欧元之间'
          })
        }

        // 与初始金额的比例检查
        if (context?.allFields?.initialAmount) {
          const initialAmount = typeof context.allFields.initialAmount === 'string'
            ? parseCurrencyInput(context.allFields.initialAmount)
            : context.allFields.initialAmount

          if (numericValue > initialAmount * 2) {
            result.warnings.push({
              field: 'monthlyAmount',
              code: 'HIGH_MONTHLY_VS_INITIAL',
              message: '月度投入远高于初始金额，这种投资模式较为少见',
              suggestion: '请确认投资策略是否正确'
            })
          }
        }

        // 提供优化建议
        if (numericValue > 0 && numericValue < 25) {
          result.suggestions.push({
            field: 'monthlyAmount',
            type: 'optimization',
            message: '月度投入较小，可以考虑增加投入以获得更好的复利效果',
            confidence: 0.7
          })
        }

        return result
      }
    }
  }

  /**
   * 年利率验证规则
   */
  static createAnnualRateRule(): ValidationRule {
    return {
      name: 'annual-rate-validation',
      priority: 2,
      validator: (value: any) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value === null || value === undefined || value === '') {
          return result
        }

        const numericValue = typeof value === 'string' ? parsePercentageInput(value) : value

        // 检查最小值
        if (numericValue < 0) {
          result.warnings.push({
            field: 'annualRate',
            code: 'NEGATIVE_INTEREST_RATE',
            message: '负利率在当前经济环境下可能存在，但请确认输入',
            suggestion: '负利率会导致投资价值下降'
          })
        }

        // 检查合理性
        if (numericValue > 25) {
          result.warnings.push({
            field: 'annualRate',
            code: 'VERY_HIGH_INTEREST_RATE',
            message: '年利率超过25%，这在传统投资中极为罕见',
            suggestion: '请确认利率输入是否正确，或者是否为高风险投资'
          })
        }

        // 德国市场的合理利率建议
        if (numericValue > 0 && numericValue < 0.5) {
          result.suggestions.push({
            field: 'annualRate',
            type: 'optimization',
            message: '利率非常低，可能无法跑赢通胀',
            confidence: 0.8
          })
        }

        if (numericValue >= 0.5 && numericValue <= 2) {
          result.suggestions.push({
            field: 'annualRate',
            type: 'optimization',
            message: '这个利率水平适合保守型投资（如定期存款）',
            confidence: 0.9
          })
        }

        if (numericValue > 2 && numericValue <= 8) {
          result.suggestions.push({
            field: 'annualRate',
            type: 'optimization',
            message: '这个利率水平适合中等风险投资（如ETF、基金）',
            confidence: 0.9
          })
        }

        if (numericValue > 8 && numericValue <= 15) {
          result.suggestions.push({
            field: 'annualRate',
            type: 'optimization',
            message: '这个利率水平通常对应较高风险投资',
            confidence: 0.8
          })
        }

        return result
      }
    }
  }

  /**
   * 投资年限验证规则
   */
  static createInvestmentYearsRule(): ValidationRule {
    return {
      name: 'investment-years-validation',
      priority: 2,
      validator: (value: any) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value === null || value === undefined || value === '') {
          return result
        }

        const numericValue = typeof value === 'string' ? parseCurrencyInput(value) : value

        // 检查最小值
        if (numericValue <= 0) {
          result.isValid = false
          result.errors.push({
            field: 'investmentYears',
            code: 'INVALID_INVESTMENT_YEARS',
            message: '投资年限必须大于0',
            severity: 'error'
          })
        }

        // 检查是否为整数
        if (!Number.isInteger(numericValue)) {
          result.warnings.push({
            field: 'investmentYears',
            code: 'NON_INTEGER_YEARS',
            message: '投资年限通常为整数',
            suggestion: `建议使用 ${Math.round(numericValue)} 年`
          })

          result.suggestions.push({
            field: 'investmentYears',
            type: 'correction',
            message: '自动修正为整数年',
            suggestedValue: Math.round(numericValue),
            confidence: 0.9
          })
        }

        // 检查合理性
        if (numericValue > 100) {
          result.warnings.push({
            field: 'investmentYears',
            code: 'VERY_LONG_INVESTMENT_PERIOD',
            message: '投资期限超过100年，这在实际中不太可能',
            suggestion: '请确认投资年限是否正确'
          })
        }

        // 提供投资期限建议
        if (numericValue < 1) {
          result.suggestions.push({
            field: 'investmentYears',
            type: 'optimization',
            message: '投资期限太短，复利效果有限',
            confidence: 0.8
          })
        }

        if (numericValue >= 1 && numericValue <= 5) {
          result.suggestions.push({
            field: 'investmentYears',
            type: 'optimization',
            message: '短期投资（1-5年），适合保守型投资策略',
            confidence: 0.7
          })
        }

        if (numericValue > 5 && numericValue <= 15) {
          result.suggestions.push({
            field: 'investmentYears',
            type: 'optimization',
            message: '中期投资（5-15年），复利效果开始显现',
            confidence: 0.8
          })
        }

        if (numericValue > 15) {
          result.suggestions.push({
            field: 'investmentYears',
            type: 'optimization',
            message: '长期投资（15年以上），复利效果显著，适合退休规划',
            confidence: 0.9
          })
        }

        return result
      }
    }
  }

  /**
   * 税率验证规则（德国税收）
   */
  static createTaxRateRule(): ValidationRule {
    return {
      name: 'tax-rate-validation',
      priority: 2,
      validator: (value: any) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value === null || value === undefined || value === '') {
          return result
        }

        const numericValue = typeof value === 'string' ? parsePercentageInput(value) : value

        // 检查范围
        if (numericValue < 0 || numericValue > 100) {
          result.isValid = false
          result.errors.push({
            field: 'taxRate',
            code: 'INVALID_TAX_RATE_RANGE',
            message: '税率必须在0-100%之间',
            severity: 'error'
          })
        }

        // 德国资本利得税的标准税率检查
        const germanCapitalGainsTax = 26.375 // 25% + 5.5% 团结税 + 约0.875% 平均教会税

        if (Math.abs(numericValue - germanCapitalGainsTax) < 1) {
          result.suggestions.push({
            field: 'taxRate',
            type: 'optimization',
            message: '这接近德国标准资本利得税率（含团结税和教会税）',
            confidence: 0.9
          })
        }

        if (numericValue === 25) {
          result.suggestions.push({
            field: 'taxRate',
            type: 'optimization',
            message: '这是德国基础资本利得税率，还需考虑团结税(5.5%)和可能的教会税',
            confidence: 0.95
          })
        }

        if (numericValue > 50) {
          result.warnings.push({
            field: 'taxRate',
            code: 'VERY_HIGH_TAX_RATE',
            message: '税率超过50%，这在德国资本利得税中不常见',
            suggestion: '请确认税率是否正确'
          })
        }

        return result
      }
    }
  }

  /**
   * 通胀率验证规则
   */
  static createInflationRateRule(): ValidationRule {
    return {
      name: 'inflation-rate-validation',
      priority: 2,
      validator: (value: any) => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value === null || value === undefined || value === '') {
          return result
        }

        const numericValue = typeof value === 'string' ? parsePercentageInput(value) : value

        // 检查合理性
        if (numericValue < -5 || numericValue > 20) {
          result.warnings.push({
            field: 'inflationRate',
            code: 'UNUSUAL_INFLATION_RATE',
            message: '通胀率超出常见范围（-5%到20%）',
            suggestion: '请确认通胀率输入是否正确'
          })
        }

        // 德国历史通胀率建议
        if (numericValue >= 1.5 && numericValue <= 3) {
          result.suggestions.push({
            field: 'inflationRate',
            type: 'optimization',
            message: '这个通胀率符合欧洲央行的目标范围（约2%）',
            confidence: 0.9
          })
        }

        if (numericValue > 5) {
          result.warnings.push({
            field: 'inflationRate',
            code: 'HIGH_INFLATION_RATE',
            message: '高通胀率会显著影响投资的实际收益',
            suggestion: '在高通胀环境下，需要更高的投资回报率来保值'
          })
        }

        if (numericValue < 0) {
          result.suggestions.push({
            field: 'inflationRate',
            type: 'optimization',
            message: '负通胀（通缩）会增加投资的实际价值',
            confidence: 0.8
          })
        }

        return result
      }
    }
  }

  /**
   * 获取所有计算器验证规则
   */
  static getAllRules(): Record<string, ValidationRule[]> {
    return {
      initialAmount: [this.createInitialAmountRule()],
      monthlyAmount: [this.createMonthlyAmountRule()],
      annualRate: [this.createAnnualRateRule()],
      investmentYears: [this.createInvestmentYearsRule()],
      taxRate: [this.createTaxRateRule()],
      inflationRate: [this.createInflationRateRule()]
    }
  }

  /**
   * 获取计算器字段配置
   */
  static getFieldConfigs(): Record<string, FieldConfig> {
    return {
      initialAmount: {
        name: 'initialAmount',
        type: 'currency',
        required: false,
        min: 0,
        max: 100000000,
        customRules: [this.createInitialAmountRule()]
      },
      monthlyAmount: {
        name: 'monthlyAmount',
        type: 'currency',
        required: false,
        min: 0,
        max: 100000,
        customRules: [this.createMonthlyAmountRule()],
        dependsOn: ['initialAmount']
      },
      annualRate: {
        name: 'annualRate',
        type: 'percentage',
        required: true,
        min: -10,
        max: 50,
        customRules: [this.createAnnualRateRule()]
      },
      investmentYears: {
        name: 'investmentYears',
        type: 'integer',
        required: true,
        min: 1,
        max: 100,
        customRules: [this.createInvestmentYearsRule()]
      },
      taxRate: {
        name: 'taxRate',
        type: 'percentage',
        required: false,
        min: 0,
        max: 100,
        customRules: [this.createTaxRateRule()]
      },
      inflationRate: {
        name: 'inflationRate',
        type: 'percentage',
        required: false,
        min: -10,
        max: 30,
        customRules: [this.createInflationRateRule()]
      }
    }
  }
}

// 导出便捷函数
export const getCalculatorValidationRules = () => CalculatorValidationRules.getAllRules()
export const getCalculatorFieldConfigs = () => CalculatorValidationRules.getFieldConfigs()
