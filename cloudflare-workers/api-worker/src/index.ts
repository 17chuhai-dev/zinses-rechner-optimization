/**
 * Zinses-Rechner Cloudflare Workers API
 * 德国复利计算器API服务 - Workers版本
 */

import { Router } from 'itty-router'
import { CalculatorService } from './services/calculator'
import { ValidationService } from './services/validation'
import { CacheService } from './services/cache'
import { SecurityService } from './services/security'
import { MonitoringService } from './services/monitoring'
import { 
  CalculatorRequest, 
  CalculatorResponse, 
  ErrorResponse,
  HealthCheckResponse 
} from './types/api'

// 环境接口定义
export interface Env {
  ENVIRONMENT: string
  DEBUG: string
  CORS_ORIGIN: string
  MAX_CALCULATION_YEARS: string
  MAX_PRINCIPAL_AMOUNT: string
  DEFAULT_TAX_RATE: string
  CACHE_TTL: string
  RATE_LIMIT_REQUESTS: string
  RATE_LIMIT_WINDOW: string
  
  // 绑定资源
  DB: D1Database
  CACHE: KVNamespace
  ANALYTICS: AnalyticsEngineDataset
  RATE_LIMITER: DurableObjectNamespace
}

// 创建路由器
const router = Router()

// 服务实例
let calculatorService: CalculatorService
let validationService: ValidationService
let cacheService: CacheService
let securityService: SecurityService
let monitoringService: MonitoringService

/**
 * 初始化服务
 */
function initializeServices(env: Env) {
  calculatorService = new CalculatorService(env)
  validationService = new ValidationService(env)
  cacheService = new CacheService(env)
  securityService = new SecurityService(env)
  monitoringService = new MonitoringService(env)
}

/**
 * CORS预检请求处理
 */
router.options('*', (request: Request, env: Env) => {
  return new Response(null, {
    status: 204,
    headers: securityService.getCorsHeaders(env.CORS_ORIGIN)
  })
})

/**
 * 健康检查端点
 */
router.get('/health', async (request: Request, env: Env) => {
  try {
    const healthData: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.ENVIRONMENT,
      services: {
        database: await checkDatabaseHealth(env.DB),
        cache: await checkCacheHealth(env.CACHE),
        analytics: true
      },
      performance: {
        uptime_seconds: Date.now() / 1000,
        memory_usage_mb: 0, // Workers不提供内存信息
        cpu_usage_percent: 0 // Workers不提供CPU信息
      }
    }

    // 记录健康检查指标
    await monitoringService.recordMetric('health_check', 1, { status: 'success' })

    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...securityService.getSecurityHeaders(),
        ...securityService.getCorsHeaders(env.CORS_ORIGIN)
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.ENVIRONMENT,
      services: {
        database: false,
        cache: false,
        analytics: false
      },
      performance: {
        uptime_seconds: 0,
        memory_usage_mb: 0,
        cpu_usage_percent: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        ...securityService.getSecurityHeaders(),
        ...securityService.getCorsHeaders(env.CORS_ORIGIN)
      }
    })
  }
})

/**
 * 复利计算API端点
 */
