/**
 * 用户管理系统
 * 实现用户注册、登录、权限管理和协作功能
 */

import { ref, reactive } from 'vue'

// 用户接口
export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'user' | 'premium' | 'admin'
  preferences: UserPreferences
  subscription: UserSubscription
  createdAt: Date
  lastLoginAt: Date
  isActive: boolean
  isVerified: boolean
}

// 用户偏好设置
export interface UserPreferences {
  language: string
  theme: 'light' | 'dark' | 'auto'
  currency: string
  dateFormat: string
  numberFormat: string
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
  }
  privacy: {
    shareCalculations: boolean
    allowCollaboration: boolean
    publicProfile: boolean
  }
}

// 用户订阅信息
export interface UserSubscription {
  plan: 'free' | 'basic' | 'premium' | 'enterprise'
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  startDate: Date
  endDate?: Date
  features: string[]
  limits: {
    calculations: number
    exports: number
    collaborators: number
    storage: number // MB
  }
}

// 协作项目接口
export interface CollaborationProject {
  id: string
  name: string
  description: string
  ownerId: string
  members: ProjectMember[]
  calculations: string[]
  settings: ProjectSettings
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// 项目成员接口
export interface ProjectMember {
  userId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  permissions: string[]
  joinedAt: Date
  lastActiveAt: Date
}

// 项目设置接口
export interface ProjectSettings {
  visibility: 'private' | 'team' | 'public'
  allowComments: boolean
  allowEditing: boolean
  requireApproval: boolean
  notifications: boolean
  autoSave: boolean
}

// 用户会话接口
export interface UserSession {
  token: string
  refreshToken: string
  expiresAt: Date
  user: User
}

/**
 * 用户管理器类
 */
export class UserManager {
  private static instance: UserManager

  // 当前用户状态
  public readonly currentUser = ref<User | null>(null)
  public readonly isAuthenticated = ref(false)
  public readonly isLoading = ref(false)

  // 用户会话
  private session = ref<UserSession | null>(null)

  // 协作项目
  public readonly collaborationProjects = reactive<CollaborationProject[]>([])
  public readonly activeProject = ref<CollaborationProject | null>(null)

  // 统计信息
  public readonly stats = reactive({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalCalculations: 0,
    collaborationRate: 0
  })

  // API配置
  private apiConfig = {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 10000,
    retries: 3
  }

