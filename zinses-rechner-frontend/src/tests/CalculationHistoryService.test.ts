/**
 * 计算历史服务测试
 * 测试计算历史管理的所有核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CalculationHistoryService, type CalculationHistory } from '@/services/CalculationHistoryService'
import { createAnonymousUser } from '@/utils/user-identity-utils'

describe('CalculationHistoryService', () => {
  let service: CalculationHistoryService
  let testUser: any
  let testCalculation: Omit<CalculationHistory, 'id' | 'timestamp'>

  beforeEach(() => {
    service = CalculationHistoryService.getInstance()
    testUser = createAnonymousUser()
    
    testCalculation = {
      userId: testUser.id,
      calculatorType: 'compound-interest',
      inputData: {
        principal: 10000,
        monthlyPayment: 500,
        annualRate: 4.0,
        years: 10
      },
      results: {
        finalAmount: 75000,
        totalContributions: 70000,
        totalInterest: 5000,
        annualReturn: 4.2
      },
      isFavorite: false,
      tags: ['retirement', 'long-term'],
      notes: 'Test calculation for retirement planning',
      metadata: {
        version: '1.0',
        duration: 150,
        source: 'web',
        accuracy: 0.99
      }
    }
  })

  describe('基础CRUD操作', () => {
    it('应该保存计算历史', async () => {
      await expect(service.save(testCalculation)).resolves.not.toThrow()
    })

    it('应该根据ID查找记录', async () => {
      await service.save(testCalculation)
      
      // 获取所有记录来找到刚保存的记录
      const allRecords = await service.findByUserId(testUser.id)
      expect(allRecords).toHaveLength(1)
      
      const savedRecord = allRecords[0]
      const foundRecord = await service.findById(savedRecord.id)
      
      expect(foundRecord).toBeDefined()
      expect(foundRecord?.userId).toBe(testUser.id)
      expect(foundRecord?.calculatorType).toBe('compound-interest')
    })

    it('应该根据用户ID查找记录', async () => {
      await service.save(testCalculation)
      await service.save({
        ...testCalculation,
        calculatorType: 'loan'
      })
      
      const userRecords = await service.findByUserId(testUser.id)
      expect(userRecords).toHaveLength(2)
      expect(userRecords.every(record => record.userId === testUser.id)).toBe(true)
    })

    it('应该更新记录', async () => {
      await service.save(testCalculation)
      
      const allRecords = await service.findByUserId(testUser.id)
      const recordId = allRecords[0].id
      
      await service.update(recordId, {
        isFavorite: true,
        tags: ['updated', 'favorite']
      })
      
      const updatedRecord = await service.findById(recordId)
      expect(updatedRecord?.isFavorite).toBe(true)
      expect(updatedRecord?.tags).toEqual(['updated', 'favorite'])
    })

    it('应该删除记录', async () => {
      await service.save(testCalculation)
      
      const allRecords = await service.findByUserId(testUser.id)
      const recordId = allRecords[0].id
      
      await service.delete(recordId)
      
      const deletedRecord = await service.findById(recordId)
      expect(deletedRecord).toBeNull()
    })
  })

  describe('搜索功能', () => {
    beforeEach(async () => {
      // 准备测试数据
      await service.save({
        ...testCalculation,
        calculatorType: 'compound-interest',
        tags: ['retirement', 'long-term'],
        isFavorite: true,
        notes: 'Retirement planning calculation'
      })
      
      await service.save({
        ...testCalculation,
        calculatorType: 'loan',
        tags: ['mortgage', 'home'],
        isFavorite: false,
        notes: 'Home loan calculation'
      })
      
      await service.save({
        ...testCalculation,
        calculatorType: 'portfolio',
        tags: ['investment', 'stocks'],
        isFavorite: true,
        notes: 'Stock portfolio analysis'
      })
    })

    it('应该按计算器类型搜索', async () => {
      const results = await service.search({
        calculatorType: 'compound-interest'
      })
      
      expect(results).toHaveLength(1)
      expect(results[0].calculatorType).toBe('compound-interest')
    })

    it('应该按标签搜索', async () => {
      const results = await service.search({
        tags: ['retirement']
      })
      
      expect(results).toHaveLength(1)
      expect(results[0].tags).toContain('retirement')
    })

    it('应该按收藏状态搜索', async () => {
      const results = await service.search({
        isFavorite: true
      })
      
      expect(results).toHaveLength(2)
      expect(results.every(record => record.isFavorite)).toBe(true)
    })

    it('应该按文本内容搜索', async () => {
      const results = await service.search({
        text: 'retirement'
      })
      
      expect(results).toHaveLength(1)
      expect(results[0].notes).toContain('Retirement')
    })

    it('应该组合多个搜索条件', async () => {
      const results = await service.search({
        calculatorType: 'compound-interest',
        isFavorite: true,
        tags: ['retirement']
      })
      
      expect(results).toHaveLength(1)
      expect(results[0].calculatorType).toBe('compound-interest')
      expect(results[0].isFavorite).toBe(true)
      expect(results[0].tags).toContain('retirement')
    })

    it('应该按日期范围搜索', async () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
      
      const results = await service.search({
        dateRange: {
          start: oneHourAgo,
          end: oneHourLater
        }
      })
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.every(record => 
        record.timestamp >= oneHourAgo && record.timestamp <= oneHourLater
      )).toBe(true)
    })
  })

  describe('收藏功能', () => {
    it('应该获取收藏记录', async () => {
      await service.save({
        ...testCalculation,
        isFavorite: true
      })
      
      await service.save({
        ...testCalculation,
        isFavorite: false
      })
      
      const favorites = await service.getFavorites(testUser.id)
      expect(favorites).toHaveLength(1)
      expect(favorites[0].isFavorite).toBe(true)
    })

    it('应该根据标签查找记录', async () => {
      await service.save({
        ...testCalculation,
        tags: ['test', 'demo']
      })
      
      const results = await service.findByTags(['test'])
      expect(results).toHaveLength(1)
      expect(results[0].tags).toContain('test')
    })
  })

  describe('批量操作', () => {
    let recordIds: string[]

    beforeEach(async () => {
      await service.save(testCalculation)
      await service.save({
        ...testCalculation,
        calculatorType: 'loan'
      })
      
      const allRecords = await service.findByUserId(testUser.id)
      recordIds = allRecords.map(record => record.id)
    })

    it('应该批量删除记录', async () => {
      await service.bulkDelete(recordIds)
      
      const remainingRecords = await service.findByUserId(testUser.id)
      expect(remainingRecords).toHaveLength(0)
    })

    it('应该批量更新标签', async () => {
      const newTags = ['bulk-updated', 'test']
      await service.bulkUpdateTags(recordIds, newTags)
      
      const updatedRecords = await service.findByUserId(testUser.id)
      expect(updatedRecords).toHaveLength(2)
      expect(updatedRecords.every(record => 
        record.tags.includes('bulk-updated') && record.tags.includes('test')
      )).toBe(true)
    })
  })

  describe('查询选项', () => {
    beforeEach(async () => {
      // 创建多个记录用于测试排序和分页
      for (let i = 0; i < 5; i++) {
        await service.save({
          ...testCalculation,
          calculatorType: i % 2 === 0 ? 'compound-interest' : 'loan',
          isFavorite: i < 2
        })
        // 添加小延迟确保时间戳不同
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    })

    it('应该支持分页查询', async () => {
      const firstPage = await service.findByUserId(testUser.id, {
        limit: 2,
        offset: 0
      })
      
      const secondPage = await service.findByUserId(testUser.id, {
        limit: 2,
        offset: 2
      })
      
      expect(firstPage).toHaveLength(2)
      expect(secondPage).toHaveLength(2)
      expect(firstPage[0].id).not.toBe(secondPage[0].id)
    })

    it('应该支持按时间戳排序', async () => {
      const ascResults = await service.findByUserId(testUser.id, {
        sortBy: 'timestamp',
        sortOrder: 'asc'
      })
      
      const descResults = await service.findByUserId(testUser.id, {
        sortBy: 'timestamp',
        sortOrder: 'desc'
      })
      
      expect(ascResults).toHaveLength(5)
      expect(descResults).toHaveLength(5)
      expect(ascResults[0].timestamp.getTime()).toBeLessThan(ascResults[4].timestamp.getTime())
      expect(descResults[0].timestamp.getTime()).toBeGreaterThan(descResults[4].timestamp.getTime())
    })
  })

  describe('数据验证', () => {
    it('应该验证必需字段', async () => {
      const invalidCalculation = {
        ...testCalculation,
        userId: ''
      }
      
      await expect(service.save(invalidCalculation)).rejects.toThrow('User ID is required')
    })

    it('应该验证计算器类型', async () => {
      const invalidCalculation = {
        ...testCalculation,
        calculatorType: '' as any
      }
      
      await expect(service.save(invalidCalculation)).rejects.toThrow('Calculator type is required')
    })

    it('应该验证输入数据', async () => {
      const invalidCalculation = {
        ...testCalculation,
        inputData: {}
      }
      
      await expect(service.save(invalidCalculation)).rejects.toThrow('Input data is required')
    })

    it('应该验证结果数据', async () => {
      const invalidCalculation = {
        ...testCalculation,
        results: {}
      }
      
      await expect(service.save(invalidCalculation)).rejects.toThrow('Results are required')
    })
  })

  describe('性能监控', () => {
    it('应该记录性能指标', async () => {
      await service.save(testCalculation)
      await service.search({ calculatorType: 'compound-interest' })
      await service.findByUserId(testUser.id)
      
      const metrics = service.getPerformanceMetrics()
      
      expect(metrics.saveTime.count).toBeGreaterThan(0)
      expect(metrics.searchTime.count).toBeGreaterThan(0)
      expect(metrics.loadTime.count).toBeGreaterThan(0)
      expect(metrics.saveTime.average).toBeGreaterThan(0)
    })
  })

  describe('错误处理', () => {
    it('应该处理不存在的记录ID', async () => {
      const nonExistentId = 'non-existent-id'
      const result = await service.findById(nonExistentId)
      expect(result).toBeNull()
    })

    it('应该处理更新不存在的记录', async () => {
      const nonExistentId = 'non-existent-id'
      await expect(service.update(nonExistentId, { isFavorite: true }))
        .rejects.toThrow('not found')
    })

    it('应该处理空搜索结果', async () => {
      const results = await service.search({
        calculatorType: 'non-existent-type' as any
      })
      expect(results).toHaveLength(0)
    })
  })
})
