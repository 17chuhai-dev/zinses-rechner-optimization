<!--
  德国税收设置组件
  提供完整的德国税收配置界面，支持资本利得税、免税额度、ETF部分免税等设置
-->

<template>
  <div class="tax-settings">
    <!-- 页面标题 -->
    <div class="settings-header">
      <h2 class="settings-title">Steuereinstellungen</h2>
      <p class="settings-description">
        Konfigurieren Sie Ihre persönlichen Steuereinstellungen für eine präzise Berechnung
      </p>
    </div>

    <!-- 设置表单 -->
    <form @submit.prevent="saveTaxSettings" class="settings-form">
      <!-- 基本信息设置 -->
      <div class="settings-section">
        <h3 class="section-title">
          <Icon name="user" size="20" />
          Persönliche Angaben
        </h3>

        <div class="form-grid">
          <!-- 联邦州选择 -->
          <div class="form-group">
            <label class="form-label" for="federal-state">
              Bundesland
              <span class="required">*</span>
            </label>
            <select
              id="federal-state"
              v-model="settings.userInfo.state"
              @change="updateChurchTaxRate"
              class="form-select"
              required
            >
              <option value="">Bitte wählen...</option>
              <option v-for="state in germanStates" :key="state.code" :value="state.code">
                {{ state.name }}
              </option>
            </select>
            <p class="form-help">Ihr Bundesland bestimmt den Kirchensteuersatz</p>
          </div>

          <!-- 教会税类型 -->
          <div class="form-group">
            <label class="form-label" for="church-tax">
              Kirchensteuer
            </label>
            <select
              id="church-tax"
              v-model="settings.userInfo.churchTaxType"
              @change="updateChurchTaxRate"
              class="form-select"
            >
              <option value="none">Keine Kirchensteuer</option>
              <option value="catholic">Katholisch</option>
              <option value="protestant">Evangelisch</option>
              <option value="other">Andere Religionsgemeinschaft</option>
            </select>
            <p class="form-help">
              Kirchensteuersatz: {{ (settings.abgeltungssteuer.churchTax.rate * 100).toFixed(1) }}%
            </p>
          </div>

          <!-- 婚姻状况 -->
          <div class="form-group">
            <label class="form-label">
              Familienstand
            </label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  v-model="settings.userInfo.isMarried"
                  type="radio"
                  :value="false"
                  class="radio-input"
                />
                <span class="radio-text">Ledig</span>
              </label>
              <label class="radio-label">
                <input
                  v-model="settings.userInfo.isMarried"
                  type="radio"
                  :value="true"
                  class="radio-input"
                />
                <span class="radio-text">Verheiratet</span>
              </label>
            </div>
          </div>

          <!-- 税收年度 -->
          <div class="form-group">
            <label class="form-label" for="tax-year">
              Steuerjahr
            </label>
            <select
              id="tax-year"
              v-model="settings.userInfo.taxYear"
              class="form-select"
            >
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 资本利得税设置 -->
      <div class="settings-section">
        <h3 class="section-title">
          <Icon name="percent" size="20" />
          Abgeltungssteuer
        </h3>

        <div class="form-grid">
          <!-- 启用资本利得税 -->
          <div class="form-group full-width">
            <label class="checkbox-label">
              <input
                v-model="settings.abgeltungssteuer.enabled"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">Abgeltungssteuer aktivieren</span>
            </label>
            <p class="form-help">
              Die Abgeltungssteuer beträgt 25% auf Kapitalerträge
            </p>
          </div>

          <!-- 团结税 -->
          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="settings.abgeltungssteuer.calculation.includeSolidarityTax"
                type="checkbox"
                class="checkbox-input"
                :disabled="!settings.abgeltungssteuer.enabled"
              />
              <span class="checkbox-text">Solidaritätszuschlag (5,5%)</span>
            </label>
          </div>

          <!-- 教会税 -->
          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="settings.abgeltungssteuer.calculation.includeChurchTax"
                type="checkbox"
                class="checkbox-input"
                :disabled="!settings.abgeltungssteuer.enabled || settings.userInfo.churchTaxType === 'none'"
              />
              <span class="checkbox-text">
                Kirchensteuer ({{ (settings.abgeltungssteuer.churchTax.rate * 100).toFixed(1) }}%)
              </span>
            </label>
          </div>
        </div>

        <!-- 税收预览 -->
        <div v-if="settings.abgeltungssteuer.enabled" class="tax-preview">
          <h4 class="preview-title">Steuervorschau</h4>
          <div class="preview-content">
            <div class="preview-item">
              <span class="preview-label">Abgeltungssteuer:</span>
              <span class="preview-value">25,00%</span>
            </div>
            <div v-if="settings.abgeltungssteuer.calculation.includeSolidarityTax" class="preview-item">
              <span class="preview-label">Solidaritätszuschlag:</span>
              <span class="preview-value">5,50%</span>
            </div>
            <div v-if="settings.abgeltungssteuer.calculation.includeChurchTax" class="preview-item">
              <span class="preview-label">Kirchensteuer:</span>
              <span class="preview-value">{{ (settings.abgeltungssteuer.churchTax.rate * 100).toFixed(2) }}%</span>
            </div>
            <div class="preview-item total">
              <span class="preview-label">Gesamtsteuersatz:</span>
              <span class="preview-value">{{ totalTaxRate.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 免税额度设置 -->
      <div class="settings-section">
        <h3 class="section-title">
          <Icon name="shield" size="20" />
          Freistellungsauftrag
        </h3>

        <div class="form-grid">
          <!-- 启用免税额度 -->
          <div class="form-group full-width">
            <label class="checkbox-label">
              <input
                v-model="settings.freistellungsauftrag.enabled"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">Freistellungsauftrag nutzen</span>
            </label>
            <p class="form-help">
              Jährlicher Freibetrag von {{ settings.freistellungsauftrag.annualAllowance }}€ (seit 2023)
            </p>
          </div>

          <!-- 已使用额度 -->
          <div class="form-group">
            <label class="form-label" for="used-allowance">
              Bereits verwendeter Freibetrag
            </label>
            <div class="input-group">
              <input
                id="used-allowance"
                v-model.number="settings.freistellungsauftrag.usedAllowance"
                @input="updateRemainingAllowance"
                type="number"
                min="0"
                :max="settings.freistellungsauftrag.annualAllowance"
                step="0.01"
                class="form-input"
                :disabled="!settings.freistellungsauftrag.enabled"
              />
              <span class="input-suffix">€</span>
            </div>
          </div>

          <!-- 剩余额度 -->
          <div class="form-group">
            <label class="form-label">
              Verbleibender Freibetrag
            </label>
            <div class="allowance-display">
              <span class="allowance-amount">{{ settings.freistellungsauftrag.remainingAllowance.toFixed(2) }}€</span>
              <div class="allowance-bar">
                <div
                  class="allowance-used"
                  :style="{ width: allowanceUsagePercentage + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 免税额度分配 -->
        <div v-if="settings.freistellungsauftrag.enabled" class="allowance-allocations">
          <h4 class="allocations-title">Freibetrag-Verteilung</h4>
          <div class="allocations-list">
            <div
              v-for="(allocation, index) in settings.freistellungsauftrag.allocations"
              :key="allocation.id"
              class="allocation-item"
            >
              <div class="allocation-info">
                <input
                  v-model="allocation.bankName"
                  type="text"
                  placeholder="Bank/Depot"
                  class="allocation-bank"
                />
                <div class="allocation-amount">
                  <input
                    v-model.number="allocation.allocatedAmount"
                    @input="updateAllocationRemaining(index)"
                    type="number"
                    min="0"
                    step="0.01"
                    class="allocation-input"
                  />
                  <span class="allocation-suffix">€</span>
                </div>
              </div>
              <button
                @click="removeAllocation(index)"
                type="button"
                class="allocation-remove"
                :title="'Entfernen'"
              >
                <Icon name="x" size="16" />
              </button>
            </div>
          </div>
          <button
            @click="addAllocation"
            type="button"
            class="add-allocation-btn"
          >
            <Icon name="plus" size="16" />
            Neue Verteilung hinzufügen
          </button>
        </div>
      </div>

      <!-- ETF部分免税设置 -->
      <div class="settings-section">
        <h3 class="section-title">
          <Icon name="trending-up" size="20" />
          ETF Teilfreistellung
        </h3>

        <div class="form-grid">
          <!-- 启用ETF部分免税 -->
          <div class="form-group full-width">
            <label class="checkbox-label">
              <input
                v-model="settings.etfTeilfreistellung.enabled"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">ETF Teilfreistellung aktivieren</span>
            </label>
            <p class="form-help">
              Verschiedene ETF-Typen haben unterschiedliche Teilfreistellungssätze
            </p>
          </div>
        </div>

        <!-- ETF类型和免税比例 -->
        <div v-if="settings.etfTeilfreistellung.enabled" class="etf-exemptions">
          <h4 class="exemptions-title">Teilfreistellungssätze nach ETF-Typ</h4>
          <div class="exemptions-grid">
            <div
              v-for="(rate, etfType) in settings.etfTeilfreistellung.exemptionRates"
              :key="etfType"
              class="exemption-item"
            >
              <label class="exemption-label">{{ getETFTypeName(etfType) }}</label>
              <div class="exemption-rate">
                <span class="rate-value">{{ (rate * 100).toFixed(0) }}%</span>
                <div class="rate-bar">
                  <div class="rate-fill" :style="{ width: (rate * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <div class="settings-section">
        <h3 class="section-title">
          <Icon name="settings" size="20" />
          Erweiterte Einstellungen
        </h3>

        <div class="form-grid">
          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="settings.advanced.enableDetailedCalculation"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">Detaillierte Berechnung anzeigen</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="settings.advanced.showCalculationSteps"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">Berechnungsschritte anzeigen</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="settings.advanced.enableTaxOptimization"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">Steueroptimierung aktivieren</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="settings.advanced.autoSaveSettings"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">Einstellungen automatisch speichern</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="settings-actions">
        <button
          @click="resetToDefaults"
          type="button"
          class="action-button secondary"
        >
          <Icon name="rotate-ccw" size="16" />
          Zurücksetzen
        </button>

        <button
          @click="exportSettings"
          type="button"
          class="action-button secondary"
        >
          <Icon name="download" size="16" />
          Exportieren
        </button>

        <button
          type="submit"
          class="action-button primary"
          :disabled="!isFormValid || isSaving"
        >
          <Icon :name="isSaving ? 'loading' : 'save'" size="16" :class="{ 'animate-spin': isSaving }" />
          {{ isSaving ? 'Speichern...' : 'Einstellungen speichern' }}
        </button>
      </div>
    </form>

    <!-- 验证错误显示 -->
    <div v-if="validationErrors.length > 0" class="validation-errors">
      <h4 class="errors-title">Bitte korrigieren Sie folgende Fehler:</h4>
      <ul class="errors-list">
        <li v-for="error in validationErrors" :key="error" class="error-item">
          {{ error }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  TaxSettings,
  DEFAULT_TAX_SETTINGS,
  GermanState,
  ChurchTaxType,
  ETFType,
  CHURCH_TAX_RATES,
  FreistellungsauftragAllocation
} from '@/types/GermanTaxTypes'
import { validateTaxSettings } from '@/utils/germanTaxCalculations'
import Icon from '@/components/ui/Icon.vue'

// Props定义
interface Props {
  initialSettings?: TaxSettings
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// Emits定义
interface Emits {
  settingsChanged: [settings: TaxSettings]
  settingsSaved: [settings: TaxSettings]
  settingsReset: []
  validationError: [errors: string[]]
}

const emit = defineEmits<Emits>()

// 响应式数据
const settings = ref<TaxSettings>(props.initialSettings || { ...DEFAULT_TAX_SETTINGS })
const isSaving = ref(false)
const validationErrors = ref<string[]>([])

// 德国联邦州列表
const germanStates = [
  { code: GermanState.BADEN_WUERTTEMBERG, name: 'Baden-Württemberg' },
  { code: GermanState.BAYERN, name: 'Bayern' },
  { code: GermanState.BERLIN, name: 'Berlin' },
  { code: GermanState.BRANDENBURG, name: 'Brandenburg' },
  { code: GermanState.BREMEN, name: 'Bremen' },
  { code: GermanState.HAMBURG, name: 'Hamburg' },
  { code: GermanState.HESSEN, name: 'Hessen' },
  { code: GermanState.MECKLENBURG_VORPOMMERN, name: 'Mecklenburg-Vorpommern' },
  { code: GermanState.NIEDERSACHSEN, name: 'Niedersachsen' },
  { code: GermanState.NORDRHEIN_WESTFALEN, name: 'Nordrhein-Westfalen' },
  { code: GermanState.RHEINLAND_PFALZ, name: 'Rheinland-Pfalz' },
  { code: GermanState.SAARLAND, name: 'Saarland' },
  { code: GermanState.SACHSEN, name: 'Sachsen' },
  { code: GermanState.SACHSEN_ANHALT, name: 'Sachsen-Anhalt' },
  { code: GermanState.SCHLESWIG_HOLSTEIN, name: 'Schleswig-Holstein' },
  { code: GermanState.THUERINGEN, name: 'Thüringen' }
]

// 可用年份
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i)
})

