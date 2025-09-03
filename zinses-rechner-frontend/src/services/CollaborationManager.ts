/**
 * 协作管理器
 * 实现实时协作、数据同步、权限管理等功能
 */

import { ref, reactive } from 'vue'
import { userManager } from './UserManager'
import type { CollaborationProject, ProjectMember, User } from './UserManager'

// 协作会话接口
export interface CollaborationSession {
  id: string
  projectId: string
  participants: SessionParticipant[]
  activeCalculation?: string
  startedAt: Date
  lastActivity: Date
  isActive: boolean
}

// 会话参与者接口
export interface SessionParticipant {
  userId: string
  username: string
  avatar?: string
  role: ProjectMember['role']
  joinedAt: Date
  lastSeen: Date
  isOnline: boolean
  cursor?: {
    x: number
    y: number
    element?: string
  }
}

// 协作事件接口
export interface CollaborationEvent {
  id: string
  type: 'calculation_update' | 'comment_added' | 'user_joined' | 'user_left' | 'cursor_move' | 'selection_change'
  userId: string
  projectId: string
  data: any
  timestamp: Date
}

// 实时评论接口
export interface RealtimeComment {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  elementId?: string
  position?: { x: number; y: number }
  replies: RealtimeComment[]
  createdAt: Date
  updatedAt: Date
  isResolved: boolean
}

// 数据同步状态接口
export interface SyncStatus {
  isConnected: boolean
  lastSync: Date
  pendingChanges: number
  conflictCount: number
  syncProgress: number
}

/**
 * 协作管理器类
 */
export class CollaborationManager {
  private static instance: CollaborationManager

  // WebSocket连接
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  // 协作状态
  public readonly currentSession = ref<CollaborationSession | null>(null)
  public readonly isConnected = ref(false)
  public readonly syncStatus = reactive<SyncStatus>({
    isConnected: false,
    lastSync: new Date(),
    pendingChanges: 0,
    conflictCount: 0,
    syncProgress: 100
  })

  // 实时数据
  public readonly onlineUsers = reactive<SessionParticipant[]>([])
  public readonly realtimeComments = reactive<RealtimeComment[]>([])
  public readonly collaborationEvents = reactive<CollaborationEvent[]>([])

  // 本地缓存
  private pendingChanges = new Map<string, any>()
  private eventQueue: CollaborationEvent[] = []

  // 配置
  private config = {
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8001',
    heartbeatInterval: 30000,
    syncInterval: 5000,
    maxEventHistory: 100
  }

