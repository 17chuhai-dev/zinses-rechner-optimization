[ ] NAME:Current Task List DESCRIPTION:Root task for conversation f57cd8c6-1f99-4b45-9e14-32a67b018fa3
-[ ] NAME:阶段1：项目基础设施搭建 DESCRIPTION:建立前后端项目架构，配置开发环境和基础工具链
--[x] NAME:Vue3 + Vite + TypeScript项目初始化 DESCRIPTION:创建前端项目结构，配置Vite构建工具和TypeScript支持

技术要点：
- 使用 `npm create vue@latest zinses-rechner-frontend`
- 启用TypeScript、Router、Pinia状态管理
- 配置vite.config.ts优化构建
- 设置基础目录结构：components、views、composables、types
--[x] NAME:Tailwind CSS + Headless UI配置 DESCRIPTION:配置UI框架和组件库，建立设计系统基础

实现步骤：
- 安装tailwindcss、@headlessui/vue
- 配置tailwind.config.js德国品牌色彩
- 创建基础组件：Button、Input、Card
- 设置响应式断点和德语字体
--[/] NAME:FastAPI项目结构搭建 DESCRIPTION:创建后端API项目，建立标准的FastAPI应用架构

项目结构：
```
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   └── services/
├── tests/
└── requirements.txt
```

配置CORS、Pydantic模型、基础中间件
--[ ] NAME:基础路由和组件架构 DESCRIPTION:建立前端路由系统和组件层次结构

路由配置：
- / (主页 + 计算器)
- /rechner/:type (其他计算器)
- /ratgeber/:slug (教育内容)

组件架构：
- Layout组件（Header、Footer、Navigation）
- Calculator组件（Form、Results、Chart）
- Content组件（Article、FAQ、Formula）
--[ ] NAME:开发环境Docker配置 DESCRIPTION:配置容器化开发环境，确保环境一致性

配置文件：
- docker-compose.yml（前端、后端、数据库）
- Dockerfile.frontend（Node.js + Vite）
- Dockerfile.backend（Python + FastAPI）
- 环境变量配置和热重载设置
-[ ] NAME:阶段2：核心计算功能开发 DESCRIPTION:实现复利计算算法和API接口，确保计算准确性和性能
--[ ] NAME:复利计算核心算法实现 DESCRIPTION:实现高精度复利计算算法，支持多种复利频率

核心公式：
```python
# 复利公式：A = P(1 + r/n)^(nt) + PMT * [((1 + r/n)^(nt) - 1) / (r/n)]
# P: 本金, r: 年利率, n: 复利频率, t: 年数, PMT: 月供

def calculate_compound_interest(
    principal: float,
    annual_rate: float,
    years: int,
    monthly_payment: float = 0,
    compound_frequency: int = 12
) -> dict
```

使用Decimal类型避免浮点数精度问题
--[ ] NAME:输入数据验证和错误处理 DESCRIPTION:实现全面的输入数据校验和错误处理机制

验证规则：
- 本金：1€ - 10,000,000€
- 月供：0€ - 50,000€
- 利率：0% - 20%
- 年限：1 - 50年

错误处理：
- 参数超出范围提示
- 不合理组合警告
- 德语错误信息显示
--[ ] NAME:FastAPI接口设计和实现 DESCRIPTION:设计和实现RESTful API接口，支持复利计算功能

API设计：
```python
# POST /api/v1/calculate/compound-interest
{
  "principal": 10000,
  "annual_rate": 4.0,
  "years": 10,
  "monthly_payment": 500,
  "compound_frequency": "monthly"
}

# Response
{
  "final_amount": 75624.32,
  "total_contributions": 70000,
  "total_interest": 5624.32,
  "yearly_breakdown": [...],
  "calculation_time": "2024-01-15T10:30:00Z"
}
```

包含请求限流和缓存机制
--[ ] NAME:单元测试编写 DESCRIPTION:编写全面的单元测试，确保计算准确性和边界情况处理

测试用例：
- 基础复利计算准确性
- 月供复利计算
- 边界值测试（最大值、最小值）
- 错误输入处理
- 性能测试（大数据量计算）

使用pytest和参数化测试
--[ ] NAME:API文档生成 DESCRIPTION:使用FastAPI自动生成API文档，配置Swagger UI

文档内容：
- 接口参数说明
- 请求/响应示例
- 错误码说明
- 使用指南

