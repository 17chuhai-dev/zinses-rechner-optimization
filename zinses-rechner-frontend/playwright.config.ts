/**
 * Playwright端到端测试配置
 * 优化的跨浏览器和设备测试配置
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',

  // 全局设置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 报告配置
  reporter: [
    ['html', { outputFolder: 'reports/playwright' }],
    ['json', { outputFile: 'reports/playwright/results.json' }],
    ['junit', { outputFile: 'reports/playwright/results.xml' }],
    ['line']
  ],

  // 全局测试配置
  use: {
    // 基础URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // 追踪配置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 超时设置
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // 忽略HTTPS错误（开发环境）
    ignoreHTTPSErrors: true,

    // 用户代理
    userAgent: 'Zinses-Rechner E2E Tests',

    // 额外HTTP头
    extraHTTPHeaders: {
      'Accept-Language': 'de-DE,de;q=0.9'
    }
  },

  // 项目配置 - 不同浏览器和设备
  projects: [
    // 桌面浏览器
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // 移动设备
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },

    // 特殊测试场景
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--simulate-slow-network']
        }
      }
    },
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2
      }
    }
  ],

  // 开发服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8000'
    }
  },

  // 测试超时
  timeout: 30000,
  expect: {
    timeout: 10000
  },

  // 测试输出目录
  outputDir: 'test-results/',

  // 全局设置和清理
  // globalSetup: './tests/e2e/global-setup.ts',
  // globalTeardown: './tests/e2e/global-teardown.ts',

  // 测试匹配模式
  testMatch: [
    '**/tests/e2e/**/*.spec.ts',
    '**/tests/e2e/**/*.test.ts'
  ],

  // 忽略的文件
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**'
  ]
})
