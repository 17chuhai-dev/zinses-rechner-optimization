/**
 * 用户认证服务
 * 支持邮箱/密码登录和Google/Apple社交登录
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  type User,
  type UserCredential,
  onAuthStateChanged,
  type Unsubscribe
} from 'firebase/auth'

import { getFirebaseAuth, handleFirebaseError, isFirebaseInitialized } from '@/config/firebase'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  createdAt: Date
  lastLoginAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  displayName: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

/**
 * 认证服务类
 */
export class AuthService {
  private auth = getFirebaseAuth()
  private googleProvider = new GoogleAuthProvider()
  private appleProvider = new OAuthProvider('apple.com')

  constructor() {
    // 配置Google登录
    this.googleProvider.addScope('email')
    this.googleProvider.addScope('profile')
    this.googleProvider.setCustomParameters({
      prompt: 'select_account'
    })

    // 配置Apple登录
    this.appleProvider.addScope('email')
    this.appleProvider.addScope('name')
  }

  /**
   * 邮箱密码登录
   */
  async signInWithEmail(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      if (!isFirebaseInitialized()) {
        return { success: false, error: 'Firebase未初始化' }
      }

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      )

      const user = this.mapFirebaseUser(userCredential.user)
      return { success: true, user }
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 邮箱密码注册
   */
  async registerWithEmail(data: RegisterData): Promise<AuthResult> {
    try {
      if (!isFirebaseInitialized()) {
        return { success: false, error: 'Firebase未初始化' }
      }

      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      )

      // 更新用户显示名称
      await updateProfile(userCredential.user, {
        displayName: data.displayName
      })

      const user = this.mapFirebaseUser(userCredential.user)
      return { success: true, user }
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Google登录
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      if (!isFirebaseInitialized()) {
        return { success: false, error: 'Firebase未初始化' }
      }

      const userCredential = await signInWithPopup(this.auth, this.googleProvider)
      const user = this.mapFirebaseUser(userCredential.user)
      return { success: true, user }
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Apple登录
   */
  async signInWithApple(): Promise<AuthResult> {
    try {
      if (!isFirebaseInitialized()) {
        return { success: false, error: 'Firebase未初始化' }
      }

      const userCredential = await signInWithPopup(this.auth, this.appleProvider)
      const user = this.mapFirebaseUser(userCredential.user)
      return { success: true, user }
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 退出登录
   */
  async signOut(): Promise<AuthResult> {
    try {
      if (!isFirebaseInitialized()) {
        return { success: false, error: 'Firebase未初始化' }
      }

      await signOut(this.auth)
      return { success: true }
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      if (!isFirebaseInitialized()) {
        return { success: false, error: 'Firebase未初始化' }
      }

      await sendPasswordResetEmail(this.auth, email)
      return { success: true }
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): AuthUser | null {
    if (!isFirebaseInitialized() || !this.auth.currentUser) {
      return null
    }

    return this.mapFirebaseUser(this.auth.currentUser)
  }

  /**
   * 监听认证状态变化
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): Unsubscribe {
    if (!isFirebaseInitialized()) {
      callback(null)
      return () => {}
    }

    return onAuthStateChanged(this.auth, (firebaseUser) => {
      const user = firebaseUser ? this.mapFirebaseUser(firebaseUser) : null
      callback(user)
    })
  }

  /**
   * 检查用户是否已登录
   */
  isAuthenticated(): boolean {
    return !!this.auth.currentUser
  }

  /**
   * 将Firebase用户对象映射为应用用户对象
   */
  private mapFirebaseUser(firebaseUser: User): AuthUser {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now())
    }
  }
}

// 导出单例实例
export const authService = new AuthService()

/**
 * 本地存储fallback (当Firebase不可用时)
 */
export class LocalAuthService {
  private readonly STORAGE_KEY = 'zinses_rechner_user'

  /**
   * 本地登录 (仅用于开发和离线模式)
   */
  async signInLocal(email: string): Promise<AuthResult> {
    const user: AuthUser = {
      uid: `local_${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      photoURL: null,
      emailVerified: false,
      createdAt: new Date(),
      lastLoginAt: new Date()
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
    return { success: true, user }
  }

  /**
   * 获取本地用户
   */
  getLocalUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEY)
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }

  /**
   * 本地退出
   */
  signOutLocal(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}

export const localAuthService = new LocalAuthService()
