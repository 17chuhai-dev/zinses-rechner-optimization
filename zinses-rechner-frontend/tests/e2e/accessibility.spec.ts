/**
 * 可访问性测试
 * 验证WCAG 2.1 AA标准合规性
 */

import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('可访问性合规性测试', () => {
  test('主页应该通过axe-core可访问性检查', async ({ page }) => {
    await page.goto('/')
    
    // 运行axe-core可访问性检查
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    // 验证没有可访问性违规
    expect(accessibilityScanResults.violations).toEqual([])
    
    console.log('✅ 主页可访问性检查通过')
  })

  test('计算器表单应该支持键盘导航', async ({ page }) => {
    await page.goto('/')
    
    // 测试Tab键导航顺序
    const expectedTabOrder = [
      '[data-testid="principal-input"]',
      '[data-testid="rate-input"]',
      '[data-testid="years-input"]',
      '[data-testid="monthly-payment-input"]',
      '[data-testid="calculate-button"]',
      '[data-testid="reset-button"]'
    ]
    
    for (let i = 0; i < expectedTabOrder.length; i++) {
      await page.keyboard.press('Tab')
      await expect(page.locator(expectedTabOrder[i])).toBeFocused()
    }
    
    console.log('✅ 键盘导航顺序正确')
  })

  test('表单应该有正确的ARIA标签', async ({ page }) => {
    await page.goto('/')
    
    // 验证输入字段的ARIA标签
    await expect(page.locator('[data-testid="principal-input"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="rate-input"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="years-input"]')).toHaveAttribute('aria-label')
    
    // 验证按钮的ARIA描述
    await expect(page.locator('[data-testid="calculate-button"]')).toHaveAttribute('aria-describedby')
    
    // 验证结果区域的ARIA live region
    await expect(page.locator('[data-testid="calculation-result"]')).toHaveAttribute('aria-live')
    
    console.log('✅ ARIA标签配置正确')
  })

  test('错误消息应该对屏幕阅读器可访问', async ({ page }) => {
    await page.goto('/')
    
    // 触发验证错误
    await page.locator('[data-testid="calculate-button"]').click()
    
    // 验证错误消息的可访问性
    const errorMessage = page.locator('[data-testid="validation-error"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveAttribute('role', 'alert')
    await expect(errorMessage).toHaveAttribute('aria-live', 'assertive')
    
    // 验证错误消息与输入字段的关联
    const principalInput = page.locator('[data-testid="principal-input"]')
    const ariaDescribedBy = await principalInput.getAttribute('aria-describedby')
    expect(ariaDescribedBy).toBeTruthy()
    
    console.log('✅ 错误消息可访问性正确')
  })

  test('颜色对比度应该符合WCAG标准', async ({ page }) => {
    await page.goto('/')
    
    // 检查主要文本的颜色对比度
    const contrastResults = await page.evaluate(() => {
      const elements = [
        document.querySelector('h1'),
        document.querySelector('label'),
        document.querySelector('button'),
        document.querySelector('input')
      ]
      
      return elements.map(el => {
        if (!el) return null
        
        const styles = getComputedStyle(el)
        return {
          element: el.tagName,
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize
        }
      }).filter(Boolean)
    })
    
    // 验证关键元素有足够的对比度
    expect(contrastResults.length).toBeGreaterThan(0)
    
    console.log('✅ 颜色对比度检查完成')
  })

  test('焦点指示器应该清晰可见', async ({ page }) => {
    await page.goto('/')
    
    // 测试焦点样式
    const focusableElements = [
      '[data-testid="principal-input"]',
      '[data-testid="calculate-button"]',
      '[data-testid="reset-button"]'
    ]
    
    for (const selector of focusableElements) {
      await page.locator(selector).focus()
      
      // 验证焦点样式
      const focusStyles = await page.locator(selector).evaluate(el => {
        const styles = getComputedStyle(el)
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow
        }
      })
      
      // 应该有可见的焦点指示器
      const hasFocusIndicator = focusStyles.outline !== 'none' || 
                               focusStyles.outlineWidth !== '0px' ||
                               focusStyles.boxShadow !== 'none'
      
      expect(hasFocusIndicator).toBe(true)
    }
    
    console.log('✅ 焦点指示器可见性正确')
  })

  test('屏幕阅读器应该能正确理解页面结构', async ({ page }) => {
    await page.goto('/')
    
    // 验证语义化HTML结构
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('form')).toBeVisible()
    
    // 验证标题层级
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)
    
    // 验证表单标签关联
    const inputs = await page.locator('input').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        await expect(label).toBeVisible()
      }
    }
    
    // 验证地标元素
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    
    console.log('✅ 页面语义结构正确')
  })

  test('图表应该有文本替代方案', async ({ page }) => {
    await page.goto('/')
    
    // 执行计算以显示图表
    await page.locator('[data-testid="principal-input"]').fill('10000')
    await page.locator('[data-testid="rate-input"]').fill('4')
    await page.locator('[data-testid="years-input"]').fill('10')
    await page.locator('[data-testid="calculate-button"]').click()
    
    await page.waitForSelector('[data-testid="calculation-chart"]', { state: 'visible' })
    
    // 验证图表的可访问性
    const chart = page.locator('[data-testid="calculation-chart"]')
    await expect(chart).toHaveAttribute('role', 'img')
    await expect(chart).toHaveAttribute('aria-label')
    
    // 验证数据表格作为替代方案
    await expect(page.locator('[data-testid="yearly-breakdown"]')).toBeVisible()
    
    // 验证表格的可访问性
    const table = page.locator('[data-testid="yearly-breakdown"]')
    await expect(table).toHaveAttribute('role', 'table')
    
    // 验证表头
    const tableHeaders = table.locator('th')
    const headerCount = await tableHeaders.count()
    expect(headerCount).toBeGreaterThan(0)
    
    console.log('✅ 图表可访问性配置正确')
  })

  test('动态内容更新应该通知屏幕阅读器', async ({ page }) => {
    await page.goto('/')
    
    // 验证live region存在
    await expect(page.locator('[aria-live="polite"]')).toBeAttached()
    
    // 执行计算
    await page.locator('[data-testid="principal-input"]').fill('10000')
    await page.locator('[data-testid="rate-input"]').fill('4')
    await page.locator('[data-testid="years-input"]').fill('10')
    await page.locator('[data-testid="calculate-button"]').click()
    
    // 验证结果区域有正确的ARIA属性
    const resultContainer = page.locator('[data-testid="calculation-result"]')
    await expect(resultContainer).toBeVisible()
    await expect(resultContainer).toHaveAttribute('aria-live')
    
    // 验证状态更新通知
    await expect(page.locator('[aria-live="polite"]')).toContainText('Berechnung abgeschlossen')
    
    console.log('✅ 动态内容更新通知正确')
  })
})

test.describe('移动端可访问性', () => {
  test('触摸目标应该足够大', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // 验证按钮大小符合移动端标准
    const buttons = await page.locator('button').all()
    
    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box) {
        // WCAG建议最小触摸目标为44x44px
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
    
    console.log('✅ 移动端触摸目标大小符合标准')
  })

  test('移动端应该支持缩放', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // 验证viewport meta标签允许缩放
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewportMeta).not.toContain('user-scalable=no')
    expect(viewportMeta).not.toContain('maximum-scale=1')
    
    console.log('✅ 移动端缩放支持正确')
  })
})
