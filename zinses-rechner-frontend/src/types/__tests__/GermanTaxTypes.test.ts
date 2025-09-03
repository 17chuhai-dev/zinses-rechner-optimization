/**
 * 德国税收数据模型单元测试
 * 验证所有税收数据类型、接口定义、默认值和枚举的正确性
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  TaxType,
  GermanState,
  ChurchTaxType,
  ETFType,
  TaxSettings,
  AbgeltungssteuerConfig,
  FreistellungsauftragConfig,
  ETFTeilfreistellungConfig,
  TaxCalculationParams,
  TaxCalculationResult,
  FreistellungsauftragAllocation,
  TaxOptimizationSuggestion,
  DEFAULT_TAX_SETTINGS,
  CHURCH_TAX_RATES,
  ETF_EXEMPTION_RATES,
  GERMAN_STATES
} from '../GermanTaxTypes'

describe('GermanTaxTypes - 枚举类型测试', () => {
  describe('TaxType 枚举', () => {
    it('应该包含所有必需的税收类型', () => {
      expect(TaxType.CAPITAL_GAINS).toBe('capital_gains')
      expect(TaxType.DIVIDEND).toBe('dividend')
      expect(TaxType.INTEREST).toBe('interest')
      expect(TaxType.ETF_DISTRIBUTION).toBe('etf_distribution')
      expect(TaxType.RENTAL_INCOME).toBe('rental_income')
    })

    it('应该有正确的枚举值数量', () => {
      const taxTypeValues = Object.values(TaxType)
      expect(taxTypeValues).toHaveLength(5)
    })
  })

  describe('GermanState 枚举', () => {
    it('应该包含所有16个德国联邦州', () => {
      const expectedStates = [
        'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
        'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'
      ]

      expectedStates.forEach(state => {
        expect(Object.values(GermanState)).toContain(state)
      })
    })

    it('应该有正确的联邦州数量', () => {
      const stateValues = Object.values(GermanState)
      expect(stateValues).toHaveLength(16)
    })
  })

  describe('ChurchTaxType 枚举', () => {
    it('应该包含所有教会税类型', () => {
      expect(ChurchTaxType.NONE).toBe('none')
      expect(ChurchTaxType.CATHOLIC).toBe('catholic')
      expect(ChurchTaxType.PROTESTANT).toBe('protestant')
      expect(ChurchTaxType.OTHER).toBe('other')
    })

    it('应该有正确的教会税类型数量', () => {
      const churchTaxValues = Object.values(ChurchTaxType)
      expect(churchTaxValues).toHaveLength(4)
    })
  })

  describe('ETFType 枚举', () => {
    it('应该包含所有ETF类型', () => {
      expect(ETFType.EQUITY_DOMESTIC).toBe('equity_domestic')
      expect(ETFType.EQUITY_FOREIGN).toBe('equity_foreign')
      expect(ETFType.MIXED_FUND).toBe('mixed_fund')
      expect(ETFType.BOND_FUND).toBe('bond_fund')
      expect(ETFType.REAL_ESTATE).toBe('real_estate')
      expect(ETFType.COMMODITY).toBe('commodity')
      expect(ETFType.OTHER).toBe('other')
    })

    it('应该有正确的ETF类型数量', () => {
      const etfTypeValues = Object.values(ETFType)
      expect(etfTypeValues).toHaveLength(7)
    })
  })
})

describe('GermanTaxTypes - 常量测试', () => {
  describe('CHURCH_TAX_RATES 常量', () => {
    it('应该包含所有联邦州的教会税税率', () => {
      const allStates = Object.values(GermanState)
      allStates.forEach(state => {
        expect(CHURCH_TAX_RATES).toHaveProperty(state)
        expect(typeof CHURCH_TAX_RATES[state]).toBe('number')
      })
    })

    it('巴伐利亚州应该是8%，巴登-符腾堡州应该是9%', () => {
      expect(CHURCH_TAX_RATES[GermanState.BAYERN]).toBe(0.08)
      expect(CHURCH_TAX_RATES[GermanState.BADEN_WUERTTEMBERG]).toBe(0.09)
    })

    it('其他联邦州应该是9%', () => {
      const otherStates = Object.values(GermanState).filter(
        state => state !== GermanState.BAYERN
      )

      otherStates.forEach(state => {
        expect(CHURCH_TAX_RATES[state]).toBe(0.09)
      })
    })

    it('所有税率应该在合理范围内', () => {
      Object.values(CHURCH_TAX_RATES).forEach(rate => {
        expect(rate).toBeGreaterThanOrEqual(0.08)
        expect(rate).toBeLessThanOrEqual(0.09)
      })
    })
  })

  describe('ETF_EXEMPTION_RATES 常量', () => {
    it('应该包含所有ETF类型的免税率', () => {
      const allETFTypes = Object.values(ETFType)
      allETFTypes.forEach(etfType => {
        expect(ETF_EXEMPTION_RATES).toHaveProperty(etfType)
        expect(typeof ETF_EXEMPTION_RATES[etfType]).toBe('number')
      })
    })

    it('应该有正确的免税率值', () => {
      expect(ETF_EXEMPTION_RATES[ETFType.EQUITY_DOMESTIC]).toBe(0.30)
      expect(ETF_EXEMPTION_RATES[ETFType.EQUITY_FOREIGN]).toBe(0.30)
      expect(ETF_EXEMPTION_RATES[ETFType.MIXED_FUND]).toBe(0.15)
      expect(ETF_EXEMPTION_RATES[ETFType.BOND_FUND]).toBe(0.00)
      expect(ETF_EXEMPTION_RATES[ETFType.REAL_ESTATE]).toBe(0.60)
      expect(ETF_EXEMPTION_RATES[ETFType.COMMODITY]).toBe(0.00)
      expect(ETF_EXEMPTION_RATES[ETFType.OTHER]).toBe(0.00)
    })

    it('所有免税率应该在0-1范围内', () => {
      Object.values(ETF_EXEMPTION_RATES).forEach(rate => {
        expect(rate).toBeGreaterThanOrEqual(0)
        expect(rate).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('GERMAN_STATES 常量', () => {
    it('应该包含所有联邦州的详细信息', () => {
      expect(GERMAN_STATES).toHaveLength(16)

      GERMAN_STATES.forEach(state => {
        expect(state).toHaveProperty('code')
        expect(state).toHaveProperty('name')
        expect(state).toHaveProperty('churchTaxRate')
        expect(typeof state.code).toBe('string')
        expect(typeof state.name).toBe('string')
        expect(typeof state.churchTaxRate).toBe('number')
      })
    })

    it('应该包含特定的联邦州', () => {
      const stateNames = GERMAN_STATES.map(s => s.name)
      expect(stateNames).toContain('Baden-Württemberg')
      expect(stateNames).toContain('Bayern')
      expect(stateNames).toContain('Berlin')
      expect(stateNames).toContain('Nordrhein-Westfalen')
    })

    it('联邦州代码应该是有效的', () => {
      const stateCodes = GERMAN_STATES.map(s => s.code)
      const enumValues = Object.values(GermanState)

      stateCodes.forEach(code => {
        expect(enumValues).toContain(code)
      })
    })
  })
})

describe('GermanTaxTypes - 接口类型测试', () => {
  describe('AbgeltungssteuerConfig 接口', () => {
    let config: AbgeltungssteuerConfig

    beforeEach(() => {
      config = {
        baseTaxRate: 0.25,
        solidarityTaxRate: 0.055,
        churchTax: {
          type: ChurchTaxType.NONE,
          rate: 0,
          state: GermanState.NORTH_RHINE_WESTPHALIA
        },
        enabled: true,
        calculation: {
          includeChurchTax: false,
          includeSolidarityTax: true,
          roundingMethod: 'round',
          decimalPlaces: 2
        }
      }
    })

    it('应该有所有必需的属性', () => {
      expect(config).toHaveProperty('baseTaxRate')
      expect(config).toHaveProperty('solidarityTaxRate')
      expect(config).toHaveProperty('churchTax')
      expect(config).toHaveProperty('enabled')
      expect(config).toHaveProperty('calculation')
    })

    it('churchTax应该有正确的结构', () => {
      expect(config.churchTax).toHaveProperty('type')
      expect(config.churchTax).toHaveProperty('rate')
      expect(config.churchTax).toHaveProperty('state')
    })

    it('calculation应该有正确的结构', () => {
      expect(config.calculation).toHaveProperty('includeChurchTax')
      expect(config.calculation).toHaveProperty('includeSolidarityTax')
      expect(config.calculation).toHaveProperty('roundingMethod')
      expect(config.calculation).toHaveProperty('decimalPlaces')
    })

    it('应该接受有效的税率值', () => {
      config.baseTaxRate = 0.25
      config.solidarityTaxRate = 0.055
      config.churchTax.rate = 0.09

      expect(config.baseTaxRate).toBe(0.25)
      expect(config.solidarityTaxRate).toBe(0.055)
      expect(config.churchTax.rate).toBe(0.09)
    })
  })

  describe('FreistellungsauftragConfig 接口', () => {
    let config: FreistellungsauftragConfig

    beforeEach(() => {
      config = {
        annualAllowance: 801,
        usedAllowance: 0,
        remainingAllowance: 801,
        allocations: [],
        enabled: true,
        options: {
          autoOptimize: true,
          carryForward: false,
          splitBetweenSpouses: false
        }
      }
    })

    it('应该有所有必需的属性', () => {
      expect(config).toHaveProperty('annualAllowance')
      expect(config).toHaveProperty('usedAllowance')
      expect(config).toHaveProperty('remainingAllowance')
      expect(config).toHaveProperty('allocations')
      expect(config).toHaveProperty('enabled')
      expect(config).toHaveProperty('options')
    })

    it('应该有正确的2023年免税额度', () => {
      expect(config.annualAllowance).toBe(801)
    })

    it('options应该有正确的结构', () => {
      expect(config.options).toHaveProperty('autoOptimize')
      expect(config.options).toHaveProperty('carryForward')
      expect(config.options).toHaveProperty('splitBetweenSpouses')
    })

    it('allocations应该是数组', () => {
      expect(Array.isArray(config.allocations)).toBe(true)
    })
  })

  describe('ETFTeilfreistellungConfig 接口', () => {
    let config: ETFTeilfreistellungConfig

    beforeEach(() => {
      config = {
        exemptionRates: ETF_EXEMPTION_RATES,
        enabled: true,
        defaultETFType: ETFType.EQUITY_FOREIGN,
        options: {
          applyToDistributions: true,
          applyToCapitalGains: true,
          minimumHoldingPeriod: 12
        }
      }
    })

    it('应该有所有必需的属性', () => {
      expect(config).toHaveProperty('exemptionRates')
      expect(config).toHaveProperty('enabled')
      expect(config).toHaveProperty('defaultETFType')
      expect(config).toHaveProperty('options')
    })

    it('exemptionRates应该包含所有ETF类型', () => {
      const etfTypes = Object.values(ETFType)
      etfTypes.forEach(etfType => {
        expect(config.exemptionRates).toHaveProperty(etfType)
      })
    })

    it('options应该有正确的结构', () => {
      expect(config.options).toHaveProperty('applyToDistributions')
      expect(config.options).toHaveProperty('applyToCapitalGains')
      expect(config.options).toHaveProperty('minimumHoldingPeriod')
    })

    it('minimumHoldingPeriod应该是合理的值', () => {
      expect(config.options.minimumHoldingPeriod).toBeGreaterThanOrEqual(0)
      expect(config.options.minimumHoldingPeriod).toBeLessThanOrEqual(60)
    })
  })
})

describe('GermanTaxTypes - 默认设置测试', () => {
  describe('DEFAULT_TAX_SETTINGS 常量', () => {
    it('应该有完整的结构', () => {
      expect(DEFAULT_TAX_SETTINGS).toHaveProperty('userInfo')
      expect(DEFAULT_TAX_SETTINGS).toHaveProperty('abgeltungssteuer')
      expect(DEFAULT_TAX_SETTINGS).toHaveProperty('freistellungsauftrag')
      expect(DEFAULT_TAX_SETTINGS).toHaveProperty('etfTeilfreistellung')
      expect(DEFAULT_TAX_SETTINGS).toHaveProperty('advanced')
      expect(DEFAULT_TAX_SETTINGS).toHaveProperty('metadata')
    })

    it('userInfo应该有合理的默认值', () => {
      expect(DEFAULT_TAX_SETTINGS.userInfo.state).toBe(GermanState.NORDRHEIN_WESTFALEN)
      expect(DEFAULT_TAX_SETTINGS.userInfo.churchTaxType).toBe(ChurchTaxType.NONE)
      expect(DEFAULT_TAX_SETTINGS.userInfo.isMarried).toBe(false)
      expect(DEFAULT_TAX_SETTINGS.userInfo.taxYear).toBeGreaterThanOrEqual(2023)
    })

    it('abgeltungssteuer应该有正确的默认值', () => {
      expect(DEFAULT_TAX_SETTINGS.abgeltungssteuer.baseTaxRate).toBe(0.25)
      expect(DEFAULT_TAX_SETTINGS.abgeltungssteuer.solidarityTaxRate).toBe(0.055)
      expect(DEFAULT_TAX_SETTINGS.abgeltungssteuer.enabled).toBe(true)
    })

    it('freistellungsauftrag应该有2023年的免税额度', () => {
      expect(DEFAULT_TAX_SETTINGS.freistellungsauftrag.annualAllowance).toBe(801)
      expect(DEFAULT_TAX_SETTINGS.freistellungsauftrag.usedAllowance).toBe(0)
      expect(DEFAULT_TAX_SETTINGS.freistellungsauftrag.remainingAllowance).toBe(801)
    })

    it('etfTeilfreistellung应该启用并有正确的免税率', () => {
      expect(DEFAULT_TAX_SETTINGS.etfTeilfreistellung.enabled).toBe(true)
      expect(DEFAULT_TAX_SETTINGS.etfTeilfreistellung.exemptionRates).toEqual(ETF_EXEMPTION_RATES)
    })

    it('metadata应该有版本信息', () => {
      expect(DEFAULT_TAX_SETTINGS.metadata).toHaveProperty('version')
      expect(DEFAULT_TAX_SETTINGS.metadata).toHaveProperty('createdAt')
      expect(DEFAULT_TAX_SETTINGS.metadata).toHaveProperty('updatedAt')
    })
  })
})

describe('GermanTaxTypes - 数据一致性测试', () => {
  it('教会税税率应该与联邦州信息一致', () => {
    GERMAN_STATES.forEach(state => {
      expect(CHURCH_TAX_RATES[state.code]).toBe(state.churchTaxRate)
    })
  })

  it('默认设置中的教会税税率应该与联邦州匹配', () => {
    const defaultState = DEFAULT_TAX_SETTINGS.userInfo.state
    const expectedRate = CHURCH_TAX_RATES[defaultState]

    // 当教会税类型为none时，税率应该是0
    if (DEFAULT_TAX_SETTINGS.userInfo.churchTaxType === ChurchTaxType.NONE) {
      expect(DEFAULT_TAX_SETTINGS.abgeltungssteuer.churchTax.rate).toBe(0)
    } else {
      expect(DEFAULT_TAX_SETTINGS.abgeltungssteuer.churchTax.rate).toBe(expectedRate)
    }
  })

  it('ETF免税率应该符合德国法规', () => {
    // 股票ETF应该有30%免税
    expect(ETF_EXEMPTION_RATES[ETFType.EQUITY_DOMESTIC]).toBe(0.30)
    expect(ETF_EXEMPTION_RATES[ETFType.EQUITY_FOREIGN]).toBe(0.30)

    // 房地产ETF应该有最高的60%免税
    expect(ETF_EXEMPTION_RATES[ETFType.REAL_ESTATE]).toBe(0.60)

    // 债券基金应该没有免税
    expect(ETF_EXEMPTION_RATES[ETFType.BOND_FUND]).toBe(0.00)

    // 混合基金应该有15%免税
    expect(ETF_EXEMPTION_RATES[ETFType.MIXED_FUND]).toBe(0.15)
  })

  it('税收计算参数应该在合理范围内', () => {
    // 资本利得税应该是25%
    expect(DEFAULT_TAX_SETTINGS.abgeltungssteuer.baseTaxRate).toBe(0.25)

    // 团结税应该是5.5%
    expect(DEFAULT_TAX_SETTINGS.abgeltungssteuer.solidarityTaxRate).toBe(0.055)

    // 免税额度应该是801€（2023年标准）
    expect(DEFAULT_TAX_SETTINGS.freistellungsauftrag.annualAllowance).toBe(801)
  })
})
