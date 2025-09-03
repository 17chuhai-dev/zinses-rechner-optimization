# Zinses-Rechner 开发者指南

## 🚀 快速开始

### 环境要求

- **Node.js**: 20.x 或更高版本
- **npm**: 9.x 或更高版本
- **Git**: 2.x 或更高版本
- **Docker**: 20.x 或更高版本 (可选)
- **Python**: 3.11+ (后端开发)

### 项目设置

```bash
# 1. 克隆项目
git clone https://github.com/your-org/zinses-rechner.git
cd zinses-rechner

# 2. 安装前端依赖
cd zinses-rechner-frontend
npm install

# 3. 安装后端依赖
cd ../backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# 4. 安装Workers依赖
cd ../cloudflare-workers/api-worker
npm install

# 5. 复制环境配置
cp .env.example .env.local
# 编辑 .env.local 配置本地开发环境
```

### 开发环境启动

**方法 A: Docker Compose (推荐)**
```bash
# 启动完整开发环境
docker-compose -f docker-compose.dev.yml up

# 服务访问地址:
# 前端: http://localhost:5173
# 后端API: http://localhost:8000
# 数据库: localhost:5432
# Redis: localhost:6379
```

**方法 B: 手动启动**
```bash
# Terminal 1: 前端开发服务器
cd zinses-rechner-frontend
npm run dev

# Terminal 2: 后端开发服务器
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: 数据库 (如果需要)
docker run --name postgres-dev -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

## 🏗️ 项目结构详解

### 前端架构 (Vue.js)

```
zinses-rechner-frontend/
├── src/
│   ├── components/              # 可复用组件
│   │   ├── Calculator/          # 计算器相关组件
│   │   │   ├── CalculatorForm.vue
│   │   │   ├── ResultsDisplay.vue
│   │   │   ├── ChartVisualization.vue
│   │   │   └── ParameterSliders.vue
│   │   ├── UI/                  # 基础UI组件
│   │   │   ├── Button.vue
│   │   │   ├── Input.vue
│   │   │   ├── Card.vue
│   │   │   ├── Modal.vue
│   │   │   └── Tooltip.vue
│   │   └── Layout/              # 布局组件
│   │       ├── Header.vue
│   │       ├── Footer.vue
│   │       ├── Navigation.vue
│   │       └── Sidebar.vue
│   ├── views/                   # 页面组件
│   │   ├── Home.vue
│   │   ├── Calculator.vue
│   │   ├── About.vue
│   │   └── Privacy.vue
│   ├── composables/             # 组合式函数
│   │   ├── useCalculator.ts
│   │   ├── useCharts.ts
│   │   ├── useLocalStorage.ts
│   │   └── usePerformanceMonitoring.ts
│   ├── stores/                  # Pinia状态管理
│   │   ├── calculator.ts
│   │   ├── ui.ts
│   │   └── monitoring.ts
│   ├── services/                # API服务
│   │   ├── api.ts
│   │   ├── calculator-api.ts
│   │   └── monitoring-api.ts
│   ├── types/                   # TypeScript类型
│   │   ├── calculator.ts
│   │   ├── api.ts
│   │   └── monitoring.ts
│   ├── utils/                   # 工具函数
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── calculations.ts
│   └── assets/                  # 静态资源
│       ├── images/
│       ├── icons/
│       └── styles/
├── tests/                       # 测试文件
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── e2e/                     # 端到端测试
├── public/                      # 公共资源
└── docs/                        # 组件文档
```

### 后端架构 (FastAPI + Workers)

```
backend/
├── app/
│   ├── api/                     # API路由
│   │   ├── v1/
│   │   │   ├── calculator.py
│   │   │   ├── monitoring.py
│   │   │   └── health.py
│   │   └── test/                # 测试端点
│   │       └── monitoring.py
│   ├── core/                    # 核心配置
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── database.py
│   │   └── cache.py
│   ├── models/                  # 数据模型
│   │   ├── calculator.py
│   │   ├── monitoring.py
│   │   └── security.py
│   ├── services/                # 业务逻辑
│   │   ├── calculator_service.py
│   │   ├── monitoring_service.py
│   │   └── security_service.py
│   └── utils/                   # 工具函数
│       ├── formatters.py
│       ├── validators.py
│       └── calculations.py
├── tests/                       # 后端测试
├── migrations/                  # 数据库迁移
└── scripts/                     # 部署脚本

