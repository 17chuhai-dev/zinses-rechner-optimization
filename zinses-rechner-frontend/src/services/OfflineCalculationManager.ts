/**
 * 离线计算管理器
 * 提供完整的离线计算功能，包括数据缓存、计算队列、同步机制等
 */

import { ref, reactive } from 'vue'

// 离线计算任务接口
export interface OfflineCalculationTask {
  id: string
  type: 'compound-interest' | 'loan' | 'mortgage' | 'portfolio' | 'tax-optimization'
  inputData: Record<string, any>
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
  result?: any
  error?: string
  retryCount: number
  maxRetries: number
}

// 离线数据存储接口
export interface OfflineDataStore {
  calculations: OfflineCalculationTask[]
  cachedResults: Map<string, any>
  userPreferences: Record<string, any>
  lastSyncTime: Date | null
  syncQueue: Array<{
    id: string
    action: 'create' | 'update' | 'delete'
    data: any
    timestamp: Date
  }>
}

// 离线状态接口
export interface OfflineState {
  isOnline: boolean
  isProcessing: boolean
  pendingTasks: number
  completedTasks: number
  failedTasks: number
  lastCalculation: Date | null
  syncStatus: 'idle' | 'syncing' | 'error'
  storageUsage: number
  maxStorage: number
}

// 计算引擎接口
export interface CalculationEngine {
  calculateCompoundInterest(params: any): Promise<any>
  calculateLoan(params: any): Promise<any>
  calculateMortgage(params: any): Promise<any>
  calculatePortfolio(params: any): Promise<any>
  calculateTaxOptimization(params: any): Promise<any>
}

/**
 * 离线计算管理器类
 */
export class OfflineCalculationManager {
  private static instance: OfflineCalculationManager

  // 状态管理
  public readonly state = reactive<OfflineState>({
    isOnline: navigator.onLine,
    isProcessing: false,
    pendingTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    lastCalculation: null,
    syncStatus: 'idle',
    storageUsage: 0,
    maxStorage: 50 * 1024 * 1024 // 50MB
  })

  // 数据存储
  private dataStore: OfflineDataStore = {
    calculations: [],
    cachedResults: new Map(),
    userPreferences: {},
    lastSyncTime: null,
    syncQueue: []
  }

  // 计算引擎
  private calculationEngine: CalculationEngine

  // 处理队列
  private processingQueue: OfflineCalculationTask[] = []
  private isProcessingQueue = false

  // IndexedDB数据库
  private db: IDBDatabase | null = null
  private readonly DB_NAME = 'ZinsesRechnerOffline'
  private readonly DB_VERSION = 1

  private constructor() {
    this.calculationEngine = new LocalCalculationEngine()
    this.initializeOfflineSupport()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): OfflineCalculationManager {
    if (!OfflineCalculationManager.instance) {
      OfflineCalculationManager.instance = new OfflineCalculationManager()
    }
    return OfflineCalculationManager.instance
  }

  /**
   * 初始化离线支持
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🔄 初始化离线计算管理器...')

      // 初始化IndexedDB
      await this.initializeDatabase()

      // 加载离线数据
      await this.loadOfflineData()

      // 设置网络状态监听
      this.setupNetworkListeners()

      // 启动处理队列
      this.startProcessingQueue()

      // 检查存储使用情况
      await this.updateStorageUsage()

      console.log('✅ 离线计算管理器初始化完成')
    } catch (error) {
      console.error('❌ 离线计算管理器初始化失败:', error)
      throw error
    }
  }

  /**
   * 添加计算任务
   */
  public async addCalculationTask(
    type: OfflineCalculationTask['type'],
    inputData: Record<string, any>,
    priority: OfflineCalculationTask['priority'] = 'medium'
  ): Promise<string> {
    const task: OfflineCalculationTask = {
      id: this.generateTaskId(),
      type,
      inputData,
      priority,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    }

    // 添加到数据存储
    this.dataStore.calculations.push(task)
    this.processingQueue.push(task)

    // 保存到IndexedDB
    await this.saveTaskToDatabase(task)

    // 更新状态
    this.state.pendingTasks++
    this.updateStatistics()

    // 如果在线，立即处理
    if (this.state.isOnline && !this.isProcessingQueue) {
      this.processNextTask()
    }

    console.log(`📝 添加计算任务: ${task.id} (${type})`)
    return task.id
  }

