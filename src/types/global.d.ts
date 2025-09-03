/**
 * 全局类型声明
 * 解决TypeScript编译错误
 */

import { defineComponent } from 'vue'

// 声明全局变量和函数
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
  
  // 全局函数声明
  const gtag: (...args: any[]) => void
  const useHead: (meta: any) => void
  const defineComponent: typeof import('vue').defineComponent
  const h: typeof import('vue').h
}

// 模块声明
declare module 'web-vitals' {
  export interface Metric {
    name: string
    value: number
    delta: number
    id: string
    entries: PerformanceEntry[]
  }
  
  export function getCLS(callback: (metric: Metric) => void): void
  export function getFID(callback: (metric: Metric) => void): void
  export function getFCP(callback: (metric: Metric) => void): void
  export function getLCP(callback: (metric: Metric) => void): void
  export function getTTFB(callback: (metric: Metric) => void): void
}

declare module 'file-saver' {
  export function saveAs(blob: Blob, filename: string): void
}

declare module '@playwright/test' {
  export function defineConfig(config: any): any
  export const devices: any
}

// 扩展PerformanceNavigationTiming接口
interface PerformanceNavigationTiming {
  navigationStart?: number
}

export {}