cloudflare-workers/
├── api-worker/                  # 主API Worker
│   ├── src/
│   │   ├── handlers/            # 请求处理器
│   │   ├── middleware/          # 中间件
│   │   ├── services/            # 业务服务
│   │   ├── utils/               # 工具函数
│   │   └── types/               # 类型定义
│   ├── tests/                   # Worker测试
│   └── wrangler.toml           # Worker配置
└── cache-worker/                # 缓存Worker
```

## 🛠️ 开发工作流

### 1. 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/neue-berechnung

# 2. 开发前端组件
cd zinses-rechner-frontend
# 创建新组件
# 编写单元测试
# 更新类型定义

# 3. 开发后端API
cd ../backend
# 创建API端点
# 编写业务逻辑
# 添加数据模型

# 4. 集成测试
npm run test:integration

# 5. E2E测试
npm run test:e2e

# 6. 提交代码
git add .
git commit -m "feat: 添加新的计算功能"
git push origin feature/neue-berechnung
```

### 2. 代码审查流程

**Pull Request 模板:**
```markdown
## 功能描述
简要描述此PR的功能和目的

## 变更类型
- [ ] 新功能 (feature)
- [ ] 错误修复 (bugfix)
- [ ] 性能优化 (performance)
- [ ] 重构 (refactor)
- [ ] 文档更新 (docs)
- [ ] 测试改进 (test)

## 测试清单
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] E2E测试通过
- [ ] 手动测试完成
- [ ] 性能测试通过

## 安全检查
- [ ] 输入验证完整
- [ ] 无安全漏洞
- [ ] 权限检查正确
- [ ] 数据净化实施

## 部署注意事项
- [ ] 需要数据库迁移
- [ ] 需要环境变量更新
- [ ] 需要缓存清理
- [ ] 需要配置更新

## 截图/演示
(如果适用，添加功能截图或演示)
```

### 3. 测试策略

**测试金字塔:**
```
        /\
       /  \
      / E2E \     <- 少量，关键用户流程
     /______\
    /        \
   /Integration\ <- 中等数量，API和组件集成
  /__________\
 /            \
/  Unit Tests  \   <- 大量，业务逻辑和工具函数
/______________\
```

**测试配置:**
```typescript
// vitest.config.ts (单元测试)
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})

// playwright.config.ts (E2E测试)
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
})
```

## 🎨 代码规范

### 1. TypeScript 规范

**类型定义:**
```typescript
// types/calculator.ts
export interface CalculationRequest {
  readonly principal: number
  readonly annual_rate: number
  readonly years: number
  readonly monthly_payment?: number
  readonly compound_frequency?: CompoundFrequency
}

export type CompoundFrequency = 'monthly' | 'quarterly' | 'annually'

export interface CalculationResponse {
  readonly final_amount: number
  readonly total_contributions: number
  readonly total_interest: number
  readonly yearly_breakdown: readonly YearlyBreakdown[]
  readonly calculation_metadata: CalculationMetadata
}

// 使用严格的类型检查
export function validateCalculationInput(input: unknown): CalculationRequest {
  if (!isCalculationRequest(input)) {
    throw new ValidationError('Invalid calculation input')
  }
  return input
}

function isCalculationRequest(input: unknown): input is CalculationRequest {
  return (
    typeof input === 'object' &&
    input !== null &&
    'principal' in input &&
    'annual_rate' in input &&
    'years' in input &&
    typeof (input as any).principal === 'number' &&
    typeof (input as any).annual_rate === 'number' &&
    typeof (input as any).years === 'number'
  )
}
```

### 2. Vue.js 组件规范

