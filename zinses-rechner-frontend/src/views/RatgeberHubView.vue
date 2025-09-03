<template>
  <div class="ratgeber-hub">
    <!-- Hero Section -->
    <section class="hero-section bg-gradient-to-br from-green-50 to-emerald-100 py-16">
      <div class="container mx-auto px-4">
        <div class="text-center max-w-4xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Finanz-Ratgeber für Deutschland
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Verständliche Erklärungen, praktische Tipps und Expertenwissen 
            für Ihre Finanzentscheidungen nach deutschem Recht.
          </p>
          
          <!-- Search Bar -->
          <div class="max-w-2xl mx-auto mb-8">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Ratgeber durchsuchen..."
                class="w-full px-6 py-4 text-lg border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
              <button class="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Articles -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-gray-900 mb-12 text-center">
          Beliebte Ratgeber
        </h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <!-- Featured Article 1 -->
          <article class="featured-article bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">
                Zinseszins einfach erklärt
              </h3>
              <p class="text-gray-600 mb-4">
                Verstehen Sie die Macht des Zinseszinseffekts und wie er Ihr Vermögen exponentiell wachsen lässt.
              </p>
              <router-link
                to="/ratgeber/zinseszins-erklaert"
                class="text-blue-600 hover:text-blue-700 font-medium"
              >
                Weiterlesen →
              </router-link>
            </div>
          </article>

          <!-- Featured Article 2 -->
          <article class="featured-article bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">
                Geld anlegen in Deutschland
              </h3>
              <p class="text-gray-600 mb-4">
                Die besten Strategien für deutsche Anleger: Von Tagesgeld bis ETF-Sparplan.
              </p>
              <router-link
                to="/ratgeber/geld-anlegen-tipps"
                class="text-green-600 hover:text-green-700 font-medium"
              >
                Weiterlesen →
              </router-link>
            </div>
          </article>

          <!-- Featured Article 3 -->
          <article class="featured-article bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306a7.962 7.962 0 00-6 0m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v1.306m6 0V7a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2V6.306z"></path>
              </svg>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">
                Finanz-Lexikon
              </h3>
              <p class="text-gray-600 mb-4">
                Alle wichtigen Finanzbegriffe verständlich erklärt - von A wie Abgeltungssteuer bis Z wie Zins.
              </p>
              <router-link
                to="/ratgeber/finanz-lexikon"
                class="text-purple-600 hover:text-purple-700 font-medium"
              >
                Weiterlesen →
              </router-link>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-gray-900 mb-12 text-center">
          Ratgeber-Kategorien
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="category in categories"
            :key="category.slug"
            class="category-card bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow duration-300"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" :class="category.iconBg">
              <svg class="w-8 h-8" :class="category.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="category.iconPath"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              {{ category.name }}
            </h3>
            <p class="text-gray-600 text-sm mb-4">
              {{ category.description }}
            </p>
            <router-link
              :to="`/ratgeber/${category.slug}`"
              class="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {{ category.articleCount }} Artikel →
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Articles -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900">
            Neueste Artikel
          </h2>
          <router-link
            to="/ratgeber/alle"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            Alle Artikel anzeigen →
          </router-link>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <article
            v-for="article in latestArticles"
            :key="article.slug"
            class="article-card bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
          >
            <div class="p-6">
              <div class="flex items-center mb-3">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" :class="getCategoryBadgeClass(article.category)">
                  {{ article.category }}
                </span>
                <span class="text-gray-500 text-sm ml-3">{{ article.readTime }} Min. Lesezeit</span>
              </div>
              
              <h3 class="text-lg font-semibold text-gray-900 mb-3">
                {{ article.title }}
              </h3>
              
              <p class="text-gray-600 text-sm mb-4">
                {{ article.excerpt }}
              </p>
              
              <div class="flex items-center justify-between">
                <router-link
                  :to="`/ratgeber/${article.slug}`"
                  class="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Weiterlesen →
                </router-link>
                <span class="text-gray-400 text-xs">{{ article.publishDate }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Newsletter CTA -->
    <section class="py-16 bg-blue-600">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">
          Bleiben Sie informiert
        </h2>
        <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Erhalten Sie die neuesten Finanz-Tipps und Rechner-Updates direkt in Ihr Postfach.
        </p>
        <div class="max-w-md mx-auto flex gap-4">
          <input
            type="email"
            placeholder="Ihre E-Mail-Adresse"
            class="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-300"
          >
          <button class="bg-white text-blue-600 font-medium px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            Anmelden
          </button>
        </div>
        <p class="text-blue-200 text-sm mt-4">
          Kostenlos und jederzeit abbestellbar. Datenschutz garantiert.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Reactive data
const searchQuery = ref('')

// Static data
const categories = [
  {
    name: 'Sparen & Zinsen',
    slug: 'sparen-zinsen',
    description: 'Alles über Zinsen, Zinseszins und optimales Sparen',
    articleCount: 12,
    iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    name: 'Investitionen',
    slug: 'investitionen',
    description: 'ETFs, Aktien und andere Anlageformen verstehen',
    articleCount: 18,
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    name: 'Steuern',
    slug: 'steuern',
    description: 'Steueroptimierung und Freibeträge nutzen',
    articleCount: 15,
    iconPath: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  },
  {
    name: 'Altersvorsorge',
    slug: 'altersvorsorge',
    description: 'Rente, Riester und private Vorsorge planen',
    articleCount: 10,
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  }
]

const latestArticles = [
  {
    title: 'ETF-Sparpläne: Der ultimative Leitfaden für 2024',
    slug: 'etf-sparplaene-leitfaden-2024',
    excerpt: 'Alles was Sie über ETF-Sparpläne wissen müssen: Auswahl, Kosten, Steuern und die besten Anbieter.',
    category: 'Investitionen',
    readTime: 8,
    publishDate: '15. März 2024'
  },
  {
    title: 'Inflation und Ihre Ersparnisse: Was Sie jetzt tun sollten',
    slug: 'inflation-ersparnisse-schutz',
    excerpt: 'Wie Sie Ihr Geld vor Inflation schützen und trotz steigender Preise Vermögen aufbauen.',
    category: 'Sparen & Zinsen',
    readTime: 6,
    publishDate: '12. März 2024'
  },
  {
    title: 'Freistellungsauftrag richtig nutzen: 1.000€ steuerfrei',
    slug: 'freistellungsauftrag-richtig-nutzen',
    excerpt: 'So holen Sie das Maximum aus Ihrem Sparerpauschbetrag heraus und sparen Steuern.',
    category: 'Steuern',
    readTime: 5,
    publishDate: '10. März 2024'
  },
  {
    title: 'Riester-Rente: Lohnt sich das noch?',
    slug: 'riester-rente-lohnt-sich-das',
    excerpt: 'Eine ehrliche Analyse der Riester-Rente: Vorteile, Nachteile und Alternativen.',
    category: 'Altersvorsorge',
    readTime: 7,
    publishDate: '8. März 2024'
  },
  {
    title: 'Tagesgeld vs. Festgeld: Der große Vergleich',
    slug: 'tagesgeld-vs-festgeld-vergleich',
    excerpt: 'Welche Sparform passt zu Ihnen? Alle Vor- und Nachteile im direkten Vergleich.',
    category: 'Sparen & Zinsen',
    readTime: 4,
    publishDate: '5. März 2024'
  },
  {
    title: 'Baufinanzierung 2024: Zinsen, Trends und Tipps',
    slug: 'baufinanzierung-2024-zinsen-trends',
    excerpt: 'Aktuelle Entwicklungen am Immobilienmarkt und wie Sie die beste Finanzierung finden.',
    category: 'Immobilien',
    readTime: 9,
    publishDate: '3. März 2024'
  }
]

// Methods
const getCategoryBadgeClass = (category: string): string => {
  const classes = {
    'Sparen & Zinsen': 'bg-green-100 text-green-800',
    'Investitionen': 'bg-blue-100 text-blue-800',
    'Steuern': 'bg-yellow-100 text-yellow-800',
    'Altersvorsorge': 'bg-purple-100 text-purple-800',
    'Immobilien': 'bg-red-100 text-red-800'
  }
  return classes[category as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}
</script>

<style scoped>
.featured-article:hover {
  transform: translateY(-4px);
  transition: transform 0.3s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  transition: transform 0.3s ease;
}

.article-card:hover {
  transform: translateY(-2px);
  transition: transform 0.3s ease;
}

.hero-section {
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
}
</style>
