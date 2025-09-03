/**
 * 实时数据Composable
 * 提供响应式的实时金融数据访问和管理
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { realTimeFinancialDataService } from '@/services/RealTimeFinancialDataService'
import type { 
  InterestRates, 
  ExchangeRates, 
  EconomicIndicators, 
  MarketSentiment,
  StockData
} from '@/services/RealTimeFinancialDataService'

export interface UseRealTimeDataOptions {
  autoRefresh?: boolean
  refreshInterval?: number // 毫秒
  enabledDataTypes?: Array<'interest-rates' | 'exchange-rates' | 'economic-indicators' | 'market-sentiment' | 'stocks'>
  stockSymbols?: string[]
}

export function useRealTimeData(options: UseRealTimeDataOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5分钟
    enabledDataTypes = ['interest-rates', 'exchange-rates', 'economic-indicators', 'market-sentiment'],
    stockSymbols = []
  } = options

  // 响应式数据状态
  const isLoading = ref(false)
  const isOnline = ref(navigator.onLine)
  const lastUpdated = ref<Date | null>(null)
  const error = ref<string | null>(null)

  // 数据状态
  const interestRates = ref<InterestRates | null>(null)
  const exchangeRates = ref<ExchangeRates | null>(null)
  const economicIndicators = ref<EconomicIndicators | null>(null)
  const marketSentiment = ref<MarketSentiment | null>(null)
  const stockData = ref<StockData[]>([])

  // 内部状态
  const refreshTimer = ref<NodeJS.Timeout | null>(null)
  const eventCleanupFunctions: (() => void)[] = []

  // 计算属性
  const currentInterestRate = computed(() => {
    return interestRates.value?.ecb || 4.5 // 默认利率
  })

  const currentMortgageRate = computed(() => {
    return interestRates.value?.mortgageRate || 4.2 // 默认房贷利率
  })

  const currentInflationRate = computed(() => {
    return economicIndicators.value?.inflation.germany || 2.3 // 默认通胀率
  })

  const exchangeRateEURUSD = computed(() => {
    return exchangeRates.value?.rates.USD || 1.08 // 默认汇率
  })

  const marketRiskLevel = computed(() => {
    if (!marketSentiment.value) return 'medium'
    
    const vix = marketSentiment.value.vix
    if (vix < 15) return 'low'
    if (vix < 25) return 'medium'
    return 'high'
  })

  const isDataStale = computed(() => {
    if (!lastUpdated.value) return true
    const now = new Date()
    const diffMinutes = (now.getTime() - lastUpdated.value.getTime()) / (1000 * 60)
    return diffMinutes > 30 // 数据超过30分钟认为过期
  })

  const dataStatus = computed(() => {
    if (isLoading.value) return 'loading'
    if (error.value) return 'error'
    if (isDataStale.value) return 'stale'
    return 'fresh'
  })

  // 数据获取方法
  const fetchData = async (dataType: string) => {
    const service = realTimeFinancialDataService
    
    try {
      switch (dataType) {
        case 'interest-rates':
          if (enabledDataTypes.includes('interest-rates')) {
            interestRates.value = await service.fetchInterestRates()
          }
          break
          
        case 'exchange-rates':
          if (enabledDataTypes.includes('exchange-rates')) {
            exchangeRates.value = await service.fetchExchangeRates()
          }
          break
          
        case 'economic-indicators':
          if (enabledDataTypes.includes('economic-indicators')) {
            economicIndicators.value = await service.fetchEconomicIndicators()
          }
          break
          
        case 'market-sentiment':
          if (enabledDataTypes.includes('market-sentiment')) {
            marketSentiment.value = await service.fetchMarketSentiment()
          }
          break
          
        case 'stocks':
          if (enabledDataTypes.includes('stocks') && stockSymbols.length > 0) {
            stockData.value = await service.fetchStockData(stockSymbols)
          }
          break
      }
    } catch (err) {
      console.error(`获取${dataType}数据失败:`, err)
      throw err
    }
  }

  const fetchAllData = async () => {
    if (isLoading.value || !isOnline.value) return

    isLoading.value = true
    error.value = null

    try {
      const promises = enabledDataTypes.map(dataType => fetchData(dataType))
      
      if (enabledDataTypes.includes('stocks') && stockSymbols.length > 0) {
        promises.push(fetchData('stocks'))
      }

      await Promise.allSettled(promises)
      lastUpdated.value = new Date()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '数据获取失败'
      console.error('获取实时数据失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  const refreshData = async () => {
    await fetchAllData()
  }

  // 自动刷新管理
  const startAutoRefresh = () => {
    if (!autoRefresh || refreshTimer.value) return

    refreshTimer.value = setInterval(() => {
      if (isOnline.value) {
        fetchAllData()
      }
    }, refreshInterval)
  }

  const stopAutoRefresh = () => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
  }

  // 事件监听设置
  const setupEventListeners = () => {
    const service = realTimeFinancialDataService

    // 网络状态监听
    const handleOnline = () => {
      isOnline.value = true
      if (autoRefresh) {
        fetchAllData()
        startAutoRefresh()
      }
    }

    const handleOffline = () => {
      isOnline.value = false
      stopAutoRefresh()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    eventCleanupFunctions.push(
      () => window.removeEventListener('online', handleOnline),
      () => window.removeEventListener('offline', handleOffline)
    )

    // 数据更新监听
    if (enabledDataTypes.includes('interest-rates')) {
      const handleInterestRates = (data: InterestRates) => {
        interestRates.value = data
        lastUpdated.value = new Date()
      }
      service.on('data:interest-rates', handleInterestRates)
      eventCleanupFunctions.push(() => service.off('data:interest-rates', handleInterestRates))
    }

    if (enabledDataTypes.includes('exchange-rates')) {
      const handleExchangeRates = (data: ExchangeRates) => {
        exchangeRates.value = data
        lastUpdated.value = new Date()
      }
      service.on('data:exchange-rates', handleExchangeRates)
      eventCleanupFunctions.push(() => service.off('data:exchange-rates', handleExchangeRates))
    }

    if (enabledDataTypes.includes('economic-indicators')) {
      const handleEconomicIndicators = (data: EconomicIndicators) => {
        economicIndicators.value = data
        lastUpdated.value = new Date()
      }
      service.on('data:economic-indicators', handleEconomicIndicators)
      eventCleanupFunctions.push(() => service.off('data:economic-indicators', handleEconomicIndicators))
    }

    if (enabledDataTypes.includes('market-sentiment')) {
      const handleMarketSentiment = (data: MarketSentiment) => {
        marketSentiment.value = data
        lastUpdated.value = new Date()
      }
      service.on('data:market-sentiment', handleMarketSentiment)
      eventCleanupFunctions.push(() => service.off('data:market-sentiment', handleMarketSentiment))
    }

    if (enabledDataTypes.includes('stocks')) {
      const handleStocks = (data: StockData[]) => {
        stockData.value = data
        lastUpdated.value = new Date()
      }
      service.on('data:stocks', handleStocks)
      eventCleanupFunctions.push(() => service.off('data:stocks', handleStocks))
    }

    // 错误监听
    const handleError = (errorData: any) => {
      error.value = errorData.error?.message || '数据获取失败'
    }
    service.on('error', handleError)
    eventCleanupFunctions.push(() => service.off('error', handleError))
  }

  // 加载缓存数据
  const loadCachedData = () => {
    const service = realTimeFinancialDataService
    const cachedData = service.getAllCachedData()

    if (enabledDataTypes.includes('interest-rates') && cachedData['interest-rates']) {
      interestRates.value = cachedData['interest-rates']
    }

    if (enabledDataTypes.includes('exchange-rates') && cachedData['exchange-rates']) {
      exchangeRates.value = cachedData['exchange-rates']
    }

    if (enabledDataTypes.includes('economic-indicators') && cachedData['economic-indicators']) {
      economicIndicators.value = cachedData['economic-indicators']
    }

    if (enabledDataTypes.includes('market-sentiment') && cachedData['market-sentiment']) {
      marketSentiment.value = cachedData['market-sentiment']
    }

    // 检查是否有任何缓存数据
    if (Object.keys(cachedData).length > 0) {
      lastUpdated.value = new Date()
    }
  }

  // 工具方法
  const getInterestRateForCalculation = (calculationType: string): number => {
    if (!interestRates.value) return 4.5 // 默认值

    switch (calculationType) {
      case 'mortgage':
        return interestRates.value.mortgageRate
      case 'savings':
        return interestRates.value.savingsRate
      case 'investment':
        return interestRates.value.germanBund10y + 2 // 风险溢价
      default:
        return interestRates.value.ecb
    }
  }

  const getInflationAdjustedRate = (nominalRate: number): number => {
    const inflationRate = currentInflationRate.value
    return nominalRate - inflationRate
  }

  const formatDataAge = (): string => {
    if (!lastUpdated.value) return 'Keine Daten'

    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastUpdated.value.getTime()) / (1000 * 60))

    if (diffMinutes < 1) return 'Gerade aktualisiert'
    if (diffMinutes < 60) return `Vor ${diffMinutes} Minuten`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `Vor ${diffHours} Stunden`
    
    const diffDays = Math.floor(diffHours / 24)
    return `Vor ${diffDays} Tagen`
  }

  // 生命周期管理
  onMounted(() => {
    setupEventListeners()
    loadCachedData()
    
    if (isOnline.value) {
      fetchAllData()
      if (autoRefresh) {
        startAutoRefresh()
      }
    }
  })

  onUnmounted(() => {
    stopAutoRefresh()
    eventCleanupFunctions.forEach(cleanup => cleanup())
  })

  // 监听选项变化
  watch(() => options.stockSymbols, (newSymbols) => {
    if (newSymbols && newSymbols.length > 0 && enabledDataTypes.includes('stocks')) {
      fetchData('stocks')
    }
  })

  return {
    // 数据状态
    isLoading,
    isOnline,
    lastUpdated,
    error,
    dataStatus,
    isDataStale,

    // 原始数据
    interestRates,
    exchangeRates,
    economicIndicators,
    marketSentiment,
    stockData,

    // 计算属性
    currentInterestRate,
    currentMortgageRate,
    currentInflationRate,
    exchangeRateEURUSD,
    marketRiskLevel,

    // 方法
    refreshData,
    fetchAllData,
    getInterestRateForCalculation,
    getInflationAdjustedRate,
    formatDataAge,

    // 控制方法
    startAutoRefresh,
    stopAutoRefresh
  }
}

// 预设配置
export const useInterestRatesOnly = () => useRealTimeData({
  enabledDataTypes: ['interest-rates'],
  autoRefresh: true,
  refreshInterval: 60 * 60 * 1000 // 1小时
})

export const useExchangeRatesOnly = () => useRealTimeData({
  enabledDataTypes: ['exchange-rates'],
  autoRefresh: true,
  refreshInterval: 15 * 60 * 1000 // 15分钟
})

export const useMarketDataOnly = () => useRealTimeData({
  enabledDataTypes: ['market-sentiment', 'economic-indicators'],
  autoRefresh: true,
  refreshInterval: 30 * 60 * 1000 // 30分钟
})

export const useFullMarketData = () => useRealTimeData({
  enabledDataTypes: ['interest-rates', 'exchange-rates', 'economic-indicators', 'market-sentiment'],
  autoRefresh: true,
  refreshInterval: 5 * 60 * 1000 // 5分钟
})
