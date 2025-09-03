/**
 * 区块链和DeFi集成服务
 * 支持加密货币计算、DeFi收益分析、NFT估值等新兴金融工具
 */

import { auditLogService } from './AuditLogService'

// 区块链和DeFi相关类型定义
export interface CryptoCurrency {
  id: string
  symbol: string
  name: string
  network: BlockchainNetwork
  contractAddress?: string
  decimals: number
  price: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  circulatingSupply: number
  totalSupply?: number
  maxSupply?: number
  rank: number
  lastUpdated: Date
  metadata: CryptoMetadata
}

export interface BlockchainNetwork {
  id: string
  name: string
  symbol: string
  type: NetworkType
  chainId: number
  rpcUrl: string
  explorerUrl: string
  gasToken: string
  avgBlockTime: number // seconds
  avgGasFee: number
  isMainnet: boolean
  isActive: boolean
}

export type NetworkType = 'ethereum' | 'bitcoin' | 'binance_smart_chain' | 'polygon' | 'avalanche' | 'solana' | 'cardano' | 'polkadot'

export interface CryptoMetadata {
  description: string
  website: string
  whitepaper?: string
  github?: string
  twitter?: string
  category: CryptoCategory
  tags: string[]
  launchDate?: Date
  consensus: ConsensusAlgorithm
  useCase: string[]
}

export type CryptoCategory = 'currency' | 'defi' | 'nft' | 'gaming' | 'infrastructure' | 'privacy' | 'stablecoin' | 'meme'
export type ConsensusAlgorithm = 'proof_of_work' | 'proof_of_stake' | 'delegated_proof_of_stake' | 'proof_of_authority' | 'other'

export interface DeFiProtocol {
  id: string
  name: string
  category: DeFiCategory
  network: BlockchainNetwork
  tvl: number // Total Value Locked
  apy: number // Annual Percentage Yield
  fees: ProtocolFees
  risks: DeFiRisk[]
  tokens: DeFiToken[]
  pools: LiquidityPool[]
  governance: GovernanceInfo
  audit: AuditInfo[]
  isActive: boolean
  lastUpdated: Date
}

export type DeFiCategory = 
  | 'dex'              // Decentralized Exchange
  | 'lending'          // Lending Protocol
  | 'yield_farming'    // Yield Farming
  | 'staking'          // Staking
  | 'insurance'        // DeFi Insurance
  | 'derivatives'      // Derivatives
  | 'synthetic'        // Synthetic Assets
  | 'bridge'           // Cross-chain Bridge
  | 'dao'              // Decentralized Autonomous Organization

export interface ProtocolFees {
  tradingFee: number
  withdrawalFee: number
  performanceFee: number
  managementFee: number
  gasOptimization: boolean
}

export interface DeFiRisk {
  type: RiskType
  level: RiskLevel
  description: string
  mitigation: string[]
  probability: number // 0-100%
  impact: RiskImpact
}

export type RiskType = 'smart_contract' | 'liquidity' | 'impermanent_loss' | 'regulatory' | 'oracle' | 'governance' | 'market'
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
export type RiskImpact = 'negligible' | 'minor' | 'moderate' | 'major' | 'severe'

export interface DeFiToken {
  address: string
  symbol: string
  name: string
  decimals: number
  price: number
  role: TokenRole
  emissions?: TokenEmissions
}

export type TokenRole = 'governance' | 'utility' | 'reward' | 'collateral' | 'synthetic'

export interface TokenEmissions {
  rate: number // tokens per block/second
  schedule: EmissionSchedule[]
  totalEmissions: number
  remainingEmissions: number
}

export interface EmissionSchedule {
  startDate: Date
  endDate: Date
  rate: number
  description: string
}

export interface LiquidityPool {
  id: string
  name: string
  tokens: PoolToken[]
  totalLiquidity: number
  volume24h: number
  fees24h: number
  apy: number
  impermanentLoss: number
  rewards: PoolReward[]
}

