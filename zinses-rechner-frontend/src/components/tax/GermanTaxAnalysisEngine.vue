<!--
  德国税务分析引擎组件
  专业的德国税务计算和分析系统，包括资本利得税、教会税等
-->

<template>
  <div class="german-tax-analysis-engine">
    <!-- 税务分析头部 -->
    <div class="engine-header">
      <h3 class="engine-title">
        <Icon name="calculator" size="lg" />
        Deutsche Steueranalyse
      </h3>
      <div class="tax-year-selector">
        <label>Steuerjahr:</label>
        <select v-model="selectedTaxYear" @change="updateTaxCalculations" class="tax-year-select">
          <option v-for="year in availableTaxYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
    </div>

    <!-- 税务配置面板 -->
    <div class="tax-config-panel">
      <h4>Steuerliche Einstellungen</h4>
      <div class="config-grid">
        <div class="config-group">
          <label>Bundesland</label>
          <select v-model="taxConfig.state" @change="updateTaxCalculations" class="config-select">
            <option v-for="state in germanStates" :key="state.code" :value="state.code">
              {{ state.name }}
            </option>
          </select>
        </div>

        <div class="config-group">
          <label>Kirchensteuerpflichtig</label>
          <div class="checkbox-group">
            <input
              v-model="taxConfig.churchTaxLiable"
              type="checkbox"
              id="churchTax"
              @change="updateTaxCalculations"
            />
            <label for="churchTax">Ja, ich zahle Kirchensteuer</label>
          </div>
        </div>

        <div class="config-group">
          <label>Solidaritätszuschlag</label>
          <div class="checkbox-group">
            <input
              v-model="taxConfig.solidarityTax"
              type="checkbox"
              id="solidarityTax"
              @change="updateTaxCalculations"
            />
            <label for="solidarityTax">Solidaritätszuschlag anwenden</label>
          </div>
        </div>

        <div class="config-group">
          <label>Freistellungsauftrag (€)</label>
          <input
            v-model.number="taxConfig.exemptionOrder"
            type="number"
            min="0"
            max="1000"
            step="50"
            class="config-input"
            @input="updateTaxCalculations"
          />
          <div class="input-help">Max. 1.000€ für Ledige, 2.000€ für Verheiratete</div>
        </div>
      </div>
    </div>

    <!-- 资本利得税分析 -->
    <div class="capital-gains-analysis">
      <h4>Abgeltungssteuer-Analyse</h4>
      <div class="analysis-cards">
        <div class="analysis-card primary">
          <div class="card-icon">
            <Icon name="percent" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Abgeltungssteuer</div>
            <div class="card-value">{{ formatPercentage(TAX_RATES.CAPITAL_GAINS) }}</div>
            <div class="card-detail">Grundsatz für Kapitalerträge</div>
          </div>
        </div>

        <div class="analysis-card success">
          <div class="card-icon">
            <Icon name="shield" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Sparerpauschbetrag</div>
            <div class="card-value">{{ formatCurrency(TAX_RATES.SAVER_ALLOWANCE) }}</div>
            <div class="card-detail">Steuerfreier Betrag pro Jahr</div>
          </div>
        </div>

        <div class="analysis-card info">
          <div class="card-icon">
            <Icon name="home" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Kirchensteuer</div>
            <div class="card-value">{{ formatPercentage(getChurchTaxRate()) }}</div>
            <div class="card-detail">{{ taxConfig.state }} - {{ taxConfig.churchTaxLiable ? 'Pflichtig' : 'Befreit' }}</div>
          </div>
        </div>

        <div class="analysis-card warning">
          <div class="card-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <div class="card-content">
            <div class="card-label">Solidaritätszuschlag</div>
            <div class="card-value">{{ formatPercentage(TAX_RATES.SOLIDARITY_TAX) }}</div>
            <div class="card-detail">{{ taxConfig.solidarityTax ? 'Anwendbar' : 'Nicht anwendbar' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 年度税务计算 -->
    <div class="annual-tax-calculation">
      <h4>Jährliche Steuerberechnung</h4>
      <div class="calculation-table">
        <div class="table-header">
          <span>Jahr</span>
          <span>Kapitalerträge</span>
          <span>Freibetrag</span>
          <span>Steuerpflichtig</span>
          <span>Abgeltungssteuer</span>
          <span>Kirchensteuer</span>
          <span>Solidaritätszuschlag</span>
          <span>Gesamtsteuer</span>
        </div>

        <div
          v-for="(calculation, index) in yearlyTaxCalculations"
          :key="calculation.year"
          class="table-row"
          :class="{ 'highlighted': highlightedYear === calculation.year }"
          @mouseenter="highlightedYear = calculation.year"
          @mouseleave="highlightedYear = null"
        >
          <span class="year-cell">{{ calculation.year }}</span>
          <span class="amount-cell">{{ formatCurrency(calculation.capitalGains) }}</span>
          <span class="amount-cell exemption">{{ formatCurrency(calculation.exemptionUsed) }}</span>
          <span class="amount-cell taxable">{{ formatCurrency(calculation.taxableAmount) }}</span>
          <span class="amount-cell tax">{{ formatCurrency(calculation.capitalGainsTax) }}</span>
          <span class="amount-cell tax">{{ formatCurrency(calculation.churchTax) }}</span>
          <span class="amount-cell tax">{{ formatCurrency(calculation.solidarityTax) }}</span>
          <span class="amount-cell total-tax">{{ formatCurrency(calculation.totalTax) }}</span>
        </div>
      </div>
    </div>

    <!-- 税务优化建议 -->
    <div class="tax-optimization-suggestions">
      <h4>Steueroptimierung</h4>
      <div class="optimization-cards">
        <div
          v-for="(suggestion, index) in taxOptimizationSuggestions"
          :key="index"
          class="optimization-card"
          :class="suggestion.priority"
        >
          <div class="card-header">
            <div class="suggestion-icon">
              <Icon :name="suggestion.icon" size="md" />
            </div>
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="potential-saving">
              <span class="saving-label">Ersparnis:</span>
              <span class="saving-amount">{{ formatCurrency(suggestion.potentialSaving) }}</span>
            </div>
          </div>

          <div class="card-content">
            <p>{{ suggestion.description }}</p>

            <div class="implementation-details">
              <h6>Umsetzung:</h6>
              <ul>
                <li v-for="(step, stepIndex) in suggestion.steps" :key="stepIndex">
                  {{ step }}
                </li>
              </ul>
            </div>

            <div class="suggestion-metrics">
              <div class="metric">
                <span class="metric-label">Aufwand:</span>
                <div class="difficulty-bar">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="difficulty-segment"
                    :class="{ 'active': i <= suggestion.difficulty }"
                  ></div>
                </div>
                <span class="difficulty-text">{{ getDifficultyLabel(suggestion.difficulty) }}</span>
              </div>

              <div class="metric">
                <span class="metric-label">Zeitrahmen:</span>
                <span class="metric-value">{{ suggestion.timeframe }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button @click="implementOptimization(suggestion)" class="implement-button">
              <Icon name="check" size="sm" />
              Umsetzen
            </button>
            <button @click="learnMore(suggestion)" class="learn-more-button">
              <Icon name="info" size="sm" />
              Mehr erfahren
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ETF税务特殊规则 -->
    <div class="etf-tax-rules">
      <h4>ETF-Besteuerung (Investmentsteuerreformgesetz)</h4>
      <div class="etf-rules-grid">
        <div class="rule-card">
          <div class="rule-icon">
            <Icon name="pie-chart" size="lg" />
          </div>
          <div class="rule-content">
            <h5>Teilfreistellung</h5>
            <p>Aktien-ETFs: 30% steuerfrei</p>
            <p>Misch-ETFs: 15% steuerfrei</p>
            <div class="rule-example">
              <span class="example-label">Beispiel:</span>
              <span class="example-text">
                Bei 1.000€ Gewinn aus Aktien-ETF sind 300€ steuerfrei
              </span>
            </div>
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-icon">
            <Icon name="calendar" size="lg" />
          </div>
          <div class="rule-content">
            <h5>Vorabpauschale</h5>
            <p>Jährliche Mindestbesteuerung</p>
            <p>Basiszins × 70% des Fondswerts</p>
            <div class="rule-calculation">
              <span class="calc-label">{{ selectedTaxYear }} Basiszins:</span>
              <span class="calc-value">{{ formatPercentage(getCurrentBaseRate()) }}</span>
            </div>
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-icon">
            <Icon name="repeat" size="lg" />
          </div>
          <div class="rule-content">
            <h5>Thesaurierende ETFs</h5>
            <p>Automatische Wiederanlage</p>
            <p>Vorabpauschale auf nicht ausgeschüttete Erträge</p>
            <div class="rule-benefit">
              <span class="benefit-label">Vorteil:</span>
              <span class="benefit-text">Steuerstundungseffekt</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 税务计算摘要 -->
    <div class="tax-summary">
      <h4>Steuerliche Zusammenfassung</h4>
      <div class="summary-metrics">
        <div class="summary-card">
          <div class="metric-icon">
            <Icon name="dollar-sign" size="lg" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Gesamte Kapitalerträge</div>
            <div class="metric-value">{{ formatCurrency(taxSummary.totalCapitalGains) }}</div>
            <div class="metric-detail">Über {{ investmentYears }} Jahre</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="metric-icon">
            <Icon name="shield" size="lg" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Genutzter Freibetrag</div>
            <div class="metric-value">{{ formatCurrency(taxSummary.totalExemptionUsed) }}</div>
            <div class="metric-detail">{{ formatPercentage(taxSummary.exemptionUtilization) }} ausgeschöpft</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="metric-icon">
            <Icon name="minus-circle" size="lg" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Gesamte Steuerlast</div>
            <div class="metric-value negative">{{ formatCurrency(taxSummary.totalTaxBurden) }}</div>
            <div class="metric-detail">{{ formatPercentage(taxSummary.effectiveTaxRate) }} effektiv</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="metric-icon">
            <Icon name="trending-up" size="lg" />
          </div>
          <div class="metric-content">
            <div class="metric-label">Netto-Rendite</div>
            <div class="metric-value positive">{{ formatCurrency(taxSummary.netReturn) }}</div>
            <div class="metric-detail">Nach Steuern</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 税务日历 -->
    <div class="tax-calendar">
      <h4>Steuerkalender</h4>
      <div class="calendar-events">
        <div
          v-for="(event, index) in taxCalendarEvents"
          :key="index"
          class="calendar-event"
          :class="event.type"
        >
          <div class="event-date">
            <div class="event-day">{{ event.date.getDate() }}</div>
            <div class="event-month">{{ getMonthName(event.date.getMonth()) }}</div>
          </div>
          <div class="event-content">
            <h6>{{ event.title }}</h6>
            <p>{{ event.description }}</p>
            <div class="event-importance">
              <Icon :name="getImportanceIcon(event.importance)" size="sm" />
              <span>{{ event.importance }}</span>
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
interface TaxConfig {
  state: string
  churchTaxLiable: boolean
  solidarityTax: boolean
  exemptionOrder: number
}

interface YearlyTaxCalculation {
  year: number
  capitalGains: number
  exemptionUsed: number
  taxableAmount: number
  capitalGainsTax: number
  churchTax: number
  solidarityTax: number
  totalTax: number
}

interface TaxOptimizationSuggestion {
  id: string
  title: string
  description: string
  icon: string
  priority: 'high' | 'medium' | 'low'
  potentialSaving: number
  difficulty: number
  timeframe: string
  steps: string[]
  category: string
}

interface TaxCalendarEvent {
  date: Date
  title: string
  description: string
  type: 'deadline' | 'opportunity' | 'reminder'
  importance: 'Hoch' | 'Mittel' | 'Niedrig'
}

interface TaxSummary {
  totalCapitalGains: number
  totalExemptionUsed: number
  exemptionUtilization: number
  totalTaxBurden: number
  effectiveTaxRate: number
  netReturn: number
}

// Props定义
interface Props {
  investmentData: {
    yearlyReturns: number[]
    totalReturn: number
    investmentYears: number
  }
  investmentType: 'stocks' | 'etf' | 'bonds' | 'mixed'
}

const props = defineProps<Props>()

// Emits定义
interface Emits {
  'optimization-applied': [suggestion: TaxOptimizationSuggestion]
  'tax-config-changed': [config: TaxConfig]
  'calculation-updated': [calculations: YearlyTaxCalculation[]]
}

const emit = defineEmits<Emits>()

// 税率常量
const TAX_RATES = {
  CAPITAL_GAINS: 0.25, // 25% Abgeltungssteuer
  SAVER_ALLOWANCE: 1000, // 1.000€ Sparerpauschbetrag (Ledige)
  SOLIDARITY_TAX: 0.055, // 5,5% Solidaritätszuschlag
  CHURCH_TAX_RATES: {
    'BW': 0.08, // Baden-Württemberg
    'BY': 0.08, // Bayern
    'BE': 0.09, // Berlin
    'BB': 0.09, // Brandenburg
    'HB': 0.09, // Bremen
    'HH': 0.09, // Hamburg
    'HE': 0.09, // Hessen
    'MV': 0.09, // Mecklenburg-Vorpommern
    'NI': 0.09, // Niedersachsen
    'NW': 0.09, // Nordrhein-Westfalen
    'RP': 0.09, // Rheinland-Pfalz
    'SL': 0.09, // Saarland
    'SN': 0.09, // Sachsen
    'ST': 0.09, // Sachsen-Anhalt
    'SH': 0.09, // Schleswig-Holstein
    'TH': 0.09  // Thüringen
  }
}

// 响应式数据
const selectedTaxYear = ref(new Date().getFullYear())
const highlightedYear = ref<number | null>(null)

const taxConfig = ref<TaxConfig>({
  state: 'NW',
  churchTaxLiable: false,
  solidarityTax: true,
  exemptionOrder: 1000
})

const yearlyTaxCalculations = ref<YearlyTaxCalculation[]>([])
const taxOptimizationSuggestions = ref<TaxOptimizationSuggestion[]>([])
const taxCalendarEvents = ref<TaxCalendarEvent[]>([])

// 德国各州
const germanStates = [
  { code: 'BW', name: 'Baden-Württemberg' },
  { code: 'BY', name: 'Bayern' },
  { code: 'BE', name: 'Berlin' },
  { code: 'BB', name: 'Brandenburg' },
  { code: 'HB', name: 'Bremen' },
  { code: 'HH', name: 'Hamburg' },
  { code: 'HE', name: 'Hessen' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'NI', name: 'Niedersachsen' },
  { code: 'NW', name: 'Nordrhein-Westfalen' },
  { code: 'RP', name: 'Rheinland-Pfalz' },
  { code: 'SL', name: 'Saarland' },
  { code: 'SN', name: 'Sachsen' },
  { code: 'ST', name: 'Sachsen-Anhalt' },
  { code: 'SH', name: 'Schleswig-Holstein' },
  { code: 'TH', name: 'Thüringen' }
]

// 计算属性
const availableTaxYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(i)
  }
  return years
})

