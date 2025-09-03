/**
 * 用户身份数据模型工具函数
 * 提供用户数据创建、验证和转换的实用工具
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type {
  User,
  AnonymousUser,
  RegisteredUser,
  BaseUser,
  ConsentSettings,
  DeviceInfo,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DataProcessingPurpose,
  ConsentStatus,
  ConsentRecord
} from '@/types/user-identity'

import {
  DEFAULT_USER_PREFERENCES,
  DEFAULT_CONSENT_SETTINGS,
  DEFAULT_SYNC_SETTINGS,
  DSGVO_CONSTANTS,
  VALIDATION_ERROR_CODES,
  ERROR_MESSAGES_DE
} from '@/types/user-identity'

// ============================================================================
// 用户创建工具函数
// ============================================================================

/**
 * 生成UUID v4
 * 简单的UUID v4生成器，避免外部依赖
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 生成设备指纹
 * 基于浏览器和设备信息生成匿名化指纹
 */
export function generateDeviceFingerprint(): string {
  // 检查是否在测试环境中
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // 测试环境：返回固定的测试指纹
    return 'test-device-fingerprint-' + Math.random().toString(36).substr(2, 9)
  }

  // 基础设备信息
  const deviceInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio
  }

  let canvasFingerprint = ''

  // Canvas指纹（仅在浏览器环境中）
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Zinses-Rechner Device Fingerprint', 2, 2)
      canvasFingerprint = canvas.toDataURL()
    }
  } catch {
    // Canvas不可用时使用备用方案
    canvasFingerprint = 'canvas-not-available'
  }

  // 组合所有信息并生成哈希
  const combinedInfo = JSON.stringify(deviceInfo) + canvasFingerprint

  // 简单哈希函数 (生产环境应使用更强的哈希算法)
  let hash = 0
  for (let i = 0; i < combinedInfo.length; i++) {
    const char = combinedInfo.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }

  return Math.abs(hash).toString(36)
}

/**
 * 检测设备信息
 */
export function detectDeviceInfo(): DeviceInfo {
  // 检查是否在测试环境中
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    // 测试环境：返回默认的设备信息
    return {
      type: 'desktop',
      os: 'other',
      browser: 'other',
      screenSize: 'medium',
      timezone: 'Europe/Berlin',
      locale: 'de-DE'
    }
  }

  const userAgent = navigator.userAgent.toLowerCase()

  // 检测设备类型
  let deviceType: DeviceInfo['type'] = 'desktop'
  if (/tablet|ipad/.test(userAgent)) {
    deviceType = 'tablet'
  } else if (/mobile|phone|android|iphone/.test(userAgent)) {
    deviceType = 'mobile'
  }

  // 检测操作系统
  let os: DeviceInfo['os'] = 'other'
  if (/windows/.test(userAgent)) os = 'windows'
  else if (/mac/.test(userAgent)) os = 'macos'
  else if (/linux/.test(userAgent)) os = 'linux'
  else if (/iphone|ipad/.test(userAgent)) os = 'ios'
  else if (/android/.test(userAgent)) os = 'android'

  // 检测浏览器
  let browser: DeviceInfo['browser'] = 'other'
  if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) browser = 'chrome'
  else if (/firefox/.test(userAgent)) browser = 'firefox'
  else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) browser = 'safari'
  else if (/edge/.test(userAgent)) browser = 'edge'

  // 检测屏幕尺寸类别
  let screenSize: DeviceInfo['screenSize'] = 'medium'
  if (typeof screen !== 'undefined') {
    const width = screen.width
    if (width < 768) screenSize = 'small'
    else if (width < 1024) screenSize = 'medium'
    else if (width < 1440) screenSize = 'large'
    else screenSize = 'xlarge'
  }

  return {
    type: deviceType,
    os,
    browser,
    screenSize,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language
  }
}

/**
 * 创建匿名用户
 */
export function createAnonymousUser(
  overrides: Partial<Omit<AnonymousUser, 'id' | 'type' | 'createdAt' | 'lastActiveAt' | 'dataVersion'>> = {}
): AnonymousUser {
  const now = new Date()

  return {
    id: generateUUID(),
    type: 'anonymous',
    createdAt: now,
    lastActiveAt: now,
    dataVersion: DSGVO_CONSTANTS.CURRENT_DATA_VERSION,
    deviceFingerprint: generateDeviceFingerprint(),
    deviceInfo: detectDeviceInfo(),
    preferences: { ...DEFAULT_USER_PREFERENCES, ...overrides.preferences },
    consentSettings: { ...DEFAULT_CONSENT_SETTINGS, ...overrides.consentSettings },
    ...overrides
  }
}

/**
 * 升级匿名用户为注册用户
 */
