<!--
  智能引导面板组件
  提供个性化的引导推荐和学习路径
-->

<template>
  <div class="smart-guidance-panel">
    <!-- 引导推荐卡片 -->
    <div v-if="showRecommendations" class="recommendations-container">
      <div class="recommendations-header">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          <SparklesIcon class="w-5 h-5 inline mr-2 text-blue-600" />
          Persönliche Empfehlungen
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          Basierend auf Ihrem Fortschritt und Nutzungsverhalten
        </p>
      </div>

      <div class="recommendations-grid grid gap-4 mb-6">
        <div
          v-for="recommendation in recommendations"
          :key="recommendation.tourId"
          :class="[
            'recommendation-card p-4 border rounded-lg cursor-pointer transition-all duration-200',
            'hover:shadow-md hover:border-blue-300',
            recommendation.priority === 'high' ? 'border-blue-500 bg-blue-50' :
            recommendation.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
            'border-gray-300 bg-gray-50'
          ]"
          @click="startRecommendedTour(recommendation.tourId)"
        >
          <!-- 优先级标识 -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center">
              <component
                :is="getPriorityIcon(recommendation.priority)"
                :class="[
                  'w-4 h-4 mr-2',
                  recommendation.priority === 'high' ? 'text-blue-600' :
                  recommendation.priority === 'medium' ? 'text-yellow-600' :
                  'text-gray-600'
                ]"
              />
              <span :class="[
                'text-xs font-medium px-2 py-1 rounded',
                recommendation.priority === 'high' ? 'bg-blue-100 text-blue-800' :
                recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              ]">
                {{ getPriorityLabel(recommendation.priority) }}
              </span>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">Nutzen</div>
              <div class="text-sm font-semibold text-gray-900">
                {{ recommendation.estimatedBenefit }}%
              </div>
            </div>
          </div>

          <!-- 推荐内容 -->
          <div class="mb-3">
            <h4 class="font-medium text-gray-900 mb-1">
              {{ getTourName(recommendation.tourId) }}
            </h4>
            <p class="text-sm text-gray-600">
              {{ recommendation.reason }}
            </p>
          </div>

          <!-- 标签 -->
          <div class="flex flex-wrap gap-1 mb-3">
            <span
              v-for="tag in recommendation.tags"
              :key="tag"
              class="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {{ tag }}
            </span>
          </div>

          <!-- 前置条件 -->
          <div v-if="recommendation.prerequisites.length > 0" class="mb-3">
            <div class="text-xs text-gray-500 mb-1">Voraussetzungen:</div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="prereq in recommendation.prerequisites"
                :key="prereq"
                class="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
              >
                {{ getTourName(prereq) }}
              </span>
            </div>
          </div>

          <!-- 开始按钮 -->
          <BaseButton
            variant="primary"
            size="sm"
            class="w-full"
            @click.stop="startRecommendedTour(recommendation.tourId)"
          >
            <PlayIcon class="w-4 h-4 mr-1" />
            Tour starten
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- 学习路径 -->
    <div v-if="showLearningPath && learningPath.length > 0" class="learning-path-container mb-6">
      <div class="learning-path-header mb-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          <AcademicCapIcon class="w-5 h-5 inline mr-2 text-green-600" />
          Ihr Lernpfad
        </h3>
        <p class="text-sm text-gray-600">
          Empfohlene Reihenfolge für optimales Lernen
        </p>
      </div>

      <div class="learning-path-steps">
        <div
          v-for="(tourId, index) in learningPath"
          :key="tourId"
          class="learning-step flex items-center mb-4"
        >
          <!-- 步骤编号 -->
          <div :class="[
            'step-number w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4',
            isStepCompleted(tourId) ? 'bg-green-500 text-white' :
            isStepCurrent(tourId, index) ? 'bg-blue-500 text-white' :
            'bg-gray-300 text-gray-600'
          ]">
            <CheckIcon v-if="isStepCompleted(tourId)" class="w-4 h-4" />
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- 连接线 -->
          <div
            v-if="index < learningPath.length - 1"
            :class="[
              'step-connector absolute left-4 w-0.5 h-8 mt-8',
              isStepCompleted(tourId) ? 'bg-green-500' : 'bg-gray-300'
            ]"
          ></div>

          <!-- 步骤内容 -->
          <div class="step-content flex-1">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-900">
                  {{ getTourName(tourId) }}
                </h4>
                <p class="text-sm text-gray-600">
                  {{ getTourDescription(tourId) }}
                </p>
                <div class="text-xs text-gray-500 mt-1">
                  Geschätzte Zeit: {{ getTourDuration(tourId) }} Min.
                </div>
              </div>
              <div class="ml-4">
                <BaseButton
                  v-if="!isStepCompleted(tourId)"
                  variant="outline"
                  size="sm"
                  @click="startTour(tourId)"
                  :disabled="!canStartStep(tourId, index)"
                >
                  <PlayIcon class="w-4 h-4 mr-1" />
                  Starten
                </BaseButton>
                <div v-else class="text-green-600 text-sm font-medium">
                  <CheckIcon class="w-4 h-4 inline mr-1" />
                  Abgeschlossen
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="learning-progress mt-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Lernfortschritt</span>
          <span class="text-sm text-gray-600">{{ completedSteps }}/{{ learningPath.length }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-green-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 技能水平显示 -->
    <div v-if="showSkillLevel" class="skill-level-container mb-6">
      <div class="skill-level-header mb-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          <TrophyIcon class="w-5 h-5 inline mr-2 text-yellow-600" />
          Ihr Skill-Level
        </h3>
      </div>

      <div class="skill-level-display">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">
            {{ getSkillLevelLabel(skillLevel) }}
          </span>
          <span class="text-sm text-gray-600">{{ skillLevel }}/100</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div
            :class="[
              'h-3 rounded-full transition-all duration-500',
              getSkillLevelColor(skillLevel)
            ]"
            :style="{ width: `${skillLevel}%` }"
          ></div>
        </div>
        <div class="text-xs text-gray-500 mt-2">
          {{ getSkillLevelDescription(skillLevel) }}
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <div class="grid grid-cols-2 gap-3">
        <BaseButton
          variant="outline"
          size="sm"
          @click="refreshRecommendations"
          :loading="isAnalyzing"
        >
          <ArrowPathIcon class="w-4 h-4 mr-1" />
          Aktualisieren
        </BaseButton>
        <BaseButton
          variant="outline"
          size="sm"
          @click="showCustomizationDialog = true"
        >
          <CogIcon class="w-4 h-4 mr-1" />
          Anpassen
        </BaseButton>
      </div>
    </div>

    <!-- 自定义对话框 -->
    <BaseDialog
      :open="showCustomizationDialog"
      @close="showCustomizationDialog = false"
      title="Guidance anpassen"
      size="md"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Ihr Erfahrungslevel
          </label>
          <BaseSelect
            v-model="customConfig.userLevel"
            :options="[
              { value: 'beginner', label: 'Anfänger' },
              { value: 'intermediate', label: 'Fortgeschritten' },
              { value: 'advanced', label: 'Experte' }
            ]"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Bevorzugter Lernstil
          </label>
          <BaseSelect
            v-model="customConfig.preferredLearningStyle"
            :options="[
              { value: 'visual', label: 'Visuell' },
              { value: 'textual', label: 'Text-basiert' },
              { value: 'interactive', label: 'Interaktiv' },
              { value: 'mixed', label: 'Gemischt' }
            ]"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Verfügbare Zeit (Minuten)
          </label>
          <BaseInput
            v-model.number="customConfig.timeAvailable"
            type="number"
            min="5"
            max="60"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Spezielle Ziele
          </label>
          <div class="space-y-2">
            <label
              v-for="goal in availableGoals"
              :key="goal.value"
              class="flex items-center"
            >
              <input
                type="checkbox"
                :value="goal.value"
                v-model="customConfig.specificGoals"
                class="mr-2"
              />
              {{ goal.label }}
            </label>
          </div>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="customConfig.skipCompleted"
            class="mr-2"
          />
          <label class="text-sm text-gray-700">
            Abgeschlossene Schritte überspringen
          </label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="customConfig.adaptiveSpeed"
            class="mr-2"
          />
          <label class="text-sm text-gray-700">
            Adaptive Geschwindigkeit
          </label>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <BaseButton
            variant="outline"
            @click="showCustomizationDialog = false"
          >
            Abbrechen
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="applyCustomConfiguration"
          >
            Anwenden
          </BaseButton>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  SparklesIcon,
  AcademicCapIcon,
  TrophyIcon,
  PlayIcon,
  CheckIcon,
  ArrowPathIcon,
  CogIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  FireIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { enhancedUserGuidanceService } from '@/services/EnhancedUserGuidanceService'
