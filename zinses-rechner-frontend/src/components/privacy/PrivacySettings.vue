<template>
  <div class="privacy-settings">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Datenschutz-Einstellungen</h1>
      <p class="text-gray-600">
        Verwalten Sie Ihre Privatsphäre und kontrollieren Sie, wie Ihre Daten verwendet werden.
        Alle Einstellungen entsprechen der DSGVO.
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Einstellungen werden geladen...</span>
    </div>

    <!-- 主要内容 -->
    <div v-else class="space-y-8">
      <!-- 用户状态卡片 -->
      <BaseCard title="Ihr Konto-Status" padding="lg">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BaseIcon :name="currentUser?.type === 'registered' ? 'user-check' : 'user'" 
                       class="text-blue-600" size="lg" />
            </div>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ currentUser?.type === 'registered' ? 'Registrierter Benutzer' : 'Anonymer Benutzer' }}
            </h3>
            <p class="text-gray-600">
              {{ currentUser?.type === 'registered' 
                ? `Registriert seit ${formatDate(currentUser.registrationDate)}` 
                : 'Alle Daten werden lokal gespeichert' }}
            </p>
            <p v-if="currentUser?.email" class="text-sm text-gray-500 mt-1">
              {{ currentUser.email }} 
              <span v-if="currentUser.emailVerified" class="text-green-600 ml-2">✓ Verifiziert</span>
              <span v-else class="text-orange-600 ml-2">⚠ Nicht verifiziert</span>
            </p>
          </div>
          <div class="flex-shrink-0">
            <BaseButton 
              v-if="currentUser?.type === 'anonymous'"
              variant="outline" 
              size="sm"
              @click="showRegistrationModal = true"
            >
              Registrieren
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- 数据收集和同意设置 -->
      <BaseCard title="Datenverarbeitung & Einwilligung" padding="lg">
        <div class="space-y-6">
          <!-- 功能性数据 -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900">Funktionale Daten</h4>
              <p class="text-sm text-gray-600 mt-1">
                Notwendig für die Grundfunktionen: Berechnungen speichern, Einstellungen merken
              </p>
              <div class="text-xs text-gray-500 mt-2">
                Rechtsgrundlage: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)
              </div>
            </div>
            <div class="flex-shrink-0 ml-4">
              <ToggleSwitch 
                :modelValue="consentSettings.functional.status === 'granted'"
                disabled
                label="Immer aktiv"
              />
            </div>
          </div>

          <!-- 分析数据 -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900">Analyse & Statistiken</h4>
              <p class="text-sm text-gray-600 mt-1">
                Anonymisierte Nutzungsstatistiken zur Verbesserung der Website
              </p>
              <div class="text-xs text-gray-500 mt-2">
                Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)
              </div>
            </div>
            <div class="flex-shrink-0 ml-4">
              <ToggleSwitch 
                :modelValue="consentSettings.analytics.status === 'granted'"
                @update:modelValue="updateConsent('analytics', $event)"
                label="Analytics"
              />
            </div>
          </div>

          <!-- 性能监控 -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900">Leistungsüberwachung</h4>
              <p class="text-sm text-gray-600 mt-1">
                Technische Daten zur Fehlerdiagnose und Performance-Optimierung
              </p>
              <div class="text-xs text-gray-500 mt-2">
                Rechtsgrundlage: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)
              </div>
            </div>
            <div class="flex-shrink-0 ml-4">
              <ToggleSwitch 
                :modelValue="userPreferences.privacy.performanceMonitoring"
                @update:modelValue="updatePreference('privacy.performanceMonitoring', $event)"
                label="Performance"
              />
            </div>
          </div>
        </div>

        <!-- 同意历史 -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-3">Einwilligungshistorie</h4>
          <div class="space-y-2">
            <div v-for="(consent, purpose) in consentSettings" :key="purpose" 
                 class="flex justify-between text-sm">
              <span class="capitalize">{{ purpose }}</span>
              <span class="text-gray-500">
                {{ consent.status }} - {{ formatDate(consent.timestamp) }}
              </span>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 数据同步设置 -->
      <BaseCard v-if="currentUser?.type === 'registered'" title="Datensynchronisation" padding="lg">
        <div class="space-y-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900">Geräteübergreifende Synchronisation</h4>
              <p class="text-sm text-gray-600 mt-1">
                Synchronisieren Sie Ihre Berechnungen und Einstellungen zwischen verschiedenen Geräten
              </p>
              <div v-if="currentUser.syncEnabled" class="text-xs text-green-600 mt-2">
                Letzte Synchronisation: {{ formatDate(currentUser.syncSettings.lastSync) || 'Nie' }}
              </div>
            </div>
            <div class="flex-shrink-0 ml-4">
              <ToggleSwitch 
                :modelValue="currentUser.syncEnabled"
                @update:modelValue="updateSyncSettings('enabled', $event)"
                label="Sync"
              />
            </div>
          </div>

          <div v-if="currentUser.syncEnabled" class="pl-4 border-l-2 border-blue-200 space-y-4">
            <!-- 自动同步 -->
            <div class="flex items-center justify-between">
              <div>
                <h5 class="font-medium text-gray-900">Automatische Synchronisation</h5>
                <p class="text-sm text-gray-600">Daten automatisch synchronisieren</p>
              </div>
              <ToggleSwitch 
                :modelValue="currentUser.syncSettings.autoSync"
                @update:modelValue="updateSyncSettings('autoSync', $event)"
                label="Auto-Sync"
              />
            </div>

            <!-- 同步频率 -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Synchronisationsfrequenz
              </label>
              <select 
                :value="currentUser.syncSettings.syncFrequency"
                @change="updateSyncSettings('syncFrequency', $event.target.value)"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="manual">Manuell</option>
                <option value="hourly">Stündlich</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
              </select>
            </div>

            <!-- 同步的设备列表 -->
            <div v-if="currentUser.syncSettings.syncedDevices.length > 0">
              <h5 class="font-medium text-gray-900 mb-2">Synchronisierte Geräte</h5>
              <div class="space-y-2">
                <div v-for="device in currentUser.syncSettings.syncedDevices" :key="device.id"
                     class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <BaseIcon :name="getDeviceIcon(device.type)" class="text-gray-500" />
                    <div>
                      <div class="font-medium text-gray-900">{{ device.name }}</div>
                      <div class="text-sm text-gray-500">
                        Letzte Aktivität: {{ formatDate(device.lastSync) }}
                      </div>
                    </div>
                  </div>
                  <BaseButton 
                    variant="ghost" 
                    size="sm"
                    @click="removeSyncedDevice(device.id)"
                  >
                    Entfernen
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 数据管理 -->
      <BaseCard title="Datenverwaltung" padding="lg">
        <div class="space-y-6">
          <!-- 数据保留设置 -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">Datenaufbewahrung</h4>
            <div class="flex items-center space-x-4">
              <label class="text-sm font-medium text-gray-900">
                Daten automatisch löschen nach:
              </label>
              <select 
                :value="userPreferences.dataRetentionDays"
                @change="updatePreference('dataRetentionDays', parseInt($event.target.value))"
                class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="90">3 Monate</option>
                <option value="180">6 Monate</option>
                <option value="365">1 Jahr</option>
                <option value="730">2 Jahre</option>
                <option value="1095">3 Jahre (Maximum)</option>
              </select>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Nach Ablauf dieser Zeit werden Ihre Daten automatisch gelöscht (DSGVO Art. 5 Abs. 1 lit. e)
            </p>
          </div>

          <!-- 数据导出 -->
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-semibold text-gray-900">Datenexport</h4>
              <p class="text-sm text-gray-600 mt-1">
                Laden Sie alle Ihre Daten in einem maschinenlesbaren Format herunter
              </p>
            </div>
            <BaseButton 
              variant="outline" 
              @click="exportUserData"
              :loading="isExporting"
            >
              Daten exportieren
            </BaseButton>
          </div>

          <!-- 账户删除 -->
          <div class="pt-6 border-t border-gray-200">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="font-semibold text-red-600">Konto löschen</h4>
                <p class="text-sm text-gray-600 mt-1">
                  Alle Ihre Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              </div>
              <BaseButton 
                variant="danger" 
                @click="showDeleteConfirmation = true"
              >
                Konto löschen
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- DSGVO信息 -->
      <BaseCard title="Ihre Rechte nach DSGVO" padding="lg">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <BaseIcon name="eye" class="text-blue-600 mt-1" size="sm" />
              <div>
                <h5 class="font-medium text-gray-900">Auskunftsrecht (Art. 15)</h5>
                <p class="text-sm text-gray-600">Sie können jederzeit Auskunft über Ihre gespeicherten Daten verlangen.</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <BaseIcon name="edit" class="text-blue-600 mt-1" size="sm" />
              <div>
                <h5 class="font-medium text-gray-900">Berichtigungsrecht (Art. 16)</h5>
                <p class="text-sm text-gray-600">Sie können die Berichtigung unrichtiger Daten verlangen.</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <BaseIcon name="trash" class="text-blue-600 mt-1" size="sm" />
              <div>
                <h5 class="font-medium text-gray-900">Löschungsrecht (Art. 17)</h5>
                <p class="text-sm text-gray-600">Sie können die Löschung Ihrer Daten verlangen.</p>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <BaseIcon name="download" class="text-blue-600 mt-1" size="sm" />
              <div>
                <h5 class="font-medium text-gray-900">Datenübertragbarkeit (Art. 20)</h5>
                <p class="text-sm text-gray-600">Sie können Ihre Daten in einem strukturierten Format erhalten.</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <BaseIcon name="shield" class="text-blue-600 mt-1" size="sm" />
              <div>
                <h5 class="font-medium text-gray-900">Widerspruchsrecht (Art. 21)</h5>
                <p class="text-sm text-gray-600">Sie können der Verarbeitung Ihrer Daten widersprechen.</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <BaseIcon name="pause" class="text-blue-600 mt-1" size="sm" />
              <div>
                <h5 class="font-medium text-gray-900">Einschränkungsrecht (Art. 18)</h5>
                <p class="text-sm text-gray-600">Sie können die Einschränkung der Verarbeitung verlangen.</p>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- 注册模态框 -->
    <RegistrationModal 
      v-if="showRegistrationModal"
      @close="showRegistrationModal = false"
      @registered="handleUserRegistered"
    />

    <!-- 删除确认模态框 -->
    <DeleteConfirmationModal 
      v-if="showDeleteConfirmation"
      @close="showDeleteConfirmation = false"
      @confirmed="handleAccountDeletion"
    />

    <!-- 成功消息 -->
    <div v-if="successMessage" 
         class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { userIdentityService } from '@/services/UserIdentityService'
