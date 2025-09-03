/**
 * Cloudflare Workers缓存策略
 * 优化德国用户访问性能和全球CDN分发
 */

// 缓存配置
const CACHE_CONFIG = {
  // 缓存时间（秒）
  CALCULATION_TTL: 300,     // 5分钟 - 计算结果
  STATIC_TTL: 31536000,     // 1年 - 静态资源
  HTML_TTL: 3600,           // 1小时 - HTML页面
  API_LIMITS_TTL: 3600,     // 1小时 - API限制
  HEALTH_TTL: 60,           // 1分钟 - 健康检查
  
  // 缓存键前缀
  PREFIX: 'zinses_rechner_v1',
  
  // 德国优化
  GERMAN_EDGE_LOCATIONS: ['FRA', 'MUC', 'DUS', 'HAM', 'BER'],
  
  // 性能目标
  TARGET_TTFB_MS: 800,      // 德国节点目标TTFB
  GLOBAL_TTFB_MS: 1200,     // 全球平均目标TTFB
  TARGET_CACHE_HIT_RATE: 0.85 // 目标缓存命中率85%
}

// 缓存键生成器
class CacheKeyGenerator {
  static forCalculation(requestData) {
    // 创建稳定的缓存键
    const sortedData = Object.keys(requestData)
      .sort()
      .reduce((result, key) => {
        result[key] = requestData[key]
        return result
      }, {})
    
    const dataString = JSON.stringify(sortedData)
    return `${CACHE_CONFIG.PREFIX}:calc:${this.hashString(dataString)}`
  }
  
  static forStaticResource(url) {
    return `${CACHE_CONFIG.PREFIX}:static:${url.pathname}`
  }
  
  static forAPILimits() {
    return `${CACHE_CONFIG.PREFIX}:limits:current`
  }
  
  static forHealth() {
    return `${CACHE_CONFIG.PREFIX}:health:status`
  }
  
  static hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }
}

// 缓存管理器
class EdgeCacheManager {
  constructor() {
    this.cache = caches.default
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      errors: 0
    }
  }
  
  async get(cacheKey, request) {
    try {
      const cacheKeyRequest = new Request(cacheKey, {
        method: 'GET',
        headers: request.headers
      })
      
      const cachedResponse = await this.cache.match(cacheKeyRequest)
      
      if (cachedResponse) {
        this.stats.hits++
        
        // 添加缓存命中头
        const response = new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: {
            ...cachedResponse.headers,
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
            'X-Edge-Location': request.cf?.colo || 'unknown'
          }
        })
        
        return response
      }
      
      this.stats.misses++
      return null
      
    } catch (error) {
      this.stats.errors++
      console.error('缓存获取错误:', error)
      return null
    }
  }
  
  async set(cacheKey, response, ttl) {
    try {
      const cacheKeyRequest = new Request(cacheKey)
      
      // 克隆响应以避免流被消费
      const responseToCache = response.clone()
      
      // 设置缓存头
      responseToCache.headers.set('Cache-Control', `public, max-age=${ttl}`)
      responseToCache.headers.set('CDN-Cache-Control', `public, max-age=${ttl}`)
      responseToCache.headers.set('X-Cache', 'MISS')
      responseToCache.headers.set('X-Cache-Key', cacheKey)
      responseToCache.headers.set('X-Cached-At', new Date().toISOString())
      
      await this.cache.put(cacheKeyRequest, responseToCache)
      this.stats.sets++
      
      return response
      
    } catch (error) {
      this.stats.errors++
      console.error('缓存设置错误:', error)
      return response
    }
  }
  
  getStats() {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      total
    }
  }
}

// 请求处理器
class RequestHandler {
  constructor() {
    this.cacheManager = new EdgeCacheManager()
  }
  
