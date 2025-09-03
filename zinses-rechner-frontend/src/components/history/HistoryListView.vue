<!--
  历史记录列表视图
  提供详细的列表展示，支持排序、筛选、批量操作
-->

<template>
  <div class="history-list-view">
    <!-- 表格头部 -->
    <div class="table-header bg-gray-50 border-b border-gray-200 px-6 py-3">
      <div class="flex items-center">
        <!-- 全选复选框 -->
        <div class="w-10 flex items-center justify-center">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isPartiallySelected"
            @change="handleSelectAll"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>

        <!-- 列标题 -->
        <div class="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div class="col-span-4">
            <button
              class="flex items-center hover:text-gray-900"
              @click="handleSort('name')"
            >
              Name
              <ChevronUpDownIcon class="w-4 h-4 ml-1" />
            </button>
          </div>
          <div class="col-span-2">
            <button
              class="flex items-center hover:text-gray-900"
              @click="handleSort('calculator')"
            >
              Rechner
              <ChevronUpDownIcon class="w-4 h-4 ml-1" />
            </button>
          </div>
          <div class="col-span-2">
            <button
              class="flex items-center hover:text-gray-900"
              @click="handleSort('date')"
            >
              Datum
              <ChevronUpDownIcon class="w-4 h-4 ml-1" />
            </button>
          </div>
          <div class="col-span-1">
            <button
              class="flex items-center hover:text-gray-900"
              @click="handleSort('quality')"
            >
              Qualität
              <ChevronUpDownIcon class="w-4 h-4 ml-1" />
            </button>
          </div>
          <div class="col-span-1">Status</div>
          <div class="col-span-2">Aktionen</div>
        </div>
      </div>
    </div>

    <!-- 表格内容 -->
    <div class="table-content">
      <div
        v-for="record in records"
        :key="record.id"
        :class="[
          'record-row border-b border-gray-100 px-6 py-4 hover:bg-gray-50 transition-colors',
          selectedRecords.includes(record.id) ? 'bg-blue-50' : ''
        ]"
      >
        <div class="flex items-center">
          <!-- 选择复选框 -->
          <div class="w-10 flex items-center justify-center">
            <input
              type="checkbox"
              :checked="selectedRecords.includes(record.id)"
              @change="handleRecordSelect(record.id, $event.target.checked)"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <!-- 记录信息 -->
          <div class="flex-1 grid grid-cols-12 gap-4 items-center">
            <!-- 名称和描述 -->
            <div class="col-span-4">
              <div class="flex items-center">
                <div class="flex-1">
                  <div class="flex items-center">
                    <h3 class="text-sm font-medium text-gray-900 truncate">
                      {{ record.calculatorName }}
                    </h3>
                    <div class="ml-2 flex items-center space-x-1">
                      <StarIcon
                        v-if="record.isFavorite"
                        class="w-4 h-4 text-yellow-500"
                      />
                      <ShareIcon
                        v-if="record.collaboration?.isShared"
                        class="w-4 h-4 text-blue-500"
                      />
                      <ChatBubbleLeftIcon
                        v-if="record.collaboration?.comments?.length > 0"
                        class="w-4 h-4 text-green-500"
                      />
                    </div>
                  </div>
                  <p v-if="record.notes" class="text-xs text-gray-600 truncate mt-1">
                    {{ record.notes }}
                  </p>
                  <div v-if="record.category || record.tags.length > 0" class="flex items-center mt-2 space-x-2">
                    <span
                      v-if="record.category"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {{ record.category }}
                    </span>
                    <span
                      v-for="tag in record.tags.slice(0, 2)"
                      :key="tag"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {{ tag }}
                    </span>
                    <span
                      v-if="record.tags.length > 2"
                      class="text-xs text-gray-500"
                    >
                      +{{ record.tags.length - 2 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 计算器类型 -->
            <div class="col-span-2">
              <div class="flex items-center">
                <component
                  :is="getCalculatorIcon(record.calculatorId)"
                  class="w-5 h-5 text-gray-400 mr-2"
                />
                <span class="text-sm text-gray-900">
                  {{ getCalculatorDisplayName(record.calculatorId) }}
                </span>
              </div>
            </div>

            <!-- 日期 -->
            <div class="col-span-2">
              <div class="text-sm text-gray-900">
                {{ formatDate(record.timestamp) }}
              </div>
              <div class="text-xs text-gray-500">
                {{ formatTime(record.timestamp) }}
              </div>
            </div>

            <!-- 质量评分 -->
            <div class="col-span-1">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                     :class="getQualityScoreClass(record.qualityScore)">
                  {{ record.qualityScore }}
                </div>
              </div>
            </div>

            <!-- 状态 -->
            <div class="col-span-1">
              <div class="flex flex-col space-y-1">
                <div class="flex items-center text-xs text-gray-500">
                  <EyeIcon class="w-3 h-3 mr-1" />
                  {{ record.analytics.viewCount }}
                </div>
                <div v-if="record.analytics.editCount > 0" class="flex items-center text-xs text-gray-500">
                  <PencilIcon class="w-3 h-3 mr-1" />
                  {{ record.analytics.editCount }}
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="col-span-2">
              <div class="flex items-center space-x-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="$emit('view', record)"
                  title="Anzeigen"
                >
                  <EyeIcon class="w-4 h-4" />
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="$emit('favorite', record.id, !record.isFavorite)"
                  :title="record.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'"
                >
                  <StarIcon
                    :class="[
                      'w-4 h-4',
                      record.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'
                    ]"
                  />
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="showRecordMenu(record, $event)"
                  title="Mehr Optionen"
                >
                  <EllipsisVerticalIcon class="w-4 h-4" />
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="records.length === 0" class="empty-state text-center py-12">
      <DocumentIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        Keine Berechnungen gefunden
      </h3>
      <p class="text-gray-600">
        Versuchen Sie andere Suchkriterien oder erstellen Sie eine neue Berechnung.
      </p>
    </div>

    <!-- 上下文菜单 -->
    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenuItems"
      @select="handleContextMenuSelect"
      @close="contextMenu.visible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronUpDownIcon,
  StarIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  DocumentIcon,
  CalculatorIcon,
  CreditCardIcon,
  HomeIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'
import type { EnhancedHistoryRecord } from '@/services/EnhancedHistoryManager'

interface Props {
  records: EnhancedHistoryRecord[]
  selectedRecords: string[]
}

interface Emits {
  (e: 'select', recordId: string, selected: boolean): void
  (e: 'view', record: EnhancedHistoryRecord): void
  (e: 'favorite', recordId: string, favorite: boolean): void
  (e: 'delete', recordId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 组件状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  record: null as EnhancedHistoryRecord | null
})

// 计算属性
const isAllSelected = computed(() => {
  return props.records.length > 0 && props.selectedRecords.length === props.records.length
})

const isPartiallySelected = computed(() => {
  return props.selectedRecords.length > 0 && props.selectedRecords.length < props.records.length
})

const contextMenuItems = computed(() => [
  { id: 'view', label: 'Anzeigen', icon: EyeIcon },
  { id: 'edit', label: 'Bearbeiten', icon: PencilIcon },
  { id: 'duplicate', label: 'Duplizieren', icon: DocumentIcon },
  { id: 'share', label: 'Teilen', icon: ShareIcon },
  { type: 'divider' },
  { id: 'export', label: 'Exportieren', icon: DocumentTextIcon },
  { type: 'divider' },
  { id: 'delete', label: 'Löschen', icon: 'trash', variant: 'danger' }
])

// 方法
const handleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  const selected = target.checked
  
  props.records.forEach(record => {
    emit('select', record.id, selected)
  })
}