import type { User, DataProcessingPurpose, ConsentSettings, UserPreferences } from '@/types/user-identity'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import RegistrationModal from './RegistrationModal.vue'
import DeleteConfirmationModal from './DeleteConfirmationModal.vue'

// 响应式数据
const isLoading = ref(true)
const isExporting = ref(false)
const currentUser = ref<User | null>(null)
const consentSettings = ref<ConsentSettings>({} as ConsentSettings)
const userPreferences = ref<UserPreferences>({} as UserPreferences)
const showRegistrationModal = ref(false)
const showDeleteConfirmation = ref(false)
const successMessage = ref('')

// 初始化
onMounted(async () => {
  await loadUserData()
})

// 加载用户数据
const loadUserData = async () => {
  try {
    isLoading.value = true
    await userIdentityService.initialize()
    
    currentUser.value = userIdentityService.getCurrentUser()
    if (currentUser.value) {
      consentSettings.value = currentUser.value.consentSettings
      userPreferences.value = currentUser.value.preferences
    }
  } catch (error) {
    console.error('Failed to load user data:', error)
  } finally {
    isLoading.value = false
  }
}

// 更新同意设置
const updateConsent = async (purpose: DataProcessingPurpose, granted: boolean) => {
  if (!currentUser.value) return
  
  try {
    const updatedUser = await userIdentityService.updateConsent(
      currentUser.value.id, 
      purpose, 
      granted
    )
    currentUser.value = updatedUser
    consentSettings.value = updatedUser.consentSettings
    showSuccessMessage('Einwilligung aktualisiert')
  } catch (error) {
    console.error('Failed to update consent:', error)
  }
}

