/**
 * Firebase配置和初始化
 * 用于用户认证和数据存储
 */

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAnalytics, type Analytics } from 'firebase/analytics'

// Firebase配置 - 从环境变量获取
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Firebase应用实例
let app: FirebaseApp
let auth: Auth
let db: Firestore
let analytics: Analytics | null = null

/**
 * 初始化Firebase
 */
export function initializeFirebase(): void {
  try {
    // 检查配置是否完整
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('Firebase配置不完整，将使用本地存储模式')
      return
    }

    // 初始化Firebase应用
    app = initializeApp(firebaseConfig)
    
    // 初始化认证
    auth = getAuth(app)
    
    // 初始化Firestore
    db = getFirestore(app)
    
    // 初始化Analytics (仅在生产环境)
    if (import.meta.env.PROD && firebaseConfig.measurementId) {
      analytics = getAnalytics(app)
    }
    
    console.log('✅ Firebase初始化成功')
  } catch (error) {
    console.error('❌ Firebase初始化失败:', error)
    throw error
  }
}

/**
 * 获取Firebase Auth实例
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth未初始化，请先调用initializeFirebase()')
  }
  return auth
}

/**
 * 获取Firestore实例
 */
export function getFirebaseFirestore(): Firestore {
  if (!db) {
    throw new Error('Firestore未初始化，请先调用initializeFirebase()')
  }
  return db
}

/**
 * 获取Firebase Analytics实例
 */
export function getFirebaseAnalytics(): Analytics | null {
  return analytics
}

/**
 * 检查Firebase是否已初始化
 */
export function isFirebaseInitialized(): boolean {
  return !!app && !!auth && !!db
}

/**
 * Firebase错误处理
 */
export function handleFirebaseError(error: any): string {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'Benutzer nicht gefunden',
    'auth/wrong-password': 'Falsches Passwort',
    'auth/email-already-in-use': 'E-Mail-Adresse wird bereits verwendet',
    'auth/weak-password': 'Passwort ist zu schwach',
    'auth/invalid-email': 'Ungültige E-Mail-Adresse',
    'auth/user-disabled': 'Benutzerkonto wurde deaktiviert',
    'auth/too-many-requests': 'Zu viele Anfragen. Bitte versuchen Sie es später erneut',
    'auth/network-request-failed': 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung',
    'auth/popup-closed-by-user': 'Anmeldung wurde vom Benutzer abgebrochen',
    'auth/cancelled-popup-request': 'Anmeldung wurde abgebrochen',
    'auth/popup-blocked': 'Popup wurde blockiert. Bitte erlauben Sie Popups für diese Website'
  }

  const errorCode = error?.code || 'unknown'
  return errorMessages[errorCode] || `Unbekannter Fehler: ${error?.message || errorCode}`
}

/**
 * 开发环境配置检查
 */
if (import.meta.env.DEV) {
  console.log('🔧 Firebase配置检查:')
  console.log('- API Key:', firebaseConfig.apiKey ? '✅ 已配置' : '❌ 缺失')
  console.log('- Project ID:', firebaseConfig.projectId ? '✅ 已配置' : '❌ 缺失')
  console.log('- Auth Domain:', firebaseConfig.authDomain ? '✅ 已配置' : '❌ 缺失')
}
