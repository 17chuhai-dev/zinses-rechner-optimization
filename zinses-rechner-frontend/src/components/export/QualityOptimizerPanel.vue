<!--
  质量优化器面板组件
  提供导出质量优化的用户界面，包括预设选择、自定义配置、质量分析
-->

<template>
  <div :class="containerClasses" :aria-label="ariaLabel">
    <!-- 面板标题 -->
    <div class="panel-header mb-6">
      <div class="header-content flex items-center justify-between">
        <div class="title-section">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('export.qualityOptimizer') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('export.optimizeQualityDescription') }}
          </p>
        </div>
        
        <div class="header-actions">
          <button
            v-if="showAnalysis"
            @click="showAnalysis = false"
            class="close-analysis-button"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 优化策略选择 -->
    <div class="strategy-selection mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('export.optimizationStrategy') }}
      </h4>
      
      <div class="strategy-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="(preset, strategy) in allPresets"
          :key="strategy"
          :class="getStrategyCardClasses(strategy)"
          @click="selectStrategy(strategy)"
          role="button"
          :tabindex="0"
          @keydown="handleStrategyKeydown($event, strategy)"
          :aria-pressed="selectedStrategy === strategy"
        >
          <div class="strategy-icon mb-3">
            <component :is="getStrategyIcon(strategy)" class="w-8 h-8" />
          </div>
          
          <div class="strategy-info">
            <h5 class="strategy-name font-medium text-gray-900 dark:text-white mb-1">
              {{ preset.name }}
            </h5>
            <p class="strategy-description text-sm text-gray-600 dark:text-gray-400 mb-2">
              {{ preset.description }}
            </p>
            <p class="strategy-use-case text-xs text-gray-500 dark:text-gray-500">
              {{ preset.useCase }}
            </p>
          </div>
          
          <!-- 选中指示器 -->
          <div v-if="selectedStrategy === strategy" class="selected-indicator">
            <CheckCircleIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义配置 -->
    <div v-if="selectedStrategy === 'custom'" class="custom-config mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('export.customSettings') }}
      </h4>
      
      <div class="config-form bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div class="config-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 质量等级 -->
          <div class="config-field">
            <label class="config-label">{{ t('export.qualityLevel') }}</label>
            <select v-model="customConfig.quality" class="config-select">
              <option value="low">{{ t('export.low') }}</option>
              <option value="medium">{{ t('export.medium') }}</option>
              <option value="high">{{ t('export.high') }}</option>
              <option value="ultra">{{ t('export.ultra') }}</option>
            </select>
          </div>
          
          <!-- 压缩类型 -->
          <div class="config-field">
            <label class="config-label">{{ t('export.compressionType') }}</label>
            <select v-model="customConfig.compression" class="config-select">
              <option value="none">{{ t('export.noCompression') }}</option>
              <option value="lossless">{{ t('export.lossless') }}</option>
              <option value="lossy">{{ t('export.lossy') }}</option>
              <option value="adaptive">{{ t('export.adaptive') }}</option>
            </select>
          </div>
          
          <!-- DPI设置 -->
          <div class="config-field">
            <label class="config-label">{{ t('export.dpi') }}</label>
            <input
              v-model.number="customConfig.dpi"
              type="number"
              min="72"
              max="600"
              step="1"
              class="config-input"
            />
          </div>
          
          <!-- 颜色深度 -->
          <div class="config-field">
            <label class="config-label">{{ t('export.colorDepth') }}</label>
            <select v-model.number="customConfig.colorDepth" class="config-select">
              <option :value="8">8-bit (256 {{ t('export.colors') }})</option>
              <option :value="16">16-bit (65K {{ t('export.colors') }})</option>
              <option :value="24">24-bit (16M {{ t('export.colors') }})</option>
              <option :value="32">32-bit (16M {{ t('export.colors') }} + Alpha)</option>
            </select>
          </div>
        </div>
        
        <!-- 高级选项 -->
        <div class="advanced-options mt-4">
          <div class="options-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="checkbox-label">
              <input
                v-model="customConfig.preserveTransparency"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">{{ t('export.preserveTransparency') }}</span>
            </label>
            
            <label class="checkbox-label">
              <input
                v-model="customConfig.preserveMetadata"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">{{ t('export.preserveMetadata') }}</span>
            </label>
            
            <label class="checkbox-label">
              <input
                v-model="customConfig.enableProgressive"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">{{ t('export.enableProgressive') }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 目标大小设置 -->
    <div class="target-size mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('export.targetSize') }}
      </h4>
      
      <div class="size-controls flex items-center space-x-4">
        <label class="checkbox-label">
          <input
            v-model="enableTargetSize"
            type="checkbox"
            class="checkbox-input"
          />
          <span class="checkbox-text">{{ t('export.enableTargetSize') }}</span>
        </label>
        
        <div v-if="enableTargetSize" class="size-input-group flex items-center space-x-2">
          <input
            v-model.number="targetSizeKB"
            type="number"
            min="1"
            max="10240"
            class="size-input"
            :placeholder="t('export.enterTargetSize')"
          />
          <span class="size-unit text-sm text-gray-600 dark:text-gray-400">KB</span>
        </div>
      </div>
    </div>

    <!-- 优化预览 -->
    <div v-if="optimizationEstimate" class="optimization-preview mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('export.optimizationPreview') }}
      </h4>
      
      <div class="preview-content bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div class="preview-stats grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="stat-item text-center">
            <div class="stat-value text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ formatFileSize(optimizationEstimate.estimatedSize) }}
            </div>
            <div class="stat-label text-sm text-gray-600 dark:text-gray-400">
              {{ t('export.estimatedSize') }}
            </div>
          </div>
          
          <div class="stat-item text-center">
            <div class="stat-value text-2xl font-bold text-green-600 dark:text-green-400">
              {{ formatFileSize(optimizationEstimate.estimatedSavings) }}
            </div>
            <div class="stat-label text-sm text-gray-600 dark:text-gray-400">
              {{ t('export.estimatedSavings') }}
            </div>
          </div>
          
          <div class="stat-item text-center">
            <div class="stat-value text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ getQualityLabel(optimizationEstimate.estimatedQuality) }}
            </div>
            <div class="stat-label text-sm text-gray-600 dark:text-gray-400">
              {{ t('export.estimatedQuality') }}
            </div>
          </div>
        </div>
        
        <!-- 建议 -->
        <div v-if="optimizationEstimate.recommendations.length > 0" class="recommendations">
          <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            {{ t('export.recommendations') }}:
          </h5>
          <ul class="recommendation-list space-y-1">
            <li
              v-for="(recommendation, index) in optimizationEstimate.recommendations"
              :key="index"
              class="text-sm text-blue-800 dark:text-blue-200"
            >
              • {{ recommendation }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 质量分析结果 -->
    <div v-if="showAnalysis && qualityAnalysis" class="quality-analysis mb-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        {{ t('export.qualityAnalysis') }}
      </h4>
      
      <div class="analysis-content bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <!-- 分析指标 -->
        <div class="analysis-metrics grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div class="metric-card">
            <div class="metric-label text-sm text-gray-600 dark:text-gray-400">
              {{ t('export.qualityScore') }}
            </div>
            <div class="metric-value text-xl font-bold text-gray-900 dark:text-white">
              {{ Math.round(qualityAnalysis.qualityScore) }}/100
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label text-sm text-gray-600 dark:text-gray-400">
              {{ t('export.compressionRatio') }}
            </div>
            <div class="metric-value text-xl font-bold text-gray-900 dark:text-white">
              {{ qualityAnalysis.compressionRatio.toFixed(1) }}:1
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label text-sm text-gray-600 dark:text-gray-400">
              {{ t('export.loadTime') }}
            </div>
            <div class="metric-value text-xl font-bold text-gray-900 dark:text-white">
              {{ Math.round(qualityAnalysis.loadTime) }}ms
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label text-sm text-gray-600 dark:text-gray-400">
              {{ t('export.visualQuality') }}
            </div>
            <div class="metric-value text-xl font-bold text-gray-900 dark:text-white">
              {{ getQualityLabel(qualityAnalysis.visualQuality) }}
            </div>
          </div>
        </div>
        
        <!-- 警告和建议 -->
        <div v-if="qualityAnalysis.warnings.length > 0" class="warnings mb-4">
          <h5 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            {{ t('export.warnings') }}:
          </h5>
          <ul class="warning-list space-y-1">
            <li
              v-for="(warning, index) in qualityAnalysis.warnings"
              :key="index"
              class="text-sm text-red-700 dark:text-red-300 flex items-start"
            >
              <ExclamationTriangleIcon class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              {{ warning }}
            </li>
          </ul>
        </div>
        
        <div v-if="qualityAnalysis.recommendations.length > 0" class="analysis-recommendations">
          <h5 class="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            {{ t('export.recommendations') }}:
          </h5>
          <ul class="recommendation-list space-y-1">
            <li
              v-for="(recommendation, index) in qualityAnalysis.recommendations"
              :key="index"
              class="text-sm text-green-700 dark:text-green-300 flex items-start"
            >
              <CheckCircleIcon class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              {{ recommendation }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions flex items-center justify-between">
      <div class="action-info">
        <button
          v-if="!showAnalysis && qualityAnalysis"
          @click="showAnalysis = true"
          class="show-analysis-button"
        >
          <ChartBarIcon class="w-4 h-4 mr-2" />
          {{ t('export.showAnalysis') }}
        </button>
      </div>
      
      <div class="main-actions flex items-center space-x-3">
        <button
          @click="analyzeCurrentSettings"
          :disabled="isOptimizing || !hasValidConfig"
          class="analyze-button"
        >
          <MagnifyingGlassIcon class="w-4 h-4 mr-2" />
          {{ t('export.analyzeSettings') }}
        </button>
        
        <button
          @click="optimizeFile"
          :disabled="isOptimizing || !hasValidConfig"
          class="optimize-button"
        >
          <component
            :is="isOptimizing ? ArrowPathIcon : SparklesIcon"
            :class="['w-4 h-4 mr-2', { 'animate-spin': isOptimizing }]"
          />
          {{ isOptimizing ? t('export.optimizing') : t('export.optimize') }}
        </button>
      </div>
    </div>

    <!-- 进度指示器 -->
    <div v-if="isOptimizing" class="optimization-progress mt-4">
      <div class="progress-header flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ currentOptimization }}
        </span>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ Math.round(optimizationProgress) }}%
        </span>
      </div>
      
      <ProgressBar
        :value="optimizationProgress"
        :max="100"
        size="md"
        color="blue"
        :striped="true"
        :animated="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowPathIcon,
  CogIcon,
  DocumentIcon,
  PhotoIcon,
  ScaleIcon
} from '@heroicons/vue/24/outline'
import ProgressBar from '@/components/loading/ProgressBar.vue'
import { useExportQualityOptimizer } from '@/services/ExportQualityOptimizer'
import { useI18n } from '@/services/I18nService'
import type {
  OptimizationStrategy,
  OptimizationConfig,
  QualityAnalysis,
  QualityLevel,
  ExportFormat
} from '@/services/ExportQualityOptimizer'

