<template>
  <div class="tax-settings bg-white rounded-lg shadow-lg p-6">
    <!-- 标题和开关 -->
    <div class="settings-header mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">
            🇩🇪 Deutsche Steuern berücksichtigen
          </h3>
          <p class="text-sm text-gray-600">
            Berechnung der Abgeltungssteuer und weiterer Steuern
          </p>
        </div>

        <div class="flex items-center">
          <input
            id="tax-enabled"
            v-model="settings.enabled"
            type="checkbox"
            class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            @change="onEnabledChange"
          />
          <label for="tax-enabled" class="ml-2 text-sm font-medium text-gray-900">
            Aktivieren
          </label>
        </div>
      </div>
    </div>

    <!-- 税务设置详情 -->
    <Transition name="slide-down">
      <div v-show="settings.enabled" class="tax-details space-y-6">

        <!-- 婚姻状况 -->
        <div class="setting-group">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Familienstand
          </label>
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input
                v-model="settings.isMarried"
                :value="false"
                type="radio"
                name="marital-status"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <span class="ml-2 text-sm text-gray-700">Alleinstehend</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="settings.isMarried"
                :value="true"
                type="radio"
                name="marital-status"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <span class="ml-2 text-sm text-gray-700">Verheiratet</span>
            </label>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Sparerpauschbetrag: {{ settings.isMarried ? '2.000€' : '1.000€' }} (2023)
          </p>
        </div>

        <!-- 教会税设置 -->
        <div class="setting-group">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-gray-700">
              Kirchensteuer
            </label>
            <input
              v-model="settings.hasKirchensteuer"
              type="checkbox"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>

          <div v-if="settings.hasKirchensteuer" class="space-y-3">
            <div>
              <label class="block text-sm text-gray-600 mb-2">Bundesland</label>
              <select
                v-model="settings.bundesland"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                @change="updateKirchensteuerRate"
              >
                <option value="">Bundesland wählen</option>
                <option v-for="state in germanStates" :key="state.code" :value="state.name">
                  {{ state.name }}
                </option>
              </select>
            </div>

            <div v-if="settings.bundesland">
              <p class="text-xs text-gray-500">
                Kirchensteuersatz: {{ formatPercentage(settings.kirchensteuerRate) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 税务信息预览 -->
        <div class="tax-preview bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 class="text-sm font-medium text-blue-900 mb-3">
            📊 Steuerliche Übersicht
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div class="flex justify-between">
              <span class="text-blue-700">Abgeltungssteuer:</span>
              <span class="font-medium text-blue-900">25%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700">Solidaritätszuschlag:</span>
              <span class="font-medium text-blue-900">5,5%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700">Sparerpauschbetrag:</span>
              <span class="font-medium text-blue-900">
                {{ settings.isMarried ? '2.000€' : '1.000€' }}
              </span>
            </div>
            <div v-if="settings.hasKirchensteuer" class="flex justify-between">
              <span class="text-blue-700">Kirchensteuer:</span>
              <span class="font-medium text-blue-900">
                {{ formatPercentage(settings.kirchensteuerRate) }}
              </span>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-blue-200">
            <div class="flex justify-between font-medium">
              <span class="text-blue-700">Effektiver Steuersatz:</span>
              <span class="text-blue-900">{{ effectiveTaxRate }}</span>
            </div>
          </div>
        </div>

        <!-- 税务说明 -->
        <div class="tax-explanation">
          <details class="group">
            <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center">
              <ChevronRightIcon class="w-4 h-4 mr-1 transform group-open:rotate-90 transition-transform" />
              Steuerliche Hinweise
            </summary>

            <div class="mt-3 pl-5 text-sm text-gray-600 space-y-2">
              <p>
                <strong>Abgeltungssteuer:</strong> 25% auf Kapitalerträge über dem Sparerpauschbetrag.
                Die Bank führt diese automatisch ab.
              </p>
              <p>
                <strong>Solidaritätszuschlag:</strong> 5,5% auf die Abgeltungssteuer.
                Entfällt bei geringen Einkommen.
              </p>
              <p v-if="settings.hasKirchensteuer">
                <strong>Kirchensteuer:</strong> {{ formatPercentage(settings.kirchensteuerRate) }}
                auf die Abgeltungssteuer. Variiert je nach Bundesland.
              </p>
              <p>
                <strong>Sparerpauschbetrag:</strong> Jährlicher Freibetrag für Kapitalerträge.
                2023 erhöht auf {{ settings.isMarried ? '2.000€' : '1.000€' }}.
              </p>
            </div>
          </details>
        </div>

        <!-- 免责声明 -->
        <div class="disclaimer bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start">
            <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div class="text-sm text-yellow-800">
              <p class="font-medium mb-1">Wichtiger Hinweis</p>
              <p>
                Diese Steuerberechnung dient nur der groben Orientierung. Tatsächliche
                Steuerbelastungen können aufgrund individueller Umstände abweichen.
                Konsultieren Sie einen Steuerberater für verbindliche Beratung.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { GermanTaxService, type TaxSettings } from '@/services/germanTaxService'

interface Props {
  modelValue: TaxSettings & { enabled: boolean }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: TaxSettings & { enabled: boolean }]
}>()

// 本地状态
const settings = ref<TaxSettings & { enabled: boolean }>({
  ...props.modelValue,
  enabled: props.modelValue?.enabled ?? false,
  hasKirchensteuer: props.modelValue?.hasKirchensteuer ?? false,
  kirchensteuerRate: props.modelValue?.kirchensteuerRate ?? 0.09,
  bundesland: props.modelValue?.bundesland ?? '',
  isMarried: props.modelValue?.isMarried ?? false
})

// 德国各州数据
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
const effectiveTaxRate = computed(() => {
  if (!settings.value.enabled) return '0%'

  let rate = 25 // Abgeltungssteuer
  rate += 25 * 0.055 // Solidaritätszuschlag

  if (settings.value.hasKirchensteuer) {
    rate += 25 * settings.value.kirchensteuerRate
  }

  return `~${rate.toFixed(1)}%`
})

// 方法
const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

const updateKirchensteuerRate = () => {
  if (settings.value.bundesland) {
    settings.value.kirchensteuerRate = GermanTaxService.getKirchensteuerRate(settings.value.bundesland)
  }
}

const onEnabledChange = () => {
  if (!settings.value.enabled) {
    // 重置所有设置
    settings.value.hasKirchensteuer = false
    settings.value.bundesland = ''
    settings.value.isMarried = false
  }
}

// 监听变化并发出事件
watch(settings, (newSettings) => {
  emit('update:modelValue', { ...newSettings })
}, { deep: true })

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  settings.value = { ...newValue }
}, { deep: true })
</script>

<style scoped>
/* 滑动动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 设置组样式 */
.setting-group {
  @apply border-b border-gray-100 pb-4 last:border-b-0 last:pb-0;
}

/* 单选按钮和复选框样式 */
input[type="radio"]:checked,
input[type="checkbox"]:checked {
  @apply bg-blue-600 border-blue-600;
}

/* 选择框样式 */
select {
  @apply appearance-none bg-white;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

/* 详情展开动画 */
details[open] summary ~ * {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
