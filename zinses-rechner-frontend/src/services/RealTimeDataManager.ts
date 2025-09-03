/**
 * 实时数据管理器
 * 集成实时金融数据API，提供实时利率、汇率、股价等数据
 */

import { ref, reactive } from 'vue'

// 数据源类型枚举
export type DataSourceType = 'bundesbank' | 'ecb' | 'yahoo' | 'alpha_vantage' | 'fixer' | 'exchangerate'

// 数据类型枚举
export type DataType = 'interest_rate' | 'exchange_rate' | 'stock_price' | 'bond_yield' | 'inflation_rate' | 'commodity_price'

// 实时数据接口
export interface RealTimeData {
  id: string
  type: DataType
  source: DataSourceType
  symbol: string
  name: string
  value: number
  currency?: string
  unit?: string
  timestamp: Date
  change?: number
  changePercent?: number
  previousValue?: number
  metadata?: Record<string, any>
}

// 数据订阅接口
export interface DataSubscription {
  id: string
  type: DataType
  symbol: string
  source: DataSourceType
  interval: number // 更新间隔（毫秒）
  callback: (data: RealTimeData) => void
  isActive: boolean
  lastUpdate: Date
  errorCount: number
}

// API配置接口
export interface APIConfig {
  source: DataSourceType
  baseUrl: string
  apiKey?: string
  rateLimit: number // 每分钟请求次数
  timeout: number
  retries: number
  endpoints: Record<string, string>
}

// 数据缓存接口
export interface DataCache {
  data: Map<string, RealTimeData>
  expiryTime: Map<string, Date>
  maxSize: number
  ttl: number // 缓存生存时间（毫秒）
}

/**
 * 实时数据管理器类
 */
export class RealTimeDataManager {
  private static instance: RealTimeDataManager

  // 数据状态
  public readonly currentData = reactive<Map<string, RealTimeData>>(new Map())
  public readonly isConnected = ref(true)
  public readonly lastUpdate = ref<Date | null>(null)

  // 订阅管理
  private subscriptions = new Map<string, DataSubscription>()
  private updateIntervals = new Map<string, number>()

  // 数据缓存
  private cache: DataCache = {
    data: new Map(),
    expiryTime: new Map(),
    maxSize: 1000,
    ttl: 5 * 60 * 1000 // 5分钟
  }

  // API配置
  private apiConfigs: Map<DataSourceType, APIConfig> = new Map([
    ['bundesbank', {
      source: 'bundesbank',
      baseUrl: 'https://api.bundesbank.de/rest/data',
      rateLimit: 60,
      timeout: 10000,
      retries: 3,
      endpoints: {
        interest_rates: '/BBK01/ST0515',
        bond_yields: '/BBK01/ST1326'
      }
    }],
    ['ecb', {
      source: 'ecb',
      baseUrl: 'https://sdw-wsrest.ecb.europa.eu/service/data',
      rateLimit: 60,
      timeout: 10000,
      retries: 3,
      endpoints: {
        interest_rates: '/FM/D.U2.EUR.RT.MM.EURIBOR3MD_.HSTA',
        exchange_rates: '/EXR/D..EUR.SP00.A'
      }
    }],
    ['yahoo', {
      source: 'yahoo',
      baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
      rateLimit: 100,
      timeout: 8000,
      retries: 2,
      endpoints: {
        stock_price: '/{symbol}',
        exchange_rates: '/{symbol}=X'
      }
    }],
    ['fixer', {
      source: 'fixer',
      baseUrl: 'https://api.fixer.io/v1',
      apiKey: import.meta.env.VITE_FIXER_API_KEY,
      rateLimit: 100,
      timeout: 5000,
      retries: 3,
      endpoints: {
        exchange_rates: '/latest'
      }
    }]
  ])

  // 统计信息
  public readonly stats = reactive({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    activeSubscriptions: 0,
    cacheHitRate: 0,
    lastErrorTime: null as Date | null,
    dataFreshness: new Map<string, number>()
  })

