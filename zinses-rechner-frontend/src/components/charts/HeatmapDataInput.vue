<!--
  热力图数据输入组件
  提供热力图数据的输入和编辑功能
-->

<template>
  <div class="heatmap-data-input">
    <!-- 输入方式选择 -->
    <div class="input-method-selector mb-6">
      <div class="method-tabs flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          v-for="method in inputMethods"
          :key="method.id"
          @click="selectedMethod = method.id"
          :class="getMethodTabClasses(method.id)"
        >
          <component :is="method.icon" class="w-4 h-4 mr-2" />
          {{ method.name }}
        </button>
      </div>
    </div>

    <!-- 手动输入 -->
    <div v-if="selectedMethod === 'manual'" class="manual-input">
      <div class="input-header flex items-center justify-between mb-4">
        <h5 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('charts.manualDataEntry') }}
        </h5>
        
        <div class="header-actions flex items-center space-x-2">
          <button
            @click="addDataPoint"
            class="add-point-button"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            {{ t('charts.addDataPoint') }}
          </button>
          
          <button
            @click="clearAllData"
            :disabled="modelValue.length === 0"
            class="clear-button"
          >
            <TrashIcon class="w-4 h-4 mr-1" />
            {{ t('charts.clearAll') }}
          </button>
        </div>
      </div>

      <!-- 数据点列表 -->
      <div class="data-points-list space-y-3">
        <div
          v-for="(point, index) in modelValue"
          :key="index"
          class="data-point-item"
        >
          <div class="point-fields grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="field-group">
              <label class="field-label">{{ t('charts.xValue') }}</label>
              <input
                v-model="point.x"
                type="text"
                class="field-input"
                :placeholder="t('charts.xValuePlaceholder')"
                @input="handleDataChange"
              />
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('charts.yValue') }}</label>
              <input
                v-model="point.y"
                type="text"
                class="field-input"
                :placeholder="t('charts.yValuePlaceholder')"
                @input="handleDataChange"
              />
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('charts.value') }}</label>
              <input
                v-model.number="point.value"
                type="number"
                step="0.01"
                class="field-input"
                @input="handleDataChange"
              />
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('charts.actions') }}</label>
              <div class="field-actions flex items-center space-x-2">
                <input
                  v-model="point.color"
                  type="color"
                  class="color-picker"
                  @input="handleDataChange"
                />
                <button
                  @click="removeDataPoint(index)"
                  class="remove-point-button"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- 工具提示 -->
          <div class="tooltip-field mt-2">
            <label class="field-label">{{ t('charts.tooltip') }}</label>
            <input
              v-model="point.tooltip"
              type="text"
              class="field-input"
              :placeholder="t('charts.tooltipPlaceholder')"
              @input="handleDataChange"
            />
          </div>
        </div>
        
        <div v-if="modelValue.length === 0" class="empty-state">
          <MapIcon class="w-12 h-12 text-gray-400 mb-4" />
          <p class="text-gray-600 dark:text-gray-400">
            {{ t('charts.noDataPoints') }}
          </p>
          <button
            @click="addDataPoint"
            class="add-first-point-button mt-3"
          >
            {{ t('charts.addFirstDataPoint') }}
          </button>
        </div>
      </div>
    </div>

    <!-- CSV导入 -->
    <div v-if="selectedMethod === 'csv'" class="csv-input">
      <div class="csv-header mb-4">
        <h5 class="text-md font-medium text-gray-900 dark:text-white mb-2">
          {{ t('charts.csvImport') }}
        </h5>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('charts.csvFormatDescription') }}
        </p>
      </div>

      <!-- 文件上传 -->
      <div class="file-upload mb-4">
        <input
          ref="csvFileInput"
          type="file"
          accept=".csv"
          @change="handleCsvFileUpload"
          class="hidden"
        />
        <button
          @click="$refs.csvFileInput?.click()"
          class="upload-button"
        >
          <DocumentArrowUpIcon class="w-5 h-5 mr-2" />
          {{ t('charts.uploadCsvFile') }}
        </button>
      </div>

      <!-- CSV文本输入 -->
      <div class="csv-text-input">
        <label class="field-label">{{ t('charts.csvTextInput') }}</label>
        <textarea
          v-model="csvText"
          rows="8"
          class="csv-textarea"
          :placeholder="csvPlaceholder"
          @input="parseCsvText"
        ></textarea>
      </div>

      <!-- CSV预览 -->
      <div v-if="csvPreview.length > 0" class="csv-preview mt-4">
        <h6 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {{ t('charts.csvPreview') }} ({{ csvPreview.length }} {{ t('charts.dataPoints') }})
        </h6>
        
        <div class="preview-table-container">
          <table class="preview-table">
            <thead>
              <tr>
                <th>{{ t('charts.xValue') }}</th>
                <th>{{ t('charts.yValue') }}</th>
                <th>{{ t('charts.value') }}</th>
                <th>{{ t('charts.tooltip') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(point, index) in csvPreview.slice(0, 5)" :key="index">
                <td>{{ point.x }}</td>
                <td>{{ point.y }}</td>
                <td>{{ point.value }}</td>
                <td>{{ point.tooltip || '-' }}</td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="csvPreview.length > 5" class="preview-more">
            {{ t('charts.andMoreRows', { count: csvPreview.length - 5 }) }}
          </div>
        </div>
        
        <div class="csv-actions mt-4">
          <button
            @click="applyCsvData"
            class="apply-csv-button"
          >
            <CheckIcon class="w-4 h-4 mr-2" />
            {{ t('charts.applyCsvData') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 示例数据 -->
    <div v-if="selectedMethod === 'examples'" class="examples-input">
      <div class="examples-header mb-4">
        <h5 class="text-md font-medium text-gray-900 dark:text-white">
          {{ t('charts.exampleData') }}
        </h5>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('charts.exampleDataDescription') }}
        </p>
      </div>

      <div class="examples-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="example in examples"
          :key="example.id"
          class="example-card"
          @click="loadExample(example)"
        >
          <div class="example-header">
            <component :is="example.icon" class="w-5 h-5 text-blue-500" />
            <span class="example-name">{{ example.name }}</span>
          </div>
          <p class="example-description">{{ example.description }}</p>
          <div class="example-stats">
            {{ example.dataPoints }} {{ t('charts.dataPoints') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计 -->
    <div v-if="modelValue.length > 0" class="data-stats mt-6">
      <div class="stats-header mb-3">
        <h6 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ t('charts.dataStatistics') }}
        </h6>
      </div>
      
      <div class="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-item">
          <div class="stat-label">{{ t('charts.totalPoints') }}</div>
          <div class="stat-value">{{ modelValue.length }}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">{{ t('charts.uniqueXValues') }}</div>
          <div class="stat-value">{{ uniqueXValues.length }}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">{{ t('charts.uniqueYValues') }}</div>
          <div class="stat-value">{{ uniqueYValues.length }}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">{{ t('charts.valueRange') }}</div>
          <div class="stat-value">{{ formatValueRange() }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  PlusIcon,
  TrashIcon,
  MapIcon,
  DocumentArrowUpIcon,
  CheckIcon,
  PencilIcon,
  DocumentTextIcon,
  SparklesIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'
import type { HeatmapData } from '@/services/EnhancedVisualizationManager'

// Props & Emits
interface Props {
  modelValue: HeatmapData[]
}

interface Emits {
  'update:modelValue': [value: HeatmapData[]]
  'data-changed': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 使用服务
const { t } = useI18n()

// 响应式状态
const selectedMethod = ref<'manual' | 'csv' | 'examples'>('manual')
const csvText = ref('')
const csvPreview = ref<HeatmapData[]>([])

// 输入方式配置
const inputMethods = [
  {
    id: 'manual' as const,
    name: t('charts.manualInput'),
    icon: PencilIcon
  },
  {
    id: 'csv' as const,
    name: t('charts.csvImport'),
    icon: DocumentTextIcon
  },
  {
    id: 'examples' as const,
    name: t('charts.examples'),
    icon: SparklesIcon
  }
]

// 示例数据
const examples = [
  {
    id: 'correlation-matrix',
    name: t('charts.correlationMatrix'),
    description: t('charts.correlationMatrixExample'),
    icon: ChartBarIcon,
    dataPoints: 25,
    data: generateCorrelationMatrix()
  },
  {
    id: 'sales-performance',
    name: t('charts.salesPerformance'),
    description: t('charts.salesPerformanceExample'),
    icon: CurrencyDollarIcon,
    dataPoints: 84,
    data: generateSalesPerformance()
  },
  {
    id: 'time-series',
    name: t('charts.timeSeriesHeatmap'),
    description: t('charts.timeSeriesExample'),
    icon: ClockIcon,
    dataPoints: 168,
    data: generateTimeSeriesData()
  }
]

// CSV占位符文本
const csvPlaceholder = `x,y,value,tooltip
Q1,Product A,100,Q1 Product A Sales
Q1,Product B,150,Q1 Product B Sales
Q2,Product A,120,Q2 Product A Sales
Q2,Product B,180,Q2 Product B Sales`

// 计算属性
const uniqueXValues = computed(() => {
  return Array.from(new Set(props.modelValue.map(d => d.x)))
})

const uniqueYValues = computed(() => {
  return Array.from(new Set(props.modelValue.map(d => d.y)))
})

// 方法
const getMethodTabClasses = (methodId: string): string[] => {
  const classes = [
    'flex',
    'items-center',
    'px-4',
    'py-2',
    'text-sm',
    'font-medium',
    'rounded-md',
    'transition-colors',
    'duration-200'
  ]
  
  if (selectedMethod.value === methodId) {
    classes.push('bg-white', 'dark:bg-gray-700', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm')
  } else {
    classes.push('text-gray-600', 'dark:text-gray-400', 'hover:text-gray-900', 'dark:hover:text-gray-200')
  }
  
  return classes
}

const addDataPoint = (): void => {
  const newPoint: HeatmapData = {
    x: '',
    y: '',
    value: 0,
    tooltip: ''
  }
  
  const newData = [...props.modelValue, newPoint]
  emit('update:modelValue', newData)
  emit('data-changed')
}

const removeDataPoint = (index: number): void => {
  const newData = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', newData)
  emit('data-changed')
}

const clearAllData = (): void => {
  if (confirm(t('charts.confirmClearAllData'))) {
    emit('update:modelValue', [])
    emit('data-changed')
  }
}

const handleDataChange = (): void => {
  emit('data-changed')
}

const handleCsvFileUpload = (event: Event): void => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    csvText.value = e.target?.result as string
    parseCsvText()
  }
  reader.readAsText(file)
}

const parseCsvText = (): void => {
  if (!csvText.value.trim()) {
    csvPreview.value = []
    return
  }

  try {
    const lines = csvText.value.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    const data: HeatmapData[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length >= 3) {
        data.push({
          x: values[0],
          y: values[1],
          value: parseFloat(values[2]) || 0,
          tooltip: values[3] || undefined
        })
      }
    }
    
    csvPreview.value = data
  } catch (error) {
    console.error('CSV parsing error:', error)
    csvPreview.value = []
  }
}

const applyCsvData = (): void => {
  emit('update:modelValue', [...csvPreview.value])
  emit('data-changed')
  csvText.value = ''
  csvPreview.value = []
  selectedMethod.value = 'manual'
}

const loadExample = (example: any): void => {
  emit('update:modelValue', example.data)
  emit('data-changed')
  selectedMethod.value = 'manual'
}

const formatValueRange = (): string => {
  if (props.modelValue.length === 0) return '-'
  
  const values = props.modelValue.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  
  return `${min.toFixed(2)} - ${max.toFixed(2)}`
}

// 示例数据生成函数
function generateCorrelationMatrix(): HeatmapData[] {
  const assets = ['Aktien', 'Anleihen', 'Rohstoffe', 'Immobilien', 'Cash']
  const data: HeatmapData[] = []
  
  for (let i = 0; i < assets.length; i++) {
    for (let j = 0; j < assets.length; j++) {
      const correlation = i === j ? 1 : (Math.random() * 1.6 - 0.8)
      data.push({
        x: assets[i],
        y: assets[j],
        value: correlation,
        tooltip: `Korrelation zwischen ${assets[i]} und ${assets[j]}: ${correlation.toFixed(2)}`
      })
    }
  }
  
  return data
}

function generateSalesPerformance(): HeatmapData[] {
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const products = ['Produkt A', 'Produkt B', 'Produkt C', 'Produkt D', 'Produkt E', 'Produkt F', 'Produkt G']
  const data: HeatmapData[] = []
  
  for (const month of months) {
    for (const product of products) {
      const sales = Math.floor(Math.random() * 1000) + 100
      data.push({
        x: month,
        y: product,
        value: sales,
        tooltip: `${product} im ${month}: ${sales} Verkäufe`
      })
    }
  }
  
  return data
}

function generateTimeSeriesData(): HeatmapData[] {
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const data: HeatmapData[] = []
  
  for (const day of days) {
    for (const hour of hours) {
      const activity = Math.floor(Math.random() * 100)
      data.push({
        x: hour,
        y: day,
        value: activity,
        tooltip: `${day} ${hour}: ${activity}% Aktivität`
      })
    }
  }
  
  return data
}
</script>

<style scoped>
.heatmap-data-input {
  @apply space-y-6;
}

.data-point-item {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
}

.field-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.field-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.color-picker {
  @apply w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer;
}

.csv-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm;
}

.preview-table-container {
  @apply overflow-x-auto;
}

.preview-table {
  @apply min-w-full divide-y divide-gray-200 dark:divide-gray-700;
}

.preview-table th {
  @apply px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800;
}

.preview-table td {
  @apply px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white;
}

.preview-more {
  @apply text-center text-sm text-gray-500 dark:text-gray-500 py-2;
}

.example-card {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200;
}

.example-header {
  @apply flex items-center space-x-2 mb-2;
}

.example-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.example-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
}

.example-stats {
  @apply text-xs text-gray-500 dark:text-gray-500;
}

.stat-item {
  @apply text-center;
}

.stat-label {
  @apply text-xs text-gray-500 dark:text-gray-500 mb-1;
}

.stat-value {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.add-point-button,
.clear-button,
.remove-point-button,
.upload-button,
.apply-csv-button,
.add-first-point-button {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.add-point-button,
.add-first-point-button {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500;
}

.clear-button,
.remove-point-button {
  @apply text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-red-500;
}

.upload-button,
.apply-csv-button {
  @apply text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .point-fields {
    @apply grid-cols-1;
  }
  
  .stats-grid {
    @apply grid-cols-2;
  }
  
  .examples-grid {
    @apply grid-cols-1;
  }
}
</style>
