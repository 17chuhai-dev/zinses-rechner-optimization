<!--
  复利增长示例组件
  展示复利增长图表的完整功能和交互
-->

<template>
  <div class="compound-growth-example">
    <div class="example-header">
      <h1>Zinseszins-Wachstum Visualisierung</h1>
      <p>Erleben Sie die Macht des Zinseszinses durch interaktive Diagramme</p>
    </div>

    <!-- 快速开始区域 -->
    <div class="quick-start-section">
      <h2>Schnellstart-Szenarien</h2>
      <div class="scenario-cards">
        <div
          v-for="scenario in quickStartScenarios"
          :key="scenario.id"
          class="scenario-card"
          :class="{ 'active': selectedScenario === scenario.id }"
          @click="loadScenario(scenario.id)"
        >
          <div class="scenario-icon">
            <Icon :name="scenario.icon" size="lg" />
          </div>
          <h3>{{ scenario.name }}</h3>
          <p>{{ scenario.description }}</p>
          <div class="scenario-preview">
            <div class="preview-stat">
              <span class="stat-label">Start:</span>
              <span class="stat-value">{{ formatCurrency(scenario.initialAmount) }}</span>
            </div>
            <div class="preview-stat">
              <span class="stat-label">Monatlich:</span>
              <span class="stat-value">{{ formatCurrency(scenario.monthlyContribution) }}</span>
            </div>
            <div class="preview-stat">
              <span class="stat-label">Nach {{ scenario.years }}J:</span>
              <span class="stat-value highlight">{{ formatCurrency(calculateFinalValue(scenario)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 参数配置区域 -->
    <div class="parameters-section">
      <h2>Investitionsparameter</h2>
      <div class="parameters-grid">
        <div class="parameter-group">
          <label>Anfangsbetrag (€)</label>
          <input
            v-model.number="investmentParams.initialAmount"
            type="number"
            min="0"
            step="1000"
            class="parameter-input"
            @input="updateCalculations"
          />
        </div>

        <div class="parameter-group">
          <label>Monatliche Einzahlung (€)</label>
          <input
            v-model.number="investmentParams.monthlyContribution"
            type="number"
            min="0"
            step="50"
            class="parameter-input"
            @input="updateCalculations"
          />
        </div>

        <div class="parameter-group">
          <label>Jährlicher Zinssatz (%)</label>
          <input
            v-model.number="investmentParams.annualRate"
            type="number"
            min="0"
            max="20"
            step="0.1"
            class="parameter-input"
            @input="updateCalculations"
          />
        </div>

        <div class="parameter-group">
          <label>Anlagedauer (Jahre)</label>
          <input
            v-model.number="investmentParams.years"
            type="number"
            min="1"
            max="50"
            step="1"
            class="parameter-input"
            @input="updateCalculations"
          />
        </div>

        <div class="parameter-group">
          <label>Inflationsrate (%)</label>
          <input
            v-model.number="investmentParams.inflationRate"
            type="number"
            min="0"
            max="10"
            step="0.1"
            class="parameter-input"
            @input="updateCalculations"
          />
        </div>

        <div class="parameter-group">
          <label>Steuersatz (%)</label>
          <input
            v-model.number="investmentParams.taxRate"
            type="number"
            min="0"
            max="50"
            step="1"
            class="parameter-input"
            @input="updateCalculations"
          />
        </div>
      </div>
    </div>

    <!-- 复利增长图表 -->
    <div class="chart-section">
      <CompoundGrowthChart
        :data="chartData"
        :initial-amount="investmentParams.initialAmount"
        :monthly-contribution="investmentParams.monthlyContribution"
        :annual-rate="investmentParams.annualRate / 100"
        :years="investmentParams.years"
        :inflation-rate="investmentParams.inflationRate / 100"
        @data-point-click="handleDataPointClick"
        @chart-export="handleChartExport"
        @config-change="handleConfigChange"
      />
    </div>

    <!-- 关键指标展示 -->
    <div class="metrics-section">
      <h2>Wichtige Kennzahlen</h2>
      <div class="metrics-grid">
        <div class="metric-card primary">
          <div class="metric-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Endwert</div>
            <div class="metric-value">{{ formatCurrency(keyMetrics.finalValue) }}</div>
            <div class="metric-detail">Nach {{ investmentParams.years }} Jahren</div>
          </div>
        </div>

        <div class="metric-card success">
          <div class="metric-icon">
            <Icon name="zap" size="lg" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Zinseszins-Effekt</div>
            <div class="metric-value">{{ formatCurrency(keyMetrics.compoundInterest) }}</div>
            <div class="metric-detail">Zusätzlicher Gewinn</div>
          </div>
        </div>

        <div class="metric-card info">
          <div class="metric-icon">
            <Icon name="percent" size="lg" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Gesamtrendite</div>
            <div class="metric-value">{{ formatPercentage(keyMetrics.totalReturn) }}</div>
            <div class="metric-detail">ROI über Laufzeit</div>
          </div>
        </div>

        <div class="metric-card warning">
          <div class="metric-icon">
            <Icon name="calendar" size="lg" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Verdoppelungszeit</div>
            <div class="metric-value">{{ keyMetrics.doublingTime }} Jahre</div>
            <div class="metric-detail">72er-Regel</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 对比分析 -->
    <div class="comparison-section">
      <h2>Vergleichsanalyse</h2>
      <div class="comparison-tabs">
        <button
          v-for="tab in comparisonTabs"
          :key="tab.id"
          @click="activeComparisonTab = tab.id"
          class="tab-button"
          :class="{ 'active': activeComparisonTab === tab.id }"
        >
          <Icon :name="tab.icon" size="sm" />
          {{ tab.label }}
        </button>
      </div>

      <div class="comparison-content">
        <!-- 与ohne Zinseszins对比 -->
        <div v-if="activeComparisonTab === 'simple'" class="simple-comparison">
          <div class="comparison-chart">
            <div class="comparison-bars">
              <div class="bar-group">
                <div class="bar-label">Ohne Zinseszins</div>
                <div class="bar-container">
                  <div class="bar simple-bar" :style="{ height: `${(comparisonData.simpleInterest / comparisonData.compoundInterest) * 100}%` }">
                    <span class="bar-value">{{ formatCurrency(comparisonData.simpleInterest) }}</span>
                  </div>
                </div>
              </div>

              <div class="bar-group">
                <div class="bar-label">Mit Zinseszins</div>
                <div class="bar-container">
                  <div class="bar compound-bar" style="height: 100%">
                    <span class="bar-value">{{ formatCurrency(comparisonData.compoundInterest) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="comparison-insight">
              <div class="insight-icon">
                <Icon name="lightbulb" size="md" />
              </div>
              <div class="insight-content">
                <h4>Zinseszins-Vorteil</h4>
                <p>
                  Der Zinseszins-Effekt bringt Ihnen
                  <strong>{{ formatCurrency(comparisonData.advantage) }}</strong>
                  mehr Gewinn - das sind
                  <strong>{{ formatPercentage(comparisonData.advantagePercentage) }}</strong>
                  zusätzlich!
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 不同利率对比 -->
        <div v-if="activeComparisonTab === 'rates'" class="rates-comparison">
          <div class="rates-table">
            <div class="table-header">
              <span>Zinssatz</span>
              <span>Endwert</span>
              <span>Gewinn</span>
              <span>Unterschied</span>
            </div>
            <div
              v-for="(rate, index) in rateComparisons"
              :key="index"
              class="table-row"
              :class="{ 'current': rate.rate === investmentParams.annualRate }"
            >
              <span class="rate-value">{{ formatPercentage(rate.rate / 100) }}</span>
              <span class="final-value">{{ formatCurrency(rate.finalValue) }}</span>
              <span class="profit">{{ formatCurrency(rate.profit) }}</span>
              <span class="difference" :class="{ 'positive': rate.difference > 0, 'negative': rate.difference < 0 }">
                {{ rate.difference > 0 ? '+' : '' }}{{ formatCurrency(rate.difference) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 时间影响对比 -->
        <div v-if="activeComparisonTab === 'time'" class="time-comparison">
          <div class="time-chart">
            <div class="time-bars">
              <div
                v-for="(period, index) in timeComparisons"
                :key="index"
                class="time-bar-group"
              >
                <div class="time-label">{{ period.years }} Jahre</div>
                <div class="time-bar-container">
                  <div class="time-bar" :style="{ height: `${(period.value / maxTimeValue) * 100}%` }">
                    <span class="time-bar-value">{{ formatCurrency(period.value) }}</span>
                  </div>
                </div>
                <div class="time-growth">+{{ formatPercentage(period.growth) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 教育内容 */
    <div class="education-section">
      <h2>Zinseszins verstehen</h2>
      <div class="education-cards">
        <div class="education-card">
          <div class="education-icon">
            <Icon name="book-open" size="lg" />
          </div>
          <h3>Was ist Zinseszins?</h3>
          <p>
            Zinseszins bedeutet, dass Sie nicht nur auf Ihr ursprüngliches Kapital Zinsen erhalten,
            sondern auch auf die bereits erhaltenen Zinsen. Dieser Effekt verstärkt sich über die Zeit exponentiell.
          </p>
        </div>

        <div class="education-card">
          <div class="education-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <h3>Die 72er-Regel</h3>
          <p>
            Eine einfache Faustregel: Teilen Sie 72 durch den Zinssatz, um zu erfahren,
            in wie vielen Jahren sich Ihr Kapital verdoppelt. Bei 6% Zinsen dauert es etwa 12 Jahre.
          </p>
        </div>

        <div class="education-card">
          <div class="education-icon">
            <Icon name="clock" size="lg" />
          </div>
          <h3>Zeit ist entscheidend</h3>
          <p>
            Je früher Sie anfangen, desto stärker wirkt sich der Zinseszins aus.
            Schon wenige Jahre Unterschied können zu erheblichen Differenzen im Endkapital führen.
          </p>
        </div>

        <div class="education-card">
          <div class="education-icon">
            <Icon name="repeat" size="lg" />
          </div>
          <h3>Regelmäßige Einzahlungen</h3>
          <p>
            Regelmäßige monatliche Einzahlungen verstärken den Zinseszins-Effekt zusätzlich.
            Jede Einzahlung beginnt sofort, eigene Zinsen zu generieren.
          </p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="exportAnalysis" class="action-button primary">
        <Icon name="download" size="sm" />
        Analyse exportieren
      </button>
      <button @click="shareScenario" class="action-button secondary">
        <Icon name="share-2" size="sm" />
        Szenario teilen
      </button>
      <button @click="saveScenario" class="action-button secondary">
        <Icon name="bookmark" size="sm" />
        Szenario speichern
      </button>
      <button @click="resetToDefaults" class="action-button secondary">
        <Icon name="refresh-cw" size="sm" />
        Zurücksetzen
      </button>
    </div>

    <!-- 数据点详情模态框 -->
    <Transition name="modal-fade">
      <div v-if="selectedDataPoint" class="modal-overlay" @click="closeDataPointModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Jahr {{ selectedDataPoint.year }} - Details</h3>
            <button @click="closeDataPointModal" class="modal-close">
              <Icon name="x" size="md" />
            </button>
          </div>

          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Gesamtwert:</span>
                <span class="detail-value">{{ formatCurrency(selectedDataPoint.totalValue) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Einzahlungen:</span>
                <span class="detail-value">{{ formatCurrency(selectedDataPoint.contributions) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Zinserträge:</span>
                <span class="detail-value positive">{{ formatCurrency(selectedDataPoint.interest) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Jährliches Wachstum:</span>
                <span class="detail-value">{{ formatPercentage(selectedDataPoint.growthRate) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import CompoundGrowthChart from '@/components/charts/CompoundGrowthChart.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface InvestmentParams {
  initialAmount: number
  monthlyContribution: number
  annualRate: number
  years: number
  inflationRate: number
  taxRate: number
}

interface YearlyData {
  year: number
  totalValue: number
  contributions: number
  interest: number
  growthRate: number
  inflationAdjustedValue?: number
}

interface QuickStartScenario {
  id: string
  name: string
  description: string
  icon: string
  initialAmount: number
  monthlyContribution: number
  annualRate: number
  years: number
}

// 响应式数据
const selectedScenario = ref('')
const activeComparisonTab = ref('simple')
const selectedDataPoint = ref<YearlyData | null>(null)

const investmentParams = reactive<InvestmentParams>({
  initialAmount: 10000,
  monthlyContribution: 500,
  annualRate: 7,
  years: 20,
  inflationRate: 2,
  taxRate: 25
})

const chartData = ref<YearlyData[]>([])

// 快速开始场景
const quickStartScenarios: QuickStartScenario[] = [
  {
    id: 'student',
    name: 'Student',
    description: 'Früh anfangen mit kleinen Beträgen',
    icon: 'book-open',
    initialAmount: 1000,
    monthlyContribution: 100,
    annualRate: 6,
    years: 30
  },
  {
    id: 'professional',
    name: 'Berufstätig',
    description: 'Solide Altersvorsorge aufbauen',
    icon: 'briefcase',
    initialAmount: 10000,
    monthlyContribution: 500,
    annualRate: 7,
    years: 25
  },
  {
    id: 'family',
    name: 'Familie',
    description: 'Für die Zukunft der Kinder sparen',
    icon: 'users',
    initialAmount: 5000,
    monthlyContribution: 300,
    annualRate: 6,
    years: 18
  },
  {
    id: 'retirement',
    name: 'Vor Rente',
    description: 'Letzte Jahre vor dem Ruhestand',
    icon: 'home',
    initialAmount: 50000,
    monthlyContribution: 1000,
    annualRate: 5,
    years: 10
  }
]

// 对比标签
const comparisonTabs = [
  { id: 'simple', label: 'Einfache Zinsen', icon: 'minus' },
  { id: 'rates', label: 'Zinssätze', icon: 'percent' },
  { id: 'time', label: 'Zeiträume', icon: 'clock' }
]

// 计算属性
const keyMetrics = computed(() => {
  const totalContributions = investmentParams.initialAmount +
    (investmentParams.monthlyContribution * 12 * investmentParams.years)

  const finalValue = calculateCompoundInterest(
    investmentParams.initialAmount,
    investmentParams.monthlyContribution,
    investmentParams.annualRate / 100,
    investmentParams.years
  )

  const compoundInterest = finalValue - totalContributions
  const totalReturn = totalContributions > 0 ? (finalValue - totalContributions) / totalContributions : 0
  const doublingTime = investmentParams.annualRate > 0 ? Math.round(72 / investmentParams.annualRate) : 0

  return {
    finalValue,
    compoundInterest,
    totalReturn,
    doublingTime
  }
})

const comparisonData = computed(() => {
  const totalContributions = investmentParams.initialAmount +
    (investmentParams.monthlyContribution * 12 * investmentParams.years)

  const compoundInterest = keyMetrics.value.finalValue
  const simpleInterest = totalContributions +
    (investmentParams.initialAmount * investmentParams.annualRate / 100 * investmentParams.years) +
    (investmentParams.monthlyContribution * 12 * investmentParams.annualRate / 100 * investmentParams.years / 2)

  const advantage = compoundInterest - simpleInterest
  const advantagePercentage = simpleInterest > 0 ? advantage / simpleInterest : 0

  return {
    compoundInterest,
    simpleInterest,
    advantage,
    advantagePercentage
  }
})

const rateComparisons = computed(() => {
  const rates = [3, 5, 7, 9, 12]
  const currentFinalValue = keyMetrics.value.finalValue

  return rates.map(rate => {
    const finalValue = calculateCompoundInterest(
      investmentParams.initialAmount,
      investmentParams.monthlyContribution,
      rate / 100,
      investmentParams.years
    )
    const totalContributions = investmentParams.initialAmount +
      (investmentParams.monthlyContribution * 12 * investmentParams.years)
    const profit = finalValue - totalContributions
    const difference = finalValue - currentFinalValue

    return {
      rate,
      finalValue,
      profit,
      difference
    }
  })
})

const timeComparisons = computed(() => {
  const periods = [5, 10, 15, 20, 25, 30]

  return periods.map(years => {
    const value = calculateCompoundInterest(
      investmentParams.initialAmount,
      investmentParams.monthlyContribution,
      investmentParams.annualRate / 100,
      years
    )
    const totalContributions = investmentParams.initialAmount +
      (investmentParams.monthlyContribution * 12 * years)
    const growth = totalContributions > 0 ? (value - totalContributions) / totalContributions : 0

    return {
      years,
      value,
      growth
    }
  })
})

const maxTimeValue = computed(() => {
  return Math.max(...timeComparisons.value.map(t => t.value))
})

// 方法
const calculateCompoundInterest = (
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number => {
  const monthlyRate = annualRate / 12
  const totalMonths = years * 12

  // 初始投资的复利增长
  const principalGrowth = principal * Math.pow(1 + annualRate, years)

  // 月度投资的复利增长
  const monthlyGrowth = monthlyContribution *
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)

  return principalGrowth + monthlyGrowth
}

const calculateFinalValue = (scenario: QuickStartScenario): number => {
  return calculateCompoundInterest(
    scenario.initialAmount,
    scenario.monthlyContribution,
    scenario.annualRate / 100,
    scenario.years
  )
}

const generateChartData = (): YearlyData[] => {
  const data: YearlyData[] = []
  let currentValue = investmentParams.initialAmount
  let totalContributions = investmentParams.initialAmount

  for (let year = 1; year <= investmentParams.years; year++) {
    // 年度利息
    const yearlyInterest = currentValue * (investmentParams.annualRate / 100)

    // 月度投资
    const yearlyContributions = investmentParams.monthlyContribution * 12
    totalContributions += yearlyContributions

    // 新的总值
    currentValue = currentValue + yearlyInterest + yearlyContributions

    // 通胀调整值
    const inflationAdjustedValue = currentValue / Math.pow(1 + investmentParams.inflationRate / 100, year)

    // 增长率
    const growthRate = year === 1
      ? (currentValue - investmentParams.initialAmount) / investmentParams.initialAmount
      : (currentValue - data[year - 2].totalValue) / data[year - 2].totalValue

    data.push({
      year,
      totalValue: currentValue,
      contributions: totalContributions,
      interest: currentValue - totalContributions,
      growthRate,
      inflationAdjustedValue
    })
  }

  return data
}

const updateCalculations = () => {
  chartData.value = generateChartData()
}

const loadScenario = (scenarioId: string) => {
  selectedScenario.value = scenarioId
  const scenario = quickStartScenarios.find(s => s.id === scenarioId)
  if (scenario) {
    Object.assign(investmentParams, {
      initialAmount: scenario.initialAmount,
      monthlyContribution: scenario.monthlyContribution,
      annualRate: scenario.annualRate,
      years: scenario.years
    })
    updateCalculations()
  }
}

const handleDataPointClick = (dataPoint: YearlyData) => {
  selectedDataPoint.value = dataPoint
}

const closeDataPointModal = () => {
  selectedDataPoint.value = null
}

const handleChartExport = (format: string) => {
  console.log('Chart exported as:', format)
}

const handleConfigChange = (config: any) => {
  console.log('Chart config changed:', config)
}

const exportAnalysis = () => {
  const data = {
    parameters: investmentParams,
    metrics: keyMetrics.value,
    chartData: chartData.value,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'zinseszins-analyse.json'
  a.click()
  URL.revokeObjectURL(url)
}

const shareScenario = () => {
  const shareText = `Zinseszins-Szenario:
Startkapital: ${formatCurrency(investmentParams.initialAmount)}
Monatlich: ${formatCurrency(investmentParams.monthlyContribution)}
Zinssatz: ${formatPercentage(investmentParams.annualRate / 100)}
Endwert nach ${investmentParams.years} Jahren: ${formatCurrency(keyMetrics.value.finalValue)}`

  if (navigator.share) {
    navigator.share({
      title: 'Zinseszins-Szenario',
      text: shareText
    })
  } else {
    navigator.clipboard.writeText(shareText)
    alert('Szenario in die Zwischenablage kopiert!')
  }
}

const saveScenario = () => {
  // 保存场景的逻辑
  console.log('Saving scenario...')
}

const resetToDefaults = () => {
  selectedScenario.value = ''
  Object.assign(investmentParams, {
    initialAmount: 10000,
    monthlyContribution: 500,
    annualRate: 7,
    years: 20,
    inflationRate: 2,
    taxRate: 25
  })
  updateCalculations()
}

// 生命周期
onMounted(() => {
  updateCalculations()
})
</script>

<style scoped>
.compound-growth-example {
  @apply max-w-7xl mx-auto p-6 space-y-8;
}

.example-header {
  @apply text-center mb-8;
}

.example-header h1 {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.example-header p {
  @apply text-lg text-gray-600;
}

/* 快速开始区域 */
.quick-start-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.quick-start-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.scenario-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.scenario-card {
  @apply p-4 border border-gray-200 rounded-lg cursor-pointer;
  @apply hover:border-blue-300 hover:shadow-md transition-all;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.scenario-card.active {
  @apply border-blue-500 bg-blue-50 shadow-md;
}

.scenario-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3;
}

.scenario-card.active .scenario-icon {
  @apply bg-blue-200 text-blue-700;
}

.scenario-card h3 {
  @apply font-semibold text-gray-900 mb-2;
}

.scenario-card p {
  @apply text-sm text-gray-600 mb-4;
}

.scenario-preview {
  @apply space-y-2;
}

.preview-stat {
  @apply flex justify-between text-xs;
}

.stat-label {
  @apply text-gray-500;
}

.stat-value {
  @apply font-medium text-gray-700;
}

.stat-value.highlight {
  @apply font-bold text-blue-600;
}

/* 参数配置区域 */
.parameters-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.parameters-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.parameters-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.parameter-group {
  @apply space-y-2;
}

.parameter-group label {
  @apply block text-sm font-medium text-gray-700;
}

.parameter-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* 图表区域 */
.chart-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

/* 关键指标 */
.metrics-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.metrics-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.metric-card {
  @apply flex items-center gap-4 p-4 rounded-lg border;
}

.metric-card.primary {
  @apply bg-blue-50 border-blue-200;
}

.metric-card.success {
  @apply bg-green-50 border-green-200;
}

.metric-card.info {
  @apply bg-gray-50 border-gray-200;
}

.metric-card.warning {
  @apply bg-yellow-50 border-yellow-200;
}

.metric-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center;
}

.metric-card.primary .metric-icon {
  @apply bg-blue-100 text-blue-600;
}

.metric-card.success .metric-icon {
  @apply bg-green-100 text-green-600;
}

.metric-card.info .metric-icon {
  @apply bg-gray-100 text-gray-600;
}

.metric-card.warning .metric-icon {
  @apply bg-yellow-100 text-yellow-600;
}

.metric-content {
  @apply flex-1;
}

.metric-label {
  @apply text-sm text-gray-600;
}

.metric-value {
  @apply text-lg font-bold text-gray-900;
}

.metric-detail {
  @apply text-xs text-gray-500;
}

/* 对比分析区域 */
.comparison-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.comparison-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.comparison-tabs {
  @apply flex gap-2 mb-6 border-b border-gray-200;
}

.tab-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium;
  @apply text-gray-600 hover:text-gray-900 border-b-2 border-transparent;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors;
}

.tab-button.active {
  @apply text-blue-600 border-blue-600;
}

.comparison-content {
  @apply space-y-6;
}

/* 简单对比 */
.simple-comparison {
  @apply space-y-6;
}

.comparison-chart {
  @apply space-y-6;
}

.comparison-bars {
  @apply flex items-end justify-center gap-8 h-64;
}

.bar-group {
  @apply flex flex-col items-center gap-2;
}

.bar-label {
  @apply text-sm font-medium text-gray-700 mb-2;
}

.bar-container {
  @apply relative w-20 h-48 bg-gray-200 rounded-t-lg overflow-hidden;
}

.bar {
  @apply absolute bottom-0 w-full rounded-t-lg flex items-end justify-center pb-2;
  @apply transition-all duration-500;
}

.simple-bar {
  @apply bg-gradient-to-t from-gray-400 to-gray-500;
}

.compound-bar {
  @apply bg-gradient-to-t from-blue-400 to-blue-500;
}

.bar-value {
  @apply text-xs font-semibold text-white transform rotate-90 whitespace-nowrap;
}

.comparison-insight {
  @apply flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg;
}

.insight-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.insight-content h4 {
  @apply font-semibold text-blue-900 mb-2;
}

.insight-content p {
  @apply text-sm text-blue-800;
}

/* 利率对比 */
.rates-comparison {
  @apply space-y-4;
}

.rates-table {
  @apply space-y-2;
}

.table-header {
  @apply grid grid-cols-4 gap-4 py-3 px-4 bg-gray-100 rounded-lg font-semibold text-gray-700;
}

.table-row {
  @apply grid grid-cols-4 gap-4 py-3 px-4 bg-gray-50 rounded-lg;
  @apply hover:bg-gray-100 transition-colors;
}

.table-row.current {
  @apply bg-blue-50 border border-blue-200;
}

.rate-value {
  @apply font-medium text-gray-900;
}

.final-value,
.profit {
  @apply text-sm text-gray-700;
}

.difference {
  @apply text-sm font-semibold;
}

.difference.positive {
  @apply text-green-600;
}

.difference.negative {
  @apply text-red-600;
}

/* 时间对比 */
.time-comparison {
  @apply space-y-4;
}

.time-chart {
  @apply p-4 bg-gray-50 rounded-lg;
}

.time-bars {
  @apply flex items-end justify-center gap-4 h-48;
}

.time-bar-group {
  @apply flex flex-col items-center gap-2;
}

.time-label {
  @apply text-xs font-medium text-gray-700 mb-2;
}

.time-bar-container {
  @apply relative w-12 h-32 bg-gray-200 rounded-t overflow-hidden;
}

.time-bar {
  @apply absolute bottom-0 w-full bg-gradient-to-t from-green-400 to-green-500 rounded-t;
  @apply transition-all duration-500;
}

.time-bar-value {
  @apply text-xs font-semibold text-white transform rotate-90 whitespace-nowrap;
  @apply absolute bottom-2 left-1/2 transform -translate-x-1/2;
}

.time-growth {
  @apply text-xs text-green-600 font-semibold mt-1;
}

/* 教育内容 */
.education-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.education-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.education-cards {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.education-card {
  @apply p-6 bg-gray-50 rounded-lg border border-gray-200;
}

.education-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4;
}

.education-card h3 {
  @apply font-semibold text-gray-900 mb-3;
}

.education-card p {
  @apply text-sm text-gray-600 leading-relaxed;
}

/* 操作按钮 */
.action-buttons {
  @apply flex flex-wrap gap-4 justify-center;
}

.action-button {
  @apply flex items-center gap-2 px-6 py-3 rounded-md font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply transition-colors;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.action-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 模态框 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.modal-header h3 {
  @apply text-lg font-semibold text-gray-900;
}

.modal-close {
  @apply p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.modal-body {
  @apply p-6;
}

.detail-grid {
  @apply space-y-3;
}

.detail-item {
  @apply flex justify-between items-center py-2 border-b border-gray-100;
}

.detail-label {
  @apply text-sm text-gray-600;
}

.detail-value {
  @apply font-semibold text-gray-900;
}

.detail-value.positive {
  @apply text-green-600;
}

/* 过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  @apply transition-opacity duration-300;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  @apply opacity-0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .scenario-cards {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .parameters-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .metrics-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .education-cards {
    @apply grid-cols-1;
  }

  .comparison-bars {
    @apply gap-4;
  }

  .bar-container {
    @apply w-16 h-32;
  }

  .time-bars {
    @apply gap-2;
  }

  .time-bar-container {
    @apply w-10 h-24;
  }
}

@media (max-width: 768px) {
  .compound-growth-example {
    @apply p-4;
  }

  .scenario-cards {
    @apply grid-cols-1;
  }

  .parameters-grid {
    @apply grid-cols-1;
  }

  .metrics-grid {
    @apply grid-cols-1;
  }

  .metric-card {
    @apply flex-col text-center;
  }

  .metric-icon {
    @apply mb-3;
  }

  .comparison-tabs {
    @apply flex-wrap;
  }

  .comparison-bars {
    @apply gap-2;
  }

  .bar-container {
    @apply w-12 h-24;
  }

  .table-header,
  .table-row {
    @apply grid-cols-2 gap-2;
  }

  .time-bars {
    @apply flex-wrap justify-center;
  }

  .time-bar-container {
    @apply w-8 h-16;
  }

  .action-buttons {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }

  .modal-content {
    @apply mx-2;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .compound-growth-example {
    @apply bg-gray-900;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .quick-start-section,
  .parameters-section,
  .chart-section,
  .metrics-section,
  .comparison-section,
  .education-section {
    @apply bg-gray-800 border-gray-700;
  }

  .quick-start-section h2,
  .parameters-section h2,
  .metrics-section h2,
  .comparison-section h2,
  .education-section h2 {
    @apply text-gray-100;
  }

  .scenario-card {
    @apply bg-gray-700 border-gray-600;
  }

  .scenario-card.active {
    @apply bg-blue-900 border-blue-600;
  }

  .scenario-card h3 {
    @apply text-gray-100;
  }

  .scenario-card p {
    @apply text-gray-300;
  }

  .stat-label {
    @apply text-gray-400;
  }

  .stat-value {
    @apply text-gray-300;
  }

  .parameter-group label {
    @apply text-gray-300;
  }

  .parameter-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .metric-card {
    @apply bg-gray-700 border-gray-600;
  }

  .metric-label {
    @apply text-gray-300;
  }

  .metric-value {
    @apply text-gray-100;
  }

  .metric-detail {
    @apply text-gray-400;
  }

  .tab-button {
    @apply text-gray-300 hover:text-gray-100;
  }

  .tab-button.active {
    @apply text-blue-300 border-blue-300;
  }

  .comparison-tabs {
    @apply border-gray-600;
  }

  .bar-label,
  .time-label {
    @apply text-gray-300;
  }

  .comparison-insight {
    @apply bg-blue-900 border-blue-700;
  }

  .insight-content h4 {
    @apply text-blue-100;
  }

  .insight-content p {
    @apply text-blue-200;
  }

  .table-header {
    @apply bg-gray-700 text-gray-300;
  }

  .table-row {
    @apply bg-gray-700 hover:bg-gray-600;
  }

  .table-row.current {
    @apply bg-blue-900 border-blue-700;
  }

  .rate-value {
    @apply text-gray-100;
  }

  .final-value,
  .profit {
    @apply text-gray-300;
  }

  .time-chart {
    @apply bg-gray-700;
  }

  .education-card {
    @apply bg-gray-700 border-gray-600;
  }

  .education-card h3 {
    @apply text-gray-100;
  }

  .education-card p {
    @apply text-gray-300;
  }

  .modal-content {
    @apply bg-gray-800;
  }

  .modal-header {
    @apply border-gray-700;
  }

  .modal-header h3 {
    @apply text-gray-100;
  }

  .modal-close {
    @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
  }

  .detail-item {
    @apply border-gray-700;
  }

  .detail-label {
    @apply text-gray-300;
  }

  .detail-value {
    @apply text-gray-100;
  }
}

/* 打印样式 */
@media print {
  .compound-growth-example {
    @apply shadow-none;
  }

  .action-buttons {
    @apply hidden;
  }

  .comparison-tabs {
    @apply hidden;
  }

  .modal-overlay {
    @apply hidden;
  }
}
</style>
