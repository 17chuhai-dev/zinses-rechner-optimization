<!--
  帮助中心组件
  提供搜索、分类浏览、常见问题等帮助功能
-->

<template>
  <div class="help-center max-w-4xl mx-auto p-6">
    <!-- 头部搜索 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        Hilfe-Center
      </h1>
      <p class="text-lg text-gray-600 mb-6">
        Finden Sie Antworten auf Ihre Fragen zum Zinses-Rechner
      </p>
      
      <!-- 搜索框 -->
      <div class="relative max-w-2xl mx-auto">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Suchen Sie nach Hilfe-Themen..."
          class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- 快速链接 -->
    <div v-if="!searchQuery" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div
        v-for="quickLink in quickLinks"
        :key="quickLink.id"
        class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        @click="handleQuickLink(quickLink)"
      >
        <div class="flex items-center mb-4">
          <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', quickLink.bgColor]">
            <component :is="quickLink.icon" :class="['w-6 h-6', quickLink.iconColor]" />
          </div>
          <h3 class="ml-4 text-lg font-semibold text-gray-900">
            {{ quickLink.title }}
          </h3>
        </div>
        <p class="text-gray-600">
          {{ quickLink.description }}
        </p>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchQuery && searchResults.length > 0" class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">
        Suchergebnisse ({{ searchResults.length }})
      </h2>
      <div class="space-y-4">
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          @click="openHelpContent(result.id)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ result.title }}
              </h3>
              <p class="text-gray-600 mb-3 line-clamp-2">
                {{ result.content.substring(0, 200) }}...
              </p>
              <div class="flex items-center text-sm text-gray-500">
                <span class="px-2 py-1 bg-gray-100 rounded text-xs mr-2">
                  {{ getCategoryDisplayName(result.category) }}
                </span>
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mr-2">
                  {{ getDifficultyDisplayName(result.difficulty) }}
                </span>
                <span>{{ result.views }} Aufrufe</span>
              </div>
            </div>
            <div class="ml-4 flex items-center text-sm text-gray-400">
              <ThumbUpIcon class="w-4 h-4 mr-1" />
              {{ result.helpful }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无搜索结果 -->
    <div v-if="searchQuery && searchResults.length === 0" class="text-center py-12">
      <ExclamationTriangleIcon class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        Keine Ergebnisse gefunden
      </h3>
      <p class="text-gray-600 mb-4">
        Versuchen Sie es mit anderen Suchbegriffen oder durchsuchen Sie unsere Kategorien.
      </p>
      <BaseButton variant="outline" @click="clearSearch">
        Suche zurücksetzen
      </BaseButton>
    </div>

    <!-- 分类浏览 -->
    <div v-if="!searchQuery" class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">
        Nach Kategorien durchsuchen
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="category in categories"
          :key="category.id"
          class="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div class="flex items-center mb-4">
            <component :is="category.icon" class="w-6 h-6 text-blue-600 mr-3" />
            <h3 class="text-lg font-semibold text-gray-900">
              {{ category.name }}
            </h3>
            <span class="ml-auto text-sm text-gray-500">
              {{ category.count }} Artikel
            </span>
          </div>
          <p class="text-gray-600 mb-4">
            {{ category.description }}
          </p>
          <div class="space-y-2">
            <div
              v-for="article in category.topArticles"
              :key="article.id"
              class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 px-2 rounded"
              @click="openHelpContent(article.id)"
            >
              <span class="text-sm text-gray-700">{{ article.title }}</span>
              <ChevronRightIcon class="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <BaseButton
            variant="ghost"
            size="sm"
            class="mt-4"
            @click="browseCategory(category.id)"
          >
            Alle anzeigen
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- 常见问题 -->
    <div v-if="!searchQuery" class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">
        Häufig gestellte Fragen
      </h2>
      <div class="space-y-4">
        <div
          v-for="faq in faqs"
          :key="faq.id"
          class="bg-white rounded-lg border border-gray-200"
        >
          <button
            class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            @click="toggleFAQ(faq.id)"
          >
            <span class="font-medium text-gray-900">{{ faq.question }}</span>
            <ChevronDownIcon
              :class="[
                'w-5 h-5 text-gray-400 transition-transform',
                expandedFAQs.includes(faq.id) ? 'rotate-180' : ''
              ]"
            />
          </button>
          <div
            v-if="expandedFAQs.includes(faq.id)"
            class="px-6 pb-4 text-gray-700"
          >
            {{ faq.answer }}
          </div>
        </div>
      </div>
    </div>

    <!-- 联系支持 -->
    <div v-if="!searchQuery" class="bg-blue-50 rounded-lg p-6 text-center">
      <QuestionMarkCircleIcon class="w-12 h-12 text-blue-600 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        Haben Sie noch Fragen?
      </h3>
      <p class="text-gray-600 mb-4">
        Unser Support-Team hilft Ihnen gerne weiter.
      </p>
      <div class="flex justify-center gap-4">
        <BaseButton variant="primary" @click="openContactForm">
          Kontakt aufnehmen
        </BaseButton>
        <BaseButton variant="outline" @click="startGuidedTour">
          Geführte Tour starten
        </BaseButton>
      </div>
    </div>

    <!-- 帮助内容详情对话框 -->
    <HelpContentDialog
      v-if="selectedContentId"
      :content-id="selectedContentId"
      @close="selectedContentId = null"
      @rate="handleContentRating"
    />

    <!-- 联系表单对话框 -->
    <ContactFormDialog
      v-if="showContactForm"
      @close="showContactForm = false"
      @submit="handleContactSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ThumbUpIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  CalculatorIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon
} from '@heroicons/vue/24/outline'
import BaseButton from '@/components/ui/BaseButton.vue'
import HelpContentDialog from './HelpContentDialog.vue'
import ContactFormDialog from './ContactFormDialog.vue'
import { useUserGuidance } from '@/services/UserGuidanceService'

