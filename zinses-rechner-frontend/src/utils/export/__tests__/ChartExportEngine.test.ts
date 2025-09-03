/**
 * 图表导出引擎测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChartExportEngine, ExportFormat, ExportQuality } from '../ChartExportEngine'

// Mock dependencies
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-data'),
    width: 800,
    height: 600
  }))
}))

vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    addImage: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    setTextColor: vi.fn(),
    save: vi.fn(),
    output: vi.fn(() => ({ size: 1024 }))
  }))
}))

// Mock Chart.js
const mockChart = {
  canvas: {
    getContext: vi.fn(() => ({})),
    parentElement: document.createElement('div'),
    width: 800,
    height: 600
  },
  config: {
    type: 'line'
  },
  data: {
    datasets: [{
      data: [1, 2, 3, 4, 5]
    }]
  }
}

// Mock DOM methods
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  }
})

Object.defineProperty(global, 'Blob', {
  value: vi.fn(() => ({ size: 1024 }))
})

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn((tag) => {
    const element = {
      href: '',
      download: '',
      click: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
    if (tag === 'a') {
      return element
    }
    return element
  })
})

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn()
})

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn()
})

describe('ChartExportEngine', () => {
  let exportEngine: ChartExportEngine

  beforeEach(() => {
    exportEngine = ChartExportEngine.getInstance()
    vi.clearAllMocks()
  })

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = ChartExportEngine.getInstance()
      const instance2 = ChartExportEngine.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('导出配置', () => {
    it('应该有默认配置', () => {
      const defaultConfig = exportEngine.getDefaultConfig()
      expect(defaultConfig.format).toBe(ExportFormat.PNG)
      expect(defaultConfig.quality).toBe(ExportQuality.HIGH)
      expect(defaultConfig.width).toBe(800)
      expect(defaultConfig.height).toBe(600)
    })

    it('应该能够设置默认配置', () => {
      const newConfig = {
        format: ExportFormat.SVG,
        quality: ExportQuality.ULTRA,
        width: 1200,
        height: 800
      }
      
      exportEngine.setDefaultConfig(newConfig)
      const updatedConfig = exportEngine.getDefaultConfig()
      
      expect(updatedConfig.format).toBe(ExportFormat.SVG)
      expect(updatedConfig.quality).toBe(ExportQuality.ULTRA)
      expect(updatedConfig.width).toBe(1200)
      expect(updatedConfig.height).toBe(800)
    })
  })

  describe('支持的格式', () => {
    it('应该返回所有支持的格式', () => {
      const formats = exportEngine.getSupportedFormats()
      expect(formats).toContain(ExportFormat.PNG)
      expect(formats).toContain(ExportFormat.SVG)
      expect(formats).toContain(ExportFormat.PDF)
      expect(formats).toContain(ExportFormat.JPEG)
    })

    it('应该返回所有质量级别', () => {
      const qualities = exportEngine.getQualityLevels()
      expect(qualities).toContain(ExportQuality.LOW)
      expect(qualities).toContain(ExportQuality.MEDIUM)
      expect(qualities).toContain(ExportQuality.HIGH)
      expect(qualities).toContain(ExportQuality.ULTRA)
    })
  })

  describe('PNG导出', () => {
    it('应该成功导出PNG格式', async () => {
      const result = await exportEngine.exportChart(mockChart as any, {
        format: ExportFormat.PNG,
        quality: ExportQuality.HIGH,
        width: 800,
        height: 600
      })

      expect(result.success).toBe(true)
      expect(result.format).toBe(ExportFormat.PNG)
      expect(result.filename).toMatch(/\.png$/)
      expect(result.size).toBeGreaterThan(0)
      expect(result.metadata).toBeDefined()
    })

    it('应该处理透明背景', async () => {
      const result = await exportEngine.exportChart(mockChart as any, {
        format: ExportFormat.PNG,
        transparent: true
      })

      expect(result.success).toBe(true)
    })
  })

  describe('SVG导出', () => {
    it('应该成功导出SVG格式', async () => {
      const result = await exportEngine.exportChart(mockChart as any, {
        format: ExportFormat.SVG,
        width: 800,
        height: 600
      })

      expect(result.success).toBe(true)
      expect(result.format).toBe(ExportFormat.SVG)
      expect(result.filename).toMatch(/\.svg$/)
    })
  })

  describe('PDF导出', () => {
    it('应该成功导出PDF格式', async () => {
      const result = await exportEngine.exportChart(mockChart as any, {
        format: ExportFormat.PDF,
        width: 800,
        height: 600,
        includeTitle: true,
        watermark: 'Test Watermark'
      })

      expect(result.success).toBe(true)
      expect(result.format).toBe(ExportFormat.PDF)
      expect(result.filename).toMatch(/\.pdf$/)
    })
  })

  describe('JPEG导出', () => {
    it('应该成功导出JPEG格式', async () => {
      const result = await exportEngine.exportChart(mockChart as any, {
        format: ExportFormat.JPEG,
        quality: ExportQuality.MEDIUM
      })

      expect(result.success).toBe(true)
      expect(result.format).toBe(ExportFormat.JPEG)
      expect(result.filename).toMatch(/\.jpeg$/)
    })
  })

  describe('批量导出', () => {
    it('应该成功批量导出多个图表', async () => {
      const charts = [
        {
          chart: mockChart as any,
          config: { format: ExportFormat.PNG }
        },
        {
          chart: mockChart as any,
          config: { format: ExportFormat.SVG }
        }
      ]

      const progressCallback = vi.fn()
      const result = await exportEngine.exportBatch({
        charts,
        onProgress: progressCallback
      })

      expect(result.results).toHaveLength(2)
      expect(result.totalSuccess).toBe(2)
      expect(result.totalFailed).toBe(0)
      expect(progressCallback).toHaveBeenCalledTimes(2)
    })

    it('应该处理批量导出中的错误', async () => {
      const charts = [
        {
          chart: mockChart as any,
          config: { format: ExportFormat.PNG }
        },
        {
          chart: null as any, // 故意传入无效图表
          config: { format: ExportFormat.SVG }
        }
      ]

      const errorCallback = vi.fn()
      const result = await exportEngine.exportBatch({
        charts,
        onError: errorCallback
      })

      expect(result.totalSuccess).toBe(1)
      expect(result.totalFailed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(errorCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('错误处理', () => {
    it('应该处理不支持的格式', async () => {
      const result = await exportEngine.exportChart(mockChart as any, {
        format: 'unsupported' as any
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('不支持的导出格式')
    })

    it('应该处理无效的图表对象', async () => {
      const result = await exportEngine.exportChart(null as any, {
        format: ExportFormat.PNG
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('文件名生成', () => {
    it('应该使用自定义文件名', async () => {
      const customFilename = 'my-custom-chart.png'
      const result = await exportEngine.exportChart(mockChart as any, {
        format: ExportFormat.PNG,
        filename: customFilename
      })

      expect(result.filename).toBe(customFilename)
    })

    it('应该生成时间戳文件名', async () => {
      const result = await exportEngine.exportChart(mockChart as any, {
        format: ExportFormat.PNG
      })

      expect(result.filename).toMatch(/chart_export_\d+\.png/)
    })

    it('应该自动添加扩展名', async () => {
      const result = await exportEngine.exportChart(mockChart as any, {
        format: ExportFormat.PNG,
        filename: 'test-chart'
      })

      expect(result.filename).toBe('test-chart.png')
    })
  })

  describe('元数据生成', () => {
    it('应该生成正确的元数据', async () => {
      const result = await exportEngine.exportChart(mockChart as any, {
        format: ExportFormat.PNG,
        width: 1200,
        height: 800,
        quality: ExportQuality.HIGH,
        dpi: 300
      })

      expect(result.metadata).toBeDefined()
      expect(result.metadata!.width).toBe(800) // Canvas实际宽度
      expect(result.metadata!.height).toBe(600) // Canvas实际高度
      expect(result.metadata!.dpi).toBe(300)
      expect(result.metadata!.quality).toBe(ExportQuality.HIGH)
      expect(result.metadata!.chartType).toBe('line')
      expect(result.metadata!.dataPoints).toBe(5)
      expect(result.metadata!.timestamp).toBeInstanceOf(Date)
    })
  })
})
