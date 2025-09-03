// 模块类型声明文件

// file-saver模块声明
declare module 'file-saver' {
  export function saveAs(blob: Blob, filename?: string): void
  export function saveAs(url: string, filename?: string): void
}

// web-vitals模块声明
declare module 'web-vitals' {
  export interface Metric {
    name: string
    value: number
    delta: number
    id: string
    entries: PerformanceEntry[]
    navigationType?: string
  }

  export function getCLS(callback: (metric: Metric) => void): void
  export function getFID(callback: (metric: Metric) => void): void
  export function getFCP(callback: (metric: Metric) => void): void
  export function getLCP(callback: (metric: Metric) => void): void
  export function getTTFB(callback: (metric: Metric) => void): void
}

// @playwright/test模块声明
declare module '@playwright/test' {
  export interface PlaywrightTestConfig {
    testDir?: string
    timeout?: number
    fullyParallel?: boolean
    forbidOnly?: boolean
    retries?: number
    workers?: number
    reporter?: string | string[]
    use?: {
      baseURL?: string
      trace?: string
    }
    projects?: Array<{
      name: string
      use: any
    }>
    webServer?: {
      command: string
      port: number
      reuseExistingServer?: boolean
    }
  }

  export function defineConfig(config: PlaywrightTestConfig): PlaywrightTestConfig

  export const devices: {
    [key: string]: any
  }
}
