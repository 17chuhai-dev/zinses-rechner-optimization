<!--
  用户账户管理页面
  包含个人资料、偏好设置、协作管理等功能
-->

<template>
  <div class="user-account-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container mx-auto px-4">
        <div class="header-content">
          <div class="user-info">
            <div class="user-avatar">
              <img
                v-if="user?.photoURL"
                :src="user.photoURL"
                :alt="userDisplayName"
                class="avatar-image"
              />
              <div v-else class="avatar-placeholder">
                {{ userInitials }}
              </div>
            </div>
            
            <div class="user-details">
              <h1 class="user-name">{{ userDisplayName }}</h1>
              <p class="user-email">{{ user?.email }}</p>
              <div class="user-status">
                <span class="status-badge" :class="{ 'verified': isEmailVerified }">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="isEmailVerified" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {{ isEmailVerified ? 'E-Mail verifiziert' : 'E-Mail nicht verifiziert' }}
                </span>
                
                <button
                  v-if="!isEmailVerified"
                  type="button"
                  class="verify-button"
                  @click="resendVerificationEmail"
                  :disabled="isLoading"
                >
                  Verifizierung senden
                </button>
              </div>
            </div>
          </div>
          
          <div class="header-actions">
            <button
              type="button"
              class="action-btn secondary"
              @click="showEditProfile = true"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Profil bearbeiten
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <div class="container mx-auto px-4">
        <div class="content-grid">
          <!-- 左侧导航 -->
          <div class="sidebar">
            <nav class="sidebar-nav">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                class="nav-item"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
                </svg>
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <!-- 右侧内容 -->
          <div class="content-area">
            <!-- 个人资料标签 -->
            <div v-if="activeTab === 'profile'" class="tab-content">
              <div class="section-header">
                <h2 class="section-title">Persönliche Informationen</h2>
                <p class="section-description">
                  Verwalten Sie Ihre Kontoinformationen und Profileinstellungen
                </p>
              </div>

              <div class="profile-sections">
                <div class="profile-section">
                  <h3 class="subsection-title">Grundlegende Informationen</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">Name</label>
                      <div class="info-value">{{ user?.displayName || 'Nicht angegeben' }}</div>
                    </div>
                    
                    <div class="info-item">
                      <label class="info-label">E-Mail-Adresse</label>
                      <div class="info-value">{{ user?.email }}</div>
                    </div>
                    
                    <div class="info-item">
                      <label class="info-label">Mitglied seit</label>
                      <div class="info-value">{{ formatDate(user?.createdAt) }}</div>
                    </div>
                    
                    <div class="info-item">
                      <label class="info-label">Letzter Login</label>
                      <div class="info-value">{{ formatDate(user?.lastLoginAt) }}</div>
                    </div>
                  </div>
                </div>

                <div class="profile-section">
                  <h3 class="subsection-title">Kontosicherheit</h3>
                  <div class="security-actions">
                    <button
                      type="button"
                      class="security-btn"
                      @click="showChangePassword = true"
                    >
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Passwort ändern
                    </button>
                    
                    <button
                      type="button"
                      class="security-btn"
                      @click="enable2FA"
                    >
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Zwei-Faktor-Authentifizierung
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 协作管理标签 -->
            <div v-if="activeTab === 'collaboration'" class="tab-content">
              <div class="section-header">
                <h2 class="section-title">Zusammenarbeit</h2>
                <p class="section-description">
                  Verwalten Sie Ihre geteilten Berechnungen und Arbeitsräume
                </p>
              </div>

              <SharedCalculationManager />
            </div>

            <!-- 偏好设置标签 -->
            <div v-if="activeTab === 'preferences'" class="tab-content">
              <div class="section-header">
                <h2 class="section-title">Einstellungen</h2>
                <p class="section-description">
                  Passen Sie Ihre Anwendungseinstellungen an
                </p>
              </div>

              <div class="preferences-sections">
                <div class="preference-section">
                  <h3 class="subsection-title">Erscheinungsbild</h3>
                  <div class="preference-group">
                    <label class="preference-label">Design-Modus</label>
                    <select v-model="preferences.theme" class="preference-select">
                      <option value="light">Hell</option>
                      <option value="dark">Dunkel</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  
                  <div class="preference-group">
                    <label class="preference-label">Sprache</label>
                    <select v-model="preferences.language" class="preference-select">
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div class="preference-group">
                    <label class="preference-label">Währung</label>
                    <select v-model="preferences.currency" class="preference-select">
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">US-Dollar ($)</option>
                      <option value="GBP">Britisches Pfund (£)</option>
                    </select>
                  </div>
                </div>

                <div class="preference-section">
                  <h3 class="subsection-title">Benachrichtigungen</h3>
                  <div class="notification-settings">
                    <label class="notification-item">
                      <input
                        v-model="preferences.notifications.email"
                        type="checkbox"
                        class="notification-checkbox"
                      />
                      <span class="notification-label">E-Mail-Benachrichtigungen</span>
                      <span class="notification-description">Erhalten Sie Updates per E-Mail</span>
                    </label>
                    
                    <label class="notification-item">
                      <input
                        v-model="preferences.notifications.marketUpdates"
                        type="checkbox"
                        class="notification-checkbox"
                      />
                      <span class="notification-label">Markt-Updates</span>
                      <span class="notification-description">Benachrichtigungen über wichtige Marktänderungen</span>
                    </label>
                    
                    <label class="notification-item">
                      <input
                        v-model="preferences.notifications.calculationReminders"
                        type="checkbox"
                        class="notification-checkbox"
                      />
                      <span class="notification-label">Berechnungs-Erinnerungen</span>
                      <span class="notification-description">Erinnerungen für regelmäßige Berechnungen</span>
                    </label>
                  </div>
                </div>

                <div class="preference-section">
                  <h3 class="subsection-title">Datenschutz</h3>
                  <div class="privacy-settings">
                    <label class="privacy-item">
                      <input
                        v-model="preferences.privacy.shareCalculations"
                        type="checkbox"
                        class="privacy-checkbox"
                      />
                      <span class="privacy-label">Berechnungen teilen erlauben</span>
                      <span class="privacy-description">Anderen erlauben, Ihre Berechnungen zu sehen</span>
                    </label>
                    
                    <label class="privacy-item">
                      <input
                        v-model="preferences.privacy.allowAnalytics"
                        type="checkbox"
                        class="privacy-checkbox"
                      />
                      <span class="privacy-label">Anonyme Nutzungsstatistiken</span>
                      <span class="privacy-description">Helfen Sie uns, die App zu verbessern</span>
                    </label>
                    
                    <label class="privacy-item">
                      <input
                        v-model="preferences.privacy.publicProfile"
                        type="checkbox"
                        class="privacy-checkbox"
                      />
                      <span class="privacy-label">Öffentliches Profil</span>
                      <span class="privacy-description">Ihr Profil für andere Benutzer sichtbar machen</span>
                    </label>
                  </div>
                </div>

                <div class="preferences-actions">
                  <button
                    type="button"
                    class="action-btn primary"
                    @click="savePreferences"
                    :disabled="isLoading"
                  >
                    <svg v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span v-else>Einstellungen speichern</span>
                  </button>
                  
                  <button
                    type="button"
                    class="action-btn secondary"
                    @click="resetPreferences"
                  >
                    Zurücksetzen
                  </button>
                </div>
              </div>
            </div>

            <!-- 统计信息标签 -->
            <div v-if="activeTab === 'statistics'" class="tab-content">
              <div class="section-header">
                <h2 class="section-title">Nutzungsstatistiken</h2>
                <p class="section-description">
                  Übersicht über Ihre Aktivitäten und Nutzung
                </p>
              </div>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ userStats?.calculationsCreated || 0 }}</div>
                    <div class="stat-label">Berechnungen erstellt</div>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ userStats?.calculationsShared || 0 }}</div>
                    <div class="stat-label">Berechnungen geteilt</div>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon">
                    <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ userStats?.collaborations || 0 }}</div>
                    <div class="stat-label">Kollaborationen</div>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon">
                    <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ formatDate(userStats?.lastActivity) }}</div>
                    <div class="stat-label">Letzte Aktivität</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑资料对话框 -->
    <EditProfileDialog
      v-if="showEditProfile"
      :user="user"
      @close="showEditProfile = false"
      @updated="handleProfileUpdated"
    />

    <!-- 修改密码对话框 -->
    <ChangePasswordDialog
      v-if="showChangePassword"
      @close="showChangePassword = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useGlobalAuth } from '@/composables/useAuth'
