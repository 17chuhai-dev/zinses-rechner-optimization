<template>
  <div class="goal-wizard">
    <BaseCard title="Neues Finanzziel erstellen" padding="lg">
      <!-- 进度指示器 -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            class="flex items-center"
            :class="{ 'flex-1': index < steps.length - 1 }"
          >
            <div
              class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200"
              :class="[
                currentStep >= index + 1
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              ]"
            >
              <BaseIcon
                v-if="currentStep > index + 1"
                name="check"
                size="sm"
              />
              <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
            </div>

            <div v-if="index < steps.length - 1" class="flex-1 h-0.5 mx-4 bg-gray-200">
              <div
                class="h-full bg-blue-600 transition-all duration-300"
                :style="{ width: currentStep > index + 1 ? '100%' : '0%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ steps[currentStep - 1]?.title }}
          </h3>
          <p class="text-sm text-gray-600">
            {{ steps[currentStep - 1]?.description }}
          </p>
        </div>
      </div>

      <!-- 步骤内容 -->
      <div class="min-h-96">
        <!-- 步骤1：目标类型选择 -->
        <div v-if="currentStep === 1" class="space-y-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">
            Welches Finanzziel möchten Sie erreichen?
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="goalType in goalTypes"
              :key="goalType.id"
              class="relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
              :class="[
                formData.type === goalType.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
              @click="formData.type = goalType.id"
            >
              <div class="flex items-center space-x-3 mb-3">
                <BaseIcon :name="goalType.icon" class="text-blue-600" size="lg" />
                <h5 class="font-semibold text-gray-900">{{ goalType.name }}</h5>
              </div>

              <p class="text-sm text-gray-600 mb-3">{{ goalType.description }}</p>

              <div class="text-xs text-gray-500">
                <span class="font-medium">Typische Dauer:</span> {{ goalType.typicalDuration }}
              </div>

              <!-- 选中指示器 -->
              <div
                v-if="formData.type === goalType.id"
                class="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
              >
                <BaseIcon name="check" size="xs" class="text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤2：基本信息 -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="formData.name"
              label="Zielname"
              placeholder="z.B. Eigenheim kaufen"
              required
              :error-message="errors.name"
            />

            <BaseSelect
              v-model="formData.priority"
              label="Priorität"
              :options="priorityOptions"
              required
            />
          </div>

          <BaseInput
            v-model="formData.description"
            type="textarea"
            label="Beschreibung (optional)"
            placeholder="Beschreiben Sie Ihr Ziel genauer..."
            :rows="3"
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="formData.targetAmount"
              type="currency"
              label="Zielbetrag"
              placeholder="€0"
              required
              :error-message="errors.targetAmount"
            />

            <BaseInput
              v-model="formData.currentAmount"
              type="currency"
              label="Bereits gespart"
              placeholder="€0"
            />
          </div>
        </div>

        <!-- 步骤3：时间规划 -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="formData.targetDate"
              type="date"
              label="Zieldatum"
              required
              :error-message="errors.targetDate"
            />

            <BaseInput
              v-model="formData.monthlyContribution"
              type="currency"
              label="Monatliche Einzahlung"
              placeholder="€0"
              required
              :error-message="errors.monthlyContribution"
            />
          </div>

          <!-- 时间线预览 -->
          <div v-if="timelinePreview" class="bg-gray-50 p-6 rounded-lg">
            <h5 class="font-medium text-gray-900 mb-4">Zeitplan-Vorschau</h5>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">
                  {{ timelinePreview.monthsRemaining }}
                </div>
                <div class="text-sm text-gray-600">Monate verbleibend</div>
              </div>

              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">
                  €{{ timelinePreview.totalContributions.toLocaleString('de-DE') }}
                </div>
                <div class="text-sm text-gray-600">Gesamteinzahlungen</div>
              </div>

              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">
                  €{{ timelinePreview.projectedAmount.toLocaleString('de-DE') }}
                </div>
                <div class="text-sm text-gray-600">Voraussichtlicher Endbetrag</div>
              </div>
            </div>

            <!-- 进度条 -->
            <div class="mt-4">
              <div class="flex justify-between text-sm text-gray-600 mb-1">
                <span>Fortschritt</span>
                <span>{{ (timelinePreview.progress * 100).toFixed(1) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${timelinePreview.progress * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- 警告或建议 -->
            <div v-if="timelinePreview.warning" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div class="flex items-start space-x-2">
                <BaseIcon name="exclamation-triangle" class="text-yellow-600 mt-0.5" size="sm" />
                <div class="text-sm text-yellow-800">
                  {{ timelinePreview.warning }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤4：德国特定设置 -->
        <div v-if="currentStep === 4" class="space-y-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">
            Deutsche Steuer- und Sozialversicherungsoptionen
          </h4>

          <div class="space-y-4">
            <!-- 税收优惠 -->
            <div class="flex items-start space-x-3">
              <input
                id="taxAdvantaged"
                v-model="formData.taxAdvantaged"
                type="checkbox"
                class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <label for="taxAdvantaged" class="text-sm font-medium text-gray-900">
                  Steuerlich begünstigt
                </label>
                <p class="text-sm text-gray-600">
                  z.B. Riester-Rente, betriebliche Altersvorsorge, vermögenswirksame Leistungen
                </p>
              </div>
            </div>

            <!-- 雇主匹配 -->
            <div v-if="formData.type === 'retirement'" class="space-y-2">
              <BaseInput
                v-model="formData.employerMatch"
                type="currency"
                label="Arbeitgeberzuschuss (monatlich)"
                placeholder="€0"
                help-text="Betrag, den Ihr Arbeitgeber monatlich dazugibt"
              />
            </div>

            <!-- 通胀调整 -->
            <div class="flex items-start space-x-3">
              <input
                id="inflationAdjusted"
                v-model="formData.inflationAdjusted"
                type="checkbox"
                class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <label for="inflationAdjusted" class="text-sm font-medium text-gray-900">
                  Inflationsanpassung
                </label>
                <p class="text-sm text-gray-600">
                  Berücksichtigt die durchschnittliche Inflation von 2% pro Jahr
                </p>
              </div>
            </div>
          </div>

          <!-- 德国金融建议 -->
          <div class="bg-blue-50 p-4 rounded-lg">
            <h5 class="font-medium text-blue-900 mb-2">💡 Tipp für Deutschland</h5>
            <div class="text-sm text-blue-800 space-y-1">
              <p v-if="formData.type === 'retirement'">
                • Nutzen Sie die staatliche Förderung der Riester-Rente
              </p>
              <p v-if="formData.type === 'house'">
                • Prüfen Sie KfW-Förderprogramme für Immobilienkauf
              </p>
              <p v-if="formData.type === 'education'">
                • BAföG und Bildungskredite können Ihre Finanzierung ergänzen
              </p>
              <p>
                • Berücksichtigen Sie die Abgeltungssteuer von 25% auf Kapitalerträge
              </p>
            </div>
          </div>
        </div>

        <!-- 步骤5：确认和总结 -->
        <div v-if="currentStep === 5" class="space-y-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">
            Zusammenfassung Ihres Finanzziels
          </h4>

          <div class="bg-gray-50 p-6 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 class="font-medium text-gray-900 mb-3">Grunddaten</h5>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Zielname:</span>
                    <span class="font-medium">{{ formData.name }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Typ:</span>
                    <span class="font-medium">{{ formData.type ? getGoalTypeName(formData.type) : '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Priorität:</span>
                    <span class="font-medium">{{ getPriorityName(formData.priority) }}</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 class="font-medium text-gray-900 mb-3">Finanzdaten</h5>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Zielbetrag:</span>
                    <span class="font-medium">€{{ formData.targetAmount.toLocaleString('de-DE') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Bereits gespart:</span>
                    <span class="font-medium">€{{ formData.currentAmount.toLocaleString('de-DE') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Monatlich:</span>
                    <span class="font-medium">€{{ formData.monthlyContribution.toLocaleString('de-DE') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Zieldatum:</span>
                    <span class="font-medium">{{ formatDate(formData.targetDate) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 预测结果 -->
            <div v-if="finalPreview" class="mt-6 pt-6 border-t border-gray-200">
              <h5 class="font-medium text-gray-900 mb-3">Prognose</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center p-3 bg-white rounded-md">
                  <div class="text-lg font-bold text-blue-600">
                    {{ finalPreview.monthsRemaining }}
                  </div>
                  <div class="text-xs text-gray-600">Monate bis zum Ziel</div>
                </div>

                <div class="text-center p-3 bg-white rounded-md">
                  <div class="text-lg font-bold text-green-600">
                    €{{ finalPreview.projectedAmount.toLocaleString('de-DE') }}
                  </div>
                  <div class="text-xs text-gray-600">Voraussichtlicher Endbetrag</div>
                </div>

                <div class="text-center p-3 bg-white rounded-md">
                  <div class="text-lg font-bold" :class="finalPreview.onTrack ? 'text-green-600' : 'text-red-600'">
                    {{ finalPreview.onTrack ? '✓' : '⚠' }}
                  </div>
                  <div class="text-xs text-gray-600">
                    {{ finalPreview.onTrack ? 'Ziel erreichbar' : 'Anpassung nötig' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导航按钮 -->
      <div class="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <BaseButton
          variant="secondary"
          :disabled="currentStep === 1"
          @click="previousStep"
        >
          <BaseIcon name="arrow-left" size="sm" class="mr-2" />
          Zurück
        </BaseButton>

        <div class="text-sm text-gray-500">
          Schritt {{ currentStep }} von {{ steps.length }}
        </div>

        <BaseButton
          v-if="currentStep < steps.length"
          variant="primary"
          :disabled="!canProceed"
          @click="nextStep"
        >
          Weiter
          <BaseIcon name="arrow-right" size="sm" class="ml-2" />
        </BaseButton>

        <BaseButton
          v-else
          variant="primary"
          :loading="isCreating"
          :disabled="!canProceed"
          @click="createGoal"
        >
          <BaseIcon name="check" size="sm" class="mr-2" />
          Ziel erstellen
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { financialGoalService, type FinancialGoal, type GoalType, type GoalPriority } from '@/services/FinancialGoalService'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseSelect from '../ui/BaseSelect.vue'

interface Emits {
  (e: 'goal-created', goal: FinancialGoal): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 状态管理
const currentStep = ref(1)
const isCreating = ref(false)

// 表单数据
const formData = ref({
  name: '',
  type: undefined as GoalType | undefined,
  description: '',
  targetAmount: 0,
  currentAmount: 0,
  targetDate: '',
  monthlyContribution: 0,
  priority: 'medium' as GoalPriority,
  taxAdvantaged: false,
  employerMatch: 0,
  inflationAdjusted: true
})

// 错误状态
const errors = ref({
  name: '',
  targetAmount: '',
  targetDate: '',
  monthlyContribution: ''
})

// 步骤配置
const steps = [
  {
    id: 1,
    title: 'Zieltyp wählen',
    description: 'Wählen Sie die Art Ihres Finanzziels'
  },
  {
    id: 2,
    title: 'Grunddaten',
    description: 'Name, Betrag und Priorität festlegen'
  },
  {
    id: 3,
    title: 'Zeitplanung',
    description: 'Zieldatum und monatliche Beiträge'
  },
  {
    id: 4,
    title: 'Deutsche Optionen',
    description: 'Steuer- und Förderoptionen'
  },
  {
    id: 5,
    title: 'Bestätigung',
    description: 'Zusammenfassung und Erstellung'
  }
]

// 目标类型配置
const goalTypes = [
  {
    id: 'retirement' as GoalType,
    name: 'Altersvorsorge',
    description: 'Für einen sorgenfreien Ruhestand sparen',
    icon: 'user-group',
    typicalDuration: '20-40 Jahre'
  },
  {
    id: 'house' as GoalType,
    name: 'Eigenheim',
    description: 'Eigenkapital für Immobilienkauf ansparen',
    icon: 'home',
    typicalDuration: '5-15 Jahre'
  },
  {
    id: 'education' as GoalType,
    name: 'Bildung',
    description: 'Studium oder Weiterbildung finanzieren',
    icon: 'academic-cap',
    typicalDuration: '3-10 Jahre'
  },
  {
    id: 'emergency' as GoalType,
    name: 'Notgroschen',
    description: 'Finanzielle Sicherheit für Notfälle',
    icon: 'shield-check',
    typicalDuration: '1-3 Jahre'
  },
  {
    id: 'vacation' as GoalType,
    name: 'Urlaub',
    description: 'Traumreise oder Sabbatical finanzieren',
    icon: 'globe-alt',
    typicalDuration: '1-5 Jahre'
  },
  {
    id: 'custom' as GoalType,
    name: 'Sonstiges',
    description: 'Individuelles Sparziel definieren',
    icon: 'star',
    typicalDuration: 'Variabel'
  }
]

// 优先级选项
const priorityOptions = [
  { value: 'high', label: 'Hoch' },
  { value: 'medium', label: 'Mittel' },
  { value: 'low', label: 'Niedrig' }
]

// 计算属性
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.value.type !== undefined
    case 2:
      return formData.value.name.trim() !== '' && formData.value.targetAmount > 0
    case 3:
      return formData.value.targetDate !== '' && formData.value.monthlyContribution > 0
    case 4:
      return true // 德国选项都是可选的
    case 5:
      return true
    default:
      return false
  }
})

const timelinePreview = computed(() => {
  if (!formData.value.targetDate || !formData.value.monthlyContribution) return null

  const targetDate = new Date(formData.value.targetDate)
  const now = new Date()
  const monthsRemaining = Math.max(0,
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth())
  )

  const totalContributions = formData.value.currentAmount +
    (formData.value.monthlyContribution * monthsRemaining)

  // 简化的复利计算
  const monthlyRate = 0.04 / 12 // 4% 年利率
  let projectedAmount = formData.value.currentAmount * Math.pow(1 + monthlyRate, monthsRemaining)

  if (formData.value.monthlyContribution > 0) {
    projectedAmount += formData.value.monthlyContribution *
      ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate)
  }

  const progress = formData.value.targetAmount > 0 ?
    Math.min(1, projectedAmount / formData.value.targetAmount) : 0

  let warning = ''
  if (projectedAmount < formData.value.targetAmount * 0.9) {
    const shortfall = formData.value.targetAmount - projectedAmount
    warning = `Mit den aktuellen Einstellungen erreichen Sie Ihr Ziel möglicherweise nicht. Fehlbetrag: €${shortfall.toLocaleString('de-DE')}`
  }

  return {
    monthsRemaining,
    totalContributions,
    projectedAmount,
    progress,
    warning
  }
})

const finalPreview = computed(() => {
  if (!timelinePreview.value) return null

  return {
    monthsRemaining: timelinePreview.value.monthsRemaining,
    projectedAmount: timelinePreview.value.projectedAmount,
    onTrack: timelinePreview.value.progress >= 0.95
  }
})

// 方法
const nextStep = () => {
  if (validateCurrentStep() && currentStep.value < steps.length) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const validateCurrentStep = (): boolean => {
  clearErrors()

  switch (currentStep.value) {
    case 2:
      if (!formData.value.name.trim()) {
        errors.value.name = 'Bitte geben Sie einen Namen für Ihr Ziel ein'
        return false
      }
      if (formData.value.targetAmount <= 0) {
        errors.value.targetAmount = 'Der Zielbetrag muss größer als 0 sein'
        return false
      }
      break

    case 3:
      if (!formData.value.targetDate) {
        errors.value.targetDate = 'Bitte wählen Sie ein Zieldatum'
        return false
      }

      const targetDate = new Date(formData.value.targetDate)
      const now = new Date()
      if (targetDate <= now) {
        errors.value.targetDate = 'Das Zieldatum muss in der Zukunft liegen'
        return false
      }

      if (formData.value.monthlyContribution <= 0) {
        errors.value.monthlyContribution = 'Die monatliche Einzahlung muss größer als 0 sein'
        return false
      }
      break
  }

  return true
}

const clearErrors = () => {
  errors.value = {
    name: '',
    targetAmount: '',
    targetDate: '',
    monthlyContribution: ''
  }
}

const createGoal = async () => {
  if (!validateCurrentStep() || !formData.value.type) return

  isCreating.value = true

  try {
    const goalData = {
      name: formData.value.name,
      type: formData.value.type,
      description: formData.value.description,
      targetAmount: formData.value.targetAmount,
      currentAmount: formData.value.currentAmount,
      targetDate: new Date(formData.value.targetDate),
      startDate: new Date(),
      monthlyContribution: formData.value.monthlyContribution,
      priority: formData.value.priority,
      status: 'active' as const,
      tags: [],
      taxAdvantaged: formData.value.taxAdvantaged,
      employerMatch: formData.value.employerMatch,
      inflationAdjusted: formData.value.inflationAdjusted
    }

    const goal = await financialGoalService.createGoal(goalData)
    emit('goal-created', goal)
  } catch (error) {
    console.error('Failed to create goal:', error)
  } finally {
    isCreating.value = false
  }
}

const getGoalTypeName = (type: GoalType): string => {
  return goalTypes.find(gt => gt.id === type)?.name || type
}

const getPriorityName = (priority: GoalPriority): string => {
  return priorityOptions.find(p => p.value === priority)?.label || priority
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 监听表单变化，清除相关错误
watch(() => formData.value.name, () => {
  if (errors.value.name) errors.value.name = ''
})

watch(() => formData.value.targetAmount, () => {
  if (errors.value.targetAmount) errors.value.targetAmount = ''
})

watch(() => formData.value.targetDate, () => {
  if (errors.value.targetDate) errors.value.targetDate = ''
})

watch(() => formData.value.monthlyContribution, () => {
  if (errors.value.monthlyContribution) errors.value.monthlyContribution = ''
})
</script>

<style scoped>
.goal-wizard {
  @apply max-w-4xl mx-auto;
}

/* 步骤指示器动画 */
.goal-wizard .transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* 目标类型卡片悬停效果 */
.goal-wizard .cursor-pointer:hover {
  transform: translateY(-2px);
}
</style>