const investmentYears = computed(() => props.investmentData?.investmentYears || 20)

const taxSummary = computed((): TaxSummary => {
  const totalCapitalGains = yearlyTaxCalculations.value.reduce((sum, calc) => sum + calc.capitalGains, 0)
  const totalExemptionUsed = yearlyTaxCalculations.value.reduce((sum, calc) => sum + calc.exemptionUsed, 0)
  const totalTaxBurden = yearlyTaxCalculations.value.reduce((sum, calc) => sum + calc.totalTax, 0)

  const maxPossibleExemption = TAX_RATES.SAVER_ALLOWANCE * investmentYears.value
  const exemptionUtilization = maxPossibleExemption > 0 ? totalExemptionUsed / maxPossibleExemption : 0
  const effectiveTaxRate = totalCapitalGains > 0 ? totalTaxBurden / totalCapitalGains : 0
  const netReturn = totalCapitalGains - totalTaxBurden

  return {
    totalCapitalGains,
    totalExemptionUsed,
    exemptionUtilization,
    totalTaxBurden,
    effectiveTaxRate,
    netReturn
  }
})

// 方法
const getChurchTaxRate = (): number => {
  if (!taxConfig.value.churchTaxLiable) return 0
  return TAX_RATES.CHURCH_TAX_RATES[taxConfig.value.state as keyof typeof TAX_RATES.CHURCH_TAX_RATES] || 0.09
}

