<!--
  用户反馈系统组件
  显示错误信息、警告和成功消息，提供用户友好的反馈界面
-->

<template>
  <div class="user-feedback-system">
    <!-- 反馈通知列表 -->
    <div class="feedback-container" :class="containerPosition">
      <TransitionGroup name="feedback" tag="div" class="feedback-list">
        <div
          v-for="feedback in activeFeedbacks"
          :key="feedback.id"
          class="feedback-item"
          :class="[
            `feedback-${feedback.type}`,
            { 'feedback-persistent': feedback.persistent }
          ]"
        >
          <!-- 图标 -->
          <div class="feedback-icon">
            <Icon :name="getFeedbackIcon(feedback.type)" size="20" />
          </div>

          <!-- 内容 -->
          <div class="feedback-content">
            <h4 v-if="feedback.title" class="feedback-title">
              {{ feedback.title }}
            </h4>
            <p class="feedback-message">
              {{ feedback.message }}
            </p>

            <!-- 错误建议 -->
            <div v-if="feedback.suggestions && feedback.suggestions.length > 0" class="feedback-suggestions">
              <p class="suggestions-title">Lösungsvorschläge:</p>
              <ul class="suggestions-list">
                <li v-for="suggestion in feedback.suggestions" :key="suggestion">
                  {{ suggestion }}
                </li>
              </ul>
            </div>

            <!-- 操作按钮 -->
            <div v-if="feedback.action !== 'none'" class="feedback-actions">
              <button
                v-if="feedback.action === 'retry-button'"
                @click="handleRetry(feedback)"
                class="action-button retry-button"
                :disabled="feedback.retrying"
              >
                <Icon :name="feedback.retrying ? 'loading' : 'refresh-cw'" size="16" :class="{ 'animate-spin': feedback.retrying }" />
                {{ feedback.retrying ? 'Wird wiederholt...' : 'Erneut versuchen' }}
              </button>

              <button
                v-if="feedback.action === 'show-help'"
                @click="handleShowHelp(feedback)"
                class="action-button help-button"
              >
                <Icon name="help-circle" size="16" />
                Hilfe anzeigen
              </button>

              <button
                v-if="feedback.action === 'contact-support'"
                @click="handleContactSupport(feedback)"
                class="action-button support-button"
              >
                <Icon name="mail" size="16" />
                Support kontaktieren
              </button>

              <button
                v-if="feedback.action === 'reload-page'"
                @click="handleReloadPage(feedback)"
                class="action-button reload-button"
              >
                <Icon name="rotate-ccw" size="16" />
                Seite neu laden
              </button>
            </div>
          </div>

          <!-- 关闭按钮 -->
          <button
            v-if="feedback.dismissible"
            @click="dismissFeedback(feedback.id)"
            class="feedback-close"
            :title="'Schließen'"
          >
            <Icon name="x" size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>

    <!-- 全局错误遮罩 -->
    <div v-if="showCriticalErrorOverlay" class="critical-error-overlay">
      <div class="critical-error-dialog">
        <div class="critical-error-icon">
          <Icon name="alert-triangle" size="48" />
        </div>
        <h2 class="critical-error-title">Kritischer Fehler</h2>
        <p class="critical-error-message">
          Ein schwerwiegender Fehler ist aufgetreten. Die Anwendung muss neu geladen werden.
        </p>
        <div class="critical-error-actions">
          <button @click="reloadApplication" class="critical-error-button">
            <Icon name="rotate-ccw" size="16" />
            Anwendung neu laden
          </button>
        </div>
      </div>
    </div>

    <!-- 帮助对话框 -->
    <div v-if="showHelpDialog" class="help-dialog-overlay" @click="closeHelpDialog">
      <div class="help-dialog" @click.stop>
        <div class="help-dialog-header">
          <h3>Hilfe</h3>
          <button @click="closeHelpDialog" class="help-dialog-close">
            <Icon name="x" size="20" />
          </button>
        </div>
        <div class="help-dialog-content">
          <div v-if="currentHelpContent" v-html="currentHelpContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { realtimeErrorHandler, type UserFeedback, FeedbackType, FeedbackAction } from '@/core/RealtimeErrorHandler'
