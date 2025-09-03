/**
 * 用户身份数据模型类型定义
 * 符合DSGVO要求的用户数据结构和接口
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

// ============================================================================
// 基础类型定义
// ============================================================================

/**
 * 数据版本标识符
 * 用于数据迁移和向后兼容性管理
 */
export type DataVersion = '1.0' | '1.1' | '1.2'

/**
 * 用户类型枚举
 */
export type UserType = 'anonymous' | 'registered'

/**
 * 数据处理目的枚举
 * 符合DSGVO第5条目的限制原则
 */
export type DataProcessingPurpose =
  | 'calculation_history'    // 计算历史存储
  | 'user_preferences'       // 用户偏好设置
  | 'cross_device_sync'      // 跨设备同步
  | 'analytics'              // 匿名化分析
  | 'performance_monitoring' // 性能监控

/**
 * 同意状态枚举
 */
export type ConsentStatus = 'granted' | 'denied' | 'pending' | 'withdrawn'

// ============================================================================
// 核心用户接口
// ============================================================================

/**
 * 基础用户接口
 * 所有用户类型的共同属性
 */
export interface BaseUser {
  /** 用户唯一标识符 (UUID v4) */
  readonly id: string

  /** 用户类型 */
  readonly type: UserType

  /** 创建时间 */
  readonly createdAt: Date

  /** 最后活跃时间 */
  lastActiveAt: Date

  /** 数据模型版本 */
  readonly dataVersion: DataVersion

  /** 用户偏好设置 */
  preferences: UserPreferences

  /** 同意设置 */
  consentSettings: ConsentSettings
}

/**
 * 匿名用户接口
 * 本地存储，无个人标识信息
 */
export interface AnonymousUser extends BaseUser {
  readonly type: 'anonymous'

  /** 设备指纹 (用于本地识别，不包含个人信息) */
  readonly deviceFingerprint: string

  /** 设备信息 (匿名化) */
  readonly deviceInfo: DeviceInfo
}

/**
 * 注册用户接口
 * 最小化个人数据收集
 */
export interface RegisteredUser extends Omit<AnonymousUser, 'type'> {
  readonly type: 'registered'

  /** 邮箱地址 (可选，用于同步) */
  email?: string

  /** 邮箱验证状态 */
  emailVerified: boolean

  /** 注册时间 */
  readonly registrationDate: Date

  /** 跨设备同步启用状态 */
  syncEnabled: boolean

  /** 同步设置 */
  syncSettings: SyncSettings
}

// ============================================================================
// 用户偏好和设置
// ============================================================================

/**
 * 用户偏好设置接口
 */
export interface UserPreferences {
  /** 界面语言 (固定为德语) */
  readonly language: 'de'

  /** 货币单位 (固定为欧元) */
  readonly currency: 'EUR'

  /** 主题设置 */
  theme: 'light' | 'dark' | 'auto'

  /** 数字格式 */
  numberFormat: 'de-DE'

  /** 日期格式 */
  dateFormat: 'DD.MM.YYYY'

  /** 通知设置 */
  notifications: NotificationSettings

  /** 隐私设置 */
  privacy: PrivacySettings

  /** 默认计算器 */
  defaultCalculator?: string

  /** 自动保存设置 */
  autoSave: boolean

  /** 数据保留天数 */
  dataRetentionDays: number
}

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  /** 浏览器通知 */
  browser: boolean

  /** 邮件通知 (仅注册用户) */
  email: boolean

  /** 目标提醒 */
  goalReminders: boolean

  /** 数据清理提醒 */
  dataCleanupReminders: boolean

  /** 更新通知 */
  updateNotifications: boolean
}

/**
 * 隐私设置接口
 */
export interface PrivacySettings {
  /** 数据收集级别 */
  dataCollection: 'minimal' | 'functional' | 'enhanced'

  /** 分析数据收集 */
  analytics: boolean

  /** 性能监控 */
  performanceMonitoring: boolean

  /** 错误报告 */
  errorReporting: boolean

  /** 使用统计 */
  usageStatistics: boolean
}

// ============================================================================
// 同意管理
// ============================================================================

/**
 * 同意设置接口
 * 符合DSGVO第7条同意条件
 */
