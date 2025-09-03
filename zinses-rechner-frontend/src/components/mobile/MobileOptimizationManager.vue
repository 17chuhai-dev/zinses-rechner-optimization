<!--
  移动端优化管理器
  提供移动端特定的优化功能，包括触摸优化、手势支持、性能优化等
-->

<template>
  <div class="mobile-optimization-manager">
    <!-- PWA安装提示 -->
    <div
      v-if="showInstallPrompt && pwaState.isInstallable"
      class="install-prompt fixed bottom-4 left-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <DevicePhoneMobileIcon class="w-6 h-6 text-blue-600" />
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-gray-900">
            App installieren
          </h3>
          <p class="text-sm text-gray-600 mt-1">
            Installieren Sie Zinses-Rechner für schnelleren Zugriff und Offline-Nutzung.
          </p>
        </div>
        <div class="ml-4 flex-shrink-0 flex gap-2">
          <button
            @click="dismissInstallPrompt"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            Später
          </button>
          <button
            @click="installApp"
            class="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Installieren
          </button>
        </div>
      </div>
    </div>

    <!-- 离线指示器 -->
    <div
      v-if="!pwaState.isOnline"
      class="offline-indicator fixed top-0 left-0 right-0 z-40 bg-yellow-500 text-white text-center py-2 text-sm"
    >
      <WifiIcon class="w-4 h-4 inline mr-2" />
      Offline-Modus - Einige Funktionen sind möglicherweise nicht verfügbar
    </div>

    <!-- 更新提示 -->
    <div
      v-if="pwaState.updateAvailable"
      class="update-prompt fixed top-16 left-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4"
    >
      <div class="flex items-center">
        <ArrowPathIcon class="w-5 h-5 text-green-600 mr-3" />
        <div class="flex-1">
          <p class="text-sm text-green-800">
            Eine neue Version ist verfügbar!
          </p>
        </div>
        <button
          @click="updateApp"
          class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          Aktualisieren
        </button>
      </div>
    </div>

    <!-- 触摸反馈覆盖层 -->
    <div
      v-if="touchFeedback.visible"
      :class="[
        'touch-feedback fixed pointer-events-none z-30 rounded-full bg-blue-500 opacity-30',
        'transform -translate-x-1/2 -translate-y-1/2 animate-ping'
      ]"
      :style="{
        left: touchFeedback.x + 'px',
        top: touchFeedback.y + 'px',
        width: touchFeedback.size + 'px',
        height: touchFeedback.size + 'px'
      }"
    ></div>

    <!-- 手势提示 -->
    <div
      v-if="showGestureHints && gestureHints.length > 0"
      class="gesture-hints fixed bottom-20 left-4 right-4 z-40"
    >
      <div class="bg-black bg-opacity-75 text-white rounded-lg p-3">
        <div class="flex items-center mb-2">
          <HandRaisedIcon class="w-4 h-4 mr-2" />
          <span class="text-sm font-medium">Gesten-Tipps</span>
        </div>
        <div class="space-y-1">
          <div
            v-for="hint in gestureHints"
            :key="hint.id"
            class="text-xs text-gray-300"
          >
            {{ hint.text }}
          </div>
        </div>
        <button
          @click="dismissGestureHints"
          class="text-xs text-blue-300 mt-2"
        >
          Verstanden
        </button>
      </div>
    </div>

    <!-- 性能监控面板 (开发模式) -->
    <div
      v-if="isDevelopment && showPerformancePanel"
      class="performance-panel fixed top-4 right-4 z-50 bg-black bg-opacity-90 text-white rounded-lg p-3 text-xs"
    >
      <div class="mb-2 font-medium">Performance</div>
      <div class="space-y-1">
        <div>FPS: {{ performanceMetrics.fps }}</div>
        <div>Memory: {{ formatBytes(performanceMetrics.memory) }}</div>
        <div>Touch Latency: {{ performanceMetrics.touchLatency }}ms</div>
        <div>Render Time: {{ performanceMetrics.renderTime }}ms</div>
      </div>
      <button
        @click="showPerformancePanel = false"
        class="text-xs text-gray-400 mt-2"
      >
        Schließen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
  DevicePhoneMobileIcon,
  WifiIcon,
  ArrowPathIcon,
  HandRaisedIcon
} from '@heroicons/vue/24/outline'
import { usePWA } from '@/services/PWAManager'

// PWA状态
const { state: pwaState, showInstallPrompt: installPWA, updateServiceWorker } = usePWA()

// 组件状态
const showInstallPrompt = ref(true)
const showGestureHints = ref(false)
const showPerformancePanel = ref(false)
const isDevelopment = ref(import.meta.env.DEV)

// 触摸反馈状态
const touchFeedback = reactive({
  visible: false,
  x: 0,
  y: 0,
  size: 40
})

// 性能指标
const performanceMetrics = reactive({
  fps: 60,
  memory: 0,
  touchLatency: 0,
  renderTime: 0
})

// 手势提示
const gestureHints = ref([
  { id: 1, text: 'Wischen Sie nach links/rechts für Navigation' },
  { id: 2, text: 'Tippen und halten für Kontextmenü' },
  { id: 3, text: 'Zwei Finger zum Zoomen in Diagrammen' }
])

// 计算属性
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

// 方法
const installApp = async () => {
  try {
    const installed = await installPWA()
    if (installed) {
      showInstallPrompt.value = false
    }
  } catch (error) {
    console.error('App installation failed:', error)
  }
}

const dismissInstallPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('installPromptDismissed', Date.now().toString())
}

