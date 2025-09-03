# Zinses-Rechner API 文档

## 概览

Zinses-Rechner API 提供高性能的复利计算服务，专为德国市场优化，部署在 Cloudflare Workers 上，具有全球低延迟和高可用性。

### 🇩🇪 德语专注优化 (2025-09-03)

API已经过德语单一化优化：
- ✅ **德语优先**: 所有响应和错误消息均为德语
- ✅ **德国标准**: 货币格式、日期格式符合德国标准
- ✅ **税务集成**: 完整的德国税务计算支持
- ✅ **性能优化**: 移除多语言支持，提升响应速度

### 基础信息

- **Base URL**: `https://api.zinses-rechner.de`
- **API Version**: `v1`
- **Content-Type**: `application/json`
- **Rate Limit**: 100 requests/15min per IP
- **Authentication**: 无需认证（公开API）

## 🧮 复利计算 API

### POST /api/v1/calculate/compound-interest

计算复利增长和投资回报。

#### 请求参数

```typescript
interface CalculationRequest {
  principal: number          // 本金 (€) - 范围: 1 - 10,000,000
  annual_rate: number        // 年利率 (%) - 范围: 0 - 20
  years: integer            // 投资年限 - 范围: 1 - 50
  monthly_payment?: number   // 月度投入 (€) - 范围: 0 - 50,000
  compound_frequency?: string // 复利频率: "monthly" | "quarterly" | "annually"
  include_tax?: boolean      // 是否包含德国税务计算
  kirchensteuer?: boolean    // 是否缴纳教会税
}
```

#### 请求示例

```bash
curl -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
  -H "Content-Type: application/json" \
  -d '{
    "principal": 10000,
    "annual_rate": 4.0,
    "years": 10,
    "monthly_payment": 500,
    "compound_frequency": "monthly",
    "include_tax": true,
    "kirchensteuer": false
  }'
```

#### 响应格式

```typescript
interface CalculationResponse {
  // 基础计算结果
  final_amount: number           // 最终金额 (€)
  total_contributions: number    // 总投入 (€)
  total_interest: number         // 总利息收益 (€)
  effective_annual_rate: number  // 有效年化收益率 (%)
  
  // 税务计算（如果启用）
  tax_calculation?: {
    gross_interest: number       // 税前利息
    tax_free_amount: number      // 免税额度 (Sparerpauschbetrag)
    taxable_interest: number     // 应税利息
    abgeltungssteuer: number     // 资本利得税
    solidaritaetszuschlag: number // 团结税
    kirchensteuer?: number       // 教会税
    net_interest: number         // 税后利息
    final_amount_after_tax: number // 税后最终金额
  }
  
  // 年度明细
  yearly_breakdown: Array<{
    year: number                 // 年份
    start_amount: number         // 年初金额
    contributions: number        // 年度投入
    interest_earned: number      // 年度利息
    end_amount: number           // 年末金额
    cumulative_interest: number  // 累计利息
    growth_rate: number          // 年度增长率
  }>
  
  // 元数据
  calculation_metadata: {
    calculation_time: string     // ISO 8601 时间戳
    formula_used: string         // 使用的计算公式
    compound_frequency: string   // 复利频率
    precision: number            // 计算精度
    cache_hit: boolean          // 是否命中缓存
  }
}
```

#### 响应示例

```json
{
  "final_amount": 75624.32,
  "total_contributions": 70000,
  "total_interest": 5624.32,
  "effective_annual_rate": 4.12,
  "tax_calculation": {
    "gross_interest": 5624.32,
    "tax_free_amount": 1000,
    "taxable_interest": 4624.32,
    "abgeltungssteuer": 1156.08,
    "solidaritaetszuschlag": 63.58,
    "net_interest": 4404.66,
    "final_amount_after_tax": 74404.66
  },
  "yearly_breakdown": [
    {
      "year": 1,
      "start_amount": 10000,
      "contributions": 6000,
      "interest_earned": 653.33,
      "end_amount": 16653.33,
      "cumulative_interest": 653.33,
      "growth_rate": 6.53
    }
  ],
  "calculation_metadata": {
    "calculation_time": "2024-01-15T10:30:00.123Z",
    "formula_used": "A = P(1 + r/n)^(nt) + PMT * [((1 + r/n)^(nt) - 1) / (r/n)]",
    "compound_frequency": "monthly",
    "precision": 2,
    "cache_hit": false
  }
}
```

#### 错误响应

```typescript
interface ErrorResponse {
  error: string              // 错误类型
  message: string            // 德语错误消息
  details?: any             // 详细错误信息
  timestamp: string         // 错误时间戳
}
```

**常见错误码:**

