/**
 * 导出预览系统
 * 提供导出前的预览功能，支持多种格式的实时预览和交互式预览
 */

import { ref, reactive, computed } from 'vue'

// 预览类型
export type PreviewType = 'image' | 'document' | 'data' | 'interactive'

// 导出格式
export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'xlsx' | 'json'

// 预览模式
export type PreviewMode = 'thumbnail' | 'full' | 'interactive' | 'comparison'

// 预览配置接口
export interface PreviewConfig {
  format: ExportFormat
  mode: PreviewMode
  width?: number
  height?: number
  quality?: number
  background?: string
  showGrid?: boolean
  showRulers?: boolean
  showMetadata?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  maxZoom?: number
  minZoom?: number
}

// 预览数据接口
export interface PreviewData {
  id: string
  type: PreviewType
  format: ExportFormat
  title: string
  description?: string
  url: string
  blob?: Blob
  thumbnail?: string
  metadata: {
    size: number
    dimensions?: { width: number; height: number }
    colorSpace?: string
    dpi?: number
    created: Date
    modified: Date
  }
  config: PreviewConfig
  isLoading: boolean
  error?: string
}

// 预览状态接口
export interface PreviewState {
  currentPreview?: PreviewData
  previews: PreviewData[]
  isGenerating: boolean
  generationProgress: number
  currentOperation: string
  zoom: number
  pan: { x: number; y: number }
  showComparison: boolean
  comparisonPreviews: PreviewData[]
}

// 预览生成选项
export interface PreviewGenerationOptions {
  generateThumbnail?: boolean
  thumbnailSize?: number
  enableInteractive?: boolean
  includeMetadata?: boolean
  onProgress?: (progress: number, operation: string) => void
  onComplete?: (preview: PreviewData) => void
  onError?: (error: string) => void
}

/**
 * 导出预览系统类
 */
export class ExportPreviewSystem {
  private static instance: ExportPreviewSystem

  // 预览状态
  public readonly state = reactive<PreviewState>({
    previews: [],
    isGenerating: false,
    generationProgress: 0,
    currentOperation: '',
    zoom: 1,
    pan: { x: 0, y: 0 },
    showComparison: false,
    comparisonPreviews: []
  })

  // 预览生成器映射
  private previewGenerators = new Map<ExportFormat, (data: any, config: PreviewConfig) => Promise<PreviewData>>()

  // 缓存管理
  private previewCache = new Map<string, PreviewData>()
  private maxCacheSize = 50

  public static getInstance(): ExportPreviewSystem {
    if (!ExportPreviewSystem.instance) {
      ExportPreviewSystem.instance = new ExportPreviewSystem()
    }
    return ExportPreviewSystem.instance
  }

  constructor() {
    this.initializeGenerators()
  }

  /**
   * 初始化预览生成器
   */
  private initializeGenerators(): void {
    this.previewGenerators.set('png', this.generateImagePreview.bind(this))
    this.previewGenerators.set('jpg', this.generateImagePreview.bind(this))
    this.previewGenerators.set('svg', this.generateSVGPreview.bind(this))
    this.previewGenerators.set('pdf', this.generatePDFPreview.bind(this))
    this.previewGenerators.set('csv', this.generateDataPreview.bind(this))
    this.previewGenerators.set('xlsx', this.generateDataPreview.bind(this))
    this.previewGenerators.set('json', this.generateDataPreview.bind(this))
  }