export function upgradeToRegisteredUser(
  anonymousUser: AnonymousUser,
  email: string,
  overrides: Partial<Omit<RegisteredUser, keyof AnonymousUser | 'registrationDate'>> = {}
): RegisteredUser {
  // 验证邮箱格式
  if (!email || email.trim() === '') {
    throw new Error('Email is required')
  }

  if (!validateEmail(email)) {
    throw new Error('Invalid email format')
  }

  const now = new Date()

  // 更新同意设置以包含跨设备同步
  const updatedConsentSettings: ConsentSettings = {
    ...anonymousUser.consentSettings,
    crossDeviceSync: {
      status: 'denied',
      timestamp: now,
      source: 'initial_setup',
      legalBasis: 'consent',
      purposes: ['cross_device_sync'],
      retentionPeriod: DSGVO_CONSTANTS.DEFAULT_RETENTION_DAYS
    }
  }

  return {
    ...anonymousUser,
    type: 'registered',
    email: email.toLowerCase().trim(),
    emailVerified: false,
    registrationDate: now,
    syncEnabled: false,
    syncSettings: { ...DEFAULT_SYNC_SETTINGS },
    consentSettings: updatedConsentSettings,
    lastActiveAt: now,
    ...overrides
  }
}

// ============================================================================
// 验证工具函数
// ============================================================================

/**
 * 验证UUID v4格式
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  // RFC 5322 简化版正则表达式
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email) && email.length <= DSGVO_CONSTANTS.MAX_EMAIL_LENGTH
}

/**
 * 验证数据保留期限
 */
export function validateRetentionPeriod(days: number): boolean {
  return days >= DSGVO_CONSTANTS.MIN_RETENTION_DAYS &&
         days <= DSGVO_CONSTANTS.MAX_RETENTION_DAYS
}

/**
 * 验证设备指纹
 */
export function validateDeviceFingerprint(fingerprint: string): boolean {
  return typeof fingerprint === 'string' &&
         fingerprint.length > 0 &&
         fingerprint.length <= DSGVO_CONSTANTS.MAX_DEVICE_FINGERPRINT_LENGTH
}

/**
 * 创建验证错误
 */
export function createValidationError(
  field: string,
  code: keyof typeof VALIDATION_ERROR_CODES,
  details?: Record<string, unknown>
): ValidationError {
  return {
    field,
    code: VALIDATION_ERROR_CODES[code],
    message: ERROR_MESSAGES_DE[VALIDATION_ERROR_CODES[code]] || `Validation error: ${code}`,
    details
  }
}

/**
 * 创建验证警告
 */
export function createValidationWarning(
  field: string,
  code: string,
  message: string,
  suggestion?: string
): ValidationWarning {
  return {
    field,
    code,
    message,
    suggestion
  }
}

/**
 * 验证基础用户数据
 */
