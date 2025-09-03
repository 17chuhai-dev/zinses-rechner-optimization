/**
 * PDF报告模板管理器
 * 提供专业的PDF报告模板，支持多种行业标准和自定义模板
 */

import type { ChartPDFExportConfig } from './ChartPDFExporter'
import type { Chart } from 'chart.js'

// PDF报告模板类型
export type PDFReportTemplate = 
  | 'financial-analysis'
  | 'investment-report'
  | 'risk-assessment'
  | 'executive-summary'
  | 'technical-analysis'
  | 'compliance-report'
  | 'audit-report'
  | 'presentation'
  | 'academic'
  | 'minimal'

// 报告用途分类
export enum ReportPurpose {
  INTERNAL = 'internal',
  CLIENT = 'client',
  REGULATORY = 'regulatory',
  BOARD = 'board',
  MARKETING = 'marketing',
  ACADEMIC = 'academic'
}

// 报告复杂度级别
export enum ReportComplexity {
  SIMPLE = 'simple',
  STANDARD = 'standard',
  COMPREHENSIVE = 'comprehensive',
  EXECUTIVE = 'executive'
}

// 模板配置接口
export interface PDFTemplateConfig {
  id: string
  name: string
  description: string
  category: ReportPurpose
  complexity: ReportComplexity
  config: ChartPDFExportConfig
  preview?: string
  tags: string[]
  isDefault?: boolean
  isCustom?: boolean
}

