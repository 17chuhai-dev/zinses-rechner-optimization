<template>
  <div class="export-buttons">
    <!-- 导出状态显示 -->
    <div v-if="isExporting || exportSuccess || exportError" class="export-status mb-4">
      <!-- 进度条 -->
      <div v-if="isExporting" class="progress-container">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">
            {{ getStatusMessage() }}
          </span>
          <span class="text-sm text-gray-500">{{ exportProgress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${exportProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- 成功消息 -->
      <div v-else-if="exportSuccess" class="success-message">
        <div class="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircleIcon class="w-5 h-5 text-green-500 mr-2" />
          <span class="text-sm text-green-700">{{ getStatusMessage() }}</span>
          <button 
            @click="clearSuccess"
            class="ml-auto text-green-500 hover:text-green-700"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 错误消息 -->
      <div v-else-if="exportError" class="error-message">
        <div class="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <ExclamationTriangleIcon class="w-5 h-5 text-red-500 mr-2" />
          <span class="text-sm text-red-700">{{ getStatusMessage() }}</span>
          <button 
            @click="clearError"
            class="ml-auto text-red-500 hover:text-red-700"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 导出按钮组 -->
    <div class="export-actions">
      <h4 class="text-lg font-semibold text-gray-900 mb-3">
        📤 Ergebnisse exportieren
      </h4>
      
      <!-- 单个导出按钮 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <button
          @click="handleExportCSV"
          :disabled="isExporting"
          class="export-btn export-btn-csv"
        >
          <span class="export-icon">📊</span>
          <div class="export-text">
            <div class="font-medium">CSV</div>
            <div class="text-xs opacity-75">Tabellendaten</div>
          </div>
        </button>

        <button
          @click="handleExportExcel"
          :disabled="isExporting"
          class="export-btn export-btn-excel"
        >
          <span class="export-icon">📈</span>
          <div class="export-text">
            <div class="font-medium">Excel</div>
            <div class="text-xs opacity-75">Arbeitsmappe</div>
          </div>
        </button>

        <button
          @click="handleExportPDF"
          :disabled="isExporting"
          class="export-btn export-btn-pdf"
        >
          <span class="export-icon">📄</span>
          <div class="export-text">
            <div class="font-medium">PDF</div>
            <div class="text-xs opacity-75">Bericht</div>
          </div>
        </button>
      </div>

      <!-- 批量导出按钮 -->
      <div class="batch-export">
        <button
          @click="handleExportAll"
          :disabled="isExporting"
          class="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ArrowDownTrayIcon class="w-5 h-5 mr-2" />
          Alle Formate herunterladen
        </button>
      </div>

      <!-- 导出选项 -->
      <div class="export-options mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 class="text-sm font-medium text-gray-700 mb-2">Exportoptionen</h5>
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              v-model="includeChart"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-600">Diagramm einschließen (nur PDF)</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="includeFormula"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-600">Formeln und Erklärungen einschließen</span>
          </label>
        </div>
      </div>

      <!-- 帮助文本 -->
      <div class="help-text mt-3 text-xs text-gray-500">
        💡 <strong>Tipp:</strong> CSV für Tabellenkalkulationen, Excel für detaillierte Analyse, PDF für Präsentationen.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon,
  ArrowDownTrayIcon 
} from '@heroicons/vue/24/outline'
import { useExport } from '@/composables/useExport'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'

interface Props {
  result: CalculationResult
  form: CalculatorForm
  chartElement?: HTMLElement
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'export-started': [format: string]
  'export-completed': [format: string]
  'export-failed': [format: string, error: string]
}>()

// 导出功能
const {
  isExporting,
  exportError,
  exportSuccess,
  exportProgress,
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportAll,
  clearError,
  clearSuccess,
  getStatusMessage,
  checkBrowserSupport
} = useExport()

// 导出选项
const includeChart = ref(true)
const includeFormula = ref(true)

// 计算导出选项
const exportOptions = computed(() => ({
  includeChart: includeChart.value,
  includeFormula: includeFormula.value,
  language: 'de' as const
}))

// 浏览器兼容性检查
const browserSupport = checkBrowserSupport()
if (!browserSupport.supported) {
  console.warn('导出功能不支持:', browserSupport.message)
}

// 导出处理函数
const handleExportCSV = async () => {
  try {
    emit('export-started', 'csv')
    await exportToCSV(props.result, props.form, exportOptions.value)
    emit('export-completed', 'csv')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CSV导出失败'
    emit('export-failed', 'csv', message)
  }
}

const handleExportExcel = async () => {
  try {
    emit('export-started', 'excel')
    await exportToExcel(props.result, props.form, exportOptions.value)
    emit('export-completed', 'excel')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Excel导出失败'
    emit('export-failed', 'excel', message)
  }
}

const handleExportPDF = async () => {
  try {
    emit('export-started', 'pdf')
    await exportToPDF(props.result, props.form, props.chartElement, exportOptions.value)
    emit('export-completed', 'pdf')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF导出失败'
    emit('export-failed', 'pdf', message)
  }
}

const handleExportAll = async () => {
  try {
    emit('export-started', 'all')
    await exportAll(props.result, props.form, props.chartElement, exportOptions.value)
    emit('export-completed', 'all')
  } catch (error) {
    const message = error instanceof Error ? error.message : '批量导出失败'
    emit('export-failed', 'all', message)
  }
}
</script>

<style scoped>
.export-btn {
  @apply flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200;
}

.export-btn:hover:not(:disabled) {
  @apply transform -translate-y-1 shadow-md;
}

.export-btn-csv:hover:not(:disabled) {
  @apply border-green-300 bg-green-50;
}

.export-btn-excel:hover:not(:disabled) {
  @apply border-blue-300 bg-blue-50;
}

.export-btn-pdf:hover:not(:disabled) {
  @apply border-red-300 bg-red-50;
}

.export-icon {
  @apply text-2xl mr-3;
}

.export-text {
  @apply text-left;
}

.progress-container {
  @apply w-full;
}
</style>
