/**
 * 报告生成服务
 * 提供专业的财务报告生成、模板管理、自动化报告等功能
 */

import { authService } from './AuthService'
import type { AnalysisResult } from './AdvancedAnalyticsService'
import type { CalculationResult } from '@/types/calculator'

// 报告相关类型定义
export interface ReportTemplate {
  id: string
  organizationId: string
  name: string
  description?: string
  category: ReportCategory
  type: ReportType
  structure: ReportStructure
  styling: ReportStyling
  isPublic: boolean
  isDefault: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  usageCount: number
  tags: string[]
}

export type ReportCategory = 
  | 'financial_analysis'    // 财务分析
  | 'risk_assessment'       // 风险评估
  | 'portfolio_review'      // 投资组合回顾
  | 'performance_report'    // 业绩报告
  | 'compliance_report'     // 合规报告
  | 'executive_summary'     // 执行摘要
  | 'client_report'         // 客户报告
  | 'regulatory_filing'     // 监管申报

export type ReportType = 'pdf' | 'html' | 'docx' | 'xlsx' | 'pptx'

export interface ReportStructure {
  sections: ReportSectionTemplate[]
  layout: LayoutSettings
  pageSettings: PageSettings
  tableOfContents: boolean
  appendices: AppendixTemplate[]
}

export interface ReportSectionTemplate {
  id: string
  title: string
  type: SectionType
  order: number
  isRequired: boolean
  content: SectionContent
  formatting: SectionFormatting
  dataBindings: DataBinding[]
}

export type SectionType = 
  | 'title_page'
  | 'executive_summary'
  | 'methodology'
  | 'analysis_results'
  | 'charts_graphs'
  | 'tables'
  | 'recommendations'
  | 'risk_disclosure'
  | 'appendix'
  | 'custom'

export interface SectionContent {
  template: string           // HTML/Markdown模板
  variables: VariableDefinition[]
  charts: ChartReference[]
  tables: TableReference[]
  images: ImageReference[]
}

export interface VariableDefinition {
  name: string
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage'
  source: string            // 数据源路径
  format?: string           // 格式化规则
  defaultValue?: any
}

export interface ChartReference {
  id: string
  title: string
  type: string
  dataSource: string
  width?: number
  height?: number
  position: 'inline' | 'float' | 'page_break'
}

export interface TableReference {
  id: string
  title: string
  dataSource: string
  columns: TableColumn[]
  formatting: TableFormatting
  position: 'inline' | 'float' | 'page_break'
}

export interface TableColumn {
  key: string
  title: string
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date'
  format?: string
  width?: string
  alignment?: 'left' | 'center' | 'right'
}

export interface ImageReference {
  id: string
  title?: string
  source: string
  width?: number
  height?: number
  position: 'inline' | 'float' | 'page_break'
  caption?: string
}

export interface SectionFormatting {
  fontSize: number
  fontFamily: string
  lineHeight: number
  margins: Margins
  backgroundColor?: string
  borderStyle?: BorderStyle
}

export interface DataBinding {
  variable: string
  source: string
  transformation?: DataTransformation
}

export interface DataTransformation {
  type: 'format' | 'calculate' | 'aggregate' | 'filter'
  parameters: Record<string, any>
}

export interface LayoutSettings {
  columns: number
  columnGap: number
  margins: Margins
  header: HeaderFooterSettings
  footer: HeaderFooterSettings
}

export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface HeaderFooterSettings {
  enabled: boolean
  content: string
  height: number
  alignment: 'left' | 'center' | 'right'
}

export interface PageSettings {
  size: 'A4' | 'A3' | 'Letter' | 'Legal'
  orientation: 'portrait' | 'landscape'
  margins: Margins
  numbering: PageNumbering
}

export interface PageNumbering {
  enabled: boolean
  format: string
  position: 'header' | 'footer'
  alignment: 'left' | 'center' | 'right'
}

export interface AppendixTemplate {
  id: string
  title: string
  content: string
  dataSource?: string
  isOptional: boolean
}

