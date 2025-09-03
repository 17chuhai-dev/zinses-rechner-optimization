<!--
  通胀影响分析引擎组件
  专业的通胀影响计算和分析系统，包括实际购买力、通胀保护策略等
-->

<template>
  <div class="inflation-analysis-engine">
    <!-- 通胀分析头部 -->
    <div class="engine-header">
      <h3 class="engine-title">
        <Icon name="trending-down" size="lg" />
        Inflationsanalyse
      </h3>
      <div class="inflation-indicator">
        <div class="current-inflation">
          <span class="inflation-label">Aktuelle Inflation:</span>
          <span class="inflation-rate" :class="getInflationClass(currentInflationRate)">
            {{ formatPercentage(currentInflationRate) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 通胀配置面板 -->
    <div class="inflation-config-panel">
      <h4>Inflationseinstellungen</h4>
      <div class="config-grid">
        <div class="config-group">
          <label>Erwartete Inflationsrate (%)</label>
          <input
            v-model.number="inflationConfig.expectedRate"
            type="number"
            min="0"
            max="20"
            step="0.1"
            class="config-input"
            @input="updateInflationAnalysis"
          />
          <div class="input-help">Durchschnittliche jährliche Inflation</div>
        </div>

        <div class="config-group">
          <label>Inflationsszenario</label>
          <select v-model="inflationConfig.scenario" @change="updateInflationAnalysis" class="config-select">
            <option value="low">Niedrig (1-2%)</option>
            <option value="moderate">Moderat (2-4%)</option>
            <option value="high">Hoch (4-6%)</option>
            <option value="extreme">Extrem (6%+)</option>
            <option value="custom">Benutzerdefiniert</option>
          </select>
        </div>

        <div class="config-group">
          <label>Inflationsvariabilität</label>
          <select v-model="inflationConfig.variability" @change="updateInflationAnalysis" class="config-select">
            <option value="stable">Stabil</option>
            <option value="moderate">Moderat schwankend</option>
            <option value="volatile">Stark schwankend</option>
          </select>
        </div>

        <div class="config-group">
          <label>Referenzjahr</label>
          <select v-model="inflationConfig.baseYear" @change="updateInflationAnalysis" class="config-select">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 购买力分析 -->
    <div class="purchasing-power-analysis">
      <h4>Kaufkraftanalyse</h4>
      <div class="power-comparison">
        <div class="comparison-card nominal">
          <div class="card-icon">
            <Icon name="euro" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Nominaler Wert</div>
            <div class="card-value">{{ formatCurrency(purchasingPowerData.nominalValue) }}</div>
            <div class="card-detail">Ohne Inflationsbereinigung</div>
          </div>
        </div>

        <div class="comparison-card real">
          <div class="card-icon">
            <Icon name="shopping-cart" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Realer Wert</div>
            <div class="card-value">{{ formatCurrency(purchasingPowerData.realValue) }}</div>
            <div class="card-detail">Inflationsbereinigt ({{ inflationConfig.baseYear }})</div>
          </div>
        </div>

        <div class="comparison-card loss">
          <div class="card-icon">
            <Icon name="trending-down" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Kaufkraftverlust</div>
            <div class="card-value negative">{{ formatCurrency(purchasingPowerData.purchasingPowerLoss) }}</div>
            <div class="card-detail">{{ formatPercentage(purchasingPowerData.lossPercentage) }} Verlust</div>
          </div>
        </div>

        <div class="comparison-card protection">
          <div class="card-icon">
            <Icon name="shield" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Benötigte Rendite</div>
            <div class="card-value">{{ formatPercentage(purchasingPowerData.requiredReturn) }}</div>
            <div class="card-detail">Zum Inflationsausgleich</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通胀影响时间线 -->
    <div class="inflation-timeline">
      <h4>Inflationsentwicklung über Zeit</h4>
      <div class="timeline-chart">
        <div class="chart-controls">
          <div class="time-range-selector">
            <button
              v-for="range in timeRanges"
              :key="range.value"
              @click="selectedTimeRange = range.value"
              class="range-button"
              :class="{ 'active': selectedTimeRange === range.value }"
            >
              {{ range.label }}
            </button>
          </div>
        </div>

        <div class="timeline-data">
          <div class="timeline-header">
            <span>Jahr</span>
            <span>Nominaler Wert</span>
            <span>Inflationsrate</span>
            <span>Realer Wert</span>
            <span>Kaufkraftverlust</span>
          </div>

          <div
            v-for="(data, index) in filteredTimelineData"
            :key="data.year"
            class="timeline-row"
            :class="{ 'highlighted': highlightedYear === data.year }"
            @mouseenter="highlightedYear = data.year"
            @mouseleave="highlightedYear = null"
          >
            <span class="year-cell">{{ data.year }}</span>
            <span class="value-cell nominal">{{ formatCurrency(data.nominalValue) }}</span>
            <span class="rate-cell" :class="getInflationClass(data.inflationRate)">
              {{ formatPercentage(data.inflationRate) }}
            </span>
            <span class="value-cell real">{{ formatCurrency(data.realValue) }}</span>
            <span class="loss-cell">{{ formatPercentage(data.cumulativeLoss) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 通胀保护策略 -->
    <div class="inflation-protection-strategies">
      <h4>Inflationsschutz-Strategien</h4>
      <div class="strategies-grid">
        <div
          v-for="(strategy, index) in inflationProtectionStrategies"
          :key="index"
          class="strategy-card"
          :class="strategy.effectiveness"
        >
          <div class="strategy-header">
            <div class="strategy-icon">
              <Icon :name="strategy.icon" size="md" />
            </div>
            <div class="strategy-title">{{ strategy.title }}</div>
            <div class="effectiveness-badge" :class="strategy.effectiveness">
              {{ getEffectivenessLabel(strategy.effectiveness) }}
            </div>
          </div>

          <div class="strategy-content">
            <p>{{ strategy.description }}</p>

            <div class="strategy-metrics">
              <div class="metric">
                <span class="metric-label">Inflationsschutz:</span>
                <div class="protection-bar">
                  <div class="protection-fill" :style="{ width: `${strategy.protectionLevel}%` }"></div>
                </div>
                <span class="protection-text">{{ strategy.protectionLevel }}%</span>
              </div>

              <div class="metric">
                <span class="metric-label">Risiko:</span>
                <div class="risk-indicator">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="risk-dot"
                    :class="{ 'active': i <= strategy.riskLevel }"
                  ></div>
                </div>
                <span class="risk-text">{{ getRiskLabel(strategy.riskLevel) }}</span>
              </div>

              <div class="metric">
                <span class="metric-label">Liquidität:</span>
                <span class="liquidity-text" :class="getLiquidityClass(strategy.liquidity)">
                  {{ strategy.liquidity }}
                </span>
              </div>
            </div>

            <div class="strategy-examples">
              <h6>Beispiele:</h6>
              <ul>
                <li v-for="(example, exampleIndex) in strategy.examples" :key="exampleIndex">
                  {{ example }}
                </li>
              </ul>
            </div>
          </div>

          <div class="strategy-actions">
            <button @click="applyStrategy(strategy)" class="apply-strategy-button">
              <Icon name="check" size="sm" />
              Strategie anwenden
            </button>
            <button @click="learnMoreStrategy(strategy)" class="learn-more-button">
              <Icon name="info" size="sm" />
              Mehr erfahren
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 通胀敏感性分析 -->
    <div class="inflation-sensitivity-analysis">
      <h4>Sensitivitätsanalyse</h4>
      <div class="sensitivity-matrix">
        <div class="matrix-header">
          <span>Inflationsrate</span>
          <span>Realer Wert (10 Jahre)</span>
          <span>Realer Wert (20 Jahre)</span>
          <span>Realer Wert (30 Jahre)</span>
          <span>Benötigte Rendite</span>
        </div>

        <div
          v-for="(scenario, index) in sensitivityScenarios"
          :key="index"
          class="matrix-row"
          :class="{ 'current': scenario.rate === inflationConfig.expectedRate }"
        >
          <span class="rate-cell" :class="getInflationClass(scenario.rate)">
            {{ formatPercentage(scenario.rate) }}
          </span>
          <span class="value-cell">{{ formatCurrency(scenario.realValue10) }}</span>
          <span class="value-cell">{{ formatCurrency(scenario.realValue20) }}</span>
          <span class="value-cell">{{ formatCurrency(scenario.realValue30) }}</span>
          <span class="return-cell">{{ formatPercentage(scenario.requiredReturn) }}</span>
        </div>
      </div>
    </div>

    <!-- 历史通胀数据 -->
    <div class="historical-inflation-data">
      <h4>Historische Inflationsdaten (Deutschland)</h4>
      <div class="historical-overview">
        <div class="overview-stats">
          <div class="stat-card">
            <div class="stat-icon">
              <Icon name="bar-chart" size="md" />
            </div>
            <div class="stat-content">
              <div class="stat-label">Durchschnitt (10 Jahre)</div>
              <div class="stat-value">{{ formatPercentage(historicalData.average10Years) }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <Icon name="trending-up" size="md" />
            </div>
            <div class="stat-content">
              <div class="stat-label">Höchstwert</div>
              <div class="stat-value">{{ formatPercentage(historicalData.maximum) }}</div>
              <div class="stat-detail">{{ historicalData.maximumYear }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <Icon name="trending-down" size="md" />
            </div>
            <div class="stat-content">
              <div class="stat-label">Tiefstwert</div>
              <div class="stat-value">{{ formatPercentage(historicalData.minimum) }}</div>
              <div class="stat-detail">{{ historicalData.minimumYear }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <Icon name="activity" size="md" />
            </div>
            <div class="stat-content">
              <div class="stat-label">Volatilität</div>
              <div class="stat-value">{{ formatPercentage(historicalData.volatility) }}</div>
              <div class="stat-detail">Standardabweichung</div>
            </div>
          </div>
        </div>

        <div class="historical-periods">
          <h6>Besondere Perioden:</h6>
          <div class="periods-list">
            <div
              v-for="(period, index) in historicalData.specialPeriods"
              :key="index"
              class="period-item"
              :class="period.type"
            >
              <div class="period-years">{{ period.years }}</div>
              <div class="period-description">{{ period.description }}</div>
              <div class="period-rate">{{ formatPercentage(period.averageRate) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通胀预测模型 -->
    <div class="inflation-forecast-models">
      <h4>Inflationsprognose-Modelle</h4>
      <div class="forecast-tabs">
        <button
          v-for="model in forecastModels"
          :key="model.id"
          @click="selectedForecastModel = model.id"
          class="forecast-tab"
          :class="{ 'active': selectedForecastModel === model.id }"
        >
          <Icon :name="model.icon" size="sm" />
          {{ model.name }}
        </button>
      </div>

      <div class="forecast-content">
        <div
          v-for="model in forecastModels"
          :key="model.id"
          v-show="selectedForecastModel === model.id"
          class="forecast-model"
        >
          <div class="model-description">
            <p>{{ model.description }}</p>
            <div class="model-accuracy">
              <span class="accuracy-label">Genauigkeit:</span>
              <div class="accuracy-bar">
                <div class="accuracy-fill" :style="{ width: `${model.accuracy}%` }"></div>
              </div>
              <span class="accuracy-text">{{ model.accuracy }}%</span>
            </div>
          </div>

          <div class="model-predictions">
            <div class="prediction-timeline">
              <div
                v-for="(prediction, index) in model.predictions"
                :key="index"
                class="prediction-item"
              >
                <div class="prediction-period">{{ prediction.period }}</div>
                <div class="prediction-range">
                  <span class="range-low">{{ formatPercentage(prediction.low) }}</span>
                  <span class="range-separator">-</span>
                  <span class="range-high">{{ formatPercentage(prediction.high) }}</span>
                </div>
                <div class="prediction-confidence">
                  {{ prediction.confidence }}% Konfidenz
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 接口定义
interface InflationConfig {
  expectedRate: number
  scenario: 'low' | 'moderate' | 'high' | 'extreme' | 'custom'
  variability: 'stable' | 'moderate' | 'volatile'
  baseYear: number
}

interface PurchasingPowerData {
  nominalValue: number
  realValue: number
  purchasingPowerLoss: number
  lossPercentage: number
  requiredReturn: number
}

interface TimelineData {
  year: number
  nominalValue: number
  inflationRate: number
  realValue: number
  cumulativeLoss: number
}

interface InflationProtectionStrategy {
  id: string
  title: string
  description: string
  icon: string
  effectiveness: 'high' | 'medium' | 'low'
  protectionLevel: number
  riskLevel: number
  liquidity: 'Hoch' | 'Mittel' | 'Niedrig'
  examples: string[]
}

interface SensitivityScenario {
  rate: number
  realValue10: number
  realValue20: number
  realValue30: number
  requiredReturn: number
}

interface HistoricalData {
  average10Years: number
  maximum: number
  maximumYear: number
  minimum: number
  minimumYear: number
  volatility: number
  specialPeriods: {
    years: string
    description: string
    averageRate: number
    type: 'high' | 'low' | 'crisis'
  }[]
}

interface ForecastModel {
  id: string
  name: string
  icon: string
  description: string
  accuracy: number
  predictions: {
    period: string
    low: number
    high: number
    confidence: number
  }[]
}

// Props定义
interface Props {
  investmentData: {
    initialAmount: number
    finalAmount: number
    investmentYears: number
    yearlyContributions?: number
  }
}

const props = defineProps<Props>()

// Emits定义
interface Emits {
  'strategy-applied': [strategy: InflationProtectionStrategy]
  'config-changed': [config: InflationConfig]
  'analysis-updated': [data: PurchasingPowerData]
}

const emit = defineEmits<Emits>()

// 响应式数据
const currentInflationRate = ref(0.032) // 3.2% 当前德国通胀率
const highlightedYear = ref<number | null>(null)
const selectedTimeRange = ref(20)
const selectedForecastModel = ref('ecb')

const inflationConfig = ref<InflationConfig>({
  expectedRate: 2.5,
  scenario: 'moderate',
  variability: 'moderate',
  baseYear: new Date().getFullYear()
})

const purchasingPowerData = ref<PurchasingPowerData>({
  nominalValue: 0,
  realValue: 0,
  purchasingPowerLoss: 0,
  lossPercentage: 0,
  requiredReturn: 0
})

const timelineData = ref<TimelineData[]>([])
const inflationProtectionStrategies = ref<InflationProtectionStrategy[]>([])
const sensitivityScenarios = ref<SensitivityScenario[]>([])

// 时间范围选项
const timeRanges = [
  { value: 10, label: '10 Jahre' },
  { value: 20, label: '20 Jahre' },
  { value: 30, label: '30 Jahre' },
  { value: 50, label: '50 Jahre' }
]

// 可用年份
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 5; i <= currentYear; i++) {
    years.push(i)
  }
  return years
})

// 历史数据
const historicalData = ref<HistoricalData>({
  average10Years: 0.018,
  maximum: 0.074,
  maximumYear: 1981,
  minimum: -0.021,
  minimumYear: 2009,
  volatility: 0.015,
  specialPeriods: [
    {
      years: '1970-1980',
      description: 'Ölkrise und hohe Inflation',
      averageRate: 0.055,
      type: 'high'
    },
    {
      years: '2008-2009',
      description: 'Finanzkrise und Deflation',
      averageRate: -0.005,
      type: 'crisis'
    },
    {
      years: '2010-2019',
      description: 'Niedrige Inflation nach Finanzkrise',
      averageRate: 0.012,
      type: 'low'
    },
    {
      years: '2020-2023',
      description: 'COVID-19 und Energiekrise',
      averageRate: 0.045,
      type: 'high'
    }
  ]
})

// 预测模型
const forecastModels = ref<ForecastModel[]>([
  {
    id: 'ecb',
    name: 'EZB-Prognose',
    icon: 'bank',
    description: 'Offizielle Inflationsprognose der Europäischen Zentralbank basierend auf makroökonomischen Modellen.',
    accuracy: 75,
    predictions: [
      { period: '2024', low: 0.020, high: 0.030, confidence: 80 },
      { period: '2025', low: 0.018, high: 0.025, confidence: 70 },
      { period: '2026-2030', low: 0.015, high: 0.025, confidence: 60 }
    ]
  },
  {
    id: 'market',
    name: 'Markterwartungen',
    icon: 'trending-up',
    description: 'Inflationserwartungen basierend auf Marktinstrumenten wie inflationsindexierten Anleihen.',
    accuracy: 68,
    predictions: [
      { period: '2024', low: 0.025, high: 0.035, confidence: 75 },
      { period: '2025', low: 0.020, high: 0.030, confidence: 65 },
      { period: '2026-2030', low: 0.020, high: 0.030, confidence: 55 }
    ]
  },
  {
    id: 'consensus',
    name: 'Konsensus-Prognose',
    icon: 'users',
    description: 'Durchschnitt der Prognosen führender Wirtschaftsinstitute und Banken.',
    accuracy: 72,
    predictions: [
      { period: '2024', low: 0.022, high: 0.032, confidence: 78 },
      { period: '2025', low: 0.019, high: 0.027, confidence: 68 },
      { period: '2026-2030', low: 0.018, high: 0.028, confidence: 58 }
    ]
  }
])

// 计算属性
const filteredTimelineData = computed(() => {
  return timelineData.value.filter(data =>
    data.year <= inflationConfig.value.baseYear + selectedTimeRange.value
  )
})

// 方法
const calculatePurchasingPower = () => {
  const { initialAmount, finalAmount, investmentYears } = props.investmentData
  const inflationRate = inflationConfig.value.expectedRate / 100

  const nominalValue = finalAmount || initialAmount
  const realValue = nominalValue / Math.pow(1 + inflationRate, investmentYears)
  const purchasingPowerLoss = nominalValue - realValue
  const lossPercentage = purchasingPowerLoss / nominalValue
  const requiredReturn = inflationRate

  purchasingPowerData.value = {
    nominalValue,
    realValue,
    purchasingPowerLoss,
    lossPercentage,
    requiredReturn
  }
}

const generateTimelineData = () => {
  const data: TimelineData[] = []
  const { initialAmount, investmentYears } = props.investmentData
  const baseInflationRate = inflationConfig.value.expectedRate / 100

  let nominalValue = initialAmount
  let cumulativeInflation = 1

  for (let i = 0; i <= investmentYears; i++) {
    const year = inflationConfig.value.baseYear + i
    const inflationRate = generateInflationRate(baseInflationRate, i)

    if (i > 0) {
      cumulativeInflation *= (1 + inflationRate)
    }

    const realValue = nominalValue / cumulativeInflation
    const cumulativeLoss = 1 - (realValue / nominalValue)

    data.push({
      year,
      nominalValue,
      inflationRate,
      realValue,
      cumulativeLoss
    })

    // 假设名义价值每年增长（简化模型）
    nominalValue *= 1.05
  }

  timelineData.value = data
}

const generateInflationRate = (baseRate: number, year: number): number => {
  const variability = inflationConfig.value.variability
  let variation = 0

  switch (variability) {
    case 'stable':
      variation = (Math.random() - 0.5) * 0.005 // ±0.25%
      break
    case 'moderate':
      variation = (Math.random() - 0.5) * 0.02 // ±1%
      break
    case 'volatile':
      variation = (Math.random() - 0.5) * 0.04 // ±2%
      break
  }

  return Math.max(0, baseRate + variation)
}

const generateInflationProtectionStrategies = () => {
  const strategies: InflationProtectionStrategy[] = [
    {
      id: 'real-estate',
      title: 'Immobilien',
      description: 'Direktinvestitionen in Immobilien oder REITs bieten natürlichen Inflationsschutz durch steigende Mieten und Immobilienwerte.',
      icon: 'home',
      effectiveness: 'high',
      protectionLevel: 85,
      riskLevel: 3,
      liquidity: 'Niedrig',
      examples: [
        'Eigengenutzte Immobilien',
        'Vermietete Immobilien',
        'REITs (Real Estate Investment Trusts)',
        'Immobilienfonds'
      ]
    },
    {
      id: 'commodities',
      title: 'Rohstoffe',
      description: 'Rohstoffe wie Gold, Öl und Agrarprodukte steigen oft mit der Inflation, da sie Grundkomponenten der Preisindizes sind.',
      icon: 'zap',
      effectiveness: 'high',
      protectionLevel: 80,
      riskLevel: 4,
      liquidity: 'Mittel',
      examples: [
        'Gold und Edelmetalle',
        'Rohstoff-ETFs',
        'Energie-Rohstoffe',
        'Agrar-Rohstoffe'
      ]
    },
    {
      id: 'inflation-bonds',
      title: 'Inflationsindexierte Anleihen',
      description: 'Staatsanleihen, deren Kapital und Zinsen an die Inflation gekoppelt sind, bieten direkten Inflationsschutz.',
      icon: 'shield',
      effectiveness: 'high',
      protectionLevel: 95,
      riskLevel: 1,
      liquidity: 'Hoch',
      examples: [
        'Deutsche Inflationsindexierte Bundesanleihen',
        'TIPS (Treasury Inflation-Protected Securities)',
        'Inflationsindexierte ETFs',
        'Europäische inflationsindexierte Anleihen'
      ]
    },
    {
      id: 'stocks',
      title: 'Aktien',
      description: 'Qualitätsaktien können langfristig Inflationsschutz bieten, da Unternehmen Preise anpassen können.',
      icon: 'trending-up',
      effectiveness: 'medium',
      protectionLevel: 70,
      riskLevel: 4,
      liquidity: 'Hoch',
      examples: [
        'Dividendenstarke Aktien',
        'Versorger und Infrastruktur',
        'Konsumgüter-Unternehmen',
        'Technologie-Aktien'
      ]
    },
    {
      id: 'floating-rate',
      title: 'Variable Zinsen',
      description: 'Anleihen und Kredite mit variablen Zinsen passen sich automatisch an steigende Zinsen an.',
      icon: 'refresh-cw',
      effectiveness: 'medium',
      protectionLevel: 60,
      riskLevel: 2,
      liquidity: 'Hoch',
      examples: [
        'Floating Rate Notes',
        'Variable Sparbriefe',
        'Geldmarktfonds',
        'Kurzlaufende Anleihen'
      ]
    },
    {
      id: 'foreign-currency',
      title: 'Fremdwährungen',
      description: 'Investitionen in stabile Fremdwährungen können vor heimischer Inflation schützen.',
      icon: 'globe',
      effectiveness: 'low',
      protectionLevel: 40,
      riskLevel: 5,
      liquidity: 'Hoch',
      examples: [
        'US-Dollar Anlagen',
        'Schweizer Franken',
        'Währungs-ETFs',
        'Internationale Diversifikation'
      ]
    }
  ]

  inflationProtectionStrategies.value = strategies
}

const generateSensitivityScenarios = () => {
  const scenarios: SensitivityScenario[] = []
  const baseAmount = props.investmentData.finalAmount || 100000

  const inflationRates = [0.01, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06]

  inflationRates.forEach(rate => {
    const realValue10 = baseAmount / Math.pow(1 + rate, 10)
    const realValue20 = baseAmount / Math.pow(1 + rate, 20)
    const realValue30 = baseAmount / Math.pow(1 + rate, 30)
    const requiredReturn = rate

    scenarios.push({
      rate,
      realValue10,
      realValue20,
      realValue30,
      requiredReturn
    })
  })

  sensitivityScenarios.value = scenarios
}

const getInflationClass = (rate: number): string => {
  if (rate <= 0.02) return 'low'
  if (rate <= 0.04) return 'moderate'
  if (rate <= 0.06) return 'high'
  return 'extreme'
}

const getEffectivenessLabel = (effectiveness: string): string => {
  switch (effectiveness) {
    case 'high': return 'Hoch'
    case 'medium': return 'Mittel'
    case 'low': return 'Niedrig'
    default: return 'Unbekannt'
  }
}

const getRiskLabel = (riskLevel: number): string => {
  if (riskLevel <= 2) return 'Niedrig'
  if (riskLevel <= 3) return 'Mittel'
  return 'Hoch'
}

const getLiquidityClass = (liquidity: string): string => {
  switch (liquidity) {
    case 'Hoch': return 'high-liquidity'
    case 'Mittel': return 'medium-liquidity'
    case 'Niedrig': return 'low-liquidity'
    default: return ''
  }
}

const updateInflationAnalysis = () => {
  calculatePurchasingPower()
  generateTimelineData()
  generateSensitivityScenarios()
  emit('config-changed', inflationConfig.value)
  emit('analysis-updated', purchasingPowerData.value)
}

const applyStrategy = (strategy: InflationProtectionStrategy) => {
  emit('strategy-applied', strategy)
}

const learnMoreStrategy = (strategy: InflationProtectionStrategy) => {
  console.log('Learn more about strategy:', strategy.title)
}

// 监听器
watch(() => props.investmentData, () => {
  updateInflationAnalysis()
}, { deep: true })

watch(() => inflationConfig.value.scenario, (newScenario) => {
  switch (newScenario) {
    case 'low':
      inflationConfig.value.expectedRate = 1.5
      break
    case 'moderate':
      inflationConfig.value.expectedRate = 2.5
      break
    case 'high':
      inflationConfig.value.expectedRate = 5.0
      break
    case 'extreme':
      inflationConfig.value.expectedRate = 8.0
      break
  }
  if (newScenario !== 'custom') {
    updateInflationAnalysis()
  }
})

// 生命周期
onMounted(() => {
  generateInflationProtectionStrategies()
  updateInflationAnalysis()
})
</script>

<style scoped>
.inflation-analysis-engine {
  @apply space-y-8;
}

/* 引擎头部 */
.engine-header {
  @apply flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200;
}

.engine-title {
  @apply flex items-center gap-3 text-xl font-bold text-gray-800;
}

.inflation-indicator {
  @apply flex items-center gap-4;
}

.current-inflation {
  @apply flex items-center gap-2;
}

.inflation-label {
  @apply text-sm font-medium text-gray-700;
}

.inflation-rate {
  @apply px-3 py-1 rounded-full text-sm font-bold;
}

.inflation-rate.low {
  @apply bg-green-100 text-green-800;
}

.inflation-rate.moderate {
  @apply bg-yellow-100 text-yellow-800;
}

.inflation-rate.high {
  @apply bg-orange-100 text-orange-800;
}

.inflation-rate.extreme {
  @apply bg-red-100 text-red-800;
}

/* 通胀配置面板 */
.inflation-config-panel {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.inflation-config-panel h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.config-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.config-group {
  @apply space-y-2;
}

.config-group label {
  @apply block text-sm font-medium text-gray-700;
}

.config-input,
.config-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent;
}

.input-help {
  @apply text-xs text-gray-500;
}

/* 购买力分析 */
.purchasing-power-analysis {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.purchasing-power-analysis h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.power-comparison {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.comparison-card {
  @apply flex items-center gap-4 p-4 rounded-lg border;
}

.comparison-card.nominal {
  @apply bg-blue-50 border-blue-200;
}

.comparison-card.real {
  @apply bg-green-50 border-green-200;
}

.comparison-card.loss {
  @apply bg-red-50 border-red-200;
}

.comparison-card.protection {
  @apply bg-purple-50 border-purple-200;
}

.card-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center;
}

.comparison-card.nominal .card-icon {
  @apply bg-blue-100 text-blue-600;
}

.comparison-card.real .card-icon {
  @apply bg-green-100 text-green-600;
}

.comparison-card.loss .card-icon {
  @apply bg-red-100 text-red-600;
}

.comparison-card.protection .card-icon {
  @apply bg-purple-100 text-purple-600;
}

.card-content {
  @apply flex-1;
}

.card-label {
  @apply text-sm text-gray-600;
}

.card-value {
  @apply text-lg font-bold text-gray-900;
}

.card-value.negative {
  @apply text-red-600;
}

.card-detail {
  @apply text-xs text-gray-500;
}

/* 通胀时间线 */
.inflation-timeline {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.inflation-timeline h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.timeline-chart {
  @apply space-y-4;
}

.chart-controls {
  @apply flex justify-center;
}

.time-range-selector {
  @apply flex gap-2 p-1 bg-gray-100 rounded-lg;
}

.range-button {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors;
  @apply text-gray-600 hover:text-gray-900 hover:bg-white;
  @apply focus:outline-none focus:ring-2 focus:ring-orange-500;
}

.range-button.active {
  @apply bg-white text-orange-600 shadow-sm;
}

.timeline-data {
  @apply overflow-x-auto;
}

.timeline-header {
  @apply grid grid-cols-5 gap-4 p-3 bg-gray-100 rounded-t-lg text-sm font-semibold text-gray-700;
}

.timeline-row {
  @apply grid grid-cols-5 gap-4 p-3 border-b border-gray-200 text-sm;
  @apply hover:bg-gray-50 transition-colors;
}

.timeline-row.highlighted {
  @apply bg-orange-50;
}

.year-cell {
  @apply font-semibold text-gray-900;
}

.value-cell {
  @apply text-right font-mono;
}

.value-cell.nominal {
  @apply text-blue-600;
}

.value-cell.real {
  @apply text-green-600;
}

.rate-cell {
  @apply text-center font-mono font-semibold;
}

.rate-cell.low {
  @apply text-green-600;
}

.rate-cell.moderate {
  @apply text-yellow-600;
}

.rate-cell.high {
  @apply text-orange-600;
}

.rate-cell.extreme {
  @apply text-red-600;
}

.loss-cell {
  @apply text-right font-mono text-red-600;
}

/* 通胀保护策略 */
.inflation-protection-strategies {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.inflation-protection-strategies h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.strategies-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6;
}

.strategy-card {
  @apply border rounded-lg p-6 hover:shadow-lg transition-shadow;
}

.strategy-card.high {
  @apply border-green-300 bg-green-50;
}

.strategy-card.medium {
  @apply border-yellow-300 bg-yellow-50;
}

.strategy-card.low {
  @apply border-red-300 bg-red-50;
}

.strategy-header {
  @apply flex items-center justify-between mb-4;
}

.strategy-icon {
  @apply w-12 h-12 bg-white rounded-full flex items-center justify-center;
}

.strategy-card.high .strategy-icon {
  @apply bg-green-100 text-green-600;
}

.strategy-card.medium .strategy-icon {
  @apply bg-yellow-100 text-yellow-600;
}

.strategy-card.low .strategy-icon {
  @apply bg-red-100 text-red-600;
}

.strategy-title {
  @apply flex-1 font-semibold text-gray-900 mx-3;
}

.effectiveness-badge {
  @apply px-2 py-1 text-xs font-semibold rounded-full;
}

.effectiveness-badge.high {
  @apply bg-green-100 text-green-800;
}

.effectiveness-badge.medium {
  @apply bg-yellow-100 text-yellow-800;
}

.effectiveness-badge.low {
  @apply bg-red-100 text-red-800;
}

.strategy-content p {
  @apply text-sm text-gray-600 mb-4;
}

.strategy-metrics {
  @apply space-y-3 mb-4;
}

.metric {
  @apply flex items-center gap-3;
}

.metric-label {
  @apply text-sm text-gray-600 min-w-0 flex-shrink-0;
}

.protection-bar {
  @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.protection-fill {
  @apply h-full bg-green-500 transition-all duration-300;
}

.protection-text {
  @apply text-sm font-semibold text-green-600;
}

.risk-indicator {
  @apply flex gap-1;
}

.risk-dot {
  @apply w-2 h-2 bg-gray-300 rounded-full;
}

.risk-dot.active {
  @apply bg-red-500;
}

.risk-text {
  @apply text-sm text-gray-600;
}

.liquidity-text {
  @apply text-sm font-semibold;
}

.liquidity-text.high-liquidity {
  @apply text-green-600;
}

.liquidity-text.medium-liquidity {
  @apply text-yellow-600;
}

.liquidity-text.low-liquidity {
  @apply text-red-600;
}

.strategy-examples h6 {
  @apply font-semibold text-gray-800 mb-2;
}

.strategy-examples ul {
  @apply list-disc list-inside space-y-1 text-sm text-gray-600 mb-4;
}

.strategy-actions {
  @apply flex gap-2;
}

.apply-strategy-button {
  @apply flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md;
  @apply hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500;
}

.learn-more-button {
  @apply flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500;
}

/* 敏感性分析 */
.inflation-sensitivity-analysis {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.inflation-sensitivity-analysis h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.sensitivity-matrix {
  @apply overflow-x-auto;
}

.matrix-header {
  @apply grid grid-cols-5 gap-4 p-3 bg-gray-100 rounded-t-lg text-sm font-semibold text-gray-700;
}

.matrix-row {
  @apply grid grid-cols-5 gap-4 p-3 border-b border-gray-200 text-sm;
  @apply hover:bg-gray-50 transition-colors;
}

.matrix-row.current {
  @apply bg-orange-50 border-orange-200;
}

.return-cell {
  @apply text-right font-mono text-orange-600 font-semibold;
}

/* 历史数据 */
.historical-inflation-data {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.historical-inflation-data h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.historical-overview {
  @apply space-y-6;
}

.overview-stats {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
  @apply flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200;
}

.stat-icon {
  @apply w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.stat-content {
  @apply flex-1;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply text-lg font-bold text-gray-900;
}

.stat-detail {
  @apply text-xs text-gray-500;
}

.historical-periods h6 {
  @apply font-semibold text-gray-800 mb-4;
}

.periods-list {
  @apply space-y-3;
}

.period-item {
  @apply flex items-center justify-between p-3 rounded-lg border;
}

.period-item.high {
  @apply bg-red-50 border-red-200;
}

.period-item.low {
  @apply bg-green-50 border-green-200;
}

.period-item.crisis {
  @apply bg-yellow-50 border-yellow-200;
}

.period-years {
  @apply font-semibold text-gray-900;
}

.period-description {
  @apply flex-1 text-sm text-gray-600 mx-4;
}

.period-rate {
  @apply font-mono font-semibold;
}

.period-item.high .period-rate {
  @apply text-red-600;
}

.period-item.low .period-rate {
  @apply text-green-600;
}

.period-item.crisis .period-rate {
  @apply text-yellow-600;
}

/* 预测模型 */
.inflation-forecast-models {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.inflation-forecast-models h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.forecast-tabs {
  @apply flex gap-2 mb-6 border-b border-gray-200;
}

.forecast-tab {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium;
  @apply text-gray-600 hover:text-gray-900 border-b-2 border-transparent;
  @apply focus:outline-none focus:ring-2 focus:ring-orange-500;
  @apply transition-colors;
}

.forecast-tab.active {
  @apply text-orange-600 border-orange-600;
}

.forecast-content {
  @apply space-y-6;
}

.forecast-model {
  @apply space-y-4;
}

.model-description p {
  @apply text-gray-700 mb-4;
}

.model-accuracy {
  @apply flex items-center gap-3;
}

.accuracy-label {
  @apply text-sm text-gray-600;
}

.accuracy-bar {
  @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.accuracy-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.accuracy-text {
  @apply text-sm font-semibold text-blue-600;
}

.model-predictions {
  @apply space-y-4;
}

.prediction-timeline {
  @apply space-y-3;
}

.prediction-item {
  @apply flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200;
}

.prediction-period {
  @apply font-semibold text-gray-900;
}

.prediction-range {
  @apply flex items-center gap-2 font-mono;
}

.range-low {
  @apply text-green-600;
}

.range-separator {
  @apply text-gray-400;
}

.range-high {
  @apply text-red-600;
}

.prediction-confidence {
  @apply text-sm text-gray-600;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .config-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .power-comparison {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .strategies-grid {
    @apply grid-cols-1 lg:grid-cols-2;
  }

  .overview-stats {
    @apply grid-cols-1 md:grid-cols-2;
  }
}

@media (max-width: 768px) {
  .engine-header {
    @apply flex-col items-start gap-4;
  }

  .inflation-indicator {
    @apply self-end;
  }

  .config-grid {
    @apply grid-cols-1;
  }

  .power-comparison {
    @apply grid-cols-1;
  }

  .comparison-card {
    @apply flex-col text-center;
  }

  .card-icon {
    @apply mb-3;
  }

  .time-range-selector {
    @apply flex-wrap;
  }

  .timeline-header,
  .timeline-row {
    @apply grid-cols-3 gap-2 text-xs;
  }

  .timeline-header span:nth-child(n+4),
  .timeline-row span:nth-child(n+4) {
    @apply hidden;
  }

  .strategies-grid {
    @apply grid-cols-1;
  }

  .strategy-header {
    @apply flex-col items-start gap-2;
  }

  .effectiveness-badge {
    @apply self-end;
  }

  .strategy-actions {
    @apply flex-col gap-2;
  }

  .apply-strategy-button,
  .learn-more-button {
    @apply w-full;
  }

  .matrix-header,
  .matrix-row {
    @apply grid-cols-3 gap-2 text-xs;
  }

  .matrix-header span:nth-child(n+4),
  .matrix-row span:nth-child(n+4) {
    @apply hidden;
  }

  .overview-stats {
    @apply grid-cols-1;
  }

  .stat-card {
    @apply flex-col text-center;
  }

  .stat-icon {
    @apply mb-3;
  }

  .period-item {
    @apply flex-col items-start gap-2;
  }

  .period-description {
    @apply mx-0;
  }

  .forecast-tabs {
    @apply flex-wrap;
  }

  .prediction-item {
    @apply flex-col items-start gap-2;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .inflation-analysis-engine {
    @apply bg-gray-900;
  }

  .engine-header {
    @apply bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600;
  }

  .engine-title {
    @apply text-gray-100;
  }

  .inflation-label {
    @apply text-gray-300;
  }

  .inflation-config-panel,
  .purchasing-power-analysis,
  .inflation-timeline,
  .inflation-protection-strategies,
  .inflation-sensitivity-analysis,
  .historical-inflation-data,
  .inflation-forecast-models {
    @apply bg-gray-800 border-gray-700;
  }

  .inflation-config-panel h4,
  .purchasing-power-analysis h4,
  .inflation-timeline h4,
  .inflation-protection-strategies h4,
  .inflation-sensitivity-analysis h4,
  .historical-inflation-data h4,
  .inflation-forecast-models h4 {
    @apply text-gray-100;
  }

  .config-group label {
    @apply text-gray-300;
  }

  .config-input,
  .config-select {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .input-help {
    @apply text-gray-400;
  }

  .comparison-card {
    @apply bg-gray-700 border-gray-600;
  }

  .card-label {
    @apply text-gray-300;
  }

  .card-value {
    @apply text-gray-100;
  }

  .card-detail {
    @apply text-gray-400;
  }

  .time-range-selector {
    @apply bg-gray-700;
  }

  .range-button {
    @apply text-gray-400 hover:text-gray-200 hover:bg-gray-600;
  }

  .range-button.active {
    @apply bg-gray-600 text-orange-400;
  }

  .timeline-header {
    @apply bg-gray-700 text-gray-300;
  }

  .timeline-row {
    @apply border-gray-700 hover:bg-gray-700;
  }

  .timeline-row.highlighted {
    @apply bg-orange-900;
  }

  .year-cell {
    @apply text-gray-200;
  }

  .strategy-card {
    @apply bg-gray-700 border-gray-600;
  }

  .strategy-title {
    @apply text-gray-100;
  }

  .strategy-content p {
    @apply text-gray-300;
  }

  .strategy-examples h6 {
    @apply text-gray-200;
  }

  .strategy-examples ul {
    @apply text-gray-300;
  }

  .matrix-header {
    @apply bg-gray-700 text-gray-300;
  }

  .matrix-row {
    @apply border-gray-700 hover:bg-gray-700;
  }

  .matrix-row.current {
    @apply bg-orange-900 border-orange-700;
  }

  .stat-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
  }

  .stat-label {
    @apply text-gray-300;
  }

  .stat-value {
    @apply text-gray-100;
  }

  .stat-detail {
    @apply text-gray-400;
  }

  .historical-periods h6 {
    @apply text-gray-200;
  }

  .period-item {
    @apply bg-gray-700 border-gray-600;
  }

  .period-years {
    @apply text-gray-200;
  }

  .period-description {
    @apply text-gray-300;
  }

  .forecast-tab {
    @apply text-gray-400 hover:text-gray-200;
  }

  .forecast-tab.active {
    @apply text-orange-400 border-orange-400;
  }

  .model-description p {
    @apply text-gray-300;
  }

  .accuracy-label {
    @apply text-gray-300;
  }

  .accuracy-text {
    @apply text-blue-400;
  }

  .prediction-item {
    @apply bg-gray-700 border-gray-600;
  }

  .prediction-period {
    @apply text-gray-200;
  }

  .prediction-confidence {
    @apply text-gray-300;
  }
}
</style>
