<!--
  导出配置界面组件
  提供导出参数配置界面，支持各种导出格式的详细配置选项
-->

<template>
  <div class="export-configuration-panel">
    <!-- 增强的标题和当前格式 -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-900">
          Exportkonfiguration
        </h3>
        <div class="flex items-center space-x-3">
          <!-- 格式信息 -->
          <div class="flex items-center text-sm text-gray-600">
            <component :is="formatIcon" class="w-4 h-4 mr-2" />
            {{ formatName }}
          </div>
          <!-- 模板管理 -->
          <BaseButton
            variant="outline"
            size="sm"
            @click="showTemplateManager = true"
          >
            <BookmarkIcon class="w-4 h-4 mr-1" />
            Vorlagen
          </BaseButton>
        </div>
      </div>
      <p class="text-sm text-gray-600">
        Passen Sie die Exporteinstellungen für das {{ formatName }}-Format an.
      </p>

      <!-- 配置状态指示器 -->
      <div class="mt-3 flex items-center space-x-4 text-xs">
        <div class="flex items-center">
          <div :class="[
            'w-2 h-2 rounded-full mr-2',
            isConfigValid ? 'bg-green-500' : 'bg-red-500'
          ]"></div>
          <span :class="isConfigValid ? 'text-green-700' : 'text-red-700'">
            {{ isConfigValid ? 'Konfiguration gültig' : 'Konfiguration unvollständig' }}
          </span>
        </div>
        <div v-if="estimatedFileSize" class="flex items-center text-gray-500">
          <DocumentIcon class="w-3 h-3 mr-1" />
          Geschätzte Größe: {{ estimatedFileSize }}
        </div>
      </div>
    </div>

    <!-- 配置表单 -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 快速配置预设 -->
      <div v-if="showQuickPresets" class="config-section mb-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-medium text-gray-900">Schnellkonfiguration</h4>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="showQuickPresets = false"
          >
            <XMarkIcon class="w-4 h-4" />
          </BaseButton>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            v-for="preset in quickPresets"
            :key="preset.id"
            @click="applyPreset(preset)"
            class="preset-card p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left"
          >
            <div class="flex items-center mb-2">
              <component :is="preset.icon" class="w-4 h-4 mr-2 text-blue-600" />
              <span class="font-medium text-gray-900">{{ preset.name }}</span>
            </div>
            <p class="text-xs text-gray-600">{{ preset.description }}</p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="tag in preset.tags"
                :key="tag"
                class="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {{ tag }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- 通用配置 -->
      <div class="config-section">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-medium text-gray-900">Allgemeine Einstellungen</h4>
          <BaseButton
            v-if="!showQuickPresets"
            variant="ghost"
            size="sm"
            @click="showQuickPresets = true"
          >
            <SparklesIcon class="w-4 h-4 mr-1" />
            Presets
          </BaseButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 文件名 -->
          <BaseInput
            v-model="config.filename"
            label="Dateiname"
            placeholder="Automatisch generiert"
            help-text="Lassen Sie leer für automatische Generierung"
          />

          <!-- 质量设置 -->
          <BaseSelect
            v-if="showQualityOption"
            v-model="config.quality"
            label="Qualität"
            :options="qualityOptions"
          />
        </div>

        <!-- 包含选项 -->
        <div class="mt-4">
          <h5 class="text-sm font-medium text-gray-700 mb-3">Inhalt einschließen:</h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BaseToggle
              v-model="config.includeChart"
              label="Diagramm"
              help-text="Grafische Darstellung einschließen"
            />
            <BaseToggle
              v-model="config.includeData"
              label="Rohdaten"
              help-text="Tabellarische Daten einschließen"
            />
            <BaseToggle
              v-model="config.includeFormulas"
              label="Formeln"
              help-text="Berechnungsformeln einschließen"
            />
            <BaseToggle
              v-model="config.includeMetadata"
              label="Metadaten"
              help-text="Zusätzliche Informationen einschließen"
            />
          </div>
        </div>
      </div>

      <!-- 格式特定配置 -->
      <div v-if="formatSpecificConfig" class="config-section">
        <h4 class="text-md font-medium text-gray-900 mb-4">
          {{ formatName }}-spezifische Einstellungen
        </h4>

        <!-- PNG/JPEG 配置 -->
        <div v-if="isImageFormat" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput
              v-model.number="config.width"
              type="number"
              label="Breite (px)"
              :min="100"
              :max="4000"
            />
            <BaseInput
              v-model.number="config.height"
              type="number"
              label="Höhe (px)"
              :min="100"
              :max="4000"
            />
          </div>

          <BaseToggle
            v-if="format === 'png'"
            v-model="config.transparent"
            label="Transparenter Hintergrund"
            help-text="Hintergrund transparent machen"
          />

          <div v-if="!config.transparent">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Hintergrundfarbe
            </label>
            <input
              v-model="config.backgroundColor"
              type="color"
              class="w-16 h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>
        </div>

        <!-- SVG 配置 -->
        <div v-if="format === 'svg'" class="space-y-4">
          <BaseToggle
            v-model="config.embedFonts"
            label="Schriften einbetten"
            help-text="Schriften in SVG-Datei einbetten"
          />
          <BaseToggle
            v-model="config.optimizeSize"
            label="Dateigröße optimieren"
            help-text="SVG-Code für kleinere Dateigröße optimieren"
          />
        </div>

        <!-- PDF 配置 -->
        <div v-if="format === 'pdf'" class="space-y-4">
          <BaseSelect
            v-model="config.pageSize"
            label="Seitengröße"
            :options="pageSizeOptions"
          />
          <BaseSelect
            v-model="config.orientation"
            label="Ausrichtung"
            :options="orientationOptions"
          />
          <BaseToggle
            v-model="config.includeHeader"
            label="Kopfzeile einschließen"
            help-text="Kopfzeile mit Titel und Datum"
          />
          <BaseToggle
            v-model="config.includeFooter"
            label="Fußzeile einschließen"
            help-text="Fußzeile mit Seitenzahl"
          />
        </div>

        <!-- CSV 配置 -->
        <div v-if="format === 'csv'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseSelect
              v-model="config.delimiter"
              label="Trennzeichen"
              :options="delimiterOptions"
            />
            <BaseSelect
              v-model="config.encoding"
              label="Zeichenkodierung"
              :options="encodingOptions"
            />
          </div>
          <BaseToggle
            v-model="config.includeHeaders"
            label="Spaltenüberschriften"
            help-text="Erste Zeile als Überschriften"
          />
        </div>

        <!-- Excel 配置 -->
        <div v-if="format === 'excel'" class="space-y-4">
          <BaseInput
            v-model="config.sheetName"
            label="Arbeitsblattname"
            placeholder="Berechnungsergebnisse"
          />
          <BaseToggle
            v-model="config.includeCharts"
            label="Diagramme einbetten"
            help-text="Diagramme in Excel-Datei einbetten"
          />
          <BaseToggle
            v-model="config.protectSheet"
            label="Arbeitsblatt schützen"
            help-text="Arbeitsblatt vor Änderungen schützen"
          />
        </div>
      </div>

      <!-- 高级选项 -->
      <div class="config-section">
        <details class="group">
          <summary class="flex items-center justify-between cursor-pointer text-md font-medium text-gray-900 mb-4">
            Erweiterte Optionen
            <ChevronDownIcon class="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
          </summary>

          <div class="space-y-4 mt-4">
            <BaseToggle
              v-model="config.addWatermark"
              label="Wasserzeichen hinzufügen"
              help-text="Zinses-Rechner Wasserzeichen hinzufügen"
            />

            <BaseInput
              v-if="config.addWatermark"
              v-model="config.watermarkText"
              label="Wasserzeichen-Text"
              placeholder="Zinses-Rechner.de"
            />

            <BaseToggle
              v-model="config.compressOutput"
              label="Ausgabe komprimieren"
              help-text="Dateigröße durch Kompression reduzieren"
            />

            <BaseSelect
              v-if="config.compressOutput"
              v-model="config.compressionLevel"
              label="Komprimierungsgrad"
              :options="compressionOptions"
            />
          </div>
        </details>
      </div>

      <!-- 预览区域 -->
      <div v-if="showPreview" class="config-section">
        <h4 class="text-md font-medium text-gray-900 mb-4">Vorschau</h4>
        <div class="preview-container bg-gray-50 rounded-lg p-4 min-h-32 flex items-center justify-center">
          <div class="text-center text-gray-500">
            <EyeIcon class="w-8 h-8 mx-auto mb-2" />
            <p class="text-sm">Vorschau wird geladen...</p>
          </div>
        </div>
      </div>

      <!-- 配置摘要 -->
      <div class="config-summary bg-blue-50 rounded-lg p-4">
        <h5 class="font-medium text-blue-900 mb-2">Konfigurationszusammenfassung</h5>
        <div class="text-sm text-blue-700 space-y-1">
          <div>Format: {{ formatName }}</div>
          <div v-if="config.quality">Qualität: {{ getQualityLabel(config.quality) }}</div>
          <div v-if="isImageFormat">Größe: {{ config.width }}×{{ config.height }}px</div>
          <div>Geschätzte Dateigröße: {{ estimatedFileSize }}</div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-between items-center pt-6 border-t">
        <div class="flex gap-3">
          <BaseButton
            type="button"
            variant="ghost"
            @click="resetToDefaults"
          >
            Zurücksetzen
          </BaseButton>

          <BaseButton
            type="button"
            variant="outline"
            @click="saveAsTemplate"
          >
            Als Vorlage speichern
          </BaseButton>
        </div>

        <div class="flex gap-3">
          <BaseButton
            type="button"
            variant="outline"
            @click="$emit('back')"
          >
            Zurück
          </BaseButton>

          <BaseButton
            type="button"
            variant="outline"
            @click="showPreviewModal"
            :disabled="!canPreview"
          >
            <EyeIcon class="w-4 h-4 mr-2" />
            Vorschau
          </BaseButton>

          <BaseButton
            type="submit"
            variant="primary"
            :loading="isExporting"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            Exportieren
          </BaseButton>
        </div>
      </div>
    </form>

    <!-- 模板管理对话框 -->
    <BaseDialog
      :open="showTemplateManager"
      @close="showTemplateManager = false"
      title="Exportvorlagen verwalten"
      size="lg"
    >
      <div class="space-y-6">
        <!-- 模板列表 -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-medium text-gray-900">Gespeicherte Vorlagen</h4>
            <BaseButton
              variant="primary"
              size="sm"
              @click="showSaveTemplateDialog = true"
            >
              <PlusIcon class="w-4 h-4 mr-1" />
              Neue Vorlage
            </BaseButton>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="template in savedTemplates"
              :key="template.id"
              class="template-item flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div class="flex-1">
                <div class="flex items-center">
                  <component :is="getCategoryIcon(template.category)" class="w-4 h-4 mr-2 text-gray-500" />
                  <span class="font-medium text-gray-900">{{ template.name }}</span>
                  <span v-if="template.isDefault" class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                    Standard
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">{{ template.description }}</p>
                <div class="flex items-center mt-2 text-xs text-gray-500">
                  <span>Verwendet: {{ template.useCount }}x</span>
                  <span class="mx-2">•</span>
                  <span>{{ formatDate(template.createdAt) }}</span>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="applyTemplate(template)"
                >
                  Anwenden
                </BaseButton>
                <BaseButton
                  v-if="!template.isDefault"
                  variant="ghost"
                  size="sm"
                  @click="deleteTemplate(template.id)"
                  class="text-red-600 hover:text-red-700"
                >
                  <TrashIcon class="w-4 h-4" />
                </BaseButton>
              </div>
            </div>
          </div>
        </div>

        <!-- 模板统计 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h5 class="font-medium text-gray-900 mb-2">Statistiken</h5>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div class="text-center">
              <div class="text-lg font-semibold text-gray-900">{{ savedTemplates.length }}</div>
              <div class="text-gray-600">Vorlagen</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold text-gray-900">{{ mostUsedTemplate?.useCount || 0 }}</div>
              <div class="text-gray-600">Meist verwendet</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold text-gray-900">{{ customTemplatesCount }}</div>
              <div class="text-gray-600">Benutzerdefiniert</div>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>

    <!-- 保存模板对话框 -->
    <BaseDialog
      :open="showSaveTemplateDialog"
      @close="showSaveTemplateDialog = false"
      title="Vorlage speichern"
      size="md"
    >
      <form @submit.prevent="saveCurrentAsTemplate" class="space-y-4">
        <BaseInput
          v-model="newTemplateName"
          label="Vorlagenname"
          placeholder="Meine Exportvorlage"
          required
        />
        <BaseTextarea
          v-model="newTemplateDescription"
          label="Beschreibung"
          placeholder="Beschreibung der Vorlage..."
          rows="3"
        />
        <BaseSelect
          v-model="newTemplateCategory"
          label="Kategorie"
          :options="templateCategoryOptions"
        />
        <div class="flex justify-end space-x-3">
          <BaseButton
            type="button"
            variant="outline"
            @click="showSaveTemplateDialog = false"
          >
            Abbrechen
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
          >
            Speichern
          </BaseButton>
        </div>
      </form>
    </BaseDialog>

    <!-- 实时预览面板 -->
    <div
      v-if="showPreview && previewData"
      class="preview-panel fixed right-4 top-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
    >
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-900">Vorschau</h4>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="showPreview = false"
          >
            <XMarkIcon class="w-4 h-4" />
          </BaseButton>
        </div>
      </div>
      <div class="p-4">
        <div class="preview-content">
          <img
            v-if="previewData.type === 'image'"
            :src="previewData.url"
            :alt="previewData.filename"
            class="w-full h-auto rounded border"
          />
          <div v-else class="text-center py-8 text-gray-500">
            <DocumentIcon class="w-12 h-12 mx-auto mb-2" />
            <p class="text-sm">{{ previewData.filename }}</p>
            <p class="text-xs text-gray-400">{{ previewData.size }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  ChevronDownIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  DocumentIcon,
  CodeBracketIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  BookmarkIcon,
  XMarkIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseToggle from '@/components/ui/BaseToggle.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import { ExportFormat, ExportQuality } from '@/utils/export'

interface ExportConfig {
  // 通用配置
  filename: string
  quality: ExportQuality
  includeChart: boolean
  includeData: boolean
  includeFormulas: boolean
  includeMetadata: boolean

  // 图像格式配置
  width: number
  height: number
  transparent: boolean
  backgroundColor: string

  // SVG配置
  embedFonts: boolean
  optimizeSize: boolean

  // PDF配置
  pageSize: string
  orientation: string
  includeHeader: boolean
  includeFooter: boolean

  // CSV配置
  delimiter: string
  encoding: string
  includeHeaders: boolean

  // Excel配置
  sheetName: string
  includeCharts: boolean
  protectSheet: boolean

  // 高级选项
  addWatermark: boolean
  watermarkText: string
  compressOutput: boolean
  compressionLevel: string
}

interface ExportTemplate {
  id: string
  name: string
  description: string
  category: string
  config: ExportConfig
  isDefault: boolean
  useCount: number
  createdAt: Date
  updatedAt: Date
}

interface QuickPreset {
  id: string
  name: string
  description: string
  icon: any
  tags: string[]
  config: Partial<ExportConfig>
}

interface Props {
  format: ExportFormat
  defaultConfig?: Partial<ExportConfig>
  showPreview?: boolean
}

interface Emits {
  (e: 'export', config: ExportConfig): void
  (e: 'preview', config: ExportConfig): void
  (e: 'back'): void
  (e: 'save-template', config: ExportConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true
})

const emit = defineEmits<Emits>()

// 响应式状态
const isExporting = ref(false)
const config = ref<ExportConfig>({
  filename: '',
  quality: 'high',
  includeChart: true,
  includeData: true,
  includeFormulas: false,
  includeMetadata: true,
  width: 800,
  height: 600,
  transparent: false,
  backgroundColor: '#ffffff',
  embedFonts: true,
  optimizeSize: true,
  pageSize: 'A4',
  orientation: 'portrait',
  includeHeader: true,
  includeFooter: true,
  delimiter: ',',
  encoding: 'utf-8',
  includeHeaders: true,
  sheetName: 'Berechnungsergebnisse',
  includeCharts: true,
  protectSheet: false,
  addWatermark: false,
  watermarkText: 'Zinses-Rechner.de',
  compressOutput: false,
  compressionLevel: 'medium'
})

// 新增状态
const showTemplateManager = ref(false)
const showSaveTemplateDialog = ref(false)
const showQuickPresets = ref(true)
const showPreview = ref(false)
const previewData = ref<any>(null)

// 模板相关状态
const savedTemplates = ref<ExportTemplate[]>([])
const newTemplateName = ref('')
const newTemplateDescription = ref('')
const newTemplateCategory = ref('custom')

// 格式信息映射
const formatInfoMap = {
  png: { name: 'PNG-Bild', icon: PhotoIcon },
  svg: { name: 'SVG-Vektor', icon: CodeBracketIcon },
  pdf: { name: 'PDF-Dokument', icon: DocumentIcon },
  csv: { name: 'CSV-Datei', icon: TableCellsIcon },
  excel: { name: 'Excel-Arbeitsmappe', icon: PresentationChartLineIcon }
}

// 选项配置
const qualityOptions = [
  { value: 'low', label: 'Niedrig (schnell)' },
  { value: 'medium', label: 'Mittel (ausgewogen)' },
  { value: 'high', label: 'Hoch (beste Qualität)' },
  { value: 'ultra', label: 'Ultra (maximale Qualität)' }
]

const pageSizeOptions = [
  { value: 'A4', label: 'A4 (210×297mm)' },
  { value: 'A3', label: 'A3 (297×420mm)' },
  { value: 'Letter', label: 'Letter (216×279mm)' },
  { value: 'Legal', label: 'Legal (216×356mm)' }
]

const orientationOptions = [
  { value: 'portrait', label: 'Hochformat' },
  { value: 'landscape', label: 'Querformat' }
]

const delimiterOptions = [
  { value: ',', label: 'Komma (,)' },
  { value: ';', label: 'Semikolon (;)' },
  { value: '\t', label: 'Tabulator' },
  { value: '|', label: 'Pipe (|)' }
]

const encodingOptions = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'utf-16', label: 'UTF-16' },
  { value: 'iso-8859-1', label: 'ISO-8859-1' }
]