**组件结构:**
```vue
<!-- CalculatorForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="calculator-form">
    <!-- 使用语义化HTML和可访问性属性 -->
    <fieldset>
      <legend>Berechnungsparameter</legend>
      
      <div class="form-group">
        <label for="principal">Startkapital (€)</label>
        <input
          id="principal"
          v-model.number="form.principal"
          type="number"
          min="1"
          max="10000000"
          step="1"
          required
          aria-describedby="principal-help"
          data-testid="principal-input"
        />
        <small id="principal-help">Ihr anfängliches Investitionskapital</small>
      </div>
    </fieldset>
    
    <button 
      type="submit" 
      :disabled="isCalculating"
      data-testid="calculate-button"
    >
      {{ isCalculating ? 'Berechnung läuft...' : 'Berechnen' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'
import type { CalculationRequest } from '@/types/calculator'

// Props定义
interface Props {
  initialValues?: Partial<CalculationRequest>
}

const props = withDefaults(defineProps<Props>(), {
  initialValues: () => ({})
})

// Emits定义
interface Emits {
  (e: 'submit', value: CalculationRequest): void
  (e: 'reset'): void
}

const emit = defineEmits<Emits>()

// 组合式函数
const calculatorStore = useCalculatorStore()
const { form, isCalculating, calculate } = calculatorStore

// 响应式数据
const formErrors = ref<Record<string, string>>({})

// 计算属性
const isFormValid = computed(() => {
  return form.value.principal > 0 &&
         form.value.annual_rate >= 0 &&
         form.value.years > 0 &&
         Object.keys(formErrors.value).length === 0
})

// 方法
const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  try {
    await calculate()
    emit('submit', form.value)
  } catch (error) {
    console.error('计算失败:', error)
  }
}

// 生命周期
onMounted(() => {
  // 初始化表单值
  if (props.initialValues) {
    Object.assign(form.value, props.initialValues)
  }
})
</script>

<style scoped>
.calculator-form {
  @apply max-w-md mx-auto p-6 bg-white rounded-lg shadow-md;
}

.form-group {
  @apply mb-4;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.form-group input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>
```

### 3. API开发规范

**FastAPI路由结构:**
```python
# app/api/v1/calculator.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import logging

from app.core.security import get_current_user_optional
from app.services.calculator_service import CalculatorService
from app.models.calculator import CalculationRequest, CalculationResponse

router = APIRouter(prefix="/api/v1", tags=["calculator"])
logger = logging.getLogger(__name__)

class CalculationRequestModel(BaseModel):
    """计算请求模型"""
    principal: float = Field(..., ge=1, le=10_000_000, description="本金金额")
    annual_rate: float = Field(..., ge=0, le=20, description="年利率百分比")
    years: int = Field(..., ge=1, le=50, description="投资年限")
    monthly_payment: Optional[float] = Field(0, ge=0, le=50_000, description="月度投入")
    compound_frequency: Optional[str] = Field("monthly", description="复利频率")
    include_tax: Optional[bool] = Field(False, description="是否包含税务计算")
    kirchensteuer: Optional[bool] = Field(False, description="是否缴纳教会税")

    @validator('compound_frequency')
    def validate_compound_frequency(cls, v):
        allowed = ['monthly', 'quarterly', 'annually']
        if v not in allowed:
            raise ValueError(f'复利频率必须是: {", ".join(allowed)}')
        return v

    @validator('principal')
    def validate_principal(cls, v):
        if v <= 0:
            raise ValueError('本金必须大于0')
        return round(v, 2)

    @validator('annual_rate')
    def validate_annual_rate(cls, v):
        if v < 0:
            raise ValueError('年利率不能为负数')
        return round(v, 4)

@router.post("/calculate/compound-interest", response_model=CalculationResponse)
async def calculate_compound_interest(
    request: CalculationRequestModel,
    current_user: Optional[dict] = Depends(get_current_user_optional)
) -> CalculationResponse:
    """
    计算复利增长
    
    计算给定参数下的复利增长情况，包括年度明细和税务计算。
    """
    try:
        logger.info(f"开始复利计算: principal={request.principal}, rate={request.annual_rate}")
        
        # 调用业务服务
        calculator_service = CalculatorService()
        result = await calculator_service.calculate_compound_interest(request.dict())
        
        logger.info(f"计算完成: final_amount={result.final_amount}")
        return result
        
    except ValueError as e:
        logger.warning(f"输入验证失败: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    
    except Exception as e:
        logger.error(f"计算失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="计算过程中发生错误")

@router.get("/calculate/history")
async def get_calculation_history(
    limit: int = Field(50, ge=1, le=100),
    offset: int = Field(0, ge=0),
    current_user: Optional[dict] = Depends(get_current_user_optional)
) -> List[CalculationResponse]:
    """获取计算历史记录"""
    try:
        calculator_service = CalculatorService()
        return await calculator_service.get_calculation_history(limit, offset)
    except Exception as e:
        logger.error(f"获取历史记录失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取历史记录失败")
```

### 4. Cloudflare Workers 规范

