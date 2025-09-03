/**
 * 数据库迁移管理器
 * 自动化数据库版本管理和迁移执行
 */

export interface Migration {
  version: string
  name: string
  sql: string
  rollback?: string
  description: string
}

export interface MigrationStatus {
  version: string
  applied_at: string
  success: boolean
  error_message?: string
}

export class MigrationManager {
  constructor(private db: D1Database, private env: Env) {}

  /**
   * 初始化迁移系统
   */
  async initialize(): Promise<void> {
    // 创建迁移历史表
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        error_message TEXT,
        rollback_sql TEXT
      )
    `).run()

    console.log('Migration system initialized')
  }

  /**
   * 获取所有可用迁移
   */
  getMigrations(): Migration[] {
    return [
      {
        version: '001',
        name: 'initial_schema',
        description: '初始数据库架构',
        sql: `
          -- 计算历史表
          CREATE TABLE IF NOT EXISTS calculation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            principal REAL NOT NULL,
            monthly_payment REAL NOT NULL DEFAULT 0,
            annual_rate REAL NOT NULL,
            years INTEGER NOT NULL,
            compound_frequency TEXT NOT NULL DEFAULT 'monthly',
            final_amount REAL NOT NULL,
            total_contributions REAL NOT NULL,
            total_interest REAL NOT NULL,
            annual_return REAL NOT NULL,
            calculation_time_ms INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_agent_hash TEXT,
            client_ip_hash TEXT,
            referer_domain TEXT
          );

          CREATE INDEX IF NOT EXISTS idx_calculation_history_session ON calculation_history(session_id);
          CREATE INDEX IF NOT EXISTS idx_calculation_history_created ON calculation_history(created_at);

          -- 监控指标表
          CREATE TABLE IF NOT EXISTS monitoring_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT NOT NULL,
            metric_value REAL NOT NULL,
            metric_unit TEXT,
            tags TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            worker_region TEXT,
            environment TEXT NOT NULL DEFAULT 'production'
          );

          CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_name ON monitoring_metrics(metric_name);
          CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_timestamp ON monitoring_metrics(timestamp);

          -- 系统配置表
          CREATE TABLE IF NOT EXISTS system_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_key TEXT NOT NULL UNIQUE,
            config_value TEXT NOT NULL,
            config_type TEXT NOT NULL DEFAULT 'string',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 插入默认配置
          INSERT OR IGNORE INTO system_config (config_key, config_value, config_type, description) VALUES
          ('max_calculation_years', '50', 'number', '最大计算年限'),
          ('max_principal_amount', '10000000', 'number', '最大本金金额'),
          ('default_tax_rate', '0.25', 'number', '默认税率'),
          ('cache_ttl_seconds', '300', 'number', '缓存过期时间');
        `,
        rollback: `
          DROP TABLE IF EXISTS calculation_history;
          DROP TABLE IF EXISTS monitoring_metrics;
          DROP TABLE IF EXISTS system_config;
        `
      },
      {
        version: '002',
        name: 'add_error_logging',
        description: '添加错误日志和告警系统',
        sql: `
          -- 错误日志表
          CREATE TABLE IF NOT EXISTS error_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            error_type TEXT NOT NULL,
            error_message TEXT NOT NULL,
            error_stack TEXT,
            request_url TEXT,
            request_method TEXT,
            user_agent_hash TEXT,
            client_ip_hash TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            environment TEXT NOT NULL DEFAULT 'production',
            worker_region TEXT,
            resolved BOOLEAN DEFAULT FALSE,
            resolution_notes TEXT
          );

          CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
          CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);

          -- 告警历史表
          CREATE TABLE IF NOT EXISTS alert_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_name TEXT NOT NULL,
            alert_severity TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            current_value REAL NOT NULL,
            threshold_value REAL NOT NULL,
            alert_message TEXT NOT NULL,
            triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME,
            resolution_message TEXT,
            notification_sent BOOLEAN DEFAULT FALSE
          );

          CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON alert_history(triggered_at);
        `,
        rollback: `
          DROP TABLE IF EXISTS error_logs;
          DROP TABLE IF EXISTS alert_history;
        `
      },
      {
        version: '003',
        name: 'add_analytics_tables',
        description: '添加分析和统计表',
        sql: `
          -- 用户会话表
          CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
            session_end DATETIME,
            total_calculations INTEGER NOT NULL DEFAULT 0,
            user_agent_hash TEXT,
            client_ip_hash TEXT,
            referer_domain TEXT,
            country_code TEXT,
            is_mobile BOOLEAN DEFAULT FALSE,
            session_duration_seconds INTEGER
          );

          CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);

          -- API使用统计表
          CREATE TABLE IF NOT EXISTS api_usage_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_key TEXT NOT NULL,
            hour_key INTEGER NOT NULL,
            endpoint TEXT NOT NULL,
            request_count INTEGER NOT NULL DEFAULT 0,
            success_count INTEGER NOT NULL DEFAULT 0,
            error_count INTEGER NOT NULL DEFAULT 0,
            average_response_time_ms REAL NOT NULL DEFAULT 0,
            unique_sessions INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(date_key, hour_key, endpoint)
          );

          CREATE INDEX IF NOT EXISTS idx_api_usage_stats_date_hour ON api_usage_stats(date_key, hour_key);

          -- 缓存统计表
          CREATE TABLE IF NOT EXISTS cache_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_key TEXT NOT NULL UNIQUE,
            hit_count INTEGER NOT NULL DEFAULT 0,
            miss_count INTEGER NOT NULL DEFAULT 0,
            total_requests INTEGER NOT NULL DEFAULT 0,
            hit_rate_percent REAL NOT NULL DEFAULT 0,
            average_response_time_ms REAL NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_cache_stats_date ON cache_stats(date_key);
        `,
        rollback: `
          DROP TABLE IF EXISTS user_sessions;
          DROP TABLE IF EXISTS api_usage_stats;
          DROP TABLE IF EXISTS cache_stats;
        `
      }
    ]
  }

  /**
   * 运行所有待执行的迁移
   */
  async runMigrations(): Promise<void> {
    await this.initialize()
    
    const migrations = this.getMigrations()
    const appliedMigrations = await this.getAppliedMigrations()
    
    for (const migration of migrations) {
      if (!appliedMigrations.includes(migration.version)) {
        await this.runMigration(migration)
      }
    }
  }

  /**
   * 运行单个迁移
   */
  async runMigration(migration: Migration): Promise<void> {
    console.log(`Running migration ${migration.version}: ${migration.name}`)
    
    try {
      // 执行迁移SQL
      await this.db.exec(migration.sql)
      
      // 记录迁移成功
      await this.db.prepare(`
        INSERT INTO migration_history (version, name, success, rollback_sql)
        VALUES (?, ?, ?, ?)
      `).bind(
        migration.version,
        migration.name,
        true,
        migration.rollback || null
      ).run()
      
      console.log(`Migration ${migration.version} completed successfully`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // 记录迁移失败
      await this.db.prepare(`
        INSERT INTO migration_history (version, name, success, error_message)
        VALUES (?, ?, ?, ?)
      `).bind(
        migration.version,
        migration.name,
        false,
        errorMessage
      ).run()
      
      console.error(`Migration ${migration.version} failed:`, errorMessage)
      throw error
    }
  }

  /**
   * 获取已应用的迁移
   */
  async getAppliedMigrations(): Promise<string[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT version FROM migration_history WHERE success = TRUE ORDER BY version
      `)
      
      const results = await stmt.all()
      return results.results.map((row: any) => row.version)

    } catch (error) {
      // 如果迁移表不存在，返回空数组
      return []
    }
  }

  /**
   * 回滚迁移
   */
  async rollbackMigration(version: string): Promise<void> {
    console.log(`Rolling back migration ${version}`)
    
    try {
      const stmt = this.db.prepare(`
        SELECT rollback_sql FROM migration_history 
        WHERE version = ? AND success = TRUE
      `)
      
      const result = await stmt.bind(version).first()
      
      if (!result?.rollback_sql) {
        throw new Error(`No rollback SQL found for migration ${version}`)
      }
      
      // 执行回滚SQL
      await this.db.exec(result.rollback_sql)
      
      // 删除迁移记录
      await this.db.prepare(`
        DELETE FROM migration_history WHERE version = ?
      `).bind(version).run()
      
      console.log(`Migration ${version} rolled back successfully`)

    } catch (error) {
      console.error(`Failed to rollback migration ${version}:`, error)
      throw error
    }
  }

  /**
   * 获取迁移状态
   */
  async getMigrationStatus(): Promise<MigrationStatus[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT version, applied_at, success, error_message
        FROM migration_history 
        ORDER BY version
      `)
      
      const results = await stmt.all()
      
      return results.results.map((row: any) => ({
        version: row.version,
        applied_at: row.applied_at,
        success: row.success,
        error_message: row.error_message
      }))

    } catch (error) {
      console.error('Failed to get migration status:', error)
      return []
    }
  }
}
