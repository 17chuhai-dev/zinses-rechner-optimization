/**
 * API类型定义 - Cloudflare Workers版本
 * 基于FastAPI模型的TypeScript类型定义
 */

/**
 * 计算器请求数据
 */
export interface CalculatorRequest {
  /** 本金金额（欧元） */
  principal: number
  
  /** 月供金额（欧元，可选） */
  monthly_payment: number
  
  /** 年利率（百分比） */
  annual_rate: number
  
  /** 投资年限 */
  years: number
  
  /** 复利频率 */
  compound_frequency: 'monthly' | 'quarterly' | 'yearly'
}

/**
 * 年度明细数据
 */
export interface YearlyBreakdown {
  /** 年份 */
  year: number
  
  /** 年初金额 */
  start_amount: number
  
  /** 年度投入 */
  contributions: number
  
  /** 年度利息 */
  interest: number
  
  /** 年末金额 */
  end_amount: number
  
  /** 年度增长率 */
  growth_rate: number
}

/**
 * 计算器响应数据
 */
export interface CalculatorResponse {
  /** 最终金额 */
  final_amount: number
  
  /** 总投入金额 */
  total_contributions: number
  
  /** 总利息收益 */
  total_interest: number
  
  /** 年化收益率 */
  annual_return: number
  
  /** 年度明细 */
  yearly_breakdown: YearlyBreakdown[]
  
  /** 计算时间 */
  calculation_time: string
  
  /** 性能信息 */
  performance?: {
    calculation_time_ms: number
    cache_used: boolean
    worker_region: string
  }
}

/**
 * 错误响应数据
 */
export interface ErrorResponse {
  /** 错误类型 */
  error: string
  
  /** 错误消息 */
  message: string
  
  /** 错误代码 */
  code: string
  
  /** 详细错误信息 */
  details?: string[]
  
  /** 重试时间（秒） */
  retry_after?: number
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  /** 整体状态 */
  status: 'healthy' | 'degraded' | 'unhealthy'
  
  /** 检查时间 */
  timestamp: string
  
  /** 版本信息 */
  version: string
  
  /** 环境信息 */
  environment: string
  
  /** 服务状态 */
  services: {
    database: boolean
    cache: boolean
    analytics: boolean
  }
  
  /** 性能信息 */
  performance: {
    uptime_seconds: number
    memory_usage_mb: number
    cpu_usage_percent: number
  }
  
  /** 错误信息 */
  error?: string
}

/**
 * 监控指标数据
 */
export interface MetricData {
  /** 指标名称 */
  name: string
  
  /** 指标值 */
  value: number
  
  /** 时间戳 */
  timestamp: string
  
  /** 标签 */
  tags?: Record<string, string>
}

/**
 * 缓存统计数据
 */
export interface CacheStats {
  /** 命中次数 */
  hit_count: number
  
  /** 未命中次数 */
  miss_count: number
  
  /** 命中率百分比 */
  hit_rate_percent: number
  
  /** 总请求数 */
  total_requests: number
  
  /** 最后重置时间 */
  last_reset: string
}

/**
 * 德国税务计算结果
 */
export interface GermanTaxCalculation {
  /** 毛利息 */
  gross_interest: number
  
  /** 免税额度 */
  tax_free_amount: number
  
  /** 应税利息 */
  taxable_interest: number
  
  /** 资本利得税 */
  abgeltungssteuer: number
  
  /** 团结税 */
  solidaritaetszuschlag: number
  
  /** 教会税 */
  kirchensteuer: number
  
  /** 税后利息 */
  net_interest: number
}

/**
 * API限制信息
 */
export interface ApiLimits {
  /** 最大本金 */
  max_principal: number
  
  /** 最大年限 */
  max_years: number
  
  /** 最大月供 */
  max_monthly_payment: number
  
  /** 最小年利率 */
  min_annual_rate: number
  
  /** 最大年利率 */
  max_annual_rate: number
  
  /** 支持的复利频率 */
  supported_frequencies: string[]
  
  /** 货币 */
  currency: string
  
  /** 本地化 */
  locale: string
}

/**
 * 监控指标响应
 */
export interface MetricsResponse {
  /** 指标数据 */
  metrics: MetricData[]
  
  /** 统计摘要 */
  summary: {
    total_requests: number
    average_response_time: number
    error_rate: number
    cache_hit_rate: number
  }
  
  /** 查询时间范围 */
  time_range: {
    start: string
    end: string
    duration_hours: number
  }
  
  /** 查询时间 */
  query_timestamp: string
}

/**
 * 计算历史记录
 */
export interface CalculationHistory {
  /** 记录ID */
  id: string
  
  /** 会话ID */
  session_id: string
  
  /** 计算参数 */
  request_data: CalculatorRequest
  
  /** 计算结果 */
  result_data: CalculatorResponse
  
  /** 创建时间 */
  created_at: string
  
  /** 用户代理 */
  user_agent?: string
  
  /** 客户端IP（哈希后） */
  client_ip_hash?: string
}

/**
 * Workers环境类型扩展
 */
export interface WorkerEnv {
  /** 环境名称 */
  ENVIRONMENT: string
  
  /** 调试模式 */
  DEBUG: string
  
  /** CORS源 */
  CORS_ORIGIN: string
  
  /** 最大计算年限 */
  MAX_CALCULATION_YEARS: string
  
  /** 最大本金金额 */
  MAX_PRINCIPAL_AMOUNT: string
  
  /** 默认税率 */
  DEFAULT_TAX_RATE: string
  
  /** 缓存TTL */
  CACHE_TTL: string
  
  /** 速率限制请求数 */
  RATE_LIMIT_REQUESTS: string
  
  /** 速率限制时间窗口 */
  RATE_LIMIT_WINDOW: string
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** API响应时间 */
  api_response_time: number
  
  /** 计算时间 */
  calculation_time: number
  
  /** 缓存命中率 */
  cache_hit_rate: number
  
  /** 错误率 */
  error_rate: number
  
  /** 请求频率 */
  requests_per_minute: number
  
  /** Worker内存使用 */
  memory_usage_mb: number
  
  /** Worker CPU时间 */
  cpu_time_ms: number
}

/**
 * 告警配置
 */
export interface AlertConfig {
  /** 告警名称 */
  name: string
  
  /** 指标名称 */
  metric_name: string
  
  /** 阈值 */
  threshold: number
  
  /** 比较操作 */
  comparison: 'greater_than' | 'less_than' | 'equals'
  
  /** 严重程度 */
  severity: 'info' | 'warning' | 'error' | 'critical'
  
  /** 持续时间（分钟） */
  duration_minutes: number
  
  /** 通知渠道 */
  channels: string[]
  
  /** 是否启用 */
  enabled: boolean
}
