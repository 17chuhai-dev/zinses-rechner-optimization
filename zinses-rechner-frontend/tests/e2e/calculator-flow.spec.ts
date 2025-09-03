/**
 * 计算器核心流程E2E测试
 * 验证完整的用户计算体验
 */

import { test, expect, Page } from '@playwright/test'

// 测试数据
const testCalculations = [
  {
    name: '基础复利计算',
    input: {
      principal: 10000,
      rate: 4.0,
      years: 10,
      monthlyPayment: 0
    },
    expected: {
      finalAmount: 14802.44,
      totalInterest: 4802.44
    }
  },
  {
    name: '月供复利计算',
    input: {
      principal: 5000,
      rate: 3.5,
      years: 15,
      monthlyPayment: 300
    },
    expected: {
      finalAmount: 75000, // 大概值
      totalContributions: 59000
    }
  },
  {
    name: '边界值测试',
    input: {
      principal: 1000000,
      rate: 10.0,
      years: 30,
      monthlyPayment: 1000
    },
    expected: {
      finalAmount: 2000000 // 大概值
    }
  }
]

// 页面对象模式
class CalculatorPage {
  constructor(private page: Page) {}

  // 表单元素
  get principalInput() { return this.page.locator('[data-testid="principal-input"]') }
  get rateInput() { return this.page.locator('[data-testid="rate-input"]') }
  get yearsInput() { return this.page.locator('[data-testid="years-input"]') }
  get monthlyPaymentInput() { return this.page.locator('[data-testid="monthly-payment-input"]') }
  get calculateButton() { return this.page.locator('[data-testid="calculate-button"]') }
  get resetButton() { return this.page.locator('[data-testid="reset-button"]') }

  // 结果元素
  get resultContainer() { return this.page.locator('[data-testid="calculation-result"]') }
  get finalAmountValue() { return this.page.locator('[data-testid="final-amount"]') }
  get totalInterestValue() { return this.page.locator('[data-testid="total-interest"]') }
  get totalContributionsValue() { return this.page.locator('[data-testid="total-contributions"]') }
  get annualReturnValue() { return this.page.locator('[data-testid="annual-return"]') }

  // 图表元素
  get chartContainer() { return this.page.locator('[data-testid="calculation-chart"]') }
  get yearlyBreakdownTable() { return this.page.locator('[data-testid="yearly-breakdown"]') }

  // 导出元素
  get exportPdfButton() { return this.page.locator('[data-testid="export-pdf"]') }
  get exportExcelButton() { return this.page.locator('[data-testid="export-excel"]') }
  get shareButton() { return this.page.locator('[data-testid="share-button"]') }

  // 操作方法
  async fillCalculationForm(data: any) {
    await this.principalInput.fill(data.principal.toString())
    await this.rateInput.fill(data.rate.toString())
    await this.yearsInput.fill(data.years.toString())
    
    if (data.monthlyPayment > 0) {
      await this.monthlyPaymentInput.fill(data.monthlyPayment.toString())
    }
  }

  async submitCalculation() {
    await this.calculateButton.click()
    
    // 等待计算完成
    await this.resultContainer.waitFor({ state: 'visible', timeout: 10000 })
  }

  async resetForm() {
    await this.resetButton.click()
    
    // 验证表单已重置
    await expect(this.principalInput).toHaveValue('')
    await expect(this.rateInput).toHaveValue('')
    await expect(this.yearsInput).toHaveValue('')
  }

  async getCalculationResults() {
    const finalAmount = await this.finalAmountValue.textContent()
    const totalInterest = await this.totalInterestValue.textContent()
    const totalContributions = await this.totalContributionsValue.textContent()
    const annualReturn = await this.annualReturnValue.textContent()

    return {
      finalAmount: this.parseGermanNumber(finalAmount || '0'),
      totalInterest: this.parseGermanNumber(totalInterest || '0'),
      totalContributions: this.parseGermanNumber(totalContributions || '0'),
      annualReturn: parseFloat(annualReturn?.replace('%', '') || '0')
    }
  }

