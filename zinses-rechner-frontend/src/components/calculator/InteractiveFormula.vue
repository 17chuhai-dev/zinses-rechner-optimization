<template>
  <div class="interactive-formula bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mt-4">
    <!-- 标题 -->
    <div class="formula-header mb-4">
      <h5 class="text-lg font-semibold text-blue-900 mb-2">
        🎯 Interaktive Formel-Demonstration
      </h5>
      <p class="text-sm text-blue-700">
        Bewegen Sie die Maus über die Variablen, um ihre Bedeutung zu sehen
      </p>
    </div>

    <!-- 主公式显示 -->
    <div class="main-formula bg-white rounded-lg p-4 mb-4 shadow-sm">
      <div class="formula-display text-center">
        <div class="formula-text text-2xl font-mono mb-2">
          <span 
            class="variable-hover"
            @mouseenter="showTooltip('A', $event)"
            @mouseleave="hideTooltip"
          >
            A
          </span>
          <span class="operator"> = </span>
          <span 
            class="variable-hover"
            @mouseenter="showTooltip('P', $event)"
            @mouseleave="hideTooltip"
          >
            P
          </span>
          <span class="operator"> × </span>
          <span class="bracket">(</span>
          <span class="number">1</span>
          <span class="operator"> + </span>
          <span 
            class="variable-hover"
            @mouseenter="showTooltip('r', $event)"
            @mouseleave="hideTooltip"
          >
            r
          </span>
          <span class="operator">/</span>
          <span 
            class="variable-hover"
            @mouseenter="showTooltip('n', $event)"
            @mouseleave="hideTooltip"
          >
            n
          </span>
          <span class="bracket">)</span>
          <sup class="exponent">
            <span 
              class="variable-hover"
              @mouseenter="showTooltip('nt', $event)"
              @mouseleave="hideTooltip"
            >
              n×t
            </span>
          </sup>
          
          <template v-if="form.monthlyPayment > 0">
            <span class="operator"> + </span>
            <span 
              class="variable-hover"
              @mouseenter="showTooltip('PMT', $event)"
              @mouseleave="hideTooltip"
            >
              PMT
            </span>
            <span class="operator"> × </span>
            <span class="bracket">[</span>
            <span class="fraction">
              <span class="numerator">
                <span class="bracket">(</span>
                <span class="number">1</span>
                <span class="operator"> + </span>
                <span class="variable-hover">r/n</span>
                <span class="bracket">)</span>
                <sup class="exponent">n×t</sup>
                <span class="operator"> - </span>
                <span class="number">1</span>
              </span>
              <span class="fraction-line"></span>
              <span class="denominator">r/n</span>
            </span>
            <span class="bracket">]</span>
          </template>
        </div>
        
        <div class="formula-description text-sm text-gray-600">
          {{ currentFormulaDescription }}
        </div>
      </div>
    </div>

    <!-- 数值替换显示 -->
    <div class="value-substitution bg-white rounded-lg p-4 mb-4 shadow-sm">
      <h6 class="font-medium text-gray-800 mb-3">🔢 Mit Ihren Werten:</h6>
      
      <div class="substituted-formula text-lg font-mono text-center mb-3">
        <span class="result-var">A</span>
        <span class="operator"> = </span>
        <span class="value">{{ formatCurrency(form.principal) }}</span>
        <span class="operator"> × </span>
        <span class="bracket">(</span>
        <span class="number">1</span>
        <span class="operator"> + </span>
        <span class="value">{{ (form.annualRate / 100).toFixed(4) }}</span>
        <span class="operator">/</span>
        <span class="value">12</span>
        <span class="bracket">)</span>
        <sup class="exponent">
          <span class="value">{{ 12 * form.years }}</span>
        </sup>
        
        <template v-if="form.monthlyPayment > 0">
          <span class="operator"> + </span>
          <span class="value">{{ formatCurrency(form.monthlyPayment) }}</span>
          <span class="operator"> × </span>
          <span class="complex-term">[Sparraten-Faktor]</span>
        </template>
      </div>
      
      <div class="calculation-result text-center">
        <div class="equals text-lg font-bold text-blue-600 mb-2">=</div>
        <div class="final-result text-2xl font-bold text-green-600">
          {{ formatCurrency(result.finalAmount || 0) }}
        </div>
      </div>
    </div>

    <!-- 分步计算 -->
    <div class="step-calculation bg-white rounded-lg p-4 shadow-sm">
      <h6 class="font-medium text-gray-800 mb-3">📝 Schritt-für-Schritt:</h6>
      
      <div class="calculation-steps space-y-2">
        <div 
          v-for="(step, index) in calculationSteps" 
          :key="index"
          class="step-item flex items-center p-2 rounded hover:bg-gray-50 transition-colors"
        >
          <span class="step-number bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">
            {{ index + 1 }}
          </span>
          <div class="step-content flex-1">
            <div class="step-formula font-mono text-sm">{{ step.formula }}</div>
            <div v-if="step.result" class="step-result text-xs text-blue-600 mt-1">
              = {{ step.result }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 变量工具提示 -->
    <Teleport to="body">
      <div
        v-if="tooltip.show"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        class="variable-tooltip fixed z-50 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none"
      >
        <div class="font-bold">{{ tooltip.variable }}</div>
        <div class="text-xs opacity-90">{{ tooltip.description }}</div>
        <div v-if="tooltip.value" class="text-xs text-blue-300 mt-1">
          Wert: {{ tooltip.value }}
        </div>
        <!-- 小箭头 -->
        <div class="tooltip-arrow absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'
import { formatCurrency } from '@/utils/formatters'
import { MathFormulas } from '@/utils/mathFormulas'

interface Props {
  result: CalculationResult
  form: CalculatorForm
}

const props = defineProps<Props>()

// 工具提示状态
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  variable: '',
  description: '',
  value: ''
})

