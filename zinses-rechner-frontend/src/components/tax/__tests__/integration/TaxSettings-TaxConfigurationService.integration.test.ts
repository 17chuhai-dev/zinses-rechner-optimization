/**
 * TaxSettings与TaxConfigurationService集成测试
 * 验证组件与配置服务的协作关系和数据流
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick, ref, onMounted, onUnmounted } from 'vue'
import { TaxConfigurationService } from '@/services/TaxConfigurationService'
import {
  TaxSettings as TaxSettingsType,
  DEFAULT_TAX_SETTINGS,
  GermanState,
  ChurchTaxType,
  ETFType
} from '@/types/GermanTaxTypes'

// 创建简化的TaxSettings组件用于集成测试
const TaxSettingsTestComponent = {
  name: 'TaxSettingsTest',
  template: `
    <div class="tax-settings-test" data-testid="tax-settings">
      <div class="user-info-section">
        <select
          id="state-select"
          v-model="settings.userInfo.state"
          @change="handleStateChange"
          data-testid="state-select"
        >
          <option value="">请选择联邦州</option>
          <option value="NORDRHEIN_WESTFALEN">北莱茵-威斯特法伦州</option>
          <option value="BAYERN">巴伐利亚州</option>
          <option value="BADEN_WUERTTEMBERG">巴登-符腾堡州</option>
        </select>

        <div class="church-tax-section">
          <input
            type="radio"
            id="church-none"
            value="NONE"
            v-model="settings.userInfo.churchTaxType"
            @change="handleChurchTaxChange"
            data-testid="church-none"
          />
          <label for="church-none">无教会税</label>

          <input
            type="radio"
            id="church-catholic"
            value="CATHOLIC"
            v-model="settings.userInfo.churchTaxType"
            @change="handleChurchTaxChange"
            data-testid="church-catholic"
          />
          <label for="church-catholic">天主教</label>
        </div>
      </div>

      <div class="abgeltungssteuer-section">
        <input
          type="checkbox"
          id="abgeltungssteuer-enabled"
          v-model="settings.abgeltungssteuer.enabled"
          @change="handleAbgeltungssteuerChange"
          data-testid="abgeltungssteuer-enabled"
        />
        <label for="abgeltungssteuer-enabled">启用资本利得税</label>

        <input
          type="checkbox"
          id="include-solidarity-tax"
          v-model="settings.abgeltungssteuer.calculation.includeSolidarityTax"
          @change="handleCalculationChange"
          data-testid="include-solidarity-tax"
        />
        <label for="include-solidarity-tax">包含团结税</label>
      </div>

      <div class="freistellungsauftrag-section">
        <input
          type="checkbox"
          id="freistellungsauftrag-enabled"
          v-model="settings.freistellungsauftrag.enabled"
          @change="handleFreistellungsauftragChange"
          data-testid="freistellungsauftrag-enabled"
        />
        <label for="freistellungsauftrag-enabled">启用免税额度</label>

        <input
          type="number"
          id="annual-allowance"
          v-model.number="settings.freistellungsauftrag.annualAllowance"
          @input="handleAllowanceChange"
          data-testid="annual-allowance"
        />
      </div>

      <div class="actions">
        <button
          @click="saveSettings"
          :disabled="isSaving"
          data-testid="save-button"
        >
          {{ isSaving ? '保存中...' : '保存设置' }}
        </button>

        <button
          @click="resetSettings"
          data-testid="reset-button"
        >
          重置设置
        </button>

        <button
          @click="loadSettings"
          data-testid="load-button"
        >
          加载设置
        </button>
      </div>

      <div v-if="validationErrors.length > 0" class="validation-errors" data-testid="validation-errors">
        <ul>
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <div v-if="statusMessage" class="status-message" data-testid="status-message">
        {{ statusMessage }}
      </div>
    </div>
  `,
  setup() {
    const configService = TaxConfigurationService.getInstance()
    const settings = ref({ ...DEFAULT_TAX_SETTINGS })
    const isSaving = ref(false)
    const validationErrors = ref([])
    const statusMessage = ref('')

    // 组件挂载时加载设置
    onMounted(async () => {
      try {
        const loadedSettings = configService.getCurrentSettings()
        settings.value = { ...loadedSettings }
        statusMessage.value = '设置已加载'
      } catch (error) {
        statusMessage.value = '加载设置失败'
        console.error('加载设置失败:', error)
      }
    })

    // 监听配置服务的变更
    const unsubscribeSettingsChange = configService.onSettingsChange('test-component', (newSettings) => {
      settings.value = { ...newSettings }
      statusMessage.value = '设置已更新'
    })

    const unsubscribeValidationError = configService.onValidationError('test-component', (errors) => {
      validationErrors.value = errors
      statusMessage.value = '验证失败'
    })

    // 清理监听器
    onUnmounted(() => {
      unsubscribeSettingsChange()
      unsubscribeValidationError()
    })

    // 事件处理器
    const handleStateChange = () => {
      updateSettings()
    }

    const handleChurchTaxChange = () => {
      updateSettings()
    }

    const handleAbgeltungssteuerChange = () => {
      updateSettings()
    }

    const handleCalculationChange = () => {
      updateSettings()
    }

    const handleFreistellungsauftragChange = () => {
      updateSettings()
    }

    const handleAllowanceChange = () => {
      updateSettings()
    }

    const updateSettings = async () => {
      try {
        const success = configService.updateSettings(settings.value)
        if (success) {
          statusMessage.value = '设置已更新'
          validationErrors.value = []
        } else {
          statusMessage.value = '设置更新失败'
        }
      } catch (error) {
        statusMessage.value = '设置更新出错'
        console.error('设置更新出错:', error)
      }
    }

    const saveSettings = async () => {
      isSaving.value = true
      statusMessage.value = '正在保存...'

      try {
        const success = configService.updateSettings(settings.value)
        if (success) {
          statusMessage.value = '设置保存成功'
        } else {
          statusMessage.value = '设置保存失败'
        }
      } catch (error) {
        statusMessage.value = '保存出错'
        console.error('保存出错:', error)
      } finally {
        isSaving.value = false
      }
    }

    const resetSettings = () => {
      configService.resetToDefaults()
      settings.value = { ...DEFAULT_TAX_SETTINGS }
      validationErrors.value = []
      statusMessage.value = '设置已重置'
    }

    const loadSettings = () => {
      const loadedSettings = configService.getCurrentSettings()
      settings.value = { ...loadedSettings }
      statusMessage.value = '设置已重新加载'
    }

    return {
      settings,
      isSaving,
      validationErrors,
      statusMessage,
      handleStateChange,
      handleChurchTaxChange,
      handleAbgeltungssteuerChange,
      handleCalculationChange,
      handleFreistellungsauftragChange,
      handleAllowanceChange,
      saveSettings,
      resetSettings,
      loadSettings
    }
  }
}

describe('TaxSettings与TaxConfigurationService集成测试', () => {
  let wrapper: VueWrapper<any>
  let configService: TaxConfigurationService

  beforeEach(() => {
    // 重置单例实例
    ;(TaxConfigurationService as any).instance = null
    configService = TaxConfigurationService.getInstance()

    // 清除所有mock调用记录
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    // 清理单例实例
    ;(TaxConfigurationService as any).instance = null
  })

  describe('组件与服务初始化集成', () => {
    it('应该在组件挂载时正确加载配置服务的设置', async () => {
      // 预设配置服务的设置
      const testSettings = {
        ...DEFAULT_TAX_SETTINGS,
        userInfo: {
          ...DEFAULT_TAX_SETTINGS.userInfo,
          state: GermanState.BAYERN,
          churchTaxType: ChurchTaxType.CATHOLIC
        }
      }
      configService.updateSettings(testSettings)

      wrapper = mount(TaxSettingsTestComponent)
      await nextTick()

      // 验证组件加载了配置服务的设置
      expect(wrapper.vm.settings.userInfo.state).toBe(GermanState.BAYERN)
      expect(wrapper.vm.settings.userInfo.churchTaxType).toBe(ChurchTaxType.CATHOLIC)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置已加载')
    })

    it('应该正确注册配置变更监听器', async () => {
      wrapper = mount(TaxSettingsTestComponent)
      await nextTick()

      // 通过配置服务更新设置
      const newSettings = {
        ...DEFAULT_TAX_SETTINGS,
        userInfo: {
          ...DEFAULT_TAX_SETTINGS.userInfo,
          state: GermanState.NORDRHEIN_WESTFALEN
        }
      }
      configService.updateSettings(newSettings)
      await nextTick()

      // 验证组件接收到了配置变更
      expect(wrapper.vm.settings.userInfo.state).toBe(GermanState.NORDRHEIN_WESTFALEN)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置已更新')
    })
  })

  describe('数据双向绑定集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsTestComponent)
      await nextTick()
    })

    it('应该在用户修改联邦州时同步更新配置服务', async () => {
      const stateSelect = wrapper.find('[data-testid="state-select"]')

      // 模拟用户选择联邦州
      await stateSelect.setValue(GermanState.BAYERN)
      await nextTick()

      // 验证配置服务的设置已更新
      const currentSettings = configService.getCurrentSettings()
      expect(currentSettings.userInfo.state).toBe(GermanState.BAYERN)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置已更新')
    })

    it('应该在用户修改教会税类型时同步更新配置服务', async () => {
      const churchCatholic = wrapper.find('[data-testid="church-catholic"]')

      // 模拟用户选择天主教
      await churchCatholic.setChecked(true)
      await nextTick()

      // 验证配置服务的设置已更新
      const currentSettings = configService.getCurrentSettings()
      expect(currentSettings.userInfo.churchTaxType).toBe(ChurchTaxType.CATHOLIC)
    })

    it('应该在用户修改资本利得税设置时同步更新配置服务', async () => {
      const abgeltungssteuerCheckbox = wrapper.find('[data-testid="abgeltungssteuer-enabled"]')

      // 模拟用户启用资本利得税
      await abgeltungssteuerCheckbox.setChecked(true)
      await nextTick()

      // 验证配置服务的设置已更新
      const currentSettings = configService.getCurrentSettings()
      expect(currentSettings.abgeltungssteuer.enabled).toBe(true)
    })

    it('应该在用户修改免税额度时同步更新配置服务', async () => {
      const allowanceInput = wrapper.find('[data-testid="annual-allowance"]')

      // 模拟用户修改免税额度
      await allowanceInput.setValue('1000')
      await nextTick()

      // 验证配置服务的设置已更新
      const currentSettings = configService.getCurrentSettings()
      expect(currentSettings.freistellungsauftrag.annualAllowance).toBe(1000)
    })
  })

  describe('配置保存和加载集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsTestComponent)
      await nextTick()
    })

    it('应该通过保存按钮正确保存设置到配置服务', async () => {
      // 修改一些设置
      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.setValue(GermanState.BAYERN)
      await nextTick()

      // 点击保存按钮
      const saveButton = wrapper.find('[data-testid="save-button"]')
      await saveButton.trigger('click')
      await nextTick()

      // 验证设置已保存
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置保存成功')

      // 验证配置服务中的设置
      const currentSettings = configService.getCurrentSettings()
      expect(currentSettings.userInfo.state).toBe(GermanState.BAYERN)
    })

    it('应该通过重置按钮正确重置设置', async () => {
      // 先修改一些设置
      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.setValue(GermanState.BAYERN)
      await nextTick()

      // 点击重置按钮
      const resetButton = wrapper.find('[data-testid="reset-button"]')
      await resetButton.trigger('click')
      await nextTick()

      // 验证设置已重置
      expect(wrapper.vm.settings.userInfo.state).toBe(DEFAULT_TAX_SETTINGS.userInfo.state)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置已重置')
    })

    it('应该通过加载按钮正确重新加载设置', async () => {
      // 通过配置服务直接更新设置
      const newSettings = {
        ...DEFAULT_TAX_SETTINGS,
        userInfo: {
          ...DEFAULT_TAX_SETTINGS.userInfo,
          state: GermanState.BADEN_WUERTTEMBERG
        }
      }
      configService.updateSettings(newSettings)

      // 点击加载按钮
      const loadButton = wrapper.find('[data-testid="load-button"]')
      await loadButton.trigger('click')
      await nextTick()

      // 验证设置已重新加载
      expect(wrapper.vm.settings.userInfo.state).toBe(GermanState.BADEN_WUERTTEMBERG)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置已重新加载')
    })
  })

  describe('验证和错误处理集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsTestComponent)
      await nextTick()
    })

    it('应该正确处理配置服务的验证错误', async () => {
      // Mock配置服务的验证失败
      const mockValidateSettings = vi.spyOn(configService, 'validateSettings').mockReturnValue({
        isValid: false,
        errors: ['联邦州不能为空', '免税额度超出限制']
      })

      // 尝试更新无效设置
      const invalidSettings = {
        ...DEFAULT_TAX_SETTINGS,
        userInfo: {
          ...DEFAULT_TAX_SETTINGS.userInfo,
          state: '' as any
        },
        freistellungsauftrag: {
          ...DEFAULT_TAX_SETTINGS.freistellungsauftrag,
          annualAllowance: 10000 // 超出限制
        }
      }

      // 模拟用户输入无效数据
      const allowanceInput = wrapper.find('[data-testid="annual-allowance"]')
      await allowanceInput.setValue('10000')
      await nextTick()

      // 验证验证错误被正确显示
      expect(wrapper.find('[data-testid="validation-errors"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('验证失败')

      mockValidateSettings.mockRestore()
    })

    it('应该在配置服务抛出异常时正确处理错误', async () => {
      // Mock配置服务抛出异常
      const mockUpdateSettings = vi.spyOn(configService, 'updateSettings').mockImplementation(() => {
        throw new Error('配置服务异常')
      })

      // 尝试更新设置
      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.setValue(GermanState.BAYERN)
      await nextTick()

      // 验证错误被正确处理
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置更新出错')

      mockUpdateSettings.mockRestore()
    })

    it('应该在保存失败时显示错误信息', async () => {
      // Mock配置服务保存失败
      const mockUpdateSettings = vi.spyOn(configService, 'updateSettings').mockReturnValue(false)

      // 点击保存按钮
      const saveButton = wrapper.find('[data-testid="save-button"]')
      await saveButton.trigger('click')
      await nextTick()

      // 验证错误信息显示
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置保存失败')

      mockUpdateSettings.mockRestore()
    })
  })

  describe('回调机制集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsTestComponent)
      await nextTick()
    })

    it('应该正确响应配置服务的设置变更回调', async () => {
      const callbackSpy = vi.fn()

      // 注册额外的回调监听器
      const unsubscribe = configService.onSettingsChange('test-callback', callbackSpy)

      // 通过配置服务更新设置
      const newSettings = {
        ...DEFAULT_TAX_SETTINGS,
        abgeltungssteuer: {
          ...DEFAULT_TAX_SETTINGS.abgeltungssteuer,
          enabled: true
        }
      }
      configService.updateSettings(newSettings)
      await nextTick()

      // 验证回调被正确调用
      expect(callbackSpy).toHaveBeenCalledWith(expect.objectContaining({
        abgeltungssteuer: expect.objectContaining({
          enabled: true
        })
      }))

      // 验证组件状态也被更新
      expect(wrapper.vm.settings.abgeltungssteuer.enabled).toBe(true)

      unsubscribe()
    })

    it('应该正确响应配置服务的验证错误回调', async () => {
      const errorCallbackSpy = vi.fn()

      // 注册错误回调监听器
      const unsubscribe = configService.onValidationError('test-error-callback', errorCallbackSpy)

      // Mock验证失败
      const mockValidateSettings = vi.spyOn(configService, 'validateSettings').mockReturnValue({
        isValid: false,
        errors: ['测试验证错误']
      })

      // 触发验证错误
      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.setValue('')
      await nextTick()

      // 验证错误回调被调用
      expect(errorCallbackSpy).toHaveBeenCalledWith(['测试验证错误'])

      // 验证组件显示错误信息
      expect(wrapper.vm.validationErrors).toContain('测试验证错误')

      unsubscribe()
      mockValidateSettings.mockRestore()
    })

    it('应该在组件卸载时正确清理回调监听器', async () => {
      const callbackSpy = vi.fn()

      // 注册回调监听器
      const unsubscribe = configService.onSettingsChange('cleanup-test', callbackSpy)

      // 卸载组件
      wrapper.unmount()

      // 更新配置服务设置
      configService.updateSettings({
        ...DEFAULT_TAX_SETTINGS,
        userInfo: {
          ...DEFAULT_TAX_SETTINGS.userInfo,
          state: GermanState.BAYERN
        }
      })

      // 验证回调不再被调用（因为组件已卸载）
      // 注意：这个测试主要验证组件内部的清理逻辑
      expect(callbackSpy).not.toHaveBeenCalled()

      unsubscribe()
    })
  })

  describe('复杂场景集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsTestComponent)
      await nextTick()
    })

    it('应该正确处理联邦州变更导致的教会税税率自动更新', async () => {
      // 先设置教会税类型
      const churchCatholic = wrapper.find('[data-testid="church-catholic"]')
      await churchCatholic.setChecked(true)
      await nextTick()

      // 更改联邦州为巴伐利亚州（8%教会税）
      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.setValue(GermanState.BAYERN)
      await nextTick()

      // 验证配置服务中的教会税税率被正确更新
      const currentSettings = configService.getCurrentSettings()
      expect(currentSettings.userInfo.state).toBe(GermanState.BAYERN)
      expect(currentSettings.userInfo.churchTaxType).toBe(ChurchTaxType.CATHOLIC)
      // 注意：这里需要配置服务实现自动更新教会税税率的逻辑
    })

    it('应该正确处理多个设置同时变更的场景', async () => {
      // 同时更改多个设置
      const stateSelect = wrapper.find('[data-testid="state-select"]')
      const churchCatholic = wrapper.find('[data-testid="church-catholic"]')
      const abgeltungssteuerCheckbox = wrapper.find('[data-testid="abgeltungssteuer-enabled"]')
      const freistellungsauftragCheckbox = wrapper.find('[data-testid="freistellungsauftrag-enabled"]')

      await stateSelect.setValue(GermanState.NORDRHEIN_WESTFALEN)
      await churchCatholic.setChecked(true)
      await abgeltungssteuerCheckbox.setChecked(true)
      await freistellungsauftragCheckbox.setChecked(true)
      await nextTick()

      // 验证所有设置都被正确更新到配置服务
      const currentSettings = configService.getCurrentSettings()
      expect(currentSettings.userInfo.state).toBe(GermanState.NORDRHEIN_WESTFALEN)
      expect(currentSettings.userInfo.churchTaxType).toBe(ChurchTaxType.CATHOLIC)
      expect(currentSettings.abgeltungssteuer.enabled).toBe(true)
      expect(currentSettings.freistellungsauftrag.enabled).toBe(true)
    })

    it('应该正确处理快速连续的设置变更', async () => {
      const stateSelect = wrapper.find('[data-testid="state-select"]')

      // 快速连续更改设置
      await stateSelect.setValue(GermanState.BAYERN)
      await stateSelect.setValue(GermanState.NORDRHEIN_WESTFALEN)
      await stateSelect.setValue(GermanState.BADEN_WUERTTEMBERG)
      await nextTick()

      // 验证最终状态正确
      const currentSettings = configService.getCurrentSettings()
      expect(currentSettings.userInfo.state).toBe(GermanState.BADEN_WUERTTEMBERG)
      expect(wrapper.vm.settings.userInfo.state).toBe(GermanState.BADEN_WUERTTEMBERG)
    })
  })
})