配置德语界面和本地化示例
-[x] NAME:阶段3：用户界面开发 DESCRIPTION:开发计算器表单和结果展示界面，实现响应式设计
--[ ] NAME:计算器输入表单组件开发 DESCRIPTION:开发用户友好的计算器输入表单，支持实时验证和德语本地化

组件功能：
- 本金输入（€格式化显示）
- 月供输入（可选，默认0）
- 年利率输入（百分比显示）
- 投资期限滑块（1-50年）
- 复利频率选择（月度/季度/年度）

技术实现：
```vue
<template>
  <form @submit.prevent="calculate" class="space-y-6">
    <CurrencyInput v-model="form.principal" label="Startkapital" />
    <CurrencyInput v-model="form.monthlyPayment" label="Monatliche Sparrate" />
    <PercentageInput v-model="form.annualRate" label="Zinssatz" />
    <RangeSlider v-model="form.years" :min="1" :max="50" label="Laufzeit" />
  </form>
</template>
```
--[ ] NAME:结果展示组件设计 DESCRIPTION:设计清晰直观的计算结果展示界面，突出关键数据

展示内容：
- 最终资产总额（大字体突出显示）
- 总投入金额 vs 利息收益对比
- 投资回报率和年化收益率
- 关键里程碑提醒

设计要求：
- 使用德国金融行业标准色彩
- 支持暗色/亮色主题切换
- 移动端友好的卡片布局
- 数字动画效果增强用户体验

```vue
<div class="results-grid">
  <ResultCard title="Endkapital" :value="results.finalAmount" highlight />
  <ResultCard title="Eingezahlt" :value="results.totalContributions" />
  <ResultCard title="Zinserträge" :value="results.totalInterest" />
</div>
```
--[ ] NAME:响应式布局实现 DESCRIPTION:实现全设备兼容的响应式布局，优化移动端体验

断点设计：
- Mobile: < 768px（单列布局）
- Tablet: 768px - 1024px（两列布局）
- Desktop: > 1024px（三列布局）

移动端优化：
- 触摸友好的输入控件
- 滑动手势支持
- 虚拟键盘适配
- 横屏模式支持

Tailwind配置：
```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    }
  }
}
```
--[ ] NAME:表单验证和用户反馈 DESCRIPTION:实现实时表单验证和友好的用户反馈机制

验证功能：
- 实时输入验证（防抖处理）
- 字段间逻辑验证
- 德语错误提示信息
- 成功状态视觉反馈

用户反馈：
- Loading状态指示器
- 计算进度显示
- 错误状态恢复建议
- 工具提示和帮助文本

```vue
<script setup>
const { validate, errors } = useFormValidation({
  principal: [required, minValue(1), maxValue(10000000)],
  annualRate: [required, minValue(0), maxValue(20)],
  years: [required, minValue(1), maxValue(50)]
})
</script>
```
--[ ] NAME:基础交互逻辑和状态管理 DESCRIPTION:实现计算器的核心交互逻辑和全局状态管理

状态管理（Pinia）：
```typescript
// stores/calculator.ts
export const useCalculatorStore = defineStore('calculator', () => {
  const form = ref<CalculatorForm>({
    principal: 10000,
    monthlyPayment: 500,
    annualRate: 4.0,
    years: 10,
    compoundFrequency: 'monthly'
  })
  
  const results = ref<CalculationResults | null>(null)
  const isCalculating = ref(false)
  
  const calculate = async () => {
    isCalculating.value = true
    try {
      results.value = await calculatorAPI.calculate(form.value)
    } finally {
      isCalculating.value = false
    }
  }
  
  return { form, results, isCalculating, calculate }
})
```

交互功能：
- 实时计算预览
- 参数重置功能
- 计算历史记录
- URL状态同步
-[x] NAME:阶段4：数据可视化实现 DESCRIPTION:集成图表库，开发可视化组件和导出功能
--[ ] NAME:Chart.js库集成和配置 DESCRIPTION:集成Chart.js图表库，配置适合金融数据展示的图表样式

安装和配置：
```bash
npm install chart.js vue-chartjs
```

基础配置：
```typescript
// composables/useChart.ts
import { Chart, registerables } from 'chart.js'
import { Line } from 'vue-chartjs'

Chart.register(...registerables)

export const useFinancialChart = () => {
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          font: { family: 'Inter, sans-serif' },
          color: '#374151'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
          }).format(value)
        }
      }
    }
  }
}
```