  /**
   * 生成预览
   */
  public async generatePreview(
    data: any,
    config: PreviewConfig,
    options: PreviewGenerationOptions = {}
  ): Promise<PreviewData> {
    const cacheKey = this.generateCacheKey(data, config)
    
    // 检查缓存
    if (this.previewCache.has(cacheKey)) {
      const cachedPreview = this.previewCache.get(cacheKey)!
      console.log(`📋 Using cached preview: ${cachedPreview.title}`)
      return cachedPreview
    }

    this.state.isGenerating = true
    this.state.generationProgress = 0
    this.state.currentOperation = 'Initialisiere Vorschau...'

    try {
      options.onProgress?.(10, 'Initialisiere Vorschau...')

      // 获取格式特定的生成器
      const generator = this.previewGenerators.get(config.format)
      if (!generator) {
        throw new Error(`Unsupported format: ${config.format}`)
      }

      options.onProgress?.(30, 'Generiere Vorschau...')
      this.state.currentOperation = 'Generiere Vorschau...'

      // 生成预览
      const preview = await generator(data, config)

      options.onProgress?.(70, 'Erstelle Thumbnail...')
      this.state.currentOperation = 'Erstelle Thumbnail...'

      // 生成缩略图
      if (options.generateThumbnail !== false) {
        preview.thumbnail = await this.generateThumbnail(preview, options.thumbnailSize || 200)
      }

      options.onProgress?.(90, 'Finalisiere Vorschau...')
      this.state.currentOperation = 'Finalisiere Vorschau...'

      // 添加到缓存
      this.addToCache(cacheKey, preview)

      // 添加到状态
      this.state.previews.push(preview)
      this.state.currentPreview = preview

      options.onProgress?.(100, 'Vorschau abgeschlossen')
      options.onComplete?.(preview)

      console.log(`✅ Preview generated: ${preview.title}`)
      return preview

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown preview generation error'
      console.error('❌ Preview generation failed:', error)
      
      options.onError?.(errorMessage)
      
      // 创建错误预览
      const errorPreview = this.createErrorPreview(config, errorMessage)
      this.state.previews.push(errorPreview)
      
      return errorPreview
    } finally {
      this.state.isGenerating = false
      this.state.generationProgress = 0
      this.state.currentOperation = ''
    }
  }

  /**
   * 批量生成预览
   */
  public async generateBatchPreviews(
    items: Array<{ data: any; config: PreviewConfig }>,
    options: PreviewGenerationOptions = {}
  ): Promise<PreviewData[]> {
    const results: PreviewData[] = []
    const total = items.length

    this.state.isGenerating = true

    for (let i = 0; i < items.length; i++) {
      const { data, config } = items[i]
      const overallProgress = ((i + 1) / total) * 100
      
      options.onProgress?.(overallProgress, `Generiere Vorschau ${i + 1} von ${total}...`)
      
      try {
        const preview = await this.generatePreview(data, config, {
          ...options,
          onProgress: undefined // 避免嵌套进度回调
        })
        results.push(preview)
      } catch (error) {
        console.error(`Failed to generate preview ${i + 1}:`, error)
        const errorPreview = this.createErrorPreview(config, error instanceof Error ? error.message : 'Unknown error')
        results.push(errorPreview)
      }
    }

    this.state.isGenerating = false
    return results
  }

  /**
   * 设置当前预览
   */
  public setCurrentPreview(previewId: string): void {
    const preview = this.state.previews.find(p => p.id === previewId)
    if (preview) {
      this.state.currentPreview = preview
      console.log(`📋 Current preview set: ${preview.title}`)
    }
  }

  /**
   * 删除预览
   */
  public removePreview(previewId: string): boolean {
    const index = this.state.previews.findIndex(p => p.id === previewId)
    if (index > -1) {
      const preview = this.state.previews[index]
      
      // 清理URL对象
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url)
      }
      if (preview.thumbnail?.startsWith('blob:')) {
        URL.revokeObjectURL(preview.thumbnail)
      }
      
      this.state.previews.splice(index, 1)
      
      // 如果删除的是当前预览，设置新的当前预览
      if (this.state.currentPreview?.id === previewId) {
        this.state.currentPreview = this.state.previews[0] || undefined
      }
      
