/**
 * 数据迁移服务
 * 管理用户数据的版本迁移和向后兼容性
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type {
  DataVersion,
  DataMigration,
  MigrationResult,
  ValidationResult,
  User,
  BaseUser
} from '@/types/user-identity'

import { DSGVO_CONSTANTS } from '@/types/user-identity'

import { UserDataValidator } from './UserDataValidator'

// 迁移函数类型
export type MigrationFunction = (data: any) => Promise<any>

// 迁移路径接口
export interface MigrationPath {
  fromVersion: DataVersion
  toVersion: DataVersion
  steps: DataMigration[]
}

// 迁移统计接口
export interface MigrationStats {
  totalMigrations: number
  successfulMigrations: number
  failedMigrations: number
  averageDuration: number
  lastMigrationAt?: Date
}

/**
 * 数据迁移管理服务
 */
export class DataMigrationService {
  private static instance: DataMigrationService | null = null
  private migrations: Map<string, DataMigration> = new Map()
  private validator: UserDataValidator
  private migrationStats: MigrationStats = {
    totalMigrations: 0,
    successfulMigrations: 0,
    failedMigrations: 0,
    averageDuration: 0
  }

  private constructor() {
    this.validator = new UserDataValidator()
    this.registerBuiltInMigrations()
  }

