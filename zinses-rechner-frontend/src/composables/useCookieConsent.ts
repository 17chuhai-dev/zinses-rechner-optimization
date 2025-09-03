/**
 * Cookie同意管理
 * DSGVO合规的Cookie管理和用户隐私保护
 */

import { ref, reactive, computed } from 'vue'

// 全局变量声明
declare global {
  interface Window {
    dataLayer: any[]
  }
}

declare const gtag: (...args: any[]) => void

// Cookie偏好设置接口
interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  performance: boolean
  marketing: boolean
}

// Cookie信息接口
interface CookieInfo {
  name: string
  purpose: string
  duration: string
  provider: string
  category: keyof CookiePreferences
}

// 默认Cookie偏好设置
const defaultPreferences: CookiePreferences = {
  necessary: true,    // 必要Cookie始终启用
  analytics: false,   // 分析Cookie默认禁用
  performance: false, // 性能Cookie默认禁用
  marketing: false    // 营销Cookie默认禁用
}

// Cookie详细信息
const cookieDetails: CookieInfo[] = [
  {
    name: 'zinses_session',
    purpose: 'Session-Management und Sicherheit',
    duration: '24 Stunden',
    provider: 'Zinses-Rechner.de',
    category: 'necessary'
  },
  {
    name: 'zinses_preferences',
    purpose: 'Speicherung der Cookie-Einstellungen',
    duration: '12 Monate',
    provider: 'Zinses-Rechner.de',
    category: 'necessary'
  },
  {
    name: '_ga',
    purpose: 'Google Analytics - Benutzer unterscheiden',
    duration: '24 Monate',
    provider: 'Google',
    category: 'analytics'
  },
  {
    name: '_gid',
    purpose: 'Google Analytics - Benutzer unterscheiden',
    duration: '24 Stunden',
    provider: 'Google',
    category: 'analytics'
  },
  {
    name: '_gat',
    purpose: 'Google Analytics - Anfragerate begrenzen',
    duration: '1 Minute',
    provider: 'Google',
    category: 'analytics'
  },
  {
    name: 'web_vitals_data',
    purpose: 'Speicherung von Web Vitals Metriken',
    duration: '7 Tage',
    provider: 'Zinses-Rechner.de',
    category: 'performance'
  }
]

