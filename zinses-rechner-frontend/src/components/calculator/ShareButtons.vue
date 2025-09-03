<template>
  <div class="share-buttons">
    <!-- 分享标题 -->
    <div class="share-header">
      <h4 class="text-lg font-semibold text-gray-900 mb-3">
        📤 Ergebnisse teilen
      </h4>
      <p class="text-sm text-gray-600 mb-4">
        Teilen Sie Ihre Berechnung mit Freunden oder speichern Sie sie für später.
      </p>
    </div>

    <!-- 分享状态显示 -->
    <div v-if="shareStatus.message" class="share-status mb-4">
      <div 
        :class="[
          'flex items-center p-3 rounded-lg',
          {
            'bg-green-50 border border-green-200': shareStatus.type === 'success',
            'bg-red-50 border border-red-200': shareStatus.type === 'error',
            'bg-blue-50 border border-blue-200': shareStatus.type === 'info'
          }
        ]"
      >
        <component 
          :is="shareStatus.type === 'success' ? CheckCircleIcon : shareStatus.type === 'error' ? ExclamationTriangleIcon : InformationCircleIcon"
          :class="[
            'w-5 h-5 mr-2',
            {
              'text-green-500': shareStatus.type === 'success',
              'text-red-500': shareStatus.type === 'error',
              'text-blue-500': shareStatus.type === 'info'
            }
          ]"
        />
        <span 
          :class="[
            'text-sm',
            {
              'text-green-700': shareStatus.type === 'success',
              'text-red-700': shareStatus.type === 'error',
              'text-blue-700': shareStatus.type === 'info'
            }
          ]"
        >
          {{ shareStatus.message }}
        </span>
        <button 
          @click="clearStatus"
          :class="[
            'ml-auto',
            {
              'text-green-500 hover:text-green-700': shareStatus.type === 'success',
              'text-red-500 hover:text-red-700': shareStatus.type === 'error',
              'text-blue-500 hover:text-blue-700': shareStatus.type === 'info'
            }
          ]"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 社交媒体分享按钮 -->
    <div class="social-share-buttons">
      <h5 class="text-sm font-medium text-gray-700 mb-3">Auf sozialen Medien teilen</h5>
      
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <!-- LinkedIn -->
        <button
          @click="shareOnLinkedIn"
          :disabled="isSharing"
          class="share-btn linkedin-btn"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span>LinkedIn</span>
        </button>

        <!-- Twitter -->
        <button
          @click="shareOnTwitter"
          :disabled="isSharing"
          class="share-btn twitter-btn"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          <span>Twitter</span>
        </button>

        <!-- WhatsApp -->
        <button
          @click="shareOnWhatsApp"
          :disabled="isSharing"
          class="share-btn whatsapp-btn"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
          <span>WhatsApp</span>
        </button>

        <!-- Facebook -->
        <button
          @click="shareOnFacebook"
          :disabled="isSharing"
          class="share-btn facebook-btn"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </button>
      </div>
    </div>

    <!-- 其他分享选项 -->
    <div class="other-share-options">
      <h5 class="text-sm font-medium text-gray-700 mb-3">Weitere Optionen</h5>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <!-- 复制链接 -->
        <button
          @click="copyToClipboard"
          :disabled="isSharing"
          class="share-btn copy-btn"
        >
          <ClipboardDocumentIcon class="w-5 h-5" />
          <span>Link kopieren</span>
        </button>

        <!-- 生成图片 -->
        <button
          @click="generateImage"
          :disabled="isSharing"
          class="share-btn image-btn"
        >
          <PhotoIcon class="w-5 h-5" />
          <span>Als Bild</span>
        </button>

        <!-- 打印 -->
        <button
          @click="printResults"
          :disabled="isSharing"
          class="share-btn print-btn"
        >
          <PrinterIcon class="w-5 h-5" />
          <span>Drucken</span>
        </button>
      </div>
    </div>

    <!-- 原生分享（移动端） -->
    <div v-if="capabilities.nativeShare" class="native-share">
      <button
        @click="nativeShare"
        :disabled="isSharing"
        class="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        <ShareIcon class="w-5 h-5 mr-2" />
        Teilen...
      </button>
    </div>

    <!-- 分享预览 -->
    <div v-if="showPreview" class="share-preview mt-4 p-4 bg-gray-50 rounded-lg">
      <h6 class="text-sm font-medium text-gray-700 mb-2">Vorschau:</h6>
      <div class="text-sm text-gray-600">
        <div class="font-medium">{{ shareData.title }}</div>
        <div class="mt-1 whitespace-pre-line">{{ shareData.text }}</div>
        <div class="mt-2 text-blue-600">{{ shareData.url }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  PhotoIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/vue/24/outline'
import { ShareService } from '@/services/shareService'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'

interface Props {
  result: CalculationResult
  form: CalculatorForm
  chartElement?: HTMLElement
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'share-completed': [platform: string]
  'share-failed': [platform: string, error: string]
}>()

// 分享服务
const shareService = ShareService.getInstance()

// 状态管理
const isSharing = ref(false)
const showPreview = ref(false)
const shareStatus = ref<{
  type: 'success' | 'error' | 'info' | null
  message: string
}>({ type: null, message: '' })

// 分享数据
const shareData = computed(() => 
  shareService.generateShareContent(props.result, props.form)
)

// 功能支持检测
const capabilities = ref(shareService.getShareCapabilities())

// 分享方法
const shareOnLinkedIn = async () => {
  try {
    setSharing(true)
    shareService.shareOnLinkedIn(shareData.value)
    shareService.trackShare('linkedin', shareData.value)
    setStatus('success', 'Auf LinkedIn geteilt!')
    emit('share-completed', 'linkedin')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LinkedIn分享失败'
    setStatus('error', message)
    emit('share-failed', 'linkedin', message)
  } finally {
    setSharing(false)
  }
}

const shareOnTwitter = async () => {
  try {
    setSharing(true)
    shareService.shareOnTwitter(shareData.value)
    shareService.trackShare('twitter', shareData.value)
    setStatus('success', 'Auf Twitter geteilt!')
    emit('share-completed', 'twitter')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Twitter分享失败'
    setStatus('error', message)
    emit('share-failed', 'twitter', message)
  } finally {
    setSharing(false)
  }
}

const shareOnWhatsApp = async () => {
  try {
    setSharing(true)
    shareService.shareOnWhatsApp(shareData.value)
    shareService.trackShare('whatsapp', shareData.value)
    setStatus('success', 'Auf WhatsApp geteilt!')
    emit('share-completed', 'whatsapp')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WhatsApp分享失败'
    setStatus('error', message)
    emit('share-failed', 'whatsapp', message)
  } finally {
    setSharing(false)
  }
}

const shareOnFacebook = async () => {
  try {
    setSharing(true)
    shareService.shareOnFacebook(shareData.value)
    shareService.trackShare('facebook', shareData.value)
    setStatus('success', 'Auf Facebook geteilt!')
    emit('share-completed', 'facebook')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Facebook分享失败'
    setStatus('error', message)
    emit('share-failed', 'facebook', message)
  } finally {
    setSharing(false)
  }
}

const copyToClipboard = async () => {
  try {
    setSharing(true)
    const success = await shareService.copyToClipboard(shareData.value)
    if (success) {
      setStatus('success', 'Link in die Zwischenablage kopiert!')
      emit('share-completed', 'clipboard')
    } else {
      throw new Error('Kopieren fehlgeschlagen')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '复制失败'
    setStatus('error', message)
    emit('share-failed', 'clipboard', message)
  } finally {
    setSharing(false)
  }
}

const generateImage = async () => {
  if (!props.chartElement) {
    setStatus('error', 'Kein Diagramm zum Exportieren gefunden')
    return
  }

  try {
    setSharing(true)
    setStatus('info', 'Bild wird generiert...')
    
    const imageUrl = await shareService.generateShareImage(props.chartElement)
    shareService.downloadShareImage(imageUrl, `zinseszins-berechnung-${Date.now()}.png`)
    
    setStatus('success', 'Bild erfolgreich heruntergeladen!')
    emit('share-completed', 'image')
  } catch (error) {
    const message = error instanceof Error ? error.message : '图片生成失败'
    setStatus('error', message)
    emit('share-failed', 'image', message)
  } finally {
    setSharing(false)
  }
}

const printResults = () => {
  try {
    shareService.printResults()
    shareService.trackShare('print', shareData.value)
    setStatus('success', 'Druckvorschau geöffnet!')
    emit('share-completed', 'print')
  } catch (error) {
    const message = error instanceof Error ? error.message : '打印失败'
    setStatus('error', message)
    emit('share-failed', 'print', message)
  }
}

const nativeShare = async () => {
  try {
    setSharing(true)
    const success = await shareService.nativeShare(shareData.value)
    if (success) {
      setStatus('success', 'Erfolgreich geteilt!')
      emit('share-completed', 'native')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '原生分享失败'
    setStatus('error', message)
    emit('share-failed', 'native', message)
  } finally {
    setSharing(false)
  }
}

// 工具方法
const setSharing = (sharing: boolean) => {
  isSharing.value = sharing
}

const setStatus = (type: 'success' | 'error' | 'info', message: string) => {
  shareStatus.value = { type, message }
  
  // 自动清除成功消息
  if (type === 'success') {
    setTimeout(() => {
      if (shareStatus.value.type === 'success') {
        clearStatus()
      }
    }, 3000)
  }
}

const clearStatus = () => {
  shareStatus.value = { type: null, message: '' }
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

onMounted(() => {
  // 更新功能支持检测
  capabilities.value = shareService.getShareCapabilities()
})
</script>

<style scoped>
.share-btn {
  @apply flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200;
  gap: 8px;
}

.share-btn:hover:not(:disabled) {
  @apply transform -translate-y-1 shadow-md;
}

.linkedin-btn:hover:not(:disabled) {
  @apply border-blue-600 text-blue-600 bg-blue-50;
}

.twitter-btn:hover:not(:disabled) {
  @apply border-sky-500 text-sky-500 bg-sky-50;
}

.whatsapp-btn:hover:not(:disabled) {
  @apply border-green-600 text-green-600 bg-green-50;
}

.facebook-btn:hover:not(:disabled) {
  @apply border-blue-700 text-blue-700 bg-blue-50;
}

.copy-btn:hover:not(:disabled) {
  @apply border-gray-600 text-gray-600 bg-gray-50;
}

.image-btn:hover:not(:disabled) {
  @apply border-purple-600 text-purple-600 bg-purple-50;
}

.print-btn:hover:not(:disabled) {
  @apply border-indigo-600 text-indigo-600 bg-indigo-50;
}
</style>
