/**
 * 增强数据可视化管理器
 * 实现热力图、桑基图、3D图表等高级可视化功能
 */

import { ref, reactive } from 'vue'
import * as d3 from 'd3'
import * as THREE from 'three'

// 图表类型枚举
export type EnhancedChartType = 'heatmap' | 'sankey' | 'treemap' | 'sunburst' | 'chord' | 'network' | '3d-surface' | '3d-scatter' | 'waterfall' | 'funnel'

// 热力图数据接口
export interface HeatmapData {
  x: string
  y: string
  value: number
  color?: string
  tooltip?: string
}

// 桑基图数据接口
export interface SankeyData {
  nodes: Array<{
    id: string
    name: string
    category?: string
    value?: number
  }>
  links: Array<{
    source: string
    target: string
    value: number
    color?: string
  }>
}

// 树状图数据接口
export interface TreemapData {
  name: string
  value?: number
  children?: TreemapData[]
  color?: string
  category?: string
}

// 3D图表数据接口
export interface Chart3DData {
  x: number
  y: number
  z: number
  value?: number
  color?: string
  label?: string
}

// 瀑布图数据接口
export interface WaterfallData {
  category: string
  value: number
  type: 'positive' | 'negative' | 'total'
  color?: string
}

// 图表配置接口
export interface EnhancedChartConfig {
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
  colors: string[]
  animation: {
    duration: number
    easing: string
  }
  interaction: {
    hover: boolean
    click: boolean
    zoom: boolean
    brush: boolean
  }
  tooltip: {
    enabled: boolean
    template?: string
  }
  legend: {
    enabled: boolean
    position: 'top' | 'right' | 'bottom' | 'left'
  }
}

// 图表实例接口
export interface ChartInstance {
  id: string
  type: EnhancedChartType
  container: HTMLElement
  config: EnhancedChartConfig
  data: any
  svg?: d3.Selection<SVGSVGElement, unknown, null, undefined>
  scene?: THREE.Scene
  renderer?: THREE.WebGLRenderer
  camera?: THREE.Camera
  destroy: () => void
  update: (newData: any) => void
  resize: (width: number, height: number) => void
  export: (format: 'png' | 'svg' | 'pdf') => Promise<Blob>
}

/**
 * 增强数据可视化管理器类
 */
export class EnhancedVisualizationManager {
  private static instance: EnhancedVisualizationManager

  // 图表实例管理
  private chartInstances = new Map<string, ChartInstance>()

