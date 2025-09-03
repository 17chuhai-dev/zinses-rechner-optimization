<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="text-xl font-bold text-gray-900">Konto registrieren</h2>
        <button @click="$emit('close')" class="close-button">
          <BaseIcon name="x-mark" size="sm" />
        </button>
      </div>

      <div class="modal-content">
        <div class="mb-6">
          <p class="text-gray-600">
            Registrieren Sie sich, um Ihre Berechnungen geräteübergreifend zu synchronisieren.
            Wir benötigen nur Ihre E-Mail-Adresse.
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- E-Mail Eingabe -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-900 mb-2">
              E-Mail-Adresse *
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              :disabled="isSubmitting"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              :class="{ 
                'border-red-300 focus:ring-red-500 focus:border-red-500': emailError,
                'opacity-50 cursor-not-allowed': isSubmitting
              }"
              placeholder="ihre.email@beispiel.de"
            />
            <div v-if="emailError" class="mt-1 text-sm text-red-600">
              {{ emailError }}
            </div>
            <div class="mt-1 text-xs text-gray-500">
              Ihre E-Mail wird nur für die Kontoverifizierung und Synchronisation verwendet.
            </div>
          </div>

          <!-- Datenschutz-Hinweise -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <BaseIcon name="information-circle" class="text-blue-600 mt-0.5" size="sm" />
              <div class="text-sm">
                <h4 class="font-semibold text-blue-900 mb-2">Datenschutz-Information</h4>
                <ul class="space-y-1 text-blue-800">
                  <li>• Ihre E-Mail wird verschlüsselt gespeichert</li>
                  <li>• Keine Weitergabe an Dritte</li>
                  <li>• Jederzeit löschbar</li>
                  <li>• DSGVO-konform</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Einwilligungen -->
          <div class="space-y-4">
            <h4 class="font-semibold text-gray-900">Einwilligungen</h4>
            
            <!-- Funktionale Daten -->
            <div class="flex items-start space-x-3">
              <input
                id="consent-functional"
                v-model="formData.consents.functional"
                type="checkbox"
                disabled
                checked
                class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 opacity-50"
              />
              <div class="flex-1">
                <label for="consent-functional" class="text-sm font-medium text-gray-900">
                  Funktionale Daten (erforderlich)
                </label>
                <p class="text-xs text-gray-500 mt-1">
                  Notwendig für Kontoverwaltung und Synchronisation
                </p>
              </div>
            </div>

            <!-- Analytics -->
            <div class="flex items-start space-x-3">
              <input
                id="consent-analytics"
                v-model="formData.consents.analytics"
                type="checkbox"
                :disabled="isSubmitting"
                class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div class="flex-1">
                <label for="consent-analytics" class="text-sm font-medium text-gray-900">
                  Analyse & Statistiken (optional)
                </label>
                <p class="text-xs text-gray-500 mt-1">
                  Anonymisierte Nutzungsstatistiken zur Verbesserung der Website
                </p>
              </div>
            </div>

            <!-- Performance Monitoring -->
            <div class="flex items-start space-x-3">
              <input
                id="consent-performance"
                v-model="formData.consents.performance"
                type="checkbox"
                :disabled="isSubmitting"
                class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div class="flex-1">
                <label for="consent-performance" class="text-sm font-medium text-gray-900">
                  Leistungsüberwachung (empfohlen)
                </label>
                <p class="text-xs text-gray-500 mt-1">
                  Technische Daten zur Fehlerdiagnose und Performance-Optimierung
                </p>
              </div>
            </div>
          </div>

          <!-- Datenschutzerklärung -->
          <div class="flex items-start space-x-3">
            <input
              id="privacy-policy"
              v-model="formData.acceptPrivacyPolicy"
              type="checkbox"
              required
              :disabled="isSubmitting"
              class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div class="flex-1">
              <label for="privacy-policy" class="text-sm font-medium text-gray-900">
                Datenschutzerklärung akzeptieren *
              </label>
              <p class="text-xs text-gray-500 mt-1">
                Ich habe die 
                <a href="/datenschutz" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
                  Datenschutzerklärung
                </a> 
                gelesen und akzeptiere sie.
              </p>
            </div>
          </div>

          <!-- Fehler-Anzeige -->
          <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center space-x-2">
              <BaseIcon name="exclamation-triangle" class="text-red-600" size="sm" />
              <span class="text-sm text-red-800">{{ submitError }}</span>
            </div>
          </div>

          <!-- Aktions-Buttons -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <BaseButton
              variant="ghost"
              @click="$emit('close')"
              :disabled="isSubmitting"
            >
              Abbrechen
            </BaseButton>
            <BaseButton
              type="submit"
              :loading="isSubmitting"
              :disabled="!isFormValid"
            >
              Registrieren
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { userIdentityService } from '@/services/UserIdentityService'
import type { User, RegisteredUser } from '@/types/user-identity'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

interface Emits {
  close: []
  registered: [user: RegisteredUser]
}

const emit = defineEmits<Emits>()

// 表单数据
const formData = reactive({
  email: '',
  consents: {
    functional: true, // 总是必需的
    analytics: false,
    performance: true // 默认推荐
  },
  acceptPrivacyPolicy: false
})

// 状态
const isSubmitting = ref(false)
const emailError = ref('')
const submitError = ref('')

// 计算属性
const isFormValid = computed(() => {
  return formData.email.trim() !== '' && 
         formData.acceptPrivacyPolicy && 
         !emailError.value
})

// 邮箱验证
const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return 'E-Mail-Adresse ist erforderlich'
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
  }
  
  // 德国常见域名检查（可选）
  const germanDomains = ['.de', '.com', '.org', '.net', '.eu']
  const hasValidDomain = germanDomains.some(domain => email.toLowerCase().includes(domain))
  if (!hasValidDomain) {
    // 这只是一个警告，不阻止提交
    console.warn('Uncommon email domain detected')
  }
  
  return ''
}

// 处理表单提交
const handleSubmit = async () => {
  // 重置错误
  emailError.value = ''
  submitError.value = ''
  
  // 验证邮箱
  emailError.value = validateEmail(formData.email)
  if (emailError.value) {
    return
  }
  
  try {
    isSubmitting.value = true
    
    // 获取当前匿名用户
    const currentUser = userIdentityService.getCurrentUser()
    if (!currentUser || currentUser.type !== 'anonymous') {
      throw new Error('Kein anonymer Benutzer gefunden')
    }
    
    // 升级为注册用户
    const registeredUser = await userIdentityService.upgradeToRegistered(
      currentUser,
      formData.email.trim()
    )
    
    // 更新同意设置
    if (formData.consents.analytics) {
      await userIdentityService.updateConsent(registeredUser.id, 'analytics', true)
    }
    
    // 发送邮箱验证
    const verificationResult = await userIdentityService.sendEmailVerification(registeredUser.id)
    if (!verificationResult.success) {
      console.warn('Email verification failed:', verificationResult.error)
      // 不阻止注册流程，只是记录警告
    }
    
    // 触发注册成功事件
    emit('registered', registeredUser)
    
  } catch (error) {
    console.error('Registration failed:', error)
    submitError.value = error instanceof Error 
      ? error.message 
      : 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
  } finally {
    isSubmitting.value = false
  }
}

// 处理覆盖层点击
const handleOverlayClick = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

// 监听邮箱输入变化
const handleEmailInput = () => {
  if (emailError.value) {
    emailError.value = validateEmail(formData.email)
  }
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto;
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
</style>
