/**
 * 报告设计器服务
 * 支持拖拽式报告设计、组件配置、布局管理和实时预览功能
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { EnterpriseDashboardService } from './EnterpriseDashboardService'
import { VisualizationComponentLibrary } from './VisualizationComponentLibrary'
import { DashboardPermissionController } from './DashboardPermissionController'
import type { VisualizationComponentType, ComponentConfig } from './VisualizationComponentLibrary'

// 报告配置
export interface ReportConfig {
  id: string
  name: string
  description?: string
  category: 'financial' | 'operational' | 'marketing' | 'executive' | 'custom'
  
  // 报告布局
  layout: ReportLayout
  
  // 报告组件
  components: ReportComponent[]
  
  // 数据配置
  dataConfig: ReportDataConfig
  
  // 样式配置
  styling: ReportStyling
  
  // 权限配置
  permissions: ReportPermission[]
  
  // 元数据
  createdBy: string
  createdAt: Date
  updatedAt: Date
  version: number
  tags: string[]
}

// 报告布局
export interface ReportLayout {
  type: 'page' | 'continuous' | 'dashboard'
  orientation: 'portrait' | 'landscape'
  
  // 页面设置
  pageSize: 'A4' | 'A3' | 'letter' | 'legal' | 'custom'
  customSize?: { width: number; height: number }
  margins: { top: number; right: number; bottom: number; left: number }
  
  // 布局网格
  grid: {
    enabled: boolean
    columns: number
    rows: number
    gap: { x: number; y: number }
  }
  
  // 响应式设置
  responsive: boolean
  breakpoints?: { mobile: number; tablet: number; desktop: number }
}

// 报告组件
export interface ReportComponent {
  id: string
  type: ReportComponentType
  name: string
  
  // 位置和大小
  position: ComponentPosition
  
  // 组件配置
  config: ComponentConfig
  
  // 数据绑定
  dataBinding: DataBinding
  
  // 样式配置
  styling: ComponentStyling
  
  // 条件显示
  conditions?: DisplayCondition[]
  
  // 交互配置
  interactions: ComponentInteraction[]
}

export type ReportComponentType = 
  | VisualizationComponentType
  | 'text_block'
  | 'image'
  | 'table'
  | 'header'
  | 'footer'
  | 'page_break'
  | 'signature'
  | 'date_time'
  | 'page_number'

export interface ComponentPosition {
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  
  // 锚点设置
  anchor: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  
  // 约束
  constraints: {
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    aspectRatio?: number
    keepAspectRatio: boolean
  }
}

// 数据绑定
export interface DataBinding {
  source: string
  query?: string
  filters?: DataFilter[]
  aggregation?: DataAggregation
  sorting?: DataSorting[]
  
  // 实时数据
  realTime: boolean
  refreshInterval?: number
  
  // 数据转换
  transformations?: DataTransformation[]
}

export interface DataFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between'
  value: any
  condition?: 'and' | 'or'
}

export interface DataAggregation {
  groupBy: string[]
  aggregations: {
    field: string
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct'
    alias?: string
  }[]
}

export interface DataSorting {
  field: string
  direction: 'asc' | 'desc'
  priority: number
}

export interface DataTransformation {
  type: 'format' | 'calculate' | 'filter' | 'group' | 'pivot'
  config: any
}

// 组件样式
export interface ComponentStyling {
  // 背景
  backgroundColor?: string
  backgroundImage?: string
  backgroundOpacity: number
  
  // 边框
  border: {
    width: number
    style: 'solid' | 'dashed' | 'dotted' | 'none'
    color: string
    radius: number
  }
  
  // 阴影
  shadow: {
    enabled: boolean
    x: number
    y: number
    blur: number
    color: string
  }
  
  // 字体
  font: {
    family: string
    size: number
    weight: 'normal' | 'bold' | 'lighter' | 'bolder'
    style: 'normal' | 'italic'
    color: string
    align: 'left' | 'center' | 'right' | 'justify'
  }
  
  // 间距
  padding: { top: number; right: number; bottom: number; left: number }
  margin: { top: number; right: number; bottom: number; left: number }
}

// 显示条件
export interface DisplayCondition {
  type: 'data' | 'user' | 'time' | 'custom'
  condition: string
  value: any
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
}

// 组件交互
export interface ComponentInteraction {
  type: 'click' | 'hover' | 'drill_down' | 'filter'
  action: 'navigate' | 'show_details' | 'filter_report' | 'export_data'
  target?: string
  parameters: Record<string, any>
}

// 报告数据配置
export interface ReportDataConfig {
  dataSources: DataSource[]
  globalFilters: DataFilter[]
  parameters: ReportParameter[]
  
  // 数据刷新
  refreshStrategy: 'manual' | 'auto' | 'scheduled'
  refreshInterval?: number
  
  // 数据缓存
  cacheEnabled: boolean
  cacheTTL?: number
}

export interface DataSource {
  id: string
  name: string
  type: 'dashboard' | 'api' | 'database' | 'file'
  connection: any
  schema?: any
}

export interface ReportParameter {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect'
  label: string
  defaultValue?: any
  options?: { value: any; label: string }[]
  required: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

// 报告样式
export interface ReportStyling {
  theme: 'light' | 'dark' | 'custom'
  colorPalette: string[]
  
  // 全局字体
  globalFont: {
    family: string
    baseSize: number
  }
  
  // 品牌设置
  branding: {
    logo?: string
    logoPosition: 'header' | 'footer' | 'watermark'
    companyName?: string
    colors: {
      primary: string
      secondary: string
      accent: string
    }
  }
  
  // 页面样式
  pageStyle: {
    backgroundColor: string
    headerHeight: number
    footerHeight: number
    showPageNumbers: boolean
    showTimestamp: boolean
  }
}

// 报告权限
export interface ReportPermission {
  userId?: string
  roleId?: string
  teamId?: string
  permissions: ('view' | 'edit' | 'share' | 'export' | 'schedule')[]
  restrictions?: {
    dataFilters?: DataFilter[]
    exportFormats?: string[]
    maxExports?: number
  }
}

// 报告预览
export interface ReportPreview {
  reportId: string
  previewUrl: string
  thumbnails: string[]
  generatedAt: Date
  
  // 预览配置
  format: 'html' | 'pdf' | 'image'
  quality: 'low' | 'medium' | 'high'
  
  // 预览数据
  sampleData: boolean
  dataTimestamp?: Date
}

// 拖拽操作
export interface DragOperation {
  type: 'move' | 'resize' | 'add' | 'remove'
  componentId: string
  startPosition?: ComponentPosition
  endPosition?: ComponentPosition
  componentType?: ReportComponentType
}

/**
 * 报告设计器服务
 */
