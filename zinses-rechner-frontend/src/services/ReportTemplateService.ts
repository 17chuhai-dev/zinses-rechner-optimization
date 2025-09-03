/**
 * 报告模板管理服务
 * 提供预定义报告模板、自定义模板创建、模板共享和版本管理功能
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { ReportDesignerService } from './ReportDesignerService'
import { DashboardPermissionController } from './DashboardPermissionController'
import type { ReportConfig, ReportComponent, ReportLayout, ReportStyling } from './ReportDesignerService'

// 报告模板
export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  
  // 模板配置
  config: ReportTemplateConfig
  
  // 预览信息
  thumbnail?: string
  screenshots: string[]
  
  // 使用统计
  usageCount: number
  rating: number
  reviews: TemplateReview[]
  
  // 标签和搜索
  tags: string[]
  keywords: string[]
  
  // 版本信息
  version: string
  changelog?: string[]
  
  // 权限和共享
  isPublic: boolean
  createdBy: string
  sharedWith: string[]
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  lastUsed?: Date
  
  // 兼容性
  minVersion: string
  maxVersion?: string
  dependencies: string[]
}

export type TemplateCategory = 
  | 'financial'
  | 'operational'
  | 'marketing'
  | 'hr'
  | 'executive'
  | 'compliance'
  | 'custom'

// 模板配置
export interface ReportTemplateConfig {
  // 基础配置
  layout: ReportLayout
  styling: ReportStyling
  
  // 组件模板
  components: ComponentTemplate[]
  
  // 数据配置模板
  dataConfig: DataConfigTemplate
  
  // 参数定义
  parameters: TemplateParameter[]
  
  // 自定义选项
  customizations: TemplateCustomization[]
}

// 组件模板
export interface ComponentTemplate {
  id: string
  type: string
  name: string
  description?: string
  
  // 默认配置
  defaultConfig: Partial<ReportComponent>
  
  // 可定制属性
  customizableProperties: string[]
  
  // 必需属性
  requiredProperties: string[]
  
  // 数据要求
  dataRequirements: DataRequirement[]
  
  // 样式选项
  styleOptions: StyleOption[]
}

export interface DataRequirement {
  field: string
  type: 'string' | 'number' | 'date' | 'boolean'
  required: boolean
  description?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: string[]
  }
}

export interface StyleOption {
  property: string
  type: 'color' | 'font' | 'size' | 'select' | 'boolean'
  label: string
  defaultValue: any
  options?: { value: any; label: string }[]
}

// 数据配置模板
export interface DataConfigTemplate {
  dataSources: DataSourceTemplate[]
  globalFilters: FilterTemplate[]
  parameters: ParameterTemplate[]
}

export interface DataSourceTemplate {
  id: string
  name: string
  type: string
  description?: string
  required: boolean
  configurable: boolean
  defaultConfig?: any
}

export interface FilterTemplate {
  field: string
  label: string
  type: 'text' | 'select' | 'date' | 'number'
  required: boolean
  defaultValue?: any
  options?: { value: any; label: string }[]
}

export interface ParameterTemplate {
  id: string
  name: string
  type: string
  label: string
  description?: string
  required: boolean
  defaultValue?: any
  validation?: any
}

// 模板参数
export interface TemplateParameter {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'color' | 'file'
  label: string
  description?: string
  
  // 默认值
  defaultValue?: any
  
  // 选项（用于select类型）
  options?: { value: any; label: string; description?: string }[]
  
  // 验证规则
  validation?: {
    required?: boolean
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  
  // 依赖关系
  dependencies?: ParameterDependency[]
  
  // 分组
  group?: string
  order: number
}

export interface ParameterDependency {
  parameterId: string
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than'
  value: any
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require'
}

// 模板定制
export interface TemplateCustomization {
  id: string
  name: string
  type: 'component' | 'layout' | 'styling' | 'data'
  description?: string
  
  // 定制选项
  options: CustomizationOption[]
  
  // 预览
  preview?: string
  
  // 影响范围
  affects: string[]
}

export interface CustomizationOption {
  id: string
  label: string
  type: 'boolean' | 'select' | 'color' | 'number' | 'text'
  defaultValue: any
  options?: { value: any; label: string }[]
  description?: string
}

// 模板评价
export interface TemplateReview {
  id: string
  userId: string
  userName: string
  rating: number // 1-5
  comment?: string
  createdAt: Date
  helpful: number
  
  // 使用情况
  usageContext?: {
    industry?: string
    companySize?: string
    useCase?: string
  }
}

// 模板应用配置
export interface TemplateApplicationConfig {
  templateId: string
  
  // 参数值
  parameters: Record<string, any>
  
  // 数据源映射
  dataSourceMappings: Record<string, string>
  
  // 定制选项
  customizations: Record<string, any>
  
  // 目标配置
  targetConfig: {
    name: string
    description?: string
    category?: string
    tags?: string[]
  }
}

// 模板搜索
export interface TemplateSearchCriteria {
  query?: string
  category?: TemplateCategory
  tags?: string[]
  rating?: number
  usageCount?: number
  createdBy?: string
  dateRange?: { start: Date; end: Date }
  
  // 排序
  sortBy?: 'name' | 'rating' | 'usage' | 'created' | 'updated'
  sortOrder?: 'asc' | 'desc'
  
  // 分页
  page?: number
  pageSize?: number
}

/**
 * 报告模板管理服务
 */
