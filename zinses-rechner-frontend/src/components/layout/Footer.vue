<template>
  <footer class="bg-gray-50 border-t border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Logo和描述 -->
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-3 mb-4">
            <BaseIcon name="calculator" class="text-primary-600" size="lg" />
            <div>
              <h3 class="text-lg font-bold text-gray-900">Zinses-Rechner</h3>
              <p class="text-sm text-gray-600">Kostenloser Online-Rechner</p>
            </div>
          </div>
          <p class="text-gray-600 mb-4 max-w-md">
            Berechnen Sie Ihre finanzielle Zukunft mit unseren präzisen und kostenlosen Online-Rechnern. 
            Alle Berechnungen erfolgen lokal in Ihrem Browser - Ihre Daten bleiben privat.
          </p>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <BaseIcon name="shield-check" size="sm" class="text-green-600" />
              <span>100% kostenlos</span>
            </div>
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <BaseIcon name="lock-closed" size="sm" class="text-green-600" />
              <span>DSGVO-konform</span>
            </div>
          </div>
        </div>

        <!-- Rechner -->
        <div>
          <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Rechner
          </h4>
          <ul class="space-y-3">
            <li>
              <router-link
                to="/zinseszins-rechner"
                class="text-gray-600 hover:text-primary-600 transition-colors text-sm"
              >
                Zinseszins-Rechner
              </router-link>
            </li>
            <li>
              <router-link
                to="/darlehensrechner"
                class="text-gray-600 hover:text-primary-600 transition-colors text-sm"
              >
                Darlehensrechner
              </router-link>
            </li>
            <li>
              <router-link
                to="/baufinanzierungsrechner"
                class="text-gray-600 hover:text-primary-600 transition-colors text-sm"
              >
                Baufinanzierungsrechner
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Informationen -->
        <div>
          <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Informationen
          </h4>
          <ul class="space-y-3">
            <li>
              <router-link
                to="/ratgeber"
                class="text-gray-600 hover:text-primary-600 transition-colors text-sm"
              >
                Ratgeber
              </router-link>
            </li>
            <li>
              <router-link
                to="/faq"
                class="text-gray-600 hover:text-primary-600 transition-colors text-sm"
              >
                Häufige Fragen
              </router-link>
            </li>
            <li>
              <router-link
                to="/impressum"
                class="text-gray-600 hover:text-primary-600 transition-colors text-sm"
              >
                Impressum
              </router-link>
            </li>
            <li>
              <router-link
                to="/datenschutz"
                class="text-gray-600 hover:text-primary-600 transition-colors text-sm"
              >
                Datenschutz
              </router-link>
            </li>
          </ul>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="border-t border-gray-200 mt-8 pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <!-- 版权信息 -->
          <div class="text-sm text-gray-600">
            {{ FOOTER_CONTENT.copyright }}
          </div>

          <!-- 免责声明 -->
          <div class="text-sm text-gray-500 text-center md:text-right">
            {{ FOOTER_CONTENT.disclaimer }}
          </div>
        </div>

        <!-- 额外的法律信息 -->
        <div class="mt-4 text-xs text-gray-500 text-center">
          <p>
            Alle Berechnungen sind unverbindlich und ohne Gewähr. 
            Die Ergebnisse dienen nur zur Orientierung und ersetzen keine professionelle Finanzberatung.
          </p>
          <p class="mt-2">
            Diese Website verwendet keine Cookies für Tracking oder Werbung. 
            Nur technisch notwendige Cookies werden verwendet.
          </p>
        </div>
      </div>
    </div>

    <!-- 德国标识 -->
    <div class="bg-gray-100 py-3">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <span class="text-lg">🇩🇪</span>
          <span>Entwickelt in Deutschland</span>
          <span class="text-gray-400">•</span>
          <span>DSGVO-konform</span>
          <span class="text-gray-400">•</span>
          <span>Keine Datenübertragung</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import BaseIcon from '../ui/BaseIcon.vue'
import { FOOTER_CONTENT } from '@/utils/germanContent'
</script>

<style scoped>
/* Footer特定样式 */
footer {
  margin-top: auto;
}
</style>
