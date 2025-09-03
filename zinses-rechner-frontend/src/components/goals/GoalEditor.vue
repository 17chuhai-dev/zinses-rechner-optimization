<template>
  <div class="goal-editor">
    <BaseCard title="Ziel bearbeiten" padding="lg">
      <form @submit.prevent="saveGoal" class="space-y-6">
        <!-- 基本信息 -->
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
        
        <!-- 财务信息 -->
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
        
        <!-- 时间和贡献 -->
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
        
        <!-- 状态 -->
        <BaseSelect
          v-model="formData.status"
          label="Status"
          :options="statusOptions"
          required
        />
        
        <!-- 德国特定选项 -->
        <div class="space-y-4">
          <h4 class="text-md font-medium text-gray-900">Deutsche Optionen</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  z.B. Riester-Rente, betriebliche Altersvorsorge
                </p>
              </div>
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
                  Berücksichtigt 2% Inflation pro Jahr
                </p>
              </div>
            </div>
          </div>
          
          <!-- 雇主匹配（仅退休目标） -->
          <div v-if="formData.type === 'retirement'">
            <BaseInput
              v-model="formData.employerMatch"
              type="currency"
              label="Arbeitgeberzuschuss (monatlich)"
              placeholder="€0"
              help-text="Betrag, den Ihr Arbeitgeber monatlich dazugibt"
            />
          </div>
        </div>
        
        <!-- 标签管理 -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">Tags</label>
          
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="(tag, index) in formData.tags"
              :key="index"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {{ tag }}
              <button
                type="button"
                class="ml-2 text-blue-600 hover:text-blue-800"
                @click="removeTag(index)"
              >
                <BaseIcon name="x" size="xs" />
              </button>
            </span>
          </div>
          
          <div class="flex space-x-2">
            <BaseInput
              v-model="newTag"
              placeholder="Neuen Tag hinzufügen..."
              class="flex-1"
              @keyup.enter="addTag"
            />
            <BaseButton
              type="button"
              variant="secondary"
              size="sm"
              @click="addTag"
            >
              Hinzufügen
            </BaseButton>
          </div>
        </div>
        
        <!-- 备注 -->
        <BaseInput
          v-model="formData.notes"
          type="textarea"
          label="Notizen (optional)"
          placeholder="Zusätzliche Notizen zu diesem Ziel..."
          :rows="3"
        />
        
        <!-- 预览信息 -->
        <div v-if="previewData" class="bg-gray-50 p-4 rounded-lg">
          <h5 class="font-medium text-gray-900 mb-3">Aktualisierte Prognose</h5>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-lg font-bold text-blue-600">
                {{ previewData.monthsRemaining }}
              </div>
              <div class="text-sm text-gray-600">Monate verbleibend</div>
            </div>
            
            <div class="text-center">
              <div class="text-lg font-bold text-green-600">
                €{{ previewData.projectedAmount.toLocaleString('de-DE') }}
              </div>
              <div class="text-sm text-gray-600">Voraussichtlicher Endbetrag</div>
            </div>
            
            <div class="text-center">
              <div class="text-lg font-bold" :class="previewData.onTrack ? 'text-green-600' : 'text-red-600'">
                {{ previewData.onTrack ? '✓' : '⚠' }}
              </div>
              <div class="text-sm text-gray-600">
                {{ previewData.onTrack ? 'Ziel erreichbar' : 'Anpassung empfohlen' }}
              </div>
            </div>
          </div>
          
          <!-- 警告或建议 -->
          <div v-if="previewData.warning" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div class="flex items-start space-x-2">
              <BaseIcon name="exclamation-triangle" class="text-yellow-600 mt-0.5" size="sm" />
              <div class="text-sm text-yellow-800">
                {{ previewData.warning }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex justify-between items-center pt-6 border-t border-gray-200">
          <BaseButton
            type="button"
            variant="secondary"
            @click="$emit('cancel')"
          >
            Abbrechen
          </BaseButton>
          
          <div class="flex space-x-3">
            <BaseButton
              type="button"
              variant="secondary"
              @click="resetForm"
            >
              Zurücksetzen
            </BaseButton>
            
            <BaseButton
              type="submit"
              variant="primary"
              :loading="isSaving"
              :disabled="!isFormValid"
            >
              <BaseIcon name="check" size="sm" class="mr-2" />
              Speichern
            </BaseButton>
          </div>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { financialGoalService, type FinancialGoal, type GoalPriority, type GoalStatus } from '@/services/FinancialGoalService'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseSelect from '../ui/BaseSelect.vue'

interface Props {
  goal: FinancialGoal
}

interface Emits {
  (e: 'goal-updated', goal: FinancialGoal): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态管理
const isSaving = ref(false)
const newTag = ref('')

// 表单数据
const formData = ref({
  name: '',
  description: '',
  targetAmount: 0,
  currentAmount: 0,
  targetDate: '',
  monthlyContribution: 0,
  priority: 'medium' as GoalPriority,
  status: 'active' as GoalStatus,
  taxAdvantaged: false,
  employerMatch: 0,
  inflationAdjusted: true,
  tags: [] as string[],
  notes: '',
  type: props.goal.type
})

// 错误状态
const errors = ref({
  name: '',
  targetAmount: '',
  targetDate: '',
  monthlyContribution: ''
})

// 选项配置
const priorityOptions = [
  { value: 'high', label: 'Hoch' },
  { value: 'medium', label: 'Mittel' },
  { value: 'low', label: 'Niedrig' }
]

const statusOptions = [
  { value: 'active', label: 'Aktiv' },
  { value: 'paused', label: 'Pausiert' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'cancelled', label: 'Abgebrochen' }
]

// 计算属性
const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' &&
         formData.value.targetAmount > 0 &&
         formData.value.targetDate !== '' &&
         formData.value.monthlyContribution >= 0
})

