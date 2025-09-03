/**
 * Chart.js PDF导出器
 * 专门针对Chart.js图表的PDF导出功能，提供专业的报告格式输出
 */

import type { Chart } from 'chart.js'
import { PDFExportEngine, type PDFExportConfig, type PDFExportResult } from './PDFExportEngine'

// Chart.js特定的PDF导出配置
export interface ChartPDFExportConfig extends PDFExportConfig {
  // 报告结构
  includeExecutiveSummary?: boolean
  includeDataTable?: boolean
  includeCalculationDetails?: boolean
  includeAssumptions?: boolean
  includeDisclaimer?: boolean
  includeMethodology?: boolean
  includeRiskAnalysis?: boolean
  includeRecommendations?: boolean
  includeAppendix?: boolean

  // 图表选项
  chartTitle?: string
  chartDescription?: string
  chartPosition?: 'top' | 'center' | 'bottom' | 'full-width'
  chartSize?: 'small' | 'medium' | 'large' | 'full-width' | 'custom'
  includeMultipleCharts?: boolean
  chartTypes?: Array<'line' | 'bar' | 'pie' | 'area' | 'scatter'>
  chartQuality?: 'draft' | 'standard' | 'high' | 'print'

  // 数据表格选项
  tableFormat?: 'simple' | 'detailed' | 'summary' | 'comparison'
  includeFormulas?: boolean
  highlightKeyValues?: boolean
  includeDataSources?: boolean
  tableStyle?: 'grid' | 'striped' | 'minimal' | 'professional'
  maxTableRows?: number

  // 样式选项
  theme?: 'professional' | 'modern' | 'classic' | 'minimal' | 'corporate' | 'academic'
  colorScheme?: 'color' | 'grayscale' | 'high-contrast' | 'brand' | 'custom'
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
    text?: string
    background?: string
  }

  // 品牌选项
  logo?: string
  companyName?: string
  reportTitle?: string
  reportSubtitle?: string
  reportDate?: Date
  reportVersion?: string
  reportAuthor?: string
  reportDepartment?: string

  // 页面选项
  includePageNumbers?: boolean
  includeTOC?: boolean
  includeIndex?: boolean
  includeWatermark?: boolean
  watermarkText?: string
  watermarkOpacity?: number

  // 高级选项
  includeInteractiveElements?: boolean
  includeBookmarks?: boolean
  includeHyperlinks?: boolean
  optimizeForPrint?: boolean
  optimizeForScreen?: boolean
  includeAccessibilityFeatures?: boolean

  // 本地化选项
  language?: 'de' | 'en'
  dateFormat?: string
  numberFormat?: string
  currencySymbol?: string
}

// Chart.js PDF导出结果
export interface ChartPDFExportResult extends PDFExportResult {
  reportInfo: {
    title: string
    sections: number
    charts: number
    tables: number
    totalPages: number
  }
}

