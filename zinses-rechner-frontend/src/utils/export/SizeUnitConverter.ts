/**
 * 尺寸单位转换器
 * 提供各种尺寸单位之间的精确转换功能
 */

import { SizeUnit } from './DPICalculationEngine'

// 转换结果接口
export interface ConversionResult {
  value: number
  unit: SizeUnit
  originalValue: number
  originalUnit: SizeUnit
  precision: number
}

// 单位信息接口
export interface UnitInfo {
  name: string
  symbol: string
  type: 'length' | 'digital'
  baseUnit: SizeUnit
  conversionFactor: number
  precision: number
  description: string
  commonUses: string[]
}

// 转换上下文接口
export interface ConversionContext {
  dpi?: number
  purpose?: 'web' | 'print' | 'mobile'
  precision?: number
}

// 单位信息映射
export const UNIT_INFO: Record<SizeUnit, UnitInfo> = {
  [SizeUnit.PIXELS]: {
    name: '像素',
    symbol: 'px',
    type: 'digital',
    baseUnit: SizeUnit.PIXELS,
    conversionFactor: 1,
    precision: 0,
    description: '数字图像的基本单位',
    commonUses: ['网页设计', '数字图像', '屏幕显示']
  },
  [SizeUnit.INCHES]: {
    name: '英寸',
    symbol: 'in',
    type: 'length',
    baseUnit: SizeUnit.INCHES,
    conversionFactor: 1,
    precision: 2,
    description: '英制长度单位，1英寸 = 2.54厘米',
    commonUses: ['打印', '屏幕尺寸', '美国标准']
  },
  [SizeUnit.CENTIMETERS]: {
    name: '厘米',
    symbol: 'cm',
    type: 'length',
    baseUnit: SizeUnit.INCHES,
    conversionFactor: 2.54,
    precision: 2,
    description: '公制长度单位',
    commonUses: ['国际标准', '日常测量', '设计规范']
  },
  [SizeUnit.MILLIMETERS]: {
    name: '毫米',
    symbol: 'mm',
    type: 'length',
    baseUnit: SizeUnit.INCHES,
    conversionFactor: 25.4,
    precision: 1,
    description: '公制长度单位，1毫米 = 0.1厘米',
    commonUses: ['精密测量', '工程设计', '印刷规范']
  },
  [SizeUnit.POINTS]: {
    name: '点',
    symbol: 'pt',
    type: 'length',
    baseUnit: SizeUnit.INCHES,
    conversionFactor: 72,
    precision: 1,
    description: '印刷单位，1英寸 = 72点',
    commonUses: ['字体大小', '印刷设计', 'PDF文档']
  },
  [SizeUnit.PICAS]: {
    name: '派卡',
    symbol: 'pc',
    type: 'length',
    baseUnit: SizeUnit.INCHES,
    conversionFactor: 6,
    precision: 2,
    description: '印刷单位，1英寸 = 6派卡',
    commonUses: ['印刷排版', '报纸设计', '杂志布局']
  }
}

// 常用转换预设
export const CONVERSION_PRESETS = {
  WEB_TO_PRINT: {
    from: SizeUnit.PIXELS,
    to: SizeUnit.INCHES,
    context: { dpi: 300, purpose: 'print' as const }
  },
  PRINT_TO_WEB: {
    from: SizeUnit.INCHES,
    to: SizeUnit.PIXELS,
    context: { dpi: 96, purpose: 'web' as const }
  },
  METRIC_TO_IMPERIAL: {
    from: SizeUnit.CENTIMETERS,
    to: SizeUnit.INCHES,
    context: { precision: 2 }
  },
  IMPERIAL_TO_METRIC: {
    from: SizeUnit.INCHES,
    to: SizeUnit.CENTIMETERS,
    context: { precision: 2 }
  }
} as const

/**
 * 尺寸单位转换器类
 */
