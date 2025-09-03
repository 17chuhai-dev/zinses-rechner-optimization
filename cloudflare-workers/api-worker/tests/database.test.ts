/**
 * 数据库服务测试
 * 验证D1数据库操作和数据完整性
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { D1DatabaseService } from '../src/services/database'
import { MigrationManager } from '../src/utils/migration-manager'
import { CalculatorRequest, CalculatorResponse } from '../src/types/api'

// 模拟D1数据库
const createMockD1Database = () => {
  const mockData = new Map()
  
  return {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...params: any[]) => ({
        run: vi.fn(async () => ({ success: true })),
        first: vi.fn(async () => {
          // 模拟查询结果
          if (sql.includes('SELECT 1 as test')) {
            return { test: 1 }
          }
          if (sql.includes('system_config')) {
            return { config_value: 'test_value' }
          }
          if (sql.includes('calculation_history')) {
            return {
              total_calculations: 100,
              avg_principal: 25000,
              avg_final_amount: 45000,
              popular_years: 10,
              popular_rate: 4.0,
              calculations_today: 5,
              calculations_this_month: 150
            }
          }
          return null
        }),
        all: vi.fn(async () => ({
          results: [
            { version: '001' },
            { version: '002' }
          ]
        }))
      })),
      run: vi.fn(async () => ({ success: true })),
      first: vi.fn(async () => ({ test: 1 })),
      all: vi.fn(async () => ({ results: [] }))
    })),
    exec: vi.fn(async () => ({ success: true }))
  } as any
}

// 模拟环境
const mockEnv = {
  ENVIRONMENT: 'test',
  CF_RAY: 'test-ray-123-FRA'
} as any

describe('D1DatabaseService', () => {
  let databaseService: D1DatabaseService
  let mockDb: any

  beforeEach(() => {
    mockDb = createMockD1Database()
    databaseService = new D1DatabaseService(mockDb, mockEnv)
  })

  describe('计算历史保存', () => {
    it('应该正确保存计算历史', async () => {
      const request: CalculatorRequest = {
        principal: 10000,
        monthly_payment: 500,
        annual_rate: 4,
        years: 10,
        compound_frequency: 'monthly'
      }

      const response: CalculatorResponse = {
        final_amount: 75624.32,
        total_contributions: 70000,
        total_interest: 5624.32,
        annual_return: 4.2,
        calculation_time_ms: 15,
        yearly_breakdown: [],
        tax_calculation: {
          gross_interest: 5624.32,
          tax_free_amount: 1000,
          taxable_interest: 4624.32,
          abgeltungssteuer: 1156.08,
          solidaritaetszuschlag: 63.58,
          kirchensteuer: 0,
          total_tax: 1219.66,
          net_interest: 4404.66
        }
      }

      await databaseService.saveCalculationHistory(request, response, 'test-session')

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO calculation_history')
      )
    })

    it('应该处理保存失败的情况', async () => {
      // 模拟数据库错误
      mockDb.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          run: vi.fn(async () => {
            throw new Error('Database error')
          })
        }))
      })

      const request: CalculatorRequest = {
        principal: 10000,
        monthly_payment: 0,
        annual_rate: 4,
        years: 10,
        compound_frequency: 'yearly'
      }

      const response: CalculatorResponse = {
        final_amount: 14802.44,
        total_contributions: 10000,
        total_interest: 4802.44,
        annual_return: 4.0,
        yearly_breakdown: []
      }

      // 不应该抛出错误，应该静默处理
      await expect(
        databaseService.saveCalculationHistory(request, response, 'test-session')
      ).resolves.not.toThrow()
    })
  })

  describe('系统配置管理', () => {
    it('应该正确获取系统配置', async () => {
      const configValue = await databaseService.getSystemConfig('max_calculation_years')

      expect(configValue).toBe('test_value')
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT config_value FROM system_config')
      )
    })

    it('应该正确更新系统配置', async () => {
      await databaseService.updateSystemConfig('test_key', 'test_value')

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO system_config')
      )
    })

    it('应该处理配置不存在的情况', async () => {
      mockDb.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn(async () => null)
        }))
      })

      const configValue = await databaseService.getSystemConfig('nonexistent_key')
      expect(configValue).toBeNull()
    })
  })

  describe('监控指标', () => {
    it('应该正确保存监控指标', async () => {
      await databaseService.saveMetric('test_metric', 123.45, {
        tag1: 'value1',
        tag2: 'value2'
      })

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO monitoring_metrics')
      )
    })

    it('应该处理指标保存失败', async () => {
      mockDb.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          run: vi.fn(async () => {
            throw new Error('Metric save failed')
          })
        }))
      })

      // 不应该抛出错误
      await expect(
        databaseService.saveMetric('test_metric', 123.45)
      ).resolves.not.toThrow()
    })
  })

  describe('健康检查', () => {
    it('应该返回健康的数据库状态', async () => {
      const healthStatus = await databaseService.getHealthStatus()

      expect(healthStatus.connected).toBe(true)
      expect(healthStatus.response_time_ms).toBeGreaterThan(0)
      expect(healthStatus.last_error).toBeUndefined()
    })

    it('应该处理数据库连接失败', async () => {
      mockDb.prepare.mockReturnValue({
        first: vi.fn(async () => {
          throw new Error('Connection failed')
        })
      })

      const healthStatus = await databaseService.getHealthStatus()

      expect(healthStatus.connected).toBe(false)
      expect(healthStatus.last_error).toBe('Connection failed')
    })
  })

  describe('错误日志', () => {
    it('应该正确记录错误日志', async () => {
      const errorEntry = {
        error_type: 'ValidationError',
        error_message: 'Invalid input data',
        error_stack: 'Error stack trace...',
        request_url: '/api/v1/calculate',
        request_method: 'POST',
        environment: 'test'
      }

      await databaseService.logError(errorEntry)

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO error_logs')
      )
    })
  })

  describe('统计查询', () => {
    it('应该正确获取计算统计', async () => {
      const stats = await databaseService.getCalculationStats()

      expect(stats).toEqual({
        total_calculations: 100,
        avg_principal: 25000,
        avg_final_amount: 45000,
        popular_years: 10,
        popular_rate: 4.0,
        calculations_today: 5,
        calculations_this_month: 150
      })
    })

    it('应该处理统计查询失败', async () => {
      mockDb.prepare.mockReturnValue({
        first: vi.fn(async () => {
          throw new Error('Stats query failed')
        })
      })

      const stats = await databaseService.getCalculationStats()

      // 应该返回默认值
      expect(stats.total_calculations).toBe(0)
      expect(stats.popular_years).toBe(10)
      expect(stats.popular_rate).toBe(4.0)
    })
  })
})

describe('MigrationManager', () => {
  let migrationManager: MigrationManager
  let mockDb: any

  beforeEach(() => {
    mockDb = createMockD1Database()
    migrationManager = new MigrationManager(mockDb, mockEnv)
  })

  describe('迁移系统初始化', () => {
    it('应该正确初始化迁移系统', async () => {
      await migrationManager.initialize()

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS migration_history')
      )
    })
  })

  describe('迁移执行', () => {
    it('应该获取所有可用迁移', () => {
      const migrations = migrationManager.getMigrations()

      expect(migrations).toHaveLength(3)
      expect(migrations[0].version).toBe('001')
      expect(migrations[0].name).toBe('initial_schema')
      expect(migrations[1].version).toBe('002')
      expect(migrations[2].version).toBe('003')
    })

    it('应该正确运行迁移', async () => {
      const migration = {
        version: '001',
        name: 'test_migration',
        description: '测试迁移',
        sql: 'CREATE TABLE test (id INTEGER);'
      }

      await migrationManager.runMigration(migration)

      expect(mockDb.exec).toHaveBeenCalledWith(migration.sql)
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO migration_history')
      )
    })

    it('应该处理迁移失败', async () => {
      mockDb.exec.mockRejectedValue(new Error('Migration failed'))

      const migration = {
        version: '001',
        name: 'test_migration',
        description: '测试迁移',
        sql: 'INVALID SQL;'
      }

      await expect(migrationManager.runMigration(migration)).rejects.toThrow('Migration failed')
    })
  })

  describe('迁移状态管理', () => {
    it('应该正确获取已应用的迁移', async () => {
      const appliedMigrations = await migrationManager.getAppliedMigrations()

      expect(appliedMigrations).toEqual(['001', '002'])
    })

    it('应该正确获取迁移状态', async () => {
      mockDb.prepare.mockReturnValue({
        all: vi.fn(async () => ({
          results: [
            {
              version: '001',
              applied_at: '2024-01-15 10:00:00',
              success: true,
              error_message: null
            }
          ]
        }))
      })

      const status = await migrationManager.getMigrationStatus()

      expect(status).toHaveLength(1)
      expect(status[0].version).toBe('001')
      expect(status[0].success).toBe(true)
    })
  })
})
