<template>
  <div class="api-docs-page">
    <!-- 页面头部 -->
    <div class="hero-section bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold mb-4">🚀 Zinseszins-Rechner API</h1>
        <p class="text-xl mb-6">
          Professionelle API für präzise Zinseszins-Berechnungen und deutsche Steuerkalkulationen
        </p>
        <div class="flex flex-wrap gap-4">
          <a
            :href="apiDocsUrl"
            target="_blank"
            class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            📖 Interaktive API-Dokumentation
          </a>
          <a
            :href="redocUrl"
            target="_blank"
            class="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
          >
            📚 ReDoc-Dokumentation
          </a>
        </div>
      </div>
    </div>

    <!-- API概览 -->
    <div class="container mx-auto px-4 py-12">
      <div class="grid md:grid-cols-2 gap-8 mb-12">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-2xl font-bold mb-4 text-gray-800">🎯 API-Übersicht</h2>
          <ul class="space-y-3 text-gray-600">
            <li class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Hochpräzise Zinseszins-Berechnung
            </li>
            <li class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Deutsche Steuerberechnung integriert
            </li>
            <li class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              RESTful JSON API
            </li>
            <li class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              DSGVO-konforme Datenverarbeitung
            </li>
            <li class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Rate Limiting und Sicherheit
            </li>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-2xl font-bold mb-4 text-gray-800">⚡ Schnellstart</h2>
          <div class="bg-gray-100 rounded p-4 text-sm">
            <pre><code>// Basis-URL
const API_BASE = '{{ apiBaseUrl }}'

// Einfache Berechnung
const response = await fetch(`${API_BASE}/api/v1/calculator/compound-interest`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    principal: 10000,
    annual_rate: 4.0,
    years: 10,
    monthly_payment: 500,
    compound_frequency: 'monthly'
  })
})

const result = await response.json()
console.log(`Endkapital: ${result.final_amount}€`)</code></pre>
          </div>
        </div>
      </div>

      <!-- API端点列表 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-12">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">📋 API-Endpunkte</h2>

        <div class="space-y-6">
          <!-- 计算端点 -->
          <div class="border-l-4 border-blue-500 pl-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              🧮 Zinseszins-Berechnung
            </h3>
            <p class="text-gray-600 mb-2">
              <code class="bg-gray-100 px-2 py-1 rounded">POST /api/v1/calculator/compound-interest</code>
            </p>
            <p class="text-gray-600">
              Führt eine vollständige Zinseszins-Berechnung mit deutschen Steueraspekten durch.
            </p>
          </div>

          <!-- Limits端点 -->
          <div class="border-l-4 border-green-500 pl-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              📏 Berechnungslimits
            </h3>
            <p class="text-gray-600 mb-2">
              <code class="bg-gray-100 px-2 py-1 rounded">GET /api/v1/calculator/limits</code>
            </p>
            <p class="text-gray-600">
              Gibt die aktuellen API-Limits für Validierung und Benutzerführung zurück.
            </p>
          </div>

          <!-- 健康检查端点 -->
          <div class="border-l-4 border-yellow-500 pl-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              🏥 Gesundheitscheck
            </h3>
            <p class="text-gray-600 mb-2">
              <code class="bg-gray-100 px-2 py-1 rounded">GET /health</code>
            </p>
            <p class="text-gray-600">
              Überprüft den API-Status für Monitoring und Verfügbarkeitsprüfungen.
            </p>
          </div>
        </div>
      </div>

      <!-- 使用示例 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-12">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">💡 Verwendungsbeispiele</h2>

        <div class="space-y-8">
          <!-- JavaScript示例 -->
          <div>
            <h3 class="text-lg font-semibold mb-3">JavaScript / TypeScript</h3>
            <div class="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
              <pre><code>// Zinseszins-Rechner API Client
class ZinseszinsAPI {
  constructor(baseUrl = '{{ apiBaseUrl }}') {
    this.baseUrl = baseUrl
  }

