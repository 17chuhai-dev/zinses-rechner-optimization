<!--
  实时结果保存接口
  实现用户主动保存实时计算结果的功能，包括保存触发机制、数据格式化、元数据添加和保存确认反馈
-->

<template>
  <div class="realtime-save-interface">
    <!-- 保存触发按钮 -->
    <div class="save-trigger" :class="{ 'save-available': canSave, 'save-disabled': !canSave }">
      <button
        @click="showSaveDialog"
        :disabled="!canSave || isSaving"
        class="save-button"
        :class="{ 'saving': isSaving }"
      >
        <Icon :name="isSaving ? 'loading' : 'save'" size="16" :class="{ 'animate-spin': isSaving }" />
        <span>{{ isSaving ? $t('save.saving') : $t('save.saveResult') }}</span>
      </button>
      
      <!-- 快速保存按钮 -->
      <button
        v-if="enableQuickSave"
        @click="quickSave"
        :disabled="!canSave || isSaving"
        class="quick-save-button"
        :title="$t('save.quickSave')"
      >
        <Icon name="bookmark" size="14" />
      </button>
    </div>

    <!-- 保存对话框 -->
    <div v-if="showDialog" class="save-dialog-overlay" @click="closeSaveDialog">
      <div class="save-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ $t('save.saveCalculation') }}</h3>
          <button @click="closeSaveDialog" class="close-button">
            <Icon name="x" size="20" />
          </button>
        </div>

        <div class="dialog-content">
          <!-- 基本信息 -->
          <div class="form-section">
            <label class="form-label">{{ $t('save.title') }}</label>
            <input
              v-model="saveForm.title"
              type="text"
              class="form-input"
              :placeholder="$t('save.titlePlaceholder')"
              maxlength="100"
            />
          </div>

          <div class="form-section">
            <label class="form-label">{{ $t('save.description') }}</label>
            <textarea
              v-model="saveForm.description"
              class="form-textarea"
              :placeholder="$t('save.descriptionPlaceholder')"
              rows="3"
              maxlength="500"
            ></textarea>
          </div>

          <!-- 标签 -->
          <div class="form-section">
            <label class="form-label">{{ $t('save.tags') }}</label>
            <div class="tags-input">
              <div class="tag-list">
                <span
                  v-for="tag in saveForm.tags"
                  :key="tag"
                  class="tag-item"
                >
                  {{ tag }}
                  <button @click="removeTag(tag)" class="tag-remove">
                    <Icon name="x" size="12" />
                  </button>
                </span>
              </div>
              <input
                v-model="newTag"
                @keydown.enter.prevent="addTag"
                @keydown.comma.prevent="addTag"
                type="text"
                class="tag-input"
                :placeholder="$t('save.addTag')"
                maxlength="20"
              />
            </div>
          </div>

          <!-- 选项 -->
          <div class="form-section">
            <div class="form-options">
              <label class="option-label">
                <input v-model="saveForm.isPublic" type="checkbox" class="option-checkbox" />
                {{ $t('save.makePublic') }}
                <span class="option-description">{{ $t('save.publicDescription') }}</span>
              </label>
              
              <label class="option-label">
                <input v-model="saveForm.isFavorite" type="checkbox" class="option-checkbox" />
                {{ $t('save.addToFavorites') }}
                <span class="option-description">{{ $t('save.favoriteDescription') }}</span>
              </label>
            </div>
          </div>

          <!-- 数据预览 -->
          <div class="form-section">
            <label class="form-label">{{ $t('save.dataPreview') }}</label>
            <div class="data-preview">
              <div class="preview-section">
                <h4>{{ $t('save.inputData') }}</h4>
                <div class="preview-content">
                  <div v-for="(value, key) in formattedInputData" :key="key" class="preview-item">
                    <span class="preview-key">{{ formatFieldName(key) }}:</span>
                    <span class="preview-value">{{ value }}</span>
                  </div>
                </div>
              </div>
              
              <div class="preview-section">
                <h4>{{ $t('save.outputData') }}</h4>
                <div class="preview-content">
                  <div v-for="(value, key) in formattedOutputData" :key="key" class="preview-item">
                    <span class="preview-key">{{ formatFieldName(key) }}:</span>
                    <span class="preview-value">{{ value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button @click="closeSaveDialog" class="cancel-button">
            {{ $t('save.cancel') }}
          </button>
          <button
            @click="confirmSave"
            :disabled="!isFormValid || isSaving"
            class="confirm-button"
            :class="{ 'saving': isSaving }"
          >
            <Icon :name="isSaving ? 'loading' : 'check'" size="16" :class="{ 'animate-spin': isSaving }" />
            {{ isSaving ? $t('save.saving') : $t('save.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 保存状态提示 -->
    <Transition name="notification">
      <div v-if="notification" class="save-notification" :class="`notification-${notification.type}`">
        <Icon :name="notification.type === 'success' ? 'check-circle' : 'alert-circle'" size="20" />
        <span>{{ notification.message }}</span>
        <button @click="dismissNotification" class="notification-close">
          <Icon name="x" size="16" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { historyServiceAdapter, type SaveHistoryRequest } from '@/services/HistoryServiceAdapter'
import { formatGermanCurrency, formatGermanNumber } from '@/utils/germanFormatters'
import Icon from '@/components/ui/Icon.vue'

// 保存表单接口
interface SaveForm {
  title: string
  description: string
  tags: string[]
  isPublic: boolean
  isFavorite: boolean
}

// 通知接口
interface Notification {
  type: 'success' | 'error' | 'warning'
  message: string
}

// Props定义
interface Props {
  calculatorId: string
  inputData: Record<string, any>
  outputData: Record<string, any>
  canSave?: boolean
  enableQuickSave?: boolean
  autoTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canSave: true,
  enableQuickSave: true,
  autoTitle: true
})

// Emits定义
interface Emits {
  saved: [historyId: string]
  saveError: [error: Error]
  saveStart: []
  saveComplete: []
}

const emit = defineEmits<Emits>()

// 响应式数据
const showDialog = ref(false)
const isSaving = ref(false)
const newTag = ref('')
const notification = ref<Notification | null>(null)

const saveForm = ref<SaveForm>({
  title: '',
  description: '',
  tags: [],
  isPublic: false,
  isFavorite: false
})

// 计算属性
const isFormValid = computed(() => {
  return saveForm.value.title.trim().length > 0
})

const formattedInputData = computed(() => {
  const formatted: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(props.inputData)) {
    if (value !== null && value !== undefined && value !== '') {
      formatted[key] = formatValue(value, key)
    }
  }
  
  return formatted
})

const formattedOutputData = computed(() => {
  const formatted: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(props.outputData)) {
    if (value !== null && value !== undefined && value !== '') {
      formatted[key] = formatValue(value, key)
    }
  }
  
  return formatted
})

// 方法
const showSaveDialog = () => {
  if (!props.canSave) return
  
  // 初始化表单
  initializeSaveForm()
  showDialog.value = true
  
  // 聚焦到标题输入框
  nextTick(() => {
    const titleInput = document.querySelector('.form-input') as HTMLInputElement
    if (titleInput) {
      titleInput.focus()
    }
  })
}

const closeSaveDialog = () => {
  showDialog.value = false
  resetSaveForm()
}

const initializeSaveForm = () => {
  if (props.autoTitle) {
    saveForm.value.title = generateAutoTitle()
  }
  
  saveForm.value.description = ''
  saveForm.value.tags = generateAutoTags()
  saveForm.value.isPublic = false
  saveForm.value.isFavorite = false
}

const resetSaveForm = () => {
  saveForm.value = {
    title: '',
    description: '',
    tags: [],
    isPublic: false,
    isFavorite: false
  }
  newTag.value = ''
}

const addTag = () => {
  const tag = newTag.value.trim().toLowerCase()
  
  if (tag && !saveForm.value.tags.includes(tag) && saveForm.value.tags.length < 10) {
    saveForm.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = saveForm.value.tags.indexOf(tag)
  if (index > -1) {
    saveForm.value.tags.splice(index, 1)
  }
}

const quickSave = async () => {
  if (!props.canSave || isSaving.value) return
  
  try {
    isSaving.value = true
    emit('saveStart')
    
    const request = createSaveRequest({
      title: generateAutoTitle(),
      description: '',
      tags: generateAutoTags(),
      isPublic: false,
      isFavorite: false
    })
    
    const result = await historyServiceAdapter.saveHistory(request)
    
    showNotification('success', '计算结果已快速保存')
    emit('saved', result.id)
    
  } catch (error) {
    console.error('快速保存失败:', error)
    showNotification('error', '快速保存失败，请重试')
    emit('saveError', error as Error)
  } finally {
    isSaving.value = false
    emit('saveComplete')
  }
}

const confirmSave = async () => {
  if (!isFormValid.value || isSaving.value) return
  
  try {
    isSaving.value = true
    emit('saveStart')
    
    const request = createSaveRequest(saveForm.value)
    const result = await historyServiceAdapter.saveHistory(request)
    
    showNotification('success', '计算结果已成功保存')
    emit('saved', result.id)
    closeSaveDialog()
    
  } catch (error) {
    console.error('保存失败:', error)
    showNotification('error', '保存失败，请重试')
    emit('saveError', error as Error)
  } finally {
    isSaving.value = false
    emit('saveComplete')
  }
}

const createSaveRequest = (form: SaveForm): SaveHistoryRequest => {
  return historyServiceAdapter.createHistoryFromRealtimeResult(
    props.calculatorId,
    props.inputData,
    props.outputData,
    {
      title: form.title,
      description: form.description,
      tags: form.tags,
      isPublic: form.isPublic,
      isFavorite: form.isFavorite
    }
  )
}

const generateAutoTitle = (): string => {
  const calculatorNames: Record<string, string> = {
    'compound-interest': 'Zinseszins-Berechnung',
    'savings-plan': 'Sparplan-Berechnung',
    'loan': 'Kredit-Berechnung',
    'mortgage': 'Hypotheken-Berechnung',
    'retirement': 'Altersvorsorge-Berechnung',
    'portfolio': 'Portfolio-Berechnung',
    'tax-optimization': 'Steueroptimierung',
    'etf-savings-plan': 'ETF-Sparplan-Berechnung'
  }
  
  const baseName = calculatorNames[props.calculatorId] || 'Finanz-Berechnung'
  const timestamp = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return `${baseName} - ${timestamp}`
}

const generateAutoTags = (): string[] => {
  const tags = [props.calculatorId]
  
  // 根据输入数据添加相关标签
  if (props.inputData.principal && props.inputData.principal > 100000) {
    tags.push('high-amount')
  }
  
  if (props.inputData.years && props.inputData.years > 20) {
    tags.push('long-term')
  }
  
  if (props.inputData.monthlyPayment && props.inputData.monthlyPayment > 0) {
    tags.push('monthly-payment')
  }
  
  return tags
}

const formatValue = (value: any, key: string): string => {
  if (typeof value === 'number') {
    // 货币字段
    if (key.includes('amount') || key.includes('balance') || key.includes('payment') || key.includes('interest')) {
      return formatGermanCurrency(value)
    }
    
    // 百分比字段
    if (key.includes('rate') || key.includes('percent')) {
      return `${formatGermanNumber(value)}%`
    }
    
    // 年份字段
    if (key.includes('year') || key.includes('age')) {
      return `${value} Jahre`
    }
    
    // 普通数字
    return formatGermanNumber(value)
  }
  
  return String(value)
}

const formatFieldName = (key: string): string => {
  const fieldNames: Record<string, string> = {
    principal: 'Startkapital',
    monthlyPayment: 'Monatliche Rate',
    annualRate: 'Zinssatz',
    years: 'Laufzeit',
    finalAmount: 'Endkapital',
    totalInterest: 'Gesamtzinsen',
    totalContributions: 'Gesamteinzahlungen',
    effectiveRate: 'Effektiver Zinssatz'
  }
  
  return fieldNames[key] || key
}

const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
  notification.value = { type, message }
  
  // 自动隐藏成功通知
  if (type === 'success') {
    setTimeout(() => {
      notification.value = null
    }, 3000)
  }
}

const dismissNotification = () => {
  notification.value = null
}

// 监听器
watch(() => props.canSave, (newValue) => {
  if (!newValue && showDialog.value) {
    closeSaveDialog()
  }
})

// 键盘快捷键
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 's' && props.canSave && !isSaving.value) {
    event.preventDefault()
    if (props.enableQuickSave) {
      quickSave()
    } else {
      showSaveDialog()
    }
  }
  
  if (event.key === 'Escape' && showDialog.value) {
    closeSaveDialog()
  }
})
</script>