router.post('/api/v1/calculate/compound-interest', async (request: Request, env: Env) => {
  const startTime = Date.now()
  
  try {
    // 安全检查
    const securityCheck = await securityService.validateRequest(request, env)
    if (!securityCheck.valid) {
      return new Response(JSON.stringify({
        error: 'SECURITY_VIOLATION',
        message: securityCheck.message,
        code: 'SECURITY_ERROR'
      } as ErrorResponse), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(env.CORS_ORIGIN)
        }
      })
    }

    // 速率限制检查
    const rateLimitCheck = await securityService.checkRateLimit(request, env)
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
        code: 'RATE_LIMIT_ERROR',
        retry_after: rateLimitCheck.retryAfter
      } as ErrorResponse), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitCheck.retryAfter.toString(),
          ...securityService.getCorsHeaders(env.CORS_ORIGIN)
        }
      })
    }

    // 解析请求数据
    const requestData: CalculatorRequest = await request.json()

    // 输入验证
    const validationResult = validationService.validateCalculatorRequest(requestData)
    if (!validationResult.valid) {
      return new Response(JSON.stringify({
        error: 'VALIDATION_ERROR',
        message: validationResult.message,
        code: 'INVALID_INPUT',
        details: validationResult.errors
      } as ErrorResponse), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...securityService.getCorsHeaders(env.CORS_ORIGIN)
        }
      })
    }

    // 检查缓存
    const cacheKey = cacheService.generateCacheKey(requestData)
    const cachedResult = await cacheService.get(cacheKey)
    
    if (cachedResult) {
      // 记录缓存命中指标
      await monitoringService.recordMetric('cache_hit', 1, { endpoint: 'compound_interest' })
      
      return new Response(JSON.stringify(cachedResult), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${env.CACHE_TTL}`,
          ...securityService.getSecurityHeaders(),
          ...securityService.getCorsHeaders(env.CORS_ORIGIN)
        }
      })
    }

    // 执行计算
    const calculationResult = await calculatorService.calculateCompoundInterest(requestData)

    // 缓存结果
    await cacheService.set(cacheKey, calculationResult, parseInt(env.CACHE_TTL))

    // 记录性能指标
    const responseTime = Date.now() - startTime
    await monitoringService.recordMetric('api_response_time', responseTime, { 
      endpoint: 'compound_interest',
      cache_status: 'miss'
    })
    await monitoringService.recordMetric('cache_miss', 1, { endpoint: 'compound_interest' })

    // 可选：保存计算历史到数据库
    if (env.ENVIRONMENT === 'production') {
      try {
        await saveCalculationHistory(env.DB, requestData, calculationResult)
      } catch (error) {
        console.warn('Failed to save calculation history:', error)
        // 不影响主要响应
      }
    }

    return new Response(JSON.stringify(calculationResult), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Response-Time': `${responseTime}ms`,
        'Cache-Control': `public, max-age=${env.CACHE_TTL}`,
        ...securityService.getSecurityHeaders(),
        ...securityService.getCorsHeaders(env.CORS_ORIGIN)
      }
    })

  } catch (error) {
    console.error('Calculation error:', error)
    
    // 记录错误指标
    await monitoringService.recordMetric('api_error', 1, { 
      endpoint: 'compound_interest',
      error_type: error instanceof Error ? error.constructor.name : 'unknown'
    })

    const errorResponse: ErrorResponse = {
      error: 'CALCULATION_ERROR',
      message: 'Ein Fehler ist bei der Berechnung aufgetreten',
      code: 'INTERNAL_ERROR'
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...securityService.getSecurityHeaders(),
        ...securityService.getCorsHeaders(env.CORS_ORIGIN)
      }
    })
  }
})

/**
 * 计算限制信息端点
 */
router.get('/api/v1/calculate/limits', async (request: Request, env: Env) => {
  const limits = {
    max_principal: parseFloat(env.MAX_PRINCIPAL_AMOUNT),
    max_years: parseInt(env.MAX_CALCULATION_YEARS),
    max_monthly_payment: 50000,
    min_annual_rate: 0.01,
    max_annual_rate: 20.0,
    supported_frequencies: ['monthly', 'quarterly', 'yearly'],
    currency: 'EUR',
    locale: 'de_DE'
  }

  return new Response(JSON.stringify(limits), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      ...securityService.getSecurityHeaders(),
      ...securityService.getCorsHeaders(env.CORS_ORIGIN)
    }
  })
})

/**
 * 监控指标端点
 */
router.get('/monitoring/metrics', async (request: Request, env: Env) => {
  try {
    const metrics = await monitoringService.getMetrics()
    
    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...securityService.getSecurityHeaders(),
        ...securityService.getCorsHeaders(env.CORS_ORIGIN)
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'METRICS_ERROR',
      message: 'Failed to retrieve metrics'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/**
 * 404处理
 */
router.all('*', () => {
  return new Response(JSON.stringify({
    error: 'NOT_FOUND',
    message: 'Endpoint nicht gefunden',
    code: 'ENDPOINT_NOT_FOUND'
  } as ErrorResponse), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  })
})

/**
 * 辅助函数：检查数据库健康状态
 */
async function checkDatabaseHealth(db: D1Database): Promise<boolean> {
  try {
    const result = await db.prepare('SELECT 1 as test').first()
    return result?.test === 1
  } catch {
    return false
  }
}

/**
 * 辅助函数：检查缓存健康状态
 */
async function checkCacheHealth(cache: KVNamespace): Promise<boolean> {
  try {
    const testKey = 'health_check_' + Date.now()
    await cache.put(testKey, 'test', { expirationTtl: 60 })
    const result = await cache.get(testKey)
    await cache.delete(testKey)
    return result === 'test'
  } catch {
    return false
  }
}

/**
 * 辅助函数：保存计算历史
 */
async function saveCalculationHistory(
  db: D1Database, 
  request: CalculatorRequest, 
  result: CalculatorResponse
): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO calculation_history 
    (session_id, principal, annual_rate, years, monthly_payment, final_amount, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  
  await stmt.bind(
    crypto.randomUUID(),
    request.principal,
    request.annual_rate,
    request.years,
    request.monthly_payment,
    result.final_amount,
    new Date().toISOString()
  ).run()
}

/**
 * Workers主入口点
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 初始化服务
    initializeServices(env)
    
    try {
      // 处理请求
      const response = await router.handle(request, env, ctx)
      
      // 记录请求指标
      await monitoringService.recordMetric('api_request', 1, {
        method: request.method,
        path: new URL(request.url).pathname,
        status: response.status
      })
      
      return response
      
    } catch (error) {
      console.error('Worker error:', error)
      
      // 记录错误指标
      await monitoringService.recordMetric('worker_error', 1, {
        error_type: error instanceof Error ? error.constructor.name : 'unknown'
      })
      
      return new Response(JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Ein unerwarteter Fehler ist aufgetreten',
        code: 'WORKER_ERROR'
      } as ErrorResponse), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...securityService.getSecurityHeaders(),
          ...securityService.getCorsHeaders(env.CORS_ORIGIN)
        }
      })
    }
  },

  /**
   * 定时任务处理
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    initializeServices(env)
    
    try {
      // 清理过期缓存
      await cacheService.cleanup()
      
      // 运行健康检查
      await monitoringService.runHealthChecks()
      
      // 清理旧的分析数据
      await monitoringService.cleanupOldMetrics()
      
      console.log('Scheduled task completed successfully')
      
    } catch (error) {
      console.error('Scheduled task error:', error)
    }
  }
}
