// 复利计算器核心逻辑 composable

import { ref, computed, watch } from 'vue'
import type { CalculatorForm, CalculationResult, ValidationError } from '@/types/calculator'
import { GermanTaxService, type TaxSettings, type TaxCalculation } from '@/services/germanTaxService'
import { validateRange, getValidationMessage } from '@/utils/formatters'
import { calculatorAPI, ApiError } from '@/services/api'

export function useCalculator() {
  // 表单数据
  const form = ref<CalculatorForm>({
    principal: 10000,
    monthlyPayment: 500,
    annualRate: 4.0,
    years: 10,
    compoundFrequency: 'monthly',
  })

  // 税务设置
  const taxSettings = ref<TaxSettings & { enabled: boolean }>({
    enabled: false,
    hasKirchensteuer: false,
    kirchensteuerRate: 0.09,
    bundesland: '',
    isMarried: false
  })

  // 计算状态
  const isCalculating = ref(false)
  const results = ref<CalculationResult | null>(null)
  const errors = ref<ValidationError[]>([])
  const taxCalculation = ref<TaxCalculation | null>(null)

  // 验证规则
  const validationRules = {
    principal: { min: 1, max: 10000000 },
    monthlyPayment: { min: 0, max: 50000 },
    annualRate: { min: 0, max: 20 },
    years: { min: 1, max: 50 },
  }

  // 表单验证
  const validateForm = (): boolean => {
    errors.value = []

    // 验证本金
    if (
      !validateRange(
        form.value.principal,
        validationRules.principal.min,
        validationRules.principal.max,
      )
    ) {
      errors.value.push({
        field: 'principal',
        message: getValidationMessage(
          'principal',
          validationRules.principal.min,
          validationRules.principal.max,
        ),
        code: 'INVALID_PRINCIPAL',
      })
    }

    // 验证月供
    if (
      !validateRange(
        form.value.monthlyPayment,
        validationRules.monthlyPayment.min,
        validationRules.monthlyPayment.max,
      )
    ) {
      errors.value.push({
        field: 'monthlyPayment',
        message: getValidationMessage(
          'monthlyPayment',
          validationRules.monthlyPayment.min,
          validationRules.monthlyPayment.max,
        ),
        code: 'INVALID_MONTHLY_PAYMENT',
      })
    }

    // 验证利率
    if (
      !validateRange(
        form.value.annualRate,
        validationRules.annualRate.min,
        validationRules.annualRate.max,
      )
    ) {
      errors.value.push({
        field: 'annualRate',
        message: getValidationMessage(
          'annualRate',
          validationRules.annualRate.min,
          validationRules.annualRate.max,
        ),
        code: 'INVALID_RATE',
      })
    }

    // 验证年限
    if (!validateRange(form.value.years, validationRules.years.min, validationRules.years.max)) {
      errors.value.push({
        field: 'years',
        message: getValidationMessage(
          'years',
          validationRules.years.min,
          validationRules.years.max,
        ),
        code: 'INVALID_YEARS',
      })
    }

    return errors.value.length === 0
  }

  // 计算复利
  const calculate = async (): Promise<void> => {
    if (!validateForm()) {
      return
    }

    isCalculating.value = true
    errors.value = [] // 清除之前的错误

    try {
      // 使用本地计算而不是API调用
      const { calculateCompoundInterest, validateCalculationInput } = await import('@/utils/localCalculations')

      // 验证输入
      const validation = validateCalculationInput(form.value, 'compound')
      if (!validation.isValid) {
        validation.errors.forEach(error => {
          errors.value.push({
            field: 'general',
            message: error,
            code: 'VALIDATION_ERROR',
          })
        })
        return
      }

      // 执行本地计算
      const localResult = calculateCompoundInterest({
        principal: form.value.principal,
        monthlyPayment: form.value.monthlyPayment || 0,
        annualRate: form.value.annualRate,
        years: form.value.years,
        compoundFrequency: form.value.compoundFrequency || 'monthly'
      })

      // 转换为期望的结果格式
      results.value = {
        totalAmount: localResult.totalAmount,
        totalInterest: localResult.totalInterest,
        totalContributions: localResult.totalContributions,
        yearlyBreakdown: localResult.yearlyBreakdown,
        effectiveRate: localResult.effectiveRate,
        monthlyBreakdown: localResult.monthlyBreakdown
      }

      // 如果启用了税务计算，计算税务影响
      if (taxSettings.value.enabled && results.value) {
        taxCalculation.value = GermanTaxService.calculateYearlyTax(
          results.value.totalInterest || 0,
          taxSettings.value
        )
      } else {
        taxCalculation.value = null
      }

      console.log('本地计算成功:', results.value)
    } catch (error) {
      console.error('计算错误:', error)

      errors.value.push({
        field: 'general',
        message: 'Berechnungsfehler. Bitte überprüfen Sie Ihre Eingaben.',
        code: 'CALCULATION_ERROR',
      })
    } finally {
      isCalculating.value = false
    }
  }

  // 重置表单
  const resetForm = (): void => {
    form.value = {
      principal: 10000,
      monthlyPayment: 500,
      annualRate: 4.0,
      years: 10,
      compoundFrequency: 'monthly',
    }
    results.value = null
    errors.value = []
  }

  // 计算是否有效
  const isFormValid = computed(() => errors.value.length === 0)

  // 监听表单变化，自动验证
  watch(
    form,
    () => {
      if (results.value) {
        validateForm()
      }
    },
    { deep: true },
  )

  return {
    form,
    results,
    errors,
    isCalculating,
    isFormValid,
    taxSettings,
    taxCalculation,
    calculate,
    resetForm,
    validateForm,
  }
}
