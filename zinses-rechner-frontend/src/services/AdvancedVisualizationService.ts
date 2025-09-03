/**
 * 高级数据可视化服务
 * 提供复杂图表类型和交互式可视化功能
 */

import * as d3 from 'd3'
import type { CalculationResult } from '@/types/calculator'

// 图表类型定义
export type ChartType = 
  | 'heatmap'           // 热力图
  | 'sankey'            // 桑基图
  | 'treemap'           // 树状图
  | 'sunburst'          // 旭日图
  | 'radar'             // 雷达图
  | 'gauge'             // 仪表盘
  | 'waterfall'         // 瀑布图
  | 'funnel'            // 漏斗图
  | 'bubble'            // 气泡图
  | 'network'           // 网络图

// 图表配置接口
export interface ChartConfig {
  type: ChartType
  width: number
  height: number
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
  colors: string[]
  theme: 'light' | 'dark'
  interactive: boolean
  animation: {
    enabled: boolean
    duration: number
    easing: string
  }
  tooltip: {
    enabled: boolean
    format: (d: any) => string
  }
  legend: {
    enabled: boolean
    position: 'top' | 'right' | 'bottom' | 'left'
  }
}

// 数据接口
export interface ChartData {
  id: string
  label: string
  value: number
  category?: string
  children?: ChartData[]
  source?: string
  target?: string
  metadata?: Record<string, any>
}

// 热力图数据接口
export interface HeatmapData {
  x: string | number
  y: string | number
  value: number
  label?: string
}

// 桑基图数据接口
export interface SankeyData {
  nodes: Array<{ id: string; name: string; category?: string }>
  links: Array<{ source: string; target: string; value: number }>
}

// 网络图数据接口
export interface NetworkData {
  nodes: Array<{ id: string; name: string; group?: number; size?: number }>
  links: Array<{ source: string; target: string; value?: number }>
}

export class AdvancedVisualizationService {
  private static instance: AdvancedVisualizationService
  private defaultConfig: Partial<ChartConfig> = {
    width: 800,
    height: 600,
    margin: { top: 20, right: 20, bottom: 40, left: 60 },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    theme: 'light',
    interactive: true,
    animation: {
      enabled: true,
      duration: 750,
      easing: 'cubic-in-out'
    },
    tooltip: {
      enabled: true,
      format: (d: any) => `${d.label}: ${d.value}`
    },
    legend: {
      enabled: true,
      position: 'right'
    }
  }

  private constructor() {}

  public static getInstance(): AdvancedVisualizationService {
    if (!AdvancedVisualizationService.instance) {
      AdvancedVisualizationService.instance = new AdvancedVisualizationService()
    }
    return AdvancedVisualizationService.instance
  }