德语本地化和欧元格式化
--[ ] NAME:复利增长图表组件 DESCRIPTION:开发互动式复利增长图表，直观展示资产增长轨迹

图表类型：
- 线性图：资产增长趋势
- 堆叠面积图：本金 vs 利息对比
- 柱状图：年度收益对比

交互功能：
- 悬停显示详细数据
- 点击查看年度明细
- 缩放和平移支持
- 图表数据导出

```vue
<template>
  <div class="chart-container">
    <Line 
      :data="chartData" 
      :options="chartOptions" 
      @click="handleChartClick"
    />
    <div class="chart-controls">
      <button @click="toggleChartType">Ansicht wechseln</button>
      <button @click="exportChart">Diagramm exportieren</button>
    </div>
  </div>
</template>
```

数据结构：
```typescript
interface ChartDataPoint {
  year: number
  totalAmount: number
  contributions: number
  interest: number
  yearlyGain: number
}
```
--[ ] NAME:年度明细表格组件 DESCRIPTION:开发详细的年度财务明细表格，支持排序和筛选

表格列：
- Jahr（年份）
- Startkapital（年初资产）
- Einzahlungen（年度投入）
- Zinserträge（年度利息）
- Endkapital（年末资产）
- Wachstum（增长率）

功能特性：
- 响应式表格设计
- 数据排序和筛选
- 行高亮和悬停效果
- 数据导出CSV/Excel
- 关键数据突出显示

```vue
<template>
  <div class="table-container">
    <table class="financial-table">
      <thead>
        <tr>
          <th @click="sort('year')">Jahr</th>
          <th @click="sort('startAmount')">Startkapital</th>
          <th @click="sort('contributions')">Einzahlungen</th>
          <th @click="sort('interest')">Zinserträge</th>
          <th @click="sort('endAmount')">Endkapital</th>
          <th @click="sort('growth')">Wachstum</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedData" :key="row.year">
          <td>{{ row.year }}</td>
          <td>{{ formatCurrency(row.startAmount) }}</td>
          <td>{{ formatCurrency(row.contributions) }}</td>
          <td class="text-green-600">{{ formatCurrency(row.interest) }}</td>
          <td class="font-bold">{{ formatCurrency(row.endAmount) }}</td>
          <td>{{ formatPercentage(row.growth) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```
--[ ] NAME:移动端图表适配 DESCRIPTION:优化图表在移动设备上的显示效果和交互体验

移动端优化：
- 触摸手势支持（缩放、平移）
- 自适应图表尺寸
- 简化的数据标签
- 触摸友好的工具提示

响应式设计：
```typescript
// 移动端图表配置
const mobileChartOptions = {
  ...baseChartOptions,
  plugins: {
    ...baseChartOptions.plugins,
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 10,
        font: { size: 10 }
      }
    }
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 6,
        font: { size: 10 }
      }
    },
    y: {
      ticks: {
        maxTicksLimit: 5,
        font: { size: 10 }
      }
    }
  }
}
```

交互优化：
- 长按显示详情
- 双击重置缩放
- 滑动切换图表类型
--[ ] NAME:导出功能实现 DESCRIPTION:实现多格式数据导出功能，支持CSV、Excel和PDF报告

导出格式：
- CSV：基础数据表格
- Excel：带格式的详细报告
- PDF：完整的计算报告含图表
- PNG：图表图片导出

技术实现：
```typescript
// 导出功能
export const useDataExport = () => {
  const exportToCSV = (data: CalculationResult[]) => {
    const csv = Papa.unparse(data, {
      header: true,
      delimiter: ';' // 德国标准
    })
    downloadFile(csv, 'zinseszins-berechnung.csv', 'text/csv')
  }
  
  const exportToPDF = async (data: CalculationResult[], chartImage: string) => {
    const pdf = new jsPDF()
    // 添加德语标题和内容
    pdf.text('Zinseszins-Berechnung', 20, 20)
    pdf.addImage(chartImage, 'PNG', 20, 40, 170, 100)
    // 添加数据表格
    pdf.save('zinseszins-bericht.pdf')
  }
}
```

用户体验：
- 一键导出按钮
- 导出进度指示
- 文件命名自定义
- 批量导出支持
-[x] NAME:阶段5：内容和SEO优化 DESCRIPTION:集成德语内容，实现SEO优化和德国本地化功能
--[ ] NAME:德语文案和本地化 DESCRIPTION:集成全面的德语内容，实现本地化的用户体验

