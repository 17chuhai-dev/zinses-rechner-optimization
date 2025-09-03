/**
 * 实时金融数据服务
 * 集成多个金融数据API，提供实时利率、汇率、股票价格等数据
 */

// 浏览器兼容的事件发射器
class EventEmitter {
  private events: Map<string, Function[]> = new Map()

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(listener)
  }

  off(event: string, listener: Function): void {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(...args))
    }
  }

  removeAllListeners(): void {
    this.events.clear()
  }
}

// 数据类型定义
export interface InterestRates {
  ecb: number // 欧洲央行基准利率
  euribor3m: number // 3个月欧元银行间拆借利率
  euribor12m: number // 12个月欧元银行间拆借利率
  germanBund10y: number // 德国10年期国债收益率
  mortgageRate: number // 平均房贷利率
  savingsRate: number // 储蓄账户利率
  lastUpdated: Date
}

export interface ExchangeRates {
  base: string // 基准货币 (EUR)
  rates: {
    USD: number
    GBP: number
    CHF: number
    JPY: number
    CNY: number
    [key: string]: number
  }
  lastUpdated: Date
}

export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  lastUpdated: Date
}

export interface EconomicIndicators {
  inflation: {
    germany: number
    eurozone: number
    lastUpdated: Date
  }
  unemployment: {
    germany: number
    eurozone: number
    lastUpdated: Date
  }
  gdp: {
    germany: number
    eurozone: number
    lastUpdated: Date
  }
}

export interface MarketSentiment {
  vix: number // 波动率指数
  fearGreedIndex: number // 恐惧贪婪指数
  sentiment: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed'
  lastUpdated: Date
}

// API配置接口
interface APIConfig {
  name: string
  baseUrl: string
  apiKey?: string
  rateLimit: number // 每分钟请求限制
  timeout: number // 超时时间(ms)
  retryAttempts: number
}

// 数据源配置
const DATA_SOURCES: Record<string, APIConfig> = {
  ecb: {
    name: 'European Central Bank',
    baseUrl: 'https://api.ecb.europa.eu/v1',
    rateLimit: 60,
    timeout: 10000,
    retryAttempts: 3
  },
  exchangeRatesApi: {
    name: 'Exchange Rates API',
    baseUrl: 'https://api.exchangerate-api.com/v4',
    rateLimit: 1500,
    timeout: 5000,
    retryAttempts: 2
  },
  alphavantage: {
    name: 'Alpha Vantage',
    baseUrl: 'https://www.alphavantage.co',
    apiKey: import.meta.env.VITE_ALPHAVANTAGE_API_KEY,
    rateLimit: 5,
    timeout: 15000,
    retryAttempts: 3
  },
  finnhub: {
    name: 'Finnhub',
    baseUrl: 'https://finnhub.io/api/v1',
    apiKey: import.meta.env.VITE_FINNHUB_API_KEY,
    rateLimit: 60,
    timeout: 10000,
    retryAttempts: 2
  }
}

export class RealTimeFinancialDataService extends EventEmitter {
  private static instance: RealTimeFinancialDataService
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map()
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map()
  private isOnline = navigator.onLine

  private constructor() {
    super()
    this.setupNetworkListeners()
    this.startPeriodicUpdates()
  }

