/**
 * 税收计算准确性验证测试套件
 * 使用真实的德国税收案例和官方计算示例验证系统计算结果的准确性
 */

import { describe, it, expect } from 'vitest'
import {
  calculateAbgeltungssteuer,
  calculateFreistellungsauftrag,
  calculateETFTeilfreistellung,
  calculateChurchTax,
  calculateSolidarityTax,
  calculateTotalTaxBurden,
  applyFreistellungsauftragToGains,
  calculateNetReturn
} from '../germanTaxCalculations'
import type {
  GermanTaxConfiguration,
  TaxCalculationResult,
  FreistellungsauftragAllocation
} from '../../types/GermanTaxTypes'

describe('德国税收计算准确性验证', () => {
  // 标准税收配置 - 巴伐利亚州，有教会税
  const standardBavarianConfig: GermanTaxConfiguration = {
    federalState: 'Bayern',
    hasChurchTax: true,
    churchTaxRate: 0.08, // 8%
    freistellungsauftrag: {
      enabled: true,
      totalAmount: 801,
      allocations: []
    },
    etfSettings: {
      enabled: true,
      teilfreistellung: 0.3 // 30%
    },
    customSettings: {
      solidarityTax: true,
      customTaxRate: 0
    }
  }

  describe('Abgeltungssteuer (资本利得税) 计算验证', () => {
    it('应该正确计算标准25%资本利得税', () => {
      const capitalGains = 1000 // 1000欧元资本收益
      const result = calculateAbgeltungssteuer(capitalGains, standardBavarianConfig)
      
      // 25% 资本利得税
      expect(result.baseTax).toBeCloseTo(250, 2)
      expect(result.taxRate).toBe(0.25)
    })

    it('应该正确计算包含团结税的资本利得税', () => {
      const capitalGains = 1000
      const result = calculateAbgeltungssteuer(capitalGains, standardBavarianConfig)
      
      // 团结税 = 资本利得税 * 5.5%
      const expectedSolidarityTax = 250 * 0.055
      expect(result.solidarityTax).toBeCloseTo(expectedSolidarityTax, 2)
    })

    it('应该正确计算包含教会税的资本利得税', () => {
      const capitalGains = 1000
      const result = calculateAbgeltungssteuer(capitalGains, standardBavarianConfig)
      
      // 教会税 = 资本利得税 * 8% (巴伐利亚州)
      const expectedChurchTax = 250 * 0.08
      expect(result.churchTax).toBeCloseTo(expectedChurchTax, 2)
    })

    it('应该正确计算总税负', () => {
      const capitalGains = 1000
      const result = calculateAbgeltungssteuer(capitalGains, standardBavarianConfig)
      
      // 总税负 = 资本利得税 + 团结税 + 教会税
      const expectedTotal = 250 + (250 * 0.055) + (250 * 0.08)
      expect(result.totalTax).toBeCloseTo(expectedTotal, 2)
      expect(result.totalTax).toBeCloseTo(283.75, 2) // 精确值验证
    })

    it('应该正确计算有效税率', () => {
      const capitalGains = 1000
      const result = calculateAbgeltungssteuer(capitalGains, standardBavarianConfig)
      
      // 有效税率 = 总税负 / 资本收益
      const expectedEffectiveRate = 283.75 / 1000
      expect(result.effectiveTaxRate).toBeCloseTo(expectedEffectiveRate, 4)
      expect(result.effectiveTaxRate).toBeCloseTo(0.28375, 4)
    })
  })

  describe('Freistellungsauftrag (免税额度) 计算验证', () => {
    it('应该正确应用801欧元免税额度', () => {
      const capitalGains = 500 // 低于免税额度
      const result = applyFreistellungsauftragToGains(capitalGains, standardBavarianConfig)
      
      expect(result.taxableAmount).toBe(0)
      expect(result.exemptAmount).toBe(500)
      expect(result.remainingExemption).toBe(301) // 801 - 500
    })

    it('应该正确处理超过免税额度的收益', () => {
      const capitalGains = 1200 // 超过免税额度
      const result = applyFreistellungsauftragToGains(capitalGains, standardBavarianConfig)
      
      expect(result.taxableAmount).toBe(399) // 1200 - 801
      expect(result.exemptAmount).toBe(801)
      expect(result.remainingExemption).toBe(0)
    })

    it('应该正确处理多个银行的免税额度分配', () => {
      const configWithAllocations: GermanTaxConfiguration = {
        ...standardBavarianConfig,
        freistellungsauftrag: {
          enabled: true,
          totalAmount: 801,
          allocations: [
            { bankName: '银行A', amount: 400 },
            { bankName: '银行B', amount: 401 }
          ]
        }
      }

      const result = calculateFreistellungsauftrag(configWithAllocations)
      
      expect(result.totalAllocated).toBe(801)
      expect(result.remainingAmount).toBe(0)
      expect(result.allocations).toHaveLength(2)
    })

    it('应该验证免税额度分配不超过总额', () => {
      const configWithOverAllocation: GermanTaxConfiguration = {
        ...standardBavarianConfig,
        freistellungsauftrag: {
          enabled: true,
          totalAmount: 801,
          allocations: [
            { bankName: '银行A', amount: 500 },
            { bankName: '银行B', amount: 500 } // 总计1000，超过801
          ]
        }
      }

      expect(() => {
        calculateFreistellungsauftrag(configWithOverAllocation)
      }).toThrow('免税额度分配总额不能超过801欧元')
    })
  })

  describe('ETF Teilfreistellung (ETF部分免税) 计算验证', () => {
    it('应该正确计算股票ETF的30%部分免税', () => {
      const etfGains = 1000
      const result = calculateETFTeilfreistellung(etfGains, 0.3) // 30%部分免税
      
      expect(result.exemptAmount).toBe(300) // 30%免税
      expect(result.taxableAmount).toBe(700) // 70%需纳税
      expect(result.exemptionRate).toBe(0.3)
    })

    it('应该正确计算混合ETF的15%部分免税', () => {
      const etfGains = 1000
      const result = calculateETFTeilfreistellung(etfGains, 0.15) // 15%部分免税
      
      expect(result.exemptAmount).toBe(150)
      expect(result.taxableAmount).toBe(850)
      expect(result.exemptionRate).toBe(0.15)
    })

    it('应该正确处理债券ETF无部分免税', () => {
      const etfGains = 1000
      const result = calculateETFTeilfreistellung(etfGains, 0) // 无部分免税
      
      expect(result.exemptAmount).toBe(0)
      expect(result.taxableAmount).toBe(1000)
      expect(result.exemptionRate).toBe(0)
    })

    it('应该结合免税额度和ETF部分免税计算', () => {
      const etfGains = 1000
      const configWithETF = { ...standardBavarianConfig }
      
      // 先应用ETF部分免税
      const etfResult = calculateETFTeilfreistellung(etfGains, 0.3)
      expect(etfResult.taxableAmount).toBe(700)
      
      // 再应用免税额度
      const freistellungResult = applyFreistellungsauftragToGains(
        etfResult.taxableAmount, 
        configWithETF
      )
      expect(freistellungResult.taxableAmount).toBe(0) // 700 < 801
      expect(freistellungResult.exemptAmount).toBe(700)
    })
  })

  describe('教会税计算验证', () => {
    const testCases = [
      { state: 'Bayern', rate: 0.08, name: '巴伐利亚州' },
      { state: 'Baden-Württemberg', rate: 0.08, name: '巴登-符腾堡州' },
      { state: 'Hessen', rate: 0.09, name: '黑森州' },
      { state: 'Nordrhein-Westfalen', rate: 0.09, name: '北莱茵-威斯特法伦州' },
      { state: 'Berlin', rate: 0.09, name: '柏林' },
      { state: 'Hamburg', rate: 0.09, name: '汉堡' }
    ]

    testCases.forEach(({ state, rate, name }) => {
      it(`应该正确计算${name}的教会税 (${rate * 100}%)`, () => {
        const baseTax = 250 // 250欧元资本利得税
        const result = calculateChurchTax(baseTax, rate)
        
        const expectedChurchTax = baseTax * rate
        expect(result).toBeCloseTo(expectedChurchTax, 2)
      })
    })

    it('应该正确处理无教会税的情况', () => {
      const baseTax = 250
      const result = calculateChurchTax(baseTax, 0)
      
      expect(result).toBe(0)
    })
  })

  describe('团结税计算验证', () => {
    it('应该正确计算5.5%团结税', () => {
      const baseTax = 250
      const result = calculateSolidarityTax(baseTax)
      
      const expectedSolidarityTax = baseTax * 0.055
      expect(result).toBeCloseTo(expectedSolidarityTax, 2)
      expect(result).toBeCloseTo(13.75, 2)
    })

    it('应该处理团结税豁免阈值', () => {
      // 注意：实际的团结税有豁免阈值，但在资本利得税中通常不适用
      const smallBaseTax = 10
      const result = calculateSolidarityTax(smallBaseTax)
      
      expect(result).toBeCloseTo(0.55, 2)
    })
  })

  describe('复杂场景综合计算验证', () => {
    it('应该正确计算复杂的ETF投资场景', () => {
      // 场景：投资者在巴伐利亚州，有教会税，投资股票ETF
      const etfGains = 2000
      const config = standardBavarianConfig
      
      // 1. 应用ETF部分免税 (30%)
      const etfResult = calculateETFTeilfreistellung(etfGains, 0.3)
      expect(etfResult.taxableAmount).toBe(1400) // 2000 * 0.7
      
      // 2. 应用免税额度
      const freistellungResult = applyFreistellungsauftragToGains(
        etfResult.taxableAmount, 
        config
      )
      expect(freistellungResult.taxableAmount).toBe(599) // 1400 - 801
      
      // 3. 计算最终税负
      const finalTax = calculateAbgeltungssteuer(
        freistellungResult.taxableAmount, 
        config
      )
      
      // 验证计算结果
      const expectedBaseTax = 599 * 0.25 // 149.75
      const expectedSolidarityTax = expectedBaseTax * 0.055 // 8.24
      const expectedChurchTax = expectedBaseTax * 0.08 // 11.98
      const expectedTotal = expectedBaseTax + expectedSolidarityTax + expectedChurchTax // 169.97
      
      expect(finalTax.baseTax).toBeCloseTo(expectedBaseTax, 2)
      expect(finalTax.solidarityTax).toBeCloseTo(expectedSolidarityTax, 2)
      expect(finalTax.churchTax).toBeCloseTo(expectedChurchTax, 2)
      expect(finalTax.totalTax).toBeCloseTo(expectedTotal, 2)
    })

    it('应该正确计算多种投资类型的组合税负', () => {
      // 场景：投资者有股票收益、债券收益和ETF收益
      const stockGains = 1000
      const bondGains = 500
      const etfGains = 800
      
      const config = standardBavarianConfig
      
      // 股票收益 - 直接纳税
      const stockTaxable = applyFreistellungsauftragToGains(stockGains, config)
      
      // 债券收益 - 使用剩余免税额度
      const remainingConfig = {
        ...config,
        freistellungsauftrag: {
          ...config.freistellungsauftrag,
          totalAmount: stockTaxable.remainingExemption
        }
      }
      const bondTaxable = applyFreistellungsauftragToGains(bondGains, remainingConfig)
      
      // ETF收益 - 先部分免税，再使用剩余免税额度
      const etfPartialExempt = calculateETFTeilfreistellung(etfGains, 0.3)
      const finalRemainingConfig = {
        ...config,
        freistellungsauftrag: {
          ...config.freistellungsauftrag,
          totalAmount: bondTaxable.remainingExemption
        }
      }
      const etfTaxable = applyFreistellungsauftragToGains(
        etfPartialExempt.taxableAmount, 
        finalRemainingConfig
      )
      
      // 计算总税负
      const totalTaxableAmount = stockTaxable.taxableAmount + 
                                bondTaxable.taxableAmount + 
                                etfTaxable.taxableAmount
      
      const totalTax = calculateAbgeltungssteuer(totalTaxableAmount, config)
      
      // 验证结果合理性
      expect(totalTaxableAmount).toBeGreaterThan(0)
      expect(totalTax.totalTax).toBeGreaterThan(0)
      expect(totalTax.effectiveTaxRate).toBeLessThan(0.3) // 有效税率应小于30%
    })
  })

  describe('边界值和精度测试', () => {
    it('应该正确处理极小金额', () => {
      const smallAmount = 0.01 // 1分
      const result = calculateAbgeltungssteuer(smallAmount, standardBavarianConfig)
      
      expect(result.baseTax).toBeCloseTo(0.0025, 4)
      expect(result.totalTax).toBeCloseTo(0.00284, 5)
    })

    it('应该正确处理大金额', () => {
      const largeAmount = 1000000 // 100万欧元
      const result = calculateAbgeltungssteuer(largeAmount, standardBavarianConfig)
      
      expect(result.baseTax).toBe(250000)
      expect(result.totalTax).toBeCloseTo(283750, 2)
    })

    it('应该正确处理零金额', () => {
      const zeroAmount = 0
      const result = calculateAbgeltungssteuer(zeroAmount, standardBavarianConfig)
      
      expect(result.baseTax).toBe(0)
      expect(result.solidarityTax).toBe(0)
      expect(result.churchTax).toBe(0)
      expect(result.totalTax).toBe(0)
      expect(result.effectiveTaxRate).toBe(0)
    })

    it('应该正确处理负数金额（亏损）', () => {
      const lossAmount = -1000
      const result = calculateAbgeltungssteuer(lossAmount, standardBavarianConfig)
      
      // 亏损不产生税负
      expect(result.baseTax).toBe(0)
      expect(result.totalTax).toBe(0)
    })

    it('应该保持计算精度', () => {
      const amount = 333.33 // 测试除法精度
      const result = calculateAbgeltungssteuer(amount, standardBavarianConfig)
      
      // 验证精度保持在合理范围内
      expect(result.baseTax).toBeCloseTo(83.3325, 4)
      expect(result.totalTax).toBeCloseTo(94.6246, 4)
    })
  })

  describe('实际案例验证', () => {
    it('案例1：普通投资者年度股票收益', () => {
      // 案例：巴伐利亚州投资者，年度股票收益1500欧元，有教会税
      const gains = 1500
      const config = standardBavarianConfig
      
      // 应用免税额度
      const afterExemption = applyFreistellungsauftragToGains(gains, config)
      expect(afterExemption.taxableAmount).toBe(699) // 1500 - 801
      
      // 计算税负
      const tax = calculateAbgeltungssteuer(afterExemption.taxableAmount, config)
      expect(tax.totalTax).toBeCloseTo(198.42, 2)
      
      // 净收益
      const netGains = gains - tax.totalTax
      expect(netGains).toBeCloseTo(1301.58, 2)
    })

    it('案例2：ETF投资者复杂场景', () => {
      // 案例：投资者持有多种ETF，总收益3000欧元
      const stockETFGains = 2000 // 股票ETF，30%部分免税
      const mixedETFGains = 1000 // 混合ETF，15%部分免税
      
      const config = standardBavarianConfig
      
      // 分别计算部分免税
      const stockETFTaxable = calculateETFTeilfreistellung(stockETFGains, 0.3)
      const mixedETFTaxable = calculateETFTeilfreistellung(mixedETFGains, 0.15)
      
      // 总应税金额
      const totalTaxable = stockETFTaxable.taxableAmount + mixedETFTaxable.taxableAmount
      expect(totalTaxable).toBe(2250) // 1400 + 850
      
      // 应用免税额度
      const afterExemption = applyFreistellungsauftragToGains(totalTaxable, config)
      expect(afterExemption.taxableAmount).toBe(1449) // 2250 - 801
      
      // 计算最终税负
      const finalTax = calculateAbgeltungssteuer(afterExemption.taxableAmount, config)
      expect(finalTax.totalTax).toBeCloseTo(411.39, 2)
      
      // 验证有效税率
      const effectiveRate = finalTax.totalTax / 3000
      expect(effectiveRate).toBeCloseTo(0.1371, 4) // 约13.71%
    })

    it('案例3：高收入投资者', () => {
      // 案例：高收入投资者，年度资本收益50000欧元
      const gains = 50000
      const config = standardBavarianConfig
      
      // 免税额度相对较小
      const afterExemption = applyFreistellungsauftragToGains(gains, config)
      expect(afterExemption.taxableAmount).toBe(49199) // 50000 - 801
      
      // 计算税负
      const tax = calculateAbgeltungssteuer(afterExemption.taxableAmount, config)
      expect(tax.totalTax).toBeCloseTo(13959.72, 2)
      
      // 有效税率接近最高税率
      const effectiveRate = tax.totalTax / gains
      expect(effectiveRate).toBeCloseTo(0.2792, 4) // 约27.92%
    })
  })

  describe('不同联邦州税率对比验证', () => {
    const federalStates = [
      { name: 'Bayern', churchTaxRate: 0.08 },
      { name: 'Hessen', churchTaxRate: 0.09 },
      { name: 'Berlin', churchTaxRate: 0.09 },
      { name: 'Sachsen', churchTaxRate: 0.09 }
    ]

    federalStates.forEach(({ name, churchTaxRate }) => {
      it(`应该正确计算${name}的税负`, () => {
        const gains = 1000
        const config: GermanTaxConfiguration = {
          ...standardBavarianConfig,
          federalState: name as any,
          churchTaxRate
        }
        
        const result = calculateAbgeltungssteuer(gains, config)
        
        // 验证教会税率差异
        const expectedChurchTax = 250 * churchTaxRate
        expect(result.churchTax).toBeCloseTo(expectedChurchTax, 2)
        
        // 验证总税负
        const expectedTotal = 250 + (250 * 0.055) + expectedChurchTax
        expect(result.totalTax).toBeCloseTo(expectedTotal, 2)
      })
    })
  })
})
