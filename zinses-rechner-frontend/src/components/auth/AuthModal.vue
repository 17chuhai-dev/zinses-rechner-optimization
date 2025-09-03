<!--
  用户认证模态框组件
  提供登录、注册、密码重置等功能
-->

<template>
  <div v-if="isVisible" class="auth-modal-overlay" @click="handleOverlayClick">
    <div class="auth-modal" :class="modalClasses" @click.stop>
      <!-- 模态框头部 -->
      <div class="modal-header">
        <div class="header-content">
          <h3 class="modal-title">
            {{ getModalTitle() }}
          </h3>
          <p class="modal-subtitle">
            {{ getModalSubtitle() }}
          </p>
        </div>
        
        <button
          @click="closeModal"
          class="close-button"
          :aria-label="t('auth.close')"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-content">
        <!-- 登录表单 -->
        <form v-if="currentMode === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <div class="form-fields space-y-4">
            <div class="field-group">
              <label class="field-label">{{ t('auth.email') }}</label>
              <input
                v-model="loginForm.email"
                type="email"
                required
                class="field-input"
                :class="{ 'error': errors.email }"
                :placeholder="t('auth.emailPlaceholder')"
                autocomplete="email"
              />
              <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('auth.password') }}</label>
              <div class="password-input-container">
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="field-input"
                  :class="{ 'error': errors.password }"
                  :placeholder="t('auth.passwordPlaceholder')"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="password-toggle"
                >
                  <EyeIcon v-if="!showPassword" class="w-4 h-4" />
                  <EyeSlashIcon v-else class="w-4 h-4" />
                </button>
              </div>
              <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
            </div>
            
            <div class="form-options">
              <label class="checkbox-label">
                <input
                  v-model="loginForm.rememberMe"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkbox-text">{{ t('auth.rememberMe') }}</span>
              </label>
              
              <button
                type="button"
                @click="currentMode = 'forgot'"
                class="forgot-password-link"
              >
                {{ t('auth.forgotPassword') }}
              </button>
            </div>
          </div>
          
          <div class="form-actions">
            <button
              type="submit"
              :disabled="isLoading"
              class="primary-button"
            >
              <ArrowPathIcon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
              <UserIcon v-else class="w-4 h-4 mr-2" />
              {{ isLoading ? t('auth.signingIn') : t('auth.signIn') }}
            </button>
            
            <div class="auth-switch">
              <span class="switch-text">{{ t('auth.noAccount') }}</span>
              <button
                type="button"
                @click="switchToRegister"
                class="switch-link"
              >
                {{ t('auth.signUp') }}
              </button>
            </div>
          </div>
        </form>

        <!-- 注册表单 -->
        <form v-if="currentMode === 'register'" @submit.prevent="handleRegister" class="auth-form">
          <div class="form-fields space-y-4">
            <div class="form-row">
              <div class="field-group">
                <label class="field-label">{{ t('auth.firstName') }}</label>
                <input
                  v-model="registerForm.firstName"
                  type="text"
                  required
                  class="field-input"
                  :class="{ 'error': errors.firstName }"
                  :placeholder="t('auth.firstNamePlaceholder')"
                  autocomplete="given-name"
                />
                <div v-if="errors.firstName" class="field-error">{{ errors.firstName }}</div>
              </div>
              
              <div class="field-group">
                <label class="field-label">{{ t('auth.lastName') }}</label>
                <input
                  v-model="registerForm.lastName"
                  type="text"
                  required
                  class="field-input"
                  :class="{ 'error': errors.lastName }"
                  :placeholder="t('auth.lastNamePlaceholder')"
                  autocomplete="family-name"
                />
                <div v-if="errors.lastName" class="field-error">{{ errors.lastName }}</div>
              </div>
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('auth.username') }}</label>
              <input
                v-model="registerForm.username"
                type="text"
                required
                class="field-input"
                :class="{ 'error': errors.username }"
                :placeholder="t('auth.usernamePlaceholder')"
                autocomplete="username"
              />
              <div v-if="errors.username" class="field-error">{{ errors.username }}</div>
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('auth.email') }}</label>
              <input
                v-model="registerForm.email"
                type="email"
                required
                class="field-input"
                :class="{ 'error': errors.email }"
                :placeholder="t('auth.emailPlaceholder')"
                autocomplete="email"
              />
              <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('auth.password') }}</label>
              <div class="password-input-container">
                <input
                  v-model="registerForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="field-input"
                  :class="{ 'error': errors.password }"
                  :placeholder="t('auth.passwordPlaceholder')"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="password-toggle"
                >
                  <EyeIcon v-if="!showPassword" class="w-4 h-4" />
                  <EyeSlashIcon v-else class="w-4 h-4" />
                </button>
              </div>
              <div class="password-strength">
                <div class="strength-bar">
                  <div 
                    class="strength-fill"
                    :class="getPasswordStrengthClasses()"
                    :style="{ width: `${passwordStrength}%` }"
                  ></div>
                </div>
                <span class="strength-text">{{ getPasswordStrengthText() }}</span>
              </div>
              <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
            </div>
            
            <div class="field-group">
              <label class="field-label">{{ t('auth.confirmPassword') }}</label>
              <input
                v-model="registerForm.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                required
                class="field-input"
                :class="{ 'error': errors.confirmPassword }"
                :placeholder="t('auth.confirmPasswordPlaceholder')"
                autocomplete="new-password"
              />
              <div v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</div>
            </div>
            
            <div class="form-agreements">
              <label class="checkbox-label">
                <input
                  v-model="registerForm.acceptTerms"
                  type="checkbox"
                  required
                  class="checkbox-input"
                />
                <span class="checkbox-text">
                  {{ t('auth.acceptTerms') }}
                  <a href="/terms" target="_blank" class="terms-link">{{ t('auth.termsOfService') }}</a>
                  {{ t('auth.and') }}
                  <a href="/privacy" target="_blank" class="terms-link">{{ t('auth.privacyPolicy') }}</a>
                </span>
              </label>
              
              <label class="checkbox-label">
                <input
                  v-model="registerForm.acceptMarketing"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkbox-text">{{ t('auth.acceptMarketing') }}</span>
              </label>
            </div>
          </div>
          
          <div class="form-actions">
            <button
              type="submit"
              :disabled="isLoading || !canRegister"
              class="primary-button"
            >
              <ArrowPathIcon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
              <UserPlusIcon v-else class="w-4 h-4 mr-2" />
              {{ isLoading ? t('auth.creatingAccount') : t('auth.createAccount') }}
            </button>
            
            <div class="auth-switch">
              <span class="switch-text">{{ t('auth.haveAccount') }}</span>
              <button
                type="button"
                @click="switchToLogin"
                class="switch-link"
              >
                {{ t('auth.signIn') }}
              </button>
            </div>
          </div>
        </form>

        <!-- 忘记密码表单 -->
        <form v-if="currentMode === 'forgot'" @submit.prevent="handleForgotPassword" class="auth-form">
          <div class="form-fields space-y-4">
            <div class="field-group">
              <label class="field-label">{{ t('auth.email') }}</label>
              <input
                v-model="forgotForm.email"
                type="email"
                required
                class="field-input"
                :class="{ 'error': errors.email }"
                :placeholder="t('auth.emailPlaceholder')"
                autocomplete="email"
              />
              <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
            </div>
            
            <div class="forgot-info">
              <InformationCircleIcon class="w-5 h-5 text-blue-500" />
              <p class="info-text">{{ t('auth.forgotPasswordInfo') }}</p>
            </div>
          </div>
          
          <div class="form-actions">
            <button
              type="submit"
              :disabled="isLoading"
              class="primary-button"
            >
              <ArrowPathIcon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
              <EnvelopeIcon v-else class="w-4 h-4 mr-2" />
              {{ isLoading ? t('auth.sending') : t('auth.sendResetLink') }}
            </button>
            
            <div class="auth-switch">
              <button
                type="button"
                @click="switchToLogin"
                class="switch-link"
              >
                {{ t('auth.backToSignIn') }}
              </button>
            </div>
          </div>
        </form>

        <!-- 成功消息 -->
        <div v-if="successMessage" class="success-message">
          <CheckCircleIcon class="w-5 h-5 text-green-500" />
          <span class="success-text">{{ successMessage }}</span>
        </div>

        <!-- 错误消息 -->
        <div v-if="generalError" class="error-message">
          <ExclamationTriangleIcon class="w-5 h-5 text-red-500" />
          <span class="error-text">{{ generalError }}</span>
        </div>
      </div>

      <!-- 社交登录 -->
      <div v-if="currentMode !== 'forgot'" class="social-login">
        <div class="divider">
          <span class="divider-text">{{ t('auth.orContinueWith') }}</span>
        </div>
        
        <div class="social-buttons">
          <button
            @click="handleSocialLogin('google')"
            class="social-button google"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          
          <button
            @click="handleSocialLogin('microsoft')"
            class="social-button microsoft"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
            </svg>
            Microsoft
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  UserPlusIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useUserManager } from '@/services/UserManager'
import { useI18n } from '@/services/I18nService'

