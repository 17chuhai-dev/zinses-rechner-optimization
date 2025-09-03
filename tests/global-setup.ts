import { chromium, FullConfig } from '@playwright/test'

/**
 * Zinses-Rechner 全局测试设置
 * 在所有测试运行前执行的初始化任务
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 开始 Zinses-Rechner 生产环境测试全局设置...')
  
  const startTime = Date.now()
  
  try {
    // 1. 验证生产环境可访问性
    await verifyProductionAvailability()
    
    // 2. 预热缓存系统
    await warmupCacheSystem()
    
    // 3. 验证API健康状态
    await verifyApiHealth()
    
    // 4. 设置测试环境变量
    setupTestEnvironment()
    
    // 5. 创建测试报告目录
    createReportDirectories()
    
    const setupTime = Date.now() - startTime
    console.log(`✅ 全局设置完成，耗时: ${setupTime}ms`)
    
  } catch (error) {
    console.error('❌ 全局设置失败:', error)
    throw error
  }
}

/**
 * 验证生产环境可访问性
 */
async function verifyProductionAvailability() {
  console.log('🔍 验证生产环境可访问性...')
  
  const frontendUrl = 'https://zinses-rechner.de'
  const apiUrl = 'https://api.zinses-rechner.de'
  
  // 检查前端服务
  try {
    const frontendResponse = await fetch(frontendUrl)
    if (!frontendResponse.ok) {
      throw new Error(`前端服务不可用: HTTP ${frontendResponse.status}`)
    }
    console.log('✅ 前端服务可访问')
  } catch (error) {
    throw new Error(`前端服务连接失败: ${error}`)
  }
  
  // 检查API服务
  try {
    const apiResponse = await fetch(`${apiUrl}/health`)
    if (!apiResponse.ok) {
      throw new Error(`API服务不可用: HTTP ${apiResponse.status}`)
    }
    
    const healthData = await apiResponse.json()
    if (healthData.status !== 'healthy') {
      throw new Error(`API服务状态异常: ${healthData.status}`)
    }
    console.log('✅ API服务健康')
  } catch (error) {
    throw new Error(`API服务检查失败: ${error}`)
  }
}

/**
 * 预热缓存系统
 */
async function warmupCacheSystem() {
  console.log('🔥 预热缓存系统...')
  
  const apiUrl = 'https://api.zinses-rechner.de'
  
  // 常用计算场景预热
  const warmupCalculations = [
    { principal: 10000, annual_rate: 4, years: 10 },
    { principal: 25000, annual_rate: 5, years: 15 },
    { principal: 50000, annual_rate: 6, years: 20 },
    { principal: 100000, annual_rate: 4.5, years: 25 },
    { principal: 5000, annual_rate: 3.5, years: 8, monthly_payment: 200 }
  ]
  
  const warmupPromises = warmupCalculations.map(async (calc, index) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/calculate/compound-interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calc)
      })
      
      if (response.ok) {
        console.log(`✅ 预热计算 ${index + 1} 完成`)
      } else {
        console.warn(`⚠️ 预热计算 ${index + 1} 失败: HTTP ${response.status}`)
      }
    } catch (error) {
      console.warn(`⚠️ 预热计算 ${index + 1} 错误:`, error)
    }
    
    // 避免过快请求
    await new Promise(resolve => setTimeout(resolve, 200))
  })
  
  await Promise.all(warmupPromises)
  console.log('✅ 缓存预热完成')
}

/**
 * 验证API健康状态
 */
async function verifyApiHealth() {
  console.log('🏥 验证API详细健康状态...')
  
  const apiUrl = 'https://api.zinses-rechner.de'
  
  // 测试基础计算功能
  try {
    const testCalculation = {
      principal: 1000,
      annual_rate: 5,
      years: 5
    }
    
    const response = await fetch(`${apiUrl}/api/v1/calculate/compound-interest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCalculation)
    })
    
    if (!response.ok) {
      throw new Error(`API计算功能异常: HTTP ${response.status}`)
    }
    
    const result = await response.json()
    
    // 验证计算结果合理性 (1000€, 5%, 5年 ≈ 1276.28€)
    const expectedResult = 1276.28
    const actualResult = result.final_amount
    const difference = Math.abs(actualResult - expectedResult)
    
    if (difference > 1) {
      throw new Error(`API计算结果不准确: 期望 ${expectedResult}, 实际 ${actualResult}`)
    }
    
    console.log('✅ API计算功能正常')
    
  } catch (error) {
    throw new Error(`API功能验证失败: ${error}`)
  }
  
  // 测试输入验证
  try {
    const invalidCalculation = {
      principal: -1000,
      annual_rate: 4,
      years: 10
    }
    
    const response = await fetch(`${apiUrl}/api/v1/calculate/compound-interest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidCalculation)
    })
    
    if (response.status !== 422) {
      throw new Error(`API输入验证异常: 期望 HTTP 422, 实际 HTTP ${response.status}`)
    }
    
    console.log('✅ API输入验证正常')
    
  } catch (error) {
    throw new Error(`API输入验证失败: ${error}`)
  }
}

/**
 * 设置测试环境变量
 */