// 预定义模板配置
export const PDF_REPORT_TEMPLATES: Record<PDFReportTemplate, PDFTemplateConfig> = {
  'financial-analysis': {
    id: 'financial-analysis',
    name: 'Finanzanalyse Bericht',
    description: 'Umfassender Finanzanalysebericht mit detaillierten Berechnungen und Projektionen',
    category: ReportPurpose.CLIENT,
    complexity: ReportComplexity.COMPREHENSIVE,
    tags: ['Finanzanalyse', 'Investition', 'Zinsen', 'Projektionen'],
    isDefault: true,
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'high',
      margins: { top: 25, right: 20, bottom: 25, left: 20 },
      metadata: {
        title: 'Finanzanalyse Bericht',
        author: 'Zinses Rechner',
        subject: 'Detaillierte Finanzanalyse und Berechnungsergebnisse'
      },
      layout: {
        multiPage: true,
        chartsPerPage: 1,
        includeHeader: true,
        includeFooter: true,
        headerText: 'Finanzanalyse Bericht',
        footerText: 'Vertraulich - Nur für den internen Gebrauch'
      },
      styling: {
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: 11,
        textColor: '#333333'
      },
      compression: { enabled: true, level: 6, imageQuality: 0.85 },
      
      // Spezifische Konfiguration
      includeExecutiveSummary: true,
      includeDataTable: true,
      includeCalculationDetails: true,
      includeAssumptions: true,
      includeDisclaimer: true,
      includeMethodology: true,
      includeRiskAnalysis: true,
      includeRecommendations: true,
      includeAppendix: true,
      
      chartPosition: 'center',
      chartSize: 'large',
      chartQuality: 'high',
      includeMultipleCharts: true,
      chartTypes: ['line', 'bar', 'pie'],
      
      tableFormat: 'detailed',
      includeFormulas: true,
      highlightKeyValues: true,
      includeDataSources: true,
      tableStyle: 'professional',
      maxTableRows: 200,
      
      theme: 'professional',
      colorScheme: 'color',
      customColors: {
        primary: '#1E40AF',
        secondary: '#64748B',
        accent: '#059669',
        text: '#1F2937',
        background: '#FFFFFF'
      },
      
      companyName: 'Zinses Rechner',
      reportTitle: 'Finanzanalyse Bericht',
      reportSubtitle: 'Detaillierte Analyse und Projektionen',
      reportDate: new Date(),
      reportVersion: '1.0',
      reportAuthor: 'Finanzanalyst',
      reportDepartment: 'Finanzabteilung',
      
      includePageNumbers: true,
      includeTOC: true,
      includeIndex: true,
      includeWatermark: false,
      
      includeBookmarks: true,
      includeHyperlinks: true,
      optimizeForScreen: true,
      includeAccessibilityFeatures: true,
      
      language: 'de',
      dateFormat: 'DD.MM.YYYY',
      numberFormat: 'de-DE',
      currencySymbol: '€'
    }
  },

  'investment-report': {
    id: 'investment-report',
    name: 'Investitionsbericht',
    description: 'Professioneller Investitionsbericht für Stakeholder und Investoren',
    category: ReportPurpose.CLIENT,
    complexity: ReportComplexity.STANDARD,
    tags: ['Investment', 'ROI', 'Rendite', 'Risiko'],
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'high',
      margins: { top: 30, right: 25, bottom: 30, left: 25 },
      metadata: {
        title: 'Investitionsbericht',
        author: 'Zinses Rechner',
        subject: 'Investitionsanalyse und Renditeberechnung'
      },
      layout: {
        multiPage: true,
        chartsPerPage: 2,
        includeHeader: true,
        includeFooter: true,
        headerText: 'Investitionsbericht',
        footerText: 'Erstellt mit Zinses Rechner'
      },
      styling: {
        backgroundColor: '#ffffff',
        fontFamily: 'Times, serif',
        fontSize: 12,
        textColor: '#2D3748'
      },
      compression: { enabled: true, level: 5, imageQuality: 0.9 },
      
      includeExecutiveSummary: true,
      includeDataTable: true,
      includeCalculationDetails: false,
      includeAssumptions: true,
      includeDisclaimer: true,
      includeRiskAnalysis: true,
      includeRecommendations: true,
      
      chartPosition: 'center',
      chartSize: 'medium',
      chartQuality: 'high',
      includeMultipleCharts: true,
      chartTypes: ['line', 'bar'],
      
      tableFormat: 'summary',
      includeFormulas: false,
      highlightKeyValues: true,
      tableStyle: 'striped',
      
      theme: 'corporate',
      colorScheme: 'brand',
      customColors: {
        primary: '#2563EB',
        secondary: '#475569',
        accent: '#DC2626',
        text: '#1F2937',
        background: '#FFFFFF'
      },
      
      reportTitle: 'Investitionsbericht',
      reportSubtitle: 'Analyse und Empfehlungen',
      
      includePageNumbers: true,
      includeTOC: true,
      includeBookmarks: true,
      
      language: 'de',
      currencySymbol: '€'
    }
  },

  'executive-summary': {
    id: 'executive-summary',
    name: 'Management Summary',
    description: 'Kompakte Zusammenfassung für Führungskräfte',
    category: ReportPurpose.BOARD,
    complexity: ReportComplexity.EXECUTIVE,
    tags: ['Management', 'Summary', 'Überblick', 'Entscheidung'],
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'high',
      margins: { top: 35, right: 30, bottom: 35, left: 30 },
      metadata: {
        title: 'Management Summary',
        author: 'Zinses Rechner',
        subject: 'Executive Summary der Finanzanalyse'
      },
      layout: {
        multiPage: false,
        chartsPerPage: 1,
        includeHeader: true,
        includeFooter: true,
        headerText: 'Management Summary',
        footerText: 'Vertraulich'
      },
      styling: {
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        textColor: '#1A202C'
      },
      compression: { enabled: true, level: 7, imageQuality: 0.8 },
      
      includeExecutiveSummary: true,
      includeDataTable: false,
      includeCalculationDetails: false,
      includeAssumptions: false,
      includeDisclaimer: true,
      includeRecommendations: true,
      
      chartPosition: 'center',
      chartSize: 'large',
      chartQuality: 'high',
      chartTypes: ['line'],
      
      tableFormat: 'simple',
      highlightKeyValues: true,
      tableStyle: 'minimal',
      
      theme: 'modern',
      colorScheme: 'high-contrast',
      
      reportTitle: 'Management Summary',
      reportSubtitle: 'Finanzanalyse Überblick',
      
      includePageNumbers: false,
      includeTOC: false,
      includeWatermark: true,
      watermarkText: 'VERTRAULICH',
      watermarkOpacity: 0.1,
      
      optimizeForPrint: true,
      
      language: 'de',
      currencySymbol: '€'
    }
  },

  'technical-analysis': {
    id: 'technical-analysis',
    name: 'Technische Analyse',
    description: 'Detaillierte technische Analyse mit Formeln und Berechnungen',
    category: ReportPurpose.INTERNAL,
    complexity: ReportComplexity.COMPREHENSIVE,
    tags: ['Technisch', 'Formeln', 'Berechnung', 'Detail'],
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'print',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      metadata: {
        title: 'Technische Analyse',
        author: 'Zinses Rechner',
        subject: 'Detaillierte technische Finanzanalyse'
      },
      layout: {
        multiPage: true,
        chartsPerPage: 1,
        includeHeader: true,
        includeFooter: true,
        headerText: 'Technische Analyse',
        footerText: 'Interne Dokumentation'
      },
      styling: {
        backgroundColor: '#ffffff',
        fontFamily: 'Courier, monospace',
        fontSize: 10,
        textColor: '#2D3748'
      },
      compression: { enabled: false, level: 0, imageQuality: 1.0 },
      
      includeExecutiveSummary: false,
      includeDataTable: true,
      includeCalculationDetails: true,
      includeAssumptions: true,
      includeMethodology: true,
      includeAppendix: true,
      
      chartPosition: 'center',
      chartSize: 'medium',
      chartQuality: 'print',
      includeMultipleCharts: true,
      chartTypes: ['line', 'scatter'],
      
      tableFormat: 'detailed',
      includeFormulas: true,
      includeDataSources: true,
      tableStyle: 'grid',
      maxTableRows: 500,
      
      theme: 'academic',
      colorScheme: 'grayscale',
      
      reportTitle: 'Technische Analyse',
      reportSubtitle: 'Detaillierte Berechnungen und Formeln',
      
      includePageNumbers: true,
      includeTOC: true,
      includeIndex: true,
      
      includeAccessibilityFeatures: true,
      
      language: 'de',
      numberFormat: 'de-DE',
      currencySymbol: '€'
    }
  },

  'minimal': {
    id: 'minimal',
    name: 'Minimaler Bericht',
    description: 'Einfacher, kompakter Bericht mit den wichtigsten Informationen',
    category: ReportPurpose.INTERNAL,
    complexity: ReportComplexity.SIMPLE,
    tags: ['Minimal', 'Einfach', 'Kompakt', 'Schnell'],
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'standard',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      metadata: {
        title: 'Finanzberechnung',
        author: 'Zinses Rechner'
      },
      layout: {
        multiPage: false,
        chartsPerPage: 1,
        includeHeader: false,
        includeFooter: false
      },
      styling: {
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        textColor: '#333333'
      },
      compression: { enabled: true, level: 8, imageQuality: 0.7 },
      
      includeExecutiveSummary: false,
      includeDataTable: true,
      includeCalculationDetails: false,
      includeAssumptions: false,
      includeDisclaimer: false,
      
      chartPosition: 'center',
      chartSize: 'medium',
      chartQuality: 'standard',
      chartTypes: ['line'],
      
      tableFormat: 'simple',
      highlightKeyValues: false,
      tableStyle: 'minimal',
      
      theme: 'minimal',
      colorScheme: 'color',
      
      reportTitle: 'Finanzberechnung',
      
      includePageNumbers: false,
      includeTOC: false,
      
      language: 'de',
      currencySymbol: '€'
    }
  },

  'risk-assessment': {
    id: 'risk-assessment',
    name: 'Risikobewertung',
    description: 'Spezialisierter Bericht für Risikoanalyse und -bewertung',
    category: ReportPurpose.REGULATORY,
    complexity: ReportComplexity.COMPREHENSIVE,
    tags: ['Risiko', 'Bewertung', 'Compliance', 'Regulatorisch'],
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'high',
      margins: { top: 25, right: 20, bottom: 25, left: 20 },
      
      includeRiskAnalysis: true,
      includeMethodology: true,
      includeAssumptions: true,
      includeDisclaimer: true,
      includeAppendix: true,
      
      chartTypes: ['bar', 'pie'],
      tableFormat: 'detailed',
      theme: 'professional',
      colorScheme: 'high-contrast',
      
      reportTitle: 'Risikobewertung',
      reportSubtitle: 'Analyse und Bewertung finanzieller Risiken',
      
      includeWatermark: true,
      watermarkText: 'RISIKOBEWERTUNG',
      
      language: 'de',
      currencySymbol: '€'
    }
  },

  'compliance-report': {
    id: 'compliance-report',
    name: 'Compliance Bericht',
    description: 'Regulatorischer Bericht für Compliance-Zwecke',
    category: ReportPurpose.REGULATORY,
    complexity: ReportComplexity.STANDARD,
    tags: ['Compliance', 'Regulatorisch', 'Audit', 'Dokumentation'],
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'high',
      
      includeMethodology: true,
      includeDataSources: true,
      includeAssumptions: true,
      includeDisclaimer: true,
      
      theme: 'classic',
      colorScheme: 'grayscale',
      
      reportTitle: 'Compliance Bericht',
      
      includePageNumbers: true,
      includeTOC: true,
      includeIndex: true,
      
      optimizeForPrint: true,
      includeAccessibilityFeatures: true,
      
      language: 'de'
    }
  },

  'audit-report': {
    id: 'audit-report',
    name: 'Audit Bericht',
    description: 'Strukturierter Bericht für Audit-Zwecke',
    category: ReportPurpose.REGULATORY,
    complexity: ReportComplexity.COMPREHENSIVE,
    tags: ['Audit', 'Prüfung', 'Dokumentation', 'Nachweis'],
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'print',
      
      includeMethodology: true,
      includeCalculationDetails: true,
      includeDataSources: true,
      includeAssumptions: true,
      includeAppendix: true,
      
      tableFormat: 'detailed',
      includeFormulas: true,
      
      theme: 'academic',
      colorScheme: 'grayscale',
      
      reportTitle: 'Audit Bericht',
      
      includePageNumbers: true,
      includeTOC: true,
      includeIndex: true,
      
      language: 'de'
    }
  },

  'presentation': {
    id: 'presentation',
    name: 'Präsentationsbericht',
    description: 'Visuell ansprechender Bericht für Präsentationen',
    category: ReportPurpose.MARKETING,
    complexity: ReportComplexity.STANDARD,
    tags: ['Präsentation', 'Visuell', 'Marketing', 'Kunden'],
    config: {
      pageSize: 'A4',
      orientation: 'landscape',
      quality: 'high',
      
      chartSize: 'large',
      chartPosition: 'center',
      
      theme: 'modern',
      colorScheme: 'brand',
      
      includeExecutiveSummary: true,
      includeRecommendations: true,
      
      reportTitle: 'Finanzanalyse Präsentation',
      
      language: 'de'
    }
  },

  'academic': {
    id: 'academic',
    name: 'Akademischer Bericht',
    description: 'Wissenschaftlicher Bericht mit detaillierter Methodik',
    category: ReportPurpose.ACADEMIC,
    complexity: ReportComplexity.COMPREHENSIVE,
    tags: ['Akademisch', 'Wissenschaft', 'Methodik', 'Forschung'],
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'print',
      
      includeMethodology: true,
      includeCalculationDetails: true,
      includeDataSources: true,
      includeAssumptions: true,
      includeAppendix: true,
      
      tableFormat: 'detailed',
      includeFormulas: true,
      
      theme: 'academic',
      colorScheme: 'grayscale',
      
      reportTitle: 'Finanzanalytische Studie',
      
      includePageNumbers: true,
      includeTOC: true,
      includeIndex: true,
      
      language: 'de'
    }
  }
}