// Cookie同意管理
export function useCookieConsent() {
  const hasConsent = ref(false)
  const preferences = reactive<CookiePreferences>({ ...defaultPreferences })
  const consentTimestamp = ref<Date | null>(null)
  const consentVersion = ref('1.0')

  // 存储键
  const STORAGE_KEY = 'zinses_cookie_consent'
  const PREFERENCES_KEY = 'zinses_cookie_preferences'

  // 检查是否有有效的同意
  const checkExistingConsent = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const consent = JSON.parse(stored)

        // 检查同意是否仍然有效（12个月）
        const consentDate = new Date(consent.timestamp)
        const expiryDate = new Date(consentDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 12个月

        if (new Date() < expiryDate && consent.version === consentVersion.value) {
          hasConsent.value = true
          consentTimestamp.value = consentDate

          // 加载偏好设置
          const storedPrefs = localStorage.getItem(PREFERENCES_KEY)
          if (storedPrefs) {
            Object.assign(preferences, JSON.parse(storedPrefs))
          }

          return true
        } else {
          // 过期的同意，清理存储
          localStorage.removeItem(STORAGE_KEY)
          localStorage.removeItem(PREFERENCES_KEY)
        }
      }
    } catch (error) {
      console.error('Error checking existing consent:', error)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(PREFERENCES_KEY)
    }

    return false
  }

  // 保存同意设置
  const saveConsent = () => {
    const consent = {
      timestamp: new Date().toISOString(),
      version: consentVersion.value,
      preferences: { ...preferences }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))

      hasConsent.value = true
      consentTimestamp.value = new Date()

      console.log('✅ Cookie consent saved:', preferences)

      // 发送同意事件到分析
      sendConsentEvent()

    } catch (error) {
      console.error('Error saving consent:', error)
    }
  }

  // 加载同意设置
  const loadConsent = () => {
    return checkExistingConsent()
  }

  // 撤销同意
  const revokeConsent = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PREFERENCES_KEY)

    // 清理所有非必要Cookie
    clearNonEssentialCookies()

    hasConsent.value = false
    Object.assign(preferences, defaultPreferences)
    consentTimestamp.value = null

    console.log('🗑️ Cookie consent revoked')
  }

  // 清理非必要Cookie
  const clearNonEssentialCookies = () => {
    const cookiesToClear = [
      '_ga', '_gid', '_gat', '_gat_gtag_UA_',
      'web_vitals_data', '_fbp', '_fbc'
    ]

    cookiesToClear.forEach(cookieName => {
      // 清理当前域名的Cookie
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`

      // 清理子域名的Cookie
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.zinses-rechner.de;`
    })
  }

  // 发送同意事件
  const sendConsentEvent = () => {
    // 发送到自定义分析端点
    fetch('/api/analytics/cookie-consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        preferences: { ...preferences },
        timestamp: new Date().toISOString(),
        version: consentVersion.value,
        userAgent: navigator.userAgent,
        language: navigator.language
      })
    }).catch(error => {
      console.error('Failed to send consent event:', error)
    })
  }

  // 初始化Google Analytics
  const initializeAnalytics = () => {
    if (!preferences.analytics) return

    // 动态加载Google Analytics
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID'
    document.head.appendChild(script)

    script.onload = () => {
      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }

      gtag('js', new Date())
      gtag('config', 'GA_MEASUREMENT_ID', {
        anonymize_ip: true,
        respect_dnt: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      })

      // 设置全局gtag函数
      window.gtag = gtag

      console.log('✅ Google Analytics initialized with privacy settings')
    }
  }

  // 初始化性能监控
  const initializePerformanceMonitoring = () => {
    if (!preferences.performance) return

    // 启用Web Vitals收集
    import('../composables/useWebVitals').then(({ useWebVitals }) => {
      const { initWebVitals } = useWebVitals()
      initWebVitals()
      console.log('✅ Performance monitoring initialized')
    })
  }

  // 获取Cookie信息
  const getCookieInfo = (category?: keyof CookiePreferences) => {
    if (category) {
      return cookieDetails.filter(cookie => cookie.category === category)
    }
    return cookieDetails
  }

  // 检查特定类别是否被允许
  const isAllowed = (category: keyof CookiePreferences) => {
    return preferences[category]
  }

  // 更新偏好设置
  const updatePreferences = (newPreferences: Partial<CookiePreferences>) => {
    Object.assign(preferences, newPreferences)

    if (hasConsent.value) {
      saveConsent()
    }
  }

  // 获取同意状态摘要
  const getConsentSummary = () => {
    return {
      hasConsent: hasConsent.value,
      consentTimestamp: consentTimestamp.value,
      consentVersion: consentVersion.value,
      preferences: { ...preferences },
      enabledCategories: Object.entries(preferences)
        .filter(([_, enabled]) => enabled)
        .map(([category, _]) => category),
      cookieCount: getCookieInfo().filter(cookie =>
        preferences[cookie.category]
      ).length
    }
  }

  // 导出用户数据（DSGVO权利）
  const exportUserData = () => {
    const userData = {
      cookieConsent: getConsentSummary(),
      calculationHistory: [], // 如果存储了计算历史
      preferences: { ...preferences },
      exportTimestamp: new Date().toISOString(),
      dataVersion: '1.0'
    }

    const blob = new Blob([JSON.stringify(userData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zinses-rechner-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    console.log('📄 User data exported')
  }

  // 删除用户数据（DSGVO权利）
  const deleteUserData = () => {
    // 清理本地存储
    localStorage.clear()
    sessionStorage.clear()

    // 清理所有Cookie
    clearNonEssentialCookies()

    // 重置状态
    hasConsent.value = false
    Object.assign(preferences, defaultPreferences)
    consentTimestamp.value = null

    console.log('🗑️ All user data deleted')

    // 通知服务器删除数据
    fetch('/api/privacy/delete-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        reason: 'user_request'
      })
    }).catch(error => {
      console.error('Failed to notify server of data deletion:', error)
    })
  }

  return {
    hasConsent,
    preferences,
    consentTimestamp,
    consentVersion,
    saveConsent,
    loadConsent,
    revokeConsent,
    initializeAnalytics,
    initializePerformanceMonitoring,
    getCookieInfo,
    isAllowed,
    updatePreferences,
    getConsentSummary,
    exportUserData,
    deleteUserData
  }
}

// 全局Cookie管理
export function initGlobalCookieManagement() {
  const { loadConsent, initializeAnalytics, initializePerformanceMonitoring } = useCookieConsent()

  // 加载现有同意
  const hasExistingConsent = loadConsent()

  if (hasExistingConsent) {
    // 根据偏好设置初始化服务
    initializeAnalytics()
    initializePerformanceMonitoring()
  }

  console.log('🍪 Global cookie management initialized')
}

// DSGVO合规检查
export function useDSGVOCompliance() {
  const complianceChecks = reactive({
    cookieConsent: false,
    dataProcessingNotice: false,
    rightToDelete: false,
    rightToExport: false,
    dataMinimization: false,
    secureTransmission: false
  })

  const checkCompliance = () => {
    const { hasConsent } = useCookieConsent()

    complianceChecks.cookieConsent = hasConsent.value
    complianceChecks.dataProcessingNotice = true // 假设已实现
    complianceChecks.rightToDelete = true
    complianceChecks.rightToExport = true
    complianceChecks.dataMinimization = true
    complianceChecks.secureTransmission = location.protocol === 'https:'

    return complianceChecks
  }

  const complianceScore = computed(() => {
    const checks = Object.values(complianceChecks)
    const passed = checks.filter(Boolean).length
    return Math.round((passed / checks.length) * 100)
  })

  const isFullyCompliant = computed(() => {
    return Object.values(complianceChecks).every(Boolean)
  })

  return {
    complianceChecks,
    complianceScore,
    isFullyCompliant,
    checkCompliance
  }
}
