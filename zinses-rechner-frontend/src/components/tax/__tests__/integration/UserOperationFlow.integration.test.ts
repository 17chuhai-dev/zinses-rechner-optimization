/**
 * 用户操作流程集成测试
 * 模拟真实用户操作的完整旅程，验证用户体验的流畅性和功能完整性
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick, ref, onMounted, onUnmounted, computed } from 'vue'
import { TaxConfigurationService } from '@/services/TaxConfigurationService'
import { TaxHelpService } from '@/services/TaxHelpService'
import { TaxStorageService } from '@/services/TaxStorageService'
import {
  TaxSettings as TaxSettingsType,
  DEFAULT_TAX_SETTINGS,
  GermanState,
  ChurchTaxType,
  UserJourney,
  UserAction,
  UserSession
} from '@/types/GermanTaxTypes'

// 创建完整的用户操作流程测试组件
const UserOperationFlowTestComponent = {
  name: 'UserOperationFlowTest',
  template: `
    <div class="user-operation-flow-test" data-testid="user-flow">
      <!-- 用户会话信息 -->
      <div class="session-info" data-testid="session-info">
        <div class="session-id">会话ID: {{ sessionId }}</div>
        <div class="user-type">用户类型: {{ userType }}</div>
        <div class="session-duration">会话时长: {{ sessionDuration }}s</div>
        <div class="actions-count">操作次数: {{ userActions.length }}</div>
      </div>

      <!-- 用户旅程进度 -->
      <div class="journey-progress" data-testid="journey-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: journeyProgress + '%' }"
            data-testid="progress-fill"
          ></div>
        </div>
        <div class="journey-steps">
          <div
            v-for="(step, index) in journeySteps"
            :key="step.id"
            class="journey-step"
            :class="{
              active: currentStepIndex === index,
              completed: currentStepIndex > index,
              error: step.hasError
            }"
            :data-testid="'step-' + step.id"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-title">{{ step.title }}</div>
            <div class="step-status">{{ step.status }}</div>
          </div>
        </div>
      </div>

      <!-- 主要操作区域 -->
      <div class="main-operation-area">
        <!-- 税收设置表单 -->
        <div class="tax-settings-form" v-if="currentStep === 'settings'" data-testid="settings-form">
          <h3>税收设置配置</h3>

          <div class="form-group">
            <label>联邦州选择</label>
            <select
              v-model="taxSettings.userInfo.state"
              @change="handleUserAction('state-change', $event.target.value)"
              data-testid="state-select"
            >
              <option value="">请选择联邦州</option>
              <option value="NORDRHEIN_WESTFALEN">北莱茵-威斯特法伦州</option>
              <option value="BAYERN">巴伐利亚州</option>
              <option value="BADEN_WUERTTEMBERG">巴登-符腾堡州</option>
              <option value="HESSEN">黑森州</option>
            </select>
          </div>

          <div class="form-group">
            <label>教会税类型</label>
            <div class="radio-group">
              <label>
                <input
                  type="radio"
                  value="NONE"
                  v-model="taxSettings.userInfo.churchTaxType"
                  @change="handleUserAction('church-tax-change', 'NONE')"
                  data-testid="church-none"
                />
                无教会税
              </label>
              <label>
                <input
                  type="radio"
                  value="CATHOLIC"
                  v-model="taxSettings.userInfo.churchTaxType"
                  @change="handleUserAction('church-tax-change', 'CATHOLIC')"
                  data-testid="church-catholic"
                />
                天主教
              </label>
              <label>
                <input
                  type="radio"
                  value="PROTESTANT"
                  v-model="taxSettings.userInfo.churchTaxType"
                  @change="handleUserAction('church-tax-change', 'PROTESTANT')"
                  data-testid="church-protestant"
                />
                新教
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>免税额度设置</label>
            <input
              type="number"
              v-model.number="taxSettings.freistellungsauftrag.annualAllowance"
              @input="handleUserAction('allowance-change', $event.target.value)"
              @focus="handleUserAction('allowance-focus')"
              @blur="handleUserAction('allowance-blur')"
              data-testid="allowance-input"
              placeholder="输入免税额度 (€)"
            />
            <div class="field-help" v-if="showFieldHelp.allowance">
              <small>2024年免税额度上限为801€</small>
            </div>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                v-model="taxSettings.abgeltungssteuer.enabled"
                @change="handleUserAction('abgeltungssteuer-toggle', $event.target.checked)"
                data-testid="abgeltungssteuer-checkbox"
              />
              启用资本利得税计算
            </label>
          </div>

          <div class="form-actions">
            <button
              @click="proceedToNextStep"
              :disabled="!isCurrentStepValid"
              data-testid="next-step-button"
            >
              下一步
            </button>
            <button
              @click="requestHelp"
              data-testid="help-button"
            >
              获取帮助
            </button>
          </div>
        </div>

        <!-- 帮助信息区域 -->
        <div class="help-section" v-if="currentStep === 'help'" data-testid="help-section">
          <h3>税收帮助信息</h3>

          <div class="help-search">
            <input
              type="text"
              v-model="helpSearchQuery"
              @input="handleUserAction('help-search', $event.target.value)"
              placeholder="搜索帮助内容..."
              data-testid="help-search-input"
            />
            <button
              @click="searchHelp"
              data-testid="help-search-button"
            >
              搜索
            </button>
          </div>

          <div class="help-content" v-if="currentHelpContent" data-testid="help-content">
            <h4>{{ currentHelpContent.title }}</h4>
            <div class="help-text">{{ currentHelpContent.content }}</div>
            <div class="help-links" v-if="currentHelpContent.relatedLinks">
              <h5>相关链接:</h5>
              <ul>
                <li
                  v-for="link in currentHelpContent.relatedLinks"
                  :key="link.id"
                >
                  <a
                    @click="handleUserAction('help-link-click', link.id)"
                    :data-testid="'help-link-' + link.id"
                  >
                    {{ link.title }}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div class="help-actions">
            <button
              @click="proceedToNextStep"
              data-testid="help-next-button"
            >
              继续配置
            </button>
            <button
              @click="goBackToPreviousStep"
              data-testid="help-back-button"
            >
              返回设置
            </button>
          </div>
        </div>

        <!-- 预览和确认区域 -->
        <div class="preview-section" v-if="currentStep === 'preview'" data-testid="preview-section">
          <h3>设置预览</h3>

          <div class="settings-summary">
            <div class="summary-item">
              <label>联邦州:</label>
              <span data-testid="preview-state">{{ getStateDisplayName(taxSettings.userInfo.state) }}</span>
            </div>
            <div class="summary-item">
              <label>教会税:</label>
              <span data-testid="preview-church-tax">{{ getChurchTaxDisplayName(taxSettings.userInfo.churchTaxType) }}</span>
            </div>
            <div class="summary-item">
              <label>免税额度:</label>
              <span data-testid="preview-allowance">{{ taxSettings.freistellungsauftrag.annualAllowance }}€</span>
            </div>
            <div class="summary-item">
              <label>资本利得税:</label>
              <span data-testid="preview-abgeltungssteuer">{{ taxSettings.abgeltungssteuer.enabled ? '启用' : '禁用' }}</span>
            </div>
          </div>

          <div class="tax-calculation-preview" v-if="taxCalculationPreview" data-testid="tax-preview">
            <h4>税收计算预览</h4>
            <div class="calculation-item">
              <label>有效税率:</label>
              <span>{{ taxCalculationPreview.effectiveTaxRate }}%</span>
            </div>
            <div class="calculation-item">
              <label>年度税负:</label>
              <span>{{ taxCalculationPreview.annualTaxBurden }}€</span>
            </div>
          </div>

          <div class="preview-actions">
            <button
              @click="proceedToNextStep"
              data-testid="confirm-settings-button"
            >
              确认设置
            </button>
            <button
              @click="goBackToPreviousStep"
              data-testid="edit-settings-button"
            >
              修改设置
            </button>
          </div>
        </div>

        <!-- 保存和导出区域 -->
        <div class="save-export-section" v-if="currentStep === 'save'" data-testid="save-section">
          <h3>保存和导出</h3>

          <div class="save-options">
            <div class="save-option">
              <button
                @click="saveSettings"
                :disabled="isSaving"
                data-testid="save-button"
              >
                {{ isSaving ? '保存中...' : '保存设置' }}
              </button>
              <small>保存到本地存储</small>
            </div>

            <div class="save-option">
              <button
                @click="exportSettings"
                data-testid="export-button"
              >
                导出设置
              </button>
              <small>导出为JSON文件</small>
            </div>

            <div class="save-option">
              <button
                @click="shareSettings"
                data-testid="share-button"
              >
                分享设置
              </button>
              <small>生成分享链接</small>
            </div>
          </div>

          <div class="completion-message" v-if="isJourneyComplete" data-testid="completion-message">
            <h4>🎉 配置完成！</h4>
            <p>您的税收设置已成功保存。您可以随时返回修改这些设置。</p>
          </div>

          <div class="final-actions">
            <button
              @click="startNewJourney"
              data-testid="new-journey-button"
            >
              开始新的配置
            </button>
            <button
              @click="viewCalculators"
              data-testid="view-calculators-button"
            >
              查看计算器
            </button>
          </div>
        </div>
      </div>

      <!-- 错误处理区域 -->
      <div class="error-section" v-if="hasErrors" data-testid="error-section">
        <div class="error-message">
          <h4>⚠️ 操作遇到问题</h4>
          <p>{{ currentError.message }}</p>
          <div class="error-actions">
            <button
              @click="retryCurrentAction"
              data-testid="retry-button"
            >
              重试
            </button>
            <button
              @click="skipCurrentStep"
              data-testid="skip-button"
            >
              跳过
            </button>
            <button
              @click="resetJourney"
              data-testid="reset-button"
            >
              重新开始
            </button>
          </div>
        </div>
      </div>

      <!-- 调试信息 -->
      <div class="debug-info" v-if="showDebugInfo" data-testid="debug-info">
        <h4>调试信息</h4>
        <div class="debug-item">
          <label>当前步骤:</label>
          <span>{{ currentStep }}</span>
        </div>
        <div class="debug-item">
          <label>步骤索引:</label>
          <span>{{ currentStepIndex }}</span>
        </div>
        <div class="debug-item">
          <label>用户操作:</label>
          <span>{{ userActions.length }}</span>
        </div>
        <div class="debug-item">
          <label>错误次数:</label>
          <span>{{ errorCount }}</span>
        </div>
      </div>

      <!-- 状态消息 -->
      <div v-if="statusMessage" class="status-message" data-testid="status-message">
        {{ statusMessage }}
      </div>
    </div>
  `,
  setup() {
    // 服务实例
    const configService = TaxConfigurationService.getInstance()
    const helpService = TaxHelpService.getInstance()
    const storageService = TaxStorageService.getInstance()

    // 用户会话数据
    const sessionId = ref(`session-${Date.now()}`)
    const userType = ref('new-user') // new-user, returning-user, expert-user
    const sessionStartTime = ref(Date.now())
    const sessionDuration = ref(0)
    const userActions = ref([])

    // 用户旅程数据
    const journeySteps = ref([
      { id: 'settings', title: '税收设置', status: '进行中', hasError: false },
      { id: 'help', title: '帮助信息', status: '待开始', hasError: false },
      { id: 'preview', title: '预览确认', status: '待开始', hasError: false },
      { id: 'save', title: '保存导出', status: '待开始', hasError: false }
    ])

    const currentStep = ref('settings')
    const currentStepIndex = ref(0)
    const journeyProgress = ref(0)
    const isJourneyComplete = ref(false)

    // 税收设置数据
    const taxSettings = ref({ ...DEFAULT_TAX_SETTINGS })
    const showFieldHelp = ref({
      allowance: false,
      state: false,
      churchTax: false
    })

    // 帮助系统数据
    const helpSearchQuery = ref('')
    const currentHelpContent = ref(null)

    // 税收计算预览
    const taxCalculationPreview = ref(null)

    // 状态管理
    const isSaving = ref(false)
    const hasErrors = ref(false)
    const currentError = ref(null)
    const errorCount = ref(0)
    const statusMessage = ref('')
    const showDebugInfo = ref(false)

    // 计算属性
    const isCurrentStepValid = computed(() => {
      switch (currentStep.value) {
        case 'settings':
          return taxSettings.value.userInfo.state !== '' &&
                 taxSettings.value.freistellungsauftrag.annualAllowance > 0
        case 'help':
          return true
        case 'preview':
          return true
        case 'save':
          return true
        default:
          return false
      }
    })

    // 用户操作处理
    const handleUserAction = (actionType, actionData = null) => {
      const action = {
        id: `action-${Date.now()}`,
        type: actionType,
        data: actionData,
        timestamp: Date.now(),
        step: currentStep.value,
        sessionId: sessionId.value
      }

      userActions.value.push(action)

      // 更新会话时长
      sessionDuration.value = Math.floor((Date.now() - sessionStartTime.value) / 1000)

      // 处理特定操作
      switch (actionType) {
        case 'allowance-focus':
          showFieldHelp.value.allowance = true
          break
        case 'allowance-blur':
          showFieldHelp.value.allowance = false
          break
        case 'help-search':
          if (actionData && actionData.length > 2) {
            searchHelp()
          }
          break
      }

      statusMessage.value = `用户操作: ${actionType}`
    }

    // 步骤导航
    const proceedToNextStep = () => {
      if (currentStepIndex.value < journeySteps.value.length - 1) {
        // 标记当前步骤完成
        journeySteps.value[currentStepIndex.value].status = '已完成'

        // 移动到下一步
        currentStepIndex.value++
        currentStep.value = journeySteps.value[currentStepIndex.value].id
        journeySteps.value[currentStepIndex.value].status = '进行中'

        // 更新进度
        journeyProgress.value = ((currentStepIndex.value + 1) / journeySteps.value.length) * 100

        handleUserAction('step-proceed', currentStep.value)
        statusMessage.value = `进入步骤: ${journeySteps.value[currentStepIndex.value].title}`
      } else {
        // 完成旅程
        completeJourney()
      }
    }

    const goBackToPreviousStep = () => {
      if (currentStepIndex.value > 0) {
        // 重置当前步骤
        journeySteps.value[currentStepIndex.value].status = '待开始'

        // 移动到上一步
        currentStepIndex.value--
        currentStep.value = journeySteps.value[currentStepIndex.value].id
        journeySteps.value[currentStepIndex.value].status = '进行中'

        // 更新进度
        journeyProgress.value = ((currentStepIndex.value + 1) / journeySteps.value.length) * 100

        handleUserAction('step-back', currentStep.value)
        statusMessage.value = `返回步骤: ${journeySteps.value[currentStepIndex.value].title}`
      }
    }

    // 帮助系统
    const requestHelp = () => {
      currentStep.value = 'help'
      currentStepIndex.value = 1
      journeySteps.value[1].status = '进行中'
      handleUserAction('help-request')
    }

    const searchHelp = async () => {
      try {
        // 模拟帮助搜索
        const mockHelpContent = {
          title: `关于 "${helpSearchQuery.value}" 的帮助`,
          content: `这里是关于 ${helpSearchQuery.value} 的详细说明...`,
          relatedLinks: [
            { id: 'link1', title: '相关主题1' },
            { id: 'link2', title: '相关主题2' }
          ]
        }

        currentHelpContent.value = mockHelpContent
        handleUserAction('help-search-complete', helpSearchQuery.value)
        statusMessage.value = '帮助内容已加载'
      } catch (error) {
        handleError('help-search-failed', error)
      }
    }

    // 设置保存和导出
    const saveSettings = async () => {
      isSaving.value = true
      try {
        // 模拟保存过程
        await new Promise(resolve => setTimeout(resolve, 1000))

        handleUserAction('settings-saved')
        statusMessage.value = '设置保存成功'

        // 生成税收计算预览
        generateTaxCalculationPreview()
      } catch (error) {
        handleError('save-failed', error)
      } finally {
        isSaving.value = false
      }
    }

    const exportSettings = () => {
      try {
        const exportData = {
          settings: taxSettings.value,
          timestamp: Date.now(),
          version: '1.0.0'
        }

        // 模拟文件下载
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        handleUserAction('settings-exported')
        statusMessage.value = '设置导出成功'
      } catch (error) {
        handleError('export-failed', error)
      }
    }

    const shareSettings = () => {
      try {
        // 生成分享链接
        const shareUrl = `${window.location.origin}/tax-settings?config=${btoa(JSON.stringify(taxSettings.value))}`

        // 模拟复制到剪贴板
        navigator.clipboard?.writeText(shareUrl)

        handleUserAction('settings-shared')
        statusMessage.value = '分享链接已复制到剪贴板'
      } catch (error) {
        handleError('share-failed', error)
      }
    }

    // 辅助函数
    const generateTaxCalculationPreview = () => {
      const settings = taxSettings.value

      // 简化的税收计算
      let effectiveTaxRate = 0
      let annualTaxBurden = 0

      if (settings.abgeltungssteuer.enabled) {
        effectiveTaxRate = 25 // 基础税率

        // 团结税
        effectiveTaxRate += 25 * 0.055

        // 教会税
        if (settings.userInfo.churchTaxType !== 'NONE') {
          const churchTaxRate = settings.userInfo.state === 'BAYERN' ? 8 : 9
          effectiveTaxRate += 25 * (churchTaxRate / 100)
        }

        // 计算年度税负（假设投资收益为免税额度以上部分）
        const taxableAmount = Math.max(0, settings.freistellungsauftrag.annualAllowance - 801)
        annualTaxBurden = taxableAmount * (effectiveTaxRate / 100)
      }

      taxCalculationPreview.value = {
        effectiveTaxRate: effectiveTaxRate.toFixed(3),
        annualTaxBurden: annualTaxBurden.toFixed(2)
      }
    }

    const getStateDisplayName = (state) => {
      const stateNames = {
        'NORDRHEIN_WESTFALEN': '北莱茵-威斯特法伦州',
        'BAYERN': '巴伐利亚州',
        'BADEN_WUERTTEMBERG': '巴登-符腾堡州',
        'HESSEN': '黑森州'
      }
      return stateNames[state] || state
    }

    const getChurchTaxDisplayName = (type) => {
      const typeNames = {
        'NONE': '无教会税',
        'CATHOLIC': '天主教',
        'PROTESTANT': '新教'
      }
      return typeNames[type] || type
    }

    // 错误处理
    const handleError = (errorType, error) => {
      hasErrors.value = true
      currentError.value = {
        type: errorType,
        message: error?.message || `操作失败: ${errorType}`,
        timestamp: Date.now()
      }
      errorCount.value++

      // 标记当前步骤有错误
      journeySteps.value[currentStepIndex.value].hasError = true

      handleUserAction('error-occurred', { type: errorType, message: error?.message })
    }

    const retryCurrentAction = () => {
      hasErrors.value = false
      currentError.value = null
      journeySteps.value[currentStepIndex.value].hasError = false

      handleUserAction('error-retry')
      statusMessage.value = '重试当前操作'
    }

    const skipCurrentStep = () => {
      hasErrors.value = false
      currentError.value = null
      journeySteps.value[currentStepIndex.value].hasError = false

      proceedToNextStep()
      handleUserAction('step-skipped')
    }

    const resetJourney = () => {
      // 重置所有状态
      currentStep.value = 'settings'
      currentStepIndex.value = 0
      journeyProgress.value = 25
      isJourneyComplete.value = false
      hasErrors.value = false
      currentError.value = null
      errorCount.value = 0

      // 重置步骤状态
      journeySteps.value.forEach((step, index) => {
        step.status = index === 0 ? '进行中' : '待开始'
        step.hasError = false
      })

      // 重置表单数据
      taxSettings.value = { ...DEFAULT_TAX_SETTINGS }

      handleUserAction('journey-reset')
      statusMessage.value = '已重新开始配置流程'
    }

    const completeJourney = () => {
      isJourneyComplete.value = true
      journeyProgress.value = 100
      journeySteps.value[currentStepIndex.value].status = '已完成'

      handleUserAction('journey-complete')
      statusMessage.value = '🎉 配置流程已完成！'
    }

    const startNewJourney = () => {
      // 创建新会话
      sessionId.value = `session-${Date.now()}`
      sessionStartTime.value = Date.now()
      userActions.value = []

      resetJourney()
    }

    const viewCalculators = () => {
      handleUserAction('view-calculators')
      statusMessage.value = '跳转到计算器页面'
    }

    // 组件挂载时初始化
    onMounted(() => {
      journeyProgress.value = 25 // 初始进度
      handleUserAction('journey-start')
      statusMessage.value = '欢迎使用税收设置向导'

      // 启动会话时长计时器
      const timer = setInterval(() => {
        sessionDuration.value = Math.floor((Date.now() - sessionStartTime.value) / 1000)
      }, 1000)

      onUnmounted(() => {
        clearInterval(timer)
      })
    })

    return {
      // 会话数据
      sessionId,
      userType,
      sessionDuration,
      userActions,

      // 旅程数据
      journeySteps,
      currentStep,
      currentStepIndex,
      journeyProgress,
      isJourneyComplete,

      // 表单数据
      taxSettings,
      showFieldHelp,
      isCurrentStepValid,

      // 帮助数据
      helpSearchQuery,
      currentHelpContent,

      // 预览数据
      taxCalculationPreview,

      // 状态数据
      isSaving,
      hasErrors,
      currentError,
      errorCount,
      statusMessage,
      showDebugInfo,

      // 方法
      handleUserAction,
      proceedToNextStep,
      goBackToPreviousStep,
      requestHelp,
      searchHelp,
      saveSettings,
      exportSettings,
      shareSettings,
      getStateDisplayName,
      getChurchTaxDisplayName,
      retryCurrentAction,
      skipCurrentStep,
      resetJourney,
      startNewJourney,
      viewCalculators
    }
  }
}

describe('用户操作流程集成测试', () => {
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

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true
    })
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

  describe('完整用户旅程测试', () => {
    it('应该正确处理完整的用户配置旅程', async () => {
      wrapper = mount(UserOperationFlowTestComponent)
      await nextTick()

      // 验证初始状态
      expect(wrapper.find('[data-testid="user-flow"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="session-info"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="journey-progress"]').exists()).toBe(true)

      // 步骤1: 配置税收设置
      expect(wrapper.find('[data-testid="settings-form"]').exists()).toBe(true)

      // 选择联邦州
      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.setValue('BAYERN')
      await nextTick()

      // 选择教会税
      const churchCatholic = wrapper.find('[data-testid="church-catholic"]')
      await churchCatholic.setChecked(true)
      await nextTick()

      // 设置免税额度
      const allowanceInput = wrapper.find('[data-testid="allowance-input"]')
      await allowanceInput.setValue('1000')
      await nextTick()

      // 启用资本利得税
      const abgeltungssteuerCheckbox = wrapper.find('[data-testid="abgeltungssteuer-checkbox"]')
      await abgeltungssteuerCheckbox.setChecked(true)
      await nextTick()

      // 验证用户操作被记录
      expect(wrapper.vm.userActions.length).toBeGreaterThan(0)
      expect(wrapper.vm.taxSettings.userInfo.state).toBe('BAYERN')
      expect(wrapper.vm.taxSettings.userInfo.churchTaxType).toBe('CATHOLIC')
      expect(wrapper.vm.taxSettings.freistellungsauftrag.annualAllowance).toBe(1000)
      expect(wrapper.vm.taxSettings.abgeltungssteuer.enabled).toBe(true)

      // 进入下一步
      const nextStepButton = wrapper.find('[data-testid="next-step-button"]')
      expect(nextStepButton.attributes('disabled')).toBeUndefined()
      await nextStepButton.trigger('click')
      await nextTick()

      // 验证进度更新
      expect(wrapper.vm.currentStep).toBe('help')
      expect(wrapper.vm.journeyProgress).toBe(50)
    })

    it('应该支持用户在旅程中寻求帮助', async () => {
      wrapper = mount(UserOperationFlowTestComponent)
      await nextTick()

      // 点击帮助按钮
      const helpButton = wrapper.find('[data-testid="help-button"]')
      await helpButton.trigger('click')
      await nextTick()

      // 验证帮助界面显示
      expect(wrapper.find('[data-testid="help-section"]').exists()).toBe(true)
      expect(wrapper.vm.currentStep).toBe('help')

      // 搜索帮助内容
      const helpSearchInput = wrapper.find('[data-testid="help-search-input"]')
      await helpSearchInput.setValue('教会税')
      await nextTick()

      const helpSearchButton = wrapper.find('[data-testid="help-search-button"]')
      await helpSearchButton.trigger('click')
      await nextTick()

      // 验证帮助内容显示
      expect(wrapper.find('[data-testid="help-content"]').exists()).toBe(true)
      expect(wrapper.vm.currentHelpContent).toBeTruthy()
      expect(wrapper.vm.currentHelpContent.title).toContain('教会税')

      // 返回设置页面
      const backButton = wrapper.find('[data-testid="help-back-button"]')
      await backButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.currentStep).toBe('settings')
    })

    it('应该正确处理设置预览和确认流程', async () => {
      wrapper = mount(UserOperationFlowTestComponent)
      await nextTick()

      // 完成基本设置
      await wrapper.find('[data-testid="state-select"]').setValue('HESSEN')
      await wrapper.find('[data-testid="church-protestant"]').setChecked(true)
      await wrapper.find('[data-testid="allowance-input"]').setValue('801')
      await wrapper.find('[data-testid="abgeltungssteuer-checkbox"]').setChecked(true)
      await nextTick()

      // 跳过帮助步骤，直接到预览
      wrapper.vm.currentStep = 'preview'
      wrapper.vm.currentStepIndex = 2
      await nextTick()

      // 验证预览界面
      expect(wrapper.find('[data-testid="preview-section"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="preview-state"]').text()).toContain('黑森州')
      expect(wrapper.find('[data-testid="preview-church-tax"]').text()).toContain('新教')
      expect(wrapper.find('[data-testid="preview-allowance"]').text()).toContain('801€')
      expect(wrapper.find('[data-testid="preview-abgeltungssteuer"]').text()).toContain('启用')

      // 确认设置
      const confirmButton = wrapper.find('[data-testid="confirm-settings-button"]')
      await confirmButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.currentStep).toBe('save')
    })
  })

  describe('用户交互场景测试', () => {
    beforeEach(async () => {
      wrapper = mount(UserOperationFlowTestComponent)
      await nextTick()
    })

    it('应该正确记录所有用户操作', async () => {
      // 执行一系列用户操作
      await wrapper.find('[data-testid="state-select"]').setValue('BAYERN')
      await wrapper.find('[data-testid="church-catholic"]').setChecked(true)
      await wrapper.find('[data-testid="allowance-input"]').setValue('1500')
      await nextTick()

      // 验证操作记录
      expect(wrapper.vm.userActions.length).toBeGreaterThan(0)

      const stateChangeAction = wrapper.vm.userActions.find(action => action.type === 'state-change')
      expect(stateChangeAction).toBeTruthy()
      expect(stateChangeAction.data).toBe('BAYERN')

      const churchTaxAction = wrapper.vm.userActions.find(action => action.type === 'church-tax-change')
      expect(churchTaxAction).toBeTruthy()
      expect(churchTaxAction.data).toBe('CATHOLIC')

      const allowanceAction = wrapper.vm.userActions.find(action => action.type === 'allowance-change')
      expect(allowanceAction).toBeTruthy()
      expect(allowanceAction.data).toBe('1500')
    })

    it('应该正确处理表单字段的焦点事件', async () => {
      const allowanceInput = wrapper.find('[data-testid="allowance-input"]')

      // 测试焦点获得
      await allowanceInput.trigger('focus')
      await nextTick()

      expect(wrapper.vm.showFieldHelp.allowance).toBe(true)

      // 测试焦点失去
      await allowanceInput.trigger('blur')
      await nextTick()

      expect(wrapper.vm.showFieldHelp.allowance).toBe(false)
    })

    it('应该正确验证表单字段的有效性', async () => {
      // 初始状态应该无效（缺少必填字段）
      expect(wrapper.vm.isCurrentStepValid).toBe(false)

      // 填写必填字段
      await wrapper.find('[data-testid="state-select"]').setValue('BAYERN')
      await wrapper.find('[data-testid="allowance-input"]').setValue('801')
      await nextTick()

      // 现在应该有效
      expect(wrapper.vm.isCurrentStepValid).toBe(true)

      // 下一步按钮应该可用
      const nextButton = wrapper.find('[data-testid="next-step-button"]')
      expect(nextButton.attributes('disabled')).toBeUndefined()
    })

    it('应该支持用户在步骤间前后导航', async () => {
      // 完成第一步
      await wrapper.find('[data-testid="state-select"]').setValue('BAYERN')
      await wrapper.find('[data-testid="allowance-input"]').setValue('801')
      await nextTick()

      // 前进到下一步
      await wrapper.find('[data-testid="next-step-button"]').trigger('click')
      await nextTick()
      expect(wrapper.vm.currentStep).toBe('help')

      // 再前进一步
      await wrapper.find('[data-testid="help-next-button"]').trigger('click')
      await nextTick()
      expect(wrapper.vm.currentStep).toBe('preview')

      // 返回上一步
      await wrapper.find('[data-testid="edit-settings-button"]').trigger('click')
      await nextTick()
      expect(wrapper.vm.currentStep).toBe('help')

      // 再返回到设置页面
      await wrapper.find('[data-testid="help-back-button"]').trigger('click')
      await nextTick()
      expect(wrapper.vm.currentStep).toBe('settings')
    })
  })

  describe('保存和导出功能测试', () => {
    beforeEach(async () => {
      wrapper = mount(UserOperationFlowTestComponent)
      await nextTick()

      // 跳转到保存步骤
      wrapper.vm.currentStep = 'save'
      wrapper.vm.currentStepIndex = 3
      await nextTick()
    })

    it('应该支持保存设置到本地存储', async () => {
      const saveButton = wrapper.find('[data-testid="save-button"]')
      await saveButton.trigger('click')
      await nextTick()

      // 验证保存状态
      expect(wrapper.vm.isSaving).toBe(true)
      expect(saveButton.text()).toContain('保存中')

      // 等待保存完成
      await new Promise(resolve => setTimeout(resolve, 1100))
      await nextTick()

      expect(wrapper.vm.isSaving).toBe(false)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置保存成功')
    })

    it('应该支持导出设置为JSON文件', async () => {
      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')
      await nextTick()

      // 验证导出操作
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置导出成功')

      const exportAction = wrapper.vm.userActions.find(action => action.type === 'settings-exported')
      expect(exportAction).toBeTruthy()
    })

    it('应该支持分享设置链接', async () => {
      const shareButton = wrapper.find('[data-testid="share-button"]')
      await shareButton.trigger('click')
      await nextTick()

      // 验证分享操作
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('分享链接已复制到剪贴板')

      const shareAction = wrapper.vm.userActions.find(action => action.type === 'settings-shared')
      expect(shareAction).toBeTruthy()
    })

    it('应该在完成所有步骤后显示完成消息', async () => {
      // 模拟完成旅程
      wrapper.vm.isJourneyComplete = true
      await nextTick()

      expect(wrapper.find('[data-testid="completion-message"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="completion-message"]').text()).toContain('配置完成')
    })
  })

  describe('错误处理流程测试', () => {
    beforeEach(async () => {
      wrapper = mount(UserOperationFlowTestComponent)
      await nextTick()
    })

    it('应该正确处理保存失败的情况', async () => {
      // 跳转到保存步骤
      wrapper.vm.currentStep = 'save'
      wrapper.vm.currentStepIndex = 3
      await nextTick()

      // 模拟保存失败
      wrapper.vm.handleError('save-failed', new Error('网络连接失败'))
      await nextTick()

      // 验证错误状态
      expect(wrapper.vm.hasErrors).toBe(true)
      expect(wrapper.find('[data-testid="error-section"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="error-section"]').text()).toContain('网络连接失败')

      // 测试重试功能
      const retryButton = wrapper.find('[data-testid="retry-button"]')
      await retryButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.hasErrors).toBe(false)
      expect(wrapper.find('[data-testid="error-section"]').exists()).toBe(false)
    })

    it('应该支持跳过出错的步骤', async () => {
      // 模拟错误
      wrapper.vm.handleError('validation-failed', new Error('验证失败'))
      await nextTick()

      const skipButton = wrapper.find('[data-testid="skip-button"]')
      await skipButton.trigger('click')
      await nextTick()

      // 验证跳过到下一步
      expect(wrapper.vm.hasErrors).toBe(false)
      expect(wrapper.vm.currentStepIndex).toBe(1) // 跳到下一步
    })

    it('应该支持重置整个旅程', async () => {
      // 进行一些操作
      await wrapper.find('[data-testid="state-select"]').setValue('BAYERN')
      wrapper.vm.currentStepIndex = 2
      wrapper.vm.journeyProgress = 75
      await nextTick()

      // 模拟错误并重置
      wrapper.vm.handleError('critical-error', new Error('严重错误'))
      await nextTick()

      const resetButton = wrapper.find('[data-testid="reset-button"]')
      await resetButton.trigger('click')
      await nextTick()

      // 验证重置状态
      expect(wrapper.vm.currentStep).toBe('settings')
      expect(wrapper.vm.currentStepIndex).toBe(0)
      expect(wrapper.vm.journeyProgress).toBe(25)
      expect(wrapper.vm.hasErrors).toBe(false)
      expect(wrapper.vm.taxSettings.userInfo.state).toBe('')
    })
  })

  describe('会话管理测试', () => {
    beforeEach(async () => {
      wrapper = mount(UserOperationFlowTestComponent)
      await nextTick()
    })

    it('应该正确跟踪用户会话信息', async () => {
      // 验证会话初始化
      expect(wrapper.vm.sessionId).toMatch(/^session-\d+$/)
      expect(wrapper.vm.userType).toBe('new-user')
      expect(wrapper.vm.sessionDuration).toBeGreaterThanOrEqual(0)

      // 执行一些操作
      await wrapper.find('[data-testid="state-select"]').setValue('BAYERN')
      await nextTick()

      // 验证操作计数
      expect(wrapper.vm.userActions.length).toBeGreaterThan(0)
      expect(wrapper.find('[data-testid="session-info"]').text()).toContain('操作次数')
    })

    it('应该支持开始新的用户旅程', async () => {
      const originalSessionId = wrapper.vm.sessionId

      // 跳转到完成页面
      wrapper.vm.currentStep = 'save'
      wrapper.vm.isJourneyComplete = true
      await nextTick()

      // 开始新旅程
      const newJourneyButton = wrapper.find('[data-testid="new-journey-button"]')
      await newJourneyButton.trigger('click')
      await nextTick()

      // 验证新会话
      expect(wrapper.vm.sessionId).not.toBe(originalSessionId)
      expect(wrapper.vm.currentStep).toBe('settings')
      expect(wrapper.vm.userActions.length).toBe(1) // 只有journey-start操作
      expect(wrapper.vm.isJourneyComplete).toBe(false)
    })

    it('应该正确计算会话时长', async () => {
      const initialDuration = wrapper.vm.sessionDuration

      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, 1100))

      // 验证时长增加
      expect(wrapper.vm.sessionDuration).toBeGreaterThan(initialDuration)
    })
  })

  describe('税收计算预览测试', () => {
    beforeEach(async () => {
      wrapper = mount(UserOperationFlowTestComponent)
      await nextTick()
    })

    it('应该正确生成税收计算预览', async () => {
      // 设置税收参数
      wrapper.vm.taxSettings.userInfo.state = 'BAYERN'
      wrapper.vm.taxSettings.userInfo.churchTaxType = 'CATHOLIC'
      wrapper.vm.taxSettings.freistellungsauftrag.annualAllowance = 2000
      wrapper.vm.taxSettings.abgeltungssteuer.enabled = true

      // 生成预览
      wrapper.vm.generateTaxCalculationPreview()
      await nextTick()

      // 验证计算结果
      expect(wrapper.vm.taxCalculationPreview).toBeTruthy()
      expect(wrapper.vm.taxCalculationPreview.effectiveTaxRate).toBeTruthy()
      expect(wrapper.vm.taxCalculationPreview.annualTaxBurden).toBeTruthy()

      // 验证巴伐利亚州的教会税计算（8%）
      const effectiveRate = parseFloat(wrapper.vm.taxCalculationPreview.effectiveTaxRate)
      expect(effectiveRate).toBeGreaterThan(25) // 基础税率 + 团结税 + 教会税
    })

    it('应该在禁用资本利得税时返回零税率', async () => {
      wrapper.vm.taxSettings.abgeltungssteuer.enabled = false

      wrapper.vm.generateTaxCalculationPreview()
      await nextTick()

      expect(wrapper.vm.taxCalculationPreview.effectiveTaxRate).toBe('0.000')
      expect(wrapper.vm.taxCalculationPreview.annualTaxBurden).toBe('0.00')
    })
  })
})