// 默认配置
export const DEFAULT_CHART_PDF_CONFIG: ChartPDFExportConfig = {
  pageSize: 'A4',
  orientation: 'portrait',
  quality: 'high',
  margins: {
    top: 25,
    right: 20,
    bottom: 25,
    left: 20
  },
  metadata: {
    title: 'Zinses Rechner - Finanzanalyse Bericht',
    author: 'Zinses Rechner',
    subject: 'Finanzanalyse und Berechnungsergebnisse',
    creator: 'Zinses Rechner PDF Export Engine'
  },
  layout: {
    multiPage: true,
    chartsPerPage: 1,
    includeHeader: true,
    includeFooter: true,
    headerText: 'Zinses Rechner - Finanzanalyse',
    footerText: `Erstellt am ${new Date().toLocaleDateString('de-DE')}`
  },
  styling: {
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
    textColor: '#333333'
  },
  compression: {
    enabled: true,
    level: 6,
    imageQuality: 0.85
  },

  // 报告结构
  includeExecutiveSummary: true,
  includeDataTable: true,
  includeCalculationDetails: true,
  includeAssumptions: true,
  includeDisclaimer: true,
  includeMethodology: false,
  includeRiskAnalysis: true,
  includeRecommendations: true,
  includeAppendix: false,

  // 图表选项
  chartTitle: '',
  chartDescription: '',
  chartPosition: 'center',
  chartSize: 'large',
  includeMultipleCharts: false,
  chartTypes: ['line'],
  chartQuality: 'high',

  // 数据表格选项
  tableFormat: 'detailed',
  includeFormulas: false,
  highlightKeyValues: true,
  includeDataSources: true,
  tableStyle: 'professional',
  maxTableRows: 100,

  // 样式选项
  theme: 'professional',
  colorScheme: 'color',
  customColors: {
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#10B981',
    text: '#1F2937',
    background: '#FFFFFF'
  },

  // 品牌选项
  companyName: 'Zinses Rechner',
  reportTitle: 'Finanzanalyse Bericht',
  reportSubtitle: 'Berechnungsergebnisse und Projektionen',
  reportDate: new Date(),
  reportVersion: '1.0',
  reportAuthor: 'Zinses Rechner System',
  reportDepartment: 'Finanzanalyse',

  // 页面选项
  includePageNumbers: true,
  includeTOC: true,
  includeIndex: false,
  includeWatermark: false,
  watermarkText: 'VERTRAULICH',
  watermarkOpacity: 0.1,

  // 高级选项
  includeInteractiveElements: false,
  includeBookmarks: true,
  includeHyperlinks: true,
  optimizeForPrint: false,
  optimizeForScreen: true,
  includeAccessibilityFeatures: true,

  // 本地化选项
  language: 'de',
  dateFormat: 'DD.MM.YYYY',
  numberFormat: 'de-DE',
  currencySymbol: '€'
}

/**
 * Chart.js PDF导出器类
 */
export class ChartPDFExporter {
  private pdfEngine: PDFExportEngine

  constructor() {
    this.pdfEngine = PDFExportEngine.getInstance()
  }

  /**
   * 导出Chart.js图表为PDF报告
   */
  public async exportChart(
    chart: Chart,
    calculationData?: any,
    config: Partial<ChartPDFExportConfig> = {}
  ): Promise<ChartPDFExportResult> {
    const fullConfig = { ...DEFAULT_CHART_PDF_CONFIG, ...config }

    // 创建PDF文档
    const pdf = await this.createReportPDF(fullConfig)

    // 添加封面页
    await this.addCoverPage(pdf, chart, fullConfig)

    // 添加目录（如果启用）
    if (fullConfig.includeTOC) {
      await this.addTableOfContents(pdf, fullConfig)
    }

    // 添加执行摘要
    if (fullConfig.includeExecutiveSummary) {
      await this.addExecutiveSummary(pdf, chart, calculationData, fullConfig)
    }

    // 添加图表页面
    await this.addChartPage(pdf, chart, fullConfig)

    // 添加数据表格
    if (fullConfig.includeDataTable) {
      await this.addDataTable(pdf, chart, calculationData, fullConfig)
    }

    // 添加计算详情
    if (fullConfig.includeCalculationDetails) {
      await this.addCalculationDetails(pdf, calculationData, fullConfig)
    }

    // 添加假设条件
    if (fullConfig.includeAssumptions) {
      await this.addAssumptions(pdf, calculationData, fullConfig)
    }

    // 添加免责声明
    if (fullConfig.includeDisclaimer) {
      await this.addDisclaimer(pdf, fullConfig)
    }

    // 添加页眉页脚到所有页面
    this.addHeaderFooterToAllPages(pdf, fullConfig)

    // 应用压缩
    if (fullConfig.compression.enabled) {
      this.applyCompression(pdf, fullConfig)
    }

    return this.finalizeReportPDFExport(pdf, fullConfig)
  }

  /**
   * 创建报告PDF文档
   */
  private async createReportPDF(config: ChartPDFExportConfig): Promise<any> {
    const pdf = {
      pages: [],
      metadata: config.metadata,
      pageSize: this.getPageDimensions(config),
      orientation: config.orientation,
      margins: config.margins,
      currentPage: 0,
      theme: config.theme,
      colorScheme: config.colorScheme
    }

    return pdf
  }

