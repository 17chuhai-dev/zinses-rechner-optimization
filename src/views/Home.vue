<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Zinses Rechner
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Professioneller Zinseszins-Rechner für Deutschland. 
          Berechnen Sie Ihre Zinserträge mit deutscher Steuerberechnung.
        </p>
        <router-link 
          to="/calculator" 
          class="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Jetzt berechnen
        </router-link>
      </div>

      <div class="grid md:grid-cols-3 gap-8 mt-16">
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <div class="text-blue-600 text-3xl mb-4">📊</div>
          <h3 class="text-xl font-semibold mb-2">Präzise Berechnung</h3>
          <p class="text-gray-600">
            Exakte Zinseszins-Berechnung mit verschiedenen Zahlungsfrequenzen
          </p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-lg">
          <div class="text-blue-600 text-3xl mb-4">🇩🇪</div>
          <h3 class="text-xl font-semibold mb-2">Deutsche Steuern</h3>
          <p class="text-gray-600">
            Automatische Berechnung von Kapitalertragsteuer und Solidaritätszuschlag
          </p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-lg">
          <div class="text-blue-600 text-3xl mb-4">📈</div>
          <h3 class="text-xl font-semibold mb-2">Visualisierung</h3>
          <p class="text-gray-600">
            Interaktive Diagramme und detaillierte Aufschlüsselung
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Home page component
</script>
