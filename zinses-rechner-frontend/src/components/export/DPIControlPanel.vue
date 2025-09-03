<template>
  <div class="dpi-control-panel">
    <!-- 标题和描述 -->
    <div class="panel-header">
      <h3 class="panel-title">DPI和分辨率控制</h3>
      <p class="panel-description">
        精确控制图像的DPI和分辨率设置，获得最佳的导出效果
      </p>
    </div>

    <!-- 快速预设 -->
    <div class="preset-section">
      <h4 class="section-title">快速预设</h4>
      <div class="preset-buttons">
        <button
          v-for="preset in purposePresets"
          :key="preset.purpose"
          :class="['preset-btn', { active: selectedPreset === preset.purpose }]"
          @click="selectPreset(preset.purpose)"
        >
          <Icon :name="preset.icon" size="sm" />
          <span>{{ preset.name }}</span>
        </button>
      </div>
    </div>

    <!-- DPI设置 -->
    <div class="dpi-section">
      <h4 class="section-title">DPI设置</h4>
      <div class="dpi-controls">
        <div class="dpi-input-group">
          <label for="dpi-input" class="control-label">DPI值</label>
          <div class="input-with-slider">
            <input
              id="dpi-input"
              v-model.number="currentDPI"
              type="number"
              min="72"
              max="600"
              step="1"
              class="dpi-input"
              @input="onDPIChange"
            />
            <input
              v-model.number="currentDPI"
              type="range"
              min="72"
              max="600"
              step="12"
              class="dpi-slider"
              @input="onDPIChange"
            />
          </div>
        </div>

        <div class="dpi-presets">
          <button
            v-for="dpi in commonDPIs"
            :key="dpi.value"
            :class="['dpi-preset-btn', { active: currentDPI === dpi.value }]"
            @click="setDPI(dpi.value)"
          >
            {{ dpi.value }}
            <small>{{ dpi.label }}</small>
          </button>
        </div>
      </div>

      <!-- DPI信息显示 -->
      <div class="dpi-info" v-if="dpiInfo">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">质量级别</span>
            <span class="info-value">{{ dpiInfo.category }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">像素比例</span>
            <span class="info-value">{{ dpiInfo.pixelRatio }}x</span>
          </div>
          <div class="info-item">
            <span class="info-label">适用场景</span>
            <span class="info-value">{{ dpiInfo.suitableFor.join(', ') }}</span>
          </div>
        </div>
        <p class="info-description">{{ dpiInfo.description }}</p>
      </div>
    </div>

    <!-- 分辨率设置 -->
    <div class="resolution-section">
      <h4 class="section-title">分辨率设置</h4>

      <!-- 分辨率预设 -->
      <div class="resolution-presets">
        <select v-model="selectedResolutionPreset" @change="onResolutionPresetChange" class="resolution-select">
          <option value="">选择预设分辨率</option>
          <optgroup v-for="category in resolutionCategories" :key="category.name" :label="category.name">
            <option
              v-for="preset in category.presets"
              :key="preset.preset"
              :value="preset.preset"
            >
              {{ preset.name }} ({{ preset.width }}x{{ preset.height }})
            </option>
          </optgroup>
        </select>
      </div>

      <!-- 自定义分辨率 -->
      <div class="custom-resolution">
        <div class="resolution-inputs">
          <div class="input-group">
            <label for="width-input" class="control-label">宽度</label>
            <input
              id="width-input"
              v-model.number="customWidth"
              type="number"
              min="1"
              max="8192"
              class="resolution-input"
              @input="onCustomResolutionChange"
            />
            <span class="input-unit">px</span>
          </div>

          <div class="aspect-ratio-lock">
            <button
              :class="['lock-btn', { active: aspectRatioLocked }]"
              @click="toggleAspectRatioLock"
              title="锁定宽高比"
            >
              <Icon :name="aspectRatioLocked ? 'lock' : 'unlock'" size="sm" />
            </button>
          </div>

          <div class="input-group">
            <label for="height-input" class="control-label">高度</label>
            <input
              id="height-input"
              v-model.number="customHeight"
              type="number"
              min="1"
              max="8192"
              class="resolution-input"
              @input="onCustomResolutionChange"
            />
            <span class="input-unit">px</span>
          </div>
        </div>

        <!-- 宽高比显示 -->
        <div class="aspect-ratio-info">
          <span class="aspect-ratio-label">宽高比:</span>
          <span class="aspect-ratio-value">{{ aspectRatioDisplay }}</span>
          <span class="aspect-ratio-name" v-if="detectedAspectRatio !== 'custom'">
            ({{ aspectRatioNames[detectedAspectRatio] }})
          </span>
        </div>
      </div>
    </div>

    <!-- 物理尺寸显示 -->
    <div class="physical-size-section">
      <h4 class="section-title">物理尺寸</h4>
      <div class="size-display">
        <div class="size-units">
          <button
            v-for="unit in sizeUnits"
            :key="unit.value"
            :class="['unit-btn', { active: selectedUnit === unit.value }]"
            @click="setUnit(unit.value)"
          >
            {{ unit.label }}
          </button>
        </div>
        <div class="size-values" v-if="physicalSize">
          <div class="size-item">
            <span class="size-label">宽度:</span>
            <span class="size-value">{{ physicalSize.width.toFixed(2) }} {{ selectedUnit }}</span>
          </div>
          <div class="size-item">
            <span class="size-label">高度:</span>
            <span class="size-value">{{ physicalSize.height.toFixed(2) }} {{ selectedUnit }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览和估算 -->
    <div class="preview-section">
      <h4 class="section-title">预览和估算</h4>
      <div class="preview-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">预计文件大小</span>
            <span class="info-value">{{ formatFileSize(estimatedFileSize) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">总像素数</span>
            <span class="info-value">{{ formatNumber(totalPixels) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">质量评分</span>
            <span class="info-value">{{ (qualityScore * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <!-- 智能推荐 -->
      <div class="recommendation" v-if="recommendation">
        <div class="recommendation-header">
          <Icon name="lightbulb" size="sm" />
          <span>智能推荐</span>
        </div>
        <p class="recommendation-text">{{ recommendation.reasoning[0] }}</p>
        <div class="recommendation-actions">
          <button class="apply-btn" @click="applyRecommendation">
            应用推荐设置
          </button>
          <button class="details-btn" @click="showRecommendationDetails = !showRecommendationDetails">
            {{ showRecommendationDetails ? '隐藏' : '查看' }}详情
          </button>
        </div>

        <!-- 推荐详情 -->
        <div v-if="showRecommendationDetails" class="recommendation-details">
          <div class="details-section">
            <h5>推荐理由</h5>
            <ul>
              <li v-for="reason in recommendation.reasoning" :key="reason">{{ reason }}</li>
            </ul>
          </div>
          <div class="details-section" v-if="recommendation.alternatives.length > 0">
            <h5>备选方案</h5>
            <div class="alternatives">
              <div
                v-for="alt in recommendation.alternatives.slice(0, 2)"
                :key="`${alt.dpi}-${alt.resolution.width}x${alt.resolution.height}`"
                class="alternative"
              >
                <div class="alt-header">
                  <span class="alt-dpi">{{ alt.dpi }} DPI</span>
                  <span class="alt-resolution">{{ alt.resolution.width }}x{{ alt.resolution.height }}</span>
                  <span class="alt-score">{{ (alt.score * 100).toFixed(0) }}%</span>
                </div>
                <div class="alt-pros-cons">
                  <div class="pros" v-if="alt.pros.length > 0">
                    <small>优点: {{ alt.pros.join(', ') }}</small>
                  </div>
                  <div class="cons" v-if="alt.cons.length > 0">
                    <small>缺点: {{ alt.cons.join(', ') }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 警告和提示 -->
    <div class="warnings-section" v-if="warnings.length > 0 || validationResult?.warnings.length > 0">
      <div class="warning-item" v-for="warning in allWarnings" :key="warning">
        <Icon name="warning" size="sm" />
        <span>{{ warning }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-section">
      <button class="reset-btn" @click="resetToDefaults">
        重置为默认
      </button>
      <button class="preview-btn" @click="generatePreview" :disabled="isGeneratingPreview">
        {{ isGeneratingPreview ? '生成中...' : '生成预览' }}
      </button>
      <button class="apply-btn primary" @click="applySettings">
        应用设置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  dpiCalculationEngine,
  resolutionManager,
  smartResolutionEngine,
  deviceAdaptationDetector,
  sizeUnitConverter,
  SizeUnit,
  ResolutionPreset,
  AspectRatio,
  ASPECT_RATIO_INFO
} from '@/utils/export'
import Icon from '@/components/ui/BaseIcon.vue'

// Props
interface Props {
  initialWidth?: number
  initialHeight?: number
  initialDPI?: number
  purpose?: 'web' | 'print' | 'social' | 'mobile' | 'presentation'
}

const props = withDefaults(defineProps<Props>(), {
  initialWidth: 800,
  initialHeight: 600,
  initialDPI: 96,
  purpose: 'web'
})

// Emits
const emit = defineEmits<{
  change: [settings: {
    dpi: number
    width: number
    height: number
    preset?: ResolutionPreset
  }]
  preview: [settings: {
    dpi: number
    width: number
    height: number
  }]
}>()

// Reactive state
const currentDPI = ref(props.initialDPI)
const customWidth = ref(props.initialWidth)
const customHeight = ref(props.initialHeight)
const selectedPreset = ref(props.purpose)
const selectedResolutionPreset = ref<ResolutionPreset | ''>('')
const aspectRatioLocked = ref(true)
const selectedUnit = ref<SizeUnit>(SizeUnit.INCHES)
const showRecommendationDetails = ref(false)
const isGeneratingPreview = ref(false)
const warnings = ref<string[]>([])

// 用途预设
const purposePresets = [
  { purpose: 'web', name: '网页', icon: 'monitor' },
  { purpose: 'print', name: '打印', icon: 'printer' },
  { purpose: 'social', name: '社交', icon: 'share' },
  { purpose: 'mobile', name: '移动', icon: 'smartphone' },
  { purpose: 'presentation', name: '演示', icon: 'presentation' }
]

// 常用DPI值
const commonDPIs = [
  { value: 72, label: '网页低' },
  { value: 96, label: '网页标准' },
  { value: 150, label: '打印草稿' },
  { value: 200, label: '打印良好' },
  { value: 300, label: '打印高质' },
  { value: 600, label: '专业印刷' }
]

// 尺寸单位
const sizeUnits = [
  { value: SizeUnit.INCHES, label: '英寸' },
  { value: SizeUnit.CENTIMETERS, label: '厘米' },
  { value: SizeUnit.MILLIMETERS, label: '毫米' }
]

// 宽高比名称映射
const aspectRatioNames: Record<string, string> = {
  [AspectRatio.RATIO_1_1]: '正方形',
  [AspectRatio.RATIO_4_3]: '传统屏幕',
  [AspectRatio.RATIO_16_9]: '宽屏',
  [AspectRatio.RATIO_16_10]: '宽屏变体',
  [AspectRatio.RATIO_3_2]: '摄影常用',
  [AspectRatio.CUSTOM]: '自定义'
}

// 计算属性
const dpiInfo = computed(() => {
  return dpiCalculationEngine.getDPIInfo(currentDPI.value)
})

const physicalSize = computed(() => {
  return dpiCalculationEngine.calculatePhysicalSize(
    customWidth.value,
    customHeight.value,
    currentDPI.value,
    selectedUnit.value
  )
})

const estimatedFileSize = computed(() => {
  return dpiCalculationEngine.estimateFileSize(
    customWidth.value,
    customHeight.value,
    currentDPI.value
  )
})

const totalPixels = computed(() => {
  return customWidth.value * customHeight.value
})

const qualityScore = computed(() => {
  const info = dpiCalculationEngine.getDPIInfo(currentDPI.value)
  return info.qualityLevel === 'ultra' ? 1.0 :
         info.qualityLevel === 'high' ? 0.8 :
         info.qualityLevel === 'medium' ? 0.6 : 0.4
})

const aspectRatioDisplay = computed(() => {
  const ratio = customWidth.value / customHeight.value
  return `${ratio.toFixed(2)}:1`
})

const detectedAspectRatio = computed(() => {
  return resolutionManager.detectAspectRatio(customWidth.value, customHeight.value)
})

const resolutionCategories = computed(() => {
  const categories = [
    { name: '网页分辨率', presets: resolutionManager.getPresetsByCategory('web') },
    { name: '打印分辨率', presets: resolutionManager.getPresetsByCategory('print') },
    { name: '社交媒体', presets: resolutionManager.getPresetsByCategory('social') },
    { name: '移动设备', presets: resolutionManager.getPresetsByCategory('mobile') },
    { name: '演示文稿', presets: resolutionManager.getPresetsByCategory('presentation') }
  ]
  return categories.filter(cat => cat.presets.length > 0)
})

const validationResult = computed(() => {
  return resolutionManager.validateResolution(customWidth.value, customHeight.value, currentDPI.value)
})

const allWarnings = computed(() => {
  const allWarnings = [...warnings.value]
  if (validationResult.value?.warnings) {
    allWarnings.push(...validationResult.value.warnings)
  }
  return allWarnings
})

// 智能推荐
const recommendation = ref<any>(null)

// 方法
const selectPreset = (purpose: string) => {
  selectedPreset.value = purpose
  generateRecommendation()
}

const setDPI = (dpi: number) => {
  currentDPI.value = dpi
  onDPIChange()
}

const setUnit = (unit: SizeUnit) => {
  selectedUnit.value = unit
}

const onDPIChange = () => {
  emitChange()
  generateRecommendation()
}

const onResolutionPresetChange = () => {
  if (selectedResolutionPreset.value) {
    const preset = resolutionManager.getPresetInfo(selectedResolutionPreset.value)
    customWidth.value = preset.width
    customHeight.value = preset.height
    currentDPI.value = preset.recommendedDPI
    onCustomResolutionChange()
  }
}

const onCustomResolutionChange = () => {
  if (aspectRatioLocked.value) {
    // 保持宽高比逻辑可以在这里实现
  }
  emitChange()
  generateRecommendation()
}

const toggleAspectRatioLock = () => {
  aspectRatioLocked.value = !aspectRatioLocked.value
}

const emitChange = () => {
  emit('change', {
    dpi: currentDPI.value,
    width: customWidth.value,
    height: customHeight.value,
    preset: selectedResolutionPreset.value || undefined
  })
}

const generatePreview = () => {
  isGeneratingPreview.value = true
  emit('preview', {
    dpi: currentDPI.value,
    width: customWidth.value,
    height: customHeight.value
  })
  setTimeout(() => {
    isGeneratingPreview.value = false
  }, 1000)
}

const applySettings = () => {
  emitChange()
}

const resetToDefaults = () => {
  currentDPI.value = props.initialDPI
  customWidth.value = props.initialWidth
  customHeight.value = props.initialHeight
  selectedResolutionPreset.value = ''
  selectedPreset.value = props.purpose
  emitChange()
}

const generateRecommendation = async () => {
  try {
    const context = {
      purpose: selectedPreset.value as any,
      contentType: 'chart' as const,
      targetAudience: 'general' as const
    }

    recommendation.value = await smartResolutionEngine.getRecommendation(
      customWidth.value,
      customHeight.value,
      context
    )
  } catch (error) {
    console.warn('Failed to generate recommendation:', error)
  }
}

const applyRecommendation = () => {
  if (recommendation.value) {
    currentDPI.value = recommendation.value.recommendedDPI
    customWidth.value = recommendation.value.recommendedResolution.width
    customHeight.value = recommendation.value.recommendedResolution.height
    if (recommendation.value.recommendedPreset) {
      selectedResolutionPreset.value = recommendation.value.recommendedPreset
    }
    emitChange()
  }
}

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// 生命周期
onMounted(() => {
  generateRecommendation()
})

// 监听器
watch([customWidth, customHeight, currentDPI], () => {
  // 验证设置
  const validation = resolutionManager.validateResolution(
    customWidth.value,
    customHeight.value,
    currentDPI.value
  )

  warnings.value = validation.warnings || []
})
</script>

<style scoped>
.dpi-control-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.panel-header {
  margin-bottom: 24px;
  text-align: center;
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.panel-description {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 预设按钮 */
.preset-section {
  margin-bottom: 24px;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.preset-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
}

/* DPI控制 */
.dpi-section {
  margin-bottom: 24px;
}

.dpi-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dpi-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.input-with-slider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dpi-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.dpi-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  cursor: pointer;
}

.dpi-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.dpi-presets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
}

.dpi-preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dpi-preset-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.dpi-preset-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
}

.dpi-preset-btn small {
  font-size: 0.7rem;
  opacity: 0.8;
}

/* DPI信息 */
.dpi-info {
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 0.9rem;
  color: #1f2937;
  font-weight: 600;
}

.info-description {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
  font-style: italic;
}

/* 分辨率控制 */
.resolution-section {
  margin-bottom: 24px;
}

.resolution-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.custom-resolution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resolution-inputs {
  display: flex;
  align-items: end;
  gap: 12px;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.resolution-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  padding-right: 32px;
}

.input-unit {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 0.8rem;
  color: #6b7280;
  pointer-events: none;
}

.aspect-ratio-lock {
  display: flex;
  align-items: center;
  padding-bottom: 8px;
}

.lock-btn {
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lock-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.lock-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
}

.aspect-ratio-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #6b7280;
}

.aspect-ratio-value {
  font-weight: 600;
  color: #1f2937;
}

.aspect-ratio-name {
  color: #3b82f6;
}

/* 物理尺寸 */
.physical-size-section {
  margin-bottom: 24px;
}

.size-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.size-units {
  display: flex;
  gap: 4px;
}

.unit-btn {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.unit-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.unit-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
}

.size-values {
  display: flex;
  gap: 24px;
}

.size-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.size-label {
  font-size: 0.8rem;
  color: #6b7280;
}

.size-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

/* 预览部分 */
.preview-section {
  margin-bottom: 24px;
}

.preview-info {
  margin-bottom: 16px;
}

/* 推荐部分 */
.recommendation {
  padding: 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  margin-bottom: 16px;
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.recommendation-text {
  color: #92400e;
  margin: 0 0 12px 0;
  font-size: 0.9rem;
}

.recommendation-actions {
  display: flex;
  gap: 8px;
}

.apply-btn, .details-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.apply-btn {
  background: #f59e0b;
  color: white;
  border: none;
}

.apply-btn:hover {
  background: #d97706;
}

.details-btn {
  background: transparent;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.details-btn:hover {
  background: #fef3c7;
}

.recommendation-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f59e0b;
}

.details-section {
  margin-bottom: 12px;
}

.details-section h5 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 8px 0;
}

.details-section ul {
  margin: 0;
  padding-left: 16px;
  color: #92400e;
  font-size: 0.85rem;
}

.alternatives {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alternative {
  padding: 8px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 6px;
}

.alt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #92400e;
}

.alt-pros-cons {
  font-size: 0.75rem;
  color: #92400e;
}

/* 警告部分 */
.warnings-section {
  margin-bottom: 24px;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

/* 操作按钮 */
.actions-section {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.reset-btn, .preview-btn, .apply-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.reset-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.preview-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.preview-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.preview-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.apply-btn.primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.apply-btn.primary:hover {
  background: #2563eb;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .dpi-control-panel {
    padding: 16px;
  }

  .preset-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .resolution-inputs {
    flex-direction: column;
    align-items: stretch;
  }

  .aspect-ratio-lock {
    order: -1;
    justify-content: center;
    padding-bottom: 0;
    margin-bottom: 8px;
  }

  .actions-section {
    flex-direction: column;
  }
}
</style>