/**
 * PDF报告模板管理器类
 */
export class PDFReportTemplateManager {
  private static instance: PDFReportTemplateManager
  private customTemplates: Map<string, PDFTemplateConfig> = new Map()

  public static getInstance(): PDFReportTemplateManager {
    if (!PDFReportTemplateManager.instance) {
      PDFReportTemplateManager.instance = new PDFReportTemplateManager()
    }
    return PDFReportTemplateManager.instance
  }

  /**
   * 获取模板配置
   */
  public getTemplate(templateId: PDFReportTemplate | string): PDFTemplateConfig {
    // 首先检查预定义模板
    if (templateId in PDF_REPORT_TEMPLATES) {
      return { ...PDF_REPORT_TEMPLATES[templateId as PDFReportTemplate] }
    }
    
    // 然后检查自定义模板
    const customTemplate = this.customTemplates.get(templateId)
    if (customTemplate) {
      return { ...customTemplate }
    }
    
    throw new Error(`模板不存在: ${templateId}`)
  }

  /**
   * 根据用途推荐模板
   */
  public getRecommendedTemplate(purpose: ReportPurpose): PDFTemplateConfig {
    const templateMap: Record<ReportPurpose, PDFReportTemplate> = {
      [ReportPurpose.INTERNAL]: 'technical-analysis',
      [ReportPurpose.CLIENT]: 'financial-analysis',
      [ReportPurpose.REGULATORY]: 'compliance-report',
      [ReportPurpose.BOARD]: 'executive-summary',
      [ReportPurpose.MARKETING]: 'presentation',
      [ReportPurpose.ACADEMIC]: 'academic'
    }

    return this.getTemplate(templateMap[purpose])
  }

