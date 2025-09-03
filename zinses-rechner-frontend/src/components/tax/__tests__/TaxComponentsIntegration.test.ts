/**
 * 税收组件集成测试套件
 * 验证TaxSettings组件与各个服务类的协作，测试数据流、状态管理、事件传播等集成功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import TaxSettings from '../TaxSettings.vue'
import { TaxConfigurationService } from '../../../services/tax/TaxConfigurationService'
import { TaxHelpService } from '../../../services/tax/TaxHelpService'
import { TaxStorageService } from '../../../services/tax/TaxStorageService'
import type { GermanTaxConfiguration } from '../../../types/GermanTaxTypes'

// Mock服务类
vi.mock('../../../services/tax/TaxConfigurationService')
vi.mock('../../../services/tax/TaxHelpService')
vi.mock('../../../services/tax/TaxStorageService')

describe('税收组件集成测试', () => {
  let wrapper: VueWrapper<any>
  let mockTaxConfigService: any
  let mockTaxHelpService: any
  let mockTaxStorageService: any

  const defaultTaxConfig: GermanTaxConfiguration = {
    federalState: 'Bayern',
    hasChurchTax: true,
    churchTaxRate: 0.08,
    freistellungsauftrag: {
      enabled: true,
      totalAmount: 801,
      allocations: []
    },
    etfSettings: {
      enabled: true,
      teilfreistellung: 0.3
    },
    customSettings: {
      solidarityTax: true,
      customTaxRate: 0
    }
  }

  beforeEach(() => {
    // 创建mock服务实例
    mockTaxConfigService = {
      loadConfiguration: vi.fn().mockResolvedValue(defaultTaxConfig),
      saveConfiguration: vi.fn().mockResolvedValue(true),
      validateConfiguration: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
      resetToDefaults: vi.fn().mockResolvedValue(defaultTaxConfig),
      exportConfiguration: vi.fn().mockResolvedValue('exported-data'),
      importConfiguration: vi.fn().mockResolvedValue(defaultTaxConfig),
      onConfigurationChange: vi.fn(),
      offConfigurationChange: vi.fn(),
      calculateTotalTaxRate: vi.fn().mockReturnValue(0.2638)
    }

    mockTaxHelpService = {
      getHelpContent: vi.fn().mockResolvedValue({
        title: '测试帮助标题',
        content: '测试帮助内容',
        examples: []
      }),
      searchHelp: vi.fn().mockResolvedValue([]),
      getContextualHelp: vi.fn().mockResolvedValue({
        tips: ['测试提示'],
        warnings: [],
        recommendations: []
      }),
      getFAQ: vi.fn().mockResolvedValue([]),
      getPersonalizedRecommendations: vi.fn().mockResolvedValue([])
    }

    mockTaxStorageService = {
      saveSettings: vi.fn().mockResolvedValue(true),
      loadSettings: vi.fn().mockResolvedValue(defaultTaxConfig),
      deleteSettings: vi.fn().mockResolvedValue(true),
      exportSettings: vi.fn().mockResolvedValue('exported-settings'),
      importSettings: vi.fn().mockResolvedValue(defaultTaxConfig),
      getStorageInfo: vi.fn().mockResolvedValue({
        size: 1024,
        lastModified: new Date(),
        version: '1.0.0'
      }),
      migrateSettings: vi.fn().mockResolvedValue(defaultTaxConfig),
      backupSettings: vi.fn().mockResolvedValue('backup-data'),
      restoreSettings: vi.fn().mockResolvedValue(defaultTaxConfig)
    }

    // Mock构造函数
    vi.mocked(TaxConfigurationService).mockImplementation(() => mockTaxConfigService)
    vi.mocked(TaxHelpService).mockImplementation(() => mockTaxHelpService)
    vi.mocked(TaxStorageService).mockImplementation(() => mockTaxStorageService)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('组件初始化集成测试', () => {
    it('应该正确初始化所有服务并加载配置', async () => {
      wrapper = mount(TaxSettings)
      await nextTick()

      // 验证服务实例化
      expect(TaxConfigurationService).toHaveBeenCalled()
      expect(TaxHelpService).toHaveBeenCalled()
      expect(TaxStorageService).toHaveBeenCalled()

      // 验证配置加载
      expect(mockTaxConfigService.loadConfiguration).toHaveBeenCalled()
      expect(mockTaxStorageService.loadSettings).toHaveBeenCalled()

      // 验证组件状态
      expect(wrapper.vm.taxConfig.federalState).toBe('Bayern')
      expect(wrapper.vm.taxConfig.hasChurchTax).toBe(true)
    })

    it('应该处理服务初始化失败', async () => {
      mockTaxConfigService.loadConfiguration.mockRejectedValue(new Error('加载失败'))
      
      wrapper = mount(TaxSettings)
      await nextTick()

      // 验证错误处理
      expect(wrapper.vm.hasError).toBe(true)
      expect(wrapper.vm.errorMessage).toContain('加载失败')
    })

    it('应该设置事件监听器', async () => {
      wrapper = mount(TaxSettings)
      await nextTick()

      // 验证事件监听器设置
      expect(mockTaxConfigService.onConfigurationChange).toHaveBeenCalled()
    })
  })

  describe('数据流集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettings)
      await nextTick()
    })

    it('应该正确处理配置变更的完整数据流', async () => {
      // 模拟用户修改联邦州
      const stateSelect = wrapper.find('select[data-testid="federal-state-select"]')
      await stateSelect.setValue('Hessen')

      // 验证数据流：组件 -> 配置服务 -> 存储服务
      expect(wrapper.vm.taxConfig.federalState).toBe('Hessen')
      expect(mockTaxConfigService.saveConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({ federalState: 'Hessen' })
      )
      expect(mockTaxStorageService.saveSettings).toHaveBeenCalled()
    })

    it('应该处理配置验证失败的数据流', async () => {
      mockTaxConfigService.validateConfiguration.mockReturnValue({
        isValid: false,
        errors: ['联邦州无效']
      })

      // 模拟无效输入
      const stateSelect = wrapper.find('select[data-testid="federal-state-select"]')
      await stateSelect.setValue('InvalidState')

      // 验证错误处理数据流
      expect(wrapper.vm.validationErrors).toContain('联邦州无效')
      expect(mockTaxConfigService.saveConfiguration).not.toHaveBeenCalled()
    })

    it('应该处理存储失败的数据流', async () => {
      mockTaxStorageService.saveSettings.mockRejectedValue(new Error('存储失败'))

      // 模拟配置变更
      const churchTaxCheckbox = wrapper.find('input[data-testid="church-tax-checkbox"]')
      await churchTaxCheckbox.setChecked(false)

      // 验证错误处理
      await nextTick()
      expect(wrapper.vm.hasError).toBe(true)
      expect(wrapper.vm.errorMessage).toContain('存储失败')
    })
  })

  describe('服务间协作集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettings)
      await nextTick()
    })

    it('应该协调配置服务和存储服务的数据同步', async () => {
      const newConfig = { ...defaultTaxConfig, federalState: 'Berlin' }
      
      // 模拟配置变更
      await wrapper.vm.updateTaxConfiguration(newConfig)

      // 验证服务间协作
      expect(mockTaxConfigService.saveConfiguration).toHaveBeenCalledWith(newConfig)
      expect(mockTaxStorageService.saveSettings).toHaveBeenCalledWith(newConfig)
      expect(mockTaxConfigService.validateConfiguration).toHaveBeenCalledWith(newConfig)
    })

    it('应该协调帮助服务和配置服务的上下文相关帮助', async () => {
      // 模拟请求帮助
      await wrapper.vm.showContextualHelp('freistellungsauftrag')

      // 验证服务协作
      expect(mockTaxHelpService.getContextualHelp).toHaveBeenCalledWith(
        'freistellungsauftrag',
        wrapper.vm.taxConfig
      )
    })

    it('应该协调所有服务的配置导出', async () => {
      // 模拟导出操作
      await wrapper.vm.exportConfiguration()

      // 验证服务协作
      expect(mockTaxConfigService.exportConfiguration).toHaveBeenCalled()
      expect(mockTaxStorageService.exportSettings).toHaveBeenCalled()
    })

    it('应该协调所有服务的配置导入', async () => {
      const importData = 'imported-config-data'
      
      // 模拟导入操作
      await wrapper.vm.importConfiguration(importData)

      // 验证服务协作
      expect(mockTaxConfigService.importConfiguration).toHaveBeenCalledWith(importData)
      expect(mockTaxStorageService.importSettings).toHaveBeenCalledWith(importData)
    })
  })

  describe('状态管理集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettings)
      await nextTick()
    })

    it('应该正确管理加载状态', async () => {
      // 模拟长时间加载
      mockTaxConfigService.loadConfiguration.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(defaultTaxConfig), 100))
      )

      wrapper = mount(TaxSettings)
      
      // 验证加载状态
      expect(wrapper.vm.isLoading).toBe(true)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      await nextTick()
      
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('应该正确管理保存状态', async () => {
      // 模拟长时间保存
      mockTaxConfigService.saveConfiguration.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      )

      // 触发保存
      await wrapper.vm.saveTaxConfiguration()

      // 验证保存状态
      expect(wrapper.vm.isSaving).toBe(true)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      await nextTick()
      
      expect(wrapper.vm.isSaving).toBe(false)
    })

    it('应该正确管理错误状态', async () => {
      mockTaxConfigService.saveConfiguration.mockRejectedValue(new Error('保存失败'))

      // 触发错误
      await wrapper.vm.saveTaxConfiguration()

      // 验证错误状态
      expect(wrapper.vm.hasError).toBe(true)
      expect(wrapper.vm.errorMessage).toBe('保存失败')

      // 验证错误清除
      await wrapper.vm.clearError()
      expect(wrapper.vm.hasError).toBe(false)
      expect(wrapper.vm.errorMessage).toBe('')
    })

    it('应该正确管理验证状态', async () => {
      // 模拟验证失败
      mockTaxConfigService.validateConfiguration.mockReturnValue({
        isValid: false,
        errors: ['验证错误1', '验证错误2']
      })

      // 触发验证
      await wrapper.vm.validateCurrentConfiguration()

      // 验证状态
      expect(wrapper.vm.isValid).toBe(false)
      expect(wrapper.vm.validationErrors).toEqual(['验证错误1', '验证错误2'])
    })
  })

  describe('事件传播集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettings)
      await nextTick()
    })

    it('应该正确传播配置变更事件', async () => {
      const configChangeHandler = vi.fn()
      wrapper.vm.$on('configurationChanged', configChangeHandler)

      // 模拟配置变更
      const newConfig = { ...defaultTaxConfig, federalState: 'Hamburg' }
      await wrapper.vm.updateTaxConfiguration(newConfig)

      // 验证事件传播
      expect(configChangeHandler).toHaveBeenCalledWith(newConfig)
    })

    it('应该正确传播验证事件', async () => {
      const validationHandler = vi.fn()
      wrapper.vm.$on('validationChanged', validationHandler)

      // 模拟验证状态变更
      mockTaxConfigService.validateConfiguration.mockReturnValue({
        isValid: false,
        errors: ['测试错误']
      })

      await wrapper.vm.validateCurrentConfiguration()

      // 验证事件传播
      expect(validationHandler).toHaveBeenCalledWith({
        isValid: false,
        errors: ['测试错误']
      })
    })

    it('应该正确传播错误事件', async () => {
      const errorHandler = vi.fn()
      wrapper.vm.$on('error', errorHandler)

      // 模拟错误
      const error = new Error('测试错误')
      mockTaxConfigService.saveConfiguration.mockRejectedValue(error)

      await wrapper.vm.saveTaxConfiguration()

      // 验证事件传播
      expect(errorHandler).toHaveBeenCalledWith(error)
    })

    it('应该正确处理服务事件回调', async () => {
      // 模拟服务事件触发
      const configChangeCallback = mockTaxConfigService.onConfigurationChange.mock.calls[0][0]
      const newConfig = { ...defaultTaxConfig, federalState: 'Sachsen' }

      await configChangeCallback(newConfig)

      // 验证组件状态更新
      expect(wrapper.vm.taxConfig.federalState).toBe('Sachsen')
    })
  })

  describe('异步操作集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettings)
      await nextTick()
    })

    it('应该正确处理并发配置保存', async () => {
      const config1 = { ...defaultTaxConfig, federalState: 'Bayern' }
      const config2 = { ...defaultTaxConfig, federalState: 'Berlin' }

      // 模拟并发保存
      const promise1 = wrapper.vm.updateTaxConfiguration(config1)
      const promise2 = wrapper.vm.updateTaxConfiguration(config2)

      await Promise.all([promise1, promise2])

      // 验证最后的配置生效
      expect(wrapper.vm.taxConfig.federalState).toBe('Berlin')
      expect(mockTaxConfigService.saveConfiguration).toHaveBeenCalledTimes(2)
    })

    it('应该正确处理异步加载和保存的竞态条件', async () => {
      // 模拟加载和保存同时进行
      const loadPromise = wrapper.vm.loadTaxConfiguration()
      const savePromise = wrapper.vm.saveTaxConfiguration()

      await Promise.all([loadPromise, savePromise])

      // 验证状态一致性
      expect(wrapper.vm.isLoading).toBe(false)
      expect(wrapper.vm.isSaving).toBe(false)
    })

    it('应该正确处理异步操作的错误恢复', async () => {
      // 模拟第一次保存失败
      mockTaxConfigService.saveConfiguration
        .mockRejectedValueOnce(new Error('网络错误'))
        .mockResolvedValueOnce(true)

      // 第一次保存失败
      await wrapper.vm.saveTaxConfiguration()
      expect(wrapper.vm.hasError).toBe(true)

      // 重试保存成功
      await wrapper.vm.saveTaxConfiguration()
      expect(wrapper.vm.hasError).toBe(false)
    })
  })

  describe('内存管理集成测试', () => {
    it('应该正确清理事件监听器', async () => {
      wrapper = mount(TaxSettings)
      await nextTick()

      // 验证监听器设置
      expect(mockTaxConfigService.onConfigurationChange).toHaveBeenCalled()

      // 卸载组件
      wrapper.unmount()

      // 验证监听器清理
      expect(mockTaxConfigService.offConfigurationChange).toHaveBeenCalled()
    })

    it('应该正确处理组件销毁时的异步操作', async () => {
      wrapper = mount(TaxSettings)
      await nextTick()

      // 启动异步操作
      const savePromise = wrapper.vm.saveTaxConfiguration()

      // 立即卸载组件
      wrapper.unmount()

      // 等待异步操作完成，不应该抛出错误
      await expect(savePromise).resolves.not.toThrow()
    })
  })

  describe('性能集成测试', () => {
    it('应该优化频繁的配置更新', async () => {
      wrapper = mount(TaxSettings)
      await nextTick()

      // 模拟频繁更新
      for (let i = 0; i < 10; i++) {
        await wrapper.vm.updateTaxConfiguration({
          ...defaultTaxConfig,
          customSettings: { ...defaultTaxConfig.customSettings, customTaxRate: i * 0.01 }
        })
      }

      // 验证防抖机制（应该少于10次调用）
      expect(mockTaxConfigService.saveConfiguration.mock.calls.length).toBeLessThan(10)
    })

    it('应该缓存帮助内容以提高性能', async () => {
      wrapper = mount(TaxSettings)
      await nextTick()

      // 多次请求相同帮助内容
      await wrapper.vm.showContextualHelp('freistellungsauftrag')
      await wrapper.vm.showContextualHelp('freistellungsauftrag')
      await wrapper.vm.showContextualHelp('freistellungsauftrag')

      // 验证缓存机制（应该只调用一次）
      expect(mockTaxHelpService.getContextualHelp).toHaveBeenCalledTimes(1)
    })
  })

  describe('错误边界集成测试', () => {
    it('应该优雅处理服务不可用', async () => {
      // 模拟所有服务都不可用
      vi.mocked(TaxConfigurationService).mockImplementation(() => {
        throw new Error('服务不可用')
      })

      wrapper = mount(TaxSettings)
      await nextTick()

      // 验证错误处理
      expect(wrapper.vm.hasError).toBe(true)
      expect(wrapper.vm.errorMessage).toContain('服务不可用')
    })

    it('应该处理部分服务失败的情况', async () => {
      mockTaxHelpService.getHelpContent.mockRejectedValue(new Error('帮助服务失败'))

      wrapper = mount(TaxSettings)
      await nextTick()

      // 验证部分功能仍可用
      expect(wrapper.vm.taxConfig).toBeDefined()
      expect(wrapper.vm.canShowHelp).toBe(false)
    })
  })
})