export interface ConsentSettings {
  /** 同意记录版本 */
  readonly version: string

  /** 同意给予时间 */
  readonly consentDate: Date

  /** 最后更新时间 */
  lastUpdated: Date

  /** 功能性数据处理同意 */
  functional: ConsentRecord

  /** 分析数据处理同意 */
  analytics: ConsentRecord

  /** 营销数据处理同意 */
  marketing: ConsentRecord

  /** 跨设备同步同意 (仅注册用户) */
  crossDeviceSync?: ConsentRecord
}

/**
 * 单项同意记录接口
 */
export interface ConsentRecord {
  /** 同意状态 */
  status: ConsentStatus

  /** 同意/拒绝时间 */
  timestamp: Date

  /** 同意来源 */
  source: 'initial_setup' | 'settings_change' | 'privacy_update'

  /** 法律依据 */
  legalBasis: 'consent' | 'legitimate_interest' | 'contract'

  /** 处理目的 */
  purposes: DataProcessingPurpose[]

  /** 数据保留期限 (天数) */
  retentionPeriod: number
}

// ============================================================================
// 设备和同步
// ============================================================================

/**
 * 设备信息接口 (匿名化)
 */
export interface DeviceInfo {
  /** 设备类型 */
  type: 'desktop' | 'tablet' | 'mobile'

  /** 操作系统类型 */
  os: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'other'

  /** 浏览器类型 */
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'other'

  /** 屏幕分辨率类别 */
  screenSize: 'small' | 'medium' | 'large' | 'xlarge'

  /** 时区 */
  timezone: string

  /** 首选语言 */
  locale: string
}

/**
 * 同步设置接口
 */
export interface SyncSettings {
  /** 同步启用状态 */
  enabled: boolean

  /** 最后同步时间 */
  lastSyncAt?: Date

  /** 同步频率 */
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly'

  /** 同步数据类型 */
  dataTypes: {
    preferences: boolean
    calculationHistory: boolean
    goals: boolean
    favorites: boolean
  }

  /** 冲突解决策略 */
  conflictResolution: 'local_wins' | 'remote_wins' | 'latest_wins' | 'manual'

  /** 最大同步设备数 */
  maxDevices: number
}

// ============================================================================
// 验证和错误处理
// ============================================================================

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 验证是否通过 */
  isValid: boolean

  /** 错误信息列表 */
  errors: ValidationError[]

  /** 警告信息列表 */
  warnings: ValidationWarning[]
}

/**
 * 验证错误接口
 */
export interface ValidationError {
  /** 错误字段 */
  field: string

  /** 错误代码 */
  code: string

  /** 错误消息 (德语) */
  message: string

  /** 错误详情 */
  details?: Record<string, unknown>
}

/**
 * 验证警告接口
 */
export interface ValidationWarning {
  /** 警告字段 */
  field: string

  /** 警告代码 */
  code: string

  /** 警告消息 (德语) */
  message: string

  /** 建议操作 */
  suggestion?: string
}

// ============================================================================
// 数据迁移
// ============================================================================

/**
 * 数据迁移接口
 */
export interface DataMigration {
  /** 源版本 */
  fromVersion: DataVersion

  /** 目标版本 */
  toVersion: DataVersion

  /** 迁移函数 */
  migrate: (data: unknown) => Promise<unknown>

  /** 验证函数 */
  validate: (data: unknown) => Promise<ValidationResult>

  /** 回滚函数 */
  rollback?: (data: unknown) => Promise<unknown>
}

/**
 * 迁移结果接口
 */
export interface MigrationResult {
  /** 迁移是否成功 */
  success: boolean

  /** 源版本 */
  fromVersion: DataVersion

  /** 目标版本 */
  toVersion: DataVersion

  /** 迁移时间 */
  migratedAt: Date

  /** 错误信息 */
  error?: string

  /** 迁移统计 */
  stats: {
    recordsProcessed: number
    recordsMigrated: number
    recordsFailed: number
    duration: number
  }
}

// ============================================================================
// 类型守卫和工具类型
// ============================================================================

/**
 * 检查是否为匿名用户
 */
export function isAnonymousUser(user: BaseUser): user is AnonymousUser {
  return user.type === 'anonymous'
}

/**
 * 检查是否为注册用户
 */
