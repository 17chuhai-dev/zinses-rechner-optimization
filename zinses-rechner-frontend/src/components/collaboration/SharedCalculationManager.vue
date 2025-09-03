<!--
  共享计算管理组件
  管理用户的共享计算、协作者和权限设置
-->

<template>
  <div class="shared-calculation-manager">
    <!-- 头部操作栏 -->
    <div class="manager-header">
      <div class="header-content">
        <h2 class="manager-title">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          Geteilte Berechnungen
        </h2>
        
        <div class="header-actions">
          <button
            type="button"
            class="action-btn secondary"
            @click="refreshCalculations"
            :disabled="isLoading"
          >
            <svg 
              class="w-4 h-4 mr-2"
              :class="{ 'animate-spin': isLoading }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Aktualisieren
          </button>
          
          <button
            type="button"
            class="action-btn primary"
            @click="showCreateDialog = true"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Neue Berechnung teilen
          </button>
        </div>
      </div>
      
      <!-- 筛选和搜索 -->
      <div class="filter-controls">
        <div class="search-box">
          <svg class="w-4 h-4 search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Berechnungen suchen..."
            class="search-input"
          />
        </div>
        
        <select v-model="filterType" class="filter-select">
          <option value="">Alle Typen</option>
          <option value="compound-interest">Zinseszins</option>
          <option value="mortgage">Hypothek</option>
          <option value="loan">Kredit</option>
          <option value="investment">Investment</option>
        </select>
        
        <select v-model="filterRole" class="filter-select">
          <option value="">Alle Rollen</option>
          <option value="owner">Eigentümer</option>
          <option value="editor">Bearbeiter</option>
          <option value="viewer">Betrachter</option>
        </select>
      </div>
    </div>

    <!-- 计算列表 -->
    <div class="calculations-grid">
      <div
        v-for="calculation in filteredCalculations"
        :key="calculation.id"
        class="calculation-card"
        :class="{ 'is-public': calculation.isPublic }"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="calculation-info">
            <h3 class="calculation-title">{{ calculation.title }}</h3>
            <p class="calculation-description">{{ calculation.description || 'Keine Beschreibung' }}</p>
          </div>
          
          <div class="calculation-meta">
            <span class="calculator-type">{{ getCalculatorTypeName(calculation.calculatorType) }}</span>
            <span class="visibility-badge" :class="{ 'public': calculation.isPublic }">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="calculation.isPublic" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {{ calculation.isPublic ? 'Öffentlich' : 'Privat' }}
            </span>
          </div>
        </div>

        <!-- 协作者信息 -->
        <div class="collaborators-section">
          <div class="collaborators-list">
            <div class="collaborator-avatars">
              <div
                v-for="collaborator in calculation.collaborators.slice(0, 3)"
                :key="collaborator.uid"
                class="collaborator-avatar"
                :title="collaborator.displayName"
              >
                {{ getInitials(collaborator.displayName) }}
              </div>
              <div
                v-if="calculation.collaborators.length > 3"
                class="collaborator-avatar more"
              >
                +{{ calculation.collaborators.length - 3 }}
              </div>
            </div>
            
            <span class="collaborators-count">
              {{ calculation.collaborators.length }} Mitarbeiter
            </span>
          </div>
          
          <div class="last-updated">
            Aktualisiert {{ formatRelativeTime(calculation.updatedAt) }}
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="card-actions">
          <button
            type="button"
            class="action-btn small secondary"
            @click="openCalculation(calculation)"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Öffnen
          </button>
          
          <button
            type="button"
            class="action-btn small secondary"
            @click="shareCalculation(calculation)"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Teilen
          </button>
          
          <div class="dropdown" v-if="isOwner(calculation)">
            <button
              type="button"
              class="action-btn small secondary dropdown-trigger"
              @click="toggleDropdown(calculation.id)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            </button>
            
            <div
              v-if="activeDropdown === calculation.id"
              class="dropdown-menu"
            >
              <button
                type="button"
                class="dropdown-item"
                @click="editCalculation(calculation)"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bearbeiten
              </button>
              
              <button
                type="button"
                class="dropdown-item"
                @click="manageCollaborators(calculation)"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Mitarbeiter verwalten
              </button>
              
              <button
                type="button"
                class="dropdown-item danger"
                @click="deleteCalculation(calculation)"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Löschen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredCalculations.length === 0 && !isLoading" class="empty-state">
      <div class="empty-icon">
        <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      </div>
      <h3 class="empty-title">Keine geteilten Berechnungen</h3>
      <p class="empty-description">
        Erstellen Sie Ihre erste geteilte Berechnung, um mit anderen zu kollaborieren.
      </p>
      <button
        type="button"
        class="action-btn primary"
        @click="showCreateDialog = true"
      >
        Erste Berechnung teilen
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>Lade geteilte Berechnungen...</span>
    </div>

    <!-- 创建共享计算对话框 -->
    <CreateSharedCalculationDialog
      v-if="showCreateDialog"
      @close="showCreateDialog = false"
      @created="handleCalculationCreated"
    />

    <!-- 分享对话框 -->
    <ShareCalculationDialog
      v-if="shareDialogCalculation"
      :calculation="shareDialogCalculation"
      @close="shareDialogCalculation = null"
    />

    <!-- 协作者管理对话框 -->
    <CollaboratorManagementDialog
      v-if="collaboratorDialogCalculation"
      :calculation="collaboratorDialogCalculation"
      @close="collaboratorDialogCalculation = null"
      @updated="handleCalculationUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { collaborationService } from '@/services/CollaborationService'
