<!--
  页面SEO编辑模态框组件
  提供单个页面SEO数据编辑界面
-->

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 模态框标题 -->
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t('seo.editPageSEO') }}
        </h3>
        <button
          @click="$emit('close')"
          class="close-button"
          :aria-label="t('common.close')"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-content">
        <form @submit.prevent="submitPageSEO">
          <!-- 页面路径 -->
          <div class="field-section mb-6">
            <label class="field-label">
              {{ t('seo.pagePath') }}
            </label>
            <input
              v-model="localData.url"
              type="text"
              class="field-input"
              :placeholder="t('seo.pagePathPlaceholder')"
              readonly
            />
          </div>

          <!-- 页面标题 -->
          <div class="field-section mb-6">
            <label class="field-label" for="title">
              {{ t('seo.pageTitle') }}
            </label>
            <input
              id="title"
              v-model="localData.title"
              type="text"
              class="field-input"
              :placeholder="t('seo.pageTitlePlaceholder')"
              maxlength="60"
              required
            />
            <div class="field-meta flex justify-between">
              <div class="character-count" :class="getTitleLengthClasses()">
                {{ localData.title.length }}/60
              </div>
              <div class="length-status" :class="getTitleLengthClasses()">
                {{ getTitleLengthStatus() }}
              </div>
            </div>
          </div>

          <!-- 页面描述 -->
          <div class="field-section mb-6">
            <label class="field-label" for="description">
              {{ t('seo.pageDescription') }}
            </label>
            <textarea
              id="description"
              v-model="localData.description"
              class="field-textarea"
              :placeholder="t('seo.pageDescriptionPlaceholder')"
              rows="3"
              maxlength="160"
              required
            ></textarea>
            <div class="field-meta flex justify-between">
              <div class="character-count" :class="getDescriptionLengthClasses()">
                {{ localData.description.length }}/160
              </div>
              <div class="length-status" :class="getDescriptionLengthClasses()">
                {{ getDescriptionLengthStatus() }}
              </div>
            </div>
          </div>

          <!-- 关键词 -->
          <div class="field-section mb-6">
            <label class="field-label" for="keywords">
              {{ t('seo.keywords') }}
            </label>
            <div class="keywords-input-group">
              <input
                v-model="newKeyword"
                type="text"
                class="keyword-input"
                :placeholder="t('seo.keywordPlaceholder')"
                @keydown.enter.prevent="addKeyword"
                @keydown.comma.prevent="addKeyword"
              />
              <button
                type="button"
                @click="addKeyword"
                :disabled="!newKeyword.trim()"
                class="add-keyword-button"
              >
                <PlusIcon class="w-4 h-4" />
              </button>
            </div>
            
            <!-- 关键词列表 -->
            <div v-if="localData.keywords.length > 0" class="keywords-list mt-3">
              <div
                v-for="(keyword, index) in localData.keywords"
                :key="index"
                class="keyword-item"
              >
                <span class="keyword-text">{{ keyword }}</span>
                <button
                  type="button"
                  @click="removeKeyword(index)"
                  class="remove-keyword-button"
                >
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </div>
            </div>
            
            <p class="field-description">
              {{ t('seo.keywordsDescription') }}
            </p>
          </div>

          <!-- 页面类型 -->
          <div class="field-section mb-6">
            <label class="field-label">
              {{ t('seo.pageType') }}
            </label>
            <div class="page-types grid grid-cols-2 md:grid-cols-4 gap-3">
              <label
                v-for="type in pageTypes"
                :key="type.value"
                class="page-type-label"
                :class="{ 'selected': localData.type === type.value }"
              >
                <input
                  v-model="localData.type"
                  type="radio"
                  :value="type.value"
                  class="page-type-radio"
                />
                <div class="page-type-content">
                  <component :is="type.icon" class="w-5 h-5 text-blue-500" />
                  <span class="page-type-text">{{ type.label }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Open Graph 图片 -->
          <div class="field-section mb-6">
            <label class="field-label" for="image">
              {{ t('seo.ogImage') }}
              <span class="optional-label">({{ t('common.optional') }})</span>
            </label>
            <input
              id="image"
              v-model="localData.image"
              type="url"
              class="field-input"
              :placeholder="t('seo.ogImagePlaceholder')"
            />
            <p class="field-description">
              {{ t('seo.ogImageDescription') }}
            </p>
          </div>

          <!-- 作者信息 -->
          <div class="field-section mb-6">
            <label class="field-label" for="author">
              {{ t('seo.author') }}
              <span class="optional-label">({{ t('common.optional') }})</span>
            </label>
            <input
              id="author"
              v-model="localData.author"
              type="text"
              class="field-input"
              :placeholder="t('seo.authorPlaceholder')"
            />
          </div>

          <!-- 发布和修改时间 -->
          <div class="field-section mb-6">
            <div class="time-fields grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="field-label" for="publishedTime">
                  {{ t('seo.publishedTime') }}
                  <span class="optional-label">({{ t('common.optional') }})</span>
                </label>
                <input
                  id="publishedTime"
                  v-model="publishedTimeString"
                  type="datetime-local"
                  class="field-input"
                />
              </div>
              
              <div>
                <label class="field-label" for="modifiedTime">
                  {{ t('seo.modifiedTime') }}
                  <span class="optional-label">({{ t('common.optional') }})</span>
                </label>
                <input
                  id="modifiedTime"
                  v-model="modifiedTimeString"
                  type="datetime-local"
                  class="field-input"
                />
              </div>
            </div>
          </div>

          <!-- 计算器特定数据 -->
          <div v-if="localData.type === 'calculator'" class="field-section mb-6">
            <h4 class="subsection-title">{{ t('seo.calculatorData') }}</h4>
            
            <div class="calculator-fields space-y-4">
              <div>
                <label class="field-label" for="calculationType">
                  {{ t('seo.calculationType') }}
                </label>
                <select
                  id="calculationType"
                  v-model="calculatorType"
                  class="field-select"
                >
                  <option value="interest">{{ t('seo.interestCalculator') }}</option>
                  <option value="compound">{{ t('seo.compoundInterestCalculator') }}</option>
                  <option value="loan">{{ t('seo.loanCalculator') }}</option>
                  <option value="investment">{{ t('seo.investmentCalculator') }}</option>
                </select>
              </div>
              
              <div>
                <label class="field-label" for="complexity">
                  {{ t('seo.complexity') }}
                </label>
                <select
                  id="complexity"
                  v-model="calculatorComplexity"
                  class="field-select"
                >
                  <option value="simple">{{ t('seo.simple') }}</option>
                  <option value="intermediate">{{ t('seo.intermediate') }}</option>
                  <option value="advanced">{{ t('seo.advanced') }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- SEO预览 -->
          <div class="field-section mb-6">
            <h4 class="subsection-title">{{ t('seo.preview') }}</h4>
            
            <div class="seo-preview bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div class="preview-title text-blue-600 dark:text-blue-400 text-lg font-medium mb-1">
                {{ localData.title || t('seo.noTitle') }}
              </div>
              <div class="preview-url text-green-600 dark:text-green-400 text-sm mb-2">
                {{ localData.url || window.location.origin + pagePath }}
              </div>
              <div class="preview-description text-gray-700 dark:text-gray-300 text-sm">
                {{ localData.description || t('seo.noDescription') }}
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="modal-actions">
            <button
              type="button"
              @click="resetToDefaults"
              class="reset-button"
            >
              {{ t('seo.resetDefaults') }}
            </button>
            
            <div class="action-buttons">
              <button
                type="button"
                @click="$emit('close')"
                class="cancel-button"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="!isValid"
                class="submit-button"
              >
                {{ t('seo.saveChanges') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { 
  XMarkIcon, 
  PlusIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  NewspaperIcon,
  CalculatorIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '@/services/I18nService'
import type { PageSEOData } from '@/services/SEOManager'

// Props
interface Props {
  pagePath: string
  pageData?: PageSEOData | null
}

const props = defineProps<Props>()

// Emits
interface Emits {
  'close': []
  'update': [path: string, data: PageSEOData]
}

const emit = defineEmits<Emits>()

// 使用i18n
const { t } = useI18n()

// 响应式状态
const newKeyword = ref('')
const calculatorType = ref('interest')
const calculatorComplexity = ref<'simple' | 'intermediate' | 'advanced'>('simple')

// 本地数据
const localData = reactive<PageSEOData>({
  title: '',
  description: '',
  keywords: [],
  type: 'website',
  url: props.pagePath,
  image: '',
  author: '',
  publishedTime: undefined,
  modifiedTime: undefined
})

// 时间字符串（用于datetime-local输入）
const publishedTimeString = ref('')
const modifiedTimeString = ref('')

// 页面类型选项
const pageTypes = [
  {
    value: 'website',
    label: t('seo.website'),
    icon: GlobeAltIcon
  },
  {
    value: 'article',
    label: t('seo.article'),
    icon: NewspaperIcon
  },
  {
    value: 'calculator',
    label: t('seo.calculator'),
    icon: CalculatorIcon
  },
  {
    value: 'product',
    label: t('seo.product'),
    icon: DocumentTextIcon
  }
]

// 计算属性
const isValid = computed(() => {
  return localData.title.trim().length > 0 && 
         localData.description.trim().length > 0 &&
         localData.title.length <= 60 &&
         localData.description.length <= 160
})

// 方法
const getTitleLengthClasses = (): string[] => {
  const length = localData.title.length
  const classes = ['text-xs', 'font-medium']
  
  if (length < 30 || length > 60) {
    classes.push('text-red-600', 'dark:text-red-400')
  } else if (length < 40 || length > 55) {
    classes.push('text-yellow-600', 'dark:text-yellow-400')
  } else {
    classes.push('text-green-600', 'dark:text-green-400')
  }
  
  return classes
}

const getDescriptionLengthClasses = (): string[] => {
  const length = localData.description.length
  const classes = ['text-xs', 'font-medium']
  
  if (length < 120 || length > 160) {
    classes.push('text-red-600', 'dark:text-red-400')
  } else if (length < 140 || length > 155) {
    classes.push('text-yellow-600', 'dark:text-yellow-400')
  } else {
    classes.push('text-green-600', 'dark:text-green-400')
  }
  
  return classes
}

const getTitleLengthStatus = (): string => {
  const length = localData.title.length
  if (length < 30) return t('seo.tooShort')
  if (length > 60) return t('seo.tooLong')
  if (length < 40 || length > 55) return t('seo.couldBeOptimized')
  return t('seo.optimal')
}

const getDescriptionLengthStatus = (): string => {
  const length = localData.description.length
  if (length < 120) return t('seo.tooShort')
  if (length > 160) return t('seo.tooLong')
  if (length < 140 || length > 155) return t('seo.couldBeOptimized')
  return t('seo.optimal')
}

const addKeyword = (): void => {
  const keyword = newKeyword.value.trim().toLowerCase()
  if (keyword && !localData.keywords.includes(keyword) && localData.keywords.length < 10) {
    localData.keywords.push(keyword)
    newKeyword.value = ''
  }
}

const removeKeyword = (index: number): void => {
  localData.keywords.splice(index, 1)
}

const resetToDefaults = (): void => {
  if (confirm(t('seo.confirmReset'))) {
    // 重置为默认值或原始数据
    if (props.pageData) {
      Object.assign(localData, props.pageData)
    } else {
      Object.assign(localData, {
        title: '',
        description: '',
        keywords: [],
        type: 'website',
        url: props.pagePath,
        image: '',
        author: ''
      })
    }
  }
}

const handleOverlayClick = (): void => {
  emit('close')
}

const submitPageSEO = (): void => {
  if (!isValid.value) return
  
  // 构建完整的SEO数据
  const seoData: PageSEOData = {
    ...localData,
    publishedTime: publishedTimeString.value ? new Date(publishedTimeString.value) : undefined,
    modifiedTime: modifiedTimeString.value ? new Date(modifiedTimeString.value) : undefined
  }
  
  // 如果是计算器类型，添加计算器数据
  if (localData.type === 'calculator') {
    seoData.calculatorData = {
      inputParameters: ['Kapital', 'Zinssatz', 'Laufzeit'],
      outputResults: ['Zinsen', 'Endkapital', 'Gesamtrendite'],
      calculationType: calculatorType.value,
      complexity: calculatorComplexity.value
    }
  }
  
  emit('update', props.pagePath, seoData)
}

// 监听时间变化
watch([publishedTimeString, modifiedTimeString], ([published, modified]) => {
  if (published) {
    localData.publishedTime = new Date(published)
  }
  if (modified) {
    localData.modifiedTime = new Date(modified)
  }
})

// 生命周期
onMounted(() => {
  // 加载现有数据
  if (props.pageData) {
    Object.assign(localData, props.pageData)
    
    // 设置时间字符串
    if (props.pageData.publishedTime) {
      publishedTimeString.value = props.pageData.publishedTime.toISOString().slice(0, 16)
    }
    if (props.pageData.modifiedTime) {
      modifiedTimeString.value = props.pageData.modifiedTime.toISOString().slice(0, 16)
    }
    
    // 设置计算器数据
    if (props.pageData.calculatorData) {
      calculatorType.value = props.pageData.calculatorData.calculationType
      calculatorComplexity.value = props.pageData.calculatorData.complexity
    }
  } else {
    // 设置默认值
    localData.url = props.pagePath
    localData.modifiedTime = new Date()
    modifiedTimeString.value = new Date().toISOString().slice(0, 16)
  }
})
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors duration-200;
}

.modal-content {
  @apply p-6;
}

.field-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.optional-label {
  @apply text-xs text-gray-500 dark:text-gray-500 font-normal;
}

.field-input,
.field-textarea,
.field-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.field-textarea {
  @apply resize-none;
}

.field-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-2;
}

.field-meta {
  @apply mt-1;
}

.character-count {
  @apply text-xs;
}

.keywords-input-group {
  @apply flex space-x-2;
}

.keyword-input {
  @apply flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.add-keyword-button {
  @apply px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.keywords-list {
  @apply flex flex-wrap gap-2;
}

.keyword-item {
  @apply flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm;
}

.keyword-text {
  @apply font-medium;
}

.remove-keyword-button {
  @apply text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 rounded-full p-0.5;
}

.page-type-label {
  @apply relative p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600;
}

.page-type-label.selected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.page-type-radio {
  @apply absolute top-2 right-2 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2;
}

.page-type-content {
  @apply flex flex-col items-center space-y-2;
}

.page-type-text {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.subsection-title {
  @apply text-md font-medium text-gray-900 dark:text-white mb-4;
}

.seo-preview {
  @apply border border-gray-200 dark:border-gray-700;
}

.preview-title {
  @apply truncate;
}

.preview-url {
  @apply truncate;
}

.preview-description {
  @apply line-clamp-2;
}

.modal-actions {
  @apply flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700;
}

.action-buttons {
  @apply flex items-center space-x-3;
}

.reset-button {
  @apply px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500;
}

.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

.submit-button {
  @apply px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .modal-container {
    @apply max-w-full m-2;
  }
  
  .page-types {
    @apply grid-cols-1;
  }
  
  .time-fields {
    @apply grid-cols-1;
  }
  
  .modal-actions {
    @apply flex-col space-y-3;
  }
  
  .action-buttons {
    @apply w-full justify-between;
  }
}

/* 高对比度模式支持 */
:global(.high-contrast) .modal-container {
  @apply border-2 border-current;
}

/* 动画 */
.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  animation: slideIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
