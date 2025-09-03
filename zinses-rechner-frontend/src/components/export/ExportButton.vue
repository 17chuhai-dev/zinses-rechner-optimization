<!--
  导出按钮组件
  提供快速导出功能，支持单击快速导出和长按显示选项菜单
-->

<template>
  <div class="export-button-container relative">
    <!-- 主导出按钮 -->
    <BaseButton
      ref="mainButton"
      :variant="variant"
      :size="size"
      :loading="isExporting"
      :disabled="disabled || !canExport"
      @click="handleMainClick"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      :class="[
        'export-button',
        showDropdown && 'rounded-r-none border-r-0'
      ]"
    >
      <component :is="buttonIcon" class="w-4 h-4" :class="{ 'mr-2': showLabel }" />
      <span v-if="showLabel">{{ buttonLabel }}</span>
    </BaseButton>

    <!-- 下拉箭头按钮 -->
    <BaseButton
      v-if="showDropdown"
      :variant="variant"
      :size="size"
      :disabled="disabled || !canExport"
      @click="toggleDropdown"
      class="export-dropdown-toggle rounded-l-none border-l-0 px-2"
    >
      <ChevronDownIcon class="w-4 h-4" />
    </BaseButton>

    <!-- 导出选项下拉菜单 -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="dropdownOpen"
        class="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
        @click.stop
      >
        <div class="py-1">
          <!-- 快速导出选项 -->
          <div class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Schnellexport
          </div>

          <button
            v-for="format in quickFormats"
            :key="format.id"
            @click="handleQuickExport(format.id)"
            :disabled="isExporting"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <component :is="format.icon" class="w-4 h-4 mr-3 text-gray-400" />
            <div class="flex-1">
              <div class="font-medium">{{ format.name }}</div>
              <div class="text-xs text-gray-500">{{ format.description }}</div>
            </div>
            <div class="text-xs text-gray-400">{{ format.shortcut }}</div>
          </button>

          <div class="border-t border-gray-100 my-1"></div>

          <!-- 预设导出选项 -->
          <div class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Vorlagen
          </div>

          <button
            v-for="preset in exportPresets"
            :key="preset.id"
            @click="handlePresetExport(preset)"
            :disabled="isExporting"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <component :is="preset.icon" class="w-4 h-4 mr-3 text-gray-400" />
            <div class="flex-1">
              <div class="font-medium">{{ preset.name }}</div>
              <div class="text-xs text-gray-500">{{ preset.description }}</div>
            </div>
          </button>

          <div class="border-t border-gray-100 my-1"></div>

          <!-- 高级选项 -->
          <button
            @click="openAdvancedDialog"
            :disabled="isExporting"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <CogIcon class="w-4 h-4 mr-3 text-gray-400" />
            <span class="font-medium">Erweiterte Optionen...</span>
          </button>

          <!-- 历史记录 -->
          <button
            v-if="showHistory && exportHistory.length > 0"
            @click="showHistoryPanel = true"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
          >
            <ClockIcon class="w-4 h-4 mr-3 text-gray-400" />
            <span>Export-Verlauf ({{ exportHistory.length }})</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 进度指示器 -->
    <div
      v-if="isExporting && showProgress"
      class="absolute inset-0 bg-white bg-opacity-90 rounded flex items-center justify-center"
    >
      <div class="text-center">
        <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <div class="text-xs text-gray-600">{{ exportProgress }}%</div>
      </div>
    </div>

    <!-- 导出对话框 -->
    <ExportDialog
      :is-open="dialogOpen"
      :chart="chart"
      :available-formats="availableFormats"
      :default-format="defaultFormat"
      :show-preview="showPreview"
      @close="dialogOpen = false"
      @export-completed="handleExportCompleted"
      @export-failed="handleExportFailed"
    />

    <!-- 历史记录面板 -->
    <div
      v-if="showHistoryPanel"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="showHistoryPanel = false"
    >
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          @click.stop
        >
          <h3 class="text-lg font-semibold mb-4">Export-Verlauf</h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="entry in exportHistory.slice(0, 10)"
              :key="entry.id"
              class="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
              @click="handleRepeatExport(entry)"
            >
              <div class="flex-1">
                <div class="text-sm font-medium">{{ entry.filename }}</div>
                <div class="text-xs text-gray-500">
                  {{ getFormatDisplayName(entry.format) }} • {{ formatFileSize(entry.size) }}
                </div>
              </div>
              <div class="text-xs text-gray-400">
                {{ entry.timestamp.toLocaleDateString('de-DE') }}
              </div>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <BaseButton variant="outline" @click="showHistoryPanel = false">
              Schließen
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ChevronDownIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  DocumentIcon,
  CodeBracketIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  ShareIcon,
  PrinterIcon,
  ChartBarIcon,
  CogIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import ExportDialog from './ExportDialog.vue'
import { useExportDialog } from '@/composables/useExportDialog'
import { ExportFormat } from '@/utils/export'
import type { Chart } from 'chart.js'

interface Props {
  chart?: Chart | HTMLElement
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  showLabel?: boolean
  showDropdown?: boolean
  showProgress?: boolean
  showHistory?: boolean
  showPreview?: boolean
  defaultFormat?: ExportFormat
  availableFormats?: ExportFormat[]
  quickAction?: 'dialog' | 'quick-export'
  longPressDelay?: number
}

interface Emits {
  (e: 'export-started', format: ExportFormat): void
  (e: 'export-completed', result: any): void
  (e: 'export-failed', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  showLabel: true,
  showDropdown: true,
  showProgress: true,
  showHistory: true,
  showPreview: true,
  defaultFormat: 'png',
  availableFormats: () => ['png', 'svg', 'pdf', 'csv', 'excel'],
  quickAction: 'dialog',
  longPressDelay: 800
})

