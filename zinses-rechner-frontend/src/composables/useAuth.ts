/**
 * 用户认证Composable
 * 提供响应式的用户认证状态管理和操作
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { authService } from '@/services/AuthService'
import type { AuthUser, LoginCredentials, RegisterData } from '@/services/AuthService'

export function useAuth() {
  // 响应式状态
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const isEmailVerified = computed(() => user.value?.emailVerified ?? false)
  const userDisplayName = computed(() => user.value?.displayName || user.value?.email || 'Benutzer')
  const userInitials = computed(() => {
    if (!user.value) return ''
    const name = user.value.displayName || user.value.email || ''
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  })

  // 事件监听器清理函数
  let unsubscribeAuth: (() => void) | null = null
  const eventCleanupFunctions: (() => void)[] = []

  /**
   * 用户登录
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authService.login(credentials)
      
      if (result.success && result.user) {
        user.value = result.user
        return true
      } else {
        error.value = result.error || '登录失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录时发生错误'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 用户注册
   */
  const register = async (data: RegisterData): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authService.register(data)
      
      if (result.success && result.user) {
        user.value = result.user
        return true
      } else {
        error.value = result.error || '注册失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册时发生错误'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Google登录
   */
  const loginWithGoogle = async (): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authService.loginWithGoogle()
      
      if (result.success && result.user) {
        user.value = result.user
        return true
      } else {
        error.value = result.error || 'Google登录失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Google登录时发生错误'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Apple登录
   */
  const loginWithApple = async (): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authService.loginWithApple()
      
      if (result.success && result.user) {
        user.value = result.user
        return true
      } else {
        error.value = result.error || 'Apple登录失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Apple登录时发生错误'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 用户登出
   */
  const logout = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      await authService.logout()
      user.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登出时发生错误'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 发送密码重置邮件
   */
  const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authService.sendPasswordResetEmail(email)
      
      if (result.success) {
        return true
      } else {
        error.value = result.error || '发送重置邮件失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '发送重置邮件时发生错误'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新用户资料
   */
  const updateProfile = async (updates: { displayName?: string; photoURL?: string }): Promise<boolean> => {
    if (!user.value) return false

    isLoading.value = true
    error.value = null

    try {
      const result = await authService.updateProfile(updates)
      
      if (result.success && result.user) {
        user.value = result.user
        return true
      } else {
        error.value = result.error || '更新资料失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新资料时发生错误'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 重新发送验证邮件
   */
  const resendVerificationEmail = async (): Promise<boolean> => {
    if (!user.value) return false

    isLoading.value = true
    error.value = null

    try {
      const result = await authService.sendEmailVerification()
      
      if (result.success) {
        return true
      } else {
        error.value = result.error || '发送验证邮件失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '发送验证邮件时发生错误'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除错误信息
   */
  const clearError = (): void => {
    error.value = null
  }

  /**
   * 检查用户权限
   */
  const hasPermission = (permission: string): boolean => {
    if (!user.value) return false
    
    // 这里可以根据用户角色或权限系统来判断
    // 目前简单实现，所有认证用户都有基本权限
    const basicPermissions = ['read', 'create_calculation', 'share_calculation']
    return basicPermissions.includes(permission)
  }

  /**
   * 检查用户是否为高级用户
   */
  const isPremiumUser = computed(() => {
    // 这里可以根据用户的订阅状态来判断
    // 目前简单实现，所有用户都是基础用户
    return false
  })

  /**
   * 获取用户统计信息
   */
  const getUserStats = async () => {
    if (!user.value) return null

    try {
      // 这里可以调用API获取用户统计信息
      return {
        calculationsCreated: 0,
        calculationsShared: 0,
        collaborations: 0,
        lastActivity: new Date()
      }
    } catch (err) {
      console.error('获取用户统计失败:', err)
      return null
    }
  }

  /**
   * 设置认证状态监听器
   */
  const setupAuthListener = () => {
    // 监听认证状态变化
    unsubscribeAuth = authService.onAuthStateChanged((authUser) => {
      user.value = authUser
      isInitialized.value = true
      
      if (authUser) {
        // 用户已登录，可以执行一些初始化操作
        console.log('用户已登录:', authUser.email)
      } else {
        // 用户已登出
        console.log('用户已登出')
      }
    })

    // 监听认证错误
    const handleAuthError = (error: string) => {
      error.value = error
    }

    authService.on('auth:error', handleAuthError)
    eventCleanupFunctions.push(() => authService.off('auth:error', handleAuthError))

    // 监听网络状态变化
    const handleNetworkChange = (isOnline: boolean) => {
      if (!isOnline) {
        error.value = '网络连接已断开'
      } else if (error.value === '网络连接已断开') {
        error.value = null
      }
    }

    window.addEventListener('online', () => handleNetworkChange(true))
    window.addEventListener('offline', () => handleNetworkChange(false))

    eventCleanupFunctions.push(
      () => window.removeEventListener('online', () => handleNetworkChange(true)),
      () => window.removeEventListener('offline', () => handleNetworkChange(false))
    )
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (unsubscribeAuth) {
      unsubscribeAuth()
      unsubscribeAuth = null
    }
    
    eventCleanupFunctions.forEach(cleanup => cleanup())
    eventCleanupFunctions.length = 0
  }

  // 生命周期管理
  onMounted(() => {
    setupAuthListener()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    user,
    isLoading,
    error,
    isInitialized,
    
    // 计算属性
    isAuthenticated,
    isEmailVerified,
    userDisplayName,
    userInitials,
    isPremiumUser,
    
    // 方法
    login,
    register,
    loginWithGoogle,
    loginWithApple,
    logout,
    sendPasswordResetEmail,
    updateProfile,
    resendVerificationEmail,
    clearError,
    hasPermission,
    getUserStats,
    
    // 清理方法
    cleanup
  }
}

// 全局认证状态（单例模式）
let globalAuthInstance: ReturnType<typeof useAuth> | null = null

export function useGlobalAuth() {
  if (!globalAuthInstance) {
    globalAuthInstance = useAuth()
  }
  return globalAuthInstance
}
