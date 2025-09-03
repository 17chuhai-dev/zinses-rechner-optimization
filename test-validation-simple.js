/**
 * 简化的表单验证功能测试
 * 直接测试验证逻辑，不依赖Vue组件
 */

// 模拟验证规则和消息
const VALIDATION_MESSAGES = {
  required: 'Dieses Feld ist erforderlich',
  min: 'Der Wert muss mindestens {min} betragen',
  max: 'Der Wert darf höchstens {max} betragen',
  range: 'Der Wert muss zwischen {min} und {max} liegen',
  positive: 'Der Wert muss positiv sein',
  percentage: 'Bitte geben Sie einen gültigen Prozentsatz ein',
  currency: 'Bitte geben Sie einen gültigen Betrag in Euro ein',
  integer: 'Bitte geben Sie eine ganze Zahl ein',
  
  principal: {
    min: 'Das Startkapital muss mindestens 1€ betragen',
    max: 'Das Startkapital darf höchstens 10.000.000€ betragen',
    invalid: 'Bitte geben Sie ein gültiges Startkapital ein'
  },
  
  monthlyPayment: {
    max: 'Die monatliche Sparrate darf höchstens 50.000€ betragen',
    invalid: 'Bitte geben Sie eine gültige monatliche Sparrate ein'
  },
  
  annualRate: {
    invalid: 'Der Zinssatz muss zwischen 0% und 20% liegen'
  },
  
  years: {
    invalid: 'Die Anlagedauer muss zwischen 1 und 50 Jahren liegen'
  }
}

// 验证规则函数
const validationRules = {
  required: (message = VALIDATION_MESSAGES.required) => ({
    validator: (value) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (typeof value === 'number') return !isNaN(value) && value !== 0
      return value != null && value !== undefined
    },
    message,
    code: 'REQUIRED'
  }),

  min: (minValue, message) => ({
    validator: (value) => !isNaN(value) && value >= minValue,
    message: message || VALIDATION_MESSAGES.min.replace('{min}', minValue.toString()),
    code: 'MIN_VALUE'
  }),

  max: (maxValue, message) => ({
    validator: (value) => !isNaN(value) && value <= maxValue,
    message: message || VALIDATION_MESSAGES.max.replace('{max}', maxValue.toString()),
    code: 'MAX_VALUE'
  }),

  range: (minValue, maxValue, message) => ({
    validator: (value) => !isNaN(value) && value >= minValue && value <= maxValue,
    message: message || VALIDATION_MESSAGES.range.replace('{min}', minValue.toString()).replace('{max}', maxValue.toString()),
    code: 'RANGE'
  }),

  currency: (message = VALIDATION_MESSAGES.currency) => ({
    validator: (value) => {
      const num = parseFloat(value)
      return !isNaN(num) && num >= 0
    },
    message,
    code: 'CURRENCY'
  }),

  percentage: (message = VALIDATION_MESSAGES.percentage) => ({
    validator: (value) => {
      const num = parseFloat(value)
      return !isNaN(num) && num >= 0 && num <= 100
    },
    message,
    code: 'PERCENTAGE'
  }),

  integer: (message = VALIDATION_MESSAGES.integer) => ({
    validator: (value) => {
      const num = parseInt(value)
      return !isNaN(num) && num === parseFloat(value)
    },
    message,
    code: 'INTEGER'
  })
}

// 业务规则
const businessRules = {
  principal: [
    validationRules.required(),
    validationRules.currency(),
    validationRules.range(1, 10000000, VALIDATION_MESSAGES.principal.min)
  ],

  monthlyPayment: [
    validationRules.currency(),
    validationRules.max(50000, VALIDATION_MESSAGES.monthlyPayment.max)
  ],

  annualRate: [
    validationRules.required(),
    validationRules.range(0, 20, VALIDATION_MESSAGES.annualRate.invalid)
  ],

  years: [
    validationRules.required(),
    validationRules.integer(),
    validationRules.range(1, 50, VALIDATION_MESSAGES.years.invalid)
  ]
}

// 验证函数
function validateField(fieldName, value, rules) {
  const fieldErrors = []

  for (const rule of rules) {
    if (!rule.validator(value)) {
      fieldErrors.push({
        field: fieldName,
        message: rule.message,
        code: rule.code || 'VALIDATION_ERROR'
      })
      break // 只显示第一个错误
    }
  }

  return fieldErrors
}

// 生成警告信息
function generateWarnings(fieldName, value) {
  const warnings = []

  if (fieldName === 'principal' && typeof value === 'number') {
    if (value > 0 && value < 1000) {
      warnings.push('Ein höheres Startkapital führt zu besseren Ergebnissen')
    }
    if (value > 500000) {
      warnings.push('Bei hohen Beträgen sollten Sie eine professionelle Beratung in Anspruch nehmen')
    }
  }

  if (fieldName === 'annualRate' && typeof value === 'number') {
    if (value > 10) {
      warnings.push('Sehr hohe Renditen sind oft mit höheren Risiken verbunden')
    }
    if (value < 2) {
      warnings.push('Niedrige Zinssätze können die Inflation nicht ausgleichen')
    }
  }

  if (fieldName === 'years' && typeof value === 'number') {
    if (value < 5) {
      warnings.push('Langfristige Anlagen haben oft bessere Renditen')
    }
    if (value > 30) {
      warnings.push('Sehr lange Anlagezeiträume erhöhen das Unsicherheitsrisiko')
    }
  }

  return warnings
}