  /**
   * 获取计算结果
   */
  public async getCalculationResult(taskId: string): Promise<any> {
    const task = this.dataStore.calculations.find(t => t.id === taskId)
    
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`)
    }

    if (task.status === 'completed') {
      return task.result
    }

    if (task.status === 'failed') {
      throw new Error(task.error || '计算失败')
    }

    if (task.status === 'pending' || task.status === 'processing') {
      // 等待任务完成
      return new Promise((resolve, reject) => {
        const checkStatus = () => {
          const updatedTask = this.dataStore.calculations.find(t => t.id === taskId)
          if (updatedTask?.status === 'completed') {
            resolve(updatedTask.result)
          } else if (updatedTask?.status === 'failed') {
            reject(new Error(updatedTask.error || '计算失败'))
          } else {
            setTimeout(checkStatus, 100)
          }
        }
        checkStatus()
      })
    }
  }

  /**
   * 立即计算（同步）
   */
  public async calculateImmediate(
    type: OfflineCalculationTask['type'],
    inputData: Record<string, any>
  ): Promise<any> {
    try {
      this.state.isProcessing = true

      // 检查缓存
      const cacheKey = this.generateCacheKey(type, inputData)
      if (this.dataStore.cachedResults.has(cacheKey)) {
        console.log('📋 使用缓存结果')
        return this.dataStore.cachedResults.get(cacheKey)
      }

      // 执行计算
      let result: any
      switch (type) {
        case 'compound-interest':
          result = await this.calculationEngine.calculateCompoundInterest(inputData)
          break
        case 'loan':
          result = await this.calculationEngine.calculateLoan(inputData)
          break
        case 'mortgage':
          result = await this.calculationEngine.calculateMortgage(inputData)
          break
        case 'portfolio':
          result = await this.calculationEngine.calculatePortfolio(inputData)
          break
        case 'tax-optimization':
          result = await this.calculationEngine.calculateTaxOptimization(inputData)
          break
        default:
          throw new Error(`不支持的计算类型: ${type}`)
      }

      // 缓存结果
      this.dataStore.cachedResults.set(cacheKey, result)
      await this.saveCacheToDatabase()

      // 更新状态
      this.state.lastCalculation = new Date()
      this.state.completedTasks++

      return result
    } catch (error) {
      console.error('计算失败:', error)
      this.state.failedTasks++
      throw error
    } finally {
      this.state.isProcessing = false
    }
  }

  /**
   * 同步数据
   */
  public async syncData(): Promise<void> {
    if (!this.state.isOnline) {
      console.warn('离线状态，无法同步数据')
      return
    }

    try {
      this.state.syncStatus = 'syncing'

      // 上传待同步的数据
      for (const item of this.dataStore.syncQueue) {
        await this.uploadSyncItem(item)
      }

      // 清空同步队列
      this.dataStore.syncQueue = []

      // 下载服务器数据
      await this.downloadServerData()

      // 更新同步时间
      this.dataStore.lastSyncTime = new Date()
      await this.saveMetadataToDatabase()

      this.state.syncStatus = 'idle'
      console.log('✅ 数据同步完成')
    } catch (error) {
      this.state.syncStatus = 'error'
      console.error('❌ 数据同步失败:', error)
      throw error
    }
  }

  /**
   * 清理过期数据
   */
  public async cleanupExpiredData(): Promise<void> {
    const now = new Date()
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30天

    // 清理过期任务
    const expiredTasks = this.dataStore.calculations.filter(
      task => now.getTime() - task.createdAt.getTime() > maxAge
    )

    for (const task of expiredTasks) {
      await this.deleteTaskFromDatabase(task.id)
    }

    this.dataStore.calculations = this.dataStore.calculations.filter(
      task => now.getTime() - task.createdAt.getTime() <= maxAge
    )

    // 清理过期缓存
    // 简化实现，实际应该检查缓存时间戳
    if (this.dataStore.cachedResults.size > 1000) {
      this.dataStore.cachedResults.clear()
      await this.clearCacheDatabase()
    }

    await this.updateStorageUsage()
    console.log(`🧹 清理了 ${expiredTasks.length} 个过期任务`)
  }

  /**
   * 获取离线统计
   */
  public getOfflineStatistics() {
    return {
      totalTasks: this.dataStore.calculations.length,
      pendingTasks: this.state.pendingTasks,
      completedTasks: this.state.completedTasks,
      failedTasks: this.state.failedTasks,
      cacheSize: this.dataStore.cachedResults.size,
      storageUsage: this.state.storageUsage,
      maxStorage: this.state.maxStorage,
      lastSync: this.dataStore.lastSyncTime,
      isOnline: this.state.isOnline
    }
  }

  // 私有方法

  /**
   * 初始化IndexedDB数据库
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' })
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * 加载离线数据
   */
  private async loadOfflineData(): Promise<void> {
    if (!this.db) return

    // 加载任务
    const tasks = await this.getAllFromStore('tasks')
    this.dataStore.calculations = tasks.map(task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined
    }))

    // 加载缓存
    const cacheItems = await this.getAllFromStore('cache')
    this.dataStore.cachedResults = new Map(
      cacheItems.map(item => [item.key, item.value])
    )

    // 加载元数据
    const metadata = await this.getFromStore('metadata', 'app')
    if (metadata) {
      this.dataStore.lastSyncTime = metadata.lastSyncTime ? new Date(metadata.lastSyncTime) : null
      this.dataStore.userPreferences = metadata.userPreferences || {}
    }

    this.updateStatistics()
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.state.isOnline = true
      console.log('🌐 网络已连接')
      this.processNextTask()
    })

    window.addEventListener('offline', () => {
      this.state.isOnline = false
      console.log('📴 网络已断开')
    })
  }

  /**
   * 启动处理队列
   */
  private startProcessingQueue(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.processingQueue.length > 0) {
        this.processNextTask()
      }
    }, 1000)
  }

  /**
   * 处理下一个任务
   */
  private async processNextTask(): Promise<void> {
    if (this.isProcessingQueue || this.processingQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    try {
      // 按优先级排序
      this.processingQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

      const task = this.processingQueue.shift()!
      task.status = 'processing'

      console.log(`⚙️ 处理任务: ${task.id}`)

      try {
        const result = await this.calculateImmediate(task.type, task.inputData)
        
        task.status = 'completed'
        task.result = result
        task.completedAt = new Date()
        
        this.state.pendingTasks--
        this.state.completedTasks++

        await this.saveTaskToDatabase(task)
      } catch (error) {
        task.retryCount++
        
        if (task.retryCount >= task.maxRetries) {
          task.status = 'failed'
          task.error = error instanceof Error ? error.message : '未知错误'
          this.state.pendingTasks--
          this.state.failedTasks++
        } else {
          task.status = 'pending'
          this.processingQueue.push(task) // 重新加入队列
        }

        await this.saveTaskToDatabase(task)
      }
    } finally {
      this.isProcessingQueue = false
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(type: string, inputData: Record<string, any>): string {
    const dataString = JSON.stringify(inputData, Object.keys(inputData).sort())
    return `${type}_${btoa(dataString)}`
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(): void {
    this.state.pendingTasks = this.dataStore.calculations.filter(t => t.status === 'pending').length
    this.state.completedTasks = this.dataStore.calculations.filter(t => t.status === 'completed').length
    this.state.failedTasks = this.dataStore.calculations.filter(t => t.status === 'failed').length
  }

  /**
   * 更新存储使用情况
   */
  private async updateStorageUsage(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        this.state.storageUsage = estimate.usage || 0
      } catch (error) {
        console.warn('无法获取存储使用情况:', error)
      }
    }
  }

  // IndexedDB操作方法
  private async saveTaskToDatabase(task: OfflineCalculationTask): Promise<void> {
    if (!this.db) return
    
    const transaction = this.db.transaction(['tasks'], 'readwrite')
    const store = transaction.objectStore('tasks')
    await new Promise((resolve, reject) => {
      const request = store.put(task)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async deleteTaskFromDatabase(taskId: string): Promise<void> {
    if (!this.db) return
    
    const transaction = this.db.transaction(['tasks'], 'readwrite')
    const store = transaction.objectStore('tasks')
    await new Promise((resolve, reject) => {
      const request = store.delete(taskId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async saveCacheToDatabase(): Promise<void> {
    if (!this.db) return
    
    const transaction = this.db.transaction(['cache'], 'readwrite')
    const store = transaction.objectStore('cache')
    
    for (const [key, value] of this.dataStore.cachedResults) {
      await new Promise((resolve, reject) => {
        const request = store.put({ key, value, timestamp: Date.now() })
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }
  }

  private async clearCacheDatabase(): Promise<void> {
    if (!this.db) return
    
    const transaction = this.db.transaction(['cache'], 'readwrite')
    const store = transaction.objectStore('cache')
    await new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async saveMetadataToDatabase(): Promise<void> {
    if (!this.db) return
    
    const transaction = this.db.transaction(['metadata'], 'readwrite')
    const store = transaction.objectStore('metadata')
    await new Promise((resolve, reject) => {
      const request = store.put({
        key: 'app',
        lastSyncTime: this.dataStore.lastSyncTime,
        userPreferences: this.dataStore.userPreferences
      })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async getAllFromStore(storeName: string): Promise<any[]> {
    if (!this.db) return []
    
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async getFromStore(storeName: string, key: string): Promise<any> {
    if (!this.db) return null
    
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 同步相关方法（简化实现）
  private async uploadSyncItem(item: any): Promise<void> {
    // 实际实现应该调用API上传数据
    console.log('上传同步项目:', item)
  }

  private async downloadServerData(): Promise<void> {
    // 实际实现应该从服务器下载数据
    console.log('下载服务器数据')
  }
}

/**
 * 本地计算引擎实现
 */
class LocalCalculationEngine implements CalculationEngine {
  async calculateCompoundInterest(params: any): Promise<any> {
    const { initialAmount, monthlyPayment, interestRate, years } = params
    
    const monthlyRate = interestRate / 100 / 12
    const totalMonths = years * 12
    
    let balance = initialAmount
    const yearlyData = []
    
    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + (monthlyPayment || 0)
      }
      
      yearlyData.push({
        year,
        balance: Math.round(balance * 100) / 100,
        totalPaid: initialAmount + (monthlyPayment || 0) * year * 12,
        interest: Math.round((balance - initialAmount - (monthlyPayment || 0) * year * 12) * 100) / 100
      })
    }
    
    return {
      finalAmount: Math.round(balance * 100) / 100,
      totalInterest: Math.round((balance - initialAmount - (monthlyPayment || 0) * totalMonths) * 100) / 100,
      yearlyData,
      calculatedAt: new Date()
    }
  }

  async calculateLoan(params: any): Promise<any> {
    // 简化的贷款计算实现
    const { loanAmount, interestRate, years } = params
    const monthlyRate = interestRate / 100 / 12
    const totalMonths = years * 12
    
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                          (Math.pow(1 + monthlyRate, totalMonths) - 1)
    
    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(monthlyPayment * totalMonths * 100) / 100,
      totalInterest: Math.round((monthlyPayment * totalMonths - loanAmount) * 100) / 100,
      calculatedAt: new Date()
    }
  }

  async calculateMortgage(params: any): Promise<any> {
    // 简化的房贷计算实现
    return this.calculateLoan(params)
  }

  async calculatePortfolio(params: any): Promise<any> {
    // 简化的投资组合计算实现
    const { investments, expectedReturn, years } = params
    const totalInvestment = investments.reduce((sum: number, inv: any) => sum + inv.amount, 0)
    const avgReturn = expectedReturn / 100
    
    const futureValue = totalInvestment * Math.pow(1 + avgReturn, years)
    
    return {
      currentValue: totalInvestment,
      futureValue: Math.round(futureValue * 100) / 100,
      totalGain: Math.round((futureValue - totalInvestment) * 100) / 100,
      calculatedAt: new Date()
    }
  }

  async calculateTaxOptimization(params: any): Promise<any> {
    // 简化的税务优化计算实现
    const { income, deductions, taxRate } = params
    const taxableIncome = Math.max(0, income - deductions)
    const tax = taxableIncome * (taxRate / 100)
    
    return {
      taxableIncome,
      tax: Math.round(tax * 100) / 100,
      afterTaxIncome: Math.round((income - tax) * 100) / 100,
      savings: Math.round(deductions * (taxRate / 100) * 100) / 100,
      calculatedAt: new Date()
    }
  }
}

// 导出单例实例
export const offlineCalculationManager = OfflineCalculationManager.getInstance()

// 导出便捷的composable
export function useOfflineCalculation() {
  const manager = OfflineCalculationManager.getInstance()
  
  return {
    // 状态
    state: manager.state,
    
    // 方法
    initialize: manager.initialize.bind(manager),
    addCalculationTask: manager.addCalculationTask.bind(manager),
    getCalculationResult: manager.getCalculationResult.bind(manager),
    calculateImmediate: manager.calculateImmediate.bind(manager),
    syncData: manager.syncData.bind(manager),
    cleanupExpiredData: manager.cleanupExpiredData.bind(manager),
    getOfflineStatistics: manager.getOfflineStatistics.bind(manager)
  }
}
