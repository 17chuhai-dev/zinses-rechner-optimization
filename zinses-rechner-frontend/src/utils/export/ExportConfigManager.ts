/**
 * 导出配置管理器
 * 负责管理用户的导出偏好设置和配置模板
 */

import { ExportConfig, ExportFormat, ExportQuality } from './ChartExportEngine'
import { EXPORT_PRESETS } from './ExportUtils'

// 用户导出偏好接口
export interface UserExportPreferences {
  defaultFormat: ExportFormat
  defaultQuality: ExportQuality
  defaultWidth: number
  defaultHeight: number
  defaultBackgroundColor: string
  defaultTransparent: boolean
  includeWatermark: boolean
  watermarkText: string
  autoDownload: boolean
  showPreview: boolean
  rememberLastSettings: boolean
}

// 导出模板接口
export interface ExportTemplate {
  id: string
  name: string
  description: string
  config: ExportConfig
  category: 'social' | 'print' | 'web' | 'presentation' | 'custom'
  isDefault: boolean
  createdAt: Date
  lastUsed?: Date
  useCount: number
}

// 导出历史记录接口
export interface ExportHistory {
  id: string
  filename: string
  config: ExportConfig
  success: boolean
  fileSize: number
  exportTime: Date
  duration: number
  error?: string
}

/**
 * 导出配置管理器类
 */
export class ExportConfigManager {
  private static instance: ExportConfigManager
  private storageKey = 'chart_export_preferences'
  private templatesKey = 'chart_export_templates'
  private historyKey = 'chart_export_history'
  private maxHistoryItems = 100

  private defaultPreferences: UserExportPreferences = {
    defaultFormat: ExportFormat.PNG,
    defaultQuality: ExportQuality.HIGH,
    defaultWidth: 800,
    defaultHeight: 600,
    defaultBackgroundColor: '#ffffff',
    defaultTransparent: false,
    includeWatermark: false,
    watermarkText: 'Zinses Rechner',
    autoDownload: true,
    showPreview: true,
    rememberLastSettings: true
  }

