<!--
  错误边界组件
  捕获子组件中的错误并提供优雅的错误处理和恢复机制
-->

<template>
  <div class="error-boundary">
    <!-- 正常渲染子组件 -->
    <div v-if="!hasError" class="error-boundary-content">
      <slot />
    </div>

    <!-- 错误状态显示 -->
    <div v-else class="error-boundary-fallback">
      <!-- 自定义错误回退组件 -->
      <slot
        v-if="$slots.fallback"
        name="fallback"
        :error="currentError"
        :retry="retry"
        :reset="reset"
        :report="reportError"
      />

      <!-- 默认错误界面 -->
      <div v-else class="default-error-ui">
        <!-- 错误图标和标题 -->
        <div class="error-header text-center mb-6">
          <div class="error-icon mb-4">
            <ExclamationTriangleIcon class="w-16 h-16 text-red-500 mx-auto" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ getErrorTitle() }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ getErrorDescription() }}
          </p>
        </div>

        <!-- 错误详情（开发模式） -->
        <div v-if="showDetails && currentError" class="error-details mb-6">
          <details class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <summary class="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
              Technische Details
            </summary>
            <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <div>
                <strong>Fehlertyp:</strong> {{ currentError.type }}
              </div>
              <div>
                <strong>Nachricht:</strong> {{ currentError.message }}
              </div>
              <div v-if="currentError.componentStack">
                <strong>Komponenten-Stack:</strong>
                <pre class="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">{{ currentError.componentStack }}</pre>
              </div>
              <div v-if="currentError.stack && isDevelopment">
                <strong>Stack Trace:</strong>
                <pre class="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">{{ currentError.stack }}</pre>
              </div>
            </div>
          </details>
        </div>

        <!-- 错误操作 -->
        <div class="error-actions flex flex-col sm:flex-row gap-3 justify-center">
          <BaseButton
            variant="primary"
            @click="retry"
            :disabled="isRetrying"
            :loading="isRetrying"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            {{ isRetrying ? 'Wird wiederholt...' : 'Erneut versuchen' }}
          </BaseButton>

          <BaseButton
            variant="outline"
            @click="reset"
          >
            <HomeIcon class="w-4 h-4 mr-2" />
            Zurücksetzen
          </BaseButton>

          <BaseButton
            v-if="canReport"
            variant="ghost"
            @click="reportError"
            :disabled="isReporting"
            :loading="isReporting"
          >
            <BugAntIcon class="w-4 h-4 mr-2" />
            {{ isReporting ? 'Wird gemeldet...' : 'Fehler melden' }}
          </BaseButton>
        </div>

        <!-- 帮助链接 -->
        <div class="error-help mt-6 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Benötigen Sie weitere Hilfe?
          </p>
          <div class="flex justify-center space-x-4 text-sm">
            <a
              href="/help"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Hilfe-Center
            </a>
            <a
              href="/contact"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Kontakt
            </a>
            <button
              @click="showDetails = !showDetails"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {{ showDetails ? 'Details ausblenden' : 'Details anzeigen' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误恢复监听器 -->
    <div v-if="hasError" class="sr-only" role="alert" aria-live="assertive">
      {{ errorAnnouncement }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onErrorCaptured, nextTick } from 'vue'
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  BugAntIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useErrorHandling } from '@/services/ErrorHandlingService'
import { ErrorType, ErrorSeverity, type ErrorInfo } from '@/services/ErrorHandlingService'
import { useScreenReader } from '@/services/ScreenReaderService'

// Props
interface Props {
  // 错误处理选项
  fallbackComponent?: string
  showDetails?: boolean
  canRetry?: boolean
  canReport?: boolean
  maxRetries?: number

  // 自定义消息
  title?: string
  description?: string

  // 恢复选项
  autoRetry?: boolean
  retryDelay?: number

  // 样式选项
  customClasses?: string | string[]

  // 上下文信息
  componentName?: string
  contextData?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  canRetry: true,
  canReport: true,
  maxRetries: 3,
  autoRetry: false,
  retryDelay: 1000,
  componentName: 'Unknown Component'
})

