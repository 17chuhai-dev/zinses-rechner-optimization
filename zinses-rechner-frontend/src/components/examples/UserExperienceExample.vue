<!--
  用户体验增强示例
  展示加载状态、动画效果、交互反馈等用户体验增强功能
-->

<template>
  <div class="user-experience-example">
    <div class="example-header">
      <h1>用户体验增强示例</h1>
      <p>展示加载状态、动画效果、交互反馈等用户体验增强功能</p>
    </div>

    <!-- 用户偏好设置 -->
    <div class="preferences-section">
      <h2>用户偏好设置</h2>
      <div class="preferences-grid">
        <label class="preference-item">
          <input
            v-model="config.animations.enabled"
            type="checkbox"
            @change="updateConfig"
          />
          <span>启用动画</span>
        </label>

        <label class="preference-item">
          <input
            v-model="config.feedback.haptic"
            type="checkbox"
            @change="updateConfig"
          />
          <span>触觉反馈</span>
        </label>

        <label class="preference-item">
          <input
            v-model="config.feedback.sound"
            type="checkbox"
            @change="updateConfig"
          />
          <span>声音反馈</span>
        </label>

        <label class="preference-item">
          <input
            v-model="config.accessibility.reduceMotion"
            type="checkbox"
            @change="updateConfig"
          />
          <span>减少动画</span>
        </label>
      </div>
    </div>

    <!-- 加载状态示例 -->
    <div class="loading-section">
      <h2>加载状态示例</h2>
      <div class="loading-demos">
        <div class="demo-card">
          <h3>旋转加载器</h3>
          <LoadingIndicator
            type="spinner"
            :show-text="true"
            text="计算中..."
            size="medium"
            variant="primary"
          />
          <button @click="demoSpinnerLoading" class="demo-button">
            演示旋转加载
          </button>
        </div>

        <div class="demo-card">
          <h3>进度条加载器</h3>
          <LoadingIndicator
            type="progress"
            :progress="progressValue"
            :show-text="true"
            :show-percentage="true"
            text="处理数据..."
          />
          <button @click="demoProgressLoading" class="demo-button">
            演示进度加载
          </button>
        </div>

        <div class="demo-card">
          <h3>计算器加载器</h3>
          <LoadingIndicator
            type="calculator"
            :show-steps="true"
            :calculation-steps="calculationSteps"
            :current-step="currentStep"
            text="执行计算..."
          />
          <button @click="demoCalculatorLoading" class="demo-button">
            演示计算加载
          </button>
        </div>

        <div class="demo-card">
          <h3>骨架屏加载器</h3>
          <LoadingIndicator
            type="skeleton"
            :skeleton-lines="4"
          />
          <button @click="demoSkeletonLoading" class="demo-button">
            演示骨架屏
          </button>
        </div>
      </div>
    </div>

    <!-- 动画数值示例 -->
    <div class="animated-values-section">
      <h2>动画数值示例</h2>
      <div class="values-grid">
        <div class="value-demo">
          <h3>货币动画</h3>
          <AnimatedValue
            :value="currencyValue"
            format="currency"
            :duration="1000"
            easing="ease-out"
            :highlight-change="true"
            :color-by-value="true"
            size="large"
            weight="bold"
          />
          <div class="value-controls">
            <button @click="updateCurrencyValue(10000)" class="control-button">€10,000</button>
            <button @click="updateCurrencyValue(25000)" class="control-button">€25,000</button>
            <button @click="updateCurrencyValue(50000)" class="control-button">€50,000</button>
          </div>
        </div>

        <div class="value-demo">
          <h3>百分比动画</h3>
          <AnimatedValue
            :value="percentageValue"
            format="percentage"
            :duration="800"
            easing="bounce"
            :highlight-change="true"
            :show-sign="true"
            size="large"
            weight="semibold"
          />
          <div class="value-controls">
            <button @click="updatePercentageValue(5.5)" class="control-button">5.5%</button>
            <button @click="updatePercentageValue(7.2)" class="control-button">7.2%</button>
            <button @click="updatePercentageValue(3.8)" class="control-button">3.8%</button>
          </div>
        </div>

        <div class="value-demo">
          <h3>数字动画</h3>
          <AnimatedValue
            :value="numberValue"
            format="number"
            :duration="1200"
            easing="elastic"
            :precision="0"
            :highlight-change="true"
            size="large"
            weight="bold"
          />
          <div class="value-controls">
            <button @click="updateNumberValue(15)" class="control-button">15年</button>
            <button @click="updateNumberValue(20)" class="control-button">20年</button>
            <button @click="updateNumberValue(25)" class="control-button">25年</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 交互反馈示例 -->
    <div class="feedback-section">
      <h2>交互反馈示例</h2>
      <div class="feedback-demos">
        <InteractiveFeedback
          feedback-type="button"
          :show-ripple="true"
          :show-glow="true"
          :haptic-feedback="config.feedback.haptic"
          :sound-feedback="config.feedback.sound"
          sound-type="click"
          variant="prominent"
          size="large"
          tooltip="点击体验反馈效果"
          @click="handleFeedbackClick"
        >
          <button class="feedback-button primary">
            <Icon name="zap" size="20" />
            交互反馈按钮
          </button>
        </InteractiveFeedback>

        <InteractiveFeedback
          feedback-type="card"
          :show-pulse="true"
          :show-shadow="true"
          variant="subtle"
          tooltip="悬停查看效果"
          @hover="handleFeedbackHover"
        >
          <div class="feedback-card">
            <Icon name="heart" size="24" />
            <h3>反馈卡片</h3>
            <p>悬停或点击查看反馈效果</p>
          </div>
        </InteractiveFeedback>

        <InteractiveFeedback
          feedback-type="input"
          :show-glow="true"
          variant="default"
          tooltip="输入时的反馈效果"
          @focus="handleFeedbackFocus"
        >
          <input
            type="text"
            placeholder="输入文本体验反馈..."
            class="feedback-input"
          />
        </InteractiveFeedback>
      </div>
    </div>

    <!-- 通知系统示例 -->
    <div class="notifications-section">
      <h2>通知系统示例</h2>
      <div class="notification-controls">
        <button @click="showSuccessNotification" class="notification-button success">
          <Icon name="check-circle" size="16" />
          成功通知
        </button>
        <button @click="showErrorNotification" class="notification-button error">
          <Icon name="x-circle" size="16" />
          错误通知
        </button>
        <button @click="showWarningNotification" class="notification-button warning">
          <Icon name="alert-triangle" size="16" />
          警告通知
        </button>
        <button @click="showInfoNotification" class="notification-button info">
          <Icon name="info" size="16" />
          信息通知
        </button>
      </div>
    </div>

    <!-- 性能指标 -->
    <div class="performance-section">
      <h2>性能指标</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">渲染时间</div>
          <div class="metric-value">{{ performanceMetrics.renderTime.toFixed(2) }}ms</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">交互时间</div>
          <div class="metric-value">{{ performanceMetrics.interactionTime.toFixed(2) }}ms</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">动画帧数</div>
          <div class="metric-value">{{ performanceMetrics.animationFrames }}</div>
        </div>
      </div>
    </div>

    <!-- 通知容器 -->
    <div class="notifications-container">
      <Transition name="notification-slide" mode="out-in">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification"
          :class="`notification-${notification.type}`"
        >
          <Icon :name="getNotificationIcon(notification.type)" size="16" />
          <span>{{ notification.message }}</span>
          <button @click="removeNotification(notification.id)" class="notification-close">
            <Icon name="x" size="14" />
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserExperience } from '@/composables/useUserExperience'
import LoadingIndicator from '@/components/ui/LoadingIndicator.vue'
import AnimatedValue from '@/components/ui/AnimatedValue.vue'
import InteractiveFeedback from '@/components/ui/InteractiveFeedback.vue'
import Icon from '@/components/ui/BaseIcon.vue'

