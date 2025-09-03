/**
 * 德国税收系统数据模型
 * 定义德国税收相关的数据结构和类型，包括资本利得税、免税额度、ETF部分免税等
 */

// 税收类型枚举
export enum TaxType {
  CAPITAL_GAINS = 'capital_gains',           // 资本利得税
  DIVIDEND = 'dividend',                     // 股息税
  INTEREST = 'interest',                     // 利息税
  ETF_DISTRIBUTION = 'etf_distribution',     // ETF分配税
  RENTAL_INCOME = 'rental_income'            // 租金收入税
}

// 教会税类型
export enum ChurchTaxType {
  NONE = 'none',                            // 无教会税
  CATHOLIC = 'catholic',                    // 天主教 (8-9%)
  PROTESTANT = 'protestant',                // 新教 (8-9%)
  OTHER = 'other'                          // 其他宗教
}

// 联邦州枚举 (影响教会税税率)
export enum GermanState {
  BADEN_WUERTTEMBERG = 'BW',               // 巴登-符腾堡州 (9%)
  BAYERN = 'BY',                           // 巴伐利亚州 (8%)
  BERLIN = 'BE',                           // 柏林 (9%)
  BRANDENBURG = 'BB',                      // 勃兰登堡州 (9%)
  BREMEN = 'HB',                           // 不来梅 (9%)
  HAMBURG = 'HH',                          // 汉堡 (9%)
  HESSEN = 'HE',                           // 黑森州 (9%)
  MECKLENBURG_VORPOMMERN = 'MV',           // 梅克伦堡-前波美拉尼亚州 (9%)
  NIEDERSACHSEN = 'NI',                    // 下萨克森州 (9%)
  NORDRHEIN_WESTFALEN = 'NW',              // 北莱茵-威斯特法伦州 (9%)
  RHEINLAND_PFALZ = 'RP',                  // 莱茵兰-普法尔茨州 (9%)
  SAARLAND = 'SL',                         // 萨尔州 (9%)
  SACHSEN = 'SN',                          // 萨克森州 (9%)
  SACHSEN_ANHALT = 'ST',                   // 萨克森-安哈尔特州 (9%)
  SCHLESWIG_HOLSTEIN = 'SH',               // 石勒苏益格-荷尔斯泰因州 (9%)
  THUERINGEN = 'TH'                        // 图林根州 (9%)
}

// ETF类型枚举 (影响部分免税比例)
export enum ETFType {
  EQUITY_DOMESTIC = 'equity_domestic',      // 国内股票ETF (30%免税)
  EQUITY_FOREIGN = 'equity_foreign',        // 国外股票ETF (30%免税)
  MIXED_FUND = 'mixed_fund',               // 混合基金 (15%免税)
  BOND_FUND = 'bond_fund',                 // 债券基金 (0%免税)
  REAL_ESTATE = 'real_estate',             // 房地产基金 (60%免税)
  COMMODITY = 'commodity',                 // 商品基金 (0%免税)
  OTHER = 'other'                          // 其他类型 (0%免税)
}

// 资本利得税配置
export interface AbgeltungssteuerConfig {
  // 基础税率 (25%)
  baseTaxRate: number

  // 团结税税率 (5.5%)
  solidarityTaxRate: number

  // 教会税配置
  churchTax: {
    type: ChurchTaxType
    rate: number                           // 8% 或 9%，取决于联邦州
    state: GermanState
  }

  // 是否启用资本利得税
  enabled: boolean

  // 计算方法配置
  calculation: {
    includeChurchTax: boolean              // 是否包含教会税
    includeSolidarityTax: boolean          // 是否包含团结税
    roundingMethod: 'round' | 'floor' | 'ceil'  // 舍入方法
    decimalPlaces: number                  // 小数位数
  }
}

// 免税额度配置 (Freistellungsauftrag)
export interface FreistellungsauftragConfig {
  // 年度免税额度 (2023年起为801€)
  annualAllowance: number

  // 已使用的免税额度
  usedAllowance: number