const getCurrentBaseRate = (): number => {
  // 简化的基础利率，实际应该从官方数据获取
  const baseRates: Record<number, number> = {
    2024: 0.025,
    2023: 0.02,
    2022: 0.015,
    2021: 0.01
  }
  return baseRates[selectedTaxYear.value] || 0.02
}

const calculateYearlyTaxes = () => {
  const calculations: YearlyTaxCalculation[] = []
  const yearlyReturns = props.investmentData?.yearlyReturns || []

  for (let i = 0; i < investmentYears.value; i++) {
    const year = selectedTaxYear.value + i
    const capitalGains = yearlyReturns[i] || 0

    // 应用部分免税（ETF特殊规则）
    let adjustedCapitalGains = capitalGains
    if (props.investmentType === 'etf') {
      // 30% Teilfreistellung für Aktien-ETFs
      adjustedCapitalGains = capitalGains * 0.7
    }

    // 计算免税额度使用
    const exemptionUsed = Math.min(adjustedCapitalGains, taxConfig.value.exemptionOrder)
    const taxableAmount = Math.max(0, adjustedCapitalGains - exemptionUsed)

    // 计算各项税费
    const capitalGainsTax = taxableAmount * TAX_RATES.CAPITAL_GAINS
    const churchTax = taxConfig.value.churchTaxLiable ? capitalGainsTax * getChurchTaxRate() : 0
    const solidarityTax = taxConfig.value.solidarityTax ? capitalGainsTax * TAX_RATES.SOLIDARITY_TAX : 0

    const totalTax = capitalGainsTax + churchTax + solidarityTax

    calculations.push({
      year,
      capitalGains,
      exemptionUsed,
      taxableAmount,
      capitalGainsTax,
      churchTax,
      solidarityTax,
      totalTax
    })
  }

  yearlyTaxCalculations.value = calculations
}

