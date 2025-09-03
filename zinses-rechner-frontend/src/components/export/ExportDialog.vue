<!--
  统一导出对话框组件
  整合格式选择器和配置面板，提供完整的导出流程
-->

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="export-dialog-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- 背景遮罩 -->
    <div
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      @click="handleClose"
    ></div>

    <!-- 对话框容器 -->
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6"
        @click.stop
      >
        <!-- 对话框头部 -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 id="export-dialog-title" class="text-lg font-semibold text-gray-900">
              {{ dialogTitle }}
            </h3>
            <p class="mt-1 text-sm text-gray-600">
              {{ dialogDescription }}
            </p>
          </div>
          
          <button
            type="button"
            class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="handleClose"
          >
            <span class="sr-only">Schließen</span>
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- 进度指示器 -->
        <div class="mb-6">
          <nav aria-label="Fortschritt">
            <ol class="flex items-center">
              <li
                v-for="(step, index) in steps"
                :key="step.id"
                :class="[
                  'relative',
                  index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
                ]"
              >
                <!-- 连接线 -->
                <div
                  v-if="index !== steps.length - 1"
                  class="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div
                    :class="[
                      'h-0.5 w-full',
                      currentStep > index ? 'bg-blue-600' : 'bg-gray-200'
                    ]"
                  ></div>
                </div>

                <!-- 步骤指示器 -->
                <div
                  :class="[
                    'relative flex h-8 w-8 items-center justify-center rounded-full',
                    currentStep > index
                      ? 'bg-blue-600 text-white'
                      : currentStep === index
                      ? 'border-2 border-blue-600 bg-white text-blue-600'
                      : 'border-2 border-gray-300 bg-white text-gray-500'
                  ]"
                >
                  <CheckIcon
                    v-if="currentStep > index"
                    class="h-5 w-5"
                    aria-hidden="true"
                  />
                  <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
                </div>

                <!-- 步骤标签 -->
                <div class="mt-2">
                  <span
                    :class="[
                      'text-xs font-medium',
                      currentStep >= index ? 'text-blue-600' : 'text-gray-500'
                    ]"
                  >
                    {{ step.name }}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <!-- 主要内容区域 -->
        <div class="min-h-96">
          <!-- 步骤1: 格式选择 -->
          <ExportFormatSelector
            v-if="currentStep === 0"
            :available-formats="availableFormats"
            :default-format="selectedFormat"
            :chart="chart"
            @format-selected="handleFormatSelected"
            @preview-requested="handlePreviewRequested"
            @cancel="handleClose"
          />

          <!-- 步骤2: 配置设置 -->
          <ExportConfigurationPanel
            v-else-if="currentStep === 1"
            :format="selectedFormat!"
            :default-config="exportConfig"
            :show-preview="showPreview"
            @export="handleExport"
            @preview="handlePreview"
            @back="goToPreviousStep"
            @save-template="handleSaveTemplate"
          />

          <!-- 步骤3: 导出进行中 -->
          <div v-else-if="currentStep === 2" class="text-center py-12">
            <div class="mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <ArrowDownTrayIcon class="w-8 h-8 text-blue-600" />
              </div>
              <h4 class="text-lg font-medium text-gray-900 mb-2">
                Export wird durchgeführt...
              </h4>
              <p class="text-sm text-gray-600 mb-4">
                Ihre {{ formatName }} wird erstellt. Dies kann einen Moment dauern.
              </p>
            </div>

            <!-- 进度条 -->
            <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${exportProgress}%` }"
              ></div>
            </div>
            
            <p class="text-xs text-gray-500">
              {{ exportProgress }}% abgeschlossen
            </p>
          </div>

          <!-- 步骤4: 导出完成 -->
          <div v-else-if="currentStep === 3" class="text-center py-12">
            <div class="mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircleIcon class="w-8 h-8 text-green-600" />
              </div>
              <h4 class="text-lg font-medium text-gray-900 mb-2">
                Export erfolgreich!
              </h4>
              <p class="text-sm text-gray-600 mb-6">
                Ihre {{ formatName }} wurde erfolgreich erstellt und heruntergeladen.
              </p>
            </div>

            <!-- 导出结果信息 -->
            <div v-if="exportResult" class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h5 class="font-medium text-gray-900 mb-2">Export-Details:</h5>
              <div class="text-sm text-gray-600 space-y-1">
                <div>Dateiname: {{ exportResult.filename }}</div>
                <div>Dateigröße: {{ formatFileSize(exportResult.size) }}</div>
                <div>Format: {{ formatName }}</div>
                <div>Erstellt: {{ formatDate(exportResult.createdAt) }}</div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-center gap-3">
              <BaseButton
                variant="outline"
                @click="startNewExport"
              >
                Neuer Export
              </BaseButton>
              
              <BaseButton
                variant="primary"
                @click="handleClose"
              >
                Schließen
              </BaseButton>
            </div>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="exportError" class="text-center py-12">
            <div class="mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <ExclamationTriangleIcon class="w-8 h-8 text-red-600" />
              </div>
              <h4 class="text-lg font-medium text-gray-900 mb-2">
                Export fehlgeschlagen
              </h4>
              <p class="text-sm text-gray-600 mb-6">
                {{ exportError }}
              </p>
            </div>

            <!-- 错误操作按钮 -->
            <div class="flex justify-center gap-3">
              <BaseButton
                variant="outline"
                @click="retryExport"
              >
                Erneut versuchen
              </BaseButton>
              
              <BaseButton
                variant="ghost"
                @click="goToPreviousStep"
              >
                Zurück
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import ExportFormatSelector from './ExportFormatSelector.vue'
import ExportConfigurationPanel from './ExportConfigurationPanel.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { ExportFormat, quickExport } from '@/utils/export'
import type { Chart } from 'chart.js'

interface ExportResult {
  filename: string
  size: number
  format: ExportFormat
  createdAt: Date
  blob: Blob
}

interface Props {
  isOpen: boolean
  chart?: Chart
  availableFormats?: ExportFormat[]
  defaultFormat?: ExportFormat
  showPreview?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'export-completed', result: ExportResult): void
  (e: 'export-failed', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
  availableFormats: () => ['png', 'svg', 'pdf', 'csv', 'excel'],
  showPreview: true
})

const emit = defineEmits<Emits>()

// 响应式状态
const currentStep = ref(0)
const selectedFormat = ref<ExportFormat | null>(props.defaultFormat || null)
const exportConfig = ref({})
const exportProgress = ref(0)
const exportResult = ref<ExportResult | null>(null)
const exportError = ref<string | null>(null)

// 步骤定义
const steps = [
  { id: 'format', name: 'Format' },
  { id: 'config', name: 'Konfiguration' },
  { id: 'export', name: 'Export' },
  { id: 'complete', name: 'Fertig' }
]

// 格式名称映射
const formatNames = {
  png: 'PNG-Datei',
  svg: 'SVG-Datei',
  pdf: 'PDF-Dokument',
  csv: 'CSV-Datei',
  excel: 'Excel-Datei'
}

// 计算属性
const dialogTitle = computed(() => {
  const stepTitles = [
    'Exportformat auswählen',
    'Export konfigurieren',
    'Export wird durchgeführt',
    'Export abgeschlossen'
  ]
  return stepTitles[currentStep.value] || 'Export'
})

const dialogDescription = computed(() => {
  const stepDescriptions = [
    'Wählen Sie das gewünschte Format für Ihren Export.',
    'Passen Sie die Exporteinstellungen an Ihre Bedürfnisse an.',
    'Ihr Export wird erstellt und heruntergeladen.',
    'Ihr Export wurde erfolgreich abgeschlossen.'
  ]
  return stepDescriptions[currentStep.value] || ''
})

const formatName = computed(() => {
  return selectedFormat.value ? formatNames[selectedFormat.value] : ''
})

// 方法
const handleClose = () => {
  resetDialog()
  emit('close')
}

const resetDialog = () => {
  currentStep.value = 0
  selectedFormat.value = props.defaultFormat || null
  exportConfig.value = {}
  exportProgress.value = 0
  exportResult.value = null
  exportError.value = null
}

const handleFormatSelected = (format: ExportFormat) => {
  selectedFormat.value = format
  currentStep.value = 1
}

const handlePreviewRequested = (format: ExportFormat) => {
  // 实现预览逻辑
  console.log('Preview requested for format:', format)
}

const goToPreviousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    exportError.value = null
  }
}

const handleExport = async (config: any) => {
  if (!selectedFormat.value || !props.chart) return

  try {
    currentStep.value = 2
    exportError.value = null
    exportProgress.value = 0

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      exportProgress.value = Math.min(exportProgress.value + 10, 90)
    }, 200)

    // 执行导出
    const result = await quickExport(props.chart, selectedFormat.value)
    
    clearInterval(progressInterval)
    exportProgress.value = 100

    // 创建导出结果
    exportResult.value = {
      filename: `export-${Date.now()}.${selectedFormat.value}`,
      size: result.blob.size,
      format: selectedFormat.value,
      createdAt: new Date(),
      blob: result.blob
    }

    currentStep.value = 3
    emit('export-completed', exportResult.value)

  } catch (error) {
    exportError.value = error instanceof Error ? error.message : '导出失败'
    emit('export-failed', exportError.value)
  }
}

const handlePreview = (config: any) => {
  // 实现预览逻辑
  console.log('Preview with config:', config)
}

const handleSaveTemplate = (config: any) => {
  // 实现模板保存逻辑
  console.log('Save template:', config)
}

const retryExport = () => {
  exportError.value = null
  currentStep.value = 1
}

const startNewExport = () => {
  resetDialog()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  return date.toLocaleString('de-DE')
}

// 监听器
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetDialog()
  }
})
</script>

<style scoped>
/* 对话框动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
