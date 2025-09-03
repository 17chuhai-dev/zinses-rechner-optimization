/**
 * 用户管理器单元测试
 * 测试用户认证、权限管理、协作功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UserManager } from '../UserManager'
import type { User, UserRole, SubscriptionPlan } from '../UserManager'

// 模拟localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// 模拟fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('UserManager', () => {
  let userManager: UserManager

  beforeEach(() => {
    vi.clearAllMocks()
    userManager = UserManager.getInstance()
    
    // 重置状态
    userManager['currentUser'].value = null
    userManager['isAuthenticated'].value = false
    userManager['isLoading'].value = false
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = UserManager.getInstance()
      const instance2 = UserManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('用户注册', () => {
    it('应该成功注册新用户', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        subscriptionPlan: 'free',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'mock-token' })
      })

      const registrationData = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      }

      const result = await userManager.register(registrationData)

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(userManager.isAuthenticated.value).toBe(true)
      expect(userManager.currentUser.value).toEqual(mockUser)
    })

    it('应该处理注册失败', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' })
      })

      const registrationData = {
        email: 'existing@example.com',
        password: 'password',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      }

      const result = await userManager.register(registrationData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
      expect(userManager.isAuthenticated.value).toBe(false)
    })

    it('应该验证注册数据', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // 太短
        username: '',
        firstName: '',
        lastName: ''
      }

      const result = await userManager.register(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('validation')
    })
  })

  describe('用户登录', () => {
    it('应该成功登录用户', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        subscriptionPlan: 'premium',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'mock-token' })
      })

      const result = await userManager.login({
        email: 'test@example.com',
        password: 'password',
        rememberMe: true
      })

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(userManager.isAuthenticated.value).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock-token')
    })

    it('应该处理登录失败', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      })

      const result = await userManager.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(userManager.isAuthenticated.value).toBe(false)
    })

    it('应该支持社交登录', async () => {
      const mockUser: User = {
        id: '1',
        username: 'socialuser',
        email: 'social@example.com',
        firstName: 'Social',
        lastName: 'User',
        role: 'user',
        subscriptionPlan: 'free',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'social-token' })
      })

      const result = await userManager.socialLogin('google', 'google-auth-code')

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
    })
  })

  describe('用户登出', () => {
    it('应该成功登出用户', async () => {
      // 先设置登录状态
      userManager['currentUser'].value = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        subscriptionPlan: 'free',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
      userManager['isAuthenticated'].value = true

      mockFetch.mockResolvedValueOnce({ ok: true })

      await userManager.logout()

      expect(userManager.isAuthenticated.value).toBe(false)
      expect(userManager.currentUser.value).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('权限管理', () => {
    beforeEach(() => {
      userManager['currentUser'].value = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'premium',
        subscriptionPlan: 'premium',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
      userManager['isAuthenticated'].value = true
    })

    it('应该正确检查用户权限', () => {
      expect(userManager.hasPermission('basic_calculations')).toBe(true)
      expect(userManager.hasPermission('advanced_charts')).toBe(true)
      expect(userManager.hasPermission('collaboration')).toBe(true)
      expect(userManager.hasPermission('admin_panel')).toBe(false)
    })

    it('应该正确检查订阅计划权限', () => {
      expect(userManager.hasSubscriptionFeature('export_pdf')).toBe(true)
      expect(userManager.hasSubscriptionFeature('ai_advisor')).toBe(true)
      expect(userManager.hasSubscriptionFeature('unlimited_calculations')).toBe(true)
    })

    it('应该处理管理员权限', () => {
      userManager['currentUser'].value!.role = 'admin'

      expect(userManager.hasPermission('admin_panel')).toBe(true)
      expect(userManager.hasPermission('user_management')).toBe(true)
      expect(userManager.hasPermission('system_settings')).toBe(true)
    })

    it('应该处理未认证用户', () => {
      userManager['isAuthenticated'].value = false
      userManager['currentUser'].value = null

      expect(userManager.hasPermission('basic_calculations')).toBe(true) // 公开功能
      expect(userManager.hasPermission('collaboration')).toBe(false) // 需要认证
      expect(userManager.hasPermission('admin_panel')).toBe(false)
    })
  })

  describe('协作项目管理', () => {
    beforeEach(() => {
      userManager['currentUser'].value = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'premium',
        subscriptionPlan: 'premium',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
      userManager['isAuthenticated'].value = true
    })

    it('应该创建协作项目', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test Description',
        ownerId: '1',
        members: [],
        settings: {
          visibility: 'private' as const,
          allowComments: true,
          allowEditing: true,
          requireApproval: false
        },
        createdAt: new Date()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject })
      })

      const result = await userManager.createProject({
        name: 'Test Project',
        description: 'Test Description',
        settings: {
          visibility: 'private',
          allowComments: true,
          allowEditing: true,
          requireApproval: false
        }
      })

      expect(result.success).toBe(true)
      expect(result.project).toEqual(mockProject)
    })

    it('应该邀请用户到项目', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const result = await userManager.inviteToProject(
        'project-1',
        'user@example.com',
        'editor'
      )

      expect(result.success).toBe(true)
    })

    it('应该获取用户的协作项目', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          role: 'owner',
          lastActivity: new Date()
        },
        {
          id: 'project-2',
          name: 'Project 2',
          role: 'editor',
          lastActivity: new Date()
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects })
      })

      const projects = await userManager.getCollaborationProjects()

      expect(projects).toEqual(mockProjects)
    })
  })

  describe('用户偏好设置', () => {
    beforeEach(() => {
      userManager['currentUser'].value = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        subscriptionPlan: 'free',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
      userManager['isAuthenticated'].value = true
    })

    it('应该更新用户偏好设置', async () => {
      const preferences = {
        theme: 'dark' as const,
        language: 'de' as const,
        currency: 'EUR' as const,
        notifications: {
          email: true,
          push: false,
          dataUpdates: true
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences })
      })

      const result = await userManager.updatePreferences(preferences)

      expect(result.success).toBe(true)
      expect(result.preferences).toEqual(preferences)
    })

    it('应该获取用户偏好设置', async () => {
      const mockPreferences = {
        theme: 'light' as const,
        language: 'de' as const,
        currency: 'EUR' as const,
        notifications: {
          email: true,
          push: true,
          dataUpdates: false
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockPreferences })
      })

      const preferences = await userManager.getPreferences()

      expect(preferences).toEqual(mockPreferences)
    })
  })

  describe('订阅管理', () => {
    it('应该升级用户订阅', async () => {
      userManager['currentUser'].value = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        subscriptionPlan: 'free',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
      userManager['isAuthenticated'].value = true

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          subscription: { plan: 'premium', status: 'active' }
        })
      })

      const result = await userManager.upgradeSubscription('premium')

      expect(result.success).toBe(true)
      expect(userManager.currentUser.value?.subscriptionPlan).toBe('premium')
    })

    it('应该获取订阅状态', async () => {
      const mockSubscription = {
        plan: 'premium' as SubscriptionPlan,
        status: 'active' as const,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
        features: ['export_pdf', 'ai_advisor', 'collaboration']
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: mockSubscription })
      })

      const subscription = await userManager.getSubscriptionStatus()

      expect(subscription).toEqual(mockSubscription)
    })
  })

  describe('会话管理', () => {
    it('应该从存储的token恢复会话', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        subscriptionPlan: 'free',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      mockLocalStorage.getItem.mockReturnValue('stored-token')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser })
      })

      await userManager.initializeAuth()

      expect(userManager.isAuthenticated.value).toBe(true)
      expect(userManager.currentUser.value).toEqual(mockUser)
    })

    it('应该处理无效的存储token', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token')
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      })

      await userManager.initializeAuth()

      expect(userManager.isAuthenticated.value).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })

    it('应该自动刷新即将过期的token', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        subscriptionPlan: 'free',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }

      userManager['currentUser'].value = mockUser
      userManager['isAuthenticated'].value = true

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'new-token' })
      })

      await userManager.refreshToken()

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token')
    })
  })

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValue(new Error('Network Error'))

      const result = await userManager.login({
        email: 'test@example.com',
        password: 'password'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network Error')
    })

    it('应该处理服务器错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      })

      const result = await userManager.register({
        email: 'test@example.com',
        password: 'password',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Internal Server Error')
    })
  })
})
