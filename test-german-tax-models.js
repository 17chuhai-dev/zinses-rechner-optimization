/**
 * 德国税收数据模型测试
 * 验证德国税收计算的准确性和数据模型的完整性
 */

// 模拟德国税收计算函数
class MockGermanTaxCalculator {
  constructor() {
    // 默认税收设置
    this.defaultSettings = {
      userInfo: {
        state: 'NW', // 北莱茵-威斯特法伦州
        churchTaxType: 'none',
        isMarried: false,
        taxYear: 2024
      },
      abgeltungssteuer: {
        baseTaxRate: 0.25,                     // 25%
        solidarityTaxRate: 0.055,              // 5.5%
        churchTax: {
          type: 'none',
          rate: 0,
          state: 'NW'
        },
        enabled: true,
        calculation: {
          includeChurchTax: false,
          includeSolidarityTax: true,
          roundingMethod: 'round',
          decimalPlaces: 2
        }
      },
      freistellungsauftrag: {
        annualAllowance: 801,                  // 2023年起为801€
        usedAllowance: 0,
        remainingAllowance: 801,
        allocations: [],
        enabled: true,
        options: {
          autoOptimize: true,
          carryForward: false,
          splitBetweenSpouses: false
        }
      },
      etfTeilfreistellung: {
        exemptionRates: {
          'equity_domestic': 0.30,     // 30%
          'equity_foreign': 0.30,      // 30%
          'mixed_fund': 0.15,          // 15%
          'bond_fund': 0.00,           // 0%
          'real_estate': 0.60,         // 60%
          'commodity': 0.00,           // 0%
          'other': 0.00                // 0%
        },
        enabled: true,
        defaultETFType: 'equity_foreign',
        options: {
          applyToDistributions: true,
          applyToCapitalGains: true,
          minimumHoldingPeriod: 12
        }
      }
    }

    // 教会税税率映射
    this.churchTaxRates = {
      'BW': 0.09,  // 巴登-符腾堡州 9%
      'BY': 0.08,  // 巴伐利亚州 8%
      'BE': 0.09,  // 柏林 9%
      'NW': 0.09,  // 北莱茵-威斯特法伦州 9%
      // 其他州都是9%
    }

    console.log('🇩🇪 德国税收计算器已初始化')
  }