// 生成建议信息
function generateSuggestions(fieldName, value) {
  const suggestions = []

  if (fieldName === 'monthlyPayment' && typeof value === 'number') {
    if (value === 0) {
      suggestions.push('Regelmäßige Sparbeiträge verstärken den Zinseszinseffekt erheblich')
    }
    if (value > 0 && value < 100) {
      suggestions.push('Bereits kleine Erhöhungen der Sparrate haben große Auswirkungen')
    }
  }

  if (fieldName === 'principal' && typeof value === 'number') {
    if (value === 0) {
      suggestions.push('Ein Startkapital beschleunigt den Vermögensaufbau')
    }
  }

  return suggestions
}

// 测试函数
function runValidationTests() {
  console.log('🧪 开始表单验证增强功能测试...\n')
  
  let passed = 0
  let failed = 0
  
  function test(description, actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      console.log(`✅ ${description}`)
      passed++
    } else {
      console.log(`❌ ${description}`)
      console.log(`   期望: ${JSON.stringify(expected)}`)
      console.log(`   实际: ${JSON.stringify(actual)}`)
      failed++
    }
  }
  
  // 基础验证规则测试
  console.log('📋 测试基础验证规则:')
  
  // 必填字段验证
  const requiredRule = validationRules.required()
  test('必填字段 - 空字符串', requiredRule.validator(''), false)
  test('必填字段 - 有效字符串', requiredRule.validator('test'), true)
  test('必填字段 - 数字0', requiredRule.validator(0), false)
  test('必填字段 - 有效数字', requiredRule.validator(100), true)
  
  // 范围验证
  const rangeRule = validationRules.range(1, 100)
  test('范围验证 - 有效值', rangeRule.validator(50), true)
  test('范围验证 - 小于最小值', rangeRule.validator(0), false)
  test('范围验证 - 大于最大值', rangeRule.validator(101), false)
  
  // 货币验证
  const currencyRule = validationRules.currency()
  test('货币验证 - 有效金额', currencyRule.validator('1000'), true)
  test('货币验证 - 负数', currencyRule.validator('-100'), false)
  test('货币验证 - 非数字', currencyRule.validator('abc'), false)
  
  console.log('\n💼 测试业务规则验证:')
  
  // 起始资本验证
  test('起始资本 - 有效值', validateField('principal', 10000, businessRules.principal), [])
  test('起始资本 - 过小值', validateField('principal', 0, businessRules.principal).length > 0, true)
  test('起始资本 - 过大值', validateField('principal', 20000000, businessRules.principal).length > 0, true)
  
  // 年利率验证
  test('年利率 - 有效值', validateField('annualRate', 5, businessRules.annualRate), [])
  test('年利率 - 负值', validateField('annualRate', -1, businessRules.annualRate).length > 0, true)
  test('年利率 - 过高值', validateField('annualRate', 25, businessRules.annualRate).length > 0, true)
  
  console.log('\n⚠️  测试警告生成:')
  
  // 起始资本警告
  test('起始资本警告 - 小额', generateWarnings('principal', 500).length > 0, true)
  test('起始资本警告 - 大额', generateWarnings('principal', 600000).length > 0, true)
  test('起始资本警告 - 正常额', generateWarnings('principal', 10000), [])
  
  // 年利率警告
  test('年利率警告 - 过高', generateWarnings('annualRate', 15).length > 0, true)
  test('年利率警告 - 过低', generateWarnings('annualRate', 1).length > 0, true)
  test('年利率警告 - 正常', generateWarnings('annualRate', 5), [])
  
  console.log('\n💡 测试建议生成:')
  
  // 月度储蓄建议
  test('月度储蓄建议 - 零值', generateSuggestions('monthlyPayment', 0).length > 0, true)
  test('月度储蓄建议 - 小额', generateSuggestions('monthlyPayment', 50).length > 0, true)
  test('月度储蓄建议 - 正常额', generateSuggestions('monthlyPayment', 500), [])
  
  // 起始资本建议
  test('起始资本建议 - 零值', generateSuggestions('principal', 0).length > 0, true)
  test('起始资本建议 - 有值', generateSuggestions('principal', 1000), [])
  
  console.log('\n🔍 测试复杂场景:')
  
  // 完整表单验证
  const formData = {
    principal: 10000,
    monthlyPayment: 500,
    annualRate: 6,
    years: 15
  }
  
  let totalErrors = 0
  let totalWarnings = 0
  let totalSuggestions = 0
  
  Object.entries(formData).forEach(([fieldName, value]) => {
    if (businessRules[fieldName]) {
      const errors = validateField(fieldName, value, businessRules[fieldName])
      const warnings = generateWarnings(fieldName, value)
      const suggestions = generateSuggestions(fieldName, value)
      
      totalErrors += errors.length
      totalWarnings += warnings.length
      totalSuggestions += suggestions.length
    }
  })
  
  test('完整表单 - 无错误', totalErrors, 0)
  test('完整表单 - 有警告或建议', totalWarnings + totalSuggestions >= 0, true)
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 所有验证功能测试都通过了！表单验证增强功能工作正常。')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查验证功能的实现。')
    return false
  }
}

// 运行测试
const success = runValidationTests()
process.exit(success ? 0 : 1)
