<!--
  应用布局组件
  提供统一的应用框架，包含导航、侧边栏、主内容区域
-->

<template>
  <div class="app-layout" :class="layoutClasses">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-content">
        <!-- 左侧：Logo和菜单切换 -->
        <div class="header-left">
          <button
            @click="toggleSidebar"
            class="sidebar-toggle md:hidden"
            :aria-label="t('layout.toggleMenu')"
          >
            <Bars3Icon v-if="!sidebarOpen" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
          </button>
          
          <router-link to="/" class="app-logo">
            <CalculatorIcon class="w-8 h-8 text-blue-600" />
            <span class="logo-text">{{ t('app.name') }}</span>
          </router-link>
        </div>

        <!-- 中间：搜索栏 -->
        <div class="header-center">
          <div class="search-container">
            <MagnifyingGlassIcon class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('layout.searchPlaceholder')"
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <kbd class="search-shortcut">⌘K</kbd>
          </div>
        </div>

        <!-- 右侧：用户操作 -->
        <div class="header-right">
          <!-- 实时数据状态 -->
          <div class="data-status" :class="{ 'connected': isDataConnected }">
            <div class="status-indicator"></div>
            <span class="status-text">{{ getDataStatusText() }}</span>
          </div>

          <!-- 通知 -->
          <button class="notification-button" @click="showNotifications = !showNotifications">
            <BellIcon class="w-5 h-5" />
            <span v-if="unreadNotifications > 0" class="notification-badge">
              {{ unreadNotifications }}
            </span>
          </button>

          <!-- 主题切换 -->
          <button @click="toggleTheme" class="theme-toggle" :aria-label="t('layout.toggleTheme')">
            <SunIcon v-if="isDarkMode" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
          </button>

          <!-- 用户菜单 -->
          <div class="user-menu" v-if="isAuthenticated">
            <button @click="showUserMenu = !showUserMenu" class="user-button">
              <img
                :src="currentUser?.avatar || '/default-avatar.png'"
                :alt="currentUser?.username"
                class="user-avatar"
              />
              <ChevronDownIcon class="w-4 h-4 ml-2" />
            </button>

            <!-- 用户下拉菜单 -->
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="user-info">
                <div class="user-name">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</div>
                <div class="user-email">{{ currentUser?.email }}</div>
              </div>
              <div class="menu-divider"></div>
              <router-link to="/profile" class="menu-item" @click="showUserMenu = false">
                <UserIcon class="w-4 h-4 mr-3" />
                {{ t('layout.profile') }}
              </router-link>
              <router-link to="/settings" class="menu-item" @click="showUserMenu = false">
                <CogIcon class="w-4 h-4 mr-3" />
                {{ t('layout.settings') }}
              </router-link>
              <div class="menu-divider"></div>
              <button @click="handleLogout" class="menu-item logout">
                <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                {{ t('layout.logout') }}
              </button>
            </div>
          </div>

          <!-- 登录按钮 -->
          <button v-else @click="showAuthModal = true" class="login-button">
            {{ t('layout.signIn') }}
          </button>
        </div>
      </div>
    </header>

    <!-- 侧边栏 -->
    <aside class="app-sidebar" :class="{ 'open': sidebarOpen }">
      <nav class="sidebar-nav">
        <!-- 主要导航 -->
        <div class="nav-section">
          <div class="nav-title">{{ t('layout.calculators') }}</div>
          <router-link
            v-for="calculator in calculatorNavItems"
            :key="calculator.path"
            :to="calculator.path"
            class="nav-item"
            @click="closeSidebar"
          >
            <component :is="calculator.icon" class="w-5 h-5 mr-3" />
            {{ calculator.name }}
          </router-link>
        </div>

        <!-- 工具导航 -->
        <div class="nav-section">
          <div class="nav-title">{{ t('layout.tools') }}</div>
          <router-link
            v-for="tool in toolNavItems"
            :key="tool.path"
            :to="tool.path"
            class="nav-item"
            @click="closeSidebar"
          >
            <component :is="tool.icon" class="w-5 h-5 mr-3" />
            {{ tool.name }}
            <span v-if="tool.badge" class="nav-badge">{{ tool.badge }}</span>
          </router-link>
        </div>

        <!-- 数据导航 -->
        <div class="nav-section">
          <div class="nav-title">{{ t('layout.data') }}</div>
          <router-link
            v-for="dataItem in dataNavItems"
            :key="dataItem.path"
            :to="dataItem.path"
            class="nav-item"
            @click="closeSidebar"
          >
            <component :is="dataItem.icon" class="w-5 h-5 mr-3" />
            {{ dataItem.name }}
          </router-link>
        </div>
      </nav>

      <!-- 侧边栏底部 -->
      <div class="sidebar-footer">
        <div class="app-version">
          {{ t('layout.version') }} {{ appVersion }}
        </div>
        <div class="footer-links">
          <a href="/help" class="footer-link">{{ t('layout.help') }}</a>
          <a href="/privacy" class="footer-link">{{ t('layout.privacy') }}</a>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <main class="app-main">
      <div class="main-content">
        <!-- 面包屑导航 -->
        <nav v-if="showBreadcrumbs" class="breadcrumbs">
          <ol class="breadcrumb-list">
            <li
              v-for="(crumb, index) in breadcrumbs"
              :key="index"
              class="breadcrumb-item"
            >
              <router-link
                v-if="crumb.path && index < breadcrumbs.length - 1"
                :to="crumb.path"
                class="breadcrumb-link"
              >
                {{ crumb.name }}
              </router-link>
              <span v-else class="breadcrumb-current">{{ crumb.name }}</span>
              <ChevronRightIcon
                v-if="index < breadcrumbs.length - 1"
                class="breadcrumb-separator"
              />
            </li>
          </ol>
        </nav>

        <!-- 页面内容 -->
        <div class="page-content">
          <router-view />
        </div>
      </div>
    </main>

    <!-- 通知面板 -->
    <div v-if="showNotifications" class="notifications-panel">
      <div class="panel-header">
        <h3 class="panel-title">{{ t('layout.notifications') }}</h3>
        <button @click="showNotifications = false" class="panel-close">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
      <div class="notifications-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.read }"
        >
          <div class="notification-icon">
            <component :is="getNotificationIcon(notification.type)" class="w-5 h-5" />
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatNotificationTime(notification.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 认证模态框 -->
    <AuthModal
      v-if="showAuthModal"
      :is-visible="showAuthModal"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />

    <!-- 侧边栏遮罩 -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay md:hidden"
      @click="closeSidebar"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bars3Icon,
  XMarkIcon,
  CalculatorIcon,
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  SparklesIcon,
  UserGroupIcon,
  SignalIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'
import AuthModal from '@/components/auth/AuthModal.vue'
import { useI18n } from '@/services/I18nService'
import { useUserManager } from '@/services/UserManager'
import { useRealTimeData } from '@/services/RealTimeDataManager'
import { useTheme } from '@/services/ThemeManager'

// 使用服务
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isAuthenticated, currentUser, logout } = useUserManager()
const { isConnected: isDataConnected } = useRealTimeData()
const { isDarkMode, toggleTheme } = useTheme()