const emit = defineEmits<Emits>()

// 使用导出功能
const {
  isExporting,
  exportProgress,
  exportError,
  canExport,
  exportHistory,
  quickExport,
  exportForSocialMedia,
  exportForPrint,
  exportForAnalysis,
  openDialog,
  getFormatDisplayName,
  formatFileSize
} = useExportDialog()

// 组件状态
const dropdownOpen = ref(false)
const dialogOpen = ref(false)
const showHistoryPanel = ref(false)
const longPressTimer = ref<number | null>(null)
const mainButton = ref<InstanceType<typeof BaseButton> | null>(null)

// 快速导出格式
const quickFormats = [
  {
    id: 'png' as ExportFormat,
    name: 'PNG-Bild',
    description: 'Hochauflösend, universell',
    icon: PhotoIcon,
    shortcut: 'Strg+E'
  },
  {
    id: 'svg' as ExportFormat,
    name: 'SVG-Vektor',
    description: 'Skalierbar, editierbar',
    icon: CodeBracketIcon,
    shortcut: 'Strg+Shift+E'
  },
  {
    id: 'pdf' as ExportFormat,
    name: 'PDF-Dokument',
    description: 'Vollständiger Bericht',
    icon: DocumentIcon,
    shortcut: 'Strg+P'
  },
  {
    id: 'excel' as ExportFormat,
    name: 'Excel-Datei',
    description: 'Daten und Diagramme',
    icon: PresentationChartLineIcon,
    shortcut: 'Strg+Shift+X'
  }
]

// 导出预设
const exportPresets = [
  {
    id: 'social',
    name: 'Social Media',
    description: 'Optimiert für soziale Medien',
    icon: ShareIcon,
    action: exportForSocialMedia
  },
  {
    id: 'print',
    name: 'Drucken',
    description: 'Hochauflösend für Druck',
    icon: PrinterIcon,
    action: exportForPrint
  },
  {
    id: 'analysis',
    name: 'Datenanalyse',
    description: 'Mit Rohdaten für Analyse',
    icon: ChartBarIcon,
    action: exportForAnalysis
  }
]

// 计算属性
const buttonIcon = computed(() => {
  if (isExporting.value) {
    return ArrowDownTrayIcon // 或者使用加载图标
  }
  return ArrowDownTrayIcon
})

const buttonLabel = computed(() => {
  if (isExporting.value) {
    return `Exportiere... ${exportProgress.value}%`
  }
  return 'Exportieren'
})

// 方法
const handleMainClick = () => {
  if (props.quickAction === 'quick-export') {
    handleQuickExport(props.defaultFormat)
  } else {
    openAdvancedDialog()
  }
}

const handleMouseDown = () => {
  if (props.showDropdown) {
    longPressTimer.value = window.setTimeout(() => {
      dropdownOpen.value = true
    }, props.longPressDelay)
  }
}

const handleMouseUp = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const handleMouseLeave = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const handleQuickExport = async (format: ExportFormat) => {
  if (!props.chart) return

  try {
    dropdownOpen.value = false
    emit('export-started', format)

    const result = await quickExport(props.chart, format)
    emit('export-completed', result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Export fehlgeschlagen'
    emit('export-failed', errorMessage)
  }
}

const handlePresetExport = async (preset: typeof exportPresets[0]) => {
  if (!props.chart) return

  try {
    dropdownOpen.value = false
    emit('export-started', 'png') // 预设通常使用PNG

    const result = await preset.action(props.chart)
    emit('export-completed', result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Export fehlgeschlagen'
    emit('export-failed', errorMessage)
  }
}

const openAdvancedDialog = () => {
  dropdownOpen.value = false

  if (props.chart) {
    openDialog({
      chart: props.chart,
      availableFormats: props.availableFormats,
      defaultFormat: props.defaultFormat,
      showPreview: props.showPreview
    })
    dialogOpen.value = true
  }
}

const handleExportCompleted = (result: any) => {
  dialogOpen.value = false
  emit('export-completed', result)
}

const handleExportFailed = (error: string) => {
  emit('export-failed', error)
}

const handleRepeatExport = async (historyEntry: any) => {
  if (!props.chart) return

  try {
    showHistoryPanel.value = false
    emit('export-started', historyEntry.format)

    const result = await quickExport(props.chart, historyEntry.format)
    emit('export-completed', result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Export fehlgeschlagen'
    emit('export-failed', errorMessage)
  }
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.chart || isExporting.value) return

  // Ctrl+E: 快速PNG导出
  if (event.ctrlKey && event.key === 'e' && !event.shiftKey) {
    event.preventDefault()
    handleQuickExport('png')
  }

  // Ctrl+Shift+E: 快速SVG导出
  if (event.ctrlKey && event.shiftKey && event.key === 'E') {
    event.preventDefault()
    handleQuickExport('svg')
  }

  // Ctrl+P: 快速PDF导出
  if (event.ctrlKey && event.key === 'p') {
    event.preventDefault()
    handleQuickExport('pdf')
  }

  // Ctrl+Shift+X: 快速Excel导出
  if (event.ctrlKey && event.shiftKey && event.key === 'X') {
    event.preventDefault()
    handleQuickExport('excel')
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  const container = mainButton.value?.$el?.closest('.export-button-container')

  if (container && !container.contains(target)) {
    dropdownOpen.value = false
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)

  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }
})
</script>

<style scoped>
.export-button-container {
  display: inline-flex;
}

.export-button {
  position: relative;
}

.export-dropdown-toggle {
  min-width: auto;
}

/* 长按效果 */
.export-button:active {
  transform: scale(0.98);
}

/* 下拉菜单动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
