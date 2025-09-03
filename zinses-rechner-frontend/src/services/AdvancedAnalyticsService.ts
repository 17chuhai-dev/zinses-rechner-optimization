/**
 * 高级分析服务
 * 提供专业的财务分析、风险评估、投资组合优化等功能
 */

import { authService } from './AuthService'
import type { CalculationResult } from '@/types/calculator'

// 分析相关类型定义
export interface AnalysisRequest {
  id: string
  organizationId: string
  name: string
  description?: string
  analysisType: AnalysisType
  inputData: AnalysisInputData
  parameters: AnalysisParameters
  status: AnalysisStatus
  createdBy: string
  createdAt: Date
  completedAt?: Date
  results?: AnalysisResult
}

export type AnalysisType = 
  | 'risk_assessment'        // 风险评估
  | 'portfolio_optimization' // 投资组合优化
  | 'stress_testing'         // 压力测试
  | 'monte_carlo'           // 蒙特卡洛模拟
  | 'sensitivity_analysis'   // 敏感性分析
  | 'scenario_analysis'      // 情景分析
  | 'correlation_analysis'   // 相关性分析
  | 'performance_attribution' // 业绩归因分析

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AnalysisInputData {
  calculations: CalculationResult[]
  marketData?: MarketDataInput
  benchmarks?: BenchmarkData[]
  constraints?: OptimizationConstraints
  customParameters?: Record<string, any>
}

export interface MarketDataInput {
  assetPrices: AssetPrice[]
  riskFreeRate: number
  marketVolatility: number
  correlationMatrix?: number[][]
  historicalReturns?: HistoricalReturn[]
}

export interface AssetPrice {
  symbol: string
  name: string
  price: number
  currency: string
  timestamp: Date
  volatility?: number
  beta?: number
}

export interface HistoricalReturn {
  date: Date
  returns: Record<string, number> // symbol -> return
}

export interface BenchmarkData {
  id: string
  name: string
  symbol: string
  returns: number[]
  volatility: number
  sharpeRatio: number
}

export interface OptimizationConstraints {
  minWeight?: number
  maxWeight?: number
  maxVolatility?: number
  minReturn?: number
  sectorConstraints?: SectorConstraint[]
  turnoverLimit?: number
}

export interface SectorConstraint {
  sector: string
  minWeight: number
  maxWeight: number
}

export interface AnalysisParameters {
  timeHorizon: number        // 分析时间范围（年）
  confidenceLevel: number    // 置信水平
  simulationRuns?: number    // 模拟次数
  rebalanceFrequency?: 'monthly' | 'quarterly' | 'annually'
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive'
  customSettings?: Record<string, any>
}

export interface AnalysisResult {
  summary: AnalysisSummary
  metrics: AnalysisMetrics
  recommendations: Recommendation[]
  charts: ChartData[]
  reports: ReportSection[]
  rawData?: Record<string, any>
}

export interface AnalysisSummary {
  title: string
  description: string
  keyFindings: string[]
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  executionTime: number
}

export interface AnalysisMetrics {
  expectedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  valueAtRisk: number
  conditionalVaR: number
  beta: number
  alpha: number
  informationRatio: number
  trackingError: number
  [key: string]: number
}

export interface Recommendation {
  id: string
  type: 'allocation' | 'rebalancing' | 'risk_management' | 'optimization'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  implementation: string
  confidence: number
  expectedBenefit?: number
}

export interface ChartData {
  id: string
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'histogram'
  title: string
  description: string
  data: any
  config: any
}

export interface ReportSection {
  id: string
  title: string
  content: string
  charts?: string[] // chart IDs
  tables?: TableData[]
  insights?: string[]
}

export interface TableData {
  id: string
  title: string
  headers: string[]
  rows: (string | number)[][]
  formatting?: TableFormatting
}

export interface TableFormatting {
  numberFormat?: string
  percentageColumns?: number[]
  currencyColumns?: number[]
  highlightRules?: HighlightRule[]
}

