<template>
  <div class="goal-card">
    <BaseCard :hover="true" padding="lg" class="transition-all duration-200">
      <div class="flex items-start justify-between mb-4">
        <!-- 目标信息 -->
        <div class="flex items-start space-x-4 flex-1 min-w-0">
          <div class="flex-shrink-0">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="getGoalTypeColor(goal.type)"
            >
              <BaseIcon :name="getGoalTypeIcon(goal.type)" class="text-white" />
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <h3 class="text-lg font-semibold text-gray-900 truncate">
                {{ goal.name }}
              </h3>
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="getPriorityColor(goal.priority)"
              >
                {{ getPriorityLabel(goal.priority) }}
              </span>
            </div>
            
            <p v-if="goal.description" class="text-sm text-gray-600 mb-2 line-clamp-2">
              {{ goal.description }}
            </p>
            
            <div class="flex items-center space-x-4 text-sm text-gray-500">
              <span>{{ getGoalTypeLabel(goal.type) }}</span>
              <span>•</span>
              <span>Ziel: {{ formatDate(goal.targetDate) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 操作菜单 -->
        <div class="flex-shrink-0 ml-4">
          <div class="relative" ref="dropdownRef">
            <BaseButton
              variant="ghost"
              size="sm"
              @click="toggleDropdown"
            >
              <BaseIcon name="dots-vertical" size="sm" />
            </BaseButton>
            
            <!-- 下拉菜单 -->
            <div
              v-if="showDropdown"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
            >
              <div class="py-1">
                <button
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="$emit('edit', goal)"
                >
                  <BaseIcon name="pencil" size="sm" class="mr-2" />
                  Bearbeiten
                </button>
                
                <button
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="showUpdateAmountModal = true"
                >
                  <BaseIcon name="currency-euro" size="sm" class="mr-2" />
                  Betrag aktualisieren
                </button>
                
                <button
                  v-if="goal.status === 'active'"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="pauseGoal"
                >
                  <BaseIcon name="pause" size="sm" class="mr-2" />
                  Pausieren
                </button>
                
                <button
                  v-if="goal.status === 'paused'"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="resumeGoal"
                >
                  <BaseIcon name="play" size="sm" class="mr-2" />
                  Fortsetzen
                </button>
                
                <div class="border-t border-gray-100 my-1"></div>
                
                <button
                  class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  @click="$emit('delete', goal)"
                >
                  <BaseIcon name="trash" size="sm" class="mr-2" />
                  Löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度信息 -->
      <div class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-gray-700">Fortschritt</span>
          <span class="text-sm text-gray-600">
            {{ Math.round((progress?.progress || 0) * 100) }}%
          </span>
        </div>
        
        <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            class="h-2 rounded-full transition-all duration-300"
            :class="getProgressColor(progress?.progress || 0)"
            :style="{ width: `${Math.min((progress?.progress || 0) * 100, 100)}%` }"
          ></div>
        </div>
        
        <div class="flex justify-between text-sm text-gray-600">
          <span>€{{ formatCurrency(goal.currentAmount) }}</span>
          <span>€{{ formatCurrency(goal.targetAmount) }}</span>
        </div>
      </div>

      <!-- 关键指标 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="text-center">
          <div class="text-lg font-semibold text-gray-900">
            €{{ formatCurrency(goal.monthlyContribution) }}
          </div>
          <div class="text-xs text-gray-500">Monatlich</div>
        </div>
        
        <div class="text-center">
          <div class="text-lg font-semibold text-gray-900">
            {{ progress?.monthsRemaining || 0 }}
          </div>
          <div class="text-xs text-gray-500">Monate verbleibend</div>
        </div>
        
        <div class="text-center">
          <div class="text-lg font-semibold" :class="progress?.onTrack ? 'text-green-600' : 'text-red-600'">
            {{ progress?.onTrack ? '✓' : '⚠' }}
          </div>
          <div class="text-xs text-gray-500">
            {{ progress?.onTrack ? 'Auf Kurs' : 'Anpassung nötig' }}
          </div>
        </div>
        
        <div class="text-center">
          <div class="text-lg font-semibold text-blue-600">
            €{{ formatCurrency(progress?.projectedFinalAmount || 0) }}
          </div>
          <div class="text-xs text-gray-500">Prognose</div>
        </div>
      </div>

      <!-- 状态和标签 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            :class="getStatusColor(goal.status)"
          >
            {{ getStatusLabel(goal.status) }}
          </span>
          
          <span
            v-for="tag in goal.tags.slice(0, 2)"
            :key="tag"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            {{ tag }}
          </span>
          
          <span
            v-if="goal.tags.length > 2"
            class="text-xs text-gray-500"
          >
            +{{ goal.tags.length - 2 }} weitere
          </span>
        </div>
        
        <!-- 德国特定标识 -->
        <div class="flex items-center space-x-1">
          <BaseIcon
            v-if="goal.taxAdvantaged"
            name="shield-check"
            size="sm"
            class="text-green-600"
            title="Steuerlich begünstigt"
          />
          <BaseIcon
            v-if="goal.employerMatch && goal.employerMatch > 0"
            name="building-office"
            size="sm"
            class="text-blue-600"
            title="Arbeitgeberzuschuss"
          />
          <BaseIcon
            v-if="goal.inflationAdjusted"
            name="trending-up"
            size="sm"
            class="text-purple-600"
            title="Inflationsbereinigt"
          />
        </div>
      </div>

      <!-- 下一个里程碑 -->
      <div v-if="progress?.nextMilestone" class="mt-4 pt-4 border-t border-gray-100">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center space-x-2">
            <BaseIcon name="flag" size="sm" class="text-blue-600" />
            <span class="text-gray-700">Nächster Meilenstein:</span>
          </div>
          <div class="text-right">
            <div class="font-medium text-gray-900">
              €{{ formatCurrency(progress.nextMilestone.targetAmount) }}
            </div>
            <div class="text-xs text-gray-500">
              {{ formatDate(progress.nextMilestone.targetDate) }}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- 金额更新模态框 -->
    <div v-if="showUpdateAmountModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg max-w-md mx-4 w-full">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Betrag aktualisieren</h3>
        
        <div class="mb-4">
          <BaseInput
            v-model="newAmount"
            type="currency"
            label="Neuer Betrag"
            :placeholder="`Aktuell: €${formatCurrency(goal.currentAmount)}`"
          />
        </div>
        
        <div class="flex space-x-3">
          <BaseButton
            variant="primary"
            @click="updateAmount"
            class="flex-1"
          >
            Aktualisieren
          </BaseButton>
          <BaseButton
            variant="secondary"
            @click="showUpdateAmountModal = false"
            class="flex-1"
          >
            Abbrechen
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { FinancialGoal, GoalProgress, GoalType, GoalPriority, GoalStatus } from '@/services/FinancialGoalService'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseInput from '../ui/BaseInput.vue'

interface Props {
  goal: FinancialGoal
  progress?: GoalProgress
}

interface Emits {
  (e: 'edit', goal: FinancialGoal): void
  (e: 'delete', goal: FinancialGoal): void
  (e: 'update-amount', goalId: string, amount: number): void
  (e: 'pause', goal: FinancialGoal): void
  (e: 'resume', goal: FinancialGoal): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态管理
const showDropdown = ref(false)
const showUpdateAmountModal = ref(false)
const newAmount = ref(0)
const dropdownRef = ref<HTMLElement>()

// 方法
const getGoalTypeIcon = (type: GoalType): string => {
  const icons: Record<GoalType, string> = {
    retirement: 'user-group',
    house: 'home',
    education: 'academic-cap',
    emergency: 'shield-check',
    vacation: 'globe-alt',
    investment: 'trending-up',
    debt_payoff: 'credit-card',
    custom: 'star'
  }
  return icons[type] || 'star'
}

const getGoalTypeColor = (type: GoalType): string => {
  const colors: Record<GoalType, string> = {
    retirement: 'bg-blue-500',
    house: 'bg-green-500',
    education: 'bg-purple-500',
    emergency: 'bg-red-500',
    vacation: 'bg-orange-500',
    investment: 'bg-indigo-500',
    debt_payoff: 'bg-yellow-500',
    custom: 'bg-gray-500'
  }
  return colors[type] || 'bg-gray-500'
}

const getGoalTypeLabel = (type: GoalType): string => {
  const labels: Record<GoalType, string> = {
    retirement: 'Altersvorsorge',
    house: 'Eigenheim',
    education: 'Bildung',
    emergency: 'Notgroschen',
    vacation: 'Urlaub',
    investment: 'Investment',
    debt_payoff: 'Schuldenabbau',
    custom: 'Sonstiges'
  }
  return labels[type] || type
}

const getPriorityLabel = (priority: GoalPriority): string => {
  const labels: Record<GoalPriority, string> = {
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig'
  }
  return labels[priority] || priority
}

const getPriorityColor = (priority: GoalPriority): string => {
  const colors: Record<GoalPriority, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

const getStatusLabel = (status: GoalStatus): string => {
  const labels: Record<GoalStatus, string> = {
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    paused: 'Pausiert',
    cancelled: 'Abgebrochen'
  }
  return labels[status] || status
}

const getStatusColor = (status: GoalStatus): string => {
  const colors: Record<GoalStatus, string> = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getProgressColor = (progress: number): string => {
  if (progress >= 0.8) return 'bg-green-500'
  if (progress >= 0.5) return 'bg-blue-500'
  if (progress >= 0.25) return 'bg-yellow-500'
  return 'bg-red-500'
}

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('de-DE', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })
}

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

const updateAmount = () => {
  if (newAmount.value >= 0) {
    emit('update-amount', props.goal.id, newAmount.value)
    showUpdateAmountModal.value = false
    newAmount.value = 0
  }
}

const pauseGoal = () => {
  emit('pause', props.goal)
  showDropdown.value = false
}

const resumeGoal = () => {
  emit('resume', props.goal)
  showDropdown.value = false
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', closeDropdown)
  newAmount.value = props.goal.currentAmount
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.goal-card {
  @apply w-full;
}

/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 下拉菜单动画 */
.goal-card .absolute {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