export class ReportDesignerService {
  private static instance: ReportDesignerService
  private dashboardService: EnterpriseDashboardService
  private componentLibrary: VisualizationComponentLibrary
  private permissionController: DashboardPermissionController
  
  private reports: Map<string, ReportConfig> = new Map()
  private previewCache: Map<string, ReportPreview> = new Map()
  private dragOperations: Map<string, DragOperation> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.dashboardService = EnterpriseDashboardService.getInstance()
    this.componentLibrary = VisualizationComponentLibrary.getInstance()
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): ReportDesignerService {
    if (!ReportDesignerService.instance) {
      ReportDesignerService.instance = new ReportDesignerService()
    }
    return ReportDesignerService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await Promise.all([
        this.dashboardService.initialize(),
        this.componentLibrary.initialize(),
        this.permissionController.initialize()
      ])
      
      await this.loadReports()
      this.isInitialized = true
      console.log('✅ ReportDesignerService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ReportDesignerService:', error)
      throw error
    }
  }

  /**
   * 创建新报告
   */
  async createReport(
    userId: string,
    accountId: string,
    config: Omit<ReportConfig, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<ReportConfig> {
    if (!this.isInitialized) await this.initialize()

    // 检查权限
    const hasPermission = await this.permissionController.checkDataAccess(
      userId,
      accountId,
      'analytics',
      'view'
    )

    if (!hasPermission.granted) {
      throw new Error('Insufficient permissions to create report')
    }

    const report: ReportConfig = {
      id: crypto.randomUUID(),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      ...config
    }

    // 验证报告配置
    await this.validateReportConfig(report)

    // 保存报告
    this.reports.set(report.id, report)
    await this.saveReport(report)

    console.log(`📊 Report created: ${report.name}`)
    return report
  }

  /**
   * 更新报告布局
   */
  async updateReportLayout(
    reportId: string,
    userId: string,
    layout: Partial<ReportLayout>
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    // 检查编辑权限
    const canEdit = await this.checkReportPermission(report, userId, 'edit')
    if (!canEdit) {
      throw new Error('Insufficient permissions to edit report')
    }

    // 更新布局
    report.layout = { ...report.layout, ...layout }
    report.updatedAt = new Date()
    report.version++

    await this.saveReport(report)
    
    // 清除预览缓存
    this.previewCache.delete(reportId)

    console.log(`📐 Report layout updated: ${reportId}`)
  }

  /**
   * 添加报告组件
   */
  async addReportComponent(
    reportId: string,
    userId: string,
    component: Omit<ReportComponent, 'id'>
  ): Promise<ReportComponent> {
    if (!this.isInitialized) await this.initialize()

    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    const canEdit = await this.checkReportPermission(report, userId, 'edit')
    if (!canEdit) {
      throw new Error('Insufficient permissions to edit report')
    }

    const newComponent: ReportComponent = {
      id: crypto.randomUUID(),
      ...component
    }

    // 验证组件配置
    await this.validateComponentConfig(newComponent)

    // 添加组件
    report.components.push(newComponent)
    report.updatedAt = new Date()
    report.version++

    await this.saveReport(report)
    this.previewCache.delete(reportId)

    console.log(`🧩 Component added to report: ${component.type}`)
    return newComponent
  }

  /**
   * 移动组件
   */
  async moveComponent(
    reportId: string,
    componentId: string,
    userId: string,
    position: ComponentPosition
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    const canEdit = await this.checkReportPermission(report, userId, 'edit')
    if (!canEdit) {
      throw new Error('Insufficient permissions to edit report')
    }

    const component = report.components.find(c => c.id === componentId)
    if (!component) {
      throw new Error('Component not found')
    }

    // 记录拖拽操作
    const dragOperation: DragOperation = {
      type: 'move',
      componentId,
      startPosition: component.position,
      endPosition: position
    }

    // 更新位置
    component.position = position
    report.updatedAt = new Date()

    await this.saveReport(report)
    this.previewCache.delete(reportId)

    console.log(`📍 Component moved: ${componentId}`)
  }

  /**
   * 调整组件大小
   */
  async resizeComponent(
    reportId: string,
    componentId: string,
    userId: string,
    size: { width: number; height: number }
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    const canEdit = await this.checkReportPermission(report, userId, 'edit')
    if (!canEdit) {
      throw new Error('Insufficient permissions to edit report')
    }

    const component = report.components.find(c => c.id === componentId)
    if (!component) {
      throw new Error('Component not found')
    }

    // 应用约束
    const constraints = component.position.constraints
    if (constraints.minWidth && size.width < constraints.minWidth) {
      size.width = constraints.minWidth
    }
    if (constraints.maxWidth && size.width > constraints.maxWidth) {
      size.width = constraints.maxWidth
    }
    if (constraints.minHeight && size.height < constraints.minHeight) {
      size.height = constraints.minHeight
    }
    if (constraints.maxHeight && size.height > constraints.maxHeight) {
      size.height = constraints.maxHeight
    }

    // 保持宽高比
    if (constraints.keepAspectRatio && constraints.aspectRatio) {
      const ratio = constraints.aspectRatio
      if (size.width / size.height !== ratio) {
        size.height = size.width / ratio
      }
    }

    component.position.width = size.width
    component.position.height = size.height
    report.updatedAt = new Date()

    await this.saveReport(report)
    this.previewCache.delete(reportId)

    console.log(`📏 Component resized: ${componentId}`)
  }

  /**
   * 生成报告预览
   */
  async generatePreview(
    reportId: string,
    userId: string,
    options: {
      format?: 'html' | 'pdf' | 'image'
      quality?: 'low' | 'medium' | 'high'
      sampleData?: boolean
    } = {}
  ): Promise<ReportPreview> {
    if (!this.isInitialized) await this.initialize()

    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    const canView = await this.checkReportPermission(report, userId, 'view')
    if (!canView) {
      throw new Error('Insufficient permissions to view report')
    }

    // 检查缓存
    const cacheKey = `${reportId}_${JSON.stringify(options)}`
    const cached = this.previewCache.get(cacheKey)
    if (cached && Date.now() - cached.generatedAt.getTime() < 5 * 60 * 1000) { // 5分钟缓存
      return cached
    }

    // 生成预览
    const preview: ReportPreview = {
      reportId,
      previewUrl: await this.generatePreviewUrl(report, options),
      thumbnails: await this.generateThumbnails(report),
      generatedAt: new Date(),
      format: options.format || 'html',
      quality: options.quality || 'medium',
      sampleData: options.sampleData || false
    }

    // 缓存预览
    this.previewCache.set(cacheKey, preview)

    console.log(`👁️ Report preview generated: ${reportId}`)
    return preview
  }

  /**
   * 获取报告
   */
  async getReport(reportId: string, userId: string): Promise<ReportConfig | null> {
    if (!this.isInitialized) await this.initialize()

    const report = this.reports.get(reportId)
    if (!report) return null

    const canView = await this.checkReportPermission(report, userId, 'view')
    if (!canView) {
      throw new Error('Insufficient permissions to view report')
    }

    return report
  }

  /**
   * 获取用户的报告列表
   */
  async getUserReports(userId: string, accountId: string): Promise<ReportConfig[]> {
    if (!this.isInitialized) await this.initialize()

    const userReports: ReportConfig[] = []

    for (const report of this.reports.values()) {
      try {
        const canView = await this.checkReportPermission(report, userId, 'view')
        if (canView) {
          userReports.push(report)
        }
      } catch (error) {
        // 忽略权限错误，继续检查其他报告
        continue
      }
    }

    return userReports.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // 私有方法
  private async validateReportConfig(report: ReportConfig): Promise<void> {
    if (!report.name || report.name.trim().length === 0) {
      throw new Error('Report name is required')
    }

    if (!report.layout) {
      throw new Error('Report layout is required')
    }

    // 验证组件
    for (const component of report.components) {
      await this.validateComponentConfig(component)
    }
  }

  private async validateComponentConfig(component: ReportComponent): Promise<void> {
    if (!component.type) {
      throw new Error('Component type is required')
    }

    if (!component.position) {
      throw new Error('Component position is required')
    }

    // 验证位置约束
    const pos = component.position
    if (pos.width <= 0 || pos.height <= 0) {
      throw new Error('Component size must be positive')
    }

    // 验证数据绑定
    if (component.dataBinding && !component.dataBinding.source) {
      throw new Error('Data source is required for data binding')
    }
  }

  private async checkReportPermission(
    report: ReportConfig,
    userId: string,
    action: 'view' | 'edit' | 'share' | 'export' | 'schedule'
  ): Promise<boolean> {
    // 创建者拥有所有权限
    if (report.createdBy === userId) {
      return true
    }

    // 检查明确的权限设置
    const userPermission = report.permissions.find(p => p.userId === userId)
    if (userPermission && userPermission.permissions.includes(action)) {
      return true
    }

    // 检查基于角色的权限
    // 这里简化实现，实际应该调用权限控制器
    return false
  }

  private async generatePreviewUrl(
    report: ReportConfig,
    options: any
  ): Promise<string> {
    // 简化实现：生成预览URL
    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      format: options.format || 'html',
      quality: options.quality || 'medium',
      sample: options.sampleData ? 'true' : 'false'
    })
    
    return `${baseUrl}/api/reports/${report.id}/preview?${params.toString()}`
  }

  private async generateThumbnails(report: ReportConfig): Promise<string[]> {
    // 简化实现：生成缩略图URL
    return [
      `/api/reports/${report.id}/thumbnail/1`,
      `/api/reports/${report.id}/thumbnail/2`,
      `/api/reports/${report.id}/thumbnail/3`
    ]
  }

  private async loadReports(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('report_config_')) {
          const report = JSON.parse(localStorage.getItem(key) || '{}') as ReportConfig
          this.reports.set(report.id, report)
        }
      }
      console.log(`📚 Loaded ${this.reports.size} reports`)
    } catch (error) {
      console.error('Failed to load reports:', error)
    }
  }

  private async saveReport(report: ReportConfig): Promise<void> {
    try {
      localStorage.setItem(`report_config_${report.id}`, JSON.stringify(report))
    } catch (error) {
      console.error('Failed to save report:', error)
      throw error
    }
  }
}

// Export singleton instance
export const reportDesignerService = ReportDesignerService.getInstance()
