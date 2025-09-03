<template>
  <div class="goal-dashboard">
    <!-- 概览统计 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm">Aktive Ziele</p>
            <p class="text-3xl font-bold">{{ statistics.activeGoals }}</p>
          </div>
          <BaseIcon name="target" size="2xl" class="text-blue-200" />
        </div>
      </div>

      <div class="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm">Auf Kurs</p>
            <p class="text-3xl font-bold">{{ statistics.onTrackGoals }}</p>
          </div>
          <BaseIcon name="check-circle" size="2xl" class="text-green-200" />
        </div>
      </div>

      <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm">Gesamt gespart</p>
            <p class="text-2xl font-bold">€{{ formatCurrency(statistics.totalCurrentAmount) }}</p>
          </div>
          <BaseIcon name="currency-euro" size="2xl" class="text-purple-200" />
        </div>
      </div>

      <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm">Monatlich</p>
            <p class="text-2xl font-bold">€{{ formatCurrency(statistics.totalMonthlyContributions) }}</p>
          </div>
          <BaseIcon name="calendar" size="2xl" class="text-orange-200" />
        </div>
      </div>
    </div>

    <!-- 目标列表和筛选 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 目标列表 -->
      <div class="lg:col-span-2">
        <BaseCard title="Ihre Finanzziele" padding="lg">
          <!-- 筛选和排序 -->
          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <div class="flex-1">
              <BaseSelect
                v-model="filterStatus"
                :options="statusFilterOptions"
                placeholder="Status filtern"
              />
            </div>

            <div class="flex-1">
              <BaseSelect
                v-model="filterType"
                :options="typeFilterOptions"
                placeholder="Typ filtern"
              />
            </div>

            <BaseButton
              variant="primary"
              @click="showGoalWizard = true"
            >
              <BaseIcon name="plus" size="sm" class="mr-2" />
              Neues Ziel
            </BaseButton>
          </div>

          <!-- 目标卡片列表 -->
          <div v-if="filteredGoals.length > 0" class="space-y-4">
            <GoalCard
              v-for="goal in filteredGoals"
              :key="goal.id"
              :goal="goal"
              :progress="goalProgress[goal.id]"
              @edit="editGoal"
              @delete="deleteGoal"
              @update-amount="updateGoalAmount"
            />
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-12">
            <BaseIcon name="target" size="3xl" class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              {{ goals.length === 0 ? 'Noch keine Ziele erstellt' : 'Keine Ziele gefunden' }}
            </h3>
            <p class="text-gray-500 mb-4">
              {{ goals.length === 0
                 ? 'Erstellen Sie Ihr erstes Finanzziel und beginnen Sie zu sparen.'
                 : 'Versuchen Sie andere Filter oder erstellen Sie ein neues Ziel.' }}
            </p>

            <BaseButton
              variant="primary"
              @click="showGoalWizard = true"
            >
              <BaseIcon name="plus" size="sm" class="mr-2" />
              Erstes Ziel erstellen
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <!-- 侧边栏：进度概览和建议 -->
      <div class="space-y-6">
        <!-- 整体进度 -->
        <BaseCard title="Gesamtfortschritt" padding="md">
          <div class="space-y-4">
            <!-- 圆形进度图 -->
            <div class="flex items-center justify-center">
              <div class="relative w-32 h-32">
                <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    stroke-width="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    stroke-width="8"
                    :stroke-dasharray="`${statistics.averageProgress * 251.2} 251.2`"
                    stroke-linecap="round"
                    class="transition-all duration-500"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-gray-900">
                      {{ Math.round(statistics.averageProgress * 100) }}%
                    </div>
                    <div class="text-xs text-gray-500">Durchschnitt</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 统计详情 -->
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Ziele erreicht:</span>
                <span class="font-medium">{{ statistics.completedGoals }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Auf Kurs:</span>
                <span class="font-medium text-green-600">{{ statistics.onTrackGoals }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Benötigen Aufmerksamkeit:</span>
                <span class="font-medium text-orange-600">
                  {{ statistics.activeGoals - statistics.onTrackGoals }}
                </span>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- 即将到期的里程碑 -->
        <BaseCard title="Nächste Meilensteine" padding="md">
          <div v-if="upcomingMilestones.length > 0" class="space-y-3">
            <div
              v-for="milestone in upcomingMilestones"
              :key="milestone.id"
              class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <BaseIcon name="flag" class="text-blue-600" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ milestone.name }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatDate(milestone.targetDate) }}
                </p>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-gray-900">
                  €{{ formatCurrency(milestone.targetAmount) }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-6">
            <BaseIcon name="flag" size="lg" class="mx-auto text-gray-400 mb-2" />
            <p class="text-sm text-gray-500">Keine anstehenden Meilensteine</p>
          </div>
        </BaseCard>

        <!-- 智能建议 -->
        <BaseCard title="Empfehlungen" padding="md">
          <div v-if="recommendations.length > 0" class="space-y-3">
            <div
              v-for="recommendation in recommendations"
              :key="recommendation.type + '-' + Math.random()"
              class="p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div class="flex items-start space-x-2">
                <BaseIcon name="lightbulb" class="text-blue-600 mt-0.5" size="sm" />
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-blue-900">
                    {{ recommendation.title }}
                  </h4>
                  <p class="text-xs text-blue-700 mt-1">
                    {{ recommendation.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-6">
            <BaseIcon name="lightbulb" size="lg" class="mx-auto text-gray-400 mb-2" />
            <p class="text-sm text-gray-500">Keine Empfehlungen verfügbar</p>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- 目标创建向导模态框 -->
    <div v-if="showGoalWizard" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <GoalWizard
          @goal-created="handleGoalCreated"
          @cancel="showGoalWizard = false"
        />
      </div>
    </div>

    <!-- 目标编辑模态框 -->
    <div v-if="editingGoal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <GoalEditor
          :goal="editingGoal"
          @goal-updated="handleGoalUpdated"
          @cancel="editingGoal = null"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { financialGoalService, type FinancialGoal, type GoalProgress, type GoalRecommendation, type GoalMilestone } from '@/services/FinancialGoalService'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseSelect from '../ui/BaseSelect.vue'
import GoalCard from './GoalCard.vue'
import GoalWizard from './GoalWizard.vue'
import GoalEditor from './GoalEditor.vue'

// 状态管理
const goals = ref<FinancialGoal[]>([])
const goalProgress = ref<Record<string, GoalProgress>>({})
const recommendations = ref<GoalRecommendation[]>([])
const upcomingMilestones = ref<GoalMilestone[]>([])
const statistics = ref({
  totalGoals: 0,
  activeGoals: 0,
  completedGoals: 0,
  totalTargetAmount: 0,
  totalCurrentAmount: 0,
  totalMonthlyContributions: 0,
  averageProgress: 0,
  onTrackGoals: 0,
  goalsByType: {},
  goalsByPriority: {},
  goalsByStatus: {}
})

const showGoalWizard = ref(false)
const editingGoal = ref<FinancialGoal | null>(null)
const filterStatus = ref('')
const filterType = ref('')

// 筛选选项
const statusFilterOptions = [
  { value: '', label: 'Alle Status' },
  { value: 'active', label: 'Aktiv' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'paused', label: 'Pausiert' },
  { value: 'cancelled', label: 'Abgebrochen' }
]

const typeFilterOptions = [
  { value: '', label: 'Alle Typen' },
  { value: 'retirement', label: 'Altersvorsorge' },
  { value: 'house', label: 'Eigenheim' },
  { value: 'education', label: 'Bildung' },
  { value: 'emergency', label: 'Notgroschen' },
  { value: 'vacation', label: 'Urlaub' },
  { value: 'custom', label: 'Sonstiges' }
]

// 计算属性
const filteredGoals = computed(() => {
  return goals.value.filter(goal => {
    const statusMatch = !filterStatus.value || goal.status === filterStatus.value
    const typeMatch = !filterType.value || goal.type === filterType.value
    return statusMatch && typeMatch
  })
})

// 方法
const loadData = async () => {
  try {
    // 加载目标
    goals.value = await financialGoalService.getAllGoals()

    // 加载统计数据
    statistics.value = await financialGoalService.getGoalStatistics()

    // 加载每个目标的进度
    for (const goal of goals.value) {
      if (goal.status === 'active') {
        goalProgress.value[goal.id] = await financialGoalService.calculateGoalProgress(goal.id)
      }
    }

    // 加载建议
    await loadRecommendations()

    // 加载即将到期的里程碑
    await loadUpcomingMilestones()

  } catch (error) {
    console.error('Failed to load goal data:', error)
  }
}

const loadRecommendations = async () => {
  const allRecommendations: GoalRecommendation[] = []

  for (const goal of goals.value) {
    if (goal.status === 'active') {
      const goalRecommendations = await financialGoalService.getGoalRecommendations(goal.id)
      allRecommendations.push(...goalRecommendations.slice(0, 1)) // 每个目标最多1个建议
    }
  }

  recommendations.value = allRecommendations.slice(0, 3) // 最多显示3个建议
}

const loadUpcomingMilestones = async () => {
  // 这里应该从服务加载即将到期的里程碑
  // 临时实现
  upcomingMilestones.value = []
}

const handleGoalCreated = async (goal: FinancialGoal) => {
  showGoalWizard.value = false
  await loadData()
}

const handleGoalUpdated = async (goal: FinancialGoal) => {
  editingGoal.value = null
  await loadData()
}

const editGoal = (goal: FinancialGoal) => {
  editingGoal.value = goal
}

const deleteGoal = async (goal: FinancialGoal) => {
  if (confirm(`Sind Sie sicher, dass Sie das Ziel "${goal.name}" löschen möchten?`)) {
    try {
      await financialGoalService.deleteGoal(goal.id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }
}

const updateGoalAmount = async (goalId: string, newAmount: number) => {
  try {
    await financialGoalService.updateGoal(goalId, { currentAmount: newAmount })
    await loadData()
  } catch (error) {
    console.error('Failed to update goal amount:', error)
  }
}

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.goal-dashboard {
  @apply w-full;
}

/* 圆形进度条动画 */
.goal-dashboard circle {
  transition: stroke-dasharray 0.5s ease-in-out;
}

/* 卡片悬停效果 */
.goal-dashboard .hover\:shadow-md:hover {
  transform: translateY(-1px);
}
</style>