// 响应式状态
const sidebarOpen = ref(false)
const showUserMenu = ref(false)
const showNotifications = ref(false)
const showAuthModal = ref(false)
const searchQuery = ref('')
const unreadNotifications = ref(3)
const appVersion = ref('1.0.0')

// 导航配置
const calculatorNavItems = [
  {
    name: t('calculators.compoundInterest'),
    path: '/calculator/compound-interest',
    icon: CalculatorIcon
  },
  {
    name: t('calculators.loanCalculator'),
    path: '/calculator/loan',
    icon: BanknotesIcon
  },
  {
    name: t('calculators.investmentCalculator'),
    path: '/calculator/investment',
    icon: ChartBarIcon
  },
  {
    name: t('calculators.retirementCalculator'),
    path: '/calculator/retirement',
    icon: UserIcon
  }
]

const toolNavItems = [
  {
    name: t('tools.aiAdvisor'),
    path: '/ai-advisor',
    icon: SparklesIcon,
    badge: 'AI'
  },
  {
    name: t('tools.collaboration'),
    path: '/collaboration',
    icon: UserGroupIcon
  },
  {
    name: t('tools.dataVisualization'),
    path: '/visualization',
    icon: ChartBarIcon
  },
  {
    name: t('tools.exportTools'),
    path: '/export',
    icon: DocumentArrowDownIcon
  }
]

