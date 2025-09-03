# 组件设计规范 - Zinses-Rechner

## 🧩 核心计算器组件设计

基于当前已实现的Vue 3组件架构，以下是详细的组件设计规范：

### 1. CalculatorForm 组件设计

#### 设计目标
- 提供直观的金融参数输入界面
- 支持德国本土化的数字格式和货币显示
- 实时验证和用户引导
- 移动端友好的交互体验

#### 组件结构
```vue
<template>
  <form @submit.prevent="handleSubmit" class="calculator-form">
    <!-- 基础参数区域 -->
    <FormSection title="Grundparameter" icon="calculator">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 起始金额 -->
        <BaseInput
          v-model="form.initialAmount"
          type="currency"
          label="Startkapital"
          placeholder="10.000"
          suffix="€"
          :min="0"
          :max="10000000"
          help-text="Ihr bereits vorhandenes Kapital"
          :error="errors.initialAmount"
          required
        />
        
        <!-- 月度投入 -->
        <BaseInput
          v-model="form.monthlyContribution"
          type="currency"
          label="Monatliche Sparrate"
          placeholder="500"
          suffix="€"
          :min="0"
          :max="50000"
          help-text="Betrag, den Sie monatlich sparen möchten"
          :error="errors.monthlyContribution"
        />
        
        <!-- 年利率 -->
        <BaseInput
          v-model="form.interestRate"
          type="percentage"
          label="Jährlicher Zinssatz"
          placeholder="4,0"
          suffix="%"
          :min="0"
          :max="15"
          :step="0.1"
          help-text="Erwarteter jährlicher Zinssatz"
          :error="errors.interestRate"
          required
        />
        
        <!-- 投资期限 -->
        <BaseSelect
          v-model="form.years"
          label="Anlagedauer"
          :options="yearOptions"
          help-text="Wie lange möchten Sie sparen?"
          :error="errors.years"
          required
        />
      </div>
    </FormSection>

    <!-- 德国税收设置 -->
    <FormSection title="Steuerliche Einstellungen" icon="tax" collapsible>
      <TaxSettings v-model="form.taxSettings" />
    </FormSection>

    <!-- 高级设置 -->
    <FormSection title="Erweiterte Einstellungen" icon="settings" collapsible>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 复利频率 -->
        <BaseSelect
          v-model="form.compoundingFrequency"
          label="Zinszahlungsrhythmus"
          :options="compoundingOptions"
          help-text="Wie oft werden Zinsen gutgeschrieben?"
        />
        
        <!-- 通胀调整 -->
        <div class="flex items-center space-x-3">
          <BaseToggle
            v-model="form.adjustForInflation"
            label="Inflation berücksichtigen"
          />
          <BaseInput
            v-if="form.adjustForInflation"
            v-model="form.inflationRate"
            type="percentage"
            placeholder="2,0"
            suffix="%"
            :min="0"
            :max="10"
            :step="0.1"
            class="w-24"
          />
        </div>
      </div>
    </FormSection>

    <!-- 操作按钮 -->
    <div class="form-actions flex flex-col sm:flex-row gap-4 pt-6">
      <BaseButton
        type="submit"
        variant="primary"
        size="lg"
        :loading="isCalculating"
        class="flex-1"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
        </template>
        Jetzt berechnen
      </BaseButton>
      
      <BaseButton
        type="button"
        variant="secondary"
        size="lg"
        @click="resetForm"
      >
        Zurücksetzen
      </BaseButton>
    </div>
  </form>
</template>
```

#### 交互行为规范
```typescript
// 表单验证规则
const validationRules = {
  initialAmount: {
    required: true,
    min: 0,
    max: 10000000,
    message: 'Startkapital muss zwischen 0€ und 10.000.000€ liegen'
  },
  interestRate: {
    required: true,
    min: 0,
    max: 15,
    message: 'Zinssatz muss zwischen 0% und 15% liegen'
  },
  years: {
    required: true,
    min: 1,
    max: 50,
    message: 'Anlagedauer muss zwischen 1 und 50 Jahren liegen'
  }
}

// 实时计算触发
const debouncedCalculate = debounce(() => {
  if (isFormValid.value) {
    emit('calculate', form.value)
  }
}, 500)

// 监听表单变化
watch(form, debouncedCalculate, { deep: true })
```

### 2. CalculatorResults 组件设计