export interface PoolToken {
  address: string
  symbol: string
  weight: number // percentage
  balance: number
  price: number
}

export interface PoolReward {
  token: string
  apy: number
  distribution: RewardDistribution
}

export type RewardDistribution = 'continuous' | 'epoch_based' | 'manual'

export interface GovernanceInfo {
  token: string
  votingPower: VotingPowerType
  proposalThreshold: number
  quorum: number
  votingPeriod: number // days
  executionDelay: number // days
  activeProposals: number
}

export type VotingPowerType = 'token_based' | 'quadratic' | 'delegation' | 'hybrid'

export interface AuditInfo {
  auditor: string
  date: Date
  report: string
  score: number // 0-100
  findings: AuditFinding[]
}

export interface AuditFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational'
  category: string
  description: string
  status: 'open' | 'acknowledged' | 'fixed'
}

export interface NFTCollection {
  id: string
  name: string
  symbol: string
  contractAddress: string
  network: BlockchainNetwork
  totalSupply: number
  floorPrice: number
  volume24h: number
  owners: number
  averagePrice: number
  metadata: NFTMetadata
  traits: NFTTrait[]
  rarity: RarityInfo
}

export interface NFTMetadata {
  description: string
  image: string
  externalUrl?: string
  creator: string
  category: NFTCategory
  createdAt: Date
  royalties: number // percentage
}

export type NFTCategory = 'art' | 'collectibles' | 'gaming' | 'music' | 'sports' | 'utility' | 'pfp' | 'metaverse'

export interface NFTTrait {
  traitType: string
  value: string
  rarity: number // percentage
  count: number
}

export interface RarityInfo {
  rank: number
  score: number
  algorithm: RarityAlgorithm
  traits: TraitRarity[]
}

export type RarityAlgorithm = 'trait_rarity' | 'statistical_rarity' | 'jaccard_distance' | 'custom'

export interface TraitRarity {
  traitType: string
  value: string
  rarity: number
  contribution: number
}

export interface DeFiPosition {
  id: string
  protocol: string
  type: PositionType
  tokens: PositionToken[]
  value: number
  entryPrice: number
  currentPrice: number
  pnl: number
  pnlPercentage: number
  rewards: PositionReward[]
  risks: DeFiRisk[]
  entryDate: Date
  lastUpdated: Date
}

export type PositionType = 'liquidity_provision' | 'lending' | 'borrowing' | 'staking' | 'farming' | 'synthetic'

export interface PositionToken {
  address: string
  symbol: string
  amount: number
  value: number
  weight: number
}

export interface PositionReward {
  token: string
  amount: number
  value: number
  apy: number
  claimable: boolean
}

export interface YieldFarmingStrategy {
  id: string
  name: string
  description: string
  protocols: string[]
  expectedApy: number
  riskLevel: RiskLevel
  complexity: ComplexityLevel
  minInvestment: number
  steps: StrategyStep[]
  costs: StrategyCost[]
  risks: DeFiRisk[]
  backtesting: BacktestResult
}

export type ComplexityLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface StrategyStep {
  order: number
  action: ActionType
  protocol: string
  description: string
  estimatedGas: number
  estimatedTime: number // minutes
}

export type ActionType = 'swap' | 'add_liquidity' | 'stake' | 'lend' | 'borrow' | 'claim' | 'compound'

export interface StrategyCost {
  type: CostType
  amount: number
  frequency: CostFrequency
  description: string
}

export type CostType = 'gas_fee' | 'protocol_fee' | 'slippage' | 'opportunity_cost'
export type CostFrequency = 'one_time' | 'per_transaction' | 'daily' | 'monthly' | 'annually'

export interface BacktestResult {
  period: string
  totalReturn: number
  annualizedReturn: number
  volatility: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  profitFactor: number
}

