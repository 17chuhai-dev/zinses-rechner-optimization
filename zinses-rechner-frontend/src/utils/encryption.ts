/**
 * DSGVO合规的数据加密和隐私保护工具
 * 实现客户端数据加密、匿名化和隐私保护功能
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type { EncryptionConfig, User, DataProcessingRecord } from '@/types/user'

// 加密配置
const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'AES-256-GCM',
  keyDerivation: 'PBKDF2',
  iterations: 100000,
  saltLength: 32
}

/**
 * 生成安全的随机盐值
 */
export function generateSalt(length: number = 32): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

/**
 * 使用PBKDF2派生加密密钥
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * 加密数据
 */
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // GCM推荐12字节IV

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(data)
  )

  return { encrypted, iv }
}

/**
 * 解密数据
 */
export async function decryptData(
  encrypted: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encrypted
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * 生成匿名用户ID
 */
export function generateAnonymousId(): string {
  return crypto.randomUUID()
}

/**
 * 哈希敏感数据（单向）
 */
export async function hashSensitiveData(data: string, salt?: Uint8Array): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  if (salt) {
    const combined = new Uint8Array(dataBuffer.length + salt.length)
    combined.set(dataBuffer)
    combined.set(salt, dataBuffer.length)
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined)
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 匿名化用户数据
 */
export function anonymizeUserData(user: User): Partial<User> {
  const anonymized: any = {
    id: 'anonymous',
    type: 'anonymous',
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    preferences: {
      ...user.preferences,
      // 移除可能识别用户的偏好设置
      calculatorDefaults: {}
    },
    consent: user.consent
  }

  // 移除所有个人身份信息
  delete anonymized.email
  delete anonymized.displayName
  delete anonymized.profile
  delete anonymized.companyName
  delete anonymized.vatNumber
  delete anonymized.billingAddress

  return anonymized
}

/**
 * 数据最小化处理
 */
export function minimizeUserData(user: User, purpose: string): Partial<User> {
  const minimized: any = {
    id: user.id,
    type: user.type,
    preferences: user.preferences,
    consent: user.consent
  }

  switch (purpose) {
    case 'analytics':
      // 仅保留分析必需的数据
      minimized.createdAt = user.createdAt
      minimized.lastActiveAt = user.lastActiveAt
      break

    case 'calculation':
      // 仅保留计算必需的数据
      minimized.preferences = {
        currency: user.preferences.currency,
        numberFormat: user.preferences.numberFormat,
        calculatorDefaults: user.preferences.calculatorDefaults
      }
      break

    case 'notification':
      // 仅保留通知必需的数据
      if ('email' in user) {
        minimized.email = user.email
      }
      minimized.preferences = {
        language: user.preferences.language,
        notifications: user.preferences.notifications
      }
      break
  }

  return minimized
}

/**
 * 检查数据保留期限
 */
export function checkDataRetention(
  createdAt: Date,
  retentionDays: number
): { expired: boolean; daysRemaining: number } {
  const now = new Date()
  const expiryDate = new Date(createdAt.getTime() + retentionDays * 24 * 60 * 60 * 1000)
  const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  return {
    expired: daysRemaining <= 0,
    daysRemaining: Math.max(0, daysRemaining)
  }
}

/**
 * 记录数据处理活动
 */
export function logDataProcessing(
  userId: string,
  action: DataProcessingRecord['action'],
  dataType: string,
  purpose: string,
  legalBasis: DataProcessingRecord['legalBasis'],
  retentionDays: number = 365
): DataProcessingRecord {
  return {
    userId,
    action,
    dataType,
    timestamp: new Date(),
    purpose,
    legalBasis,
    retention: retentionDays
  }
}

/**
 * 验证用户同意状态
 */
export function validateConsent(
  consent: any,
  requiredConsents: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const required of requiredConsents) {
    if (!consent[required]) {
      missing.push(required)
    }
  }

  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * 生成数据导出包
 */
export function generateDataExport(user: User): {
  userData: any
  metadata: any
} {
  const userData = {
    ...user,
    // 移除内部系统字段
    _internal: undefined
  }

  const metadata = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    format: 'JSON',
    dataTypes: Object.keys(userData),
    privacyNotice: 'Diese Daten wurden gemäß DSGVO Art. 20 exportiert.'
  }

  return { userData, metadata }
}

/**
 * 安全删除用户数据
 */
export function secureDeleteUserData(userId: string): {
  deletedAt: Date
  confirmation: string
} {
  // 在实际实现中，这里会执行实际的数据删除操作
  // 包括数据库记录、文件系统、缓存等

  const deletedAt = new Date()
  const confirmation = `USER_${userId}_DELETED_${deletedAt.getTime()}`

  return {
    deletedAt,
    confirmation
  }
}

/**
 * 数据伪匿名化（可逆匿名化）
 */
export async function pseudonymizeData(
  data: string,
  key: CryptoKey
): Promise<string> {
  const { encrypted, iv } = await encryptData(data, key)

  // 将加密数据和IV组合成Base64字符串
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * 数据去伪匿名化
 */
export async function depseudonymizeData(
  pseudonymizedData: string,
  key: CryptoKey
): Promise<string> {
  const combined = new Uint8Array(
    atob(pseudonymizedData).split('').map(c => c.charCodeAt(0))
  )

  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12).buffer

  return decryptData(encrypted, key, iv)
}

/**
 * 检查IP地址是否需要匿名化
 */
export function shouldAnonymizeIP(privacyLevel: string): boolean {
  return privacyLevel === 'enhanced' || privacyLevel === 'minimal'
}

/**
 * 匿名化IP地址
 */
export function anonymizeIP(ip: string): string {
  if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':')
    return parts.slice(0, 4).join(':') + '::0'
  } else {
    // IPv4
    const parts = ip.split('.')
    return parts.slice(0, 3).join('.') + '.0'
  }
}

/**
 * 生成DSGVO合规的Cookie同意配置
 */
export function generateCookieConsent() {
  return {
    necessary: {
      name: 'Technisch notwendige Cookies',
      description: 'Diese Cookies sind für die Grundfunktionen der Website erforderlich.',
      required: true,
      cookies: ['session', 'csrf', 'preferences']
    },
    functional: {
      name: 'Funktionale Cookies',
      description: 'Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung.',
      required: false,
      cookies: ['calculator-history', 'user-settings', 'theme']
    },
    analytics: {
      name: 'Analyse-Cookies',
      description: 'Diese Cookies helfen uns, die Nutzung der Website zu verstehen.',
      required: false,
      cookies: ['analytics', 'performance', 'usage-stats']
    },
    marketing: {
      name: 'Marketing-Cookies',
      description: 'Diese Cookies werden für Werbung und Marketing verwendet.',
      required: false,
      cookies: ['advertising', 'social-media', 'tracking']
    }
  }
}