// Props
interface Props {
  format: ExportFormat
  originalBlob?: Blob
  showTitle?: boolean
  customClasses?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true
})

// Emits
interface Emits {
  'optimization-complete': [result: any]
  'analysis-complete': [analysis: QualityAnalysis]
  'config-changed': [config: OptimizationConfig]
}

const emit = defineEmits<Emits>()

// 使用服务
const {
  isOptimizing,
  optimizationProgress,
  currentOptimization,
  optimizeExport,
  getAllPresets,
  analyzeQuality,
  estimateOptimization
} = useExportQualityOptimizer()

const { t } = useI18n()

// 响应式状态
const selectedStrategy = ref<OptimizationStrategy>('balanced')
const showAnalysis = ref(false)
const enableTargetSize = ref(false)
const targetSizeKB = ref(500)
const qualityAnalysis = ref<QualityAnalysis>()
const optimizationEstimate = ref<any>()

// 自定义配置
const customConfig = ref<OptimizationConfig>({
  strategy: 'custom',
  format: props.format,
  quality: 'high',
  compression: 'adaptive',
  preserveTransparency: true,
  preserveMetadata: false,
  enableProgressive: true,
  colorDepth: 24,
  dpi: 150
})

// 计算属性
const allPresets = computed(() => getAllPresets())