  // 德国金融数据预设
  private germanFinancialData = {
    // 德国央行利率
    'DE-BASE-RATE': {
      name: 'EZB Leitzins',
      type: 'interest_rate' as DataType,
      source: 'ecb' as DataSourceType,
      symbol: 'ECB-MAIN-RATE',
      defaultValue: 4.5
    },
    // 德国10年期国债收益率
    'DE-10Y-BOND': {
      name: 'Deutsche Bundesanleihe 10J',
      type: 'bond_yield' as DataType,
      source: 'bundesbank' as DataSourceType,
      symbol: 'DE10Y',
      defaultValue: 2.3
    },
    // 欧元兑美元汇率
    'EUR-USD': {
      name: 'EUR/USD Wechselkurs',
      type: 'exchange_rate' as DataType,
      source: 'fixer' as DataSourceType,
      symbol: 'EURUSD',
      defaultValue: 1.08
    },
    // DAX指数
    'DAX': {
      name: 'DAX Index',
      type: 'stock_price' as DataType,
      source: 'yahoo' as DataSourceType,
      symbol: '^GDAXI',
      defaultValue: 15500
    },
    // 德国通胀率
    'DE-INFLATION': {
      name: 'Deutsche Inflationsrate',
      type: 'inflation_rate' as DataType,
      source: 'bundesbank' as DataSourceType,
      symbol: 'DE-CPI',
      defaultValue: 3.2
    }
  }

  public static getInstance(): RealTimeDataManager {
    if (!RealTimeDataManager.instance) {
      RealTimeDataManager.instance = new RealTimeDataManager()
    }
    return RealTimeDataManager.instance
  }

  constructor() {
    this.initializeDefaultData()
    this.startHealthCheck()
    console.log('📊 Real-time Data Manager initialized')
  }

  /**
   * 订阅实时数据
   */
  public subscribe(
    type: DataType,
    symbol: string,
    callback: (data: RealTimeData) => void,
    options: {
      source?: DataSourceType
      interval?: number
    } = {}
  ): string {
    const subscriptionId = `${type}-${symbol}-${Date.now()}`
    const source = options.source || this.getBestDataSource(type)
    const interval = options.interval || this.getDefaultInterval(type)

    const subscription: DataSubscription = {
      id: subscriptionId,
      type,
      symbol,
      source,
      interval,
      callback,
      isActive: true,
      lastUpdate: new Date(),
      errorCount: 0
    }

    this.subscriptions.set(subscriptionId, subscription)
    this.startDataUpdates(subscription)
    this.stats.activeSubscriptions++

    console.log(`📈 Subscribed to ${type}:${symbol} from ${source}`)
    return subscriptionId
  }

  /**
   * 取消订阅
   */
  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      subscription.isActive = false
      this.subscriptions.delete(subscriptionId)

      const intervalId = this.updateIntervals.get(subscriptionId)
      if (intervalId) {
        clearInterval(intervalId)
        this.updateIntervals.delete(subscriptionId)
      }

