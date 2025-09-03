/**
 * 投资组合分析计算器
 * 提供多资产投资组合的风险收益分析、资产配置优化和绩效评估
 */

import type {
  BaseCalculator,
  FormSchema,
  ValidationResult,
  CalculationResult,
  ResultDisplayConfig,
  ExportConfig
} from '@/types/calculator'
import { validateRange } from '@/utils/formatters'

interface PortfolioAsset {
  name: string
  allocation: number // 配置比例 (%)
  expectedReturn: number // 预期年化收益率 (%)
  volatility: number // 波动率 (%)
  correlation?: number // 与其他资产的相关性
}

interface PortfolioInput {
  totalInvestment: number // 总投资金额
  investmentHorizon: number // 投资期限（年）
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' // 风险偏好
  assets: PortfolioAsset[] // 资产配置
  rebalanceFrequency: 'monthly' | 'quarterly' | 'yearly' | 'never' // 再平衡频率
  managementFee: number // 管理费率 (%)
}

interface PortfolioResult extends CalculationResult {
  portfolioMetrics: {
    expectedReturn: number // 组合预期收益率
    portfolioVolatility: number // 组合波动率
    sharpeRatio: number // 夏普比率
    maxDrawdown: number // 最大回撤
    valueAtRisk: number // 风险价值 (VaR)
  }
  assetAllocation: {
    current: PortfolioAsset[]
    recommended: PortfolioAsset[]
    rebalanceNeeded: boolean
  }
  performanceProjection: {
    scenarios: {
      optimistic: number // 乐观情况下的最终价值
      expected: number // 预期最终价值
      pessimistic: number // 悲观情况下的最终价值
    }
    yearlyProjections: Array<{
      year: number
      expectedValue: number
      confidenceInterval: [number, number] // 95%置信区间
    }>
  }
  riskAnalysis: {
    diversificationBenefit: number // 分散化收益
    concentrationRisk: number // 集中度风险
    correlationMatrix: number[][] // 相关性矩阵
  }
}

export class PortfolioAnalysisCalculator implements BaseCalculator {
  readonly id = 'portfolio-analysis'
  readonly name = 'Portfolio-Analyse'
  readonly description = 'Analysieren Sie Ihr Investmentportfolio mit modernen Portfolio-Theorien'
  readonly category = 'investment' as const
  readonly version = '1.0.0'
  readonly icon = 'chart-pie'

  readonly formSchema: FormSchema = {
    fields: [
      {
        key: 'totalInvestment',
        name: 'totalInvestment',
        type: 'currency',
        label: 'Gesamtinvestition (€)',
        placeholder: '100.000',
        helpText: 'Der Gesamtbetrag, den Sie investieren möchten',
        required: true,
        min: 1000,
        max: 10000000,
        defaultValue: 100000,
        validation: [
          {
            type: 'required',
            message: 'Gesamtinvestition ist erforderlich'
          },
          {
            type: 'min',
            value: 1000,
            message: 'Mindestinvestition beträgt 1.000€'
          }
        ]
      },
      {
        key: 'investmentHorizon',
        name: 'investmentHorizon',
        type: 'slider',
        label: 'Anlagehorizont (Jahre)',
        helpText: 'Wie lange planen Sie zu investieren?',
        required: true,
        min: 1,
        max: 40,
        step: 1,
        defaultValue: 10,
        validation: [
          {
            type: 'required',
            message: 'Anlagehorizont ist erforderlich'
          }
        ]
      },
      {
        key: 'riskTolerance',
        name: 'riskTolerance',
        type: 'select',
        label: 'Risikotoleranz',
        helpText: 'Wie viel Risiko sind Sie bereit einzugehen?',
        required: true,
        defaultValue: 'moderate',
        options: [
          { value: 'conservative', label: 'Konservativ (niedrige Volatilität)' },
          { value: 'moderate', label: 'Moderat (ausgewogenes Risiko)' },
          { value: 'aggressive', label: 'Aggressiv (hohe Renditeerwartung)' }
        ]
      },
      {
        key: 'rebalanceFrequency',
        name: 'rebalanceFrequency',
        type: 'select',
        label: 'Rebalancing-Frequenz',
        helpText: 'Wie oft möchten Sie Ihr Portfolio neu ausrichten?',
        required: true,
        defaultValue: 'quarterly',
        options: [
          { value: 'monthly', label: 'Monatlich' },
          { value: 'quarterly', label: 'Vierteljährlich' },
          { value: 'yearly', label: 'Jährlich' },
          { value: 'never', label: 'Nie (Buy & Hold)' }
        ]
      },
      {
        key: 'managementFee',
        name: 'managementFee',
        type: 'percentage',
        label: 'Verwaltungsgebühren (%)',
        placeholder: '0,5',
        helpText: 'Jährliche Verwaltungsgebühren in Prozent',
        required: false,
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 0.5
      }
    ],
    sections: [
      {
        title: 'Grundparameter',
        description: 'Definieren Sie Ihre Investitionsstrategie',
        fields: ['totalInvestment', 'investmentHorizon', 'riskTolerance'],
        defaultExpanded: true
      },
      {
        title: 'Portfolio-Management',
        description: 'Konfigurieren Sie Ihre Verwaltungsstrategie',
        fields: ['rebalanceFrequency', 'managementFee'],
        defaultExpanded: true
      }
    ]
  }