  /**
   * 添加封面页
   */
  private async addCoverPage(
    pdf: any,
    chart: Chart,
    config: ChartPDFExportConfig
  ): Promise<void> {
    this.addNewPage(pdf, config)

    const pageWidth = pdf.pageSize.width
    const pageHeight = pdf.pageSize.height
    const centerX = pageWidth / 2

    // 添加logo（如果有）
    if (config.logo) {
      this.addImageToPDF(pdf, config.logo, {
        x: centerX - 50,
        y: 50,
        width: 100,
        height: 50
      })
    }

    // 添加公司名称
    if (config.companyName) {
      this.addTextToPDF(pdf, config.companyName, {
        x: centerX,
        y: 120,
        align: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: this.getThemeColor('primary', config)
      })
    }

    // 添加报告标题
    this.addTextToPDF(pdf, config.reportTitle || 'Finanzanalyse Bericht', {
      x: centerX,
      y: 180,
      align: 'center',
      fontSize: 28,
      fontWeight: 'bold',
      color: this.getThemeColor('heading', config)
    })

    // 添加副标题
    if (config.reportSubtitle) {
      this.addTextToPDF(pdf, config.reportSubtitle, {
        x: centerX,
        y: 220,
        align: 'center',
        fontSize: 16,
        color: this.getThemeColor('subheading', config)
      })
    }

    // 添加图表类型信息
    const chartType = this.getChartTypeDisplayName(chart.config.type || 'unknown')
    this.addTextToPDF(pdf, `Diagrammtyp: ${chartType}`, {
      x: centerX,
      y: 280,
      align: 'center',
      fontSize: 14,
      color: this.getThemeColor('text', config)
    })

    // 添加数据集信息
    const datasetCount = chart.data.datasets.length
    const dataPointCount = chart.data.datasets.reduce((sum, dataset) => sum + (dataset.data?.length || 0), 0)

    this.addTextToPDF(pdf, `${datasetCount} Datensätze, ${dataPointCount} Datenpunkte`, {
      x: centerX,
      y: 310,
      align: 'center',
      fontSize: 12,
      color: this.getThemeColor('text', config)
    })

    // 添加生成日期
    const currentDate = new Date().toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    this.addTextToPDF(pdf, `Erstellt am ${currentDate}`, {
      x: centerX,
      y: pageHeight - 100,
      align: 'center',
      fontSize: 12,
      color: this.getThemeColor('muted', config)
    })
  }

  /**
   * 添加目录
   */
  private async addTableOfContents(
    pdf: any,
    config: ChartPDFExportConfig
  ): Promise<void> {
    this.addNewPage(pdf, config)

    // 标题
    this.addTextToPDF(pdf, 'Inhaltsverzeichnis', {
      x: config.margins.left,
      y: config.margins.top + 20,
      fontSize: 20,
      fontWeight: 'bold',
      color: this.getThemeColor('heading', config)
    })

    // 目录项
    const tocItems = [
      { title: 'Zusammenfassung', page: 3 },
      { title: 'Diagramm', page: 4 },
      { title: 'Datentabelle', page: 5 },
      { title: 'Berechnungsdetails', page: 6 },
      { title: 'Annahmen', page: 7 },
      { title: 'Haftungsausschluss', page: 8 }
    ]

    let yOffset = config.margins.top + 60

    tocItems.forEach(item => {
      this.addTextToPDF(pdf, item.title, {
        x: config.margins.left,
        y: yOffset,
        fontSize: 12,
        color: this.getThemeColor('text', config)
      })

      this.addTextToPDF(pdf, item.page.toString(), {
        x: pdf.pageSize.width - config.margins.right - 20,
        y: yOffset,
        align: 'right',
        fontSize: 12,
        color: this.getThemeColor('text', config)
      })

      yOffset += 25
    })
  }

