/**
 * TaxConfigurationService单元测试
 * 测试税收配置服务的所有功能，包括设置管理、验证、计算预览、优化建议等
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TaxConfigurationService } from '../TaxConfigurationService'
import {
  TaxSettings,
  DEFAULT_TAX_SETTINGS,
  GermanState,
  ChurchTaxType,
  ETFType,
  TaxCalculationParams
} from '@/types/GermanTaxTypes'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock console方法
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock germanTaxCalculations
vi.mock('@/utils/germanTaxCalculations', () => ({
  validateTaxSettings: vi.fn().mockReturnValue({
    isValid: true,
    errors: []
  }),
  calculateAbgeltungssteuer: vi.fn().mockReturnValue({
    taxableIncome: 199,
    exemptAmount: 801,
    baseTax: 49.75,
    solidarityTax: 2.74,
    churchTax: 4.48,
    totalTax: 56.97,
    netIncome: 943.03,
    effectiveTaxRate: 0.057,
    breakdown: {
      baseTax: 49.75,
      solidarityTax: 2.74,
      churchTax: 4.48,
      exemptAmount: 801,
      etfExemption: 0
    },
    calculatedAt: new Date()
  })
}))

describe('TaxConfigurationService', () => {
  let service: TaxConfigurationService
  let defaultSettings: TaxSettings

  beforeEach(() => {
    // 清除所有mock调用记录
    vi.clearAllMocks()
    
    // 重置localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    
    // 深拷贝默认设置
    defaultSettings = JSON.parse(JSON.stringify(DEFAULT_TAX_SETTINGS))
    
    // 重置单例实例
    ;(TaxConfigurationService as any).instance = null
    
    // 创建新的服务实例
    service = TaxConfigurationService.getInstance()
  })

  afterEach(() => {
    // 清理
    ;(TaxConfigurationService as any).instance = null
  })

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = TaxConfigurationService.getInstance()
      const instance2 = TaxConfigurationService.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('应该在初始化时记录日志', () => {
      expect(mockConsoleLog).toHaveBeenCalledWith('🏛️ 税收配置服务已初始化')
    })
  })

  describe('设置管理', () => {
    it('应该返回当前设置的副本', () => {
      const settings = service.getCurrentSettings()
      
      expect(settings).toEqual(defaultSettings)
      expect(settings).not.toBe(service['currentSettings']) // 确保是副本
    })

    it('应该成功更新有效设置', () => {
      const newSettings = {
        ...defaultSettings,
        userInfo: {
          ...defaultSettings.userInfo,
          state: GermanState.BAYERN,
          churchTaxType: ChurchTaxType.CATHOLIC
        }
      }

      const result = service.updateSettings(newSettings)

      expect(result).toBe(true)
      expect(service.getCurrentSettings().userInfo.state).toBe(GermanState.BAYERN)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('应该拒绝无效设置', () => {
      // Mock验证失败
      const { validateTaxSettings } = require('@/utils/germanTaxCalculations')
      validateTaxSettings.mockReturnValueOnce({
        isValid: false,
        errors: ['测试错误']
      })

      const invalidSettings = { ...defaultSettings }
      const result = service.updateSettings(invalidSettings)

      expect(result).toBe(false)
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('应该跳过验证当skipValidation为true', () => {
      const newSettings = { ...defaultSettings }
      const result = service.updateSettings(newSettings, true)

      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('应该维护设置历史记录', () => {
      const settings1 = { ...defaultSettings, userInfo: { ...defaultSettings.userInfo, state: GermanState.BAYERN } }
      const settings2 = { ...defaultSettings, userInfo: { ...defaultSettings.userInfo, state: GermanState.NORDRHEIN_WESTFALEN } }

      service.updateSettings(settings1)
      service.updateSettings(settings2)

      const history = service.getSettingsHistory()
      expect(history).toHaveLength(2)
      expect(history[0].userInfo.state).toBe(GermanState.BAYERN)
    })

    it('应该限制历史记录长度为10', () => {
      // 添加11个设置变更
      for (let i = 0; i < 11; i++) {
        const settings = { 
          ...defaultSettings, 
          userInfo: { 
            ...defaultSettings.userInfo, 
            taxYear: 2020 + i 
          } 
        }
        service.updateSettings(settings)
      }

      const history = service.getSettingsHistory()
      expect(history).toHaveLength(10)
      expect(history[0].userInfo.taxYear).toBe(2021) // 最早的应该被移除
    })
  })

  describe('设置验证', () => {
    it('应该验证免税额度分配总和', () => {
      const settingsWithOverAllocation = {
        ...defaultSettings,
        freistellungsauftrag: {
          ...defaultSettings.freistellungsauftrag,
          enabled: true,
          allocations: [
            {
              id: '1',
              bankName: 'Bank A',
              allocatedAmount: 500,
              usedAmount: 0,
              remainingAmount: 500,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: '2',
              bankName: 'Bank B',
              allocatedAmount: 400,
              usedAmount: 0,
              remainingAmount: 400,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      }

      const validation = service.validateSettings(settingsWithOverAllocation)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('überschreitet'))).toBe(true)
    })

    it('应该验证教会税设置一致性', () => {
      const settingsWithInconsistentChurchTax = {
        ...defaultSettings,
        userInfo: {
          ...defaultSettings.userInfo,
          churchTaxType: ChurchTaxType.NONE
        },
        abgeltungssteuer: {
          ...defaultSettings.abgeltungssteuer,
          calculation: {
            ...defaultSettings.abgeltungssteuer.calculation,
            includeChurchTax: true
          }
        }
      }

      const validation = service.validateSettings(settingsWithInconsistentChurchTax)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('Kirchensteuer'))).toBe(true)
    })

    it('应该验证教会税税率与联邦州的一致性', () => {
      const settingsWithWrongChurchTaxRate = {
        ...defaultSettings,
        userInfo: {
          ...defaultSettings.userInfo,
          state: GermanState.BAYERN, // 巴伐利亚州应该是8%
          churchTaxType: ChurchTaxType.CATHOLIC
        },
        abgeltungssteuer: {
          ...defaultSettings.abgeltungssteuer,
          calculation: {
            ...defaultSettings.abgeltungssteuer.calculation,
            includeChurchTax: true
          },
          churchTax: {
            ...defaultSettings.abgeltungssteuer.churchTax,
            rate: 0.09 // 错误的税率，应该是0.08
          }
        }
      }

      const validation = service.validateSettings(settingsWithWrongChurchTaxRate)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('Kirchensteuersatz'))).toBe(true)
    })
  })

  describe('税收计算预览', () => {
    it('应该计算税收预览', () => {
      const result = service.calculateTaxPreview(1000, ETFType.EQUITY_FOREIGN)

      expect(result).toBeDefined()
      expect(result.totalTax).toBe(56.97)
      expect(result.netIncome).toBe(943.03)
    })

    it('应该使用当前设置进行计算', () => {
      const { calculateAbgeltungssteuer } = require('@/utils/germanTaxCalculations')
      
      service.calculateTaxPreview(1000, ETFType.EQUITY_FOREIGN)

      expect(calculateAbgeltungssteuer).toHaveBeenCalledWith(
        expect.objectContaining({
          income: 1000,
          etfType: ETFType.EQUITY_FOREIGN,
          incomeType: 'capital_gains'
        }),
        expect.objectContaining(defaultSettings)
      )
    })
  })

  describe('回调机制', () => {
    it('应该注册和触发变更回调', () => {
      const callback = vi.fn()
      service.onSettingsChange('test', callback)

      const newSettings = { ...defaultSettings }
      service.updateSettings(newSettings)

      expect(callback).toHaveBeenCalledWith(expect.objectContaining(newSettings))
    })

    it('应该注册和触发验证回调', () => {
      const callback = vi.fn()
      service.onValidationError('test', callback)

      // Mock验证失败
      const { validateTaxSettings } = require('@/utils/germanTaxCalculations')
      validateTaxSettings.mockReturnValueOnce({
        isValid: false,
        errors: ['测试错误']
      })

      const invalidSettings = { ...defaultSettings }
      service.updateSettings(invalidSettings)

      expect(callback).toHaveBeenCalledWith(['测试错误'])
    })

    it('应该移除回调', () => {
      const callback = vi.fn()
      service.onSettingsChange('test', callback)
      service.offSettingsChange('test')

      const newSettings = { ...defaultSettings }
      service.updateSettings(newSettings)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('默认设置管理', () => {
    it('应该应用默认设置', () => {
      service.applyDefaultSettings()

      const currentSettings = service.getCurrentSettings()
      expect(currentSettings.metadata.createdAt).toBeDefined()
      expect(currentSettings.metadata.updatedAt).toBeDefined()
    })

    it('应该重置为默认设置', () => {
      // 先修改设置
      const modifiedSettings = {
        ...defaultSettings,
        userInfo: { ...defaultSettings.userInfo, state: GermanState.BAYERN }
      }
      service.updateSettings(modifiedSettings)

      // 重置
      service.resetToDefaults()

      const currentSettings = service.getCurrentSettings()
      expect(currentSettings.userInfo.state).toBe(DEFAULT_TAX_SETTINGS.userInfo.state)
      expect(mockConsoleLog).toHaveBeenCalledWith('🔄 税收设置已重置为默认值')
    })
  })

  describe('导入导出功能', () => {
    it('应该导出设置为JSON字符串', () => {
      const exportedData = service.exportSettings()
      const parsedData = JSON.parse(exportedData)

      expect(parsedData.settings).toEqual(defaultSettings)
      expect(parsedData.exportedAt).toBeDefined()
      expect(parsedData.version).toBe('1.0.0')
      expect(parsedData.application).toBe('Zinses Rechner')
    })

    it('应该成功导入有效设置', () => {
      const exportData = {
        settings: {
          ...defaultSettings,
          userInfo: { ...defaultSettings.userInfo, state: GermanState.BAYERN }
        },
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        application: 'Zinses Rechner'
      }

      const result = service.importSettings(JSON.stringify(exportData))

      expect(result.success).toBe(true)
      expect(service.getCurrentSettings().userInfo.state).toBe(GermanState.BAYERN)
    })

    it('应该拒绝无效的导入数据', () => {
      const result = service.importSettings('invalid json')

      expect(result.success).toBe(false)
      expect(result.error).toContain('格式')
    })

    it('应该拒绝不兼容版本的导入数据', () => {
      const exportData = {
        settings: defaultSettings,
        exportedAt: new Date().toISOString(),
        version: '999.0.0', // 不兼容的版本
        application: 'Zinses Rechner'
      }

      const result = service.importSettings(JSON.stringify(exportData))

      expect(result.success).toBe(false)
      expect(result.error).toContain('版本')
    })
  })
})
