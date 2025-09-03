<template>
  <div class="rechner-hub">
    <!-- Hero Section -->
    <section class="hero-section bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div class="container mx-auto px-4">
        <div class="text-center max-w-4xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Finanzrechner für Deutschland
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Kostenlose Online-Rechner für Ihre Finanzplanung.
            Transparent, präzise und nach deutschem Recht.
          </p>

          <!-- Search Bar -->
          <div class="max-w-2xl mx-auto mb-8">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Rechner suchen..."
                class="w-full px-6 py-4 text-lg border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
              <button class="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div class="bg-white rounded-lg p-6 shadow-sm">
              <div class="text-3xl font-bold text-blue-600">{{ totalCalculators }}</div>
              <div class="text-gray-600">Rechner verfügbar</div>
            </div>
            <div class="bg-white rounded-lg p-6 shadow-sm">
              <div class="text-3xl font-bold text-green-600">100%</div>
              <div class="text-gray-600">Kostenlos</div>
            </div>
            <div class="bg-white rounded-lg p-6 shadow-sm">
              <div class="text-3xl font-bold text-purple-600">DSGVO</div>
              <div class="text-gray-600">Konform</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Filter Tabs -->
    <section class="py-8 bg-white border-b">
      <div class="container mx-auto px-4">
        <div class="flex flex-wrap justify-center gap-4">
          <button
            v-for="category in categories"
            :key="category.key"
            @click="selectedCategory = category.key"
            :class="[
              'px-6 py-3 rounded-full font-medium transition-colors',
              selectedCategory === category.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ category.label }}
            <span class="ml-2 text-sm opacity-75">({{ category.count }})</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Calculator Grid -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="calculator in filteredCalculators"
            :key="calculator.id"
            class="calculator-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
          >
            <!-- Card Header -->
            <div class="p-6 border-b border-gray-100">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-xl font-semibold text-gray-900 mb-2">
                    {{ calculator.name }}
                  </h3>
                  <p class="text-gray-600 text-sm mb-4">
                    {{ calculator.description }}
                  </p>

                  <!-- Category Badge -->
                  <span :class="getCategoryBadgeClass(calculator.category)" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium">
                    {{ getCategoryLabel(calculator.category) }}
                  </span>
                </div>

                <!-- Calculator Icon -->
                <div class="ml-4">
                  <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Body -->
            <div class="p-6">
              <!-- Key Features -->
              <div class="mb-6">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Funktionen:</h4>
                <ul class="space-y-2">
                  <li v-for="feature in getCalculatorFeatures(calculator)" :key="feature" class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    {{ feature }}
                  </li>
                </ul>
              </div>

              <!-- Action Button -->
              <router-link
                :to="getCalculatorRoute(calculator)"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-block text-center"
              >
                Jetzt berechnen
              </router-link>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredCalculators.length === 0" class="text-center py-16">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306a7.962 7.962 0 00-6 0m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v1.306m6 0V7a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2V6.306z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Keine Rechner gefunden</h3>
          <p class="text-gray-600">Versuchen Sie einen anderen Suchbegriff oder wählen Sie eine andere Kategorie.</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          Brauchen Sie Hilfe bei der Finanzplanung?
        </h2>
        <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Unsere Rechner sind nur der Anfang. Entdecken Sie unsere Ratgeber und Vergleichstools
          für eine umfassende Finanzplanung.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/ratgeber"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
          >
            Ratgeber lesen
          </router-link>
          <router-link
            to="/vergleich"
            class="bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-8 rounded-lg border border-blue-600 transition-colors duration-200"
          >
            Produkte vergleichen
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// import { calculatorRegistry } from '@/core/CalculatorRegistry' // 改为异步导入
import type { BaseCalculator, CalculatorCategory } from '@/types/calculator'

// Reactive data
const searchQuery = ref('')
const selectedCategory = ref<CalculatorCategory | 'all'>('all')
const calculators = ref<BaseCalculator[]>([])

// Computed properties
const totalCalculators = computed(() => calculators.value.length)

// 分类数据 - 使用ref而不是computed，因为需要异步加载
const categories = ref([
  { key: 'all', label: 'Alle', count: 0 },
  { key: 'compound-interest', label: 'Sparen & Zinsen', count: 0 },
  { key: 'loan', label: 'Kredite', count: 0 },
  { key: 'mortgage', label: 'Immobilien', count: 0 },
  { key: 'retirement', label: 'Altersvorsorge', count: 0 },
  { key: 'investment', label: 'Investitionen', count: 0 },
  { key: 'tax', label: 'Steuern', count: 0 }
])