  /**
   * 添加执行摘要
   */
  private async addExecutiveSummary(
    pdf: any,
    chart: Chart,
    calculationData: any,
    config: ChartPDFExportConfig
  ): Promise<void> {
    this.addNewPage(pdf, config)

    // 标题
    this.addTextToPDF(pdf, 'Zusammenfassung', {
      x: config.margins.left,
      y: config.margins.top + 20,
      fontSize: 20,
      fontWeight: 'bold',
      color: this.getThemeColor('heading', config)
    })

    let yOffset = config.margins.top + 60

    // 分析概述
    const summaryText = this.generateExecutiveSummary(chart, calculationData)
    const lines = this.wrapText(summaryText, pdf.pageSize.width - config.margins.left - config.margins.right, 12)

    lines.forEach(line => {
      this.addTextToPDF(pdf, line, {
        x: config.margins.left,
        y: yOffset,
        fontSize: 12,
        color: this.getThemeColor('text', config)
      })
      yOffset += 18
    })

    // 关键指标
    if (calculationData) {
      yOffset += 20

      this.addTextToPDF(pdf, 'Wichtige Kennzahlen:', {
        x: config.margins.left,
        y: yOffset,
        fontSize: 14,
        fontWeight: 'bold',
        color: this.getThemeColor('subheading', config)
      })

      yOffset += 30

      const keyMetrics = this.extractKeyMetrics(calculationData)
      keyMetrics.forEach(metric => {
        this.addTextToPDF(pdf, `${metric.label}:`, {
          x: config.margins.left,
          y: yOffset,
          fontSize: 12,
          fontWeight: 'bold',
          color: this.getThemeColor('text', config)
        })

        this.addTextToPDF(pdf, metric.value, {
          x: config.margins.left + 150,
          y: yOffset,
          fontSize: 12,
          color: this.getThemeColor('text', config)
        })

        yOffset += 20
      })
    }
  }

  /**
   * 添加图表页面
   */
  private async addChartPage(
    pdf: any,
    chart: Chart,
    config: ChartPDFExportConfig
  ): Promise<void> {
    this.addNewPage(pdf, config)

    // 页面标题
    const chartTitle = config.chartTitle || chart.options.plugins?.title?.text || 'Diagramm'
    this.addTextToPDF(pdf, chartTitle as string, {
      x: config.margins.left,
      y: config.margins.top + 20,
      fontSize: 18,
      fontWeight: 'bold',
      color: this.getThemeColor('heading', config)
    })

    // 图表描述
    if (config.chartDescription) {
      const descLines = this.wrapText(
        config.chartDescription,
        pdf.pageSize.width - config.margins.left - config.margins.right,
        11
      )

      let yOffset = config.margins.top + 50
      descLines.forEach(line => {
        this.addTextToPDF(pdf, line, {
          x: config.margins.left,
          y: yOffset,
          fontSize: 11,
          color: this.getThemeColor('text', config)
        })
        yOffset += 16
      })
    }

    // 添加图表
    const chartPlacement = this.calculateChartPlacement(pdf, chart.canvas, config)
    const imageData = chart.canvas.toDataURL('image/png', config.compression.imageQuality)

    this.addImageToPDF(pdf, imageData, chartPlacement)

    // 添加图表说明
    const caption = this.generateChartCaption(chart)
    if (caption) {
      this.addTextToPDF(pdf, caption, {
        x: chartPlacement.x + chartPlacement.width / 2,
        y: chartPlacement.y + chartPlacement.height + 15,
        align: 'center',
        fontSize: 10,
        color: this.getThemeColor('muted', config)
      })
    }
  }

  /**
   * 添加数据表格
   */
  private async addDataTable(
    pdf: any,
    chart: Chart,
    calculationData: any,
    config: ChartPDFExportConfig
  ): Promise<void> {
    this.addNewPage(pdf, config)

    // 标题
    this.addTextToPDF(pdf, 'Datentabelle', {
      x: config.margins.left,
      y: config.margins.top + 20,
      fontSize: 18,
      fontWeight: 'bold',
      color: this.getThemeColor('heading', config)
    })

    // 生成表格数据
    const tableData = this.generateTableData(chart, calculationData, config)

    // 绘制表格
    this.drawTable(pdf, tableData, {
      x: config.margins.left,
      y: config.margins.top + 60,
      width: pdf.pageSize.width - config.margins.left - config.margins.right,
      config
    })
  }

