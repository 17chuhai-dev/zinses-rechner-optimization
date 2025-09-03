/**
 * 数据库服务
 * 封装Cloudflare D1数据库操作
 */

import { CalculatorRequest, CalculatorResponse } from '../types/api'

export interface DatabaseService {
  saveCalculationHistory(request: CalculatorRequest, response: CalculatorResponse, sessionId: string): Promise<void>
  getCalculationStats(): Promise<CalculationStats>
  saveMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>
  getSystemConfig(key: string): Promise<string | null>
  updateSystemConfig(key: string, value: string): Promise<void>
  logError(error: ErrorLogEntry): Promise<void>
  getHealthStatus(): Promise<DatabaseHealthStatus>
}

export interface CalculationStats {
  total_calculations: number
  avg_principal: number
  avg_final_amount: number
  popular_years: number
  popular_rate: number
  calculations_today: number
  calculations_this_month: number
}

export interface ErrorLogEntry {
  error_type: string
  error_message: string
  error_stack?: string
  request_url?: string
  request_method?: string
  user_agent_hash?: string
  client_ip_hash?: string
  environment: string
}

export interface DatabaseHealthStatus {
  connected: boolean
  response_time_ms: number
  last_error?: string
}

export class D1DatabaseService implements DatabaseService {
  constructor(private db: D1Database, private env: Env) {}