// 计算属性
const totalTaxRate = computed(() => {
  let rate = 0

  if (settings.value.abgeltungssteuer.enabled) {
    rate += settings.value.abgeltungssteuer.baseTaxRate // 25%

    if (settings.value.abgeltungssteuer.calculation.includeSolidarityTax) {
      rate += settings.value.abgeltungssteuer.baseTaxRate * settings.value.abgeltungssteuer.solidarityTaxRate // 5.5% of 25%
    }

    if (settings.value.abgeltungssteuer.calculation.includeChurchTax) {
      rate += settings.value.abgeltungssteuer.baseTaxRate * settings.value.abgeltungssteuer.churchTax.rate // 8-9% of 25%
    }
  }

  return rate * 100
})

const allowanceUsagePercentage = computed(() => {
  const total = settings.value.freistellungsauftrag.annualAllowance
  const used = settings.value.freistellungsauftrag.usedAllowance
  return total > 0 ? (used / total) * 100 : 0
})

const isFormValid = computed(() => {
  return validationErrors.value.length === 0
})

// 方法
const updateChurchTaxRate = () => {
  const state = settings.value.userInfo.state
  const churchType = settings.value.userInfo.churchTaxType

  if (churchType === ChurchTaxType.NONE) {
    settings.value.abgeltungssteuer.churchTax.rate = 0
    settings.value.abgeltungssteuer.calculation.includeChurchTax = false
  } else {
    settings.value.abgeltungssteuer.churchTax.rate = CHURCH_TAX_RATES[state] || 0.09
  }

  settings.value.abgeltungssteuer.churchTax.type = churchType
  settings.value.abgeltungssteuer.churchTax.state = state
}

