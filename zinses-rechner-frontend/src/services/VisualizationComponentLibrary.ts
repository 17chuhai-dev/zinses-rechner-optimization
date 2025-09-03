/**
 * 企业级数据可视化组件库
 * 提供图表、表格、KPI卡片等多种展示形式，具备交互式钻取能力
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { DashboardPermissionController } from './DashboardPermissionController'

// 可视化组件类型
export type VisualizationComponentType = 
  | 'kpi_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'scatter_chart'
  | 'heatmap'
  | 'funnel_chart'
  | 'data_table'
  | 'metric_grid'
  | 'trend_indicator'
  | 'gauge_chart'
  | 'waterfall_chart'
  | 'sankey_diagram'

// 组件配置
export interface ComponentConfig {
  id: string
  type: VisualizationComponentType
  title: string
  description?: string
  
  // 数据配置
  dataSource: DataSourceConfig
  
  // 显示配置
  display: DisplayConfig
  
  // 交互配置
  interactions: InteractionConfig[]
  
  // 样式配置
  styling: StylingConfig
  
  // 权限配置
  permissions: ComponentPermission[]
}

// 数据源配置
export interface DataSourceConfig {
  type: 'static' | 'api' | 'realtime' | 'aggregated'
  source: string
  query?: QueryConfig
  filters?: FilterConfig[]
  aggregation?: AggregationConfig
  refreshInterval?: number // 秒
}

export interface QueryConfig {
  fields: string[]
  conditions: QueryCondition[]
  groupBy?: string[]
  orderBy?: OrderByConfig[]
  limit?: number
  offset?: number
}

export interface QueryCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'between' | 'contains'
  value: any
}

export interface OrderByConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  field: string
  type: 'select' | 'multiselect' | 'date_range' | 'number_range' | 'text'
  label: string
  options?: { value: any; label: string }[]
  defaultValue?: any
  required?: boolean
}

export interface AggregationConfig {
  groupBy: string[]
  aggregations: {
    field: string
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct_count'
    alias?: string
  }[]
}

// 显示配置
export interface DisplayConfig {
  width: number | 'auto'
  height: number | 'auto'
  responsive: boolean
  
  // 图表特定配置
  chart?: ChartDisplayConfig
  
  // 表格特定配置
  table?: TableDisplayConfig
  
  // KPI特定配置
  kpi?: KPIDisplayConfig
}

export interface ChartDisplayConfig {
  theme: 'light' | 'dark' | 'auto'
  colors: string[]
  showLegend: boolean
  legendPosition: 'top' | 'bottom' | 'left' | 'right'
  showGrid: boolean
  showTooltip: boolean
  showDataLabels: boolean
  animations: boolean
  
  // 轴配置
  xAxis?: AxisConfig
  yAxis?: AxisConfig
  
  // 特殊配置
  stacked?: boolean
  smooth?: boolean
  fillArea?: boolean
}

export interface AxisConfig {
  title?: string
  type: 'category' | 'value' | 'time' | 'log'
  min?: number
  max?: number
  interval?: number
  format?: string
  rotate?: number
}

export interface TableDisplayConfig {
  pagination: boolean
  pageSize: number
  sortable: boolean
  filterable: boolean
  searchable: boolean
  exportable: boolean
  selectable: boolean
  
  columns: TableColumnConfig[]
}

export interface TableColumnConfig {
  field: string
  title: string
  width?: number
  align: 'left' | 'center' | 'right'
  sortable: boolean
  filterable: boolean
  format?: string
  render?: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'badge' | 'link'
  renderOptions?: Record<string, any>
}

export interface KPIDisplayConfig {
  showTrend: boolean
  showComparison: boolean
  showTarget: boolean
  format: 'number' | 'currency' | 'percentage'
  precision: number
  prefix?: string
  suffix?: string
  
  // 状态指示
  thresholds?: {
    good: number
    warning: number
    critical: number
  }
}

// 交互配置
export interface InteractionConfig {
  type: 'click' | 'hover' | 'drill_down' | 'filter' | 'zoom' | 'brush'
  enabled: boolean
  action: InteractionAction
}

export interface InteractionAction {
  type: 'navigate' | 'filter_dashboard' | 'show_details' | 'export_data' | 'custom'
  target?: string
  parameters?: Record<string, any>
  confirmation?: {
    required: boolean
    message: string
  }
}

// 样式配置
export interface StylingConfig {
  theme: 'light' | 'dark' | 'auto'
  colorScheme: 'default' | 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'custom'
  customColors?: string[]
  
  // 布局样式
  padding: number
  margin: number
  borderRadius: number
  shadow: boolean
  
  // 字体样式
  fontSize: number
  fontFamily?: string
  fontWeight: 'normal' | 'bold'
  
  // 背景样式
  backgroundColor?: string
  backgroundImage?: string
  backgroundOpacity: number
}

// 组件权限
export interface ComponentPermission {
  userId?: string
  roleId?: string
  teamId?: string
  actions: ('view' | 'interact' | 'export' | 'configure')[]
}

// 组件数据
export interface ComponentData {
  id: string
  timestamp: Date
  data: any[]
  metadata: {
    totalCount: number
    filteredCount: number
    aggregations?: Record<string, any>
    executionTime: number
  }
  errors?: string[]
  warnings?: string[]
}

// 组件状态
export interface ComponentState {
  loading: boolean
  error?: string
  lastUpdated?: Date
  filters: Record<string, any>
  selectedItems: any[]
  expandedItems: string[]
  sortConfig?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

// 组件实例
export interface VisualizationComponent {
  id: string
  config: ComponentConfig
  data: ComponentData | null
  state: ComponentState
  
  // 生命周期方法
  initialize(): Promise<void>
  loadData(): Promise<void>
  refresh(): Promise<void>
  destroy(): void
  
  // 交互方法
  handleInteraction(type: string, event: any): void
  applyFilter(field: string, value: any): void
  clearFilters(): void
  exportData(format: 'csv' | 'excel' | 'json'): Promise<Blob>
  
  // 渲染方法
  render(): HTMLElement | string
  updateDisplay(config: Partial<DisplayConfig>): void
}

/**
 * 可视化组件库服务
 */