- `400 Bad Request`: 输入参数无效
- `422 Unprocessable Entity`: 参数验证失败
- `429 Too Many Requests`: 超出速率限制
- `500 Internal Server Error`: 服务器内部错误

**错误示例:**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Das Startkapital muss zwischen 1€ und 10.000.000€ liegen.",
  "details": {
    "field": "principal",
    "value": -1000,
    "constraint": "minimum: 1"
  },
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

## 🏥 健康检查 API

### GET /health

基础健康检查端点。

#### 响应格式

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.123Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### GET /health/detailed

详细健康检查（仅非生产环境）。

#### 响应格式

```json
{
  "overall_status": "healthy",
  "timestamp": "2024-01-15T10:30:00.123Z",
  "components": {
    "database": {
      "status": "healthy",
      "response_time_ms": 10
    },
    "cache": {
      "status": "healthy",
      "hit_rate_percent": 85
    },
    "system_resources": {
      "status": "healthy",
      "cpu_usage_percent": 25,
      "memory_usage_percent": 60
    }
  }
}
```

## 📊 监控 API

### GET /metrics

Prometheus格式的应用指标。

#### 响应示例

```
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{method="POST",endpoint="/api/v1/calculate/compound-interest",status="200"} 1234

# HELP api_request_duration_seconds API request duration
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_bucket{le="0.1"} 800
api_request_duration_seconds_bucket{le="0.5"} 950
api_request_duration_seconds_bucket{le="1.0"} 990
api_request_duration_seconds_bucket{le="+Inf"} 1000

# HELP system_cpu_usage CPU usage percentage
# TYPE system_cpu_usage gauge
system_cpu_usage 25.5

# HELP system_memory_usage Memory usage percentage  
# TYPE system_memory_usage gauge
system_memory_usage 60.2
```

## 🔒 安全性

### 安全头

所有API响应包含以下安全头：

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

### 速率限制

- **标准限制**: 100 requests/15min per IP
- **计算API**: 50 requests/15min per IP
- **健康检查**: 200 requests/15min per IP

### 输入验证

所有输入参数经过严格验证：

- **SQL注入检测**: 自动检测和阻止SQL注入尝试
- **XSS防护**: HTML内容净化和转义
- **参数范围验证**: 数值参数范围检查
- **类型验证**: 严格的TypeScript类型检查

## 🌍 国际化

### 支持的语言环境

- **主要**: `de-DE` (德语 - 德国)
- **货币**: EUR (欧元)
- **日期格式**: DD.MM.YYYY
- **数字格式**: 德国标准 (1.234.567,89)

### 本地化响应

API响应中的所有文本内容都已本地化为德语：

```json
{
  "error": "INVALID_INPUT",
  "message": "Das Startkapital muss eine positive Zahl sein.",
  "details": {
    "field_name": "Startkapital",
    "validation_rule": "Muss größer als 0 sein"
  }
}
```

## 🚀 性能优化

### 缓存策略

- **计算结果**: 5分钟缓存（基于输入参数）
- **静态内容**: 1年缓存
- **API响应**: Edge缓存，全球分发

### 响应时间目标

- **德国**: < 200ms
- **欧洲**: < 400ms
- **全球**: < 800ms

## 📈 使用统计

### 可用指标

- 每日/月度计算次数
- 平均计算参数
- 地理分布
- 设备类型分布
- 性能指标趋势

### 隐私保护

- 不收集个人身份信息
- IP地址匿名化
- DSGVO完全合规
- 用户可选择退出分析

## 🔧 开发者工具

### API测试

```bash
# 健康检查
curl https://api.zinses-rechner.de/health

# 基础计算测试
curl -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
  -H "Content-Type: application/json" \
  -d '{"principal": 1000, "annual_rate": 3, "years": 5}'

# 性能测试
ab -n 100 -c 10 https://api.zinses-rechner.de/health
```

### SDK 和客户端库

```typescript
// TypeScript/JavaScript Client
import { ZinsesRechnerAPI } from '@zinses-rechner/api-client'

const api = new ZinsesRechnerAPI('https://api.zinses-rechner.de')

const result = await api.calculateCompoundInterest({
  principal: 10000,
  annual_rate: 4.0,
  years: 10,
  monthly_payment: 500
})
```

## 📋 变更日志

### v1.0.0 (2024-01-15)
- ✅ 初始API发布
- ✅ 复利计算核心功能
- ✅ 德国税务计算集成
- ✅ 性能优化和缓存
- ✅ 安全防护和监控

### 计划中的功能

- 📅 v1.1.0: 更多计算器类型（贷款、储蓄计划）
- 📅 v1.2.0: 历史数据存储和分析
- 📅 v1.3.0: 个性化建议和优化

---

*最后更新: 2024-01-15*
