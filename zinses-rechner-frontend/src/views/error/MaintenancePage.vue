<!--
  维护模式页面
  系统维护期间显示的用户友好界面
-->

<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
    <div class="max-w-2xl mx-auto text-center">
      <!-- 维护图标 -->
      <div class="mb-8">
        <div class="relative inline-block">
          <div class="bg-white dark:bg-gray-800 rounded-full shadow-lg p-8">
            <svg class="w-24 h-24 text-yellow-600 dark:text-yellow-400 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          <!-- 进度指示器 -->
          <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div class="flex space-x-1">
              <div v-for="i in 3" :key="i" 
                   class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
                   :style="{ animationDelay: `${i * 0.2}s` }">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 维护信息 -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Wartungsarbeiten
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-4">
          Wir führen gerade wichtige Verbesserungen durch
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          Der Zinses-Rechner ist vorübergehend nicht verfügbar. Wir arbeiten daran, Ihnen ein noch besseres Erlebnis zu bieten.
        </p>
      </div>

      <!-- 维护详情 -->
      <div class="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Was wird verbessert?
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div v-for="improvement in improvements" :key="improvement.id"
               class="flex items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div class="flex-shrink-0 mr-3">
              <div class="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <component :is="improvement.icon" class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div>
              <div class="font-medium text-gray-900 dark:text-white text-sm">
                {{ improvement.title }}
              </div>
              <div class="text-gray-600 dark:text-gray-300 text-xs">
                {{ improvement.description }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预计完成时间 -->
      <div class="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div class="flex items-center justify-center mb-4">
          <ClockIcon class="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-2" />
          <h3 class="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            Voraussichtliche Fertigstellung
          </h3>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
            {{ estimatedCompletion }}
          </div>
          <div class="text-yellow-700 dark:text-yellow-300 text-sm">
            {{ timeRemaining }}
          </div>
        </div>
        
        <!-- 进度条 -->
        <div class="mt-4">
          <div class="flex justify-between text-sm text-yellow-700 dark:text-yellow-300 mb-1">
            <span>Fortschritt</span>
            <span>{{ progress }}%</span>
          </div>
          <div class="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
            <div class="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-500"
                 :style="{ width: `${progress}%` }">
            </div>
          </div>
        </div>
      </div>

      <!-- 替代方案 -->
      <div class="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          In der Zwischenzeit können Sie:
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a v-for="alternative in alternatives" :key="alternative.id"
             :href="alternative.url"
             :target="alternative.external ? '_blank' : '_self'"
             :rel="alternative.external ? 'noopener noreferrer' : ''"
             class="flex items-center p-3 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors group">
            <div class="flex-shrink-0 mr-3">
              <component :is="alternative.icon" class="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
            </div>
            <div class="text-left">
              <div class="font-medium text-blue-900 dark:text-blue-100">
                {{ alternative.title }}
              </div>
              <div class="text-sm text-blue-700 dark:text-blue-300">
                {{ alternative.description }}
              </div>
            </div>
            <ExternalLinkIcon v-if="alternative.external" class="w-4 h-4 text-blue-500 dark:text-blue-400 ml-auto" />
          </a>
        </div>
      </div>

      <!-- 通知订阅 -->
      <div class="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Benachrichtigung erhalten
        </h3>
        <p class="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          Lassen Sie sich benachrichtigen, sobald der Service wieder verfügbar ist.
        </p>
        
        <form @submit.prevent="subscribeToNotifications" class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="notificationEmail"
            type="email"
            placeholder="Ihre E-Mail-Adresse"
            required
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            :disabled="isSubscribing"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <span v-if="!isSubscribing">Benachrichtigen</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Wird gesendet...
            </span>
          </button>
        </form>
        
        <div v-if="subscriptionMessage" class="mt-3 text-sm" :class="subscriptionSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
          {{ subscriptionMessage }}
        </div>
      </div>

      <!-- 社交媒体和状态 -->
      <div class="text-center">
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Bleiben Sie auf dem Laufenden:
        </p>
        <div class="flex justify-center space-x-6">
          <a
            href="https://twitter.com/zinses_rechner"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Twitter Updates
          </a>
          <a
            href="/status"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Systemstatus
          </a>
          <a
            href="mailto:support@zinses-rechner.de"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Support kontaktieren
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ClockIcon,
  ExternalLinkIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'
import { logger } from '@/services/LoggingService'

// 维护信息
const startTime = ref(new Date())
const estimatedDuration = ref(2 * 60 * 60 * 1000) // 2小时（毫秒）
const progress = ref(25) // 进度百分比
const notificationEmail = ref('')
const isSubscribing = ref(false)
const subscriptionMessage = ref('')
const subscriptionSuccess = ref(false)

// 改进项目
const improvements = ref([
  {
    id: 1,
    title: 'Performance-Optimierung',
    description: 'Schnellere Berechnungen',
    icon: RocketLaunchIcon
  },
  {
    id: 2,
    title: 'Sicherheits-Updates',
    description: 'Verbesserte Datensicherheit',
    icon: ShieldCheckIcon
  },
  {
    id: 3,
    title: 'Neue Funktionen',
    description: 'Erweiterte Berechnungsoptionen',
    icon: ChartBarIcon
  },
  {
    id: 4,
    title: 'System-Wartung',
    description: 'Infrastruktur-Verbesserungen',
    icon: CogIcon
  }
])

// 替代方案
const alternatives = ref([
  {
    id: 1,
    title: 'Offline-Rechner',
    description: 'PDF-Version herunterladen',
    url: '/downloads/offline-calculator.pdf',
    icon: DocumentTextIcon,
    external: false
  },
  {
    id: 2,
    title: 'Mobile App',
    description: 'iOS/Android App nutzen',
    url: 'https://apps.apple.com/de/app/zinses-rechner',
    icon: RocketLaunchIcon,
    external: true
  },
  {
    id: 3,
    title: 'Support Chat',
    description: 'Direkte Hilfe erhalten',
    url: 'https://chat.zinses-rechner.de',
    icon: ChatBubbleLeftRightIcon,
    external: true
  },
  {
    id: 4,
    title: 'FAQ',
    description: 'Häufige Fragen ansehen',
    url: '/faq',
    icon: DocumentTextIcon,
    external: false
  }
])

// 计算属性
const estimatedCompletion = computed(() => {
  const completionTime = new Date(startTime.value.getTime() + estimatedDuration.value)
  return completionTime.toLocaleString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const timeRemaining = computed(() => {
  const now = new Date()
  const elapsed = now.getTime() - startTime.value.getTime()
  const remaining = Math.max(0, estimatedDuration.value - elapsed)
  
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `Noch etwa ${hours} Stunden und ${minutes} Minuten`
  } else if (minutes > 0) {
    return `Noch etwa ${minutes} Minuten`
  } else {
    return 'Fast fertig!'
  }
})

let progressInterval: number | null = null

// 页面加载时的操作
onMounted(() => {
  logger.info('Maintenance page displayed', 'maintenance', {
    startTime: startTime.value.toISOString(),
    estimatedDuration: estimatedDuration.value,
    userAgent: navigator.userAgent
  })
  
  // 模拟进度更新
  progressInterval = window.setInterval(() => {
    if (progress.value < 95) {
      progress.value += Math.random() * 2
    }
  }, 30000) // 每30秒更新一次
})

// 清理定时器
onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})

// 订阅通知
const subscribeToNotifications = async () => {
  if (!notificationEmail.value) return
  
  isSubscribing.value = true
  subscriptionMessage.value = ''
  
  try {
    // 这里应该调用实际的API
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    
    subscriptionSuccess.value = true
    subscriptionMessage.value = 'Vielen Dank! Sie erhalten eine Benachrichtigung, sobald der Service wieder verfügbar ist.'
    notificationEmail.value = ''
    
    logger.info('User subscribed to maintenance notifications', 'maintenance', {
      email: notificationEmail.value
    })
  } catch (error) {
    subscriptionSuccess.value = false
    subscriptionMessage.value = 'Fehler beim Senden der Benachrichtigung. Bitte versuchen Sie es später erneut.'
    
    logger.error('Failed to subscribe to maintenance notifications', 'maintenance', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    isSubscribing.value = false
  }
}
</script>

<style scoped>
/* 自定义动画 */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* 暗色模式过渡 */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
</style>