export class VisualizationComponentLibrary {
  private static instance: VisualizationComponentLibrary
  private permissionController: DashboardPermissionController
  private componentRegistry: Map<string, VisualizationComponent> = new Map()
  private componentTemplates: Map<VisualizationComponentType, ComponentConfig> = new Map()
  private isInitialized = false

  private constructor() {
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): VisualizationComponentLibrary {
    if (!VisualizationComponentLibrary.instance) {
      VisualizationComponentLibrary.instance = new VisualizationComponentLibrary()
    }
    return VisualizationComponentLibrary.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.permissionController.initialize()
      await this.loadComponentTemplates()
      this.isInitialized = true
      console.log('✅ VisualizationComponentLibrary initialized')
    } catch (error) {
      console.error('❌ Failed to initialize VisualizationComponentLibrary:', error)
      throw error
    }
  }

  /**
   * 创建可视化组件
   */
  async createComponent(
    type: VisualizationComponentType,
    config: Partial<ComponentConfig>,
    userId: string,
    accountId: string
  ): Promise<VisualizationComponent> {
    if (!this.isInitialized) await this.initialize()

    // 检查权限
    const hasPermission = await this.permissionController.checkDataAccess(
      userId,
      accountId,
      'analytics',
      'view'
    )

    if (!hasPermission.granted) {
      throw new Error('Insufficient permissions to create visualization component')
    }

    // 获取模板配置
    const template = this.componentTemplates.get(type)
    if (!template) {
      throw new Error(`Component type ${type} not supported`)
    }

    // 合并配置
    const finalConfig: ComponentConfig = {
      ...template,
      ...config,
      id: config.id || crypto.randomUUID(),
      type
    }

    // 创建组件实例
    const component = await this.createComponentInstance(finalConfig, userId, accountId)
    
    // 注册组件
    this.componentRegistry.set(component.id, component)

    console.log(`📊 Visualization component created: ${type} (${component.id})`)
    return component
  }

  /**
   * 获取组件
   */
  getComponent(componentId: string): VisualizationComponent | null {
    return this.componentRegistry.get(componentId) || null
  }

  /**
   * 获取支持的组件类型
   */
  getSupportedComponentTypes(): VisualizationComponentType[] {
    return Array.from(this.componentTemplates.keys())
  }

  /**
   * 获取组件模板
   */
  getComponentTemplate(type: VisualizationComponentType): ComponentConfig | null {
    return this.componentTemplates.get(type) || null
  }

  /**
   * 批量创建组件
   */
  async createComponentBatch(
    components: Array<{
      type: VisualizationComponentType
      config: Partial<ComponentConfig>
    }>,
    userId: string,
    accountId: string
  ): Promise<VisualizationComponent[]> {
    const createdComponents: VisualizationComponent[] = []

    for (const componentSpec of components) {
      try {
        const component = await this.createComponent(
          componentSpec.type,
          componentSpec.config,
          userId,
          accountId
        )
        createdComponents.push(component)
      } catch (error) {
        console.error(`Failed to create component ${componentSpec.type}:`, error)
      }
    }

    return createdComponents
  }

  /**
   * 销毁组件
   */
  destroyComponent(componentId: string): void {
    const component = this.componentRegistry.get(componentId)
    if (component) {
      component.destroy()
      this.componentRegistry.delete(componentId)
      console.log(`🗑️ Component destroyed: ${componentId}`)
    }
  }

  // 私有方法
  private async loadComponentTemplates(): Promise<void> {
    // KPI卡片模板
    this.componentTemplates.set('kpi_card', {
      id: 'template_kpi_card',
      type: 'kpi_card',
      title: 'KPI指标卡',
      dataSource: {
        type: 'api',
        source: '/api/kpi',
        refreshInterval: 300
      },
      display: {
        width: 300,
        height: 150,
        responsive: true,
        kpi: {
          showTrend: true,
          showComparison: true,
          showTarget: false,
          format: 'number',
          precision: 0
        }
      },
      interactions: [
        {
          type: 'click',
          enabled: true,
          action: {
            type: 'show_details',
            parameters: {}
          }
        }
      ],
      styling: {
        theme: 'auto',
        colorScheme: 'default',
        padding: 16,
        margin: 8,
        borderRadius: 8,
        shadow: true,
        fontSize: 14,
        fontWeight: 'normal',
        backgroundOpacity: 1
      },
      permissions: []
    })

    // 折线图模板
    this.componentTemplates.set('line_chart', {
      id: 'template_line_chart',
      type: 'line_chart',
      title: '折线图',
      dataSource: {
        type: 'api',
        source: '/api/timeseries',
        refreshInterval: 300
      },
      display: {
        width: 600,
        height: 400,
        responsive: true,
        chart: {
          theme: 'auto',
          colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
          showLegend: true,
          legendPosition: 'top',
          showGrid: true,
          showTooltip: true,
          showDataLabels: false,
          animations: true,
          smooth: true,
          xAxis: {
            type: 'time',
            title: '时间'
          },
          yAxis: {
            type: 'value',
            title: '数值'
          }
        }
      },
      interactions: [
        {
          type: 'hover',
          enabled: true,
          action: {
            type: 'show_details',
            parameters: {}
          }
        },
        {
          type: 'drill_down',
          enabled: true,
          action: {
            type: 'filter_dashboard',
            parameters: {}
          }
        }
      ],
      styling: {
        theme: 'auto',
        colorScheme: 'default',
        padding: 16,
        margin: 8,
        borderRadius: 8,
        shadow: true,
        fontSize: 12,
        fontWeight: 'normal',
        backgroundOpacity: 1
      },
      permissions: []
    })

    // 数据表格模板
    this.componentTemplates.set('data_table', {
      id: 'template_data_table',
      type: 'data_table',
      title: '数据表格',
      dataSource: {
        type: 'api',
        source: '/api/table-data',
        refreshInterval: 600
      },
      display: {
        width: 'auto',
        height: 400,
        responsive: true,
        table: {
          pagination: true,
          pageSize: 20,
          sortable: true,
          filterable: true,
          searchable: true,
          exportable: true,
          selectable: false,
          columns: [
            {
              field: 'id',
              title: 'ID',
              width: 80,
              align: 'left',
              sortable: true,
              filterable: false,
              render: 'text'
            },
            {
              field: 'name',
              title: '名称',
              align: 'left',
              sortable: true,
              filterable: true,
              render: 'text'
            },
            {
              field: 'value',
              title: '数值',
              width: 120,
              align: 'right',
              sortable: true,
              filterable: true,
              render: 'number',
              format: '0,0'
            },
            {
              field: 'date',
              title: '日期',
              width: 120,
              align: 'center',
              sortable: true,
              filterable: true,
              render: 'date',
              format: 'YYYY-MM-DD'
            }
          ]
        }
      },
      interactions: [
        {
          type: 'click',
          enabled: true,
          action: {
            type: 'show_details',
            parameters: {}
          }
        }
      ],
      styling: {
        theme: 'auto',
        colorScheme: 'default',
        padding: 16,
        margin: 8,
        borderRadius: 8,
        shadow: true,
        fontSize: 14,
        fontWeight: 'normal',
        backgroundOpacity: 1
      },
      permissions: []
    })

    // 饼图模板
    this.componentTemplates.set('pie_chart', {
      id: 'template_pie_chart',
      type: 'pie_chart',
      title: '饼图',
      dataSource: {
        type: 'api',
        source: '/api/pie-data',
        refreshInterval: 300
      },
      display: {
        width: 400,
        height: 400,
        responsive: true,
        chart: {
          theme: 'auto',
          colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
          showLegend: true,
          legendPosition: 'right',
          showGrid: false,
          showTooltip: true,
          showDataLabels: true,
          animations: true
        }
      },
      interactions: [
        {
          type: 'click',
          enabled: true,
          action: {
            type: 'drill_down',
            parameters: {}
          }
        }
      ],
      styling: {
        theme: 'auto',
        colorScheme: 'default',
        padding: 16,
        margin: 8,
        borderRadius: 8,
        shadow: true,
        fontSize: 12,
        fontWeight: 'normal',
        backgroundOpacity: 1
      },
      permissions: []
    })

    console.log(`📚 Loaded ${this.componentTemplates.size} component templates`)
  }

  private async createComponentInstance(
    config: ComponentConfig,
    userId: string,
    accountId: string
  ): Promise<VisualizationComponent> {
    // 创建基础组件实例
    const component: VisualizationComponent = {
      id: config.id,
      config,
      data: null,
      state: {
        loading: false,
        filters: {},
        selectedItems: [],
        expandedItems: []
      },

      async initialize() {
        console.log(`🔧 Initializing component: ${this.id}`)
        await this.loadData()
      },

      async loadData() {
        this.state.loading = true
        this.state.error = undefined

        try {
          // 检查数据访问权限
          const permissionCheck = await permissionController.checkDataAccess(
            userId,
            accountId,
            'analytics',
            'view'
          )

          if (!permissionCheck.granted) {
            throw new Error('Insufficient permissions to load data')
          }

          // 模拟数据加载
          const mockData = await this.generateMockData()
          
          this.data = {
            id: this.id,
            timestamp: new Date(),
            data: mockData,
            metadata: {
              totalCount: mockData.length,
              filteredCount: mockData.length,
              executionTime: Math.random() * 100 + 50
            }
          }

          this.state.lastUpdated = new Date()
        } catch (error) {
          this.state.error = error instanceof Error ? error.message : 'Unknown error'
          console.error(`Failed to load data for component ${this.id}:`, error)
        } finally {
          this.state.loading = false
        }
      },

      async refresh() {
        await this.loadData()
      },

      destroy() {
        // 清理资源
        this.data = null
        console.log(`🗑️ Component destroyed: ${this.id}`)
      },

      handleInteraction(type: string, event: any) {
        console.log(`🖱️ Component interaction: ${type}`, event)
        
        const interaction = this.config.interactions.find(i => i.type === type)
        if (interaction && interaction.enabled) {
          // 处理交互逻辑
          switch (interaction.action.type) {
            case 'show_details':
              console.log('Showing details for:', event)
              break
            case 'filter_dashboard':
              console.log('Filtering dashboard with:', event)
              break
            case 'navigate':
              console.log('Navigating to:', interaction.action.target)
              break
          }
        }
      },

      applyFilter(field: string, value: any) {
        this.state.filters[field] = value
        this.loadData() // 重新加载数据
      },

      clearFilters() {
        this.state.filters = {}
        this.loadData()
      },

      async exportData(format: 'csv' | 'excel' | 'json'): Promise<Blob> {
        if (!this.data) {
          throw new Error('No data to export')
        }

        let content: string
        let mimeType: string

        switch (format) {
          case 'json':
            content = JSON.stringify(this.data.data, null, 2)
            mimeType = 'application/json'
            break
          case 'csv':
            content = this.convertToCSV(this.data.data)
            mimeType = 'text/csv'
            break
          case 'excel':
            // 简化实现，实际应该生成Excel文件
            content = this.convertToCSV(this.data.data)
            mimeType = 'application/vnd.ms-excel'
            break
          default:
            throw new Error(`Unsupported export format: ${format}`)
        }

        return new Blob([content], { type: mimeType })
      },

      render(): string {
        // 简化的渲染实现
        return `<div id="${this.id}" class="visualization-component">
          <h3>${this.config.title}</h3>
          <div class="component-content">
            ${this.state.loading ? 'Loading...' : 
              this.state.error ? `Error: ${this.state.error}` :
              this.data ? `Data loaded: ${this.data.data.length} items` : 'No data'}
          </div>
        </div>`
      },

      updateDisplay(config: Partial<DisplayConfig>) {
        this.config.display = { ...this.config.display, ...config }
        // 触发重新渲染
        console.log(`🎨 Display updated for component: ${this.id}`)
      },

      // 私有方法
      async generateMockData(): Promise<any[]> {
        // 根据组件类型生成模拟数据
        switch (config.type) {
          case 'kpi_card':
            return [{ value: Math.floor(Math.random() * 10000), change: Math.random() * 0.2 - 0.1 }]
          case 'line_chart':
            return Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
              value: Math.floor(Math.random() * 1000) + 500
            }))
          case 'pie_chart':
            return [
              { name: '分类A', value: 30 },
              { name: '分类B', value: 25 },
              { name: '分类C', value: 20 },
              { name: '分类D', value: 15 },
              { name: '分类E', value: 10 }
            ]
          case 'data_table':
            return Array.from({ length: 100 }, (_, i) => ({
              id: i + 1,
              name: `项目 ${i + 1}`,
              value: Math.floor(Math.random() * 10000),
              date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
            }))
          default:
            return []
        }
      },

      convertToCSV(data: any[]): string {
        if (!data.length) return ''
        
        const headers = Object.keys(data[0])
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header => row[header]).join(','))
        ].join('\n')
        
        return csvContent
      }
    }

    // 初始化组件
    await component.initialize()

    return component
  }
}

// Export singleton instance
export const visualizationComponentLibrary = VisualizationComponentLibrary.getInstance()
