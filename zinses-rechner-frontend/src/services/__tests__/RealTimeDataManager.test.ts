/**
 * 实时数据管理器单元测试
 * 测试数据获取、缓存、订阅等功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RealTimeDataManager } from '../RealTimeDataManager'
import type { DataType, DataSourceType, RealTimeData } from '../RealTimeDataManager'

// 模拟fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('RealTimeDataManager', () => {
  let dataManager: RealTimeDataManager

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    dataManager = RealTimeDataManager.getInstance()
  })

  afterEach(() => {
    vi.useRealTimers()
    // 清理所有订阅
    dataManager['subscriptions'].clear()
    dataManager['updateIntervals'].clear()
  })

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = RealTimeDataManager.getInstance()
      const instance2 = RealTimeDataManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('数据订阅', () => {
    it('应该成功创建数据订阅', () => {
      const callback = vi.fn()
      const subscriptionId = dataManager.subscribe(
        'interest_rate',
        'ECB-MAIN-RATE',
        callback,
        { source: 'ecb', interval: 60000 }
      )

      expect(subscriptionId).toBeDefined()
      expect(subscriptionId).toMatch(/interest_rate-ECB-MAIN-RATE-\d+/)
      expect(dataManager.stats.activeSubscriptions).toBe(1)
    })

    it('应该在订阅时立即获取数据', async () => {
      const mockData: RealTimeData = {
        id: 'test-1',
        type: 'interest_rate',
        source: 'ecb',
        symbol: 'ECB-MAIN-RATE',
        name: 'EZB Leitzins',
        value: 4.5,
        timestamp: new Date()
      }

      // 模拟API响应
      vi.spyOn(dataManager as any, 'fetchDataFromAPI').mockResolvedValue(mockData)

      const callback = vi.fn()
      dataManager.subscribe('interest_rate', 'ECB-MAIN-RATE', callback)

      // 等待异步操作完成
      await vi.runAllTimersAsync()

      expect(callback).toHaveBeenCalledWith(mockData)
    })

    it('应该正确取消订阅', () => {
      const callback = vi.fn()
      const subscriptionId = dataManager.subscribe(
        'interest_rate',
        'ECB-MAIN-RATE',
        callback
      )

      expect(dataManager.stats.activeSubscriptions).toBe(1)

      dataManager.unsubscribe(subscriptionId)

      expect(dataManager.stats.activeSubscriptions).toBe(0)
    })

    it('应该处理订阅错误', async () => {
      const error = new Error('API Error')
      vi.spyOn(dataManager as any, 'fetchDataFromAPI').mockRejectedValue(error)

      const callback = vi.fn()
      dataManager.subscribe('interest_rate', 'ECB-MAIN-RATE', callback)

      await vi.runAllTimersAsync()

      // 订阅应该仍然存在但有错误计数
      expect(dataManager.stats.activeSubscriptions).toBe(1)
    })
  })

  describe('数据获取', () => {
    it('应该从ECB获取利率数据', async () => {
      const data = await dataManager['fetchFromECB'](
        'interest_rate',
        'ECB-MAIN-RATE',
        dataManager['apiConfigs'].get('ecb')!
      )

      expect(data).toBeDefined()
      expect(data?.type).toBe('interest_rate')
      expect(data?.source).toBe('ecb')
      expect(data?.symbol).toBe('ECB-MAIN-RATE')
      expect(data?.value).toBeTypeOf('number')
    })

    it('应该从Bundesbank获取债券收益率', async () => {
      const data = await dataManager['fetchFromBundesbank'](
        'bond_yield',
        'DE10Y',
        dataManager['apiConfigs'].get('bundesbank')!
      )

      expect(data).toBeDefined()
      expect(data?.type).toBe('bond_yield')
      expect(data?.source).toBe('bundesbank')
      expect(data?.symbol).toBe('DE10Y')
    })

    it('应该从Yahoo Finance获取股价数据', async () => {
      const data = await dataManager['fetchFromYahoo'](
        'stock_price',
        '^GDAXI',
        dataManager['apiConfigs'].get('yahoo')!
      )

      expect(data).toBeDefined()
      expect(data?.type).toBe('stock_price')
      expect(data?.source).toBe('yahoo')
      expect(data?.symbol).toBe('^GDAXI')
    })

    it('应该从Fixer获取汇率数据', async () => {
      const data = await dataManager['fetchFromFixer'](
        'exchange_rate',
        'EURUSD',
        dataManager['apiConfigs'].get('fixer')!
      )

      expect(data).toBeDefined()
      expect(data?.type).toBe('exchange_rate')
      expect(data?.source).toBe('fixer')
      expect(data?.symbol).toBe('EURUSD')
    })
  })

  describe('德国金融数据', () => {
    it('应该返回完整的德国金融数据', () => {
      const germanData = dataManager.getGermanFinancialData()

      expect(germanData).toHaveProperty('DE-BASE-RATE')
      expect(germanData).toHaveProperty('DE-10Y-BOND')
      expect(germanData).toHaveProperty('EUR-USD')
      expect(germanData).toHaveProperty('DAX')
      expect(germanData).toHaveProperty('DE-INFLATION')

      // 检查数据结构
      const ecbRate = germanData['DE-BASE-RATE']
      expect(ecbRate.type).toBe('interest_rate')
      expect(ecbRate.source).toBe('ecb')
      expect(ecbRate.name).toBe('EZB Leitzins')
      expect(ecbRate.value).toBeTypeOf('number')
    })

    it('应该提供默认值当实时数据不可用时', () => {
      const germanData = dataManager.getGermanFinancialData()

      Object.values(germanData).forEach(data => {
        expect(data.value).toBeTypeOf('number')
        expect(data.value).toBeGreaterThan(0)
        expect(data.metadata?.isDefault).toBe(true)
      })
    })
  })

  describe('数据缓存', () => {
    it('应该缓存获取的数据', async () => {
      const mockData: RealTimeData = {
        id: 'test-cache',
        type: 'interest_rate',
        source: 'ecb',
        symbol: 'TEST',
        name: 'Test Rate',
        value: 3.5,
        timestamp: new Date()
      }

      // 缓存数据
      dataManager['cacheData'](mockData)

      // 从缓存获取
      const cachedData = dataManager['getCachedData']('interest_rate-TEST')
      expect(cachedData).toEqual(mockData)
    })

    it('应该处理缓存过期', async () => {
      const mockData: RealTimeData = {
        id: 'test-expire',
        type: 'interest_rate',
        source: 'ecb',
        symbol: 'TEST',
        name: 'Test Rate',
        value: 3.5,
        timestamp: new Date()
      }

      // 设置短TTL
      dataManager['cache'].ttl = 1000 // 1秒

      dataManager['cacheData'](mockData)

      // 快进时间超过TTL
      vi.advanceTimersByTime(2000)

      const cachedData = dataManager['getCachedData']('interest_rate-TEST')
      expect(cachedData).toBeNull()
    })

    it('应该清理过期的缓存数据', () => {
      // 添加一些测试数据
      for (let i = 0; i < 5; i++) {
        const mockData: RealTimeData = {
          id: `test-${i}`,
          type: 'interest_rate',
          source: 'ecb',
          symbol: `TEST-${i}`,
          name: `Test Rate ${i}`,
          value: i,
          timestamp: new Date()
        }
        dataManager['cacheData'](mockData)
      }

      expect(dataManager['cache'].data.size).toBe(5)

      // 快进时间使缓存过期
      vi.advanceTimersByTime(dataManager['cache'].ttl + 1000)

      // 触发清理
      dataManager['cleanupCache']()

      expect(dataManager['cache'].data.size).toBe(0)
    })
  })

  describe('批量数据获取', () => {
    it('应该批量获取多种数据', async () => {
      const requests = [
        { type: 'interest_rate' as DataType, symbol: 'ECB-MAIN-RATE' },
        { type: 'exchange_rate' as DataType, symbol: 'EURUSD' },
        { type: 'stock_price' as DataType, symbol: '^GDAXI' }
      ]

      const results = await dataManager.batchFetchData(requests)

      expect(results).toHaveLength(3)
      results.forEach(data => {
        expect(data).toBeDefined()
        expect(data.value).toBeTypeOf('number')
        expect(data.timestamp).toBeInstanceOf(Date)
      })
    })

    it('应该处理批量请求中的部分失败', async () => {
      // 模拟部分请求失败
      vi.spyOn(dataManager as any, 'fetchDataFromAPI')
        .mockResolvedValueOnce({
          id: 'success-1',
          type: 'interest_rate',
          source: 'ecb',
          symbol: 'ECB-MAIN-RATE',
          name: 'EZB Leitzins',
          value: 4.5,
          timestamp: new Date()
        })
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          id: 'success-2',
          type: 'stock_price',
          source: 'yahoo',
          symbol: '^GDAXI',
          name: 'DAX Index',
          value: 15500,
          timestamp: new Date()
        })

      const requests = [
        { type: 'interest_rate' as DataType, symbol: 'ECB-MAIN-RATE' },
        { type: 'exchange_rate' as DataType, symbol: 'INVALID' },
        { type: 'stock_price' as DataType, symbol: '^GDAXI' }
      ]

      const results = await dataManager.batchFetchData(requests)

      expect(results).toHaveLength(2) // 只有成功的请求
    })
  })

  describe('数据统计', () => {
    it('应该跟踪请求统计', async () => {
      const initialStats = dataManager.getDataStats()
      
      // 模拟成功请求
      vi.spyOn(dataManager as any, 'fetchDataFromAPI').mockResolvedValue({
        id: 'test',
        type: 'interest_rate',
        source: 'ecb',
        symbol: 'TEST',
        name: 'Test',
        value: 1,
        timestamp: new Date()
      })

      await dataManager.refreshData('interest_rate', 'TEST')

      const updatedStats = dataManager.getDataStats()
      expect(updatedStats.totalRequests).toBe(initialStats.totalRequests + 1)
      expect(updatedStats.successfulRequests).toBe(initialStats.successfulRequests + 1)
    })

    it('应该跟踪失败请求', async () => {
      const initialStats = dataManager.getDataStats()
      
      // 模拟失败请求
      vi.spyOn(dataManager as any, 'fetchDataFromAPI').mockRejectedValue(new Error('API Error'))

      try {
        await dataManager.refreshData('interest_rate', 'TEST')
      } catch (error) {
        // 预期的错误
      }

      const updatedStats = dataManager.getDataStats()
      expect(updatedStats.totalRequests).toBe(initialStats.totalRequests + 1)
      expect(updatedStats.failedRequests).toBe(initialStats.failedRequests + 1)
    })

    it('应该计算平均响应时间', async () => {
      // 模拟延迟响应
      vi.spyOn(dataManager as any, 'fetchDataFromAPI').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return {
          id: 'test',
          type: 'interest_rate',
          source: 'ecb',
          symbol: 'TEST',
          name: 'Test',
          value: 1,
          timestamp: new Date()
        }
      })

      await dataManager.refreshData('interest_rate', 'TEST')

      const stats = dataManager.getDataStats()
      expect(stats.averageResponseTime).toBeGreaterThan(0)
    })
  })

  describe('健康检查', () => {
    it('应该检测连接状态', () => {
      // 初始状态应该是连接的
      expect(dataManager.isConnected.value).toBe(true)

      // 模拟长时间无更新
      vi.advanceTimersByTime(6 * 60 * 1000) // 6分钟
      dataManager['checkConnectionHealth']()

      expect(dataManager.isConnected.value).toBe(false)
    })

    it('应该定期执行健康检查', () => {
      const healthCheckSpy = vi.spyOn(dataManager as any, 'checkConnectionHealth')

      // 快进1分钟
      vi.advanceTimersByTime(60 * 1000)

      expect(healthCheckSpy).toHaveBeenCalled()
    })
  })

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      vi.spyOn(dataManager as any, 'fetchDataFromAPI').mockRejectedValue(new Error('Network Error'))

      const result = await dataManager.refreshData('interest_rate', 'TEST')
      expect(result).toBeNull()
    })

    it('应该处理无效数据源', async () => {
      expect(() => {
        dataManager['fetchDataFromAPI']('interest_rate', 'TEST', 'invalid' as DataSourceType)
      }).rejects.toThrow('Unknown data source: invalid')
    })

    it('应该限制重试次数', async () => {
      const callback = vi.fn()
      const fetchSpy = vi.spyOn(dataManager as any, 'fetchDataFromAPI')
        .mockRejectedValue(new Error('Persistent Error'))

      dataManager.subscribe('interest_rate', 'TEST', callback)

      // 模拟多次失败
      for (let i = 0; i < 5; i++) {
        await vi.runAllTimersAsync()
        vi.advanceTimersByTime(60000) // 1分钟间隔
      }

      // 订阅应该被禁用
      const subscription = Array.from(dataManager['subscriptions'].values())[0]
      expect(subscription?.isActive).toBe(false)
    })
  })
})
