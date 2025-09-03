<!--
  导出格式选择器组件
  提供统一的导出格式选择界面，支持PNG、SVG、PDF、CSV、Excel等多种格式
-->

<template>
  <div class="export-format-selector">
    <!-- 标题和描述 -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        Exportformat auswählen
      </h3>
      <p class="text-sm text-gray-600">
        Wählen Sie das gewünschte Format für den Export Ihrer Berechnungsergebnisse.
      </p>
    </div>

    <!-- 搜索和筛选 -->
    <div v-if="showSearch" class="search-filter mb-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Format suchen..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="flex gap-2">
          <select
            v-model="selectedCategory"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle Kategorien</option>
            <option value="image">Bilder</option>
            <option value="document">Dokumente</option>
            <option value="data">Daten</option>
          </select>
          <BaseButton
            variant="outline"
            size="sm"
            @click="toggleComparisonMode"
            :class="comparisonMode ? 'bg-blue-50 border-blue-300' : ''"
          >
            <ScaleIcon class="w-4 h-4 mr-1" />
            Vergleichen
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- 格式选择网格 -->
    <div class="format-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div
        v-for="format in filteredFormats"
        :key="format.id"
        :class="[
          'format-card relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200',
          selectedFormat === format.id
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          comparisonMode && comparedFormats.includes(format.id)
            ? 'ring-2 ring-yellow-300 bg-yellow-50'
            : ''
        ]"
        @click="handleFormatClick(format.id)"
      >
        <!-- 选中指示器 -->
        <div
          v-if="selectedFormat === format.id"
          class="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10"
        >
          <CheckIcon class="w-4 h-4 text-white" />
        </div>

        <!-- 比较模式指示器 -->
        <div
          v-if="comparisonMode && comparedFormats.includes(format.id)"
          class="absolute -top-2 -left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center z-10"
        >
          <ScaleIcon class="w-4 h-4 text-white" />
        </div>

        <!-- 格式图标 -->
        <div class="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg"
             :class="format.iconBg">
          <component :is="format.icon" class="w-6 h-6" :class="format.iconColor" />
        </div>

        <!-- 格式信息 -->
        <div class="text-center">
          <h4 class="font-medium text-gray-900 mb-1">{{ format.name }}</h4>
          <p class="text-xs text-gray-500 mb-2">{{ format.description }}</p>

          <!-- 格式特性标签 -->
          <div class="flex flex-wrap justify-center gap-1 mb-2">
            <span
              v-for="feature in format.features"
              :key="feature"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {{ feature }}
            </span>
          </div>

          <!-- 质量评分 -->
          <div class="flex justify-center items-center mb-2">
            <div class="flex items-center">
              <span class="text-xs text-gray-500 mr-1">Qualität:</span>
              <div class="flex">
                <StarIcon
                  v-for="i in 5"
                  :key="i"
                  :class="[
                    'w-3 h-3',
                    i <= getQualityRating(format.id) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  ]"
                />
              </div>
            </div>
          </div>

          <!-- 文件大小估算 -->
          <div v-if="format.estimatedSize" class="text-xs text-gray-400 mb-1">
            Geschätzte Größe: {{ format.estimatedSize }}
          </div>

          <!-- 兼容性指示器 -->
          <div class="flex justify-center items-center">
            <div class="flex space-x-1">
              <div
                v-for="platform in getCompatibilityPlatforms(format.id)"
                :key="platform.name"
                :title="platform.name"
                :class="[
                  'w-4 h-4 rounded-full',
                  platform.supported ? 'bg-green-400' : 'bg-gray-300'
                ]"
              ></div>
            </div>
          </div>
        </div>

        <!-- 推荐标签 -->
        <div
          v-if="format.recommended"
          class="absolute top-2 left-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded"
        >
          Empfohlen
        </div>

        <!-- 新功能标签 -->
        <div
          v-if="format.isNew"
          class="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
        >
          Neu
        </div>
      </div>
    </div>

    <!-- 格式比较表 -->
    <div v-if="comparisonMode && comparedFormats.length > 0" class="format-comparison mb-6">
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-gray-900">Format-Vergleich</h4>
            <BaseButton
              variant="ghost"
              size="sm"
              @click="clearComparison"
            >
              <XMarkIcon class="w-4 h-4 mr-1" />
              Löschen
            </BaseButton>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eigenschaft
                </th>
                <th
                  v-for="formatId in comparedFormats"
                  :key="formatId"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ formatInfoMap[formatId].name }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="property in comparisonProperties" :key="property.key">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                  {{ property.label }}
                </td>
                <td
                  v-for="formatId in comparedFormats"
                  :key="formatId"
                  class="px-4 py-3 text-sm text-gray-500"
                >
                  <ComparisonCell
                    :property="property"
                    :value="getComparisonValue(formatId, property.key)"
                    :format="formatId"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 选中格式的详细信息 -->
    <div v-if="selectedFormatInfo && !comparisonMode" class="selected-format-info bg-gray-50 rounded-lg p-4 mb-6">
      <h4 class="font-medium text-gray-900 mb-2">
        {{ selectedFormatInfo.name }} - Details
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h5 class="font-medium text-gray-700 mb-1">Vorteile:</h5>
          <ul class="list-disc list-inside text-gray-600 space-y-1">
            <li v-for="advantage in selectedFormatInfo.advantages" :key="advantage">
              {{ advantage }}
            </li>
          </ul>
        </div>
        <div>
          <h5 class="font-medium text-gray-700 mb-1">Verwendung:</h5>
          <ul class="list-disc list-inside text-gray-600 space-y-1">
            <li v-for="useCase in selectedFormatInfo.useCases" :key="useCase">
              {{ useCase }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 技术规格 -->
      <div class="mt-4 pt-4 border-t border-gray-200">
        <h5 class="font-medium text-gray-700 mb-2">Technische Spezifikationen:</h5>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Qualität:</span>
            <div class="flex items-center mt-1">
              <div class="flex">
                <StarIcon
                  v-for="i in 5"
                  :key="i"
                  :class="[
                    'w-3 h-3',
                    i <= getQualityRating(selectedFormatInfo.id) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  ]"
                />
              </div>
              <span class="ml-1 text-xs text-gray-600">
                {{ getQualityRating(selectedFormatInfo.id) }}/5
              </span>
            </div>
          </div>
          <div>
            <span class="text-gray-500">Kompression:</span>
            <div class="mt-1 text-gray-900">{{ getCompressionType(selectedFormatInfo.id) }}</div>
          </div>
          <div>
            <span class="text-gray-500">Skalierbarkeit:</span>
            <div class="mt-1 text-gray-900">{{ getScalabilityType(selectedFormatInfo.id) }}</div>
          </div>
          <div>
            <span class="text-gray-500">Bearbeitbar:</span>
            <div class="mt-1 text-gray-900">{{ isEditable(selectedFormatInfo.id) ? 'Ja' : 'Nein' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速选择按钮 -->
    <div class="quick-select mb-6">
      <h4 class="font-medium text-gray-900 mb-3">Schnellauswahl:</h4>
      <div class="flex flex-wrap gap-2">
        <BaseButton
          v-for="preset in quickPresets"
          :key="preset.id"
          variant="outline"
          size="sm"
          @click="selectPreset(preset)"
        >
          <component :is="preset.icon" class="w-4 h-4 mr-2" />
          {{ preset.name }}
        </BaseButton>
      </div>
    </div>

    <!-- 导出选项预览 -->
    <div v-if="selectedFormat" class="export-options-preview bg-blue-50 rounded-lg p-4">
      <div class="flex items-start">
        <InformationCircleIcon class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h5 class="font-medium text-blue-900 mb-1">Exportoptionen</h5>
          <p class="text-sm text-blue-700 mb-2">
            Für das {{ selectedFormatInfo?.name }}-Format stehen folgende Optionen zur Verfügung:
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="option in getFormatOptions(selectedFormat)"
              :key="option"
              class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              {{ option }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-between items-center mt-6">
      <BaseButton
        variant="ghost"
        @click="$emit('cancel')"
      >
        Abbrechen
      </BaseButton>

      <div class="flex gap-3">
        <BaseButton
          v-if="selectedFormat"
          variant="outline"
          @click="showPreview"
          :disabled="!canPreview"
        >
          <EyeIcon class="w-4 h-4 mr-2" />
          Vorschau
        </BaseButton>

        <BaseButton
          variant="primary"
          @click="confirmSelection"
          :disabled="!selectedFormat"
        >
          <ArrowRightIcon class="w-4 h-4 mr-2" />
          Weiter
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  CheckIcon,
  InformationCircleIcon,
  EyeIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  DocumentIcon,
  PhotoIcon,
  PresentationChartLineIcon,
  TableCellsIcon,
  CodeBracketIcon,
  ScaleIcon,
  StarIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import { ExportFormat } from '@/utils/export'
import type { Chart } from 'chart.js'

// 比较表格单元格组件
const ComparisonCell = {
  props: ['property', 'value', 'format'],
  template: `
    <div class="comparison-cell">
      <div v-if="property.key === 'qualityRating'" class="flex items-center">
        <div class="flex mr-2">
          <StarIcon
            v-for="i in 5"
            :key="i"
            :class="[
              'w-3 h-3',
              i <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'
            ]"
          />
        </div>
        <span class="text-xs">{{ value }}/5</span>
      </div>
      <div v-else-if="property.key === 'editable' || property.key === 'canPreview'" class="flex items-center">
        <CheckIcon v-if="value" class="w-4 h-4 text-green-500" />
        <XMarkIcon v-else class="w-4 h-4 text-red-500" />
        <span class="ml-1 text-xs">{{ value ? 'Ja' : 'Nein' }}</span>
      </div>
      <div v-else class="text-sm">
        {{ value || 'N/A' }}
      </div>
    </div>
  `,
  components: {
    StarIcon,
    CheckIcon,
    XMarkIcon
  }
}

// 导出格式定义
interface FormatInfo {
  id: ExportFormat
  name: string
  description: string
  icon: any
  iconBg: string
  iconColor: string
  features: string[]
  advantages: string[]
  useCases: string[]
  estimatedSize?: string
  recommended?: boolean
  canPreview: boolean
  isNew?: boolean
  category: 'image' | 'document' | 'data'
  qualityRating: number
  compressionType: string
  scalabilityType: string
  editable: boolean
}

// 快速预设定义
interface QuickPreset {
  id: string
  name: string
  icon: any
  format: ExportFormat
  description: string
}

interface Props {
  availableFormats?: ExportFormat[]
  defaultFormat?: ExportFormat
  chart?: Chart
  showPresets?: boolean
  showDetails?: boolean
  showSearch?: boolean
  enableComparison?: boolean
  maxComparisons?: number
}

interface Emits {
  (e: 'format-selected', format: ExportFormat): void
  (e: 'preview-requested', format: ExportFormat): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  availableFormats: () => ['png', 'svg', 'pdf', 'csv', 'excel'],
  showPresets: true,
  showDetails: true,
  showSearch: true,
  enableComparison: true,
  maxComparisons: 3
})

const emit = defineEmits<Emits>()

// 响应式状态
const selectedFormat = ref<ExportFormat | null>(props.defaultFormat || null)
const searchQuery = ref('')
const selectedCategory = ref('')
const comparisonMode = ref(false)
const comparedFormats = ref<ExportFormat[]>([])
const showAdvancedOptions = ref(false)

// 格式信息配置
const formatInfoMap: Record<ExportFormat, FormatInfo> = {
  png: {
    id: 'png',
    name: 'PNG-Bild',
    description: 'Hochauflösendes Rasterbild',
    icon: PhotoIcon,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    features: ['Hohe Qualität', 'Transparenz', 'Web-optimiert'],
    advantages: [
      'Verlustfreie Kompression',
      'Transparenz-Unterstützung',
      'Universelle Kompatibilität'
    ],
    useCases: [
      'Web-Veröffentlichung',
      'Präsentationen',
      'Social Media'
    ],
    estimatedSize: '200-500 KB',
    recommended: true,
    canPreview: true,
    category: 'image',
    qualityRating: 5,
    compressionType: 'Verlustfrei',
    scalabilityType: 'Pixel-basiert',
    editable: false
  },
  svg: {
    id: 'svg',
    name: 'SVG-Vektor',
    description: 'Skalierbare Vektorgrafik',
    icon: CodeBracketIcon,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    features: ['Skalierbar', 'Editierbar', 'Klein'],
    advantages: [
      'Unendlich skalierbar',
      'Kleine Dateigröße',
      'Editierbar in Grafikprogrammen'
    ],
    useCases: [
      'Professionelle Berichte',
      'Druckmedien',
      'Responsive Designs'
    ],
    estimatedSize: '50-150 KB',
    canPreview: true,
    category: 'image',
    qualityRating: 5,
    compressionType: 'Vektor',
    scalabilityType: 'Unendlich',
    editable: true
  },
  pdf: {
    id: 'pdf',
    name: 'PDF-Dokument',
    description: 'Vollständiger Bericht',
    icon: DocumentIcon,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    features: ['Vollständig', 'Druckfertig', 'Professionell'],
    advantages: [
      'Kompletter Bericht mit Daten',
      'Professionelles Layout',
      'Druckoptimiert'
    ],
    useCases: [
      'Geschäftsberichte',
      'Archivierung',
      'Offizielle Dokumente'
    ],
    estimatedSize: '500 KB - 2 MB',
    canPreview: true,
    category: 'document',
    qualityRating: 5,
    compressionType: 'Optimiert',
    scalabilityType: 'Vektor + Raster',
    editable: false
  },
  csv: {
    id: 'csv',
    name: 'CSV-Datei',
    description: 'Tabellarische Rohdaten',
    icon: TableCellsIcon,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    features: ['Rohdaten', 'Excel-kompatibel', 'Kompakt'],
    advantages: [
      'Universelle Kompatibilität',
      'Kleine Dateigröße',
      'Einfache Weiterverarbeitung'
    ],
    useCases: [
      'Datenanalyse',
      'Excel-Import',
      'Weitere Berechnungen'
    ],
    estimatedSize: '5-20 KB',
    canPreview: false,
    category: 'data',
    qualityRating: 3,
    compressionType: 'Text',
    scalabilityType: 'N/A',
    editable: true
  },
  excel: {
    id: 'excel',
    name: 'Excel-Arbeitsmappe',
    description: 'Formatierte Tabelle',
    icon: PresentationChartLineIcon,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    features: ['Formatiert', 'Formeln', 'Diagramme'],
    advantages: [
      'Professionelle Formatierung',
      'Integrierte Formeln',
      'Diagramme enthalten'
    ],
    useCases: [
      'Detailanalyse',
      'Präsentationen',
      'Weitere Berechnungen'
    ],
    estimatedSize: '100-500 KB',
    canPreview: false,
    category: 'data',
    qualityRating: 4,
    compressionType: 'Binär',
    scalabilityType: 'N/A',
    editable: true
  }
}

// 快速预设配置
const quickPresets: QuickPreset[] = [
  {
    id: 'social',
    name: 'Social Media',
    icon: PhotoIcon,
    format: 'png',
    description: 'Optimiert für soziale Medien'
  },
  {
    id: 'presentation',
    name: 'Präsentation',
    icon: PresentationChartLineIcon,
    format: 'svg',
    description: 'Für Präsentationen und Berichte'
  },
  {
    id: 'analysis',
    name: 'Datenanalyse',
    icon: TableCellsIcon,
    format: 'excel',
    description: 'Für weitere Analysen'
  },
  {
    id: 'archive',
    name: 'Archivierung',
    icon: DocumentIcon,
    format: 'pdf',
    description: 'Langzeitarchivierung'
  }
]

// 计算属性
const availableFormats = computed(() => {
  return props.availableFormats
    .map(formatId => formatInfoMap[formatId])
    .filter(Boolean)
})

const filteredFormats = computed(() => {
  let formats = availableFormats.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    formats = formats.filter(format =>
      format.name.toLowerCase().includes(query) ||
      format.description.toLowerCase().includes(query) ||
      format.features.some(feature => feature.toLowerCase().includes(query))
    )
  }

  // 分类过滤
  if (selectedCategory.value) {
    formats = formats.filter(format => format.category === selectedCategory.value)
  }

  return formats
})

const selectedFormatInfo = computed(() => {
  return selectedFormat.value ? formatInfoMap[selectedFormat.value] : null
})

const canPreview = computed(() => {
  return selectedFormatInfo.value?.canPreview || false
})

// 比较相关计算属性
const comparisonProperties = computed(() => [
  { key: 'qualityRating', label: 'Qualität', component: 'QualityRating' },
  { key: 'estimatedSize', label: 'Dateigröße', component: 'FileSize' },
  { key: 'compressionType', label: 'Kompression', component: 'TextValue' },
  { key: 'scalabilityType', label: 'Skalierbarkeit', component: 'TextValue' },
  { key: 'editable', label: 'Bearbeitbar', component: 'BooleanValue' },
  { key: 'canPreview', label: 'Vorschau', component: 'BooleanValue' }
])

// 方法
const selectFormat = (format: ExportFormat) => {
  selectedFormat.value = format
}

const selectPreset = (preset: QuickPreset) => {
  selectedFormat.value = preset.format
}

const handleFormatClick = (format: ExportFormat) => {
  if (comparisonMode.value) {
    toggleComparison(format)
  } else {
    selectFormat(format)
  }
}

const toggleComparisonMode = () => {
  comparisonMode.value = !comparisonMode.value
  if (!comparisonMode.value) {
    comparedFormats.value = []
  }
}

const toggleComparison = (format: ExportFormat) => {
  const index = comparedFormats.value.indexOf(format)
  if (index > -1) {
    comparedFormats.value.splice(index, 1)
  } else if (comparedFormats.value.length < props.maxComparisons) {
    comparedFormats.value.push(format)
  }
}

const clearComparison = () => {
  comparedFormats.value = []
}

const getQualityRating = (format: ExportFormat): number => {
  return formatInfoMap[format]?.qualityRating || 0
}

const getCompatibilityPlatforms = (format: ExportFormat) => {
  const platforms = [
    { name: 'Web', supported: true },
    { name: 'Mobile', supported: format !== 'excel' },
    { name: 'Print', supported: format === 'pdf' || format === 'svg' },
    { name: 'Office', supported: format === 'excel' || format === 'csv' }
  ]
  return platforms
}

const getCompressionType = (format: ExportFormat): string => {
  return formatInfoMap[format]?.compressionType || 'N/A'
}

const getScalabilityType = (format: ExportFormat): string => {
  return formatInfoMap[format]?.scalabilityType || 'N/A'
}

const isEditable = (format: ExportFormat): boolean => {
  return formatInfoMap[format]?.editable || false
}

const getComparisonValue = (format: ExportFormat, property: string): any => {
  const formatInfo = formatInfoMap[format]
  if (!formatInfo) return null

  switch (property) {
    case 'qualityRating':
      return formatInfo.qualityRating
    case 'estimatedSize':
      return formatInfo.estimatedSize
    case 'compressionType':
      return formatInfo.compressionType
    case 'scalabilityType':
      return formatInfo.scalabilityType
    case 'editable':
      return formatInfo.editable
    case 'canPreview':
      return formatInfo.canPreview
    default:
      return null
  }
}

const getFormatOptions = (format: ExportFormat): string[] => {
  const optionsMap: Record<ExportFormat, string[]> = {
    png: ['Auflösung wählen', 'Hintergrund transparent', 'Qualität anpassen'],
    svg: ['Optimierung', 'Schriften einbetten', 'Größe anpassen'],
    pdf: ['Seitenlayout', 'Metadaten', 'Kompression'],
    csv: ['Trennzeichen', 'Kodierung', 'Kopfzeilen'],
    excel: ['Arbeitsblätter', 'Formatierung', 'Diagramme']
  }
  return optionsMap[format] || []
}

const showPreview = () => {
  if (selectedFormat.value) {
    emit('preview-requested', selectedFormat.value)
  }
}

const confirmSelection = () => {
  if (selectedFormat.value) {
    emit('format-selected', selectedFormat.value)
  }
}

// 生命周期
onMounted(() => {
  // 如果没有默认格式，选择推荐格式
  if (!selectedFormat.value && availableFormats.value.length > 0) {
    const recommended = availableFormats.value.find(f => f.recommended)
    selectedFormat.value = recommended?.id || availableFormats.value[0].id
  }
})
</script>

<style scoped>
.format-card {
  min-height: 200px;
  transition: all 0.2s ease-in-out;
}

.format-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.format-grid {
  max-height: 500px;
  overflow-y: auto;
}

.export-format-selector {
  max-width: 900px;
}

.search-filter input:focus,
.search-filter select:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.format-comparison {
  animation: slideDown 0.3s ease-out;
}

.comparison-cell {
  min-height: 40px;
  display: flex;
  align-items: center;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .format-grid {
    grid-template-columns: 1fr;
  }

  .format-card {
    min-height: 160px;
  }

  .search-filter .flex-col {
    gap: 2rem;
  }
}

@media (max-width: 640px) {
  .format-comparison table {
    font-size: 0.75rem;
  }

  .format-comparison th,
  .format-comparison td {
    padding: 0.5rem 0.25rem;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .format-card {
    background-color: #1f2937;
    border-color: #374151;
  }

  .format-card:hover {
    background-color: #111827;
  }

  .selected-format-info {
    background-color: #1f2937;
  }
}
</style>
