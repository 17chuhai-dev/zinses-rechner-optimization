<template>
  <div class="data-management">
    <BaseCard title="Datenschutz & Datenverwaltung" padding="lg">
      <!-- DSGVO信息 -->
      <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-start space-x-3">
          <BaseIcon name="shield-check" class="text-blue-600 mt-1" />
          <div>
            <h3 class="font-semibold text-blue-900 mb-2">DSGVO-konform</h3>
            <p class="text-sm text-blue-800">
              Alle Ihre Daten werden verschlüsselt und lokal in Ihrem Browser gespeichert. 
              Wir übertragen keine persönlichen Daten an externe Server.
            </p>
          </div>
        </div>
      </div>

      <!-- 存储使用情况 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Speichernutzung</h3>
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">Verwendeter Speicher</span>
            <span class="text-sm font-medium">
              {{ formatBytes(storageInfo.used) }} / {{ formatBytes(storageInfo.available) }}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(storageInfo.percentage, 100)}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ storageInfo.percentage.toFixed(1) }}% verwendet
          </p>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Ihre Daten</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <div class="flex items-center space-x-2">
              <BaseIcon name="calculator" class="text-green-600" />
              <div>
                <p class="text-sm text-green-600">Berechnungen</p>
                <p class="text-xl font-bold text-green-900">{{ dataStats.totalCalculations }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div class="flex items-center space-x-2">
              <BaseIcon name="star" class="text-yellow-600" />
              <div>
                <p class="text-sm text-yellow-600">Favoriten</p>
                <p class="text-xl font-bold text-yellow-900">{{ dataStats.favoriteCount }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div class="flex items-center space-x-2">
              <BaseIcon name="clock" class="text-purple-600" />
              <div>
                <p class="text-sm text-purple-600">Aufbewahrung</p>
                <p class="text-xl font-bold text-purple-900">{{ preferences.dataRetentionDays }} Tage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据保留设置 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Datenaufbewahrung</h3>
        <div class="bg-gray-50 p-4 rounded-lg">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Daten automatisch löschen nach (Tage)
          </label>
          <div class="flex items-center space-x-4">
            <BaseSlider
              v-model="preferences.dataRetentionDays"
              :min="30"
              :max="1095"
              :step="30"
              :show-value="true"
              class="flex-1"
              @change="savePreferences"
            />
            <span class="text-sm text-gray-600 min-w-0">
              {{ Math.floor(preferences.dataRetentionDays / 30) }} Monate
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Berechnungen älter als {{ preferences.dataRetentionDays }} Tage werden automatisch gelöscht.
          </p>
        </div>
      </div>

      <!-- DSGVO权利操作 -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900">Ihre Rechte nach DSGVO</h3>
        
        <!-- 数据导出 -->
        <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 class="font-medium text-gray-900">Datenexport</h4>
            <p class="text-sm text-gray-600">
              Laden Sie alle Ihre gespeicherten Daten als JSON-Datei herunter.
            </p>
          </div>
          <BaseButton
            variant="secondary"
            size="sm"
            :loading="isExporting"
            @click="exportData"
          >
            <BaseIcon name="download" size="sm" class="mr-2" />
            Exportieren
          </BaseButton>
        </div>

        <!-- 数据清理 -->
        <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 class="font-medium text-gray-900">Alte Daten löschen</h4>
            <p class="text-sm text-gray-600">
              Löschen Sie Berechnungen, die älter als die eingestellte Aufbewahrungszeit sind.
            </p>
          </div>
          <BaseButton
            variant="secondary"
            size="sm"
            :loading="isCleaning"
            @click="cleanupOldData"
          >
            <BaseIcon name="trash" size="sm" class="mr-2" />
            Bereinigen
          </BaseButton>
        </div>

        <!-- 完全删除 -->
        <div class="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
          <div>
            <h4 class="font-medium text-red-900">Alle Daten löschen</h4>
            <p class="text-sm text-red-600">
              Löschen Sie unwiderruflich alle gespeicherten Berechnungen und Einstellungen.
            </p>
          </div>
          <BaseButton
            variant="danger"
            size="sm"
            :loading="isDeleting"
            @click="confirmDeleteAll"
          >
            <BaseIcon name="exclamation-triangle" size="sm" class="mr-2" />
            Alle löschen
          </BaseButton>
        </div>
      </div>

      <!-- 隐私信息 -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 class="font-medium text-gray-900 mb-2">Datenschutz-Information</h4>
        <ul class="text-sm text-gray-600 space-y-1">
          <li>• Alle Daten werden verschlüsselt in Ihrem Browser gespeichert</li>
          <li>• Keine Übertragung an externe Server</li>
          <li>• Sie haben jederzeit die volle Kontrolle über Ihre Daten</li>
          <li>• Automatische Löschung nach der eingestellten Zeit</li>
          <li>• Vollständige DSGVO-Konformität</li>
        </ul>
      </div>
    </BaseCard>

    <!-- 确认删除对话框 -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg max-w-md mx-4">
        <div class="flex items-center space-x-3 mb-4">
          <BaseIcon name="exclamation-triangle" class="text-red-600" size="lg" />
          <h3 class="text-lg font-semibold text-gray-900">Alle Daten löschen?</h3>
        </div>
        
        <p class="text-gray-600 mb-6">
          Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Berechnungen, 
          Favoriten und Einstellungen werden permanent gelöscht.
        </p>
        
        <div class="flex space-x-3">
          <BaseButton
            variant="danger"
            :loading="isDeleting"
            @click="deleteAllData"
            class="flex-1"
          >
            Ja, alles löschen
          </BaseButton>
          <BaseButton
            variant="secondary"
            @click="showDeleteConfirm = false"
            class="flex-1"
          >
            Abbrechen
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { localStorageService, type UserPreferences } from '@/services/LocalStorageService'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseIcon from '../ui/BaseIcon.vue'
import BaseSlider from '../ui/BaseSlider.vue'

// 状态管理
const storageInfo = ref({
  used: 0,
  available: 0,
  percentage: 0
})

const dataStats = ref({
  totalCalculations: 0,
  favoriteCount: 0
})

const preferences = ref<UserPreferences>({
  theme: 'auto',
  language: 'de',
  currency: 'EUR',
  dateFormat: 'DD.MM.YYYY',
  numberFormat: 'de-DE',
  autoSave: true,
  dataRetentionDays: 365
})

const isExporting = ref(false)
const isCleaning = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

// 方法
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const loadData = async () => {
  try {
    // 加载存储信息
    storageInfo.value = await localStorageService.getStorageInfo()
    
    // 加载用户偏好
    preferences.value = await localStorageService.getUserPreferences()
    
    // 加载数据统计
    const exportData = await localStorageService.exportAllData()
    dataStats.value = {
      totalCalculations: exportData.metadata.totalCalculations,
      favoriteCount: exportData.metadata.favoriteCount
    }
  } catch (error) {
    console.error('Failed to load data management info:', error)
  }
}

const savePreferences = async () => {
  try {
    await localStorageService.saveUserPreferences(preferences.value)
  } catch (error) {
    console.error('Failed to save preferences:', error)
  }
}

const exportData = async () => {
  isExporting.value = true
  
  try {
    const data = await localStorageService.exportAllData()
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `zinses-rechner-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export data:', error)
  } finally {
    isExporting.value = false
  }
}

const cleanupOldData = async () => {
  isCleaning.value = true
  
  try {
    // 重新初始化服务以触发清理
    await localStorageService.initialize()
    await loadData()
  } catch (error) {
    console.error('Failed to cleanup old data:', error)
  } finally {
    isCleaning.value = false
  }
}

const confirmDeleteAll = () => {
  showDeleteConfirm.value = true
}

const deleteAllData = async () => {
  isDeleting.value = true
  
  try {
    await localStorageService.deleteAllData()
    
    // 重新加载数据
    await loadData()
    
    showDeleteConfirm.value = false
  } catch (error) {
    console.error('Failed to delete all data:', error)
  } finally {
    isDeleting.value = false
  }
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.data-management {
  @apply max-w-4xl mx-auto;
}
</style>