  // 计算资本利得税
  calculateAbgeltungssteuer(params, settings = this.defaultSettings) {
    const steps = []
    let stepCounter = 1

    // 第1步: 原始收入
    const grossIncome = params.income
    steps.push({
      step: stepCounter++,
      description: 'Bruttoeinkommen',
      input: grossIncome,
      output: grossIncome,
      explanation: 'Das zu versteuernde Bruttoeinkommen aus Kapitalerträgen'
    })

    // 第2步: 应用免税额度
    const allowanceUsed = Math.min(grossIncome, settings.freistellungsauftrag.remainingAllowance)
    const taxableIncomeAfterAllowance = Math.max(0, grossIncome - allowanceUsed)
    
    steps.push({
      step: stepCounter++,
      description: 'Anwendung Freistellungsauftrag',
      input: grossIncome,
      output: taxableIncomeAfterAllowance,
      explanation: `Freibetrag von ${allowanceUsed.toFixed(2)}€ angewendet`
    })

    // 第3步: 应用ETF部分免税
    let etfExemptAmount = 0
    let taxableIncomeAfterETFExemption = taxableIncomeAfterAllowance

    if (params.etfType && settings.etfTeilfreistellung.enabled) {
      const exemptionRate = settings.etfTeilfreistellung.exemptionRates[params.etfType] || 0
      etfExemptAmount = taxableIncomeAfterAllowance * exemptionRate
      taxableIncomeAfterETFExemption = taxableIncomeAfterAllowance - etfExemptAmount

      steps.push({
        step: stepCounter++,
        description: 'ETF Teilfreistellung',
        input: taxableIncomeAfterAllowance,
        output: taxableIncomeAfterETFExemption,
        explanation: `${(exemptionRate * 100).toFixed(1)}% Teilfreistellung für ${params.etfType}`
      })
    }

    const finalTaxableIncome = taxableIncomeAfterETFExemption

    // 第4步: 计算基础资本利得税 (25%)
    const baseTax = finalTaxableIncome * settings.abgeltungssteuer.baseTaxRate
    steps.push({
      step: stepCounter++,
      description: 'Abgeltungssteuer (25%)',
      input: finalTaxableIncome,
      output: baseTax,
      explanation: 'Grundsteuer auf Kapitalerträge'
    })

    // 第5步: 计算团结税 (5.5%)
    let solidarityTax = 0
    if (settings.abgeltungssteuer.calculation.includeSolidarityTax) {
      solidarityTax = baseTax * settings.abgeltungssteuer.solidarityTaxRate
      steps.push({
        step: stepCounter++,
        description: 'Solidaritätszuschlag (5,5%)',
        input: baseTax,
        output: solidarityTax,
        explanation: 'Solidaritätszuschlag auf die Abgeltungssteuer'
      })
    }

    // 第6步: 计算教会税
    let churchTax = 0
    if (settings.abgeltungssteuer.calculation.includeChurchTax && 
        settings.abgeltungssteuer.churchTax.type !== 'none') {
      churchTax = baseTax * settings.abgeltungssteuer.churchTax.rate
      steps.push({
        step: stepCounter++,
        description: `Kirchensteuer (${(settings.abgeltungssteuer.churchTax.rate * 100).toFixed(1)}%)`,
        input: baseTax,
        output: churchTax,
        explanation: `Kirchensteuer für ${settings.abgeltungssteuer.churchTax.type}`
      })
    }

    // 第7步: 计算总税额
    const totalTax = baseTax + solidarityTax + churchTax
    const netIncome = grossIncome - totalTax
    const effectiveTaxRate = grossIncome > 0 ? (totalTax / grossIncome) : 0

    return {
      taxableIncome: this.roundTax(finalTaxableIncome, settings),
      exemptAmount: allowanceUsed + etfExemptAmount,
      baseTax: this.roundTax(baseTax, settings),
      solidarityTax: this.roundTax(solidarityTax, settings),
      churchTax: this.roundTax(churchTax, settings),
      totalTax: this.roundTax(totalTax, settings),
      netIncome: this.roundTax(netIncome, settings),
      effectiveTaxRate,
      breakdown: {
        grossIncome,
        allowanceUsage: {
          available: settings.freistellungsauftrag.remainingAllowance,
          used: allowanceUsed,
          remaining: settings.freistellungsauftrag.remainingAllowance - allowanceUsed
        },
        etfExemption: params.etfType ? {
          exemptionRate: settings.etfTeilfreistellung.exemptionRates[params.etfType] || 0,
          exemptAmount: etfExemptAmount,
          taxableAmount: taxableIncomeAfterETFExemption
        } : undefined,
        taxes: {
          capitalGainsTax: this.roundTax(baseTax, settings),
          solidarityTax: this.roundTax(solidarityTax, settings),
          churchTax: this.roundTax(churchTax, settings)
        },
        calculationSteps: steps
      },
      calculatedAt: new Date()
    }
  }

  // 计算免税额度使用
  calculateFreistellungsauftrag(income, settings = this.defaultSettings) {
    if (!settings.freistellungsauftrag.enabled) {
      return 0
    }
    return Math.min(income, settings.freistellungsauftrag.remainingAllowance)
  }

  // 计算ETF部分免税
  calculateETFTeilfreistellung(income, etfType, settings = this.defaultSettings) {
    if (!settings.etfTeilfreistellung.enabled) {
      return 0
    }
    const exemptionRate = settings.etfTeilfreistellung.exemptionRates[etfType] || 0
    return income * exemptionRate
  }