const handleRecordSelect = (recordId: string, selected: boolean) => {
  emit('select', recordId, selected)
}

const handleSort = (field: string) => {
  // 实现排序逻辑
  console.log('Sort by:', field)
}

const showRecordMenu = (record: EnhancedHistoryRecord, event: MouseEvent) => {
  contextMenu.value.record = record
  contextMenu.value.x = event.clientX
  contextMenu.value.y = event.clientY
  contextMenu.value.visible = true
}

const handleContextMenuSelect = (itemId: string) => {
  const record = contextMenu.value.record
  if (!record) return

  switch (itemId) {
    case 'view':
      emit('view', record)
      break
    case 'edit':
      // 实现编辑逻辑
      break
    case 'duplicate':
      // 实现复制逻辑
      break
    case 'share':
      // 实现分享逻辑
      break
    case 'export':
      // 实现导出逻辑
      break
    case 'delete':
      emit('delete', record.id)
      break
  }

  contextMenu.value.visible = false
}

const getCalculatorIcon = (calculatorId: string) => {
  const icons = {
    'compound-interest': CalculatorIcon,
    'loan': CreditCardIcon,
    'mortgage': HomeIcon,
    'portfolio': ChartBarIcon,
    'tax-optimization': DocumentTextIcon
  }
  return icons[calculatorId as keyof typeof icons] || CalculatorIcon
}

const getCalculatorDisplayName = (calculatorId: string): string => {
  const names = {
    'compound-interest': 'Zinseszins',
    'loan': 'Kredit',
    'mortgage': 'Hypothek',
    'portfolio': 'Portfolio',
    'tax-optimization': 'Steuer'
  }
  return names[calculatorId as keyof typeof names] || calculatorId
}

const getQualityScoreClass = (score: number): string => {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800'
  if (score >= 40) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.history-list-view {
  @apply bg-white;
}

.table-header {
  @apply sticky top-0 z-10;
}

.record-row {
  @apply cursor-pointer;
}

.record-row:hover {
  @apply shadow-sm;
}

.empty-state {
  @apply border-t border-gray-200;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .record-row .grid {
    @apply grid-cols-8;
  }
  
  .record-row .col-span-4 {
    @apply col-span-3;
  }
  
  .record-row .col-span-2:nth-child(2) {
    @apply col-span-2;
  }
  
  .record-row .col-span-2:nth-child(3) {
    @apply col-span-2;
  }
  
  .record-row .col-span-1:nth-child(4),
  .record-row .col-span-1:nth-child(5) {
    @apply hidden;
  }
  
  .record-row .col-span-2:nth-child(6) {
    @apply col-span-1;
  }
}

@media (max-width: 768px) {
  .record-row .grid {
    @apply grid-cols-1 gap-2;
  }
  
  .record-row .col-span-4,
  .record-row .col-span-2,
  .record-row .col-span-1 {
    @apply col-span-1;
  }
  
  .table-header {
    @apply hidden;
  }
}
</style>
