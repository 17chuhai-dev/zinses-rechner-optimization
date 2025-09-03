/**
 * 数据库分析工具
 * 提供业务洞察和性能分析
 */

export interface BusinessMetrics {
  daily_calculations: number
  weekly_growth_rate: number
  popular_calculation_ranges: PopularRange[]
  user_behavior_patterns: UserPattern[]
  performance_insights: PerformanceInsight[]
}

export interface PopularRange {
  principal_range: string
  years_range: string
  rate_range: string
  frequency: string
  count: number
  percentage: number
}

export interface UserPattern {
  pattern_type: string
  description: string
  frequency: number
  impact: 'high' | 'medium' | 'low'
}

export interface PerformanceInsight {
  metric_name: string
  current_value: number
  trend: 'improving' | 'stable' | 'declining'
  recommendation: string
}

export class DatabaseAnalytics {
  constructor(private db: D1Database, private env: Env) {}

  /**
   * 获取业务指标概览
   */
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    try {
      const [
        dailyCalculations,
        growthRate,
        popularRanges,
        userPatterns,
        performanceInsights
      ] = await Promise.all([
        this.getDailyCalculations(),
        this.getWeeklyGrowthRate(),
        this.getPopularCalculationRanges(),
        this.getUserBehaviorPatterns(),
        this.getPerformanceInsights()
      ])

      return {
        daily_calculations: dailyCalculations,
        weekly_growth_rate: growthRate,
        popular_calculation_ranges: popularRanges,
        user_behavior_patterns: userPatterns,
        performance_insights: performanceInsights
      }

    } catch (error) {
      console.error('Failed to get business metrics:', error)
      return this.getDefaultMetrics()
    }
  }

  /**
   * 获取每日计算数量
   */
  private async getDailyCalculations(): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM calculation_history 
      WHERE date(created_at) = date('now')
    `)
    
    const result = await stmt.first()
    return result?.count || 0
  }

  /**
   * 获取周增长率
   */
  private async getWeeklyGrowthRate(): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM calculation_history 
         WHERE created_at >= date('now', '-7 days')) as this_week,
        (SELECT COUNT(*) FROM calculation_history 
         WHERE created_at >= date('now', '-14 days') 
         AND created_at < date('now', '-7 days')) as last_week
    `)
    
    const result = await stmt.first()
    
    if (!result || result.last_week === 0) return 0
    
    return ((result.this_week - result.last_week) / result.last_week) * 100
  }

  /**
   * 获取热门计算范围
   */
  private async getPopularCalculationRanges(): Promise<PopularRange[]> {
    const stmt = this.db.prepare(`
      SELECT 
        CASE 
          WHEN principal < 1000 THEN 'unter_1k'
          WHEN principal < 10000 THEN '1k_bis_10k'
          WHEN principal < 100000 THEN '10k_bis_100k'
          WHEN principal < 1000000 THEN '100k_bis_1m'
          ELSE 'über_1m'
        END as principal_range,
        CASE 
          WHEN years <= 5 THEN 'kurzfristig'
          WHEN years <= 15 THEN 'mittelfristig'
          WHEN years <= 30 THEN 'langfristig'
          ELSE 'sehr_langfristig'
        END as years_range,
        CASE 
          WHEN annual_rate < 2 THEN 'niedrig'
          WHEN annual_rate < 5 THEN 'moderat'
          WHEN annual_rate < 10 THEN 'hoch'
          ELSE 'sehr_hoch'
        END as rate_range,
        compound_frequency as frequency,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM calculation_history), 2) as percentage
      FROM calculation_history 
      WHERE created_at >= date('now', '-30 days')
      GROUP BY principal_range, years_range, rate_range, frequency
      ORDER BY count DESC
      LIMIT 10
    `)
    
    const results = await stmt.all()
    
    return results.results.map((row: any) => ({
      principal_range: row.principal_range,
      years_range: row.years_range,
      rate_range: row.rate_range,
      frequency: row.frequency,
      count: row.count,
      percentage: row.percentage
    }))
  }

  /**
   * 获取用户行为模式
   */
  private async getUserBehaviorPatterns(): Promise<UserPattern[]> {
    const patterns: UserPattern[] = []

    try {
      // 分析计算频率模式
      const frequencyStmt = this.db.prepare(`
        SELECT 
          compound_frequency,
          COUNT(*) as usage_count,
          AVG(final_amount) as avg_amount
        FROM calculation_history 
        WHERE created_at >= date('now', '-30 days')
        GROUP BY compound_frequency
        ORDER BY usage_count DESC
      `)
      
      const frequencyResults = await frequencyStmt.all()
      
      for (const row of frequencyResults.results) {
        patterns.push({
          pattern_type: 'compound_frequency_preference',
          description: `${row.compound_frequency} Zinshäufigkeit wird von ${row.usage_count} Nutzern bevorzugt`,
          frequency: row.usage_count,
          impact: row.usage_count > 50 ? 'high' : row.usage_count > 20 ? 'medium' : 'low'
        })
      }

      // 分析计算时间模式
      const timeStmt = this.db.prepare(`
        SELECT 
          strftime('%H', created_at) as hour,
          COUNT(*) as calculations
        FROM calculation_history 
        WHERE created_at >= date('now', '-7 days')
        GROUP BY hour
        ORDER BY calculations DESC
        LIMIT 3
      `)
      
      const timeResults = await timeStmt.all()
      
      for (const row of timeResults.results) {
        patterns.push({
          pattern_type: 'peak_usage_time',
          description: `Spitzennutzung um ${row.hour}:00 Uhr mit ${row.calculations} Berechnungen`,
          frequency: row.calculations,
          impact: 'medium'
        })
      }

    } catch (error) {
      console.error('Failed to analyze user patterns:', error)
    }

    return patterns
  }

  /**
   * 获取性能洞察
   */
  private async getPerformanceInsights(): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = []

    try {
      // 分析计算性能
      const perfStmt = this.db.prepare(`
        SELECT 
          AVG(calculation_time_ms) as avg_calc_time,
          MAX(calculation_time_ms) as max_calc_time,
          COUNT(CASE WHEN calculation_time_ms > 1000 THEN 1 END) as slow_calculations
        FROM calculation_history 
        WHERE created_at >= date('now', '-7 days')
      `)
      
      const perfResult = await perfStmt.first()
      
      if (perfResult) {
        insights.push({
          metric_name: 'calculation_performance',
          current_value: perfResult.avg_calc_time || 0,
          trend: perfResult.avg_calc_time < 500 ? 'improving' : 'stable',
          recommendation: perfResult.avg_calc_time > 1000 
            ? 'Optimierung der Berechnungslogik erforderlich'
            : 'Berechnungsleistung ist optimal'
        })
      }

      // 分析缓存性能
      const cacheStmt = this.db.prepare(`
        SELECT 
          AVG(hit_rate_percent) as avg_hit_rate,
          AVG(average_response_time_ms) as avg_response_time
        FROM cache_stats 
        WHERE date_key >= date('now', '-7 days')
      `)
      
      const cacheResult = await cacheStmt.first()
      
      if (cacheResult) {
        insights.push({
          metric_name: 'cache_performance',
          current_value: cacheResult.avg_hit_rate || 0,
          trend: cacheResult.avg_hit_rate > 80 ? 'improving' : 'declining',
          recommendation: cacheResult.avg_hit_rate < 70 
            ? 'Cache-Strategie überprüfen und TTL anpassen'
            : 'Cache-Leistung ist zufriedenstellend'
        })
      }

    } catch (error) {
      console.error('Failed to get performance insights:', error)
    }

    return insights
  }

  /**
   * 生成每日报告
   */
  async generateDailyReport(): Promise<{
    date: string
    summary: string
    metrics: BusinessMetrics
    recommendations: string[]
  }> {
    const metrics = await this.getBusinessMetrics()
    const recommendations: string[] = []

    // 基于指标生成建议
    if (metrics.daily_calculations < 10) {
      recommendations.push('Niedrige tägliche Nutzung - Marketing-Maßnahmen prüfen')
    }

    if (metrics.weekly_growth_rate < 0) {
      recommendations.push('Negative Wachstumsrate - Nutzerverhalten analysieren')
    }

    const performanceIssues = metrics.performance_insights.filter(
      insight => insight.trend === 'declining'
    )
    
    if (performanceIssues.length > 0) {
      recommendations.push('Leistungsprobleme erkannt - Systemoptimierung erforderlich')
    }

    return {
      date: new Date().toISOString().split('T')[0],
      summary: `${metrics.daily_calculations} Berechnungen heute, ${metrics.weekly_growth_rate.toFixed(1)}% Wachstum`,
      metrics,
      recommendations
    }
  }

  /**
   * 获取默认指标（错误情况下）
   */
  private getDefaultMetrics(): BusinessMetrics {
    return {
      daily_calculations: 0,
      weekly_growth_rate: 0,
      popular_calculation_ranges: [],
      user_behavior_patterns: [],
      performance_insights: []
    }
  }

  /**
   * 导出数据分析报告
   */
  async exportAnalyticsReport(format: 'json' | 'csv' = 'json'): Promise<string> {
    const metrics = await this.getBusinessMetrics()
    const dailyReport = await this.generateDailyReport()

    const report = {
      generated_at: new Date().toISOString(),
      period: 'last_30_days',
      metrics,
      daily_report: dailyReport,
      data_quality: {
        completeness: 95, // 示例值
        accuracy: 98,
        timeliness: 99
      }
    }

    if (format === 'json') {
      return JSON.stringify(report, null, 2)
    } else {
      // CSV格式实现
      return this.convertToCSV(report)
    }
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(data: any): string {
    // 简化的CSV转换实现
    const headers = ['Metric', 'Value', 'Trend', 'Recommendation']
    const rows = [headers.join(',')]

    data.metrics.performance_insights.forEach((insight: PerformanceInsight) => {
      rows.push([
        insight.metric_name,
        insight.current_value.toString(),
        insight.trend,
        `"${insight.recommendation}"`
      ].join(','))
    })

    return rows.join('\n')
  }
}