export class SizeUnitConverter {
  private static instance: SizeUnitConverter
  private readonly DEFAULT_DPI = 96
  private readonly DEFAULT_PRECISION = 2

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): SizeUnitConverter {
    if (!SizeUnitConverter.instance) {
      SizeUnitConverter.instance = new SizeUnitConverter()
    }
    return SizeUnitConverter.instance
  }

  /**
   * 基础单位转换
   */
  public convert(
    value: number,
    fromUnit: SizeUnit,
    toUnit: SizeUnit,
    context: ConversionContext = {}
  ): ConversionResult {
    if (fromUnit === toUnit) {
      return {
        value,
        unit: toUnit,
        originalValue: value,
        originalUnit: fromUnit,
        precision: context.precision || this.DEFAULT_PRECISION
      }
    }

    const convertedValue = this.performConversion(value, fromUnit, toUnit, context)
    const precision = context.precision || UNIT_INFO[toUnit].precision

    return {
      value: this.roundToPrecision(convertedValue, precision),
      unit: toUnit,
      originalValue: value,
      originalUnit: fromUnit,
      precision
    }
  }

  /**
   * 批量转换
   */
  public convertBatch(
    values: Array<{ value: number; fromUnit: SizeUnit }>,
    toUnit: SizeUnit,
    context: ConversionContext = {}
  ): ConversionResult[] {
    return values.map(({ value, fromUnit }) =>
      this.convert(value, fromUnit, toUnit, context)
    )
  }

  /**
   * 转换为所有支持的单位
   */
  public convertToAll(
    value: number,
    fromUnit: SizeUnit,
    context: ConversionContext = {}
  ): Record<SizeUnit, ConversionResult> {
    const results: Record<SizeUnit, ConversionResult> = {} as any

    Object.values(SizeUnit).forEach(unit => {
      results[unit] = this.convert(value, fromUnit, unit, context)
    })

    return results
  }

  /**
   * 像素到物理单位转换
   */
  public pixelsToPhysical(
    pixels: number,
    toUnit: SizeUnit,
    dpi: number = this.DEFAULT_DPI
  ): ConversionResult {
    if (toUnit === SizeUnit.PIXELS) {
      return this.convert(pixels, SizeUnit.PIXELS, SizeUnit.PIXELS)
    }

    // 先转换为英寸
    const inches = pixels / dpi
    
    // 再转换为目标单位
    return this.convert(inches, SizeUnit.INCHES, toUnit)
  }

  /**
   * 物理单位到像素转换
   */
  public physicalToPixels(
    value: number,
    fromUnit: SizeUnit,
    dpi: number = this.DEFAULT_DPI
  ): ConversionResult {
    if (fromUnit === SizeUnit.PIXELS) {
      return this.convert(value, SizeUnit.PIXELS, SizeUnit.PIXELS)
    }

    // 先转换为英寸
    const inchesResult = this.convert(value, fromUnit, SizeUnit.INCHES)
    
    // 再转换为像素
    const pixels = inchesResult.value * dpi

    return {
      value: Math.round(pixels),
      unit: SizeUnit.PIXELS,
      originalValue: value,
      originalUnit: fromUnit,
      precision: 0
    }
  }

  /**
   * 智能转换（根据上下文选择最佳单位）
   */
  public smartConvert(
    value: number,
    fromUnit: SizeUnit,
    context: ConversionContext
  ): ConversionResult {
    let targetUnit: SizeUnit

    // 根据用途选择目标单位
    if (context.purpose === 'web') {
      targetUnit = SizeUnit.PIXELS
    } else if (context.purpose === 'print') {
      targetUnit = SizeUnit.INCHES
    } else if (context.purpose === 'mobile') {
      targetUnit = SizeUnit.PIXELS
    } else {
      // 默认转换逻辑
      if (fromUnit === SizeUnit.PIXELS) {
        targetUnit = SizeUnit.INCHES
      } else {
        targetUnit = SizeUnit.PIXELS
      }
    }

    return this.convert(value, fromUnit, targetUnit, context)
  }

  /**
   * 获取单位信息
   */
  public getUnitInfo(unit: SizeUnit): UnitInfo {
    return UNIT_INFO[unit]
  }

  /**
   * 获取所有单位信息
   */
  public getAllUnits(): UnitInfo[] {
    return Object.values(UNIT_INFO)
  }

  /**
   * 获取长度单位
   */
  public getLengthUnits(): UnitInfo[] {
    return Object.values(UNIT_INFO).filter(unit => unit.type === 'length')
  }

  /**
   * 获取数字单位
   */
  public getDigitalUnits(): UnitInfo[] {
    return Object.values(UNIT_INFO).filter(unit => unit.type === 'digital')
  }

  /**
   * 验证转换是否有效
   */
  public validateConversion(
    value: number,
    fromUnit: SizeUnit,
    toUnit: SizeUnit,
    context: ConversionContext = {}
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查数值有效性
    if (value <= 0) {
      errors.push('数值必须大于0')
    }

    if (!isFinite(value)) {
      errors.push('数值必须是有限数')
    }

    // 检查单位兼容性
    const fromInfo = UNIT_INFO[fromUnit]
    const toInfo = UNIT_INFO[toUnit]

    if (fromInfo.type === 'digital' && toInfo.type === 'length' && !context.dpi) {
      errors.push('数字单位转换为物理单位需要指定DPI')
    }

    if (fromInfo.type === 'length' && toInfo.type === 'digital' && !context.dpi) {
      errors.push('物理单位转换为数字单位需要指定DPI')
    }

    // 检查精度警告
    if (context.precision && context.precision > 4) {
      warnings.push('精度过高可能导致不必要的复杂性')
    }

    // 检查DPI合理性
    if (context.dpi && (context.dpi < 72 || context.dpi > 600)) {
      warnings.push('DPI值超出常用范围(72-600)')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 格式化转换结果
   */
  public formatResult(result: ConversionResult, includeOriginal: boolean = false): string {
    const unitInfo = UNIT_INFO[result.unit]
    const formattedValue = result.value.toFixed(result.precision)
    
    let formatted = `${formattedValue} ${unitInfo.symbol}`
    
    if (includeOriginal) {
      const originalUnitInfo = UNIT_INFO[result.originalUnit]
      formatted += ` (原始: ${result.originalValue} ${originalUnitInfo.symbol})`
    }
    
    return formatted
  }

  /**
   * 创建转换表
   */
  public createConversionTable(
    baseValue: number,
    baseUnit: SizeUnit,
    targetUnits: SizeUnit[],
    context: ConversionContext = {}
  ): Array<{ unit: SizeUnit; value: number; formatted: string }> {
    return targetUnits.map(unit => {
      const result = this.convert(baseValue, baseUnit, unit, context)
      return {
        unit,
        value: result.value,
        formatted: this.formatResult(result)
      }
    })
  }

  /**
   * 执行实际转换计算
   */
  private performConversion(
    value: number,
    fromUnit: SizeUnit,
    toUnit: SizeUnit,
    context: ConversionContext
  ): number {
    const fromInfo = UNIT_INFO[fromUnit]
    const toInfo = UNIT_INFO[toUnit]

    // 处理像素转换
    if (fromUnit === SizeUnit.PIXELS || toUnit === SizeUnit.PIXELS) {
      const dpi = context.dpi || this.DEFAULT_DPI
      
      if (fromUnit === SizeUnit.PIXELS) {
        // 像素转物理单位
        const inches = value / dpi
        if (toUnit === SizeUnit.INCHES) return inches
        return inches * toInfo.conversionFactor
      } else {
        // 物理单位转像素
        let inches: number
        if (fromUnit === SizeUnit.INCHES) {
          inches = value
        } else {
          inches = value / fromInfo.conversionFactor
        }
        return inches * dpi
      }
    }

    // 物理单位之间的转换
    if (fromUnit === SizeUnit.INCHES) {
      return value * toInfo.conversionFactor
    }

    if (toUnit === SizeUnit.INCHES) {
      return value / fromInfo.conversionFactor
    }

    // 通过英寸作为中间单位
    const inches = value / fromInfo.conversionFactor
    return inches * toInfo.conversionFactor
  }

  /**
   * 按精度四舍五入
   */
  private roundToPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision)
    return Math.round(value * factor) / factor
  }

  /**
   * 获取转换建议
   */
  public getConversionSuggestions(
    fromUnit: SizeUnit,
    purpose?: 'web' | 'print' | 'mobile'
  ): Array<{ unit: SizeUnit; reason: string; priority: number }> {
    const suggestions: Array<{ unit: SizeUnit; reason: string; priority: number }> = []

    if (purpose === 'web') {
      if (fromUnit !== SizeUnit.PIXELS) {
        suggestions.push({
          unit: SizeUnit.PIXELS,
          reason: '网页设计的标准单位',
          priority: 1
        })
      }
    } else if (purpose === 'print') {
      if (fromUnit !== SizeUnit.INCHES) {
        suggestions.push({
          unit: SizeUnit.INCHES,
          reason: '打印行业的标准单位',
          priority: 1
        })
      }
      if (fromUnit !== SizeUnit.CENTIMETERS) {
        suggestions.push({
          unit: SizeUnit.CENTIMETERS,
          reason: '国际标准的公制单位',
          priority: 2
        })
      }
    }

    // 通用建议
    if (fromUnit === SizeUnit.PIXELS) {
      suggestions.push({
        unit: SizeUnit.INCHES,
        reason: '便于理解物理尺寸',
        priority: 3
      })
    }

    return suggestions.sort((a, b) => a.priority - b.priority)
  }
}

// 导出单例实例
export const sizeUnitConverter = SizeUnitConverter.getInstance()
