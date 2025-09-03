/**
 * 用户协作和数据同步服务
 * 处理多用户协作、数据共享和实时同步
 */

import { authService } from './AuthService'
import type { CalculationResult } from '@/types/calculator'

// 协作数据类型定义
export interface SharedCalculation {
  id: string
  title: string
  description?: string
  calculatorType: string
  inputData: Record<string, any>
  result: CalculationResult
  owner: {
    uid: string
    displayName: string
    email: string
  }
  collaborators: Collaborator[]
  permissions: SharePermissions
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  tags: string[]
  version: number
}

export interface Collaborator {
  uid: string
  displayName: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  addedAt: Date
  lastAccessAt?: Date
}

export interface SharePermissions {
  canView: boolean
  canEdit: boolean
  canComment: boolean
  canShare: boolean
  canDelete: boolean
}

export interface ShareLink {
  id: string
  calculationId: string
  token: string
  permissions: SharePermissions
  expiresAt?: Date
  createdAt: Date
  accessCount: number
  maxAccess?: number
}

export interface CollaborationComment {
  id: string
  calculationId: string
  author: {
    uid: string
    displayName: string
  }
  content: string
  createdAt: Date
  updatedAt?: Date
  isResolved: boolean
  replies: CollaborationComment[]
}

export interface UserWorkspace {
  id: string
  name: string
  description?: string
  owner: string
  members: WorkspaceMember[]
  calculations: string[] // calculation IDs
  settings: WorkspaceSettings
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMember {
  uid: string
  displayName: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: Date
  permissions: WorkspacePermissions
}

export interface WorkspacePermissions {
  canCreateCalculations: boolean
  canEditCalculations: boolean
  canDeleteCalculations: boolean
  canInviteMembers: boolean
  canManageMembers: boolean
  canManageSettings: boolean
}

export interface WorkspaceSettings {
  isPublic: boolean
  allowGuestAccess: boolean
  defaultCalculationPermissions: SharePermissions
  theme: 'light' | 'dark' | 'system'
  notifications: {
    newCalculations: boolean
    calculationUpdates: boolean
    comments: boolean
    memberActivity: boolean
  }
}

export class CollaborationService {
  private static instance: CollaborationService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private listeners: Map<string, Function[]> = new Map()
  private syncQueue: Map<string, any> = new Map()
  private isOnline = navigator.onLine

