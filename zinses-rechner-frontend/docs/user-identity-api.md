# 用户身份数据模型 API 文档

## 概述

本文档描述了符合DSGVO要求的用户身份数据模型的完整API接口和使用方法。

## 核心接口

### BaseUser

所有用户类型的基础接口。

```typescript
interface BaseUser {
  readonly id: string           // UUID v4格式的用户唯一标识符
  readonly type: UserType       // 用户类型：'anonymous' | 'registered'
  readonly createdAt: Date      // 用户创建时间
  lastActiveAt: Date           // 最后活跃时间
  readonly dataVersion: DataVersion  // 数据模型版本
  preferences: UserPreferences  // 用户偏好设置
  consentSettings: ConsentSettings  // 同意设置
}
```

### AnonymousUser

匿名用户接口，继承自BaseUser。

```typescript
interface AnonymousUser extends BaseUser {
  readonly type: 'anonymous'
  readonly deviceFingerprint: string  // 设备指纹（匿名化）
  readonly deviceInfo: DeviceInfo     // 设备信息（匿名化）
}
```

### RegisteredUser

注册用户接口，继承自AnonymousUser（除type字段）。

```typescript
interface RegisteredUser extends Omit<AnonymousUser, 'type'> {
  readonly type: 'registered'
  email?: string                    // 邮箱地址（可选）
  emailVerified: boolean           // 邮箱验证状态
  readonly registrationDate: Date  // 注册时间
  syncEnabled: boolean            // 同步启用状态
  syncSettings: SyncSettings      // 同步设置
}
```

## 工具函数

### 用户创建

#### createAnonymousUser()

创建新的匿名用户。

```typescript
function createAnonymousUser(
  overrides?: Partial<Omit<AnonymousUser, 'id' | 'type' | 'createdAt' | 'lastActiveAt' | 'dataVersion'>>
): AnonymousUser
```

**示例：**
```typescript
const user = createAnonymousUser()
console.log(user.id) // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
console.log(user.type) // "anonymous"
```

#### upgradeToRegisteredUser()

将匿名用户升级为注册用户。

```typescript
function upgradeToRegisteredUser(
  anonymousUser: AnonymousUser,
  email: string,
  overrides?: Partial<Omit<RegisteredUser, keyof AnonymousUser | 'registrationDate'>>
): RegisteredUser
```

**示例：**
```typescript
const anonymousUser = createAnonymousUser()
const registeredUser = upgradeToRegisteredUser(anonymousUser, 'user@example.de')
console.log(registeredUser.email) // "user@example.de"
console.log(registeredUser.type) // "registered"
```

### 数据验证

#### validateBaseUser()

验证基础用户数据的完整性和合规性。

```typescript
function validateBaseUser(user: BaseUser): ValidationResult
```

#### validateAnonymousUser()

验证匿名用户数据。

```typescript
function validateAnonymousUser(user: AnonymousUser): ValidationResult
```

#### validateRegisteredUser()

验证注册用户数据。

```typescript
function validateRegisteredUser(user: RegisteredUser): ValidationResult
```

**ValidationResult 结构：**
```typescript
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}
```

### 同意管理

#### hasConsentForPurpose()

检查用户是否同意特定数据处理目的。

```typescript
function hasConsentForPurpose(
  user: User,
  purpose: DataProcessingPurpose
): boolean
```

**支持的处理目的：**
- `calculation_history` - 计算历史存储
- `user_preferences` - 用户偏好设置
- `cross_device_sync` - 跨设备同步
- `analytics` - 匿名化分析
- `performance_monitoring` - 性能监控

**示例：**
```typescript
const user = createAnonymousUser()
const canStoreHistory = hasConsentForPurpose(user, 'calculation_history')
console.log(canStoreHistory) // true (默认同意功能性数据处理)
```

#### updateConsent()

更新用户的同意状态。

```typescript
function updateConsent<T extends User>(
  user: T,
  consentType: keyof ConsentSettings,
  status: ConsentStatus,
  source?: ConsentRecord['source']
): T
```

### 数据安全

#### anonymizeUserData()

匿名化用户数据，移除所有个人标识信息。

```typescript
function anonymizeUserData(user: User): Record<string, unknown>
```

#### validateUserDataIntegrity()

检查用户数据的完整性和一致性。

```typescript
function validateUserDataIntegrity(user: User): ValidationResult
```

### 数据转换

#### serializeUser()

将用户对象序列化为JSON字符串。

```typescript
function serializeUser(user: User): string
```

#### deserializeUser()

从JSON字符串反序列化用户对象。

```typescript
function deserializeUser(json: string): User
```

#### cloneUser()

深度克隆用户对象。

```typescript
function cloneUser<T extends User>(user: T): T
```

## 常量和配置

### DSGVO_CONSTANTS

DSGVO合规相关常量。