// Emits
interface Emits {
  error: [error: ErrorInfo]
  retry: [attempt: number]
  reset: []
  recover: []
}

const emit = defineEmits<Emits>()

// 使用错误处理服务
const { handleError, reportErrors } = useErrorHandling()

// 使用屏幕阅读器服务
const { announceError } = useScreenReader()

// 响应式状态
const hasError = ref(false)
const currentError = ref<ErrorInfo | null>(null)
const retryCount = ref(0)
const isRetrying = ref(false)
const isReporting = ref(false)
const showDetails = ref(props.showDetails)
const errorAnnouncement = ref('')

// 计算属性
const isDevelopment = computed(() => {
  return import.meta.env.DEV
})

const canRetryAgain = computed(() => {
  return props.canRetry && retryCount.value < props.maxRetries
})

// 错误捕获
onErrorCaptured((error: Error, instance, info: string) => {
  const errorInfo = handleError({
    type: ErrorType.COMPONENT_ERROR,
    severity: ErrorSeverity.HIGH,
    message: error.message,
    stack: error.stack,
    componentStack: info,
    context: {
      componentName: props.componentName,
      ...props.contextData
    },
    props: instance?.$props
  })

  currentError.value = errorInfo
  hasError.value = true

  // 公告错误
  const announcement = `Fehler in Komponente ${props.componentName}: ${error.message}`
  errorAnnouncement.value = announcement
  announceError('component', announcement)

  emit('error', errorInfo)

  // 自动重试
  if (props.autoRetry && canRetryAgain.value) {
    setTimeout(() => {
      retry()
    }, props.retryDelay)
  }

  // 阻止错误向上传播
  return false
})

// 方法
const getErrorTitle = (): string => {
  if (props.title) return props.title

  if (currentError.value) {
    switch (currentError.value.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Netzwerkfehler'
      case ErrorType.CALCULATION_ERROR:
        return 'Berechnungsfehler'
      case ErrorType.VALIDATION_ERROR:
        return 'Eingabefehler'
      case ErrorType.COMPONENT_ERROR:
        return 'Komponentenfehler'
      case ErrorType.RESOURCE_ERROR:
        return 'Ressourcenfehler'
      case ErrorType.PERMISSION_ERROR:
        return 'Berechtigungsfehler'
      case ErrorType.TIMEOUT_ERROR:
        return 'Zeitüberschreitung'
      default:
        return 'Ein Fehler ist aufgetreten'
    }
  }

  return 'Ein unerwarteter Fehler ist aufgetreten'
}

const getErrorDescription = (): string => {
  if (props.description) return props.description

  if (currentError.value) {
    switch (currentError.value.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Es gab ein Problem bei der Verbindung zum Server. Bitte überprüfen Sie Ihre Internetverbindung.'
      case ErrorType.CALCULATION_ERROR:
        return 'Bei der Berechnung ist ein Fehler aufgetreten. Bitte überprüfen Sie Ihre Eingaben.'
      case ErrorType.VALIDATION_ERROR:
        return 'Einige Eingaben sind ungültig. Bitte korrigieren Sie diese und versuchen Sie es erneut.'
      case ErrorType.COMPONENT_ERROR:
        return 'Ein Teil der Anwendung funktioniert nicht ordnungsgemäß. Wir arbeiten daran, das Problem zu beheben.'
      case ErrorType.RESOURCE_ERROR:
        return 'Eine benötigte Ressource konnte nicht geladen werden.'
      case ErrorType.PERMISSION_ERROR:
        return 'Sie haben nicht die erforderlichen Berechtigungen für diese Aktion.'
      case ErrorType.TIMEOUT_ERROR:
        return 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.'
      default:
        return 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.'
    }
  }

  return 'Bitte versuchen Sie es erneut oder laden Sie die Seite neu.'
}

const retry = async (): Promise<void> => {
  if (!canRetryAgain.value || isRetrying.value) return

  isRetrying.value = true
  retryCount.value++

  try {
    emit('retry', retryCount.value)

    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    // 重置错误状态
    hasError.value = false
    currentError.value = null

    // 等待DOM更新
    await nextTick()

    // 公告恢复
    const announcement = 'Komponente wurde wiederhergestellt'
    errorAnnouncement.value = announcement
    announceError('component', announcement)

    emit('recover')
  } catch (retryError) {
    console.error('Retry failed:', retryError)
    // 如果重试失败，保持错误状态
  } finally {
    isRetrying.value = false
  }
}

