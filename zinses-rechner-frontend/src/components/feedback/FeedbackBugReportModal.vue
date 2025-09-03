<!--
  错误报告模态框组件
  提供用户错误报告的界面
-->

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框标题 -->
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t('feedback.reportBug') }}
        </h3>
        <button
          @click="$emit('close')"
          class="close-button"
          :aria-label="t('common.close')"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-content">
        <form @submit.prevent="submitBugReport">
          <!-- 错误标题 -->
          <div class="title-section mb-6">
            <label class="section-label" for="title">
              {{ t('feedback.bugTitle') }}
            </label>
            <input
              id="title"
              v-model="title"
              type="text"
              class="title-input"
              :placeholder="t('feedback.bugTitlePlaceholder')"
              maxlength="100"
              required
            />
            <div class="character-count">
              {{ title.length }}/100
            </div>
          </div>

          <!-- 错误描述 -->
          <div class="description-section mb-6">
            <label class="section-label" for="description">
              {{ t('feedback.bugDescription') }}
            </label>
            <p class="section-description">
              {{ t('feedback.describeBugSteps') }}
            </p>
            <textarea
              id="description"
              v-model="description"
              class="description-textarea"
              :placeholder="t('feedback.bugDescriptionPlaceholder')"
              rows="6"
              maxlength="1000"
              required
            ></textarea>
            <div class="character-count">
              {{ description.length }}/1000
            </div>
          </div>

          <!-- 错误严重程度 -->
          <div class="severity-section mb-6">
            <label class="section-label">
              {{ t('feedback.bugSeverity') }}
            </label>
            <div class="severity-options grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <label
                v-for="severityOption in severityOptions"
                :key="severityOption.value"
                class="severity-option-label"
                :class="{ 'selected': severity === severityOption.value }"
              >
                <input
                  v-model="severity"
                  type="radio"
                  :value="severityOption.value"
                  class="severity-option-radio"
                />
                <div class="severity-option-content">
                  <component :is="severityOption.icon" :class="['w-5 h-5', severityOption.colorClass]" />
                  <div class="severity-option-text">
                    <div class="severity-option-title">{{ severityOption.title }}</div>
                    <div class="severity-option-description">{{ severityOption.description }}</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 重现步骤 -->
          <div class="steps-section mb-6">
            <label class="section-label" for="steps">
              {{ t('feedback.stepsToReproduce') }}
            </label>
            <p class="section-description">
              {{ t('feedback.listStepsToReproduce') }}
            </p>
            <textarea
              id="steps"
              v-model="stepsToReproduce"
              class="steps-textarea"
              :placeholder="t('feedback.stepsPlaceholder')"
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="character-count">
              {{ stepsToReproduce.length }}/500
            </div>
          </div>

          <!-- 期望行为 -->
          <div class="expected-section mb-6">
            <label class="section-label" for="expected">
              {{ t('feedback.expectedBehavior') }}
            </label>
            <textarea
              id="expected"
              v-model="expectedBehavior"
              class="expected-textarea"
              :placeholder="t('feedback.expectedBehaviorPlaceholder')"
              rows="3"
              maxlength="300"
            ></textarea>
            <div class="character-count">
              {{ expectedBehavior.length }}/300
            </div>
          </div>

          <!-- 系统信息 -->
          <div class="system-info-section mb-6">
            <label class="section-label">
              {{ t('feedback.systemInformation') }}
            </label>
            <div class="system-info bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div class="info-grid grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div class="info-item">
                  <span class="info-label">{{ t('feedback.browser') }}:</span>
                  <span class="info-value">{{ systemInfo.browser }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('feedback.operatingSystem') }}:</span>
                  <span class="info-value">{{ systemInfo.os }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('feedback.screenResolution') }}:</span>
                  <span class="info-value">{{ systemInfo.screenResolution }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('feedback.timestamp') }}:</span>
                  <span class="info-value">{{ systemInfo.timestamp }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 附加选项 -->
          <div class="options-section mb-6">
            <label class="section-label">
              {{ t('feedback.additionalOptions') }}
            </label>
            <div class="options-list space-y-3 mt-2">
              <label class="option-label">
                <input
                  v-model="includeScreenshot"
                  type="checkbox"
                  class="option-checkbox"
                />
                <span class="option-text">{{ t('feedback.includeScreenshot') }}</span>
                <span class="option-description">{{ t('feedback.screenshotHelps') }}</span>
              </label>
              
              <label class="option-label">
                <input
                  v-model="includeConsoleLog"
                  type="checkbox"
                  class="option-checkbox"
                />
                <span class="option-text">{{ t('feedback.includeConsoleLog') }}</span>
                <span class="option-description">{{ t('feedback.consoleLogHelps') }}</span>
              </label>
              
              <label class="option-label">
                <input
                  v-model="allowFollowUp"
                  type="checkbox"
                  class="option-checkbox"
                />
                <span class="option-text">{{ t('feedback.allowFollowUp') }}</span>
                <span class="option-description">{{ t('feedback.followUpHelps') }}</span>
              </label>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="modal-actions">
            <button
              type="button"
              @click="$emit('close')"
              class="cancel-button"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="!isValid"
              class="submit-button"
            >
              {{ t('feedback.submitBugReport') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  XMarkIcon, 
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  FireIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'

// Emits
interface Emits {
  'close': []
  'submit': [data: { 
    title: string
    description: string
    severity: string
    stepsToReproduce?: string
    expectedBehavior?: string
    includeScreenshot: boolean
    includeConsoleLog: boolean
    allowFollowUp: boolean
  }]
}

const emit = defineEmits<Emits>()

// 使用i18n
const { t } = useI18n()

// 响应式状态
const title = ref('')
const description = ref('')
const severity = ref('medium')
const stepsToReproduce = ref('')
const expectedBehavior = ref('')
const includeScreenshot = ref(true)
const includeConsoleLog = ref(false)
const allowFollowUp = ref(true)

// 系统信息
const systemInfo = ref({
  browser: '',
  os: '',
  screenResolution: '',
  timestamp: ''
})

// 严重程度选项
const severityOptions = [
  {
    value: 'low',
    title: t('feedback.lowSeverity'),
    description: t('feedback.lowSeverityDescription'),
    icon: InformationCircleIcon,
    colorClass: 'text-blue-500'
  },
  {
    value: 'medium',
    title: t('feedback.mediumSeverity'),
    description: t('feedback.mediumSeverityDescription'),
    icon: ExclamationTriangleIcon,
    colorClass: 'text-yellow-500'
  },
  {
    value: 'high',
    title: t('feedback.highSeverity'),
    description: t('feedback.highSeverityDescription'),
    icon: ExclamationCircleIcon,
    colorClass: 'text-red-500'
  },
  {
    value: 'critical',
    title: t('feedback.criticalSeverity'),
    description: t('feedback.criticalSeverityDescription'),
    icon: FireIcon,
    colorClass: 'text-red-600'
  }
]

// 计算属性
const isValid = computed(() => {
  return title.value.trim().length > 0 && description.value.trim().length > 0
})

// 方法
const detectSystemInfo = (): void => {
  const userAgent = navigator.userAgent
  
  // 检测浏览器
  let browser = 'Unknown'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  
  // 检测操作系统
  let os = 'Unknown'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'
  
  systemInfo.value = {
    browser,
    os,
    screenResolution: `${screen.width}×${screen.height}`,
    timestamp: new Date().toLocaleString('de-DE')
  }
}

const handleOverlayClick = (): void => {
  emit('close')
}

const submitBugReport = (): void => {
  if (!isValid.value) return
  
  const data = {
    title: title.value.trim(),
    description: description.value.trim(),
    severity: severity.value,
    stepsToReproduce: stepsToReproduce.value.trim() || undefined,
    expectedBehavior: expectedBehavior.value.trim() || undefined,
    includeScreenshot: includeScreenshot.value,
    includeConsoleLog: includeConsoleLog.value,
    allowFollowUp: allowFollowUp.value
  }
  
  emit('submit', data)
}

// 生命周期
onMounted(() => {
  detectSystemInfo()
})
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors duration-200;
}

.modal-content {
  @apply p-6;
}

.section-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.section-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-3;
}

.title-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.description-textarea,
.steps-textarea,
.expected-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none;
}

.character-count {
  @apply text-xs text-gray-500 dark:text-gray-500 text-right mt-1;
}

.severity-option-label {
  @apply relative p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600;
}

.severity-option-label.selected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.severity-option-radio {
  @apply absolute top-3 right-3 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2;
}

.severity-option-content {
  @apply flex items-start space-x-3;
}

.severity-option-text {
  @apply flex-1;
}

.severity-option-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.severity-option-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.info-item {
  @apply flex justify-between;
}

.info-label {
  @apply font-medium text-gray-700 dark:text-gray-300;
}

.info-value {
  @apply text-gray-600 dark:text-gray-400;
}

.option-label {
  @apply flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200;
}

.option-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5;
}

.option-text {
  @apply font-medium text-gray-900 dark:text-white;
}

.option-description {
  @apply block text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.modal-actions {
  @apply flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

.submit-button {
  @apply px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .modal-container {
    @apply max-w-full m-2;
  }
  
  .severity-options {
    @apply grid-cols-1;
  }
  
  .info-grid {
    @apply grid-cols-1;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .modal-container {
  @apply border-2 border-current;
}

/* 动画 */
.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  animation: slideIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