const currentConfig = computed((): OptimizationConfig => {
  if (selectedStrategy.value === 'custom') {
    return {
      ...customConfig.value,
      format: props.format,
      targetSize: enableTargetSize.value ? targetSizeKB.value : undefined
    }
  } else {
    const preset = allPresets.value[selectedStrategy.value]
    return {
      ...preset.config,
      format: props.format,
      targetSize: enableTargetSize.value ? targetSizeKB.value : undefined
    }
  }
})

const hasValidConfig = computed(() => {
  return props.originalBlob && props.originalBlob.size > 0
})

const containerClasses = computed(() => {
  const classes = ['quality-optimizer-panel', 'bg-white', 'dark:bg-gray-900', 'rounded-lg', 'p-6']
  
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
  return `${t('export.qualityOptimizer')}: ${props.format.toUpperCase()}`
})

// 方法
const getStrategyCardClasses = (strategy: OptimizationStrategy): string[] => {
  const classes = [
    'strategy-card',
    'relative',
    'p-4',
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
  
  if (selectedStrategy.value === strategy) {
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

const getStrategyIcon = (strategy: OptimizationStrategy) => {
  switch (strategy) {
    case 'quality': return SparklesIcon
    case 'balanced': return ScaleIcon
    case 'size': return DocumentIcon
    case 'custom': return CogIcon
    default: return DocumentIcon
  }
}

const selectStrategy = (strategy: OptimizationStrategy): void => {
  selectedStrategy.value = strategy
  updateEstimate()
}

const handleStrategyKeydown = (event: KeyboardEvent, strategy: OptimizationStrategy): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectStrategy(strategy)
  }
}

const getQualityLabel = (quality: QualityLevel): string => {
  const labels: Record<QualityLevel, string> = {
    low: t('export.low'),
    medium: t('export.medium'),
    high: t('export.high'),
    ultra: t('export.ultra')
  }
  return labels[quality]
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const updateEstimate = async (): Promise<void> => {
  if (!props.originalBlob) return
  
  try {
    optimizationEstimate.value = await estimateOptimization(props.originalBlob, currentConfig.value)
  } catch (error) {
    console.error('Failed to estimate optimization:', error)
  }
}

const analyzeCurrentSettings = async (): Promise<void> => {
  if (!props.originalBlob) return
  
  try {
    qualityAnalysis.value = await analyzeQuality(props.originalBlob, props.format)
    showAnalysis.value = true
    emit('analysis-complete', qualityAnalysis.value)
  } catch (error) {
    console.error('Failed to analyze quality:', error)
  }
}

const optimizeFile = async (): Promise<void> => {
  if (!props.originalBlob) return
  
  try {
    const result = await optimizeExport(props.originalBlob, currentConfig.value)
    qualityAnalysis.value = result.analysis
    showAnalysis.value = true
    emit('optimization-complete', result)
  } catch (error) {
    console.error('Failed to optimize file:', error)
  }
}

// 监听器
watch(
  () => currentConfig.value,
  (newConfig) => {
    emit('config-changed', newConfig)
    updateEstimate()
  },
  { deep: true }
)

watch(
  () => props.originalBlob,
  () => {
    updateEstimate()
  }
)

// 生命周期
onMounted(() => {
  updateEstimate()
})
</script>

<style scoped>
.quality-optimizer-panel {
  @apply max-w-6xl mx-auto;
}

.strategy-card {
  @apply min-h-32;
}

.selected-indicator {
  @apply absolute top-2 right-2;
}

.config-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.config-select,
.config-input,
.size-input {
  @apply w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.checkbox-label {
  @apply flex items-center;
}

.checkbox-input {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2;
}

.checkbox-text {
  @apply ml-2 text-sm text-gray-700 dark:text-gray-300;
}

.show-analysis-button,
.analyze-button,
.optimize-button {
  @apply flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.show-analysis-button,
.analyze-button {
  @apply text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500;
}

.optimize-button {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.close-analysis-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md;
}

button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .strategy-grid {
    @apply grid-cols-1;
  }
  
  .config-grid,
  .options-grid {
    @apply grid-cols-1;
  }
  
  .preview-stats,
  .analysis-metrics {
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
:global(.high-contrast) .strategy-card {
  @apply border-2 border-current;
}

/* 暗色模式支持 */
:global(.theme-dark) .strategy-card {
  @apply bg-gray-800 border-gray-600;
}

/* 打印样式 */
@media print {
  .panel-actions {
    @apply hidden;
  }
}
</style>
