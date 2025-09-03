# Zinses-Rechner 故障排除指南

## 🔧 常见问题诊断

### 🚨 紧急问题处理

#### 服务完全不可用

**症状**: 网站无法访问，API返回5xx错误

**快速诊断:**
```bash
# 1. 检查服务状态
curl -I https://zinses-rechner.de
curl -I https://api.zinses-rechner.de/health

# 2. 检查Cloudflare状态
curl https://www.cloudflarestatus.com/api/v2/status.json

# 3. 检查Workers日志
npx wrangler tail --env production

# 4. 检查最近部署
git log --oneline -10
```

**解决步骤:**
1. **立即回滚**: `npx wrangler rollback --env production`
2. **通知团队**: 发送紧急通知到Slack
3. **分析原因**: 查看部署日志和错误信息
4. **修复问题**: 根据分析结果修复
5. **重新部署**: 验证修复后重新部署

#### API响应时间过长

**症状**: API响应时间 > 2秒，用户体验差

**诊断步骤:**
```bash
# 1. 检查API性能
curl -w "@curl-format.txt" -o /dev/null -s \
  -X POST https://api.zinses-rechner.de/api/v1/calculate/compound-interest \
  -H "Content-Type: application/json" \
  -d '{"principal": 10000, "annual_rate": 4, "years": 10}'

# 2. 检查数据库性能
npx wrangler d1 execute zinses-rechner-prod --env production \
  --command="EXPLAIN QUERY PLAN SELECT * FROM calculation_history LIMIT 1"

# 3. 检查缓存状态
curl https://api.zinses-rechner.de/api/v1/monitoring/cache-stats

# 4. 分析慢查询
./scripts/analyze-slow-queries.sh --hours=1
```

**解决方案:**
- **优化数据库查询**: 添加索引，优化SQL
- **增强缓存策略**: 延长缓存时间，预热热点数据
- **代码优化**: 减少计算复杂度，异步处理
- **资源扩容**: 增加Workers并发限制

### 🖥️ 前端问题

#### 页面加载缓慢

**症状**: LCP > 2.5秒，用户体验差

**诊断工具:**
```bash
# 1. Lighthouse分析
npx lighthouse https://zinses-rechner.de \
  --output=json \
  --output-path=reports/lighthouse-$(date +%Y%m%d).json

# 2. 分析关键指标
jq '.categories.performance.score, .audits["largest-contentful-paint"].numericValue' \
  reports/lighthouse-$(date +%Y%m%d).json

# 3. 检查资源加载
curl -w "@curl-format.txt" -o /dev/null -s https://zinses-rechner.de

# 4. 分析Bundle大小
cd zinses-rechner-frontend
npm run build -- --analyze
```

**优化策略:**
```typescript
// 1. 代码分割优化
const Calculator = defineAsyncComponent(() => import('./views/Calculator.vue'))
const Charts = defineAsyncComponent(() => import('./components/Charts.vue'))

// 2. 资源预加载
const preloadCriticalResources = () => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = '/api/v1/calculate/compound-interest'
  link.as = 'fetch'
  document.head.appendChild(link)
}

// 3. 图片优化
const getOptimizedImage = (src: string, width: number) => {
  return `https://imagedelivery.net/account/${src}/w=${width},f=webp`
}

// 4. 字体优化
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

#### JavaScript错误

**症状**: 控制台出现JavaScript错误，功能异常

**错误收集:**
```typescript
// error-tracking.ts
window.addEventListener('error', (event) => {
  const errorInfo = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  }

  // 发送错误报告
  fetch('/api/v1/monitoring/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorInfo)
  }).catch(console.warn)
})

// Promise rejection处理
window.addEventListener('unhandledrejection', (event) => {
  const errorInfo = {
    type: 'unhandled_promise_rejection',
    reason: event.reason?.toString(),
    stack: event.reason?.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href
  }

  fetch('/api/v1/monitoring/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorInfo)
  }).catch(console.warn)
})
```

### ⚡ 后端问题

#### Workers执行超时

**症状**: Workers返回524错误，执行超时

**诊断方法:**
```bash
# 1. 检查Workers日志
npx wrangler tail --env production --format=pretty

# 2. 分析CPU时间使用
# 在Workers代码中添加性能监控
console.time('calculation')
const result = await calculateCompoundInterest(input)
console.timeEnd('calculation')

# 3. 检查内存使用
# 监控Workers内存使用情况
```