const updateApp = async () => {
  try {
    await updateServiceWorker()
  } catch (error) {
    console.error('App update failed:', error)
  }
}

const dismissGestureHints = () => {
  showGestureHints.value = false
  localStorage.setItem('gestureHintsDismissed', 'true')
}

const showTouchFeedback = (event: TouchEvent) => {
  if (!isMobile.value) return

  const touch = event.touches[0]
  touchFeedback.x = touch.clientX
  touchFeedback.y = touch.clientY
  touchFeedback.visible = true

  setTimeout(() => {
    touchFeedback.visible = false
  }, 300)
}

const handleTouchStart = (event: TouchEvent) => {
  const startTime = performance.now()

  // 显示触摸反馈
  showTouchFeedback(event)

  // 测量触摸延迟
  requestAnimationFrame(() => {
    performanceMetrics.touchLatency = performance.now() - startTime
  })
}

const handleTouchEnd = (event: TouchEvent) => {
  // 触摸结束处理
}

const setupGestureRecognition = () => {
  let startX = 0
  let startY = 0
  let startTime = 0

  document.addEventListener('touchstart', (event) => {
    const touch = event.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    startTime = Date.now()

    handleTouchStart(event)
  }, { passive: true })

  document.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0]
    const endX = touch.clientX
    const endY = touch.clientY
    const endTime = Date.now()

    const deltaX = endX - startX
    const deltaY = endY - startY
    const deltaTime = endTime - startTime

    // 检测滑动手势
    if (Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0) {
        // 右滑
        document.dispatchEvent(new CustomEvent('swipe-right'))
      } else {
        // 左滑
        document.dispatchEvent(new CustomEvent('swipe-left'))
      }
    }

    if (Math.abs(deltaY) > 50 && deltaTime < 300) {
      if (deltaY > 0) {
        // 下滑
        document.dispatchEvent(new CustomEvent('swipe-down'))
      } else {
        // 上滑
        document.dispatchEvent(new CustomEvent('swipe-up'))
      }
    }

    handleTouchEnd(event)
  }, { passive: true })
}

const setupPerformanceMonitoring = () => {
  if (!isDevelopment.value) return

  let frameCount = 0
  let lastTime = performance.now()

  const measureFPS = () => {
    frameCount++
    const currentTime = performance.now()

    if (currentTime - lastTime >= 1000) {
      performanceMetrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
      frameCount = 0
      lastTime = currentTime
    }

    requestAnimationFrame(measureFPS)
  }

  measureFPS()

  // 监控内存使用
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory
      performanceMetrics.memory = memory.usedJSHeapSize
    }, 1000)
  }

  // 监控渲染时间
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'measure-render') {
        performanceMetrics.renderTime = entry.duration
      }
    }
  })

  observer.observe({ entryTypes: ['measure'] })
}

const optimizeMobilePerformance = () => {
  // 禁用iOS的弹性滚动
  document.body.style.overscrollBehavior = 'none'

  // 优化触摸响应
  document.body.style.touchAction = 'manipulation'

  // 禁用文本选择（在某些情况下）
  document.body.style.userSelect = 'none'
  document.body.style.webkitUserSelect = 'none'

  // 优化滚动性能
  document.body.style.webkitOverflowScrolling = 'touch'

  // 禁用双击缩放
  let lastTouchEnd = 0
  document.addEventListener('touchend', (event) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, false)
}

const checkGestureHintsVisibility = () => {
  const dismissed = localStorage.getItem('gestureHintsDismissed')
  if (!dismissed && isMobile.value) {
    setTimeout(() => {
      showGestureHints.value = true
    }, 3000)
  }
}

const checkInstallPromptVisibility = () => {
  const dismissed = localStorage.getItem('installPromptDismissed')
  const dismissedTime = dismissed ? parseInt(dismissed) : 0
  const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

  // 7天后重新显示安装提示
  if (daysSinceDismissed > 7) {
    localStorage.removeItem('installPromptDismissed')
    showInstallPrompt.value = true
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// 生命周期
onMounted(() => {
  if (isMobile.value) {
    setupGestureRecognition()
    optimizeMobilePerformance()
    checkGestureHintsVisibility()
    checkInstallPromptVisibility()
  }

  setupPerformanceMonitoring()

  // 开发模式下显示性能面板
  if (isDevelopment.value) {
    // 双击显示性能面板
    let clickCount = 0
    document.addEventListener('click', () => {
      clickCount++
      setTimeout(() => {
        if (clickCount === 2) {
          showPerformancePanel.value = !showPerformancePanel.value
        }
        clickCount = 0
      }, 300)
    })
  }
})

onUnmounted(() => {
  // 清理事件监听器
})
</script>

<style scoped>
.install-prompt {
  animation: slideUp 0.3s ease-out;
}

.update-prompt {
  animation: slideDown 0.3s ease-out;
}

.gesture-hints {
  animation: fadeIn 0.5s ease-out;
}

.touch-feedback {
  animation: touchRipple 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes touchRipple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* 移动端优化样式 */
@media (max-width: 768px) {
  .install-prompt {
    @apply mx-2;
  }

  .update-prompt {
    @apply mx-2;
  }

  .gesture-hints {
    @apply mx-2;
  }
}

/* 触摸目标优化 */
:deep(button),
:deep(a),
:deep(input),
:deep(select) {
  min-height: 44px;
  min-width: 44px;
}

/* 滚动优化 */
:deep(.scrollable) {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* 触摸反馈 */
:deep(.touch-target) {
  -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
  tap-highlight-color: rgba(59, 130, 246, 0.3);
}
</style>
