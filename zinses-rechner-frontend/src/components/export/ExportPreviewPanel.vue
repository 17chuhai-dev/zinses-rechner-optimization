<!--
  导出预览面板组件
  提供导出前的预览功能，支持多种格式的实时预览和交互式预览
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('export.previewPanel') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('export.previewDescription') }}
          </p>
        </div>
        
        <div class="header-actions flex items-center space-x-2">
          <button
            v-if="previews.length > 1"
            @click="toggleComparison"
            :class="getComparisonButtonClasses()"
          >
            <component :is="state.showComparison ? XMarkIcon : ArrowsRightLeftIcon" class="w-4 h-4 mr-2" />
            {{ state.showComparison ? t('export.exitComparison') : t('export.compare') }}
          </button>
          
          <button
            @click="clearAllPreviews"
            :disabled="previews.length === 0"
            class="clear-button"
          >
            <TrashIcon class="w-4 h-4 mr-2" />
            {{ t('export.clearAll') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 预览生成进度 -->
    <div v-if="isGenerating" class="generation-progress mb-6">
      <div class="progress-header flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ state.currentOperation }}
        </span>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ Math.round(state.generationProgress) }}%
        </span>
      </div>
      
      <ProgressBar
        :value="state.generationProgress"
        :max="100"
        size="md"
        color="blue"
        :striped="true"
        :animated="true"
      />
    </div>

    <!-- 预览列表 -->
    <div v-if="previews.length > 0 && !state.showComparison" class="preview-list mb-6">
      <div class="list-header flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('export.previews') }} ({{ previews.length }})
        </h4>
        
        <div class="view-controls flex items-center space-x-2">
          <button
            @click="viewMode = 'grid'"
            :class="getViewModeButtonClasses('grid')"
            :aria-label="t('export.gridView')"
          >
            <Squares2X2Icon class="w-4 h-4" />
          </button>
          <button
            @click="viewMode = 'list'"
            :class="getViewModeButtonClasses('list')"
            :aria-label="t('export.listView')"
          >
            <ListBulletIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div :class="getPreviewListClasses()">
        <div
          v-for="preview in previews"
          :key="preview.id"
          :class="getPreviewItemClasses(preview)"
          @click="setCurrentPreview(preview.id)"
          role="button"
          :tabindex="0"
          @keydown="handlePreviewKeydown($event, preview.id)"
          :aria-pressed="currentPreview?.id === preview.id"
        >
          <!-- 预览缩略图 -->
          <div class="preview-thumbnail">
            <div v-if="preview.isLoading" class="thumbnail-loading">
              <ArrowPathIcon class="w-8 h-8 animate-spin text-gray-400" />
            </div>
            <div v-else-if="preview.error" class="thumbnail-error">
              <ExclamationTriangleIcon class="w-8 h-8 text-red-500" />
            </div>
            <img
              v-else-if="preview.thumbnail && preview.type === 'image'"
              :src="preview.thumbnail"
              :alt="preview.title"
              class="thumbnail-image"
            />
            <div v-else class="thumbnail-placeholder">
              <component :is="getPreviewTypeIcon(preview.type)" class="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <!-- 预览信息 -->
          <div class="preview-info">
            <h5 class="preview-title">{{ preview.title }}</h5>
            <p v-if="preview.description" class="preview-description">
              {{ preview.description }}
            </p>
            <div class="preview-meta">
              <span class="meta-item">
                {{ preview.format.toUpperCase() }}
              </span>
              <span class="meta-item">
                {{ formatFileSize(preview.metadata.size) }}
              </span>
              <span v-if="preview.metadata.dimensions" class="meta-item">
                {{ preview.metadata.dimensions.width }}×{{ preview.metadata.dimensions.height }}
              </span>
            </div>
          </div>
          
          <!-- 预览操作 -->
          <div class="preview-actions">
            <button
              @click.stop="downloadPreview(preview)"
              class="action-button"
              :aria-label="`${t('export.download')} ${preview.title}`"
            >
              <ArrowDownTrayIcon class="w-4 h-4" />
            </button>
            <button
              @click.stop="removePreview(preview.id)"
              class="action-button text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              :aria-label="`${t('export.remove')} ${preview.title}`"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
          
          <!-- 选中指示器 -->
          <div v-if="currentPreview?.id === preview.id" class="selected-indicator">
            <CheckCircleIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- 比较模式 -->
    <div v-if="state.showComparison" class="comparison-mode mb-6">
      <div class="comparison-header mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('export.previewComparison') }}
        </h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ t('export.comparisonDescription') }}
        </p>
      </div>
      
      <div class="comparison-grid grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="preview in state.comparisonPreviews"
          :key="preview.id"
          class="comparison-item"
        >
          <div class="comparison-preview">
            <div class="preview-header mb-2">
              <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                {{ preview.title }}
              </h5>
              <div class="preview-stats text-xs text-gray-600 dark:text-gray-400">
                {{ formatFileSize(preview.metadata.size) }}
                <span v-if="preview.metadata.dimensions" class="ml-2">
                  {{ preview.metadata.dimensions.width }}×{{ preview.metadata.dimensions.height }}
                </span>
              </div>
            </div>
            
            <div class="preview-content">
              <img
                v-if="preview.type === 'image' && preview.url"
                :src="preview.url"
                :alt="preview.title"
                class="comparison-image"
              />
              <div v-else class="comparison-placeholder">
                <component :is="getPreviewTypeIcon(preview.type)" class="w-12 h-12 text-gray-400" />
                <span class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {{ preview.format.toUpperCase() }} {{ t('export.preview') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主预览区域 -->
    <div v-if="currentPreview && !state.showComparison" class="main-preview">
      <div class="preview-header flex items-center justify-between mb-4">
        <div class="preview-title-section">
          <h4 class="text-md font-medium text-gray-900 dark:text-white">
            {{ currentPreview.title }}
          </h4>
          <p v-if="currentPreview.description" class="text-sm text-gray-600 dark:text-gray-400">
            {{ currentPreview.description }}
          </p>
        </div>
        
        <div class="preview-controls flex items-center space-x-2">
          <button
            v-if="currentPreview.config.enableZoom !== false"
            @click="resetView"
            class="control-button"
            :aria-label="t('export.resetView')"
          >
            <ArrowsPointingOutIcon class="w-4 h-4" />
          </button>
          
          <div v-if="currentPreview.config.enableZoom !== false" class="zoom-controls flex items-center space-x-1">
            <button
              @click="adjustZoom(-0.2)"
              class="zoom-button"
              :disabled="state.zoom <= (currentPreview.config.minZoom || 0.1)"
              :aria-label="t('export.zoomOut')"
            >
              <MinusIcon class="w-4 h-4" />
            </button>
            <span class="zoom-level text-sm text-gray-600 dark:text-gray-400">
              {{ Math.round(state.zoom * 100) }}%
            </span>
            <button
              @click="adjustZoom(0.2)"
              class="zoom-button"
              :disabled="state.zoom >= (currentPreview.config.maxZoom || 5)"
              :aria-label="t('export.zoomIn')"
            >
              <PlusIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div class="preview-viewport" :class="{ 'with-grid': currentPreview.config.showGrid }">
        <div
          class="preview-content"
          :style="getPreviewContentStyle()"
          @wheel="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <div v-if="currentPreview.isLoading" class="preview-loading">
            <ArrowPathIcon class="w-12 h-12 animate-spin text-gray-400" />
            <span class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {{ t('export.loadingPreview') }}
            </span>
          </div>
          
          <div v-else-if="currentPreview.error" class="preview-error">
            <ExclamationTriangleIcon class="w-12 h-12 text-red-500" />
            <span class="text-sm text-red-600 dark:text-red-400 mt-2">
              {{ currentPreview.error }}
            </span>
          </div>
          
          <img
            v-else-if="currentPreview.type === 'image' && currentPreview.url"
            :src="currentPreview.url"
            :alt="currentPreview.title"
            class="preview-image"
            draggable="false"
          />
          
          <iframe
            v-else-if="currentPreview.type === 'document' && currentPreview.url"
            :src="currentPreview.url"
            class="preview-document"
            :title="currentPreview.title"
          />
          
          <div v-else class="preview-placeholder">
            <component :is="getPreviewTypeIcon(currentPreview.type)" class="w-16 h-16 text-gray-400" />
            <span class="text-lg text-gray-600 dark:text-gray-400 mt-4">
              {{ currentPreview.format.toUpperCase() }} {{ t('export.preview') }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 预览元数据 -->
      <div v-if="currentPreview.config.showMetadata" class="preview-metadata mt-4">
        <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {{ t('export.metadata') }}
        </h5>
        <div class="metadata-grid grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="metadata-item">
            <span class="metadata-label">{{ t('export.fileSize') }}:</span>
            <span class="metadata-value">{{ formatFileSize(currentPreview.metadata.size) }}</span>
          </div>
          <div v-if="currentPreview.metadata.dimensions" class="metadata-item">
            <span class="metadata-label">{{ t('export.dimensions') }}:</span>
            <span class="metadata-value">
              {{ currentPreview.metadata.dimensions.width }}×{{ currentPreview.metadata.dimensions.height }}
            </span>
          </div>
          <div v-if="currentPreview.metadata.dpi" class="metadata-item">
            <span class="metadata-label">DPI:</span>
            <span class="metadata-value">{{ currentPreview.metadata.dpi }}</span>
          </div>
          <div v-if="currentPreview.metadata.colorSpace" class="metadata-item">
            <span class="metadata-label">{{ t('export.colorSpace') }}:</span>
            <span class="metadata-value">{{ currentPreview.metadata.colorSpace }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="previews.length === 0 && !isGenerating" class="empty-state text-center py-12">
      <EyeIcon class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('export.noPreviews') }}
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ t('export.generatePreviewToStart') }}
      </p>
      <button
        @click="$emit('generate-preview')"
        class="generate-button"
      >
        <EyeIcon class="w-4 h-4 mr-2" />
        {{ t('export.generatePreview') }}
      </button>
    </div>

    <!-- 操作按钮 -->
    <div v-if="currentPreview" class="panel-actions mt-6 flex items-center justify-between">
      <div class="action-info">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('export.previewReady') }}
        </span>
      </div>
      
      <div class="main-actions flex items-center space-x-3">
        <button
          @click="downloadPreview(currentPreview)"
          class="download-button"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          {{ t('export.download') }}
        </button>
        
        <button
          @click="$emit('export-with-preview', currentPreview)"
          class="export-button"
        >
          <ShareIcon class="w-4 h-4 mr-2" />
          {{ t('export.exportThis') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  XMarkIcon,
  ArrowsRightLeftIcon,
  TrashIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ArrowsPointingOutIcon,
  MinusIcon,
  PlusIcon,
  EyeIcon,
  ShareIcon,
  DocumentIcon,
  PhotoIcon,
  TableCellsIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import ProgressBar from '@/components/loading/ProgressBar.vue'
import { useExportPreview } from '@/services/ExportPreviewSystem'
import { useI18n } from '@/services/I18nService'
import { saveAs } from '../utils/file-saver-mock'
import type { PreviewData, PreviewType } from '@/services/ExportPreviewSystem'

// Props
interface Props {
  showTitle?: boolean
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true
})

// Emits
interface Emits {
  'generate-preview': []
  'export-with-preview': [preview: PreviewData]
  'preview-selected': [preview: PreviewData]
}

const emit = defineEmits<Emits>()

// 使用服务
const {
  state,
  currentPreview,
  isGenerating,
  previews,
  setCurrentPreview,
  removePreview,
  clearAllPreviews,
  setZoom,
  setPan,
  resetView,
  enableComparison,
  disableComparison
} = useExportPreview()

const { t } = useI18n()

// 响应式状态
const viewMode = ref<'grid' | 'list'>('grid')
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 计算属性
const containerClasses = computed(() => {
  const classes = ['export-preview-panel', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'p-6']
  
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  return classes
})

const ariaLabel = computed(() => {
  return `${t('export.previewPanel')}: ${previews.value.length} ${t('export.previews')}`
})

// 方法
const getComparisonButtonClasses = (): string[] => {
  const classes = [
    'comparison-button',
    'flex',
    'items-center',
    'px-3',
    'py-2',
    'text-sm',
    'font-medium',
    'rounded-md',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-blue-500'
  ]
  
  if (state.showComparison) {
    classes.push(
      'text-red-600',
      'hover:bg-red-50',
      'dark:hover:bg-red-900/20'
    )
  } else {
    classes.push(
      'text-blue-600',
      'hover:bg-blue-50',
      'dark:hover:bg-blue-900/20'
    )
  }
  
  return classes
}

const getViewModeButtonClasses = (mode: 'grid' | 'list'): string[] => {
  const classes = [
    'view-mode-button',
    'p-2',
    'rounded-md',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-blue-500'
  ]
  
  if (viewMode.value === mode) {
    classes.push(
      'text-blue-600',
      'bg-blue-50',
      'dark:bg-blue-900/20'
    )
  } else {
    classes.push(
      'text-gray-600',
      'dark:text-gray-400',
      'hover:bg-gray-50',
      'dark:hover:bg-gray-800'
    )
  }
  
  return classes
}

const getPreviewListClasses = (): string[] => {
  const classes = ['preview-list']
  
  if (viewMode.value === 'grid') {
    classes.push('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'gap-4')
  } else {
    classes.push('space-y-3')
  }
  
  return classes
}

const getPreviewItemClasses = (preview: PreviewData): string[] => {
  const classes = [
    'preview-item',
    'relative',
    'border',
    'rounded-lg',
    'cursor-pointer',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:ring-offset-2'
  ]
  
  if (viewMode.value === 'grid') {
    classes.push('p-4')
  } else {
    classes.push('p-3', 'flex', 'items-center', 'space-x-4')
  }
  
  if (currentPreview.value?.id === preview.id) {
    classes.push(
      'border-blue-500',
      'bg-blue-50',
      'dark:bg-blue-900/20',
      'ring-2',
      'ring-blue-500'
    )
  } else {
    classes.push(
      'border-gray-200',
      'dark:border-gray-700',
      'bg-white',
      'dark:bg-gray-800',
      'hover:border-gray-300',
      'dark:hover:border-gray-600',
      'hover:shadow-md'
    )
  }
  
  return classes
}

const getPreviewTypeIcon = (type: PreviewType) => {
  switch (type) {
    case 'image': return PhotoIcon
    case 'document': return DocumentIcon
    case 'data': return TableCellsIcon
    case 'interactive': return ChartBarIcon
    default: return DocumentIcon
  }
}

const getPreviewContentStyle = () => {
  return {
    transform: `scale(${state.zoom}) translate(${state.pan.x}px, ${state.pan.y}px)`,
    transformOrigin: 'center center'
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const toggleComparison = (): void => {
  if (state.showComparison) {
    disableComparison()
  } else {
    const selectedPreviews = previews.value.slice(0, 4) // 最多比较4个
    enableComparison(selectedPreviews.map(p => p.id))
  }
}

const handlePreviewKeydown = (event: KeyboardEvent, previewId: string): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    setCurrentPreview(previewId)
    const preview = previews.value.find(p => p.id === previewId)
    if (preview) {
      emit('preview-selected', preview)
    }
  }
}

const downloadPreview = (preview: PreviewData): void => {
  if (preview.blob) {
    const filename = `${preview.title.replace(/\s+/g, '-')}.${preview.format}`
    saveAs(preview.blob, filename)
  }
}

const adjustZoom = (delta: number): void => {
  const newZoom = state.zoom + delta
  setZoom(newZoom)
}

const handleWheel = (event: WheelEvent): void => {
  if (currentPreview.value?.config.enableZoom !== false && event.ctrlKey) {
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.1 : 0.1
    adjustZoom(delta)
  }
}

const handleMouseDown = (event: MouseEvent): void => {
  if (currentPreview.value?.config.enablePan !== false && event.button === 0) {
    isDragging.value = true
    dragStart.value = { x: event.clientX - state.pan.x, y: event.clientY - state.pan.y }
    event.preventDefault()
  }
}

const handleMouseMove = (event: MouseEvent): void => {
  if (isDragging.value && currentPreview.value?.config.enablePan !== false) {
    const newX = event.clientX - dragStart.value.x
    const newY = event.clientY - dragStart.value.y
    setPan(newX, newY)
  }
}

const handleMouseUp = (): void => {
  isDragging.value = false
}

// 生命周期
onMounted(() => {
  // 添加键盘快捷键
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

const handleGlobalKeydown = (event: KeyboardEvent): void => {
  if (currentPreview.value) {
    switch (event.key) {
      case 'Escape':
        if (state.showComparison) {
          disableComparison()
        }
        break
      case '=':
      case '+':
        if (event.ctrlKey) {
          event.preventDefault()
          adjustZoom(0.2)
        }
        break
      case '-':
        if (event.ctrlKey) {
          event.preventDefault()
          adjustZoom(-0.2)
        }
        break
      case '0':
        if (event.ctrlKey) {
          event.preventDefault()
          resetView()
        }
        break
    }
  }
}
</script>

<style scoped>
.export-preview-panel {
  @apply max-w-7xl mx-auto;
}

.preview-item {
  @apply min-h-24;
}

.preview-thumbnail {
  @apply w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden;
}

.thumbnail-image {
  @apply w-full h-full object-cover;
}

.thumbnail-loading,
.thumbnail-error,
.thumbnail-placeholder {
  @apply w-full h-full flex items-center justify-center;
}

.preview-info {
  @apply flex-1 min-w-0;
}

.preview-title {
  @apply font-medium text-gray-900 dark:text-white truncate;
}

.preview-description {
  @apply text-sm text-gray-600 dark:text-gray-400 truncate mt-1;
}

.preview-meta {
  @apply flex items-center space-x-2 mt-2;
}

.meta-item {
  @apply text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded;
}

.preview-actions {
  @apply flex items-center space-x-1;
}

.action-button {
  @apply p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200;
}

.selected-indicator {
  @apply absolute top-2 right-2;
}

.clear-button,
.generate-button,
.download-button,
.export-button {
  @apply flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.clear-button {
  @apply text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500;
}

.generate-button,
.download-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.export-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.preview-viewport {
  @apply relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden;
  min-height: 400px;
}

.preview-viewport.with-grid {
  background-image: 
    linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.preview-content {
  @apply w-full h-full flex items-center justify-center cursor-move;
  min-height: 400px;
}

.preview-image {
  @apply max-w-full max-h-full object-contain;
}

.preview-document {
  @apply w-full h-full border-0;
  min-height: 400px;
}

.preview-loading,
.preview-error,
.preview-placeholder {
  @apply flex flex-col items-center justify-center text-center;
}

.control-button,
.zoom-button {
  @apply p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.zoom-level {
  @apply min-w-12 text-center;
}

.comparison-item {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg p-4;
}

.comparison-image {
  @apply w-full h-64 object-contain bg-gray-50 dark:bg-gray-800 rounded;
}

.comparison-placeholder {
  @apply w-full h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded;
}

.metadata-grid {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
}

.metadata-item {
  @apply flex flex-col;
}

.metadata-label {
  @apply text-xs text-gray-600 dark:text-gray-400 font-medium;
}

.metadata-value {
  @apply text-sm text-gray-900 dark:text-white;
}

button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .preview-list.grid {
    @apply grid-cols-1;
  }
  
  .comparison-grid {
    @apply grid-cols-1;
  }
  
  .metadata-grid {
    @apply grid-cols-1;
  }
  
  .panel-actions {
    @apply flex-col space-y-3;
  }
  
  .main-actions {
    @apply w-full justify-between;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .preview-item {
  @apply border-2 border-current;
}

/* 暗色模式支持 */
:global(.theme-dark) .preview-viewport.with-grid {
  background-image: 
    linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px);
}

/* 打印样式 */
@media print {
  .panel-actions,
  .header-actions,
  .preview-controls {
    @apply hidden;
  }
}
</style>
