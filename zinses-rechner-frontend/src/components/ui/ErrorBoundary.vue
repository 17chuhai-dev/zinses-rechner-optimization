<template>
  <div class="error-boundary">
    <!-- 正常内容 -->
    <div v-if="!hasError">
      <slot />
    </div>

    <!-- 错误回退界面 -->
    <div v-else class="error-fallback">
      <div class="max-w-md mx-auto text-center p-6">
        <!-- 错误图标 -->
        <div class="mb-4">
          <ExclamationTriangleIcon class="w-16 h-16 text-red-500 mx-auto" />
        </div>

        <!-- 错误标题 -->
        <h2 class="text-xl font-bold text-gray-900 mb-2">
          {{ errorTitle }}
        </h2>

        <!-- 错误描述 -->
        <p class="text-gray-600 mb-6">
          {{ errorMessage }}
        </p>

        <!-- 错误详情（开发模式） -->
        <div v-if="showDetails && errorDetails" class="mb-6">
          <details class="text-left">
            <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
              Technische Details anzeigen
            </summary>
            <div class="bg-gray-100 rounded-lg p-4 text-xs font-mono text-gray-800 overflow-auto max-h-40">
              <pre>{{ errorDetails }}</pre>
            </div>
          </details>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            @click="retry"
            class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Erneut versuchen
          </button>

          <button
            @click="reset"
            class="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Seite neu laden
          </button>

          <button
            v-if="showReportButton"
            @click="reportError"
            class="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Fehler melden
          </button>
        </div>

        <!-- 帮助链接 -->
        <div class="mt-6 text-sm text-gray-500">
          <p>
            Probleme bestehen weiterhin?
            <a href="/faq" class="text-blue-600 hover:text-blue-800 underline">
              Siehe FAQ
            </a>
            oder
            <a href="/kontakt" class="text-blue-600 hover:text-blue-800 underline">
              kontaktieren Sie uns
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, onMounted } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// 全局变量声明
declare const gtag: (...args: any[]) => void

interface Props {
  fallbackTitle?: string
  fallbackMessage?: string
  showDetails?: boolean
  showReportButton?: boolean
  onError?: (error: Error, instance: any, info: string) => void
  onRetry?: () => void
  onReset?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  fallbackTitle: 'Etwas ist schiefgelaufen',
  fallbackMessage: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  showDetails: import.meta.env.DEV,
  showReportButton: true
})

const emit = defineEmits<{
  'error': [error: Error, info: string]
  'retry': []
  'reset': []
  'report': [error: Error, info: string]
}>()

// 状态
const hasError = ref(false)
const errorTitle = ref(props.fallbackTitle)
const errorMessage = ref(props.fallbackMessage)
const errorDetails = ref('')
const errorInfo = ref('')
const capturedError = ref<Error | null>(null)

// 错误捕获
onErrorCaptured((error: Error, instance: any, info: string) => {
  console.error('ErrorBoundary caught an error:', error)
  console.error('Error info:', info)
  console.error('Component instance:', instance)

  hasError.value = true
  capturedError.value = error
  errorInfo.value = info

  // 根据错误类型设置不同的消息
  setErrorMessage(error)

  // 设置错误详情
  if (props.showDetails) {
    errorDetails.value = `${error.name}: ${error.message}\n\nStack Trace:\n${error.stack}\n\nComponent Info:\n${info}`
  }

  // 调用外部错误处理器
  if (props.onError) {
    props.onError(error, instance, info)
  }

  // 发出错误事件
  emit('error', error, info)

  // 阻止错误继续传播
  return false
})

// 全局错误处理
onMounted(() => {
  // 捕获未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)

    hasError.value = true
    errorTitle.value = 'Netzwerk- oder Serverfehler'
    errorMessage.value = 'Ein Problem mit der Verbindung ist aufgetreten. Bitte überprüfen Sie Ihre Internetverbindung.'

    if (props.showDetails) {
      errorDetails.value = `Unhandled Promise Rejection: ${event.reason}`
    }
  })

  // 捕获JavaScript错误
  window.addEventListener('error', (event) => {
    console.error('Global JavaScript error:', event.error)

    hasError.value = true
    errorTitle.value = 'JavaScript-Fehler'
    errorMessage.value = 'Ein technischer Fehler ist aufgetreten. Bitte laden Sie die Seite neu.'

    if (props.showDetails) {
      errorDetails.value = `${event.error?.name}: ${event.error?.message}\n\nStack: ${event.error?.stack}`
    }
  })
})

// 根据错误类型设置消息
const setErrorMessage = (error: Error) => {
  if (error.name === 'ChunkLoadError') {
    errorTitle.value = 'Ladefehler'
    errorMessage.value = 'Die Anwendung konnte nicht vollständig geladen werden. Bitte laden Sie die Seite neu.'
  } else if (error.name === 'NetworkError') {
    errorTitle.value = 'Verbindungsfehler'
    errorMessage.value = 'Keine Internetverbindung verfügbar. Bitte überprüfen Sie Ihre Verbindung.'
  } else if (error.name === 'TypeError') {
    errorTitle.value = 'Anwendungsfehler'
    errorMessage.value = 'Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
  } else if (error.message.includes('Loading chunk')) {
    errorTitle.value = 'Ladefehler'
    errorMessage.value = 'Ein Teil der Anwendung konnte nicht geladen werden. Bitte laden Sie die Seite neu.'
  } else {
    errorTitle.value = props.fallbackTitle
    errorMessage.value = props.fallbackMessage
  }
}

// 方法
const retry = () => {
  hasError.value = false
  capturedError.value = null
  errorDetails.value = ''
  errorInfo.value = ''

  if (props.onRetry) {
    props.onRetry()
  }

  emit('retry')
}

const reset = () => {
  if (props.onReset) {
    props.onReset()
  } else {
    // 默认行为：重新加载页面
    window.location.reload()
  }

  emit('reset')
}

const reportError = () => {
  if (capturedError.value) {
    // 发送错误报告到分析服务
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: `${capturedError.value.name}: ${capturedError.value.message}`,
        fatal: false
      })
    }

    // 发出报告事件
    emit('report', capturedError.value, errorInfo.value)

    // 可以在这里集成错误报告服务，如Sentry
    console.log('Error reported:', {
      error: capturedError.value,
      info: errorInfo.value,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })
  }
}

// 暴露方法给父组件
defineExpose({
  retry,
  reset,
  hasError: () => hasError.value,
  getError: () => capturedError.value
})
</script>

<style scoped>
.error-boundary {
  min-height: 200px;
}

.error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

/* 动画效果 */
.error-fallback > div {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 按钮悬停效果 */
button {
  transition: all 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

button:active {
  transform: translateY(0);
}

/* 详情展开动画 */
details[open] summary ~ * {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
