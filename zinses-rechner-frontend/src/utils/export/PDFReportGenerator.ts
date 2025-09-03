/**
 * PDF报告生成器
 * 基于模板生成专业的PDF报告，包含图表、数据表格、分析内容等
 */

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { Chart } from 'chart.js'
import type { ChartPDFExportConfig } from './ChartPDFExporter'
import type { PDFTemplateConfig } from './PDFReportTemplateManager'
import { pdfReportTemplateManager } from './PDFReportTemplateManager'

// 报告数据接口
export interface ReportData {
  title: string
  subtitle?: string
  summary: {
    keyMetrics: Array<{ label: string; value: string; change?: string }>
    highlights: string[]
    recommendations: string[]
  }
  calculations: {
    inputs: Record<string, any>
    outputs: Record<string, any>
    formulas?: Record<string, string>
    assumptions: string[]
  }
  charts: Array<{
    chart: Chart
    title: string
    description?: string
    insights?: string[]
  }>
  tables: Array<{
    title: string
    headers: string[]
    rows: string[][]
    footer?: string
  }>
  riskAnalysis?: {
    factors: Array<{ factor: string; impact: 'low' | 'medium' | 'high'; description: string }>
    mitigation: string[]
  }
  methodology?: {
    approach: string
    dataSources: string[]
    limitations: string[]
  }
}

// PDF生成结果
export interface PDFGenerationResult {
  success: boolean
  pdf?: jsPDF
  blob?: Blob
  filename: string
  pageCount: number
  fileSize: number
  generationTime: number
  errors?: string[]
  warnings?: string[]
}

/**
 * PDF报告生成器类
 */
export class PDFReportGenerator {
  private static instance: PDFReportGenerator
  private pdf: jsPDF | null = null
  private currentY: number = 0
  private pageHeight: number = 0
  private pageWidth: number = 0
  private margins: { top: number; right: number; bottom: number; left: number } = {
    top: 25, right: 20, bottom: 25, left: 20
  }

  public static getInstance(): PDFReportGenerator {
    if (!PDFReportGenerator.instance) {
      PDFReportGenerator.instance = new PDFReportGenerator()
    }
    return PDFReportGenerator.instance
  }

  /**
   * 生成PDF报告
   */
  public async generateReport(
    data: ReportData,
    template: PDFTemplateConfig,
    options: Partial<ChartPDFExportConfig> = {}
  ): Promise<PDFGenerationResult> {
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 合并配置
      const config = { ...template.config, ...options }
      
      // 初始化PDF
      this.initializePDF(config)
      
      // 生成报告内容
      await this.generateReportContent(data, config)
      
      // 添加页脚和页码
      this.addFooters(config)
      
      // 生成结果
      const blob = this.pdf!.output('blob')
      const filename = this.generateFilename(data.title, config)
      
      return {
        success: true,
        pdf: this.pdf!,
        blob,
        filename,
        pageCount: this.pdf!.getNumberOfPages(),
        fileSize: blob.size,
        generationTime: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } catch (error) {
      errors.push(`报告生成失败: ${(error as Error).message}`)
      
      return {
        success: false,
        filename: this.generateFilename(data.title, template.config),
        pageCount: 0,
        fileSize: 0,
        generationTime: Date.now() - startTime,
        errors
      }
    }
  }

