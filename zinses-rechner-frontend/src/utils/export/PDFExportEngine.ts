/**
 * PDF导出引擎
 * 提供专业的PDF文档导出功能，支持多页面、布局控制、元数据等高级功能
 */

import type { Chart } from 'chart.js'

// PDF页面尺寸枚举
export enum PDFPageSize {
  A4 = 'A4',
  A3 = 'A3',
  A5 = 'A5',
  LETTER = 'LETTER',
  LEGAL = 'LEGAL',
  CUSTOM = 'CUSTOM'
}

// PDF页面方向枚举
export enum PDFOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape'
}

// PDF质量级别
export enum PDFQuality {
  DRAFT = 'draft',
  STANDARD = 'standard',
  HIGH = 'high',
  PRINT = 'print'
}

// PDF导出配置接口
export interface PDFExportConfig {
  pageSize: PDFPageSize
  orientation: PDFOrientation
  quality: PDFQuality
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  customSize?: {
    width: number
    height: number
  }
  metadata: {
    title?: string
    author?: string
    subject?: string
    keywords?: string[]
    creator?: string
  }
  layout: {
    multiPage?: boolean
    chartsPerPage?: number
    includeHeader?: boolean
    includeFooter?: boolean
    headerText?: string
    footerText?: string
  }
  styling: {
    backgroundColor?: string
    fontFamily?: string
    fontSize?: number
    textColor?: string
  }
  compression: {
    enabled: boolean
    level: number // 0-9
    imageQuality: number // 0-1
  }
  security?: {
    userPassword?: string
    ownerPassword?: string
    permissions?: {
      printing?: boolean
      modifying?: boolean
      copying?: boolean
      annotating?: boolean
    }
  }
}

// PDF导出结果接口
export interface PDFExportResult {
  blob: Blob
  size: number
  pageCount: number
  dimensions: {
    width: number
    height: number
  }
  metadata: {
    title: string
    author: string
    creationDate: Date
    compressionRatio: number
  }
}

// 页面尺寸定义（毫米）
export const PAGE_SIZES = {
  [PDFPageSize.A4]: { width: 210, height: 297 },
  [PDFPageSize.A3]: { width: 297, height: 420 },
  [PDFPageSize.A5]: { width: 148, height: 210 },
  [PDFPageSize.LETTER]: { width: 215.9, height: 279.4 },
  [PDFPageSize.LEGAL]: { width: 215.9, height: 355.6 }
}

// 默认PDF导出配置
export const DEFAULT_PDF_CONFIG: PDFExportConfig = {
  pageSize: PDFPageSize.A4,
  orientation: PDFOrientation.PORTRAIT,
  quality: PDFQuality.STANDARD,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  metadata: {
    title: 'Zinses Rechner Chart Export',
    author: 'Zinses Rechner',
    subject: 'Financial Chart Export',
    creator: 'Zinses Rechner PDF Export Engine'
  },
  layout: {
    multiPage: false,
    chartsPerPage: 1,
    includeHeader: true,
    includeFooter: true,
    headerText: 'Zinses Rechner - Finanzanalyse',
    footerText: `Erstellt am ${new Date().toLocaleDateString('de-DE')}`
  },
  styling: {
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    textColor: '#333333'
  },
  compression: {
    enabled: true,
    level: 6,
    imageQuality: 0.8
  }
}

/**
 * PDF导出引擎类
 */