function setupTestEnvironment() {
  console.log('⚙️ 设置测试环境变量...')
  
  // 设置测试相关的环境变量
  process.env.TEST_ENVIRONMENT = 'production'
  process.env.TEST_START_TIME = Date.now().toString()
  process.env.FRONTEND_URL = 'https://zinses-rechner.de'
  process.env.API_URL = 'https://api.zinses-rechner.de'
  
  // 设置德语本地化
  process.env.LANG = 'de_DE.UTF-8'
  process.env.LC_ALL = 'de_DE.UTF-8'
  
  console.log('✅ 测试环境变量设置完成')
}

/**
 * 创建测试报告目录
 */
function createReportDirectories() {
  console.log('📁 创建测试报告目录...')
  
  const fs = require('fs')
  const path = require('path')
  
  const directories = [
    'reports',
    'reports/playwright-html',
    'reports/screenshots',
    'reports/videos',
    'reports/traces',
    'logs'
  ]
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✅ 创建目录: ${dir}`)
    }
  })
  
  // 创建测试会话信息文件
  const sessionInfo = {
    startTime: new Date().toISOString(),
    environment: 'production',
    testSuite: 'production-verification',
    version: process.env.APP_VERSION || 'unknown'
  }
  
  fs.writeFileSync(
    path.join('reports', 'test-session.json'),
    JSON.stringify(sessionInfo, null, 2)
  )
  
  console.log('✅ 测试报告目录创建完成')
}

/**
 * 验证测试依赖和工具
 */
async function verifyTestDependencies() {
  console.log('🔧 验证测试依赖...')
  
  // 检查网络连接
  try {
    await fetch('https://www.google.com', { method: 'HEAD' })
    console.log('✅ 网络连接正常')
  } catch (error) {
    throw new Error('网络连接失败，无法执行生产环境测试')
  }
  
  // 检查必要的Node.js模块
  const requiredModules = ['@playwright/test']
  
  for (const module of requiredModules) {
    try {
      require.resolve(module)
      console.log(`✅ 模块可用: ${module}`)
    } catch (error) {
      throw new Error(`缺少必要模块: ${module}`)
    }
  }
}

/**
 * 生产环境预检查
 */
async function productionPreCheck() {
  console.log('🔍 执行生产环境预检查...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // 检查页面基础加载
    await page.goto('https://zinses-rechner.de', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })
    
    // 检查关键元素存在
    const hasCalculatorForm = await page.locator('[data-testid="calculator-form"]').isVisible()
    if (!hasCalculatorForm) {
      throw new Error('计算器表单未找到')
    }
    
    // 检查JavaScript功能
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined'
    })
    
    if (!jsWorking) {
      throw new Error('JavaScript功能异常')
    }
    
    console.log('✅ 生产环境预检查通过')
    
  } catch (error) {
    throw new Error(`生产环境预检查失败: ${error}`)
  } finally {
    await browser.close()
  }
}

/**
 * 记录测试开始信息
 */
function logTestStart() {
  const testInfo = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    userAgent: 'Playwright Test Runner',
    testConfig: {
      retries: 2,
      workers: 2,
      timeout: 30000
    }
  }
  
  console.log('📋 测试会话信息:')
  console.log(JSON.stringify(testInfo, null, 2))
  
  // 保存到文件
  const fs = require('fs')
  fs.writeFileSync('logs/test-session-start.json', JSON.stringify(testInfo, null, 2))
}

// 主设置函数
export default async function globalSetup(config: FullConfig) {
  console.log('🎯 Zinses-Rechner 生产环境测试 - 全局设置开始')
  
  try {
    // 记录测试开始
    logTestStart()
    
    // 验证测试依赖
    await verifyTestDependencies()
    
    // 验证生产环境可访问性
    await verifyProductionAvailability()
    
    // 执行生产环境预检查
    await productionPreCheck()
    
    // 预热缓存系统
    await warmupCacheSystem()
    
    // 验证API健康状态
    await verifyApiHealth()
    
    // 设置测试环境
    setupTestEnvironment()
    
    // 创建报告目录
    createReportDirectories()
    
    console.log('🎉 全局设置成功完成')
    
    // 等待系统稳定
    console.log('⏳ 等待系统稳定...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
  } catch (error) {
    console.error('💥 全局设置失败:', error)
    
    // 记录失败信息
    const fs = require('fs')
    const failureInfo = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }
    
    fs.writeFileSync('logs/global-setup-failure.json', JSON.stringify(failureInfo, null, 2))
    
    throw error
  }
}

/**
 * 测试环境清理函数 (可选)
 */
export async function globalTeardown() {
  console.log('🧹 开始全局清理...')
  
  try {
    // 记录测试结束信息
    const endInfo = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - parseInt(process.env.TEST_START_TIME || '0'),
      environment: 'production'
    }
    
    const fs = require('fs')
    fs.writeFileSync('logs/test-session-end.json', JSON.stringify(endInfo, null, 2))
    
    console.log('✅ 全局清理完成')
    
  } catch (error) {
    console.error('⚠️ 全局清理出现问题:', error)
    // 不抛出错误，避免影响测试结果
  }
}