export interface HighlightRule {
  column: number
  condition: 'greater_than' | 'less_than' | 'equal_to'
  value: number
  style: string
}

export interface RiskAssessmentResult extends AnalysisResult {
  riskFactors: RiskFactor[]
  stressTestResults: StressTestResult[]
  riskContributions: RiskContribution[]
}

export interface RiskFactor {
  name: string
  impact: number
  probability: number
  severity: 'low' | 'medium' | 'high'
  mitigation: string
}

export interface StressTestResult {
  scenario: string
  description: string
  portfolioReturn: number
  maxLoss: number
  recoveryTime: number
}

export interface RiskContribution {
  asset: string
  contribution: number
  percentage: number
}

export interface PortfolioOptimizationResult extends AnalysisResult {
  optimalWeights: AssetWeight[]
  efficientFrontier: EfficientFrontierPoint[]
  currentVsOptimal: PortfolioComparison
  rebalancingPlan: RebalancingAction[]
}

export interface AssetWeight {
  symbol: string
  name: string
  currentWeight: number
  optimalWeight: number
  difference: number
}

export interface EfficientFrontierPoint {
  return: number
  volatility: number
  sharpeRatio: number
  weights: Record<string, number>
}

export interface PortfolioComparison {
  current: PortfolioMetrics
  optimal: PortfolioMetrics
  improvement: PortfolioMetrics
}

export interface PortfolioMetrics {
  expectedReturn: number
  volatility: number
  sharpeRatio: number
  diversificationRatio: number
}