  // 默认配置
  private defaultConfig: EnhancedChartConfig = {
    width: 800,
    height: 600,
    margin: { top: 20, right: 20, bottom: 40, left: 60 },
    colors: [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
    ],
    animation: {
      duration: 750,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    interaction: {
      hover: true,
      click: true,
      zoom: false,
      brush: false
    },
    tooltip: {
      enabled: true
    },
    legend: {
      enabled: true,
      position: 'right'
    }
  }

  // 统计信息
  public readonly stats = reactive({
    totalCharts: 0,
    chartsByType: {} as Record<EnhancedChartType, number>,
    averageRenderTime: 0,
    lastRenderTime: null as Date | null
  })

  // 状态
  public readonly isRendering = ref(false)

  public static getInstance(): EnhancedVisualizationManager {
    if (!EnhancedVisualizationManager.instance) {
      EnhancedVisualizationManager.instance = new EnhancedVisualizationManager()
    }
    return EnhancedVisualizationManager.instance
  }

  constructor() {
    console.log('📊 Enhanced visualization manager initialized')
  }

  /**
   * 创建热力图
   */
  public createHeatmap(
    container: HTMLElement,
    data: HeatmapData[],
    config?: Partial<EnhancedChartConfig>
  ): ChartInstance {
    const chartConfig = { ...this.defaultConfig, ...config }
    const chartId = `heatmap-${Date.now()}`

    this.isRendering.value = true
    const startTime = Date.now()

    try {
      // 清空容器
      d3.select(container).selectAll('*').remove()

      // 创建SVG
      const svg = d3.select(container)
        .append('svg')
        .attr('width', chartConfig.width)
        .attr('height', chartConfig.height)

      const g = svg.append('g')
        .attr('transform', `translate(${chartConfig.margin.left},${chartConfig.margin.top})`)

      const innerWidth = chartConfig.width - chartConfig.margin.left - chartConfig.margin.right
      const innerHeight = chartConfig.height - chartConfig.margin.top - chartConfig.margin.bottom

      // 获取唯一的x和y值
      const xValues = Array.from(new Set(data.map(d => d.x)))
      const yValues = Array.from(new Set(data.map(d => d.y)))

      // 创建比例尺
      const xScale = d3.scaleBand()
        .domain(xValues)
        .range([0, innerWidth])
        .padding(0.1)

      const yScale = d3.scaleBand()
        .domain(yValues)
        .range([0, innerHeight])
        .padding(0.1)

      const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(d3.extent(data, d => d.value) as [number, number])

      // 创建热力图单元格
      const cells = g.selectAll('.heatmap-cell')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'heatmap-cell')
        .attr('x', d => xScale(d.x)!)
        .attr('y', d => yScale(d.y)!)
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => d.color || colorScale(d.value))
        .attr('opacity', 0)

      // 添加动画
      cells.transition()
        .duration(chartConfig.animation.duration)
        .attr('opacity', 1)

      // 添加交互
      if (chartConfig.interaction.hover) {
        cells
          .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8)
            
            if (chartConfig.tooltip.enabled) {
              // 显示工具提示
              const tooltip = d3.select('body').append('div')
                .attr('class', 'heatmap-tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.8)')
                .style('color', 'white')
                .style('padding', '8px')
                .style('border-radius', '4px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('opacity', 0)

              tooltip.html(d.tooltip || `${d.x} - ${d.y}: ${d.value}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .transition()
                .duration(200)
                .style('opacity', 1)
            }
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 1)
            d3.selectAll('.heatmap-tooltip').remove()
          })
      }

      // 添加坐标轴
      const xAxis = d3.axisBottom(xScale)
      const yAxis = d3.axisLeft(yScale)

      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)

      g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)

      // 创建图表实例
      const chartInstance: ChartInstance = {
        id: chartId,
        type: 'heatmap',
        container,
        config: chartConfig,
        data,
        svg,
        destroy: () => this.destroyChart(chartId),
        update: (newData: HeatmapData[]) => this.updateHeatmap(chartId, newData),
        resize: (width: number, height: number) => this.resizeChart(chartId, width, height),
        export: (format) => this.exportChart(chartId, format)
      }

      this.chartInstances.set(chartId, chartInstance)
      this.updateStats('heatmap', Date.now() - startTime)

      return chartInstance

    } finally {
      this.isRendering.value = false
    }
  }

  /**
   * 创建桑基图
   */
  public createSankeyDiagram(
    container: HTMLElement,
    data: SankeyData,
    config?: Partial<EnhancedChartConfig>
  ): ChartInstance {
    const chartConfig = { ...this.defaultConfig, ...config }
    const chartId = `sankey-${Date.now()}`

    this.isRendering.value = true
    const startTime = Date.now()

    try {
      // 清空容器
      d3.select(container).selectAll('*').remove()

      // 创建SVG
      const svg = d3.select(container)
        .append('svg')
        .attr('width', chartConfig.width)
        .attr('height', chartConfig.height)

      const g = svg.append('g')
        .attr('transform', `translate(${chartConfig.margin.left},${chartConfig.margin.top})`)

      const innerWidth = chartConfig.width - chartConfig.margin.left - chartConfig.margin.right
      const innerHeight = chartConfig.height - chartConfig.margin.top - chartConfig.margin.bottom

      // 创建桑基图布局
      const sankey = d3.sankey<any, any>()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [innerWidth - 1, innerHeight - 6]])

      // 处理数据
      const sankeyData = sankey({
        nodes: data.nodes.map(d => ({ ...d })),
        links: data.links.map(d => ({ ...d }))
      })

      // 创建颜色比例尺
      const colorScale = d3.scaleOrdinal(chartConfig.colors)

      // 绘制链接
      const links = g.append('g')
        .selectAll('.sankey-link')
        .data(sankeyData.links)
        .enter()
        .append('path')
        .attr('class', 'sankey-link')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', d => d.color || colorScale(d.source.name))
        .attr('stroke-width', d => Math.max(1, d.width))
        .attr('fill', 'none')
        .attr('opacity', 0.5)

      // 绘制节点
      const nodes = g.append('g')
        .selectAll('.sankey-node')
        .data(sankeyData.nodes)
        .enter()
        .append('rect')
        .attr('class', 'sankey-node')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('fill', d => colorScale(d.name))

      // 添加节点标签
      const labels = g.append('g')
        .selectAll('.sankey-label')
        .data(sankeyData.nodes)
        .enter()
        .append('text')
        .attr('class', 'sankey-label')
        .attr('x', d => d.x0 < innerWidth / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr('y', d => (d.y1 + d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => d.x0 < innerWidth / 2 ? 'start' : 'end')
        .text(d => d.name)
        .style('font-size', '12px')
        .style('fill', '#333')

      // 添加交互
      if (chartConfig.interaction.hover) {
        links
          .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8)
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.5)
          })

        nodes
          .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8)
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 1)
          })
      }

      // 创建图表实例
      const chartInstance: ChartInstance = {
        id: chartId,
        type: 'sankey',
        container,
        config: chartConfig,
        data,
        svg,
        destroy: () => this.destroyChart(chartId),
        update: (newData: SankeyData) => this.updateSankeyDiagram(chartId, newData),
        resize: (width: number, height: number) => this.resizeChart(chartId, width, height),
        export: (format) => this.exportChart(chartId, format)
      }

      this.chartInstances.set(chartId, chartInstance)
      this.updateStats('sankey', Date.now() - startTime)

      return chartInstance

    } finally {
      this.isRendering.value = false
    }
  }

  /**
   * 创建3D散点图
   */
  public create3DScatterPlot(
    container: HTMLElement,
    data: Chart3DData[],
    config?: Partial<EnhancedChartConfig>
  ): ChartInstance {
    const chartConfig = { ...this.defaultConfig, ...config }
    const chartId = `3d-scatter-${Date.now()}`

    this.isRendering.value = true
    const startTime = Date.now()

    try {
      // 清空容器
      container.innerHTML = ''

      // 创建Three.js场景
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf8f9fa)

      // 创建相机
      const camera = new THREE.PerspectiveCamera(
        75,
        chartConfig.width / chartConfig.height,
        0.1,
        1000
      )
      camera.position.set(10, 10, 10)

      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(chartConfig.width, chartConfig.height)
      container.appendChild(renderer.domElement)

      // 添加光源
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 10, 5)
      scene.add(directionalLight)

      // 创建坐标轴
      const axesHelper = new THREE.AxesHelper(5)
      scene.add(axesHelper)

      // 创建数据点
      const geometry = new THREE.SphereGeometry(0.1, 16, 16)
      const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(data, d => d.value || d.z) as [number, number])

      data.forEach(point => {
        const material = new THREE.MeshLambertMaterial({
          color: point.color || colorScale(point.value || point.z)
        })
        
        const sphere = new THREE.Mesh(geometry, material)
        sphere.position.set(point.x, point.y, point.z)
        sphere.userData = point
        scene.add(sphere)
      })

      // 添加控制器
      const controls = new (window as any).THREE.OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.25

      // 渲染循环
      const animate = () => {
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // 创建图表实例
      const chartInstance: ChartInstance = {
        id: chartId,
        type: '3d-scatter',
        container,
        config: chartConfig,
        data,
        scene,
        renderer,
        camera,
        destroy: () => this.destroy3DChart(chartId),
        update: (newData: Chart3DData[]) => this.update3DScatterPlot(chartId, newData),
        resize: (width: number, height: number) => this.resize3DChart(chartId, width, height),
        export: (format) => this.export3DChart(chartId, format)
      }

      this.chartInstances.set(chartId, chartInstance)
      this.updateStats('3d-scatter', Date.now() - startTime)

      return chartInstance

    } finally {
      this.isRendering.value = false
    }
  }

  /**
   * 创建瀑布图
   */
  public createWaterfallChart(
    container: HTMLElement,
    data: WaterfallData[],
    config?: Partial<EnhancedChartConfig>
  ): ChartInstance {
    const chartConfig = { ...this.defaultConfig, ...config }
    const chartId = `waterfall-${Date.now()}`

    this.isRendering.value = true
    const startTime = Date.now()

    try {
      // 清空容器
      d3.select(container).selectAll('*').remove()

      // 创建SVG
      const svg = d3.select(container)
        .append('svg')
        .attr('width', chartConfig.width)
        .attr('height', chartConfig.height)

      const g = svg.append('g')
        .attr('transform', `translate(${chartConfig.margin.left},${chartConfig.margin.top})`)

      const innerWidth = chartConfig.width - chartConfig.margin.left - chartConfig.margin.right
      const innerHeight = chartConfig.height - chartConfig.margin.top - chartConfig.margin.bottom

      // 计算累积值
      let cumulative = 0
      const processedData = data.map(d => {
        const start = d.type === 'total' ? 0 : cumulative
        const end = d.type === 'total' ? d.value : cumulative + d.value
        cumulative = d.type === 'total' ? d.value : cumulative + d.value
        
        return {
          ...d,
          start,
          end,
          height: Math.abs(d.value)
        }
      })

      // 创建比例尺
      const xScale = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, innerWidth])
        .padding(0.2)

      const yScale = d3.scaleLinear()
        .domain(d3.extent(processedData.flatMap(d => [d.start, d.end])) as [number, number])
        .range([innerHeight, 0])

      // 创建颜色映射
      const colorMap = {
        positive: '#10b981',
        negative: '#ef4444',
        total: '#3b82f6'
      }

      // 绘制柱子
      const bars = g.selectAll('.waterfall-bar')
        .data(processedData)
        .enter()
        .append('rect')
        .attr('class', 'waterfall-bar')
        .attr('x', d => xScale(d.category)!)
        .attr('y', d => yScale(Math.max(d.start, d.end)))
        .attr('width', xScale.bandwidth())
        .attr('height', d => Math.abs(yScale(d.start) - yScale(d.end)))
        .attr('fill', d => d.color || colorMap[d.type])
        .attr('opacity', 0)

      // 添加动画
      bars.transition()
        .duration(chartConfig.animation.duration)
        .delay((d, i) => i * 100)
        .attr('opacity', 1)

      // 添加连接线
      const connectors = g.selectAll('.waterfall-connector')
        .data(processedData.slice(0, -1))
        .enter()
        .append('line')
        .attr('class', 'waterfall-connector')
        .attr('x1', (d, i) => xScale(d.category)! + xScale.bandwidth())
        .attr('y1', d => yScale(d.end))
        .attr('x2', (d, i) => xScale(processedData[i + 1].category)!)
        .attr('y2', d => yScale(d.end))
        .attr('stroke', '#666')
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.5)

      // 添加数值标签
      const labels = g.selectAll('.waterfall-label')
        .data(processedData)
        .enter()
        .append('text')
        .attr('class', 'waterfall-label')
        .attr('x', d => xScale(d.category)! + xScale.bandwidth() / 2)
        .attr('y', d => yScale(Math.max(d.start, d.end)) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#333')
        .text(d => d.value > 0 ? `+${d.value}` : d.value.toString())

      // 添加坐标轴
      const xAxis = d3.axisBottom(xScale)
      const yAxis = d3.axisLeft(yScale)

      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)

      g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)

      // 创建图表实例
      const chartInstance: ChartInstance = {
        id: chartId,
        type: 'waterfall',
        container,
        config: chartConfig,
        data,
        svg,
        destroy: () => this.destroyChart(chartId),
        update: (newData: WaterfallData[]) => this.updateWaterfallChart(chartId, newData),
        resize: (width: number, height: number) => this.resizeChart(chartId, width, height),
        export: (format) => this.exportChart(chartId, format)
      }

      this.chartInstances.set(chartId, chartInstance)
      this.updateStats('waterfall', Date.now() - startTime)

      return chartInstance

    } finally {
      this.isRendering.value = false
    }
  }

  /**
   * 获取图表实例
   */
  public getChart(chartId: string): ChartInstance | undefined {
    return this.chartInstances.get(chartId)
  }

  /**
   * 销毁图表
   */
  public destroyChart(chartId: string): void {
    const chart = this.chartInstances.get(chartId)
    if (chart) {
      if (chart.svg) {
        chart.svg.remove()
      }
      this.chartInstances.delete(chartId)
    }
  }

  /**
   * 销毁3D图表
   */
  private destroy3DChart(chartId: string): void {
    const chart = this.chartInstances.get(chartId)
    if (chart && chart.renderer) {
      chart.renderer.dispose()
      chart.container.innerHTML = ''
      this.chartInstances.delete(chartId)
    }
  }

  /**
   * 调整图表大小
   */
  private resizeChart(chartId: string, width: number, height: number): void {
    const chart = this.chartInstances.get(chartId)
    if (chart && chart.svg) {
      chart.svg
        .attr('width', width)
        .attr('height', height)
      
      chart.config.width = width
      chart.config.height = height
    }
  }

  /**
   * 调整3D图表大小
   */
  private resize3DChart(chartId: string, width: number, height: number): void {
    const chart = this.chartInstances.get(chartId)
    if (chart && chart.renderer && chart.camera) {
      chart.renderer.setSize(width, height)
      
      if (chart.camera instanceof THREE.PerspectiveCamera) {
        chart.camera.aspect = width / height
        chart.camera.updateProjectionMatrix()
      }
      
      chart.config.width = width
      chart.config.height = height
    }
  }

  /**
   * 导出图表
   */
  private async exportChart(chartId: string, format: 'png' | 'svg' | 'pdf'): Promise<Blob> {
    const chart = this.chartInstances.get(chartId)
    if (!chart) {
      throw new Error(`Chart ${chartId} not found`)
    }

    // 这里应该实现具体的导出逻辑
    // 返回一个模拟的Blob
    return new Blob([''], { type: `image/${format}` })
  }

  /**
   * 导出3D图表
   */
  private async export3DChart(chartId: string, format: 'png' | 'svg' | 'pdf'): Promise<Blob> {
    const chart = this.chartInstances.get(chartId)
    if (!chart || !chart.renderer) {
      throw new Error(`3D Chart ${chartId} not found`)
    }

    // 渲染到canvas并导出
    const canvas = chart.renderer.domElement
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, `image/${format}`)
    })
  }

  // 更新方法（简化实现）
  private updateHeatmap(chartId: string, newData: HeatmapData[]): void {
    // 实现热力图更新逻辑
  }

  private updateSankeyDiagram(chartId: string, newData: SankeyData): void {
    // 实现桑基图更新逻辑
  }

  private update3DScatterPlot(chartId: string, newData: Chart3DData[]): void {
    // 实现3D散点图更新逻辑
  }

  private updateWaterfallChart(chartId: string, newData: WaterfallData[]): void {
    // 实现瀑布图更新逻辑
  }

  /**
   * 更新统计信息
   */
  private updateStats(type: EnhancedChartType, renderTime: number): void {
    this.stats.totalCharts++
    this.stats.chartsByType[type] = (this.stats.chartsByType[type] || 0) + 1
    
    const totalTime = this.stats.averageRenderTime * (this.stats.totalCharts - 1) + renderTime
    this.stats.averageRenderTime = totalTime / this.stats.totalCharts
    this.stats.lastRenderTime = new Date()
  }
}

// 导出单例实例
export const enhancedVisualizationManager = EnhancedVisualizationManager.getInstance()

// 便捷的组合式API
export function useEnhancedVisualization() {
  const manager = EnhancedVisualizationManager.getInstance()
  
  return {
    // 状态
    stats: manager.stats,
    isRendering: manager.isRendering,
    
    // 方法
    createHeatmap: manager.createHeatmap.bind(manager),
    createSankeyDiagram: manager.createSankeyDiagram.bind(manager),
    create3DScatterPlot: manager.create3DScatterPlot.bind(manager),
    createWaterfallChart: manager.createWaterfallChart.bind(manager),
    getChart: manager.getChart.bind(manager),
    destroyChart: manager.destroyChart.bind(manager)
  }
}