export function isRegisteredUser(user: BaseUser): user is RegisteredUser {
  return user.type === 'registered'
}

/**
 * 用户联合类型
 */
export type User = AnonymousUser | RegisteredUser

/**
 * 用户创建参数类型
 */
export type CreateUserParams<T extends UserType> = T extends 'anonymous'
  ? Omit<AnonymousUser, 'id' | 'type' | 'createdAt' | 'lastActiveAt' | 'dataVersion'>
  : Omit<RegisteredUser, 'id' | 'type' | 'createdAt' | 'lastActiveAt' | 'dataVersion' | 'registrationDate'>

/**
 * 用户更新参数类型
 */
export type UpdateUserParams = Partial<Pick<BaseUser, 'preferences' | 'consentSettings'>> & {
  email?: string
  syncEnabled?: boolean
  syncSettings?: Partial<SyncSettings>
}

// ============================================================================
// 常量定义
// ============================================================================

/**
 * DSGVO合规常量
 */
export const DSGVO_CONSTANTS = {
  /** 默认数据保留期限 (天数) */
  DEFAULT_RETENTION_DAYS: 365,

  /** 最大数据保留期限 (天数) */
  MAX_RETENTION_DAYS: 1095, // 3年

  /** 最小数据保留期限 (天数) */
  MIN_RETENTION_DAYS: 30,

  /** 同意记录版本 */
  CONSENT_VERSION: '1.0',

  /** 数据模型当前版本 */
  CURRENT_DATA_VERSION: '1.0' as DataVersion,

  /** 支持的数据版本列表 */
  SUPPORTED_VERSIONS: ['1.0'] as DataVersion[],

  /** 设备指纹最大长度 */
  MAX_DEVICE_FINGERPRINT_LENGTH: 256,

  /** 邮箱最大长度 */
  MAX_EMAIL_LENGTH: 254,

  /** 最大同步设备数 */
  MAX_SYNC_DEVICES: 5
} as const

/**
 * 默认用户偏好设置
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: 'de',
  currency: 'EUR',
  theme: 'auto',
  numberFormat: 'de-DE',
  dateFormat: 'DD.MM.YYYY',
  notifications: {
    browser: true,
    email: false,
    goalReminders: true,
    dataCleanupReminders: true,
    updateNotifications: true
  },
  privacy: {
    dataCollection: 'functional',
    analytics: false,
    performanceMonitoring: true,
    errorReporting: true,
    usageStatistics: false
  },
  autoSave: true,
  dataRetentionDays: DSGVO_CONSTANTS.DEFAULT_RETENTION_DAYS
}

/**
 * 默认同意设置
 */
export const DEFAULT_CONSENT_SETTINGS: ConsentSettings = {
  version: DSGVO_CONSTANTS.CONSENT_VERSION,
  consentDate: new Date(),
  lastUpdated: new Date(),
  functional: {
    status: 'granted',
    timestamp: new Date(),
    source: 'initial_setup',
    legalBasis: 'legitimate_interest',
    purposes: ['calculation_history', 'user_preferences'],
    retentionPeriod: DSGVO_CONSTANTS.DEFAULT_RETENTION_DAYS
  },
  analytics: {
    status: 'denied',
    timestamp: new Date(),
    source: 'initial_setup',
    legalBasis: 'consent',
    purposes: ['analytics'],
    retentionPeriod: 90
  },
  marketing: {
    status: 'denied',
    timestamp: new Date(),
    source: 'initial_setup',
    legalBasis: 'consent',
    purposes: [],
    retentionPeriod: 0
  }
}

/**
 * 默认同步设置
 */
export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  enabled: false,
  frequency: 'manual',
  dataTypes: {
    preferences: true,
    calculationHistory: true,
    goals: true,
    favorites: true
  },
  conflictResolution: 'latest_wins',
  maxDevices: DSGVO_CONSTANTS.MAX_SYNC_DEVICES
}

// ============================================================================
// 错误代码常量
// ============================================================================

/**
 * 验证错误代码
 */
