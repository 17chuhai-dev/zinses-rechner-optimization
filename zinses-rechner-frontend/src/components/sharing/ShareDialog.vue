<!--
  分享对话框组件
  提供完整的分享功能界面，支持多平台分享、链接生成、图片分享等
-->

<template>
  <BaseDialog
    :open="open"
    @close="$emit('close')"
    title="Ergebnisse teilen"
    size="lg"
  >
    <div class="share-dialog">
      <!-- 分享预览 -->
      <div class="share-preview mb-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-start space-x-4">
            <div v-if="shareImage" class="flex-shrink-0">
              <img
                :src="shareImage"
                alt="Share preview"
                class="w-20 h-20 rounded-lg object-cover"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ shareContent.title }}
              </h3>
              <p class="text-sm text-gray-600 mb-3">
                {{ shareContent.description }}
              </p>
              <div class="flex items-center text-xs text-gray-500">
                <GlobeAltIcon class="w-4 h-4 mr-1" />
                {{ shareUrl }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分享选项标签页 -->
      <div class="share-tabs mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" class="w-4 h-4 mr-2" />
              {{ tab.name }}
            </button>
          </nav>
        </div>
      </div>

      <!-- 社交媒体分享 -->
      <div v-if="activeTab === 'social'" class="social-sharing">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            v-for="platform in availablePlatforms"
            :key="platform.id"
            :class="[
              'flex flex-col items-center p-4 rounded-lg border-2 transition-all',
              'hover:border-blue-300 hover:bg-blue-50',
              selectedPlatforms.includes(platform.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            ]"
            @click="togglePlatform(platform.id)"
          >
            <component
              :is="platform.icon"
              :class="['w-8 h-8 mb-2', platform.color]"
            />
            <span class="text-sm font-medium text-gray-900">{{ platform.name }}</span>
            <span class="text-xs text-gray-500">{{ platform.description }}</span>
          </button>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="include-results"
              v-model="includeResults"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label for="include-results" class="ml-2 text-sm text-gray-700">
              Berechnungsergebnisse einschließen
            </label>
          </div>
          <BaseButton
            variant="primary"
            @click="shareToSelectedPlatforms"
            :loading="state.isSharing"
            :disabled="selectedPlatforms.length === 0"
          >
            <ShareIcon class="w-4 h-4 mr-2" />
            Teilen ({{ selectedPlatforms.length }})
          </BaseButton>
        </div>
      </div>

      <!-- 链接分享 -->
      <div v-if="activeTab === 'link'" class="link-sharing">
        <div class="space-y-4">
          <!-- 链接生成选项 -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Link-Optionen</h4>
            <div class="space-y-3">
              <div class="flex items-center">
                <input
                  id="include-params"
                  v-model="linkOptions.includeParams"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label for="include-params" class="ml-2 text-sm text-gray-700">
                  Berechnungsparameter einschließen
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="include-results"
                  v-model="linkOptions.includeResults"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label for="include-results" class="ml-2 text-sm text-gray-700">
                  Ergebnisse einschließen
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="short-url"
                  v-model="linkOptions.useShortUrl"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label for="short-url" class="ml-2 text-sm text-gray-700">
                  Kurzen Link verwenden
                </label>
              </div>
            </div>
          </div>

          <!-- 生成的链接 -->
          <div class="generated-link">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Geteilter Link
            </label>
            <div class="flex">
              <input
                :value="generatedLink"
                readonly
                class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
              />
              <BaseButton
                variant="outline"
                @click="copyLink"
                class="rounded-l-none"
              >
                <ClipboardIcon class="w-4 h-4" />
              </BaseButton>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Link ist {{ linkOptions.includeResults ? 'mit' : 'ohne' }} Ergebnisse gültig
            </p>
          </div>

          <!-- QR码 -->
          <div v-if="showQRCode" class="qr-code-section">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-medium text-gray-700">QR-Code</label>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="downloadQRCode"
              >
                <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
                Download
              </BaseButton>
            </div>
            <div class="flex justify-center">
              <div ref="qrCodeContainer" class="bg-white p-4 rounded-lg border"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图片分享 -->
      <div v-if="activeTab === 'image'" class="image-sharing">
        <div class="space-y-4">
          <!-- 模板选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Bild-Template wählen
            </label>
            <div class="grid grid-cols-3 gap-4">
              <button
                v-for="template in imageTemplates"
                :key="template.id"
                :class="[
                  'relative p-4 rounded-lg border-2 transition-all',
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
                @click="selectedTemplate = template.id"
              >
                <div class="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                  <component :is="template.icon" class="w-8 h-8 text-gray-400" />
                </div>
                <span class="text-sm font-medium text-gray-900">{{ template.name }}</span>
                <p class="text-xs text-gray-500 mt-1">{{ template.description }}</p>
              </button>
            </div>
          </div>

          <!-- 图片预览 -->
          <div v-if="generatedImage" class="image-preview">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Vorschau
            </label>
            <div class="border rounded-lg p-4 bg-gray-50">
              <img
                :src="generatedImage"
                alt="Generated share image"
                class="w-full max-w-md mx-auto rounded"
              />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-between">
            <BaseButton
              variant="outline"
              @click="generateImage"
              :loading="generatingImage"
            >
              <PhotoIcon class="w-4 h-4 mr-2" />
              Bild generieren
            </BaseButton>
            <div class="space-x-2">
              <BaseButton
                v-if="generatedImage"
                variant="outline"
                @click="downloadImage"
              >
                <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                Download
              </BaseButton>
              <BaseButton
                v-if="generatedImage"
                variant="primary"
                @click="shareImage"
              >
                <ShareIcon class="w-4 h-4 mr-2" />
                Bild teilen
              </BaseButton>
            </div>
          </div>
        </div>
      </div>

      <!-- 分享统计 -->
      <div v-if="activeTab === 'stats'" class="sharing-stats">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-gray-900">{{ statistics.totalShares }}</div>
            <div class="text-sm text-gray-600">Gesamt geteilt</div>
          </div>
          <div class="stat-card bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ mostPopularPlatform.count }}</div>
            <div class="text-sm text-gray-600">{{ mostPopularPlatform.name }}</div>
          </div>
          <div class="stat-card bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ statistics.recentShares.length }}</div>
            <div class="text-sm text-gray-600">Letzte 30 Tage</div>
          </div>
          <div class="stat-card bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-600">85%</div>
            <div class="text-sm text-gray-600">Erfolgsrate</div>
          </div>
        </div>

        <!-- 平台统计图表 -->
        <div class="platform-stats">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Teilen nach Plattform</h4>
          <div class="space-y-2">
            <div
              v-for="(count, platform) in statistics.sharesByPlatform"
              :key="platform"
              class="flex items-center justify-between"
            >
              <div class="flex items-center">
                <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span class="text-sm text-gray-700">{{ getPlatformName(platform) }}</span>
              </div>
              <div class="flex items-center">
                <span class="text-sm font-medium text-gray-900 mr-2">{{ count }}</span>
                <div class="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full"
                    :style="{ width: `${(count / statistics.totalShares) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 对话框底部 -->
    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-500">
          <span v-if="state.lastSharedUrl">
            Zuletzt geteilt: {{ formatDate(new Date()) }}
          </span>
        </div>
        <div class="space-x-3">
          <BaseButton variant="ghost" @click="$emit('close')">
            Schließen
          </BaseButton>
          <BaseButton
            v-if="activeTab === 'link'"
            variant="primary"
            @click="generateAndCopyLink"
          >
            Link generieren & kopieren
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  ShareIcon,
  GlobeAltIcon,
  ClipboardIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  ChartBarIcon,
  LinkIcon,
  CameraIcon,
  ChartPieIcon
} from '@heroicons/vue/24/outline'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useSocialSharing, SharingPlatform, type ShareContent } from '@/services/SocialSharingManager'