export class ReportTemplateService {
  private static instance: ReportTemplateService
  private reportDesignerService: ReportDesignerService
  private permissionController: DashboardPermissionController
  
  private templates: Map<string, ReportTemplate> = new Map()
  private templateCache: Map<string, any> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.reportDesignerService = ReportDesignerService.getInstance()
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): ReportTemplateService {
    if (!ReportTemplateService.instance) {
      ReportTemplateService.instance = new ReportTemplateService()
    }
    return ReportTemplateService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.reportDesignerService.initialize()
      await this.permissionController.initialize()
      await this.loadSystemTemplates()
      await this.loadUserTemplates()
      this.isInitialized = true
      console.log('✅ ReportTemplateService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize ReportTemplateService:', error)
      throw error
    }
  }

  /**
   * 创建模板
   */
  async createTemplate(
    userId: string,
    accountId: string,
    templateData: Omit<ReportTemplate, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating' | 'reviews'>
  ): Promise<ReportTemplate> {
    if (!this.isInitialized) await this.initialize()

    // 检查权限
    const hasPermission = await this.permissionController.checkDataAccess(
      userId,
      accountId,
      'analytics',
      'edit'
    )

    if (!hasPermission.granted) {
      throw new Error('Insufficient permissions to create template')
    }

    const template: ReportTemplate = {
      id: crypto.randomUUID(),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      rating: 0,
      reviews: [],
      ...templateData
    }

    // 验证模板配置
    await this.validateTemplateConfig(template)

    // 保存模板
    this.templates.set(template.id, template)
    await this.saveTemplate(template)

    console.log(`📋 Template created: ${template.name}`)
    return template
  }

  /**
   * 获取模板列表
   */
  async getTemplatesByCategory(
    category?: TemplateCategory,
    userId?: string
  ): Promise<ReportTemplate[]> {
    if (!this.isInitialized) await this.initialize()

    let templates = Array.from(this.templates.values())

    // 过滤分类
    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    // 过滤权限（只显示公开模板或用户有权限的模板）
    if (userId) {
      templates = templates.filter(t => 
        t.isPublic || 
        t.createdBy === userId || 
        t.sharedWith.includes(userId)
      )
    } else {
      templates = templates.filter(t => t.isPublic)
    }

    // 按使用量和评分排序
    return templates.sort((a, b) => {
      const scoreA = a.usageCount * 0.3 + a.rating * 0.7
      const scoreB = b.usageCount * 0.3 + b.rating * 0.7
      return scoreB - scoreA
    })
  }

  /**
   * 搜索模板
   */
  async searchTemplates(
    criteria: TemplateSearchCriteria,
    userId?: string
  ): Promise<{ templates: ReportTemplate[]; total: number }> {
    if (!this.isInitialized) await this.initialize()

    let templates = Array.from(this.templates.values())

    // 权限过滤
    if (userId) {
      templates = templates.filter(t => 
        t.isPublic || 
        t.createdBy === userId || 
        t.sharedWith.includes(userId)
      )
    } else {
      templates = templates.filter(t => t.isPublic)
    }

    // 应用搜索条件
    if (criteria.query) {
      const query = criteria.query.toLowerCase()
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.keywords.some(k => k.toLowerCase().includes(query))
      )
    }

    if (criteria.category) {
      templates = templates.filter(t => t.category === criteria.category)
    }

    if (criteria.tags && criteria.tags.length > 0) {
      templates = templates.filter(t => 
        criteria.tags!.some(tag => t.tags.includes(tag))
      )
    }

    if (criteria.rating) {
      templates = templates.filter(t => t.rating >= criteria.rating!)
    }

    if (criteria.usageCount) {
      templates = templates.filter(t => t.usageCount >= criteria.usageCount!)
    }

    if (criteria.createdBy) {
      templates = templates.filter(t => t.createdBy === criteria.createdBy)
    }

    if (criteria.dateRange) {
      templates = templates.filter(t => 
        t.createdAt >= criteria.dateRange!.start &&
        t.createdAt <= criteria.dateRange!.end
      )
    }

    // 排序
    const sortBy = criteria.sortBy || 'rating'
    const sortOrder = criteria.sortOrder || 'desc'
    
    templates.sort((a, b) => {
      let valueA: any, valueB: any
      
      switch (sortBy) {
        case 'name':
          valueA = a.name
          valueB = b.name
          break
        case 'rating':
          valueA = a.rating
          valueB = b.rating
          break
        case 'usage':
          valueA = a.usageCount
          valueB = b.usageCount
          break
        case 'created':
          valueA = a.createdAt.getTime()
          valueB = b.createdAt.getTime()
          break
        case 'updated':
          valueA = a.updatedAt.getTime()
          valueB = b.updatedAt.getTime()
          break
        default:
          valueA = a.rating
          valueB = b.rating
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0
      }
    })

    // 分页
    const total = templates.length
    const page = criteria.page || 1
    const pageSize = criteria.pageSize || 20
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    return {
      templates: templates.slice(startIndex, endIndex),
      total
    }
  }

  /**
   * 应用模板
   */
  async applyTemplate(
    templateId: string,
    userId: string,
    accountId: string,
    applicationConfig: TemplateApplicationConfig
  ): Promise<ReportConfig> {
    if (!this.isInitialized) await this.initialize()

    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    // 检查模板访问权限
    const canAccess = template.isPublic || 
                     template.createdBy === userId || 
                     template.sharedWith.includes(userId)
    
    if (!canAccess) {
      throw new Error('Insufficient permissions to access template')
    }

    // 检查创建报告权限
    const hasPermission = await this.permissionController.checkDataAccess(
      userId,
      accountId,
      'analytics',
      'edit'
    )

    if (!hasPermission.granted) {
      throw new Error('Insufficient permissions to create report')
    }

    // 应用模板配置
    const reportConfig = await this.buildReportFromTemplate(template, applicationConfig)

    // 创建报告
    const report = await this.reportDesignerService.createReport(
      userId,
      accountId,
      reportConfig
    )

    // 更新模板使用统计
    template.usageCount++
    template.lastUsed = new Date()
    await this.saveTemplate(template)

    console.log(`📋 Template applied: ${template.name} -> ${report.name}`)
    return report
  }

  /**
   * 自定义模板
   */
  async customizeTemplate(
    templateId: string,
    userId: string,
    customizations: Record<string, any>
  ): Promise<ReportTemplate> {
    if (!this.isInitialized) await this.initialize()

    const originalTemplate = this.templates.get(templateId)
    if (!originalTemplate) {
      throw new Error('Template not found')
    }

    // 创建自定义模板
    const customTemplate: ReportTemplate = {
      ...originalTemplate,
      id: crypto.randomUUID(),
      name: `${originalTemplate.name} (自定义)`,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      rating: 0,
      reviews: [],
      isPublic: false,
      sharedWith: []
    }

    // 应用自定义选项
    customTemplate.config = await this.applyCustomizations(
      originalTemplate.config,
      customizations
    )

    // 保存自定义模板
    this.templates.set(customTemplate.id, customTemplate)
    await this.saveTemplate(customTemplate)

    console.log(`🎨 Template customized: ${customTemplate.name}`)
    return customTemplate
  }

  /**
   * 共享模板
   */
  async shareTemplate(
    templateId: string,
    userId: string,
    shareConfig: {
      isPublic?: boolean
      sharedWith?: string[]
      permissions?: string[]
    }
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    // 检查权限（只有创建者可以共享）
    if (template.createdBy !== userId) {
      throw new Error('Only template creator can share template')
    }

    // 更新共享设置
    if (shareConfig.isPublic !== undefined) {
      template.isPublic = shareConfig.isPublic
    }

    if (shareConfig.sharedWith) {
      template.sharedWith = shareConfig.sharedWith
    }

    template.updatedAt = new Date()
    await this.saveTemplate(template)

    console.log(`🔗 Template shared: ${template.name}`)
  }

  /**
   * 评价模板
   */
  async rateTemplate(
    templateId: string,
    userId: string,
    userName: string,
    rating: number,
    comment?: string,
    usageContext?: any
  ): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    // 检查是否已经评价过
    const existingReview = template.reviews.find(r => r.userId === userId)
    if (existingReview) {
      // 更新现有评价
      existingReview.rating = rating
      existingReview.comment = comment
      existingReview.usageContext = usageContext
    } else {
      // 添加新评价
      const review: TemplateReview = {
        id: crypto.randomUUID(),
        userId,
        userName,
        rating,
        comment,
        createdAt: new Date(),
        helpful: 0,
        usageContext
      }
      template.reviews.push(review)
    }

    // 重新计算平均评分
    template.rating = template.reviews.reduce((sum, r) => sum + r.rating, 0) / template.reviews.length

    template.updatedAt = new Date()
    await this.saveTemplate(template)

    console.log(`⭐ Template rated: ${template.name} (${rating}/5)`)
  }

  // 私有方法
  private async loadSystemTemplates(): Promise<void> {
    // 财务报告模板
    const financialTemplate: ReportTemplate = {
      id: 'financial_overview',
      name: '财务概览报告',
      description: '全面的财务状况分析报告，包含收入、支出、利润和现金流分析',
      category: 'financial',
      config: {
        layout: {
          type: 'page',
          orientation: 'portrait',
          pageSize: 'A4',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          grid: { enabled: true, columns: 12, rows: 16, gap: { x: 10, y: 10 } },
          responsive: false
        },
        styling: {
          theme: 'light',
          colorPalette: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
          globalFont: { family: 'Arial', baseSize: 12 },
          branding: {
            logoPosition: 'header',
            colors: { primary: '#1f77b4', secondary: '#ff7f0e', accent: '#2ca02c' }
          },
          pageStyle: {
            backgroundColor: '#ffffff',
            headerHeight: 60,
            footerHeight: 40,
            showPageNumbers: true,
            showTimestamp: true
          }
        },
        components: [
          {
            id: 'header',
            type: 'header',
            name: '报告标题',
            description: '财务概览报告标题区域',
            defaultConfig: {
              type: 'header',
              name: '财务概览报告',
              position: { x: 0, y: 0, width: 12, height: 1, zIndex: 1, anchor: 'top-left', constraints: { keepAspectRatio: false } },
              config: { title: '财务概览报告' },
              dataBinding: { source: '', realTime: false },
              styling: {
                backgroundColor: '#f8f9fa',
                backgroundOpacity: 1,
                border: { width: 0, style: 'none', color: '#000000', radius: 0 },
                shadow: { enabled: false, x: 0, y: 0, blur: 0, color: '#000000' },
                font: { family: 'Arial', size: 18, weight: 'bold', style: 'normal', color: '#333333', align: 'center' },
                padding: { top: 10, right: 10, bottom: 10, left: 10 },
                margin: { top: 0, right: 0, bottom: 10, left: 0 }
              },
              interactions: []
            },
            customizableProperties: ['title', 'styling.font', 'styling.backgroundColor'],
            requiredProperties: ['title'],
            dataRequirements: [],
            styleOptions: [
              { property: 'backgroundColor', type: 'color', label: '背景颜色', defaultValue: '#f8f9fa' },
              { property: 'font.color', type: 'color', label: '文字颜色', defaultValue: '#333333' }
            ]
          }
        ],
        dataConfig: {
          dataSources: [
            {
              id: 'financial_data',
              name: '财务数据',
              type: 'dashboard',
              description: '财务相关的数据源',
              required: true,
              configurable: true
            }
          ],
          globalFilters: [
            {
              field: 'date_range',
              label: '日期范围',
              type: 'date',
              required: true,
              defaultValue: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
            }
          ],
          parameters: [
            {
              id: 'company_name',
              name: 'companyName',
              type: 'text',
              label: '公司名称',
              required: true,
              defaultValue: 'Zinses-Rechner GmbH'
            }
          ]
        },
        parameters: [
          {
            id: 'report_period',
            name: 'reportPeriod',
            type: 'select',
            label: '报告周期',
            defaultValue: 'monthly',
            options: [
              { value: 'weekly', label: '周报' },
              { value: 'monthly', label: '月报' },
              { value: 'quarterly', label: '季报' },
              { value: 'yearly', label: '年报' }
            ],
            validation: { required: true },
            dependencies: [],
            group: 'basic',
            order: 1
          }
        ],
        customizations: [
          {
            id: 'color_scheme',
            name: '配色方案',
            type: 'styling',
            description: '选择报告的配色方案',
            options: [
              { id: 'blue', label: '蓝色主题', type: 'select', defaultValue: 'blue' },
              { id: 'green', label: '绿色主题', type: 'select', defaultValue: 'green' },
              { id: 'custom', label: '自定义', type: 'color', defaultValue: '#1f77b4' }
            ],
            affects: ['styling.colorPalette', 'styling.branding.colors']
          }
        ]
      },
      screenshots: ['/templates/financial_overview_1.png', '/templates/financial_overview_2.png'],
      usageCount: 156,
      rating: 4.7,
      reviews: [],
      tags: ['财务', '概览', '分析', '报告'],
      keywords: ['financial', 'overview', 'analysis', 'profit', 'revenue'],
      version: '1.0.0',
      isPublic: true,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      minVersion: '1.0.0',
      dependencies: []
    }

    // 运营报告模板
    const operationalTemplate: ReportTemplate = {
      id: 'operational_dashboard',
      name: '运营监控报告',
      description: '实时运营数据监控报告，包含关键性能指标和运营趋势分析',
      category: 'operational',
      config: {
        layout: {
          type: 'dashboard',
          orientation: 'landscape',
          pageSize: 'A4',
          margins: { top: 15, right: 15, bottom: 15, left: 15 },
          grid: { enabled: true, columns: 16, rows: 12, gap: { x: 8, y: 8 } },
          responsive: true
        },
        styling: {
          theme: 'light',
          colorPalette: ['#2ca02c', '#1f77b4', '#ff7f0e', '#d62728'],
          globalFont: { family: 'Helvetica', baseSize: 11 },
          branding: {
            logoPosition: 'header',
            colors: { primary: '#2ca02c', secondary: '#1f77b4', accent: '#ff7f0e' }
          },
          pageStyle: {
            backgroundColor: '#ffffff',
            headerHeight: 50,
            footerHeight: 30,
            showPageNumbers: true,
            showTimestamp: true
          }
        },
        components: [],
        dataConfig: {
          dataSources: [
            {
              id: 'operational_data',
              name: '运营数据',
              type: 'api',
              description: '实时运营数据源',
              required: true,
              configurable: true
            }
          ],
          globalFilters: [],
          parameters: []
        },
        parameters: [
          {
            id: 'refresh_interval',
            name: 'refreshInterval',
            type: 'select',
            label: '刷新间隔',
            defaultValue: '5min',
            options: [
              { value: '1min', label: '1分钟' },
              { value: '5min', label: '5分钟' },
              { value: '15min', label: '15分钟' },
              { value: '30min', label: '30分钟' }
            ],
            validation: { required: true },
            dependencies: [],
            group: 'advanced',
            order: 1
          }
        ],
        customizations: []
      },
      screenshots: ['/templates/operational_dashboard_1.png'],
      usageCount: 89,
      rating: 4.3,
      reviews: [],
      tags: ['运营', '监控', '实时', 'KPI'],
      keywords: ['operational', 'monitoring', 'realtime', 'kpi', 'dashboard'],
      version: '1.0.0',
      isPublic: true,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      minVersion: '1.0.0',
      dependencies: []
    }

    this.templates.set(financialTemplate.id, financialTemplate)
    this.templates.set(operationalTemplate.id, operationalTemplate)

    console.log(`📚 Loaded ${this.templates.size} system templates`)
  }

  private async loadUserTemplates(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('report_template_')) {
          const template = JSON.parse(localStorage.getItem(key) || '{}') as ReportTemplate
          this.templates.set(template.id, template)
        }
      }
    } catch (error) {
      console.error('Failed to load user templates:', error)
    }
  }

  private async validateTemplateConfig(template: ReportTemplate): Promise<void> {
    if (!template.name || template.name.trim().length === 0) {
      throw new Error('Template name is required')
    }

    if (!template.config) {
      throw new Error('Template configuration is required')
    }

    if (!template.config.layout) {
      throw new Error('Template layout is required')
    }
  }

  private async buildReportFromTemplate(
    template: ReportTemplate,
    applicationConfig: TemplateApplicationConfig
  ): Promise<Omit<ReportConfig, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'version'>> {
    const config = template.config

    // 应用参数值
    const processedConfig = await this.processTemplateParameters(config, applicationConfig.parameters)

    // 应用数据源映射
    const mappedConfig = await this.applyDataSourceMappings(processedConfig, applicationConfig.dataSourceMappings)

    // 应用自定义选项
    const customizedConfig = await this.applyCustomizations(mappedConfig, applicationConfig.customizations)

    return {
      name: applicationConfig.targetConfig.name,
      description: applicationConfig.targetConfig.description,
      category: applicationConfig.targetConfig.category as any || template.category,
      layout: customizedConfig.layout,
      components: customizedConfig.components.map(ct => ({
        id: crypto.randomUUID(),
        ...ct.defaultConfig
      } as ReportComponent)),
      dataConfig: {
        dataSources: customizedConfig.dataConfig.dataSources.map(ds => ({
          id: ds.id,
          name: ds.name,
          type: ds.type,
          connection: ds.defaultConfig
        })),
        globalFilters: [],
        parameters: customizedConfig.dataConfig.parameters.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          label: p.label,
          defaultValue: p.defaultValue,
          required: p.required
        })),
        refreshStrategy: 'manual',
        cacheEnabled: true
      },
      styling: customizedConfig.styling,
      permissions: [],
      tags: applicationConfig.targetConfig.tags || template.tags
    }
  }

  private async processTemplateParameters(
    config: ReportTemplateConfig,
    parameters: Record<string, any>
  ): Promise<ReportTemplateConfig> {
    // 简化实现：替换参数占位符
    const configStr = JSON.stringify(config)
    let processedStr = configStr

    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{{${key}}}`
      processedStr = processedStr.replace(new RegExp(placeholder, 'g'), String(value))
    }

    return JSON.parse(processedStr)
  }

  private async applyDataSourceMappings(
    config: ReportTemplateConfig,
    mappings: Record<string, string>
  ): Promise<ReportTemplateConfig> {
    // 应用数据源映射
    for (const dataSource of config.dataConfig.dataSources) {
      if (mappings[dataSource.id]) {
        dataSource.defaultConfig = { ...dataSource.defaultConfig, source: mappings[dataSource.id] }
      }
    }

    return config
  }

  private async applyCustomizations(
    config: ReportTemplateConfig,
    customizations: Record<string, any>
  ): Promise<ReportTemplateConfig> {
    // 应用自定义选项
    for (const [key, value] of Object.entries(customizations)) {
      // 简化实现：直接设置配置值
      this.setNestedProperty(config, key, value)
    }

    return config
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }

    current[keys[keys.length - 1]] = value
  }

  private async saveTemplate(template: ReportTemplate): Promise<void> {
    try {
      localStorage.setItem(`report_template_${template.id}`, JSON.stringify(template))
    } catch (error) {
      console.error('Failed to save template:', error)
      throw error
    }
  }
}

// Export singleton instance
export const reportTemplateService = ReportTemplateService.getInstance()
