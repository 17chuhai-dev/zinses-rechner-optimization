/**
 * 全局类型声明文件
 * 定义全局可用的类型和接口
 */

// Google Analytics gtag 全局函数声明
declare global {
  function gtag(...args: any[]): void
  
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

// 表单验证类型
export interface FormValidation {
  type: 'required' | 'min' | 'max' | 'range' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

// 说明配置类型
export interface ExplanationConfig {
  title: string
  content: string
  type: 'info' | 'warning' | 'tip'
  icon?: string
}

// 导出格式类型
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json'

// 确保这个文件被视为模块
export {}
