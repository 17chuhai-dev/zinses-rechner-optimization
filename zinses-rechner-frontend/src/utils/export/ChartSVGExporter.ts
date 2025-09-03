/**
 * Chart.js SVG导出器
 * 专门针对Chart.js图表的SVG导出功能，提供高质量的矢量图形输出
 */

import type { Chart } from 'chart.js'
import { SVGExportEngine, type SVGExportConfig, type SVGExportResult } from './SVGExportEngine'

// Chart.js特定的SVG导出配置
export interface ChartSVGExportConfig extends SVGExportConfig {
  // 图表特定选项
  includeTitle?: boolean
  includeLegend?: boolean
  includeTooltips?: boolean
  includeAnimation?: boolean

  // 数据标签选项
  includeDataLabels?: boolean
  dataLabelFormat?: 'value' | 'percentage' | 'both' | 'custom'
  customDataLabelFormatter?: (value: any, context: any) => string

  // 颜色和样式
  colorScheme?: 'original' | 'monochrome' | 'high-contrast' | 'print-friendly' | 'dark-mode' | 'custom'
  customColorPalette?: string[]
  strokeWidth?: number
  fillOpacity?: number
  strokeOpacity?: number

  // 交互性
  includeInteractivity?: boolean
  includeHoverEffects?: boolean
  enableZoom?: boolean
  enablePan?: boolean

  // 响应式
  makeResponsive?: boolean
  minWidth?: number
  maxWidth?: number
  breakpoints?: Array<{ width: number; config: Partial<ChartSVGExportConfig> }>

  // 高级功能
  includeGridLines?: boolean
  includeAxes?: boolean
  includeDataPoints?: boolean
  smoothCurves?: boolean
  shadowEffects?: boolean
  gradientFills?: boolean

  // 文本和字体
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder'
  textColor?: string

  // 导出质量
  precision?: number
  vectorOptimization?: 'none' | 'basic' | 'aggressive'
  pathSimplification?: boolean
  removeRedundantElements?: boolean
}

// Chart.js SVG导出结果
export interface ChartSVGExportResult extends SVGExportResult {
  chartInfo: {
    type: string
    datasets: number
    dataPoints: number
    hasTitle: boolean
    hasLegend: boolean
  }
}

// 默认配置
export const DEFAULT_CHART_SVG_CONFIG: ChartSVGExportConfig = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  preserveAspectRatio: true,
  embedFonts: true,
  optimizeSize: true,
  includeMetadata: true,
  includeTitle: true,
  includeLegend: true,
  includeTooltips: false,
  includeAnimation: false,
  includeDataLabels: false,
  dataLabelFormat: 'value',
  colorScheme: 'original',
  strokeWidth: 2,
  fillOpacity: 1.0,
  strokeOpacity: 1.0,
  includeInteractivity: false,
  includeHoverEffects: false,
  enableZoom: false,
  enablePan: false,
  makeResponsive: true,
  minWidth: 300,
  maxWidth: 1200,
  includeGridLines: true,
  includeAxes: true,
  includeDataPoints: true,
  smoothCurves: false,
  shadowEffects: false,
  gradientFills: false,
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  fontWeight: 'normal',
  textColor: '#333333',
  precision: 2,
  vectorOptimization: 'basic',
  pathSimplification: true,
  removeRedundantElements: true,
  styling: {
    cssClasses: false,
    inlineStyles: true
  },
  accessibility: {
    ariaLabels: true
  }
}

/**
 * Chart.js SVG导出器类
 */
export class ChartSVGExporter {
  private svgEngine: SVGExportEngine

  constructor() {
    this.svgEngine = SVGExportEngine.getInstance()
  }

