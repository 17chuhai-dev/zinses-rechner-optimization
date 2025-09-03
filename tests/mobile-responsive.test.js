/**
 * 移动端响应式测试
 * 验证所有计算器在不同设备上的响应式表现
 */

import { test, expect } from '@playwright/test'

// 测试设备配置
const DEVICES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 }
]

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

// 移动端响应式布局测试
test.describe('移动端响应式测试', () => {
  
  DEVICES.forEach(device => {
    test(`${device.name} (${device.width}x${device.height}) - 布局测试`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height })
      
      // 测试首页响应式
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // 检查移动端导航是否正确显示
      if (device.width < 1024) {
        // 移动端应该显示移动导航
        await expect(page.locator('.mobile-navigation')).toBeVisible()
        await expect(page.locator('.lg\\:hidden')).toBeVisible()
        
        // 桌面端导航应该隐藏
        const desktopNav = page.locator('.hidden.lg\\:block')
        if (await desktopNav.count() > 0) {
          await expect(desktopNav).not.toBeVisible()
        }
      } else {
        // 平板/桌面端可能显示桌面导航
        const desktopNav = page.locator('.hidden.lg\\:block')
        if (await desktopNav.count() > 0) {
          await expect(desktopNav).toBeVisible()
        }
      }
      
      // 截图对比
      await expect(page).toHaveScreenshot(`${device.name.replace(/\s+/g, '-')}-homepage.png`)
    })
  })
  
  // 计算器页面响应式测试
  CALCULATORS.forEach(calculatorId => {
    test(`移动端计算器 - ${calculatorId}`, async ({ page }) => {
      // 使用iPhone 12作为标准移动设备
      await page.setViewportSize({ width: 390, height: 844 })
      
      await page.goto(`/calculator/${calculatorId}`)
      await page.waitForLoadState('networkidle')
      
      // 检查页面基本元素
      await expect(page.locator('h1')).toBeVisible()
      
      // 检查移动端表单
      const mobileForm = page.locator('.mobile-calculator-form, .mobile-form')
      if (await mobileForm.count() > 0) {
        await expect(mobileForm).toBeVisible()
        
        // 检查分步表单功能
        const stepIndicator = page.locator('.step-indicator, [class*="step"]')
        if (await stepIndicator.count() > 0) {
          await expect(stepIndicator).toBeVisible()
        }
      }
      
      // 检查表单字段
      const formFields = page.locator('input, select, textarea')
      const fieldCount = await formFields.count()
      
      if (fieldCount > 0) {
        // 检查第一个字段的触摸目标大小
        const firstField = formFields.first()
        const boundingBox = await firstField.boundingBox()
        
        if (boundingBox) {
          // 触摸目标应该至少44x44px
          expect(boundingBox.height).toBeGreaterThanOrEqual(44)
          
          // 字段应该有足够的间距
          const fieldContainer = page.locator('.mobile-form-field, .form-field').first()
          if (await fieldContainer.count() > 0) {
            const containerBox = await fieldContainer.boundingBox()
            if (containerBox) {
              expect(containerBox.height).toBeGreaterThanOrEqual(60) // 包含标签和间距
            }
          }
        }
      }
      
      // 检查按钮大小
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      if (buttonCount > 0) {
        const primaryButton = buttons.first()
        const buttonBox = await primaryButton.boundingBox()
        
        if (buttonBox) {
          // 按钮触摸目标应该至少44x44px
          expect(buttonBox.height).toBeGreaterThanOrEqual(44)
          expect(buttonBox.width).toBeGreaterThanOrEqual(44)
        }
      }
      
      // 截图对比
      await expect(page).toHaveScreenshot(`mobile-${calculatorId}.png`)
    })
  })
})