核心文案：
- 主标题："Der transparente Zinseszins-Rechner für deutsche Sparer"
- 副标题："Berechnen Sie sofort und kostenlos, wie Ihr Kapital mit Zinseszins wächst"
- CTA按钮："Jetzt berechnen", "Ergebnis exportieren", "Mehr erfahren"

本地化元素：
- 欧元货币格式化
- 德国日期格式
- 德语数字分隔符（点号千位分隔）
- 德国金融术语和习惯

```typescript
// i18n/de.ts
export default {
  calculator: {
    title: 'Zinseszins-Rechner',
    principal: 'Startkapital (€)',
    monthlyPayment: 'Monatliche Sparrate (€)',
    interestRate: 'Zinssatz (%)',
    duration: 'Laufzeit (Jahre)',
    calculate: 'Jetzt berechnen',
    results: {
      finalAmount: 'Endkapital nach {years} Jahren',
      totalContributions: 'Gesamte Einzahlungen',
      totalInterest: 'Zinserträge',
      annualReturn: 'Durchschnittliche jährliche Rendite'
    }
  }
}
```
--[ ] NAME:SEO元数据和结构化数据 DESCRIPTION:实现全面的SEO优化，包括元数据、结构化数据和德语关键词优化

元数据配置：
```html
<!-- 主页 -->
<title>Zinseszins-Rechner | Kostenloser Online-Rechner 2025</title>
<meta name="description" content="✓ Kostenlos ✓ Sofortige Ergebnisse ✓ Deutsche Steueraspekte. Berechnen Sie Zinseszins mit unserem transparenten Online-Rechner. Jetzt ausprobieren!">
<meta name="keywords" content="zinseszins rechner, zinsen berechnen, sparplan rechner, geld anlegen rechner">

<!-- Open Graph -->
<meta property="og:title" content="Zinseszins-Rechner - Kostenlos & Transparent">
<meta property="og:description" content="Der schnellste Zinseszins-Rechner für deutsche Sparer. Sofortige Ergebnisse mit vollständiger Formel-Erklärung.">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
```

结构化数据：
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Zinseszins-Rechner",
  "description": "Kostenloser Online-Rechner für Zinseszins-Berechnungen",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  }
}
```
--[ ] NAME:公式透明化展示模块 DESCRIPTION:开发公式透明化展示模块，建立用户信任和教育价值

公式展示内容：
- 复利数学公式可视化
- 参数说明和定义
- 步骤化计算过程
- 实际示例和应用场景

技术实现：
```vue
<template>
  <div class="formula-section">
    <h3>So berechnen wir Ihren Zinseszins</h3>
    
    <!-- 公式显示 -->
    <div class="formula-display">
      <math xmlns="http://www.w3.org/1998/Math/MathML">
        <mi>A</mi>
        <mo>=</mo>
        <mi>P</mi>
        <mo>(</mo>
        <mn>1</mn>
        <mo>+</mo>
        <mfrac>
          <mi>r</mi>
          <mi>n</mi>
        </mfrac>
        <mo>)</mo>
        <msup>
          <mi>nt</mi>
        </msup>
      </math>
    </div>
    
    <!-- 参数说明 -->
    <div class="parameter-explanation">
      <div class="parameter">
        <span class="symbol">A</span>
        <span class="description">Endkapital nach t Jahren</span>
      </div>
      <div class="parameter">
        <span class="symbol">P</span>
        <span class="description">Startkapital (Principal)</span>
      </div>
      <!-- ... 更多参数 -->
    </div>
    
    <!-- 计算示例 -->
    <div class="calculation-example">
      <h4>Beispielrechnung:</h4>
      <p>Bei 10.000€ Startkapital, 4% Zinssatz und 10 Jahren:</p>
      <div class="step-by-step">
        <div class="step">A = 10.000 × (1 + 0,04)¹⁰</div>
        <div class="step">A = 10.000 × 1,48024</div>
        <div class="step">A = 14.802,44€</div>
      </div>
    </div>
  </div>
