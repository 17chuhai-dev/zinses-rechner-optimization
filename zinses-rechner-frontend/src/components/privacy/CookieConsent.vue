<template>
  <div v-if="!hasConsent" class="cookie-consent-overlay">
    <div class="cookie-consent-modal">
      <div class="consent-header">
        <h2 class="text-xl font-bold text-gray-900">🍪 Cookie-Einstellungen</h2>
        <p class="text-gray-600 mt-2">
          Wir respektieren Ihre Privatsphäre und halten uns an die DSGVO-Bestimmungen.
        </p>
      </div>

      <div class="consent-content">
        <div class="cookie-category">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">Notwendige Cookies</h3>
              <p class="text-sm text-gray-600">
                Erforderlich für die Grundfunktionen der Website
              </p>
            </div>
            <div class="toggle-switch disabled">
              <input type="checkbox" checked disabled />
              <span class="slider"></span>
            </div>
          </div>
        </div>

        <div class="cookie-category">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">Analytische Cookies</h3>
              <p class="text-sm text-gray-600">
                Helfen uns, die Website-Nutzung zu verstehen (Google Analytics)
              </p>
            </div>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="preferences.analytics"
                @change="updatePreferences"
              />
              <span class="slider"></span>
            </div>
          </div>
        </div>

        <div class="cookie-category">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">Performance Cookies</h3>
              <p class="text-sm text-gray-600">
                Sammeln anonyme Leistungsdaten zur Website-Optimierung
              </p>
            </div>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="preferences.performance"
                @change="updatePreferences"
              />
              <span class="slider"></span>
            </div>
          </div>
        </div>

        <div class="cookie-category">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">Marketing Cookies</h3>
              <p class="text-sm text-gray-600">
                Für personalisierte Inhalte und Werbung (derzeit nicht verwendet)
              </p>
            </div>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="preferences.marketing"
                @change="updatePreferences"
                disabled
              />
              <span class="slider"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="consent-footer">
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="acceptAll"
            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Alle akzeptieren
          </button>
          <button
            @click="acceptSelected"
            class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Auswahl akzeptieren
          </button>
          <button
            @click="acceptNecessary"
            class="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Nur notwendige
          </button>
        </div>
        
        <div class="mt-4 text-center">
          <router-link 
            to="/datenschutz" 
            class="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Datenschutzerklärung lesen
          </router-link>
          <span class="text-gray-400 mx-2">|</span>
          <button 
            @click="showDetails = !showDetails"
            class="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {{ showDetails ? 'Details ausblenden' : 'Details anzeigen' }}
          </button>
        </div>

        <!-- 详细信息 -->
        <div v-if="showDetails" class="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
          <h4 class="font-semibold mb-2">Cookie-Details:</h4>
          <ul class="space-y-1 text-gray-600">
            <li><strong>Notwendige:</strong> Session-Management, Sicherheit</li>
            <li><strong>Analytische:</strong> Google Analytics (_ga, _gid, _gat)</li>
            <li><strong>Performance:</strong> Web Vitals Metriken (lokal gespeichert)</li>
            <li><strong>Speicherdauer:</strong> 1-24 Monate je nach Typ</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useCookieConsent } from '../../composables/useCookieConsent'

const { 
  hasConsent, 
  preferences, 
  saveConsent, 
  loadConsent,
  initializeAnalytics 
} = useCookieConsent()

const showDetails = ref(false)

// 接受所有Cookie
const acceptAll = () => {
  preferences.necessary = true
  preferences.analytics = true
  preferences.performance = true
  preferences.marketing = false // 当前未使用
  
  saveConsent()
  initializeAnalytics()
}

// 接受选中的Cookie
const acceptSelected = () => {
  saveConsent()
  
  if (preferences.analytics) {
    initializeAnalytics()
  }
}

// 只接受必要Cookie
const acceptNecessary = () => {
  preferences.necessary = true
  preferences.analytics = false
  preferences.performance = false
  preferences.marketing = false
  
  saveConsent()
}

// 更新偏好设置
const updatePreferences = () => {
  // 实时更新偏好设置
  console.log('Cookie preferences updated:', preferences)
}

onMounted(() => {
  loadConsent()
})
</script>

<style scoped>
.cookie-consent-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.cookie-consent-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.consent-header {
  margin-bottom: 1.5rem;
}

.consent-content {
  margin-bottom: 2rem;
}

.cookie-category {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.cookie-category:last-child {
  margin-bottom: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

input:disabled + .slider {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.toggle-switch.disabled {
  opacity: 0.6;
}

.consent-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

@media (max-width: 640px) {
  .cookie-consent-modal {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .consent-footer .flex {
    flex-direction: column;
  }
}
</style>