  /**
   * 获取服务单例实例
   */
  static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService()
    }
    return DataMigrationService.instance
  }

  /**
   * 注册内置迁移
   */
  private registerBuiltInMigrations(): void {
    // 注册 v1.0 -> v1.1 迁移
    this.registerMigration({
      fromVersion: '1.0',
      toVersion: '1.1',
      migrate: this.migrateV1_0ToV1_1.bind(this),
      validate: this.validateV1_1Data.bind(this),
      rollback: this.rollbackV1_1ToV1_0.bind(this)
    })

    // 注册 v1.1 -> v1.2 迁移
    this.registerMigration({
      fromVersion: '1.1',
      toVersion: '1.2',
      migrate: this.migrateV1_1ToV1_2.bind(this),
      validate: this.validateV1_2Data.bind(this),
      rollback: this.rollbackV1_2ToV1_1.bind(this)
    })
  }

  /**
   * 注册迁移
   */
  registerMigration(migration: DataMigration): void {
    const key = `${migration.fromVersion}->${migration.toVersion}`
    this.migrations.set(key, migration)
    console.log(`📦 Migration registered: ${key}`)
  }

  /**
   * 检查数据是否需要迁移
   */
  needsMigration(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false
    }

    const currentVersion = data.dataVersion || '1.0'
    const targetVersion = DSGVO_CONSTANTS.CURRENT_DATA_VERSION

    return currentVersion !== targetVersion
  }

  /**
   * 获取迁移路径
   */
  getMigrationPath(fromVersion: DataVersion, toVersion: DataVersion): MigrationPath {
    const steps: DataMigration[] = []

    // 简单的线性迁移路径
    const versions: DataVersion[] = ['1.0', '1.1', '1.2']
    const fromIndex = versions.indexOf(fromVersion)
    const toIndex = versions.indexOf(toVersion)

    if (fromIndex === -1 || toIndex === -1) {
      throw new Error(`Unsupported migration path: ${fromVersion} -> ${toVersion}`)
    }

    if (fromIndex >= toIndex) {
      throw new Error(`Cannot migrate backwards: ${fromVersion} -> ${toVersion}`)
    }

    // 构建迁移步骤
    for (let i = fromIndex; i < toIndex; i++) {
      const currentVersion = versions[i]
      const nextVersion = versions[i + 1]
      const migrationKey = `${currentVersion}->${nextVersion}`

      const migration = this.migrations.get(migrationKey)
      if (!migration) {
        throw new Error(`Migration not found: ${migrationKey}`)
      }

      steps.push(migration)
    }

    return {
      fromVersion,
      toVersion,
      steps
    }
  }

  /**
   * 执行数据迁移
   */
  async migrateUserData(userData: any): Promise<MigrationResult> {
    const startTime = Date.now()
    const fromVersion = (userData?.dataVersion || '1.0') as DataVersion
    const toVersion = DSGVO_CONSTANTS.CURRENT_DATA_VERSION

    try {
      this.migrationStats.totalMigrations++

      // 检查是否需要迁移
      if (fromVersion === toVersion) {
        return {
          success: true,
          fromVersion,
          toVersion,
          migratedAt: new Date(),
          stats: {
            recordsProcessed: 1,
            recordsMigrated: 0,
            recordsFailed: 0,
            duration: Date.now() - startTime
          }
        }
      }

      // 获取迁移路径
      const migrationPath = this.getMigrationPath(fromVersion, toVersion)

      // 创建数据副本
      let currentData = JSON.parse(JSON.stringify(userData))
      let recordsProcessed = 0
      let recordsMigrated = 0

      // 执行迁移步骤
      for (const migration of migrationPath.steps) {
        recordsProcessed++

        try {
          // 执行迁移
          currentData = await migration.migrate(currentData)

          // 验证迁移结果
          const validation = await migration.validate(currentData)
          if (!validation.isValid) {
            throw new Error(`Migration validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
          }

          recordsMigrated++
          console.log(`✅ Migration completed: ${migration.fromVersion} -> ${migration.toVersion}`)

        } catch (error) {
          console.error(`❌ Migration failed: ${migration.fromVersion} -> ${migration.toVersion}`, error)

          // 尝试回滚
          if (migration.rollback) {
            try {
              currentData = await migration.rollback(currentData)
              console.log(`🔄 Rollback completed: ${migration.toVersion} -> ${migration.fromVersion}`)
            } catch (rollbackError) {
              console.error(`❌ Rollback failed:`, rollbackError)
            }
          }

          throw error
        }
      }

      // 更新统计信息
      this.migrationStats.successfulMigrations++
      this.migrationStats.lastMigrationAt = new Date()

      const duration = Date.now() - startTime
      this.migrationStats.averageDuration =
        (this.migrationStats.averageDuration * (this.migrationStats.successfulMigrations - 1) + duration) /
        this.migrationStats.successfulMigrations

      return {
        success: true,
        fromVersion,
        toVersion,
        migratedAt: new Date(),
        stats: {
          recordsProcessed,
          recordsMigrated,
          recordsFailed: 0,
          duration
        }
      }

    } catch (error) {
      this.migrationStats.failedMigrations++

      return {
        success: false,
        fromVersion,
        toVersion,
        migratedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown migration error',
        stats: {
          recordsProcessed: 1,
          recordsMigrated: 0,
          recordsFailed: 1,
          duration: Date.now() - startTime
        }
      }
    }
  }

  /**
   * 批量迁移用户数据
   */
  async migrateBatch(userDataList: any[]): Promise<MigrationResult[]> {
    const results: MigrationResult[] = []

    for (const userData of userDataList) {
      const result = await this.migrateUserData(userData)
      results.push(result)
    }

    return results
  }

  /**
   * 获取迁移统计信息
   */
  getMigrationStats(): MigrationStats {
    return { ...this.migrationStats }
  }

  /**
   * 重置迁移统计信息
   */
  resetMigrationStats(): void {
    this.migrationStats = {
      totalMigrations: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      averageDuration: 0
    }
  }

  // ============================================================================
  // 具体迁移实现
  // ============================================================================

  /**
   * v1.0 -> v1.1 迁移
   * 添加新的同意设置结构
   */
  private async migrateV1_0ToV1_1(data: any): Promise<any> {
    return {
      ...data,
      dataVersion: '1.1',
      consentSettings: {
        version: '1.1',
        consentDate: new Date(),
        lastUpdated: new Date(),
        functional: {
          status: 'granted',
          timestamp: new Date(),
          source: 'migration',
          legalBasis: 'legitimate_interest',
          purposes: ['calculation_history', 'user_preferences'],
          retentionPeriod: data.preferences?.dataRetentionDays || 365
        },
        analytics: {
          status: data.preferences?.privacy?.analytics ? 'granted' : 'denied',
          timestamp: new Date(),
          source: 'migration',
          legalBasis: 'consent',
          purposes: ['analytics'],
          retentionPeriod: 90
        },
        marketing: {
          status: 'denied',
          timestamp: new Date(),
          source: 'migration',
          legalBasis: 'consent',
          purposes: [],
          retentionPeriod: 0
        }
      }
    }
  }

  /**
   * v1.1 -> v1.2 迁移
   * 添加增强的同步设置
   */
  private async migrateV1_1ToV1_2(data: any): Promise<any> {
    return {
      ...data,
      dataVersion: '1.2',
      syncSettings: {
        ...data.syncSettings,
        enabled: data.syncEnabled || false,
        frequency: data.syncSettings?.frequency || 'manual',
        dataTypes: {
          preferences: true,
          calculationHistory: true,
          goals: true,
          favorites: true
        },
        conflictResolution: data.syncSettings?.conflictResolution || 'latest_wins',
        maxDevices: 5
      }
    }
  }

  /**
   * 验证 v1.1 数据
   */
  private async validateV1_1Data(data: any): Promise<ValidationResult> {
    // 检查必需的 v1.1 字段
    const errors = []

    if (!data.consentSettings) {
      errors.push({
        field: 'consentSettings',
        code: 'MISSING_CONSENT_SETTINGS',
        message: 'Einverständniseinstellungen fehlen'
      })
    }

    if (data.dataVersion !== '1.1') {
      errors.push({
        field: 'dataVersion',
        code: 'INVALID_DATA_VERSION',
        message: 'Ungültige Datenversion'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  /**
   * 验证 v1.2 数据
   */
  private async validateV1_2Data(data: any): Promise<ValidationResult> {
    const errors = []

    if (!data.syncSettings) {
      errors.push({
        field: 'syncSettings',
        code: 'MISSING_SYNC_SETTINGS',
        message: 'Synchronisationseinstellungen fehlen'
      })
    }

    if (data.dataVersion !== '1.2') {
      errors.push({
        field: 'dataVersion',
        code: 'INVALID_DATA_VERSION',
        message: 'Ungültige Datenversion'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  /**
   * v1.1 -> v1.0 回滚
   */
  private async rollbackV1_1ToV1_0(data: any): Promise<any> {
    const { consentSettings, ...v1_0Data } = data
    return {
      ...v1_0Data,
      dataVersion: '1.0'
    }
  }

  /**
   * v1.2 -> v1.1 回滚
   */
  private async rollbackV1_2ToV1_1(data: any): Promise<any> {
    const { syncSettings, ...v1_1Data } = data
    return {
      ...v1_1Data,
      dataVersion: '1.1',
      syncEnabled: syncSettings?.enabled || false
    }
  }
}

// 导出单例实例
export const dataMigrationService = DataMigrationService.getInstance()
