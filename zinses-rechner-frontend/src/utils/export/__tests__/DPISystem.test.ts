/**
 * DPI和分辨率控制系统测试套件
 * 包括精度测试、性能测试、兼容性测试、边界条件测试等
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  dpiCalculationEngine,
  sizeUnitConverter,
  pixelDensityScaler,
  resolutionManager,
  deviceAdaptationDetector,
  dpiPreviewSystem,
  smartResolutionEngine,
  SizeUnit,
  ResolutionPreset,
  ScalingAlgorithm
} from '../index'

describe('DPI计算引擎测试', () => {
  describe('基础DPI计算', () => {
    it('应该正确计算DPI', () => {
      const dpi = dpiCalculationEngine.calculateDPIFromSize(
        2480, 3508, // A4 300 DPI像素尺寸
        8.27, 11.69, // A4英寸尺寸
        SizeUnit.INCHES
      )
      expect(dpi).toBeCloseTo(300, 0)
    })

    it('应该正确计算像素尺寸', () => {
      const pixelSize = dpiCalculationEngine.calculatePixelSize(
        8.27, 11.69, // A4英寸尺寸
        300, // 300 DPI
        SizeUnit.INCHES
      )
      expect(pixelSize.width).toBeCloseTo(2481, 0)
      expect(pixelSize.height).toBeCloseTo(3507, 0)
    })

    it('应该正确计算物理尺寸', () => {
      const physicalSize = dpiCalculationEngine.calculatePhysicalSize(
        2480, 3508, // A4 300 DPI像素尺寸
        300, // 300 DPI
        SizeUnit.INCHES
      )
      expect(physicalSize.width).toBeCloseTo(8.27, 1)
      expect(physicalSize.height).toBeCloseTo(11.69, 1)
    })

    it('应该正确计算像素比例', () => {
      const ratio96 = dpiCalculationEngine.calculatePixelRatio(96)
      const ratio192 = dpiCalculationEngine.calculatePixelRatio(192)
      const ratio300 = dpiCalculationEngine.calculatePixelRatio(300)

      expect(ratio96).toBe(1.0)
      expect(ratio192).toBe(2.0)
      expect(ratio300).toBeCloseTo(3.125, 2)
    })
  })

  describe('DPI验证', () => {
    it('应该验证有效的DPI值', () => {
      expect(() => dpiCalculationEngine.validateDPI(96)).not.toThrow()
      expect(() => dpiCalculationEngine.validateDPI(300)).not.toThrow()
      expect(() => dpiCalculationEngine.validateDPI(600)).not.toThrow()
    })

    it('应该拒绝无效的DPI值', () => {
      expect(() => dpiCalculationEngine.validateDPI(50)).toThrow()
      expect(() => dpiCalculationEngine.validateDPI(700)).toThrow()
      expect(() => dpiCalculationEngine.validateDPI(-100)).toThrow()
    })
  })

  describe('完整计算', () => {
    it('应该执行完整的DPI计算', () => {
      const result = dpiCalculationEngine.performFullCalculation(1920, 1080, 96)
      
      expect(result.dpi).toBe(96)
      expect(result.pixelWidth).toBe(1920)
      expect(result.pixelHeight).toBe(1080)
      expect(result.physicalWidth).toBeCloseTo(20, 0)
      expect(result.physicalHeight).toBeCloseTo(11.25, 1)
      expect(result.pixelRatio).toBe(1.0)
      expect(result.totalPixels).toBe(2073600)
      expect(result.aspectRatio).toBeCloseTo(1.78, 2)
    })
  })
})

describe('尺寸单位转换器测试', () => {
  describe('基础转换', () => {
    it('应该正确转换英寸到厘米', () => {
      const result = sizeUnitConverter.convert(1, SizeUnit.INCHES, SizeUnit.CENTIMETERS)
      expect(result.value).toBeCloseTo(2.54, 2)
      expect(result.unit).toBe(SizeUnit.CENTIMETERS)
    })

    it('应该正确转换厘米到毫米', () => {
      const result = sizeUnitConverter.convert(1, SizeUnit.CENTIMETERS, SizeUnit.MILLIMETERS)
      expect(result.value).toBeCloseTo(10, 1)
      expect(result.unit).toBe(SizeUnit.MILLIMETERS)
    })

    it('应该正确转换点到英寸', () => {
      const result = sizeUnitConverter.convert(72, SizeUnit.POINTS, SizeUnit.INCHES)
      expect(result.value).toBeCloseTo(1, 2)
      expect(result.unit).toBe(SizeUnit.INCHES)
    })
  })

  describe('像素转换', () => {
    it('应该正确转换像素到英寸', () => {
      const result = sizeUnitConverter.pixelsToPhysical(96, SizeUnit.INCHES, 96)
      expect(result.value).toBeCloseTo(1, 2)
      expect(result.unit).toBe(SizeUnit.INCHES)
    })

    it('应该正确转换英寸到像素', () => {
      const result = sizeUnitConverter.physicalToPixels(1, SizeUnit.INCHES, 96)
      expect(result.value).toBe(96)
      expect(result.unit).toBe(SizeUnit.PIXELS)
    })
  })

  describe('批量转换', () => {
    it('应该正确执行批量转换', () => {
      const values = [
        { value: 1, fromUnit: SizeUnit.INCHES },
        { value: 2.54, fromUnit: SizeUnit.CENTIMETERS },
        { value: 25.4, fromUnit: SizeUnit.MILLIMETERS }
      ]
      
      const results = sizeUnitConverter.convertBatch(values, SizeUnit.INCHES)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.value).toBeCloseTo(1, 1)
        expect(result.unit).toBe(SizeUnit.INCHES)
      })
    })
  })
})

describe('像素密度缩放器测试', () => {
  let mockCanvas: HTMLCanvasElement
  let mockContext: CanvasRenderingContext2D

  beforeEach(() => {
    // 创建模拟Canvas
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600
    
    mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(800 * 600 * 4),
        width: 800,
        height: 600
      })),
      putImageData: vi.fn(),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    } as any

    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext)
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('缩放功能', () => {
    it('应该正确缩放Canvas', async () => {
      const result = await pixelDensityScaler.scaleCanvas(
        mockCanvas,
        1600, 1200,
        {
          algorithm: ScalingAlgorithm.BILINEAR,
          edgeMode: 'clamp' as any,
          preserveAspectRatio: true,
          antiAliasing: true,
          sharpening: 0,
          noiseReduction: 0,
          colorCorrection: false,
          gammaCorrection: 1.0
        }
      )

      expect(result.canvas).toBeDefined()
      expect(result.scaledWidth).toBe(1600)
      expect(result.scaledHeight).toBe(1200)
      expect(result.scaleFactor).toBe(2)
      expect(result.algorithm).toBe(ScalingAlgorithm.BILINEAR)
    })
  })

  describe('设备像素密度', () => {
    it('应该获取设备像素密度信息', () => {
      // 模拟window对象
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true })
      Object.defineProperty(window, 'screen', {
        value: { width: 1920, height: 1080 },
        writable: true
      })

      const info = pixelDensityScaler.getCurrentPixelDensityInfo()
      
      expect(info.devicePixelRatio).toBe(2)
      expect(info.logicalPixels.width).toBe(1920)
      expect(info.logicalPixels.height).toBe(1080)
      expect(info.physicalPixels.width).toBe(3840)
      expect(info.physicalPixels.height).toBe(2160)
    })
  })
})

describe('分辨率管理器测试', () => {
  describe('预设分辨率', () => {
    it('应该获取预设分辨率信息', () => {
      const preset = resolutionManager.getPresetInfo(ResolutionPreset.WEB_MEDIUM)
      
      expect(preset.name).toBe('网页中等尺寸')
      expect(preset.width).toBe(800)
      expect(preset.height).toBe(600)
      expect(preset.category).toBe('web')
      expect(preset.recommendedDPI).toBe(96)
    })

    it('应该按类别获取预设', () => {
      const webPresets = resolutionManager.getPresetsByCategory('web')
      const printPresets = resolutionManager.getPresetsByCategory('print')
      
      expect(webPresets.length).toBeGreaterThan(0)
      expect(printPresets.length).toBeGreaterThan(0)
      
      webPresets.forEach(preset => {
        expect(preset.category).toBe('web')
      })
      
      printPresets.forEach(preset => {
        expect(preset.category).toBe('print')
      })
    })
  })

  describe('分辨率计算', () => {
    it('应该计算分辨率详细信息', () => {
      const result = resolutionManager.calculateResolution(1920, 1080, 96)
      
      expect(result.dpi).toBe(96)
      expect(result.pixelWidth).toBe(1920)
      expect(result.pixelHeight).toBe(1080)
      expect(result.category).toBe('custom')
      expect(result.aspectRatioName).toBe('16:9')
      expect(result.isStandardRatio).toBe(true)
    })
  })

  describe('分辨率验证', () => {
    it('应该验证有效分辨率', () => {
      const validation = resolutionManager.validateResolution(1920, 1080, 96)
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('应该检测无效分辨率', () => {
      const validation = resolutionManager.validateResolution(-100, 0, 96)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('应该提供警告和建议', () => {
      const validation = resolutionManager.validateResolution(8000, 8000, 600)
      
      expect(validation.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('宽高比处理', () => {
    it('应该检测标准宽高比', () => {
      const ratio16_9 = resolutionManager.detectAspectRatio(1920, 1080)
      const ratio4_3 = resolutionManager.detectAspectRatio(1024, 768)
      const ratio1_1 = resolutionManager.detectAspectRatio(1080, 1080)
      
      expect(ratio16_9).toBe('16:9')
      expect(ratio4_3).toBe('4:3')
      expect(ratio1_1).toBe('1:1')
    })

    it('应该保持宽高比调整尺寸', () => {
      const adjusted = resolutionManager.adjustWithAspectRatio(1920, 1080, 3840)
      
      expect(adjusted.width).toBe(3840)
      expect(adjusted.height).toBe(2160)
    })
  })
})

describe('设备适配检测器测试', () => {
  beforeEach(() => {
    // 模拟浏览器环境
    Object.defineProperty(window, 'navigator', {
      value: {
        hardwareConcurrency: 8,
        maxTouchPoints: 0,
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      writable: true
    })

    Object.defineProperty(window, 'screen', {
      value: {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1050,
        colorDepth: 24,
        pixelDepth: 24
      },
      writable: true
    })

    Object.defineProperty(window, 'performance', {
      value: {
        memory: {
          totalJSHeapSize: 100 * 1024 * 1024,
          usedJSHeapSize: 50 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
        }
      },
      writable: true
    })
  })

  describe('设备检测', () => {
    it('应该检测设备能力', async () => {
      const result = await deviceAdaptationDetector.detectDevice()
      
      expect(result.capabilities).toBeDefined()
      expect(result.capabilities.deviceType).toBeDefined()
      expect(result.capabilities.performanceLevel).toBeDefined()
      expect(result.capabilities.screenInfo).toBeDefined()
      expect(result.capabilities.hardwareInfo).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('应该提供适配建议', async () => {
      const result = await deviceAdaptationDetector.detectDevice()
      
      expect(result.recommendations.recommendedDPI).toBeGreaterThan(0)
      expect(result.recommendations.recommendedResolutions).toBeDefined()
      expect(result.recommendations.maxSafeResolution).toBeDefined()
      expect(result.recommendations.performanceOptimizations).toBeDefined()
      expect(result.recommendations.qualitySettings).toBeDefined()
    })
  })
})

describe('智能分辨率推荐引擎测试', () => {
  describe('推荐生成', () => {
    it('应该生成智能推荐', async () => {
      const context = {
        purpose: 'web' as const,
        contentType: 'chart' as const,
        targetAudience: 'general' as const
      }

      const recommendation = await smartResolutionEngine.getRecommendation(800, 600, context)
      
      expect(recommendation.recommendedDPI).toBeGreaterThan(0)
      expect(recommendation.recommendedResolution).toBeDefined()
      expect(recommendation.confidence).toBeGreaterThan(0)
      expect(recommendation.reasoning).toBeDefined()
      expect(recommendation.alternatives).toBeDefined()
      expect(recommendation.estimatedMetrics).toBeDefined()
    })

    it('应该根据用途提供不同推荐', async () => {
      const webContext = { purpose: 'web' as const, contentType: 'chart' as const, targetAudience: 'general' as const }
      const printContext = { purpose: 'print' as const, contentType: 'chart' as const, targetAudience: 'general' as const }

      const webRec = await smartResolutionEngine.getRecommendation(800, 600, webContext)
      const printRec = await smartResolutionEngine.getRecommendation(800, 600, printContext)
      
      expect(webRec.recommendedDPI).toBeLessThan(printRec.recommendedDPI)
    })
  })

  describe('学习功能', () => {
    it('应该记录用户选择', () => {
      const context = { purpose: 'web' as const, contentType: 'chart' as const, targetAudience: 'general' as const }
      const settings = { dpi: 96, resolution: { width: 800, height: 600 } }
      
      expect(() => {
        smartResolutionEngine.recordUserChoice(context, settings, 0.8)
      }).not.toThrow()
    })

    it('应该提供学习统计', () => {
      const stats = smartResolutionEngine.getLearningStats()
      
      expect(stats.totalChoices).toBeGreaterThanOrEqual(0)
      expect(stats.avgSatisfaction).toBeGreaterThanOrEqual(0)
      expect(stats.topPurposes).toBeDefined()
      expect(stats.topDPIs).toBeDefined()
    })
  })
})

describe('DPI预览系统测试', () => {
  let mockCanvas: HTMLCanvasElement

  beforeEach(() => {
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600
    
    const mockContext = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn()
    } as any

    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext)
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('预览生成', () => {
    it('应该生成DPI预览', async () => {
      const result = await dpiPreviewSystem.generatePreview(mockCanvas, 96)
      
      expect(result.dpi).toBe(96)
      expect(result.canvas).toBeDefined()
      expect(result.calculation).toBeDefined()
      expect(result.scalingResult).toBeDefined()
      expect(result.previewSize).toBeDefined()
      expect(result.qualityScore).toBeGreaterThan(0)
      expect(result.fileSize).toBeGreaterThan(0)
      expect(result.renderTime).toBeGreaterThan(0)
    })

    it('应该生成对比预览', async () => {
      const config = { dpiList: [72, 96, 150] }
      const comparison = await dpiPreviewSystem.generateComparison(mockCanvas, config)
      
      expect(comparison.previews).toHaveLength(3)
      expect(comparison.bestQuality).toBeDefined()
      expect(comparison.smallestFile).toBeDefined()
      expect(comparison.fastestRender).toBeDefined()
      expect(comparison.recommended).toBeDefined()
      expect(comparison.comparisonMetrics).toBeDefined()
    })
  })
})

describe('集成测试', () => {
  describe('完整工作流程', () => {
    it('应该执行完整的DPI优化工作流程', async () => {
      // 1. 检测设备能力
      const deviceResult = await deviceAdaptationDetector.detectDevice()
      expect(deviceResult.capabilities).toBeDefined()

      // 2. 获取智能推荐
      const context = {
        purpose: 'web' as const,
        deviceType: deviceResult.capabilities.deviceType,
        performanceLevel: deviceResult.capabilities.performanceLevel,
        contentType: 'chart' as const,
        targetAudience: 'general' as const
      }
      
      const recommendation = await smartResolutionEngine.getRecommendation(800, 600, context)
      expect(recommendation.recommendedDPI).toBeGreaterThan(0)

      // 3. 计算最终参数
      const finalResult = dpiCalculationEngine.performFullCalculation(
        recommendation.recommendedResolution.width,
        recommendation.recommendedResolution.height,
        recommendation.recommendedDPI
      )
      expect(finalResult.dpi).toBe(recommendation.recommendedDPI)

      // 4. 验证设置
      const validation = resolutionManager.validateResolution(
        finalResult.pixelWidth,
        finalResult.pixelHeight,
        finalResult.dpi
      )
      expect(validation.valid).toBe(true)
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内完成计算', async () => {
      const startTime = performance.now()
      
      // 执行多个计算操作
      const dpiResult = dpiCalculationEngine.performFullCalculation(1920, 1080, 300)
      const conversion = sizeUnitConverter.convert(10, SizeUnit.INCHES, SizeUnit.CENTIMETERS)
      const validation = resolutionManager.validateResolution(1920, 1080, 300)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100) // 应该在100ms内完成
      expect(dpiResult).toBeDefined()
      expect(conversion).toBeDefined()
      expect(validation).toBeDefined()
    })
  })

  describe('边界条件测试', () => {
    it('应该处理极端DPI值', () => {
      expect(() => dpiCalculationEngine.validateDPI(72)).not.toThrow()
      expect(() => dpiCalculationEngine.validateDPI(600)).not.toThrow()
      expect(() => dpiCalculationEngine.validateDPI(71)).toThrow()
      expect(() => dpiCalculationEngine.validateDPI(601)).toThrow()
    })

    it('应该处理极端分辨率', () => {
      const validation1 = resolutionManager.validateResolution(1, 1, 96)
      const validation2 = resolutionManager.validateResolution(8192, 8192, 96)
      const validation3 = resolutionManager.validateResolution(8193, 8193, 96)
      
      expect(validation1.valid).toBe(true)
      expect(validation2.valid).toBe(true)
      expect(validation3.valid).toBe(false)
    })
  })
})