  private constructor() {
    this.initializeDefaultTemplates()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ExportConfigManager {
    if (!ExportConfigManager.instance) {
      ExportConfigManager.instance = new ExportConfigManager()
    }
    return ExportConfigManager.instance
  }

  /**
   * 获取用户偏好设置
   */
  public getUserPreferences(): UserExportPreferences {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const preferences = JSON.parse(stored)
        return { ...this.defaultPreferences, ...preferences }
      }
    } catch (error) {
      console.warn('无法加载导出偏好设置:', error)
    }
    return { ...this.defaultPreferences }
  }

  /**
   * 保存用户偏好设置
   */
  public saveUserPreferences(preferences: Partial<UserExportPreferences>): void {
    try {
      const current = this.getUserPreferences()
      const updated = { ...current, ...preferences }
      localStorage.setItem(this.storageKey, JSON.stringify(updated))
    } catch (error) {
      console.error('无法保存导出偏好设置:', error)
    }
  }

  /**
   * 根据用户偏好创建导出配置
   */
  public createConfigFromPreferences(overrides: Partial<ExportConfig> = {}): ExportConfig {
    const preferences = this.getUserPreferences()
    
    const config: ExportConfig = {
      format: preferences.defaultFormat,
      quality: preferences.defaultQuality,
      width: preferences.defaultWidth,
      height: preferences.defaultHeight,
      backgroundColor: preferences.defaultBackgroundColor,
      transparent: preferences.defaultTransparent,
      watermark: preferences.includeWatermark ? preferences.watermarkText : undefined,
      includeTitle: true,
      includeData: false,
      ...overrides
    }

    return config
  }

  /**
   * 获取所有导出模板
   */
  public getTemplates(): ExportTemplate[] {
    try {
      const stored = localStorage.getItem(this.templatesKey)
      if (stored) {
        const templates = JSON.parse(stored)
        return templates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          lastUsed: t.lastUsed ? new Date(t.lastUsed) : undefined
        }))
      }
    } catch (error) {
      console.warn('无法加载导出模板:', error)
    }
    return this.getDefaultTemplates()
  }

  /**
   * 保存导出模板
   */
  public saveTemplate(template: Omit<ExportTemplate, 'id' | 'createdAt' | 'useCount'>): string {
    const templates = this.getTemplates()
    const newTemplate: ExportTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      useCount: 0
    }

    templates.push(newTemplate)
    this.saveTemplates(templates)
    
    return newTemplate.id
  }

  /**
   * 更新导出模板
   */
  public updateTemplate(id: string, updates: Partial<ExportTemplate>): boolean {
    const templates = this.getTemplates()
    const index = templates.findIndex(t => t.id === id)
    
    if (index !== -1) {
      templates[index] = { ...templates[index], ...updates }
      this.saveTemplates(templates)
      return true
    }
    
    return false
  }

  /**
   * 删除导出模板
   */
  public deleteTemplate(id: string): boolean {
    const templates = this.getTemplates()
    const filtered = templates.filter(t => t.id !== id)
    
    if (filtered.length !== templates.length) {
      this.saveTemplates(filtered)
      return true
    }
    
    return false
  }

  /**
   * 使用模板（更新使用统计）
   */
  public useTemplate(id: string): ExportConfig | null {
    const templates = this.getTemplates()
    const template = templates.find(t => t.id === id)
    
    if (template) {
      template.useCount++
      template.lastUsed = new Date()
      this.saveTemplates(templates)
      return { ...template.config }
    }
    
    return null
  }

  /**
   * 获取最常用的模板
   */
  public getMostUsedTemplates(limit: number = 5): ExportTemplate[] {
    const templates = this.getTemplates()
    return templates
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, limit)
  }

  /**
   * 获取最近使用的模板
   */
  public getRecentlyUsedTemplates(limit: number = 5): ExportTemplate[] {
    const templates = this.getTemplates()
    return templates
      .filter(t => t.lastUsed)
      .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
      .slice(0, limit)
  }

  /**
   * 添加导出历史记录
   */
  public addToHistory(record: Omit<ExportHistory, 'id'>): void {
    try {
      const history = this.getHistory()
      const newRecord: ExportHistory = {
        ...record,
        id: this.generateId()
      }

      history.unshift(newRecord)
      
      // 限制历史记录数量
      if (history.length > this.maxHistoryItems) {
        history.splice(this.maxHistoryItems)
      }

      localStorage.setItem(this.historyKey, JSON.stringify(history))
    } catch (error) {
      console.error('无法保存导出历史:', error)
    }
  }

  /**
   * 获取导出历史记录
   */
  public getHistory(): ExportHistory[] {
    try {
      const stored = localStorage.getItem(this.historyKey)
      if (stored) {
        const history = JSON.parse(stored)
        return history.map((h: any) => ({
          ...h,
          exportTime: new Date(h.exportTime)
        }))
      }
    } catch (error) {
      console.warn('无法加载导出历史:', error)
    }
    return []
  }

  /**
   * 清除导出历史记录
   */
  public clearHistory(): void {
    try {
      localStorage.removeItem(this.historyKey)
    } catch (error) {
      console.error('无法清除导出历史:', error)
    }
  }

  /**
   * 获取导出统计信息
   */
  public getExportStats(): {
    totalExports: number
    successfulExports: number
    failedExports: number
    mostUsedFormat: ExportFormat
    averageFileSize: number
    totalDataExported: number
  } {
    const history = this.getHistory()
    
    const totalExports = history.length
    const successfulExports = history.filter(h => h.success).length
    const failedExports = totalExports - successfulExports
    
    // 统计最常用格式
    const formatCounts = history.reduce((acc, h) => {
      acc[h.config.format] = (acc[h.config.format] || 0) + 1
      return acc
    }, {} as Record<ExportFormat, number>)
    
    const mostUsedFormat = Object.entries(formatCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as ExportFormat || ExportFormat.PNG
    
    // 计算平均文件大小
    const successfulHistory = history.filter(h => h.success)
    const averageFileSize = successfulHistory.length > 0
      ? successfulHistory.reduce((sum, h) => sum + h.fileSize, 0) / successfulHistory.length
      : 0
    
    // 计算总导出数据量
    const totalDataExported = successfulHistory.reduce((sum, h) => sum + h.fileSize, 0)

    return {
      totalExports,
      successfulExports,
      failedExports,
      mostUsedFormat,
      averageFileSize,
      totalDataExported
    }
  }

  /**
   * 导出配置和模板
   */
  public exportSettings(): string {
    const preferences = this.getUserPreferences()
    const templates = this.getTemplates().filter(t => t.category === 'custom')
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      preferences,
      templates
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 导入配置和模板
   */
  public importSettings(data: string): { success: boolean; message: string } {
    try {
      const importData = JSON.parse(data)
      
      if (!importData.version || !importData.preferences) {
        return { success: false, message: '无效的导入数据格式' }
      }

      // 导入偏好设置
      this.saveUserPreferences(importData.preferences)
      
      // 导入自定义模板
      if (importData.templates && Array.isArray(importData.templates)) {
        const currentTemplates = this.getTemplates()
        const customTemplates = currentTemplates.filter(t => t.category !== 'custom')
        
        const importedTemplates = importData.templates.map((t: any) => ({
          ...t,
          id: this.generateId(),
          createdAt: new Date(),
          useCount: 0
        }))

        this.saveTemplates([...customTemplates, ...importedTemplates])
      }

      return { success: true, message: '设置导入成功' }
    } catch (error) {
      return { success: false, message: '导入失败：数据格式错误' }
    }
  }

  /**
   * 重置所有设置
   */
  public resetAllSettings(): void {
    try {
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.templatesKey)
      localStorage.removeItem(this.historyKey)
      this.initializeDefaultTemplates()
    } catch (error) {
      console.error('无法重置设置:', error)
    }
  }

  /**
   * 初始化默认模板
   */
  private initializeDefaultTemplates(): void {
    const existingTemplates = this.getTemplates()
    if (existingTemplates.length === 0) {
      const defaultTemplates = this.getDefaultTemplates()
      this.saveTemplates(defaultTemplates)
    }
  }

  /**
   * 获取默认模板
   */
  private getDefaultTemplates(): ExportTemplate[] {
    return [
      {
        id: 'social-media',
        name: '社交媒体',
        description: '适合社交媒体分享的格式',
        config: EXPORT_PRESETS.SOCIAL_MEDIA as ExportConfig,
        category: 'social',
        isDefault: true,
        createdAt: new Date(),
        useCount: 0
      },
      {
        id: 'print',
        name: '打印',
        description: '高质量打印格式',
        config: EXPORT_PRESETS.PRINT as ExportConfig,
        category: 'print',
        isDefault: true,
        createdAt: new Date(),
        useCount: 0
      },
      {
        id: 'web-display',
        name: '网页展示',
        description: '适合网页展示的格式',
        config: EXPORT_PRESETS.WEB_DISPLAY as ExportConfig,
        category: 'web',
        isDefault: true,
        createdAt: new Date(),
        useCount: 0
      },
      {
        id: 'presentation',
        name: '演示文稿',
        description: '适合演示文稿的高分辨率格式',
        config: EXPORT_PRESETS.PRESENTATION as ExportConfig,
        category: 'presentation',
        isDefault: true,
        createdAt: new Date(),
        useCount: 0
      }
    ]
  }

  /**
   * 保存模板到本地存储
   */
  private saveTemplates(templates: ExportTemplate[]): void {
    try {
      localStorage.setItem(this.templatesKey, JSON.stringify(templates))
    } catch (error) {
      console.error('无法保存导出模板:', error)
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }
}

// 导出单例实例
export const exportConfigManager = ExportConfigManager.getInstance()