// Props
interface Props {
  isVisible: boolean
  initialMode?: 'login' | 'register' | 'forgot'
}

// Emits
interface Emits {
  'close': []
  'success': [user: any]
  'error': [error: string]
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'login'
})

const emit = defineEmits<Emits>()

// 使用服务
const { register, login, isLoading } = useUserManager()
const { t } = useI18n()

// 响应式状态
const currentMode = ref<'login' | 'register' | 'forgot'>(props.initialMode)
const showPassword = ref(false)
const successMessage = ref('')
const generalError = ref('')

// 表单数据
const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const registerForm = reactive({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  acceptMarketing: false
})

const forgotForm = reactive({
  email: ''
})

// 表单错误
const errors = reactive<Record<string, string>>({})

// 计算属性
const modalClasses = computed(() => [
  'auth-modal-content',
  `mode-${currentMode.value}`
])

const passwordStrength = computed(() => {
  const password = registerForm.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength += 25
  if (/[a-z]/.test(password)) strength += 25
  if (/[A-Z]/.test(password)) strength += 25
  if (/[0-9]/.test(password)) strength += 25
  
  return strength
})

const canRegister = computed(() => {
  return registerForm.acceptTerms && 
         registerForm.password === registerForm.confirmPassword &&
         passwordStrength.value >= 50
})