export interface ReportStyling {
  theme: ReportTheme
  colors: ColorPalette
  fonts: FontSettings
  branding: BrandingSettings
}

export interface ReportTheme {
  name: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
}

export interface ColorPalette {
  primary: string[]
  secondary: string[]
  neutral: string[]
  success: string
  warning: string
  error: string
}

export interface FontSettings {
  headings: FontDefinition
  body: FontDefinition
  captions: FontDefinition
  tables: FontDefinition
}

export interface FontDefinition {
  family: string
  size: number
  weight: number
  lineHeight: number
}

export interface BrandingSettings {
  logo?: string
  logoPosition: 'header' | 'footer' | 'title_page'
  companyName: string
  address?: string
  website?: string
  disclaimer?: string
}

export interface ReportRequest {
  id: string
  organizationId: string
  templateId: string
  name: string
  description?: string
  inputData: ReportInputData
  parameters: ReportParameters
  status: ReportStatus
  createdBy: string
  createdAt: Date
  completedAt?: Date
  downloadUrl?: string
  expiresAt?: Date
}

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface ReportInputData {
  calculations: CalculationResult[]
  analyses: AnalysisResult[]
  marketData?: any
  customData?: Record<string, any>
  metadata: ReportMetadata
}

export interface ReportMetadata {
  title: string
  subtitle?: string
  author: string
  organization: string
  reportDate: Date
  period: DateRange
  version: string
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted'
}

export interface DateRange {
  start: Date
  end: Date
}

export interface ReportParameters {
  format: ReportType
  language: string
  timezone: string
  currency: string
  includeCharts: boolean
  includeRawData: boolean
  includeDisclaimer: boolean
  customSettings: Record<string, any>
}

export interface GeneratedReport {
  id: string
  name: string
  format: ReportType
  size: number
  pages: number
  downloadUrl: string
  previewUrl?: string
  expiresAt: Date
  metadata: ReportMetadata
}

export interface ReportSchedule {
  id: string
  organizationId: string
  templateId: string
  name: string
  description?: string
  frequency: ScheduleFrequency
  parameters: ScheduleParameters
  recipients: ReportRecipient[]
  isActive: boolean
  nextRun: Date
  lastRun?: Date
  createdBy: string
  createdAt: Date
}

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'

export interface ScheduleParameters {
  dayOfWeek?: number        // 0-6 for weekly
  dayOfMonth?: number       // 1-31 for monthly
  month?: number           // 1-12 for annually
  time: string             // HH:MM format
  timezone: string
}

export interface ReportRecipient {
  email: string
  name?: string
  role?: string
  deliveryMethod: 'email' | 'download_link' | 'api_webhook'
}

export class ReportGenerationService {
  private static instance: ReportGenerationService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {}

  public static getInstance(): ReportGenerationService {
    if (!ReportGenerationService.instance) {
      ReportGenerationService.instance = new ReportGenerationService()
    }
    return ReportGenerationService.instance
  }

