# InstantResultsDisplay 组件文档

## 概述

`InstantResultsDisplay` 是一个专门的即时结果显示组件，用于实时显示计算结果、动画过渡效果、数据格式化等功能。该组件支持多种显示模式、状态管理、趋势图表和性能监控。

## 功能特性

### ✅ 核心功能
- **实时更新计算结果** - 响应输入变化，即时显示计算结果
- **动画过渡效果** - 平滑的数值变化动画，支持多种缓动函数
- **数据格式化显示** - 德语数字格式化，支持货币、百分比等格式
- **结果预览卡片** - 清晰的卡片式布局，突出重要信息
- **关键指标高亮** - 重要数据的视觉突出显示
- **趋势变化提示** - 显示数值变化趋势和方向

### ✅ 高级功能
- **多状态管理** - 支持就绪、计算中、预览、错误等多种状态
- **趋势图表** - SVG绘制的迷你趋势图，显示最近变化
- **详细信息展开** - 可折叠的详细信息区域
- **快速操作按钮** - 自定义操作按钮，支持保存、导出等功能
- **性能监控** - 显示计算时间、渲染时间等性能指标
- **错误处理** - 完善的错误显示和重试机制

### ✅ 用户体验
- **响应式设计** - 适配桌面和移动设备
- **深色模式支持** - 自动适配系统主题
- **高对比度模式** - 支持无障碍访问
- **减少动画模式** - 尊重用户的动画偏好设置

## 使用方法

### 基本用法

```vue
<template>
  <InstantResultsDisplay
    :results="calculationResults"
    :is-calculating="isCalculating"
    :error="errorMessage"
    :last-updated="lastUpdated"
  />
</template>

<script setup>
import InstantResultsDisplay from '@/components/realtime/InstantResultsDisplay.vue'
import { ref } from 'vue'

const calculationResults = ref(null)
const isCalculating = ref(false)
const errorMessage = ref(null)
const lastUpdated = ref(null)
</script>
```

### 完整配置

```vue
<template>
  <InstantResultsDisplay
    :results="calculationResults"
    :preview-results="previewResults"
    :is-calculating="isCalculating"
    :is-preview-mode="isPreviewMode"
    :error="errorMessage"
    :last-updated="lastUpdated"
    :show-details="true"
    :show-actions="true"
    :show-trend-chart="true"
    :show-performance-metrics="true"
    :quick-actions="quickActions"
    :performance-data="performanceData"
    @action="handleAction"
    @retry="handleRetry"
    @details-toggle="handleDetailsToggle"
  />
</template>
```

## Props 属性

### 必需属性

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `results` | `CalculationResult \| null` | `null` | 计算结果数据 |

### 可选属性

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `previewResults` | `Partial<CalculationResult> \| null` | `null` | 预览模式的结果数据 |
| `isCalculating` | `boolean` | `false` | 是否正在计算中 |
| `isPreviewMode` | `boolean` | `false` | 是否为预览模式 |
| `error` | `string \| null` | `null` | 错误信息 |
| `lastUpdated` | `Date \| null` | `null` | 最后更新时间 |
| `showDetails` | `boolean` | `true` | 是否显示详细信息区域 |
| `showActions` | `boolean` | `false` | 是否显示快速操作按钮 |
| `showTrendChart` | `boolean` | `true` | 是否显示趋势图表 |
| `showPerformanceMetrics` | `boolean` | `false` | 是否显示性能指标 |
| `showRetry` | `boolean` | `true` | 是否显示重试按钮 |
| `quickActions` | `QuickAction[]` | `[]` | 快速操作按钮配置 |
| `performanceData` | `PerformanceData \| null` | `null` | 性能数据 |

## 事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `action` | `actionKey: string` | 快速操作按钮被点击 |
| `retry` | - | 重试按钮被点击 |
| `detailsToggle` | `expanded: boolean` | 详细信息展开/折叠状态变化 |

## 数据类型

### CalculationResult

```typescript
interface CalculationResult {
  finalAmount?: number
  final_amount?: number
  totalContributions?: number
  total_contributions?: number
  totalInterest?: number
  total_interest?: number
  effectiveRate?: number
  annual_return?: number
  yearlyBreakdown?: YearlyData[]
  breakdown?: Record<string, any>
}
```

### QuickAction

```typescript
interface QuickAction {
  key: string
  label: string
  icon: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}
```

### PerformanceData

```typescript
interface PerformanceData {
  calculationTime: number
  renderTime: number
  cacheHitRate: number
}
```

## 样式定制

### CSS 变量

组件使用 Tailwind CSS 类，可以通过以下方式定制样式：

```css
.instant-results-display {
  /* 主要颜色 */
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  
  /* 字体 */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* 间距 */
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  
  /* 圆角 */
  --border-radius: 0.5rem;
  --border-radius-lg: 0.75rem;
}
```

### 自定义主题

