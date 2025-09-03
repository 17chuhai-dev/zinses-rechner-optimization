<template>
  <div class="zinseszins-erklaert">
    <!-- Hero Section -->
    <section class="hero-section bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Zinseszins einfach erklärt
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Verstehen Sie die Macht des Zinseszinseffekts und wie er Ihr Vermögen exponentiell wachsen lässt. 
            Mit praktischen Beispielen und interaktiven Berechnungen.
          </p>
          
          <!-- Quick Navigation -->
          <div class="flex flex-wrap justify-center gap-4">
            <a href="#definition" class="bg-white text-blue-600 px-6 py-3 rounded-full font-medium hover:bg-blue-50 transition-colors">
              Was ist Zinseszins?
            </a>
            <a href="#formel" class="bg-white text-blue-600 px-6 py-3 rounded-full font-medium hover:bg-blue-50 transition-colors">
              Die Formel
            </a>
            <a href="#beispiele" class="bg-white text-blue-600 px-6 py-3 rounded-full font-medium hover:bg-blue-50 transition-colors">
              Beispiele
            </a>
            <a href="#rechner" class="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors">
              Jetzt berechnen
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Definition Section -->
    <section id="definition" class="py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-gray-900 mb-8">Was ist Zinseszins?</h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p class="text-lg text-gray-700 mb-6">
                Der <strong>Zinseszinseffekt</strong> beschreibt das Phänomen, dass nicht nur das ursprünglich angelegte Kapital verzinst wird, 
                sondern auch die bereits erhaltenen Zinsen. Diese werden dem Kapital zugeschlagen und erwirtschaften ihrerseits wieder Zinsen.
              </p>
              
              <div class="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
                <h3 class="font-semibold text-blue-900 mb-2">Einfach gesagt:</h3>
                <p class="text-blue-800">
                  "Zinsen auf Zinsen" - Ihr Geld arbeitet nicht nur für Sie, sondern die verdienten Zinsen arbeiten ebenfalls für Sie weiter.
                </p>
              </div>

              <h3 class="text-xl font-semibold text-gray-900 mb-4">Warum ist das so mächtig?</h3>
              <ul class="space-y-3 text-gray-700">
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span><strong>Exponentielles Wachstum:</strong> Das Vermögen wächst nicht linear, sondern beschleunigt sich über die Zeit</span>
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span><strong>Zeit ist entscheidend:</strong> Je länger die Laufzeit, desto stärker der Effekt</span>
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span><strong>Automatisches Wachstum:</strong> Ohne zusätzlichen Aufwand vermehrt sich das Kapital</span>
                </li>
              </ul>
            </div>
            
            <!-- Visual Representation -->
            <div class="bg-white rounded-xl shadow-lg p-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-6 text-center">Zinseszins visualisiert</h3>
              <div class="space-y-4">
                <div class="flex items-center">
                  <div class="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                  <span class="text-sm text-gray-600">Jahr 1:</span>
                  <span class="ml-auto font-medium">1.000€ + 50€ Zinsen = 1.050€</span>
                </div>
                <div class="flex items-center">
                  <div class="w-4 h-4 bg-blue-600 rounded mr-3"></div>
                  <span class="text-sm text-gray-600">Jahr 2:</span>
                  <span class="ml-auto font-medium">1.050€ + 52,50€ Zinsen = 1.102,50€</span>
                </div>
                <div class="flex items-center">
                  <div class="w-4 h-4 bg-blue-700 rounded mr-3"></div>
                  <span class="text-sm text-gray-600">Jahr 3:</span>
                  <span class="ml-auto font-medium">1.102,50€ + 55,13€ Zinsen = 1.157,63€</span>
                </div>
                <div class="border-t pt-4">
                  <div class="flex items-center font-semibold">
                    <div class="w-4 h-4 bg-green-500 rounded mr-3"></div>
                    <span class="text-sm text-gray-900">Nach 10 Jahren:</span>
                    <span class="ml-auto text-green-600">1.628,89€</span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-4 text-center">
                Bei 5% Zinsen p.a. und 1.000€ Startkapital
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Formula Section -->
    <section id="formel" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Die Zinseszins-Formel</h2>
          
          <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div class="text-center mb-8">
              <div class="bg-blue-50 rounded-lg p-6 inline-block">
                <div class="text-2xl font-mono font-bold text-blue-900 mb-2">
                  K<sub>n</sub> = K<sub>0</sub> × (1 + p)<sup>n</sup>
                </div>
                <p class="text-sm text-blue-700">Die grundlegende Zinseszins-Formel</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Formel-Erklärung:</h3>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <span class="font-mono font-bold text-blue-600 w-8">K<sub>n</sub></span>
                    <span class="text-gray-700">= Endkapital nach n Jahren</span>
                  </div>
                  <div class="flex items-center">
                    <span class="font-mono font-bold text-blue-600 w-8">K<sub>0</sub></span>
                    <span class="text-gray-700">= Anfangskapital (Startbetrag)</span>
                  </div>
                  <div class="flex items-center">
                    <span class="font-mono font-bold text-blue-600 w-8">p</span>
                    <span class="text-gray-700">= Zinssatz (als Dezimalzahl, z.B. 0,05 für 5%)</span>
                  </div>
                  <div class="flex items-center">
                    <span class="font-mono font-bold text-blue-600 w-8">n</span>
                    <span class="text-gray-700">= Anzahl der Jahre</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Beispielrechnung:</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-sm text-gray-600 mb-2">Gegeben:</p>
                  <ul class="text-sm space-y-1 mb-4">
                    <li>• Startkapital: 10.000€</li>
                    <li>• Zinssatz: 4% pro Jahr</li>
                    <li>• Laufzeit: 15 Jahre</li>
                  </ul>
                  
                  <p class="text-sm text-gray-600 mb-2">Berechnung:</p>
                  <div class="font-mono text-sm space-y-1">
                    <div>K<sub>15</sub> = 10.000€ × (1 + 0,04)<sup>15</sup></div>
                    <div>K<sub>15</sub> = 10.000€ × 1,04<sup>15</sup></div>
                    <div>K<sub>15</sub> = 10.000€ × 1,8009</div>
                    <div class="font-bold text-green-600">K<sub>15</sub> = 18.009€</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Extended Formula for Regular Payments -->
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h3 class="text-xl font-semibold text-gray-900 mb-6 text-center">
              Erweiterte Formel für regelmäßige Einzahlungen
            </h3>
            
            <div class="text-center mb-6">
              <div class="bg-green-50 rounded-lg p-6 inline-block">
                <div class="text-xl font-mono font-bold text-green-900 mb-2">
                  K<sub>n</sub> = K<sub>0</sub> × (1 + p)<sup>n</sup> + R × [((1 + p)<sup>n</sup> - 1) / p]
                </div>
                <p class="text-sm text-green-700">Für Sparpläne mit regelmäßigen Einzahlungen</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 class="font-semibold text-gray-900 mb-3">Zusätzliche Variable:</h4>
                <div class="flex items-center">
                  <span class="font-mono font-bold text-green-600 w-8">R</span>
                  <span class="text-gray-700">= Regelmäßige Einzahlung (z.B. monatlich)</span>
                </div>
              </div>
              
              <div>
                <h4 class="font-semibold text-gray-900 mb-3">Anwendung:</h4>
                <p class="text-sm text-gray-700">
                  Diese Formel verwenden Sie, wenn Sie zusätzlich zum Startkapital 
                  regelmäßig Geld einzahlen (z.B. bei einem Sparplan).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Examples Section -->
    <section id="beispiele" class="py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-bold text-gray-900 mb-12 text-center">Praktische Beispiele</h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Example 1: Einstein Quote -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8">
              <div class="text-center mb-6">
                <svg class="w-16 h-16 text-blue-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Das Einstein-Zitat</h3>
              </div>
              
              <blockquote class="text-center italic text-gray-700 mb-6">
                "Der Zinseszins ist das achte Weltwunder. Wer ihn versteht, verdient daran; wer ihn nicht versteht, bezahlt ihn."
              </blockquote>
              <p class="text-center text-sm text-gray-600">- Albert Einstein (zugeschrieben)</p>
              
              <div class="mt-6 bg-white rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Was bedeutet das?</h4>
                <p class="text-sm text-gray-700">
                  Einstein erkannte die immense Kraft des Zinseszinseffekts. Wer früh anfängt zu sparen und investieren, 
                  profitiert davon. Wer Schulden hat, zahlt hingegen Zinseszinsen an andere.
                </p>
              </div>
            </div>

            <!-- Example 2: The Penny Doubling -->
            <div class="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-8">
              <div class="text-center mb-6">
                <svg class="w-16 h-16 text-green-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Der Cent-Verdopplungs-Trick</h3>
              </div>
              
              <div class="mb-6">
                <p class="text-gray-700 mb-4">
                  Stellen Sie sich vor, Sie bekommen 30 Tage lang jeden Tag das Doppelte des Vortages, 
                  beginnend mit 1 Cent am ersten Tag:
                </p>
                
                <div class="bg-white rounded-lg p-4 space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Tag 1:</span>
                    <span class="font-mono">0,01€</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Tag 10:</span>
                    <span class="font-mono">5,12€</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Tag 20:</span>
                    <span class="font-mono">5.242,88€</span>
                  </div>
                  <div class="flex justify-between border-t pt-2 font-bold text-green-600">
                    <span>Tag 30:</span>
                    <span class="font-mono">5.368.709,12€</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Die Lehre:</h4>
                <p class="text-sm text-gray-700">
                  Exponentielles Wachstum ist am Anfang kaum spürbar, wird aber mit der Zeit unglaublich mächtig. 
                  Geduld und Zeit sind beim Vermögensaufbau entscheidend.
                </p>
              </div>
            </div>
          </div>

          <!-- Real World Example -->
          <div class="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h3 class="text-2xl font-semibold text-gray-900 mb-8 text-center">
              Realistisches Beispiel: Der frühe Sparer vs. der späte Sparer
            </h3>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Early Saver -->
              <div class="border-2 border-green-200 rounded-lg p-6">
                <div class="text-center mb-4">
                  <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span class="text-2xl">🐰</span>
                  </div>
                  <h4 class="text-lg font-semibold text-green-800">Anna (der frühe Sparer)</h4>
                </div>
                
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span>Alter beim Start:</span>
                    <span class="font-semibold">25 Jahre</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Monatliche Sparrate:</span>
                    <span class="font-semibold">200€</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Spardauer:</span>
                    <span class="font-semibold">10 Jahre (bis 35)</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Gesamte Einzahlungen:</span>
                    <span class="font-semibold">24.000€</span>
                  </div>
                  <div class="flex justify-between border-t pt-2">
                    <span>Zinssatz:</span>
                    <span class="font-semibold">6% p.a.</span>
                  </div>
                  <div class="flex justify-between font-bold text-green-600 text-base border-t pt-2">
                    <span>Kapital mit 65:</span>
                    <span>201.143€</span>
                  </div>
                </div>
              </div>

              <!-- Late Saver -->
              <div class="border-2 border-orange-200 rounded-lg p-6">
                <div class="text-center mb-4">
                  <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span class="text-2xl">🐢</span>
                  </div>
                  <h4 class="text-lg font-semibold text-orange-800">Ben (der späte Sparer)</h4>
                </div>
                
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span>Alter beim Start:</span>
                    <span class="font-semibold">35 Jahre</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Monatliche Sparrate:</span>
                    <span class="font-semibold">200€</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Spardauer:</span>
                    <span class="font-semibold">30 Jahre (bis 65)</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Gesamte Einzahlungen:</span>
                    <span class="font-semibold">72.000€</span>
                  </div>
                  <div class="flex justify-between border-t pt-2">
                    <span>Zinssatz:</span>
                    <span class="font-semibold">6% p.a.</span>
                  </div>
                  <div class="flex justify-between font-bold text-orange-600 text-base border-t pt-2">
                    <span>Kapital mit 65:</span>
                    <span>200.903€</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6">
              <h4 class="font-semibold text-blue-900 mb-2">Erstaunliches Ergebnis:</h4>
              <p class="text-blue-800">
                Anna hat nur <strong>24.000€</strong> eingezahlt und erreicht fast das gleiche Endkapital wie Ben, 
                der <strong>72.000€</strong> eingezahlt hat. Der Unterschied? Anna hat 10 Jahre früher angefangen!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Calculator CTA -->
    <section id="rechner" class="py-16 bg-blue-600">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">
          Berechnen Sie Ihren eigenen Zinseszinseffekt
        </h2>
        <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Nutzen Sie unseren kostenlosen Zinseszins-Rechner und sehen Sie, 
          wie Ihr Vermögen über die Jahre wachsen kann.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/zinseszins-rechner"
            class="bg-white text-blue-600 font-medium py-4 px-8 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-lg"
          >
            Zinseszins-Rechner starten
          </router-link>
          <router-link
            to="/etf-sparplan-rechner"
            class="bg-blue-700 text-white font-medium py-4 px-8 rounded-lg hover:bg-blue-800 transition-colors duration-200 text-lg"
          >
            ETF-Sparplan berechnen
          </router-link>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-gray-900 mb-12 text-center">
            Häufig gestellte Fragen zum Zinseszins
          </h2>
          
          <div class="space-y-6">
            <div v-for="(faq, index) in faqs" :key="index" class="bg-white rounded-lg shadow-sm">
              <button
                @click="toggleFaq(index)"
                class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
              >
                <h3 class="font-semibold text-gray-900">{{ faq.question }}</h3>
                <svg
                  :class="{ 'rotate-180': openFaq === index }"
                  class="w-5 h-5 text-gray-500 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div v-show="openFaq === index" class="px-6 pb-4">
                <p class="text-gray-700" v-html="faq.answer"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Reactive data
