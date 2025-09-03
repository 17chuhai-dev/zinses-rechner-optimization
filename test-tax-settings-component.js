/**
 * TaxSettings组件测试
 * 验证德国税收设置界面组件的功能和用户交互
 */

// 模拟TaxSettings组件功能
class MockTaxSettingsComponent {
  constructor() {
    // 默认设置
    this.settings = {
      userInfo: {
        state: 'NW',
        churchTaxType: 'none',
        isMarried: false,
        taxYear: 2024
      },
      abgeltungssteuer: {
        baseTaxRate: 0.25,
        solidarityTaxRate: 0.055,
        churchTax: {
          type: 'none',
          rate: 0,
          state: 'NW'
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
      },
      etfTeilfreistellung: {
        exemptionRates: {
          'equity_domestic': 0.30,
          'equity_foreign': 0.30,
          'mixed_fund': 0.15,
          'bond_fund': 0.00,
          'real_estate': 0.60,
          'commodity': 0.00,
          'other': 0.00
        },
        enabled: true,
        defaultETFType: 'equity_foreign',
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
      }
    }

    this.validationErrors = []
    this.isSaving = false
    this.eventCallbacks = new Map()

    // 德国联邦州列表
    this.germanStates = [
      { code: 'BW', name: 'Baden-Württemberg' },
      { code: 'BY', name: 'Bayern' },
      { code: 'BE', name: 'Berlin' },
      { code: 'NW', name: 'Nordrhein-Westfalen' },
      // 简化列表，实际应包含所有16个州
    ]

    // 教会税税率
    this.churchTaxRates = {
      'BW': 0.09, 'BY': 0.08, 'BE': 0.09, 'NW': 0.09
    }

    console.log('🏛️ TaxSettings组件已初始化')
  }

  // 更新教会税税率
  updateChurchTaxRate() {
    const state = this.settings.userInfo.state
    const churchType = this.settings.userInfo.churchTaxType
    
    if (churchType === 'none') {
      this.settings.abgeltungssteuer.churchTax.rate = 0
      this.settings.abgeltungssteuer.calculation.includeChurchTax = false
    } else {
      this.settings.abgeltungssteuer.churchTax.rate = this.churchTaxRates[state] || 0.09
    }
    
    this.settings.abgeltungssteuer.churchTax.type = churchType
    this.settings.abgeltungssteuer.churchTax.state = state
    
    this.triggerEvent('churchTaxUpdated', { state, churchType, rate: this.settings.abgeltungssteuer.churchTax.rate })
  }

  // 更新剩余免税额度
  updateRemainingAllowance() {
    const annual = this.settings.freistellungsauftrag.annualAllowance
    const used = this.settings.freistellungsauftrag.usedAllowance
    this.settings.freistellungsauftrag.remainingAllowance = Math.max(0, annual - used)
    
    this.triggerEvent('allowanceUpdated', { 
      annual, 
      used, 
      remaining: this.settings.freistellungsauftrag.remainingAllowance 
    })
  }

  // 添加免税额度分配
  addAllocation() {
    const newAllocation = {
      id: `allocation_${Date.now()}`,
      bankName: '',
      allocatedAmount: 0,
      usedAmount: 0,
      remainingAmount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.settings.freistellungsauftrag.allocations.push(newAllocation)
    this.triggerEvent('allocationAdded', newAllocation)
    return newAllocation
  }

  // 移除免税额度分配
  removeAllocation(index) {
    if (index >= 0 && index < this.settings.freistellungsauftrag.allocations.length) {
      const removed = this.settings.freistellungsauftrag.allocations.splice(index, 1)[0]
      this.triggerEvent('allocationRemoved', removed)
      return removed
    }
    return null
  }

  // 更新分配剩余金额
  updateAllocationRemaining(index) {
    const allocation = this.settings.freistellungsauftrag.allocations[index]
    if (allocation) {
      allocation.remainingAmount = Math.max(0, allocation.allocatedAmount - allocation.usedAmount)
      allocation.updatedAt = new Date()
      this.triggerEvent('allocationUpdated', allocation)
    }
  }

  // 计算总税率
  getTotalTaxRate() {
    let rate = 0
    
    if (this.settings.abgeltungssteuer.enabled) {
      rate += this.settings.abgeltungssteuer.baseTaxRate // 25%
      
      if (this.settings.abgeltungssteuer.calculation.includeSolidarityTax) {
        rate += this.settings.abgeltungssteuer.baseTaxRate * this.settings.abgeltungssteuer.solidarityTaxRate // 5.5% of 25%
      }
      
      if (this.settings.abgeltungssteuer.calculation.includeChurchTax) {
        rate += this.settings.abgeltungssteuer.baseTaxRate * this.settings.abgeltungssteuer.churchTax.rate // 8-9% of 25%
      }
    }
    
    return rate * 100
  }

  // 计算免税额度使用百分比
  getAllowanceUsagePercentage() {
    const total = this.settings.freistellungsauftrag.annualAllowance
    const used = this.settings.freistellungsauftrag.usedAllowance
    return total > 0 ? (used / total) * 100 : 0
  }

  // 获取ETF类型名称
  getETFTypeName(etfType) {
    const names = {
      'equity_domestic': 'Inländische Aktien-ETFs',
      'equity_foreign': 'Ausländische Aktien-ETFs',
      'mixed_fund': 'Mischfonds',
      'bond_fund': 'Rentenfonds',
      'real_estate': 'Immobilienfonds',
      'commodity': 'Rohstofffonds',
      'other': 'Sonstige'
    }
    return names[etfType] || etfType
  }

  // 验证设置
  validateSettings() {
    const errors = []

    // 验证基础税率
    if (this.settings.abgeltungssteuer.baseTaxRate < 0 || this.settings.abgeltungssteuer.baseTaxRate > 1) {
      errors.push('Abgeltungssteuersatz muss zwischen 0% und 100% liegen')
    }

    // 验证免税额度
    if (this.settings.freistellungsauftrag.annualAllowance < 0) {
      errors.push('Jährlicher Freibetrag kann nicht negativ sein')
    }

    if (this.settings.freistellungsauftrag.usedAllowance > this.settings.freistellungsauftrag.annualAllowance) {
      errors.push('Verwendeter Freibetrag kann nicht größer als der jährliche Freibetrag sein')
    }

    // 验证联邦州
    if (!this.settings.userInfo.state) {
      errors.push('Bitte wählen Sie ein Bundesland aus')
    }

    this.validationErrors = errors
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 保存设置
  async saveTaxSettings() {
    const validation = this.validateSettings()
    if (!validation.isValid) {
      this.triggerEvent('validationError', validation.errors)
      return false
    }
    
    this.isSaving = true
    this.triggerEvent('saveStart')
    
    try {
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 更新元数据
      this.settings.metadata = {
        version: '1.0.0',
        updatedAt: new Date(),
        lastUsed: new Date()
      }
      
      this.triggerEvent('settingsSaved', this.settings)
      return true
      
    } catch (error) {
      this.triggerEvent('saveError', error)
      return false
    } finally {
      this.isSaving = false
      this.triggerEvent('saveComplete')
    }
  }

  // 重置为默认值
  resetToDefaults() {
    const defaultSettings = {
      userInfo: {
        state: 'NW',
        churchTaxType: 'none',
        isMarried: false,
        taxYear: new Date().getFullYear()
      },
      abgeltungssteuer: {
        baseTaxRate: 0.25,
        solidarityTaxRate: 0.055,
        churchTax: { type: 'none', rate: 0, state: 'NW' },
        enabled: true,
        calculation: {
          includeChurchTax: false,
          includeSolidarityTax: true,
          roundingMethod: 'round',
          decimalPlaces: 2
        }
      },
      freistellungsauftrag: {
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
      },
      etfTeilfreistellung: {
        exemptionRates: {
          'equity_domestic': 0.30, 'equity_foreign': 0.30, 'mixed_fund': 0.15,
          'bond_fund': 0.00, 'real_estate': 0.60, 'commodity': 0.00, 'other': 0.00
        },
        enabled: true,
        defaultETFType: 'equity_foreign',
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
      }
    }
    
    this.settings = defaultSettings
    this.validationErrors = []
    this.triggerEvent('settingsReset')
  }

  // 导出设置
  exportSettings() {
    const exportData = {
      ...this.settings,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    
    this.triggerEvent('settingsExported', exportData)
    return exportData
  }

  // 事件系统
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, [])
    }
    this.eventCallbacks.get(event).push(callback)
  }

  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      const callbacks = this.eventCallbacks.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  triggerEvent(event, data) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`事件回调执行失败 (${event}):`, error)
        }
      })
    }
  }
}