const updateRemainingAllowance = () => {
  const annual = settings.value.freistellungsauftrag.annualAllowance
  const used = settings.value.freistellungsauftrag.usedAllowance
  settings.value.freistellungsauftrag.remainingAllowance = Math.max(0, annual - used)
}

const addAllocation = () => {
  const newAllocation: FreistellungsauftragAllocation = {
    id: `allocation_${Date.now()}`,
    bankName: '',
    allocatedAmount: 0,
    usedAmount: 0,
    remainingAmount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  settings.value.freistellungsauftrag.allocations.push(newAllocation)
}

const removeAllocation = (index: number) => {
  settings.value.freistellungsauftrag.allocations.splice(index, 1)
}

const updateAllocationRemaining = (index: number) => {
  const allocation = settings.value.freistellungsauftrag.allocations[index]
  allocation.remainingAmount = Math.max(0, allocation.allocatedAmount - allocation.usedAmount)
  allocation.updatedAt = new Date()
}

const getETFTypeName = (etfType: string): string => {
  const names: Record<string, string> = {
    [ETFType.EQUITY_DOMESTIC]: 'Inländische Aktien-ETFs',
    [ETFType.EQUITY_FOREIGN]: 'Ausländische Aktien-ETFs',
    [ETFType.MIXED_FUND]: 'Mischfonds',
    [ETFType.BOND_FUND]: 'Rentenfonds',
    [ETFType.REAL_ESTATE]: 'Immobilienfonds',
    [ETFType.COMMODITY]: 'Rohstofffonds',
    [ETFType.OTHER]: 'Sonstige'
  }
  return names[etfType] || etfType
}

const validateSettings = () => {
  const validation = validateTaxSettings(settings.value)
  validationErrors.value = validation.errors

  if (!validation.isValid) {
    emit('validationError', validation.errors)
  }

  return validation.isValid
}

const saveTaxSettings = async () => {
  if (!validateSettings()) {
    return
  }

  isSaving.value = true

  try {
    // 更新元数据
    settings.value.metadata.updatedAt = new Date()
    settings.value.metadata.lastUsed = new Date()

    // 这里可以添加实际的保存逻辑，比如发送到服务器或保存到localStorage
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟保存延迟

    emit('settingsSaved', settings.value)
    console.log('✅ 税收设置已保存')

  } catch (error) {
    console.error('❌ 保存税收设置失败:', error)
  } finally {
    isSaving.value = false
  }
}

const resetToDefaults = () => {
  settings.value = { ...DEFAULT_TAX_SETTINGS }
  validationErrors.value = []
  emit('settingsReset')
  console.log('🔄 税收设置已重置为默认值')
}

const exportSettings = () => {
  const dataStr = JSON.stringify(settings.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `steuereinstellungen_${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(url)
  console.log('📥 税收设置已导出')
}

// 监听器
watch(settings, (newSettings) => {
  emit('settingsChanged', newSettings)

  if (newSettings.advanced.autoSaveSettings) {
    validateSettings()
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  updateChurchTaxRate()
  updateRemainingAllowance()
  validateSettings()
})
</script>

<style scoped>
.tax-settings {
  @apply max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm;
}

.settings-header {
  @apply mb-8 text-center;
}

.settings-title {
  @apply text-3xl font-bold text-gray-900 mb-2;
  margin: 0;
}

.settings-description {
  @apply text-lg text-gray-600;
  margin: 0;
}

.settings-form {
  @apply space-y-8;
}

.settings-section {
  @apply bg-gray-50 rounded-lg p-6;
}

.section-title {
  @apply flex items-center gap-3 text-xl font-semibold text-gray-900 mb-4;
  margin: 0;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.form-group {
  @apply space-y-2;
}

.form-group.full-width {
  @apply md:col-span-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.required {
  @apply text-red-500;
}

.form-select,
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply disabled:bg-gray-100 disabled:cursor-not-allowed;
}

.form-help {
  @apply text-xs text-gray-500;
  margin: 0;
}

.input-group {
  @apply relative;
}

.input-suffix {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm;
}

.radio-group {
  @apply flex gap-4;
}

.radio-label {
  @apply flex items-center gap-2 cursor-pointer;
}

.radio-input {
  @apply text-blue-600 focus:ring-blue-500;
}

.radio-text {
  @apply text-sm text-gray-700;
}

.checkbox-label {
  @apply flex items-center gap-3 cursor-pointer;
}

.checkbox-input {
  @apply rounded text-blue-600 focus:ring-blue-500;
}

.checkbox-text {
  @apply text-sm text-gray-700;
}

/* 税收预览 */
.tax-preview {
  @apply mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200;
}

.preview-title {
  @apply text-lg font-semibold text-blue-900 mb-3;
  margin: 0;
}

.preview-content {
  @apply space-y-2;
}

.preview-item {
  @apply flex justify-between items-center text-sm;
}

.preview-item.total {
  @apply pt-2 border-t border-blue-200 font-semibold text-blue-900;
}

.preview-label {
  @apply text-blue-700;
}

.preview-value {
  @apply text-blue-900 font-medium;
}

/* 免税额度显示 */
.allowance-display {
  @apply space-y-2;
}

.allowance-amount {
  @apply text-lg font-semibold text-green-600;
}

.allowance-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.allowance-used {
  @apply h-full bg-green-500 transition-all duration-300;
}

/* 免税额度分配 */
.allowance-allocations {
  @apply mt-6;
}

.allocations-title {
  @apply text-lg font-semibold text-gray-900 mb-4;
  margin: 0;
}

.allocations-list {
  @apply space-y-3;
}

.allocation-item {
  @apply flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200;
}

.allocation-info {
  @apply flex-1 flex gap-3;
}

.allocation-bank {
  @apply flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.allocation-amount {
  @apply relative;
}

.allocation-input {
  @apply w-24 px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm text-right;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.allocation-suffix {
  @apply absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs;
}

.allocation-remove {
  @apply p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-red-500;
}

.add-allocation-btn {
  @apply flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700;
  @apply hover:bg-blue-50 rounded-md border border-dashed border-blue-300;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

/* ETF免税设置 */
.etf-exemptions {
  @apply mt-6;
}

.exemptions-title {
  @apply text-lg font-semibold text-gray-900 mb-4;
  margin: 0;
}

.exemptions-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.exemption-item {
  @apply p-4 bg-white rounded-lg border border-gray-200;
}

.exemption-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.exemption-rate {
  @apply flex items-center gap-3;
}

.rate-value {
  @apply text-lg font-semibold text-green-600 min-w-[3rem];
}

.rate-bar {
  @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.rate-fill {
  @apply h-full bg-green-500 transition-all duration-300;
}

/* 操作按钮 */
.settings-actions {
  @apply flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-200;
}

.action-button {
  @apply inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  transition: all 0.2s ease;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.action-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}

/* 验证错误 */
.validation-errors {
  @apply mt-6 p-4 bg-red-50 border border-red-200 rounded-lg;
}

.errors-title {
  @apply text-lg font-semibold text-red-800 mb-3;
  margin: 0;
}

.errors-list {
  @apply space-y-1;
  margin: 0;
  padding-left: 1rem;
}

.error-item {
  @apply text-sm text-red-700;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tax-settings {
    @apply p-4;
  }

  .form-grid {
    @apply grid-cols-1;
  }

  .settings-actions {
    @apply flex-col;
  }

  .action-button {
    @apply w-full justify-center;
  }

  .allocation-info {
    @apply flex-col gap-2;
  }

  .allocation-amount {
    @apply self-start;
  }

  .exemptions-grid {
    @apply grid-cols-1;
  }
}

/* 动画效果 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