```typescript
const DSGVO_CONSTANTS = {
  DEFAULT_RETENTION_DAYS: 365,    // 默认数据保留期限
  MAX_RETENTION_DAYS: 1095,       // 最大数据保留期限（3年）
  MIN_RETENTION_DAYS: 30,         // 最小数据保留期限
  CONSENT_VERSION: '1.0',         // 同意记录版本
  CURRENT_DATA_VERSION: '1.0',    // 当前数据模型版本
  MAX_DEVICE_FINGERPRINT_LENGTH: 256,  // 设备指纹最大长度
  MAX_EMAIL_LENGTH: 254,          // 邮箱最大长度
  MAX_SYNC_DEVICES: 5             // 最大同步设备数
}
```

### 默认设置

#### DEFAULT_USER_PREFERENCES

默认用户偏好设置。

```typescript
const DEFAULT_USER_PREFERENCES: UserPreferences = {
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
  dataRetentionDays: 365
}
```

## 错误处理

### 错误代码

所有验证错误都使用预定义的错误代码：

```typescript
const VALIDATION_ERROR_CODES = {
  INVALID_USER_ID: 'INVALID_USER_ID',
  USER_ID_REQUIRED: 'USER_ID_REQUIRED',
  USER_ID_FORMAT_INVALID: 'USER_ID_FORMAT_INVALID',
  INVALID_EMAIL: 'INVALID_EMAIL',
  EMAIL_TOO_LONG: 'EMAIL_TOO_LONG',
  INVALID_DEVICE_FINGERPRINT: 'INVALID_DEVICE_FINGERPRINT',
  INVALID_RETENTION_PERIOD: 'INVALID_RETENTION_PERIOD',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  SYNC_DEVICE_LIMIT_EXCEEDED: 'SYNC_DEVICE_LIMIT_EXCEEDED',
  // ... 更多错误代码
}
```

### 德语错误消息

所有错误消息都提供德语本地化：

```typescript
const ERROR_MESSAGES_DE: Record<string, string> = {
  INVALID_USER_ID: 'Ungültige Benutzer-ID',
  INVALID_EMAIL: 'Ungültige E-Mail-Adresse',
  CONSENT_REQUIRED: 'Einverständnis erforderlich',
  // ... 更多德语消息
}
```

## 使用示例

### 基本用法

```typescript
import { 
  createAnonymousUser, 
  upgradeToRegisteredUser,
  hasConsentForPurpose,
  validateUserDataIntegrity 
} from '@/utils/user-identity-utils'

// 1. 创建匿名用户
const anonymousUser = createAnonymousUser()

// 2. 检查同意状态
if (hasConsentForPurpose(anonymousUser, 'calculation_history')) {
  // 可以保存计算历史
  console.log('可以保存计算历史')
}

// 3. 升级为注册用户
const registeredUser = upgradeToRegisteredUser(anonymousUser, 'user@example.de')

// 4. 验证数据完整性
const validation = validateUserDataIntegrity(registeredUser)
if (!validation.isValid) {
  console.error('数据验证失败:', validation.errors)
}
```

### 高级用法

```typescript
import { 
  updateConsent,
  anonymizeUserData,
  needsDataCleanup,
  getDataExpirationDate 
} from '@/utils/user-identity-utils'

// 更新同意状态
const updatedUser = updateConsent(user, 'analytics', 'granted')

// 检查是否需要数据清理
if (needsDataCleanup(user)) {
  const expirationDate = getDataExpirationDate(user)
  console.log(`数据将在 ${expirationDate.toLocaleDateString('de-DE')} 过期`)
}

// 匿名化数据用于分析
const anonymizedData = anonymizeUserData(user)
console.log('匿名化数据:', anonymizedData)
```

## DSGVO 合规性

本数据模型完全符合DSGVO要求：

- ✅ **数据最小化** - 只收集必要的数据
- ✅ **目的限制** - 明确定义数据使用目的
- ✅ **存储限制** - 自动数据过期和清理
- ✅ **透明度** - 用户可查看所有数据
- ✅ **用户控制** - 用户可修改和删除数据
- ✅ **同意管理** - 细粒度的同意控制
- ✅ **数据可携带** - 支持数据导出

## 最佳实践

1. **始终验证用户数据**
   ```typescript
   const validation = validateUserDataIntegrity(user)
   if (!validation.isValid) {
     // 处理验证错误
   }
   ```

2. **定期检查数据保留期限**
   ```typescript
   if (needsDataCleanup(user)) {
     // 提醒用户或自动清理数据
   }
   ```

3. **遵循DSGVO合规要求**
   ```typescript
   // 检查同意状态
   if (!hasConsentForPurpose(user, 'analytics')) {
     // 不收集分析数据
   }
   ```

4. **安全处理敏感数据**
   ```typescript
   // 匿名化数据用于分析
   const safeData = anonymizeUserData(user)
   ```