```css
/* 深色主题 */
@media (prefers-color-scheme: dark) {
  .instant-results-display {
    --bg-primary: #1f2937;
    --bg-secondary: #374151;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --border-color: #4b5563;
  }
}

/* 高对比度主题 */
@media (prefers-contrast: high) {
  .instant-results-display {
    --border-width: 2px;
    --text-contrast: #000000;
    --bg-contrast: #ffffff;
  }
}
```

## 使用示例

### 1. 基本计算器结果显示

```vue
<template>
  <div class="calculator-app">
    <CalculatorForm @calculate="handleCalculate" />
    <InstantResultsDisplay
      :results="results"
      :is-calculating="calculating"
      :error="error"
      :last-updated="lastUpdated"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InstantResultsDisplay from '@/components/realtime/InstantResultsDisplay.vue'

const results = ref(null)
const calculating = ref(false)
const error = ref(null)
const lastUpdated = ref(null)

const handleCalculate = async (inputs) => {
  calculating.value = true
  error.value = null
  
  try {
    const result = await calculateCompoundInterest(inputs)
    results.value = result
    lastUpdated.value = new Date()
  } catch (err) {
    error.value = err.message
  } finally {
    calculating.value = false
  }
}
</script>
```

### 2. 带预览模式的高级用法

```vue
<template>
  <InstantResultsDisplay
    :results="finalResults"
    :preview-results="previewResults"
    :is-preview-mode="isPreviewMode"
    :show-actions="true"
    :quick-actions="actions"
    @action="handleAction"
  />
</template>

<script setup>
import { ref, computed } from 'vue'

const finalResults = ref(null)
const isPreviewMode = ref(false)

const previewResults = computed(() => {
  if (!isPreviewMode.value) return null
  return {
    finalAmount: 50000,
    totalContributions: 30000,
    totalInterest: 20000
  }
})

const actions = [
  { key: 'save', label: '保存', icon: 'save', variant: 'primary' },
  { key: 'export', label: '导出', icon: 'download', variant: 'secondary' },
  { key: 'share', label: '分享', icon: 'share', variant: 'secondary' }
]

const handleAction = (actionKey) => {
  switch (actionKey) {
    case 'save':
      saveResults()
      break
    case 'export':
      exportResults()
      break
    case 'share':
      shareResults()
      break
  }
}
</script>
```

### 3. 性能监控集成

```vue
<template>
  <InstantResultsDisplay
    :results="results"
    :show-performance-metrics="true"
    :performance-data="performanceData"
  />
</template>

<script setup>
import { ref, watch } from 'vue'

const results = ref(null)
const performanceData = ref({
  calculationTime: 0,
  renderTime: 0,
  cacheHitRate: 85
})

watch(results, () => {
  // 更新性能数据
  performanceData.value = {
    calculationTime: performance.now() - startTime,
    renderTime: Math.random() * 20 + 5,
    cacheHitRate: Math.random() * 100
  }
}, { deep: true })
</script>
```

## 最佳实践

### 1. 性能优化

- 使用 `v-memo` 指令缓存复杂的计算结果
- 合理设置动画速度，避免过于频繁的更新
- 使用防抖处理高频输入变化

```vue
<template>
  <InstantResultsDisplay
    v-memo="[results?.finalAmount, isCalculating]"
    :results="debouncedResults"
  />
</template>

<script setup>
import { debounce } from 'lodash-es'

const debouncedResults = ref(null)
const updateResults = debounce((newResults) => {
  debouncedResults.value = newResults
}, 300)
</script>
```

### 2. 错误处理

- 提供清晰的错误信息
- 实现重试机制
- 记录错误日志用于调试

```vue
<script setup>
const handleRetry = async () => {
  try {
    await recalculate()
  } catch (error) {
    console.error('重试失败:', error)
    // 发送错误报告
    reportError(error)
  }
}
</script>
```

### 3. 无障碍访问

- 使用语义化的 HTML 结构
- 提供适当的 ARIA 标签
- 支持键盘导航

```vue
<template>
  <InstantResultsDisplay
    role="region"
    aria-label="计算结果"
    :aria-busy="isCalculating"
  />
</template>
```

## 故障排除

### 常见问题

1. **动画不流畅**
   - 检查 `prefers-reduced-motion` 设置
   - 确保 CSS 动画属性正确配置
   - 考虑降低动画复杂度

2. **数据格式化错误**
   - 确认 `germanFormatters` 工具函数正确导入
   - 检查数据类型是否为数字
   - 验证区域设置配置

3. **趋势图不显示**
   - 确保有足够的数据点（至少2个）
   - 检查 SVG 容器尺寸
   - 验证数据范围计算

### 调试技巧

```vue
<template>
  <InstantResultsDisplay
    :show-performance-metrics="isDevelopment"
    @details-toggle="logDetailsToggle"
  />
</template>

<script setup>
const isDevelopment = process.env.NODE_ENV === 'development'

const logDetailsToggle = (expanded) => {
  console.log('详细信息展开状态:', expanded)
}
</script>
```

## 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 支持基本的结果显示功能
- 实现动画过渡效果
- 添加趋势图表功能
- 支持多种状态管理
- 实现性能监控功能