      this.stats.activeSubscriptions--
      console.log(`📉 Unsubscribed from ${subscriptionId}`)
    }
  }

  /**
   * 获取当前数据
   */
  public getCurrentData(type: DataType, symbol: string): RealTimeData | null {
    const key = `${type}-${symbol}`
    return this.currentData.get(key) || this.getCachedData(key)
  }

  /**
   * 获取德国金融数据
   */
  public getGermanFinancialData(): Record<string, RealTimeData> {
    const result: Record<string, RealTimeData> = {}

    Object.entries(this.germanFinancialData).forEach(([key, config]) => {
      const data = this.getCurrentData(config.type, config.symbol)
      if (data) {
        result[key] = data
      } else {
        // 返回默认数据
        result[key] = {
          id: key,
          type: config.type,
          source: config.source,
          symbol: config.symbol,
          name: config.name,
          value: config.defaultValue,
          timestamp: new Date(),
          metadata: { isDefault: true }
        }
      }
    })

    return result
  }

  /**
   * 手动刷新数据
   */
  public async refreshData(type: DataType, symbol: string): Promise<RealTimeData | null> {
    const source = this.getBestDataSource(type)

    try {
      const data = await this.fetchDataFromAPI(type, symbol, source)
      if (data) {
        this.updateCurrentData(data)
        this.cacheData(data)
      }
      return data
    } catch (error) {
      console.error(`Failed to refresh data for ${type}:${symbol}:`, error)
      return null
    }
  }

  /**
   * 批量获取数据
   */
  public async batchFetchData(requests: Array<{
    type: DataType
    symbol: string
    source?: DataSourceType
  }>): Promise<RealTimeData[]> {
    const promises = requests.map(request =>
      this.fetchDataFromAPI(
        request.type,
        request.symbol,
        request.source || this.getBestDataSource(request.type)
      )
    )

    try {
      const results = await Promise.allSettled(promises)
      const data: RealTimeData[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          data.push(result.value)
          this.updateCurrentData(result.value)
          this.cacheData(result.value)
        } else {
          console.error(`Batch fetch failed for request ${index}:`, result)
        }
      })

      return data
    } catch (error) {
      console.error('Batch fetch failed:', error)
      return []
    }
  }

  /**
   * 获取数据统计信息
   */
  public getDataStats(): typeof this.stats {
    // 计算缓存命中率
    const totalCacheRequests = this.stats.totalRequests
    const cacheHits = totalCacheRequests - this.stats.successfulRequests
    this.stats.cacheHitRate = totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0

    // 计算数据新鲜度
    this.currentData.forEach((data, key) => {
      const age = Date.now() - data.timestamp.getTime()
      this.stats.dataFreshness.set(key, age)
    })

    return this.stats
  }

  // 私有方法

  /**
   * 初始化默认数据
   */
  private initializeDefaultData(): void {
    Object.entries(this.germanFinancialData).forEach(([key, config]) => {
      const data: RealTimeData = {
        id: key,
        type: config.type,
        source: config.source,
        symbol: config.symbol,
        name: config.name,
        value: config.defaultValue,
        timestamp: new Date(),
        metadata: { isDefault: true, initialized: true }
      }

      this.currentData.set(`${config.type}-${config.symbol}`, data)
    })
  }

  /**
   * 开始数据更新
   */
  private startDataUpdates(subscription: DataSubscription): void {
    const updateData = async () => {
      if (!subscription.isActive) return

      try {
        const data = await this.fetchDataFromAPI(
          subscription.type,
          subscription.symbol,
          subscription.source
        )

        if (data) {
          this.updateCurrentData(data)
          this.cacheData(data)
          subscription.callback(data)
          subscription.lastUpdate = new Date()
          subscription.errorCount = 0
        }
      } catch (error) {
        subscription.errorCount++
        console.error(`Data update failed for ${subscription.id}:`, error)

        if (subscription.errorCount >= 3) {
          console.warn(`Subscription ${subscription.id} disabled due to repeated errors`)
          subscription.isActive = false
        }
      }
    }

    // 立即执行一次
    updateData()

    // 设置定期更新
    const intervalId = window.setInterval(updateData, subscription.interval)
    this.updateIntervals.set(subscription.id, intervalId)
  }

  /**
   * 从API获取数据
   */
  private async fetchDataFromAPI(
    type: DataType,
    symbol: string,
    source: DataSourceType
  ): Promise<RealTimeData | null> {
    const config = this.apiConfigs.get(source)
    if (!config) {
      throw new Error(`Unknown data source: ${source}`)
    }

    const startTime = Date.now()
    this.stats.totalRequests++

    try {
      let data: RealTimeData | null = null

      switch (source) {
        case 'bundesbank':
          data = await this.fetchFromBundesbank(type, symbol, config)
          break
        case 'ecb':
          data = await this.fetchFromECB(type, symbol, config)
          break
        case 'yahoo':
          data = await this.fetchFromYahoo(type, symbol, config)
          break
        case 'fixer':
          data = await this.fetchFromFixer(type, symbol, config)
          break
        default:
          throw new Error(`Unsupported data source: ${source}`)
      }

      if (data) {
        this.stats.successfulRequests++
        const responseTime = Date.now() - startTime
        this.updateAverageResponseTime(responseTime)
      }

      return data
    } catch (error) {
      this.stats.failedRequests++
      this.stats.lastErrorTime = new Date()
      throw error
    }
  }

  /**
   * 从德国央行获取数据
   */
  private async fetchFromBundesbank(
    type: DataType,
    symbol: string,
    config: APIConfig
  ): Promise<RealTimeData | null> {
    // 模拟德国央行API调用
    await new Promise(resolve => setTimeout(resolve, 200))

    const mockData: Record<string, number> = {
      'DE10Y': 2.3 + (Math.random() - 0.5) * 0.2,
      'DE-CPI': 3.2 + (Math.random() - 0.5) * 0.5
    }

    const value = mockData[symbol] || 0

    return {
      id: `bundesbank-${symbol}-${Date.now()}`,
      type,
      source: 'bundesbank',
      symbol,
      name: `Bundesbank ${symbol}`,
      value,
      timestamp: new Date(),
      change: (Math.random() - 0.5) * 0.1,
      changePercent: (Math.random() - 0.5) * 2,
      metadata: { source: 'Deutsche Bundesbank' }
    }
  }

  /**
   * 从欧洲央行获取数据
   */
  private async fetchFromECB(
    type: DataType,
    symbol: string,
    config: APIConfig
  ): Promise<RealTimeData | null> {
    // 模拟欧洲央行API调用
    await new Promise(resolve => setTimeout(resolve, 300))

    const mockData: Record<string, number> = {
      'ECB-MAIN-RATE': 4.5,
      'EURIBOR-3M': 3.8 + (Math.random() - 0.5) * 0.3
    }

    const value = mockData[symbol] || 0

    return {
      id: `ecb-${symbol}-${Date.now()}`,
      type,
      source: 'ecb',
      symbol,
      name: `ECB ${symbol}`,
      value,
      timestamp: new Date(),
      change: (Math.random() - 0.5) * 0.05,
      changePercent: (Math.random() - 0.5) * 1,
      metadata: { source: 'European Central Bank' }
    }
  }

  /**
   * 从Yahoo Finance获取数据
   */
  private async fetchFromYahoo(
    type: DataType,
    symbol: string,
    config: APIConfig
  ): Promise<RealTimeData | null> {
    // 模拟Yahoo Finance API调用
    await new Promise(resolve => setTimeout(resolve, 150))

    const mockData: Record<string, number> = {
      '^GDAXI': 15500 + (Math.random() - 0.5) * 500,
      'EURUSD=X': 1.08 + (Math.random() - 0.5) * 0.02
    }

    const value = mockData[symbol] || 100

    return {
      id: `yahoo-${symbol}-${Date.now()}`,
      type,
      source: 'yahoo',
      symbol,
      name: `Yahoo ${symbol}`,
      value,
      timestamp: new Date(),
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 2,
      metadata: { source: 'Yahoo Finance' }
    }
  }

  /**
   * 从Fixer获取汇率数据
   */
  private async fetchFromFixer(
    type: DataType,
    symbol: string,
    config: APIConfig
  ): Promise<RealTimeData | null> {
    // 模拟Fixer API调用
    await new Promise(resolve => setTimeout(resolve, 100))

    const mockRates: Record<string, number> = {
      'EURUSD': 1.08 + (Math.random() - 0.5) * 0.02,
      'EURGBP': 0.86 + (Math.random() - 0.5) * 0.01,
      'EURCHF': 0.97 + (Math.random() - 0.5) * 0.01
    }

    const value = mockRates[symbol] || 1

    return {
      id: `fixer-${symbol}-${Date.now()}`,
      type,
      source: 'fixer',
      symbol,
      name: `${symbol} Exchange Rate`,
      value,
      currency: 'EUR',
      timestamp: new Date(),
      change: (Math.random() - 0.5) * 0.01,
      changePercent: (Math.random() - 0.5) * 1,
      metadata: { source: 'Fixer.io' }
    }
  }

  /**
   * 获取最佳数据源
   */
  private getBestDataSource(type: DataType): DataSourceType {
    const sourceMap: Record<DataType, DataSourceType> = {
      interest_rate: 'ecb',
      bond_yield: 'bundesbank',
      exchange_rate: 'fixer',
      stock_price: 'yahoo',
      inflation_rate: 'bundesbank',
      commodity_price: 'yahoo'
    }

    return sourceMap[type] || 'yahoo'
  }

  /**
   * 获取默认更新间隔
   */
  private getDefaultInterval(type: DataType): number {
    const intervalMap: Record<DataType, number> = {
      interest_rate: 60000, // 1分钟
      bond_yield: 30000,    // 30秒
      exchange_rate: 10000, // 10秒
      stock_price: 5000,    // 5秒
      inflation_rate: 300000, // 5分钟
      commodity_price: 15000  // 15秒
    }

    return intervalMap[type] || 30000
  }

  /**
   * 更新当前数据
   */
  private updateCurrentData(data: RealTimeData): void {
    const key = `${data.type}-${data.symbol}`
    this.currentData.set(key, data)
    this.lastUpdate.value = new Date()
  }

  /**
   * 缓存数据
   */
  private cacheData(data: RealTimeData): void {
    const key = `${data.type}-${data.symbol}`

    // 检查缓存大小
    if (this.cache.data.size >= this.cache.maxSize) {
      this.cleanupCache()
    }

    this.cache.data.set(key, data)
    this.cache.expiryTime.set(key, new Date(Date.now() + this.cache.ttl))
  }

  /**
   * 获取缓存数据
   */
  private getCachedData(key: string): RealTimeData | null {
    const expiry = this.cache.expiryTime.get(key)
    if (expiry && expiry > new Date()) {
      return this.cache.data.get(key) || null
    }

    // 清除过期数据
    this.cache.data.delete(key)
    this.cache.expiryTime.delete(key)

    return null
  }

  /**
   * 清理缓存
   */
  private cleanupCache(): void {
    const now = new Date()
    const keysToDelete: string[] = []

    this.cache.expiryTime.forEach((expiry, key) => {
      if (expiry <= now) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      this.cache.data.delete(key)
      this.cache.expiryTime.delete(key)
    })

    // 如果还是太大，删除最旧的数据
    if (this.cache.data.size >= this.cache.maxSize) {
      const entries = Array.from(this.cache.data.entries())
      const toDelete = entries.slice(0, Math.floor(this.cache.maxSize * 0.2))

      toDelete.forEach(([key]) => {
        this.cache.data.delete(key)
        this.cache.expiryTime.delete(key)
      })
    }
  }

  /**
   * 更新平均响应时间
   */
  private updateAverageResponseTime(responseTime: number): void {
    const currentAvg = this.stats.averageResponseTime
    const totalRequests = this.stats.successfulRequests

    this.stats.averageResponseTime =
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests
  }

  /**
   * 开始健康检查
   */
  private startHealthCheck(): void {
    setInterval(() => {
      this.checkConnectionHealth()
      this.cleanupCache()
    }, 60000) // 每分钟检查一次
  }

  /**
   * 检查连接健康状态
   */
  private checkConnectionHealth(): void {
    const now = Date.now()
    const lastUpdateTime = this.lastUpdate.value?.getTime() || 0
    const timeSinceLastUpdate = now - lastUpdateTime

    // 如果超过5分钟没有更新，认为连接有问题
    this.isConnected.value = timeSinceLastUpdate < 5 * 60 * 1000
  }
}

// 导出单例实例
export const realTimeDataManager = RealTimeDataManager.getInstance()

// 便捷的组合式API
export function useRealTimeData() {
  const manager = RealTimeDataManager.getInstance()

  return {
    // 状态
    currentData: manager.currentData,
    isConnected: manager.isConnected,
    lastUpdate: manager.lastUpdate,
    stats: manager.stats,

    // 方法
    subscribe: manager.subscribe.bind(manager),
    unsubscribe: manager.unsubscribe.bind(manager),
    getCurrentData: manager.getCurrentData.bind(manager),
    getGermanFinancialData: manager.getGermanFinancialData.bind(manager),
    refreshData: manager.refreshData.bind(manager),
    batchFetchData: manager.batchFetchData.bind(manager),
    getDataStats: manager.getDataStats.bind(manager)
  }
}