  readonly resultConfig: ResultDisplayConfig = {
    primaryMetrics: [
      {
        key: 'expectedReturn',
        label: 'Erwartete Rendite',
        format: 'percentage',
        highlight: true,
        description: 'Jährliche erwartete Portfoliorendite'
      },
      {
        key: 'portfolioVolatility',
        label: 'Portfolio-Volatilität',
        format: 'percentage',
        description: 'Maß für das Portfoliorisiko'
      },
      {
        key: 'sharpeRatio',
        label: 'Sharpe-Ratio',
        format: 'number',
        highlight: true,
        description: 'Risikoadjustierte Rendite'
      }
    ],
    secondaryMetrics: [
      {
        key: 'maxDrawdown',
        label: 'Max. Drawdown',
        format: 'percentage',
        description: 'Größter erwarteter Verlust'
      },
      {
        key: 'valueAtRisk',
        label: 'Value at Risk (95%)',
        format: 'currency',
        description: '95% Konfidenzintervall für Verluste'
      }
    ],
    charts: [
      {
        type: 'pie',
        title: 'Asset Allocation',
        dataKey: 'assetAllocation'
      },
      {
        type: 'line',
        title: 'Portfolio-Entwicklung',
        dataKey: 'performanceProjection'
      },
      {
        type: 'area',
        title: 'Risiko-Szenarien',
        dataKey: 'scenarios'
      }
    ]
  }

  readonly exportConfig: ExportConfig = {
    formats: ['pdf', 'excel', 'csv'],
    templates: [
      {
        name: 'Portfolio-Analyse Bericht',
        format: 'pdf',
        template: 'portfolio-analysis-report',
        variables: ['portfolioMetrics', 'assetAllocation', 'performanceProjection']
      }
    ]
  }

  validate(input: Record<string, any>): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = []

    // 基础验证
    if (!input.totalInvestment || input.totalInvestment < 1000) {
      errors.push({
        field: 'totalInvestment',
        message: 'Gesamtinvestition muss mindestens 1.000€ betragen',
        code: 'MIN_INVESTMENT'
      })
    }

    if (!input.investmentHorizon || input.investmentHorizon < 1) {
      errors.push({
        field: 'investmentHorizon',
        message: 'Anlagehorizont muss mindestens 1 Jahr betragen',
        code: 'MIN_HORIZON'
      })
    }