  /**
   * 添加计算详情
   */
  private async addCalculationDetails(
    pdf: any,
    calculationData: any,
    config: ChartPDFExportConfig
  ): Promise<void> {
    if (!calculationData) return

    this.addNewPage(pdf, config)

    // 标题
    this.addTextToPDF(pdf, 'Berechnungsdetails', {
      x: config.margins.left,
      y: config.margins.top + 20,
      fontSize: 18,
      fontWeight: 'bold',
      color: this.getThemeColor('heading', config)
    })

    let yOffset = config.margins.top + 60

    // 输入参数
    this.addTextToPDF(pdf, 'Eingabeparameter:', {
      x: config.margins.left,
      y: yOffset,
      fontSize: 14,
      fontWeight: 'bold',
      color: this.getThemeColor('subheading', config)
    })

    yOffset += 30

    const inputParams = this.extractInputParameters(calculationData)
    inputParams.forEach(param => {
      this.addTextToPDF(pdf, `${param.label}:`, {
        x: config.margins.left,
        y: yOffset,
        fontSize: 11,
        color: this.getThemeColor('text', config)
      })

      this.addTextToPDF(pdf, param.value, {
        x: config.margins.left + 150,
        y: yOffset,
        fontSize: 11,
        fontWeight: 'bold',
        color: this.getThemeColor('text', config)
      })

      yOffset += 18
    })

    // 计算公式（如果启用）
    if (config.includeFormulas) {
      yOffset += 20

      this.addTextToPDF(pdf, 'Verwendete Formeln:', {
        x: config.margins.left,
        y: yOffset,
        fontSize: 14,
        fontWeight: 'bold',
        color: this.getThemeColor('subheading', config)
      })

      yOffset += 30

      const formulas = this.extractFormulas(calculationData)
      formulas.forEach(formula => {
        this.addTextToPDF(pdf, formula.name, {
          x: config.margins.left,
          y: yOffset,
          fontSize: 11,
          fontWeight: 'bold',
          color: this.getThemeColor('text', config)
        })

        yOffset += 18

        this.addTextToPDF(pdf, formula.formula, {
          x: config.margins.left + 10,
          y: yOffset,
          fontSize: 10,
          fontFamily: 'Courier, monospace',
          color: this.getThemeColor('code', config)
        })

        yOffset += 25
      })
    }
  }

  /**
   * 添加假设条件
   */
  private async addAssumptions(
    pdf: any,
    calculationData: any,
    config: ChartPDFExportConfig
  ): Promise<void> {
    this.addNewPage(pdf, config)

    // 标题
    this.addTextToPDF(pdf, 'Annahmen und Voraussetzungen', {
      x: config.margins.left,
      y: config.margins.top + 20,
      fontSize: 18,
      fontWeight: 'bold',
      color: this.getThemeColor('heading', config)
    })

    let yOffset = config.margins.top + 60

    const assumptions = this.generateAssumptions(calculationData)

    assumptions.forEach((assumption, index) => {
      this.addTextToPDF(pdf, `${index + 1}. ${assumption}`, {
        x: config.margins.left,
        y: yOffset,
        fontSize: 11,
        color: this.getThemeColor('text', config)
      })

      yOffset += 20
    })
  }