  /**
   * 导出Chart.js图表为SVG
   */
  public async exportChart(
    chart: Chart,
    config: Partial<ChartSVGExportConfig> = {}
  ): Promise<ChartSVGExportResult> {
    const fullConfig = { ...DEFAULT_CHART_SVG_CONFIG, ...config }

    // 创建SVG元素
    const svg = this.createChartSVG(chart, fullConfig)

    // 转换图表内容
    await this.convertChartToSVG(chart, svg, fullConfig)

    // 添加图表特定元素
    this.addChartSpecificElements(chart, svg, fullConfig)

    // 应用样式优化
    this.applyChartStyling(svg, fullConfig)

    // 优化SVG
    if (fullConfig.optimizeSize) {
      this.optimizeChartSVG(svg)
    }

    // 添加响应式支持
    if (fullConfig.makeResponsive) {
      this.makeResponsive(svg, fullConfig)
    }

    // 添加可访问性
    if (fullConfig.accessibility?.ariaLabels) {
      this.addChartAccessibility(chart, svg, fullConfig)
    }

    return this.finalizeChartSVGExport(chart, svg, fullConfig)
  }

  /**
   * 创建图表SVG容器
   */
  private createChartSVG(chart: Chart, config: ChartSVGExportConfig): SVGSVGElement {
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

    return svg
  }

  /**
   * 转换图表内容到SVG
   */
  private async convertChartToSVG(
    chart: Chart,
    svg: SVGSVGElement,
    config: ChartSVGExportConfig
  ): Promise<void> {
    // 获取图表Canvas
    const canvas = chart.canvas
    const ctx = canvas.getContext('2d')!

    // 根据图表类型选择转换策略
    const chartType = chart.config.type

    switch (chartType) {
      case 'line':
        await this.convertLineChart(chart, svg, config)
        break
      case 'bar':
        await this.convertBarChart(chart, svg, config)
        break
      case 'pie':
      case 'doughnut':
        await this.convertPieChart(chart, svg, config)
        break
      case 'scatter':
        await this.convertScatterChart(chart, svg, config)
        break
      default:
        // 回退到Canvas转换
        await this.convertCanvasToSVG(canvas, svg, config)
    }
  }

  /**
   * 转换线图
   */
  private async convertLineChart(
    chart: Chart,
    svg: SVGSVGElement,
    config: ChartSVGExportConfig
  ): Promise<void> {
    const datasets = chart.data.datasets
    const chartArea = chart.chartArea

    // 创建图表组
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    chartGroup.setAttribute('class', 'chart-lines')

    datasets.forEach((dataset, datasetIndex) => {
      if (!dataset.data || dataset.data.length === 0) return

      // 创建数据集组
      const datasetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      datasetGroup.setAttribute('class', `dataset-${datasetIndex}`)

      // 创建路径
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      const pathData = this.generateLinePathData(chart, dataset, datasetIndex)

      path.setAttribute('d', pathData)
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', dataset.borderColor as string || '#3B82F6')
      path.setAttribute('stroke-width', config.strokeWidth?.toString() || '2')
      path.setAttribute('stroke-linejoin', 'round')
      path.setAttribute('stroke-linecap', 'round')

      datasetGroup.appendChild(path)

      // 添加数据点
      if (dataset.pointRadius && (dataset.pointRadius as number) > 0) {
        this.addDataPoints(chart, dataset, datasetIndex, datasetGroup)
      }

      // 添加数据标签
      if (config.includeDataLabels) {
        this.addDataLabels(chart, dataset, datasetIndex, datasetGroup, config)
      }

      chartGroup.appendChild(datasetGroup)
    })

    svg.appendChild(chartGroup)
  }

