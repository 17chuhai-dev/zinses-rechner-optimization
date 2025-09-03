/**
 * API网关核心服务
 * 实现统一的API网关，支持路由管理、请求验证、响应格式化和错误处理，集成现有企业级服务
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { EnterpriseDashboardService } from './EnterpriseDashboardService'
import { ReportDesignerService } from './ReportDesignerService'
import { DataExportService } from './DataExportService'
import { UserAnalyticsService } from './UserAnalyticsService'
import { DashboardPermissionController } from './DashboardPermissionController'

// HTTP方法
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

// API请求
export interface APIRequest {
  id: string
  method: HTTPMethod
  path: string
  headers: Record<string, string>
  query: Record<string, any>
  body?: any
  
  // 认证信息
  auth?: {
    type: 'api_key' | 'oauth' | 'jwt' | 'basic'
    credentials: any
  }
  
  // 客户端信息
  client: {
    ip: string
    userAgent: string
    apiKey?: string
    developerId?: string
  }
  
  // 请求元数据
  timestamp: Date
  requestId: string
}

// API响应
export interface APIResponse {
  status: number
  headers: Record<string, string>
  body: any
  
  // 响应元数据
  timestamp: Date
  requestId: string
  executionTime: number
  
  // 分页信息（如适用）
  pagination?: {
    page: number
    pageSize: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
  
  // 限流信息
  rateLimit?: {
    limit: number
    remaining: number
    reset: Date
  }
}

// 标准API响应格式
export interface StandardAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta: {
    timestamp: string
    requestId: string
    version: string
    executionTime: number
  }
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// API路由
export interface APIRoute {
  id: string
  path: string
  method: HTTPMethod
  handler: string // 处理器名称
  
  // 路由配置
  config: {
    // 认证要求
    auth: {
      required: boolean
      types: ('api_key' | 'oauth' | 'jwt' | 'basic')[]
      scopes?: string[]
    }
    
    // 限流配置
    rateLimit: {
      enabled: boolean
      requests: number
      window: number // 秒
      burst?: number
    }
    
    // 缓存配置
    cache: {
      enabled: boolean
      ttl: number // 秒
      key?: string
      vary?: string[]
    }
    
    // 验证配置
    validation: {
      query?: ValidationSchema
      body?: ValidationSchema
      headers?: ValidationSchema
    }
    
    // 响应配置
    response: {
      format: 'json' | 'xml' | 'csv' | 'binary'
      compression: boolean
      headers?: Record<string, string>
    }
  }
  
  // 文档信息
  documentation: {
    summary: string
    description: string
    tags: string[]
    parameters: APIParameter[]
    responses: APIResponseSpec[]
    examples: APIExample[]
  }
  
  // 元数据
  version: string
  deprecated: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean'
  properties?: Record<string, ValidationSchema>
  required?: string[]
  items?: ValidationSchema
  pattern?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
}

export interface APIParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'body'
  type: string
  required: boolean
  description: string
  example?: any
  schema?: ValidationSchema
}

export interface APIResponseSpec {
  status: number
  description: string
  schema?: ValidationSchema
  examples?: Record<string, any>
}

export interface APIExample {
  name: string
  description: string
  request: {
    method: HTTPMethod
    path: string
    headers?: Record<string, string>
    query?: Record<string, any>
    body?: any
  }
  response: {
    status: number
    headers?: Record<string, string>
    body: any
  }
}

// 验证结果
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

// 认证结果
export interface AuthResult {
  authenticated: boolean
  user?: {
    id: string
    type: 'user' | 'developer' | 'application'
    permissions: string[]
    scopes: string[]
  }
  error?: string
}

// 错误响应
export interface ErrorResponse extends StandardAPIResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
    stack?: string
  }
}

// 中间件
export interface Middleware {
  name: string
  order: number
  handler: (request: APIRequest, next: () => Promise<APIRequest>) => Promise<APIRequest>
}

// 响应格式
export type ResponseFormat = 'json' | 'xml' | 'csv' | 'binary'

/**
 * API网关核心服务
 */