  /**
   * 添加免责声明
   */
  private async addDisclaimer(
    pdf: any,
    config: ChartPDFExportConfig
  ): Promise<void> {
    this.addNewPage(pdf, config)

    // 标题
    this.addTextToPDF(pdf, 'Haftungsausschluss', {
      x: config.margins.left,
      y: config.margins.top + 20,
      fontSize: 18,
      fontWeight: 'bold',
      color: this.getThemeColor('heading', config)
    })

    const disclaimerText = `
Diese Berechnung dient nur zu Informationszwecken und stellt keine Finanzberatung dar.
Die Ergebnisse basieren auf den eingegebenen Parametern und allgemeinen Annahmen.
Tatsächliche Ergebnisse können aufgrund von Marktbedingungen, Gebühren, Steuern und
anderen Faktoren abweichen. Konsultieren Sie einen qualifizierten Finanzberater für
spezifische Anlageentscheidungen.

Die Berechnungen wurden mit größter Sorgfalt erstellt, jedoch kann keine Gewähr für
die Richtigkeit, Vollständigkeit oder Aktualität der Informationen übernommen werden.
    `.trim()

    const lines = this.wrapText(
      disclaimerText,
      pdf.pageSize.width - config.margins.left - config.margins.right,
      11
    )

    let yOffset = config.margins.top + 60

    lines.forEach(line => {
      this.addTextToPDF(pdf, line, {
        x: config.margins.left,
        y: yOffset,
        fontSize: 11,
        color: this.getThemeColor('text', config)
      })
      yOffset += 16
    })
  }

  // 辅助方法
  private getPageDimensions(config: ChartPDFExportConfig): { width: number; height: number } {
    const sizes = {
      A4: { width: 210, height: 297 },
      A3: { width: 297, height: 420 },
      Letter: { width: 216, height: 279 }
    }

    const dimensions = sizes[config.pageSize as keyof typeof sizes] || sizes.A4

    if (config.orientation === 'landscape') {
      return { width: dimensions.height, height: dimensions.width }
    }

    return dimensions
  }

  private addNewPage(pdf: any, config: ChartPDFExportConfig): void {
    const page = {
      elements: [],
      pageNumber: pdf.pages.length + 1,
      dimensions: pdf.pageSize,
      margins: config.margins
    }

    pdf.pages.push(page)
    pdf.currentPage = pdf.pages.length - 1
  }

  private addTextToPDF(pdf: any, text: string, options: any): void {
    const currentPage = pdf.pages[pdf.currentPage]
    currentPage.elements.push({
      type: 'text',
      text,
      ...options
    })
  }

  private addImageToPDF(pdf: any, imageData: string, placement: any): void {
    const currentPage = pdf.pages[pdf.currentPage]
    currentPage.elements.push({
      type: 'image',
      data: imageData,
      ...placement
    })
  }

  private getThemeColor(type: string, config: ChartPDFExportConfig): string {
    const themes = {
      professional: {
        primary: '#1f2937',
        heading: '#111827',
        subheading: '#374151',
        text: '#4b5563',
        muted: '#9ca3af',
        code: '#6b7280'
      },
      modern: {
        primary: '#3b82f6',
        heading: '#1e40af',
        subheading: '#3730a3',
        text: '#1f2937',
        muted: '#6b7280',
        code: '#4338ca'
      },
      classic: {
        primary: '#000000',
        heading: '#000000',
        subheading: '#333333',
        text: '#444444',
        muted: '#666666',
        code: '#555555'
      },
      minimal: {
        primary: '#374151',
        heading: '#111827',
        subheading: '#4b5563',
        text: '#6b7280',
        muted: '#9ca3af',
        code: '#6b7280'
      }
    }

    const theme = themes[config.theme as keyof typeof themes] || themes.professional
    return theme[type as keyof typeof theme] || theme.text
  }

  private getChartTypeDisplayName(type: string): string {
    const names = {
      line: 'Liniendiagramm',
      bar: 'Balkendiagramm',
      pie: 'Kreisdiagramm',
      doughnut: 'Ringdiagramm',
      scatter: 'Streudiagramm',
      area: 'Flächendiagramm'
    }
    return names[type as keyof typeof names] || type
  }

  private generateExecutiveSummary(chart: Chart, calculationData: any): string {
    const chartType = this.getChartTypeDisplayName(chart.config.type || 'unknown')
    const datasetCount = chart.data.datasets.length
    const dataPointCount = chart.data.datasets.reduce((sum, dataset) => sum + (dataset.data?.length || 0), 0)

    return `Diese Analyse präsentiert die Ergebnisse einer Finanzberechnung in Form eines ${chartType}s.
Die Darstellung umfasst ${datasetCount} Datensätze mit insgesamt ${dataPointCount} Datenpunkten.
Die Berechnung wurde basierend auf den bereitgestellten Eingabeparametern durchgeführt und
zeigt die prognostizierten Entwicklungen über den gewählten Zeitraum.`
  }