  /**
   * 转换柱状图
   */
  private async convertBarChart(
    chart: Chart,
    svg: SVGSVGElement,
    config: ChartSVGExportConfig
  ): Promise<void> {
    const datasets = chart.data.datasets

    // 创建图表组
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    chartGroup.setAttribute('class', 'chart-bars')

    datasets.forEach((dataset, datasetIndex) => {
      if (!dataset.data || dataset.data.length === 0) return

      // 创建数据集组
      const datasetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      datasetGroup.setAttribute('class', `dataset-${datasetIndex}`)

      // 为每个数据点创建矩形
      dataset.data.forEach((value, pointIndex) => {
        const rect = this.createBarRect(chart, value as number, datasetIndex, pointIndex)
        if (rect) {
          rect.setAttribute('fill', dataset.backgroundColor as string || '#3B82F6')
          rect.setAttribute('stroke', dataset.borderColor as string || 'none')
          rect.setAttribute('stroke-width', config.strokeWidth?.toString() || '0')
          datasetGroup.appendChild(rect)
        }
      })

      // 添加数据标签
      if (config.includeDataLabels) {
        this.addDataLabels(chart, dataset, datasetIndex, datasetGroup, config)
      }

      chartGroup.appendChild(datasetGroup)
    })

    svg.appendChild(chartGroup)
  }

  /**
   * 转换饼图
   */
  private async convertPieChart(
    chart: Chart,
    svg: SVGSVGElement,
    config: ChartSVGExportConfig
  ): Promise<void> {
    const dataset = chart.data.datasets[0]
    if (!dataset || !dataset.data || dataset.data.length === 0) return

    // 创建图表组
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    chartGroup.setAttribute('class', 'chart-pie')

    // 计算饼图参数
    const centerX = (config.width || 800) / 2
    const centerY = (config.height || 600) / 2
    const radius = Math.min(centerX, centerY) * 0.8

    const total = (dataset.data as number[]).reduce((sum, value) => sum + value, 0)
    let currentAngle = -Math.PI / 2 // 从顶部开始

    // 为每个数据点创建扇形
    dataset.data.forEach((value, index) => {
      const angle = (value as number / total) * 2 * Math.PI
      const path = this.createPieSlice(centerX, centerY, radius, currentAngle, angle)

      path.setAttribute('fill', (dataset.backgroundColor as string[])?.[index] || '#3B82F6')
      path.setAttribute('stroke', config.backgroundColor || '#ffffff')
      path.setAttribute('stroke-width', '2')

      chartGroup.appendChild(path)
      currentAngle += angle
    })

    svg.appendChild(chartGroup)
  }