const dataNavItems = [
  {
    name: t('data.realTimeData'),
    path: '/data/realtime',
    icon: SignalIcon
  },
  {
    name: t('data.historicalData'),
    path: '/data/historical',
    icon: DocumentTextIcon
  }
]

// 通知数据
const notifications = ref([
  {
    id: '1',
    type: 'info',
    title: 'Neue Zinssätze verfügbar',
    message: 'Die EZB hat die Leitzinsen aktualisiert',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    read: false
  },
  {
    id: '2',
    type: 'success',
    title: 'Berechnung gespeichert',
    message: 'Ihre Zinseszinsberechnung wurde erfolgreich gespeichert',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false
  },
  {
    id: '3',
    type: 'warning',
    title: 'Datenverbindung unterbrochen',
    message: 'Die Verbindung zu den Finanzdaten wurde kurzzeitig unterbrochen',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true
  }
])

// 计算属性
const layoutClasses = computed(() => [
  'app-layout',
  {
    'sidebar-open': sidebarOpen.value,
    'dark': isDarkMode.value
  }
])

const showBreadcrumbs = computed(() => {
  return route.path !== '/'
})

const breadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(segment => segment)
  const crumbs = [{ name: t('layout.home'), path: '/' }]
  
  let currentPath = ''
  pathSegments.forEach(segment => {
    currentPath += `/${segment}`
    crumbs.push({
      name: getBreadcrumbName(segment),
      path: currentPath
    })
  })
  
  return crumbs
})

// 方法
const toggleSidebar = (): void => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = (): void => {
  sidebarOpen.value = false
}

const getDataStatusText = (): string => {
  return isDataConnected.value ? t('layout.dataConnected') : t('layout.dataDisconnected')
}

const handleSearch = (): void => {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
    searchQuery.value = ''
  }
}

const handleLogout = async (): Promise<void> => {
  showUserMenu.value = false
  await logout()
  router.push('/')
}

const handleAuthSuccess = (user: any): void => {
  showAuthModal.value = false
  console.log('User authenticated:', user)
}

const getBreadcrumbName = (segment: string): string => {
  const nameMap: Record<string, string> = {
    'calculator': t('layout.calculators'),
    'compound-interest': t('calculators.compoundInterest'),
    'loan': t('calculators.loanCalculator'),
    'investment': t('calculators.investmentCalculator'),
    'retirement': t('calculators.retirementCalculator'),
    'ai-advisor': t('tools.aiAdvisor'),
    'collaboration': t('tools.collaboration'),
    'visualization': t('tools.dataVisualization'),
    'data': t('layout.data'),
    'realtime': t('data.realTimeData'),
    'historical': t('data.historicalData'),
    'settings': t('layout.settings'),
    'profile': t('layout.profile')
  }
  
  return nameMap[segment] || segment
}

const getNotificationIcon = (type: string) => {
  const iconMap = {
    'info': InformationCircleIcon,
    'success': CheckCircleIcon,
    'warning': ExclamationTriangleIcon,
    'error': ExclamationTriangleIcon
  }
  
  return iconMap[type as keyof typeof iconMap] || InformationCircleIcon
}

const formatNotificationTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return t('time.justNow')
  if (diff < 3600000) return t('time.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('time.hoursAgo', { count: Math.floor(diff / 3600000) })
  
  return date.toLocaleDateString('de-DE')
}

// 监听器
watch(() => route.path, () => {
  closeSidebar()
  showUserMenu.value = false
  showNotifications.value = false
})

// 生命周期
onMounted(() => {
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      const searchInput = document.querySelector('.search-input') as HTMLInputElement
      searchInput?.focus()
    }
  })
})
</script>

