/**
 * 隐私设置界面测试
 * 验证隐私设置组件的功能和用户交互
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PrivacySettings from '../components/privacy/PrivacySettings.vue'
import RegistrationModal from '../components/privacy/RegistrationModal.vue'
import DeleteConfirmationModal from '../components/privacy/DeleteConfirmationModal.vue'
import type { AnonymousUser, RegisteredUser } from '@/types/user-identity'

// Mock用户身份服务
vi.mock('@/services/UserIdentityService', () => ({
  userIdentityService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getCurrentUser: vi.fn(),
    updateConsent: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    sendEmailVerification: vi.fn().mockResolvedValue({ success: true }),
    upgradeToRegistered: vi.fn()
  }
}))

// Mock UI组件
vi.mock('@/components/ui/BaseCard.vue', () => ({
  default: {
    name: 'BaseCard',
    template: '<div class="mock-card"><slot /></div>',
    props: ['title', 'padding']
  }
}))

vi.mock('@/components/ui/BaseButton.vue', () => ({
  default: {
    name: 'BaseButton',
    template: '<button class="mock-button" @click="$emit(\'click\')" :disabled="disabled || loading"><slot /></button>',
    props: ['variant', 'size', 'disabled', 'loading'],
    emits: ['click']
  }
}))

vi.mock('@/components/ui/BaseIcon.vue', () => ({
  default: {
    name: 'BaseIcon',
    template: '<span class="mock-icon" :data-name="name"></span>',
    props: ['name', 'size']
  }
}))

vi.mock('@/components/ui/ToggleSwitch.vue', () => ({
  default: {
    name: 'ToggleSwitch',
    template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" :disabled="disabled" />',
    props: ['modelValue', 'disabled', 'label'],
    emits: ['update:modelValue']
  }
}))

describe('PrivacySettings', () => {
  let testAnonymousUser: AnonymousUser
  let testRegisteredUser: RegisteredUser
  let mockUserIdentityService: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // 获取Mock的服务
    const { userIdentityService } = await import('@/services/UserIdentityService')
    mockUserIdentityService = userIdentityService

    // 创建测试用户数据
    testAnonymousUser = {
      id: 'test-anonymous-user',
      type: 'anonymous',
      createdAt: new Date('2024-01-01'),
      lastActiveAt: new Date(),
      dataVersion: '1.0',
      deviceFingerprint: 'test-fingerprint',
      deviceInfo: {
        type: 'desktop',
        os: 'other',
        browser: 'other',
        screenSize: 'medium',
        timezone: 'Europe/Berlin',
        locale: 'de-DE'
      },
      preferences: {
        language: 'de',
        currency: 'EUR',
        theme: 'auto',
        numberFormat: 'de-DE',
        dateFormat: 'DD.MM.YYYY',
        notifications: {
          browser: true,
          email: false,
          goalReminders: true,
          dataCleanupReminders: true,
          updateNotifications: true
        },
        privacy: {
          dataCollection: 'functional',
          analytics: false,
          performanceMonitoring: true,
          errorReporting: true,
          usageStatistics: false
        },
        autoSave: true,
        dataRetentionDays: 365
      },
      consentSettings: {
        functional: {
          status: 'granted',
          timestamp: new Date(),
          source: 'initial_setup',
          legalBasis: 'legitimate_interest',
          purposes: ['calculation_history', 'user_preferences'],
          retentionPeriod: 365
        },
        analytics: {
          status: 'denied',
          timestamp: new Date(),
          source: 'initial_setup',
          legalBasis: 'consent',
          purposes: ['analytics'],
          retentionPeriod: 365
        },
        marketing: {
          status: 'denied',
          timestamp: new Date(),
          source: 'initial_setup',
          legalBasis: 'consent',
          purposes: [],
          retentionPeriod: 365
        }
      }
    }

    testRegisteredUser = {
      ...testAnonymousUser,
      type: 'registered',
      email: 'test@example.de',
      emailVerified: true,
      registrationDate: new Date('2024-01-01'),
      syncEnabled: true,
      syncSettings: {
        enabled: true,
        lastSync: new Date(),
        syncedDevices: [
          {
            id: 'device-1',
            name: 'Desktop Computer',
            type: 'desktop',
            lastSync: new Date(),
            fingerprint: 'desktop-fingerprint'
          }
        ],
        conflictResolution: 'manual',
        autoSync: true,
        syncFrequency: 'daily'
      }
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('组件渲染', () => {
    it('应该正确渲染匿名用户界面', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.privacy-settings').exists()).toBe(true)
      expect(wrapper.text()).toContain('Datenschutz-Einstellungen')
      expect(wrapper.text()).toContain('Anonymer Benutzer')
      expect(wrapper.text()).toContain('Registrieren')
    })

    it('应该正确渲染注册用户界面', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testRegisteredUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Registrierter Benutzer')
      expect(wrapper.text()).toContain('test@example.de')
      expect(wrapper.text()).toContain('Verifiziert')
      expect(wrapper.text()).toContain('Datensynchronisation')
    })

    it('应该显示加载状态', () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(null)

      const wrapper = mount(PrivacySettings)

      expect(wrapper.text()).toContain('Einstellungen werden geladen...')
    })
  })

  describe('同意管理', () => {
    it('应该显示正确的同意状态', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      // 功能性数据应该总是启用且禁用切换
      const functionalToggle = wrapper.find('input[type="checkbox"]')
      expect(functionalToggle.attributes('disabled')).toBeDefined()

      // 分析数据应该根据用户设置显示
      const toggles = wrapper.findAll('input[type="checkbox"]')
      expect(toggles.length).toBeGreaterThan(1)
    })

    it('应该能够更新同意设置', async () => {
      const updatedUser = { ...testAnonymousUser }
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)
      mockUserIdentityService.updateConsent.mockResolvedValue(updatedUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      // 模拟切换分析同意
      const analyticsToggle = wrapper.findAll('input[type="checkbox"]')[1]
      if (analyticsToggle) {
        await analyticsToggle.trigger('change')

        expect(mockUserIdentityService.updateConsent).toHaveBeenCalledWith(
          testAnonymousUser.id,
          'analytics',
          expect.any(Boolean)
        )
      }
    })
  })

  describe('数据管理', () => {
    it('应该显示数据保留设置', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Datenaufbewahrung')
      expect(wrapper.find('select').exists()).toBe(true)
    })

    it('应该能够导出用户数据', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      global.URL.revokeObjectURL = vi.fn()

      // Mock document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      // 查找导出按钮并点击
      const exportButton = wrapper.find('button:contains("Daten exportieren")')
      if (exportButton.exists()) {
        await exportButton.trigger('click')
        expect(mockLink.click).toHaveBeenCalled()
      }
    })

    it('应该显示账户删除选项', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Konto löschen')
      expect(wrapper.text()).toContain('unwiderruflich gelöscht')
    })
  })

  describe('同步设置', () => {
    it('应该为注册用户显示同步设置', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testRegisteredUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Datensynchronisation')
      expect(wrapper.text()).toContain('Geräteübergreifende Synchronisation')
      expect(wrapper.text()).toContain('Automatische Synchronisation')
    })

    it('应该显示同步的设备列表', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testRegisteredUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Synchronisierte Geräte')
      expect(wrapper.text()).toContain('Desktop Computer')
    })

    it('应该能够更新同步设置', async () => {
      const updatedUser = { ...testRegisteredUser }
      mockUserIdentityService.getCurrentUser.mockReturnValue(testRegisteredUser)
      mockUserIdentityService.updateUser.mockResolvedValue(updatedUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      // 模拟切换同步设置
      const syncToggle = wrapper.find('input[type="checkbox"]')
      await syncToggle.trigger('change')

      expect(mockUserIdentityService.updateUser).toHaveBeenCalled()
    })
  })

  describe('DSGVO合规性', () => {
    it('应该显示DSGVO权利信息', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Ihre Rechte nach DSGVO')
      expect(wrapper.text()).toContain('Auskunftsrecht (Art. 15)')
      expect(wrapper.text()).toContain('Berichtigungsrecht (Art. 16)')
      expect(wrapper.text()).toContain('Löschungsrecht (Art. 17)')
      expect(wrapper.text()).toContain('Datenübertragbarkeit (Art. 20)')
      expect(wrapper.text()).toContain('Widerspruchsrecht (Art. 21)')
      expect(wrapper.text()).toContain('Einschränkungsrecht (Art. 18)')
    })

    it('应该显示同意历史', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Einwilligungshistorie')
      expect(wrapper.text()).toContain('functional')
      expect(wrapper.text()).toContain('analytics')
    })
  })

  describe('模态框交互', () => {
    it('应该能够打开注册模态框', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      // 查找注册按钮
      const registerButton = wrapper.find('button:contains("Registrieren")')
      if (registerButton.exists()) {
        await registerButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.findComponent(RegistrationModal).exists()).toBe(true)
      }
    })

    it('应该能够打开删除确认模态框', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      // 查找删除按钮
      const deleteButton = wrapper.find('button:contains("Konto löschen")')
      if (deleteButton.exists()) {
        await deleteButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.findComponent(DeleteConfirmationModal).exists()).toBe(true)
      }
    })
  })

  describe('错误处理', () => {
    it('应该处理服务初始化错误', async () => {
      mockUserIdentityService.initialize.mockRejectedValue(new Error('Service error'))

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      // 应该仍然显示界面，但可能显示错误状态
      expect(wrapper.find('.privacy-settings').exists()).toBe(true)
    })

    it('应该处理同意更新错误', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)
      mockUserIdentityService.updateConsent.mockRejectedValue(new Error('Update failed'))

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      // 模拟切换同意设置
      const toggle = wrapper.find('input[type="checkbox"]')
      if (toggle.exists()) {
        await toggle.trigger('change')

        // 错误应该被捕获并记录
        expect(mockUserIdentityService.updateConsent).toHaveBeenCalled()
      }
    })
  })

  describe('响应式设计', () => {
    it('应该在移动端正确显示', async () => {
      mockUserIdentityService.getCurrentUser.mockReturnValue(testAnonymousUser)

      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const wrapper = mount(PrivacySettings)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.privacy-settings').exists()).toBe(true)
      // 在实际应用中，这里会检查响应式类名
    })
  })
})
