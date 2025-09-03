<template>
  <div class="content-editor">
    <!-- 编辑器工具栏 -->
    <div class="editor-toolbar bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <!-- 基础格式化工具 -->
          <div class="flex items-center space-x-2">
            <button
              @click="formatText('bold')"
              :class="['p-2 rounded hover:bg-gray-100', { 'bg-blue-100': isActive('bold') }]"
              title="Fett (Strg+B)"
            >
              <BoldIcon class="w-4 h-4" />
            </button>
            <button
              @click="formatText('italic')"
              :class="['p-2 rounded hover:bg-gray-100', { 'bg-blue-100': isActive('italic') }]"
              title="Kursiv (Strg+I)"
            >
              <ItalicIcon class="w-4 h-4" />
            </button>
            <button
              @click="formatText('underline')"
              :class="['p-2 rounded hover:bg-gray-100', { 'bg-blue-100': isActive('underline') }]"
              title="Unterstrichen (Strg+U)"
            >
              <UnderlineIcon class="w-4 h-4" />
            </button>
          </div>

          <div class="w-px h-6 bg-gray-300"></div>

          <!-- 标题工具 -->
          <select
            @change="formatHeading($event.target.value)"
            class="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">Überschrift</option>
            <option value="h1">H1 - Hauptüberschrift</option>
            <option value="h2">H2 - Unterüberschrift</option>
            <option value="h3">H3 - Abschnitt</option>
            <option value="h4">H4 - Unterabschnitt</option>
          </select>

          <div class="w-px h-6 bg-gray-300"></div>

          <!-- 列表工具 -->
          <button
            @click="formatText('insertUnorderedList')"
            class="p-2 rounded hover:bg-gray-100"
            title="Aufzählung"
          >
            <ListIcon class="w-4 h-4" />
          </button>
          <button
            @click="formatText('insertOrderedList')"
            class="p-2 rounded hover:bg-gray-100"
            title="Nummerierte Liste"
          >
            <NumberedListIcon class="w-4 h-4" />
          </button>

          <div class="w-px h-6 bg-gray-300"></div>

          <!-- 特殊功能 -->
          <button
            @click="showFinancialTermsDialog = true"
            class="p-2 rounded hover:bg-gray-100 text-blue-600"
            title="Finanzbegriff einfügen"
          >
            <CalculatorIcon class="w-4 h-4" />
          </button>
          <button
            @click="showChartDialog = true"
            class="p-2 rounded hover:bg-gray-100 text-green-600"
            title="Diagramm einfügen"
          >
            <ChartIcon class="w-4 h-4" />
          </button>
          <button
            @click="showCalculatorDialog = true"
            class="p-2 rounded hover:bg-gray-100 text-purple-600"
            title="Rechner einbetten"
          >
            <EmbedIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- 右侧工具 -->
        <div class="flex items-center space-x-2">
          <button
            @click="togglePreview"
            :class="[
              'px-3 py-1 rounded text-sm',
              previewMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ previewMode ? 'Bearbeiten' : 'Vorschau' }}
          </button>
          <button
            @click="saveDraft"
            class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            :disabled="saving"
          >
            {{ saving ? 'Speichern...' : 'Entwurf speichern' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body flex">
      <!-- 编辑区域 -->
      <div class="editor-content flex-1">
        <div v-if="!previewMode" class="p-6">
          <!-- 文章标题 -->
          <input
            v-model="article.title"
            @input="updateSEO"
            placeholder="Artikel-Titel eingeben..."
            class="w-full text-3xl font-bold border-none outline-none mb-4 placeholder-gray-400"
          />
          
          <!-- 文章摘要 -->
          <textarea
            v-model="article.excerpt"
            @input="updateSEO"
            placeholder="Kurze Zusammenfassung des Artikels..."
            class="w-full text-lg text-gray-600 border border-gray-200 rounded p-3 mb-6 resize-none"
            rows="3"
          ></textarea>

          <!-- 富文本编辑器 -->
          <div
            ref="editorRef"
            @input="updateContent"
            @keydown="handleKeydown"
            contenteditable="true"
            class="prose prose-lg max-w-none min-h-[400px] p-4 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'bg-gray-50': !editorFocused }"
            @focus="editorFocused = true"
            @blur="editorFocused = false"
          >
            <p class="text-gray-400">Beginnen Sie mit dem Schreiben Ihres Artikels...</p>
          </div>
        </div>

        <!-- 预览模式 -->
        <div v-else class="p-6">
          <article class="prose prose-lg max-w-none">
            <h1>{{ article.title || 'Artikel-Titel' }}</h1>
            <p class="lead text-gray-600">{{ article.excerpt || 'Artikel-Zusammenfassung' }}</p>
            <div v-html="article.content"></div>
          </article>
        </div>
      </div>

      <!-- 侧边栏 -->
      <div class="editor-sidebar w-80 bg-gray-50 border-l border-gray-200 p-4">
        <!-- SEO优化面板 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">SEO-Optimierung</h3>
          
          <!-- SEO评分 -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium">SEO-Score</span>
              <span :class="getSEOScoreColor(seoScore)" class="text-sm font-bold">
                {{ seoScore }}/100
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                :class="getSEOScoreColor(seoScore, true)"
                class="h-2 rounded-full transition-all duration-300"
                :style="{ width: `${seoScore}%` }"
              ></div>
            </div>
          </div>

          <!-- 关键词 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Haupt-Keyword</label>
            <input
              v-model="article.primaryKeyword"
              @input="updateSEO"
              placeholder="z.B. Zinseszins berechnen"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>

          <!-- Meta描述 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">
              Meta-Beschreibung
              <span class="text-gray-500">({{ article.metaDescription?.length || 0 }}/160)</span>
            </label>
            <textarea
              v-model="article.metaDescription"
              @input="updateSEO"
              placeholder="Beschreibung für Suchmaschinen..."
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
              rows="3"
              maxlength="160"
            ></textarea>
          </div>

          <!-- SEO建议 -->
          <div v-if="seoSuggestions.length > 0" class="mb-4">
            <h4 class="text-sm font-medium mb-2">Verbesserungsvorschläge</h4>
            <ul class="space-y-1">
              <li
                v-for="suggestion in seoSuggestions"
                :key="suggestion.id"
                class="text-xs text-gray-600 flex items-start"
              >
                <span class="text-yellow-500 mr-1">⚠</span>
                {{ suggestion.text }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 分类和标签 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Kategorien & Tags</h3>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Kategorie</label>
            <select
              v-model="article.category"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Kategorie wählen</option>
              <option value="grundlagen">Grundlagen</option>
              <option value="strategien">Strategien</option>
              <option value="steuer">Steuer & Recht</option>
              <option value="tools">Tools & Rechner</option>
              <option value="news">Aktuelles</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Tags</label>
            <div class="flex flex-wrap gap-1 mb-2">
              <span
                v-for="tag in article.tags"
                :key="tag"
                class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {{ tag }}
                <button @click="removeTag(tag)" class="ml-1 text-blue-600 hover:text-blue-800">
                  ×
                </button>
              </span>
            </div>
            <input
              v-model="newTag"
              @keydown.enter.prevent="addTag"
              placeholder="Tag hinzufügen..."
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <!-- 发布设置 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Veröffentlichung</h3>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Status</label>
            <select
              v-model="article.status"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="draft">Entwurf</option>
              <option value="review">Zur Überprüfung</option>
              <option value="scheduled">Geplant</option>
              <option value="published">Veröffentlicht</option>
            </select>
          </div>

          <div v-if="article.status === 'scheduled'" class="mb-4">
            <label class="block text-sm font-medium mb-2">Veröffentlichungsdatum</label>
            <input
              v-model="article.publishDate"
              type="datetime-local"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>

          <div class="mb-4">
            <label class="flex items-center">
              <input
                v-model="article.featured"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">Als Featured-Artikel markieren</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 财务术语对话框 -->
    <FinancialTermsDialog
      v-if="showFinancialTermsDialog"
      @close="showFinancialTermsDialog = false"
      @insert="insertFinancialTerm"
    />

    <!-- 图表对话框 -->
    <ChartDialog
      v-if="showChartDialog"
      @close="showChartDialog = false"
      @insert="insertChart"
    />

    <!-- 计算器嵌入对话框 -->
    <CalculatorEmbedDialog
      v-if="showCalculatorDialog"
      @close="showCalculatorDialog = false"
      @insert="insertCalculator"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSEO } from '@/composables/useSEO'
import { germanKeywords } from '@/utils/seoConfig'

// 图标组件 (简化实现)
const BoldIcon = { template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>' }
const ItalicIcon = { template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/></svg>' }
const UnderlineIcon = { template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>' }
const ListIcon = { template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>' }
const NumberedListIcon = { template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>' }
const CalculatorIcon = { template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>' }
const ChartIcon = { template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>' }
const EmbedIcon = { template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>' }

// 组件引用
const FinancialTermsDialog = { template: '<div>Financial Terms Dialog</div>' }
const ChartDialog = { template: '<div>Chart Dialog</div>' }
const CalculatorEmbedDialog = { template: '<div>Calculator Embed Dialog</div>' }

// 响应式数据
const editorRef = ref<HTMLElement>()
const editorFocused = ref(false)
const previewMode = ref(false)
const saving = ref(false)
const newTag = ref('')

// 对话框状态
const showFinancialTermsDialog = ref(false)
const showChartDialog = ref(false)
const showCalculatorDialog = ref(false)

// 文章数据
const article = ref({
  title: '',
  excerpt: '',
  content: '',
  primaryKeyword: '',
  metaDescription: '',
  category: '',
  tags: [] as string[],
  status: 'draft',
  publishDate: '',
  featured: false
})

// SEO相关
const { setEducationalContentSEO } = useSEO()

// SEO评分计算
const seoScore = computed(() => {
  let score = 0
  
  // 标题检查 (25分)
  if (article.value.title) {
    score += 10
    if (article.value.title.length >= 30 && article.value.title.length <= 60) score += 10
    if (article.value.primaryKeyword && article.value.title.toLowerCase().includes(article.value.primaryKeyword.toLowerCase())) score += 5
  }
  
  // Meta描述检查 (25分)
  if (article.value.metaDescription) {
    score += 10
    if (article.value.metaDescription.length >= 120 && article.value.metaDescription.length <= 160) score += 10
    if (article.value.primaryKeyword && article.value.metaDescription.toLowerCase().includes(article.value.primaryKeyword.toLowerCase())) score += 5
  }
  
  // 内容检查 (25分)
  if (article.value.content) {
    score += 10
    if (article.value.content.length > 300) score += 10
    if (article.value.primaryKeyword && article.value.content.toLowerCase().includes(article.value.primaryKeyword.toLowerCase())) score += 5
  }
  
  // 其他因素 (25分)
  if (article.value.excerpt) score += 5
  if (article.value.category) score += 5
  if (article.value.tags.length > 0) score += 5
  if (article.value.primaryKeyword) score += 10
  
  return Math.min(score, 100)
})

// SEO建议
const seoSuggestions = computed(() => {
  const suggestions = []
  
  if (!article.value.title) {
    suggestions.push({ id: 'title', text: 'Fügen Sie einen aussagekräftigen Titel hinzu' })
  } else if (article.value.title.length < 30) {
    suggestions.push({ id: 'title-short', text: 'Der Titel sollte mindestens 30 Zeichen haben' })
  } else if (article.value.title.length > 60) {
    suggestions.push({ id: 'title-long', text: 'Der Titel sollte nicht länger als 60 Zeichen sein' })
  }
  
  if (!article.value.metaDescription) {
    suggestions.push({ id: 'meta', text: 'Fügen Sie eine Meta-Beschreibung hinzu' })
  } else if (article.value.metaDescription.length < 120) {
    suggestions.push({ id: 'meta-short', text: 'Die Meta-Beschreibung sollte mindestens 120 Zeichen haben' })
  }
  
  if (!article.value.primaryKeyword) {
    suggestions.push({ id: 'keyword', text: 'Definieren Sie ein Haupt-Keyword' })
  }
  
  if (article.value.content.length < 300) {
    suggestions.push({ id: 'content-short', text: 'Der Artikel sollte mindestens 300 Wörter haben' })
  }
  
  return suggestions
})

// 方法
const formatText = (command: string) => {
  document.execCommand(command, false)
  editorRef.value?.focus()
}

const formatHeading = (tag: string) => {
  if (tag) {
    document.execCommand('formatBlock', false, tag)
  }
  editorRef.value?.focus()
}

const isActive = (command: string) => {
  return document.queryCommandState(command)
}

const updateContent = () => {
  if (editorRef.value) {
    article.value.content = editorRef.value.innerHTML
  }
}

const updateSEO = () => {
  if (article.value.title && article.value.excerpt) {
    setEducationalContentSEO(
      article.value.title,
      article.value.excerpt,
      'preview',
      [article.value.primaryKeyword, ...article.value.tags].filter(Boolean)
    )
  }
}

const togglePreview = () => {
  previewMode.value = !previewMode.value
}

const saveDraft = async () => {
  saving.value = true
  try {
    // 这里实现保存逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Draft saved:', article.value)
  } finally {
    saving.value = false
  }
}

const addTag = () => {
  if (newTag.value.trim() && !article.value.tags.includes(newTag.value.trim())) {
    article.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  article.value.tags = article.value.tags.filter(t => t !== tag)
}

const getSEOScoreColor = (score: number, isBg = false) => {
  const prefix = isBg ? 'bg-' : 'text-'
  if (score >= 80) return `${prefix}green-600`
  if (score >= 60) return `${prefix}yellow-600`
  return `${prefix}red-600`
}

const handleKeydown = (event: KeyboardEvent) => {
  // 处理快捷键
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'b':
        event.preventDefault()
        formatText('bold')
        break
      case 'i':
        event.preventDefault()
        formatText('italic')
        break
      case 'u':
        event.preventDefault()
        formatText('underline')
        break
      case 's':
        event.preventDefault()
        saveDraft()
        break
    }
  }
}

const insertFinancialTerm = (term: any) => {
  // 插入财务术语的逻辑
  console.log('Insert financial term:', term)
}

const insertChart = (chart: any) => {
  // 插入图表的逻辑
  console.log('Insert chart:', chart)
}

const insertCalculator = (calculator: any) => {
  // 插入计算器的逻辑
  console.log('Insert calculator:', calculator)
}

// 监听变化
watch(() => article.value, updateSEO, { deep: true })

onMounted(() => {
  // 初始化编辑器
  if (editorRef.value) {
    editorRef.value.innerHTML = '<p>Beginnen Sie mit dem Schreiben Ihres Artikels...</p>'
  }
})
</script>

<style scoped>
.content-editor {
  @apply h-screen flex flex-col;
}

.editor-body {
  @apply flex-1 overflow-hidden;
}

.editor-content {
  @apply overflow-y-auto;
}

.editor-sidebar {
  @apply overflow-y-auto;
}

.prose {
  @apply text-gray-900;
}

.prose h1 {
  @apply text-3xl font-bold mb-4;
}

.prose h2 {
  @apply text-2xl font-bold mb-3;
}

.prose h3 {
  @apply text-xl font-bold mb-2;
}

.prose p {
  @apply mb-4 leading-relaxed;
}

.prose ul, .prose ol {
  @apply mb-4 pl-6;
}

.prose li {
  @apply mb-1;
}
</style>