// 响应式数据
const config = reactive({
  animations: {
    duration: 300,
    easing: 'ease-out',
    stagger: 50,
    enabled: true
  },
  feedback: {
    haptic: false,
    sound: false,
    visual: true,
    notifications: true
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    screenReader: false
  },
  performance: {
    enableOptimizations: true,
    lazyLoading: true,
    prefetch: false
  }
})

const progressValue = ref(0)
const currentStep = ref(0)
const calculationSteps = ['验证输入', '执行计算', '格式化结果', '显示结果']

const currencyValue = ref(15000)
const percentageValue = ref(5.5)
const numberValue = ref(15)

// 使用用户体验增强
const {
  loadingState,
  notifications,
  performanceMetrics,
  startLoading,
  stopLoading,
  updateLoadingProgress,
  updateLoadingStep,
  showNotification,
  removeNotification,
  triggerHapticFeedback,
  playSound,
  measureInteractionTime,
  announceToScreenReader
} = useUserExperience(config)

// 方法
const updateConfig = () => {
  console.log('配置已更新:', config)
}

const demoSpinnerLoading = () => {
  startLoading({
    loadingType: 'spinner',
    loadingText: '正在计算复利...'
  })

  setTimeout(() => {
    stopLoading()
    showNotification('success', '计算完成！')
  }, 2000)
}