// 更新用户偏好
const updatePreference = async (key: string, value: any) => {
  if (!currentUser.value) return
  
  try {
    const updates = { preferences: { ...userPreferences.value } }
    
    // 处理嵌套属性
    if (key.includes('.')) {
      const [parent, child] = key.split('.')
      updates.preferences[parent] = { ...updates.preferences[parent], [child]: value }
    } else {
      updates.preferences[key] = value
    }
    
    const updatedUser = await userIdentityService.updateUser(currentUser.value.id, updates)
    currentUser.value = updatedUser
    userPreferences.value = updatedUser.preferences
    showSuccessMessage('Einstellungen gespeichert')
  } catch (error) {
    console.error('Failed to update preferences:', error)
  }
}

// 更新同步设置
const updateSyncSettings = async (key: string, value: any) => {
  if (!currentUser.value || currentUser.value.type !== 'registered') return
  
  try {
    const updates = {
      syncEnabled: key === 'enabled' ? value : currentUser.value.syncEnabled,
      syncSettings: { ...currentUser.value.syncSettings }
    }
    
    if (key !== 'enabled') {
      updates.syncSettings[key] = value
    }
    
    const updatedUser = await userIdentityService.updateUser(currentUser.value.id, updates)
    currentUser.value = updatedUser
    showSuccessMessage('Sync-Einstellungen aktualisiert')
  } catch (error) {
    console.error('Failed to update sync settings:', error)
  }
}