// 异步加载分类统计
const loadCategoryStats = async () => {
  try {
    const { calculatorRegistry } = await import('@/core/CalculatorRegistry')
    const stats = calculatorRegistry.getStats()
    categories.value = [
      { key: 'all', label: 'Alle', count: stats.totalCalculators },
      { key: 'compound-interest', label: 'Sparen & Zinsen', count: stats.categories['compound-interest'] || 0 },
      { key: 'loan', label: 'Kredite', count: stats.categories['loan'] || 0 },
      { key: 'mortgage', label: 'Immobilien', count: stats.categories['mortgage'] || 0 },
      { key: 'retirement', label: 'Altersvorsorge', count: stats.categories['retirement'] || 0 },
      { key: 'investment', label: 'Investitionen', count: stats.categories['investment'] || 0 },
      { key: 'tax', label: 'Steuern', count: stats.categories['tax'] || 0 }
    ]
  } catch (error) {
    console.error('Failed to load category stats:', error)
  }
}

const filteredCalculators = computed(() => {
  let filtered = calculators.value

  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(calc => calc.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(calc =>
      calc.name.toLowerCase().includes(query) ||
      calc.description.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Methods
const getCategoryLabel = (category: CalculatorCategory): string => {
  const labels = {
    'compound-interest': 'Sparen & Zinsen',
    'loan': 'Kredite',
    'mortgage': 'Immobilien',
    'retirement': 'Altersvorsorge',
    'investment': 'Investitionen',
    'tax': 'Steuern'
  }
  return labels[category] || category
}

const getCategoryBadgeClass = (category: CalculatorCategory): string => {
  const classes = {
    'compound-interest': 'bg-green-100 text-green-800',
    'loan': 'bg-red-100 text-red-800',
    'mortgage': 'bg-blue-100 text-blue-800',
    'retirement': 'bg-purple-100 text-purple-800',
    'investment': 'bg-yellow-100 text-yellow-800',
    'tax': 'bg-gray-100 text-gray-800'
  }
  return classes[category] || 'bg-gray-100 text-gray-800'
}

const getCalculatorFeatures = (calculator: BaseCalculator): string[] => {
  // Return key features based on calculator type
  const features = {
    'compound-interest': ['Zinseszins-Berechnung', 'Grafische Darstellung', 'Steuerberücksichtigung'],
    'savings-plan': ['Deutsche Bankprodukte', 'Inflationsanpassung', 'Steueroptimierung'],
    'etf-savings-plan': ['ETF-Analyse', 'Teilfreistellung', 'Kostenvergleich'],
    'loan': ['Tilgungsplan', 'Sondertilgungen', 'Zinsvergleich'],
    'mortgage': ['Baufinanzierung', 'Eigenkapital-Analyse', 'Förderungen'],
    'retirement': ['Gesetzliche Rente', 'Private Vorsorge', 'Steuervorteile'],
    'portfolio': ['Diversifikation', 'Risikobewertung', 'Rebalancing'],
    'tax-optimization': ['Steuerersparnis', 'Freibeträge', 'Optimierungsvorschläge']
  }

  return features[calculator.id as keyof typeof features] || ['Präzise Berechnung', 'Detaillierte Ergebnisse', 'Kostenlos']
}

const getCalculatorRoute = (calculator: BaseCalculator): string => {
  // Map calculator IDs to friendly URLs
  const routes = {
    'compound-interest': '/zinseszins-rechner',
    'savings-plan': '/sparplan-rechner',
    'etf-savings-plan': '/etf-sparplan-rechner',
    'loan': '/darlehensrechner',
    'mortgage': '/baufinanzierungsrechner',
    'retirement': '/altersvorsorge-rechner',
    'portfolio': '/portfolio-rechner',
    'tax-optimization': '/steueroptimierung-rechner'
  }

  return routes[calculator.id as keyof typeof routes] || `/rechner/${calculator.id}`
}

// Lifecycle
onMounted(async () => {
  try {
    // 异步导入calculatorRegistry以避免循环依赖
    const { calculatorRegistry } = await import('@/core/CalculatorRegistry')
    calculators.value = calculatorRegistry.getAllCalculators()

    // 加载分类统计
    await loadCategoryStats()
  } catch (error) {
    console.error('Failed to load calculators:', error)
  }
})
</script>

<style scoped>
.calculator-card {
  transition: transform 0.2s ease-in-out;
}

.calculator-card:hover {
  transform: translateY(-4px);
}

.hero-section {
  background-image:
    radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
}
</style>