  /**
   * 初始化PDF文档
   */
  private initializePDF(config: ChartPDFExportConfig): void {
    this.pdf = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: config.pageSize || 'A4'
    })

    // 设置页面尺寸和边距
    this.pageHeight = this.pdf.internal.pageSize.height
    this.pageWidth = this.pdf.internal.pageSize.width
    this.margins = config.margins || this.margins
    this.currentY = this.margins.top

    // 设置文档属性
    if (config.metadata) {
      this.pdf.setProperties({
        title: config.metadata.title,
        author: config.metadata.author,
        subject: config.metadata.subject,
        creator: config.metadata.creator || 'Zinses Rechner PDF Generator'
      })
    }

    // 设置字体
    this.pdf.setFont(config.styling?.fontFamily?.split(',')[0] || 'Arial')
    this.pdf.setFontSize(config.styling?.fontSize || 11)
    this.pdf.setTextColor(config.styling?.textColor || '#333333')
  }

  /**
   * 生成报告内容
   */
  private async generateReportContent(data: ReportData, config: ChartPDFExportConfig): Promise<void> {
    // 1. 封面页
    this.addCoverPage(data, config)
    
    // 2. 目录（如果启用）
    if (config.includeTOC) {
      this.addTableOfContents(data, config)
    }
    
    // 3. 执行摘要
    if (config.includeExecutiveSummary) {
      this.addExecutiveSummary(data, config)
    }
    
    // 4. 图表部分
    await this.addChartsSection(data, config)
    
    // 5. 数据表格
    if (config.includeDataTable) {
      this.addDataTables(data, config)
    }
    
    // 6. 计算详情
    if (config.includeCalculationDetails) {
      this.addCalculationDetails(data, config)
    }
    
    // 7. 风险分析
    if (config.includeRiskAnalysis && data.riskAnalysis) {
      this.addRiskAnalysis(data, config)
    }
    
    // 8. 方法论
    if (config.includeMethodology && data.methodology) {
      this.addMethodology(data, config)
    }
    
    // 9. 建议
    if (config.includeRecommendations) {
      this.addRecommendations(data, config)
    }
    
    // 10. 假设条件
    if (config.includeAssumptions) {
      this.addAssumptions(data, config)
    }
    
    // 11. 免责声明
    if (config.includeDisclaimer) {
      this.addDisclaimer(config)
    }
    
    // 12. 附录
    if (config.includeAppendix) {
      this.addAppendix(data, config)
    }
  }

  /**
   * 添加封面页
   */
  private addCoverPage(data: ReportData, config: ChartPDFExportConfig): void {
    // 公司Logo（如果有）
    if (config.logo) {
      // 这里应该添加logo图片
      this.currentY += 20
    }

    // 报告标题
    this.pdf!.setFontSize(24)
    this.pdf!.setFont('Arial', 'bold')
    this.addText(data.title, { align: 'center', y: this.currentY + 40 })
    
    // 副标题
    if (data.subtitle) {
      this.pdf!.setFontSize(16)
      this.pdf!.setFont('Arial', 'normal')
      this.addText(data.subtitle, { align: 'center', y: this.currentY + 20 })
    }

    // 公司信息
    this.currentY = this.pageHeight - 80
    this.pdf!.setFontSize(12)
    this.addText(config.companyName || 'Zinses Rechner', { align: 'center' })
    
    // 报告日期
    const dateStr = config.reportDate ? 
      config.reportDate.toLocaleDateString('de-DE') : 
      new Date().toLocaleDateString('de-DE')
    this.addText(`Erstellt am: ${dateStr}`, { align: 'center', y: this.currentY + 10 })
    
    // 版本信息
    if (config.reportVersion) {
      this.addText(`Version: ${config.reportVersion}`, { align: 'center', y: this.currentY + 10 })
    }

    this.addNewPage()
  }

  /**
   * 添加目录
   */
  private addTableOfContents(data: ReportData, config: ChartPDFExportConfig): void {
    this.addSectionTitle('Inhaltsverzeichnis')
    
    const tocItems = [
      { title: 'Zusammenfassung', page: 3 },
      { title: 'Diagramme und Grafiken', page: 4 },
      { title: 'Datentabellen', page: 5 },
      { title: 'Berechnungsdetails', page: 6 },
      { title: 'Risikoanalyse', page: 7 },
      { title: 'Empfehlungen', page: 8 },
      { title: 'Annahmen', page: 9 },
      { title: 'Haftungsausschluss', page: 10 }
    ]

    this.pdf!.setFontSize(11)
    tocItems.forEach(item => {
      const y = this.currentY + 8
      this.pdf!.text(item.title, this.margins.left, y)
      this.pdf!.text(item.page.toString(), this.pageWidth - this.margins.right - 10, y, { align: 'right' })
      this.currentY = y
    })

    this.addNewPage()
  }

  /**
   * 添加执行摘要
   */
  private addExecutiveSummary(data: ReportData, config: ChartPDFExportConfig): void {
    this.addSectionTitle('Zusammenfassung')
    
    // 关键指标
    if (data.summary.keyMetrics.length > 0) {
      this.addSubsectionTitle('Wichtige Kennzahlen')
      
      data.summary.keyMetrics.forEach(metric => {
        const text = `${metric.label}: ${metric.value}`
        this.addText(text, { bullet: true })
      })
      
      this.currentY += 10
    }
    
    // 亮点
    if (data.summary.highlights.length > 0) {
      this.addSubsectionTitle('Wichtige Erkenntnisse')
      
      data.summary.highlights.forEach(highlight => {
        this.addText(highlight, { bullet: true })
      })
    }
  }

  /**
   * 添加图表部分
   */
  private async addChartsSection(data: ReportData, config: ChartPDFExportConfig): Promise<void> {
    if (data.charts.length === 0) return

    this.addSectionTitle('Diagramme und Grafiken')
    
    for (const chartData of data.charts) {
      // 图表标题
      this.addSubsectionTitle(chartData.title)
      
      // 图表描述
      if (chartData.description) {
        this.addText(chartData.description)
        this.currentY += 5
      }
      
      // 添加图表图像
      await this.addChartImage(chartData.chart, config)
      
      // 图表洞察
      if (chartData.insights && chartData.insights.length > 0) {
        this.addText('Erkenntnisse:', { bold: true })
        chartData.insights.forEach(insight => {
          this.addText(insight, { bullet: true })
        })
      }
      
      this.currentY += 15
      
      // 检查是否需要新页面
      if (this.currentY > this.pageHeight - 50) {
        this.addNewPage()
      }
    }
  }

  /**
   * 添加数据表格
   */
  private addDataTables(data: ReportData, config: ChartPDFExportConfig): void {
    if (data.tables.length === 0) return

    this.addSectionTitle('Datentabellen')
    
    data.tables.forEach(table => {
      this.addSubsectionTitle(table.title)
      
      // 使用autoTable插件添加表格
      ;(this.pdf as any).autoTable({
        head: [table.headers],
        body: table.rows,
        startY: this.currentY,
        margin: { left: this.margins.left, right: this.margins.right },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [59, 130, 246], // 蓝色背景
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // 浅灰色背景
        }
      })
      
      this.currentY = (this.pdf as any).lastAutoTable.finalY + 10
      
      // 表格脚注
      if (table.footer) {
        this.pdf!.setFontSize(8)
        this.addText(table.footer, { italic: true })
        this.pdf!.setFontSize(11)
      }
      
      this.currentY += 10
    })
  }

  /**
   * 添加计算详情
   */
  private addCalculationDetails(data: ReportData, config: ChartPDFExportConfig): void {
    this.addSectionTitle('Berechnungsdetails')
    
    // 输入参数
    this.addSubsectionTitle('Eingabeparameter')
    Object.entries(data.calculations.inputs).forEach(([key, value]) => {
      this.addText(`${key}: ${value}`, { bullet: true })
    })
    
    this.currentY += 10
    
    // 计算结果
    this.addSubsectionTitle('Berechnungsergebnisse')
    Object.entries(data.calculations.outputs).forEach(([key, value]) => {
      this.addText(`${key}: ${value}`, { bullet: true })
    })
    
    // 公式（如果包含）
    if (config.includeFormulas && data.calculations.formulas) {
      this.currentY += 10
      this.addSubsectionTitle('Verwendete Formeln')
      Object.entries(data.calculations.formulas).forEach(([name, formula]) => {
        this.addText(`${name}: ${formula}`, { monospace: true })
      })
    }
  }

  /**
   * 添加风险分析
   */
  private addRiskAnalysis(data: ReportData, config: ChartPDFExportConfig): void {
    if (!data.riskAnalysis) return

    this.addSectionTitle('Risikoanalyse')
    
    // 风险因素
    this.addSubsectionTitle('Identifizierte Risikofaktoren')
    data.riskAnalysis.factors.forEach(factor => {
      const riskLevel = factor.impact === 'high' ? 'HOCH' : 
                      factor.impact === 'medium' ? 'MITTEL' : 'NIEDRIG'
      this.addText(`${factor.factor} (${riskLevel}): ${factor.description}`, { bullet: true })
    })
    
    // 风险缓解措施
    if (data.riskAnalysis.mitigation.length > 0) {
      this.currentY += 10
      this.addSubsectionTitle('Risikominderungsmaßnahmen')
      data.riskAnalysis.mitigation.forEach(measure => {
        this.addText(measure, { bullet: true })
      })
    }
  }

  /**
   * 添加方法论
   */
  private addMethodology(data: ReportData, config: ChartPDFExportConfig): void {
    if (!data.methodology) return

    this.addSectionTitle('Methodik')
    
    this.addText('Ansatz:', { bold: true })
    this.addText(data.methodology.approach)
    
    this.currentY += 10
    this.addText('Datenquellen:', { bold: true })
    data.methodology.dataSources.forEach(source => {
      this.addText(source, { bullet: true })
    })
    
    if (data.methodology.limitations.length > 0) {
      this.currentY += 10
      this.addText('Einschränkungen:', { bold: true })
      data.methodology.limitations.forEach(limitation => {
        this.addText(limitation, { bullet: true })
      })
    }
  }

  /**
   * 添加建议
   */
  private addRecommendations(data: ReportData, config: ChartPDFExportConfig): void {
    if (data.summary.recommendations.length === 0) return

    this.addSectionTitle('Empfehlungen')
    
    data.summary.recommendations.forEach((recommendation, index) => {
      this.addText(`${index + 1}. ${recommendation}`)
      this.currentY += 5
    })
  }

  /**
   * 添加假设条件
   */
  private addAssumptions(data: ReportData, config: ChartPDFExportConfig): void {
    this.addSectionTitle('Annahmen')
    
    data.calculations.assumptions.forEach(assumption => {
      this.addText(assumption, { bullet: true })
    })
  }

  /**
   * 添加免责声明
   */
  private addDisclaimer(config: ChartPDFExportConfig): void {
    this.addSectionTitle('Haftungsausschluss')
    
    const disclaimer = `
Diese Analyse wurde mit dem Zinses Rechner erstellt und dient nur zu Informationszwecken. 
Die Berechnungen basieren auf den angegebenen Parametern und Annahmen. Tatsächliche Ergebnisse 
können abweichen. Es wird keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität 
der Informationen übernommen. Diese Analyse stellt keine Anlageberatung dar.
    `.trim()
    
    this.pdf!.setFontSize(9)
    this.addText(disclaimer, { italic: true })
    this.pdf!.setFontSize(11)
  }

  /**
   * 添加附录
   */
  private addAppendix(data: ReportData, config: ChartPDFExportConfig): void {
    this.addSectionTitle('Anhang')
    
    // 这里可以添加额外的技术细节、原始数据等
    this.addText('Zusätzliche technische Details und Rohdaten können auf Anfrage zur Verfügung gestellt werden.')
  }

  // 辅助方法

  private addSectionTitle(title: string): void {
    this.checkPageBreak(30)
    this.pdf!.setFontSize(16)
    this.pdf!.setFont('Arial', 'bold')
    this.addText(title)
    this.pdf!.setFontSize(11)
    this.pdf!.setFont('Arial', 'normal')
    this.currentY += 10
  }

  private addSubsectionTitle(title: string): void {
    this.checkPageBreak(20)
    this.pdf!.setFontSize(13)
    this.pdf!.setFont('Arial', 'bold')
    this.addText(title)
    this.pdf!.setFontSize(11)
    this.pdf!.setFont('Arial', 'normal')
    this.currentY += 5
  }

  private addText(text: string, options: {
    align?: 'left' | 'center' | 'right'
    y?: number
    bullet?: boolean
    bold?: boolean
    italic?: boolean
    monospace?: boolean
  } = {}): void {
    const y = options.y || this.currentY
    let x = this.margins.left

    if (options.bullet) {
      this.pdf!.text('•', x, y)
      x += 5
    }

    if (options.bold) this.pdf!.setFont('Arial', 'bold')
    if (options.italic) this.pdf!.setFont('Arial', 'italic')
    if (options.monospace) this.pdf!.setFont('Courier')

    const textOptions: any = {}
    if (options.align) textOptions.align = options.align

    this.pdf!.text(text, x, y, textOptions)

    // 重置字体
    this.pdf!.setFont('Arial', 'normal')

    if (!options.y) {
      this.currentY = y + 6
    }
  }

  private async addChartImage(chart: Chart, config: ChartPDFExportConfig): Promise<void> {
    try {
      const canvas = chart.canvas
      const imgData = canvas.toDataURL('image/png', 0.9)
      
      const imgWidth = this.pageWidth - this.margins.left - this.margins.right
      const imgHeight = (canvas.height / canvas.width) * imgWidth
      
      this.checkPageBreak(imgHeight + 10)
      
      this.pdf!.addImage(imgData, 'PNG', this.margins.left, this.currentY, imgWidth, imgHeight)
      this.currentY += imgHeight + 10
    } catch (error) {
      console.error('添加图表图像失败:', error)
      this.addText('图表加载失败', { italic: true })
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.addNewPage()
    }
  }

  private addNewPage(): void {
    this.pdf!.addPage()
    this.currentY = this.margins.top
  }

  private addFooters(config: ChartPDFExportConfig): void {
    const pageCount = this.pdf!.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf!.setPage(i)
      
      // 页码
      if (config.includePageNumbers) {
        this.pdf!.setFontSize(9)
        this.pdf!.text(
          `Seite ${i} von ${pageCount}`,
          this.pageWidth - this.margins.right,
          this.pageHeight - 10,
          { align: 'right' }
        )
      }
      
      // 水印
      if (config.includeWatermark && config.watermarkText) {
        this.pdf!.setFontSize(48)
        this.pdf!.setTextColor(200, 200, 200)
        this.pdf!.text(
          config.watermarkText,
          this.pageWidth / 2,
          this.pageHeight / 2,
          { align: 'center', angle: 45 }
        )
        this.pdf!.setTextColor(config.styling?.textColor || '#333333')
      }
    }
  }

  private generateFilename(title: string, config: ChartPDFExportConfig): string {
    const date = new Date().toISOString().split('T')[0]
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    return `${cleanTitle}_${date}.pdf`
  }
}

// 导出单例实例
export const pdfReportGenerator = PDFReportGenerator.getInstance()

// 便捷导出函数
export async function generateFinancialReport(
  data: ReportData,
  templateId: string = 'financial-analysis'
): Promise<PDFGenerationResult> {
  const template = pdfReportTemplateManager.getTemplate(templateId)
  return pdfReportGenerator.generateReport(data, template)
}