// 导出用户数据
const exportUserData = async () => {
  if (!currentUser.value) return
  
  try {
    isExporting.value = true
    
    // 获取用户数据
    const userData = {
      user: currentUser.value,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(userData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `zinses-rechner-daten-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    showSuccessMessage('Daten erfolgreich exportiert')
  } catch (error) {
    console.error('Failed to export user data:', error)
  } finally {
    isExporting.value = false
  }
}

// 处理用户注册
const handleUserRegistered = (user: User) => {
  currentUser.value = user
  consentSettings.value = user.consentSettings
  userPreferences.value = user.preferences
  showRegistrationModal.value = false
  showSuccessMessage('Erfolgreich registriert!')
}

// 处理账户删除
const handleAccountDeletion = async () => {
  if (!currentUser.value) return
  
  try {
    await userIdentityService.deleteUser(currentUser.value.id)
    currentUser.value = null
    showDeleteConfirmation.value = false
    showSuccessMessage('Konto erfolgreich gelöscht')
    
    // 重定向到主页
    setTimeout(() => {
      window.location.href = '/'
    }, 2000)
  } catch (error) {
    console.error('Failed to delete account:', error)
  }
}

// 移除同步设备
const removeSyncedDevice = async (deviceId: string) => {
  if (!currentUser.value || currentUser.value.type !== 'registered') return
  
  try {
    const updatedDevices = currentUser.value.syncSettings.syncedDevices.filter(
      device => device.id !== deviceId
    )
    
    await updateSyncSettings('syncedDevices', updatedDevices)
    showSuccessMessage('Gerät entfernt')
  } catch (error) {
    console.error('Failed to remove synced device:', error)
  }
}

// 工具函数
const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'Nie'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType) {
    case 'mobile': return 'device-phone-mobile'
    case 'tablet': return 'device-tablet'
    case 'desktop': return 'computer-desktop'
    default: return 'device-phone-mobile'
  }
}

const showSuccessMessage = (message: string) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}
</script>

<style scoped>
.privacy-settings {
  max-width: 4xl;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 768px) {
  .privacy-settings {
    padding: 1rem;
  }
}
</style>
