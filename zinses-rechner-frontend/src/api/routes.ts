/**
 * RESTful API路由定义
 * 支持所有核心功能的程序化访问
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

// API基础配置
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  version: 'v1',
  timeout: 30000,
  retryAttempts: 3
}

// API端点定义
export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    refresh: '/auth/refresh',
    verify: '/auth/verify',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password'
  },

  // 用户管理
  users: {
    profile: '/users/profile',
    preferences: '/users/preferences',
    consent: '/users/consent',
    sessions: '/users/sessions',
    export: '/users/export',
    delete: '/users/delete'
  },

  // 计算器相关
  calculators: {
    list: '/calculators',
    calculate: '/calculators/:type/calculate',
    validate: '/calculators/:type/validate',
    schema: '/calculators/:type/schema',
    history: '/calculators/history',
    favorites: '/calculators/favorites'
  },

  // 复利计算器
  compoundInterest: {
    calculate: '/calculators/compound-interest/calculate',
    validate: '/calculators/compound-interest/validate',
    schema: '/calculators/compound-interest/schema',
    scenarios: '/calculators/compound-interest/scenarios'
  },

  // 贷款计算器
  loan: {
    calculate: '/calculators/loan/calculate',
    validate: '/calculators/loan/validate',
    schema: '/calculators/loan/schema',
    amortization: '/calculators/loan/amortization',
    comparison: '/calculators/loan/comparison'
  },

  // 房贷计算器
  mortgage: {
    calculate: '/calculators/mortgage/calculate',
    validate: '/calculators/mortgage/validate',
    schema: '/calculators/mortgage/schema',
    affordability: '/calculators/mortgage/affordability',
    costs: '/calculators/mortgage/costs'
  },

  // 财务目标
  goals: {
    list: '/goals',
    create: '/goals',
    update: '/goals/:id',
    delete: '/goals/:id',
    progress: '/goals/:id/progress',
    milestones: '/goals/:id/milestones'
  },

  // 计算历史
  history: {
    list: '/history',
    create: '/history',
    update: '/history/:id',
    delete: '/history/:id',
    export: '/history/export',
    search: '/history/search'
  },

  // 分析和报告
  analytics: {
    dashboard: '/analytics/dashboard',
    usage: '/analytics/usage',
    performance: '/analytics/performance',
    trends: '/analytics/trends',
    reports: '/analytics/reports'
  },

  // 内容管理
  content: {
    articles: '/content/articles',
    categories: '/content/categories',
    tags: '/content/tags',
    search: '/content/search',
    recommendations: '/content/recommendations'
  },

  // 系统管理
  system: {
    health: '/system/health',
    status: '/system/status',
    metrics: '/system/metrics',
    config: '/system/config'
  }
}

// HTTP方法定义
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const

// API响应状态码
export const API_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

// API错误类型
export const API_ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const

// 请求头定义
export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  X_API_KEY: 'X-API-Key',
  X_REQUEST_ID: 'X-Request-ID',
  X_CLIENT_VERSION: 'X-Client-Version'
} as const

// 内容类型
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  CSV: 'text/csv',
  PDF: 'application/pdf',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
} as const

// API路由构建器
export class ApiRouteBuilder {
  private baseUrl: string
  private version: string

  constructor(baseUrl: string = API_CONFIG.baseUrl, version: string = API_CONFIG.version) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // 移除末尾斜杠
    this.version = version
  }

  /**
   * 构建完整的API URL
   */
  buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    let url = `${this.baseUrl}/${this.version}${endpoint}`

    // 替换路径参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, String(value))
      })
    }

    return url
  }

  /**
   * 构建查询字符串
   */
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })

    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  /**
   * 构建完整的请求URL（包含查询参数）
   */
  buildFullUrl(
    endpoint: string,
    pathParams?: Record<string, string | number>,
    queryParams?: Record<string, any>
  ): string {
    const baseUrl = this.buildUrl(endpoint, pathParams)
    const queryString = queryParams ? this.buildQueryString(queryParams) : ''
    return `${baseUrl}${queryString}`
  }
}

// 默认路由构建器实例
export const apiRouteBuilder = new ApiRouteBuilder()

// 常用路由构建函数
export const buildApiUrl = (
  endpoint: string,
  pathParams?: Record<string, string | number>,
  queryParams?: Record<string, any>
): string => {
  return apiRouteBuilder.buildFullUrl(endpoint, pathParams, queryParams)
}

// 计算器特定路由构建函数
export const buildCalculatorUrl = (
  calculatorType: string,
  action: string,
  params?: Record<string, any>
): string => {
  const endpoint = `/calculators/${calculatorType}/${action}`
  return buildApiUrl(endpoint, undefined, params)
}

// 用户相关路由构建函数
export const buildUserUrl = (
  action: string,
  userId?: string,
  params?: Record<string, any>
): string => {
  const endpoint = userId ? `/users/${userId}/${action}` : `/users/${action}`
  return buildApiUrl(endpoint, undefined, params)
}

// 目标相关路由构建函数
export const buildGoalUrl = (
  action: string,
  goalId?: string,
  params?: Record<string, any>
): string => {
  const endpoint = goalId ? `/goals/${goalId}/${action}` : `/goals/${action}`
  return buildApiUrl(endpoint, undefined, params)
}

// 历史记录相关路由构建函数
export const buildHistoryUrl = (
  action: string,
  historyId?: string,
  params?: Record<string, any>
): string => {
  const endpoint = historyId ? `/history/${historyId}/${action}` : `/history/${action}`
  return buildApiUrl(endpoint, undefined, params)
}

// API版本检查
export const checkApiVersion = async (): Promise<{ version: string; compatible: boolean }> => {
  try {
    const response = await fetch(buildApiUrl('/system/status'))
    const data = await response.json()

    return {
      version: data.version || 'unknown',
      compatible: data.version === API_CONFIG.version
    }
  } catch (error) {
    console.error('API版本检查失败:', error)
    return {
      version: 'unknown',
      compatible: false
    }
  }
}