import Icon from '@/components/ui/Icon.vue'

// 反馈项接口
interface FeedbackItem extends UserFeedback {
  id: string
  timestamp: Date
  retrying?: boolean
  suggestions?: string[]
}

// Props定义
interface Props {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxItems?: number
  showCriticalErrors?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top-right',
  maxItems: 5,
  showCriticalErrors: true
})

// Emits定义
interface Emits {
  feedbackShown: [feedback: FeedbackItem]
  feedbackDismissed: [feedbackId: string]
  actionExecuted: [action: FeedbackAction, feedback: FeedbackItem]
}

const emit = defineEmits<Emits>()

// 响应式数据
const feedbacks = ref<FeedbackItem[]>([])
const showCriticalErrorOverlay = ref(false)
const showHelpDialog = ref(false)
const currentHelpContent = ref<string>('')

// 计算属性
const activeFeedbacks = computed(() => {
  return feedbacks.value.slice(0, props.maxItems)
})

const containerPosition = computed(() => {
  return `feedback-${props.position}`
})

// 方法
const showFeedback = (feedback: UserFeedback) => {
  const feedbackItem: FeedbackItem = {
    ...feedback,
    id: generateFeedbackId(),
    timestamp: new Date(),
    suggestions: getErrorSuggestions(feedback)
  }

  // 检查是否为关键错误
  if (props.showCriticalErrors && isCriticalFeedback(feedback)) {
    showCriticalErrorOverlay.value = true
    return
  }

  // 添加到反馈列表
  feedbacks.value.unshift(feedbackItem)

  // 限制反馈数量
  if (feedbacks.value.length > props.maxItems * 2) {
    feedbacks.value = feedbacks.value.slice(0, props.maxItems * 2)
  }

  // 自动关闭
  if (feedbackItem.duration && feedbackItem.duration > 0) {
    setTimeout(() => {
      dismissFeedback(feedbackItem.id)
    }, feedbackItem.duration)
  }

  // 高亮字段
  if (feedback.action === FeedbackAction.HIGHLIGHT_FIELD && feedback.actionData?.field) {
    highlightField(feedback.actionData.field)
  }

  emit('feedbackShown', feedbackItem)
}

const dismissFeedback = (feedbackId: string) => {
  const index = feedbacks.value.findIndex(f => f.id === feedbackId)
  if (index > -1) {
    feedbacks.value.splice(index, 1)
    emit('feedbackDismissed', feedbackId)
  }
}

const handleRetry = async (feedback: FeedbackItem) => {
  if (feedback.retrying) return

  feedback.retrying = true
  emit('actionExecuted', FeedbackAction.RETRY_BUTTON, feedback)

  try {
    const retryKey = feedback.actionData?.retryKey
    if (retryKey) {
      const success = await realtimeErrorHandler.executeRetry(retryKey)
      if (success) {
        dismissFeedback(feedback.id)
        showSuccessMessage('Vorgang erfolgreich wiederholt')
      } else {
        showErrorMessage('Wiederholung fehlgeschlagen')
      }
    }
  } catch (error) {
    console.error('重试失败:', error)
    showErrorMessage('Wiederholung fehlgeschlagen')
  } finally {
    feedback.retrying = false
  }
}

const handleShowHelp = (feedback: FeedbackItem) => {
  emit('actionExecuted', FeedbackAction.SHOW_HELP, feedback)
  
  const calculatorId = feedback.actionData?.calculatorId
  currentHelpContent.value = getHelpContent(calculatorId)
  showHelpDialog.value = true
}

const handleContactSupport = (feedback: FeedbackItem) => {
  emit('actionExecuted', FeedbackAction.CONTACT_SUPPORT, feedback)
  
  // 打开支持邮件
  const subject = encodeURIComponent(`Fehler in Zinses Rechner: ${feedback.title}`)
  const body = encodeURIComponent(`
Fehlerbeschreibung: ${feedback.message}

Zeitpunkt: ${feedback.timestamp.toLocaleString('de-DE')}
Browser: ${navigator.userAgent}
URL: ${window.location.href}

Bitte beschreiben Sie, was Sie getan haben, als der Fehler auftrat:
  `)
  
  window.open(`mailto:support@zinses-rechner.de?subject=${subject}&body=${body}`)
}

