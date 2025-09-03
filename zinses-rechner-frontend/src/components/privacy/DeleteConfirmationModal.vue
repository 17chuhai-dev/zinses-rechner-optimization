<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <BaseIcon name="exclamation-triangle" class="text-red-600" size="md" />
            </div>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Konto löschen</h2>
            <p class="text-sm text-gray-600">Diese Aktion kann nicht rückgängig gemacht werden</p>
          </div>
        </div>
        <button @click="$emit('close')" class="close-button">
          <BaseIcon name="x-mark" size="sm" />
        </button>
      </div>

      <div class="modal-content">
        <!-- 警告信息 -->
        <div class="mb-6">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 class="font-semibold text-red-900 mb-2">⚠️ Wichtiger Hinweis</h3>
            <p class="text-sm text-red-800 mb-3">
              Durch das Löschen Ihres Kontos werden <strong>alle</strong> Ihre Daten unwiderruflich entfernt:
            </p>
            <ul class="text-sm text-red-800 space-y-1 ml-4">
              <li>• Alle gespeicherten Berechnungen</li>
              <li>• Ihre Einstellungen und Präferenzen</li>
              <li>• Ihr Benutzerkonto und E-Mail-Adresse</li>
              <li>• Synchronisierte Daten auf allen Geräten</li>
              <li>• Alle Verlaufsdaten und Favoriten</li>
            </ul>
          </div>
        </div>

        <!-- DSGVO信息 -->
        <div class="mb-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-2">🛡️ Ihre Rechte nach DSGVO</h3>
            <p class="text-sm text-blue-800 mb-2">
              Sie haben das Recht auf Löschung Ihrer personenbezogenen Daten (Art. 17 DSGVO).
            </p>
            <div class="text-sm text-blue-800">
              <strong>Was passiert nach der Löschung:</strong>
              <ul class="mt-1 ml-4 space-y-1">
                <li>• Sofortige Löschung aller personenbezogenen Daten</li>
                <li>• Anonymisierung von Statistikdaten (falls zugestimmt)</li>
                <li>• Keine Wiederherstellung möglich</li>
                <li>• Bestätigung per E-Mail (falls verfügbar)</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 数据导出提醒 -->
        <div class="mb-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="font-semibold text-yellow-900 mb-2">💾 Daten sichern</h3>
            <p class="text-sm text-yellow-800 mb-3">
              Möchten Sie Ihre Daten vor der Löschung exportieren?
            </p>
            <BaseButton 
              variant="outline" 
              size="sm"
              @click="exportData"
              :loading="isExporting"
              class="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            >
              <BaseIcon name="download" size="sm" class="mr-2" />
              Jetzt exportieren
            </BaseButton>
          </div>
        </div>

        <!-- 确认输入 -->
        <div class="mb-6">
          <label for="confirmation-text" class="block text-sm font-medium text-gray-900 mb-2">
            Bestätigung erforderlich
          </label>
          <p class="text-sm text-gray-600 mb-3">
            Geben Sie <strong>"LÖSCHEN"</strong> ein, um zu bestätigen, dass Sie Ihr Konto unwiderruflich löschen möchten:
          </p>
          <input
            id="confirmation-text"
            v-model="confirmationText"
            type="text"
            :disabled="isDeleting"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
            :class="{ 
              'border-red-300 focus:ring-red-500 focus:border-red-500': confirmationError,
              'opacity-50 cursor-not-allowed': isDeleting
            }"
            placeholder="LÖSCHEN"
            autocomplete="off"
          />
          <div v-if="confirmationError" class="mt-1 text-sm text-red-600">
            {{ confirmationError }}
          </div>
        </div>

        <!-- 最终确认复选框 -->
        <div class="mb-6">
          <div class="flex items-start space-x-3">
            <input
              id="final-confirmation"
              v-model="finalConfirmation"
              type="checkbox"
              :disabled="isDeleting"
              class="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <div class="flex-1">
              <label for="final-confirmation" class="text-sm font-medium text-gray-900">
                Ich verstehe, dass diese Aktion unwiderruflich ist
              </label>
              <p class="text-xs text-gray-500 mt-1">
                Ich bestätige, dass ich alle wichtigen Daten gesichert habe und mein Konto dauerhaft löschen möchte.
              </p>
            </div>
          </div>
        </div>

        <!-- 错误显示 -->
        <div v-if="deleteError" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center space-x-2">
            <BaseIcon name="exclamation-triangle" class="text-red-600" size="sm" />
            <span class="text-sm text-red-800">{{ deleteError }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <BaseButton
            variant="ghost"
            @click="$emit('close')"
            :disabled="isDeleting"
          >
            Abbrechen
          </BaseButton>
          <BaseButton
            variant="danger"
            @click="handleDelete"
            :loading="isDeleting"
            :disabled="!isDeleteEnabled"
          >
            <BaseIcon name="trash" size="sm" class="mr-2" />
            Konto endgültig löschen
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { userIdentityService } from '@/services/UserIdentityService'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

interface Emits {
  close: []
  confirmed: []
}

const emit = defineEmits<Emits>()

// 状态
const confirmationText = ref('')
const finalConfirmation = ref(false)
const isDeleting = ref(false)
const isExporting = ref(false)
const confirmationError = ref('')
const deleteError = ref('')

// 计算属性
const isDeleteEnabled = computed(() => {
  return confirmationText.value.trim().toUpperCase() === 'LÖSCHEN' && 
         finalConfirmation.value && 
         !isDeleting.value
})

// 导出数据
const exportData = async () => {
  try {
    isExporting.value = true
    
    const currentUser = userIdentityService.getCurrentUser()
    if (!currentUser) {
      throw new Error('Kein Benutzer gefunden')
    }
    
    // 获取用户数据
    const userData = {
      user: currentUser,
      exportDate: new Date().toISOString(),
      version: '1.0',
      note: 'Datenexport vor Kontolöschung'
    }
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(userData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `zinses-rechner-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Failed to export data:', error)
    deleteError.value = 'Datenexport fehlgeschlagen'
  } finally {
    isExporting.value = false
  }
}

// 处理删除
const handleDelete = async () => {
  // 重置错误
  confirmationError.value = ''
  deleteError.value = ''
  
  // 验证确认文本
  if (confirmationText.value.trim().toUpperCase() !== 'LÖSCHEN') {
    confirmationError.value = 'Bitte geben Sie "LÖSCHEN" ein, um zu bestätigen'
    return
  }
  
  if (!finalConfirmation.value) {
    deleteError.value = 'Bitte bestätigen Sie, dass Sie die Konsequenzen verstehen'
    return
  }
  
  try {
    isDeleting.value = true
    
    // 获取当前用户
    const currentUser = userIdentityService.getCurrentUser()
    if (!currentUser) {
      throw new Error('Kein Benutzer gefunden')
    }
    
    // 执行删除
    await userIdentityService.deleteUser(currentUser.id)
    
    // 触发确认事件
    emit('confirmed')
    
  } catch (error) {
    console.error('Account deletion failed:', error)
    deleteError.value = error instanceof Error 
      ? error.message 
      : 'Kontolöschung fehlgeschlagen. Bitte versuchen Sie es erneut.'
  } finally {
    isDeleting.value = false
  }
}

// 处理覆盖层点击
const handleOverlayClick = () => {
  if (!isDeleting.value) {
    emit('close')
  }
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.close-button {
  @apply p-1 hover:bg-gray-100 rounded-full transition-colors;
}

.modal-content {
  @apply p-6;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .modal-container {
    @apply max-w-full m-4;
  }
  
  .modal-header,
  .modal-content {
    @apply p-4;
  }
}

/* 动画效果 */
.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  animation: slideIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 危险操作的视觉强调 */
.modal-container {
  @apply border-2 border-red-200;
}
</style>