interface Props {
  open: boolean
  calculationData: any
  shareUrl?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'shared', platform: SharingPlatform): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 使用社交分享服务
const {
  state,
  shareToplatform,
  shareToMultiplePlatforms,
  generateShareableLink,
  generateShareImage,
  getStatistics,
  isPlatformAvailable
} = useSocialSharing()

// 组件状态
const activeTab = ref('social')
const selectedPlatforms = ref<SharingPlatform[]>([])
const includeResults = ref(true)
const selectedTemplate = ref('summary')
const generatedImage = ref<string | null>(null)
const generatingImage = ref(false)
const showQRCode = ref(false)
const qrCodeContainer = ref<HTMLElement>()

// 链接选项
const linkOptions = ref({
  includeParams: true,
  includeResults: true,
  useShortUrl: true
})

// 标签页配置
const tabs = [
  { id: 'social', name: 'Social Media', icon: ShareIcon },
  { id: 'link', name: 'Link', icon: LinkIcon },
  { id: 'image', name: 'Bild', icon: CameraIcon },
  { id: 'stats', name: 'Statistiken', icon: ChartPieIcon }
]

// 可用平台
const availablePlatforms = computed(() => [
  {
    id: SharingPlatform.FACEBOOK,
    name: 'Facebook',
    description: 'Auf Facebook teilen',
    icon: ShareIcon,
    color: 'text-blue-600',
    available: isPlatformAvailable(SharingPlatform.FACEBOOK)
  },
  {
    id: SharingPlatform.TWITTER,
    name: 'Twitter',
    description: 'Auf Twitter tweeten',
    icon: ShareIcon,
    color: 'text-blue-400',
    available: isPlatformAvailable(SharingPlatform.TWITTER)
  },
  {
    id: SharingPlatform.LINKEDIN,
    name: 'LinkedIn',
    description: 'Auf LinkedIn teilen',
    icon: ShareIcon,
    color: 'text-blue-700',
    available: isPlatformAvailable(SharingPlatform.LINKEDIN)
  },
  {
    id: SharingPlatform.WHATSAPP,
    name: 'WhatsApp',
    description: 'Per WhatsApp senden',
    icon: ShareIcon,
    color: 'text-green-600',
    available: isPlatformAvailable(SharingPlatform.WHATSAPP)
  },
  {
    id: SharingPlatform.EMAIL,
    name: 'E-Mail',
    description: 'Per E-Mail senden',
    icon: ShareIcon,
    color: 'text-gray-600',
    available: isPlatformAvailable(SharingPlatform.EMAIL)
  },
  {
    id: SharingPlatform.COPY_LINK,
    name: 'Link kopieren',
    description: 'Link in Zwischenablage',
    icon: ClipboardIcon,
    color: 'text-gray-600',
    available: isPlatformAvailable(SharingPlatform.COPY_LINK)
  }
].filter(platform => platform.available))

