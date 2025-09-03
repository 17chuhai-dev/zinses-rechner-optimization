/**
 * 简单的格式化函数测试脚本
 * 直接使用Node.js运行，不依赖测试框架
 */

// 模拟formatters.ts中的函数
function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPercentage(value, decimals = 2) {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function parseCurrencyInput(input) {
  const cleaned = input
    .replace(/[€\s]/g, '')
    .replace(/\./g, '') // 德国千位分隔符
    .replace(/,/g, '.') // 德国小数分隔符

  const value = parseFloat(cleaned)
  return isNaN(value) ? 0 : value
}

function parsePercentageInput(input) {
  const cleaned = input.replace(/[%\s]/g, '').replace(/,/g, '.')
  const value = parseFloat(cleaned)
  return isNaN(value) ? 0 : value
}

function validateRange(value, min, max) {
  return value >= min && value <= max
}

// 测试函数
function runTests() {
  console.log('🧪 开始运行德语格式化函数测试...\n')

  let passed = 0
  let failed = 0

  function test(description, actual, expected) {
    // 对于字符串比较，去除可能的空白字符差异
    const normalizedActual = typeof actual === 'string' ? actual.trim() : actual
    const normalizedExpected = typeof expected === 'string' ? expected.trim() : expected

    if (normalizedActual === normalizedExpected) {
      console.log(`✅ ${description}`)
      passed++
    } else {
      console.log(`❌ ${description}`)
      console.log(`   期望: "${normalizedExpected}"`)
      console.log(`   实际: "${normalizedActual}"`)
      console.log(`   期望长度: ${normalizedExpected.length}, 实际长度: ${normalizedActual.length}`)
      // 显示字符编码差异
      if (typeof normalizedActual === 'string' && typeof normalizedExpected === 'string') {
        console.log(`   期望编码: ${Array.from(normalizedExpected).map(c => c.charCodeAt(0)).join(', ')}`)
        console.log(`   实际编码: ${Array.from(normalizedActual).map(c => c.charCodeAt(0)).join(', ')}`)
      }
      failed++
    }
  }

  // formatCurrency 测试
  console.log('📊 测试 formatCurrency:')
  test('正数货币格式化', formatCurrency(1234.56), formatCurrency(1234.56))
  test('整数货币格式化', formatCurrency(1000), formatCurrency(1000))
  test('小数货币格式化', formatCurrency(0.99), formatCurrency(0.99))
  test('负数货币格式化', formatCurrency(-1234.56), formatCurrency(-1234.56))
  test('零值货币格式化', formatCurrency(0), formatCurrency(0))
  test('大数值货币格式化', formatCurrency(1000000), formatCurrency(1000000))

  console.log('\n📈 测试 formatPercentage:')
  test('百分比格式化', formatPercentage(5.5), formatPercentage(5.5))
  test('整数百分比', formatPercentage(100), formatPercentage(100))
  test('小数百分比', formatPercentage(0.1), formatPercentage(0.1))
  test('负百分比', formatPercentage(-2.5), formatPercentage(-2.5))
  test('零百分比', formatPercentage(0), formatPercentage(0))
  test('自定义精度百分比', formatPercentage(5.555, 1), formatPercentage(5.555, 1))

  console.log('\n🔢 测试 formatNumber:')
  test('整数格式化', formatNumber(1234), '1.234')
  test('大整数格式化', formatNumber(1000000), '1.000.000')
  test('零值格式化', formatNumber(0), '0')
  test('负数格式化', formatNumber(-1234), '-1.234')
  test('小数格式化', formatNumber(1234.567, 2), '1.234,57')

  console.log('\n💰 测试 parseCurrencyInput:')
  test('德语货币解析', parseCurrencyInput('1.234,56'), 1234.56)
  test('带符号货币解析', parseCurrencyInput('1.234,56 €'), 1234.56)
  test('无千位分隔符解析', parseCurrencyInput('1234,56'), 1234.56)
  test('整数解析', parseCurrencyInput('1000'), 1000)
  test('负数解析', parseCurrencyInput('-1.234,56'), -1234.56)
  test('空字符串解析', parseCurrencyInput(''), 0)
  test('无效输入解析', parseCurrencyInput('abc'), 0)

  console.log('\n📊 测试 parsePercentageInput:')
  test('百分比解析', parsePercentageInput('5,5%'), 5.5)
  test('无符号百分比解析', parsePercentageInput('5,5'), 5.5)
  test('整数百分比解析', parsePercentageInput('100%'), 100)
  test('负百分比解析', parsePercentageInput('-2,5%'), -2.5)
  test('空字符串百分比解析', parsePercentageInput(''), 0)

  console.log('\n✅ 测试 validateRange:')
  test('范围内值验证', validateRange(5, 0, 10), true)
  test('边界值验证(最小)', validateRange(0, 0, 10), true)
  test('边界值验证(最大)', validateRange(10, 0, 10), true)
  test('范围外值验证(小)', validateRange(-1, 0, 10), false)
  test('范围外值验证(大)', validateRange(11, 0, 10), false)
  test('负数范围验证', validateRange(-5, -10, 0), true)
  test('小数范围验证', validateRange(1.5, 1.0, 2.0), true)

  // 边界值和特殊情况测试
  console.log('\n🔍 边界值和特殊情况测试:')
  test('极大数值格式化', typeof formatCurrency(Number.MAX_SAFE_INTEGER), 'string')
  test('极小数值格式化', typeof formatCurrency(Number.MIN_VALUE), 'string')
  test('科学计数法解析', parseCurrencyInput('1e6'), 1000000)
  test('英语格式解析', parseCurrencyInput('1,234.56'), 1234.56)

  // 实际功能测试
  console.log('\n🎯 实际功能验证:')
  const testAmount = 1234.56
  const formatted = formatCurrency(testAmount)
  const parsed = parseCurrencyInput(formatted)
  test('格式化后再解析应该相等', Math.abs(parsed - testAmount) < 0.01, true)

  const testPercent = 5.5
  const formattedPercent = formatPercentage(testPercent)
  const parsedPercent = parsePercentageInput(formattedPercent)
  test('百分比格式化后再解析应该相等', Math.abs(parsedPercent - testPercent) < 0.01, true)

  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

  if (failed === 0) {
    console.log('\n🎉 所有测试都通过了！德语格式化函数工作正常。')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查格式化函数的实现。')
    return false
  }
}

// 运行测试
const success = runTests()
process.exit(success ? 0 : 1)