export interface CryptoPortfolio {
  id: string
  name: string
  totalValue: number
  totalCost: number
  totalPnl: number
  totalPnlPercentage: number
  holdings: CryptoHolding[]
  defiPositions: DeFiPosition[]
  nfts: NFTHolding[]
  allocation: AllocationBreakdown
  performance: PortfolioPerformance
  lastUpdated: Date
}

export interface CryptoHolding {
  token: CryptoCurrency
  amount: number
  value: number
  cost: number
  pnl: number
  pnlPercentage: number
  weight: number
  averagePrice: number
}

export interface NFTHolding {
  collection: NFTCollection
  tokenId: string
  name: string
  image: string
  rarity: RarityInfo
  cost: number
  estimatedValue: number
  pnl: number
  pnlPercentage: number
}

export interface AllocationBreakdown {
  byCategory: Record<CryptoCategory, number>
  byNetwork: Record<string, number>
  byRiskLevel: Record<RiskLevel, number>
  cefi: number // Centralized Finance
  defi: number // Decentralized Finance
  nft: number
}

export interface PortfolioPerformance {
  returns: PerformanceMetrics
  risk: RiskMetrics
  benchmarks: BenchmarkComparison[]
  attribution: PerformanceAttribution
}

export interface PerformanceMetrics {
  totalReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  calmarRatio: number
  sortinoRatio: number
}

export interface RiskMetrics {
  valueAtRisk: number
  conditionalVaR: number
  beta: number
  correlation: number
  concentrationRisk: number
}

export interface BenchmarkComparison {
  benchmark: string
  correlation: number
  beta: number
  alpha: number
  trackingError: number
  informationRatio: number
}

export interface PerformanceAttribution {
  assetSelection: number
  timing: number
  interaction: number
  fees: number
  other: number
}

