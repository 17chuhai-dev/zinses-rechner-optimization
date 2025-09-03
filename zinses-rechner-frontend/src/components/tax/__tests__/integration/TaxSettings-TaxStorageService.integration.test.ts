/**
 * TaxSettings与TaxStorageService集成测试
 * 验证组件与存储服务的协作关系和数据持久化功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick, ref, onMounted, onUnmounted } from 'vue'
import { TaxStorageService } from '@/services/TaxStorageService'
import {
  TaxSettings as TaxSettingsType,
  DEFAULT_TAX_SETTINGS,
  GermanState,
  ChurchTaxType,
  StorageVersion,
  BackupData,
  StorageQuota
} from '@/types/GermanTaxTypes'

// 创建简化的TaxSettings组件用于存储服务集成测试
const TaxSettingsStorageTestComponent = {
  name: 'TaxSettingsStorageTest',
  template: `
    <div class="tax-settings-storage-test" data-testid="tax-settings-storage">
      <div class="storage-info" data-testid="storage-info">
        <div class="storage-status">
          <span data-testid="storage-status">{{ storageStatus }}</span>
          <span data-testid="storage-version">版本: {{ currentVersion }}</span>
          <span data-testid="storage-usage">使用: {{ storageUsage }}%</span>
        </div>

        <div class="auto-save-indicator" v-if="isAutoSaving" data-testid="auto-save-indicator">
          自动保存中...
        </div>

        <div class="sync-status" data-testid="sync-status">
          同步状态: {{ syncStatus }}
        </div>
      </div>

      <div class="main-settings">
        <div class="form-section">
          <label>联邦州选择</label>
          <select
            v-model="settings.userInfo.state"
            @change="handleSettingChange"
            data-testid="state-select"
          >
            <option value="">请选择联邦州</option>
            <option value="NORDRHEIN_WESTFALEN">北莱茵-威斯特法伦州</option>
            <option value="BAYERN">巴伐利亚州</option>
            <option value="BADEN_WUERTTEMBERG">巴登-符腾堡州</option>
          </select>
        </div>

        <div class="form-section">
          <label>教会税设置</label>
          <input
            type="radio"
            id="church-none"
            value="NONE"
            v-model="settings.userInfo.churchTaxType"
            @change="handleSettingChange"
            data-testid="church-none"
          />
          <label for="church-none">无教会税</label>

          <input
            type="radio"
            id="church-catholic"
            value="CATHOLIC"
            v-model="settings.userInfo.churchTaxType"
            @change="handleSettingChange"
            data-testid="church-catholic"
          />
          <label for="church-catholic">天主教</label>
        </div>

        <div class="form-section">
          <label>免税额度设置</label>
          <input
            type="number"
            v-model.number="settings.freistellungsauftrag.annualAllowance"
            @input="handleSettingChange"
            data-testid="allowance-input"
          />
        </div>

        <div class="form-section">
          <input
            type="checkbox"
            id="abgeltungssteuer-enabled"
            v-model="settings.abgeltungssteuer.enabled"
            @change="handleSettingChange"
            data-testid="abgeltungssteuer-enabled"
          />
          <label for="abgeltungssteuer-enabled">启用资本利得税</label>
        </div>
      </div>

      <div class="storage-actions">
        <button @click="saveSettings" data-testid="save-button">
          手动保存
        </button>

        <button @click="loadSettings" data-testid="load-button">
          重新加载
        </button>

        <button @click="createBackup" data-testid="backup-button">
          创建备份
        </button>

        <button @click="restoreFromBackup" data-testid="restore-button">
          恢复备份
        </button>

        <button @click="exportSettings" data-testid="export-button">
          导出设置
        </button>

        <button @click="importSettings" data-testid="import-button">
          导入设置
        </button>

        <button @click="clearStorage" data-testid="clear-button">
          清空存储
        </button>

        <button @click="checkStorageQuota" data-testid="quota-button">
          检查配额
        </button>
      </div>

      <div class="backup-list" v-if="backups.length > 0" data-testid="backup-list">
        <h4>备份列表</h4>
        <div
          v-for="backup in backups"
          :key="backup.id"
          class="backup-item"
          :data-testid="'backup-' + backup.id"
        >
          <span>{{ backup.name }}</span>
          <span>{{ formatDate(backup.timestamp) }}</span>
          <button @click="restoreBackup(backup.id)">恢复</button>
          <button @click="deleteBackup(backup.id)">删除</button>
        </div>
      </div>

      <div class="version-info" v-if="versionHistory.length > 0" data-testid="version-info">
        <h4>版本历史</h4>
        <div
          v-for="version in versionHistory"
          :key="version.version"
          class="version-item"
          :data-testid="'version-' + version.version"
        >
          <span>版本 {{ version.version }}</span>
          <span>{{ version.description }}</span>
          <span>{{ formatDate(version.timestamp) }}</span>
        </div>
      </div>

      <div v-if="statusMessage" class="status-message" data-testid="status-message">
        {{ statusMessage }}
      </div>

      <div v-if="errorMessage" class="error-message" data-testid="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="isLoading" class="loading-indicator" data-testid="loading-indicator">
        处理中...
      </div>
    </div>
  `,
  setup() {
    const storageService = TaxStorageService.getInstance()
    const settings = ref({ ...DEFAULT_TAX_SETTINGS })
    const storageStatus = ref('未知')
    const currentVersion = ref('1.0.0')
    const storageUsage = ref(0)
    const isAutoSaving = ref(false)
    const syncStatus = ref('已同步')
    const backups = ref([])
    const versionHistory = ref([])
    const statusMessage = ref('')
    const errorMessage = ref('')
    const isLoading = ref(false)

    // 组件挂载时初始化存储服务
    onMounted(async () => {
      try {
        await storageService.initialize()
        const loadedSettings = await storageService.loadSettings()
        if (loadedSettings) {
          settings.value = { ...loadedSettings }
        }

        // 获取存储状态信息
        storageStatus.value = '已连接'
        currentVersion.value = storageService.getCurrentVersion()
        storageUsage.value = await storageService.getStorageUsage()

        statusMessage.value = '存储服务已初始化'
      } catch (error) {
        statusMessage.value = '存储服务初始化失败'
        errorMessage.value = error.message
        console.error('存储服务初始化失败:', error)
      }
    })

    // 监听存储服务事件
    const unsubscribeStorageChange = storageService.onStorageChange('test-component', (newSettings) => {
      settings.value = { ...newSettings }
      syncStatus.value = '已同步'
      statusMessage.value = '设置已从存储更新'
    })

    const unsubscribeAutoSave = storageService.onAutoSave('test-component', (isActive) => {
      isAutoSaving.value = isActive
      if (isActive) {
        statusMessage.value = '自动保存中...'
      } else {
        statusMessage.value = '自动保存完成'
      }
    })

    const unsubscribeStorageError = storageService.onStorageError('test-component', (error) => {
      errorMessage.value = error.message
      storageStatus.value = '错误'
      statusMessage.value = '存储操作失败'
    })

    const unsubscribeQuotaWarning = storageService.onQuotaWarning('test-component', (usage) => {
      storageUsage.value = usage
      statusMessage.value = `存储空间使用率: ${usage}%`
      if (usage > 80) {
        errorMessage.value = '存储空间不足，请清理数据'
      }
    })

    // 清理监听器
    onUnmounted(() => {
      unsubscribeStorageChange()
      unsubscribeAutoSave()
      unsubscribeStorageError()
      unsubscribeQuotaWarning()
    })

    // 事件处理器
    const handleSettingChange = async () => {
      syncStatus.value = '同步中...'
      try {
        // 触发自动保存
        await storageService.autoSave(settings.value)
        syncStatus.value = '已同步'
        statusMessage.value = '设置已自动保存'
      } catch (error) {
        syncStatus.value = '同步失败'
        errorMessage.value = error.message
        console.error('自动保存失败:', error)
      }
    }

    const saveSettings = async () => {
      isLoading.value = true
      try {
        const success = await storageService.saveSettings(settings.value)
        if (success) {
          statusMessage.value = '设置保存成功'
          errorMessage.value = ''
        } else {
          statusMessage.value = '设置保存失败'
        }
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '保存操作出错'
        console.error('保存设置失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const loadSettings = async () => {
      isLoading.value = true
      try {
        const loadedSettings = await storageService.loadSettings()
        if (loadedSettings) {
          settings.value = { ...loadedSettings }
          statusMessage.value = '设置加载成功'
          errorMessage.value = ''
        } else {
          statusMessage.value = '没有找到保存的设置'
        }
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '加载设置失败'
        console.error('加载设置失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const createBackup = async () => {
      isLoading.value = true
      try {
        const backupId = await storageService.createBackup(settings.value, '手动备份')
        await loadBackups()
        statusMessage.value = `备份创建成功: ${backupId}`
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '创建备份失败'
        console.error('创建备份失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const restoreFromBackup = async () => {
      if (backups.value.length === 0) {
        statusMessage.value = '没有可用的备份'
        return
      }

      isLoading.value = true
      try {
        const latestBackup = backups.value[0]
        const restoredSettings = await storageService.restoreFromBackup(latestBackup.id)
        settings.value = { ...restoredSettings }
        statusMessage.value = '从备份恢复成功'
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '恢复备份失败'
        console.error('恢复备份失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const exportSettings = async () => {
      try {
        const exportData = await storageService.exportSettings()
        // 模拟下载
        statusMessage.value = '设置导出成功'
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '导出设置失败'
        console.error('导出设置失败:', error)
      }
    }

    const importSettings = async () => {
      try {
        // 模拟导入数据
        const importData = { settings: settings.value, version: '1.0.0' }
        const importedSettings = await storageService.importSettings(importData)
        settings.value = { ...importedSettings }
        statusMessage.value = '设置导入成功'
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '导入设置失败'
        console.error('导入设置失败:', error)
      }
    }

    const clearStorage = async () => {
      isLoading.value = true
      try {
        await storageService.clearStorage()
        settings.value = { ...DEFAULT_TAX_SETTINGS }
        backups.value = []
        versionHistory.value = []
        statusMessage.value = '存储已清空'
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '清空存储失败'
        console.error('清空存储失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const checkStorageQuota = async () => {
      try {
        const quota = await storageService.getStorageQuota()
        storageUsage.value = quota.usagePercentage
        statusMessage.value = `存储配额: ${quota.used}/${quota.total} (${quota.usagePercentage}%)`
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '检查存储配额失败'
        console.error('检查存储配额失败:', error)
      }
    }

    const loadBackups = async () => {
      try {
        backups.value = await storageService.getBackupList()
      } catch (error) {
        console.error('加载备份列表失败:', error)
      }
    }

    const restoreBackup = async (backupId) => {
      isLoading.value = true
      try {
        const restoredSettings = await storageService.restoreFromBackup(backupId)
        settings.value = { ...restoredSettings }
        statusMessage.value = `从备份 ${backupId} 恢复成功`
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '恢复备份失败'
        console.error('恢复备份失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const deleteBackup = async (backupId) => {
      try {
        await storageService.deleteBackup(backupId)
        await loadBackups()
        statusMessage.value = `备份 ${backupId} 已删除`
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message
        statusMessage.value = '删除备份失败'
        console.error('删除备份失败:', error)
      }
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleString('de-DE')
    }

    return {
      settings,
      storageStatus,
      currentVersion,
      storageUsage,
      isAutoSaving,
      syncStatus,
      backups,
      versionHistory,
      statusMessage,
      errorMessage,
      isLoading,
      handleSettingChange,
      saveSettings,
      loadSettings,
      createBackup,
      restoreFromBackup,
      exportSettings,
      importSettings,
      clearStorage,
      checkStorageQuota,
      restoreBackup,
      deleteBackup,
      formatDate
    }
  }
}

describe('TaxSettings与TaxStorageService集成测试', () => {
  let wrapper: VueWrapper<any>
  let storageService: TaxStorageService

  beforeEach(() => {
    // 重置单例实例
    ;(TaxStorageService as any).instance = null
    storageService = TaxStorageService.getInstance()

    // 清除所有mock调用记录
    vi.clearAllMocks()

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    // 清理单例实例
    ;(TaxStorageService as any).instance = null
  })

  describe('存储服务初始化集成', () => {
    it('应该在组件挂载时正确初始化存储服务', async () => {
      const initializeSpy = vi.spyOn(storageService, 'initialize').mockResolvedValue(undefined)
      const loadSettingsSpy = vi.spyOn(storageService, 'loadSettings').mockResolvedValue(DEFAULT_TAX_SETTINGS)
      const getCurrentVersionSpy = vi.spyOn(storageService, 'getCurrentVersion').mockReturnValue('1.0.0')
      const getStorageUsageSpy = vi.spyOn(storageService, 'getStorageUsage').mockResolvedValue(25)

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()

      // 验证存储服务被初始化
      expect(initializeSpy).toHaveBeenCalled()
      expect(loadSettingsSpy).toHaveBeenCalled()
      expect(getCurrentVersionSpy).toHaveBeenCalled()
      expect(getStorageUsageSpy).toHaveBeenCalled()
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('存储服务已初始化')
    })

    it('应该正确显示存储状态信息', async () => {
      vi.spyOn(storageService, 'initialize').mockResolvedValue(undefined)
      vi.spyOn(storageService, 'loadSettings').mockResolvedValue(DEFAULT_TAX_SETTINGS)
      vi.spyOn(storageService, 'getCurrentVersion').mockReturnValue('2.1.0')
      vi.spyOn(storageService, 'getStorageUsage').mockResolvedValue(45)

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()

      // 验证存储状态信息显示
      expect(wrapper.find('[data-testid="storage-status"]').text()).toBe('已连接')
      expect(wrapper.find('[data-testid="storage-version"]').text()).toBe('版本: 2.1.0')
      expect(wrapper.find('[data-testid="storage-usage"]').text()).toBe('使用: 45%')
    })

    it('应该在初始化失败时显示错误信息', async () => {
      const initializeSpy = vi.spyOn(storageService, 'initialize').mockRejectedValue(new Error('存储不可用'))

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()

      // 验证错误信息显示
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('存储服务初始化失败')
      expect(wrapper.find('[data-testid="error-message"]').text()).toContain('存储不可用')
    })
  })

  describe('数据持久化集成测试', () => {
    beforeEach(async () => {
      vi.spyOn(storageService, 'initialize').mockResolvedValue(undefined)
      vi.spyOn(storageService, 'loadSettings').mockResolvedValue(DEFAULT_TAX_SETTINGS)
      vi.spyOn(storageService, 'getCurrentVersion').mockReturnValue('1.0.0')
      vi.spyOn(storageService, 'getStorageUsage').mockResolvedValue(25)

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()
    })

    it('应该在用户修改设置时触发自动保存', async () => {
      const autoSaveSpy = vi.spyOn(storageService, 'autoSave').mockResolvedValue(true)

      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.setValue('BAYERN')
      await nextTick()

      // 验证自动保存被触发
      expect(autoSaveSpy).toHaveBeenCalledWith(expect.objectContaining({
        userInfo: expect.objectContaining({
          state: 'BAYERN'
        })
      }))
      expect(wrapper.find('[data-testid="sync-status"]').text()).toContain('已同步')
    })

    it('应该支持手动保存设置', async () => {
      const saveSettingsSpy = vi.spyOn(storageService, 'saveSettings').mockResolvedValue(true)

      // 修改设置
      const churchCatholic = wrapper.find('[data-testid="church-catholic"]')
      await churchCatholic.setChecked(true)
      await nextTick()

      // 点击手动保存按钮
      const saveButton = wrapper.find('[data-testid="save-button"]')
      await saveButton.trigger('click')
      await nextTick()

      // 验证手动保存被调用
      expect(saveSettingsSpy).toHaveBeenCalledWith(expect.objectContaining({
        userInfo: expect.objectContaining({
          churchTaxType: 'CATHOLIC'
        })
      }))
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置保存成功')
    })

    it('应该支持重新加载设置', async () => {
      const mockLoadedSettings = {
        ...DEFAULT_TAX_SETTINGS,
        userInfo: {
          ...DEFAULT_TAX_SETTINGS.userInfo,
          state: 'BADEN_WUERTTEMBERG',
          churchTaxType: 'CATHOLIC'
        }
      }
      const loadSettingsSpy = vi.spyOn(storageService, 'loadSettings').mockResolvedValue(mockLoadedSettings)

      const loadButton = wrapper.find('[data-testid="load-button"]')
      await loadButton.trigger('click')
      await nextTick()

      // 验证设置被重新加载
      expect(loadSettingsSpy).toHaveBeenCalled()
      expect(wrapper.vm.settings.userInfo.state).toBe('BADEN_WUERTTEMBERG')
      expect(wrapper.vm.settings.userInfo.churchTaxType).toBe('CATHOLIC')
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置加载成功')
    })

    it('应该在保存失败时显示错误信息', async () => {
      const saveSettingsSpy = vi.spyOn(storageService, 'saveSettings').mockRejectedValue(new Error('存储空间不足'))

      const saveButton = wrapper.find('[data-testid="save-button"]')
      await saveButton.trigger('click')
      await nextTick()

      // 验证错误信息显示
      expect(wrapper.find('[data-testid="error-message"]').text()).toContain('存储空间不足')
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('保存操作出错')
    })
  })

  describe('备份和恢复集成测试', () => {
    beforeEach(async () => {
      vi.spyOn(storageService, 'initialize').mockResolvedValue(undefined)
      vi.spyOn(storageService, 'loadSettings').mockResolvedValue(DEFAULT_TAX_SETTINGS)
      vi.spyOn(storageService, 'getCurrentVersion').mockReturnValue('1.0.0')
      vi.spyOn(storageService, 'getStorageUsage').mockResolvedValue(25)

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()
    })

    it('应该支持创建备份', async () => {
      const mockBackupId = 'backup-123'
      const createBackupSpy = vi.spyOn(storageService, 'createBackup').mockResolvedValue(mockBackupId)
      const getBackupListSpy = vi.spyOn(storageService, 'getBackupList').mockResolvedValue([
        {
          id: mockBackupId,
          name: '手动备份',
          timestamp: Date.now(),
          settings: DEFAULT_TAX_SETTINGS
        }
      ])

      const backupButton = wrapper.find('[data-testid="backup-button"]')
      await backupButton.trigger('click')
      await nextTick()

      // 验证备份创建
      expect(createBackupSpy).toHaveBeenCalledWith(expect.any(Object), '手动备份')
      expect(getBackupListSpy).toHaveBeenCalled()
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain(`备份创建成功: ${mockBackupId}`)
    })

    it('应该支持从备份恢复设置', async () => {
      const mockBackupSettings = {
        ...DEFAULT_TAX_SETTINGS,
        userInfo: {
          ...DEFAULT_TAX_SETTINGS.userInfo,
          state: 'NORDRHEIN_WESTFALEN'
        }
      }

      // 先设置备份列表
      wrapper.vm.backups = [
        {
          id: 'backup-456',
          name: '自动备份',
          timestamp: Date.now(),
          settings: mockBackupSettings
        }
      ]
      await nextTick()

      const restoreFromBackupSpy = vi.spyOn(storageService, 'restoreFromBackup').mockResolvedValue(mockBackupSettings)

      const restoreButton = wrapper.find('[data-testid="restore-button"]')
      await restoreButton.trigger('click')
      await nextTick()

      // 验证从备份恢复
      expect(restoreFromBackupSpy).toHaveBeenCalledWith('backup-456')
      expect(wrapper.vm.settings.userInfo.state).toBe('NORDRHEIN_WESTFALEN')
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('从备份恢复成功')
    })

    it('应该支持删除备份', async () => {
      const mockBackups = [
        {
          id: 'backup-789',
          name: '测试备份',
          timestamp: Date.now(),
          settings: DEFAULT_TAX_SETTINGS
        }
      ]

      // 设置初始备份列表
      wrapper.vm.backups = mockBackups
      await nextTick()

      const deleteBackupSpy = vi.spyOn(storageService, 'deleteBackup').mockResolvedValue(true)
      const getBackupListSpy = vi.spyOn(storageService, 'getBackupList').mockResolvedValue([])

      // 点击删除按钮
      const deleteButton = wrapper.find('[data-testid="backup-backup-789"] button:last-child')
      await deleteButton.trigger('click')
      await nextTick()

      // 验证备份删除
      expect(deleteBackupSpy).toHaveBeenCalledWith('backup-789')
      expect(getBackupListSpy).toHaveBeenCalled()
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('备份 backup-789 已删除')
    })
  })

  describe('导入导出集成测试', () => {
    beforeEach(async () => {
      vi.spyOn(storageService, 'initialize').mockResolvedValue(undefined)
      vi.spyOn(storageService, 'loadSettings').mockResolvedValue(DEFAULT_TAX_SETTINGS)
      vi.spyOn(storageService, 'getCurrentVersion').mockReturnValue('1.0.0')
      vi.spyOn(storageService, 'getStorageUsage').mockResolvedValue(25)

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()
    })

    it('应该支持导出设置', async () => {
      const mockExportData = {
        settings: DEFAULT_TAX_SETTINGS,
        version: '1.0.0',
        timestamp: Date.now()
      }
      const exportSettingsSpy = vi.spyOn(storageService, 'exportSettings').mockResolvedValue(mockExportData)

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')
      await nextTick()

      // 验证导出功能
      expect(exportSettingsSpy).toHaveBeenCalled()
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置导出成功')
    })

    it('应该支持导入设置', async () => {
      const mockImportedSettings = {
        ...DEFAULT_TAX_SETTINGS,
        abgeltungssteuer: {
          ...DEFAULT_TAX_SETTINGS.abgeltungssteuer,
          enabled: true
        }
      }
      const importSettingsSpy = vi.spyOn(storageService, 'importSettings').mockResolvedValue(mockImportedSettings)

      const importButton = wrapper.find('[data-testid="import-button"]')
      await importButton.trigger('click')
      await nextTick()

      // 验证导入功能
      expect(importSettingsSpy).toHaveBeenCalledWith(expect.objectContaining({
        settings: expect.any(Object),
        version: '1.0.0'
      }))
      expect(wrapper.vm.settings.abgeltungssteuer.enabled).toBe(true)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置导入成功')
    })
  })

  describe('存储配额管理集成测试', () => {
    beforeEach(async () => {
      vi.spyOn(storageService, 'initialize').mockResolvedValue(undefined)
      vi.spyOn(storageService, 'loadSettings').mockResolvedValue(DEFAULT_TAX_SETTINGS)
      vi.spyOn(storageService, 'getCurrentVersion').mockReturnValue('1.0.0')
      vi.spyOn(storageService, 'getStorageUsage').mockResolvedValue(25)

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()
    })

    it('应该支持检查存储配额', async () => {
      const mockQuota = {
        total: 10485760, // 10MB
        used: 2097152,   // 2MB
        available: 8388608, // 8MB
        usagePercentage: 20
      }
      const getStorageQuotaSpy = vi.spyOn(storageService, 'getStorageQuota').mockResolvedValue(mockQuota)

      const quotaButton = wrapper.find('[data-testid="quota-button"]')
      await quotaButton.trigger('click')
      await nextTick()

      // 验证配额检查
      expect(getStorageQuotaSpy).toHaveBeenCalled()
      expect(wrapper.vm.storageUsage).toBe(20)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('存储配额: 2097152/10485760 (20%)')
    })

    it('应该在存储空间不足时显示警告', async () => {
      const mockQuota = {
        total: 10485760,
        used: 9437184, // 90% used
        available: 1048576,
        usagePercentage: 90
      }
      vi.spyOn(storageService, 'getStorageQuota').mockResolvedValue(mockQuota)

      const quotaButton = wrapper.find('[data-testid="quota-button"]')
      await quotaButton.trigger('click')
      await nextTick()

      // 验证警告信息
      expect(wrapper.vm.storageUsage).toBe(90)
      expect(wrapper.find('[data-testid="error-message"]').text()).toContain('存储空间不足，请清理数据')
    })

    it('应该支持清空存储', async () => {
      const clearStorageSpy = vi.spyOn(storageService, 'clearStorage').mockResolvedValue(true)

      const clearButton = wrapper.find('[data-testid="clear-button"]')
      await clearButton.trigger('click')
      await nextTick()

      // 验证存储清空
      expect(clearStorageSpy).toHaveBeenCalled()
      expect(wrapper.vm.settings).toEqual(DEFAULT_TAX_SETTINGS)
      expect(wrapper.vm.backups).toEqual([])
      expect(wrapper.vm.versionHistory).toEqual([])
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('存储已清空')
    })
  })

  describe('版本迁移集成测试', () => {
    beforeEach(async () => {
      vi.spyOn(storageService, 'initialize').mockResolvedValue(undefined)
      vi.spyOn(storageService, 'loadSettings').mockResolvedValue(DEFAULT_TAX_SETTINGS)
      vi.spyOn(storageService, 'getCurrentVersion').mockReturnValue('2.0.0')
      vi.spyOn(storageService, 'getStorageUsage').mockResolvedValue(25)

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()
    })

    it('应该正确处理版本升级', async () => {
      const mockVersionHistory = [
        {
          version: '1.0.0',
          description: '初始版本',
          timestamp: Date.now() - 86400000 // 1天前
        },
        {
          version: '2.0.0',
          description: '添加ETF支持',
          timestamp: Date.now()
        }
      ]

      // 模拟版本历史
      wrapper.vm.versionHistory = mockVersionHistory
      await nextTick()

      // 验证版本信息显示
      expect(wrapper.find('[data-testid="version-info"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="version-1.0.0"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="version-2.0.0"]').exists()).toBe(true)
    })

    it('应该在版本迁移时保持数据完整性', async () => {
      const migrateDataSpy = vi.spyOn(storageService, 'migrateData').mockResolvedValue({
        success: true,
        migratedSettings: DEFAULT_TAX_SETTINGS,
        backupId: 'migration-backup-123'
      })

      // 模拟版本迁移触发
      await wrapper.vm.handleVersionMigration('1.5.0', '2.0.0')

      // 验证迁移处理
      expect(migrateDataSpy).toHaveBeenCalledWith('1.5.0', '2.0.0')
    })
  })

  describe('错误处理和恢复集成测试', () => {
    beforeEach(async () => {
      vi.spyOn(storageService, 'initialize').mockResolvedValue(undefined)
      vi.spyOn(storageService, 'loadSettings').mockResolvedValue(DEFAULT_TAX_SETTINGS)
      vi.spyOn(storageService, 'getCurrentVersion').mockReturnValue('1.0.0')
      vi.spyOn(storageService, 'getStorageUsage').mockResolvedValue(25)

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()
    })

    it('应该正确处理存储错误事件', async () => {
      const mockError = new Error('存储访问被拒绝')

      // 模拟存储错误事件
      const errorCallback = wrapper.vm.$options.setup().unsubscribeStorageError
      if (typeof errorCallback === 'function') {
        errorCallback(mockError)
        await nextTick()
      }

      // 验证错误处理
      expect(wrapper.vm.errorMessage).toBe('存储访问被拒绝')
      expect(wrapper.vm.storageStatus).toBe('错误')
    })

    it('应该在自动保存失败时显示错误信息', async () => {
      const autoSaveSpy = vi.spyOn(storageService, 'autoSave').mockRejectedValue(new Error('网络连接失败'))

      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.setValue('BAYERN')
      await nextTick()

      // 验证错误处理
      expect(wrapper.find('[data-testid="sync-status"]').text()).toContain('同步失败')
      expect(wrapper.find('[data-testid="error-message"]').text()).toContain('网络连接失败')
    })

    it('应该支持从错误状态恢复', async () => {
      // 先设置错误状态
      wrapper.vm.errorMessage = '存储错误'
      wrapper.vm.storageStatus = '错误'
      await nextTick()

      // 模拟恢复操作
      vi.spyOn(storageService, 'saveSettings').mockResolvedValue(true)

      const saveButton = wrapper.find('[data-testid="save-button"]')
      await saveButton.trigger('click')
      await nextTick()

      // 验证错误恢复
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('设置保存成功')
      expect(wrapper.vm.errorMessage).toBe('')
    })
  })

  describe('事件监听和回调集成测试', () => {
    beforeEach(async () => {
      vi.spyOn(storageService, 'initialize').mockResolvedValue(undefined)
      vi.spyOn(storageService, 'loadSettings').mockResolvedValue(DEFAULT_TAX_SETTINGS)
      vi.spyOn(storageService, 'getCurrentVersion').mockReturnValue('1.0.0')
      vi.spyOn(storageService, 'getStorageUsage').mockResolvedValue(25)

      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()
    })

    it('应该正确响应存储变更事件', async () => {
      const onStorageChangeSpy = vi.spyOn(storageService, 'onStorageChange')

      // 验证监听器注册
      expect(onStorageChangeSpy).toHaveBeenCalledWith('test-component', expect.any(Function))
    })

    it('应该正确响应自动保存事件', async () => {
      const onAutoSaveSpy = vi.spyOn(storageService, 'onAutoSave')

      // 验证监听器注册
      expect(onAutoSaveSpy).toHaveBeenCalledWith('test-component', expect.any(Function))
    })

    it('应该正确响应配额警告事件', async () => {
      const onQuotaWarningSpy = vi.spyOn(storageService, 'onQuotaWarning')

      // 验证监听器注册
      expect(onQuotaWarningSpy).toHaveBeenCalledWith('test-component', expect.any(Function))
    })

    it('应该在组件卸载时清理所有监听器', async () => {
      const unsubscribeFunctions = [
        vi.fn(),
        vi.fn(),
        vi.fn(),
        vi.fn()
      ]

      // Mock监听器返回的取消订阅函数
      vi.spyOn(storageService, 'onStorageChange').mockReturnValue(unsubscribeFunctions[0])
      vi.spyOn(storageService, 'onAutoSave').mockReturnValue(unsubscribeFunctions[1])
      vi.spyOn(storageService, 'onStorageError').mockReturnValue(unsubscribeFunctions[2])
      vi.spyOn(storageService, 'onQuotaWarning').mockReturnValue(unsubscribeFunctions[3])

      // 重新挂载组件以触发监听器注册
      wrapper.unmount()
      wrapper = mount(TaxSettingsStorageTestComponent)
      await nextTick()

      // 卸载组件
      wrapper.unmount()

      // 验证所有取消订阅函数被调用
      unsubscribeFunctions.forEach(unsubscribe => {
        expect(unsubscribe).toHaveBeenCalled()
      })
    })
  })
})
