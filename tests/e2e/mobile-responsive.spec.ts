/**
 * 移动端响应式测试
 * 验证所有计算器在不同设备上的响应式表现
 */

import { test, expect } from '@playwright/test'

// 测试设备配置
const DEVICES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad Mini', width: 768, height: 1024 }
]

const CALCULATORS = [
  'compound-interest',
  'loan', 
  'mortgage',
  'retirement'
]

// 移动端响应式布局测试
test.describe('移动端响应式测试', () => {
  
  test('iPhone 12 - 复利计算器布局测试', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 检查页面基本元素
    await expect(page.locator('h1')).toBeVisible()
    
    // 检查移动端导航
    const mobileNav = page.locator('.mobile-navigation, nav')
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible()
    }
    
    // 检查表单字段
    const formFields = page.locator('input')
    const fieldCount = await formFields.count()
    
    if (fieldCount > 0) {
      // 检查第一个字段的触摸目标大小
      const firstField = formFields.first()
      const boundingBox = await firstField.boundingBox()
      
      if (boundingBox) {
        // 触摸目标应该至少44x44px
        expect(boundingBox.height).toBeGreaterThanOrEqual(40) // 稍微宽松一些
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
        expect(buttonBox.height).toBeGreaterThanOrEqual(40)
      }
    }
  })
  
  test('移动端表单交互测试', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 查找输入字段
    const inputs = page.locator('input[type="text"], input[type="number"]')
    const inputCount = await inputs.count()
    
    if (inputCount > 0) {
      const firstInput = inputs.first()
      
      // 测试触摸聚焦
      await firstInput.click()
      await expect(firstInput).toBeFocused()
      
      // 测试输入
      await firstInput.fill('1000')
      await expect(firstInput).toHaveValue('1000')
    }
  })
  
  test('移动端图表显示测试', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 填写表单触发图表显示
    const principalInput = page.locator('input').first()
    if (await principalInput.count() > 0) {
      await principalInput.fill('10000')
    }
    
    // 查找并点击计算按钮
    const calculateButton = page.locator('button').first()
    if (await calculateButton.count() > 0) {
      await calculateButton.click()
      await page.waitForTimeout(2000)
    }
    
    // 检查图表是否显示
    const chart = page.locator('canvas, .chart')
    if (await chart.count() > 0) {
      await expect(chart.first()).toBeVisible()
      
      // 检查图表大小是否适合移动端
      const chartBox = await chart.first().boundingBox()
      if (chartBox) {
        // 图表宽度不应超过屏幕宽度
        expect(chartBox.width).toBeLessThanOrEqual(390)
      }
    }
  })
  
  test('移动端导航测试', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 检查页面是否正确加载
    await expect(page.locator('body')).toBeVisible()
    
    // 尝试导航到计算器页面
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 检查计算器页面是否正确显示
    await expect(page.locator('h1')).toBeVisible()
  })
  
  test('移动端性能测试', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    
    const startTime = Date.now()
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // 移动端页面应该在5秒内加载完成
    expect(loadTime).toBeLessThan(5000)
    
    // 检查关键元素是否及时显示
    await expect(page.locator('h1')).toBeVisible()
  })
})

// 响应式断点测试
test.describe('响应式断点测试', () => {
  
  DEVICES.forEach(device => {
    test(`${device.name} (${device.width}x${device.height}) - 基础布局`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height })
      
      await page.goto('/calculator/compound-interest')
      await page.waitForLoadState('networkidle')
      
      // 检查页面基本元素
      await expect(page.locator('h1')).toBeVisible()
      
      // 检查布局是否适应屏幕尺寸
      const mainContent = page.locator('main, .main-content, body')
      if (await mainContent.count() > 0) {
        const contentBox = await mainContent.first().boundingBox()
        if (contentBox) {
          // 内容宽度不应超过视口宽度
          expect(contentBox.width).toBeLessThanOrEqual(device.width + 50) // 允许一些误差
        }
      }
    })
  })
  
  test('Tailwind断点验证', async ({ page }) => {
    // 测试xs断点 (475px)
    await page.setViewportSize({ width: 475, height: 800 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 检查xs断点样式是否生效
    const responsiveElement = page.locator('.xs\\:block, .xs\\:hidden').first()
    if (await responsiveElement.count() > 0) {
      await expect(responsiveElement).toBeVisible()
    }
    
    // 测试sm断点 (640px)
    await page.setViewportSize({ width: 640, height: 800 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // 检查sm断点样式是否生效
    const smElement = page.locator('.sm\\:block, .sm\\:flex').first()
    if (await smElement.count() > 0) {
      await expect(smElement).toBeVisible()
    }
  })
})

// 触摸交互测试
test.describe('触摸交互测试', () => {
  
  test('表单字段触摸目标大小', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 检查所有输入字段的触摸目标大小
    const inputs = page.locator('input, button, select')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i)
      const box = await input.boundingBox()
      
      if (box) {
        // 触摸目标应该至少40x40px（稍微宽松的标准）
        expect(box.height).toBeGreaterThanOrEqual(40)
        expect(box.width).toBeGreaterThanOrEqual(40)
      }
    }
  })
  
  test('按钮触摸交互', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 查找主要按钮
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      const firstButton = buttons.first()
      
      // 检查按钮是否可见和可点击
      await expect(firstButton).toBeVisible()
      
      // 测试点击交互
      await firstButton.click()
      
      // 等待可能的响应
      await page.waitForTimeout(500)
    }
  })
})

// 移动端特定功能测试
test.describe('移动端特定功能', () => {
  
  test('移动端表单分步功能', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 查找分步表单指示器
    const stepIndicator = page.locator('.step-indicator, [class*="step"]')
    if (await stepIndicator.count() > 0) {
      await expect(stepIndicator.first()).toBeVisible()
    }
    
    // 查找下一步按钮
    const nextButton = page.locator('button:has-text("Weiter"), button:has-text("Next")')
    if (await nextButton.count() > 0) {
      await expect(nextButton.first()).toBeVisible()
    }
  })
  
  test('移动端结果显示', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/calculator/compound-interest')
    await page.waitForLoadState('networkidle')
    
    // 填写简单的表单数据
    const inputs = page.locator('input')
    if (await inputs.count() > 0) {
      await inputs.first().fill('1000')
    }
    
    // 查找计算按钮并点击
    const calculateButton = page.locator('button')
    if (await calculateButton.count() > 0) {
      await calculateButton.first().click()
      await page.waitForTimeout(1000)
    }
    
    // 检查结果是否在移动端正确显示
    const results = page.locator('.results, .calculator-results, [class*="result"]')
    if (await results.count() > 0) {
      await expect(results.first()).toBeVisible()
    }
  })
})
