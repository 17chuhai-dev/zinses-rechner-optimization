/**
 * 组件间通信集成测试
 * 验证事件发射、监听、回调执行等通信机制，测试组件间的解耦性和协作
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick, ref, onMounted, onUnmounted, provide, inject } from 'vue'
import { TaxConfigurationService } from '@/services/TaxConfigurationService'
import { TaxHelpService } from '@/services/TaxHelpService'
import { TaxStorageService } from '@/services/TaxStorageService'
import {
  TaxSettings as TaxSettingsType,
  DEFAULT_TAX_SETTINGS,
  GermanState,
  ChurchTaxType,
  CommunicationEvent,
  EventBus
} from '@/types/GermanTaxTypes'

// 创建事件总线模拟
const createEventBus = () => {
  const events = new Map()

  return {
    emit(event: string, data?: any) {
      const handlers = events.get(event) || []
      handlers.forEach(handler => handler(data))
    },

    on(event: string, handler: Function) {
      if (!events.has(event)) {
        events.set(event, [])
      }
      events.get(event).push(handler)

      // 返回取消订阅函数
      return () => {
        const handlers = events.get(event) || []
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    },

    off(event: string, handler?: Function) {
      if (!handler) {
        events.delete(event)
      } else {
        const handlers = events.get(event) || []
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    },

    clear() {
      events.clear()
    }
  }
}

// 父组件 - 税收设置容器
const TaxSettingsContainer = {
  name: 'TaxSettingsContainer',
  template: `
    <div class="tax-settings-container" data-testid="container">
      <div class="container-header">
        <h2>税收设置管理</h2>
        <div class="container-status" data-testid="container-status">
          状态: {{ containerStatus }}
        </div>
      </div>

      <div class="communication-log" data-testid="communication-log">
        <h3>通信日志</h3>
        <div
          v-for="log in communicationLogs"
          :key="log.id"
          class="log-entry"
          :data-testid="'log-' + log.id"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-event">{{ log.event }}</span>
          <span class="log-source">{{ log.source }}</span>
          <span class="log-data">{{ JSON.stringify(log.data) }}</span>
        </div>
      </div>

      <TaxSettingsForm
        :initial-settings="taxSettings"
        @settings-changed="handleSettingsChanged"
        @validation-error="handleValidationError"
        @help-requested="handleHelpRequested"
        @save-requested="handleSaveRequested"
        @export-requested="handleExportRequested"
        ref="settingsForm"
      />

      <TaxHelpPanel
        v-if="showHelpPanel"
        :help-context="helpContext"
        @help-closed="handleHelpClosed"
        @help-action="handleHelpAction"
        ref="helpPanel"
      />

      <TaxStoragePanel
        v-if="showStoragePanel"
        :storage-status="storageStatus"
        @storage-action="handleStorageAction"
        @storage-error="handleStorageError"
        ref="storagePanel"
      />

      <div class="container-actions">
        <button @click="toggleHelpPanel" data-testid="toggle-help">
          {{ showHelpPanel ? '隐藏帮助' : '显示帮助' }}
        </button>
        <button @click="toggleStoragePanel" data-testid="toggle-storage">
          {{ showStoragePanel ? '隐藏存储' : '显示存储' }}
        </button>
        <button @click="broadcastMessage" data-testid="broadcast">
          广播消息
        </button>
        <button @click="clearLogs" data-testid="clear-logs">
          清空日志
        </button>
      </div>

      <div v-if="errorMessage" class="error-message" data-testid="error-message">
        {{ errorMessage }}
      </div>
    </div>
  `,
  components: {
    TaxSettingsForm: {
      name: 'TaxSettingsForm',
      template: `
        <div class="tax-settings-form" data-testid="settings-form">
          <h3>税收设置表单</h3>

          <div class="form-group">
            <label>联邦州</label>
            <select
              v-model="localSettings.userInfo.state"
              @change="handleStateChange"
              data-testid="state-select"
            >
              <option value="">请选择</option>
              <option value="BAYERN">巴伐利亚州</option>
              <option value="NORDRHEIN_WESTFALEN">北莱茵-威斯特法伦州</option>
            </select>
          </div>

          <div class="form-group">
            <label>教会税类型</label>
            <select
              v-model="localSettings.userInfo.churchTaxType"
              @change="handleChurchTaxChange"
              data-testid="church-tax-select"
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
              v-model.number="localSettings.freistellungsauftrag.annualAllowance"
              @input="handleAllowanceChange"
              data-testid="allowance-input"
            />
          </div>

          <div class="form-actions">
            <button @click="requestHelp" data-testid="help-button">
              获取帮助
            </button>
            <button @click="saveSettings" data-testid="save-button">
              保存设置
            </button>
            <button @click="exportSettings" data-testid="export-button">
              导出设置
            </button>
            <button @click="validateSettings" data-testid="validate-button">
              验证设置
            </button>
          </div>

          <div class="form-status" data-testid="form-status">
            {{ formStatus }}
          </div>
        </div>
      `,
      props: ['initialSettings'],
      emits: ['settings-changed', 'validation-error', 'help-requested', 'save-requested', 'export-requested'],
      setup(props, { emit }) {
        const localSettings = ref({ ...props.initialSettings })
        const formStatus = ref('就绪')
        const eventBus = inject('eventBus')

        // 监听全局事件
        const unsubscribeGlobalUpdate = eventBus?.on('global-settings-update', (data) => {
          localSettings.value = { ...data }
          formStatus.value = '已从全局更新'
        })

        const unsubscribeBroadcast = eventBus?.on('broadcast-message', (data) => {
          formStatus.value = `收到广播: ${data.message}`
        })

        onUnmounted(() => {
          unsubscribeGlobalUpdate?.()
          unsubscribeBroadcast?.()
        })

        const handleStateChange = () => {
          emit('settings-changed', {
            field: 'state',
            value: localSettings.value.userInfo.state,
            settings: localSettings.value
          })
          formStatus.value = '联邦州已更改'
        }

        const handleChurchTaxChange = () => {
          emit('settings-changed', {
            field: 'churchTaxType',
            value: localSettings.value.userInfo.churchTaxType,
            settings: localSettings.value
          })
          formStatus.value = '教会税类型已更改'
        }

        const handleAllowanceChange = () => {
          // 验证免税额度
          if (localSettings.value.freistellungsauftrag.annualAllowance > 801) {
            emit('validation-error', {
              field: 'annualAllowance',
              message: '免税额度不能超过801€',
              value: localSettings.value.freistellungsauftrag.annualAllowance
            })
            formStatus.value = '验证错误'
            return
          }

          emit('settings-changed', {
            field: 'annualAllowance',
            value: localSettings.value.freistellungsauftrag.annualAllowance,
            settings: localSettings.value
          })
          formStatus.value = '免税额度已更改'
        }

        const requestHelp = () => {
          emit('help-requested', {
            context: 'tax-settings',
            currentField: 'general',
            settings: localSettings.value
          })
          formStatus.value = '已请求帮助'
        }

        const saveSettings = () => {
          emit('save-requested', {
            settings: localSettings.value,
            timestamp: Date.now()
          })
          formStatus.value = '保存请求已发送'
        }

        const exportSettings = () => {
          emit('export-requested', {
            settings: localSettings.value,
            format: 'json'
          })
          formStatus.value = '导出请求已发送'
        }

        const validateSettings = () => {
          // 模拟异步验证
          formStatus.value = '验证中...'
          setTimeout(() => {
            const isValid = localSettings.value.userInfo.state !== ''
            if (!isValid) {
              emit('validation-error', {
                field: 'state',
                message: '联邦州不能为空',
                value: localSettings.value.userInfo.state
              })
              formStatus.value = '验证失败'
            } else {
              formStatus.value = '验证通过'
            }
          }, 100)
        }

        return {
          localSettings,
          formStatus,
          handleStateChange,
          handleChurchTaxChange,
          handleAllowanceChange,
          requestHelp,
          saveSettings,
          exportSettings,
          validateSettings
        }
      }
    },

    TaxHelpPanel: {
      name: 'TaxHelpPanel',
      template: `
        <div class="tax-help-panel" data-testid="help-panel">
          <div class="help-header">
            <h3>税收帮助</h3>
            <button @click="closeHelp" data-testid="close-help">×</button>
          </div>

          <div class="help-content">
            <div class="help-context">
              上下文: {{ helpContext }}
            </div>
            <div class="help-actions">
              <button @click="searchHelp" data-testid="search-help">
                搜索帮助
              </button>
              <button @click="showFAQ" data-testid="show-faq">
                常见问题
              </button>
              <button @click="contactSupport" data-testid="contact-support">
                联系支持
              </button>
            </div>
          </div>

          <div class="help-status" data-testid="help-status">
            {{ helpStatus }}
          </div>
        </div>
      `,
      props: ['helpContext'],
      emits: ['help-closed', 'help-action'],
      setup(props, { emit }) {
        const helpStatus = ref('帮助面板已打开')
        const eventBus = inject('eventBus')

        // 监听帮助相关事件
        const unsubscribeHelpUpdate = eventBus?.on('help-content-update', (data) => {
          helpStatus.value = `帮助内容已更新: ${data.topic}`
        })

        onUnmounted(() => {
          unsubscribeHelpUpdate?.()
        })

        const closeHelp = () => {
          emit('help-closed')
          helpStatus.value = '帮助面板已关闭'
        }

        const searchHelp = () => {
          emit('help-action', {
            action: 'search',
            query: 'tax calculation',
            context: props.helpContext
          })
          helpStatus.value = '搜索帮助中...'
        }

        const showFAQ = () => {
          emit('help-action', {
            action: 'faq',
            category: 'tax-settings'
          })
          helpStatus.value = '显示常见问题'
        }

        const contactSupport = () => {
          emit('help-action', {
            action: 'contact',
            method: 'email'
          })
          helpStatus.value = '联系支持'
        }

        return {
          helpStatus,
          closeHelp,
          searchHelp,
          showFAQ,
          contactSupport
        }
      }
    },

    TaxStoragePanel: {
      name: 'TaxStoragePanel',
      template: `
        <div class="tax-storage-panel" data-testid="storage-panel">
          <div class="storage-header">
            <h3>存储管理</h3>
            <div class="storage-status">{{ storageStatus }}</div>
          </div>

          <div class="storage-actions">
            <button @click="loadSettings" data-testid="load-settings">
              加载设置
            </button>
            <button @click="saveSettings" data-testid="save-settings">
              保存设置
            </button>
            <button @click="clearStorage" data-testid="clear-storage">
              清空存储
            </button>
            <button @click="exportData" data-testid="export-data">
              导出数据
            </button>
          </div>

          <div class="storage-info" data-testid="storage-info">
            {{ storageInfo }}
          </div>
        </div>
      `,
      props: ['storageStatus'],
      emits: ['storage-action', 'storage-error'],
      setup(props, { emit }) {
        const storageInfo = ref('存储面板已初始化')
        const eventBus = inject('eventBus')

        // 监听存储相关事件
        const unsubscribeStorageUpdate = eventBus?.on('storage-update', (data) => {
          storageInfo.value = `存储已更新: ${data.operation}`
        })

        onUnmounted(() => {
          unsubscribeStorageUpdate?.()
        })

        const loadSettings = () => {
          emit('storage-action', {
            action: 'load',
            timestamp: Date.now()
          })
          storageInfo.value = '加载设置中...'
        }

        const saveSettings = () => {
          emit('storage-action', {
            action: 'save',
            timestamp: Date.now()
          })
          storageInfo.value = '保存设置中...'
        }

        const clearStorage = () => {
          emit('storage-action', {
            action: 'clear',
            timestamp: Date.now()
          })
          storageInfo.value = '清空存储中...'
        }

        const exportData = () => {
          // 模拟导出失败
          setTimeout(() => {
            emit('storage-error', {
              action: 'export',
              error: '导出失败：权限不足',
              timestamp: Date.now()
            })
            storageInfo.value = '导出失败'
          }, 50)
        }

        return {
          storageInfo,
          loadSettings,
          saveSettings,
          clearStorage,
          exportData
        }
      }
    }
  },
  setup() {
    const eventBus = createEventBus()
    provide('eventBus', eventBus)

    const taxSettings = ref({ ...DEFAULT_TAX_SETTINGS })
    const containerStatus = ref('已初始化')
    const showHelpPanel = ref(false)
    const showStoragePanel = ref(false)
    const helpContext = ref('general')
    const storageStatus = ref('就绪')
    const errorMessage = ref('')
    const communicationLogs = ref([])

    let logIdCounter = 0

    const addLog = (event: string, source: string, data: any = null) => {
      communicationLogs.value.push({
        id: ++logIdCounter,
        event,
        source,
        data,
        timestamp: Date.now()
      })
    }

    // 事件处理器
    const handleSettingsChanged = (data) => {
      taxSettings.value = { ...data.settings }
      containerStatus.value = `设置已更改: ${data.field}`
      addLog('settings-changed', 'TaxSettingsForm', data)

      // 广播设置更新
      eventBus.emit('global-settings-update', data.settings)
    }

    const handleValidationError = (error) => {
      errorMessage.value = `验证错误: ${error.message}`
      containerStatus.value = '验证失败'
      addLog('validation-error', 'TaxSettingsForm', error)
    }

    const handleHelpRequested = (request) => {
      showHelpPanel.value = true
      helpContext.value = request.context
      containerStatus.value = '帮助已请求'
      addLog('help-requested', 'TaxSettingsForm', request)
    }

    const handleSaveRequested = (request) => {
      containerStatus.value = '保存已请求'
      addLog('save-requested', 'TaxSettingsForm', request)

      // 模拟保存过程
      setTimeout(() => {
        containerStatus.value = '保存完成'
        eventBus.emit('storage-update', { operation: 'save' })
      }, 100)
    }

    const handleExportRequested = (request) => {
      containerStatus.value = '导出已请求'
      addLog('export-requested', 'TaxSettingsForm', request)
    }

    const handleHelpClosed = () => {
      showHelpPanel.value = false
      containerStatus.value = '帮助已关闭'
      addLog('help-closed', 'TaxHelpPanel')
    }

    const handleHelpAction = (action) => {
      containerStatus.value = `帮助操作: ${action.action}`
      addLog('help-action', 'TaxHelpPanel', action)

      // 根据操作类型触发相应事件
      if (action.action === 'search') {
        eventBus.emit('help-content-update', { topic: action.query })
      }
    }

    const handleStorageAction = (action) => {
      containerStatus.value = `存储操作: ${action.action}`
      addLog('storage-action', 'TaxStoragePanel', action)

      // 模拟存储操作
      setTimeout(() => {
        eventBus.emit('storage-update', { operation: action.action })
      }, 50)
    }

    const handleStorageError = (error) => {
      errorMessage.value = `存储错误: ${error.error}`
      containerStatus.value = '存储错误'
      addLog('storage-error', 'TaxStoragePanel', error)
    }

    // 容器操作
    const toggleHelpPanel = () => {
      showHelpPanel.value = !showHelpPanel.value
      containerStatus.value = showHelpPanel.value ? '帮助面板已显示' : '帮助面板已隐藏'
      addLog('help-panel-toggle', 'Container', { visible: showHelpPanel.value })
    }

    const toggleStoragePanel = () => {
      showStoragePanel.value = !showStoragePanel.value
      containerStatus.value = showStoragePanel.value ? '存储面板已显示' : '存储面板已隐藏'
      addLog('storage-panel-toggle', 'Container', { visible: showStoragePanel.value })
    }

    const broadcastMessage = () => {
      const message = { message: '全局广播消息', timestamp: Date.now() }
      eventBus.emit('broadcast-message', message)
      containerStatus.value = '广播消息已发送'
      addLog('broadcast-message', 'Container', message)
    }

    const clearLogs = () => {
      communicationLogs.value = []
      containerStatus.value = '日志已清空'
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString()
    }

    return {
      taxSettings,
      containerStatus,
      showHelpPanel,
      showStoragePanel,
      helpContext,
      storageStatus,
      errorMessage,
      communicationLogs,
      handleSettingsChanged,
      handleValidationError,
      handleHelpRequested,
      handleSaveRequested,
      handleExportRequested,
      handleHelpClosed,
      handleHelpAction,
      handleStorageAction,
      handleStorageError,
      toggleHelpPanel,
      toggleStoragePanel,
      broadcastMessage,
      clearLogs,
      formatTime
    }
  }
}

describe('组件间通信集成测试', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('事件发射和监听机制测试', () => {
    it('应该正确处理子组件向父组件的事件发射', async () => {
      wrapper = mount(TaxSettingsContainer)
      await nextTick()

      // 验证初始状态
      expect(wrapper.find('[data-testid="container"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="settings-form"]').exists()).toBe(true)

      // 触发设置变更事件
      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.setValue('BAYERN')
      await nextTick()

      // 验证事件被正确处理
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('设置已更改: state')
      expect(wrapper.vm.taxSettings.userInfo.state).toBe('BAYERN')

      // 验证通信日志记录
      const logs = wrapper.findAll('[data-testid^="log-"]')
      expect(logs.length).toBeGreaterThan(0)

      const settingsChangedLog = logs.find(log =>
        log.text().includes('settings-changed')
      )
      expect(settingsChangedLog).toBeTruthy()
    })

    it('应该正确处理验证错误事件的传播', async () => {
      wrapper = mount(TaxSettingsContainer)
      await nextTick()

      // 设置一个超出限制的免税额度
      const allowanceInput = wrapper.find('[data-testid="allowance-input"]')
      await allowanceInput.setValue('1000') // 超过801€限制
      await nextTick()

      // 验证错误事件被正确处理
      expect(wrapper.find('[data-testid="error-message"]').text()).toContain('免税额度不能超过801€')
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('验证失败')

      // 验证错误日志记录
      const errorLog = wrapper.findAll('[data-testid^="log-"]').find(log =>
        log.text().includes('validation-error')
      )
      expect(errorLog).toBeTruthy()
    })

    it('应该正确处理帮助请求事件', async () => {
      wrapper = mount(TaxSettingsContainer)
      await nextTick()

      // 点击帮助按钮
      const helpButton = wrapper.find('[data-testid="help-button"]')
      await helpButton.trigger('click')
      await nextTick()

      // 验证帮助面板显示
      expect(wrapper.find('[data-testid="help-panel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('帮助已请求')

      // 验证帮助日志记录
      const helpLog = wrapper.findAll('[data-testid^="log-"]').find(log =>
        log.text().includes('help-requested')
      )
      expect(helpLog).toBeTruthy()
    })

    it('应该正确处理保存请求事件', async () => {
      wrapper = mount(TaxSettingsContainer)
      await nextTick()

      // 点击保存按钮
      const saveButton = wrapper.find('[data-testid="save-button"]')
      await saveButton.trigger('click')
      await nextTick()

      // 验证保存请求被处理
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('保存已请求')

      // 等待异步保存完成
      await new Promise(resolve => setTimeout(resolve, 150))
      await nextTick()

      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('保存完成')
    })
  })

  describe('回调执行机制测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsContainer)
      await nextTick()
    })

    it('应该正确执行帮助面板的回调函数', async () => {
      // 显示帮助面板
      const toggleHelpButton = wrapper.find('[data-testid="toggle-help"]')
      await toggleHelpButton.trigger('click')
      await nextTick()

      // 在帮助面板中执行搜索操作
      const searchHelpButton = wrapper.find('[data-testid="search-help"]')
      await searchHelpButton.trigger('click')
      await nextTick()

      // 验证回调被正确执行
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('帮助操作: search')
      expect(wrapper.find('[data-testid="help-status"]').text()).toContain('搜索帮助中')

      // 验证帮助操作日志
      const helpActionLog = wrapper.findAll('[data-testid^="log-"]').find(log =>
        log.text().includes('help-action')
      )
      expect(helpActionLog).toBeTruthy()
    })

    it('应该正确执行存储面板的回调函数', async () => {
      // 显示存储面板
      const toggleStorageButton = wrapper.find('[data-testid="toggle-storage"]')
      await toggleStorageButton.trigger('click')
      await nextTick()

      // 执行加载操作
      const loadButton = wrapper.find('[data-testid="load-settings"]')
      await loadButton.trigger('click')
      await nextTick()

      // 验证回调被正确执行
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('存储操作: load')
      expect(wrapper.find('[data-testid="storage-info"]').text()).toContain('加载设置中')

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))
      await nextTick()

      // 验证存储操作日志
      const storageActionLog = wrapper.findAll('[data-testid^="log-"]').find(log =>
        log.text().includes('storage-action')
      )
      expect(storageActionLog).toBeTruthy()
    })

    it('应该正确处理异步回调中的错误', async () => {
      // 显示存储面板
      const toggleStorageButton = wrapper.find('[data-testid="toggle-storage"]')
      await toggleStorageButton.trigger('click')
      await nextTick()

      // 触发导出操作（模拟失败）
      const exportButton = wrapper.find('[data-testid="export-data"]')
      await exportButton.trigger('click')
      await nextTick()

      // 等待异步错误发生
      await new Promise(resolve => setTimeout(resolve, 100))
      await nextTick()

      // 验证错误被正确处理
      expect(wrapper.find('[data-testid="error-message"]').text()).toContain('导出失败：权限不足')
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('存储错误')

      // 验证错误日志记录
      const errorLog = wrapper.findAll('[data-testid^="log-"]').find(log =>
        log.text().includes('storage-error')
      )
      expect(errorLog).toBeTruthy()
    })
  })

  describe('组件解耦性测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsContainer)
      await nextTick()
    })

    it('应该支持独立的组件状态管理', async () => {
      // 验证各组件有独立的状态
      expect(wrapper.find('[data-testid="form-status"]').text()).toBe('就绪')

      // 显示帮助面板
      await wrapper.find('[data-testid="toggle-help"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-testid="help-status"]').text()).toBe('帮助面板已打开')

      // 显示存储面板
      await wrapper.find('[data-testid="toggle-storage"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-testid="storage-info"]').text()).toBe('存储面板已初始化')

      // 各组件状态应该独立
      expect(wrapper.find('[data-testid="form-status"]').text()).toBe('就绪')
      expect(wrapper.find('[data-testid="help-status"]').text()).toBe('帮助面板已打开')
      expect(wrapper.find('[data-testid="storage-info"]').text()).toBe('存储面板已初始化')
    })

    it('应该支持组件的独立卸载和重新挂载', async () => {
      // 显示帮助面板
      await wrapper.find('[data-testid="toggle-help"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-testid="help-panel"]').exists()).toBe(true)

      // 隐藏帮助面板（相当于卸载）
      await wrapper.find('[data-testid="toggle-help"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-testid="help-panel"]').exists()).toBe(false)

      // 重新显示帮助面板（重新挂载）
      await wrapper.find('[data-testid="toggle-help"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-testid="help-panel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="help-status"]').text()).toBe('帮助面板已打开')
    })

    it('应该支持组件间的松耦合通信', async () => {
      // 通过事件总线进行广播通信
      const broadcastButton = wrapper.find('[data-testid="broadcast"]')
      await broadcastButton.trigger('click')
      await nextTick()

      // 验证表单组件接收到广播消息
      expect(wrapper.find('[data-testid="form-status"]').text()).toContain('收到广播')
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('广播消息已发送')

      // 验证广播日志记录
      const broadcastLog = wrapper.findAll('[data-testid^="log-"]').find(log =>
        log.text().includes('broadcast-message')
      )
      expect(broadcastLog).toBeTruthy()
    })
  })

  describe('事件冒泡和传播测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsContainer)
      await nextTick()
    })

    it('应该正确处理事件的向上传播', async () => {
      // 在表单中触发验证
      const validateButton = wrapper.find('[data-testid="validate-button"]')
      await validateButton.trigger('click')
      await nextTick()

      // 等待异步验证完成
      await new Promise(resolve => setTimeout(resolve, 150))
      await nextTick()

      // 验证事件向上传播到容器
      expect(wrapper.find('[data-testid="error-message"]').text()).toContain('联邦州不能为空')
      expect(wrapper.find('[data-testid="form-status"]').text()).toContain('验证失败')

      // 验证事件传播日志
      const validationLog = wrapper.findAll('[data-testid^="log-"]').find(log =>
        log.text().includes('validation-error')
      )
      expect(validationLog).toBeTruthy()
    })

    it('应该正确处理帮助面板的事件传播', async () => {
      // 显示帮助面板
      await wrapper.find('[data-testid="toggle-help"]').trigger('click')
      await nextTick()

      // 在帮助面板中触发FAQ操作
      const faqButton = wrapper.find('[data-testid="show-faq"]')
      await faqButton.trigger('click')
      await nextTick()

      // 验证事件传播到容器
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('帮助操作: faq')
      expect(wrapper.find('[data-testid="help-status"]').text()).toContain('显示常见问题')

      // 关闭帮助面板
      const closeButton = wrapper.find('[data-testid="close-help"]')
      await closeButton.trigger('click')
      await nextTick()

      // 验证关闭事件传播
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('帮助已关闭')
      expect(wrapper.find('[data-testid="help-panel"]').exists()).toBe(false)
    })

    it('应该正确处理存储面板的事件传播', async () => {
      // 显示存储面板
      await wrapper.find('[data-testid="toggle-storage"]').trigger('click')
      await nextTick()

      // 执行清空存储操作
      const clearButton = wrapper.find('[data-testid="clear-storage"]')
      await clearButton.trigger('click')
      await nextTick()

      // 验证事件传播到容器
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('存储操作: clear')
      expect(wrapper.find('[data-testid="storage-info"]').text()).toContain('清空存储中')

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))
      await nextTick()

      // 验证存储更新事件传播
      const storageLog = wrapper.findAll('[data-testid^="log-"]').find(log =>
        log.text().includes('storage-action')
      )
      expect(storageLog).toBeTruthy()
    })
  })

  describe('异步通信测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsContainer)
      await nextTick()
    })

    it('应该正确处理异步事件的顺序执行', async () => {
      // 触发保存操作（异步）
      const saveButton = wrapper.find('[data-testid="save-button"]')
      await saveButton.trigger('click')
      await nextTick()

      // 验证初始状态
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('保存已请求')

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 150))
      await nextTick()

      // 验证异步完成状态
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('保存完成')

      // 验证日志记录了完整的异步流程
      const logs = wrapper.findAll('[data-testid^="log-"]')
      const saveRequestLog = logs.find(log => log.text().includes('save-requested'))
      expect(saveRequestLog).toBeTruthy()
    })

    it('应该正确处理并发异步操作', async () => {
      // 显示存储面板
      await wrapper.find('[data-testid="toggle-storage"]').trigger('click')
      await nextTick()

      // 同时触发多个异步操作
      const loadButton = wrapper.find('[data-testid="load-settings"]')
      const saveButton = wrapper.find('[data-testid="save-settings"]')

      await loadButton.trigger('click')
      await saveButton.trigger('click')
      await nextTick()

      // 验证并发操作的状态
      expect(wrapper.find('[data-testid="storage-info"]').text()).toContain('保存设置中')

      // 等待所有异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))
      await nextTick()

      // 验证并发操作的日志记录
      const logs = wrapper.findAll('[data-testid^="log-"]')
      const loadLog = logs.find(log => log.text().includes('"action":"load"'))
      const saveLog = logs.find(log => log.text().includes('"action":"save"'))

      expect(loadLog).toBeTruthy()
      expect(saveLog).toBeTruthy()
    })

    it('应该正确处理异步操作中的错误', async () => {
      // 显示存储面板
      await wrapper.find('[data-testid="toggle-storage"]').trigger('click')
      await nextTick()

      // 触发会失败的异步操作
      const exportButton = wrapper.find('[data-testid="export-data"]')
      await exportButton.trigger('click')
      await nextTick()

      // 等待异步错误发生
      await new Promise(resolve => setTimeout(resolve, 100))
      await nextTick()

      // 验证异步错误被正确处理
      expect(wrapper.find('[data-testid="error-message"]').text()).toContain('导出失败：权限不足')
      expect(wrapper.find('[data-testid="storage-info"]').text()).toContain('导出失败')

      // 验证错误日志记录
      const errorLog = wrapper.findAll('[data-testid^="log-"]').find(log =>
        log.text().includes('storage-error')
      )
      expect(errorLog).toBeTruthy()
    })
  })

  describe('通信日志和调试功能测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsContainer)
      await nextTick()
    })

    it('应该正确记录所有组件间通信', async () => {
      // 执行一系列操作
      await wrapper.find('[data-testid="state-select"]').setValue('BAYERN')
      await wrapper.find('[data-testid="church-tax-select"]').setValue('CATHOLIC')
      await wrapper.find('[data-testid="help-button"]').trigger('click')
      await nextTick()

      // 验证通信日志记录
      const logs = wrapper.findAll('[data-testid^="log-"]')
      expect(logs.length).toBeGreaterThanOrEqual(3)

      // 验证日志内容
      const logTexts = logs.map(log => log.text())
      expect(logTexts.some(text => text.includes('settings-changed'))).toBe(true)
      expect(logTexts.some(text => text.includes('help-requested'))).toBe(true)
    })

    it('应该支持清空通信日志', async () => {
      // 先产生一些日志
      await wrapper.find('[data-testid="state-select"]').setValue('BAYERN')
      await nextTick()

      // 验证有日志记录
      let logs = wrapper.findAll('[data-testid^="log-"]')
      expect(logs.length).toBeGreaterThan(0)

      // 清空日志
      await wrapper.find('[data-testid="clear-logs"]').trigger('click')
      await nextTick()

      // 验证日志已清空
      logs = wrapper.findAll('[data-testid^="log-"]')
      expect(logs.length).toBe(0)
      expect(wrapper.find('[data-testid="container-status"]').text()).toContain('日志已清空')
    })

    it('应该正确格式化日志时间戳', async () => {
      // 触发一个操作产生日志
      await wrapper.find('[data-testid="state-select"]').setValue('BAYERN')
      await nextTick()

      // 验证日志时间格式
      const logs = wrapper.findAll('[data-testid^="log-"]')
      expect(logs.length).toBeGreaterThan(0)

      const logText = logs[0].text()
      // 验证时间格式（HH:MM:SS）
      expect(logText).toMatch(/\d{1,2}:\d{2}:\d{2}/)
    })
  })
})