  private extractKeyMetrics(calculationData: any): Array<{ label: string; value: string }> {
    // 简化实现，实际应该从calculationData中提取关键指标
    return [
      { label: 'Anfangskapital', value: '€ 10.000' },
      { label: 'Zinssatz', value: '5,0% p.a.' },
      { label: 'Laufzeit', value: '10 Jahre' },
      { label: 'Endkapital', value: '€ 16.289' },
      { label: 'Gesamtzinsen', value: '€ 6.289' }
    ]
  }

  private calculateChartPlacement(pdf: any, canvas: HTMLCanvasElement, config: ChartPDFExportConfig): any {
    const pageWidth = pdf.pageSize.width
    const pageHeight = pdf.pageSize.height
    const margins = config.margins

    const availableWidth = pageWidth - margins.left - margins.right
    const availableHeight = pageHeight - margins.top - margins.bottom - 100 // 为标题和说明留空间

    // 根据配置调整图表大小
    const sizeMultipliers = {
      small: 0.6,
      medium: 0.8,
      large: 1.0,
      'full-width': 1.0
    }

    const multiplier = sizeMultipliers[config.chartSize || 'large']
    let width = availableWidth * multiplier
    let height = width * (canvas.height / canvas.width)

    if (height > availableHeight) {
      height = availableHeight
      width = height * (canvas.width / canvas.height)
    }

    // 根据位置配置调整位置
    let x = margins.left
    let y = margins.top + 80

    switch (config.chartPosition) {
      case 'center':
        x = margins.left + (availableWidth - width) / 2
        y = margins.top + 80 + (availableHeight - height) / 2
        break
      case 'bottom':
        x = margins.left + (availableWidth - width) / 2
        y = pageHeight - margins.bottom - height - 50
        break
    }

    return { x, y, width, height }
  }

  private generateChartCaption(chart: Chart): string {
    const title = chart.options.plugins?.title?.text
    if (title) {
      return `Abbildung: ${title}`
    }

    const chartType = this.getChartTypeDisplayName(chart.config.type || 'unknown')
    return `Abbildung: ${chartType} der Berechnungsergebnisse`
  }

  private generateTableData(chart: Chart, calculationData: any, config: ChartPDFExportConfig): any {
    // 简化实现，实际应该从chart和calculationData生成表格数据
    return {
      headers: ['Jahr', 'Kapital', 'Zinsen', 'Gesamtkapital'],
      rows: [
        ['1', '€ 10.000', '€ 500', '€ 10.500'],
        ['2', '€ 10.500', '€ 525', '€ 11.025'],
        ['3', '€ 11.025', '€ 551', '€ 11.576'],
        ['4', '€ 11.576', '€ 579', '€ 12.155'],
        ['5', '€ 12.155', '€ 608', '€ 12.763']
      ]
    }
  }

  private drawTable(pdf: any, tableData: any, options: any): void {
    // 简化实现，实际需要绘制完整的表格
    let yOffset = options.y

    // 绘制表头
    tableData.headers.forEach((header: string, index: number) => {
      this.addTextToPDF(pdf, header, {
        x: options.x + index * 100,
        y: yOffset,
        fontSize: 11,
        fontWeight: 'bold',
        color: this.getThemeColor('heading', options.config)
      })
    })

    yOffset += 25

    // 绘制数据行
    tableData.rows.forEach((row: string[]) => {
      row.forEach((cell: string, index: number) => {
        this.addTextToPDF(pdf, cell, {
          x: options.x + index * 100,
          y: yOffset,
          fontSize: 10,
          color: this.getThemeColor('text', options.config)
        })
      })
      yOffset += 20
    })
  }

  private extractInputParameters(calculationData: any): Array<{ label: string; value: string }> {
    // 简化实现
    return [
      { label: 'Anfangskapital', value: '€ 10.000' },
      { label: 'Monatliche Einzahlung', value: '€ 200' },
      { label: 'Zinssatz', value: '5,0% p.a.' },
      { label: 'Laufzeit', value: '10 Jahre' }
    ]
  }

