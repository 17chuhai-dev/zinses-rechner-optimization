<!--
  ETF类型选择器组件
  提供德国ETF类型选择和Teilfreistellung信息展示
-->

<template>
  <div class="etf-type-selector">
    <!-- 选择器头部 -->
    <div class="selector-header">
      <h3 class="selector-title">
        <Icon name="trending-up" size="20" />
        ETF-Typ auswählen
      </h3>
      <div v-if="showInfo" class="info-toggle">
        <button @click="toggleInfoPanel" class="info-button" :class="{ 'active': showInfoPanel }">
          <Icon name="info" size="16" />
          <span>Teilfreistellung Info</span>
        </button>
      </div>
    </div>

    <!-- ETF类型选择网格 -->
    <div class="etf-types-grid">
      <div
        v-for="etfType in etfTypes"
        :key="etfType.id"
        class="etf-type-card"
        :class="{
          'selected': selectedType === etfType.id,
          'recommended': etfType.recommended
        }"
        @click="selectETFType(etfType.id)"
      >
        <!-- 推荐标签 -->
        <div v-if="etfType.recommended" class="recommended-badge">
          <Icon name="star" size="12" />
          <span>Empfohlen</span>
        </div>

        <!-- ETF类型图标 -->
        <div class="etf-icon">
          <Icon :name="etfType.icon" size="24" />
        </div>

        <!-- ETF类型信息 -->
        <div class="etf-info">
          <h4 class="etf-name">{{ etfType.name }}</h4>
          <p class="etf-description">{{ etfType.description }}</p>

          <!-- Teilfreistellung信息 -->
          <div class="teilfreistellung-info">
            <div class="teilfreistellung-rate">
              <span class="rate-label">Teilfreistellung:</span>
              <span class="rate-value" :class="getRateClass(etfType.teilfreistellungRate)">
                {{ formatPercentage(etfType.teilfreistellungRate) }}
              </span>
            </div>
            <div class="tax-savings">
              <span class="savings-label">Steuerersparnis:</span>
              <span class="savings-value">{{ formatPercentage(etfType.teilfreistellungRate * 0.25) }}</span>
            </div>
          </div>

          <!-- 风险等级 -->
          <div class="risk-level">
            <span class="risk-label">Risiko:</span>
            <div class="risk-indicator">
              <div
                v-for="i in 5"
                :key="i"
                class="risk-dot"
                :class="{ 'active': i <= etfType.riskLevel }"
              ></div>
            </div>
            <span class="risk-text">{{ getRiskText(etfType.riskLevel) }}</span>
          </div>
        </div>

        <!-- 选择指示器 -->
        <div v-if="selectedType === etfType.id" class="selection-indicator">
          <Icon name="check" size="16" />
        </div>
      </div>
    </div>

    <!-- 自定义ETF选项 -->
    <div v-if="allowCustom" class="custom-etf-section">
      <button @click="toggleCustomForm" class="custom-toggle-button">
        <Icon name="plus" size="16" />
        <span>Benutzerdefinierten ETF hinzufügen</span>
      </button>

      <Transition name="custom-form-expand">
        <div v-if="showCustomForm" class="custom-etf-form">
          <h4>Benutzerdefinierter ETF</h4>

          <div class="form-grid">
            <div class="form-group">
              <label>ETF-Name</label>
              <input
                v-model="customETF.name"
                type="text"
                class="form-input"
                placeholder="z.B. MSCI World ETF"
              />
            </div>

            <div class="form-group">
              <label>Teilfreistellung (%)</label>
              <input
                v-model.number="customETF.teilfreistellungRate"
                type="number"
                min="0"
                max="100"
                step="5"
                class="form-input"
                placeholder="z.B. 30"
              />
            </div>

            <div class="form-group">
              <label>Risikostufe (1-5)</label>
              <input
                v-model.number="customETF.riskLevel"
                type="number"
                min="1"
                max="5"
                step="1"
                class="form-input"
                placeholder="z.B. 3"
              />
            </div>

            <div class="form-group">
              <label>Beschreibung</label>
              <textarea
                v-model="customETF.description"
                class="form-textarea"
                rows="2"
                placeholder="Kurze Beschreibung des ETFs..."
              ></textarea>
            </div>
          </div>

          <div class="custom-form-actions">
            <button @click="addCustomETF" class="add-button" :disabled="!isCustomETFValid">
              <Icon name="plus" size="16" />
              ETF hinzufügen
            </button>
            <button @click="cancelCustomETF" class="cancel-button">
              Abbrechen
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 信息面板 -->
    <Transition name="info-panel-slide">
      <div v-if="showInfoPanel" class="info-panel">
        <div class="info-panel-header">
          <h4>ETF-Teilfreistellung erklärt</h4>
          <button @click="closeInfoPanel" class="close-button">
            <Icon name="x" size="16" />
          </button>
        </div>

        <div class="info-content">
          <div class="info-section">
            <h5>Was ist die Teilfreistellung?</h5>
            <p>
              Die Teilfreistellung ist ein Steuervorteil für ETF-Anleger in Deutschland.
              Ein Teil der Erträge bleibt steuerfrei, abhängig vom ETF-Typ.
            </p>
          </div>

          <div class="info-section">
            <h5>Teilfreistellungssätze</h5>
            <div class="rates-table">
              <div class="rate-row">
                <span class="rate-type">Aktien-ETF (≥51% Aktien)</span>
                <span class="rate-percentage">30%</span>
              </div>
              <div class="rate-row">
                <span class="rate-type">Misch-ETF (≥25% Aktien)</span>
                <span class="rate-percentage">15%</span>
              </div>
              <div class="rate-row">
                <span class="rate-type">Immobilien-ETF</span>
                <span class="rate-percentage">60%</span>
              </div>
              <div class="rate-row">
                <span class="rate-type">Anleihen-ETF</span>
                <span class="rate-percentage">0%</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h5>Beispielrechnung</h5>
            <div class="example-calculation">
              <div class="calc-row">
                <span>ETF-Ertrag:</span>
                <span>1.000 €</span>
              </div>
              <div class="calc-row">
                <span>Teilfreistellung (30%):</span>
                <span>300 €</span>
              </div>
              <div class="calc-row">
                <span>Steuerpflichtiger Betrag:</span>
                <span>700 €</span>
              </div>
              <div class="calc-row highlight">
                <span>Steuerersparnis:</span>
                <span>75 € (7,5%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 选择摘要 -->
    <div v-if="selectedETF" class="selection-summary">
      <div class="summary-header">
        <h4>Ausgewählter ETF</h4>
        <button v-if="allowClear" @click="clearSelection" class="clear-button">
          <Icon name="x" size="14" />
          Auswahl löschen
        </button>
      </div>

      <div class="summary-content">
        <div class="summary-main">
          <div class="summary-icon">
            <Icon :name="selectedETF.icon" size="20" />
          </div>
          <div class="summary-info">
            <h5>{{ selectedETF.name }}</h5>
            <p>{{ selectedETF.description }}</p>
          </div>
        </div>

        <div class="summary-details">
          <div class="detail-item">
            <span class="detail-label">Teilfreistellung:</span>
            <span class="detail-value">{{ formatPercentage(selectedETF.teilfreistellungRate) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Steuerersparnis:</span>
            <span class="detail-value">{{ formatPercentage(selectedETF.teilfreistellungRate * 0.25) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Risikostufe:</span>
            <span class="detail-value">{{ selectedETF.riskLevel }}/5</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import Icon from '@/components/ui/BaseIcon.vue'
import { formatPercentage } from '@/utils/formatters'

// ETF类型接口
interface ETFType {
  id: string
  name: string
  description: string
  teilfreistellungRate: number // 0-1 (0% - 100%)
  riskLevel: number // 1-5
  icon: string
  recommended?: boolean
  category: 'equity' | 'mixed' | 'bond' | 'reit' | 'commodity' | 'custom'
}

// Props定义
interface Props {
  modelValue?: string
  showInfo?: boolean
  allowCustom?: boolean
  allowClear?: boolean
  preselectedType?: string
}

const props = withDefaults(defineProps<Props>(), {
  showInfo: true,
  allowCustom: false,
  allowClear: true
})

// Emits定义
interface Emits {
  'update:modelValue': [value: string]
  'etf-selected': [etf: ETFType]
  'etf-cleared': []
}

const emit = defineEmits<Emits>()

// 响应式数据
const selectedType = ref<string>(props.modelValue || props.preselectedType || '')
const showInfoPanel = ref(false)
const showCustomForm = ref(false)

const customETF = reactive({
  name: '',
  teilfreistellungRate: 30,
  riskLevel: 3,
  description: ''
})

// ETF类型数据
const etfTypes = ref<ETFType[]>([
  {
    id: 'equity-etf',
    name: 'Aktien-ETF',
    description: 'Mindestens 51% Aktienanteil',
    teilfreistellungRate: 0.30,
    riskLevel: 4,
    icon: 'trending-up',
    recommended: true,
    category: 'equity'
  },
  {
    id: 'mixed-etf',
    name: 'Misch-ETF',
    description: 'Mindestens 25% Aktienanteil',
    teilfreistellungRate: 0.15,
    riskLevel: 3,
    icon: 'pie-chart',
    category: 'mixed'
  },
  {
    id: 'bond-etf',
    name: 'Anleihen-ETF',
    description: 'Überwiegend Anleihen',
    teilfreistellungRate: 0.00,
    riskLevel: 2,
    icon: 'shield',
    category: 'bond'
  },
  {
    id: 'reit-etf',
    name: 'Immobilien-ETF',
    description: 'Immobilien-Investmentfonds',
    teilfreistellungRate: 0.60,
    riskLevel: 3,
    icon: 'home',
    category: 'reit'
  },
  {
    id: 'commodity-etf',
    name: 'Rohstoff-ETF',
    description: 'Rohstoffe und Edelmetalle',
    teilfreistellungRate: 0.00,
    riskLevel: 5,
    icon: 'zap',
    category: 'commodity'
  }
])

// 计算属性
const selectedETF = computed(() => {
  return etfTypes.value.find(etf => etf.id === selectedType.value)
})

const isCustomETFValid = computed(() => {
  return customETF.name.trim().length > 0 &&
         customETF.teilfreistellungRate >= 0 &&
         customETF.teilfreistellungRate <= 100 &&
         customETF.riskLevel >= 1 &&
         customETF.riskLevel <= 5
})

// 方法
const selectETFType = (typeId: string) => {
  selectedType.value = typeId
  emit('update:modelValue', typeId)

  const selectedETF = etfTypes.value.find(etf => etf.id === typeId)
  if (selectedETF) {
    emit('etf-selected', selectedETF)
  }
}

const clearSelection = () => {
  selectedType.value = ''
  emit('update:modelValue', '')
  emit('etf-cleared')
}

const toggleInfoPanel = () => {
  showInfoPanel.value = !showInfoPanel.value
}

const closeInfoPanel = () => {
  showInfoPanel.value = false
}

const toggleCustomForm = () => {
  showCustomForm.value = !showCustomForm.value
}

const addCustomETF = () => {
  if (!isCustomETFValid.value) return

  const customId = `custom-${Date.now()}`
  const newETF: ETFType = {
    id: customId,
    name: customETF.name,
    description: customETF.description || 'Benutzerdefinierter ETF',
    teilfreistellungRate: customETF.teilfreistellungRate / 100,
    riskLevel: customETF.riskLevel,
    icon: 'star',
    category: 'custom'
  }

  etfTypes.value.push(newETF)
  selectETFType(customId)
  cancelCustomETF()
}

const cancelCustomETF = () => {
  showCustomForm.value = false
  customETF.name = ''
  customETF.teilfreistellungRate = 30
  customETF.riskLevel = 3
  customETF.description = ''
}

const getRateClass = (rate: number): string => {
  if (rate >= 0.5) return 'rate-high'
  if (rate >= 0.2) return 'rate-medium'
  if (rate > 0) return 'rate-low'
  return 'rate-none'
}

const getRiskText = (level: number): string => {
  const riskTexts = ['', 'Sehr niedrig', 'Niedrig', 'Mittel', 'Hoch', 'Sehr hoch']
  return riskTexts[level] || 'Unbekannt'
}

// 监听器
watch(() => props.modelValue, (newValue) => {
  if (newValue !== selectedType.value) {
    selectedType.value = newValue || ''
  }
})
</script>

<style scoped>
.etf-type-selector {
  @apply space-y-6;
}

/* 选择器头部 */
.selector-header {
  @apply flex items-center justify-between;
}

.selector-title {
  @apply flex items-center gap-2 text-lg font-semibold text-gray-800;
}

.info-toggle {
  @apply flex items-center;
}

.info-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900;
  @apply hover:bg-gray-100 rounded-md transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.info-button.active {
  @apply bg-blue-100 text-blue-700;
}

/* ETF类型网格 */
.etf-types-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.etf-type-card {
  @apply relative bg-white border border-gray-200 rounded-lg p-4 cursor-pointer;
  @apply hover:border-blue-300 hover:shadow-md transition-all;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.etf-type-card.selected {
  @apply border-blue-500 bg-blue-50 shadow-md;
}

.etf-type-card.recommended {
  @apply border-green-300 bg-green-50;
}

.etf-type-card.recommended.selected {
  @apply border-blue-500 bg-blue-50;
}

.recommended-badge {
  @apply absolute top-2 right-2 flex items-center gap-1 px-2 py-1;
  @apply bg-green-100 text-green-700 text-xs font-medium rounded-full;
}

.etf-icon {
  @apply w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3;
  @apply text-gray-600;
}

.etf-type-card.selected .etf-icon {
  @apply bg-blue-100 text-blue-600;
}

.etf-info {
  @apply space-y-3;
}

.etf-name {
  @apply font-semibold text-gray-900;
}

.etf-description {
  @apply text-sm text-gray-600;
}

.teilfreistellung-info {
  @apply space-y-2;
}

.teilfreistellung-rate,
.tax-savings {
  @apply flex justify-between text-sm;
}

.rate-label,
.savings-label {
  @apply text-gray-600;
}

.rate-value {
  @apply font-semibold;
}

.rate-value.rate-high {
  @apply text-green-600;
}

.rate-value.rate-medium {
  @apply text-blue-600;
}

.rate-value.rate-low {
  @apply text-orange-600;
}

.rate-value.rate-none {
  @apply text-gray-600;
}

.savings-value {
  @apply font-semibold text-green-600;
}

.risk-level {
  @apply flex items-center gap-2 text-sm;
}

.risk-label {
  @apply text-gray-600;
}

.risk-indicator {
  @apply flex gap-1;
}

.risk-dot {
  @apply w-2 h-2 bg-gray-300 rounded-full;
}

.risk-dot.active {
  @apply bg-orange-500;
}

.risk-text {
  @apply text-xs text-gray-500;
}

.selection-indicator {
  @apply absolute top-2 left-2 w-6 h-6 bg-blue-500 text-white rounded-full;
  @apply flex items-center justify-center;
}

/* 自定义ETF区域 */
.custom-etf-section {
  @apply border-t border-gray-200 pt-6;
}

.custom-toggle-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm text-gray-600;
  @apply hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.custom-etf-form {
  @apply mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200;
}

.custom-etf-form h4 {
  @apply font-semibold text-gray-800 mb-4;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-4;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input,
.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.custom-form-actions {
  @apply flex gap-3;
}

.add-button {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply disabled:bg-gray-400 disabled:cursor-not-allowed;
  @apply transition-colors;
}

.cancel-button {
  @apply px-4 py-2 bg-gray-200 text-gray-700 rounded-md;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500;
  @apply transition-colors;
}

/* 信息面板 */
.info-panel {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-6;
}

.info-panel-header {
  @apply flex items-center justify-between mb-4;
}

.info-panel-header h4 {
  @apply font-semibold text-blue-900;
}

.close-button {
  @apply p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.info-content {
  @apply space-y-4;
}

.info-section h5 {
  @apply font-medium text-blue-900 mb-2;
}

.info-section p {
  @apply text-sm text-blue-800;
}

.rates-table {
  @apply space-y-2;
}

.rate-row {
  @apply flex justify-between items-center py-2 px-3 bg-white rounded border border-blue-200;
}

.rate-type {
  @apply text-sm text-gray-700;
}

.rate-percentage {
  @apply font-semibold text-blue-600;
}

.example-calculation {
  @apply bg-white rounded border border-blue-200 p-3 space-y-2;
}

.calc-row {
  @apply flex justify-between text-sm;
}

.calc-row.highlight {
  @apply font-semibold text-green-600 border-t border-gray-200 pt-2;
}

/* 选择摘要 */
.selection-summary {
  @apply bg-gray-50 border border-gray-200 rounded-lg p-4;
}

.summary-header {
  @apply flex items-center justify-between mb-3;
}

.summary-header h4 {
  @apply font-semibold text-gray-800;
}

.clear-button {
  @apply flex items-center gap-1 px-2 py-1 text-xs text-gray-500;
  @apply hover:text-gray-700 hover:bg-gray-200 rounded transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-500;
}

.summary-content {
  @apply space-y-3;
}

.summary-main {
  @apply flex items-center gap-3;
}

.summary-icon {
  @apply w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center;
}

.summary-info h5 {
  @apply font-medium text-gray-900;
}

.summary-info p {
  @apply text-sm text-gray-600;
}

.summary-details {
  @apply grid grid-cols-3 gap-4 text-sm;
}

.detail-item {
  @apply text-center;
}

.detail-label {
  @apply block text-gray-600 mb-1;
}

.detail-value {
  @apply font-semibold text-gray-900;
}

/* 过渡动画 */
.custom-form-expand-enter-active,
.custom-form-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.custom-form-expand-enter-from,
.custom-form-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.custom-form-expand-enter-to,
.custom-form-expand-leave-from {
  max-height: 400px;
  opacity: 1;
}

.info-panel-slide-enter-active,
.info-panel-slide-leave-active {
  transition: all 0.3s ease;
}

.info-panel-slide-enter-from,
.info-panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .etf-types-grid {
    @apply grid-cols-1;
  }

  .form-grid {
    @apply grid-cols-1;
  }

  .summary-details {
    @apply grid-cols-1 gap-2;
  }

  .detail-item {
    @apply text-left flex justify-between;
  }

  .custom-form-actions {
    @apply flex-col;
  }

  .add-button,
  .cancel-button {
    @apply w-full justify-center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .selector-title {
    @apply text-gray-100;
  }

  .etf-type-card {
    @apply bg-gray-800 border-gray-700;
  }

  .etf-type-card.selected {
    @apply bg-blue-900 border-blue-600;
  }

  .etf-type-card.recommended {
    @apply bg-green-900 border-green-700;
  }

  .etf-name {
    @apply text-gray-100;
  }

  .etf-description {
    @apply text-gray-300;
  }

  .rate-label,
  .savings-label,
  .risk-label {
    @apply text-gray-300;
  }

  .info-panel {
    @apply bg-blue-900 border-blue-700;
  }

  .info-panel-header h4,
  .info-section h5 {
    @apply text-blue-100;
  }

  .info-section p {
    @apply text-blue-200;
  }

  .rate-row,
  .example-calculation {
    @apply bg-gray-800 border-gray-700;
  }

  .rate-type {
    @apply text-gray-300;
  }

  .selection-summary {
    @apply bg-gray-800 border-gray-700;
  }

  .summary-header h4 {
    @apply text-gray-100;
  }

  .summary-info h5 {
    @apply text-gray-100;
  }

  .summary-info p {
    @apply text-gray-300;
  }

  .detail-label {
    @apply text-gray-300;
  }

  .detail-value {
    @apply text-gray-100;
  }

  .custom-etf-form {
    @apply bg-gray-800 border-gray-700;
  }

  .custom-etf-form h4 {
    @apply text-gray-100;
  }

  .form-input,
  .form-textarea {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }
}
</style>