  /**
   * 根据复杂度推荐模板
   */
  public getTemplateByComplexity(complexity: ReportComplexity): PDFTemplateConfig {
    const templates = Object.values(PDF_REPORT_TEMPLATES)
      .filter(template => template.complexity === complexity)
    
    if (templates.length === 0) {
      return this.getTemplate('minimal')
    }
    
    return templates[0]
  }

  /**
   * 获取所有可用模板
   */
  public getAllTemplates(): PDFTemplateConfig[] {
    const predefined = Object.values(PDF_REPORT_TEMPLATES)
    const custom = Array.from(this.customTemplates.values())
    return [...predefined, ...custom]
  }

  /**
   * 根据标签搜索模板
   */
  public searchTemplatesByTag(tag: string): PDFTemplateConfig[] {
    return this.getAllTemplates().filter(template =>
      template.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    )
  }

  /**
   * 保存自定义模板
   */
  public saveCustomTemplate(template: PDFTemplateConfig): void {
    template.isCustom = true
    this.customTemplates.set(template.id, template)
  }

  /**
   * 删除自定义模板
   */
  public deleteCustomTemplate(templateId: string): boolean {
    return this.customTemplates.delete(templateId)
  }

  /**
   * 根据图表类型优化模板
   */
  public optimizeTemplateForChart(
    template: PDFTemplateConfig,
    chart: Chart
  ): PDFTemplateConfig {
    const optimized = { ...template }
    const chartType = chart.config.type

    // 根据图表类型调整配置
    switch (chartType) {
      case 'line':
        optimized.config.chartTypes = ['line']
        optimized.config.chartSize = 'large'
        break
      case 'bar':
        optimized.config.chartTypes = ['bar']
        optimized.config.chartPosition = 'center'
        break
      case 'pie':
        optimized.config.chartTypes = ['pie']
        optimized.config.chartSize = 'medium'
        optimized.config.includeDataTable = true
        break
    }

    return optimized
  }
}

// 导出单例实例
export const pdfReportTemplateManager = PDFReportTemplateManager.getInstance()

// 便捷函数
export function getPDFTemplate(templateId: PDFReportTemplate): PDFTemplateConfig {
  return pdfReportTemplateManager.getTemplate(templateId)
}

export function getRecommendedPDFTemplate(purpose: ReportPurpose): PDFTemplateConfig {
  return pdfReportTemplateManager.getRecommendedTemplate(purpose)
}