  public static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager()
    }
    return UserManager.instance
  }

  constructor() {
    this.initializeAuth()
    console.log('👤 User Manager initialized')
  }

  /**
   * 用户注册
   */
  public async register(userData: {
    email: string
    password: string
    username: string
    firstName: string
    lastName: string
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    this.isLoading.value = true

    try {
      // 验证输入数据
      const validation = this.validateRegistrationData(userData)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // 模拟API调用
      const response = await this.apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      if (response.success) {
        const user = this.createUserFromResponse(response.data)
        await this.setCurrentUser(user)

        return { success: true, user }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Registration failed:', error)
      return { success: false, error: 'Registrierung fehlgeschlagen' }
    } finally {
      this.isLoading.value = false
    }
  }

  /**
   * 用户登录
   */
  public async login(credentials: {
    email: string
    password: string
    rememberMe?: boolean
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    this.isLoading.value = true

    try {
      // 模拟API调用
      const response = await this.apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      })

      if (response.success) {
        const session: UserSession = {
          token: response.data.token,
          refreshToken: response.data.refreshToken,
          expiresAt: new Date(response.data.expiresAt),
          user: this.createUserFromResponse(response.data.user)
        }

        await this.setSession(session)

        return { success: true, user: session.user }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Anmeldung fehlgeschlagen' }
    } finally {
      this.isLoading.value = false
    }
  }

  /**
   * 用户登出
   */
  public async logout(): Promise<void> {
    try {
      if (this.session.value) {
        await this.apiCall('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.session.value.token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      await this.clearSession()
    }
  }

  /**
   * 刷新访问令牌
   */
  public async refreshToken(): Promise<boolean> {
    if (!this.session.value?.refreshToken) {
      return false
    }

    try {
      const response = await this.apiCall('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: this.session.value.refreshToken
        })
      })

      if (response.success) {
        this.session.value.token = response.data.token
        this.session.value.expiresAt = new Date(response.data.expiresAt)

        // 保存到本地存储
        this.saveSessionToStorage(this.session.value)

        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }

    return false
  }

  /**
   * 更新用户资料
   */
  public async updateProfile(updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser.value) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    try {
      const response = await this.apiCall('/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.session.value?.token}`
        },
        body: JSON.stringify(updates)
      })

      if (response.success) {
        // 更新本地用户数据
        Object.assign(this.currentUser.value, updates)

        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      return { success: false, error: 'Profil-Update fehlgeschlagen' }
    }
  }

  /**
   * 创建协作项目
   */
  public async createProject(projectData: {
    name: string
    description: string
    settings: Partial<ProjectSettings>
  }): Promise<{ success: boolean; project?: CollaborationProject; error?: string }> {
    if (!this.currentUser.value) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    try {
      const response = await this.apiCall('/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.session.value?.token}`
        },
        body: JSON.stringify(projectData)
      })

      if (response.success) {
        const project = this.createProjectFromResponse(response.data)
        this.collaborationProjects.push(project)

        return { success: true, project }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Project creation failed:', error)
      return { success: false, error: 'Projekt-Erstellung fehlgeschlagen' }
    }
  }

  /**
   * 邀请用户加入项目
   */
  public async inviteToProject(
    projectId: string,
    email: string,
    role: ProjectMember['role']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall(`/projects/${projectId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.session.value?.token}`
        },
        body: JSON.stringify({ email, role })
      })

      if (response.success) {
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Project invitation failed:', error)
      return { success: false, error: 'Einladung fehlgeschlagen' }
    }
  }

  /**
   * 获取用户的协作项目
   */
  public async loadUserProjects(): Promise<void> {
    if (!this.currentUser.value) return

    try {
      const response = await this.apiCall('/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.session.value?.token}`
        }
      })

      if (response.success) {
        this.collaborationProjects.splice(0)
        response.data.forEach((projectData: any) => {
          const project = this.createProjectFromResponse(projectData)
          this.collaborationProjects.push(project)
        })
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  /**
   * 设置活动项目
   */
  public setActiveProject(project: CollaborationProject | null): void {
    this.activeProject.value = project
  }

  /**
   * 检查用户权限
   */
  public hasPermission(permission: string, projectId?: string): boolean {
    if (!this.currentUser.value) return false

    // 管理员拥有所有权限
    if (this.currentUser.value.role === 'admin') return true

    // 项目级权限检查
    if (projectId && this.activeProject.value?.id === projectId) {
      const member = this.activeProject.value.members.find(
        m => m.userId === this.currentUser.value!.id
      )
      return member?.permissions.includes(permission) || false
    }

    // 用户级权限检查
    const userPermissions = this.getUserPermissions(this.currentUser.value.role)
    return userPermissions.includes(permission)
  }

  /**
   * 获取用户统计信息
   */
  public async loadUserStats(): Promise<void> {
    try {
      const response = await this.apiCall('/stats/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.session.value?.token}`
        }
      })

      if (response.success) {
        Object.assign(this.stats, response.data)
      }
    } catch (error) {
      console.error('Failed to load user stats:', error)
    }
  }

  // 私有方法

  /**
   * 初始化认证状态
   */
  private async initializeAuth(): Promise<void> {
    try {
      const savedSession = this.loadSessionFromStorage()
      if (savedSession && this.isSessionValid(savedSession)) {
        await this.setSession(savedSession)
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      await this.clearSession()
    }
  }

  /**
   * 设置当前用户
   */
  private async setCurrentUser(user: User): Promise<void> {
    this.currentUser.value = user
    this.isAuthenticated.value = true

    // 加载用户项目
    await this.loadUserProjects()
  }

  /**
   * 设置用户会话
   */
  private async setSession(session: UserSession): Promise<void> {
    this.session.value = session
    await this.setCurrentUser(session.user)
    this.saveSessionToStorage(session)
  }

  /**
   * 清除用户会话
   */
  private async clearSession(): Promise<void> {
    this.session.value = null
    this.currentUser.value = null
    this.isAuthenticated.value = false
    this.collaborationProjects.splice(0)
    this.activeProject.value = null
    this.clearSessionFromStorage()
  }

  /**
   * 验证注册数据
   */
  private validateRegistrationData(data: any): { valid: boolean; error?: string } {
    if (!data.email || !this.isValidEmail(data.email)) {
      return { valid: false, error: 'Ungültige E-Mail-Adresse' }
    }

    if (!data.password || data.password.length < 8) {
      return { valid: false, error: 'Passwort muss mindestens 8 Zeichen lang sein' }
    }

    if (!data.username || data.username.length < 3) {
      return { valid: false, error: 'Benutzername muss mindestens 3 Zeichen lang sein' }
    }

    return { valid: true }
  }

  /**
   * 验证邮箱格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * API调用封装
   */
  private async apiCall(endpoint: string, options: RequestInit): Promise<any> {
    const url = `${this.apiConfig.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: this.apiConfig.timeout
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 从响应创建用户对象
   */
  private createUserFromResponse(data: any): User {
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: data.avatar,
      role: data.role || 'user',
      preferences: data.preferences || this.getDefaultPreferences(),
      subscription: data.subscription || this.getDefaultSubscription(),
      createdAt: new Date(data.createdAt),
      lastLoginAt: new Date(data.lastLoginAt || Date.now()),
      isActive: data.isActive !== false,
      isVerified: data.isVerified || false
    }
  }

  /**
   * 从响应创建项目对象
   */
  private createProjectFromResponse(data: any): CollaborationProject {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
      members: data.members || [],
      calculations: data.calculations || [],
      settings: data.settings || this.getDefaultProjectSettings(),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      isActive: data.isActive !== false
    }
  }

  /**
   * 获取默认用户偏好
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'de',
      theme: 'auto',
      currency: 'EUR',
      dateFormat: 'DD.MM.YYYY',
      numberFormat: 'de-DE',
      notifications: {
        email: true,
        push: true,
        marketing: false
      },
      privacy: {
        shareCalculations: false,
        allowCollaboration: true,
        publicProfile: false
      }
    }
  }

  /**
   * 获取默认订阅信息
   */
  private getDefaultSubscription(): UserSubscription {
    return {
      plan: 'free',
      status: 'active',
      startDate: new Date(),
      features: ['basic_calculations', 'export_png'],
      limits: {
        calculations: 10,
        exports: 5,
        collaborators: 1,
        storage: 10
      }
    }
  }

  /**
   * 获取默认项目设置
   */
  private getDefaultProjectSettings(): ProjectSettings {
    return {
      visibility: 'private',
      allowComments: true,
      allowEditing: true,
      requireApproval: false,
      notifications: true,
      autoSave: true
    }
  }

  /**
   * 获取用户权限列表
   */
  private getUserPermissions(role: User['role']): string[] {
    const permissions = {
      user: ['view_calculations', 'create_calculations', 'export_basic'],
      premium: ['view_calculations', 'create_calculations', 'export_all', 'collaborate', 'advanced_features'],
      admin: ['*'] // 所有权限
    }

    return permissions[role] || permissions.user
  }

  /**
   * 检查会话是否有效
   */
  private isSessionValid(session: UserSession): boolean {
    return session.expiresAt > new Date()
  }

  /**
   * 保存会话到本地存储
   */
  private saveSessionToStorage(session: UserSession): void {
    try {
      localStorage.setItem('user_session', JSON.stringify({
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt.toISOString(),
        user: session.user
      }))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  /**
   * 从本地存储加载会话
   */
  private loadSessionFromStorage(): UserSession | null {
    try {
      const saved = localStorage.getItem('user_session')
      if (saved) {
        const data = JSON.parse(saved)
        return {
          token: data.token,
          refreshToken: data.refreshToken,
          expiresAt: new Date(data.expiresAt),
          user: data.user
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
    return null
  }

  /**
   * 清除本地存储的会话
   */
  private clearSessionFromStorage(): void {
    try {
      localStorage.removeItem('user_session')
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }
}

// 导出单例实例
export const userManager = UserManager.getInstance()

// 便捷的组合式API
export function useUserManager() {
  const manager = UserManager.getInstance()

  return {
    // 状态
    currentUser: manager.currentUser,
    isAuthenticated: manager.isAuthenticated,
    isLoading: manager.isLoading,
    collaborationProjects: manager.collaborationProjects,
    activeProject: manager.activeProject,
    stats: manager.stats,

    // 方法
    register: manager.register.bind(manager),
    login: manager.login.bind(manager),
    logout: manager.logout.bind(manager),
    refreshToken: manager.refreshToken.bind(manager),
    updateProfile: manager.updateProfile.bind(manager),
    createProject: manager.createProject.bind(manager),
    inviteToProject: manager.inviteToProject.bind(manager),
    loadUserProjects: manager.loadUserProjects.bind(manager),
    setActiveProject: manager.setActiveProject.bind(manager),
    hasPermission: manager.hasPermission.bind(manager),
    loadUserStats: manager.loadUserStats.bind(manager)
  }
}