const compressionOptions = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' }
]

// 快速预设配置
const quickPresets = ref<QuickPreset[]>([
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Optimiert für soziale Netzwerke',
    icon: PhotoIcon,
    tags: ['Web', 'Mobil', 'Schnell'],
    config: {
      width: 1080,
      height: 1080,
      quality: 'high',
      backgroundColor: '#ffffff',
      includeChart: true,
      includeData: false
    }
  },
  {
    id: 'presentation',
    name: 'Präsentation',
    description: 'Für PowerPoint und Keynote',
    icon: PresentationChartLineIcon,
    tags: ['Präsentation', 'HD', 'Professionell'],
    config: {
      width: 1920,
      height: 1080,
      quality: 'ultra',
      backgroundColor: '#ffffff',
      includeChart: true,
      includeData: true,
      includeMetadata: false
    }
  },
  {
    id: 'print-ready',
    name: 'Druckfertig',
    description: 'Hohe Auflösung für Druck',
    icon: DocumentIcon,
    tags: ['Druck', 'Hochauflösend', 'PDF'],
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'ultra',
      includeHeader: true,
      includeFooter: true,
      includeChart: true,
      includeData: true,
      includeMetadata: true
    }
  }
])

// 模板分类选项
const templateCategoryOptions = [
  { value: 'custom', label: 'Benutzerdefiniert' },
  { value: 'business', label: 'Geschäftlich' },
  { value: 'personal', label: 'Persönlich' },
  { value: 'presentation', label: 'Präsentation' },
  { value: 'analysis', label: 'Analyse' }
]