const generateOptimizationSuggestions = () => {
  const suggestions: TaxOptimizationSuggestion[] = []

  // 免税额度优化
  if (taxSummary.value.exemptionUtilization < 0.8) {
    suggestions.push({
      id: 'optimize-exemption',
      title: 'Freistellungsauftrag optimieren',
      description: 'Sie nutzen nur einen Teil Ihres Sparerpauschbetrags. Durch bessere Verteilung können Sie Steuern sparen.',
      icon: 'shield',
      priority: 'high',
      potentialSaving: (1 - taxSummary.value.exemptionUtilization) * TAX_RATES.SAVER_ALLOWANCE * TAX_RATES.CAPITAL_GAINS,
      difficulty: 2,
      timeframe: '1-2 Wochen',
      steps: [
        'Aktuelle Freistellungsaufträge bei allen Banken prüfen',
        'Optimale Verteilung berechnen',
        'Freistellungsaufträge entsprechend anpassen',
        'Jährlich überprüfen und anpassen'
      ],
      category: 'Freibetrag'
    })
  }

  // ETF-Optimierung
  if (props.investmentType !== 'etf') {
    suggestions.push({
      id: 'switch-to-etf',
      title: 'Wechsel zu ETFs erwägen',
      description: 'ETFs bieten steuerliche Vorteile durch Teilfreistellung und Thesaurierung.',
      icon: 'trending-up',
      priority: 'medium',
      potentialSaving: taxSummary.value.totalTaxBurden * 0.3,
      difficulty: 3,
      timeframe: '1-3 Monate',
      steps: [
        'Geeignete ETFs recherchieren',
        'Kosten-Nutzen-Analyse durchführen',
        'Schrittweise Umschichtung planen',
        'Steuerliche Auswirkungen beachten'
      ],
      category: 'Produktwahl'
    })
  }

  // Kirchensteuer-Optimierung
  if (taxConfig.value.churchTaxLiable && taxSummary.value.totalTaxBurden > 5000) {
    suggestions.push({
      id: 'church-tax-optimization',
      title: 'Kirchensteuer-Optimierung',
      description: 'Bei hohen Kapitalerträgen kann ein Kirchenaustritt steuerlich vorteilhaft sein.',
      icon: 'home',
      priority: 'low',
      potentialSaving: yearlyTaxCalculations.value.reduce((sum, calc) => sum + calc.churchTax, 0),
      difficulty: 4,
      timeframe: '3-6 Monate',
      steps: [
        'Steuerliche Auswirkungen berechnen',
        'Persönliche Überzeugungen abwägen',
        'Rechtliche Beratung einholen',
        'Entscheidung treffen und umsetzen'
      ],
      category: 'Kirchensteuer'
    })
  }

  taxOptimizationSuggestions.value = suggestions
}

