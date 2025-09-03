<!--
  错误边界组件
  捕获和处理Vue组件中的错误
-->

<template>
  <div v-if="hasError" class="error-boundary">
    <!-- 简洁错误显示 -->
    <div v-if="!showDetails" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            {{ errorTitle }}
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>{{ errorMessage }}</p>
          </div>
          <div class="mt-4 flex space-x-3">
            <button
              @click="retry"
              class="bg-red-100 dark:bg-red-800 px-3 py-1.5 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Erneut versuchen
            </button>
            <button
              @click="showDetails = true"
              class="bg-red-100 dark:bg-red-800 px-3 py-1.5 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Details anzeigen
            </button>
            <button
              @click="reportError"
              class="bg-red-100 dark:bg-red-800 px-3 py-1.5 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Fehler melden
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细错误显示 -->
    <div v-else class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-start">
          <ExclamationTriangleIcon class="h-6 w-6 text-red-400 mr-3 mt-0.5" />
          <div>
            <h3 class="text-lg font-medium text-red-800 dark:text-red-200">
              {{ errorTitle }}
            </h3>
            <p class="text-red-700 dark:text-red-300 mt-1">
              {{ errorMessage }}
            </p>
          </div>
        </div>
        <button
          @click="showDetails = false"
          class="text-red-400 hover:text-red-600 dark:hover:text-red-200"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- 错误详情 -->
      <div class="space-y-4">
        <!-- 错误信息 -->
        <div>
          <h4 class="font-medium text-red-800 dark:text-red-200 mb-2">Fehlermeldung:</h4>
          <div class="bg-red-100 dark:bg-red-800/50 rounded p-3 font-mono text-sm text-red-900 dark:text-red-100">
            {{ error?.message || 'Unbekannter Fehler' }}
          </div>
        </div>

        <!-- 堆栈跟踪 -->
        <div v-if="error?.stack">
          <h4 class="font-medium text-red-800 dark:text-red-200 mb-2">Stack Trace:</h4>
          <details class="bg-red-100 dark:bg-red-800/50 rounded">
            <summary class="p-3 cursor-pointer text-sm font-medium text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-700">
              Stack Trace anzeigen
            </summary>
            <pre class="p-3 pt-0 text-xs text-red-800 dark:text-red-200 overflow-x-auto whitespace-pre-wrap">{{ error.stack }}</pre>
          </details>
        </div>

        <!-- 组件信息 -->
        <div v-if="componentInfo">
          <h4 class="font-medium text-red-800 dark:text-red-200 mb-2">Komponenten-Info:</h4>
          <div class="bg-red-100 dark:bg-red-800/50 rounded p-3 text-sm text-red-900 dark:text-red-100">
            {{ componentInfo }}
          </div>
        </div>

        <!-- 错误ID和时间 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-red-800 dark:text-red-200">Fehler-ID:</span>
            <span class="ml-2 font-mono text-red-700 dark:text-red-300">{{ errorId }}</span>
          </div>
          <div>
            <span class="font-medium text-red-800 dark:text-red-200">Zeitpunkt:</span>
            <span class="ml-2 text-red-700 dark:text-red-300">{{ errorTime }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-3 pt-4 border-t border-red-200 dark:border-red-700">
          <button
            @click="retry"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Erneut versuchen
          </button>
          <button
            @click="goHome"
            class="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Zur Startseite
          </button>
          <button
            @click="reportError"
            class="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Fehler melden
          </button>
          <button
            @click="copyErrorInfo"
            class="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {{ copyButtonText }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 正常内容 -->
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { logger } from '@/services/LoggingService'
import { errorReporting, ErrorType, ErrorSeverity } from '@/services/ErrorReportingService'

interface Props {
  fallbackTitle?: string
  fallbackMessage?: string
  showRetry?: boolean
  showReport?: boolean
  level?: 'component' | 'page' | 'app'
}

const props = withDefaults(defineProps<Props>(), {
  fallbackTitle: 'Ein Fehler ist aufgetreten',
  fallbackMessage: 'Beim Laden dieser Komponente ist ein unerwarteter Fehler aufgetreten.',
  showRetry: true,
  showReport: true,
  level: 'component'
})

const emit = defineEmits<{
  error: [error: Error, info: string]
  retry: []
}>()

const router = useRouter()

// 状态
const hasError = ref(false)
const error = ref<Error | null>(null)
const componentInfo = ref<string>('')
const showDetails = ref(false)
const errorId = ref('')
const errorTime = ref('')
const copyButtonText = ref('Kopieren')

// 计算属性
const errorTitle = computed(() => {
  if (error.value?.name === 'ChunkLoadError') {
    return 'Ladefehler'
  }
  if (error.value?.name === 'NetworkError') {
    return 'Netzwerkfehler'
  }
  return props.fallbackTitle
})

const errorMessage = computed(() => {
  if (error.value?.name === 'ChunkLoadError') {
    return 'Ein Teil der Anwendung konnte nicht geladen werden. Bitte laden Sie die Seite neu.'
  }
  if (error.value?.name === 'NetworkError') {
    return 'Es besteht ein Problem mit der Netzwerkverbindung. Bitte überprüfen Sie Ihre Internetverbindung.'
  }
  return props.fallbackMessage
})

// 错误捕获
onErrorCaptured((err: Error, instance, info: string) => {
  hasError.value = true
  error.value = err
  componentInfo.value = info
  errorId.value = generateErrorId()
  errorTime.value = new Date().toLocaleString('de-DE')

  // 记录错误
  logger.error(`Component Error: ${err.message}`, 'error-boundary', {
    errorId: errorId.value,
    componentInfo: info,
    stack: err.stack,
    level: props.level
  })

  // 报告错误
  errorReporting.reportError({
    type: ErrorType.VUE,
    severity: getSeverityByLevel(props.level),
    message: err.message,
    stack: err.stack,
    context: {
      component: 'ErrorBoundary',
      action: 'error_captured',
      info,
      level: props.level
    }
  })

  // 发出错误事件
  emit('error', err, info)

  // 阻止错误继续传播
  return false
})

// 生成错误ID
function generateErrorId(): string {
  return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
}

// 根据级别获取严重程度
function getSeverityByLevel(level: string): ErrorSeverity {
  switch (level) {
    case 'app': return ErrorSeverity.CRITICAL
    case 'page': return ErrorSeverity.HIGH
    case 'component': return ErrorSeverity.MEDIUM
    default: return ErrorSeverity.MEDIUM
  }
}

// 重试
const retry = () => {
  hasError.value = false
  error.value = null
  componentInfo.value = ''
  showDetails.value = false
  
  logger.info('User clicked retry in error boundary', 'error-boundary', {
    errorId: errorId.value
  })
  
  emit('retry')
}

// 回到首页
const goHome = () => {
  router.push('/')
  
  logger.info('User navigated to home from error boundary', 'error-boundary', {
    errorId: errorId.value
  })
}

// 报告错误
const reportError = () => {
  const errorReport = {
    errorId: errorId.value,
    message: error.value?.message || 'Unknown error',
    stack: error.value?.stack || '',
    componentInfo: componentInfo.value,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: errorTime.value
  }

  const mailtoLink = `mailto:support@zinses-rechner.de?subject=Error Report ${errorId.value}&body=${encodeURIComponent(JSON.stringify(errorReport, null, 2))}`
  
  window.location.href = mailtoLink
  
  logger.info('User reported error from error boundary', 'error-boundary', {
    errorId: errorId.value
  })
}

// 复制错误信息
const copyErrorInfo = async () => {
  const errorInfo = {
    errorId: errorId.value,
    timestamp: errorTime.value,
    message: error.value?.message || 'Unknown error',
    stack: error.value?.stack || '',
    componentInfo: componentInfo.value,
    url: window.location.href
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2))
    copyButtonText.value = 'Kopiert!'
    
    setTimeout(() => {
      copyButtonText.value = 'Kopieren'
    }, 2000)
    
    logger.info('User copied error info', 'error-boundary', {
      errorId: errorId.value
    })
  } catch (err) {
    logger.warn('Failed to copy error info', 'error-boundary', {
      error: err instanceof Error ? err.message : 'Unknown error'
    })
  }
}

// 组件挂载时的处理
onMounted(() => {
  // 监听全局未捕获的错误
  window.addEventListener('error', (event) => {
    if (!hasError.value) {
      hasError.value = true
      error.value = event.error || new Error(event.message)
      errorId.value = generateErrorId()
      errorTime.value = new Date().toLocaleString('de-DE')
    }
  })

  // 监听未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    if (!hasError.value) {
      hasError.value = true
      error.value = new Error(`Unhandled Promise Rejection: ${event.reason}`)
      errorId.value = generateErrorId()
      errorTime.value = new Date().toLocaleString('de-DE')
    }
  })
})
</script>

<style scoped>
.error-boundary {
  /* 确保错误边界不会影响布局 */
  width: 100%;
}

/* 暗色模式过渡 */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* 滚动条样式 */
pre::-webkit-scrollbar {
  height: 6px;
}

pre::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

pre::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

pre::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
</style>
