/**
 * 端到端测试 - 计算器功能
 * 测试完整的用户工作流程
 */

import { test, expect } from '@playwright/test'

test.describe('Zinseszins-Rechner E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('完整计算流程', async ({ page }) => {
    // 1. 页面加载检查
    await expect(page).toHaveTitle(/Zinseszins-Rechner/)
    await expect(page.locator('h1')).toContainText('Zinseszins-Rechner')

    // 2. 填写表单
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4.5')
    await page.fill('[data-testid="years-input"]', '15')
    await page.fill('[data-testid="monthly-payment-input"]', '200')

    // 3. 提交计算
    await page.click('[data-testid="calculate-button"]')

    // 4. 等待结果显示
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible()
    
    // 5. 验证结果内容
    const finalAmount = page.locator('[data-testid="final-amount"]')
    await expect(finalAmount).toBeVisible()
    await expect(finalAmount).toContainText('€')
    
    const totalInterest = page.locator('[data-testid="total-interest"]')
    await expect(totalInterest).toBeVisible()
    
    // 6. 检查年度明细表格
    const yearlyTable = page.locator('[data-testid="yearly-breakdown-table"]')
    await expect(yearlyTable).toBeVisible()
    
    const tableRows = yearlyTable.locator('tbody tr')
    await expect(tableRows).toHaveCount(15) // 15年应该有15行
  })

  test('税务计算功能', async ({ page }) => {
    // 1. 填写基础表单
    await page.fill('[data-testid="principal-input"]', '50000')
    await page.fill('[data-testid="rate-input"]', '5.0')
    await page.fill('[data-testid="years-input"]', '10')

    // 2. 启用税务计算
    await page.check('[data-testid="tax-enabled-checkbox"]')
    
    // 3. 配置税务设置
    await page.check('[data-testid="married-radio"]')
    await page.check('[data-testid="kirchensteuer-checkbox"]')
    await page.selectOption('[data-testid="bundesland-select"]', 'Berlin')

    // 4. 计算
    await page.click('[data-testid="calculate-button"]')

    // 5. 验证税务结果显示
    await expect(page.locator('[data-testid="tax-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="gross-interest"]')).toBeVisible()
    await expect(page.locator('[data-testid="net-interest"]')).toBeVisible()
    await expect(page.locator('[data-testid="tax-amount"]')).toBeVisible()
    
    // 6. 检查税务明细
    await expect(page.locator('[data-testid="abgeltungssteuer"]')).toContainText('25%')
    await expect(page.locator('[data-testid="solidaritaetszuschlag"]')).toContainText('5,5%')
    await expect(page.locator('[data-testid="kirchensteuer"]')).toContainText('9%')
  })

  test('表单验证', async ({ page }) => {
    // 1. 测试空表单提交
    await page.click('[data-testid="calculate-button"]')
    
    // 应该显示验证错误
    await expect(page.locator('.error-message')).toBeVisible()

    // 2. 测试无效数值
    await page.fill('[data-testid="principal-input"]', '-1000')
    await page.fill('[data-testid="rate-input"]', '25')
    await page.fill('[data-testid="years-input"]', '0')
    
    await page.click('[data-testid="calculate-button"]')
    
    // 应该显示多个验证错误
    const errorMessages = page.locator('.error-message')
    await expect(errorMessages).toHaveCount.toBeGreaterThan(1)

    // 3. 修正错误
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4.0')
    await page.fill('[data-testid="years-input"]', '10')
    
    // 错误应该消失
    await expect(page.locator('.error-message')).not.toBeVisible()
  })

  test('导出功能', async ({ page }) => {
    // 1. 完成计算
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4.0')
    await page.fill('[data-testid="years-input"]', '10')
    await page.click('[data-testid="calculate-button"]')
    
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible()

    // 2. 测试CSV导出
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-csv-button"]')
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toContain('.csv')

    // 3. 测试PDF导出
    const pdfDownloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-pdf-button"]')
    const pdfDownload = await pdfDownloadPromise
    
    expect(pdfDownload.suggestedFilename()).toContain('.pdf')
  })

  test('分享功能', async ({ page }) => {
    // 1. 完成计算
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4.0')
    await page.fill('[data-testid="years-input"]', '10')
    await page.click('[data-testid="calculate-button"]')

    // 2. 测试复制链接
    await page.click('[data-testid="copy-link-button"]')
    
    // 应该显示成功消息
    await expect(page.locator('.success-message')).toBeVisible()
    await expect(page.locator('.success-message')).toContainText('Link kopiert')

    // 3. 测试社交分享按钮存在
    await expect(page.locator('[data-testid="share-linkedin"]')).toBeVisible()
    await expect(page.locator('[data-testid="share-twitter"]')).toBeVisible()
    await expect(page.locator('[data-testid="share-whatsapp"]')).toBeVisible()
  })

  test('响应式设计', async ({ page }) => {
    // 1. 桌面端测试
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('.grid-cols-2')).toBeVisible()

    // 2. 平板端测试
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('.grid-cols-1')).toBeVisible()

    // 3. 移动端测试
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 表单应该堆叠显示
    await expect(page.locator('.mobile-layout')).toBeVisible()
    
    // 按钮应该全宽
    const calculateButton = page.locator('[data-testid="calculate-button"]')
    await expect(calculateButton).toHaveClass(/w-full/)
  })

  test('公式解释功能', async ({ page }) => {
    // 1. 完成计算
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4.0')
    await page.fill('[data-testid="years-input"]', '10')
    await page.click('[data-testid="calculate-button"]')

    // 2. 展开公式解释
    await page.click('[data-testid="formula-explanation-toggle"]')
    
    // 3. 验证公式内容
    await expect(page.locator('[data-testid="formula-display"]')).toBeVisible()
    await expect(page.locator('[data-testid="formula-display"]')).toContainText('A = P')
    
    // 4. 测试交互式公式
    await page.hover('[data-testid="variable-P"]')
    await expect(page.locator('.tooltip')).toBeVisible()
    await expect(page.locator('.tooltip')).toContainText('Startkapital')
  })

  test('错误处理', async ({ page }) => {
    // 1. 模拟网络错误
    await page.route('**/api/v1/calculator/calculate', route => {
      route.abort()
    })

    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4.0')
    await page.fill('[data-testid="years-input"]', '10')
    await page.click('[data-testid="calculate-button"]')

    // 2. 验证错误显示
    await expect(page.locator('.error-display')).toBeVisible()
    await expect(page.locator('.error-display')).toContainText('Verbindungsfehler')

    // 3. 测试重试功能
    await page.unroute('**/api/v1/calculator/calculate')
    await page.click('[data-testid="retry-button"]')
    
    // 应该重新尝试计算
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible()
  })

  test('数据持久化', async ({ page }) => {
    // 1. 填写表单
    await page.fill('[data-testid="principal-input"]', '25000')
    await page.fill('[data-testid="rate-input"]', '5.5')
    await page.fill('[data-testid="years-input"]', '20')

    // 2. 刷新页面
    await page.reload()

    // 3. 验证数据保持
    await expect(page.locator('[data-testid="principal-input"]')).toHaveValue('25000')
    await expect(page.locator('[data-testid="rate-input"]')).toHaveValue('5.5')
    await expect(page.locator('[data-testid="years-input"]')).toHaveValue('20')
  })

  test('打印功能', async ({ page }) => {
    // 1. 完成计算
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4.0')
    await page.fill('[data-testid="years-input"]', '10')
    await page.click('[data-testid="calculate-button"]')

    // 2. 测试打印预览
    await page.click('[data-testid="print-button"]')
    
    // 应该打开打印对话框（在真实浏览器中）
    // 在测试环境中，我们检查打印样式是否应用
    const printStyles = await page.evaluate(() => {
      const printStyleSheet = Array.from(document.styleSheets).find(
        sheet => sheet.href?.includes('print.css')
      )
      return !!printStyleSheet
    })
    
    expect(printStyles).toBe(true)
  })

  test('性能测试', async ({ page }) => {
    // 1. 测试页面加载性能
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000) // 页面应该在3秒内加载

    // 2. 测试计算性能
    await page.fill('[data-testid="principal-input"]', '100000')
    await page.fill('[data-testid="rate-input"]', '6.0')
    await page.fill('[data-testid="years-input"]', '30')
    await page.fill('[data-testid="monthly-payment-input"]', '1000')

    const calcStartTime = Date.now()
    await page.click('[data-testid="calculate-button"]')
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible()
    const calcTime = Date.now() - calcStartTime
    
    expect(calcTime).toBeLessThan(2000) // 计算应该在2秒内完成
  })

  test('可访问性测试', async ({ page }) => {
    // 1. 键盘导航测试
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="principal-input"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="rate-input"]')).toBeFocused()

    // 2. 屏幕阅读器支持
    const principalInput = page.locator('[data-testid="principal-input"]')
    await expect(principalInput).toHaveAttribute('aria-label')
    await expect(principalInput).toHaveAttribute('aria-describedby')

    // 3. 颜色对比度（通过axe-core）
    // 注意：需要安装 @axe-core/playwright
    // await injectAxe(page)
    // const results = await checkA11y(page)
    // expect(results.violations).toHaveLength(0)
  })

  test('多语言支持（德语）', async ({ page }) => {
    // 验证德语内容
    await expect(page.locator('text=Startkapital')).toBeVisible()
    await expect(page.locator('text=Zinssatz')).toBeVisible()
    await expect(page.locator('text=Laufzeit')).toBeVisible()
    await expect(page.locator('text=Berechnen')).toBeVisible()
    
    // 验证德语数字格式
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.blur('[data-testid="principal-input"]')
    
    const formattedValue = await page.inputValue('[data-testid="principal-input"]')
    expect(formattedValue).toMatch(/10\.000/) // 德语千位分隔符
  })

  test('图表显示', async ({ page }) => {
    // 1. 完成计算
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4.0')
    await page.fill('[data-testid="years-input"]', '10')
    await page.click('[data-testid="calculate-button"]')

    // 2. 验证图表显示
    await expect(page.locator('[data-testid="compound-interest-chart"]')).toBeVisible()
    
    // 3. 检查图表交互
    const chartCanvas = page.locator('canvas')
    await expect(chartCanvas).toBeVisible()
    
    // 4. 测试图表工具提示
    await chartCanvas.hover()
    // 图表工具提示应该显示（Chart.js功能）
  })

  test('移动端特定功能', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })

    // 1. 移动端布局
    await expect(page.locator('.mobile-layout')).toBeVisible()

    // 2. 触摸友好的按钮
    const calculateButton = page.locator('[data-testid="calculate-button"]')
    const buttonSize = await calculateButton.boundingBox()
    expect(buttonSize?.height).toBeGreaterThan(44) // 最小触摸目标

    // 3. 移动端分享功能
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4.0')
    await page.fill('[data-testid="years-input"]', '10')
    await page.click('[data-testid="calculate-button"]')

    // 原生分享按钮应该在移动端可见
    await expect(page.locator('[data-testid="native-share-button"]')).toBeVisible()
  })

  test('SEO和元数据', async ({ page }) => {
    // 1. 检查页面标题
    await expect(page).toHaveTitle(/Zinseszins-Rechner.*Kostenloser Online-Rechner/)

    // 2. 检查meta描述
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /Kostenlos.*Sofortige Ergebnisse/)

    // 3. 检查结构化数据
    const structuredData = page.locator('script[type="application/ld+json"]')
    await expect(structuredData).toBeVisible()
    
    const jsonLd = await structuredData.textContent()
    expect(jsonLd).toContain('WebApplication')
    expect(jsonLd).toContain('Zinseszins-Rechner')
  })

  test('错误恢复', async ({ page }) => {
    // 1. 模拟服务器错误
    await page.route('**/api/v1/calculator/calculate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    // 2. 尝试计算
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.click('[data-testid="calculate-button"]')

    // 3. 验证错误显示
    await expect(page.locator('.error-display')).toBeVisible()
    await expect(page.locator('.error-display')).toContainText('Server-Fehler')

    // 4. 恢复服务并重试
    await page.unroute('**/api/v1/calculator/calculate')
    await page.click('[data-testid="retry-button"]')

    // 5. 验证成功恢复
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible()
  })

  test('用户指导流程', async ({ page }) => {
    // 1. 首次访问应该显示引导
    const isFirstVisit = await page.evaluate(() => {
      return !localStorage.getItem('calculator-tutorial-completed')
    })

    if (isFirstVisit) {
      await expect(page.locator('[data-testid="tutorial-step"]')).toBeVisible()
      
      // 2. 完成引导流程
      await page.click('[data-testid="tutorial-next"]')
      await page.click('[data-testid="tutorial-next"]')
      await page.click('[data-testid="tutorial-complete"]')
      
      // 3. 引导应该消失
      await expect(page.locator('[data-testid="tutorial-step"]')).not.toBeVisible()
    }
  })
})