// 使用用户引导服务
const {
  searchHelp,
  getHelpContent,
  rateHelpContent,
  startTour
} = useUserGuidance()

// 响应式状态
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const selectedContentId = ref<string | null>(null)
const showContactForm = ref(false)
const expandedFAQs = ref<string[]>([])

// 快速链接
const quickLinks = [
  {
    id: 'getting-started',
    title: 'Erste Schritte',
    description: 'Lernen Sie die Grundlagen des Zinses-Rechners',
    icon: BookOpenIcon,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    action: 'content'
  },
  {
    id: 'guided-tour',
    title: 'Geführte Tour',
    description: 'Interaktive Einführung in alle Funktionen',
    icon: AcademicCapIcon,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    action: 'tour'
  },
  {
    id: 'advanced-features',
    title: 'Erweiterte Funktionen',
    description: 'Entdecken Sie alle Berechnungsoptionen',
    icon: CogIcon,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    action: 'content'
  }
]

// 分类
const categories = [
  {
    id: 'basics',
    name: 'Grundlagen',
    description: 'Grundlegende Konzepte und erste Schritte',
    icon: BookOpenIcon,
    count: 8,
    topArticles: [
      { id: 'what-is-compound-interest', title: 'Was ist Zinseszins?' },
      { id: 'first-calculation', title: 'Ihre erste Berechnung' },
      { id: 'understanding-results', title: 'Ergebnisse verstehen' }
    ]
  },
  {
    id: 'calculations',
    name: 'Berechnungen',
    description: 'Verschiedene Berechnungsarten und Parameter',
    icon: CalculatorIcon,
    count: 12,
    topArticles: [
      { id: 'monthly-savings', title: 'Monatliche Sparraten' },
      { id: 'interest-rates', title: 'Zinssätze verstehen' },
      { id: 'time-periods', title: 'Laufzeiten optimieren' }
    ]
  },
  {
    id: 'taxes',
    name: 'Steuern',
    description: 'Deutsche Steuerregeln und Optimierung',
    icon: DocumentTextIcon,
    count: 6,
    topArticles: [
      { id: 'german-tax-rules', title: 'Deutsche Steuerregeln' },
      { id: 'tax-optimization', title: 'Steueroptimierung' },
      { id: 'tax-free-allowance', title: 'Freibeträge nutzen' }
    ]
  },
  {
    id: 'features',
    name: 'Funktionen',
    description: 'Export, Vergleiche und erweiterte Features',
    icon: ChartBarIcon,
    count: 10,
    topArticles: [
      { id: 'export-results', title: 'Ergebnisse exportieren' },
      { id: 'scenario-comparison', title: 'Szenarien vergleichen' },
      { id: 'save-calculations', title: 'Berechnungen speichern' }
    ]
  }
]