const generateTaxCalendar = () => {
  const currentYear = selectedTaxYear.value
  const events: TaxCalendarEvent[] = [
    {
      date: new Date(currentYear, 4, 31), // 31. Mai
      title: 'Steuererklärung Abgabefrist',
      description: 'Frist für die Abgabe der Steuererklärung ohne Steuerberater',
      type: 'deadline',
      importance: 'Hoch'
    },
    {
      date: new Date(currentYear, 11, 31), // 31. Dezember
      title: 'Verlustverrechnung nutzen',
      description: 'Letzte Gelegenheit für Verlustverrechnung im laufenden Jahr',
      type: 'opportunity',
      importance: 'Mittel'
    },
    {
      date: new Date(currentYear, 0, 1), // 1. Januar
      title: 'Freistellungsauftrag prüfen',
      description: 'Jährliche Überprüfung und Anpassung der Freistellungsaufträge',
      type: 'reminder',
      importance: 'Mittel'
    }
  ]

  taxCalendarEvents.value = events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

const getDifficultyLabel = (difficulty: number): string => {
  if (difficulty <= 2) return 'Einfach'
  if (difficulty <= 3) return 'Mittel'
  return 'Schwer'
}

const getMonthName = (month: number): string => {
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  return months[month]
}

const getImportanceIcon = (importance: string): string => {
  switch (importance) {
    case 'Hoch': return 'alert-triangle'
    case 'Mittel': return 'info'
    case 'Niedrig': return 'check-circle'
    default: return 'info'
  }
}

const updateTaxCalculations = () => {
  calculateYearlyTaxes()
  generateOptimizationSuggestions()
  generateTaxCalendar()
  emit('tax-config-changed', taxConfig.value)
  emit('calculation-updated', yearlyTaxCalculations.value)
}

const implementOptimization = (suggestion: TaxOptimizationSuggestion) => {
  emit('optimization-applied', suggestion)
}

const learnMore = (suggestion: TaxOptimizationSuggestion) => {
  // 打开详细信息或外部链接
  console.log('Learn more about:', suggestion.title)
}

// 监听器
watch(() => props.investmentData, () => {
  updateTaxCalculations()
}, { deep: true })

// 生命周期
onMounted(() => {
  updateTaxCalculations()
})
</script>

<style scoped>
.german-tax-analysis-engine {
  @apply space-y-8;
}

/* 引擎头部 */
.engine-header {
  @apply flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-yellow-50 rounded-lg border border-red-200;
}

.engine-title {
  @apply flex items-center gap-3 text-xl font-bold text-gray-800;
}

.tax-year-selector {
  @apply flex items-center gap-2;
}

.tax-year-selector label {
  @apply text-sm font-medium text-gray-700;
}

.tax-year-select {
  @apply px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-red-500;
}

/* 税务配置面板 */
.tax-config-panel {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.tax-config-panel h4 {
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

.config-select,
.config-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.checkbox-group {
  @apply flex items-center gap-2;
}

.checkbox-group input[type="checkbox"] {
  @apply rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

.checkbox-group label {
  @apply text-sm text-gray-700 cursor-pointer;
}

.input-help {
  @apply text-xs text-gray-500 mt-1;
}

/* 资本利得税分析 */
.capital-gains-analysis {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.capital-gains-analysis h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.analysis-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.analysis-card {
  @apply flex items-center gap-4 p-4 rounded-lg border;
}

.analysis-card.primary {
  @apply bg-red-50 border-red-200;
}

.analysis-card.success {
  @apply bg-green-50 border-green-200;
}

.analysis-card.info {
  @apply bg-blue-50 border-blue-200;
}

.analysis-card.warning {
  @apply bg-yellow-50 border-yellow-200;
}

.card-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center;
}

.analysis-card.primary .card-icon {
  @apply bg-red-100 text-red-600;
}

.analysis-card.success .card-icon {
  @apply bg-green-100 text-green-600;
}

.analysis-card.info .card-icon {
  @apply bg-blue-100 text-blue-600;
}

.analysis-card.warning .card-icon {
  @apply bg-yellow-100 text-yellow-600;
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

.card-detail {
  @apply text-xs text-gray-500;
}

/* 年度税务计算表格 */
.annual-tax-calculation {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.annual-tax-calculation h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.calculation-table {
  @apply overflow-x-auto;
}

.table-header {
  @apply grid grid-cols-8 gap-2 p-3 bg-gray-100 rounded-t-lg text-sm font-semibold text-gray-700;
}

.table-row {
  @apply grid grid-cols-8 gap-2 p-3 border-b border-gray-200 text-sm;
  @apply hover:bg-gray-50 transition-colors;
}

.table-row.highlighted {
  @apply bg-blue-50;
}

.year-cell {
  @apply font-semibold text-gray-900;
}

.amount-cell {
  @apply text-right font-mono;
}

.amount-cell.exemption {
  @apply text-green-600;
}

.amount-cell.taxable {
  @apply text-orange-600;
}

.amount-cell.tax {
  @apply text-red-600;
}

.amount-cell.total-tax {
  @apply font-bold text-red-700;
}

/* 税务优化建议 */
.tax-optimization-suggestions {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.tax-optimization-suggestions h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.optimization-cards {
  @apply grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6;
}

.optimization-card {
  @apply border rounded-lg p-6 hover:shadow-lg transition-shadow;
}

.optimization-card.high {
  @apply border-red-300 bg-red-50;
}

.optimization-card.medium {
  @apply border-yellow-300 bg-yellow-50;
}

.optimization-card.low {
  @apply border-blue-300 bg-blue-50;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.suggestion-icon {
  @apply w-12 h-12 bg-white rounded-full flex items-center justify-center;
}

.optimization-card.high .suggestion-icon {
  @apply bg-red-100 text-red-600;
}

.optimization-card.medium .suggestion-icon {
  @apply bg-yellow-100 text-yellow-600;
}

.optimization-card.low .suggestion-icon {
  @apply bg-blue-100 text-blue-600;
}

.suggestion-title {
  @apply flex-1 font-semibold text-gray-900 mx-3;
}

.potential-saving {
  @apply text-right;
}

.saving-label {
  @apply text-xs text-gray-600;
}

.saving-amount {
  @apply block font-bold text-green-600;
}

.card-content p {
  @apply text-sm text-gray-600 mb-4;
}

.implementation-details h6 {
  @apply font-semibold text-gray-800 mb-2;
}

.implementation-details ul {
  @apply list-disc list-inside space-y-1 text-sm text-gray-600 mb-4;
}

.suggestion-metrics {
  @apply space-y-3 mb-4;
}

.metric {
  @apply flex items-center gap-3;
}

.metric-label {
  @apply text-sm text-gray-600;
}

.difficulty-bar {
  @apply flex gap-1;
}

.difficulty-segment {
  @apply w-3 h-2 bg-gray-300 rounded;
}

.difficulty-segment.active {
  @apply bg-orange-500;
}

.difficulty-text {
  @apply text-sm text-gray-600;
}

.metric-value {
  @apply text-sm font-semibold text-gray-900;
}

.card-actions {
  @apply flex gap-2;
}

.implement-button {
  @apply flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md;
  @apply hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500;
}

.learn-more-button {
  @apply flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500;
}

/* ETF税务规则 */
.etf-tax-rules {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.etf-tax-rules h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.etf-rules-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.rule-card {
  @apply flex flex-col items-center text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200;
}

.rule-icon {
  @apply w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4;
}

.rule-content h5 {
  @apply font-semibold text-gray-900 mb-3;
}

.rule-content p {
  @apply text-sm text-gray-600 mb-2;
}

.rule-example {
  @apply mt-4 p-3 bg-white rounded-lg border border-purple-200;
}

.example-label {
  @apply text-xs font-semibold text-purple-700;
}

.example-text {
  @apply block text-xs text-gray-600 mt-1;
}

.rule-calculation {
  @apply mt-4 flex justify-between items-center p-2 bg-white rounded border border-purple-200;
}

.calc-label {
  @apply text-xs text-gray-600;
}

.calc-value {
  @apply text-sm font-bold text-purple-600;
}

.rule-benefit {
  @apply mt-4 p-2 bg-green-100 rounded border border-green-200;
}

.benefit-label {
  @apply text-xs font-semibold text-green-700;
}

.benefit-text {
  @apply block text-xs text-green-600 mt-1;
}

/* 税务摘要 */
.tax-summary {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.tax-summary h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.summary-metrics {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.summary-card {
  @apply flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200;
}

.metric-icon {
  @apply w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
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

.metric-value.negative {
  @apply text-red-600;
}

.metric-value.positive {
  @apply text-green-600;
}

.metric-detail {
  @apply text-xs text-gray-500;
}

/* 税务日历 */
.tax-calendar {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.tax-calendar h4 {
  @apply text-lg font-semibold text-gray-800 mb-6;
}

.calendar-events {
  @apply space-y-4;
}

.calendar-event {
  @apply flex items-start gap-4 p-4 rounded-lg border;
}

.calendar-event.deadline {
  @apply bg-red-50 border-red-200;
}

.calendar-event.opportunity {
  @apply bg-green-50 border-green-200;
}

.calendar-event.reminder {
  @apply bg-blue-50 border-blue-200;
}

.event-date {
  @apply flex flex-col items-center justify-center w-16 h-16 bg-white rounded-lg border-2;
}

.calendar-event.deadline .event-date {
  @apply border-red-300 text-red-600;
}

.calendar-event.opportunity .event-date {
  @apply border-green-300 text-green-600;
}

.calendar-event.reminder .event-date {
  @apply border-blue-300 text-blue-600;
}

.event-day {
  @apply text-lg font-bold;
}

.event-month {
  @apply text-xs font-medium;
}

.event-content {
  @apply flex-1;
}

.event-content h6 {
  @apply font-semibold text-gray-900 mb-1;
}

.event-content p {
  @apply text-sm text-gray-600 mb-2;
}

.event-importance {
  @apply flex items-center gap-2 text-xs;
}

.calendar-event.deadline .event-importance {
  @apply text-red-600;
}

.calendar-event.opportunity .event-importance {
  @apply text-green-600;
}

.calendar-event.reminder .event-importance {
  @apply text-blue-600;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .config-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .analysis-cards {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .optimization-cards {
    @apply grid-cols-1 lg:grid-cols-2;
  }

  .etf-rules-grid {
    @apply grid-cols-1 md:grid-cols-2;
  }

  .summary-metrics {
    @apply grid-cols-1 md:grid-cols-2;
  }
}

@media (max-width: 768px) {
  .engine-header {
    @apply flex-col items-start gap-4;
  }

  .config-grid {
    @apply grid-cols-1;
  }

  .analysis-cards {
    @apply grid-cols-1;
  }

  .table-header,
  .table-row {
    @apply grid-cols-4 gap-1 text-xs;
  }

  .table-header span:nth-child(n+5),
  .table-row span:nth-child(n+5) {
    @apply hidden;
  }

  .optimization-cards {
    @apply grid-cols-1;
  }

  .card-header {
    @apply flex-col items-start gap-2;
  }

  .potential-saving {
    @apply self-end;
  }

  .card-actions {
    @apply flex-col gap-2;
  }

  .implement-button,
  .learn-more-button {
    @apply w-full;
  }

  .etf-rules-grid {
    @apply grid-cols-1;
  }

  .summary-metrics {
    @apply grid-cols-1;
  }

  .summary-card {
    @apply flex-col text-center;
  }

  .metric-icon {
    @apply mb-3;
  }

  .calendar-event {
    @apply flex-col items-start gap-2;
  }

  .event-date {
    @apply self-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .german-tax-analysis-engine {
    @apply bg-gray-900;
  }

  .engine-header {
    @apply bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600;
  }

  .engine-title {
    @apply text-gray-100;
  }

  .tax-year-selector label {
    @apply text-gray-300;
  }

  .tax-year-select {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .tax-config-panel,
  .capital-gains-analysis,
  .annual-tax-calculation,
  .tax-optimization-suggestions,
  .etf-tax-rules,
  .tax-summary,
  .tax-calendar {
    @apply bg-gray-800 border-gray-700;
  }

  .tax-config-panel h4,
  .capital-gains-analysis h4,
  .annual-tax-calculation h4,
  .tax-optimization-suggestions h4,
  .etf-tax-rules h4,
  .tax-summary h4,
  .tax-calendar h4 {
    @apply text-gray-100;
  }

  .config-group label {
    @apply text-gray-300;
  }

  .config-select,
  .config-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }

  .checkbox-group label {
    @apply text-gray-300;
  }

  .input-help {
    @apply text-gray-400;
  }

  .analysis-card {
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

  .table-header {
    @apply bg-gray-700 text-gray-300;
  }

  .table-row {
    @apply border-gray-700 hover:bg-gray-700;
  }

  .table-row.highlighted {
    @apply bg-blue-900;
  }

  .optimization-card {
    @apply bg-gray-700 border-gray-600;
  }

  .suggestion-title {
    @apply text-gray-100;
  }

  .card-content p {
    @apply text-gray-300;
  }

  .implementation-details h6 {
    @apply text-gray-200;
  }

  .implementation-details ul {
    @apply text-gray-300;
  }

  .rule-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
  }

  .rule-content h5 {
    @apply text-gray-100;
  }

  .rule-content p {
    @apply text-gray-300;
  }

  .rule-example {
    @apply bg-gray-800 border-gray-600;
  }

  .example-text {
    @apply text-gray-300;
  }

  .rule-calculation {
    @apply bg-gray-800 border-gray-600;
  }

  .calc-label {
    @apply text-gray-300;
  }

  .rule-benefit {
    @apply bg-green-900 border-green-700;
  }

  .benefit-text {
    @apply text-green-300;
  }

  .summary-card {
    @apply bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600;
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

  .calendar-event {
    @apply bg-gray-700 border-gray-600;
  }

  .event-date {
    @apply bg-gray-800 border-gray-600;
  }

  .event-content h6 {
    @apply text-gray-100;
  }

  .event-content p {
    @apply text-gray-300;
  }
}
</style>
