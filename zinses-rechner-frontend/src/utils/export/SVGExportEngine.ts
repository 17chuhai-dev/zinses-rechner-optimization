/**
 * SVG导出引擎
 * 提供高质量的矢量图形导出功能，支持可缩放的SVG格式导出
 */

import type { Chart } from 'chart.js'

// SVG导出配置接口
export interface SVGExportConfig {
  width?: number
  height?: number
  backgroundColor?: string
  preserveAspectRatio?: boolean
  embedFonts?: boolean
  optimizeSize?: boolean
  includeMetadata?: boolean
  viewBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  styling?: {
    cssClasses?: boolean
    inlineStyles?: boolean
    externalStylesheet?: string
  }
  accessibility?: {
    title?: string
    description?: string
    ariaLabels?: boolean
  }
}

// SVG导出结果接口
export interface SVGExportResult {
  svgString: string
  blob: Blob
  size: number
  dimensions: {
    width: number
    height: number
    viewBox: string
  }
  metadata: {
    elements: number
    textElements: number
    pathElements: number
    hasEmbeddedFonts: boolean
  }
}

// 默认SVG导出配置
export const DEFAULT_SVG_CONFIG: SVGExportConfig = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  preserveAspectRatio: true,
  embedFonts: true,
  optimizeSize: true,
  includeMetadata: true,
  styling: {
    cssClasses: false,
    inlineStyles: true
  },
  accessibility: {
    ariaLabels: true
  }
}

/**
 * SVG导出引擎类
 */