export const VALIDATION_ERROR_CODES = {
  // 用户ID相关
  INVALID_USER_ID: 'INVALID_USER_ID',
  USER_ID_REQUIRED: 'USER_ID_REQUIRED',
  USER_ID_FORMAT_INVALID: 'USER_ID_FORMAT_INVALID',

  // 邮箱相关
  INVALID_EMAIL: 'INVALID_EMAIL',
  EMAIL_TOO_LONG: 'EMAIL_TOO_LONG',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',

  // 设备指纹相关
  INVALID_DEVICE_FINGERPRINT: 'INVALID_DEVICE_FINGERPRINT',
  DEVICE_FINGERPRINT_TOO_LONG: 'DEVICE_FINGERPRINT_TOO_LONG',

  // 数据保留相关
  INVALID_RETENTION_PERIOD: 'INVALID_RETENTION_PERIOD',
  RETENTION_PERIOD_TOO_SHORT: 'RETENTION_PERIOD_TOO_SHORT',
  RETENTION_PERIOD_TOO_LONG: 'RETENTION_PERIOD_TOO_LONG',

  // 同意相关
  INVALID_CONSENT_STATUS: 'INVALID_CONSENT_STATUS',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  CONSENT_WITHDRAWN: 'CONSENT_WITHDRAWN',

  // 同步相关
  SYNC_DEVICE_LIMIT_EXCEEDED: 'SYNC_DEVICE_LIMIT_EXCEEDED',
  SYNC_CONFLICT_DETECTED: 'SYNC_CONFLICT_DETECTED',

  // 数据迁移相关
  MIGRATION_FAILED: 'MIGRATION_FAILED',
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  DATA_CORRUPTION_DETECTED: 'DATA_CORRUPTION_DETECTED'
} as const

/**
 * 德语错误消息映射
 */
export const ERROR_MESSAGES_DE: Record<string, string> = {
  [VALIDATION_ERROR_CODES.INVALID_USER_ID]: 'Ungültige Benutzer-ID',
  [VALIDATION_ERROR_CODES.USER_ID_REQUIRED]: 'Benutzer-ID ist erforderlich',
  [VALIDATION_ERROR_CODES.USER_ID_FORMAT_INVALID]: 'Benutzer-ID Format ist ungültig',

  [VALIDATION_ERROR_CODES.INVALID_EMAIL]: 'Ungültige E-Mail-Adresse',
  [VALIDATION_ERROR_CODES.EMAIL_TOO_LONG]: 'E-Mail-Adresse ist zu lang',
  [VALIDATION_ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'E-Mail-Adresse bereits vorhanden',

  [VALIDATION_ERROR_CODES.INVALID_DEVICE_FINGERPRINT]: 'Ungültiger Geräte-Fingerabdruck',
  [VALIDATION_ERROR_CODES.DEVICE_FINGERPRINT_TOO_LONG]: 'Geräte-Fingerabdruck ist zu lang',

  [VALIDATION_ERROR_CODES.INVALID_RETENTION_PERIOD]: 'Ungültige Aufbewahrungsdauer',
  [VALIDATION_ERROR_CODES.RETENTION_PERIOD_TOO_SHORT]: 'Aufbewahrungsdauer ist zu kurz',
  [VALIDATION_ERROR_CODES.RETENTION_PERIOD_TOO_LONG]: 'Aufbewahrungsdauer ist zu lang',

  [VALIDATION_ERROR_CODES.INVALID_CONSENT_STATUS]: 'Ungültiger Einverständnisstatus',
  [VALIDATION_ERROR_CODES.CONSENT_REQUIRED]: 'Einverständnis erforderlich',
  [VALIDATION_ERROR_CODES.CONSENT_WITHDRAWN]: 'Einverständnis wurde zurückgezogen',

  [VALIDATION_ERROR_CODES.SYNC_DEVICE_LIMIT_EXCEEDED]: 'Maximale Anzahl von Synchronisationsgeräten überschritten',
  [VALIDATION_ERROR_CODES.SYNC_CONFLICT_DETECTED]: 'Synchronisationskonflikt erkannt',

  [VALIDATION_ERROR_CODES.MIGRATION_FAILED]: 'Datenmigration fehlgeschlagen',
  [VALIDATION_ERROR_CODES.UNSUPPORTED_VERSION]: 'Nicht unterstützte Datenversion',
  [VALIDATION_ERROR_CODES.DATA_CORRUPTION_DETECTED]: 'Datenkorruption erkannt'
}
