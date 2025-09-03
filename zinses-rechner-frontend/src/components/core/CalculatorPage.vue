<template>
  <div class="calculator-page">
    <!-- 页面头部 -->
    <div class="mb-8">
      <div class="flex items-center space-x-3 mb-4">
        <BaseIcon
          v-if="calculator?.icon"
          :name="calculator.icon"
          size="xl"
          class="text-blue-600"
        />
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            {{ calculator?.name || 'Rechner' }}
          </h1>
          <p class="text-lg text-gray-600 mt-1">
            {{ calculator?.description }}
          </p>
        </div>
      </div>

      <!-- 面包屑导航 -->
      <nav class="flex" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-2">
          <li>
            <router-link to="/" class="text-gray-500 hover:text-gray-700">
              Startseite
            </router-link>
          </li>
          <li>
            <BaseIcon name="chevron-right" size="sm" class="text-gray-400" />
          </li>
          <li>
            <span class="text-gray-900 font-medium">
              {{ calculator?.name }}
            </span>
          </li>
        </ol>
      </nav>
    </div>

    <!-- 错误状态 -->
    <ErrorMessage
      v-if="error"
      type="error"
      title="Fehler beim Laden des Rechners"
      :message="error"
      class="mb-8"
      @dismiss="clearError"
    />

    <!-- 加载状态 -->
    <LoadingState
      v-else-if="isLoading"
      :is-loading="true"
      message="Rechner wird geladen..."
      type="skeleton"
      class="mb-8"
    />

    <!-- 计算器内容 -->
    <div v-else-if="calculator" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 左侧：输入表单 -->
      <div class="space-y-6">
        <DynamicForm
          :schema="calculator.formSchema || calculator.getFormSchema?.()"
          v-model="formData"
          :title="''"
          :is-loading="isCalculating"
          :loading-message="'Berechnung läuft...'"
          submit-text="Jetzt berechnen"
          submitting-text="Wird berechnet..."
          @submit="handleCalculate"
          @reset="handleReset"
          @validate="handleValidation"
        />

        <!-- 计算器信息 -->
        <CalculatorInfo
          :calculator="calculator"
          :show-formula="true"
          :show-examples="true"
        />
      </div>

      <!-- 右侧：结果显示 -->
      <div class="space-y-6">
        <DynamicResults
          :calculator="calculator"
          :results="calculationResults"
          :form-data="formData"
          :is-calculating="isCalculating"
          @export="handleExport"
          @share="handleShare"
        />

        <!-- 相关计算器推荐 -->
        <RelatedCalculators
          v-if="relatedCalculators.length > 0"
          :calculators="relatedCalculators"
          :current-calculator-id="calculator.id"
        />
      </div>
    </div>

    <!-- 计算器未找到 -->
    <div v-else class="text-center py-12">
      <BaseIcon name="calculator" size="3xl" class="mx-auto text-gray-400 mb-4" />
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        Rechner nicht gefunden
      </h2>
      <p class="text-gray-600 mb-6">
        Der angeforderte Rechner konnte nicht geladen werden.
      </p>
      <BaseButton
        variant="primary"
        @click="$router.push('/')"
      >
        Zur Startseite
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type {
  BaseCalculator,
  CalculationResult,
  ValidationResult
} from '@/types/calculator'
// import { calculatorRegistry } from '@/core/CalculatorRegistry' // 改为异步导入
import BaseIcon from '../ui/BaseIcon.vue'
import BaseButton from '../ui/BaseButton.vue'
import ErrorMessage from '../ui/ErrorMessage.vue'
import LoadingState from '../ui/LoadingState.vue'
import DynamicForm from './DynamicForm.vue'
import DynamicResults from './DynamicResults.vue'
import CalculatorInfo from './CalculatorInfo.vue'
import RelatedCalculators from './RelatedCalculators.vue'

interface Props {
  calculatorId?: string
}

const props = defineProps<Props>()
const route = useRoute()
const router = useRouter()

// 状态管理
const calculator = ref<BaseCalculator | null>(null)
const formData = ref<Record<string, any>>({})
const calculationResults = ref<CalculationResult | null>(null)
const isLoading = ref(true)
const isCalculating = ref(false)
const error = ref<string | null>(null)

// 计算属性
const calculatorId = computed(() => {
  return props.calculatorId || route.params.calculatorId as string
})