const previewData = computed(() => {
  if (!formData.value.targetDate || formData.value.monthlyContribution < 0) return null

  const targetDate = new Date(formData.value.targetDate)
  const now = new Date()
  const monthsRemaining = Math.max(0, 
    (targetDate.getFullYear() - now.getFullYear()) * 12 + 
    (targetDate.getMonth() - now.getMonth())
  )

  // 简化的复利计算
  const monthlyRate = 0.04 / 12 // 4% 年利率
  let projectedAmount = formData.value.currentAmount * Math.pow(1 + monthlyRate, monthsRemaining)
  
  if (formData.value.monthlyContribution > 0) {
    projectedAmount += formData.value.monthlyContribution * 
      ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate)
  }

  // 考虑雇主匹配
  if (formData.value.employerMatch > 0) {
    projectedAmount += formData.value.employerMatch * 
      ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate)
  }

  const onTrack = projectedAmount >= formData.value.targetAmount * 0.95

  let warning = ''
  if (!onTrack) {
    const shortfall = formData.value.targetAmount - projectedAmount
    const additionalMonthly = monthsRemaining > 0 ? shortfall / monthsRemaining : 0
    warning = `Um Ihr Ziel zu erreichen, sollten Sie Ihre monatliche Einzahlung um €${additionalMonthly.toFixed(2)} erhöhen.`
  }

  return {
    monthsRemaining,
    projectedAmount,
    onTrack,
    warning
  }
})

// 方法
const initializeForm = () => {
  formData.value = {
    name: props.goal.name,
    description: props.goal.description || '',
    targetAmount: props.goal.targetAmount,
    currentAmount: props.goal.currentAmount,
    targetDate: props.goal.targetDate.toISOString().split('T')[0],
    monthlyContribution: props.goal.monthlyContribution,
    priority: props.goal.priority,
    status: props.goal.status,
    taxAdvantaged: props.goal.taxAdvantaged || false,
    employerMatch: props.goal.employerMatch || 0,
    inflationAdjusted: props.goal.inflationAdjusted || true,
    tags: [...props.goal.tags],
    notes: props.goal.notes || '',
    type: props.goal.type
  }
}

const resetForm = () => {
  initializeForm()
  clearErrors()
}

const clearErrors = () => {
  errors.value = {
    name: '',
    targetAmount: '',
    targetDate: '',
    monthlyContribution: ''
  }
}

const validateForm = (): boolean => {
  clearErrors()
  let isValid = true

  if (!formData.value.name.trim()) {
    errors.value.name = 'Bitte geben Sie einen Namen für Ihr Ziel ein'
    isValid = false
  }

  if (formData.value.targetAmount <= 0) {
    errors.value.targetAmount = 'Der Zielbetrag muss größer als 0 sein'
    isValid = false
  }

  if (!formData.value.targetDate) {
    errors.value.targetDate = 'Bitte wählen Sie ein Zieldatum'
    isValid = false
  } else {
    const targetDate = new Date(formData.value.targetDate)
    const now = new Date()
    if (targetDate <= now) {
      errors.value.targetDate = 'Das Zieldatum muss in der Zukunft liegen'
      isValid = false
    }
  }

  if (formData.value.monthlyContribution < 0) {
    errors.value.monthlyContribution = 'Die monatliche Einzahlung darf nicht negativ sein'
    isValid = false
  }

  return isValid
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  formData.value.tags.splice(index, 1)
}

const saveGoal = async () => {
  if (!validateForm()) return

  isSaving.value = true

  try {
    const updates = {
      name: formData.value.name,
      description: formData.value.description,
      targetAmount: formData.value.targetAmount,
      currentAmount: formData.value.currentAmount,
      targetDate: new Date(formData.value.targetDate),
      monthlyContribution: formData.value.monthlyContribution,
      priority: formData.value.priority,
      status: formData.value.status,
      taxAdvantaged: formData.value.taxAdvantaged,
      employerMatch: formData.value.employerMatch,
      inflationAdjusted: formData.value.inflationAdjusted,
      tags: formData.value.tags,
      notes: formData.value.notes
    }

    const updatedGoal = await financialGoalService.updateGoal(props.goal.id, updates)
    emit('goal-updated', updatedGoal)
  } catch (error) {
    console.error('Failed to update goal:', error)
  } finally {
    isSaving.value = false
  }
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

// 生命周期
onMounted(() => {
  initializeForm()
})
</script>

<style scoped>
.goal-editor {
  @apply max-w-2xl mx-auto;
}

/* 标签动画 */
.goal-editor .inline-flex {
  transition: all 0.2s ease-in-out;
}

.goal-editor .inline-flex:hover {
  transform: scale(1.05);
}
</style>