export interface RebalancingAction {
  asset: string
  action: 'buy' | 'sell' | 'hold'
  currentAmount: number
  targetAmount: number
  difference: number
  cost: number
}

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {}

  public static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService()
    }
    return AdvancedAnalyticsService.instance
  }

  /**
   * 创建分析请求
   */
  public async createAnalysis(data: {
    organizationId: string
    name: string
    description?: string
    analysisType: AnalysisType
    inputData: AnalysisInputData
    parameters: AnalysisParameters
  }): Promise<AnalysisRequest | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/analytics/analyses', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        this.emit('analysis:created', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('创建分析失败:', error)
      return null
    }
  }

  /**
   * 执行风险评估
   */
  public async performRiskAssessment(
    inputData: AnalysisInputData,
    parameters: AnalysisParameters
  ): Promise<RiskAssessmentResult | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/analytics/risk-assessment', {
        method: 'POST',
        body: JSON.stringify({ inputData, parameters })
      })

      return response.success ? response.data : null
    } catch (error) {
      console.error('风险评估失败:', error)
      return null
    }
  }

  /**
   * 执行投资组合优化
   */
  public async optimizePortfolio(
    inputData: AnalysisInputData,
    parameters: AnalysisParameters,
    constraints?: OptimizationConstraints
  ): Promise<PortfolioOptimizationResult | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/analytics/portfolio-optimization', {
        method: 'POST',
        body: JSON.stringify({ inputData, parameters, constraints })
      })

      return response.success ? response.data : null
    } catch (error) {
      console.error('投资组合优化失败:', error)
      return null
    }
  }

  /**
   * 执行蒙特卡洛模拟
   */
  public async runMonteCarloSimulation(
    inputData: AnalysisInputData,
    parameters: AnalysisParameters & { simulationRuns: number }
  ): Promise<AnalysisResult | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/analytics/monte-carlo', {
        method: 'POST',
        body: JSON.stringify({ inputData, parameters })
      })

      return response.success ? response.data : null
    } catch (error) {
      console.error('蒙特卡洛模拟失败:', error)
      return null
    }
  }

  /**
   * 执行敏感性分析
   */
  public async performSensitivityAnalysis(
    inputData: AnalysisInputData,
    parameters: AnalysisParameters,
    variables: string[]
  ): Promise<AnalysisResult | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/analytics/sensitivity-analysis', {
        method: 'POST',
        body: JSON.stringify({ inputData, parameters, variables })
      })

      return response.success ? response.data : null
    } catch (error) {
      console.error('敏感性分析失败:', error)
      return null
    }
  }

  /**
   * 执行压力测试
   */
  public async performStressTesting(
    inputData: AnalysisInputData,
    scenarios: StressTestScenario[]
  ): Promise<AnalysisResult | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/analytics/stress-testing', {
        method: 'POST',
        body: JSON.stringify({ inputData, scenarios })
      })

      return response.success ? response.data : null
    } catch (error) {
      console.error('压力测试失败:', error)
      return null
    }
  }

  /**
   * 获取分析结果
   */
  public async getAnalysisResult(analysisId: string): Promise<AnalysisRequest | null> {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/analytics/analyses/${analysisId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取分析结果失败:', error)
      return null
    }
  }

  /**
   * 获取组织的分析历史
   */
  public async getOrganizationAnalyses(
    organizationId: string,
    options?: {
      analysisType?: AnalysisType
      status?: AnalysisStatus
      limit?: number
      offset?: number
    }
  ): Promise<{ analyses: AnalysisRequest[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (options?.analysisType) params.append('analysisType', options.analysisType)
      if (options?.status) params.append('status', options.status)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await this.makeAuthenticatedRequest(
        `/api/analytics/organizations/${organizationId}/analyses?${params.toString()}`
      )

      return response.success ? response.data : { analyses: [], total: 0 }
    } catch (error) {
      console.error('获取分析历史失败:', error)
      return { analyses: [], total: 0 }
    }
  }

  /**
   * 生成分析报告
   */
  public async generateReport(
    analysisId: string,
    format: 'pdf' | 'html' | 'docx',
    options?: {
      includeCharts?: boolean
      includeRawData?: boolean
      template?: string
    }
  ): Promise<Blob | null> {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      if (options?.includeCharts) params.append('includeCharts', 'true')
      if (options?.includeRawData) params.append('includeRawData', 'true')
      if (options?.template) params.append('template', options.template)

      const response = await fetch(
        `${this.baseUrl}/api/analytics/analyses/${analysisId}/report?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${authService.getAccessToken()}`
          }
        }
      )

      if (response.ok) {
        return await response.blob()
      }

      return null
    } catch (error) {
      console.error('生成报告失败:', error)
      return null
    }
  }

  /**
   * 获取市场数据
   */
  public async getMarketData(
    symbols: string[],
    startDate: Date,
    endDate: Date
  ): Promise<MarketDataInput | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/analytics/market-data', {
        method: 'POST',
        body: JSON.stringify({ symbols, startDate, endDate })
      })

      return response.success ? response.data : null
    } catch (error) {
      console.error('获取市场数据失败:', error)
      return null
    }
  }

  /**
   * 获取基准数据
   */
  public async getBenchmarkData(benchmarkIds: string[]): Promise<BenchmarkData[]> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/analytics/benchmarks', {
        method: 'POST',
        body: JSON.stringify({ benchmarkIds })
      })

      return response.success ? response.data : []
    } catch (error) {
      console.error('获取基准数据失败:', error)
      return []
    }
  }

  /**
   * 计算投资组合指标
   */
  public async calculatePortfolioMetrics(
    weights: Record<string, number>,
    returns: HistoricalReturn[],
    riskFreeRate: number
  ): Promise<PortfolioMetrics | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/analytics/portfolio-metrics', {
        method: 'POST',
        body: JSON.stringify({ weights, returns, riskFreeRate })
      })

      return response.success ? response.data : null
    } catch (error) {
      console.error('计算投资组合指标失败:', error)
      return null
    }
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
      const refreshed = await authService.refreshToken()
      if (refreshed) {
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
  }
}

// 压力测试场景接口
export interface StressTestScenario {
  name: string
  description: string
  shocks: MarketShock[]
}

export interface MarketShock {
  asset: string
  type: 'price_change' | 'volatility_change' | 'correlation_change'
  magnitude: number
  duration?: number
}

// 导出单例实例
export const advancedAnalyticsService = AdvancedAnalyticsService.getInstance()