const handleReloadPage = (feedback: FeedbackItem) => {
  emit('actionExecuted', FeedbackAction.RELOAD_PAGE, feedback)
  
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

const reloadApplication = () => {
  window.location.reload()
}

const closeHelpDialog = () => {
  showHelpDialog.value = false
  currentHelpContent.value = ''
}

const highlightField = (fieldName: string) => {
  const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`)
  if (field) {
    field.classList.add('field-error')
    field.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // 移除高亮
    setTimeout(() => {
      field.classList.remove('field-error')
    }, 3000)
  }
}

const getFeedbackIcon = (type: FeedbackType): string => {
  const icons = {
    [FeedbackType.SUCCESS]: 'check-circle',
    [FeedbackType.INFO]: 'info',
    [FeedbackType.WARNING]: 'alert-triangle',
    [FeedbackType.ERROR]: 'alert-circle'
  }
  return icons[type] || 'info'
}

const getErrorSuggestions = (feedback: UserFeedback): string[] => {
  // 这里可以根据错误类型返回建议
  if (feedback.type === FeedbackType.ERROR) {
    return [
      'Überprüfen Sie Ihre Eingaben',
      'Versuchen Sie es erneut',
      'Kontaktieren Sie den Support, falls das Problem weiterhin besteht'
    ]
  }
  return []
}

const isCriticalFeedback = (feedback: UserFeedback): boolean => {
  return feedback.action === FeedbackAction.RELOAD_PAGE ||
         (feedback.type === FeedbackType.ERROR && feedback.persistent)
}

const generateFeedbackId = (): string => {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const getHelpContent = (calculatorId?: string): string => {
  const helpContent: Record<string, string> = {
    'compound-interest': `
      <h4>Zinseszins-Rechner Hilfe</h4>
      <p>Dieser Rechner berechnet die Entwicklung Ihres Kapitals mit Zinseszinseffekt.</p>
      <ul>
        <li><strong>Startkapital:</strong> Der Betrag, den Sie initial investieren</li>
        <li><strong>Monatliche Rate:</strong> Der Betrag, den Sie monatlich einzahlen</li>
        <li><strong>Zinssatz:</strong> Der jährliche Zinssatz in Prozent</li>
        <li><strong>Laufzeit:</strong> Die Anzahl der Jahre</li>
      </ul>
    `,
    'savings-plan': `
      <h4>Sparplan-Rechner Hilfe</h4>
      <p>Berechnen Sie die Entwicklung Ihres Sparplans über die Zeit.</p>
      <ul>
        <li><strong>Monatliche Rate:</strong> Der Betrag, den Sie monatlich sparen</li>
        <li><strong>Zinssatz:</strong> Der jährliche Zinssatz Ihres Sparkontos</li>
        <li><strong>Laufzeit:</strong> Die Spardauer in Jahren</li>
      </ul>
    `,
    default: `
      <h4>Allgemeine Hilfe</h4>
      <p>Bei Problemen mit dem Rechner:</p>
      <ul>
        <li>Überprüfen Sie Ihre Eingaben auf Vollständigkeit</li>
        <li>Stellen Sie sicher, dass alle Zahlen im gültigen Bereich liegen</li>
        <li>Verwenden Sie das deutsche Zahlenformat (1.234,56)</li>
        <li>Kontaktieren Sie den Support bei anhaltenden Problemen</li>
      </ul>
    `
  }
  
  return helpContent[calculatorId || 'default']
}

const showSuccessMessage = (message: string) => {
  showFeedback({
    type: FeedbackType.SUCCESS,
    title: 'Erfolgreich',
    message,
    action: FeedbackAction.NONE,
    duration: 3000,
    dismissible: true,
    persistent: false
  })
}

const showErrorMessage = (message: string) => {
  showFeedback({
    type: FeedbackType.ERROR,
    title: 'Fehler',
    message,
    action: FeedbackAction.NONE,
    duration: 5000,
    dismissible: true,
    persistent: false
  })
}

// 生命周期
onMounted(() => {
  // 注册错误处理器回调
  realtimeErrorHandler.registerFeedbackCallback('user-feedback-system', showFeedback)
})

onUnmounted(() => {
  // 注销回调
  realtimeErrorHandler.unregisterFeedbackCallback('user-feedback-system')
})

// 暴露方法给父组件
defineExpose({
  showFeedback,
  dismissFeedback,
  showSuccessMessage,
  showErrorMessage
})
</script>

<style scoped>
.user-feedback-system {
  position: relative;
  z-index: 9999;
}

.feedback-container {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.feedback-top-right {
  top: 1rem;
  right: 1rem;
}

.feedback-top-left {
  top: 1rem;
  left: 1rem;
}

.feedback-bottom-right {
  bottom: 1rem;
  right: 1rem;
}

.feedback-bottom-left {
  bottom: 1rem;
  left: 1rem;
}

.feedback-top-center {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.feedback-bottom-center {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
}

.feedback-item {
  @apply flex items-start gap-3 p-4 rounded-lg shadow-lg border;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  max-width: 100%;
}

.feedback-success {
  @apply bg-green-50 border-green-200 text-green-800;
}

.feedback-info {
  @apply bg-blue-50 border-blue-200 text-blue-800;
}

.feedback-warning {
  @apply bg-yellow-50 border-yellow-200 text-yellow-800;
}

.feedback-error {
  @apply bg-red-50 border-red-200 text-red-800;
}

.feedback-persistent {
  @apply ring-2 ring-offset-2;
}

.feedback-persistent.feedback-error {
  @apply ring-red-300;
}

.feedback-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.feedback-content {
  flex: 1;
  min-width: 0;
}

.feedback-title {
  @apply font-semibold text-sm mb-1;
  margin: 0;
}

.feedback-message {
  @apply text-sm leading-relaxed;
  margin: 0;
}

.feedback-suggestions {
  @apply mt-3 pt-3 border-t border-current border-opacity-20;
}

.suggestions-title {
  @apply text-xs font-medium mb-2;
  margin: 0;
}

.suggestions-list {
  @apply text-xs space-y-1;
  margin: 0;
  padding-left: 1rem;
}

.feedback-actions {
  @apply flex flex-wrap gap-2 mt-3;
}

.action-button {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  transition: all 0.2s ease;
}

.retry-button {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.help-button {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
}

.support-button {
  @apply bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500;
}

.reload-button {
  @apply bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500;
}

.feedback-close {
  @apply p-1 text-current opacity-70 hover:opacity-100 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current;
  flex-shrink: 0;
}

/* 关键错误遮罩 */
.critical-error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  @apply bg-black bg-opacity-75 flex items-center justify-center;
  z-index: 10000;
}

.critical-error-dialog {
  @apply bg-white rounded-lg p-8 max-w-md mx-4 text-center;
}

.critical-error-icon {
  @apply text-red-500 mb-4;
}

.critical-error-title {
  @apply text-xl font-bold text-gray-900 mb-4;
  margin: 0;
}

.critical-error-message {
  @apply text-gray-600 mb-6;
  margin: 0;
}

.critical-error-actions {
  @apply flex justify-center;
}

.critical-error-button {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md;
  @apply hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500;
}

/* 帮助对话框 */
.help-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  @apply bg-black bg-opacity-50 flex items-center justify-center;
  z-index: 9999;
}

.help-dialog {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
}

.help-dialog-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.help-dialog-header h3 {
  @apply text-lg font-semibold text-gray-900;
  margin: 0;
}

.help-dialog-close {
  @apply p-1 text-gray-400 hover:text-gray-600 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.help-dialog-content {
  @apply p-6;
}

/* 动画效果 */
.feedback-enter-active,
.feedback-leave-active {
  transition: all 0.3s ease;
}

.feedback-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.feedback-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 字段错误高亮 */
:global(.field-error) {
  @apply ring-2 ring-red-500 ring-offset-2;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .feedback-container {
    left: 1rem;
    right: 1rem;
  }
  
  .feedback-list {
    max-width: none;
  }
  
  .feedback-item {
    @apply p-3;
  }
  
  .help-dialog {
    @apply mx-2;
  }
  
  .help-dialog-content {
    @apply p-4;
  }
}
</style>
