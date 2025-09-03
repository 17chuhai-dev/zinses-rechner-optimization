<template>
  <div class="png-export-config-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h3 class="panel-title">PNG导出配置</h3>
      <div class="panel-actions">
        <button 
          class="btn-preset" 
          @click="showPresets = !showPresets"
          :class="{ active: showPresets }"
        >
          预设
        </button>
        <button class="btn-reset" @click="resetToDefaults">
          重置
        </button>
      </div>
    </div>

    <!-- 预设选择 -->
    <div v-if="showPresets" class="presets-section">
      <div class="presets-grid">
        <button
          v-for="(preset, key) in presets"
          :key="key"
          class="preset-button"
          :class="{ active: selectedPreset === key }"
          @click="applyPreset(key)"
        >
          <div class="preset-name">{{ preset.name }}</div>
          <div class="preset-desc">{{ preset.description }}</div>
        </button>
      </div>
    </div>

    <!-- 配置面板 -->
    <div class="config-sections">
      <!-- 基础设置 -->
      <div class="config-section">
        <h4 class="section-title">基础设置</h4>
        
        <!-- 分辨率设置 -->
        <div class="config-group">
          <label class="config-label">分辨率</label>
          <div class="resolution-controls">
            <div class="resolution-presets">
              <button
                v-for="resolution in resolutionPresets"
                :key="resolution.name"
                class="resolution-preset"
                :class="{ active: isResolutionActive(resolution) }"
                @click="applyResolution(resolution)"
              >
                {{ resolution.name }}
              </button>
            </div>
            <div class="resolution-inputs">
              <div class="input-group">
                <label>宽度</label>
                <input
                  v-model.number="config.width"
                  type="number"
                  min="1"
                  max="8192"
                  @input="onConfigChange"
                />
                <span class="unit">px</span>
              </div>
              <div class="input-group">
                <label>高度</label>
                <input
                  v-model.number="config.height"
                  type="number"
                  min="1"
                  max="8192"
                  @input="onConfigChange"
                />
                <span class="unit">px</span>
              </div>
              <button 
                class="aspect-ratio-lock"
                :class="{ active: lockAspectRatio }"
                @click="lockAspectRatio = !lockAspectRatio"
                title="锁定宽高比"
              >
                🔒
              </button>
            </div>
          </div>
        </div>

        <!-- DPI设置 -->
        <div class="config-group">
          <label class="config-label">DPI设置</label>
          <div class="dpi-controls">
            <div class="dpi-presets">
              <button
                v-for="dpi in dpiPresets"
                :key="dpi.value"
                class="dpi-preset"
                :class="{ active: config.dpi === dpi.value }"
                @click="config.dpi = dpi.value; onConfigChange()"
              >
                {{ dpi.name }}
              </button>
            </div>
            <div class="dpi-slider">
              <input
                v-model.number="config.dpi"
                type="range"
                min="72"
                max="600"
                step="1"
                @input="onConfigChange"
              />
              <div class="dpi-value">{{ config.dpi }} DPI</div>
            </div>
            <div class="physical-size">
              物理尺寸: {{ physicalSize.width }}" × {{ physicalSize.height }}"
            </div>
          </div>
        </div>
      </div>

      <!-- 质量设置 -->
      <div class="config-section">
        <h4 class="section-title">质量设置</h4>
        
        <!-- 质量级别 -->
        <div class="config-group">
          <label class="config-label">质量级别</label>
          <div class="quality-levels">
            <button
              v-for="level in qualityLevels"
              :key="level.value"
              class="quality-level"
              :class="{ active: config.quality === level.value }"
              @click="config.quality = level.value; onConfigChange()"
            >
              <div class="level-name">{{ level.name }}</div>
              <div class="level-desc">{{ level.description }}</div>
            </button>
          </div>
        </div>

        <!-- 透明度设置 -->
        <div class="config-group">
          <label class="config-label">透明度</label>
          <div class="transparency-controls">
            <div class="transparency-modes">
              <button
                v-for="mode in transparencyModes"
                :key="mode.value"
                class="transparency-mode"
                :class="{ active: config.transparencyMode === mode.value }"
                @click="config.transparencyMode = mode.value; onConfigChange()"
              >
                {{ mode.name }}
              </button>
            </div>
            <div v-if="config.transparencyMode !== 'none'" class="transparency-options">
              <div class="option-group">
                <label>背景色</label>
                <input
                  v-model="config.backgroundColor"
                  type="color"
                  @input="onConfigChange"
                />
              </div>
              <div class="option-group">
                <label>透明度</label>
                <input
                  v-model.number="config.opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  @input="onConfigChange"
                />
                <span class="value">{{ Math.round(config.opacity * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <div class="config-section">
        <h4 class="section-title">
          高级设置
          <button 
            class="toggle-advanced"
            @click="showAdvanced = !showAdvanced"
          >
            {{ showAdvanced ? '收起' : '展开' }}
          </button>
        </h4>
        
        <div v-if="showAdvanced" class="advanced-options">
          <!-- 抗锯齿 -->
          <div class="config-group">
            <label class="config-label">抗锯齿</label>
            <select v-model="config.antiAliasing" @change="onConfigChange">
              <option value="none">无</option>
              <option value="standard">标准</option>
              <option value="subpixel">子像素</option>
              <option value="advanced">高级</option>
            </select>
          </div>

          <!-- 锐化 -->
          <div class="config-group">
            <label class="config-label">锐化强度</label>
            <input
              v-model.number="config.sharpening"
              type="range"
              min="0"
              max="1"
              step="0.01"
              @input="onConfigChange"
            />
            <span class="value">{{ Math.round(config.sharpening * 100) }}%</span>
          </div>

          <!-- 降噪 -->
          <div class="config-group">
            <label class="config-label">降噪强度</label>
            <input
              v-model.number="config.noiseReduction"
              type="range"
              min="0"
              max="1"
              step="0.01"
              @input="onConfigChange"
            />
            <span class="value">{{ Math.round(config.noiseReduction * 100) }}%</span>
          </div>

          <!-- 颜色优化 -->
          <div class="config-group">
            <label class="config-label">颜色优化</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  v-model="config.colorOptimization"
                  type="checkbox"
                  @change="onConfigChange"
                />
                启用颜色优化
              </label>
              <label class="checkbox-label">
                <input
                  v-model="config.preserveGradients"
                  type="checkbox"
                  @change="onConfigChange"
                />
                保持渐变效果
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览和统计 -->
    <div class="preview-section">
      <div class="preview-stats">
        <div class="stat-item">
          <label>预估文件大小</label>
          <span class="stat-value">{{ formatFileSize(estimatedSize) }}</span>
        </div>
        <div class="stat-item">
          <label>压缩比</label>
          <span class="stat-value">{{ compressionRatio }}:1</span>
        </div>
        <div class="stat-item">
          <label>质量评分</label>
          <span class="stat-value">{{ qualityScore }}/100</span>
        </div>
      </div>
      
      <div class="preview-actions">
        <button class="btn-preview" @click="generatePreview" :disabled="isGeneratingPreview">
          {{ isGeneratingPreview ? '生成中...' : '预览效果' }}
        </button>
        <button class="btn-export" @click="exportPNG" :disabled="isExporting">
          {{ isExporting ? '导出中...' : '导出PNG' }}
        </button>
      </div>
    </div>

    <!-- 智能推荐 -->
    <div v-if="recommendations.length > 0" class="recommendations-section">
      <h4 class="section-title">智能推荐</h4>
      <div class="recommendations">
        <div
          v-for="(rec, index) in recommendations"
          :key="index"
          class="recommendation"
          @click="applyRecommendation(rec)"
        >
          <div class="rec-title">{{ rec.title }}</div>
          <div class="rec-desc">{{ rec.description }}</div>
          <div class="rec-benefit">{{ rec.benefit }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  dpiCalculationEngine,
  resolutionManager,
  smartResolutionEngine,
  exportPreviewSystem,
  chartExportEngine
} from '@/utils/export'
import type { Chart } from 'chart.js'

// Props
interface Props {
  chart?: Chart | HTMLElement
  initialConfig?: Partial<PNGExportConfig>
}

const props = withDefaults(defineProps<Props>(), {
  initialConfig: () => ({})
})

// Emits
const emit = defineEmits<{
  configChange: [config: PNGExportConfig]
  preview: [result: any]
  export: [result: any]
}>()

// PNG导出配置接口
interface PNGExportConfig {
  width: number
  height: number
  dpi: number
  quality: number
  transparencyMode: 'none' | 'full' | 'selective'
  backgroundColor: string
  opacity: number
  antiAliasing: 'none' | 'standard' | 'subpixel' | 'advanced'
  sharpening: number
  noiseReduction: number
  colorOptimization: boolean
  preserveGradients: boolean
}

// 响应式数据
const config = ref<PNGExportConfig>({
  width: 800,
  height: 600,
  dpi: 96,
  quality: 0.8,
  transparencyMode: 'full',
  backgroundColor: '#ffffff',
  opacity: 1.0,
  antiAliasing: 'standard',
  sharpening: 0.3,
  noiseReduction: 0.1,
  colorOptimization: true,
  preserveGradients: true,
  ...props.initialConfig
})

const showPresets = ref(false)
const showAdvanced = ref(false)
const selectedPreset = ref<string>('')
const lockAspectRatio = ref(true)
const isGeneratingPreview = ref(false)
const isExporting = ref(false)
const recommendations = ref<Array<{
  title: string
  description: string
  benefit: string
  config: Partial<PNGExportConfig>
}>>([])

// 预设配置
const presets = {
  web: {
    name: '网页优化',
    description: '适合网页显示，文件小',
    config: { width: 800, height: 600, dpi: 96, quality: 0.7, transparencyMode: 'full' as const }
  },
  print: {
    name: '打印质量',
    description: '高质量打印，文件大',
    config: { width: 2480, height: 3508, dpi: 300, quality: 0.9, transparencyMode: 'none' as const }
  },
  social: {
    name: '社交媒体',
    description: '社交平台分享优化',
    config: { width: 1200, height: 630, dpi: 96, quality: 0.8, transparencyMode: 'full' as const }
  },
  presentation: {
    name: '演示文稿',
    description: '适合PPT等演示',
    config: { width: 1920, height: 1080, dpi: 150, quality: 0.85, transparencyMode: 'none' as const }
  }
}

// 分辨率预设
const resolutionPresets = [
  { name: '小', width: 400, height: 300 },
  { name: '中', width: 800, height: 600 },
  { name: '大', width: 1200, height: 900 },
  { name: '超大', width: 1920, height: 1440 },
  { name: 'A4', width: 2480, height: 3508 },
  { name: '4K', width: 3840, height: 2160 }
]

// DPI预设
const dpiPresets = [
  { name: '网页', value: 96 },
  { name: '标准', value: 150 },
  { name: '高清', value: 200 },
  { name: '打印', value: 300 },
  { name: '专业', value: 600 }
]

// 质量级别
const qualityLevels = [
  { name: '草稿', value: 0.5, description: '快速预览' },
  { name: '标准', value: 0.8, description: '平衡质量' },
  { name: '高质量', value: 0.9, description: '最佳效果' },
  { name: '无损', value: 1.0, description: '完美质量' }
]

// 透明度模式
const transparencyModes = [
  { name: '无透明', value: 'none' },
  { name: '完全透明', value: 'full' },
  { name: '选择性透明', value: 'selective' }
]

// 计算属性
const physicalSize = computed(() => {
  const result = dpiCalculationEngine.calculatePhysicalSize(
    config.value.width,
    config.value.height,
    config.value.dpi,
    'inches'
  )
  return {
    width: (Math.round(result.width * 100) / 100).toFixed(2),
    height: (Math.round(result.height * 100) / 100).toFixed(2)
  }
})

const estimatedSize = computed(() => {
  // 简化的文件大小估算
  const pixelCount = config.value.width * config.value.height
  const quality = config.value.quality
  const hasTransparency = config.value.transparencyMode !== 'none'
  
  let baseSize = pixelCount * (hasTransparency ? 4 : 3) // RGBA vs RGB
  baseSize *= quality
  
  return Math.round(baseSize)
})

const compressionRatio = computed(() => {
  const uncompressedSize = config.value.width * config.value.height * 4
  const ratio = uncompressedSize / estimatedSize.value
  return Math.round(ratio * 10) / 10
})

const qualityScore = computed(() => {
  let score = config.value.quality * 60 // 基础质量分
  score += config.value.dpi / 300 * 20 // DPI分
  score += config.value.sharpening * 10 // 锐化分
  score += config.value.antiAliasing !== 'none' ? 10 : 0 // 抗锯齿分
  
  return Math.min(100, Math.round(score))
})

// 方法
const onConfigChange = () => {
  if (lockAspectRatio.value) {
    // 保持宽高比逻辑可以在这里实现
  }
  
  emit('configChange', config.value)
  generateRecommendations()
}

const applyPreset = (presetKey: string) => {
  selectedPreset.value = presetKey
  const preset = presets[presetKey as keyof typeof presets]
  Object.assign(config.value, preset.config)
  onConfigChange()
  showPresets.value = false
}

const applyResolution = (resolution: { width: number; height: number }) => {
  if (lockAspectRatio.value) {
    const aspectRatio = config.value.width / config.value.height
    config.value.width = resolution.width
    config.value.height = Math.round(resolution.width / aspectRatio)
  } else {
    config.value.width = resolution.width
    config.value.height = resolution.height
  }
  onConfigChange()
}

const isResolutionActive = (resolution: { width: number; height: number }) => {
  return config.value.width === resolution.width && config.value.height === resolution.height
}

const resetToDefaults = () => {
  Object.assign(config.value, {
    width: 800,
    height: 600,
    dpi: 96,
    quality: 0.8,
    transparencyMode: 'full',
    backgroundColor: '#ffffff',
    opacity: 1.0,
    antiAliasing: 'standard',
    sharpening: 0.3,
    noiseReduction: 0.1,
    colorOptimization: true,
    preserveGradients: true
  })
  onConfigChange()
}

const generatePreview = async () => {
  if (!props.chart) return
  
  isGeneratingPreview.value = true
  try {
    const previewResult = await exportPreviewSystem.generatePreview(props.chart, {
      format: 'png',
      exportConfig: config.value
    })
    emit('preview', previewResult)
  } catch (error) {
    console.error('预览生成失败:', error)
  } finally {
    isGeneratingPreview.value = false
  }
}

const exportPNG = async () => {
  if (!props.chart) return
  
  isExporting.value = true
  try {
    const exportResult = await chartExportEngine.exportToPNG(props.chart, config.value)
    emit('export', exportResult)
  } catch (error) {
    console.error('PNG导出失败:', error)
  } finally {
    isExporting.value = false
  }
}

const generateRecommendations = async () => {
  if (!props.chart) return
  
  try {
    const context = {
      purpose: 'web' as const,
      contentType: 'chart' as const,
      targetAudience: 'general' as const
    }
    
    const recommendation = await smartResolutionEngine.getRecommendation(
      config.value.width,
      config.value.height,
      context
    )
    
    recommendations.value = [
      {
        title: '优化文件大小',
        description: '降低DPI和质量以减小文件',
        benefit: `可减小 ${Math.round((1 - 0.7) * 100)}% 文件大小`,
        config: { dpi: 96, quality: 0.7 }
      },
      {
        title: '提升打印质量',
        description: '增加DPI以获得更好的打印效果',
        benefit: '打印质量提升显著',
        config: { dpi: 300, quality: 0.9 }
      }
    ]
  } catch (error) {
    console.error('生成推荐失败:', error)
  }
}

const applyRecommendation = (rec: typeof recommendations.value[0]) => {
  Object.assign(config.value, rec.config)
  onConfigChange()
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

// 生命周期
onMounted(() => {
  generateRecommendations()
})

// 监听配置变化
watch(config, () => {
  onConfigChange()
}, { deep: true })
</script>

<style scoped>
.png-export-config-panel {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.btn-preset,
.btn-reset {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #ffffff;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preset:hover,
.btn-reset:hover {
  background: #e9ecef;
}

.btn-preset.active {
  background: #007bff;
  color: #ffffff;
  border-color: #007bff;
}

.presets-section {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.preset-button {
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-button:hover {
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
}

.preset-button.active {
  border-color: #007bff;
  background: #e7f3ff;
}

.preset-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.preset-desc {
  font-size: 12px;
  color: #6c757d;
}

.config-sections {
  padding: 20px;
}

.config-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.toggle-advanced {
  padding: 4px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #ffffff;
  color: #6c757d;
  font-size: 12px;
  cursor: pointer;
}

.config-group {
  margin-bottom: 16px;
}

.config-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
}

.resolution-controls {
  space-y: 12px;
}

.resolution-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.resolution-preset {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #ffffff;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.resolution-preset:hover {
  background: #e9ecef;
}

.resolution-preset.active {
  background: #007bff;
  color: #ffffff;
  border-color: #007bff;
}

.resolution-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-group label {
  font-size: 12px;
  color: #6c757d;
}

.input-group input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.unit {
  font-size: 12px;
  color: #6c757d;
}

.aspect-ratio-lock {
  padding: 6px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

.aspect-ratio-lock.active {
  background: #007bff;
  color: #ffffff;
  border-color: #007bff;
}

.dpi-controls {
  space-y: 12px;
}

.dpi-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.dpi-preset {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #ffffff;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.dpi-preset:hover {
  background: #e9ecef;
}

.dpi-preset.active {
  background: #007bff;
  color: #ffffff;
  border-color: #007bff;
}

.dpi-slider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.dpi-slider input {
  flex: 1;
}

.dpi-value {
  font-weight: 500;
  color: #495057;
  min-width: 80px;
}

.physical-size {
  font-size: 12px;
  color: #6c757d;
}

.quality-levels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.quality-level {
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #ffffff;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.quality-level:hover {
  border-color: #007bff;
}

.quality-level.active {
  border-color: #007bff;
  background: #e7f3ff;
}

.level-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.level-desc {
  font-size: 11px;
  color: #6c757d;
}

.transparency-controls {
  space-y: 12px;
}

.transparency-modes {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.transparency-mode {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #ffffff;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.transparency-mode:hover {
  background: #e9ecef;
}

.transparency-mode.active {
  background: #007bff;
  color: #ffffff;
  border-color: #007bff;
}

.transparency-options {
  display: flex;
  gap: 16px;
  align-items: center;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-group label {
  font-size: 12px;
  color: #6c757d;
}

.option-group input[type="color"] {
  width: 40px;
  height: 30px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
}

.option-group input[type="range"] {
  width: 100px;
}

.value {
  font-size: 12px;
  color: #495057;
  min-width: 40px;
}

.advanced-options {
  space-y: 16px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
}

.preview-section {
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-item label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-preview,
.btn-export {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview {
  background: #6c757d;
  color: #ffffff;
}

.btn-preview:hover:not(:disabled) {
  background: #5a6268;
}

.btn-export {
  background: #28a745;
  color: #ffffff;
}

.btn-export:hover:not(:disabled) {
  background: #218838;
}

.btn-preview:disabled,
.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.recommendations-section {
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation {
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

.recommendation:hover {
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
}

.rec-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.rec-desc {
  font-size: 14px;
  color: #495057;
  margin-bottom: 4px;
}

.rec-benefit {
  font-size: 12px;
  color: #28a745;
  font-weight: 500;
}
</style>
