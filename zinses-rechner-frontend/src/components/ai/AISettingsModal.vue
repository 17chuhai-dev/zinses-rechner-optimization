<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- 背景遮罩 -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      @click="closeModal"
    ></div>

    <!-- 模态框 -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- 头部 -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            AI助手设置
          </h3>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- 内容 -->
        <div class="p-6 space-y-6">
          <!-- AI模型选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI模型
            </label>
            <select 
              v-model="settings.model" 
              class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="gpt-4">GPT-4 (推荐)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3">Claude 3</option>
              <option value="gemini-pro">Gemini Pro</option>
            </select>
            <p class="text-sm text-gray-500 mt-1">选择用于财务建议的AI模型</p>
          </div>

          <!-- 响应风格 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              响应风格
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="settings.responseStyle"
                  value="professional"
                  class="mr-2"
                >
                <span class="text-sm">专业 - 详细的技术分析</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="settings.responseStyle"
                  value="friendly"
                  class="mr-2"
                >
                <span class="text-sm">友好 - 易懂的解释</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="settings.responseStyle"
                  value="concise"
                  class="mr-2"
                >
                <span class="text-sm">简洁 - 要点总结</span>
              </label>
            </div>
          </div>

          <!-- 建议类型 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              建议类型
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.adviceTypes"
                  value="investment"
                  class="mr-2"
                >
                <span class="text-sm">投资建议</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.adviceTypes"
                  value="savings"
                  class="mr-2"
                >
                <span class="text-sm">储蓄策略</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.adviceTypes"
                  value="debt"
                  class="mr-2"
                >
                <span class="text-sm">债务管理</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.adviceTypes"
                  value="tax"
                  class="mr-2"
                >
                <span class="text-sm">税务优化</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.adviceTypes"
                  value="retirement"
                  class="mr-2"
                >
                <span class="text-sm">退休规划</span>
              </label>
            </div>
          </div>

          <!-- 风险偏好 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              风险偏好
            </label>
            <select 
              v-model="settings.riskTolerance" 
              class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="conservative">保守型</option>
              <option value="moderate">稳健型</option>
              <option value="aggressive">积极型</option>
            </select>
          </div>

          <!-- 个人信息 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              个人信息（用于个性化建议）
            </label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">年龄</label>
                <input
                  type="number"
                  v-model.number="settings.personalInfo.age"
                  min="18"
                  max="100"
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">月收入 (€)</label>
                <input
                  type="number"
                  v-model.number="settings.personalInfo.monthlyIncome"
                  min="0"
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
              </div>
            </div>
          </div>

          <!-- 隐私设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              隐私设置
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.privacy.saveConversations"
                  class="mr-2"
                >
                <span class="text-sm">保存对话历史</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.privacy.shareAnonymousData"
                  class="mr-2"
                >
                <span class="text-sm">分享匿名数据以改进服务</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="settings.privacy.allowPersonalization"
                  class="mr-2"
                >
                <span class="text-sm">允许基于历史数据的个性化建议</span>
              </label>
            </div>
          </div>

          <!-- 高级设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              高级设置
            </label>
            <div class="space-y-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">
                  响应长度 ({{ settings.advanced.maxTokens }} tokens)
                </label>
                <input
                  type="range"
                  v-model.number="settings.advanced.maxTokens"
                  min="100"
                  max="2000"
                  step="100"
                  class="w-full"
                >
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">
                  创造性 ({{ settings.advanced.temperature }})
                </label>
                <input
                  type="range"
                  v-model.number="settings.advanced.temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  class="w-full"
                >
                <div class="flex justify-between text-xs text-gray-400">
                  <span>保守</span>
                  <span>创新</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="resetToDefaults"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            重置默认
          </button>
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            取消
          </button>
          <button
            @click="saveSettings"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

interface AISettings {
  model: string
  responseStyle: string
  adviceTypes: string[]
  riskTolerance: string
  personalInfo: {
    age: number
    monthlyIncome: number
  }
  privacy: {
    saveConversations: boolean
    shareAnonymousData: boolean
    allowPersonalization: boolean
  }
  advanced: {
    maxTokens: number
    temperature: number
  }
}

// Props
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  save: [settings: AISettings]
}>()

// 设置数据
const settings = reactive<AISettings>({
  model: 'gpt-4',
  responseStyle: 'professional',
  adviceTypes: ['investment', 'savings'],
  riskTolerance: 'moderate',
  personalInfo: {
    age: 35,
    monthlyIncome: 3000
  },
  privacy: {
    saveConversations: true,
    shareAnonymousData: false,
    allowPersonalization: true
  },
  advanced: {
    maxTokens: 500,
    temperature: 0.7
  }
})

// 方法
const closeModal = () => {
  emit('close')
}

const saveSettings = () => {
  // 保存设置到localStorage
  localStorage.setItem('ai-settings', JSON.stringify(settings))
  emit('save', { ...settings })
  closeModal()
}

const resetToDefaults = () => {
  Object.assign(settings, {
    model: 'gpt-4',
    responseStyle: 'professional',
    adviceTypes: ['investment', 'savings'],
    riskTolerance: 'moderate',
    personalInfo: {
      age: 35,
      monthlyIncome: 3000
    },
    privacy: {
      saveConversations: true,
      shareAnonymousData: false,
      allowPersonalization: true
    },
    advanced: {
      maxTokens: 500,
      temperature: 0.7
    }
  })
}

// 加载保存的设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('ai-settings')
    if (saved) {
      Object.assign(settings, JSON.parse(saved))
    }
  } catch (error) {
    console.warn('无法加载AI设置:', error)
  }
}

// 监听模态框打开状态
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadSettings()
  }
})
</script>

<style scoped>
/* 自定义滑块样式 */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

.dark input[type="range"] {
  background: #4b5563;
}
</style>
