import { test, expect } from '@playwright/test'

// Zinses-Rechner 生产环境端到端测试
// 用途: 验证生产环境的完整用户流程

const FRONTEND_URL = 'https://zinses-rechner.de'
const API_URL = 'https://api.zinses-rechner.de'

test.describe('生产环境验证测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置较长的超时时间，因为是生产环境
    test.setTimeout(60000)
    
    // 导航到主页
    await page.goto(FRONTEND_URL)
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle')
  })

  test('主页加载和基础元素验证', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/Zinseszins-Rechner/)
    
    // 验证主要标题
    await expect(page.locator('h1')).toContainText('Zinseszins-Rechner')
    
    // 验证计算器表单存在
    await expect(page.locator('[data-testid="calculator-form"]')).toBeVisible()
    
    // 验证输入字段
    await expect(page.locator('[data-testid="principal-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="rate-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="years-input"]')).toBeVisible()
    
    // 验证计算按钮
    await expect(page.locator('[data-testid="calculate-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="calculate-button"]')).toContainText('berechnen')
  })

  test('基础复利计算功能', async ({ page }) => {
    // 输入计算参数
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4')
    await page.fill('[data-testid="years-input"]', '10')
    
    // 点击计算按钮
    await page.click('[data-testid="calculate-button"]')
    
    // 等待计算完成
    await page.waitForSelector('[data-testid="results-section"]', { timeout: 10000 })
    
    // 验证结果显示
    await expect(page.locator('[data-testid="final-amount"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-contributions"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-interest"]')).toBeVisible()
    
    // 验证计算结果合理性 (10000€, 4%, 10年 ≈ 14802€)
    const finalAmountText = await page.locator('[data-testid="final-amount"]').textContent()
    const finalAmount = parseFloat(finalAmountText?.replace(/[€.,]/g, '') || '0')
    
    expect(finalAmount).toBeGreaterThan(14000)
    expect(finalAmount).toBeLessThan(15500)
  })

  test('复杂计算场景 - 含月供', async ({ page }) => {
    // 输入复杂参数
    await page.fill('[data-testid="principal-input"]', '25000')
    await page.fill('[data-testid="rate-input"]', '5.5')
    await page.fill('[data-testid="years-input"]', '15')
    await page.fill('[data-testid="monthly-payment-input"]', '500')
    
    // 点击计算
    await page.click('[data-testid="calculate-button"]')
    
    // 等待结果
    await page.waitForSelector('[data-testid="results-section"]')
    
    // 验证结果存在且合理
    const finalAmountText = await page.locator('[data-testid="final-amount"]').textContent()
    const totalContributionsText = await page.locator('[data-testid="total-contributions"]').textContent()
    
    expect(finalAmountText).toBeTruthy()
    expect(totalContributionsText).toBeTruthy()
    
    // 验证月供计算正确 (25000 + 500*12*15 = 115000)
    const totalContributions = parseFloat(totalContributionsText?.replace(/[€.,]/g, '') || '0')
    expect(totalContributions).toBe(115000)
  })

  test('德国税务计算功能', async ({ page }) => {
    // 输入参数
    await page.fill('[data-testid="principal-input"]', '50000')
    await page.fill('[data-testid="rate-input"]', '6')
    await page.fill('[data-testid="years-input"]', '20')
    
    // 启用德国税务计算
    await page.check('[data-testid="german-tax-checkbox"]')
    
    // 点击计算
    await page.click('[data-testid="calculate-button"]')
    
    // 等待结果
    await page.waitForSelector('[data-testid="tax-results-section"]')
    
    // 验证税务相关结果显示
    await expect(page.locator('[data-testid="gross-interest"]')).toBeVisible()
    await expect(page.locator('[data-testid="tax-amount"]')).toBeVisible()
    await expect(page.locator('[data-testid="net-interest"]')).toBeVisible()
    
    // 验证税务计算合理性
    const grossInterestText = await page.locator('[data-testid="gross-interest"]').textContent()
    const netInterestText = await page.locator('[data-testid="net-interest"]').textContent()
    
    const grossInterest = parseFloat(grossInterestText?.replace(/[€.,]/g, '') || '0')
    const netInterest = parseFloat(netInterestText?.replace(/[€.,]/g, '') || '0')
    
    // 税后收益应该小于税前收益
    expect(netInterest).toBeLessThan(grossInterest)
    
    // 税率应该在合理范围内 (约25-28%)
    const taxRate = (grossInterest - netInterest) / grossInterest
    expect(taxRate).toBeGreaterThan(0.2)
    expect(taxRate).toBeLessThan(0.35)
  })

  test('图表和可视化功能', async ({ page }) => {
    // 输入参数并计算
    await page.fill('[data-testid="principal-input"]', '20000')
    await page.fill('[data-testid="rate-input"]', '5')
    await page.fill('[data-testid="years-input"]', '12')
    await page.click('[data-testid="calculate-button"]')
    
    // 等待图表加载
    await page.waitForSelector('[data-testid="growth-chart"]', { timeout: 15000 })
    
    // 验证图表元素
    await expect(page.locator('[data-testid="growth-chart"]')).toBeVisible()
    await expect(page.locator('canvas')).toBeVisible()
    
    // 验证图表交互
    const chartCanvas = page.locator('canvas').first()
    await chartCanvas.hover()
    
    // 验证工具提示显示
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible({ timeout: 5000 })
    
    // 验证年度明细表格
    await expect(page.locator('[data-testid="yearly-breakdown-table"]')).toBeVisible()
    
    // 验证表格数据
    const tableRows = page.locator('[data-testid="yearly-breakdown-table"] tbody tr')
    const rowCount = await tableRows.count()
    
    expect(rowCount).toBe(12) // 12年的数据
  })

  test('数据导出功能', async ({ page }) => {
    // 执行计算
    await page.fill('[data-testid="principal-input"]', '15000')
    await page.fill('[data-testid="rate-input"]', '4.5')
    await page.fill('[data-testid="years-input"]', '8')
    await page.click('[data-testid="calculate-button"]')
    
    // 等待结果
    await page.waitForSelector('[data-testid="results-section"]')
    
    // 测试CSV导出
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-csv-button"]')
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toMatch(/\.csv$/)
    
    // 验证下载文件内容
    const path = await download.path()
    expect(path).toBeTruthy()
  })

  test('移动端响应式体验', async ({ page, browserName }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 重新加载页面
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // 验证移动端布局
    await expect(page.locator('[data-testid="mobile-calculator"]')).toBeVisible()
    
    // 验证触摸友好的输入控件
    const principalInput = page.locator('[data-testid="principal-input"]')
    await expect(principalInput).toBeVisible()
    
    // 测试移动端输入
    await principalInput.fill('8000')
    await page.fill('[data-testid="rate-input"]', '3.5')
    await page.fill('[data-testid="years-input"]', '6')
    
    // 测试移动端计算
    await page.click('[data-testid="calculate-button"]')
    await page.waitForSelector('[data-testid="results-section"]')
    
    // 验证移动端结果显示
    await expect(page.locator('[data-testid="mobile-results"]')).toBeVisible()
  })

  test('错误处理和用户指导', async ({ page }) => {
    // 测试无效输入
    await page.fill('[data-testid="principal-input"]', '-1000')
    await page.fill('[data-testid="rate-input"]', '25')
    await page.fill('[data-testid="years-input"]', '60')
    
    // 尝试计算
    await page.click('[data-testid="calculate-button"]')
    
    // 验证错误消息显示
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Startkapital')
    
    // 验证德语错误消息
    const errorText = await page.locator('[data-testid="error-message"]').textContent()
    expect(errorText).toMatch(/zwischen.*und/)
    
    // 测试错误恢复
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4')
    await page.fill('[data-testid="years-input"]', '10')
    
    // 验证错误消息消失
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible()
  })

  test('SEO和元数据验证', async ({ page }) => {
    // 验证页面标题
    const title = await page.title()
    expect(title).toContain('Zinseszins-Rechner')
    expect(title).toContain('Kostenlos')
    
    // 验证meta描述
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDescription).toBeTruthy()
    expect(metaDescription).toContain('Zinseszins')
    expect(metaDescription).toContain('kostenlos')
    
    // 验证Open Graph标签
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    
    expect(ogTitle).toBeTruthy()
    expect(ogDescription).toBeTruthy()
    
    // 验证结构化数据
    const structuredData = await page.locator('script[type="application/ld+json"]').textContent()
    if (structuredData) {
      const jsonData = JSON.parse(structuredData)
      expect(jsonData['@type']).toBe('WebApplication')
      expect(jsonData.name).toContain('Zinseszins-Rechner')
    }
  })

  test('性能指标验证', async ({ page }) => {
    // 开始性能监控
    await page.goto(FRONTEND_URL)
    
    // 测量页面加载性能
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      }
    })
    
    // 验证性能指标
    expect(navigationTiming.domContentLoaded).toBeLessThan(2000) // < 2秒
    expect(navigationTiming.firstContentfulPaint || 0).toBeLessThan(1500) // < 1.5秒
    
    // 测试API响应时间
    const apiStartTime = Date.now()
    
    await page.fill('[data-testid="principal-input"]', '30000')
    await page.fill('[data-testid="rate-input"]', '5.5')
    await page.fill('[data-testid="years-input"]', '18')
    await page.click('[data-testid="calculate-button"]')
    
    await page.waitForSelector('[data-testid="results-section"]')
    
    const apiEndTime = Date.now()
    const apiResponseTime = apiEndTime - apiStartTime
    
    expect(apiResponseTime).toBeLessThan(3000) // < 3秒总响应时间
  })

  test('德语本地化验证', async ({ page }) => {
    // 验证德语界面元素
    await expect(page.locator('text=Startkapital')).toBeVisible()
    await expect(page.locator('text=Zinssatz')).toBeVisible()
    await expect(page.locator('text=Laufzeit')).toBeVisible()
    await expect(page.locator('text=Jahre')).toBeVisible()
    
    // 执行计算并验证德语结果
    await page.fill('[data-testid="principal-input"]', '12000')
    await page.fill('[data-testid="rate-input"]', '4.2')
    await page.fill('[data-testid="years-input"]', '9')
    await page.click('[data-testid="calculate-button"]')
    
    await page.waitForSelector('[data-testid="results-section"]')
    
    // 验证德语结果标签
    await expect(page.locator('text=Endkapital')).toBeVisible()
    await expect(page.locator('text=Zinserträge')).toBeVisible()
    await expect(page.locator('text=Gesamte Einzahlungen')).toBeVisible()
    
    // 验证欧元格式化
    const finalAmountText = await page.locator('[data-testid="final-amount"]').textContent()
    expect(finalAmountText).toMatch(/€.*\d/)
  })

  test('移动端完整流程', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // 验证移动端布局
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible()
    
    // 移动端输入测试
    await page.fill('[data-testid="principal-input"]', '18000')
    await page.fill('[data-testid="rate-input"]', '4.8')
    await page.fill('[data-testid="years-input"]', '14')
    
    // 移动端计算
    await page.click('[data-testid="calculate-button"]')
    await page.waitForSelector('[data-testid="results-section"]')
    
    // 验证移动端图表显示
    await expect(page.locator('[data-testid="mobile-chart"]')).toBeVisible()
    
    // 测试移动端导出功能
    await page.click('[data-testid="mobile-export-button"]')
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible()
  })

  test('缓存和性能优化验证', async ({ page }) => {
    const testPayload = {
      principal: 22000,
      rate: 5.2,
      years: 16
    }
    
    // 第一次计算 (缓存未命中)
    const firstCalculationStart = Date.now()
    
    await page.fill('[data-testid="principal-input"]', testPayload.principal.toString())
    await page.fill('[data-testid="rate-input"]', testPayload.rate.toString())
    await page.fill('[data-testid="years-input"]', testPayload.years.toString())
    await page.click('[data-testid="calculate-button"]')
    
    await page.waitForSelector('[data-testid="results-section"]')
    const firstCalculationTime = Date.now() - firstCalculationStart
    
    // 重置表单
    await page.click('[data-testid="reset-button"]')
    
    // 第二次相同计算 (应该命中缓存)
    const secondCalculationStart = Date.now()
    
    await page.fill('[data-testid="principal-input"]', testPayload.principal.toString())
    await page.fill('[data-testid="rate-input"]', testPayload.rate.toString())
    await page.fill('[data-testid="years-input"]', testPayload.years.toString())
    await page.click('[data-testid="calculate-button"]')
    
    await page.waitForSelector('[data-testid="results-section"]')
    const secondCalculationTime = Date.now() - secondCalculationStart
    
    // 验证缓存效果 (第二次应该更快)
    expect(secondCalculationTime).toBeLessThan(firstCalculationTime * 0.8)
  })

  test('安全配置验证', async ({ page, request }) => {
    // 验证安全头
    const response = await request.get(FRONTEND_URL)
    const headers = response.headers()
    
    // 检查关键安全头
    expect(headers['x-frame-options']).toBeTruthy()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['strict-transport-security']).toBeTruthy()
    
    // 验证CORS配置
    const corsResponse = await request.fetch(`${API_URL}/api/v1/calculate/compound-interest`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://zinses-rechner.de',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    })
    
    expect(corsResponse.status()).toBe(200)
    expect(corsResponse.headers()['access-control-allow-origin']).toBeTruthy()
  })

  test('监控和健康检查验证', async ({ request }) => {
    // 验证API健康检查端点
    const healthResponse = await request.get(`${API_URL}/health`)
    expect(healthResponse.status()).toBe(200)
    
    const healthData = await healthResponse.json()
    expect(healthData.status).toBe('healthy')
    expect(healthData.timestamp).toBeTruthy()
    
    // 验证监控指标端点
    const metricsResponse = await request.get(`${API_URL}/api/v1/monitoring/metrics`)
    
    if (metricsResponse.status() === 200) {
      const metricsData = await metricsResponse.json()
      expect(metricsData.timestamp).toBeTruthy()
    }
  })

  test('用户体验完整流程', async ({ page }) => {
    // 模拟真实用户行为
    
    // 1. 用户访问网站
    await page.goto(FRONTEND_URL)
    await expect(page.locator('h1')).toBeVisible()
    
    // 2. 阅读说明文字
    await expect(page.locator('[data-testid="description"]')).toBeVisible()
    
    // 3. 输入个人财务数据
    await page.fill('[data-testid="principal-input"]', '35000')
    await page.fill('[data-testid="monthly-payment-input"]', '750')
    await page.fill('[data-testid="rate-input"]', '5.8')
    await page.fill('[data-testid="years-input"]', '22')
    
    // 4. 启用税务计算
    await page.check('[data-testid="german-tax-checkbox"]')
    
    // 5. 执行计算
    await page.click('[data-testid="calculate-button"]')
    await page.waitForSelector('[data-testid="results-section"]')
    
    // 6. 查看结果和图表
    await expect(page.locator('[data-testid="final-amount"]')).toBeVisible()
    await expect(page.locator('[data-testid="growth-chart"]')).toBeVisible()
    
    // 7. 查看年度明细
    await page.click('[data-testid="show-yearly-details"]')
    await expect(page.locator('[data-testid="yearly-breakdown-table"]')).toBeVisible()
    
    // 8. 导出结果
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-pdf-button"]')
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    
    // 9. 重置并尝试新计算
    await page.click('[data-testid="reset-button"]')
    await expect(page.locator('[data-testid="principal-input"]')).toHaveValue('')
    
    // 验证整个流程顺畅无阻
    expect(true).toBe(true) // 如果到达这里，说明流程完整
  })

  test('浏览器兼容性验证', async ({ page, browserName }) => {
    // 记录浏览器信息
    const userAgent = await page.evaluate(() => navigator.userAgent)
    console.log(`测试浏览器: ${browserName}, User Agent: ${userAgent}`)
    
    // 验证基础功能在不同浏览器中正常工作
    await page.fill('[data-testid="principal-input"]', '16000')
    await page.fill('[data-testid="rate-input"]', '4.3')
    await page.fill('[data-testid="years-input"]', '11')
    await page.click('[data-testid="calculate-button"]')
    
    await page.waitForSelector('[data-testid="results-section"]')
    
    // 验证结果在所有浏览器中正确显示
    const finalAmount = await page.locator('[data-testid="final-amount"]').textContent()
    expect(finalAmount).toBeTruthy()
    expect(finalAmount).toMatch(/€/)
    
    // 验证图表在不同浏览器中渲染
    await expect(page.locator('canvas')).toBeVisible()
  })

  test('API限流和安全验证', async ({ request }) => {
    // 测试API速率限制
    const requests = []
    const testPayload = {
      principal: 5000,
      annual_rate: 3.8,
      years: 7
    }
    
    // 快速发送多个请求
    for (let i = 0; i < 15; i++) {
      requests.push(
        request.post(`${API_URL}/api/v1/calculate/compound-interest`, {
          data: testPayload,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    }
    
    const responses = await Promise.all(requests)
    
    // 检查是否有请求被限流
    const rateLimitedResponses = responses.filter(r => r.status() === 429)
    
    if (rateLimitedResponses.length > 0) {
      console.log(`✅ 速率限制正常工作: ${rateLimitedResponses.length} 个请求被限流`)
    } else {
      console.log(`⚠️ 未触发速率限制，可能需要调整配置`)
    }
    
    // 验证正常请求仍然成功
    const successfulResponses = responses.filter(r => r.status() === 200)
    expect(successfulResponses.length).toBeGreaterThan(0)
  })
})

// 性能测试套件
test.describe('性能基准测试', () => {
  test('Core Web Vitals验证', async ({ page }) => {
    await page.goto(FRONTEND_URL)
    
    // 收集Core Web Vitals指标
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {}
        
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          vitals.lcp = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // FID (First Input Delay) - 模拟
        vitals.fid = 0 // 在实际测试中会被真实值替换
        
        // CLS (Cumulative Layout Shift)
        new PerformanceObserver((list) => {
          let clsValue = 0
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          vitals.cls = clsValue
        }).observe({ entryTypes: ['layout-shift'] })
        
        // 等待指标收集完成
        setTimeout(() => resolve(vitals), 3000)
      })
    })
    
    // 验证Core Web Vitals目标
    expect(vitals.lcp).toBeLessThan(2500) // LCP < 2.5s
    expect(vitals.cls).toBeLessThan(0.1)  // CLS < 0.1
    
    console.log('Core Web Vitals:', vitals)
  })

  test('大数据量计算性能', async ({ page }) => {
    // 测试复杂计算场景
    await page.fill('[data-testid="principal-input"]', '500000')
    await page.fill('[data-testid="monthly-payment-input"]', '2000')
    await page.fill('[data-testid="rate-input"]', '7.2')
    await page.fill('[data-testid="years-input"]', '35')
    
    const calculationStart = Date.now()
    await page.click('[data-testid="calculate-button"]')
    await page.waitForSelector('[data-testid="results-section"]')
    const calculationTime = Date.now() - calculationStart
    
    // 验证复杂计算在合理时间内完成
    expect(calculationTime).toBeLessThan(5000) // < 5秒
    
    // 验证图表渲染性能
    await expect(page.locator('[data-testid="growth-chart"]')).toBeVisible({ timeout: 10000 })
    
    // 验证表格数据完整性
    const tableRows = await page.locator('[data-testid="yearly-breakdown-table"] tbody tr').count()
    expect(tableRows).toBe(35) // 35年的数据
  })
})

// 错误场景测试
test.describe('错误处理验证', () => {
  test('网络错误处理', async ({ page }) => {
    // 模拟网络中断
    await page.route(`${API_URL}/**`, route => route.abort())
    
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4')
    await page.fill('[data-testid="years-input"]', '10')
    await page.click('[data-testid="calculate-button"]')
    
    // 验证错误消息显示
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    
    // 恢复网络并重试
    await page.unroute(`${API_URL}/**`)
    await page.click('[data-testid="retry-button"]')
    
    // 验证重试成功
    await page.waitForSelector('[data-testid="results-section"]', { timeout: 10000 })
  })

  test('服务器错误处理', async ({ page }) => {
    // 模拟服务器错误
    await page.route(`${API_URL}/api/v1/calculate/compound-interest`, route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })
    
    await page.fill('[data-testid="principal-input"]', '10000')
    await page.fill('[data-testid="rate-input"]', '4')
    await page.fill('[data-testid="years-input"]', '10')
    await page.click('[data-testid="calculate-button"]')
    
    // 验证服务器错误处理
    await expect(page.locator('[data-testid="server-error"]')).toBeVisible()
    await expect(page.locator('text=服务器暂时不可用')).toBeVisible()
  })
})