**优化策略:**
```typescript
// 1. 异步处理优化
export async function optimizedCalculation(input: CalculationRequest): Promise<CalculationResponse> {
  // 使用Web Streams进行大数据处理
  const stream = new ReadableStream({
    start(controller) {
      // 分批处理年度计算
      for (let year = 1; year <= input.years; year++) {
        const yearResult = calculateYear(input, year)
        controller.enqueue(yearResult)
        
        // 让出控制权，避免阻塞
        if (year % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }
      controller.close()
    }
  })

  return processCalculationStream(stream)
}

// 2. 内存优化
export function memoryEfficientCalculation(input: CalculationRequest): CalculationResponse {
  // 避免创建大数组，使用迭代器
  function* yearlyCalculations() {
    let currentAmount = input.principal
    
    for (let year = 1; year <= input.years; year++) {
      const yearResult = calculateSingleYear(currentAmount, input)
      currentAmount = yearResult.end_amount
      yield yearResult
    }
  }

  // 流式处理，减少内存占用
  const results = Array.from(yearlyCalculations())
  return formatResults(results)
}
```

#### 数据库连接问题

**症状**: 数据库查询失败，D1连接错误

**诊断步骤:**
```bash
# 1. 检查D1数据库状态
npx wrangler d1 info zinses-rechner-prod --env production

# 2. 测试数据库连接
npx wrangler d1 execute zinses-rechner-prod --env production \
  --command="SELECT 1 as test"

# 3. 检查数据库大小和性能
npx wrangler d1 execute zinses-rechner-prod --env production \
  --command="SELECT 
    COUNT(*) as total_records,
    MAX(created_at) as latest_record,
    MIN(created_at) as earliest_record
  FROM calculation_history"

# 4. 分析查询性能
npx wrangler d1 execute zinses-rechner-prod --env production \
  --command="EXPLAIN QUERY PLAN 
  SELECT * FROM calculation_history 
  WHERE created_at > datetime('now', '-1 day')"
```

**解决方案:**
```typescript
// 1. 连接重试机制
export class DatabaseService {
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries) throw error
        
        // 指数退避
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw new Error('Max retries exceeded')
  }

  async saveCalculation(data: CalculationRecord): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.db.prepare(`
        INSERT INTO calculation_history 
        (session_id, input_hash, principal, annual_rate, years, final_amount, total_interest)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.sessionId,
        data.inputHash,
        data.principal,
        data.annualRate,
        data.years,
        data.finalAmount,
        data.totalInterest
      ).run()
    })
  }
}

// 2. 查询优化
export class OptimizedQueries {
  // 使用索引优化查询
  static async getRecentCalculations(limit: number = 100): Promise<CalculationRecord[]> {
    return db.prepare(`
      SELECT * FROM calculation_history 
      WHERE created_at > datetime('now', '-7 days')
      ORDER BY created_at DESC 
      LIMIT ?
    `).bind(limit).all()
  }