export function validateBaseUser(user: BaseUser): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 验证用户ID
  if (!user.id) {
    errors.push(createValidationError('id', 'USER_ID_REQUIRED'))
  } else if (!validateUUID(user.id)) {
    errors.push(createValidationError('id', 'USER_ID_FORMAT_INVALID'))
  }

  // 验证创建时间
  if (!user.createdAt || !(user.createdAt instanceof Date)) {
    errors.push(createValidationError('createdAt', 'INVALID_USER_ID', {
      message: 'Ungültiges Erstellungsdatum'
    }))
  }

  // 验证最后活跃时间
  if (!user.lastActiveAt || !(user.lastActiveAt instanceof Date)) {
    errors.push(createValidationError('lastActiveAt', 'INVALID_USER_ID', {
      message: 'Ungültige letzte Aktivitätszeit'
    }))
  }

  // 验证数据版本
  if (!DSGVO_CONSTANTS.SUPPORTED_VERSIONS.includes(user.dataVersion)) {
    errors.push(createValidationError('dataVersion', 'UNSUPPORTED_VERSION'))
  }

  // 验证数据保留期限
  if (!validateRetentionPeriod(user.preferences.dataRetentionDays)) {
    errors.push(createValidationError('preferences.dataRetentionDays', 'INVALID_RETENTION_PERIOD'))
  }

  // 检查数据是否过期
  const daysSinceCreation = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation > user.preferences.dataRetentionDays) {
    warnings.push(createValidationWarning(
      'dataRetention',
      'DATA_RETENTION_EXCEEDED',
      'Daten haben die Aufbewahrungsfrist überschritten',
      'Daten sollten gelöscht oder Aufbewahrungsfrist verlängert werden'
    ))
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证匿名用户数据
 */
export function validateAnonymousUser(user: AnonymousUser): ValidationResult {
  const baseValidation = validateBaseUser(user)
  const errors = [...baseValidation.errors]
  const warnings = [...baseValidation.warnings]

  // 验证用户类型
  if (user.type !== 'anonymous') {
    errors.push(createValidationError('type', 'INVALID_USER_ID', {
      message: 'Ungültiger Benutzertyp für anonymen Benutzer'
    }))
  }

  // 验证设备指纹
  if (!validateDeviceFingerprint(user.deviceFingerprint)) {
    errors.push(createValidationError('deviceFingerprint', 'INVALID_DEVICE_FINGERPRINT'))
  }

  // 验证设备信息
  if (!user.deviceInfo || typeof user.deviceInfo !== 'object') {
    errors.push(createValidationError('deviceInfo', 'INVALID_USER_ID', {
      message: 'Ungültige Geräteinformationen'
    }))
  }

  // 验证匿名用户特有字段
  if (!user.deviceFingerprint) {
    errors.push(createValidationError('deviceFingerprint', 'INVALID_DEVICE_FINGERPRINT'))
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证注册用户数据
 */
export function validateRegisteredUser(user: RegisteredUser): ValidationResult {
  // 验证基础用户数据，而不是匿名用户数据
  const baseValidation = validateBaseUser(user)
  const errors = [...baseValidation.errors]
  const warnings = [...baseValidation.warnings]

  // 验证用户类型
  if (user.type !== 'registered') {
    errors.push(createValidationError('type', 'INVALID_USER_ID', {
      message: 'Ungültiger Benutzertyp für registrierten Benutzer'
    }))
  }

  // 验证邮箱
  if (user.email && !validateEmail(user.email)) {
    errors.push(createValidationError('email', 'INVALID_EMAIL'))
  }

  // 验证注册时间
  if (!user.registrationDate || !(user.registrationDate instanceof Date)) {
    errors.push(createValidationError('registrationDate', 'INVALID_USER_ID', {
      message: 'Ungültiges Registrierungsdatum'
    }))
  }

  // 验证同步设置
  if (user.syncEnabled && !user.syncSettings) {
    errors.push(createValidationError('syncSettings', 'INVALID_USER_ID', {
      message: 'Synchronisationseinstellungen fehlen'
    }))
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// 数据转换工具函数
// ============================================================================

/**
 * 序列化用户数据为JSON
 */
export function serializeUser(user: User): string {
  return JSON.stringify(user, (key, value) => {
    // 将Date对象转换为ISO字符串
    if (value instanceof Date) {
      return value.toISOString()
    }
    return value
  })
}

/**
 * 从JSON反序列化用户数据
 */
export function deserializeUser(json: string): User {
  const data = JSON.parse(json)

  // 将ISO字符串转换回Date对象
  const dateFields = ['createdAt', 'lastActiveAt', 'registrationDate', 'consentDate', 'lastUpdated']

  function convertDates(obj: Record<string, unknown>): Record<string, unknown> {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (dateFields.includes(key) && typeof obj[key] === 'string') {
          obj[key] = new Date(obj[key])
        } else if (typeof obj[key] === 'object') {
          convertDates(obj[key])
        }
      }
    }
    return obj
  }

  return convertDates(data)
}

/**
 * 深度克隆用户对象
 */
export function cloneUser<T extends User>(user: T): T {
  return deserializeUser(serializeUser(user)) as T
}

/**
 * 更新用户最后活跃时间
 */
export function updateLastActiveTime<T extends User>(user: T): T {
  const cloned = cloneUser(user)
  cloned.lastActiveAt = new Date()
  return cloned
}

// ============================================================================
// 同意管理工具函数
// ============================================================================

/**
 * 检查特定目的的同意状态
 */
export function hasConsentForPurpose(
  user: User,
  purpose: DataProcessingPurpose
): boolean {
  const { consentSettings } = user

  switch (purpose) {
    case 'calculation_history':
    case 'user_preferences':
      return consentSettings.functional.status === 'granted'

    case 'analytics':
      return consentSettings.analytics.status === 'granted'

    case 'cross_device_sync':
      return consentSettings.crossDeviceSync?.status === 'granted' || false

    case 'performance_monitoring':
      return user.preferences.privacy.performanceMonitoring

    default:
      return false
  }
}

/**
 * 更新同意状态
 */
export function updateConsent<T extends User>(
  user: T,
  consentType: keyof ConsentSettings,
  granted: boolean,
  source: ConsentRecord['source'] = 'settings_change'
): T {
  // 验证同意类型
  const validConsentTypes = ['functional', 'analytics', 'marketing', 'crossDeviceSync']
  if (!validConsentTypes.includes(consentType as string)) {
    throw new Error('Invalid consent purpose')
  }

  const cloned = cloneUser(user)
  const now = new Date()
  const status: ConsentStatus = granted ? 'granted' : 'denied'

  if (consentType in cloned.consentSettings && consentType !== 'version' && consentType !== 'consentDate' && consentType !== 'lastUpdated') {
    const consentRecord = cloned.consentSettings[consentType as keyof Omit<ConsentSettings, 'version' | 'consentDate' | 'lastUpdated'>]
    if (consentRecord && typeof consentRecord === 'object') {
      (consentRecord as any).status = status
      ;(consentRecord as any).timestamp = now
      ;(consentRecord as any).source = source
    }
  }

  cloned.consentSettings.lastUpdated = now
  cloned.lastActiveAt = now

  return cloned
}

/**
 * 检查数据是否需要清理
 */
export function needsDataCleanup(user: User): boolean {
  // 验证输入参数
  if (!user || !user.lastActiveAt || !user.preferences || typeof user.preferences.dataRetentionDays !== 'number') {
    return false
  }

  // 验证保留期限是否有效
  if (user.preferences.dataRetentionDays <= 0) {
    return false
  }

  const daysSinceLastActive = (Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceLastActive > user.preferences.dataRetentionDays
}

/**
 * 获取数据过期时间
 */
export function getDataExpirationDate(user: User): Date {
  const expirationTime = user.createdAt.getTime() + (user.preferences.dataRetentionDays * 24 * 60 * 60 * 1000)
  return new Date(expirationTime)
}

// ============================================================================
// 数据安全工具函数
// ============================================================================

/**
 * 匿名化用户数据
 * 移除所有个人标识信息，保留统计分析所需的匿名数据
 */
export function anonymizeUserData(user: User): Record<string, unknown> {
  return {
    // 保留非个人标识的统计数据
    type: user.type,
    createdAt: user.createdAt,
    dataVersion: user.dataVersion,

    // 匿名化设备信息
    deviceInfo: {
      type: user.deviceInfo.type,
      os: user.deviceInfo.os,
      browser: user.deviceInfo.browser,
      screenSize: user.deviceInfo.screenSize,
      timezone: 'anonymized',
      locale: 'anonymized'
    },

    // 保留偏好设置（无个人信息）
    theme: user.preferences.theme,
    dataRetentionDays: user.preferences.dataRetentionDays,
    autoSave: user.preferences.autoSave,

    // 保留同意状态（用于合规分析）
    consentStatus: {
      functional: user.consentSettings.functional.status,
      analytics: user.consentSettings.analytics.status,
      marketing: user.consentSettings.marketing.status
    }
  }
}

/**
 * 检查用户数据完整性
 */
export function validateUserDataIntegrity(user: User): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 检查基本结构
  if (!user || typeof user !== 'object') {
    errors.push(createValidationError('user', 'INVALID_USER_ID', {
      message: 'Ungültiges Benutzerobjekt'
    }))
    return { isValid: false, errors, warnings }
  }

  // 基础验证
  try {
    const baseValidation = user.type === 'anonymous'
      ? validateAnonymousUser(user as AnonymousUser)
      : validateRegisteredUser(user as RegisteredUser)

    errors.push(...baseValidation.errors)
    warnings.push(...baseValidation.warnings)
  } catch (error) {
    errors.push(createValidationError('user', 'VALIDATION_ERROR', {
      message: error instanceof Error ? error.message : 'Unbekannter Validierungsfehler'
    }))
  }

  // 检查数据一致性
  if (user.lastActiveAt && user.createdAt && user.lastActiveAt < user.createdAt) {
    errors.push(createValidationError('lastActiveAt', 'INVALID_USER_ID', {
      message: 'Letzte Aktivitätszeit kann nicht vor Erstellungszeit liegen'
    }))
  }

  // 检查同意设置一致性
  if (user.consentSettings && user.consentSettings.consentDate && user.consentSettings.consentDate > new Date()) {
    errors.push(createValidationError('consentSettings.consentDate', 'INVALID_USER_ID', {
      message: 'Einverständnisdatum kann nicht in der Zukunft liegen'
    }))
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// 类型守卫函数
// ============================================================================

/**
 * 检查是否为有效的用户对象
 */
export function isValidUser(obj: unknown): obj is User {
  if (!obj || typeof obj !== 'object') return false

  const user = obj as any
  return (
    typeof user.id === 'string' &&
    validateUUID(user.id) &&
    (user.type === 'anonymous' || user.type === 'registered') &&
    user.createdAt instanceof Date &&
    user.lastActiveAt instanceof Date &&
    typeof user.dataVersion === 'string' &&
    typeof user.preferences === 'object' &&
    typeof user.consentSettings === 'object'
  )
}

/**
 * 检查是否为匿名用户
 */
export function isAnonymousUser(user: User): user is AnonymousUser {
  return user.type === 'anonymous'
}

/**
 * 检查是否为注册用户
 */
export function isRegisteredUser(user: User): user is RegisteredUser {
  return user.type === 'registered'
}