// 监听器
watch(() => props.isVisible, (visible) => {
  if (visible) {
    clearForms()
    clearErrors()
  }
})

watch(() => registerForm.password, () => {
  validatePassword()
})

watch(() => registerForm.confirmPassword, () => {
  validateConfirmPassword()
})

// 方法
const getModalTitle = (): string => {
  switch (currentMode.value) {
    case 'login': return t('auth.signIn')
    case 'register': return t('auth.createAccount')
    case 'forgot': return t('auth.resetPassword')
    default: return ''
  }
}

const getModalSubtitle = (): string => {
  switch (currentMode.value) {
    case 'login': return t('auth.signInSubtitle')
    case 'register': return t('auth.createAccountSubtitle')
    case 'forgot': return t('auth.resetPasswordSubtitle')
    default: return ''
  }
}

const getPasswordStrengthClasses = (): string[] => {
  const strength = passwordStrength.value
  const classes = ['transition-all', 'duration-300']
  
  if (strength < 25) classes.push('bg-red-500')
  else if (strength < 50) classes.push('bg-yellow-500')
  else if (strength < 75) classes.push('bg-blue-500')
  else classes.push('bg-green-500')
  
  return classes
}

const getPasswordStrengthText = (): string => {
  const strength = passwordStrength.value
  
  if (strength < 25) return t('auth.passwordWeak')
  if (strength < 50) return t('auth.passwordFair')
  if (strength < 75) return t('auth.passwordGood')
  return t('auth.passwordStrong')
}

const handleOverlayClick = (): void => {
  closeModal()
}

const closeModal = (): void => {
  emit('close')
}

const switchToLogin = (): void => {
  currentMode.value = 'login'
  clearErrors()
}

const switchToRegister = (): void => {
  currentMode.value = 'register'
  clearErrors()
}

const handleLogin = async (): Promise<void> => {
  clearErrors()
  
  if (!validateLoginForm()) return

  try {
    const result = await login({
      email: loginForm.email,
      password: loginForm.password,
      rememberMe: loginForm.rememberMe
    })

    if (result.success && result.user) {
      successMessage.value = t('auth.loginSuccess')
      emit('success', result.user)
      setTimeout(() => {
        closeModal()
      }, 1500)
    } else {
      generalError.value = result.error || t('auth.loginFailed')
      emit('error', generalError.value)
    }
  } catch (error) {
    generalError.value = t('auth.loginFailed')
    emit('error', generalError.value)
  }
}

const handleRegister = async (): Promise<void> => {
  clearErrors()
  
  if (!validateRegisterForm()) return

  try {
    const result = await register({
      email: registerForm.email,
      password: registerForm.password,
      username: registerForm.username,
      firstName: registerForm.firstName,
      lastName: registerForm.lastName
    })

    if (result.success && result.user) {
      successMessage.value = t('auth.registerSuccess')
      emit('success', result.user)
      setTimeout(() => {
        closeModal()
      }, 1500)
    } else {
      generalError.value = result.error || t('auth.registerFailed')
      emit('error', generalError.value)
    }
  } catch (error) {
    generalError.value = t('auth.registerFailed')
    emit('error', generalError.value)
  }
}

const handleForgotPassword = async (): Promise<void> => {
  clearErrors()
  
  if (!forgotForm.email) {
    errors.email = t('auth.emailRequired')
    return
  }

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    successMessage.value = t('auth.resetLinkSent')
    setTimeout(() => {
      switchToLogin()
    }, 2000)
  } catch (error) {
    generalError.value = t('auth.resetFailed')
  }
}

const handleSocialLogin = async (provider: 'google' | 'microsoft'): Promise<void> => {
  try {
    // 模拟社交登录
    console.log(`Social login with ${provider}`)
    generalError.value = t('auth.socialLoginNotAvailable')
  } catch (error) {
    generalError.value = t('auth.socialLoginFailed')
  }
}