const openFaq = ref<number | null>(null)

// FAQ data
const faqs = [
  {
    question: "Wie oft werden die Zinsen beim Zinseszins gutgeschrieben?",
    answer: "Das hängt vom jeweiligen Finanzprodukt ab. Bei Tagesgeld meist jährlich, bei Sparplänen oft monatlich oder quartalsweise. Je häufiger die Gutschrift, desto stärker der Zinseszinseffekt."
  },
  {
    question: "Funktioniert der Zinseszinseffekt auch bei ETFs und Aktien?",
    answer: "Ja, bei thesaurierenden (wiederanlegenden) ETFs und Aktien mit Dividenden-Reinvestition. Die Erträge werden automatisch wieder angelegt und erwirtschaften ihrerseits neue Erträge."
  },
  {
    question: "Wie wirken sich Steuern auf den Zinseszinseffekt aus?",
    answer: "In Deutschland werden Kapitalerträge mit 25% Abgeltungssteuer besteuert. Bei thesaurierenden ETFs wird die Steuer erst beim Verkauf fällig, was den Zinseszinseffekt verstärkt. Nutzen Sie Ihren <strong>Sparerpauschbetrag</strong> von 1.000€ (2.000€ für Verheiratete)."
  },
  {
    question: "Ab welchem Betrag lohnt sich der Zinseszinseffekt?",
    answer: "Der Zinseszinseffekt funktioniert bei jedem Betrag. Wichtiger als die Höhe ist die <strong>Zeit</strong>. Auch kleine Beträge können über Jahrzehnte zu beachtlichen Summen anwachsen."
  },
  {
    question: "Kann ich den Zinseszinseffekt bei der Inflation berücksichtigen?",
    answer: "Ja, Sie sollten immer die <strong>reale Rendite</strong> betrachten (Nominalzins minus Inflationsrate). Unser Rechner kann die Inflation berücksichtigen und zeigt Ihnen die Kaufkraft Ihres zukünftigen Vermögens."
  },
  {
    question: "Welche Rolle spielt die Häufigkeit der Einzahlungen?",
    answer: "Regelmäßige Einzahlungen (z.B. monatlich) verstärken den Zinseszinseffekt erheblich. Durch den <strong>Cost-Average-Effekt</strong> kaufen Sie bei schwankenden Kursen automatisch günstig ein."
  }
]

// Methods
const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index
}
</script>

<style scoped>
.hero-section {
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
}

html {
  scroll-behavior: smooth;
}
</style>