// 常见问题
const faqs = [
  {
    id: 'faq-1',
    question: 'Wie genau sind die Berechnungen?',
    answer: 'Unsere Berechnungen verwenden präzise mathematische Formeln und berücksichtigen deutsche Steuerregeln. Die Ergebnisse sind sehr genau, können aber je nach individueller Situation variieren.'
  },
  {
    id: 'faq-2',
    question: 'Kann ich meine Berechnungen speichern?',
    answer: 'Ja, Sie können Ihre Berechnungen lokal in Ihrem Browser speichern und später wieder aufrufen. Für erweiterte Speicheroptionen registrieren Sie sich für ein kostenloses Konto.'
  },
  {
    id: 'faq-3',
    question: 'Welche Exportformate werden unterstützt?',
    answer: 'Sie können Ihre Ergebnisse als PDF-Bericht, Excel-Tabelle, PNG-Bild oder SVG-Grafik exportieren. Jedes Format hat seine eigenen Vorteile je nach Verwendungszweck.'
  },
  {
    id: 'faq-4',
    question: 'Wie werden deutsche Steuern berechnet?',
    answer: 'Wir berücksichtigen Abgeltungssteuer, Solidaritätszuschlag, Kirchensteuer und Freibeträge nach aktuellen deutschen Steuergesetzen. Die Berechnung erfolgt automatisch basierend auf Ihren Einstellungen.'
  },
  {
    id: 'faq-5',
    question: 'Ist der Zinses-Rechner kostenlos?',
    answer: 'Ja, der Zinses-Rechner ist vollständig kostenlos nutzbar. Alle Grundfunktionen stehen ohne Registrierung zur Verfügung.'
  }
]

// 计算属性
const isSearching = computed(() => searchQuery.value.length > 0)

// 方法
const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  
  try {
    searchResults.value = searchHelp(searchQuery.value)
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

const handleQuickLink = (quickLink: any) => {
  if (quickLink.action === 'tour') {
    startGuidedTour()
  } else {
    openHelpContent(quickLink.id)
  }
}

const openHelpContent = (contentId: string) => {
  selectedContentId.value = contentId
}

const browseCategory = (categoryId: string) => {
  // 实现分类浏览
  searchQuery.value = `category:${categoryId}`
  handleSearch()
}

const toggleFAQ = (faqId: string) => {
  const index = expandedFAQs.value.indexOf(faqId)
  if (index > -1) {
    expandedFAQs.value.splice(index, 1)
  } else {
    expandedFAQs.value.push(faqId)
  }
}

const openContactForm = () => {
  showContactForm.value = true
}

const startGuidedTour = async () => {
  try {
    await startTour('onboarding')
  } catch (error) {
    console.error('Failed to start guided tour:', error)
  }
}

const handleContentRating = async (contentId: string, helpful: boolean) => {
  try {
    await rateHelpContent(contentId, helpful)
  } catch (error) {
    console.error('Failed to rate content:', error)
  }
}

const handleContactSubmit = (formData: any) => {
  // 处理联系表单提交
  console.log('Contact form submitted:', formData)
  showContactForm.value = false
}

const getCategoryDisplayName = (category: string): string => {
  const names = {
    basics: 'Grundlagen',
    calculations: 'Berechnungen',
    taxes: 'Steuern',
    features: 'Funktionen',
    advanced: 'Erweitert'
  }
  return names[category as keyof typeof names] || category
}

const getDifficultyDisplayName = (difficulty: string): string => {
  const names = {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte'
  }
  return names[difficulty as keyof typeof names] || difficulty
}

// 生命周期
onMounted(() => {
  // 初始化帮助中心
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
