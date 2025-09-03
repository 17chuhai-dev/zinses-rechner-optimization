/**
 * 监控仪表盘API路由
 * 提供实时监控数据和告警信息
 */

import { Router } from 'itty-router'
import { MonitoringService } from '../services/monitoring'
import { AlertManager } from '../services/alert-manager'
import { DatabaseAnalytics } from '../utils/database-analytics'
import { SecurityService } from '../services/security'

export function createMonitoringRouter(
  monitoringService: MonitoringService,
  alertManager: AlertManager,
  databaseAnalytics: DatabaseAnalytics,
  securityService: SecurityService
): Router {
  const router = Router({ base: '/monitoring' })

  /**
   * 获取系统健康状态
   */
  router.get('/health', async (request: Request, env: Env) => {
    try {
      const healthStatus = await monitoringService.getSystemHealth()
      
      return new Response(JSON.stringify({
        status: 'success',
        data: healthStatus,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(request.headers.get('Origin') || ''),
          ...securityService.getSecurityHeaders()
        }
      })

    } catch (error) {
      console.error('Health check failed:', error)
      
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })

  /**
   * 获取实时指标数据
   */
  router.get('/metrics', async (request: Request, env: Env) => {
    try {
      const url = new URL(request.url)
      const hours = parseInt(url.searchParams.get('hours') || '24')
      const metrics = url.searchParams.get('metrics')?.split(',') || []

      const metricsData = await monitoringService.getMetrics(hours)
      
      // 过滤指定的指标
      if (metrics.length > 0) {
        metricsData.metrics = metricsData.metrics.filter(m => 
          metrics.includes(m.name)
        )
      }

      return new Response(JSON.stringify({
        status: 'success',
        data: metricsData,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(request.headers.get('Origin') || ''),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })

    } catch (error) {
      console.error('Failed to get metrics:', error)
      
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })

  /**
   * 获取性能指标摘要
   */
  router.get('/performance', async (request: Request, env: Env) => {
    try {
      const performanceMetrics = await monitoringService.getPerformanceMetrics()
      const thresholds = await monitoringService.checkPerformanceThresholds()

      return new Response(JSON.stringify({
        status: 'success',
        data: {
          metrics: performanceMetrics,
          thresholds,
          overall_status: Object.values(thresholds).every(Boolean) ? 'healthy' : 'degraded'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(request.headers.get('Origin') || ''),
          'Cache-Control': 'public, max-age=30'
        }
      })

    } catch (error) {
      console.error('Failed to get performance metrics:', error)
      
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to retrieve performance metrics'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })

  /**
   * 获取活跃告警
   */
  router.get('/alerts', async (request: Request, env: Env) => {
    try {
      const activeAlerts = alertManager.getActiveAlerts()
      const alertStats = alertManager.getAlertStats()

      return new Response(JSON.stringify({
        status: 'success',
        data: {
          active_alerts: activeAlerts,
          statistics: alertStats,
          total_count: activeAlerts.length
        },
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(request.headers.get('Origin') || ''),
          'Cache-Control': 'no-cache'
        }
      })

    } catch (error) {
      console.error('Failed to get alerts:', error)
      
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to retrieve alerts'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })

  /**
   * 抑制告警
   */
  router.post('/alerts/:ruleId/suppress', async (request: Request, env: Env) => {
    try {
      const ruleId = request.params?.ruleId
      if (!ruleId) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Rule ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const body = await request.json() as { duration_minutes?: number }
      const durationMinutes = body.duration_minutes || 60

      alertManager.suppressAlert(ruleId, durationMinutes)

      return new Response(JSON.stringify({
        status: 'success',
        message: `Alert ${ruleId} suppressed for ${durationMinutes} minutes`,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(request.headers.get('Origin') || '')
        }
      })

    } catch (error) {
      console.error('Failed to suppress alert:', error)
      
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to suppress alert'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })

  /**
   * 获取业务分析数据
   */
  router.get('/analytics', async (request: Request, env: Env) => {
    try {
      const businessMetrics = await databaseAnalytics.getBusinessMetrics()

      return new Response(JSON.stringify({
        status: 'success',
        data: businessMetrics,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(request.headers.get('Origin') || ''),
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      })

    } catch (error) {
      console.error('Failed to get analytics:', error)
      
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to retrieve analytics data'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })

  /**
   * 获取系统状态概览
   */
  router.get('/overview', async (request: Request, env: Env) => {
    try {
      const [
        healthStatus,
        performanceMetrics,
        activeAlerts,
        businessMetrics
      ] = await Promise.all([
        monitoringService.getSystemHealth(),
        monitoringService.getPerformanceMetrics(),
        alertManager.getActiveAlerts(),
        databaseAnalytics.getBusinessMetrics()
      ])

      const overview = {
        system_health: {
          status: healthStatus.overall_status,
          components: healthStatus.components,
          last_check: healthStatus.last_check
        },
        performance: {
          api_response_time: performanceMetrics.api_response_time,
          error_rate: performanceMetrics.error_rate,
          cache_hit_rate: performanceMetrics.cache_hit_rate,
          requests_per_minute: performanceMetrics.requests_per_minute
        },
        alerts: {
          active_count: activeAlerts.length,
          critical_count: activeAlerts.filter(a => a.severity === 'critical').length,
          warning_count: activeAlerts.filter(a => a.severity === 'warning').length
        },
        business: {
          daily_calculations: businessMetrics.daily_calculations,
          weekly_growth_rate: businessMetrics.weekly_growth_rate,
          popular_ranges: businessMetrics.popular_calculation_ranges.slice(0, 3)
        }
      }

      return new Response(JSON.stringify({
        status: 'success',
        data: overview,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(request.headers.get('Origin') || ''),
          'Cache-Control': 'public, max-age=60' // 1分钟缓存
        }
      })

    } catch (error) {
      console.error('Failed to get overview:', error)
      
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to retrieve system overview'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })

  /**
   * 生成监控报告
   */
  router.get('/report', async (request: Request, env: Env) => {
    try {
      const url = new URL(request.url)
      const format = url.searchParams.get('format') || 'json'
      const period = url.searchParams.get('period') || 'daily'

      let report: any

      if (period === 'daily') {
        report = await databaseAnalytics.generateDailyReport()
      } else {
        // 生成自定义期间报告
        const businessMetrics = await databaseAnalytics.getBusinessMetrics()
        const monitoringReport = await monitoringService.generateMonitoringReport()
        
        report = {
          period,
          generated_at: new Date().toISOString(),
          business_metrics: businessMetrics,
          system_status: monitoringReport.status,
          performance_metrics: monitoringReport.metrics,
          recommendations: monitoringReport.recommendations
        }
      }

      if (format === 'csv') {
        const csvData = await databaseAnalytics.exportAnalyticsReport('csv')
        return new Response(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="monitoring-report-${period}.csv"`
          }
        })
      }

      return new Response(JSON.stringify({
        status: 'success',
        data: report,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(request.headers.get('Origin') || '')
        }
      })

    } catch (error) {
      console.error('Failed to generate report:', error)
      
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to generate monitoring report'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })

  /**
   * WebSocket连接用于实时数据推送
   */
  router.get('/stream', async (request: Request, env: Env) => {
    // WebSocket升级处理
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    try {
      // 创建WebSocket连接
      const webSocketPair = new WebSocketPair()
      const [client, server] = Object.values(webSocketPair)

      // 处理WebSocket连接
      server.accept()
      
      // 设置定期发送监控数据
      const intervalId = setInterval(async () => {
        try {
          const overview = await monitoringService.getSystemHealth()
          server.send(JSON.stringify({
            type: 'health_update',
            data: overview,
            timestamp: new Date().toISOString()
          }))
        } catch (error) {
          console.error('WebSocket data send error:', error)
        }
      }, 30000) // 每30秒发送一次

      // 处理连接关闭
      server.addEventListener('close', () => {
        clearInterval(intervalId)
      })

      return new Response(null, {
        status: 101,
        webSocket: client
      })

    } catch (error) {
      console.error('WebSocket connection failed:', error)
      return new Response('WebSocket connection failed', { status: 500 })
    }
  })

  return router
}