  public static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager()
    }
    return CollaborationManager.instance
  }

  constructor() {
    this.initializeEventListeners()
    console.log('🤝 Collaboration Manager initialized')
  }

  /**
   * 加入协作会话
   */
  public async joinSession(projectId: string): Promise<{ success: boolean; error?: string }> {
    if (!userManager.currentUser.value) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    try {
      // 建立WebSocket连接
      await this.connectWebSocket()

      // 发送加入会话请求
      const joinMessage = {
        type: 'join_session',
        projectId,
        userId: userManager.currentUser.value.id,
        timestamp: new Date().toISOString()
      }

      this.sendMessage(joinMessage)

      return { success: true }
    } catch (error) {
      console.error('Failed to join collaboration session:', error)
      return { success: false, error: 'Verbindung zur Kollaboration fehlgeschlagen' }
    }
  }

  /**
   * 离开协作会话
   */
  public async leaveSession(): Promise<void> {
    if (this.currentSession.value) {
      const leaveMessage = {
        type: 'leave_session',
        projectId: this.currentSession.value.projectId,
        userId: userManager.currentUser.value?.id,
        timestamp: new Date().toISOString()
      }

      this.sendMessage(leaveMessage)
    }

    this.currentSession.value = null
    this.onlineUsers.splice(0)
    this.disconnectWebSocket()
  }

  /**
   * 发送计算更新
   */
  public broadcastCalculationUpdate(calculationData: any): void {
    if (!this.currentSession.value) return

    const event: CollaborationEvent = {
      id: `calc-${Date.now()}`,
      type: 'calculation_update',
      userId: userManager.currentUser.value!.id,
      projectId: this.currentSession.value.projectId,
      data: calculationData,
      timestamp: new Date()
    }

    this.sendEvent(event)
    this.addToEventHistory(event)
  }

  /**
   * 添加实时评论
   */
  public async addComment(
    content: string,
    elementId?: string,
    position?: { x: number; y: number }
  ): Promise<{ success: boolean; comment?: RealtimeComment; error?: string }> {
    if (!this.currentSession.value || !userManager.currentUser.value) {
      return { success: false, error: 'Keine aktive Kollaboration' }
    }

    try {
      const comment: RealtimeComment = {
        id: `comment-${Date.now()}`,
        userId: userManager.currentUser.value.id,
        username: userManager.currentUser.value.username,
        avatar: userManager.currentUser.value.avatar,
        content,
        elementId,
        position,
        replies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isResolved: false
      }

      // 发送评论事件
      const event: CollaborationEvent = {
        id: `comment-event-${Date.now()}`,
        type: 'comment_added',
        userId: userManager.currentUser.value.id,
        projectId: this.currentSession.value.projectId,
        data: comment,
        timestamp: new Date()
      }

      this.sendEvent(event)
      this.realtimeComments.push(comment)

      return { success: true, comment }
    } catch (error) {
      console.error('Failed to add comment:', error)
      return { success: false, error: 'Kommentar konnte nicht hinzugefügt werden' }
    }
  }

  /**
   * 更新用户光标位置
   */
  public updateCursorPosition(x: number, y: number, element?: string): void {
    if (!this.currentSession.value || !userManager.currentUser.value) return

    const cursorUpdate = {
      type: 'cursor_move',
      projectId: this.currentSession.value.projectId,
      userId: userManager.currentUser.value.id,
      data: { x, y, element },
      timestamp: new Date().toISOString()
    }

    this.sendMessage(cursorUpdate)
  }

  /**
   * 同步本地更改
   */
  public async syncChanges(): Promise<void> {
    if (this.pendingChanges.size === 0) return

    this.syncStatus.syncProgress = 0

    try {
      const changes = Array.from(this.pendingChanges.entries())
      const totalChanges = changes.length

      for (let i = 0; i < changes.length; i++) {
        const [changeId, changeData] = changes[i]

        await this.syncSingleChange(changeId, changeData)
        this.pendingChanges.delete(changeId)

        this.syncStatus.syncProgress = ((i + 1) / totalChanges) * 100
      }

      this.syncStatus.lastSync = new Date()
      this.syncStatus.pendingChanges = 0
    } catch (error) {
      console.error('Sync failed:', error)
      this.syncStatus.conflictCount++
    } finally {
      this.syncStatus.syncProgress = 100
    }
  }

  /**
   * 解决同步冲突
   */
  public async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const conflictMessage = {
        type: 'resolve_conflict',
        conflictId,
        resolution,
        userId: userManager.currentUser.value?.id,
        timestamp: new Date().toISOString()
      }

      this.sendMessage(conflictMessage)
      this.syncStatus.conflictCount = Math.max(0, this.syncStatus.conflictCount - 1)

      return { success: true }
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      return { success: false, error: 'Konflikt konnte nicht gelöst werden' }
    }
  }

  /**
   * 获取协作历史
   */
  public getCollaborationHistory(limit: number = 50): CollaborationEvent[] {
    return this.collaborationEvents
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * 检查用户是否在线
   */
  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.some(user => user.userId === userId && user.isOnline)
  }

  /**
   * 获取在线用户数量
   */
  public getOnlineUserCount(): number {
    return this.onlineUsers.filter(user => user.isOnline).length
  }

  // 私有方法

  /**
   * 建立WebSocket连接
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = userManager.currentUser.value ? 'valid-token' : null
        this.ws = new WebSocket(`${this.config.wsUrl}?token=${token}`)

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected')
          this.isConnected.value = true
          this.syncStatus.isConnected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleWebSocketMessage(event)
        }

        this.ws.onclose = () => {
          console.log('❌ WebSocket disconnected')
          this.isConnected.value = false
          this.syncStatus.isConnected = false
          this.stopHeartbeat()
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开WebSocket连接
   */
  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected.value = false
    this.syncStatus.isConnected = false
    this.stopHeartbeat()
  }

  /**
   * 处理WebSocket消息
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data)

      switch (message.type) {
        case 'session_joined':
          this.handleSessionJoined(message.data)
          break
        case 'user_joined':
          this.handleUserJoined(message.data)
          break
        case 'user_left':
          this.handleUserLeft(message.data)
          break
        case 'calculation_update':
          this.handleCalculationUpdate(message.data)
          break
        case 'comment_added':
          this.handleCommentAdded(message.data)
          break
        case 'cursor_move':
          this.handleCursorMove(message.data)
          break
        case 'sync_conflict':
          this.handleSyncConflict(message.data)
          break
        default:
          console.log('Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  /**
   * 发送WebSocket消息
   */
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // 添加到队列，等待连接恢复
      this.eventQueue.push(message)
    }
  }

  /**
   * 发送协作事件
   */
  private sendEvent(event: CollaborationEvent): void {
    this.sendMessage({
      type: 'collaboration_event',
      event
    })
  }

  /**
   * 处理会话加入
   */
  private handleSessionJoined(data: any): void {
    this.currentSession.value = {
      id: data.sessionId,
      projectId: data.projectId,
      participants: data.participants || [],
      startedAt: new Date(data.startedAt),
      lastActivity: new Date(),
      isActive: true
    }

    // 更新在线用户列表
    this.onlineUsers.splice(0)
    data.participants?.forEach((participant: any) => {
      this.onlineUsers.push({
        ...participant,
        joinedAt: new Date(participant.joinedAt),
        lastSeen: new Date(participant.lastSeen),
        isOnline: true
      })
    })
  }

  /**
   * 处理用户加入
   */
  private handleUserJoined(data: any): void {
    const participant: SessionParticipant = {
      userId: data.userId,
      username: data.username,
      avatar: data.avatar,
      role: data.role,
      joinedAt: new Date(),
      lastSeen: new Date(),
      isOnline: true
    }

    this.onlineUsers.push(participant)

    // 添加到事件历史
    this.addToEventHistory({
      id: `user-joined-${Date.now()}`,
      type: 'user_joined',
      userId: data.userId,
      projectId: this.currentSession.value?.projectId || '',
      data: participant,
      timestamp: new Date()
    })
  }

  /**
   * 处理用户离开
   */
  private handleUserLeft(data: any): void {
    const index = this.onlineUsers.findIndex(user => user.userId === data.userId)
    if (index !== -1) {
      this.onlineUsers.splice(index, 1)
    }

    // 添加到事件历史
    this.addToEventHistory({
      id: `user-left-${Date.now()}`,
      type: 'user_left',
      userId: data.userId,
      projectId: this.currentSession.value?.projectId || '',
      data: { userId: data.userId },
      timestamp: new Date()
    })
  }

  /**
   * 处理计算更新
   */
  private handleCalculationUpdate(data: any): void {
    // 触发计算更新事件
    window.dispatchEvent(new CustomEvent('collaboration:calculation-update', {
      detail: data
    }))

    this.addToEventHistory({
      id: data.eventId,
      type: 'calculation_update',
      userId: data.userId,
      projectId: data.projectId,
      data: data.calculationData,
      timestamp: new Date(data.timestamp)
    })
  }

  /**
   * 处理评论添加
   */
  private handleCommentAdded(data: any): void {
    const comment: RealtimeComment = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    }

    this.realtimeComments.push(comment)
  }

  /**
   * 处理光标移动
   */
  private handleCursorMove(data: any): void {
    const user = this.onlineUsers.find(u => u.userId === data.userId)
    if (user) {
      user.cursor = data.cursor
      user.lastSeen = new Date()
    }
  }

  /**
   * 处理同步冲突
   */
  private handleSyncConflict(data: any): void {
    this.syncStatus.conflictCount++

    // 触发冲突解决事件
    window.dispatchEvent(new CustomEvent('collaboration:sync-conflict', {
      detail: data
    }))
  }

  /**
   * 同步单个更改
   */
  private async syncSingleChange(changeId: string, changeData: any): Promise<void> {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Synced change ${changeId}:`, changeData)
        resolve()
      }, 100)
    })
  }

  /**
   * 添加到事件历史
   */
  private addToEventHistory(event: CollaborationEvent): void {
    this.collaborationEvents.push(event)

    // 保持历史记录在合理范围内
    if (this.collaborationEvents.length > this.config.maxEventHistory) {
      this.collaborationEvents.splice(0, this.collaborationEvents.length - this.config.maxEventHistory)
    }
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听页面关闭事件
    window.addEventListener('beforeunload', () => {
      this.leaveSession()
    })

    // 监听网络状态变化
    window.addEventListener('online', () => {
      if (!this.isConnected.value) {
        this.attemptReconnect()
      }
    })

    window.addEventListener('offline', () => {
      this.syncStatus.isConnected = false
    })
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connectWebSocket().catch(() => {
        this.attemptReconnect()
      })
    }, delay)
  }

  /**
   * 开始心跳
   */
  private heartbeatInterval: number | null = null

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping' })
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

// 导出单例实例
export const collaborationManager = CollaborationManager.getInstance()

// 便捷的组合式API
export function useCollaboration() {
  const manager = CollaborationManager.getInstance()

  return {
    // 状态
    currentSession: manager.currentSession,
    isConnected: manager.isConnected,
    syncStatus: manager.syncStatus,
    onlineUsers: manager.onlineUsers,
    realtimeComments: manager.realtimeComments,
    collaborationEvents: manager.collaborationEvents,

    // 方法
    joinSession: manager.joinSession.bind(manager),
    leaveSession: manager.leaveSession.bind(manager),
    broadcastCalculationUpdate: manager.broadcastCalculationUpdate.bind(manager),
    addComment: manager.addComment.bind(manager),
    updateCursorPosition: manager.updateCursorPosition.bind(manager),
    syncChanges: manager.syncChanges.bind(manager),
    resolveConflict: manager.resolveConflict.bind(manager),
    getCollaborationHistory: manager.getCollaborationHistory.bind(manager),
    isUserOnline: manager.isUserOnline.bind(manager),
    getOnlineUserCount: manager.getOnlineUserCount.bind(manager)
  }
}
