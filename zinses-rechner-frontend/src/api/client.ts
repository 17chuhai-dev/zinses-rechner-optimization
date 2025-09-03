/**
 * RESTful API客户端
 * 提供统一的API访问接口，支持认证、错误处理、重试等功能
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import {
  API_CONFIG,
  API_STATUS_CODES,
  API_ERROR_TYPES,
  API_HEADERS,
  CONTENT_TYPES,
  HTTP_METHODS,
  apiRouteBuilder
} from './routes'

// API请求配置
export interface ApiRequestConfig {
  method?: keyof typeof HTTP_METHODS
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  retries?: number
  requireAuth?: boolean
  contentType?: string
}

// API响应接口
export interface ApiResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
  success: boolean
}

// API错误接口
export interface ApiError {
  type: keyof typeof API_ERROR_TYPES
  message: string
  status?: number
  code?: string
  details?: Record<string, unknown>
  timestamp: Date
}

// 认证令牌接口
export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  tokenType: string
}

class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private authToken: AuthToken | null = null
  private requestInterceptors: Array<(config: ApiRequestConfig) => ApiRequestConfig> = []
  private responseInterceptors: Array<(response: ApiResponse) => ApiResponse> = []

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl
    this.defaultHeaders = {
      [API_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
      [API_HEADERS.ACCEPT]: CONTENT_TYPES.JSON,
      [API_HEADERS.X_CLIENT_VERSION]: '1.0.0'
    }
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: AuthToken): void {
    this.authToken = token
    this.defaultHeaders[API_HEADERS.AUTHORIZATION] = `${token.tokenType} ${token.accessToken}`
  }

  /**
   * 清除认证令牌
   */
  clearAuthToken(): void {
    this.authToken = null
    delete this.defaultHeaders[API_HEADERS.AUTHORIZATION]
  }

  /**
   * 检查令牌是否过期
   */
  isTokenExpired(): boolean {
    if (!this.authToken) return true
    return new Date() >= this.authToken.expiresAt
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: (config: ApiRequestConfig) => ApiRequestConfig): void {
    this.requestInterceptors.push(interceptor)
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse): void {
    this.responseInterceptors.push(interceptor)
  }

  /**
   * 发送HTTP请求
   */
  async request<T = unknown>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONFIG.timeout,
      retries = API_CONFIG.retryAttempts,
      requireAuth = false,
      contentType
    } = config

    // 检查认证要求
    if (requireAuth && !this.authToken) {
      throw this.createError('AUTHENTICATION_ERROR', '需要认证', 401)
    }

    // 检查令牌是否过期
    if (requireAuth && this.isTokenExpired()) {
      await this.refreshToken()
    }

    // 构建请求配置
    let requestConfig: ApiRequestConfig = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers
      },
      body,
      timeout,
      retries,
      requireAuth,
      contentType: contentType || this.defaultHeaders[API_HEADERS.CONTENT_TYPE]
    }

    // 应用请求拦截器
    for (const interceptor of this.requestInterceptors) {
      requestConfig = interceptor(requestConfig)
    }

    // 构建完整URL
    const url = apiRouteBuilder.buildUrl(endpoint)

    // 执行请求（带重试）
    return this.executeRequest<T>(url, requestConfig, retries)
  }

  /**
   * 执行HTTP请求（带重试逻辑）
   */
  private async executeRequest<T extends Record<string, unknown> | string | null>(
    url: string,
    config: ApiRequestConfig,
    retriesLeft: number
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)

      // 准备请求体
      let body: string | FormData | undefined
      if (config.body) {
        if (config.contentType === CONTENT_TYPES.JSON) {
          body = JSON.stringify(config.body)
        } else if (config.contentType === CONTENT_TYPES.FORM_DATA) {
          body = config.body instanceof FormData ? config.body : this.objectToFormData(config.body as Record<string, unknown>)
        } else {
          body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body)
        }
      }

      // 发送请求
      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // 处理响应
      const apiResponse = await this.processResponse<T>(response)

      // 应用响应拦截器
      let finalResponse = apiResponse
      for (const interceptor of this.responseInterceptors) {
        finalResponse = interceptor(finalResponse) as ApiResponse<T>
      }

      return finalResponse

    } catch (error) {
      // 重试逻辑
      if (retriesLeft > 0 && this.shouldRetry(error)) {
        await this.delay(1000 * (API_CONFIG.retryAttempts - retriesLeft + 1))
        return this.executeRequest<T>(url, config, retriesLeft - 1)
      }

      throw this.handleRequestError(error)
    }
  }

  /**
   * 处理HTTP响应
   */
  private async processResponse<T extends Record<string, unknown> | string | null>(response: Response): Promise<ApiResponse<T>> {
    const success = response.ok
    let data: T

    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text() as T
      }
    } catch (error) {
      data = null as T
    }

    if (!success) {
      const errorData = data as Record<string, unknown> | null
      throw this.createError(
        this.getErrorType(response.status),
        (errorData && typeof errorData === 'object' && 'message' in errorData ? errorData.message as string : undefined) || response.statusText,
        response.status,
        (errorData && typeof errorData === 'object' && 'code' in errorData ? errorData.code as string : undefined),
        errorData || undefined
      )
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      success
    }
  }

  /**
   * 处理请求错误
   */
  private handleRequestError(error: unknown): ApiError {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      return this.createError('NETWORK_ERROR', '请求超时', 0)
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.createError('NETWORK_ERROR', '网络连接失败', 0)
    }

    if (error && typeof error === 'object' && 'type' in error) {
      return error as ApiError // 已经是ApiError
    }

    const errorMessage = error && typeof error === 'object' && 'message' in error
      ? (error.message as string)
      : '未知错误'
    return this.createError('SERVER_ERROR', errorMessage, 500)
  }

  /**
   * 创建API错误
   */
  private createError(
    type: keyof typeof API_ERROR_TYPES,
    message: string,
    status?: number,
    code?: string,
    details?: Record<string, unknown>
  ): ApiError {
    return {
      type,
      message,
      status,
      code,
      details,
      timestamp: new Date()
    }
  }

  /**
   * 获取错误类型
   */
  private getErrorType(status: number): keyof typeof API_ERROR_TYPES {
    switch (status) {
      case API_STATUS_CODES.BAD_REQUEST:
      case API_STATUS_CODES.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR'
      case API_STATUS_CODES.UNAUTHORIZED:
        return 'AUTHENTICATION_ERROR'
      case API_STATUS_CODES.FORBIDDEN:
        return 'AUTHORIZATION_ERROR'
      case API_STATUS_CODES.NOT_FOUND:
        return 'NOT_FOUND_ERROR'
      case API_STATUS_CODES.CONFLICT:
        return 'CONFLICT_ERROR'
      case API_STATUS_CODES.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_ERROR'
      default:
        return 'SERVER_ERROR'
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: unknown): boolean {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return false
    if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number' && error.status < 500) return false
    return true
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 对象转FormData
   */
  private objectToFormData(obj: Record<string, unknown>): FormData {
    const formData = new FormData()
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    })
    return formData
  }

  /**
   * 刷新认证令牌
   */
  private async refreshToken(): Promise<void> {
    if (!this.authToken?.refreshToken) {
      throw this.createError('AUTHENTICATION_ERROR', '无法刷新令牌', 401)
    }

    try {
      const response = await this.request<AuthToken>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: this.authToken.refreshToken },
        requireAuth: false
      })

      this.setAuthToken(response.data)
    } catch (error) {
      this.clearAuthToken()
      throw this.createError('AUTHENTICATION_ERROR', '令牌刷新失败', 401)
    }
  }

  // 便捷方法
  async get<T = unknown>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T = unknown>(endpoint: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body })
  }

  async put<T = unknown>(endpoint: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body })
  }

  async patch<T = unknown>(endpoint: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body })
  }

  async delete<T = unknown>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }
}

// 导出单例实例
export const apiClient = new ApiClient()

// 导出类型
export type { ApiRequestConfig, ApiResponse, ApiError, AuthToken }