import SharedCalculationManager from '@/components/collaboration/SharedCalculationManager.vue'
import EditProfileDialog from '@/components/auth/EditProfileDialog.vue'
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog.vue'

// 使用认证状态
const {
  user,
  isLoading,
  userDisplayName,
  userInitials,
  isEmailVerified,
  resendVerificationEmail,
  getUserStats
} = useGlobalAuth()

// 页面状态
const activeTab = ref('profile')
const showEditProfile = ref(false)
const showChangePassword = ref(false)
const userStats = ref<any>(null)

// 用户偏好设置
const preferences = reactive({
  theme: 'system',
  language: 'de',
  currency: 'EUR',
  notifications: {
    email: true,
    push: false,
    marketUpdates: true,
    calculationReminders: false
  },
  privacy: {
    shareCalculations: true,
    allowAnalytics: true,
    publicProfile: false
  }
})

// 标签页配置
const tabs = [
  {
    id: 'profile',
    label: 'Profil',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  },
  {
    id: 'collaboration',
    label: 'Zusammenarbeit',
    icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
  },
  {
    id: 'preferences',
    label: 'Einstellungen',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
  },
  {
    id: 'statistics',
    label: 'Statistiken',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  }
]

// 方法
const formatDate = (date: Date | undefined): string => {
  if (!date) return 'Unbekannt'
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const savePreferences = async () => {
  // 这里应该调用API保存用户偏好设置
  console.log('保存偏好设置:', preferences)
}

const resetPreferences = () => {
  // 重置为默认值
  Object.assign(preferences, {
    theme: 'system',
    language: 'de',
    currency: 'EUR',
    notifications: {
      email: true,
      push: false,
      marketUpdates: true,
      calculationReminders: false
    },
    privacy: {
      shareCalculations: true,
      allowAnalytics: true,
      publicProfile: false
    }
  })
}

const enable2FA = () => {
  // 启用双因素认证
  console.log('启用2FA')
}

const handleProfileUpdated = (updatedUser: any) => {
  // 处理资料更新
  console.log('资料已更新:', updatedUser)
}

// 生命周期
onMounted(async () => {
  // 加载用户统计信息
  userStats.value = await getUserStats()
})
</script>

<style scoped>
.user-account-view {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.page-header {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-8;
}

.header-content {
  @apply flex items-center justify-between;
}

.user-info {
  @apply flex items-center space-x-4;
}

.user-avatar {
  @apply relative;
}

.avatar-image {
  @apply w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg;
}

.avatar-placeholder {
  @apply w-20 h-20 rounded-full bg-blue-600 text-white text-2xl font-bold
         flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg;
}

.user-details {
  @apply space-y-2;
}

.user-name {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.user-email {
  @apply text-gray-600 dark:text-gray-400;
}

.user-status {
  @apply flex items-center space-x-3;
}

.status-badge {
  @apply flex items-center text-sm px-3 py-1 rounded-full;
}

.status-badge:not(.verified) {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.status-badge.verified {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.verify-button {
  @apply text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.header-actions {
  @apply flex items-center space-x-3;
}

.action-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors flex items-center
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-btn.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.action-btn.secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         hover:bg-gray-300 dark:hover:bg-gray-600;
}

.main-content {
  @apply py-8;
}

.content-grid {
  @apply grid grid-cols-1 lg:grid-cols-4 gap-8;
}

.sidebar {
  @apply lg:col-span-1;
}

.sidebar-nav {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2;
}

.nav-item {
  @apply w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors;
}

.nav-item.active {
  @apply bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400;
}

.content-area {
  @apply lg:col-span-3;
}

.tab-content {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.section-header {
  @apply mb-8;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-2;
}

.section-description {
  @apply text-gray-600 dark:text-gray-400;
}

.profile-sections {
  @apply space-y-8;
}

.profile-section {
  @apply space-y-4;
}

.subsection-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.info-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.info-item {
  @apply space-y-1;
}

.info-label {
  @apply text-sm font-medium text-gray-500 dark:text-gray-400;
}

.info-value {
  @apply text-gray-900 dark:text-white;
}

.security-actions {
  @apply space-y-3;
}

.security-btn {
  @apply flex items-center px-4 py-2 text-gray-700 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors;
}

.preferences-sections {
  @apply space-y-8;
}

.preference-section {
  @apply space-y-4;
}

.preference-group {
  @apply space-y-2;
}

.preference-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.preference-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.notification-settings,
.privacy-settings {
  @apply space-y-4;
}

.notification-item,
.privacy-item {
  @apply flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.notification-checkbox,
.privacy-checkbox {
  @apply mt-1;
}

.notification-label,
.privacy-label {
  @apply block font-medium text-gray-900 dark:text-white;
}

.notification-description,
.privacy-description {
  @apply block text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.preferences-actions {
  @apply flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.stat-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-xl p-6 flex items-center space-x-4;
}

.stat-icon {
  @apply flex-shrink-0;
}

.stat-content {
  @apply space-y-1;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* 移动端优化 */
@media (max-width: 1024px) {
  .content-grid {
    @apply grid-cols-1;
  }
  
  .sidebar {
    @apply order-2;
  }
  
  .content-area {
    @apply order-1;
  }
  
  .sidebar-nav {
    @apply flex overflow-x-auto space-x-2 p-2;
  }
  
  .nav-item {
    @apply flex-shrink-0 whitespace-nowrap;
  }
}

@media (max-width: 640px) {
  .header-content {
    @apply flex-col space-y-4;
  }
  
  .user-info {
    @apply flex-col text-center space-y-4;
  }
  
  .info-grid {
    @apply grid-cols-1;
  }
  
  .stats-grid {
    @apply grid-cols-1;
  }
  
  .preferences-actions {
    @apply flex-col space-y-3 space-x-0;
  }
}
</style>