  async calculate(params) {
    const response = await fetch(`${this.baseUrl}/api/v1/calculator/compound-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  }

  async getLimits() {
    const response = await fetch(`${this.baseUrl}/api/v1/calculator/limits`)
    return await response.json()
  }
}

// Verwendung
const api = new ZinseszinsAPI()
const result = await api.calculate({
  principal: 25000,
  annual_rate: 4.5,
  years: 15,
  monthly_payment: 300,
  compound_frequency: 'monthly'
})

console.log(`Nach 15 Jahren: ${result.final_amount.toLocaleString('de-DE')}€`)</code></pre>
            </div>
          </div>

          <!-- Python示例 -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Python</h3>
            <div class="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
              <pre><code>import requests
import json

class ZinseszinsAPI:
    def __init__(self, base_url='{{ apiBaseUrl }}'):
        self.base_url = base_url

    def calculate(self, params):
        response = requests.post(
            f'{self.base_url}/api/v1/calculator/compound-interest',
            json=params
        )
        response.raise_for_status()
        return response.json()

    def get_limits(self):
        response = requests.get(f'{self.base_url}/api/v1/calculator/limits')
        return response.json()

# Verwendung
api = ZinseszinsAPI()
result = api.calculate({
    'principal': 25000,
    'annual_rate': 4.5,
    'years': 15,
    'monthly_payment': 300,
    'compound_frequency': 'monthly'
})

print(f"Nach 15 Jahren: {result['final_amount']:,.2f}€")</code></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误处理 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-12">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">🚨 Fehlerbehandlung</h2>

        <div class="space-y-4">
          <div class="border border-red-200 rounded-lg p-4">
            <h3 class="font-semibold text-red-800 mb-2">422 - Validierungsfehler</h3>
            <p class="text-gray-600 mb-2">Ungültige Eingabeparameter</p>
            <div class="bg-gray-100 rounded p-3 text-sm">
              <pre><code>{
  "detail": {
    "error": "VALIDATION_ERROR",
    "message": "Das Startkapital muss zwischen 1€ und 10.000.000€ liegen",
    "field": "principal",
    "code": "INVALID_PRINCIPAL"
  }
}</code></pre>
            </div>
          </div>

          <div class="border border-yellow-200 rounded-lg p-4">
            <h3 class="font-semibold text-yellow-800 mb-2">429 - Rate Limit überschritten</h3>
            <p class="text-gray-600 mb-2">Zu viele Anfragen in kurzer Zeit</p>
            <div class="bg-gray-100 rounded p-3 text-sm">
              <pre><code>{
  "detail": "Rate limit exceeded. Try again in 15 minutes.",
  "retry_after": 900
}</code></pre>
            </div>
          </div>

          <div class="border border-red-200 rounded-lg p-4">
            <h3 class="font-semibold text-red-800 mb-2">500 - Serverfehler</h3>
            <p class="text-gray-600 mb-2">Unerwarteter Berechnungsfehler</p>
            <div class="bg-gray-100 rounded p-3 text-sm">
              <pre><code>{
  "detail": {
    "error": "CALCULATION_ERROR",
    "message": "Ein Fehler ist bei der Berechnung aufgetreten",
    "code": "INTERNAL_ERROR"
  }
}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 支持信息 -->
      <div class="bg-blue-50 rounded-lg p-6">
        <h2 class="text-2xl font-bold mb-4 text-gray-800">🆘 Support & Kontakt</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div>
            <h3 class="font-semibold mb-2">📧 E-Mail Support</h3>
            <p class="text-gray-600">support@zinses-rechner.de</p>
          </div>
          <div>
            <h3 class="font-semibold mb-2">📚 Dokumentation</h3>
            <p class="text-gray-600">zinses-rechner.de/docs</p>
          </div>
          <div>
            <h3 class="font-semibold mb-2">🐛 Bug Reports</h3>
            <p class="text-gray-600">GitHub Issues</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 全局变量声明
declare const useHead: (meta: any) => void

// SEO Meta
useHead({
  title: 'API-Dokumentation - Zinseszins-Rechner',
  meta: [
    {
      name: 'description',
      content: 'Vollständige API-Dokumentation für den Zinseszins-Rechner. RESTful API für präzise Finanzberechnungen mit deutscher Steuerintegration.'
    },
    {
      name: 'keywords',
      content: 'API, Zinseszins API, Finanz API, Deutsche Steuer API, REST API, OpenAPI, Swagger'
    }
  ]
})

// API URLs
const apiBaseUrl = computed(() => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
})

const apiDocsUrl = computed(() => {
  return `${apiBaseUrl.value}/api/docs`
})

const redocUrl = computed(() => {
  return `${apiBaseUrl.value}/api/redoc`
})
</script>

<style scoped>
.api-docs-page {
  min-height: 100vh;
  background-color: #f8fafc;
}

.hero-section {
  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.container {
  max-width: 1200px;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 0;
  }

  .hero-section h1 {
    font-size: 2rem;
  }

  .hero-section p {
    font-size: 1rem;
  }
}
</style>
