<!--
  税收帮助系统组件
  提供德国税收法规的帮助文档、上下文相关的帮助提示和智能引导
-->

<template>
  <div class="tax-help-system">
    <!-- 帮助触发按钮 -->
    <button
      v-if="!isExpanded"
      @click="toggleHelp"
      class="help-trigger"
      :title="'Hilfe anzeigen'"
    >
      <Icon name="help-circle" size="24" />
    </button>

    <!-- 帮助面板 -->
    <div v-if="isExpanded" class="help-panel" :class="panelPosition">
      <!-- 帮助头部 -->
      <div class="help-header">
        <h3 class="help-title">Steuer-Hilfe</h3>
        <div class="help-actions">
          <button
            @click="toggleSearchMode"
            class="help-action-btn"
            :class="{ active: showSearch }"
            :title="'Suchen'"
          >
            <Icon name="search" size="16" />
          </button>
          <button
            @click="toggleHelp"
            class="help-action-btn"
            :title="'Schließen'"
          >
            <Icon name="x" size="16" />
          </button>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div v-if="showSearch" class="help-search">
        <div class="search-input-group">
          <Icon name="search" size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            @input="performSearch"
            type="text"
            placeholder="Steuer-Themen durchsuchen..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="search-clear"
          >
            <Icon name="x" size="14" />
          </button>
        </div>
      </div>

      <!-- 帮助内容区域 -->
      <div class="help-content">
        <!-- 搜索结果 -->
        <div v-if="showSearch && searchResults.length > 0" class="search-results">
          <h4 class="section-title">Suchergebnisse ({{ searchResults.length }})</h4>
          <div class="help-items">
            <div
              v-for="item in searchResults"
              :key="item.id"
              @click="selectHelpItem(item)"
              class="help-item"
              :class="{ active: selectedItem?.id === item.id }"
            >
              <div class="item-header">
                <h5 class="item-title">{{ item.title }}</h5>
                <div class="item-meta">
                  <span class="item-difficulty" :class="`difficulty-${item.difficulty}`">
                    {{ getDifficultyLabel(item.difficulty) }}
                  </span>
                  <span class="item-reading-time">{{ item.readingTime }} Min.</span>
                </div>
              </div>
              <div class="item-tags">
                <span
                  v-for="tag in item.tags.slice(0, 3)"
                  :key="tag"
                  class="item-tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 无搜索结果 -->
        <div v-else-if="showSearch && searchQuery && searchResults.length === 0" class="no-results">
          <Icon name="search" size="48" class="no-results-icon" />
          <h4>Keine Ergebnisse gefunden</h4>
          <p>Versuchen Sie andere Suchbegriffe oder durchstöbern Sie die Kategorien.</p>
        </div>

        <!-- 分类浏览 -->
        <div v-else-if="!selectedItem" class="help-categories">
          <!-- 个性化推荐 -->
          <div v-if="personalizedHelp.length > 0" class="help-section">
            <h4 class="section-title">
              <Icon name="user" size="16" />
              Für Sie empfohlen
            </h4>
            <div class="help-items">
              <div
                v-for="item in personalizedHelp"
                :key="item.id"
                @click="selectHelpItem(item)"
                class="help-item recommended"
              >
                <h5 class="item-title">{{ item.title }}</h5>
                <div class="item-meta">
                  <span class="item-reading-time">{{ item.readingTime }} Min.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 热门FAQ -->
          <div class="help-section">
            <h4 class="section-title">
              <Icon name="message-circle" size="16" />
              Häufige Fragen
            </h4>
            <div class="faq-items">
              <div
                v-for="faq in popularFAQ"
                :key="faq.id"
                @click="selectFAQItem(faq)"
                class="faq-item"
              >
                <h5 class="faq-question">{{ faq.question }}</h5>
                <p class="faq-preview">{{ truncateText(faq.answer, 100) }}</p>
              </div>
            </div>
          </div>

          <!-- 计算示例 -->
          <div class="help-section">
            <h4 class="section-title">
              <Icon name="calculator" size="16" />
              Berechnungsbeispiele
            </h4>
            <div class="example-items">
              <div
                v-for="example in calculationExamples"
                :key="example.id"
                @click="selectCalculationExample(example)"
                class="example-item"
              >
                <h5 class="example-title">{{ example.title }}</h5>
                <p class="example-description">{{ example.description }}</p>
                <div class="example-scenario">
                  <Icon name="info" size="14" />
                  {{ example.scenario }}
                </div>
              </div>
            </div>
          </div>

          <!-- 主要类别 -->
          <div class="help-section">
            <h4 class="section-title">
              <Icon name="book-open" size="16" />
              Alle Themen
            </h4>
            <div class="category-grid">
              <div
                v-for="category in mainCategories"
                :key="category.key"
                @click="selectCategory(category.key)"
                class="category-card"
              >
                <Icon :name="category.icon" size="24" class="category-icon" />
                <h5 class="category-title">{{ category.title }}</h5>
                <p class="category-description">{{ category.description }}</p>
                <span class="category-count">{{ category.count }} Artikel</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 选中的帮助内容 -->
        <div v-else-if="selectedItem" class="selected-content">
          <div class="content-header">
            <button @click="goBack" class="back-button">
              <Icon name="arrow-left" size="16" />
              Zurück
            </button>
            <div class="content-meta">
              <span class="content-difficulty" :class="`difficulty-${selectedItem.difficulty}`">
                {{ getDifficultyLabel(selectedItem.difficulty) }}
              </span>
              <span class="content-reading-time">{{ selectedItem.readingTime }} Min. Lesezeit</span>
            </div>
          </div>

          <h3 class="content-title">{{ selectedItem.title }}</h3>

          <div class="content-tags">
            <span
              v-for="tag in selectedItem.tags"
              :key="tag"
              class="content-tag"
            >
              {{ tag }}
            </span>
          </div>

          <div class="content-body" v-html="selectedItem.content"></div>

          <div class="content-footer">
            <p class="content-updated">
              Zuletzt aktualisiert: {{ formatDate(selectedItem.lastUpdated) }}
            </p>
            <div class="content-actions">
              <button @click="shareContent" class="content-action-btn">
                <Icon name="share-2" size="16" />
                Teilen
              </button>
              <button @click="printContent" class="content-action-btn">
                <Icon name="printer" size="16" />
                Drucken
              </button>
            </div>
          </div>
        </div>

        <!-- 选中的FAQ -->
        <div v-else-if="selectedFAQ" class="selected-faq">
          <div class="content-header">
            <button @click="goBack" class="back-button">
              <Icon name="arrow-left" size="16" />
              Zurück
            </button>
          </div>

          <h3 class="faq-question-title">{{ selectedFAQ.question }}</h3>
          <div class="faq-answer" v-html="selectedFAQ.answer"></div>

          <div v-if="selectedFAQ.relatedTopics.length > 0" class="related-topics">
            <h4>Verwandte Themen:</h4>
            <div class="related-tags">
              <span
                v-for="topic in selectedFAQ.relatedTopics"
                :key="topic"
                @click="searchRelatedTopic(topic)"
                class="related-tag"
              >
                {{ topic }}
              </span>
            </div>
          </div>
        </div>

        <!-- 选中的计算示例 -->
        <div v-else-if="selectedExample" class="selected-example">
          <div class="content-header">
            <button @click="goBack" class="back-button">
              <Icon name="arrow-left" size="16" />
              Zurück
            </button>
          </div>

          <h3 class="example-title-full">{{ selectedExample.title }}</h3>
          <p class="example-description-full">{{ selectedExample.description }}</p>

          <div class="example-scenario-full">
            <h4>Szenario:</h4>
            <p>{{ selectedExample.scenario }}</p>
          </div>

          <div class="calculation-steps">
            <h4>Berechnungsschritte:</h4>
            <div
              v-for="step in selectedExample.steps"
              :key="step.step"
              class="calculation-step"
            >
              <div class="step-number">{{ step.step }}</div>
              <div class="step-content">
                <h5 class="step-description">{{ step.description }}</h5>
                <div class="step-formula">{{ step.formula }}</div>
                <div class="step-calculation">{{ step.calculation }} = {{ formatCurrency(step.result) }}</div>
                <p class="step-explanation">{{ step.explanation }}</p>
              </div>
            </div>
          </div>

          <div class="example-result">
            <h4>Ergebnis:</h4>
            <div class="result-summary">
              <div class="result-item">
                <span class="result-label">Gesamtsteuer:</span>
                <span class="result-value">{{ formatCurrency(selectedExample.result.totalTax) }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Nettoeinkommen:</span>
                <span class="result-value">{{ formatCurrency(selectedExample.result.netIncome) }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Effektive Steuerrate:</span>
                <span class="result-value">{{ selectedExample.result.effectiveTaxRate.toFixed(2) }}%</span>
              </div>
            </div>
            <p class="result-explanation">{{ selectedExample.explanation }}</p>
          </div>

          <div v-if="selectedExample.tips.length > 0" class="example-tips">
            <h4>Tipps:</h4>
            <ul class="tips-list">
              <li v-for="tip in selectedExample.tips" :key="tip">{{ tip }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 上下文帮助气泡 -->
    <div
      v-if="contextualHelp && !isExpanded"
      class="contextual-help"
      :style="contextualHelpPosition"
    >
      <div class="contextual-help-content">
        <h4 class="contextual-help-title">{{ contextualHelp.title }}</h4>
        <p class="contextual-help-text">{{ contextualHelp.content }}</p>
        <div v-if="contextualHelp.actions" class="contextual-help-actions">
          <button
            v-for="action in contextualHelp.actions"
            :key="action.label"
            @click="executeHelpAction(action)"
            class="contextual-help-action"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
      <button @click="dismissContextualHelp" class="contextual-help-close">
        <Icon name="x" size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  taxHelpService,
  HelpContent,
  HelpCategory,
  ContextualHelp,
  CalculationExample,
  FAQItem,
  HelpAction
} from '@/services/TaxHelpService'
import { TaxSettings } from '@/types/GermanTaxTypes'
import Icon from '@/components/ui/Icon.vue'

// Props定义
interface Props {
  context?: string
  position?: 'right' | 'left' | 'bottom'
  userSettings?: TaxSettings
  autoShow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'right',
  autoShow: false
})

// Emits定义
interface Emits {
  helpShown: []
  helpHidden: []
  actionExecuted: [action: HelpAction]
}

const emit = defineEmits<Emits>()

// 响应式数据
const isExpanded = ref(false)
const showSearch = ref(false)
const searchQuery = ref('')
const searchResults = ref<HelpContent[]>([])
const selectedItem = ref<HelpContent | null>(null)
const selectedFAQ = ref<FAQItem | null>(null)
const selectedExample = ref<CalculationExample | null>(null)
const contextualHelp = ref<ContextualHelp | null>(null)
const contextualHelpPosition = ref<Record<string, string>>({})

// 计算属性
const panelPosition = computed(() => `help-panel-${props.position}`)

const personalizedHelp = computed(() => {
  if (props.userSettings) {
    return taxHelpService.getPersonalizedHelp(props.userSettings)
  }
  return []
})

const popularFAQ = computed(() => {
  return taxHelpService.getPopularFAQ(5)
})

const calculationExamples = computed(() => {
  return taxHelpService.getAllCalculationExamples().slice(0, 3)
})

const mainCategories = computed(() => [
  {
    key: HelpCategory.BASICS,
    title: 'Grundlagen',
    description: 'Grundlegende Konzepte der Kapitalertragsbesteuerung',
    icon: 'book',
    count: taxHelpService.getHelpByCategory(HelpCategory.BASICS).length
  },
  {
    key: HelpCategory.ABGELTUNGSSTEUER,
    title: 'Abgeltungssteuer',
    description: 'Alles über die 25% Abgeltungssteuer',
    icon: 'percent',
    count: taxHelpService.getHelpByCategory(HelpCategory.ABGELTUNGSSTEUER).length
  },
  {
    key: HelpCategory.FREISTELLUNGSAUFTRAG,
    title: 'Freistellungsauftrag',
    description: 'Freibetrag optimal nutzen',
    icon: 'shield',
    count: taxHelpService.getHelpByCategory(HelpCategory.FREISTELLUNGSAUFTRAG).length
  },
  {
    key: HelpCategory.ETF_TEILFREISTELLUNG,
    title: 'ETF Teilfreistellung',
    description: 'Steuervorteile bei ETF-Investments',
    icon: 'trending-up',
    count: taxHelpService.getHelpByCategory(HelpCategory.ETF_TEILFREISTELLUNG).length
  }
])

// 方法
const toggleHelp = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    emit('helpShown')
  } else {
    emit('helpHidden')
    resetView()
  }
}