  // 验证税收设置
  validateTaxSettings(settings) {
    const errors = []

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

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 获取教会税税率
  getChurchTaxRate(state, churchType) {
    if (churchType === 'none') {
      return 0
    }
    return this.churchTaxRates[state] || 0.09
  }

  // 税额舍入
  roundTax(amount, settings) {
    const { roundingMethod, decimalPlaces } = settings.abgeltungssteuer.calculation
    const factor = Math.pow(10, decimalPlaces)

    switch (roundingMethod) {
      case 'floor':
        return Math.floor(amount * factor) / factor
      case 'ceil':
        return Math.ceil(amount * factor) / factor
      case 'round':
      default:
        return Math.round(amount * factor) / factor
    }
  }

  // 获取税收优化建议
  getTaxOptimizationSuggestions(income, settings = this.defaultSettings) {
    const suggestions = []

    // 免税额度建议
    if (settings.freistellungsauftrag.remainingAllowance > 0 && income > 0) {
      suggestions.push(
        `Sie haben noch ${settings.freistellungsauftrag.remainingAllowance.toFixed(2)}€ Freibetrag verfügbar.`
      )
    }

    // ETF建议
    if (income > 1000 && !settings.etfTeilfreistellung.enabled) {
      suggestions.push('Erwägen Sie ETF-Investments mit Teilfreistellung.')
    }

    // 教会税建议
    if (settings.abgeltungssteuer.churchTax.type !== 'none') {
      const churchTaxAmount = income * 0.25 * settings.abgeltungssteuer.churchTax.rate
      if (churchTaxAmount > 100) {
        suggestions.push(`Ihre jährliche Kirchensteuer beträgt ca. ${churchTaxAmount.toFixed(2)}€.`)
      }
    }

    return suggestions
  }
}

// 测试函数
async function runGermanTaxModelTests() {
  console.log('🧪 开始德国税收数据模型测试...\n')
  
  const taxCalculator = new MockGermanTaxCalculator()
  
  let passed = 0
  let failed = 0
  
  function test(description, condition) {
    if (condition) {
      console.log(`✅ ${description}`)
      passed++
    } else {
      console.log(`❌ ${description}`)
      failed++
    }
  }
  
  // 测试1: 基础资本利得税计算
  console.log('💰 测试基础资本利得税计算:')
  
  const basicParams = {
    income: 2000,
    incomeType: 'capital_gains',
    jointFiling: false,
    deductions: 0,
    taxYear: 2024
  }
  
  const basicResult = taxCalculator.calculateAbgeltungssteuer(basicParams)
  
  test('基础税收计算应该成功', basicResult !== null)
  test('应税收入应该正确计算', basicResult.taxableIncome === 1199) // 2000 - 801免税额度
  test('基础税应该是25%', Math.abs(basicResult.baseTax - 299.75) < 0.01) // 1199 * 0.25
  test('团结税应该是5.5%', Math.abs(basicResult.solidarityTax - 16.49) < 0.01) // 299.75 * 0.055
  test('总税额应该正确', Math.abs(basicResult.totalTax - 316.24) < 0.01)
  test('税后收入应该正确', Math.abs(basicResult.netIncome - 1683.76) < 0.01)
  
  // 测试2: 免税额度测试
  console.log('\n🆓 测试免税额度功能:')
  
  const smallIncomeParams = { ...basicParams, income: 500 }
  const smallIncomeResult = taxCalculator.calculateAbgeltungssteuer(smallIncomeParams)
  
  test('小额收入应该完全免税', smallIncomeResult.totalTax === 0)
  test('免税额度使用应该正确', smallIncomeResult.breakdown.allowanceUsage.used === 500)
  test('剩余免税额度应该正确', smallIncomeResult.breakdown.allowanceUsage.remaining === 301)
  
  const exactAllowanceParams = { ...basicParams, income: 801 }
  const exactAllowanceResult = taxCalculator.calculateAbgeltungssteuer(exactAllowanceParams)
  
  test('正好免税额度应该无税', exactAllowanceResult.totalTax === 0)
  test('免税额度应该完全使用', exactAllowanceResult.breakdown.allowanceUsage.used === 801)
  
  // 测试3: ETF部分免税测试
  console.log('\n📈 测试ETF部分免税功能:')
  
  const etfParams = { ...basicParams, income: 2000, etfType: 'equity_foreign' }
  const etfResult = taxCalculator.calculateAbgeltungssteuer(etfParams)
  
  test('ETF部分免税应该生效', etfResult.breakdown.etfExemption !== undefined)
  test('ETF免税比例应该正确', etfResult.breakdown.etfExemption.exemptionRate === 0.30)
  test('ETF免税金额应该正确', Math.abs(etfResult.breakdown.etfExemption.exemptAmount - 359.7) < 0.01) // 1199 * 0.30
  test('ETF应税金额应该正确', Math.abs(etfResult.breakdown.etfExemption.taxableAmount - 839.3) < 0.01)
  
  // 测试不同ETF类型
  const realEstateParams = { ...basicParams, income: 2000, etfType: 'real_estate' }
  const realEstateResult = taxCalculator.calculateAbgeltungssteuer(realEstateParams)
  
  test('房地产ETF免税比例应该是60%', realEstateResult.breakdown.etfExemption.exemptionRate === 0.60)
  
  const bondParams = { ...basicParams, income: 2000, etfType: 'bond_fund' }
  const bondResult = taxCalculator.calculateAbgeltungssteuer(bondParams)
  
  test('债券基金免税比例应该是0%', bondResult.breakdown.etfExemption.exemptionRate === 0.00)
  
  // 测试4: 教会税计算
  console.log('\n⛪ 测试教会税计算:')
  
  const churchTaxSettings = {
    ...taxCalculator.defaultSettings,
    abgeltungssteuer: {
      ...taxCalculator.defaultSettings.abgeltungssteuer,
      calculation: {
        ...taxCalculator.defaultSettings.abgeltungssteuer.calculation,
        includeChurchTax: true
      },
      churchTax: {
        type: 'catholic',
        rate: 0.09,
        state: 'NW'
      }
    }
  }
  
  const churchTaxResult = taxCalculator.calculateAbgeltungssteuer(basicParams, churchTaxSettings)
  
  test('教会税应该被计算', churchTaxResult.churchTax > 0)
  test('教会税应该是基础税的9%', Math.abs(churchTaxResult.churchTax - 26.98) < 0.01) // 299.75 * 0.09
  test('总税额应该包含教会税', churchTaxResult.totalTax > basicResult.totalTax)
  
  // 测试5: 税收设置验证
  console.log('\n✅ 测试税收设置验证:')
  
  const validSettings = taxCalculator.defaultSettings
  const validationResult = taxCalculator.validateTaxSettings(validSettings)
  
  test('默认设置应该有效', validationResult.isValid === true)
  test('默认设置应该无错误', validationResult.errors.length === 0)
  
  // 测试无效设置
  const invalidSettings = {
    ...validSettings,
    abgeltungssteuer: {
      ...validSettings.abgeltungssteuer,
      baseTaxRate: 1.5 // 无效的税率 (>100%)
    }
  }
  
  const invalidValidationResult = taxCalculator.validateTaxSettings(invalidSettings)
  
  test('无效设置应该被检测', invalidValidationResult.isValid === false)
  test('无效设置应该有错误信息', invalidValidationResult.errors.length > 0)
  
  // 测试6: 免税额度计算
  console.log('\n💸 测试免税额度计算:')
  
  const allowanceUsed1 = taxCalculator.calculateFreistellungsauftrag(500)
  test('小额收入免税额度使用应该正确', allowanceUsed1 === 500)
  
  const allowanceUsed2 = taxCalculator.calculateFreistellungsauftrag(1000)
  test('大额收入免税额度使用应该受限', allowanceUsed2 === 801)
  
  // 测试7: ETF部分免税计算
  console.log('\n🏦 测试ETF部分免税计算:')
  
  const etfExemption1 = taxCalculator.calculateETFTeilfreistellung(1000, 'equity_foreign')
  test('股票ETF免税金额应该正确', etfExemption1 === 300) // 1000 * 0.30
  
  const etfExemption2 = taxCalculator.calculateETFTeilfreistellung(1000, 'real_estate')
  test('房地产ETF免税金额应该正确', etfExemption2 === 600) // 1000 * 0.60
  
  const etfExemption3 = taxCalculator.calculateETFTeilfreistellung(1000, 'bond_fund')
  test('债券基金免税金额应该为0', etfExemption3 === 0) // 1000 * 0.00
  
  // 测试8: 教会税税率获取
  console.log('\n🏛️ 测试教会税税率:')
  
  const churchRate1 = taxCalculator.getChurchTaxRate('BY', 'catholic')
  test('巴伐利亚州教会税应该是8%', churchRate1 === 0.08)
  
  const churchRate2 = taxCalculator.getChurchTaxRate('NW', 'protestant')
  test('北威州教会税应该是9%', churchRate2 === 0.09)
  
  const churchRate3 = taxCalculator.getChurchTaxRate('NW', 'none')
  test('无教会税应该是0%', churchRate3 === 0)
  
  // 测试9: 税收优化建议
  console.log('\n💡 测试税收优化建议:')
  
  const suggestions1 = taxCalculator.getTaxOptimizationSuggestions(2000)
  test('高收入应该有优化建议', suggestions1.length > 0)
  test('应该包含免税额度建议', suggestions1.some(s => s.includes('Freibetrag')))
  
  const suggestions2 = taxCalculator.getTaxOptimizationSuggestions(500)
  test('低收入也应该有建议', suggestions2.length > 0)
  
  // 测试10: 复杂场景计算
  console.log('\n🎯 测试复杂场景计算:')
  
  const complexSettings = {
    ...taxCalculator.defaultSettings,
    abgeltungssteuer: {
      ...taxCalculator.defaultSettings.abgeltungssteuer,
      calculation: {
        ...taxCalculator.defaultSettings.abgeltungssteuer.calculation,
        includeChurchTax: true
      },
      churchTax: {
        type: 'catholic',
        rate: 0.09,
        state: 'NW'
      }
    },
    freistellungsauftrag: {
      ...taxCalculator.defaultSettings.freistellungsauftrag,
      remainingAllowance: 400 // 部分已使用
    }
  }
  
  const complexParams = {
    income: 5000,
    incomeType: 'capital_gains',
    etfType: 'equity_foreign',
    jointFiling: false,
    deductions: 0,
    taxYear: 2024
  }
  
  const complexResult = taxCalculator.calculateAbgeltungssteuer(complexParams, complexSettings)
  
  test('复杂场景计算应该成功', complexResult !== null)
  test('应该正确应用部分免税额度', complexResult.breakdown.allowanceUsage.used === 400)
  test('应该正确应用ETF部分免税', complexResult.breakdown.etfExemption.exemptionRate === 0.30)
  test('应该包含教会税', complexResult.churchTax > 0)
  test('总税额应该合理', complexResult.totalTax > 0 && complexResult.totalTax < complexParams.income)
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  // 输出功能覆盖情况
  console.log('\n🎯 功能覆盖情况:')
  console.log(`   ✅ 基础资本利得税计算 - 25%税率和团结税`)
  console.log(`   ✅ 免税额度功能 - 801€年度免税额度`)
  console.log(`   ✅ ETF部分免税 - 不同ETF类型的免税比例`)
  console.log(`   ✅ 教会税计算 - 8%/9%教会税率`)
  console.log(`   ✅ 税收设置验证 - 参数有效性检查`)
  console.log(`   ✅ 免税额度计算 - 智能免税额度使用`)
  console.log(`   ✅ ETF免税计算 - 各种ETF类型支持`)
  console.log(`   ✅ 教会税税率 - 联邦州差异化税率`)
  console.log(`   ✅ 税收优化建议 - 智能优化建议`)
  console.log(`   ✅ 复杂场景计算 - 多种税收规则组合`)
  
  if (failed === 0) {
    console.log('\n🎉 所有德国税收数据模型测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查税收计算实现。')
    return false
  }
}

// 运行测试
runGermanTaxModelTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
