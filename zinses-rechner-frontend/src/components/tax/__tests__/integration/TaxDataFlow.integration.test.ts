/**
 * 税收数据流集成测试
 * 验证从用户输入到数据存储的完整数据流和组件间的数据一致性
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick, ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { TaxConfigurationService } from '@/services/TaxConfigurationService'
import { TaxHelpService } from '@/services/TaxHelpService'
import { TaxStorageService } from '@/services/TaxStorageService'
import {
  TaxSettings as TaxSettingsType,
  DEFAULT_TAX_SETTINGS,
  GermanState,
  ChurchTaxType,
  ValidationResult,
  CalculationResult
} from '@/types/GermanTaxTypes'

// 创建完整的税收数据流测试组件
const TaxDataFlowTestComponent = {
  name: 'TaxDataFlowTest',
  template: `
    <div class="tax-data-flow-test" data-testid="tax-data-flow">
      <div class="data-flow-status" data-testid="data-flow-status">
        <div class="flow-stage" :class="{ active: currentStage === 'input' }" data-testid="stage-input">
          输入阶段: {{ inputStageStatus }}
        </div>
        <div class="flow-stage" :class="{ active: currentStage === 'validation' }" data-testid="stage-validation">
          验证阶段: {{ validationStageStatus }}
        </div>
        <div class="flow-stage" :class="{ active: currentStage === 'calculation' }" data-testid="stage-calculation">
          计算阶段: {{ calculationStageStatus }}
        </div>
        <div class="flow-stage" :class="{ active: currentStage === 'storage' }" data-testid="stage-storage">
          存储阶段: {{ storageStageStatus }}
        </div>
      </div>

      <div class="input-section">
        <h3>用户输入区域</h3>
        <div class="form-group">
          <label>联邦州</label>
          <select
            v-model="userInputs.state"
            @change="handleInputChange('state', $event.target.value)"
            data-testid="state-input"
          >
            <option value="">请选择</option>
            <option value="NORDRHEIN_WESTFALEN">北莱茵-威斯特法伦州</option>
            <option value="BAYERN">巴伐利亚州</option>
            <option value="BADEN_WUERTTEMBERG">巴登-符腾堡州</option>
          </select>
        </div>

        <div class="form-group">
          <label>教会税类型</label>
          <select
            v-model="userInputs.churchTaxType"
            @change="handleInputChange('churchTaxType', $event.target.value)"
            data-testid="church-tax-input"
          >
            <option value="NONE">无教会税</option>
            <option value="CATHOLIC">天主教</option>
            <option value="PROTESTANT">新教</option>
          </select>
        </div>

        <div class="form-group">
          <label>免税额度</label>
          <input
            type="number"
            v-model.number="userInputs.annualAllowance"
            @input="handleInputChange('annualAllowance', $event.target.value)"
            data-testid="allowance-input"
          />
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="userInputs.abgeltungssteuerEnabled"
              @change="handleInputChange('abgeltungssteuerEnabled', $event.target.checked)"
              data-testid="abgeltungssteuer-input"
            />
            启用资本利得税
          </label>
        </div>
      </div>

      <div class="validation-section" data-testid="validation-section">
        <h3>验证结果</h3>
        <div class="validation-status" :class="validationResult.isValid ? 'valid' : 'invalid'">
          状态: {{ validationResult.isValid ? '有效' : '无效' }}
        </div>
        <div v-if="validationResult.errors.length > 0" class="validation-errors">
          <h4>错误信息:</h4>
          <ul>
            <li v-for="error in validationResult.errors" :key="error" data-testid="validation-error">
              {{ error }}
            </li>
          </ul>
        </div>
        <div v-if="validationResult.warnings.length > 0" class="validation-warnings">
          <h4>警告信息:</h4>
          <ul>
            <li v-for="warning in validationResult.warnings" :key="warning" data-testid="validation-warning">
              {{ warning }}
            </li>
          </ul>
        </div>
      </div>

      <div class="calculation-section" data-testid="calculation-section">
        <h3>计算结果</h3>
        <div class="calculation-status">
          状态: {{ calculationResult ? '已计算' : '未计算' }}
        </div>
        <div v-if="calculationResult" class="calculation-details">
          <div data-testid="effective-tax-rate">
            有效税率: {{ calculationResult.effectiveTaxRate }}%
          </div>
          <div data-testid="annual-tax-burden">
            年度税负: {{ calculationResult.annualTaxBurden }}€
          </div>
          <div data-testid="net-return">
            净收益率: {{ calculationResult.netReturn }}%
          </div>
        </div>
      </div>

      <div class="storage-section" data-testid="storage-section">
        <h3>存储状态</h3>
        <div class="storage-status">
          最后保存: {{ lastSaved ? formatDate(lastSaved) : '未保存' }}
        </div>
        <div class="storage-version">
          数据版本: {{ dataVersion }}
        </div>
        <div class="sync-status" :class="syncStatus">
          同步状态: {{ syncStatusText }}
        </div>
      </div>

      <div class="cache-section" data-testid="cache-section">
        <h3>缓存状态</h3>
        <div class="cache-hits">
          缓存命中: {{ cacheStats.hits }}
        </div>
        <div class="cache-misses">
          缓存未命中: {{ cacheStats.misses }}
        </div>
        <div class="cache-hit-rate">
          命中率: {{ cacheHitRate }}%
        </div>
      </div>

      <div class="data-consistency-section" data-testid="data-consistency">
        <h3>数据一致性检查</h3>
        <div class="consistency-status" :class="isDataConsistent ? 'consistent' : 'inconsistent'">
          状态: {{ isDataConsistent ? '一致' : '不一致' }}
        </div>
        <div v-if="!isDataConsistent" class="inconsistency-details">
          <h4>不一致项目:</h4>
          <ul>
            <li v-for="issue in consistencyIssues" :key="issue" data-testid="consistency-issue">
              {{ issue }}
            </li>
          </ul>
        </div>
      </div>

      <div class="actions">
        <button @click="triggerFullDataFlow" data-testid="trigger-flow">
          触发完整数据流
        </button>
        <button @click="validateData" data-testid="validate-data">
          验证数据
        </button>
        <button @click="calculateTax" data-testid="calculate-tax">
          计算税收
        </button>
        <button @click="saveData" data-testid="save-data">
          保存数据
        </button>
        <button @click="checkConsistency" data-testid="check-consistency">
          检查一致性
        </button>
        <button @click="clearCache" data-testid="clear-cache">
          清空缓存
        </button>
      </div>

      <div class="debug-info" v-if="showDebug" data-testid="debug-info">
        <h3>调试信息</h3>
        <pre>{{ JSON.stringify(debugData, null, 2) }}</pre>
      </div>

      <div v-if="statusMessage" class="status-message" data-testid="status-message">
        {{ statusMessage }}
      </div>

      <div v-if="errorMessage" class="error-message" data-testid="error-message">
        {{ errorMessage }}
      </div>
    </div>
  `,
  setup() {
    // 服务实例
    const configService = TaxConfigurationService.getInstance()
    const helpService = TaxHelpService.getInstance()
    const storageService = TaxStorageService.getInstance()

    // 响应式数据
    const userInputs = ref({
      state: '',
      churchTaxType: 'NONE',
      annualAllowance: 801,
      abgeltungssteuerEnabled: false
    })

    const currentStage = ref('input')
    const inputStageStatus = ref('待输入')
    const validationStageStatus = ref('待验证')
    const calculationStageStatus = ref('待计算')
    const storageStageStatus = ref('待存储')

    const validationResult = ref({
      isValid: true,
      errors: [],
      warnings: []
    })

    const calculationResult = ref(null)
    const lastSaved = ref(null)
    const dataVersion = ref('1.0.0')
    const syncStatus = ref('synced')
    const syncStatusText = ref('已同步')

    const cacheStats = ref({
      hits: 0,
      misses: 0
    })

    const isDataConsistent = ref(true)
    const consistencyIssues = ref([])
    const showDebug = ref(false)
    const debugData = ref({})
    const statusMessage = ref('')
    const errorMessage = ref('')

    // 计算属性
    const cacheHitRate = computed(() => {
      const total = cacheStats.value.hits + cacheStats.value.misses
      return total > 0 ? Math.round((cacheStats.value.hits / total) * 100) : 0
    })

    // 数据流处理函数
    const handleInputChange = async (field, value) => {
      try {
        currentStage.value = 'input'
        inputStageStatus.value = '输入中...'
        statusMessage.value = `用户修改了 ${field}: ${value}`

        // 更新用户输入
        userInputs.value[field] = value
        debugData.value.lastInput = { field, value, timestamp: Date.now() }

        // 触发数据流
        await processDataFlow()

        inputStageStatus.value = '输入完成'
      } catch (error) {
        inputStageStatus.value = '输入错误'
        errorMessage.value = `输入处理失败: ${error.message}`
        console.error('输入处理失败:', error)
      }
    }

    const processDataFlow = async () => {
      try {
        // 阶段1: 数据验证
        currentStage.value = 'validation'
        validationStageStatus.value = '验证中...'
        await validateData()

        if (!validationResult.value.isValid) {
          validationStageStatus.value = '验证失败'
          return
        }
        validationStageStatus.value = '验证通过'

        // 阶段2: 税收计算
        currentStage.value = 'calculation'
        calculationStageStatus.value = '计算中...'
        await calculateTax()
        calculationStageStatus.value = '计算完成'

        // 阶段3: 数据存储
        currentStage.value = 'storage'
        storageStageStatus.value = '存储中...'
        await saveData()
        storageStageStatus.value = '存储完成'

        // 检查数据一致性
        await checkConsistency()

        statusMessage.value = '数据流处理完成'
      } catch (error) {
        errorMessage.value = `数据流处理失败: ${error.message}`
        console.error('数据流处理失败:', error)
      }
    }

    const validateData = async () => {
      try {
        // 构建税收设置对象
        const taxSettings = {
          ...DEFAULT_TAX_SETTINGS,
          userInfo: {
            ...DEFAULT_TAX_SETTINGS.userInfo,
            state: userInputs.value.state,
            churchTaxType: userInputs.value.churchTaxType
          },
          freistellungsauftrag: {
            ...DEFAULT_TAX_SETTINGS.freistellungsauftrag,
            enabled: userInputs.value.annualAllowance > 0,
            annualAllowance: userInputs.value.annualAllowance
          },
          abgeltungssteuer: {
            ...DEFAULT_TAX_SETTINGS.abgeltungssteuer,
            enabled: userInputs.value.abgeltungssteuerEnabled
          }
        }

        // 调用配置服务验证
        const result = configService.validateSettings(taxSettings)
        validationResult.value = result

        debugData.value.validation = {
          input: taxSettings,
          result: result,
          timestamp: Date.now()
        }

        // 更新缓存统计
        if (result.fromCache) {
          cacheStats.value.hits++
        } else {
          cacheStats.value.misses++
        }

        return result
      } catch (error) {
        validationResult.value = {
          isValid: false,
          errors: [`验证服务错误: ${error.message}`],
          warnings: []
        }
        throw error
      }
    }

    const calculateTax = async () => {
      try {
        if (!validationResult.value.isValid) {
          throw new Error('数据验证未通过，无法进行计算')
        }

        // 模拟税收计算
        const mockResult = {
          effectiveTaxRate: userInputs.value.abgeltungssteuerEnabled ? 26.375 : 0,
          annualTaxBurden: userInputs.value.abgeltungssteuerEnabled ?
            (userInputs.value.annualAllowance > 801 ?
              (userInputs.value.annualAllowance - 801) * 0.26375 : 0) : 0,
          netReturn: userInputs.value.abgeltungssteuerEnabled ? 73.625 : 100,
          calculationDetails: {
            baseRate: 25,
            solidarityTax: 1.375,
            churchTax: userInputs.value.churchTaxType !== 'NONE' ?
              (userInputs.value.state === 'BAYERN' ? 8 : 9) : 0
          }
        }

        calculationResult.value = mockResult

        debugData.value.calculation = {
          input: userInputs.value,
          result: mockResult,
          timestamp: Date.now()
        }

        return mockResult
      } catch (error) {
        calculationResult.value = null
        throw error
      }
    }

    const saveData = async () => {
      try {
        const dataToSave = {
          userInputs: userInputs.value,
          validationResult: validationResult.value,
          calculationResult: calculationResult.value,
          timestamp: Date.now()
        }

        // 模拟存储服务保存
        const success = await storageService.saveSettings(dataToSave)

        if (success) {
          lastSaved.value = Date.now()
          dataVersion.value = `1.${Math.floor(Date.now() / 1000)}`
          syncStatus.value = 'synced'
          syncStatusText.value = '已同步'

          debugData.value.storage = {
            data: dataToSave,
            saved: true,
            timestamp: lastSaved.value
          }
        } else {
          throw new Error('存储服务保存失败')
        }

        return success
      } catch (error) {
        syncStatus.value = 'error'
        syncStatusText.value = '同步失败'
        throw error
      }
    }

    const checkConsistency = async () => {
      try {
        const issues = []

        // 检查输入与验证结果的一致性
        if (validationResult.value.isValid && validationResult.value.errors.length > 0) {
          issues.push('验证结果状态与错误列表不一致')
        }

        // 检查计算结果与输入的一致性
        if (calculationResult.value && userInputs.value.abgeltungssteuerEnabled === false) {
          if (calculationResult.value.effectiveTaxRate > 0) {
            issues.push('未启用资本利得税但计算出了税率')
          }
        }

        // 检查存储数据的完整性
        if (lastSaved.value && !calculationResult.value) {
          issues.push('已保存数据但缺少计算结果')
        }

        consistencyIssues.value = issues
        isDataConsistent.value = issues.length === 0

        debugData.value.consistency = {
          issues: issues,
          isConsistent: isDataConsistent.value,
          timestamp: Date.now()
        }

        return isDataConsistent.value
      } catch (error) {
        consistencyIssues.value = [`一致性检查失败: ${error.message}`]
        isDataConsistent.value = false
        throw error
      }
    }

    const triggerFullDataFlow = async () => {
      try {
        statusMessage.value = '开始完整数据流处理...'
        errorMessage.value = ''

        // 重置状态
        currentStage.value = 'input'
        inputStageStatus.value = '准备中...'
        validationStageStatus.value = '待验证'
        calculationStageStatus.value = '待计算'
        storageStageStatus.value = '待存储'

        // 模拟用户输入变更
        userInputs.value.state = 'BAYERN'
        userInputs.value.churchTaxType = 'CATHOLIC'
        userInputs.value.annualAllowance = 1000
        userInputs.value.abgeltungssteuerEnabled = true

        // 处理完整数据流
        await processDataFlow()

        statusMessage.value = '完整数据流处理成功'
      } catch (error) {
        errorMessage.value = `完整数据流处理失败: ${error.message}`
        console.error('完整数据流处理失败:', error)
      }
    }

    const clearCache = () => {
      cacheStats.value = { hits: 0, misses: 0 }
      statusMessage.value = '缓存已清空'
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleString('de-DE')
    }

    // 组件挂载时初始化
    onMounted(async () => {
      try {
        statusMessage.value = '数据流测试组件已初始化'
        debugData.value.initialized = Date.now()
      } catch (error) {
        errorMessage.value = `初始化失败: ${error.message}`
        console.error('初始化失败:', error)
      }
    })

    return {
      userInputs,
      currentStage,
      inputStageStatus,
      validationStageStatus,
      calculationStageStatus,
      storageStageStatus,
      validationResult,
      calculationResult,
      lastSaved,
      dataVersion,
      syncStatus,
      syncStatusText,
      cacheStats,
      cacheHitRate,
      isDataConsistent,
      consistencyIssues,
      showDebug,
      debugData,
      statusMessage,
      errorMessage,
      handleInputChange,
      triggerFullDataFlow,
      validateData,
      calculateTax,
      saveData,
      checkConsistency,
      clearCache,
      formatDate
    }
  }
}

describe('税收数据流集成测试', () => {
  let wrapper: VueWrapper<any>
  let configService: TaxConfigurationService
  let helpService: TaxHelpService
  let storageService: TaxStorageService

  beforeEach(() => {
    // 重置单例实例
    ;(TaxConfigurationService as any).instance = null
    ;(TaxHelpService as any).instance = null
    ;(TaxStorageService as any).instance = null

    configService = TaxConfigurationService.getInstance()
    helpService = TaxHelpService.getInstance()
    storageService = TaxStorageService.getInstance()

    // 清除所有mock调用记录
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    // 清理单例实例
    ;(TaxConfigurationService as any).instance = null
    ;(TaxHelpService as any).instance = null
    ;(TaxStorageService as any).instance = null
  })

  describe('完整数据流集成测试', () => {
    it('应该正确处理完整的数据流：输入→验证→计算→存储', async () => {
      // Mock服务方法
      const validateSettingsSpy = vi.spyOn(configService, 'validateSettings').mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      })
      const saveSettingsSpy = vi.spyOn(storageService, 'saveSettings').mockResolvedValue(true)

      wrapper = mount(TaxDataFlowTestComponent)
      await nextTick()

      // 触发完整数据流
      const triggerButton = wrapper.find('[data-testid="trigger-flow"]')
      await triggerButton.trigger('click')
      await nextTick()

      // 验证数据流各阶段状态
      expect(wrapper.find('[data-testid="stage-input"]').text()).toContain('输入完成')
      expect(wrapper.find('[data-testid="stage-validation"]').text()).toContain('验证通过')
      expect(wrapper.find('[data-testid="stage-calculation"]').text()).toContain('计算完成')
      expect(wrapper.find('[data-testid="stage-storage"]').text()).toContain('存储完成')

      // 验证服务调用
      expect(validateSettingsSpy).toHaveBeenCalled()
      expect(saveSettingsSpy).toHaveBeenCalled()

      // 验证最终状态
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('完整数据流处理成功')
    })

    it('应该在验证失败时中断数据流', async () => {
      // Mock验证失败
      const validateSettingsSpy = vi.spyOn(configService, 'validateSettings').mockReturnValue({
        isValid: false,
        errors: ['联邦州不能为空'],
        warnings: []
      })
      const saveSettingsSpy = vi.spyOn(storageService, 'saveSettings').mockResolvedValue(true)

      wrapper = mount(TaxDataFlowTestComponent)
      await nextTick()

      // 设置无效输入
      const stateInput = wrapper.find('[data-testid="state-input"]')
      await stateInput.setValue('')
      await nextTick()

      // 验证数据流在验证阶段停止
      expect(wrapper.find('[data-testid="stage-validation"]').text()).toContain('验证失败')
      expect(wrapper.find('[data-testid="validation-error"]').text()).toContain('联邦州不能为空')

      // 验证后续阶段未执行
      expect(saveSettingsSpy).not.toHaveBeenCalled()
    })

    it('应该正确处理单个字段的输入变更', async () => {
      const validateSettingsSpy = vi.spyOn(configService, 'validateSettings').mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      })

      wrapper = mount(TaxDataFlowTestComponent)
      await nextTick()

      // 修改联邦州
      const stateInput = wrapper.find('[data-testid="state-input"]')
      await stateInput.setValue('BAYERN')
      await nextTick()

      // 验证输入变更被正确处理
      expect(wrapper.vm.userInputs.state).toBe('BAYERN')
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('用户修改了 state: BAYERN')
      expect(validateSettingsSpy).toHaveBeenCalled()
    })
  })

  describe('数据验证链集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxDataFlowTestComponent)
      await nextTick()
    })

    it('应该正确执行多层数据验证', async () => {
      const validateSettingsSpy = vi.spyOn(configService, 'validateSettings').mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['建议设置教会税以获得更准确的计算']
      })

      // 点击验证按钮
      const validateButton = wrapper.find('[data-testid="validate-data"]')
      await validateButton.trigger('click')
      await nextTick()

      // 验证验证结果显示
      expect(wrapper.find('[data-testid="validation-section"]').exists()).toBe(true)
      expect(wrapper.find('.validation-status').text()).toContain('有效')
      expect(wrapper.find('[data-testid="validation-warning"]').text()).toContain('建议设置教会税')
    })

    it('应该正确处理验证错误和警告', async () => {
      const validateSettingsSpy = vi.spyOn(configService, 'validateSettings').mockReturnValue({
        isValid: false,
        errors: ['免税额度不能超过法定限额', '联邦州必须选择'],
        warnings: ['当前设置可能不是最优配置']
      })

      await wrapper.find('[data-testid="validate-data"]').trigger('click')
      await nextTick()

      // 验证错误和警告显示
      expect(wrapper.find('.validation-status').text()).toContain('无效')
      expect(wrapper.findAll('[data-testid="validation-error"]')).toHaveLength(2)
      expect(wrapper.findAll('[data-testid="validation-warning"]')).toHaveLength(1)
    })

    it('应该正确更新缓存统计', async () => {
      // 第一次验证（缓存未命中）
      vi.spyOn(configService, 'validateSettings').mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        fromCache: false
      })

      await wrapper.find('[data-testid="validate-data"]').trigger('click')
      await nextTick()

      expect(wrapper.vm.cacheStats.misses).toBe(1)
      expect(wrapper.vm.cacheStats.hits).toBe(0)

      // 第二次验证（缓存命中）
      vi.spyOn(configService, 'validateSettings').mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        fromCache: true
      })

      await wrapper.find('[data-testid="validate-data"]').trigger('click')
      await nextTick()

      expect(wrapper.vm.cacheStats.hits).toBe(1)
      expect(wrapper.vm.cacheHitRate).toBe(50) // 1 hit out of 2 total
    })
  })

  describe('计算触发机制集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxDataFlowTestComponent)
      await nextTick()
    })

    it('应该在启用资本利得税时正确计算税率', async () => {
      // 启用资本利得税
      const abgeltungssteuerInput = wrapper.find('[data-testid="abgeltungssteuer-input"]')
      await abgeltungssteuerInput.setChecked(true)
      await nextTick()

      // 触发计算
      await wrapper.find('[data-testid="calculate-tax"]').trigger('click')
      await nextTick()

      // 验证计算结果
      expect(wrapper.find('[data-testid="effective-tax-rate"]').text()).toContain('26.375%')
      expect(wrapper.find('[data-testid="net-return"]').text()).toContain('73.625%')
    })

    it('应该在禁用资本利得税时返回零税率', async () => {
      // 禁用资本利得税
      const abgeltungssteuerInput = wrapper.find('[data-testid="abgeltungssteuer-input"]')
      await abgeltungssteuerInput.setChecked(false)
      await nextTick()

      // 触发计算
      await wrapper.find('[data-testid="calculate-tax"]').trigger('click')
      await nextTick()

      // 验证计算结果
      expect(wrapper.find('[data-testid="effective-tax-rate"]').text()).toContain('0%')
      expect(wrapper.find('[data-testid="net-return"]').text()).toContain('100%')
    })

    it('应该根据免税额度计算年度税负', async () => {
      // 设置免税额度
      const allowanceInput = wrapper.find('[data-testid="allowance-input"]')
      await allowanceInput.setValue('2000')
      await nextTick()

      // 启用资本利得税
      const abgeltungssteuerInput = wrapper.find('[data-testid="abgeltungssteuer-input"]')
      await abgeltungssteuerInput.setChecked(true)
      await nextTick()

      // 触发计算
      await wrapper.find('[data-testid="calculate-tax"]').trigger('click')
      await nextTick()

      // 验证年度税负计算（超出801€免税额度的部分）
      const expectedTaxBurden = (2000 - 801) * 0.26375
      expect(wrapper.find('[data-testid="annual-tax-burden"]').text()).toContain(expectedTaxBurden.toString())
    })
  })

  describe('状态同步集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxDataFlowTestComponent)
      await nextTick()
    })

    it('应该正确同步输入状态到各个阶段', async () => {
      // 修改多个输入字段
      await wrapper.find('[data-testid="state-input"]').setValue('BADEN_WUERTTEMBERG')
      await wrapper.find('[data-testid="church-tax-input"]').setValue('PROTESTANT')
      await wrapper.find('[data-testid="allowance-input"]').setValue('1500')
      await nextTick()

      // 验证状态同步
      expect(wrapper.vm.userInputs.state).toBe('BADEN_WUERTTEMBERG')
      expect(wrapper.vm.userInputs.churchTaxType).toBe('PROTESTANT')
      expect(wrapper.vm.userInputs.annualAllowance).toBe(1500)
    })

    it('应该正确更新存储同步状态', async () => {
      const saveSettingsSpy = vi.spyOn(storageService, 'saveSettings').mockResolvedValue(true)

      // 触发保存
      await wrapper.find('[data-testid="save-data"]').trigger('click')
      await nextTick()

      // 验证同步状态更新
      expect(wrapper.find('.sync-status').text()).toContain('已同步')
      expect(wrapper.vm.lastSaved).toBeTruthy()
      expect(wrapper.vm.dataVersion).toMatch(/^1\.\d+$/)
    })

    it('应该在保存失败时更新错误状态', async () => {
      const saveSettingsSpy = vi.spyOn(storageService, 'saveSettings').mockRejectedValue(new Error('存储服务不可用'))

      // 触发保存
      await wrapper.find('[data-testid="save-data"]').trigger('click')
      await nextTick()

      // 验证错误状态
      expect(wrapper.find('.sync-status').text()).toContain('同步失败')
      expect(wrapper.find('[data-testid="error-message"]').text()).toContain('存储服务不可用')
    })
  })

  describe('数据一致性检查集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxDataFlowTestComponent)
      await nextTick()
    })

    it('应该检测到数据一致性问题', async () => {
      // 创建不一致的状态：验证通过但有错误
      wrapper.vm.validationResult = {
        isValid: true,
        errors: ['这是一个错误'],
        warnings: []
      }

      // 触发一致性检查
      await wrapper.find('[data-testid="check-consistency"]').trigger('click')
      await nextTick()

      // 验证一致性问题被检测到
      expect(wrapper.find('.consistency-status').text()).toContain('不一致')
      expect(wrapper.find('[data-testid="consistency-issue"]').text()).toContain('验证结果状态与错误列表不一致')
    })

    it('应该在数据一致时显示正确状态', async () => {
      // 设置一致的状态
      wrapper.vm.validationResult = {
        isValid: true,
        errors: [],
        warnings: []
      }
      wrapper.vm.calculationResult = {
        effectiveTaxRate: 0,
        annualTaxBurden: 0,
        netReturn: 100
      }

      // 触发一致性检查
      await wrapper.find('[data-testid="check-consistency"]').trigger('click')
      await nextTick()

      // 验证一致性状态
      expect(wrapper.find('.consistency-status').text()).toContain('一致')
      expect(wrapper.vm.consistencyIssues).toHaveLength(0)
    })
  })

  describe('缓存管理集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxDataFlowTestComponent)
      await nextTick()
    })

    it('应该正确计算缓存命中率', async () => {
      // 设置缓存统计
      wrapper.vm.cacheStats = { hits: 7, misses: 3 }
      await nextTick()

      // 验证命中率计算
      expect(wrapper.find('.cache-hit-rate').text()).toContain('70%')
    })

    it('应该支持清空缓存', async () => {
      // 设置初始缓存统计
      wrapper.vm.cacheStats = { hits: 5, misses: 2 }
      await nextTick()

      // 清空缓存
      await wrapper.find('[data-testid="clear-cache"]').trigger('click')
      await nextTick()

      // 验证缓存被清空
      expect(wrapper.vm.cacheStats.hits).toBe(0)
      expect(wrapper.vm.cacheStats.misses).toBe(0)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('缓存已清空')
    })
  })
})