  /**
   * 创建报告模板
   */
  public async createTemplate(data: {
    organizationId: string
    name: string
    description?: string
    category: ReportCategory
    type: ReportType
    structure: ReportStructure
    styling: ReportStyling
    tags?: string[]
  }): Promise<ReportTemplate | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/reports/templates', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('template:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建报告模板失败:', error)
      return null
    }
  }

  /**
   * 获取组织的报告模板
   */
  public async getOrganizationTemplates(
    organizationId: string,
    category?: ReportCategory
  ): Promise<ReportTemplate[]> {
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)

      const response = await this.makeAuthenticatedRequest(
        `/api/reports/organizations/${organizationId}/templates?${params.toString()}`
      )

      return response.success ? response.data : []
    } catch (error) {
      console.error('获取报告模板失败:', error)
      return []
    }
  }

  /**
   * 生成报告
   */
  public async generateReport(data: {
    organizationId: string
    templateId: string
    name: string
    description?: string
    inputData: ReportInputData
    parameters: ReportParameters
  }): Promise<ReportRequest | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('report:generation_started', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('生成报告失败:', error)
      return null
    }
  }

  /**
   * 获取报告状态
   */
  public async getReportStatus(reportId: string): Promise<ReportRequest | null> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/reports/${reportId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取报告状态失败:', error)
      return null
    }
  }

  /**
   * 下载报告
   */
  public async downloadReport(reportId: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/reports/${reportId}/download`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      })

      if (response.ok) {
        return await response.blob()
      }

      return null
    } catch (error) {
      console.error('下载报告失败:', error)
      return null
    }
  }

  /**
   * 预览报告
   */
  public async previewReport(
    templateId: string,
    inputData: ReportInputData,
    sectionId?: string
  ): Promise<string | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/reports/preview', {
        method: 'POST',
        body: JSON.stringify({ templateId, inputData, sectionId })
      })

      return response.success ? response.data.html : null
    } catch (error) {
      console.error('预览报告失败:', error)
      return null
    }
  }

  /**
   * 创建报告计划
   */
  public async createSchedule(data: {
    organizationId: string
    templateId: string
    name: string
    description?: string
    frequency: ScheduleFrequency
    parameters: ScheduleParameters
    recipients: ReportRecipient[]
  }): Promise<ReportSchedule | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('schedule:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建报告计划失败:', error)
      return null
    }
  }

  /**
   * 获取组织的报告计划
   */
  public async getOrganizationSchedules(organizationId: string): Promise<ReportSchedule[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/reports/organizations/${organizationId}/schedules`
      )
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取报告计划失败:', error)
      return []
    }
  }

  /**
   * 获取报告历史
   */
  public async getReportHistory(
    organizationId: string,
    options?: {
      templateId?: string
      status?: ReportStatus
      limit?: number
      offset?: number
    }
  ): Promise<{ reports: ReportRequest[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (options?.templateId) params.append('templateId', options.templateId)
      if (options?.status) params.append('status', options.status)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await this.makeAuthenticatedRequest(
        `/api/reports/organizations/${organizationId}/history?${params.toString()}`
      )

      return response.success ? response.data : { reports: [], total: 0 }
    } catch (error) {
      console.error('获取报告历史失败:', error)
      return { reports: [], total: 0 }
    }
  }

  /**
   * 验证模板
   */
  public async validateTemplate(template: ReportTemplate): Promise<{
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationWarning[]
  }> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/reports/templates/validate', {
        method: 'POST',
        body: JSON.stringify({ template })
      })

      return response.success ? response.data : { isValid: false, errors: [], warnings: [] }
    } catch (error) {
      console.error('验证模板失败:', error)
      return { isValid: false, errors: [], warnings: [] }
    }
  }

  /**
   * 获取可用的数据源
   */
  public async getAvailableDataSources(organizationId: string): Promise<DataSource[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/reports/organizations/${organizationId}/data-sources`
      )
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取数据源失败:', error)
      return []
    }
  }

  /**
   * 发起认证请求
   */
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = authService.getAccessToken()
    if (!token) {
      throw new Error('用户未认证')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })

    if (response.status === 401) {
      const refreshed = await authService.refreshToken()
      if (refreshed) {
        return this.makeAuthenticatedRequest(endpoint, options)
      } else {
        throw new Error('认证失败')
      }
    }

    return await response.json()
  }

  /**
   * 事件监听器管理
   */
  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  public off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.listeners.clear()
  }
}

// 辅助接口
export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

export interface DataSource {
  id: string
  name: string
  type: string
  description: string
  fields: DataField[]
}

export interface DataField {
  name: string
  type: string
  description: string
  format?: string
}

export interface BorderStyle {
  width: number
  style: 'solid' | 'dashed' | 'dotted'
  color: string
}

export interface TableFormatting {
  headerStyle: SectionFormatting
  rowStyle: SectionFormatting
  alternateRowStyle?: SectionFormatting
  borderStyle?: BorderStyle
}

// 导出单例实例
export const reportGenerationService = ReportGenerationService.getInstance()