#### 设计目标
- 清晰展示计算结果的层次结构
- 提供可视化图表和数据表格
- 支持结果导出和分享功能
- 包含德国税收相关的详细信息

#### 组件结构
```vue
<template>
  <div class="calculator-results">
    <!-- 主要结果卡片 -->
    <BaseCard variant="highlight" class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-gray-900">
            Ihr Endergebnis
          </h3>
          <div class="flex space-x-2">
            <ExportButtons :results="results" />
            <ShareButtons :results="results" />
          </div>
        </div>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 最终金额 -->
        <ResultMetric
          label="Endkapital"
          :value="results.finalAmount"
          format="currency"
          variant="primary"
          :change="results.totalGrowth"
          change-format="percentage"
        />
        
        <!-- 总投入 -->
        <ResultMetric
          label="Gesamte Einzahlungen"
          :value="results.totalContributions"
          format="currency"
          variant="neutral"
        />
        
        <!-- 收益 -->
        <ResultMetric
          label="Zinserträge"
          :value="results.totalInterest"
          format="currency"
          variant="success"
          :change="results.effectiveRate"
          change-format="percentage"
          change-label="Effektiver Zinssatz"
        />
      </div>
    </BaseCard>

    <!-- 德国税收信息 -->
    <TaxResults 
      v-if="results.taxInfo"
      :tax-info="results.taxInfo"
      class="mb-6"
    />

    <!-- 图表可视化 -->
    <BaseCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            Vermögensentwicklung
          </h3>
          <div class="flex space-x-2">
            <BaseButton
              v-for="chartType in chartTypes"
              :key="chartType.value"
              :variant="selectedChart === chartType.value ? 'primary' : 'secondary'"
              size="sm"
              @click="selectedChart = chartType.value"
            >
              {{ chartType.label }}
            </BaseButton>
          </div>
        </div>
      </template>
      
      <div class="h-80">
        <CompoundInterestChart
          v-if="selectedChart === 'compound'"
          :data="results.yearlyBreakdown"
          :height="320"
        />
        <component
          :is="chartComponents[selectedChart]"
          v-else
          :data="results.yearlyBreakdown"
          :height="320"
        />
      </div>
    </BaseCard>

    <!-- 年度明细表格 -->
    <BaseCard>
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900">
          Jährliche Entwicklung
        </h3>
      </template>
      
      <YearlyBreakdownTable
        :data="results.yearlyBreakdown"
        :show-tax-columns="results.taxInfo !== null"
      />
    </BaseCard>

    <!-- 结果解释 -->
    <ResultExplanation
      :results="results"
      :calculator-type="calculatorType"
      class="mt-6"
    />
  </div>
</template>
```

### 3. TaxSettings 组件设计 (德国特色)

#### 设计目标
- 简化德国税收设置的复杂性
- 提供智能默认值和建议
- 清晰解释各项税收的影响