// 相关计算器 - 使用ref而不是computed，因为需要异步加载
const relatedCalculators = ref<BaseCalculator[]>([])

// 异步加载相关计算器
const loadRelatedCalculators = async () => {
  if (!calculator.value) return

  try {
    const { calculatorRegistry } = await import('@/core/CalculatorRegistry')
    relatedCalculators.value = calculatorRegistry
      .getCalculatorsByCategory(calculator.value.category)
      .filter(calc => calc.id !== calculator.value!.id)
      .slice(0, 3)
  } catch (error) {
    console.error('Failed to load related calculators:', error)
  }
}

// 方法
const loadCalculator = async () => {
  isLoading.value = true
  error.value = null

  try {
    // 异步导入calculatorRegistry以避免循环依赖
    const { calculatorRegistry } = await import('@/core/CalculatorRegistry')
    const calc = calculatorRegistry.getCalculator(calculatorId.value)

    if (!calc) {
      throw new Error(`Rechner mit ID "${calculatorId.value}" nicht gefunden`)
    }

    calculator.value = calc

    // 初始化表单数据
    initializeFormData()

    // 从URL参数恢复表单状态
    restoreFormFromUrl()

    // 异步加载相关计算器
    loadRelatedCalculators()

  } catch (err) {
    console.error('计算器加载错误:', err)
    error.value = err instanceof Error ? err.message : '未知错误'
  } finally {
    isLoading.value = false
  }
}

const initializeFormData = () => {
  if (!calculator.value) return

  const initialData: Record<string, any> = {}

  const schema = calculator.value.formSchema || calculator.value.getFormSchema?.()
  schema?.fields.forEach((field: any) => {
    if (field.defaultValue !== undefined) {
      initialData[field.key] = field.defaultValue
    }
  })

  formData.value = initialData
}

const restoreFormFromUrl = () => {
  const urlParams = route.query

  if (Object.keys(urlParams).length === 0) return

  const restoredData = { ...formData.value }

  const schema2 = calculator.value?.formSchema || calculator.value?.getFormSchema?.()
  schema2?.fields.forEach((field: any) => {
    const urlValue = urlParams[field.key]
    if (urlValue !== undefined) {
      // 根据字段类型转换URL参数
      switch (field.type) {
        case 'number':
        case 'currency':
        case 'percentage':
          restoredData[field.key] = Number(urlValue)
          break
        case 'boolean':
          restoredData[field.key] = urlValue === 'true'
          break
        default:
          restoredData[field.key] = urlValue
      }
    }
  })

  formData.value = restoredData
}

const updateUrlParams = () => {
  const query: Record<string, string> = {}

  Object.entries(formData.value).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query[key] = String(value)
    }
  })

  router.replace({ query })
}

const handleCalculate = async () => {
  if (!calculator.value) return

  isCalculating.value = true

  try {
    const results = await calculator.value.calculate(formData.value)
    calculationResults.value = results

    // 更新URL参数
    updateUrlParams()

    // 发送分析事件
    if (typeof gtag !== 'undefined') {
      gtag('event', 'calculate', {
        event_category: 'Calculator',
        event_label: calculator.value.id,
        value: 1
      })
    }

  } catch (err) {
    console.error('计算错误:', err)
    error.value = err instanceof Error ? err.message : '计算失败'
  } finally {
    isCalculating.value = false
  }
}

const handleReset = () => {
  initializeFormData()
  calculationResults.value = null
  router.replace({ query: {} })
}

const handleValidation = (result: ValidationResult) => {
  // 处理验证结果
  console.log('验证结果:', result)
}

const handleExport = (format: string) => {
  // 处理导出
  console.log('导出格式:', format)
}

const handleShare = (platform: string) => {
  // 处理分享
  console.log('分享平台:', platform)
}

const clearError = () => {
  error.value = null
}

// 监听器
watch(calculatorId, () => {
  loadCalculator()
})

// 防抖定时器
let updateUrlParamsTimeout: NodeJS.Timeout | null = null

watch(formData, () => {
  // 防抖更新URL参数
  if (updateUrlParamsTimeout) {
    clearTimeout(updateUrlParamsTimeout)
  }
  updateUrlParamsTimeout = setTimeout(updateUrlParams, 1000)
}, { deep: true })

// 生命周期
onMounted(() => {
  loadCalculator()
})
</script>

<style scoped>
.calculator-page {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style>