  private constructor() {
    this.setupNetworkListeners()
    this.setupPeriodicSync()
  }

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService()
    }
    return CollaborationService.instance
  }

  /**
   * 创建共享计算
   */
  public async createSharedCalculation(
    calculationData: Omit<SharedCalculation, 'id' | 'owner' | 'collaborators' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<SharedCalculation | null> {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }

    try {
      const response = await this.makeAuthenticatedRequest('/api/calculations', {
        method: 'POST',
        body: JSON.stringify({
          ...calculationData,
          owner: {
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email,
            email: currentUser.email
          }
        })
      })

      if (response.success) {
        this.emit('calculation:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建共享计算失败:', error)
      return null
    }
  }

  /**
   * 更新共享计算
   */
  public async updateSharedCalculation(
    calculationId: string,
    updates: Partial<SharedCalculation>
  ): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/calculations/${calculationId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })

      if (response.success) {
        this.emit('calculation:updated', response.data)
        return true
      }

      return false
    } catch (error) {
      console.error('更新共享计算失败:', error)
      
      // 离线时加入同步队列
      if (!this.isOnline) {
        this.syncQueue.set(`calculation_${calculationId}`, {
          type: 'update',
          id: calculationId,
          data: updates,
          timestamp: Date.now()
        })
      }
      
      return false
    }
  }

  /**
   * 获取用户的共享计算列表
   */
  public async getUserCalculations(): Promise<SharedCalculation[]> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/calculations')
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取用户计算列表失败:', error)
      return []
    }
  }

  /**
   * 获取特定共享计算
   */
  public async getSharedCalculation(calculationId: string): Promise<SharedCalculation | null> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/calculations/${calculationId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取共享计算失败:', error)
      return null
    }
  }

  /**
   * 添加协作者
   */
  public async addCollaborator(
    calculationId: string,
    email: string,
    role: Collaborator['role'] = 'viewer'
  ): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/calculations/${calculationId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ email, role })
      })

      if (response.success) {
        this.emit('collaborator:added', { calculationId, collaborator: response.data })
        return true
      }

      return false
    } catch (error) {
      console.error('添加协作者失败:', error)
      return false
    }
  }

  /**
   * 移除协作者
   */
  public async removeCollaborator(calculationId: string, uid: string): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/calculations/${calculationId}/collaborators/${uid}`,
        { method: 'DELETE' }
      )

      if (response.success) {
        this.emit('collaborator:removed', { calculationId, uid })
        return true
      }

      return false
    } catch (error) {
      console.error('移除协作者失败:', error)
      return false
    }
  }

  /**
   * 创建分享链接
   */
  public async createShareLink(
    calculationId: string,
    permissions: SharePermissions,
    options?: {
      expiresAt?: Date
      maxAccess?: number
    }
  ): Promise<ShareLink | null> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/calculations/${calculationId}/share`, {
        method: 'POST',
        body: JSON.stringify({
          permissions,
          ...options
        })
      })

      if (response.success) {
        this.emit('share:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建分享链接失败:', error)
      return null
    }
  }

  /**
   * 通过分享链接访问计算
   */
  public async accessSharedCalculation(token: string): Promise<SharedCalculation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shared/${token}`)
      const result = await response.json()

      if (result.success) {
        this.emit('share:accessed', result.data)
        return result.data
      }

      return null
    } catch (error) {
      console.error('访问分享计算失败:', error)
      return null
    }
  }

  /**
   * 添加评论
   */
  public async addComment(
    calculationId: string,
    content: string,
    parentId?: string
  ): Promise<CollaborationComment | null> {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) return null

    try {
      const response = await this.makeAuthenticatedRequest(`/api/calculations/${calculationId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          parentId,
          author: {
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email
          }
        })
      })

      if (response.success) {
        this.emit('comment:added', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('添加评论失败:', error)
      return null
    }
  }

  /**
   * 获取计算的评论
   */
  public async getComments(calculationId: string): Promise<CollaborationComment[]> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/calculations/${calculationId}/comments`)
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取评论失败:', error)
      return []
    }
  }

  /**
   * 创建工作空间
   */
  public async createWorkspace(
    name: string,
    description?: string,
    settings?: Partial<WorkspaceSettings>
  ): Promise<UserWorkspace | null> {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) return null

    try {
      const response = await this.makeAuthenticatedRequest('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          settings: {
            isPublic: false,
            allowGuestAccess: false,
            defaultCalculationPermissions: {
              canView: true,
              canEdit: false,
              canComment: true,
              canShare: false,
              canDelete: false
            },
            theme: 'system',
            notifications: {
              newCalculations: true,
              calculationUpdates: true,
              comments: true,
              memberActivity: false
            },
            ...settings
          }
        })
      })

      if (response.success) {
        this.emit('workspace:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建工作空间失败:', error)
      return null
    }
  }

  /**
   * 获取用户工作空间
   */
  public async getUserWorkspaces(): Promise<UserWorkspace[]> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/workspaces')
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取工作空间失败:', error)
      return []
    }
  }

  /**
   * 邀请成员到工作空间
   */
  public async inviteToWorkspace(
    workspaceId: string,
    email: string,
    role: WorkspaceMember['role'] = 'member'
  ): Promise<boolean> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email, role })
      })

      if (response.success) {
        this.emit('workspace:member_invited', { workspaceId, email, role })
        return true
      }

      return false
    } catch (error) {
      console.error('邀请成员失败:', error)
      return false
    }
  }

  /**
   * 实时同步数据
   */
  public async syncData(): Promise<void> {
    if (!this.isOnline || this.syncQueue.size === 0) return

    const syncPromises = Array.from(this.syncQueue.entries()).map(async ([key, item]) => {
      try {
        if (item.type === 'update') {
          await this.updateSharedCalculation(item.id, item.data)
        }
        this.syncQueue.delete(key)
      } catch (error) {
        console.error(`同步失败 ${key}:`, error)
      }
    })

    await Promise.allSettled(syncPromises)
    this.emit('sync:completed', { synced: syncPromises.length })
  }

  /**
   * 设置网络监听器
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.emit('network:online')
      this.syncData()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.emit('network:offline')
    })
  }

  /**
   * 设置定期同步
   */
  private setupPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline) {
        this.syncData()
      }
    }, 30000) // 每30秒同步一次
  }

  /**
   * 发起认证请求
   */
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = authService.getAccessToken()
    if (!token) {
      throw new Error('用户未认证')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })

    if (response.status === 401) {
      // 令牌过期，尝试刷新
      const refreshed = await authService.refreshToken()
      if (refreshed) {
        // 重试请求
        return this.makeAuthenticatedRequest(endpoint, options)
      } else {
        throw new Error('认证失败')
      }
    }

    return await response.json()
  }

  /**
   * 事件监听器管理
   */
  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  public off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.listeners.clear()
    this.syncQueue.clear()
  }
}

// 导出单例实例
export const collaborationService = CollaborationService.getInstance()
