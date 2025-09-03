/**
 * 视觉回归测试
 * 确保所有计算器页面样式一致性，测试浏览器兼容性
 */

const { test, expect } = require('@playwright/test')

// 测试配置
const CALCULATORS = [
  'compound-interest',
  'loan',
  'mortgage', 
  'retirement',
  'portfolio',
  'tax-optimization',
  'savings-plan',
  'etf-savings-plan'
]

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
]

const BROWSERS = ['chromium', 'firefox', 'webkit']

// 基础样式一致性测试
test.describe('视觉回归测试 - 样式一致性', () => {
  
  CALCULATORS.forEach(calculatorId => {
    test(`${calculatorId} - 页面布局一致性`, async ({ page }) => {
      await page.goto(`/calculator/${calculatorId}`)
      
      // 等待页面完全加载
      await page.waitForLoadState('networkidle')
      await page.waitForSelector('.calculator-page', { timeout: 10000 })
      
      // 检查基础布局元素
      await expect(page.locator('.calculator-page')).toBeVisible()
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('.breadcrumb, nav[aria-label="Breadcrumb"]')).toBeVisible()
      
      // 检查表单和结果区域
      await expect(page.locator('.dynamic-form, form')).toBeVisible()
      await expect(page.locator('.results-section, .calculator-results')).toBeVisible()
      
      // 截图对比
      await expect(page).toHaveScreenshot(`${calculatorId}-layout.png`)
    })
  })
  
  // 响应式设计测试
  VIEWPORTS.forEach(viewport => {
    test(`响应式设计 - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      
      // 测试第一个计算器作为代表
      await page.goto('/calculator/compound-interest')
      await page.waitForLoadState('networkidle')
      
      // 检查移动端特定元素
      if (viewport.name === 'mobile') {
        // 检查移动端导航
        const mobileNav = page.locator('.mobile-navigation, .mobile-nav')
        if (await mobileNav.count() > 0) {
          await expect(mobileNav).toBeVisible()
        }
        
        // 检查移动端表单
        const mobileForm = page.locator('.mobile-form, .mobile-calculator-form')
        if (await mobileForm.count() > 0) {
          await expect(mobileForm).toBeVisible()
        }
      }
      
      // 截图对比
      await expect(page).toHaveScreenshot(`responsive-${viewport.name}.png`)
    })
  })
})

// 组件样式一致性测试
test.describe('组件样式一致性', () => {
  
  test('BaseButton 组件样式', async ({ page }) => {
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 查找所有按钮
    const buttons = page.locator('button, .btn')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      // 检查主要按钮样式
      const primaryButton = buttons.first()
      await expect(primaryButton).toBeVisible()
      
      // 检查按钮的基础样式类
      const buttonClass = await primaryButton.getAttribute('class')
      expect(buttonClass).toContain('inline-flex')
      expect(buttonClass).toContain('items-center')
      expect(buttonClass).toContain('justify-center')
    }
  })
  
  test('BaseCard 组件样式', async ({ page }) => {
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 查找卡片组件
    const cards = page.locator('.card, .base-card, [class*="card"]')
    const cardCount = await cards.count()
    
    if (cardCount > 0) {
      const firstCard = cards.first()
      await expect(firstCard).toBeVisible()
      
      // 检查卡片基础样式
      const cardStyles = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          backgroundColor: styles.backgroundColor,
          borderRadius: styles.borderRadius,
          boxShadow: styles.boxShadow
        }
      })
      
      // 验证卡片有背景色和圆角
      expect(cardStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
      expect(cardStyles.borderRadius).not.toBe('0px')
    }
  })
  
  test('德语数字格式化', async ({ page }) => {
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 填写表单触发计算
    await page.fill('input[name="principal"], input[placeholder*="Startkapital"]', '10000')
    await page.fill('input[name="monthlyPayment"], input[placeholder*="monatlich"]', '500')
    await page.fill('input[name="annualRate"], input[placeholder*="Zinssatz"]', '5')
    await page.fill('input[name="years"], input[placeholder*="Jahre"]', '10')
    
    // 点击计算按钮
    const calculateButton = page.locator('button[type="submit"], button:has-text("berechnen")')
    if (await calculateButton.count() > 0) {
      await calculateButton.click()
      await page.waitForTimeout(2000) // 等待计算完成
      
      // 检查结果中的德语数字格式
      const results = page.locator('.results, .calculator-results')
      if (await results.count() > 0) {
        const resultText = await results.textContent()
        
        // 检查德语货币格式 (1.234,56 €)
        const hasCurrencyFormat = /\d{1,3}(?:\.\d{3})*,\d{2}\s*€/.test(resultText)
        expect(hasCurrencyFormat).toBeTruthy()
      }
    }
  })
})

// 浏览器兼容性测试
test.describe('浏览器兼容性', () => {
  
  test('Chrome/Chromium 兼容性', async ({ page }) => {
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 检查页面基本功能
    await expect(page.locator('.calculator-page')).toBeVisible()
    
    // 检查JavaScript功能
    const jsErrors = []
    page.on('pageerror', error => jsErrors.push(error.message))
    
    // 触发一些交互
    const input = page.locator('input').first()
    if (await input.count() > 0) {
      await input.fill('1000')
      await input.blur()
    }
    
    // 验证没有JavaScript错误
    expect(jsErrors.length).toBe(0)
  })
  
  test('CSS Grid 和 Flexbox 支持', async ({ page }) => {
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 检查Grid布局
    const gridElements = page.locator('[class*="grid"], .grid')
    if (await gridElements.count() > 0) {
      const gridStyles = await gridElements.first().evaluate(el => {
        return window.getComputedStyle(el).display
      })
      expect(gridStyles).toBe('grid')
    }
    
    // 检查Flex布局
    const flexElements = page.locator('[class*="flex"], .flex')
    if (await flexElements.count() > 0) {
      const flexStyles = await flexElements.first().evaluate(el => {
        return window.getComputedStyle(el).display
      })
      expect(flexStyles).toBe('flex')
    }
  })
})

// 性能测试
test.describe('性能测试', () => {
  
  test('页面加载性能', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // 页面应该在3秒内加载完成
    expect(loadTime).toBeLessThan(3000)
    
    // 检查Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const metrics = {}
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime
            }
            if (entry.entryType === 'first-input') {
              metrics.fid = entry.processingStart - entry.startTime
            }
            if (entry.entryType === 'layout-shift') {
              metrics.cls = entry.value
            }
          })
          
          resolve(metrics)
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
        
        // 超时保护
        setTimeout(() => resolve({}), 5000)
      })
    })
    
    // LCP应该小于2.5秒
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500)
    }
    
    // FID应该小于100ms
    if (metrics.fid) {
      expect(metrics.fid).toBeLessThan(100)
    }
    
    // CLS应该小于0.1
    if (metrics.cls) {
      expect(metrics.cls).toBeLessThan(0.1)
    }
  })
})

// 可访问性测试
test.describe('可访问性测试', () => {
  
  test('键盘导航', async ({ page }) => {
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 测试Tab键导航
    await page.keyboard.press('Tab')
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // 继续Tab导航
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // 测试Enter键激活
    await page.keyboard.press('Enter')
  })
  
  test('ARIA标签', async ({ page }) => {
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 检查表单标签
    const labels = page.locator('label')
    const labelCount = await labels.count()
    
    if (labelCount > 0) {
      // 每个label都应该有for属性或包含input
      for (let i = 0; i < labelCount; i++) {
        const label = labels.nth(i)
        const hasFor = await label.getAttribute('for')
        const hasInput = await label.locator('input').count() > 0
        
        expect(hasFor || hasInput).toBeTruthy()
      }
    }
    
    // 检查按钮的aria-label
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i)
        const hasText = (await button.textContent()).trim().length > 0
        const hasAriaLabel = await button.getAttribute('aria-label')
        
        expect(hasText || hasAriaLabel).toBeTruthy()
      }
    }
  })
})