export class APIGatewayService {
  private static instance: APIGatewayService
  private dashboardService: EnterpriseDashboardService
  private reportService: ReportDesignerService
  private exportService: DataExportService
  private analyticsService: UserAnalyticsService
  private permissionController: DashboardPermissionController
  
  private routes: Map<string, APIRoute> = new Map()
  private middlewares: Map<string, Middleware> = new Map()
  private handlers: Map<string, Function> = new Map()
  private cache: Map<string, { data: any; expires: Date }> = new Map()
  
  private isInitialized = false

  private constructor() {
    this.dashboardService = EnterpriseDashboardService.getInstance()
    this.reportService = ReportDesignerService.getInstance()
    this.exportService = DataExportService.getInstance()
    this.analyticsService = UserAnalyticsService.getInstance()
    this.permissionController = DashboardPermissionController.getInstance()
  }

  static getInstance(): APIGatewayService {
    if (!APIGatewayService.instance) {
      APIGatewayService.instance = new APIGatewayService()
    }
    return APIGatewayService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await Promise.all([
        this.dashboardService.initialize(),
        this.reportService.initialize(),
        this.exportService.initialize(),
        this.analyticsService.initialize(),
        this.permissionController.initialize()
      ])
      
      await this.registerDefaultRoutes()
      await this.registerDefaultMiddlewares()
      await this.registerDefaultHandlers()
      this.startCacheCleanup()
      this.isInitialized = true
      console.log('✅ APIGatewayService initialized')
    } catch (error) {
      console.error('❌ Failed to initialize APIGatewayService:', error)
      throw error
    }
  }

  /**
   * 注册API路由
   */
  async registerRoute(route: APIRoute): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    // 验证路由配置
    await this.validateRoute(route)

    // 生成路由键
    const routeKey = `${route.method}:${route.path}`
    
    // 注册路由
    this.routes.set(routeKey, route)
    
    console.log(`🛣️ API route registered: ${route.method} ${route.path}`)
  }

  /**
   * 更新API路由
   */
  async updateRoute(routeId: string, updates: Partial<APIRoute>): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    const route = Array.from(this.routes.values()).find(r => r.id === routeId)
    if (!route) {
      throw new Error('Route not found')
    }

    const updatedRoute = { ...route, ...updates, updatedAt: new Date() }
    await this.validateRoute(updatedRoute)

    const routeKey = `${updatedRoute.method}:${updatedRoute.path}`
    this.routes.set(routeKey, updatedRoute)

    console.log(`🔄 API route updated: ${routeId}`)
  }

  /**
   * 移除API路由
   */
  async removeRoute(routeId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize()

    for (const [key, route] of this.routes) {
      if (route.id === routeId) {
        this.routes.delete(key)
        console.log(`🗑️ API route removed: ${routeId}`)
        return
      }
    }

    throw new Error('Route not found')
  }

  /**
   * 处理API请求
   */
  async handleRequest(request: APIRequest): Promise<APIResponse> {
    if (!this.isInitialized) await this.initialize()

    const startTime = Date.now()

    try {
      // 查找路由
      const route = await this.findRoute(request)
      if (!route) {
        return this.createErrorResponse(request, 404, 'NOT_FOUND', 'API endpoint not found')
      }

      // 应用中间件
      const processedRequest = await this.applyMiddleware(request, this.getRouteMiddlewares(route))

      // 验证请求
      const validation = await this.validateRequest(processedRequest, route)
      if (!validation.valid) {
        return this.createErrorResponse(request, 400, 'VALIDATION_ERROR', 'Request validation failed', validation.errors)
      }

      // 认证请求
      const auth = await this.authenticateRequest(processedRequest, route)
      if (route.config.auth.required && !auth.authenticated) {
        return this.createErrorResponse(request, 401, 'UNAUTHORIZED', auth.error || 'Authentication required')
      }

      // 检查缓存
      if (route.config.cache.enabled && request.method === 'GET') {
        const cached = await this.getCachedResponse(request, route)
        if (cached) {
          return this.formatResponse(cached, route.config.response.format, request, Date.now() - startTime)
        }
      }

      // 执行处理器
      const handler = this.handlers.get(route.handler)
      if (!handler) {
        return this.createErrorResponse(request, 500, 'HANDLER_NOT_FOUND', 'Request handler not found')
      }

      const result = await handler(processedRequest, auth.user)

      // 缓存响应
      if (route.config.cache.enabled && request.method === 'GET') {
        await this.cacheResponse(request, route, result)
      }

      // 格式化响应
      return this.formatResponse(result, route.config.response.format, request, Date.now() - startTime)

    } catch (error) {
      console.error('API request failed:', error)
      return this.createErrorResponse(request, 500, 'INTERNAL_ERROR', 'Internal server error', error)
    }
  }

  /**
   * 验证请求
   */
  async validateRequest(request: APIRequest, route: APIRoute): Promise<ValidationResult> {
    const errors: ValidationError[] = []

    // 验证查询参数
    if (route.config.validation.query) {
      const queryErrors = await this.validateData(request.query, route.config.validation.query, 'query')
      errors.push(...queryErrors)
    }

    // 验证请求体
    if (route.config.validation.body && request.body) {
      const bodyErrors = await this.validateData(request.body, route.config.validation.body, 'body')
      errors.push(...bodyErrors)
    }

    // 验证请求头
    if (route.config.validation.headers) {
      const headerErrors = await this.validateData(request.headers, route.config.validation.headers, 'headers')
      errors.push(...headerErrors)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 认证请求
   */
  async authenticateRequest(request: APIRequest, route: APIRoute): Promise<AuthResult> {
    if (!route.config.auth.required) {
      return { authenticated: true }
    }

    // API密钥认证
    if (route.config.auth.types.includes('api_key') && request.client.apiKey) {
      return await this.authenticateAPIKey(request.client.apiKey)
    }

    // JWT认证
    if (route.config.auth.types.includes('jwt')) {
      const token = this.extractJWTToken(request)
      if (token) {
        return await this.authenticateJWT(token)
      }
    }

    // OAuth认证
    if (route.config.auth.types.includes('oauth')) {
      const token = this.extractOAuthToken(request)
      if (token) {
        return await this.authenticateOAuth(token)
      }
    }

    return { authenticated: false, error: 'No valid authentication provided' }
  }

  /**
   * 格式化响应
   */
  async formatResponse(
    data: any,
    format: ResponseFormat,
    request: APIRequest,
    executionTime: number
  ): Promise<APIResponse> {
    const response: StandardAPIResponse = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.requestId,
        version: 'v1',
        executionTime
      }
    }

    let body: any
    let contentType: string

    switch (format) {
      case 'json':
        body = JSON.stringify(response, null, 2)
        contentType = 'application/json'
        break
      case 'xml':
        body = this.convertToXML(response)
        contentType = 'application/xml'
        break
      case 'csv':
        body = this.convertToCSV(data)
        contentType = 'text/csv'
        break
      default:
        body = JSON.stringify(response, null, 2)
        contentType = 'application/json'
    }

    return {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Request-ID': request.requestId,
        'X-Execution-Time': executionTime.toString()
      },
      body,
      timestamp: new Date(),
      requestId: request.requestId,
      executionTime
    }
  }

  /**
   * 处理错误
   */
  async handleError(error: Error, request: APIRequest): Promise<ErrorResponse> {
    console.error('API Error:', error)

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        details: error.stack
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.requestId,
        version: 'v1',
        executionTime: 0
      }
    }
  }

  /**
   * 应用中间件
   */
  async applyMiddleware(request: APIRequest, middlewares: Middleware[]): Promise<APIRequest> {
    let processedRequest = request

    // 按顺序应用中间件
    const sortedMiddlewares = middlewares.sort((a, b) => a.order - b.order)
    
    for (const middleware of sortedMiddlewares) {
      try {
        processedRequest = await middleware.handler(processedRequest, async () => processedRequest)
      } catch (error) {
        console.error(`Middleware error (${middleware.name}):`, error)
        throw error
      }
    }

    return processedRequest
  }

  // 私有方法
  private async registerDefaultRoutes(): Promise<void> {
    // 用户管理API路由
    await this.registerRoute({
      id: 'get_user_profile',
      path: '/api/v1/users/{userId}',
      method: 'GET',
      handler: 'getUserProfile',
      config: {
        auth: { required: true, types: ['api_key', 'jwt'] },
        rateLimit: { enabled: true, requests: 100, window: 3600 },
        cache: { enabled: true, ttl: 300 },
        validation: {},
        response: { format: 'json', compression: true }
      },
      documentation: {
        summary: '获取用户资料',
        description: '根据用户ID获取用户的详细资料信息',
        tags: ['users'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            type: 'string',
            required: true,
            description: '用户唯一标识符',
            example: 'user_123'
          }
        ],
        responses: [
          {
            status: 200,
            description: '成功返回用户资料',
            schema: { type: 'object' }
          }
        ],
        examples: []
      },
      version: 'v1',
      deprecated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // 仪表盘API路由
    await this.registerRoute({
      id: 'get_dashboard_data',
      path: '/api/v1/dashboards/{dashboardId}/data',
      method: 'GET',
      handler: 'getDashboardData',
      config: {
        auth: { required: true, types: ['api_key', 'jwt'], scopes: ['dashboard:read'] },
        rateLimit: { enabled: true, requests: 50, window: 3600 },
        cache: { enabled: true, ttl: 60 },
        validation: {
          query: {
            type: 'object',
            properties: {
              dateRange: { type: 'string' },
              filters: { type: 'object' }
            }
          }
        },
        response: { format: 'json', compression: true }
      },
      documentation: {
        summary: '获取仪表盘数据',
        description: '获取指定仪表盘的数据和分析结果',
        tags: ['dashboards'],
        parameters: [
          {
            name: 'dashboardId',
            in: 'path',
            type: 'string',
            required: true,
            description: '仪表盘ID',
            example: 'dashboard_123'
          }
        ],
        responses: [
          {
            status: 200,
            description: '成功返回仪表盘数据'
          }
        ],
        examples: []
      },
      version: 'v1',
      deprecated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // 报告API路由
    await this.registerRoute({
      id: 'create_report',
      path: '/api/v1/reports',
      method: 'POST',
      handler: 'createReport',
      config: {
        auth: { required: true, types: ['api_key', 'jwt'], scopes: ['reports:write'] },
        rateLimit: { enabled: true, requests: 10, window: 3600 },
        cache: { enabled: false, ttl: 0 },
        validation: {
          body: {
            type: 'object',
            required: ['name', 'config'],
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 100 },
              description: { type: 'string', maxLength: 500 },
              config: { type: 'object' }
            }
          }
        },
        response: { format: 'json', compression: true }
      },
      documentation: {
        summary: '创建报告',
        description: '创建新的自定义报告',
        tags: ['reports'],
        parameters: [],
        responses: [
          {
            status: 201,
            description: '成功创建报告'
          }
        ],
        examples: []
      },
      version: 'v1',
      deprecated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // 数据导出API路由
    await this.registerRoute({
      id: 'export_data',
      path: '/api/v1/exports',
      method: 'POST',
      handler: 'exportData',
      config: {
        auth: { required: true, types: ['api_key', 'jwt'], scopes: ['data:export'] },
        rateLimit: { enabled: true, requests: 5, window: 3600 },
        cache: { enabled: false, ttl: 0 },
        validation: {
          body: {
            type: 'object',
            required: ['configId'],
            properties: {
              configId: { type: 'string' },
              format: { type: 'string' },
              options: { type: 'object' }
            }
          }
        },
        response: { format: 'json', compression: true }
      },
      documentation: {
        summary: '导出数据',
        description: '根据配置导出数据到指定格式',
        tags: ['exports'],
        parameters: [],
        responses: [
          {
            status: 200,
            description: '成功导出数据'
          }
        ],
        examples: []
      },
      version: 'v1',
      deprecated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log(`🛣️ Registered ${this.routes.size} default API routes`)
  }

  private async registerDefaultMiddlewares(): Promise<void> {
    // CORS中间件
    this.middlewares.set('cors', {
      name: 'cors',
      order: 1,
      handler: async (request, next) => {
        // 添加CORS头
        request.headers['Access-Control-Allow-Origin'] = '*'
        request.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        request.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key'
        return await next()
      }
    })

    // 请求日志中间件
    this.middlewares.set('logging', {
      name: 'logging',
      order: 2,
      handler: async (request, next) => {
        console.log(`📝 API Request: ${request.method} ${request.path} from ${request.client.ip}`)
        return await next()
      }
    })

    // 安全头中间件
    this.middlewares.set('security', {
      name: 'security',
      order: 3,
      handler: async (request, next) => {
        request.headers['X-Content-Type-Options'] = 'nosniff'
        request.headers['X-Frame-Options'] = 'DENY'
        request.headers['X-XSS-Protection'] = '1; mode=block'
        return await next()
      }
    })

    console.log(`🔧 Registered ${this.middlewares.size} default middlewares`)
  }

  private async registerDefaultHandlers(): Promise<void> {
    // 用户资料处理器
    this.handlers.set('getUserProfile', async (request: APIRequest, user: any) => {
      const userId = this.extractPathParameter(request.path, 'userId')
      // 简化实现：返回模拟用户数据
      return {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date().toISOString()
      }
    })

    // 仪表盘数据处理器
    this.handlers.set('getDashboardData', async (request: APIRequest, user: any) => {
      const dashboardId = this.extractPathParameter(request.path, 'dashboardId')
      return await this.dashboardService.getDashboardData(
        user.id,
        dashboardId,
        {
          dateRange: request.query.dateRange ? JSON.parse(request.query.dateRange) : undefined,
          ...request.query.filters
        }
      )
    })

    // 报告创建处理器
    this.handlers.set('createReport', async (request: APIRequest, user: any) => {
      return await this.reportService.createReport(
        user.id,
        user.accountId || user.id,
        request.body
      )
    })

    // 数据导出处理器
    this.handlers.set('exportData', async (request: APIRequest, user: any) => {
      return await this.exportService.exportData(
        request.body.configId,
        user.id,
        request.body.options
      )
    })

    console.log(`⚙️ Registered ${this.handlers.size} default handlers`)
  }

  private async validateRoute(route: APIRoute): Promise<void> {
    if (!route.path || !route.method || !route.handler) {
      throw new Error('Route must have path, method, and handler')
    }

    if (!this.handlers.has(route.handler)) {
      throw new Error(`Handler not found: ${route.handler}`)
    }
  }

  private async findRoute(request: APIRequest): Promise<APIRoute | null> {
    const routeKey = `${request.method}:${request.path}`
    
    // 精确匹配
    if (this.routes.has(routeKey)) {
      return this.routes.get(routeKey)!
    }

    // 路径参数匹配
    for (const [key, route] of this.routes) {
      if (this.matchPathPattern(request.path, route.path)) {
        return route
      }
    }

    return null
  }

  private matchPathPattern(requestPath: string, routePath: string): boolean {
    const requestParts = requestPath.split('/')
    const routeParts = routePath.split('/')

    if (requestParts.length !== routeParts.length) {
      return false
    }

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i]
      const requestPart = requestParts[i]

      if (routePart.startsWith('{') && routePart.endsWith('}')) {
        // 路径参数，跳过
        continue
      }

      if (routePart !== requestPart) {
        return false
      }
    }

    return true
  }

  private extractPathParameter(requestPath: string, paramName: string): string {
    // 简化实现：从路径中提取参数
    const parts = requestPath.split('/')
    const paramIndex = parts.findIndex(part => part === paramName || part.includes(paramName))
    return paramIndex > -1 ? parts[paramIndex + 1] || parts[paramIndex] : ''
  }

  private getRouteMiddlewares(route: APIRoute): Middleware[] {
    // 返回所有中间件
    return Array.from(this.middlewares.values())
  }

  private async validateData(data: any, schema: ValidationSchema, context: string): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data) || data[field] == null) {
          errors.push({
            field: `${context}.${field}`,
            message: `Field '${field}' is required`,
            code: 'REQUIRED',
            value: data[field]
          })
        }
      }
    }

    return errors
  }

  private async authenticateAPIKey(apiKey: string): Promise<AuthResult> {
    // 简化实现：模拟API密钥验证
    if (apiKey.startsWith('ak_')) {
      return {
        authenticated: true,
        user: {
          id: 'api_user_123',
          type: 'developer',
          permissions: ['dashboard:read', 'reports:write', 'data:export'],
          scopes: ['dashboard:read', 'reports:write', 'data:export']
        }
      }
    }

    return { authenticated: false, error: 'Invalid API key' }
  }

  private async authenticateJWT(token: string): Promise<AuthResult> {
    // 简化实现：模拟JWT验证
    try {
      // 这里应该验证JWT token
      return {
        authenticated: true,
        user: {
          id: 'jwt_user_123',
          type: 'user',
          permissions: ['dashboard:read'],
          scopes: ['dashboard:read']
        }
      }
    } catch (error) {
      return { authenticated: false, error: 'Invalid JWT token' }
    }
  }

  private async authenticateOAuth(token: string): Promise<AuthResult> {
    // 简化实现：模拟OAuth验证
    return {
      authenticated: true,
      user: {
        id: 'oauth_user_123',
        type: 'application',
        permissions: ['dashboard:read', 'reports:read'],
        scopes: ['dashboard:read', 'reports:read']
      }
    }
  }

  private extractJWTToken(request: APIRequest): string | null {
    const auth = request.headers['authorization'] || request.headers['Authorization']
    if (auth && auth.startsWith('Bearer ')) {
      return auth.substring(7)
    }
    return null
  }

  private extractOAuthToken(request: APIRequest): string | null {
    return request.query.access_token || this.extractJWTToken(request)
  }

  private async getCachedResponse(request: APIRequest, route: APIRoute): Promise<any> {
    const cacheKey = this.generateCacheKey(request, route)
    const cached = this.cache.get(cacheKey)
    
    if (cached && cached.expires > new Date()) {
      return cached.data
    }

    return null
  }

  private async cacheResponse(request: APIRequest, route: APIRoute, data: any): Promise<void> {
    const cacheKey = this.generateCacheKey(request, route)
    const expires = new Date(Date.now() + route.config.cache.ttl * 1000)
    
    this.cache.set(cacheKey, { data, expires })
  }

  private generateCacheKey(request: APIRequest, route: APIRoute): string {
    if (route.config.cache.key) {
      return route.config.cache.key
    }

    const parts = [
      request.method,
      request.path,
      JSON.stringify(request.query),
      request.client.apiKey || 'anonymous'
    ]

    return parts.join(':')
  }

  private createErrorResponse(
    request: APIRequest,
    status: number,
    code: string,
    message: string,
    details?: any
  ): APIResponse {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.requestId,
        version: 'v1',
        executionTime: 0
      }
    }

    return {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': request.requestId
      },
      body: JSON.stringify(errorResponse, null, 2),
      timestamp: new Date(),
      requestId: request.requestId,
      executionTime: 0
    }
  }

  private convertToXML(data: any): string {
    // 简化实现：基本XML转换
    return `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <success>${data.success}</success>
  <data>${JSON.stringify(data.data)}</data>
  <meta>
    <timestamp>${data.meta.timestamp}</timestamp>
    <requestId>${data.meta.requestId}</requestId>
    <version>${data.meta.version}</version>
  </meta>
</response>`
  }

  private convertToCSV(data: any): string {
    if (!Array.isArray(data) || data.length === 0) {
      return ''
    }

    const headers = Object.keys(data[0])
    const rows = data.map(item => 
      headers.map(header => `"${String(item[header] || '').replace(/"/g, '""')}"`).join(',')
    )

    return [headers.join(','), ...rows].join('\n')
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = new Date()
      let cleanedCount = 0

      for (const [key, cached] of this.cache) {
        if (cached.expires <= now) {
          this.cache.delete(key)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`)
      }
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }
}

// Export singleton instance
export const apiGatewayService = APIGatewayService.getInstance()