#### 组件结构
```vue
<template>
  <div class="tax-settings">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 免税额度设置 -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-900">
          Sparerpauschbetrag
        </h4>
        <div class="flex items-center space-x-4">
          <BaseToggle
            v-model="settings.useFreistellungsauftrag"
            label="Freistellungsauftrag nutzen"
          />
          <BaseInput
            v-if="settings.useFreistellungsauftrag"
            v-model="settings.freistellungsauftrag"
            type="currency"
            placeholder="1.000"
            suffix="€"
            :max="maxFreistellungsauftrag"
            class="w-32"
          />
        </div>
        <p class="text-xs text-gray-500">
          {{ maritalStatus === 'married' ? '2.000€' : '1.000€' }} maximaler Freibetrag
        </p>
      </div>

      <!-- 教会税设置 -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-900">
          Kirchensteuer
        </h4>
        <BaseToggle
          v-model="settings.churchTax"
          label="Kirchensteuerpflichtig"
        />
        <p class="text-xs text-gray-500">
          {{ settings.churchTax ? '8% auf die Abgeltungssteuer' : 'Keine Kirchensteuer' }}
        </p>
      </div>

      <!-- 婚姻状况 -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-900">
          Familienstand
        </h4>
        <BaseSelect
          v-model="settings.maritalStatus"
          :options="maritalStatusOptions"
          @change="updateFreistellungsauftragLimit"
        />
      </div>

      <!-- ETF部分免税 (仅ETF计算器) -->
      <div v-if="showETFSettings" class="space-y-4">
        <h4 class="text-sm font-medium text-gray-900">
          Teilfreistellung
        </h4>
        <BaseSelect
          v-model="settings.etfType"
          :options="etfTypeOptions"
          help-text="Bestimmt den Teilfreistellungssatz"
        />
        <div class="text-xs text-gray-500">
          {{ getTeilfreistellungInfo(settings.etfType) }}
        </div>
      </div>
    </div>

    <!-- 税收影响预览 -->
    <div class="mt-6 p-4 bg-blue-50 rounded-lg">
      <h5 class="text-sm font-medium text-blue-900 mb-2">
        Steuerliche Auswirkungen
      </h5>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span class="text-blue-700">Abgeltungssteuer:</span>
          <span class="font-medium ml-1">25%</span>
        </div>
        <div>
          <span class="text-blue-700">Solidaritätszuschlag:</span>
          <span class="font-medium ml-1">5,5%</span>
        </div>
        <div v-if="settings.churchTax">
          <span class="text-blue-700">Kirchensteuer:</span>
          <span class="font-medium ml-1">8%</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 4. 移动端优化组件

#### MobileCalculatorForm 设计
```vue
<template>
  <div class="mobile-calculator-form">
    <!-- 步骤指示器 -->
    <div class="step-indicator mb-6">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex items-center"
          :class="{ 'flex-1': index < steps.length - 1 }"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            :class="getStepClass(index)"
          >
            {{ index + 1 }}
          </div>
          <div
            v-if="index < steps.length - 1"
            class="flex-1 h-0.5 mx-4"
            :class="currentStep > index ? 'bg-primary-500' : 'bg-gray-200'"
          ></div>
        </div>
      </div>
      <div class="mt-2 text-center">
        <h3 class="text-lg font-medium text-gray-900">
          {{ steps[currentStep].title }}
        </h3>
        <p class="text-sm text-gray-600">
          {{ steps[currentStep].description }}
        </p>
      </div>
    </div>

    <!-- 当前步骤内容 -->
    <div class="step-content mb-8">
      <component
        :is="steps[currentStep].component"
        v-model="formData"
        @next="nextStep"
        @previous="previousStep"
      />
    </div>

    <!-- 导航按钮 -->
    <div class="step-navigation flex justify-between">
      <BaseButton
        v-if="currentStep > 0"
        variant="secondary"
        @click="previousStep"
      >
        Zurück
      </BaseButton>
      <div v-else></div>
      
      <BaseButton
        v-if="currentStep < steps.length - 1"
        variant="primary"
        @click="nextStep"
        :disabled="!isCurrentStepValid"
      >
        Weiter
      </BaseButton>
      <BaseButton
        v-else
        variant="primary"
        @click="calculate"
        :loading="isCalculating"
      >
        Berechnen
      </BaseButton>
    </div>
  </div>
</template>
```

## 🎨 视觉状态设计

### 加载状态
```vue
<!-- 计算中状态 -->
<div class="calculating-state text-center py-8">
  <LoadingSpinner size="lg" class="mb-4" />
  <h3 class="text-lg font-medium text-gray-900 mb-2">
    Berechnung läuft...
  </h3>
  <p class="text-gray-600">
    Wir analysieren Ihre Daten und berücksichtigen deutsche Steueraspekte.
  </p>
</div>
```

### 错误状态
```vue
<!-- 错误状态 -->
<div class="error-state text-center py-8">
  <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  </div>
  <h3 class="text-lg font-medium text-gray-900 mb-2">
    Berechnung fehlgeschlagen
  </h3>
  <p class="text-gray-600 mb-4">
    {{ errorMessage }}
  </p>
  <BaseButton variant="primary" @click="retry">
    Erneut versuchen
  </BaseButton>
</div>
```

### 空状态
```vue
<!-- 空状态 -->
<div class="empty-state text-center py-12">
  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z"></path>
    </svg>
  </div>
  <h3 class="text-lg font-medium text-gray-900 mb-2">
    Bereit für Ihre Berechnung
  </h3>
  <p class="text-gray-600">
    Füllen Sie das Formular aus, um personalisierte Ergebnisse zu erhalten.
  </p>
</div>
```

这是组件设计规范的核心部分。接下来我将创建交互设计和UI提示词文档。
