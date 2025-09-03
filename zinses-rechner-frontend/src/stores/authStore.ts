/**
 * 用户认证状态管理
 * 使用Pinia管理用户登录状态和用户数据
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, localAuthService, type AuthUser, type LoginCredentials, type RegisterData } from '@/services/AuthService'
import { isFirebaseInitialized } from '@/config/firebase'

export interface UserPreferences {
  language: 'de' // 仅支持德语
  theme: 'light' // 仅支持浅色主题
  currency: 'EUR'
  decimalPlaces: 2
  autoSave: boolean
  emailNotifications: boolean
}

export interface TaxSettings {
  freistellungsauftrag: number
  churchTax: boolean
  maritalStatus: 'single' | 'married'
  etfType: 'aktien-etf' | 'misch-etf' | 'immobilien-etf' | 'anleihen-etf'
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // 用户偏好设置
  const preferences = ref<UserPreferences>({
    language: 'de',
    theme: 'light',
    currency: 'EUR',
    decimalPlaces: 2,
    autoSave: true,
    emailNotifications: false
  })

  // 税收设置
  const taxSettings = ref<TaxSettings>({
    freistellungsauftrag: 1000, // 默认单身免税额
    churchTax: false,
    maritalStatus: 'single',
    etfType: 'aktien-etf'
  })

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const userDisplayName = computed(() => user.value?.displayName || user.value?.email?.split('@')[0] || 'Benutzer')
  const maxFreistellungsauftrag = computed(() => taxSettings.value.maritalStatus === 'married' ? 2000 : 1000)

  /**
   * 初始化认证状态
   */
  async function initialize(): Promise<void> {
    if (isInitialized.value) return

    isLoading.value = true
    error.value = null

    try {
      if (isFirebaseInitialized()) {
        // 使用Firebase认证
        authService.onAuthStateChanged((firebaseUser) => {
          user.value = firebaseUser
          if (firebaseUser) {
            loadUserData()
          } else {
            clearUserData()
          }
        })
      } else {
        // 使用本地存储fallback
        const localUser = localAuthService.getLocalUser()
        if (localUser) {
          user.value = localUser
          loadUserDataFromLocal()
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Initialisierung fehlgeschlagen'
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  /**
   * 邮箱密码登录
   */
  async function signInWithEmail(credentials: LoginCredentials): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const result = isFirebaseInitialized() 
        ? await authService.signInWithEmail(credentials)
        : await localAuthService.signInLocal(credentials.email)

      if (result.success && result.user) {
        user.value = result.user
        await loadUserData()
        return true
      } else {
        error.value = result.error || 'Anmeldung fehlgeschlagen'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 邮箱密码注册
   */
  async function registerWithEmail(data: RegisterData): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const result = isFirebaseInitialized()
        ? await authService.registerWithEmail(data)
        : await localAuthService.signInLocal(data.email)

      if (result.success && result.user) {
        user.value = result.user
        await initializeUserData()
        return true
      } else {
        error.value = result.error || 'Registrierung fehlgeschlagen'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Google登录
   */
  async function signInWithGoogle(): Promise<boolean> {
    if (!isFirebaseInitialized()) {
      error.value = 'Google-Anmeldung ist nur mit Firebase verfügbar'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const result = await authService.signInWithGoogle()
      
      if (result.success && result.user) {
        user.value = result.user
        await loadUserData()
        return true
      } else {
        error.value = result.error || 'Google-Anmeldung fehlgeschlagen'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Google-Anmeldung fehlgeschlagen'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Apple登录
   */
  async function signInWithApple(): Promise<boolean> {
    if (!isFirebaseInitialized()) {
      error.value = 'Apple-Anmeldung ist nur mit Firebase verfügbar'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const result = await authService.signInWithApple()
      
      if (result.success && result.user) {
        user.value = result.user
        await loadUserData()
        return true
      } else {
        error.value = result.error || 'Apple-Anmeldung fehlgeschlagen'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Apple-Anmeldung fehlgeschlagen'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 退出登录
   */
  async function signOut(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      if (isFirebaseInitialized()) {
        await authService.signOut()
      } else {
        localAuthService.signOutLocal()
      }
      
      user.value = null
      clearUserData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Abmeldung fehlgeschlagen'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新用户偏好设置
   */
  async function updatePreferences(newPreferences: Partial<UserPreferences>): Promise<void> {
    preferences.value = { ...preferences.value, ...newPreferences }
    await saveUserData()
  }

  /**
   * 更新税收设置
   */
  async function updateTaxSettings(newTaxSettings: Partial<TaxSettings>): Promise<void> {
    taxSettings.value = { ...taxSettings.value, ...newTaxSettings }
    
    // 自动调整免税额度上限
    if (newTaxSettings.maritalStatus) {
      const maxAmount = newTaxSettings.maritalStatus === 'married' ? 2000 : 1000
      if (taxSettings.value.freistellungsauftrag > maxAmount) {
        taxSettings.value.freistellungsauftrag = maxAmount
      }
    }
    
    await saveUserData()
  }

  /**
   * 加载用户数据
   */
  async function loadUserData(): Promise<void> {
    if (!user.value) return

    try {
      // 这里应该从Firebase Firestore加载用户数据
      // 暂时使用本地存储
      loadUserDataFromLocal()
    } catch (err) {
      console.error('加载用户数据失败:', err)
    }
  }

  /**
   * 保存用户数据
   */
  async function saveUserData(): Promise<void> {
    if (!user.value) return

    try {
      // 这里应该保存到Firebase Firestore
      // 暂时使用本地存储
      saveUserDataToLocal()
    } catch (err) {
      console.error('保存用户数据失败:', err)
    }
  }

  /**
   * 初始化新用户数据
   */
  async function initializeUserData(): Promise<void> {
    // 为新用户设置默认值
    preferences.value = {
      language: 'de',
      theme: 'light',
      currency: 'EUR',
      decimalPlaces: 2,
      autoSave: true,
      emailNotifications: false
    }

    taxSettings.value = {
      freistellungsauftrag: 1000,
      churchTax: false,
      maritalStatus: 'single',
      etfType: 'aktien-etf'
    }

    await saveUserData()
  }

  /**
   * 从本地存储加载用户数据
   */
  function loadUserDataFromLocal(): void {
    try {
      const savedPreferences = localStorage.getItem(`preferences_${user.value?.uid}`)
      if (savedPreferences) {
        preferences.value = { ...preferences.value, ...JSON.parse(savedPreferences) }
      }

      const savedTaxSettings = localStorage.getItem(`tax_settings_${user.value?.uid}`)
      if (savedTaxSettings) {
        taxSettings.value = { ...taxSettings.value, ...JSON.parse(savedTaxSettings) }
      }
    } catch (err) {
      console.error('从本地存储加载用户数据失败:', err)
    }
  }

  /**
   * 保存用户数据到本地存储
   */
  function saveUserDataToLocal(): void {
    if (!user.value) return

    try {
      localStorage.setItem(`preferences_${user.value.uid}`, JSON.stringify(preferences.value))
      localStorage.setItem(`tax_settings_${user.value.uid}`, JSON.stringify(taxSettings.value))
    } catch (err) {
      console.error('保存用户数据到本地存储失败:', err)
    }
  }

  /**
   * 清除用户数据
   */
  function clearUserData(): void {
    preferences.value = {
      language: 'de',
      theme: 'light',
      currency: 'EUR',
      decimalPlaces: 2,
      autoSave: true,
      emailNotifications: false
    }

    taxSettings.value = {
      freistellungsauftrag: 1000,
      churchTax: false,
      maritalStatus: 'single',
      etfType: 'aktien-etf'
    }
  }

  /**
   * 清除错误状态
   */
  function clearError(): void {
    error.value = null
  }

  return {
    // 状态
    user,
    isLoading,
    error,
    isInitialized,
    preferences,
    taxSettings,
    
    // 计算属性
    isAuthenticated,
    userDisplayName,
    maxFreistellungsauftrag,
    
    // 方法
    initialize,
    signInWithEmail,
    registerWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    updatePreferences,
    updateTaxSettings,
    clearError
  }
})
