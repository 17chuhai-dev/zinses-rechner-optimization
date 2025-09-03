<template>
  <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo和标题 -->
        <div class="flex items-center space-x-3">
          <router-link to="/" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <BaseIcon name="calculator" class="text-primary-600" size="lg" />
            <div class="flex flex-col">
              <h1 class="text-xl font-bold text-gray-900">Zinses-Rechner</h1>
              <p class="text-xs text-gray-500 hidden sm:block">Kostenloser Online-Rechner</p>
            </div>
          </router-link>
        </div>

        <!-- 桌面端导航 -->
        <nav class="hidden md:flex items-center space-x-8">
          <router-link
            to="/"
            class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="{ 'text-primary-600 bg-primary-50': $route.path === '/' }"
          >
            Startseite
          </router-link>

          <div class="relative group">
            <button class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
              <span>Rechner</span>
              <BaseIcon name="chevron-down" size="sm" />
            </button>

            <!-- 下拉菜单 -->
            <div class="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="py-2">
                <router-link
                  to="/zinseszins-rechner"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <BaseIcon name="trending-up" size="sm" class="text-primary-600" />
                    <div>
                      <div class="font-medium">Zinseszins-Rechner</div>
                      <div class="text-xs text-gray-500">Kapitalwachstum berechnen</div>
                    </div>
                  </div>
                </router-link>

                <router-link
                  to="/darlehensrechner"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <BaseIcon name="credit-card" size="sm" class="text-primary-600" />
                    <div>
                      <div class="font-medium">Darlehensrechner</div>
                      <div class="text-xs text-gray-500">Kreditkosten ermitteln</div>
                    </div>
                  </div>
                </router-link>

                <router-link
                  to="/baufinanzierungsrechner"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <BaseIcon name="home" size="sm" class="text-primary-600" />
                    <div>
                      <div class="font-medium">Baufinanzierungsrechner</div>
                      <div class="text-xs text-gray-500">Immobilienfinanzierung</div>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>
          </div>

          <router-link
            to="/market-data"
            class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
            :class="{ 'text-primary-600 bg-primary-50': $route.path === '/market-data' }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Marktdaten</span>
          </router-link>

          <router-link
            to="/ai-analysis"
            class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
            :class="{ 'text-primary-600 bg-primary-50': $route.path === '/ai-analysis' }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>AI-Analyse</span>
            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">NEU</span>
          </router-link>

          <router-link
            to="/ratgeber"
            class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="{ 'text-primary-600 bg-primary-50': $route.path.startsWith('/ratgeber') }"
          >
            Ratgeber
          </router-link>

          <router-link
            to="/faq"
            class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="{ 'text-primary-600 bg-primary-50': $route.path === '/faq' }"
          >
            FAQ
          </router-link>
        </nav>

        <!-- 移动端菜单按钮 -->
        <div class="md:hidden">
          <BaseButton
            variant="ghost"
            size="sm"
            @click="toggleMobileMenu"
          >
            <BaseIcon :name="showMobileMenu ? 'x' : 'menu'" size="sm" />
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <div v-if="showMobileMenu" class="md:hidden bg-white border-t border-gray-200">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <router-link
          to="/"
          class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
          @click="closeMobileMenu"
        >
          Startseite
        </router-link>

        <div class="px-3 py-2">
          <div class="text-sm font-medium text-gray-500 mb-2">Rechner</div>
          <div class="space-y-1 ml-4">
            <router-link
              to="/zinseszins-rechner"
              class="block px-3 py-2 rounded-md text-sm text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
              @click="closeMobileMenu"
            >
              Zinseszins-Rechner
            </router-link>
            <router-link
              to="/darlehensrechner"
              class="block px-3 py-2 rounded-md text-sm text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
              @click="closeMobileMenu"
            >
              Darlehensrechner
            </router-link>
            <router-link
              to="/baufinanzierungsrechner"
              class="block px-3 py-2 rounded-md text-sm text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
              @click="closeMobileMenu"
            >
              Baufinanzierungsrechner
            </router-link>
          </div>
        </div>

        <router-link
          to="/market-data"
          class="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
          @click="closeMobileMenu"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>Marktdaten</span>
        </router-link>

        <router-link
          to="/ai-analysis"
          class="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
          @click="closeMobileMenu"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>AI-Analyse</span>
          <span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium ml-2">NEU</span>
        </router-link>

        <router-link
          to="/ratgeber"
          class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
          @click="closeMobileMenu"
        >
          Ratgeber
        </router-link>

        <router-link
          to="/faq"
          class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
          @click="closeMobileMenu"
        >
          FAQ
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseButton from '../ui/BaseButton.vue'

const showMobileMenu = ref(false)

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}
</script>

<style scoped>
/* 确保下拉菜单在正确的层级 */
.group:hover .absolute {
  z-index: 50;
}
</style>
