<!--
  500 服务器错误页面
  用户友好的服务器错误界面
-->

<template>
  <div class="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
    <div class="max-w-2xl mx-auto text-center">
      <!-- 错误图标和数字 -->
      <div class="mb-8">
        <div class="relative">
          <!-- 500 数字 -->
          <h1 class="text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">
            500
          </h1>
          
          <!-- 错误图标覆盖 -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transform -rotate-12">
              <svg class="w-16 h-16 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Interner Serverfehler
        </h2>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-2">
          Es ist ein unerwarteter Fehler aufgetreten.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          Unser Team wurde automatisch benachrichtigt und arbeitet an einer Lösung.
        </p>
      </div>

      <!-- 错误详情（仅在开发模式显示） -->
      <div v-if="isDevelopment && errorDetails" class="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <details class="text-left">
          <summary class="cursor-pointer font-medium text-red-800 dark:text-red-200 mb-2">
            Fehlerdetails (nur im Entwicklungsmodus)
          </summary>
          <pre class="text-sm text-red-700 dark:text-red-300 overflow-x-auto whitespace-pre-wrap">{{ errorDetails }}</pre>
        </details>
      </div>

      <!-- 状态信息 -->
      <div class="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Systemstatus
          </h3>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full mr-2" :class="statusColor"></div>
            <span class="text-sm font-medium" :class="statusTextColor">
              {{ statusText }}
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="text-center">
            <div class="font-medium text-gray-900 dark:text-white">Fehler-ID</div>
            <div class="text-gray-500 dark:text-gray-400 font-mono">{{ errorId }}</div>
          </div>
          <div class="text-center">
            <div class="font-medium text-gray-900 dark:text-white">Zeitpunkt</div>
            <div class="text-gray-500 dark:text-gray-400">{{ errorTime }}</div>
          </div>
          <div class="text-center">
            <div class="font-medium text-gray-900 dark:text-white">Letzte Aktualisierung</div>
            <div class="text-gray-500 dark:text-gray-400">{{ lastUpdate }}</div>
          </div>
        </div>
      </div>

      <!-- 建议的操作 -->
      <div class="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Was können Sie tun?
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div class="flex items-start">
            <div class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span class="text-blue-600 dark:text-blue-300 text-sm font-bold">1</span>
            </div>
            <div>
              <div class="font-medium text-blue-900 dark:text-blue-100">Seite neu laden</div>
              <div class="text-blue-700 dark:text-blue-300 text-sm">Manchmal hilft ein einfacher Neustart</div>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span class="text-blue-600 dark:text-blue-300 text-sm font-bold">2</span>
            </div>
            <div>
              <div class="font-medium text-blue-900 dark:text-blue-100">Später versuchen</div>
              <div class="text-blue-700 dark:text-blue-300 text-sm">Das Problem könnte temporär sein</div>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span class="text-blue-600 dark:text-blue-300 text-sm font-bold">3</span>
            </div>
            <div>
              <div class="font-medium text-blue-900 dark:text-blue-100">Cache leeren</div>
              <div class="text-blue-700 dark:text-blue-300 text-sm">Browser-Cache und Cookies löschen</div>
            </div>
          </div>
          
          <div class="flex items-start">
            <div class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span class="text-blue-600 dark:text-blue-300 text-sm font-bold">4</span>
            </div>
            <div>
              <div class="font-medium text-blue-900 dark:text-blue-100">Support kontaktieren</div>
              <div class="text-blue-700 dark:text-blue-300 text-sm">Falls das Problem weiterhin besteht</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          @click="reloadPage"
          class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <ArrowPathIcon class="w-5 h-5 mr-2" />
          Seite neu laden
        </button>
        
        <router-link
          to="/"
          class="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <HomeIcon class="w-5 h-5 mr-2" />
          Zur Startseite
        </button>
        
        <button
          @click="reportError"
          class="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ExclamationTriangleIcon class="w-5 h-5 mr-2" />
          Fehler melden
        </button>
      </div>

      <!-- 联系信息 -->
      <div class="mt-12 text-center">
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Problem weiterhin vorhanden?
        </p>
        <div class="flex justify-center space-x-6">
          <a
            :href="`mailto:support@zinses-rechner.de?subject=Server Error ${errorId}&body=Error ID: ${errorId}%0ATime: ${errorTime}%0AURL: ${currentUrl}`"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            E-Mail Support
          </a>
          <a
            href="/status"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Systemstatus
          </a>
          <a
            href="https://twitter.com/zinses_rechner"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Twitter Updates
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowPathIcon,
  HomeIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { logger } from '@/services/LoggingService'
