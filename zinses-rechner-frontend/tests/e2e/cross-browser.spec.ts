/**
 * 跨浏览器兼容性测试
 * 验证在不同浏览器和设备上的功能一致性
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// 浏览器特定的测试配置
const browserConfigs = {
  chromium: {
    name: 'Chrome',
    features: ['webp', 'avif', 'css-grid', 'flexbox', 'es6-modules']
  },
  firefox: {
    name: 'Firefox',
    features: ['webp', 'css-grid', 'flexbox', 'es6-modules']
  },
  webkit: {
    name: 'Safari',
    features: ['webp', 'css-grid', 'flexbox', 'es6-modules']
  }
}

// 设备特定的测试配置
const deviceConfigs = {
  desktop: {
    viewport: { width: 1920, height: 1080 },
    features: ['hover', 'keyboard-navigation', 'right-click']
  },
  tablet: {
    viewport: { width: 768, height: 1024 },
    features: ['touch', 'orientation-change']
  },
  mobile: {
    viewport: { width: 375, height: 667 },
    features: ['touch', 'orientation-change', 'small-screen']
  }
}

test.describe('跨浏览器兼容性', () => {
  test('所有浏览器应该正确加载页面', async ({ page, browserName }) => {
    const config = browserConfigs[browserName as keyof typeof browserConfigs]
    
    console.log(`测试浏览器: ${config.name}`)
    
    // 访问主页
    await page.goto('/')
    
    // 验证页面基本元素
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-testid="calculator-form"]')).toBeVisible()
    
    // 验证CSS加载
    const backgroundColor = await page.locator('body').evaluate(el => 
      getComputedStyle(el).backgroundColor
    )
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)') // 不应该是透明
    
    // 验证JavaScript功能
    await page.locator('[data-testid="principal-input"]').fill('10000')
    const inputValue = await page.locator('[data-testid="principal-input"]').inputValue()
    expect(inputValue).toBe('10000')
  })

  test('计算功能在所有浏览器中应该一致', async ({ page, browserName }) => {
    const config = browserConfigs[browserName as keyof typeof browserConfigs]
    
    console.log(`测试计算功能 - ${config.name}`)
    
    await page.goto('/')
    
    // 填写测试数据
    await page.locator('[data-testid="principal-input"]').fill('10000')
    await page.locator('[data-testid="rate-input"]').fill('4')
    await page.locator('[data-testid="years-input"]').fill('10')
    
    // 执行计算
    await page.locator('[data-testid="calculate-button"]').click()
    
    // 等待结果
    await page.waitForSelector('[data-testid="calculation-result"]', { 
      state: 'visible',
      timeout: 10000 
    })
    
    // 验证结果一致性
    const finalAmount = await page.locator('[data-testid="final-amount"]').textContent()
    expect(finalAmount).toContain('14.802,44') // 德语格式
    
    // 验证图表渲染
    const chartElement = page.locator('[data-testid="calculation-chart"]')
    await expect(chartElement).toBeVisible()
    
    // 验证图表SVG元素（确保图表正确渲染）
    const svgElements = chartElement.locator('svg')
    await expect(svgElements).toHaveCount(1)
  })

  test('表单验证在所有浏览器中应该工作', async ({ page, browserName }) => {
    console.log(`测试表单验证 - ${browserConfigs[browserName as keyof typeof browserConfigs].name}`)
    
    await page.goto('/')
    
    // 测试HTML5验证
    const principalInput = page.locator('[data-testid="principal-input"]')
    await principalInput.fill('-1000')
    
    // 检查浏览器原生验证
    const validationMessage = await principalInput.evaluate((el: HTMLInputElement) => 
      el.validationMessage
    )
    
    // 不同浏览器的验证消息可能不同，但应该存在
    if (validationMessage) {
      console.log(`浏览器验证消息: ${validationMessage}`)
    }
    
    // 测试自定义验证
    await page.locator('[data-testid="calculate-button"]').click()
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
  })
})

test.describe('响应式设计测试', () => {
  test('桌面端布局应该正确', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    
    // 验证桌面端布局
    const container = page.locator('.container')
    const containerWidth = await container.evaluate(el => el.offsetWidth)
    expect(containerWidth).toBeGreaterThan(1000)
    
    // 验证侧边栏显示
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    
    // 验证多列布局
    const formSection = page.locator('[data-testid="form-section"]')
    const resultSection = page.locator('[data-testid="result-section"]')
    
    const formBox = await formSection.boundingBox()
    const resultBox = await resultSection.boundingBox()
    
    // 在桌面端，表单和结果应该并排显示
    if (formBox && resultBox) {
      expect(Math.abs(formBox.y - resultBox.y)).toBeLessThan(50) // 大致同一水平线
    }
  })

  test('平板端布局应该适配', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    
    // 验证平板端布局调整
    const container = page.locator('.container')
    const containerWidth = await container.evaluate(el => el.offsetWidth)
    expect(containerWidth).toBeLessThan(800)
    
    // 验证导航菜单适配
    const navigation = page.locator('nav')
    await expect(navigation).toBeVisible()
    
    // 测试触摸交互
    await page.locator('[data-testid="principal-input"]').tap()
    await expect(page.locator('[data-testid="principal-input"]')).toBeFocused()
  })

  test('移动端布局应该优化', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // 验证移动端单列布局
    const formSection = page.locator('[data-testid="form-section"]')
    const resultSection = page.locator('[data-testid="result-section"]')
    
    const formBox = await formSection.boundingBox()
    const resultBox = await resultSection.boundingBox()
    
    // 在移动端，结果应该在表单下方
    if (formBox && resultBox) {
      expect(resultBox.y).toBeGreaterThan(formBox.y + formBox.height - 100)
    }
    
    // 验证移动端特定元素
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible()
    
    // 测试移动端计算流程
    await page.locator('[data-testid="principal-input"]').fill('10000')
    await page.locator('[data-testid="rate-input"]').fill('4')
    await page.locator('[data-testid="years-input"]').fill('10')
    
    await page.locator('[data-testid="calculate-button"]').tap()
    await expect(page.locator('[data-testid="calculation-result"]')).toBeVisible()
  })

  test('横屏模式应该正确适配', async ({ page }) => {
    // 设置横屏模式
    await page.setViewportSize({ width: 667, height: 375 })
    await page.goto('/')
    
    // 验证横屏布局
    await expect(page.locator('[data-testid="calculator-form"]')).toBeVisible()
    
    // 验证内容不被截断
    const calculateButton = page.locator('[data-testid="calculate-button"]')
    const buttonBox = await calculateButton.boundingBox()
    expect(buttonBox?.y).toBeLessThan(375) // 按钮应该在视口内
  })
})

test.describe('浏览器特性兼容性', () => {
  test('现代JavaScript特性应该正常工作', async ({ page, browserName }) => {
    await page.goto('/')
    
    // 测试ES6+特性支持
    const jsFeatures = await page.evaluate(() => {
      const features = {
        arrow_functions: (() => true)(),
        template_literals: `test${1}` === 'test1',
        destructuring: (() => { const [a] = [1]; return a === 1 })(),
        async_await: typeof (async () => {}) === 'function',
        fetch_api: typeof fetch === 'function',
        promises: typeof Promise === 'function',
        modules: typeof import === 'function'
      }
      
      return features
    })
    
    // 验证关键特性支持
    expect(jsFeatures.arrow_functions).toBe(true)
    expect(jsFeatures.fetch_api).toBe(true)
    expect(jsFeatures.promises).toBe(true)
    
    console.log(`${browserConfigs[browserName as keyof typeof browserConfigs].name} JS特性支持:`, jsFeatures)
  })

  test('CSS特性应该正确渲染', async ({ page, browserName }) => {
    await page.goto('/')
    
    // 测试CSS Grid支持
    const gridSupport = await page.evaluate(() => {
      const testEl = document.createElement('div')
      testEl.style.display = 'grid'
      return testEl.style.display === 'grid'
    })
    
    expect(gridSupport).toBe(true)
    
    // 测试Flexbox支持
    const flexSupport = await page.evaluate(() => {
      const testEl = document.createElement('div')
      testEl.style.display = 'flex'
      return testEl.style.display === 'flex'
    })
    
    expect(flexSupport).toBe(true)
    
    // 测试CSS自定义属性
    const customPropsSupport = await page.evaluate(() => {
      return CSS.supports('color', 'var(--test-color)')
    })
    
    expect(customPropsSupport).toBe(true)
    
    console.log(`${browserConfigs[browserName as keyof typeof browserConfigs].name} CSS特性支持完整`)
  })

  test('Web API应该可用', async ({ page, browserName }) => {
    await page.goto('/')
    
    // 测试关键Web API
    const apiSupport = await page.evaluate(() => {
      return {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        intersectionObserver: typeof IntersectionObserver !== 'undefined',
        resizeObserver: typeof ResizeObserver !== 'undefined',
        webWorkers: typeof Worker !== 'undefined',
        serviceWorkers: 'serviceWorker' in navigator,
        clipboard: navigator.clipboard !== undefined
      }
    })
    
    // 验证关键API支持
    expect(apiSupport.localStorage).toBe(true)
    expect(apiSupport.fetch).toBe(true)
    
    console.log(`${browserConfigs[browserName as keyof typeof browserConfigs].name} Web API支持:`, apiSupport)
  })
})

test.describe('错误处理兼容性', () => {
  test('网络错误应该在所有浏览器中正确处理', async ({ page, browserName }) => {
    await page.goto('/')
    
    // 模拟网络错误
    await page.route('**/api/**', route => {
      route.abort('failed')
    })
    
    // 尝试执行计算
    await page.locator('[data-testid="principal-input"]').fill('10000')
    await page.locator('[data-testid="rate-input"]').fill('4')
    await page.locator('[data-testid="years-input"]').fill('10')
    await page.locator('[data-testid="calculate-button"]').click()
    
    // 验证错误处理
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=Netzwerkfehler')).toBeVisible()
    
    console.log(`${browserConfigs[browserName as keyof typeof browserConfigs].name} 网络错误处理正常`)
  })

  test('JavaScript错误应该被正确捕获', async ({ page, browserName }) => {
    await page.goto('/')
    
    // 监听控制台错误
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // 监听页面错误
    const pageErrors: string[] = []
    page.on('pageerror', error => {
      pageErrors.push(error.message)
    })
    
    // 执行正常操作
    await page.locator('[data-testid="principal-input"]').fill('10000')
    await page.locator('[data-testid="rate-input"]').fill('4')
    await page.locator('[data-testid="years-input"]').fill('10')
    await page.locator('[data-testid="calculate-button"]').click()
    
    // 等待操作完成
    await page.waitForTimeout(2000)
    
    // 验证没有未捕获的错误
    expect(pageErrors.length).toBe(0)
    
    // 允许一些非关键的控制台警告，但不应该有错误
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('DevTools') &&
      !error.includes('Extension')
    )
    
    expect(criticalErrors.length).toBe(0)
    
    console.log(`${config.name} JavaScript错误处理验证通过`)
  })
})

test.describe('性能兼容性', () => {
  test('页面加载性能应该在所有浏览器中达标', async ({ page, browserName }) => {
    const config = browserConfigs[browserName as keyof typeof browserConfigs]
    
    console.log(`测试页面性能 - ${config.name}`)
    
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // 不同浏览器允许不同的性能阈值
    const performanceThresholds = {
      chromium: 3000,
      firefox: 4000,
      webkit: 5000
    }
    
    const threshold = performanceThresholds[browserName as keyof typeof performanceThresholds]
    expect(loadTime).toBeLessThan(threshold)
    
    console.log(`${config.name} 页面加载时间: ${loadTime}ms (阈值: ${threshold}ms)`)
  })

  test('计算性能应该在所有浏览器中一致', async ({ page, browserName }) => {
    const config = browserConfigs[browserName as keyof typeof browserConfigs]
    
    await page.goto('/')
    
    // 填写复杂计算数据
    await page.locator('[data-testid="principal-input"]').fill('100000')
    await page.locator('[data-testid="rate-input"]').fill('7.5')
    await page.locator('[data-testid="years-input"]').fill('30')
    await page.locator('[data-testid="monthly-payment-input"]').fill('1000')
    
    const startTime = Date.now()
    await page.locator('[data-testid="calculate-button"]').click()
    await page.waitForSelector('[data-testid="calculation-result"]', { state: 'visible' })
    const calculationTime = Date.now() - startTime
    
    // 计算时间应该在合理范围内
    expect(calculationTime).toBeLessThan(3000)
    
    console.log(`${config.name} 计算性能: ${calculationTime}ms`)
  })
})

test.describe('功能特性兼容性', () => {
  test('数据导出功能应该在所有浏览器中工作', async ({ page, browserName }) => {
    const config = browserConfigs[browserName as keyof typeof browserConfigs]
    
    console.log(`测试数据导出 - ${config.name}`)
    
    await page.goto('/')
    
    // 执行计算
    await page.locator('[data-testid="principal-input"]').fill('10000')
    await page.locator('[data-testid="rate-input"]').fill('4')
    await page.locator('[data-testid="years-input"]').fill('10')
    await page.locator('[data-testid="calculate-button"]').click()
    
    await page.waitForSelector('[data-testid="calculation-result"]', { state: 'visible' })
    
    // 测试PDF导出
    const downloadPromise = page.waitForEvent('download')
    await page.locator('[data-testid="export-pdf"]').click()
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    
    console.log(`${config.name} PDF导出功能正常`)
  })

  test('剪贴板功能应该兼容', async ({ page, browserName, context }) => {
    const config = browserConfigs[browserName as keyof typeof browserConfigs]
    
    // 授予剪贴板权限
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    
    await page.goto('/')
    
    // 执行计算
    await page.locator('[data-testid="principal-input"]').fill('10000')
    await page.locator('[data-testid="rate-input"]').fill('4')
    await page.locator('[data-testid="years-input"]').fill('10')
    await page.locator('[data-testid="calculate-button"]').click()
    
    await page.waitForSelector('[data-testid="calculation-result"]', { state: 'visible' })
    
    // 测试复制功能
    await page.locator('[data-testid="copy-result"]').click()
    
    // 验证复制成功提示
    await expect(page.locator('text=Ergebnis kopiert')).toBeVisible()
    
    console.log(`${config.name} 剪贴板功能正常`)
  })

  test('本地存储应该在所有浏览器中持久化', async ({ page, browserName }) => {
    const config = browserConfigs[browserName as keyof typeof browserConfigs]
    
    await page.goto('/')
    
    // 设置用户偏好
    await page.evaluate(() => {
      localStorage.setItem('user-preference-theme', 'dark')
      localStorage.setItem('user-preference-currency', 'EUR')
    })
    
    // 刷新页面
    await page.reload()
    
    // 验证数据持久化
    const storedData = await page.evaluate(() => {
      return {
        theme: localStorage.getItem('user-preference-theme'),
        currency: localStorage.getItem('user-preference-currency')
      }
    })
    
    expect(storedData.theme).toBe('dark')
    expect(storedData.currency).toBe('EUR')
    
    console.log(`${config.name} 本地存储功能正常`)
  })
})