  // 剩余免税额度
  remainingAllowance: number

  // 免税额度分配
  allocations: FreistellungsauftragAllocation[]

  // 是否启用免税额度
  enabled: boolean

  // 配置选项
  options: {
    autoOptimize: boolean                  // 自动优化分配
    carryForward: boolean                  // 是否结转未使用额度
    splitBetweenSpouses: boolean           // 夫妻间分配
  }
}

// 免税额度分配
export interface FreistellungsauftragAllocation {
  id: string
  bankName: string                         // 银行名称
  allocatedAmount: number                  // 分配金额
  usedAmount: number                       // 已使用金额
  remainingAmount: number                  // 剩余金额
  isActive: boolean                        // 是否激活
  createdAt: Date
  updatedAt: Date
}

// ETF部分免税配置 (Teilfreistellung)
export interface ETFTeilfreistellungConfig {
  // ETF类型和对应的免税比例
  exemptionRates: Record<ETFType, number>

  // 是否启用ETF部分免税
  enabled: boolean

  // 默认ETF类型 (用于未指定类型的ETF)
  defaultETFType: ETFType

  // 计算选项
  options: {
    applyToDistributions: boolean          // 应用于分配
    applyToCapitalGains: boolean           // 应用于资本利得
    minimumHoldingPeriod: number           // 最小持有期 (月)
  }
}

// 税收计算参数
export interface TaxCalculationParams {
  // 收入金额
  income: number

  // 收入类型
  incomeType: TaxType

  // ETF类型 (如果适用)
  etfType?: ETFType

  // 持有期 (月)
  holdingPeriod?: number

  // 是否为夫妻合并申报
  jointFiling: boolean

  // 其他扣除项
  deductions: number

  // 计算年份
  taxYear: number
}

// 税收计算结果
export interface TaxCalculationResult {
  // 应税收入
  taxableIncome: number

  // 免税金额
  exemptAmount: number

  // 基础税额 (25%)
  baseTax: number

  // 团结税
  solidarityTax: number

  // 教会税
  churchTax: number

  // 总税额
  totalTax: number

  // 税后收入
  netIncome: number

  // 有效税率
  effectiveTaxRate: number

  // 计算明细
  breakdown: TaxBreakdown

  // 计算时间戳
  calculatedAt: Date
}

// 税收计算明细
export interface TaxBreakdown {
  // 原始收入
  grossIncome: number

  // 免税额度使用情况
  allowanceUsage: {
    available: number
    used: number
    remaining: number
  }

  // ETF部分免税情况
  etfExemption?: {
    exemptionRate: number
    exemptAmount: number
    taxableAmount: number
  }

  // 各项税收明细
  taxes: {
    capitalGainsTax: number
    solidarityTax: number
    churchTax: number
  }

  // 计算步骤
  calculationSteps: CalculationStep[]
}

// 计算步骤
export interface CalculationStep {
  step: number
  description: string
  formula: string
  input: number
  output: number
  explanation: string
}

// 税收设置配置
export interface TaxSettings {
  // 用户基本信息
  userInfo: {
    state: GermanState
    churchTaxType: ChurchTaxType
    isMarried: boolean
    taxYear: number
  }

  // 资本利得税配置
  abgeltungssteuer: AbgeltungssteuerConfig

  // 免税额度配置
  freistellungsauftrag: FreistellungsauftragConfig

  // ETF部分免税配置
  etfTeilfreistellung: ETFTeilfreistellungConfig

  // 高级设置
  advanced: {
    enableDetailedCalculation: boolean      // 启用详细计算
    showCalculationSteps: boolean          // 显示计算步骤
    enableTaxOptimization: boolean         // 启用税收优化建议
    autoSaveSettings: boolean              // 自动保存设置
  }

  // 设置元数据
  metadata: {
    version: string
    createdAt: Date
    updatedAt: Date
    lastUsed: Date
  }
}