// 变量定义
const variableDefinitions = {
  'A': {
    name: 'Endkapital (A)',
    description: 'Das Geld, das Sie am Ende haben',
    value: formatCurrency(props.result.finalAmount || 0)
  },
  'P': {
    name: 'Startkapital (P)',
    description: 'Ihr anfängliches Investment',
    value: formatCurrency(props.form.principal)
  },
  'r': {
    name: 'Zinssatz (r)',
    description: 'Jährlicher Zinssatz als Dezimalzahl',
    value: `${props.form.annualRate}% = ${(props.form.annualRate / 100).toFixed(4)}`
  },
  'n': {
    name: 'Zinszahlungen (n)',
    description: 'Anzahl Zinszahlungen pro Jahr',
    value: '12 (monatlich)'
  },
  'nt': {
    name: 'Gesamtperioden (n×t)',
    description: 'Gesamtanzahl der Zinsperioden',
    value: `${12 * props.form.years} Monate`
  },
  'PMT': {
    name: 'Sparrate (PMT)',
    description: 'Monatliche Einzahlung',
    value: formatCurrency(props.form.monthlyPayment)
  }
}

// 当前公式描述
const currentFormulaDescription = computed(() => {
  if (props.form.monthlyPayment > 0) {
    return 'Zinseszins-Formel mit regelmäßigen Einzahlungen'
  }
  return 'Grundformel für Zinseszins'
})

// 计算步骤
const calculationSteps = computed(() => {
  return MathFormulas.generateCalculationSteps(
    props.form.principal,
    props.form.annualRate,
    props.form.years,
    props.form.monthlyPayment,
    12
  ).slice(0, 5) // 只显示前5步，避免过于复杂
})

// 方法
const showTooltip = (variable: string, event: MouseEvent) => {
  const def = variableDefinitions[variable as keyof typeof variableDefinitions]
  if (def) {
    tooltip.value = {
      show: true,
      x: event.clientX,
      y: event.clientY - 60,
      variable: def.name,
      description: def.description,
      value: def.value
    }
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}
</script>

<style scoped>
.variable-hover {
  @apply cursor-help px-1 py-0.5 rounded transition-colors;
  color: #2563eb;
  font-weight: 600;
}

.variable-hover:hover {
  @apply bg-blue-100;
}

.operator {
  @apply text-gray-600 mx-1;
}

.bracket {
  @apply text-gray-800 font-bold;
}

.number {
  @apply text-green-600 font-semibold;
}

.value {
  @apply text-blue-600 font-semibold;
}

.result-var {
  @apply text-purple-600 font-bold text-xl;
}

.exponent {
  font-size: 0.7em;
  vertical-align: super;
  @apply text-blue-600;
}

.fraction {
  @apply inline-flex flex-col items-center mx-1;
  font-size: 0.8em;
}

.fraction-line {
  @apply w-full h-px bg-gray-400 my-1;
}

.numerator,
.denominator {
  @apply text-center;
}

.complex-term {
  @apply text-orange-600 font-medium;
}

.step-number {
  flex-shrink: 0;
}

.step-formula {
  @apply text-gray-700;
}

.step-result {
  @apply font-medium;
}

.tooltip-arrow {
  filter: drop-shadow(0 -1px 1px rgba(0, 0, 0, 0.1));
}

.calculation-result {
  @apply border-t pt-3 mt-3;
}

.equals {
  @apply text-gray-500;
}

.final-result {
  @apply bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent;
}
</style>
