import { defineConfig, devices } from '@playwright/test'

/**
 * Zinses-Rechner 生产环境测试配置
 * 用于验证生产环境的功能和性能
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* 生产环境测试配置 */
  fullyParallel: false, // 生产环境测试串行执行，避免过载
  forbidOnly: true, // 禁止 test.only，确保所有测试都运行
  retries: 2, // 生产环境网络可能不稳定，允许重试
  workers: 2, // 限制并发数，避免对生产环境造成压力
  
  /* 报告配置 */
  reporter: [
    ['html', { outputFolder: 'reports/playwright-html' }],
    ['json', { outputFile: 'reports/playwright-results.json' }],
    ['junit', { outputFile: 'reports/playwright-junit.xml' }],
    ['list'] // 控制台输出
  ],
  
  /* 全局测试配置 */
  use: {
    /* 生产环境基础URL */
    baseURL: 'https://zinses-rechner.de',
    
    /* 测试追踪 */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* 网络配置 */
    ignoreHTTPSErrors: false, // 生产环境必须有效SSL
    
    /* 超时配置 */
    actionTimeout: 10000, // 10秒操作超时
    navigationTimeout: 30000, // 30秒导航超时
    
    /* 德语本地化 */
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    
    /* 额外HTTP头 */
    extraHTTPHeaders: {
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
    }
  },

  /* 测试项目配置 */
  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: /production\.spec\.ts/
    },
    
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: /production\.spec\.ts/
    },
    
    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: /production\.spec\.ts/
    },
    
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5']
      },
      testMatch: /production\.spec\.ts/
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12']
      },
      testMatch: /production\.spec\.ts/
    },
    
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro']
      },
      testMatch: /production\.spec\.ts/
    },

    /* 性能测试专用配置 */
    {
      name: 'Performance Tests',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // 性能测试专用设置
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--enable-precise-memory-info'
          ]
        }
      },
      testMatch: /performance\.spec\.ts/
    },

    /* 安全测试专用配置 */
    {
      name: 'Security Tests',
      use: {
        ...devices['Desktop Chrome'],
        // 安全测试可能需要特殊配置
        ignoreHTTPSErrors: false,
        extraHTTPHeaders: {
          'X-Test-Security': 'true'
        }
      },
      testMatch: /security\.spec\.ts/
    }
  ],

  /* 测试环境设置 */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  /* Web服务器配置 (如果需要本地服务) */
  webServer: undefined, // 生产环境测试不需要本地服务器

  /* 期望配置 */
  expect: {
    // 生产环境可能响应较慢
    timeout: 10000,
    
    // 截图比较配置
    toHaveScreenshot: {
      mode: 'strict',
      threshold: 0.2
    },
    
    // 可访问性配置
    toPassAxeTest: {
      disableRules: ['color-contrast'] // 如果设计有特殊要求
    }
  },

  /* 测试数据和环境变量 */
  metadata: {
    environment: 'production',
    version: process.env.APP_VERSION || 'unknown',
    testSuite: 'production-verification'
  }
})

/* 生产环境测试专用配置 */
export const productionTestConfig = {
  // API端点
  apiBaseUrl: 'https://api.zinses-rechner.de',
  frontendUrl: 'https://zinses-rechner.de',
  
  // 性能目标
  performanceTargets: {
    apiResponseTime: 500, // ms
    pageLoadTime: 2000, // ms
    largestContentfulPaint: 2500, // ms
    firstInputDelay: 100, // ms
    cumulativeLayoutShift: 0.1
  },
  
  // 测试数据
  testCalculations: [
    {
      name: '基础计算',
      principal: 10000,
      annual_rate: 4,
      years: 10,
      expected_range: [14500, 15000]
    },
    {
      name: '复杂计算',
      principal: 50000,
      annual_rate: 6.5,
      years: 25,
      monthly_payment: 800,
      expected_range: [450000, 550000]
    },
    {
      name: '长期投资',
      principal: 25000,
      annual_rate: 7,
      years: 40,
      monthly_payment: 500,
      expected_range: [1200000, 1500000]
    }
  ],
  
  // 边界值测试
  boundaryTests: [
    {
      name: '最小值',
      principal: 1,
      annual_rate: 0,
      years: 1,
      should_succeed: true
    },
    {
      name: '最大值',
      principal: 10000000,
      annual_rate: 20,
      years: 50,
      should_succeed: true
    },
    {
      name: '无效负值',
      principal: -1000,
      annual_rate: 4,
      years: 10,
      should_succeed: false
    }
  ],
  
  // 德语本地化验证
  germanLocalization: {
    requiredTexts: [
      'Startkapital',
      'Zinssatz',
      'Laufzeit',
      'Jahre',
      'Endkapital',
      'Zinserträge',
      'berechnen'
    ],
    currencyFormat: /€\s*[\d.,]+/,
    percentageFormat: /\d+[,.]?\d*\s*%/
  },
  
  // 安全验证
  securityChecks: {
    requiredHeaders: [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Strict-Transport-Security'
    ],
    forbiddenHeaders: [
      'Server',
      'X-Powered-By'
    ]
  }
}