// 税收优化建议
export interface TaxOptimizationSuggestion {
  id: string
  type: 'allowance' | 'etf_type' | 'timing' | 'structure'
  title: string
  description: string
  potentialSavings: number
  difficulty: 'easy' | 'medium' | 'hard'
  timeframe: string
  steps: string[]
  risks: string[]
  applicableScenarios: string[]
}

// 税收法规更新
export interface TaxRegulationUpdate {
  id: string
  title: string
  description: string
  effectiveDate: Date
  impactLevel: 'low' | 'medium' | 'high'
  affectedAreas: TaxType[]
  changes: {
    field: string
    oldValue: any
    newValue: any
    explanation: string
  }[]
  actionRequired: boolean
  deadline?: Date
}

// 税收计算历史
export interface TaxCalculationHistory {
  id: string
  userId: string
  calculationType: TaxType
  params: TaxCalculationParams
  result: TaxCalculationResult
  settings: TaxSettings
  notes?: string
  tags: string[]
  createdAt: Date
}

// 税收报告
export interface TaxReport {
  id: string
  userId: string
  reportType: 'annual' | 'quarterly' | 'monthly'
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalIncome: number
    totalTax: number
    effectiveTaxRate: number
    allowanceUsed: number
    allowanceRemaining: number
  }
  calculations: TaxCalculationHistory[]
  optimizations: TaxOptimizationSuggestion[]
  generatedAt: Date
}

// 默认税收设置
export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  userInfo: {
    state: GermanState.NORDRHEIN_WESTFALEN,
    churchTaxType: ChurchTaxType.NONE,
    isMarried: false,
    taxYear: new Date().getFullYear()
  },

  abgeltungssteuer: {
    baseTaxRate: 0.25,                     // 25%
    solidarityTaxRate: 0.055,              // 5.5%
    churchTax: {
      type: ChurchTaxType.NONE,
      rate: 0,
      state: GermanState.NORDRHEIN_WESTFALEN
    },
    enabled: true,
    calculation: {
      includeChurchTax: false,
      includeSolidarityTax: true,
      roundingMethod: 'round',
      decimalPlaces: 2
    }
  },

  freistellungsauftrag: {
    annualAllowance: 801,                  // 2023年起为801€
    usedAllowance: 0,
    remainingAllowance: 801,
    allocations: [],
    enabled: true,
    options: {
      autoOptimize: true,
      carryForward: false,
      splitBetweenSpouses: false
    }
  },

  etfTeilfreistellung: {
    exemptionRates: {
      [ETFType.EQUITY_DOMESTIC]: 0.30,     // 30%
      [ETFType.EQUITY_FOREIGN]: 0.30,      // 30%
      [ETFType.MIXED_FUND]: 0.15,          // 15%
      [ETFType.BOND_FUND]: 0.00,           // 0%
      [ETFType.REAL_ESTATE]: 0.60,         // 60%
      [ETFType.COMMODITY]: 0.00,           // 0%
      [ETFType.OTHER]: 0.00                // 0%
    },
    enabled: true,
    defaultETFType: ETFType.EQUITY_FOREIGN,
    options: {
      applyToDistributions: true,
      applyToCapitalGains: true,
      minimumHoldingPeriod: 12
    }
  },

  advanced: {
    enableDetailedCalculation: true,
    showCalculationSteps: true,
    enableTaxOptimization: true,
    autoSaveSettings: true
  },

  metadata: {
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUsed: new Date()
  }
}