const toggleSearchMode = () => {
  showSearch.value = !showSearch.value
  if (showSearch.value) {
    searchQuery.value = ''
    searchResults.value = []
  }
}

const performSearch = () => {
  if (searchQuery.value.trim()) {
    searchResults.value = taxHelpService.searchHelp(searchQuery.value.trim())
  } else {
    searchResults.value = []
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

const selectHelpItem = (item: HelpContent) => {
  selectedItem.value = item
  selectedFAQ.value = null
  selectedExample.value = null
}

const selectFAQItem = (faq: FAQItem) => {
  selectedFAQ.value = faq
  selectedItem.value = null
  selectedExample.value = null
}

const selectCalculationExample = (example: CalculationExample) => {
  selectedExample.value = example
  selectedItem.value = null
  selectedFAQ.value = null
}

const selectCategory = (category: HelpCategory) => {
  const categoryItems = taxHelpService.getHelpByCategory(category)
  if (categoryItems.length > 0) {
    selectHelpItem(categoryItems[0])
  }
}

const goBack = () => {
  selectedItem.value = null
  selectedFAQ.value = null
  selectedExample.value = null
}

const resetView = () => {
  showSearch.value = false
  searchQuery.value = ''
  searchResults.value = []
  goBack()
}

const shareContent = () => {
  if (selectedItem.value) {
    const url = `${window.location.origin}/help/${selectedItem.value.id}`
    navigator.clipboard.writeText(url)
    // 这里可以添加分享成功的提示
  }
}

const printContent = () => {
  window.print()
}

const searchRelatedTopic = (topic: string) => {
  searchQuery.value = topic
  showSearch.value = true
  performSearch()
}

const showContextualHelp = (context: string, position?: { x: number; y: number }) => {
  const help = taxHelpService.getContextualHelp(context)
  if (help) {
    contextualHelp.value = help
    if (position) {
      contextualHelpPosition.value = {
        left: `${position.x}px`,
        top: `${position.y}px`
      }
    }
  }
}

const dismissContextualHelp = () => {
  contextualHelp.value = null
}

const executeHelpAction = (action: HelpAction) => {
  emit('actionExecuted', action)

  switch (action.action) {
    case 'modal':
      const helpContent = taxHelpService.getHelpContent(action.target)
      if (helpContent) {
        selectHelpItem(helpContent)
        isExpanded.value = true
      }
      break
    case 'navigate':
      // 导航到指定页面
      break
    case 'calculate':
      // 触发计算
      break
    case 'external':
      window.open(action.target, '_blank')
      break
  }
}

const getDifficultyLabel = (difficulty: string): string => {
  const labels = {
    beginner: 'Einsteiger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte'
  }
  return labels[difficulty as keyof typeof labels] || difficulty
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 监听器
watch(() => props.context, (newContext) => {
  if (newContext) {
    showContextualHelp(newContext)
  }
})

// 生命周期
onMounted(() => {
  if (props.autoShow) {
    isExpanded.value = true
  }

  if (props.context) {
    showContextualHelp(props.context)
  }
})

// 暴露方法给父组件
defineExpose({
  showHelp: () => { isExpanded.value = true },
  hideHelp: () => { isExpanded.value = false },
  showContextualHelp,
  dismissContextualHelp
})
</script>

<style scoped>
.tax-help-system {
  @apply relative;
}

/* 帮助触发按钮 */
.help-trigger {
  @apply fixed bottom-6 right-6 z-50;
  @apply w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg;
  @apply flex items-center justify-center;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-all duration-200;
}

.help-trigger:hover {
  @apply scale-110;
}

/* 帮助面板 */
.help-panel {
  @apply fixed z-40 bg-white rounded-lg shadow-xl border border-gray-200;
  @apply w-96 h-[600px] flex flex-col;
  @apply transition-all duration-300;
}

.help-panel-right {
  @apply top-20 right-6;
}

.help-panel-left {
  @apply top-20 left-6;
}

.help-panel-bottom {
  @apply bottom-20 right-6;
}

/* 帮助头部 */
.help-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.help-title {
  @apply text-lg font-semibold text-gray-900;
  margin: 0;
}

.help-actions {
  @apply flex items-center gap-2;
}

.help-action-btn {
  @apply p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.help-action-btn.active {
  @apply text-blue-600 bg-blue-50;
}

/* 搜索栏 */
.help-search {
  @apply p-4 border-b border-gray-200;
}

.search-input-group {
  @apply relative;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400;
}

.search-input {
  @apply w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.search-clear {
  @apply absolute right-2 top-1/2 transform -translate-y-1/2;
  @apply p-1 text-gray-400 hover:text-gray-600 rounded;
}

/* 帮助内容区域 */
.help-content {
  @apply flex-1 overflow-y-auto p-4;
}

/* 搜索结果 */
.search-results {
  @apply space-y-4;
}

.no-results {
  @apply text-center py-8;
}

.no-results-icon {
  @apply mx-auto text-gray-300 mb-4;
}

.no-results h4 {
  @apply text-lg font-medium text-gray-900 mb-2;
  margin: 0;
}

.no-results p {
  @apply text-gray-500;
  margin: 0;
}

/* 帮助项目 */
.help-items {
  @apply space-y-3;
}

.help-item {
  @apply p-3 border border-gray-200 rounded-lg cursor-pointer;
  @apply hover:border-blue-300 hover:bg-blue-50;
  @apply transition-colors duration-200;
}

.help-item.active {
  @apply border-blue-500 bg-blue-50;
}

.help-item.recommended {
  @apply border-green-200 bg-green-50;
}

.item-header {
  @apply flex items-start justify-between mb-2;
}

.item-title {
  @apply text-sm font-medium text-gray-900 flex-1;
  margin: 0;
}

.item-meta {
  @apply flex items-center gap-2 text-xs;
}

.item-difficulty {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.difficulty-beginner {
  @apply bg-green-100 text-green-800;
}

.difficulty-intermediate {
  @apply bg-yellow-100 text-yellow-800;
}

.difficulty-advanced {
  @apply bg-red-100 text-red-800;
}

.item-reading-time {
  @apply text-gray-500;
}

.item-tags {
  @apply flex flex-wrap gap-1;
}

.item-tag {
  @apply px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded;
}

/* 帮助分区 */
.help-section {
  @apply mb-6;
}

.section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3;
  margin: 0;
}

/* FAQ项目 */
.faq-items {
  @apply space-y-3;
}

.faq-item {
  @apply p-3 border border-gray-200 rounded-lg cursor-pointer;
  @apply hover:border-blue-300 hover:bg-blue-50;
  @apply transition-colors duration-200;
}

.faq-question {
  @apply text-sm font-medium text-gray-900 mb-1;
  margin: 0;
}

.faq-preview {
  @apply text-xs text-gray-600;
  margin: 0;
}

/* 示例项目 */
.example-items {
  @apply space-y-3;
}

.example-item {
  @apply p-3 border border-gray-200 rounded-lg cursor-pointer;
  @apply hover:border-blue-300 hover:bg-blue-50;
  @apply transition-colors duration-200;
}

.example-title {
  @apply text-sm font-medium text-gray-900 mb-1;
  margin: 0;
}

.example-description {
  @apply text-xs text-gray-600 mb-2;
  margin: 0;
}

.example-scenario {
  @apply flex items-center gap-1 text-xs text-blue-600;
}

/* 类别网格 */
.category-grid {
  @apply grid grid-cols-2 gap-3;
}

.category-card {
  @apply p-3 border border-gray-200 rounded-lg cursor-pointer;
  @apply hover:border-blue-300 hover:bg-blue-50;
  @apply transition-colors duration-200 text-center;
}

.category-icon {
  @apply mx-auto text-blue-600 mb-2;
}

.category-title {
  @apply text-sm font-medium text-gray-900 mb-1;
  margin: 0;
}

.category-description {
  @apply text-xs text-gray-600 mb-2;
  margin: 0;
}

.category-count {
  @apply text-xs text-blue-600 font-medium;
}

/* 选中内容 */
.selected-content,
.selected-faq,
.selected-example {
  @apply space-y-4;
}

.content-header {
  @apply flex items-center justify-between;
}

.back-button {
  @apply flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 rounded;
}

.content-meta {
  @apply flex items-center gap-2 text-xs;
}

.content-difficulty {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.content-reading-time {
  @apply text-gray-500;
}

.content-title {
  @apply text-lg font-semibold text-gray-900;
  margin: 0;
}

.content-tags {
  @apply flex flex-wrap gap-1;
}

.content-tag {
  @apply px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded;
}

.content-body {
  @apply prose prose-sm max-w-none;
}

.content-body h3 {
  @apply text-base font-semibold text-gray-900 mt-4 mb-2;
}

.content-body h4 {
  @apply text-sm font-semibold text-gray-900 mt-3 mb-2;
}

.content-body p {
  @apply text-sm text-gray-700 mb-3;
}

.content-body ul,
.content-body ol {
  @apply text-sm text-gray-700 mb-3 pl-4;
}

.content-body li {
  @apply mb-1;
}

.content-body table {
  @apply w-full text-sm border-collapse border border-gray-300 mb-3;
}

.content-body th,
.content-body td {
  @apply border border-gray-300 px-2 py-1 text-left;
}

.content-body th {
  @apply bg-gray-50 font-medium;
}

.content-footer {
  @apply flex items-center justify-between pt-4 border-t border-gray-200;
}

.content-updated {
  @apply text-xs text-gray-500;
  margin: 0;
}

.content-actions {
  @apply flex items-center gap-2;
}

.content-action-btn {
  @apply flex items-center gap-1 px-3 py-1 text-xs text-gray-600;
  @apply hover:text-gray-800 hover:bg-gray-100 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

/* FAQ特定样式 */
.faq-question-title {
  @apply text-lg font-semibold text-gray-900 mb-4;
  margin: 0;
}

.faq-answer {
  @apply prose prose-sm max-w-none mb-4;
}

.related-topics h4 {
  @apply text-sm font-semibold text-gray-900 mb-2;
  margin: 0;
}

.related-tags {
  @apply flex flex-wrap gap-1;
}

.related-tag {
  @apply px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded cursor-pointer;
  @apply hover:bg-blue-100 hover:text-blue-800;
}

/* 计算示例特定样式 */
.example-title-full {
  @apply text-lg font-semibold text-gray-900 mb-2;
  margin: 0;
}

.example-description-full {
  @apply text-sm text-gray-700 mb-4;
  margin: 0;
}

.example-scenario-full h4 {
  @apply text-sm font-semibold text-gray-900 mb-2;
  margin: 0;
}

.example-scenario-full p {
  @apply text-sm text-gray-700 mb-4;
  margin: 0;
}

.calculation-steps h4 {
  @apply text-sm font-semibold text-gray-900 mb-3;
  margin: 0;
}

.calculation-step {
  @apply flex gap-3 mb-4 p-3 bg-gray-50 rounded-lg;
}

.step-number {
  @apply w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full;
  @apply flex items-center justify-center flex-shrink-0;
}

.step-content {
  @apply flex-1;
}

.step-description {
  @apply text-sm font-medium text-gray-900 mb-1;
  margin: 0;
}

.step-formula {
  @apply text-xs text-blue-600 font-mono mb-1;
}

.step-calculation {
  @apply text-xs text-gray-700 font-mono mb-2;
}

.step-explanation {
  @apply text-xs text-gray-600;
  margin: 0;
}

.example-result h4 {
  @apply text-sm font-semibold text-gray-900 mb-3;
  margin: 0;
}

.result-summary {
  @apply space-y-2 mb-3;
}

.result-item {
  @apply flex justify-between items-center;
}

.result-label {
  @apply text-sm text-gray-700;
}

.result-value {
  @apply text-sm font-semibold text-gray-900;
}

.result-explanation {
  @apply text-sm text-gray-700 mb-4;
  margin: 0;
}

.example-tips h4 {
  @apply text-sm font-semibold text-gray-900 mb-2;
  margin: 0;
}

.tips-list {
  @apply text-sm text-gray-700 pl-4;
  margin: 0;
}

.tips-list li {
  @apply mb-1;
}

/* 上下文帮助 */
.contextual-help {
  @apply absolute z-30 bg-white rounded-lg shadow-lg border border-gray-200;
  @apply w-80 p-4;
}

.contextual-help-content {
  @apply pr-6;
}

.contextual-help-title {
  @apply text-sm font-semibold text-gray-900 mb-2;
  margin: 0;
}

.contextual-help-text {
  @apply text-sm text-gray-700 mb-3;
  margin: 0;
}

.contextual-help-actions {
  @apply flex flex-wrap gap-2;
}

.contextual-help-action {
  @apply px-3 py-1 text-xs bg-blue-600 text-white rounded;
  @apply hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.contextual-help-close {
  @apply absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 rounded;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-panel {
    @apply w-full h-full;
    @apply top-0 left-0 right-0 bottom-0;
    @apply rounded-none;
  }

  .help-trigger {
    @apply bottom-4 right-4 w-12 h-12;
  }

  .category-grid {
    @apply grid-cols-1;
  }

  .contextual-help {
    @apply w-full mx-4;
    @apply left-0 right-0;
  }
}

/* 动画效果 */
.help-panel {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.contextual-help {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