  /**
   * 保存计算历史
   */
  async saveCalculationHistory(
    request: CalculatorRequest, 
    response: CalculatorResponse, 
    sessionId: string
  ): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO calculation_history 
        (session_id, principal, monthly_payment, annual_rate, years, compound_frequency,
         final_amount, total_contributions, total_interest, annual_return, calculation_time_ms,
         user_agent_hash, client_ip_hash, referer_domain)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      await stmt.bind(
        sessionId,
        request.principal,
        request.monthly_payment || 0,
        request.annual_rate,
        request.years,
        request.compound_frequency,
        response.final_amount,
        response.total_contributions,
        response.total_interest,
        response.annual_return,
        response.calculation_time_ms || 0,
        this.hashUserAgent(),
        this.hashClientIP(),
        this.getRefererDomain()
      ).run()

    } catch (error) {
      console.error('Failed to save calculation history:', error)
      // 不抛出错误，避免影响主要功能
    }
  }

  /**
   * 获取计算统计
   */
  async getCalculationStats(): Promise<CalculationStats> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total_calculations,
          AVG(principal) as avg_principal,
          AVG(final_amount) as avg_final_amount,
          (SELECT years FROM calculation_history 
           GROUP BY years ORDER BY COUNT(*) DESC LIMIT 1) as popular_years,
          (SELECT annual_rate FROM calculation_history 
           GROUP BY annual_rate ORDER BY COUNT(*) DESC LIMIT 1) as popular_rate,
          (SELECT COUNT(*) FROM calculation_history 
           WHERE date(created_at) = date('now')) as calculations_today,
          (SELECT COUNT(*) FROM calculation_history 
           WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) as calculations_this_month
        FROM calculation_history
      `)
      
      const result = await stmt.first()
      
      return {
        total_calculations: result?.total_calculations || 0,
        avg_principal: result?.avg_principal || 0,
        avg_final_amount: result?.avg_final_amount || 0,
        popular_years: result?.popular_years || 10,
        popular_rate: result?.popular_rate || 4.0,
        calculations_today: result?.calculations_today || 0,
        calculations_this_month: result?.calculations_this_month || 0
      }

    } catch (error) {
      console.error('Failed to get calculation stats:', error)
      return {
        total_calculations: 0,
        avg_principal: 0,
        avg_final_amount: 0,
        popular_years: 10,
        popular_rate: 4.0,
        calculations_today: 0,
        calculations_this_month: 0
      }
    }
  }

  /**
   * 保存监控指标
   */
  async saveMetric(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO monitoring_metrics 
        (metric_name, metric_value, tags, worker_region, environment)
        VALUES (?, ?, ?, ?, ?)
      `)
      
      await stmt.bind(
        name,
        value,
        tags ? JSON.stringify(tags) : null,
        this.env.CF_RAY?.split('-')[1] || 'unknown',
        this.env.ENVIRONMENT
      ).run()

    } catch (error) {
      console.error('Failed to save metric:', error)
    }
  }

  /**
   * 获取系统配置
   */
  async getSystemConfig(key: string): Promise<string | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT config_value FROM system_config WHERE config_key = ?
      `)
      
      const result = await stmt.bind(key).first()
      return result?.config_value || null

    } catch (error) {
      console.error('Failed to get system config:', error)
      return null
    }
  }

  /**
   * 更新系统配置
   */
  async updateSystemConfig(key: string, value: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO system_config 
        (config_key, config_value, updated_at)
        VALUES (?, ?, ?)
      `)
      
      await stmt.bind(key, value, new Date().toISOString()).run()

    } catch (error) {
      console.error('Failed to update system config:', error)
      throw error
    }
  }

  /**
   * 记录错误日志
   */
  async logError(error: ErrorLogEntry): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO error_logs 
        (error_type, error_message, error_stack, request_url, request_method,
         user_agent_hash, client_ip_hash, environment, worker_region)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      await stmt.bind(
        error.error_type,
        error.error_message,
        error.error_stack || null,
        error.request_url || null,
        error.request_method || null,
        error.user_agent_hash || this.hashUserAgent(),
        error.client_ip_hash || this.hashClientIP(),
        error.environment,
        this.env.CF_RAY?.split('-')[1] || 'unknown'
      ).run()

    } catch (dbError) {
      console.error('Failed to log error to database:', dbError)
    }
  }

  /**
   * 获取数据库健康状态
   */
  async getHealthStatus(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now()
    
    try {
      const result = await this.db.prepare('SELECT 1 as test').first()
      const responseTime = Date.now() - startTime
      
      return {
        connected: result?.test === 1,
        response_time_ms: responseTime
      }

    } catch (error) {
      return {
        connected: false,
        response_time_ms: Date.now() - startTime,
        last_error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取用户会话统计
   */
  async getUserSessionStats(): Promise<{
    active_sessions: number
    avg_session_duration: number
    total_calculations_today: number
  }> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(CASE WHEN session_end IS NULL THEN 1 END) as active_sessions,
          AVG(session_duration_seconds) as avg_session_duration,
          SUM(total_calculations) as total_calculations_today
        FROM user_sessions 
        WHERE date(session_start) = date('now')
      `)
      
      const result = await stmt.first()
      
      return {
        active_sessions: result?.active_sessions || 0,
        avg_session_duration: result?.avg_session_duration || 0,
        total_calculations_today: result?.total_calculations_today || 0
      }

    } catch (error) {
      console.error('Failed to get session stats:', error)
      return {
        active_sessions: 0,
        avg_session_duration: 0,
        total_calculations_today: 0
      }
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      // 清理超过1年的计算历史
      await this.db.prepare(`
        DELETE FROM calculation_history 
        WHERE created_at < datetime('now', '-1 year')
      `).run()

      // 清理超过30天的监控指标
      await this.db.prepare(`
        DELETE FROM monitoring_metrics 
        WHERE timestamp < datetime('now', '-30 days')
      `).run()

      // 清理已解决的错误日志（超过90天）
      await this.db.prepare(`
        DELETE FROM error_logs 
        WHERE timestamp < datetime('now', '-90 days') AND resolved = TRUE
      `).run()

      console.log('Database cleanup completed')

    } catch (error) {
      console.error('Failed to cleanup expired data:', error)
    }
  }

  /**
   * 私有方法：哈希用户代理
   */
  private hashUserAgent(): string {
    // 在实际实现中应该使用真实的User-Agent
    return 'hashed-user-agent'
  }

  /**
   * 私有方法：哈希客户端IP
   */
  private hashClientIP(): string {
    // 在实际实现中应该使用真实的客户端IP
    return 'hashed-client-ip'
  }

  /**
   * 私有方法：获取引用域名
   */
  private getRefererDomain(): string {
    // 在实际实现中应该从请求头获取
    return 'zinses-rechner.de'
  }
}

/**
 * 数据库服务工厂
 */
export function createDatabaseService(db: D1Database, env: Env): DatabaseService {
  return new D1DatabaseService(db, env)
}