const demoProgressLoading = () => {
  progressValue.value = 0
  const interval = setInterval(() => {
    progressValue.value += 10
    if (progressValue.value >= 100) {
      clearInterval(interval)
      showNotification('success', '数据处理完成！')
    }
  }, 200)
}

const demoCalculatorLoading = () => {
  currentStep.value = 0
  const stepInterval = setInterval(() => {
    if (currentStep.value < calculationSteps.length - 1) {
      currentStep.value++
    } else {
      clearInterval(stepInterval)
      showNotification('success', '计算流程完成！')
    }
  }, 800)
}

const demoSkeletonLoading = () => {
  showNotification('info', '骨架屏加载演示')
}

const updateCurrencyValue = (value: number) => {
  measureInteractionTime(() => {
    currencyValue.value = value
  })
  announceToScreenReader(`货币值已更新为 ${value} 欧元`)
}

const updatePercentageValue = (value: number) => {
  measureInteractionTime(() => {
    percentageValue.value = value
  })
  announceToScreenReader(`百分比值已更新为 ${value}%`)
}

const updateNumberValue = (value: number) => {
  measureInteractionTime(() => {
    numberValue.value = value
  })
  announceToScreenReader(`数字值已更新为 ${value}`)
}

const handleFeedbackClick = () => {
  triggerHapticFeedback('medium')
  playSound('click')
  showNotification('info', '按钮点击反馈')
}

const handleFeedbackHover = (isHovered: boolean) => {
  if (isHovered) {
    playSound('hover')
  }
}

const handleFeedbackFocus = () => {
  triggerHapticFeedback('light')
}

const showSuccessNotification = () => {
  showNotification('success', '操作成功完成！', 3000)
}

const showErrorNotification = () => {
  showNotification('error', '发生了一个错误！', 4000)
}

const showWarningNotification = () => {
  showNotification('warning', '请注意这个警告！', 3500)
}

const showInfoNotification = () => {
  showNotification('info', '这是一条信息提示。', 3000)
}

const getNotificationIcon = (type: string) => {
  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info'
  }
  return icons[type as keyof typeof icons] || 'info'
}
</script>

<style scoped>
.user-experience-example {
  @apply max-w-7xl mx-auto p-6 space-y-8;
}

.example-header {
  @apply text-center mb-8;
}

.example-header h1 {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.example-header p {
  @apply text-lg text-gray-600;
}

/* 用户偏好设置 */
.preferences-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.preferences-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-4;
}

.preferences-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.preference-item {
  @apply flex items-center gap-2 text-sm text-gray-700 cursor-pointer;
  @apply hover:text-gray-900 transition-colors;
}

.preference-item input[type="checkbox"] {
  @apply rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

/* 加载状态示例 */
.loading-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.loading-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.loading-demos {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.demo-card {
  @apply bg-gray-50 rounded-lg p-4 text-center space-y-4;
}

.demo-card h3 {
  @apply text-lg font-medium text-gray-800;
}

.demo-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply transition-colors;
}

/* 动画数值示例 */
.animated-values-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.animated-values-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.values-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-8;
}