  async handleCalculationRequest(request) {
    try {
      // 获取请求体
      const requestData = await request.json()
      
      // 生成缓存键
      const cacheKey = CacheKeyGenerator.forCalculation(requestData)
      
      // 尝试从缓存获取
      const cachedResponse = await this.cacheManager.get(cacheKey, request)
      if (cachedResponse) {
        return cachedResponse
      }
      
      // 缓存未命中，转发到后端
      const backendResponse = await this.forwardToBackend(request, requestData)
      
      // 如果响应成功，缓存结果
      if (backendResponse.ok) {
        return await this.cacheManager.set(
          cacheKey, 
          backendResponse, 
          CACHE_CONFIG.CALCULATION_TTL
        )
      }
      
      return backendResponse
      
    } catch (error) {
      console.error('计算请求处理错误:', error)
      return new Response(JSON.stringify({
        error: 'CACHE_ERROR',
        message: 'Fehler bei der Anfrageverarbeitung'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  async handleStaticRequest(request) {
    const url = new URL(request.url)
    const cacheKey = CacheKeyGenerator.forStaticResource(url)
    
    // 尝试从缓存获取
    const cachedResponse = await this.cacheManager.get(cacheKey, request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 获取原始资源
    const response = await fetch(request)
    
    // 缓存静态资源
    if (response.ok) {
      return await this.cacheManager.set(
        cacheKey,
        response,
        CACHE_CONFIG.STATIC_TTL
      )
    }
    
    return response
  }
  
  async forwardToBackend(request, requestData) {
    // 构建后端请求
    const backendUrl = 'https://api.zinses-rechner.de/api/v1/calculator/compound-interest'
    
    const backendRequest = new Request(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Workers/1.0',
        'X-Forwarded-For': request.headers.get('CF-Connecting-IP'),
        'X-Real-IP': request.headers.get('CF-Connecting-IP'),
        'X-Edge-Location': request.cf?.colo || 'unknown'
      },
      body: JSON.stringify(requestData)
    })
    
    return await fetch(backendRequest)
  }
  
  async handleHealthCheck(request) {
    const cacheKey = CacheKeyGenerator.forHealth()
    
    // 尝试从缓存获取
    const cachedResponse = await this.cacheManager.get(cacheKey, request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 生成健康检查响应
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      edge_location: request.cf?.colo || 'unknown',
      cache_stats: this.cacheManager.getStats(),
      performance: {
        target_ttfb_ms: CACHE_CONFIG.TARGET_TTFB_MS,
        target_cache_hit_rate: CACHE_CONFIG.TARGET_CACHE_HIT_RATE
      }
    }
    
    const response = new Response(JSON.stringify(healthData), {
      headers: { 'Content-Type': 'application/json' }
    })
    
    // 缓存健康检查结果
    return await this.cacheManager.set(
      cacheKey,
      response,
      CACHE_CONFIG.HEALTH_TTL
    )
  }
}

// 主要事件监听器
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const handler = new RequestHandler()
  
  try {
    // 路由请求到相应处理器
    if (url.pathname.includes('/api/v1/calculator/compound-interest')) {
      return await handler.handleCalculationRequest(request)
    }
    
    if (url.pathname === '/health' || url.pathname === '/api/health') {
      return await handler.handleHealthCheck(request)
    }
    
    // 静态资源请求
    if (isStaticResource(url.pathname)) {
      return await handler.handleStaticRequest(request)
    }
    
    // 默认转发
    return await fetch(request)
    
  } catch (error) {
    console.error('请求处理错误:', error)
    
    return new Response(JSON.stringify({
      error: 'WORKER_ERROR',
      message: 'Ein unerwarteter Fehler ist aufgetreten',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

function isStaticResource(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.pdf'
  ]
  
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

// 性能监控
class PerformanceMonitor {
  static async measureTTFB(request) {
    const start = Date.now()
    const response = await fetch(request)
    const ttfb = Date.now() - start
    
    // 记录性能指标
    console.log(`TTFB: ${ttfb}ms for ${request.url}`)
    
    // 如果TTFB超过目标，记录警告
    if (ttfb > CACHE_CONFIG.TARGET_TTFB_MS) {
      console.warn(`TTFB警告: ${ttfb}ms > ${CACHE_CONFIG.TARGET_TTFB_MS}ms`)
    }
    
    return response
  }
  
  static logCachePerformance(stats) {
    const hitRate = parseFloat(stats.hitRate)
    
    if (hitRate < CACHE_CONFIG.TARGET_CACHE_HIT_RATE * 100) {
      console.warn(`缓存命中率警告: ${stats.hitRate} < ${CACHE_CONFIG.TARGET_CACHE_HIT_RATE * 100}%`)
    }
    
    console.log('缓存性能统计:', stats)
  }
}