import { userGuidanceService } from '@/services/UserGuidanceService'
import type { PersonalizedRecommendation, SmartGuidanceConfig } from '@/services/EnhancedUserGuidanceService'

// Props
interface Props {
  showRecommendations?: boolean
  showLearningPath?: boolean
  showSkillLevel?: boolean
  maxRecommendations?: number
}

const props = withDefaults(defineProps<Props>(), {
  showRecommendations: true,
  showLearningPath: true,
  showSkillLevel: true,
  maxRecommendations: 3
})

// 响应式状态
const recommendations = ref<PersonalizedRecommendation[]>([])
const learningPath = ref<string[]>([])
const skillLevel = ref(0)
const isAnalyzing = ref(false)
const showCustomizationDialog = ref(false)

// 自定义配置
const customConfig = ref<SmartGuidanceConfig>({
  userLevel: 'beginner',
  preferredLearningStyle: 'mixed',
  timeAvailable: 15,
  specificGoals: [],
  skipCompleted: true,
  adaptiveSpeed: true
})

// 可用目标选项
const availableGoals = [
  { value: 'mobile', label: 'Mobile Nutzung optimieren' },
  { value: 'export', label: 'Export-Funktionen meistern' },
  { value: 'advanced', label: 'Erweiterte Features nutzen' },
  { value: 'troubleshooting', label: 'Problemlösung lernen' },
  { value: 'efficiency', label: 'Effizienz steigern' }
]

