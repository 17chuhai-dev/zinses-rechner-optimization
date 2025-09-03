<!--
  404 错误页面
  用户友好的页面未找到界面
-->

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
    <div class="max-w-2xl mx-auto text-center">
      <!-- 错误图标和数字 -->
      <div class="mb-8">
        <div class="relative">
          <!-- 404 数字 -->
          <h1 class="text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">
            404
          </h1>
          
          <!-- 计算器图标覆盖 -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transform rotate-12">
              <svg class="w-16 h-16 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Seite nicht gefunden
        </h2>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-2">
          Die angeforderte Seite konnte nicht gefunden werden.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          Möglicherweise wurde sie verschoben, gelöscht oder Sie haben eine falsche URL eingegeben.
        </p>
      </div>

      <!-- 搜索建议 -->
      <div class="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Vielleicht suchen Sie nach:
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <router-link
            v-for="suggestion in suggestions"
            :key="suggestion.path"
            :to="suggestion.path"
            class="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="flex-shrink-0 mr-3">
              <component :is="suggestion.icon" class="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
            </div>
            <div class="text-left">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ suggestion.title }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ suggestion.description }}
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          @click="goBack"
          class="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeftIcon class="w-5 h-5 mr-2" />
          Zurück
        </button>
        
        <router-link
          to="/"
          class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <HomeIcon class="w-5 h-5 mr-2" />
          Zur Startseite
        </router-link>
        
        <button
          @click="reportIssue"
          class="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ExclamationTriangleIcon class="w-5 h-5 mr-2" />
          Problem melden
        </button>
      </div>

      <!-- 联系信息 -->
      <div class="mt-12 text-center">
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Benötigen Sie weitere Hilfe?
        </p>
        <div class="flex justify-center space-x-6">
          <a
            href="mailto:support@zinses-rechner.de"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            E-Mail Support
          </a>
          <a
            href="/hilfe"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Hilfe-Center
          </a>
          <a
            href="/faq"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            FAQ
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  CalculatorIcon,
  ChartBarIcon,
  CogIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline'
import { logger } from '@/services/LoggingService'
import { errorReporting, ErrorType, ErrorSeverity } from '@/services/ErrorReportingService'

const router = useRouter()

// 页面建议
const suggestions = ref([
  {
    path: '/',
    title: 'Startseite',
    description: 'Zurück zur Hauptseite',
    icon: HomeIcon
  },
  {
    path: '/zinseszins',
    title: 'Zinseszins-Rechner',
    description: 'Berechnen Sie Zinserträge',
    icon: CalculatorIcon
  },
  {
    path: '/kredit',
    title: 'Kredit-Rechner',
    description: 'Kreditberechnungen',
    icon: ChartBarIcon
  },
  {
    path: '/einstellungen',
    title: 'Einstellungen',
    description: 'App-Konfiguration',
    icon: CogIcon
  },
  {
    path: '/hilfe',
    title: 'Hilfe',
    description: 'Häufige Fragen',
    icon: QuestionMarkCircleIcon
  }
])

// 页面加载时记录404错误
onMounted(() => {
  const currentUrl = window.location.href
  const referrer = document.referrer
  
  logger.warn('404 Page Not Found', 'navigation', {
    url: currentUrl,
    referrer: referrer,
    userAgent: navigator.userAgent
  })
  
  // 报告404错误
  errorReporting.reportError({
    type: ErrorType.RESOURCE,
    severity: ErrorSeverity.LOW,
    message: `Page not found: ${currentUrl}`,
    url: currentUrl,
    context: {
      action: '404_page_view',
      referrer: referrer,
      route: router.currentRoute.value.path
    }
  })
})

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
  
  logger.info('User clicked back button on 404 page', 'navigation')
}

// 报告问题
const reportIssue = () => {
  const currentUrl = window.location.href
  const userAgent = navigator.userAgent
  const timestamp = new Date().toISOString()
  
  const issueData = {
    type: 'broken_link',
    url: currentUrl,
    userAgent: userAgent,
    timestamp: timestamp,
    referrer: document.referrer
  }
  
  // 可以发送到错误报告系统或打开邮件客户端
  const mailtoLink = `mailto:support@zinses-rechner.de?subject=Broken Link Report&body=URL: ${currentUrl}%0ATime: ${timestamp}%0AUser Agent: ${userAgent}%0AReferrer: ${document.referrer}`
  
  window.location.href = mailtoLink
  
  logger.info('User reported 404 issue', 'support', issueData)
}
</script>

<style scoped>
/* 自定义动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(12deg);
  }
  50% {
    transform: translateY(-10px) rotate(12deg);
  }
}

.absolute .bg-white {
  animation: float 3s ease-in-out infinite;
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