  /**
   * 创建热力图
   */
  public createHeatmap(
    container: HTMLElement,
    data: HeatmapData[],
    config: Partial<ChartConfig> = {}
  ): void {
    const finalConfig = { ...this.defaultConfig, ...config }
    const { width, height, margin, colors, theme } = finalConfig

    // 清空容器
    d3.select(container).selectAll('*').remove()

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin!.left},${margin!.top})`)

    const innerWidth = width! - margin!.left - margin!.right
    const innerHeight = height! - margin!.top - margin!.bottom

    // 获取唯一的x和y值
    const xValues = Array.from(new Set(data.map(d => d.x))).sort()
    const yValues = Array.from(new Set(data.map(d => d.y))).sort()

    // 创建比例尺
    const xScale = d3.scaleBand()
      .domain(xValues.map(String))
      .range([0, innerWidth])
      .padding(0.1)

    const yScale = d3.scaleBand()
      .domain(yValues.map(String))
      .range([0, innerHeight])
      .padding(0.1)

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain(d3.extent(data, d => d.value) as [number, number])

    // 创建热力图矩形
    g.selectAll('.heatmap-cell')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => xScale(String(d.x))!)
      .attr('y', d => yScale(String(d.y))!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
      .attr('stroke-width', 1)

    // 添加坐标轴
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale))

    // 添加交互功能
    if (finalConfig.interactive) {
      this.addHeatmapInteractivity(g, data, colorScale, finalConfig)
    }
  }

  /**
   * 创建桑基图
   */
  public createSankey(
    container: HTMLElement,
    data: SankeyData,
    config: Partial<ChartConfig> = {}
  ): void {
    const finalConfig = { ...this.defaultConfig, ...config }
    const { width, height, margin, colors } = finalConfig

    // 清空容器
    d3.select(container).selectAll('*').remove()

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin!.left},${margin!.top})`)

    const innerWidth = width! - margin!.left - margin!.right
    const innerHeight = height! - margin!.top - margin!.bottom

    // 使用D3的桑基图布局
    const sankey = d3.sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [innerWidth - 1, innerHeight - 6]])

    const { nodes, links } = sankey({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d }))
    })

    // 创建颜色比例尺
    const colorScale = d3.scaleOrdinal()
      .domain(data.nodes.map(d => d.category || d.name))
      .range(colors!)

    // 绘制链接
    g.append('g')
      .selectAll('.sankey-link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'sankey-link')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', d => colorScale((d.source as any).category || (d.source as any).name))
      .attr('stroke-width', d => Math.max(1, (d as any).width))
      .attr('fill', 'none')
      .attr('opacity', 0.6)

    // 绘制节点
    g.append('g')
      .selectAll('.sankey-node')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('class', 'sankey-node')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', d => colorScale((d as any).category || (d as any).name))
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5)

    // 添加节点标签
    g.append('g')
      .selectAll('.sankey-label')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'sankey-label')
      .attr('x', (d: any) => d.x0 < innerWidth / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < innerWidth / 2 ? 'start' : 'end')
      .text((d: any) => d.name)
      .style('font-size', '12px')
      .style('fill', finalConfig.theme === 'dark' ? '#F3F4F6' : '#374151')

    // 添加交互功能
    if (finalConfig.interactive) {
      this.addSankeyInteractivity(g, { nodes, links }, finalConfig)
    }
  }

  /**
   * 创建仪表盘图
   */
  public createGauge(
    container: HTMLElement,
    value: number,
    config: Partial<ChartConfig> & {
      min?: number
      max?: number
      thresholds?: Array<{ value: number; color: string; label: string }>
    } = {}
  ): void {
    const finalConfig = { 
      ...this.defaultConfig, 
      min: 0, 
      max: 100, 
      thresholds: [
        { value: 30, color: '#EF4444', label: 'Low' },
        { value: 70, color: '#F59E0B', label: 'Medium' },
        { value: 100, color: '#10B981', label: 'High' }
      ],
      ...config 
    }
    
    const { width, height, min, max, thresholds, theme } = finalConfig
    const radius = Math.min(width!, height!) / 2 - 40

    // 清空容器
    d3.select(container).selectAll('*').remove()

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${width! / 2},${height! / 2})`)

    // 创建角度比例尺
    const angleScale = d3.scaleLinear()
      .domain([min!, max!])
      .range([-Math.PI / 2, Math.PI / 2])

    // 创建弧生成器
    const arc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)

    // 绘制背景弧
    g.append('path')
      .datum({ endAngle: Math.PI / 2 })
      .style('fill', theme === 'dark' ? '#374151' : '#E5E7EB')
      .attr('d', arc as any)

    // 绘制阈值段
    let prevAngle = -Math.PI / 2
    thresholds!.forEach((threshold, i) => {
      const endAngle = angleScale(threshold.value)
      
      g.append('path')
        .datum({ endAngle })
        .style('fill', threshold.color)
        .style('opacity', 0.3)
        .attr('d', d3.arc()
          .innerRadius(radius - 20)
          .outerRadius(radius)
          .startAngle(prevAngle) as any
        )
      
      prevAngle = endAngle
    })

    // 绘制指针
    const needleLength = radius - 30
    const needleAngle = angleScale(value)
    
    g.append('line')
      .attr('class', 'gauge-needle')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', needleLength * Math.cos(needleAngle))
      .attr('y2', needleLength * Math.sin(needleAngle))
      .attr('stroke', theme === 'dark' ? '#F3F4F6' : '#374151')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')

    // 添加中心圆
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)
      .style('fill', theme === 'dark' ? '#F3F4F6' : '#374151')

    // 添加数值标签
    g.append('text')
      .attr('class', 'gauge-value')
      .attr('text-anchor', 'middle')
      .attr('y', 30)
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', theme === 'dark' ? '#F3F4F6' : '#374151')
      .text(value.toFixed(1))

    // 添加刻度
    const ticks = d3.range(min!, max! + 1, (max! - min!) / 10)
    g.selectAll('.gauge-tick')
      .data(ticks)
      .enter()
      .append('line')
      .attr('class', 'gauge-tick')
      .attr('x1', d => (radius - 15) * Math.cos(angleScale(d)))
      .attr('y1', d => (radius - 15) * Math.sin(angleScale(d)))
      .attr('x2', d => (radius - 5) * Math.cos(angleScale(d)))
      .attr('y2', d => (radius - 5) * Math.sin(angleScale(d)))
      .attr('stroke', theme === 'dark' ? '#9CA3AF' : '#6B7280')
      .attr('stroke-width', 1)

    // 添加刻度标签
    g.selectAll('.gauge-tick-label')
      .data(ticks.filter((_, i) => i % 2 === 0))
      .enter()
      .append('text')
      .attr('class', 'gauge-tick-label')
      .attr('x', d => (radius + 10) * Math.cos(angleScale(d)))
      .attr('y', d => (radius + 10) * Math.sin(angleScale(d)))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('fill', theme === 'dark' ? '#9CA3AF' : '#6B7280')
      .text(d => d.toString())
  }

  /**
   * 创建旭日图
   */
  public createSunburst(
    container: HTMLElement,
    data: ChartData,
    config: Partial<ChartConfig> = {}
  ): void {
    const finalConfig = { ...this.defaultConfig, ...config }
    const { width, height, colors, theme } = finalConfig
    const radius = Math.min(width!, height!) / 2

    // 清空容器
    d3.select(container).selectAll('*').remove()

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${width! / 2},${height! / 2})`)

    // 创建层次结构
    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    // 创建分区布局
    const partition = d3.partition()
      .size([2 * Math.PI, radius])

    partition(root)

    // 创建颜色比例尺
    const colorScale = d3.scaleOrdinal()
      .domain(root.descendants().map(d => d.data.category || d.data.label))
      .range(colors!)

    // 创建弧生成器
    const arc = d3.arc<d3.HierarchyRectangularNode<ChartData>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1)

    // 绘制弧段
    g.selectAll('.sunburst-arc')
      .data(root.descendants().filter(d => d.depth > 0))
      .enter()
      .append('path')
      .attr('class', 'sunburst-arc')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.category || d.data.label))
      .attr('stroke', theme === 'dark' ? '#374151' : '#FFFFFF')
      .attr('stroke-width', 2)
      .style('opacity', 0.8)

    // 添加交互功能
    if (finalConfig.interactive) {
      this.addSunburstInteractivity(g, root, arc, finalConfig)
    }
  }

  /**
   * 添加热力图交互功能
   */
  private addHeatmapInteractivity(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: HeatmapData[],
    colorScale: d3.ScaleSequential<string, never>,
    config: Partial<ChartConfig>
  ): void {
    // 创建工具提示
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', config.theme === 'dark' ? '#374151' : '#FFFFFF')
      .style('border', '1px solid #E5E7EB')
      .style('border-radius', '6px')
      .style('padding', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')

    g.selectAll('.heatmap-cell')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke-width', 2)

        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9)

        tooltip.html(config.tooltip?.format?.(d) || `${d.label || `${d.x}, ${d.y}`}: ${d.value}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', 1)
          .style('stroke-width', 1)

        tooltip.transition()
          .duration(500)
          .style('opacity', 0)
      })
  }

  /**
   * 添加桑基图交互功能
   */
  private addSankeyInteractivity(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: { nodes: any[]; links: any[] },
    config: Partial<ChartConfig>
  ): void {
    // 节点悬停效果
    g.selectAll('.sankey-node')
      .on('mouseover', function(event, d: any) {
        d3.select(this).style('opacity', 0.8)
        
        // 高亮相关链接
        g.selectAll('.sankey-link')
          .style('opacity', (link: any) => 
            link.source === d || link.target === d ? 0.8 : 0.2
          )
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 1)
        g.selectAll('.sankey-link').style('opacity', 0.6)
      })

    // 链接悬停效果
    g.selectAll('.sankey-link')
      .on('mouseover', function(event, d: any) {
        d3.select(this).style('opacity', 0.8)
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.6)
      })
  }

  /**
   * 添加旭日图交互功能
   */
  private addSunburstInteractivity(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    root: d3.HierarchyNode<ChartData>,
    arc: d3.Arc<any, d3.HierarchyRectangularNode<ChartData>>,
    config: Partial<ChartConfig>
  ): void {
    g.selectAll('.sunburst-arc')
      .on('mouseover', function(event, d: any) {
        d3.select(this).style('opacity', 1)
        
        // 高亮祖先路径
        const ancestors = d.ancestors()
        g.selectAll('.sunburst-arc')
          .style('opacity', (node: any) => 
            ancestors.includes(node) ? 1 : 0.3
          )
      })
      .on('mouseout', function() {
        g.selectAll('.sunburst-arc').style('opacity', 0.8)
      })
      .on('click', function(event, d: any) {
        // 点击缩放功能
        const newRoot = d.depth > 0 ? d : root
        
        // 重新计算角度
        newRoot.each((node: any) => {
          node.target = {
            x0: Math.max(0, Math.min(1, (node.x0 - newRoot.x0) / (newRoot.x1 - newRoot.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (node.x1 - newRoot.x0) / (newRoot.x1 - newRoot.x0))) * 2 * Math.PI,
            y0: Math.max(0, node.y0 - newRoot.y0),
            y1: Math.max(0, node.y1 - newRoot.y0)
          }
        })

        // 动画过渡
        g.selectAll('.sunburst-arc')
          .transition()
          .duration(config.animation?.duration || 750)
          .attrTween('d', (d: any) => {
            const interpolate = d3.interpolate(d.current, d.target)
            return (t: number) => {
              d.current = interpolate(t)
              return arc(d.current)
            }
          })
      })
  }

  /**
   * 从计算结果生成图表数据
   */
  public generateChartDataFromCalculation(
    result: CalculationResult,
    chartType: ChartType
  ): ChartData | HeatmapData[] | SankeyData | NetworkData {
    switch (chartType) {
      case 'heatmap':
        return this.generateHeatmapData(result)
      case 'sankey':
        return this.generateSankeyData(result)
      case 'sunburst':
        return this.generateSunburstData(result)
      default:
        return this.generateGenericChartData(result)
    }
  }

  private generateHeatmapData(result: CalculationResult): HeatmapData[] {
    // 基于年度数据生成热力图数据
    if (result.yearlyBreakdown) {
      return result.yearlyBreakdown.map((item, index) => ({
        x: index + 1,
        y: 'Interest',
        value: item.interest,
        label: `Year ${index + 1}: €${item.interest.toFixed(2)}`
      }))
    }
    return []
  }

  private generateSankeyData(result: CalculationResult): SankeyData {
    // 生成资金流向的桑基图数据
    return {
      nodes: [
        { id: 'initial', name: 'Anfangskapital' },
        { id: 'contributions', name: 'Einzahlungen' },
        { id: 'interest', name: 'Zinsen' },
        { id: 'final', name: 'Endkapital' }
      ],
      links: [
        { source: 'initial', target: 'final', value: result.initialAmount || 0 },
        { source: 'contributions', target: 'final', value: result.totalContributions || 0 },
        { source: 'interest', target: 'final', value: result.totalInterest || 0 }
      ]
    }
  }

  private generateSunburstData(result: CalculationResult): ChartData {
    // 生成层次化的旭日图数据
    return {
      id: 'root',
      label: 'Gesamtkapital',
      value: result.finalAmount,
      children: [
        {
          id: 'initial',
          label: 'Anfangskapital',
          value: result.initialAmount || 0
        },
        {
          id: 'contributions',
          label: 'Einzahlungen',
          value: result.totalContributions || 0
        },
        {
          id: 'interest',
          label: 'Zinserträge',
          value: result.totalInterest || 0
        }
      ]
    }
  }

  private generateGenericChartData(result: CalculationResult): ChartData {
    return {
      id: 'result',
      label: 'Ergebnis',
      value: result.finalAmount
    }
  }
}

// 导出单例实例
export const advancedVisualizationService = AdvancedVisualizationService.getInstance()