import { authService } from '@/services/AuthService'
import type { SharedCalculation } from '@/services/CollaborationService'
import CreateSharedCalculationDialog from './CreateSharedCalculationDialog.vue'
import ShareCalculationDialog from './ShareCalculationDialog.vue'
import CollaboratorManagementDialog from './CollaboratorManagementDialog.vue'

const router = useRouter()

// 响应式数据
const calculations = ref<SharedCalculation[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const filterRole = ref('')
const activeDropdown = ref<string | null>(null)

// 对话框状态
const showCreateDialog = ref(false)
const shareDialogCalculation = ref<SharedCalculation | null>(null)
const collaboratorDialogCalculation = ref<SharedCalculation | null>(null)

// 计算属性
const filteredCalculations = computed(() => {
  return calculations.value.filter(calc => {
    const matchesSearch = !searchQuery.value || 
      calc.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      calc.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesType = !filterType.value || calc.calculatorType === filterType.value
    
    const matchesRole = !filterRole.value || getUserRole(calc) === filterRole.value
    
    return matchesSearch && matchesType && matchesRole
  })
})

// 方法
const refreshCalculations = async () => {
  isLoading.value = true
  try {
    calculations.value = await collaborationService.getUserCalculations()
  } catch (error) {
    console.error('刷新计算列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const openCalculation = (calculation: SharedCalculation) => {
  router.push(`/calculator/${calculation.calculatorType}?shared=${calculation.id}`)
}

const shareCalculation = (calculation: SharedCalculation) => {
  shareDialogCalculation.value = calculation
}

const manageCollaborators = (calculation: SharedCalculation) => {
  collaboratorDialogCalculation.value = calculation
}

const editCalculation = (calculation: SharedCalculation) => {
  router.push(`/calculator/${calculation.calculatorType}?edit=${calculation.id}`)
}

const deleteCalculation = async (calculation: SharedCalculation) => {
  if (!confirm(`Sind Sie sicher, dass Sie "${calculation.title}" löschen möchten?`)) {
    return
  }

  try {
    // 这里应该调用删除API
    calculations.value = calculations.value.filter(c => c.id !== calculation.id)
  } catch (error) {
    console.error('删除计算失败:', error)
  }
}

const toggleDropdown = (calculationId: string) => {
  activeDropdown.value = activeDropdown.value === calculationId ? null : calculationId
}

const isOwner = (calculation: SharedCalculation): boolean => {
  const currentUser = authService.getCurrentUser()
  return currentUser?.uid === calculation.owner.uid
}

const getUserRole = (calculation: SharedCalculation): string => {
  const currentUser = authService.getCurrentUser()
  if (!currentUser) return 'viewer'
  
  if (currentUser.uid === calculation.owner.uid) return 'owner'
  
  const collaborator = calculation.collaborators.find(c => c.uid === currentUser.uid)
  return collaborator?.role || 'viewer'
}

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getCalculatorTypeName = (type: string): string => {
  const names = {
    'compound-interest': 'Zinseszins',
    'mortgage': 'Hypothek',
    'loan': 'Kredit',
    'investment': 'Investment',
    'savings': 'Sparen'
  }
  return names[type as keyof typeof names] || type
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'heute'
  if (diffDays === 1) return 'gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`
  return `vor ${Math.floor(diffDays / 30)} Monaten`
}

const handleCalculationCreated = (calculation: SharedCalculation) => {
  calculations.value.unshift(calculation)
  showCreateDialog.value = false
}

const handleCalculationUpdated = (calculation: SharedCalculation) => {
  const index = calculations.value.findIndex(c => c.id === calculation.id)
  if (index > -1) {
    calculations.value[index] = calculation
  }
}

// 生命周期
onMounted(() => {
  refreshCalculations()
  
  // 点击外部关闭下拉菜单
  document.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('.dropdown')) {
      activeDropdown.value = null
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', () => {})
})
</script>

<style scoped>
.shared-calculation-manager {
  @apply space-y-6;
}

.manager-header {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700;
}

.header-content {
  @apply flex items-center justify-between mb-4;
}

.manager-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white flex items-center;
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

.action-btn.small {
  @apply px-3 py-1 text-sm;
}

.filter-controls {
  @apply flex flex-wrap gap-4;
}

.search-box {
  @apply relative flex-1 min-w-64;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400;
}

.search-input {
  @apply w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.filter-select {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.calculations-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6;
}

.calculation-card {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700
         hover:shadow-md transition-shadow;
}

.calculation-card.is-public {
  @apply border-blue-200 dark:border-blue-800;
}

.card-header {
  @apply space-y-3 mb-4;
}

.calculation-info {
  @apply space-y-1;
}

.calculation-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.calculation-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.calculation-meta {
  @apply flex items-center justify-between;
}

.calculator-type {
  @apply text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full;
}

.visibility-badge {
  @apply text-xs flex items-center px-2 py-1 rounded-full;
}

.visibility-badge:not(.public) {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
}

.visibility-badge.public {
  @apply bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400;
}

.collaborators-section {
  @apply flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700;
}

.collaborators-list {
  @apply flex items-center space-x-3;
}

.collaborator-avatars {
  @apply flex -space-x-2;
}

.collaborator-avatar {
  @apply w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-medium
         flex items-center justify-center border-2 border-white dark:border-gray-800;
}

.collaborator-avatar.more {
  @apply bg-gray-400 dark:bg-gray-600;
}

.collaborators-count {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.last-updated {
  @apply text-xs text-gray-500 dark:text-gray-500;
}

.card-actions {
  @apply flex items-center justify-between;
}

.dropdown {
  @apply relative;
}

.dropdown-menu {
  @apply absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg
         border border-gray-200 dark:border-gray-700 py-1 z-10;
}

.dropdown-item {
  @apply w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors;
}

.dropdown-item.danger {
  @apply text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20;
}

.empty-state {
  @apply text-center py-12;
}

.empty-icon {
  @apply flex justify-center mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.empty-description {
  @apply text-gray-600 dark:text-gray-400 mb-6;
}

.loading-state {
  @apply flex items-center justify-center space-x-2 py-12 text-gray-500 dark:text-gray-400;
}

.loading-spinner {
  @apply w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .header-content {
    @apply flex-col space-y-4;
  }
  
  .header-actions {
    @apply w-full justify-between;
  }
  
  .filter-controls {
    @apply flex-col;
  }
  
  .search-box {
    @apply min-w-full;
  }
  
  .calculations-grid {
    @apply grid-cols-1;
  }
  
  .card-actions {
    @apply flex-col space-y-2;
  }
}
</style>