<style scoped>
.realtime-save-interface {
  position: relative;
}

.save-trigger {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.save-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md;
  @apply bg-blue-600 text-white hover:bg-blue-700;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  transition: all 0.2s ease;
}

.save-button.saving {
  @apply bg-blue-500 cursor-wait;
}

.quick-save-button {
  @apply p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.save-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  @apply bg-black bg-opacity-50 flex items-center justify-center;
  z-index: 1000;
}

.save-dialog {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
}

.dialog-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.dialog-header h3 {
  @apply text-lg font-semibold text-gray-900;
  margin: 0;
}

.close-button {
  @apply p-1 text-gray-400 hover:text-gray-600 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.dialog-content {
  @apply p-6 space-y-6;
}

.form-section {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md resize-none;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.tags-input {
  @apply border border-gray-300 rounded-md p-2 min-h-[2.5rem];
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag-item {
  @apply inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md;
}

.tag-remove {
  @apply text-blue-600 hover:text-blue-800 focus:outline-none;
}

.tag-input {
  @apply border-none outline-none flex-1 min-w-[120px];
}

.form-options {
  @apply space-y-3;
}

.option-label {
  @apply flex items-start gap-3 cursor-pointer;
}

.option-checkbox {
  @apply mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}

.option-description {
  @apply block text-xs text-gray-500 mt-1;
}

.data-preview {
  @apply bg-gray-50 rounded-md p-4 space-y-4;
}

.preview-section h4 {
  @apply text-sm font-medium text-gray-900 mb-2;
  margin: 0;
}

.preview-content {
  @apply space-y-1;
}

.preview-item {
  @apply flex justify-between text-sm;
}

.preview-key {
  @apply text-gray-600;
}

.preview-value {
  @apply text-gray-900 font-medium;
}

.dialog-footer {
  @apply flex items-center justify-end gap-3 p-6 border-t border-gray-200;
}

.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md;
  @apply hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.confirm-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.confirm-button.saving {
  @apply bg-blue-500 cursor-wait;
}

.save-notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  @apply flex items-center gap-3 px-4 py-3 rounded-md shadow-lg;
  z-index: 1100;
}

.notification-success {
  @apply bg-green-50 text-green-800 border border-green-200;
}

.notification-error {
  @apply bg-red-50 text-red-800 border border-red-200;
}

.notification-warning {
  @apply bg-yellow-50 text-yellow-800 border border-yellow-200;
}

.notification-close {
  @apply text-current opacity-70 hover:opacity-100 focus:outline-none;
}

/* 动画效果 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .save-dialog {
    @apply mx-2 max-h-[90vh];
  }
  
  .dialog-content {
    @apply p-4 space-y-4;
  }
  
  .dialog-header,
  .dialog-footer {
    @apply p-4;
  }
  
  .save-notification {
    @apply left-1rem right-1rem top-1rem;
  }
}
</style>