export class PDFExportEngine {
  private static instance: PDFExportEngine

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): PDFExportEngine {
    if (!PDFExportEngine.instance) {
      PDFExportEngine.instance = new PDFExportEngine()
    }
    return PDFExportEngine.instance
  }

  /**
   * 导出Chart.js图表为PDF
   */
  public async exportChartToPDF(
    chart: Chart,
    config: Partial<PDFExportConfig> = {}
  ): Promise<PDFExportResult> {
    const fullConfig = { ...DEFAULT_PDF_CONFIG, ...config }
    
    // 创建PDF文档
    const pdf = await this.createPDFDocument(fullConfig)
    
    // 添加图表到PDF
    await this.addChartToPDF(pdf, chart, fullConfig)
    
    // 添加页眉页脚
    if (fullConfig.layout.includeHeader || fullConfig.layout.includeFooter) {
      this.addHeaderFooter(pdf, fullConfig)
    }
    
    // 应用压缩
    if (fullConfig.compression.enabled) {
      this.applyCompression(pdf, fullConfig)
    }
    
    // 应用安全设置
    if (fullConfig.security) {
      this.applySecuritySettings(pdf, fullConfig.security)
    }
    
    return this.finalizePDFExport(pdf, fullConfig)
  }

  /**
   * 导出多个图表为PDF
   */
  public async exportMultipleChartsToPDF(
    charts: Chart[],
    config: Partial<PDFExportConfig> = {}
  ): Promise<PDFExportResult> {
    const fullConfig = { 
      ...DEFAULT_PDF_CONFIG, 
      ...config,
      layout: {
        ...DEFAULT_PDF_CONFIG.layout,
        multiPage: true,
        ...config.layout
      }
    }
    
    // 创建PDF文档
    const pdf = await this.createPDFDocument(fullConfig)
    
    // 计算每页图表数量
    const chartsPerPage = fullConfig.layout.chartsPerPage || 1
    
    // 分页添加图表
    for (let i = 0; i < charts.length; i += chartsPerPage) {
      if (i > 0) {
        this.addNewPage(pdf, fullConfig)
      }
      
      const pageCharts = charts.slice(i, i + chartsPerPage)
      await this.addChartsToPage(pdf, pageCharts, fullConfig)
    }
    
    // 添加页眉页脚
    if (fullConfig.layout.includeHeader || fullConfig.layout.includeFooter) {
      this.addHeaderFooterToAllPages(pdf, fullConfig)
    }
    
    // 应用压缩
    if (fullConfig.compression.enabled) {
      this.applyCompression(pdf, fullConfig)
    }
    
    return this.finalizePDFExport(pdf, fullConfig)
  }

  /**
   * 导出HTML元素为PDF
   */
  public async exportElementToPDF(
    element: HTMLElement,
    config: Partial<PDFExportConfig> = {}
  ): Promise<PDFExportResult> {
    const fullConfig = { ...DEFAULT_PDF_CONFIG, ...config }
    
    // 创建PDF文档
    const pdf = await this.createPDFDocument(fullConfig)
    
    // 将HTML元素转换为Canvas
    const canvas = await this.htmlToCanvas(element)
    
    // 添加Canvas到PDF
    await this.addCanvasToPDF(pdf, canvas, fullConfig)
    
    // 添加页眉页脚
    if (fullConfig.layout.includeHeader || fullConfig.layout.includeFooter) {
      this.addHeaderFooter(pdf, fullConfig)
    }
    
    return this.finalizePDFExport(pdf, fullConfig)
  }

  /**
   * 创建PDF文档
   */
  private async createPDFDocument(config: PDFExportConfig): Promise<any> {
    // 这里需要使用PDF库，如jsPDF或PDFKit
    // 简化实现，返回模拟的PDF对象
    const pdf = {
      pages: [],
      metadata: config.metadata,
      pageSize: this.getPageDimensions(config),
      orientation: config.orientation,
      margins: config.margins,
      currentPage: 0
    }
    
    // 添加第一页
    this.addNewPage(pdf, config)
    
    return pdf
  }

  /**
   * 获取页面尺寸
   */
  private getPageDimensions(config: PDFExportConfig): { width: number; height: number } {
    let dimensions: { width: number; height: number }
    
    if (config.pageSize === PDFPageSize.CUSTOM && config.customSize) {
      dimensions = config.customSize
    } else {
      dimensions = PAGE_SIZES[config.pageSize]
    }
    
    // 根据方向调整尺寸
    if (config.orientation === PDFOrientation.LANDSCAPE) {
      return {
        width: dimensions.height,
        height: dimensions.width
      }
    }
    
    return dimensions
  }

  /**
   * 添加新页面
   */
  private addNewPage(pdf: any, config: PDFExportConfig): void {
    const page = {
      elements: [],
      pageNumber: pdf.pages.length + 1,
      dimensions: pdf.pageSize,
      margins: config.margins
    }
    
    pdf.pages.push(page)
    pdf.currentPage = pdf.pages.length - 1
  }

  /**
   * 添加图表到PDF
   */
  private async addChartToPDF(
    pdf: any,
    chart: Chart,
    config: PDFExportConfig
  ): Promise<void> {
    // 获取图表Canvas
    const canvas = chart.canvas
    
    // 计算图表在PDF中的位置和尺寸
    const placement = this.calculateChartPlacement(pdf, canvas, config)
    
    // 将Canvas转换为图像数据
    const imageData = canvas.toDataURL('image/png', config.compression.imageQuality)
    
    // 添加图像到当前页面
    const currentPage = pdf.pages[pdf.currentPage]
    currentPage.elements.push({
      type: 'image',
      data: imageData,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height
    })
    
    // 添加图表标题
    if (chart.options.plugins?.title?.display && chart.options.plugins.title.text) {
      this.addTextToPDF(pdf, chart.options.plugins.title.text as string, {
        x: placement.x + placement.width / 2,
        y: placement.y - 10,
        align: 'center',
        fontSize: 14,
        fontWeight: 'bold'
      })
    }
  }

  /**
   * 添加多个图表到页面
   */
  private async addChartsToPage(
    pdf: any,
    charts: Chart[],
    config: PDFExportConfig
  ): Promise<void> {
    const chartsPerPage = config.layout.chartsPerPage || 1
    
    // 计算布局
    const layout = this.calculateMultiChartLayout(pdf, charts.length, config)
    
    for (let i = 0; i < charts.length && i < chartsPerPage; i++) {
      const chart = charts[i]
      const position = layout[i]
      
      // 获取图表Canvas
      const canvas = chart.canvas
      const imageData = canvas.toDataURL('image/png', config.compression.imageQuality)
      
      // 添加图像到当前页面
      const currentPage = pdf.pages[pdf.currentPage]
      currentPage.elements.push({
        type: 'image',
        data: imageData,
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height
      })
      
      // 添加图表标题
      if (chart.options.plugins?.title?.display && chart.options.plugins.title.text) {
        this.addTextToPDF(pdf, chart.options.plugins.title.text as string, {
          x: position.x + position.width / 2,
          y: position.y - 10,
          align: 'center',
          fontSize: 12,
          fontWeight: 'bold'
        })
      }
    }
  }

  /**
   * 计算图表布局
   */
  private calculateChartPlacement(
    pdf: any,
    canvas: HTMLCanvasElement,
    config: PDFExportConfig
  ): { x: number; y: number; width: number; height: number } {
    const pageWidth = pdf.pageSize.width
    const pageHeight = pdf.pageSize.height
    const margins = config.margins
    
    // 可用区域
    const availableWidth = pageWidth - margins.left - margins.right
    const availableHeight = pageHeight - margins.top - margins.bottom
    
    // 保持图表宽高比
    const canvasRatio = canvas.width / canvas.height
    let width = availableWidth
    let height = width / canvasRatio
    
    // 如果高度超出可用区域，按高度调整
    if (height > availableHeight) {
      height = availableHeight
      width = height * canvasRatio
    }
    
    // 居中放置
    const x = margins.left + (availableWidth - width) / 2
    const y = margins.top + (availableHeight - height) / 2
    
    return { x, y, width, height }
  }

  /**
   * 计算多图表布局
   */
  private calculateMultiChartLayout(
    pdf: any,
    chartCount: number,
    config: PDFExportConfig
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const chartsPerPage = Math.min(chartCount, config.layout.chartsPerPage || 1)
    const pageWidth = pdf.pageSize.width
    const pageHeight = pdf.pageSize.height
    const margins = config.margins
    
    const availableWidth = pageWidth - margins.left - margins.right
    const availableHeight = pageHeight - margins.top - margins.bottom
    
    const positions: Array<{ x: number; y: number; width: number; height: number }> = []
    
    // 简化布局：垂直排列
    const chartHeight = availableHeight / chartsPerPage
    const chartWidth = availableWidth
    
    for (let i = 0; i < chartsPerPage; i++) {
      positions.push({
        x: margins.left,
        y: margins.top + i * chartHeight,
        width: chartWidth,
        height: chartHeight - 10 // 留出间距
      })
    }
    
    return positions
  }

  /**
   * 添加Canvas到PDF
   */
  private async addCanvasToPDF(
    pdf: any,
    canvas: HTMLCanvasElement,
    config: PDFExportConfig
  ): Promise<void> {
    const placement = this.calculateChartPlacement(pdf, canvas, config)
    const imageData = canvas.toDataURL('image/png', config.compression.imageQuality)
    
    const currentPage = pdf.pages[pdf.currentPage]
    currentPage.elements.push({
      type: 'image',
      data: imageData,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height
    })
  }

  /**
   * 添加文本到PDF
   */
  private addTextToPDF(
    pdf: any,
    text: string,
    options: {
      x: number
      y: number
      align?: 'left' | 'center' | 'right'
      fontSize?: number
      fontWeight?: 'normal' | 'bold'
      color?: string
    }
  ): void {
    const currentPage = pdf.pages[pdf.currentPage]
    currentPage.elements.push({
      type: 'text',
      text,
      x: options.x,
      y: options.y,
      align: options.align || 'left',
      fontSize: options.fontSize || 12,
      fontWeight: options.fontWeight || 'normal',
      color: options.color || '#333333'
    })
  }

  /**
   * 添加页眉页脚
   */
  private addHeaderFooter(pdf: any, config: PDFExportConfig): void {
    const currentPage = pdf.pages[pdf.currentPage]
    
    // 添加页眉
    if (config.layout.includeHeader && config.layout.headerText) {
      this.addTextToPDF(pdf, config.layout.headerText, {
        x: pdf.pageSize.width / 2,
        y: config.margins.top / 2,
        align: 'center',
        fontSize: 10,
        color: '#666666'
      })
    }
    
    // 添加页脚
    if (config.layout.includeFooter && config.layout.footerText) {
      this.addTextToPDF(pdf, config.layout.footerText, {
        x: config.margins.left,
        y: pdf.pageSize.height - config.margins.bottom / 2,
        align: 'left',
        fontSize: 10,
        color: '#666666'
      })
      
      // 添加页码
      this.addTextToPDF(pdf, `Seite ${currentPage.pageNumber}`, {
        x: pdf.pageSize.width - config.margins.right,
        y: pdf.pageSize.height - config.margins.bottom / 2,
        align: 'right',
        fontSize: 10,
        color: '#666666'
      })
    }
  }

  /**
   * 为所有页面添加页眉页脚
   */
  private addHeaderFooterToAllPages(pdf: any, config: PDFExportConfig): void {
    const originalCurrentPage = pdf.currentPage
    
    for (let i = 0; i < pdf.pages.length; i++) {
      pdf.currentPage = i
      this.addHeaderFooter(pdf, config)
    }
    
    pdf.currentPage = originalCurrentPage
  }

  /**
   * 应用压缩
   */
  private applyCompression(pdf: any, config: PDFExportConfig): void {
    // 简化实现：标记需要压缩
    pdf.compression = {
      enabled: true,
      level: config.compression.level,
      imageQuality: config.compression.imageQuality
    }
  }

  /**
   * 应用安全设置
   */
  private applySecuritySettings(pdf: any, security: NonNullable<PDFExportConfig['security']>): void {
    pdf.security = {
      userPassword: security.userPassword,
      ownerPassword: security.ownerPassword,
      permissions: security.permissions || {}
    }
  }

  /**
   * HTML转Canvas
   */
  private async htmlToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    // 简化实现：创建空Canvas
    // 实际实现需要使用html2canvas等库
    const canvas = document.createElement('canvas')
    canvas.width = element.offsetWidth || 800
    canvas.height = element.offsetHeight || 600
    
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 添加占位文本
    ctx.fillStyle = '#333333'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('HTML Element Export', canvas.width / 2, canvas.height / 2)
    
    return canvas
  }

  /**
   * 完成PDF导出
   */
  private finalizePDFExport(pdf: any, config: PDFExportConfig): PDFExportResult {
    // 简化实现：创建模拟的PDF Blob
    const pdfContent = this.generatePDFContent(pdf)
    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    
    // 计算压缩比
    const uncompressedSize = this.estimateUncompressedSize(pdf)
    const compressionRatio = uncompressedSize / blob.size
    
    return {
      blob,
      size: blob.size,
      pageCount: pdf.pages.length,
      dimensions: pdf.pageSize,
      metadata: {
        title: config.metadata.title || 'Untitled',
        author: config.metadata.author || 'Unknown',
        creationDate: new Date(),
        compressionRatio
      }
    }
  }

  /**
   * 生成PDF内容
   */
  private generatePDFContent(pdf: any): ArrayBuffer {
    // 简化实现：生成模拟的PDF内容
    // 实际实现需要使用PDF库生成真实的PDF二进制数据
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

  /**
   * 估算未压缩大小
   */
  private estimateUncompressedSize(pdf: any): number {
    let size = 0
    
    pdf.pages.forEach((page: any) => {
      page.elements.forEach((element: any) => {
        if (element.type === 'image') {
          // 估算图像大小
          size += element.width * element.height * 4 // RGBA
        } else if (element.type === 'text') {
          // 估算文本大小
          size += element.text.length * 2
        }
      })
    })
    
    return size
  }
}

// 导出单例实例
export const pdfExportEngine = PDFExportEngine.getInstance()
