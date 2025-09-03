<!--
  集成管理器
  提供第三方集成的管理、配置、监控功能
-->

<template>
  <div class="integration-manager">
    <!-- 管理器头部 -->
    <div class="manager-header">
      <div class="header-content">
        <h2 class="manager-title">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Integrationen
        </h2>
        
        <div class="header-actions">
          <button
            type="button"
            class="action-btn secondary"
            @click="refreshIntegrations"
            :disabled="isLoading"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Aktualisieren
          </button>
          
          <button
            type="button"
            class="action-btn primary"
            @click="showAddIntegrationDialog = true"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Integration hinzufügen
          </button>
        </div>
      </div>
      
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon active">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ activeIntegrations }}</div>
            <div class="stat-label">Aktive Integrationen</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon syncing">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ syncingIntegrations }}</div>
            <div class="stat-label">Synchronisierung</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon error">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ errorIntegrations }}</div>
            <div class="stat-label">Fehler</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon total">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalIntegrations }}</div>
            <div class="stat-label">Gesamt</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 过滤和搜索 -->
    <div class="filters-section">
      <div class="search-box">
        <svg class="w-4 h-4 search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Integrationen suchen..."
          class="search-input"
        />
      </div>
      
      <div class="filter-controls">
        <select v-model="typeFilter" class="filter-select">
          <option value="">Alle Typen</option>
          <option value="banking">Banking</option>
          <option value="accounting">Buchhaltung</option>
          <option value="crm">CRM</option>
          <option value="market_data">Marktdaten</option>
          <option value="payment">Zahlungen</option>
          <option value="analytics">Analytics</option>
        </select>
        
        <select v-model="statusFilter" class="filter-select">
          <option value="">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Inaktiv</option>
          <option value="error">Fehler</option>
          <option value="pending">Ausstehend</option>
        </select>
      </div>
    </div>

    <!-- 集成列表 -->
    <div class="integrations-section">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>Lade Integrationen...</span>
      </div>
      
      <div v-else-if="filteredIntegrations.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 class="empty-title">Keine Integrationen gefunden</h3>
        <p class="empty-description">
          Fügen Sie Ihre erste Integration hinzu, um externe Dienste zu verbinden.
        </p>
        <button
          type="button"
          class="action-btn primary"
          @click="showAddIntegrationDialog = true"
        >
          Erste Integration hinzufügen
        </button>
      </div>
      
      <div v-else class="integrations-grid">
        <div
          v-for="integration in filteredIntegrations"
          :key="integration.id"
          class="integration-card"
          :class="{ 'integration-error': integration.status === 'error' }"
        >
          <div class="integration-header">
            <div class="integration-info">
              <div class="integration-icon">
                <img
                  v-if="getProviderLogo(integration.provider)"
                  :src="getProviderLogo(integration.provider)"
                  :alt="integration.provider"
                  class="provider-logo"
                />
                <div v-else class="provider-placeholder">
                  {{ getProviderInitials(integration.provider) }}
                </div>
              </div>
              <div class="integration-details">
                <h3 class="integration-name">{{ integration.name }}</h3>
                <p class="integration-provider">{{ integration.provider }}</p>
                <div class="integration-meta">
                  <span class="integration-type">{{ getTypeLabel(integration.type) }}</span>
                  <span class="integration-sync">
                    Letzte Sync: {{ formatRelativeTime(integration.lastSync) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="integration-status">
              <span class="status-badge" :class="integration.status">
                {{ getStatusLabel(integration.status) }}
              </span>
              <div class="integration-actions">
                <button
                  type="button"
                  class="action-btn-small"
                  @click="testIntegration(integration)"
                  :disabled="integration.status === 'pending'"
                  title="Verbindung testen"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  class="action-btn-small"
                  @click="syncIntegration(integration)"
                  :disabled="integration.status !== 'active'"
                  title="Synchronisieren"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                
                <div class="dropdown">
                  <button
                    type="button"
                    class="action-btn-small dropdown-trigger"
                    @click="toggleIntegrationDropdown(integration.id)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  <div
                    v-if="activeIntegrationDropdown === integration.id"
                    class="dropdown-menu"
                  >
                    <button
                      type="button"
                      class="dropdown-item"
                      @click="editIntegration(integration)"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Bearbeiten
                    </button>
                    
                    <button
                      type="button"
                      class="dropdown-item"
                      @click="viewIntegrationLogs(integration)"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Logs anzeigen
                    </button>
                    
                    <button
                      type="button"
                      class="dropdown-item"
                      @click="viewSyncHistory(integration)"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Sync-Verlauf
                    </button>
                    
                    <button
                      v-if="integration.status === 'active'"
                      type="button"
                      class="dropdown-item"
                      @click="pauseIntegration(integration)"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pausieren
                    </button>
                    
                    <button
                      v-if="integration.status === 'inactive'"
                      type="button"
                      class="dropdown-item"
                      @click="resumeIntegration(integration)"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                      </svg>
                      Fortsetzen
                    </button>
                    
                    <button
                      type="button"
                      class="dropdown-item danger"
                      @click="deleteIntegration(integration)"
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
          
          <!-- 集成详情 -->
          <div class="integration-details-section">
            <div class="detail-item">
              <span class="detail-label">Sync-Frequenz:</span>
              <span class="detail-value">{{ getSyncFrequencyLabel(integration.syncFrequency) }}</span>
            </div>
            <div v-if="integration.errorCount > 0" class="detail-item">
              <span class="detail-label">Fehler:</span>
              <span class="detail-value error">{{ integration.errorCount }} Fehler</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Erstellt:</span>
              <span class="detail-value">{{ formatDate(new Date()) }}</span>
            </div>
          </div>
          
          <!-- 进度条（同步时显示） -->
          <div v-if="syncingIntegrationIds.includes(integration.id)" class="sync-progress">
            <div class="progress-bar">
              <div class="progress-fill animate-pulse"></div>
            </div>
            <div class="progress-text">Synchronisierung läuft...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 对话框组件 -->
    <AddIntegrationDialog
      v-if="showAddIntegrationDialog"
      :organization-id="organizationId"
      @close="showAddIntegrationDialog = false"
      @created="handleIntegrationCreated"
    />

    <EditIntegrationDialog
      v-if="showEditIntegrationDialog"
      :integration="selectedIntegration"
      @close="showEditIntegrationDialog = false"
      @updated="handleIntegrationUpdated"
    />

    <IntegrationLogsDialog
      v-if="showLogsDialog"
      :integration="selectedIntegration"
      @close="showLogsDialog = false"
    />

    <SyncHistoryDialog
      v-if="showSyncHistoryDialog"
      :integration="selectedIntegration"
      @close="showSyncHistoryDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { openAPIService } from '@/services/OpenAPIService'
import type { ThirdPartyIntegration, IntegrationType, IntegrationStatus, SyncFrequency } from '@/services/OpenAPIService'
import AddIntegrationDialog from './AddIntegrationDialog.vue'
import EditIntegrationDialog from './EditIntegrationDialog.vue'
import IntegrationLogsDialog from './IntegrationLogsDialog.vue'
import SyncHistoryDialog from './SyncHistoryDialog.vue'

interface Props {
  organizationId: string
}

const props = defineProps<Props>()

// 响应式数据
const integrations = ref<ThirdPartyIntegration[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const activeIntegrationDropdown = ref<string | null>(null)
const syncingIntegrationIds = ref<string[]>([])
const showAddIntegrationDialog = ref(false)
const showEditIntegrationDialog = ref(false)
const showLogsDialog = ref(false)
const showSyncHistoryDialog = ref(false)
const selectedIntegration = ref<ThirdPartyIntegration | null>(null)

// 计算属性
const filteredIntegrations = computed(() => {
  return integrations.value.filter(integration => {
    const matchesSearch = !searchQuery.value || 
      integration.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      integration.provider.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesType = !typeFilter.value || integration.type === typeFilter.value
    const matchesStatus = !statusFilter.value || integration.status === statusFilter.value
    
    return matchesSearch && matchesType && matchesStatus
  })
})

const activeIntegrations = computed(() => integrations.value.filter(i => i.status === 'active').length)
const syncingIntegrations = computed(() => syncingIntegrationIds.value.length)
const errorIntegrations = computed(() => integrations.value.filter(i => i.status === 'error').length)
const totalIntegrations = computed(() => integrations.value.length)

// 方法
const loadIntegrations = async () => {
  isLoading.value = true
  try {
    integrations.value = await openAPIService.getIntegrations(props.organizationId)
  } catch (error) {
    console.error('加载集成失败:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshIntegrations = () => {
  loadIntegrations()
}

const testIntegration = async (integration: ThirdPartyIntegration) => {
  try {
    const result = await openAPIService.testIntegration(integration.id)
    if (result.success) {
      // 显示成功消息
      console.log('集成测试成功')
    } else {
      // 显示错误消息
      console.error('集成测试失败:', result.error)
    }
  } catch (error) {
    console.error('测试集成失败:', error)
  }
}

const syncIntegration = async (integration: ThirdPartyIntegration) => {
  syncingIntegrationIds.value.push(integration.id)
  try {
    const result = await openAPIService.syncIntegration(integration.id)
    if (result) {
      console.log('同步开始:', result)
    }
  } catch (error) {
    console.error('同步集成失败:', error)
  } finally {
    syncingIntegrationIds.value = syncingIntegrationIds.value.filter(id => id !== integration.id)
  }
}

const editIntegration = (integration: ThirdPartyIntegration) => {
  selectedIntegration.value = integration
  showEditIntegrationDialog.value = true
}

const viewIntegrationLogs = (integration: ThirdPartyIntegration) => {
  selectedIntegration.value = integration
  showLogsDialog.value = true
}

const viewSyncHistory = (integration: ThirdPartyIntegration) => {
  selectedIntegration.value = integration
  showSyncHistoryDialog.value = true
}

const pauseIntegration = async (integration: ThirdPartyIntegration) => {
  // 暂停集成的逻辑
  console.log('暂停集成:', integration)
}

const resumeIntegration = async (integration: ThirdPartyIntegration) => {
  // 恢复集成的逻辑
  console.log('恢复集成:', integration)
}

const deleteIntegration = async (integration: ThirdPartyIntegration) => {
  if (!confirm(`确定要删除集成 "${integration.name}" 吗？`)) {
    return
  }
  
  // 删除集成的逻辑
  integrations.value = integrations.value.filter(i => i.id !== integration.id)
}

const toggleIntegrationDropdown = (integrationId: string) => {
  activeIntegrationDropdown.value = activeIntegrationDropdown.value === integrationId ? null : integrationId
}

const handleIntegrationCreated = (integration: ThirdPartyIntegration) => {
  integrations.value.unshift(integration)
  showAddIntegrationDialog.value = false
}

const handleIntegrationUpdated = (integration: ThirdPartyIntegration) => {
  const index = integrations.value.findIndex(i => i.id === integration.id)
  if (index !== -1) {
    integrations.value[index] = integration
  }
  showEditIntegrationDialog.value = false
}

// 工具方法
const getTypeLabel = (type: IntegrationType): string => {
  const labels = {
    banking: 'Banking',
    accounting: 'Buchhaltung',
    crm: 'CRM',
    market_data: 'Marktdaten',
    payment: 'Zahlungen',
    analytics: 'Analytics',
    notification: 'Benachrichtigungen',
    storage: 'Speicher'
  }
  return labels[type] || type
}

const getStatusLabel = (status: IntegrationStatus): string => {
  const labels = {
    active: 'Aktiv',
    inactive: 'Inaktiv',
    error: 'Fehler',
    pending: 'Ausstehend',
    suspended: 'Gesperrt'
  }
  return labels[status] || status
}

const getSyncFrequencyLabel = (frequency: SyncFrequency): string => {
  const labels = {
    real_time: 'Echtzeit',
    hourly: 'Stündlich',
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    manual: 'Manuell'
  }
  return labels[frequency] || frequency
}

const getProviderLogo = (provider: string): string | null => {
  // 这里应该返回提供商的logo URL
  return null
}

const getProviderInitials = (provider: string): string => {
  return provider.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const formatRelativeTime = (date?: Date): string => {
  if (!date) return 'Nie'
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'heute'
  if (diffDays === 1) return 'gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  return `vor ${Math.floor(diffDays / 7)} Wochen`
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// 生命周期
onMounted(() => {
  loadIntegrations()
  
  // 点击外部关闭下拉菜单
  document.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('.dropdown')) {
      activeIntegrationDropdown.value = null
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', () => {})
})
</script>

<style scoped>
.integration-manager {
  @apply space-y-6;
}

.manager-header {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.header-content {
  @apply flex items-center justify-between mb-6;
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

.stats-overview {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center space-x-3;
}

.stat-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center;
}

.stat-icon.active {
  @apply bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400;
}

.stat-icon.syncing {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400;
}

.stat-icon.error {
  @apply bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400;
}

.stat-icon.total {
  @apply bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400;
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

.filters-section {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4
         flex items-center space-x-4;
}

.search-box {
  @apply relative flex-1;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400;
}

.search-input {
  @apply w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.filter-controls {
  @apply flex items-center space-x-3;
}

.filter-select {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.integrations-section {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.loading-state {
  @apply flex items-center justify-center py-12 space-x-3;
}

.loading-spinner {
  @apply w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin;
}

.empty-state {
  @apply text-center py-12 px-6;
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

.integrations-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6;
}

.integration-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600
         hover:shadow-md transition-shadow;
}

.integration-card.integration-error {
  @apply border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10;
}

.integration-header {
  @apply flex items-start justify-between mb-4;
}

.integration-info {
  @apply flex items-start space-x-3 flex-1;
}

.integration-icon {
  @apply w-12 h-12 rounded-lg overflow-hidden flex-shrink-0;
}

.provider-logo {
  @apply w-full h-full object-cover;
}

.provider-placeholder {
  @apply w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm;
}

.integration-details {
  @apply flex-1 min-w-0;
}

.integration-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white truncate;
}

.integration-provider {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.integration-meta {
  @apply flex items-center space-x-2 mt-1;
}

.integration-type {
  @apply px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs;
}

.integration-sync {
  @apply text-xs text-gray-500 dark:text-gray-500;
}

.integration-status {
  @apply flex flex-col items-end space-y-2;
}

.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.status-badge.active {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.status-badge.inactive {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400;
}

.status-badge.error {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.status-badge.pending {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.integration-actions {
  @apply flex items-center space-x-1;
}

.action-btn-small {
  @apply p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
         hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.integration-details-section {
  @apply space-y-2 mb-4;
}

.detail-item {
  @apply flex justify-between items-center text-sm;
}

.detail-label {
  @apply text-gray-600 dark:text-gray-400;
}

.detail-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.detail-value.error {
  @apply text-red-600 dark:text-red-400;
}

.sync-progress {
  @apply space-y-2;
}

.progress-bar {
  @apply w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2;
}

.progress-fill {
  @apply bg-blue-600 h-2 rounded-full w-full;
}

.progress-text {
  @apply text-sm text-blue-600 dark:text-blue-400 text-center;
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

/* 移动端优化 */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col space-y-4;
  }
  
  .stats-overview {
    @apply grid-cols-2;
  }
  
  .filters-section {
    @apply flex-col space-y-3 space-x-0;
  }
  
  .filter-controls {
    @apply w-full justify-between;
  }
  
  .integrations-grid {
    @apply grid-cols-1;
  }
}
</style>
