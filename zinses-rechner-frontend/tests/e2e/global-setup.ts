/**
 * Playwright全局测试设置
 * 初始化测试环境和数据
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 初始化E2E测试环境...')

  // 启动浏览器进行预热
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 1. 验证测试环境可用性
    console.log('🔍 验证测试环境...')
    
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
    
    // 等待开发服务器启动
    let retries = 30
    while (retries > 0) {
      try {
        const response = await page.goto(baseURL, { 
          waitUntil: 'networkidle',
          timeout: 5000 
        })
        
        if (response?.ok()) {
          console.log('✅ 开发服务器已就绪')
          break
        }
      } catch (error) {
        console.log(`⏳ 等待开发服务器启动... (剩余重试: ${retries})`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        retries--
      }
    }

    if (retries === 0) {
      throw new Error('开发服务器启动超时')
    }

    // 2. 验证API服务可用性
    console.log('🔍 验证API服务...')
    
    const apiBaseURL = process.env.VITE_API_BASE_URL || 'http://localhost:8000'
    
    try {
      const apiResponse = await fetch(`${apiBaseURL}/health`)
      if (apiResponse.ok) {
        console.log('✅ API服务已就绪')
      } else {
        console.warn('⚠️ API服务响应异常，某些测试可能失败')
      }
    } catch (error) {
      console.warn('⚠️ API服务不可用，将使用模拟数据')
    }

    // 3. 清理测试数据
    console.log('🧹 清理测试数据...')
    
    await page.evaluate(() => {
      // 清理localStorage
      localStorage.clear()
      
      // 清理sessionStorage
      sessionStorage.clear()
      
      // 清理cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
    })

    // 4. 设置测试用户偏好
    console.log('⚙️ 设置测试环境偏好...')
    
    await page.evaluate(() => {
      // 设置测试标识
      localStorage.setItem('e2e-test-mode', 'true')
      
      // 禁用动画（加速测试）
      localStorage.setItem('disable-animations', 'true')
      
      // 设置德语环境
      localStorage.setItem('preferred-language', 'de')
      
      // 跳过首次访问引导
      localStorage.setItem('tutorial-completed', 'true')
      
      // 设置测试用户标识
      localStorage.setItem('test-session-id', `e2e-test-${Date.now()}`)
    })

    // 5. 预加载关键资源
    console.log('📦 预加载关键资源...')
    
    // 访问主页确保资源加载
    await page.goto(baseURL)
    await page.waitForLoadState('networkidle')
    
    // 预加载字体和样式
    await page.addStyleTag({
      content: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `
    })

    // 6. 验证关键组件可用性
    console.log('🔍 验证关键组件...')
    
    // 检查计算器表单是否存在
    const calculatorForm = await page.locator('[data-testid="calculator-form"]')
    if (await calculatorForm.count() > 0) {
      console.log('✅ 计算器表单组件已加载')
    } else {
      console.warn('⚠️ 计算器表单组件未找到')
    }

    // 检查导航组件
    const navigation = await page.locator('nav')
    if (await navigation.count() > 0) {
      console.log('✅ 导航组件已加载')
    }

    // 7. 设置测试数据
    console.log('📊 准备测试数据...')
    
    const testData = {
      calculations: [
        {
          name: '基础复利测试',
          principal: 10000,
          rate: 4.0,
          years: 10,
          monthlyPayment: 0,
          expectedResult: 14802.44
        },
        {
          name: '月供复利测试',
          principal: 5000,
          rate: 3.5,
          years: 15,
          monthlyPayment: 300,
          expectedResult: 75000 // 大概值
        },
        {
          name: '高利率测试',
          principal: 25000,
          rate: 8.0,
          years: 20,
          monthlyPayment: 500,
          expectedResult: 500000 // 大概值
        }
      ],
      users: [
        {
          type: 'first-time',
          behavior: 'cautious',
          preferences: { tutorial: true, explanations: true }
        },
        {
          type: 'experienced',
          behavior: 'efficient',
          preferences: { tutorial: false, advanced: true }
        }
      ]
    }

    // 将测试数据存储到全局状态
    await page.evaluate((data) => {
      (window as any).e2eTestData = data
    }, testData)

    console.log('✅ E2E测试环境初始化完成')

  } catch (error) {
    console.error('❌ E2E测试环境初始化失败:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

export default globalSetup