**Worker结构:**
```typescript
// cloudflare-workers/api-worker/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { securityHeaders } from 'hono/security-headers'

import { calculatorRoutes } from './routes/calculator'
import { monitoringRoutes } from './routes/monitoring'
import { healthRoutes } from './routes/health'
import { errorHandler } from './middleware/error-handler'
import { rateLimiter } from './middleware/rate-limiter'
import { metricsCollector } from './middleware/metrics'

export interface Env {
  DB: D1Database
  CACHE: KVNamespace
  ENVIRONMENT: string
  CORS_ORIGIN: string
  SLACK_WEBHOOK_URL?: string
}

const app = new Hono<{ Bindings: Env }>()

// 全局中间件
app.use('*', logger())
app.use('*', securityHeaders())
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      c.env.CORS_ORIGIN,
      'http://localhost:5173', // 开发环境
      'https://staging.zinses-rechner.de'
    ]
    return allowedOrigins.includes(origin) ? origin : null
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}))

// 速率限制
app.use('/api/*', rateLimiter())

// 指标收集
app.use('*', metricsCollector())

// 路由注册
app.route('/', healthRoutes)
app.route('/', calculatorRoutes)
app.route('/', monitoringRoutes)

// 错误处理
app.onError(errorHandler)

// 404处理
app.notFound((c) => {
  return c.json({
    error: 'NOT_FOUND',
    message: 'Endpoint nicht gefunden',
    timestamp: new Date().toISOString()
  }, 404)
})

export default app
```

## 🧪 测试开发

### 1. 单元测试

**Vue组件测试:**
```typescript
// tests/unit/components/CalculatorForm.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import CalculatorForm from '@/components/Calculator/CalculatorForm.vue'

describe('CalculatorForm', () => {
  const createWrapper = (props = {}) => {
    const pinia = createPinia()
    return mount(CalculatorForm, {
      props,
      global: {
        plugins: [pinia]
      }
    })
  }

  it('应该正确渲染表单字段', () => {
    const wrapper = createWrapper()
    
    expect(wrapper.find('[data-testid="principal-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="rate-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="years-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="calculate-button"]').exists()).toBe(true)
  })

  it('应该验证输入值范围', async () => {
    const wrapper = createWrapper()
    
    // 测试无效的本金输入
    await wrapper.find('[data-testid="principal-input"]').setValue(-1000)
    await wrapper.find('[data-testid="calculate-button"]').trigger('click')
    
    expect(wrapper.find('.error-message').text()).toContain('本金必须大于0')
  })

  it('应该正确提交表单数据', async () => {
    const wrapper = createWrapper()
    
    // 填写表单
    await wrapper.find('[data-testid="principal-input"]').setValue(10000)
    await wrapper.find('[data-testid="rate-input"]').setValue(4)
    await wrapper.find('[data-testid="years-input"]').setValue(10)
    
    // 模拟API调用
    const mockCalculate = vi.fn().mockResolvedValue({
      final_amount: 14802.44,
      total_interest: 4802.44
    })
    
    wrapper.vm.calculate = mockCalculate
    
    // 提交表单
    await wrapper.find('form').trigger('submit')
    
    expect(mockCalculate).toHaveBeenCalledWith({
      principal: 10000,
      annual_rate: 4,
      years: 10,
      monthly_payment: 0,
      compound_frequency: 'monthly'
    })
  })
})
```

**API测试:**
```python
# tests/test_calculator_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestCalculatorAPI:
    def test_health_check(self):
        """测试健康检查端点"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_compound_interest_calculation(self):
        """测试复利计算功能"""
        payload = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 500,
            "compound_frequency": "monthly"
        }
        
        response = client.post("/api/v1/calculate/compound-interest", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # 验证响应结构
        assert "final_amount" in data
        assert "total_contributions" in data
        assert "total_interest" in data
        assert "yearly_breakdown" in data
        
        # 验证计算结果合理性
        assert data["final_amount"] > payload["principal"]
        assert data["total_contributions"] == payload["principal"] + (payload["monthly_payment"] * 12 * payload["years"])
        assert len(data["yearly_breakdown"]) == payload["years"]

    def test_input_validation(self):
        """测试输入验证"""
        invalid_payloads = [
            {"principal": -1000, "annual_rate": 4, "years": 10},  # 负本金
            {"principal": 10000, "annual_rate": -1, "years": 10},  # 负利率
            {"principal": 10000, "annual_rate": 4, "years": 0},    # 零年限
            {"principal": 10000, "annual_rate": 4, "years": 100},  # 超长年限
        ]
        
        for payload in invalid_payloads:
            response = client.post("/api/v1/calculate/compound-interest", json=payload)
            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_performance(self):
        """测试API性能"""
        import time
        
        payload = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 30,  # 较长计算时间
            "monthly_payment": 500
        }
        
        start_time = time.time()
        response = client.post("/api/v1/calculate/compound-interest", json=payload)
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # 1秒内完成
```