<style scoped>
.app-layout {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.app-header {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40;
}

.header-content {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between;
}

.header-left {
  @apply flex items-center space-x-4;
}

.sidebar-toggle {
  @apply p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md;
}

.app-logo {
  @apply flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white;
}

.logo-text {
  @apply hidden sm:block;
}

.header-center {
  @apply flex-1 max-w-lg mx-8;
}

.search-container {
  @apply relative;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400;
}

.search-input {
  @apply w-full pl-10 pr-16 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.search-shortcut {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded;
}

.header-right {
  @apply flex items-center space-x-4;
}

.data-status {
  @apply flex items-center space-x-2 text-sm;
}

.status-indicator {
  @apply w-2 h-2 rounded-full bg-red-500;
}

.data-status.connected .status-indicator {
  @apply bg-green-500 animate-pulse;
}

.status-text {
  @apply text-gray-600 dark:text-gray-400;
}

.notification-button,
.theme-toggle {
  @apply relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md;
}

.notification-badge {
  @apply absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center;
}

.user-menu {
  @apply relative;
}

.user-button {
  @apply flex items-center p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md;
}

.user-avatar {
  @apply w-8 h-8 rounded-full;
}

.user-dropdown {
  @apply absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50;
}

.user-info {
  @apply px-4 py-3;
}

.user-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.user-email {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.menu-divider {
  @apply border-t border-gray-200 dark:border-gray-700 my-2;
}

.menu-item {
  @apply flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700;
}

.menu-item.logout {
  @apply text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20;
}

.login-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200;
}

.app-sidebar {
  @apply fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform -translate-x-full transition-transform duration-300 ease-in-out z-30 overflow-y-auto;
}

.app-sidebar.open {
  @apply translate-x-0;
}

@media (min-width: 768px) {
  .app-sidebar {
    @apply translate-x-0;
  }
  
  .app-main {
    @apply ml-64;
  }
}

.sidebar-nav {
  @apply p-4 space-y-6;
}

.nav-section {
  @apply space-y-2;
}

.nav-title {
  @apply text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3;
}

.nav-item {
  @apply flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200;
}

.nav-item.router-link-active {
  @apply bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400;
}

.nav-badge {
  @apply ml-auto px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full;
}

.sidebar-footer {
  @apply mt-auto p-4 border-t border-gray-200 dark:border-gray-700;
}

.app-version {
  @apply text-xs text-gray-500 dark:text-gray-500 mb-2;
}

.footer-links {
  @apply flex space-x-4;
}

.footer-link {
  @apply text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300;
}

.app-main {
  @apply min-h-[calc(100vh-4rem)] pt-4;
}

.main-content {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.breadcrumbs {
  @apply mb-6;
}

.breadcrumb-list {
  @apply flex items-center space-x-2 text-sm;
}

.breadcrumb-item {
  @apply flex items-center;
}

.breadcrumb-link {
  @apply text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white;
}

.breadcrumb-current {
  @apply text-gray-900 dark:text-white font-medium;
}

.breadcrumb-separator {
  @apply w-4 h-4 text-gray-400 mx-2;
}

.notifications-panel {
  @apply fixed right-4 top-20 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50;
}

.panel-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.panel-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.panel-close {
  @apply p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded;
}

.notifications-list {
  @apply max-h-96 overflow-y-auto;
}

.notification-item {
  @apply flex items-start space-x-3 p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50;
}

.notification-item.unread {
  @apply bg-blue-50 dark:bg-blue-900/10;
}

.notification-icon {
  @apply flex-shrink-0 mt-1;
}

.notification-content {
  @apply flex-1 min-w-0;
}

.notification-title {
  @apply font-medium text-gray-900 dark:text-white text-sm;
}

.notification-message {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.notification-time {
  @apply text-xs text-gray-500 dark:text-gray-500 mt-2;
}

.sidebar-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-20;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header-center {
    @apply hidden;
  }
  
  .header-right {
    @apply space-x-2;
  }
  
  .data-status .status-text {
    @apply hidden;
  }
}

/* 动画 */
.nav-item {
  transition: all 0.2s ease;
}

.nav-item:hover {
  transform: translateX(2px);
}
</style>