const validateLoginForm = (): boolean => {
  let isValid = true

  if (!loginForm.email) {
    errors.email = t('auth.emailRequired')
    isValid = false
  }

  if (!loginForm.password) {
    errors.password = t('auth.passwordRequired')
    isValid = false
  }

  return isValid
}

const validateRegisterForm = (): boolean => {
  let isValid = true

  if (!registerForm.firstName) {
    errors.firstName = t('auth.firstNameRequired')
    isValid = false
  }

  if (!registerForm.lastName) {
    errors.lastName = t('auth.lastNameRequired')
    isValid = false
  }

  if (!registerForm.username) {
    errors.username = t('auth.usernameRequired')
    isValid = false
  }

  if (!registerForm.email) {
    errors.email = t('auth.emailRequired')
    isValid = false
  }

  if (!registerForm.password) {
    errors.password = t('auth.passwordRequired')
    isValid = false
  } else if (passwordStrength.value < 50) {
    errors.password = t('auth.passwordTooWeak')
    isValid = false
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    errors.confirmPassword = t('auth.passwordMismatch')
    isValid = false
  }

  if (!registerForm.acceptTerms) {
    generalError.value = t('auth.mustAcceptTerms')
    isValid = false
  }

  return isValid
}

const validatePassword = (): void => {
  if (registerForm.password && passwordStrength.value < 50) {
    errors.password = t('auth.passwordTooWeak')
  } else {
    errors.password = ''
  }
}

const validateConfirmPassword = (): void => {
  if (registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword) {
    errors.confirmPassword = t('auth.passwordMismatch')
  } else {
    errors.confirmPassword = ''
  }
}

const clearForms = (): void => {
  Object.assign(loginForm, {
    email: '',
    password: '',
    rememberMe: false
  })

  Object.assign(registerForm, {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false
  })

  Object.assign(forgotForm, {
    email: ''
  })
}

const clearErrors = (): void => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  generalError.value = ''
  successMessage.value = ''
}
</script>

<style scoped>
.auth-modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

.auth-modal {
  @apply bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto;
}

.modal-header {
  @apply flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.modal-subtitle {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.close-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors duration-200;
}

.modal-content {
  @apply p-6;
}

.auth-form {
  @apply space-y-6;
}

.form-row {
  @apply grid grid-cols-2 gap-4;
}

.field-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.field-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200;
}

.field-input.error {
  @apply border-red-500 focus:ring-red-500;
}

.field-error {
  @apply text-sm text-red-600 dark:text-red-400 mt-1;
}

.password-input-container {
  @apply relative;
}

.password-toggle {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300;
}

.password-strength {
  @apply mt-2;
}

.strength-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.strength-fill {
  @apply h-full transition-all duration-300;
}

.strength-text {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.form-options {
  @apply flex items-center justify-between;
}

.checkbox-label {
  @apply flex items-start space-x-2 cursor-pointer;
}

.checkbox-input {
  @apply w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5;
}

.checkbox-text {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.forgot-password-link,
.switch-link,
.terms-link {
  @apply text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium;
}

.form-agreements {
  @apply space-y-3;
}

.primary-button {
  @apply w-full flex items-center justify-center px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md font-medium transition-colors duration-200;
}

.auth-switch {
  @apply text-center;
}

.switch-text {
  @apply text-sm text-gray-600 dark:text-gray-400 mr-1;
}

.forgot-info {
  @apply flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md;
}

.info-text {
  @apply text-sm text-blue-700 dark:text-blue-300;
}

.success-message,
.error-message {
  @apply flex items-center space-x-2 p-3 rounded-md;
}

.success-message {
  @apply bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800;
}

.error-message {
  @apply bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800;
}

.success-text {
  @apply text-sm text-green-700 dark:text-green-400;
}

.error-text {
  @apply text-sm text-red-700 dark:text-red-400;
}

.social-login {
  @apply px-6 pb-6;
}

.divider {
  @apply relative my-6;
}

.divider::before {
  @apply absolute inset-0 flex items-center;
  content: '';
}

.divider::before {
  @apply border-t border-gray-300 dark:border-gray-600;
}

.divider-text {
  @apply relative bg-white dark:bg-gray-900 px-4 text-sm text-gray-500 dark:text-gray-500;
}

.social-buttons {
  @apply grid grid-cols-2 gap-3;
}

.social-button {
  @apply flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200;
}

.social-button.google {
  @apply hover:border-red-300 hover:text-red-600;
}

.social-button.microsoft {
  @apply hover:border-blue-300 hover:text-blue-600;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .form-row {
    @apply grid-cols-1;
  }
  
  .social-buttons {
    @apply grid-cols-1;
  }
}

/* 动画 */
.auth-modal {
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
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