### 2. 集成测试

**API集成测试:**
```typescript
// tests/integration/api-integration.spec.ts
import { test, expect } from '@playwright/test'

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000'

test.describe('API集成测试', () => {
  test('完整计算流程应该正常工作', async ({ request }) => {
    // 1. 健康检查
    const healthResponse = await request.get(`${API_BASE_URL}/health`)
    expect(healthResponse.status()).toBe(200)

    // 2. 执行计算
    const calculationResponse = await request.post(`${API_BASE_URL}/api/v1/calculate/compound-interest`, {
      data: {
        principal: 15000,
        annual_rate: 5.5,
        years: 15,
        monthly_payment: 300,
        compound_frequency: 'monthly',
        include_tax: true
      }
    })

    expect(calculationResponse.status()).toBe(200)
    
    const result = await calculationResponse.json()
    
    // 3. 验证计算结果
    expect(result.final_amount).toBeGreaterThan(15000)
    expect(result.total_contributions).toBe(15000 + (300 * 12 * 15))
    expect(result.yearly_breakdown).toHaveLength(15)
    
    // 4. 验证税务计算
    if (result.tax_calculation) {
      expect(result.tax_calculation.abgeltungssteuer).toBeGreaterThan(0)
      expect(result.tax_calculation.final_amount_after_tax).toBeLessThan(result.final_amount)
    }

    // 5. 验证缓存功能
    const cachedResponse = await request.post(`${API_BASE_URL}/api/v1/calculate/compound-interest`, {
      data: {
        principal: 15000,
        annual_rate: 5.5,
        years: 15,
        monthly_payment: 300,
        compound_frequency: 'monthly',
        include_tax: true
      }
    })

    expect(cachedResponse.status()).toBe(200)
    const cachedResult = await cachedResponse.json()
    expect(cachedResult.calculation_metadata.cache_hit).toBe(true)
  })

  test('错误处理应该返回正确的错误信息', async ({ request }) => {
    const invalidRequest = await request.post(`${API_BASE_URL}/api/v1/calculate/compound-interest`, {
      data: {
        principal: -1000,  // 无效值
        annual_rate: 4,
        years: 10
      }
    })

    expect(invalidRequest.status()).toBe(422)
    
    const error = await invalidRequest.json()
    expect(error.message).toContain('本金')
    expect(error.details.field).toBe('principal')
  })
})
```

### 3. E2E测试

**用户流程测试:**
```typescript
// tests/e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test'

test.describe('用户完整使用流程', () => {
  test('新用户应该能够完成完整的计算流程', async ({ page }) => {
    // 1. 访问首页
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Zinseszins-Rechner')

    // 2. 填写计算参数
    await page.locator('[data-testid="principal-input"]').fill('25000')
    await page.locator('[data-testid="rate-input"]').fill('6')
    await page.locator('[data-testid="years-input"]').fill('20')
    await page.locator('[data-testid="monthly-payment-input"]').fill('400')

    // 3. 选择复利频率
    await page.locator('[data-testid="compound-frequency-select"]').selectOption('monthly')

    // 4. 启用税务计算
    await page.locator('[data-testid="include-tax-checkbox"]').check()

    // 5. 执行计算
    await page.locator('[data-testid="calculate-button"]').click()

    // 6. 验证结果显示
    await expect(page.locator('[data-testid="calculation-result"]')).toBeVisible()
    await expect(page.locator('[data-testid="final-amount"]')).not.toContainText('--')
    await expect(page.locator('[data-testid="total-interest"]')).not.toContainText('--')

    // 7. 验证图表渲染
    await expect(page.locator('#compound-interest-chart')).toBeVisible()
    await expect(page.locator('#yearly-breakdown-chart')).toBeVisible()

    // 8. 验证年度明细表格
    const yearlyTable = page.locator('[data-testid="yearly-breakdown-table"]')
    await expect(yearlyTable).toBeVisible()
    
    const tableRows = yearlyTable.locator('tbody tr')
    await expect(tableRows).toHaveCount(20) // 20年数据

    // 9. 测试参数调整
    await page.locator('[data-testid="rate-input"]').fill('7')
    await page.locator('[data-testid="calculate-button"]').click()
    
    // 验证结果更新
    await page.waitForFunction(() => {
      const finalAmount = document.querySelector('[data-testid="final-amount"]')?.textContent
      return finalAmount && !finalAmount.includes('--')
    })

    // 10. 验证分享功能
    await page.locator('[data-testid="share-button"]').click()
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible()

    // 11. 验证打印功能
    await page.locator('[data-testid="print-button"]').click()
    // 验证打印预览
  })

  test('移动端用户体验应该良好', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // 验证移动端布局
    await expect(page.locator('.mobile-layout')).toBeVisible()
    
    // 验证触摸友好的交互
    const principalSlider = page.locator('[data-testid="principal-slider"]')
    await expect(principalSlider).toBeVisible()
    
    // 测试滑块交互
    await principalSlider.dragTo(page.locator('[data-testid="slider-handle"]'), {
      targetPosition: { x: 200, y: 0 }
    })
    
    // 验证值更新
    const principalInput = page.locator('[data-testid="principal-input"]')
    const value = await principalInput.inputValue()
    expect(parseInt(value)).toBeGreaterThan(10000)
  })
})
```