import { errorReporting, ErrorType, ErrorSeverity } from '@/services/ErrorReportingService'

const router = useRouter()
const route = useRoute()

// 错误信息
const errorId = ref(generateErrorId())
const errorTime = ref(new Date().toLocaleString('de-DE'))
const lastUpdate = ref(new Date().toLocaleString('de-DE'))
const currentUrl = ref(window.location.href)
const isDevelopment = ref(import.meta.env.DEV)
const errorDetails = ref(route.query.error as string || null)

// 系统状态
const systemStatus = ref<'investigating' | 'identified' | 'monitoring' | 'resolved'>('investigating')

const statusColor = computed(() => {
  switch (systemStatus.value) {
    case 'investigating': return 'bg-red-500'
    case 'identified': return 'bg-yellow-500'
    case 'monitoring': return 'bg-blue-500'
    case 'resolved': return 'bg-green-500'
    default: return 'bg-red-500'
  }
})

const statusTextColor = computed(() => {
  switch (systemStatus.value) {
    case 'investigating': return 'text-red-700 dark:text-red-300'
    case 'identified': return 'text-yellow-700 dark:text-yellow-300'
    case 'monitoring': return 'text-blue-700 dark:text-blue-300'
    case 'resolved': return 'text-green-700 dark:text-green-300'
    default: return 'text-red-700 dark:text-red-300'
  }
})

const statusText = computed(() => {
  switch (systemStatus.value) {
    case 'investigating': return 'Wird untersucht'
    case 'identified': return 'Problem identifiziert'
    case 'monitoring': return 'Wird überwacht'
    case 'resolved': return 'Behoben'
    default: return 'Wird untersucht'
  }
})

// 生成错误ID
function generateErrorId(): string {
  return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
}

// 页面加载时记录错误
onMounted(() => {
  logger.error('500 Server Error Page Displayed', 'error', {
    errorId: errorId.value,
    url: currentUrl.value,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  })
  
  // 报告服务器错误
  errorReporting.reportError({
    type: ErrorType.JAVASCRIPT,
    severity: ErrorSeverity.CRITICAL,
    message: `Server error displayed: ${errorId.value}`,
    url: currentUrl.value,
    context: {
      action: '500_page_view',
      errorId: errorId.value,
      route: route.path,
      errorDetails: errorDetails.value
    }
  })
  
  // 定期更新状态
  const statusInterval = setInterval(() => {
    lastUpdate.value = new Date().toLocaleString('de-DE')
    // 这里可以添加实际的状态检查逻辑
  }, 30000) // 每30秒更新一次
  
  // 清理定时器
  onUnmounted(() => {
    clearInterval(statusInterval)
  })
})

// 重新加载页面
const reloadPage = () => {
  logger.info('User clicked reload on 500 page', 'navigation', {
    errorId: errorId.value
  })
  
  window.location.reload()
}

// 报告错误
const reportError = () => {
  const errorReport = {
    errorId: errorId.value,
    url: currentUrl.value,
    timestamp: errorTime.value,
    userAgent: navigator.userAgent,
    errorDetails: errorDetails.value
  }
  
  const mailtoLink = `mailto:support@zinses-rechner.de?subject=Server Error Report ${errorId.value}&body=${encodeURIComponent(JSON.stringify(errorReport, null, 2))}`
  
  window.location.href = mailtoLink
  
  logger.info('User reported 500 error', 'support', errorReport)
}
</script>

<style scoped>
/* 自定义动画 */
@keyframes shake {
  0%, 100% {
    transform: translateX(0) rotate(-12deg);
  }
  25% {
    transform: translateX(-5px) rotate(-12deg);
  }
  75% {
    transform: translateX(5px) rotate(-12deg);
  }
}

.absolute .bg-white {
  animation: shake 2s ease-in-out infinite;
}

/* 响应式调整 */
@media (max-width: 640px) {
  h1 {
    font-size: 6rem;
  }
  
  .absolute .bg-white {
    padding: 1rem;
  }
  
  .absolute svg {
    width: 2rem;
    height: 2rem;
  }
}

/* 暗色模式过渡 */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
</style>