.value-demo {
  @apply text-center space-y-4;
}

.value-demo h3 {
  @apply text-lg font-medium text-gray-800;
}

.value-controls {
  @apply flex justify-center gap-2;
}

.control-button {
  @apply px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md;
  @apply hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500;
  @apply transition-colors;
}

/* 交互反馈示例 */
.feedback-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.feedback-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.feedback-demos {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.feedback-button {
  @apply flex items-center gap-2 px-6 py-3 rounded-md font-medium;
  @apply focus:outline-none transition-all;
}

.feedback-button.primary {
  @apply bg-blue-600 text-white;
}

.feedback-card {
  @apply bg-gray-50 rounded-lg p-6 text-center space-y-3 cursor-pointer;
  @apply border-2 border-transparent hover:border-blue-300;
  @apply transition-all;
}

.feedback-card h3 {
  @apply text-lg font-medium text-gray-800;
}

.feedback-card p {
  @apply text-sm text-gray-600;
}

.feedback-input {
  @apply w-full px-4 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply transition-all;
}

/* 通知系统示例 */
.notifications-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.notifications-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.notification-controls {
  @apply flex flex-wrap gap-4;
}

.notification-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-md font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply transition-colors;
}

.notification-button.success {
  @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
}

.notification-button.error {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.notification-button.warning {
  @apply bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500;
}

.notification-button.info {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

/* 性能指标 */
.performance-section {
  @apply bg-white rounded-lg shadow-md p-6 border;
}

.performance-section h2 {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.metric-card {
  @apply bg-gray-50 rounded-lg p-4 text-center;
}

.metric-label {
  @apply text-sm text-gray-600 mb-1;
}

.metric-value {
  @apply text-2xl font-bold text-gray-900;
}

/* 通知容器 */
.notifications-container {
  @apply fixed top-4 right-4 z-50 space-y-2;
}

.notification {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg;
  @apply min-w-80 max-w-md;
}

.notification-success {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.notification-error {
  @apply bg-red-100 text-red-800 border border-red-200;
}

.notification-warning {
  @apply bg-yellow-100 text-yellow-800 border border-yellow-200;
}

.notification-info {
  @apply bg-blue-100 text-blue-800 border border-blue-200;
}

.notification-close {
  @apply ml-auto p-1 text-current hover:bg-black hover:bg-opacity-10 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-current focus:ring-opacity-50;
}

/* 通知动画 */
.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preferences-grid {
    @apply grid-cols-1;
  }

  .loading-demos {
    @apply grid-cols-1;
  }

  .values-grid {
    @apply grid-cols-1;
  }

  .feedback-demos {
    @apply grid-cols-1;
  }

  .notification-controls {
    @apply flex-col;
  }

  .metrics-grid {
    @apply grid-cols-1;
  }

  .notifications-container {
    @apply left-4 right-4;
  }

  .notification {
    @apply min-w-0;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .preferences-section,
  .loading-section,
  .animated-values-section,
  .feedback-section,
  .notifications-section,
  .performance-section {
    @apply bg-gray-800 border-gray-700;
  }

  .example-header h1 {
    @apply text-gray-100;
  }

  .example-header p {
    @apply text-gray-300;
  }

  .preferences-section h2,
  .loading-section h2,
  .animated-values-section h2,
  .feedback-section h2,
  .notifications-section h2,
  .performance-section h2 {
    @apply text-gray-100;
  }

  .demo-card,
  .feedback-card,
  .metric-card {
    @apply bg-gray-700;
  }

  .demo-card h3,
  .value-demo h3,
  .feedback-card h3 {
    @apply text-gray-100;
  }

  .feedback-card p {
    @apply text-gray-300;
  }

  .metric-label {
    @apply text-gray-300;
  }

  .metric-value {
    @apply text-gray-100;
  }

  .feedback-input {
    @apply bg-gray-700 border-gray-600 text-gray-100;
  }
}
</style>