## 🔧 调试技巧

### 1. 前端调试

**Vue DevTools:**
```typescript
// 开发环境启用Vue DevTools
if (process.env.NODE_ENV === 'development') {
  import('@vue/devtools')
}

// 组件调试
export default defineComponent({
  name: 'CalculatorForm',
  setup() {
    // 调试响应式数据
    watchEffect(() => {
      console.log('Form state changed:', toRaw(form.value))
    })
    
    // 性能调试
    const { start, end } = usePerformanceTimer()
    
    const calculate = async () => {
      start('calculation')
      try {
        const result = await calculatorAPI.calculate(form.value)
        return result
      } finally {
        end('calculation')
      }
    }
    
    return { calculate }
  }
})
```

**网络调试:**
```typescript
// 拦截和调试API请求
if (process.env.NODE_ENV === 'development') {
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    console.log('API Request:', args[0], args[1])
    const response = await originalFetch(...args)
    console.log('API Response:', response.status, await response.clone().text())
    return response
  }
}
```

### 2. 后端调试

**Workers调试:**
```bash
# 本地开发模式
npx wrangler dev --local --port 8787

# 远程调试
npx wrangler tail --env production --format=pretty

# 性能分析
npx wrangler dev --local --inspect
```

**数据库调试:**
```bash
# 查询调试
npx wrangler d1 execute zinses-rechner-prod --env production \
  --command="EXPLAIN QUERY PLAN SELECT * FROM calculation_history WHERE created_at > datetime('now', '-1 day')"

# 数据验证
npx wrangler d1 execute zinses-rechner-prod --env production \
  --command="SELECT COUNT(*) as total, MAX(created_at) as latest FROM calculation_history"
```

## 📚 开发资源

### 有用的命令

```bash
# 代码质量检查
npm run lint                    # ESLint检查
npm run format                  # Prettier格式化
npm run type-check             # TypeScript类型检查

# 测试命令
npm run test                   # 单元测试
npm run test:watch            # 监听模式测试
npm run test:coverage         # 覆盖率测试
npm run test:e2e              # E2E测试
npm run test:e2e:headed       # 有界面E2E测试

# 构建命令
npm run build                  # 生产构建
npm run build:analyze         # 构建分析
npm run preview               # 预览构建结果

# 开发工具
npm run dev                    # 开发服务器
npm run storybook             # 组件文档
npm run docs:dev              # 文档开发服务器
```

### 开发工具配置

**VSCode配置:**
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.vue": "vue"
  },
  "emmet.includeLanguages": {
    "vue": "html"
  }
}
```

**推荐扩展:**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-playwright.playwright"
  ]
}
```

## 🤝 贡献指南

### Git工作流

```bash
# 1. 同步主分支
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feature/beschreibung-der-funktion

# 3. 开发和提交
git add .
git commit -m "feat: 添加新功能描述"

# 4. 推送分支
git push origin feature/beschreibung-der-funktion

# 5. 创建Pull Request
# 在GitHub上创建PR，填写模板

# 6. 代码审查后合并
git checkout main
git pull origin main
git branch -d feature/beschreibung-der-funktion
```

### 提交消息规范

```bash
# 格式: <type>(<scope>): <description>

# 类型:
feat:     # 新功能
fix:      # 错误修复
docs:     # 文档更新
style:    # 代码格式化
refactor: # 重构
test:     # 测试相关
chore:    # 构建工具、依赖更新

# 示例:
git commit -m "feat(calculator): 添加税务计算功能"
git commit -m "fix(api): 修复响应时间过长问题"
git commit -m "docs(readme): 更新安装说明"
```

---

*开发者指南版本: 1.0.0 | 最后更新: 2024-01-15*