export class SVGExportEngine {
  private static instance: SVGExportEngine

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): SVGExportEngine {
    if (!SVGExportEngine.instance) {
      SVGExportEngine.instance = new SVGExportEngine()
    }
    return SVGExportEngine.instance
  }

  /**
   * 导出Chart.js图表为SVG
   */
  public async exportChartToSVG(
    chart: Chart,
    config: Partial<SVGExportConfig> = {}
  ): Promise<SVGExportResult> {
    const fullConfig = { ...DEFAULT_SVG_CONFIG, ...config }
    
    // 获取图表Canvas
    const canvas = chart.canvas
    const ctx = canvas.getContext('2d')!
    
    // 创建SVG元素
    const svg = this.createSVGElement(fullConfig)
    
    // 转换Canvas内容到SVG
    await this.convertCanvasToSVG(canvas, svg, fullConfig)
    
    // 添加图表特定的元素
    this.addChartElements(chart, svg, fullConfig)
    
    // 优化SVG
    if (fullConfig.optimizeSize) {
      this.optimizeSVG(svg)
    }
    
    // 添加可访问性属性
    if (fullConfig.accessibility?.ariaLabels) {
      this.addAccessibilityAttributes(svg, chart, fullConfig)
    }
    
    return this.finalizeSVGExport(svg, fullConfig)
  }

  /**
   * 导出HTML元素为SVG
   */
  public async exportElementToSVG(
    element: HTMLElement,
    config: Partial<SVGExportConfig> = {}
  ): Promise<SVGExportResult> {
    const fullConfig = { ...DEFAULT_SVG_CONFIG, ...config }
    
    // 创建SVG元素
    const svg = this.createSVGElement(fullConfig)
    
    // 转换HTML元素到SVG
    await this.convertElementToSVG(element, svg, fullConfig)
    
    // 优化SVG
    if (fullConfig.optimizeSize) {
      this.optimizeSVG(svg)
    }
    
    return this.finalizeSVGExport(svg, fullConfig)
  }

  /**
   * 导出Canvas为SVG
   */
  public async exportCanvasToSVG(
    canvas: HTMLCanvasElement,
    config: Partial<SVGExportConfig> = {}
  ): Promise<SVGExportResult> {
    const fullConfig = { ...DEFAULT_SVG_CONFIG, ...config }
    
    // 创建SVG元素
    const svg = this.createSVGElement(fullConfig)
    
    // 转换Canvas到SVG
    await this.convertCanvasToSVG(canvas, svg, fullConfig)
    
    // 优化SVG
    if (fullConfig.optimizeSize) {
      this.optimizeSVG(svg)
    }
    
    return this.finalizeSVGExport(svg, fullConfig)
  }

  /**
   * 创建SVG元素
   */
  private createSVGElement(config: SVGExportConfig): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    
    // 设置基本属性
    svg.setAttribute('width', config.width?.toString() || '800')
    svg.setAttribute('height', config.height?.toString() || '600')
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    
    // 设置viewBox
    if (config.viewBox) {
      const { x, y, width, height } = config.viewBox
      svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
    } else {
      svg.setAttribute('viewBox', `0 0 ${config.width || 800} ${config.height || 600}`)
    }
    
    // 设置preserveAspectRatio
    if (config.preserveAspectRatio) {
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    }
    
    // 添加背景
    if (config.backgroundColor && config.backgroundColor !== 'transparent') {
      const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      background.setAttribute('width', '100%')
      background.setAttribute('height', '100%')
      background.setAttribute('fill', config.backgroundColor)
      svg.appendChild(background)
    }
    
    // 添加元数据
    if (config.includeMetadata) {
      this.addSVGMetadata(svg)
    }
    
    return svg
  }

  /**
   * 转换Canvas到SVG
   */
  private async convertCanvasToSVG(
    canvas: HTMLCanvasElement,
    svg: SVGSVGElement,
    config: SVGExportConfig
  ): Promise<void> {
    // 获取Canvas数据URL
    const dataURL = canvas.toDataURL('image/png')
    
    // 创建image元素
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    image.setAttribute('href', dataURL)
    image.setAttribute('x', '0')
    image.setAttribute('y', '0')
    image.setAttribute('width', config.width?.toString() || canvas.width.toString())
    image.setAttribute('height', config.height?.toString() || canvas.height.toString())
    
    svg.appendChild(image)
  }

  /**
   * 转换HTML元素到SVG
   */
  private async convertElementToSVG(
    element: HTMLElement,
    svg: SVGSVGElement,
    config: SVGExportConfig
  ): Promise<void> {
    // 使用foreignObject包装HTML内容
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    foreignObject.setAttribute('x', '0')
    foreignObject.setAttribute('y', '0')
    foreignObject.setAttribute('width', config.width?.toString() || '800')
    foreignObject.setAttribute('height', config.height?.toString() || '600')
    
    // 克隆元素以避免修改原始DOM
    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // 确保样式被内联
    if (config.styling?.inlineStyles) {
      this.inlineStyles(clonedElement)
    }
    
    foreignObject.appendChild(clonedElement)
    svg.appendChild(foreignObject)
  }

  /**
   * 添加图表特定元素
   */
  private addChartElements(
    chart: Chart,
    svg: SVGSVGElement,
    config: SVGExportConfig
  ): void {
    // 添加图表标题
    if (chart.options.plugins?.title?.display && chart.options.plugins.title.text) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      title.setAttribute('x', '50%')
      title.setAttribute('y', '30')
      title.setAttribute('text-anchor', 'middle')
      title.setAttribute('font-family', 'Arial, sans-serif')
      title.setAttribute('font-size', '16')
      title.setAttribute('font-weight', 'bold')
      title.setAttribute('fill', '#333')
      title.textContent = chart.options.plugins.title.text as string
      svg.appendChild(title)
    }
    
    // 添加图例（简化版）
    if (chart.options.plugins?.legend?.display) {
      this.addChartLegend(chart, svg, config)
    }
  }

  /**
   * 添加图表图例
   */
  private addChartLegend(
    chart: Chart,
    svg: SVGSVGElement,
    config: SVGExportConfig
  ): void {
    const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    legendGroup.setAttribute('class', 'chart-legend')
    
    let yOffset = (config.height || 600) - 50
    let xOffset = 20
    
    chart.data.datasets.forEach((dataset, index) => {
      // 图例项组
      const legendItem = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      
      // 颜色方块
      const colorRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      colorRect.setAttribute('x', xOffset.toString())
      colorRect.setAttribute('y', (yOffset - 10).toString())
      colorRect.setAttribute('width', '12')
      colorRect.setAttribute('height', '12')
      colorRect.setAttribute('fill', dataset.backgroundColor as string || '#ccc')
      legendItem.appendChild(colorRect)
      
      // 标签文本
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      labelText.setAttribute('x', (xOffset + 20).toString())
      labelText.setAttribute('y', yOffset.toString())
      labelText.setAttribute('font-family', 'Arial, sans-serif')
      labelText.setAttribute('font-size', '12')
      labelText.setAttribute('fill', '#666')
      labelText.textContent = dataset.label || `Dataset ${index + 1}`
      legendItem.appendChild(labelText)
      
      legendGroup.appendChild(legendItem)
      xOffset += 150 // 水平间距
      
      // 换行处理
      if (xOffset > (config.width || 800) - 150) {
        xOffset = 20
        yOffset += 20
      }
    })
    
    svg.appendChild(legendGroup)
  }

  /**
   * 内联样式
   */
  private inlineStyles(element: HTMLElement): void {
    const computedStyle = window.getComputedStyle(element)
    
    // 复制重要的样式属性
    const importantStyles = [
      'color', 'background-color', 'font-family', 'font-size', 'font-weight',
      'text-align', 'line-height', 'margin', 'padding', 'border', 'width', 'height'
    ]
    
    importantStyles.forEach(property => {
      const value = computedStyle.getPropertyValue(property)
      if (value) {
        element.style.setProperty(property, value)
      }
    })
    
    // 递归处理子元素
    Array.from(element.children).forEach(child => {
      if (child instanceof HTMLElement) {
        this.inlineStyles(child)
      }
    })
  }

  /**
   * 添加SVG元数据
   */
  private addSVGMetadata(svg: SVGSVGElement): void {
    // 添加标题
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
    title.textContent = 'Zinses Rechner Chart Export'
    svg.appendChild(title)
    
    // 添加描述
    const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc')
    desc.textContent = `Chart exported from Zinses Rechner on ${new Date().toISOString()}`
    svg.appendChild(desc)
    
    // 添加生成器信息
    const generator = document.createElementNS('http://www.w3.org/2000/svg', 'metadata')
    generator.innerHTML = `
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
               xmlns:dc="http://purl.org/dc/elements/1.1/">
        <rdf:Description>
          <dc:creator>Zinses Rechner SVG Export Engine</dc:creator>
          <dc:date>${new Date().toISOString()}</dc:date>
          <dc:format>image/svg+xml</dc:format>
        </rdf:Description>
      </rdf:RDF>
    `
    svg.appendChild(generator)
  }

  /**
   * 添加可访问性属性
   */
  private addAccessibilityAttributes(
    svg: SVGSVGElement,
    chart: Chart,
    config: SVGExportConfig
  ): void {
    // 添加role属性
    svg.setAttribute('role', 'img')
    
    // 添加aria-label
    if (config.accessibility?.title) {
      svg.setAttribute('aria-label', config.accessibility.title)
    } else if (chart.options.plugins?.title?.text) {
      svg.setAttribute('aria-label', chart.options.plugins.title.text as string)
    }
    
    // 添加aria-describedby
    if (config.accessibility?.description) {
      const descId = 'chart-desc-' + Math.random().toString(36).substr(2, 9)
      svg.setAttribute('aria-describedby', descId)
      
      const descElement = document.createElementNS('http://www.w3.org/2000/svg', 'desc')
      descElement.setAttribute('id', descId)
      descElement.textContent = config.accessibility.description
      svg.appendChild(descElement)
    }
  }

  /**
   * 优化SVG
   */
  private optimizeSVG(svg: SVGSVGElement): void {
    // 移除不必要的属性
    this.removeUnnecessaryAttributes(svg)
    
    // 合并相似的元素
    this.mergeSimilarElements(svg)
    
    // 优化路径
    this.optimizePaths(svg)
    
    // 移除空的组
    this.removeEmptyGroups(svg)
  }

  /**
   * 移除不必要的属性
   */
  private removeUnnecessaryAttributes(element: Element): void {
    const unnecessaryAttributes = ['data-testid', 'data-*']
    
    unnecessaryAttributes.forEach(attr => {
      if (attr.includes('*')) {
        // 处理通配符属性
        const prefix = attr.replace('*', '')
        Array.from(element.attributes).forEach(attribute => {
          if (attribute.name.startsWith(prefix)) {
            element.removeAttribute(attribute.name)
          }
        })
      } else {
        element.removeAttribute(attr)
      }
    })
    
    // 递归处理子元素
    Array.from(element.children).forEach(child => {
      this.removeUnnecessaryAttributes(child)
    })
  }

  /**
   * 合并相似的元素
   */
  private mergeSimilarElements(svg: SVGSVGElement): void {
    // 简化实现：合并具有相同样式的相邻元素
    const elements = Array.from(svg.querySelectorAll('*'))
    
    for (let i = 0; i < elements.length - 1; i++) {
      const current = elements[i]
      const next = elements[i + 1]
      
      if (this.canMergeElements(current, next)) {
        this.mergeElements(current, next)
        elements.splice(i + 1, 1) // 移除已合并的元素
        i-- // 重新检查当前位置
      }
    }
  }

  /**
   * 判断是否可以合并元素
   */
  private canMergeElements(element1: Element, element2: Element): boolean {
    // 简化的合并条件检查
    return element1.tagName === element2.tagName &&
           element1.getAttribute('fill') === element2.getAttribute('fill') &&
           element1.getAttribute('stroke') === element2.getAttribute('stroke')
  }

  /**
   * 合并元素
   */
  private mergeElements(element1: Element, element2: Element): void {
    // 简化的合并实现
    // 实际实现会更复杂，需要根据元素类型进行不同的合并策略
    if (element1.tagName === 'path' && element2.tagName === 'path') {
      const path1 = element1.getAttribute('d') || ''
      const path2 = element2.getAttribute('d') || ''
      element1.setAttribute('d', path1 + ' ' + path2)
      element2.remove()
    }
  }

  /**
   * 优化路径
   */
  private optimizePaths(svg: SVGSVGElement): void {
    const paths = svg.querySelectorAll('path')
    
    paths.forEach(path => {
      const d = path.getAttribute('d')
      if (d) {
        // 简化路径数据（移除多余的精度）
        const optimizedD = this.optimizePathData(d)
        path.setAttribute('d', optimizedD)
      }
    })
  }

  /**
   * 优化路径数据
   */
  private optimizePathData(pathData: string): string {
    // 简化实现：减少数字精度
    return pathData.replace(/(\d+\.\d{3,})/g, (match) => {
      return parseFloat(match).toFixed(2)
    })
  }

  /**
   * 移除空的组
   */
  private removeEmptyGroups(svg: SVGSVGElement): void {
    const groups = svg.querySelectorAll('g')
    
    groups.forEach(group => {
      if (group.children.length === 0 && !group.textContent?.trim()) {
        group.remove()
      }
    })
  }

  /**
   * 完成SVG导出
   */
  private finalizeSVGExport(
    svg: SVGSVGElement,
    config: SVGExportConfig
  ): SVGExportResult {
    // 序列化SVG
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    
    // 创建Blob
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    
    // 计算元数据
    const metadata = {
      elements: svg.querySelectorAll('*').length,
      textElements: svg.querySelectorAll('text, tspan').length,
      pathElements: svg.querySelectorAll('path').length,
      hasEmbeddedFonts: config.embedFonts || false
    }
    
    // 获取尺寸信息
    const dimensions = {
      width: parseInt(svg.getAttribute('width') || '800'),
      height: parseInt(svg.getAttribute('height') || '600'),
      viewBox: svg.getAttribute('viewBox') || '0 0 800 600'
    }
    
    return {
      svgString,
      blob,
      size: blob.size,
      dimensions,
      metadata
    }
  }

  /**
   * 嵌入字体
   */
  private async embedFonts(svg: SVGSVGElement): Promise<void> {
    // 获取所有使用的字体
    const usedFonts = this.getUsedFonts(svg)
    
    // 为每个字体创建@font-face规则
    const fontFaces: string[] = []
    
    for (const fontFamily of usedFonts) {
      try {
        const fontData = await this.getFontData(fontFamily)
        if (fontData) {
          fontFaces.push(`
            @font-face {
              font-family: '${fontFamily}';
              src: url('${fontData}') format('woff2');
            }
          `)
        }
      } catch (error) {
        console.warn(`无法嵌入字体 ${fontFamily}:`, error)
      }
    }
    
    // 添加样式元素
    if (fontFaces.length > 0) {
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
      style.textContent = fontFaces.join('\n')
      svg.insertBefore(style, svg.firstChild)
    }
  }

  /**
   * 获取使用的字体
   */
  private getUsedFonts(svg: SVGSVGElement): Set<string> {
    const fonts = new Set<string>()
    
    // 检查所有文本元素
    const textElements = svg.querySelectorAll('text, tspan')
    textElements.forEach(element => {
      const fontFamily = element.getAttribute('font-family')
      if (fontFamily) {
        fonts.add(fontFamily.replace(/['"]/g, ''))
      }
    })
    
    // 检查样式中的字体
    const styleElements = svg.querySelectorAll('style')
    styleElements.forEach(style => {
      const content = style.textContent || ''
      const fontFamilyMatches = content.match(/font-family:\s*([^;]+)/g)
      if (fontFamilyMatches) {
        fontFamilyMatches.forEach(match => {
          const fontFamily = match.replace(/font-family:\s*/, '').replace(/['"]/g, '')
          fonts.add(fontFamily)
        })
      }
    })
    
    return fonts
  }

  /**
   * 获取字体数据
   */
  private async getFontData(fontFamily: string): Promise<string | null> {
    // 简化实现：返回null，实际实现需要从字体服务获取数据
    // 可以集成Google Fonts API或其他字体服务
    return null
  }
}

// 导出单例实例
export const svgExportEngine = SVGExportEngine.getInstance()