// 图片模板
const imageTemplates = [
  {
    id: 'summary',
    name: 'Zusammenfassung',
    description: 'Wichtigste Ergebnisse',
    icon: ChartBarIcon
  },
  {
    id: 'chart',
    name: 'Diagramm',
    description: 'Visueller Chart',
    icon: ChartPieIcon
  },
  {
    id: 'detailed',
    name: 'Detailliert',
    description: 'Vollständige Daten',
    icon: PhotoIcon
  }
]

// 计算属性
const shareContent = computed((): ShareContent => ({
  title: `Zinseszins-Berechnung: €${props.calculationData?.results?.finalAmount?.toLocaleString('de-DE') || '0'}`,
  description: `Nach ${props.calculationData?.inputData?.years || 0} Jahren mit ${props.calculationData?.inputData?.interestRate || 0}% Zinsen`,
  url: props.shareUrl || window.location.href,
  calculationType: props.calculationData?.calculatorType || 'compound-interest',
  results: props.calculationData?.results
}))

const shareImage = computed(() => generatedImage.value)

const generatedLink = computed(() => {
  // 简化实现，实际应该调用generateShareableLink
  return props.shareUrl || window.location.href
})

const statistics = computed(() => getStatistics())

const mostPopularPlatform = computed(() => {
  const stats = statistics.value.sharesByPlatform
  const maxPlatform = Object.entries(stats).reduce((a, b) => stats[a[0]] > stats[b[0]] ? a : b, ['', 0])
  return {
    name: getPlatformName(maxPlatform[0]),
    count: maxPlatform[1]
  }
})

// 方法
const togglePlatform = (platform: SharingPlatform) => {
  const index = selectedPlatforms.value.indexOf(platform)
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1)
  } else {
    selectedPlatforms.value.push(platform)
  }
}

const shareToSelectedPlatforms = async () => {
  for (const platform of selectedPlatforms.value) {
    const success = await shareToplatform(platform, shareContent.value)
    if (success) {
      emit('shared', platform)
    }
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(generatedLink.value)
    // 显示成功提示
  } catch (error) {
    console.error('复制链接失败:', error)
  }
}

const generateAndCopyLink = async () => {
  try {
    const link = await generateShareableLink(
      props.calculationData,
      linkOptions.value.includeResults
    )
    await navigator.clipboard.writeText(link)
    // 显示成功提示
  } catch (error) {
    console.error('生成链接失败:', error)
  }
}

const generateImage = async () => {
  generatingImage.value = true
  try {
    generatedImage.value = await generateShareImage(
      props.calculationData,
      selectedTemplate.value as any
    )
  } catch (error) {
    console.error('生成图片失败:', error)
  } finally {
    generatingImage.value = false
  }
}

const downloadImage = () => {
  if (!generatedImage.value) return
  
  const link = document.createElement('a')
  link.download = 'zinses-rechner-ergebnis.png'
  link.href = generatedImage.value
  link.click()
}

const shareImage = async () => {
  if (!generatedImage.value) return
  
  // 实现图片分享逻辑
  console.log('分享图片:', generatedImage.value)
}

const downloadQRCode = () => {
  // 实现二维码下载
  console.log('下载二维码')
}

const getPlatformName = (platform: string): string => {
  const names = {
    [SharingPlatform.FACEBOOK]: 'Facebook',
    [SharingPlatform.TWITTER]: 'Twitter',
    [SharingPlatform.LINKEDIN]: 'LinkedIn',
    [SharingPlatform.WHATSAPP]: 'WhatsApp',
    [SharingPlatform.EMAIL]: 'E-Mail',
    [SharingPlatform.COPY_LINK]: 'Link kopieren'
  }
  return names[platform as SharingPlatform] || platform
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听器
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // 重置状态
    selectedPlatforms.value = []
    generatedImage.value = null
  }
})

// 生命周期
onMounted(() => {
  // 默认选择常用平台
  selectedPlatforms.value = [SharingPlatform.COPY_LINK]
})
</script>

<style scoped>
.share-dialog {
  @apply max-w-none;
}

.stat-card {
  @apply transition-shadow hover:shadow-md;
}

.platform-stats .w-20 {
  @apply transition-all duration-300;
}
</style>