// 计算属性
const completedSteps = computed(() => {
  const userProgress = userGuidanceService.getUserProgress()
  return learningPath.value.filter(tourId => 
    userProgress.completedTours.includes(tourId)
  ).length
})

const progressPercentage = computed(() => {
  if (learningPath.value.length === 0) return 0
  return (completedSteps.value / learningPath.value.length) * 100
})

// 方法
const refreshRecommendations = async () => {
  isAnalyzing.value = true
  
  try {
    const userProgress = userGuidanceService.getUserProgress()
    const context = {
      currentPage: window.location.pathname,
      userActions: [],
      timeSpent: 0,
      errorsMade: 0,
      helpRequested: 0,
      lastInteraction: new Date()
    }
    
    const newRecommendations = await enhancedUserGuidanceService.getSmartRecommendations(
      userProgress,
      context
    )
    
    recommendations.value = newRecommendations.slice(0, props.maxRecommendations)
    
    // 更新学习路径
    learningPath.value = enhancedUserGuidanceService.createLearningPath(
      customConfig.value.userLevel,
      customConfig.value.specificGoals,
      customConfig.value.timeAvailable
    )
    
    // 更新技能水平
    skillLevel.value = enhancedUserGuidanceService.analyzeSkillLevel(userProgress)
    
  } finally {
    isAnalyzing.value = false
  }
}

const startRecommendedTour = (tourId: string) => {
  const tour = enhancedUserGuidanceService.getCompleteTour(tourId)
  if (tour) {
    userGuidanceService.startTour(tour)
  }
}

const startTour = (tourId: string) => {
  startRecommendedTour(tourId)
}

const isStepCompleted = (tourId: string): boolean => {
  const userProgress = userGuidanceService.getUserProgress()
  return userProgress.completedTours.includes(tourId)
}

const isStepCurrent = (tourId: string, index: number): boolean => {
  if (index === 0) return !isStepCompleted(tourId)
  
  // 当前步骤是第一个未完成的步骤
  for (let i = 0; i < index; i++) {
    if (!isStepCompleted(learningPath.value[i])) {
      return false
    }
  }
  return !isStepCompleted(tourId)
}

const canStartStep = (tourId: string, index: number): boolean => {
  if (index === 0) return true
  
  // 检查前置步骤是否完成
  for (let i = 0; i < index; i++) {
    if (!isStepCompleted(learningPath.value[i])) {
      return false
    }
  }
  return true
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return FireIcon
    case 'medium': return ExclamationTriangleIcon
    default: return InformationCircleIcon
  }
}

const getPriorityLabel = (priority: string): string => {
  switch (priority) {
    case 'high': return 'Hoch'
    case 'medium': return 'Mittel'
    default: return 'Niedrig'
  }
}

const getTourName = (tourId: string): string => {
  const tour = enhancedUserGuidanceService.getCompleteTour(tourId)
  return tour?.name || tourId
}

const getTourDescription = (tourId: string): string => {
  const tour = enhancedUserGuidanceService.getCompleteTour(tourId)
  return tour?.description || ''
}

const getTourDuration = (tourId: string): number => {
  const tour = enhancedUserGuidanceService.getCompleteTour(tourId)
  return tour?.estimatedTime || 5
}

const getSkillLevelLabel = (level: number): string => {
  if (level < 25) return 'Anfänger'
  if (level < 50) return 'Fortgeschritten'
  if (level < 75) return 'Erfahren'
  return 'Experte'
}

const getSkillLevelColor = (level: number): string => {
  if (level < 25) return 'bg-red-500'
  if (level < 50) return 'bg-yellow-500'
  if (level < 75) return 'bg-blue-500'
  return 'bg-green-500'
}

const getSkillLevelDescription = (level: number): string => {
  if (level < 25) return 'Sie lernen noch die Grundlagen'
  if (level < 50) return 'Sie beherrschen die wichtigsten Funktionen'
  if (level < 75) return 'Sie nutzen erweiterte Features'
  return 'Sie sind ein echter Profi!'
}

const applyCustomConfiguration = () => {
  showCustomizationDialog.value = false
  refreshRecommendations()
}

// 生命周期
onMounted(() => {
  refreshRecommendations()
})

// 监听用户进度变化
watch(() => userGuidanceService.getUserProgress(), () => {
  refreshRecommendations()
}, { deep: true })
</script>

<style scoped>
.smart-guidance-panel {
  @apply max-w-4xl mx-auto;
}

.recommendation-card {
  @apply transition-all duration-200;
}

.recommendation-card:hover {
  @apply transform -translate-y-1;
}

.learning-step {
  @apply relative;
}

.step-connector {
  @apply z-0;
}

.step-number {
  @apply relative z-10;
}

.skill-level-display .h-3 {
  @apply transition-all duration-500 ease-out;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .recommendations-grid {
    @apply grid-cols-1;
  }
  
  .learning-step {
    @apply flex-col items-start;
  }
  
  .step-number {
    @apply mb-2;
  }
  
  .step-connector {
    @apply hidden;
  }
}
</style>