// 教会税税率映射
export const CHURCH_TAX_RATES: Record<GermanState, number> = {
  [GermanState.BADEN_WUERTTEMBERG]: 0.09,  // 9%
  [GermanState.BAYERN]: 0.08,              // 8%
  [GermanState.BERLIN]: 0.09,              // 9%
  [GermanState.BRANDENBURG]: 0.09,         // 9%
  [GermanState.BREMEN]: 0.09,              // 9%
  [GermanState.HAMBURG]: 0.09,             // 9%
  [GermanState.HESSEN]: 0.09,              // 9%
  [GermanState.MECKLENBURG_VORPOMMERN]: 0.09, // 9%
  [GermanState.NIEDERSACHSEN]: 0.09,       // 9%
  [GermanState.NORDRHEIN_WESTFALEN]: 0.09, // 9%
  [GermanState.RHEINLAND_PFALZ]: 0.09,     // 9%
  [GermanState.SAARLAND]: 0.09,            // 9%
  [GermanState.SACHSEN]: 0.09,             // 9%
  [GermanState.SACHSEN_ANHALT]: 0.09,      // 9%
  [GermanState.SCHLESWIG_HOLSTEIN]: 0.09,  // 9%
  [GermanState.THUERINGEN]: 0.09           // 9%
}

// ETF免税率映射
export const ETF_EXEMPTION_RATES: Record<ETFType, number> = {
  [ETFType.EQUITY_DOMESTIC]: 0.30,     // 30%
  [ETFType.EQUITY_FOREIGN]: 0.30,      // 30%
  [ETFType.MIXED_FUND]: 0.15,          // 15%
  [ETFType.BOND_FUND]: 0.00,           // 0%
  [ETFType.REAL_ESTATE]: 0.60,         // 60%
  [ETFType.COMMODITY]: 0.00,           // 0%
  [ETFType.OTHER]: 0.00                // 0%
}

// 德国联邦州详细信息
export const GERMAN_STATES = [
  { code: GermanState.BADEN_WUERTTEMBERG, name: 'Baden-Württemberg', churchTaxRate: 0.09 },
  { code: GermanState.BAYERN, name: 'Bayern', churchTaxRate: 0.08 },
  { code: GermanState.BERLIN, name: 'Berlin', churchTaxRate: 0.09 },
  { code: GermanState.BRANDENBURG, name: 'Brandenburg', churchTaxRate: 0.09 },
  { code: GermanState.BREMEN, name: 'Bremen', churchTaxRate: 0.09 },
  { code: GermanState.HAMBURG, name: 'Hamburg', churchTaxRate: 0.09 },
  { code: GermanState.HESSEN, name: 'Hessen', churchTaxRate: 0.09 },
  { code: GermanState.MECKLENBURG_VORPOMMERN, name: 'Mecklenburg-Vorpommern', churchTaxRate: 0.09 },
  { code: GermanState.NIEDERSACHSEN, name: 'Niedersachsen', churchTaxRate: 0.09 },
  { code: GermanState.NORDRHEIN_WESTFALEN, name: 'Nordrhein-Westfalen', churchTaxRate: 0.09 },
  { code: GermanState.RHEINLAND_PFALZ, name: 'Rheinland-Pfalz', churchTaxRate: 0.09 },
  { code: GermanState.SAARLAND, name: 'Saarland', churchTaxRate: 0.09 },
  { code: GermanState.SACHSEN, name: 'Sachsen', churchTaxRate: 0.09 },
  { code: GermanState.SACHSEN_ANHALT, name: 'Sachsen-Anhalt', churchTaxRate: 0.09 },
  { code: GermanState.SCHLESWIG_HOLSTEIN, name: 'Schleswig-Holstein', churchTaxRate: 0.09 },
  { code: GermanState.THUERINGEN, name: 'Thüringen', churchTaxRate: 0.09 }
]

// 税收计算工具函数类型
export interface TaxCalculationUtils {
  calculateAbgeltungssteuer: (params: TaxCalculationParams, settings: TaxSettings) => TaxCalculationResult
  calculateFreistellungsauftrag: (income: number, settings: TaxSettings) => number
  calculateETFTeilfreistellung: (income: number, etfType: ETFType, settings: TaxSettings) => number
  optimizeAllowanceAllocation: (allocations: FreistellungsauftragAllocation[]) => FreistellungsauftragAllocation[]
  validateTaxSettings: (settings: TaxSettings) => { isValid: boolean; errors: string[] }
  generateTaxReport: (calculations: TaxCalculationHistory[], period: { start: Date; end: Date }) => TaxReport
}
