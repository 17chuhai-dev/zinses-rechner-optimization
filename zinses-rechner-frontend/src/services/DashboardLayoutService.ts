/**
 * 仪表盘配置和布局系统
 * 创建可定制的仪表盘配置系统，支持拖拽布局、组件配置、个人化设置和团队共享
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { DashboardPermissionController } from './DashboardPermissionController'
import { VisualizationComponentLibrary } from './VisualizationComponentLibrary'
import type { ComponentConfig, VisualizationComponentType } from './VisualizationComponentLibrary'
import type { DashboardConfig, DashboardWidget, DashboardLayout } from './EnterpriseDashboardService'

// 布局网格系统
export interface GridLayout {
  type: 'grid'
  columns: number
  rows: number
  cellWidth: number
  cellHeight: number
  gap: { x: number; y: number }
  responsive: ResponsiveConfig[]
}

export interface ResponsiveConfig {
  breakpoint: number // 像素
  columns: number
  cellWidth: number
  cellHeight: number
}

// 自由布局系统
export interface FreeLayout {
  type: 'free'
  width: number
  height: number
  units: 'px' | '%' | 'vw' | 'vh'
  snap: {
    enabled: boolean
    gridSize: number
  }
}

// 组件位置和大小
export interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
  zIndex?: number
  
  // 约束
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  
  // 响应式位置
  responsive?: {
    [breakpoint: string]: Partial<WidgetPosition>
  }
}

// 布局模板
export interface LayoutTemplate {
  id: string
  name: string
  description: string
  category: 'executive' | 'operational' | 'analytical' | 'custom'
  
  // 模板配置
  layout: DashboardLayout
  widgets: LayoutTemplateWidget[]
  
  // 预览
  thumbnail?: string
  tags: string[]
  
  // 使用统计
  usageCount: number
  rating: number
  
  // 元数据
  createdBy: string
  createdAt: Date
  isPublic: boolean
}

export interface LayoutTemplateWidget {
  type: VisualizationComponentType
  position: WidgetPosition
  config: Partial<ComponentConfig>
  required: boolean
  customizable: boolean
}

// 个人化设置
export interface PersonalizationSettings {
  userId: string
  accountId: string
  
  // 主题设置
  theme: 'light' | 'dark' | 'auto'
  colorScheme: string
  
  // 布局偏好
  defaultLayout: 'grid' | 'free'
  gridSize: number
  snapToGrid: boolean
  
  // 组件偏好
  favoriteComponents: VisualizationComponentType[]
  defaultRefreshInterval: number
  
  // 显示偏好
  showGridLines: boolean
  showComponentBorders: boolean
  compactMode: boolean
  
  // 交互偏好
  enableAnimations: boolean
  enableTooltips: boolean
  enableKeyboardShortcuts: boolean
  
  // 保存的仪表盘
  savedDashboards: string[]
  defaultDashboard?: string
  
  // 最近使用
  recentComponents: string[]
  recentTemplates: string[]
}

// 共享设置
export interface SharingSettings {
  dashboardId: string
  isShared: boolean
  shareType: 'view_only' | 'interactive' | 'editable'
  
  // 共享范围
  sharedWith: ShareTarget[]
  
  // 访问控制
  requireLogin: boolean
  allowExport: boolean
  allowComments: boolean
  
  // 有效期
  expiresAt?: Date
  
  // 共享链接
  shareUrl?: string
  embedCode?: string
  
  // 统计
  viewCount: number
  lastViewed?: Date
}

export interface ShareTarget {
  type: 'user' | 'team' | 'role' | 'public'
  id: string
  name: string
  permissions: ('view' | 'interact' | 'comment' | 'edit')[]
}

// 布局操作
export interface LayoutOperation {
  type: 'add_widget' | 'remove_widget' | 'move_widget' | 'resize_widget' | 'update_config'
  widgetId: string
  data: any
  timestamp: Date
  userId: string
}

// 布局历史
export interface LayoutHistory {
  dashboardId: string
  operations: LayoutOperation[]
  snapshots: LayoutSnapshot[]
  maxOperations: number
  maxSnapshots: number
}

export interface LayoutSnapshot {
  id: string
  timestamp: Date
  layout: DashboardLayout
  widgets: DashboardWidget[]
  description?: string
  userId: string
}

/**
 * 仪表盘配置和布局系统服务
 */