  /**
   * 生成线图路径数据
   */
  private generateLinePathData(chart: Chart, dataset: any, datasetIndex: number): string {
    const meta = chart.getDatasetMeta(datasetIndex)
    const points = meta.data

    if (points.length === 0) return ''

    let pathData = `M ${points[0].x} ${points[0].y}`

    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`
    }

    return pathData
  }

  /**
   * 创建柱状图矩形
   */
  private createBarRect(
    chart: Chart,
    value: number,
    datasetIndex: number,
    pointIndex: number
  ): SVGRectElement | null {
    const meta = chart.getDatasetMeta(datasetIndex)
    const point = meta.data[pointIndex]

    if (!point) return null

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')

    // 根据图表方向设置矩形属性
    if (chart.config.options?.indexAxis === 'y') {
      // 水平柱状图
      rect.setAttribute('x', '0')
      rect.setAttribute('y', (point.y - point.height / 2).toString())
      rect.setAttribute('width', point.x.toString())
      rect.setAttribute('height', point.height.toString())
    } else {
      // 垂直柱状图
      rect.setAttribute('x', (point.x - point.width / 2).toString())
      rect.setAttribute('y', point.y.toString())
      rect.setAttribute('width', point.width.toString())
      rect.setAttribute('height', (chart.chartArea.bottom - point.y).toString())
    }

    return rect
  }

  /**
   * 创建饼图扇形
   */
  private createPieSlice(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    angle: number
  ): SVGPathElement {
    const endAngle = startAngle + angle

    const x1 = centerX + radius * Math.cos(startAngle)
    const y1 = centerY + radius * Math.sin(startAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)

    const largeArcFlag = angle > Math.PI ? 1 : 0

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', pathData)

    return path
  }

  /**
   * 添加数据点
   */
  private addDataPoints(
    chart: Chart,
    dataset: any,
    datasetIndex: number,
    group: SVGGElement
  ): void {
    const meta = chart.getDatasetMeta(datasetIndex)
    const points = meta.data

    points.forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', point.x.toString())
      circle.setAttribute('cy', point.y.toString())
      circle.setAttribute('r', (dataset.pointRadius || 3).toString())
      circle.setAttribute('fill', dataset.pointBackgroundColor || dataset.borderColor || '#3B82F6')
      circle.setAttribute('stroke', dataset.pointBorderColor || '#ffffff')
      circle.setAttribute('stroke-width', (dataset.pointBorderWidth || 1).toString())

      group.appendChild(circle)
    })
  }

  /**
   * 添加数据标签
   */
  private addDataLabels(
    chart: Chart,
    dataset: any,
    datasetIndex: number,
    group: SVGGElement,
    config: ChartSVGExportConfig
  ): void {
    const meta = chart.getDatasetMeta(datasetIndex)
    const points = meta.data

    points.forEach((point, index) => {
      const value = dataset.data[index]
      let labelText = ''

      switch (config.dataLabelFormat) {
        case 'percentage':
          const total = dataset.data.reduce((sum: number, val: number) => sum + val, 0)
          labelText = `${((value / total) * 100).toFixed(1)}%`
          break
        case 'both':
          const totalBoth = dataset.data.reduce((sum: number, val: number) => sum + val, 0)
          labelText = `${value} (${((value / totalBoth) * 100).toFixed(1)}%)`
          break
        default:
          labelText = value.toString()
      }

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', point.x.toString())
      text.setAttribute('y', (point.y - 10).toString())
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('font-family', 'Arial, sans-serif')
      text.setAttribute('font-size', '12')
      text.setAttribute('fill', '#333333')
      text.textContent = labelText

      group.appendChild(text)
    })
  }

  /**
   * 回退到Canvas转换
   */
  private async convertCanvasToSVG(
    canvas: HTMLCanvasElement,
    svg: SVGSVGElement,
    config: ChartSVGExportConfig
  ): Promise<void> {
    const dataURL = canvas.toDataURL('image/png')

    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    image.setAttribute('href', dataURL)
    image.setAttribute('x', '0')
    image.setAttribute('y', '0')
    image.setAttribute('width', config.width?.toString() || canvas.width.toString())
    image.setAttribute('height', config.height?.toString() || canvas.height.toString())

    svg.appendChild(image)
  }

  /**
   * 添加图表特定元素
   */
  private addChartSpecificElements(
    chart: Chart,
    svg: SVGSVGElement,
    config: ChartSVGExportConfig
  ): void {
    // 添加标题
    if (config.includeTitle && chart.options.plugins?.title?.display) {
      this.addChartTitle(chart, svg, config)
    }

    // 添加图例
    if (config.includeLegend && chart.options.plugins?.legend?.display) {
      this.addChartLegend(chart, svg, config)
    }

    // 添加坐标轴
    this.addChartAxes(chart, svg, config)
  }

  /**
   * 添加图表标题
   */
  private addChartTitle(chart: Chart, svg: SVGSVGElement, config: ChartSVGExportConfig): void {
    const titleConfig = chart.options.plugins?.title
    if (!titleConfig?.text) return

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    title.setAttribute('x', ((config.width || 800) / 2).toString())
    title.setAttribute('y', '30')
    title.setAttribute('text-anchor', 'middle')
    title.setAttribute('font-family', titleConfig.font?.family || 'Arial, sans-serif')
    title.setAttribute('font-size', (titleConfig.font?.size || 16).toString())
    title.setAttribute('font-weight', titleConfig.font?.weight || 'bold')
    title.setAttribute('fill', titleConfig.color || '#333333')
    title.textContent = titleConfig.text as string

    svg.appendChild(title)
  }

  /**
   * 添加图表图例
   */
  private addChartLegend(chart: Chart, svg: SVGSVGElement, config: ChartSVGExportConfig): void {
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
      xOffset += 150

      // 换行处理
      if (xOffset > (config.width || 800) - 150) {
        xOffset = 20
        yOffset += 20
      }
    })

    svg.appendChild(legendGroup)
  }

  /**
   * 添加坐标轴
   */
  private addChartAxes(chart: Chart, svg: SVGSVGElement, config: ChartSVGExportConfig): void {
    // 简化实现：添加基本的坐标轴线
    const chartArea = chart.chartArea

    // X轴
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    xAxis.setAttribute('x1', chartArea.left.toString())
    xAxis.setAttribute('y1', chartArea.bottom.toString())
    xAxis.setAttribute('x2', chartArea.right.toString())
    xAxis.setAttribute('y2', chartArea.bottom.toString())
    xAxis.setAttribute('stroke', '#666666')
    xAxis.setAttribute('stroke-width', '1')
    svg.appendChild(xAxis)

    // Y轴
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    yAxis.setAttribute('x1', chartArea.left.toString())
    yAxis.setAttribute('y1', chartArea.top.toString())
    yAxis.setAttribute('x2', chartArea.left.toString())
    yAxis.setAttribute('y2', chartArea.bottom.toString())
    yAxis.setAttribute('stroke', '#666666')
    yAxis.setAttribute('stroke-width', '1')
    svg.appendChild(yAxis)
  }

  /**
   * 应用图表样式
   */
  private applyChartStyling(svg: SVGSVGElement, config: ChartSVGExportConfig): void {
    // 应用字体设置
    this.applyFontSettings(svg, config)

    // 应用颜色方案
    this.applyColorScheme(svg, config)

    // 应用渐变填充
    if (config.gradientFills) {
      this.addGradientDefinitions(svg, config)
    }

    // 应用阴影效果
    if (config.shadowEffects) {
      this.addShadowDefinitions(svg, config)
    }

    // 应用透明度
    this.applyOpacitySettings(svg, config)

    // 应用样式优化
    if (config.styling?.inlineStyles) {
      this.inlineAllStyles(svg)
    }
  }

  /**
   * 应用字体设置
   */
  private applyFontSettings(svg: SVGSVGElement, config: ChartSVGExportConfig): void {
    const textElements = svg.querySelectorAll('text, tspan')

    textElements.forEach((element) => {
      const textElement = element as SVGTextElement

      if (config.fontFamily) {
        textElement.setAttribute('font-family', config.fontFamily)
      }

      if (config.fontSize) {
        textElement.setAttribute('font-size', config.fontSize.toString())
      }

      if (config.fontWeight) {
        textElement.setAttribute('font-weight', config.fontWeight)
      }

      if (config.textColor) {
        textElement.setAttribute('fill', config.textColor)
      }
    })
  }

  /**
   * 应用颜色方案
   */
  private applyColorScheme(svg: SVGSVGElement, config: ChartSVGExportConfig): void {
    switch (config.colorScheme) {
      case 'monochrome':
        this.applyMonochromeColors(svg)
        break
      case 'high-contrast':
        this.applyHighContrastColors(svg)
        break
      case 'print-friendly':
        this.applyPrintFriendlyColors(svg)
        break
      case 'dark-mode':
        this.applyDarkModeColors(svg)
        break
      case 'custom':
        this.applyCustomColors(svg, config.customColorPalette || [])
        break
      default:
        // 保持原始颜色
        break
    }
  }

  /**
   * 应用透明度设置
   */
  private applyOpacitySettings(svg: SVGSVGElement, config: ChartSVGExportConfig): void {
    if (config.fillOpacity !== undefined) {
      const fillElements = svg.querySelectorAll('[fill]:not([fill="none"])')
      fillElements.forEach((element) => {
        element.setAttribute('fill-opacity', config.fillOpacity!.toString())
      })
    }

    if (config.strokeOpacity !== undefined) {
      const strokeElements = svg.querySelectorAll('[stroke]:not([stroke="none"])')
      strokeElements.forEach((element) => {
        element.setAttribute('stroke-opacity', config.strokeOpacity!.toString())
      })
    }
  }

  /**
   * 应用单色配色方案
   */
  private applyMonochromeColors(svg: SVGSVGElement): void {
    const elements = svg.querySelectorAll('[fill]:not([fill="none"])')
    elements.forEach((element, index) => {
      const grayValue = 50 + (index * 30) % 200
      element.setAttribute('fill', `rgb(${grayValue}, ${grayValue}, ${grayValue})`)
    })
  }

  /**
   * 应用高对比度配色方案
   */
  private applyHighContrastColors(svg: SVGSVGElement): void {
    const highContrastColors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00']
    const elements = svg.querySelectorAll('[fill]:not([fill="none"])')
    elements.forEach((element, index) => {
      element.setAttribute('fill', highContrastColors[index % highContrastColors.length])
    })
  }

  /**
   * 应用打印友好配色方案
   */
  private applyPrintFriendlyColors(svg: SVGSVGElement): void {
    const printColors = ['#000000', '#666666', '#999999', '#CCCCCC']
    const elements = svg.querySelectorAll('[fill]:not([fill="none"])')
    elements.forEach((element, index) => {
      element.setAttribute('fill', printColors[index % printColors.length])
    })
  }

  /**
   * 应用暗色模式颜色
   */
  private applyDarkModeColors(svg: SVGSVGElement): void {
    const darkColors = ['#BB86FC', '#03DAC6', '#CF6679', '#FFB74D', '#81C784', '#64B5F6']
    const elements = svg.querySelectorAll('[fill]:not([fill="none"])')

    elements.forEach((element, index) => {
      element.setAttribute('fill', darkColors[index % darkColors.length])
    })

    // 更新背景色为暗色
    const background = svg.querySelector('rect[width="100%"][height="100%"]')
    if (background) {
      background.setAttribute('fill', '#121212')
    }

    // 更新文本颜色
    const textElements = svg.querySelectorAll('text, tspan')
    textElements.forEach((element) => {
      element.setAttribute('fill', '#FFFFFF')
    })
  }

  /**
   * 应用自定义颜色调色板
   */
  private applyCustomColors(svg: SVGSVGElement, palette: string[]): void {
    if (palette.length === 0) return

    const elements = svg.querySelectorAll('[fill]:not([fill="none"])')
    elements.forEach((element, index) => {
      element.setAttribute('fill', palette[index % palette.length])
    })
  }

  /**
   * 添加渐变定义
   */
  private addGradientDefinitions(svg: SVGSVGElement, config: ChartSVGExportConfig): void {
    // 创建defs元素
    let defs = svg.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      svg.insertBefore(defs, svg.firstChild)
    }

    // 创建线性渐变
    const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    linearGradient.setAttribute('id', 'chartGradient')
    linearGradient.setAttribute('x1', '0%')
    linearGradient.setAttribute('y1', '0%')
    linearGradient.setAttribute('x2', '0%')
    linearGradient.setAttribute('y2', '100%')

    // 添加渐变停止点
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop1.setAttribute('offset', '0%')
    stop1.setAttribute('stop-color', '#3B82F6')
    stop1.setAttribute('stop-opacity', '0.8')

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop2.setAttribute('offset', '100%')
    stop2.setAttribute('stop-color', '#1E40AF')
    stop2.setAttribute('stop-opacity', '0.4')

    linearGradient.appendChild(stop1)
    linearGradient.appendChild(stop2)
    defs.appendChild(linearGradient)

    // 应用渐变到填充元素
    const fillElements = svg.querySelectorAll('[fill]:not([fill="none"])')
    fillElements.forEach((element, index) => {
      if (index % 2 === 0) { // 只对部分元素应用渐变
        element.setAttribute('fill', 'url(#chartGradient)')
      }
    })
  }

  /**
   * 添加阴影定义
   */
  private addShadowDefinitions(svg: SVGSVGElement, config: ChartSVGExportConfig): void {
    // 创建defs元素
    let defs = svg.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      svg.insertBefore(defs, svg.firstChild)
    }

    // 创建阴影滤镜
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
    filter.setAttribute('id', 'chartShadow')
    filter.setAttribute('x', '-50%')
    filter.setAttribute('y', '-50%')
    filter.setAttribute('width', '200%')
    filter.setAttribute('height', '200%')

    // 添加高斯模糊
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur')
    feGaussianBlur.setAttribute('in', 'SourceAlpha')
    feGaussianBlur.setAttribute('stdDeviation', '3')
    feGaussianBlur.setAttribute('result', 'blur')

    // 添加偏移
    const feOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset')
    feOffset.setAttribute('in', 'blur')
    feOffset.setAttribute('dx', '2')
    feOffset.setAttribute('dy', '2')
    feOffset.setAttribute('result', 'offsetBlur')

    // 合并阴影和原图
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge')
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
    feMergeNode1.setAttribute('in', 'offsetBlur')
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
    feMergeNode2.setAttribute('in', 'SourceGraphic')

    feMerge.appendChild(feMergeNode1)
    feMerge.appendChild(feMergeNode2)

    filter.appendChild(feGaussianBlur)
    filter.appendChild(feOffset)
    filter.appendChild(feMerge)
    defs.appendChild(filter)

    // 应用阴影到主要元素
    const mainElements = svg.querySelectorAll('path, rect, circle, ellipse')
    mainElements.forEach((element) => {
      element.setAttribute('filter', 'url(#chartShadow)')
    })
  }

  /**
   * 优化图表SVG
   */
  private optimizeChartSVG(svg: SVGSVGElement): void {
    // 移除重复的样式属性
    this.removeDuplicateStyles(svg)

    // 合并相似的路径
    this.mergeSimilarPaths(svg)

    // 优化数值精度
    this.optimizeNumericPrecision(svg)
  }

  /**
   * 移除重复的样式属性
   */
  private removeDuplicateStyles(svg: SVGSVGElement): void {
    const styleMap = new Map<string, string>()
    const elements = svg.querySelectorAll('*')

    elements.forEach(element => {
      const styles = ['fill', 'stroke', 'stroke-width', 'font-family', 'font-size']
      const elementStyles: string[] = []

      styles.forEach(style => {
        const value = element.getAttribute(style)
        if (value) {
          elementStyles.push(`${style}:${value}`)
        }
      })

      if (elementStyles.length > 0) {
        const styleString = elementStyles.join(';')
        const existingClass = styleMap.get(styleString)

        if (existingClass) {
          element.setAttribute('class', existingClass)
          styles.forEach(style => element.removeAttribute(style))
        } else {
          const className = `style-${styleMap.size}`
          styleMap.set(styleString, className)
          element.setAttribute('class', className)
          styles.forEach(style => element.removeAttribute(style))
        }
      }
    })

    // 添加样式定义
    if (styleMap.size > 0) {
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
      let css = ''
      styleMap.forEach((className, styleString) => {
        css += `.${className} { ${styleString} }\n`
      })
      style.textContent = css
      svg.insertBefore(style, svg.firstChild)
    }
  }

  /**
   * 合并相似的路径
   */
  private mergeSimilarPaths(svg: SVGSVGElement): void {
    const paths = svg.querySelectorAll('path')
    const pathGroups = new Map<string, SVGPathElement[]>()

    paths.forEach(path => {
      const style = path.getAttribute('style') || ''
      const stroke = path.getAttribute('stroke') || ''
      const fill = path.getAttribute('fill') || ''
      const key = `${style}-${stroke}-${fill}`

      if (!pathGroups.has(key)) {
        pathGroups.set(key, [])
      }
      pathGroups.get(key)!.push(path)
    })

    pathGroups.forEach(group => {
      if (group.length > 1) {
        const combinedPath = group[0]
        let combinedD = combinedPath.getAttribute('d') || ''

        for (let i = 1; i < group.length; i++) {
          const pathD = group[i].getAttribute('d') || ''
          combinedD += ' ' + pathD
          group[i].remove()
        }

        combinedPath.setAttribute('d', combinedD)
      }
    })
  }

  /**
   * 优化数值精度
   */
  private optimizeNumericPrecision(svg: SVGSVGElement): void {
    const numericAttributes = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2']
    const elements = svg.querySelectorAll('*')

    elements.forEach(element => {
      numericAttributes.forEach(attr => {
        const value = element.getAttribute(attr)
        if (value && !isNaN(parseFloat(value))) {
          const rounded = parseFloat(value).toFixed(2)
          element.setAttribute(attr, rounded)
        }
      })

      // 优化路径数据
      const d = element.getAttribute('d')
      if (d) {
        const optimizedD = d.replace(/(\d+\.\d{3,})/g, (match) => {
          return parseFloat(match).toFixed(2)
        })
        element.setAttribute('d', optimizedD)
      }
    })
  }

  /**
   * 使SVG响应式
   */
  private makeResponsive(svg: SVGSVGElement, config: ChartSVGExportConfig): void {
    // 移除固定宽高
    svg.removeAttribute('width')
    svg.removeAttribute('height')

    // 添加响应式样式
    svg.setAttribute('style', `
      width: 100%;
      height: auto;
      max-width: ${config.maxWidth || 1200}px;
      min-width: ${config.minWidth || 300}px;
    `)
  }

  /**
   * 添加图表可访问性
   */
  private addChartAccessibility(
    chart: Chart,
    svg: SVGSVGElement,
    config: ChartSVGExportConfig
  ): void {
    // 添加role属性
    svg.setAttribute('role', 'img')

    // 添加aria-label
    const title = chart.options.plugins?.title?.text
    if (title) {
      svg.setAttribute('aria-label', `Chart: ${title}`)
    } else {
      svg.setAttribute('aria-label', `${chart.config.type} chart with ${chart.data.datasets.length} datasets`)
    }

    // 添加详细描述
    const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc')
    const description = this.generateChartDescription(chart)
    desc.textContent = description
    svg.appendChild(desc)
  }

  /**
   * 生成图表描述
   */
  private generateChartDescription(chart: Chart): string {
    const type = chart.config.type
    const datasets = chart.data.datasets
    const labels = chart.data.labels || []

    let description = `This is a ${type} chart`

    if (datasets.length === 1) {
      description += ` showing ${datasets[0].label || 'data'}`
    } else {
      description += ` comparing ${datasets.length} datasets`
    }

    if (labels.length > 0) {
      description += ` across ${labels.length} categories`
    }

    description += `. The chart contains ${datasets.reduce((sum, dataset) => sum + (dataset.data?.length || 0), 0)} data points.`

    return description
  }

  /**
   * 完成图表SVG导出
   */
  private finalizeChartSVGExport(
    chart: Chart,
    svg: SVGSVGElement,
    config: ChartSVGExportConfig
  ): ChartSVGExportResult {
    // 序列化SVG
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)

    // 创建Blob
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })

    // 计算图表信息
    const chartInfo = {
      type: chart.config.type || 'unknown',
      datasets: chart.data.datasets.length,
      dataPoints: chart.data.datasets.reduce((sum, dataset) => sum + (dataset.data?.length || 0), 0),
      hasTitle: !!(chart.options.plugins?.title?.display && chart.options.plugins.title.text),
      hasLegend: !!(chart.options.plugins?.legend?.display)
    }

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
      metadata,
      chartInfo
    }
  }
}

// 导出单例实例
export const chartSVGExporter = new ChartSVGExporter()