  // 分页查询避免大结果集
  static async getCalculationsPaginated(
    offset: number = 0, 
    limit: number = 50
  ): Promise<{ data: CalculationRecord[]; total: number }> {
    const [data, countResult] = await Promise.all([
      db.prepare(`
        SELECT * FROM calculation_history 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all(),
      
      db.prepare(`
        SELECT COUNT(*) as total FROM calculation_history
      `).first()
    ])

    return {
      data: data.results,
      total: countResult.total
    }
  }
}
```

### 🔒 安全问题

#### 安全扫描发现漏洞

**症状**: OWASP ZAP或npm audit报告安全漏洞

**处理流程:**
```bash
# 1. 运行完整安全扫描
./security/scripts/run-security-scan.sh full

# 2. 分析扫描报告
cat security/reports/summary/security-scan-summary-*.md

# 3. 检查依赖漏洞
cd zinses-rechner-frontend
npm audit --audit-level=high

# 4. 更新依赖
npm audit fix
npm update

# 5. 验证修复
npm audit
./security/scripts/run-security-scan.sh baseline
```

**漏洞修复优先级:**
1. **Critical**: 立即修复，紧急部署
2. **High**: 24小时内修复
3. **Medium**: 1周内修复
4. **Low**: 下次维护窗口修复

#### 可疑安全活动

**症状**: 安全监控检测到异常活动

**调查步骤:**
```bash
# 1. 查看安全事件日志
npx wrangler tail --env production | grep "SECURITY"

# 2. 分析IP活动模式
./security/scripts/analyze-ip-activity.sh --suspicious-only

# 3. 检查WAF日志
# 在Cloudflare Dashboard查看Security Events

# 4. 生成安全报告
./security/scripts/generate-security-report.sh --hours=24
```

### 📊 监控问题

#### 监控数据缺失

**症状**: 仪表盘显示"--"或数据过时

**诊断步骤:**
```bash
# 1. 检查监控端点
curl https://api.zinses-rechner.de/metrics
curl https://api.zinses-rechner.de/test/system-metrics

# 2. 验证数据收集
./monitoring/scripts/verify-monitoring.sh --data-collection-only

# 3. 检查数据库连接
npx wrangler d1 execute zinses-rechner-prod --env production \
  --command="SELECT COUNT(*) FROM system_metrics WHERE timestamp > datetime('now', '-1 hour')"

# 4. 重启监控服务
./scripts/restart-monitoring.sh
```

#### 告警误报

**症状**: 收到大量误报告警

**调整策略:**
```typescript
// 1. 动态阈值调整
export class DynamicThresholds {
  static async adjustThreshold(metric: string, historicalData: number[]): Promise<number> {
    // 基于历史数据计算动态阈值
    const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length
    const stdDev = Math.sqrt(
      historicalData.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / historicalData.length
    )
    
    // 使用3σ规则设置阈值
    return mean + (3 * stdDev)
  }

  static async updateAlertRule(ruleName: string, newThreshold: number): Promise<void> {
    // 更新告警规则配置
    const updatedRule = {
      ...alertRules.find(r => r.name === ruleName),
      threshold: newThreshold,
      updated_at: new Date().toISOString()
    }
    
    // 保存更新的规则
    await saveAlertRule(updatedRule)
  }
}

// 2. 告警抑制
export class AlertSuppression {
  private suppressedAlerts: Map<string, Date> = new Map()

  shouldSuppressAlert(ruleName: string, suppressionMinutes: number = 60): boolean {
    const lastAlert = this.suppressedAlerts.get(ruleName)
    if (!lastAlert) return false

    const now = new Date()
    const timeDiff = now.getTime() - lastAlert.getTime()
    return timeDiff < (suppressionMinutes * 60 * 1000)
  }

  suppressAlert(ruleName: string): void {
    this.suppressedAlerts.set(ruleName, new Date())
  }
}
```

## 🛠️ 开发环境问题

### 本地开发环境设置

#### Docker容器启动失败

**症状**: `docker-compose up`失败

**解决步骤:**
```bash
# 1. 检查Docker状态
docker --version
docker-compose --version

# 2. 清理Docker环境
docker-compose down -v
docker system prune -f

# 3. 重新构建镜像
docker-compose build --no-cache

# 4. 检查端口占用
lsof -i :5173  # 前端端口
lsof -i :8000  # 后端端口
lsof -i :5432  # 数据库端口

# 5. 重新启动
docker-compose up -d
```

#### 前端开发服务器问题

**症状**: Vite开发服务器无法启动或热重载失败

**解决方案:**
```bash
# 1. 清理依赖和缓存
cd zinses-rechner-frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 2. 检查Node.js版本
node --version  # 应该是20+
npm --version

# 3. 检查Vite配置
cat vite.config.ts

# 4. 重启开发服务器
npm run dev -- --host 0.0.0.0 --port 5173
```

#### 后端API连接问题

**症状**: 前端无法连接到后端API

**诊断步骤:**
```bash
# 1. 检查后端服务状态
curl http://localhost:8000/health

# 2. 检查CORS配置
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:8000/api/v1/calculate/compound-interest

# 3. 检查环境变量
echo $VITE_API_BASE_URL

# 4. 验证网络连接
ping localhost
telnet localhost 8000
```

### 测试环境问题

#### E2E测试失败

**症状**: Playwright测试超时或失败

**调试方法:**
```bash
# 1. 运行调试模式
cd zinses-rechner-frontend
npx playwright test --debug

# 2. 生成测试报告
npx playwright test --reporter=html

# 3. 检查测试环境
npx playwright test --list

# 4. 更新浏览器
npx playwright install chromium
```

**常见测试问题修复:**
```typescript
// 1. 等待元素加载
await page.waitForSelector('[data-testid="calculation-result"]', { 
  state: 'visible',
  timeout: 10000 
})

// 2. 处理网络请求
await page.route('**/api/v1/calculate/**', route => {
  // 模拟慢网络
  setTimeout(() => route.continue(), 1000)
})

// 3. 稳定的元素选择
const calculateButton = page.locator('[data-testid="calculate-button"]')
await calculateButton.waitFor({ state: 'visible' })
await calculateButton.click()

// 4. 截图调试
await page.screenshot({ path: 'debug-screenshot.png', fullPage: true })
```

## 🔍 性能问题诊断

### 性能分析工具

#### 前端性能分析

**使用Chrome DevTools:**
```bash
# 1. 性能录制分析
# 打开Chrome DevTools > Performance
# 录制页面加载和交互过程
# 分析Main Thread活动和资源加载

# 2. 内存泄漏检测
# DevTools > Memory > Heap Snapshot
# 比较多个快照，查找内存增长

# 3. 网络性能分析
# DevTools > Network
# 分析资源加载时间和大小
```

**自动化性能测试:**
```typescript
// tests/performance/frontend-performance.spec.ts
test('页面性能应该达标', async ({ page }) => {
  await page.goto('/')
  
  // 测量页面加载性能
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
    }
  })

  // 验证性能目标
  expect(performanceMetrics.domContentLoaded).toBeLessThan(1500)
  expect(performanceMetrics.loadComplete).toBeLessThan(3000)
  expect(performanceMetrics.firstPaint).toBeLessThan(1000)
})
```

#### 后端性能分析

**API性能监控:**
```typescript
// workers/performance-monitor.ts
export class APIPerformanceMonitor {
  static async measureEndpointPerformance(
    endpoint: string,
    handler: (request: Request) => Promise<Response>
  ): Promise<PerformanceReport> {
    const startTime = Date.now()
    const startCPU = performance.now()
    
    try {
      const response = await handler(request)
      const endTime = Date.now()
      const endCPU = performance.now()
      
      return {
        endpoint,
        duration_ms: endTime - startTime,
        cpu_time_ms: endCPU - startCPU,
        status_code: response.status,
        response_size: response.headers.get('content-length') || '0',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        endpoint,
        duration_ms: Date.now() - startTime,
        cpu_time_ms: performance.now() - startCPU,
        status_code: 500,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}
```

### 性能优化建议

#### 前端优化

```typescript
// 1. 组件懒加载
const LazyChart = defineAsyncComponent({
  loader: () => import('./components/Chart.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})

// 2. 图片懒加载
<img 
  :src="imageSrc" 
  loading="lazy"
  :srcset="`${imageSrc}?w=400 400w, ${imageSrc}?w=800 800w`"
  sizes="(max-width: 768px) 400px, 800px"
/>

// 3. 虚拟滚动（大数据集）
import { RecycleScroller } from 'vue-virtual-scroller'

<RecycleScroller
  class="scroller"
  :items="yearlyBreakdown"
  :item-size="60"
  key-field="year"
  v-slot="{ item }"
>
  <YearlyBreakdownRow :data="item" />
</RecycleScroller>
```

#### 后端优化

```typescript
// 1. 计算结果缓存
export class CalculationCache {
  private static generateCacheKey(input: CalculationRequest): string {
    const normalized = {
      principal: Math.round(input.principal * 100) / 100,
      annual_rate: Math.round(input.annual_rate * 100) / 100,
      years: input.years,
      monthly_payment: Math.round((input.monthly_payment || 0) * 100) / 100,
      compound_frequency: input.compound_frequency || 'monthly'
    }
    
    return `calc:${btoa(JSON.stringify(normalized))}`
  }

  static async getCachedResult(input: CalculationRequest, env: Env): Promise<CalculationResponse | null> {
    const key = this.generateCacheKey(input)
    const cached = await env.CACHE.get(key)
    
    if (cached) {
      const result = JSON.parse(cached)
      result.calculation_metadata.cache_hit = true
      return result
    }
    
    return null
  }

  static async setCachedResult(
    input: CalculationRequest, 
    result: CalculationResponse, 
    env: Env
  ): Promise<void> {
    const key = this.generateCacheKey(input)
    result.calculation_metadata.cache_hit = false
    
    await env.CACHE.put(key, JSON.stringify(result), {
      expirationTtl: 300 // 5分钟缓存
    })
  }
}

// 2. 批量数据库操作
export class BatchDatabaseOperations {
  static async batchInsertMetrics(metrics: MetricRecord[]): Promise<void> {
    const batchSize = 100
    
    for (let i = 0; i < metrics.length; i += batchSize) {
      const batch = metrics.slice(i, i + batchSize)
      
      const stmt = db.prepare(`
        INSERT INTO system_metrics (metric_name, metric_value, timestamp)
        VALUES (?, ?, ?)
      `)
      
      const transaction = db.batch(
        batch.map(metric => stmt.bind(metric.name, metric.value, metric.timestamp))
      )
      
      await transaction
    }
  }
}
```

## 📋 故障排除检查清单

### 🚨 紧急故障检查清单

```markdown
## 紧急故障响应清单 (5分钟内完成)

### 立即检查
- [ ] 服务可访问性 (curl测试)
- [ ] Cloudflare状态页面
- [ ] 最近部署记录
- [ ] 活跃告警数量

### 快速诊断
- [ ] Workers日志检查
- [ ] 数据库连接测试
- [ ] 缓存服务状态
- [ ] DNS解析验证

### 紧急响应
- [ ] 评估影响范围
- [ ] 决定是否回滚
- [ ] 通知相关团队
- [ ] 开始详细调查

### 沟通更新
- [ ] 状态页面更新
- [ ] 用户通知发送
- [ ] 团队状态同步
- [ ] 管理层报告
```

### 🔧 日常维护检查清单

```markdown
## 每日维护检查清单

### 系统健康
- [ ] 所有服务健康检查通过
- [ ] 无活跃的Critical告警
- [ ] API响应时间正常
- [ ] 前端加载性能正常

### 安全状态
- [ ] 无新的安全告警
- [ ] WAF规则正常运行
- [ ] SSL证书有效期检查
- [ ] 依赖漏洞扫描结果

### 性能监控
- [ ] Core Web Vitals达标
- [ ] 缓存命中率正常
- [ ] 数据库性能正常
- [ ] 资源使用率合理

### 业务指标
- [ ] 计算成功率 > 99.9%
- [ ] 用户活跃度正常
- [ ] 错误率 < 0.1%
- [ ] 转化率趋势正常
```

## 📞 支持联系方式

### 技术支持团队

**联系方式:**
- **技术负责人**: tech@zinses-rechner.de
- **紧急热线**: +49-xxx-xxx-xxxx
- **Slack频道**: #zinses-rechner-support

**响应时间承诺:**
- **Critical问题**: 15分钟内响应
- **High问题**: 2小时内响应
- **Medium问题**: 8小时内响应
- **Low问题**: 24小时内响应

### 外部服务支持

**Cloudflare支持:**
- **状态页面**: https://www.cloudflarestatus.com
- **支持文档**: https://developers.cloudflare.com
- **社区论坛**: https://community.cloudflare.com

**GitHub支持:**
- **状态页面**: https://www.githubstatus.com
- **支持文档**: https://docs.github.com

## 🔮 预防性维护

### 定期维护任务

**每周任务:**
```bash
# 1. 依赖更新检查
./scripts/check-dependency-updates.sh

# 2. 安全扫描
./security/scripts/run-security-scan.sh full

# 3. 性能基准测试
./scripts/performance-benchmark.sh

# 4. 数据库维护
./scripts/database-maintenance.sh
```

**每月任务:**
```bash
# 1. 全面安全审计
./security/scripts/comprehensive-security-audit.sh

# 2. 性能优化审查
./scripts/performance-optimization-review.sh

# 3. 监控配置审查
./monitoring/scripts/review-monitoring-config.sh

# 4. 容量规划分析
./scripts/capacity-planning-analysis.sh
```

### 监控改进建议

**短期改进 (1-3个月):**
- [ ] 实施分布式追踪
- [ ] 增强错误聚合和分析
- [ ] 自动化性能回归检测
- [ ] 用户体验监控增强

**长期改进 (3-6个月):**
- [ ] AI驱动的异常检测
- [ ] 预测性告警
- [ ] 自动化故障恢复
- [ ] 全面的可观测性平台

---

*故障排除指南版本: 1.0.0 | 最后更新: 2024-01-15*