// 触摸交互测试
test.describe('触摸交互测试', () => {
  
  test('表单字段触摸交互', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 查找输入字段
    const inputs = page.locator('input[type="text"], input[type="number"]')
    const inputCount = await inputs.count()
    
    if (inputCount > 0) {
      const firstInput = inputs.first()
      
      // 测试触摸聚焦
      await firstInput.tap()
      await expect(firstInput).toBeFocused()
      
      // 测试输入
      await firstInput.fill('1000')
      await expect(firstInput).toHaveValue('1000')
      
      // 测试失焦
      await page.tap('body')
      await expect(firstInput).not.toBeFocused()
    }
  })
  
  test('按钮触摸交互', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 查找计算按钮
    const calculateButton = page.locator('button:has-text("berechnen"), button:has-text("Berechnen")')
    
    if (await calculateButton.count() > 0) {
      // 检查按钮是否可点击
      await expect(calculateButton).toBeVisible()
      await expect(calculateButton).toBeEnabled()
      
      // 测试触摸反馈
      await calculateButton.tap()
      
      // 等待可能的加载状态
      await page.waitForTimeout(1000)
    }
  })
  
  test('移动端导航触摸交互', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 查找移动端菜单按钮
    const menuButton = page.locator('button:has([name="menu"]), button:has-text("Menu"), .mobile-menu-button')
    
    if (await menuButton.count() > 0) {
      // 测试菜单打开
      await menuButton.tap()
      await page.waitForTimeout(500)
      
      // 检查菜单是否打开
      const mobileMenu = page.locator('.mobile-menu, [class*="mobile-nav"]')
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu).toBeVisible()
        
        // 测试菜单关闭
        const closeButton = page.locator('button:has([name="x"]), button:has-text("Close")')
        if (await closeButton.count() > 0) {
          await closeButton.tap()
          await page.waitForTimeout(500)
          await expect(mobileMenu).not.toBeVisible()
        }
      }
    }
  })
})

// 移动端图表测试
test.describe('移动端图表测试', () => {
  
  test('图表在小屏幕上的显示', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 填写表单触发图表显示
    const principalInput = page.locator('input[name="principal"], input[placeholder*="Startkapital"]')
    if (await principalInput.count() > 0) {
      await principalInput.fill('10000')
    }
    
    const rateInput = page.locator('input[name="annualRate"], input[placeholder*="Zinssatz"]')
    if (await rateInput.count() > 0) {
      await rateInput.fill('5')
    }
    
    const yearsInput = page.locator('input[name="years"], input[placeholder*="Jahre"]')
    if (await yearsInput.count() > 0) {
      await yearsInput.fill('10')
    }
    
    // 点击计算
    const calculateButton = page.locator('button:has-text("berechnen"), button:has-text("Berechnen")')
    if (await calculateButton.count() > 0) {
      await calculateButton.click()
      await page.waitForTimeout(2000)
    }
    
    // 检查图表是否显示
    const chart = page.locator('canvas, .chart, [class*="chart"]')
    if (await chart.count() > 0) {
      await expect(chart).toBeVisible()
      
      // 检查图表大小是否适合移动端
      const chartBox = await chart.first().boundingBox()
      if (chartBox) {
        // 图表宽度不应超过屏幕宽度
        expect(chartBox.width).toBeLessThanOrEqual(390)
        // 图表应该有合理的高度
        expect(chartBox.height).toBeGreaterThan(200)
        expect(chartBox.height).toBeLessThan(600)
      }
    }
  })
  
  test('图表触摸交互', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 触发图表显示（简化版）
    await page.evaluate(() => {
      // 模拟计算完成，显示图表
      const event = new CustomEvent('calculationComplete', {
        detail: { results: { finalAmount: 16288.95, totalInterest: 6288.95 } }
      })
      document.dispatchEvent(event)
    })
    
    await page.waitForTimeout(1000)
    
    // 查找图表
    const chart = page.locator('canvas')
    if (await chart.count() > 0) {
      const chartElement = chart.first()
      
      // 测试触摸交互
      await chartElement.tap()
      
      // 检查是否有工具提示或交互反馈
      const tooltip = page.locator('.tooltip, [class*="tooltip"]')
      if (await tooltip.count() > 0) {
        // 工具提示应该在触摸后显示
        await expect(tooltip).toBeVisible()
      }
    }
  })
})

// 性能测试
test.describe('移动端性能测试', () => {
  
  test('移动端页面加载性能', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    
    const startTime = Date.now()
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // 移动端页面应该在4秒内加载完成（比桌面端稍宽松）
    expect(loadTime).toBeLessThan(4000)
    
    // 检查关键元素是否及时显示
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('form, .calculator-form')).toBeVisible()
  })
  
  test('移动端滚动性能', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 测试页面滚动
    const startY = 100
    const endY = 500
    
    await page.mouse.move(200, startY)
    await page.mouse.down()
    await page.mouse.move(200, endY, { steps: 10 })
    await page.mouse.up()
    
    // 等待滚动完成
    await page.waitForTimeout(500)
    
    // 检查页面是否正常滚动
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBeGreaterThan(0)
  })
})