// 计算属性
const formatName = computed(() => formatInfoMap[props.format]?.name || props.format)
const formatIcon = computed(() => formatInfoMap[props.format]?.icon)
const isImageFormat = computed(() => ['png', 'jpeg'].includes(props.format))
const showQualityOption = computed(() => ['png', 'jpeg', 'pdf'].includes(props.format))
const formatSpecificConfig = computed(() => props.format !== 'json')
const canPreview = computed(() => ['png', 'svg', 'pdf'].includes(props.format))

const estimatedFileSize = computed(() => {
  // 简化的文件大小估算
  const baseSizes = {
    png: 300,
    svg: 100,
    pdf: 800,
    csv: 10,
    excel: 200
  }

  const baseSize = baseSizes[props.format] || 100
  const qualityMultiplier = {
    low: 0.5,
    medium: 1,
    high: 1.5,
    ultra: 2
  }[config.value.quality] || 1

  const sizeKB = Math.round(baseSize * qualityMultiplier)
  return sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`
})

// 方法
const getQualityLabel = (quality: string) => {
  return qualityOptions.find(opt => opt.value === quality)?.label || quality
}

const resetToDefaults = () => {
  // 重置为默认配置
  Object.assign(config.value, {
    filename: '',
    quality: 'high',
    includeChart: true,
    includeData: true,
    includeFormulas: false,
    includeMetadata: true,
    width: 800,
    height: 600,
    transparent: false,
    backgroundColor: '#ffffff'
  })
}

const saveAsTemplate = () => {
  emit('save-template', { ...config.value })
}

const showPreviewModal = () => {
  emit('preview', { ...config.value })
}

const handleSubmit = () => {
  isExporting.value = true
  emit('export', { ...config.value })
}

// 新增方法
const applyPreset = (preset: QuickPreset) => {
  Object.assign(config.value, preset.config)
  showQuickPresets.value = false
}

const applyTemplate = (template: ExportTemplate) => {
  Object.assign(config.value, template.config)
  template.useCount++
  showTemplateManager.value = false
}

const saveCurrentAsTemplate = () => {
  const newTemplate: ExportTemplate = {
    id: `template_${Date.now()}`,
    name: newTemplateName.value,
    description: newTemplateDescription.value,
    category: newTemplateCategory.value,
    config: { ...config.value },
    isDefault: false,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  savedTemplates.value.push(newTemplate)

  // 重置表单
  newTemplateName.value = ''
  newTemplateDescription.value = ''
  newTemplateCategory.value = 'custom'
  showSaveTemplateDialog.value = false
}

const deleteTemplate = (templateId: string) => {
  const index = savedTemplates.value.findIndex(t => t.id === templateId)
  if (index > -1) {
    savedTemplates.value.splice(index, 1)
  }
}

const getCategoryIcon = (category: string) => {
  const icons = {
    custom: SparklesIcon,
    business: DocumentIcon,
    personal: PhotoIcon,
    presentation: PresentationChartLineIcon,
    analysis: TableCellsIcon
  }
  return icons[category as keyof typeof icons] || SparklesIcon
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// 监听器
watch(() => props.defaultConfig, (newConfig) => {
  if (newConfig) {
    Object.assign(config.value, newConfig)
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (props.defaultConfig) {
    Object.assign(config.value, props.defaultConfig)
  }
})
</script>

<style scoped>
.config-section {
  @apply border-b border-gray-200 pb-6 last:border-b-0;
}

.preview-container {
  min-height: 200px;
}
</style>
