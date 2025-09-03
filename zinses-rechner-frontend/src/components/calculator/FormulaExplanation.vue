<template>
  <div class="formula-explanation bg-white rounded-lg shadow-lg p-6 mt-6">
    <!-- 标题和切换按钮 -->
    <div class="formula-header">
      <button
        @click="toggleExpanded"
        class="flex items-center justify-between w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <div class="flex items-center">
          <span class="text-2xl mr-3">🧮</span>
          <div class="text-left">
            <h3 class="text-lg font-bold text-blue-900">
              Zinseszins-Formel verstehen
            </h3>
            <p class="text-sm text-blue-700">
              Wie wird Ihr Endkapital berechnet?
            </p>
          </div>
        </div>
        <ChevronDownIcon
          :class="['w-6 h-6 text-blue-600 transition-transform duration-300', { 'rotate-180': isExpanded }]"
        />
      </button>
    </div>

    <!-- 可折叠内容 -->
    <Transition name="slide-down">
      <div v-show="isExpanded" class="formula-content mt-4">

        <!-- 基础公式 -->
        <div class="basic-formula mb-6">
          <h4 class="text-md font-semibold text-gray-900 mb-3">
            📐 Die Grundformel
          </h4>

          <div class="formula-display bg-gray-50 p-4 rounded-lg mb-4">
            <div class="text-center">
              <div class="formula-main text-2xl font-mono mb-2">
                A = P × (1 + r)<sup>t</sup>
              </div>
              <div class="text-sm text-gray-600">
                Grundformel für Zinseszins ohne regelmäßige Einzahlungen
              </div>
            </div>
          </div>

          <!-- 变量解释 -->
          <div class="variables-explanation">
            <h5 class="font-medium text-gray-800 mb-3">Variablen-Erklärung:</h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="variable in basicVariables"
                :key="variable.symbol"
                class="variable-item flex items-center p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                @mouseenter="highlightVariable(variable.symbol)"
                @mouseleave="clearHighlight"
              >
                <span
                  :class="['variable-symbol font-mono text-lg font-bold mr-3 px-2 py-1 rounded',
                    highlightedVariable === variable.symbol ? 'bg-yellow-200' : 'bg-gray-100']"
                >
                  {{ variable.symbol }}
                </span>
                <div>
                  <div class="font-medium text-gray-900">{{ variable.name }}</div>
                  <div class="text-sm text-gray-600">{{ variable.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 扩展公式（月复利） -->
        <div class="extended-formula mb-6">
          <h4 class="text-md font-semibold text-gray-900 mb-3">
            📊 Erweiterte Formel (Monatliche Verzinsung)
          </h4>

          <div class="formula-display bg-blue-50 p-4 rounded-lg mb-4">
            <div class="text-center">
              <div class="formula-main text-xl font-mono mb-2">
                A = P × (1 + r/n)<sup>n×t</sup>
              </div>
              <div class="text-sm text-blue-700">
                Formel für häufigere Zinszahlungen (z.B. monatlich)
              </div>
            </div>
          </div>

          <!-- 扩展变量 -->
          <div class="extended-variables">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="variable in extendedVariables"
                :key="variable.symbol"
                class="variable-item flex items-center p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
              >
                <span class="variable-symbol font-mono text-lg font-bold mr-3 px-2 py-1 rounded bg-blue-100">
                  {{ variable.symbol }}
                </span>
                <div>
                  <div class="font-medium text-gray-900">{{ variable.name }}</div>
                  <div class="text-sm text-gray-600">{{ variable.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 定期投入公式 -->
        <div v-if="form.monthlyPayment > 0" class="payment-formula mb-6">
          <h4 class="text-md font-semibold text-gray-900 mb-3">
            💰 Formel mit regelmäßigen Einzahlungen
          </h4>

          <div class="formula-display bg-green-50 p-4 rounded-lg mb-4">
            <div class="text-center">
              <div class="formula-main text-lg font-mono mb-2">
                A = P × (1 + r/n)<sup>n×t</sup> + PMT × [((1 + r/n)<sup>n×t</sup> - 1) / (r/n)]
              </div>
              <div class="text-sm text-green-700">
                Komplette Formel mit Startkapital und monatlichen Sparraten
              </div>
            </div>
          </div>

          <div class="payment-explanation bg-green-50 p-3 rounded-lg">
            <div class="text-sm text-green-800">
              <strong>PMT</strong> = Monatliche Sparrate ({{ formatCurrency(form.monthlyPayment) }})
            </div>
          </div>
        </div>

        <!-- 实际计算示例 -->
        <div class="calculation-example mb-6">
          <h4 class="text-md font-semibold text-gray-900 mb-3">
            🔢 Ihre Berechnung Schritt für Schritt
          </h4>

          <div class="example-steps space-y-3">
            <div
              v-for="(step, index) in calculationSteps"
              :key="index"
              class="step-item p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500"
            >
              <div class="flex items-start">
                <span class="step-number bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">
                  {{ index + 1 }}
                </span>
                <div class="flex-1">
                  <div class="font-medium text-gray-900 mb-1">{{ step.title }}</div>
                  <div class="text-sm text-gray-700 mb-2">{{ step.description }}</div>
                  <div class="formula-step font-mono text-sm bg-white p-2 rounded border">
                    {{ step.formula }}
                  </div>
                  <div v-if="step.result" class="result text-sm font-medium text-blue-600 mt-2">
                    = {{ step.result }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 公式对比 -->
        <div class="formula-comparison mb-6">
          <h4 class="text-md font-semibold text-gray-900 mb-3">
            ⚖️ Einfache vs. Zinseszinsen
          </h4>

          <div class="comparison-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="simple-interest bg-red-50 p-4 rounded-lg border border-red-200">
              <h5 class="font-medium text-red-800 mb-2">Einfache Zinsen</h5>
              <div class="formula-small font-mono text-sm mb-2">A = P + (P × r × t)</div>
              <div class="text-sm text-red-700">
                Zinsen werden nur auf das Startkapital berechnet
              </div>
              <div class="result-simple text-lg font-bold text-red-800 mt-2">
                {{ formatCurrency(simpleInterestResult) }}
              </div>
            </div>

            <div class="compound-interest bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 class="font-medium text-green-800 mb-2">Zinseszinsen</h5>
              <div class="formula-small font-mono text-sm mb-2">A = P × (1 + r)<sup>t</sup></div>
              <div class="text-sm text-green-700">
                Zinsen werden auf Kapital + bereits erhaltene Zinsen berechnet
              </div>
              <div class="result-compound text-lg font-bold text-green-800 mt-2">
                {{ formatCurrency(result.finalAmount || 0) }}
              </div>
            </div>
          </div>

          <div class="advantage bg-yellow-50 p-3 rounded-lg mt-3 border border-yellow-200">
            <div class="text-sm text-yellow-800">
              <strong>Zinseszins-Vorteil:</strong>
              {{ formatCurrency((result.finalAmount || 0) - simpleInterestResult) }} mehr Ertrag!
            </div>
          </div>
        </div>

        <!-- 交互式公式演示 -->
        <InteractiveFormula :result="result" :form="form" />

        <!-- 重要提示 -->
        <div class="important-notes bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
          <h5 class="font-medium text-blue-800 mb-2">📝 Wichtige Hinweise</h5>
          <ul class="text-sm text-blue-700 space-y-1">
            <li>• Diese Formeln gehen von konstanten Zinssätzen aus</li>
            <li>• Steuern und Gebühren sind nicht berücksichtigt</li>
            <li>• Reale Zinssätze können schwanken</li>
            <li>• Inflation reduziert die Kaufkraft des Endkapitals</li>
          </ul>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'
import { formatCurrency } from '@/utils/formatters'
import InteractiveFormula from './InteractiveFormula.vue'

interface Props {
  result: CalculationResult
  form: CalculatorForm
}

const props = defineProps<Props>()

// 状态管理
const isExpanded = ref(false)
const highlightedVariable = ref<string | null>(null)

// 基础变量定义
const basicVariables = [
  {
    symbol: 'A',
    name: 'Endkapital',
    description: 'Das Geld, das Sie am Ende haben'
  },
  {
    symbol: 'P',
    name: 'Startkapital',
    description: `Ihr anfängliches Investment (${formatCurrency(props.form.principal)})`
  },
  {
    symbol: 'r',
    name: 'Zinssatz',
    description: `Jährlicher Zinssatz (${props.form.annualRate}%)`
  },
  {
    symbol: 't',
    name: 'Zeit',
    description: `Anlagedauer in Jahren (${props.form.years} Jahre)`
  }
]

// 扩展变量定义
const extendedVariables = [
  {
    symbol: 'n',
    name: 'Zinszahlungen pro Jahr',
    description: 'Wie oft pro Jahr Zinsen gutgeschrieben werden (12 = monatlich)'
  },
  {
    symbol: 'r/n',
    name: 'Periodenzinssatz',
    description: `${(props.form.annualRate / 12).toFixed(3)}% pro Monat`
  },
  {
    symbol: 'n×t',
    name: 'Gesamtperioden',
    description: `${12 * props.form.years} Monate insgesamt`
  }
]

// 计算步骤
const calculationSteps = computed(() => {
  const steps = []
  const monthlyRate = props.form.annualRate / 100 / 12
  const totalMonths = props.form.years * 12

  // 步骤1：参数设置
  steps.push({
    title: 'Parameter einsetzen',
    description: 'Ihre Eingabewerte in die Formel einsetzen',
    formula: `P = ${formatCurrency(props.form.principal)}, r = ${props.form.annualRate}%, t = ${props.form.years} Jahre, n = 12`,
    result: null
  })

  // 步骤2：月利率计算
  steps.push({
    title: 'Monatlichen Zinssatz berechnen',
    description: 'Jahresrate durch 12 Monate teilen',
    formula: `r/n = ${props.form.annualRate}% ÷ 12 = ${(monthlyRate * 100).toFixed(3)}%`,
    result: `${(monthlyRate * 100).toFixed(3)}% pro Monat`
  })

  // 步骤3：总期数
  steps.push({
    title: 'Gesamtanzahl der Perioden',
    description: 'Anzahl Jahre mal 12 Monate',
    formula: `n × t = 12 × ${props.form.years} = ${totalMonths}`,
    result: `${totalMonths} Monate`
  })

  // 步骤4：复利因子
  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths)
  steps.push({
    title: 'Zinseszins-Faktor berechnen',
    description: 'Der Multiplikator für das Startkapital',
    formula: `(1 + r/n)^(n×t) = (1 + ${(monthlyRate * 100).toFixed(3)}%)^${totalMonths}`,
    result: compoundFactor.toFixed(4)
  })

  // 步骤5：最终计算
  if (props.form.monthlyPayment > 0) {
    steps.push({
      title: 'Endkapital mit Sparraten',
      description: 'Startkapital-Wachstum plus Sparraten-Wachstum',
      formula: `A = ${formatCurrency(props.form.principal)} × ${compoundFactor.toFixed(2)} + Sparraten-Anteil`,
      result: formatCurrency(props.result.finalAmount || 0)
    })
  } else {
    const finalAmount = props.form.principal * compoundFactor
    steps.push({
      title: 'Endkapital berechnen',
      description: 'Startkapital mal Zinseszins-Faktor',
      formula: `A = ${formatCurrency(props.form.principal)} × ${compoundFactor.toFixed(4)}`,
      result: formatCurrency(finalAmount)
    })
  }

  return steps
})

// 简单利息对比
const simpleInterestResult = computed(() => {
  const simpleInterest = props.form.principal * (props.form.annualRate / 100) * props.form.years
  const totalContributions = props.form.principal + (props.form.monthlyPayment * 12 * props.form.years)
  return totalContributions + simpleInterest
})

// 方法
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const highlightVariable = (symbol: string) => {
  highlightedVariable.value = symbol
}

const clearHighlight = () => {
  highlightedVariable.value = null
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.formula-main {
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.formula-small {
  font-family: 'Courier New', monospace;
}

.variable-symbol {
  transition: all 0.2s ease;
}

.step-number {
  flex-shrink: 0;
}

.formula-step {
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

sup {
  font-size: 0.7em;
  vertical-align: super;
}

.comparison-grid > div {
  transition: transform 0.2s ease;
}

.comparison-grid > div:hover {
  transform: translateY(-2px);
}
</style>
