<template>
  <div class="mobile-navigation">
    <!-- 移动端顶部导航栏 -->
    <header class="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="flex items-center justify-between px-4 py-3">
        <!-- Logo和标题 -->
        <div class="flex items-center space-x-3">
          <BaseIcon name="calculator" class="text-blue-600" size="lg" />
          <h1 class="text-lg font-semibold text-gray-900">Zinses-Rechner</h1>
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center space-x-2">
          <!-- 搜索按钮 -->
          <BaseButton
            variant="ghost"
            size="sm"
            @click="showSearch = true"
          >
            <BaseIcon name="search" size="sm" />
          </BaseButton>

          <!-- 菜单按钮 -->
          <BaseButton
            variant="ghost"
            size="sm"
            @click="toggleMenu"
          >
            <BaseIcon :name="showMenu ? 'x' : 'menu'" size="sm" />
          </BaseButton>
        </div>
      </div>

      <!-- 搜索栏（展开状态） -->
      <div v-if="showSearch" class="px-4 pb-3">
        <div class="relative">
          <BaseInput
            v-model="searchQuery"
            placeholder="Rechner oder Funktion suchen..."
            class="pl-10"
            @input="handleSearch"
          />
          <BaseIcon
            name="search"
            size="sm"
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <BaseButton
            variant="ghost"
            size="xs"
            class="absolute right-2 top-1/2 transform -translate-y-1/2"
            @click="showSearch = false"
          >
            <BaseIcon name="x" size="xs" />
          </BaseButton>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div
            v-for="result in searchResults"
            :key="result.id"
            class="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            @click="navigateToResult(result)"
          >
            <BaseIcon :name="result.icon" class="text-blue-600" size="sm" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ result.title }}</p>
              <p class="text-xs text-gray-500 truncate">{{ result.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 移动端侧边菜单 -->
    <div
      v-if="showMenu"
      class="lg:hidden fixed inset-0 z-50 flex"
      @click="closeMenu"
    >
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      <!-- 菜单内容 -->
      <div
        class="relative flex flex-col w-80 max-w-xs bg-white shadow-xl"
        @click.stop
      >
        <!-- 菜单头部 -->
        <div class="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <BaseIcon name="calculator" class="text-blue-600" size="lg" />
            <h2 class="text-lg font-semibold text-gray-900">Menü</h2>
          </div>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="closeMenu"
          >
            <BaseIcon name="x" size="sm" />
          </BaseButton>
        </div>

        <!-- 菜单项 -->
        <nav class="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <!-- 计算器分类 -->
          <div class="space-y-1">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Rechner
            </h3>

            <router-link
              v-for="calculator in calculators"
              :key="calculator.id"
              :to="`/calculator/${calculator.id}`"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                $route.params.id === calculator.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
              @click="closeMenu"
            >
              <BaseIcon :name="calculator.icon" size="sm" />
              <span>{{ calculator.name }}</span>
            </router-link>
          </div>

          <!-- 功能分类 -->
          <div class="space-y-1 pt-4">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Funktionen
            </h3>

            <router-link
              to="/history"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                $route.path === '/history'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
              @click="closeMenu"
            >
              <BaseIcon name="clock" size="sm" />
              <span>Verlauf</span>
            </router-link>

            <router-link
              to="/goals"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                $route.path === '/goals'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
              @click="closeMenu"
            >
              <BaseIcon name="target" size="sm" />
              <span>Finanzziele</span>
            </router-link>

            <router-link
              to="/analytics"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                $route.path === '/analytics'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
              @click="closeMenu"
            >
              <BaseIcon name="chart-bar" size="sm" />
              <span>Statistiken</span>
            </router-link>
          </div>

          <!-- 设置和帮助 -->
          <div class="space-y-1 pt-4">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Weitere
            </h3>

            <router-link
              to="/settings"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                $route.path === '/settings'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
              @click="closeMenu"
            >
              <BaseIcon name="cog" size="sm" />
              <span>Einstellungen</span>
            </router-link>

            <router-link
              to="/help"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                $route.path === '/help'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
              @click="closeMenu"
            >
              <BaseIcon name="question-mark-circle" size="sm" />
              <span>Hilfe</span>
            </router-link>
          </div>
        </nav>

        <!-- 菜单底部 -->
        <div class="px-4 py-4 border-t border-gray-200">
          <div class="flex items-center space-x-3 text-sm text-gray-600">
            <BaseIcon name="information-circle" size="sm" />
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端底部导航栏 -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div class="grid grid-cols-5 h-16">
        <router-link
          to="/"
          class="flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors"
          :class="[
            $route.path === '/'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          <BaseIcon name="home" size="sm" />
          <span>Start</span>
        </router-link>

        <router-link
          to="/calculators"
          class="flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors"
          :class="[
            $route.path.startsWith('/calculator')
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          <BaseIcon name="calculator" size="sm" />
          <span>Rechner</span>
        </router-link>

        <router-link
          to="/goals"
          class="flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors"
          :class="[
            $route.path === '/goals'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          <BaseIcon name="target" size="sm" />
          <span>Ziele</span>
        </router-link>

        <router-link
          to="/history"
          class="flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors"
          :class="[
            $route.path === '/history'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          <BaseIcon name="clock" size="sm" />
          <span>Verlauf</span>
        </router-link>

        <router-link
          to="/profile"
          class="flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors"
          :class="[
            $route.path === '/profile'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          <BaseIcon name="user" size="sm" />
          <span>Profil</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseInput from '../ui/BaseInput.vue'

// 状态管理
const showMenu = ref(false)
const showSearch = ref(false)
const searchQuery = ref('')

const route = useRoute()
const router = useRouter()

// 计算器列表（应该从store或service获取）
const calculators = ref([
  { id: 'compound-interest', name: 'Zinseszins-Rechner', icon: 'chart-line' },
  { id: 'loan', name: 'Darlehensrechner', icon: 'credit-card' },
  { id: 'mortgage', name: 'Baufinanzierung', icon: 'home' },
  { id: 'retirement', name: 'Altersvorsorge', icon: 'user-group' },
  { id: 'portfolio', name: 'Portfolio-Analyzer', icon: 'chart-pie' },
  { id: 'tax-optimization', name: 'Steueroptimierung', icon: 'document-text' }
])

// 搜索结果
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []

  const query = searchQuery.value.toLowerCase()
  const results: Array<{
    id: string
    title: string
    description: string
    icon: string
    type: string
    route: string
  }> = []

  // 搜索计算器
  calculators.value.forEach(calc => {
    if (calc.name.toLowerCase().includes(query) || calc.id.toLowerCase().includes(query)) {
      results.push({
        id: calc.id,
        title: calc.name,
        description: 'Rechner',
        icon: calc.icon,
        type: 'calculator',
        route: `/calculator/${calc.id}`
      })
    }
  })

  // 搜索功能页面
  const pages = [
    { id: 'history', title: 'Verlauf', description: 'Berechnungshistorie', icon: 'clock', route: '/history' },
    { id: 'goals', title: 'Finanzziele', description: 'Ziele verwalten', icon: 'target', route: '/goals' },
    { id: 'analytics', title: 'Statistiken', description: 'Nutzungsanalyse', icon: 'chart-bar', route: '/analytics' },
    { id: 'settings', title: 'Einstellungen', description: 'App-Einstellungen', icon: 'cog', route: '/settings' }
  ]

  pages.forEach(page => {
    if (page.title.toLowerCase().includes(query) || page.description.toLowerCase().includes(query)) {
      results.push({
        id: page.id,
        title: page.title,
        description: page.description,
        icon: page.icon,
        type: 'page',
        route: page.route
      })
    }
  })

  return results.slice(0, 5) // 限制结果数量
})

// 方法
const toggleMenu = () => {
  showMenu.value = !showMenu.value
  if (showMenu.value) {
    showSearch.value = false
  }
}

const closeMenu = () => {
  showMenu.value = false
}

const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

const navigateToResult = (result: any) => {
  router.push(result.route)
  showSearch.value = false
  searchQuery.value = ''
}

// 监听路由变化，关闭菜单
const handleRouteChange = () => {
  showMenu.value = false
  showSearch.value = false
}

// 监听ESC键关闭菜单
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showSearch.value) {
      showSearch.value = false
    } else if (showMenu.value) {
      showMenu.value = false
    }
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // 监听路由变化
  router.afterEach(handleRouteChange)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.mobile-navigation {
  @apply w-full;
}

/* 菜单滑入动画 */
.mobile-navigation .relative {
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* 搜索栏动画 */
.mobile-navigation .relative input {
  transition: all 0.2s ease-in-out;
}

/* 底部导航栏安全区域 */
.mobile-navigation nav {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 激活状态指示器 */
.mobile-navigation .text-blue-600 {
  position: relative;
}

.mobile-navigation .text-blue-600::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background-color: currentColor;
  border-radius: 50%;
}
</style>
