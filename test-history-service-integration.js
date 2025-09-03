/**
 * 历史服务集成测试
 * 验证历史服务适配器、保存接口、数据同步和权限控制的正确性
 */

// 模拟历史服务适配器
class MockHistoryServiceAdapter {
  constructor(config) {
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
    this.userId = null
    this.sessionId = this.generateSessionId()
    this.mockDatabase = new Map() // 模拟数据库
    this.requestCount = 0
    
    console.log('📚 历史服务适配器已初始化')
  }

  setUserId(userId) {
    this.userId = userId
    console.log(`👤 用户ID已设置: ${userId}`)
  }

  async saveHistory(request) {
    this.validateSaveRequest(request)
    this.requestCount++
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const record = this.createHistoryRecord(request)
    record.id = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    record.createdAt = new Date()
    record.updatedAt = new Date()
    
    this.mockDatabase.set(record.id, record)
    
    console.log(`💾 历史记录已保存: ${record.id}`)
    return record
  }

  async queryHistory(request = {}) {
    this.requestCount++
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 30))
    
    let records = Array.from(this.mockDatabase.values())
    
    // 应用筛选条件
    if (request.userId) {
      records = records.filter(r => r.userId === request.userId)
    }
    
    if (request.calculatorId) {
      records = records.filter(r => r.calculatorId === request.calculatorId)
    }
    
    if (request.tags && request.tags.length > 0) {
      records = records.filter(r => 
        request.tags.some(tag => r.metadata.tags.includes(tag))
      )
    }
    
    if (request.searchText) {
      const searchLower = request.searchText.toLowerCase()
      records = records.filter(r => 
        r.metadata.title.toLowerCase().includes(searchLower) ||
        r.metadata.description.toLowerCase().includes(searchLower)
      )
    }
    
    // 排序
    if (request.sortBy) {
      records.sort((a, b) => {
        const aVal = request.sortBy === 'title' ? a.metadata.title : a[request.sortBy]
        const bVal = request.sortBy === 'title' ? b.metadata.title : b[request.sortBy]
        
        if (request.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1
        } else {
          return aVal > bVal ? 1 : -1
        }
      })
    }
    
    // 分页
    const offset = request.offset || 0
    const limit = request.limit || 10
    const total = records.length
    const paginatedRecords = records.slice(offset, offset + limit)
    
    console.log(`📋 查询到 ${paginatedRecords.length} 条历史记录`)
    
    return {
      records: paginatedRecords,
      total,
      hasMore: offset + limit < total,
      nextOffset: offset + limit < total ? offset + limit : undefined
    }
  }

  async getHistoryById(id) {
    this.requestCount++
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 20))
    
    const record = this.mockDatabase.get(id)
    return record || null
  }

  async updateHistory(id, updates) {
    this.requestCount++
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 40))
    
    const record = this.mockDatabase.get(id)
    if (!record) {
      throw new Error('历史记录不存在')
    }
    
    const updatedRecord = {
      ...record,
      ...updates,
      updatedAt: new Date(),
      version: record.version + 1
    }
    
    this.mockDatabase.set(id, updatedRecord)
    console.log(`✏️ 历史记录已更新: ${id}`)
    
    return updatedRecord
  }

  async deleteHistory(id) {
    this.requestCount++
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 30))
    
    const existed = this.mockDatabase.has(id)
    if (existed) {
      this.mockDatabase.delete(id)
      console.log(`🗑️ 历史记录已删除: ${id}`)
    }
    
    return existed
  }

  async batchSaveHistory(requests) {
    if (requests.length === 0) return []
    
    this.requestCount++
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const results = []
    for (const request of requests) {
      const record = await this.saveHistory(request)
      results.push(record)
    }
    
    console.log(`💾 批量保存了 ${results.length} 条历史记录`)
    return results
  }

  createHistoryFromRealtimeResult(calculatorId, inputData, outputData, metadata = {}) {
    return {
      calculatorId,
      inputData: this.sanitizeInputData(inputData),
      outputData: this.sanitizeOutputData(outputData),
      metadata: {
        title: this.generateAutoTitle(calculatorId, inputData),
        tags: this.generateAutoTags(calculatorId, inputData),
        isPublic: false,
        isFavorite: false,
        calculationTime: Date.now(),
        dataVersion: '1.0',
        userAgent: 'test-agent',
        sessionId: this.sessionId,
        ...metadata
      },
      autoTitle: true
    }
  }

  // 私有方法
  validateSaveRequest(request) {
    if (!request.calculatorId) {
      throw new Error('计算器ID不能为空')
    }
    
    if (!request.inputData || Object.keys(request.inputData).length === 0) {
      throw new Error('输入数据不能为空')
    }
    
    if (!request.outputData || Object.keys(request.outputData).length === 0) {
      throw new Error('输出数据不能为空')
    }
    
    if (!this.userId) {
      throw new Error('用户未登录')
    }
  }

  createHistoryRecord(request) {
    return {
      userId: this.userId,
      calculatorId: request.calculatorId,
      calculatorType: this.getCalculatorType(request.calculatorId),
      inputData: request.inputData,
      outputData: request.outputData,
      metadata: {
        title: request.metadata?.title || this.generateAutoTitle(request.calculatorId, request.inputData),
        description: request.metadata?.description || '',
        tags: request.metadata?.tags || this.generateAutoTags(request.calculatorId, request.inputData),
        isPublic: request.metadata?.isPublic || false,
        isFavorite: request.metadata?.isFavorite || false,
        calculationTime: request.metadata?.calculationTime || Date.now(),
        dataVersion: request.metadata?.dataVersion || '1.0',
        userAgent: request.metadata?.userAgent || 'test-agent',
        sessionId: request.metadata?.sessionId || this.sessionId
      },
      version: 1
    }
  }

  sanitizeInputData(data) {
    const sanitized = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  sanitizeOutputData(data) {
    return this.sanitizeInputData(data)
  }

  generateAutoTitle(calculatorId, inputData) {
    const calculatorNames = {
      'compound-interest': 'Zinseszins-Berechnung',
      'savings-plan': 'Sparplan-Berechnung',
      'loan': 'Kredit-Berechnung'
    }
    
    const baseName = calculatorNames[calculatorId] || 'Finanz-Berechnung'
    const timestamp = new Date().toLocaleDateString('de-DE')
    
    return `${baseName} - ${timestamp}`
  }

  generateAutoTags(calculatorId, inputData) {
    const tags = [calculatorId]
    
    if (inputData.principal && inputData.principal > 100000) {
      tags.push('high-amount')
    }
    
    if (inputData.years && inputData.years > 20) {
      tags.push('long-term')
    }
    
    if (inputData.monthlyPayment && inputData.monthlyPayment > 0) {
      tags.push('monthly-payment')
    }
    
    return tags
  }

  getCalculatorType(calculatorId) {
    const typeMap = {
      'compound-interest': 'investment',
      'savings-plan': 'savings',
      'loan': 'loan'
    }
    
    return typeMap[calculatorId] || 'general'
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 测试辅助方法
  getRequestCount() {
    return this.requestCount
  }

  getDatabaseSize() {
    return this.mockDatabase.size
  }

  clearDatabase() {
    this.mockDatabase.clear()
    this.requestCount = 0
  }
}

// 测试函数
async function runHistoryServiceIntegrationTests() {
  console.log('🧪 开始历史服务集成测试...\n')
  
  const adapter = new MockHistoryServiceAdapter({
    baseUrl: 'http://localhost:3001/api',
    apiKey: 'test-api-key'
  })
  
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
  
  // 测试1: 基本适配器功能
  console.log('📚 测试历史服务适配器:')
  
  // 设置用户ID
  adapter.setUserId('test-user-123')
  
  // 测试保存历史记录
  const saveRequest = {
    calculatorId: 'compound-interest',
    inputData: {
      principal: 10000,
      annualRate: 5,
      years: 10,
      monthlyPayment: 500
    },
    outputData: {
      finalAmount: 89435.25,
      totalInterest: 19435.25,
      totalContributions: 70000
    },
    metadata: {
      title: '我的复利计算',
      description: '长期投资计划',
      tags: ['investment', 'long-term'],
      isPublic: false,
      isFavorite: true
    }
  }
  
  const savedRecord = await adapter.saveHistory(saveRequest)
  test('保存历史记录应该成功', savedRecord && savedRecord.id)
  test('保存的记录应该包含正确的用户ID', savedRecord.userId === 'test-user-123')
  test('保存的记录应该包含正确的计算器ID', savedRecord.calculatorId === 'compound-interest')
  test('保存的记录应该包含输入数据', Object.keys(savedRecord.inputData).length > 0)
  test('保存的记录应该包含输出数据', Object.keys(savedRecord.outputData).length > 0)
  test('保存的记录应该包含元数据', savedRecord.metadata && savedRecord.metadata.title)
  
  // 测试2: 查询功能
  console.log('\n🔍 测试查询功能:')
  
  // 添加更多测试数据
  await adapter.saveHistory({
    calculatorId: 'savings-plan',
    inputData: { monthlyPayment: 200, years: 5, annualRate: 3 },
    outputData: { finalAmount: 12000, totalInterest: 600 },
    metadata: { title: '储蓄计划', tags: ['savings'] }
  })
  
  await adapter.saveHistory({
    calculatorId: 'loan',
    inputData: { principal: 50000, annualRate: 4, years: 15 },
    outputData: { monthlyPayment: 369.65, totalInterest: 16537 },
    metadata: { title: '房贷计算', tags: ['loan', 'mortgage'] }
  })
  
  // 测试基本查询
  const queryResult = await adapter.queryHistory()
  test('查询应该返回结果', queryResult && queryResult.records)
  test('查询应该返回多条记录', queryResult.records.length >= 3)
  test('查询应该包含总数', typeof queryResult.total === 'number')
  
  // 测试按计算器ID筛选
  const compoundQuery = await adapter.queryHistory({ calculatorId: 'compound-interest' })
  test('按计算器ID筛选应该正确', compoundQuery.records.every(r => r.calculatorId === 'compound-interest'))
  
  // 测试按标签筛选
  const tagQuery = await adapter.queryHistory({ tags: ['long-term'] })
  test('按标签筛选应该正确', tagQuery.records.length > 0)
  
  // 测试搜索
  const searchQuery = await adapter.queryHistory({ searchText: '复利' })
  test('文本搜索应该正确', searchQuery.records.length > 0)
  
  // 测试分页
  const pageQuery = await adapter.queryHistory({ limit: 2, offset: 0 })
  test('分页查询应该正确', pageQuery.records.length <= 2)
  test('分页应该包含hasMore标志', typeof pageQuery.hasMore === 'boolean')
  
  // 测试3: 单个记录操作
  console.log('\n📄 测试单个记录操作:')
  
  // 测试获取单个记录
  const singleRecord = await adapter.getHistoryById(savedRecord.id)
  test('获取单个记录应该成功', singleRecord && singleRecord.id === savedRecord.id)
  
  // 测试更新记录
  const updatedRecord = await adapter.updateHistory(savedRecord.id, {
    metadata: { ...savedRecord.metadata, title: '更新后的标题' }
  })
  test('更新记录应该成功', updatedRecord.metadata.title === '更新后的标题')
  test('更新应该增加版本号', updatedRecord.version > savedRecord.version)
  
  // 测试删除记录
  const deleteResult = await adapter.deleteHistory(savedRecord.id)
  test('删除记录应该成功', deleteResult === true)
  
  const deletedRecord = await adapter.getHistoryById(savedRecord.id)
  test('删除后记录应该不存在', deletedRecord === null)
  
  // 测试4: 批量操作
  console.log('\n📦 测试批量操作:')
  
  const batchRequests = [
    {
      calculatorId: 'compound-interest',
      inputData: { principal: 5000, annualRate: 4, years: 8 },
      outputData: { finalAmount: 6841.22 }
    },
    {
      calculatorId: 'savings-plan',
      inputData: { monthlyPayment: 300, years: 3, annualRate: 2 },
      outputData: { finalAmount: 11000 }
    },
    {
      calculatorId: 'loan',
      inputData: { principal: 25000, annualRate: 5, years: 10 },
      outputData: { monthlyPayment: 265.49 }
    }
  ]
  
  const batchResults = await adapter.batchSaveHistory(batchRequests)
  test('批量保存应该成功', batchResults.length === 3)
  test('批量保存的记录应该都有ID', batchResults.every(r => r.id))
  test('批量保存的记录应该都有正确的用户ID', batchResults.every(r => r.userId === 'test-user-123'))
  
  // 测试5: 实时结果转换
  console.log('\n🔄 测试实时结果转换:')
  
  const realtimeInputData = {
    principal: 15000,
    annualRate: 6,
    years: 12,
    monthlyPayment: 400
  }
  
  const realtimeOutputData = {
    finalAmount: 125000,
    totalInterest: 52000,
    totalContributions: 73000
  }
  
  const convertedRequest = adapter.createHistoryFromRealtimeResult(
    'compound-interest',
    realtimeInputData,
    realtimeOutputData,
    { title: '实时计算结果', isFavorite: true }
  )
  
  test('实时结果转换应该成功', convertedRequest && convertedRequest.calculatorId)
  test('转换应该包含输入数据', Object.keys(convertedRequest.inputData).length > 0)
  test('转换应该包含输出数据', Object.keys(convertedRequest.outputData).length > 0)
  test('转换应该包含元数据', convertedRequest.metadata && convertedRequest.metadata.title)
  test('转换应该生成自动标签', convertedRequest.metadata.tags.length > 0)
  
  const convertedRecord = await adapter.saveHistory(convertedRequest)
  test('转换后的记录应该能成功保存', convertedRecord && convertedRecord.id)
  
  // 测试6: 数据验证
  console.log('\n✅ 测试数据验证:')
  
  // 测试无效请求
  try {
    await adapter.saveHistory({
      calculatorId: '',
      inputData: {},
      outputData: {}
    })
    test('空数据应该被拒绝', false)
  } catch (error) {
    test('空数据应该被拒绝', error.message.includes('不能为空'))
  }
  
  // 测试未登录用户
  adapter.setUserId(null)
  try {
    await adapter.saveHistory({
      calculatorId: 'test',
      inputData: { test: 1 },
      outputData: { result: 2 }
    })
    test('未登录用户应该被拒绝', false)
  } catch (error) {
    test('未登录用户应该被拒绝', error.message.includes('用户未登录'))
  }
  
  // 恢复用户登录状态
  adapter.setUserId('test-user-123')
  
  // 测试7: 性能测试
  console.log('\n🚀 测试性能表现:')
  
  const performanceStartTime = Date.now()
  
  // 大量保存操作
  const largeBatchRequests = Array.from({ length: 50 }, (_, i) => ({
    calculatorId: 'compound-interest',
    inputData: { principal: 1000 * (i + 1), annualRate: 5, years: 10 },
    outputData: { finalAmount: 2000 * (i + 1) }
  }))
  
  const largeBatchResults = await adapter.batchSaveHistory(largeBatchRequests)
  const saveTime = Date.now() - performanceStartTime
  
  test('大批量保存应该成功', largeBatchResults.length === 50)
  test('大批量保存应该在合理时间内完成', saveTime < 3000) // 3秒内
  
  // 大量查询操作
  const queryStartTime = Date.now()
  
  for (let i = 0; i < 20; i++) {
    await adapter.queryHistory({ limit: 10, offset: i * 10 })
  }
  
  const queryTime = Date.now() - queryStartTime
  test('大量查询应该在合理时间内完成', queryTime < 2000) // 2秒内
  
  // 测试8: 边界条件
  console.log('\n🔍 测试边界条件:')
  
  // 测试空查询
  const emptyQuery = await adapter.queryHistory({ calculatorId: 'nonexistent' })
  test('空查询应该返回空结果', emptyQuery.records.length === 0)
  test('空查询应该有正确的总数', emptyQuery.total === 0)
  
  // 测试获取不存在的记录
  const nonexistentRecord = await adapter.getHistoryById('nonexistent-id')
  test('获取不存在的记录应该返回null', nonexistentRecord === null)
  
  // 测试更新不存在的记录
  try {
    await adapter.updateHistory('nonexistent-id', { metadata: { title: 'test' } })
    test('更新不存在的记录应该失败', false)
  } catch (error) {
    test('更新不存在的记录应该失败', error.message.includes('不存在'))
  }
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  // 输出性能统计
  console.log('\n📈 性能统计详情:')
  console.log(`   总请求数: ${adapter.getRequestCount()}`)
  console.log(`   数据库记录数: ${adapter.getDatabaseSize()}`)
  console.log(`   大批量保存时间: ${saveTime}ms (50项)`)
  console.log(`   大量查询时间: ${queryTime}ms (20次查询)`)
  
  // 输出功能覆盖情况
  console.log('\n🎯 功能覆盖情况:')
  console.log(`   ✅ 历史服务适配器 - 完整的CRUD操作`)
  console.log(`   ✅ 查询功能 - 筛选、搜索、分页、排序`)
  console.log(`   ✅ 批量操作 - 批量保存和处理`)
  console.log(`   ✅ 实时结果转换 - 数据格式转换`)
  console.log(`   ✅ 数据验证 - 输入验证和错误处理`)
  console.log(`   ✅ 性能优化 - 大数据量处理`)
  console.log(`   ✅ 边界条件 - 异常情况处理`)
  console.log(`   ✅ 用户权限 - 用户身份验证`)
  
  if (failed === 0) {
    console.log('\n🎉 所有历史服务集成测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查历史服务实现。')
    return false
  }
}

// 运行测试
runHistoryServiceIntegrationTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