    // 资产配置验证（如果提供）
    if (input.assets && Array.isArray(input.assets)) {
      const totalAllocation = input.assets.reduce((sum: number, asset: PortfolioAsset) => sum + asset.allocation, 0)
      
      if (Math.abs(totalAllocation - 100) > 0.01) {
        errors.push({
          field: 'assets',
          message: 'Die Summe der Asset-Allokationen muss 100% betragen',
          code: 'ALLOCATION_SUM'
        })
      }

      // 检查每个资产的有效性
      input.assets.forEach((asset: PortfolioAsset, index: number) => {
        if (asset.allocation < 0 || asset.allocation > 100) {
          errors.push({
            field: `assets.${index}.allocation`,
            message: `Asset-Allokation muss zwischen 0% und 100% liegen`,
            code: 'INVALID_ALLOCATION'
          })
        }

        if (asset.expectedReturn < -50 || asset.expectedReturn > 50) {
          errors.push({
            field: `assets.${index}.expectedReturn`,
            message: `Erwartete Rendite muss zwischen -50% und 50% liegen`,
            code: 'INVALID_RETURN'
          })
        }

        if (asset.volatility < 0 || asset.volatility > 100) {
          errors.push({
            field: `assets.${index}.volatility`,
            message: `Volatilität muss zwischen 0% und 100% liegen`,
            code: 'INVALID_VOLATILITY'
          })
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  async calculate(input: Record<string, any>): Promise<PortfolioResult> {
    // 验证输入
    const validation = this.validate(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    try {
      // 如果没有提供资产配置，使用默认配置
      const assets = input.assets || this.getDefaultAssetAllocation(input.riskTolerance)
      
      // 计算投资组合指标
      const portfolioMetrics = this.calculatePortfolioMetrics(assets)
      
      // 生成性能预测
      const performanceProjection = this.calculatePerformanceProjection(
        input.totalInvestment,
        input.investmentHorizon,
        portfolioMetrics,
        input.managementFee || 0
      )
      
      // 风险分析
      const riskAnalysis = this.calculateRiskAnalysis(assets)
      
      // 资产配置建议
      const assetAllocation = this.generateAssetAllocationAdvice(assets, input.riskTolerance)

      return {
        finalAmount: performanceProjection.scenarios.expected,
        totalContributions: input.totalInvestment,
        totalInterest: performanceProjection.scenarios.expected - input.totalInvestment,
        yearlyBreakdown: performanceProjection.yearlyProjections.map(proj => ({
          year: proj.year,
          start_amount: proj.year === 1 ? input.totalInvestment : 0,
          contributions: 0,
          interest: proj.expectedValue - input.totalInvestment,
          end_amount: proj.expectedValue,
          growth_rate: ((proj.expectedValue / input.totalInvestment) ** (1/proj.year) - 1) * 100
        })),
        portfolioMetrics,
        assetAllocation,
        performanceProjection,
        riskAnalysis
      }
    } catch (error) {
      console.error('Portfolio-Analyse Fehler:', error)
      throw new Error('Portfolio-Analyse fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.')
    }
  }

  private getDefaultAssetAllocation(riskTolerance: string): PortfolioAsset[] {
    switch (riskTolerance) {
      case 'conservative':
        return [
          { name: 'Staatsanleihen', allocation: 60, expectedReturn: 2.5, volatility: 3 },
          { name: 'Unternehmensanleihen', allocation: 25, expectedReturn: 3.5, volatility: 5 },
          { name: 'Aktien (Developed)', allocation: 15, expectedReturn: 7, volatility: 15 }
        ]
      case 'aggressive':
        return [
          { name: 'Aktien (Developed)', allocation: 60, expectedReturn: 8, volatility: 16 },
          { name: 'Aktien (Emerging)', allocation: 20, expectedReturn: 10, volatility: 25 },
          { name: 'REITs', allocation: 10, expectedReturn: 6, volatility: 18 },
          { name: 'Anleihen', allocation: 10, expectedReturn: 3, volatility: 4 }
        ]
      default: // moderate
        return [
          { name: 'Aktien (Developed)', allocation: 40, expectedReturn: 7.5, volatility: 15 },
          { name: 'Anleihen', allocation: 35, expectedReturn: 3, volatility: 4 },
          { name: 'REITs', allocation: 15, expectedReturn: 6, volatility: 18 },
          { name: 'Rohstoffe', allocation: 10, expectedReturn: 5, volatility: 20 }
        ]
    }
  }

  private calculatePortfolioMetrics(assets: PortfolioAsset[]) {
    // 计算加权平均收益率
    const expectedReturn = assets.reduce((sum, asset) => 
      sum + (asset.allocation / 100) * asset.expectedReturn, 0
    )

    // 简化的波动率计算（假设资产间相关性为0.3）
    const portfolioVariance = assets.reduce((sum, asset) => {
      const weight = asset.allocation / 100
      return sum + (weight ** 2) * (asset.volatility ** 2)
    }, 0)

    // 添加相关性效应（简化）
    const correlationEffect = 0.3 * Math.sqrt(portfolioVariance) * 0.5
    const portfolioVolatility = Math.sqrt(portfolioVariance + correlationEffect)

    // 夏普比率（假设无风险利率为2%）
    const riskFreeRate = 2
    const sharpeRatio = (expectedReturn - riskFreeRate) / portfolioVolatility

    // 最大回撤估算
    const maxDrawdown = portfolioVolatility * 2.5

    // VaR计算（95%置信区间）
    const valueAtRisk = portfolioVolatility * 1.65

    return {
      expectedReturn,
      portfolioVolatility,
      sharpeRatio,
      maxDrawdown,
      valueAtRisk
    }
  }

  private calculatePerformanceProjection(
    totalInvestment: number,
    horizon: number,
    metrics: any,
    managementFee: number
  ) {
    const netReturn = metrics.expectedReturn - managementFee
    const volatility = metrics.portfolioVolatility

    // 场景分析
    const scenarios = {
      optimistic: totalInvestment * Math.pow(1 + (netReturn + volatility) / 100, horizon),
      expected: totalInvestment * Math.pow(1 + netReturn / 100, horizon),
      pessimistic: totalInvestment * Math.pow(1 + (netReturn - volatility) / 100, horizon)
    }

    // 年度预测
    const yearlyProjections = []
    for (let year = 1; year <= horizon; year++) {
      const expectedValue = totalInvestment * Math.pow(1 + netReturn / 100, year)
      const upperBound = totalInvestment * Math.pow(1 + (netReturn + volatility * 1.96) / 100, year)
      const lowerBound = totalInvestment * Math.pow(1 + (netReturn - volatility * 1.96) / 100, year)
      
      yearlyProjections.push({
        year,
        expectedValue,
        confidenceInterval: [lowerBound, upperBound] as [number, number]
      })
    }

    return {
      scenarios,
      yearlyProjections
    }
  }

  private calculateRiskAnalysis(assets: PortfolioAsset[]) {
    // 分散化收益计算
    const weightedVolatility = assets.reduce((sum, asset) => 
      sum + (asset.allocation / 100) * asset.volatility, 0
    )
    
    const portfolioVolatility = this.calculatePortfolioMetrics(assets).portfolioVolatility
    const diversificationBenefit = weightedVolatility - portfolioVolatility

    // 集中度风险（赫芬达尔指数）
    const concentrationRisk = assets.reduce((sum, asset) => 
      sum + Math.pow(asset.allocation / 100, 2), 0
    )

    // 简化的相关性矩阵
    const correlationMatrix = assets.map(() => 
      assets.map(() => 0.3) // 假设所有资产间相关性为0.3
    )

    return {
      diversificationBenefit,
      concentrationRisk,
      correlationMatrix
    }
  }

  private generateAssetAllocationAdvice(assets: PortfolioAsset[], riskTolerance: string) {
    const recommended = this.getDefaultAssetAllocation(riskTolerance)
    
    // 检查是否需要再平衡
    const rebalanceNeeded = assets.some((asset, index) => 
      Math.abs(asset.allocation - (recommended[index]?.allocation || 0)) > 5
    )

    return {
      current: assets,
      recommended,
      rebalanceNeeded
    }
  }
}

// 创建并导出实例
export const portfolioAnalysisCalculator = new PortfolioAnalysisCalculator()
