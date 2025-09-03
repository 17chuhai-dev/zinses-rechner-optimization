<template>
  <div class="vergleich-hub">
    <!-- Hero Section -->
    <section class="hero-section bg-gradient-to-br from-orange-50 to-red-100 py-16">
      <div class="container mx-auto px-4">
        <div class="text-center max-w-4xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Finanzprodukte vergleichen
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Finden Sie die besten Konditionen für Ihre Finanzprodukte. 
            Objektive Vergleiche nach deutschen Standards.
          </p>
          
          <!-- Quick Compare Buttons -->
          <div class="flex flex-wrap justify-center gap-4 mb-8">
            <button
              v-for="quickCompare in quickCompares"
              :key="quickCompare.type"
              @click="selectedComparison = quickCompare.type"
              :class="[
                'px-6 py-3 rounded-full font-medium transition-colors',
                selectedComparison === quickCompare.type
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              ]"
            >
              {{ quickCompare.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Comparison Tools -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-gray-900 mb-12 text-center">
          Vergleichstools
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="tool in comparisonTools"
            :key="tool.id"
            class="comparison-tool bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
          >
            <!-- Tool Header -->
            <div class="p-6 border-b border-gray-100">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="tool.iconBg">
                  <svg class="w-6 h-6" :class="tool.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tool.iconPath"></path>
                  </svg>
                </div>
                <span :class="tool.badgeClass" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium">
                  {{ tool.category }}
                </span>
              </div>
              
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                {{ tool.name }}
              </h3>
              <p class="text-gray-600 text-sm">
                {{ tool.description }}
              </p>
            </div>

            <!-- Tool Features -->
            <div class="p-6">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Vergleichskriterien:</h4>
              <ul class="space-y-2 mb-6">
                <li v-for="feature in tool.features" :key="feature" class="flex items-center text-sm text-gray-600">
                  <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ feature }}
                </li>
              </ul>

              <!-- Action Button -->
              <router-link
                :to="tool.route"
                class="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-block text-center"
              >
                Jetzt vergleichen
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Current Rates Section -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-gray-900 mb-12 text-center">
          Aktuelle Konditionen
        </h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Interest Rates Table -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="p-6 border-b border-gray-100">
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                Zinssätze im Überblick
              </h3>
              <p class="text-gray-600 text-sm">
                Stand: {{ currentDate }} | Quelle: Deutsche Bundesbank
              </p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produkt
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zinssatz
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="rate in interestRates" :key="rate.product">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ rate.product }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ rate.rate }}%
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span :class="getTrendClass(rate.trend)" class="inline-flex items-center">
                        <svg v-if="rate.trend === 'up'" class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                        </svg>
                        <svg v-else-if="rate.trend === 'down'" class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 15.586l3.293-3.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                        <svg v-else class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        {{ getTrendLabel(rate.trend) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Top Offers -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="p-6 border-b border-gray-100">
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                Top-Angebote des Monats
              </h3>
              <p class="text-gray-600 text-sm">
                Besonders attraktive Konditionen
              </p>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div v-for="offer in topOffers" :key="offer.id" class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium text-gray-900">{{ offer.product }}</h4>
                    <span class="text-lg font-bold text-green-600">{{ offer.rate }}%</span>
                  </div>
                  <p class="text-sm text-gray-600 mb-3">{{ offer.description }}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">{{ offer.provider }}</span>
                    <button class="text-orange-600 hover:text-orange-700 text-sm font-medium">
                      Details →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-gray-900 mb-12 text-center">
          So funktioniert unser Vergleich
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-orange-600">1</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Kriterien eingeben
            </h3>
            <p class="text-gray-600">
              Geben Sie Ihre Anforderungen und Wünsche ein. Wir berücksichtigen alle relevanten Faktoren.
            </p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-orange-600">2</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Angebote vergleichen
            </h3>
            <p class="text-gray-600">
              Wir zeigen Ihnen die besten Angebote übersichtlich sortiert nach Ihren Prioritäten.
            </p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-orange-600">3</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Beste Wahl treffen
            </h3>
            <p class="text-gray-600">
              Mit detaillierten Informationen und Bewertungen finden Sie das optimale Produkt.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 bg-orange-600">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">
          Sparen Sie Zeit und Geld
        </h2>
        <p class="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
          Unser kostenloser Vergleichsservice hilft Ihnen dabei, die besten Konditionen zu finden.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/vergleich/tagesgeld-zinsen"
            class="bg-white text-orange-600 font-medium py-3 px-8 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Tagesgeld vergleichen
          </router-link>
          <router-link
            to="/vergleich/etf-kosten-vergleich"
            class="bg-orange-700 text-white font-medium py-3 px-8 rounded-lg hover:bg-orange-800 transition-colors duration-200"
          >
            ETF-Kosten vergleichen
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Reactive data
const selectedComparison = ref('tagesgeld')

// Static data
const quickCompares = [
  { type: 'tagesgeld', label: 'Tagesgeld' },
  { type: 'festgeld', label: 'Festgeld' },
  { type: 'etf', label: 'ETF-Kosten' },
  { type: 'kredit', label: 'Kredite' },
  { type: 'baufinanzierung', label: 'Baufinanzierung' }
]

const comparisonTools = [
  {
    id: 'tagesgeld',
    name: 'Tagesgeld-Vergleich',
    description: 'Finden Sie die besten Tagesgeld-Konditionen mit Einlagensicherung',
    category: 'Sparen',
    features: ['Zinssätze vergleichen', 'Einlagensicherung prüfen', 'Mindestanlage beachten', 'Verfügbarkeit bewerten'],
    route: '/vergleich/tagesgeld-zinsen',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    badgeClass: 'bg-green-100 text-green-800'
  },
  {
    id: 'festgeld',
    name: 'Festgeld-Vergleich',
    description: 'Vergleichen Sie Festgeld-Angebote verschiedener Laufzeiten',
    category: 'Sparen',
    features: ['Laufzeiten 1-10 Jahre', 'Garantierte Zinsen', 'Europäische Banken', 'Mindestanlage ab 1.000€'],
    route: '/vergleich/festgeld-zinsen',
    iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'etf-kosten',
    name: 'ETF-Kosten-Vergleich',
    description: 'Vergleichen Sie TER, Tracking Error und Performance von ETFs',
    category: 'Investment',
    features: ['TER-Vergleich', 'Tracking Error', 'Fondsvolumen', 'Replikationsmethode'],
    route: '/vergleich/etf-kosten-vergleich',
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    badgeClass: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'kredit',
    name: 'Kredit-Vergleich',
    description: 'Finden Sie günstige Ratenkredite mit fairen Konditionen',
    category: 'Finanzierung',
    features: ['Effektiver Jahreszins', 'Flexible Laufzeiten', 'Sondertilgungen', 'Schnelle Bearbeitung'],
    route: '/vergleich/kredit-zinsen',
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-800'
  },
  {
    id: 'baufinanzierung',
    name: 'Baufinanzierung-Vergleich',
    description: 'Vergleichen Sie Hypothekenzinsen und Konditionen',
    category: 'Immobilien',
    features: ['Sollzinsen vergleichen', 'Tilgungsoptionen', 'Sondertilgungen', 'Förderungen berücksichtigen'],
    route: '/vergleich/baufinanzierung-zinsen',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    badgeClass: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'girokonto',
    name: 'Girokonto-Vergleich',
    description: 'Finden Sie das passende Girokonto ohne versteckte Kosten',
    category: 'Banking',
    features: ['Kontoführungsgebühren', 'Girocard inklusive', 'Online-Banking', 'Filialnetz'],
    route: '/vergleich/girokonto-kosten',
    iconPath: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    badgeClass: 'bg-indigo-100 text-indigo-800'
  }
]

const interestRates = [
  { product: 'Tagesgeld', rate: '3.25', trend: 'up' },
  { product: 'Festgeld 1 Jahr', rate: '3.80', trend: 'stable' },
  { product: 'Festgeld 5 Jahre', rate: '3.45', trend: 'down' },
  { product: 'Ratenkredit', rate: '4.95', trend: 'stable' },
  { product: 'Baufinanzierung', rate: '3.85', trend: 'up' }
]

const topOffers = [
  {
    id: 1,
    product: 'Tagesgeld Premium',
    rate: '3.50',
    description: 'Bis 100.000€, 6 Monate Garantiezins',
    provider: 'Direktbank24'
  },
  {
    id: 2,
    product: 'Festgeld 2 Jahre',
    rate: '4.10',
    description: 'Mindestanlage 5.000€, EU-Einlagensicherung',
    provider: 'EuropaBank'
  },
  {
    id: 3,
    product: 'Ratenkredit Spezial',
    rate: '3.99',
    description: 'Für Bestandskunden, bis 50.000€',
    provider: 'FinanzPartner'
  }
]

const currentDate = computed(() => {
  return new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
})

// Methods
const getTrendClass = (trend: string): string => {
  const classes = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  }
  return classes[trend as keyof typeof classes] || 'text-gray-600'
}

const getTrendLabel = (trend: string): string => {
  const labels = {
    up: 'Steigend',
    down: 'Fallend',
    stable: 'Stabil'
  }
  return labels[trend as keyof typeof labels] || 'Unbekannt'
}
</script>

<style scoped>
.comparison-tool:hover {
  transform: translateY(-4px);
  transition: transform 0.3s ease;
}

.hero-section {
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(251, 146, 60, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.1) 0%, transparent 50%);
}
</style>