  private parseGermanNumber(text: string): number {
    // 解析德语数字格式 (1.234,56 → 1234.56)
    return parseFloat(text.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  }
}

test.describe('计算器核心流程', () => {
  let calculatorPage: CalculatorPage

  test.beforeEach(async ({ page }) => {
    calculatorPage = new CalculatorPage(page)
    
    // 访问主页
    await page.goto('/')
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle')
    
    // 验证页面标题
    await expect(page).toHaveTitle(/Zinses-Rechner/)
  })

  test('应该正确显示计算器表单', async ({ page }) => {
    // 验证表单元素存在
    await expect(calculatorPage.principalInput).toBeVisible()
    await expect(calculatorPage.rateInput).toBeVisible()
    await expect(calculatorPage.yearsInput).toBeVisible()
    await expect(calculatorPage.monthlyPaymentInput).toBeVisible()
    await expect(calculatorPage.calculateButton).toBeVisible()
    await expect(calculatorPage.resetButton).toBeVisible()

    // 验证表单标签
    await expect(page.locator('label[for="principal"]')).toContainText('Startkapital')
    await expect(page.locator('label[for="rate"]')).toContainText('Zinssatz')
    await expect(page.locator('label[for="years"]')).toContainText('Laufzeit')
  })

  test('应该正确执行基础复利计算', async ({ page }) => {
    const testData = testCalculations[0]
    
    // 填写表单
    await calculatorPage.fillCalculationForm(testData.input)
    
    // 提交计算
    await calculatorPage.submitCalculation()
    
    // 验证结果显示
    await expect(calculatorPage.resultContainer).toBeVisible()
    
    // 获取计算结果
    const results = await calculatorPage.getCalculationResults()
    
    // 验证计算准确性（允许小幅误差）
    expect(results.finalAmount).toBeCloseTo(testData.expected.finalAmount, 1)
    expect(results.totalInterest).toBeCloseTo(testData.expected.totalInterest, 1)
    
    // 验证图表显示
    await expect(calculatorPage.chartContainer).toBeVisible()
    
    // 验证年度明细表
    await expect(calculatorPage.yearlyBreakdownTable).toBeVisible()
    
    // 验证表格行数（应该等于计算年数）
    const tableRows = calculatorPage.yearlyBreakdownTable.locator('tbody tr')
    await expect(tableRows).toHaveCount(testData.input.years)
  })

  test('应该正确执行月供复利计算', async ({ page }) => {
    const testData = testCalculations[1]
    
    // 填写表单
    await calculatorPage.fillCalculationForm(testData.input)
    
    // 提交计算
    await calculatorPage.submitCalculation()
    
    // 验证结果
    const results = await calculatorPage.getCalculationResults()
    
    // 验证总贡献金额
    const expectedContributions = testData.input.principal + 
      (testData.input.monthlyPayment * 12 * testData.input.years)
    expect(results.totalContributions).toBeCloseTo(expectedContributions, 1)
    
    // 验证最终金额大于总贡献（有利息收益）
    expect(results.finalAmount).toBeGreaterThan(results.totalContributions)
  })

  test('应该正确处理表单验证', async ({ page }) => {
    // 测试空值验证
    await calculatorPage.calculateButton.click()
    
    // 应该显示验证错误
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    
    // 测试无效值
    await calculatorPage.principalInput.fill('-1000')
    await calculatorPage.rateInput.fill('101')
    await calculatorPage.yearsInput.fill('0')
    
    await calculatorPage.calculateButton.click()
    
    // 应该显示具体的验证错误
    await expect(page.locator('text=Startkapital muss positiv sein')).toBeVisible()
    await expect(page.locator('text=Zinssatz muss zwischen')).toBeVisible()
    await expect(page.locator('text=Laufzeit muss mindestens')).toBeVisible()
  })

  test('应该支持表单重置功能', async ({ page }) => {
    const testData = testCalculations[0]
    
    // 填写表单
    await calculatorPage.fillCalculationForm(testData.input)
    
    // 执行计算
    await calculatorPage.submitCalculation()
    
    // 验证结果显示
    await expect(calculatorPage.resultContainer).toBeVisible()
    
    // 重置表单
    await calculatorPage.resetForm()
    
    // 验证结果隐藏
    await expect(calculatorPage.resultContainer).not.toBeVisible()
  })

  test('应该支持键盘导航', async ({ page }) => {
    // 使用Tab键导航
    await page.keyboard.press('Tab')
    await expect(calculatorPage.principalInput).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(calculatorPage.rateInput).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(calculatorPage.yearsInput).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(calculatorPage.monthlyPaymentInput).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(calculatorPage.calculateButton).toBeFocused()
    
    // 使用Enter键提交（需要先填写有效数据）
    await calculatorPage.fillCalculationForm(testCalculations[0].input)
    await calculatorPage.calculateButton.focus()
    await page.keyboard.press('Enter')
    
    // 验证计算执行
    await expect(calculatorPage.resultContainer).toBeVisible()
  })

  test('应该正确处理计算错误', async ({ page }) => {
    // 模拟API错误
    await page.route('**/api/v1/calculate/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
          message: 'Calculation service temporarily unavailable'
        })
      })
    })

    const testData = testCalculations[0]
    await calculatorPage.fillCalculationForm(testData.input)
    await calculatorPage.submitCalculation()

    // 验证错误消息显示
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=Berechnung fehlgeschlagen')).toBeVisible()
    
    // 验证重试按钮存在
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('应该支持数据导出功能', async ({ page }) => {
    const testData = testCalculations[0]
    
    // 执行计算
    await calculatorPage.fillCalculationForm(testData.input)
    await calculatorPage.submitCalculation()
    
    // 等待结果显示
    await expect(calculatorPage.resultContainer).toBeVisible()
    
    // 测试PDF导出
    const downloadPromise = page.waitForEvent('download')
    await calculatorPage.exportPdfButton.click()
    const download = await downloadPromise
    
    // 验证下载文件
    expect(download.suggestedFilename()).toMatch(/zinses-rechner.*\.pdf/)
    
    // 测试Excel导出
    const excelDownloadPromise = page.waitForEvent('download')
    await calculatorPage.exportExcelButton.click()
    const excelDownload = await excelDownloadPromise
    
    expect(excelDownload.suggestedFilename()).toMatch(/zinses-rechner.*\.xlsx/)
  })

  test('应该支持社交分享功能', async ({ page }) => {
    const testData = testCalculations[0]
    
    // 执行计算
    await calculatorPage.fillCalculationForm(testData.input)
    await calculatorPage.submitCalculation()
    
    // 点击分享按钮
    await calculatorPage.shareButton.click()
    
    // 验证分享选项显示
    await expect(page.locator('[data-testid="share-options"]')).toBeVisible()
    
    // 测试复制链接功能
    await page.locator('[data-testid="copy-link"]').click()
    
    // 验证成功提示
    await expect(page.locator('text=Link kopiert')).toBeVisible()
  })

  test('应该在移动设备上正确显示', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('此测试仅在移动设备上运行')
    }

    // 验证移动端布局
    await expect(calculatorPage.principalInput).toBeVisible()
    
    // 验证触摸友好的按钮大小
    const buttonBox = await calculatorPage.calculateButton.boundingBox()
    expect(buttonBox?.height).toBeGreaterThan(44) // 最小触摸目标
    
    // 测试移动端特定功能
    const testData = testCalculations[0]
    await calculatorPage.fillCalculationForm(testData.input)
    
    // 使用触摸事件
    await calculatorPage.calculateButton.tap()
    
    // 验证结果在移动端正确显示
    await expect(calculatorPage.resultContainer).toBeVisible()
  })

  test('应该支持深度链接和状态恢复', async ({ page }) => {
    const testData = testCalculations[0]
    
    // 执行计算
    await calculatorPage.fillCalculationForm(testData.input)
    await calculatorPage.submitCalculation()
    
    // 获取当前URL（应该包含计算参数）
    const currentUrl = page.url()
    expect(currentUrl).toContain('principal=')
    
    // 刷新页面
    await page.reload()
    
    // 验证状态恢复
    await expect(calculatorPage.principalInput).toHaveValue(testData.input.principal.toString())
    await expect(calculatorPage.resultContainer).toBeVisible()
  })

  test('应该正确处理大数值计算', async ({ page }) => {
    const largeValueTest = {
      principal: 5000000, // 5百万
      rate: 6.0,
      years: 25,
      monthlyPayment: 2000
    }
    
    await calculatorPage.fillCalculationForm(largeValueTest)
    await calculatorPage.submitCalculation()
    
    // 验证大数值正确显示（德语格式）
    const results = await calculatorPage.getCalculationResults()
    expect(results.finalAmount).toBeGreaterThan(largeValueTest.principal)
    
    // 验证数字格式化（德语千位分隔符）
    const finalAmountText = await calculatorPage.finalAmountValue.textContent()
    expect(finalAmountText).toMatch(/\d{1,3}(\.\d{3})*,\d{2}/) // 德语数字格式
  })

  test('应该支持可访问性功能', async ({ page }) => {
    // 验证ARIA标签
    await expect(calculatorPage.principalInput).toHaveAttribute('aria-label')
    await expect(calculatorPage.calculateButton).toHaveAttribute('aria-describedby')
    
    // 验证焦点管理
    await calculatorPage.principalInput.focus()
    await expect(calculatorPage.principalInput).toBeFocused()
    
    // 验证屏幕阅读器支持
    await expect(page.locator('[aria-live="polite"]')).toBeAttached()
    
    // 测试高对比度模式
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(calculatorPage.principalInput).toBeVisible()
  })
})

test.describe('计算器性能测试', () => {
  test('页面加载性能应该符合标准', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // 页面加载应该在3秒内完成
    expect(loadTime).toBeLessThan(3000)
    
    // 验证Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          resolve(entries.map(entry => ({
            name: entry.name,
            value: entry.value || (entry as any).processingStart
          })))
        }).observe({ entryTypes: ['navigation', 'paint'] })
      })
    })
    
    console.log('页面性能指标:', metrics)
  })

  test('计算响应时间应该快速', async ({ page }) => {
    const calculatorPage = new CalculatorPage(page)
    await page.goto('/')
    
    const testData = testCalculations[0]
    await calculatorPage.fillCalculationForm(testData.input)
    
    const startTime = Date.now()
    await calculatorPage.submitCalculation()
    const calculationTime = Date.now() - startTime
    
    // 计算应该在2秒内完成
    expect(calculationTime).toBeLessThan(2000)
    
    console.log(`计算响应时间: ${calculationTime}ms`)
  })
})