export class BlockchainDeFiService {
  private static instance: BlockchainDeFiService
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.zinses-rechner.de'
  private cryptoCache: Map<string, CryptoCurrency> = new Map()
  private defiCache: Map<string, DeFiProtocol> = new Map()
  private priceUpdateInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startPriceUpdates()
  }

  public static getInstance(): BlockchainDeFiService {
    if (!BlockchainDeFiService.instance) {
      BlockchainDeFiService.instance = new BlockchainDeFiService()
    }
    return BlockchainDeFiService.instance
  }

  /**
   * 获取加密货币价格和信息
   */
  public async getCryptoCurrency(symbol: string): Promise<CryptoCurrency | null> {
    // 先检查缓存
    if (this.cryptoCache.has(symbol)) {
      const cached = this.cryptoCache.get(symbol)!
      const cacheAge = Date.now() - cached.lastUpdated.getTime()
      if (cacheAge < 5 * 60 * 1000) { // 5分钟缓存
        return cached
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/crypto/currencies/${symbol}`)
      
      if (response.ok) {
        const data = await response.json()
        const crypto = data.currency
        
        // 更新缓存
        this.cryptoCache.set(symbol, crypto)
        
        return crypto
      }
      
      return null
    } catch (error) {
      console.error('获取加密货币信息失败:', error)
      return null
    }
  }

  /**
   * 计算加密货币投资收益
   */
  public async calculateCryptoInvestment(
    symbol: string,
    investmentAmount: number,
    investmentDate: Date,
    currency = 'EUR'
  ): Promise<{
    currentValue: number
    totalReturn: number
    returnPercentage: number
    annualizedReturn: number
    volatility: number
    maxDrawdown: number
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/crypto/investment-calculation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol,
          investmentAmount,
          investmentDate: investmentDate.toISOString(),
          currency
        })
      })

      if (response.ok) {
        const data = await response.json()
        const calculation = data.calculation
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'crypto_investment_calculation',
          'crypto_calculator',
          {
            description: `Crypto investment calculation for ${symbol}`,
            customFields: { 
              symbol, 
              investmentAmount, 
              currency,
              currentValue: calculation.currentValue,
              returnPercentage: calculation.returnPercentage
            }
          },
          { severity: 'low' }
        )
        
        return calculation
      }
      
      return null
    } catch (error) {
      console.error('加密货币投资计算失败:', error)
      return null
    }
  }

  /**
   * 获取DeFi协议信息
   */
  public async getDeFiProtocol(protocolId: string): Promise<DeFiProtocol | null> {
    // 先检查缓存
    if (this.defiCache.has(protocolId)) {
      const cached = this.defiCache.get(protocolId)!
      const cacheAge = Date.now() - cached.lastUpdated.getTime()
      if (cacheAge < 15 * 60 * 1000) { // 15分钟缓存
        return cached
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/defi/protocols/${protocolId}`)
      
      if (response.ok) {
        const data = await response.json()
        const protocol = data.protocol
        
        // 更新缓存
        this.defiCache.set(protocolId, protocol)
        
        return protocol
      }
      
      return null
    } catch (error) {
      console.error('获取DeFi协议信息失败:', error)
      return null
    }
  }

  /**
   * 计算DeFi收益
   */
  public async calculateDeFiYield(
    protocolId: string,
    amount: number,
    duration: number, // days
    compounding = true
  ): Promise<{
    totalYield: number
    apy: number
    dailyYield: number
    compoundedYield: number
    fees: number
    netYield: number
    risks: DeFiRisk[]
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/defi/yield-calculation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          protocolId,
          amount,
          duration,
          compounding
        })
      })

      if (response.ok) {
        const data = await response.json()
        const calculation = data.calculation
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'defi_yield_calculation',
          'defi_calculator',
          {
            description: `DeFi yield calculation for protocol ${protocolId}`,
            customFields: { 
              protocolId, 
              amount, 
              duration,
              apy: calculation.apy,
              netYield: calculation.netYield
            }
          },
          { severity: 'low' }
        )
        
        return calculation
      }
      
      return null
    } catch (error) {
      console.error('DeFi收益计算失败:', error)
      return null
    }
  }

  /**
   * 分析流动性挖矿策略
   */
  public async analyzeLiquidityMining(
    poolId: string,
    amount: number,
    token1: string,
    token2: string
  ): Promise<{
    expectedApy: number
    impermanentLoss: number
    totalRewards: number
    riskScore: number
    recommendation: string
    scenarios: LiquidityScenario[]
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/defi/liquidity-mining-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poolId,
          amount,
          token1,
          token2
        })
      })

      if (response.ok) {
        const data = await response.json()
        const analysis = data.analysis
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'liquidity_mining_analysis',
          'defi_analyzer',
          {
            description: `Liquidity mining analysis for pool ${poolId}`,
            customFields: { 
              poolId, 
              amount, 
              token1, 
              token2,
              expectedApy: analysis.expectedApy,
              riskScore: analysis.riskScore
            }
          },
          { severity: 'low' }
        )
        
        return analysis
      }
      
      return null
    } catch (error) {
      console.error('流动性挖矿分析失败:', error)
      return null
    }
  }

  /**
   * 估值NFT
   */
  public async estimateNFTValue(
    contractAddress: string,
    tokenId: string,
    network: string
  ): Promise<{
    estimatedValue: number
    confidence: number
    priceRange: { min: number; max: number }
    comparables: NFTComparable[]
    factors: ValuationFactor[]
    lastSale?: NFTSale
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/nft/valuation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractAddress,
          tokenId,
          network
        })
      })

      if (response.ok) {
        const data = await response.json()
        const valuation = data.valuation
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'nft_valuation',
          'nft_valuator',
          {
            description: `NFT valuation for ${contractAddress}:${tokenId}`,
            customFields: { 
              contractAddress, 
              tokenId, 
              network,
              estimatedValue: valuation.estimatedValue,
              confidence: valuation.confidence
            }
          },
          { severity: 'low' }
        )
        
        return valuation
      }
      
      return null
    } catch (error) {
      console.error('NFT估值失败:', error)
      return null
    }
  }

  /**
   * 获取收益农场策略
   */
  public async getYieldFarmingStrategies(
    riskLevel?: RiskLevel,
    minApy?: number,
    maxComplexity?: ComplexityLevel
  ): Promise<YieldFarmingStrategy[]> {
    try {
      const params = new URLSearchParams()
      if (riskLevel) params.append('riskLevel', riskLevel)
      if (minApy) params.append('minApy', minApy.toString())
      if (maxComplexity) params.append('maxComplexity', maxComplexity)

      const response = await fetch(`${this.baseUrl}/api/defi/yield-strategies?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        return data.strategies || []
      }
      
      return []
    } catch (error) {
      console.error('获取收益农场策略失败:', error)
      return []
    }
  }

  /**
   * 分析加密货币投资组合
   */
  public async analyzeCryptoPortfolio(
    holdings: CryptoHolding[],
    benchmarks: string[] = ['BTC', 'ETH']
  ): Promise<{
    performance: PortfolioPerformance
    allocation: AllocationBreakdown
    risks: DeFiRisk[]
    recommendations: string[]
    rebalancing: RebalancingRecommendation[]
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/crypto/portfolio-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          holdings,
          benchmarks
        })
      })

      if (response.ok) {
        const data = await response.json()
        const analysis = data.analysis
        
        // 记录审计日志
        await auditLogService.log(
          'user_action',
          'calculation',
          'crypto_portfolio_analysis',
          'crypto_portfolio_analyzer',
          {
            description: `Crypto portfolio analysis completed`,
            customFields: { 
              holdingsCount: holdings.length,
              totalValue: holdings.reduce((sum, h) => sum + h.value, 0),
              benchmarks
            }
          },
          { severity: 'low' }
        )
        
        return analysis
      }
      
      return null
    } catch (error) {
      console.error('加密货币投资组合分析失败:', error)
      return null
    }
  }

  /**
   * 启动价格更新
   */
  private startPriceUpdates(): void {
    this.priceUpdateInterval = setInterval(async () => {
      try {
        // 更新缓存中的价格数据
        for (const [symbol, crypto] of this.cryptoCache.entries()) {
          const updated = await this.getCryptoCurrency(symbol)
          if (updated) {
            this.cryptoCache.set(symbol, updated)
          }
        }
      } catch (error) {
        console.error('价格更新失败:', error)
      }
    }, 5 * 60 * 1000) // 每5分钟更新一次
  }

  /**
   * 获取支持的网络
   */
  public getSupportedNetworks(): BlockchainNetwork[] {
    return [
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        type: 'ethereum',
        chainId: 1,
        rpcUrl: 'https://mainnet.infura.io/v3/',
        explorerUrl: 'https://etherscan.io',
        gasToken: 'ETH',
        avgBlockTime: 13,
        avgGasFee: 0.002,
        isMainnet: true,
        isActive: true
      },
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        type: 'bitcoin',
        chainId: 0,
        rpcUrl: '',
        explorerUrl: 'https://blockstream.info',
        gasToken: 'BTC',
        avgBlockTime: 600,
        avgGasFee: 0.0001,
        isMainnet: true,
        isActive: true
      }
    ]
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cryptoCache.clear()
    this.defiCache.clear()
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
      this.priceUpdateInterval = null
    }
    this.clearCache()
  }
}

// 辅助类型定义
interface LiquidityScenario {
  name: string
  priceChange: number
  impermanentLoss: number
  totalReturn: number
  probability: number
}

interface NFTComparable {
  tokenId: string
  salePrice: number
  saleDate: Date
  similarity: number
}

interface ValuationFactor {
  factor: string
  weight: number
  impact: number
  description: string
}

interface NFTSale {
  price: number
  date: Date
  buyer: string
  seller: string
  marketplace: string
}

interface RebalancingRecommendation {
  action: 'buy' | 'sell'
  token: string
  amount: number
  reason: string
  priority: number
}

// 导出单例实例
export const blockchainDeFiService = BlockchainDeFiService.getInstance()