// 测试函数
async function runTaxSettingsComponentTests() {
  console.log('🧪 开始TaxSettings组件测试...\n')
  
  const component = new MockTaxSettingsComponent()
  
  let passed = 0
  let failed = 0
  
  function test(description, condition) {
    if (condition) {
      console.log(`✅ ${description}`)
      passed++
    } else {
      console.log(`❌ ${description}`)
      failed++
    }
  }
  
  // 测试1: 组件初始化
  console.log('🏗️ 测试组件初始化:')
  
  test('组件应该正确初始化', component.settings !== null)
  test('默认设置应该有效', component.settings.abgeltungssteuer.enabled === true)
  test('免税额度应该是801€', component.settings.freistellungsauftrag.annualAllowance === 801)
  test('ETF部分免税应该启用', component.settings.etfTeilfreistellung.enabled === true)
  test('高级设置应该启用', component.settings.advanced.enableDetailedCalculation === true)
  
  // 测试2: 教会税更新
  console.log('\n⛪ 测试教会税更新:')
  
  let churchTaxUpdated = false
  component.on('churchTaxUpdated', () => { churchTaxUpdated = true })
  
  // 设置巴伐利亚州和天主教
  component.settings.userInfo.state = 'BY'
  component.settings.userInfo.churchTaxType = 'catholic'
  component.updateChurchTaxRate()
  
  test('教会税更新事件应该触发', churchTaxUpdated === true)
  test('巴伐利亚州教会税应该是8%', component.settings.abgeltungssteuer.churchTax.rate === 0.08)
  test('教会税类型应该更新', component.settings.abgeltungssteuer.churchTax.type === 'catholic')
  
  // 测试无教会税
  component.settings.userInfo.churchTaxType = 'none'
  component.updateChurchTaxRate()
  
  test('无教会税时税率应该是0%', component.settings.abgeltungssteuer.churchTax.rate === 0)
  test('无教会税时不应包含教会税', component.settings.abgeltungssteuer.calculation.includeChurchTax === false)
  
  // 测试3: 免税额度管理
  console.log('\n💰 测试免税额度管理:')
  
  let allowanceUpdated = false
  component.on('allowanceUpdated', () => { allowanceUpdated = true })
  
  // 设置已使用额度
  component.settings.freistellungsauftrag.usedAllowance = 300
  component.updateRemainingAllowance()
  
  test('免税额度更新事件应该触发', allowanceUpdated === true)
  test('剩余免税额度应该正确计算', component.settings.freistellungsauftrag.remainingAllowance === 501)
  
  const usagePercentage = component.getAllowanceUsagePercentage()
  test('免税额度使用百分比应该正确', Math.abs(usagePercentage - 37.45) < 0.1) // 300/801 ≈ 37.45%
  
  // 测试4: 免税额度分配
  console.log('\n🏦 测试免税额度分配:')
  
  let allocationAdded = false
  let allocationRemoved = false
  component.on('allocationAdded', () => { allocationAdded = true })
  component.on('allocationRemoved', () => { allocationRemoved = true })
  
  // 添加分配
  const allocation1 = component.addAllocation()
  test('分配添加事件应该触发', allocationAdded === true)
  test('分配应该有唯一ID', allocation1.id.startsWith('allocation_'))
  test('分配列表应该包含新分配', component.settings.freistellungsauftrag.allocations.length === 1)
  
  // 添加第二个分配
  const allocation2 = component.addAllocation()
  allocation2.bankName = 'Test Bank'
  allocation2.allocatedAmount = 400
  
  // 更新分配剩余金额
  component.updateAllocationRemaining(1)
  test('分配剩余金额应该正确计算', allocation2.remainingAmount === 400)
  
  // 移除分配
  const removed = component.removeAllocation(0)
  test('分配移除事件应该触发', allocationRemoved === true)
  test('应该返回被移除的分配', removed.id === allocation1.id)
  test('分配列表应该减少', component.settings.freistellungsauftrag.allocations.length === 1)
  
  // 测试5: 总税率计算
  console.log('\n📊 测试总税率计算:')
  
  // 只有资本利得税和团结税
  component.settings.abgeltungssteuer.enabled = true
  component.settings.abgeltungssteuer.calculation.includeSolidarityTax = true
  component.settings.abgeltungssteuer.calculation.includeChurchTax = false
  
  const taxRateWithoutChurch = component.getTotalTaxRate()
  test('不含教会税的总税率应该正确', Math.abs(taxRateWithoutChurch - 26.375) < 0.01) // 25% + 25% * 5.5%
  
  // 添加教会税
  component.settings.userInfo.state = 'NW'
  component.settings.userInfo.churchTaxType = 'catholic'
  component.updateChurchTaxRate()
  component.settings.abgeltungssteuer.calculation.includeChurchTax = true
  
  const taxRateWithChurch = component.getTotalTaxRate()
  test('含教会税的总税率应该更高', taxRateWithChurch > taxRateWithoutChurch)
  test('含教会税的总税率应该正确', Math.abs(taxRateWithChurch - 28.625) < 0.01) // 26.375% + 25% * 9%
  
  // 测试6: ETF类型名称
  console.log('\n📈 测试ETF类型名称:')
  
  test('股票ETF名称应该正确', component.getETFTypeName('equity_foreign') === 'Ausländische Aktien-ETFs')
  test('房地产ETF名称应该正确', component.getETFTypeName('real_estate') === 'Immobilienfonds')
  test('债券基金名称应该正确', component.getETFTypeName('bond_fund') === 'Rentenfonds')
  test('未知类型应该返回原值', component.getETFTypeName('unknown_type') === 'unknown_type')
  
  // 测试7: 设置验证
  console.log('\n✅ 测试设置验证:')
  
  // 有效设置
  const validValidation = component.validateSettings()
  test('默认设置应该有效', validValidation.isValid === true)
  test('有效设置应该无错误', validValidation.errors.length === 0)
  
  // 无效设置 - 无联邦州
  component.settings.userInfo.state = ''
  const invalidValidation1 = component.validateSettings()
  test('无联邦州应该无效', invalidValidation1.isValid === false)
  test('应该有联邦州错误', invalidValidation1.errors.some(e => e.includes('Bundesland')))
  
  // 恢复有效状态
  component.settings.userInfo.state = 'NW'
  
  // 无效设置 - 免税额度超限
  component.settings.freistellungsauftrag.usedAllowance = 1000
  const invalidValidation2 = component.validateSettings()
  test('超限免税额度应该无效', invalidValidation2.isValid === false)
  test('应该有免税额度错误', invalidValidation2.errors.some(e => e.includes('Freibetrag')))
  
  // 测试8: 保存功能
  console.log('\n💾 测试保存功能:')
  
  // 恢复有效设置
  component.resetToDefaults()
  
  let saveStarted = false
  let settingsSaved = false
  let saveCompleted = false
  
  component.on('saveStart', () => { saveStarted = true })
  component.on('settingsSaved', () => { settingsSaved = true })
  component.on('saveComplete', () => { saveCompleted = true })
  
  const saveResult = await component.saveTaxSettings()
  
  test('保存应该成功', saveResult === true)
  test('保存开始事件应该触发', saveStarted === true)
  test('设置保存事件应该触发', settingsSaved === true)
  test('保存完成事件应该触发', saveCompleted === true)
  test('保存后不应处于保存状态', component.isSaving === false)
  
  // 测试9: 重置功能
  console.log('\n🔄 测试重置功能:')
  
  // 修改一些设置
  component.settings.userInfo.isMarried = true
  component.settings.freistellungsauftrag.usedAllowance = 200
  component.addAllocation()
  
  let settingsReset = false
  component.on('settingsReset', () => { settingsReset = true })
  
  component.resetToDefaults()
  
  test('重置事件应该触发', settingsReset === true)
  test('婚姻状况应该重置', component.settings.userInfo.isMarried === false)
  test('免税额度使用应该重置', component.settings.freistellungsauftrag.usedAllowance === 0)
  test('分配列表应该清空', component.settings.freistellungsauftrag.allocations.length === 0)
  test('验证错误应该清空', component.validationErrors.length === 0)
  
  // 测试10: 导出功能
  console.log('\n📤 测试导出功能:')
  
  let settingsExported = false
  let exportedData = null
  component.on('settingsExported', (data) => { 
    settingsExported = true
    exportedData = data
  })
  
  const exportResult = component.exportSettings()
  
  test('导出事件应该触发', settingsExported === true)
  test('导出应该返回数据', exportResult !== null)
  test('导出数据应该包含设置', exportResult.userInfo !== undefined)
  test('导出数据应该包含时间戳', exportResult.exportedAt !== undefined)
  test('导出数据应该包含版本', exportResult.version !== undefined)
  test('事件数据应该与返回数据一致', exportedData === exportResult)
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  // 输出功能覆盖情况
  console.log('\n🎯 功能覆盖情况:')
  console.log(`   ✅ 组件初始化 - 默认设置和状态管理`)
  console.log(`   ✅ 教会税更新 - 联邦州和宗教类型处理`)
  console.log(`   ✅ 免税额度管理 - 使用情况计算和显示`)
  console.log(`   ✅ 免税额度分配 - 添加、移除和更新分配`)
  console.log(`   ✅ 总税率计算 - 复合税率计算逻辑`)
  console.log(`   ✅ ETF类型名称 - 德语本地化显示`)
  console.log(`   ✅ 设置验证 - 输入验证和错误处理`)
  console.log(`   ✅ 保存功能 - 异步保存和状态管理`)
  console.log(`   ✅ 重置功能 - 恢复默认设置`)
  console.log(`   ✅ 导出功能 - 设置数据导出`)
  
  if (failed === 0) {
    console.log('\n🎉 所有TaxSettings组件测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查组件实现。')
    return false
  }
}

// 运行测试
runTaxSettingsComponentTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