  private extractFormulas(calculationData: any): Array<{ name: string; formula: string }> {
    return [
      {
        name: 'Zinseszinsformel',
        formula: 'K_n = K_0 * (1 + i)^n'
      },
      {
        name: 'Rentenformel',
        formula: 'K_n = R * ((1 + i)^n - 1) / i'
      }
    ]
  }

  private generateAssumptions(calculationData: any): string[] {
    return [
      'Die Zinssätze bleiben über die gesamte Laufzeit konstant.',
      'Es werden keine Gebühren oder Kosten berücksichtigt.',
      'Steuern auf Kapitalerträge sind nicht eingerechnet.',
      'Die Einzahlungen erfolgen regelmäßig zum Monatsende.',
      'Es erfolgen keine vorzeitigen Entnahmen.',
      'Die Inflation wird nicht berücksichtigt.'
    ]
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    // 简化的文本换行实现
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    const avgCharWidth = fontSize * 0.6 // 近似字符宽度
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth)

    words.forEach(word => {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    })

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  private addHeaderFooterToAllPages(pdf: any, config: ChartPDFExportConfig): void {
    // 简化实现
    pdf.pages.forEach((page: any, index: number) => {
      if (config.layout.includeHeader && config.layout.headerText) {
        page.elements.push({
          type: 'text',
          text: config.layout.headerText,
          x: pdf.pageSize.width / 2,
          y: config.margins.top / 2,
          align: 'center',
          fontSize: 10,
          color: this.getThemeColor('muted', config)
        })
      }

      if (config.layout.includeFooter && config.includePageNumbers) {
        page.elements.push({
          type: 'text',
          text: `Seite ${index + 1} von ${pdf.pages.length}`,
          x: pdf.pageSize.width - config.margins.right,
          y: pdf.pageSize.height - config.margins.bottom / 2,
          align: 'right',
          fontSize: 10,
          color: this.getThemeColor('muted', config)
        })
      }
    })
  }

  private applyCompression(pdf: any, config: ChartPDFExportConfig): void {
    pdf.compression = {
      enabled: true,
      level: config.compression.level,
      imageQuality: config.compression.imageQuality
    }
  }

  private finalizeReportPDFExport(pdf: any, config: ChartPDFExportConfig): ChartPDFExportResult {
    // 生成PDF内容（简化实现）
    const pdfContent = this.generatePDFContent(pdf)
    const blob = new Blob([pdfContent], { type: 'application/pdf' })

    const reportInfo = {
      title: config.reportTitle || 'Finanzanalyse Bericht',
      sections: this.countSections(config),
      charts: 1,
      tables: config.includeDataTable ? 1 : 0,
      totalPages: pdf.pages.length
    }

    return {
      blob,
      size: blob.size,
      pageCount: pdf.pages.length,
      dimensions: pdf.pageSize,
      metadata: {
        title: config.metadata?.title || 'Untitled',
        author: config.metadata?.author || 'Unknown',
        creationDate: new Date(),
        compressionRatio: 1.0
      },
      reportInfo
    }
  }

  private generatePDFContent(pdf: any): ArrayBuffer {
    // 简化实现，实际需要生成真实的PDF二进制数据
    const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count ${pdf.pages.length}
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${pdf.pageSize.width} ${pdf.pageSize.height}]
>>
endobj

xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000074 00000 n
0000000120 00000 n
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
${content.length}
%%EOF`

    return new TextEncoder().encode(content).buffer
  }

  private countSections(config: ChartPDFExportConfig): number {
    let sections = 1 // 图表页面

    if (config.includeExecutiveSummary) sections++
    if (config.includeDataTable) sections++
    if (config.includeCalculationDetails) sections++
    if (config.includeAssumptions) sections++
    if (config.includeDisclaimer) sections++

    return sections
  }
}

// 导出单例实例
export const chartPDFExporter = new ChartPDFExporter()