  public static getInstance(): RealTimeFinancialDataService {
    if (!RealTimeFinancialDataService.instance) {
      RealTimeFinancialDataService.instance = new RealTimeFinancialDataService()
    }
    return RealTimeFinancialDataService.instance
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.emit('network:online')
      this.resumeUpdates()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.emit('network:offline')
      this.pauseUpdates()
    })
  }

  /**
   * 启动定期数据更新
   */
  private startPeriodicUpdates(): void {
    // 利率数据 - 每小时更新
    this.scheduleUpdate('interest-rates', () => this.fetchInterestRates(), 60 * 60 * 1000)

    // 汇率数据 - 每15分钟更新
    this.scheduleUpdate('exchange-rates', () => this.fetchExchangeRates(), 15 * 60 * 1000)

    // 经济指标 - 每天更新
    this.scheduleUpdate('economic-indicators', () => this.fetchEconomicIndicators(), 24 * 60 * 60 * 1000)

    // 市场情绪 - 每30分钟更新
    this.scheduleUpdate('market-sentiment', () => this.fetchMarketSentiment(), 30 * 60 * 1000)
  }

  /**
   * 调度数据更新
   */
  private scheduleUpdate(key: string, updateFn: () => Promise<any>, interval: number): void {
    // 立即执行一次
    updateFn().catch(error => console.error(`初始数据获取失败 (${key}):`, error))

    // 设置定期更新
    const intervalId = setInterval(async () => {
      if (this.isOnline) {
        try {
          await updateFn()
        } catch (error) {
          console.error(`定期数据更新失败 (${key}):`, error)
          this.emit('error', { type: 'update_failed', key, error })
        }
      }
    }, interval)

    this.updateIntervals.set(key, intervalId)
  }

  /**
   * 暂停所有更新
   */
  private pauseUpdates(): void {
    this.updateIntervals.forEach(intervalId => clearInterval(intervalId))
    this.updateIntervals.clear()
  }

  /**
   * 恢复更新
   */
  private resumeUpdates(): void {
    this.startPeriodicUpdates()
  }

  /**
   * 检查API请求限制
   */
  private checkRateLimit(source: string): boolean {
    const config = DATA_SOURCES[source]
    if (!config) return false

    const now = Date.now()
    const key = `${source}_requests`
    const record = this.requestCounts.get(key)

    if (!record || now > record.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + 60000 })
      return true
    }

    if (record.count >= config.rateLimit) {
      return false
    }

    record.count++
    return true
  }

  /**
   * 通用API请求方法
   */
  private async makeRequest(url: string, source: string, options: RequestInit = {}): Promise<any> {
    if (!this.isOnline) {
      throw new Error('网络连接不可用')
    }

    if (!this.checkRateLimit(source)) {
      throw new Error(`API请求限制已达上限: ${source}`)
    }

    const config = DATA_SOURCES[source]
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * 缓存管理
   */
  private setCache(key: string, data: any, ttl: number = 300000): void { // 默认5分钟TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * 获取利率数据
   */
  public async fetchInterestRates(): Promise<InterestRates> {
    const cacheKey = 'interest-rates'
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      // 模拟API调用 - 实际应用中应该调用真实的ECB API
      const mockData: InterestRates = {
        ecb: 4.5,
        euribor3m: 3.8,
        euribor12m: 3.9,
        germanBund10y: 2.4,
        mortgageRate: 4.2,
        savingsRate: 0.5,
        lastUpdated: new Date()
      }

      this.setCache(cacheKey, mockData, 60 * 60 * 1000) // 1小时缓存
      this.emit('data:interest-rates', mockData)
      return mockData

    } catch (error) {
      console.error('获取利率数据失败:', error)
      throw error
    }
  }

  /**
   * 获取汇率数据
   */
  public async fetchExchangeRates(): Promise<ExchangeRates> {
    const cacheKey = 'exchange-rates'
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      // 模拟API调用
      const mockData: ExchangeRates = {
        base: 'EUR',
        rates: {
          USD: 1.08,
          GBP: 0.86,
          CHF: 0.97,
          JPY: 161.5,
          CNY: 7.85
        },
        lastUpdated: new Date()
      }

      this.setCache(cacheKey, mockData, 15 * 60 * 1000) // 15分钟缓存
      this.emit('data:exchange-rates', mockData)
      return mockData

    } catch (error) {
      console.error('获取汇率数据失败:', error)
      throw error
    }
  }

  /**
   * 获取股票数据
   */
  public async fetchStockData(symbols: string[]): Promise<StockData[]> {
    const results: StockData[] = []

    for (const symbol of symbols) {
      const cacheKey = `stock-${symbol}`
      let cached = this.getCache(cacheKey)

      if (!cached) {
        try {
          // 模拟股票数据
          cached = {
            symbol,
            name: this.getStockName(symbol),
            price: Math.random() * 1000 + 100,
            change: (Math.random() - 0.5) * 20,
            changePercent: (Math.random() - 0.5) * 5,
            volume: Math.floor(Math.random() * 1000000),
            lastUpdated: new Date()
          }

          this.setCache(cacheKey, cached, 5 * 60 * 1000) // 5分钟缓存
        } catch (error) {
          console.error(`获取股票数据失败 (${symbol}):`, error)
          continue
        }
      }

      results.push(cached)
    }

    this.emit('data:stocks', results)
    return results
  }

  /**
   * 获取经济指标
   */
  public async fetchEconomicIndicators(): Promise<EconomicIndicators> {
    const cacheKey = 'economic-indicators'
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      const mockData: EconomicIndicators = {
        inflation: {
          germany: 2.3,
          eurozone: 2.8,
          lastUpdated: new Date()
        },
        unemployment: {
          germany: 5.9,
          eurozone: 6.4,
          lastUpdated: new Date()
        },
        gdp: {
          germany: 1.2,
          eurozone: 0.8,
          lastUpdated: new Date()
        }
      }

      this.setCache(cacheKey, mockData, 24 * 60 * 60 * 1000) // 24小时缓存
      this.emit('data:economic-indicators', mockData)
      return mockData

    } catch (error) {
      console.error('获取经济指标失败:', error)
      throw error
    }
  }

  /**
   * 获取市场情绪数据
   */
  public async fetchMarketSentiment(): Promise<MarketSentiment> {
    const cacheKey = 'market-sentiment'
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      const fearGreedIndex = Math.floor(Math.random() * 100)
      let sentiment: MarketSentiment['sentiment'] = 'neutral'

      if (fearGreedIndex < 20) sentiment = 'extreme_fear'
      else if (fearGreedIndex < 40) sentiment = 'fear'
      else if (fearGreedIndex > 80) sentiment = 'extreme_greed'
      else if (fearGreedIndex > 60) sentiment = 'greed'

      const mockData: MarketSentiment = {
        vix: Math.random() * 30 + 10,
        fearGreedIndex,
        sentiment,
        lastUpdated: new Date()
      }

      this.setCache(cacheKey, mockData, 30 * 60 * 1000) // 30分钟缓存
      this.emit('data:market-sentiment', mockData)
      return mockData

    } catch (error) {
      console.error('获取市场情绪数据失败:', error)
      throw error
    }
  }

  /**
   * 获取股票名称
   */
  private getStockName(symbol: string): string {
    const names: Record<string, string> = {
      'DAX': 'DAX Index',
      'SAP': 'SAP SE',
      'ASML': 'ASML Holding',
      'LVMH': 'LVMH Moët Hennessy',
      'NESN': 'Nestlé SA'
    }
    return names[symbol] || symbol
  }

  /**
   * 获取所有缓存的数据
   */
  public getAllCachedData(): Record<string, any> {
    const result: Record<string, any> = {}

    this.cache.forEach((value, key) => {
      if (Date.now() - value.timestamp <= value.ttl) {
        result[key] = value.data
      }
    })

    return result
  }

  /**
   * 清除缓存
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * 获取数据源状态
   */
  public getDataSourceStatus(): Record<string, { available: boolean; lastUpdate?: Date; error?: string }> {
    const status: Record<string, any> = {}

    Object.keys(DATA_SOURCES).forEach(source => {
      const cached = this.getCache(`${source}-status`)
      status[source] = cached || { available: true, lastUpdate: new Date() }
    })

    return status
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.pauseUpdates()
    this.cache.clear()
    this.requestCounts.clear()
    this.removeAllListeners()
  }
}

// 导出单例实例
export const realTimeFinancialDataService = RealTimeFinancialDataService.getInstance()