const reset = (): void => {
  hasError.value = false
  currentError.value = null
  retryCount.value = 0
  isRetrying.value = false
  isReporting.value = false

  emit('reset')

  // 公告重置
  const announcement = 'Komponente wurde zurückgesetzt'
  errorAnnouncement.value = announcement
  announceError('component', announcement)
}

const reportError = async (): Promise<void> => {
  if (!currentError.value || isReporting.value) return

  isReporting.value = true

  try {
    await reportErrors()

    // 公告报告成功
    const announcement = 'Fehler wurde erfolgreich gemeldet'
    errorAnnouncement.value = announcement
    announceError('component', announcement)
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError)

    // 公告报告失败
    const announcement = 'Fehler beim Melden des Fehlers'
    errorAnnouncement.value = announcement
    announceError('component', announcement)
  } finally {
    isReporting.value = false
  }
}

// 监听恢复事件
const handleRecoveryEvent = (event: CustomEvent) => {
  const { type, error } = event.detail

  if (error?.id === currentError.value?.id) {
    switch (type) {
      case 'retry':
        retry()
        break
      case 'fallback':
        // 处理回退逻辑
        break
      case 'reload':
        window.location.reload()
        break
    }
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('error-recovery', handleRecoveryEvent as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('error-recovery', handleRecoveryEvent as EventListener)
})

// 暴露方法给父组件
defineExpose({
  hasError: () => hasError.value,
  currentError: () => currentError.value,
  retry,
  reset,
  reportError
})
</script>

<style scoped>
.error-boundary {
  @apply w-full;
}

.error-boundary-content {
  @apply w-full;
}

.error-boundary-fallback {
  @apply w-full min-h-96 flex items-center justify-center p-6;
}

.default-error-ui {
  @apply max-w-2xl mx-auto text-center;
}

.error-icon {
  @apply animate-pulse;
}

.error-details pre {
  @apply whitespace-pre-wrap break-words;
}

.error-actions {
  @apply items-center;
}

/* 屏幕阅读器专用内容 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 高对比度模式支持 */
:global(.high-contrast) .error-boundary-fallback {
  @apply border-4 border-current;
}

:global(.high-contrast) .error-details {
  @apply border-2 border-current;
}

/* 大字体模式支持 */
:global(.large-text) .default-error-ui {
  @apply text-lg;
}

:global(.large-text) .error-header h2 {
  @apply text-3xl;
}

/* 减少动画模式支持 */
:global(.reduced-motion) .error-icon {
  @apply animate-none;
}

/* 暗色模式支持 */
:global(.theme-dark) .error-details {
  @apply bg-gray-800 border-gray-600;
}

:global(.theme-dark) .error-details pre {
  @apply bg-gray-700 text-gray-300;
}

/* 打印样式 */
@media print {
  .error-actions {
    @apply hidden;
  }

  .error-help {
    @apply hidden;
  }

  .error-details {
    @apply bg-white border-black text-black;
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .error-boundary-fallback {
    @apply p-4;
  }

  .error-actions {
    @apply flex-col w-full;
  }

  .error-actions button {
    @apply w-full;
  }

  .error-help .flex {
    @apply flex-col space-x-0 space-y-2;
  }
}

/* 动画效果 */
.error-boundary-fallback {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 无障碍增强 */
.error-actions button:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

:global(.theme-dark) .error-actions button:focus {
  @apply ring-offset-gray-900;
}

/* 错误类型特定样式 */
.error-boundary[data-error-type="network"] .error-icon {
  @apply text-orange-500;
}

.error-boundary[data-error-type="calculation"] .error-icon {
  @apply text-red-500;
}

.error-boundary[data-error-type="validation"] .error-icon {
  @apply text-yellow-500;
}

.error-boundary[data-error-type="component"] .error-icon {
  @apply text-purple-500;
}
</style>
