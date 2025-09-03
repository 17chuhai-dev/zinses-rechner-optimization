<!--
  手势配置面板组件
  提供手势识别参数配置和测试界面
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('gestures.configPanel') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('gestures.configDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <div class="gesture-status flex items-center space-x-2">
            <div :class="getGestureStatusClasses()"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ isSupported ? t('gestures.supported') : t('gestures.notSupported') }}
            </span>
          </div>
          
          <button
            @click="toggleGestureEnabled"
            :disabled="!isSupported"
            class="toggle-button"
          >
            {{ isEnabled ? t('gestures.disable') : t('gestures.enable') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 手势统计 -->
    <div class="gesture-stats mb-6">
      <div class="stats-grid grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="stat-card">
          <div class="stat-header">
            <HandRaisedIcon class="w-5 h-5 text-blue-500" />
            <span class="stat-title">{{ t('gestures.totalGestures') }}</span>
          </div>
          <div class="stat-value">{{ stats.totalGestures }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-header">
            <ClockIcon class="w-5 h-5 text-green-500" />
            <span class="stat-title">{{ t('gestures.averageDuration') }}</span>
          </div>
          <div class="stat-value">{{ formatDuration(stats.averageGestureDuration) }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-header">
            <ChartBarIcon class="w-5 h-5 text-purple-500" />
            <span class="stat-title">{{ t('gestures.mostUsed') }}</span>
          </div>
          <div class="stat-value">{{ getMostUsedGesture() }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-header">
            <CalendarIcon class="w-5 h-5 text-orange-500" />
            <span class="stat-title">{{ t('gestures.lastGesture') }}</span>
          </div>
          <div class="stat-value">{{ formatLastGestureTime() }}</div>
        </div>
      </div>
    </div>

    <!-- 手势类型分布 -->
    <div class="gesture-distribution mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('gestures.gestureDistribution') }}
      </h4>
      
      <div class="distribution-list space-y-3">
        <div
          v-for="(count, type) in stats.gesturesByType"
          :key="type"
          class="distribution-item"
        >
          <div class="distribution-header flex items-center justify-between">
            <div class="distribution-info flex items-center space-x-3">
              <component :is="getGestureIcon(type)" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span class="distribution-title">{{ getGestureLabel(type) }}</span>
            </div>
            <span class="distribution-count">{{ count }}</span>
          </div>
          <div class="distribution-bar">
            <div 
              class="distribution-fill bg-blue-500"
              :style="{ width: `${getGesturePercentage(type)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 手势配置 -->
    <div class="gesture-config mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('gestures.configuration') }}
      </h4>
      
      <div class="config-sections space-y-6">
        <!-- 点击配置 -->
        <div class="config-section">
          <h5 class="config-section-title">{{ t('gestures.tapSettings') }}</h5>
          
          <div class="config-fields grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="config-field">
              <label class="config-label">{{ t('gestures.tapTimeout') }} (ms)</label>
              <input
                v-model.number="localConfig.tapTimeout"
                type="number"
                min="100"
                max="1000"
                step="50"
                class="config-input"
              />
            </div>
            
            <div class="config-field">
              <label class="config-label">{{ t('gestures.doubleTapTimeout') }} (ms)</label>
              <input
                v-model.number="localConfig.doubleTapTimeout"
                type="number"
                min="100"
                max="1000"
                step="50"
                class="config-input"
              />
            </div>
            
            <div class="config-field">
              <label class="config-label">{{ t('gestures.longPressTimeout') }} (ms)</label>
              <input
                v-model.number="localConfig.longPressTimeout"
                type="number"
                min="300"
                max="2000"
                step="100"
                class="config-input"
              />
            </div>
            
            <div class="config-field">
              <label class="config-label">{{ t('gestures.tapThreshold') }} (px)</label>
              <input
                v-model.number="localConfig.tapThreshold"
                type="number"
                min="5"
                max="50"
                step="5"
                class="config-input"
              />
            </div>
          </div>
        </div>

        <!-- 滑动配置 -->
        <div class="config-section">
          <h5 class="config-section-title">{{ t('gestures.swipeSettings') }}</h5>
          
          <div class="config-fields grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="config-field">
              <label class="config-label">{{ t('gestures.swipeThreshold') }} (px)</label>
              <input
                v-model.number="localConfig.swipeThreshold"
                type="number"
                min="20"
                max="200"
                step="10"
                class="config-input"
              />
            </div>
            
            <div class="config-field">
              <label class="config-label">{{ t('gestures.swipeVelocityThreshold') }}</label>
              <input
                v-model.number="localConfig.swipeVelocityThreshold"
                type="number"
                min="0.1"
                max="2.0"
                step="0.1"
                class="config-input"
              />
            </div>
          </div>
        </div>

        <!-- 缩放配置 -->
        <div class="config-section">
          <h5 class="config-section-title">{{ t('gestures.pinchSettings') }}</h5>
          
          <div class="config-fields grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="config-field">
              <label class="config-label">{{ t('gestures.pinchThreshold') }} (px)</label>
              <input
                v-model.number="localConfig.pinchThreshold"
                type="number"
                min="5"
                max="50"
                step="5"
                class="config-input"
              />
            </div>
            
            <div class="config-field">
              <label class="config-label">{{ t('gestures.maxScale') }}</label>
              <input
                v-model.number="localConfig.maxScale"
                type="number"
                min="1.5"
                max="10"
                step="0.5"
                class="config-input"
              />
            </div>
            
            <div class="config-field">
              <label class="config-label">{{ t('gestures.minScale') }}</label>
              <input
                v-model.number="localConfig.minScale"
                type="number"
                min="0.1"
                max="1"
                step="0.1"
                class="config-input"
              />
            </div>
          </div>
        </div>

        <!-- 高级配置 -->
        <div class="config-section">
          <h5 class="config-section-title">{{ t('gestures.advancedSettings') }}</h5>
          
          <div class="advanced-options space-y-4">
            <label class="option-label">
              <input
                v-model="localConfig.preventDefaultEvents"
                type="checkbox"
                class="option-checkbox"
              />
              <div class="option-content">
                <span class="option-title">{{ t('gestures.preventDefaultEvents') }}</span>
                <span class="option-description">{{ t('gestures.preventDefaultDescription') }}</span>
              </div>
            </label>
            
            <label class="option-label">
              <input
                v-model="localConfig.enablePassiveListeners"
                type="checkbox"
                class="option-checkbox"
              />
              <div class="option-content">
                <span class="option-title">{{ t('gestures.enablePassiveListeners') }}</span>
                <span class="option-description">{{ t('gestures.passiveListenersDescription') }}</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 手势测试区域 -->
    <div class="gesture-test mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('gestures.testArea') }}
      </h4>
      
      <div 
        ref="testArea"
        class="test-area"
        :class="{ 'gesture-detected': lastDetectedGesture }"
      >
        <div class="test-content">
          <div v-if="lastDetectedGesture" class="detected-gesture">
            <component :is="getGestureIcon(lastDetectedGesture.type)" class="w-8 h-8 text-blue-500" />
            <div class="gesture-info">
              <div class="gesture-type">{{ getGestureLabel(lastDetectedGesture.type) }}</div>
              <div class="gesture-details">
                {{ formatGestureDetails(lastDetectedGesture) }}
              </div>
            </div>
          </div>
          
          <div v-else class="test-prompt">
            <HandRaisedIcon class="w-12 h-12 text-gray-400 mb-4" />
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('gestures.testPrompt') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions flex items-center justify-between">
      <div class="action-info">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('gestures.configurationActive') }}
        </span>
      </div>
      
      <div class="main-actions flex items-center space-x-3">
        <button
          @click="resetToDefaults"
          class="reset-button"
        >
          <ArrowUturnLeftIcon class="w-4 h-4 mr-2" />
          {{ t('gestures.resetDefaults') }}
        </button>
        
        <button
          @click="exportConfig"
          class="export-button"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          {{ t('gestures.exportConfig') }}
        </button>
        
        <button
          @click="applyConfig"
          :disabled="!hasConfigChanges"
          class="apply-button"
        >
          <CheckIcon class="w-4 h-4 mr-2" />
          {{ t('gestures.applyChanges') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import {
  HandRaisedIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowUturnLeftIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  CursorArrowRaysIcon,
  ArrowLongRightIcon,
  MagnifyingGlassPlusIcon,
  ArrowsPointingOutIcon
} from '@heroicons/vue/24/outline'
import { useGestures } from '@/services/GestureManager'
import { useI18n } from '@/services/I18nService'
import { saveAs } from '../utils/file-saver-mock'
import type { GestureConfig, GestureEvent, GestureType } from '@/services/GestureManager'

// Props
interface Props {
  showTitle?: boolean
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true
})

// 使用服务
const { 
  isEnabled, 
  isSupported, 
  stats, 
  addGestureListener, 
  removeGestureListener,
  setEnabled,
  getStats
} = useGestures()

const { t } = useI18n()

// 模板引用
const testArea = ref<HTMLElement>()

// 响应式状态
const lastDetectedGesture = ref<GestureEvent | null>(null)

// 本地配置
const localConfig = reactive<GestureConfig>({
  tapTimeout: 300,
  doubleTapTimeout: 300,
  longPressTimeout: 500,
  tapThreshold: 10,
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  pinchThreshold: 10,
  maxScale: 5,
  minScale: 0.5,
  panThreshold: 10,
  rotationThreshold: 15,
  preventDefaultEvents: true,
  enablePassiveListeners: false
})

const originalConfig = ref<GestureConfig>({ ...localConfig })

// 手势图标映射
const gestureIcons = {
  tap: CursorArrowRaysIcon,
  'double-tap': CursorArrowRaysIcon,
  'long-press': HandRaisedIcon,
  swipe: ArrowLongRightIcon,
  pinch: MagnifyingGlassPlusIcon,
  pan: HandRaisedIcon,
  rotate: ArrowsPointingOutIcon
}

// 计算属性
const containerClasses = computed(() => {
  const classes = ['gesture-config-panel', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'p-6']
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const ariaLabel = computed(() => {
  return `${t('gestures.configPanel')}: ${isSupported.value ? t('gestures.supported') : t('gestures.notSupported')}`
})

const hasConfigChanges = computed(() => {
  return JSON.stringify(localConfig) !== JSON.stringify(originalConfig.value)
})

// 方法
const getGestureStatusClasses = (): string[] => {
  const classes = ['w-2', 'h-2', 'rounded-full']
  
  if (isSupported.value && isEnabled.value) {
    classes.push('bg-green-500', 'animate-pulse')
  } else if (isSupported.value) {
    classes.push('bg-yellow-500')
  } else {
    classes.push('bg-red-500')
  }
  
  return classes
}

const getGestureIcon = (type: string) => {
  return gestureIcons[type as keyof typeof gestureIcons] || HandRaisedIcon
}

const getGestureLabel = (type: string): string => {
  const labels: Record<string, string> = {
    tap: t('gestures.tap'),
    'double-tap': t('gestures.doubleTap'),
    'long-press': t('gestures.longPress'),
    swipe: t('gestures.swipe'),
    pinch: t('gestures.pinch'),
    pan: t('gestures.pan'),
    rotate: t('gestures.rotate')
  }
  return labels[type] || type
}

const getMostUsedGesture = (): string => {
  const gestures = stats.gesturesByType
  const mostUsed = Object.entries(gestures).reduce((a, b) => 
    gestures[a[0]] > gestures[b[0]] ? a : b
  , ['', 0])
  
  return mostUsed[0] ? getGestureLabel(mostUsed[0]) : t('gestures.none')
}

const getGesturePercentage = (type: string): number => {
  const total = stats.totalGestures
  const count = stats.gesturesByType[type] || 0
  return total > 0 ? (count / total) * 100 : 0
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const formatLastGestureTime = (): string => {
  if (!stats.lastGestureTime) return t('gestures.never')
  
  const now = new Date()
  const diff = now.getTime() - stats.lastGestureTime.getTime()
  
  if (diff < 60000) return t('gestures.justNow')
  if (diff < 3600000) return t('gestures.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('gestures.hoursAgo', { count: Math.floor(diff / 3600000) })
  
  return stats.lastGestureTime.toLocaleDateString('de-DE')
}

const formatGestureDetails = (gesture: GestureEvent): string => {
  const details: string[] = []
  
  if (gesture.duration) {
    details.push(`${formatDuration(gesture.duration)}`)
  }
  
  if (gesture.direction) {
    details.push(t(`gestures.direction.${gesture.direction}`))
  }
  
  if (gesture.scale && gesture.scale !== 1) {
    details.push(`${(gesture.scale * 100).toFixed(0)}%`)
  }
  
  if (gesture.velocity) {
    details.push(`${gesture.velocity.toFixed(1)}px/ms`)
  }
  
  return details.join(' • ')
}

const toggleGestureEnabled = (): void => {
  setEnabled(!isEnabled.value)
}

const resetToDefaults = (): void => {
  if (confirm(t('gestures.confirmReset'))) {
    Object.assign(localConfig, {
      tapTimeout: 300,
      doubleTapTimeout: 300,
      longPressTimeout: 500,
      tapThreshold: 10,
      swipeThreshold: 50,
      swipeVelocityThreshold: 0.3,
      pinchThreshold: 10,
      maxScale: 5,
      minScale: 0.5,
      panThreshold: 10,
      rotationThreshold: 15,
      preventDefaultEvents: true,
      enablePassiveListeners: false
    })
  }
}

const exportConfig = (): void => {
  const configData = {
    gestureConfig: { ...localConfig },
    stats: getStats(),
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
  const filename = `gesture-config-${new Date().toISOString().slice(0, 10)}.json`
  saveAs(blob, filename)
}

const applyConfig = (): void => {
  if (!hasConfigChanges.value) return
  
  // 这里应该调用手势管理器的配置更新方法
  // gestureManager.updateConfig(localConfig)
  
  originalConfig.value = { ...localConfig }
  console.log('Gesture config applied:', localConfig)
}

const handleTestGesture = (event: GestureEvent): void => {
  lastDetectedGesture.value = event
  
  // 清除之前的手势显示
  setTimeout(() => {
    lastDetectedGesture.value = null
  }, 3000)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  
  if (isSupported.value && testArea.value) {
    // 为测试区域添加所有手势监听器
    addGestureListener(
      testArea.value,
      ['tap', 'double-tap', 'long-press', 'swipe', 'pinch', 'pan', 'rotate'],
      handleTestGesture,
      localConfig
    )
  }
})

onUnmounted(() => {
  if (testArea.value) {
    removeGestureListener(testArea.value)
  }
})
</script>

<style scoped>
.gesture-config-panel {
  @apply max-w-6xl mx-auto;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm;
}

.stat-header {
  @apply flex items-center space-x-2 mb-2;
}

.stat-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.distribution-item {
  @apply bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700;
}

.distribution-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.distribution-count {
  @apply text-sm font-bold text-gray-900 dark:text-white;
}

.distribution-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2;
}

.distribution-fill {
  @apply h-full transition-all duration-300;
}

.config-section {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
}

.config-section-title {
  @apply text-sm font-medium text-gray-900 dark:text-white mb-4;
}

.config-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.config-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.option-label {
  @apply flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200;
}

.option-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5;
}

.option-content {
  @apply flex-1;
}

.option-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.option-description {
  @apply block text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.test-area {
  @apply relative min-h-[200px] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center transition-all duration-300;
}

.test-area.gesture-detected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg;
}

.test-content {
  @apply text-center;
}

.detected-gesture {
  @apply flex flex-col items-center space-y-3;
}

.gesture-info {
  @apply text-center;
}

.gesture-type {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.gesture-details {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.test-prompt {
  @apply flex flex-col items-center;
}

.toggle-button {
  @apply px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.toggle-button:not(:disabled) {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.reset-button,
.export-button,
.apply-button {
  @apply flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.reset-button {
  @apply text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500;
}

.export-button {
  @apply text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500;
}

.apply-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:ring-blue-500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-grid {
    @apply grid-cols-1;
  }
  
  .config-fields {
    @apply grid-cols-1;
  }
  
  .panel-actions {
    @apply flex-col space-y-3;
  }
  
  .main-actions {
    @apply w-full justify-between;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .stat-card {
  @apply border-2 border-current;
}

/* 暗色模式支持 */
:global(.theme-dark) .stat-card {
  @apply bg-gray-800 border-gray-600;
}

/* 动画 */
.test-area.gesture-detected {
  animation: gestureDetected 0.5s ease-out;
}

@keyframes gestureDetected {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

/* 打印样式 */
@media print {
  .panel-actions,
  .header-actions {
    @apply hidden;
  }
}
</style>
