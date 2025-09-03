/**
 * 税收计算Composable
 * 提供德国税收计算的响应式接口
 */

import { ref, computed, watch, onMounted } from 'vue'
import { TaxIntegrationService } from '@/services/TaxIntegrationService'
import type { 
  GermanTaxConfiguration, 
  TaxCalculationResult,
  CalculatorTaxResult,
  InvestmentScenario
} from '@/types/GermanTaxTypes'
import type { CompoundInterestResult } from '@/types/CalculatorTypes'

/**
 * 税收计算配置接口
 */
export interface TaxCalculationConfig {
  autoCalculate?: boolean
  enableOptimizations?: boolean
  enableComparisons?: boolean
  persistConfiguration?: boolean
}

/**
 * 税收计算Composable
 */
export function useTaxCalculation(config: TaxCalculationConfig = {}) {
  // 默认配置
  const defaultConfig: TaxCalculationConfig = {
    autoCalculate: true,
    enableOptimizations: true,
    enableComparisons: true,
    persistConfiguration: true
  }

  const finalConfig = { ...defaultConfig, ...config }

  // 响应式状态
  const taxService = ref<TaxIntegrationService>()
  const taxConfiguration = ref<GermanTaxConfiguration>()
  const currentTaxResult = ref<TaxCalculationResult>()
  const calculatorTaxResult = ref<CalculatorTaxResult>()
  const isCalculating = ref(false)
  const calculationError = ref<string>()

  // 税收优化建议
  const optimizationSuggestions = ref<Array<{
    type: string
    title: string
    description: string
    potentialSavings: number
    difficulty: string
    priority: number
  }>>([])

  // 场景比较结果
  const scenarioComparisons = ref<Array<{
    scenario: InvestmentScenario
    taxResult: CalculatorTaxResult
    ranking: number
  }>>([])

  // 计算属性
  const taxSummary = computed(() => {
    if (!taxService.value) return null
    return taxService.value.getTaxSummary()
  })

  const isConfigurationValid = computed(() => {
    if (!taxService.value) return false
    const validation = taxService.value.validateTaxConfiguration()
    return validation.isValid
  })

  const configurationErrors = computed(() => {
    if (!taxService.value) return []
    const validation = taxService.value.validateTaxConfiguration()
    return validation.errors
  })

  const effectiveTaxRate = computed(() => {
    return currentTaxResult.value?.summary.effectiveTaxRate || 0
  })

  const totalTaxSavings = computed(() => {
    return currentTaxResult.value?.summary.taxSavings || 0
  })

  const netGains = computed(() => {
    return currentTaxResult.value?.summary.netGains || 0
  })

  // 方法
  const initializeTaxService = (initialConfig?: GermanTaxConfiguration) => {
    try {
      taxService.value = new TaxIntegrationService(initialConfig)
      taxConfiguration.value = taxService.value.getCurrentConfiguration()
      calculationError.value = undefined
    } catch (error) {
      calculationError.value = `税收服务初始化失败: ${error}`
      console.error('税收服务初始化失败:', error)
    }
  }

  const updateTaxConfiguration = (newConfig: Partial<GermanTaxConfiguration>) => {
    if (!taxService.value) {
      calculationError.value = '税收服务未初始化'
      return
    }

    try {
      taxService.value.updateTaxConfiguration(newConfig)
      taxConfiguration.value = taxService.value.getCurrentConfiguration()
      
      // 持久化配置
      if (finalConfig.persistConfiguration) {
        saveTaxConfiguration()
      }
      
      calculationError.value = undefined
    } catch (error) {
      calculationError.value = `税收配置更新失败: ${error}`
      console.error('税收配置更新失败:', error)
    }
  }

  const calculateTaxes = async (
    capitalGains: number,
    etfData?: { gains: number; type: any },
    freistellungsauftragUsed: number = 0
  ) => {
    if (!taxService.value) {
      calculationError.value = '税收服务未初始化'
      return
    }

    isCalculating.value = true
    calculationError.value = undefined

    try {
      currentTaxResult.value = taxService.value.taxEngine.calculateTaxes(
        capitalGains,
        etfData,
        freistellungsauftragUsed
      )
    } catch (error) {
      calculationError.value = `税收计算失败: ${error}`
      console.error('税收计算失败:', error)
    } finally {
      isCalculating.value = false
    }
  }

  const calculateCompoundInterestTax = async (
    result: CompoundInterestResult,
    scenario?: InvestmentScenario
  ) => {
    if (!taxService.value) {
      calculationError.value = '税收服务未初始化'
      return
    }

    isCalculating.value = true
    calculationError.value = undefined

    try {
      calculatorTaxResult.value = taxService.value.calculateCompoundInterestTax(result, scenario)
      currentTaxResult.value = calculatorTaxResult.value.taxCalculation
    } catch (error) {
      calculationError.value = `复利税收计算失败: ${error}`
      console.error('复利税收计算失败:', error)
    } finally {
      isCalculating.value = false
    }
  }

  const generateOptimizationSuggestions = async (
    result: CompoundInterestResult,
    currentScenario?: InvestmentScenario
  ) => {
    if (!taxService.value || !finalConfig.enableOptimizations) return

    try {
      optimizationSuggestions.value = taxService.value.generateTaxOptimizationSuggestions(
        result,
        currentScenario
      )
    } catch (error) {
      console.error('优化建议生成失败:', error)
    }
  }

  const compareScenarios = async (
    result: CompoundInterestResult,
    scenarios: InvestmentScenario[]
  ) => {
    if (!taxService.value || !finalConfig.enableComparisons) return

    try {
      scenarioComparisons.value = taxService.value.compareTaxScenarios(result, scenarios)
    } catch (error) {
      console.error('场景比较失败:', error)
    }
  }

  const calculateETFTaxAdvantage = (
    gains: number,
    etfType: keyof typeof import('@/utils/tax/GermanTaxEngine').GERMAN_TAX_CONSTANTS.ETF_TEILFREISTELLUNG_RATES
  ) => {
    if (!taxService.value) return null

    try {
      return taxService.value.calculateETFTaxAdvantage(gains, etfType)
    } catch (error) {
      console.error('ETF税收优势计算失败:', error)
      return null
    }
  }

  const optimizeFreistellungsauftragAllocation = (
    investments: Array<{
      name: string
      expectedGains: number
      priority: number
    }>
  ) => {
    if (!taxService.value) return []

    try {
      return taxService.value.optimizeFreistellungsauftragAllocation(investments)
    } catch (error) {
      console.error('Freistellungsauftrag优化失败:', error)
      return []
    }
  }

  const saveTaxConfiguration = () => {
    if (!taxConfiguration.value) return

    try {
      localStorage.setItem('germanTaxConfiguration', JSON.stringify(taxConfiguration.value))
    } catch (error) {
      console.error('税收配置保存失败:', error)
    }
  }

  const loadTaxConfiguration = (): GermanTaxConfiguration | null => {
    try {
      const saved = localStorage.getItem('germanTaxConfiguration')
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('税收配置加载失败:', error)
      return null
    }
  }

  const resetTaxConfiguration = () => {
    if (!taxService.value) return

    const defaultConfig = new TaxIntegrationService().getCurrentConfiguration()
    updateTaxConfiguration(defaultConfig)
  }

  const exportTaxCalculation = () => {
    if (!currentTaxResult.value) return null

    return {
      timestamp: new Date().toISOString(),
      configuration: taxConfiguration.value,
      result: currentTaxResult.value,
      summary: {
        capitalGains: currentTaxResult.value.capitalGains,
        totalTaxes: currentTaxResult.value.summary.totalTaxes,
        netGains: currentTaxResult.value.summary.netGains,
        effectiveTaxRate: currentTaxResult.value.summary.effectiveTaxRate,
        taxSavings: currentTaxResult.value.summary.taxSavings
      }
    }
  }

  // 监听器
  watch(
    () => taxConfiguration.value,
    (newConfig) => {
      if (newConfig && finalConfig.persistConfiguration) {
        saveTaxConfiguration()
      }
    },
    { deep: true }
  )

  // 生命周期
  onMounted(() => {
    // 加载保存的配置
    let savedConfig: GermanTaxConfiguration | null = null
    if (finalConfig.persistConfiguration) {
      savedConfig = loadTaxConfiguration()
    }

    // 初始化税收服务
    initializeTaxService(savedConfig || undefined)
  })

  return {
    // 状态
    taxConfiguration,
    currentTaxResult,
    calculatorTaxResult,
    isCalculating,
    calculationError,
    optimizationSuggestions,
    scenarioComparisons,

    // 计算属性
    taxSummary,
    isConfigurationValid,
    configurationErrors,
    effectiveTaxRate,
    totalTaxSavings,
    netGains,

    // 方法
    initializeTaxService,
    updateTaxConfiguration,
    calculateTaxes,
    calculateCompoundInterestTax,
    generateOptimizationSuggestions,
    compareScenarios,
    calculateETFTaxAdvantage,
    optimizeFreistellungsauftragAllocation,
    saveTaxConfiguration,
    loadTaxConfiguration,
    resetTaxConfiguration,
    exportTaxCalculation,

    // 配置
    config: finalConfig
  }
}

// 导出类型
export type { TaxCalculationConfig }