</template>
```
--[ ] NAME:错误处理和用户指导 DESCRIPTION:实现全面的错误处理和用户指导系统，提供友好的用户体验

错误处理类型：
- 输入验证错误
- API请求失败
- 网络连接问题
- 浏览器兼容性问题

用户指导功能：
```vue
<template>
  <div class="error-boundary">
    <!-- 错误状态显示 -->
    <div v-if="error" class="error-message">
      <Icon name="exclamation-triangle" class="text-red-500" />
      <div>
        <h4>{{ error.title }}</h4>
        <p>{{ error.message }}</p>
        <div class="error-actions">
          <button @click="retry">Erneut versuchen</button>
          <button @click="reset">Zurücksetzen</button>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <Spinner />
      <p>Berechnung läuft...</p>
    </div>
    
    <!-- 帮助提示 -->
    <div class="help-tooltips">
      <Tooltip content="Geben Sie Ihr Startkapital in Euro ein">
        <Icon name="question-circle" />
      </Tooltip>
    </div>
  </div>
</template>
```

错误消息本地化：
```typescript
const errorMessages = {
  INVALID_PRINCIPAL: 'Das Startkapital muss zwischen 1€ und 10.000.000€ liegen.',
  INVALID_RATE: 'Der Zinssatz muss zwischen 0% und 20% liegen.',
  NETWORK_ERROR: 'Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.',
  CALCULATION_ERROR: 'Fehler bei der Berechnung. Bitte versuchen Sie es erneut.'
}
```
--[ ] NAME:德国税务计算集成 DESCRIPTION:集成德国税务计算功能，包括Abgeltungssteuer和团结税

税务计算要点：
- Abgeltungssteuer: 25%
- Solidaritätszuschlag: 5.5% (auf Abgeltungssteuer)
- Kirchensteuer: 8-9% (optional)
- Sparerpauschbetrag: 1.000€ (2023年起)

计算逻辑：
```typescript
interface TaxCalculation {
  grossInterest: number // 毛利息
  taxFreeAmount: number // 免税额度
  taxableInterest: number // 应税利息
  abgeltungssteuer: number // 资本利得税
  solidaritaetszuschlag: number // 团结税
  kirchensteuer?: number // 教会税
  netInterest: number // 税后利息
}

function calculateGermanTax(
  grossInterest: number,
  hasKirchensteuer: boolean = false,
  kirchensteuerRate: number = 0.08
): TaxCalculation {
  const taxFreeAmount = 1000 // Sparerpauschbetrag 2023
  const taxableInterest = Math.max(0, grossInterest - taxFreeAmount)
  
  const abgeltungssteuer = taxableInterest * 0.25
  const solidaritaetszuschlag = abgeltungssteuer * 0.055
  const kirchensteuer = hasKirchensteuer ? abgeltungssteuer * kirchensteuerRate : 0
  
  const totalTax = abgeltungssteuer + solidaritaetszuschlag + kirchensteuer
  const netInterest = grossInterest - totalTax
  
  return {
    grossInterest,
    taxFreeAmount,
    taxableInterest,
    abgeltungssteuer,
    solidaritaetszuschlag,
    kirchensteuer,
    netInterest
  }
}
```

用户界面：
- 税务计算开关
- 教会税选项
- 税前/税后对比显示
- 税务说明和免责声明
-[ ] NAME:阶段6：性能优化和部署 DESCRIPTION:配置生产环境，实现性能优化和监控系统
--[ ] NAME:Cloudflare Pages配置和部署 DESCRIPTION:配置Cloudflare Pages为主的生产环境部署方案

部署架构：
- 前端：Cloudflare Pages（静态站点托管）
- 后端：Cloudflare Workers（Serverless API）
- 数据库：Cloudflare D1（SQLite）
- CDN：Cloudflare全球边缘网络

配置文件：
```yaml
# wrangler.toml
name = "zinses-rechner-api"
compatibility_date = "2024-01-15"

[env.production]
route = "api.zinses-rechner.de/*"

[[env.production.d1_databases]]
binding = "DB"
database_name = "zinses-rechner-prod"
database_id = "your-database-id"