export class DashboardLayoutService {
  private static instance: DashboardLayoutService
  private permissionController: DashboardPermissionController
  private componentLibrary: VisualizationComponentLibrary
  
  private layoutTemplates: Map<string, LayoutTemplate> = new Map()
  private personalizationSettings: Map<string, PersonalizationSettings> = new Map()
  private sharingSettings: Map<string, SharingSettings> = new Map()
  private layoutHistory: Map<string, LayoutHistory> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.permissionController = DashboardPermissionController.getInstance()
    this.componentLibrary = VisualizationComponentLibrary.getInstance()
  }

  static getInstance(): DashboardLayoutService {
    if (!DashboardLayoutService.instance) {
      DashboardLayoutService.instance = new DashboardLayoutService()
    }
    return DashboardLayoutService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.permissionController.initialize()
      await this.componentLibrary.initialize()
      await this.loadLayoutTemplates()
      await this.loadPersonalizationSettings()
      this.isInitialized = true
      console.log('✅ DashboardLayoutService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize DashboardLayoutService:', error)
      throw error
    }
  }

  /**
   * 创建仪表盘布局
   */
  async createDashboardLayout(
    userId: string,
    accountId: string,
    config: {
      name: string
      description?: string
      layoutType: 'grid' | 'free'
      templateId?: string
      widgets?: Partial<DashboardWidget>[]
    }
  ): Promise<DashboardConfig> {
    if (!this.isInitialized) await this.initialize()

    // 检查权限
    const hasPermission = await this.permissionController.checkDataAccess(
      userId,
      accountId,
      'analytics',
      'view'
    )

    if (!hasPermission.granted) {
      throw new Error('Insufficient permissions to create dashboard layout')
    }

    let layout: DashboardLayout
    let widgets: DashboardWidget[] = []

    if (config.templateId) {
      // 从模板创建
      const template = this.layoutTemplates.get(config.templateId)
      if (!template) {
        throw new Error('Layout template not found')
      }
      
      layout = template.layout
      widgets = await this.createWidgetsFromTemplate(template, userId, accountId)
    } else {
      // 创建空布局
      layout = this.createEmptyLayout(config.layoutType)
      
      if (config.widgets) {
        widgets = await this.createWidgetsFromConfig(config.widgets, userId, accountId)
      }
    }

    const dashboardConfig: DashboardConfig = {
      id: crypto.randomUUID(),
      name: config.name,
      description: config.description,
      accountId,
      createdBy: userId,
      layout,
      widgets,
      permissions: [
        {
          userId,
          permissions: ['view', 'edit', 'share', 'delete']
        }
      ],
      refreshInterval: 300, // 5分钟
      autoRefresh: true,
      isShared: false,
      sharedWith: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0
    }

    // 保存配置
    await this.saveDashboardConfig(dashboardConfig)
    
    // 初始化布局历史
    this.initializeLayoutHistory(dashboardConfig.id)

    console.log(`📊 Dashboard layout created: ${config.name}`)
    return dashboardConfig
  }

  /**
   * 更新仪表盘布局
   */
  async updateDashboardLayout(
    dashboardId: string,
    userId: string,
    updates: {
      layout?: Partial<DashboardLayout>
      widgets?: DashboardWidget[]
      addWidgets?: Partial<DashboardWidget>[]
      removeWidgets?: string[]
      moveWidget?: { widgetId: string; position: WidgetPosition }
      resizeWidget?: { widgetId: string; size: { width: number; height: number } }
    }
  ): Promise<DashboardConfig> {
    if (!this.isInitialized) await this.initialize()

    const dashboard = await this.getDashboardConfig(dashboardId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    // 检查编辑权限
    const canEdit = await this.checkDashboardPermission(dashboard, userId, 'edit')
    if (!canEdit) {
      throw new Error('Insufficient permissions to edit dashboard')
    }

    // 记录操作历史
    const operations: LayoutOperation[] = []

    // 更新布局
    if (updates.layout) {
      dashboard.layout = { ...dashboard.layout, ...updates.layout }
    }

    // 更新组件
    if (updates.widgets) {
      dashboard.widgets = updates.widgets
      operations.push({
        type: 'update_config',
        widgetId: 'all',
        data: updates.widgets,
        timestamp: new Date(),
        userId
      })
    }

    // 添加组件
    if (updates.addWidgets) {
      const newWidgets = await this.createWidgetsFromConfig(updates.addWidgets, userId, dashboard.accountId)
      dashboard.widgets.push(...newWidgets)
      
      for (const widget of newWidgets) {
        operations.push({
          type: 'add_widget',
          widgetId: widget.id,
          data: widget,
          timestamp: new Date(),
          userId
        })
      }
    }

    // 移除组件
    if (updates.removeWidgets) {
      for (const widgetId of updates.removeWidgets) {
        const index = dashboard.widgets.findIndex(w => w.id === widgetId)
        if (index > -1) {
          dashboard.widgets.splice(index, 1)
          operations.push({
            type: 'remove_widget',
            widgetId,
            data: null,
            timestamp: new Date(),
            userId
          })
        }
      }
    }

    // 移动组件
    if (updates.moveWidget) {
      const widget = dashboard.widgets.find(w => w.id === updates.moveWidget!.widgetId)
      if (widget) {
        widget.position = updates.moveWidget.position
        operations.push({
          type: 'move_widget',
          widgetId: widget.id,
          data: updates.moveWidget.position,
          timestamp: new Date(),
          userId
        })
      }
    }

    // 调整组件大小
    if (updates.resizeWidget) {
      const widget = dashboard.widgets.find(w => w.id === updates.resizeWidget!.widgetId)
      if (widget) {
        widget.position.width = updates.resizeWidget.size.width
        widget.position.height = updates.resizeWidget.size.height
        operations.push({
          type: 'resize_widget',
          widgetId: widget.id,
          data: updates.resizeWidget.size,
          timestamp: new Date(),
          userId
        })
      }
    }

    dashboard.updatedAt = new Date()

    // 保存更新
    await this.saveDashboardConfig(dashboard)
    
    // 记录历史
    this.addLayoutOperations(dashboardId, operations)

    console.log(`📊 Dashboard layout updated: ${dashboard.name}`)
    return dashboard
  }

  /**
   * 获取布局模板
   */
  getLayoutTemplates(category?: string): LayoutTemplate[] {
    let templates = Array.from(this.layoutTemplates.values())
    
    if (category) {
      templates = templates.filter(t => t.category === category)
    }
    
    return templates.sort((a, b) => b.usageCount - a.usageCount)
  }

  /**
   * 获取个人化设置
   */
  async getPersonalizationSettings(userId: string, accountId: string): Promise<PersonalizationSettings> {
    const key = `${userId}_${accountId}`
    let settings = this.personalizationSettings.get(key)
    
    if (!settings) {
      settings = this.createDefaultPersonalizationSettings(userId, accountId)
      this.personalizationSettings.set(key, settings)
      await this.savePersonalizationSettings(settings)
    }
    
    return settings
  }

  /**
   * 更新个人化设置
   */
  async updatePersonalizationSettings(
    userId: string,
    accountId: string,
    updates: Partial<PersonalizationSettings>
  ): Promise<PersonalizationSettings> {
    const settings = await this.getPersonalizationSettings(userId, accountId)
    const updatedSettings = { ...settings, ...updates }
    
    const key = `${userId}_${accountId}`
    this.personalizationSettings.set(key, updatedSettings)
    await this.savePersonalizationSettings(updatedSettings)
    
    console.log(`⚙️ Personalization settings updated for user: ${userId}`)
    return updatedSettings
  }

  /**
   * 共享仪表盘
   */
  async shareDashboard(
    dashboardId: string,
    userId: string,
    shareConfig: {
      shareType: 'view_only' | 'interactive' | 'editable'
      targets: ShareTarget[]
      requireLogin?: boolean
      allowExport?: boolean
      allowComments?: boolean
      expiresAt?: Date
    }
  ): Promise<SharingSettings> {
    if (!this.isInitialized) await this.initialize()

    const dashboard = await this.getDashboardConfig(dashboardId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    // 检查共享权限
    const canShare = await this.checkDashboardPermission(dashboard, userId, 'share')
    if (!canShare) {
      throw new Error('Insufficient permissions to share dashboard')
    }

    const sharingSettings: SharingSettings = {
      dashboardId,
      isShared: true,
      shareType: shareConfig.shareType,
      sharedWith: shareConfig.targets,
      requireLogin: shareConfig.requireLogin || true,
      allowExport: shareConfig.allowExport || false,
      allowComments: shareConfig.allowComments || false,
      expiresAt: shareConfig.expiresAt,
      shareUrl: this.generateShareUrl(dashboardId),
      embedCode: this.generateEmbedCode(dashboardId),
      viewCount: 0
    }

    this.sharingSettings.set(dashboardId, sharingSettings)
    await this.saveSharingSettings(sharingSettings)

    // 更新仪表盘共享状态
    dashboard.isShared = true
    dashboard.sharedWith = shareConfig.targets.map(t => t.id)
    await this.saveDashboardConfig(dashboard)

    console.log(`🔗 Dashboard shared: ${dashboard.name}`)
    return sharingSettings
  }

  /**
   * 获取布局历史
   */
  getLayoutHistory(dashboardId: string): LayoutHistory | null {
    return this.layoutHistory.get(dashboardId) || null
  }

  /**
   * 恢复布局快照
   */
  async restoreLayoutSnapshot(
    dashboardId: string,
    snapshotId: string,
    userId: string
  ): Promise<DashboardConfig> {
    const history = this.layoutHistory.get(dashboardId)
    if (!history) {
      throw new Error('Layout history not found')
    }

    const snapshot = history.snapshots.find(s => s.id === snapshotId)
    if (!snapshot) {
      throw new Error('Layout snapshot not found')
    }

    const dashboard = await this.getDashboardConfig(dashboardId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    // 检查编辑权限
    const canEdit = await this.checkDashboardPermission(dashboard, userId, 'edit')
    if (!canEdit) {
      throw new Error('Insufficient permissions to restore layout')
    }

    // 恢复布局和组件
    dashboard.layout = snapshot.layout
    dashboard.widgets = snapshot.widgets
    dashboard.updatedAt = new Date()

    await this.saveDashboardConfig(dashboard)

    // 记录恢复操作
    this.addLayoutOperations(dashboardId, [{
      type: 'update_config',
      widgetId: 'restore',
      data: { snapshotId, description: snapshot.description },
      timestamp: new Date(),
      userId
    }])

    console.log(`🔄 Layout restored from snapshot: ${snapshotId}`)
    return dashboard
  }

  // 私有方法
  private async loadLayoutTemplates(): Promise<void> {
    // 执行仪表盘模板
    const executiveTemplate: LayoutTemplate = {
      id: 'executive_overview',
      name: '高管概览仪表盘',
      description: '为高管提供关键业务指标的概览',
      category: 'executive',
      layout: {
        type: 'grid',
        columns: 12,
        rows: 8,
        gaps: { x: 16, y: 16 },
        responsive: true
      },
      widgets: [
        {
          type: 'kpi_card',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: { title: '总收入' },
          required: true,
          customizable: false
        },
        {
          type: 'kpi_card',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: { title: '用户增长' },
          required: true,
          customizable: false
        },
        {
          type: 'line_chart',
          position: { x: 0, y: 2, width: 8, height: 4 },
          config: { title: '收入趋势' },
          required: true,
          customizable: true
        },
        {
          type: 'pie_chart',
          position: { x: 8, y: 0, width: 4, height: 4 },
          config: { title: '收入来源' },
          required: false,
          customizable: true
        }
      ],
      tags: ['executive', 'overview', 'kpi'],
      usageCount: 45,
      rating: 4.8,
      createdBy: 'system',
      createdAt: new Date(),
      isPublic: true
    }

    // 运营仪表盘模板
    const operationalTemplate: LayoutTemplate = {
      id: 'operational_dashboard',
      name: '运营监控仪表盘',
      description: '实时监控运营指标和系统状态',
      category: 'operational',
      layout: {
        type: 'grid',
        columns: 12,
        rows: 10,
        gaps: { x: 12, y: 12 },
        responsive: true
      },
      widgets: [
        {
          type: 'data_table',
          position: { x: 0, y: 0, width: 8, height: 6 },
          config: { title: '实时数据' },
          required: true,
          customizable: true
        },
        {
          type: 'gauge_chart',
          position: { x: 8, y: 0, width: 4, height: 3 },
          config: { title: '系统负载' },
          required: true,
          customizable: false
        },
        {
          type: 'bar_chart',
          position: { x: 0, y: 6, width: 6, height: 4 },
          config: { title: '性能指标' },
          required: false,
          customizable: true
        }
      ],
      tags: ['operational', 'monitoring', 'realtime'],
      usageCount: 32,
      rating: 4.5,
      createdBy: 'system',
      createdAt: new Date(),
      isPublic: true
    }

    this.layoutTemplates.set(executiveTemplate.id, executiveTemplate)
    this.layoutTemplates.set(operationalTemplate.id, operationalTemplate)

    console.log(`📚 Loaded ${this.layoutTemplates.size} layout templates`)
  }

  private async loadPersonalizationSettings(): Promise<void> {
    // 从localStorage加载个人化设置
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('personalization_')) {
          const settings = JSON.parse(localStorage.getItem(key) || '{}') as PersonalizationSettings
          const mapKey = `${settings.userId}_${settings.accountId}`
          this.personalizationSettings.set(mapKey, settings)
        }
      }
    } catch (error) {
      console.error('Failed to load personalization settings:', error)
    }
  }

  private createDefaultPersonalizationSettings(userId: string, accountId: string): PersonalizationSettings {
    return {
      userId,
      accountId,
      theme: 'auto',
      colorScheme: 'default',
      defaultLayout: 'grid',
      gridSize: 20,
      snapToGrid: true,
      favoriteComponents: ['kpi_card', 'line_chart', 'data_table'],
      defaultRefreshInterval: 300,
      showGridLines: true,
      showComponentBorders: true,
      compactMode: false,
      enableAnimations: true,
      enableTooltips: true,
      enableKeyboardShortcuts: true,
      savedDashboards: [],
      recentComponents: [],
      recentTemplates: []
    }
  }

  private createEmptyLayout(type: 'grid' | 'free'): DashboardLayout {
    if (type === 'grid') {
      return {
        type: 'grid',
        columns: 12,
        rows: 8,
        gaps: { x: 16, y: 16 },
        responsive: true
      }
    } else {
      return {
        type: 'flex',
        columns: 1,
        rows: 1,
        gaps: { x: 0, y: 0 },
        responsive: false
      }
    }
  }

  private async createWidgetsFromTemplate(
    template: LayoutTemplate,
    userId: string,
    accountId: string
  ): Promise<DashboardWidget[]> {
    const widgets: DashboardWidget[] = []

    for (const templateWidget of template.widgets) {
      const widget: DashboardWidget = {
        id: crypto.randomUUID(),
        type: templateWidget.type,
        title: templateWidget.config.title || `${templateWidget.type} Widget`,
        position: templateWidget.position,
        dataSource: 'api',
        dataQuery: {},
        filters: {},
        visualization: {
          colors: ['#1f77b4', '#ff7f0e', '#2ca02c'],
          showLegend: true,
          showGrid: true,
          showTooltip: true,
          animations: true,
          customOptions: {}
        },
        interactions: [
          {
            type: 'click',
            action: 'show_details',
            parameters: {}
          }
        ],
        requiredPermissions: ['analytics.view']
      }

      widgets.push(widget)
    }

    return widgets
  }

  private async createWidgetsFromConfig(
    configs: Partial<DashboardWidget>[],
    userId: string,
    accountId: string
  ): Promise<DashboardWidget[]> {
    const widgets: DashboardWidget[] = []

    for (const config of configs) {
      const widget: DashboardWidget = {
        id: crypto.randomUUID(),
        type: config.type || 'kpi_card',
        title: config.title || 'New Widget',
        position: config.position || { x: 0, y: 0, width: 4, height: 3 },
        dataSource: config.dataSource || 'api',
        dataQuery: config.dataQuery || {},
        filters: config.filters || {},
        visualization: config.visualization || {
          colors: ['#1f77b4'],
          showLegend: true,
          showGrid: true,
          showTooltip: true,
          animations: true,
          customOptions: {}
        },
        interactions: config.interactions || [],
        requiredPermissions: config.requiredPermissions || ['analytics.view']
      }

      widgets.push(widget)
    }

    return widgets
  }

  private async getDashboardConfig(dashboardId: string): Promise<DashboardConfig | null> {
    try {
      const stored = localStorage.getItem(`dashboard_config_${dashboardId}`)
      if (!stored) return null

      return JSON.parse(stored) as DashboardConfig
    } catch (error) {
      console.error('Failed to get dashboard config:', error)
      return null
    }
  }

  private async saveDashboardConfig(config: DashboardConfig): Promise<void> {
    try {
      localStorage.setItem(`dashboard_config_${config.id}`, JSON.stringify(config))
    } catch (error) {
      console.error('Failed to save dashboard config:', error)
      throw error
    }
  }

  private async savePersonalizationSettings(settings: PersonalizationSettings): Promise<void> {
    try {
      const key = `personalization_${settings.userId}_${settings.accountId}`
      localStorage.setItem(key, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save personalization settings:', error)
    }
  }

  private async saveSharingSettings(settings: SharingSettings): Promise<void> {
    try {
      localStorage.setItem(`sharing_${settings.dashboardId}`, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save sharing settings:', error)
    }
  }

  private async checkDashboardPermission(
    dashboard: DashboardConfig,
    userId: string,
    action: 'view' | 'edit' | 'share' | 'delete'
  ): Promise<boolean> {
    // 创建者拥有所有权限
    if (dashboard.createdBy === userId) {
      return true
    }

    // 检查明确的权限设置
    const userPermission = dashboard.permissions.find(p => p.userId === userId)
    if (userPermission && userPermission.permissions.includes(action)) {
      return true
    }

    // 检查基于角色的权限
    return await this.permissionController.checkDataAccess(
      userId,
      dashboard.accountId,
      'analytics',
      action === 'view' ? 'view' : 'edit'
    ).then(result => result.granted)
  }

  private initializeLayoutHistory(dashboardId: string): void {
    const history: LayoutHistory = {
      dashboardId,
      operations: [],
      snapshots: [],
      maxOperations: 100,
      maxSnapshots: 10
    }

    this.layoutHistory.set(dashboardId, history)
  }

  private addLayoutOperations(dashboardId: string, operations: LayoutOperation[]): void {
    const history = this.layoutHistory.get(dashboardId)
    if (!history) return

    history.operations.push(...operations)

    // 限制操作历史数量
    if (history.operations.length > history.maxOperations) {
      history.operations = history.operations.slice(-history.maxOperations)
    }

    // 每10个操作创建一个快照
    if (history.operations.length % 10 === 0) {
      this.createLayoutSnapshot(dashboardId, `Auto snapshot ${Date.now()}`)
    }
  }

  private async createLayoutSnapshot(dashboardId: string, description: string): Promise<void> {
    const dashboard = await this.getDashboardConfig(dashboardId)
    const history = this.layoutHistory.get(dashboardId)
    
    if (!dashboard || !history) return

    const snapshot: LayoutSnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      layout: dashboard.layout,
      widgets: dashboard.widgets,
      description,
      userId: dashboard.createdBy
    }

    history.snapshots.push(snapshot)

    // 限制快照数量
    if (history.snapshots.length > history.maxSnapshots) {
      history.snapshots = history.snapshots.slice(-history.maxSnapshots)
    }
  }

  private generateShareUrl(dashboardId: string): string {
    return `${window.location.origin}/shared/dashboard/${dashboardId}`
  }

  private generateEmbedCode(dashboardId: string): string {
    const embedUrl = `${window.location.origin}/embed/dashboard/${dashboardId}`
    return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`
  }
}

// Export singleton instance
export const dashboardLayoutService = DashboardLayoutService.getInstance()
