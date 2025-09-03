/**
 * DSGVO合规的用户身份数据模型
 * 支持匿名使用和可选注册，实现本地存储优先的数据管理策略
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

// 用户身份类型
export type UserType = 'anonymous' | 'registered' | 'enterprise'

// 数据存储位置
export type DataStorageLocation = 'local' | 'cloud' | 'hybrid'

// 隐私级别
export type PrivacyLevel = 'minimal' | 'standard' | 'enhanced'

// 用户同意状态
export interface ConsentStatus {
  analytics: boolean
  marketing: boolean
  functional: boolean
  necessary: boolean // 始终为true，技术必需
  timestamp: Date
  version: string // 隐私政策版本
}

// 匿名用户标识
export interface AnonymousUser {
  id: string // UUID v4，本地生成
  type: 'anonymous'
  createdAt: Date
  lastActiveAt: Date
  sessionCount: number
  preferences: UserPreferences
  consent: ConsentStatus
  // 不存储任何个人身份信息
}

// 注册用户信息
export interface RegisteredUser {
  id: string // UUID v4
  type: 'registered'
  email?: string // 可选，加密存储
  displayName?: string // 可选，用户自定义显示名
  createdAt: Date
  lastActiveAt: Date
  emailVerified: boolean
  preferences: UserPreferences
  consent: ConsentStatus
  profile: UserProfile
  settings: UserSettings
}

// 企业用户信息
export interface EnterpriseUser extends RegisteredUser {
  type: 'enterprise'
  companyName?: string
  vatNumber?: string // 德国增值税号
  billingAddress?: Address
  subscription: SubscriptionInfo
  teamMembers: string[] // 团队成员ID列表
}

// 用户偏好设置
export interface UserPreferences {
  language: 'de' | 'en' // 默认德语
  currency: 'EUR' | 'USD' // 默认欧元
  dateFormat: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  numberFormat: 'de' | 'en' // 德国数字格式 vs 英文格式
  theme: 'light' | 'dark' | 'auto'
  calculatorDefaults: CalculatorDefaults
  notifications: NotificationPreferences
}

// 计算器默认值
export interface CalculatorDefaults {
  compoundInterest: {
    principal?: number
    monthlyPayment?: number
    annualRate?: number
    years?: number
    compoundFrequency?: 'monthly' | 'quarterly' | 'annually'
  }
  loan: {
    principal?: number
    annualRate?: number
    termYears?: number
    paymentType?: 'annuity' | 'linear'
  }
  mortgage: {
    purchasePrice?: number
    downPayment?: number
    annualRate?: number
    termYears?: number
  }
}

// 通知偏好
export interface NotificationPreferences {
  email: boolean
  browser: boolean
  goalReminders: boolean
  calculationUpdates: boolean
  marketingEmails: boolean
}

// 用户档案
export interface UserProfile {
  avatar?: string // Base64或URL
  bio?: string
  location?: string // 城市/州，不存储精确地址
  occupation?: string
  financialGoals: string[] // 财务目标类型
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  investmentExperience: 'beginner' | 'intermediate' | 'advanced'
}

// 用户设置
export interface UserSettings {
  dataStorage: DataStorageLocation
  privacyLevel: PrivacyLevel
  autoSave: boolean
  dataRetention: number // 数据保留天数
  exportFormat: 'json' | 'csv' | 'pdf'
  twoFactorAuth: boolean
  sessionTimeout: number // 分钟
}

// 地址信息
export interface Address {
  street?: string
  city?: string
  postalCode?: string
  state?: string // 德国州
  country: string // 默认'DE'
}

// 订阅信息
export interface SubscriptionInfo {
  plan: 'free' | 'premium' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  startDate: Date
  endDate?: Date
  autoRenew: boolean
  paymentMethod?: string
}

// 用户联合类型
export type User = AnonymousUser | RegisteredUser | EnterpriseUser

// 用户数据加密配置
export interface EncryptionConfig {
  algorithm: 'AES-256-GCM'
  keyDerivation: 'PBKDF2'
  iterations: number
  saltLength: number
}

// DSGVO数据处理记录
export interface DataProcessingRecord {
  userId: string
  action: 'create' | 'read' | 'update' | 'delete' | 'export'
  dataType: string
  timestamp: Date
  purpose: string
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'legitimate_interest'
  retention: number // 保留天数
}

// 数据导出请求
export interface DataExportRequest {
  userId: string
  requestDate: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  format: 'json' | 'csv' | 'pdf'
  downloadUrl?: string
  expiresAt?: Date
}

// 数据删除请求
export interface DataDeletionRequest {
  userId: string
  requestDate: Date
  scheduledDate: Date // 30天后执行
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled'
  reason?: string
}

// 用户验证令牌
export interface UserToken {
  userId: string
  token: string
  type: 'email_verification' | 'password_reset' | 'two_factor'
  expiresAt: Date
  used: boolean
}

// 用户会话信息
export interface UserSession {
  sessionId: string
  userId: string
  deviceInfo: DeviceInfo
  ipAddress?: string // 可选，根据隐私设置
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
  isActive: boolean
}

// 设备信息
export interface DeviceInfo {
  userAgent: string
  platform: string
  browser: string
  isMobile: boolean
  screenResolution?: string
}

// 用户活动日志
export interface UserActivity {
  userId: string
  sessionId: string
  action: string
  resource: string
  timestamp: Date
  metadata?: Record<string, any>
}

// 隐私设置更新历史
export interface PrivacySettingsHistory {
  userId: string
  previousSettings: ConsentStatus
  newSettings: ConsentStatus
  changedAt: Date
  ipAddress?: string
  userAgent?: string
}

// 用户数据统计
export interface UserDataStats {
  userId: string
  totalCalculations: number
  totalSavedResults: number
  totalGoals: number
  dataSize: number // 字节
  lastBackup?: Date
  storageLocation: DataStorageLocation
}