[env.production.vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://zinses-rechner.de"
```

部署流程：
1. GitHub Actions CI/CD配置
2. 自动构建和测试
3. 灰度发布和金丝雀测试
4. 生产环境发布
--[ ] NAME:CDN和缓存策略实现 DESCRIPTION:实现高效的CDN和缓存策略，优化全球访问性能

缓存策略：
- 静态资源：1年缓存（JS/CSS/图片）
- API响应：5分钟缓存（计算结果）
- HTML页面：1小时缓存
- 动态内容：无缓存

Cloudflare Workers缓存配置：
```typescript
// workers/cache.ts
export async function handleCachedRequest(
  request: Request,
  cacheKey: string,
  ttl: number = 300
): Promise<Response> {
  const cache = caches.default
  const cacheKeyRequest = new Request(cacheKey)
  
  // 尝试从缓存获取
  let response = await cache.match(cacheKeyRequest)
  
  if (!response) {
    // 缓存未命中，执行计算
    response = await calculateCompoundInterest(request)
    
    // 设置缓存头
    response.headers.set('Cache-Control', `public, max-age=${ttl}`)
    response.headers.set('CDN-Cache-Control', `public, max-age=${ttl}`)
    
    // 存入缓存
    await cache.put(cacheKeyRequest, response.clone())
  }
  
  return response
}
```

性能目标：
- 德国节点TTFB < 800ms
- 全球平均TTFB < 1.2s
- 缓存命中率 > 85%
--[ ] NAME:性能监控和Core Web Vitals优化 DESCRIPTION:实现全面的性能监控和核心网络指标优化

Core Web Vitals目标：
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTFB (Time to First Byte): < 800ms

性能优化措施：
```typescript
// 代码分割和懒加载
const ChartComponent = defineAsyncComponent({
  loader: () => import('./components/Chart.vue'),
  loadingComponent: ChartSkeleton,
  delay: 200
})

// 图片优化
const useImageOptimization = () => {
  const getOptimizedImageUrl = (src: string, width: number) => {
    return `https://imagedelivery.net/your-account/${src}/w=${width},f=webp`
  }
}

// 资源预加载
const preloadCriticalResources = () => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = '/api/v1/calculate/compound-interest'
  link.as = 'fetch'
  document.head.appendChild(link)
}
```

监控工具集成：
- Google Analytics 4
- Cloudflare Analytics
- Web Vitals实时监控
- 自定义性能指标仪表盘

```typescript
// 性能监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true
  })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```
--[ ] NAME:生产环境安全配置 DESCRIPTION:配置生产环境的安全措施和DSGVO合规要求

安全配置：
```typescript
// 安全头配置
const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://api.zinses-rechner.de;
  `.replace(/\s+/g, ' ').trim(),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// 请求限流
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
}
```

DSGVO合规：
- Cookie同意管理
- 数据处理声明
- 用户数据删除权利
- 数据加密和匿名化

```vue
<template>
  <div class="cookie-consent" v-if="!cookieConsent">
    <div class="consent-content">
      <h3>Cookie-Einstellungen</h3>
      <p>Wir verwenden Cookies, um Ihre Erfahrung zu verbessern und anonyme Nutzungsstatistiken zu erstellen.</p>
      <div class="consent-buttons">
        <button @click="acceptAll">Alle akzeptieren</button>
        <button @click="acceptNecessary">Nur notwendige</button>
        <button @click="showSettings">Einstellungen</button>
      </div>
    </div>
  </div>
</template>
```
--[ ] NAME:监控告警系统设置 DESCRIPTION:建立全面的监控告警系统，确保服务稳定性和可用性

监控指标：
- 服务可用性 > 99.9%
- API响应时间 < 500ms
- 错误率 < 0.1%
- 缓存命中率 > 85%

告警规则：
```yaml
# cloudflare-alerts.yml
alerts:
  - name: "API Response Time"
    condition: "avg(response_time) > 1000ms over 5min"
    severity: "warning"
    channels: ["email", "slack"]
    
  - name: "Error Rate High"
    condition: "error_rate > 1% over 5min"
    severity: "critical"
    channels: ["email", "slack", "pagerduty"]
    
  - name: "Service Down"
    condition: "availability < 99% over 1min"
    severity: "critical"
    channels: ["email", "slack", "pagerduty"]
```

监控仪表盘：
```typescript
// 自定义指标上报
const reportMetrics = async (metrics: PerformanceMetrics) => {
  await fetch('https://api.cloudflare.com/client/v4/accounts/your-account/analytics', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timestamp: Date.now(),
      metrics: {
        calculations_per_minute: metrics.calculationsPerMinute,
        average_calculation_time: metrics.avgCalculationTime,
        cache_hit_rate: metrics.cacheHitRate,
        user_satisfaction_score: metrics.userSatisfactionScore
      }
    })
  })
}
```

健康检查端点：
```typescript
// /api/health
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.VERSION,
      database: await checkDatabaseHealth(env.DB),
      cache: await checkCacheHealth(),
      dependencies: await checkExternalDependencies()
    }
    
    const isHealthy = Object.values(health).every(v => 
      typeof v === 'object' ? v.status === 'healthy' : true
    )
    
    return new Response(JSON.stringify(health), {
      status: isHealthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```