      console.log(`🗑️ Preview removed: ${preview.title}`)
      return true
    }
    return false
  }

  /**
   * 清空所有预览
   */
  public clearAllPreviews(): void {
    // 清理所有URL对象
    this.state.previews.forEach(preview => {
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url)
      }
      if (preview.thumbnail?.startsWith('blob:')) {
        URL.revokeObjectURL(preview.thumbnail)
      }
    })

    this.state.previews = []
    this.state.currentPreview = undefined
    this.state.comparisonPreviews = []
    this.previewCache.clear()

    console.log('🗑️ All previews cleared')
  }

  /**
   * 设置缩放级别
   */
  public setZoom(zoom: number): void {
    const config = this.state.currentPreview?.config
    if (config?.enableZoom !== false) {
      const minZoom = config?.minZoom || 0.1
      const maxZoom = config?.maxZoom || 5
      this.state.zoom = Math.max(minZoom, Math.min(maxZoom, zoom))
    }
  }

  /**
   * 设置平移位置
   */
  public setPan(x: number, y: number): void {
    const config = this.state.currentPreview?.config
    if (config?.enablePan !== false) {
      this.state.pan = { x, y }
    }
  }

  /**
   * 重置视图
   */
  public resetView(): void {
    this.state.zoom = 1
    this.state.pan = { x: 0, y: 0 }
  }

  /**
   * 启用比较模式
   */
  public enableComparison(previewIds: string[]): void {
    const previews = previewIds
      .map(id => this.state.previews.find(p => p.id === id))
      .filter(Boolean) as PreviewData[]
    
    if (previews.length >= 2) {
      this.state.showComparison = true
      this.state.comparisonPreviews = previews
      console.log(`📊 Comparison mode enabled with ${previews.length} previews`)
    }
  }

  /**
   * 禁用比较模式
   */
  public disableComparison(): void {
    this.state.showComparison = false
    this.state.comparisonPreviews = []
    console.log('📊 Comparison mode disabled')
  }

  /**
   * 获取预览统计
   */
  public getPreviewStats(): {
    total: number
    byFormat: Record<ExportFormat, number>
    byType: Record<PreviewType, number>
    cacheSize: number
    totalSize: number
  } {
    const stats = {
      total: this.state.previews.length,
      byFormat: {} as Record<ExportFormat, number>,
      byType: {} as Record<PreviewType, number>,
      cacheSize: this.previewCache.size,
      totalSize: 0
    }

    this.state.previews.forEach(preview => {
      // 按格式统计
      stats.byFormat[preview.format] = (stats.byFormat[preview.format] || 0) + 1
      
      // 按类型统计
      stats.byType[preview.type] = (stats.byType[preview.type] || 0) + 1
      
      // 总大小
      stats.totalSize += preview.metadata.size
    })

    return stats
  }

  // 私有方法

  /**
   * 生成图像预览
   */
  private async generateImagePreview(data: any, config: PreviewConfig): Promise<PreviewData> {
    await this.delay(500 + Math.random() * 1000) // 模拟生成时间

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = config.width || 800
    canvas.height = config.height || 600

    // 设置背景
    ctx.fillStyle = config.background || '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制示例内容
    ctx.fillStyle = '#333333'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Vorschau-Diagramm', canvas.width / 2, canvas.height / 2)

    // 绘制示例图表
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < canvas.width; i += 10) {
      const y = canvas.height / 2 + Math.sin(i * 0.02) * 100
      if (i === 0) ctx.moveTo(i, y)
      else ctx.lineTo(i, y)
    }
    ctx.stroke()

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob!)
        
        resolve({
          id: this.generateId(),
          type: 'image',
          format: config.format,
          title: `${config.format.toUpperCase()} Vorschau`,
          description: `Bildvorschau in ${config.format.toUpperCase()}-Format`,
          url,
          blob: blob!,
          metadata: {
            size: blob!.size,
            dimensions: { width: canvas.width, height: canvas.height },
            colorSpace: 'sRGB',
            dpi: 96,
            created: new Date(),
            modified: new Date()
          },
          config,
          isLoading: false
        })
      }, `image/${config.format}`, config.quality || 0.9)
    })
  }

  /**
   * 生成SVG预览
   */
  private async generateSVGPreview(data: any, config: PreviewConfig): Promise<PreviewData> {
    await this.delay(300 + Math.random() * 700)

    const width = config.width || 800
    const height = config.height || 600

    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${config.background || '#ffffff'}"/>
        <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#333333">
          SVG Vorschau
        </text>
        <path d="M 50 ${height/2} Q 200 ${height/2 - 100} 350 ${height/2} T 650 ${height/2}" 
              stroke="#2563eb" stroke-width="2" fill="none"/>
      </svg>
    `

    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    return {
      id: this.generateId(),
      type: 'image',
      format: 'svg',
      title: 'SVG Vorschau',
      description: 'Vektorgrafikvorschau in SVG-Format',
      url,
      blob,
      metadata: {
        size: blob.size,
        dimensions: { width, height },
        created: new Date(),
        modified: new Date()
      },
      config,
      isLoading: false
    }
  }

  /**
   * 生成PDF预览
   */
  private async generatePDFPreview(data: any, config: PreviewConfig): Promise<PreviewData> {
    await this.delay(1000 + Math.random() * 2000)

    // 模拟PDF预览（实际应用中会使用PDF.js或类似库）
    const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n...'
    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    return {
      id: this.generateId(),
      type: 'document',
      format: 'pdf',
      title: 'PDF Vorschau',
      description: 'Dokumentvorschau in PDF-Format',
      url,
      blob,
      metadata: {
        size: blob.size,
        created: new Date(),
        modified: new Date()
      },
      config,
      isLoading: false
    }
  }

  /**
   * 生成数据预览
   */
  private async generateDataPreview(data: any, config: PreviewConfig): Promise<PreviewData> {
    await this.delay(200 + Math.random() * 500)

    let content: string
    let mimeType: string

    switch (config.format) {
      case 'csv':
        content = 'Name,Wert,Datum\nBeispiel 1,100,2024-01-01\nBeispiel 2,200,2024-01-02'
        mimeType = 'text/csv'
        break
      case 'json':
        content = JSON.stringify({
          data: [
            { name: 'Beispiel 1', value: 100, date: '2024-01-01' },
            { name: 'Beispiel 2', value: 200, date: '2024-01-02' }
          ]
        }, null, 2)
        mimeType = 'application/json'
        break
      default:
        content = 'Beispieldaten für ' + config.format.toUpperCase()
        mimeType = 'text/plain'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    return {
      id: this.generateId(),
      type: 'data',
      format: config.format,
      title: `${config.format.toUpperCase()} Vorschau`,
      description: `Datenvorschau in ${config.format.toUpperCase()}-Format`,
      url,
      blob,
      metadata: {
        size: blob.size,
        created: new Date(),
        modified: new Date()
      },
      config,
      isLoading: false
    }
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(preview: PreviewData, size: number): Promise<string> {
    if (preview.type === 'image' && preview.blob) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          
          // 计算缩略图尺寸
          const aspectRatio = img.width / img.height
          if (aspectRatio > 1) {
            canvas.width = size
            canvas.height = size / aspectRatio
          } else {
            canvas.width = size * aspectRatio
            canvas.height = size
          }
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob((blob) => {
            const thumbnailUrl = URL.createObjectURL(blob!)
            resolve(thumbnailUrl)
          }, 'image/png', 0.8)
        }
        img.src = preview.url
      })
    }
    
    // 对于非图像类型，返回默认缩略图
    return preview.url
  }

  /**
   * 创建错误预览
   */
  private createErrorPreview(config: PreviewConfig, error: string): PreviewData {
    return {
      id: this.generateId(),
      type: 'image',
      format: config.format,
      title: 'Vorschau-Fehler',
      description: error,
      url: '',
      metadata: {
        size: 0,
        created: new Date(),
        modified: new Date()
      },
      config,
      isLoading: false,
      error
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(data: any, config: PreviewConfig): string {
    const configStr = JSON.stringify(config)
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data)
    return `${configStr}-${dataStr}`.slice(0, 100) // 限制长度
  }

  /**
   * 添加到缓存
   */
  private addToCache(key: string, preview: PreviewData): void {
    // 如果缓存已满，删除最旧的项
    if (this.previewCache.size >= this.maxCacheSize) {
      const firstKey = this.previewCache.keys().next().value
      const oldPreview = this.previewCache.get(firstKey)
      if (oldPreview) {
        if (oldPreview.url.startsWith('blob:')) {
          URL.revokeObjectURL(oldPreview.url)
        }
        if (oldPreview.thumbnail?.startsWith('blob:')) {
          URL.revokeObjectURL(oldPreview.thumbnail)
        }
      }
      this.previewCache.delete(firstKey)
    }
    
    this.previewCache.set(key, preview)
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出单例实例
export const exportPreviewSystem = ExportPreviewSystem.getInstance()

// 便捷的组合式API
export function useExportPreview() {
  const system = ExportPreviewSystem.getInstance()
  
  return {
    // 状态
    state: system.state,
    
    // 计算属性
    currentPreview: computed(() => system.state.currentPreview),
    isGenerating: computed(() => system.state.isGenerating),
    previews: computed(() => system.state.previews),
    
    // 方法
    generatePreview: system.generatePreview.bind(system),
    generateBatchPreviews: system.generateBatchPreviews.bind(system),
    setCurrentPreview: system.setCurrentPreview.bind(system),
    removePreview: system.removePreview.bind(system),
    clearAllPreviews: system.clearAllPreviews.bind(system),
    setZoom: system.setZoom.bind(system),
    setPan: system.setPan.bind(system),
    resetView: system.resetView.bind(system),
    enableComparison: system.enableComparison.bind(system),
    disableComparison: system.disableComparison.bind(system),
    getPreviewStats: system.getPreviewStats.bind(system)
  }
}
